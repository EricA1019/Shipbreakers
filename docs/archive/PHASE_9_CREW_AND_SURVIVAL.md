# Phase 9: Crew Identity & Survival Systems

**Status**: Ready for Implementation  
**Estimated Duration**: 8-10 days  
**Target Model**: This document is written for smaller parameter models. All code is complete and copy-pasteable. No inference or guessing required.

---

## CRITICAL RULES FOR IMPLEMENTING AGENT

### DO:
- Copy code blocks EXACTLY as written
- Use the EXACT file paths specified
- Run `npm run type-check` after each task to verify no TypeScript errors
- Complete tasks IN ORDER (dependencies exist between tasks)
- Test each component/feature before moving to next task

### DO NOT:
- Guess or infer code that isn't provided
- Skip tasks or change the order
- Modify existing code unless explicitly told to
- Add features not specified in this document
- Use `any` type unless shown in examples

---

## PROJECT STRUCTURE

All paths are relative to: `/home/eric/Typescript/Shipbreakers/ship-breakers/`

```
src/
├── types/
│   └── index.ts              # ALL type definitions go here
├── game/
│   ├── data/                 # Static data files
│   │   ├── equipment.ts      # EXISTING - equipment templates
│   │   ├── reactors.ts       # EXISTING - reactor templates
│   │   ├── playerShip.ts     # EXISTING - player ship init
│   │   ├── crewNames.ts      # NEW - Task 9A-2
│   │   ├── backgrounds.ts    # NEW - Task 9A-3
│   │   ├── traits.ts         # NEW - Task 9A-4
│   │   └── events.ts         # NEW - Task 9H-2
│   ├── systems/              # Game logic services
│   │   ├── slotManager.ts    # EXISTING
│   │   ├── generateWreckGrid.ts # EXISTING - needs bug fix
│   │   ├── CrewGenerator.ts  # NEW - Task 9B-1
│   │   ├── AutoSalvageService.ts # NEW - Task 9G-1
│   │   └── EventManager.ts   # NEW - Task 9H-1
│   ├── constants.ts          # Game balance constants
│   └── hazardLogic.ts        # EXISTING
├── stores/
│   └── gameStore.ts          # Zustand store
└── components/
    ├── screens/
    │   ├── HubScreen.tsx     # EXISTING - add panels
    │   ├── CharacterCreationScreen.tsx # NEW
    │   └── ... other screens
    ├── game/
    │   ├── CrewDot.tsx       # NEW
    │   └── EventModal.tsx    # NEW
    └── ui/
        ├── StationBarPanel.tsx    # NEW
        └── ShoreLeavePanel.tsx    # NEW
```

---

## EXISTING CODE PATTERNS - MUST FOLLOW THESE

### Pattern 1: Type Definitions (types/index.ts)

Types are defined as `export type` or `export interface`. Add new types BEFORE the `GameState` interface.

```typescript
// EXAMPLE - this is how existing types look:
export type HazardType = "mechanical" | "combat" | "environmental" | "security";

export interface Skills {
  technical: number; // 1-5
  combat: number;    // 1-5
  salvage: number;   // 1-5
  piloting: number;  // 1-5
}

export interface CrewMember {
  id: string;
  name: string;
  isPlayer?: boolean;
  skills: Skills;
  skillXp: SkillXp;
  hp: number;
  maxHp: number;
  hiredDay?: number;
  hireCost?: number;
}
```

### Pattern 2: Data Files (game/data/*.ts)

Data files export a constant Record or array. Use descriptive string IDs.

```typescript
// EXAMPLE - this is how game/data/equipment.ts looks:
import type { Item } from "../../types";

export const EQUIPMENT: Record<string, Item> = {
  "cutting-torch": {
    id: "cutting-torch",
    name: "Cutting Torch",
    description: "Handheld torch for cutting.",
    slotType: "engineering",
    tier: 1,
    rarity: "common",
    powerDraw: 1,
    effects: [{ type: "skill_bonus", value: 1, skill: "technical" }],
    manufacturer: "Scrapyard Solutions",
    value: 300,
  },
};
```

### Pattern 3: Store Actions (stores/gameStore.ts)

Actions use `set()` to update state and `get()` to read current state.

```typescript
// EXAMPLE - this is how store actions look:
hireCrew: (candidate: HireCandidate) => {
  const { credits, crewRoster } = get();
  if (credits < candidate.cost) return false;
  if (crewRoster.length >= 5) return false;

  const newCrew: CrewMember = {
    id: candidate.id,
    name: candidate.name,
    // ... more fields
  };

  set({
    credits: credits - candidate.cost,
    crewRoster: [...crewRoster, newCrew],
  });
  return true;
},
```

### Pattern 4: Screen Components

Screens receive `onNavigate` prop and use Tailwind CSS.

```typescript
// EXAMPLE - this is how screens look:
import { useGameStore } from "../../stores/gameStore";
import type { ScreenProps } from "../../types";

export default function ExampleScreen({ onNavigate }: ScreenProps) {
  const { someState } = useGameStore((s) => ({
    someState: s.someState,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4">
        <div className="text-amber-500 font-bold">SCREEN TITLE</div>
      </div>
      <div className="bg-zinc-800 border border-amber-600/20 p-4">
        {/* content */}
      </div>
    </div>
  );
}
```

---

# TASKS - COMPLETE IN ORDER

---

## TASK 9A-1: Fix Equipment Grid Bug

**What**: Equipment items found in wreck rooms are not showing up because the equipment field isn't copied when building the grid.

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/systems/generateWreckGrid.ts`

**Action**: Find the section where room properties are copied to cells (search for `cell.looted`). Add the missing line.

**Find this code** (around lines 135-150):
```typescript
cell.id = src.id;
cell.name = src.name;
cell.hazardLevel = src.hazardLevel;
cell.hazardType = src.hazardType;
cell.loot = src.loot;
cell.looted = src.looted;
```

**Change to**:
```typescript
cell.id = src.id;
cell.name = src.name;
cell.hazardLevel = src.hazardLevel;
cell.hazardType = src.hazardType;
cell.loot = src.loot;
cell.looted = src.looted;
cell.equipment = src.equipment;
```

**Verify**: Run `npm run type-check` - should pass.

---

## TASK 9A-2: Add Phase 9 Types to types/index.ts

**What**: Add all new type definitions needed for crew identity, traits, backgrounds, food/drink, and events.

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/types/index.ts`

**Action**: Add the following code BEFORE the line `export interface GameState {`

Search for `export interface GameState {` and paste this ABOVE it:

```typescript
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
  | "breakdown";

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
}

export interface EventChoice {
  id: string;
  text: string;
  requirements?: EventRequirement;
  effects: EventEffect[];
}

export interface GameEvent {
  id: string;
  trigger: EventTrigger;
  title: string;
  description: string;
  choices: EventChoice[];
  requirements?: EventRequirement;
  weight: number;
}

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
```

**Next**: Also modify the existing `CrewMember` interface. Find this:

```typescript
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
```

**Replace entire interface with**:

```typescript
export interface CrewMember {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  isPlayer?: boolean;
  background: BackgroundId;
  traits: TraitId[];
  skills: Skills;
  skillXp: SkillXp;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  sanity: number;
  maxSanity: number;
  position?: CrewPosition;
  currentJob: CrewJob;
  status: CrewStatus;
  hiredDay?: number;
  hireCost?: number;
}
```

**Next**: Add fields to `GameState`. Find `export interface GameState {` and add these fields at the end (before the closing `}`):

```typescript
  // Phase 9: Provisions
  food: number;
  drink: number;
  luxuryDrink: number;
  pantryCapacity: PantryCapacity;
  daysWithoutFood: number;
  beerRationDays: number;
  activeEvent?: GameEvent | null;
  isNewGame?: boolean;
```

**Verify**: Run `npm run type-check` - will have errors until store is updated.

---

## TASK 9A-3: Create crewNames.ts

**What**: Data file with first and last name arrays for procedural crew generation.

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/data/crewNames.ts`

**Full content**:

```typescript
/**
 * Crew name data for procedural generation.
 */

