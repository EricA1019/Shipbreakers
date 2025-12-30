import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState } from '../types';
import { generateWreck } from '../game/wreckGenerator';
import {
  STARTING_CREDITS,
  STARTING_FUEL,
  STARTING_TIME,
  STARTING_HP,
  STARTING_SKILL,
  FUEL_COST_PER_AU,
  SCAN_COST,
} from '../game/constants';
import { calculateHazardSuccess, damageOnFail } from '../game/hazardLogic';

interface GameActions {
  initializeGame: () => void;
  startRun: (wreckId: string) => void;
  travelToWreck: (wreckId: string) => void;
  salvageRoom: (roomId: string) => { success: boolean; damage: number };
  returnToStation: () => void;
  sellAllLoot: () => void;
  healCrew: (amount: number) => void;
  scanForWrecks: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      credits: STARTING_CREDITS,
      fuel: STARTING_FUEL,
      crew: { name: 'Player', skill: STARTING_SKILL, hp: STARTING_HP, maxHp: STARTING_HP },
      availableWrecks: [generateWreck(), generateWreck(), generateWreck()],
      currentRun: null,

      initializeGame: () => {
        set({
          credits: STARTING_CREDITS,
          fuel: STARTING_FUEL,
          crew: { name: 'Player', skill: STARTING_SKILL, hp: STARTING_HP, maxHp: STARTING_HP },
          availableWrecks: [generateWreck(), generateWreck(), generateWreck()],
          currentRun: null,
        });
      },

      startRun: (wreckId: string) => {
        const wreck = get().availableWrecks.find((w) => w.id === wreckId);
        if (!wreck) return;
        const travelCost = Math.ceil(wreck.distance * FUEL_COST_PER_AU);
        if (get().fuel < travelCost * 2) return; // need round trip

        set((state) => ({
          fuel: state.fuel - travelCost, // consume fuel for travel (one-way)
          currentRun: {
            wreckId: wreck.id,
            status: 'traveling',
            timeRemaining: STARTING_TIME,
            collectedLoot: [],
          },
        }));
      },

      travelToWreck: (wreckId: string) => {
        const wreck = get().availableWrecks.find((w) => w.id === wreckId);
        if (!wreck) return;
        const travelCost = Math.ceil(wreck.distance * FUEL_COST_PER_AU);
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
        const successChance = calculateHazardSuccess(get().crew.skill, room.hazardLevel);
        const roll = Math.random() * 100;
        let damageTaken = 0;
        let success = false;
        if (roll < Math.max(0, successChance)) {
          // success
          success = true;
          const loot = room.loot;
          set((state) => ({
            currentRun: state.currentRun
              ? { ...state.currentRun, timeRemaining: newTime, collectedLoot: state.currentRun.collectedLoot.concat(loot) }
              : null,
          }));
        } else {
          // fail
          damageTaken = damageOnFail(room.hazardLevel);
          set((state) => ({
            currentRun: state.currentRun ? { ...state.currentRun, timeRemaining: newTime } : null,
            crew: { ...state.crew, hp: Math.max(0, state.crew.hp - damageTaken) },
          }));
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

      returnToStation: () => {
        const run = get().currentRun;
        if (!run) return;
        const wreck = get().availableWrecks.find((w) => w.id === run.wreckId)!;
        const returnCost = Math.ceil(wreck.distance * FUEL_COST_PER_AU);
        set((state) => ({
          fuel: Math.max(0, state.fuel - returnCost),
          // reward: keep loot in run, we'll sell at station
          currentRun: { ...run, status: 'completed' },
        }));
      },

      sellAllLoot: () => {
        const run = get().currentRun;
        if (!run) return;
        const value = run.collectedLoot.reduce((s, l) => s + l.value, 0);
        set((state) => ({
          credits: state.credits + value,
          currentRun: null,
          // remove looted rooms from wreck
          availableWrecks: state.availableWrecks.map((w) =>
            w.id === run.wreckId ? { ...w, stripped: w.rooms.every((r) => r.looted) } : w
          ),
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
          crew: { name: 'Player', skill: STARTING_SKILL, hp: STARTING_HP, maxHp: STARTING_HP },
          availableWrecks: [generateWreck(), generateWreck(), generateWreck()],
          currentRun: null,
        });
      },
    }),
    {
      name: 'ship-breakers-store',
    }
  )
);

// For debugging
// @ts-ignore
window.gameStore = useGameStore;
