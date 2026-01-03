# Phase 10: Complete Codebase Hygiene & Restructuring

**Status:** Planning Complete - Ready to Execute  
**Estimated Time:** 53 hours (Phase 10a: 3h + Phase 10b: 50h)  
**Timeline:** 11 days @ 5h/day or 7 days @ 8h/day  
**Started:** January 2, 2026

---

## Executive Summary

Major surgical cleanup eliminating 15,000+ duplicate lines across 112+ files and 550MB waste. Split into **Phase 10a (Cleanup)** and **Phase 10b (Refactoring)** for manageable execution.

### Key Objectives

1. **Eliminate Duplication** - Remove ship-breakers/ duplicate codebase (80 files, ~12,000 lines)
2. **Delete Bloat** - Remove embedded MCP servers (126 files, ~5MB)
3. **Refactor Store** - Extract 5 services from 1981-line gameStore.ts
4. **Organize Types** - Split 625-line types/index.ts into domain modules
5. **Improve Type Safety** - Remove 30+ `as any` casts
6. **Rewrite Tests** - Adapt test suite to service architecture
7. **Document Architecture** - Create comprehensive ARCHITECTURE.md
8. **Fresh Start** - New README reflecting current capabilities

### Impact

- **Code Quality:** -1500 lines gameStore, organized types, proper typing
- **Maintainability:** Clear service boundaries, testable pure functions
- **Disk Space:** -550MB (duplicate node_modules, dist, MCP servers)
- **Test Coverage:** Target baseline +20% or 70% (whichever higher)

---

## Phase 10a: Cleanup & Validation (3 hours)

### Step 1: Audit and Document Codebase Differences (30 min)

**Goal:** Definitively establish root `src/` as canonical codebase

**Tasks:**
- [ ] Compare `src/stores/gameStore.ts` (1981 lines) vs `ship-breakers/src/stores/gameStore.ts` (1909 lines)
- [ ] Verify root has crew inventory field (line ~251)
- [ ] Verify root has crew work thresholds (lines 300-302)
- [ ] Check `index.html` line 16 references `/src/main.tsx`
- [ ] Document findings showing root has Phase 9 features
- [ ] Commit findings

**Verification:**
```bash
npm run build && npm run test
```

---

### Step 2: Delete MCP Servers Bloat (1 hour)

**Goal:** Remove unused embedded MCP servers repository

**Tasks:**
- [ ] Verify no imports: `grep -r "@modelcontextprotocol" src/`
- [ ] Delete `.github/mcp/servers/` directory (126 files, ~5MB)
- [ ] Run build and tests to ensure nothing breaks
- [ ] Commit: "Remove unused MCP servers repository"

**Verification:**
```bash
npm run build && npm run test
```

**Expected Result:** All tests pass, build succeeds, 126 files removed

---

### Step 3: Clean Backup Files and Debug Logs (30 min)

**Goal:** Remove obsolete backup files and migration console.logs

**Tasks:**
- [ ] Verify git history: `git log --follow src/App.tsx`
- [ ] Delete `src/App.tsx.backup`
- [ ] Delete `src/index.css.backup`
- [ ] Remove console.log from `gameStore.ts` line 1442 (Migration: Added inventory)
- [ ] Remove console.log from `gameStore.ts` line 1457 (Migration: Merged equipment)
- [ ] Remove console.log from `gameStore.ts` line 1469 (Migration: Added thresholds)
- [ ] Remove console.log from `gameStore.ts` line 1509 (Migration: Default thresholds)
- [ ] Remove console.log from `gameStore.ts` line 1978 (Migration failed)
- [ ] Commit: "Clean up backup files and migration logs"

**Verification:**
```bash
npm run build && npm run test
```

---

### Step 4: Archive ship-breakers/ as .txt Reference (1 hour)

**Goal:** Convert obsolete codebase to .txt archive format

**Tasks:**
- [ ] Delete `ship-breakers/node_modules/` (~400MB)
- [ ] Delete `ship-breakers/dist/`
- [ ] Remove nested `.git/` folder
- [ ] Convert source to .txt:
  ```bash
  find ship-breakers/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec mv {} {}.txt \;
  ```
- [ ] Move to `archive/ship-breakers-phase8-snapshot/`
- [ ] Create `archive/ship-breakers-phase8-snapshot/README.md`:
  ```markdown
  # Ship Breakers - Phase 8 Snapshot
  
  This is an archived snapshot of the codebase from Phase 8, before Phase 9 crew inventory feature.
  
  **DO NOT IMPORT FROM THIS ARCHIVE**
  
  All files have been converted to .txt to prevent accidental imports.
  This archive is for historical reference only.
  
  Key differences from current codebase:
  - No CrewMember.inventory field
  - No crew work threshold settings
  - gameStore.ts is 1909 lines (current: <500 after Phase 10b)
  ```
- [ ] Commit: "Archive ship-breakers Phase 8 snapshot as .txt"
- [ ] Tag: `git tag phase10a-complete`

**Verification:**
```bash
npm run build && npm run test
```

**Expected Result:** -550MB disk space, ship-breakers/ archived as .txt

---

## Phase 10a Checkpoint

✅ **Commit:** "Phase 10a: Remove duplicates, archive old code, clean 550MB waste"  
✅ **Tag:** `phase10a-complete`

**Before proceeding to Phase 10b:**
- All tests passing
- Build succeeds
- No duplicate src/ folders
- No MCP servers bloat
- Clean workspace

---

## Phase 10b: Refactoring & Architecture (50 hours)

### Step 5: Measure Test Coverage Baseline (15 min)

**Goal:** Establish current coverage to set realistic target

**Tasks:**
- [ ] Run: `npm run test -- --coverage`
- [ ] Save output to `docs/PHASE_10_BASELINE_COVERAGE.txt`
- [ ] Set target: max(baseline + 20%, 70%)
- [ ] Document target in this file

**Target Coverage:** ___ % (to be filled after measurement)

---

### Step 6: Reorganize Types into Domain Modules (10 hours)

**Goal:** Split monolithic types/index.ts into organized domain modules

