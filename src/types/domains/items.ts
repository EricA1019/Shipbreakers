/**
 * Items domain types
 * Re-exports item and loot-related types from the main types module
 */
export type {
  LootCategory,
  LootRarity,
  ItemType,
  SlotType,
  EffectType,
  ItemEffect,
  Loot,
  Item,
  // Shared types used with items
  SkillType,
  HazardType,
} from '../index';

// Re-export type guard
export { isEquippable } from '../index';
