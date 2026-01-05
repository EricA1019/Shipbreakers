/**
 * DeadCrewMemorial - Phase 14
 * Shows fallen crew members as a memorial
 */

import { useGameStore } from "../../stores/gameStore";
import { BACKGROUNDS } from "../../game/data/backgrounds";
import IndustrialPanel from "./IndustrialPanel";

export default function DeadCrewMemorial() {
  const deadCrew = useGameStore((s) => s.deadCrew || []);

  if (deadCrew.length === 0) {
    return null;
  }

  return (
    <IndustrialPanel title="IN MEMORIAM" subtitle="FALLEN CREW">
      <div className="space-y-2">
        {deadCrew.map((crew) => (
          <div
            key={crew.id}
            className="flex items-center justify-between bg-black/30 border border-zinc-700/50 rounded-md px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl opacity-50">⚰️</div>
              <div>
                <div className="text-sm text-zinc-300 font-medium">
                  {crew.name}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {BACKGROUNDS[crew.background]?.name || crew.background}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-red-400/70">
                Day {crew.diedOnDay}
              </div>
              <div className="text-[9px] text-zinc-600 italic max-w-[150px] truncate">
                {crew.causeOfDeath}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-[10px] text-zinc-600 italic">
        "They gave everything for the salvage."
      </div>
    </IndustrialPanel>
  );
}
