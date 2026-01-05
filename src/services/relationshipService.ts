/**
 * Relationship Service - Phase 14
 * Manages crew relationships on a 0-10 scale
 */

import type {
  CrewRelationship,
  RelationshipLevel,
  RelationshipChange,
} from "../types";
import {
  RELATIONSHIP_CHANGE,
  STARTING_RELATIONSHIP,
  RELATIONSHIP_MORALE_BONUS,
} from "../game/constants";

/**
 * Get the relationship level label from a numeric value
 */
export function getRelationshipLevel(value: number): RelationshipLevel {
  if (value <= 1) return "hostile";
  if (value <= 3) return "tense";
  if (value <= 5) return "neutral";
  if (value <= 7) return "friendly";
  if (value <= 9) return "close";
  return "intimate";
}

/**
 * Get relationship level description for UI
 */
export function getRelationshipDescription(level: RelationshipLevel): string {
  const descriptions: Record<RelationshipLevel, string> = {
    hostile: "Hostile - They hate each other",
    tense: "Tense - There's friction between them",
    neutral: "Neutral - Professional relationship",
    friendly: "Friendly - They get along well",
    close: "Close - Strong bond of friendship",
    intimate: "Intimate - Deep love or lifelong friends",
  };
  return descriptions[level];
}

/**
 * Create a canonical relationship key from two crew IDs
 * Always puts IDs in alphabetical order for consistent lookup
 */
export function getRelationshipKey(
  crewId1: string,
  crewId2: string
): { crewId1: string; crewId2: string } {
  if (crewId1 < crewId2) {
    return { crewId1, crewId2 };
  }
  return { crewId1: crewId2, crewId2: crewId1 };
}

/**
 * Find a relationship between two crew members
 */
export function findRelationship(
  relationships: CrewRelationship[],
  crewId1: string,
  crewId2: string
): CrewRelationship | undefined {
  const { crewId1: id1, crewId2: id2 } = getRelationshipKey(crewId1, crewId2);
  return relationships.find((r) => r.crewId1 === id1 && r.crewId2 === id2);
}

/**
 * Get the relationship level between two crew members
 * Returns STARTING_RELATIONSHIP (5/neutral) if no relationship exists
 */
export function getRelationshipValue(
  relationships: CrewRelationship[],
  crewId1: string,
  crewId2: string
): number {
  const rel = findRelationship(relationships, crewId1, crewId2);
  return rel ? rel.level : STARTING_RELATIONSHIP;
}

/**
 * Initialize relationships for a new crew member with all existing crew
 */
export function initializeRelationships(
  existingRelationships: CrewRelationship[],
  newCrewId: string,
  existingCrewIds: string[]
): CrewRelationship[] {
  const newRelationships: CrewRelationship[] = [];

  for (const existingId of existingCrewIds) {
    if (existingId === newCrewId) continue;

    // Check if relationship already exists
    if (!findRelationship(existingRelationships, newCrewId, existingId)) {
      const { crewId1, crewId2 } = getRelationshipKey(newCrewId, existingId);
      newRelationships.push({
        crewId1,
        crewId2,
        level: STARTING_RELATIONSHIP,
        history: ["First met"],
      });
    }
  }

  return [...existingRelationships, ...newRelationships];
}

/**
 * Change a relationship between two crew members
 * Returns the updated relationships array and the change details
 */
export function changeRelationship(
  relationships: CrewRelationship[],
  crewId1: string,
  crewId2: string,
  delta: number,
  reason: string
): { relationships: CrewRelationship[]; change: RelationshipChange } {
  const { crewId1: id1, crewId2: id2 } = getRelationshipKey(crewId1, crewId2);

  const existingIndex = relationships.findIndex(
    (r) => r.crewId1 === id1 && r.crewId2 === id2
  );

  let updatedRelationships: CrewRelationship[];
  let oldLevel: number;
  let newLevel: number;

  if (existingIndex >= 0) {
    // Update existing relationship
    const existing = relationships[existingIndex];
    oldLevel = existing.level;
    newLevel = Math.max(0, Math.min(10, existing.level + delta));

    const updatedHistory = [reason, ...existing.history].slice(0, 5); // Keep last 5 entries

    updatedRelationships = [
      ...relationships.slice(0, existingIndex),
      { ...existing, level: newLevel, history: updatedHistory },
      ...relationships.slice(existingIndex + 1),
    ];
  } else {
    // Create new relationship
    oldLevel = STARTING_RELATIONSHIP;
    newLevel = Math.max(0, Math.min(10, STARTING_RELATIONSHIP + delta));

    updatedRelationships = [
      ...relationships,
      {
        crewId1: id1,
        crewId2: id2,
        level: newLevel,
        history: [reason],
      },
    ];
  }

  return {
    relationships: updatedRelationships,
    change: {
      crewId1: id1,
      crewId2: id2,
      delta: newLevel - oldLevel,
      reason,
    },
  };
}

