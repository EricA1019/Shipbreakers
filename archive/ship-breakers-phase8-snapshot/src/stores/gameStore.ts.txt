import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GameState,
  Loot,
  CrewMember,
  GraveyardZone,
  HireCandidate,
  CrewStatus,
  CrewJob,
} from "../types";
import type { LicenseTier } from "../types";
import { LICENSE_TIERS } from "../types";
import { initializePlayerShip } from "../game/data/playerShip";
import { generateWreck, generateAvailableWrecks } from "../game/wreckGenerator";
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
  STAMINA_PER_SALVAGE,
  SANITY_LOSS_BASE,
  STAMINA_RECOVERY_STATION,
  SANITY_RECOVERY_STATION,
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
import { REACTORS } from "../game/data/reactors";
import { generateHireCandidates, generateCaptain } from "../game/systems/CrewGenerator";
import { applyEventChoice, pickEventByTrigger } from "../game/systems/EventManager";
import { calculateTraitEffects } from "../game/systems/TraitEffectResolver";
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
  migrateSave: () => void;
  handleCargoSwap: (dropItemId: string) => void;
  cancelCargoSwap: () => void;

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
}

// Helper: Determine crew status based on stats (priority: mortality > needs > tasks)
function determineCrewStatus(crew: CrewMember): CrewStatus {
  if (crew.hp < 20) return "injured";
  if (crew.sanity === 0) return "breakdown";
  if (crew.currentJob === "resting") return "resting";
  return "active";
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
      },
      cargoSwapPending: null,

      // Auto-salvage
      autoSalvageEnabled: false,
      autoAssignments: {},

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
      equipmentInventory: [], // Starting equipment is now pre-installed

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
          },

          // Reset to new game state - show character creation
          isNewGame: true,
          lastUnlockedZone: null,

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

      salvageRoom: (roomId: string) => {
        const run = get().currentRun;
        if (!run) return { success: false, damage: 0 };
        const wreck = get().availableWrecks.find((w) => w.id === run.wreckId)!;
        const room = wreck.rooms.find((r) => r.id === roomId);
        if (!room || room.looted || room.sealed) return { success: false, damage: 0 };

        // Cargo capacity check (simple slot-based, 1 item = 1 slot)
        const ship = get().playerShip;
        const capacity = ship?.cargoCapacity ?? 10;
        const currentLoaded = run.collectedLoot.length;
        if (currentLoaded + room.loot.length > capacity) {
          // Not enough space to salvage the whole room
          return { success: false, damage: 0 };
        }

        // Deduct time
        const newTime = run.timeRemaining - 2;

        const getActiveCrew = () => {
          const roster = get().crewRoster || [];
          const selected = get().selectedCrewId;
          return roster.find((c) => c.id === selected) ?? roster[0];
        };

        // Hazard check
        const activeCrew = getActiveCrew();
        const activeEffects = getActiveEffects(get().playerShip as any);
        let successChance = calculateHazardSuccess(
          activeCrew.skills,
          room.hazardType as any,
          room.hazardLevel,
          wreck.tier,
          activeEffects,
        );

        // Apply trait skill modifiers
        const traitMods = calculateTraitEffects(activeCrew);
        successChance += traitMods.skillMod;
        successChance = Math.max(0, Math.min(100, successChance));

        const roll = Math.random() * 100;
        let damageTaken = 0;
        let success = false;

        // Determine which skill to award XP to based on hazard type
        const matchingSkill = SKILL_HAZARD_MAP[
          room.hazardType as any
        ] as keyof typeof STARTING_SKILLS;

        if (roll < Math.max(0, successChance)) {
          // success
          success = true;
          const activeEffects = getActiveEffects(get().playerShip as any);
          const traitMods = calculateTraitEffects(activeCrew);
          const loot = room.loot.map((l) => ({
            ...l,
            value: Math.round(
              calculateLootValue(
                l.value,
                activeCrew.skills.salvage,
                activeEffects,
              ) * (1 + traitMods.lootMod / 100)
            ),
          }));
          set((state) => ({
            currentRun: state.currentRun
              ? {
                  ...state.currentRun,
                  timeRemaining: newTime,
                  collectedLoot: state.currentRun.collectedLoot.concat(loot),
                }
              : null,
          }));
          // If room contains equipment, handle cargo capacity
          if (room.equipment) {
            const eq = room.equipment;
            const run = get().currentRun;
            const ship = get().playerShip;
            const capacity = ship?.cargoCapacity ?? 10;
            const currentLoaded =
              (run?.collectedLoot?.length ?? 0) +
              (run?.collectedEquipment?.length ?? 0);

            if (currentLoaded >= capacity) {
              // Cargo full - trigger swap modal
              set({ cargoSwapPending: { newItem: eq, source: "salvage" } });
            } else {
              // Space available - add directly
              room.equipment = null;
              set((state) => ({
                currentRun: state.currentRun
                  ? {
                      ...state.currentRun,
                      collectedEquipment: (
                        state.currentRun.collectedEquipment || []
                      ).concat(eq),
                    }
                  : null,
              }));
            }
          }
          // Award XP to matching skill for active crew
          get().gainSkillXp(matchingSkill, 10);
        } else {
          // fail
          damageTaken = damageOnFail(room.hazardLevel);
          const sanityLoss = SANITY_LOSS_BASE + room.hazardLevel;
          set((state) => {
            const updated = state.crewRoster.map((c) =>
              c.id === activeCrew.id
                ? {
                    ...c,
                    hp: Math.max(0, c.hp - damageTaken),
                    sanity: Math.max(0, c.sanity - sanityLoss),
                  }
                : c,
            );
            return {
              currentRun: state.currentRun
                ? { ...state.currentRun, timeRemaining: newTime }
                : null,
              crewRoster: updated,
              crew: updated.find((c) => c.id === activeCrew.id) ?? state.crew,
            };
          });
          // Award smaller XP on failure
          get().gainSkillXp(matchingSkill, 5);
        }

        // Mark room looted regardless of success to keep things moving
        set((state) => ({
          availableWrecks: state.availableWrecks.map((w) =>
            w.id === wreck.id
              ? {
                  ...w,
                  rooms: w.rooms.map((r) =>
                    r.id === room.id ? { ...r, looted: true } : r,
                  ),
                }
              : w,
          ),
        }));

        // Deduct stamina from active crew
        set((state) => {
          const updated = state.crewRoster.map((c) =>
            c.id === activeCrew.id
              ? { ...c, stamina: Math.max(0, c.stamina - STAMINA_PER_SALVAGE) }
              : c,
          );
          return {
            crewRoster: updated,
            crew: updated.find((c) => c.id === activeCrew.id) ?? state.crew,
          };
        });

        // Chance to trigger salvage event
        if (Math.random() < SALVAGE_EVENT_CHANCE) {
          const ev = pickEventByTrigger("salvage", get() as any);
          if (ev) set({ activeEvent: ev });
        }

        // Check for forced retreat if time exhausted
        if (newTime <= 0) {
          set((state) => ({
            currentRun: state.currentRun
              ? { ...state.currentRun, status: "returning", timeRemaining: 0 }
              : null,
          }));
        }

        return { success, damage: damageTaken };
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

        // Check cargo capacity (1 item = 1 slot)
        const ship = get().playerShip;
        const capacity = ship?.cargoCapacity ?? 10;
        const currentLoaded = run.collectedLoot.length;
        if (currentLoaded + 1 > capacity) {
          // Trigger cargo swap modal
          set({ cargoSwapPending: { newItem: item, source: "salvage" } });
          return { success: false, damage: 0, timeCost: 0 };
        }

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

        // Calculate time cost based on rarity
        const timeCost = RARITY_TIME_COST[item.rarity];
        const newTime = run.timeRemaining - timeCost;

        const getActiveCrew = () => {
          const roster = get().crewRoster || [];
          const selected = get().selectedCrewId;
          return roster.find((c) => c.id === selected) ?? roster[0];
        };
        const activeCrew = getActiveCrew();
        // Hazard check for entering/working in room
        let successChance = calculateHazardSuccess(
          activeCrew.skills,
          room.hazardType as any,
          room.hazardLevel,
          wreck.tier,
        );

        // Apply trait skill modifiers
        const traitMods = calculateTraitEffects(activeCrew);
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

        if (roll < Math.max(0, successChance)) {
          // Success - take the item
          success = true;
          const activeEffects = getActiveEffects(get().playerShip as any);
          const traitMods = calculateTraitEffects(activeCrew);
          const adjustedItem = {
            ...item,
            value: Math.round(
              calculateLootValue(
                item.value,
                activeCrew.skills.salvage,
                activeEffects,
              ) * (1 + traitMods.lootMod / 100)
            ),
          };

          set((state) => ({
            currentRun: state.currentRun
              ? {
                  ...state.currentRun,
                  timeRemaining: newTime,
                  collectedLoot:
                    state.currentRun.collectedLoot.concat(adjustedItem),
                  stats: {
                    ...state.currentRun.stats,
                    roomsSucceeded: state.currentRun.stats.roomsSucceeded + 1,
                  },
                }
              : null,
            // Also add to persistent inventory immediately
            inventory: state.inventory.concat(adjustedItem),
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

          // If room contains equipment, handle cargo capacity
          if (room.equipment) {
            const eq = room.equipment;
            const run = get().currentRun;
            const ship = get().playerShip;
            const capacity = ship?.cargoCapacity ?? 10;
            const currentLoaded =
              (run?.collectedLoot?.length ?? 0) +
              (run?.collectedEquipment?.length ?? 0);

            if (currentLoaded >= capacity) {
              // Cargo full - trigger swap modal
              set({ cargoSwapPending: { newItem: eq, source: "salvage" } });
            } else {
              // Space available - add directly
              room.equipment = null;
              set((state) => ({
                currentRun: state.currentRun
                  ? {
                      ...state.currentRun,
                      collectedEquipment: (
                        state.currentRun.collectedEquipment || []
                      ).concat(eq),
                    }
                  : null,
              }));
            }
          }

          get().gainSkillXp(matchingSkill, xpSuccess);
        } else {
          // Fail - take damage, waste time
          damageTaken = damageOnFail(room.hazardLevel);
          set((state) => {
            const updated = state.crewRoster.map((c) =>
              c.id === activeCrew.id
                ? { ...c, hp: Math.max(0, c.hp - damageTaken) }
                : c,
            );
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
              crew: updated.find((c) => c.id === activeCrew.id) ?? state.crew,
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

        // Check for breakdown events (sanity === 0)
        const breakdownCrew = updatedRoster.find((c) => c.status === "breakdown");
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

        // Move collected equipment from run into equipmentInventory (not sold)
        // Keep currentRun with status 'completed' so player can sell loot in HubScreen
        set((state) => ({
          equipmentInventory: (state.equipmentInventory || []).concat(
            run.collectedEquipment || [],
          ),
        }));
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

        const room = ship.grid.flat().find((r: any) => r.id === roomId) as any;
        if (!room || !Array.isArray(room.slots)) return false;
        const slot = room.slots.find((s: any) => s.id === slotId);
        if (!slot) return false;

        // Check both equipment inventory and regular inventory for equippable items
        const equipmentInventory = state.equipmentInventory || [];
        const lootInventory = state.inventory || [];

        let item = equipmentInventory.find((i) => i.id === itemId);
        let isFromEquipment = true;

        if (!item) {
          item = lootInventory.find((i) => i.id === itemId);
          isFromEquipment = false;
        }

        if (!item) return false;

        const check = canInstall(ship, slot, item);
        if (!check.success) return false;

        const fee = getShipyardFee(state.licenseTier, "install");
        if (state.credits < fee) return false;

        installItem(ship, slot, item);

        // Remove from the correct inventory
        if (isFromEquipment) {
          set((s) => ({
            equipmentInventory: (s.equipmentInventory || []).filter(
              (e) => e.id !== itemId,
            ),
            credits: s.credits - fee,
            playerShip: { ...ship },
          }));
        } else {
          set((s) => ({
            inventory: s.inventory.filter((i) => i.id !== itemId),
            credits: s.credits - fee,
            playerShip: { ...ship },
          }));
        }

        return true;
      },

      uninstallItemFromShip: (roomId: string, slotId: string) => {
        const state = get();
        const ship = state.playerShip;
        if (!ship) return false;

        const room = ship.grid.flat().find((r: any) => r.id === roomId) as any;
        if (!room || !Array.isArray(room.slots)) return false;
        const slot = room.slots.find((s: any) => s.id === slotId);
        if (!slot || !slot.installedItem) return false;

        const fee = getShipyardFee(state.licenseTier, "uninstall");
        if (state.credits < fee) return false;

        const removed = uninstallItem(ship, slot);
        if (!removed) return false;

        set((s) => ({
          equipmentInventory: (s.equipmentInventory || []).concat(removed),
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
          equipmentInventory: [], // Starting equipment now pre-installed on ship
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

      migrateSave: async () => {
        const state = get();
        const updates: Partial<GameState> = {};
        // Ensure equipment inventory exists
        if (typeof state.equipmentInventory === "undefined")
          updates.equipmentInventory = [];
        if (typeof state.cargoSwapPending === "undefined")
          updates.cargoSwapPending = null;

        // Ensure playerShip has reactor and powerCapacity
        if (
          state.playerShip &&
          (!state.playerShip.reactor || !state.playerShip.powerCapacity)
        ) {
          const reactor = REACTORS["salvaged-reactor"];
          updates.playerShip = {
            ...state.playerShip,
            reactor,
            powerCapacity: reactor.powerOutput,
          } as any;
        }

        // Migrate wrecks to have ship layouts (Phase 8+ feature)
        const wasmBridge = (await import("../game/wasm/WasmBridge")).default;
        const { Ship } = await import("../game/ship");
        const { SeededRandom } = await import("../game/random");
        let wrecksMigrated = false;
        const migratedWrecks = state.availableWrecks.map((wreck) => {
          const ship = (wreck as any).ship;
          if (ship && !ship.layout) {
            wrecksMigrated = true;
            const layoutTemplate =
              wreck.type === "military"
                ? "L-military"
                : wreck.type === "science"
                  ? "Cross-science"
                  : wreck.type === "industrial"
                    ? "U-industrial"
                    : wreck.type === "luxury"
                      ? "H-luxury"
                      : "T-freighter";
            ship.layout = wasmBridge.generateShipLayoutSync(
              wreck.id,
              layoutTemplate,
            );
            console.log(
              "[Migration] Added layout to wreck:",
              wreck.id,
              layoutTemplate,
            );
          }
          // Ensure ships with layouts have door connections that match the layout.
          // Older saves may have rectangular-grid connections that are incompatible with the layout.
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
          updates.availableWrecks = migratedWrecks;
        }

        if (Object.keys(updates).length > 0) set((s) => ({ ...s, ...updates }));
      },

      handleCargoSwap: (dropItemId: string) => {
        const pending = get().cargoSwapPending;
        if (!pending) return;

        const run = get().currentRun;
        if (!run) return;

        // Remove the dropped item from cargo
        const updatedLoot = run.collectedLoot.filter(
          (item) => item.id !== dropItemId,
        );
        const updatedEquipment = (run.collectedEquipment || []).filter(
          (item) => item.id !== dropItemId,
        );

        // Add the new equipment
        set((state) => ({
          currentRun: state.currentRun
            ? {
                ...state.currentRun,
                collectedLoot: updatedLoot,
                collectedEquipment: updatedEquipment.concat(pending.newItem),
              }
            : null,
          cargoSwapPending: null,
        }));
      },

      cancelCargoSwap: () => {
        // User chose to leave the item behind
        set({ cargoSwapPending: null });
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
        if (state.crewRoster.length >= 5) return false; // roster full

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
          background: "station_rat",
          traits: [],
          skills: candidate.skills,
          skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
          hp: 100,
          maxHp: 100,
          stamina: BASE_STAMINA,
          maxStamina: BASE_STAMINA,
          sanity: BASE_SANITY,
          maxSanity: BASE_SANITY,
          hiredDay: state.day,
          hireCost: cost,
          currentJob: "idle",
          status: "active",
          position: { location: "station" },
        };

        set((s) => ({
          credits: s.credits - cost,
          crewRoster: s.crewRoster.concat(newCrew),
          crew: s.crew,
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
          const currentLoaded = run.collectedLoot.length + (run.collectedEquipment?.length ?? 0);
          if (currentLoaded >= capacity) {
            result.stopReason = "cargo_full";
            break;
          }
          
          // Check crew conditions based on rules
          const activeCrew = state.crewRoster.find((c) => c.id === state.selectedCrewId) ?? state.crewRoster[0];
          if (activeCrew) {
            // Check injury
            if (rules.stopOnInjury && activeCrew.hp < activeCrew.maxHp * 0.5) {
              result.stopReason = "injury";
              break;
            }
            
            // Check stamina
            if (activeCrew.stamina <= rules.stopOnLowStamina) {
              result.stopReason = "crew_exhausted";
              break;
            }
            
            // Check sanity
            if (activeCrew.sanity <= rules.stopOnLowSanity) {
              result.stopReason = "crew_exhausted";
              break;
            }
          }
          
          // Find next room to salvage based on rules
          const wreck = state.availableWrecks.find((w) => w.id === run.wreckId);
          if (!wreck) {
            result.stopReason = "complete";
            break;
          }
          
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
          
          // Salvage the room
          const previousLootCount = run.collectedLoot.length;
          
          const salvageResult = get().salvageRoom(nextRoom.id);
          
          if (salvageResult.success) {
            result.roomsSalvaged++;
            
            // Calculate loot gained
            const newRun = get().currentRun;
            if (newRun) {
              const newLootCount = newRun.collectedLoot.length - previousLootCount;
              result.lootCollected += newLootCount;
              
              // Estimate credits
              for (let i = previousLootCount; i < newRun.collectedLoot.length; i++) {
                result.creditsEarned += newRun.collectedLoot[i]?.value ?? 0;
              }
            }
          }
          
          // Check for injuries
          if (salvageResult.damage > 0) {
            result.injuries++;
            if (rules.stopOnInjury) {
              result.stopReason = "injury";
              break;
            }
          }
          
          // Wait before next tick
          await sleep(delay);
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
    }),
    {
      name: "ship-breakers-store-v1",
    },
  ),
);

// For debugging
// @ts-ignore
window.gameStore = useGameStore;

// Run migration on startup to handle older saves
setTimeout(() => {
  try {
    useGameStore.getState().migrateSave?.();
  } catch (e) {
    console.warn("Migration failed:", e);
  }
}, 50);
