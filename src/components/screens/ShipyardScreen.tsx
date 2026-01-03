import React, { useState, useMemo, useEffect } from "react";
import { ShipGrid } from "../game/ShipGrid";
import PowerGauge from "../ui/PowerGauge";
import { useGameStore } from "../../stores/gameStore";
import { useUiStore } from "../../stores/uiStore";
import type { PlayerShipRoom, ItemSlot, Loot, Item } from "../../types";
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

  const equipmentInventory = useGameStore((s) => s.equipmentInventory || []);
  const lootInventory = useGameStore((s) => s.inventory || []);
  const credits = useGameStore((s) => s.credits);
  const installItemOnShip = useGameStore((s) => s.installItemOnShip);
  const uninstallItemFromShip = useGameStore((s) => s.uninstallItemFromShip);
  const addToast = useUiStore((s) => s.addToast);
  const audio = useAudio();

  useEffect(() => {
    audio.playTransition();
  }, []);

  // Combine equippable loot from inventory with equipment inventory
  const allEquippableItems = useMemo(() => {
    const equippableLoot = lootInventory.filter(isEquippable);
    return [...equipmentInventory, ...equippableLoot] as (Loot | Item)[];
  }, [equipmentInventory, lootInventory]);

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

  let manageSlot: ItemSlot | null = null;
  let manageRoomName = "";
  if (manageTarget && playerShip) {
    const r = playerShip.grid.flat().find((x) => x.id === manageTarget.roomId);
    if (isPlayerShipRoom(r)) {
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
      </IndustrialPanel>

      <div className="grid grid-cols-3 gap-4">
        {/* Ship grid - left side */}
        <div className="col-span-2 space-y-4">
          <IndustrialPanel title="SHIP LAYOUT">
            <ShipGrid
              ship={playerShip}
              crewRoster={crewRoster}
              locationFilter="ship"
              onRoomClick={(r) => {
                audio.playClick();
                setSelectedRoom(r as PlayerShipRoom);
              }}
            />
          </IndustrialPanel>
        </div>

        {/* Right panel - Room management */}
        <div className="space-y-4">
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
