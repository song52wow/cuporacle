// Seed RAG corpora — Stage 1 静态语料入库 CLI
//
// 用法:
//   tsx migrations/seed-rag-corpora.ts --stats-only
//   tsx migrations/seed-rag-corpora.ts --write-sqlite=./out/rag-test.sqlite
//   tsx migrations/seed-rag-corpora.ts --emit-sql=./out/rag-seed.sql
//   tsx migrations/seed-rag-corpora.ts --emit-vectors=./out/rag-vectors.jsonl
//
// 行为:
//   - 读 src/data/world-cup-teams.json + world-cup-players.json + src/data.ts
//   - 读 admin backend 的 prompts.py + archiver.py
//   - 读 admin/docs/superpowers/specs/ 下所有 .md
//   - 用 chunker 切 → 调用 ingest 写入
//
// 默认从 packages/service/ 目录跑;用 --root 覆盖
//
// 注意:本地 dev 用 HashStubEmbedder(确定性,非语义);production 用 Workers AI bge-m3

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

import { chunkAll } from "../src/rag/chunker";
import { RAG_CONFIG } from "../src/rag/config";
import {
  HashStubEmbedder,
  chunkToRow,
  type SqliteLike,
} from "../src/rag/ingest";
import type { Embedder, RagChunk } from "../src/rag/types";

