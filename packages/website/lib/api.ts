// 官网 API 客户端
// 优先调用 admin 后端 (NEXT_PUBLIC_API_BASE)，失败时回退到 mock 数据
// 这样可以独立预览，也可以接真实后端

import {
  mockMatchDetail,
  mockMatchList,
  mockPredictionBundle,
  mockStandings,
  mockTournament,
} from "./mock";
import type {
  MatchDetailResponse,
  MatchListResponse,
  Player,
  PredictionBundle,
  ModelContextResponse,
  StandingsResponse,
  ThirdPlaceRankingResponse,
  OverallRankingResponse,
  TeamDetailResponse,
  TeamListResponse,
  Tournament,
} from "./types";

// 默认走真实后端；3s 超时后回退 mock
// 想纯本地预览（不依赖后端），把 NEXT_PUBLIC_API_BASE 留空，或设 NEXT_PUBLIC_USE_MOCK=1
const BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";
// 兜底:即使 env 在 build 时没注入,也能拿到真实后端 URL(URL 是公开的)
const DEFAULT_BASE = "https://cuporacle-service.song52wow.workers.dev";
const RESOLVED_BASE = BASE || DEFAULT_BASE;
const USE_MOCK = FORCE_MOCK || !RESOLVED_BASE;
const BASE_OR_MOCK = RESOLVED_BASE;

if (process.env.NODE_ENV !== "production") {
  console.log(`[api] BASE=${BASE} | USE_MOCK=${USE_MOCK} | BASE_OR_MOCK=${BASE_OR_MOCK}`);
}

async function safeFetch<T>(path: string): Promise<T | null> {
  if (USE_MOCK) return null;
  const url = `${BASE_OR_MOCK}${path}`;
  if (process.env.NODE_ENV !== "production") {
    console.log(`[api] fetch → ${url}`);
  }
  try {
    const res = await fetch(url, {
      // 10s 超时，D1 冷启动可能较慢
      // 禁止 SSR 缓存，确保比赛状态实时更新（如赛后同步比分）
      // 使用 next.revalidate 代替 cache:"no-store"，兼容 CF Pages Edge Runtime
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as T & { error?: string };
    if (json && typeof json === "object" && "error" in json && !("standings" in json) && !("matches" in json)) {
      return null;
    }
    return json as T;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[api] fetch FAILED ${path}:`, (e as Error).message);
    }
    return null;
  }
}

export async function getTournament(): Promise<Tournament> {
  const data = await safeFetch<Tournament>("/api/tournament");
  return data ?? mockTournament();
}

export async function getStandings(): Promise<StandingsResponse> {
  const data = await safeFetch<StandingsResponse>("/api/standings");
  if (data?.standings) return data;
  if (USE_MOCK) return mockStandings();
  return { updated_at: null, standings: [], total: 0 };
}

function buildThirdPlaceFromStandings(standings: StandingsResponse["standings"]): ThirdPlaceRankingResponse {
  const thirds = standings
    .filter((s) => s.position === 3)
    .sort((a, b) => b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for)
    .map((s, i) => ({
      rank: i + 1,
      group: s.group,
      team_id: s.team_id,
      team_name: s.team_name,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goals_for: s.goals_for,
      goals_against: s.goals_against,
      goal_diff: s.goal_diff,
      points: s.points,
      group_finished: s.played >= 3,
      rank_best: i + 1,
      rank_worst: i + 1,
      in_qualifying_zone: i + 1 <= 8,
      qualification_status: s.qualification_status,
      qualification_note: s.qualification_note,
    }));
  return { updated_at: null, spots: 8, entries: thirds, total: thirds.length };
}

export async function getThirdPlaceRanking(): Promise<ThirdPlaceRankingResponse> {
  const data = await safeFetch<ThirdPlaceRankingResponse>("/api/standings/third-place");
  if (data?.entries) return data;
  const standings = await getStandings();
  if (standings.standings.length > 0) return buildThirdPlaceFromStandings(standings.standings);
  return { updated_at: null, spots: 8, entries: [], total: 0 };
}

function buildOverallFromStandings(standings: StandingsResponse["standings"]): OverallRankingResponse {
  const sorted = [...standings].sort(
    (a, b) => b.points - a.points || b.goal_diff - a.goal_diff || b.goals_for - a.goals_for
  );
  const entries = sorted.map((s, i) => ({
    rank: i + 1,
    group: s.group,
    group_position: s.position,
    team_id: s.team_id,
    team_name: s.team_name,
    played: s.played,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
    goals_for: s.goals_for,
    goals_against: s.goals_against,
    goal_diff: s.goal_diff,
    points: s.points,
    group_finished: s.played >= 3,
    qualification_status: s.qualification_status,
    qualification_note: s.qualification_note,
  }));
  return { updated_at: null, entries, total: entries.length };
}

export async function getOverallRanking(): Promise<OverallRankingResponse> {
  const data = await safeFetch<OverallRankingResponse>("/api/standings/overall");
  if (data?.entries) return data;
  const standings = await getStandings();
  if (standings.standings.length > 0) return buildOverallFromStandings(standings.standings);
  return { updated_at: null, entries: [], total: 0 };
}

export async function getMatches(
  status?: "TIMED" | "SCHEDULED" | "IN_PLAY" | "FINISHED"
): Promise<MatchListResponse> {
  const qs = status ? `?status=${status}` : "";
  const data = await safeFetch<MatchListResponse>(`/api/matches${qs}`);
  if (data) return data;
  const mock = mockMatchList();
  return status
    ? { matches: mock.matches.filter((m) => m.status === status), total: 0 }
    : mock;
}

export async function getMatchDetail(id: string): Promise<MatchDetailResponse | null> {
  const data = await safeFetch<MatchDetailResponse>(`/api/matches/${id}`);
  return data ?? mockMatchDetail(id);
}

export async function getPrediction(id: string): Promise<PredictionBundle | null> {
  const data = await safeFetch<PredictionBundle>(`/api/predictions/${id}`);
  return data ?? mockPredictionBundle(id);
}

/** 客户端获取指定模型的 LLM 输入上下文（走 Next.js rewrite 代理） */
export async function fetchModelContext(
  matchId: string,
  provider: string
): Promise<ModelContextResponse | null> {
  if (USE_MOCK) return null;
  const path = `/api/predictions/${encodeURIComponent(matchId)}/models/${encodeURIComponent(provider)}/context`;
  try {
    const res = await fetch(path, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return (await res.json()) as ModelContextResponse;
  } catch {
    return null;
  }
}

// ─── Teams & Players ────────────────────────────────────────────
export async function getTeams(): Promise<TeamListResponse> {
  const data = await safeFetch<TeamListResponse>("/api/teams");
  if (data) return data;
  // Mock fallback: 返回空列表
  return { teams: [], total: 0 };
}

export async function getTeamDetail(slug: string): Promise<TeamDetailResponse | null> {
  const data = await safeFetch<TeamDetailResponse>(`/api/teams/${slug}`);
  return data;
}

export async function getTeamPlayers(slug: string): Promise<Player[]> {
  const data = await safeFetch<{ players: Player[]; total: number }>(`/api/teams/${slug}/players`);
  return data?.players ?? [];
}

export const API_BASE = BASE_OR_MOCK;
export const IS_MOCK = USE_MOCK;
