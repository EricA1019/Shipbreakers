/**
 * CrewService Tests
 */
import { describe, it, expect } from 'vitest';
import {
  hireCrew,
  selectCrew,
  healCrew,
  takeShoreLeave,
  assignCrewToRoom,
  getCrewById,
  getActiveCrewMembers,
  canCrewWork,
} from '../../../src/services/CrewService';
import { createMockCrew, createMockStats } from '../../fixtures';
import type { HireCandidate } from '../../../src/types';

describe('CrewService', () => {
  describe('hireCrew', () => {
    it('should hire a crew member when affordable', () => {
      const state = {
        credits: 1000,
        crewRoster: [createMockCrew({ id: 'captain', isPlayer: true })],
        day: 1,
      };
      const candidate: HireCandidate = {
        name: 'New Hire',
        skills: { technical: 3, combat: 2, salvage: 4, piloting: 2 },
        cost: 500,
      };
      const result = hireCrew(state, candidate);

      expect(result.success).toBe(true);
      expect(result.updates?.credits).toBe(500);
      expect(result.updates?.crewRoster).toHaveLength(2);
    });

    it('should fail when insufficient credits', () => {
      const state = {
        credits: 100,
        crewRoster: [createMockCrew()],
        day: 1,
      };
      const candidate: HireCandidate = {
        name: 'Expensive Hire',
        skills: { technical: 5, combat: 5, salvage: 5, piloting: 5 },
        cost: 500,
      };
      const result = hireCrew(state, candidate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient credits');
    });

    it('should fail when roster is full', () => {
      const state = {
        credits: 1000,
        crewRoster: [
          createMockCrew({ id: 'c1' }),
          createMockCrew({ id: 'c2' }),
          createMockCrew({ id: 'c3' }),
          createMockCrew({ id: 'c4' }),
          createMockCrew({ id: 'c5' }),
        ],
        day: 1,
      };
      const candidate: HireCandidate = {
        name: 'Extra Hire',
        skills: { technical: 3, combat: 3, salvage: 3, piloting: 3 },
        cost: 100,
      };
      const result = hireCrew(state, candidate);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/^Crew roster full/);
    });
  });

  describe('selectCrew', () => {
    it('should select a crew member', () => {
      const state = {
        crewRoster: [
          createMockCrew({ id: 'crew-1' }),
          createMockCrew({ id: 'crew-2' }),
        ],
      };
      const result = selectCrew(state, 'crew-2');

      expect(result.success).toBe(true);
      expect(result.updates?.selectedCrewId).toBe('crew-2');
    });
  });

  describe('healCrew', () => {
    it('should heal injured crew member', () => {
      const crew = createMockCrew({ id: 'crew-1', hp: 50, maxHp: 100 });
      const state = {
        credits: 200,
        crewRoster: [crew],
        selectedCrewId: 'crew-1',
      };
      const result = healCrew(state);

      expect(result.success).toBe(true);
      expect(result.updates?.credits).toBe(150); // 200 - 50
      const healed = result.updates?.crewRoster?.[0];
      expect(healed?.hp).toBe(60); // 50 + 10
    });

    it('should fail when crew at full health', () => {
      const crew = createMockCrew({ id: 'crew-1', hp: 100, maxHp: 100 });
      const state = {
        credits: 200,
        crewRoster: [crew],
        selectedCrewId: 'crew-1',
      };
      const result = healCrew(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Crew member is already at full health');
    });

    it('should fail when insufficient credits', () => {
      const crew = createMockCrew({ id: 'crew-1', hp: 50, maxHp: 100 });
      const state = {
        credits: 10,
        crewRoster: [crew],
        selectedCrewId: 'crew-1',
      };
      const result = healCrew(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient credits');
    });

    it('should not exceed max HP', () => {
      const crew = createMockCrew({ id: 'crew-1', hp: 95, maxHp: 100 });
      const state = {
        credits: 200,
        crewRoster: [crew],
        selectedCrewId: 'crew-1',
      };
      const result = healCrew(state);

      expect(result.success).toBe(true);
      const healed = result.updates?.crewRoster?.[0];
      expect(healed?.hp).toBe(100);
    });
  });

  describe('takeShoreLeave', () => {
    it('should take rest shore leave', () => {
      const crew = createMockCrew({
        id: 'crew-1',
        stamina: 50,
        maxStamina: 100,
        sanity: 50,
        maxSanity: 100,
      });
      const state = {
        credits: 200,
        crewRoster: [crew],
        luxuryDrink: 5,
        day: 1,
        licenseDaysRemaining: 10,
        stats: createMockStats({ daysPlayed: 1 }),
        selectedCrewId: 'crew-1',
      };
      const result = takeShoreLeave(state, 'rest');

      expect(result.success).toBe(true);
      expect(result.updates?.day).toBeGreaterThan(1);
    });

    it('should fail with insufficient credits', () => {
      const state = {
        credits: 0,
        crewRoster: [createMockCrew()],
        luxuryDrink: 5,
        day: 1,
        licenseDaysRemaining: 10,
        stats: createMockStats(),
        selectedCrewId: 'crew-1',
      };
      const result = takeShoreLeave(state, 'party');

      expect(result.success).toBe(false);
    });
  });

  describe('assignCrewToRoom', () => {
    it('should assign crew to a room', () => {
      const crew = createMockCrew({ id: 'crew-1' });
      const state = {
        crewRoster: [crew],
        autoAssignments: {},
      };
      const result = assignCrewToRoom(state, 'crew-1', 'room-A');

      expect(result.success).toBe(true);
      expect(result.updates?.autoAssignments).toEqual({ 'crew-1': 'room-A' });
      const assigned = result.updates?.crewRoster?.[0];
      expect(assigned?.position?.roomId).toBe('room-A');
      expect(assigned?.currentJob).toBe('salvaging');
    });
  });

  describe('getCrewById', () => {
    it('should find crew by ID', () => {
      const roster = [
        createMockCrew({ id: 'crew-1', firstName: 'Alice' }),
        createMockCrew({ id: 'crew-2', firstName: 'Bob' }),
      ];
      const found = getCrewById(roster, 'crew-2');

      expect(found).toBeDefined();
      expect(found?.firstName).toBe('Bob');
    });

    it('should return undefined for missing ID', () => {
      const roster = [createMockCrew({ id: 'crew-1' })];
      const found = getCrewById(roster, 'nonexistent');

      expect(found).toBeUndefined();
    });
  });

  describe('getActiveCrewMembers', () => {
    it('should filter only active crew', () => {
      const roster = [
        createMockCrew({ id: 'c1', status: 'active' }),
        createMockCrew({ id: 'c2', status: 'injured' }),
        createMockCrew({ id: 'c3', status: 'active' }),
        createMockCrew({ id: 'c4', status: 'dead' }),
      ];
      const active = getActiveCrewMembers(roster);

      expect(active).toHaveLength(2);
      expect(active.map((c) => c.id)).toEqual(['c1', 'c3']);
    });
  });

  describe('canCrewWork', () => {
    const settings = { minCrewHpPercent: 50, minCrewStamina: 20, minCrewSanity: 20 };

    it('should return true when crew meets thresholds', () => {
      const crew = createMockCrew({
        hp: 60,
        maxHp: 100,
        stamina: 50,
        sanity: 50,
        status: 'active',
      });
      expect(canCrewWork(crew, settings)).toBe(true);
    });

    it('should return false when HP too low', () => {
      const crew = createMockCrew({
        hp: 40,
        maxHp: 100,
        stamina: 50,
        sanity: 50,
        status: 'active',
      });
      expect(canCrewWork(crew, settings)).toBe(false);
    });

    it('should return false when stamina too low', () => {
      const crew = createMockCrew({
        hp: 100,
        maxHp: 100,
        stamina: 10,
        sanity: 50,
        status: 'active',
      });
      expect(canCrewWork(crew, settings)).toBe(false);
    });

    it('should return false when sanity too low', () => {
      const crew = createMockCrew({
        hp: 100,
        maxHp: 100,
        stamina: 50,
        sanity: 10,
        status: 'active',
      });
      expect(canCrewWork(crew, settings)).toBe(false);
    });
  });
});
