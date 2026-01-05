import { useMemo, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { calculateCrewCapacity } from "../../services/CrewService";
import IndustrialButton from "./IndustrialButton";

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

  const creditsLabel = useMemo(() => {
    if (credits >= 1000) return `${(credits / 1000).toFixed(1)}K`;
    return `${credits}`;
  }, [credits]);

  return (
    <div>
      <IndustrialButton
        title="Hire Crew"
        description="Review candidates · sign contracts"
        variant="primary"
        fullWidth
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-amber-600/50 p-6 max-w-md w-full mx-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="text-amber-500 text-xs font-semibold tracking-wider">
                CREW MARKET
              </div>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 bg-zinc-700 border border-amber-600/30 text-amber-100 hover:bg-zinc-600"
              >
                Close
              </button>
            </div>

            <div className="bg-zinc-800 border border-amber-600/20 p-3 mb-4 rounded">
              <div className="flex items-center justify-between">
                <div className="text-amber-100 text-sm">
                  Credits: <span className="font-bold">{creditsLabel} CR</span>
                </div>
                <div className="text-amber-100 text-sm">
                  Roster: <span className="font-bold">{crewRoster.length}/{capacity}</span>
                </div>
              </div>
              {isFull && (
                <div className="mt-2 text-xs text-red-400 font-bold">
                  ROSTER FULL — UPGRADE CAPACITY IN SHIPYARD
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {hireCandidates.length === 0 ? (
                <div className="bg-zinc-800 border border-amber-600/20 p-4 rounded text-center">
                  <div className="text-zinc-300 font-semibold mb-1">No candidates available</div>
                  <div className="text-xs text-zinc-400">Check back after the daily market refresh</div>
                </div>
              ) : (
                hireCandidates.map((c) => {
                  const canAfford = credits >= c.cost;
                  const disabled = isFull || !canAfford;

                  return (
                    <div
                      key={c.id}
                      className="bg-black/20 border border-white/10 rounded p-3"
                      style={{ boxShadow: "var(--glowA)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-['Orbitron'] font-extrabold text-[13px] tracking-[0.12em] uppercase text-amber-200">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">
                            Skills · T {c.skills.technical} · C {c.skills.combat} · S {c.skills.salvage} · P {c.skills.piloting}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-amber-100 font-bold">{c.cost} CR</div>
                          {!canAfford && (
                            <div className="text-[10px] text-red-400 font-semibold">Insufficient credits</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          className={`w-full px-4 py-2 font-bold ${
                            !disabled
                              ? "bg-amber-500 text-zinc-900 hover:bg-amber-400"
                              : "bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50"
                          }`}
                          disabled={disabled}
                          onClick={() => {
                            const ok = hireCrew(c);
                            if (ok) setOpen(false);
                          }}
                        >
                          {isFull ? "Roster Full" : !canAfford ? "Need Credits" : "Hire"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
