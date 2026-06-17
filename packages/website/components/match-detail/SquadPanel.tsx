import { User } from "lucide-react";
import type { Player } from "@/lib/types";

interface SquadPanelProps {
  players: Player[];
  teamName: string;
}

export function SquadPanel({ players, teamName }: SquadPanelProps) {
  // 按位置分组
  const goalkeepers = players.filter((p) => p.position === "Goalkeeper");
  const defenders = players.filter((p) => p.position === "Defender");
  const midfielders = players.filter((p) => p.position === "Midfielder");
  const forwards = players.filter((p) => p.position === "Forward");

  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4 text-white">
        <span className="text-cyan-300">
          <User className="w-4 h-4" />
        </span>
        <h3 className="text-base sm:text-lg font-semibold tracking-tight">
          {teamName} 阵容
        </h3>
        <span className="text-xs text-white/40 font-mono">({players.length})</span>
      </div>

      <div className="space-y-4">
        {/* 门将 */}
        {goalkeepers.length > 0 && (
          <PlayerGroup title="门将" players={goalkeepers} />
        )}

        {/* 后卫 */}
        {defenders.length > 0 && (
          <PlayerGroup title="后卫" players={defenders} />
        )}

        {/* 中场 */}
        {midfielders.length > 0 && (
          <PlayerGroup title="中场" players={midfielders} />
        )}

        {/* 前锋 */}
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
      <h4 className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-2">
        {title}
        <span className="ml-2 text-white/30">({players.length})</span>
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {players.map((player) => (
          <PlayerItem key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

function PlayerItem({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
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
        <p className="text-xs font-medium text-white truncate">{player.fullName}</p>
        <p className="text-[10px] text-white/40">{player.age}岁</p>
      </div>
      {player.marketValue && (
        <span className="text-[10px] font-mono text-emerald-400/80">
          {player.marketValue.display}
        </span>
      )}
    </div>
  );
}
