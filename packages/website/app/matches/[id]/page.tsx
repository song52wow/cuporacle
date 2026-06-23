import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { getMatchDetail, getPrediction } from "@/lib/api";
import { MatchDetailProvider, HeroFromContext, SidebarModelComparison } from "@/components/match-detail/MatchDetailClient";
import { MatchLeftContent } from "@/components/match-detail/MatchLeftContent";
import { MarketValueCompare } from "@/components/match-detail/MarketValueCompare";

// Cloudflare Pages / Workers 要求显式声明 Edge Runtime
export const runtime = "edge";
import { RatingsTable } from "@/components/match-detail/RatingsTable";

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

        {/* Hero 预测 + 多模型对比（客户端交互，共享选中状态） */}
        <MatchDetailProvider match={m} prediction={prediction}>
          <div className="mt-6">
            <HeroFromContext />
          </div>

          {/* 阵容身价对比 - 第二模块，占满宽度 */}
          {(detail.home_squad.length > 0 || detail.away_squad.length > 0) && (
            <div className="mt-6">
              <MarketValueCompare
                homeName={m.home_team_name}
                awayName={m.away_team_name}
                homeSquad={detail.home_squad}
                awaySquad={detail.away_squad}
              />
            </div>
          )}

          {/* 主体网格：移动端侧边栏置顶（比赛信息、多模型对比在最可能比分上方），桌面端仍在右侧 */}
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {/* 比赛信息 + 模型对比（DOM 靠前 → 移动端优先展示） */}
            <div className="space-y-5 lg:col-start-3 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
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

              <SidebarModelComparison />
            </div>

            {/* 左：核心 2 列（跟随模型切换更新） */}
            <div className="space-y-5 min-w-0 lg:col-span-2 lg:col-start-1 lg:row-start-1">
              <MatchLeftContent
                homeName={m.home_team_name}
                awayName={m.away_team_name}
              />

              <RatingsTable
                home={detail.home_ratings}
                away={detail.away_ratings}
                homeName={m.home_team_name}
                awayName={m.away_team_name}
              />
            </div>
          </div>
        </MatchDetailProvider>
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
