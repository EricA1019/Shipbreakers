# Phase 8 Final Polish - Ship Breakers

## Overview

This document outlines the remaining polish items and bug fixes to complete Phase 8 (UI Overhaul). These are targeted, low-to-medium effort changes that improve UX, type safety, and fix a critical equipment bug.

---

## 🐛 Critical Bug Fix

### Equipment Grid Mapping Bug

**Status**: 🔴 Not Started  
**Effort**: Low (1 line fix)  
**Impact**: High - Equipment drops from wrecks are invisible to players

**Root Cause Analysis**:
In `wreckGenerator.ts`, room equipment is generated correctly (line 84) but when room data is copied to grid cells (lines 139-145), the `equipment` field is **NOT copied**:

```typescript
// Current code (lines 139-145)
const cell = ship.grid[y][x];
cell.id = src.id;
cell.name = src.name;
cell.hazardLevel = src.hazardLevel;
cell.hazardType = src.hazardType;
cell.loot = src.loot;
cell.looted = src.looted;
// MISSING: cell.equipment = src.equipment;  ← BUG!
```

**Fix**:
```typescript
// Add after line 145 in wreckGenerator.ts
cell.equipment = src.equipment;
```

**Files**: 
- `ship-breakers/src/game/wreckGenerator.ts` (line 145)

---

## 🧹 Code Cleanup

### 1. Remove Unnecessary Type Casts

**Status**: 🔴 Not Started  
**Effort**: Low  
**Impact**: Medium - Cleaner code, better type inference

The `Room` interface already has `equipment?: Item | null`, but `gameStore.ts` uses `(room as any).equipment` casts unnecessarily.

**Files**:
- `ship-breakers/src/stores/gameStore.ts` (lines 322, 323, 333, 467, 468, 478)

**Before**:
```typescript
if ((room as any).equipment) {
  const eq = (room as any).equipment;
```

**After**:
```typescript
if (room.equipment) {
  const eq = room.equipment;
```

---

### 2. Remove Debug Console.log

**Status**: 🔴 Not Started  
**Effort**: Low  
**Impact**: Low - Clean production output

**Files**:
- `ship-breakers/src/components/screens/SalvageScreen.tsx` (line 84)

**Remove**:
```typescript
console.log('[SalvageScreen] Wreck loaded:', { 
  id: wreck.id,
  type: wreck.type,
  // ... debug output
});
```

---

### 3. Fix `any` Type in Equipment Filter

**Status**: 🔴 Not Started  
**Effort**: Low  
**Impact**: Low - Type safety

**Files**:
- `ship-breakers/src/stores/gameStore.ts` (line 883)

**Before**:
```typescript
const updatedEquipment = (run.collectedEquipment || []).filter((item: any) => item.id !== dropItemId);
```

**After**:
```typescript
const updatedEquipment = (run.collectedEquipment || []).filter((item) => item.id !== dropItemId);
```

---

## 🔔 Replace alert() with Toast Notifications

### Create Toast System

**Status**: 🔴 Not Started  
**Effort**: Medium  
**Impact**: High - Professional UX feedback

Currently 4 places use browser `alert()` for user feedback. Replace with a Toast notification system.

**New Component**: `ship-breakers/src/components/ui/Toast.tsx`

```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// Add to uiStore:
toasts: Toast[];
addToast: (toast: Omit<Toast, 'id'>) => void;
removeToast: (id: string) => void;
```

**Files to Update**:

| File | Line | Current | Replacement |
|------|------|---------|-------------|
| `ShipyardScreen.tsx` | 45 | `alert('Cannot install...')` | `addToast({ message: '...', type: 'error' })` |
| `ShipyardScreen.tsx` | 53 | `alert('Cannot uninstall...')` | `addToast({ message: '...', type: 'error' })` |
| `EquipmentShopScreen.tsx` | 40 | `alert('Not enough credits')` | `addToast({ message: '...', type: 'warning' })` |
| `EquipmentShopScreen.tsx` | 42 | `alert('Purchased')` | `addToast({ message: '...', type: 'success' })` |

---

## 📝 Type Safety Improvements

### 1. Type the `onNavigate` Prop

**Status**: 🔴 Not Started  
**Effort**: Medium  
**Impact**: Medium - Consistent typing across all screens

