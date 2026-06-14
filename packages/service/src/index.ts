// CupOracle API — Cloudflare Workers + Hono
// 端点契约与 packages/website/lib/types.ts 对齐

import { Hono } from "hono";
import { cors } from "hono/cors";
import { getMatchDetail, getMatches, getPredictionBundle, getTournament } from "./data";
import type { MatchStatus } from "./types";

const ALLOWED_ORIGINS = [
  "https://cuporacle.pages.dev",
  "https://cuporacle.com",
  "https://www.cuporacle.com",
  "http://localhost:3000",
];

type Bindings = {
  // 后续接 D1 / KV / Workers AI 时在这里声明
  // DB: D1Database;
  // CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS — 允许官网和本地开发访问
app.use(
  "*",
  cors({
    origin: (origin) => (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "OPTIONS"],
    maxAge: 86400,
  })
);

// 健康检查 / 根路径
app.get("/", (c) =>
  c.json({
    service: "cuporacle-service",
    version: "0.1.0",
    runtime: "cloudflare-workers",
    docs: "/api",
  })
);

// 列出 API
app.get("/api", (c) =>
  c.json({
    endpoints: [
      "GET /api/tournament",
      "GET /api/matches?status=SCHEDULED|TIMED|IN_PLAY|FINISHED",
      "GET /api/matches/:id",
      "GET /api/predictions/:id",
    ],
  })
);

// 锦标赛概览
app.get("/api/tournament", (c) => c.json(getTournament()));

// 比赛列表
app.get("/api/matches", (c) => {
  const status = c.req.query("status") as MatchStatus | undefined;
  return c.json(getMatches(status));
});

// 比赛详情
app.get("/api/matches/:id", (c) => {
  const id = c.req.param("id");
  const detail = getMatchDetail(id);
  if (!detail) return c.json({ error: "match not found" }, 404);
  return c.json(detail);
});

// 预测包
app.get("/api/predictions/:id", (c) => {
  const id = c.req.param("id");
  const bundle = getPredictionBundle(id);
  if (!bundle) return c.json({ error: "predictions not found" }, 404);
  return c.json(bundle);
});

// 404
app.notFound((c) => c.json({ error: "not found" }, 404));

// 错误兜底
app.onError((err, c) => {
  console.error("unhandled error:", err);
  return c.json({ error: "internal error" }, 500);
});

export default app;
