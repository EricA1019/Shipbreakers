import type { Direction, GridPosition, GridRoom, Ship as ShipType } from "../types";
import { hasShipLayout } from "../types";

function keyForPos(pos: GridPosition): string {
  return `${pos.x},${pos.y}`;
}

function deltaForDirection(dir: Direction): GridPosition {
  switch (dir) {
    case "north":
      return { x: 0, y: -1 };
    case "south":
      return { x: 0, y: 1 };
    case "west":
      return { x: -1, y: 0 };
    case "east":
      return { x: 1, y: 0 };
  }
}

export function getOccupiedPositionSet(ship: ShipType): Set<string> {
  if (!hasShipLayout(ship)) {
    const set = new Set<string>();
    for (const room of ship.grid.flat()) {
      if (!room) continue;
      set.add(keyForPos(room.position));
    }
    return set;
  }

  const set = new Set<string>();
  for (const r of ship.layout.rooms) {
    // For now, treat each layout room as a single node at (x,y).
    // (If w/h > 1 becomes meaningful later, expand this to include the full footprint.)
    set.add(`${r.x},${r.y}`);
  }
  return set;
}

export function getRoomAtPosition(
  ship: ShipType,
  position: GridPosition,
): GridRoom | undefined {
  const room = ship.grid[position.y]?.[position.x];
  if (!room) return undefined;

  const occupied = getOccupiedPositionSet(ship);
  return occupied.has(keyForPos(room.position)) ? room : undefined;
}

export function getRoomById(ship: ShipType, roomId: string): GridRoom | undefined {
  const occupied = getOccupiedPositionSet(ship);
  for (const room of ship.grid.flat()) {
    if (!room) continue;
    if (!occupied.has(keyForPos(room.position))) continue;
    if (room.id === roomId) return room;
  }
  return undefined;
}

export function getNeighborsByRoomId(ship: ShipType, roomId: string): GridRoom[] {
  const room = getRoomById(ship, roomId);
  if (!room) return [];

  const occupied = getOccupiedPositionSet(ship);
  const neighbors: GridRoom[] = [];

  for (const dir of room.connections as Direction[]) {
    const d = deltaForDirection(dir);
    const pos = { x: room.position.x + d.x, y: room.position.y + d.y };
    const candidate = ship.grid[pos.y]?.[pos.x];
    if (!candidate) continue;
    if (!occupied.has(keyForPos(candidate.position))) continue;
    neighbors.push(candidate);
  }

  return neighbors;
}

export function bfsRoomPath(
  ship: ShipType,
  startRoomId: string,
  goalRoomId: string,
): string[] | null {
  if (startRoomId === goalRoomId) return [startRoomId];

  const start = getRoomById(ship, startRoomId);
  const goal = getRoomById(ship, goalRoomId);
  if (!start || !goal) return null;

  const queue: string[] = [startRoomId];
  const visited = new Set<string>([startRoomId]);
  const prev = new Map<string, string | null>();
  prev.set(startRoomId, null);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (currentId === goalRoomId) break;

    for (const neighbor of getNeighborsByRoomId(ship, currentId)) {
      if (visited.has(neighbor.id)) continue;
      visited.add(neighbor.id);
      prev.set(neighbor.id, currentId);
      queue.push(neighbor.id);
    }
  }

  if (!prev.has(goalRoomId)) return null;

  const path: string[] = [];
  let cur: string | null = goalRoomId;
  while (cur) {
    path.push(cur);
    cur = prev.get(cur) ?? null;
  }
  path.reverse();

  return path;
}
