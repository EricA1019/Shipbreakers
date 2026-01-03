import { useGameStore } from "../../stores/gameStore";
import CyberPanel from "./CyberPanel";
import CyberButton from "./CyberButton";
import { PROVISION_PRICES } from "../../game/constants";

type ProvisionKey = "food" | "water" | "beer" | "wine";

export default function StationBarPanel() {
  const {
    credits,
    food,
    drink,
    luxuryDrink,
    pantryCapacity,
    buyProvision,
  } = useGameStore((s) => ({
    credits: s.credits,
    food: (s as any).food ?? 0,
    drink: (s as any).drink ?? 0,
    luxuryDrink: (s as any).luxuryDrink ?? 0,
    pantryCapacity: (s as any).pantryCapacity ?? { food: 0, drink: 0, luxury: 0 },
    buyProvision: (s as any).buyProvision as ((k: ProvisionKey) => void) | undefined,
  }));

  const canBuyFood = credits >= PROVISION_PRICES.food && food < pantryCapacity.food;
  const canBuyWater = credits >= PROVISION_PRICES.water && drink < pantryCapacity.drink;
  const canBuyBeer = credits >= PROVISION_PRICES.beer && luxuryDrink < pantryCapacity.luxury;
  const canBuyWine = credits >= PROVISION_PRICES.wine && luxuryDrink < pantryCapacity.luxury;

  return (
    <CyberPanel title="STATION BAR // PROVISIONS">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-950 border border-amber-600/20 p-2">
            <div className="text-zinc-400 text-xs">FOOD</div>
            <div className="text-amber-100 font-bold">
              {food}/{pantryCapacity.food}
            </div>
          </div>
          <div className="bg-zinc-950 border border-amber-600/20 p-2">
            <div className="text-zinc-400 text-xs">WATER</div>
            <div className="text-amber-100 font-bold">
              {drink}/{pantryCapacity.drink}
            </div>
          </div>
          <div className="bg-zinc-950 border border-amber-600/20 p-2">
            <div className="text-zinc-400 text-xs">LUXURY</div>
            <div className="text-amber-100 font-bold">
              {luxuryDrink}/{pantryCapacity.luxury}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CyberButton
            variant="secondary"
            onClick={() => buyProvision?.("food")}
            disabled={!buyProvision || !canBuyFood}
            className="text-xs"
          >
            Buy Food (+1) — {PROVISION_PRICES.food} CR
          </CyberButton>
          <CyberButton
            variant="secondary"
            onClick={() => buyProvision?.("water")}
            disabled={!buyProvision || !canBuyWater}
            className="text-xs"
          >
            Buy Water (+1) — {PROVISION_PRICES.water} CR
          </CyberButton>
          <CyberButton
            variant="secondary"
            onClick={() => buyProvision?.("beer")}
            disabled={!buyProvision || !canBuyBeer}
            className="text-xs"
          >
            Buy Beer (+1) — {PROVISION_PRICES.beer} CR
          </CyberButton>
          <CyberButton
            variant="secondary"
            onClick={() => buyProvision?.("wine")}
            disabled={!buyProvision || !canBuyWine}
            className="text-xs"
          >
            Buy Wine (+1) — {PROVISION_PRICES.wine} CR
          </CyberButton>
        </div>

        <div className="text-zinc-500 text-xs">
          Beer/wine count as luxury. If you drink luxury instead of water, you take a small efficiency penalty next day.
        </div>
      </div>
    </CyberPanel>
  );
}
