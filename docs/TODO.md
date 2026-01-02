# Ship Breakers TODO

**Last Updated**: January 2026

Tracking features, polish items, and deferred work for Ship Breakers.

---

## Phase 8 Cleanup - Completed ✅

### Code Quality (Complete)
- [x] Remove all debug console.log statements (15 removed)
- [x] Add ShipLayout interface to types/index.ts
- [x] Add hasShipLayout type guard
- [x] Update Ship class with optional layout field
- [x] Update ShipGrid.tsx with proper type guards
- [x] Update wreckGenerator.ts with ShipLayout typing
- [x] Update WasmBridge.ts generateShipLayout return type

### Component Architecture (Verified)
- [x] Verified VisualEffects.tsx and standalone components serve different purposes:
  - ScannerEffect (standalone): Scan line overlay effect
  - ScanningProgress (VisualEffects): Progress bar with percentage
  - RadarDisplay (standalone): Static radar with positioned blips
  - RadarDisplay (VisualEffects): Animated radar with random pings
  - HazardWarning (standalone): Simple message box with icon
  - HazardWarning (VisualEffects): Pulsing border warning display

### Production (Pending)
- [ ] Font subsetting for Noto Sans CJK SC (16MB → ~1.5MB) - See scripts/subset-fonts.sh

---

## Phase 7 Implementation Tasks

### Core Systems
- [ ] Add type definitions (SlotType, Item, ItemSlot, ItemEffect, ReactorModule)
- [ ] Extend PlayerShip with reactor and power fields
- [ ] Create equipment templates data file (20+ items)
- [ ] Create reactor templates (5 tiers)
- [ ] Add balance constants to constants.ts
- [ ] Build slot management system (install/uninstall/validate)
- [ ] Implement power budget calculation
- [ ] Implement effect aggregation

### Rust Integration
- [ ] Add shop.rs to game-logic crate
- [ ] Implement generate_shop_stock(day_seed, license_tier)
- [ ] Update WASM bridge
- [ ] Add TypeScript fallback for shop generation

### UI Screens
- [ ] Build ShipyardScreen (room grid, slot management)
- [ ] Build EquipmentShopScreen (categories, daily stock)
- [ ] Build CargoSwapModal (full cargo decisions)
- [ ] Add power budget display component
- [ ] Add license discount display in shipyard

### Gameplay Integration
- [ ] Add equipment drop logic to wreckGenerator (12% rate)
- [ ] Integrate effects into hazardLogic calculations
- [ ] Add fuel efficiency to travel calculations
- [ ] Wire shipyard fees to license tier

### Persistence
- [ ] Add equipment array to GameState
- [ ] Add reactor field to PlayerShip
- [ ] Implement save migration for Phase 6 saves
- [ ] Test save/load round-trip

### Testing
- [ ] Unit tests for slot management
- [ ] Unit tests for power calculations
- [ ] Unit tests for effect aggregation
- [ ] Integration test for equipment drops
- [ ] Manual testing of full flow

---

## Phase 7 Polish (Nice to Have)

- [ ] Equipment comparison tooltips in shop
- [ ] "Currently Equipped" badge on owned items
- [ ] Power warning animation when near capacity
- [ ] Room slot indicators on ship grid
- [ ] "New in Shop" notification badge
- [ ] Manufacturer flavor text display
- [ ] Sound effects for install/uninstall
- [ ] Drag-and-drop equipment installation

---

## Future Phases (Deferred)

### Phase 8 Candidates - Addressed in Phase 9/10
- [x] **Ship Section Purchases** - Moved to Phase 10
- [ ] **Combat Encounters** - Equipment affects combat outcomes
- [ ] **Crew Personal Equipment** - Individual gear slots per crew member
- [ ] **Item Durability** - Equipment degrades with use, requires repair

### Phase 10: Economy & Ship Modifications

**Economy**
- [ ] MarketState type (prices, supply levels)
- [ ] MarketService with daily price fluctuation (±20%)
- [ ] Event-driven price swings (±50% for major events)
- [ ] Price trend indicators (↑/↓) in shop UI

**Ship Modifications**
- [ ] 8×8 maximum ship grid size
- [ ] Room purchase at shipyard (adjacency validation)
- [ ] New rooms: Workshop, Armory, Lounge, Expanded Pantry
- [ ] Room pricing by type, license tier unlocks

**Market Events**
- [ ] Fuel shortage, military surplus, corporate buyout, supply convoy

### Phase 11+ Ideas
- [ ] **Advanced Crafting** - Combine equipment for upgrades
- [ ] **Powered Room States** - Rooms go offline when underpowered
- [ ] **Manufacturer Reputation** - Unlock exclusive gear from corps
- [ ] **Equipment Sets** - Bonuses for matching manufacturer gear
- [ ] **Legendary Effects** - Unique abilities on rare equipment
- [ ] **Equipment Modifications** - Slot add-ons (scopes, capacitors)
- [ ] **Crew Portraits** - Visual character portraits
- [ ] **Idle Templates** - Automated run strategies
- [ ] **Crew Relationships** - Friendship, rivalry, romance

---

## Known Issues / Tech Debt

- [ ] WasmBridge.ts still uses `(this.module as any)` for WASM function calls - needs typed WasmModule interface
- [ ] Font bundle size: 16MB from Noto CJK - subset to common characters for production

---

## Design Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-31 | Installation only at Hub shipyard | Thematic (requires facility), prevents mid-run cheese |
| 2025-12-31 | Cargo swap when full | Creates tension, no "free" equipment |
| 2025-12-31 | License-tiered shipyard fees | Progression reward, credit sink |
| 2025-12-31 | Daily shop rotation via Rust | Reproducible, performant, adds variety |
| 2025-12-31 | Prevent install when over power | Cleaner UX than auto-disable |
| 2025-12-31 | 6 slot types | Enough variety without overwhelming |
| 2025-12-31 | Starting with Salvaged Reactor | Immediate gameplay, room to upgrade |

---

## Balance Notes

### Power Economy
- Starting: 3 power (Salvaged Reactor)
- Mid-game: 5-8 power (Standard/Industrial)
- End-game: 12-20 power (Fusion/Zero Point)
- Equipment costs: 0-3 power based on tier

### Equipment Value
- Tier 1: 200-500 CR
- Tier 2: 500-1,500 CR
- Tier 3: 1,500-4,000 CR
- Tier 4: 4,000-10,000 CR
- Tier 5: 10,000-25,000 CR

### Drop Rates
- Equipment: 12% per room (vs regular loot)
- Legendary: ~1% of equipment drops
- Reactor drops: Only from Tier 4+ wrecks

---

## References

- [PHASE_7_ITEMS_AND_SLOTS.md](./PHASE_7_ITEMS_AND_SLOTS.md) - Full design document
- [CORPORATIONS.md](./CORPORATIONS.md) - Manufacturer lore
- [shipbreakers_tech_stack.md](./shipbreakers_tech_stack.md) - Architecture patterns
