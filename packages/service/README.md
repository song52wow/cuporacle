# @cuporacle/service

后端 API 服务包（占位）。

## 当前状态

此包为 monorepo 骨架的一部分，**尚未实现**。

## 计划

- 替代 `../../../admin/`（独立 Python FastAPI 项目）
- 技术栈待定：
  - **方案 A**：保留 Python FastAPI，部署到 Railway / Fly.io
  - **方案 B**：重写为 TypeScript（Hono / itty-router），部署到 Cloudflare Workers
- 与 `@cuporacle/website` 共享类型（待 `packages/shared-types/` 包建立后）

## 临时用途

目前 `dev` / `build` / `lint` 命令都是占位 echo，仅用于让 npm workspaces 解析通过，不影响主前端包的部署。