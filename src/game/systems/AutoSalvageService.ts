import type { CrewMember, GridRoom, Ship } from "../../types";

export interface AutoAssignment {
  crewId: string;
  roomId: string;
}

export function getAssignableRooms(ship: Ship): GridRoom[] {
  return ship.grid.flat().filter((r): r is GridRoom => !!r && !r.sealed && !r.looted);
}

export function validateAssignments(
  ship: Ship,
  crewRoster: CrewMember[],
  assignments: AutoAssignment[],
): AutoAssignment[] {
  const validRoomIds = new Set(ship.grid.flat().filter((r): r is GridRoom => !!r).map((r) => r.id));
  const validCrewIds = new Set(crewRoster.map((c) => c.id));
  return assignments.filter((a) => validCrewIds.has(a.crewId) && validRoomIds.has(a.roomId));
}

// Minimal heuristic: spread crew across first available rooms
export function defaultAssignments(ship: Ship, crewRoster: CrewMember[]): AutoAssignment[] {
  const rooms = getAssignableRooms(ship);
  const out: AutoAssignment[] = [];
  for (let i = 0; i < crewRoster.length; i++) {
    const room = rooms[i];
    if (!room) break;
    out.push({ crewId: crewRoster[i].id, roomId: room.id });
  }
  return out;
}