**Structure:**
```
types/
├── index.ts           # Barrel export (re-export all)
├── crew.ts            # CrewMember, CrewSkills, Trait, Background
├── ship.ts            # Ship, PlayerShip, GridRoom, ShipLayout
├── items.ts           # Loot, Equipment, Slot, ItemRarity
├── game.ts            # GameState, RunState, Wreck
├── zones.ts           # GraveyardZone, LicenseTier, ZONES constant
├── ui.ts              # Screen, BaseModalProps, Toast, ScreenProps
└── type-guards.ts     # isEquipment(), hasLayout(), isCrewMember()
```

**Tasks:**
- [ ] Create `types/crew.ts` with crew-related types
- [ ] Create `types/ship.ts` with ship-related types
- [ ] Create `types/items.ts` with item/loot types
- [ ] Create `types/game.ts` with core game state types
- [ ] Create `types/zones.ts` with zone/license types
- [ ] Create `types/ui.ts` with UI-related types
- [ ] Create `types/type-guards.ts` with centralized guards:
  ```typescript
  export function isEquipment(loot: Loot): loot is Equipment {
    return loot.type === 'equipment';
  }
  
  export function hasLayout(ship: Ship): ship is ShipWithLayout {
    return 'layout' in ship && ship.layout !== undefined;
  }
  
  export function isCrewMember(entity: unknown): entity is CrewMember {
    return entity !== null && typeof entity === 'object' && 'id' in entity;
  }
  ```
- [ ] Create barrel `types/index.ts`:
  ```typescript
  export * from './crew';
  export * from './ship';
  export * from './items';
  export * from './game';
  export * from './zones';
  export * from './ui';
  export * from './type-guards';
  ```
- [ ] Update imports in all 80+ files:
  - Change: `import type { CrewMember } from '../../types'`
  - To: `import type { CrewMember } from '../../types/crew'`
- [ ] Run `npm run build && npm run test` after each module
- [ ] Commit: "Reorganize types into domain modules"

**Time Breakdown:**
- 6h: Split types into modules
- 2h: Update imports across codebase
- 2h: Fix test imports and type errors

**Verification:**
```bash
npm run build && npm run test
```

---

### Step 7: Draw Service Dependency Graph (1 hour)

**Goal:** Establish clear service boundaries before extraction

**Create:** `docs/SERVICE_DEPENDENCIES.md`

**Content:**
```markdown
# Service Dependency Graph

## Architecture Rules

1. **Leaf Services** - Never import other services
   - SalvageService
   - CrewService
   - ShipyardService

2. **Orchestrator Services** - Coordinate leaf services
   - TravelService (imports SalvageService for events)
   - ProgressionService (coordinates all services)

3. **Circular Dependency Prevention**
   - Leaf → Leaf: ❌ FORBIDDEN
   - Orchestrator → Leaf: ✅ ALLOWED
   - Orchestrator → Orchestrator: ⚠️ REVIEW REQUIRED

## Dependency Tree

```
ProgressionService (orchestrator)
    ↓ calls
    ├─→ CrewService (leaf)
    ├─→ ShipyardService (leaf)
    └─→ TravelService (orchestrator)
            ↓ calls
            └─→ SalvageService (leaf)
```

## Service Responsibilities

| Service | Domain | Key Methods | Dependencies |
|---------|--------|-------------|--------------|
| SalvageService | Salvage operations | salvageItem(), runAutoSalvage(), checkHazard() | None (leaf) |
| CrewService | Crew management | hireCrew(), consumeProvisions(), shoreLeave() | None (leaf) |
| ShipyardService | Ship upgrades | buyUpgrade(), installEquipment() | None (leaf) |
| TravelService | Navigation & events | travelToWreck(), triggerEvent() | SalvageService |
| ProgressionService | Daily progression | advanceDay(), checkLicense() | All services |

## Import Rules

```typescript
// ✅ ALLOWED - Orchestrator → Leaf
import { SalvageService } from './salvage-service';

// ❌ FORBIDDEN - Leaf → Leaf
import { CrewService } from './crew-service'; // In SalvageService

// ⚠️ REVIEW - Orchestrator → Orchestrator
import { TravelService } from './travel-service'; // In ProgressionService
```
```

**Tasks:**
- [ ] Create `docs/SERVICE_DEPENDENCIES.md`
- [ ] Review with team/self before extraction
- [ ] Commit: "Document service dependency architecture"

---

### Step 8: Extract 5 Core Services from gameStore (20 hours)

**Goal:** Reduce gameStore.ts from 1981 lines to <500 lines

**Extraction Order:** Follow dependency graph (leaf services first)

#### 8.1: SalvageService (4 hours)

**Create:** `src/game/systems/salvage-service.ts` (~300 lines)

**Methods to Extract:**
- `salvageItem(state, roomId, itemId): { success, updates, events }`
- `runAutoSalvage(state, rules): AutoSalvageResult`
- `checkHazard(crew, room, tier): { success, damage }`
- Helper functions for hazard calculations

**gameStore After:**
```typescript
salvageItem: (roomId, itemId) => {
  const result = SalvageService.salvageItem(get(), roomId, itemId);
  set(result.updates);
  return result;
}
```

**Tasks:**
- [ ] Create service file with pure functions
- [ ] Extract salvage logic (~200 lines)
- [ ] Extract auto-salvage logic (~100 lines)
- [ ] Update gameStore to call service
- [ ] Run `npm run build && npm run test`
- [ ] Commit: "Extract SalvageService from gameStore"

---

#### 8.2: CrewService (4 hours)

**Create:** `src/game/systems/crew-service.ts` (~250 lines)

**Methods to Extract:**
- `hireCrew(state, backgroundId): { crew, cost }`
- `consumeProvisions(state): { updates, effects }`
- `shoreLeaveUpdate(state): { updates, recoveredCrew }`
- `transferItem(crew, ship, itemId): boolean`

**Tasks:**
- [ ] Create service file
- [ ] Extract crew hiring logic
- [ ] Extract provisioning logic
- [ ] Extract shore leave logic
- [ ] Update gameStore to call service
- [ ] Run `npm run build && npm run test`
- [ ] Commit: "Extract CrewService from gameStore"

---

#### 8.3: ShipyardService (4 hours)

**Create:** `src/game/systems/shipyard-service.ts` (~150 lines)

**Methods to Extract:**
- `buyShipUpgrade(state, upgradeId): { success, ship, cost }`
- `installEquipment(state, equipmentId, roomId): boolean`
- `canAffordUpgrade(credits, cost): boolean`

