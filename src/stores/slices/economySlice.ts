/**
 * Economy Slice - Manages credits, fuel, provisions, and licenses
 * 
 * Responsibilities:
 * - Credits management
 * - Fuel purchases and consumption
 * - Provisions system (food, drink, luxury items)
 * - License management (payment, upgrades)
 * - Station services (healing, refills)
 * - Shore leave system
 * 
 * Extracted from gameStore.ts to improve maintainability.
 */
import type { StateCreator } from 'zustand';
import type { GameState, GraveyardZone, LicenseTier, ShoreLeaveType } from '../../types';
import { LICENSE_TIERS } from '../../types';
import {
  FUEL_PRICE,
  PROVISION_PRICES,
  SHORE_LEAVE_OPTIONS,
  LOUNGE_EVENT_CHANCE,
} from '../../game/constants';
import { pickEventByTrigger } from '../../game/systems/EventManager';
import { processInjuryRecovery } from '../../services/injuryService';

/**
 * Economy slice state interface
 */
export interface EconomySliceState {
  // State
  credits: number;
  fuel: number;
  food: number;
  drink: number;
  luxuryDrink: number;
  pantryCapacity: {
    food: number;
    drink: number;
    luxury: number;
  };
  daysWithoutFood: number;
  beerRationDays: number;
  crewEfficiencyPenalty: number;
  licenseDaysRemaining: number;
  licenseFee: number;
  licenseTier: LicenseTier;
  unlockedZones: GraveyardZone[];
  lastUnlockedZone?: GraveyardZone | null;
}

/**
 * Economy slice actions interface
 */
export interface EconomySliceActions {
  // Fuel
  buyFuel: (amount: number) => boolean;
  refillFuel: () => { amount: number; cost: number };
  
  // Provisions
  buyProvision: (kind: 'food' | 'water' | 'beer' | 'wine') => boolean;
  refillProvisions: () => { food: number; drink: number; cost: number };
  
  // License
  payLicense: () => void;
  upgradeLicense: (tier: LicenseTier) => boolean;
  clearLastUnlockedZone: () => void;
  
  // Shore leave
  takeShoreLeave: (type: ShoreLeaveType) => void;
}

/**
 * Create the economy slice
 */
export const createEconomySlice: StateCreator<
  GameState,
  [],
  [],
  EconomySliceState & EconomySliceActions
