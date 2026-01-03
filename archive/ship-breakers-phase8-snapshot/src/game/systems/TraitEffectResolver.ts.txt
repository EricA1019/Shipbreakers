import type { CrewMember } from "../../types";
import { TRAITS } from "../data/traits";

export interface TraitModifiers {
  skillMod: number;
  staminaMod: number;
  sanityMod: number;
  eventMod: number;
  lootMod: number;
}

/**
 * Calculate all trait effect modifiers for a crew member
 * Simple additive model - all effects stack linearly
 */
export function calculateTraitEffects(crew: CrewMember): TraitModifiers {
  const modifiers: TraitModifiers = {
    skillMod: 0,
    staminaMod: 0,
    sanityMod: 0,
    eventMod: 0,
    lootMod: 0,
  };

  // Handle crew without traits (defensive coding for tests/edge cases)
  if (!crew.traits || crew.traits.length === 0) {
    return modifiers;
  }

  crew.traits.forEach((traitId) => {
    const trait = TRAITS[traitId];
    if (!trait) return;

    trait.effects.forEach((effect) => {
      switch (effect.type) {
        case "skill_mod":
          modifiers.skillMod += effect.value;
          break;
        case "stamina_mod":
          modifiers.staminaMod += effect.value;
          break;
        case "sanity_mod":
          modifiers.sanityMod += effect.value;
          break;
        case "event_chance":
          modifiers.eventMod += effect.value;
          break;
        case "loot_bonus":
          modifiers.lootMod += effect.value;
          break;
        // 'special' and 'work_speed' not implemented yet
      }
    });
  });

  return modifiers;
}

/**
 * Apply trait skill bonuses to a base skill value
 */
export function applyTraitSkillBonus(
  baseSkill: number,
  crew: CrewMember,
): number {
  const mods = calculateTraitEffects(crew);
  return baseSkill + mods.skillMod;
}
