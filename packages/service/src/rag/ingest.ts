// RAG ingest — 把 RagChunk[] 写入 D1 (rag_documents) + Vectorize
//
// 设计:
//   - writeToD1(db, chunks)        — 同步写 SQLite/D1,使用 INSERT OR REPLACE 做幂等
//   - writeToVectorize(index, vecs) — upsert vectors(Vectorize API 自身幂等)
//   - buildVectors(chunks, embed)  — 用 embedder 把 chunk text → vector
//   - runIngest(opts)              — 端到端编排,返回 IngestStats
//
// 适配:
//   - D1: chunk_id 是 UNIQUE 键,重复执行幂等
//   - Vectorize: upsert by id 幂等
//   - 本地开发:用 better-sqlite3 模拟 D1(MIT license,D1 兼容大部分 SQL)
//
// 注意:不直接依赖 Cloudflare Workers runtime,这样 seed 脚本能在 Node 里跑

import { createHash } from "node:crypto";
import type { D1Database } from "@cloudflare/workers-types";
import type {
  Embedder,
  IngestStats,
  RagChunk,
  RagDocumentRow,
  RagVector,
} from "./types";

/** SQLite 兼容的最小接口 — D1Database 和 better-sqlite3 Database 都覆盖 */
export interface SqliteLike {
  prepare(sql: string): {
    bind(...args: unknown[]): unknown;
    run(...args: unknown[]): unknown;
    all<T = unknown>(...args: unknown[]): T[];
    first<T = unknown>(...args: unknown[]): T | null;
  };
  exec(sql: string): Promise<unknown> | unknown;
  batch?(statements: unknown[]): Promise<unknown>;
}

const D1_BATCH_LIMIT = 50; // 与现有 /internal/sync 一致,稳妥

/** sha256 hex 前 16 位 — 与 chunker 保持一致 */
function shortHash(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);
}

/** chunk → D1 row */
export function chunkToRow(c: RagChunk, contentHash: string): RagDocumentRow {
  return {
    chunk_id: c.chunkId,
    url: null,
    title: c.metadata.sourceSection,
    source_name: c.metadata.sourceFile.split("/").pop() ?? c.metadata.sourceFile,
    published_at: null,
    fetched_at: c.metadata.ingestedAt,
    raw_text: c.text,
    content_hash: contentHash,
    entity_type: c.metadata.entityType,
    entity_id: c.metadata.entityId,
    tournament: c.metadata.tournament ?? null,
    language: c.metadata.language,
    source_file: c.metadata.sourceFile,
    source_section: c.metadata.sourceSection,
    related_entities: JSON.stringify(c.metadata.relatedEntities),
    version: c.metadata.version,
    chunk_index: c.metadata.chunkIndex,
    chunk_total: c.metadata.chunkTotal,
    metadata_json: null,
  };
}

/** chunk → Vectorize vector record */
export async function buildVectors(
  chunks: RagChunk[],
  embed: Embedder
): Promise<RagVector[]> {
  const out: RagVector[] = [];
  for (const c of chunks) {
    const values = await embed.embed(c.text);
    out.push({
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
    });
  }
  return out;
}

