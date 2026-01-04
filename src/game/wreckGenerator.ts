import type {
  Wreck,
  Room,
  Loot,
  WreckType,
  WreckMass,
  GraveyardZone,
} from "../types";
import { TIER_ROOM_BASE } from "./constants";
import { SeededRandom } from "./random";
import { getLootPool, generateLoot } from "./lootTables";
import { getAllEquipment } from "./data/equipment";
import { EQUIPMENT_DROP_RATE } from "./constants";
import { ZONES } from "../types";
import { FUEL_COST_PER_AU } from "./constants";
import { Ship } from "./ship";

let idCounter = 1;

function pick<T>(rnd: SeededRandom, arr: T[]) {
  return arr[rnd.nextInt(0, arr.length - 1)];
}

const ROOM_POOLS: Record<WreckType | "luxury", string[]> = {
  military: ["Armory", "Weapons Bay", "Barracks", "Barricade", "Bridge"],
  science: [
    "Laboratory",
    "Data Center",
    "Med Bay",
    "Observation Deck",
    "Cryo Lab",
  ],
  industrial: [
    "Engine Room",
    "Cargo Hold",
    "Reactor Core",
    "Maintenance Bay",
    "Freight Bay",
  ],
  civilian: [
    "Crew Quarters",
    "Bridge",
    "Life Support",
    "Mess Hall",
    "Cargo Hold",
  ],
  luxury: ["Grand Salon", "Private Suite", "Vault", "Spa", "Dining Hall"],
};

const HAZARD_WEIGHTS: Record<
  WreckType | "luxury",
  {
    mechanical: number;
    combat: number;
    environmental: number;
    security: number;
  }
