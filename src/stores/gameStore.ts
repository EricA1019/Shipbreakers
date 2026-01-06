/**
 * Game Store - Unified Zustand store composed from feature slices
 * 
 * This file combines all feature slices (crew, economy, salvage, ship, events, core)
 * into a single unified store. The slice pattern improves maintainability by
 * organizing related state and actions into separate modules.
 * 
 * Refactored from a 2,223-line monolith to ~100 lines of slice composition.
 */
import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { GameState } from '../types';
import { SAVE_SCHEMA_VERSION, STORE_STORAGE_KEY, migrateGameState } from '../services/SaveService';

// Import all slices
import {
  createCrewSlice,
  type CrewSliceState,
  type CrewSliceActions,
} from './slices/crewSlice';
import {
  createEconomySlice,
  type EconomySliceState,
  type EconomySliceActions,
} from './slices/economySlice';
import {
  createSalvageSlice,
  type SalvageSliceState,
  type SalvageSliceActions,
  type AutoSalvageRules,
  type AutoSalvageResult,
} from './slices/salvageSlice';
import {
  createShipSlice,
  type ShipSliceState,
  type ShipSliceActions,
} from './slices/shipSlice';
import {
  createEventsSlice,
  type EventsSliceState,
  type EventsSliceActions,
} from './slices/eventsSlice';
import {
  createCoreSlice,
  type CoreSliceState,
  type CoreSliceActions,
} from './slices/coreSlice';

// Re-export types for backward compatibility
export type { AutoSalvageRules, AutoSalvageResult };

/**
 * Combined store type - merges all slice states and actions
 */
type CombinedStoreType = GameState &
  CrewSliceState &
  CrewSliceActions &
  EconomySliceState &
  EconomySliceActions &
  SalvageSliceState &
  SalvageSliceActions &
  ShipSliceState &
  ShipSliceActions &
  EventsSliceState &
  EventsSliceActions &
  CoreSliceState &
  CoreSliceActions;

/**
 * Main game store - composes all slices using Zustand's slice pattern
 */
export const useGameStore = create<CombinedStoreType>()(
  persist(
    (...a) => ({
      // Combine all slices
      ...createCrewSlice(...a),
      ...createEconomySlice(...a),
      ...createSalvageSlice(...a),
      ...createShipSlice(...a),
      ...createEventsSlice(...a),
      ...createCoreSlice(...a),
    }),
    {
      name: STORE_STORAGE_KEY,
      version: SAVE_SCHEMA_VERSION,
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw) as StorageValue<unknown> | null;
            if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) {
              localStorage.removeItem(name);
              return null;
            }
            const version =
              typeof (parsed as any).version === 'number'
                ? (parsed as any).version
                : 0;
            if (version > SAVE_SCHEMA_VERSION) {
              localStorage.removeItem(name);
              return null;
            }
            return parsed as any;
          } catch {
            localStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      } satisfies PersistStorage<any>,
      partialize: (state) => {
        const persisted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(state)) {
          if (typeof value !== 'function') {
            persisted[key] = value;
          }
        }
        return persisted as any;
      },
      migrate: async (persistedState, version) => {
        try {
          const migrated = await migrateGameState(persistedState as any, version);
          const hasCrew =
            Array.isArray((migrated as any)?.crewRoster) &&
            (migrated as any).crewRoster.length > 0;
          const hasCredits = typeof (migrated as any)?.credits === 'number';
          const hasFuel = typeof (migrated as any)?.fuel === 'number';

          if (!hasCrew || !hasCredits || !hasFuel) {
            localStorage.removeItem(STORE_STORAGE_KEY);
            return {} as any;
          }

          return migrated as any;
        } catch {
          localStorage.removeItem(STORE_STORAGE_KEY);
          return {} as any;
        }
      },
    }
  )
);

// For debugging
// @ts-ignore
window.gameStore = useGameStore;
