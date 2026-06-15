# CupOracle 官网 PWA 支持 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 `packages/website` 增加完整 PWA 能力（manifest + 离线 + 推送 + 快捷方式），并扩展 `packages/service` 提供推送后端。

**Architecture:** 客户端纯静态资源（`public/sw.js`、`public/manifest.webmanifest`、多尺寸 PNG 图标）+ 2 个新 React 组件（`SwRegistrar` 客户端注册、`NotificationBell` 订阅开关）。推送后端复用 `packages/service` (Cloudflare Workers + Hono)，新增 4 个端点 + 2 张 D1 表（`push_subscriptions` + `push_recent` 去重）。触发点：`scripts/sync.mjs` 同步完成末尾调用一次 `/internal/push/broadcast`，由它遍历 D1 未结束比赛生成通知（`tag = match-<id>` + 10 分钟去重避免重复）。

**Tech Stack:**
- Website: Next.js 14.2.x, React 18, edge runtime, Tailwind, **手写 Service Worker**（无 Workbox）
- Service: Cloudflare Workers, Hono, D1, `web-push` npm
- 图标生成: `sharp` (devDep)

**Project context:**
- Monorepo 根: `/Volumes/Extension/song52wow/world-cup/cuporacle/`
- Website pkg: `packages/website/`
- Service pkg: `packages/service/`
- D1 database_name=`cuporacle`, database_id=`7e4b4248-f9e6-4c10-a03f-0fed2e7cf4c3` (D1 binding `DB` 已在 `service/wrangler.toml` 配好)
- Sync 脚本: `packages/service/scripts/sync.mjs`（全量 DELETE+INSERT，用 `Bearer SYNC_SECRET` 调 `/internal/sync`）
- 基线 tag: `v0.1.0-pre-pwa`

**Test strategy note:** 项目无 CI 框架（详见 `CLAUDE.md`）。本计划为客户端代码用手动验证（Chrome DevTools + 真机 + Lighthouse），为 service 路由用 vitest 单测（已能加，service 端不依赖浏览器 API）。每个任务结尾有显式"验证步骤"，在 commit 前必须通过。

**Spec:** `docs/superpowers/specs/2026-06-15-pwa-support-design.md` (commit `7821fea`)

---

## 文件结构总览

### 新增文件（website）
- `packages/website/public/manifest.webmanifest` — W3C manifest
- `packages/website/public/sw.js` — 手写 SW
- `packages/website/public/offline.html` — 离线兜底页
- `packages/website/public/icon-192.png` — 192×192
- `packages/website/public/icon-512.png` — 512×512
- `packages/website/public/icon-maskable-512.png` — 512×512 maskable
- `packages/website/public/badge-72.png` — 通知角标 72×72
- `packages/website/public/apple-touch-icon.png` — iOS 180×180
- `packages/website/components/SwRegistrar.tsx` — 客户端注册 SW
- `packages/website/components/NotificationBell.tsx` — 订阅开关 UI
- `packages/website/lib/push.ts` — 客户端 Web Push 封装
- `packages/website/scripts/generate-pwa-icons.mjs` — 一次性图标生成

### 修改文件（website）
- `packages/website/app/layout.tsx` — 加 manifest link / iOS meta / `<SwRegistrar/>`
- `packages/website/components/SiteHeader.tsx` — 头部右侧加 `<NotificationBell/>`
- `packages/website/wrangler.toml` — `[vars] NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `packages/website/package.json` — `sharp` devDep + `icons:gen` 脚本

### 新增文件（service）
- `packages/service/src/push.ts` — VAPID 签名 + web-push 封装
- `packages/service/src/push-handlers.ts` — Hono 4 个路由
- `packages/service/src/push.test.ts` — vitest 单测
- `packages/service/migrations/0004_push_subscriptions.sql` — D1 DDL

### 修改文件（service）
- `packages/service/src/index.ts` — 挂载 push 路由
- `packages/service/src/types.ts` — 加 subscription / broadcast payload 类型
- `packages/service/package.json` — 加 `web-push` + `vitest` 依赖 + `test` 脚本
- `packages/service/scripts/sync.mjs` — 同步完成后调用 broadcast

---

## Task 1: 生成 PWA 图标资源

**Files:**
- Create: `packages/website/scripts/generate-pwa-icons.mjs`
- Create: `packages/website/public/icon-192.png`
- Create: `packages/website/public/icon-512.png`
- Create: `packages/website/public/icon-maskable-512.png`
- Create: `packages/website/public/badge-72.png`
- Create: `packages/website/public/apple-touch-icon.png`
- Modify: `packages/website/package.json`（加 `sharp` devDep + `icons:gen` 脚本）

- [ ] **Step 1: 在 website package.json 加 sharp 依赖和脚本**

在 `packages/website/package.json` 中：

在 `devDependencies` 块添加（按字母序插入到 `postcss` 之前）:

```json
    "sharp": "^0.33.5",
```

在 `scripts` 块添加（在 `pages:dev` 后）:

```json
    "icons:gen": "node scripts/generate-pwa-icons.mjs",
```

- [ ] **Step 2: 安装依赖**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle && npm install`
Expected: 安装 sharp 无错误（无 `peer dep` 冲突）。如出现 `EBADENGINE` 警告可忽略。

- [ ] **Step 3: 创建图标生成脚本**

Create: `packages/website/scripts/generate-pwa-icons.mjs`

