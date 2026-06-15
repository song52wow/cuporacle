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
