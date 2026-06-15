// Hono 路由:订阅/退订/VAPID 公钥/广播
// 广播由 /internal/sync 同步完成后调用 — 每次调用对应一个未结束比赛
// (sync 脚本遍历未结束比赛,逐个调一次 broadcast),tag = match-<id>,
// 由 push_recent 表去重(10 分钟)。

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
// 鉴权: X-Internal-Token 匹配 env.INTERNAL_BROADCAST_TOKEN 或 env.SYNC_SECRET 任一即可
// (sync.mjs 是本地脚本,无法访问 wrangler secret 注入的 INTERNAL_BROADCAST_TOKEN,
//  用 SYNC_SECRET 作为 fallback,sync.mjs 已部署为 Cloudflare secret)
pushRoutes.post("/internal/push/broadcast", async (c) => {
  const token = c.req.header("X-Internal-Token");
  const validTokens = [c.env.INTERNAL_BROADCAST_TOKEN, c.env.SYNC_SECRET].filter(Boolean);
  if (!token || !validTokens.includes(token)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  let payload: BroadcastPayload;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  if (!payload.title || !payload.body || !payload.url || !payload.tag) {
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
