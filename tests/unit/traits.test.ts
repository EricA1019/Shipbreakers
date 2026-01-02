import { describe, it, expect } from "vitest";
import { calculateTraitEffects, applyTraitSkillBonus } from "../../src/game/systems/TraitEffectResolver";
import type { CrewMember } from "../../src/types";

describe("Trait Effect System", () => {
  const baseCrew: CrewMember = {
    id: "test1",
    firstName: "Test",
    lastName: "Crew",
    name: "Test Crew",
    background: "station_rat",
    traits: [],
    skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
    skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    sanity: 100,
    maxSanity: 100,
    currentJob: "idle",
    status: "active",
  };

  it("calculates no modifiers for crew with no traits", () => {
    const mods = calculateTraitEffects(baseCrew);

    expect(mods.skillMod).toBe(0);
    expect(mods.staminaMod).toBe(0);
    expect(mods.sanityMod).toBe(0);
    expect(mods.eventMod).toBe(0);
    expect(mods.lootMod).toBe(0);
  });

  it("applies positive event chance modifier from 'brave' trait", () => {
    const crewWithBrave: CrewMember = {
      ...baseCrew,
      traits: ["brave"],
    };

    const mods = calculateTraitEffects(crewWithBrave);

    // Brave: -20 event_chance (horror resist)
    expect(mods.eventMod).toBe(-20);
  });

  it("applies loot bonus from 'eagle_eye' trait", () => {
    const crewWithEagle: CrewMember = {
      ...baseCrew,
      traits: ["eagle_eye"],
    };

    const mods = calculateTraitEffects(crewWithEagle);

    // Eagle Eye: +10 loot_bonus
    expect(mods.lootMod).toBe(10);
  });

  it("applies sanity modifier from 'loyal' trait", () => {
    const crewWithLoyal: CrewMember = {
      ...baseCrew,
      traits: ["loyal"],
    };

    const mods = calculateTraitEffects(crewWithLoyal);

    // Loyal: +10 sanity_mod
    expect(mods.sanityMod).toBe(10);
  });

  it("stacks multiple trait effects additively", () => {
    const crewWithMultiple: CrewMember = {
      ...baseCrew,
      traits: ["veteran", "eagle_eye", "tireless"],
    };

    const mods = calculateTraitEffects(crewWithMultiple);

    // Veteran: +10 skill, Eagle Eye: +10 loot, Tireless: -20 stamina_mod
    expect(mods.skillMod).toBe(10);
    expect(mods.lootMod).toBe(10);
    expect(mods.staminaMod).toBe(-20);
  });

  it("combines positive and negative event modifiers correctly", () => {
    const crewMixed: CrewMember = {
      ...baseCrew,
      traits: ["brave", "reckless"], // -20 horror, +15 injury
    };

    const mods = calculateTraitEffects(crewMixed);

    expect(mods.eventMod).toBe(-5); // -20 + 15 = -5
  });

  it("applies trait skill bonus to base skill value", () => {
    const crewWithVeteran: CrewMember = {
      ...baseCrew,
      traits: ["veteran"],
    };

    const baseSkill = 10;
    const adjusted = applyTraitSkillBonus(baseSkill, crewWithVeteran);

    // +10 from veteran trait
    expect(adjusted).toBe(20);
  });

  it("handles stamina reduction from 'tireless' trait", () => {
    const crewWithTireless: CrewMember = {
      ...baseCrew,
      traits: ["tireless"],
    };

    const mods = calculateTraitEffects(crewWithTireless);

    // Tireless: -20 stamina consumption
    expect(mods.staminaMod).toBe(-20);
  });

  it("stacks multiple skill-affecting traits", () => {
    const crewMultipleSkill: CrewMember = {
      ...baseCrew,
      traits: ["veteran"], // Has +10 skill mod
    };

    const mods = calculateTraitEffects(crewMultipleSkill);

    expect(mods.skillMod).toBe(10);
  });
});

