// 官网 API 客户端
// 优先调用 admin 后端 (NEXT_PUBLIC_API_BASE)，失败时回退到 mock 数据
// 这样可以独立预览，也可以接真实后端

import {
  mockMatchDetail,
  mockMatchList,
  mockPredictionBundle,
  mockTournament,
} from "./mock";
import type {
  MatchDetailResponse,
  MatchListResponse,
  Player,
  PredictionBundle,
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
    return (await res.json()) as T;
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