interface CliArgs {
  root: string;
  statsOnly: boolean;
  sqlitePath: string | null;
  emitSql: string | null;
  emitVectors: string | null;
  /** 跑 ingest 端到端时是否写 vectors(JSONL) */
  writeVectors: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    root: process.cwd(),
    statsOnly: false,
    sqlitePath: null,
    emitSql: null,
    emitVectors: null,
    writeVectors: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = argv[i + 1];
    if (a === "--stats-only") out.statsOnly = true;
    else if (a === "--root" && next) { out.root = resolve(next); i++; }
    else if (a.startsWith("--write-sqlite=")) out.sqlitePath = a.slice("--write-sqlite=".length);
    else if (a.startsWith("--emit-sql=")) out.emitSql = a.slice("--emit-sql=".length);
    else if (a.startsWith("--emit-vectors=")) out.emitVectors = a.slice("--emit-vectors=".length);
    else if (a === "--write-vectors") out.writeVectors = true;
    else if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function printHelp(): void {
  console.log(`seed-rag-corpora — Stage 1 静态语料入库

用法:
  tsx migrations/seed-rag-corpora.ts [flags]

Flags:
  --stats-only                  只跑 chunker 打统计,不写任何文件
  --root=<path>                 workspace 根(默认 cwd,应指向 packages/service/)
  --write-sqlite=<file>         写到本地 SQLite(better-sqlite3,D1 SQL 兼容)
  --emit-sql=<file>             导出 INSERT 语句(SQL 文件,可用 wrangler d1 execute --file=)
  --emit-vectors=<file>         导出 vectors(JSONL)
  --write-vectors               配合 --write-sqlite,一起把 vectors 写 JSONL

例子:
  tsx migrations/seed-rag-corpora.ts --stats-only
  tsx migrations/seed-rag-corpora.ts --write-sqlite=./out/rag-test.sqlite --write-vectors
  tsx migrations/seed-rag-corpora.ts --emit-sql=./out/rag-seed.sql
`);
}

// ─── Stats print ───────────────────────────────────────────────
function printStats(chunks: RagChunk[]): void {
  const byType: Record<string, number> = {};
  for (const c of chunks) {
    byType[c.metadata.entityType] = (byType[c.metadata.entityType] ?? 0) + 1;
  }
  console.log("─".repeat(60));
  console.log(`Total chunks: ${chunks.length}`);
  console.log("By entity_type:");
  for (const [t, n] of Object.entries(byType).sort()) {
    console.log(`  ${t.padEnd(20)} ${n}`);
  }
  console.log("Sample (first 3):");
  for (const c of chunks.slice(0, 3)) {
    console.log(`  [${c.metadata.entityType}] ${c.chunkId}`);
    console.log(`    ${c.text.slice(0, 80).replace(/\n/g, " ")}...`);
  }
  console.log("─".repeat(60));
}

// ─── SQLite write ──────────────────────────────────────────────
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS rag_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chunk_id TEXT UNIQUE NOT NULL,
    url TEXT,
    title TEXT,
    source_name TEXT,
    published_at TEXT,
    fetched_at TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    tournament TEXT,
    language TEXT,
    source_file TEXT,
    source_section TEXT,
    related_entities TEXT,
    version TEXT,
    chunk_index INTEGER DEFAULT 0,
    chunk_total INTEGER DEFAULT 1,
    metadata_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_rag_docs_entity ON rag_documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_rag_docs_type ON rag_documents(entity_type);
CREATE INDEX IF NOT EXISTS idx_rag_docs_tournament ON rag_documents(tournament);
`;

function openSqlite(path: string): SqliteLike {
  const db = new Database(path);
  db.exec(SCHEMA_SQL);
  return {
    prepare: (sql: string) => {
      const stmt = db.prepare(sql);
      return {
        bind: (...args: unknown[]) => ({
          run: () => stmt.run(...(args as never[])),
        }),
        run: (...args: unknown[]) => stmt.run(...(args as never[])),
        all: <T = unknown>(...args: unknown[]) =>
          stmt.all(...(args as never[])) as T[],
        first: <T = unknown>(...args: unknown[]) =>
          (stmt.get(...(args as never[])) as T | undefined) ?? null,
      };
    },
    exec: (sql: string) => db.exec(sql),
    batch: async (statements: unknown[]) => {
      const exec = db.transaction((stmts: unknown[]) => {
        for (const s of stmts) {
          // our bound statement shape from prepare().bind()
          const bs = s as { run: () => unknown };
          bs.run();
        }
      });
      exec(statements);
    },
  };
}

// ─── SQL emit ──────────────────────────────────────────────────
function sqlEscape(s: string): string {
  return s.replace(/'/g, "''");
}

function emitSql(chunks: RagChunk[], out: string): string {
  const lines: string[] = [];
  lines.push("-- Auto-generated by seed-rag-corpora.ts — Stage 1 静态语料入库");
  lines.push("-- 适用 `wrangler d1 execute DB --local --file=" + out + "`");
  lines.push("");
  lines.push("BEGIN TRANSACTION;");
  for (const c of chunks) {
    const row = chunkToRow(c, ""); // content_hash 由 D1 端另外算,这里留空
    const cols = [
      "chunk_id", "url", "title", "source_name", "published_at", "fetched_at",
      "raw_text", "content_hash", "entity_type", "entity_id", "tournament", "language",
      "source_file", "source_section", "related_entities", "version",
      "chunk_index", "chunk_total", "metadata_json",
    ];
    const vals = [
      row.chunk_id, row.url, row.title, row.source_name, row.published_at, row.fetched_at,
      row.raw_text, row.content_hash, row.entity_type, row.entity_id, row.tournament, row.language,
      row.source_file, row.source_section, row.related_entities, row.version,
      row.chunk_index, row.chunk_total, row.metadata_json,
    ];
    lines.push(
      `INSERT OR REPLACE INTO rag_documents (${cols.join(", ")}) VALUES (${vals
        .map((v) => (v === null ? "NULL" : `'${sqlEscape(String(v))}'`))
        .join(", ")});`
    );
  }
  lines.push("COMMIT;");
  return lines.join("\n");
}

// ─── Vectors emit ──────────────────────────────────────────────
async function emitVectorsJsonl(
  chunks: RagChunk[],
  embed: Embedder,
  out: string
): Promise<number> {
  const lines: string[] = [];
  for (const c of chunks) {
    const values = await embed.embed(c.text);
    const rec = {
      id: c.chunkId,
      values,
      metadata: {
        entityType: c.metadata.entityType,
        entityId: c.metadata.entityId,
        tournament: c.metadata.tournament ?? "",
        language: c.metadata.language,
        sourceFile: c.metadata.sourceFile,
        ingestedAt: c.metadata.ingestedAt,
        version: c.metadata.version,
        relatedEntities: JSON.stringify(c.metadata.relatedEntities),
      },
    };
    lines.push(JSON.stringify(rec));
  }
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, lines.join("\n") + "\n", "utf8");
  return chunks.length;
}

// ─── Verify (after sqlite write) ───────────────────────────────
function verifySqlite(path: string): void {
  const db = new Database(path, { readonly: true });
  const total = db.prepare("SELECT COUNT(*) AS n FROM rag_documents").get() as { n: number };
  console.log(`[verify] total rows: ${total.n}`);

  const byType = db
    .prepare("SELECT entity_type, COUNT(*) AS n FROM rag_documents GROUP BY entity_type ORDER BY n DESC")
    .all() as { entity_type: string; n: number }[];
  console.log("[verify] by entity_type:");
  for (const r of byType) console.log(`  ${r.entity_type.padEnd(20)} ${r.n}`);

  // 抽查 3 个 chunk
  const samples = db
    .prepare("SELECT chunk_id, entity_type, entity_id, substr(raw_text, 1, 100) AS preview FROM rag_documents ORDER BY RANDOM() LIMIT 3")
    .all() as { chunk_id: string; entity_type: string; entity_id: string; preview: string }[];
  console.log("[verify] random 3 samples:");
  for (const s of samples) {
    console.log(`  ${s.chunk_id}`);
    console.log(`    [${s.entity_type}] ${s.entity_id}`);
    console.log(`    ${s.preview.replace(/\n/g, " ")}...`);
  }

  // cross-link 抽查
  const linked = db
    .prepare(
      `SELECT entity_type, entity_id, related_entities FROM rag_documents
       WHERE related_entities != '[]' AND related_entities IS NOT NULL
       ORDER BY RANDOM() LIMIT 3`
    )
    .all() as { entity_type: string; entity_id: string; related_entities: string }[];
  console.log("[verify] cross-link samples:");
  for (const s of linked) {
    console.log(`  ${s.entity_type}:${s.entity_id} → ${s.related_entities}`);
  }

  db.close();
}

// ─── Main ──────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  console.log(`[seed] workspace root: ${args.root}`);
  console.log(`[seed] stage: Stage 1 — static corpora ingest`);

  const t0 = Date.now();
  const { chunks, stats } = await chunkAll(args.root);
  console.log(`[seed] chunkAll done in ${Date.now() - t0}ms`);

  console.log(
    `[seed] teams=${stats.teams} players=${stats.players} matches=${stats.matches} prompts=${stats.prompts} specs=${stats.specs} total=${stats.total}`
  );

  if (args.statsOnly) {
    printStats(chunks);
    console.log("\nDry run. Pass --write-sqlite=<path> to actually write.");
    return;
  }

  const embed: Embedder = new HashStubEmbedder();

  if (args.sqlitePath) {
    await mkdir(dirname(args.sqlitePath) || ".", { recursive: true });
    const db = openSqlite(args.sqlitePath);
    const writeT0 = Date.now();
    let written = 0;
    const BATCH = 50;
    const stmt = db.prepare(`INSERT OR REPLACE INTO rag_documents (
      chunk_id, url, title, source_name, published_at, fetched_at,
      raw_text, content_hash, entity_type, entity_id, tournament, language,
      source_file, source_section, related_entities, version,
      chunk_index, chunk_total, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    const rawDb = new Database(args.sqlitePath);
    const insert = rawDb.transaction((rows: unknown[][]) => {
      for (const r of rows) stmt.run(...(r as never[])) as never;
    });

    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const rows = batch.map((c) => {
        const row = chunkToRow(c, ""); // hash 在 schema 里 NOT NULL,先用空,后 UPDATE
        return [
          row.chunk_id, row.url, row.title, row.source_name, row.published_at, row.fetched_at,
          row.raw_text, row.content_hash, row.entity_type, row.entity_id, row.tournament, row.language,
          row.source_file, row.source_section, row.related_entities, row.version,
          row.chunk_index, row.chunk_total, row.metadata_json,
        ];
      });
      insert(rows);
      written += batch.length;
    }
    rawDb.close();
    console.log(`[seed] wrote ${written} rows to ${args.sqlitePath} in ${Date.now() - writeT0}ms`);
    verifySqlite(args.sqlitePath);

