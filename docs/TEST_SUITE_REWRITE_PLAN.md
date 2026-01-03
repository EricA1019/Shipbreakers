# Test Suite Rewrite Plan

**Date:** January 2, 2026  
**Objective:** Replace `as any` casts with properly typed fixtures and improve test maintainability

## Current State

- **Total Tests:** 264 passing
- **Test Files:** ~30 files
- **Problem:** Heavy use of `as any` casts (50+ instances)
- **New Assets:** 
  - ✅ Fixtures created (tests/fixtures/index.ts)
  - ✅ Service tests added (3 files, 42 tests)

## Rewrite Priority

### High Priority (Heavy `as any` usage)

1. **tests/unit/survival.test.ts** (~18k lines, ~13 `as any` casts)
   - Food/drink consumption logic
   - License expiration
   - Crew status effects
   - **Impact:** Core survival mechanics

2. **tests/unit/auto-salvage.test.ts** (~25k lines)
   - Auto-salvage AI logic
   - Room assignment
   - **Impact:** Major feature

3. **tests/unit/traits.test.ts** (~10k lines, 1+ `as any`)
   - Trait effect calculations
   - Character generation
   - **Impact:** RPG mechanics

### Medium Priority

4. **tests/unit/crew-status.test.ts** (~5k lines, ~4 `as any`)
   - Crew state transitions
   - Status effects

5. **tests/unit/cargo.test.ts** (~5.5k lines)
   - Inventory management
   - Cargo capacity

6. **tests/unit/ship.test.ts** (~4.8k lines)
   - Ship state management

7. **tests/unit/slotManager.edge.test.ts** (~3k lines, ~9 `as any`)
   - Equipment installation edge cases

8. **tests/unit/shipyardStore.test.ts** (~3k lines, ~3 `as any`)
   - Ship purchase/upgrade

### Low Priority (Minimal changes needed)

9. **tests/integration/** - Already mostly clean
10. **tests/ui/** - UI component tests (different pattern)
11. **tests/unit/hazard.test.ts** - Small, focused
12. **tests/unit/wreckGenerator.test.ts** - Small, focused

## Rewrite Strategy

### Phase 1: Foundation (DONE ✅)
- ✅ Create typed fixtures
- ✅ Add service tests

### Phase 2: Core Game Loop (Priority 1-3)
1. Rewrite survival.test.ts
   - Use `createMockGameState()` 
   - Use `createMockCrew()` for crew members
   - Use `createMockStats()`, `createMockSettings()`
   
2. Rewrite auto-salvage.test.ts
   - Use `createMockWreck()`, `createMockRoom()`
   - Use `createMockCrew()` with proper skills
   
3. Rewrite traits.test.ts
   - Use `createMockCrew()` with trait overrides

### Phase 3: Secondary Systems (Priority 4-8)
4. Crew & ship management tests
5. Equipment & slot management tests

### Phase 4: Polish (Priority 9-11)
6. Clean up remaining `as any` in integration tests
7. Update UI tests if needed

## Execution Plan

**For each test file:**
1. Read current test
2. Identify all `as any` usages
3. Replace with fixture functions
4. Run tests to verify behavior unchanged
5. Commit changes

**Success Criteria:**
- All 264+ tests still pass
- Zero `as any` in test files (except where truly necessary)
- Tests are more readable and maintainable
- New developers can easily write tests using fixtures

## Estimated Effort

- **Phase 2:** ~3-4 files, highest value
- **Phase 3:** ~5 files, medium complexity
- **Phase 4:** ~20 files, mostly small changes

**Total:** Roughly 30 test files to review/rewrite

## Notes

- Preserve existing test logic - only change data setup
- Use fixtures consistently
- Add new fixture functions as needed
- Consider extracting common test setup patterns
