export type HazardType = "mechanical" | "combat" | "environmental" | "security";
export type WreckType =
  | "military"
  | "science"
  | "industrial"
  | "civilian"
  | "luxury";
export type LootCategory =
  | "universal"
  | "military"
  | "science"
  | "industrial"
  | "civilian";
export type LootRarity = "common" | "uncommon" | "rare" | "legendary";
export type ItemType =
  | "weapon"
  | "armor"
  | "tech"
  | "material"
  | "data"
  | "medical"
  | "luxury"
  | "misc";
export type SkillType = "technical" | "combat" | "salvage" | "piloting";

// Phase 5 - Graveyard zones and license tiers
export type GraveyardZone = "near" | "mid" | "deep";

export type LicenseTier = "basic" | "standard" | "premium";

export type WreckMass = "small" | "medium" | "large" | "massive";

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
    id: "near",
    label: "NEAR ZONE",
    distanceRange: [1.0, 2.0],
    tierRange: [1, 2],
    luxuryChance: 0.05,
    wreckCountMin: 2,
    wreckCountMax: 3,
    description: "Safe salvage near Cinder Station. Low risk, low reward.",
  },
  mid: {
    id: "mid",
    label: "MID ZONE",
    distanceRange: [2.0, 3.0],
    tierRange: [2, 3],
    luxuryChance: 0.15,
    wreckCountMin: 2,
    wreckCountMax: 3,
    description: "Moderate risk sector. Requires Standard License.",
  },
  deep: {
    id: "deep",
    label: "DEEP ZONE",
    distanceRange: [3.0, 5.0],
    tierRange: [4, 5],
    luxuryChance: 0.3,
    wreckCountMin: 2,
    wreckCountMax: 3,
    description: "Critical danger zone. Premium License required.",
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
    tier: "basic",
    cost: 5000,
    duration: 14,
    unlocksZones: ["near"],
    label: "BASIC SALVAGE LICENSE",
  },
  standard: {
    tier: "standard",
    cost: 15000,
    duration: 21,
    unlocksZones: ["near", "mid"],
    label: "STANDARD SALVAGE LICENSE",
  },
  premium: {
    tier: "premium",
    cost: 35000,
    duration: 30,
    unlocksZones: ["near", "mid", "deep"],
    label: "PREMIUM SALVAGE LICENSE",
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

export interface CrewMovementStats {
  /** Base speed in rooms/second. If omitted, systems use their defaults. */
  baseRoomsPerSecond?: number;
  /** Multiplier applied to base movement speed. Defaults to 1. */
  multiplier?: number;
}

export interface CrewStats {
  movement?: CrewMovementStats;
}

export interface CrewMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  isPlayer?: boolean;
  background: BackgroundId;
  traits: TraitId[];
  /** Structured per-crew numeric modifiers for future balancing (e.g. trait-driven move speed). */
  stats?: CrewStats;
  skills: Skills;
  skillXp: SkillXp;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  sanity: number;
  maxSanity: number;
  position?: CrewPosition;
  /** Optional transient movement state (room-to-room traversal) */
  movement?: {
    path: string[];
    stepIndex: number;
    progress: number;
    speedRoomsPerSecond: number;
  };
  currentJob: CrewJob;
  status: CrewStatus;
  hiredDay?: number;
  hireCost?: number;
  customDotColor?: string;
  inventory: Loot[]; // Items currently held by this crew member (max 1)
  // Phase 14: Injury system
  injury?: Injury;
  morale?: number; // 0-100, affected by relationships, events, deaths
}

// Backwards-compatible alias until rest of codebase migrates
export type Crew = CrewMember;

export interface Item {
  id: string;
  name: string;
  category?: LootCategory; // Optional for pure equipment
  value: number;
  rarity: LootRarity;
  itemType: ItemType;
  manufacturer: string;
  description: string;
  
  // Equipment fields (unified)
  slotType?: SlotType;
  tier?: 1 | 2 | 3 | 4 | 5;
  powerDraw?: number; // 0 = passive, 1.. = active draw
  effects?: ItemEffect[];
  compatibleRoomTypes?: string[]; // Room types where this can be installed (undefined = sell-only)
}

