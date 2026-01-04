import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { calculateCrewCapacity } from "../../services/CrewService";

export default function HireCrewModal() {
  const [open, setOpen] = useState(false);
  const { hireCandidates, hireCrew, credits, crewRoster, playerShip } = useGameStore((s) => ({
    hireCandidates: s.hireCandidates,
    hireCrew: s.hireCrew,
    credits: s.credits,
    crewRoster: s.crewRoster,
    playerShip: s.playerShip,
  }));

  const capacity = calculateCrewCapacity(playerShip);
  const isFull = crewRoster.length >= capacity;

  return (
    <div>
      <button
        className="px-3 py-1 bg-amber-600 text-zinc-900 rounded font-semibold"
        onClick={() => setOpen(true)}
      >
        Hire Crew
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 border border-amber-600/20 p-4 rounded w-96">
            <div className="flex justify-between items-center mb-3">
              <div className="text-amber-200 font-semibold">
                Hire Crew - Market
              </div>
              <button className="text-amber-400" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            
            <div className="mb-3 text-xs text-amber-400/80 flex justify-between">
              <span>Capacity: {crewRoster.length} / {capacity}</span>
              {isFull && <span className="text-red-400">ROSTER FULL</span>}
            </div>

            <div className="space-y-2">
              {hireCandidates.length === 0 && (
                <div className="text-amber-400 text-sm">
                  No candidates available today.
                </div>
              )}
              {hireCandidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 border border-amber-600/10 rounded"
                >
                  <div>
                    <div className="text-amber-50 font-semibold">{c.name}</div>
                    <div className="text-amber-300 text-xs">
                      T:{c.skills.technical} C:{c.skills.combat} S:
                      {c.skills.salvage} P:{c.skills.piloting}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-amber-200 font-semibold">
                      {c.cost} CR
                    </div>
                    <button
                      className="mt-2 px-2 py-1 bg-amber-600 text-zinc-900 rounded disabled:opacity-50"
                      disabled={credits < c.cost || isFull}
                      onClick={() => {
                        const ok = hireCrew(c);
                        if (ok) setOpen(false);
                      }}
                    >
                      {isFull ? "Full" : "Hire"}
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
