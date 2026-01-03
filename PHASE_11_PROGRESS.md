# Phase 11: Visual Redesign & Audio Integration

## Status: Foundation Complete ✅ | Implementation In Progress ⏳

**Started:** January 2, 2026  
**Last Updated:** January 2, 2026

---

## Objective

Modernize all 11 game screens with industrial "plated panel" aesthetic from mockup, implement comprehensive UI audio feedback, and create reusable design system components.

---

## Completed Work (8/14 tasks) ✅

### 1. UI Archive ✅
- **Location:** `archive/ui-phase10-snapshot/`
- Archived 33 UI components + 11 screens as .txt files
- Preserves Phase 10 UI for rollback if needed

### 2. Font System ✅
- **Installed:** `@fontsource/orbitron` (weights 500, 800)
- **Downloaded:** JetBrains Mono weights (Regular, Medium, SemiBold, Bold, ExtraBold)
- **Imported:** Orbitron in `main.tsx`
- **Added:** @font-face declarations for all JetBrains Mono weights in `index.css`

### 3. Color Palette & Styles ✅
Updated `index.css` with new CSS custom properties:
```css
--bg0: #07080a        /* deep background */
--bg1: #0b0d10        /* secondary background */
--haz: #f2b233        /* hazard amber */
--cyan: #38e0c7       /* scan teal */
--rust: #ff6a2a       /* heat/oxide */
--ok: #71ff78         /* safe green */
--bad: #ff4b4b        /* danger red */
--text: #e9edf2       /* primary text */
--muted: #8b95a5      /* muted text */
```

Added:
- Radial gradient backgrounds with scan sweep overlay
- `sweep` keyframe animation for ambient scan effect
- Applied to `<body>` element globally

### 4. HTML Mockups ✅
Created static mockups in `docs/mockups/`:

**hub_industrial.html**
- Top status bar with chips (Day, Credits, Fuel)
- Station services grid (6 buttons)
- Haul management with loot items
- License status & upgrade
- Crew roster cards (3 members)
- Station bar & shore leave
- System options

**salvage_industrial.html**
- Top status bar (Fuel, Cargo, Value, Hazards)
- Deck scanner with room map
- Operations buttons (Auto-salvage, Return, Evac)
- Crew status cards with inventory
- Ship cargo summary with loot list

### 5. Design System Components ✅

**IndustrialPanel.tsx** - Main container component
- Props: `title`, `subtitle`, `icon`, `variant`, `showTape`, `showRivets`, `headerRight`, `footer`
- Variants: default, warning, danger, success
- Features: hazard tape stripe, corner rivets, inner rim shadow
- JSDoc examples included

**StatChip.tsx** - Glowing metric display
- Props: `label`, `value`, `variant`
- Variants: amber, cyan, green, red, orange
- Shine animation effect
- Orbitron font for values

**StatusPill.tsx** - Status indicator with dot
- Props: `label`, `icon`, `variant`
- Animated pulsing dot option
- Variants: default, warning, danger, info

**HazardTag.tsx** - Small hazard badge
- Props: `label`, `variant`
- Variants: danger, warning, info
- Used in room displays

**IndustrialButton.tsx** - Primary action button
- Props: `title`, `description`, `variant`, `fullWidth`, `onClick`
- Variants: primary, success, danger, info, default
- Audio feedback integrated via `useAudio` hook

### 6. Audio System ✅

**AudioService.ts** - Sound effects manager
- Categories: click, transition, notification, error, success
- Methods: `playClick()`, `playTransition()`, `playNotification()`, `playError()`, `playSuccess()`
- Audio caching and preloading
- Random variant selection
- Respects global volume and enabled settings

**useAudio.tsx** - React hook
- Simple interface for components to play sounds
- Auto-respects settings from uiStore

**uiStore.ts** - Updated with audio settings
- `soundEnabled: boolean` (default: true)
- `soundVolume: number` (default: 0.7, range: 0-1)
- `setSoundEnabled()`, `setSoundVolume()` methods

