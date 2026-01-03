import { useGameStore } from "../../stores/gameStore";
import { showSuccessNotification } from "../../utils/notifications";
import { EFFICIENCY_THRESHOLDS } from "../../game/constants";

import type { ScreenProps } from "../../types";

export default function RunSummaryScreen({ onNavigate }: ScreenProps) {
  const { currentRun } = useGameStore((s) => ({ currentRun: s.currentRun }));
  if (!currentRun) {
    return (
      <div className="max-w-4xl mx-auto bg-zinc-800 border border-amber-600/20 p-6">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">
          ERROR
        </div>
        <div className="text-amber-100 mb-4">No run to summarize.</div>
        <button
          className="bg-amber-500 text-zinc-900 px-3 py-1"
          onClick={() => onNavigate("hub")}
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const total = currentRun.collectedLoot.reduce((s, l) => s + l.value, 0);
  const lootCount = currentRun.collectedLoot.length;

  // Calculate efficiency metrics
  const successRate = currentRun.stats?.roomsAttempted
    ? currentRun.stats.roomsSucceeded / currentRun.stats.roomsAttempted
    : 0;
  const efficiency = Math.round(successRate * 100);

  // Calculate efficiency rating
  let efficiencyRating = "poor";
  let ratingColor = "text-red-400";
  if (successRate >= EFFICIENCY_THRESHOLDS.perfect) {
    efficiencyRating = "perfect";
    ratingColor = "text-yellow-400";
  } else if (successRate >= EFFICIENCY_THRESHOLDS.excellent) {
    efficiencyRating = "excellent";
    ratingColor = "text-green-400";
  } else if (successRate >= EFFICIENCY_THRESHOLDS.good) {
    efficiencyRating = "good";
    ratingColor = "text-blue-400";
  } else if (successRate >= EFFICIENCY_THRESHOLDS.fair) {
    efficiencyRating = "fair";
    ratingColor = "text-orange-400";
  }

  const xpTotal = Object.values(currentRun.stats?.xpGained || {}).reduce(
    (sum, val) => sum + (typeof val === "number" ? val : 0),
    0,
  );

  const onReturn = () => {
    // Show completion summary
    showSuccessNotification(
      "Run Complete!",
      `Earned ${total} CR, ${xpTotal} XP`,
    );
    onNavigate("hub");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-3 gap-4">
        {/* Main Summary */}
        <div className="col-span-2 space-y-4">
          <div className="bg-zinc-800 border-2 border-amber-500 p-6">
            <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">
              MISSION COMPLETE
            </div>
            <div className="text-amber-100 font-bold text-2xl mb-2">
              Loot Value: {total} CR
            </div>
            <div className="text-zinc-400 text-sm mb-4">
              Items Collected: {lootCount}
            </div>

            {/* Loot List */}
            {lootCount > 0 && (
              <div className="bg-zinc-900 border border-zinc-700 p-4 mb-4 max-h-64 overflow-y-auto rounded">
                <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">
                  COLLECTED ITEMS
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {currentRun.collectedLoot.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-800 border border-zinc-600 p-2 rounded"
                    >
                      <div className="text-amber-100 text-sm font-semibold">
                        {item.name}
                      </div>
                      <div className="text-zinc-400 text-xs capitalize">
                        {item.rarity}
                      </div>
                      <div className="text-green-400 text-sm font-bold">
                        {item.value} CR
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="col-span-1 space-y-3">
          {/* Efficiency */}
          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">
              EFFICIENCY RATING
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${ratingColor} uppercase`}>
                {efficiencyRating}
              </div>
              <div className="text-amber-100 text-sm font-bold mt-1">
                {efficiency}% Success Rate
              </div>
            </div>
            <div className="mt-3 text-xs text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Rooms Cleared:</span>
                <span className="text-green-400 font-bold">
                  {currentRun.stats?.roomsSucceeded ?? 0}/
                  {currentRun.stats?.roomsAttempted ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Damage Taken:</span>
                <span
                  className={
                    (currentRun.stats?.damageTaken ?? 0 > 50)
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {currentRun.stats?.damageTaken ?? 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Experience Breakdown */}
          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">
              EXPERIENCE GAINED
            </div>
            <div className="space-y-1 text-xs">
              {Object.entries(currentRun.stats?.xpGained || {}).map(
                ([skill, xp]) => (
                  <div key={skill} className="flex justify-between">
                    <span className="text-zinc-400 capitalize">{skill}</span>
                    <span className="text-green-400 font-bold">+{xp}</span>
                  </div>
                ),
              )}
              <div className="border-t border-amber-600/20 pt-1 mt-1 flex justify-between font-bold">
                <span className="text-amber-100">Total</span>
                <span className="text-green-400">+{xpTotal}</span>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">
              RESOURCES USED
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Fuel</span>
                <span className="text-orange-400">
                  -{currentRun.stats?.fuelSpent ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          className="bg-amber-500 text-zinc-900 px-4 py-2 font-bold hover:bg-amber-400"
          onClick={onReturn}
        >
          🏠 Return to Hub
        </button>
        <button
          className="bg-zinc-700 border border-amber-600/30 text-amber-100 px-4 py-2 text-xs hover:border-amber-500"
          onClick={() => onNavigate("sell")}
        >
          💰 Sell Loot
        </button>
        <button
          className="bg-zinc-700 border border-amber-600/30 text-amber-100 px-4 py-2 text-xs hover:border-amber-500"
          onClick={() => onNavigate("salvage")}
        >
          ↩️ Back to Wreck
        </button>
      </div>
    </div>
  );
}
