/**
 * Crew State Helpers
 * 
 * Centralized utilities for crew roster operations to reduce duplication
 * in gameStore.ts (used 20+ times).
 */
import type { CrewMember, GameState } from '../types';
import { clamp } from './mathUtils';

/**
 * Update a crew member by ID in the roster
 * Immutably returns a new roster array with the updates applied
 */
export function updateCrewById(
  roster: CrewMember[],
  crewId: string,
  updates: Partial<CrewMember>
): CrewMember[] {
  return roster.map((c) => (c.id === crewId ? { ...c, ...updates } : c));
}

/**
 * Find the currently active crew member
 * Returns the selected crew, or the first crew member, or undefined
 */
export function findActiveCrew(
  roster: CrewMember[],
  selectedCrewId: string | null
): CrewMember | undefined {
  if (selectedCrewId) {
    const selected = roster.find((c) => c.id === selectedCrewId);
    if (selected) return selected;
  }
  return roster[0];
}

/**
 * Clamp crew stats to their min/max bounds
 * Useful after applying stat modifications
 */
export function clampCrewStats(crew: CrewMember): CrewMember {
  return {
    ...crew,
    hp: clamp(crew.hp, 0, crew.maxHp),
    stamina: clamp(crew.stamina, 0, crew.maxStamina),
    sanity: clamp(crew.sanity, 0, crew.maxSanity),
  };
}

/**
 * Update the selected crew in a game state slice
 * Ensures both crewRoster and crew (reference) are updated consistently
 */
export function updateSelectedCrew(
  state: Pick<GameState, 'crewRoster' | 'selectedCrewId' | 'crew'>,
  crewId: string,
  updates: Partial<CrewMember>
): Pick<GameState, 'crewRoster' | 'crew'> {
  const updatedRoster = updateCrewById(state.crewRoster, crewId, updates);
  const updatedCrew = updatedRoster.find((c) => c.id === crewId) ?? state.crew;
  
  return {
    crewRoster: updatedRoster,
    crew: updatedCrew,
  };
}

/**
 * Find a crew member by ID
 */
export function findCrewById(
  roster: CrewMember[],
  crewId: string
): CrewMember | undefined {
  return roster.find((c) => c.id === crewId);
}
