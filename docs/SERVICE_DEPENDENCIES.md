# Service Dependency Graph

## Current gameStore Dependencies (1973 lines)

```
gameStore.ts
├── zustand (state management)
│   ├── create
│   └── persist (middleware)
│
├── types/ (type definitions)
│   ├── GameState, Loot, CrewMember
│   ├── GraveyardZone, HireCandidate
│   ├── CrewStatus, CrewJob, LicenseTier
│   └── LICENSE_TIERS (constant)
│
├── game/data/ (static data)
│   ├── playerShip.ts → initializePlayerShip()
│   ├── equipment.ts → EQUIPMENT
│   └── reactors.ts → REACTORS
│
├── game/wreckGenerator.ts (procedural generation)
│   ├── generateWreck()
│   └── generateAvailableWrecks()
│
├── game/constants.ts (game constants)
│   ├── STARTING_* (credits, fuel, time, hp, skills)
│   ├── FUEL_COST_*, SCAN_COST
│   ├── SKILL_* (hazard map, xp thresholds)
│   ├── RARITY_*, XP_*, TIER_*
│   ├── PROVISION_*, SHORE_LEAVE_*
│   ├── DAILY_* (food, drink, events)
│   ├── STAMINA_*, SANITY_*
│   └── PANTRY_CAPACITY, BASE_*
│
├── game/hazardLogic.ts (salvage mechanics)
│   ├── calculateHazardSuccess()
│   ├── damageOnFail()
│   └── calculateLootValue()
│
├── game/systems/ (game systems)
│   ├── slotManager.ts
│   │   ├── canInstall(), installItem()
│   │   ├── uninstallItem()
│   │   ├── getShipyardFee()
│   │   └── getActiveEffects()
│   │
│   ├── CrewGenerator.ts
│   │   ├── generateHireCandidates()
│   │   └── generateCaptain()
│   │
│   ├── EventManager.ts
│   │   ├── applyEventChoice()
│   │   └── pickEventByTrigger()
│   │
│   └── TraitEffectResolver.ts
│       └── calculateTraitEffects()
│
└── (dynamic imports - lazy loaded)
    ├── game/random.ts
    ├── game/ship.ts
    └── game/constants.ts (WasmBridge)
```

## Proposed Service Extraction (Step 8)

### 1. SaveService (save/load/reset)
**Functions to extract:**
- `resetGame()` - line ~200
- `loadGame()` (from persist middleware)
- `exportSave()`, `importSave()`
- Save state serialization

**Dependencies:**
- zustand/persist
- types

### 2. CrewService (crew management)
**Functions to extract:**
- `hireCrew()` - line ~1200
- `fireCrew()` - line ~1250
- `assignCrew()` - line ~1280
- `restCrew()` - line ~1320
- `applySanityDamage()`, `applyStaminaDamage()`
- Crew status management

**Dependencies:**
- CrewGenerator
- TraitEffectResolver
- types (CrewMember, Skills)

### 3. SalvageService (wreck operations)
**Functions to extract:**
- `selectWreck()` - line ~600
- `salvageRoom()` - line ~700
- `abandonRun()` - line ~900
- `returnToStation()` - line ~950
- Loot collection logic

**Dependencies:**
- wreckGenerator
- hazardLogic
- constants (FUEL_COST, XP_*, etc.)

### 4. EconomyService (credits, shop, licensing)
**Functions to extract:**
- `buyFuel()` - line ~1000
- `sellItem()` - line ~1050
- `buyItem()` - line ~1100
- `renewLicense()` - line ~1150
- `purchaseProvisions()`

**Dependencies:**
- LICENSE_TIERS
- constants (prices)
- equipment/reactors data

### 5. ShipService (player ship management)
**Functions to extract:**
- `installEquipment()` - line ~1400
- `uninstallEquipment()` - line ~1450
- `upgradeReactor()` - line ~1500
- Ship state management

**Dependencies:**
- slotManager
- playerShip data
- EQUIPMENT, REACTORS

## Dependency Flow After Extraction

```
                    ┌─────────────┐
                    │  gameStore  │
                    │  (300 lines)│
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────┐
│  CrewService   │ │ SalvageService│ │ EconomyService│
│   (200 lines)  │ │  (300 lines) │ │  (200 lines) │
└───────┬────────┘ └──────┬───────┘ └──────┬───────┘
        │                 │                │
        ▼                 ▼                ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────┐
│ CrewGenerator  │ │hazardLogic   │ │ LICENSE_TIERS│
│TraitResolver   │ │wreckGenerator│ │  equipment   │
└────────────────┘ └──────────────┘ └──────────────┘
        │                 │                │
        └─────────────────┴────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │    types/    │
                   │  constants   │
                   └──────────────┘
```

## Service Interface Contracts (Draft)

```typescript
// CrewService
interface CrewService {
  hireCrew(candidateId: string): boolean;
  fireCrew(crewId: string): boolean;
  assignCrew(crewId: string, job: CrewJob): void;
  healCrew(crewId: string, amount: number): void;
  restCrew(crewId: string): void;
}

// SalvageService
interface SalvageService {
  selectWreck(wreckId: string): void;
  salvageRoom(roomId: string, crewId?: string): SalvageResult;
  abandonRun(): void;
  returnToStation(): void;
}

// EconomyService
interface EconomyService {
  buyFuel(amount: number): boolean;
  sellItem(itemId: string): number;
  buyItem(itemId: string): boolean;
  renewLicense(tier: LicenseTier): boolean;
}

// ShipService
interface ShipService {
  installEquipment(slotId: string, itemId: string): boolean;
  uninstallEquipment(slotId: string): Loot | null;
  upgradeReactor(reactorId: string): boolean;
}

// SaveService
interface SaveService {
  resetGame(): void;
  exportSave(): string;
  importSave(data: string): boolean;
}
```

## Lines of Code Target

| Component | Current | Target | Status |
|-----------|---------|--------|--------|
| gameStore | 1973 | <500 | ❌ |
| types/index | 625 | 625 | ✅ (kept as-is, domain views added) |
| CrewService | - | ~200 | ⬜ |
| SalvageService | - | ~300 | ⬜ |
| EconomyService | - | ~200 | ⬜ |
| ShipService | - | ~150 | ⬜ |
| SaveService | - | ~100 | ⬜ |

## Notes

- Domain view modules created in `types/domains/` for logical grouping
- Main `types/index.ts` kept intact to avoid circular dependencies
- Service extraction should be done one service at a time with tests
- Each service should have its own unit tests