// Alias for backward compatibility during refactor
export type Loot = Item;

/**
 * Type guard to check if an Item is equippable on the player ship
 */
export function isEquippable(item: Item): boolean {
  return item.slotType !== undefined && item.slotType !== null;
}

export interface Room {
  id: string;
  name: string;
  hazardLevel: number; // 0-5
  hazardType: HazardType;
  loot: Loot[];
  looted: boolean;
  // Optional equipment found in the room (Phase 7)
  equipment?: Item | null;
  // Sealed rooms require cutting open before salvaging
  sealed?: boolean;
}

// Grid system types for Phase 6
export interface GridPosition {
  x: number;
  y: number;
}

export type Direction = "north" | "south" | "east" | "west";

export interface GridRoom extends Room {
  position: GridPosition;
  connections: Direction[]; // Adjacent doors
}

export interface ShipLayout {
  template: string;
  rooms: Array<{ x: number; y: number; w: number; h: number; kind: string }>;
}

export interface Ship {
  id?: string;
  name: string; // Procedural name for wrecks; player-editable for PlayerShip
  width: number;
  height: number;
  grid: (GridRoom | undefined)[][];
  entryPosition: GridPosition;
  layout?: ShipLayout;
}

/**
 * Type guard to check if a Ship has a procedural layout from WASM
 */
export function hasShipLayout(
  ship: Ship,
): ship is Ship & { layout: ShipLayout } {
  return ship.layout !== undefined && Array.isArray(ship.layout.rooms);
}

// Phase 7: Items & Slots System types
export type SlotType =
  | "engineering"
  | "scanning"
  | "medical"
  | "combat"
  | "bridge"
  | "cargo";

export type EffectType =
  | "skill_bonus"
  | "hazard_resist"
  | "fuel_efficiency"
  | "scan_range"
  | "heal_rate"
  | "loot_bonus"
  | "crew_capacity"
  | "cargo_capacity"
  | "stamina_recovery"
  | "sanity_recovery";

export interface ItemEffect {
  type: EffectType;
  value: number;
  skill?: SkillType; // required for 'skill_bonus'
  hazard?: HazardType; // required for 'hazard_resist'
}

// Old Item interface removed - unified with Item above

export interface ItemSlot {
  id: string;
  type: SlotType;
  installedItem: Item | null;
}

export type PlayerRoomType =
  | "bridge"
  | "engine"
  | "medbay"
  | "cargo"
  | "workshop"
  | "armory"
  | "lounge"
  | "quarters";

export interface PlayerShipRoom extends GridRoom {
  roomType: PlayerRoomType;
  slots: ItemSlot[];
  damage: number; // 0-100% damage
}

export interface ReactorModule {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  powerOutput: number;
  manufacturer?: string;
  value: number;
}

export interface PlayerShip extends Ship {
  // Player-specific ship fields
  cargoCapacity: number;
  cargoUsed: number;
  hp: number;
  maxHp: number;

  // Flattened rooms array for convenient access (derived from grid)
  rooms: PlayerShipRoom[];
  
  // Phase 13: Ship Expansion
  purchasedRooms: {
    id: string;
    roomType: PlayerRoomType;
    position: GridPosition;
  }[];
  gridBounds: { width: number; height: number }; // Current grid size (starts 2x2, max 8x8)

  // Phase 7 fields
  reactor?: ReactorModule; // installed reactor module
  powerCapacity?: number; // derived from reactor (power output)
  powerUsed?: number; // computed sum of installed items' powerDraw
}

// Phase 13: Ship Expansion Types
export interface RoomPurchaseConfig {
  roomType: PlayerRoomType;
  baseCost: number;
  slots: SlotType[];
  description: string;
  requiredLicense: LicenseTier;
  crewBonus?: number;
  cargoBonus?: number;
}

