"use client";

import { useTranslations } from "next-intl";
import type { OverallRankingEntry } from "@/lib/types";
import { TournamentRankingTable } from "@/components/TournamentRankingTable";

interface Props {
  entries: OverallRankingEntry[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export function OverallRankingPanel({ entries, collapsible, defaultCollapsed, className }: Props) {
  const t = useTranslations("qualification");

  return (
    <TournamentRankingTable
      className={className}
      title={t("overallTitle")}
      subtitle={t("overallSubtitle")}
      legend={t("overallLegend")}
      rows={entries}
      highlightRow={(row) => row.qualification_status === "qualified"}
      showGroupPosition
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
    />
  );
}
