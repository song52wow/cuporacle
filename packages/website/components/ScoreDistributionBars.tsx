"use client";

import { motion } from "framer-motion";
import type { ScoreDistributionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScoreDistributionBars({
  items,
  limit = 8,
  className,
}: {
  items: ScoreDistributionItem[];
  limit?: number;
  className?: string;
}) {
  const top = [...items].sort((a, b) => b.p - a.p).slice(0, limit);
  const max = top[0]?.p || 1;
  return (
    <div className={cn("space-y-1.5", className)}>
      {top.map((s, i) => {
        const w = (s.p / max) * 100;
        return (
          <div key={`${s.home}-${s.away}`} className="flex items-center gap-3 text-xs">
            <div className="w-12 shrink-0 font-mono text-white/70 text-right tabular-nums">
              {s.home} : {s.away}
            </div>
            <div className="flex-1 h-6 rounded-md bg-ink-700/40 hairline relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-cyan-violet/80"
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
              />
              <div className="absolute inset-0 grid place-items-end pr-2">
                <span className="text-[10px] font-mono text-white/85 drop-shadow">
                  {(s.p * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
