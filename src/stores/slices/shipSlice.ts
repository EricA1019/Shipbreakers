/**
 * Ship Slice - Manages player ship state, equipment, and expansion
 * 
 * Responsibilities:
 * - Player ship state and initialization
 * - Equipment installation/uninstallation
 * - Ship room purchases and sales (Phase 13 expansion)
 * - Ship naming
 * 
 * Extracted from gameStore.ts to improve maintainability.
 */
import type { StateCreator } from 'zustand';
import type { GameState, PlayerShip, PlayerRoomType, GridPosition } from '../../types';
import { initializePlayerShip } from '../../game/data/playerShip';
import { ShipExpansionService } from '../../services/ShipExpansionService';
import {
  canInstall,
  installItem,
  uninstallItem,
  getShipyardFee,
} from '../../game/systems/slotManager';
import { REPAIR_COST_PER_POINT } from '../../game/constants';
import { clamp } from '../../utils/mathUtils';

/**
 * Ship slice state interface
 */
export interface ShipSliceState {
  // State
  playerShip?: PlayerShip;
}

/**
 * Ship slice actions interface
 */
export interface ShipSliceActions {
  // Ship management
  renameShip: (name: string) => void;
  
  // Equipment
  installItemOnShip: (roomId: string, slotId: string, itemId: string) => boolean;
  uninstallItemFromShip: (roomId: string, slotId: string) => boolean;
  
  // Ship expansion (Phase 13)
  purchaseRoom: (
    roomType: PlayerRoomType,
    position: GridPosition
  ) => { success: boolean; reason?: string };
  sellRoom: (roomId: string) => { success: boolean; reason?: string };

  // Phase 16: Repairs
  repairShipAtYard: () => { success: boolean; cost: number; reason?: string };
}

/**
 * Create the ship slice
 */
export const createShipSlice: StateCreator<
  GameState,
  [],
  [],
  ShipSliceState & ShipSliceActions
> = (set, get) => ({
  // Initial state
  playerShip: undefined,

  // Actions
  renameShip: (name: string) => {
    set((state) => {
      if (state.playerShip) {
        return { playerShip: { ...state.playerShip, name } };
      } else {
        const newShip = initializePlayerShip('player-ship');
        return { playerShip: { ...newShip, name } };
      }
    });
  },

  installItemOnShip: (roomId: string, slotId: string, itemId: string) => {
    const state = get();
    const ship = state.playerShip;
    if (!ship) return false;

    const room = ship.grid
      .flat()
      .find((r: any) => r && r.id === roomId) as any;
    if (!room || !Array.isArray(room.slots)) return false;
    const slot = room.slots.find((s: any) => s.id === slotId);
    if (!slot) return false;

    const inventory = state.inventory || [];
    const item = inventory.find((i) => i.id === itemId);

    if (!item) return false;

    const check = canInstall(ship, slot, item);
    if (!check.success) return false;

    const fee = getShipyardFee(state.licenseTier, 'install');
    if (state.credits < fee) return false;

    installItem(ship, slot, item);

    set((s) => ({
      inventory: s.inventory.filter((i) => i.id !== itemId),
      credits: s.credits - fee,
      playerShip: { ...ship },
    }));

    return true;
  },

  uninstallItemFromShip: (roomId: string, slotId: string) => {
    const state = get();
    const ship = state.playerShip;
    if (!ship) return false;

    const room = ship.grid
      .flat()
      .find((r: any) => r && r.id === roomId) as any;
    if (!room || !Array.isArray(room.slots)) return false;
    const slot = room.slots.find((s: any) => s.id === slotId);
    if (!slot || !slot.installedItem) return false;

    const fee = getShipyardFee(state.licenseTier, 'uninstall');
    if (state.credits < fee) return false;

    const removed = uninstallItem(ship, slot);
    if (!removed) return false;

    set((s) => ({
      inventory: (s.inventory || []).concat(removed),
      credits: s.credits - fee,
      playerShip: { ...ship },
    }));

    return true;
  },

  purchaseRoom: (roomType: PlayerRoomType, position: GridPosition) => {
    const state = get();
    if (!state.playerShip) return { success: false, reason: 'No ship' };

    const check = ShipExpansionService.canPurchaseRoom(
      state.playerShip,
      roomType,
      position,
      state.credits,
      state.licenseTier
    );

    if (!check.success) return { success: false, reason: check.reason };

    const cost = ShipExpansionService.calculateRoomCost(
      state.playerShip,
      roomType
    );
    const newShip = ShipExpansionService.purchaseRoom(
      state.playerShip,
      roomType,
      position
    );

    const cargoRooms = newShip.rooms.filter((r) => r.roomType === 'cargo')
      .length;
    const cargoCapacity = 4 + cargoRooms * 4;

    set((s) => ({
      credits: s.credits - cost,
      playerShip: {
        ...newShip,
        cargoCapacity,
      },
    }));

    return { success: true };
  },

  sellRoom: (roomId: string) => {
    const state = get();
    if (!state.playerShip) return { success: false, reason: 'No ship' };

    const result = ShipExpansionService.sellRoom(state.playerShip, roomId);
    if (!result.success || !result.ship)
      return { success: false, reason: result.reason };

    const cargoRooms = result.ship.rooms.filter(
      (r) => r.roomType === 'cargo'
    ).length;
    const cargoCapacity = 4 + cargoRooms * 4;

    set((s) => ({
      credits: s.credits + (result.credits || 0),
      playerShip: {
        ...result.ship!,
        cargoCapacity,
      },
    }));

    return { success: true };
  },

  repairShipAtYard: () => {
    const state = get();
    const ship = state.playerShip;
    if (!ship) return { success: false, cost: 0, reason: 'No ship' };

    const hullCondition =
      typeof (ship as any).condition === 'number' ? (ship as any).condition : 100;
    const hullMissing = Math.max(0, 100 - hullCondition);

    // Rooms: damage is authoritative; condition (if present) should be inverse.
    const roomDamageTotal = (ship.rooms || []).reduce((sum: number, r: any) => {
      const damage = typeof r.damage === 'number' ? r.damage : 0;
      return sum + clamp(damage, 0, 100);
    }, 0);

    // Installed equipment condition
    let equipmentMissing = 0;
    ship.grid.flat().forEach((room: any) => {
      if (!room || !Array.isArray(room.slots)) return;
      room.slots.forEach((slot: any) => {
        const installed = slot?.installedItem;
        if (!installed) return;
        const cond =
          typeof installed.condition === 'number' ? installed.condition : 100;
        equipmentMissing += Math.max(0, 100 - clamp(cond, 0, 100));
      });
    });

    const totalPoints = hullMissing + roomDamageTotal + equipmentMissing;
    const cost = Math.ceil(totalPoints * REPAIR_COST_PER_POINT);

    if (totalPoints <= 0) {
      return { success: false, cost: 0, reason: 'No repairs needed' };
    }

    if (state.credits < cost) {
      return { success: false, cost, reason: 'Insufficient credits' };
    }

    // Apply repairs
    (ship as any).condition = 100;
    ship.rooms.forEach((r: any) => {
      r.damage = 0;
      r.condition = 100;
    });
    ship.grid.flat().forEach((room: any) => {
      if (!room || !Array.isArray(room.slots)) return;
      room.slots.forEach((slot: any) => {
        if (slot?.installedItem) slot.installedItem.condition = 100;
      });
    });

    set((s) => ({
      credits: s.credits - cost,
      playerShip: { ...ship },
    }));

    return { success: true, cost };
  },
});
