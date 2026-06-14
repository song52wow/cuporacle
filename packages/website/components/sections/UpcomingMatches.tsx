import Link from "next/link";
import { getMatches, getPrediction } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import { ArrowRight } from "lucide-react";

export async function UpcomingMatches() {
  const list = await getMatches();
  const upcoming = list.matches
    .filter((m) => ["TIMED", "SCHEDULED"].includes(m.status))
    .sort((a, b) => +new Date(a.utc_date) - +new Date(b.utc_date))
    .slice(0, 6);

  // 并行拉预测
  const preds = await Promise.all(
    upcoming.map(async (m) => {
      const p = await getPrediction(m.id).catch((e) => {
        console.error(`[UpcomingMatches] fetch prediction failed for ${m.id}:`, e);
        return null;
      });
      console.log(`[UpcomingMatches] ${m.id} (${m.home_team_name} vs ${m.away_team_name}): primary=${p?.primary != null} models=${p?.models?.length ?? 0}`);
      return p;
    })
  );

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 mt-24">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] font-mono tracking-widest text-cyan-300/80 uppercase">
            // upcoming fixtures
          </div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            即将开赛 · 6 场焦点战
          </h2>
          <p className="mt-2 text-sm text-white/55 max-w-xl">
            从小组赛首轮到淘汰赛阶段，AI 多模型已对每场比赛给出概率化预测。
          </p>
        </div>
        <Link
          href="/matches"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
        >
          查看全部
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((m, i) => (
          <MatchCard key={m.id} match={m} prediction={preds[i]} index={i} />
        ))}
      </div>
      <div className="sm:hidden mt-4 text-center">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
        >
          查看全部赛事 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
