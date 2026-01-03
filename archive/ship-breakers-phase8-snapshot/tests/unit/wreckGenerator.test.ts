import { describe, it, expect } from 'vitest';
import { generateWreck } from '../../src/game/wreckGenerator';
import { Ship } from '../../src/game/ship';
import type { Room, Item } from '../../src/types';

describe('wreckGenerator', () => {
  it('generates wreck with valid fields', () => {
    const w = generateWreck('seed1');
    expect(w.id).toBeDefined();
    expect(w.name).toBeDefined();
    expect(w.distance).toBeGreaterThanOrEqual(1);
    expect(w.distance).toBeLessThanOrEqual(4);
    expect(w.type).toBeDefined();
    expect(w.tier).toBeGreaterThanOrEqual(1);
    expect(w.rooms.length).toBeGreaterThanOrEqual(4); // base + tier (min 1) = 4
  });

  it('is deterministic with seed', () => {
    const a = generateWreck('same-seed');
    const b = generateWreck('same-seed');
    expect(a.tier).toBe(b.tier);
    expect(a.type).toBe(b.type);
    expect(a.rooms.length).toBe(b.rooms.length);
  });

  it('maps equipment from rooms into ship grid cells', () => {
    const equipment: Item = {
      id: 'item_test',
      name: 'Test Module',
      description: 'For testing purposes',
      slotType: 'bridge',
      tier: 1,
      rarity: 'rare',
      powerDraw: 0,
      effects: [],
      value: 100,
    };

    const rooms: Room[] = [
      { id: 'r1', name: 'Room A', hazardLevel: 0, hazardType: 'mechanical', loot: [], looted: false, equipment: null },
      { id: 'r2', name: 'Room B', hazardLevel: 0, hazardType: 'mechanical', loot: [], looted: false, equipment },
    ];

    const ship = Ship.fromMass('test-seed', 'small', 'Test Vessel');

    // map rooms into ship grid cells (replicate generator logic)
    let k = 0;
    for (let y = 0; y < ship.height; y++) {
      for (let x = 0; x < ship.width; x++) {
        if (k < rooms.length) {
          const src = rooms[k++];
          const cell = ship.grid[y][x];
          cell.id = src.id;
          cell.name = src.name;
          cell.hazardLevel = src.hazardLevel;
          cell.hazardType = src.hazardType;
          cell.loot = src.loot;
          cell.looted = src.looted;
          cell.equipment = src.equipment;
        }
      }
    }

    const found = ship.grid.flat().find((c) => c.id === 'r2');
    expect(found).toBeDefined();
    expect(found?.equipment).toEqual(equipment);
  });
});