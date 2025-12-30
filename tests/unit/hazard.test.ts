import { describe, it, expect } from 'vitest';
import { calculateHazardSuccess, damageOnFail } from '../../src/game/hazardLogic';

describe('hazardLogic', () => {
  it('calculates success correctly', () => {
    expect(calculateHazardSuccess(2, 0)).toBe(40);
    expect(calculateHazardSuccess(3, 2)).toBe(30);
    expect(calculateHazardSuccess(1, 5)).toBe(-30);
  });

  it('calculates damage correctly', () => {
    expect(damageOnFail(1)).toBe(10);
    expect(damageOnFail(3)).toBe(30);
  });
});