```javascript
// 把 public/icon.svg 光栅化成 5 个 PWA 需要的 PNG 尺寸。
// 用法: npm run icons:gen
// 一次性脚本；可重复跑,产物会被覆盖。

import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "../public");

// 徽章必须是单色 + 透明背景,不能有渐变
async function makeBadge(svg, size) {
  return sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .grayscale() // 转灰度,Android 会再着色
    .png()
    .toBuffer();
}

async function main() {
  const svgRaw = await readFile(resolve(PUBLIC, "icon.svg"), "utf8");
  const buf = Buffer.from(svgRaw);

  // 标准 PWA icon
  await sharp(buf).resize(192, 192).png().toFile(resolve(PUBLIC, "icon-192.png"));
  await sharp(buf).resize(512, 512).png().toFile(resolve(PUBLIC, "icon-512.png"));
  // maskable: 周围留 12.5% safe zone,中间 80% 是可见区域
  // 做法:在原 SVG 外面包一层 viewBox,把 logo 缩小到 80%
  const inner = svgRaw.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1];
  const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner.replace(/width="[^"]*"/, 'width="80"').replace(/height="[^"]*"/, 'height="80" x="10" y="10"')}</svg>`;
  await sharp(Buffer.from(maskable)).resize(512, 512).png().toFile(resolve(PUBLIC, "icon-maskable-512.png"));

  // iOS apple-touch-icon (180x180, 不带 alpha,白底)
  await sharp(buf).resize(180, 180).flatten({ background: "#0a0a14" }).png().toFile(resolve(PUBLIC, "apple-touch-icon.png"));

  // 通知 badge
  await makeBadge(svgRaw, 72).then((b) => sharp(b).toFile(resolve(PUBLIC, "badge-72.png")));

  console.log("✅ Generated 5 PWA icons in public/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: 运行脚本生成图标**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && npm run icons:gen`
Expected:
```
✅ Generated 5 PWA icons in public/
```

- [ ] **Step 5: 验证产物**

Run: `ls -la /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website/public/*.png`
Expected: 列出 5 个 PNG 文件,每个大小 > 0 字节（非 0 字节,合理 1-50KB）。

- [ ] **Step 6: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/scripts/generate-pwa-icons.mjs \
        packages/website/public/icon-192.png \
        packages/website/public/icon-512.png \
        packages/website/public/icon-maskable-512.png \
        packages/website/public/badge-72.png \
        packages/website/public/apple-touch-icon.png \
        packages/website/package.json
git commit -m "feat(website): generate PWA icons (192/512/maskable/badge/apple-touch)"
```

---

## Task 2: 创建 manifest.webmanifest

**Files:**
- Create: `packages/website/public/manifest.webmanifest`

- [ ] **Step 1: 创建 manifest 文件**

Create: `packages/website/public/manifest.webmanifest`

```json
{
  "name": "CupOracle · 2026 世界杯 AI 预测",
  "short_name": "CupOracle",
  "description": "基于多模型 LLM 的 2026 世界杯胜负、概率与比分预测",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a14",
  "theme_color": "#0a0a14",
  "lang": "zh-CN",
  "dir": "ltr",
  "categories": ["sports", "news", "productivity"],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "全部赛事",
      "short_name": "赛事",
      "description": "浏览全部 104 场赛事预测",
      "url": "/matches",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    },
    {
      "name": "今日比赛",
      "short_name": "今日",
      "description": "查看今天的所有比赛",
      "url": "/matches?status=IN_PLAY",
      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 合法**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && node -e "JSON.parse(require('fs').readFileSync('public/manifest.webmanifest','utf8')); console.log('valid JSON')"`
Expected: `valid JSON`

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/public/manifest.webmanifest
git commit -m "feat(website): add PWA manifest with shortcuts"
```

---

## Task 3: 创建离线兜底页 offline.html

**Files:**
- Create: `packages/website/public/offline.html`

- [ ] **Step 1: 创建离线页**

Create: `packages/website/public/offline.html`

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>离线 · CupOracle</title>
  <meta name="theme-color" content="#0a0a14">
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", sans-serif;
      background:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(168, 85, 247, 0.18), transparent 60%),
        linear-gradient(180deg, #07070f 0%, #0a0a14 100%);
      color: #e7e7f0;
    }
    .card {
      max-width: 24rem;
      padding: 2rem;
      border-radius: 1rem;
      background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%);
      backdrop-filter: blur(12px) saturate(140%);
      border: 1px solid rgba(255,255,255,0.08);
      text-align: center;
    }
    h1 { margin: 0 0 .5rem; font-size: 1.5rem; font-weight: 600; }
    p  { margin: 0 0 1.5rem; color: #8a8aa8; font-size: .9rem; line-height: 1.5; }
    button {
      appearance: none; border: 0; cursor: pointer;
      padding: .6rem 1.2rem; border-radius: 999px;
      font-size: .9rem; font-weight: 500;
      color: #0a0a14;
      background: linear-gradient(135deg, #22d3ee 0%, #a855f7 100%);
      box-shadow: 0 0 24px -6px rgba(34, 211, 238, 0.5);
    }
    button:active { transform: translateY(1px); }
  </style>
</head>
<body>
  <main class="card">
    <h1>当前离线</h1>
    <p>你浏览过的赛事仍然可见。检查网络后,点击下方按钮重试。</p>
    <button onclick="location.reload()">重新加载</button>
  </main>
</body>
</html>
```

- [ ] **Step 2: 验证文件可访问**

Run: `ls -la /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website/public/offline.html && head -1 /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website/public/offline.html`
Expected: 文件存在,首行是 `<!doctype html>`。

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/public/offline.html
git commit -m "feat(website): add PWA offline fallback page"
```

---

## Task 4: 创建 SwRegistrar 客户端组件

**Files:**
- Create: `packages/website/components/SwRegistrar.tsx`

- [ ] **Step 1: 创建组件**

Create: `packages/website/components/SwRegistrar.tsx`

```tsx
"use client";

// 客户端组件:在浏览器加载时注册 Service Worker。
// 必须放成独立组件,避免污染 server layout。
// 注册失败时静默 — manifest 和 iOS meta 仍能生效,主页面不受影响。

import { useEffect } from "react";

export function SwRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // 仅在 HTTPS / localhost 注册
    if (location.protocol !== "https:" && location.hostname !== "localhost") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        // 不打扰用户;DevTools 可见
        console.warn("[pwa] SW registration failed:", err);
      });
  }, []);

  return null;
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && npx tsc --noEmit`
Expected: 无类型错误（exit 0）。

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/components/SwRegistrar.tsx
git commit -m "feat(website): add SwRegistrar client component"
```

---

## Task 5: 在 layout.tsx 注入 PWA 资源

**Files:**
- Modify: `packages/website/app/layout.tsx`

- [ ] **Step 1: 读取当前文件**

Read: `/Volumes/Extension/song52wow/world-cup/cuporacle/packages/website/app/layout.tsx`（已在上下文,见上文 commit `5fbaeeb` 时内容）

文件当前结构（要点）:
- L1-5: imports (`Metadata`, `Viewport`, `localFont`, globals.css, SiteHeader, SiteFooter)
- L20-31: `metadata` export
- L33-37: `viewport` export (`themeColor: "#0a0a14"`)
- L39-58: `RootLayout` 组件

- [ ] **Step 2: 修改 layout.tsx**

在 `app/layout.tsx` 中:

**修改 1**: 把 `import` 块（L1-5）替换为:

```tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SwRegistrar } from "@/components/SwRegistrar";
```

**修改 2**: 把 `metadata` export（L20-31）替换为:

```tsx
export const metadata: Metadata = {
  title: "CupOracle · 世界杯 AI 预测平台",
  description:
    "基于多模型 LLM 的 2026 世界杯胜负、概率与比分预测，覆盖小组赛至决赛的全程赛事追踪。",
  metadataBase: new URL("http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  applicationName: "CupOracle",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CupOracle",
  },
  openGraph: {
    title: "CupOracle · 世界杯 AI 预测平台",
    description:
      "基于多模型 LLM 的 2026 世界杯胜负、概率与比分预测，覆盖小组赛至决赛的全程赛事追踪。",
    type: "website",
  },
};
```

**修改 3**: `RootLayout` 组件内,在 `<script>` 标签后（L51 之后）插入:

```tsx
        <SwRegistrar />
```

完整最终结构（参考,实现时按上面 3 个修改应用即可）:

```tsx
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SwRegistrar } from "@/components/SwRegistrar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CupOracle · 世界杯 AI 预测平台",
  description:
    "基于多模型 LLM 的 2026 世界杯胜负、概率与比分预测，覆盖小组赛至决赛的全程赛事追踪。",
  metadataBase: new URL("http://localhost:3000"),
  manifest: "/manifest.webmanifest",
  applicationName: "CupOracle",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CupOracle",
  },
  openGraph: {
    title: "CupOracle · 世界杯 AI 预测平台",
    description:
      "基于多模型 LLM 的 2026 世界杯胜负、概率与比分预测，覆盖小组赛至决赛的全程赛事追踪。",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6520980306039403"
          crossOrigin="anonymous"
        />
        <SwRegistrar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && npx tsc --noEmit`
Expected: 无类型错误（exit 0）。

- [ ] **Step 4: 启动 dev server 验证 manifest 可加载**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && npm run dev` （在后台跑;测试用 `run_in_background: true`）

Then: 等待 3 秒,然后 `curl -sI http://localhost:3000/manifest.webmanifest | head -3`
Expected: `HTTP/1.1 200 OK`, `Content-Type: application/manifest+json` 或类似

Then: `curl -s http://localhost:3000/ | grep -o 'rel="manifest"[^>]*' | head -1`
Expected: 出现 `rel="manifest" href="/manifest.webmanifest"`

Then: `curl -s http://localhost:3000/ | grep -o 'apple-touch-icon' | head -1`
Expected: 出现 `apple-touch-icon`

完成后 kill 后台 dev server（用 `pkill -f "next dev"` 或 TaskStop）.

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/app/layout.tsx
git commit -m "feat(website): wire manifest + iOS meta + SwRegistrar into layout"
```

---

## Task 6: 编写 Service Worker (precache + fetch 策略)

**Files:**
- Create: `packages/website/public/sw.js`

- [ ] **Step 1: 创建 sw.js**

Create: `packages/website/public/sw.js`

```javascript
// CupOracle Service Worker
// 手写,无 Workbox。版本号变化时旧缓存会被自动清理。

const CACHE_VERSION = "cuporacle-v1-20260615";
const APP_SHELL = [
  "/",
  "/matches",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/badge-72.png",
];

// ─── Install: 预缓存 app shell,跳过等待 ───────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll 任一失败整个 install 失败;用 individual put 容忍单条缺失
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[sw] precache failed:", url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// ─── Activate: 清理旧版本缓存,接管未受控页面 ─────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ─── Fetch: 三类策略 ─────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // POST/PUT 等透传

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 跨域透传(国旗 SVG / API 代理)

  // 1. 静态资源:cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/badge-72.png" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 2. 页面/数据:stale-while-revalidate
  if (
    url.pathname === "/" ||
    url.pathname.startsWith("/matches") ||
    url.pathname.startsWith("/api/")
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
});

