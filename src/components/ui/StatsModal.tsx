import { useGameStore } from "../../stores/gameStore";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({ isOpen, onClose }: StatsModalProps) {
  const { stats } = useGameStore((s) => ({ stats: s.stats }));

  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-amber-600/50 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-4">
          LIFETIME STATISTICS
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Primary Stats */}
          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="text-amber-500 text-[10px] font-bold tracking-wider mb-2">
              CREDITS
            </div>
            <div className="text-2xl font-bold text-green-400">
              {stats.totalCreditsEarned}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Total Earned</div>
          </div>

          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="text-amber-500 text-[10px] font-bold tracking-wider mb-2">
              WRECKS CLEARED
            </div>
            <div className="text-2xl font-bold text-amber-100">
              {stats.totalWrecksCleared}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              Salvage Missions
            </div>
          </div>

          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="text-amber-500 text-[10px] font-bold tracking-wider mb-2">
              ITEMS COLLECTED
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {stats.totalItemsCollected}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">All Time</div>
          </div>

          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="text-amber-500 text-[10px] font-bold tracking-wider mb-2">
              DAYS PLAYED
            </div>
            <div className="text-2xl font-bold text-cyan-400">
              {stats.daysPlayed}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Game Days</div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="space-y-2 mb-6">
          <div className="text-amber-500 text-[10px] font-bold tracking-wider">
            ACHIEVEMENTS
          </div>

          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="text-amber-100 font-bold">
                Highest Single Profit
              </div>
              <div className="text-green-400 font-bold">
                {stats.highestSingleProfit} CR
              </div>
            </div>
            <div className="text-[10px] text-zinc-400">
              Most valuable single run
            </div>
          </div>

          {stats.mostValuableItem && (
            <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="text-amber-100 font-bold">
                  Most Valuable Item
                </div>
                <div className="text-yellow-400 font-bold">
                  {stats.mostValuableItem.value} CR
                </div>
              </div>
              <div className="text-[10px] text-zinc-400">
                {stats.mostValuableItem.name}
              </div>
            </div>
          )}

          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="text-amber-100 font-bold">Win Streak</div>
              <div className="text-green-400 font-bold">
                {stats.longestWinStreak}
              </div>
            </div>
            <div className="text-[10px] text-zinc-400">
              Consecutive successful missions
            </div>
          </div>

          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="text-amber-100 font-bold">Licenses Renewed</div>
              <div className="text-cyan-400 font-bold">
                {stats.licensesRenewed}
              </div>
            </div>
            <div className="text-[10px] text-zinc-400">
              Station license renewals
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-600/30 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <div className="text-green-100 font-bold">
                Catastrophes Avoided
              </div>
              <div className="text-green-400 font-bold">
                {stats.deathsAvoided}
              </div>
            </div>
            <div className="text-[10px] text-green-400">Crew members saved</div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-amber-900/20 border border-amber-600/30 p-3 rounded mb-6 text-xs text-amber-100">
          <div className="font-bold mb-1">STATUS REPORT:</div>
          {stats.totalWrecksCleared === 0 ? (
            <div className="text-zinc-400">
              No missions completed yet. Start your first salvage run!
            </div>
          ) : (
            <div className="text-zinc-400">
              Average profit:{" "}
              {Math.round(stats.totalCreditsEarned / stats.totalWrecksCleared)}{" "}
              CR per mission
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-amber-500 text-zinc-900 px-4 py-2 font-bold hover:bg-amber-400"
        >
          Close
        </button>
      </div>
    </div>
  );
}
