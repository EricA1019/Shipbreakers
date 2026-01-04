/**
 * Ship Service
 * 
 * Handles player ship management: equipment installation, naming.
 * These are pure functions that return state updates for Zustand.
 */
import type { GameState, Loot, Item, PlayerShip, ItemSlot } from '../types';
import { 
  canInstall, 
  installItem, 
  uninstallItem, 
  getShipyardFee 
} from '../game/systems/slotManager';

/**
 * Result of a ship operation
 */
export interface ShipResult {
  success: boolean;
  updates?: Partial<GameState>;
  error?: string;
}

/**
 * Find a room and slot on the player ship
 */
function findRoomAndSlot(
  ship: PlayerShip, 
  roomId: string, 
  slotId: string
): { room: { slots: ItemSlot[] } | null; slot: ItemSlot | null } {
  const room = ship.grid.flat().find((r) => r && r.id === roomId);
  if (!room || !Array.isArray((room as { slots?: ItemSlot[] }).slots)) {
    return { room: null, slot: null };
  }
  const typedRoom = room as unknown as { slots: ItemSlot[] };
  const slot = typedRoom.slots.find((s: ItemSlot) => s.id === slotId);
  return { room: typedRoom, slot: slot ?? null };
}

/**
 * Install an item on the player ship
 */
export function installItemOnShip(
  state: Pick<GameState, 'playerShip' | 'inventory' | 'credits' | 'licenseTier'>,
  roomId: string,
  slotId: string,
  itemId: string
): ShipResult {
  const ship = state.playerShip;
  if (!ship) {
    return { success: false, error: 'No player ship' };
  }

  const { slot } = findRoomAndSlot(ship, roomId, slotId);
  if (!slot) {
    return { success: false, error: 'Room or slot not found' };
  }

  // Find item in unified inventory
  const inventory = state.inventory || [];
  const item: Loot | Item | undefined = inventory.find((i) => i.id === itemId);

  if (!item) {
    return { success: false, error: 'Item not found in inventory' };
  }

  const check = canInstall(ship, slot, item);
  if (!check.success) {
    return { success: false, error: check.message || 'Cannot install item' };
  }

  const fee = getShipyardFee(state.licenseTier, 'install');
  if (state.credits < fee) {
    return { success: false, error: 'Insufficient credits for installation' };
  }

  // Clone ship and install
  const updatedShip = { ...ship };
  installItem(updatedShip, slot, item);

  // Remove item from unified inventory
  const updates: Partial<GameState> = {
    credits: state.credits - fee,
    playerShip: updatedShip,
    inventory: inventory.filter((i) => i.id !== itemId),
  };

  return { success: true, updates };
}

/**
 * Uninstall an item from the player ship
 */
export function uninstallItemFromShip(
  state: Pick<GameState, 'playerShip' | 'inventory' | 'credits' | 'licenseTier'>,
  roomId: string,
  slotId: string
): ShipResult {
  const ship = state.playerShip;
  if (!ship) {
    return { success: false, error: 'No player ship' };
  }

  const { slot } = findRoomAndSlot(ship, roomId, slotId);
  if (!slot || !slot.installedItem) {
    return { success: false, error: 'No item installed in this slot' };
  }

  const fee = getShipyardFee(state.licenseTier, 'uninstall');
  if (state.credits < fee) {
    return { success: false, error: 'Insufficient credits for uninstallation' };
  }

  // Clone ship and uninstall
  const updatedShip = { ...ship };
  const removed = uninstallItem(updatedShip, slot);
  
  if (!removed) {
    return { success: false, error: 'Failed to uninstall item' };
  }

  return {
    success: true,
    updates: {
      inventory: [...(state.inventory || []), removed],
      credits: state.credits - fee,
      playerShip: updatedShip,
    },
  };
}

/**
 * Rename the player ship
 */
export function renameShip(
  state: Pick<GameState, 'playerShip'>,
  newName: string
): ShipResult {
  const ship = state.playerShip;
  if (!ship) {
    return { success: false, error: 'No player ship' };
  }

  const trimmedName = newName.trim();
  if (!trimmedName) {
    return { success: false, error: 'Ship name cannot be empty' };
  }

  return {
    success: true,
    updates: {
      playerShip: { ...ship, name: trimmedName },
    },
  };
}

/**
 * Get total power draw of installed items
 */
export function calculatePowerUsage(ship: PlayerShip): number {
  let totalDraw = 0;
  
  for (const row of ship.grid) {
    for (const room of row) {
      const slots = (room as unknown as { slots?: ItemSlot[] }).slots;
      if (slots) {
        for (const slot of slots) {
          if (slot.installedItem) {
            const item = slot.installedItem as { powerDraw?: number };
            totalDraw += item.powerDraw || 0;
          }
        }
      }
    }
  }
  
  return totalDraw;
}

/**
 * Get available power capacity
 */
export function getAvailablePower(ship: PlayerShip): number {
  const capacity = ship.powerCapacity || 0;
  const used = calculatePowerUsage(ship);
  return capacity - used;
}

/**
 * Check if ship has enough power for an item
 */
export function hasPowerFor(ship: PlayerShip, item: { powerDraw?: number }): boolean {
  return getAvailablePower(ship) >= (item.powerDraw || 0);
}
