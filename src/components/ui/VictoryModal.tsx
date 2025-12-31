import type { GameState } from '../../types';

interface VictoryModalProps {
  stats: GameState['stats'];
  onNewGame: () => void;
  onContinue?: () => void;
}

export default function VictoryModal({ stats, onNewGame, onContinue }: VictoryModalProps) {
  const formatNumber = (n: number) => n.toLocaleString();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-yellow-500 p-8 max-w-md rounded">
        {/* Victory header */}
        <div className="text-center mb-6 border-b border-yellow-600/30 pb-4">
          <div className="text-yellow-500 font-bold text-3xl animate-pulse">🎯 ESCAPED!</div>
          <div className="text-yellow-400 text-sm mt-2 font-mono">
            You've collected enough credits to escape Cinder Station
          </div>
        </div>

        {/* Lifetime stats */}
        <div className="space-y-3 mb-6">
          <div className="bg-zinc-800 p-3 rounded border border-yellow-600/20">
            <div className="text-yellow-400 font-bold text-lg">
              💰 {formatNumber(stats.totalCreditsEarned)} CR
            </div>
            <div className="text-zinc-400 text-xs">Total Credits Earned</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-zinc-800 p-2 rounded border border-yellow-600/10">
              <div className="text-yellow-300 font-bold">{stats.totalWrecksCleared}</div>
              <div className="text-zinc-400">Wrecks Cleared</div>
            </div>
            <div className="bg-zinc-800 p-2 rounded border border-yellow-600/10">
              <div className="text-yellow-300 font-bold">{stats.totalRoomsSalvaged}</div>
              <div className="text-zinc-400">Rooms Salvaged</div>
            </div>
            <div className="bg-zinc-800 p-2 rounded border border-yellow-600/10">
              <div className="text-yellow-300 font-bold">{stats.totalItemsCollected}</div>
              <div className="text-zinc-400">Items Collected</div>
            </div>
            <div className="bg-zinc-800 p-2 rounded border border-yellow-600/10">
              <div className="text-yellow-300 font-bold">{stats.daysPlayed}</div>
              <div className="text-zinc-400">Days Survived</div>
            </div>
          </div>

          <div className="bg-zinc-800 p-2 rounded border border-yellow-600/10 text-xs">
            <div className="text-yellow-300 font-bold">{formatNumber(stats.highestSingleProfit)} CR</div>
            <div className="text-zinc-400">Highest Single Haul</div>
          </div>

          {stats.longestWinStreak > 0 && (
            <div className="bg-emerald-900/30 p-2 rounded border border-emerald-600/20 text-xs">
              <div className="text-emerald-400 font-bold">🔥 {stats.longestWinStreak}</div>
              <div className="text-zinc-400">Longest Win Streak</div>
            </div>
          )}

          {stats.deathsAvoided > 0 && (
            <div className="bg-cyan-900/30 p-2 rounded border border-cyan-600/20 text-xs">
              <div className="text-cyan-400 font-bold">💪 {stats.deathsAvoided}</div>
              <div className="text-zinc-400">Deaths Avoided</div>
            </div>
          )}

          <div className="bg-zinc-800 p-2 rounded border border-yellow-600/10 text-xs">
            <div className="text-yellow-300 font-bold">{stats.licensesRenewed}</div>
            <div className="text-zinc-400">Licenses Renewed</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={onNewGame}
            className="w-full bg-amber-600 text-zinc-900 font-bold py-2 rounded hover:bg-amber-500 transition"
          >
            START NEW GAME
          </button>
          {onContinue && (
            <button
              onClick={onContinue}
              className="w-full bg-zinc-800 text-amber-400 font-bold py-2 rounded hover:bg-zinc-700 transition border border-amber-600/30"
            >
              CONTINUE PLAYING
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-zinc-500 text-xs text-center mt-4">
          Thanks for playing Ship Breakers v0.0.1
        </div>
      </div>
    </div>
  );
}
