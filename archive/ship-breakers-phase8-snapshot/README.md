# Ship Breakers - Phase 8 Snapshot

**⚠️ DO NOT IMPORT FROM THIS ARCHIVE ⚠️**

This is an archived snapshot of the codebase from **Phase 8**, before Phase 9 crew inventory feature.

All TypeScript source files (`.ts`, `.tsx`) have been converted to `.txt` format to prevent accidental imports.

---

## Archive Date
January 2, 2026

## Purpose
Historical reference for Phase 8 codebase state.

## Key Differences from Current Codebase

### What's Missing (Phase 9 Features)
- ❌ **No CrewMember.inventory field** - Crew members cannot carry items
- ❌ **No crew work threshold settings** - No minCrewHpPercent, minCrewStamina, minCrewSanity
- ❌ **Older gameStore** - 1908 lines vs current 1970+ lines

### File Stats
- **gameStore.ts:** 1908 lines (current: 1970+)
- **No crew inventory system**
- **Phase 8 feature set only**

---

## What Was Archived

### Deleted (Space Saved: ~185MB)
- \`node_modules/\` - 168MB of dependencies
- \`dist/\` - 17MB of build artifacts  
- \`.git/\` - Nested git repository

### Converted to .txt
All source files in \`src/\` directory:
- \`*.ts\` → \`*.ts.txt\`
- \`*.tsx\` → \`*.tsx.txt\`

### Preserved
- Configuration files
- Test files  
- Documentation
- Public assets

---

## How to Use This Archive

### ✅ DO:
- Reference code for historical comparison
- Check old implementation approaches
- Copy small snippets (adapt to current architecture)

### ❌ DON'T:
- Import from this directory in active code
- Use as a starting point for new features
- Run npm install or build commands here

---

**Archived by:** Phase 10a cleanup process  
**Original location:** \`/ship-breakers/\`  
**New location:** \`/archive/ship-breakers-phase8-snapshot/\`  
**For current codebase, use:** \`/src/\`
