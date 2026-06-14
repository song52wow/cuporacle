"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import type { Match, PredictionBundle } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | "TIMED" | "FINISHED" | "IN_PLAY";
type GroupFilter = "ALL" | string;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "全部" },
  { value: "TIMED", label: "未开赛" },
  { value: "IN_PLAY", label: "进行中" },
  { value: "FINISHED", label: "已结束" },
];

interface Props {
  matches: Match[];
  predictions: Record<string, PredictionBundle | null>;
}

export function MatchesExplorer({ matches, predictions }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [group, setGroup] = useState<GroupFilter>("ALL");
  const [q, setQ] = useState("");

  // 初始化自 query string
  useEffect(() => {
    const s = params.get("status");
    if (s === "TIMED" || s === "FINISHED" || s === "IN_PLAY" || s === "ALL") {
      setStatus(s);
    } else {
      setStatus("ALL");
    }
  }, [params]);

  const groups = useMemo(() => {
    const g = new Set<string>();
    matches.forEach((m) => m.group && g.add(m.group));
    return Array.from(g).sort();
  }, [matches]);

  const filtered = useMemo(() => {
    return matches
      .filter((m) => {
        if (status === "ALL") return true;
        return m.status === status;
      })
      .filter((m) => {
        if (group === "ALL") return true;
        return m.group === group;
      })
      .filter((m) => {
        if (!q.trim()) return true;
        const k = q.toLowerCase();
        return (
          m.home_team_name.toLowerCase().includes(k) ||
          m.away_team_name.toLowerCase().includes(k) ||
          (m.venue ?? "").toLowerCase().includes(k)
        );
      })
      .sort((a, b) => +new Date(a.utc_date) - +new Date(b.utc_date));
  }, [matches, status, group, q]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      ALL: matches.length,
      TIMED: 0,
      FINISHED: 0,
      IN_PLAY: 0,
    };
    matches.forEach((m) => {
      if (m.status in c) c[m.status as StatusFilter]++;
    });
    return c;
  }, [matches]);

  function handleStatus(s: StatusFilter) {
    setStatus(s);
    const q = new URLSearchParams();
    if (s !== "ALL") q.set("status", s);
    const qs = q.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div>
      {/* 筛选条 */}
      <div className="glass-strong rounded-2xl p-2 sm:p-3 flex flex-col gap-3">
        {/* 第 1 行：状态 + 搜索 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* 状态 tab */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-700/40 hairline overflow-x-auto">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatus(s.value)}
                className={cn(
                  "shrink-0 px-3.5 py-1.5 text-sm rounded-lg font-medium transition flex items-center gap-2",
                  status === s.value
                    ? "bg-cyan-violet text-ink-950 shadow-neon"
                    : "text-white/65 hover:text-white hover:bg-white/[0.04]"
                )}
              >
                {s.label}
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    status === s.value
                      ? "bg-ink-950/30 text-ink-950"
                      : "bg-white/[0.06] text-white/55"
                  )}
                >
                  {counts[s.value]}
                </span>
              </button>
            ))}
          </div>

          {/* 搜索 */}
          <div className="sm:ml-auto relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索球队 / 场地"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-ink-700/40 hairline text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-cyan-400/40"
            />
          </div>
        </div>

        {/* 第 2 行：分组筛选 */}
        {groups.length > 0 && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-700/40 hairline overflow-x-auto">
            <button
              onClick={() => setGroup("ALL")}
              className={cn(
                "shrink-0 px-3 py-1.5 text-xs rounded-lg font-mono font-medium transition",
                group === "ALL"
                  ? "bg-white/[0.08] text-white"
                  : "text-white/55 hover:text-white"
              )}
            >
              全部组
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-xs rounded-lg font-mono font-medium transition",
                  group === g
                    ? "bg-white/[0.08] text-white"
                    : "text-white/55 hover:text-white"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 计数 + 排序提示 */}
      <div className="mt-5 flex items-center justify-between text-xs font-mono text-white/45">
        <span>
          共 <span className="text-white">{filtered.length}</span> 场
          {q && (
            <>
              {" "}
              · 包含「
              <span className="text-white">{q}</span>」
            </>
          )}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <SlidersHorizontal className="w-3 h-3" /> 按开赛时间升序
        </span>
      </div>

      {/* 列表 */}
      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <MatchCard
              key={m.id}
              match={m}
              prediction={predictions[m.id]}
              index={i}
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center text-white/45 text-sm font-mono py-16 glass rounded-2xl">
          未找到匹配的比赛
        </div>
      )}
    </div>
  );
}
