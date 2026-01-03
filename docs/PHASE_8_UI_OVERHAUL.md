# Phase 8: Unified Visual Overhaul

## Overview

Transform Ship Breakers into a sleek, cohesive terminal-aesthetic experience with varied ship silhouettes, multicultural flavor, and polished micro-interactions.

**Theme:** Cyberpunk megacorp dystopia - clean terminal UI, not retro CRT gimmicks

**Estimated Effort:** 12 development days across 6 sub-phases

**Total New/Modified Lines:** ~635 across 14 files

---

## Goals

1. **Visual Unity** - Consistent fonts, colors, spacing, and effects across all screens
2. **Ship Variety** - Procedurally varied ship shapes (T, L, +, I) instead of uniform rectangles
3. **Multicultural Flavor** - Strategic Chinese text placements for authentic megacorp feel
4. **Tactile Feedback** - Micro-interactions that make every click feel responsive
5. **Information Clarity** - Important stats scannable at a glance

---

## Sub-Phase Breakdown

| Phase | Focus | Days | Key Deliverables |
|-------|-------|------|------------------|
| 8A | Foundation | 1-2 | Fonts, design tokens, button states |
| 8B | Rust Shapes | 3-4 | Ship shape generator, WasmBridge |
| 8C | Visual Components | 5-6 | Scanner, radar, status grid, warnings |
| 8D | Bilingual Text | 7-8 | FlavorText system, strategic placements |
| 8E | ShipGrid Enhancement | 9-10 | Non-rectangular layouts, void cells |
| 8F | Polish | 11-12 | Screen integration, testing, accessibility |

---

## Phase 8A: Foundation

### 1. Self-Hosted Font System

**Why:** Consistent monospace rendering with Chinese character support, no external dependencies.

**Fonts:**
| Font | Weight | Size | Purpose |
|------|--------|------|---------|
| JetBrains Mono | 400 | ~50KB | Primary terminal text |
| JetBrains Mono | 700 | ~50KB | Bold headers, emphasis |
| Noto Sans Mono CJK SC | 400 | ~1.5MB | Chinese characters |

**File Structure:**
```
ship-breakers/
└── public/
    └── fonts/
        ├── jetbrains-mono-regular.woff2
        ├── jetbrains-mono-bold.woff2
        └── noto-sans-mono-cjk-sc-regular.woff2
```

**Download Sources:**
- JetBrains Mono: https://github.com/JetBrains/JetBrainsMono/releases
- Noto Sans Mono CJK: https://github.com/googlefonts/noto-cjk/releases

**CSS Changes (index.css):**
```css
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono-bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: 'Noto Sans Mono CJK SC';
  src: url('/fonts/noto-sans-mono-cjk-sc-regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

**Tailwind Config (tailwind.config.cjs):**
```js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Noto Sans Mono CJK SC', 'monospace'],
      },
      colors: {
        // Refined palette
        'terminal-bg': '#0a0a0f',
        'panel-bg': '#111118',
        'border-subtle': 'rgba(251, 191, 36, 0.2)',
        'border-strong': 'rgba(251, 191, 36, 0.4)',
        'glow-amber': 'rgba(251, 191, 36, 0.5)',
        'glow-cyan': 'rgba(34, 211, 238, 0.5)',
        'glow-green': 'rgba(34, 197, 94, 0.5)',
        'glow-red': 'rgba(239, 68, 68, 0.5)',
      },
      boxShadow: {
        'glow-amber': '0 0 10px rgba(251, 191, 36, 0.3)',
        'glow-cyan': '0 0 10px rgba(34, 211, 238, 0.3)',
        'glow-green': '0 0 10px rgba(34, 197, 94, 0.3)',
        'glow-red': '0 0 10px rgba(239, 68, 68, 0.3)',
      },
    },
  },
  plugins: [],
};
```

### 2. Micro-Interaction CSS

**Button States (index.css):**
```css
/* Button feedback - tactile feel */
button:not(:disabled) {
  @apply transition-all duration-150;
}

button:not(:disabled):hover {
  @apply scale-[1.02];
}

button:not(:disabled):active {
  @apply scale-95;
}

button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Focus accessibility */
button:focus-visible,
[role="button"]:focus-visible,
a:focus-visible {
  @apply ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-900 outline-none;
}

/* Interactive cards */
.card-interactive {
  @apply transition-all duration-200 cursor-pointer;
}

