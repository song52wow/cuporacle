"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import { TeamFlag } from "./TeamFlag";
import { WinProbBar } from "./WinProbBar";
import type { Match, PredictionBundle } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/utils";

const STAGE_LABEL: Record<string, string> = {
  GROUP_STAGE: "小组赛",
  ROUND_OF_32: "1/16 决赛",
  ROUND_OF_16: "1/8 决赛",
  QUARTER_FINALS: "1/4 决赛",
  SEMI_FINALS: "半决赛",
  FINAL: "决赛",
};

interface Props {
  match: Match;
  prediction?: PredictionBundle | null;
  index?: number;
}

export function MatchCard({ match, prediction, index = 0 }: Props) {
  const p = prediction?.primary;
  const hasP = !!p;
  const isFinished = match.status === "FINISHED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
    >
      <Link
        href={`/matches/${match.id}`}
        className="group block relative glass rounded-2xl p-5 hover:ring-1 hover:ring-cyan-400/40 transition-all duration-300 hover:-translate-y-0.5"
      >
        {/* 顶部 meta */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-white/55">
            {match.group && (
              <span className="px-1.5 py-0.5 rounded font-mono bg-white/[0.06] text-cyan-300/90">
                {match.group} 组
              </span>
            )}
            <span className="font-medium text-white/70">
              {STAGE_LABEL[match.stage ?? ""] ?? match.stage}
            </span>
          </div>
          <div className="flex items-center gap-1 text-white/45 font-mono">
            <Calendar className="w-3 h-3" />
            {isFinished ? "已结束" : relativeTime(match.utc_date)}
          </div>
        </div>

        {/* 对阵 */}
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <TeamFlag name={match.home_team_name} className="w-9 h-9 text-xl" />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-white truncate">
                {match.home_team_name}
              </div>
              <div className="text-[10px] font-mono text-white/40">主队</div>
            </div>
          </div>
          <div className="text-center">
            {isFinished ? (
              <div className="text-3xl font-mono font-bold tracking-tight text-white">
                {match.home_score}
                <span className="text-white/30 mx-1">:</span>
                {match.away_score}
              </div>
            ) : (
              <div className="text-xs font-mono text-white/40">VS</div>
            )}
          </div>
          <div className="flex items-center gap-3 min-w-0 justify-end text-right">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-white truncate">
                {match.away_team_name}
              </div>
              <div className="text-[10px] font-mono text-white/40">客队</div>
            </div>
            <TeamFlag name={match.away_team_name} className="w-9 h-9 text-xl" />
          </div>
        </div>

        {/* 预测条 */}
        {hasP && p ? (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1 text-cyan-300/90">
                <Sparkles className="w-3 h-3" />
                AI 多模型共识
              </span>
              <span className="text-white/40">
                {p.llm_provider} · {(p.llm_model || "").slice(0, 18)}
              </span>
            </div>
            <WinProbBar win={p.win_prob} draw={p.draw_prob} loss={p.loss_prob} size="sm" showLabels />
          </div>
        ) : !isFinished ? (
          <div className="mt-5 flex items-center justify-between text-[11px] text-white/40 font-mono">
            <span>预测生成中…</span>
            <span>{match.prediction_models_ok}/{match.prediction_models_total} 模型</span>
          </div>
        ) : null}

        {/* 场地 */}
        {match.venue && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
            <MapPin className="w-3 h-3" />
            {match.venue}
          </div>
        )}

        {/* hover 描边 */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 group-hover:ring-cyan-400/30 transition" />
      </Link>
    </motion.div>
  );
}
