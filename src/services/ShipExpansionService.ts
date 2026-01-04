import type { 
  PlayerShip, 
  PlayerRoomType, 
  GridPosition, 
  PlayerShipRoom, 
  LicenseTier
} from "../types";
import { 
  MAX_SHIP_GRID_SIZE, 
  SHIP_EXPANSION_SCALING, 
  ROOM_SELL_MULTIPLIER, 
  DAMAGE_SELL_PENALTY 
} from "../game/constants";
import { ROOM_PURCHASE_OPTIONS } from "../game/data/roomPurchases";
import { generateId } from "../utils/idGenerator";

export class ShipExpansionService {

  private static buildPlayerLayoutFromRooms(ship: PlayerShip) {
    return {
      template: "player-dynamic",
      rooms: ship.rooms.map((r) => ({
        x: r.position.x,
        y: r.position.y,
        w: 1,
        h: 1,
        kind: r.roomType,
      })),
    };
  }
  
  static calculateRoomCost(ship: PlayerShip, roomType: PlayerRoomType): number {
    const option = ROOM_PURCHASE_OPTIONS.find(o => o.roomType === roomType);
    if (!option) return 0;

    const currentRoomCount = ship.rooms.length;
    const scalingFactor = 1 + (currentRoomCount * SHIP_EXPANSION_SCALING);
    return Math.floor(option.baseCost * scalingFactor);
  }

  static canPurchaseRoom(
    ship: PlayerShip, 
    roomType: PlayerRoomType, 
    position: GridPosition, 
    credits: number,
    licenseTier: LicenseTier
  ): { success: boolean; reason?: string } {
    const option = ROOM_PURCHASE_OPTIONS.find(o => o.roomType === roomType);
    if (!option) return { success: false, reason: "Invalid room type" };

    // Check license
    const tiers: LicenseTier[] = ["basic", "standard", "premium"];
    const requiredIdx = tiers.indexOf(option.requiredLicense);
    const currentIdx = tiers.indexOf(licenseTier);
    if (currentIdx < requiredIdx) {
      return { success: false, reason: `Requires ${option.requiredLicense} license` };
    }

    // Check cost
    const cost = this.calculateRoomCost(ship, roomType);
    if (credits < cost) {
      return { success: false, reason: `Insufficient credits (Cost: ${cost})` };
    }

    // Check bounds
    if (position.x < 0 || position.x >= MAX_SHIP_GRID_SIZE.width || 
        position.y < 0 || position.y >= MAX_SHIP_GRID_SIZE.height) {
      return { success: false, reason: "Out of bounds" };
    }

    // Check overlap
    if (ship.grid[position.y]?.[position.x]) {
      return { success: false, reason: "Space occupied" };
    }

    // Check adjacency
    if (!this.validateAdjacency(ship, position)) {
      return { success: false, reason: "Must be adjacent to existing room" };
    }

    return { success: true };
  }

  static validateAdjacency(ship: PlayerShip, position: GridPosition): boolean {
    const neighbors = [
      { x: position.x, y: position.y - 1 }, // North
      { x: position.x, y: position.y + 1 }, // South
      { x: position.x - 1, y: position.y }, // West
      { x: position.x + 1, y: position.y }, // East
    ];

    return neighbors.some(n => {
      if (n.x < 0 || n.x >= MAX_SHIP_GRID_SIZE.width || 
          n.y < 0 || n.y >= MAX_SHIP_GRID_SIZE.height) return false;
      return !!ship.grid[n.y]?.[n.x];
    });
  }

  static getValidPlacements(ship: PlayerShip): GridPosition[] {
    const valid: GridPosition[] = [];
    const visited = new Set<string>();

    // Iterate all existing rooms and check their empty neighbors
    ship.rooms.forEach(room => {
      const neighbors = [
        { x: room.position.x, y: room.position.y - 1 },
        { x: room.position.x, y: room.position.y + 1 },
        { x: room.position.x - 1, y: room.position.y },
        { x: room.position.x + 1, y: room.position.y },
      ];

      neighbors.forEach(n => {
        const key = `${n.x},${n.y}`;
        if (visited.has(key)) return;
        visited.add(key);

        if (n.x >= 0 && n.x < MAX_SHIP_GRID_SIZE.width && 
            n.y >= 0 && n.y < MAX_SHIP_GRID_SIZE.height && 
            !ship.grid[n.y]?.[n.x]) {
          valid.push(n);
        }
      });
    });

    return valid;
  }

