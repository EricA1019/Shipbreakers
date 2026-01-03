import { describe, it, expect, beforeEach } from 'vitest';
import type { Loot, PlayerShip } from '../../src/types';
import { isEquippable } from '../../src/types';
import { initializePlayerShip } from '../../src/game/data/playerShip';
import { canInstall, installItem, uninstallItem } from '../../src/game/systems/slotManager';

/**
 * Integration test for the unified loot-equipment system
 * Tests that salvaged items (as Loot) can be installed on the player ship
 */
describe('Unified Loot-Equipment Integration', () => {
  let playerShip: PlayerShip;

  beforeEach(() => {
    playerShip = initializePlayerShip('integration-test-seed');
  });

  describe('Salvage to Installation Pipeline', () => {
    it('should accept equippable loot items for installation', () => {
      // Simulate a salvaged Life Support Module
      const salvageLoot: Loot = {
        id: 'loot-life-support-001',
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

      // Verify it's equippable
      expect(isEquippable(salvageLoot)).toBe(true);

      // Find an engineering slot
      const engineRoom = playerShip.rooms.find(r => r.roomType === 'engine');
      const engineSlot = engineRoom?.slots?.[0];

      if (!engineSlot) {
        throw new Error('No engine slot found');
      }

      // Check if we can install it
      const canInstallResult = canInstall(playerShip, engineSlot, salvageLoot);
      expect(canInstallResult.success).toBe(true);

      // Install it
      const installResult = installItem(playerShip, engineSlot, salvageLoot);
      expect(installResult.success).toBe(true);

      // Verify it's installed
      expect(engineSlot.installedItem?.id).toBe('loot-life-support-001');
      expect(engineSlot.installedItem?.name).toBe('Life Support Module');
    });

    it('should reject non-equippable (sell-only) items from installation', () => {
      // Simulate a salvaged Data Core (sell-only)
      const sellOnlyLoot: Loot = {
        id: 'loot-data-core-001',
        name: 'Data Core',
        category: 'data',
        value: 200,
        rarity: 2,
        itemType: 'salvage',
        manufacturer: 'Unknown',
        description: 'Encrypted data core',
        // No slotType - not equippable
      };

      expect(isEquippable(sellOnlyLoot)).toBe(false);

      const engineRoom = playerShip.rooms.find(r => r.roomType === 'engine');
      const engineSlot = engineRoom?.slots?.[0];

      if (!engineSlot) {
        throw new Error('No engine slot found');
      }

      // Should not be installable
      const canInstallResult = canInstall(playerShip, engineSlot, sellOnlyLoot);
      expect(canInstallResult.success).toBe(false);
    });

    it('should reject installation of equippable item in wrong slot type', () => {
      // Navigation Console requires bridge slot
      const navigationLoot: Loot = {
        id: 'loot-nav-001',
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

      // Try to install in engineering slot (wrong type)
      const engineRoom = playerShip.rooms.find(r => r.roomType === 'engine');
      const engineSlot = engineRoom?.slots?.[0];

      if (!engineSlot) {
        throw new Error('No engine slot found');
      }

      // Should fail because slot type is engineering, not bridge
      const canInstallResult = canInstall(playerShip, engineSlot, navigationLoot);
      expect(canInstallResult.success).toBe(false);
    });

    it('should allow installation in correct slot type', () => {
      // Navigation Console requires bridge slot
      const navigationLoot: Loot = {
        id: 'loot-nav-001',
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

      // Find bridge slot
      const bridgeRoom = playerShip.rooms.find(r => r.roomType === 'bridge');
      const bridgeSlot = bridgeRoom?.slots?.[0];

      if (!bridgeSlot) {
        throw new Error('No bridge slot found');
      }

      // Should succeed
      const canInstallResult = canInstall(playerShip, bridgeSlot, navigationLoot);
      expect(canInstallResult.success).toBe(true);

      const installResult = installItem(playerShip, bridgeSlot, navigationLoot);
      expect(installResult.success).toBe(true);

      // Verify installation
      expect(bridgeSlot.installedItem?.id).toBe('loot-nav-001');
    });

    it('should allow uninstalling items back to inventory as Loot', () => {
      // First install an item
      const fusionCore: Loot = {
        id: 'loot-fusion-core-001',
        name: 'Fusion Core',
        category: 'tech',
        value: 2000,
        rarity: 4,
        itemType: 'equipment',
        manufacturer: 'ExoTech',
        description: 'Advanced fusion reactor core',
        slotType: 'engineering',
        tier: 4,
        powerDraw: 0,
      };

      const engineRoom = playerShip.rooms.find(r => r.roomType === 'engine');
      const engineSlot = engineRoom?.slots?.[0];

      if (!engineSlot) {
        throw new Error('No engine slot found');
      }

      // Install
      installItem(playerShip, engineSlot, fusionCore);
      expect(engineSlot.installedItem?.id).toBe('loot-fusion-core-001');

      // Uninstall
      const uninstalledItem = uninstallItem(playerShip, engineSlot);
      expect(uninstalledItem).not.toBeNull();
      expect(uninstalledItem?.id).toBe('loot-fusion-core-001');
      expect(engineSlot.installedItem).toBeNull();

      // Verify it's a Loot item (can be either installed or sold)
      expect(isEquippable(uninstalledItem as Loot)).toBe(true);
    });

    it('should handle multiple item installations across rooms', () => {
      const items: Loot[] = [
        {
          id: 'loot-nav',
          name: 'Navigation Console',
          category: 'tech',
          value: 750,
          rarity: 2,
          itemType: 'equipment',
          manufacturer: 'NavSys',
          description: 'Nav system',
          slotType: 'bridge',
          tier: 2,
          powerDraw: 1,
        },
        {
          id: 'loot-life-support',
          name: 'Life Support Module',
          category: 'tech',
          value: 500,
          rarity: 2,
          itemType: 'equipment',
          manufacturer: 'Hegemony',
          description: 'Life support',
          slotType: 'engineering',
          tier: 2,
          powerDraw: 1,
        },
        {
          id: 'loot-medical',
          name: 'Medical Supplies',
          category: 'supplies',
          value: 300,
          rarity: 1,
          itemType: 'equipment',
          manufacturer: 'MedCorp',
          description: 'Medical supplies',
          slotType: 'medical',
          tier: 1,
          powerDraw: 0,
        },
      ];

      const roomTypes: Array<['bridge' | 'engine' | 'medbay', number]> = [
        ['bridge', 0],
        ['engine', 0],
        ['medbay', 0],
      ];

      // Install in different rooms
      roomTypes.forEach(([roomType, index], i) => {
        const room = playerShip.rooms.find(r => r.roomType === roomType);
        const slot = room?.slots?.[index];
        if (!slot) throw new Error(`No ${roomType} slot found`);

        const canInstallResult = canInstall(playerShip, slot, items[i]);
        expect(canInstallResult.success).toBe(true);

        const installResult = installItem(playerShip, slot, items[i]);
        expect(installResult.success).toBe(true);
      });

      // Verify all installed
      const allInstalledItems = playerShip.rooms
        .flatMap(r => r.slots)
        .map(s => s.installedItem)
        .filter(item => item !== null);

      expect(allInstalledItems).toHaveLength(3);
    });
  });
});
