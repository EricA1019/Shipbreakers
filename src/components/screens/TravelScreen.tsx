import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';

export default function TravelScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { currentRun, travelToWreck, availableWrecks } = useGameStore((s) => ({ currentRun: s.currentRun, travelToWreck: s.travelToWreck, availableWrecks: s.availableWrecks }));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!currentRun) return;
    // Simulate quick travel
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          travelToWreck(currentRun.wreckId);
          onNavigate('salvage');
        }
        return Math.min(100, p + 25);
      });
    }, 200);

    return () => clearInterval(t);
  }, [currentRun]);

  if (!currentRun) return <div>No active run. <button onClick={() => onNavigate('hub')}>Back</button></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-800 border border-amber-600/20 p-6">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">TRAVEL</div>
        <div className="text-amber-100 font-bold mb-2">🚀 Traveling to wreck...</div>
        <div className="w-full bg-zinc-700 h-4 overflow-hidden rounded mb-2">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-zinc-400 text-xs">{progress}%</div>
      </div>
    </div>
  );
}
