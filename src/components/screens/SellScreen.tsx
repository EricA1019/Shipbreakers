import { useGameStore } from "../../stores/gameStore";

import type { ScreenProps } from "../../types";

export default function SellScreen({ onNavigate }: ScreenProps) {
  const { currentRun, credits, sellAllLoot } = useGameStore((s) => ({
    currentRun: s.currentRun,
    credits: s.credits,
    sellAllLoot: s.sellAllLoot,
  }));
  const total = currentRun
    ? currentRun.collectedLoot.reduce((s, l) => s + l.value, 0)
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4 flex justify-between items-center">
        <div className="text-amber-500 font-bold">SELL LOOT</div>
        <div className="text-zinc-400 text-xs">Credits: {credits} CR</div>
      </div>

      <div className="bg-zinc-800 border border-amber-600/20 p-6">
        <div className="text-amber-100 font-bold mb-2">
          Total on hand: {total} CR
        </div>
        <div className="mb-4">
          {currentRun && currentRun.collectedLoot.length > 0 ? (
            <div className="space-y-2">
              {currentRun.collectedLoot.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between bg-zinc-900 p-2 rounded"
                >
                  <div>
                    <div className="text-amber-100 text-sm">{it.name}</div>
                    <div className="text-amber-400 text-xs">
                      Value: {it.value} CR
                    </div>
                  </div>
                  <div>
                    <button
                      className="bg-red-600 text-white px-2 py-1 text-xs rounded"
                      onClick={() => {
                        // sell single collected item
                        useGameStore.setState((state) => {
                          const run = state.currentRun;
                          if (!run) return state;
                          const remaining = run.collectedLoot.filter(
                            (l) => l.id !== it.id,
                          );
                          const newCredits = state.credits + it.value;
                          return {
                            credits: newCredits,
                            currentRun: { ...run, collectedLoot: remaining },
                          } as any;
                        });
                      }}
                    >
                      Sell
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-amber-400 text-sm">No items to sell.</div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="bg-amber-500 text-zinc-900 px-3 py-1"
            onClick={() => {
              if (total > 0) {
                sellAllLoot();
                onNavigate("hub");
              }
            }}
          >
            💰 Sell All
          </button>
          <button
            className="bg-zinc-700 text-xs px-3 py-1"
            onClick={() => onNavigate("hub")}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
