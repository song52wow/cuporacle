"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import { TeamFlag } from "./TeamFlag";
import { TeamName } from "./TeamName";
import { WinProbBar } from "./WinProbBar";
import type { Match, PredictionBundle } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

interface Props {
  match: Match;
  prediction?: PredictionBundle | null;
}

export function MatchCard({ match, prediction }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("matches");
  const tStages = useTranslations("stages");
  const p = prediction?.primary;
  const hasP = !!p;
  const isFinished = match.status === "FINISHED";
  const stageLabel = match.stage
    ? tStages(match.stage as "GROUP_STAGE")
    : match.stage;

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group block relative glass rounded-2xl p-5 hover:ring-1 hover:ring-cyan-400/40 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-white/55">
          {match.group && (
            <span className="px-1.5 py-0.5 rounded font-mono bg-white/[0.06] text-cyan-300/90">
              {match.group}{t("groupSuffix")}
            </span>
          )}
          <span className="font-medium text-white/70">{stageLabel}</span>
        </div>
        <div className="flex items-center gap-1 text-white/45 font-mono">
          <Calendar className="w-3 h-3" />
          {isFinished ? t("finished") : relativeTime(match.utc_date, locale)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <TeamFlag name={match.home_team_name} size="md" />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-white truncate">
              <TeamName name={match.home_team_name} />
            </div>
            <div className="text-[10px] font-mono text-white/40">{t("home")}</div>
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
              <TeamName name={match.away_team_name} />
            </div>
            <div className="text-[10px] font-mono text-white/40">{t("away")}</div>
          </div>
          <TeamFlag name={match.away_team_name} size="md" />
        </div>
      </div>

      {hasP && p ? (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1 text-cyan-300/90">
              <Sparkles className="w-3 h-3" />
              {t("aiConsensus")}
            </span>
            <span className="text-white/40">
              {p.llm_provider} · {(p.llm_model || "").slice(0, 18)}
            </span>
          </div>
          <WinProbBar win={p.win_prob} draw={p.draw_prob} loss={p.loss_prob} size="sm" showLabels />
        </div>
      ) : !isFinished ? (
        <div className="mt-5 flex items-center justify-between text-[11px] text-white/40 font-mono">
          <span>{t("predicting")}</span>
          <span>
            {t("models", {
              ok: match.prediction_models_ok,
              total: match.prediction_models_total,
            })}
          </span>
        </div>
      ) : null}

      {match.venue && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
          <MapPin className="w-3 h-3" />
          {match.venue}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 group-hover:ring-cyan-400/30 transition" />
    </Link>
  );
}
