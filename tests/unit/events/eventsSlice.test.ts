import { describe, expect, it } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { createEventsSlice } from '../../../src/stores/slices/eventsSlice';
import { createMockCrew } from '../../fixtures';

describe('eventsSlice', () => {
  it('resolveActiveEvent sets pendingEventSummary with deltas', () => {
    const captain = createMockCrew({ id: 'c1', name: 'Captain', isPlayer: true });

    const store = createStore<any>()((set, get, api) => ({
      credits: 100,
      fuel: 10,
      food: 0,
      drink: 0,
      luxuryDrink: 0,
      day: 5,
      crewRoster: [captain],
      crew: captain,
      selectedCrewId: 'c1',
      inventory: [],
      ...createEventsSlice(set as any, get as any, api as any),
    }));

    store.setState({
      activeEvent: {
        id: 'e1',
        trigger: 'hub',
        title: 'Test Event',
        description: 'desc',
        weight: 1,
        choices: [
          { id: 'take', text: 'Take it', effects: [{ type: 'credits', value: 50 }] },
        ],
      },
    });

    store.getState().resolveActiveEvent('take');

    const summary = store.getState().pendingEventSummary;
    expect(summary).toBeTruthy();
    expect(summary.eventId).toBe('e1');
    expect(summary.choiceId).toBe('take');
    expect(summary.deltas.credits).toBe(50);
    expect(store.getState().activeEvent).toBe(null);
  });
});
