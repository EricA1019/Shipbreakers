/**
 * Core Slice - Manages core game state (initialization, settings, stats, days)
 * 
 * Responsibilities:
 * - Game initialization and reset
 * - Game settings
 * - Player stats tracking
 * - Day/time progression
 * - New game state
 * 
 * Extracted from gameStore.ts to improve maintainability.
 */
import type { StateCreator } from 'zustand';
import type { GameState, GameSettings, GraveyardZone, PlayerStats } from '../../types';
import { initializePlayerShip } from '../../game/data/playerShip';
import { generateAvailableWrecks, generateWreck } from '../../game/wreckGenerator';
import { EQUIPMENT } from '../../game/data/equipment';
import {
  STARTING_CREDITS,
  STARTING_FUEL,
  STARTING_FOOD,
  STARTING_DRINK,
  STARTING_LUXURY_DRINK,
  PANTRY_CAPACITY,
  TIER_ROOM_BASE,
  STARTING_HP,
  BASE_STAMINA,
  BASE_SANITY,
} from '../../game/constants';
import type { CrewMember } from '../../types';

/**
 * Core slice state interface
 */
export interface CoreSliceState {
  // State
  day: number;
  stats: PlayerStats;
  settings: GameSettings;
  isNewGame?: boolean;
}

/**
 * Core slice actions interface
 */
export interface CoreSliceActions {
  // Game lifecycle
  initializeGame: () => void;
  resetGame: () => void;
  
  // Settings
  updateSettings: (settings: Partial<GameSettings>) => void;
}

/**
 * Create the core slice
 */
export const createCoreSlice: StateCreator<
  GameState,
  [],
  [],
  CoreSliceState & CoreSliceActions
