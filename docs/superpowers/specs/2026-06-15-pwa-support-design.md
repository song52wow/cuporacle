# CupOracle 官网 PWA 支持 — 设计文档

- **日期**：2026-06-15
- **状态**：已批准，待实施
- **基线 tag**：`v0.1.0-pre-pwa`（开始 PWA 工作前）
- **作者**：brainstorming 会话

## 1. 背景与目标

CupOracle 官网（`packages/website`，Next.js 14 App Router，部署到 Cloudflare Pages）当前是一个"普通"响应式网页。2026 世界杯赛事期间，用户会：

- 通勤路上用手机查看赛事预测
- 在比赛开始前快速回到 App 确认开赛时间
- 想要在主屏幕有图标，像 App 一样启动

目标是把它升级为**完整 PWA**：可安装、离线浏览、推送通知、应用快捷方式。

## 2. 范围

| 能力 | 包含 | 说明 |
|---|---|---|
| **可安装**（Android Chrome / iOS Safari 16.4+） | ✅ | W3C manifest + iOS meta + 多尺寸图标 |
| **离线浏览** | ✅ | 缓存最近访问的赛事列表/详情 |
| **推送通知** | ✅ | 新预测生成时推送（订阅粒度 = 全站） |
| **应用快捷方式** | ✅ | 长按图标 → "全部赛事" / "今日比赛" |
| **桌面端 PWA 体验** | ❌ | 暂不支持（不在目标平台） |
| **BackgroundSync** | ❌ | YAGNI |
| **admin 后台推送 UI** | ❌ | 暂不实现（只支持自动广播） |

## 3. 目标平台

| 平台 | 体验 |
|---|---|
| Android Chrome / Edge / Samsung | 完整：安装、离线、推送、快捷方式 |
| iOS Safari 16.4+ | 完整：加到主屏幕、离线、推送（在 PWA 模式下） |
| iOS Safari 旧版 | 降级：仅"加到主屏幕"（无推送） |
| Desktop（macOS/Windows/Linux） | 暂不优化（manifest 仍可识别，但不做启动画面/icon maskable 调优） |

## 4. 架构

### 4.1 顶层

```
┌─────────────────────────────────────────────────────────────────────┐
│                       用户浏览器 (Android/iOS)                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Next.js App (RSC, edge runtime)                            │  │
│  │  · app/layout.tsx 注入 manifest link / iOS meta / SW 注册   │  │
│  │  · components/NotificationBell  (订阅开关 UI)                │  │
│  │  · lib/push.ts  (客户端 Web Push 封装)                      │  │
│  └────────────────────┬─────────────────────────────────────────┘  │
│                       │  navigator.serviceWorker.register('/sw.js') │
│  ┌────────────────────▼─────────────────────────────────────────┐  │
│  │  public/sw.js  (手写)                                        │  │
│  │  · install: precache app shell (icons / manifest / offline) │  │
│  │  · fetch: stale-while-revalidate for /api/*, /matches/*     │  │
│  │  · fetch: cache-first for /_next/static/*, /icon-*.png      │  │
│  │  · push: 显示系统通知                                       │  │
│  │  · notificationclick: 打开 /matches/[id] 详情                │  │
│  │  · activate: clients.claim() + 清理旧 CACHE_VERSION         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ HTTPS
┌────────────────────────────────────▼────────────────────────────────┐
│          Cloudflare Pages (cuporacle-web)  +  Workers (service)      │
│                                                                      │
│  Pages 静态资源:                                                      │
│    /sw.js, /manifest.webmanifest, /icon-192.png, /icon-512.png,      │
│    /icon-maskable-512.png, /badge-72.png, /apple-touch-icon.png,     │
│    /offline.html                                                     │
│                                                                      │
│  service Workers 新增端点:                                            │
│    POST /api/push/subscribe    body: { subscription }   → D1 写入  │
│    POST /api/push/unsubscribe  body: { endpoint }        → D1 删除  │
│    POST /internal/push/broadcast                          (内部调用)│
│        body: { title, body, url, tag }  → web-push 推给所有订阅     │
│    GET  /api/push/vapid-public-key                  → VAPID 公钥     │
│                                                                      │
│  D1 新增表:                                                           │
│    push_subscriptions (id, endpoint, p256dh, auth, created_at)         │
│    push_recent (tag PK, pushed_at)        -- 推送去重                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 关键设计决策

- **Service Worker 是手写的纯静态文件**——`public/sw.js`。**不引入 `@serwist/next` 或 `next-pwa`**，避免与 `@cloudflare/next-on-pages` webpack 适配器冲突
- **推送复用 `packages/service`**——不上独立 push Workers，减少一个服务/部署/CORS 维护成本
- **触发点是 `/internal/sync` 同步脚本末尾**——D1 INSERT 完预测后调用 `/internal/push/broadcast`。该端点带 `X-Internal-Token` 鉴权
- **Web Push VAPID 密钥**——私钥走 `wrangler secret put VAPID_PRIVATE_KEY`；公钥通过 `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 内联到客户端
- **iOS 16.4+ 推送限制**——iOS 的 Web Push 只在"加到主屏幕"启动的 PWA 模式下工作，in-browser Safari 不推。客户端运行时检测，能力不可用时不渲染订阅按钮

