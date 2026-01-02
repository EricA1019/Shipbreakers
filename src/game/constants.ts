export const STARTING_CREDITS = 2000;
export const STARTING_FUEL = 100;
export const STARTING_TIME = 20;
export const STARTING_HP = 100;

// Phase 7: Power / Equipment constants
export const STARTING_POWER_CAPACITY = 3; // Salvaged Reactor
export const REACTOR_POWER_TIERS = [3, 5, 8, 12, 20];
export const EQUIPMENT_DROP_RATE = 0.12; // 12% per room
export const SHOP_STOCK_SIZE = 6; // items per day
export const SHIPYARD_BASE_FEE = 100; // CR
export const SHIPYARD_UNINSTALL_FEE = 50; // CR
export const LICENSE_FEE_DISCOUNTS: Record<string, number> = {
  basic: 0,
  standard: 0.25,
  premium: 0.5,
};

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
  mechanical: "technical",
  combat: "combat",
  environmental: "piloting",
  security: "technical",
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
    s: "Select Wreck",
    i: "Inventory",
    h: "Medical Bay",
    f: "Fuel Depot",
    r: "Reset Game",
  },
  salvage: {
    "1-6": "Select Room",
    esc: "View Inventory",
    r: "Return to Station",
    space: "Salvage Room",
  },
} as const;

// ============================================
// PHASE 9: Crew & Survival Constants
// ============================================

export const BASE_STAMINA = 100;
export const BASE_SANITY = 100;

export const PANTRY_CAPACITY = {
  food: 20,
  drink: 20,
  luxury: 10,
};

export const DAILY_FOOD_PER_CREW = 1;
export const DAILY_DRINK_PER_CREW = 1;

export const NO_FOOD_SANITY_LOSS = 5;
export const NO_DRINK_SANITY_LOSS = 10;
export const STARVATION_DAYS_THRESHOLD = 3;
export const STARVATION_HP_LOSS = 5;
export const BEER_EFFICIENCY_PENALTY = 2;

export const STAMINA_PER_SALVAGE = 10;
export const SANITY_LOSS_BASE = 5;

export const SANITY_WARNING_THRESHOLD = 40;
export const SANITY_CRITICAL_THRESHOLD = 20;

export const STAMINA_RECOVERY_SHIP = 10;
export const STAMINA_RECOVERY_STATION = 20;
export const STAMINA_RECOVERY_LOUNGE = 30;
export const SANITY_RECOVERY_STATION = 5;
export const SANITY_RECOVERY_LOUNGE = 10;

export const SHORE_LEAVE_OPTIONS = {
  rest: {
    type: "rest" as const,
    cost: 0,
    duration: 1,
    staminaRecovery: 50,
    sanityRecovery: 20,
    eventChance: 0.1,
  },
  recreation: {
    type: "recreation" as const,
    cost: 100,
    duration: 1,
    staminaRecovery: 75,
    sanityRecovery: 40,
    eventChance: 0.3,
  },
  party: {
    type: "party" as const,
    cost: 500,
    duration: 2,
    staminaRecovery: 100,
    sanityRecovery: 80,
    eventChance: 0.6,
    beerPerCrew: 1,
  },
};

export const LUXURY_DRINK_SANITY_BONUS = 15;
export const SKILL_WORK_REDUCTION = 0.15;

export const TRAVEL_EVENT_CHANCE = 0.4;
export const SALVAGE_EVENT_CHANCE = 0.2;
export const DAILY_EVENT_CHANCE = 0.15;

export const PROVISION_PRICES = {
  food: 5,
  water: 3,
  beer: 15,
  wine: 25,
};

export const STARTING_FOOD = 10;
export const STARTING_DRINK = 10;
export const STARTING_LUXURY_DRINK = 2;
