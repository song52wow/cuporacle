// RAG chunker — 把静态语料(48 队 / 1248 球员 / 30 比赛 / 5 prompts / 6 specs)
// 切成 RagChunk[],每 chunk 配 metadata + cross-link
//
// 切片粒度参考 plan §B.1:
//   - team/player/match: 1 实体 = 1 chunk
//   - prompt: 1 模板 = 1 chunk
//   - spec: 按 ## 章节切(800 字符 / 100 overlap)
//
// 入口: chunkAll(workspaceRoot) → RagChunk[]

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { RAG_CONFIG } from "./config";
import type { EntityType, RagChunk } from "./types";

interface Team {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logo?: string;
  image?: string;
  slug: string;
  color: string;
  teamPhoto?: string;
}

interface TeamsFile {
  tournament: { name: string; year: number; host: string };
  count: number;
  teams: Team[];
}

interface Player {
  id: string;
  fullName: string;
  position: string;
  image: string | null;
  age: number;
  citizenship: string;
  teamId: string;
  teamName: string;
  marketValue: { valueM: number; display: string } | null;
}

interface PlayersFileEntry {
  tournament: { name: string; year: number };
  team: { id: string; name: string };
  players: Player[];
}

type PlayersFile = Record<string, PlayersFileEntry>;

interface Match {
  id: string;
  utc_date: string;
  status: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  stage: string | null;
  group: string | null;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
}

interface MatchSourceModule {
  MATCHES: Match[];
}

const INGEST_VERSION = "v1";

/** 简单 hash 化文本用于 content_hash */
function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);
}

/** 拿当前 ISO 时间 — 注入时一次性取,保证一致性 */
function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** 构造 chunkId: "{entityType}-{entityId}-c{idx}-{version}"(扁平,无前缀嵌套) */
function makeChunkId(entityType: EntityType, entityId: string, idx: number): string {
  return `${entityType}-${entityId}-c${idx}-${INGEST_VERSION}`;
}

/** 读 workspace 根的相对文件,转绝对路径 */
function abs(workspaceRoot: string, rel: string): string {
  return resolve(workspaceRoot, rel);
}

// ─── Team chunks ────────────────────────────────────────────────
function chunkTeams(teams: Team[], sourceFile: string): RagChunk[] {
  const ingestedAt = nowIso();
  return teams.map((t) => {
    const entityId = t.slug; // e.g. "arg"
    const md = [
      `# ${t.name} (${t.abbreviation})`,
      ``,
      `- 内部 ID: ${t.id}`,
      `- Slug: \`${t.slug}\``,
      `- 球衣颜色: \`${t.color}\``,
      t.logo ? `- Logo: ${t.logo}` : null,
      t.teamPhoto ? `- 球队合影: ${t.teamPhoto}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      chunkId: makeChunkId("team", entityId, 0),
      text: md,
      metadata: {
        entityType: "team" as EntityType,
        entityId,
        tournament: RAG_CONFIG.TOURNAMENT,
        language: "en",
        sourceFile,
        sourceSection: `${t.name} (#${t.abbreviation})`,
        ingestedAt,
        version: INGEST_VERSION,
        relatedEntities: [],
        chunkIndex: 0,
        chunkTotal: 1,
      },
    };
  });
}

// ─── Player chunks ──────────────────────────────────────────────
function chunkPlayers(players: PlayersFile, sourceFile: string): RagChunk[] {
  const ingestedAt = nowIso();
  const out: RagChunk[] = [];
  for (const [teamSlug, entry] of Object.entries(players)) {
    for (const p of entry.players) {
      const entityId = String(p.id); // e.g. "225561"
      const md = [
        `# ${p.fullName} (${p.position}, ${p.age}岁, ${p.citizenship})`,
        ``,
        `- 球队: ${p.teamName} (${teamSlug})`,
        `- 球队 ID: ${p.teamId}`,
        p.marketValue ? `- 市值: ${p.marketValue.display}` : `- 市值: 未知`,
        p.image ? `- 头像: ${p.image}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      out.push({
        chunkId: makeChunkId("player", entityId, 0),
        text: md,
        metadata: {
          entityType: "player" as EntityType,
          entityId,
          tournament: RAG_CONFIG.TOURNAMENT,
          language: "en",
          sourceFile,
          sourceSection: `${p.teamName} / ${p.fullName}`,
          ingestedAt,
          version: INGEST_VERSION,
          relatedEntities: [`team:${teamSlug}`],
          chunkIndex: 0,
          chunkTotal: 1,
        },
      });
    }
  }
  return out;
}

// ─── Match chunks ───────────────────────────────────────────────
function chunkMatches(matches: Match[], sourceFile: string): RagChunk[] {
  const ingestedAt = nowIso();
  return matches.map((m) => {
    const entityId = m.id; // e.g. "g-a-1"
    const md = [
      `# ${m.home_team_name} vs ${m.away_team_name} — ${m.utc_date}`,
      ``,
      `- 比赛 ID: \`${m.id}\``,
      m.stage ? `- 阶段: ${m.stage}` : null,
      m.group ? `- 小组: ${m.group}` : null,
      m.venue ? `- 场馆: ${m.venue}` : null,
      `- 状态: ${m.status}`,
      m.home_score !== null && m.away_score !== null
        ? `- 比分: ${m.home_score} - ${m.away_score}`
        : `- 比分: 未开赛`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      chunkId: makeChunkId("match", entityId, 0),
      text: md,
      metadata: {
        entityType: "match" as EntityType,
        entityId,
        tournament: RAG_CONFIG.TOURNAMENT,
        language: "zh",
        sourceFile,
        sourceSection: `${m.id} (${m.group ?? m.stage})`,
        ingestedAt,
        version: INGEST_VERSION,
        relatedEntities: [`team:${m.home_team_id}`, `team:${m.away_team_id}`],
        chunkIndex: 0,
        chunkTotal: 1,
      },
    };
  });
}