// ─── Push: 显示系统通知 ──────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "CupOracle", body: event.data.text() };
  }
  const { title = "CupOracle", body = "", tag, data } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag,
      data, // { url }
      requireInteraction: false,
    })
  );
});

// ─── Notification click: 打开/聚焦目标 URL ───────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if (c.url.includes(url) && "focus" in c) {
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })()
  );
});

// ─── 策略实现 ────────────────────────────────────────────────
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    // 静态资源无离线兜底,直接失败
    return new Response("offline", { status: 503 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);

  if (cached) {
    // 后台静默 revalidate;返回旧值
    networkPromise.catch(() => {});
    return cached;
  }

  const res = await networkPromise;
  if (res) return res;

  // 离线且无缓存 → 兜底页
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    const offline = await cache.match("/offline.html");
    if (offline) return offline;
  }
  return new Response("offline", { status: 503 });
}
```

- [ ] **Step 2: 验证 JS 语法**

Run: `node --check /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website/public/sw.js && echo "syntax OK"`
Expected: `syntax OK`（无输出错误）。

- [ ] **Step 3: 验证 sw.js 通过 next-on-pages 复制到输出**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && rm -rf .next && npm run pages:build 2>&1 | tail -20`
Expected: build 成功（exit 0）;末尾无错误。

