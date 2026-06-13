import { getMatches, getPrediction } from "@/lib/api";
import { MatchesExplorer } from "@/components/MatchesExplorer";
import { Suspense } from "react";

export const metadata = {
  title: "全部赛事 · CupOracle",
  description: "浏览 2026 世界杯全部 104 场比赛的 AI 预测与状态。",
};

export default async function MatchesPage() {
  const list = await getMatches();
  // 给所有未结束的比赛并行拉预测
  const preds = await Promise.all(
    list.matches.map((m) =>
      ["TIMED", "SCHEDULED", "IN_PLAY"].includes(m.status)
        ? getPrediction(m.id).catch(() => null)
        : Promise.resolve(null)
    )
  );
  const predictions: Record<string, ReturnType<typeof getPrediction> extends Promise<infer T> ? T : never> = {};
  list.matches.forEach((m, i) => {
    predictions[m.id] = preds[i];
  });

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-20 right-0 w-[600px] h-[420px] rounded-full bg-violet-500/20 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[11px] font-mono tracking-widest text-cyan-300/80 uppercase">
            // tournament
          </div>
          <h1 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">
            全部 <span className="text-gradient-cyan-violet">赛事</span>
          </h1>
          <p className="mt-3 text-sm text-white/55 max-w-xl">
            覆盖小组赛 64 场到决赛，共 104 场赛事。支持状态、分组与球队搜索。
          </p>
        </div>
        <Suspense fallback={null}>
          <MatchesExplorer matches={list.matches} predictions={predictions} />
        </Suspense>
      </div>
    </div>
  );
}