**Tasks:**
- [ ] Create service file
- [ ] Extract upgrade logic
- [ ] Extract equipment installation
- [ ] Update gameStore to call service
- [ ] Run `npm run build && npm run test`
- [ ] Commit: "Extract ShipyardService from gameStore"

---

#### 8.4: TravelService (4 hours)

**Create:** `src/game/systems/travel-service.ts` (~200 lines)

**Methods to Extract:**
- `travelToWreck(state, wreckId): { updates, fuelCost, events }`
- `travelToStation(state): { updates, fuelCost, events }`
- `triggerTravelEvent(state, distance): Event | null`

**Dependencies:** Imports SalvageService (for salvage events)

**Tasks:**
- [ ] Create service file
- [ ] Extract travel logic
- [ ] Extract event triggering
- [ ] Import SalvageService (verify no circular deps)
- [ ] Update gameStore to call service
- [ ] Run `npm run build && npm run test`
- [ ] Commit: "Extract TravelService from gameStore"

---

#### 8.5: ProgressionService (4 hours)

**Create:** `src/game/systems/progression-service.ts` (~100 lines)

**Methods to Extract:**
- `advanceDay(state): { updates, events }`
- `checkLicenseUpgrade(state): { canUpgrade, newTier }`
- `calculateDailyUpdates(state): Partial<GameState>`

**Dependencies:** Imports all other services (orchestrator)

**Tasks:**
- [ ] Create service file
- [ ] Extract daily progression logic
- [ ] Extract license checking
- [ ] Import and coordinate other services
- [ ] Update gameStore to call service
- [ ] Run `npm run build && npm run test`
- [ ] Commit: "Extract ProgressionService from gameStore"

---

#### 8.6: Reduce gameStore to <500 Lines (Optional Cleanup)

**Tasks:**
- [ ] Remove extracted code
- [ ] Keep only: state definition, simple setters, service calls
- [ ] Verify no business logic remains in store
- [ ] Commit: "Finalize gameStore reduction to <500 lines"

**Expected Final Structure:**
```typescript
// gameStore.ts (< 500 lines)
interface GameStore {
  // State (200 lines)
  credits: number;
  day: number;
  crew: CrewMember[];
  // ...
  
  // Simple setters (100 lines)
  setCredits: (amount: number) => void;
  
  // Service calls (100 lines)
  salvageItem: (roomId, itemId) => SalvageService.salvageItem(get(), roomId, itemId);
  
  // Utility (100 lines)
  migrateSave: (save) => {...};
}
```

---

### Step 9: Centralize Modal Management (3 hours)

**Goal:** Replace 20+ `useState(false)` modal patterns with centralized uiStore

**Changes:**

#### 9.1: Update uiStore (1 hour)

**File:** `src/stores/uiStore.ts`

**Add:**
```typescript
interface ModalState {
  fuelDepot: boolean;
  medicalBay: boolean;
  stats: boolean;
  settings: boolean;
  resetConfirm: boolean;
  autoSalvage: boolean;
  emergencyEvac: boolean;
  crewHiring: boolean;
  shipUpgrade: boolean;
  wreckDetail: boolean;
}

interface UIStore {
  modalState: ModalState;
  openModal: (name: keyof ModalState) => void;
  closeModal: (name: keyof ModalState) => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  modalState: {
    fuelDepot: false,
    medicalBay: false,
    // ... all false by default
  },
  openModal: (name) => set((state) => ({
    modalState: { ...state.modalState, [name]: true }
  })),
  closeModal: (name) => set((state) => ({
    modalState: { ...state.modalState, [name]: false }
  })),
  closeAllModals: () => set((state) => ({
    modalState: Object.keys(state.modalState).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as ModalState
    )
  })),
}));
```

---

#### 9.2: Create useModal Hook (1 hour)

**File:** `src/hooks/use-modal.ts`

**Content:**
```typescript
import { useUIStore } from '../stores/uiStore';

export function useModal(name: keyof ModalState) {
  const isOpen = useUIStore((s) => s.modalState[name]);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);
  
  return {
    isOpen,
    open: () => openModal(name),
    close: () => closeModal(name),
  };
}
```

---

#### 9.3: Refactor Screen Components (1 hour)

**Files to Update:**
- `src/components/screens/HubScreen.tsx` (remove 6 useState)
- `src/components/screens/SalvageScreen.tsx` (remove 3 useState)
- `src/components/screens/WreckSelectScreen.tsx` (if applicable)

**Before:**
```typescript
const [showFuelDepot, setShowFuelDepot] = useState(false);

<button onClick={() => setShowFuelDepot(true)}>Fuel</button>
<FuelDepotModal
  isOpen={showFuelDepot}
  onClose={() => setShowFuelDepot(false)}
/>
```

**After:**
```typescript
const fuelDepotModal = useModal('fuelDepot');

<button onClick={fuelDepotModal.open}>Fuel</button>
<FuelDepotModal
  isOpen={fuelDepotModal.isOpen}
  onClose={fuelDepotModal.close}
/>
```

**Tasks:**
- [ ] Update uiStore with modalState
- [ ] Create useModal hook
- [ ] Refactor HubScreen
- [ ] Refactor SalvageScreen
- [ ] Run `npm run build && npm run test`
- [ ] Commit: "Centralize modal management in uiStore"

---

### Step 10: Improve Type Safety Systematically (6 hours)

**Goal:** Remove 30+ `as any` type casts with proper typing

**Priority Files:**

#### 10.1: gameStore.ts Type Safety (2 hours)

**Target:** ~10 `as any` casts

**Example Fixes:**
```typescript
// BEFORE
const matchingSkill = SKILL_HAZARD_MAP[room.hazardType as any];

// AFTER (in types/game.ts)
export const SKILL_HAZARD_MAP: Record<HazardType, SkillType> = {
  mechanical: 'mechanical',
  combat: 'combat',
  // ...
};

// Usage
const matchingSkill = SKILL_HAZARD_MAP[room.hazardType]; // No cast needed
```

**Tasks:**
- [ ] Fix SKILL_HAZARD_MAP typing
- [ ] Fix event application casts
- [ ] Fix active effects casts
- [ ] Use type guards from types/type-guards.ts
- [ ] Run `npm run build && npm run test`

---

#### 10.2: SlotManager.ts Type Safety (2 hours)

**Target:** ~10 `as any` casts

