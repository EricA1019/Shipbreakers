# Ship Breakers Architecture

This document describes the high-level architecture and design patterns used in Ship Breakers.

## Overview

Ship Breakers is a roguelike salvage game built with React, TypeScript, and Zustand. The game uses a modular architecture with clear separation between UI components, game logic, and state management.

```
┌─────────────────────────────────────────────────────────────┐
│                        React App                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Components                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │   Screens   │  │     UI      │  │      Game       │ │ │
│  │  │  (views)    │  │ (modals,    │  │   (ShipGrid,    │ │ │
│  │  │             │  │  buttons)   │  │    RoomCard)    │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    State Layer                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │  gameStore  │  │ modalStore  │  │    Services     │ │ │
│  │  │  (zustand)  │  │  (zustand)  │  │   (pure fns)    │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Game Logic                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │   systems/  │  │    data/    │  │      wasm/      │ │ │
│  │  │ (EventMgr,  │  │ (equipment, │  │  (WasmBridge,   │ │ │
│  │  │  CrewGen)   │  │   traits)   │  │   ship layout)  │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/           # React components
│   ├── screens/          # Full-page views (HubScreen, SalvageScreen, etc.)
│   ├── ui/               # Reusable UI (buttons, modals, panels)
│   ├── game/             # Game-specific (ShipGrid, RoomCard)
│   └── debug/            # Dev tools (DebugOverlay)
│
├── game/                 # Game logic (non-React)
│   ├── data/             # Static data definitions
│   │   ├── equipment.ts  # Equipment items
│   │   ├── backgrounds.ts # Crew backgrounds
│   │   ├── traits.ts     # Crew traits
│   │   └── playerShip.ts # Initial ship setup
│   │
│   ├── systems/          # Game systems
│   │   ├── CrewGenerator.ts    # Crew generation
│   │   ├── EventManager.ts     # Event handling
│   │   ├── TraitEffectResolver.ts # Trait effects
│   │   └── slotManager.ts      # Equipment slots
│   │
│   ├── wasm/             # WASM integration
│   │   └── WasmBridge.ts # Bridge to Rust WASM module
│   │
│   ├── constants.ts      # Game constants
│   ├── hazardLogic.ts    # Hazard calculations
│   ├── wreckGenerator.ts # Wreck generation
│   └── lootTables.ts     # Loot generation
│
├── services/             # Business logic services
│   ├── EconomyService.ts   # Buy/sell/license operations
│   ├── CrewService.ts      # Crew management
│   ├── ShipService.ts      # Ship equipment
│   ├── SalvageService.ts   # Salvage calculations
│   └── SaveService.ts      # Save/load/migration
│
├── stores/               # Zustand stores
│   ├── gameStore.ts      # Main game state
│   └── modalStore.ts     # Modal state
│
├── types/                # TypeScript definitions
│   ├── index.ts          # All types (625 lines)
│   ├── utils.ts          # Type utilities and guards
│   └── domains/          # Domain-specific re-exports
│       ├── crew.ts
│       ├── ship.ts
│       ├── items.ts
│       └── ...
│
├── hooks/                # Custom React hooks
│   └── useGameNotifications.ts
│
└── utils/                # Utility functions
    └── debug/            # Debug utilities
```

## State Management

### Zustand Stores

The application uses Zustand for state management with two main stores:

#### gameStore
The main game state store (~1973 lines). Contains:
- Player resources (credits, fuel, provisions)
- Crew roster and management
- Current run state
- Inventory and equipment
- Game settings

#### modalStore
Centralized modal state management. Supports:
- Opening/closing modals by type
- Modal stacking for nested modals
- Confirmation dialogs
- Alert dialogs

### Services Pattern

Services contain pure functions that:
1. Take state as input
2. Return state updates or results
3. Can be tested independently

```typescript
// Example: EconomyService
export function buyFuel(
  state: Pick<GameState, 'credits' | 'fuel'>,
  amount: number
): EconomyResult {
  const cost = amount * FUEL_PRICE;
  if (state.credits < cost) {
    return { success: false, error: 'Insufficient credits' };
  }
  return {
    success: true,
    updates: {
      credits: state.credits - cost,
      fuel: state.fuel + amount,
    },
  };
}
```

## Type System

### Domain Types

Types are organized by domain in `src/types/domains/`:
- `crew.ts` - CrewMember, Skills, Traits
- `ship.ts` - Ship, Room, Wreck
- `items.ts` - Loot, Item, Equipment
- `zones.ts` - GraveyardZone, LicenseTier
- `ui.ts` - Toast, Screen
- `events.ts` - GameEvent, EventChoice
- `game.ts` - GameState, RunState

### Type Guards

Type guards in `src/types/utils.ts` provide runtime type checking:
- `isHazardType()` - Check hazard type validity
- `isSkillType()` - Check skill type validity
- `isPlayerShipRoom()` - Check room has slots
- `hasWreckShip()` - Check wreck has ship data
- `hasLayout()` - Check ship has procedural layout

## Key Patterns

### Component Structure

Screens follow a consistent pattern:
```typescript
// 1. Import hooks and state
const gameState = useGameStore((state) => ({
  credits: state.credits,
  fuel: state.fuel,
}));

// 2. Handle actions
const handleAction = () => {
  const result = someService(gameState, params);
  if (result.success) {
    useGameStore.setState(result.updates);
  }
};

// 3. Render UI
return <div>...</div>;
```

### Procedural Generation

The game uses WASM for procedural generation:

```
User Action → gameStore → WasmBridge → Rust WASM Module
                                            │
                                            ▼
                                    Generated Data
                                    (ship layouts,
                                     room names)
```

### Event System

Events are triggered by game actions:
1. `EventManager.pickEventByTrigger()` selects an event
2. Event is stored in `gameState.activeEvent`
3. `EventModal` displays choices
4. `applyEventChoice()` applies effects

## Testing

Tests are organized by type:
- `tests/unit/` - Unit tests for services and utilities
- `tests/integration/` - Integration tests for game flows
- `tests/ui/` - Component tests
- `tests/game/` - Game-specific component tests

Run tests:
```bash
npm run test          # Watch mode
npm run test -- --run # Single run
```

## Build & Development

```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Future Improvements

### Planned
1. Complete service extraction from gameStore
2. Reduce `as any` casts to <5
3. Add more comprehensive test coverage
4. Implement save import/export UI

### Technical Debt
- gameStore is still large (~1973 lines), target <500
- Some circular dependency workarounds in types
- WASM bridge could use better error handling