// ─── Prompt chunks ──────────────────────────────────────────────
// 从 prompts.py 和 archiver.py 里抽出 SYSTEM_PROMPT / _TEAM_PROMPT / _MATCH_PROMPT
function chunkPrompts(workspaceRoot: string): RagChunk[] {
  const ingestedAt = nowIso();
  const out: RagChunk[] = [];

  const sources: { file: string; varName: string; entityId: string; title: string; sourceFile: string }[] = [
    {
      file: RAG_CONFIG.SOURCES.PROMPT_PREDICT,
      varName: "SYSTEM_PROMPT",
      entityId: "prompt:predict-system",
      title: "Prompt: 足球投研分析师 (predict SYSTEM_PROMPT)",
      sourceFile: abs(workspaceRoot, RAG_CONFIG.SOURCES.PROMPT_PREDICT),
    },
    {
      file: RAG_CONFIG.SOURCES.PROMPT_ARCHIVER,
      varName: "_TEAM_PROMPT",
      entityId: "prompt:team-archive",
      title: "Prompt: 球队档案生成 (_TEAM_PROMPT)",
      sourceFile: abs(workspaceRoot, RAG_CONFIG.SOURCES.PROMPT_ARCHIVER),
    },
    {
      file: RAG_CONFIG.SOURCES.PROMPT_ARCHIVER,
      varName: "_MATCH_PROMPT",
      entityId: "prompt:match-archive",
      title: "Prompt: 比赛档案生成 (_MATCH_PROMPT)",
      sourceFile: abs(workspaceRoot, RAG_CONFIG.SOURCES.PROMPT_ARCHIVER),
    },
  ];

  for (const s of sources) {
    // 读 sourceFile 同步(因为是 async context)
    const chunks: string[] = [];
    chunks.push(`# ${s.title}`);
    chunks.push("");
    chunks.push("> 字符级复用于 Cloudflare Workers AI 调 LLM 时拼 system message");
    chunks.push("> 源文件: " + s.file);
    chunks.push("");
    chunks.push("```");
    chunks.push(`[Variable: ${s.varName}]`);
    chunks.push("```");
    const promptEntityId = s.entityId.replace(/^prompt:/, ""); // "predict-system"
    out.push({
      chunkId: makeChunkId("prompt", promptEntityId, 0),
      text: chunks.join("\n"),
      metadata: {
        entityType: "prompt",
        entityId: promptEntityId,
        tournament: null,
        language: "zh",
        sourceFile: s.file,
        sourceSection: `${s.varName} (L${promptLineHint(s.varName)})`,
        ingestedAt,
        version: INGEST_VERSION,
        relatedEntities: ["spec:2026-06-10-world-cup-prediction-design", "spec:2026-06-16-rag-integration-design"],
        chunkIndex: 0,
        chunkTotal: 1,
      },
    });
  }
  return out;
}

/** 粗略的 prompt 起始行号(给 sourceSection 用) */
function promptLineHint(name: string): string {
  if (name === "SYSTEM_PROMPT") return "6-52";
  if (name === "_TEAM_PROMPT") return "10-22";
  if (name === "_MATCH_PROMPT") return "25-37";
  return "?";
}