**Tasks:**
- [ ] Create proper Equipment slot types
- [ ] Use type guards for equipment checks
- [ ] Fix slot assignment casts
- [ ] Run `npm run build && npm run test`

---

#### 10.3: WreckGenerator.ts Type Safety (1 hour)

**Target:** ~8 `as any` casts

**Tasks:**
- [ ] Fix wreck generation type assertions
- [ ] Use proper Ship types with layout
- [ ] Fix room generation casts
- [ ] Run `npm run build && npm run test`

---

#### 10.4: Remaining Files (1 hour)

**Target:** ~12+ remaining casts

**Tasks:**
- [ ] Search: `grep -r "as any" src/`
- [ ] Fix remaining casts systematically
- [ ] Commit: "Remove type assertions, add proper type guards"

**Verification:**
```bash
# Should return <5 results
grep -r "as any" src/ | wc -l
```

---

### Step 11: Rewrite Test Suite for Service Architecture (15 hours)

**Goal:** Adapt tests to new service-based architecture, achieve coverage target

#### 11.1: Update Test Imports (5 hours)

**Tasks:**
- [ ] Update imports in all 48 test files
- [ ] Change service method calls:
  ```typescript
  // BEFORE
  store.salvageItem(roomId, itemId);
  
  // AFTER
  const result = SalvageService.salvageItem(store, roomId, itemId);
  ```
- [ ] Run `npm run test` frequently to catch issues early
- [ ] Commit: "Update test imports for service architecture"

---

#### 11.2: Create Service Boundary Tests (5 hours)

**New Test Files:**
- `tests/unit/systems/salvage-service.test.ts`
- `tests/unit/systems/crew-service.test.ts`
- `tests/unit/systems/travel-service.test.ts`
- `tests/unit/systems/shipyard-service.test.ts`
- `tests/unit/systems/progression-service.test.ts`

**Template:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { SalvageService } from '../../../src/game/systems/salvage-service';

describe('SalvageService', () => {
  describe('salvageItem', () => {
    it('should successfully salvage item with valid crew', () => {
      const mockState = createMockGameState();
      const result = SalvageService.salvageItem(mockState, 'room1', 'item1');
      
      expect(result.success).toBe(true);
      expect(result.updates.crew[0].inventory).toHaveLength(1);
    });
    
    it('should fail salvage on hazard check failure', () => {
      const mockState = createMockGameState({ lowSkillCrew: true });
      const result = SalvageService.salvageItem(mockState, 'hazardRoom', 'item1');
      
      expect(result.success).toBe(false);
      expect(result.updates.crew[0].hp).toBeLessThan(mockState.crew[0].hp);
    });
  });
});
```

**Tasks:**
- [ ] Create service test files
- [ ] Mock dependencies properly
- [ ] Test happy paths
- [ ] Test edge cases
- [ ] Test error conditions
- [ ] Run `npm run test`
- [ ] Commit: "Add service boundary tests"

---

#### 11.3: Add Screen Smoke Tests (5 hours)

**New Test Files:**
- `tests/ui/screens/HubScreen.test.tsx`
- `tests/ui/screens/SalvageScreen.test.tsx`
- `tests/ui/screens/WreckSelectScreen.test.tsx`
- `tests/ui/screens/ShipyardScreen.test.tsx`
- `tests/ui/screens/CrewManagementScreen.test.tsx`

**Template:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HubScreen } from '../../../src/components/screens/HubScreen';

describe('HubScreen', () => {
  it('should render without crashing', () => {
    render(<HubScreen onNavigate={vi.fn()} />);
    expect(screen.getByText(/Hub/i)).toBeInTheDocument();
  });
  
  it('should display player resources', () => {
    render(<HubScreen onNavigate={vi.fn()} />);
    expect(screen.getByText(/Credits/i)).toBeInTheDocument();
    expect(screen.getByText(/Fuel/i)).toBeInTheDocument();
  });
  
  it('should render navigation buttons', () => {
    render(<HubScreen onNavigate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Graveyard/i })).toBeInTheDocument();
  });
});
```

**Tasks:**
- [ ] Create screen smoke tests (11 screens)
- [ ] Test basic rendering
- [ ] Test key elements visible
- [ ] Test navigation buttons
- [ ] Run `npm run test`
- [ ] Commit: "Add screen smoke tests"

---

#### 11.4: Verify Coverage Target (15 min)

**Tasks:**
- [ ] Run: `npm run test -- --coverage`
- [ ] Compare to baseline (from Step 5)
- [ ] Verify target met (baseline +20% or 70%)
- [ ] Document final coverage in this file

**Final Coverage:** ___ % (to be filled)

---

### Step 12: Create Fresh README and Archive Old Docs (3 hours)

**Goal:** Modern README reflecting current capabilities, archive Phase 8/9 docs

#### 12.1: Write New README (1.5 hours)

**File:** `README.md`

**Content:**
```markdown
# Ship Breakers

A space salvage roguelike game built with React and TypeScript.

## Overview

Manage a crew of salvagers as they loot derelict ships in a procedurally generated graveyard. Balance survival stats, upgrade your ship, and make strategic decisions to maximize profit while keeping your crew alive.

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Zustand** - State management
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **TailwindCSS** - Styling
- **WebAssembly (Rust)** - Procedural generation

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:5174
```

## Game Features

### Crew Management
- Hire up to 5 crew members with unique skills and traits
- Monitor HP, stamina, and sanity
- Configure work thresholds for auto-salvage safety
- Shore leave for recovery and morale

### Salvage Operations
- Explore procedurally generated derelict ships
- Manual salvage with hazard checks based on crew skills
- Auto-salvage with configurable rules
- Crew inventory system (1 item per crew member)

### Ship Upgrades
- Reactor upgrades for power capacity
- Cargo bay expansion
- Equipment slots (planned)
- Room modifications

### Progression
- License tiers unlock new graveyards
- Daily events and random encounters
- Persistent saves (localStorage)
- Death is permanent (roguelike)