  static purchaseRoom(ship: PlayerShip, roomType: PlayerRoomType, position: GridPosition): PlayerShip {
    const option = ROOM_PURCHASE_OPTIONS.find(o => o.roomType === roomType);
    if (!option) return ship;

    // Create new room
    const newRoom: PlayerShipRoom = {
      id: generateId(),
      name: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)}`,
      hazardLevel: 0,
      hazardType: "mechanical", // Default
      loot: [],
      looted: true,
      position: { ...position },
      connections: [], // Will be updated by door logic
      roomType: roomType,
      slots: option.slots.map((type) => ({
        id: generateId(),
        type,
        installedItem: null
      })),
      damage: 0
    };

    // Update grid
    const newGrid = ship.grid.map(row => [...row]);
    // Ensure grid is large enough (it should be initialized to MAX size or expanded)
    // Assuming grid is already MAX_SHIP_GRID_SIZE or we expand it.
    // Current implementation uses fixed grid size in PlayerShip?
    // Let's assume we need to handle grid expansion if it's dynamic.
    // But MAX_SHIP_GRID_SIZE suggests a fixed max.
    // If ship.grid is smaller, we might need to resize it.
    
    // For now, assume ship.grid is large enough or we expand it safely.
    while (newGrid.length <= position.y) {
      newGrid.push([]);
    }
    while (newGrid[position.y].length <= position.x) {
      newGrid[position.y].push(undefined as any);
    }
    
    newGrid[position.y][position.x] = newRoom;

    // Update rooms array
    const newRooms = [...ship.rooms, newRoom];

    // Update purchasedRooms tracking
    const newPurchasedRooms = [
      ...(ship.purchasedRooms || []),
      { id: newRoom.id, roomType, position }
    ];

    // Update grid bounds
    const newBounds = {
      width: Math.max(ship.gridBounds?.width || 0, position.x + 1),
      height: Math.max(ship.gridBounds?.height || 0, position.y + 1)
    };

    // Regenerate doors/connections
    // We need to update connections for the new room and its neighbors
    // Simple logic: connect to all adjacent existing rooms
    const neighbors = [
      { x: position.x, y: position.y - 1, dir: "north" },
      { x: position.x, y: position.y + 1, dir: "south" },
      { x: position.x - 1, y: position.y, dir: "west" },
      { x: position.x + 1, y: position.y, dir: "east" },
    ];

    neighbors.forEach(n => {
      if (newGrid[n.y]?.[n.x]) {
        const neighbor = newGrid[n.y][n.x];
        // Add connection to new room
        if (!newRoom.connections.includes(n.dir as any)) {
          newRoom.connections.push(n.dir as any);
        }
        // Add connection to neighbor (opposite dir)
        const opposite = n.dir === "north" ? "south" : n.dir === "south" ? "north" : n.dir === "west" ? "east" : "west";
        if (neighbor && !neighbor.connections.includes(opposite as any)) {
          neighbor.connections.push(opposite as any);
        }
      }
    });

    return {
      ...ship,
      grid: newGrid,
      rooms: newRooms,
      purchasedRooms: newPurchasedRooms,
      gridBounds: newBounds,
      width: newBounds.width,
      height: newBounds.height,
      layout: this.buildPlayerLayoutFromRooms({ ...ship, rooms: newRooms } as PlayerShip) as any,
      cargoCapacity: 4 + (newRooms.filter(r => r.roomType === 'cargo').length * 4)
    } as PlayerShip;
  }

  static calculateSellValue(room: PlayerShipRoom): number {
    const option = ROOM_PURCHASE_OPTIONS.find(o => o.roomType === room.roomType);
    if (!option) return 0;

    // Base sell value is 50% of base cost (ignoring scaling paid)
    const baseSell = option.baseCost * ROOM_SELL_MULTIPLIER;
    
    // Apply damage penalty
    const damagePenalty = (room.damage || 0) / 100 * DAMAGE_SELL_PENALTY;
    
    return Math.floor(baseSell * (1 - damagePenalty));
  }

  static sellRoom(ship: PlayerShip, roomId: string): { success: boolean; ship?: PlayerShip; credits?: number; reason?: string } {
    const roomIndex = ship.rooms.findIndex(r => r.id === roomId);
    if (roomIndex === -1) return { success: false, reason: "Room not found" };

    const room = ship.rooms[roomIndex];
    
    // Cannot sell bridge
    if (room.roomType === "bridge") return { success: false, reason: "Cannot sell Bridge" };

    // Check if selling breaks connectivity
    // This is complex (graph connectivity). 
    // Simplified check: If it's a leaf node (only 1 connection), it's safe?
    // Not necessarily, could be a leaf in a cycle.
    // Better: Run BFS/DFS from bridge to check if all other rooms are still reachable.
    
    const tempRooms = ship.rooms.filter(r => r.id !== roomId);
    if (!this.checkConnectivity(tempRooms, ship.entryPosition)) {
      return { success: false, reason: "Cannot sell: would isolate other rooms" };
    }

    // Calculate value
    const credits = this.calculateSellValue(room);

    // Remove room
    const newGrid = ship.grid.map(row => [...row]);
    newGrid[room.position.y][room.position.x] = undefined as any;

    // Remove connections from neighbors
    const neighbors = [
      { x: room.position.x, y: room.position.y - 1, dir: "north" },
      { x: room.position.x, y: room.position.y + 1, dir: "south" },
      { x: room.position.x - 1, y: room.position.y, dir: "west" },
      { x: room.position.x + 1, y: room.position.y, dir: "east" },
    ];

    neighbors.forEach(n => {
      if (newGrid[n.y]?.[n.x]) {
        const neighbor = newGrid[n.y][n.x];
        const opposite = n.dir === "north" ? "south" : n.dir === "south" ? "north" : n.dir === "west" ? "east" : "west";
        if (neighbor) {
          neighbor.connections = neighbor.connections.filter((d: any) => d !== opposite);
        }
      }
    });

    const newPurchasedRooms = (ship.purchasedRooms || []).filter(r => r.id !== roomId);

    const newBounds = {
      width: tempRooms.reduce((m, r) => Math.max(m, r.position.x + 1), 0),
      height: tempRooms.reduce((m, r) => Math.max(m, r.position.y + 1), 0),
    };

    const nextShip: PlayerShip = {
      ...ship,
      grid: newGrid,
      rooms: tempRooms,
      purchasedRooms: newPurchasedRooms,
      gridBounds: newBounds,
      width: newBounds.width,
      height: newBounds.height,
      layout: this.buildPlayerLayoutFromRooms({ ...ship, rooms: tempRooms } as PlayerShip) as any,
      cargoCapacity: 4 + (tempRooms.filter(r => r.roomType === 'cargo').length * 4)
    };

    return { success: true, credits, ship: nextShip };
  }

  private static checkConnectivity(rooms: PlayerShipRoom[], startPos: GridPosition): boolean {
    if (rooms.length === 0) return true;
    
    // Find bridge or start room
    const startRoom = rooms.find(r => r.position.x === startPos.x && r.position.y === startPos.y);
    if (!startRoom) return false; // Should always have bridge

    const visited = new Set<string>();
    const queue = [startRoom];
    visited.add(startRoom.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // Check neighbors
      const neighbors = [
        { x: current.position.x, y: current.position.y - 1 },
        { x: current.position.x, y: current.position.y + 1 },
        { x: current.position.x - 1, y: current.position.y },
        { x: current.position.x + 1, y: current.position.y },
      ];

      neighbors.forEach(n => {
        const neighbor = rooms.find(r => r.position.x === n.x && r.position.y === n.y);
        if (neighbor && !visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push(neighbor);
        }
      });
    }

    return visited.size === rooms.length;
  }
}
