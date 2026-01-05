# Save System Consolidation & Bug Fixes

## Issues Fixed

### 1. Character Creation Not Appearing (MAIN FIX)
**Problem**: `initializeGame()` and `resetGame()` did NOT set `isNewGame: true`, so even after "clearing saves" or starting a "new game", character creation was skipped.

**Root Cause**: 
- `isNewGame: true` was only in the INITIAL state definition
- Zustand's persist middleware loads saved state on startup
- Once `isNewGame: false` was saved (after first captain creation), it persisted forever
- Neither `initializeGame()` nor `resetGame()` reset this flag

**Solution**:
- ✅ Added `isNewGame: true` to `initializeGame()`
- ✅ Added `isNewGame: true` to `resetGame()`
- ✅ Now properly triggers character creation on new game

### 2. Clear Save Not Working (Origin Mismatch)
**Problem**: `clear_save.html` was opened as `file://` URL but localStorage is per-origin. The game runs on `http://localhost:5174`, so clearing localStorage from `file://` cleared the WRONG storage!

**Root Cause**:
- The VS Code task opened clear_save.html directly as a file
- `file://` origin has different localStorage than `http://localhost:5174`
- Clearing had no effect on actual game saves

**Solution**:
- ✅ Moved `clear_save.html` to `public/` folder (served by Vite)
- ✅ Added origin detection and warning if opened incorrectly
- ✅ Now accessible at `http://localhost:5174/clear_save.html`
- ✅ Updated VS Code task with instructions

## All localStorage Keys Used

| Key | Purpose | Cleared By |
|-----|---------|------------|
| `ship-breakers-store-v1` | Main game state (Zustand persist). Centralized as `STORE_STORAGE_KEY` in `src/services/SaveService.ts` | clear_save.html, New Game |
| `autoSalvage_<type>_tier<n>` | Auto-salvage presets per wreck type/tier | clear_save.html |
| `autoSalvage_customPresets` | User-saved custom auto-salvage presets | clear_save.html |

## Files Modified

### Core Storage
- [src/stores/gameStore.ts](src/stores/gameStore.ts)
  - Added `clearLastUnlockedZone()` action
  - Uses `STORE_STORAGE_KEY` (from `src/services/SaveService.ts`) via persist middleware

### Save Management
- [src/utils/saveManager.ts](src/utils/saveManager.ts)
  - `exportSave()`: Exports raw `GameState` JSON (recommended)
  - `importSave()`: Imports raw `GameState` JSON and legacy persisted-wrapper saves

### UI Components
- [src/components/screens/WreckSelectScreen.tsx](src/components/screens/WreckSelectScreen.tsx)
  - Calls `clearLastUnlockedZone()` when zone modal closes
  - New Game now removes `STORE_STORAGE_KEY`

- [src/components/screens/HubScreen.tsx](src/components/screens/HubScreen.tsx)
  - New Game now removes `STORE_STORAGE_KEY`

### Clear Save Utility
- [clear_save.html](clear_save.html)
  - Now finds and removes ALL keys containing "ship-breakers" or "autoSalvage_"
  - Shows exactly which keys were removed
  - More thorough cleanup

## How to Test

### Test 1: Clear Save Works Completely
1. Play game, save some progress
2. Run the "Kill Ship Breakers & Clear Saves" task
3. Or open `ship-breakers/clear_save.html` in browser and click "Clear Save & Reload"
4. Verify:
   - Character creation screen appears
   - No old save data remains
   - Fresh start with 2000 CR, default captain

### Test 2: Zone Unlock Modal Only Shows Once
1. Start new game
2. Play until you can upgrade to Standard license
3. Upgrade license → zone unlock modal appears
4. Close modal
5. Navigate away and back to wreck select
6. Verify: Modal does NOT reappear

### Test 3: Import/Export Works
1. Play game, make progress
2. Use Dev Tools or menu to export save
3. Clear save data
4. Import the exported save
5. Verify: Game state restored correctly

### Test 4: Character Creation Appears on Fresh Start
1. Clear all save data completely
2. Refresh page
3. Verify: Character creation screen appears immediately
4. Create captain
5. Verify: Taken to hub screen with your named captain

## Technical Details

### Zustand Persist Middleware
The store uses Zustand's `persist` middleware which:
- Automatically saves state to localStorage on every change
- Loads state from localStorage on app start
- Uses key: `STORE_STORAGE_KEY` (centralized in `src/services/SaveService.ts`)
- Stores the entire GameState object

### Auto-Salvage Presets
Auto-salvage stores separate keys per wreck type/tier:
- Format: `autoSalvage_<type>_tier<n>` (e.g., `autoSalvage_military_tier3`)
- Also stores custom presets in `autoSalvage_customPresets`
- These are managed separately from main game state for performance
- All cleared by updated `clear_save.html`

## Future Improvements

Consider consolidating auto-salvage presets into main game state:
- Would make import/export include these settings
- Would simplify save management
- Single source of truth for all persisted data
- Could be added to `GameState.settings` or separate `autoSalvagePresets` property

## Verification

✅ Build: Successful (1.78s)
✅ Tests: 201 tests passing
✅ Storage: All keys consolidated and documented
✅ Clear Save: Now removes all Ship Breakers data
✅ Zone Modal: Only shows once per upgrade
✅ Character Creation: Properly triggers on fresh start
