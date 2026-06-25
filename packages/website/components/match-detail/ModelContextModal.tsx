"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { fetchModelContext } from "@/lib/api";
import type { ModelContextResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  matchId: string;
  provider: string;
  modelName: string;
  onClose: () => void;
}

type Tab = "user" | "system";

export function ModelContextModal({ matchId, provider, modelName, onClose }: Props) {
  const t = useTranslations("matchDetail");
  const [tab, setTab] = useState<Tab>("user");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ModelContextResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const data = await fetchModelContext(matchId, provider);
      if (cancelled) return;
      if (!data) {
        setError(t("contextError"));
      } else {
        setCtx(data);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [matchId, provider, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const activeText = tab === "user" ? ctx?.user_prompt : ctx?.system_prompt;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-3xl max-h-[90vh] flex flex-col glass rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-white">
              <FileText className="w-4 h-4 text-cyan-300" />
              <h3 className="text-base font-semibold">{t("modelContext")}</h3>
            </div>
            <p className="mt-1 text-xs font-mono text-white/50">
              {provider} · {modelName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            aria-label={t("close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          <TabButton active={tab === "user"} onClick={() => setTab("user")}>
            {t("userInput")}
          </TabButton>
          <TabButton active={tab === "system"} onClick={() => setTab("system")}>
            {t("systemPrompt")}
          </TabButton>
        </div>

        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-white/50">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-mono">{t("loading")}</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-2 py-8 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {ctx && !loading && (
            <>
              {ctx.prompt_hash && (
                <div
                  className={cn(
                    "mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-mono",
                    ctx.prompt_hash_match === true
                      ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                      : ctx.prompt_hash_match === false
                        ? "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                        : "bg-white/5 text-white/50 border border-white/10"
                  )}
                >
                  {ctx.prompt_hash_match === true ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    prompt_hash: {ctx.prompt_hash}
                    {ctx.prompt_hash_match === true && t("hashMatch")}
                    {ctx.prompt_hash_match === false && t("hashMismatch")}
                  </span>
                </div>
              )}

              <pre className="whitespace-pre-wrap break-words text-xs font-mono text-white/80 leading-relaxed bg-black/30 rounded-xl p-4 border border-white/5">
                {activeText}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-mono transition",
        active
          ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
          : "text-white/45 hover:text-white/70 hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}
