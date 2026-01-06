/**
 * Crew Slice - Manages crew roster, hiring, and crew-specific operations
 * 
 * Responsibilities:
 * - Crew roster management (add/remove/update)
 * - Hiring system
 * - Crew selection
 * - Crew stat updates (HP, stamina, sanity)
 * - Crew position tracking
 * - Injury and death system
 * - Relationships between crew members
 * 
 * Extracted from gameStore.ts to improve maintainability.
 */
import type { StateCreator } from 'zustand';
import type {
  CrewMember,
  HireCandidate,
  GameState,
  DeadCrewMember,
  CrewRelationship,
  CrewStatus,
  CrewJob,
} from '../../types';
import {
  generateHireCandidates,
  generateCaptain,
} from '../../game/systems/CrewGenerator';
import {
  calculateCrewCapacity,
  getCrewAvailability as getCrewAvailabilityService,
} from '../../services/CrewService';
import {
  initializeRelationships,
} from '../../services/relationshipService';
import { BACKGROUNDS } from '../../game/data/backgrounds';
import {
  BASE_STAMINA,
  BASE_SANITY,
} from '../../game/constants';

/**
 * Crew slice state interface
 */
export interface CrewSliceState {
  // State
  crewRoster: CrewMember[];
  crew: CrewMember; // Backwards compatibility: active selected crew
  selectedCrewId: string | null;
  hireCandidates: HireCandidate[];
  deadCrew: DeadCrewMember[];
  relationships: CrewRelationship[];
}

/**
 * Crew slice actions interface
 */
export interface CrewSliceActions {
  // Crew management
  selectCrew: (crewId: string) => void;
  hireCrew: (candidate: HireCandidate) => boolean;
  dailyMarketRefresh: () => void;
  
  // Character creation
  createCaptain: (args: {
    firstName: string;
    lastName: string;
    lockedTrait: any;
    chosenTrait: any;
  }) => void;
  debugSkipCharacterCreation: () => void;
  
  // Crew operations
  healCrew: (amount: number) => void;
  healAllCrew: () => { healed: number; cost: number };
  payForHealing: () => boolean;
  getCrewAvailability: (crewId: string) => { available: boolean; reason?: string };
  
  // Skill system
  gainSkillXp: (skill: keyof CrewMember['skills'], amount: number) => void;
  
  // Inventory transfers
  transferItemToShip: (crewId: string, itemId: string) => boolean;
  transferAllItemsToShip: (crewId: string) => boolean;
  
  // Auto-salvage crew assignments
  assignCrewToRoom: (crewId: string, roomId: string) => void;
  
  // Movement system
  tickCrewMovement: (dtMs: number) => void;
}

/**
 * Create the crew slice
 */
export const createCrewSlice: StateCreator<
  GameState,
  [],
  [],
  CrewSliceState & CrewSliceActions
