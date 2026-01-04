import React, { useState, useMemo, useEffect } from "react";
import { ShipGrid } from "../game/ShipGrid";
import PowerGauge from "../ui/PowerGauge";
import { useGameStore } from "../../stores/gameStore";
import { useUiStore } from "../../stores/uiStore";
import type { PlayerShipRoom, ItemSlot, PlayerRoomType, GridPosition } from "../../types";
import { isEquippable } from "../../types";
import {
  calculatePowerUsed,
  getShipPowerCapacity,
  isOverPowerBudget,
  canInstall,
} from "../../game/systems/slotManager";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import { useAudio } from "../../hooks/useAudio";
import { ShipExpansionService } from "../../services/ShipExpansionService";
import { ROOM_PURCHASE_OPTIONS } from "../../game/data/roomPurchases";
import { hasShipLayout } from "../../types";

/**
 * Type guard for PlayerShipRoom
 */
function isPlayerShipRoom(room: any): room is PlayerShipRoom {
  return room && "slots" in room && Array.isArray(room.slots);
}

import type { ScreenProps } from "../../types";

export const ShipyardScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const playerShip = useGameStore((s) => s.playerShip);
  const crewRoster = useGameStore((s) => s.crewRoster);
  const [selectedRoom, setSelectedRoom] = useState<PlayerShipRoom | null>(null);
  const [manageTarget, setManageTarget] = useState<{
    roomId: string;
    slotId: string;
  } | null>(null);
  
  const crewRosterForShipView = useMemo(() => {
    if (!crewRoster) return crewRoster;
    return crewRoster.map((c) =>
      c.position?.location === "station"
        ? { ...c, position: { ...c.position, location: "ship" as const } }
        : c,
    );
  }, [crewRoster]);
  
  const [activeTab, setActiveTab] = useState<"equipment" | "expansion">("equipment");
  const [expansionType, setExpansionType] = useState<PlayerRoomType | null>(null);

  const inventory = useGameStore((s) => s.inventory || []);
  const credits = useGameStore((s) => s.credits);
  const installItemOnShip = useGameStore((s) => s.installItemOnShip);
  const uninstallItemFromShip = useGameStore((s) => s.uninstallItemFromShip);
  const purchaseRoom = useGameStore((s) => s.purchaseRoom);
  const sellRoom = useGameStore((s) => s.sellRoom);
  const addToast = useUiStore((s) => s.addToast);
  const audio = useAudio();

  useEffect(() => {
    audio.playTransition();
  }, []);

  // Combine equippable loot from inventory
  const allEquippableItems = useMemo(() => {
    return inventory.filter(isEquippable);
  }, [inventory]);

  // Calculate valid placements for expansion
  const validPlacements = useMemo(() => {
    if (!playerShip || activeTab !== "expansion") return [];
    return ShipExpansionService.getValidPlacements(playerShip);
  }, [playerShip, activeTab]);

  const shipLayoutBounds = useMemo(() => {
    if (!playerShip || !hasShipLayout(playerShip)) return null;

    const rooms = playerShip.layout.rooms;
    const points = activeTab === "expansion" ? validPlacements : [];

    const minX = Math.min(
      ...rooms.map((r) => r.x),
      ...(points.length ? points.map((p) => p.x) : [Infinity]),
    );
    const minY = Math.min(
      ...rooms.map((r) => r.y),
      ...(points.length ? points.map((p) => p.y) : [Infinity]),
    );
    const maxX = Math.max(
      ...rooms.map((r) => r.x + r.w),
      ...(points.length ? points.map((p) => p.x + 1) : [-Infinity]),
    );
    const maxY = Math.max(
      ...rooms.map((r) => r.y + r.h),
      ...(points.length ? points.map((p) => p.y + 1) : [-Infinity]),
    );

    return {
      minX,
      minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }, [playerShip, activeTab, validPlacements]);

  if (!playerShip) {
    return (
      <IndustrialPanel title="SHIPYARD">
        <div className="text-zinc-500 text-sm">No ship systems available</div>
      </IndustrialPanel>
    );
  }

  const powerUsed = calculatePowerUsed(playerShip);
  const powerCapacity = getShipPowerCapacity(playerShip);
  const isOver = isOverPowerBudget(playerShip);

  const openManage = (roomId: string, slotId: string) => {
    audio.playClick();
    setManageTarget({ roomId, slotId });
  };
  const closeManage = () => setManageTarget(null);

  const handleInstall = (itemId: string) => {
    if (!manageTarget) return;
    const ok = installItemOnShip(
      manageTarget.roomId,
      manageTarget.slotId,
      itemId,
    );
    if (!ok) {
      audio.playError();
      addToast({
        message: "Cannot install: check power, slot type, or credits",
        type: "error",
      });
    } else {
      audio.playSuccess();
    }
    closeManage();
  };

  const handleUninstall = () => {
    if (!manageTarget) return;
    const ok = uninstallItemFromShip(manageTarget.roomId, manageTarget.slotId);
    if (!ok) {
      audio.playError();
      addToast({
        message: "Cannot uninstall: insufficient credits or error",
        type: "error",
      });
    } else {
      audio.playSuccess();
    }
    closeManage();
  };

  const handlePurchaseRoom = (pos: GridPosition) => {
    if (!expansionType) return;
    
    const result = purchaseRoom(expansionType, pos);
    if (result.success) {
      audio.playSuccess();
      addToast({ message: "Section constructed", type: "success" });
    } else {
      audio.playError();
      addToast({ message: result.reason || "Construction failed", type: "error" });
    }
  };


  let manageSlot: ItemSlot | null = null;
  let manageRoomName = "";
  if (manageTarget && playerShip) {
    const r = playerShip.grid.flat().find((x) => x && x.id === manageTarget.roomId);
    if (r && isPlayerShipRoom(r)) {
      manageSlot = r.slots.find((s) => s.id === manageTarget.slotId) ?? null;
      manageRoomName = r.name ?? "";
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <IndustrialPanel
        title="SHIPYARD"
        subtitle="VESSEL CONFIGURATION · CINDER STATION"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab("equipment")}
              className={`px-4 py-2 text-sm font-['Orbitron'] font-bold tracking-wider transition-all ${
                activeTab === "equipment" 
                  ? "text-amber-400 border-b-2 border-amber-400" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              EQUIPMENT
            </button>
            <button 
              onClick={() => setActiveTab("expansion")}
              className={`px-4 py-2 text-sm font-['Orbitron'] font-bold tracking-wider transition-all ${
                activeTab === "expansion" 
                  ? "text-amber-400 border-b-2 border-amber-400" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              EXPANSION
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <StatChip 
              label="POWER DRAW" 
              value={`${powerUsed}/${powerCapacity}`} 
              variant={isOver ? "red" : "cyan"}
            />
            <StatChip 
              label="CREDITS" 
              value={`${(credits / 1000).toFixed(1)}K`} 
              variant="amber" 
            />
          </div>
        </div>
      </IndustrialPanel>

      <div className="grid grid-cols-3 gap-4">
        {/* Ship grid - left side */}
        <div className="col-span-2 space-y-4">
          <IndustrialPanel title="SHIP LAYOUT">
            <div className="relative">
              <ShipGrid
                ship={playerShip as any}
                crewRoster={crewRosterForShipView}
                locationFilter="ship"
                layoutBounds={shipLayoutBounds ?? undefined}
                overlay={
                  activeTab === "expansion" && expansionType && shipLayoutBounds
                    ? (() => {
                        const validSet = new Set(
                          validPlacements.map((p) => `${p.x},${p.y}`),
                        );
                        return (
                          <div
                            className="absolute inset-0 grid pointer-events-none"
                            style={{
                              gridTemplateColumns: `repeat(${shipLayoutBounds.width}, 1fr)`,
                              gridTemplateRows: `repeat(${shipLayoutBounds.height}, 1fr)`,
                            }}
                          >
                            {Array.from({
                              length: shipLayoutBounds.width * shipLayoutBounds.height,
                            }).map((_, idx) => {
                              const x = idx % shipLayoutBounds.width;
                              const y = Math.floor(idx / shipLayoutBounds.width);
                              const absX = x + shipLayoutBounds.minX;
                              const absY = y + shipLayoutBounds.minY;
                              const isValid = validSet.has(`${absX},${absY}`);

                              if (!isValid) return <div key={idx} />;

                              return (
                                <div
                                  key={idx}
                                  onClick={() =>
                                    handlePurchaseRoom({ x: absX, y: absY })
                                  }
                                  className="bg-green-500/20 border-2 border-green-500/50 rounded cursor-pointer hover:bg-green-500/40 pointer-events-auto animate-pulse"
                                  title={`Construct ${expansionType}`}
                                />
                              );
                            })}
                          </div>
                        );
                      })()
                    : undefined
                }
                onRoomClick={(r) => {
                  audio.playClick();
                  setSelectedRoom(r as PlayerShipRoom);
                }}
              />
            </div>
          </IndustrialPanel>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {activeTab === "equipment" ? (
            <>
              {/* Room selector */}
              <IndustrialPanel title={selectedRoom ? selectedRoom.name.toUpperCase() : "SELECT ROOM"}>
                {selectedRoom && isPlayerShipRoom(selectedRoom) ? (
                  <div className="space-y-2">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                      {selectedRoom.roomType}
                    </div>
                    {(selectedRoom.slots || []).map((slot: ItemSlot) => (
                      <div
                        key={slot.id}
                        className={`p-2.5 rounded-md border transition-all ${
                          isOver 
                            ? "border-red-500/30 bg-red-500/5" 
                            : "border-white/8 bg-black/26"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[9px] text-zinc-400 uppercase tracking-wider">
                              {slot.type}
                            </div>
                            <div className="text-xs font-['Orbitron'] font-bold text-amber-400 mt-1">
                              {slot.installedItem ? slot.installedItem.name : "EMPTY SLOT"}
                            </div>
                          </div>
                          <IndustrialButton
                            onClick={() => openManage(selectedRoom.id, slot.id)}
                            icon="wrench"
                            title="Manage"
                            description=""
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-sm">Select a room to view slots</div>
                )}
              </IndustrialPanel>

              {/* Management panel */}
              {manageSlot && (
                <IndustrialPanel title={`${manageRoomName} — ${manageSlot.type}`}>
                  {manageSlot.installedItem ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-[9px] text-zinc-400 uppercase tracking-wider mb-1">
                          INSTALLED
                        </div>
                        <div className="text-xs font-['Orbitron'] font-bold text-cyan-400">
                          {manageSlot.installedItem.name}
                        </div>
                      </div>
                      <IndustrialButton
                        variant="danger"
                        onClick={handleUninstall}
                        icon="cross"
                        title="Uninstall"
                        description="Remove from slot"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wider">
                        Available Equipment
                      </div>
                      {allEquippableItems
                        .filter(
                          (it) =>
                            it.slotType === manageSlot?.type ||
                            manageSlot?.type === "cargo",
                        )
                        .map((it) => {
                          const check = manageSlot
                            ? canInstall(playerShip, manageSlot, it)
                            : { success: false, message: "No slot selected" };
                          const disabled = !check.success;
                          return (
                            <div
                              key={it.id}
                              className={`p-2 rounded-md border transition-all ${
                                disabled
                                  ? "opacity-50 border-white/6 bg-black/20"
                                  : "border-white/8 bg-black/26 hover:border-amber-400 hover:bg-amber-500/4"
                              }`}
                              title={check.message ?? ""}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-xs font-['Orbitron'] font-bold text-amber-400 truncate">
                                    {it.name}
                                  </div>
                                  <div className="text-[9px] text-zinc-400">T{it.tier}</div>
                                </div>
                                <button
                                  disabled={disabled}
                                  onClick={() => {
                                    if (!disabled) {
                                      audio.playClick();
                                      handleInstall(it.id);
                                    }
                                  }}
                                  className={`px-2 py-1 text-xs uppercase tracking-wide rounded-md font-['Orbitron'] font-bold transition-all whitespace-nowrap ${
                                    disabled
                                      ? "bg-zinc-700/30 text-zinc-500 cursor-not-allowed"
                                      : "bg-amber-500/15 border border-amber-500 text-amber-400 hover:bg-amber-500/25"
                              }`}
                            >
                              Install
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </IndustrialPanel>
          )}
          </>
          ) : (
            <>
              {/* Expansion Tab Content */}
              <IndustrialPanel title="PURCHASE ROOM">
                <div className="space-y-2">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                    Available Room Types
                  </div>
                  {ROOM_PURCHASE_OPTIONS.map((option) => {
                    const cost = ShipExpansionService.calculateRoomCost(playerShip, option.roomType);
                    const canAfford = credits >= cost;
                    const isSelected = expansionType === option.roomType;
                    
                    return (
                      <button
                        key={option.roomType}
                        onClick={() => {
                          audio.playClick();
                          setExpansionType(isSelected ? null : option.roomType);
                        }}
                        className={`w-full p-3 rounded-md border transition-all text-left ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/20"
                            : canAfford
                            ? "border-white/8 bg-black/26 hover:bg-black/40"
                            : "border-red-500/30 bg-red-500/10 opacity-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-['Orbitron'] font-bold text-amber-400">
                              {option.name}
                            </div>
                            <div className="text-[9px] text-zinc-400 mt-1">
                              {option.description}
                            </div>
                            <div className="text-[10px] text-cyan-400 mt-1">
                              {cost} CR
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </IndustrialPanel>

              {selectedRoom && (
                <IndustrialPanel title="SELL ROOM">
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400 mb-2">
                      {selectedRoom.name}
                    </div>
                    <IndustrialButton
                      variant="danger"
                      onClick={() => {
                        audio.playClick();
                        const result = sellRoom(selectedRoom.id);
                        if (result.success) {
                          addToast({ message: "Room sold", type: "success" });
                          setSelectedRoom(null);
                        } else {
                          addToast({ message: result.reason || "Cannot sell", type: "error" });
                        }
                      }}
                      icon="cross"
                      title="Sell Room"
                      description="Remove from ship"
                    />
                  </div>
                </IndustrialPanel>
              )}
            </>
          )}
        </div>
      </div>

      {/* Power Gauge full width */}
      <IndustrialPanel title="POWER STATUS">
        <PowerGauge used={powerUsed} capacity={powerCapacity} />
        {isOver && (
          <div className="mt-3 p-2 bg-red-500/15 border border-red-500/30 rounded-md">
            <div className="text-[10px] text-red-400 uppercase tracking-wide">
              POWER OVERLOAD - CRITICAL SYSTEMS AT RISK
            </div>
          </div>
        )}
      </IndustrialPanel>

      {/* Back button */}
      <IndustrialPanel>
        <IndustrialButton
          onClick={() => {
            audio.playTransition();
            onNavigate("hub");
          }}
          icon="home"
          title="← Back to Station"
          description="Return to hub"
        />
      </IndustrialPanel>
    </div>
  );
};

export default ShipyardScreen;
