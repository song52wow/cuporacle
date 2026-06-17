import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Quote, BookOpen, MapPin } from "lucide-react";
import { getMatchDetail, getPrediction } from "@/lib/api";
import { PredictionHero } from "@/components/match-detail/PredictionHero";
import {
  KeyFactorsPanel,
  KeyPlayersPanel,
} from "@/components/match-detail/KeyFactorsPanel";
import { ModelComparison } from "@/components/match-detail/ModelComparison";
import { MarketValueCompare } from "@/components/match-detail/MarketValueCompare";

// Cloudflare Pages / Workers 要求显式声明 Edge Runtime
export const runtime = "edge";
import { RatingsTable } from "@/components/match-detail/RatingsTable";
import { ScoreDistributionBars } from "@/components/ScoreDistributionBars";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const detail = await getMatchDetail(params.id);
  if (!detail) return { title: "未找到比赛 · CupOracle" };
  return {
    title: `${detail.match.home_team_name} vs ${detail.match.away_team_name} · CupOracle`,
    description: `AI 多模型预测：${detail.match.home_team_name} vs ${detail.match.away_team_name}`,
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const detail = await getMatchDetail(params.id);
  if (!detail) return notFound();
  const prediction = await getPrediction(params.id);
  const p = prediction?.primary ?? null;
  const m = detail.match;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[420px] rounded-full bg-cyan-violet opacity-20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-20">
        {/* 返回 */}
        <Link
          href="/matches"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-white/55 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回赛事列表
        </Link>

        {/* Hero 预测 */}
        <div className="mt-6">
          <PredictionHero match={m} prediction={p} />
        </div>

        {/* 主体网格 */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* 左：核心 2 列 */}
          <div className="lg:col-span-2 space-y-5">
            {/* 比分分布 */}
            {p && p.score_distribution.length > 0 && (
              <div className="glass rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4 text-white">
                  <span className="text-cyan-300">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight">
                    最可能比分（Top {Math.min(8, p.score_distribution.length)}）
                  </h3>
                </div>
                <ScoreDistributionBars items={p.score_distribution} limit={8} />
              </div>
            )}

            {/* 关键因素 + 关键球员 */}
            {p && <KeyFactorsPanel prediction={p} />}
            {p && p.key_players.length > 0 && (
              <KeyPlayersPanel
                prediction={p}
                homeName={m.home_team_name}
                awayName={m.away_team_name}
              />
            )}

            {/* 叙述 */}
            {p?.narrative && (
              <div className="glass rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3 text-white">
                  <span className="text-cyan-300">
                    <Quote className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight">
                    AI 解读
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-white/75 leading-relaxed">
                  {p.narrative}
                </p>
              </div>
            )}

            {/* 球员评分 */}
            <RatingsTable
              home={detail.home_ratings}
              away={detail.away_ratings}
              homeName={m.home_team_name}
              awayName={m.away_team_name}
            />

            {/* 阵容身价对比 */}
            {(detail.home_squad.length > 0 || detail.away_squad.length > 0) && (
              <MarketValueCompare
                homeName={m.home_team_name}
                awayName={m.away_team_name}
                homeSquad={detail.home_squad}
                awaySquad={detail.away_squad}
              />
            )}
          </div>

          {/* 右：多模型对比 + 比赛信息 */}
          <div className="space-y-5">
            {prediction && (
              <ModelComparison
                primary={prediction.primary?.llm_provider ?? ""}
                models={prediction.models}
              />
            )}

            {/* 比赛元信息 */}
            <div className="glass rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4 text-white">
                <span className="text-cyan-300">
                  <MapPin className="w-4 h-4" />
                </span>
                <h3 className="text-base sm:text-lg font-semibold tracking-tight">
                  比赛信息
                </h3>
              </div>
              <dl className="space-y-3 text-sm">
                <Row k="开赛时间" v={new Date(m.utc_date).toLocaleString("zh-CN")} />
                <Row k="场地" v={m.venue ?? "待定"} />
                <Row k="阶段" v={m.stage ?? "-"} />
                <Row k="分组" v={m.group ?? "—"} />
                <Row
                  k="模型状态"
                  v={
                    <span className="font-mono">
                      <span className="text-emerald-300">{m.prediction_models_ok}</span>
                      <span className="text-white/40"> / </span>
                      <span className="text-white">{m.prediction_models_total}</span>
                    </span>
                  }
                />
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] font-mono tracking-widest text-white/45 uppercase">
        {k}
      </dt>
      <dd className="text-white/85 text-right">{v}</dd>
    </div>
  );
}
