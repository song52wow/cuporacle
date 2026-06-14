# @cuporacle/service

CupOracle 后端 API 服务 — **Cloudflare Workers + Hono (TypeScript)**。

## 技术栈

- **运行时**：Cloudflare Workers（V8 isolates，全球边缘节点）
- **框架**：[Hono](https://hono.dev/) 4.x — 极简、Workers 友好
- **语言**：TypeScript（与 `@cuporacle/website` 共享类型）
- **部署**：`wrangler deploy` → Cloudflare Workers

## 为什么选 TypeScript + Workers

- 跟前端同语言，避免 Python 维护栈分裂
- Cloudflare Workers 边缘节点延迟低，官网静态资源 + API 同网络
- Workers 免费额度 100k req/day，足够 MVP
- 后续接 **D1**（SQLite）、**Workers AI**（LLM）、**KV** 都不需要换栈

## 端点契约

| 方法 | 路径 | 返回类型 | 用途 |
| --- | --- | --- | --- |
| GET | `/api/tournament` | `Tournament` | 锦标赛概览（总数、已完赛、待开赛） |
| GET | `/api/matches?status=...` | `MatchListResponse` | 比赛列表（可选状态过滤） |
| GET | `/api/matches/:id` | `MatchDetailResponse` | 单场比赛详情（含阵容、伤停、预测状态） |
| GET | `/api/predictions/:id` | `PredictionBundle` | 该比赛的 4 模型预测包 |

类型与 `packages/website/lib/types.ts` 严格对齐。
未来会抽到 `packages/shared-types/`。

## 本地开发

```bash
# 启动 worker（监听 8787）
npm run dev:service

# 类型检查
npm run typecheck:service
```

## 部署

```bash
# 1. 登录（首次）
npx wrangler login

# 2. 部署
npm run deploy:service

# 3. 部署到 preview 环境
npx wrangler deploy --env preview
```

服务名：`cuporacle-service`（生产）/ `cuporacle-service-preview`（预览）。

## 数据来源

**当前阶段**：`src/data.ts` 提供 mock 数据，shape 与原 admin FastAPI 完全一致。
官网从 `NEXT_PUBLIC_API_BASE` 指向此服务后，**不会再回退**到官网自带的 mock。

**下一步**：接 Cloudflare D1 存真实比赛 / 预测数据。
`wrangler.toml` 已留好 D1 绑定位置（注释）。

## CORS

允许来源（见 `src/index.ts`）：
- `https://cuporacle.pages.dev`（Pages 预览）
- `https://cuporacle.com` / `https://www.cuporacle.com`（生产域名，待定）
- `http://localhost:3000`（Next.js 开发）

后续会改成读 env 变量，方便不同环境配置。
