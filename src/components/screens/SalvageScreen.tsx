import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { FUEL_COST_PER_AU, SKILL_HAZARD_MAP, MISMATCH_PENALTY_THRESHOLD, RARITY_TIME_COST, XP_BASE_SUCCESS, XP_BASE_FAIL, XP_PER_HAZARD_LEVEL, XP_PER_TIER } from '../../game/constants';
import ItemCard from '../ui/ItemCard';
import InventoryViewer from '../ui/InventoryViewer';
import ShipGrid from '../game/ShipGrid';
import CyberPanel from '../ui/CyberPanel';
import { RadarDisplay, TerminalOutput, DataStream, HazardWarning } from '../ui/VisualEffects';
import { logDebug, logError, logInfo, logWarn, downloadLogs } from '../../utils/debug/logger';

// Helper: movement check on raw ship data (methods are lost after store serialization)
function canMoveOnGrid(ship: any, from: any, to: any) {
  const room = ship?.grid?.[from?.y]?.[from?.x];
  if (!room) return false;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let dir: 'north' | 'south' | 'east' | 'west' | null = null;
  if (dx === 1 && dy === 0) dir = 'east';
  if (dx === -1 && dy === 0) dir = 'west';
  if (dx === 0 && dy === 1) dir = 'south';
  if (dx === 0 && dy === -1) dir = 'north';
  if (!dir) return false;
  return room.connections?.includes(dir);
}

// Helper: list neighbors from raw grid data
function getConnectedRoomsFromGrid(ship: any, pos: any) {
  const base = ship?.grid?.[pos?.y]?.[pos?.x];
  if (!base) return [];
  const out: Array<{ room: any; dir: string }> = [];
  for (const dir of base.connections ?? []) {
    let nx = pos.x;
    let ny = pos.y;
    if (dir === 'north') ny -= 1;
    if (dir === 'south') ny += 1;
    if (dir === 'east') nx += 1;
    if (dir === 'west') nx -= 1;
    const r = ship?.grid?.[ny]?.[nx];
    if (r) out.push({ room: r, dir });
  }
  return out;
}
// import { useSalvageNotifications } from '../../hooks/useSalvageNotifications';