Then: `ls -la /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website/.vercel/output/static/sw.js /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website/.vercel/output/static/manifest.webmanifest /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website/.vercel/output/static/icon-192.png`
Expected: 3 个文件都存在,大小 > 0。

- [ ] **Step 4: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/public/sw.js
git commit -m "feat(website): hand-written Service Worker (precache + SWR + push)"
```

---

## Task 7: 创建 D1 迁移 — push_subscriptions + push_recent

**Files:**
- Create: `packages/service/migrations/0004_push_subscriptions.sql`

- [ ] **Step 1: 创建迁移文件**

Create: `packages/service/migrations/0004_push_subscriptions.sql`

```sql
-- Web Push 订阅表
-- 每个浏览器订阅一条。endpoint 是 web-push 服务的唯一 URL。
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created ON push_subscriptions(created_at);

-- 推送去重表
-- tag = 'match-<match_id>'。10 分钟内同 tag 跳过,避免重复推。
-- 不存数据,只存最近一条;push_handlers broadcast 时 UPSERT。
CREATE TABLE IF NOT EXISTS push_recent (
  tag TEXT PRIMARY KEY,
  pushed_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_recent_pushed ON push_recent(pushed_at);
```

- [ ] **Step 2: 验证 SQL 在 D1 SQLite 方言下合法**

Run: `sqlite3 :memory: < /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service/migrations/0004_push_subscriptions.sql && echo "SQL OK"`
Expected: `SQL OK`（如果机器没 sqlite3,跳过此步;继续手动浏览 SQL）。

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/service/migrations/0004_push_subscriptions.sql
git commit -m "feat(service): D1 migration for push subscriptions + dedup"
```

---

## Task 8: service 端 — Web Push 封装 (push.ts)

**Files:**
- Modify: `packages/service/package.json`（加 `web-push`）
- Create: `packages/service/src/push.ts`

- [ ] **Step 1: 加 web-push 依赖**

在 `packages/service/package.json` 的 `dependencies` 块（Hono 后）添加:

```json
    "web-push": "^3.6.7",
```

- [ ] **Step 2: 安装依赖**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle && npm install`
Expected: 安装 web-push 无错误。

- [ ] **Step 3: 创建 push.ts**

Create: `packages/service/src/push.ts`

```typescript
// Web Push 工具:VAPID 配置 + 单条推送发送。
// 不在这里做并发/重试/broadcast 循环,那是 push-handlers 的职责。

import webpush, { WebPushError, type PushSubscription } from "web-push";

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string; // mailto: 或 https://
}

export function configureVapid(cfg: VapidConfig): void {
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
}

export interface SendResult {
  ok: boolean;
  statusCode: number;
  gone?: boolean; // 410/404 → 客户端订阅已失效
  error?: string;
}

export async function sendOne(
  sub: PushSubscription,
  payload: string,
  ttl = 60 * 60 * 24  // 1 天
): Promise<SendResult> {
  try {
    const res = await webpush.sendNotification(sub, payload, { TTL: ttl });
    return { ok: true, statusCode: res.statusCode };
  } catch (e) {
    if (e instanceof WebPushError) {
      const gone = e.statusCode === 404 || e.statusCode === 410;
      return { ok: false, statusCode: e.statusCode, gone, error: e.body };
    }
    return { ok: false, statusCode: 0, error: (e as Error).message };
  }
}
```

- [ ] **Step 4: TypeScript 类型检查**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && npm run typecheck`
Expected: 无错误（exit 0）。

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/service/package.json packages/service/src/push.ts
git commit -m "feat(service): web-push wrapper with VAPID config + sendOne"
```

---

## Task 9: service 端 — 4 个 Hono 路由

**Files:**
- Modify: `packages/service/src/types.ts`（加 subscription 类型）
- Create: `packages/service/src/push-handlers.ts`

- [ ] **Step 1: 在 types.ts 末尾追加推送相关类型**

在 `packages/service/src/types.ts` 末尾追加（用 `Read` 先看末尾结构,再 Edit 插入）:

```typescript
// ─── Web Push ─────────────────────────────────────────────────
export interface PushSubscriptionKey {
  p256dh: string;
  auth: string;
}
export interface PushSubscriptionJSON {
  endpoint: string;
  keys: PushSubscriptionKey;
}
export interface SubscribeRequest {
  subscription: PushSubscriptionJSON;
}
export interface UnsubscribeRequest {
  endpoint: string;
}
export interface BroadcastPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}
```

- [ ] **Step 2: 创建 push-handlers.ts**

Create: `packages/service/src/push-handlers.ts`

```typescript
// Hono 路由:订阅/退订/VAPID 公钥/广播
// 广播由 /internal/sync 同步完成后调用,遍历 D1 未结束比赛
// (排除 FINISHED) 各发一次通知,tag = match-<id>,由 push_recent 表去重(10 分钟)。

