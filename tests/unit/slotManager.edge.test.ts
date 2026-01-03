import { describe, it, expect } from 'vitest';
import { initializePlayerShip } from '../../src/game/data/playerShip';
import { canInstall, calculatePowerUsed, installItem, uninstallItem, getShipPowerCapacity } from '../../src/game/systems/slotManager';
import { createMockEquipment } from '../fixtures';
import type { Item, PlayerShipRoom } from '../../src/types';

describe('slotManager edge cases', () => {
  it('allows install when item power equals remaining capacity (exact boundary)', () => {
    const ship = initializePlayerShip('edge-ship');
    // force reactor to low power
    ship.reactor = { id: 'small-reactor', name: 'Tiny', tier: 1, powerOutput: 1, value: 10, rarity: 'common', description: 'Small reactor', slotType: 'reactor', powerDraw: 0, effects: [] };

    const engineRoom = ship.rooms.find((r) => 'roomType' in r && r.roomType === 'engine') as PlayerShipRoom | undefined;
    const slot = engineRoom?.slots[0];
    if (!slot) throw new Error('No slot found');

    const item = createMockEquipment({
      id: 'p1',
      name: '1KW Module',
      description: 'Edge power draw',
      slotType: 'engineering',
      tier: 1,
      rarity: 'common',
      powerDraw: 1,
      value: 10,
    });

    const cap = getShipPowerCapacity(ship);
    expect(cap).toBe(1);

    const res = canInstall(ship, slot, item);
    expect(res.success).toBe(true);
  });

  it('rejects install when item pushes power above capacity', () => {
    const ship = initializePlayerShip('edge-ship-2');
    ship.reactor = { id: 'small-reactor', name: 'Tiny', tier: 1, powerOutput: 1, value: 10, rarity: 'common', description: 'Small reactor', slotType: 'reactor', powerDraw: 0, effects: [] };

    const engineRoom = ship.rooms.find((r) => 'roomType' in r && r.roomType === 'engine') as PlayerShipRoom | undefined;
    const slot = engineRoom?.slots[0];
    if (!slot) throw new Error('No slot found');

    const item = createMockEquipment({
      id: 'p2',
      name: '2KW Module',
      description: 'Too high power draw',
      slotType: 'engineering',
      tier: 1,
      rarity: 'common',
      powerDraw: 2,
      value: 10,
    });

    const res = canInstall(ship, slot, item);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Insufficient power/);
  });

  it('calculatePowerUsed does not mutate ship object', () => {
    const ship = initializePlayerShip('mut-ship');
    const before = JSON.stringify(ship);
    const used = calculatePowerUsed(ship);
    const after = JSON.stringify(ship);
    expect(typeof used).toBe('number');
    expect(after).toBe(before); // no mutation
  });

  it('installItem mutates slot and updates ship.powerUsed', () => {
    const ship = initializePlayerShip('mut-ship-2');
    const engineRoom = ship.rooms.find((r) => 'roomType' in r && r.roomType === 'engine') as PlayerShipRoom | undefined;
    const slot = engineRoom?.slots[0];
    if (!slot) throw new Error('No slot found');

    const item = createMockEquipment({
      id: 'm1',
      name: 'Test Module',
      description: 'Test',
      slotType: 'engineering',
      tier: 1,
      rarity: 'common',
      powerDraw: 1,
      value: 10,
    });

    const beforePower = ship.powerUsed ?? 0;
    const res = installItem(ship, slot, item);
    expect(res.success).toBe(true);
    expect(slot.installedItem).toBe(item);
    expect(ship.powerUsed).toBeGreaterThanOrEqual(beforePower + item.powerDraw);

    // uninstall
    const removed = uninstallItem(ship, slot);
    expect(removed).toBe(item);
    expect(slot.installedItem).toBeNull();
  });
});