.card-interactive:hover {
  @apply border-amber-500 shadow-glow-amber;
}

/* Success/fail flash animations */
@keyframes flash-success {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); }
}

@keyframes flash-fail {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.animate-flash-success {
  animation: flash-success 0.4s ease-out;
}

.animate-flash-fail {
  animation: flash-fail 0.4s ease-out, shake 0.4s ease-out;
}
```

---

## Phase 8B: Rust Ship Shape Generator

### Ship Shape Templates

8 base templates representing different ship classes:

| ID | Type | Shape | Description | Typical Rooms |
|----|------|-------|-------------|---------------|
| 1 | Freighter | T-shape | Wide cargo bay with bridge tower | 5-7 |
| 2 | Military | L-shape | Command section + weapons wing | 4-6 |
| 3 | Science | Cross (+) | Central lab with 4 research pods | 5-7 |
| 4 | Hauler | Long-I | Linear cargo chain | 4-6 |
| 5 | Civilian | Square | Compact passenger block | 3-5 |
| 6 | Luxury | H-shape | Twin hulls with connector | 5-7 |
| 7 | Industrial | U-shape | Open processing bay | 4-6 |
| 8 | Derelict | Scattered | Damaged/fragmented sections | 3-5 |

### Template Definitions (5x5 grid, 1=room, 0=void)

```
FREIGHTER (T-shape):        MILITARY (L-shape):
  0 1 0                       1 0 0
  1 1 1                       1 0 0
  0 1 0                       1 1 1
  0 1 0

SCIENCE (Cross):            HAULER (Long-I):
  0 1 0                       1
  1 1 1                       1
  0 1 0                       1
                              1
                              1

CIVILIAN (Square):          LUXURY (H-shape):
  1 1                         1 0 1
  1 1                         1 1 1
                              1 0 1

INDUSTRIAL (U-shape):       DERELICT (Scattered):
  1 0 1                       1 0 0 1
  1 0 1                       0 1 0 0
  1 1 1                       0 0 1 0
```

### Rust Implementation

**New file: `game-logic/src/shapes.rs`**

```rust
use serde::Serialize;
use std::collections::HashSet;

#[derive(Serialize, Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct GridPosition {
    pub x: i8,
    pub y: i8,
}

#[derive(Serialize)]
pub struct ShipLayout {
    pub positions: Vec<GridPosition>,
    pub width: u8,
    pub height: u8,
    pub template_type: String,
}

// Template definitions as (x, y) offsets from origin
const TEMPLATE_FREIGHTER: &[(i8, i8)] = &[
    (1, 0), (0, 1), (1, 1), (2, 1), (1, 2), (1, 3)
];

const TEMPLATE_MILITARY: &[(i8, i8)] = &[
    (0, 0), (0, 1), (0, 2), (1, 2), (2, 2)
];

const TEMPLATE_SCIENCE: &[(i8, i8)] = &[
    (1, 0), (0, 1), (1, 1), (2, 1), (1, 2)
];

const TEMPLATE_HAULER: &[(i8, i8)] = &[
    (0, 0), (0, 1), (0, 2), (0, 3), (0, 4)
];

const TEMPLATE_CIVILIAN: &[(i8, i8)] = &[
    (0, 0), (1, 0), (0, 1), (1, 1)
];

const TEMPLATE_LUXURY: &[(i8, i8)] = &[
    (0, 0), (2, 0), (0, 1), (1, 1), (2, 1), (0, 2), (2, 2)
];

const TEMPLATE_INDUSTRIAL: &[(i8, i8)] = &[
    (0, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)
];

const TEMPLATE_DERELICT: &[(i8, i8)] = &[
    (0, 0), (3, 0), (1, 1), (2, 2)
];

fn get_template(wreck_type: &str) -> &'static [(i8, i8)] {
    match wreck_type {
        "military" => TEMPLATE_MILITARY,
        "science" => TEMPLATE_SCIENCE,
        "industrial" => TEMPLATE_INDUSTRIAL,
        "luxury" => TEMPLATE_LUXURY,
        "civilian" => TEMPLATE_CIVILIAN,
        "hauler" => TEMPLATE_HAULER,
        "derelict" => TEMPLATE_DERELICT,
        _ => TEMPLATE_FREIGHTER, // Default
    }
}

fn simple_hash(seed: &str) -> u64 {
    seed.bytes().fold(0u64, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u64))
}