## 5. 组件清单

### 5.1 `packages/website` 新增文件

| 文件 | 职责 | 行数预估 |
|---|---|---|
| `public/manifest.webmanifest` | W3C manifest（name, short_name, icons, theme_color, start_url, display, shortcuts） | ~30 |
| `public/sw.js` | SW：precache / fetch 拦截 / push / notificationclick / skipWaiting | ~180 |
| `public/icon-192.png` | 192×192 PNG | raster |
| `public/icon-512.png` | 512×512 PNG（普通） | raster |
| `public/icon-maskable-512.png` | 512×512 maskable（safe zone 居中 80%） | raster |
| `public/badge-72.png` | 通知角标 72×72 单色 | raster |
| `public/apple-touch-icon.png` | iOS 180×180 | raster |
| `public/offline.html` | 离线兜底页（玻璃拟态 + 重新加载按钮） | ~40 |
| `lib/push.ts` | 客户端：permission / `PushManager.subscribe` / POST `/api/push/subscribe` | ~80 |
| `components/NotificationBell.tsx` | UI：订阅开关 + 状态提示 + 不支持时静默 | ~100 |
| `components/SwRegistrar.tsx` | 客户端：`<script>` 注册 SW + iOS meta 兼容性处理 | ~30 |
| `scripts/generate-pwa-icons.mjs` | 一次性脚本：sharp + icon.svg → 5 个 PNG | ~40 |

### 5.2 `packages/website` 修改文件

| 文件 | 修改 |
|---|---|
| `app/layout.tsx` | 注入 `<link rel="manifest">`、iOS meta (`apple-mobile-web-app-capable` 等)、`<SwRegistrar/>` 客户端组件 |
| `components/SiteHeader.tsx` | 头部右侧插入 `<NotificationBell/>`（仅客户端） |
| `wrangler.toml` | `[vars]` 新增 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`（VAPID 公钥） |
| `package.json` | 新增 `sharp`（devDep，生成图标脚本用） + 脚本 `icons:gen` |
| `.gitignore` | 不需要变化（public/ 图标要 commit） |

### 5.3 `packages/service` 新增文件

| 文件 | 职责 | 行数预估 |
|---|---|---|
| `src/push.ts` | VAPID 签名 + `web-push` 封装 | ~80 |
| `src/push-handlers.ts` | Hono 路由 4 个 | ~120 |
| `migrations/0002_push_subscriptions.sql` | D1 表 `push_subscriptions` DDL（含去重辅助表） | ~15 |

### 5.4 `packages/service` 修改文件

| 文件 | 修改 |
|---|---|
| `src/index.ts` | 挂载 push 路由（4 个端点） |
| `package.json` | 加 `web-push` 运行时依赖（不需 `@types/web-push`，自带） |
| `wrangler.toml` | 填入 D1 binding（ID 来自步骤 9.2 `wrangler d1 create` 输出的 `database_id`） |

## 6. 数据流

### 6.1 首次访问 + SW 安装

```
浏览器 ─GET /─→ CF Pages 返回 HTML (200)
                  ↓
      <link rel="manifest"> 加载 manifest.webmanifest
      <meta name="apple-mobile-web-app-capable"> 触发 iOS PWA 模式
                  ↓
      <SwRegistrar/> 客户端组件: navigator.serviceWorker.register('/sw.js')
                  ↓
