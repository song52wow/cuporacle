import Link from "next/link";
import { getTeams } from "@/lib/api";
import { Users } from "lucide-react";

// Cloudflare Pages / Workers 要求显式声明 Edge Runtime
export const runtime = "edge";

export async function generateMetadata() {
  return {
    title: "参赛队伍 · CupOracle",
    description: "2026 世界杯 48 支参赛队伍及球员名单",
  };
}

export default async function TeamsPage() {
  const { teams } = await getTeams();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[420px] rounded-full bg-cyan-violet opacity-20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-cyan-300">
              <Users className="w-6 h-6" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              参赛队伍
            </h1>
          </div>
          <p className="text-white/60 text-lg">
            2026 世界杯 48 支参赛队伍
          </p>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-white/60">暂无队伍数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className="glass rounded-xl p-4 hover:bg-white/5 transition-all group"
              >
                <div className="flex flex-col items-center text-center">
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-16 h-16 object-contain mb-3 group-hover:scale-110 transition-transform"
                  />
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {team.name}
                  </h3>
                  <span className="text-xs text-white/50 font-mono">
                    {team.abbreviation}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
