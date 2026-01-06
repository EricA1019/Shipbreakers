# Ship Breakers - AI Coding Agent Instructions

## Project Overview
Ship Breakers is a roguelike salvage game built with React 19, TypeScript, Zustand, and Tailwind CSS. Players manage a crew salvaging derelict ships in a space graveyard.

## Architecture

### State Management Pattern
- **gameStore** ([src/stores/gameStore.ts](../src/stores/gameStore.ts)) is the central state hub (~140 lines). It **composes feature slices** using Zustand's slice pattern.
- **Feature Slices** ([src/stores/slices/](../src/stores/slices/)) organize state and actions by domain:
  - `crewSlice.ts` - Crew roster, hiring, skills, inventory, movement (~500 lines)
  - `economySlice.ts` - Credits, fuel, provisions, licenses (~250 lines)
  - `salvageSlice.ts` - Salvage runs, wreck exploration, loot, auto-salvage (~1100 lines)
  - `shipSlice.ts` - Player ship, equipment installation, expansion (~150 lines)
  - `eventsSlice.ts` - Game events and event chains (~50 lines)
  - `coreSlice.ts` - Game initialization, settings, stats (~250 lines)
- **Services** ([src/services/](../src/services/)) are **pure functions** that take state slices and return `{ success, updates?, error? }` objects.
- **Systems** ([src/game/systems/](../src/game/systems/)) contain game logic (event management, crew generation, etc.)
- Never mutate state directly—always return updates for Zustand to apply.

```typescript
// Slice pattern example (from economySlice)
export const createEconomySlice: StateCreator<GameState, [], [], EconomySliceState & EconomySliceActions> = (set, get) => ({
  credits: 0,
  fuel: 0,
  buyFuel: (amount: number) => {
    const cost = amount * FUEL_PRICE;
    if (get().credits < cost) return false;
    set((state) => ({ credits: state.credits - cost, fuel: state.fuel + amount }));
    return true;
  },
});
```

### Component Conventions
- **Screens** ([src/components/screens/](../src/components/screens/)) are full-page views, one per game state
- **UI components** ([src/components/ui/](../src/components/ui/)) are reusable Industrial-themed components
- **Game components** ([src/components/game/](../src/components/game/)) handle ship grids and salvage visualization
- Use `useGameStore((s) => ({ ...subset }))` selector pattern to minimize re-renders

### Type System
- All types live in [src/types/index.ts](../src/types/index.ts) (~780 lines)
- Domain re-exports in [src/types/domains/](../src/types/domains/) for scoped imports
- Type guards in [src/types/utils.ts](../src/types/utils.ts) (e.g., `isHazardType()`, `isPlayerShipRoom()`)
- Avoid `as any`—use type guards or properly typed fixtures from [tests/fixtures/index.ts](../tests/fixtures/index.ts)

### Game Logic
- **Constants** in [src/game/constants.ts](../src/game/constants.ts) - Balance values, XP formulas, pricing, etc.
- **Calculations** in [src/game/calculations.ts](../src/game/calculations.ts) - Pure calculation functions (`calculateTravelCost()`, `calculateSalvageXp()`, etc.)
- **Factories** in [src/game/factories.ts](../src/game/factories.ts) - Default object creators (`createDefaultCaptain()`, `createDefaultItemFlags()`, etc.)
- **Static data** in [src/game/data/](../src/game/data/) - Equipment, traits, backgrounds, events
- **Systems** in [src/game/systems/](../src/game/systems/) - EventManager, CrewGenerator, TraitEffectResolver, slotManager
- **WASM bridge** in [src/game/wasm/WasmBridge.ts](../src/game/wasm/WasmBridge.ts) - Procedural generation (fallback to TS if unavailable)

### Utilities
- **crewHelpers.ts** ([src/utils/crewHelpers.ts](../src/utils/crewHelpers.ts)) - DRY crew operations: `updateCrewById()`, `findActiveCrew()`, `clampCrewStats()`, `updateSelectedCrew()`
- **mathUtils.ts** ([src/utils/mathUtils.ts](../src/utils/mathUtils.ts)) - Common math: `clamp()`, `lerp()`, `mapRange()`

## Development Commands
```bash
npm run dev          # Vite dev server (typically localhost:5173)
npm run build        # TypeScript compile + Vite build
npm test             # Vitest watch mode
npm test -- --run    # Single test run
npm run lint         # ESLint
```

VS Code tasks available: `Launch Ship Breakers`, `Build Ship Breakers`, `Test Ship Breakers`

## Testing Patterns
- Tests in [tests/](../tests/) organized by: `unit/`, `integration/`, `ui/`, `game/`
- Use fixtures from [tests/fixtures/index.ts](../tests/fixtures/index.ts): `createMockCrew()`, `createMockGameState()`, `createMockWreck()`, etc.
- Test setup in [tests/setupTests.ts](../tests/setupTests.ts) mocks `HTMLMediaElement.play()` and silences icon warnings
- Services are tested in isolation with mock state slices

```typescript
// Test pattern example
import { createMockGameState, createMockCrew } from '../fixtures';
const state = createMockGameState({ credits: 500 });
const result = buyFuel(state, 10);
expect(result.success).toBe(true);
```

## Key Patterns to Follow

### Modal System
Centralized via [src/stores/modalStore.ts](../src/stores/modalStore.ts). Open modals with `openModal(type, data)`, not prop drilling.

### Event System  
Events defined in [src/game/data/events.ts](../src/game/data/events.ts). Triggered via `pickEventByTrigger()`, applied via `applyEventChoice()` in EventManager.

### Equipment/Slot System
Uses [src/game/systems/slotManager.ts](../src/game/systems/slotManager.ts): `canInstall()`, `installItem()`, `uninstallItem()`, `getActiveEffects()`.

### Crew System
- `CrewMember` has: `hp`, `stamina`, `sanity`, `skills`, `traits`, `status`, `currentJob`
- `CrewService` handles capacity, availability, status transitions
- Crew generation via `CrewGenerator.ts` with backgrounds and traits from data files

## File Naming
- Components: `PascalCase.tsx`
- Services/stores: `camelCase.ts`
- Tests: `*.test.ts` or `*.test.tsx` mirroring source structure
