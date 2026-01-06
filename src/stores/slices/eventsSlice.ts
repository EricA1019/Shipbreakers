/**
 * Events Slice - Manages game events and event chain state
 * 
 * Responsibilities:
 * - Active event state
 * - Event choice resolution
 * - Event chain management
 * - Event flags for persistent world state
 * 
 * Extracted from gameStore.ts to improve maintainability.
 */
import type { StateCreator } from 'zustand';
import type { GameState, GameEvent, EventFlags } from '../../types';
import { applyEventChoice } from '../../game/systems/EventManager';

/**
 * Events slice state interface
 */
export interface EventsSliceState {
  // State
  activeEvent?: GameEvent | null;
  eventFlags?: EventFlags;
  activeEventChain?: {
    chainId: string;
    step: number;
    data?: Record<string, unknown>;
  } | null;
}

/**
 * Events slice actions interface
 */
export interface EventsSliceActions {
  // Event management
  resolveActiveEvent: (choiceId: string) => void;
  dismissActiveEvent: () => void;
}

/**
 * Create the events slice
 */
export const createEventsSlice: StateCreator<
  GameState,
  [],
  [],
  EventsSliceState & EventsSliceActions
> = (set, get) => ({
  // Initial state
  activeEvent: null,
  eventFlags: {},
  activeEventChain: null,

  // Actions
  resolveActiveEvent: (choiceId: string) => {
    const current = get().activeEvent;
    if (!current) return;
    const choice = current.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    set((state) => applyEventChoice(state as any, current, choice) as any);
    set({ activeEvent: null });
  },

  dismissActiveEvent: () => {
    set({ activeEvent: null });
  },
});
