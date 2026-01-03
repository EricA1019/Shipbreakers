import { useState, useMemo, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import type { AutoSalvageRules, AutoSalvageResult } from "../../stores/gameStore";
import { FUEL_COST_PER_AU } from "../../game/constants";
import ShipGrid from "../game/ShipGrid";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import StatusPill from "../ui/StatusPill";
import HazardTag from "../ui/HazardTag";
import CargoSwapModal from "../ui/CargoSwapModal";
import AutoSalvageMenu from "../game/AutoSalvageMenu";
import { useAudio } from "../../hooks/useAudio";
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

  const audio = useAudio();
  const [showCrewPanel, setShowCrewPanel] = useState(true);
  const [sealedRoomToCut, setSealedRoomToCut] = useState<string | null>(null);
  const [sealedUpdateCounter, setSealedUpdateCounter] = useState(0);
  const [showAutoSalvageMenu, setShowAutoSalvageMenu] = useState(false);
  const [isAutoSalvageRunning, setIsAutoSalvageRunning] = useState(false);

  // Play transition sound on mount
  useEffect(() => {
    audio.playTransition();
  }, []);
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

  // Calculate total cargo value
  const totalValue = useMemo(() => {
    return currentRun.collectedLoot.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [currentRun.collectedLoot]);

  // Get active hazards count (from wreck rooms)
  const activeHazards = useMemo(() => {
    if (!wreck.rooms) return [];
    const hazards: string[] = [];
    wreck.rooms.forEach(room => {
      if ((room as any).hazards) {
        hazards.push(...(room as any).hazards);
      }
    });
    return hazards;
  }, [wreck.rooms]);

  // Get sealed rooms
  const sealedRooms = useMemo(() => {
    if (!wreck.rooms) return [];
    return wreck.rooms.filter(r => r.sealed);
  }, [wreck.rooms]);

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
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <IndustrialPanel
        title={`SALVAGE OPS // ${displayName.toUpperCase()}`}
        subtitle={`${wreck.type.toUpperCase()} WRECK · TIER ${wreck.tier} · ${wreck.distance} AU`}
        showTape
        headerRight={
          <>
            <StatChip label="FUEL" value={fuel} variant="amber" />
            <StatChip label="CARGO" value={`${currentRun.collectedLoot.length}/${cargoCapacity}`} variant="cyan" />
            <StatChip label="VALUE" value={`${Math.floor(totalValue / 1000)}K`} variant="green" />
            <StatChip label="HAZARDS" value={activeHazards.length} variant="red" />
          </>
        }
      >
        <></>  
      </IndustrialPanel>

      {/* Operations */}
      <IndustrialPanel title="OPERATIONS" showTape>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <IndustrialButton
            title="🤖 Auto-Salvage"
            description="Run automated salvage"
            variant="info"
            onClick={() => setShowAutoSalvageMenu(true)}
            disabled={isAutoSalvageRunning}
          />
          <IndustrialButton
            title="✓ Return to Station"
            description="Complete mission"
            variant="success"
            onClick={onReturn}
            disabled={!canReturn || isAutoSalvageRunning}
          />
          <IndustrialButton
            title="🚨 Emergency Evac"
            description="Abandon mission"
            variant="danger"
            onClick={() => setShowEmergencyEvacModal(true)}
            disabled={isAutoSalvageRunning}
          />
          <IndustrialButton
            title={`👥 Crew ${showCrewPanel ? '▼' : '▶'}`}
            description="Toggle crew panel"
            variant="info"
            onClick={() => setShowCrewPanel(!showCrewPanel)}
          />
        </div>
      </IndustrialPanel>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ship Grid */}
        <div className={showCrewPanel ? "col-span-2" : "col-span-3"}>
          <IndustrialPanel
            title="DECK SCANNER"
            subtitle="BREACH POINTS & ROOM STATUS"
            showTape
            headerRight={
              <StatusPill
                icon="dot"
                label={sealedRooms.length > 0 ? `${sealedRooms.length} SEALED` : "ALL OPEN"}
                variant={sealedRooms.length > 0 ? "warning" : "default"}
              />
            }
          >
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
              <div className="text-[var(--muted)] text-center py-8">
                No ship layout available
              </div>
            )}
          </IndustrialPanel>

          {/* Ship Cargo Summary */}
          <IndustrialPanel title="SHIP CARGO" className="mt-4">
            {currentRun.collectedLoot.length === 0 ? (
              <div className="text-[var(--muted)] text-sm text-center py-8">
                No items secured yet
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {currentRun.collectedLoot.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.08)] p-2 rounded-lg"
                    >
                      <div className="text-[13px] font-semibold truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-[var(--muted)] mt-1">
                        {item.rarity}
                      </div>
                      <div
                        className="text-[11px] font-['Orbitron'] font-bold text-[var(--cyan)] mt-1"
                        style={{ textShadow: "var(--glowC)" }}
                      >
                        {item.value} cr
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted)] text-xs">
                      TOTAL HAUL VALUE
                    </span>
                    <span
                      className="font-['Orbitron'] text-lg font-extrabold text-[var(--cyan)]"
                      style={{ textShadow: "var(--glowC)" }}
                    >
                      {totalValue.toLocaleString()} CR
                    </span>
                  </div>
                </div>
              </div>
            )}
          </IndustrialPanel>
        </div>

        {/* Crew Panel */}
        {showCrewPanel && (
          <div className="col-span-1">
            <IndustrialPanel
              title="CREW STATUS"
              subtitle={`${crewRoster.length} MEMBERS`}
              showTape
              headerRight={<StatusPill icon="dot" label="TRACKING" />}
            >
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {crewRoster.map((crew) => {
                  const status = getCrewStatus(crew, settings);
                  const hpPercent = (crew.hp / crew.maxHp) * 100;
                  const staminaPercent = (crew.stamina / 100) * 100;
                  const sanityPercent = (crew.sanity / 100) * 100;
                  const isInjured = hpPercent < 50;
                  
                  return (
                    <div
                      key={crew.id}
                      className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.26)] p-3"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-[13px]">
                            {crew.name.toUpperCase()}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">
                            {crew.background || "HAULER"}
                          </div>
                        </div>
                        <StatusPill
                          icon="dot"
                          label={status.available ? "READY" : "UNAVAILABLE"}
                          variant={status.available ? "default" : "danger"}
                        />
                      </div>

                      {/* Progress Bars */}
                      <div className="grid grid-cols-3 gap-2 text-[10px] mb-3">
                        <div>
                          <div className="text-[var(--muted)] uppercase tracking-wider">
                            HP
                          </div>
                          <div
                            className="h-1 rounded-full bg-[rgba(255,255,255,0.08)] mt-1 overflow-hidden"
                            style={{ border: "1px solid rgba(0,0,0,0.35)" }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${hpPercent}%`,
                                background: isInjured
                                  ? "linear-gradient(90deg, rgba(255,75,75,0.85), rgba(255,106,42,0.85))"
                                  : "linear-gradient(90deg, rgba(113,255,120,0.85), rgba(56,224,199,0.85))",
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-[var(--muted)] uppercase tracking-wider">
                            STAMINA
                          </div>
                          <div
                            className="h-1 rounded-full bg-[rgba(255,255,255,0.08)] mt-1 overflow-hidden"
                            style={{ border: "1px solid rgba(0,0,0,0.35)" }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${staminaPercent}%`,
                                background:
                                  "linear-gradient(90deg, rgba(113,255,120,0.85), rgba(56,224,199,0.85))",
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-[var(--muted)] uppercase tracking-wider">
                            SANITY
                          </div>
                          <div
                            className="h-1 rounded-full bg-[rgba(255,255,255,0.08)] mt-1 overflow-hidden"
                            style={{ border: "1px solid rgba(0,0,0,0.35)" }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${sanityPercent}%`,
                                background:
                                  "linear-gradient(90deg, rgba(113,255,120,0.85), rgba(56,224,199,0.85))",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {!status.available && (
                        <div className="text-xs text-[var(--bad)] mb-2">
                          {status.reason}
                        </div>
                      )}

                      {/* Inventory */}
                      {crew.inventory.length > 0 ? (
                        <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                          <div className="text-xs text-[var(--muted)] mb-2 uppercase tracking-wider">Carrying:</div>
                          {crew.inventory.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center bg-[rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.08)] p-2 rounded-lg mb-2"
                            >
                              <div className="text-xs">
                                <div className="font-bold text-[13px]">{item.name}</div>
                                <div className="text-[var(--muted)] text-[10px]">{item.value} CR</div>
                              </div>
                              <IndustrialButton
                                title="→Ship"
                                description=""
                                variant="info"
                                onClick={() => transferItemToShip(crew.id, item.id)}
                                disabled={currentRun.collectedLoot.length >= cargoCapacity}
                              />
                            </div>
                          ))}
                          <IndustrialButton
                            title="Transfer All"
                            description="Move all items to ship"
                            variant="info"
                            fullWidth
                            onClick={() => transferAllItemsToShip(crew.id)}
                            disabled={currentRun.collectedLoot.length >= cargoCapacity}
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-[var(--muted)] mt-2 italic">
                          Empty inventory
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </IndustrialPanel>
          </div>
        )}
      </div>

      {/* Sealed Room Cut Modal */}
      {sealedRoomToCut && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <IndustrialPanel
            title="SEALED ROOM"
            subtitle="BREACH REQUIRED"
            variant="warning"
            showTape
            className="max-w-md"
          >
            <div className="space-y-4">
              <div className="text-[var(--muted)] text-sm">
                This room is sealed. You must use a Cutting Laser to breach the door (costs 1 time unit).
              </div>
              {currentRun.timeRemaining < 1 && (
                <HazardTag label="⚠️ NOT ENOUGH TIME" variant="danger" />
              )}
              <div className="flex gap-2">
                <IndustrialButton
                  title="🔧 Cut Into Room"
                  description="Use cutting laser"
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    audio.playClick();
                    onCutIntoRoom(sealedRoomToCut);
                    setSealedRoomToCut(null);
                  }}
                  disabled={currentRun.timeRemaining < 1}
                />
                <IndustrialButton
                  title="Cancel"
                  description="Return to ops"
                  variant="info"
                  fullWidth
                  onClick={() => setSealedRoomToCut(null)}
                />
              </div>
            </div>
          </IndustrialPanel>
        </div>
      )}

      {/* Auto-Salvage Menu */}
      {showAutoSalvageMenu && (
        <AutoSalvageMenu
          wreckType={wreck.type}
          wreckTier={wreck.tier}
          onStart={async (rules, speed) => {
            audio.playClick();
            setShowAutoSalvageMenu(false);
            setIsAutoSalvageRunning(true);
            const result = await runAutoSalvage(rules as AutoSalvageRules, speed as 1 | 2);
            setIsAutoSalvageRunning(false);
            if (result) {
              audio.playSuccess();
            }
            setAutoSalvageResult(result);
          }}
          onCancel={() => setShowAutoSalvageMenu(false)}
        />
      )}

      {/* Auto-Salvage Result Modal */}
      {autoSalvageResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <IndustrialPanel
            title="📊 AUTO-SALVAGE COMPLETE"
            variant="success"
            showTape
            className="max-w-md"
          >
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.08)] p-3 rounded-lg">
                  <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">
                    Rooms
                  </div>
                  <div className="font-['Orbitron'] text-lg font-bold text-[var(--haz)]">
                    {autoSalvageResult.roomsSalvaged}
                  </div>
                </div>
                <div className="bg-[rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.08)] p-3 rounded-lg">
                  <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">
                    Loot
                  </div>
                  <div className="font-['Orbitron'] text-lg font-bold text-[var(--cyan)]">
                    {autoSalvageResult.lootCollected}
                  </div>
                </div>
                <div className="bg-[rgba(0,0,0,0.28)] border border-[rgba(255,255,255,0.08)] p-3 rounded-lg col-span-2">
                  <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">
                    Credits Earned
                  </div>
                  <div className="font-['Orbitron'] text-xl font-extrabold text-[var(--ok)]">
                    +{autoSalvageResult.creditsEarned.toLocaleString()} CR
                  </div>
                </div>
                {autoSalvageResult.injuries > 0 && (
                  <div className="bg-[rgba(255,75,75,0.1)] border border-[rgba(255,75,75,0.25)] p-3 rounded-lg col-span-2">
                    <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mb-1">
                      Injuries
                    </div>
                    <div className="font-['Orbitron'] text-lg font-bold text-[var(--bad)]">
                      {autoSalvageResult.injuries}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[rgba(255,255,255,0.08)] pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                    Stop Reason:
                  </span>
                  <span className={`font-mono text-xs ${
                    autoSalvageResult.stopReason === "complete" ? "text-[var(--ok)]" :
                    autoSalvageResult.stopReason === "cargo_full" ? "text-[var(--haz)]" :
                    autoSalvageResult.stopReason === "time_out" ? "text-[var(--rust)]" :
                    autoSalvageResult.stopReason === "cancelled" ? "text-[var(--muted)]" :
                    "text-[var(--bad)]"
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
            <IndustrialButton
              title="Continue"
              description="Return to salvage ops"
              variant="success"
              fullWidth
              onClick={() => setAutoSalvageResult(null)}
            />
          </IndustrialPanel>
        </div>
      )}

      {/* Emergency Evacuation Modal */}
      {showEmergencyEvacModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <IndustrialPanel
            title="🚨 EMERGENCY EVACUATION"
            variant="danger"
            showTape
            className="max-w-md"
          >
            <div className="space-y-4">
              <div className="text-[var(--muted)] text-sm">
                <p className="mb-2">Are you sure you want to emergency evacuate?</p>
              </div>
              <HazardTag label="⚠️ ALL CREW INVENTORY AND SHIP CARGO WILL BE ABANDONED!" variant="danger" />
              <div className="bg-[rgba(255,75,75,0.1)] border border-[rgba(255,75,75,0.25)] rounded-lg p-3">
                <div className="text-xs text-[var(--muted)] mb-1 uppercase tracking-wider">
                  Value at Risk:
                </div>
                <div
                  className="text-2xl font-['Orbitron'] font-extrabold text-[var(--bad)]"
                  style={{ textShadow: "0 0 8px rgba(255,75,75,0.5)" }}
                >
                  {totalValueAtRisk.toLocaleString()} CR
                </div>
              </div>
              <div className="flex gap-2">
                <IndustrialButton
                  title="🚨 EVACUATE NOW"
                  description="Abandon mission"
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    audio.playError();
                    emergencyEvacuate();
                    onNavigate("hub");
                  }}
                />
                <IndustrialButton
                  title="Cancel"
                  description="Return to ops"
                  variant="info"
                  fullWidth
                  onClick={() => setShowEmergencyEvacModal(false)}
                />
              </div>
            </div>
          </IndustrialPanel>
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
