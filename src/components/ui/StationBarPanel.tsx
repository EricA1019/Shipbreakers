import { useGameStore } from "../../stores/gameStore";
import IndustrialPanel from "./IndustrialPanel";
import IndustrialButton from "./IndustrialButton";
import { PROVISION_PRICES } from "../../game/constants";
import { useAudio } from "../../hooks/useAudio";

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

  const audio = useAudio();

  const canBuyFood = credits >= PROVISION_PRICES.food && food < pantryCapacity.food;
  const canBuyWater = credits >= PROVISION_PRICES.water && drink < pantryCapacity.drink;
  const canBuyBeer = credits >= PROVISION_PRICES.beer && luxuryDrink < pantryCapacity.luxury;
  const canBuyWine = credits >= PROVISION_PRICES.wine && luxuryDrink < pantryCapacity.luxury;

  return (
    <IndustrialPanel title="STATION BAR" subtitle="PROVISIONS & SUPPLIES">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.08)] p-2 rounded-lg">
            <div className="text-[var(--muted)] text-xs uppercase tracking-wider">FOOD</div>
            <div className="text-[var(--haz)] font-bold font-['Orbitron']">
              {food}/{pantryCapacity.food}
            </div>
          </div>
          <div className="bg-[rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.08)] p-2 rounded-lg">
            <div className="text-[var(--muted)] text-xs uppercase tracking-wider">WATER</div>
            <div className="text-[var(--cyan)] font-bold font-['Orbitron']">
              {drink}/{pantryCapacity.drink}
            </div>
          </div>
          <div className="bg-[rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.08)] p-2 rounded-lg">
            <div className="text-[var(--muted)] text-xs uppercase tracking-wider">LUXURY</div>
            <div className="text-[var(--rust)] font-bold font-['Orbitron']">
              {luxuryDrink}/{pantryCapacity.luxury}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <IndustrialButton
            title="Buy Food (+1)"
            description={`${PROVISION_PRICES.food} cr`}
            variant="info"
            icon="food"
            onClick={() => {
              audio.playClick();
              buyProvision?.("food");
            }}
            disabled={!buyProvision || !canBuyFood}
          />
          <IndustrialButton
            title="Buy Water (+1)"
            description={`${PROVISION_PRICES.water} cr`}
            variant="info"
            icon="drink"
            onClick={() => {
              audio.playClick();
              buyProvision?.("water");
            }}
            disabled={!buyProvision || !canBuyWater}
          />
          <IndustrialButton
            title="Buy Beer (+1)"
            description={`${PROVISION_PRICES.beer} cr`}
            variant="info"
            icon="drink"
            onClick={() => {
              audio.playClick();
              buyProvision?.("beer");
            }}
            disabled={!buyProvision || !canBuyBeer}
          />
          <IndustrialButton
            title="Buy Wine (+1)"
            description={`${PROVISION_PRICES.wine} cr`}
            variant="info"
            icon="potion"
            onClick={() => {
              audio.playClick();
              buyProvision?.("wine");
            }}
            disabled={!buyProvision || !canBuyWine}
          />
        </div>

        <div className="text-[var(--muted)] text-xs">
          Beer/wine count as luxury. Consuming luxury instead of water reduces efficiency next day.
        </div>
      </div>
    </IndustrialPanel>
  );
}