export interface ShipUpgrade {
  id: string;
  name: string;
  cost: number;
  description: string;
  type: "room" | "hull" | "reactor";
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
  status: "traveling" | "salvaging" | "returning" | "completed";
  timeRemaining: number;
  collectedLoot: Loot[]; // Unified storage for all items (equipment and materials)
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
  // Crew work safety thresholds
  minCrewHpPercent: number; // Default 50 - crew won't work below this HP%
  minCrewStamina: number; // Default 20 - crew won't work below this stamina
  minCrewSanity: number; // Default 20 - crew won't work below this sanity
}

// UI Toast notifications used across the app
export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

// Screen navigation typing for consistent onNavigate props
export type Screen =
  | "hub"
  | "crew"
  | "hire"
  | "salvage"
  | "travel"
  | "wreck-select"
  | "select"
  | "run-summary"
  | "summary"
  | "sell"
  | "shipyard"
  | "equipment-shop"
  | "shop"
  | "game-over"
  | "gameover";

export interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

export interface HireCandidate {
  id: string;
  name: string;
  skills: Skills;
  cost: number;
  background?: BackgroundId;
  traits?: TraitId[];
}

export interface WreckPreview {
  id: string;
  distance: number;
  estimatedMass: WreckMass;
  fuelCost: number;
  zone: GraveyardZone;
}

// ============================================
// PHASE 9: Crew Identity & Survival Types
// ============================================

// Background IDs - must match keys in backgrounds.ts
export type BackgroundId =
  | "ex_military"
  | "station_rat"
  | "freighter_pilot"
  | "scrap_diver"
  | "corporate_exile"
  | "dock_worker"
  | "medical_dropout"
  | "enforcer"
  | "smuggler"
  | "colonist"
  | "ship_captain";

// Trait IDs - must match keys in traits.ts
export type TraitId =
  | "brave"
  | "lucky"
  | "efficient"
  | "eagle_eye"
  | "loyal"
  | "steady"
  | "tireless"
  | "greedy"
  | "coward"
  | "reckless"
  | "lazy"
  | "paranoid"
  | "addicted"
  | "clumsy"
  | "quiet"
  | "veteran"
  | "idealist"
  | "pragmatic";

export type CrewStatus = "active" | "resting" | "injured" | "breakdown";

export type CrewJob =
  | "idle"
  | "salvaging"
  | "resting"
  | "healing"
  | "socializing";

export interface CrewPosition {
  location: "ship" | "wreck" | "station";
  roomId?: string;
  gridPosition?: GridPosition;
}

export interface CrewBackground {
  id: BackgroundId;
  name: string;
  description: string;
  skillModifiers: Partial<Skills>;
  traitPool: TraitId[];
  statModifiers?: {
    stamina?: number;
    sanity?: number;
  };
}

export type TraitEffectType =
  | "skill_mod"
  | "stamina_mod"
  | "sanity_mod"
  | "work_speed"
  | "event_chance"
  | "loot_bonus"
  | "special";

export interface TraitEffect {
  type: TraitEffectType;
  target?: string;
  value: number;
  description?: string;
}

export interface CrewTrait {
  id: TraitId;
  name: string;
  description: string;
  category: "positive" | "negative" | "neutral";
  effects: TraitEffect[];
}

export interface PantryCapacity {
  food: number;
  drink: number;
  luxury: number;
}

export type EventTrigger =
  | "travel"
  | "salvage"
  | "social"
  | "daily"
  | "starvation"
  | "breakdown"
  | "hub"
  | "lounge"
  | "medical"
  | "dock";

// ============================================
// PHASE 14: Injury & Death System
// ============================================

export type InjuryType =
  | "broken_arm"
  | "broken_leg"
  | "concussion"
  | "radiation_sickness"
  | "burns"
  | "trauma"
  | "internal_bleeding";

export type InjurySeverity = "minor" | "major" | "critical";

export interface Injury {
  type: InjuryType;
  severity: InjurySeverity;
  daysRemaining: number;
  daysSuffered: number; // Total days this injury lasts
  effects: {
    skillPenalty?: Partial<Skills>;
    staminaModifier?: number; // Percentage reduction (e.g., -30 = 30% less max stamina)
    workDisabled?: boolean; // Can't salvage at all
  };
}

