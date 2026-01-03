/**
 * SalvageService Tests
 */
import { describe, it, expect } from 'vitest';
import {
  calculateFuelCost,
  calculateTimeCost,
  calculateXpGain,
  getSkillForHazard,
  calculateSalvageChance,
  canCrewSalvage,
  getWreckStats,
  isWreckStripped,
} from '../../../src/services/SalvageService';
import { createMockCrew, createMockWreck, createMockRoom, createMockLoot, createMockSettings } from '../../fixtures';

describe('SalvageService', () => {
  describe('calculateFuelCost', () => {
    it('should calculate base fuel cost for distance', () => {
      // Base cost is ceil(distance * FUEL_COST_PER_AU (2)), minus piloting reduction
      const cost = calculateFuelCost(2, 0);
      expect(cost).toBe(4); // ceil(2 * 2) = 4
    });

    it('should reduce cost with piloting skill', () => {
      const baselineCost = calculateFuelCost(4, 0);
      const reducedCost = calculateFuelCost(4, 3);
      expect(reducedCost).toBeLessThan(baselineCost);
    });

    it('should have minimum cost of 1', () => {
      const cost = calculateFuelCost(0.5, 10); // Very short distance, high skill
      expect(cost).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateTimeCost', () => {
    it('should return appropriate cost for each rarity', () => {
      // RARITY_TIME_COST: { common: 1, uncommon: 2, rare: 3, legendary: 5 }
      expect(calculateTimeCost('common')).toBe(1);
      expect(calculateTimeCost('uncommon')).toBe(2);
      expect(calculateTimeCost('rare')).toBe(3);
      expect(calculateTimeCost('legendary')).toBe(5);
    });
  });

  describe('calculateXpGain', () => {
    it('should return more XP for success', () => {
      const successXp = calculateXpGain(3, 1, true);
      const failXp = calculateXpGain(3, 1, false);
      expect(successXp).toBeGreaterThan(failXp);
    });

    it('should scale with hazard level', () => {
      const lowXp = calculateXpGain(1, 1, true);
      const highXp = calculateXpGain(5, 1, true);
      expect(highXp).toBeGreaterThan(lowXp);
    });

    it('should scale with wreck tier', () => {
      const tier1Xp = calculateXpGain(3, 1, true);
      const tier3Xp = calculateXpGain(3, 3, true);
      expect(tier3Xp).toBeGreaterThan(tier1Xp);
    });
  });

  describe('getSkillForHazard', () => {
    it('should map mechanical to technical', () => {
      expect(getSkillForHazard('mechanical')).toBe('technical');
    });

    it('should map combat to combat', () => {
      expect(getSkillForHazard('combat')).toBe('combat');
    });

    it('should map environmental to piloting', () => {
      // Based on SKILL_HAZARD_MAP: environmental maps to piloting
      expect(getSkillForHazard('environmental')).toBe('piloting');
    });

    it('should map security to technical', () => {
      expect(getSkillForHazard('security')).toBe('technical');
    });

    it('should default to salvage for unknown types', () => {
      expect(getSkillForHazard('unknown')).toBe('salvage');
    });
  });

  describe('calculateSalvageChance', () => {
    it('should return valid percentage between 0 and 100', () => {
      const crew = createMockCrew({ skills: { technical: 5, combat: 5, salvage: 5, piloting: 5 } });
      const chance = calculateSalvageChance(crew.skills, 'mechanical', 3, 1, crew);

      expect(chance).toBeGreaterThanOrEqual(0);
      expect(chance).toBeLessThanOrEqual(100);
    });

    it('should increase with higher skill', () => {
      const lowSkill = { technical: 1, combat: 1, salvage: 1, piloting: 1 };
      const highSkill = { technical: 8, combat: 8, salvage: 8, piloting: 8 };

      const lowChance = calculateSalvageChance(lowSkill, 'mechanical', 3, 1);
      const highChance = calculateSalvageChance(highSkill, 'mechanical', 3, 1);

      expect(highChance).toBeGreaterThan(lowChance);
    });

    it('should decrease with higher hazard level', () => {
      const skills = { technical: 5, combat: 5, salvage: 5, piloting: 5 };

      const easyChance = calculateSalvageChance(skills, 'mechanical', 1, 1);
      const hardChance = calculateSalvageChance(skills, 'mechanical', 5, 1);

      expect(easyChance).toBeGreaterThan(hardChance);
    });
  });

  describe('canCrewSalvage', () => {
    const settings = createMockSettings({
      minCrewHpPercent: 50,
      minCrewStamina: 20,
      minCrewSanity: 20,
    });

    it('should return available for healthy crew', () => {
      const crew = createMockCrew({
        hp: 100,
        maxHp: 100,
        stamina: 100,
        sanity: 100,
        status: 'active',
      });
      const result = canCrewSalvage(crew, settings);

      expect(result.available).toBe(true);
    });

    it('should return unavailable when HP too low', () => {
      const crew = createMockCrew({
        hp: 30,
        maxHp: 100,
        stamina: 100,
        sanity: 100,
        status: 'active',
      });
      const result = canCrewSalvage(crew, settings);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('HP too low');
    });

    it('should return unavailable when stamina too low', () => {
      const crew = createMockCrew({
        hp: 100,
        maxHp: 100,
        stamina: 10,
        sanity: 100,
        status: 'active',
      });
      const result = canCrewSalvage(crew, settings);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Stamina too low');
    });

    it('should return unavailable when sanity too low', () => {
      const crew = createMockCrew({
        hp: 100,
        maxHp: 100,
        stamina: 100,
        sanity: 10,
        status: 'active',
      });
      const result = canCrewSalvage(crew, settings);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Sanity too low');
    });

    it('should return unavailable when crew not active', () => {
      const crew = createMockCrew({
        hp: 100,
        maxHp: 100,
        stamina: 100,
        sanity: 100,
        status: 'injured',
      });
      const result = canCrewSalvage(crew, settings);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Crew is injured');
    });
  });

  describe('getWreckStats', () => {
    it('should calculate wreck statistics', () => {
      const wreck = createMockWreck({
        rooms: [
          createMockRoom({
            id: 'r1',
            looted: true,
            loot: [createMockLoot({ value: 100 })],
          }),
          createMockRoom({
            id: 'r2',
            looted: false,
            loot: [createMockLoot({ value: 200 }), createMockLoot({ value: 150 })],
          }),
        ],
      });
      const stats = getWreckStats(wreck);

      expect(stats.totalRooms).toBe(2);
      expect(stats.lootedRooms).toBe(1);
      expect(stats.totalLoot).toBe(3);
      expect(stats.estimatedValue).toBe(450);
    });
  });

  describe('isWreckStripped', () => {
    it('should return true when all rooms looted', () => {
      const wreck = createMockWreck({
        rooms: [
          createMockRoom({ looted: true, loot: [] }),
          createMockRoom({ looted: true, loot: [] }),
        ],
      });
      expect(isWreckStripped(wreck)).toBe(true);
    });

    it('should return true when rooms have no loot', () => {
      const wreck = createMockWreck({
        rooms: [
          createMockRoom({ looted: false, loot: [] }),
        ],
      });
      expect(isWreckStripped(wreck)).toBe(true);
    });

    it('should return false when rooms have unlootedloot', () => {
      const wreck = createMockWreck({
        rooms: [
          createMockRoom({ looted: true, loot: [] }),
          createMockRoom({ looted: false, loot: [createMockLoot()] }),
        ],
      });
      expect(isWreckStripped(wreck)).toBe(false);
    });
  });
});
