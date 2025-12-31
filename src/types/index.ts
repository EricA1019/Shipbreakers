export type HazardType = 'mechanical' | 'combat' | 'environmental' | 'security';
export type WreckType = 'military' | 'science' | 'industrial' | 'civilian' | 'luxury';
export type LootCategory = 'universal' | 'military' | 'science' | 'industrial' | 'civilian';
export type LootRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'tech' | 'material' | 'data' | 'medical' | 'luxury' | 'misc';
export type SkillType = 'technical' | 'combat' | 'salvage' | 'piloting';

// Phase 5 - Graveyard zones and license tiers
export type GraveyardZone = 'near' | 'mid' | 'deep';

export type LicenseTier = 'basic' | 'standard' | 'premium';

export type WreckMass = 'small' | 'medium' | 'large' | 'massive';

export interface ZoneConfig {
  id: GraveyardZone;
  label: string;
  distanceRange: [number, number]; // AU
  tierRange: [number, number];
  luxuryChance: number; // 0-1
  wreckCountMin: number;
  wreckCountMax: number;
  description: string;
}

export const ZONES: Record<GraveyardZone, ZoneConfig> = {
  near: {
    id: 'near',
    label: 'NEAR ZONE',
    distanceRange: [1.0, 2.0],
    tierRange: [1, 2],
    luxuryChance: 0.05,
    wreckCountMin: 2,
    wreckCountMax: 3,
    description: 'Safe salvage near Cinder Station. Low risk, low reward.',
  },
  mid: {
    id: 'mid',
    label: 'MID ZONE',
    distanceRange: [2.0, 3.0],
    tierRange: [2, 3],
    luxuryChance: 0.15,
    wreckCountMin: 2,
    wreckCountMax: 3,
    description: 'Moderate risk sector. Requires Standard License.',
  },
  deep: {
    id: 'deep',
    label: 'DEEP ZONE',
    distanceRange: [3.0, 5.0],
    tierRange: [4, 5],
    luxuryChance: 0.30,
    wreckCountMin: 2,
    wreckCountMax: 3,
    description: 'Critical danger zone. Premium License required.',
  },
};

export interface LicenseTierConfig {
  tier: LicenseTier;
  cost: number; // CR
  duration: number; // days
  unlocksZones: GraveyardZone[];
  label: string;
}

export const LICENSE_TIERS: Record<LicenseTier, LicenseTierConfig> = {
  basic: {
    tier: 'basic',
    cost: 5000,
    duration: 14,
    unlocksZones: ['near'],
    label: 'BASIC SALVAGE LICENSE',
  },
  standard: {
    tier: 'standard',
    cost: 15000,
    duration: 21,
    unlocksZones: ['near', 'mid'],
    label: 'STANDARD SALVAGE LICENSE',
  },
  premium: {
    tier: 'premium',
    cost: 35000,
    duration: 30,
    unlocksZones: ['near', 'mid', 'deep'],
    label: 'PREMIUM SALVAGE LICENSE',
  },
};

export interface Corporation {
  id: string;
  name: string;
  specialty: WreckType;
  tier: 1 | 2 | 3 | 4;
  defunct: boolean;
  description: string;
}

export interface Skills {
  technical: number; // 1-5
  combat: number; // 1-5
  salvage: number; // 1-5
  piloting: number; // 1-5
}

export interface SkillXp {
  technical: number;
  combat: number;
  salvage: number;
  piloting: number;
}

export interface CrewMember {
  id: string; // UUID
  name: string;
  isPlayer?: boolean; // captain flag (true for captain)
  skills: Skills;
  skillXp: SkillXp; // learns by doing
  hp: number;
  maxHp: number;
  hiredDay?: number; // day hired (undefined for starting captain)
  hireCost?: number; // cost paid to hire
}

// Backwards-compatible alias until rest of codebase migrates
export type Crew = CrewMember;

export interface Loot {
  id: string;
  name: string;
  category: LootCategory;
  value: number;
  rarity: LootRarity;
  itemType: ItemType;
  manufacturer: string;
  description: string;
}

export interface Room {
  id: string;
  name: string;
  hazardLevel: number; // 0-5
  hazardType: HazardType;
  loot: Loot[];
  looted: boolean;
}

// Grid system types for Phase 6
export interface GridPosition {
  x: number;
  y: number;
}

export type Direction = 'north' | 'south' | 'east' | 'west';

export interface GridRoom extends Room {
  position: GridPosition;
  connections: Direction[]; // Adjacent doors
}

export interface Ship {
  id?: string;
  name: string; // Procedural name for wrecks; player-editable for PlayerShip
  width: number;
  height: number;
  grid: GridRoom[][];
  entryPosition: GridPosition;
}

export interface PlayerShip extends Ship {
  // Player-specific ship fields
  cargoCapacity: number;
  cargoUsed: number;
  hp: number;
  maxHp: number;
}

export interface Wreck {
  id: string;
  name: string; // Procedural name - may be hidden until arrival
  type: WreckType;
  tier: number; // 1-5
  distance: number; // AU
  // Backwards-compatible: legacy flat rooms array (populated by TS prototype)
  rooms: Room[];
  // New: spatial ship/grid representation (populated by Ship class / Rust procgen)
  ship?: Ship;
  stripped: boolean;
}

export interface RunStats {
  roomsAttempted: number;
  roomsSucceeded: number;
  roomsFailed: number;
  damageTaken: number;
  fuelSpent: number;
  xpGained: Record<SkillType, number>;
}

export interface RunState {
  wreckId: string;
  status: 'traveling' | 'salvaging' | 'returning' | 'completed';
  timeRemaining: number;
  collectedLoot: Loot[];
  stats: RunStats;
}

export interface PlayerStats {
  totalCreditsEarned: number;
  totalWrecksCleared: number;
  totalRoomsSalvaged: number;
  totalItemsCollected: number;
  highestSingleProfit: number;
  mostValuableItem: { name: string; value: number } | null;
  longestWinStreak: number;
  deathsAvoided: number;
  licensesRenewed: number;
  daysPlayed: number;
}

export interface GameSettings {
  autoSave: boolean;
  confirmDialogs: boolean;
  showTooltips: boolean;
  showKeyboardHints: boolean;
}

export interface HireCandidate {
  id: string;
  name: string;
  skills: Skills;
  cost: number;
}

export interface WreckPreview {
  id: string;
  distance: number;
  estimatedMass: WreckMass;
  fuelCost: number;
  zone: GraveyardZone;
}

export interface GameState {
  credits: number;
  fuel: number;
  // Phase 5: multiple crew support
  crewRoster: CrewMember[]; // max 5
  // Convenience: active selected crew for compatibility
  crew: Crew; 
  selectedCrewId: string | null; // crew assigned for next run

  hireCandidates: HireCandidate[];
  availableWrecks: Wreck[];
  currentRun: RunState | null;
  inventory: Loot[];
  day: number;
  licenseDaysRemaining: number;
  // Will use LICENSE_TIERS for pricing; keep licenseFee for compatibility
  licenseFee: number;
  licenseTier: LicenseTier;
  unlockedZones: GraveyardZone[];
  // UI helpers
  lastUnlockedZone?: GraveyardZone | null;
  stats: PlayerStats;
  settings: GameSettings;

  // Phase 6: player ship state
  playerShip?: PlayerShip;
}