export interface InjuryConfig {
  type: InjuryType;
  name: string;
  description: string;
  severityDays: Record<InjurySeverity, number>;
  effects: Record<InjurySeverity, Injury["effects"]>;
}

export interface DeadCrewMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  background: BackgroundId;
  traits: TraitId[];
  diedOnDay: number;
  causeOfDeath: string;
  daysEmployed: number;
}

// ============================================
// PHASE 14: Relationship System
// ============================================

export type RelationshipLevel =
  | "hostile"    // 0-1
  | "tense"      // 2-3
  | "neutral"    // 4-5
  | "friendly"   // 6-7
  | "close"      // 8-9
  | "intimate";  // 10

export interface CrewRelationship {
  crewId1: string; // Alphabetically first ID for consistent lookup
  crewId2: string;
  level: number; // 0-10 scale
  history: string[]; // Recent events/reasons for relationship changes (max 5)
}

export interface RelationshipChange {
  crewId1: string;
  crewId2: string;
  delta: number;
  reason: string;
}

export interface EventRequirement {
  skill?: keyof Skills;
  minLevel?: number;
  item?: string;
  trait?: TraitId;
  credits?: number;
}

export type EventEffectType =
  | "credits"
  | "fuel"
  | "food"
  | "drink"
  | "hp"
  | "stamina"
  | "sanity"
  | "trait_add"
  | "trait_remove"
  | "loot"
  | "crew_add"
  | "relationship";

export interface EventEffect {
  type: EventEffectType;
  target?: string;
  value: number | string;
  /** Flag to set when this effect is applied */
  setsFlag?: string;
}

export interface EventChoice {
  id: string;
  text: string;
  requirements?: EventRequirement;
  effects: EventEffect[];
  /** Flag to set when this choice is selected */
  setsFlag?: string;
}

export interface GameEvent {
  id: string;
  trigger: EventTrigger;
  title: string;
  description: string;
  choices: EventChoice[];
  requirements?: EventRequirement;
  weight: number;
  /** Flag that must be set for this event to trigger */
  requiresFlag?: string;
  /** Flag that must NOT be set for this event to trigger */
  excludesFlag?: string;
  /** Required trait on any active crew for this event to trigger */
  requiresTrait?: TraitId;
  /** Required background on any active crew for this event to trigger */
  requiresBackground?: string;
}

/** Persistent event flags that track world state across the game */
export type EventFlags = Record<string, boolean>;

export type ShoreLeaveType = "rest" | "recreation" | "party";

export interface ShoreLeaveOption {
  type: ShoreLeaveType;
  cost: number;
  duration: number;
  staminaRecovery: number;
  sanityRecovery: number;
  eventChance: number;
  beerPerCrew?: number;
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
  inventory: Item[]; // Unified inventory for all items
  // equipmentInventory removed - merged into inventory
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

  // Phase 7: Equipment and cargo swap (unified with Loot system)
  cargoSwapPending?: {
    newItem: Loot | Item;
    source: "salvage" | "shop";
  } | null;

  // Phase 9: Provisions
  food: number;
  drink: number;
  luxuryDrink: number;
  pantryCapacity: PantryCapacity;
  daysWithoutFood: number;
  beerRationDays: number;
  crewEfficiencyPenalty: number;
  activeEvent?: GameEvent | null;
  isNewGame?: boolean;

  // Phase 12: Event flags for persistent world state
  eventFlags?: EventFlags;

  // Auto-salvage
  autoSalvageEnabled?: boolean;
  autoAssignments?: Record<string, string> | null;

  // Phase 14: Death & Relationships
  deadCrew: DeadCrewMember[];
  relationships: CrewRelationship[];
  
  // Event chain state
  activeEventChain?: {
    chainId: string;
    step: number;
    data?: Record<string, unknown>; // Chain-specific data (e.g., involved crew IDs)
  } | null;
}
