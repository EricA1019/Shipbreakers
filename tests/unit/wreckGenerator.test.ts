import { describe, it, expect } from 'vitest';
import { generateWreck } from '../../src/game/wreckGenerator';

describe('wreckGenerator', () => {
  it('generates wreck with valid fields', () => {
    const w = generateWreck('seed1');
    expect(w.id).toBeDefined();
    expect(w.name).toBeDefined();
    expect(w.distance).toBeGreaterThanOrEqual(1);
    expect(w.distance).toBeLessThanOrEqual(4);
    expect(w.type).toBeDefined();
    expect(w.tier).toBeGreaterThanOrEqual(1);
    expect(w.rooms.length).toBeGreaterThanOrEqual(4); // base + tier (min 1) = 4
  });

  it('is deterministic with seed', () => {
    const a = generateWreck('same-seed');
    const b = generateWreck('same-seed');
    expect(a.tier).toBe(b.tier);
    expect(a.type).toBe(b.type);
    expect(a.rooms.length).toBe(b.rooms.length);
  });
});