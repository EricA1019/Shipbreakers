import type { Wreck } from '../../types';

interface DangerRatingProps {
  wreck: Wreck;
  compact?: boolean;
}

export default function DangerRatingComponent({ wreck, compact = false }: DangerRatingProps) {
  const calculateRiskScore = (wreck: Wreck): number => {
    const avgHazardLevel = wreck.rooms.reduce((sum, room) => sum + room.hazardLevel, 0) / wreck.rooms.length;
    return Math.round((wreck.tier * 20 + avgHazardLevel * 15) / 10);
  };

  const riskScore = calculateRiskScore(wreck);
  const maxRooms = wreck.rooms.length;
  const avgHazard = Math.round(wreck.rooms.reduce((sum, room) => sum + room.hazardLevel, 0) / maxRooms);

  const getRiskLevel = (score: number): { label: string; color: string; bgColor: string; icon: string } => {
    if (score <= 30) return { label: 'MINIMAL', color: 'text-green-400', bgColor: 'bg-green-900/20', icon: '✓' };
    if (score <= 50) return { label: 'LOW', color: 'text-green-300', bgColor: 'bg-green-900/20', icon: '✓' };
    if (score <= 70) return { label: 'MODERATE', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', icon: '⚠' };
    if (score <= 85) return { label: 'HIGH', color: 'text-orange-400', bgColor: 'bg-orange-900/20', icon: '⚡' };
    return { label: 'CRITICAL', color: 'text-red-500', bgColor: 'bg-red-900/20', icon: '🔴' };
  };

  const risk = getRiskLevel(riskScore);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-bold ${risk.color}`}>
        <span>{risk.icon}</span>
        <span>{risk.label}</span>
        <span className="text-zinc-400">({riskScore})</span>
      </div>
    );
  }

  return (
    <div className={`border ${risk.bgColor} p-3 rounded text-xs`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`font-bold ${risk.color}`}>
          {risk.icon} DANGER RATING: {risk.label}
        </div>
        <div className="text-zinc-400 font-mono">{riskScore}/100</div>
      </div>

      {/* Risk Bar */}
      <div className="relative w-full bg-black h-3 rounded border border-amber-600/30 overflow-hidden mb-3">
        <div
          className={`h-full transition-all ${
            riskScore <= 30
              ? 'bg-green-500'
              : riskScore <= 50
                ? 'bg-lime-500'
                : riskScore <= 70
                  ? 'bg-yellow-500'
                  : riskScore <= 85
                    ? 'bg-orange-500'
                    : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(100, riskScore)}%` }}
        />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-400">
        <div>Tier: <span className="text-amber-100 font-bold">{wreck.tier}/5</span></div>
        <div>Avg Hazard: <span className="text-amber-100 font-bold">{avgHazard}/5</span></div>
        <div>Rooms: <span className="text-amber-100 font-bold">{maxRooms}</span></div>
      </div>
    </div>
  );
}
