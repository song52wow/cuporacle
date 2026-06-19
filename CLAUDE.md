# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目是什么

**CupOracle** — 2026 世界杯 AI 预测展示平台。本仓库是官网 + 后端 API 的 **monorepo**，部署在 Cloudflare 生态（Pages + Workers），全部 TypeScript。

**上级目录**（`/Volumes/Extension/song52wow/world-cup/`）下还有独立的 `admin/` 目录（Python FastAPI 后台 + 管理面板）— **它不在本 monorepo 内**，是历史遗留项目；新的 `packages/service`（Cloudflare Workers）正在逐步替代它。

## Monorepo 布局

```
world-cup/website/                 ← git 根，npm workspaces 根
├── package.json                   ← workspaces: ["packages/*"]，所有顶层脚本在这里
├── packages/
│   ├── website/                   ← Next.js 14 官网，部署到 Cloudflare Pages
│   │   ├── app/                   ← App Router (RSC, runtime="edge")
│   │   ├── components/            ← 页面 / 区段 / 详情子组件
│   │   ├── lib/                   ← api.ts (client), mock.ts, types.ts, utils.ts
│   │   ├── next.config.mjs        ← rewrites /api/* → NEXT_PUBLIC_API_BASE
│   │   ├── wrangler.toml          ← Cloudflare Pages 配置（name=cuporacle）
│   │   └── .env.example           ← 本地 env 模板
│   └── service/                   ← Cloudflare Workers API，部署到 Workers
│       ├── src/index.ts           ← Hono 入口
│       ├── src/db.ts              ← D1 查询（比赛/预测数据）
│       ├── src/types.ts           ← 与 website lib/types.ts 对齐（临时各存一份）
│       ├── src/data/              ← 球队/球员 JSON 静态数据
│       ├── src/rag/               ← RAG 向量检索模块
│       ├── migrations/            ← D1 SQL 迁移 + RAG 种子脚本
│       ├── scripts/sync.mjs       ← 从 admin SQLite 同步到 D1
│       └── wrangler.toml          ← Workers 配置（name=cuporacle-service）
├── screenshots/                   ← 设计参考图，已 gitignore
└── .gitignore                     ← **/.next/ **/.vercel/ 防止任何包污染 git
```

## 常用命令

所有命令在 **monorepo 根**运行，使用 npm workspaces。

```bash
# 官网
npm run dev:web           # Next.js dev (http://localhost:3000)
npm run build:web         # next build
npm run pages:build       # next build && next-on-pages (Cloudflare Pages 出包)
npm run pages:dev         # next-on-pages dev (用 Pages 适配器跑)
npm run lint:web

# 后端服务
npm run dev:service       # wrangler dev (http://127.0.0.1:8787)
npm run build:service     # wrangler deploy --dry-run (验证能打包)
npm run deploy:service    # wrangler deploy → Cloudflare Workers
npm run typecheck:service # tsc --noEmit

# 数据同步（从 admin SQLite → D1）
npm run sync              # node scripts/sync.mjs (需 SYNC_SECRET 环境变量)
npm run sync:dry          # 只打印统计，不发请求

# 一次性安装所有 workspaces 依赖
npm install
```

## Website 架构要点

- **App Router + RSC**，所有需要 SSR 的页面**显式声明** `export const runtime = "edge"`（否则 Cloudflare Pages 会 500）。
- **API 调用走代理**：`next.config.mjs` 的 `rewrites()` 把 `/api/*` 转发到 `NEXT_PUBLIC_API_BASE` — 浏览器看到的是同源，免 CORS。构建期内联 `NEXT_PUBLIC_API_BASE`。
- **Mock fallback**：`lib/api.ts` 的 `safeFetch()` 10s 超时后回退 `lib/mock.ts`（D1 冷启动可能较慢）。`NEXT_PUBLIC_USE_MOCK=1` 强制走 mock。
- **状态过滤**：列表页 query `?status=TIMED|FINISHED|...` 走 RSC 直接 fetch，不通过客户端。
- **Tailwind 主题**：深空黑底 + 青→紫渐变 + 霓虹绿强调色；玻璃拟态卡片。色值定义在 `tailwind.config.ts`。

## Service 架构要点

- **Hono** on Cloudflare Workers，`compatibility_flags = ["nodejs_compat"]`。
- **端点**：`/api/tournament`、`/api/matches[?status=]`、`/api/matches/:id`、`/api/predictions/:id`、`/api/teams`、`/api/teams/:slug`、`/api/teams/:slug/players`。
- **CORS**：白名单 `cuporacle.pages.dev`、`cuporacle.com` 变体、`localhost:3000`。
- **数据源**：比赛/预测数据存 Cloudflare D1（`src/db.ts` 查询）；球队/球员数据存 JSON 文件（`src/data/world-cup-*.json`，静态导入）。`src/data.ts` 是旧 mock，已被 D1 替代。
- **数据同步**：`scripts/sync.mjs` 从本地 admin SQLite 读取，通过 `/internal/sync` POST 到 D1（需 `SYNC_SECRET`）。每次 DELETE 整表再 INSERT，远端数据被完全覆盖。
- **Web Push**：`src/push-handlers.ts` 提供订阅/退订/广播端点。VAPID 密钥通过 `wrangler secret put` 注入。广播有 10 分钟去重窗口。
- **RAG（Stage 1）**：`src/rag/` 模块，用 Cloudflare Vectorize + Workers AI embedding（bge-m3）。种子脚本 `migrations/seed-rag-corpora.ts`。

## 部署清单

| 目标 | 命令 | 备注 |
| --- | --- | --- |
| Website → Pages | `npm run pages:build` + `wrangler pages deploy` | 项目名 `cuporacle`（部署到 `cuporacle.pages.dev`） |
| Service → Workers | `npm run deploy:service` | 项目名 `cuporacle-service` |

Cloudflare Dashboard 构建命令：根目录设 `packages/website`，build 命令 `npm run pages:build`。env 设 `NEXT_PUBLIC_API_BASE=https://cuporacle-service.<子域>.workers.dev`。

## 重要踩坑（避免重复犯）

1. **`@cloudflare/next-on-pages` 必须锁版本 `1.13.15`** — 1.13.16+ 要求 Next ≥14.3.0，本项目用 Next 14.2.x 会失败。
2. **`next dev` 与 `next build` 共享 `.next/`** — 禁止同时跑。参见 [[next-dev-vs-build-cache]]。
3. **截图在 `screenshots/`，已 gitignore** — 改设计参考图不要 commit，会被拒。
4. **每个 server page 都要 `export const runtime = "edge"`**，否则 Pages 部署会 500。
5. **TS 类型暂时两份**（`website/lib/types.ts` + `service/src/types.ts`）— 后续抽 `packages/shared-types/` 再统一，**改 schema 时两个文件都要改**。
6. **不要从 website 跨包 import service 内部**（`import "@cuporacle/service/..."`），workspaces 没配 TS project references 会编译失败。

## 改动类型时同步的地方

- 改 API 响应字段 → `website/lib/types.ts` + `service/src/types.ts` + `service/src/db.ts`（查询逻辑）+ `website/lib/api.ts`（消费处）
- 改 D1 schema → `service/migrations/` 新建迁移 + `service/src/db.ts` + `service/src/types.ts` + `website/lib/types.ts`
- 改球队/球员数据 → `service/src/data/world-cup-*.json`（静态导入，不走 D1）
- 改设计参考图 → 放 `screenshots/`，已 gitignore