/**
 * Get all relationships for a specific crew member
 */
export function getCrewRelationships(
  relationships: CrewRelationship[],
  crewId: string
): Array<{ otherId: string; level: number; levelName: RelationshipLevel; history: string[] }> {
  return relationships
    .filter((r) => r.crewId1 === crewId || r.crewId2 === crewId)
    .map((r) => {
      const otherId = r.crewId1 === crewId ? r.crewId2 : r.crewId1;
      return {
        otherId,
        level: r.level,
        levelName: getRelationshipLevel(r.level),
        history: r.history,
      };
    });
}

/**
 * Calculate total morale modifier from relationships for a crew member
 */
export function calculateRelationshipMorale(
  relationships: CrewRelationship[],
  crewId: string
): number {
  const crewRelationships = getCrewRelationships(relationships, crewId);
  let totalMorale = 0;

  for (const rel of crewRelationships) {
    const level = rel.levelName;
    const bonus = RELATIONSHIP_MORALE_BONUS[level as keyof typeof RELATIONSHIP_MORALE_BONUS];
    if (bonus !== undefined) {
      totalMorale += bonus;
    }
  }

  return totalMorale;
}

/**
 * Get pairs of crew with strong positive relationships (for events)
 */
export function getClosePairs(
  relationships: CrewRelationship[],
  minLevel: number = 8
): Array<{ crewId1: string; crewId2: string; level: number }> {
  return relationships
    .filter((r) => r.level >= minLevel)
    .map((r) => ({ crewId1: r.crewId1, crewId2: r.crewId2, level: r.level }));
}

/**
 * Get pairs of crew with negative relationships (for conflict events)
 */
export function getRivalPairs(
  relationships: CrewRelationship[],
  maxLevel: number = 3
): Array<{ crewId1: string; crewId2: string; level: number }> {
  return relationships
    .filter((r) => r.level <= maxLevel)
    .map((r) => ({ crewId1: r.crewId1, crewId2: r.crewId2, level: r.level }));
}

/**
 * Process relationship changes from salvaging together
 */
export function processWorkTogether(
  relationships: CrewRelationship[],
  crewIds: string[]
): CrewRelationship[] {
  if (crewIds.length < 2) return relationships;

  let updatedRelationships = relationships;

  // Each pair of crew working together gets a small relationship boost
  for (let i = 0; i < crewIds.length; i++) {
    for (let j = i + 1; j < crewIds.length; j++) {
      const result = changeRelationship(
        updatedRelationships,
        crewIds[i],
        crewIds[j],
        RELATIONSHIP_CHANGE.work_together,
        "Worked together on salvage"
      );
      updatedRelationships = result.relationships;
    }
  }

  return updatedRelationships;
}

/**
 * Remove all relationships involving a specific crew member (on death/leave)
 */
export function removeCrewRelationships(
  relationships: CrewRelationship[],
  crewId: string
): CrewRelationship[] {
  return relationships.filter(
    (r) => r.crewId1 !== crewId && r.crewId2 !== crewId
  );
}

/**
 * Get relationship emoji for UI display
 */
export function getRelationshipEmoji(level: RelationshipLevel): string {
  const emojis: Record<RelationshipLevel, string> = {
    hostile: "💢",
    tense: "😤",
    neutral: "😐",
    friendly: "🙂",
    close: "😊",
    intimate: "💕",
  };
  return emojis[level];
}

/**
 * Check if two crew can trigger a romance event
 */
export function canTriggerRomance(
  relationships: CrewRelationship[],
  crewId1: string,
  crewId2: string
): boolean {
  const level = getRelationshipValue(relationships, crewId1, crewId2);
  return level >= 7; // Friendly or higher can develop romance
}

/**
 * Check if two crew are likely to have a conflict
 */
export function isConflictLikely(
  relationships: CrewRelationship[],
  crewId1: string,
  crewId2: string
): boolean {
  const level = getRelationshipValue(relationships, crewId1, crewId2);
  return level <= 3; // Tense or hostile
}
