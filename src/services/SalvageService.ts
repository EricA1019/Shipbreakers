/**
 * Salvage Service
 * 
 * Handles salvage operation logic and calculations.
 * Core salvage state transitions remain in gameStore for now,
 * but calculation logic is extracted here.
 */
import type { 
  GameState, 
  Loot, 
  Room, 
  Wreck, 
  SkillType,
  CrewMember,
} from '../types';
import { 
  calculateHazardSuccess, 
  damageOnFail, 
  calculateLootValue 
} from '../game/hazardLogic';
import { 
  RARITY_TIME_COST,
  SKILL_HAZARD_MAP,
  XP_BASE_SUCCESS,
  XP_BASE_FAIL,
  XP_PER_HAZARD_LEVEL,
  XP_PER_TIER,
  FUEL_COST_PER_AU,
  PILOTING_FUEL_REDUCTION_PER_LEVEL,
} from '../game/constants';
import { calculateTraitEffects } from '../game/systems/TraitEffectResolver';
import { getActiveEffects } from '../game/systems/slotManager';

/**
 * Result of a salvage attempt
 */
export interface SalvageResult {
  success: boolean;
  damage: number;
  timeCost: number;
  xpGained: number;
  skill: SkillType;
  adjustedItem?: Loot;
}

/**
 * Calculate fuel cost for travel based on distance and piloting skill
 */
export function calculateFuelCost(distance: number, pilotingSkill: number): number {
  const baseCost = Math.ceil(distance * FUEL_COST_PER_AU);
  const reduction = pilotingSkill * PILOTING_FUEL_REDUCTION_PER_LEVEL;
  return Math.max(1, baseCost - reduction);
}

/**
 * Calculate time cost for salvaging an item based on rarity
 */
export function calculateTimeCost(rarity: Loot['rarity']): number {
  return RARITY_TIME_COST[rarity];
}

/**
 * Calculate XP gained from a salvage attempt
 */
export function calculateXpGain(
  hazardLevel: number,
  wreckTier: number,
  success: boolean
): number {
  if (success) {
    return XP_BASE_SUCCESS + 
      hazardLevel * XP_PER_HAZARD_LEVEL + 
      wreckTier * XP_PER_TIER;
  }
  return XP_BASE_FAIL + 
    Math.floor((hazardLevel * XP_PER_HAZARD_LEVEL + wreckTier * XP_PER_TIER) / 2);
}

/**
 * Get the matching skill for a hazard type
 */
export function getSkillForHazard(hazardType: string): SkillType {
  return SKILL_HAZARD_MAP[hazardType as keyof typeof SKILL_HAZARD_MAP] as SkillType || 'salvage';
}

/**
 * Calculate success chance for a salvage attempt
 */
export function calculateSalvageChance(
  crewSkills: CrewMember['skills'],
  hazardType: string,
  hazardLevel: number,
  wreckTier: number,
  crew?: CrewMember
): number {
  let successChance = calculateHazardSuccess(
    crewSkills,
    hazardType as Parameters<typeof calculateHazardSuccess>[1],
    hazardLevel,
    wreckTier
  );

  // Apply trait skill modifiers if crew provided
  if (crew) {
    const traitMods = calculateTraitEffects(crew);
    successChance += traitMods.skillMod;
  }

  return Math.max(0, Math.min(100, successChance));
}

/**
 * Calculate adjusted item value after salvage bonuses
 */
export function calculateAdjustedItemValue(
  item: Loot,
  salvageSkill: number,
  playerShip?: GameState['playerShip'],
  crew?: CrewMember
): number {
  const activeEffects = playerShip ? getActiveEffects(playerShip) : [];
  let value = calculateLootValue(item.value, salvageSkill, activeEffects);

  if (crew) {
    const traitMods = calculateTraitEffects(crew);
    value = Math.round(value * (1 + traitMods.lootMod / 100));
  }

  return value;
}

/**
 * Perform a salvage roll and return the result
 */
export function performSalvageRoll(
  room: Room,
  item: Loot,
  wreckTier: number,
  crew: CrewMember,
  playerShip?: GameState['playerShip']
): SalvageResult {
  const timeCost = calculateTimeCost(item.rarity);
  const skill = getSkillForHazard(room.hazardType);
  
  const successChance = calculateSalvageChance(
    crew.skills,
    room.hazardType,
    room.hazardLevel,
    wreckTier,
    crew
  );

  const roll = Math.random() * 100;
  const success = roll < successChance;

  if (success) {
    const adjustedValue = calculateAdjustedItemValue(
      item,
      crew.skills.salvage,
      playerShip,
      crew
    );

    return {
      success: true,
      damage: 0,
      timeCost,
      xpGained: calculateXpGain(room.hazardLevel, wreckTier, true),
      skill,
      adjustedItem: { ...item, value: adjustedValue },
    };
  }

  return {
    success: false,
    damage: damageOnFail(room.hazardLevel),
    timeCost,
    xpGained: calculateXpGain(room.hazardLevel, wreckTier, false),
    skill,
  };
}

/**
 * Check if crew can perform salvage based on health/stamina thresholds
 */
export function canCrewSalvage(
  crew: CrewMember,
  settings: GameState['settings']
): { available: boolean; reason?: string } {
  const hpPercent = (crew.hp / crew.maxHp) * 100;

  if (hpPercent < settings.minCrewHpPercent) {
    return { available: false, reason: 'HP too low' };
  }

  if (crew.stamina < settings.minCrewStamina) {
    return { available: false, reason: 'Stamina too low' };
  }

  if (crew.sanity < settings.minCrewSanity) {
    return { available: false, reason: 'Sanity too low' };
  }

  if (crew.status !== 'active') {
    return { available: false, reason: `Crew is ${crew.status}` };
  }

  return { available: true };
}

/**
 * Get summary statistics for a wreck
 */
export function getWreckStats(wreck: Wreck): {
  totalRooms: number;
  lootedRooms: number;
  totalLoot: number;
  estimatedValue: number;
} {
  const lootedRooms = wreck.rooms.filter((r) => r.looted).length;
  const allLoot = wreck.rooms.flatMap((r) => r.loot);
  
  return {
    totalRooms: wreck.rooms.length,
    lootedRooms,
    totalLoot: allLoot.length,
    estimatedValue: allLoot.reduce((sum, item) => sum + item.value, 0),
  };
}

/**
 * Check if a wreck is fully stripped
 */
export function isWreckStripped(wreck: Wreck): boolean {
  return wreck.rooms.every((r) => r.looted || r.loot.length === 0);
}
