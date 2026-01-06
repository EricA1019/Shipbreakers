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
import type {
  GameState,
  GameEvent,
  EventFlags,
  EventResolutionSummary,
} from '../../types';
import {
  applyEventChoice,
  evaluateChoiceRequirements,
} from '../../game/systems/EventManager';

/**
 * Events slice state interface
 */
export interface EventsSliceState {
  // State
  activeEvent?: GameEvent | null;
  pendingEventSummary?: EventResolutionSummary | null;
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
  clearPendingEventSummary: () => void;
}

type EventSnapshot = {
  credits: number;
  fuel: number;
  food: number;
  drink: number;
  luxuryDrink: number;
  day?: number;
  eventFlags: EventFlags;
  crewById: Record<
    string,
    { name: string; hp: number; stamina: number; sanity: number; status?: string }
  >;
};

function takeEventSnapshot(state: GameState): EventSnapshot {
  const crewById: EventSnapshot['crewById'] = {};
  for (const c of state.crewRoster || []) {
    crewById[c.id] = {
      name: c.name,
      hp: c.hp,
      stamina: c.stamina,
      sanity: c.sanity,
      status: c.status,
    };
  }

  return {
    credits: state.credits ?? 0,
    fuel: state.fuel ?? 0,
    food: (state as any).food ?? 0,
    drink: (state as any).drink ?? 0,
    luxuryDrink: (state as any).luxuryDrink ?? 0,
    day: state.day,
    eventFlags: { ...(state.eventFlags || {}) },
    crewById,
  };
}

function buildEventSummary(
  before: EventSnapshot,
  after: GameState,
  event: GameEvent,
  choiceId: string,
  choiceText: string,
): EventResolutionSummary {
  const deltas: EventResolutionSummary['deltas'] = {};

  const creditsDelta = (after.credits ?? 0) - before.credits;
  const fuelDelta = (after.fuel ?? 0) - before.fuel;
  const foodDelta = ((after as any).food ?? 0) - before.food;
  const drinkDelta = ((after as any).drink ?? 0) - before.drink;
  const luxuryDelta = ((after as any).luxuryDrink ?? 0) - before.luxuryDrink;

  if (creditsDelta !== 0) deltas.credits = creditsDelta;
  if (fuelDelta !== 0) deltas.fuel = fuelDelta;
  if (foodDelta !== 0) deltas.food = foodDelta;
  if (drinkDelta !== 0) deltas.drink = drinkDelta;
  if (luxuryDelta !== 0) deltas.luxuryDrink = luxuryDelta;

  const afterFlags = (after.eventFlags || {}) as EventFlags;
  const flagsSet = Object.keys(afterFlags).filter(
    (k) => afterFlags[k] && !before.eventFlags[k],
  );

  const crew = (after.crewRoster || [])
    .map((c) => {
      const prev = before.crewById[c.id];
      const hpDelta = prev ? c.hp - prev.hp : undefined;
      const staminaDelta = prev ? c.stamina - prev.stamina : undefined;
      const sanityDelta = prev ? c.sanity - prev.sanity : undefined;
      const statusBefore = prev?.status;
      const statusAfter = c.status;

      const hasDelta =
        (typeof hpDelta === 'number' && hpDelta !== 0) ||
        (typeof staminaDelta === 'number' && staminaDelta !== 0) ||
        (typeof sanityDelta === 'number' && sanityDelta !== 0) ||
        (statusBefore && statusAfter && statusBefore !== statusAfter);

      if (!hasDelta) return null;

      return {
        crewId: c.id,
        name: c.name,
        hpDelta: hpDelta && hpDelta !== 0 ? hpDelta : undefined,
        staminaDelta: staminaDelta && staminaDelta !== 0 ? staminaDelta : undefined,
        sanityDelta: sanityDelta && sanityDelta !== 0 ? sanityDelta : undefined,
        statusBefore: statusBefore as any,
        statusAfter: statusAfter as any,
      };
    })
    .filter(Boolean) as any;

  return {
    eventId: event.id,
    eventTitle: event.title,
    choiceId,
    choiceText,
    day: before.day,
    deltas,
    crew,
    flagsSet,
  };
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
  pendingEventSummary: null,
  eventFlags: {},
  activeEventChain: null,

  // Actions
  resolveActiveEvent: (choiceId: string) => {
    const current = get().activeEvent;
    if (!current) return;
    const choice = current.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    set((state) => {
      const req = evaluateChoiceRequirements(state as any, choice.requirements);
      if (!req.allowed) return state as any;

      const before = takeEventSnapshot(state as any);
      const after = applyEventChoice(state as any, current, choice) as any;
      const summary = buildEventSummary(
        before,
        after as any,
        current,
        choice.id,
        choice.text,
      );

      return {
        ...(after as any),
        activeEvent: null,
        pendingEventSummary: summary,
      };
    });
  },

  dismissActiveEvent: () => {
    set({ activeEvent: null });
  },

  clearPendingEventSummary: () => {
    set({ pendingEventSummary: null });
  },
});
