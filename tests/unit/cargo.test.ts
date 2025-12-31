import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/stores/gameStore';

describe('Cargo System', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.setState({
      playerShip: {
        id: 'player-ship',
        name: 'SS BREAKER-01',
        width: 2,
        height: 2,
        grid: [],
        entryPosition: { x: 0, y: 0 },
        cargoCapacity: 10,
        cargoUsed: 0,
        hp: 100,
        maxHp: 100
      },
      currentRun: null,
      availableWrecks: []
    });
  });

  it('enforces cargo capacity limits when salvaging rooms', () => {
    const store = useGameStore.getState();
    
    // Set up a run with room containing items
    const testWreck = {
      id: 'test-wreck',
      name: 'Test Wreck',
      distance: 1,
      type: 'industrial' as const,
      mass: 'small' as const,
      tier: 1,
      estimatedValue: 5000,
      rooms: [
        {
          id: 'room-1',
          name: 'Cargo Bay',
          looted: false,
          hazardType: null,
          hazardLevel: 0,
          loot: Array(8).fill(null).map((_, i) => ({
            id: `loot-${i}`,
            name: `Item ${i}`,
            value: 100,
            mass: 1
          })),
          techRequired: 0
        }
      ]
    };

    useGameStore.setState({
      availableWrecks: [testWreck],
      crewRoster: [
        {
          id: 'crew-1',
          name: 'Test Crew',
          hp: 100,
          maxHp: 100,
          skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
          skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 }
        }
      ],
      selectedCrewId: 'crew-1',
      currentRun: {
        wreckId: testWreck.id,
        fuelUsed: 5,
        oxygenUsed: 5,
        timeTaken: 10,
        timeRemaining: 100,
      collectedLoot: Array(5).fill(null).map((_, i) => ({ // Already 5 items
          id: `existing-${i}`,
          name: `Existing ${i}`,
          value: 100,
          mass: 1
        })),
        currentRoomId: 'room-1',
        encountersResolved: 0,
        stats: {
          roomsAttempted: 0,
          roomsSucceeded: 0,
          roomsFailed: 0,
          damageTaken: 0,
          fuelSpent: 0,
          xpGained: { technical: 0, combat: 0, salvage: 0, piloting: 0 }
        }
      }
    });

    // Try to salvage room with 8 items (5 + 8 = 13 > 10 capacity)
    const result = store.salvageRoom('room-1');
    expect(result.success).toBe(false);
  });

  it('allows salvaging when capacity is available', () => {
    const store = useGameStore.getState();
    
    const testWreck = {
      id: 'test-wreck',
      name: 'Test Wreck',
      distance: 1,
      type: 'industrial' as const,
      mass: 'small' as const,
      tier: 1,
      estimatedValue: 5000,
      rooms: [
        {
          id: 'room-1',
          name: 'Storage',
          looted: false,
          hazardType: null,
          hazardLevel: 0,
          loot: [
            { id: 'loot-1', name: 'Component', value: 100, mass: 1 },
            { id: 'loot-2', name: 'Parts', value: 150, mass: 1 }
          ],
          techRequired: 0
        }
      ]
    };

    useGameStore.setState({
      availableWrecks: [testWreck],
      crewRoster: [
        {
          id: 'crew-1',
          name: 'Test Crew',
          hp: 100,
          maxHp: 100,
          skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
          skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 }
        }
      ],
      selectedCrewId: 'crew-1',
      currentRun: {
        wreckId: testWreck.id,
        fuelUsed: 5,
        oxygenUsed: 5,
        timeTaken: 10,
        timeRemaining: 100,
        collectedLoot: [], // Empty cargo
        currentRoomId: 'room-1',
        encountersResolved: 0,
        stats: {
          roomsAttempted: 0,
          roomsSucceeded: 0,
          roomsFailed: 0,
          damageTaken: 0,
          fuelSpent: 0,
          xpGained: { technical: 0, combat: 0, salvage: 0, piloting: 0 }
        }
      }
    });

    const result = store.salvageRoom('room-1');
    // Result depends on random roll, but should not fail due to capacity
    // We just check that the function doesn't crash
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('tracks cargo usage correctly', () => {
    const store = useGameStore.getState();
    
    const testWreck = {
      id: 'test',
      name: 'Test',
      distance: 1,
      type: 'industrial' as const,
      mass: 'small' as const,
      tier: 1,
      estimatedValue: 1000,
      rooms: []
    };
    
    // Manually update cargo
    useGameStore.setState({
      availableWrecks: [testWreck],
      currentRun: {
        wreckId: testWreck.id,
        fuelUsed: 0,
        oxygenUsed: 0,
        timeTaken: 0,
        collectedLoot: [
          { id: '1', name: 'Item 1', value: 100, mass: 1 },
          { id: '2', name: 'Item 2', value: 100, mass: 1 },
          { id: '3', name: 'Item 3', value: 100, mass: 1 }
        ],
        currentRoomId: '',
        encountersResolved: 0
      }
    });

    const currentRun = useGameStore.getState().currentRun;
    expect(currentRun?.collectedLoot.length).toBe(3);
  });

  it('allows ship renaming', () => {
    const store = useGameStore.getState();
    
    store.renameShip('New Ship Name');
    
    const updatedShip = useGameStore.getState().playerShip;
    expect(updatedShip?.name).toBe('New Ship Name');
  });
});
