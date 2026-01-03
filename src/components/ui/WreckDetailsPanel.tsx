import type { Wreck } from "../../types";
import {
  SKILL_HAZARD_MAP,
  MISMATCH_PENALTY_THRESHOLD,
} from "../../game/constants";
import { useGameStore } from "../../stores/gameStore";

interface WreckDetailsPanelProps {
  wreck: Wreck;
}

const HAZARD_TOOLTIPS: Record<string, string> = {
  mechanical: "Ship systems and structural damage. Requires Technical skill.",
  combat: "Armed threats and hostile encounters. Requires Combat skill.",
  environmental:
    "Extreme conditions, radiation, or fire. Requires Piloting skill.",
  security: "Locked doors and defense systems. Requires Technical skill.",
};

export default function WreckDetailsPanel({ wreck }: WreckDetailsPanelProps) {
  const { crew } = useGameStore((s) => ({ crew: s.crew }));

  const totalLoot = wreck.rooms.reduce(
    (sum, room) => sum + room.loot.length,
    0,
  );
  const totalValue = wreck.rooms.reduce(
    (sum, room) =>
      sum + room.loot.reduce((s, item) => s + (item.value ?? 0), 0),
    0,
  );
  const avgHazardLevel = Math.round(
    wreck.rooms.reduce((sum, room) => sum + room.hazardLevel, 0) /
      wreck.rooms.length,
  );

  const getRarityCount = (rarity: string) => {
    return wreck.rooms.reduce(
      (sum, room) =>
        sum + room.loot.filter((item) => item.rarity === rarity).length,
      0,
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-zinc-800 border border-amber-600/20 p-3">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">
          WRECK ANALYSIS{" "}
          <span className="ml-2 text-amber-200/60 font-mono text-[10px]">
            残骸分析
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-zinc-400">Type</div>
            <div className="font-bold text-amber-100 capitalize">
              {wreck.type}
            </div>
          </div>
          <div>
            <div className="text-zinc-400">Tier</div>
            <div className="font-bold text-amber-100">{wreck.tier}</div>
          </div>
          <div>
            <div className="text-zinc-400">Distance</div>
            <div className="font-bold text-amber-100">{wreck.distance} AU</div>
          </div>
          <div>
            <div className="text-zinc-400">Rooms</div>
            <div className="font-bold text-amber-100">{wreck.rooms.length}</div>
          </div>
        </div>
      </div>

      {/* Loot Summary */}
      <div className="bg-zinc-800 border border-amber-600/20 p-3">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">
          LOOT SUMMARY{" "}
          <span className="ml-2 text-amber-200/60 font-mono text-[10px]">
            战利品总览
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-xs mb-3">
          <div>
            <div className="text-zinc-400">Total Items</div>
            <div className="font-bold text-amber-100">{totalLoot}</div>
          </div>
          <div>
            <div className="text-zinc-400">Est. Value</div>
            <div className="font-bold text-green-400">{totalValue} CR</div>
          </div>
          <div className="border-l border-amber-600/20 pl-2">
            <div className="text-zinc-400">Common</div>
            <div className="font-bold text-zinc-300">
              {getRarityCount("common")}
            </div>
          </div>
          <div className="border-l border-amber-600/20 pl-2">
            <div className="text-zinc-400">Uncommon</div>
            <div className="font-bold text-green-400">
              {getRarityCount("uncommon")}
            </div>
          </div>
          <div className="border-l border-amber-600/20 pl-2">
            <div className="text-zinc-400">Rare</div>
            <div className="font-bold text-blue-400">
              {getRarityCount("rare")}
            </div>
          </div>
        </div>
        <div className="text-xs">
          <div className="text-zinc-400">Legendary</div>
          <div className="font-bold text-yellow-400">
            {getRarityCount("legendary")}
          </div>
        </div>
      </div>

      {/* Hazard Summary */}
      <div className="bg-zinc-800 border border-amber-600/20 p-3">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">
          HAZARD ANALYSIS
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs mb-3">
          <div>
            <div className="text-zinc-400">Avg Level</div>
            <div className="font-bold text-orange-400">{avgHazardLevel}</div>
          </div>
          <div className="border-l border-amber-600/20 pl-2">
            <div
              className="text-zinc-400 cursor-help border-b border-dotted border-orange-600/50"
              data-tooltip-id="game-tooltip"
              data-tooltip-content={HAZARD_TOOLTIPS.mechanical}
            >
              Mechanical
            </div>
            <div className="font-bold text-orange-400">
              {wreck.rooms.filter((r) => r.hazardType === "mechanical").length}
            </div>
          </div>
          <div className="border-l border-amber-600/20 pl-2">
            <div
              className="text-zinc-400 cursor-help border-b border-dotted border-red-600/50"
              data-tooltip-id="game-tooltip"
              data-tooltip-content={HAZARD_TOOLTIPS.combat}
            >
              Combat
            </div>
            <div className="font-bold text-red-400">
              {wreck.rooms.filter((r) => r.hazardType === "combat").length}
            </div>
          </div>
          <div className="border-l border-amber-600/20 pl-2">
            <div
              className="text-zinc-400 cursor-help border-b border-dotted border-cyan-600/50"
              data-tooltip-id="game-tooltip"
              data-tooltip-content={HAZARD_TOOLTIPS.environmental}
            >
              Environmental
            </div>
            <div className="font-bold text-cyan-400">
              {
                wreck.rooms.filter((r) => r.hazardType === "environmental")
                  .length
              }
            </div>
          </div>
        </div>
        <div className="text-xs border-t border-amber-600/20 pt-2">
          <div
            className="text-zinc-400 cursor-help border-b border-dotted border-yellow-600/50"
            data-tooltip-id="game-tooltip"
            data-tooltip-content={HAZARD_TOOLTIPS.security}
          >
            Security
          </div>
          <div className="font-bold text-yellow-400">
            {wreck.rooms.filter((r) => r.hazardType === "security").length}
          </div>
        </div>
      </div>

      {/* Crew Compatibility */}
      <div className="bg-zinc-800 border border-amber-600/20 p-3">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">
          CREW COMPATIBILITY
        </div>
        <div className="space-y-2 text-xs">
          {(["technical", "combat", "salvage", "piloting"] as const).map(
            (skill) => {
              const skillLevel = crew.skills[skill];
              const roomsForSkill = wreck.rooms.filter(
                (r) => SKILL_HAZARD_MAP[r.hazardType as any] === skill,
              ).length;
              const isMismatch =
                wreck.tier >= MISMATCH_PENALTY_THRESHOLD && skillLevel < 3;

              return (
                <div
                  key={skill}
                  className="flex justify-between items-center border-b border-amber-600/10 pb-1 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-semibold text-amber-100">
                      {skill}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isMismatch ? "bg-red-900/50 text-red-300" : "bg-green-900/50 text-green-300"}`}
                    >
                      Lv.{skillLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-400">{roomsForSkill} rooms</div>
                    {isMismatch && (
                      <div className="text-red-400 text-[10px] font-bold">
                        Penalty incoming
                      </div>
                    )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* Risk Assessment */}
      <div
        className={`border p-3 text-xs ${wreck.tier <= 2 ? "border-green-600/30 bg-green-900/10" : wreck.tier === 3 ? "border-yellow-600/30 bg-yellow-900/10" : "border-red-600/30 bg-red-900/10"}`}
      >
        <div className="font-bold mb-1">
          {wreck.tier <= 2
            ? "Low Risk"
            : wreck.tier === 3
              ? "Moderate Risk"
              : "High Risk"}
        </div>
        <div
          className={
            wreck.tier <= 2
              ? "text-green-300"
              : wreck.tier === 3
                ? "text-yellow-300"
                : "text-red-300"
          }
        >
          {wreck.tier <= 2
            ? "Good match for your current skill level. Expect moderate difficulty."
            : wreck.tier === 3
              ? "Challenging but achievable. Some skills may be underdeveloped."
              : "Very difficult. Consider training crew skills or attempting easier wrecks first."}
        </div>
      </div>
    </div>
  );
}
