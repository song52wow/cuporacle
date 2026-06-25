"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("matchDetail");
  const [showModal, setShowModal] = useState(false);

  const homeTotal = homeSquad.reduce((sum, p) => sum + (p.marketValue?.valueM ?? 0), 0);
  const awayTotal = awaySquad.reduce((sum, p) => sum + (p.marketValue?.valueM ?? 0), 0);
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
              {t("squadValue")}
            </h3>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-mono text-white/50 hover:text-white transition-colors px-3 py-1 rounded-full border border-white/10 hover:border-white/30"
          >
            {t("details")}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">{homeName}</span>
            <span className="text-sm font-mono text-cyan-400">{formatValue(homeTotal)}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden flex">
            <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${homePercent}%` }} />
            <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${awayPercent}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">{awayName}</span>
            <span className="text-sm font-mono text-violet-400">{formatValue(awayTotal)}</span>
          </div>
        </div>
      </div>

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
  const t = useTranslations("matchDetail");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[80vh] glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{t("squadDetails")}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors" aria-label={t("close")}>
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SquadList
              name={homeName}
              players={homeSquad}
              color="cyan"
              totalValue={homeSquad.reduce((sum, p) => sum + (p.marketValue?.valueM ?? 0), 0)}
              t={t}
            />
            <SquadList
              name={awayName}
              players={awaySquad}
              color="violet"
              totalValue={awaySquad.reduce((sum, p) => sum + (p.marketValue?.valueM ?? 0), 0)}
              t={t}
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
  t,
}: {
  name: string;
  players: Player[];
  color: "cyan" | "violet";
  totalValue: number;
  t: ReturnType<typeof useTranslations<"matchDetail">>;
}) {
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
        <span className={`text-sm font-mono ${textColor}`}>{formatValue(totalValue)}</span>
      </div>
      <div className="space-y-4">
        {goalkeepers.length > 0 && <PlayerGroup title={t("goalkeepers")} players={goalkeepers} t={t} />}
        {defenders.length > 0 && <PlayerGroup title={t("defenders")} players={defenders} t={t} />}
        {midfielders.length > 0 && <PlayerGroup title={t("midfielders")} players={midfielders} t={t} />}
        {forwards.length > 0 && <PlayerGroup title={t("forwards")} players={forwards} t={t} />}
      </div>
    </div>
  );
}

function PlayerGroup({
  title,
  players,
  t,
}: {
  title: string;
  players: Player[];
  t: ReturnType<typeof useTranslations<"matchDetail">>;
}) {
  return (
    <div>
      <h5 className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-2">
        {title}
        <span className="ml-2 text-white/30">({players.length})</span>
      </h5>
      <div className="space-y-1">
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} t={t} />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  t,
}: {
  player: Player;
  t: ReturnType<typeof useTranslations<"matchDetail">>;
}) {
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
        <p className="text-sm font-medium text-white truncate">{player.fullName}</p>
        <p className="text-xs text-white/40">{t("yearsOld", { age: player.age })}</p>
      </div>
      {player.marketValue && (
        <span className="text-xs font-mono text-emerald-400/80">{player.marketValue.display}</span>
      )}
    </div>
  );
}
