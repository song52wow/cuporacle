import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { getTeamDetail } from "@/lib/api";
import { PlayerCard } from "@/components/PlayerCard";

// Cloudflare Pages / Workers 要求显式声明 Edge Runtime
export const runtime = "edge";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const detail = await getTeamDetail(params.slug);
  if (!detail) return { title: "未找到队伍 · CupOracle" };
  return {
    title: `${detail.team.name} · CupOracle`,
    description: `${detail.team.name} 2026 世界杯球员名单`,
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const detail = await getTeamDetail(params.slug);
  if (!detail) return notFound();

  const { team, players } = detail;

  // 按位置分组
  const goalkeepers = players.filter((p) => p.position === "Goalkeeper");
  const defenders = players.filter((p) => p.position === "Defender");
  const midfielders = players.filter((p) => p.position === "Midfielder");
  const forwards = players.filter((p) => p.position === "Forward");

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[420px] rounded-full bg-cyan-violet opacity-20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-20">
        {/* 返回 */}
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-white/55 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回队伍列表
        </Link>

        {/* 队伍信息 */}
        <div className="mt-6 flex items-center gap-6">
          <img
            src={team.logo}
            alt={team.name}
            className="w-24 h-24 object-contain"
          />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {team.name}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-white/60 text-lg">
                {players.length} 名球员
              </p>
              <p className="text-emerald-400 text-lg font-mono">
                总身价: {team.totalMarketValueDisplay}
              </p>
            </div>
          </div>
        </div>

        {/* 球员列表 */}
        <div className="mt-8 space-y-8">
          {/* 门将 */}
          {goalkeepers.length > 0 && (
            <PlayerSection title="门将" players={goalkeepers} />
          )}

          {/* 后卫 */}
          {defenders.length > 0 && (
            <PlayerSection title="后卫" players={defenders} />
          )}

          {/* 中场 */}
          {midfielders.length > 0 && (
            <PlayerSection title="中场" players={midfielders} />
          )}

          {/* 前锋 */}
          {forwards.length > 0 && (
            <PlayerSection title="前锋" players={forwards} />
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerSection({
  title,
  players,
}: {
  title: string;
  players: Array<{
    id: string;
    fullName: string;
    position: string;
    image: string | null;
    age: number;
    citizenship: string;
    marketValue: { valueM: number; display: string } | null;
  }>;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-cyan-300" />
        {title}
        <span className="text-sm text-white/40 font-mono">({players.length})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
