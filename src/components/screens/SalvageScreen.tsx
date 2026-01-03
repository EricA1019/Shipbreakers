import { useState, useMemo } from "react";
import { useGameStore } from "../../stores/gameStore";
import type { AutoSalvageRules, AutoSalvageResult } from "../../stores/gameStore";
import { FUEL_COST_PER_AU } from "../../game/constants";
import ShipGrid from "../game/ShipGrid";
import CyberPanel from "../ui/CyberPanel";
import CargoSwapModal from "../ui/CargoSwapModal";
import AutoSalvageMenu from "../game/AutoSalvageMenu";
import type { ScreenProps, CrewMember } from "../../types";

// Helper: Get crew availability status
function getCrewStatus(crew: CrewMember, settings: any) {
  const hpPercent = (crew.hp / crew.maxHp) * 100;
  if (hpPercent < settings.minCrewHpPercent) return { available: false, reason: `Low HP (${Math.floor(hpPercent)}%)` };
  if (crew.stamina < settings.minCrewStamina) return { available: false, reason: `Low Stamina (${crew.stamina})` };
  if (crew.sanity < settings.minCrewSanity) return { available: false, reason: `Low Sanity (${crew.sanity})` };
  if (crew.inventory.length > 0) return { available: false, reason: "Inventory Full" };
  return { available: true };
}

