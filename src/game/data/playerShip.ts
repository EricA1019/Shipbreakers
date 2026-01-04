import type {
  PlayerShip,
  PlayerShipRoom,
  PlayerRoomType,
  ItemSlot,
  SlotType,
  ShipLayout,
} from "../../types";
import { Ship } from "../ship";
import { REACTORS } from "./reactors";
import { STARTING_HP } from "../constants";

/**
 * L-shaped starter ship layout (4 rooms in an L pattern)
 * Visual representation:
 *   [BRIDGE ][ENGINE ][ empty ]
 *   [MEDBAY ][ empty ][ empty ]
 *   [CARGO  ][ empty ][ empty ]
 */
export const STARTER_SHIP_LAYOUT: ShipLayout = {
  template: "l-shaped-starter",
  rooms: [
    { x: 0, y: 0, w: 1, h: 1, kind: "bridge" },
    { x: 1, y: 0, w: 1, h: 1, kind: "engine" },
    { x: 0, y: 1, w: 1, h: 1, kind: "medbay" },
    { x: 0, y: 2, w: 1, h: 1, kind: "cargo" },
  ],
};

function getLayoutBounds(layout: ShipLayout): { width: number; height: number } {
  const maxX = Math.max(...layout.rooms.map((r) => r.x + r.w));
  const maxY = Math.max(...layout.rooms.map((r) => r.y + r.h));
  return { width: maxX, height: maxY };
}

function layoutKindToRoomType(kind: string): PlayerRoomType {
  switch (kind) {
    case "bridge":
      return "bridge";
    case "engine":
      return "engine";
    case "medbay":
      return "medbay";
    case "cargo":
      return "cargo";
    case "workshop":
      return "workshop";
    case "armory":
      return "armory";
    case "lounge":
      return "lounge";
    case "quarters":
      return "quarters";
    default:
      return "cargo";
  }
}

/**
 * Creates empty slots for a given room type
 */
export function createSlotsForRoomType(roomType: PlayerRoomType): ItemSlot[] {
  const slotConfigs: Record<PlayerRoomType, SlotType[]> = {
    bridge: ["bridge", "bridge"],
    engine: ["engineering", "engineering", "engineering"],
    medbay: ["medical", "medical"],
    cargo: ["cargo", "cargo", "cargo", "cargo"],
    workshop: ["engineering", "engineering"],
    armory: ["combat", "combat"],
    lounge: [], // crew morale room, no equipment slots
    quarters: ["bridge"], // Using bridge slot as generic 'personal' slot
  };

  const slotTypes = slotConfigs[roomType] || [];
  return slotTypes.map((type, i) => ({
    id: `${roomType}-slot-${i}`,
    type,
    installedItem: null,
  }));
}

/**
 * Initializes the player ship with proper room types and equipment slots
 * Converts generic Ship into PlayerShip with functional slot system
 */
export function initializePlayerShip(seed: string): PlayerShip {
  // The player ship uses an explicit footprint; ensure grid + rooms match the layout.
  const { width, height } = getLayoutBounds(STARTER_SHIP_LAYOUT);
  const baseShip = new Ship(seed, { width, height, name: "SS BREAKER-01" });
  baseShip.entryPosition = { x: 0, y: 0 };
  baseShip.layout = STARTER_SHIP_LAYOUT;
  baseShip.regenerateDoorsForLayout(STARTER_SHIP_LAYOUT);

  const layoutCells = new Map<string, string>();
  for (const r of STARTER_SHIP_LAYOUT.rooms) {
    for (let dy = 0; dy < r.h; dy++) {
      for (let dx = 0; dx < r.w; dx++) {
        layoutCells.set(`${r.x + dx},${r.y + dy}`, r.kind);
      }
    }
  }

  const playerGrid = baseShip.grid.map((row, y) =>
    row.map((room, x) => {
      const kind = layoutCells.get(`${x},${y}`);
      if (!kind) return undefined as any;

      const roomType = layoutKindToRoomType(kind);
      const slots = createSlotsForRoomType(roomType);

      return {
        ...room,
        roomType,
        slots,
        damage: 0, // Phase 13: Initialize damage
      } as PlayerShipRoom;
    }),
  ) as any;

  const rooms = (playerGrid as (PlayerShipRoom | undefined)[][])
    .flat()
    .filter(Boolean) as PlayerShipRoom[];

  const reactor = REACTORS["salvaged-reactor"];

  // Phase 13: Derived stats
  const cargoRooms = rooms.filter(r => r.roomType === 'cargo').length;
  const cargoCapacity = 4 + (cargoRooms * 4);

  // Track initial rooms as purchased
  const purchasedRooms = rooms.map(r => ({
    id: r.id,
    roomType: r.roomType,
    position: r.position
  }));

  return {
    ...baseShip,
    grid: playerGrid as any,
    rooms,
    layout: STARTER_SHIP_LAYOUT,
    cargoCapacity,
    cargoUsed: 0,
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    reactor,
    powerCapacity: reactor.powerOutput,
    purchasedRooms,
    gridBounds: { width: baseShip.width, height: baseShip.height },
  } as any;
}
