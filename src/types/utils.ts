/**
 * Type Utilities
 * 
 * Utility types and type guards for improved type safety.
 * These help reduce `as any` casts across the codebase.
 */
import type { 
  HazardType,
  SkillType,
  PlayerShip,
  PlayerShipRoom,
  ItemSlot,
  CrewMember,
  Wreck,
  Ship,
  ShipLayout,
} from './index';
import { SKILL_HAZARD_MAP } from '../game/constants';

/**
 * Type-safe hazard type checker
 */
export function isHazardType(value: string): value is HazardType {
  return ['mechanical', 'combat', 'environmental', 'security'].includes(value);
}

/**
 * Type-safe skill type checker
 */
export function isSkillType(value: string): value is SkillType {
  return ['technical', 'combat', 'salvage', 'piloting'].includes(value);
}

/**
 * Get the matching skill for a hazard type (type-safe)
 */
export function getSkillForHazardType(hazardType: HazardType): SkillType {
  return SKILL_HAZARD_MAP[hazardType] as SkillType;
}

/**
 * Type guard for PlayerShipRoom with slots
 */
export function isPlayerShipRoom(room: unknown): room is PlayerShipRoom {
  if (typeof room !== 'object' || room === null) return false;
  const r = room as Record<string, unknown>;
  return 'roomType' in r && Array.isArray(r.slots);
}

/**
 * Find a room by ID on the player ship grid
 */
export function findRoomById(ship: PlayerShip, roomId: string): PlayerShipRoom | undefined {
  for (const row of ship.grid) {
    for (const room of row) {
      if (room.id === roomId && isPlayerShipRoom(room)) {
        return room;
      }
    }
  }
  return undefined;
}

/**
 * Find a slot in a room by ID
 */
export function findSlotById(room: PlayerShipRoom, slotId: string): ItemSlot | undefined {
  return room.slots.find((s) => s.id === slotId);
}

/**
 * Find a room by type on the player ship
 */
export function findRoomByType(
  ship: PlayerShip, 
  roomType: PlayerShipRoom['roomType']
): PlayerShipRoom | undefined {
  for (const row of ship.grid) {
    for (const room of row) {
      if (isPlayerShipRoom(room) && room.roomType === roomType) {
        return room;
      }
    }
  }
  return undefined;
}

/**
 * Type guard for Wreck with Ship
 */
export function hasWreckShip(wreck: Wreck): wreck is Wreck & { ship: Ship } {
  return 'ship' in wreck && wreck.ship !== undefined;
}

/**
 * Type guard for Ship with Layout
 */
export function hasLayout(ship: Ship): ship is Ship & { layout: ShipLayout } {
  return 'layout' in ship && ship.layout !== undefined && Array.isArray(ship.layout.rooms);
}

/**
 * Type-safe crew member property access
 */
export function getCrewProperty<K extends keyof CrewMember>(
  crew: CrewMember,
  property: K
): CrewMember[K] {
  return crew[property];
}

/**
 * Safely cast game state properties that may be undefined
 */
export type SafeGameState<T> = {
  [K in keyof T]: T[K] extends undefined ? T[K] | undefined : T[K];
};

/**
 * Type for provisions (food, water, beer, wine)
 */
export type ProvisionKind = 'food' | 'water' | 'beer' | 'wine';

/**
 * Check if a string is a valid provision kind
 */
export function isProvisionKind(value: string): value is ProvisionKind {
  return ['food', 'water', 'beer', 'wine'].includes(value);
}

/**
 * Non-nullable utility type - removes null and undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Deep partial - makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Type for function that updates state
 */
export type StateUpdater<T> = (prev: T) => Partial<T>;
