import { User } from "lucide-react";

interface PlayerCardProps {
  player: {
    id: string;
    fullName: string;
    position: string;
    image: string | null;
    age: number;
    citizenship: string;
    marketValue: { valueM: number; display: string } | null;
  };
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <div className="glass rounded-xl p-4 hover:bg-white/5 transition-all">
      <div className="flex items-start gap-4">
        {/* 球员头像 */}
        <div className="relative flex-shrink-0">
          {player.image ? (
            <img
              src={player.image}
              alt={player.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-8 h-8 text-white/40" />
            </div>
          )}
        </div>

        {/* 球员信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">
            {player.fullName}
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            {player.position}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
            <span>{player.age} 岁</span>
            <span>{player.citizenship}</span>
          </div>
          {player.marketValue && (
            <div className="mt-2 text-xs font-mono text-emerald-400">
              {player.marketValue.display}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
