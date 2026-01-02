import { describe, it, expect } from 'vitest';
import { useGameStore } from '../../src/stores/gameStore';

describe('Salvage edge cases', () => {
  it('salvageRoom on already looted room should fail', () => {
    const wreck = {
      id: 'wr-looted',
      name: 'Looted',
      distance: 1,
      type: 'civilian' as const,
      tier: 1,
      rooms: [ { id: 'lr1', name: 'Empty', hazardLevel: 0, hazardType: 'mechanical' as const, loot: [], looted: true, equipment: null } ],
      ship: undefined,
      stripped: false,
    } as any;

    useGameStore.setState({ availableWrecks: [wreck], currentRun: { wreckId: wreck.id, timeRemaining: 10, collectedLoot: [], collectedEquipment: [], stats: { roomsAttempted:0, roomsSucceeded:0, roomsFailed:0, damageTaken:0, fuelSpent:0, xpGained: { technical:0, combat:0, salvage:0, piloting:0 } } } as any });

    const result = useGameStore.getState().salvageRoom('lr1');
    expect(result.success).toBe(false);
  });

  it('salvageItem on non-existent item should fail gracefully', () => {
    const wreck = {
      id: 'wr',
      name: 'Wr',
      distance: 1,
      type: 'civilian' as const,
      tier: 1,
      rooms: [ { id: 'r1', name: 'Room', hazardLevel: 0, hazardType: 'mechanical' as const, loot: [], looted: false, equipment: null } ],
      ship: undefined,
      stripped: false,
    } as any;

    useGameStore.setState({ availableWrecks: [wreck], currentRun: { wreckId: wreck.id, timeRemaining: 10, collectedLoot: [], collectedEquipment: [], stats: { roomsAttempted:0, roomsSucceeded:0, roomsFailed:0, damageTaken:0, fuelSpent:0, xpGained: { technical:0, combat:0, salvage:0, piloting:0 } } } as any });

    const res = useGameStore.getState().salvageItem('r1', 'nope');
    expect(res.success).toBe(false);
  });
});