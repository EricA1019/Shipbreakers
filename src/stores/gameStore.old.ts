import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import type {
  GameState,
  Loot,
  CrewMember,
  GraveyardZone,
  HireCandidate,
  CrewStatus,
  CrewJob,
  PlayerRoomType,
  GridPosition,
} from "../types";
import type { LicenseTier } from "../types";
import { LICENSE_TIERS } from "../types";
import { initializePlayerShip } from "../game/data/playerShip";
import { generateWreck, generateAvailableWrecks } from "../game/wreckGenerator";
import { ShipExpansionService } from "../services/ShipExpansionService";
import {
  calculateCrewCapacity,
  determineCrewStatus,
  getCrewAvailability,
  selectBestCrewForRoom,
} from "../services/CrewService";
import { BACKGROUNDS } from "../game/data/backgrounds";
import {
  handleCrewDown,
  processInjuryRecovery,
  updateCrewMorale,
} from "../services/injuryService";
import {
  initializeRelationships,
  processWorkTogether,
  calculateRelationshipMorale,
} from "../services/relationshipService";
import {
  STARTING_CREDITS,
  STARTING_FUEL,
  STARTING_TIME,
  STARTING_HP,
  FUEL_COST_PER_AU,
  SCAN_COST,
  STARTING_SKILLS,
  PILOTING_FUEL_REDUCTION_PER_LEVEL,
  SKILL_HAZARD_MAP,
  SKILL_XP_THRESHOLDS,
  RARITY_TIME_COST,
  XP_BASE_SUCCESS,
  XP_BASE_FAIL,
  XP_PER_HAZARD_LEVEL,
  XP_PER_TIER,
  TIER_ROOM_BASE,
  PROVISION_PRICES,
  SHORE_LEAVE_OPTIONS,
  DAILY_FOOD_PER_CREW,
  DAILY_DRINK_PER_CREW,
  TRAVEL_EVENT_CHANCE,
  SALVAGE_EVENT_CHANCE,
  DAILY_EVENT_CHANCE,
  HUB_EVENT_CHANCE,
  LOUNGE_EVENT_CHANCE,
  MEDICAL_EVENT_CHANCE,
  MORALE_RECOVERY_PER_DAY,
  STAMINA_PER_SALVAGE,
  SANITY_LOSS_BASE,
  STAMINA_RECOVERY_STATION,
  SANITY_RECOVERY_STATION,
  HEALING_COST,
  HEALING_AMOUNT,
  FUEL_PRICE,
} from "../game/constants";
import {
  calculateHazardSuccess,
  damageOnFail,
  calculateLootValue,
} from "../game/hazardLogic";
import {
  canInstall,
  installItem,
  uninstallItem,
  getShipyardFee,
  getActiveEffects,
} from "../game/systems/slotManager";
import { EQUIPMENT } from "../game/data/equipment";
import { generateHireCandidates, generateCaptain } from "../game/systems/CrewGenerator";
import { applyEventChoice, pickEventByTrigger } from "../game/systems/EventManager";
import { calculateTraitEffects, getSpecialTraits } from "../game/systems/TraitEffectResolver";
import { tickCrewMovementOnShip } from "../game/systems/CrewMovementSystem";
import { SAVE_SCHEMA_VERSION, STORE_STORAGE_KEY, migrateGameState } from "../services/SaveService";
import {
  PANTRY_CAPACITY,
  STARTING_FOOD,
  STARTING_DRINK,
  STARTING_LUXURY_DRINK,
  BASE_STAMINA,
  BASE_SANITY,
} from "../game/constants";

// Auto-salvage types
export interface AutoSalvageRules {
  maxHazardLevel: number;
  priorityRooms: ("cargo" | "labs" | "armory" | "any")[];
  stopOnInjury: boolean;
  stopOnLowStamina: number;
  stopOnLowSanity: number;
}

export interface AutoSalvageResult {
  roomsSalvaged: number;
  lootCollected: number;
  creditsEarned: number;
  stopReason: "complete" | "cargo_full" | "time_out" | "crew_exhausted" | "injury" | "cancelled";
  injuries: number;
}

// Track auto-salvage state
let autoSalvageRunning = false;
let autoSalvageCancelled = false;

interface GameActions {
  initializeGame: () => void;
  startRun: (wreckId: string) => void;
  travelToWreck: (wreckId: string) => void;
  salvageRoom: (roomId: string) => { success: boolean; damage: number };
  salvageItem: (
    roomId: string,
    itemId: string,
  ) => { success: boolean; damage: number; timeCost: number };
  cutIntoRoom: (roomId: string) => { success: boolean };
  returnToStation: () => void;
  sellAllLoot: () => void;
  sellItem: (itemId: string) => void;
  healCrew: (amount: number) => void;
  scanForWrecks: () => void;
  resetGame: () => void;
  gainSkillXp: (skill: keyof typeof STARTING_SKILLS, amount: number) => void;
  payLicense: () => void;
  upgradeLicense: (tier: LicenseTier) => boolean;
  clearLastUnlockedZone: () => void;
  buyFuel: (amount: number) => boolean;
  payForHealing: () => boolean;
  // QOL: Bulk operations
  healAllCrew: () => { healed: number; cost: number };
  refillFuel: () => { amount: number; cost: number };
  refillProvisions: () => { food: number; drink: number; cost: number };
  hireCrew: (candidate: HireCandidate) => boolean;
  selectCrew: (crewId: string) => void;
  dailyMarketRefresh: () => void;
  updateSettings: (settings: Partial<GameState["settings"]>) => void;
  renameShip: (name: string) => void;
  installItemOnShip: (
    roomId: string,
    slotId: string,
    itemId: string,
  ) => boolean;
  uninstallItemFromShip: (roomId: string, slotId: string) => boolean;
  handleCargoSwap: (dropItemId: string) => void;
  cancelCargoSwap: () => void;

  // Phase 13: Ship Expansion
  purchaseRoom: (roomType: PlayerRoomType, position: GridPosition) => { success: boolean; reason?: string };
  sellRoom: (roomId: string) => { success: boolean; reason?: string };

  // Phase 9: Character Creation + Events
  createCaptain: (args: { firstName: string; lastName: string; lockedTrait: any; chosenTrait: any; }) => void;
  debugSkipCharacterCreation: () => void;

  buyProvision: (kind: "food" | "water" | "beer" | "wine") => boolean;
  takeShoreLeave: (type: "rest" | "recreation" | "party") => void;

  setAutoSalvageEnabled: (enabled: boolean) => void;
  assignCrewToRoom: (crewId: string, roomId: string) => void;
  runAutoSalvageTick: () => void;
  runAutoSalvage: (rules: AutoSalvageRules, speed: 1 | 2) => Promise<AutoSalvageResult>;
  stopAutoSalvage: () => void;

  resolveActiveEvent: (choiceId: string) => void;
  dismissActiveEvent: () => void;
  getCrewAvailability: (crewId: string) => { available: boolean; reason?: string };
  transferItemToShip: (crewId: string, itemId: string) => boolean;
  transferAllItemsToShip: (crewId: string) => boolean;
  emergencyEvacuate: () => void;

