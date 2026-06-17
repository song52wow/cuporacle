import { TrendingUp } from "lucide-react";

interface MarketValueCompareProps {
  homeName: string;
  awayName: string;
  homeSquad: Array<{ marketValue: { valueM: number } | null }>;
  awaySquad: Array<{ marketValue: { valueM: number } | null }>;
}

function formatValue(value: number): string {
  return `€${value.toFixed(1)}m`;
}

export function MarketValueCompare({
  homeName,
  awayName,
  homeSquad,
  awaySquad,
}: MarketValueCompareProps) {
  const homeTotal = homeSquad.reduce(
    (sum, p) => sum + (p.marketValue?.valueM ?? 0),
    0
  );
  const awayTotal = awaySquad.reduce(
    (sum, p) => sum + (p.marketValue?.valueM ?? 0),
    0
  );
  const total = homeTotal + awayTotal;

  const homePercent = total > 0 ? (homeTotal / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayTotal / total) * 100 : 50;

  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4 text-white">
        <span className="text-cyan-300">
          <TrendingUp className="w-4 h-4" />
        </span>
        <h3 className="text-base sm:text-lg font-semibold tracking-tight">
          阵容身价对比
        </h3>
      </div>

      <div className="space-y-4">
        {/* 主队 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">{homeName}</span>
          <span className="text-sm font-mono text-emerald-400">
            {formatValue(homeTotal)}
          </span>
        </div>

        {/* 进度条 */}
        <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
          <div
            className="h-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${homePercent}%` }}
          />
          <div
            className="h-full bg-violet-500 transition-all duration-500"
            style={{ width: `${awayPercent}%` }}
          />
        </div>

        {/* 客队 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">{awayName}</span>
          <span className="text-sm font-mono text-violet-400">
            {formatValue(awayTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
