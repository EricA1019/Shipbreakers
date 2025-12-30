import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FUEL_COST_PER_AU, TIME_PER_ROOM } from '../../game/constants';

export default function SalvageScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { currentRun, availableWrecks, crew, fuel, salvageRoom, returnToStation } = useGameStore((s) => ({ currentRun: s.currentRun, availableWrecks: s.availableWrecks, crew: s.crew, fuel: s.fuel, salvageRoom: s.salvageRoom, returnToStation: s.returnToStation }));
  const [log, setLog] = useState<string[]>([]);

  if (!currentRun) return <div>No active run. <button onClick={() => onNavigate('hub')}>Back</button></div>;

  const wreck = availableWrecks.find((w) => w.id === currentRun.wreckId)!;

  const canReturn = (fuel: number) => {
    return fuel >= Math.ceil(wreck.distance * FUEL_COST_PER_AU);
  };

  const onSalvage = (roomId: string) => {
    const result = salvageRoom(roomId);
    if (result.success) {
      setLog((l) => [`✅ Salvage success (loot collected)`].concat(l));
    } else {
      setLog((l) => [`⚠️ Salvage failed — took ${result.damage} damage`].concat(l));
    }

    // Check for crew death
    const state = useGameStore.getState();
    if (state.crew.hp <= 0) {
      onNavigate('gameover');
    }

    // If time ran out, auto-return
    if (state.currentRun && state.currentRun.timeRemaining <= 0) {
      setLog((l) => ['⏱️ Time expired — forced return'].concat(l));
      returnToStation();
      onNavigate('summary');
    }
  };

  const onReturn = () => {
    // Check fuel warning
    if (!canReturn(fuel)) {
      setLog((l) => ['⚠️ Not enough fuel to return!'].concat(l));
      return;
    }

    returnToStation();
    onNavigate('summary');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4 flex justify-between items-center">
        <div className="text-amber-500 font-bold">SALVAGE OP</div>
        <div className="text-zinc-400 text-xs">{wreck.name} • Dist: {wreck.distance} AU</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-zinc-800 border border-amber-600/20 p-4">
          <div className="flex justify-between mb-3">
            <div>⏱️ Time: {currentRun.timeRemaining}</div>
            <div>❤️ HP: {crew.hp}/{crew.maxHp}</div>
            <div>⛽ Fuel: {fuel}</div>
          </div>

          <div className="space-y-3">
            {wreck.rooms.map((room) => (
              <div key={room.id} className={`p-3 border ${room.looted ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-amber-100">{room.name}</div>
                    <div className="text-zinc-400 text-xs">Hazard: {room.hazardLevel}</div>
                  </div>
                  <div>
                    <button className="bg-amber-500 text-zinc-900 px-3 py-1 text-xs" onClick={() => onSalvage(room.id)} disabled={room.looted}>Salvage</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30 mr-2" onClick={() => onReturn()}>🏠 Return to Station</button>
            <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30" onClick={() => onNavigate('hub')}>Abort Run</button>
          </div>
        </div>

        <div className="bg-zinc-800 border border-amber-600/20 p-4">
          <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">LOG</div>
          <div className="text-sm space-y-2">
            {log.map((l, i) => (
              <div key={i} className="text-zinc-200">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
