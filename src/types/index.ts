export type HazardType = 'mechanical' | 'combat' | 'environmental' | 'security';
export type WreckType = 'military' | 'science' | 'industrial' | 'civilian' | 'luxury';
export type LootCategory = 'universal' | 'military' | 'science' | 'industrial' | 'civilian';
export type LootRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'tech' | 'material' | 'data' | 'medical' | 'luxury' | 'misc';
export type SkillType = 'technical' | 'combat' | 'salvage' | 'piloting';

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

export interface Crew {
  name: string;
  skills: Skills;
  skillXp: SkillXp; // stub for future progression
  hp: number;
  maxHp: number;
}

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

export interface Wreck {
  id: string;
  name: string;
  type: WreckType;
  tier: number; // 1-5
  distance: number; // AU
  rooms: Room[];
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

export interface GameState {
  credits: number;
  fuel: number;
  crew: Crew;
  availableWrecks: Wreck[];
  currentRun: RunState | null;
  inventory: Loot[];
  day: number;
  licenseDaysRemaining: number;
  licenseFee: number;
  stats: PlayerStats;
  settings: GameSettings;
}
