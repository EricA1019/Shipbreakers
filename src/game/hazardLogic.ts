import type { Skills, HazardType } from '../types';
import { SKILL_HAZARD_MAP, SKILL_MISMATCH_PENALTY, MISMATCH_PENALTY_THRESHOLD, SALVAGE_VALUE_BONUS_PER_LEVEL } from './constants';

export function calculateHazardSuccess(skills: Skills, hazardType: HazardType, hazardLevel: number, tier: number): number {
  // Determine the matching skill key
  const matchingSkillKey = SKILL_HAZARD_MAP[hazardType] as keyof Skills;
  const matchingSkillValue = skills[matchingSkillKey] ?? 1;
  
  // Find the highest skill value (best crew member capability)
  const highestSkillValue = Math.max(
    skills.technical,
    skills.combat,
    skills.salvage,
    skills.piloting
  );
  
  // Use the higher of: matching skill or highest skill
  // This allows skilled crew to adapt their expertise to different challenges
  const skillValue = Math.max(matchingSkillValue, highestSkillValue);

  // Slightly easier: bump skill influence and ease hazard penalty
  let base = skillValue * 22 - hazardLevel * 8;

  // Bonus if using the matching skill (synergy bonus)
  if (matchingSkillValue === highestSkillValue && matchingSkillValue >= 3) {
    base += 5; // Small bonus for being specialized in the right area
  }

  // If mismatched (skill that would match isn't present or low) and tier >= threshold apply penalty
  // We'll interpret 'mismatch' as the player not having a high matching skill; the penalty applies if the skill is less than 3
  if (tier >= MISMATCH_PENALTY_THRESHOLD && (matchingSkillValue < 3)) {
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
