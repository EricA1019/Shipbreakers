import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import IndustrialButton from "./IndustrialButton";

export default function CrewSelectionModal() {
  const [open, setOpen] = useState(false);
  const { crewRoster, selectedCrewId, selectCrew } = useGameStore((s) => ({
    crewRoster: s.crewRoster,
    selectedCrewId: s.selectedCrewId,
    selectCrew: s.selectCrew,
  }));

  return (
    <div>
      <IndustrialButton
        title="Select Crew"
        description="Assign who leads the run"
        variant="info"
        fullWidth
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 border border-amber-600/20 p-4 rounded w-96">
            <div className="flex justify-between items-center mb-3">
              <div className="text-amber-200 font-semibold">
                Select Crew for Run
              </div>
              <button className="text-amber-400" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div className="space-y-2">
              {crewRoster.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-2 border rounded ${c.id === selectedCrewId ? "border-amber-500" : "border-amber-600/10"}`}
                >
                  <div>
                    <div className="text-amber-50 font-semibold">
                      {c.name}
                      {c.isPlayer ? " (Captain)" : ""}
                    </div>
                    <div className="text-amber-300 text-xs">
                      HP: {c.hp}/{c.maxHp}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <button
                      className="px-2 py-1 bg-amber-600 text-zinc-900 rounded"
                      onClick={() => {
                        selectCrew(c.id);
                        setOpen(false);
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