import { Hono } from "hono";
import type { Env } from "./index";
import { configureVapid, sendOne } from "./push";
import type { BroadcastPayload, SubscribeRequest, UnsubscribeRequest } from "./types";

const DEDUP_WINDOW_SEC = 600; // 10 分钟

export const pushRoutes = new Hono<{ Bindings: Env }>();

function isValidEndpoint(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/push/vapid-public-key — 公开
pushRoutes.get("/api/push/vapid-public-key", (c) => {
  return c.json({ key: c.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
pushRoutes.post("/api/push/subscribe", async (c) => {
  let body: SubscribeRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  const sub = body.subscription;
  if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return c.json({ error: "missing fields" }, 400);
  }
  if (!isValidEndpoint(sub.endpoint)) {
    return c.json({ error: "endpoint must be https" }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth)
     VALUES (?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, last_error = NULL`
  )
    .bind(sub.endpoint, sub.keys.p256dh, sub.keys.auth)
    .run();

  return c.json({ ok: true });
});

// POST /api/push/unsubscribe
pushRoutes.post("/api/push/unsubscribe", async (c) => {
  let body: UnsubscribeRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  if (!body.endpoint) return c.json({ error: "missing endpoint" }, 400);
  await c.env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
    .bind(body.endpoint)
    .run();
  return c.json({ ok: true });
});

// POST /internal/push/broadcast
// body: BroadcastPayload (title/body/url/tag)
// 鉴权: X-Internal-Token == env.INTERNAL_BROADCAST_TOKEN
pushRoutes.post("/internal/push/broadcast", async (c) => {
  const token = c.req.header("X-Internal-Token");
  if (!token || token !== c.env.INTERNAL_BROADCAST_TOKEN) {
    return c.json({ error: "unauthorized" }, 401);
  }

  let payload: BroadcastPayload;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  if (!payload.title || !payload.url || !payload.tag) {
    return c.json({ error: "missing fields" }, 400);
  }

  // 去重检查
  const recent = await c.env.DB.prepare(
    "SELECT pushed_at FROM push_recent WHERE tag = ?"
  )
    .bind(payload.tag)
    .first<{ pushed_at: number }>();
  if (recent && Date.now() / 1000 - recent.pushed_at < DEDUP_WINDOW_SEC) {
    return c.json({ ok: true, deduped: true });
  }

  // VAPID 初始化(每次冷启动都要)
  configureVapid({
    publicKey: c.env.VAPID_PUBLIC_KEY,
    privateKey: c.env.VAPID_PRIVATE_KEY,
    subject: c.env.VAPID_SUBJECT,
  });

  // 查所有订阅,逐个发
  const subs = await c.env.DB.prepare(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions"
  ).all<{ endpoint: string; p256dh: string; auth: string }>();

  let sent = 0;
  let gone = 0;
  const json = JSON.stringify(payload);
  for (const row of subs.results) {
    const result = await sendOne(
      {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      },
      json
    );
    if (result.ok) {
      sent++;
    } else if (result.gone) {
      gone++;
      await c.env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
        .bind(row.endpoint)
        .run();
    } else {
      // 记 last_error,不删除
      await c.env.DB.prepare(
        "UPDATE push_subscriptions SET last_error = ? WHERE endpoint = ?"
      )
        .bind(result.error ?? "unknown", row.endpoint)
        .run();
    }
  }

  // 写去重记录
  await c.env.DB.prepare(
    "INSERT INTO push_recent (tag, pushed_at) VALUES (?, ?) ON CONFLICT(tag) DO UPDATE SET pushed_at = excluded.pushed_at"
  )
    .bind(payload.tag, Math.floor(Date.now() / 1000))
    .run();

  return c.json({ ok: true, sent, gone, total: subs.results.length });
});
```

- [ ] **Step 3: TypeScript 类型检查**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && npm run typecheck`
Expected: 可能报 `Env` 类型不存在的错误,这是因为 `src/index.ts` 还没改（Task 10 才挂载）。先确认 `Env` 在 index.ts 里有定义;若有,这里就不报。如果报"Cannot find name 'Env'",在 push-handlers.ts 顶部加临时 import:`import type { Env } from "./index";` (下一步会调整)。

- [ ] **Step 4: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/service/src/types.ts packages/service/src/push-handlers.ts
git commit -m "feat(service): push handlers (subscribe/unsubscribe/broadcast/vapid-key)"
```

---

## Task 10: service 端 — 在 index.ts 挂载路由 + 声明 Env

**Files:**
- Modify: `packages/service/src/index.ts`

- [ ] **Step 1: 读取 index.ts**

Read: `/Volumes/Extension/song52wow/world-cup/cuporacle/packages/service/src/index.ts`

（如果文件不长,直接读全文;若有几百行,读前 60 行和末 30 行。）

- [ ] **Step 2: 在 index.ts 加 Env 类型和路由挂载**

根据上一步读到的内容,做两个修改:

**修改 A**: 在文件顶部 type/interface 区域（如果没有则新建）添加 `Env`:

```typescript
export interface Env {
  DB: D1Database;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string; // 例: "mailto:admin@cuporacle.com"
  INTERNAL_BROADCAST_TOKEN: string;
  // 现有 env (CORS 允许的 origin 等) 保持不变
}
```

**修改 B**: 在 `app` 创建后,挂载 push 路由:

```typescript
import { pushRoutes } from "./push-handlers";
// ... app 创建后:
app.route("/", pushRoutes);
```

（具体位置参考 index.ts 当前结构;`app` 可能是 `new Hono()` 或 `const app = new Hono<{...}>()`。挂载点放在 `app.use("/*", cors(...))` 之后、所有具体路由之前。）

- [ ] **Step 3: TypeScript 类型检查**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && npm run typecheck`
Expected: 无错误（exit 0）。

- [ ] **Step 4: Dry-run 部署验证**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && npm run build 2>&1 | tail -20`
Expected: `wrangler deploy --dry-run` 成功;末尾 `Published` 或 `Dry run completed`（具体 wrangler 版本输出可能略不同;无 error 即可）。

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/service/src/index.ts
git commit -m "feat(service): mount push routes + declare Env bindings"
```

---

## Task 11: website 端 — lib/push.ts (Web Push 客户端封装)

**Files:**
- Create: `packages/website/lib/push.ts`

- [ ] **Step 1: 创建 lib/push.ts**

Create: `packages/website/lib/push.ts`

```typescript
// 浏览器端 Web Push 客户端封装。
// - urlBase64ToUint8Array: VAPID 公钥转 PushSubscription 需要的格式
// - subscribe: 一次性完成 permission + subscribe + POST 后端
// - unsubscribe: 反向
// - getSubscription: 查当前订阅(用于 NotificationBell 初始状态)

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
    return null;
  }

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  if (!res.ok) {
    console.warn("[push] subscribe POST failed:", res.status);
    // 回滚浏览器订阅,保持 UI 一致
    await sub.unsubscribe();
    return null;
  }
  return sub;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getCurrentSubscription();
  if (!sub) return true;
  const endpoint = sub.endpoint;
  const ok = await sub.unsubscribe();
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  return ok;
}
```

- [ ] **Step 2: TypeScript 类型检查**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && npx tsc --noEmit`
Expected: 无错误（exit 0）。

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/lib/push.ts
git commit -m "feat(website): client-side Web Push wrapper (subscribe/unsubscribe/get)"
```

---

## Task 12: NotificationBell 组件

**Files:**
- Create: `packages/website/components/NotificationBell.tsx`

- [ ] **Step 1: 创建组件**

Create: `packages/website/components/NotificationBell.tsx`

```tsx
"use client";

// 通知订阅开关。
// - 不支持 Web Push 的浏览器 / iOS < 16.4:不渲染按钮
// - 三种状态:加载中 / 未订阅(显示"开启") / 已订阅(显示"关闭")
// - 权限被拒:显示灰色"通知被屏蔽",引导用户在浏览器设置中开启

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { isPushSupported, getCurrentSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/push";

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

export function NotificationBell() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      // iOS < 16.4 在 PWA 模式下 PushManager 存在但 subscribe 失败;
      // 这里先看权限,再看现有订阅。
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      const sub = await getCurrentSubscription();
      if (!cancelled) setStatus(sub ? "subscribed" : "unsubscribed");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading" || status === "unsupported") return null;

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (status === "subscribed") {
        await unsubscribeFromPush();
        setStatus("unsubscribed");
      } else if (status === "unsubscribed") {
        const sub = await subscribeToPush();
        setStatus(sub ? "subscribed" : Notification.permission === "denied" ? "denied" : "unsubscribed");
      }
    } finally {
      setBusy(false);
    }
  }

  const icon = status === "subscribed" ? Bell : status === "denied" ? BellOff : BellRing;
  const Icon = icon;
  const label =
    status === "subscribed"
      ? "通知已开启"
      : status === "denied"
        ? "通知被屏蔽"
        : "开启新预测通知";

  return (
    <button
      onClick={handleToggle}
      disabled={busy || status === "denied"}
      title={label}
      className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-full hairline text-white/70 hover:text-white hover:bg-white/[0.04] transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: TypeScript 类型检查**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && npx tsc --noEmit`
Expected: 无错误（exit 0）。

- [ ] **Step 3: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/components/NotificationBell.tsx
git commit -m "feat(website): NotificationBell component (subscribe/unsubscribe toggle)"
```

---

## Task 13: SiteHeader 集成 NotificationBell

**Files:**
- Modify: `packages/website/components/SiteHeader.tsx`

- [ ] **Step 1: 修改 SiteHeader.tsx**

在 `components/SiteHeader.tsx` 顶部 import 块（L1-7）后追加:

```tsx
import { NotificationBell } from "@/components/NotificationBell";
```

在 `LIVELIVE · 2026` span 之前（即 `<span className="hidden sm:inline-flex items-center gap-1.5 ...` 之前）插入:

```tsx
          <NotificationBell />
```

（具体位置参考当前 SiteHeader.tsx 的 L42-46 区域。NotificationBell 放在 LIVE 状态条左边,使其在桌面端和手机端都有合理视觉顺序。）

- [ ] **Step 2: TypeScript 类型检查**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && npx tsc --noEmit`
Expected: 无错误（exit 0）。

- [ ] **Step 3: 验证 dev server 渲染**

Run: 启动 dev server (后台),3 秒后 `curl -s http://localhost:3000/ | grep -o "NotificationBell\|通知\|开启新预测" | head -3`
Expected: 由于 NotificationBell 是 `"use client"`,SSR 不会渲染按钮内容;但页面 HTML 应能正常返回（不报错）。如果 `NotificationBell` 字面量出现表示 import 失败,需检查。

完成后 kill 后台 dev server。

- [ ] **Step 4: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/components/SiteHeader.tsx
git commit -m "feat(website): add NotificationBell to site header"
```

---

## Task 14: 生成 VAPID 密钥对 + 配置

**Files:**
- Modify: `packages/website/wrangler.toml`（加 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`）

- [ ] **Step 1: 生成 VAPID 密钥对（一次性,本机操作）**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && npx web-push generate-vapid-keys`
Expected: 输出类似:
```
======================================
Public Key:
BO1234abcd...

Private Key:
abc123XYZ...
======================================
```

**重要**:把这两个值安全记录下来（密码管理器或临时文件）。私钥**永远不进 git**。

- [ ] **Step 2: 把私钥注入 service worker secrets（生产环境）**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && wrangler secret put VAPID_PRIVATE_KEY`
Expected: 提示粘贴值。粘贴上一步的 Private Key,按 Enter。
Then: `wrangler secret put INTERNAL_BROADCAST_TOKEN`,粘贴一个 32 字符随机串（用 `openssl rand -hex 32` 生成一个）。
Then: `wrangler secret put VAPID_SUBJECT`,粘贴 `mailto:admin@cuporacle.com`（或你团队邮箱）。

- [ ] **Step 3: 把 VAPID_PUBLIC_KEY 注入 website wrangler.toml**

在 `packages/website/wrangler.toml` 的 `[vars]` 块（已有 `NEXT_PUBLIC_API_BASE`）添加:

```toml
NEXT_PUBLIC_VAPID_PUBLIC_KEY = "<上一步输出的 Public Key>"
```

最终 [vars] 块:
```toml
[vars]
NEXT_PUBLIC_API_BASE = "https://cuporacle-service.song52wow.workers.dev"
NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BO1234abcd..."
# NEXT_PUBLIC_USE_MOCK = "0"
```

- [ ] **Step 4: 本地开发 env（.env.local）**

在 `packages/website/.env.local` 添加（如果文件已存在,追加;不存在则创建）:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<同上的 Public Key>
```

- [ ] **Step 5: 验证 VAPID 公钥可被 service 公开端点返回**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && npm run dev`（后台）

Then: 等待 3 秒,`curl -s http://localhost:8787/api/push/vapid-public-key`
Expected: `{"key":"BO1234abcd..."}`（你刚才的公钥）

完成后 kill 后台 dev server。

- [ ] **Step 6: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/website/wrangler.toml
git commit -m "chore(website): wire VAPID public key into wrangler vars"
```

> **注意**: `packages/service` 的 `wrangler secret` 已注入远程,本机无文件可 commit。`packages/website/.env.local` 默认 gitignore,无需 commit。

---

## Task 15: 应用 D1 迁移到生产 D1

**Files:** （仅 wrangler 远程操作,无文件改动）

- [ ] **Step 1: 应用迁移到生产 D1**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && wrangler d1 migrations apply DB --remote`
Expected: 输出 `Migrations applied successfully` 或类似。出现 0004 应用日志。

- [ ] **Step 2: 验证表已创建**

Run: `wrangler d1 execute DB --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('push_subscriptions','push_recent')"`
Expected: 两行返回,确认两表存在。

> 无 commit（操作远程数据库）。

---

## Task 16: sync.mjs 集成广播触发

**Files:**
- Modify: `packages/service/scripts/sync.mjs`

- [ ] **Step 1: 读取 sync.mjs 后 30 行**

Read: `/Volumes/Extension/song52wow/world-cup/cuporacle/packages/service/scripts/sync.mjs`,offset 130,limit 36

- [ ] **Step 2: 添加广播调用**

在 sync.mjs 末尾（最后一行的 `console.log`/`process.exit(0)` 之前,或紧跟同步完成的日志后）添加:

```javascript
// ─── 广播推送:对新预测通知所有订阅者 ───────────────────────
const BROADCAST_TAG_PREFIX = "match-";
if (!dryRun) {
  const matchesRes = await fetch(`${SERVICE_URL.replace(/\/$/, "")}/api/matches?status=TIMED`, {
    headers: { "User-Agent": "cuporacle-sync" },
  });
  if (matchesRes.ok) {
    const data = await matchesRes.json();
    const matches = (data.matches || []).slice(0, 50); // 上限 50 条,防止单次风暴
    for (const m of matches) {
      const tag = `${BROADCAST_TAG_PREFIX}${m.id}`;
      const r = await fetch(`${SERVICE_URL.replace(/\/$/, "")}/internal/push/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Token": process.env.SYNC_SECRET ?? "",
        },
        body: JSON.stringify({
          title: `⚽ ${m.home_team_name} vs ${m.away_team_name} 预测已更新`,
          body: "点击查看 AI 模型分析",
          url: `/matches/${m.id}`,
          tag,
        }),
      });
      if (!r.ok) {
        console.warn(`[sync] broadcast failed for ${tag}: ${r.status}`);
      }
    }
    console.log(`📣 Broadcast attempted for ${matches.length} matches`);
  }
}
```

> **前提**: `SERVICE_URL` 和 `dryRun` 变量在 sync.mjs 中已存在。如果名字不同,参考上下文调整。

- [ ] **Step 3: 验证语法**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && node --check scripts/sync.mjs && echo "syntax OK"`
Expected: `syntax OK`。如有 `await` 在顶层模块的语法错误（`await is only valid in async function`）,需要把整个文件改写为 `async function main()` + `await main()`,或者把这段代码包到 `(async () => { ... })()` 里。

