/**
 * Test Fixtures
 * 
 * Typed mock data for tests to avoid `as any` casts.
 */
import type {
  CrewMember,
  GameState,
  Loot,
  Item,
  Wreck,
  Room,
  PlayerShip,
  PlayerStats,
  GameSettings,
  RunState,
  PantryCapacity,
} from '../../src/types';

/**
 * Create a minimal crew member for testing
 */
export function createMockCrew(overrides: Partial<CrewMember> = {}): CrewMember {
  return {
    id: 'crew-test-1',
    firstName: 'Test',
    lastName: 'Crew',
    name: 'Test Crew',
    isPlayer: false,
    background: 'station_rat',
    traits: [],
    skills: { technical: 3, combat: 3, salvage: 3, piloting: 3 },
    skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    sanity: 100,
    maxSanity: 100,
    currentJob: 'idle',
    status: 'active',
    position: { location: 'station' },
    inventory: [],
    ...overrides,
  };
}

/**
 * Create a mock loot item
 */
export function createMockLoot(overrides: Partial<Loot> = {}): Loot {
  return {
    id: `loot-${Date.now()}`,
    name: 'Test Salvage',
    category: 'universal',
    value: 100,
    rarity: 'common',
    itemType: 'material',
    manufacturer: 'TestCorp',
    description: 'A test item',
    ...overrides,
  };
}

/**
 * Create a mock equipment item
 */
export function createMockEquipment(overrides: Partial<Item> = {}): Item {
  return {
    id: `equip-${Date.now()}`,
    name: 'Test Equipment',
    description: 'Test equipment item',
    slotType: 'engineering',
    tier: 1,
    rarity: 'uncommon',
    powerDraw: 1,
    effects: [],
    value: 250,
    ...overrides,
  };
}

/**
 * Create a mock room
 */
export function createMockRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: `room-${Date.now()}`,
    name: 'Test Room',
    hazardLevel: 1,
    hazardType: 'mechanical',
    loot: [],
    looted: false,
    ...overrides,
  };
}

/**
 * Create a mock wreck
 */
export function createMockWreck(overrides: Partial<Wreck> = {}): Wreck {
  return {
    id: `wreck-${Date.now()}`,
    name: 'Test Wreck',
    type: 'industrial',
    tier: 1,
    distance: 1.5,
    rooms: [createMockRoom()],
    stripped: false,
    ...overrides,
  };
}

/**
 * Create mock player stats
 */
export function createMockStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    totalCreditsEarned: 0,
    totalWrecksCleared: 0,
    totalRoomsSalvaged: 0,
    totalItemsCollected: 0,
    highestSingleProfit: 0,
    mostValuableItem: null,
    longestWinStreak: 0,
    deathsAvoided: 0,
    licensesRenewed: 0,
    daysPlayed: 1,
    ...overrides,
  };
}

/**
 * Create mock game settings
 */
export function createMockSettings(overrides: Partial<GameSettings> = {}): GameSettings {
  return {
    autoSave: true,
    confirmDialogs: true,
    showTooltips: true,
    showKeyboardHints: true,
    minCrewHpPercent: 50,
    minCrewStamina: 20,
    minCrewSanity: 20,
    ...overrides,
  };
}

/**
 * Create mock pantry capacity
 */
export function createMockPantry(overrides: Partial<PantryCapacity> = {}): PantryCapacity {
  return {
    food: 10,
    drink: 10,
    luxury: 5,
    ...overrides,
  };
}

/**
 * Create mock run state
 */
export function createMockRunState(wreckId: string, overrides: Partial<RunState> = {}): RunState {
  return {
    wreckId,
    status: 'salvaging',
    timeRemaining: 20,
    collectedLoot: [],
    stats: {
      roomsAttempted: 0,
      roomsSucceeded: 0,
      roomsFailed: 0,
      damageTaken: 0,
      fuelSpent: 0,
      xpGained: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
    },
    ...overrides,
  };
}

/**
 * Create a minimal game state for testing
 */
export function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const crew = createMockCrew({ id: 'captain-1', isPlayer: true });
  return {
    credits: 1000,
    fuel: 50,
    crewRoster: [crew],
    crew: crew,
    selectedCrewId: 'captain-1',
    hireCandidates: [],
    availableWrecks: [],
    currentRun: null,
    inventory: [],
    equipmentInventory: [],
    day: 1,
    licenseDaysRemaining: 14,
    licenseFee: 5000,
    licenseTier: 'basic',
    unlockedZones: ['near'],
    stats: createMockStats(),
    settings: createMockSettings(),
    food: 5,
    drink: 5,
    luxuryDrink: 2,
    pantryCapacity: createMockPantry(),
    daysWithoutFood: 0,
    beerRationDays: 0,
    crewEfficiencyPenalty: 0,
    ...overrides,
  } as GameState;
}
