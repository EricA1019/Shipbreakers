
import { useGameStore } from '../../stores/gameStore';

export default function RunSummaryScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { currentRun } = useGameStore((s) => ({ currentRun: s.currentRun }));
  if (!currentRun) {
    return (
      <div className="max-w-4xl mx-auto bg-zinc-800 border border-amber-600/20 p-6">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">ERROR</div>
        <div className="text-amber-100 mb-4">No run to summarize.</div>
        <button className="bg-amber-500 text-zinc-900 px-3 py-1" onClick={() => onNavigate('hub')}>Return to Hub</button>
      </div>
    );
  }

  const total = currentRun.collectedLoot.reduce((s, l) => s + l.value, 0);
  const lootCount = currentRun.collectedLoot.length;

  const onReturn = () => {
    // Just return to hub without selling
    onNavigate('hub');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-800 border border-amber-600/20 p-6">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">MISSION COMPLETE</div>
        <div className="text-amber-100 font-bold text-lg mb-2">Loot Value: {total} CR</div>
        <div className="text-zinc-400 text-sm mb-4">Items Collected: {lootCount}</div>
        
        {/* Loot List */}
        {lootCount > 0 && (
          <div className="bg-zinc-900 border border-zinc-700 p-4 mb-4 max-h-64 overflow-y-auto">
            <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">COLLECTED ITEMS</div>
            <div className="grid grid-cols-2 gap-2">
              {currentRun.collectedLoot.map((item) => (
                <div key={item.id} className="bg-zinc-800 border border-zinc-600 p-2">
                  <div className="text-amber-100 text-sm font-semibold">{item.name}</div>
                  <div className="text-zinc-400 text-xs">{item.category}</div>
                  <div className="text-green-400 text-sm">{item.value} CR</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <button className="bg-amber-500 text-zinc-900 px-4 py-2 font-semibold" onClick={onReturn}>
            🏠 Return to Hub
          </button>
          <button className="bg-zinc-700 text-xs px-3 py-1" onClick={() => onNavigate('salvage')}>↩️ Back to Wreck</button>
        </div>
      </div>
    </div>
  );
}
