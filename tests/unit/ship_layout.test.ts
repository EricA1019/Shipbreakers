import { describe, it, expect, beforeEach } from 'vitest';
import { Ship } from '../../src/game/ship';
import type { ShipLayout } from '../../src/game/wasm/WasmBridge';

describe('Ship Layout & Connectivity', () => {
  let ship: Ship;

  beforeEach(() => {
    ship = Ship.fromMass('test-ship', 'large', 'Test Ship');
  });

  it('regenerates doors for a specific layout', () => {
    // Create a simple L-shaped layout
    // (0,0) -> (1,0) -> (1,1)
    const layout: ShipLayout = {
      template: 'L-Shape',
      rooms: [
        { x: 0, y: 0, w: 1, h: 1, kind: 'bridge' },
        { x: 1, y: 0, w: 1, h: 1, kind: 'corridor' },
        { x: 1, y: 1, w: 1, h: 1, kind: 'engineering' }
      ]
    };

    ship.regenerateDoorsForLayout(layout);

    // Check connections
    // (0,0) should connect to (1,0) (East)
    const r00 = ship.grid[0][0];
    expect(r00.connections).toContain('east');

    // (1,0) should connect to (0,0) (West) and (1,1) (South)
    const r10 = ship.grid[0][1];
    expect(r10.connections).toContain('west');
    expect(r10.connections).toContain('south');

    // (1,1) should connect to (1,0) (North)
    const r11 = ship.grid[1][1];
    expect(r11.connections).toContain('north');

    // Unused cells should have no connections
    const r01 = ship.grid[1][0];
    expect(r01.connections).toEqual([]);
  });

  it('ensures all layout rooms are reachable (MST)', () => {
    // Create a U-shaped layout
    // (0,0) - (1,0) - (2,0)
    //  |             |
    // (0,1)         (2,1)
    const layout: ShipLayout = {
      template: 'U-Shape',
      rooms: [
        { x: 0, y: 0, w: 1, h: 1, kind: 'room' },
        { x: 1, y: 0, w: 1, h: 1, kind: 'room' },
        { x: 2, y: 0, w: 1, h: 1, kind: 'room' },
        { x: 0, y: 1, w: 1, h: 1, kind: 'room' },
        { x: 2, y: 1, w: 1, h: 1, kind: 'room' }
      ]
    };

    ship.regenerateDoorsForLayout(layout);

    // BFS to verify connectivity
    const visited = new Set<string>();
    const queue = [{ x: 0, y: 0 }];
    visited.add('0,0');

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const room = ship.grid[pos.y][pos.x];

      for (const dir of room.connections) {
        let nx = pos.x;
        let ny = pos.y;
        if (dir === 'north') ny--;
        if (dir === 'south') ny++;
        if (dir === 'east') nx++;
        if (dir === 'west') nx--;

        const key = `${nx},${ny}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }

    // All 5 rooms should be visited
    expect(visited.size).toBe(5);
    
    // Verify specific rooms are in the visited set
    expect(visited.has('0,0')).toBe(true);
    expect(visited.has('1,0')).toBe(true);
    expect(visited.has('2,0')).toBe(true);
    expect(visited.has('0,1')).toBe(true);
    expect(visited.has('2,1')).toBe(true);
  });

  it('sets a valid entry position within the layout', () => {
    const layout: ShipLayout = {
      template: 'Offset',
      rooms: [
        { x: 2, y: 2, w: 1, h: 1, kind: 'room' }, // Not at (0,0)
        { x: 2, y: 1, w: 1, h: 1, kind: 'room' }
      ]
    };

    ship.regenerateDoorsForLayout(layout);

    // Entry position should be one of the layout rooms
    const entry = ship.entryPosition;
    const isValid = layout.rooms.some(r => r.x === entry.x && r.y === entry.y);
    expect(isValid).toBe(true);
  });
});
