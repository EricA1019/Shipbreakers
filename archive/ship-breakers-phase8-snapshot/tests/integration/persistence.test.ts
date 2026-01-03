import { describe, it, expect } from 'vitest';
import { Ship } from '../../src/game/ship';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mock store to simulate gameStore persistence behavior
interface MockState {
  ship: Ship | null;
  setShip: (s: Ship) => void;
}

const useMockStore = create<MockState>()(
  persist(
    (set) => ({
      ship: null,
      setShip: (ship) => set({ ship }),
    }),
    {
      name: 'mock-storage-test',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

describe('Persistence Integration', () => {
  it('should lose class methods after serialization/deserialization', () => {
    // 1. Create a real Ship instance
    const originalShip = Ship.fromMass('test-seed', 'small');
    expect(typeof originalShip.canMoveTo).toBe('function'); // Method exists

    // 2. Save to store (simulating persistence)
    // We manually simulate the JSON cycle because the mock store might not trigger it synchronously in test env
    const serialized = JSON.parse(JSON.stringify(originalShip));

    // 3. Verify methods are gone
    expect(serialized.canMoveTo).toBeUndefined();
    expect(serialized.getConnectedRooms).toBeUndefined();
    
    // 4. Verify data is still there
    expect(serialized.width).toBe(originalShip.width);
    expect(serialized.grid).toBeDefined();
  });

  it('should require functional helpers instead of class methods', () => {
    const shipData = JSON.parse(JSON.stringify(Ship.fromMass('test-seed', 'small')));

    // Define the helper (same as we added to SalvageScreen)
    function canMoveOnGrid(ship: any, from: any, to: any) {
      const room = ship?.grid?.[from?.y]?.[from?.x];
      if (!room) return false;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      let dir: 'north' | 'south' | 'east' | 'west' | null = null;
      if (dx === 1 && dy === 0) dir = 'east';
      if (dx === -1 && dy === 0) dir = 'west';
      if (dx === 0 && dy === 1) dir = 'south';
      if (dx === 0 && dy === -1) dir = 'north';
      if (!dir) return false;
      return room.connections?.includes(dir);
    }

    // Test that helper works on data-only object
    const start = shipData.entryPosition;
    // Find a valid neighbor to test
    const startRoom = shipData.grid[start.y][start.x];
    if (startRoom.connections.length > 0) {
      const dir = startRoom.connections[0];
      let tx = start.x, ty = start.y;
      if (dir === 'north') ty--;
      if (dir === 'south') ty++;
      if (dir === 'east') tx++;
      if (dir === 'west') tx--;
      
      const canMove = canMoveOnGrid(shipData, start, { x: tx, y: ty });
      expect(canMove).toBe(true);
    }
  });
});
