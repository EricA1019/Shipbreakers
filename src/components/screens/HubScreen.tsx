import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export default function HubScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { credits, fuel, crew, initializeGame } = useGameStore((s) => ({ credits: s.credits, fuel: s.fuel, crew: s.crew, initializeGame: s.initializeGame }));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-amber-500 font-bold text-xl tracking-wider">[SHIPBREAKERS]</div>
            <div className="text-amber-600/50 text-sm">CINDER STATION // HUD</div>
          </div>
          <div className="flex gap-6 text-sm">
            <div>💰 <span className="text-amber-100">{credits} CR</span></div>
            <div>⛽ <span className="text-orange-100">{fuel}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800 border border-amber-600/20 p-4"> 
          <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">CREW</div>
          <div className="text-amber-100 font-bold">{crew.name}</div>
          <div className="text-zinc-400 text-xs">❤️ {crew.hp}/{crew.maxHp} • ⭐ {crew.skill}/5</div>
        </div>

        <div className="col-span-2 bg-zinc-800 border border-amber-600/20 p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-amber-500 text-xs font-semibold tracking-wider mb-1">GOAL</div>
              <div className="text-amber-100 font-bold">10,000 CR (Prototype)</div>
            </div>
            <div className="flex gap-2">
              <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30" onClick={() => onNavigate('select')}>🚀 Select Wreck</button>
              <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30" onClick={() => { initializeGame(); window.location.reload(); }}>🔄 Reset</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button className="bg-amber-500 text-zinc-900 px-4 py-2 rounded" onClick={() => onNavigate('sell')}>Sell Loot</button>
      </div>
    </div>
  );
}
