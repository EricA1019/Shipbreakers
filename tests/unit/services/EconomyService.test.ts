/**
 * EconomyService Tests
 */
import { describe, it, expect } from 'vitest';
import {
  buyFuel,
  sellItem,
  sellAllItems,
  payLicense,
  upgradeLicense,
  buyProvision,
  calculateInventoryValue,
  canAfford,
} from '../../../src/services/EconomyService';
import { createMockLoot, createMockStats, createMockPantry } from '../../fixtures';

describe('EconomyService', () => {
  describe('buyFuel', () => {
    it('should buy fuel when player has enough credits', () => {
      const state = { credits: 500, fuel: 10 };
      const result = buyFuel(state, 5);

      expect(result.success).toBe(true);
      expect(result.updates?.credits).toBe(450); // 5 * 10 = 50 cost
      expect(result.updates?.fuel).toBe(15);
    });

    it('should fail when player has insufficient credits', () => {
      const state = { credits: 10, fuel: 10 };
      const result = buyFuel(state, 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient credits');
    });

    it('should buy exact amount of fuel', () => {
      const state = { credits: 100, fuel: 0 };
      const result = buyFuel(state, 10);

      expect(result.success).toBe(true);
      expect(result.updates?.credits).toBe(0);
      expect(result.updates?.fuel).toBe(10);
    });
  });

  describe('sellItem', () => {
    it('should sell an item and add credits', () => {
      const item = createMockLoot({ id: 'item-1', value: 150 });
      const state = { credits: 100, inventory: [item] };
      const result = sellItem(state, 'item-1');

      expect(result.success).toBe(true);
      expect(result.updates?.credits).toBe(250);
      expect(result.updates?.inventory).toHaveLength(0);
    });

    it('should fail when item not found', () => {
      const state = { credits: 100, inventory: [] };
      const result = sellItem(state, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found');
    });

    it('should only remove the sold item', () => {
      const item1 = createMockLoot({ id: 'item-1', value: 100 });
      const item2 = createMockLoot({ id: 'item-2', value: 200 });
      const state = { credits: 0, inventory: [item1, item2] };
      const result = sellItem(state, 'item-1');

      expect(result.success).toBe(true);
      expect(result.updates?.inventory).toHaveLength(1);
      expect(result.updates?.inventory?.[0].id).toBe('item-2');
    });
  });

  describe('sellAllItems', () => {
    it('should sell all items and sum values', () => {
      const items = [
        createMockLoot({ id: 'item-1', value: 100 }),
        createMockLoot({ id: 'item-2', value: 200 }),
        createMockLoot({ id: 'item-3', value: 300 }),
      ];
      const state = { credits: 50, inventory: items };
      const result = sellAllItems(state);

      expect(result.success).toBe(true);
      expect(result.updates?.credits).toBe(650); // 50 + 600
      expect(result.updates?.inventory).toHaveLength(0);
    });

    it('should fail when inventory is empty', () => {
      const state = { credits: 100, inventory: [] };
      const result = sellAllItems(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No items to sell');
    });
  });

  describe('payLicense', () => {
    it('should pay license and reset days', () => {
      const state = {
        credits: 10000,
        licenseTier: 'basic' as const,
        licenseDaysRemaining: 1,
        stats: createMockStats({ licensesRenewed: 0 }),
      };
      const result = payLicense(state);

      expect(result.success).toBe(true);
      expect(result.updates?.licenseDaysRemaining).toBe(14); // basic tier duration
      expect(result.updates?.stats?.licensesRenewed).toBe(1);
    });

    it('should fail with insufficient credits', () => {
      const state = {
        credits: 100,
        licenseTier: 'basic' as const,
        licenseDaysRemaining: 1,
        stats: createMockStats(),
      };
      const result = payLicense(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient credits for license renewal');
    });
  });

  describe('upgradeLicense', () => {
    it('should upgrade license tier', () => {
      const state = {
        credits: 50000,
        licenseTier: 'basic' as const,
        licenseDaysRemaining: 5,
        unlockedZones: ['near'],
      };
      const result = upgradeLicense(state, 'standard');

      expect(result.success).toBe(true);
      expect(result.updates?.licenseTier).toBe('standard');
      expect(result.updates?.unlockedZones).toContain('mid');
    });

    it('should fail when cannot afford upgrade', () => {
      const state = {
        credits: 100,
        licenseTier: 'basic' as const,
        licenseDaysRemaining: 5,
        unlockedZones: ['near'],
      };
      const result = upgradeLicense(state, 'standard');

      expect(result.success).toBe(false);
    });
  });

  describe('buyProvision', () => {
    it('should buy food when under capacity', () => {
      const state = {
        credits: 100,
        food: 5,
        drink: 5,
        luxuryDrink: 2,
        pantryCapacity: createMockPantry({ food: 10 }),
      };
      const result = buyProvision(state, 'food');

      expect(result.success).toBe(true);
      expect(result.updates?.food).toBe(6);
    });

    it('should fail when food storage is full', () => {
      const state = {
        credits: 100,
        food: 10,
        drink: 5,
        luxuryDrink: 2,
        pantryCapacity: createMockPantry({ food: 10 }),
      };
      const result = buyProvision(state, 'food');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Food storage full');
    });

    it('should buy water', () => {
      const state = {
        credits: 100,
        food: 5,
        drink: 5,
        luxuryDrink: 2,
        pantryCapacity: createMockPantry({ drink: 10 }),
      };
      const result = buyProvision(state, 'water');

      expect(result.success).toBe(true);
      expect(result.updates?.drink).toBe(6);
    });

    it('should buy beer as luxury', () => {
      const state = {
        credits: 100,
        food: 5,
        drink: 5,
        luxuryDrink: 2,
        pantryCapacity: createMockPantry({ luxury: 5 }),
      };
      const result = buyProvision(state, 'beer');

      expect(result.success).toBe(true);
      expect(result.updates?.luxuryDrink).toBe(3);
    });
  });

  describe('calculateInventoryValue', () => {
    it('should sum all item values', () => {
      const inventory = [
        createMockLoot({ value: 100 }),
        createMockLoot({ value: 200 }),
        createMockLoot({ value: 300 }),
      ];
      expect(calculateInventoryValue(inventory)).toBe(600);
    });

    it('should return 0 for empty inventory', () => {
      expect(calculateInventoryValue([])).toBe(0);
    });
  });

  describe('canAfford', () => {
    it('should return true when credits >= cost', () => {
      expect(canAfford(100, 100)).toBe(true);
      expect(canAfford(150, 100)).toBe(true);
    });

    it('should return false when credits < cost', () => {
      expect(canAfford(50, 100)).toBe(false);
    });
  });
});