**Sound Mappings:**
- Click: `Click.wav`, `Click_1.wav`, `Click_2.wav`
- Transition: `Click_Combo.wav`, `Click_Combo_1.wav`
- Notification: `Reverse_Ring.wav`, `Ring_Pitched_Up.wav`
- Error: `Glitch.wav`, `Glitch_1.wav`, `Glitch_19.wav`
- Success: `Tone1_A_Single.wav`, `Tone1_Major.wav`

---

## Remaining Work (6/14 tasks) ⏳

### 9. Replace CyberPanel (Not Started)
**Scope:** 20+ usages across all screens
**Mapping:**
- `CyberPanel` → `IndustrialPanel`
- `title` → `title` (unchanged)
- `variant="warning"` → `variant="warning"` (unchanged)
- `variant="terminal"` → `variant="success"` (green terminal → success variant)
- Add `showTape` where headers need emphasis
- Manual headers → use `subtitle` or `headerRight` props

**Files to update:**
- HubScreen.tsx
- SalvageScreen.tsx
- WreckSelectScreen.tsx
- CrewScreen.tsx
- ShipyardScreen.tsx
- CharacterCreationScreen.tsx
- RunSummaryScreen.tsx
- TravelScreen.tsx
- EquipmentShopScreen.tsx
- SellScreen.tsx
- GameOverScreen.tsx
- All modals using CyberPanel

**After replacement:** Delete `CyberPanel.tsx`

### 10. Redesign HubScreen (Not Started)
**Reference:** `docs/mockups/hub_industrial.html`

**Changes needed:**
- Replace top bar with IndustrialPanel + StatChips (Day, Credits, Fuel)
- Convert station services to grid of IndustrialButtons
- Haul management: use IndustrialPanel with item list
- License status: use IndustrialPanel with StatusPill
- Crew roster: redesign crew cards (HP/Stamina/Sanity bars)
- Add audio to all buttons via `useAudio()`
- Test responsive grid (2-column → 1-column at 960px)

### 11. Redesign SalvageScreen (Not Started)
**Reference:** `docs/mockups/salvage_industrial.html`

**Changes needed:**
- Top bar: IndustrialPanel + StatChips (Fuel, Cargo, Value, Hazards)
- Deck scanner: update styling to match mockup (glow, scan lines)
- Room cards: add HazardTags for hazards
- Crew status: redesign cards with inventory display
- Operations: convert to IndustrialButtons
- Cargo summary: new panel with progress bar
- Add audio to all interactions

### 12. Redesign Remaining 9 Screens (Not Started)
**Order (simple → complex):**
1. TravelScreen.tsx (84 lines) - Already animated, minimal changes
2. RunSummaryScreen.tsx (211 lines) - Stats display
3. GameOverScreen.tsx (84 lines) - Terminal style
4. CharacterCreationScreen.tsx (126 lines) - Trait selection
5. EquipmentShopScreen.tsx (154 lines) - Shop grid
6. SellScreen.tsx (92 lines) - Loot selling
7. CrewScreen.tsx (463 lines) - Crew management
8. ShipyardScreen.tsx (243 lines) - Ship equipment
9. WreckSelectScreen.tsx (351 lines) - Mission selection

**For each screen:**
- Replace CyberPanel → IndustrialPanel
- Replace CyberButton → IndustrialButton
- Add StatChips for key metrics
- Add StatusPills for status indicators
- Wire audio via `useAudio()` on all buttons
- Update color scheme to use CSS variables
- Test responsiveness

### 13. Add Volume Settings (Not Started)
**File:** `src/components/ui/SettingsModal.tsx`

**Add controls:**
- Master volume slider (0-100%)
- Sound effects on/off toggle
- Bind to `uiStore.soundVolume` and `uiStore.soundEnabled`
- Live preview: play click sound on slider change

### 14. Validation & Testing (Not Started)
**Tasks:**
- Run full test suite: `npm test`
- Ensure 200+ tests still pass
- Test responsive breakpoints:
  - 1020px (grid → single column)
  - 560px (stats grid 4col → 2col)
