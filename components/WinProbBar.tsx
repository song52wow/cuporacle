"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  win: number; // 0-1
  draw: number;
  loss: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
}

export function WinProbBar({
  win,
  draw,
  loss,
  size = "md",
  showLabels = true,
  className,
}: Props) {
  const total = win + draw + loss || 1;
  const wPct = (win / total) * 100;
  const dPct = (draw / total) * 100;
  const lPct = (loss / total) * 100;
  const h = size === "lg" ? "h-3.5" : size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full rounded-full overflow-hidden hairline bg-ink-700/40 flex",
          h
        )}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${wPct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
        <motion.div
          className="h-full bg-gradient-to-r from-violet-400 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${dPct}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
        />
        <motion.div
          className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
          initial={{ width: 0 }}
          animate={{ width: `${lPct}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      {showLabels && (
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            主胜 {wPct.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1.5 text-violet-300">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            平 {dPct.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1.5 text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            客胜 {lPct.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}