export const FIRST_NAMES: string[] = [
  "Kai", "Yuki", "Chen", "Hana", "Jin", "Mei", "Takeshi", "Akira", "Suki", "Ren",
  "Aisha", "Raj", "Priya", "Vikram", "Deepa", "Arjun",
  "Dmitri", "Katya", "Nikolai", "Anya", "Ivan", "Mila",
  "Marcus", "Elena", "Victor", "Lucia", "Felix", "Clara",
  "Carlos", "Rosa", "Diego", "Sofia", "Miguel", "Luna",
  "Amara", "Kofi", "Zara", "Jabari", "Nia", "Kwame",
  "Omar", "Fatima", "Hassan", "Layla", "Samir", "Nadia",
  "Nova", "Rook", "Jax", "Sable", "Vex", "Cipher", "Ash", "Storm", "Blaze", "Echo",
];

export const LAST_NAMES: string[] = [
  "Tanaka", "Kim", "Wong", "Nakamura", "Park", "Nguyen", "Chen", "Yamamoto", "Lee", "Sato",
  "Singh", "Patel", "Sharma", "Kumar", "Gupta", "Khan",
  "Petrov", "Volkov", "Kozlov", "Novak", "Ivanov", "Morozov",
  "Mueller", "Schmidt", "Bernard", "Rossi", "Fischer", "Weber",
  "Vasquez", "Reyes", "Morales", "Santos", "Ortega", "Cruz",
  "Okonkwo", "Mensah", "Diallo", "Mbeki", "Nkosi", "Toure",
  "Hassan", "Nazari", "Khalil", "Abbasi", "Farouk", "Mansour",
  "Steele", "Vance", "Cross", "Stone", "Drake", "Frost", "Cole", "Quinn", "Reeve", "Locke",
];

export function getRandomFirstName(randomFn: () => number): string {
  const index = Math.floor(randomFn() * FIRST_NAMES.length);
  return FIRST_NAMES[index];
}

export function getRandomLastName(randomFn: () => number): string {
  const index = Math.floor(randomFn() * LAST_NAMES.length);
  return LAST_NAMES[index];
}

export function generateFullName(randomFn: () => number): {
  firstName: string;
  lastName: string;
  name: string;
} {
  const firstName = getRandomFirstName(randomFn);
  const lastName = getRandomLastName(randomFn);
  return { firstName, lastName, name: `${firstName} ${lastName}` };
}
```

**Verify**: Run `npm run type-check` - this file should pass.

---

## TASK 9A-4: Create backgrounds.ts

**What**: Data file with crew background definitions.

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/data/backgrounds.ts`

**Full content**:

```typescript
import type { CrewBackground, BackgroundId } from "../../types";

export const BACKGROUNDS: Record<BackgroundId, CrewBackground> = {
  ship_captain: {
    id: "ship_captain",
    name: "Ship Captain",
    description: "You earned your license the hard way. Balanced skills.",
    skillModifiers: {},
    traitPool: ["steady", "brave", "pragmatic", "veteran"],
    statModifiers: {},
  },
  ex_military: {
    id: "ex_military",
    name: "Ex-Military",
    description: "Former corporate soldier. Combat-trained.",
    skillModifiers: { combat: 1 },
    traitPool: ["brave", "veteran", "paranoid", "loyal"],
    statModifiers: { sanity: -10 },
  },
  station_rat: {
    id: "station_rat",
    name: "Station Rat",
    description: "Grew up in maintenance shafts. Knows machines.",
    skillModifiers: { technical: 1 },
    traitPool: ["lucky", "paranoid", "quiet", "efficient"],
    statModifiers: {},
  },
  freighter_pilot: {
    id: "freighter_pilot",
    name: "Freighter Pilot",
    description: "Ran cargo routes for years. Steady hands.",
    skillModifiers: { piloting: 1 },
    traitPool: ["steady", "addicted", "pragmatic", "tireless"],
    statModifiers: {},
  },
  scrap_diver: {
    id: "scrap_diver",
    name: "Scrap Diver",
    description: "Illegal wreck salvager. Knows where loot hides.",
    skillModifiers: { salvage: 1 },
    traitPool: ["lucky", "reckless", "greedy", "eagle_eye"],
    statModifiers: {},
  },
  corporate_exile: {
    id: "corporate_exile",
    name: "Corporate Exile",
    description: "Fled a megacorp. Smart but not violent.",
    skillModifiers: { technical: 1, combat: -1 },
    traitPool: ["paranoid", "idealist", "coward", "efficient"],
    statModifiers: {},
  },
  dock_worker: {
    id: "dock_worker",
    name: "Dock Worker",
    description: "Years of freight built endurance.",
    skillModifiers: {},
    traitPool: ["tireless", "loyal", "quiet", "pragmatic"],
    statModifiers: { stamina: 20 },
  },
  medical_dropout: {
    id: "medical_dropout",
    name: "Medical Dropout",
    description: "Failed med school but can patch people up.",
    skillModifiers: {},
    traitPool: ["efficient", "idealist", "paranoid", "quiet"],
    statModifiers: {},
  },
  enforcer: {
    id: "enforcer",
    name: "Enforcer",
    description: "Debt collector. Loyal to those who pay.",
    skillModifiers: { combat: 1 },
    traitPool: ["brave", "loyal", "greedy", "reckless"],
    statModifiers: {},
  },
  smuggler: {
    id: "smuggler",
    name: "Smuggler",
    description: "Ran contraband. Quick hands, loose morals.",
    skillModifiers: { piloting: 1 },
    traitPool: ["greedy", "lucky", "reckless", "efficient"],
    statModifiers: {},
  },
  colonist: {
    id: "colonist",
    name: "Colonist",
    description: "Survivor of a failed colony. Makes do with nothing.",
    skillModifiers: { salvage: 1 },
    traitPool: ["idealist", "steady", "tireless", "lucky"],
    statModifiers: { stamina: 10, sanity: -5 },
  },
};

export function getHireableBackgrounds(): BackgroundId[] {
  return Object.keys(BACKGROUNDS).filter(
    (id) => id !== "ship_captain"
  ) as BackgroundId[];
}

export function getRandomBackground(randomFn: () => number): BackgroundId {
  const hireable = getHireableBackgrounds();
  const index = Math.floor(randomFn() * hireable.length);
  return hireable[index];
}
```

**Verify**: Run `npm run type-check` - this file should pass.

---

## TASK 9A-5: Create traits.ts

**What**: Data file with trait definitions and effects.

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/data/traits.ts`

**Full content**:

```typescript
import type { CrewTrait, TraitId } from "../../types";

