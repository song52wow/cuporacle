"use client";

import { motion } from "framer-motion";
import { Sparkles, ChevronRight, TrendingUp } from "lucide-react";
import type { Match, PredictionResponse } from "@/lib/types";
import { TeamFlag } from "@/components/TeamFlag";
import { WinProbBar } from "@/components/WinProbBar";
import { formatDate, topScore } from "@/lib/utils";

export function PredictionHero({
  match,
  prediction,
}: {
  match: Match;
  prediction: PredictionResponse | null;
}) {
  const isFinished = match.status === "FINISHED";
  const top = prediction ? topScore(prediction.score_distribution) : null;

  return (
    <div className="relative glass-strong rounded-3xl p-6 sm:p-10 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-cyan-violet opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full bg-violet-500/25 blur-3xl" />

      <div className="relative">
        {/* 顶部 meta */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          {match.group && (
            <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-300/90">
              {match.group} 组
            </span>
          )}
          <span className="text-white/70">{labelStage(match.stage)}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/55">{formatDate(match.utc_date)}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-emerald-300/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
            {isFinished ? "已结束" : "AI 预测已就绪"}
          </span>
        </div>

        {/* 对阵 */}
        <div className="mt-6 flex items-center gap-3 sm:gap-4">
          <TeamSide
            className="flex-1"
            name={match.home_team_name}
            isHome
            score={match.home_score}
            finished={isFinished}
            xg={prediction?.expected_goals_home}
          />
          <div className="text-center px-1 shrink-0">
            {isFinished ? (
              <div className="text-4xl sm:text-6xl font-mono font-bold tracking-tight text-white">
                {match.home_score}
                <span className="text-white/30 mx-1 sm:mx-2">:</span>
                {match.away_score}
              </div>
            ) : (
              <>
                <div className="text-[11px] font-mono text-white/40 tracking-widest uppercase">
                  kickoff
                </div>
                <div className="mt-1 text-white/30 text-2xl font-mono">VS</div>
              </>
            )}
          </div>
          <TeamSide
            className="flex-1"
            name={match.away_team_name}
            isHome={false}
            score={match.away_score}
            finished={isFinished}
            xg={prediction?.expected_goals_away}
          />
        </div>

        {/* 概率条 */}
        {prediction ? (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono text-white/55">
                <span className="inline-flex items-center gap-1.5 text-cyan-300/90">
                  <Sparkles className="w-3 h-3" /> AI 预测概率
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/45">
                主模型 {prediction.llm_provider} · {prediction.llm_model}
              </div>
            </div>
            <WinProbBar
              win={prediction.win_prob}
              draw={prediction.draw_prob}
              loss={prediction.loss_prob}
              size="lg"
            />
            {top && (
              <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-white/55">
                <span>最可能比分</span>
                <span className="text-white font-semibold text-sm">
                  {top.home} - {top.away}
                </span>
                <span className="text-emerald-300/90">
                  置信度 {(top.p * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 p-4 rounded-xl bg-white/[0.03] hairline text-center text-sm text-white/55 font-mono">
            暂无预测 · 后台尚未生成或比赛已结束
          </div>
        )}

        {/* xG 卡片 */}
        {prediction && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="xG (主)" value={prediction.expected_goals_home.toFixed(2)} />
            <Stat label="xG (客)" value={prediction.expected_goals_away.toFixed(2)} />
            <Stat
              label="净胜预期"
              value={(prediction.expected_goals_home - prediction.expected_goals_away).toFixed(2)}
              positive={prediction.expected_goals_home > prediction.expected_goals_away}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function labelStage(stage: string | null | undefined) {
  return (
    {
      GROUP_STAGE: "小组赛",
      ROUND_OF_32: "1/16 决赛",
      ROUND_OF_16: "1/8 决赛",
      QUARTER_FINALS: "1/4 决赛",
      SEMI_FINALS: "半决赛",
      FINAL: "决赛",
    }[stage ?? ""] ?? stage
  );
}

function TeamSide({
  name,
  isHome,
  score,
  finished,
  xg,
  className = "",
}: {
  name: string;
  isHome: boolean;
  score: number | null;
  finished: boolean;
  xg?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 min-w-0 ${className} ${
        isHome ? "" : "flex-row-reverse text-right"
      }`}
    >
      <TeamFlag name={name} size="xl" />
      <div className="min-w-0 flex-1">
        <div className="text-base sm:text-xl font-semibold text-white tracking-tight truncate">
          {name}
        </div>
        <div className="text-[10px] font-mono text-white/40 mt-0.5">
          {isHome ? "主队" : "客队"}
          {xg !== undefined && (
            <>
              <span className="mx-1.5 text-white/20">·</span>
              xG {xg.toFixed(2)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] hairline p-3 text-center">
      <div className="text-[10px] font-mono tracking-widest text-white/45 uppercase">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-mono font-semibold tabular-nums ${
          positive === undefined
            ? "text-white"
            : positive
            ? "text-cyan-300"
            : "text-rose-300"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