> = (set, get) => ({
  // Initial state
  day: 1,
  stats: {
    totalCreditsEarned: 0,
    totalWrecksCleared: 0,
    totalRoomsSalvaged: 0,
    totalItemsCollected: 0,
    highestSingleProfit: 0,
    mostValuableItem: null,
    longestWinStreak: 0,
    deathsAvoided: 0,
    licensesRenewed: 0,
    daysPlayed: 0,
  },
  settings: {
    autoSave: true,
    confirmDialogs: true,
    showTooltips: true,
    showKeyboardHints: true,
    minCrewHpPercent: 50,
    minCrewStamina: 20,
    minCrewSanity: 20,
  },
  isNewGame: true,

  // Actions
  initializeGame: () => {
    const startingZones: GraveyardZone[] = ['near'];
    set({
      credits: STARTING_CREDITS,
      fuel: STARTING_FUEL,
      crewRoster: [
        {
          id: 'captain-1',
          firstName: 'Player',
          lastName: 'Captain',
          name: 'Player Captain',
          isPlayer: true,
          background: 'ship_captain' as const,
          traits: ['steady', 'pragmatic'] as const,
          skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
          skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
          hp: STARTING_HP,
          maxHp: STARTING_HP,
          stamina: BASE_STAMINA,
          maxStamina: BASE_STAMINA,
          sanity: BASE_SANITY,
          maxSanity: BASE_SANITY,
          currentJob: 'idle' as const,
          status: 'active' as const,
          position: { location: 'station' },
          inventory: [],
        } as CrewMember,
      ],
      selectedCrewId: 'captain-1',
      crew: {
        id: 'captain-1',
        firstName: 'Player',
        lastName: 'Captain',
        name: 'Player Captain',
        isPlayer: true,
        background: 'ship_captain',
        traits: ['steady', 'pragmatic'],
        skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
        skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
        hp: STARTING_HP,
        maxHp: STARTING_HP,
        stamina: BASE_STAMINA,
        maxStamina: BASE_STAMINA,
        sanity: BASE_SANITY,
        maxSanity: BASE_SANITY,
        currentJob: 'idle',
        status: 'active',
        position: { location: 'station' },
        inventory: [],
      } as any,
      hireCandidates: [],
      availableWrecks: generateAvailableWrecks(startingZones),
      currentRun: null,
      inventory: [],
      day: 1,
      licenseDaysRemaining: 14,
      licenseFee: 5000,
      licenseTier: 'basic' as const,
      unlockedZones: startingZones,
      stats: {
        totalCreditsEarned: 0,
        totalWrecksCleared: 0,
        totalRoomsSalvaged: 0,
        totalItemsCollected: 0,
        highestSingleProfit: 0,
        mostValuableItem: null,
        longestWinStreak: 0,
        deathsAvoided: 0,
        licensesRenewed: 0,
        daysPlayed: 0,
      },
      settings: {
        autoSave: true,
        confirmDialogs: true,
        showTooltips: true,
        showKeyboardHints: true,
        minCrewHpPercent: 50,
        minCrewStamina: 20,
        minCrewSanity: 20,
      },
      isNewGame: true,
      lastUnlockedZone: null,
      deadCrew: [],
      relationships: [],
      activeEventChain: null,
      food: STARTING_FOOD,
      drink: STARTING_DRINK,
      luxuryDrink: STARTING_LUXURY_DRINK,
      pantryCapacity: PANTRY_CAPACITY,
      daysWithoutFood: 0,
      beerRationDays: 0,
      crewEfficiencyPenalty: 0,
      activeEvent: null,
      playerShip: (() => {
        const ship = initializePlayerShip('player-ship');
        const engineRoom = ship.grid
          .flat()
          .find((r: any) => r.roomType === 'engine') as any;
        const medbayRoom = ship.grid
          .flat()
          .find((r: any) => r.roomType === 'medbay') as any;
        if (engineRoom?.slots?.[0]) {
          engineRoom.slots[0].installedItem = EQUIPMENT['cutting-torch'];
        }
        if (medbayRoom?.slots?.[0]) {
          medbayRoom.slots[0].installedItem = EQUIPMENT['trauma-kit'];
        }
        return ship;
      })(),
    });

    (get() as any).dailyMarketRefresh?.();

    set((state) => {
      const arr = state.availableWrecks.slice();
      const tut = generateWreck('tutorial-seed');
      tut.tier = 1;
      tut.distance = 1.5;
      tut.rooms = tut.rooms.slice(0, TIER_ROOM_BASE + 1);
      arr[0] = tut;
      return { availableWrecks: arr };
    });

    (async () => {
      try {
        const populated = await (
          await import('../../game/wreckGenerator')
        ).populateWreckNames(get().availableWrecks);
        set({ availableWrecks: populated });
      } catch (e) {
        console.warn('Failed to populate wreck names', e);
      }
    })();
  },

  resetGame: () => {
    set({
      credits: STARTING_CREDITS,
      fuel: STARTING_FUEL,
      isNewGame: true,
      lastUnlockedZone: null,
      crewRoster: [
        {
          id: 'captain-1',
          name: 'Player',
          isPlayer: true,
          skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 } as any,
          skillXp: {
            technical: 100,
            combat: 100,
            salvage: 100,
            piloting: 100,
          },
          hp: STARTING_HP,
          maxHp: STARTING_HP,
        } as CrewMember,
      ],
      selectedCrewId: 'captain-1',
      crew: {
        name: 'Player',
        skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 } as any,
        skillXp: {
          technical: 100,
          combat: 100,
          salvage: 100,
          piloting: 100,
        },
        hp: STARTING_HP,
        maxHp: STARTING_HP,
      } as any,
      hireCandidates: [],
      availableWrecks: generateAvailableWrecks(['near']),
      currentRun: null,
      playerShip: initializePlayerShip('player-ship'),
      inventory: [],
    });

    set((state) => {
      const arr = state.availableWrecks.slice();
      const tut = generateWreck('tutorial-seed');
      tut.tier = 1;
      tut.distance = 1.5;
      tut.rooms = tut.rooms.slice(0, TIER_ROOM_BASE + 1);
      arr[0] = tut;
      return { availableWrecks: arr };
    });

    (async () => {
      try {
        const populated = await (
          await import('../../game/wreckGenerator')
        ).populateWreckNames(get().availableWrecks);
        set({ availableWrecks: populated });
      } catch (e) {
        console.warn('Failed to populate wreck names', e);
      }
    })();
  },

  updateSettings: (settings: Partial<GameSettings>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
      },
    }));
  },
});
