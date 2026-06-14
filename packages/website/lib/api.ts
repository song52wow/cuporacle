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
  PredictionBundle,
  Tournament,
} from "./types";

// 默认走真实后端；3s 超时后回退 mock
// 想纯本地预览（不依赖后端），把 NEXT_PUBLIC_API_BASE 留空，或设 NEXT_PUBLIC_USE_MOCK=1
const BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";
const USE_MOCK = FORCE_MOCK || !BASE;
const BASE_OR_MOCK = BASE || "http://localhost:8000";

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
      // 客户端 / RSC 都不缓存，方便热更新
      cache: "no-store",
      // 3s 超时，避免后端挂了把官网卡死
      signal: AbortSignal.timeout(3000),
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

export const API_BASE = BASE_OR_MOCK;
export const IS_MOCK = USE_MOCK;
