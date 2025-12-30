# Ship Breakers - Prototype MVP

A roguelike salvage game where you manage a crew salvaging derelict ships to earn enough credits to escape Cinder Station.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Gameplay

- **Goal**: Accumulate 10,000 CR (prototype goal, full game is 250k CR)
- **Resources**: Credits, Fuel, Crew HP
- **Core Loop**: Hub → Select Wreck → Travel → Salvage Rooms → Return → Sell Loot

## Controls

1. **Hub Screen**: View status, select wreck, or sell loot
2. **Wreck Selection**: Choose from 3 available wrecks (distance vs reward)
3. **Salvage**: Click rooms to extract loot (hazard checks may damage crew)
4. **Return**: Come back to station when ready
5. **Sell**: Convert loot to credits

## Mechanics

- **Fuel**: Consumed by travel (distance × 2 each way)
- **HP**: Crew health, lost on failed hazard checks
- **Time**: Limited salvage window per run (20 actions)
- **Hazards**: Success rate = `(skill × 20) - (hazard × 10)`
- **Damage**: Failed checks = `hazard × 10` HP

## Lose Conditions

- Crew HP reaches 0 (death)
- Insufficient fuel to return (stranded)

## Testing

```bash
npm run test      # Run unit tests
npm run build     # Production build
```

## Tech Stack

- React 19 + TypeScript
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