  /** Advances crew movement simulation (used for UI feedback). */
  tickCrewMovement: (dtMs: number) => void;
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      credits: STARTING_CREDITS,
      fuel: STARTING_FUEL,
      // initial captain
      crewRoster: [
        {
          id: "captain-1",
          firstName: "Player",
          lastName: "Captain",
          name: "Player Captain",
          isPlayer: true,
          background: "ship_captain" as const,
          traits: ["steady", "pragmatic"] as const,
          skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
          skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
          hp: STARTING_HP,
          maxHp: STARTING_HP,
          stamina: BASE_STAMINA,
          maxStamina: BASE_STAMINA,
          sanity: BASE_SANITY,
          maxSanity: BASE_SANITY,
          currentJob: "idle" as const,
          status: "active" as const,
          inventory: [],
        } as CrewMember,
      ],
      crew: {
        id: "captain-1",
        firstName: "Player",
        lastName: "Captain", 
        name: "Player Captain",
        isPlayer: true,
        background: "ship_captain",
        traits: ["steady", "pragmatic"],
        skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
        skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
        hp: STARTING_HP,
        maxHp: STARTING_HP,
        stamina: BASE_STAMINA,
        maxStamina: BASE_STAMINA,
        sanity: BASE_SANITY,
        maxSanity: BASE_SANITY,
        currentJob: "idle",
        status: "active",
      } as any,
      selectedCrewId: "captain-1",
      hireCandidates: [],
      availableWrecks: generateAvailableWrecks(["near"]),
      currentRun: null,
      inventory: [],
      day: 1,
      licenseDaysRemaining: 14,
      licenseFee: 5000,
      licenseTier: "basic" as LicenseTier,
      unlockedZones: ["near"] as GraveyardZone[],
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
      cargoSwapPending: null,

      // Auto-salvage
      autoSalvageEnabled: false,
      autoAssignments: {},

      // Phase 14: Death & Relationships
      deadCrew: [],
      relationships: [],
      activeEventChain: null,

      // Phase 9: Provisions
      food: STARTING_FOOD,
      drink: STARTING_DRINK,
      luxuryDrink: STARTING_LUXURY_DRINK,
      pantryCapacity: PANTRY_CAPACITY,
      daysWithoutFood: 0,
      beerRationDays: 0,
      crewEfficiencyPenalty: 0,
      activeEvent: null,
      isNewGame: true,

      // Phase 6: player ship - now with proper slot system initialized
      playerShip: (() => {
        const ship = initializePlayerShip("player-ship");
        // Pre-install starting equipment
        const engineRoom = ship.grid
          .flat()
          .find((r: any) => r.roomType === "engine") as any;
        const medbayRoom = ship.grid
          .flat()
          .find((r: any) => r.roomType === "medbay") as any;
        if (engineRoom?.slots?.[0]) {
          engineRoom.slots[0].installedItem = EQUIPMENT["cutting-torch"];
        }
        if (medbayRoom?.slots?.[0]) {
          medbayRoom.slots[0].installedItem = EQUIPMENT["trauma-kit"];
        }
        return ship;
      })(),
      
      initializeGame: () => {
        set({
          credits: STARTING_CREDITS,
          fuel: STARTING_FUEL,
          crewRoster: [
            {
              id: "captain-1",
              firstName: "Player",
              lastName: "Captain",
              name: "Player Captain",
              isPlayer: true,
              background: "ship_captain" as const,
              traits: ["steady", "pragmatic"] as const,
              skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
              skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
              hp: STARTING_HP,
              maxHp: STARTING_HP,
              stamina: BASE_STAMINA,
              maxStamina: BASE_STAMINA,
              sanity: BASE_SANITY,
              maxSanity: BASE_SANITY,
              currentJob: "idle" as const,
              status: "active" as const,
              position: { location: "station" },
              inventory: [], // Empty inventory at game start
            } as CrewMember,
          ],
          selectedCrewId: "captain-1",
          crew: {
            id: "captain-1",
            firstName: "Player",
            lastName: "Captain",
            name: "Player Captain",
            isPlayer: true,
            background: "ship_captain",
            traits: ["steady", "pragmatic"],
            skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
            skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
            hp: STARTING_HP,
            maxHp: STARTING_HP,
            stamina: BASE_STAMINA,
            maxStamina: BASE_STAMINA,
            sanity: BASE_SANITY,
            maxSanity: BASE_SANITY,
            currentJob: "idle",
            status: "active",
            position: { location: "station" },
            inventory: [], // Empty inventory at game start
          } as any,
          hireCandidates: [],
          availableWrecks: generateAvailableWrecks(["near"]),
          currentRun: null,
          inventory: [],
          day: 1,
          licenseDaysRemaining: 14,
          licenseFee: 5000,
          licenseTier: "basic" as LicenseTier,
          unlockedZones: ["near"] as GraveyardZone[],
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

          // Reset to new game state - show character creation
          isNewGame: true,
          lastUnlockedZone: null,

          // Phase 14: Reset death & relationships
          deadCrew: [],
          relationships: [],
          activeEventChain: null,

          playerShip: (() => {
            const ship = initializePlayerShip("player-ship");
            // Pre-install starting equipment
            const engineRoom = ship.grid
              .flat()
              .find((r: any) => r.roomType === "engine") as any;
            const medbayRoom = ship.grid
              .flat()
              .find((r: any) => r.roomType === "medbay") as any;
            if (engineRoom?.slots?.[0]) {
              engineRoom.slots[0].installedItem = EQUIPMENT["cutting-torch"];
            }
            if (medbayRoom?.slots?.[0]) {
              medbayRoom.slots[0].installedItem = EQUIPMENT["trauma-kit"];
            }
            return ship;
          })(),
        });

        // Generate initial crew market
        get().dailyMarketRefresh();

        // Seed first wreck with a fair tutorial wreck for onboarding
        set((state) => {
          const arr = state.availableWrecks.slice();
          const tut = generateWreck("tutorial-seed");
          tut.tier = 1;
          tut.distance = 1.5;
          tut.rooms = tut.rooms.slice(0, TIER_ROOM_BASE + 1);
          arr[0] = tut;
          return { availableWrecks: arr };
        });

        // Attempt to populate wreck names asynchronously via WASM
        (async () => {
          try {
            const populated = await (
              await import("../game/wreckGenerator")
            ).populateWreckNames(get().availableWrecks);
            set({ availableWrecks: populated });
          } catch (e) {
            console.warn("Failed to populate wreck names", e);
          }
        })();
      },

      createCaptain: ({ firstName, lastName, lockedTrait, chosenTrait }) => {
        const captain = generateCaptain(firstName, lastName, lockedTrait as any, chosenTrait as any);
        set(() => ({
          crewRoster: [captain],
          crew: captain as any,
          selectedCrewId: captain.id,
          isNewGame: false,
        }));
        // Refresh market after creation so hires match new day/seed
        get().dailyMarketRefresh();
      },

      debugSkipCharacterCreation: () => {
        set({ isNewGame: false });
      },

      resolveActiveEvent: (choiceId: string) => {
        const current = get().activeEvent;
        if (!current) return;
        const choice = current.choices.find((c) => c.id === choiceId);
        if (!choice) return;

        set((state) => applyEventChoice(state as any, current, choice) as any);
        set({ activeEvent: null });
      },

