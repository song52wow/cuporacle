"use client";

import { useTranslations } from "next-intl";
import type { ThirdPlaceRankingEntry } from "@/lib/types";
import { TournamentRankingTable } from "@/components/TournamentRankingTable";

interface Props {
  entries: ThirdPlaceRankingEntry[];
  spots?: number;
}

export function ThirdPlaceRankingPanel({ entries, spots = 8 }: Props) {
  const t = useTranslations("qualification");

  return (
    <TournamentRankingTable
      className="mb-8"
      title={t("thirdPlaceTitle")}
      subtitle={t("thirdPlaceSubtitle", { spots })}
      legend={t("thirdPlaceLegend", { spots })}
      rows={entries}
      highlightRow={(row) => row.rank <= spots}
      showRankRange
    />
  );
}