export const TRAITS: Record<TraitId, CrewTrait> = {
  // POSITIVE
  brave: {
    id: "brave",
    name: "Brave",
    description: "Faces danger head-on. Won't flee.",
    category: "positive",
    effects: [
      { type: "event_chance", target: "horror", value: -20, description: "+20% horror resist" },
    ],
  },
  lucky: {
    id: "lucky",
    name: "Lucky",
    description: "Fortune favors them.",
    category: "positive",
    effects: [
      { type: "event_chance", target: "all", value: 5, description: "+5% all rolls" },
    ],
  },
  efficient: {
    id: "efficient",
    name: "Efficient",
    description: "Gets work done faster.",
    category: "positive",
    effects: [
      { type: "work_speed", value: -15, description: "-15% work time" },
    ],
  },
  eagle_eye: {
    id: "eagle_eye",
    name: "Eagle Eye",
    description: "Spots hidden loot.",
    category: "positive",
    effects: [
      { type: "loot_bonus", value: 10, description: "+10% loot discovery" },
    ],
  },
  loyal: {
    id: "loyal",
    name: "Loyal",
    description: "Bonds deeply with crewmates.",
    category: "positive",
    effects: [
      { type: "sanity_mod", target: "crew_bond", value: 10, description: "+10 sanity from bonding" },
    ],
  },
  steady: {
    id: "steady",
    name: "Steady",
    description: "Unflappable under pressure.",
    category: "positive",
    effects: [
      { type: "sanity_mod", target: "loss_rate", value: -30, description: "-30% sanity loss" },
    ],
  },
  tireless: {
    id: "tireless",
    name: "Tireless",
    description: "Keeps going when others rest.",
    category: "positive",
    effects: [
      { type: "stamina_mod", target: "consumption", value: -20, description: "-20% stamina use" },
    ],
  },

  // NEGATIVE
  greedy: {
    id: "greedy",
    name: "Greedy",
    description: "May pocket small items.",
    category: "negative",
    effects: [
      { type: "special", value: 1, description: "5% steal chance" },
    ],
  },
  coward: {
    id: "coward",
    name: "Coward",
    description: "May flee from danger.",
    category: "negative",
    effects: [
      { type: "special", value: 1, description: "20% flee chance" },
    ],
  },
  reckless: {
    id: "reckless",
    name: "Reckless",
    description: "Higher chance of injury.",
    category: "negative",
    effects: [
      { type: "event_chance", target: "injury", value: 15, description: "+15% injury chance" },
    ],
  },
  lazy: {
    id: "lazy",
    name: "Lazy",
    description: "Work takes longer.",
    category: "negative",
    effects: [
      { type: "work_speed", value: 25, description: "+25% work time" },
    ],
  },
  paranoid: {
    id: "paranoid",
    name: "Paranoid",
    description: "Worse social outcomes.",
    category: "negative",
    effects: [
      { type: "event_chance", target: "social", value: -20, description: "-20% social outcomes" },
    ],
  },
  addicted: {
    id: "addicted",
    name: "Addicted",
    description: "Needs luxury drinks.",
    category: "negative",
    effects: [
      { type: "sanity_mod", target: "no_luxury", value: -10, description: "-10 sanity/day without luxury" },
    ],
  },
  clumsy: {
    id: "clumsy",
    name: "Clumsy",
    description: "More equipment damage.",
    category: "negative",
    effects: [
      { type: "event_chance", target: "equipment_damage", value: 10, description: "+10% damage chance" },
    ],
  },

  // NEUTRAL
  quiet: {
    id: "quiet",
    name: "Quiet",
    description: "Fewer social events.",
    category: "neutral",
    effects: [
      { type: "event_chance", target: "social", value: -50, description: "-50% social events" },
    ],
  },
  veteran: {
    id: "veteran",
    name: "Veteran",
    description: "Better combat, worse horror resist.",
    category: "neutral",
    effects: [
      { type: "skill_mod", target: "combat", value: 10, description: "+10% combat" },
      { type: "event_chance", target: "horror", value: 10, description: "-10% horror resist" },
    ],
  },
  idealist: {
    id: "idealist",
    name: "Idealist",
    description: "Strong reactions to moral choices.",
    category: "neutral",
    effects: [
      { type: "sanity_mod", target: "good_event", value: 15, description: "+15 from good outcomes" },
      { type: "sanity_mod", target: "bad_event", value: -15, description: "-15 from bad outcomes" },
    ],
  },
  pragmatic: {
    id: "pragmatic",
    name: "Pragmatic",
    description: "Unaffected by moral choices.",
    category: "neutral",
    effects: [
      { type: "special", value: 1, description: "No moral sanity change" },
    ],
  },
};

export function getPositiveTraits(): TraitId[] {
  return Object.values(TRAITS)
    .filter((t) => t.category === "positive")
    .map((t) => t.id);
}

export function getNegativeTraits(): TraitId[] {
  return Object.values(TRAITS)
    .filter((t) => t.category === "negative")
    .map((t) => t.id);
}

export function getNeutralTraits(): TraitId[] {
  return Object.values(TRAITS)
    .filter((t) => t.category === "neutral")
    .map((t) => t.id);
}

