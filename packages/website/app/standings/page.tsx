import { getStandings } from "@/lib/api";
import { GroupQualificationPanel } from "@/components/GroupQualificationPanel";
import type { GroupStandingEntry } from "@/lib/types";
import { formatGroupLabel } from "@/lib/utils";

export const runtime = "edge";

export const metadata = {
  title: "小组赛出线形势 · CupOracle",
  description: "2026 世界杯小组赛各队出线条件与形势。",
};

function groupStandings(standings: GroupStandingEntry[]) {
  const map = new Map<string, GroupStandingEntry[]>();
  for (const row of standings) {
    if (!map.has(row.group)) map.set(row.group, []);
    map.get(row.group)!.push(row);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default async function StandingsPage() {
  const data = await getStandings();
  const groups = groupStandings(data.standings);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-cyan-violet opacity-15 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">
            小组赛 <span className="text-gradient-cyan-violet">出线形势</span>
          </h1>
          <p className="mt-3 text-sm text-white/55 max-w-xl">
            各队出线状态与晋级条件。小组前 2 名晋级淘汰赛。
          </p>
          {data.updated_at && (
            <p className="mt-2 text-xs font-mono text-white/40">
              更新于 {new Date(data.updated_at).toLocaleString("zh-CN")}
            </p>
          )}
        </div>

        {groups.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map(([group, rows]) => (
              <GroupQualificationPanel
                key={group}
                groupName={`${formatGroupLabel(group)} 组`}
                rows={rows}
              />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl py-16 text-center text-sm font-mono text-white/45">
            暂无出线形势数据
          </div>
        )}
      </div>
    </div>
  );
}
