import { describe, it, expect } from 'vitest';
import { generateWreck } from '../../src/game/wreckGenerator';

describe('wreckGenerator', () => {
  it('generates wreck with valid fields', () => {
    const w = generateWreck();
    expect(w.id).toBeDefined();
    expect(w.name).toBeDefined();
    expect(w.distance).toBeGreaterThanOrEqual(1);
    expect(w.distance).toBeLessThanOrEqual(4);
    expect(w.rooms.length).toBeGreaterThanOrEqual(3);
  });
});