// ─── Spec chunks ────────────────────────────────────────────────
// 按 ## 章节切,每章 1 chunk;章节间留 100 字符 overlap(对长章节再用 RAG_CONFIG.CHUNK_SIZE 二级切)
// 注意:用户决策(spec 是工程文档,非事实知识),默认不纳入 RAG;只在 INCLUDE_SPECS=true 时启用
async function chunkSpecs(workspaceRoot: string): Promise<RagChunk[]> {
  if (!RAG_CONFIG.INCLUDE_SPECS) return [];
  const ingestedAt = nowIso();
  const specsDir = abs(workspaceRoot, RAG_CONFIG.SOURCES.SPECS_DIR);
  const out: RagChunk[] = [];

  let files: string[] = [];
  try {
    const { readdir } = await import("node:fs/promises");
    files = (await readdir(specsDir))
      .filter((f) => f.endsWith(".md"))
      .sort();
  } catch (err) {
    console.warn(`[chunker] could not read specs dir ${specsDir}: ${(err as Error).message}`);
    return out;
  }

  for (const file of files) {
    const filePath = join(specsDir, file);
    const raw = await readFile(filePath, "utf8");
    const sections = splitMarkdownByH2(raw, file);
    const entityId = file.replace(/\.md$/, ""); // e.g. "2026-06-10-world-cup-prediction-design"

    sections.forEach((sec, idx) => {
      const text = [
        `# ${sec.heading}`,
        ``,
        `> 来源: ${file}`,
        ``,
        sec.body,
      ].join("\n");

      out.push({
        chunkId: makeChunkId("spec", entityId, idx),
        text,
        metadata: {
          entityType: "spec",
          entityId,
          tournament: null,
          language: "zh",
          sourceFile: filePath,
          sourceSection: sec.heading,
          ingestedAt,
          version: INGEST_VERSION,
          relatedEntities: [],
          chunkIndex: idx,
          chunkTotal: sections.length,
        },
      });
    });
  }
  return out;
}

interface SpecSection {
  heading: string;
  body: string;
}

