export const STARTING_CREDITS = 500;
export const STARTING_FUEL = 100;
export const STARTING_TIME = 20;
export const STARTING_HP = 100;

// Starting skill levels (all 2 for prototype)
export const STARTING_SKILLS = {
  technical: 2,
  combat: 2,
  salvage: 2,
  piloting: 2,
} as const;

// Skill XP System
export const SKILL_XP_THRESHOLDS = [100, 250, 500, 1000];
export const XP_BASE_SUCCESS = 5;
export const XP_BASE_FAIL = 2;
export const XP_PER_HAZARD_LEVEL = 3; // Multiply by hazard level
export const XP_PER_TIER = 2; // Multiply by wreck tier

// License System
export const LICENSE_DURATION_DAYS = 14;
export const LICENSE_FEE = 5000;
export const LICENSE_WARNING_THRESHOLD = 2;

// mapping hazard type -> matching skill key
export const SKILL_HAZARD_MAP: Record<string, keyof typeof STARTING_SKILLS> = {
  mechanical: 'technical',
  combat: 'combat',
  environmental: 'piloting',
  security: 'technical',
};

// Rarity multipliers
export const RARITY_MULTIPLIERS = {
  common: 1.0,
  uncommon: 1.5,
  rare: 2.5,
  legendary: 5.0,
} as const;

// Time cost per rarity (in time units)
export const RARITY_TIME_COST = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 5,
} as const;

// piloting reduces fuel usage (per level)
export const PILOTING_FUEL_REDUCTION_PER_LEVEL = 0.05; // 5%

// salvage increases loot value per level above 1
export const SALVAGE_VALUE_BONUS_PER_LEVEL = 0.1; // 10%

// mismatch penalty applies for advanced wrecks (tier >= threshold)
export const MISMATCH_PENALTY_THRESHOLD = 3;
export const SKILL_MISMATCH_PENALTY = 10; // percent points from success chance (slightly reduced)

export const FUEL_COST_PER_AU = 2; // per-way
export const TIME_PER_ROOM = 2;

export const LOOT_MIN = 500;
export const LOOT_MAX = 5000;

export const SCAN_COST = 50;

export const MVP_GOAL = 10000; // prototype goal

// Tier scaling (rooms and hazard floors defined in generator logic)
export const TIER_ROOM_BASE = 3; // rooms = base + tier

// Station Services
export const FUEL_PRICE = 10; // CR per unit
export const HEALING_COST = 50; // CR per treatment
export const HEALING_AMOUNT = 10; // HP restored per treatment

// Efficiency rating thresholds
export const EFFICIENCY_THRESHOLDS = {
  perfect: 0.95,
  excellent: 0.8,
  good: 0.6,
  fair: 0.4,
} as const;

// Critical HP threshold for warnings
export const CRITICAL_HP_THRESHOLD = 0.3; // 30% HP

// Stats milestones for toast notifications
export const CREDIT_MILESTONES = [1000, 5000, 10000, 25000, 50000];

// Keyboard shortcuts help text
export const KEYBOARD_SHORTCUTS = {
  hub: {
    s: 'Select Wreck',
    i: 'Inventory',
    h: 'Medical Bay',
    f: 'Fuel Depot',
    r: 'Reset Game',
  },
  salvage: {
    '1-6': 'Select Room',
    esc: 'View Inventory',
    r: 'Return to Station',
    space: 'Salvage Room',
  },
} as const;
