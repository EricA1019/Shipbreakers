/**
 * HUB SCREEN REDESIGN MOCKUP
 * 
 * Current Layout (3-column):
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    HEADER / STATUS BAR                       │
 * ├─────────────┬───────────────────────────────────────────────┤
 * │ CREW ROSTER │                                                │
 * │             │              INVENTORY                         │
 * │ SHIP STATUS │           (2 columns wide)                     │
 * │  (small)    │                                                │
 * │             │                                                │
 * │ LICENSE     │                                                │
 * ├─────────────┴───────────────────────────────────────────────┤
 * │                    MISSION OBJECTIVE                         │
 * │              [Fuel] [Med] [Stats] [Wreck]                    │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Problem: Ship is tiny in a small panel, no shape visible
 * 
 * NEW LAYOUT (Ship-centric):
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [HUB] CINDER STATION          💰 5000 CR  ⛽ 100  [🔧][🛒] │
 * ├─────────────┬───────────────────────────────┬───────────────┤
 * │ CREW ROSTER │                               │   INVENTORY   │
 * │ ○ Player    │      ╔═══════════════════╗    │ ┌───────────┐ │
 * │   HP ████   │      ║   SS BREAKER-01   ║    │ │ Data Core │ │
 * │ ○ Doc Jones │      ║                   ║    │ │   250 CR  │ │
 * │   HP ███    │      ║  ┌─────┬─────┐    ║    │ ├───────────┤ │
 * │             │      ║  │BRDG │ ENG │    ║    │ │ Salvage   │ │
 * │ [Hire Crew] │      ║  ├─────┼─────┤    ║    │ │   120 CR  │ │
 * ├─────────────┤      ║  │ MED │CARGO│    ║    │ ├───────────┤ │
 * │   LICENSE   │      ║  └─────┴─────┘    ║    │ │ Circuit   │ │
 * │ Day: 3      │      ║                   ║    │ │    80 CR  │ │
 * │ Tier: BASIC │      ║  Hull: 100/100    ║    │ └───────────┘ │
 * │ Days: 11    │      ║  Fuel: 100        ║    │               │
 * │             │      ║  Cargo: 3/10      ║    │ [Sell All]    │
 * │ [Renew]     │      ╚═══════════════════╝    │               │
 * ├─────────────┴───────────────────────────────┴───────────────┤
 * │  🎯 TARGET: 10,000 CR    [⛽Fuel] [🏥Med] [📊Stats] [🚀Go!] │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Key Changes:
 * 1. Ship grid/shape is NOW CENTER AND LARGE
 * 2. Inventory moved to RIGHT SIDE (vertical list)
 * 3. Crew roster stays LEFT but more compact
 * 4. License panel stays LEFT below crew
 * 5. Action buttons stay in footer
 * 6. Ship stats (Hull, Fuel, Cargo) shown UNDER the ship visual
 */

import React from 'react';

// Types for the mockup
interface MockupProps {
  // This is just a visual mockup
}

