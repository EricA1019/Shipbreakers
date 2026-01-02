# Phase 9 Test Quick Reference

## Running Tests

### All Phase 9 Tests (112 tests)
```bash
npm test -- --run \
  tests/unit/auto-salvage.test.ts \
  tests/unit/survival.test.ts \
  tests/unit/traits.test.ts \
  tests/integration/phase9-full-flow.test.ts \
  tests/integration/phase9-mutations.test.ts \
  tests/integration/phase9-wiring.test.ts
```

### Unit Tests Only (79 tests)
```bash
npm test -- --run tests/unit/auto-salvage.test.ts tests/unit/survival.test.ts tests/unit/traits.test.ts
```

### Integration Tests Only (33 tests)
```bash
npm test -- --run tests/integration/phase9-*.test.ts
```

### Specific Test Files

**Auto-Salvage** (45 tests)
```bash
npm test -- --run tests/unit/auto-salvage.test.ts
```

**Survival** (17 tests)
```bash
npm test -- --run tests/unit/survival.test.ts
```

**Traits** (17 tests)
```bash
npm test -- --run tests/unit/traits.test.ts
```

**Full Flow Integration** (11 tests)
```bash
npm test -- --run tests/integration/phase9-full-flow.test.ts
```

**Mutations** (9 tests)
```bash
npm test -- --run tests/integration/phase9-mutations.test.ts
```

**Wiring Validation** (13 tests)
```bash
npm test -- --run tests/integration/phase9-wiring.test.ts
```

## Test Categories

### Unit Tests

#### Auto-Salvage (45 tests)
- Rule validation
- Preset tests (conservative, balanced, aggressive, etc.)
- Room prioritization
- Stop conditions
- Edge cases
- Stress tests (100-1000 operations)
- Long-term stability

#### Survival (17 tests)
- Provision consumption
- Starvation mechanics
- Dehydration mechanics
- Large crew scenarios
- 365-day simulations

#### Traits (17 tests)
- Effect calculations
- Specific trait tests (greedy, paranoid, workaholic, resilient)
- Max trait stacking
- 10,000 calculation performance test
- Long-term trait consistency

### Integration Tests

#### Full Flow (11 tests)
- Shore leave complete flows
- Daily survival cycles
- Salvage stat consumption
- Auto-salvage execution
- Error handling

#### Mutations (9 tests)
- Store action mutations
- State tracking
- Idempotency
- Concurrent safety
- Rollback capability

#### Wiring (13 tests)
- System connectivity validation
- Store action completeness
- State property verification
- Data flow integrity
- Implementation verification

## Logger Output Examples

### Info Level
```
[INFO] [TEST] Starting Phase 9 full flow test
[INFO] [TEST] Taking shore leave: rest
[INFO] [TEST] ✓ Shore leave rest flow completed successfully
[INFO] [MUTATION] ✓ Shore leave mutations verified
[INFO] [WIRING] ✓ Data flows correctly through full stack
```

### Debug Level
```
[DEBUG] [TEST] Initial crew state { stamina: 30, hp: 60, sanity: 40 }
[DEBUG] [TEST] After shore leave { stamina: 80, hp: 60, credits: 1000 }
[DEBUG] [MUTATION] Before shore leave { stamina: 30, hp: 60 }
[DEBUG] [MUTATION] After shore leave { stamina: 80, staminaDelta: 50, hp: 60 }
[DEBUG] [WIRING] Shore leave rest { initialStamina: 50, finalStamina: 100, changed: true }
```

### Warn Level
```
[WARN] [TEST] Testing shore leave with no crew
[WARN] [TEST] Testing with completely empty pantry
[WARN] [WIRING] Potential stub: functionName
```

## Test File Organization

