import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Loot } from '../types';
import { generateWreck } from '../game/wreckGenerator';
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
} from '../game/constants';
import { calculateHazardSuccess, damageOnFail, calculateLootValue } from '../game/hazardLogic';

interface GameActions {
  initializeGame: () => void;
  startRun: (wreckId: string) => void;
  travelToWreck: (wreckId: string) => void;
  salvageRoom: (roomId: string) => { success: boolean; damage: number };
  salvageItem: (roomId: string, itemId: string) => { success: boolean; damage: number; timeCost: number };
  returnToStation: () => void;
  sellAllLoot: () => void;
  sellItem: (itemId: string) => void;
  healCrew: (amount: number) => void;
  scanForWrecks: () => void;
  resetGame: () => void;
  gainSkillXp: (skill: keyof typeof STARTING_SKILLS, amount: number) => void;
  payLicense: () => void;
  buyFuel: (amount: number) => boolean;
  payForHealing: () => boolean;
  updateSettings: (settings: Partial<GameState['settings']>) => void;
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      credits: STARTING_CREDITS,
      fuel: STARTING_FUEL,
      crew: { name: 'Player', skills: STARTING_SKILLS as any, skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 }, hp: STARTING_HP, maxHp: STARTING_HP },
      availableWrecks: [generateWreck(), generateWreck(), generateWreck()],
      currentRun: null,
      inventory: [],
      day: 1,
      licenseDaysRemaining: 14,
      licenseFee: 5000,
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

      initializeGame: () => {
        set({
          credits: STARTING_CREDITS,
          fuel: STARTING_FUEL,
          crew: { name: 'Player', skills: STARTING_SKILLS as any, skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 }, hp: STARTING_HP, maxHp: STARTING_HP },
          availableWrecks: [generateWreck(), generateWreck(), generateWreck()],
          currentRun: null,
          inventory: [],
          day: 1,
          licenseDaysRemaining: 14,
          licenseFee: 5000,
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
        });
      },

      startRun: (wreckId: string) => {
        const wreck = get().availableWrecks.find((w) => w.id === wreckId);
        if (!wreck) return;
        const piloting = get().crew.skills.piloting ?? 0;
        const reduction = Math.max(0, 1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL);
        const travelCost = Math.max(1, Math.ceil(wreck.distance * FUEL_COST_PER_AU * reduction));
        if (get().fuel < travelCost * 2) return; // need round trip

        set((state) => ({
          fuel: state.fuel - travelCost, // consume fuel for travel (one-way)
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
        const piloting = get().crew.skills.piloting ?? 0;
        const reduction = Math.max(0, 1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL);
        const travelCost = Math.max(1, Math.ceil(wreck.distance * FUEL_COST_PER_AU * reduction));
        set((state) => ({
          fuel: state.fuel - travelCost, // arrive (consume second leg)
          currentRun: state.currentRun
            ? { ...state.currentRun, status: 'salvaging' }
            : null,
        }));
      },

      salvageRoom: (roomId: string) => {
        const run = get().currentRun;
        if (!run) return { success: false, damage: 0 };
        const wreck = get().availableWrecks.find((w) => w.id === run.wreckId)!;
        const room = wreck.rooms.find((r) => r.id === roomId);
        if (!room || room.looted) return { success: false, damage: 0 };

        // Deduct time
        const newTime = run.timeRemaining - 2;
        // Hazard check
        const successChance = calculateHazardSuccess(get().crew.skills, room.hazardType as any, room.hazardLevel, wreck.tier);
        const roll = Math.random() * 100;
        let damageTaken = 0;
        let success = false;
        
        // Determine which skill to award XP to based on hazard type
        const matchingSkill = SKILL_HAZARD_MAP[room.hazardType as any] as keyof typeof STARTING_SKILLS;
        
        if (roll < Math.max(0, successChance)) {
          // success
          success = true;
          const loot = room.loot.map((l) => ({ ...l, value: calculateLootValue(l.value, get().crew.skills.salvage) }));
          set((state) => ({
            currentRun: state.currentRun
              ? { ...state.currentRun, timeRemaining: newTime, collectedLoot: state.currentRun.collectedLoot.concat(loot) }
              : null,
          }));
          // Award XP to matching skill
          get().gainSkillXp(matchingSkill, 10);
        } else {
          // fail
          damageTaken = damageOnFail(room.hazardLevel);
          set((state) => ({
            currentRun: state.currentRun ? { ...state.currentRun, timeRemaining: newTime } : null,
            crew: { ...state.crew, hp: Math.max(0, state.crew.hp - damageTaken) },
          }));
          // Award smaller XP on failure
          get().gainSkillXp(matchingSkill, 5);
        }

        // Mark room looted regardless of success to keep things moving
        set((state) => ({
          availableWrecks: state.availableWrecks.map((w) =>
            w.id === wreck.id
              ? { ...w, rooms: w.rooms.map((r) => (r.id === room.id ? { ...r, looted: true } : r)) }
              : w
          ),
        }));

        // Check for forced retreat if time exhausted
        if (newTime <= 0) {
          set((state) => ({
            currentRun: state.currentRun ? { ...state.currentRun, status: 'returning', timeRemaining: 0 } : null,
          }));
        }

        return { success, damage: damageTaken };
      },

      salvageItem: (roomId: string, itemId: string) => {
        const run = get().currentRun;
        if (!run) return { success: false, damage: 0, timeCost: 0 };
        const wreck = get().availableWrecks.find((w) => w.id === run.wreckId)!;
        const room = wreck.rooms.find((r) => r.id === roomId);
        if (!room || room.looted) return { success: false, damage: 0, timeCost: 0 };
        
        const item = room.loot.find((l) => l.id === itemId);
        if (!item) return { success: false, damage: 0, timeCost: 0 };
        
        // Increment rooms attempted at start
        set((state) => ({
          currentRun: state.currentRun
            ? { ...state.currentRun, 
                stats: {
                  ...state.currentRun.stats,
                  roomsAttempted: state.currentRun.stats.roomsAttempted + 1,
                }
              }
            : null,
        }));
        
        // Calculate time cost based on rarity
        const timeCost = RARITY_TIME_COST[item.rarity];
        const newTime = run.timeRemaining - timeCost;
        
        // Hazard check for entering/working in room
        const successChance = calculateHazardSuccess(get().crew.skills, room.hazardType as any, room.hazardLevel, wreck.tier);
        const roll = Math.random() * 100;
        let damageTaken = 0;
        let success = false;
        
        const matchingSkill = SKILL_HAZARD_MAP[room.hazardType as any] as keyof typeof STARTING_SKILLS;
        
        // Calculate XP based on difficulty: base + (hazard level * multiplier) + (tier * multiplier)
        const xpSuccess = XP_BASE_SUCCESS + (room.hazardLevel * XP_PER_HAZARD_LEVEL) + (wreck.tier * XP_PER_TIER);
        const xpFail = XP_BASE_FAIL + Math.floor((room.hazardLevel * XP_PER_HAZARD_LEVEL + wreck.tier * XP_PER_TIER) / 2);
        
        if (roll < Math.max(0, successChance)) {
          // Success - take the item
          success = true;
          const adjustedItem = { ...item, value: calculateLootValue(item.value, get().crew.skills.salvage) };
          
          set((state) => ({
            currentRun: state.currentRun
              ? { ...state.currentRun, 
                  timeRemaining: newTime, 
                  collectedLoot: state.currentRun.collectedLoot.concat(adjustedItem),
                  stats: {
                    ...state.currentRun.stats,
                    roomsSucceeded: state.currentRun.stats.roomsSucceeded + 1,
                  }
                }
              : null,
            // Remove item from room
            availableWrecks: state.availableWrecks.map((w) =>
              w.id === wreck.id
                ? { ...w, rooms: w.rooms.map((r) => {
                    if (r.id === room.id) {
                      const remainingLoot = r.loot.filter((l) => l.id !== itemId);
                      return { ...r, loot: remainingLoot, looted: remainingLoot.length === 0 };
                    }
                    return r;
                  })}
                : w
            ),
          }));
          
          get().gainSkillXp(matchingSkill, xpSuccess);
        } else {
          // Fail - take damage, waste time
          damageTaken = damageOnFail(room.hazardLevel);
          set((state) => ({
            currentRun: state.currentRun 
              ? { ...state.currentRun, 
                  timeRemaining: newTime,
                  stats: {
                    ...state.currentRun.stats,
                    roomsFailed: state.currentRun.stats.roomsFailed + 1,
                    damageTaken: state.currentRun.stats.damageTaken + damageTaken,
                  }
                }
              : null,
            crew: { ...state.crew, hp: Math.max(0, state.crew.hp - damageTaken) },
          }));
          
          get().gainSkillXp(matchingSkill, xpFail);
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
        const reduction = Math.max(0, 1 - piloting * PILOTING_FUEL_REDUCTION_PER_LEVEL);
        const returnCost = Math.max(1, Math.ceil(wreck.distance * FUEL_COST_PER_AU * reduction));
        
        // Calculate days spent (based on distance)
        const daysSpent = Math.max(1, Math.ceil(wreck.distance / 10)); // ~1 day per 10 AU
        
        set((state) => ({
          fuel: Math.max(0, state.fuel - returnCost),
          day: state.day + daysSpent,
          licenseDaysRemaining: Math.max(0, state.licenseDaysRemaining - daysSpent),
          currentRun: { ...run, 
            status: 'completed',
            stats: {
              ...run.stats,
              fuelSpent: run.stats.fuelSpent + returnCost,
            }
          },
          stats: {
            ...state.stats,
            daysPlayed: state.stats.daysPlayed + daysSpent,
          },
        }));
      },

      sellAllLoot: () => {
        const run = get().currentRun;
        if (!run) return;
        const value = run.collectedLoot.reduce((s, l) => s + l.value, 0);
        const mostValuable = run.collectedLoot.reduce<Loot | null>((max, item) => (!max || item.value > max.value) ? item : max, null);
        const wreck = get().availableWrecks.find((w) => w.id === run.wreckId);
        set((state) => ({
          credits: state.credits + value,
          currentRun: null,
          // remove looted rooms from wreck if found
          availableWrecks: wreck 
            ? state.availableWrecks.map((w) =>
                w.id === run.wreckId ? { ...w, stripped: w.rooms.every((r) => r.looted) } : w
              )
            : state.availableWrecks,
          stats: {
            ...state.stats,
            totalCreditsEarned: state.stats.totalCreditsEarned + value,
            totalWrecksCleared: state.stats.totalWrecksCleared + 1,
            totalItemsCollected: state.stats.totalItemsCollected + run.collectedLoot.length,
            highestSingleProfit: Math.max(state.stats.highestSingleProfit, value),
            mostValuableItem: mostValuable && mostValuable.value > (state.stats.mostValuableItem?.value ?? 0) 
              ? { name: mostValuable.name, value: mostValuable.value }
              : state.stats.mostValuableItem,
          },
        }));
      },

      healCrew: (amount: number) => {
        set((state) => ({
          credits: Math.max(0, state.credits - amount),
          crew: { ...state.crew, hp: Math.min(state.crew.maxHp, state.crew.hp + Math.floor(amount / 10) * 10) },
        }));
      },

      scanForWrecks: () => {
        set((state) => ({
          credits: Math.max(0, state.credits - SCAN_COST),
          availableWrecks: state.availableWrecks.map((w) => (w.stripped ? generateWreck() : w)),
        }));
      },

      resetGame: () => {
        set({
          credits: STARTING_CREDITS,
          fuel: STARTING_FUEL,
          crew: { name: 'Player', skills: STARTING_SKILLS as any, skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 }, hp: STARTING_HP, maxHp: STARTING_HP },
          availableWrecks: [generateWreck(), generateWreck(), generateWreck()],
          currentRun: null,
        });
      },

      gainSkillXp: (skill: keyof typeof STARTING_SKILLS, amount: number) => {
        const currentXp = get().crew.skillXp[skill];
        const currentLevel = get().crew.skills[skill];
        const newXp = currentXp + amount;
        
        console.log(`[XP] ${skill}: ${currentXp} + ${amount} = ${newXp} (Lv.${currentLevel})`);
        
        // Check for level up
        let newLevel = currentLevel;
        const cumulativeXp = SKILL_XP_THRESHOLDS.reduce((sum, threshold, idx) => {
          if (idx < currentLevel - 1) return sum + threshold;
          return sum;
        }, 0);
        
        // Check if we crossed a threshold
        if (currentLevel < 5) {
          const nextThreshold = SKILL_XP_THRESHOLDS[currentLevel - 1];
          const xpIntoCurrentLevel = newXp - cumulativeXp;
          if (xpIntoCurrentLevel >= nextThreshold) {
            newLevel = currentLevel + 1;
            console.log(`🎉 ${skill.toUpperCase()} leveled up to ${newLevel}!`);
          }
        }
        
        set((state) => ({
          crew: { 
            ...state.crew, 
            skillXp: { ...state.crew.skillXp, [skill]: newXp },
            skills: { ...state.crew.skills, [skill]: newLevel },
          },
          currentRun: state.currentRun ? {
            ...state.currentRun,
            stats: {
              ...state.currentRun.stats,
              xpGained: {
                ...state.currentRun.stats.xpGained,
                [skill]: (state.currentRun.stats.xpGained[skill] ?? 0) + amount,
              },
            },
          } : null,
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

      payLicense: () => {
        const fee = get().licenseFee;
        if (get().credits < fee) return;
        set((state) => ({
          credits: state.credits - fee,
          licenseDaysRemaining: 14,
          stats: {
            ...state.stats,
            licensesRenewed: state.stats.licensesRenewed + 1,
          },
        }));
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

      payForHealing: () => {
        const state = get();
        const healingCost = 50; // HEALING_COST
        const healingAmount = 10; // HEALING_AMOUNT
        
        if (state.credits < healingCost) return false;
        if (state.crew.hp >= state.crew.maxHp) return false;
        
        set((s) => ({
          credits: s.credits - healingCost,
          crew: {
            ...s.crew,
            hp: Math.min(s.crew.hp + healingAmount, s.crew.maxHp),
          },
        }));
        return true;
      },

      updateSettings: (settings: Partial<GameState['settings']>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
          },
        }));
      },
    }),
    {
      name: 'ship-breakers-store-v1',
    }
  )
);

// For debugging
// @ts-ignore
window.gameStore = useGameStore;