Currently all screens use `onNavigate: (s: any) => void`. Create a proper `Screen` type.

**New Type** (add to `types/index.ts`):
```typescript
export type Screen = 
  | 'hub'
  | 'crew'
  | 'salvage'
  | 'travel'
  | 'wreck-select'
  | 'run-summary'
  | 'sell'
  | 'shipyard'
  | 'equipment-shop'
  | 'game-over';

export interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}
```

**Files to Update** (10 screens):
- `HubScreen.tsx`
- `CrewScreen.tsx`
- `SalvageScreen.tsx`
- `TravelScreen.tsx`
- `WreckSelectScreen.tsx`
- `RunSummaryScreen.tsx`
- `SellScreen.tsx`
- `ShipyardScreen.tsx`
- `EquipmentShopScreen.tsx`
- `GameOverScreen.tsx`

---

### 2. Fix EquipmentShopScreen Types

**Status**: 🔴 Not Started  
**Effort**: Medium  
**Impact**: Medium - Type safety in shop system

Heavy use of `any` in this file. Replace with proper `Item` types.

**Current Issues**:
```typescript
const addToInventory = (item: any) => { ... }       // Line 11
const [stock, setStock] = useState<any[]>([]);       // Line 19
const mapped = s.map((x: any) => { ... });           // Line 30
const buy = (item: any) => { ... };                  // Line 39
stock.map((it: any) => ( ... ))                      // Line 79
```

**Fix**: Import `Item` type and use throughout.

---

## 🎨 Screen-Specific UX Improvements

### Quick Wins (Low Effort)

| Screen | Improvement | Effort |
|--------|-------------|--------|
| **SellScreen** | Add item list (currently empty page) | Low |
| **TravelScreen** | Show current fuel + wreck name in header | Low |
| **GameOverScreen** | Add death stats (days survived, runs completed) | Low |

### Medium Effort

| Screen | Improvement | Effort |
|--------|-------------|--------|
| **RunSummaryScreen** | Add rarity colors to loot list, level-up callout | Medium |
| **EquipmentShopScreen** | Show affordability (gray out unaffordable), remove alerts | Medium |
| **CrewScreen** | Compact skill bars, add heal button with cost | Medium |

### Higher Effort (Consider for Phase 9)

| Screen | Improvement | Effort |
|--------|-------------|--------|
| **ShipyardScreen** | Flatten nested slot workflow | High |
| **WreckSelectScreen** | Remove debug Chinese labels, simplify mode toggle | High |

---

## 📋 Implementation Checklist

### Priority 1: Critical Bug
- [x] Fix equipment grid mapping in `wreckGenerator.ts`

### Priority 2: Code Cleanup
- [x] Remove `(room as any)` casts in `gameStore.ts`
- [x] Remove debug `console.log` in `SalvageScreen.tsx`
- [x] Fix `any` type in equipment filter

### Priority 3: Toast System
- [x] Create `Toast.tsx` component
- [x] Add toast state to `uiStore.ts`
- [x] Replace `alert()` in `ShipyardScreen.tsx` (2 instances)
- [x] Replace `alert()` in `EquipmentShopScreen.tsx` (2 instances)

### Priority 4: Type Safety
- [x] Create `Screen` type union
- [x] Create `ScreenProps` interface
- [x] Update all 10 screen components with proper prop types
- [x] Fix `EquipmentShopScreen.tsx` `any` types

### Priority 5: Quick Win UX
- [x] SellScreen: Add loot/equipment item list
- [x] TravelScreen: Add fuel + wreck name display
- [x] GameOverScreen: Add survival stats

---

## 🎯 Success Criteria

Phase 8 is complete when:
1. ✅ Equipment drops are visible and collectible during salvage
2. ✅ No `alert()` calls remain in codebase
3. ✅ No debug `console.log` statements in production code
4. ✅ All screen `onNavigate` props properly typed
5. ✅ SellScreen shows actual items to sell
6. ✅ Test suite passes (now passing)
7. ✅ TypeScript type-check passes (no errors)

---

## 📊 Metrics

| Metric | Before | Target |
|--------|--------|--------|
| `alert()` calls | 4 | 0 |
| Debug console.log | 1 | 0 |
| `any` types (screens) | 30+ | <10 |
| Empty screens | 1 (SellScreen) | 0 |
| TypeScript errors | 0 | 0 |