- Verify audio doesn't overlap/clip
- Check reduced-motion preference handling
- Visual comparison: screenshots vs mockups

---

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── IndustrialPanel.tsx        ✅ NEW
│   │   ├── StatChip.tsx               ✅ NEW
│   │   ├── StatusPill.tsx             ✅ NEW
│   │   ├── HazardTag.tsx              ✅ NEW
│   │   ├── IndustrialButton.tsx       ✅ NEW
│   │   ├── CyberPanel.tsx             ⏳ TO DELETE
│   │   └── CyberButton.tsx            ⏳ TO MIGRATE
│   └── screens/
│       └── (11 screens to redesign)   ⏳ PENDING
├── services/
│   └── AudioService.ts                ✅ NEW
├── hooks/
│   └── useAudio.tsx                   ✅ NEW
├── stores/
│   └── uiStore.ts                     ✅ UPDATED (audio settings)
├── index.css                          ✅ UPDATED (colors, fonts, animations)
└── main.tsx                           ✅ UPDATED (Orbitron import)

docs/mockups/
├── hub_industrial.html                ✅ NEW
└── salvage_industrial.html            ✅ NEW

archive/ui-phase10-snapshot/
├── ui/                                ✅ ARCHIVED (33 files)
└── screens/                           ✅ ARCHIVED (11 files)
```

---

## Design Tokens

### Typography
```css
/* Titles/Headers */
font-family: 'Orbitron', sans-serif
font-weight: 800 (ExtraBold)
letter-spacing: 0.14em
text-transform: uppercase

/* Stats/Numbers */
font-family: 'Orbitron', sans-serif
font-weight: 800 (ExtraBold)
font-size: 20-24px

/* Body Text */
font-family: 'JetBrains Mono', monospace
font-weight: 400 (Regular)
```

### Spacing
```css
--radius: 14px      /* Small elements */
--radius2: 18px     /* Panels */
```

### Shadows
```css
--shadow: 0 18px 60px rgba(0,0,0,.55)
--glowA: 0 0 18px rgba(242,178,51,.14)   /* Amber glow */
--glowC: 0 0 18px rgba(56,224,199,.12)   /* Cyan glow */
```

---

## Next Steps

1. **Replace CyberPanel globally** (task #9)
   - Use find/replace with careful review
   - Update props to new API
   - Delete CyberPanel.tsx when complete

2. **Redesign HubScreen** (task #10)
   - Follow hub_industrial.html mockup
   - Test all interactions
   - Verify audio feedback

3. **Redesign SalvageScreen** (task #11)
   - Follow salvage_industrial.html mockup
   - Critical path: most complex screen
   - Test crew/cargo interactions

4. **Continue with remaining screens** (task #12)
   - Work from simple → complex
   - Maintain consistent patterns

5. **Add volume settings** (task #13)
   - Quick win, high user value

6. **Final validation** (task #14)
   - Test suite
   - Responsive testing
   - Audio polishing

---

## Notes

- **Font Strategy:** Using Orbitron (display) + JetBrains Mono (body/stats) provides the sci-fi aesthetic while maintaining readability
- **Audio Assets:** 150+ files available in `SCI-FI_UI_SFX_PACK/` - currently using ~10 core sounds, can expand later
- **Backwards Compatibility:** All archived components available in `archive/ui-phase10-snapshot/` for rollback
- **Performance:** Scan sweep animation is CSS-only, minimal performance impact
- **Accessibility:** Need to add reduced-motion checks for sweep animation and audio feedback

---

## Estimated Remaining Time

- Task #9 (CyberPanel replacement): ~2 hours
- Task #10 (HubScreen redesign): ~3 hours
- Task #11 (SalvageScreen redesign): ~4 hours
- Task #12 (Remaining screens): ~8 hours (avg 50min/screen)
- Task #13 (Volume settings): ~1 hour
- Task #14 (Validation): ~2 hours

**Total Remaining: ~20 hours**  
**Phase 11 Total Estimate: ~28 hours** (8 hours completed + 20 remaining)
