import { describe, it, expect, beforeEach } from 'vitest';
import { Ship } from '../../src/game/ship';
import type { WreckMass } from '../../src/types';

describe('Ship', () => {
  describe('grid generation', () => {
    it('creates ship with correct dimensions for each mass', () => {
      const masses: WreckMass[] = ['small', 'medium', 'large', 'massive'];
      const expectedDimensions = {
        small: { width: 2, height: 2 },
        medium: { width: 3, height: 2 },
        large: { width: 3, height: 3 },
        massive: { width: 4, height: 3 }
      };

      masses.forEach(mass => {
        const ship = Ship.fromMass(`test-${mass}`, mass, 'Test Ship');
        expect(ship.width).toBe(expectedDimensions[mass].width);
        expect(ship.height).toBe(expectedDimensions[mass].height);
        expect(ship.grid.length).toBe(expectedDimensions[mass].height);
        expect(ship.grid[0].length).toBe(expectedDimensions[mass].width);
      });
    });

    it('generates deterministic layouts with same seed', () => {
      const ship1 = Ship.fromMass('seed-123', 'medium', 'Ship A');
      const ship2 = Ship.fromMass('seed-123', 'medium', 'Ship B');

      // Same entry position
      expect(ship1.entryPosition.x).toBe(ship2.entryPosition.x);
      expect(ship1.entryPosition.y).toBe(ship2.entryPosition.y);

      // Same door connections
      for (let y = 0; y < ship1.height; y++) {
        for (let x = 0; x < ship1.width; x++) {
          expect(ship1.grid[y][x].connections.sort()).toEqual(ship2.grid[y][x].connections.sort());
        }
      }
    });

    it('ensures all rooms are reachable via MST', () => {
      const ship = Ship.fromMass('connectivity-test', 'large', 'Test Ship');
      const visited = new Set<string>();
      const queue: { x: number; y: number }[] = [ship.entryPosition];

      // BFS from entry position
      while (queue.length > 0) {
        const pos = queue.shift()!;
        const key = `${pos.x},${pos.y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const room = ship.grid[pos.y][pos.x];
        room.connections.forEach(dir => {
          const next = { x: pos.x, y: pos.y };
          if (dir === 'north') next.y--;
          else if (dir === 'south') next.y++;
          else if (dir === 'east') next.x++;
          else if (dir === 'west') next.x--;

          if (next.x >= 0 && next.x < ship.width && next.y >= 0 && next.y < ship.height) {
            queue.push(next);
          }
        });
      }

      // All rooms should be reachable
      expect(visited.size).toBe(ship.width * ship.height);
    });
  });

  describe('movement validation', () => {
    let ship: Ship;

    beforeEach(() => {
      ship = Ship.fromMass('movement-test', 'small', 'Test Ship');
    });

    it('validates movement through connected doors', () => {
      const from = { x: 0, y: 0 };
      
      // Find a connected room
      const room = ship.grid[0][0];
      if (room.connections.includes('east')) {
        const to = { x: 1, y: 0 };
        expect(ship.canMoveTo(from, to)).toBe(true);
      }
      if (room.connections.includes('south')) {
        const to = { x: 0, y: 1 };
        expect(ship.canMoveTo(from, to)).toBe(true);
      }
    });

    it('rejects movement to non-adjacent rooms', () => {
      const from = { x: 0, y: 0 };
      const to = { x: 1, y: 1 }; // Diagonal, not adjacent
      expect(ship.canMoveTo(from, to)).toBe(false);
    });

    it('rejects movement without door connection', () => {
      // Create ship and check for room without specific connection
      const from = { x: 0, y: 0 };
      const room = ship.grid[0][0];

      if (!room.connections.includes('east')) {
        const to = { x: 1, y: 0 };
        expect(ship.canMoveTo(from, to)).toBe(false);
      }
    });

    it('rejects movement out of bounds', () => {
      const from = { x: 0, y: 0 };
      const to = { x: -1, y: 0 };
      expect(ship.canMoveTo(from, to)).toBe(false);
    });
  });

  describe('helper methods', () => {
    it('gets room at position', () => {
      const ship = Ship.fromMass('helper-test', 'small', 'Test Ship');
      
      const room = ship.getRoom(0, 0);
      expect(room).toBeDefined();
      expect(room?.position).toEqual({ x: 0, y: 0 });
      
      const outOfBounds = ship.getRoom(-1, 0);
      expect(outOfBounds).toBeNull();
    });

    it('gets connected rooms', () => {
      const ship = Ship.fromMass('connected-test', 'small', 'Test Ship');
      
      const connected = ship.getConnectedRooms({ x: 0, y: 0 });
      expect(connected.length).toBeGreaterThan(0); // Should have at least one connection (MST guarantee)
      
      connected.forEach(c => {
        expect(c.room).toBeDefined();
        expect(c.dir).toMatch(/north|south|east|west/);
      });
    });
  });
});
