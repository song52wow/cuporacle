"use client";

import { useTranslations } from "next-intl";
import type { ThirdPlaceRankingEntry } from "@/lib/types";
import { TournamentRankingTable } from "@/components/TournamentRankingTable";

interface Props {
  entries: ThirdPlaceRankingEntry[];
  spots?: number;
  className?: string;
}

export function ThirdPlaceRankingPanel({ entries, spots = 8, className }: Props) {
  const t = useTranslations("qualification");

  return (
    <TournamentRankingTable
      className={className}
      title={t("thirdPlaceTitle")}
      subtitle={t("thirdPlaceSubtitle", { spots })}
      legend={t("thirdPlaceLegend", { spots })}
      rows={entries}
      highlightRow={(row) => row.rank <= spots}
      showRankRange
    />
  );
}
