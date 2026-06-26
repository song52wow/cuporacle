"use client";

import { useTranslations } from "next-intl";
import { TeamFlag } from "@/components/TeamFlag";
import { TeamName } from "@/components/TeamName";
import { cn, formatGroupLabel } from "@/lib/utils";

export type RankingQualificationStatus = "qualified" | "pending" | "eliminated" | null | undefined;

export interface TournamentRankingRow {
  rank: number;
  team_id: string;
  team_name: string;
  group: string;
  group_position?: number;
  played: number;
  points: number;
  goal_diff: number;
  goals_for: number;
  group_finished?: boolean;
  qualification_status?: RankingQualificationStatus;
  qualification_note?: string | null;
  rank_best?: number;
  rank_worst?: number;
}

interface Props {
  title: string;
  subtitle?: string;
  legend?: string;
  rows: TournamentRankingRow[];
  highlightRow?: (row: TournamentRankingRow) => boolean;
  showGroupPosition?: boolean;
  showRankRange?: boolean;
  className?: string;
}

export function TournamentRankingTable({
  title,
  subtitle,
  legend,
  rows,
  highlightRow,
  showGroupPosition = false,
  showRankRange = false,
  className,
}: Props) {
  const t = useTranslations("qualification");

  function statusLabel(status: RankingQualificationStatus): string {
    if (status === "qualified") return t("qualified");
    if (status === "pending") return t("pending");
    if (status === "eliminated") return t("eliminated");
    return t("unknown");
  }

  function statusClass(status: RankingQualificationStatus): string {
    if (status === "qualified") return "bg-emerald-400/15 text-emerald-300 border-emerald-400/25";
    if (status === "pending") return "bg-amber-400/15 text-amber-300 border-amber-400/25";
    if (status === "eliminated") return "bg-white/[0.06] text-white/45 border-white/10";
    return "bg-white/[0.06] text-white/45 border-white/10";
  }

  function conditionText(row: TournamentRankingRow): string {
    if (row.qualification_note) return row.qualification_note;
    if (row.qualification_status === "qualified") return t("locked");
    if (row.qualification_status === "eliminated") return t("out");
    if (row.played === 0) return t("notStarted");
    return t("tbd");
  }

  if (rows.length === 0) return null;

  return (
    <div className={cn("glass rounded-2xl overflow-hidden", className)}>
      <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-widest text-white/40 border-b border-white/[0.06]">
              <th className="px-4 py-3 text-left font-medium w-12">{t("rankCol")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("teamCol")}</th>
              {showGroupPosition && (
                <th className="px-3 py-3 text-center font-medium w-16">{t("groupPosCol")}</th>
              )}
              <th className="px-3 py-3 text-center font-medium w-14">{t("playedCol")}</th>
              <th className="px-3 py-3 text-center font-medium w-14">{t("pointsCol")}</th>
              <th className="px-3 py-3 text-center font-medium w-14">{t("gdCol")}</th>
              <th className="px-3 py-3 text-center font-medium w-14">{t("gfCol")}</th>
              <th className="px-3 py-3 text-left font-medium w-20">{t("statusCol")}</th>
              <th className="px-4 py-3 text-left font-medium min-w-[180px]">{t("conditionCol")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const highlighted = highlightRow?.(row) ?? false;
              return (
                <tr
                  key={row.team_id}
                  className={cn(
                    "border-b border-white/[0.04] last:border-0",
                    highlighted ? "bg-emerald-400/[0.04]" : "bg-transparent"
                  )}
                >
                  <td className="px-4 py-3.5 font-mono text-white/80">
                    <span
                      className={cn(
                        "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded px-1.5 text-xs",
                        highlighted ? "bg-emerald-400/15 text-emerald-300" : "text-white/55"
                      )}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TeamFlag name={row.team_name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">
                          <TeamName name={row.team_name} />
                        </div>
                        <div className="text-[11px] font-mono text-white/40">
                          {formatGroupLabel(row.group)}
                          {row.group_finished === false && (
                            <span className="ml-1.5 text-amber-300/80">{t("groupPending")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {showGroupPosition && (
                    <td className="px-3 py-3.5 text-center font-mono text-white/60">
                      {row.group_position ?? "—"}
                    </td>
                  )}
                  <td className="px-3 py-3.5 text-center font-mono text-white/70">{row.played}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-white">{row.points}</td>
                  <td className="px-3 py-3.5 text-center font-mono text-white/70">
                    {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                  </td>
                  <td className="px-3 py-3.5 text-center font-mono text-white/70">{row.goals_for}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={cn(
                          "inline-flex w-fit text-[10px] px-1.5 py-0.5 rounded border font-medium",
                          statusClass(row.qualification_status)
                        )}
                      >
                        {statusLabel(row.qualification_status)}
                      </span>
                      {showRankRange &&
                        row.rank_best != null &&
                        row.rank_worst != null &&
                        row.rank_best !== row.rank_worst && (
                          <span className="text-[11px] font-mono text-white/40">
                            {t("rankRange", { best: row.rank_best, worst: row.rank_worst })}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-white/65 leading-relaxed max-w-xs">
                    {conditionText(row)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {legend && (
        <div className="px-4 sm:px-5 py-3 border-t border-white/[0.06] text-[11px] text-white/40">
          {legend}
        </div>
      )}
    </div>
  );
}