      dismissActiveEvent: () => {
        set({ activeEvent: null });
      },

      getCrewAvailability: (crewId: string) => {
        const state = get();
        const crew = state.crewRoster.find((c) => c.id === crewId);
        if (!crew) {
          return { available: false, reason: "Crew not found" };
        }
        return getCrewAvailability(crew, state.settings);
      },

      transferItemToShip: (crewId: string, itemId: string) => {
        const state = get();
        const crew = state.crewRoster.find((c) => c.id === crewId);
        if (!crew) return false;

        const item = crew.inventory.find((i) => i.id === itemId);
        if (!item) return false;

        const run = state.currentRun;
        if (!run) return false;

        // Check ship cargo capacity
        const ship = state.playerShip;
        const capacity = ship?.cargoCapacity ?? 10;
        const currentLoaded = run.collectedLoot.length;
        
        if (currentLoaded >= capacity) {
          // Trigger cargo swap modal
          set({ cargoSwapPending: { newItem: item, source: "salvage" } });
          return false;
        }

        // Move item from crew to ship
        set((s) => ({
          crewRoster: s.crewRoster.map((c) =>
            c.id === crewId
              ? { ...c, inventory: c.inventory.filter((i) => i.id !== itemId) }
              : c
          ),
          crew: s.crewRoster.find((c) => c.id === crewId) ?? s.crew,
          currentRun: s.currentRun ? {
            ...s.currentRun,
            collectedLoot: s.currentRun.collectedLoot.concat(item)
          } : null,
        }));

        return true;
      },

      transferAllItemsToShip: (crewId: string) => {
        const state = get();
        const crew = state.crewRoster.find((c) => c.id === crewId);
        if (!crew || crew.inventory.length === 0) return true; // Nothing to transfer

        // Try to transfer each item
        for (const item of crew.inventory) {
          const success = get().transferItemToShip(crewId, item.id);
          if (!success) {
            return false; // Stop on first failure (cargo full)
          }
        }

        return true;
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
          1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL,
        );
        const activeEffects = getActiveEffects(get().playerShip as any);
        const fuelEfficiency =
          activeEffects
            .filter((e: any) => e.type === "fuel_efficiency")
            .reduce((s: number, e: any) => s + e.value, 0) / 100;
        const finalReduction = Math.max(0, reduction * (1 - fuelEfficiency));
        const travelCost = Math.max(
          1,
          Math.ceil(wreck.distance * FUEL_COST_PER_AU * finalReduction),
        );
        if (get().fuel < travelCost * 2) return; // need round trip

