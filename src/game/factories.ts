/**
 * Game Object Factories
 * 
 * Centralized factory functions for creating default game objects.
 * Eliminates duplicate initialization logic in gameStore.ts (3x captain, 2x ship setup).
 */
import type {
  CrewMember,
  GameSettings,
  PlayerStats,
  PantryCapacity,
  ItemFlags,
} from '../types';
import {
  STARTING_HP,
  STARTING_SKILLS,
  STARTING_SKILL_XP,
  BASE_STAMINA,
  BASE_SANITY,
  PANTRY_CAPACITY,
  DEFAULT_MIN_CREW_HP_PERCENT,
  DEFAULT_MIN_CREW_STAMINA,
  DEFAULT_MIN_CREW_SANITY,
} from './constants';
import { generateId } from '../utils/idGenerator';

/**
 * Create the default captain/player character
 * Used in: initial state, initializeGame, resetGame
 */
export function createDefaultCaptain(
  firstName: string = 'Player',
  lastName: string = 'Captain'
): CrewMember {
  return {
    id: 'captain-1',
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    isPlayer: true,
    background: 'ship_captain',
    traits: ['steady', 'pragmatic'],
    skills: { ...STARTING_SKILLS },
    skillXp: {
      technical: STARTING_SKILL_XP,
      combat: STARTING_SKILL_XP,
      salvage: STARTING_SKILL_XP,
      piloting: STARTING_SKILL_XP,
    },
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    stamina: BASE_STAMINA,
    maxStamina: BASE_STAMINA,
    sanity: BASE_SANITY,
    maxSanity: BASE_SANITY,
    currentJob: 'idle',
    status: 'active',
    position: { location: 'station' },
    inventory: [],
  };
}

/**
 * Create default game settings
 */
export function createDefaultSettings(): GameSettings {
  return {
    autoSave: true,
    confirmDialogs: true,
    showTooltips: true,
    showKeyboardHints: true,
    minCrewHpPercent: DEFAULT_MIN_CREW_HP_PERCENT,
    minCrewStamina: DEFAULT_MIN_CREW_STAMINA,
    minCrewSanity: DEFAULT_MIN_CREW_SANITY,
  };
}

/**
 * Create default player stats
 */
export function createDefaultStats(): PlayerStats {
  return {
    totalCreditsEarned: 0,
    totalWrecksCleared: 0,
    totalRoomsSalvaged: 0,
    totalItemsCollected: 0,
    highestSingleProfit: 0,
    mostValuableItem: null,
    longestWinStreak: 0,
    deathsAvoided: 0,
    licensesRenewed: 0,
    daysPlayed: 0,
  };
}

/**
 * Create default pantry capacity
 */
export function createDefaultPantry(): PantryCapacity {
  return { ...PANTRY_CAPACITY };
}

/**
 * Create default item flags
 * Used when creating new items or migrating old items
 */
export function createDefaultItemFlags(overrides?: Partial<ItemFlags>): ItemFlags {
  return {
    sellable: true,
    storable: true,
    carryable: true,
    equippable: false,
    consumable: false,
    questItem: false,
    passive: false,
    powered: false,
    ...overrides,
  };
}

/**
 * Generate a unique crew ID
 * Replaces inline Date.now() + Math.random() patterns
 */
export function generateCrewId(): string {
  return `crew-${generateId().slice(0, 8)}`;
}

/**
 * Generate a unique item ID
 * Replaces inline Date.now() patterns
 */
export function generateItemId(): string {
  return `item-${generateId().slice(0, 8)}`;
}

/**
 * Generate a unique room ID
 * Replaces inline Date.now() patterns
 */
export function generateRoomId(): string {
  return `room-${generateId().slice(0, 8)}`;
}
