/**
 * Domain type modules index
 * 
 * These "view" modules provide logical groupings of types for easier imports.
 * All types are still defined in the main ../index.ts file to avoid circular dependencies.
 * 
 * Usage:
 *   // Instead of importing everything from types
 *   import type { CrewMember, Skills, SkillType } from '@/types';
 * 
 *   // You can import from domain modules
 *   import type { CrewMember, Skills, SkillType } from '@/types/domains/crew';
 * 
 * Available domains:
 * - crew: CrewMember, Skills, traits, backgrounds
 * - ship: Ship, Room, GridRoom, PlayerShip, Wreck
 * - items: Loot, Item, equipment types
 * - zones: GraveyardZone, LicenseTier, ZONES, LICENSE_TIERS constants
 * - ui: Toast, Screen, ScreenProps
 * - events: GameEvent, EventChoice, shore leave types
 * - game: GameState, RunState, PlayerStats
 */

export * from './crew';
export * from './ship';
export * from './items';
export * from './zones';
export * from './ui';
export * from './events';
export * from './game';
