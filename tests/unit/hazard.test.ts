import { describe, it, expect } from 'vitest';
import { calculateHazardSuccess, damageOnFail, calculateLootValue } from '../../src/game/hazardLogic';

const baseSkills = { technical: 2, combat: 2, salvage: 2, piloting: 2 };

describe('hazardLogic', () => {
  it('calculates success correctly for matching skill', () => {
    // technical skill 2 vs hazardLevel 0
    expect(calculateHazardSuccess({ ...baseSkills }, 'mechanical', 0, 1)).toBe(40);
    // combat skill 3 vs hazardLevel 2: skill*20 - hazard*10 = 3*20 - 2*10 = 60 - 20 = 40
    expect(calculateHazardSuccess({ ...baseSkills, combat: 3 }, 'combat', 2, 1)).toBe(40);
  });

  it('applies mismatch penalty on high tier', () => {
    // player has low matching skill for a tier 3 wreck
    expect(calculateHazardSuccess({ ...baseSkills, combat: 2 }, 'combat', 2, 3)).toBeGreaterThan(0);
    // low skill should have penalty (subtract 15)
    const withoutPenalty = 2 * 20 - 2 * 10; // 40 - 20 = 20
    expect(calculateHazardSuccess({ ...baseSkills, combat: 2 }, 'combat', 2, 3)).toBe(Math.max(0, withoutPenalty - 15));
  });

  it('calculates damage correctly', () => {
    expect(damageOnFail(1)).toBe(10);
    expect(damageOnFail(3)).toBe(30);
  });

  it('calculates loot value bonus', () => {
    expect(calculateLootValue(1000, 2)).toBe(1100);
    expect(calculateLootValue(1000, 4)).toBe(1300); // levels above 1: (4-1)*10% = 30%
  });
});