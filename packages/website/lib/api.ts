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
      // 注意:不能加 cache: "no-store"，CF Pages Edge Runtime 不支持该字段
      signal: AbortSignal.timeout(10000),
    });
    console.log(`[api] ${path} → ${res.status}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.log(`[api] fetch FAILED ${path}:`, (e as Error).message);
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
  // 用绝对 URL 直接调 Worker，避免 rewrite 问题
  const url = `${BASE_OR_MOCK}/api/predictions/${id}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    console.log(`[api] getPrediction(${id}) → ${res.status}`);
    if (!res.ok) return mockPredictionBundle(id);
    const data = await res.json() as PredictionBundle;
    console.log(`[api] getPrediction(${id}) primary=${data.primary != null} models=${data.models?.length ?? 0}`);
    return data;
  } catch (e) {
    console.log(`[api] getPrediction(${id}) FAILED:`, (e as Error).message);
    return mockPredictionBundle(id);
  }
}

export const API_BASE = BASE_OR_MOCK;
export const IS_MOCK = USE_MOCK;