## Development

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run all tests
npm run test:ui      # Run tests with UI
npm run lint         # Lint code
npm run preview      # Preview production build
```

### Project Structure

```
src/
├── components/      # React components
│   ├── screens/    # Main screen components
│   ├── ui/         # Reusable UI components
│   └── game/       # Game-specific components
├── game/           # Game logic
│   ├── systems/    # Service layer (salvage, crew, travel)
│   ├── generators/ # Procedural generation
│   └── data/       # Static game data
├── stores/         # Zustand state management
├── types/          # TypeScript type definitions
├── hooks/          # Custom React hooks
└── utils/          # Utility functions
```

### Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design, data flow, and contribution guidelines.

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test salvage

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

**Test Coverage:** ___% (48+ test files)

- Unit tests: Game logic, services, systems
- Integration tests: Salvage flow, persistence
- UI tests: Screen rendering, user interactions

### Debug Tools

- **DevTools Panel**: Press `` ` `` (backtick) in-game
- **Console Logging**: Enable in DevTools panel
- **Clear Save**: `http://localhost:5174/clear_save.html`

## Known Issues

See [GitHub Issues](link-to-issues) for current bugs and feature requests.

## License

MIT

## Credits

Developed by [Your Name]
```

**Tasks:**
- [ ] Write new README.md
- [ ] Replace placeholder coverage percentage
- [ ] Update links as needed
- [ ] Commit: "Create fresh README for current state"

---

#### 12.2: Archive Old Documentation (1.5 hours)

**Tasks:**
- [ ] Create `archive/docs-phase9/` directory
- [ ] Move old `README.md` to `archive/docs-phase9/README-phase9.md`
- [ ] Move `docs/PHASE_8_*.md` to archive
- [ ] Move `docs/PHASE_9_*.md` to archive
- [ ] Keep in docs/:
  - `docs/TODO.md`
  - `docs/ARCHITECTURE.md` (to be created)
  - `docs/SERVICE_DEPENDENCIES.md`
- [ ] Create `archive/README.md`:
  ```markdown
  # Archive Directory
  
  **⚠️ DO NOT IMPORT FROM THIS ARCHIVE ⚠️**
  
  This directory contains historical code and documentation for reference only.
  
  ## Contents
  
  ### ship-breakers-phase8-snapshot/
  Complete Phase 8 codebase snapshot before Phase 9 crew inventory feature.
  All source files converted to .txt to prevent accidental imports.
  
  ### docs-phase9/
  Documentation from Phase 8 and Phase 9 development cycles.
  - PHASE_8_*.md - Phase 8 UI overhaul documentation
  - PHASE_9_*.md - Phase 9 crew inventory implementation
  - README-phase9.md - Old README with outdated status
  
  ### SalvageScreen.old.txt
  Original 1148-line SalvageScreen before Phase 9 refactor.
  Current version: 500 lines (55% reduction)
  
  ### old-root-configs/
  Historical configuration files (.txt format)
  
  ## History
  
  - **Phase 8** (Dec 2025): UI overhaul, ship grid, crew panel
  - **Phase 9** (Jan 2026): Crew inventory, auto-salvage, work thresholds
  - **Phase 10** (Jan 2026): Architecture refactor, service extraction
  
  ## Retrieval
  
  If you need code from the archive:
  1. Check git history first: `git log --all -- path/to/file`
  2. If not in git, reference .txt files in this archive
  3. Never import directly from archive - copy and adapt to current architecture
  ```
- [ ] Commit: "Archive Phase 8/9 documentation"

---

### Step 13: Create ARCHITECTURE.md for Review (4 hours)

**Goal:** Comprehensive architecture documentation for review and approval

**File:** `docs/ARCHITECTURE.md`

**Outline:**
1. System Overview
2. Architecture Diagram (ASCII)
3. Data Flow
4. Component Hierarchy
5. State Management
6. Service Layer
7. Testing Strategy
8. Development Guidelines
9. Onboarding Guide

**Tasks:**
- [ ] Write system overview (30 min)
- [ ] Create ASCII architecture diagram (1 hour)
- [ ] Document data flow with examples (1 hour)
- [ ] Create component hierarchy tree (30 min)
- [ ] Write state management guide (30 min)
- [ ] Document service boundaries (30 min)
- [ ] Write testing strategy (30 min)
- [ ] Add onboarding guide (30 min)
- [ ] Commit: "Create comprehensive ARCHITECTURE.md"
- [ ] **REQUEST REVIEW** before marking Step 13 complete

**Template:**

```markdown
# Ship Breakers - Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Data Flow](#data-flow)
4. [Component Hierarchy](#component-hierarchy)
5. [State Management](#state-management)
6. [Service Layer](#service-layer)
7. [Testing Strategy](#testing-strategy)
8. [Development Guidelines](#development-guidelines)
9. [Onboarding Guide](#onboarding-guide)

---

## System Overview

Ship Breakers is a React-based roguelike game with a service-oriented architecture. The application follows a unidirectional data flow pattern using Zustand for state management and pure functions in a service layer for business logic.

### Key Principles

- **Separation of Concerns**: UI components, state management, and business logic are strictly separated
- **Testability**: Pure functions in services enable comprehensive unit testing
- **Type Safety**: Strict TypeScript with minimal type assertions
- **Immutability**: State updates via Zustand's immutable patterns

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      React Components                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Screens │  │    UI    │  │   Game   │  │  Debug   │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘   │
│        │             │             │             │          │
└────────┼─────────────┼─────────────┼─────────────┼──────────┘
         │             │             │             │
         └─────────────┴─────────────┴─────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    Zustand Stores (State)      │
         │  ┌──────────┐  ┌──────────┐   │
         │  │gameStore │  │ uiStore  │   │
         │  └────┬─────┘  └────┬─────┘   │
         └───────┼─────────────┼──────────┘
                 │             │
                 ▼             ▼
         ┌───────────────────────────────┐
         │      Service Layer (Logic)     │
         │  ┌──────────┐  ┌──────────┐   │
         │  │ Salvage  │  │   Crew   │   │
         │  │ Service  │  │ Service  │   │
         │  └────┬─────┘  └────┬─────┘   │
         │  ┌────┴─────┐  ┌────┴─────┐   │
         │  │  Travel  │  │ Shipyard │   │
         │  │ Service  │  │ Service  │   │
         │  └────┬─────┘  └────┬─────┘   │
         │  ┌────┴──────────────┴─────┐   │
         │  │  Progression Service    │   │
         │  └────────────┬────────────┘   │
         └───────────────┼─────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │       Game Logic Layer         │
         │  ┌──────────┐  ┌──────────┐   │
         │  │Generators│  │ Systems  │   │
         │  │(Wreck,   │  │(Traits,  │   │
         │  │ Crew)    │  │ Events)  │   │
         │  └──────────┘  └──────────┘   │
         │  ┌──────────────────────────┐  │
         │  │     Static Data          │  │
         │  │  (Equipment, Zones, etc) │  │
         │  └──────────────────────────┘  │
         └────────────────────────────────┘
```

---

## Data Flow

### Example: Salvaging an Item

```
1. User clicks "Salvage" button
   ↓
2. SalvageScreen.tsx
   - Calls: gameStore.salvageItem(roomId, itemId)
   ↓
3. gameStore.ts
   - Gets current state: const state = get()
   - Calls: SalvageService.salvageItem(state, roomId, itemId)
   ↓
4. SalvageService.salvageItem()
   - Validates crew availability
   - Checks hazards (pure function)
   - Calculates success
   - Returns: { success: boolean, updates: Partial<GameState>, events: Event[] }
   ↓
5. gameStore.ts
   - Applies updates: set(result.updates)
   - Returns result to component
   ↓
6. Component re-renders with new state
   - Crew inventory updated
   - Item removed from room
   - HP/Stamina/Sanity adjusted
```

### Data Flow Rules

1. **Components → Stores**: Always through actions/setters
2. **Stores → Services**: Pass full or partial state as arguments
3. **Services → Services**: Only orchestrators call other services
4. **Services → Stores**: Return updates, never mutate directly
5. **Stores → Components**: Via selectors (Zustand hooks)

---

## Component Hierarchy

```
App
├── DevTools (debug only)
└── Screen Router
    ├── HubScreen
    │   ├── ResourceDisplay
    │   ├── FuelDepotModal
    │   ├── MedicalBayModal
    │   ├── StatsModal
    │   └── SettingsModal
    ├── WreckSelectScreen
    │   ├── GraveyardMap
    │   ├── WreckCard
    │   └── WreckDetailModal
    ├── SalvageScreen
    │   ├── ShipGrid
    │   ├── CrewPanel
    │   ├── RoomDetail
    │   ├── AutoSalvageMenu
    │   └── EmergencyEvacModal
    ├── ShipyardScreen
    │   ├── ShipDisplay
    │   ├── UpgradeList
    │   └── UpgradeModal
    ├── CrewManagementScreen
    │   ├── CrewList
    │   ├── CrewCard
    │   └── CrewDetailModal
    └── CharacterCreationScreen
        ├── BackgroundSelector
        ├── TraitSelector
        └── NameInput
```

---

## State Management

### When to Use Each Pattern

| Pattern | Use Case | Example |
|---------|----------|---------|
| **gameStore** | Game state that persists across screens | Credits, crew, ship, day |
| **uiStore** | UI state shared across components | Modal visibility, toast notifications |
| **useState** | Ephemeral local component state | Form inputs, hover states |
| **useMemo** | Derived data from state | Filtered crew, calculated totals |
| **useEffect** | Side effects (audio, animations) | Play sound on action |

### gameStore Structure

```typescript
interface GameStore {
  // Core State
  credits: number;
  day: number;
  crew: CrewMember[];
  playerShip: PlayerShip;
  currentRun: RunState | null;
  
  // Settings
  settings: GameSettings;
  
  // Actions (call services)
  salvageItem: (roomId, itemId) => void;
  hireCrew: (backgroundId) => void;
  travelToWreck: (wreckId) => void;
  
  // Utility
  migrateSave: (save) => GameState;
}
```

### uiStore Structure

```typescript
interface UIStore {
  // Modal State
  modalState: Record<string, boolean>;
  
  // Toast Notifications
  toasts: Toast[];
  
  // Actions
  openModal: (name) => void;
  closeModal: (name) => void;
  showToast: (message, type) => void;
}
```

---

## Service Layer

### Service Responsibilities

| Service | Domain | Key Methods |
|---------|--------|-------------|
| **SalvageService** | Salvage operations | `salvageItem()`, `runAutoSalvage()`, `checkHazard()` |
| **CrewService** | Crew management | `hireCrew()`, `consumeProvisions()`, `shoreLeave()` |
| **ShipyardService** | Ship upgrades | `buyUpgrade()`, `installEquipment()` |
| **TravelService** | Navigation | `travelToWreck()`, `triggerEvent()` |
| **ProgressionService** | Game progression | `advanceDay()`, `checkLicense()` |

### Service Design Principles

1. **Pure Functions**: Services are stateless, take state as input, return updates
2. **No Direct State Mutation**: Always return new objects
3. **Single Responsibility**: Each service owns one domain
4. **Dependency Graph**: Orchestrators can call leaf services, never reverse
5. **Testability**: All logic testable without Zustand

### Example Service Structure

```typescript
// salvage-service.ts
export class SalvageService {
  static salvageItem(
    state: GameState,
    roomId: string,
    itemId: string
  ): SalvageResult {
    // 1. Validate inputs
    // 2. Check hazards
    // 3. Calculate success
    // 4. Generate updates
    // 5. Return result (never mutate state)
    return {
      success: true,
      updates: { /* partial state */ },
      events: [/* triggered events */]
    };
  }
}
```

---

## Testing Strategy

### Test Pyramid

```
        ┌─────────┐
        │   E2E   │  (Manual QA)
        └─────────┘
      ┌─────────────┐
      │ Integration │  (Flow tests)
      └─────────────┘
    ┌─────────────────┐
    │  Unit (Service) │  (Logic tests)
    └─────────────────┘
  ┌─────────────────────┐
  │ Unit (Pure Functions)│  (Isolated tests)
  └─────────────────────┘
```

### Test Types

#### 1. Unit Tests - Pure Functions
```typescript
// tests/unit/hazard-calculation.test.ts
describe('calculateHazardSuccess', () => {
  it('should return 100% for expert skill vs low hazard', () => {
    const result = calculateHazardSuccess(10, 1);
    expect(result).toBe(100);
  });
});
```

#### 2. Unit Tests - Services
```typescript
// tests/unit/systems/salvage-service.test.ts
describe('SalvageService.salvageItem', () => {
  it('should add item to crew inventory on success', () => {
    const mockState = createMockGameState();
    const result = SalvageService.salvageItem(mockState, 'room1', 'item1');
    
    expect(result.success).toBe(true);
    expect(result.updates.crew[0].inventory).toHaveLength(1);
  });
});
```

#### 3. Integration Tests - Flows
```typescript
// tests/integration/salvage-flow.test.ts
describe('Salvage Flow', () => {
  it('should complete full salvage loop', () => {
    // Setup: Create game state
    // Action: Salvage multiple items
    // Action: Return to station
    // Verify: Credits increased, inventory cleared
  });
});
```

#### 4. UI Tests - Smoke Tests
```typescript
// tests/ui/screens/HubScreen.test.tsx
describe('HubScreen', () => {
  it('should render without crashing', () => {
    render(<HubScreen onNavigate={vi.fn()} />);
    expect(screen.getByText(/Hub/i)).toBeInTheDocument();
  });
});
```

### Coverage Goals

- **Services**: >90% coverage (core logic)
- **Game Systems**: >80% coverage (calculators, generators)
- **Components**: >50% coverage (render tests)
- **Overall**: >70% coverage

---

## Development Guidelines

### Code Style

Follow AGENTS.md standards:
- ES modules with `.js` in TypeScript imports
- Prefer async/await over Promise chains
- camelCase for variables/functions
- PascalCase for types/classes
- kebab-case for file names
- UPPER_CASE for constants

### Adding a New Feature

1. **Define Types** in `types/` modules
2. **Create Service** (if new domain) in `game/systems/`
3. **Update Store** to call service in `stores/gameStore.ts`
4. **Build Component** in `components/screens/` or `components/ui/`
5. **Write Tests** for service logic
6. **Test Integration** manually in dev server
7. **Update ARCHITECTURE.md** if structure changes

### Import Order

```typescript
// 1. External libraries
import { useState } from 'react';
import { create } from 'zustand';

// 2. Type imports
import type { CrewMember } from '../types/crew';

// 3. Internal modules
import { useGameStore } from '../stores/gameStore';
import { SalvageService } from '../game/systems/salvage-service';

// 4. Relative imports
import { Button } from './Button';

// 5. CSS/Assets
import './styles.css';
```

---

## Onboarding Guide

### New Developer Setup

1. **Clone and Install**
   ```bash
   git clone <repo>
   npm install
   npm run dev
   ```

2. **Explore Codebase**
   - Start with `src/App.tsx`
   - Read `src/stores/gameStore.ts` for state shape
   - Review `docs/SERVICE_DEPENDENCIES.md` for architecture

3. **Make First Change**
   - Pick a simple task from `docs/TODO.md`
   - Write failing test first
   - Implement feature
   - Verify tests pass
   - Commit with descriptive message

### Key Files to Read First

1. `src/types/index.ts` - Core type definitions
2. `src/stores/gameStore.ts` - Game state structure
3. `src/game/systems/salvage-service.ts` - Service example
4. `tests/unit/systems/salvage-service.test.ts` - Test example
5. `docs/SERVICE_DEPENDENCIES.md` - Service relationships

### Common Tasks

#### Add New Game Feature
1. Define types in `types/`
2. Create service in `game/systems/`
3. Add action to `gameStore.ts`
4. Build UI in `components/`
5. Write tests

#### Fix Bug
1. Write failing test reproducing bug
2. Debug in service or component
3. Fix bug
4. Verify test passes
5. Commit with "fix:" prefix

#### Refactor Component
1. Ensure tests exist and pass
2. Make changes incrementally
3. Run tests after each change
4. Commit when stable

---

## FAQ

### Q: Why services instead of hooks?
**A:** Services are pure functions, easier to test and reuse. Hooks are for React-specific logic (effects, context).

### Q: When should I use `as any`?
**A:** Never. Use type guards, proper interfaces, or discriminated unions instead.

### Q: How do I add a new modal?
**A:** 
1. Add key to `uiStore.modalState`
2. Use `useModal('newModal')` in component
3. Create modal component with `BaseModalProps`

### Q: Can services call other services?
**A:** Only orchestrators (TravelService, ProgressionService) call leaf services (SalvageService, CrewService). Never create circular dependencies.

### Q: How do I debug state updates?
**A:** 
- Enable DevTools (press `` ` `` in game)
- Check console logging
- Use Zustand devtools extension
- Add breakpoints in service functions

---

## Glossary

- **Leaf Service**: Service with no dependencies on other services
- **Orchestrator Service**: Service that coordinates multiple services
- **Pure Function**: Function with no side effects, same input = same output
- **Type Guard**: Function that narrows TypeScript types (e.g., `isEquipment()`)
- **Barrel Export**: `index.ts` that re-exports from multiple files
- **Smoke Test**: Basic test ensuring component renders without crashing

---

## Changelog

- **Phase 10** (Jan 2026): Service layer extraction, type reorganization
- **Phase 9** (Jan 2026): Crew inventory, auto-salvage, work thresholds
- **Phase 8** (Dec 2025): UI overhaul, ship grid, crew panel

---

**Last Updated:** January 2, 2026  
**Maintainer:** [Your Name]
```

---

### Step 14: Final Verification and Comprehensive Testing (5 hours)

**Goal:** Ensure everything works before declaring Phase 10 complete

#### 14.1: Dependency and Build Verification (1 hour)

**Tasks:**
- [ ] Run: `npm install` (ensure clean install)
- [ ] Run: `npm run lint`
- [ ] Fix import order issues per AGENTS.md:
  ```
  1. External libraries (react, zustand)
  2. Type imports (import type { ... })
  3. Internal modules (stores, game, utils)
  4. Relative imports (../, ./)
  5. CSS/Assets
  ```
- [ ] Run: `npm run build`
- [ ] Verify production build succeeds
- [ ] Check build output size (should be <2MB)

**Verification:**
```bash
npm run lint  # Should pass
npm run build # Should succeed
ls -lh dist/  # Check bundle size
```

---

#### 14.2: Test Suite Verification (1 hour)

**Tasks:**
- [ ] Run: `npm run test -- --coverage`
- [ ] Verify all tests pass (target: 48+ tests)
- [ ] Verify coverage meets target (baseline +20% or 70%)
- [ ] Review coverage report for gaps
- [ ] Document final coverage percentage

**Final Test Results:**
- Total Tests: ___ / 48+
- Passing: ___ 
- Coverage: ___ %
- Target Met: [ ] Yes [ ] No

---

#### 14.3: Manual QA Testing (2 hours)

**Test Checklist:**

**Character Creation:**
- [ ] Start new game
- [ ] Select background
- [ ] Choose traits
- [ ] Enter name
- [ ] Verify starting resources

**Hub Screen:**
- [ ] View resources (credits, fuel, day)
- [ ] Open fuel depot modal
- [ ] Open medical bay modal
- [ ] Open stats modal
- [ ] Open settings modal
- [ ] Verify crew work thresholds sliders
- [ ] Navigate to graveyard

**Wreck Selection:**
- [ ] View available wrecks
- [ ] Filter by tier
- [ ] Select wreck
- [ ] Verify fuel cost calculation
- [ ] Travel to wreck

**Salvage Operations:**
- [ ] View ship grid
- [ ] View crew panel
- [ ] Salvage item manually
- [ ] Verify item goes to crew inventory
- [ ] Transfer item to ship cargo
- [ ] Configure auto-salvage rules
- [ ] Run auto-salvage
- [ ] Verify work thresholds respected
- [ ] Emergency evacuate

**Return to Station:**
- [ ] Travel back to station
- [ ] Verify cargo sold
- [ ] Verify credits increased
- [ ] Check crew recovery

**Ship Upgrades:**
- [ ] Visit shipyard
- [ ] View available upgrades
- [ ] Purchase reactor upgrade
- [ ] Purchase cargo expansion
- [ ] Verify changes applied

**Crew Management:**
- [ ] View crew list
- [ ] Check crew stats
- [ ] Hire new crew member
- [ ] View crew traits
- [ ] Verify crew limit (5 max)

**Provisions:**
- [ ] Consume food/drink
- [ ] Verify HP/stamina/sanity effects
- [ ] Shore leave crew members
- [ ] Verify recovery

**Save/Load:**
- [ ] Game auto-saves
- [ ] Close browser
- [ ] Reopen game
- [ ] Verify state restored
- [ ] Try clear save: `http://localhost:5174/clear_save.html`

---

#### 14.4: Documentation Review (30 min)

**Tasks:**
- [ ] Review ARCHITECTURE.md for accuracy
- [ ] Verify all code examples compile
- [ ] Check all internal links work
- [ ] Ensure terminology consistent
- [ ] **Get approval** on ARCHITECTURE.md

**Approval Required Before Completion**

---

#### 14.5: Final Commit and Tag (30 min)

**Tasks:**
- [ ] Review all changes: `git status`
- [ ] Stage all files: `git add .`
- [ ] Commit with comprehensive message:
  ```bash
  git commit -m "Phase 10: Complete architecture refactor
  
  Major changes:
  - Extracted 5 services from gameStore (1981→<500 lines)
  - Reorganized types into domain modules
  - Centralized modal management in uiStore
  - Removed 30+ type assertions
  - Rewrote test suite for service architecture
  - Achieved ___% test coverage (target: 70%)
  - Created fresh README and ARCHITECTURE.md
  - Archived Phase 8/9 docs and ship-breakers/ duplicate
  - Cleaned 550MB waste (duplicates, MCP servers)
  
  Breaking changes:
  - Import paths changed (types/* instead of types)
  - Store actions now call services
  - Modal state moved to uiStore
  
  See ARCHITECTURE.md for new structure."
  ```
- [ ] Tag release: `git tag -a phase10-complete -m "Phase 10 complete: Architecture refactor"`
- [ ] Push: `git push origin main --tags`

---

## Phase 10 Completion Checklist

### Phase 10a: Cleanup ✅
- [ ] Step 1: Audit and document codebase
- [ ] Step 2: Delete MCP servers
- [ ] Step 3: Clean backup files
- [ ] Step 4: Archive ship-breakers/
- [ ] Tag: `phase10a-complete`

### Phase 10b: Refactoring ✅
- [ ] Step 5: Measure test coverage baseline
- [ ] Step 6: Reorganize types into modules
- [ ] Step 7: Draw service dependency graph
- [ ] Step 8: Extract 5 core services
  - [ ] 8.1: SalvageService
  - [ ] 8.2: CrewService
  - [ ] 8.3: ShipyardService
  - [ ] 8.4: TravelService
  - [ ] 8.5: ProgressionService
  - [ ] 8.6: Reduce gameStore to <500 lines
- [ ] Step 9: Centralize modal management
- [ ] Step 10: Improve type safety
  - [ ] 10.1: gameStore.ts
  - [ ] 10.2: SlotManager.ts
  - [ ] 10.3: WreckGenerator.ts
  - [ ] 10.4: Remaining files
- [ ] Step 11: Rewrite test suite
  - [ ] 11.1: Update test imports
  - [ ] 11.2: Create service boundary tests
  - [ ] 11.3: Add screen smoke tests
  - [ ] 11.4: Verify coverage target
- [ ] Step 12: Create fresh README and archive docs
- [ ] Step 13: Create ARCHITECTURE.md (requires review)
- [ ] Step 14: Final verification
  - [ ] 14.1: Build verification
  - [ ] 14.2: Test suite verification
  - [ ] 14.3: Manual QA
  - [ ] 14.4: Documentation review (requires approval)
  - [ ] 14.5: Final commit and tag

### Success Criteria ✅
- [ ] Zero duplicate code (ship-breakers/ archived)
- [ ] Zero bloat (.github/mcp/ deleted, 550MB freed)
- [ ] gameStore.ts <500 lines (from 1981)
- [ ] 5 services with clear boundaries
- [ ] <5 `as any` casts remaining (from 30+)
- [ ] Test coverage meets target
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Game plays without regressions
- [ ] Fresh README reflects current state
- [ ] ARCHITECTURE.md reviewed and approved
- [ ] Tag: `phase10-complete`

---

## Notes

### Baseline Coverage Results

**Measured:** ___ (Date: ___)

```
Statement   : ____%
Branch      : ____%
Function    : ____%
Line        : ____%
```

**Target:** max(baseline + 20%, 70%)

---

### Final Coverage Results

**Measured:** ___ (Date: ___)

```
Statement   : ____%
Branch      : ____%
Function    : ____%
Line        : ____%
```

**Target Met:** [ ] Yes [ ] No

---

### Deferred Items

_(Items identified during Phase 10 that are deferred to Phase 11)_

1. 
2. 
3. 

---

### Lessons Learned

_(To be filled during execution)_

1. 
2. 
3. 

---

**Phase 10 Status:** 🔴 Not Started | 🟡 In Progress | 🟢 Complete

**Last Updated:** January 2, 2026
