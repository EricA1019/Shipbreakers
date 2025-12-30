import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export default function WreckSelectScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { availableWrecks, startRun, scanForWrecks, credits } = useGameStore((s) => ({ availableWrecks: s.availableWrecks, startRun: s.startRun, scanForWrecks: s.scanForWrecks, credits: s.credits }));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4 flex justify-between items-center">
        <div className="text-amber-500 font-bold">AVAILABLE SALVAGE</div>
        <div>
          <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30" onClick={() => { if (credits >= 50) scanForWrecks(); }}>🔍 Scan (50 CR)</button>
          <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30 ml-2" onClick={() => onNavigate('hub')}>← Back</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {availableWrecks.map((w) => (
          <div key={w.id} className={`bg-zinc-800 border border-amber-600/20 p-4 ${w.stripped ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-amber-100 font-bold">{w.name}</div>
                <div className="text-zinc-400 text-xs">Distance: {w.distance} AU • Rooms: {w.rooms.length}</div>
              </div>
              <div className="flex gap-2">
                <button className="bg-amber-500 text-zinc-900 px-3 py-1 text-xs" onClick={() => { startRun(w.id); onNavigate('travel'); }}>Select</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
