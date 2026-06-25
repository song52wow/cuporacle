"use client";

import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Match, PredictionResponse, ModelResult } from "@/lib/types";
import { TeamFlag } from "@/components/TeamFlag";
import { TeamName } from "@/components/TeamName";
import { WinProbBar } from "@/components/WinProbBar";
import { formatDate, topScore } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export function PredictionHero({
  match,
  prediction,
  activeModel,
}: {
  match: Match;
  prediction: PredictionResponse | null;
  activeModel?: ModelResult | null;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("matchDetail");
  const tMatches = useTranslations("matches");
  const tStages = useTranslations("stages");
  const tCommon = useTranslations("common");

  const p = (activeModel?.status === "ok"
    ? {
        ...prediction!,
        win_prob: activeModel.win_prob ?? prediction?.win_prob ?? 0,
        draw_prob: activeModel.draw_prob ?? prediction?.draw_prob ?? 0,
        loss_prob: activeModel.loss_prob ?? prediction?.loss_prob ?? 0,
        expected_goals_home: activeModel.expected_goals_home ?? prediction?.expected_goals_home ?? 0,
        expected_goals_away: activeModel.expected_goals_away ?? prediction?.expected_goals_away ?? 0,
        score_distribution: activeModel.score_distribution ?? prediction?.score_distribution ?? [],
        llm_provider: activeModel.provider,
        llm_model: activeModel.model,
      }
    : prediction);
  const isFinished = match.status === "FINISHED";
  const top = p ? topScore(p.score_distribution) : null;
  const stageLabel = match.stage
    ? tStages(match.stage as "GROUP_STAGE")
    : match.stage;

  return (
    <div className="relative glass-strong rounded-3xl p-6 sm:p-10 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full bg-cyan-violet opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full bg-violet-500/25 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          {match.group && (
            <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-300/90">
              {match.group}{tMatches("groupSuffix")}
            </span>
          )}
          <span className="text-white/70">{stageLabel}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/55">{formatDate(match.utc_date, locale)}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-emerald-300/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
            {isFinished ? tMatches("finished") : t("aiReady")}
          </span>
        </div>

        <div className="mt-6 flex items-center gap-3 sm:gap-4">
          <TeamSide
            className="flex-1"
            name={match.home_team_name}
            isHome
            score={match.home_score}
            finished={isFinished}
            xg={prediction?.expected_goals_home}
            homeLabel={tMatches("home")}
            awayLabel={tMatches("away")}
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
                  {tCommon("kickoff")}
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
            homeLabel={tMatches("home")}
            awayLabel={tMatches("away")}
          />
        </div>

        {prediction ? (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono text-white/55">
                <span className="inline-flex items-center gap-1.5 text-cyan-300/90">
                  <Sparkles className="w-3 h-3" /> {t("aiProb")}
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/45">
                {p?.llm_provider} · {p?.llm_model}
              </div>
            </div>
            <WinProbBar
              win={p?.win_prob ?? 0}
              draw={p?.draw_prob ?? 0}
              loss={p?.loss_prob ?? 0}
              size="lg"
            />
            {top && (
              <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-white/55">
                <span>{t("mostLikelyScore")}</span>
                <span className="text-white font-semibold text-sm">
                  {top.home} - {top.away}
                </span>
                <span className="text-emerald-300/90">
                  {t("confidence", { pct: (top.p * 100).toFixed(1) })}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 p-4 rounded-xl bg-white/[0.03] hairline text-center text-sm text-white/55 font-mono">
            {t("noPrediction")}
          </div>
        )}

        {p && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label={t("xgHome")} value={p.expected_goals_home.toFixed(2)} />
            <Stat label={t("xgAway")} value={p.expected_goals_away.toFixed(2)} />
            <Stat
              label={t("goalDiff")}
              value={(p.expected_goals_home - p.expected_goals_away).toFixed(2)}
              positive={p.expected_goals_home > p.expected_goals_away}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TeamSide({
  name,
  isHome,
  score,
  finished,
  xg,
  className = "",
  homeLabel,
  awayLabel,
}: {
  name: string;
  isHome: boolean;
  score: number | null;
  finished: boolean;
  xg?: number;
  className?: string;
  homeLabel: string;
  awayLabel: string;
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
          <TeamName name={name} />
        </div>
        <div className="text-[10px] font-mono text-white/40 mt-0.5">
          {isHome ? homeLabel : awayLabel}
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