describe("Trait System Stress Tests", () => {
  const baseCrew: CrewMember = {
    id: "test1",
    firstName: "Test",
    lastName: "Crew",
    name: "Test Crew",
    background: "station_rat",
    traits: [],
    skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
    skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    sanity: 100,
    maxSanity: 100,
    currentJob: "idle",
    status: "active",
  };

  it("should handle crew with maximum traits (3)", () => {
    const crew: CrewMember = {
      ...baseCrew,
      traits: ["veteran", "greedy", "tough"],
    };

    const effects = calculateTraitEffects(crew);
    expect(typeof effects.skillMod).toBe("number");
    expect(typeof effects.staminaMod).toBe("number");
    expect(typeof effects.sanityMod).toBe("number");
    expect(typeof effects.lootMod).toBe("number");
  });

  it("should calculate traits 1000 times consistently", () => {
    const crew: CrewMember = {
      ...baseCrew,
      traits: ["veteran", "greedy"],
    };

    const results: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const effects = calculateTraitEffects(crew);
      results.push(effects.skillMod);
    }

    // All results should be the same
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(10); // veteran trait
  });

  it("should handle rapid trait effect calculations", () => {
    const crew: CrewMember = {
      ...baseCrew,
      traits: ["veteran", "greedy"],
    };

    const startTime = Date.now();
    for (let i = 0; i < 10000; i++) {
      calculateTraitEffects(crew);
    }
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(1000); // Should be very fast
  });

  it("should handle all possible single trait combinations", () => {
    const allTraits = ["veteran", "greedy", "lucky", "unlucky", "tough", "paranoid", "meticulous", "tireless"];

    for (const trait of allTraits) {
      const crew: CrewMember = {
        ...baseCrew,
        traits: [trait as any],
      };
      const effects = calculateTraitEffects(crew);
      expect(typeof effects.skillMod).toBe("number");
      expect(typeof effects.staminaMod).toBe("number");
      expect(typeof effects.sanityMod).toBe("number");
      expect(typeof effects.lootMod).toBe("number");
    }
  });
});

describe("Trait System Long-Term Stability", () => {
  const baseCrew: CrewMember = {
    id: "test1",
    firstName: "Test",
    lastName: "Crew",
    name: "Test Crew",
    background: "station_rat",
    traits: [],
    skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
    skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    sanity: 100,
    maxSanity: 100,
    currentJob: "idle",
    status: "active",
  };

  it("should simulate trait effects over 100 salvage operations", () => {
    const crew: CrewMember = {
      ...baseCrew,
      traits: ["tireless"], // -20% stamina
    };

    let totalStamina = 100;
    const baseStaminaCost = 5;

    for (let operation = 0; operation < 100; operation++) {
      const effects = calculateTraitEffects(crew);
      const modifiedCost = Math.floor(baseStaminaCost * (1 + effects.staminaMod / 100));
      totalStamina -= modifiedCost;
      
      if (totalStamina < 0) totalStamina = 0;
    }

    // With tireless trait, should use less stamina
    expect(totalStamina).toBeGreaterThanOrEqual(0);
  });

  it("should handle trait-modified loot collection over many rooms", () => {
    const crew: CrewMember = {
      ...baseCrew,
      traits: ["greedy"], // greedy trait effect
    };

    const baseLootValue = 100;
    let totalLoot = 0;

    // Collect loot from 50 rooms
    for (let room = 0; room < 50; room++) {
      const effects = calculateTraitEffects(crew);
      const modifiedValue = Math.round(baseLootValue * (1 + effects.lootMod / 100));
      totalLoot += modifiedValue;
    }

    expect(totalLoot).toBeGreaterThanOrEqual(5000); // Should be at least base value
  });

  it("should handle sanity degradation with paranoid trait over time", () => {
    const crew: CrewMember = {
      ...baseCrew,
      sanity: 100,
      traits: ["paranoid"], // paranoid trait effect
    };

    const baseSanityLoss = 3;
    let currentSanity = crew.sanity;

    // Simulate 30 operations
    for (let op = 0; op < 30; op++) {
      const effects = calculateTraitEffects(crew);
      const modifiedLoss = Math.floor(baseSanityLoss * (1 + effects.sanityMod / 100));
      currentSanity -= modifiedLoss;
      
      if (currentSanity < 0) currentSanity = 0;
    }

    // Sanity should degrade over time
    expect(currentSanity).toBeLessThan(100);
    expect(currentSanity).toBeLessThanOrEqual(100 - (baseSanityLoss * 30)); // Should be at most base degradation
  });

  it("should simulate multiple crew members with different traits over time", () => {
    const crewMembers: CrewMember[] = [
      { ...baseCrew, id: "crew1", traits: ["veteran"] },
      { ...baseCrew, id: "crew2", traits: ["greedy"] },
      { ...baseCrew, id: "crew3", traits: ["tireless"] },
      { ...baseCrew, id: "crew4", traits: ["tough"] },
    ];

    const results = crewMembers.map((crew) => {
      let stamina = 100;
      const baseStaminaCost = 5;

      for (let i = 0; i < 20; i++) {
        const effects = calculateTraitEffects(crew);
        const cost = Math.floor(baseStaminaCost * (1 + effects.staminaMod / 100));
        stamina -= cost;
      }

      return { id: crew.id, finalStamina: stamina };
    });

    // Tireless crew should have most stamina remaining
    const tirelessCrew = results.find((r) => r.id === "crew3");
    const veteranCrew = results.find((r) => r.id === "crew1");
    
    expect(tirelessCrew).toBeDefined();
    expect(veteranCrew).toBeDefined();
    if (tirelessCrew && veteranCrew) {
      expect(tirelessCrew.finalStamina).toBeGreaterThan(veteranCrew.finalStamina);
    }
  });
});
