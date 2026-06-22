"use client";

import { createContext, useContext, useState } from "react";
import type { Match, PredictionResponse, ModelResult } from "@/lib/types";
import { PredictionHero } from "./PredictionHero";
import { ModelComparison } from "./ModelComparison";

// ─── 共享状态 Context ────────────────────────────────────────
interface MatchState {
  selectedProvider: string | undefined;
  setSelectedProvider: (p: string | undefined) => void;
  activeModel: ModelResult | undefined;
  match: Match;
  prediction: {
    primary: PredictionResponse | null;
    models: ModelResult[];
  } | null;
}

const MatchCtx = createContext<MatchState | null>(null);

export function useMatchState() {
  return useContext(MatchCtx)!;
}

// ─── Hero：从 Context 读取 activeModel ───────────────────────
export function HeroFromContext() {
  const { activeModel, match, prediction } = useMatchState();
  return (
    <PredictionHero
      match={match}
      prediction={prediction?.primary ?? null}
      activeModel={activeModel}
    />
  );
}

// ─── 活跃预测：合并 primary + 选中模型的数据 ─────────────────
export function useActivePrediction(): PredictionResponse | null {
  const { activeModel, prediction } = useMatchState();
  const primary = prediction?.primary ?? null;
  if (!primary && !activeModel) return null;
  if (!activeModel || activeModel.status !== "ok") return primary;
  return {
    ...primary!,
    win_prob: activeModel.win_prob ?? primary?.win_prob ?? 0,
    draw_prob: activeModel.draw_prob ?? primary?.draw_prob ?? 0,
    loss_prob: activeModel.loss_prob ?? primary?.loss_prob ?? 0,
    expected_goals_home: activeModel.expected_goals_home ?? primary?.expected_goals_home ?? 0,
    expected_goals_away: activeModel.expected_goals_away ?? primary?.expected_goals_away ?? 0,
    score_distribution: activeModel.score_distribution ?? primary?.score_distribution ?? [],
    key_factors: activeModel.key_factors ?? primary?.key_factors ?? [],
    key_players: activeModel.key_players ?? primary?.key_players ?? [],
    narrative: activeModel.narrative ?? primary?.narrative ?? "",
    risk_factors: activeModel.risk_factors ?? primary?.risk_factors ?? [],
    llm_provider: activeModel.provider,
    llm_model: activeModel.model,
  };
}

// ─── 侧边栏模型对比：从 Context 读取/写入 selectedProvider ──
export function SidebarModelComparison() {
  const { selectedProvider, setSelectedProvider, prediction, match } = useMatchState();

  if (!prediction || prediction.models.length === 0) return null;

  return (
    <ModelComparison
      matchId={match.id}
      models={prediction.models}
      selectedProvider={selectedProvider}
      onSelect={setSelectedProvider}
    />
  );
}

// ─── Provider：包裹需要共享状态的子树 ────────────────────────
interface ProviderProps {
  match: Match;
  prediction: {
    primary: PredictionResponse | null;
    models: ModelResult[];
  } | null;
  children: React.ReactNode;
}

export function MatchDetailProvider({ match, prediction, children }: ProviderProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(
    prediction?.primary?.llm_provider
  );

  const activeModel = prediction?.models.find(
    (m) => m.provider === selectedProvider && m.status === "ok"
  );

  return (
    <MatchCtx.Provider value={{ selectedProvider, setSelectedProvider, activeModel, match, prediction }}>
      {children}
    </MatchCtx.Provider>
  );
}
