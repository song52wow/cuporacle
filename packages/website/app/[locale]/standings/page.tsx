import { getTranslations, getLocale } from "next-intl/server";
import { getStandings } from "@/lib/api";
import { GroupQualificationPanel } from "@/components/GroupQualificationPanel";
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

export default async function StandingsPage() {
  const locale = await getLocale();
  const t = await getTranslations("qualification");
  const data = await getStandings();
  const groups = groupStandings(data.standings);

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

        {groups.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map(([group, rows]) => (
              <GroupQualificationPanel
                key={group}
                groupName={`${formatGroupLabel(group)}${t("groupSuffix")}`}
                rows={rows}
              />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl py-16 text-center text-sm font-mono text-white/45">
            {t("empty")}
          </div>
        )}
      </div>
    </div>
  );
}
