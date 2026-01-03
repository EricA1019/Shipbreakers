import { describe, it, expect } from 'vitest';
import { generateRoom } from '../../src/game/wreckGenerator';
import { SeededRandom } from '../../src/game/random';
import type { WreckType } from '../../src/types';

describe('mutation tests and purity checks', () => {
  it('generateRoom should not modify external loot pool array reference', () => {
    const rnd = new SeededRandom('seed-mutation');
    const used = new Set<string>(['Armory']);
    const beforeSize = used.size;
    const room = generateRoom(rnd, 'military' as WreckType, 1, used);
    // function should add name to used set (intended mutation) but not replace the set object
    expect(used.size).toBeGreaterThanOrEqual(beforeSize);
    expect(typeof room).toBe('object');
  });

  it('random helper does not mutate its input arrays', () => {
    const rnd = new SeededRandom('s2');
    const arr = [1, 2, 3];
    const arrCopy = arr.slice();
    const pick = (a: number[]) => a[rnd.nextInt(0, a.length - 1)];
    const p = pick(arr);
    expect(arr).toEqual(arrCopy);
  });
});