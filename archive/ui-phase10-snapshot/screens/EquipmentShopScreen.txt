import React, { useEffect, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useUiStore } from "../../stores/uiStore";
import type { Item, ReactorModule } from "../../types";
import { wasmBridge } from "../../game/wasm/WasmBridge";
import { getAllEquipment } from "../../game/data/equipment";
import { REACTORS } from "../../game/data/reactors";

import type { ScreenProps } from "../../types";

export const EquipmentShopScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const day = useGameStore((s) => s.day);
  const licenseTier = useGameStore((s) =>
    s.licenseTier === "basic" ? 1 : s.licenseTier === "standard" ? 2 : 3,
  );
  const credits = useGameStore((s) => s.credits);
  const addToInventory = (item: Item | ReactorModule) => {
    // simple direct mutation via store
    useGameStore.setState((state) => ({
      equipmentInventory: (state.equipmentInventory || []).concat(item as any),
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
      const s = await wasmBridge.generateShopStock(day, licenseTier);
      // map wasm stock to available equipment where possible
      const all = getAllEquipment();
      const mapped: Item[] = s.map((x: any) => {
        // try to find closest matching equipment by tier
        const found =
          all.find((a) => a.tier === x.tier) ||
          all[Math.floor(Math.random() * all.length)];
        return { ...x, ...found } as Item;
      });
      setStock(mapped);
    })();
  }, [day, licenseTier, forceRefresh]);

  const buy = (item: Item | ReactorModule) => {
    if (credits < (item.value ?? 0))
      return addToast({ message: "Not enough credits", type: "warning" });
    addToInventory(item);
    addToast({ message: "Purchased", type: "success" });
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="font-mono text-amber-200">
          🛒 EQUIPMENT SHOP — DAY {day}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={refreshStock}
            className="bg-zinc-800 border border-amber-600/20 text-amber-100 px-3 py-1 rounded hover:bg-zinc-700"
          >
            Refresh
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate("hub")}
              className="bg-zinc-800 border border-amber-600/20 text-amber-100 px-3 py-1 rounded hover:bg-zinc-700"
            >
              ← Back to Hub
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setCategory("tools")}
          className={`px-3 py-1 rounded ${category === "tools" ? "bg-amber-600 text-zinc-900" : "bg-zinc-800 text-amber-200"}`}
        >
          Tools
        </button>
        <button
          onClick={() => setCategory("systems")}
          className={`px-3 py-1 rounded ${category === "systems" ? "bg-amber-600 text-zinc-900" : "bg-zinc-800 text-amber-200"}`}
        >
          Systems
        </button>
        <button
          onClick={() => setCategory("reactors")}
          className={`px-3 py-1 rounded ${category === "reactors" ? "bg-amber-600 text-zinc-900" : "bg-zinc-800 text-amber-200"}`}
        >
          Reactors
        </button>
        <button
          onClick={() => setCategory("expansions")}
          className={`px-3 py-1 rounded ${category === "expansions" ? "bg-amber-600 text-zinc-900" : "bg-zinc-800 text-amber-200"}`}
        >
          Expansions
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {category === "reactors"
          ? Object.values(REACTORS).map((r) => (
              <div
                key={r.id}
                className="bg-zinc-900 border border-amber-600/20 p-3 rounded"
              >
                <div className="font-mono text-amber-100">{r.name}</div>
                <div className="text-amber-200 text-xs">
                  Power: {r.powerOutput} — Tier {r.tier}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => buy(r)}
                    className="bg-amber-600 px-2 py-1 rounded"
                  >
                    Buy {r.value}CR
                  </button>
                </div>
              </div>
            ))
          : stock.map((it: Item) => (
              <div
                key={it.id}
                className="bg-zinc-900 border border-amber-600/20 p-3 rounded"
              >
                <div className="font-mono text-amber-100">{it.name}</div>
                <div className="text-amber-200 text-xs">
                  Tier: {it.tier} — Power: {it.powerDraw}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => buy(it)}
                    className="bg-amber-600 px-2 py-1 rounded"
                  >
                    Buy {it.value ?? 0}CR
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default EquipmentShopScreen;
