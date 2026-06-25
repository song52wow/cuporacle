import type { GroupStandingEntry } from "@/lib/types";
import { TeamFlag } from "@/components/TeamFlag";
import { cn } from "@/lib/utils";

interface Props {
  groupName: string;
  rows: GroupStandingEntry[];
  /** 仅展示指定球队（比赛详情页用） */
  teamIds?: string[];
}

function qualificationLabel(
  status: GroupStandingEntry["qualification_status"]
): string {
  if (status === "qualified") return "已出线";
  if (status === "pending") return "待出线";
  if (status === "eliminated") return "已淘汰";
  return "待定";
}

function qualificationClass(
  status: GroupStandingEntry["qualification_status"]
): string {
  if (status === "qualified") {
    return "bg-emerald-400/15 text-emerald-300 border-emerald-400/25";
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
  if (row.qualification_status === "qualified") return "已锁定出线名额";
  if (row.qualification_status === "eliminated") return "已无缘出线";
  if (row.played === 0) return "尚未开赛，出线形势待定";
  return "出线形势待定";
}

export function GroupQualificationPanel({ groupName, rows, teamIds }: Props) {
  const sorted = [...rows]
    .sort((a, b) => a.position - b.position)
    .filter((r) => !teamIds?.length || teamIds.includes(r.team_id));

  if (sorted.length === 0) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white tracking-tight">
          {groupName}
        </h3>
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          前 2 名出线
        </span>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {sorted.map((r) => (
          <li key={r.team_id} className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              <TeamFlag name={r.team_name} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">
                    {r.team_name}
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