pub fn generate_ship_layout(wreck_type: &str, room_count: u8, seed: &str) -> ShipLayout {
    let hash = simple_hash(seed);
    let template = get_template(wreck_type);
    
    // Start with template positions
    let mut positions: Vec<GridPosition> = template
        .iter()
        .map(|(x, y)| GridPosition { x: *x, y: *y })
        .collect();
    
    // Apply transformations based on seed
    let rotate = (hash % 4) as i8;
    let mirror_x = (hash / 4) % 2 == 1;
    let mirror_y = (hash / 8) % 2 == 1;
    
    // Rotate positions
    for _ in 0..rotate {
        for pos in &mut positions {
            let (x, y) = (pos.x, pos.y);
            pos.x = -y;
            pos.y = x;
        }
    }
    
    // Mirror if needed
    if mirror_x {
        for pos in &mut positions {
            pos.x = -pos.x;
        }
    }
    if mirror_y {
        for pos in &mut positions {
            pos.y = -pos.y;
        }
    }
    
    // Normalize to positive coordinates
    let min_x = positions.iter().map(|p| p.x).min().unwrap_or(0);
    let min_y = positions.iter().map(|p| p.y).min().unwrap_or(0);
    for pos in &mut positions {
        pos.x -= min_x;
        pos.y -= min_y;
    }
    
    // Scale to target room count (add or remove rooms)
    while positions.len() < room_count as usize {
        // Add adjacent room
        if let Some(new_pos) = find_adjacent_empty(&positions, hash) {
            positions.push(new_pos);
        } else {
            break;
        }
    }
    
    while positions.len() > room_count as usize && positions.len() > 2 {
        // Remove edge room (maintain connectivity)
        if let Some(idx) = find_removable_room(&positions) {
            positions.remove(idx);
        } else {
            break;
        }
    }
    
    // Calculate bounds
    let width = positions.iter().map(|p| p.x).max().unwrap_or(0) as u8 + 1;
    let height = positions.iter().map(|p| p.y).max().unwrap_or(0) as u8 + 1;
    
    ShipLayout {
        positions,
        width,
        height,
        template_type: wreck_type.to_string(),
    }
}

fn find_adjacent_empty(positions: &[GridPosition], seed: u64) -> Option<GridPosition> {
    let occupied: HashSet<_> = positions.iter().copied().collect();
    let directions = [(0, 1), (0, -1), (1, 0), (-1, 0)];
    
    let mut candidates = Vec::new();
    for pos in positions {
        for (dx, dy) in &directions {
            let new_pos = GridPosition { x: pos.x + dx, y: pos.y + dy };
            if !occupied.contains(&new_pos) && new_pos.x >= 0 && new_pos.y >= 0 {
                candidates.push(new_pos);
            }
        }
    }
    
    if candidates.is_empty() {
        None
    } else {
        Some(candidates[(seed as usize) % candidates.len()])
    }
}

fn find_removable_room(positions: &[GridPosition]) -> Option<usize> {
    // Find a room that can be removed while maintaining connectivity
    for (idx, _) in positions.iter().enumerate() {
        let mut test = positions.to_vec();
        test.remove(idx);
        if is_connected(&test) {
            return Some(idx);
        }
    }
    None
}

fn is_connected(positions: &[GridPosition]) -> bool {
    if positions.is_empty() {
        return true;
    }
    
    let pos_set: HashSet<_> = positions.iter().copied().collect();
    let mut visited = HashSet::new();
    let mut stack = vec![positions[0]];
    
    while let Some(current) = stack.pop() {
        if visited.contains(&current) {
            continue;
        }
        visited.insert(current);
        
        let directions = [(0, 1), (0, -1), (1, 0), (-1, 0)];
        for (dx, dy) in &directions {
            let neighbor = GridPosition { x: current.x + dx, y: current.y + dy };
            if pos_set.contains(&neighbor) && !visited.contains(&neighbor) {
                stack.push(neighbor);
            }
        }
    }
    
    visited.len() == positions.len()
}
```

**Update `game-logic/src/lib.rs`:**

```rust
use wasm_bindgen::prelude::*;
mod names;
mod wreck;
mod shop;
mod shapes;

#[wasm_bindgen]
pub fn generate_ship_name(wreck_id: &str) -> String {
    names::generate_name(wreck_id)
}

#[wasm_bindgen]
pub fn generate_wreck(tier: u8, mass: &str, seed: &str) -> JsValue {
    let w = wreck::generate_wreck(tier, mass, seed);
    serde_wasm_bindgen::to_value(&w).unwrap()
}

