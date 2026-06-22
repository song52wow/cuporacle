"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import type { ModelResult } from "@/lib/types";
import { cn, formatPct } from "@/lib/utils";
import { ModelContextModal } from "./ModelContextModal";

interface Props {
  matchId: string;
  models: ModelResult[];
  selectedProvider?: string;
  onSelect?: (provider: string) => void;
}

export function ModelComparison({ matchId, models, selectedProvider, onSelect }: Props) {
  const [contextProvider, setContextProvider] = useState<ModelResult | null>(null);

  return (
    <>
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white">
            <span className="text-cyan-300">
              <Cpu className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">
              多模型对比
            </h3>
          </div>
          <span className="text-[11px] font-mono text-white/45">
            {models.filter((m) => m.status === "ok").length}/{models.length} 模型就绪
          </span>
        </div>

        <div className="space-y-2">
          {models.map((m, i) => (
            <ModelRow
              key={m.provider}
              model={m}
              isSelected={m.provider === selectedProvider}
              delay={i * 0.05}
              onClick={onSelect ? () => onSelect(m.provider) : undefined}
              onViewContext={() => setContextProvider(m)}
            />
          ))}
        </div>

        <ConsensusBar models={models} />
      </div>

      {contextProvider && (
        <ModelContextModal
          matchId={matchId}
          provider={contextProvider.provider}
          modelName={contextProvider.model}
          onClose={() => setContextProvider(null)}
        />
      )}
    </>
  );
}

function ModelRow({
  model,
  isSelected,
  delay,
  onClick,
  onViewContext,
}: {
  model: ModelResult;
  isSelected: boolean;
  delay: number;
  onClick?: () => void;
  onViewContext: () => void;
}) {
  const ok = model.status === "ok";
  const max = Math.max(model.win_prob ?? 0, model.draw_prob ?? 0, model.loss_prob ?? 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={cn(
        "rounded-xl p-3 hairline transition",
        onClick && "cursor-pointer",
        isSelected
          ? "bg-cyan-400/[0.06] border-cyan-400/30 ring-1 ring-cyan-400/30"
          : "bg-white/[0.02] hover:bg-white/[0.04]"
      )}
    >
      <div className="flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {ok ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
          )}
          <span className="font-mono text-white/85">{model.provider}</span>
          {isSelected && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
              查看中
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            title="查看上下文"
            onClick={(e) => {
              e.stopPropagation();
              onViewContext();
            }}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md text-white/45 hover:text-cyan-300 hover:bg-cyan-400/10 border border-transparent hover:border-cyan-400/20 transition"
          >
            <FileText className="w-3 h-3" />
            上下文
          </button>
          <span className="text-[10px] font-mono text-white/40 truncate max-w-[80px] hidden sm:inline">
            {model.model}
          </span>
        </div>
      </div>
      {ok ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-ink-700/50 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500"
              style={{ width: `${((model.win_prob ?? 0) / max) * 100}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-violet-500"
              style={{ width: `${((model.draw_prob ?? 0) / max) * 100}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
              style={{ width: `${((model.loss_prob ?? 0) / max) * 100}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-white/55 tabular-nums whitespace-nowrap">
            {formatPct(model.win_prob ?? 0, 0)} · {formatPct(model.draw_prob ?? 0, 0)} · {formatPct(model.loss_prob ?? 0, 0)}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[11px] font-mono text-rose-300/85">
          {model.error ?? "模型未返回结果"}
        </div>
      )}
    </motion.div>
  );
}

function ConsensusBar({ models }: { models: ModelResult[] }) {
  const ok = models.filter((m) => m.status === "ok" && m.win_prob != null);
  if (ok.length < 2) return null;
  const avg = (key: keyof ModelResult) =>
    ok.reduce((a, b) => a + ((b[key] as number) ?? 0), 0) / ok.length;
  const w = avg("win_prob");
  const d = avg("draw_prob");
  const l = avg("loss_prob");
  const dev =
    ok.reduce(
      (a, b) =>
        a +
        (Math.abs(((b.win_prob ?? 0) - w) +
          (b.draw_prob ?? 0) - d +
          (b.loss_prob ?? 0) - l)),
      0
    ) / ok.length;
  const consensus = Math.max(0, Math.min(1, 1 - dev * 1.5));
  return (
    <div className="mt-5 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between text-[11px] font-mono text-white/55">
        <span>多模型共识度</span>
        <span className="text-white">{(consensus * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-ink-700/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${consensus * 100}%` }}
          transition={{ duration: 1, delay: 0.4 }}
          className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400"
        />
      </div>
    </div>
  );
}