SW install 事件: skipWaiting() (立即激活)
SW activate 事件: clients.claim() (接管当前页面) + 清理旧 CACHE_VERSION
SW precache: ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png',
              '/icon-maskable-512.png', '/badge-72.png',
              '/apple-touch-icon.png', '/offline.html']
```

### 6.2 页面浏览

```
fetch 事件 → url.pathname 分类
  ├─ /_next/static/* | /icon-*.png | /manifest.webmanifest
  │    → cache-first
  │       · 命中: 直接返回
  │       · 未命中: 网络 + 写入缓存
  │
  ├─ /api/* | /matches/* | /matches/[id] | /
  │    → stale-while-revalidate
  │       · 命中: 立即返回缓存 + 后台 fetch 更新
  │       · 未命中: 网络，成功后写缓存
  │       · 离线 + 无缓存: 返回 /offline.html
  │
  └─ 其他 (e.g. /api/push/subscribe POST)
       → 透传，不缓存
```

### 6.3 订阅推送

```
用户点 NotificationBell "开启通知"
        ↓
client: await Notification.requestPermission()
        ↓
grant = 'granted'?
        ↓
const reg = await navigator.serviceWorker.ready
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY_URLBASE64
})
        ↓
await fetch('/api/push/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(sub.toJSON())
})
        ↓
service (Hono): validate endpoint 是 https:// → INSERT INTO push_subscriptions
        ↓
返回 { ok: true }
```

### 6.4 推送新预测（核心事件）

```
/internal/sync 同步脚本检测到新预测行
        ↓
const r = await fetch(`${SELF}/internal/push/broadcast`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': env.INTERNAL_BROADCAST_TOKEN,
  },
  body: JSON.stringify({
    title: '⚽ ' + match.home_team_name + ' vs ' + match.away_team_name + ' 预测已更新',
    body:  'AI 模型: ' + (modelSummary ?? '查看详情'),
    url:   '/matches/' + match.id,
    tag:   'match-' + match.id,  // 10 分钟内同 tag 去重
  })
})
        ↓
push-handlers.broadcast:
  · 鉴权 X-Internal-Token
  · 查 push_recent 表，10 分钟内同 tag 已推过 → skip
  · SELECT endpoint, p256dh, auth FROM push_subscriptions
  · 并发 web-push.sendNotification(s, payload, { vapidDetails })
  · 对 201/202: 静默成功
  · 对 410/404: DELETE WHERE endpoint = ?
  · UPSERT push_recent (tag, pushed_at) VALUES (?, ?)，pushed_at = now()
        ↓
客户端 SW 收到 push 事件:
self.registration.showNotification(title, {
  body, icon: '/icon-192.png', badge: '/badge-72.png',
  tag, data: { url }, requireInteraction: false,
})
```

### 6.5 用户点击通知

```
SW notificationclick 事件:
  event.notification.close()
  const url = event.notification.data.url
  const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const c of allClients) {
    if (c.url.includes(url) && 'focus' in c) return c.focus()
  }
  if (clients.openWindow) return clients.openWindow(url)
  event.waitUntil(promise)
```

## 7. 错误处理

| 场景 | 处理方式 |
|---|---|
| 用户拒绝通知权限 | NotificationBell 灰态显示"在浏览器设置中开启"；不阻塞其他功能 |
| 浏览器不支持 Web Push | `if (!('PushManager' in window)) return null` —— 不渲染按钮 |
| iOS < 16.4 | 检测后不渲染订阅按钮；install 仍生效 |
| SW 注册失败 | 静默 + `console.warn`；主页面无影响 |
| 缓存版本更新 | SW 部署时用新 `CACHE_VERSION`（如 `cuporacle-v3-20260615`）；activate 时 `caches.delete()` 旧版 |
| 离线访问未缓存路径 | 返回 `/offline.html` |
| VAPID 私钥泄漏/丢失 | `wrangler secret put VAPID_PRIVATE_KEY` 重新生成；所有订阅失效，用户需重新订阅 |
| D1 subscribe 写入失败 | 端点 500；客户端保持"未订阅"状态 |
| web-push 返回 410/404 | 删 endpoint 记录 |
| 推送频率爆炸 | broadcast 端点用 D1 表 `push_recent` (tag PRIMARY KEY, pushed_at) 做 10 分钟去重 |
| `/internal/push/broadcast` 鉴权 | `X-Internal-Token` 比对 `INTERNAL_BROADCAST_TOKEN` secret |
| 远程 SVG 缓存无限增长 | flagcdn.com 国旗 SVG：cache-first + LRU 100 条上限（手写 FIFO） |

## 8. 测试

| 层级 | 工具 | 范围 |
|---|---|---|
| Lighthouse PWA 审计 | `npx lighthouse https://cuporacle.pages.dev --view` | installable / manifest / SW / iOS meta 全绿 |
| Chrome DevTools 手动 | Application → Service Workers / Push | SW 生命周期、缓存命中、订阅握手 |
| iOS 真机手动 | Safari → Share → Add to Home Screen → 启动 | splash、自定义状态栏、离线启动 |
| 推送端到端 | 临时脚本 `curl -X POST /internal/push/broadcast` | Android 真机收到系统通知 + 点击跳转 |
| 服务端路由单测 | vitest + 模拟 web-push | subscribe/unsubscribe 输入校验 + 错误码 |
| Build 回归 | `npm run pages:build` | sw.js + icons 进入 `.vercel/output/static/` |
| Service 单测 | `npm run typecheck:service` | Hono handlers 类型正确 |

测试**不在 CI 里强制**（项目当前无 CI）；本地 dev / 部署前手动跑。

## 9. 部署清单

| 步骤 | 命令 / 操作 |
|---|---|
| 1. 生成 VAPID 密钥对 | 一次性 CLI: `npx web-push generate-vapid-keys`，私钥入 `wrangler secret put VAPID_PRIVATE_KEY`，公钥入 `website `wrangler.toml` `[vars]` `NEXT_PUBLIC_VAPID_PUBLIC_KEY` |
| 2. 创建 D1 数据库 | `cd packages/service && wrangler d1 create cuporacle-db`，复制输出 `database_id` 到 `wrangler.toml` 的 `[[d1_databases]]` |
| 3. 应用 D1 迁移 | `wrangler d1 migrations apply DB --remote`（在 `packages/service/`） |
| 4. 部署 service | `npm run deploy:service` |
| 5. 部署 website | `npm run pages:build` + `wrangler pages deploy` |
| 6. 真机验证 | Android Chrome + iOS Safari 各测一次完整流程 |

## 10. 风险与缓解

| 风险 | 缓解 |
|---|---|
| `@cloudflare/next-on-pages` 升级后 SW 行为变化 | SW 是纯静态文件，不依赖构建钩子；影响有限 |
| iOS Safari 行为差异大 | 文档化已知限制（16.4+ 才推）；运行时检测；不依赖推送关键路径 |
| Web Push 投递失败（D1→CF 推送） | 监控 `/internal/push/broadcast` 响应；D1 添加 `last_error` 字段 |
| 推送频次过高 | `tag` 10 分钟去重；可后续加用户级 quiet hours |
| VAPID 公钥泄露 | 公钥本身公开可接受；私钥用 `wrangler secret`，不进 git |

## 11. YAGNI（明确不做）

- iOS 启动画面定制（iOS 自动从 `apple-touch-icon` 生成）
- BackgroundSync API
- 应用徽章 API（`navigator.setAppBadge`）—— 该 API 浏览器覆盖度低
- 推送给特定订阅者（仅全站）
- 桌面端 PWA 启动画面 + 多窗口管理
- Service Worker 的 IndexedDB 状态恢复

## 12. 时间线（预估）

| 阶段 | 估时 |
|---|---|
| 图标生成脚本 + 5 个 PNG | 1h |
| manifest + iOS meta + layout 集成 | 1h |
| 手写 sw.js（precache + 缓存策略） | 3h |
| 离线兜底页 + 验证 | 1h |
| NotificationBell 组件 + lib/push.ts | 2h |
| service: Hono handlers + D1 migration | 2h |
| service: 接入 /internal/sync 广播触发 | 1h |
| 端到端真机测试（Android + iOS） | 2h |
| **合计** | **~13h** |

## 13. 参考

- [Web App Manifest 规范](https://www.w3.org/TR/appmanifest/)
- [Service Worker Lifecycle](https://web.dev/articles/service-worker-lifecycle)
- [Web Push Protocol (RFC 8030)](https://datatracker.ietf.org/doc/html/rfc8030)
- [`web-push` npm 包](https://github.com/web-push-libs/web-push)
- [Cloudflare Pages 静态文件托管](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- 内部基线: `v0.1.0-pre-pwa` git tag