const UPSERT_SQL = `
INSERT OR REPLACE INTO rag_documents (
  chunk_id, url, title, source_name, published_at, fetched_at,
  raw_text, content_hash, entity_type, entity_id, tournament, language,
  source_file, source_section, related_entities, version,
  chunk_index, chunk_total, metadata_json
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

/** 写 chunks 到 SQLite/D1,幂等 */
export async function writeToSqlite(
  db: SqliteLike,
  chunks: RagChunk[]
): Promise<number> {
  let written = 0;
  const stmt = db.prepare(UPSERT_SQL);

  for (let i = 0; i < chunks.length; i += D1_BATCH_LIMIT) {
    const batch = chunks.slice(i, i + D1_BATCH_LIMIT);
    const bound = batch.map((c) => {
      const row = chunkToRow(c, shortHash(c.text));
      return stmt.bind(
        row.chunk_id,
        row.url,
        row.title,
        row.source_name,
        row.published_at,
        row.fetched_at,
        row.raw_text,
        row.content_hash,
        row.entity_type,
        row.entity_id,
        row.tournament,
        row.language,
        row.source_file,
        row.source_section,
        row.related_entities,
        row.version,
        row.chunk_index,
        row.chunk_total,
        row.metadata_json
      );
    });

    // D1 / better-sqlite3 都支持 batch
    if (db.batch) {
      await db.batch(bound);
    } else {
      // fallback: 逐条
      for (const b of bound) await b;
    }
    written += batch.length;
  }
  return written;
}

/** 写 vectors 到 Vectorize index,幂等 */
export async function writeToVectorize(
  index: VectorizeLike,
  vecs: RagVector[]
): Promise<number> {
  let written = 0;
  const BATCH = 100; // Vectorize upsert 上限
  for (let i = 0; i < vecs.length; i += BATCH) {
    const batch = vecs.slice(i, i + BATCH);
    await index.upsert(batch);
    written += batch.length;
  }
  return written;
}

/** Vectorize 最小接口 */
export interface VectorizeLike {
  upsert(vectors: RagVector[]): Promise<{ mutationId?: string; ids?: string[] }>;
  query(opts: {
    vector: number[];
    topK: number;
    filter?: Record<string, string | number | boolean>;
    returnMetadata?: boolean;
  }): Promise<{ matches: Array<{ id: string; score: number; metadata?: Record<string, unknown> }> }>;
}

// ─── 端到端 ─────────────────────────────────────────────────────
export interface IngestOptions {
  chunks: RagChunk[];
  embed: Embedder;
  db?: SqliteLike;
  index?: VectorizeLike;
  skipVectors?: boolean; // dev 用:只写 D1
  skipDb?: boolean; // dev 用:只写 Vectorize
  onProgress?: (done: number, total: number, label: string) => void;
}

export async function runIngest(opts: IngestOptions): Promise<IngestStats> {
  const t0 = Date.now();
  const { chunks, embed, db, index, skipVectors, skipDb, onProgress } = opts;

  // 1) D1
  let d1RowsWritten = 0;
  if (!skipDb && db) {
    d1RowsWritten = await writeToSqlite(db, chunks);
    onProgress?.(d1RowsWritten, chunks.length, "d1");
  }

  // 2) Vectorize
  let vectorsUpserted = 0;
  if (!skipVectors && index) {
    const vecs = await buildVectors(chunks, embed);
    onProgress?.(0, vecs.length, "vectorize");
    vectorsUpserted = await writeToVectorize(index, vecs);
    onProgress?.(vectorsUpserted, vecs.length, "vectorize");
  }

  // 3) 统计
  const byEntityType: Record<string, number> = {};
  for (const c of chunks) {
    byEntityType[c.metadata.entityType] = (byEntityType[c.metadata.entityType] ?? 0) + 1;
  }

  return {
    totalChunks: chunks.length,
    byEntityType,
    d1RowsWritten,
    vectorsUpserted,
    errors: 0,
    durationMs: Date.now() - t0,
  };
}

// ─── Hash-based stub embedder(本地 dev 用)──────────────────────
/** 确定性 hash → 1024 维 [-1, 1] 伪向量;非语义,仅供 pipeline 测试 */
export class HashStubEmbedder implements Embedder {
  readonly dim = 1024;
  async embed(text: string): Promise<number[]> {
    const out = new Array<number>(this.dim).fill(0);
    // 把文本按 8 字符一段算 hash,每段贡献几个位置
    for (let i = 0; i < text.length; i += 8) {
      const seg = text.slice(i, i + 8);
      const h = createHash("sha256").update(seg).digest();
      for (let j = 0; j < 4; j++) {
        const idx = (h[j]! * 256 + h[j + 1]!) % this.dim;
        const val = (h[j + 2]! / 255) * 2 - 1;
        out[idx] = (out[idx] ?? 0) + val;
      }
    }
    // L2 归一化
    const norm = Math.sqrt(out.reduce((s, x) => s + x * x, 0)) || 1;
    return out.map((x) => x / norm);
  }
}

// ─── Workers AI embedder(production 用)─────────────────────────
/** 用 Workers AI bge-m3 算 embedding;Stage 3 接入 */
export class WorkersAiEmbedder implements Embedder {
  readonly dim = 1024;
  constructor(private ai: Ai) {}
  async embed(text: string): Promise<number[]> {
    const resp = (await this.ai.run("@cf/baai/bge-m3", {
      text: [text],
    })) as { data?: number[][] };
    const vec = resp.data?.[0];
    if (!vec) throw new Error("Workers AI returned no embedding");
    return vec;
  }
}

// re-export D1 type 给消费侧用
export type { D1Database };
