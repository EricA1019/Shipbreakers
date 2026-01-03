import { useGameStore } from "../../stores/gameStore";

interface InventoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryViewer({
  isOpen,
  onClose,
}: InventoryViewerProps) {
  const { inventory, credits } = useGameStore((s) => ({
    inventory: s.inventory,
    credits: s.credits,
  }));

  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.value ?? 0),
    0,
  );
  const itemsByRarity = {
    common: inventory.filter((i) => i.rarity === "common"),
    uncommon: inventory.filter((i) => i.rarity === "uncommon"),
    rare: inventory.filter((i) => i.rarity === "rare"),
    legendary: inventory.filter((i) => i.rarity === "legendary"),
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: "text-zinc-300",
      uncommon: "text-green-400",
      rare: "text-blue-400",
      legendary: "text-yellow-400",
    };
    return colors[rarity] || "text-zinc-300";
  };

  const getRarityBgColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: "bg-zinc-800",
      uncommon: "bg-green-900/30",
      rare: "bg-blue-900/30",
      legendary: "bg-yellow-900/30",
    };
    return colors[rarity] || "bg-zinc-800";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-amber-600/50 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 pb-4 mb-4 border-b border-amber-600/20">
          <div className="text-amber-500 text-xs font-semibold tracking-wider">
            📦 INVENTORY VIEWER
          </div>
          <div className="mt-3 flex justify-between items-start">
            <div>
              <div className="text-zinc-400 text-xs">Total Items</div>
              <div className="text-2xl font-bold text-amber-100">
                {inventory.length}
              </div>
            </div>
            <div>
              <div className="text-zinc-400 text-xs">Inventory Value</div>
              <div className="text-2xl font-bold text-amber-500">
                {totalValue} CR
              </div>
            </div>
            <div>
              <div className="text-zinc-400 text-xs">Current Credits</div>
              <div className="text-2xl font-bold text-green-400">
                {credits} CR
              </div>
            </div>
          </div>
        </div>

        {inventory.length === 0 ? (
          <div className="text-center text-zinc-400 py-8">
            <div className="text-sm">No items in inventory</div>
            <div className="text-xs mt-2 text-zinc-500">
              Complete salvage runs to collect components and materials
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(
              Object.keys(itemsByRarity) as Array<keyof typeof itemsByRarity>
            ).map((rarity) => {
              const items = itemsByRarity[rarity];
              if (items.length === 0) return null;

              return (
                <div
                  key={rarity}
                  className="border border-amber-600/20 rounded overflow-hidden"
                >
                  <div className="bg-zinc-800 px-3 py-2 border-b border-amber-600/20">
                    <div
                      className={`text-xs font-bold tracking-wider uppercase ${getRarityColor(rarity)}`}
                    >
                      {rarity} ({items.length})
                    </div>
                  </div>
                  <div className="divide-y divide-amber-600/10">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 ${getRarityBgColor(rarity)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div
                              className={`font-bold text-sm ${getRarityColor(rarity)}`}
                            >
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-xs text-zinc-400 mt-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-amber-500">
                              {item.value ?? 0} CR
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex gap-2 sticky bottom-0 bg-zinc-900 pt-4 border-t border-amber-600/20">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-amber-500 text-zinc-900 font-bold hover:bg-amber-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
