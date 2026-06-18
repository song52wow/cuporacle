import { getMatches, getPrediction } from "@/lib/api";
import { MatchesExplorer } from "@/components/MatchesExplorer";
import { Suspense } from "react";

// Cloudflare Pages / Workers 要求显式声明 Edge Runtime
export const runtime = "edge";

export const metadata = {
  title: "全部赛事 · CupOracle",
  description: "浏览 2026 世界杯全部赛事的 AI 预测与状态。",
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white text-balance">
            全部 <span className="text-gradient-cyan-violet">赛事</span>
          </h1>
          <p className="mt-3 text-sm text-white/55 max-w-xl">
            覆盖从小组赛到决赛的全部赛事。支持状态、分组与球队搜索。
          </p>
        </div>
        <Suspense fallback={null}>
          <MatchesExplorer matches={list.matches} predictions={predictions} />
        </Suspense>
      </div>
    </div>
  );
}
