import type { Skills, HazardType } from '../types';
import { SKILL_HAZARD_MAP, SKILL_MISMATCH_PENALTY, MISMATCH_PENALTY_THRESHOLD, SALVAGE_VALUE_BONUS_PER_LEVEL } from './constants';

export function calculateHazardSuccess(skills: Skills, hazardType: HazardType, hazardLevel: number, tier: number): number {
  // Determine the matching skill key
  const matchingSkillKey = SKILL_HAZARD_MAP[hazardType] as keyof Skills;
  const skillValue = skills[matchingSkillKey] ?? 1;

  let base = skillValue * 20 - hazardLevel * 10;

  // If mismatched (skill that would match isn't present or low) and tier >= threshold apply penalty
  // We'll interpret 'mismatch' as the player not having a high matching skill; the penalty applies if the skill is less than 3
  if (tier >= MISMATCH_PENALTY_THRESHOLD && (skillValue < 3)) {
    base -= SKILL_MISMATCH_PENALTY;
  }

  // Clamp result between 0 and 100
  return Math.max(0, Math.min(100, base));
}

export function damageOnFail(hazardLevel: number): number {
  return hazardLevel * 10;
}

export function calculateLootValue(baseValue: number, salvageSkill: number): number {
  const bonusLevels = Math.max(0, salvageSkill - 1);
  const multiplier = 1 + bonusLevels * SALVAGE_VALUE_BONUS_PER_LEVEL;
  return Math.round(baseValue * multiplier);
}
