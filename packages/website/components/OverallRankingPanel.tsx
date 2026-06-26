"use client";

import { useTranslations } from "next-intl";
import type { OverallRankingEntry } from "@/lib/types";
import { TournamentRankingTable } from "@/components/TournamentRankingTable";

interface Props {
  entries: OverallRankingEntry[];
}

export function OverallRankingPanel({ entries }: Props) {
  const t = useTranslations("qualification");

  return (
    <TournamentRankingTable
      className="mb-8"
      title={t("overallTitle")}
      subtitle={t("overallSubtitle")}
      legend={t("overallLegend")}
      rows={entries}
      highlightRow={(row) => row.qualification_status === "qualified"}
      showGroupPosition
    />
  );
}
