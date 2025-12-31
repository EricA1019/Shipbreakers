import type { Wreck, Room, Loot, WreckType } from '../types';
import { TIER_ROOM_BASE } from './constants';
import { SeededRandom } from './random';
import { getLootPool, generateLoot } from './lootTables';

let idCounter = 1;

function pick<T>(rnd: SeededRandom, arr: T[]) {
  return arr[rnd.nextInt(0, arr.length - 1)];
}

const ROOM_POOLS: Record<WreckType | 'luxury', string[]> = {
  military: ['Armory', 'Weapons Bay', 'Barracks', 'Barricade', 'Bridge'],
  science: ['Laboratory', 'Data Center', 'Med Bay', 'Observation Deck', 'Cryo Lab'],
  industrial: ['Engine Room', 'Cargo Hold', 'Reactor Core', 'Maintenance Bay', 'Freight Bay'],
  civilian: ['Crew Quarters', 'Bridge', 'Life Support', 'Mess Hall', 'Cargo Hold'],
  luxury: ['Grand Salon', 'Private Suite', 'Vault', 'Spa', 'Dining Hall'],
};

const HAZARD_WEIGHTS: Record<WreckType | 'luxury', { mechanical: number; combat: number; environmental: number; security: number }> = {
  military: { mechanical: 15, combat: 60, environmental: 10, security: 15 },
  science: { mechanical: 20, combat: 10, environmental: 40, security: 30 },
  industrial: { mechanical: 55, combat: 10, environmental: 30, security: 5 },
  civilian: { mechanical: 35, combat: 10, environmental: 35, security: 20 },
  luxury: { mechanical: 20, combat: 5, environmental: 20, security: 55 },
};

function pickHazardType(rnd: SeededRandom, wreckType: WreckType) {
  const w = HAZARD_WEIGHTS[wreckType];
  const pool: string[] = [];
  Object.entries(w).forEach(([k, v]) => {
    for (let i = 0; i < v; i++) pool.push(k);
  });
  return pool[rnd.nextInt(0, pool.length - 1)] as any;
}

export function generateRoom(rnd: SeededRandom, wreckType: WreckType, tier: number): Room {
  const numLoot = rnd.nextInt(1, 3);
  const lootPool = getLootPool(wreckType, tier).universal.concat(getLootPool(wreckType, tier).specific);
  const loot: Loot[] = Array.from({ length: numLoot }, () => {
    const template = pick(rnd, lootPool);
    return generateLoot(template, tier);
  });
  return {
    id: `room_${idCounter++}`,
    name: pick(rnd, ROOM_POOLS[wreckType]),
    hazardLevel: Math.max(tier, rnd.nextInt(tier, Math.min(4, tier + 2))),
    hazardType: pickHazardType(rnd, wreckType),
    loot,
    looted: false,
  };
}

export function generateWreck(seed?: string): Wreck {
  const rnd = new SeededRandom(seed ?? Date.now());
  const distance = parseFloat((rnd.nextFloat(1, 4)).toFixed(1)); // 1.0 - 4.0 AU
  let baseTier = Math.floor(distance);
  if (baseTier < 1) baseTier = 1;
  // ±1 variance with 30% chance
  const varianceRoll = rnd.nextFloat();
  let tier = baseTier;
  if (varianceRoll < 0.3) tier = Math.max(1, baseTier - 1);
  else if (varianceRoll > 0.7) tier = Math.min(5, baseTier + 1);

  // choose wreck type
  const types: WreckType[] = ['military', 'science', 'industrial', 'civilian'];
  const type = pick(rnd, types);

  const roomsCount = TIER_ROOM_BASE + tier;
  const hazardFloor = Math.max(0, tier - 1);

  const rooms: Room[] = Array.from({ length: roomsCount }, () => generateRoom(rnd, type, hazardFloor));

  return {
    id: `wreck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: `Wreck ${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    type,
    tier,
    distance,
    rooms,
    stripped: false,
  };
}
