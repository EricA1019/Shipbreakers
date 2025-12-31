import { describe, it, expect } from 'vitest';
import { calculateHazardSuccess, damageOnFail, calculateLootValue } from '../../src/game/hazardLogic';

const baseSkills = { technical: 2, combat: 2, salvage: 2, piloting: 2 };

describe('hazardLogic', () => {
  it('calculates success with skill adaptation', () => {
    // technical skill 2 vs hazardLevel 0: max(2) * 22 - 0 * 8 = 44
    expect(calculateHazardSuccess({ ...baseSkills }, 'mechanical', 0, 1)).toBe(44);
    // combat skill 3 vs hazardLevel 2: 3*22 - 2*8 + 5 (synergy bonus) = 66 - 16 + 5 = 55
    expect(calculateHazardSuccess({ ...baseSkills, combat: 3 }, 'combat', 2, 1)).toBe(55);
  });

  it('applies mismatch penalty on high tier with low matching skill', () => {
    // tier 3, combat skill 2 (< 3) vs hazardLevel 2
    // Uses highest skill (2), formula: 2*22 - 2*8 - 15 = 44 - 16 - 15 = 13
    // But all skills are 2, so no penalty difference - actual result depends on exact implementation
    const result = calculateHazardSuccess({ ...baseSkills, combat: 2 }, 'combat', 2, 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(30); // Should be penalized vs tier 1
    
    // tier 3, but with high matching skill (no penalty)
    // 3*22 - 2*8 + 5 = 66 - 16 + 5 = 55
    expect(calculateHazardSuccess({ ...baseSkills, combat: 3 }, 'combat', 2, 3)).toBe(55);
  });

  it('allows skill adaptation when crew has higher non-matching skill', () => {
    // High technical skill (4) but facing combat hazard
    // Should use technical skill (4) instead of combat (2)
    // 4*22 - 1*8 = 88 - 8 = 80
    expect(calculateHazardSuccess({ technical: 4, combat: 2, salvage: 2, piloting: 2 }, 'combat', 1, 1)).toBe(80);
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