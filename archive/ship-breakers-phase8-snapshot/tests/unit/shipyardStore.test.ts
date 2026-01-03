import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/stores/gameStore';
import { initializePlayerShip } from '../../src/game/data/playerShip';
import type { Item } from '../../src/types';
import { getShipyardFee } from '../../src/game/systems/slotManager';

describe('Shipyard store actions', () => {
  beforeEach(() => {
    // reset store
    useGameStore.setState({
      playerShip: initializePlayerShip('shipyard-test'),
      credits: 10000,
      equipmentInventory: [],
    });
  });

  it('installs an item from equipment inventory and charges fee', () => {
    const state = useGameStore.getState();
    const ship = state.playerShip!;

    // Find an engineering slot
    const engineRoom = ship.grid.flat().find((r: any) => r.roomType === 'engine') as any;
    const slot = engineRoom.slots[0];

    const item: Item = {
      id: 'test-item-1',
      name: 'Test Engineering Module',
      description: 'Test',
      slotType: 'engineering',
      tier: 1,
      rarity: 'common',
      powerDraw: 0,
      effects: [],
      value: 100,
    };

    useGameStore.setState({ equipmentInventory: [item], credits: 10000 });
    const beforeCredits = useGameStore.getState().credits;

    const roomId = engineRoom.id;
    const slotId = slot.id;

    const ok = useGameStore.getState().installItemOnShip(roomId, slotId, item.id);
    expect(ok).toBe(true);

    const s2 = useGameStore.getState();
    // slot should be installed
    const updatedRoom = s2.playerShip!.grid.flat().find((r: any) => r.id === roomId);
    const updatedSlot = updatedRoom.slots.find((s: any) => s.id === slotId);
    expect(updatedSlot.installedItem).not.toBeNull();
    expect(s2.equipmentInventory.find((it: any) => it.id === item.id)).toBeUndefined();

    const fee = getShipyardFee(s2.licenseTier, 'install');
    expect(s2.credits).toBe(beforeCredits - fee);
  });

  it('uninstalls an item and refunds to equipment inventory (minus fee)', () => {
    const state = useGameStore.getState();
    const ship = state.playerShip!;

    const engineRoom = ship.grid.flat().find((r: any) => r.roomType === 'engine') as any;
    const slot = engineRoom.slots[0];

    // Pre-install an item directly
    const item: Item = {
      id: 'test-item-2',
      name: 'Removable Module',
      description: 'Test',
      slotType: 'engineering',
      tier: 1,
      rarity: 'common',
      powerDraw: 0,
      effects: [],
      value: 200,
    };

    // Directly install
    slot.installedItem = item as any;
    useGameStore.setState({ playerShip: ship, credits: 10000, equipmentInventory: [] });

    const beforeCredits = useGameStore.getState().credits;
    const ok = useGameStore.getState().uninstallItemFromShip(engineRoom.id, slot.id);
    expect(ok).toBe(true);

    const s2 = useGameStore.getState();
    expect(s2.equipmentInventory.find((it: any) => it.id === item.id)).toBeDefined();
    const fee = getShipyardFee(s2.licenseTier, 'uninstall');
    expect(s2.credits).toBe(beforeCredits - fee);
  });
});