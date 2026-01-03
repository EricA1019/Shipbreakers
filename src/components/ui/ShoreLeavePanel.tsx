import { useGameStore } from "../../stores/gameStore";
import IndustrialPanel from "./IndustrialPanel";
import IndustrialButton from "./IndustrialButton";
import { SHORE_LEAVE_OPTIONS } from "../../game/constants";

export default function ShoreLeavePanel() {
  const { credits, crewRoster, luxuryDrink, takeShoreLeave } = useGameStore((s) => ({
    credits: s.credits,
    crewRoster: s.crewRoster,
    luxuryDrink: (s as any).luxuryDrink ?? 0,
    takeShoreLeave: (s as any).takeShoreLeave as ((t: "rest" | "recreation" | "party") => void) | undefined,
  }));

  const crewCount = crewRoster.length;
  const rest = SHORE_LEAVE_OPTIONS.rest;
  const recreation = SHORE_LEAVE_OPTIONS.recreation;
  const party = SHORE_LEAVE_OPTIONS.party;

  const canRest = !!takeShoreLeave;
  const canRecreation = !!takeShoreLeave && credits >= recreation.cost;
  const neededBeer = (party as any).beerPerCrew ? crewCount * (party as any).beerPerCrew : 0;
  const canParty =
    !!takeShoreLeave &&
    credits >= party.cost &&
    (neededBeer === 0 || luxuryDrink >= neededBeer);

  return (
    <IndustrialPanel title="SHORE LEAVE" subtitle="CREW RECOVERY OPTIONS">
      <div className="space-y-3 text-xs">
        <div className="text-[var(--muted)]">
          Restore stamina & sanity. Higher tiers may trigger social events.
        </div>

        <div className="space-y-2">
          <IndustrialButton
            title="😴 Rest"
            description={`Basic recovery · ${rest.cost} cr`}
            variant="info"
            fullWidth
            onClick={() => takeShoreLeave?.("rest")}
            disabled={!canRest}
          />

          <IndustrialButton
            title="🎮 Recreation"
            description={`Better recovery · ${recreation.cost} cr`}
            variant="info"
            fullWidth
            onClick={() => takeShoreLeave?.("recreation")}
            disabled={!canRecreation}
          />

          <IndustrialButton
            title="🎉 Party"
            description={`Full recovery · ${party.cost} cr ${neededBeer ? `+ ${neededBeer} luxury` : ""}`}
            variant="info"
            fullWidth
            onClick={() => takeShoreLeave?.("party")}
            disabled={!canParty}
          />
        </div>
      </div>
    </IndustrialPanel>
  );
}