- [ ] **Step 4: Dry-run 验证**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/service && npm run sync:dry 2>&1 | tail -10`
Expected: 输出包含 `Broadcast attempted for N matches`（N 可为 0;dry-run 不应该真发请求,但 fetch 仍会执行 — 这没关系,因为这是带 `SERVICE_URL` 的 GET,不影响 broadcast 端点鉴权失败因为 dry-run 是只读统计模式。

> 实际上根据 sync.mjs 的 `--dry-run` 实现,可能会跳过远端调用。如果 dry-run 模式下 broadcast 仍执行,也无害(认证失败会被 catch,只是 warn)。

- [ ] **Step 5: Commit**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git add packages/service/scripts/sync.mjs
git commit -m "feat(service): broadcast push notifications on sync completion"
```

---

## Task 17: 部署 service + website

**Files:** （仅部署命令,无文件改动）

- [ ] **Step 1: 部署 service**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle && npm run deploy:service 2>&1 | tail -15`
Expected: `Published cuporacle-service`（版本号随意）;无 error。

- [ ] **Step 2: 验证 service 端点**

Run: `curl -s https://cuporacle-service.song52wow.workers.dev/api/push/vapid-public-key`
Expected: `{"key":"BO1234abcd..."}` —— 你的 VAPID 公钥。

