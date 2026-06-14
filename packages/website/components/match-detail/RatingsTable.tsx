"use client";

import { motion } from "framer-motion";
import type { PlayerRating } from "@/lib/types";
import { Star } from "lucide-react";

interface Props {
  home: PlayerRating[];
  away: PlayerRating[];
  homeName: string;
  awayName: string;
}

export function RatingsTable({ home, away, homeName, awayName }: Props) {
  if (home.length === 0 && away.length === 0) return null;
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4 text-white">
        <span className="text-cyan-300">
          <Star className="w-4 h-4" />
        </span>
        <h3 className="text-base sm:text-lg font-semibold tracking-tight">
          球员评分
        </h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <RatingGroup label={homeName} ratings={home} accent="cyan" />
        <RatingGroup label={awayName} ratings={away} accent="violet" />
      </div>
    </div>
  );
}

function RatingGroup({
  label,
  ratings,
  accent,
}: {
  label: string;
  ratings: PlayerRating[];
  accent: "cyan" | "violet";
}) {
  return (
    <div>
      <div
        className={`text-[11px] font-mono tracking-widest uppercase mb-2 ${
          accent === "cyan" ? "text-cyan-300/80" : "text-violet-300/80"
        }`}
      >
        {label}
      </div>
      <div className="rounded-xl hairline overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-white/[0.03] text-white/50">
            <tr>
              <th className="text-left font-mono px-3 py-2">#</th>
              <th className="text-left font-mono px-3 py-2">球员</th>
              <th className="text-right font-mono px-3 py-2">综合</th>
              <th className="text-right font-mono px-3 py-2">传球</th>
              <th className="text-right font-mono px-3 py-2">射门</th>
              <th className="text-right font-mono px-3 py-2">防守</th>
              <th className="text-right font-mono px-3 py-2">速度</th>
            </tr>
          </thead>
          <tbody>
            {ratings.map((r, i) => (
              <motion.tr
                key={`${r.player_name}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="border-t border-white/5 hover:bg-white/[0.02]"
              >
                <td className="px-3 py-2 font-mono text-white/45">
                  {r.shirt_number ?? "-"}
                </td>
                <td className="px-3 py-2">
                  <div className="text-white truncate max-w-[120px]">
                    {r.player_name}
                  </div>
                  <div className="text-[10px] font-mono text-white/40">
                    {r.position}
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-white font-semibold">
                  {r.overall.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-white/70">
                  {r.passing.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-white/70">
                  {r.shooting.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-white/70">
                  {r.defense.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-white/70">
                  {r.pace.toFixed(1)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
