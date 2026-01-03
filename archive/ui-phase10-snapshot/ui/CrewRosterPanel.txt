import { useGameStore } from "../../stores/gameStore";

export default function CrewRosterPanel() {
  const { crewRoster, selectedCrewId, selectCrew } = useGameStore((s) => ({
    crewRoster: s.crewRoster,
    selectedCrewId: s.selectedCrewId,
    selectCrew: s.selectCrew,
  }));

  return (
    <div className="p-4 bg-zinc-800 border border-amber-600/20 rounded">
      <div className="text-amber-200 text-sm font-semibold tracking-wider mb-2">
        CREW ROSTER
      </div>
      <div className="space-y-2">
        {crewRoster.map((c) => (
          <button
            key={c.id}
            className={`w-full flex items-center justify-between p-2 rounded hover:bg-zinc-700 ${c.id === selectedCrewId ? "ring-2 ring-amber-500" : ""}`}
            onClick={() => selectCrew(c.id)}
          >
            <div className="flex flex-col text-left">
              <div className="text-amber-50 font-semibold">
                {c.name}
                {c.isPlayer ? " (Captain)" : ""}
              </div>
              <div className="text-amber-300 text-xs">
                HP: {c.hp}/{c.maxHp}
              </div>
            </div>
            <div className="text-amber-200 text-xs">
              T:{c.skills.technical} C:{c.skills.combat} S:{c.skills.salvage} P:
              {c.skills.piloting}
            </div>
          </button>
        ))}
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 5 - crewRoster.length) }).map(
          (_, i) => (
            <div
              key={`empty-${i}`}
              className="w-full p-2 border border-dashed border-amber-600/10 rounded text-amber-400 text-xs"
            >
              Empty Slot
            </div>
          ),
        )}
      </div>
    </div>
  );
}