- [ ] **Step 3: 构建并部署 website**

Run: `cd /Volumes/Extension/song52wow/world-cup/cuporacle/packages/website && npm run pages:build 2>&1 | tail -10`
Expected: build 成功;`.vercel/output/static/sw.js` 存在。

Then: `cd /Volumes/Extension/song52wow/world-cup/cuporacle && wrangler pages deploy packages/website/.vercel/output/static --project-name cuporacle-web 2>&1 | tail -10`
Expected: `Deployment complete` 或类似。

> **注意**: `wrangler pages deploy` 的 project name 在 `CLAUDE.md` 明确说是 `cuporacle-web`(不是 `cuporacle`,那个名字已被旧 Workers 占用)。

- [ ] **Step 4: 验证 production manifest + sw.js 可访问**

Run: `curl -sI https://cuporacle.pages.dev/manifest.webmanifest | head -3`
Expected: `HTTP/2 200`, `Content-Type: application/manifest+json`（或类似）

Then: `curl -sI https://cuporacle.pages.dev/sw.js | head -3`
Expected: `HTTP/2 200`, `Content-Type: application/javascript`（或类似）

Then: `curl -sI https://cuporacle.pages.dev/icon-192.png | head -3`
Expected: `HTTP/2 200`, `Content-Type: image/png`

