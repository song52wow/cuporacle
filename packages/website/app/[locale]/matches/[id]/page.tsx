import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { getMatchDetail, getPrediction, getStandings } from "@/lib/api";
import { getTeamName } from "@/lib/teams";
import { GroupQualificationPanel } from "@/components/GroupQualificationPanel";
import { formatGroupLabel, formatDateTime } from "@/lib/utils";
import { MatchDetailProvider, HeroFromContext, SidebarModelComparison } from "@/components/match-detail/MatchDetailClient";
import { MatchLeftContent } from "@/components/match-detail/MatchLeftContent";
import { MarketValueCompare } from "@/components/match-detail/MarketValueCompare";
import { RatingsTable } from "@/components/match-detail/RatingsTable";
import type { Locale } from "@/i18n/routing";

export const runtime = "edge";

export async function generateMetadata({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "matchDetail" });
  const detail = await getMatchDetail(id);
  if (!detail) return { title: t("notFound") };
  const loc = locale as Locale;
  const home = getTeamName(detail.match.home_team_name, loc);
  const away = getTeamName(detail.match.away_team_name, loc);
  return {
    title: `${home} vs ${away} · CupOracle`,
    description: t("metaDescription", { home, away }),
  };
}

export default async function MatchDetailPage({
  params: { id },
}: {
  params: { id: string; locale: string };
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("matchDetail");
  const tStages = await getTranslations("stages");
  const tCommon = await getTranslations("common");

  const detail = await getMatchDetail(id);
  if (!detail) return notFound();
  const [prediction, standingsData] = await Promise.all([
    getPrediction(id),
    getStandings(),
  ]);
  const m = detail.match;
  const groupRows =
    m.group && m.stage === "GROUP_STAGE"
      ? standingsData.standings.filter((r) => r.group === m.group)
      : [];

  const homeDisplay = getTeamName(m.home_team_name, locale);
  const awayDisplay = getTeamName(m.away_team_name, locale);
  const stageLabel = m.stage ? tStages(m.stage as "GROUP_STAGE") : "-";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[420px] rounded-full bg-cyan-violet opacity-20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-20">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-white/55 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("back")}
        </Link>

        <MatchDetailProvider match={m} prediction={prediction}>
          <div className="mt-6">
            <HeroFromContext />
          </div>

          {(detail.home_squad.length > 0 || detail.away_squad.length > 0) && (
            <div className="mt-6">
              <MarketValueCompare
                homeName={homeDisplay}
                awayName={awayDisplay}
                homeSquad={detail.home_squad}
                awaySquad={detail.away_squad}
              />
            </div>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-start-3 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
              <div className="glass rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4 text-white">
                  <span className="text-cyan-300">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight">
                    {t("matchInfo")}
                  </h3>
                </div>
                <dl className="space-y-3 text-sm">
                  <Row k={t("kickoff")} v={formatDateTime(m.utc_date, locale)} />
                  <Row k={t("venue")} v={m.venue ?? tCommon("tbd")} />
                  <Row k={t("stage")} v={stageLabel} />
                  <Row k={t("group")} v={m.group ?? "—"} />
                  <Row
                    k={t("modelStatus")}
                    v={
                      <span className="font-mono">
                        <span className="text-emerald-300">{m.prediction_models_ok}</span>
                        <span className="text-white/40"> / </span>
                        <span className="text-white">{m.prediction_models_total}</span>
                      </span>
                    }
                  />
                </dl>
              </div>

              <SidebarModelComparison />
            </div>

            <div className="space-y-5 min-w-0 lg:col-span-2 lg:col-start-1 lg:row-start-1">
              <MatchLeftContent homeName={homeDisplay} awayName={awayDisplay} />

              {groupRows.length > 0 && (
                <GroupQualificationPanel
                  groupName={t("groupQualification", {
                    group: formatGroupLabel(m.group),
                  })}
                  rows={groupRows}
                  teamIds={[m.home_team_id, m.away_team_id]}
                />
              )}

              <RatingsTable
                home={detail.home_ratings}
                away={detail.away_ratings}
                homeName={homeDisplay}
                awayName={awayDisplay}
              />
            </div>
          </div>
        </MatchDetailProvider>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] font-mono tracking-widest text-white/45 uppercase">
        {k}
      </dt>
      <dd className="text-white/85 text-right">{v}</dd>
    </div>
  );
}
