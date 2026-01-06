/**
 * Salvage Slice - Manages salvage runs, wreck exploration, and loot collection
 * 
 * Responsibilities:
 * - Wreck generation and management
 * - Salvage run state (traveling, salvaging, returning)
 * - Room salvaging operations
 * - Loot collection and inventory
 * - Auto-salvage system
 * - Emergency evacuation
 * 
 * Extracted from gameStore.ts to improve maintainability.
 */
import type { StateCreator } from 'zustand';
import type {
  GameState,
  Wreck,
  RunState,
  Loot,
  Item,
} from '../../types';
import {
  generateAvailableWrecks,
} from '../../game/wreckGenerator';
import {
  STARTING_TIME,
  FUEL_COST_PER_AU,
  SCAN_COST,
  PILOTING_FUEL_REDUCTION_PER_LEVEL,
  RARITY_TIME_COST,
  SKILL_HAZARD_MAP,
  XP_BASE_SUCCESS,
  XP_BASE_FAIL,
  XP_PER_HAZARD_LEVEL,
  XP_PER_TIER,
  STAMINA_PER_SALVAGE,
  SANITY_LOSS_BASE,
  TRAVEL_EVENT_CHANCE,
  SALVAGE_EVENT_CHANCE,
  STAMINA_RECOVERY_STATION,
  SANITY_RECOVERY_STATION,
  DAILY_FOOD_PER_CREW,
  DAILY_DRINK_PER_CREW,
  DAILY_EVENT_CHANCE,
  HUB_EVENT_CHANCE,
  MORALE_RECOVERY_PER_DAY,
} from '../../game/constants';
import {
  calculateHazardSuccess,
  damageOnFail,
  calculateLootValue,
} from '../../game/hazardLogic';
import { getActiveEffects } from '../../game/systems/slotManager';
import { pickEventByTrigger } from '../../game/systems/EventManager';
import {
  calculateTraitEffects,
  getSpecialTraits,
} from '../../game/systems/TraitEffectResolver';
import {
  determineCrewStatus,
  getCrewAvailability,
  selectBestCrewForRoom,
} from '../../services/CrewService';
import {
  handleCrewDown,
  processInjuryRecovery,
  updateCrewMorale,
} from '../../services/injuryService';
import {
  processWorkTogether,
  calculateRelationshipMorale,
} from '../../services/relationshipService';

// Auto-salvage types (keeping in this slice for now)
export interface AutoSalvageRules {
  maxHazardLevel: number;
  priorityRooms: ('cargo' | 'labs' | 'armory' | 'any')[];
  stopOnInjury: boolean;
  stopOnLowStamina: number;
  stopOnLowSanity: number;
}

export interface AutoSalvageResult {
  roomsSalvaged: number;
  lootCollected: number;
  creditsEarned: number;
  stopReason: 'complete' | 'cargo_full' | 'time_out' | 'crew_exhausted' | 'injury' | 'cancelled';
  injuries: number;
}

let autoSalvageRunning = false;
let autoSalvageCancelled = false;

/**
 * Salvage slice state interface
 */
export interface SalvageSliceState {
  // State
  availableWrecks: Wreck[];
  currentRun: RunState | null;
  inventory: Item[];
  cargoSwapPending?: {
    newItem: Loot | Item;
    source: 'salvage' | 'shop';
  } | null;
  autoSalvageEnabled?: boolean;
  autoAssignments?: Record<string, string> | null;
}

/**
 * Salvage slice actions interface
 */
export interface SalvageSliceActions {
  // Wreck management
  scanForWrecks: () => void;
  
  // Run management
  startRun: (wreckId: string) => void;
  travelToWreck: (wreckId: string) => void;
  returnToStation: () => void;
  emergencyEvacuate: () => void;
  
  // Salvage operations
  salvageRoom: (roomId: string) => { success: boolean; damage: number };
  salvageItem: (
    roomId: string,
    itemId: string
  ) => { success: boolean; damage: number; timeCost: number };
  cutIntoRoom: (roomId: string) => { success: boolean };
  
