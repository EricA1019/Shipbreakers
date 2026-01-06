import { describe, expect, it } from 'vitest';
import { createMockCrew, createMockGameState } from '../../fixtures';
import {
  applyEventChoice,
  buildChoiceImplications,
  evaluateChoiceRequirements,
} from '../../../src/game/systems/EventManager';

describe('EventManager', () => {
  it('defaults hp target to selected crew when omitted', () => {
    const captain = createMockCrew({ id: 'captain-1', isPlayer: true, hp: 50, maxHp: 100 });
    const other = createMockCrew({ id: 'crew-2', hp: 20, maxHp: 100 });

    const state = createMockGameState({
      crewRoster: [captain, other],
      crew: captain,
      selectedCrewId: 'captain-1',
    }) as any;

    const next = applyEventChoice(
      state,
      { id: 'e1', trigger: 'hub', title: 'Test', description: 'Test', weight: 1, choices: [] } as any,
      {
        id: 'c1',
        text: 'Heal',
        effects: [{ type: 'hp', value: 10 }],
      } as any,
    ) as any;

    const updatedCaptain = next.crewRoster.find((c: any) => c.id === 'captain-1');
    const updatedOther = next.crewRoster.find((c: any) => c.id === 'crew-2');

    expect(updatedCaptain.hp).toBe(60);
    expect(updatedOther.hp).toBe(20);
  });

  it('buildChoiceImplications splits gains vs losses', () => {
    const state = createMockGameState() as any;
    const choice = {
      id: 'c1',
      text: 'Do it',
      effects: [
        { type: 'credits', value: 50 },
        { type: 'fuel', value: -2 },
      ],
    } as any;

    const impl = buildChoiceImplications(state, choice);
    expect(impl.gains).toHaveLength(1);
    expect(impl.losses).toHaveLength(1);
    expect(impl.gains[0].label).toBe('Credits');
    expect(impl.losses[0].label).toBe('Fuel');
  });

  it('evaluateChoiceRequirements blocks when credits insufficient', () => {
    const state = createMockGameState({ credits: 10 }) as any;
    const req = evaluateChoiceRequirements(state, { credits: 50 });
    expect(req.allowed).toBe(false);
    expect(req.reasons.join(' ')).toContain('Requires 50 CR');
  });
});
