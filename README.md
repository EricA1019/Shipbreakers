# Ship Breakers

A roguelike salvage game where you manage a crew salvaging derelict ships in a dangerous space graveyard.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Features

### Core Gameplay
- **Salvage Loop**: Travel to wrecks → Salvage rooms → Collect loot → Return → Sell
- **Crew Management**: Hire, heal, and manage crew members with unique traits
- **Ship Upgrades**: Install equipment in your ship's rooms
- **Survival**: Manage food, water, and crew morale
- **Licensing**: Upgrade your salvage license to access deeper zones

### Game Systems
- Procedural wreck generation with WASM-based layouts
- Skill-based hazard resolution (technical, combat, salvage, piloting)
- Trait and background system for crew identity
- Shore leave activities for crew recovery
- Random events during salvage operations

## Controls

| Screen | Action |
|--------|--------|
| Hub | Select wreck, manage crew, upgrade ship |
| Wreck Select | Choose from available wrecks |
| Salvage | Click rooms/items to salvage |
| Crew | Manage roster, heal, assign jobs |
| Shipyard | Install/uninstall equipment |

## Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run test      # Run test suite (200+ tests)
npm run lint      # Run linter
```

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Zustand** - State management
- **Vite** - Build tool
- **Vitest** - Testing
- **Tailwind CSS** - Styling
- **Rust/WASM** - Procedural generation

## Project Structure

```
src/
├── components/     # React components
│   ├── screens/    # Full-screen views
│   ├── ui/         # Reusable UI components
│   ├── game/       # Game-specific components
│   └── debug/      # Development tools
├── game/           # Game logic
│   ├── data/       # Static data (equipment, traits)
│   ├── systems/    # Game systems (crew, events)
│   └── wasm/       # WASM bridge
├── services/       # Business logic services
├── stores/         # Zustand stores
├── types/          # TypeScript types
│   └── domains/    # Domain-specific type re-exports
└── utils/          # Utility functions
```

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [SERVICE_DEPENDENCIES.md](docs/SERVICE_DEPENDENCIES.md) - Service dependency graph
- [docs/](docs/) - Phase implementation docs

## License

MIT
- Zustand (state management)
- Tailwind CSS (styling)
- Vite (build tool)
- Vitest (testing)

## Development Notes

This is a **Phase 0 "Dirty Prototype"** - built for speed to validate core mechanics.

See `docs/PROTOTYPE_SCOPE.md` for full feature breakdown.

## Debug

Game state is exposed on `window.gameStore` for debugging:
```js
// In browser console
gameStore.getState()           // View full state
gameStore.setState({ credits: 50000 })  // Cheat credits
```

---

**Status**: ✅ Playable MVP  
**Version**: 0.1.0  
**Last Updated**: Dec 30, 2025
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
