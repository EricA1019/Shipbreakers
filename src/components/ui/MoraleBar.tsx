/**
 * MoraleBar - Phase 14
 * Displays crew morale status
 */

import { getMoraleLevel, getMoraleColor } from "../../services/injuryService";
import { BASE_MORALE } from "../../game/constants";

interface MoraleBarProps {
  morale?: number;
  compact?: boolean;
}

export default function MoraleBar({ morale, compact = false }: MoraleBarProps) {
  const currentMorale = morale ?? BASE_MORALE;
  const level = getMoraleLevel(currentMorale);
  const color = getMoraleColor(currentMorale);
  const percent = currentMorale;

  const barColor = 
    currentMorale >= 80 ? "bg-green-500" :
    currentMorale >= 60 ? "bg-blue-500" :
    currentMorale >= 40 ? "bg-yellow-500" :
    currentMorale >= 20 ? "bg-orange-500" :
    "bg-red-500";

  if (compact) {
    return (
      <div className="flex items-center gap-1" title={`Morale: ${currentMorale}% (${level})`}>
        <span className="text-[9px] text-zinc-400">MORALE</span>
        <div className="w-10 bg-black/40 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-[10px] ${color}`}>{currentMorale}%</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="text-[9px] text-zinc-400 uppercase tracking-wide">😊 MORALE</div>
        <div className={`text-xs font-['Orbitron'] font-bold ${color}`}>
          {currentMorale}% • {level}
        </div>
      </div>
      <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/6">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {currentMorale < 30 && (
        <div className="mt-1 text-[9px] text-orange-400">
          ⚠️ Low morale affecting work efficiency
        </div>
      )}
    </div>
  );
}
