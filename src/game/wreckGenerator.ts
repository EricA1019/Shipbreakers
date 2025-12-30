import type { Wreck, Room, Loot } from '../types';
import { LOOT_MIN, LOOT_MAX } from './constants';

let idCounter = 1;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const roomNames = [
  'Bridge',
  'Cargo Hold A',
  'Cargo Hold B',
  'Engine Room',
  'Med Bay',
  'Crew Quarters',
  'Reactor Core',
  'Weapons Bay',
  'Life Support',
];

const lootNames = [
  'Scrap Metal',
  'Data Core',
  'Reactor Part',
  'Experimental Chip',
  'Military-grade Alloy',
  'Luxury Artifact',
];

export function generateLoot(): Loot {
  return {
    id: `loot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: pick(lootNames),
    value: randInt(LOOT_MIN, LOOT_MAX),
  };
}

export function generateRoom(): Room {
  const numLoot = randInt(1, 3);
  const loot: Loot[] = Array.from({ length: numLoot }, () => generateLoot());
  return {
    id: `room_${idCounter++}`,
    name: pick(roomNames),
    hazardLevel: randInt(0, 4),
    loot,
    looted: false,
  };
}

export function generateWreck(): Wreck {
  const roomsCount = randInt(3, 6);
  return {
    id: `wreck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: `Wreck ${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    distance: parseFloat((Math.random() * 3 + 1).toFixed(1)), // 1.0 - 4.0 AU
    rooms: Array.from({ length: roomsCount }, () => generateRoom()),
    stripped: false,
  };
}
