import { getTournament, getMatches } from "@/lib/api";
import { Sparkles, Calendar, CheckCircle2, Brain } from "lucide-react";

export async function StatsBar() {
  const t = await getTournament();
  const matches = await getMatches();
  const upcoming = matches.matches.filter((m) =>
    ["TIMED", "SCHEDULED"].includes(m.status)
  ).length;
  const finished = matches.matches.filter((m) => m.status === "FINISHED").length;
  // 找到有预测的比赛数
  const withPrediction = matches.matches.filter(
    (m) => m.prediction_models_ok > 0
  ).length;

  const items = [
    {
      icon: Calendar,
      label: "全部比赛",
      value: t.match_count,
      suffix: "场",
    },
    {
      icon: Sparkles,
      label: "未开赛",
      value: upcoming,
      suffix: "场",
    },
    {
      icon: CheckCircle2,
      label: "已结束",
      value: finished,
      suffix: "场",
    },
    {
      icon: Brain,
      label: "AI 已预测",
      value: withPrediction,
      suffix: "场",
    },
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 -mt-10">
      <div className="relative glass-strong rounded-2xl p-2 shadow-glass">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.label}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/[0.03] transition"
              >
                <div className="w-10 h-10 rounded-lg grid place-items-center bg-white/[0.04] border border-white/10">
                  <Icon className="w-4.5 h-4.5 text-cyan-300" />
                </div>
                <div className="leading-none">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
                      {it.value}
                    </span>
                    <span className="text-xs font-mono text-white/40">
                      {it.suffix}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-white/55">
                    {it.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
