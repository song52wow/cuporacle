// RAG 配置 — 镜像 admin/backend/app/rag/config.py 的参数语义
// Stage 1 静态语料入库用;后续 Stage 3 再接 cron / 实时抓取

export const RAG_CONFIG = {
  /** Cloudflare Vectorize index 名 — 需先 `wrangler vectorize create cuporacle-rag --dimensions=1024 --metric=cosine` */
  VECTOR_INDEX_NAME: "cuporacle-rag",

  /** Workers AI embedding 模型 — bge-m3 支持中英文,1024 维 */
  EMBED_MODEL: "@cf/baai/bge-m3" as const,
  EMBED_DIM: 1024,

  /** 切片参数 — 与 admin rag/config.py 一致 */
  CHUNK_SIZE: 800,
  CHUNK_OVERLAP: 100,

  /** 检索参数 */
  RETRIEVAL_K: 15,
  ARCHIVE_STALE_DAYS: 7,

  /** 静态语料源 — Stage 1 用 */
  SOURCES: {
    TEAMS_JSON: "src/data/world-cup-teams.json",
    PLAYERS_JSON: "src/data/world-cup-players.json",
    MATCHES_TS: "src/data.ts",
    PROMPT_PREDICT: "../../../admin/backend/app/predict/prompts.py",
    PROMPT_ARCHIVER: "../../../admin/backend/app/rag/archiver.py",
    SPECS_DIR: "../../../admin/docs/superpowers/specs",
  },

  /** Spec 设计文档不纳入 RAG 语料(2026-06-18 用户决策:spec 是工程文档,非事实知识) */
  INCLUDE_SPECS: false,

  /** Tournament 标识 */
  TOURNAMENT: "2026",
  TOURNAMENT_LANG: "zh" as const,
} as const;

export type RagConfig = typeof RAG_CONFIG;
