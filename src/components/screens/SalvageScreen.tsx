import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FUEL_COST_PER_AU, SKILL_HAZARD_MAP, MISMATCH_PENALTY_THRESHOLD, RARITY_TIME_COST, XP_BASE_SUCCESS, XP_BASE_FAIL, XP_PER_HAZARD_LEVEL, XP_PER_TIER } from '../../game/constants';
import ItemCard from '../ui/ItemCard';
import InventoryViewer from '../ui/InventoryViewer';
// import { useSalvageNotifications } from '../../hooks/useSalvageNotifications';

export default function SalvageScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { currentRun, availableWrecks, crew, fuel, salvageItem, returnToStation } = useGameStore((s) => ({ currentRun: s.currentRun, availableWrecks: s.availableWrecks, crew: s.crew, fuel: s.fuel, salvageItem: s.salvageItem, returnToStation: s.returnToStation }));
  const [log, setLog] = useState<string[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);

  // Setup salvage item notifications
  // useSalvageNotifications(); // Temporarily disabled for debugging

  if (!currentRun) return <div>No active run. <button onClick={() => onNavigate('hub')}>Back</button></div>;

  const wreck = availableWrecks.find((w) => w.id === currentRun.wreckId);
  if (!wreck || !wreck.rooms) {
    return <div>Error: Wreck not found. <button onClick={() => onNavigate('hub')}>Back</button></div>;
  }
  
  const currentRoom = currentRoomId ? wreck.rooms.find((r) => r.id === currentRoomId) : null;

  const calculateXpRewards = (hazardLevel: number, tier: number) => {
    const xpSuccess = XP_BASE_SUCCESS + (hazardLevel * XP_PER_HAZARD_LEVEL) + (tier * XP_PER_TIER);
    const xpFail = XP_BASE_FAIL + Math.floor((hazardLevel * XP_PER_HAZARD_LEVEL + tier * XP_PER_TIER) / 2);
    return { xpSuccess, xpFail };
  };

  const canReturn = (fuel: number) => {
    return fuel >= Math.ceil(wreck.distance * FUEL_COST_PER_AU);
  };

  const onEnterRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
    const room = wreck.rooms.find((r) => r.id === roomId);
    if (room) {
      setLog((l) => [`🚪 Entered ${room.name}`].concat(l));
    }
  };

  const onLeaveRoom = () => {
    if (currentRoom) {
      setLog((l) => [`🚪 Left ${currentRoom.name}`].concat(l));
    }
    setCurrentRoomId(null);
  };

  const onSalvageItem = (itemId: string) => {
    if (!currentRoomId) return;
    
    const result = salvageItem(currentRoomId, itemId);
    const item = currentRoom?.loot.find((l) => l.id === itemId);
    
    if (result.success) {
      setLog((l) => [`✅ Salvaged ${item?.name} (${result.timeCost} time units)`].concat(l));
    } else {
      setLog((l) => [`⚠️ Salvage failed — took ${result.damage} damage (${result.timeCost} time wasted)`].concat(l));
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

  // Keyboard shortcuts for SalvageScreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      // Number keys 1-6 for room selection (only active when not in a room)
      if (!currentRoom && e.key >= '1' && e.key <= '6') {
        const roomIndex = parseInt(e.key) - 1;
        if (roomIndex < wreck.rooms.length) {
          e.preventDefault();
          onEnterRoom(wreck.rooms[roomIndex].id);
        }
      }

      // R key to return to station
      if ((e.key === 'r' || e.key === 'R') && !e.shiftKey) {
        e.preventDefault();
        onReturn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRoomId, wreck]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4 flex justify-between items-center">
        <div className="text-amber-500 font-bold">SALVAGE OP</div>
        <div className="flex items-center gap-3">
          <div className="text-zinc-400 text-xs">{wreck.name} • Dist: {wreck.distance} AU</div>
          <button className="bg-amber-600 text-zinc-900 px-2 py-1 text-xs font-bold hover:bg-amber-500" onClick={() => setShowInventory(true)}>📦 Inventory</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-zinc-800 border border-amber-600/20 p-4">
          <div className="flex justify-between mb-3">
            <div>⏱️ Time: {currentRun.timeRemaining}</div>
            <div>❤️ HP: {crew.hp}/{crew.maxHp}</div>
            <div>⛽ Fuel: {fuel}</div>
          </div>

          {!currentRoom ? (
            // Room list view
            <div className="space-y-3">
              {wreck.rooms.map((room, index) => {
                const skillKey = SKILL_HAZARD_MAP[room.hazardType as any] as keyof typeof crew.skills;
                const playerSkill = (crew.skills as any)[skillKey];
                const isMismatch = wreck.tier >= MISMATCH_PENALTY_THRESHOLD && playerSkill < 3;
                const { xpSuccess, xpFail } = calculateXpRewards(room.hazardLevel, wreck.tier);
                return (
                  <div key={room.id} className={`p-3 border ${room.looted ? 'opacity-50 border-zinc-700' : 'border-amber-600/20'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-bold text-amber-100 flex items-center gap-2">
                          {room.name}
                          {!room.looted && index < 6 && <span className="text-amber-600 text-xs bg-zinc-900 px-2 py-0.5 rounded">[{index + 1}]</span>}
                        </div>
                        <div className="text-zinc-400 text-xs">Hazard: {room.hazardType.toUpperCase()} Lv.{room.hazardLevel}</div>
                        <div className="text-zinc-300 text-xs">{String(skillKey).toUpperCase()}: {playerSkill} {isMismatch ? <span className="text-red-400">• MISMATCH (penalty)</span> : <span className="text-green-400">• Match</span>}</div>
                        <div className="text-zinc-400 text-xs mt-1">Items: {room.loot.length}</div>
                        <div className="text-emerald-400 text-xs mt-1" title={`Success: +${xpSuccess} XP | Fail: +${xpFail} XP`}>💡 {xpSuccess} / {xpFail} XP</div>
                      </div>
                      <div>
                        <button className="bg-amber-500 text-zinc-900 px-3 py-1 text-xs font-semibold" onClick={() => onEnterRoom(room.id)} disabled={room.looted}>Enter Room</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Item selection view
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-amber-600/30">
                <div>
                  <div className="font-bold text-amber-100 text-lg">{currentRoom.name}</div>
                  <div className="text-zinc-400 text-xs">Hazard: {currentRoom.hazardType.toUpperCase()} Lv.{currentRoom.hazardLevel}</div>
                  <div className="text-emerald-400 text-xs mt-1">💡 +{calculateXpRewards(currentRoom.hazardLevel, wreck.tier).xpSuccess} XP per success / +{calculateXpRewards(currentRoom.hazardLevel, wreck.tier).xpFail} XP per fail</div>
                </div>
                <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30" onClick={onLeaveRoom}>⬅️ Leave Room</button>
              </div>

              {currentRoom.loot.length === 0 ? (
                <div className="text-center text-zinc-400 py-8">Room cleared — no items remaining</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {currentRoom.loot.map((item) => {
                    const { xpSuccess, xpFail } = calculateXpRewards(currentRoom.hazardLevel, wreck.tier);
                    return (
                    <div key={item.id} className="flex flex-col gap-2">
                      <ItemCard item={item} onSell={() => {}} />
                      <div className="bg-zinc-900 border border-amber-600/30 rounded p-2 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-amber-500 font-semibold">⏱️ {RARITY_TIME_COST[item.rarity]} time</span>
                          <span className="text-emerald-400 font-semibold">💡 +{xpSuccess} / +{xpFail}</span>
                        </div>
                        <button 
                          className="w-full bg-amber-500 text-zinc-900 py-2 text-sm font-bold hover:bg-amber-400 transition-colors"
                          onClick={() => onSalvageItem(item.id)}
                          title={`Success: +${xpSuccess} XP to ${String(SKILL_HAZARD_MAP[currentRoom.hazardType as any]).toUpperCase()} | Fail: +${xpFail} XP`}
                        >
                          SALVAGE
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-amber-600/30">
            <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30 mr-2 relative group hover:bg-zinc-600" onClick={() => onReturn()}>🏠 Return to Station<span className="hidden group-hover:inline absolute -top-6 left-0 bg-amber-800 px-1 py-0.5 rounded text-[10px] text-amber-100 whitespace-nowrap">(R)</span></button>
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

      <InventoryViewer isOpen={showInventory} onClose={() => setShowInventory(false)} />
    </div>
  );
}
