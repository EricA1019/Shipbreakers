import { useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import { useAudio } from "../../hooks/useAudio";

import type { ScreenProps } from "../../types";

export default function SellScreen({ onNavigate }: ScreenProps) {
  const { currentRun, credits, sellAllLoot } = useGameStore((s) => ({
    currentRun: s.currentRun,
    credits: s.credits,
    sellAllLoot: s.sellAllLoot,
  }));

  const audio = useAudio();

  useEffect(() => {
    audio.playTransition();
  }, []);

  const total = currentRun
    ? currentRun.collectedLoot.reduce((s, l) => s + l.value, 0)
    : 0;

  const sellItem = (itemId: string, value: number) => {
    audio.playSuccess();
    useGameStore.setState((state) => {
      const run = state.currentRun;
      if (!run) return state;
      const remaining = run.collectedLoot.filter((l) => l.id !== itemId);
      const newCredits = state.credits + value;
      return {
        credits: newCredits,
        currentRun: { ...run, collectedLoot: remaining },
      } as any;
    });
  };

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Header */}
      <IndustrialPanel
        title="LOOT EXCHANGE"
        subtitle="CARGO ASSESSMENT TERMINAL · CINDER STATION"
      >
        <div className="flex items-center gap-2">
          <StatChip label="ACCOUNT BALANCE" value={`${(credits / 1000).toFixed(1)}K`} variant="amber" />
          <StatChip label="PENDING SALE" value={`${(total / 1000).toFixed(1)}K`} variant="cyan" />
        </div>
      </IndustrialPanel>

      {/* Items grid */}
      <IndustrialPanel title={currentRun && currentRun.collectedLoot.length > 0 ? `${currentRun.collectedLoot.length} ITEMS COLLECTED` : "NO ITEMS"}>
        {currentRun && currentRun.collectedLoot.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentRun.collectedLoot.map((it) => (
              <div
                key={it.id}
                className="bg-black/26 border border-white/8 rounded-md p-3 flex items-center justify-between hover:border-amber-400 hover:bg-amber-500/4 transition"
              >
                <div>
                  <div className="font-['Orbitron'] font-bold text-sm text-amber-400 glow-amber">
                    {it.name}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    VALUE: <span className="text-cyan-400 font-['Orbitron'] font-bold">{(it.value / 1000).toFixed(1)}K CR</span>
                  </div>
                </div>
                <button
                  onClick={() => sellItem(it.id, it.value)}
                  className="bg-amber-500/15 border border-amber-500 text-amber-400 px-3 py-1.5 text-xs uppercase tracking-wide rounded-md hover:bg-amber-500/25 transition font-['Orbitron'] font-bold"
                >
                  💰 Sell
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-zinc-500 text-sm">NO SALVAGE TO PROCESS</div>
            <div className="text-zinc-600 text-xs mt-2">Complete missions to collect loot</div>
          </div>
        )}
      </IndustrialPanel>

      {/* Actions */}
      <IndustrialPanel>
        <div className="grid grid-cols-2 gap-3">
          <IndustrialButton
            variant="primary"
            onClick={() => {
              if (total > 0) {
                audio.playSuccess();
                sellAllLoot();
                setTimeout(() => {
                  audio.playTransition();
                  onNavigate("hub");
                }, 400);
              }
            }}
            disabled={total === 0}
            title="💰 Sell All"
            description={`Process ${(total / 1000).toFixed(1)}K CR`}
          />
          <IndustrialButton
            onClick={() => {
              audio.playTransition();
              onNavigate("hub");
            }}
            title="← Back to Station"
            description="Return to hub"
          />
        </div>
      </IndustrialPanel>
    </div>
  );
}
