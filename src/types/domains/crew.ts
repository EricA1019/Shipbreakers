/**
 * Crew domain types
 * Re-exports crew-related types from the main types module
 * 
 * This is a "view" module - it doesn't define types, just re-exports
 * a logical subset for easier imports in crew-related code.
 */
export type {
  SkillType,
  Skills,
  SkillXp,
  CrewStatus,
  CrewJob,
  CrewPosition,
  CrewMember,
  Crew,
  HireCandidate,
  BackgroundId,
  TraitId,
  CrewBackground,
  TraitEffectType,
  TraitEffect,
  CrewTrait,
  GridPosition,
} from '../index';
