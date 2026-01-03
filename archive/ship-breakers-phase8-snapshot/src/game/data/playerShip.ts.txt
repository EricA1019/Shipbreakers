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
  };

  const slotTypes = slotConfigs[roomType];
  return slotTypes.map((type, i) => ({
    id: `${roomType}-slot-${i}`,
    type,
    installedItem: null,
  }));
}

/**
 * Assigns room types to grid positions based on ship size
 */
function assignRoomType(
  x: number,
  y: number,
  width: number,
  height: number,
): PlayerRoomType {
  // For small 2x2: [0,0]=bridge, [1,0]=engine, [0,1]=medbay, [1,1]=cargo
  // For medium 3x2: add workshop
  // For large 3x3: add armory, lounge
  // For massive 4x3: full configuration

  if (width === 2 && height === 2) {
    if (x === 0 && y === 0) return "bridge";
    if (x === 1 && y === 0) return "engine";
    if (x === 0 && y === 1) return "medbay";
    if (x === 1 && y === 1) return "cargo";
  }

  if (width === 3 && height === 2) {
    if (x === 0 && y === 0) return "bridge";
    if (x === 1 && y === 0) return "engine";
    if (x === 2 && y === 0) return "workshop";
    if (x === 0 && y === 1) return "medbay";
    if (x === 1 && y === 1) return "cargo";
    if (x === 2 && y === 1) return "armory";
  }

  if (width === 3 && height === 3) {
    if (x === 0 && y === 0) return "bridge";
    if (x === 1 && y === 0) return "engine";
    if (x === 2 && y === 0) return "workshop";
    if (x === 0 && y === 1) return "medbay";
    if (x === 1 && y === 1) return "cargo";
    if (x === 2 && y === 1) return "armory";
    if (x === 0 && y === 2) return "bridge";
    if (x === 1 && y === 2) return "lounge";
    if (x === 2 && y === 2) return "engine";
  }

  if (width === 4 && height === 3) {
    if (x === 0 && y === 0) return "bridge";
    if (x === 1 && y === 0) return "engine";
    if (x === 2 && y === 0) return "workshop";
    if (x === 3 && y === 0) return "armory";
    if (x === 0 && y === 1) return "medbay";
    if (x === 1 && y === 1) return "cargo";
    if (x === 2 && y === 1) return "cargo";
    if (x === 3 && y === 1) return "armory";
    if (x === 0 && y === 2) return "bridge";
    if (x === 1 && y === 2) return "lounge";
    if (x === 2 && y === 2) return "engine";
    if (x === 3 && y === 2) return "workshop";
  }

  return "cargo"; // fallback
}

/**
 * Initializes the player ship with proper room types and equipment slots
 * Converts generic Ship into PlayerShip with functional slot system
 */
export function initializePlayerShip(seed: string): PlayerShip {
  const baseShip = Ship.fromMass(seed, "small", "SS BREAKER-01");

  // Convert GridRoom[] to PlayerShipRoom[] with roomType and slots
  const playerGrid = baseShip.grid.map((row, y) =>
    row.map((room, x) => {
      const roomType = assignRoomType(x, y, baseShip.width, baseShip.height);
      const slots = createSlotsForRoomType(roomType);

      return {
        ...room,
        roomType,
        slots,
      } as PlayerShipRoom;
    }),
  );

  // Flatten grid to rooms array for convenient access
  const rooms = playerGrid.flat();

  const reactor = REACTORS["salvaged-reactor"];

  return {
    ...baseShip,
    grid: playerGrid as any,
    rooms,
    layout: STARTER_SHIP_LAYOUT,
    cargoCapacity: 10,
    cargoUsed: 0,
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    reactor,
    powerCapacity: reactor.powerOutput,
  } as any;
}
