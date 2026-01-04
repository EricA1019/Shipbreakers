/**
 * Save Service
 * 
 * Handles save/load operations and save migrations.
 * These are utility functions for managing game persistence.
 */
import type { GameState, CrewMember } from '../types';
import { REACTORS } from '../game/data/reactors';

/**
 * Check if a save needs migration
 */
export function needsMigration(state: Partial<GameState>): boolean {
  // Check for various migration indicators
  if (typeof state.cargoSwapPending === 'undefined') return true;
  
  // Check crew inventory migration
  if (state.crewRoster?.some((c: CrewMember) => !c.inventory)) return true;
  
  // Check settings migration
  if (state.settings && typeof state.settings.minCrewHpPercent === 'undefined') return true;
  
  // Check reactor migration
  if (state.playerShip && (!state.playerShip.reactor || !state.playerShip.powerCapacity)) return true;
  
  return false;
}

/**
 * Apply basic (synchronous) migrations to a save state
 */
export function applyBasicMigrations(state: GameState): Partial<GameState> {
  const updates: Partial<GameState> = {};

  if (typeof state.cargoSwapPending === 'undefined') {
    updates.cargoSwapPending = null;
  }

  // Migrate crew to have inventory field
  if (state.crewRoster && state.crewRoster.length > 0) {
    const needsInventory = state.crewRoster.some((c) => !c.inventory);
    if (needsInventory) {
      updates.crewRoster = state.crewRoster.map((c) => ({
        ...c,
        inventory: c.inventory || [],
      }));
    }
  }

  // Migrate currentRun to remove collectedEquipment (unified into collectedLoot)
  if (state.currentRun && (state.currentRun as { collectedEquipment?: unknown }).collectedEquipment) {
    const run = state.currentRun;
    updates.currentRun = {
      ...run,
      collectedLoot: [
        ...run.collectedLoot,
        ...((run as { collectedEquipment?: [] }).collectedEquipment || []),
      ],
    };
    delete (updates.currentRun as { collectedEquipment?: unknown }).collectedEquipment;
  }

  // Ensure settings have crew work thresholds
  if (state.settings) {
    if (typeof state.settings.minCrewHpPercent === 'undefined') {
      updates.settings = {
        ...state.settings,
        minCrewHpPercent: 50,
        minCrewStamina: 20,
        minCrewSanity: 20,
      };
    }
  }

  // Ensure playerShip has reactor and powerCapacity
  if (state.playerShip && (!state.playerShip.reactor || !state.playerShip.powerCapacity)) {
    const reactor = REACTORS['salvaged-reactor'];
    updates.playerShip = {
      ...state.playerShip,
      reactor,
      powerCapacity: reactor.powerOutput,
    };
  }

  return updates;
}

/**
 * Export save to JSON string
 */
export function exportSave(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Parse save from JSON string
 */
export function parseSave(json: string): GameState | null {
  try {
    return JSON.parse(json) as GameState;
  } catch {
    return null;
  }
}

/**
 * Validate save data structure
 */
export function isValidSave(data: unknown): data is Partial<GameState> {
  if (typeof data !== 'object' || data === null) return false;
  
  const obj = data as Record<string, unknown>;
  
  // Check required fields
  if (typeof obj.credits !== 'number') return false;
  if (typeof obj.fuel !== 'number') return false;
  if (!Array.isArray(obj.crewRoster)) return false;
  
  return true;
}

/**
 * Create a clean save state identifier
 */
export function createSaveId(): string {
  return `save-${Date.now().toString(36)}`;
}