        set((state) => ({
          fuel: state.fuel - travelCost, // consume fuel for travel (one-way)
          currentRun: {
            wreckId: wreck.id,
            status: "traveling",
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
        // If the wreck name has not been populated yet, fall back to ship name when arriving
        if (
          wreck.name === "Unknown Vessel" &&
          (wreck as any).ship?.name &&
          (wreck as any).ship.name !== "Unknown Vessel"
        ) {
          set((state) => ({
            availableWrecks: state.availableWrecks.map((w) =>
              w.id === wreck.id ? { ...w, name: (wreck as any).ship.name } : w,
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
          1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL,
        );
        const activeEffects = getActiveEffects(get().playerShip as any);
        const fuelEfficiency =
          activeEffects
            .filter((e: any) => e.type === "fuel_efficiency")
            .reduce((s: number, e: any) => s + e.value, 0) / 100;
        const finalReduction = Math.max(0, reduction * (1 - fuelEfficiency));
        const travelCost = Math.max(
          1,
          Math.ceil(wreck.distance * FUEL_COST_PER_AU * finalReduction),
        );
        set((state) => ({
          fuel: state.fuel - travelCost, // arrive (consume second leg)
          currentRun: state.currentRun
            ? { ...state.currentRun, status: "salvaging" }
            : null,
          crewRoster: (state.crewRoster || []).map((c) => ({
            ...c,
            position: { location: "wreck" as const },
          })),
        }));

        // Possible travel events
        if (Math.random() < TRAVEL_EVENT_CHANCE) {
          const ev = pickEventByTrigger("travel", get() as any);
          if (ev) set({ activeEvent: ev });
        }
      },

      cutIntoRoom: (roomId: string) => {
        const run = get().currentRun;
        if (!run) return { success: false };
        const wreck = get().availableWrecks.find((w) => w.id === run.wreckId)!;
        
        // Find the room in wreck.rooms OR in the ship grid (IDs may differ)
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
        
        // Check if either room or grid cell is sealed
        const isSealed = room?.sealed || gridCell?.sealed;
        if (!isSealed) return { success: false };

        // Deduct 1 time unit
        const newTime = run.timeRemaining - 1;
        if (newTime < 0) return { success: false };

        // Unseal both the room and grid cell
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
        // Rooms with multiple items should use auto-salvage or per-item selection
        return { success: false, damage: 0 };
      },

      salvageItem: (roomId: string, itemId: string) => {
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

        // Check if crew is available for work
        const availability = getCrewAvailability(activeCrew, get().settings);
        if (!availability.available) {
          return { success: false, damage: 0, timeCost: 0 };
        }

        // Calculate trait modifiers early - used for multiple calculations
        const traitMods = calculateTraitEffects(activeCrew);

        // Increment rooms attempted at start
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

        // Calculate time cost based on rarity, modified by work_speed traits
        const baseTimeCost = RARITY_TIME_COST[item.rarity];
        const timeCost = Math.max(1, Math.round(baseTimeCost * (1 + traitMods.workSpeedMod / 100)));
        const newTime = run.timeRemaining - timeCost;

        // Check for special traits
        const specialTraits = getSpecialTraits(activeCrew);

        // Coward trait: 20% chance to flee from high-hazard rooms (unless also brave)
        if (specialTraits.hasCoward && !specialTraits.hasBrave && room.hazardLevel >= 3) {
          if (Math.random() < 0.2) {
            // Coward fled - no damage, but time wasted
            set((state) => ({
              currentRun: state.currentRun
                ? { ...state.currentRun, timeRemaining: newTime }
                : null,
            }));
            return { success: false, damage: 0, timeCost, fled: true };
          }
        }

        // Hazard check for entering/working in room
        let successChance = calculateHazardSuccess(
          activeCrew.skills,
          room.hazardType as any,
          room.hazardLevel,
          wreck.tier,
        );

        // Apply trait skill modifiers (already calculated above)
        successChance += traitMods.skillMod;
        successChance = Math.max(0, Math.min(100, successChance));
        const roll = Math.random() * 100;
        let damageTaken = 0;
        let success = false;

        const matchingSkill = SKILL_HAZARD_MAP[
          room.hazardType as any
        ] as keyof typeof STARTING_SKILLS;

        // Calculate XP based on difficulty: base + (hazard level * multiplier) + (tier * multiplier)
        const xpSuccess =
          XP_BASE_SUCCESS +
          room.hazardLevel * XP_PER_HAZARD_LEVEL +
          wreck.tier * XP_PER_TIER;
        const xpFail =
          XP_BASE_FAIL +
          Math.floor(
            (room.hazardLevel * XP_PER_HAZARD_LEVEL +
              wreck.tier * XP_PER_TIER) /
              2,
          );

        // Calculate stamina drain with trait modifier
        const baseStaminaDrain = STAMINA_PER_SALVAGE;
        const staminaDrain = Math.max(1, Math.round(baseStaminaDrain * (1 + traitMods.staminaMod / 100)));

        // Calculate sanity loss for hazardous work (higher hazard = more sanity loss)
        const baseSanityLoss = room.hazardLevel >= 3 ? SANITY_LOSS_BASE : 0;
        const sanityLoss = Math.max(0, Math.round(baseSanityLoss * (1 + traitMods.sanityMod / 100)));

        if (roll < Math.max(0, successChance)) {
          // Success - add item to crew inventory
          success = true;
          const activeEffects = getActiveEffects(get().playerShip as any);
          let adjustedItem = {
            ...item,
            value: Math.round(
              calculateLootValue(
                item.value,
                activeCrew.skills.salvage,
                activeEffects,
              ) * (1 + traitMods.lootMod / 100)
            ),
          };

          // Greedy trait: 5% chance to "lose" the item (stolen for personal gain)
          let stolenByGreedy = false;
          if (specialTraits.hasGreedy && Math.random() < 0.05) {
            stolenByGreedy = true;
            // Item still removed from room, but not added to inventory
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
            // Add item to crew inventory (unless stolen by greedy trait)
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
            // Update active crew reference
            crew: state.crewRoster.find((c) => c.id === activeCrew.id) ?? state.crew,
            // Remove item from room
            availableWrecks: state.availableWrecks.map((w) =>
              w.id === wreck.id
                ? {
                    ...w,
                    rooms: w.rooms.map((r) => {
                      if (r.id === room.id) {
                        const remainingLoot = r.loot.filter(
                          (l) => l.id !== itemId,
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
                : w,
            ),
          }));

          // Remove equipment handling - now unified with loot
          get().gainSkillXp(matchingSkill, xpSuccess);

          // Trigger salvage event chance
          if (Math.random() < SALVAGE_EVENT_CHANCE && !get().activeEvent) {
            const ev = pickEventByTrigger("salvage", get() as any);
            if (ev) set({ activeEvent: ev });
          }
        } else {
          // Fail - take damage, waste time
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
                : c,
            );
            
            let deadCrew = state.deadCrew || [];
            let relationships = state.relationships || [];
            
            // Handle crew going down (HP = 0)
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
              
              if (result.outcome === "death") {
                // Remove dead crew from roster
                updated = updated.filter((c) => c.id !== activeCrew.id);
                if (result.deadCrewRecord) {
                  deadCrew = [...deadCrew, result.deadCrewRecord];
                }
              } else if (result.injury) {
                // Apply injury to crew
                updated = updated.map((c) =>
                  c.id === activeCrew.id
                    ? { ...c, injury: result.injury, status: 'injured' as CrewStatus, hp: 1 }
                    : c
                );
              }
              
              // Apply morale impacts to other crew
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
                      damageTaken:
                        state.currentRun.stats.damageTaken + damageTaken,
                    },
                  }
                : null,
              crewRoster: updated,
              crew: updated.find((c) => c.id === activeCrew.id) ?? updated[0] ?? state.crew,
              deadCrew,
              relationships,
            };
          });

          get().gainSkillXp(matchingSkill, xpFail);
        }

        return { success, damage: damageTaken, timeCost };
      },

      returnToStation: () => {
        const run = get().currentRun;
        if (!run) return;

        const wreck = get().availableWrecks.find((w) => w.id === run.wreckId);
        if (!wreck) {
          console.error("Wreck not found for return trip");
          return;
        }
        const piloting = get().crew.skills.piloting ?? 0;
        const reduction = Math.max(
          0,
          1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL,
        );
        const activeEffects = getActiveEffects(get().playerShip as any);
        const fuelEfficiency =
          activeEffects
            .filter((e: any) => e.type === "fuel_efficiency")
            .reduce((s: number, e: any) => s + e.value, 0) / 100;
        const finalReduction = Math.max(0, reduction * (1 - fuelEfficiency));
        const returnCost = Math.max(
          1,
          Math.ceil(wreck.distance * FUEL_COST_PER_AU * finalReduction),
        );

        // Calculate days spent (based on distance)
        const daysSpent = Math.max(1, Math.ceil(wreck.distance / 10)); // ~1 day per 10 AU

        // Provisions consumption and penalties
        const crewCount = (get().crewRoster || []).length;
        const dailyFood = DAILY_FOOD_PER_CREW * crewCount;
        const dailyDrink = DAILY_DRINK_PER_CREW * crewCount;

        let food = (get() as any).food ?? 0;
        let drink = (get() as any).drink ?? 0;
        let luxuryDrink = (get() as any).luxuryDrink ?? 0;
        let daysWithoutFood = (get() as any).daysWithoutFood ?? 0;
        let beerRationDays = (get() as any).beerRationDays ?? 0;

        // Apply per-day consumption (daysSpent is small)
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
          licenseDaysRemaining: Math.max(
            0,
            state.licenseDaysRemaining - daysSpent,
          ),
          currentRun: {
            ...run,
            status: "completed",
            stats: {
              ...run.stats,
              fuelSpent: run.stats.fuelSpent + returnCost,
            },
          },
          stats: {
            ...state.stats,
            daysPlayed: state.stats.daysPlayed + daysSpent,
          },

          // Provisions state
          food,
          drink,
          luxuryDrink,
          daysWithoutFood,
          beerRationDays,
          // Apply beer efficiency penalty
          crewEfficiencyPenalty: beerRationDays > 0 ? 2 : 0,
          // Reset crew positions to station
          crewRoster: (state.crewRoster || []).map((c) => ({
            ...c,
            position: { location: "station" as const },
          })),
        }));

        // Apply survival penalties to crew
        const roster = get().crewRoster || [];
        const updatedRoster = roster.map((c) => {
          let newHp = c.hp;
          let newSanity = c.sanity;
          let newStamina = c.stamina;

          // Starvation: lose 5 HP per day if starving for 3+ days
          if (daysWithoutFood >= 3) {
            newHp = Math.max(0, newHp - 5 * (daysWithoutFood - 2));
          }

          // No drink: lose 10 sanity if no water consumed
          if (drink === 0 && luxuryDrink === 0) {
            newSanity = Math.max(0, newSanity - 10);
          }

          // Recovery at station
          if (c.status === "resting") {
            // Enhanced recovery for resting crew
            newHp = Math.min(c.maxHp, newHp + 10);
            newStamina = Math.min(c.maxStamina, newStamina + 30);
            newSanity = Math.min(c.maxSanity, newSanity + 20);
          } else {
            // Normal recovery for active crew
            newStamina = Math.min(c.maxStamina, newStamina + STAMINA_RECOVERY_STATION);
            newSanity = Math.min(c.maxSanity, newSanity + SANITY_RECOVERY_STATION);
          }

          const updatedCrew = { ...c, hp: newHp, sanity: newSanity, stamina: newStamina };

          // Update status based on current stats
          const newStatus = determineCrewStatus(updatedCrew);

          // Return to active if fully recovered from resting
          if (c.status === "resting" && newHp >= 80 && newStamina >= 70 && newSanity >= 70) {
            return { ...updatedCrew, status: "active" as CrewStatus, currentJob: "idle" as CrewJob };
          }

          return { ...updatedCrew, status: newStatus as CrewStatus };
        });

        set({ crewRoster: updatedRoster });
        
        // Phase 14: Process injury recovery for each day spent
        for (let d = 0; d < daysSpent; d++) {
          const { updatedRoster: healedRoster, recoveredCrew } = processInjuryRecovery(get().crewRoster);
          if (recoveredCrew.length > 0) {
            console.log(`Crew recovered from injuries: ${recoveredCrew.join(', ')}`);
          }
          set({ crewRoster: healedRoster });
        }
        
        // Phase 14: Process relationship bonding from working together
        const crewWhoWorked = get().crewRoster.filter((c) => 
          c.status === 'active' && !c.injury
        ).map((c) => c.id);
        
        if (crewWhoWorked.length >= 2) {
          const updatedRelationships = processWorkTogether(
            get().relationships || [],
            crewWhoWorked
          );
          set({ relationships: updatedRelationships });
        }
        
        // Phase 14: Apply morale recovery and relationship bonuses at station
        const currentRoster = get().crewRoster;
        const relationships = get().relationships || [];
        const moraleUpdatedRoster = currentRoster.map((c) => {
          const relationshipBonus = calculateRelationshipMorale(relationships, c.id);
          const baseMorale = c.morale ?? 75;
          const newMorale = Math.min(100, Math.max(0, baseMorale + MORALE_RECOVERY_PER_DAY + relationshipBonus));
          return { ...c, morale: newMorale };
        });
        set({ crewRoster: moraleUpdatedRoster });

        // Check for breakdown events (sanity === 0)
        const breakdownCrew = get().crewRoster.find((c) => c.status === "breakdown");
        if (breakdownCrew && !get().activeEvent) {
          const breakdownEvent = pickEventByTrigger("daily", get() as any);
          if (breakdownEvent) set({ activeEvent: breakdownEvent });
        }

        // Refresh daily markets after advancing days
        get().dailyMarketRefresh();

        // Chance to trigger a daily event on return
        if (Math.random() < DAILY_EVENT_CHANCE) {
          const ev = pickEventByTrigger("daily", get() as any);
          if (ev) set({ activeEvent: ev });
        }
        
        // Phase 14: Chance for hub event when returning to station
        if (!get().activeEvent && Math.random() < HUB_EVENT_CHANCE) {
          const ev = pickEventByTrigger("hub", get() as any);
          if (ev) set({ activeEvent: ev });
        }

        // Phase 13: Inventory Consolidation
        // Items remain in currentRun.collectedLoot until processed by player (Sell/Keep)
      },

      emergencyEvacuate: () => {
        const run = get().currentRun;
        if (!run) return;

        // Calculate total value of items being abandoned
        let abandonedValue = 0;
        
        // Add value from crew inventories
        get().crewRoster.forEach((crew) => {
          crew.inventory.forEach((item) => {
            abandonedValue += item.value;
          });
        });
        
        // Add value from ship cargo
        run.collectedLoot.forEach((item) => {
          abandonedValue += item.value;
        });

        // Play warning sound
        try {
          const audio = new Audio("/assets/audio/SCI-FI_UI_SFX_PACK/Glitches/Glitch_19.wav");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}

        // Clear all inventories and cargo
        set((state) => ({
          crewRoster: state.crewRoster.map((c) => ({
            ...c,
            inventory: [],
            position: { location: "station" },
          })),
          currentRun: null, // End run immediately
        }));

        // Call returnToStation to handle fuel, provisions, and day advancement
        // This will set currentRun back, so we clear it again
        get().returnToStation();
        
        // Clear the run that returnToStation creates
        set({ currentRun: null });
      },

      sellAllLoot: () => {
        const run = get().currentRun;
        if (!run) return;
        const value = run.collectedLoot.reduce((s, l) => s + l.value, 0);
        const mostValuable = run.collectedLoot.reduce<Loot | null>(
          (max, item) => (!max || item.value > max.value ? item : max),
          null,
        );
        const wreck = get().availableWrecks.find((w) => w.id === run.wreckId);
        set((state) => ({
          credits: state.credits + value,
          currentRun: null,
          // remove looted rooms from wreck if found
          availableWrecks: wreck
            ? state.availableWrecks.map((w) =>
                w.id === run.wreckId
                  ? { ...w, stripped: w.rooms.every((r) => r.looted) }
                  : w,
              )
            : state.availableWrecks,
          stats: {
            ...state.stats,
            totalCreditsEarned: state.stats.totalCreditsEarned + value,
            totalWrecksCleared: state.stats.totalWrecksCleared + 1,
            totalItemsCollected:
              state.stats.totalItemsCollected + run.collectedLoot.length,
            highestSingleProfit: Math.max(
              state.stats.highestSingleProfit,
              value,
            ),
            mostValuableItem:
              mostValuable &&
              mostValuable.value > (state.stats.mostValuableItem?.value ?? 0)
                ? { name: mostValuable.name, value: mostValuable.value }
                : state.stats.mostValuableItem,
          },
        }));
      },

      healCrew: (amount: number) => {
        const selected = get().selectedCrewId;
        set((state) => {
          const updated = state.crewRoster.map((c) =>
            c.id === selected
              ? {
                  ...c,
                  hp: Math.min(c.maxHp, c.hp + Math.floor(amount / 10) * 10),
                  status: "resting" as CrewStatus,
                  currentJob: "resting" as CrewJob,
                }
              : c,
          );
          return {
            credits: Math.max(0, state.credits - amount),
            crewRoster: updated,
            crew: updated.find((c) => c.id === selected) ?? state.crew,
          };
        });
        
        // Phase 14: Chance for medical event when healing
        if (!get().activeEvent && Math.random() < MEDICAL_EVENT_CHANCE) {
          const ev = pickEventByTrigger("medical", get() as any);
          if (ev) set({ activeEvent: ev });
        }
      },

      scanForWrecks: () => {
        set((state) => ({
          credits: Math.max(0, state.credits - SCAN_COST),
          availableWrecks: generateAvailableWrecks(state.unlockedZones),
        }));

        // Try to populate names via WASM in background
        (async () => {
          try {
            const populated = await (
              await import("../game/wreckGenerator")
            ).populateWreckNames(get().availableWrecks);
            set({ availableWrecks: populated });
          } catch (e) {
            console.warn("Failed to populate wreck names", e);
          }
        })();
      },

      renameShip: (name: string) => {
        set((state) => {
          if (state.playerShip) {
            return { playerShip: { ...state.playerShip, name } };
          } else {
            const newShip = initializePlayerShip("player-ship");
            return { playerShip: { ...newShip, name } };
          }
        });
      },

      installItemOnShip: (roomId: string, slotId: string, itemId: string) => {
        const state = get();
        const ship = state.playerShip;
        if (!ship) return false;

        const room = ship.grid.flat().find((r: any) => r && r.id === roomId) as any;
        if (!room || !Array.isArray(room.slots)) return false;
        const slot = room.slots.find((s: any) => s.id === slotId);
        if (!slot) return false;

        // Phase 13: Unified inventory check
        const inventory = state.inventory || [];
        const item = inventory.find((i) => i.id === itemId);

        if (!item) return false;

        const check = canInstall(ship, slot, item);
        if (!check.success) return false;

        const fee = getShipyardFee(state.licenseTier, "install");
        if (state.credits < fee) return false;

        installItem(ship, slot, item);

        // Remove from inventory
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

        const room = ship.grid.flat().find((r: any) => r && r.id === roomId) as any;
        if (!room || !Array.isArray(room.slots)) return false;
        const slot = room.slots.find((s: any) => s.id === slotId);
        if (!slot || !slot.installedItem) return false;

        const fee = getShipyardFee(state.licenseTier, "uninstall");
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

      resetGame: () => {
        set({
          credits: STARTING_CREDITS,
          fuel: STARTING_FUEL,
          isNewGame: true,
          lastUnlockedZone: null,
          crewRoster: [
            {
              id: "captain-1",
              name: "Player",
              isPlayer: true,
              skills: STARTING_SKILLS as any,
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
          selectedCrewId: "captain-1",
          crew: {
            name: "Player",
            skills: STARTING_SKILLS as any,
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
          availableWrecks: generateAvailableWrecks(["near"]),
          currentRun: null,
          playerShip: initializePlayerShip("player-ship"),
          inventory: [], // Unified inventory
        });

        // Seed tutorial wreck
        set((state) => {
          const arr = state.availableWrecks.slice();
          const tut = generateWreck("tutorial-seed");
          tut.tier = 1;
          tut.distance = 1.5;
          tut.rooms = tut.rooms.slice(0, TIER_ROOM_BASE + 1);
          arr[0] = tut;
          return { availableWrecks: arr };
        });

        // Try to populate names via WASM in background
        (async () => {
          try {
            const populated = await (
              await import("../game/wreckGenerator")
            ).populateWreckNames(get().availableWrecks);
            set({ availableWrecks: populated });
          } catch (e) {
            console.warn("Failed to populate wreck names", e);
          }
        })();
      },

      gainSkillXp: (skill: keyof typeof STARTING_SKILLS, amount: number) => {
        const state = get();
        const selected = state.selectedCrewId;
        const crew =
          state.crewRoster.find((c) => c.id === selected) ??
          state.crewRoster[0];
        if (!crew) return;

        const currentXp = crew.skillXp[skill];
        const currentLevel = crew.skills[skill];
        const newXp = currentXp + amount;

        // Check for level up
        let newLevel = currentLevel;
        const cumulativeXp = SKILL_XP_THRESHOLDS.reduce(
          (sum, threshold, idx) => {
            if (idx < currentLevel - 1) return sum + threshold;
            return sum;
          },
          0,
        );

        // Check if we crossed a threshold
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
              : c,
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
                      [skill]:
                        (state.currentRun.stats.xpGained[skill] ?? 0) + amount,
                    },
                  },
                }
              : null,
          };
        });
      },

      sellItem: (itemId: string) => {
        const item = get().inventory.find((i) => i.id === itemId);
        if (!item) return;
        set((state) => ({
          credits: state.credits + item.value,
          inventory: state.inventory.filter((i) => i.id !== itemId),
        }));
      },

      payLicense: () => {
        const tier = get().licenseTier || "basic";
        const fee = LICENSE_TIERS[tier].cost;
        if (get().credits < fee) return;
        set((state) => ({
          credits: state.credits - fee,
          licenseDaysRemaining: LICENSE_TIERS[tier].duration,
          stats: {
            ...state.stats,
            licensesRenewed: state.stats.licensesRenewed + 1,
          },
        }));
      },

      upgradeLicense: (tier: LicenseTier) => {
        const cost = LICENSE_TIERS[tier].cost;
        if (get().credits < cost) return false;
        set((state) => ({
          credits: state.credits - cost,
          licenseTier: tier,
          licenseDaysRemaining: LICENSE_TIERS[tier].duration,
          unlockedZones: LICENSE_TIERS[tier].unlocksZones,
          lastUnlockedZone:
            LICENSE_TIERS[tier].unlocksZones.slice(-1)[0] ?? null,
        }));
        return true;
      },

      clearLastUnlockedZone: () => {
        set({ lastUnlockedZone: null });
      },

      handleCargoSwap: (dropItemId: string) => {
        const pending = get().cargoSwapPending;
        if (!pending) return;

        const run = get().currentRun;
        if (!run) return;

        // Remove the dropped item from cargo and add new item
        const updatedLoot = run.collectedLoot
          .filter((item) => item.id !== dropItemId);
        updatedLoot.push(pending.newItem as any);

        // Update run with new cargo
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
        // User chose to leave the item behind
        set({ cargoSwapPending: null });
      },

      purchaseRoom: (roomType: PlayerRoomType, position: GridPosition) => {
        const state = get();
        if (!state.playerShip) return { success: false, reason: "No ship" };

        const check = ShipExpansionService.canPurchaseRoom(
          state.playerShip,
          roomType,
          position,
          state.credits,
          state.licenseTier
        );

        if (!check.success) return { success: false, reason: check.reason };

        const cost = ShipExpansionService.calculateRoomCost(state.playerShip, roomType);
        const newShip = ShipExpansionService.purchaseRoom(state.playerShip, roomType, position);

        // Recalculate derived stats
        const cargoRooms = newShip.rooms.filter(r => r.roomType === 'cargo').length;
        const cargoCapacity = 4 + (cargoRooms * 4); // Base 4 + 4 per room

        set((s) => ({
          credits: s.credits - cost,
          playerShip: {
            ...newShip,
            cargoCapacity
          }
        }));

        return { success: true };
      },

      sellRoom: (roomId: string) => {
        const state = get();
        if (!state.playerShip) return { success: false, reason: "No ship" };

        const result = ShipExpansionService.sellRoom(state.playerShip, roomId);
        if (!result.success || !result.ship) return { success: false, reason: result.reason };

        // Recalculate derived stats
        const cargoRooms = result.ship.rooms.filter(r => r.roomType === 'cargo').length;
        const cargoCapacity = 4 + (cargoRooms * 4);

        set((s) => ({
          credits: s.credits + (result.credits || 0),
          playerShip: {
            ...result.ship!,
            cargoCapacity
          }
        }));

        return { success: true };
      },

      buyFuel: (amount: number) => {
        const cost = amount * 10; // FUEL_PRICE imported from constants
        if (get().credits < cost) return false;

        set((state) => ({
          credits: state.credits - cost,
          fuel: state.fuel + amount,
        }));
        return true;
      },

      healAllCrew: () => {
        const state = get();
        const { crewRoster, credits } = state;
        
        let totalHealed = 0;
        let totalCost = 0;
        
        // Calculate total healing needed and cost
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
            status: c.hp < c.maxHp ? ("resting" as CrewStatus) : c.status,
          })),
        }));
        
        return { healed: totalHealed, cost: totalCost };
      },

      refillFuel: () => {
        const state = get();
        const maxFuel = 100;
        const fuelNeeded = maxFuel - state.fuel;
        const cost = fuelNeeded * FUEL_PRICE;
        
        if (fuelNeeded <= 0 || state.credits < cost) {
          return { amount: 0, cost: 0 };
        }
        
        set((state) => ({
          credits: state.credits - cost,
          fuel: maxFuel,
        }));
        
        return { amount: fuelNeeded, cost };
      },

      refillProvisions: () => {
        const state: any = get();
        const pantry = state.pantryCapacity;
        if (!pantry) return { food: 0, drink: 0, cost: 0 };
        
        const foodNeeded = Math.max(0, pantry.food - state.food);
        const drinkNeeded = Math.max(0, pantry.drink - state.drink);
        const cost = foodNeeded * PROVISION_PRICES.food + drinkNeeded * PROVISION_PRICES.water;
        
        if ((foodNeeded <= 0 && drinkNeeded <= 0) || state.credits < cost) {
          return { food: 0, drink: 0, cost: 0 };
        }
        
        set({
          credits: state.credits - cost,
          food: pantry.food,
          drink: pantry.drink,
        });
        
        return { food: foodNeeded, drink: drinkNeeded, cost };
      },

      buyProvision: (kind) => {
        const state: any = get();
        const prices = PROVISION_PRICES;
        const pantry = state.pantryCapacity;
        if (!pantry) return false;

        const price = (prices as any)[kind];
        if (state.credits < price) return false;

        if (kind === "food") {
          if ((state as any).food >= pantry.food) return false;
          set({ credits: state.credits - price, food: (state as any).food + 1 });
          return true;
        }
        if (kind === "water") {
          if ((state as any).drink >= pantry.drink) return false;
          set({ credits: state.credits - price, drink: (state as any).drink + 1 });
          return true;
        }
        // beer/wine => luxury
        if ((state as any).luxuryDrink >= pantry.luxury) return false;
        set({ credits: state.credits - price, luxuryDrink: (state as any).luxuryDrink + 1 });
        return true;
      },

      hireCrew: (candidate: HireCandidate) => {
        const state = get();
        const cost = candidate.cost;
        if (state.credits < cost) return false;
        
        const capacity = calculateCrewCapacity(state.playerShip);
        if (state.crewRoster.length >= capacity) return false; // roster full

        const background = candidate.background ?? "station_rat";
        const bg = BACKGROUNDS[background];
        const staminaMod = bg?.statModifiers?.stamina || 0;
        const sanityMod = bg?.statModifiers?.sanity || 0;
        const maxStamina = BASE_STAMINA + staminaMod;
        const maxSanity = BASE_SANITY + sanityMod;

        const newCrew: CrewMember = {
          id:
            "crew-" +
            Date.now().toString(36) +
            "-" +
            Math.floor(Math.random() * 1000).toString(36),
          firstName: candidate.name,
          lastName: "",
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
          currentJob: "idle",
          status: "active",
          position: { location: "station" },
          inventory: [], // Empty inventory for new hires
          morale: 75, // Phase 14: Starting morale
        };
        
        // Phase 14: Initialize relationships with existing crew
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

      takeShoreLeave: (type) => {
        const opt = (SHORE_LEAVE_OPTIONS as any)[type];
        if (!opt) return;

        const state: any = get();
        const crewCount = (state.crewRoster || []).length;
        const beerNeed = opt.beerPerCrew ? crewCount * opt.beerPerCrew : 0;

        if (state.credits < opt.cost) return;
        if (beerNeed > 0 && state.luxuryDrink < beerNeed) return;

        // Pay + consume party luxury
        const nextCredits = state.credits - opt.cost;
        const nextLuxury = beerNeed > 0 ? state.luxuryDrink - beerNeed : state.luxuryDrink;

        // Recover stats for all crew
        const roster = state.crewRoster.map((c: any) => ({
          ...c,
          stamina: Math.min(c.maxStamina, (c.stamina ?? c.maxStamina) + opt.staminaRecovery),
          sanity: Math.min(c.maxSanity, (c.sanity ?? c.maxSanity) + opt.sanityRecovery),
          status: "resting",
          currentJob: "resting",
          position: { location: "station" },
        }));

        set({
          credits: nextCredits,
          luxuryDrink: nextLuxury,
          crewRoster: roster,
          crew: roster.find((c: any) => c.id === state.selectedCrewId) ?? roster[0],
        });

        // Advance time by duration (uses existing day counter only)
        set((s) => ({
          day: s.day + opt.duration,
          licenseDaysRemaining: Math.max(0, s.licenseDaysRemaining - opt.duration),
          stats: { ...s.stats, daysPlayed: s.stats.daysPlayed + opt.duration },
        }));

        // Refresh market after day advance
        get().dailyMarketRefresh();

        // Trigger social event based on shore leave type
        if (Math.random() < opt.eventChance) {
          const ev = pickEventByTrigger("social", get() as any);
          if (ev) set({ activeEvent: ev });
        }
        
        // Phase 14: Chance for lounge event during shore leave
        if (!get().activeEvent && Math.random() < LOUNGE_EVENT_CHANCE) {
          const ev = pickEventByTrigger("lounge", get() as any);
          if (ev) set({ activeEvent: ev });
        }
        
        // Phase 14: Process injury recovery during shore leave
        for (let d = 0; d < opt.duration; d++) {
          const { updatedRoster: healedRoster } = processInjuryRecovery(get().crewRoster);
          set({ crewRoster: healedRoster });
        }
      },

      // Auto-salvage actions
      setAutoSalvageEnabled: (enabled: boolean) => {
        set({ autoSalvageEnabled: enabled });
      },

      assignCrewToRoom: (crewId: string, roomId: string) => {
        set((state: any) => ({
          autoAssignments: { ...(state.autoAssignments || {}), [crewId]: roomId },
          crewRoster: (state.crewRoster || []).map((c: any) =>
            c.id === crewId
              ? { ...c, position: { location: "wreck", roomId }, currentJob: "salvaging" }
              : c,
          ),
        }));
      },

      runAutoSalvageTick: () => {
        const state: any = get();
        const assignments: Record<string, string> = state.autoAssignments || {};
        const crewRoster: any[] = state.crewRoster || [];

        for (const crew of crewRoster) {
          const roomId = assignments[crew.id];
          if (!roomId) continue;

          // Set selected crew to use existing salvage logic
          set({ selectedCrewId: crew.id });
          const res = get().salvageRoom(roomId);

          // If salvage succeeded or room is now looted, remove assignment
          if (res.success) {
            set((s: any) => {
              const copy = { ...(s.autoAssignments || {}) };
              delete copy[crew.id];
              return { autoAssignments: copy };
            });
          }
        }
      },

      runAutoSalvage: async (rules: AutoSalvageRules, speed: 1 | 2): Promise<AutoSalvageResult> => {
        autoSalvageRunning = true;
        autoSalvageCancelled = false;
        
        const result: AutoSalvageResult = {
          roomsSalvaged: 0,
          lootCollected: 0,
          creditsEarned: 0,
          stopReason: "complete",
          injuries: 0,
        };
        
        const delay = speed === 1 ? 500 : 250;
        
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Helper to play audio
        const playAudio = (filename: string) => {
          try {
            const audio = new Audio(`/assets/audio/SCI-FI_UI_SFX_PACK/${filename}`);
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore errors
          } catch {}
        };
        
        while (autoSalvageRunning && !autoSalvageCancelled) {
          const state = get();
          const run = state.currentRun;
          
          // Check if run is still active
          if (!run) {
            result.stopReason = "complete";
            break;
          }
          
          // Check time
          if (run.timeRemaining <= 0) {
            result.stopReason = "time_out";
            break;
          }
          
          // Check cargo capacity
          const ship = state.playerShip;
          const capacity = ship?.cargoCapacity ?? 10;
          const currentLoaded = run.collectedLoot.length;
          if (currentLoaded >= capacity) {
            result.stopReason = "cargo_full";
            break;
          }
          
          // Find next room to salvage
          const wreck = state.availableWrecks.find((w) => w.id === run.wreckId);
          if (!wreck) {
            result.stopReason = "complete";
            break;
          }
          
          // Auto-cut sealed rooms if time permits
          const sealedRooms = wreck.rooms.filter(
            (r) => !r.looted && r.sealed && r.hazardLevel <= rules.maxHazardLevel
          );
          
          if (sealedRooms.length > 0 && run.timeRemaining >= 1) {
            const roomToCut = sealedRooms[0];
            const cutResult = get().cutIntoRoom(roomToCut.id);
            if (cutResult.success) {
              playAudio("Impacts/Impact_2_Reso.wav");
              await sleep(delay);
              continue; // Loop back to salvage the now-unsealed room
            }
          }
          
          // Find available unsealed rooms
          const availableRooms = wreck.rooms.filter(
            (r) => !r.looted && !r.sealed && r.hazardLevel <= rules.maxHazardLevel
          );
          
          if (availableRooms.length === 0) {
            result.stopReason = "complete";
            break;
          }
          
          // Prioritize rooms based on rules
          let nextRoom = availableRooms[0];
          for (const priority of rules.priorityRooms) {
            if (priority === "any") break;
            const priorityRoom = availableRooms.find((r) => {
              const roomName = r.name?.toLowerCase() ?? "";
              return roomName.includes(priority);
            });
            if (priorityRoom) {
              nextRoom = priorityRoom;
              break;
            }
          }
          
          // Select best crew for this room
          const crewSelection = selectBestCrewForRoom(nextRoom, state.crewRoster, state.settings);
          
          if (!crewSelection.crew) {
            // No crew available
            result.stopReason = "crew_exhausted";
            break;
          }
          
          // Set this crew as selected for salvage
          set({ selectedCrewId: crewSelection.crew.id });
          
          // Salvage items from the room one by one
          const roomItems = [...nextRoom.loot];
          let roomSuccess = false;
          
          for (const item of roomItems) {
            // Check if crew inventory is full
            const currentCrew = get().crewRoster.find((c) => c.id === crewSelection.crew!.id);
            if (!currentCrew) break;
            
            if (currentCrew.inventory.length >= 1) {
              // Transfer items to ship
              const transferSuccess = get().transferAllItemsToShip(currentCrew.id);
              
              if (transferSuccess) {
                playAudio("Clicks/Click_Scoop_Up.wav");
              } else {
                // Cargo full
                result.stopReason = "cargo_full";
                autoSalvageRunning = false;
                break;
              }
            }
            
            // Salvage the item
            const salvageResult = get().salvageItem(nextRoom.id, item.id);
            
            if (salvageResult.success) {
              roomSuccess = true;
              result.lootCollected++;
              result.creditsEarned += item.value;
            }
            
            if (salvageResult.damage > 0) {
              result.injuries++;
              if (rules.stopOnInjury && currentCrew.hp < currentCrew.maxHp * 0.5) {
                result.stopReason = "injury";
                autoSalvageRunning = false;
                break;
              }
            }
            
            await sleep(delay);
          }
          
          if (!autoSalvageRunning) break;
          
          // After room is done, transfer any remaining items
          const finalCrew = get().crewRoster.find((c) => c.id === crewSelection.crew!.id);
          if (finalCrew && finalCrew.inventory.length > 0) {
            const transferSuccess = get().transferAllItemsToShip(finalCrew.id);
            if (transferSuccess) {
              playAudio("Clicks/Click_Scoop_Up.wav");
            } else {
              result.stopReason = "cargo_full";
              break;
            }
          }
          
          if (roomSuccess) {
            result.roomsSalvaged++;
          }
        }
        
        if (autoSalvageCancelled) {
          result.stopReason = "cancelled";
        }
        
        autoSalvageRunning = false;
        return result;
      },

      stopAutoSalvage: () => {
        autoSalvageCancelled = true;
        autoSalvageRunning = false;
      },

      selectCrew: (crewId: string) => {
        set((_state) => ({ selectedCrewId: crewId }));
      },

      payForHealing: () => {
        const state = get();
        const healingCost = 50; // HEALING_COST
        const healingAmount = 10; // HEALING_AMOUNT
        const selected = state.selectedCrewId;
        const crew =
          state.crewRoster.find((c) => c.id === selected) ??
          state.crewRoster[0];

        if (state.credits < healingCost) return false;
        if (!crew || crew.hp >= crew.maxHp) return false;

        set((s) => {
          const updated = s.crewRoster.map((c) =>
            c.id === crew.id
              ? { ...c, hp: Math.min(c.hp + healingAmount, c.maxHp) }
              : c,
          );
          return {
            credits: s.credits - healingCost,
            crewRoster: updated,
            crew: updated.find((c) => c.id === crew.id) ?? s.crew,
          };
        });
        return true;
      },

      dailyMarketRefresh: () => {
        const { day } = get();
        const candidates = generateHireCandidates(day, 3);
        set({ hireCandidates: candidates });
      },


      updateSettings: (settings: Partial<GameState["settings"]>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
          },
        }));
      },

      tickCrewMovement: (dtMs: number) => {
        set((state) => {
          if (!state.crewRoster || state.crewRoster.length === 0) return {};

          const run = state.currentRun;
          const activeWreck = run
            ? state.availableWrecks.find((w) => w.id === run.wreckId)
            : undefined;

          const updatedRoster = state.crewRoster.map((crew) => {
            if (!crew.position) return crew;

            if (crew.position.location === "station") {
              const ship = state.playerShip;
              if (!ship) return crew.movement ? { ...crew, movement: undefined } : crew;

              const moved = tickCrewMovementOnShip(
                ship,
                { ...crew, position: { ...crew.position, location: "ship" as const } },
                dtMs,
                { allowWander: true },
              );
              return {
                ...moved,
                position: moved.position
                  ? { ...moved.position, location: "station" as const }
                  : crew.position,
              };
            }

            if (crew.position.location === "ship") {
              const ship = state.playerShip;
              if (!ship) return crew;
              return tickCrewMovementOnShip(ship, crew, dtMs, { allowWander: true });
            }

            if (crew.position.location === "wreck") {
              const ship = (activeWreck as any)?.ship;
              if (!ship) return crew;
              return tickCrewMovementOnShip(ship, crew, dtMs, { allowWander: true });
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
      },
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
            const version = typeof (parsed as any).version === 'number' ? (parsed as any).version : 0;
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
          const hasCrew = Array.isArray((migrated as any)?.crewRoster) && (migrated as any).crewRoster.length > 0;
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
    },
  ),
);

// For debugging
// @ts-ignore
window.gameStore = useGameStore;
