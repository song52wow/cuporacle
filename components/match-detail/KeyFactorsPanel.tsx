"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Users } from "lucide-react";
import type { PredictionResponse, KeyFactor, KeyPlayer } from "@/lib/types";
import { cn } from "@/lib/utils";

const IMPACT_META: Record<
  KeyFactor["impact"],
  { label: string; color: string; bar: string }
> = {
  positive_home: { label: "利好主队", color: "text-cyan-300", bar: "from-cyan-400 to-cyan-500" },
  negative_home: { label: "不利主队", color: "text-rose-300", bar: "from-rose-400 to-rose-500" },
  positive_away: { label: "利好客队", color: "text-violet-300", bar: "from-violet-400 to-violet-500" },
  negative_away: { label: "不利客队", color: "text-amber-300", bar: "from-amber-400 to-amber-500" },
  neutral: { label: "中性", color: "text-white/55", bar: "from-white/30 to-white/10" },
};

export function KeyFactorsPanel({ prediction }: { prediction: PredictionResponse }) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <SectionTitle icon={<CheckCircle2 className="w-4 h-4" />} title="关键因素" />
      <ul className="mt-4 space-y-3">
        {prediction.key_factors.map((f, i) => {
          const meta = IMPACT_META[f.impact];
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="grid grid-cols-[100px_1fr_auto] items-center gap-3"
            >
              <span
                className={cn(
                  "text-[10px] font-mono tracking-widest uppercase text-center px-2 py-1 rounded",
                  "bg-white/[0.04] hairline",
                  meta.color
                )}
              >
                {meta.label}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-white/85 leading-relaxed">{f.factor}</p>
                <div className="mt-1.5 h-1.5 rounded-full bg-ink-700/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.weight * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                    className={cn("h-full bg-gradient-to-r", meta.bar)}
                  />
                </div>
              </div>
              <span className="text-[11px] font-mono text-white/55 tabular-nums">
                {(f.weight * 100).toFixed(0)}%
              </span>
            </motion.li>
          );
        })}
      </ul>

      {/* 风险因素 */}
      {prediction.risk_factors?.length > 0 && (
        <div className="mt-6 pt-5 border-t border-white/5">
          <SectionTitle
            icon={<AlertTriangle className="w-4 h-4 text-amber-300" />}
            title="风险与不确定"
          />
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            {prediction.risk_factors.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-300 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function KeyPlayersPanel({
  prediction,
  homeName,
  awayName,
}: {
  prediction: PredictionResponse;
  homeName: string;
  awayName: string;
}) {
  const home = prediction.key_players.filter((p) => p.team === "home");
  const away = prediction.key_players.filter((p) => p.team === "away");
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <SectionTitle icon={<Users className="w-4 h-4" />} title="关键球员" />
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <PlayerGroup label={homeName} players={home} accent="cyan" />
        <PlayerGroup label={awayName} players={away} accent="violet" />
      </div>
    </div>
  );
}

function PlayerGroup({
  label,
  players,
  accent,
}: {
  label: string;
  players: KeyPlayer[];
  accent: "cyan" | "violet";
}) {
  return (
    <div>
      <div
        className={cn(
          "text-[11px] font-mono tracking-widest uppercase mb-2",
          accent === "cyan" ? "text-cyan-300/80" : "text-violet-300/80"
        )}
      >
        {label}
      </div>
      <div className="space-y-2">
        {players.map((p, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/[0.03] hairline p-3 hover:bg-white/[0.05] transition"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {p.name}
                </div>
                <div className="text-[10px] font-mono text-white/45">
                  {p.position}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-mono text-white tabular-nums">
                  {p.strength.toFixed(1)}
                </div>
                <div className="text-[10px] font-mono text-white/40">
                  状态 {p.form_score.toFixed(1)}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/55 leading-relaxed">
              {p.rationale}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionTitle({
  icon,
  title,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white">
        <span className="text-cyan-300">{icon}</span>
        <h3 className="text-base sm:text-lg font-semibold tracking-tight">
          {title}
        </h3>
      </div>
      {right}
    </div>
  );
}
