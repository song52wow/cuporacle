#!/usr/bin/env node
// 把本地 admin SQLite 的"公开表"同步到 Cloudflare D1。
//
// 用法:
//   node scripts/sync.mjs                                  # 默认连 admin SQLite + 远端 Worker
//   node scripts/sync.mjs --db <path>                      # 指定本地 db 路径
//   node scripts/sync.mjs --service <url>                  # 指定 Worker URL
//   node scripts/sync.mjs --dry-run                        # 只打印统计,不发请求
//   node scripts/sync.mjs --tables matches,predictions     # 只同步指定表
//   node scripts/sync.mjs --force                          # 跳过确认提示
//
// 环境变量:
//   SYNC_SECRET   - 必填,Worker 端 /internal/sync 的 Bearer 令牌
//
// 安全:本脚本会先 DELETE 每张表再 INSERT,远端数据被完全覆盖。
//      llm_provider_config / raw_llm_response / error 永远不同步。

import Database from "better-sqlite3";
import { resolve, isAbsolute } from "node:path";
import { existsSync, statSync } from "node:fs";

// ─── 配置 ────────────────────────────────────────────────────────────
const DEFAULTS = {
  // 相对本脚本的路径,绕两层到 cuporacle/ 根,再进 admin
  db: "../../../../admin/backend/worldcup.db",
  service: "https://cuporacle-service.song52wow.workers.dev",
  secret: process.env.SYNC_SECRET ?? "",
  dryRun: false,
  force: false,
  onlyTables: null,  // null = 全部
};

const ALL_TABLES = [
  "matches", "team_form", "h2h", "team_squad",
  "squad_ratings", "predictions", "prediction_models",
];

// 这些列永远不上 D1(API key / 内部调试)
const STRIP_COLS = {
  predictions: new Set(["raw_llm_response"]),
  prediction_models: new Set(["raw_llm_response", "error"]),
};

// ─── 解析 CLI ────────────────────────────────────────────────────────
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return def;
  return process.argv[i + 1];
}

const opts = {
  db: isAbsolute(arg("db", DEFAULTS.db)) ? arg("db", DEFAULTS.db) : resolve(DEFAULTS.db.replace(/^\.\.\//, ""), process.cwd()),
  service: arg("service", DEFAULTS.service),
  secret: DEFAULTS.secret,
  dryRun: process.argv.includes("--dry-run"),
  force: process.argv.includes("--force"),
  onlyTables: (arg("tables", "") || "").split(",").map(s => s.trim()).filter(Boolean),
};

// 解析 db 路径(相对于脚本所在目录)
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 从 packages/service/scripts/ 跳到 ../../../admin/backend/worldcup.db
const defaultDb = resolve(__dirname, "../../../../admin/backend/worldcup.db");
opts.db = isAbsolute(arg("db", "")) ? arg("db", "") : (arg("db") ? resolve(process.cwd(), arg("db")) : defaultDb);

const tables = opts.onlyTables.length ? opts.onlyTables : ALL_TABLES;

// ─── 校验 ────────────────────────────────────────────────────────────
if (!opts.secret && !opts.dryRun) {
  console.error("❌ 必须设置 SYNC_SECRET 环境变量(或用 --dry-run 预览)");
  console.error("   远端 secret 怎么生成:");
  console.error("     cd packages/service && npx wrangler secret put SYNC_SECRET");
  process.exit(1);
}
if (!existsSync(opts.db)) {
  console.error(`❌ 找不到本地 SQLite: ${opts.db}`);
  console.error(`   用 --db <path> 指定,或检查 admin/backend/worldcup.db 是否存在`);
  process.exit(1);
}
const sizeMb = (statSync(opts.db).size / 1024 / 1024).toFixed(2);
console.log(`📂 本地 DB:  ${opts.db}  (${sizeMb} MB)`);
console.log(`🌐 远端:     ${opts.service}/internal/sync`);
console.log(`📋 同步表:   ${tables.join(", ")}`);

// ─── 读本地 SQLite ───────────────────────────────────────────────────
const db = new Database(opts.db, { readonly: true });
const payload = { tables: {} };
let totalRows = 0;

console.log(`\n=== 扫描 ===`);
for (const table of tables) {
  // 表可能不存在(比如本地 db 还没初始化完),跳过
  const exists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
  ).get(table);
  if (!exists) {
    console.log(`  ${table.padEnd(20)} ⚠️  本地表不存在,跳过`);
    continue;
  }
  const allCols = db.prepare(`PRAGMA table_info(${table})`).all().map(r => r.name);
  const cols = allCols.filter(c => !STRIP_COLS[table]?.has(c));
  // 用显式列名 SELECT,顺序由 PRAGMA 决定(和 D1 一致)
  const rows = db.prepare(
    `SELECT ${cols.map(c => `"${c.replace(/"/g, '""')}"`).join(",")} FROM ${table}`
  ).all();
  payload.tables[table] = rows;
  totalRows += rows.length;
  const stripped = STRIP_COLS[table] ? ` (剥离 ${[...STRIP_COLS[table]].join(",")})` : "";
  console.log(`  ${table.padEnd(20)} ${String(rows.length).padStart(4)} 行 × ${cols.length} 列${stripped}`);
}

db.close();

console.log(`\n总计 ${totalRows} 行,${Object.keys(payload.tables).length} 张表`);
const jsonSizeKb = (JSON.stringify(payload).length / 1024).toFixed(1);
console.log(`Payload: ${jsonSizeKb} KB`);

if (opts.dryRun) {
  console.log("\n[DRY RUN] 跳过推送。");
  process.exit(0);
}

// ─── 确认(非 --force 时)──────────────────────────────────────────────
if (!opts.force) {
  console.log(`\n⚠️  即将 DELETE 远端 D1 的 ${tables.length} 张表并重新写入。`);
  process.stdout.write("确认推送? (yes/no): ");
  const answer = await new Promise((resolve) => {
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (d) => { buf += d; resolve(buf.trim().toLowerCase()); });
    process.stdin.resume();
  });
  if (answer !== "yes" && answer !== "y") {
    console.log("已取消。");
    process.exit(0);
  }
}

// ─── POST 推送 ──────────────────────────────────────────────────────
console.log(`\n🚀 推送到 ${opts.service}/internal/sync ...`);
const t0 = Date.now();
const res = await fetch(`${opts.service}/internal/sync`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${opts.secret}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
const ms = Date.now() - t0;

if (!res.ok) {
  const txt = await res.text();
  console.error(`❌ HTTP ${res.status} (${ms}ms):`);
  console.error(txt);
  process.exit(1);
}

const result = await res.json();
console.log(`\n✅ 同步成功 (${ms}ms,共 ${result.total} 行):`);
for (const [t, n] of Object.entries(result.counts)) {
  console.log(`  ${t.padEnd(20)} ${n} 行`);
}