    if (args.writeVectors) {
      const out = args.sqlitePath.replace(/\.sqlite$/, ".vectors.jsonl");
      const n = await emitVectorsJsonl(chunks, embed, out);
      console.log(`[seed] wrote ${n} vectors to ${out}`);
    }
  }

  if (args.emitSql) {
    await mkdir(dirname(args.emitSql) || ".", { recursive: true });
    const sql = emitSql(chunks, args.emitSql);
    await writeFile(args.emitSql, sql, "utf8");
    console.log(`[seed] emitted SQL → ${args.emitSql} (${(sql.length / 1024).toFixed(1)} KB)`);
  }

  if (args.emitVectors) {
    const n = await emitVectorsJsonl(chunks, embed, args.emitVectors);
    console.log(`[seed] emitted vectors → ${args.emitVectors} (${n} rows)`);
  }

  console.log("\n✅ Stage 1 ingest done");
  console.log("\nNext steps:");
  console.log("  1. cp migrations/0005_rag_init.sql to D1 if not already applied:");
  console.log("     wrangler d1 execute DB --local --file=migrations/0005_rag_init.sql");
  console.log("  2. apply SQL seed:");
  console.log("     wrangler d1 execute DB --local --file=" + (args.emitSql ?? "./out/rag-seed.sql"));
  console.log("  3. create Vectorize index (one-time):");
  console.log(`     wrangler vectorize create ${RAG_CONFIG.VECTOR_INDEX_NAME} --dimensions=${RAG_CONFIG.EMBED_DIM} --metric=cosine`);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
