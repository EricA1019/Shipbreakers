import { useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import { useAudio } from "../../hooks/useAudio";

import type { ScreenProps } from "../../types";

export default function SellScreen({ onNavigate }: ScreenProps) {
  const { currentRun, credits, sellAllLoot, sellRunLootItem, sellItem, inventory } = useGameStore((s) => ({
    currentRun: s.currentRun,
    credits: s.credits,
    sellAllLoot: s.sellAllLoot,
    sellRunLootItem: s.sellRunLootItem,
    sellItem: s.sellItem,
    inventory: s.inventory || [],
  }));

  const audio = useAudio();

  useEffect(() => {
    audio.playTransition();
  }, []);

  const runLoot = currentRun?.collectedLoot || [];
  const runTotal = runLoot.reduce((s, l) => s + l.value, 0);
  
  const inventoryTotal = inventory.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <div className="max-w-[1000px] mx-auto space-y-4">
      {/* Header */}
      <IndustrialPanel
        title="LOOT EXCHANGE"
        subtitle="CARGO ASSESSMENT TERMINAL · CINDER STATION"
      >
        <div className="flex items-center gap-2">
          <StatChip label="ACCOUNT BALANCE" value={`${(credits / 1000).toFixed(1)}K`} variant="amber" />
          <StatChip label="PENDING HAUL" value={`${(runTotal / 1000).toFixed(1)}K`} variant="cyan" />
          <StatChip label="STORAGE VALUE" value={`${(inventoryTotal / 1000).toFixed(1)}K`} variant="cyan" />
        </div>
      </IndustrialPanel>

      {/* Run Loot */}
      {runLoot.length > 0 && (
        <IndustrialPanel title={`${runLoot.length} ITEMS IN HAUL`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {runLoot.map((it) => (
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
                  onClick={() => {
                    audio.playSuccess();
                    sellRunLootItem(it.id);
                  }}
                  className="bg-amber-500/15 border border-amber-500 text-amber-400 px-3 py-1.5 text-xs uppercase tracking-wide rounded-md hover:bg-amber-500/25 transition font-['Orbitron'] font-bold"
                >
                  Sell
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">
             <IndustrialButton
                variant="primary"
                title="Sell All Haul"
                description={`Value: ${runTotal} CR`}
                onClick={() => {
                  audio.playSuccess();
                  sellAllLoot();
                }}
              />
          </div>
        </IndustrialPanel>
      )}

      {/* Inventory */}
      <IndustrialPanel title={inventory.length > 0 ? `${inventory.length} ITEMS IN STORAGE` : "STORAGE EMPTY"}>
        {inventory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inventory.map((it) => (
              <div
                key={it.id}
                className="bg-black/26 border border-white/8 rounded-md p-3 flex items-center justify-between hover:border-zinc-400 hover:bg-white/5 transition"
              >
                <div>
                  <div className="font-['Orbitron'] font-bold text-sm text-zinc-300">
                    {it.name}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    VALUE: <span className="text-zinc-300 font-['Orbitron'] font-bold">{(it.value / 1000).toFixed(1)}K CR</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    audio.playSuccess();
                    sellItem(it.id);
                  }}
                  className="bg-zinc-800 border border-zinc-600 text-zinc-300 px-3 py-1.5 text-xs uppercase tracking-wide rounded-md hover:bg-zinc-700 transition font-['Orbitron'] font-bold"
                >
                  Sell
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No items in storage
          </div>
        )}
      </IndustrialPanel>

      {/* Back */}
      <IndustrialPanel>
        <IndustrialButton
            variant="info"
            title="Back to Hub"
            description=""
            onClick={() => {
                audio.playTransition();
                onNavigate("hub");
            }}
        />
      </IndustrialPanel>
    </div>
  );
}
