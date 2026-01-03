import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { FUEL_PRICE } from "../../game/constants";
import {
  showSuccessNotification,
  showWarningNotification,
} from "../../utils/notifications";

interface FuelDepotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FuelDepotModal({
  isOpen,
  onClose,
}: FuelDepotModalProps) {
  const { credits, fuel, buyFuel } = useGameStore((s) => ({
    credits: s.credits,
    fuel: s.fuel,
    buyFuel: s.buyFuel,
  }));

  const [selectedAmount, setSelectedAmount] = useState(10);

  const fuelOptions = [
    { amount: 10, cost: 10 * FUEL_PRICE },
    { amount: 25, cost: 25 * FUEL_PRICE },
    { amount: 50, cost: 50 * FUEL_PRICE },
    { amount: 100, cost: 100 * FUEL_PRICE },
  ];

  const currentCost = selectedAmount * FUEL_PRICE;
  const canAfford = credits >= currentCost;

  const handlePurchase = () => {
    if (buyFuel(selectedAmount)) {
      showSuccessNotification(
        `Fuel Purchase`,
        `+${selectedAmount} fuel for ${currentCost} CR`,
      );
      onClose();
    } else {
      showWarningNotification(
        `Insufficient Credits`,
        `Need ${currentCost} CR, have ${credits} CR`,
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-amber-600/50 p-6 max-w-md w-full mx-4">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-4">
          FUEL DEPOT
        </div>

        <div className="bg-zinc-800 border border-amber-600/20 p-3 mb-4 rounded">
          <div className="text-amber-100 text-sm mb-2">
            Current Fuel: <span className="font-bold">{fuel}</span>
          </div>
          <div className="text-amber-100 text-sm">
            Credits: <span className="font-bold">{credits} CR</span>
          </div>
        </div>

        <div className="text-zinc-400 text-xs mb-3">
          Price: {FUEL_PRICE} CR per unit
        </div>

        <div className="space-y-2 mb-4">
          {fuelOptions.map((option) => (
            <button
              key={option.amount}
              onClick={() => setSelectedAmount(option.amount)}
              className={`w-full p-2 text-left border-2 rounded transition-colors ${
                selectedAmount === option.amount
                  ? "border-amber-500 bg-amber-500/10 text-amber-100"
                  : "border-amber-600/20 bg-zinc-800 text-zinc-300 hover:border-amber-600/50"
              }`}
            >
              <span className="font-semibold">+{option.amount} fuel</span>
              <span className="float-right text-xs">{option.cost} CR</span>
            </button>
          ))}
        </div>

        <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded mb-4">
          <div className="text-zinc-400 text-xs mb-1">PURCHASE SUMMARY</div>
          <div className="text-amber-100 font-bold text-lg">
            {selectedAmount} fuel for {currentCost} CR
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-700 border border-amber-600/30 text-amber-100 hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={!canAfford}
            className={`flex-1 px-4 py-2 font-bold ${
              canAfford
                ? "bg-amber-500 text-zinc-900 hover:bg-amber-400"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50"
            }`}
          >
            {canAfford ? "Purchase" : "Insufficient Credits"}
          </button>
        </div>
      </div>
    </div>
  );
}
