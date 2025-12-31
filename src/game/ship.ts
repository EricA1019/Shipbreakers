import { SeededRandom } from './random';
import type { GridRoom, GridPosition, Direction, WreckMass, Loot, HazardType } from '../types';

function opposite(dir: Direction): Direction {
  switch (dir) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'east': return 'west';
    case 'west': return 'east';
  }
}

export class Ship {
  id?: string;
  name: string;
  width: number;
  height: number;
  grid: GridRoom[][];
  entryPosition: GridPosition;
  private rng: SeededRandom;

  static sizeByMass: Record<WreckMass, { w: number; h: number }> = {
    small: { w: 2, h: 2 },
    medium: { w: 3, h: 2 },
    large: { w: 3, h: 3 },
    massive: { w: 4, h: 3 },
  };

  constructor(seed: string, opts: { width?: number; height?: number; name?: string } = {}) {
    this.rng = new SeededRandom(seed);
    this.width = opts.width ?? 3;
    this.height = opts.height ?? 2;
    this.name = opts.name ?? `Wreck-${seed}`;
    this.grid = [];
    this.entryPosition = { x: 0, y: 0 };

    this.generateGrid();
    this.generateDoors();
  }

  static fromMass(seed: string, mass: WreckMass, name?: string) {
    const s = Ship.sizeByMass[mass];
    return new Ship(seed, { width: s.w, height: s.h, name });
  }

  private generateGrid() {
    // initialize grid with empty rooms
    for (let y = 0; y < this.height; y++) {
      const row: GridRoom[] = [];
      for (let x = 0; x < this.width; x++) {
        const roomId = `${this.name}-${x}-${y}-${Math.floor(this.rng.nextFloat() * 1e6)}`;
        row.push({
          id: roomId,
          name: `Room ${x},${y}`,
          hazardLevel: this.rng.nextInt(0, 3),
          hazardType: this.rng.pick(['mechanical', 'combat', 'environmental', 'security'] as HazardType[]),
          loot: [] as Loot[],
          looted: false,
          position: { x, y },
          connections: [],
        });
      }
      this.grid.push(row);
    }
    // choose random entry position
    const ex = this.rng.nextInt(0, this.width - 1);
    const ey = this.rng.nextInt(0, this.height - 1);
    this.entryPosition = { x: ex, y: ey };
  }

  private neighbors(x: number, y: number) {
    const neigh: Array<{ pos: GridPosition; dir: Direction }> = [];
    if (y > 0) neigh.push({ pos: { x, y: y - 1 }, dir: 'north' });
    if (y < this.height - 1) neigh.push({ pos: { x, y: y + 1 }, dir: 'south' });
    if (x < this.width - 1) neigh.push({ pos: { x: x + 1, y }, dir: 'east' });
    if (x > 0) neigh.push({ pos: { x: x - 1, y }, dir: 'west' });
    return neigh;
  }

  private generateDoors() {
    // Create MST-like connectivity using a randomized Prim's variant
    const visited = new Set<string>();
    const key = (p: GridPosition) => `${p.x},${p.y}`;

    const start = this.entryPosition;
    visited.add(key(start));

    // frontier edges: [fromPos, toPos, dir]
    const frontier: Array<{ from: GridPosition; to: GridPosition; dir: Direction }> = [];

    const pushFrontier = (from: GridPosition) => {
      for (const n of this.neighbors(from.x, from.y)) {
        const k = key(n.pos);
        if (!visited.has(k)) frontier.push({ from, to: n.pos, dir: n.dir });
      }
    };

    pushFrontier(start);

    while (frontier.length > 0) {
      // pick random frontier edge
      const idx = this.rng.nextInt(0, frontier.length - 1);
      const edge = frontier.splice(idx, 1)[0];
      const toKey = key(edge.to);
      if (visited.has(toKey)) continue;

      // connect edge
      this.connectPositions(edge.from, edge.to, edge.dir);
      visited.add(toKey);

      pushFrontier(edge.to);
    }

    // Add some extra random doors (20-30% chance per adjacent pair)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        for (const n of this.neighbors(x, y)) {
          // with small probability, add an additional connection
          if (this.rng.nextFloat() < 0.25) {
            this.connectPositions({ x, y }, n.pos, n.dir);
          }
        }
      }
    }
  }

  private connectPositions(a: GridPosition, b: GridPosition, dir: Direction) {
    const ra = this.grid[a.y][a.x];
    const rb = this.grid[b.y][b.x];
    if (!ra.connections.includes(dir)) ra.connections.push(dir);
    const od = opposite(dir);
    if (!rb.connections.includes(od)) rb.connections.push(od);
  }

  getRoom(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.grid[y][x];
  }

  getConnectedRooms(pos: GridPosition) {
    const room = this.getRoom(pos.x, pos.y);
    if (!room) return [];
    const neighbors: { room: GridRoom; dir: Direction }[] = [];
    for (const dir of room.connections) {
      let nx = pos.x;
      let ny = pos.y;
      if (dir === 'north') ny -= 1;
      if (dir === 'south') ny += 1;
      if (dir === 'east') nx += 1;
      if (dir === 'west') nx -= 1;
      const r = this.getRoom(nx, ny);
      if (r) neighbors.push({ room: r, dir });
    }
    return neighbors;
  }

  canMoveTo(from: GridPosition, to: GridPosition) {
    const room = this.getRoom(from.x, from.y);
    if (!room) return false;
    // determine direction from->to
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    let dir: Direction | null = null;
    if (dx === 1 && dy === 0) dir = 'east';
    if (dx === -1 && dy === 0) dir = 'west';
    if (dx === 0 && dy === 1) dir = 'south';
    if (dx === 0 && dy === -1) dir = 'north';
    if (!dir) return false;
    return room.connections.includes(dir);
  }
}
