"use client";

import { Quote, BookOpen } from "lucide-react";
import { useActivePrediction } from "./MatchDetailClient";
import { ScoreDistributionBars } from "@/components/ScoreDistributionBars";
import { KeyFactorsPanel, KeyPlayersPanel } from "./KeyFactorsPanel";

interface Props {
  homeName: string;
  awayName: string;
}

export function MatchLeftContent({ homeName, awayName }: Props) {
  const p = useActivePrediction();

  if (!p) return null;

  return (
    <>
      {/* 比分分布 */}
      {p.score_distribution.length > 0 && (
        <div className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4 text-white">
            <span className="text-cyan-300">
              <BookOpen className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">
              最可能比分（Top {Math.min(8, p.score_distribution.length)}）
            </h3>
          </div>
          <ScoreDistributionBars items={p.score_distribution} limit={8} />
        </div>
      )}

      {/* 关键因素 + 关键球员 */}
      <KeyFactorsPanel prediction={p} />
      {p.key_players.length > 0 && (
        <KeyPlayersPanel
          prediction={p}
          homeName={homeName}
          awayName={awayName}
        />
      )}

      {/* 叙述 */}
      {p.narrative && (
        <div className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3 text-white">
            <span className="text-cyan-300">
              <Quote className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">
              AI 解读
            </h3>
          </div>
          <p className="text-sm sm:text-base text-white/75 leading-relaxed">
            {p.narrative}
          </p>
        </div>
      )}
    </>
  );
}