#[wasm_bindgen]
pub fn generate_shop_stock(day_seed: u32, license_tier: u8) -> JsValue {
    let s = shop::generate_shop_stock(day_seed, license_tier);
    serde_wasm_bindgen::to_value(&s).unwrap()
}

#[wasm_bindgen]
pub fn generate_ship_layout(wreck_type: &str, room_count: u8, seed: &str) -> JsValue {
    let layout = shapes::generate_ship_layout(wreck_type, room_count, seed);
    serde_wasm_bindgen::to_value(&layout).unwrap()
}
```

---

## Phase 8C: Visual Effect Components

### Component Specifications

#### 1. ScanningProgress.tsx

Cyan-glowing progress bar with block characters.

```tsx
interface ScanningProgressProps {
  progress: number; // 0-100
  label?: string;
  showBlocks?: boolean;
}
```

**Visual Elements:**
- Cyan fill with glow: `bg-cyan-500 shadow-glow-cyan`
- Leading edge pulse: `animate-pulse` on edge pixel
- Block text below: `█░` pattern
- Label above: `SCANNING...` with text-glow

#### 2. RadarDisplay.tsx

SVG radar with sweep line and ping dots.

```tsx
interface RadarDisplayProps {
  contacts: Array<{ id: string; angle: number; distance: number; type: 'friendly' | 'hostile' | 'unknown' }>;
  size?: number;
  sweepSpeed?: number;
}
```

**Visual Elements:**
- Concentric circles: `stroke="rgba(251, 191, 36, 0.1)"`
- Sweep line: Rotating green line with CSS animation
- Pings: Colored dots with `animate-ping` on detection
- Center dot: Player position

#### 3. StatusGrid.tsx

Aligned status text in terminal style.

```tsx
interface StatusGridProps {
  items: Array<{
    label: string;
    status: 'nominal' | 'degraded' | 'critical' | 'offline';
    labelZh?: string;
  }>;
}
```

**Visual Pattern:**
```
LIFE_SUPPORT____ [在线] [NOMINAL]
PROPULSION______ [在线] [NOMINAL]
POWER_CORE______ [降级] [DEGRADED]
WEAPONS_SYS_____ [离线] [OFFLINE_]
```

#### 4. HazardWarning.tsx

Pulsing red alert with bilingual text.

```tsx
interface HazardWarningProps {
  type: 'radiation' | 'combat' | 'environmental' | 'security';
  level: 1 | 2 | 3 | 4 | 5;
  message?: string;
}
```

**Visual Elements:**
- Red border: `border-2 border-red-500 animate-pulse`
- Warning icon: `☢` / `⚔` / `⚠` based on type
- Bilingual header: `警告 WARNING`
- Pulsing blocks: `█ █ █ █ █`

#### 5. BilingualLabel.tsx

Paired English/Chinese text display.

```tsx
interface BilingualLabelProps {
  textEn: string;
  textZh: string;
  variant?: 'inline' | 'stacked';
  size?: 'sm' | 'md' | 'lg';
}
```

**Variants:**
- Inline: `Fuel Depot 燃料站`
- Stacked: Chinese above, English below (smaller)

---

## Phase 8D: Bilingual Flavor Text

### flavorText.ts Definitions

```typescript
// src/utils/flavorText.ts

export interface BilingualText {
  en: string;
  zh: string;
}

// Corporation names (appear on wrecks and in lore)
export const CORP_NAMES: Record<string, BilingualText> = {
  stellar: { en: 'Stellar Heavy Industries', zh: '星辰重工' },
  helios: { en: 'Helios Energy Corp', zh: '太阳能源' },
  frontier: { en: 'Frontier Mining Co', zh: '边疆矿业' },
  exodus: { en: 'Exodus Transit', zh: '远行运输' },
  forge: { en: 'Forge Collective', zh: '锻造联合' },
  nexus: { en: 'Nexus Dynamics', zh: '枢纽动力' },
  atlas: { en: 'Atlas Shipping', zh: '擎天航运' },
  vanguard: { en: 'Vanguard Defense', zh: '先锋防务' },
};

