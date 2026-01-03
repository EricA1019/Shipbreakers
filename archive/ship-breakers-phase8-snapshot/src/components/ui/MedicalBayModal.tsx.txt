import { useGameStore } from "../../stores/gameStore";
import { HEALING_COST, HEALING_AMOUNT } from "../../game/constants";
import {
  showSuccessNotification,
  showWarningNotification,
} from "../../utils/notifications";

interface MedicalBayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MedicalBayModal({
  isOpen,
  onClose,
}: MedicalBayModalProps) {
  const { credits, crew, payForHealing } = useGameStore((s) => ({
    credits: s.credits,
    crew: s.crew,
    payForHealing: s.payForHealing,
  }));

  const isHealthy = crew.hp >= crew.maxHp;
  const canAfford = credits >= HEALING_COST;
  const treatmentsNeeded = Math.ceil((crew.maxHp - crew.hp) / HEALING_AMOUNT);
  const totalCost = treatmentsNeeded * HEALING_COST;
  const hpPercentage = (crew.hp / crew.maxHp) * 100;

  const handleHeal = () => {
    if (payForHealing()) {
      showSuccessNotification(
        `Medical Treatment`,
        `Crew healed +${HEALING_AMOUNT} HP for ${HEALING_COST} CR`,
      );
      onClose();
    } else {
      showWarningNotification(
        `Cannot Treat`,
        canAfford ? "Crew is fully healthy" : `Need ${HEALING_COST} CR`,
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-amber-600/50 p-6 max-w-md w-full mx-4">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-4">
          🏥 MEDICAL BAY
        </div>

        <div className="bg-zinc-800 border border-amber-600/20 p-4 mb-4 rounded">
          <div className="text-zinc-400 text-xs mb-2">CREW HEALTH STATUS</div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-amber-100 font-bold">
              {crew.hp} / {crew.maxHp} HP
            </span>
            <span
              className={`text-xs font-bold ${hpPercentage > 75 ? "text-green-400" : hpPercentage > 30 ? "text-yellow-400" : "text-red-400"}`}
            >
              {Math.floor(hpPercentage)}%
            </span>
          </div>
          <div className="relative w-full bg-black h-4 rounded border border-amber-600/30 overflow-hidden">
            <div
              className={`h-full transition-all ${
                hpPercentage > 75
                  ? "bg-green-500"
                  : hpPercentage > 30
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
        </div>

        {isHealthy ? (
          <div className="text-center text-green-400 font-bold mb-4">
            ✓ Crew is in perfect health!
          </div>
        ) : (
          <div className="bg-zinc-800 border border-amber-600/20 p-3 mb-4 rounded">
            <div className="text-zinc-400 text-xs mb-2">TREATMENT PLAN</div>
            <div className="text-amber-100 text-sm">
              <div className="mb-2">
                Cost per treatment:{" "}
                <span className="font-bold">{HEALING_COST} CR</span>
              </div>
              <div className="mb-2">
                Healing per treatment:{" "}
                <span className="font-bold">+{HEALING_AMOUNT} HP</span>
              </div>
              <div className="border-t border-amber-600/20 pt-2 mt-2">
                Treatments needed:{" "}
                <span className="font-bold text-amber-500">
                  {treatmentsNeeded}
                </span>
              </div>
              <div className="text-yellow-400 font-bold mt-2">
                Total cost: {totalCost} CR
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-700 border border-amber-600/30 text-amber-100 hover:bg-zinc-600"
          >
            Decline
          </button>
          <button
            onClick={handleHeal}
            disabled={isHealthy || !canAfford}
            className={`flex-1 px-4 py-2 font-bold ${
              !isHealthy && canAfford
                ? "bg-amber-500 text-zinc-900 hover:bg-amber-400"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50"
            }`}
          >
            {isHealthy
              ? "Fully Healthy"
              : canAfford
                ? `Heal (${HEALING_COST} CR)`
                : "Insufficient Credits"}
          </button>
        </div>
      </div>
    </div>
  );
}
