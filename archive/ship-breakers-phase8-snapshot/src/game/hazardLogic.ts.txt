import type { Skills, HazardType, ItemEffect } from "../types";
import {
  SKILL_HAZARD_MAP,
  SKILL_MISMATCH_PENALTY,
  MISMATCH_PENALTY_THRESHOLD,
  SALVAGE_VALUE_BONUS_PER_LEVEL,
} from "./constants";

export function calculateHazardSuccess(
  skills: Skills,
  hazardType: HazardType,
  hazardLevel: number,
  tier: number,
  effects: ItemEffect[] = [],
): number {
  // Determine the matching skill key
  const matchingSkillKey = SKILL_HAZARD_MAP[hazardType] as keyof Skills;
  const matchingSkillValue = skills[matchingSkillKey] ?? 1;

  // Find the highest skill value (best crew member capability)
  const highestSkillValue = Math.max(
    skills.technical,
    skills.combat,
    skills.salvage,
    skills.piloting,
  );

  // Use the higher of: matching skill or highest skill
  let skillValue = Math.max(matchingSkillValue, highestSkillValue);

  // Apply equipment skill bonuses targeting the matching skill
  const skillBonus = effects
    .filter(
      (e) => e.type === "skill_bonus" && (e as any).skill === matchingSkillKey,
    )
    .reduce((s, e) => s + e.value, 0);
  skillValue += skillBonus;

  // Slightly easier: bump skill influence and ease hazard penalty
  let base = skillValue * 22 - hazardLevel * 8;

  // Apply hazard-specific resistances from equipment (additive to base success)
  const hazardResist = effects
    .filter(
      (e) => e.type === "hazard_resist" && (e as any).hazard === hazardType,
    )
    .reduce((s, e) => s + e.value, 0);
  base += hazardResist; // e.g., +10 from hazard_resist = +10 success points

  // Bonus if using the matching skill (synergy bonus)
  if (matchingSkillValue === highestSkillValue && matchingSkillValue >= 3) {
    base += 5; // Small bonus for being specialized in the right area
  }

  // If mismatched (skill that would match isn't present or low) and tier >= threshold apply penalty
  if (tier >= MISMATCH_PENALTY_THRESHOLD && matchingSkillValue < 3) {
    base -= SKILL_MISMATCH_PENALTY;
  }

  // Clamp result between 0 and 100
  return Math.max(0, Math.min(100, base));
}

export function damageOnFail(hazardLevel: number): number {
  return hazardLevel * 10;
}

export function calculateLootValue(
  baseValue: number,
  salvageSkill: number,
  effects: ItemEffect[] = [],
): number {
  const bonusLevels = Math.max(0, salvageSkill - 1);
  const multiplier = 1 + bonusLevels * SALVAGE_VALUE_BONUS_PER_LEVEL;
  const lootBonusPercent = effects
    .filter((e) => e.type === "loot_bonus")
    .reduce((s, e) => s + e.value, 0);
  return Math.round(baseValue * multiplier * (1 + lootBonusPercent / 100));
}
