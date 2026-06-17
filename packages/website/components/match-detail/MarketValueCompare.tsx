"use client";

import { useState } from "react";
import { TrendingUp, X, User } from "lucide-react";
import type { Player } from "@/lib/types";

interface MarketValueCompareProps {
  homeName: string;
  awayName: string;
  homeSquad: Player[];
  awaySquad: Player[];
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
  const [showModal, setShowModal] = useState(false);

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
    <>
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white">
            <span className="text-cyan-300">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">
              阵容身价对比
            </h3>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-mono text-white/50 hover:text-white transition-colors px-3 py-1 rounded-full border border-white/10 hover:border-white/30"
          >
            详情
          </button>
        </div>

        <div className="space-y-4">
          {/* 主队 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">{homeName}</span>
            <span className="text-sm font-mono text-cyan-400">
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

      {/* 阵容详情弹窗 */}
      {showModal && (
        <SquadModal
          homeName={homeName}
          awayName={awayName}
          homeSquad={homeSquad}
          awaySquad={awaySquad}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function SquadModal({
  homeName,
  awayName,
  homeSquad,
  awaySquad,
  onClose,
}: {
  homeName: string;
  awayName: string;
  homeSquad: Player[];
  awaySquad: Player[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-4xl max-h-[80vh] glass rounded-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">阵容详情</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 主队 */}
            <SquadList
              name={homeName}
              players={homeSquad}
              color="cyan"
              totalValue={homeSquad.reduce(
                (sum, p) => sum + (p.marketValue?.valueM ?? 0),
                0
              )}
            />

            {/* 客队 */}
            <SquadList
              name={awayName}
              players={awaySquad}
              color="violet"
              totalValue={awaySquad.reduce(
                (sum, p) => sum + (p.marketValue?.valueM ?? 0),
                0
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SquadList({
  name,
  players,
  color,
  totalValue,
}: {
  name: string;
  players: Player[];
  color: "cyan" | "violet";
  totalValue: number;
}) {
  // 按位置分组
  const goalkeepers = players.filter((p) => p.position === "Goalkeeper");
  const defenders = players.filter((p) => p.position === "Defender");
  const midfielders = players.filter((p) => p.position === "Midfielder");
  const forwards = players.filter((p) => p.position === "Forward");

  const bgColor = color === "cyan" ? "bg-cyan-500/20" : "bg-violet-500/20";
  const textColor = color === "cyan" ? "text-cyan-400" : "text-violet-400";
  const borderColor = color === "cyan" ? "border-cyan-500/30" : "border-violet-500/30";

  return (
    <div>
      <div className={`flex items-center justify-between mb-4 p-3 rounded-lg ${bgColor} border ${borderColor}`}>
        <h4 className={`font-semibold ${textColor}`}>{name}</h4>
        <span className={`text-sm font-mono ${textColor}`}>
          {formatValue(totalValue)}
        </span>
      </div>

      <div className="space-y-4">
        {goalkeepers.length > 0 && (
          <PlayerGroup title="门将" players={goalkeepers} />
        )}
        {defenders.length > 0 && (
          <PlayerGroup title="后卫" players={defenders} />
        )}
        {midfielders.length > 0 && (
          <PlayerGroup title="中场" players={midfielders} />
        )}
        {forwards.length > 0 && (
          <PlayerGroup title="前锋" players={forwards} />
        )}
      </div>
    </div>
  );
}

function PlayerGroup({
  title,
  players,
}: {
  title: string;
  players: Player[];
}) {
  return (
    <div>
      <h5 className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-2">
        {title}
        <span className="ml-2 text-white/30">({players.length})</span>
      </h5>
      <div className="space-y-1">
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
      {player.image ? (
        <img
          src={player.image}
          alt={player.fullName}
          className="w-8 h-8 rounded-full object-cover border border-white/10"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <User className="w-4 h-4 text-white/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {player.fullName}
        </p>
        <p className="text-xs text-white/40">{player.age}岁</p>
      </div>
      {player.marketValue && (
        <span className="text-xs font-mono text-emerald-400/80">
          {player.marketValue.display}
        </span>
      )}
    </div>
  );
}
