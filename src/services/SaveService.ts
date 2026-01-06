/**
 * Save Service
 *
 * Owns save validation + migrations.
 *
 * Notes:
 * - Save files are exported as raw GameState JSON.
 * - localStorage persistence is handled by Zustand persist (wrapper { state, version }).
 * - This module provides normalization to support importing legacy wrapper saves.
 */

import type { CrewMember, GameState, Item, ItemFlags, EquipmentData } from '../types';
import { REACTORS } from '../game/data/reactors';
import { createDefaultItemFlags } from '../game/factories';

export const STORE_STORAGE_KEY = 'ship-breakers-store-v1';
export const SAVE_SCHEMA_VERSION = 2; // Bumped for item flags system

export type PersistedStoreBlob = {
  state: unknown;
  version?: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isPersistedStoreBlob(data: unknown): data is PersistedStoreBlob {
  if (!isObject(data)) return false;
  return 'state' in data;
}

/**
 * Validate raw GameState structure. Keep this permissive; migrations should fill defaults.
 */
export function isValidSave(data: unknown): data is Partial<GameState> {
  if (!isObject(data)) return false;
  if (typeof data.credits !== 'number') return false;
  if (typeof data.fuel !== 'number') return false;
  if (!Array.isArray((data as any).crewRoster)) return false;
  return true;
}

export function exportSave(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function parseSave(json: string): GameState | null {
  try {
    return JSON.parse(json) as GameState;
  } catch {
    return null;
  }
}

export function wrapPersistedState(state: GameState): { state: GameState; version: number } {
  return { state, version: SAVE_SCHEMA_VERSION };
}

export function extractRawGameState(data: unknown): GameState | null {
  if (isPersistedStoreBlob(data)) {
    const raw = data.state;
    return isValidSave(raw) ? (raw as GameState) : null;
  }

  return isValidSave(data) ? (data as GameState) : null;
}

export function needsMigration(state: Partial<GameState>): boolean {
  if (typeof state.cargoSwapPending === 'undefined') return true;

  if (state.crewRoster?.some((c: CrewMember) => !c.inventory)) return true;
  if (state.crewRoster?.some((c: CrewMember) => (c as any).movement)) return true;
  if (state.crewRoster?.some((c: CrewMember) => !(c as any).stats)) return true;

  if (state.settings && typeof (state.settings as any).minCrewHpPercent === 'undefined') return true;
  if (state.playerShip && (!(state.playerShip as any).reactor || !(state.playerShip as any).powerCapacity)) return true;

  if ((state as any).equipmentInventory && Array.isArray((state as any).equipmentInventory)) return true;
  if (state.playerShip && !(state.playerShip as any).purchasedRooms) return true;
  if (state.playerShip && !(state.playerShip as any).gridBounds) return true;

  // Check if items need flag migration
  if (state.inventory?.some((item: any) => !item.flags)) return true;
  if (state.crewRoster?.some((c: CrewMember) => c.inventory?.some((item: any) => !item.flags))) return true;

  return false;
}

/**
 * Migrate an old item to the new flag system
 * Infers flags from legacy property presence
 */
export function migrateItemToFlagSystem(item: any): Item {
  // If already migrated, return as-is
  if (item.flags) return item as Item;

  // Infer flags from legacy properties
  const hasSlotType = item.slotType !== undefined && item.slotType !== null;
  const flags: ItemFlags = createDefaultItemFlags({
    equippable: hasSlotType,
    passive: hasSlotType && (item.powerDraw === 0 || item.powerDraw === undefined),
    powered: hasSlotType && item.powerDraw > 0,
  });

  // Nest equipment data if equippable
  const equipment: EquipmentData | undefined = hasSlotType
    ? {
        slotType: item.slotType,
        tier: item.tier ?? 1,
        powerDraw: item.powerDraw ?? 0,
        effects: item.effects ?? [],
        compatibleRoomTypes: item.compatibleRoomTypes,
      }
    : undefined;

  return {
    id: item.id,
    name: item.name,
    description: item.description || 'No description',
    itemType: item.itemType || 'misc',
    rarity: item.rarity || 'common',
    category: item.category,
    value: item.value || 0,
    manufacturer: item.manufacturer || 'Unknown',
    flags,
    equipment,
    // Keep legacy fields for backward compatibility
    slotType: item.slotType,
    tier: item.tier,
    powerDraw: item.powerDraw,
    effects: item.effects,
    compatibleRoomTypes: item.compatibleRoomTypes,
  };
}

export function applyBasicMigrations(state: GameState): Partial<GameState> {
  const updates: Partial<GameState> = {};

  if (typeof state.cargoSwapPending === 'undefined') {
    updates.cargoSwapPending = null;
  }

  if (state.crewRoster && state.crewRoster.length > 0) {
    let didChange = false;
    const nextRoster = state.crewRoster.map((c) => {
      const inventory = c.inventory || [];
      const stats = (c as any).stats || { movement: { multiplier: 1 } };
      const hadMovement = !!(c as any).movement;
      if (!c.inventory || !(c as any).stats || hadMovement) {
        didChange = true;
      }

      return {
        ...c,
        inventory,
        stats,
        movement: undefined,
      } as CrewMember;
    });

    if (didChange) {
      updates.crewRoster = nextRoster;
    }
  }

  if (state.currentRun && (state.currentRun as any).collectedEquipment) {
    const run = state.currentRun;
    updates.currentRun = {
      ...run,
      collectedLoot: [
        ...run.collectedLoot,
        ...((run as any).collectedEquipment || []),
      ],
    };
    delete (updates.currentRun as any).collectedEquipment;
  }

  if (state.settings) {
    if (typeof (state.settings as any).minCrewHpPercent === 'undefined') {
      updates.settings = {
        ...state.settings,
        minCrewHpPercent: 50,
        minCrewStamina: 20,
        minCrewSanity: 20,
      };
    }
  }

  if (state.playerShip && (!(state.playerShip as any).reactor || !(state.playerShip as any).powerCapacity)) {
    const reactor = REACTORS['salvaged-reactor'];
    updates.playerShip = {
      ...state.playerShip,
      reactor,
      powerCapacity: reactor.powerOutput,
    } as any;
  }

  // Unified inventory migration (legacy equipmentInventory -> inventory)
  if ((state as any).equipmentInventory && Array.isArray((state as any).equipmentInventory) && (state as any).equipmentInventory.length > 0) {
    updates.inventory = [
      ...(state.inventory || []),
      ...((state as any).equipmentInventory || []),
    ];
    (updates as any).equipmentInventory = undefined;
  }

  // Ship expansion defaults
  if (state.playerShip) {
    const shipUpdates: any = {};
    if (!(state.playerShip as any).purchasedRooms) {
      shipUpdates.purchasedRooms = [];
    }
    if (!(state.playerShip as any).gridBounds) {
      shipUpdates.gridBounds = { width: 2, height: 2 };
    }
    if ((state.playerShip as any).rooms) {
      const rooms = (state.playerShip as any).rooms;
      const roomsUpdated = rooms.map((r: any) => {
        if (typeof r.damage === 'undefined') return { ...r, damage: 0 };
        return r;
      });
      if (roomsUpdated.some((r: any, i: number) => r.damage !== rooms[i].damage)) {
        shipUpdates.rooms = roomsUpdated;
      }
    }
    if (Object.keys(shipUpdates).length > 0) {
      updates.playerShip = { ...(state.playerShip as any), ...shipUpdates };
    }
  }

  // Migrate items to flag system
  if (state.inventory && state.inventory.some((item: any) => !item.flags)) {
    updates.inventory = state.inventory.map(migrateItemToFlagSystem);
  }

  // Migrate crew inventory items to flag system
  if (state.crewRoster && state.crewRoster.some((c) => c.inventory?.some((item: any) => !item.flags))) {
    const migratedRoster = state.crewRoster.map((c) => {
      if (c.inventory && c.inventory.length > 0 && c.inventory.some((item: any) => !item.flags)) {
        return {
          ...c,
          inventory: c.inventory.map(migrateItemToFlagSystem),
        };
      }
      return c;
    });
    updates.crewRoster = migratedRoster as any;
  }

  // Migrate current run items to flag system
  if (state.currentRun && state.currentRun.collectedLoot.some((item: any) => !item.flags)) {
    updates.currentRun = {
      ...state.currentRun,
      collectedLoot: state.currentRun.collectedLoot.map(migrateItemToFlagSystem),
    };
  }

  return updates;
}

export async function migrateGameState(
  state: GameState,
  _fromVersion: number,
): Promise<GameState> {
  const updates = applyBasicMigrations(state);
  const merged: GameState = { ...(state as any), ...(updates as any) };

  // Keep "crew" convenience field and selectedCrewId consistent.
  const selectedId = merged.selectedCrewId;
  const selectedCrew = selectedId
    ? merged.crewRoster.find((c) => c.id === selectedId)
    : undefined;
  const fallbackCrew = selectedCrew ?? merged.crewRoster[0];
  if (!fallbackCrew) {
    // If this happens, treat as incompatible upstream.
    return merged;
  }
  merged.crew = fallbackCrew;
  if (selectedId && !selectedCrew) {
    merged.selectedCrewId = null;
  }

  // Wreck layout/door migrations (async)
  if (Array.isArray((merged as any).availableWrecks)) {
    let wrecksMigrated = false;
    const wasmBridge = (await import('../game/wasm/WasmBridge')).default;
    const { Ship } = await import('../game/ship');
    const { SeededRandom } = await import('../game/random');

    const migratedWrecks = (merged as any).availableWrecks.map((wreck: any) => {
      const ship = wreck?.ship;
      if (ship && !ship.layout) {
        wrecksMigrated = true;
        const layoutTemplate =
          wreck.type === 'military'
            ? 'L-military'
            : wreck.type === 'science'
              ? 'Cross-science'
              : wreck.type === 'industrial'
                ? 'U-industrial'
                : wreck.type === 'luxury'
                  ? 'H-luxury'
                  : 'T-freighter';

        ship.layout = wasmBridge.generateShipLayoutSync(wreck.id, layoutTemplate);
      }

      if (ship && ship.layout && ship.grid) {
        wrecksMigrated = true;
        const tempShip = Object.assign(Object.create(Ship.prototype), ship);
        tempShip.rng = new SeededRandom(wreck.id);
        tempShip.regenerateDoorsForLayout(ship.layout);
        ship.grid = tempShip.grid;
        ship.entryPosition = tempShip.entryPosition;
      }

      return wreck;
    });

    if (wrecksMigrated) {
      (merged as any).availableWrecks = migratedWrecks;
    }
  }

  return merged;
}

export async function normalizeAndMigrateImportedSave(
  data: unknown,
  opts?: { fromVersion?: number },
): Promise<{ ok: true; state: GameState } | { ok: false; reason: string }> {
  const raw = extractRawGameState(data);
  if (!raw) {
    return { ok: false, reason: 'Invalid or incompatible save format' };
  }

  const migrated = await migrateGameState(raw, opts?.fromVersion ?? 0);
  if (!isValidSave(migrated)) {
    return { ok: false, reason: 'Save failed validation after migration' };
  }
  if (!Array.isArray(migrated.crewRoster) || migrated.crewRoster.length === 0) {
    return { ok: false, reason: 'Save has no crew roster' };
  }

  return { ok: true, state: migrated };
}

export function createSaveId(): string {
  return `save-${Date.now().toString(36)}`;
}
