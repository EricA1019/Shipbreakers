import React, { useEffect, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useUiStore } from "../../stores/uiStore";
import type { Item, ReactorModule } from "../../types";
import { wasmBridge } from "../../game/wasm/WasmBridge";
import { getAllEquipment } from "../../game/data/equipment";
import { REACTORS } from "../../game/data/reactors";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import { useAudio } from "../../hooks/useAudio";

import type { ScreenProps } from "../../types";

export const EquipmentShopScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const day = useGameStore((s) => s.day);
  const licenseTier = useGameStore((s) =>
    s.licenseTier === "basic" ? 1 : s.licenseTier === "standard" ? 2 : 3,
  );
  const credits = useGameStore((s) => s.credits);
  const audio = useAudio();

  useEffect(() => {
    audio.playTransition();
  }, []);

  const addToInventory = (item: Item | ReactorModule) => {
    useGameStore.setState((state) => ({
      inventory: (state.inventory || []).concat(item as any),
      credits: state.credits - (item.value ?? 0),
    }));
  };

  const [stock, setStock] = useState<Item[]>([]);
  const addToast = useUiStore((s) => s.addToast);
  const [category, setCategory] = useState<
    "reactors" | "tools" | "systems" | "expansions"
  >("tools");
  const [forceRefresh, setForceRefresh] = useState(0);

  const refreshStock = () => setForceRefresh((prev) => prev + 1);

  useEffect(() => {
    (async () => {
      try {
        const s = await wasmBridge.generateShopStock(day, licenseTier);
        const all = getAllEquipment();
        const mapped: Item[] = (Array.isArray(s) ? s : []).map((x: any, idx: number) => {
          const found = all.find((a) => a.tier === x?.tier) ?? (all.length ? all[Math.floor(Math.random() * all.length)] : undefined);

          // Spread `found` only if present to avoid runtime crash.
          const merged = {
            ...(found ?? {}),
            ...(x ?? {}),
            // Ensure we always have a stable React key.
            id: (x as any)?.id ?? (found as any)?.id ?? `shop-${day}-${licenseTier}-${idx}`,
          };

          return merged as Item;
        });
        setStock(mapped);
      } catch {
        setStock([]);
      }
    })();
  }, [day, licenseTier, forceRefresh]);

  const buy = (item: Item | ReactorModule) => {
    if (credits < (item.value ?? 0)) {
      audio.playError();
      return addToast({ message: "Insufficient credits", type: "warning" });
    }
    audio.playClick();
    addToInventory(item);
    addToast({ message: "Equipment purchased", type: "success" });
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <IndustrialPanel
        title="EQUIPMENT VENDOR"
        subtitle="SALVAGE & SHIP OUTFITTING · CINDER STATION"
      >
        <div className="flex items-center gap-2">
          <StatChip label="CREDITS" value={`${(credits / 1000).toFixed(1)}K`} variant="amber" />
          <StatChip label="LICENSE TIER" value={licenseTier} variant="cyan" />
          <StatChip label="DAY" value={day} variant="cyan" />
        </div>
      </IndustrialPanel>

      {/* Category tabs */}
      <IndustrialPanel>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "tools", label: "Tools" },
            { key: "systems", label: "Systems" },
            { key: "reactors", label: "Reactors" },
            { key: "expansions", label: "Expansions" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                audio.playClick();
                setCategory(key as any);
              }}
              className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-wide transition-all font-['Orbitron'] font-bold ${
                category === key
                  ? "bg-amber-500/15 border border-amber-500 text-amber-400"
                  : "bg-black/30 border border-white/8 text-zinc-400 hover:border-amber-400 hover:text-amber-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </IndustrialPanel>

      {/* Product Grid */}
      <IndustrialPanel>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {category === "reactors"
            ? Object.values(REACTORS).map((r) => (
                <div
                  key={r.id}
                  className="bg-black/26 border border-white/8 rounded-xl p-4 hover:border-amber-400 hover:bg-amber-500/4 transition"
                >
                  <div className="font-['Orbitron'] font-bold text-base text-amber-400 glow-amber mb-2">
                    {r.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider space-y-1 mb-3">
                    <div>POWER: <span className="text-cyan-400 font-bold">{r.powerOutput}</span></div>
                    <div>TIER: <span className="text-amber-400 font-bold">{r.tier}</span></div>
                  </div>
                  <div className="bg-black/40 border border-white/6 rounded-md p-2 mb-3 text-center">
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider mb-1">PRICE</div>
                    <div className="font-['Orbitron'] font-bold text-sm text-cyan-400">{(r.value / 1000).toFixed(1)}K CR</div>
                  </div>
                  <IndustrialButton
                    variant={credits >= r.value ? "primary" : "default"}
                    onClick={() => buy(r)}
                    disabled={credits < r.value}
                    icon="credits"
                    title={`Buy ${r.value}CR`}
                    description="Add to equipment inventory"
                  />
                </div>
              ))
            : stock.length > 0
              ? stock.map((it: Item) => (
                <div
                  key={it.id}
                  className="bg-black/26 border border-white/8 rounded-xl p-4 hover:border-amber-400 hover:bg-amber-500/4 transition"
                >
                  <div className="font-['Orbitron'] font-bold text-base text-amber-400 glow-amber mb-2">
                    {it.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider space-y-1 mb-3">
                    <div>TIER: <span className="text-amber-400 font-bold">{it.tier}</span></div>
                    <div>POWER: <span className="text-cyan-400 font-bold">{it.powerDraw}</span></div>
                  </div>
                  <div className="bg-black/40 border border-white/6 rounded-md p-2 mb-3 text-center">
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider mb-1">PRICE</div>
                    <div className="font-['Orbitron'] font-bold text-sm text-cyan-400">{((it.value ?? 0) / 1000).toFixed(1)}K CR</div>
                  </div>
                  <IndustrialButton
                    variant={credits >= (it.value ?? 0) ? "primary" : "default"}
                    onClick={() => buy(it)}
                    disabled={credits < (it.value ?? 0)}
                    icon="credits"
                    title={`Buy ${it.value ?? 0}CR`}
                    description="Add to equipment inventory"
                  />
                </div>
              ))
              : (
                <div className="col-span-full text-center text-zinc-500 text-sm py-8">
                  No equipment stock available.
                </div>
              )}
        </div>
      </IndustrialPanel>

      {/* Actions */}
      <IndustrialPanel>
        <div className="grid grid-cols-2 gap-3">
          <IndustrialButton
            onClick={() => {
              audio.playClick();
              refreshStock();
            }}
            icon="gear"
            title="Refresh Stock"
            description="View different items"
          />
          <IndustrialButton
            onClick={() => {
              audio.playTransition();
              onNavigate("hub");
            }}
            icon="home"
            title="← Back to Station"
            description="Return to hub"
          />
        </div>
      </IndustrialPanel>
    </div>
  );
};

export default EquipmentShopScreen;