export function getRandomTraits(
  pool: TraitId[],
  count: number,
  randomFn: () => number
): TraitId[] {
  const shuffled = [...pool].sort(() => randomFn() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
```

**Verify**: Run `npm run type-check` - this file should pass.

---

## TASK 9A-6: Add Constants to constants.ts

**What**: Add balance constants for Phase 9 systems.

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/constants.ts`

**Action**: Add the following at the END of the file:

```typescript
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
```

**Verify**: Run `npm run type-check` - should pass.

---

## TASK 9B-1: Create CrewGenerator.ts

**What**: Service for generating crew members with names, backgrounds, traits, and stats.

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/systems/CrewGenerator.ts`

**Full content**:

```typescript
import type {
  CrewMember,
  Skills,
  BackgroundId,
  TraitId,
  HireCandidate,
} from "../../types";
import { generateFullName } from "../data/crewNames";
import { BACKGROUNDS, getRandomBackground } from "../data/backgrounds";
import { TRAITS, getPositiveTraits } from "../data/traits";
import { BASE_STAMINA, BASE_SANITY } from "../constants";

export class SeededRandom {
  private seed: number;

  constructor(seed: string | number) {
    if (typeof seed === "string") {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      this.seed = Math.abs(hash);
    } else {
      this.seed = seed;
    }
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export function generateSkills(
  background: BackgroundId,
  rng: SeededRandom
): Skills {
  const bg = BACKGROUNDS[background];
  const skills: Skills = {
    technical: rng.nextInt(1, 4),
    combat: rng.nextInt(1, 4),
    salvage: rng.nextInt(1, 4),
    piloting: rng.nextInt(1, 4),
  };

  if (bg.skillModifiers) {
    for (const [skill, mod] of Object.entries(bg.skillModifiers)) {
      const s = skill as keyof Skills;
      skills[s] = Math.max(1, Math.min(5, skills[s] + (mod || 0)));
    }
  }

  return skills;
}

export function generateTraits(
  background: BackgroundId,
  rng: SeededRandom
): TraitId[] {
  const bg = BACKGROUNDS[background];
  const traits: TraitId[] = [];

  if (bg.traitPool.length > 0 && rng.next() < 0.7) {
    const poolIndex = Math.floor(rng.next() * bg.traitPool.length);
    const poolTrait = bg.traitPool[poolIndex];
    if (poolTrait && TRAITS[poolTrait]) {
      traits.push(poolTrait);
    }
  }

  if (rng.next() < 0.3) {
    const allTraits = Object.keys(TRAITS) as TraitId[];
    const available = allTraits.filter((t) => !traits.includes(t));
    if (available.length > 0) {
      const index = Math.floor(rng.next() * available.length);
      traits.push(available[index]);
    }
  }

  return traits;
}

export function generateCrewMember(
  id: string,
  rng: SeededRandom,
  overrides?: Partial<CrewMember>
): CrewMember {
  const background = overrides?.background || getRandomBackground(() => rng.next());
  const bg = BACKGROUNDS[background];
  const nameData = generateFullName(() => rng.next());
  const skills = generateSkills(background, rng);
  const traits = overrides?.traits || generateTraits(background, rng);

  const staminaMod = bg.statModifiers?.stamina || 0;
  const sanityMod = bg.statModifiers?.sanity || 0;
  const maxStamina = BASE_STAMINA + staminaMod;
  const maxSanity = BASE_SANITY + sanityMod;

  return {
    id,
    firstName: overrides?.firstName || nameData.firstName,
    lastName: overrides?.lastName || nameData.lastName,
    name: overrides?.name || nameData.name,
    isPlayer: overrides?.isPlayer || false,
    background,
    traits,
    skills: overrides?.skills || skills,
    skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
    hp: 100,
    maxHp: 100,
    stamina: maxStamina,
    maxStamina,
    sanity: maxSanity,
    maxSanity,
    currentJob: "idle",
    status: "active",
    ...overrides,
  };
}

export function generateCaptain(
  firstName: string,
  lastName: string,
  lockedTrait: TraitId,
  chosenTrait: TraitId
): CrewMember {
  const rng = new SeededRandom(`captain-${firstName}-${lastName}`);
  return generateCrewMember("captain-1", rng, {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    isPlayer: true,
    background: "ship_captain",
    traits: [lockedTrait, chosenTrait],
    skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
    skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
  });
}

export function generateHireCandidates(
  day: number,
  count: number = 3
): HireCandidate[] {
  const rng = new SeededRandom(`hire-${day}`);
  const candidates: HireCandidate[] = [];

  for (let i = 0; i < count; i++) {
    const id = `hire-${day}-${i}`;
    const crew = generateCrewMember(id, rng);
    const totalSkill =
      crew.skills.technical +
      crew.skills.combat +
      crew.skills.salvage +
      crew.skills.piloting;
    const cost = 500 + totalSkill * 100;

    candidates.push({
      id,
      name: crew.name,
      skills: crew.skills,
      cost,
    });
  }

  return candidates;
}

export function getCharacterCreationTraitOptions(seed: string): {
  lockedTrait: TraitId;
  options: TraitId[];
} {
  const rng = new SeededRandom(seed);
  const positive = getPositiveTraits();
  const shuffled = [...positive].sort(() => rng.next() - 0.5);

  return {
    lockedTrait: shuffled[0],
    options: shuffled.slice(1, 4),
  };
}
```

**Verify**: Run `npm run type-check` - should pass.

---

## TASK 9B-2: Update gameStore.ts Initial State

**What**: Update the store with new initial state for Phase 9.

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/stores/gameStore.ts`

**Step 1**: Add new imports at top of file (after existing imports):

```typescript
import {
  generateHireCandidates,
} from "../game/systems/CrewGenerator";
import {
  PANTRY_CAPACITY,
  STARTING_FOOD,
  STARTING_DRINK,
  STARTING_LUXURY_DRINK,
  BASE_STAMINA,
  BASE_SANITY,
} from "../game/constants";
```

**Step 2**: Find the initial `crewRoster` array (around line 80-95). Replace the entire array with:

```typescript
      crewRoster: [
        {
          id: "captain-1",
          firstName: "Player",
          lastName: "Captain",
          name: "Player Captain",
          isPlayer: true,
          background: "ship_captain" as const,
          traits: ["steady", "pragmatic"] as const,
          skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
          skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
          hp: STARTING_HP,
          maxHp: STARTING_HP,
          stamina: BASE_STAMINA,
          maxStamina: BASE_STAMINA,
          sanity: BASE_SANITY,
          maxSanity: BASE_SANITY,
          currentJob: "idle" as const,
          status: "active" as const,
        },
      ],
```

**Step 3**: Find `cargoSwapPending: null,` and add after it:

```typescript
      // Phase 9: Provisions
      food: STARTING_FOOD,
      drink: STARTING_DRINK,
      luxuryDrink: STARTING_LUXURY_DRINK,
      pantryCapacity: PANTRY_CAPACITY,
      daysWithoutFood: 0,
      beerRationDays: 0,
      activeEvent: null,
      isNewGame: true,
```

**Step 4**: Find the `dailyMarketRefresh` action and replace it:

```typescript
      dailyMarketRefresh: () => {
        const { day } = get();
        const candidates = generateHireCandidates(day, 3);
        set({ hireCandidates: candidates });
      },
```

**Step 5**: Also update the `crew` field to match new structure. Find:
```typescript
      crew: {
        name: "Player",
        skills: STARTING_SKILLS as any,
        // ...
      } as any,
```

Replace with:
```typescript
      crew: {
        id: "captain-1",
        firstName: "Player",
        lastName: "Captain", 
        name: "Player Captain",
        isPlayer: true,
        background: "ship_captain",
        traits: ["steady", "pragmatic"],
        skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
        skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
        hp: STARTING_HP,
        maxHp: STARTING_HP,
        stamina: BASE_STAMINA,
        maxStamina: BASE_STAMINA,
        sanity: BASE_SANITY,
        maxSanity: BASE_SANITY,
        currentJob: "idle",
        status: "active",
      } as any,
```

**Verify**: Run `npm run type-check` - some errors may remain for components.

---

## REMAINING TASKS SUMMARY

The tasks below are **fully written**. Copy/paste exactly.

> IMPORTANT: These tasks assume you have already completed Tasks 9A-1 through 9B-2 and TypeScript errors are limited to “not yet migrated UI” items.

---

## TASK 9C-0: Add Missing Screen + Event Store Actions

This task adds store actions required by Character Creation and Events.

### 9C-0A: Update `GameActions` interface

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/stores/gameStore.ts`

Find `interface GameActions {` and add these method signatures anywhere inside it:

```typescript
  // Phase 9
  createCaptain: (args: {
    firstName: string;
    lastName: string;
    lockedTrait: any;
    chosenTrait: any;
  }) => void;
  debugSkipCharacterCreation: () => void;

  // Events
  resolveActiveEvent: (choiceId: string) => void;
  dismissActiveEvent: () => void;
```

> NOTE: `lockedTrait/chosenTrait` are `TraitId` once Task 9A-2 is applied everywhere. We keep `any` here to avoid an ordering trap during migration.

### 9C-0B: Implement actions in the store

Still in `/home/eric/Typescript/Shipbreakers/ship-breakers/src/stores/gameStore.ts`, add these imports near the top with the other imports (after Task 9B-2 imports):

```typescript
import type { TraitId, GameEvent, EventTrigger } from "../types";
import { generateCaptain, getCharacterCreationTraitOptions } from "../game/systems/CrewGenerator";
import { pickEventByTrigger, applyEventChoice } from "../game/systems/EventManager";
```

Now scroll to the store actions object (inside `(set, get) => ({ ... })`). Add these actions near other actions (recommended: right after `initializeGame`):

```typescript
      createCaptain: ({ firstName, lastName, lockedTrait, chosenTrait }) => {
        const captain = generateCaptain(
          firstName,
          lastName,
          lockedTrait as TraitId,
          chosenTrait as TraitId,
        );

        set((state) => ({
          crewRoster: [captain],
          crew: captain as any,
          selectedCrewId: captain.id,
          isNewGame: false,
        }));

        // Refresh market after creation so hires match new day/seed
        get().dailyMarketRefresh();
      },

      debugSkipCharacterCreation: () => {
        set({ isNewGame: false });
      },

      resolveActiveEvent: (choiceId: string) => {
        const current = get().activeEvent;
        if (!current) return;
        const choice = current.choices.find((c) => c.id === choiceId);
        if (!choice) return;

        set((state) => applyEventChoice(state as any, current, choice) as any);
        set({ activeEvent: null });
      },

      dismissActiveEvent: () => {
        set({ activeEvent: null });
      },
```

---

## TASK 9C-1: Create CharacterCreationScreen.tsx

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/screens/CharacterCreationScreen.tsx`

**Full content**:

```tsx
import { useMemo, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import CyberPanel from "../ui/CyberPanel";
import CyberButton from "../ui/CyberButton";
import type { ScreenProps, TraitId } from "../../types";
import { getCharacterCreationTraitOptions } from "../../game/systems/CrewGenerator";
import { TRAITS } from "../../game/data/traits";

export default function CharacterCreationScreen({ onNavigate }: ScreenProps) {
  const { createCaptain } = useGameStore((s) => ({
    createCaptain: (s as any).createCaptain,
  }));

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [chosenTrait, setChosenTrait] = useState<TraitId | "">("");

  const seed = useMemo(() => {
    const f = firstName.trim() || "Player";
    const l = lastName.trim() || "Captain";
    return `cc-${f}-${l}`;
  }, [firstName, lastName]);

  const traitPick = useMemo(() => getCharacterCreationTraitOptions(seed), [seed]);
  const lockedTrait = traitPick.lockedTrait;
  const options = traitPick.options;

  const canStart = firstName.trim().length > 0 && lastName.trim().length > 0 && chosenTrait !== "";

  const begin = () => {
    if (!canStart) return;
    createCaptain({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      lockedTrait,
      chosenTrait: chosenTrait as TraitId,
    });
    onNavigate("hub");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <CyberPanel title="NEW GAME // CAPTAIN CREATION" className="mb-4">
        <div className="text-zinc-300 text-sm">
          Enter your captain name. You start with 1 locked trait and choose 1 from 3.
        </div>
      </CyberPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CyberPanel title="IDENTITY">
          <div className="space-y-3">
            <div>
              <div className="text-zinc-400 text-xs mb-1">FIRST NAME</div>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-zinc-950 border border-amber-600/20 px-3 py-2 text-amber-50"
                placeholder="e.g., Kai"
              />
            </div>
            <div>
              <div className="text-zinc-400 text-xs mb-1">LAST NAME</div>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-zinc-950 border border-amber-600/20 px-3 py-2 text-amber-50"
                placeholder="e.g., Vance"
              />
            </div>
            <div className="text-zinc-500 text-xs">
              Preview: <span className="text-amber-200">{(firstName || "Player").trim()} {(lastName || "Captain").trim()}</span>
            </div>
          </div>
        </CyberPanel>

        <CyberPanel title="TRAITS">
          <div className="space-y-3">
            <div className="bg-zinc-950 border border-amber-600/20 p-3">
              <div className="text-amber-400 text-xs font-bold">LOCKED TRAIT</div>
              <div className="text-amber-100 font-bold">{TRAITS[lockedTrait]?.name ?? lockedTrait}</div>
              <div className="text-zinc-400 text-xs">{TRAITS[lockedTrait]?.description ?? ""}</div>
            </div>

            <div className="text-amber-400 text-xs font-bold">CHOOSE ONE</div>
            <div className="space-y-2">
              {options.map((id) => (
                <label
                  key={id}
                  className={`block cursor-pointer border p-3 bg-zinc-950 transition ${
                    chosenTrait === id ? "border-amber-500" : "border-amber-600/20 hover:border-amber-500/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="trait"
                      checked={chosenTrait === id}
                      onChange={() => setChosenTrait(id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-amber-100 font-bold">{TRAITS[id]?.name ?? id}</div>
                      <div className="text-zinc-400 text-xs">{TRAITS[id]?.description ?? ""}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <CyberButton
                variant="primary"
                glowColor="amber"
                onClick={begin}
                disabled={!canStart}
                className="w-full"
              >
                Begin
              </CyberButton>
            </div>
          </div>
        </CyberPanel>
      </div>
    </div>
  );
}
```

---

## TASK 9C-2: Gate App Startup on Character Creation

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/App.tsx`

### 9C-2A: Import the screen and the store

Add imports:

```tsx
import CharacterCreationScreen from "./components/screens/CharacterCreationScreen";
import { useGameStore } from "./stores/gameStore";
```

### 9C-2B: Render CharacterCreationScreen when `isNewGame` is true

Inside `AppContent()`, add:

```tsx
  const isNewGame = useGameStore((s) => (s as any).isNewGame);
```

Then, in the returned JSX, render creation before the other screens:

```tsx
      {isNewGame && <CharacterCreationScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "hub" && <HubScreen onNavigate={(s) => setScreen(s)} />}
```

And update each other screen line to also be guarded by `!isNewGame`:

```tsx
      {!isNewGame && screen === "select" && <WreckSelectScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "travel" && <TravelScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "salvage" && <SalvageScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "summary" && <RunSummaryScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "sell" && <SellScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "gameover" && <GameOverScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "crew" && <CrewScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "shipyard" && <ShipyardScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "shop" && <EquipmentShopScreen onNavigate={(s) => setScreen(s)} />}
```

---

## TASK 9C-3: Add Debug Skip in DevTools

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/debug/DevTools.tsx`

In the `state` tab area (where it shows JSON), add a small button above the `<pre>`:

Find:

```tsx
          {activeTab === "state" && (
            <div className="h-full overflow-y-auto p-4">
              <pre className="text-green-400/80 whitespace-pre-wrap">
```

Change to:

```tsx
          {activeTab === "state" && (
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-3 flex gap-2">
                <button
                  className="bg-zinc-800 text-amber-400 border border-amber-600/30 px-3 py-1 rounded hover:bg-zinc-700"
                  onClick={() => (state as any).debugSkipCharacterCreation?.()}
                >
                  Skip Character Creation
                </button>
              </div>
              <pre className="text-green-400/80 whitespace-pre-wrap">
```

---

## TASK 9D-1: Create CrewDot.tsx

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/game/CrewDot.tsx`

```tsx
import type { CrewMember } from "../../types";

function dominantSkill(crew: CrewMember): keyof CrewMember["skills"] {
  const entries = Object.entries(crew.skills) as Array<[
    keyof CrewMember["skills"],
    number
  ]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "technical";
}

function skillColor(skill: string): string {
  if (skill === "combat") return "bg-red-500";
  if (skill === "salvage") return "bg-green-500";
  if (skill === "piloting") return "bg-cyan-500";
  return "bg-amber-500";
}

export default function CrewDot({ crew }: { crew: CrewMember }) {
  const skill = dominantSkill(crew);
  const initials = `${crew.firstName?.[0] ?? crew.name?.[0] ?? "?"}${crew.lastName?.[0] ?? ""}`.toUpperCase();

  const title = `${crew.name}\nHP: ${crew.hp}/${crew.maxHp}\nSTA: ${crew.stamina}/${crew.maxStamina}\nSAN: ${crew.sanity}/${crew.maxSanity}`;

  return (
    <div
      title={title}
      className={`w-5 h-5 rounded-full ${skillColor(String(skill))} text-zinc-900 flex items-center justify-center text-[10px] font-black border border-zinc-900/50`}
    >
      {initials}
    </div>
  );
}
```

---

## TASK 9D-2: Render Crew Dots in ShipGrid

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/game/ShipGrid.tsx`

### 9D-2A: Add imports and prop

At the top, update the import line to include `CrewMember`:

```tsx
import type { Ship as ShipType, GridRoom, GridPosition, CrewMember } from "../../types";
```

Add import:

```tsx
import CrewDot from "./CrewDot";
```

In `ShipGridProps`, add:

```tsx
  crewRoster?: CrewMember[];
```

In component args destructure, add `crewRoster`:

```tsx
  crewRoster,
```

### 9D-2B: In layout mode, render dots inside each room

Find the room JSX inside the `rooms.map((r, idx) => { ... return ( <div ...> ... </div> ); })`.

Inside the room `<div>` (near the top), add this block (after the sealed lock and before the room name is fine):

```tsx
                  {gridRoom && crewRoster && crewRoster.length > 0 && (
                    <div className="absolute left-1 bottom-1 flex gap-1">
                      {crewRoster
                        .filter((c) => c.position?.roomId === gridRoom.id)
                        .slice(0, 3)
                        .map((c) => (
                          <CrewDot key={c.id} crew={c} />
                        ))}
                    </div>
                  )}
```

### 9D-2C: In grid mode, render dots inside each room

In the second render branch (the `return ( <div className="bg-zinc-900 ..."> ... )` branch), inside each room cell `<div ...>`, add the same block:

```tsx
                {crewRoster && crewRoster.length > 0 && (
                  <div className="absolute left-1 bottom-1 flex gap-1">
                    {crewRoster
                      .filter((c) => c.position?.roomId === room.id)
                      .slice(0, 3)
                      .map((c) => (
                        <CrewDot key={c.id} crew={c} />
                      ))}
                  </div>
                )}
```

---

## TASK 9E-1: Create StationBarPanel.tsx

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/ui/StationBarPanel.tsx`

```tsx
import { useGameStore } from "../../stores/gameStore";
import CyberPanel from "./CyberPanel";
import CyberButton from "./CyberButton";
import { PROVISION_PRICES } from "../../game/constants";

type ProvisionKey = "food" | "water" | "beer" | "wine";

export default function StationBarPanel() {
  const {
    credits,
    food,
    drink,
    luxuryDrink,
    pantryCapacity,
    buyProvision,
  } = useGameStore((s) => ({
    credits: s.credits,
    food: (s as any).food ?? 0,
    drink: (s as any).drink ?? 0,
    luxuryDrink: (s as any).luxuryDrink ?? 0,
    pantryCapacity: (s as any).pantryCapacity ?? { food: 0, drink: 0, luxury: 0 },
    buyProvision: (s as any).buyProvision as ((k: ProvisionKey) => void) | undefined,
  }));

  const canBuyFood = credits >= PROVISION_PRICES.food && food < pantryCapacity.food;
  const canBuyWater = credits >= PROVISION_PRICES.water && drink < pantryCapacity.drink;
  const canBuyBeer = credits >= PROVISION_PRICES.beer && luxuryDrink < pantryCapacity.luxury;
  const canBuyWine = credits >= PROVISION_PRICES.wine && luxuryDrink < pantryCapacity.luxury;

  return (
    <CyberPanel title="STATION BAR // PROVISIONS">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-950 border border-amber-600/20 p-2">
            <div className="text-zinc-400 text-xs">FOOD</div>
            <div className="text-amber-100 font-bold">
              {food}/{pantryCapacity.food}
            </div>
          </div>
          <div className="bg-zinc-950 border border-amber-600/20 p-2">
            <div className="text-zinc-400 text-xs">WATER</div>
            <div className="text-amber-100 font-bold">
              {drink}/{pantryCapacity.drink}
            </div>
          </div>
          <div className="bg-zinc-950 border border-amber-600/20 p-2">
            <div className="text-zinc-400 text-xs">LUXURY</div>
            <div className="text-amber-100 font-bold">
              {luxuryDrink}/{pantryCapacity.luxury}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CyberButton
            variant="secondary"
            onClick={() => buyProvision?.("food")}
            disabled={!buyProvision || !canBuyFood}
            className="text-xs"
          >
            Buy Food (+1) — {PROVISION_PRICES.food} CR
          </CyberButton>
          <CyberButton
            variant="secondary"
            onClick={() => buyProvision?.("water")}
            disabled={!buyProvision || !canBuyWater}
            className="text-xs"
          >
            Buy Water (+1) — {PROVISION_PRICES.water} CR
          </CyberButton>
          <CyberButton
            variant="secondary"
            onClick={() => buyProvision?.("beer")}
            disabled={!buyProvision || !canBuyBeer}
            className="text-xs"
          >
            Buy Beer (+1) — {PROVISION_PRICES.beer} CR
          </CyberButton>
          <CyberButton
            variant="secondary"
            onClick={() => buyProvision?.("wine")}
            disabled={!buyProvision || !canBuyWine}
            className="text-xs"
          >
            Buy Wine (+1) — {PROVISION_PRICES.wine} CR
          </CyberButton>
        </div>

        <div className="text-zinc-500 text-xs">
          Beer/wine count as luxury. If you drink luxury instead of water, you take a small efficiency penalty next day.
        </div>
      </div>
    </CyberPanel>
  );
}
```

---

## TASK 9E-2: Add StationBarPanel to HubScreen

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/screens/HubScreen.tsx`

Add import:

```tsx
import StationBarPanel from "../ui/StationBarPanel";
import ShoreLeavePanel from "../ui/ShoreLeavePanel";
```

Then, in the left column (`<div className="col-span-3 space-y-4">`), place these panels **below** the crew panel (after the `CyberPanel title="CREW ROSTER"` block):

```tsx
          <StationBarPanel />
          <ShoreLeavePanel />
```

---

## TASK 9E-3: Implement Provision Buy + Daily Consumption

### 9E-3A: Add buyProvision action

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/stores/gameStore.ts`

Add this signature to `GameActions`:

```typescript
  buyProvision: (kind: "food" | "water" | "beer" | "wine") => boolean;
```

Add this implementation inside the store actions:

```typescript
      buyProvision: (kind) => {
        const state: any = get();
        const prices = (await import("../game/constants")).PROVISION_PRICES;
        const pantry = state.pantryCapacity;
        if (!pantry) return false;

        const price = prices[kind];
        if (state.credits < price) return false;

        if (kind === "food") {
          if (state.food >= pantry.food) return false;
          set({ credits: state.credits - price, food: state.food + 1 });
          return true;
        }
        if (kind === "water") {
          if (state.drink >= pantry.drink) return false;
          set({ credits: state.credits - price, drink: state.drink + 1 });
          return true;
        }
        // beer/wine => luxury
        if (state.luxuryDrink >= pantry.luxury) return false;
        set({ credits: state.credits - price, luxuryDrink: state.luxuryDrink + 1 });
        return true;
      },
```

> If your linter complains about the `await import`, replace it with a static import at top: `import { PROVISION_PRICES } from "../game/constants";` and use it directly.

### 9E-3B: Add daily consumption to `returnToStation`

Still in `/home/eric/Typescript/Shipbreakers/ship-breakers/src/stores/gameStore.ts`.

In `returnToStation`, after `const daysSpent = ...` compute provisions and penalties before calling `set(...)`.

Add this block immediately after `const daysSpent = ...`:

```typescript
        const crewCount = (get().crewRoster || []).length;
        const dailyFood = 1 * crewCount;
        const dailyDrink = 1 * crewCount;

        let food = (get() as any).food ?? 0;
        let drink = (get() as any).drink ?? 0;
        let luxuryDrink = (get() as any).luxuryDrink ?? 0;
        let daysWithoutFood = (get() as any).daysWithoutFood ?? 0;
        let beerRationDays = (get() as any).beerRationDays ?? 0;

        // Apply per-day consumption (small loop, daysSpent is tiny)
        for (let d = 0; d < daysSpent; d++) {
          if (food >= dailyFood) {
            food -= dailyFood;
            daysWithoutFood = 0;
          } else {
            food = 0;
            daysWithoutFood += 1;
          }

          if (drink >= dailyDrink) {
            drink -= dailyDrink;
          } else {
            const deficit = dailyDrink - drink;
            drink = 0;
            if (luxuryDrink >= deficit) {
              luxuryDrink -= deficit;
              beerRationDays += 1;
            } else {
              luxuryDrink = 0;
            }
          }
        }
```

Now update the `set((state) => ({ ... }))` in `returnToStation` to include the new values:

```typescript
          food,
          drink,
          luxuryDrink,
          daysWithoutFood,
          beerRationDays,
```

---

## TASK 9F-1: Create ShoreLeavePanel.tsx

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/ui/ShoreLeavePanel.tsx`

```tsx
import { useGameStore } from "../../stores/gameStore";
import CyberPanel from "./CyberPanel";
import CyberButton from "./CyberButton";
import { SHORE_LEAVE_OPTIONS } from "../../game/constants";

export default function ShoreLeavePanel() {
  const { credits, crewRoster, luxuryDrink, takeShoreLeave } = useGameStore((s) => ({
    credits: s.credits,
    crewRoster: s.crewRoster,
    luxuryDrink: (s as any).luxuryDrink ?? 0,
    takeShoreLeave: (s as any).takeShoreLeave as ((t: "rest" | "recreation" | "party") => void) | undefined,
  }));

  const crewCount = crewRoster.length;
  const rest = SHORE_LEAVE_OPTIONS.rest;
  const recreation = SHORE_LEAVE_OPTIONS.recreation;
  const party = SHORE_LEAVE_OPTIONS.party;

  const canRest = !!takeShoreLeave;
  const canRecreation = !!takeShoreLeave && credits >= recreation.cost;
  const neededBeer = (party as any).beerPerCrew ? crewCount * (party as any).beerPerCrew : 0;
  const canParty =
    !!takeShoreLeave &&
    credits >= party.cost &&
    (neededBeer === 0 || luxuryDrink >= neededBeer);

  return (
    <CyberPanel title="SHORE LEAVE">
      <div className="space-y-2 text-xs text-zinc-300">
        <div className="text-zinc-500">
          Restore stamina/sanity. Higher tiers may trigger social events.
        </div>

        <div className="grid grid-cols-1 gap-2">
          <CyberButton
            variant="secondary"
            className="text-xs"
            onClick={() => takeShoreLeave?.("rest")}
            disabled={!canRest}
          >
            Rest — {rest.cost} CR
          </CyberButton>

          <CyberButton
            variant="secondary"
            className="text-xs"
            onClick={() => takeShoreLeave?.("recreation")}
            disabled={!canRecreation}
          >
            Recreation — {recreation.cost} CR
          </CyberButton>

          <CyberButton
            variant="secondary"
            className="text-xs"
            onClick={() => takeShoreLeave?.("party")}
            disabled={!canParty}
          >
            Party — {party.cost} CR {neededBeer ? `(+${neededBeer} luxury)` : ""}
          </CyberButton>
        </div>
      </div>
    </CyberPanel>
  );
}
```

---

## TASK 9F-2: Add Shore Leave Action

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/stores/gameStore.ts`

Add signature to `GameActions`:

```typescript
  takeShoreLeave: (type: "rest" | "recreation" | "party") => void;
```

Add imports at top:

```typescript
import { SHORE_LEAVE_OPTIONS } from "../game/constants";
```

Add implementation in store actions:

```typescript
      takeShoreLeave: (type) => {
        const opt = (SHORE_LEAVE_OPTIONS as any)[type];
        if (!opt) return;

        const state: any = get();
        const crewCount = (state.crewRoster || []).length;
        const beerNeed = opt.beerPerCrew ? crewCount * opt.beerPerCrew : 0;

        if (state.credits < opt.cost) return;
        if (beerNeed > 0 && state.luxuryDrink < beerNeed) return;

        // Pay + consume party luxury
        const nextCredits = state.credits - opt.cost;
        const nextLuxury = beerNeed > 0 ? state.luxuryDrink - beerNeed : state.luxuryDrink;

        // Recover stats for all crew
        const roster = state.crewRoster.map((c: any) => ({
          ...c,
          stamina: Math.min(c.maxStamina, (c.stamina ?? c.maxStamina) + opt.staminaRecovery),
          sanity: Math.min(c.maxSanity, (c.sanity ?? c.maxSanity) + opt.sanityRecovery),
          status: "resting",
          currentJob: "resting",
          position: { location: "station" },
        }));

        set({
          credits: nextCredits,
          luxuryDrink: nextLuxury,
          crewRoster: roster,
          crew: roster.find((c: any) => c.id === state.selectedCrewId) ?? roster[0],
        });

        // Advance time by duration (uses existing day counter only)
        set((s) => ({
          day: s.day + opt.duration,
          licenseDaysRemaining: Math.max(0, s.licenseDaysRemaining - opt.duration),
          stats: { ...s.stats, daysPlayed: s.stats.daysPlayed + opt.duration },
        }));

        // Refresh market after day advance
        get().dailyMarketRefresh();
      },
```

---

## TASK 9G-1: Create AutoSalvageService.ts

This service provides “safe defaults” for auto-assignment and a helper to validate assignments.

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/systems/AutoSalvageService.ts`

```typescript
import type { CrewMember, GridRoom, Ship } from "../../types";

export interface AutoAssignment {
  crewId: string;
  roomId: string;
}

export function getAssignableRooms(ship: Ship): GridRoom[] {
  return ship.grid.flat().filter((r) => !r.sealed && !r.looted);
}

export function validateAssignments(
  ship: Ship,
  crewRoster: CrewMember[],
  assignments: AutoAssignment[],
): AutoAssignment[] {
  const validRoomIds = new Set(ship.grid.flat().map((r) => r.id));
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
```

---

## TASK 9G-2: Add Auto-Salvage UI + Assignment to SalvageScreen

This implementation adds:
- `Auto Mode` toggle
- Click room to assign currently selected crew
- “Execute Auto Salvage” button that runs `salvageRoom` for each assignment sequentially

### 9G-2A: Store fields + actions

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/stores/gameStore.ts`

Add to `GameState` (after Task 9A-2 fields):

```typescript
  autoSalvageEnabled?: boolean;
  autoAssignments?: Record<string, string>; // crewId -> roomId
```

Add to initial store state (near `cargoSwapPending`):

```typescript
      autoSalvageEnabled: false,
      autoAssignments: {},
```

Add to `GameActions`:

```typescript
  setAutoSalvageEnabled: (enabled: boolean) => void;
  assignCrewToRoom: (crewId: string, roomId: string) => void;
  runAutoSalvageTick: () => void;
```

Add implementations:

```typescript
      setAutoSalvageEnabled: (enabled) => {
        set({ autoSalvageEnabled: enabled });
      },

      assignCrewToRoom: (crewId, roomId) => {
        set((state: any) => ({
          autoAssignments: { ...(state.autoAssignments || {}), [crewId]: roomId },
          crewRoster: (state.crewRoster || []).map((c: any) =>
            c.id === crewId ? { ...c, position: { location: "wreck", roomId }, currentJob: "salvaging" } : c,
          ),
        }));
      },

      runAutoSalvageTick: () => {
        const state: any = get();
        const assignments: Record<string, string> = state.autoAssignments || {};
        const crewRoster: any[] = state.crewRoster || [];

        // Execute in stable order
        for (const crew of crewRoster) {
          const roomId = assignments[crew.id];
          if (!roomId) continue;

          // Temporarily set selected crew to use existing hazard logic
          set({ selectedCrewId: crew.id, crew });
          const res = get().salvageRoom(roomId);
          void res;
        }
      },
```

### 9G-2B: SalvageScreen UI

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/screens/SalvageScreen.tsx`

In the store selector at top of component, add:

```tsx
    autoSalvageEnabled: (s as any).autoSalvageEnabled ?? false,
    setAutoSalvageEnabled: (s as any).setAutoSalvageEnabled,
    assignCrewToRoom: (s as any).assignCrewToRoom,
    runAutoSalvageTick: (s as any).runAutoSalvageTick,
    autoAssignments: (s as any).autoAssignments ?? {},
```

And include these in the destructured const block.

Then, locate where `ShipGrid` is rendered (search `ShipGrid`). Pass `crewRoster`:

```tsx
              <ShipGrid
                ship={shipObj}
                currentRoom={currentPosition ?? undefined}
                allowedRoomIds={allowedRoomIds}
                onRoomClick={(room) => {
                  // existing onRoomClick logic remains
                  // Auto assignment when enabled
                  if (autoSalvageEnabled && crew?.id) {
                    assignCrewToRoom?.(crew.id, room.id);
                  }
                }}
                crewRoster={crewRoster as any}
              />
```

Add a small panel near top of the screen (recommended: above ShipGrid):

```tsx
      <div className="mb-4 bg-zinc-800 border border-amber-600/20 p-3">
        <div className="flex items-center justify-between">
          <div className="text-amber-400 text-xs font-bold tracking-wider">AUTO SALVAGE</div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 text-xs border ${autoSalvageEnabled ? "bg-amber-600 text-zinc-900 border-amber-600" : "bg-zinc-700 text-amber-200 border-amber-600/30"}`}
              onClick={() => setAutoSalvageEnabled?.(!autoSalvageEnabled)}
            >
              {autoSalvageEnabled ? "ON" : "OFF"}
            </button>
            <button
              className="px-3 py-1 text-xs bg-zinc-700 text-amber-200 border border-amber-600/30"
              onClick={() => runAutoSalvageTick?.()}
              disabled={!autoSalvageEnabled}
            >
              Execute
            </button>
          </div>
        </div>

        {autoSalvageEnabled && (
          <div className="mt-2 text-zinc-400 text-xs">
            Click a room to assign the selected crew. Assigned room: {autoAssignments?.[crew?.id ?? ""] ?? "(none)"}
          </div>
        )}
      </div>
```

---

## TASK 9H-1: Create EventManager.ts

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/systems/EventManager.ts`

```typescript
import type { GameEvent, EventTrigger, EventChoice, GameState } from "../../types";
import { EVENTS } from "../data/events";

function meetsRequirements(state: GameState, event: GameEvent): boolean {
  const req = event.requirements;
  if (!req) return true;
  if (typeof req.credits === "number" && state.credits < req.credits) return false;
  return true;
}

export function pickEventByTrigger(
  trigger: EventTrigger,
  state: GameState,
  randomFn: () => number = Math.random,
): GameEvent | null {
  const candidates = EVENTS.filter((e) => e.trigger === trigger).filter((e) => meetsRequirements(state, e));
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((s, e) => s + (e.weight || 1), 0);
  let roll = randomFn() * totalWeight;
  for (const e of candidates) {
    roll -= e.weight || 1;
    if (roll <= 0) return e;
  }
  return candidates[candidates.length - 1] ?? null;
}

export function applyEventChoice(
  state: GameState,
  event: GameEvent,
  choice: EventChoice,
): GameState {
  // Start from a shallow copy; replace arrays you mutate
  let next: any = { ...state };
  let crewRoster = [...(state.crewRoster || [])];

  for (const eff of choice.effects) {
    if (eff.type === "credits" && typeof eff.value === "number") {
      next.credits = Math.max(0, (next.credits ?? 0) + eff.value);
    }
    if (eff.type === "fuel" && typeof eff.value === "number") {
      next.fuel = Math.max(0, (next.fuel ?? 0) + eff.value);
    }
    if (eff.type === "food" && typeof eff.value === "number") {
      next.food = Math.max(0, (next.food ?? 0) + eff.value);
    }
    if (eff.type === "drink" && typeof eff.value === "number") {
      next.drink = Math.max(0, (next.drink ?? 0) + eff.value);
    }
    if (eff.type === "stamina" && typeof eff.value === "number") {
      const targetId = String(eff.target ?? "");
      crewRoster = crewRoster.map((c: any) =>
        c.id === targetId
          ? { ...c, stamina: Math.max(0, Math.min(c.maxStamina, (c.stamina ?? 0) + eff.value)) }
          : c,
      );
    }
    if (eff.type === "sanity" && typeof eff.value === "number") {
      const targetId = String(eff.target ?? "");
      crewRoster = crewRoster.map((c: any) =>
        c.id === targetId
          ? { ...c, sanity: Math.max(0, Math.min(c.maxSanity, (c.sanity ?? 0) + eff.value)) }
          : c,
      );
    }
    if (eff.type === "hp" && typeof eff.value === "number") {
      const targetId = String(eff.target ?? "");
      crewRoster = crewRoster.map((c: any) =>
        c.id === targetId
          ? { ...c, hp: Math.max(0, Math.min(c.maxHp, (c.hp ?? 0) + eff.value)) }
          : c,
      );
    }
  }

  next.crewRoster = crewRoster;
  next.crew = crewRoster.find((c: any) => c.id === next.selectedCrewId) ?? next.crew;
  return next as GameState;
}
```

---

## TASK 9H-2: Create events.ts

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/game/data/events.ts`

```typescript
import type { GameEvent } from "../../types";

export const EVENTS: GameEvent[] = [
  {
    id: "travel-ghost-signal",
    trigger: "travel",
    title: "Ghost Signal",
    description: "A broken distress beacon loops a message in a dead language.",
    weight: 10,
    choices: [
      {
        id: "ignore",
        text: "Ignore it.",
        effects: [],
      },
      {
        id: "record",
        text: "Record the signal and sell it later.",
        effects: [{ type: "credits", value: 50 }],
      },
    ],
  },
  {
    id: "travel-micrometeor",
    trigger: "travel",
    title: "Micrometeor Swarm",
    description: "Your hull pings. Something small is chewing the paint.",
    weight: 8,
    choices: [
      { id: "brace", text: "Brace and ride it out.", effects: [{ type: "fuel", value: -2 }] },
      { id: "burn", text: "Burn fuel to dodge.", effects: [{ type: "fuel", value: -6 }] },
    ],
  },
  {
    id: "salvage-hidden-cache",
    trigger: "salvage",
    title: "Hidden Cache",
    description: "You find a sealed locker with corporate tags scratched off.",
    weight: 10,
    choices: [
      { id: "crack", text: "Crack it open.", effects: [{ type: "credits", value: 120 }] },
      { id: "leave", text: "Leave it.", effects: [] },
    ],
  },
  {
    id: "salvage-toxic-fumes",
    trigger: "salvage",
    title: "Toxic Fumes",
    description: "A vent hisses. The air stings your eyes.",
    weight: 10,
    choices: [
      { id: "mask", text: "Use filters and continue.", effects: [{ type: "drink", value: -1 }] },
      { id: "retreat", text: "Back off.", effects: [] },
    ],
  },
  {
    id: "daily-price-hike",
    trigger: "daily",
    title: "Price Hike",
    description: "Station vendors quietly adjust their rates upward.",
    weight: 6,
    choices: [
      { id: "grumble", text: "Pay anyway.", effects: [{ type: "credits", value: -50 }] },
      { id: "scavenge", text: "Scavenge alternatives.", effects: [{ type: "food", value: 1 }] },
    ],
  },
  {
    id: "social-bar-fight",
    trigger: "social",
    title: "Bar Fight",
    description: "Someone calls your crew corporate pets. Chairs move.",
    weight: 6,
    choices: [
      { id: "walk", text: "Walk away.", effects: [] },
      { id: "swing", text: "Swing first.", effects: [{ type: "credits", value: -100 }] },
    ],
  },
  {
    id: "social-good-song",
    trigger: "social",
    title: "A Good Song",
    description: "A street musician plays something that reminds you of home.",
    weight: 8,
    choices: [
      { id: "tip", text: "Tip them.", effects: [{ type: "credits", value: -25 }] },
      { id: "listen", text: "Just listen.", effects: [] },
    ],
  },
];
```

---

## TASK 9H-3: Create EventModal.tsx

**Create file**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/game/EventModal.tsx`

```tsx
import { useGameStore } from "../../stores/gameStore";
import CyberPanel from "../ui/CyberPanel";
import CyberButton from "../ui/CyberButton";

export default function EventModal() {
  const { activeEvent, resolveActiveEvent, dismissActiveEvent } = useGameStore((s) => ({
    activeEvent: (s as any).activeEvent,
    resolveActiveEvent: (s as any).resolveActiveEvent as ((id: string) => void) | undefined,
    dismissActiveEvent: (s as any).dismissActiveEvent as (() => void) | undefined,
  }));

  if (!activeEvent) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl">
        <CyberPanel title={`EVENT // ${activeEvent.title}`}>
          <div className="text-zinc-200 text-sm mb-4">{activeEvent.description}</div>
          <div className="space-y-2">
            {activeEvent.choices.map((c: any) => (
              <CyberButton
                key={c.id}
                variant="secondary"
                className="w-full text-xs"
                onClick={() => resolveActiveEvent?.(c.id)}
                disabled={!resolveActiveEvent}
              >
                {c.text}
              </CyberButton>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              className="text-zinc-400 text-xs hover:text-amber-400"
              onClick={() => dismissActiveEvent?.()}
            >
              Dismiss
            </button>
          </div>
        </CyberPanel>
      </div>
    </div>
  );
}
```

---

## TASK 9H-4: Trigger Events From Travel/Salvage/Day Advance

### 9H-4A: Render EventModal globally

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/App.tsx`

Add import:

```tsx
import EventModal from "./components/game/EventModal";
```

Then render it once under the screen switch:

```tsx
      <EventModal />
```

### 9H-4B: Trigger travel event on arrival

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/components/screens/TravelScreen.tsx`

Add to store selector:

```tsx
      activeEvent: (s as any).activeEvent,
      setActiveEvent: (ev: any) => (s as any).setActiveEvent?.(ev),
```

Instead of adding a setter, we’ll trigger via `useGameStore.getState()` (simpler). Add import at top:

```tsx
import { pickEventByTrigger } from "../../game/systems/EventManager";
```

Inside the `pct >= 100` block (right before `onNavigate("salvage")`), add:

```tsx
        const state: any = useGameStore.getState();
        if (!state.activeEvent && Math.random() < 0.4) {
          const ev = pickEventByTrigger("travel" as any, state);
          if (ev) useGameStore.setState({ activeEvent: ev });
        }
```

### 9H-4C: Trigger salvage events occasionally

**File**: `/home/eric/Typescript/Shipbreakers/ship-breakers/src/stores/gameStore.ts`

In `salvageRoom` and `salvageItem`, after marking room looted and before returning, add:

```typescript
        // Phase 9: occasional salvage event
        const s: any = get();
        if (!s.activeEvent && Math.random() < 0.2) {
          const ev = pickEventByTrigger("salvage" as any, s);
          if (ev) set({ activeEvent: ev });
        }
```

### 9H-4D: Trigger daily events after returning to station

In `returnToStation`, after the day advance `set(...)` and `dailyMarketRefresh()`, add:

```typescript
        const s: any = get();
        if (!s.activeEvent && Math.random() < 0.15) {
          const ev = pickEventByTrigger("daily" as any, s);
          if (ev) set({ activeEvent: ev });
        }
```

---

## VALIDATION COMMANDS

After each task:
```bash
cd /home/eric/Typescript/Shipbreakers/ship-breakers
npm run type-check
```

After all tasks:
```bash
npm run build
npm run dev
```

---

## SUCCESS CRITERIA

Phase 9 is complete when:

1. ✅ Equipment appears in wreck rooms
2. ✅ Crew have firstName/lastName/background/traits
3. ✅ Crew have stamina and sanity stats
4. ✅ Character creation screen works
5. ✅ Hub shows pantry and bar panel
6. ✅ Can buy provisions at station
7. ✅ Shore leave restores stats
8. ✅ Crew dots show on grids
9. ✅ Events trigger and resolve
10. ✅ All type checks pass
11. ✅ Game runs without errors
