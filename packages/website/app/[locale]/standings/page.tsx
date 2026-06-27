import { getTranslations, getLocale } from "next-intl/server";
import { getStandings, getThirdPlaceRanking, getOverallRanking } from "@/lib/api";
import { GroupQualificationPanel } from "@/components/GroupQualificationPanel";
import { ThirdPlaceRankingPanel } from "@/components/ThirdPlaceRankingPanel";
import { OverallRankingPanel } from "@/components/OverallRankingPanel";
import { GroupJumpBar, type GroupJumpItem, type GroupJumpStatus } from "@/components/GroupJumpBar";
import type { GroupStandingEntry } from "@/lib/types";
import { formatGroupLabel, formatDateTime } from "@/lib/utils";

export const runtime = "edge";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "qualification" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

function groupStandings(standings: GroupStandingEntry[]) {
  const map = new Map<string, GroupStandingEntry[]>();
  for (const row of standings) {
    if (!map.has(row.group)) map.set(row.group, []);
    map.get(row.group)!.push(row);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

type GroupStatus = GroupJumpStatus;

function deriveGroupStatus(rows: GroupStandingEntry[]): GroupStatus {
  if (rows.every((r) => r.played === 0)) return "not_started";
  if (rows.every((r) => r.qualification_status === "qualified" || r.qualification_status === "eliminated")) {
    return "decided";
  }
  return "in_progress";
}

function partitionGroups(groups: [string, GroupStandingEntry[]][]) {
  const decided: [string, GroupStandingEntry[]][] = [];
  const inProgress: [string, GroupStandingEntry[]][] = [];
  const notStarted: [string, GroupStandingEntry[]][] = [];
  for (const [g, rows] of groups) {
    const status = deriveGroupStatus(rows);
    if (status === "decided") decided.push([g, rows]);
    else if (status === "in_progress") inProgress.push([g, rows]);
    else notStarted.push([g, rows]);
  }
  return { decided, inProgress, notStarted };
}

export default async function StandingsPage() {
  const locale = await getLocale();
  const t = await getTranslations("qualification");
  const [data, thirdPlace, overall] = await Promise.all([
    getStandings(),
    getThirdPlaceRanking(),
    getOverallRanking(),
  ]);
  const groups = groupStandings(data.standings);
  const { decided, inProgress, notStarted } = partitionGroups(groups);
  const jumpItems: GroupJumpItem[] = groups.map(([g, rows]) => ({
    id: g,
    status: deriveGroupStatus(rows),
  }));

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-cyan-violet opacity-15 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">
            {t("pageTitle")}{" "}
            <span className="text-gradient-cyan-violet">{t("pageTitleHighlight")}</span>
          </h1>
          <p className="mt-3 text-sm text-white/55 max-w-xl">{t("pageSubtitle")}</p>
          {data.updated_at && (
            <p className="mt-2 text-xs font-mono text-white/40">
              {t("updatedAt", { date: formatDateTime(data.updated_at, locale) })}
            </p>
          )}
        </div>

        {jumpItems.length > 0 && (
          <GroupJumpBar groups={jumpItems} className="mb-8" />
        )}

        {groups.length > 0 ? (
          <div className="space-y-8">
            {decided.length > 0 && (
              <GroupSection
                title={`${t("groupStatusDecided")}（${decided.length}）`}
                suffix={t("groupSuffix")}
                groups={decided}
              />
            )}
            {inProgress.length > 0 && (
              <GroupSection
                title={`${t("groupStatusInProgress")}（${inProgress.length}）`}
                suffix={t("groupSuffix")}
                groups={inProgress}
              />
            )}
            {notStarted.length > 0 && (
              <GroupSection
                title={`${t("groupStatusNotStarted")}（${notStarted.length}）`}
                suffix={t("groupSuffix")}
                groups={notStarted}
              />
            )}
          </div>
        ) : (
          <div className="glass rounded-2xl py-16 text-center text-sm font-mono text-white/45">
            {t("empty")}
          </div>
        )}

        {thirdPlace.entries.length > 0 && (
          <div className="mt-12">
            <ThirdPlaceRankingPanel entries={thirdPlace.entries} spots={thirdPlace.spots} />
          </div>
        )}

        {overall.entries.length > 0 && (
          <OverallRankingPanel
            entries={overall.entries}
            collapsible
            defaultCollapsed
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
}

function GroupSection({
  title,
  suffix,
  groups,
}: {
  title: string;
  suffix: string;
  groups: [string, GroupStandingEntry[]][];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3 border-y border-white/[0.06] bg-white/[0.015] py-2.5 pl-3 border-l-2 border-l-cyan-400/40">
        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300/80">
          {title}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map(([group, rows]) => (
          <div key={group} id={`group-${group}`} className="scroll-mt-40">
            <GroupQualificationPanel
              groupName={`${formatGroupLabel(group)}${suffix}`}
              rows={rows}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
