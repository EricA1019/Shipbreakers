import type { CrewMember, Ship } from "../../types";
import { bfsRoomPath, getOccupiedPositionSet, getRoomAtPosition, getRoomById } from "../shipTopology";

export interface CrewMovement {
  path: string[];
  stepIndex: number;
  progress: number; // 0..1 between path[stepIndex] -> path[stepIndex+1]
  speedRoomsPerSecond: number;
}

function pickRandomRoomId(ship: Ship, excludeRoomId: string): string | null {
  const occupied = getOccupiedPositionSet(ship);
  const rooms = ship.grid
    .flat()
    .filter((r) => !!r && occupied.has(`${r.position.x},${r.position.y}`))
    .map((r) => (r as NonNullable<typeof r>).id)
    .filter((id) => id !== excludeRoomId);

  if (rooms.length === 0) return null;
  return rooms[Math.floor(Math.random() * rooms.length)] ?? null;
}

function getEntryRoomId(ship: Ship): string | null {
  const entry = getRoomAtPosition(ship, ship.entryPosition);
  return entry?.id ?? null;
}

export function tickCrewMovementOnShip(
  ship: Ship,
  crew: CrewMember,
  dtMs: number,
  opts?: { allowWander?: boolean },
): CrewMember {
  if (!crew.position || (crew.position.location !== "ship" && crew.position.location !== "wreck")) {
    return crew;
  }

  const allowWander = opts?.allowWander ?? true;
  const dt = Math.max(0, dtMs) / 1000;

  let roomId = crew.position.roomId;
  if (!roomId) {
    roomId = getEntryRoomId(ship) ?? roomId;
  }

  if (!roomId) return crew;

  // If crew is already in a room, ensure it's valid.
  if (!getRoomById(ship, roomId)) {
    const entryId = getEntryRoomId(ship);
    if (!entryId) return crew;
    roomId = entryId;
  }

  const movement = crew.movement;
  if (movement && movement.path.length >= 2 && movement.stepIndex < movement.path.length - 1) {
    // If we got desynced (e.g. teleport), reset.
    if (movement.path[movement.stepIndex] !== roomId) {
      return {
        ...crew,
        position: { ...crew.position, roomId },
        movement: undefined,
      };
    }

    const nextProgress = movement.progress + dt * movement.speedRoomsPerSecond;
    if (nextProgress < 1) {
      return {
        ...crew,
        position: { ...crew.position, roomId },
        movement: { ...movement, progress: nextProgress },
      };
    }

    const nextRoomId = movement.path[movement.stepIndex + 1];
    const nextStepIndex = movement.stepIndex + 1;

    if (nextStepIndex >= movement.path.length - 1) {
      return {
        ...crew,
        position: { ...crew.position, roomId: nextRoomId },
        movement: undefined,
      };
    }

    return {
      ...crew,
      position: { ...crew.position, roomId: nextRoomId },
      movement: { ...movement, stepIndex: nextStepIndex, progress: 0 },
    };
  }

  // No active movement
  if (!allowWander) {
    return { ...crew, position: { ...crew.position, roomId }, movement: undefined };
  }

  // Only wander when idle (keeps “working” crew stable)
  if (crew.currentJob !== "idle") {
    return { ...crew, position: { ...crew.position, roomId }, movement: undefined };
  }

  const goalRoomId = pickRandomRoomId(ship, roomId);
  if (!goalRoomId) {
    return { ...crew, position: { ...crew.position, roomId }, movement: undefined };
  }

  const path = bfsRoomPath(ship, roomId, goalRoomId);
  if (!path || path.length < 2) {
    return { ...crew, position: { ...crew.position, roomId }, movement: undefined };
  }

  const newMovement: CrewMovement = {
    path,
    stepIndex: 0,
    progress: 0,
    speedRoomsPerSecond: 1.2,
  };

  return {
    ...crew,
    position: { ...crew.position, roomId },
    movement: newMovement,
  };
}