  // Loot management
  sellAllLoot: () => void;
  sellItem: (itemId: string) => void;
  handleCargoSwap: (dropItemId: string) => void;
  cancelCargoSwap: () => void;
  
  // Auto-salvage
  setAutoSalvageEnabled: (enabled: boolean) => void;
  runAutoSalvageTick: () => void;
  runAutoSalvage: (
    rules: AutoSalvageRules,
    speed: 1 | 2
  ) => Promise<AutoSalvageResult>;
  stopAutoSalvage: () => void;
}

/**
 * Create the salvage slice
 */
export const createSalvageSlice: StateCreator<
  GameState,
  [],
  [],
  SalvageSliceState & SalvageSliceActions
> = (set, get) => ({
  // Initial state
  availableWrecks: [],
  currentRun: null,
  inventory: [],
  cargoSwapPending: null,
  autoSalvageEnabled: false,
  autoAssignments: {},

  // Actions
  scanForWrecks: () => {
    set((state) => ({
      credits: Math.max(0, state.credits - SCAN_COST),
      availableWrecks: generateAvailableWrecks(state.unlockedZones as any),
    }));

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

  startRun: (wreckId: string) => {
    const wreck = get().availableWrecks.find((w) => w.id === wreckId);
    if (!wreck) return;

    const getActiveCrew = () => {
      const roster = get().crewRoster || [];
      const selected = get().selectedCrewId;
      return roster.find((c) => c.id === selected) ?? roster[0];
    };
    const piloting = getActiveCrew()?.skills.piloting ?? 0;
    const reduction = Math.max(
      0,
      1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL
    );
    const activeEffects = getActiveEffects(get().playerShip as any);
    const fuelEfficiency =
      activeEffects
        .filter((e: any) => e.type === 'fuel_efficiency')
        .reduce((s: number, e: any) => s + e.value, 0) / 100;
    const finalReduction = Math.max(0, reduction * (1 - fuelEfficiency));
    const travelCost = Math.max(
      1,
      Math.ceil(wreck.distance * FUEL_COST_PER_AU * finalReduction)
    );
    if (get().fuel < travelCost * 2) return;

    set((state) => ({
      fuel: state.fuel - travelCost,
      currentRun: {
        wreckId: wreck.id,
        status: 'traveling',
        timeRemaining: STARTING_TIME,
        collectedLoot: [],
        stats: {
          roomsAttempted: 0,
          roomsSucceeded: 0,
          roomsFailed: 0,
          damageTaken: 0,
          fuelSpent: travelCost,
          xpGained: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
        },
      },
    }));
  },

  travelToWreck: (wreckId: string) => {
    const wreck = get().availableWrecks.find((w) => w.id === wreckId);
    if (!wreck) return;

    if (
      wreck.name === 'Unknown Vessel' &&
      (wreck as any).ship?.name &&
      (wreck as any).ship.name !== 'Unknown Vessel'
    ) {
      set((state) => ({
        availableWrecks: state.availableWrecks.map((w) =>
          w.id === wreck.id ? { ...w, name: (wreck as any).ship.name } : w
        ),
      }));
    }

    const getActiveCrew = () => {
      const roster = get().crewRoster || [];
      const selected = get().selectedCrewId;
      return roster.find((c) => c.id === selected) ?? roster[0];
    };
    const piloting = getActiveCrew()?.skills.piloting ?? 0;
    const reduction = Math.max(
      0,
      1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL
    );
    const activeEffects = getActiveEffects(get().playerShip as any);
    const fuelEfficiency =
      activeEffects
        .filter((e: any) => e.type === 'fuel_efficiency')
        .reduce((s: number, e: any) => s + e.value, 0) / 100;
    const finalReduction = Math.max(0, reduction * (1 - fuelEfficiency));
    const travelCost = Math.max(
      1,
      Math.ceil(wreck.distance * FUEL_COST_PER_AU * finalReduction)
    );

    set((state) => ({
      fuel: state.fuel - travelCost,
      currentRun: state.currentRun
        ? { ...state.currentRun, status: 'salvaging' }
        : null,
      crewRoster: (state.crewRoster || []).map((c) => ({
        ...c,
        position: { location: 'wreck' as const },
      })),
    }));

    if (Math.random() < TRAVEL_EVENT_CHANCE) {
      const ev = pickEventByTrigger('travel', get() as any);
      if (ev) set({ activeEvent: ev });
    }
  },

  cutIntoRoom: (roomId: string) => {
    const run = get().currentRun;
    if (!run) return { success: false };
    const wreck = get().availableWrecks.find((w) => w.id === run.wreckId)!;

    const room = wreck.rooms.find((r) => r.id === roomId);
    const ship = (wreck as any).ship;
    let gridCell: any = null;
    if (ship?.grid) {
      for (const row of ship.grid) {
        for (const cell of row) {
          if (cell.id === roomId) {
            gridCell = cell;
            break;
          }
        }
        if (gridCell) break;
      }
    }

    const isSealed = room?.sealed || gridCell?.sealed;
    if (!isSealed) return { success: false };

    const newTime = run.timeRemaining - 1;
    if (newTime < 0) return { success: false };

    if (room) room.sealed = false;
    if (gridCell) gridCell.sealed = false;

    set((state) => ({
      currentRun: state.currentRun
        ? {
            ...state.currentRun,
            timeRemaining: newTime,
          }
        : null,
    }));

    return { success: true };
  },

  salvageRoom: () => {
    return { success: false, damage: 0 };
  },

  salvageItem: (roomId: string, itemId: string) => {
    // This is a large function - keeping implementation from gameStore
    // (See original implementation in attached gameStore.ts)
    // Implementation preserved as-is to avoid breaking changes
    const run = get().currentRun;
    if (!run) return { success: false, damage: 0, timeCost: 0 };
    const wreck = get().availableWrecks.find((w) => w.id === run.wreckId)!;
    const room = wreck.rooms.find((r) => r.id === roomId);
    if (!room || room.looted)
      return { success: false, damage: 0, timeCost: 0 };

    const item = room.loot.find((l) => l.id === itemId);
    if (!item) return { success: false, damage: 0, timeCost: 0 };

    const getActiveCrew = () => {
      const roster = get().crewRoster || [];
      const selected = get().selectedCrewId;
      return roster.find((c) => c.id === selected) ?? roster[0];
    };
    const activeCrew = getActiveCrew();

    const availability = getCrewAvailability(activeCrew, get().settings);
    if (!availability.available) {
      return { success: false, damage: 0, timeCost: 0 };
    }

    const traitMods = calculateTraitEffects(activeCrew);

    set((state) => ({
      currentRun: state.currentRun
        ? {
            ...state.currentRun,
            stats: {
              ...state.currentRun.stats,
              roomsAttempted: state.currentRun.stats.roomsAttempted + 1,
            },
          }
        : null,
    }));

    const baseTimeCost = RARITY_TIME_COST[item.rarity];
    const timeCost = Math.max(
      1,
      Math.round(baseTimeCost * (1 + traitMods.workSpeedMod / 100))
    );
    const newTime = run.timeRemaining - timeCost;

    const specialTraits = getSpecialTraits(activeCrew);

    if (
      specialTraits.hasCoward &&
      !specialTraits.hasBrave &&
      room.hazardLevel >= 3
    ) {
      if (Math.random() < 0.2) {
        set((state) => ({
          currentRun: state.currentRun
            ? { ...state.currentRun, timeRemaining: newTime }
            : null,
        }));
        return { success: false, damage: 0, timeCost, fled: true };
      }
    }

    let successChance = calculateHazardSuccess(
      activeCrew.skills,
      room.hazardType as any,
      room.hazardLevel,
      wreck.tier
    );

    successChance += traitMods.skillMod;
    successChance = Math.max(0, Math.min(100, successChance));
    const roll = Math.random() * 100;
    let damageTaken = 0;
    let success = false;

    const matchingSkill = SKILL_HAZARD_MAP[room.hazardType as any] as keyof typeof activeCrew.skills;

    const xpSuccess =
      XP_BASE_SUCCESS +
      room.hazardLevel * XP_PER_HAZARD_LEVEL +
      wreck.tier * XP_PER_TIER;
    const xpFail =
      XP_BASE_FAIL +
      Math.floor(
        (room.hazardLevel * XP_PER_HAZARD_LEVEL + wreck.tier * XP_PER_TIER) / 2
      );

    const baseStaminaDrain = STAMINA_PER_SALVAGE;
    const staminaDrain = Math.max(
      1,
      Math.round(baseStaminaDrain * (1 + traitMods.staminaMod / 100))
    );

    const baseSanityLoss = room.hazardLevel >= 3 ? SANITY_LOSS_BASE : 0;
    const sanityLoss = Math.max(
      0,
      Math.round(baseSanityLoss * (1 + traitMods.sanityMod / 100))
    );

    if (roll < Math.max(0, successChance)) {
      success = true;
      const activeEffects = getActiveEffects(get().playerShip as any);
      let adjustedItem = {
        ...item,
        value: Math.round(
          calculateLootValue(item.value, activeCrew.skills.salvage, activeEffects) *
            (1 + traitMods.lootMod / 100)
        ),
      };

      let stolenByGreedy = false;
      if (specialTraits.hasGreedy && Math.random() < 0.05) {
        stolenByGreedy = true;
      }

      set((state) => ({
        currentRun: state.currentRun
          ? {
              ...state.currentRun,
              timeRemaining: newTime,
              stats: {
                ...state.currentRun.stats,
                roomsSucceeded: state.currentRun.stats.roomsSucceeded + 1,
              },
            }
          : null,
        crewRoster: state.crewRoster.map((c) =>
          c.id === activeCrew.id
            ? {
                ...c,
                inventory: stolenByGreedy ? c.inventory : [adjustedItem],
                stamina: Math.max(0, c.stamina - staminaDrain),
                sanity: Math.max(0, c.sanity - sanityLoss),
              }
            : c
        ),
        crew:
          state.crewRoster.find((c) => c.id === activeCrew.id) ?? state.crew,
        availableWrecks: state.availableWrecks.map((w) =>
          w.id === wreck.id
            ? {
                ...w,
                rooms: w.rooms.map((r) => {
                  if (r.id === room.id) {
                    const remainingLoot = r.loot.filter(
                      (l) => l.id !== itemId
                    );
                    return {
                      ...r,
                      loot: remainingLoot,
                      looted: remainingLoot.length === 0,
                    };
                  }
                  return r;
                }),
              }
            : w
        ),
      }));

      (get() as any).gainSkillXp(matchingSkill, xpSuccess);

      if (Math.random() < SALVAGE_EVENT_CHANCE && !get().activeEvent) {
        const ev = pickEventByTrigger('salvage', get() as any);
        if (ev) set({ activeEvent: ev });
      }
    } else {
      damageTaken = damageOnFail(room.hazardLevel);

      const newHp = Math.max(0, activeCrew.hp - damageTaken);
      const crewWentDown = newHp === 0 && activeCrew.hp > 0;

      set((state) => {
        let updated = state.crewRoster.map((c) =>
          c.id === activeCrew.id
            ? {
                ...c,
                hp: newHp,
                stamina: Math.max(0, c.stamina - staminaDrain),
                sanity: Math.max(0, c.sanity - sanityLoss),
              }
            : c
        );

        let deadCrew = state.deadCrew || [];
        let relationships = state.relationships || [];

        if (crewWentDown) {
          const otherCrewIds = state.crewRoster
            .filter((c) => c.id !== activeCrew.id)
            .map((c) => c.id);

          const result = handleCrewDown(
            activeCrew,
            `Salvage accident in ${room.name || 'unknown room'}`,
            state.day,
            relationships,
            otherCrewIds
          );

          if (result.outcome === 'death') {
            updated = updated.filter((c) => c.id !== activeCrew.id);
            if (result.deadCrewRecord) {
              deadCrew = [...deadCrew, result.deadCrewRecord];
            }
          } else if (result.injury) {
            updated = updated.map((c) =>
              c.id === activeCrew.id
                ? {
                    ...c,
                    injury: result.injury,
                    status: 'injured' as any,
                    hp: 1,
                  }
                : c
            );
          }

          for (const impact of result.moraleImpacts) {
            updated = updated.map((c) =>
              c.id === impact.crewId
                ? updateCrewMorale(c, impact.amount, impact.reason)
                : c
            );
          }
        }

        return {
          currentRun: state.currentRun
            ? {
                ...state.currentRun,
                timeRemaining: newTime,
                stats: {
                  ...state.currentRun.stats,
                  roomsFailed: state.currentRun.stats.roomsFailed + 1,
                  damageTaken: state.currentRun.stats.damageTaken + damageTaken,
                },
              }
            : null,
          crewRoster: updated,
          crew:
            updated.find((c) => c.id === activeCrew.id) ?? updated[0] ?? state.crew,
          deadCrew,
          relationships,
        };
      });

      (get() as any).gainSkillXp(matchingSkill, xpFail);
    }

    return { success, damage: damageTaken, timeCost };
  },

  returnToStation: () => {
    const run = get().currentRun;
    if (!run) return;

    const wreck = get().availableWrecks.find((w) => w.id === run.wreckId);
    if (!wreck) {
      console.error('Wreck not found for return trip');
      return;
    }

    const piloting = get().crew.skills.piloting ?? 0;
    const reduction = Math.max(
      0,
      1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL
    );
    const activeEffects = getActiveEffects(get().playerShip as any);
    const fuelEfficiency =
      activeEffects
        .filter((e: any) => e.type === 'fuel_efficiency')
        .reduce((s: number, e: any) => s + e.value, 0) / 100;
    const finalReduction = Math.max(0, reduction * (1 - fuelEfficiency));
    const returnCost = Math.max(
      1,
      Math.ceil(wreck.distance * FUEL_COST_PER_AU * finalReduction)
    );

    const daysSpent = Math.max(1, Math.ceil(wreck.distance / 10));

    const crewCount = (get().crewRoster || []).length;
    const dailyFood = DAILY_FOOD_PER_CREW * crewCount;
    const dailyDrink = DAILY_DRINK_PER_CREW * crewCount;

    let food = (get() as any).food ?? 0;
    let drink = (get() as any).drink ?? 0;
    let luxuryDrink = (get() as any).luxuryDrink ?? 0;
    let daysWithoutFood = (get() as any).daysWithoutFood ?? 0;
    let beerRationDays = (get() as any).beerRationDays ?? 0;

    for (let d = 0; d < daysSpent; d++) {
      if (food >= dailyFood) {
        food -= dailyFood;
        daysWithoutFood = 0;
      } else {
        food = 0;
        daysWithoutFood += 1;
      }

      if (drink >= dailyDrink) {
        drink -= dailyDrink;
      } else {
        const deficit = dailyDrink - drink;
        drink = 0;
        if (luxuryDrink >= deficit) {
          luxuryDrink -= deficit;
          beerRationDays += 1;
        } else {
          luxuryDrink = 0;
        }
      }
    }

    set((state) => ({
      fuel: Math.max(0, state.fuel - returnCost),
      day: state.day + daysSpent,
      licenseDaysRemaining: Math.max(0, state.licenseDaysRemaining - daysSpent),
      currentRun: {
        ...run,
        status: 'completed',
        stats: {
          ...run.stats,
          fuelSpent: run.stats.fuelSpent + returnCost,
        },
      },
      stats: {
        ...state.stats,
        daysPlayed: state.stats.daysPlayed + daysSpent,
      },
      food,
      drink,
      luxuryDrink,
      daysWithoutFood,
      beerRationDays,
      crewEfficiencyPenalty: beerRationDays > 0 ? 2 : 0,
      crewRoster: (state.crewRoster || []).map((c) => ({
        ...c,
        position: { location: 'station' as const },
      })),
    }));

    const roster = get().crewRoster || [];
    const updatedRoster = roster.map((c) => {
      let newHp = c.hp;
      let newSanity = c.sanity;
      let newStamina = c.stamina;

      if (daysWithoutFood >= 3) {
        newHp = Math.max(0, newHp - 5 * (daysWithoutFood - 2));
      }

      if (drink === 0 && luxuryDrink === 0) {
        newSanity = Math.max(0, newSanity - 10);
      }

      if (c.status === 'resting') {
        newHp = Math.min(c.maxHp, newHp + 10);
        newStamina = Math.min(c.maxStamina, newStamina + 30);
        newSanity = Math.min(c.maxSanity, newSanity + 20);
      } else {
        newStamina = Math.min(c.maxStamina, newStamina + STAMINA_RECOVERY_STATION);
        newSanity = Math.min(c.maxSanity, newSanity + SANITY_RECOVERY_STATION);
      }

      const updatedCrew = {
        ...c,
        hp: newHp,
        sanity: newSanity,
        stamina: newStamina,
      };

      const newStatus = determineCrewStatus(updatedCrew);

      if (
        c.status === 'resting' &&
        newHp >= 80 &&
        newStamina >= 70 &&
        newSanity >= 70
      ) {
        return {
          ...updatedCrew,
          status: 'active' as any,
          currentJob: 'idle' as any,
        };
      }

      return { ...updatedCrew, status: newStatus as any };
    });

    set({ crewRoster: updatedRoster });

    for (let d = 0; d < daysSpent; d++) {
      const { updatedRoster: healedRoster, recoveredCrew } =
        processInjuryRecovery(get().crewRoster);
      if (recoveredCrew.length > 0) {
        console.log(
          `Crew recovered from injuries: ${recoveredCrew.join(', ')}`
        );
      }
      set({ crewRoster: healedRoster });
    }

    const crewWhoWorked = get()
      .crewRoster.filter((c) => c.status === 'active' && !c.injury)
      .map((c) => c.id);

    if (crewWhoWorked.length >= 2) {
      const updatedRelationships = processWorkTogether(
        get().relationships || [],
        crewWhoWorked
      );
      set({ relationships: updatedRelationships });
    }

    const currentRoster = get().crewRoster;
    const relationships = get().relationships || [];
    const moraleUpdatedRoster = currentRoster.map((c) => {
      const relationshipBonus = calculateRelationshipMorale(relationships, c.id);
      const baseMorale = c.morale ?? 75;
      const newMorale = Math.min(
        100,
        Math.max(0, baseMorale + MORALE_RECOVERY_PER_DAY + relationshipBonus)
      );
      return { ...c, morale: newMorale };
    });
    set({ crewRoster: moraleUpdatedRoster });

    const breakdownCrew = get().crewRoster.find((c) => c.status === 'breakdown');
    if (breakdownCrew && !get().activeEvent) {
      const breakdownEvent = pickEventByTrigger('daily', get() as any);
      if (breakdownEvent) set({ activeEvent: breakdownEvent });
    }

    (get() as any).dailyMarketRefresh?.();

    if (Math.random() < DAILY_EVENT_CHANCE) {
      const ev = pickEventByTrigger('daily', get() as any);
      if (ev) set({ activeEvent: ev });
    }

    if (!get().activeEvent && Math.random() < HUB_EVENT_CHANCE) {
      const ev = pickEventByTrigger('hub', get() as any);
      if (ev) set({ activeEvent: ev });
    }
  },

  emergencyEvacuate: () => {
    const run = get().currentRun;
    if (!run) return;

    let abandonedValue = 0;

    get().crewRoster.forEach((crew) => {
      crew.inventory.forEach((item) => {
        abandonedValue += item.value;
      });
    });

    run.collectedLoot.forEach((item) => {
      abandonedValue += item.value;
    });

    try {
      const audio = new Audio(
        '/assets/audio/SCI-FI_UI_SFX_PACK/Glitches/Glitch_19.wav'
      );
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    set((state) => ({
      crewRoster: state.crewRoster.map((c) => ({
        ...c,
        inventory: [],
        position: { location: 'station' },
      })),
      currentRun: null,
    }));

    (get() as any).returnToStation?.();

    set({ currentRun: null });
  },

  sellAllLoot: () => {
    const run = get().currentRun;
    if (!run) return;
    const value = run.collectedLoot.reduce((s, l) => s + l.value, 0);
    const mostValuable = run.collectedLoot.reduce<any>(
      (max, item) => (!max || item.value > max.value ? item : max),
      null
    );
    const wreck = get().availableWrecks.find((w) => w.id === run.wreckId);
    set((state) => ({
      credits: state.credits + value,
      currentRun: null,
      availableWrecks: wreck
        ? state.availableWrecks.map((w) =>
            w.id === run.wreckId
              ? { ...w, stripped: w.rooms.every((r) => r.looted) }
              : w
          )
        : state.availableWrecks,
      stats: {
        ...state.stats,
        totalCreditsEarned: state.stats.totalCreditsEarned + value,
        totalWrecksCleared: state.stats.totalWrecksCleared + 1,
        totalItemsCollected:
          state.stats.totalItemsCollected + run.collectedLoot.length,
        highestSingleProfit: Math.max(state.stats.highestSingleProfit, value),
        mostValuableItem:
          mostValuable &&
          mostValuable.value > (state.stats.mostValuableItem?.value ?? 0)
            ? { name: mostValuable.name, value: mostValuable.value }
            : state.stats.mostValuableItem,
      },
    }));
  },

  sellItem: (itemId: string) => {
    const item = get().inventory.find((i) => i.id === itemId);
    if (!item) return;
    set((state) => ({
      credits: state.credits + item.value,
      inventory: state.inventory.filter((i) => i.id !== itemId),
    }));
  },

  handleCargoSwap: (dropItemId: string) => {
    const pending = get().cargoSwapPending;
    if (!pending) return;

    const run = get().currentRun;
    if (!run) return;

    const updatedLoot = run.collectedLoot.filter(
      (item) => item.id !== dropItemId
    );
    updatedLoot.push(pending.newItem as any);

    set((state) => ({
      currentRun: state.currentRun
        ? {
            ...state.currentRun,
            collectedLoot: updatedLoot,
          }
        : null,
      cargoSwapPending: null,
    }));
  },

  cancelCargoSwap: () => {
    set({ cargoSwapPending: null });
  },

  setAutoSalvageEnabled: (enabled: boolean) => {
    set({ autoSalvageEnabled: enabled });
  },

  runAutoSalvageTick: () => {
    const state: any = get();
    const assignments: Record<string, string> = state.autoAssignments || {};
    const crewRoster: any[] = state.crewRoster || [];

    for (const crew of crewRoster) {
      const roomId = assignments[crew.id];
      if (!roomId) continue;

      set({ selectedCrewId: crew.id });
      const res = (get() as any).salvageRoom(roomId);

      if (res.success) {
        set((s: any) => {
          const copy = { ...(s.autoAssignments || {}) };
          delete copy[crew.id];
          return { autoAssignments: copy };
        });
      }
    }
  },

  runAutoSalvage: async (rules: AutoSalvageRules, speed: 1 | 2) => {
    autoSalvageRunning = true;
    autoSalvageCancelled = false;

    const result: AutoSalvageResult = {
      roomsSalvaged: 0,
      lootCollected: 0,
      creditsEarned: 0,
      stopReason: 'complete',
      injuries: 0,
    };

    const delay = speed === 1 ? 500 : 250;

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const playAudio = (filename: string) => {
      try {
        const audio = new Audio(
          `/assets/audio/SCI-FI_UI_SFX_PACK/${filename}`
        );
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    };

    while (autoSalvageRunning && !autoSalvageCancelled) {
      const state = get();
      const run = state.currentRun;

      if (!run) {
        result.stopReason = 'complete';
        break;
      }

      if (run.timeRemaining <= 0) {
        result.stopReason = 'time_out';
        break;
      }

      const ship = state.playerShip;
      const capacity = ship?.cargoCapacity ?? 10;
      const currentLoaded = run.collectedLoot.length;
      if (currentLoaded >= capacity) {
        result.stopReason = 'cargo_full';
        break;
      }

      const wreck = state.availableWrecks.find((w) => w.id === run.wreckId);
      if (!wreck) {
        result.stopReason = 'complete';
        break;
      }

      const sealedRooms = wreck.rooms.filter(
        (r) => !r.looted && r.sealed && r.hazardLevel <= rules.maxHazardLevel
      );

      if (sealedRooms.length > 0 && run.timeRemaining >= 1) {
        const roomToCut = sealedRooms[0];
        const cutResult = (get() as any).cutIntoRoom(roomToCut.id);
        if (cutResult.success) {
          playAudio('Impacts/Impact_2_Reso.wav');
          await sleep(delay);
          continue;
        }
      }

      const availableRooms = wreck.rooms.filter(
        (r) =>
          !r.looted && !r.sealed && r.hazardLevel <= rules.maxHazardLevel
      );

      if (availableRooms.length === 0) {
        result.stopReason = 'complete';
        break;
      }

      let nextRoom = availableRooms[0];
      for (const priority of rules.priorityRooms) {
        if (priority === 'any') break;
        const priorityRoom = availableRooms.find((r) => {
          const roomName = r.name?.toLowerCase() ?? '';
          return roomName.includes(priority);
        });
        if (priorityRoom) {
          nextRoom = priorityRoom;
          break;
        }
      }

      const crewSelection = selectBestCrewForRoom(
        nextRoom,
        state.crewRoster,
        state.settings
      );

      if (!crewSelection.crew) {
        result.stopReason = 'crew_exhausted';
        break;
      }

      set({ selectedCrewId: crewSelection.crew.id });

      const roomItems = [...nextRoom.loot];
      let roomSuccess = false;

      for (const item of roomItems) {
        const currentCrew = get().crewRoster.find(
          (c) => c.id === crewSelection.crew!.id
        );
        if (!currentCrew) break;

        if (currentCrew.inventory.length >= 1) {
          const transferSuccess = (get() as any).transferAllItemsToShip(currentCrew.id);

          if (transferSuccess) {
            playAudio('Clicks/Click_Scoop_Up.wav');
          } else {
            result.stopReason = 'cargo_full';
            autoSalvageRunning = false;
            break;
          }
        }

        const salvageResult = (get() as any).salvageItem(nextRoom.id, item.id);

        if (salvageResult.success) {
          roomSuccess = true;
          result.lootCollected++;
          result.creditsEarned += item.value;
        }

        if (salvageResult.damage > 0) {
          result.injuries++;
          if (
            rules.stopOnInjury &&
            currentCrew.hp < currentCrew.maxHp * 0.5
          ) {
            result.stopReason = 'injury';
            autoSalvageRunning = false;
            break;
          }
        }

        await sleep(delay);
      }

      if (!autoSalvageRunning) break;

      const finalCrew = get().crewRoster.find(
        (c) => c.id === crewSelection.crew!.id
      );
      if (finalCrew && finalCrew.inventory.length > 0) {
        const transferSuccess = (get() as any).transferAllItemsToShip(finalCrew.id);
        if (transferSuccess) {
          playAudio('Clicks/Click_Scoop_Up.wav');
        } else {
          result.stopReason = 'cargo_full';
          break;
        }
      }

      if (roomSuccess) {
        result.roomsSalvaged++;
      }
    }

    if (autoSalvageCancelled) {
      result.stopReason = 'cancelled';
    }

    autoSalvageRunning = false;
    return result;
  },

  stopAutoSalvage: () => {
    autoSalvageCancelled = true;
    autoSalvageRunning = false;
  },
});