> = (set, get) => ({
  // Initial state
  credits: 0,
  fuel: 0,
  food: 0,
  drink: 0,
  luxuryDrink: 0,
  pantryCapacity: {
    food: 20,
    drink: 20,
    luxury: 10,
  },
  daysWithoutFood: 0,
  beerRationDays: 0,
  crewEfficiencyPenalty: 0,
  licenseDaysRemaining: 0,
  licenseFee: 0,
  licenseTier: 'basic',
  unlockedZones: [],
  lastUnlockedZone: null,

  // Actions
  buyFuel: (amount: number) => {
    const cost = amount * FUEL_PRICE;
    if (get().credits < cost) return false;

    set((state) => ({
      credits: state.credits - cost,
      fuel: state.fuel + amount,
    }));
    return true;
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

  buyProvision: (kind) => {
    const state: any = get();
    const prices = PROVISION_PRICES;
    const pantry = state.pantryCapacity;
    if (!pantry) return false;

    const price = (prices as any)[kind];
    if (state.credits < price) return false;

    if (kind === 'food') {
      if ((state as any).food >= pantry.food) return false;
      set({ credits: state.credits - price, food: (state as any).food + 1 });
      return true;
    }
    if (kind === 'water') {
      if ((state as any).drink >= pantry.drink) return false;
      set({ credits: state.credits - price, drink: (state as any).drink + 1 });
      return true;
    }
    if ((state as any).luxuryDrink >= pantry.luxury) return false;
    set({
      credits: state.credits - price,
      luxuryDrink: (state as any).luxuryDrink + 1,
    });
    return true;
  },

  refillProvisions: () => {
    const state: any = get();
    const pantry = state.pantryCapacity;
    if (!pantry) return { food: 0, drink: 0, cost: 0 };

    const foodNeeded = Math.max(0, pantry.food - state.food);
    const drinkNeeded = Math.max(0, pantry.drink - state.drink);
    const cost =
      foodNeeded * PROVISION_PRICES.food +
      drinkNeeded * PROVISION_PRICES.water;

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

  payLicense: () => {
    const tier = get().licenseTier || 'basic';
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
      lastUnlockedZone: LICENSE_TIERS[tier].unlocksZones.slice(-1)[0] ?? null,
    }));
    return true;
  },

  clearLastUnlockedZone: () => {
    set({ lastUnlockedZone: null });
  },

  takeShoreLeave: (type) => {
    const opt = (SHORE_LEAVE_OPTIONS as any)[type];
    if (!opt) return;

    const state: any = get();
    const crewCount = (state.crewRoster || []).length;
    const beerNeed = opt.beerPerCrew ? crewCount * opt.beerPerCrew : 0;

    const currentLuxuryDrink =
      typeof state.luxuryDrink === 'number' ? state.luxuryDrink : 0;
    const currentBeer = typeof state.beer === 'number' ? state.beer : 0;
    const currentWine = typeof state.wine === 'number' ? state.wine : 0;

    if (state.credits < opt.cost) return;

    // Back-compat: older saves/tests used beer+wine; newer uses luxuryDrink.
    // For party, allow consumption from any of these pools.
    let remainingNeed = beerNeed;
    let nextLuxuryDrink = currentLuxuryDrink;
    let nextBeer = currentBeer;
    let nextWine = currentWine;

    if (remainingNeed > 0) {
      const consume = (available: number) => {
        const used = Math.min(available, remainingNeed);
        remainingNeed -= used;
        return available - used;
      };

      nextLuxuryDrink = consume(nextLuxuryDrink);
      nextBeer = consume(nextBeer);
      nextWine = consume(nextWine);

      if (remainingNeed > 0) return;
    }

    const nextCredits = state.credits - opt.cost;

    const roster = state.crewRoster.map((c: any) => ({
      ...c,
      stamina: Math.min(
        c.maxStamina,
        (c.stamina ?? c.maxStamina) + opt.staminaRecovery
      ),
      sanity: Math.min(
        c.maxSanity,
        (c.sanity ?? c.maxSanity) + opt.sanityRecovery
      ),
      status: 'resting',
      currentJob: 'resting',
      position: { location: 'station' },
    }));

    set({
      credits: nextCredits,
      luxuryDrink: nextLuxuryDrink,
      ...(typeof state.beer === 'number' ? { beer: nextBeer } : {}),
      ...(typeof state.wine === 'number' ? { wine: nextWine } : {}),
      crewRoster: roster,
      crew:
        roster.find((c: any) => c.id === state.selectedCrewId) ?? roster[0],
    });

    set((s) => ({
      day: s.day + opt.duration,
      licenseDaysRemaining: Math.max(0, s.licenseDaysRemaining - opt.duration),
      stats: { ...s.stats, daysPlayed: s.stats.daysPlayed + opt.duration },
    }));

    (get() as any).dailyMarketRefresh?.();

    if (Math.random() < opt.eventChance) {
      const ev = pickEventByTrigger('social', get() as any);
      if (ev) set({ activeEvent: ev });
    }

    if (!get().activeEvent && Math.random() < LOUNGE_EVENT_CHANCE) {
      const ev = pickEventByTrigger('lounge', get() as any);
      if (ev) set({ activeEvent: ev });
    }

    for (let d = 0; d < opt.duration; d++) {
      const { updatedRoster: healedRoster } = processInjuryRecovery(
        get().crewRoster
      );
      set({ crewRoster: healedRoster });
    }
  },
});
