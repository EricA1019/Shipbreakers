import type { GameEvent, EventTrigger, EventChoice, GameState, EventFlags, TraitId } from "../../types";
import { EVENTS } from "../data/events";

/** Check if a flag is set in the game state */
export function hasFlag(state: GameState, flag: string): boolean {
  return state.eventFlags?.[flag] === true;
}

/** Set a flag in the game state (returns new eventFlags object) */
export function setFlag(flags: EventFlags | undefined, flag: string): EventFlags {
  return { ...(flags || {}), [flag]: true };
}

/** Clear a flag in the game state (returns new eventFlags object) */
export function clearFlag(flags: EventFlags | undefined, flag: string): EventFlags {
  const next = { ...(flags || {}) };
  delete next[flag];
  return next;
}

/** Check if any crew member has a specific trait */
function crewHasTrait(state: GameState, traitId: TraitId): boolean {
  return (state.crewRoster || []).some((c) => c.traits?.includes(traitId));
}

/** Check if any crew member has a specific background */
function crewHasBackground(state: GameState, backgroundId: string): boolean {
  return (state.crewRoster || []).some((c) => c.background === backgroundId);
}

function meetsRequirements(state: GameState, event: GameEvent): boolean {
  const req = event.requirements;
  
  // Check flag requirements
  if (event.requiresFlag && !hasFlag(state, event.requiresFlag)) return false;
  if (event.excludesFlag && hasFlag(state, event.excludesFlag)) return false;
  
  // Check trait requirements
  if (event.requiresTrait && !crewHasTrait(state, event.requiresTrait)) return false;
  
  // Check background requirements
  if (event.requiresBackground && !crewHasBackground(state, event.requiresBackground)) return false;
  
  // Check resource requirements
  if (!req) return true;
  if (typeof req.credits === "number" && state.credits < req.credits) return false;
  return true;
}

export function pickEventByTrigger(
  trigger: EventTrigger,
  state: GameState,
  randomFn: () => number = Math.random,
): GameEvent | null {
  const candidates = EVENTS.filter((e) => e.trigger === trigger).filter((e) => meetsRequirements(state, e));
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((s, e) => s + (e.weight || 1), 0);
  let roll = randomFn() * totalWeight;
  for (const e of candidates) {
    roll -= e.weight || 1;
    if (roll <= 0) return e;
  }
  return candidates[candidates.length - 1] ?? null;
}

export function applyEventChoice(
  state: GameState,
  _event: GameEvent,
  choice: EventChoice,
): GameState {
  // Start from a shallow copy; replace arrays you mutate
  let next: any = { ...state };
  let crewRoster = [...(state.crewRoster || [])];
  let eventFlags = { ...(state.eventFlags || {}) };

  // Set flag from choice if specified
  if (choice.setsFlag) {
    eventFlags[choice.setsFlag] = true;
  }

  for (const eff of choice.effects) {
    // Set flag from effect if specified
    if (eff.setsFlag) {
      eventFlags[eff.setsFlag] = true;
    }

    if (eff.type === "credits" && typeof eff.value === "number") {
      next.credits = Math.max(0, (next.credits ?? 0) + eff.value);
    }
    if (eff.type === "fuel" && typeof eff.value === "number") {
      next.fuel = Math.max(0, (next.fuel ?? 0) + eff.value);
    }
    if (eff.type === "food" && typeof eff.value === "number") {
      next.food = Math.max(0, (next.food ?? 0) + eff.value);
    }
    if (eff.type === "drink" && typeof eff.value === "number") {
      next.drink = Math.max(0, (next.drink ?? 0) + eff.value);
    }
    if (eff.type === "stamina" && typeof eff.value === "number") {
      const targetId = String(eff.target ?? "");
      crewRoster = crewRoster.map((c: any) =>
        c.id === targetId
          ? { ...c, stamina: Math.max(0, Math.min(c.maxStamina, (c.stamina ?? 0) + eff.value)) }
          : c,
      );
    }
    if (eff.type === "sanity" && typeof eff.value === "number") {
      const targetId = String(eff.target ?? "");
      crewRoster = crewRoster.map((c: any) =>
        c.id === targetId
          ? { ...c, sanity: Math.max(0, Math.min(c.maxSanity, (c.sanity ?? 0) + eff.value)) }
          : c,
      );
    }
    if (eff.type === "hp" && typeof eff.value === "number") {
      const targetId = String(eff.target ?? "");
      crewRoster = crewRoster.map((c: any) =>
        c.id === targetId
          ? { ...c, hp: Math.max(0, Math.min(c.maxHp, (c.hp ?? 0) + eff.value)) }
          : c,
      );
    }
  }

  next.crewRoster = crewRoster;
  next.eventFlags = eventFlags;
  next.crew = crewRoster.find((c: any) => c.id === next.selectedCrewId) ?? next.crew;
  return next as GameState;
}