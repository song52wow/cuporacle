-- ─── RAG 知识库三表 ──────────────────────────────────────────────
-- 镜像 admin/backend/app/data/db.py 的 rag_documents / rag_archives / rag_runs
-- Stage 1 静态语料入库使用
-- 关系:
--   rag_documents.chunk_id = Vectorize 里的 vector id
--   rag_archives 存 LLM 生成的档案 (prompt 模板 / 球队档案 / 比赛档案)
--   rag_runs 记录 ingest / generate / refresh 任务

-- Chunk metadata — 每条对应 Vectorize 里一个向量
-- 存全文 (raw_text) 避免依赖 Vectorize 读全文;D1 是 source of truth
CREATE TABLE IF NOT EXISTS rag_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chunk_id TEXT UNIQUE NOT NULL,           -- Vectorize vector id, 形如 "team-arg-v1"
    url TEXT,                                -- 原始 URL(对静态语料: file://... 或空)
    title TEXT,
    source_name TEXT,                        -- "world-cup-teams.json" / "spec" / "prompt" / "match"
    published_at TEXT,                       -- 原始数据时间(若有)
    fetched_at TEXT NOT NULL,                -- 入库时间
    raw_text TEXT NOT NULL,                  -- chunk 全文(中文/英文均可)
    content_hash TEXT NOT NULL,              -- chunk text 的 sha256,用于去重和版本校验
    entity_type TEXT NOT NULL,               -- team / player / match / prompt / spec / ...
    entity_id TEXT NOT NULL,                 -- stable id,如 "team-arg" / "player-201" / "match-g-a-1"
    tournament TEXT,                         -- 2026(对静态语料统一)
    language TEXT,                           -- zh / en
    source_file TEXT,                        -- 原始文件绝对路径
    source_section TEXT,                     -- ## heading / 行号
    related_entities TEXT,                   -- JSON 数组, ["team:arg","match:g-a-1"]
    version TEXT,                            -- 文件 mtime 或 git SHA
    chunk_index INTEGER DEFAULT 0,           -- 同一 source 内的 chunk 序号
    chunk_total INTEGER DEFAULT 1,           -- 同一 source 共有多少 chunk
    metadata_json TEXT                       -- 透传额外 metadata(JSON)
);

CREATE INDEX IF NOT EXISTS idx_rag_docs_entity ON rag_documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_rag_docs_type ON rag_documents(entity_type);
CREATE INDEX IF NOT EXISTS idx_rag_docs_source ON rag_documents(source_name);
CREATE INDEX IF NOT EXISTS idx_rag_docs_tournament ON rag_documents(tournament);

-- LLM 生成的 Markdown 档案(prompt 模板也走这里)
-- 与 rag_documents 是分离的:archive 是 LLM 二次加工产物,document 是原始 chunk
CREATE TABLE IF NOT EXISTS rag_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    archive_type TEXT NOT NULL,              -- "team" / "match" / "coach" / "referee" / "prompt"
    entity_id TEXT NOT NULL,                 -- 与 rag_documents.entity_id 对齐
    content_md TEXT,                         -- Markdown 档案全文
    sources_json TEXT,                       -- 引用的源 chunk_id 列表(JSON)
    generated_at TEXT NOT NULL,              -- 生成时间
    stale INTEGER NOT NULL DEFAULT 0,        -- 软过期标记(7 天以上未更新)
    token_used INTEGER,                      -- LLM 调用 token
    model_used TEXT,                         -- LLM 模型名
    UNIQUE(archive_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_rag_archives_entity ON rag_archives(entity_id);
CREATE INDEX IF NOT EXISTS idx_rag_archives_stale_gen ON rag_archives(stale, generated_at);

-- RAG 任务运行日志(手动 / 定时 ingest / 档案生成)
CREATE TABLE IF NOT EXISTS rag_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_type TEXT NOT NULL,                  -- "ingest_static" / "ingest_crawl" / "generate_archives"
    status TEXT NOT NULL,                    -- "running" / "success" / "failed"
    started_at TEXT NOT NULL,
    finished_at TEXT,
    params_json TEXT,                        -- 任务参数 (JSON)
    result_json TEXT,                        -- 任务结果 (JSON,如写入行数)
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_rag_runs_type_started ON rag_runs(run_type, started_at DESC);
