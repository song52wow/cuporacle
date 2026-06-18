import Link from "next/link";
import { getMatches, getPrediction } from "@/lib/api";
import { MatchCard } from "@/components/MatchCard";
import { ArrowRight } from "lucide-react";

export async function UpcomingMatches() {
  const list = await getMatches();

  // 明天（按 Asia/Shanghai 时区切日）的 YYYY-MM-DD 边界
  const ymdInCst = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const tomorrowYmd = ymdInCst(new Date(Date.now() + 86_400_000));

  const upcoming = list.matches
    .filter((m) => ["TIMED", "SCHEDULED"].includes(m.status))
    .filter((m) => ymdInCst(new Date(m.utc_date)) === tomorrowYmd)
    .sort((a, b) => +new Date(a.utc_date) - +new Date(b.utc_date));

  // 并行拉预测
  const preds = await Promise.all(
    upcoming.map((m) => getPrediction(m.id).catch(() => null))
  );

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 mt-24">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            即将开赛 · 明日 {upcoming.length} 场
          </h2>
          <p className="mt-2 text-sm text-white/55 max-w-xl">
            AI 多模型已对明日每场比赛给出概率化预测。
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
      {upcoming.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-sm text-white/50">
          明日暂无赛事。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((m, i) => (
            <MatchCard key={m.id} match={m} prediction={preds[i]} index={i} />
          ))}
        </div>
      )}
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
