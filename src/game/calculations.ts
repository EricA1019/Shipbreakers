/**
 * Game Calculations
 * 
 * Centralized pure calculation functions for game mechanics.
 * Eliminates duplicate logic in gameStore (3x fuel calculation, XP formulas, etc.)
 */
import type { ItemEffect } from '../types';
import {
  FUEL_COST_PER_AU,
  PILOTING_FUEL_REDUCTION_PER_LEVEL,
  XP_BASE_SUCCESS,
  XP_BASE_FAIL,
  XP_PER_HAZARD_LEVEL,
  XP_PER_TIER,
  DAYS_PER_10_AU,
} from './constants';

/**
 * Calculate fuel cost for travel to a wreck
 * Consolidates 3x duplicate logic from gameStore: startRun, travelToWreck, returnToStation
 * 
 * @param distance Distance to wreck in AU
 * @param pilotingSkill Pilot's piloting skill level (0-5)
 * @param shipEffects Active ship effects (from installed equipment)
 * @returns Fuel cost for one-way travel
 */
export function calculateTravelCost(
  distance: number,
  pilotingSkill: number,
  shipEffects: ItemEffect[]
): number {
  // Piloting skill reduces fuel usage
  const skillReduction = Math.max(
    0,
    1 - pilotingSkill * PILOTING_FUEL_REDUCTION_PER_LEVEL
  );
  
  // Ship equipment fuel efficiency bonuses
  const fuelEfficiency =
    shipEffects
      .filter((e) => e.type === 'fuel_efficiency')
      .reduce((sum, e) => sum + e.value, 0) / 100;
  
  // Combined reduction (skill + equipment)
  const finalReduction = Math.max(0, skillReduction * (1 - fuelEfficiency));
  
  // Calculate cost with minimum of 1
  return Math.max(1, Math.ceil(distance * FUEL_COST_PER_AU * finalReduction));
}

/**
 * Calculate XP reward for salvage attempt
 * 
 * @param hazardLevel Room hazard level (0-5)
 * @param wreckTier Wreck difficulty tier (1-5)
 * @param success Whether the salvage attempt succeeded
 * @returns XP to award
 */
export function calculateSalvageXp(
  hazardLevel: number,
  wreckTier: number,
  success: boolean
): number {
  const baseXp = success ? XP_BASE_SUCCESS : XP_BASE_FAIL;
  const hazardBonus = hazardLevel * XP_PER_HAZARD_LEVEL;
  const tierBonus = wreckTier * XP_PER_TIER;
  
  // Failed attempts give half the bonus XP
  const bonusMultiplier = success ? 1 : 0.5;
  
  return Math.floor(baseXp + (hazardBonus + tierBonus) * bonusMultiplier);
}

/**
 * Calculate days spent traveling to/from a wreck
 * Used for provision consumption and time advancement
 * 
 * @param distance Distance in AU
 * @returns Number of days spent (minimum 1)
 */
export function calculateDaysSpent(distance: number): number {
  return Math.max(1, Math.ceil(distance / DAYS_PER_10_AU));
}

/**
 * Calculate round-trip fuel cost (convenience wrapper)
 * 
 * @param distance Distance to wreck in AU
 * @param pilotingSkill Pilot's piloting skill level
 * @param shipEffects Active ship effects
 * @returns Total fuel cost for round trip
 */
export function calculateRoundTripFuelCost(
  distance: number,
  pilotingSkill: number,
  shipEffects: ItemEffect[]
): number {
  const oneWay = calculateTravelCost(distance, pilotingSkill, shipEffects);
  return oneWay * 2;
}

/**
 * Calculate crew skill effectiveness with modifiers
 * Applies trait bonuses and penalties to base skill
 * 
 * @param baseSkill Base skill level (0-5)
 * @param traitModifier Trait modifier percentage (-100 to +100)
 * @returns Effective skill level (clamped to 0-5)
 */
export function calculateEffectiveSkill(
  baseSkill: number,
  traitModifier: number
): number {
  const modified = baseSkill + (baseSkill * traitModifier / 100);
  return Math.max(0, Math.min(5, Math.floor(modified)));
}

/**
 * Calculate skill XP progress percentage for UI display
 * 
 * @param currentXp Current XP in skill
 * @param currentLevel Current skill level (1-5)
 * @param xpThresholds Array of XP thresholds per level
 * @returns Percentage progress (0-100) to next level, or 100 if maxed
 */
export function calculateSkillProgress(
  currentXp: number,
  currentLevel: number,
  xpThresholds: number[]
): number {
  if (currentLevel >= 5) return 100; // Max level
  
  // Calculate cumulative XP needed for current level
  const cumulativeXp = xpThresholds.slice(0, currentLevel - 1).reduce((sum, threshold) => sum + threshold, 0);
  
  // XP into current level
  const xpIntoLevel = currentXp - cumulativeXp;
  const nextThreshold = xpThresholds[currentLevel - 1];
  
  return Math.floor((xpIntoLevel / nextThreshold) * 100);
}
