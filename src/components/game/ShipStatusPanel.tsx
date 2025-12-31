import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import ShipGrid from './ShipGrid';

export const ShipStatusPanel: React.FC = () => {
  const playerShip = useGameStore((s) => s.playerShip);
  const fuel = useGameStore((s) => s.fuel);
  const renameShip = useGameStore((s) => s.renameShip);
  const currentRun = useGameStore((s) => s.currentRun);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playerShip?.name ?? 'SS BREAKER-01');

  if (!playerShip) return null;

  const cargoUsed = currentRun ? currentRun.collectedLoot.length : (playerShip.cargoUsed ?? 0);
  const cargoCapacity = playerShip.cargoCapacity ?? 10;

  return (
    <div className="bg-zinc-900 border border-amber-600/20 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        {!editing && (
          <div className="text-amber-200 font-mono text-sm tracking-wider">{playerShip.name}</div>
        )}
        {editing && (
          <div className="flex gap-2">
            <input className="bg-zinc-800 border border-amber-600/20 px-2 py-1 text-xs" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="bg-amber-500 text-zinc-900 px-2 py-1 text-xs" onClick={() => { renameShip(name); setEditing(false); }}>Save</button>
            <button className="bg-zinc-700 text-zinc-200 px-2 py-1 text-xs" onClick={() => { setEditing(false); setName(playerShip.name); }}>Cancel</button>
          </div>
        )}
        {!editing && (
          <button className="text-xs text-amber-400 underline" onClick={() => setEditing(true)}>Rename</button>
        )}
      </div>

      <div className="mb-3">
        <ShipGrid ship={playerShip} hideShipName />
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <div>Hull</div>
          <div className="font-mono">{playerShip.hp}/{playerShip.maxHp}</div>
        </div>
        <div className="h-2 bg-zinc-800 rounded overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${(playerShip.hp / playerShip.maxHp) * 100}%` }} />
        </div>

        <div className="flex justify-between mt-1">
          <div>Fuel</div>
          <div className="font-mono">{fuel}</div>
        </div>

        <div className="flex justify-between mt-1">
          <div>Cargo</div>
          <div className="font-mono">{cargoUsed}/{cargoCapacity}</div>
        </div>
        <div className="h-2 bg-zinc-800 rounded overflow-hidden">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${(cargoUsed / cargoCapacity) * 100}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ShipStatusPanel;
