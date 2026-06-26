"use client";

import { useTranslations } from "next-intl";
import type { GroupStandingEntry } from "@/lib/types";
import { TeamFlag } from "@/components/TeamFlag";
import { TeamName } from "@/components/TeamName";
import { cn } from "@/lib/utils";

interface Props {
  groupName: string;
  rows: GroupStandingEntry[];
  teamIds?: string[];
}

export function GroupQualificationPanel({ groupName, rows, teamIds }: Props) {
  const t = useTranslations("qualification");

  function qualificationLabel(status: GroupStandingEntry["qualification_status"]): string {
    if (status === "qualified") return t("qualified");
    if (status === "pending") return t("pending");
    if (status === "eliminated") return t("eliminated");
    return t("unknown");
  }

  function qualificationClass(status: GroupStandingEntry["qualification_status"]): string {
    if (status === "qualified") {
      return "bg-emerald-400/30 text-emerald-100 border-emerald-400/40";
    }
    if (status === "pending") {
      return "bg-amber-400/15 text-amber-300 border-amber-400/25";
    }
    if (status === "eliminated") {
      return "bg-white/[0.06] text-white/45 border-white/10";
    }
    return "bg-white/[0.06] text-white/45 border-white/10";
  }

  function conditionText(row: GroupStandingEntry): string {
    if (row.qualification_note) return row.qualification_note;
    if (row.qualification_status === "qualified") return t("locked");
    if (row.qualification_status === "eliminated") return t("out");
    if (row.played === 0) return t("notStarted");
    return t("tbd");
  }

  const sorted = [...rows]
    .sort((a, b) => a.position - b.position)
    .filter((r) => !teamIds?.length || teamIds.includes(r.team_id));

  if (sorted.length === 0) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white tracking-tight">{groupName}</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-400/25 bg-emerald-400/10 text-emerald-300/90">
            {t("chipQualifierZone")}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-400/25 bg-cyan-400/10 text-cyan-300/90">
            {t("chipThirdPlacePath")}
          </span>
        </div>
      </div>
      <ul className="divide-y divide-white/[0.07]">
        {sorted.map((r) => (
          <li
            key={r.team_id}
            className={cn(
              "px-4 py-3.5",
              r.qualification_status === "eliminated" && "opacity-55 grayscale"
            )}
          >
            <div
                className={cn(
                  "flex items-start gap-3",
                  r.qualification_status === "pending" && "border-l-2 border-cyan-400/50 pl-3 -ml-1"
                )}
              >
              <TeamFlag name={r.team_name} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">
                    <TeamName name={r.team_name} />
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border font-medium",
                      qualificationClass(r.qualification_status)
                    )}
                  >
                    {qualificationLabel(r.qualification_status)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
                  {conditionText(r)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
