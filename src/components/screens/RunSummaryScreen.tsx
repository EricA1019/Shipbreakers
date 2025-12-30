import React from 'react';
import { useGameStore } from '../../stores/gameStore';

export default function RunSummaryScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { currentRun, sellAllLoot } = useGameStore((s) => ({ currentRun: s.currentRun, sellAllLoot: s.sellAllLoot }));
  if (!currentRun) return <div>No run to summarize. <button onClick={() => onNavigate('hub')}>Back</button></div>;

  const total = currentRun.collectedLoot.reduce((s, l) => s + l.value, 0);

  const onSell = () => {
    sellAllLoot();
    onNavigate('hub');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-800 border border-amber-600/20 p-6">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">MISSION COMPLETE</div>
        <div className="text-amber-100 font-bold text-lg mb-2">Loot Value: {total} CR</div>
        <div className="flex gap-2">
          <button className="bg-amber-500 text-zinc-900 px-3 py-1" onClick={onSell}>💰 Sell All and Return</button>
          <button className="bg-zinc-700 text-xs px-3 py-1" onClick={() => onNavigate('salvage')}>↩️ Back to Wreck</button>
        </div>
      </div>
    </div>
  );
}