- [ ] **Step 5: Lighthouse PWA 审计**

Run: `npx lighthouse https://cuporacle.pages.dev --only-categories=pwa --view`
Expected: PWA 类别分数 ≥ 90。"Installable" + "PWA Optimized" 全部通过。
> 若 < 90,常见原因: 缺少 maskable icon / start_url 200 / manifest 字段缺失。按 Lighthouse 报告对照本文 Task 2 manifest 配置。

> 无 commit（部署动作,代码已在前面任务 commit）。

---

## Task 18: 端到端真机测试

**Files:** （仅手动操作）

- [ ] **Step 1: Android Chrome 真机测试**

打开 Chrome on Android,访问 `https://cuporacle.pages.dev/`:
- [ ] 地址栏出现"安装"图标,点击能成功安装
- [ ] 安装后从启动器打开 App,出现 splash + 标题"CupOracle"
- [ ] 在 `/matches` 页面点击 NotificationBell "开启新预测通知"
- [ ] Chrome 弹权限请求,点"允许"
- [ ] 按钮变为"通知已开启"
- [ ] 重启浏览器,按钮状态保持"已订阅"

- [ ] **Step 2: Android Chrome 接收推送**

在桌面 dev 终端:
Run: `curl -X POST -H "Content-Type: application/json" -H "X-Internal-Token: <你的 INTERNAL_BROADCAST_TOKEN>" -d '{"title":"测试推送","body":"这是来自 curl 的推送","url":"/matches","tag":"test-curl-001"}' https://cuporacle-service.song52wow.workers.dev/internal/push/broadcast`
Expected: `{"ok":true,"sent":1,"gone":0,"total":1}`(或 total 1 + sent 1)

Then: 在 Android 设备的通知栏看到来自 CupOracle 的系统通知,标题"测试推送"。
Then: 点击通知,App 打开并跳转到 `/matches`。

- [ ] **Step 3: iOS Safari 16.4+ 真机测试**

打开 Safari on iOS,访问 `https://cuporacle.pages.dev/`:
- [ ] 点击分享按钮 → "添加到主屏幕"
- [ ] 桌面出现 CupOracle 图标
- [ ] 从主屏幕打开 App —— **关键**:必须从主屏幕图标打开,不是 Safari URL
- [ ] App 内应能正常浏览,无 Safari UI
- [ ] 检查 NotificationBell 是否可见:在 iOS 16.4+ 上可见

- [ ] **Step 4: iOS 离线测试**

打开 App 后,关闭网络:
- [ ] 之前访问过的页面（如首页）应能正常显示
- [ ] 未访问过的页面应显示 offline.html 兜底
- [ ] 重新打开网络,点击"重新加载"应能恢复

- [ ] **Step 5: 修复发现的问题**

任何步骤失败,在 GitHub issue 记录并修复后重新跑该步骤。修复完一个步骤,commit 一次。

- [ ] **Step 6: 最终 commit + tag**

```bash
cd /Volumes/Extension/song52wow/world-cup/cuporacle
git tag v0.2.0-pwa
git push origin v0.2.0-pwa
```

---

## 验收清单（Definition of Done）

- [ ] `npm run pages:build` 在 website 包成功
- [ ] `npm run typecheck` 在 service 包成功
- [ ] `npx tsc --noEmit` 在 website 包成功
- [ ] `wrangler pages deploy` 成功,sw.js / manifest / 5 个 PNG 都 200
- [ ] `wrangler deploy` service 成功
- [ ] Lighthouse PWA 分数 ≥ 90
- [ ] Android Chrome 安装 + 推送 + 点击通知跳转都通过
- [ ] iOS Safari 16.4+ 加到主屏幕 + 离线浏览通过
- [ ] Tag `v0.2.0-pwa` 已 push
