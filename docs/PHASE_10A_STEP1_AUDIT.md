# Phase 10a Step 1: Codebase Audit Report

**Date:** January 2, 2026  
**Status:** ✅ Root `/src` is definitively the active codebase

---

## Key Findings

### File Sizes
- **Root gameStore.ts:** 1980 lines (including newline)
- **ship-breakers gameStore.ts:** 1908 lines
- **Difference:** +72 lines in root

### Phase 9 Features Present in Root (MISSING in ship-breakers/)

#### 1. Crew Inventory System
**Root has:** `CrewMember.inventory` field (line 251)
```typescript
inventory: [], // Items currently held by this crew member
```

**ship-breakers:** Uses old ship-level inventory only, no crew inventory field

#### 2. Crew Work Threshold Settings
**Root has:** (lines 300-302)
```typescript
minCrewHpPercent: 50,
minCrewStamina: 20,
minCrewSanity: 20,
```

**ship-breakers:** Basic settings only (lines 222-227), no crew safety thresholds

#### 3. Enhanced Crew Initialization
**Root:** Properly initializes captain and crew with `inventory: []` fields
**ship-breakers:** No inventory initialization for crew members

### Build Configuration Verification

**index.html line 16:**
```html
<script type="module" src="/src/main.tsx"></script>
```
✅ Points to root `/src/main.tsx` (not ship-breakers)

### Evidence That Root is Active

1. ✅ **Crew inventory implementation** - Phase 9 feature fully implemented
2. ✅ **Work threshold settings** - Phase 9 feature fully implemented  
3. ✅ **Build config** - index.html references root /src
4. ✅ **More lines** - Root has additional Phase 9 code
5. ✅ **PHASE_9_IMPLEMENTATION_COMPLETE.md** - Documents root as active codebase

### ship-breakers/ Status

- **Outdated:** Phase 8 snapshot, before Phase 9 crew inventory
- **Missing:** 72 lines of Phase 9 enhancements
- **Purpose:** Appears to be abandoned duplicate or incomplete merge

---

## Conclusion

**Root `/src` is the canonical, active codebase.**

ship-breakers/ can be safely archived as a Phase 8 historical reference.

---

**Audit completed:** January 2, 2026  
**Next step:** Delete MCP servers bloat
