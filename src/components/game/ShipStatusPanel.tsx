import React, { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import ShipGrid from "./ShipGrid";
import StatChip from "../ui/StatChip";

export const ShipStatusPanel: React.FC = () => {
  const playerShip = useGameStore((s) => s.playerShip);
  const crewRoster = useGameStore((s) => s.crewRoster);
  const fuel = useGameStore((s) => s.fuel);
  const renameShip = useGameStore((s) => s.renameShip);
  const currentRun = useGameStore((s) => s.currentRun);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playerShip?.name ?? "SS BREAKER-01");

  if (!playerShip) return null;

  const cargoUsed = currentRun
    ? currentRun.collectedLoot.length
    : (playerShip.cargoUsed ?? 0);
  const cargoCapacity = playerShip.cargoCapacity ?? 10;
  
  const hullPercent = Math.round((playerShip.hp / playerShip.maxHp) * 100);
  const cargoPercent = Math.round((cargoUsed / cargoCapacity) * 100);

  return (
    <div className="space-y-4">
      {/* Ship Name */}
      <div className="flex items-center justify-between">
        {!editing && (
          <div className="font-['Orbitron'] font-bold text-[15px] text-[var(--amber)] tracking-wider" style={{ textShadow: "var(--glowA)" }}>
            {playerShip.name.toUpperCase()}
          </div>
        )}
        {editing && (
          <div className="flex gap-2 flex-1">
            <input
              className="flex-1 bg-[rgba(0,0,0,0.35)] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2 text-sm font-['Orbitron'] text-[var(--amber)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <button
              className="bg-[var(--ok)] text-black px-3 py-2 text-xs font-bold rounded-xl hover:opacity-80 transition"
              onClick={() => {
                renameShip(name);
                setEditing(false);
              }}
            >
              SAVE
            </button>
            <button
              className="bg-[rgba(255,255,255,0.08)] text-[var(--muted)] px-3 py-2 text-xs font-bold rounded-xl hover:bg-[rgba(255,255,255,0.12)] transition"
              onClick={() => {
                setEditing(false);
                setName(playerShip.name);
              }}
            >
              CANCEL
            </button>
          </div>
        )}
        {!editing && (
          <button
            className="text-xs text-[var(--cyan)] hover:text-[var(--amber)] transition uppercase tracking-wider font-bold"
            onClick={() => setEditing(true)}
          >
            RENAME
          </button>
        )}
      </div>

      {/* Ship Visualization */}
      <div className="flex justify-center bg-[rgba(0,0,0,0.35)] rounded-xl border border-[rgba(255,255,255,0.08)] p-4">
        <div className="w-full max-w-md">
          <ShipGrid ship={playerShip} crewRoster={crewRoster} hideShipName />
        </div>
      </div>

      {/* Ship Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatChip 
          label="HULL" 
          value={`${hullPercent}%`} 
          variant={hullPercent < 50 ? "red" : "green"}
        />
        <StatChip 
          label="FUEL" 
          value={fuel} 
          variant="amber"
        />
        <StatChip 
          label="CARGO" 
          value={`${cargoUsed}/${cargoCapacity}`} 
          variant={cargoPercent >= 100 ? "red" : "cyan"}
        />
      </div>
    </div>
  );
};

export default ShipStatusPanel;