export default function SalvageScreen({ onNavigate }: ScreenProps) {
  const {
    currentRun,
    availableWrecks,
    crewRoster,
    fuel,
    cargoCapacity,
    returnToStation,
    cargoSwapPending,
    handleCargoSwap,
    cancelCargoSwap,
    cutIntoRoom,
    runAutoSalvage,
    emergencyEvacuate,
    transferItemToShip,
    transferAllItemsToShip,
    settings,
  } = useGameStore((s) => ({
    currentRun: s.currentRun,
    availableWrecks: s.availableWrecks,
    crewRoster: s.crewRoster,
    fuel: s.fuel,
    cargoCapacity: s.playerShip?.cargoCapacity || 20,
    returnToStation: s.returnToStation,
    cargoSwapPending: s.cargoSwapPending,
    handleCargoSwap: s.handleCargoSwap,
    cancelCargoSwap: s.cancelCargoSwap,
    cutIntoRoom: s.cutIntoRoom,
    runAutoSalvage: s.runAutoSalvage,
    emergencyEvacuate: s.emergencyEvacuate,
    transferItemToShip: s.transferItemToShip,
    transferAllItemsToShip: s.transferAllItemsToShip,
    settings: s.settings,
  }));

  const [showCrewPanel, setShowCrewPanel] = useState(true);
  const [sealedRoomToCut, setSealedRoomToCut] = useState<string | null>(null);
  const [sealedUpdateCounter, setSealedUpdateCounter] = useState(0);
  const [showAutoSalvageMenu, setShowAutoSalvageMenu] = useState(false);
  const [isAutoSalvageRunning, setIsAutoSalvageRunning] = useState(false);
  const [autoSalvageResult, setAutoSalvageResult] = useState<AutoSalvageResult | null>(null);
  const [showEmergencyEvacModal, setShowEmergencyEvacModal] = useState(false);

  if (!currentRun)
    return (
      <div className="max-w-4xl mx-auto p-4">
        No active run. <button onClick={() => onNavigate("hub")}>Back</button>
      </div>
    );

  const wreck = availableWrecks.find((w) => w.id === currentRun.wreckId);
  if (!wreck || !wreck.rooms) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        Error: Wreck not found.{" "}
        <button onClick={() => onNavigate("hub")}>Back</button>
      </div>
    );
  }

  const displayName =
    wreck.name !== "Unknown Vessel"
      ? wreck.name
      : (wreck as any).ship?.name || "Unknown Vessel";
  const shipObj: any = (wreck as any).ship;

  // Build allowed room IDs (unsealed rooms only)
  const allowedRoomIds = useMemo((): Set<string> => {
    if (!shipObj?.grid)
      return new Set<string>(wreck.rooms.filter((r) => !r.sealed).map((r) => r.id));

    if (shipObj?.layout?.rooms?.length) {
      const ids: string[] = [];
      for (const r of shipObj.layout.rooms as Array<{ x: number; y: number }>) {
        const cell = shipObj.grid?.[r.y]?.[r.x];
        if (cell && !cell.sealed && typeof cell.id === "string") ids.push(cell.id);
      }
      return new Set<string>(ids);
    }

    const gridRooms = shipObj.grid.flat();
    return new Set<string>(
      gridRooms.filter((r: any) => !r.sealed).map((r: any) => r.id as string),
    );
  }, [shipObj?.grid, sealedUpdateCounter]);

  const canReturn = fuel >= Math.ceil(wreck.distance * FUEL_COST_PER_AU);

  // Calculate total value at risk for emergency evac modal
  const totalValueAtRisk = useMemo(() => {
    let total = 0;
    // Crew inventories
    crewRoster.forEach(crew => {
      crew.inventory.forEach(item => {
        total += item.value || 0;
      });
    });
    // Ship cargo
    if (currentRun) {
      currentRun.collectedLoot.forEach(item => {
        total += item.value || 0;
      });
    }
    return total;
  }, [crewRoster, currentRun]);

  const onReturn = () => {
    if (!canReturn) {
      alert("⚠️ Not enough fuel to return!");
      return;
    }
    returnToStation();
    onNavigate("summary");
  };

  const onCutIntoRoom = (roomId: string) => {
    const result = cutIntoRoom(roomId);
    if (result.success) {
      setSealedUpdateCounter((c) => c + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <CyberPanel className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-amber-500 font-bold text-lg">SALVAGE OPERATION</div>
            <div className={`text-xs px-2 py-1 rounded border uppercase tracking-wider font-mono ${
              wreck.type === 'military' ? 'bg-red-900/20 border-red-600/40 text-red-400' :
              wreck.type === 'science' ? 'bg-blue-900/20 border-blue-600/40 text-blue-400' :
              wreck.type === 'industrial' ? 'bg-orange-900/20 border-orange-600/40 text-orange-400' :
              'bg-zinc-800/40 border-zinc-600/40 text-zinc-400'
            }`}>
              {wreck.type} • T{wreck.tier}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-zinc-400 text-sm">
              {displayName} • {wreck.distance} AU
            </div>
            <div className="flex gap-2 text-sm">
              <span>⏱️ {currentRun.timeRemaining}</span>
              <span>⛽ {fuel}</span>
              <span>📦 {currentRun.collectedLoot.length}/{cargoCapacity}</span>
            </div>
          </div>
        </div>
      </CyberPanel>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          className="bg-amber-600 hover:bg-amber-500 text-zinc-900 font-bold px-4 py-2 rounded"
          onClick={() => setShowAutoSalvageMenu(true)}
          disabled={isAutoSalvageRunning}
        >
          🤖 Auto-Salvage
        </button>
        <button
          className="bg-green-700 hover:bg-green-600 text-white font-bold px-4 py-2 rounded"
          onClick={onReturn}
          disabled={!canReturn || isAutoSalvageRunning}
        >
          ✓ Return to Station
        </button>
        <button
          className="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded ml-auto"
          onClick={() => setShowEmergencyEvacModal(true)}
          disabled={isAutoSalvageRunning}
        >
          🚨 Emergency Evacuate
        </button>
        <button
          className={`px-4 py-2 rounded font-bold ${showCrewPanel ? 'bg-zinc-700 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}
          onClick={() => setShowCrewPanel(!showCrewPanel)}
        >
          👥 Crew {showCrewPanel ? '▼' : '▶'}
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4">
        {/* Ship Grid */}
        <div className={showCrewPanel ? "col-span-2" : "col-span-3"}>
          <CyberPanel>
            <div className="text-amber-400 font-bold mb-3 border-b border-amber-600/30 pb-2">
              SHIP LAYOUT
            </div>
            {shipObj?.grid ? (
              <ShipGrid
                ship={shipObj}
                crewRoster={crewRoster}
                locationFilter="wreck"
                allowedRoomIds={allowedRoomIds}
                onRoomClick={(room) => {
                  if (!allowedRoomIds.has(room.id) && room.sealed) {
                    setSealedRoomToCut(room.id);
                  }
                }}
              />
            ) : (
              <div className="text-zinc-500 text-center py-8">
                No ship layout available
              </div>
            )}
          </CyberPanel>

          {/* Ship Cargo Summary */}
          <CyberPanel className="mt-4">
            <div className="text-amber-400 font-bold mb-2 border-b border-amber-600/30 pb-2">
              SECURED CARGO ({currentRun.collectedLoot.length}/{cargoCapacity})
            </div>
            {currentRun.collectedLoot.length === 0 ? (
              <div className="text-zinc-500 text-sm">No items secured yet</div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {currentRun.collectedLoot.map((item) => (
                  <div
                    key={item.id}
                    className="text-xs p-2 bg-zinc-900 border border-amber-600/20 rounded"
                  >
                    <div className="font-bold text-amber-300">{item.name}</div>
                    <div className="text-zinc-400">{item.value} CR</div>
                  </div>
                ))}
              </div>
            )}
          </CyberPanel>
        </div>

        {/* Crew Panel */}
        {showCrewPanel && (
          <div className="col-span-1">
            <CyberPanel>
              <div className="text-amber-400 font-bold mb-3 border-b border-amber-600/30 pb-2">
                CREW STATUS
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {crewRoster.map((crew) => {
                  const status = getCrewStatus(crew, settings);
                  const hpPercent = (crew.hp / crew.maxHp) * 100;
                  return (
                    <div
                      key={crew.id}
                      className={`p-3 rounded border ${
                        status.available
                          ? 'bg-green-900/10 border-green-600/30'
                          : 'bg-red-900/10 border-red-600/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-amber-300">{crew.name}</div>
                        <div className={`text-xs px-2 py-0.5 rounded ${
                          status.available
                            ? 'bg-green-700/30 text-green-400'
                            : 'bg-red-700/30 text-red-400'
                        }`}>
                          {status.available ? '✓ Ready' : '✗ Unavailable'}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1 text-xs mb-2">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">HP:</span>
                          <span className={hpPercent < 50 ? 'text-red-400' : 'text-green-400'}>
                            {crew.hp}/{crew.maxHp} ({Math.floor(hpPercent)}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Stamina:</span>
                          <span className={crew.stamina < 20 ? 'text-red-400' : 'text-cyan-400'}>
                            {crew.stamina}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Sanity:</span>
                          <span className={crew.sanity < 20 ? 'text-red-400' : 'text-purple-400'}>
                            {crew.sanity}
                          </span>
                        </div>
                      </div>

                      {!status.available && (
                        <div className="text-xs text-red-400 mb-2">
                          {status.reason}
                        </div>
                      )}

                      {/* Inventory */}
                      {crew.inventory.length > 0 ? (
                        <div className="mt-2 pt-2 border-t border-zinc-700">
                          <div className="text-xs text-zinc-400 mb-1">Carrying:</div>
                          {crew.inventory.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center bg-zinc-900 p-2 rounded mb-1"
                            >
                              <div className="text-xs">
                                <div className="font-bold text-amber-300">{item.name}</div>
                                <div className="text-zinc-500">{item.value} CR</div>
                              </div>
                              <button
                                className="bg-amber-600 hover:bg-amber-500 text-zinc-900 text-xs px-2 py-1 rounded"
                                onClick={() => transferItemToShip(crew.id, item.id)}
                                disabled={currentRun.collectedLoot.length >= cargoCapacity}
                              >
                                →Ship
                              </button>
                            </div>
                          ))}
                          <button
                            className="w-full mt-1 bg-amber-700 hover:bg-amber-600 text-white text-xs px-2 py-1 rounded"
                            onClick={() => transferAllItemsToShip(crew.id)}
                            disabled={currentRun.collectedLoot.length >= cargoCapacity}
                          >
                            Transfer All
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 mt-2 italic">
                          Empty inventory
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CyberPanel>
          </div>
        )}
      </div>

      {/* Sealed Room Cut Modal */}
      {sealedRoomToCut && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-amber-600/50 rounded-lg p-6 max-w-md shadow-2xl">
            <div className="text-amber-400 text-xl font-bold mb-4">
              🔒 Sealed Compartment
            </div>
            <div className="text-zinc-300 mb-4">
              This room is sealed. Cut through? (1 time unit)
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-zinc-900 font-bold px-4 py-2 rounded"
                onClick={() => {
                  onCutIntoRoom(sealedRoomToCut);
                  setSealedRoomToCut(null);
                }}
                disabled={currentRun.timeRemaining < 1}
              >
                🔧 Cut Into Room
              </button>
              <button
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-amber-100 px-4 py-2 rounded"
                onClick={() => setSealedRoomToCut(null)}
              >
                Cancel
              </button>
            </div>
            {currentRun.timeRemaining < 1 && (
              <div className="text-red-400 text-xs mt-2 text-center">
                ⚠️ Not enough time remaining
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-Salvage Menu */}
      {showAutoSalvageMenu && (
        <AutoSalvageMenu
          wreckType={wreck.type}
          wreckTier={wreck.tier}
          onStart={async (rules, speed) => {
            setShowAutoSalvageMenu(false);
            setIsAutoSalvageRunning(true);
            const result = await runAutoSalvage(rules as AutoSalvageRules, speed as 1 | 2);
            setIsAutoSalvageRunning(false);
            setAutoSalvageResult(result);
          }}
          onCancel={() => setShowAutoSalvageMenu(false)}
        />
      )}

      {/* Auto-Salvage Result Modal */}
      {autoSalvageResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-amber-600/50 rounded-lg p-6 max-w-md shadow-2xl">
            <div className="text-amber-400 text-xl font-bold mb-4 flex items-center gap-2">
              📊 Auto-Salvage Complete
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Rooms Salvaged:</span>
                <span className="text-amber-300 font-mono">{autoSalvageResult.roomsSalvaged}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Loot Collected:</span>
                <span className="text-amber-300 font-mono">{autoSalvageResult.lootCollected} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Credits Earned:</span>
                <span className="text-green-400 font-mono">+{autoSalvageResult.creditsEarned.toLocaleString()} CR</span>
              </div>
              {autoSalvageResult.injuries > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Injuries Sustained:</span>
                  <span className="text-red-400 font-mono">{autoSalvageResult.injuries}</span>
                </div>
              )}

              <div className="border-t border-zinc-700 pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Stop Reason:</span>
                  <span className={`font-mono ${
                    autoSalvageResult.stopReason === "complete" ? "text-green-400" :
                    autoSalvageResult.stopReason === "cargo_full" ? "text-amber-400" :
                    autoSalvageResult.stopReason === "time_out" ? "text-orange-400" :
                    autoSalvageResult.stopReason === "cancelled" ? "text-zinc-400" :
                    "text-red-400"
                  }`}>
                    {autoSalvageResult.stopReason === "complete" && "✓ All rooms cleared"}
                    {autoSalvageResult.stopReason === "cargo_full" && "📦 Cargo full"}
                    {autoSalvageResult.stopReason === "time_out" && "⏱ Time expired"}
                    {autoSalvageResult.stopReason === "crew_exhausted" && "😓 Crew exhausted"}
                    {autoSalvageResult.stopReason === "injury" && "🩹 Crew injured"}
                    {autoSalvageResult.stopReason === "cancelled" && "⏹ Cancelled"}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-900 font-bold px-4 py-2 rounded"
              onClick={() => setAutoSalvageResult(null)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Emergency Evacuation Modal */}
      {showEmergencyEvacModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border-2 border-red-600/50 rounded-lg p-6 max-w-md shadow-2xl">
            <div className="text-red-400 text-xl font-bold mb-4 flex items-center gap-2">
              🚨 EMERGENCY EVACUATION
            </div>
            <div className="text-zinc-300 mb-4">
              <p className="mb-2">Are you sure you want to emergency evacuate?</p>
              <p className="text-sm text-red-400">
                ⚠️ All crew will drop their items and all ship cargo will be abandoned!
              </p>
            </div>
            <div className="bg-red-900/20 border border-red-600/30 rounded p-3 mb-4">
              <div className="text-sm mb-2 text-zinc-400">Value at Risk:</div>
              <div className="text-2xl font-bold text-red-400">
                {totalValueAtRisk.toLocaleString()} CR
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded"
                onClick={() => {
                  emergencyEvacuate();
                  onNavigate("hub");
                }}
              >
                🚨 EVACUATE NOW
              </button>
              <button
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-amber-100 px-4 py-2 rounded"
                onClick={() => setShowEmergencyEvacModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cargo Swap Modal */}
      {cargoSwapPending && (
        <CargoSwapModal
          newItem={cargoSwapPending.newItem as any}
          currentCargo={currentRun.collectedLoot}
          onSwap={handleCargoSwap}
          onLeave={cancelCargoSwap}
        />
      )}
    </div>
  );
}
