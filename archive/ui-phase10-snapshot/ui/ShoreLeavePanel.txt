import { useGameStore } from "../../stores/gameStore";
import CyberPanel from "./CyberPanel";
import CyberButton from "./CyberButton";
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
    <CyberPanel title="SHORE LEAVE">
      <div className="space-y-2 text-xs text-zinc-300">
        <div className="text-zinc-500">
          Restore stamina/sanity. Higher tiers may trigger social events.
        </div>

        <div className="grid grid-cols-1 gap-2">
          <CyberButton
            variant="secondary"
            className="text-xs"
            onClick={() => takeShoreLeave?.("rest")}
            disabled={!canRest}
          >
            Rest — {rest.cost} CR
          </CyberButton>

          <CyberButton
            variant="secondary"
            className="text-xs"
            onClick={() => takeShoreLeave?.("recreation")}
            disabled={!canRecreation}
          >
            Recreation — {recreation.cost} CR
          </CyberButton>

          <CyberButton
            variant="secondary"
            className="text-xs"
            onClick={() => takeShoreLeave?.("party")}
            disabled={!canParty}
          >
            Party — {party.cost} CR {neededBeer ? `(+${neededBeer} luxury)` : ""}
          </CyberButton>
        </div>
      </div>
    </CyberPanel>
  );
}