// System status labels
export const STATUS_LABELS: Record<string, BilingualText> = {
  online: { en: 'ONLINE', zh: '在线' },
  offline: { en: 'OFFLINE', zh: '离线' },
  nominal: { en: 'NOMINAL', zh: '正常' },
  degraded: { en: 'DEGRADED', zh: '降级' },
  critical: { en: 'CRITICAL', zh: '危急' },
  standby: { en: 'STANDBY', zh: '待机' },
};

// Warning messages
export const WARNINGS: Record<string, BilingualText> = {
  warning: { en: 'WARNING', zh: '警告' },
  caution: { en: 'CAUTION', zh: '注意' },
  danger: { en: 'DANGER', zh: '危险' },
  radiation: { en: 'RADIATION', zh: '辐射' },
  lowFuel: { en: 'LOW FUEL', zh: '燃料不足' },
  hullBreach: { en: 'HULL BREACH', zh: '船体破损' },
  hostileContact: { en: 'HOSTILE CONTACT', zh: '敌方接触' },
  systemFailure: { en: 'SYSTEM FAILURE', zh: '系统故障' },
};

// Location/service names
export const LOCATIONS: Record<string, BilingualText> = {
  fuelDepot: { en: 'Fuel Depot', zh: '燃料站' },
  medBay: { en: 'Medical Bay', zh: '医疗舱' },
  shipyard: { en: 'Shipyard', zh: '船坞' },
  market: { en: 'Market', zh: '市场' },
  hub: { en: 'Station Hub', zh: '空间站中心' },
  graveyard: { en: 'The Graveyard', zh: '坟场' },
};

// Room types (for ship interiors)
export const ROOM_TYPES: Record<string, BilingualText> = {
  bridge: { en: 'Bridge', zh: '舰桥' },
  engineering: { en: 'Engineering', zh: '工程舱' },
  cargo: { en: 'Cargo Bay', zh: '货舱' },
  medbay: { en: 'Medical Bay', zh: '医疗舱' },
  weapons: { en: 'Weapons', zh: '武器库' },
  reactor: { en: 'Reactor', zh: '反应堆' },
  quarters: { en: 'Crew Quarters', zh: '船员舱' },
  lab: { en: 'Laboratory', zh: '实验室' },
};

// Helper to generate ship designation
export function generateShipDesignation(corpKey: string, id: string): string {
  const corp = CORP_NAMES[corpKey] || CORP_NAMES.stellar;
  return `${corp.zh}-${id.toUpperCase()}`;
}

// Helper to format bilingual inline
export function formatBilingual(text: BilingualText, separator = ' '): string {
  return `${text.en}${separator}${text.zh}`;
}
```

### Strategic Placement Locations (~12 total)

| Location | Usage | Example |
|----------|-------|---------|
| Wreck names | Ship designations | `ISS 星辰-07` |
| Hub status panel | Status badges | `[在线]` `[正常]` |
| Service buttons | Bilingual labels | `燃料站 Fuel Depot` |
| Shop header | Section title | `市场 MARKET` |
| Hazard warnings | Alert headers | `警告 WARNING` |
| Critical alerts | Urgent messages | `警告: 燃料不足` |
| Room labels | Interior navigation | `舰桥 Bridge` |
| Corp names | Wreck origins | `太阳能源 科研船` |
| System status | Terminal readouts | `POWER_CORE [降级]` |
| License display | Tier names | `高级许可 Premium` |
| Game over | Defeat message | `任务失败 MISSION FAILED` |
| Victory | Win message | `脱离成功 ESCAPE ACHIEVED` |

---

## Phase 8E: ShipGrid Enhancement

### Updated ShipGrid.tsx Interface

```tsx
interface GridPosition {
  x: number;
  y: number;
}

interface ShipGridProps {
  layout: GridPosition[];
  rooms: Room[];
  width: number;
  height: number;
  currentRoom?: string;
  onRoomClick?: (roomId: string) => void;
  showVoid?: boolean;
  variant?: 'wreck' | 'player';
}
```

### Rendering Logic

1. **Grid Creation:** Create `width × height` grid array
2. **Room Mapping:** Map `layout` positions to room data
3. **Void Cells:** Empty positions render as dark space (or subtle stars)
4. **Occupied Cells:** Render with room info, hazard indicators, loot counts
5. **Connections:** Draw borders between adjacent occupied cells
6. **Hull Outline:** Thicker border on exterior edges (no adjacent room)

### Visual Differentiation

| Cell Type | Background | Border | Content |
|-----------|------------|--------|---------|
| Void | `bg-transparent` | none | Subtle dots |
| Room (normal) | `bg-zinc-800` | `border-amber-600/20` | Name, hazard |
| Room (current) | `bg-amber-900/30` | `border-amber-500` | Highlighted |
| Room (looted) | `bg-zinc-900` | `border-zinc-700` | Dimmed |
| Room (danger) | `bg-red-900/20` | `border-red-500/50` | Warning glow |

### Connection Rendering

```
Adjacent rooms share a thin border (1px)
Non-adjacent edge = thick border (2px) indicating hull

