// CupOracle API — Cloudflare Workers + Hono
// 端点契约与 packages/website/lib/types.ts 对齐
// 数据源:Cloudflare D1 (--local 时用 miniflare 模拟库)

import { Hono } from "hono";
import { cors } from "hono/cors";
import { getMatchDetail, getMatches, getPredictionBundle, getTournament } from "./db";
import { pushRoutes } from "./push-handlers";
import type { MatchStatus } from "./types";

const ALLOWED_ORIGINS = [
  "https://cuporacle.pages.dev",
  "https://cuporacle.com",
  "https://www.cuporacle.com",
  "http://localhost:3000",
];

type Bindings = {
  DB: D1Database;
  // 由 `wrangler secret put SYNC_SECRET` 注入
  // 用来守 /internal/sync 端点,只允许本地 sync 脚本推数据
  SYNC_SECRET: string;
  // Web Push — 由 wrangler secret 注入(Task 14 配齐)
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  INTERNAL_BROADCAST_TOKEN: string;
};
export type Env = Bindings;

const app = new Hono<{ Bindings: Bindings }>();

// CORS — 允许官网和本地开发访问
app.use(
  "*",
  cors({
    origin: (origin) => (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!),
    allowHeaders: ["Content-Type", "Authorization"],
    // GET 是官网用的,POST 是 /internal/sync(本地脚本)
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 86400,
  })
);

// Web Push 路由:订阅/退订/VAPID 公钥/内部广播
app.route("/", pushRoutes);

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
app.get("/api/tournament", async (c) => c.json(await getTournament(c.env.DB)));

// 比赛列表
app.get("/api/matches", async (c) => {
  const status = c.req.query("status") as MatchStatus | undefined;
  return c.json(await getMatches(c.env.DB, status));
});

// 比赛详情
app.get("/api/matches/:id", async (c) => {
  const id = c.req.param("id");
  const detail = await getMatchDetail(c.env.DB, id);
  if (!detail) return c.json({ error: "match not found" }, 404);
  return c.json(detail);
});

// 预测包
app.get("/api/predictions/:id", async (c) => {
  const id = c.req.param("id");
  const bundle = await getPredictionBundle(c.env.DB, id);
  if (!bundle) return c.json({ error: "predictions not found" }, 404);
  return c.json(bundle);
});

// ─── 内部端点:从本地 admin SQLite 同步数据到 D1 ───────────────────────
// 用 SYNC_SECRET 守护,只能本地调
// body 格式: { tables: { matches: [...], predictions: [...], ... } }
const SYNC_TABLES = [
  "matches", "team_form", "h2h", "team_squad",
  "squad_ratings", "predictions", "prediction_models",
] as const;
// D1 batch 限制:statements 50 / vars 100000;最紧的是 vars,按最宽列算
// prediction_models 18 列 × 50 = 900 vars,远低于 100000,稳妥
const SYNC_BATCH = 50;

app.post("/internal/sync", async (c) => {
  const auth = c.req.header("Authorization");
  if (!c.env.SYNC_SECRET || auth !== `Bearer ${c.env.SYNC_SECRET}`) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const body = await c.req.json<{ tables: Record<string, unknown[]> }>();
  if (!body?.tables) return c.json({ error: "missing tables" }, 400);

  const counts: Record<string, number> = {};
  for (const table of SYNC_TABLES) {
    const rows = body.tables[table] ?? [];
    if (rows.length === 0) { counts[table] = 0; continue; }

    // 全量替换:先 DELETE,再分批 INSERT(避免单次 batch 超限)
    await c.env.DB.exec(`DELETE FROM ${table};`);

    const cols = Object.keys(rows[0] as object);
    // SQL 关键字列名(如 "group")必须加双引号
    const quotedCols = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
    const placeholders = cols.map(() => "?").join(",");
    const stmt = c.env.DB.prepare(
      `INSERT INTO ${table} (${quotedCols}) VALUES (${placeholders})`
    );

    let written = 0;
    for (let i = 0; i < rows.length; i += SYNC_BATCH) {
      const chunk = rows.slice(i, i + SYNC_BATCH);
      const bound = chunk.map((r) =>
        stmt.bind(...cols.map((k) => (r as Record<string, unknown>)[k] ?? null))
      );
      await c.env.DB.batch(bound);
      written += chunk.length;
    }
    counts[table] = written;
  }
  return c.json({ ok: true, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) });
});

// 404
app.notFound((c) => c.json({ error: "not found" }, 404));

// 错误兜底
app.onError((err, c) => {
  console.error("unhandled error:", err);
  return c.json({ error: "internal error" }, 500);
});

export default app;