export function HubScreenMockup() {
  return (
    <div className="max-w-6xl mx-auto p-4 bg-zinc-950 min-h-screen">
      {/* HEADER */}
      <div className="bg-zinc-900 border border-amber-600/30 rounded-t-lg p-3 flex justify-between items-center">
        <div>
          <h1 className="text-amber-500 font-bold text-xl tracking-wider">[SHIPBREAKERS] CINDER STATION</h1>
          <div className="text-zinc-500 text-xs italic">"Another day grinding steel..."</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-amber-100">💰 <span className="font-mono">5,000 CR</span></div>
          <div className="text-orange-300">⛽ <span className="font-mono">100</span></div>
          <button className="px-3 py-1 bg-zinc-800 border border-amber-600/30 text-amber-400 text-xs rounded hover:bg-zinc-700">
            🔧 SHIPYARD
          </button>
          <button className="px-3 py-1 bg-zinc-800 border border-amber-600/30 text-amber-400 text-xs rounded hover:bg-zinc-700">
            🛒 SHOP
          </button>
        </div>
      </div>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-12 gap-4 mt-4">
        
        {/* LEFT COLUMN - Crew & License (3 cols) */}
        <div className="col-span-3 space-y-4">
          {/* Crew Roster */}
          <div className="bg-zinc-900 border border-amber-600/20 rounded p-3">
            <div className="text-amber-500 text-sm font-bold mb-2 tracking-wider">CREW ROSTER</div>
            <div className="space-y-2">
              <div className="bg-zinc-800/50 p-2 rounded border border-amber-600/10">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-200">○ Player (Captain)</span>
                  <span className="text-green-400">100%</span>
                </div>
                <div className="h-1 bg-zinc-700 rounded mt-1">
                  <div className="h-full bg-green-500 rounded" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="bg-zinc-800/50 p-2 rounded border border-amber-600/10">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-200">○ Doc Jones</span>
                  <span className="text-yellow-400">75%</span>
                </div>
                <div className="h-1 bg-zinc-700 rounded mt-1">
                  <div className="h-full bg-yellow-500 rounded" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 px-2 py-1 bg-amber-600/20 border border-amber-600/30 text-amber-400 text-xs rounded">
                + Hire
              </button>
              <button className="flex-1 px-2 py-1 bg-zinc-800 border border-amber-600/30 text-amber-400 text-xs rounded">
                📋 View
              </button>
            </div>
          </div>

          {/* License Panel */}
          <div className="bg-zinc-900 border border-amber-600/20 rounded p-3">
            <div className="text-amber-500 text-sm font-bold mb-2 tracking-wider">LICENSE STATUS</div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">DAY</span>
                <span className="text-amber-400">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">TIER</span>
                <span className="text-amber-400 font-bold">BASIC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">DAYS LEFT</span>
                <span className="text-green-400">11</span>
              </div>
            </div>
            <button className="w-full mt-3 px-2 py-1 bg-amber-600/20 border border-amber-600/30 text-amber-400 text-xs rounded">
              ↑ Upgrade License
            </button>
          </div>
        </div>

        {/* CENTER COLUMN - Ship Display (6 cols) */}
        <div className="col-span-6">
          <div className="bg-zinc-900 border-2 border-amber-600/40 rounded-lg p-4">
            <div className="text-center mb-3">
              <h2 className="text-amber-400 font-bold text-lg tracking-wider">SS BREAKER-01</h2>
              <div className="text-zinc-500 text-xs">SMALL SALVAGE VESSEL</div>
            </div>

            {/* SHIP GRID - Large and Central */}
            <div className="bg-zinc-950 border border-amber-600/20 rounded p-4 mx-auto max-w-md">
              <div className="grid grid-cols-2 gap-2" style={{ aspectRatio: '1' }}>
                {/* Bridge */}
                <div className="bg-cyan-900/30 border border-cyan-600/40 rounded p-3 flex flex-col justify-between">
                  <div className="text-cyan-400 text-xs font-bold">BRIDGE</div>
                  <div className="text-zinc-500 text-[10px] mt-auto">2 slots</div>
                </div>
                {/* Engine */}
                <div className="bg-red-900/20 border border-red-600/30 rounded p-3 flex flex-col justify-between">
                  <div className="text-red-400 text-xs font-bold">ENGINE</div>
                  <div className="text-zinc-500 text-[10px]">⚙️ Cutting Torch</div>
                  <div className="text-zinc-500 text-[10px] mt-auto">3 slots</div>
                </div>
                {/* Medbay */}
                <div className="bg-green-900/20 border border-green-600/30 rounded p-3 flex flex-col justify-between">
                  <div className="text-green-400 text-xs font-bold">MEDBAY</div>
                  <div className="text-zinc-500 text-[10px]">🩹 Trauma Kit</div>
                  <div className="text-zinc-500 text-[10px] mt-auto">2 slots</div>
                </div>
                {/* Cargo */}
                <div className="bg-amber-900/20 border border-amber-600/30 rounded p-3 flex flex-col justify-between">
                  <div className="text-amber-400 text-xs font-bold">CARGO</div>
                  <div className="text-zinc-500 text-[10px]">3/10 used</div>
                  <div className="text-zinc-500 text-[10px] mt-auto">4 slots</div>
                </div>
              </div>
            </div>

            {/* Ship Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div className="text-center">
                <div className="text-zinc-500 text-xs mb-1">HULL</div>
                <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '100%' }} />
                </div>
                <div className="text-green-400 text-xs mt-1 font-mono">100/100</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-500 text-xs mb-1">FUEL</div>
                <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: '80%' }} />
                </div>
                <div className="text-orange-400 text-xs mt-1 font-mono">80</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-500 text-xs mb-1">CARGO</div>
                <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '30%' }} />
                </div>
                <div className="text-amber-400 text-xs mt-1 font-mono">3/10</div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button className="px-4 py-1 bg-zinc-800 border border-amber-600/30 text-amber-400 text-xs rounded hover:bg-zinc-700">
                ✏️ Rename Ship
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Inventory (3 cols) */}
        <div className="col-span-3">
          <div className="bg-zinc-900 border border-amber-600/20 rounded p-3 h-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-500 text-sm font-bold tracking-wider">INVENTORY</span>
              <span className="text-zinc-500 text-xs">(3 items)</span>
            </div>
            
            {/* Scrollable item list */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <div className="bg-zinc-800/50 border border-amber-600/10 rounded p-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-amber-200 text-sm font-bold">Data Core</div>
                    <div className="text-zinc-500 text-xs">Military grade</div>
                  </div>
                  <div className="text-amber-400 text-sm font-mono">250 CR</div>
                </div>
                <button className="w-full mt-2 py-1 bg-red-900/30 border border-red-600/30 text-red-400 text-xs rounded hover:bg-red-900/50">
                  Sell
                </button>
              </div>

              <div className="bg-zinc-800/50 border border-amber-600/10 rounded p-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-amber-200 text-sm font-bold">Salvage Parts</div>
                    <div className="text-zinc-500 text-xs">Industrial</div>
                  </div>
                  <div className="text-amber-400 text-sm font-mono">120 CR</div>
                </div>
                <button className="w-full mt-2 py-1 bg-red-900/30 border border-red-600/30 text-red-400 text-xs rounded hover:bg-red-900/50">
                  Sell
                </button>
              </div>

              <div className="bg-zinc-800/50 border border-amber-600/10 rounded p-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-amber-200 text-sm font-bold">Circuit Board</div>
                    <div className="text-zinc-500 text-xs">Electronic</div>
                  </div>
                  <div className="text-amber-400 text-sm font-mono">80 CR</div>
                </div>
                <button className="w-full mt-2 py-1 bg-red-900/30 border border-red-600/30 text-red-400 text-xs rounded hover:bg-red-900/50">
                  Sell
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Total Value:</span>
                <span className="text-amber-400 font-bold font-mono">450 CR</span>
              </div>
              <button className="w-full py-2 bg-amber-600/30 border border-amber-600/50 text-amber-400 text-sm font-bold rounded hover:bg-amber-600/40">
                💰 SELL ALL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER - Mission & Actions */}
      <div className="bg-zinc-900 border border-amber-600/20 rounded-b-lg p-3 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-amber-500 font-bold">🎯 TARGET: 10,000 CR</div>
            <div className="text-zinc-500 text-xs">Escape Cinder Station</div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-orange-900/30 border border-orange-600/30 text-orange-400 text-sm rounded hover:bg-orange-900/50">
              ⛽ Fuel Depot
            </button>
            <button className="px-4 py-2 bg-green-900/30 border border-green-600/30 text-green-400 text-sm rounded hover:bg-green-900/50">
              🏥 Medical Bay
            </button>
            <button className="px-4 py-2 bg-cyan-900/30 border border-cyan-600/30 text-cyan-400 text-sm rounded hover:bg-cyan-900/50">
              📊 Stats
            </button>
            <button className="px-4 py-2 bg-zinc-800 border border-zinc-600/30 text-zinc-400 text-sm rounded hover:bg-zinc-700">
              ⚙️ Settings
            </button>
            <button className="px-6 py-2 bg-amber-600/40 border-2 border-amber-500/60 text-amber-100 text-sm font-bold rounded hover:bg-amber-600/60 shadow-lg shadow-amber-500/20">
              🚀 SELECT WRECK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION PLAN:
 * 
 * 1. Change grid from `grid-cols-3` to `grid-cols-12` for finer control
 * 2. Left column: 3 cols (Crew + License)
 * 3. Center column: 6 cols (Ship display - enlarged)
 * 4. Right column: 3 cols (Inventory - vertical scrollable list)
 * 
 * ShipGrid Changes:
 * - Make grid cells larger with visible room type labels
 * - Show installed equipment icons in each room
 * - Add slot count indicators
 * 
 * Ship Shape Issue:
 * - Player ship uses grid system, not layout system
 * - Layout is only generated for wreck ships via WASM
 * - For player ship, we use the grid directly which always works
 * - The hasShipLayout check means we fall through to grid rendering for player ship
 * 
 * Files to Modify:
 * 1. HubScreen.tsx - New layout structure
 * 2. ShipStatusPanel.tsx - Extract ship display into center, stats below ship
 * 3. ShipGrid.tsx - Enhance room display with equipment
 */

export default HubScreenMockup;