> = {
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

export function generateRoom(
  rnd: SeededRandom,
  wreckType: WreckType,
  tier: number,
  usedNames: Set<string> = new Set(),
): Room {
  const numLoot = rnd.nextInt(1, 3);
  const lootPool = getLootPool(wreckType, tier).universal.concat(
    getLootPool(wreckType, tier).specific,
  );
  const loot: Loot[] = Array.from({ length: numLoot }, () => {
    const template = pick(rnd, lootPool);
    return generateLoot(template, tier);
  });

  // Equipment drop
  let equipment = null;
  if (rnd.nextFloat() < EQUIPMENT_DROP_RATE) {
    const all = getAllEquipment();
    const chosen = all[rnd.nextInt(0, all.length - 1)];
    equipment = chosen;
  }

  // Select unique room name
  let roomName: string;
  const availableNames = ROOM_POOLS[wreckType].filter(
    (name) => !usedNames.has(name),
  );

  if (availableNames.length > 0) {
    // Pick from unused names
    roomName = pick(rnd, availableNames);
  } else {
    // All names used, add number suffix to base name
    const baseName = pick(rnd, ROOM_POOLS[wreckType]);
    let counter = 2;
    while (usedNames.has(`${baseName} ${counter}`)) {
      counter++;
    }
    roomName = `${baseName} ${counter}`;
  }

  usedNames.add(roomName);

  // 20% chance to seal a room (higher tier = more sealed rooms)
  const sealChance = Math.min(0.4, 0.1 + tier * 0.05);
  const sealed = rnd.nextFloat() < sealChance;

  return {
    id: `room_${idCounter++}`,
    name: roomName,
    hazardLevel: Math.max(tier, rnd.nextInt(tier, Math.min(4, tier + 2))),
    hazardType: pickHazardType(rnd, wreckType),
    loot,
    looted: false,
    equipment,
    sealed,
  };
}

export function generateEstimatedMass(
  rnd: SeededRandom,
  rooms: Room[],
): WreckMass {
  const roomCount = rooms.length;
  let base: WreckMass;
  if (roomCount <= 3) base = "small" as WreckMass;
  else if (roomCount <= 5) base = "medium" as WreckMass;
  else if (roomCount <= 7) base = "large" as WreckMass;
  else base = "massive" as WreckMass;

  // 70% accurate, 30% misleading
  if (rnd.nextFloat() < 0.7) return base as WreckMass;

  const all: WreckMass[] = [
    "small",
    "medium",
    "large",
    "massive",
  ] as WreckMass[];
  const others = all.filter((m) => m !== base);
  return others[rnd.nextInt(0, others.length - 1)] as WreckMass;
}

export function generateWreck(seed?: string): Wreck {
  const rnd = new SeededRandom(seed ?? Date.now());
  const distance = parseFloat(rnd.nextFloat(1, 4).toFixed(1)); // 1.0 - 4.0 AU
  let baseTier = Math.floor(distance);
  if (baseTier < 1) baseTier = 1;
  // ±1 variance with 30% chance
  const varianceRoll = rnd.nextFloat();
  let tier = baseTier;
  if (varianceRoll < 0.3) tier = Math.max(1, baseTier - 1);
  else if (varianceRoll > 0.7) tier = Math.min(5, baseTier + 1);

  // choose wreck type
  const types: WreckType[] = ["military", "science", "industrial", "civilian"];
  const type = pick(rnd, types);

  const id = `wreck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Estimated mass is intentionally approximate and based on tier-driven expected room count.
  const estimatedRoomsCount = TIER_ROOM_BASE + tier;
  const estimatedMass = generateEstimatedMass(
    rnd,
    Array.from({ length: estimatedRoomsCount }, () => ({}) as Room),
  );

  // Generate procedural ship layout synchronously for immediate display
  // Randomly select a layout shape regardless of ship type
  const LAYOUT_TEMPLATES = [
    "L-military",
    "Cross-science",
    "U-industrial",
    "H-luxury",
    "T-freighter"
  ];
  const layoutTemplate = pick(rnd, LAYOUT_TEMPLATES);

  // Ensure physical ship size accommodates the layout
  const MASS_ORDER: WreckMass[] = ["small", "medium", "large", "massive"];
  let minMass: WreckMass = "small";
  
  if (layoutTemplate === "T-freighter") minMass = "medium";
  else if (["Cross-science", "U-industrial", "H-luxury"].includes(layoutTemplate)) minMass = "large";
  
  const estimatedIdx = MASS_ORDER.indexOf(estimatedMass);
  const minIdx = MASS_ORDER.indexOf(minMass);
  const physicalMass = estimatedIdx >= minIdx ? estimatedMass : minMass;

  const ship = Ship.fromMass(id, physicalMass, "Unknown Vessel");

  // Use synchronous generation for immediate availability
  ship.layout = wasmBridge.generateShipLayoutSync(id, layoutTemplate);
  
  // Regenerate doors to respect the layout shape instead of rectangular grid
  ship.regenerateDoorsForLayout(ship.layout);

  // Generate rooms to match the physical layout footprint (1:1).
  const roomsCount = ship.layout.rooms.length;
  const hazardFloor = Math.max(0, tier - 1);

  // Track used room names to avoid duplicates
  const usedNames = new Set<string>();
  const rooms: Room[] = Array.from({ length: roomsCount }, () =>
    generateRoom(rnd, type, hazardFloor, usedNames),
  );

  // map generated rooms into ship grid cells - now using layout positions
  for (const layoutRoom of ship.layout.rooms) {
    const src = rooms.find(r => {
      // Match by index in the room list based on layout order
      const idx = ship.layout!.rooms.indexOf(layoutRoom);
      return rooms.indexOf(r) === idx;
    }) || rooms[ship.layout.rooms.indexOf(layoutRoom)];
    
    if (src && layoutRoom.x < ship.width && layoutRoom.y < ship.height) {
      const cell = ship.grid[layoutRoom.y][layoutRoom.x];
      cell.id = src.id;
      cell.name = src.name;
      cell.hazardLevel = src.hazardLevel;
      cell.hazardType = src.hazardType;
      cell.loot = src.loot;
      cell.looted = src.looted;
      cell.equipment = src.equipment;
      
      // Ensure entry room is NEVER sealed
      const isEntry = layoutRoom.x === ship.entryPosition.x && layoutRoom.y === ship.entryPosition.y;
      if (isEntry) {
        src.sealed = false;
      }
      cell.sealed = src.sealed;
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
  if (distance >= ZONES.deep.distanceRange[0]) return "deep";
  if (distance >= ZONES.mid.distanceRange[0]) return "mid";
  return "near";
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
import { wasmBridge } from "./wasm/WasmBridge";

export async function populateWreckNames(wrecks: Wreck[]) {
  await wasmBridge.init();
  const results = await Promise.all(
    wrecks.map(async (w) => {
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
    }),
  );
  return results;
}

export function generateAvailableWrecks(
  unlockedZones: GraveyardZone[],
  seed?: string,
): Wreck[] {
  const rnd = new SeededRandom(seed ?? Date.now());
  const types: WreckType[] = ["military", "science", "industrial", "civilian"];
  const wrecks: Wreck[] = [];

  unlockedZones.forEach((zone) => {
    const cfg = ZONES[zone];
    const count = rnd.nextInt(2, 3);
    for (let i = 0; i < count; i++) {
      const distance = parseFloat(
        rnd.nextFloat(cfg.distanceRange[0], cfg.distanceRange[1]).toFixed(1),
      );
      // pick tier within cfg.tierRange, with slight variance
      let tier = rnd.nextInt(cfg.tierRange[0], cfg.tierRange[1]);
      if (rnd.nextFloat() < 0.3) tier = Math.max(1, tier - 1);
      else if (rnd.nextFloat() > 0.7) tier = Math.min(5, tier + 1);

      let type: WreckType | "luxury" = types[rnd.nextInt(0, types.length - 1)];
      if (rnd.nextFloat() < cfg.luxuryChance) type = "luxury";

      const roomsCount = TIER_ROOM_BASE + tier;
      const hazardFloor = Math.max(0, tier - 1);
      const rooms: Room[] = Array.from({ length: roomsCount }, () =>
        generateRoom(rnd, type as WreckType, hazardFloor),
      );
      const id = `wreck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const estimatedMass = generateEstimatedMass(rnd, rooms);

      // Generate procedural ship layout synchronously for immediate display
      // Randomly select a layout shape regardless of ship type
      const LAYOUT_TEMPLATES = [
        "L-military",
        "Cross-science",
        "U-industrial",
        "H-luxury",
        "T-freighter"
      ];
      const layoutTemplate = pick(rnd, LAYOUT_TEMPLATES);

      // Ensure physical ship size accommodates the layout
      const MASS_ORDER: WreckMass[] = ["small", "medium", "large", "massive"];
      let minMass: WreckMass = "small";
      
      if (layoutTemplate === "T-freighter") minMass = "medium";
      else if (["Cross-science", "U-industrial", "H-luxury"].includes(layoutTemplate)) minMass = "large";
      
      const estimatedIdx = MASS_ORDER.indexOf(estimatedMass);
      const minIdx = MASS_ORDER.indexOf(minMass);
      const physicalMass = estimatedIdx >= minIdx ? estimatedMass : minMass;

      const ship = Ship.fromMass(id, physicalMass, "Unknown Vessel");

      // Use synchronous generation for immediate availability
      ship.layout = wasmBridge.generateShipLayoutSync(id, layoutTemplate);
      
      // Regenerate doors to respect the layout shape instead of rectangular grid
      ship.regenerateDoorsForLayout(ship.layout);

      // map generated rooms into ship grid cells - now using layout positions
      for (const layoutRoom of ship.layout.rooms) {
        const src = rooms.find(r => {
          // Match by index in the room list based on layout order
          const idx = ship.layout!.rooms.indexOf(layoutRoom);
          return rooms.indexOf(r) === idx;
        }) || rooms[ship.layout.rooms.indexOf(layoutRoom)];
        
        if (src && layoutRoom.x < ship.width && layoutRoom.y < ship.height) {
          const cell = ship.grid[layoutRoom.y][layoutRoom.x];
          cell.id = src.id;
          cell.name = src.name;
          cell.hazardLevel = src.hazardLevel;
          cell.hazardType = src.hazardType;
          cell.loot = src.loot;
          cell.looted = src.looted;
          cell.equipment = src.equipment;
          
          // Ensure entry room is NEVER sealed
          const isEntry = layoutRoom.x === ship.entryPosition.x && layoutRoom.y === ship.entryPosition.y;
          if (isEntry) {
            src.sealed = false;
          }
          cell.sealed = src.sealed;
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
