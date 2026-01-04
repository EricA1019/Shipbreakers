# Phase 12 Test Coverage - Error Prevention Tests

## Overview
Created comprehensive test suites to prevent recurring build and runtime errors discovered during Phase 12 implementation.

## Tests Created

### 1. FuelDepotModal Tests (`tests/ui/FuelDepotModal.test.tsx`)
**Coverage:** 11 tests
**Purpose:** Prevent JSX structure errors and ensure bulk operations work correctly

**Key Tests:**
- ✅ Modal renders without crashing
- ✅ Displays current fuel and credits
- ✅ Renders all 4 fuel purchase options
- ✅ "Fill Tank" button renders only when fuel < 100
- ✅ "Fill Tank" button disabled when insufficient credits
- ✅ `refillFuel()` called correctly on Fill Tank click
- ✅ Individual fuel options selectable
- ✅ **JSX structure validation:** Fill Tank button appears BEFORE fuel options (prevents regression of button placement bug)

**Prevented Errors:**
- JSX structure corruption where button was inserted inside `.map()` loop
- Broken ternary expressions in className
- Missing closing tags

---

### 2. MedicalBayModal Tests (`tests/ui/MedicalBayModal.test.tsx`)
**Coverage:** 14 tests
**Purpose:** Ensure bulk crew healing operations work and prevent function declaration corruption

**Key Tests:**
- ✅ Modal renders without crashing
- ✅ Displays crew health status correctly
- ✅ "Heal All Crew" button renders when multiple injured crew exist
- ✅ "Heal All Crew" button NOT rendered when only 1 crew member
- ✅ "Heal All Crew" button NOT rendered when all healthy
- ✅ Button disabled when insufficient credits
- ✅ `healAllCrew()` called correctly on button click
- ✅ **Function integrity test:** Both `handleHeal()` and `handleHealAll()` are defined and callable (prevents function declaration corruption)
- ✅ Health bar color coding (green >75%, yellow >30%, red ≤30%)

**Prevented Errors:**
- Corrupted function declarations (handleHeal merged with handleHealAll)
- Missing button renders
- Incorrect button enable/disable logic

---

### 3. useAudio Hook Tests (`tests/unit/hooks/useAudio.test.ts`)
**Coverage:** 6 test suites
**Purpose:** Ensure all audio methods exist and prevent missing method runtime errors

**Key Tests:**
- ✅ All 9 required methods exist in return object
- ✅ Sound effect methods callable without errors (`playClick`, `playTransition`, `playNotification`, `playError`, `playSuccess`)
- ✅ Music control methods callable without errors (`startMusic`, `stopMusic`, `toggleMusic`, `setMusicVolume`)
- ✅ `setMusicVolume()` accepts 0-1 range
- ✅ **Regression prevention:** Explicitly tests `toggleMusic()` and `setMusicVolume()` exist (prevents TypeScript error in SettingsModal)

**Prevented Errors:**
```typescript
// Before fix (caused build errors):
Property 'toggleMusic' does not exist on type
Property 'setMusicVolume' does not exist on type

// After fix: All methods guaranteed to exist
```

---

## Error Patterns Covered

### 1. **JSX Structure Corruption**
- **Pattern:** Code inserted inside JSX expressions breaking syntax
- **Example:** Button added inside `.map()` callback
- **Test Coverage:** FuelDepotModal - "maintains proper JSX structure"

### 2. **Function Declaration Corruption**
- **Pattern:** Function declarations merged/overlapping during editing
- **Example:** `const handleHeal = () => { const handleHealAll = () => {`
- **Test Coverage:** MedicalBayModal - "handleHeal and handleHealAll functions both defined"

### 3. **Missing Hook Methods**
- **Pattern:** Hook returns incomplete API surface
- **Example:** `toggleMusic()` and `setMusicVolume()` missing from useAudio
- **Test Coverage:** useAudio - "provides toggleMusic and setMusicVolume"

### 4. **Conditional Rendering Logic**
- **Pattern:** UI elements render in wrong conditions
- **Example:** Fill Tank button showing when fuel = 100
- **Test Coverage:** Multiple render condition tests

---

## Test Suite Statistics

```
Total New Tests: 31
├── FuelDepotModal: 11 tests
├── MedicalBayModal: 14 tests
└── useAudio: 6 tests

Overall Suite: 295 tests passing
```

---

## Usage for Future Development

### Running These Tests
```bash
# Run all three test suites
npm test -- tests/ui/FuelDepotModal.test.tsx tests/ui/MedicalBayModal.test.tsx tests/unit/hooks/useAudio.test.ts

# Run specific suite
npm test -- FuelDepotModal
npm test -- MedicalBayModal
npm test -- useAudio
```

### When to Re-run
- After editing FuelDepotModal or MedicalBayModal components
- After modifying useAudio hook or AudioService
- Before committing changes to these files
- In CI/CD pipeline for regression prevention

### Test Patterns to Reuse

**Pattern 1: JSX Structure Validation**
```typescript
it('maintains proper JSX structure', () => {
  render(<Component />);
  const buttons = screen.getAllByRole('button');
  const targetIndex = buttons.findIndex(btn => btn.textContent?.includes('TARGET'));
  const referenceIndex = buttons.findIndex(btn => btn.textContent?.includes('REFERENCE'));
  expect(targetIndex).toBeLessThan(referenceIndex);
});
```

**Pattern 2: Function Existence Verification**
```typescript
it('all required functions are defined', () => {
  const hook = useMyHook();
  expect(hook.method1).toBeDefined();
  expect(hook.method2).toBeDefined();
  expect(() => hook.method1()).not.toThrow();
});
```

**Pattern 3: Conditional Rendering**
```typescript
it('shows element only when condition met', () => {
  // Test condition true
  act(() => setState({ condition: true }));
  render(<Component />);
  expect(screen.getByText('ELEMENT')).toBeDefined();
  
  // Test condition false
  act(() => setState({ condition: false }));
  render(<Component />);
  expect(screen.queryByText('ELEMENT')).toBeNull();
});
```

---

## Maintenance Notes

- Tests use `@testing-library/react` for component tests
- Tests use `vitest` for unit tests
- Mocks are minimal - tests focus on API contracts not implementations
- All tests pass in isolation and as part of full suite
- No flaky tests - all deterministic