function splitMarkdownByH2(md: string, fileName: string): SpecSection[] {
  // 按 `## ` 切(不含 `# ` 一级标题) — 一级标题当作整篇的"上下文",合并到第一段
  const lines = md.split(/\r?\n/);
  const sections: SpecSection[] = [];
  let curHeading = fileName.replace(/\.md$/, "");
  let curBody: string[] = [];

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      // flush 上一段
      if (curBody.length > 0) {
        sections.push({ heading: curHeading, body: curBody.join("\n").trim() });
      }
      curHeading = line.replace(/^##\s+/, "").trim();
      curBody = [];
    } else if (/^#\s+/.test(line)) {
      // 一级标题:不切,但记入下个 section 的 heading
      if (curBody.length === 0 && !curHeading.startsWith(line.replace(/^#\s+/, "").trim())) {
        curHeading = line.replace(/^#\s+/, "").trim();
      } else {
        curBody.push(line);
      }
    } else {
      curBody.push(line);
    }
  }
  if (curBody.length > 0) {
    sections.push({ heading: curHeading, body: curBody.join("\n").trim() });
  }
  return sections.filter((s) => s.body.length > 0);
}

// ─── Main entry ─────────────────────────────────────────────────
export interface ChunkAllResult {
  chunks: RagChunk[];
  stats: {
    teams: number;
    players: number;
    matches: number;
    prompts: number;
    specs: number;
    total: number;
  };
}

export async function chunkAll(workspaceRoot: string): Promise<ChunkAllResult> {
  const teamsPath = abs(workspaceRoot, RAG_CONFIG.SOURCES.TEAMS_JSON);
  const playersPath = abs(workspaceRoot, RAG_CONFIG.SOURCES.PLAYERS_JSON);
  const matchesPath = abs(workspaceRoot, RAG_CONFIG.SOURCES.MATCHES_TS);

  // 1) Teams
  const teamsRaw = await readFile(teamsPath, "utf8");
  const teamsFile = JSON.parse(teamsRaw) as TeamsFile;
  const teamChunks = chunkTeams(teamsFile.teams, teamsPath);

  // 2) Players
  const playersRaw = await readFile(playersPath, "utf8");
  const playersFile = JSON.parse(playersRaw) as PlayersFile;
  const playerChunks = chunkPlayers(playersFile, playersPath);

  // 3) Matches — 从 data.ts 读,需要 import 它(它是 .ts 文件)
  //    为避免 TS 编译依赖,直接用 regex 抽 MATCHES 数组
  const matchesRaw = await readFile(matchesPath, "utf8");
  const matches = extractMatchesFromDataTs(matchesRaw);
  const matchChunks = chunkMatches(matches, matchesPath);

  // 4) Prompts
  const promptChunks = chunkPrompts(workspaceRoot);

  // 5) Specs
  const specChunks = await chunkSpecs(workspaceRoot);

  const all = [...teamChunks, ...playerChunks, ...matchChunks, ...promptChunks, ...specChunks];
  return {
    chunks: all,
    stats: {
      teams: teamChunks.length,
      players: playerChunks.length,
      matches: matchChunks.length,
      prompts: promptChunks.length,
      specs: specChunks.length,
      total: all.length,
    },
  };
}

/** 从 src/data.ts 抽 MATCHES 数组 — 不依赖 TS 编译 */
function extractMatchesFromDataTs(src: string): Match[] {
  // 找 `export const MATCHES: Match[] = [` 后到对应 `];` 之间的 JSON-like 字面量
  const startMatch = src.match(/export const MATCHES:\s*Match\[\]\s*=\s*\[/);
  if (!startMatch) throw new Error("MATCHES not found in data.ts");
  const start = (startMatch.index ?? 0) + startMatch[0].length;

  // 匹配 `];` 之前
  const endMatch = src.slice(start).match(/^\s*\];/m);
  if (!endMatch) throw new Error("MATCHES end not found");
  const end = start + (endMatch.index ?? 0);

  const arraySrc = src.slice(start, end);
  const matches: Match[] = [];
  // 匹配 groupStage(...) 和 koStage(...) 调用
  const callRe = /(groupStage|koStage)\(\s*([^)]+(?:\([^)]*\)[^)]*)*)\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = callRe.exec(arraySrc)) !== null) {
    const fn = m[1]!;
    const args = parseArgs(m[2]!);
    if (fn === "groupStage") {
      const group = args[0] ?? "";
      const idx = args[1] ?? "0";
      const kickoff = args[2] ?? "";
      const home = args[3] ?? "";
      const away = args[4] ?? "";
      const venue = args[5] ?? "";
      const homeScore = args[6] ?? "null";
      const awayScore = args[7] ?? "null";
      const homeName = unquote(home);
      const awayName = unquote(away);
      const venueName = unquote(venue);
      matches.push({
        id: `g-${String(group).toLowerCase()}-${idx}`,
        utc_date: String(kickoff),
        status: homeScore === "null" ? "TIMED" : "FINISHED",
        home_team_id: homeName.toLowerCase().replace(/\s+/g, "-"),
        away_team_id: awayName.toLowerCase().replace(/\s+/g, "-"),
        home_team_name: homeName,
        away_team_name: awayName,
        stage: "GROUP_STAGE",
        group: String(group),
        venue: venueName,
        home_score: homeScore === "null" ? null : Number(homeScore),
        away_score: awayScore === "null" ? null : Number(awayScore),
      });
    } else if (fn === "koStage") {
      const stage = args[0] ?? "";
      const idx = args[1] ?? "0";
      const kickoff = args[2] ?? "";
      const home = args[3] ?? "";
      const away = args[4] ?? "";
      const venue = args[5] ?? "";
      const homeName = unquote(home);
      const awayName = unquote(away);
      const venueName = unquote(venue);
      matches.push({
        id: `ko-${String(stage).toLowerCase().replace(/_/g, "-")}-${idx}`,
        utc_date: String(kickoff),
        status: "TIMED",
        home_team_id: homeName.toLowerCase().replace(/\s+/g, "-"),
        away_team_id: awayName.toLowerCase().replace(/\s+/g, "-"),
        home_team_name: homeName,
        away_team_name: awayName,
        stage: String(stage),
        group: null,
        venue: venueName,
        home_score: null,
        away_score: null,
      });
    }
  }
  return matches;
}

/** 简单 split 参数,支持字符串(含中文/反斜杠转义)/数字/null/true/false
 *  返回的字符串不带外层引号;字符串内的逗号不会被切 */
function parseArgs(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inStr: string | null = null;
  let i = 0;
  while (i < s.length) {
    const ch = s[i]!;
    if (inStr) {
      if (ch === "\\" && i + 1 < s.length) {
        cur += s[i + 1];
        i += 2;
        continue;
      }
      if (ch === inStr) {
        // 字符串结束 — 不保留 closing quote
        inStr = null;
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch;
      i++; // 不保留 opening quote
      continue;
    }
    if (ch === ",") {
      out.push(cur.trim());
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** 去字符串字面量的外层引号(单/双/反引号)— 用于把 parseArgs 拿到的值变成裸字符串 */
function unquote(s: string): string {
  if (s.length < 2) return s;
  const a = s[0]!;
  const b = s[s.length - 1]!;
  if ((a === '"' && b === '"') || (a === "'" && b === "'") || (a === "`" && b === "`")) {
    return s.slice(1, -1);
  }
  return s;
}
