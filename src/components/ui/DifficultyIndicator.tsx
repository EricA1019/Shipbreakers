import type { Wreck } from '../../types';
import { useGameStore } from '../../stores/gameStore';

interface DifficultyIndicatorProps {
  wreck: Wreck;
}

export default function DifficultyIndicator({ wreck }: DifficultyIndicatorProps) {
  const { crew } = useGameStore((s) => ({ crew: s.crew }));

  // Calculate crew's average skill level
  const avgCrewSkill = (crew.skills.technical + crew.skills.combat + crew.skills.salvage + crew.skills.piloting) / 4;

  // Calculate difficulty delta
  const difficultyDelta = wreck.tier - avgCrewSkill;

  const getDifficultyRating = (delta: number): { label: string; icon: string; color: string; message: string } => {
    if (delta <= -2) return { label: 'Too Easy', icon: '😴', color: 'text-cyan-400', message: 'Minimal challenge. Great for farming credits.' };
    if (delta <= -1) return { label: 'Easy', icon: '✓', color: 'text-green-400', message: 'Well-matched. Good income with low risk.' };
    if (delta <= 0.5) return { label: 'Balanced', icon: '⚖️', color: 'text-amber-400', message: 'Good difficulty. Meaningful rewards and risk.' };
    if (delta <= 1.5) return { label: 'Challenging', icon: '⚡', color: 'text-yellow-400', message: 'Difficult but manageable. Higher rewards.' };
    return { label: 'Overwhelming', icon: '🔴', color: 'text-red-500', message: 'Very difficult. Risk of crew injury or death.' };
  };

  const rating = getDifficultyRating(difficultyDelta);

  return (
    <div className="bg-zinc-800 border border-amber-600/20 p-3 text-xs">
      <div className="flex justify-between items-center mb-2">
        <div className="text-zinc-400">Crew vs Wreck Difficulty</div>
        <div className={`font-bold ${rating.color}`}>
          {rating.icon} {rating.label}
        </div>
      </div>

      <div className="relative w-full bg-black h-4 rounded border border-amber-600/30 overflow-hidden mb-2">
        {/* Crew skill position */}
        <div
          className="absolute top-0 h-full w-0.5 bg-green-400/70"
          style={{ left: `${((avgCrewSkill / 5) * 100).toFixed(0)}%` }}
          title={`Crew Avg: ${avgCrewSkill.toFixed(1)}`}
        />
        {/* Wreck tier position */}
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500/70"
          style={{ left: `${((wreck.tier / 5) * 100).toFixed(0)}%` }}
          title={`Wreck Tier: ${wreck.tier}`}
        />
      </div>

      <div className="text-zinc-400 text-[10px] mb-2">
        <span className="text-green-400">● Crew {avgCrewSkill.toFixed(1)}</span> vs{' '}
        <span className="text-red-500">● Wreck {wreck.tier}</span>
      </div>

      <div className={`text-[10px] ${rating.color}`}>{rating.message}</div>
    </div>
  );
}
