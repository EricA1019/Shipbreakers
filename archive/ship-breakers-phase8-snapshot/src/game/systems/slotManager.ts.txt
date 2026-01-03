import type {
  PlayerShip,
  ItemEffect,
  ItemSlot,
  Item,
  PlayerShipRoom,
  Loot,
} from "../../types";
import { isEquippable } from "../../types";
import {
  STARTING_POWER_CAPACITY,
  SHIPYARD_BASE_FEE,
  SHIPYARD_UNINSTALL_FEE,
  LICENSE_FEE_DISCOUNTS,
} from "../constants";

/**
 * Type guard to check if a room is a PlayerShipRoom with slots
 */
function isPlayerShipRoom(room: any): room is PlayerShipRoom {
  return room && "slots" in room && Array.isArray(room.slots);
}

/**
 * Calculate total power used by installed items on a ship.
 */
export function calculatePowerUsed(ship: PlayerShip): number {
  let used = 0;
  ship.grid.flat().forEach((room) => {
    if (isPlayerShipRoom(room)) {
      room.slots.forEach((slot) => {
        if (slot.installedItem) used += slot.installedItem.powerDraw || 0;
      });
    }
  });
  return used;
}

/**
 * Aggregate effects from all installed items on the ship.
 * Returns a flat array of ItemEffect for further reduction.
 */
export function getActiveEffects(ship: PlayerShip): ItemEffect[] {
  const effects: ItemEffect[] = [];

  ship.grid.flat().forEach((room) => {
    if (isPlayerShipRoom(room)) {
      room.slots.forEach((slot) => {
        if (slot.installedItem && Array.isArray(slot.installedItem.effects)) {
          effects.push(...slot.installedItem.effects);
        }
      });
    }
  });

  return effects;
}

/**
 * Get ship's current power capacity (derived from reactor if present)
 */
export function getShipPowerCapacity(ship: PlayerShip): number {
  if (ship.reactor && typeof ship.reactor.powerOutput === "number")
    return ship.reactor.powerOutput;
  return STARTING_POWER_CAPACITY;
}

export function isOverPowerBudget(ship: PlayerShip): boolean {
  const capacity = getShipPowerCapacity(ship);
  const used = calculatePowerUsed(ship);
  return used > capacity;
}

export interface InstallResult {
  success: boolean;
  message?: string;
}

/**
 * Validate whether an item can be installed into the given slot on ship.
 * Now accepts both Item and Loot (if Loot is equippable)
 */
export function canInstall(
  ship: PlayerShip,
  slot: ItemSlot,
  item: Item | Loot,
): InstallResult {
  // Check if Loot item is equippable
  if ("category" in item && !isEquippable(item as Loot)) {
    return {
      success: false,
      message: "Item cannot be installed (material or data item)",
    };
  }

  // Cargo slot accepts any item (but does not "install" in the same way)
  if (slot.type === "cargo") return { success: true };

  const itemSlotType = (item as any).slotType;
  if (slot.type !== itemSlotType) {
    return {
      success: false,
      message: `Slot type mismatch: slot=${slot.type} item=${itemSlotType}`,
    };
  }

  // Check power budget
  const capacity = getShipPowerCapacity(ship);
  const currentUsed = calculatePowerUsed(ship);
  const newUsed = currentUsed + ((item as any).powerDraw || 0);
  if (newUsed > capacity) {
    return {
      success: false,
      message: `Insufficient power: ${newUsed}/${capacity}`,
    };
  }

  return { success: true };
}

/**
 * Install an item into the given slot on ship. Returns InstallResult and mutates ship in place.
 * Caller should handle removing the item from cargo and payment for shipyard fees.
 */
export function installItem(
  ship: PlayerShip,
  slot: ItemSlot,
  item: Item | Loot,
): InstallResult {
  const check = canInstall(ship, slot, item);
  if (!check.success) return check;

  slot.installedItem = item as any; // Allow both Item and Loot types
  // update ship powerUsed optionally
  ship.powerUsed = calculatePowerUsed(ship);
  return { success: true };
}

/**
 * Uninstall item from a slot. Returns the removed item or null.
 */
export function uninstallItem(
  ship: PlayerShip,
  slot: ItemSlot,
): Item | Loot | null {
  const removed = slot.installedItem || null;
  slot.installedItem = null;
  ship.powerUsed = calculatePowerUsed(ship);
  return removed as any;
}

/**
 * Calculate shipyard fee given license tier and action.
 */
export function getShipyardFee(
  licenseTier: "basic" | "standard" | "premium",
  action: "install" | "uninstall" = "install",
): number {
  const base =
    action === "install" ? SHIPYARD_BASE_FEE : SHIPYARD_UNINSTALL_FEE;
  const discount = LICENSE_FEE_DISCOUNTS[licenseTier] ?? 0;
  return Math.max(0, Math.round(base * (1 - discount)));
}
