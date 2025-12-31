import type { Wreck, Room, Loot, WreckType, WreckMass, GraveyardZone } from '../types';
import { TIER_ROOM_BASE } from './constants';
import { SeededRandom } from './random';
import { getLootPool, generateLoot } from './lootTables';
import { ZONES } from '../types';
import { FUEL_COST_PER_AU } from './constants';
import { Ship } from './ship';

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

export function generateEstimatedMass(rnd: SeededRandom, rooms: Room[]): WreckMass {
  const roomCount = rooms.length;
  let base: WreckMass;
  if (roomCount <= 3) base = 'small' as WreckMass;
  else if (roomCount <= 5) base = 'medium' as WreckMass;
  else if (roomCount <= 7) base = 'large' as WreckMass;
  else base = 'massive' as WreckMass;

  // 70% accurate, 30% misleading
  if (rnd.nextFloat() < 0.7) return base as WreckMass;

  const all: WreckMass[] = ['small', 'medium', 'large', 'massive'] as WreckMass[];
  const others = all.filter((m) => m !== base);
  return others[rnd.nextInt(0, others.length - 1)] as WreckMass;
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

  const id = `wreck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // estimate mass based on rooms and create a spatial Ship grid
  const estimatedMass = generateEstimatedMass(rnd, rooms);
  const ship = Ship.fromMass(id, estimatedMass, 'Unknown Vessel');

  // map generated rooms into grid cells (row-major)
  let k = 0;
  for (let y = 0; y < ship.height; y++) {
    for (let x = 0; x < ship.width; x++) {
      if (k < rooms.length) {
        const src = rooms[k++];
        const cell = ship.grid[y][x];
        cell.id = src.id;
        cell.name = src.name;
        cell.hazardLevel = src.hazardLevel;
        cell.hazardType = src.hazardType;
        cell.loot = src.loot;
        cell.looted = src.looted;
      }
    }
  }

  // Ensure entryPosition points to a mapped room (not a sealed/empty cell)
  const entryRoom = ship.grid[ship.entryPosition.y][ship.entryPosition.x];
  const entryIsMapped = rooms.some((r) => r.id === entryRoom.id);
  if (!entryIsMapped) {
    // Entry landed on unmapped cell, use first mapped room instead
    const firstMapped = ship.grid.flat().find((cell) => rooms.some((r) => r.id === cell.id));
    if (firstMapped) {
      ship.entryPosition = firstMapped.position;
    }
  }

  return {
    id,
    name: `Unknown Vessel`, // reveal on arrival
    type,
    tier,
    distance,
    rooms,
    ship,
    stripped: false,
  };
}

export function getZoneForDistance(distance: number): GraveyardZone {
  if (distance >= ZONES.deep.distanceRange[0]) return 'deep';
  if (distance >= ZONES.mid.distanceRange[0]) return 'mid';
  return 'near';
}

export function getWreckPreview(wreck: Wreck) {
  const rnd = new SeededRandom(wreck.id);
  const estimatedMass = generateEstimatedMass(rnd, wreck.rooms);
  const fuelCost = Math.max(1, Math.ceil(wreck.distance * FUEL_COST_PER_AU));
  return {
    id: wreck.id,
    distance: wreck.distance,
    estimatedMass,
    fuelCost,
    zone: getZoneForDistance(wreck.distance),
  };
}

// Async helper to populate wreck names using WASM (if available)
import { wasmBridge } from './wasm/WasmBridge';

export async function populateWreckNames(wrecks: Wreck[]) {
  await wasmBridge.init();
  const results = await Promise.all(wrecks.map(async (w) => {
    try {
      const name = await wasmBridge.generateShipName(w.id);
      const newW = { ...w, name };
      if ((newW as any).ship) {
        (newW as any).ship.name = name;
      }
      return newW;
    } catch (e) {
      return w;
    }
  }));
  return results;
}

export function generateAvailableWrecks(unlockedZones: GraveyardZone[], seed?: string): Wreck[] {
  const rnd = new SeededRandom(seed ?? Date.now());
  const types: WreckType[] = ['military', 'science', 'industrial', 'civilian'];
  const wrecks: Wreck[] = [];

  unlockedZones.forEach((zone) => {
    const cfg = ZONES[zone];
    const count = rnd.nextInt(2, 3);
    for (let i = 0; i < count; i++) {
      const distance = parseFloat((rnd.nextFloat(cfg.distanceRange[0], cfg.distanceRange[1])).toFixed(1));
      // pick tier within cfg.tierRange, with slight variance
      let tier = rnd.nextInt(cfg.tierRange[0], cfg.tierRange[1]);
      if (rnd.nextFloat() < 0.3) tier = Math.max(1, tier - 1);
      else if (rnd.nextFloat() > 0.7) tier = Math.min(5, tier + 1);

      let type: WreckType | 'luxury' = types[rnd.nextInt(0, types.length - 1)];
      if (rnd.nextFloat() < cfg.luxuryChance) type = 'luxury';

      const roomsCount = TIER_ROOM_BASE + tier;
      const hazardFloor = Math.max(0, tier - 1);
      const rooms: Room[] = Array.from({ length: roomsCount }, () => generateRoom(rnd, type as WreckType, hazardFloor));
      const id = `wreck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const estimatedMass = generateEstimatedMass(rnd, rooms);
      const ship = Ship.fromMass(id, estimatedMass, 'Unknown Vessel');

      // map generated rooms into ship grid cells
      let k = 0;
      for (let y = 0; y < ship.height; y++) {
        for (let x = 0; x < ship.width; x++) {
          if (k < rooms.length) {
            const src = rooms[k++];
            const cell = ship.grid[y][x];
            cell.id = src.id;
            cell.name = src.name;
            cell.hazardLevel = src.hazardLevel;
            cell.hazardType = src.hazardType;
            cell.loot = src.loot;
            cell.looted = src.looted;
          }
        }
      }

      wrecks.push({
        id,
        name: `Unknown Vessel`,
        type: type as WreckType,
        tier,
        distance,
        rooms,
        ship,
        stripped: false,
      });
    }
  });

  return wrecks;
}