```
tests/
├── unit/
│   ├── auto-salvage.test.ts      # 45 tests - auto-salvage logic
│   ├── survival.test.ts          # 17 tests - provision/survival
│   └── traits.test.ts            # 17 tests - trait effect calcs
├── integration/
│   ├── phase9-full-flow.test.ts  # 11 tests - complete user flows
│   ├── phase9-mutations.test.ts  # 9 tests - state mutation tracking
│   └── phase9-wiring.test.ts     # 13 tests - system connectivity
├── PHASE9_TEST_SUMMARY.md        # Comprehensive coverage report
├── PHASE9_SESSION_SUMMARY.md     # Session results and findings
└── PHASE9_TEST_QUICK_REF.md      # This file - quick reference
```

## Performance Targets

| Category | Target | Actual | Status |
|----------|--------|--------|--------|
| Trait Calculations (10k) | <1s | <1s | ✅ |
| Room Prioritization (1k) | <100ms | <100ms | ✅ |
| Survival Simulation (365d) | <100ms | <100ms | ✅ |
| Full Test Suite | <5s | ~1.2s | ✅ |

## Watch Mode (for development)

Run tests in watch mode for continuous feedback:
```bash
npm test -- tests/unit/auto-salvage.test.ts
```

## Debugging Tests

To see full logger output and debug a specific test:
```bash
npm test -- --run tests/integration/phase9-full-flow.test.ts 2>&1 | less
```

## Test Patterns

### Unit Test Pattern
```typescript
describe("Feature", () => {
  it("should do something", () => {
    // Arrange
    const input = setupTestData();
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Test Pattern
```typescript
describe("Feature Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.getState().resetGame();
    logInfo("[TEST] Starting integration test");
  });

  it("should complete full flow with logging", () => {
    // Setup
    const initialState = setupState();
    logDebug("[TEST] Initial state", initialState);
    
    // Execute
    performAction();
    
    // Verify
    const finalState = getState();
    logDebug("[TEST] Final state", finalState);
    expect(finalState).toMatchExpectedState();
    
    logInfo("[TEST] ✓ Flow completed successfully");
  });
});
```

## Common Test Scenarios

### Testing Shore Leave
```typescript
useGameStore.setState({
  crewRoster: [captain],
  credits: 1000,
});

useGameStore.getState().takeShoreLeave("rest");

const state = useGameStore.getState();
expect(state.crewRoster[0].stamina).toBeGreaterThan(initialStamina);
```

### Testing Starvation
```typescript
const captain = generateCaptain("Test", "Captain", "lucky", "resilient");
captain.hp = 100;

useGameStore.setState({
  crewRoster: [captain],
  food: 0, // No food triggers starvation
});

// Simulate starvation penalty
const starved = crewRoster.map(c => ({ ...c, hp: c.hp - 5 }));
expect(starved[0].hp).toBe(95);
```

### Testing Auto-Salvage Rules
```typescript
const rules: AutoSalvageRules = {
  maxHazardLevel: 3,
  priorityRooms: ["cargo", "labs"],
  stopOnInjury: true,
  stopOnLowStamina: 20,
  stopOnLowSanity: 15,
};

// Validate rules
expect(validateRules(rules)).toBe(true);
```

## Continuous Integration

Add to your CI pipeline:
```yaml
- name: Run Phase 9 Tests
  run: |
    npm test -- --run \
      tests/unit/auto-salvage.test.ts \
      tests/unit/survival.test.ts \
      tests/unit/traits.test.ts \
      tests/integration/phase9-full-flow.test.ts \
      tests/integration/phase9-mutations.test.ts \
      tests/integration/phase9-wiring.test.ts
```

## Test Coverage Summary

- **Total Tests**: 112
- **Success Rate**: 100%
- **Execution Time**: ~1.2s
- **Coverage Areas**: 
  - Game mechanics
  - Edge cases
  - Performance
  - Stability
  - System wiring
  - Data integrity

## Quick Checks

### Verify All Tests Pass
```bash
npm test -- --run tests/{unit,integration}/phase9-*.test.ts
```

### Check Test Count
```bash
npm test -- --run tests/{unit,integration}/phase9-*.test.ts | grep "Tests"
# Should show: Tests  112 passed (112)
```

### Verify Logger Output
```bash
npm test -- --run tests/integration/phase9-full-flow.test.ts | grep "\[INFO\]"
# Should show multiple [INFO] log entries
```
