export interface Crew {
  name: string;
  skill: number; // 1-5
  hp: number;
  maxHp: number;
}

export interface Loot {
  id: string;
  name: string;
  value: number;
}

export interface Room {
  id: string;
  name: string;
  hazardLevel: number; // 0-5
  loot: Loot[];
  looted: boolean;
}

export interface Wreck {
  id: string;
  name: string;
  distance: number; // AU
  rooms: Room[];
  stripped: boolean;
}

export interface RunState {
  wreckId: string;
  status: 'traveling' | 'salvaging' | 'returning' | 'completed';
  timeRemaining: number;
  collectedLoot: Loot[];
}

export interface GameState {
  credits: number;
  fuel: number;
  crew: Crew;
  availableWrecks: Wreck[];
  currentRun: RunState | null;
}
