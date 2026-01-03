import { describe, it, expect } from 'vitest';
import { useGameStore } from '../../src/stores/gameStore';
import { createMockWreck, createMockRoom, createMockRunState } from '../fixtures';

describe('Salvage edge cases', () => {
  it('salvageRoom on already looted room should fail', () => {
    const wreck = createMockWreck({
      id: 'wr-looted',
      name: 'Looted',
      type: 'civilian',
      tier: 1,
      distance: 1,
      rooms: [createMockRoom({ id: 'lr1', name: 'Empty', hazardLevel: 0, hazardType: 'mechanical', loot: [], looted: true })],
      stripped: false,
    });

    const run = createMockRunState(wreck.id, { timeRemaining: 10 });
    useGameStore.setState({ availableWrecks: [wreck], currentRun: run });

    const result = useGameStore.getState().salvageRoom('lr1');
    expect(result.success).toBe(false);
  });

  it('salvageItem on non-existent item should fail gracefully', () => {
    const wreck = createMockWreck({
      id: 'wr',
      name: 'Wr',
      type: 'civilian',
      tier: 1,
      distance: 1,
      rooms: [createMockRoom({ id: 'r1', name: 'Room', hazardLevel: 0, hazardType: 'mechanical', loot: [], looted: false })],
      stripped: false,
    });

    const run = createMockRunState(wreck.id, { timeRemaining: 10 });
    useGameStore.setState({ availableWrecks: [wreck], currentRun: run });

    const res = useGameStore.getState().salvageItem('r1', 'nope');
    expect(res.success).toBe(false);
  });
});