import { describe, it, expect } from 'vitest';
import { generateWreck, generateAvailableWrecks } from '../../src/game/wreckGenerator';
import { hasWreckShip } from '../../src/types/utils';
import type { Ship } from '../../src/game/ship';

describe('Wreck Generation Integration', () => {
  it('generates a wreck with a valid ship layout and unsealed entry', () => {
    // Generate multiple wrecks to ensure consistency
    for (let i = 0; i < 10; i++) {
      const wreck = generateWreck(`seed-integration-${i}`);
      
      if (!hasWreckShip(wreck)) {
        throw new Error('Wreck missing ship');
      }
      const ship = wreck.ship;

      expect(ship).toBeDefined();
      expect(ship.layout).toBeDefined();
      expect(ship.layout!.rooms.length).toBeGreaterThan(0);

      // Check entry position
      const entryPos = ship.entryPosition;
      const entryCell = ship.grid[entryPos.y][entryPos.x];

      // Entry must be mapped to a room ID
      expect(entryCell.id).toBeDefined();
      
      // Entry must NOT be sealed (Critical Fix Verification)
      expect(entryCell.sealed).toBe(false);

      // Verify entry is part of the layout
      const inLayout = ship.layout!.rooms.some(r => r.x === entryPos.x && r.y === entryPos.y);
      expect(inLayout).toBe(true);
    }
  });

  it('ensures consistency between wreck.rooms and ship.grid', () => {
    const wreck = generateWreck('consistency-seed');
    
    if (!hasWreckShip(wreck)) {
      throw new Error('Wreck missing ship');
    }
    const ship = wreck.ship;

    // Check a random room from the layout
    const layoutRoom = ship.layout!.rooms[0];
    const cell = ship.grid[layoutRoom.y][layoutRoom.x];

    // Find corresponding room in wreck.rooms
    const wreckRoom = wreck.rooms.find(r => r.id === cell.id);
    
    expect(wreckRoom).toBeDefined();
    expect(wreckRoom?.name).toBe(cell.name);
    expect(wreckRoom?.sealed).toBe(cell.sealed);
  });

  it('has valid connections for all layout rooms in generateWreck', () => {
    const wreck = generateWreck('connections-test-seed');
    
    if (!hasWreckShip(wreck)) {
      throw new Error('Wreck missing ship');
    }
    const ship = wreck.ship;

    // All layout rooms should have at least one connection (except single-room wrecks)
    if (ship.layout!.rooms.length > 1) {
      for (const layoutRoom of ship.layout!.rooms) {
        const cell = ship.grid[layoutRoom.y][layoutRoom.x];
        expect(cell.connections.length).toBeGreaterThan(0);
      }
    }
  });

  it('has valid connections for all layout rooms in generateAvailableWrecks', () => {
    const wrecks = generateAvailableWrecks(['near'], 'available-connections-test');
    
    for (const wreck of wrecks) {
      if (!hasWreckShip(wreck)) {
        throw new Error('Wreck missing ship');
      }
      const ship = wreck.ship;

      // All layout rooms should have at least one connection
      if (ship.layout!.rooms.length > 1) {
        for (const layoutRoom of ship.layout!.rooms) {
          const cell = ship.grid[layoutRoom.y][layoutRoom.x];
          expect(cell.connections.length, `Room at (${layoutRoom.x},${layoutRoom.y}) should have connections`).toBeGreaterThan(0);
        }
      }
    }
  });
});
