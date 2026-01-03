/**
 * Economy Service
 * 
 * Handles all financial operations: buying, selling, licensing.
 * These are pure functions that return state updates for Zustand.
 */
import type { GameState, Loot, LicenseTier } from '../types';
import { LICENSE_TIERS } from '../types';
import { PROVISION_PRICES } from '../game/constants';

// Price constants
const FUEL_PRICE = 10;

/**
 * Result of an economy operation
 */
export interface EconomyResult {
  success: boolean;
  updates?: Partial<GameState>;
  error?: string;
}

/**
 * Buy fuel from the station
 */
export function buyFuel(state: Pick<GameState, 'credits' | 'fuel'>, amount: number): EconomyResult {
  const cost = amount * FUEL_PRICE;
  
  if (state.credits < cost) {
    return { success: false, error: 'Insufficient credits' };
  }

  return {
    success: true,
    updates: {
      credits: state.credits - cost,
      fuel: state.fuel + amount,
    },
  };
}

/**
 * Sell an item from inventory
 */
export function sellItem(
  state: Pick<GameState, 'credits' | 'inventory'>,
  itemId: string
): EconomyResult {
  const item = state.inventory.find((i: Loot) => i.id === itemId);
  
  if (!item) {
    return { success: false, error: 'Item not found' };
  }

  return {
    success: true,
    updates: {
      credits: state.credits + item.value,
      inventory: state.inventory.filter((i: Loot) => i.id !== itemId),
    },
  };
}

/**
 * Sell all items from inventory
 */
export function sellAllItems(
  state: Pick<GameState, 'credits' | 'inventory'>
): EconomyResult {
  const totalValue = state.inventory.reduce((sum: number, item: Loot) => sum + item.value, 0);
  
  if (state.inventory.length === 0) {
    return { success: false, error: 'No items to sell' };
  }

  return {
    success: true,
    updates: {
      credits: state.credits + totalValue,
      inventory: [],
    },
  };
}

/**
 * Pay license renewal fee
 */
export function payLicense(
  state: Pick<GameState, 'credits' | 'licenseTier' | 'licenseDaysRemaining' | 'stats'>
): EconomyResult {
  const tier = state.licenseTier || 'basic';
  const tierConfig = LICENSE_TIERS[tier];
  const fee = tierConfig.cost;

  if (state.credits < fee) {
    return { success: false, error: 'Insufficient credits for license renewal' };
  }

  return {
    success: true,
    updates: {
      credits: state.credits - fee,
      licenseDaysRemaining: tierConfig.duration,
      stats: {
        ...state.stats,
        licensesRenewed: state.stats.licensesRenewed + 1,
      },
    },
  };
}

/**
 * Upgrade license to a higher tier
 */
export function upgradeLicense(
  state: Pick<GameState, 'credits' | 'licenseTier' | 'licenseDaysRemaining' | 'unlockedZones'>,
  tier: LicenseTier
): EconomyResult {
  const tierConfig = LICENSE_TIERS[tier];
  const cost = tierConfig.cost;

  if (state.credits < cost) {
    return { success: false, error: 'Insufficient credits for license upgrade' };
  }

  return {
    success: true,
    updates: {
      credits: state.credits - cost,
      licenseTier: tier,
      licenseDaysRemaining: tierConfig.duration,
      unlockedZones: tierConfig.unlocksZones,
      lastUnlockedZone: tierConfig.unlocksZones.slice(-1)[0] ?? null,
    },
  };
}

type ProvisionKind = 'food' | 'water' | 'beer' | 'wine';

/**
 * Buy provisions (food, water, luxury drinks)
 */
export function buyProvision(
  state: Pick<GameState, 'credits' | 'food' | 'drink' | 'luxuryDrink' | 'pantryCapacity'>,
  kind: ProvisionKind
): EconomyResult {
  const pantry = state.pantryCapacity;
  if (!pantry) {
    return { success: false, error: 'No pantry capacity defined' };
  }

  const price = PROVISION_PRICES[kind];
  if (state.credits < price) {
    return { success: false, error: 'Insufficient credits' };
  }

  if (kind === 'food') {
    if (state.food >= pantry.food) {
      return { success: false, error: 'Food storage full' };
    }
    return {
      success: true,
      updates: {
        credits: state.credits - price,
        food: state.food + 1,
      },
    };
  }

  if (kind === 'water') {
    if (state.drink >= pantry.drink) {
      return { success: false, error: 'Water storage full' };
    }
    return {
      success: true,
      updates: {
        credits: state.credits - price,
        drink: state.drink + 1,
      },
    };
  }

  // beer/wine => luxury
  if (state.luxuryDrink >= pantry.luxury) {
    return { success: false, error: 'Luxury drink storage full' };
  }
  return {
    success: true,
    updates: {
      credits: state.credits - price,
      luxuryDrink: state.luxuryDrink + 1,
    },
  };
}

/**
 * Calculate total inventory value
 */
export function calculateInventoryValue(inventory: Loot[]): number {
  return inventory.reduce((sum, item) => sum + item.value, 0);
}

/**
 * Check if player can afford an amount
 */
export function canAfford(credits: number, cost: number): boolean {
  return credits >= cost;
}
