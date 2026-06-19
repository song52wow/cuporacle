// RAG 共享类型 — 跨 chunker / ingest / retrieve 复用
// 与 admin/backend/app/rag/* 语义对齐,但用 TypeScript 表达

/** 静态语料中的实体类型 */
export type EntityType =
  | "team"
  | "player"
  | "match"
  | "prompt"
  | "spec"
  | "plan"
  | "schema"
  | "api_spec"
  | "test_spec"
  | "external_api_doc"
  | "note"
  | "config"
  | "ts_types"
  | "code_narrative";

/** 一个语义单元(队 / 球员 / 比赛 / spec 章节 / prompt 等) */
export interface RagChunk {
  /** 稳定 id — Vectorize vector id,形如 "team-arg-v1" / "player-225561-v1" */
  chunkId: string;

  /** chunk 全文,UTF-8,中文/英文 */
  text: string;

  /** 元数据 — 同时写到 D1 rag_documents 和 Vectorize metadata */
  metadata: {
    entityType: EntityType;
    entityId: string;
    tournament?: string | null;
    language: "zh" | "en";
    sourceFile: string;
    sourceSection: string;
    ingestedAt: string;
    version: string;
    relatedEntities: string[]; // ["team:arg", "match:g-a-1"]
    chunkIndex: number;
    chunkTotal: number;
  };
}

/** Chunk → D1 rag_documents 行 */
export interface RagDocumentRow {
  chunk_id: string;
  url: string | null;
  title: string | null;
  source_name: string | null;
  published_at: string | null;
  fetched_at: string;
  raw_text: string;
  content_hash: string;
  entity_type: EntityType;
  entity_id: string;
  tournament: string | null;
  language: string | null;
  source_file: string | null;
  source_section: string | null;
  related_entities: string | null; // JSON
  version: string | null;
  chunk_index: number;
  chunk_total: number;
  metadata_json: string | null;
}

/** Chunk → Vectorize vector */
export interface RagVector {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
}

/** Embedding 函数 — Stage 1 用 hash 桩,Stage 3 切到 Workers AI */
export interface Embedder {
  embed(text: string): Promise<number[]>;
  dim: number;
}

/** Ingest 统计 */
export interface IngestStats {
  totalChunks: number;
  byEntityType: Record<string, number>;
  d1RowsWritten: number;
  vectorsUpserted: number;
  errors: number;
  durationMs: number;
}