Example (T-shape):
     ┌───┐
     │ B │        B = Bridge
     └─┬─┘        C = Cargo (center)
   ┌───┼───┐      E = Engineering wings
   │ E │ C │ E │
   └───┴───┴───┘
```

---

## Phase 8F: Polish & Integration

### Screen-by-Screen Integration

| Screen | Effects Applied |
|--------|----------------|
| HubScreen | StatusGrid with bilingual status, prominent credits, service buttons with Chinese |
| WreckSelectScreen | RadarDisplay for contacts, corp names on wreck cards |
| TravelScreen | Starfield (existing), ship silhouette based on layout |
| SalvageScreen | ScanningProgress on room entry, HazardWarning overlay, ShipGrid with varied shape |
| SellScreen | BilingualLabel on section headers |
| ShipyardScreen | Ship layout visualization, room labels bilingual |
| EquipmentShopScreen | `市场 MARKET` header, item categories |
| GameOverScreen | `任务失败` with glitch effect |
| VictoryModal | `脱离成功` celebration |

### Accessibility Checklist

- [ ] All interactive elements have focus-visible rings
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Animations respect prefers-reduced-motion
- [ ] Chinese text has proper font fallback
- [ ] Screen reader labels on icon buttons
- [ ] Keyboard navigation works on all modals

### Performance Considerations

- Fonts loaded with `font-display: swap` (no FOIT)
- CJK font subset if possible (~1.5MB vs 15MB full)
- Radar animation uses CSS transforms (GPU accelerated)
- Ship layout generated once per wreck, cached

---

## File Change Summary

| Action | File | Est. Lines |
|--------|------|------------|
| Create | `public/fonts/` (3 woff2 files) | — |
| Modify | `tailwind.config.cjs` | +25 |
| Modify | `src/index.css` | +60 |
| Create | `game-logic/src/shapes.rs` | ~180 |
| Modify | `game-logic/src/lib.rs` | +10 |
| Modify | `game-logic/Cargo.toml` | +1 |
| Create | `src/utils/flavorText.ts` | ~80 |
| Create | `src/components/ui/ScanningProgress.tsx` | ~45 |
| Create | `src/components/ui/RadarDisplay.tsx` | ~70 |
| Create | `src/components/ui/StatusGrid.tsx` | ~40 |
| Create | `src/components/ui/HazardWarning.tsx` | ~45 |
| Create | `src/components/ui/BilingualLabel.tsx` | ~25 |
| Modify | `src/components/game/ShipGrid.tsx` | +60 |
| Modify | `src/game/wasm/WasmBridge.ts` | +35 |
| Modify | Various screens | ~120 |

**Total: ~795 lines across 15 files**

---

## Success Criteria

1. **Visual Unity:** All screens feel like parts of the same terminal system
2. **Ship Variety:** At least 6 distinct ship silhouettes appear in gameplay
3. **Chinese Integration:** 10+ bilingual text placements feel natural, not forced
4. **Responsive Feel:** Every button click has visible feedback
5. **Performance:** No frame drops during animations, fonts load without flash
6. **Accessibility:** Keyboard navigation and focus states work throughout

---

## Dependencies

- JetBrains Mono font (OFL license)
- Noto Sans Mono CJK SC font (OFL license)
- wasm-pack for Rust compilation
- Existing VisualEffects.tsx patterns

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| CJK font too large | Subset to common characters (~1.5MB) |
| Ship shapes look too similar | Add more templates, increase variance |
| Chinese text feels gimmicky | Review with fresh eyes, reduce if needed |
| Rust WASM complexity | TypeScript fallback for all generators |
| Animation performance | Use CSS transforms, test on low-end devices |

---

## Next Steps After Phase 8

- **Phase 9:** Combat encounters with visual effects
- **Phase 10:** Sound design (or visual sound substitutes)
- **Phase 11:** Tutorial/onboarding flow
- **Phase 12:** Meta-progression and achievements
