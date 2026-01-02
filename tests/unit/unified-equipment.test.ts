import { describe, it, expect, beforeEach } from 'vitest';
import type { Loot, PlayerShip, ItemSlot } from '../../src/types';
import { isEquippable } from '../../src/types';
import { initializePlayerShip } from '../../src/game/data/playerShip';

describe('Unified Loot-Equipment System', () => {
  let playerShip: PlayerShip;

  beforeEach(() => {
    playerShip = initializePlayerShip('test-seed');
  });

  it('should initialize player ship with proper room types', () => {
    expect(playerShip.rooms).toBeDefined();
    expect(playerShip.rooms.length).toBeGreaterThan(0);
  });

  it('should initialize bridge room with bridge slots', () => {
    const bridgeRoom = playerShip.rooms.find(r => r.roomType === 'bridge');
    expect(bridgeRoom).toBeDefined();
    expect(bridgeRoom?.slots).toBeDefined();
    expect(bridgeRoom!.slots.length).toBeGreaterThan(0);
  });

  it('should initialize engine room with engineering slots', () => {
    const engineRoom = playerShip.rooms.find(r => r.roomType === 'engine');
    expect(engineRoom).toBeDefined();
    expect(engineRoom?.slots).toBeDefined();
    expect(engineRoom!.slots.length).toBeGreaterThan(0);
  });

  it('should have empty slots after initialization', () => {
    playerShip.rooms.forEach(room => {
      if (room.slots) {
        room.slots.forEach(slot => {
          expect(slot.installedItem).toBeNull();
        });
      }
    });
  });

  describe('isEquippable type guard', () => {
    it('should identify equippable loot items', () => {
      const equippableLoot: Loot = {
        id: 'life-support',
        name: 'Life Support Module',
        category: 'tech',
        value: 500,
        rarity: 2,
        itemType: 'equipment',
        manufacturer: 'Hegemony Corp',
        description: 'Advanced life support system',
        slotType: 'engineering',
        tier: 2,
        powerDraw: 1,
      };

      expect(isEquippable(equippableLoot)).toBe(true);
    });

    it('should identify non-equippable loot items (sell-only)', () => {
      const sellOnlyLoot: Loot = {
        id: 'scrap-metal',
        name: 'Scrap Metal',
        category: 'materials',
        value: 100,
        rarity: 1,
        itemType: 'material',
        manufacturer: 'Unknown',
        description: 'Worthless metal scraps',
        // No slotType - not equippable
      };

      expect(isEquippable(sellOnlyLoot)).toBe(false);
    });

    it('should handle loot with slotType: undefined', () => {
      const loot: Loot = {
        id: 'test',
        name: 'Test Item',
        category: 'test',
        value: 100,
        rarity: 1,
        itemType: 'test',
        manufacturer: 'Test',
        description: 'Test',
        slotType: undefined,
      };

      expect(isEquippable(loot)).toBe(false);
    });

    it('should return true only when slotType is defined and not null', () => {
      const lootWithSlot: Loot = {
        id: 'test',
        name: 'Test',
        category: 'test',
        value: 100,
        rarity: 1,
        itemType: 'test',
        manufacturer: 'Test',
        description: 'Test',
        slotType: 'bridge',
      };

      expect(isEquippable(lootWithSlot)).toBe(true);
    });
  });

  describe('Slot system in unified inventory', () => {
    it('should have slot structure compatible with both Loot and Item', () => {
      const testLoot: Loot = {
        id: 'nav-console',
        name: 'Navigation Console',
        category: 'tech',
        value: 750,
        rarity: 2,
        itemType: 'equipment',
        manufacturer: 'NavSys',
        description: 'Advanced navigation system',
        slotType: 'bridge',
        tier: 2,
        powerDraw: 1,
      };

      // Find a bridge slot
      const bridgeRoom = playerShip.rooms.find(r => r.roomType === 'bridge');
      const slot = bridgeRoom?.slots?.[0];

      if (slot) {
        // Type check: ItemSlot.installedItem can accept Loot | Item | null
        expect(slot.installedItem).toBeNull(); // Initially empty
      }
    });
  });

  describe('Cargo slots for generic inventory', () => {
    it('should have cargo room for holding non-equippable items', () => {
      const cargoRoom = playerShip.rooms.find(r => r.roomType === 'cargo');
      expect(cargoRoom).toBeDefined();
      expect(cargoRoom?.slots).toBeDefined();
      expect(cargoRoom!.slots.length).toBeGreaterThan(0);
    });
  });
});
