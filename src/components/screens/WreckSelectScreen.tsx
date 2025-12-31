
import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import WreckDetailsPanel from '../ui/WreckDetailsPanel';
import DangerRatingComponent from '../ui/DangerRatingComponent';
import DifficultyIndicator from '../ui/DifficultyIndicator';

export default function WreckSelectScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const [selectedWreckId, setSelectedWreckId] = useState<string | null>(null);
  const { availableWrecks, startRun, scanForWrecks, credits } = useGameStore((s) => ({ availableWrecks: s.availableWrecks, startRun: s.startRun, scanForWrecks: s.scanForWrecks, credits: s.credits }));

  const selectedWreck = selectedWreckId ? availableWrecks.find((w) => w.id === selectedWreckId) : null;

  // Default-select the first wreck when the list loads so the launch button is visible immediately
  useEffect(() => {
    if (!selectedWreckId && availableWrecks.length > 0) {
      setSelectedWreckId(availableWrecks[0].id);
    }
    // If the currently selected wreck disappears (e.g., rescan), pick the first one
    if (selectedWreckId && !availableWrecks.find((w) => w.id === selectedWreckId) && availableWrecks.length > 0) {
      setSelectedWreckId(availableWrecks[0].id);
    }
  }, [availableWrecks, selectedWreckId]);

  // Keyboard shortcuts for WreckSelectScreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      // Number keys 1-9 for wreck selection
      if (e.key >= '1' && e.key <= '9') {
        const wreckIndex = parseInt(e.key) - 1;
        if (wreckIndex < availableWrecks.length) {
          e.preventDefault();
          setSelectedWreckId(availableWrecks[wreckIndex].id);
        }
      }

      // Enter key to launch selected wreck
      if (e.key === 'Enter' && selectedWreckId) {
        e.preventDefault();
        const selected = availableWrecks.find((w) => w.id === selectedWreckId);
        if (selected) {
          startRun(selected.id);
          onNavigate('travel');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWreckId, availableWrecks]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4 flex justify-between items-center">
        <div className="text-amber-500 font-bold">AVAILABLE SALVAGE</div>
        <div>
          <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30" onClick={() => { if (credits >= 50) scanForWrecks(); }}>🔍 Scan (50 CR)</button>
          <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30 ml-2" onClick={() => onNavigate('hub')}>← Back</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Wreck List */}
        <div className="col-span-2 space-y-3">
          {availableWrecks.map((w, index) => (
            <div
              key={w.id}
              onClick={() => setSelectedWreckId(w.id)}
              className={`cursor-pointer p-3 border transition-all ${
                selectedWreckId === w.id
                  ? 'bg-amber-600/10 border-amber-500'
                  : w.stripped
                    ? 'bg-zinc-800 border-amber-600/10 opacity-50'
                    : 'bg-zinc-800 border-amber-600/20 hover:border-amber-500/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-amber-100 font-bold flex items-center gap-2">
                    {w.name}
                    {index < 9 && <span className="text-amber-600 text-xs bg-zinc-900 px-2 py-0.5 rounded">[{index + 1}]</span>}
                  </div>
                  <div className="text-zinc-400 text-xs">
                    {w.type.toUpperCase()} • {w.distance} AU • {w.rooms.length} rooms • Tier {w.tier}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-amber-500 font-bold">
                    {w.rooms.reduce((sum, room) => sum + room.loot.reduce((s, item) => s + (item.value ?? 0), 0), 0)} CR
                  </div>
                  {w.stripped && <div className="text-red-400 text-[10px] mt-1">STRIPPED</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Details Panel */}
        <div className="col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
          {selectedWreck ? (
            <>
              <DangerRatingComponent wreck={selectedWreck} />
              <DifficultyIndicator wreck={selectedWreck} />
              <WreckDetailsPanel wreck={selectedWreck} />
              <button
                onClick={() => {
                  startRun(selectedWreck.id);
                  onNavigate('travel');
                }}
                className="w-full bg-amber-500 text-zinc-900 px-4 py-2 font-bold hover:bg-amber-400 relative group"
              >
                🚀 Launch Salvage Operation
                <span className="hidden group-hover:inline absolute -top-6 left-4 bg-amber-800 px-1 py-0.5 rounded text-[10px] text-amber-100 whitespace-nowrap">(Enter)</span>
              </button>
            </>
          ) : (
            <div className="bg-zinc-800 border border-amber-600/20 p-4 text-zinc-400 text-xs text-center">
              Select a wreck to view detailed analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