> = (set, get) => ({
  // Initial state
  crewRoster: [],
  crew: {} as CrewMember, // Placeholder, initialized in initializeGame
  selectedCrewId: null,
  hireCandidates: [],
  deadCrew: [],
  relationships: [],

  // Actions
  selectCrew: (crewId: string) => {
    set(() => ({ selectedCrewId: crewId }));
  },

  hireCrew: (candidate: HireCandidate) => {
    const state = get();
    const cost = candidate.cost;
    if (state.credits < cost) return false;

    const capacity = calculateCrewCapacity(state.playerShip);
    if (state.crewRoster.length >= capacity) return false;

    const background = candidate.background ?? 'station_rat';
    const bg = BACKGROUNDS[background];
    const staminaMod = bg?.statModifiers?.stamina || 0;
    const sanityMod = bg?.statModifiers?.sanity || 0;
    const maxStamina = BASE_STAMINA + staminaMod;
    const maxSanity = BASE_SANITY + sanityMod;

    const newCrew: CrewMember = {
      id:
        'crew-' +
        Date.now().toString(36) +
        '-' +
        Math.floor(Math.random() * 1000).toString(36),
      firstName: candidate.name,
      lastName: '',
      name: candidate.name,
      isPlayer: false,
      background,
      traits: candidate.traits ?? [],
      stats: { movement: { multiplier: 1 } },
      skills: candidate.skills,
      skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
      hp: 100,
      maxHp: 100,
      stamina: maxStamina,
      maxStamina,
      sanity: maxSanity,
      maxSanity,
      hiredDay: state.day,
      hireCost: cost,
      currentJob: 'idle',
      status: 'active',
      position: { location: 'station' },
      inventory: [],
      morale: 75,
    };

    const existingCrewIds = state.crewRoster.map((c) => c.id);
    const updatedRelationships = initializeRelationships(
      state.relationships || [],
      newCrew.id,
      existingCrewIds
    );

    set((s) => ({
      credits: s.credits - cost,
      crewRoster: s.crewRoster.concat(newCrew),
      crew: s.crew,
      relationships: updatedRelationships,
    }));

    return true;
  },

  dailyMarketRefresh: () => {
    const { day } = get();
    const candidates = generateHireCandidates(day, 3);
    set({ hireCandidates: candidates });
  },

  createCaptain: ({ firstName, lastName, lockedTrait, chosenTrait }) => {
    const captain = generateCaptain(
      firstName,
      lastName,
      lockedTrait as any,
      chosenTrait as any
    );
    set(() => ({
      crewRoster: [captain],
      crew: captain as any,
      selectedCrewId: captain.id,
      isNewGame: false,
    }));
    (get() as any).dailyMarketRefresh?.();
  },

  debugSkipCharacterCreation: () => {
    set({ isNewGame: false });
  },

  healCrew: (amount: number) => {
    const selected = get().selectedCrewId;
    set((state) => {
      const updated = state.crewRoster.map((c) =>
        c.id === selected
          ? {
              ...c,
              hp: Math.min(c.maxHp, c.hp + Math.floor(amount / 10) * 10),
              status: 'resting' as CrewStatus,
              currentJob: 'resting' as CrewJob,
            }
          : c
      );
      return {
        credits: Math.max(0, state.credits - amount),
        crewRoster: updated,
        crew: updated.find((c) => c.id === selected) ?? state.crew,
      };
    });
  },

  healAllCrew: () => {
    const state = get();
    const { crewRoster, credits } = state;
    const HEALING_COST = 50;
    const HEALING_AMOUNT = 10;

    let totalHealed = 0;
    let totalCost = 0;

    crewRoster.forEach((c) => {
      const hpNeeded = c.maxHp - c.hp;
      if (hpNeeded > 0) {
        const treatments = Math.ceil(hpNeeded / HEALING_AMOUNT);
        totalCost += treatments * HEALING_COST;
        totalHealed += Math.min(hpNeeded, treatments * HEALING_AMOUNT);
      }
    });

    if (totalCost === 0 || credits < totalCost) {
      return { healed: 0, cost: 0 };
    }

    set((state) => ({
      credits: state.credits - totalCost,
      crewRoster: state.crewRoster.map((c) => ({
        ...c,
        hp: c.maxHp,
        status: c.hp < c.maxHp ? ('resting' as CrewStatus) : c.status,
      })),
    }));

    return { healed: totalHealed, cost: totalCost };
  },

  payForHealing: () => {
    const state = get();
    const healingCost = 50;
    const healingAmount = 10;
    const selected = state.selectedCrewId;
    const crew =
      state.crewRoster.find((c) => c.id === selected) ?? state.crewRoster[0];

    if (state.credits < healingCost) return false;
    if (!crew || crew.hp >= crew.maxHp) return false;

    set((s) => {
      const updated = s.crewRoster.map((c) =>
        c.id === crew.id
          ? { ...c, hp: Math.min(c.hp + healingAmount, c.maxHp) }
          : c
      );
      return {
        credits: s.credits - healingCost,
        crewRoster: updated,
        crew: updated.find((c) => c.id === crew.id) ?? s.crew,
      };
    });
    return true;
  },

  getCrewAvailability: (crewId: string) => {
    const state = get();
    const crew = state.crewRoster.find((c) => c.id === crewId);
    if (!crew) {
      return { available: false, reason: 'Crew not found' };
    }
    return getCrewAvailabilityService(crew, state.settings);
  },

  gainSkillXp: (skill: keyof CrewMember['skills'], amount: number) => {
    const state = get();
    const selected = state.selectedCrewId;
    const crew =
      state.crewRoster.find((c) => c.id === selected) ?? state.crewRoster[0];
    if (!crew) return;

    const SKILL_XP_THRESHOLDS = [100, 250, 500, 1000];
    const currentXp = crew.skillXp[skill];
    const currentLevel = crew.skills[skill];
    const newXp = currentXp + amount;

    let newLevel = currentLevel;
    const cumulativeXp = SKILL_XP_THRESHOLDS.reduce((sum, threshold, idx) => {
      if (idx < currentLevel - 1) return sum + threshold;
      return sum;
    }, 0);

    if (currentLevel < 5) {
      const nextThreshold = SKILL_XP_THRESHOLDS[currentLevel - 1];
      const xpIntoCurrentLevel = newXp - cumulativeXp;
      if (xpIntoCurrentLevel >= nextThreshold) {
        newLevel = currentLevel + 1;
      }
    }

    set((state) => {
      const updated = state.crewRoster.map((c) =>
        c.id === crew.id
          ? {
              ...c,
              skillXp: { ...c.skillXp, [skill]: newXp },
              skills: { ...c.skills, [skill]: newLevel },
            }
          : c
      );
      return {
        crewRoster: updated,
        crew: updated.find((c) => c.id === crew.id) ?? state.crew,
        currentRun: state.currentRun
          ? {
              ...state.currentRun,
              stats: {
                ...state.currentRun.stats,
                xpGained: {
                  ...state.currentRun.stats.xpGained,
                  [skill]: (state.currentRun.stats.xpGained[skill] ?? 0) + amount,
                },
              },
            }
          : null,
      };
    });
  },

  transferItemToShip: (crewId: string, itemId: string) => {
    const state = get();
    const crew = state.crewRoster.find((c) => c.id === crewId);
    if (!crew) return false;

    const item = crew.inventory.find((i) => i.id === itemId);
    if (!item) return false;

    const run = state.currentRun;
    if (!run) return false;

    const ship = state.playerShip;
    const capacity = ship?.cargoCapacity ?? 10;
    const currentLoaded = run.collectedLoot.length;

    if (currentLoaded >= capacity) {
      set({ cargoSwapPending: { newItem: item, source: 'salvage' } });
      return false;
    }

    set((s) => ({
      crewRoster: s.crewRoster.map((c) =>
        c.id === crewId
          ? { ...c, inventory: c.inventory.filter((i) => i.id !== itemId) }
          : c
      ),
      crew: s.crewRoster.find((c) => c.id === crewId) ?? s.crew,
      currentRun: s.currentRun
        ? {
            ...s.currentRun,
            collectedLoot: s.currentRun.collectedLoot.concat(item),
          }
        : null,
    }));

    return true;
  },

  transferAllItemsToShip: (crewId: string) => {
    const state = get();
    const crew = state.crewRoster.find((c) => c.id === crewId);
    if (!crew || crew.inventory.length === 0) return true;

    for (const item of crew.inventory) {
      const success = (get() as any).transferItemToShip(crewId, item.id);
      if (!success) {
        return false;
      }
    }

    return true;
  },

  assignCrewToRoom: (crewId: string, roomId: string) => {
    set((state: any) => ({
      autoAssignments: { ...(state.autoAssignments || {}), [crewId]: roomId },
      crewRoster: (state.crewRoster || []).map((c: any) =>
        c.id === crewId
          ? {
              ...c,
              position: { location: 'wreck', roomId },
              currentJob: 'salvaging',
            }
          : c
      ),
    }));
  },

  tickCrewMovement: (dtMs: number) => {
    // Import at runtime to avoid circular dependencies
    const tickMovement = async () => {
      const { tickCrewMovementOnShip } = await import(
        '../../game/systems/CrewMovementSystem'
      );

      set((state) => {
        if (!state.crewRoster || state.crewRoster.length === 0) return {};

        const run = state.currentRun;
        const activeWreck = run
          ? state.availableWrecks.find((w) => w.id === run.wreckId)
          : undefined;

        const updatedRoster = state.crewRoster.map((crew) => {
          if (!crew.position) return crew;

          if (crew.position.location === 'station') {
            const ship = state.playerShip;
            if (!ship)
              return crew.movement ? { ...crew, movement: undefined } : crew;

            const moved = tickCrewMovementOnShip(
              ship,
              { ...crew, position: { ...crew.position, location: 'ship' as const } },
              dtMs,
              { allowWander: true }
            );
            return {
              ...moved,
              position: moved.position
                ? { ...moved.position, location: 'station' as const }
                : crew.position,
            };
          }

          if (crew.position.location === 'ship') {
            const ship = state.playerShip;
            if (!ship) return crew;
            return tickCrewMovementOnShip(ship, crew, dtMs, {
              allowWander: true,
            });
          }

          if (crew.position.location === 'wreck') {
            const ship = (activeWreck as any)?.ship;
            if (!ship) return crew;
            return tickCrewMovementOnShip(ship, crew, dtMs, {
              allowWander: true,
            });
          }

          return crew;
        });

        const selectedId = state.selectedCrewId;
        const selectedCrew = selectedId
          ? updatedRoster.find((c) => c.id === selectedId)
          : undefined;
        const crew = selectedCrew ?? updatedRoster[0] ?? state.crew;

        return { crewRoster: updatedRoster, crew };
      });
    };

    tickMovement().catch(console.error);
  },
});