export default function SalvageScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { currentRun, availableWrecks, crewRoster, selectedCrewId, fuel, salvageItem, returnToStation } = useGameStore((s) => ({ currentRun: s.currentRun, availableWrecks: s.availableWrecks, crewRoster: s.crewRoster, selectedCrewId: s.selectedCrewId, fuel: s.fuel, salvageItem: s.salvageItem, returnToStation: s.returnToStation }));
  
  // Get the selected crew member
  const crew = crewRoster.find((c) => c.id === selectedCrewId) ?? crewRoster[0];
  const [log, setLog] = useState<string[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<any | null>(null);

  // Setup salvage item notifications
  // useSalvageNotifications(); // Temporarily disabled for debugging

  if (!currentRun) return <div>No active run. <button onClick={() => onNavigate('hub')}>Back</button></div>;

  const wreck = availableWrecks.find((w) => w.id === currentRun.wreckId);
  if (!wreck || !wreck.rooms) {
    return <div>Error: Wreck not found. <button onClick={() => onNavigate('hub')}>Back</button></div>;
  }
  
  // Display name from wreck (WASM populated) or ship, or fallback
  const displayName = wreck.name !== 'Unknown Vessel' ? wreck.name : ((wreck as any).ship?.name || 'Unknown Vessel');
  const shipObj: any = (wreck as any).ship;
  
  // Memoize to prevent re-render loops
  const allowedRoomIds = useMemo(() => new Set(wreck.rooms.map((r) => r.id)), [wreck.rooms.length]);
  
  const currentRoom = currentRoomId ? wreck.rooms.find((r) => r.id === currentRoomId) : null;
  
  // Debug: log current state
  useEffect(() => {
    logDebug('[SalvageScreen] State update', { currentRoomId, currentRoomFound: !!currentRoom });
    if (currentRoomId && !currentRoom) {
      logWarn('[SalvageScreen] Room ID set but room not found in wreck.rooms', { roomId: currentRoomId, available: wreck.rooms.map((r) => r.id) });
    }
  }, [currentRoomId, currentRoom]);

  // Initialize position to entry point when ship data is available, but ensure it's a valid mapped room
  useEffect(() => {
    if (!shipObj) {
      console.warn('[SalvageScreen] No ship object available');
      return;
    }
    
    try {
      // If the entry position is not mapped to a real room, fall back to the first mapped room
      const entryRoom = shipObj.grid.flat().find((r: any) => r.position.x === shipObj.entryPosition.x && r.position.y === shipObj.entryPosition.y);
      const entryIsValid = entryRoom && allowedRoomIds.has(entryRoom.id);
      if (entryIsValid) {
        logInfo('[SalvageScreen] Setting entry position', { entry: shipObj.entryPosition, entryRoomId: entryRoom?.id });
        setCurrentPosition(shipObj.entryPosition);
      } else {
        const firstMapped = shipObj.grid.flat().find((r: any) => allowedRoomIds.has(r.id));
        if (firstMapped) {
          logWarn('[SalvageScreen] Entry invalid, using first mapped room', { entry: shipObj.entryPosition, fallback: firstMapped.position });
          setCurrentPosition(firstMapped.position);
        } else {
          logError('[SalvageScreen] No valid rooms found', { entry: shipObj.entryPosition });
        }
      }
    } catch (error) {
      logError('[SalvageScreen] Error in position init', error);
    }
  }, [wreck.id, wreck.rooms.length]);

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
          <div className="text-zinc-400 text-xs">{displayName} • Dist: {wreck.distance} AU</div>
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
          
          {/* Crew stats summary */}
          <div className="bg-zinc-900 border border-amber-600/20 p-2 mb-3 rounded">
            <div className="text-amber-400 text-xs font-bold mb-1">👤 {crew.name}'s Skills</div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>🔧 Tech: <span className="text-amber-100 font-bold">{crew.skills.technical}</span></div>
              <div>⚔️ Combat: <span className="text-amber-100 font-bold">{crew.skills.combat}</span></div>
              <div>🔨 Salvage: <span className="text-amber-100 font-bold">{crew.skills.salvage}</span></div>
              <div>🚀 Pilot: <span className="text-amber-100 font-bold">{crew.skills.piloting}</span></div>
            </div>
            <div className="text-zinc-400 text-xs mt-1">
              Highest skill will be used when needed (with {Math.max(crew.skills.technical, crew.skills.combat, crew.skills.salvage, crew.skills.piloting)} max)
            </div>
          </div>

          {!currentRoom ? (
            // If ship grid exists, show spatial grid; otherwise fall back to list view
            (wreck as any).ship ? (
              <div className="">
                <div className="mb-2 p-2 bg-zinc-900 border border-amber-600/20 rounded">
                  <div className="text-amber-400 text-xs font-semibold mb-1">🗺️ SHIP GRID NAVIGATION</div>
                  <div className="text-zinc-400 text-xs">Click rooms to move (only adjacent connected rooms are accessible)</div>
                  <div className="text-zinc-500 text-[10px] mt-1">Yellow doors = connected • Orange border = current location • Entry marked ENT</div>
                </div>
                <div>
                  {/* ShipGrid component displays the ship layout */}
                  <ShipGrid
                    ship={(wreck as any).ship}
                    currentRoom={currentPosition}
                    allowedRoomIds={allowedRoomIds}
                    onRoomClick={(room) => {
                      try {
                        logDebug('[SalvageScreen] Room click', { roomId: room.id, roomPos: room.position, currentPosition });

                        if (!allowedRoomIds.has(room.id)) {
                          logWarn('[SalvageScreen] Clicked sealed room', { roomId: room.id });
                          setLog((l) => ['🔒 Sealed compartment — cannot enter'].concat(l));
                          return;
                        }

                        if (currentPosition && currentPosition.x === room.position.x && currentPosition.y === room.position.y) {
                          logInfo('[SalvageScreen] Entering current room', { roomId: room.id });
                          setCurrentRoomId(room.id);
                          setLog((l) => [`🚪 Entered ${room.name}`].concat(l));
                          return;
                        }

                        if (!currentPosition) {
                          logInfo('[SalvageScreen] No position set, moving directly', { roomId: room.id });
                          setCurrentPosition(room.position);
                          setCurrentRoomId(room.id);
                          setLog((l) => [`🚪 Entered ${room.name}`].concat(l));
                          return;
                        }

                        const canMove = canMoveOnGrid(shipObj, currentPosition, room.position);
                        logDebug('[SalvageScreen] Movement check', { from: currentPosition, to: room.position, canMove });

                        if (canMove) {
                          setCurrentPosition(room.position);
                          setCurrentRoomId(room.id);
                          setLog((l) => [`🚪 Moved to ${room.name}`].concat(l));
                        } else {
                          setLog((l) => ['🚫 Room not accessible from your current position'].concat(l));
                        }
                      } catch (error) {
                        logError('[SalvageScreen] Error handling room click', error);
                        setLog((l) => ['❌ Error handling room click'].concat(l));
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {wreck.rooms.map((room, index) => {
                  const skillKey = SKILL_HAZARD_MAP[room.hazardType as any] as keyof typeof crew.skills;
                  const matchingSkillValue = (crew.skills as any)[skillKey];
                  const highestSkillValue = Math.max(crew.skills.technical, crew.skills.combat, crew.skills.salvage, crew.skills.piloting);
                  const activeSkillValue = Math.max(matchingSkillValue, highestSkillValue);
                  
                  // Determine which skill is actually being used
                  let activeSkillName = skillKey;
                  if (activeSkillValue === highestSkillValue && highestSkillValue > matchingSkillValue) {
                    // Find which skill has the highest value
                    if (highestSkillValue === crew.skills.technical) activeSkillName = 'technical';
                    else if (highestSkillValue === crew.skills.combat) activeSkillName = 'combat';
                    else if (highestSkillValue === crew.skills.salvage) activeSkillName = 'salvage';
                    else if (highestSkillValue === crew.skills.piloting) activeSkillName = 'piloting';
                  }
                  
                  const isMismatch = wreck.tier >= MISMATCH_PENALTY_THRESHOLD && matchingSkillValue < 3;
                  const hasSpecializationBonus = matchingSkillValue === highestSkillValue && matchingSkillValue >= 3;
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
                          <div className="text-zinc-300 text-xs">
                            Using: {activeSkillName.toUpperCase()} {activeSkillValue}
                            {hasSpecializationBonus && <span className="text-green-400 ml-1">✓ Specialized</span>}
                            {activeSkillName !== skillKey && <span className="text-cyan-400 ml-1">(Adapted from best skill)</span>}
                            {isMismatch && <span className="text-orange-400 ml-1">⚠ Penalty</span>}
                          </div>
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
            )
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

              {/* Adjacent rooms for movement without returning to grid */}
              {shipObj && currentPosition && (
                <div className="mb-3 bg-zinc-900 border border-amber-600/20 rounded p-2">
                  <div className="text-amber-400 text-xs font-semibold mb-1">Adjacent Rooms</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {getConnectedRoomsFromGrid(shipObj, currentPosition)
                      .filter(({ room }: any) => allowedRoomIds.has(room.id))
                      .map(({ room, dir }: any) => (
                        <button
                          key={room.id}
                          className="px-2 py-1 bg-zinc-800 border border-amber-600/30 rounded hover:border-amber-400"
                          onClick={() => {
                            logInfo('[SalvageScreen] Adjacent move', { from: currentPosition, to: room.position, dir, roomId: room.id });
                            setCurrentPosition(room.position);
                            setCurrentRoomId(room.id);
                            setLog((l) => [`🚪 Moved ${dir.toUpperCase()} to ${room.name}`].concat(l));
                          }}
                        >
                          {room.name} <span className="text-amber-400">({dir})</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

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
        <CyberPanel title="SENSORS & LOG">
          <div className="grid gap-4">
            <RadarDisplay contacts={3} size={192} />

            {currentRun.timeRemaining <= 5 && (
              <HazardWarning title="OXYGEN LOW" level="critical" />
            )}

            <div className="flex justify-between items-center mb-2">
              <div className="text-amber-500 text-xs font-semibold tracking-wider">EVENT LOG</div>
              <button className="bg-zinc-700 px-2 py-1 text-[11px] border border-amber-600/30 hover:bg-zinc-600" onClick={() => downloadLogs()}>Export Log</button>
            </div>

            <TerminalOutput
              lines={log.map((l) => {
                if (l.startsWith('✅') || l.includes('SUCCESS')) return { text: l, type: 'success' };
                if (l.startsWith('⚠️') || l.includes('Warning') || l.startsWith('🔒')) return { text: l, type: 'warning' };
                if (l.startsWith('❌') || l.includes('ERROR') || l.includes('FAIL')) return { text: l, type: 'error' };
                if (l.startsWith('🚪') || l.includes('Moved') || l.includes('Entered')) return { text: l, type: 'info' };
                if (l.includes('💰') || l.includes('CR')) return { text: l, type: 'info' };
                return { text: l };
              })}
            />

            <DataStream lines={12} />
          </div>
        </CyberPanel>
      </div>

      <InventoryViewer isOpen={showInventory} onClose={() => setShowInventory(false)} />
    </div>
  );
}
