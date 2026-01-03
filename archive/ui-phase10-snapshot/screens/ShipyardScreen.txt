import React, { useState, useMemo } from "react";
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

  // Combine equippable loot from inventory with equipment inventory
  const allEquippableItems = useMemo(() => {
    const equippableLoot = lootInventory.filter(isEquippable);
    return [...equipmentInventory, ...equippableLoot] as (Loot | Item)[];
  }, [equipmentInventory, lootInventory]);

  if (!playerShip) return <div className="p-6">No player ship available.</div>;

  const powerUsed = calculatePowerUsed(playerShip);
  const powerCapacity = getShipPowerCapacity(playerShip);

  const openManage = (roomId: string, slotId: string) =>
    setManageTarget({ roomId, slotId });
  const closeManage = () => setManageTarget(null);

  const handleInstall = (itemId: string) => {
    if (!manageTarget) return;
    const ok = installItemOnShip(
      manageTarget.roomId,
      manageTarget.slotId,
      itemId,
    );
    if (!ok) {
      addToast({
        message: "Cannot install: check power, slot type, or credits",
        type: "error",
      });
    }
    closeManage();
  };

  const handleUninstall = () => {
    if (!manageTarget) return;
    const ok = uninstallItemFromShip(manageTarget.roomId, manageTarget.slotId);
    if (!ok)
      addToast({
        message: "Cannot uninstall: insufficient credits or error",
        type: "error",
      });
    closeManage();
  };

  const isOver = isOverPowerBudget(playerShip);

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
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-amber-200 text-lg">🔧 SHIPYARD</div>
        {onNavigate && (
          <button
            onClick={() => onNavigate("hub")}
            className="bg-zinc-800 border border-amber-600/20 text-amber-100 px-3 py-1 rounded hover:bg-zinc-700"
          >
            ← Back to Hub
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="mb-4">
            <PowerGauge used={powerUsed} capacity={powerCapacity} />
          </div>
          <ShipGrid
            ship={playerShip}
            crewRoster={crewRoster}
            locationFilter="ship"
            onRoomClick={(r) => setSelectedRoom(r as PlayerShipRoom)}
          />
        </div>

        <div className="col-span-1">
          <div className="bg-zinc-900 border border-amber-600/20 p-4 rounded">
            <div className="font-mono text-amber-200 text-sm">
              SHIPYARD — ROOM
            </div>
            {selectedRoom ? (
              <div className="mt-3">
                <div className="font-mono text-amber-100">
                  {selectedRoom.name} — {selectedRoom.roomType}
                </div>
                <div className="mt-2">
                  {(selectedRoom.slots || []).map((slot: ItemSlot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-2 rounded mb-2 ${isOver ? "border border-red-600" : "bg-zinc-800"}`}
                    >
                      <div className="text-xs font-mono">
                        <div className="uppercase text-amber-200 text-[11px]">
                          {slot.type}
                        </div>
                        <div className="text-amber-100 text-sm">
                          {slot.installedItem
                            ? slot.installedItem.name
                            : "Empty"}
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => openManage(selectedRoom.id, slot.id)}
                          className="bg-amber-600 text-zinc-900 px-2 py-1 text-xs rounded"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 text-amber-300 text-sm">
                Select a room to view slots.
              </div>
            )}
          </div>

          {manageSlot && (
            <div className="mt-4 bg-zinc-900 border border-amber-600/20 p-4 rounded">
              <div className="font-mono text-amber-200 text-sm">
                Manage Slot
              </div>
              <div className="mt-2 text-amber-100 font-mono">
                {manageRoomName} — {manageSlot.type}
              </div>
              <div className="mt-3">
                {manageSlot.installedItem ? (
                  <div>
                    <div className="mb-2">
                      Installed: {manageSlot.installedItem.name}
                    </div>
                    <button
                      onClick={handleUninstall}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Uninstall (Fee)
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2">Install from inventory:</div>
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
                        const disabled = !check.success || credits <= 0;
                        return (
                          <div
                            key={it.id}
                            className={`flex items-center justify-between p-2 rounded mb-2 ${disabled ? "opacity-50" : "bg-zinc-800"}`}
                            title={check.message ?? ""}
                          >
                            <div className="text-xs font-mono">
                              <div className="text-amber-100">
                                {it.name} ({it.tier})
                              </div>
                            </div>
                            <div>
                              <button
                                disabled={disabled}
                                onClick={() => handleInstall(it.id)}
                                className="bg-amber-600 text-zinc-900 px-2 py-1 text-xs rounded"
                              >
                                Install
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {allEquippableItems.filter(
                      (it) =>
                        !(
                          it.slotType === manageSlot?.type ||
                          manageSlot?.type === "cargo"
                        ),
                    ).length === 0 || null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipyardScreen;
