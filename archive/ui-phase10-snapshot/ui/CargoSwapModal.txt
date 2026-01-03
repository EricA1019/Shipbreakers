import React from "react";
import type { Loot, Item } from "../../types";

interface Props {
  newItem: Loot | Item;
  currentCargo: (Loot | Item)[];
  onSwap: (dropItemId: string) => void;
  onLeave: () => void;
}

export const CargoSwapModal: React.FC<Props> = ({
  newItem,
  currentCargo,
  onSwap,
  onLeave,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-zinc-900 border border-amber-600/20 p-6 rounded w-3/4 max-w-2xl">
        <div className="font-mono text-amber-200 text-sm">
          CARGO FULL — Swap Item
        </div>
        <div className="mt-3 text-amber-100">
          New item found: <span className="font-bold">{newItem.name}</span>
        </div>
        <div className="mt-3">
          <div className="font-mono text-amber-200 mb-2">
            Choose an item to drop:
          </div>
          <div className="grid grid-cols-2 gap-2">
            {currentCargo.map((c) => (
              <div
                key={c.id}
                className="bg-zinc-800 p-2 rounded flex items-center justify-between"
              >
                <div className="text-amber-100 text-sm">{c.name}</div>
                <button
                  className="bg-red-600 text-white px-2 py-1 rounded"
                  onClick={() => onSwap(c.id)}
                >
                  Drop
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onLeave}
            className="bg-zinc-700 text-amber-100 px-3 py-1 rounded"
          >
            Leave Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default CargoSwapModal;
