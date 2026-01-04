import type { GameEvent } from "../../types";

export const EVENTS: GameEvent[] = [
  // ============================================
  // TRAVEL EVENTS (7 total)
  // ============================================
  {
    id: "travel-ghost-signal",
    trigger: "travel",
    title: "Ghost Signal",
    description: "A broken distress beacon loops a message in a dead language.",
    weight: 10,
    choices: [
      { id: "ignore", text: "Ignore it.", effects: [] },
      { id: "record", text: "Record the signal and sell it later.", effects: [{ type: "credits", value: 50 }] },
    ],
  },
  {
    id: "travel-micrometeor",
    trigger: "travel",
    title: "Micrometeor Swarm",
    description: "Your hull pings. Something small is chewing the paint.",
    weight: 8,
    choices: [
      { id: "brace", text: "Brace and ride it out.", effects: [{ type: "fuel", value: -2 }] },
      { id: "burn", text: "Burn fuel to dodge.", effects: [{ type: "fuel", value: -6 }] },
    ],
  },
  {
    id: "travel-debris-field",
    trigger: "travel",
    title: "Debris Field",
    description: "A dense cloud of wreckage blocks the direct path. Something valuable glints inside.",
    weight: 7,
    choices: [
      { id: "detour", text: "Go around safely.", effects: [{ type: "fuel", value: -4 }] },
      { id: "scavenge", text: "Risk it for scraps.", effects: [{ type: "credits", value: 80 }] },
      { id: "push", text: "Barrel through.", effects: [{ type: "fuel", value: -1 }] },
    ],
  },
  {
    id: "travel-distress-beacon",
    trigger: "travel",
    title: "Distress Beacon",
    description: "A weak emergency signal. Someone's still alive out there—maybe.",
    weight: 6,
    choices: [
      { id: "ignore", text: "Not your problem.", effects: [] },
      { 
        id: "investigate", 
        text: "Investigate the signal.", 
        effects: [{ type: "fuel", value: -3 }, { type: "credits", value: 150 }],
        setsFlag: "helped_stranded_pilot",
      },
    ],
  },
  {
    id: "travel-radiation-storm",
    trigger: "travel",
    title: "Radiation Storm",
    description: "Solar flare incoming. Your instruments scream warnings.",
    weight: 5,
    choices: [
      { id: "shield", text: "Ride it out behind debris.", effects: [{ type: "fuel", value: -2 }] },
      { id: "run", text: "Outrun the wavefront.", effects: [{ type: "fuel", value: -8 }] },
    ],
  },
  {
    id: "travel-derelict-station",
    trigger: "travel",
    title: "Derelict Station",
    description: "An abandoned waystation drifts nearby. Lights flicker inside.",
    weight: 5,
    choices: [
      { id: "pass", text: "Keep moving.", effects: [] },
      { 
        id: "dock", 
        text: "Dock and search for supplies.", 
        effects: [{ type: "food", value: 2 }, { type: "drink", value: 2 }],
        setsFlag: "explored_derelict_station",
      },
    ],
  },
  {
    id: "travel-pirate-scout",
    trigger: "travel",
    title: "Pirate Scout",
    description: "A small vessel shadows your trajectory. They're watching.",
    weight: 4,
    choices: [
      { id: "flee", text: "Burn hard and lose them.", effects: [{ type: "fuel", value: -6 }] },
      { id: "bribe", text: "Broadcast a bribe offer.", effects: [{ type: "credits", value: -75 }] },
      { id: "bluff", text: "Broadcast military codes.", effects: [], setsFlag: "bluffed_pirates" },
    ],
  },

  // ============================================
  // SALVAGE EVENTS (7 total)
  // ============================================
  {
    id: "salvage-hidden-cache",
    trigger: "salvage",
    title: "Hidden Cache",
    description: "You find a sealed locker with corporate tags scratched off.",
    weight: 10,
    choices: [
      { id: "crack", text: "Crack it open.", effects: [{ type: "credits", value: 120 }] },
      { id: "leave", text: "Leave it.", effects: [] },
    ],
  },
  {
    id: "salvage-toxic-fumes",
    trigger: "salvage",
    title: "Toxic Fumes",
    description: "A vent hisses. The air stings your eyes.",
    weight: 10,
    choices: [
      { id: "mask", text: "Use filters and continue.", effects: [{ type: "drink", value: -1 }] },
      { id: "retreat", text: "Back off.", effects: [] },
    ],
  },
  {
    id: "salvage-trapped-survivor",
    trigger: "salvage",
    title: "Trapped Survivor",
    description: "Movement in the wreckage. Someone's trapped under a bulkhead.",
    weight: 6,
    choices: [
      { id: "rescue", text: "Help them out.", effects: [{ type: "credits", value: -50 }], setsFlag: "rescued_survivor" },
      { id: "leave", text: "They're not your responsibility.", effects: [] },
      { id: "loot", text: "Search their pockets first.", effects: [{ type: "credits", value: 30 }] },
    ],
  },
  {
    id: "salvage-booby-trap",
    trigger: "salvage",
    title: "Booby Trap",
    description: "A tripwire glints in your headlamp. Someone didn't want visitors.",
    weight: 7,
    choices: [
      { id: "disarm", text: "Carefully disarm it.", effects: [{ type: "credits", value: 60 }] },
      { id: "avoid", text: "Mark it and move on.", effects: [] },
      { id: "trigger", text: "Trigger it from a distance.", effects: [{ type: "fuel", value: -1 }] },
    ],
  },
  {
    id: "salvage-data-core",
    trigger: "salvage",
    title: "Data Core",
    description: "An intact computer core, still humming. Valuable data might be inside.",
    weight: 5,
    choices: [
      { id: "extract", text: "Extract the data.", effects: [{ type: "credits", value: 200 }], setsFlag: "has_corporate_data" },
      { id: "sell", text: "Sell the hardware.", effects: [{ type: "credits", value: 80 }] },
    ],
  },
  {
    id: "salvage-unstable-reactor",
    trigger: "salvage",
    title: "Unstable Reactor",
    description: "The ship's reactor is cycling erratically. Could blow any second.",
    weight: 4,
    choices: [
      { id: "scram", text: "Emergency shutdown.", effects: [] },
      { id: "drain", text: "Drain the fuel cells.", effects: [{ type: "fuel", value: 8 }] },
      { id: "run", text: "Grab what you can and run.", effects: [{ type: "credits", value: 100 }] },
    ],
  },
  {
    id: "salvage-rival-crew",
    trigger: "salvage",
    title: "Rival Crew",
    description: "Another salvage team got here first. They don't look friendly.",
    weight: 5,
    choices: [
      { id: "negotiate", text: "Split the take.", effects: [{ type: "credits", value: 50 }] },
      { id: "threaten", text: "Assert your claim.", effects: [{ type: "credits", value: 150 }], setsFlag: "made_enemies" },
      { id: "retreat", text: "Back off, not worth it.", effects: [] },
    ],
  },

  // ============================================
  // DAILY EVENTS (5 total)
  // ============================================
  {
    id: "daily-price-hike",
    trigger: "daily",
    title: "Price Hike",
    description: "Station vendors quietly adjust their rates upward.",
    weight: 6,
    choices: [
      { id: "grumble", text: "Pay anyway.", effects: [{ type: "credits", value: -50 }] },
      { id: "scavenge", text: "Scavenge alternatives.", effects: [{ type: "food", value: 1 }] },
    ],
  },
  {
    id: "daily-equipment-failure",
    trigger: "daily",
    title: "Equipment Failure",
    description: "Your suit's oxygen recycler is acting up. Needs parts.",
    weight: 5,
    choices: [
      { id: "repair", text: "Buy replacement parts.", effects: [{ type: "credits", value: -100 }] },
      { id: "jury-rig", text: "Jury-rig a fix.", effects: [{ type: "drink", value: -1 }] },
    ],
  },
  {
    id: "daily-supply-shortage",
    trigger: "daily",
    title: "Supply Shortage",
    description: "The station's having supply issues. Basic goods are scarce.",
    weight: 4,
    choices: [
      { id: "stockpile", text: "Buy what you can.", effects: [{ type: "credits", value: -75 }, { type: "food", value: 3 }] },
      { id: "wait", text: "Wait it out.", effects: [] },
    ],
  },
  {
    id: "daily-license-inspection",
    trigger: "daily",
    title: "License Inspection",
    description: "Station security wants to verify your salvage license.",
    weight: 3,
    choices: [
      { id: "comply", text: "Show your papers.", effects: [] },
      { id: "bribe", text: "Slip them some credits.", effects: [{ type: "credits", value: -40 }], setsFlag: "bribed_inspector" },
    ],
  },
  {
    id: "daily-black-market",
    trigger: "daily",
    title: "Black Market Contact",
    description: "A shady dealer approaches. They're buying corporate data—no questions.",
    weight: 3,
    requiresFlag: "has_corporate_data",
    choices: [
      { id: "sell", text: "Make the deal.", effects: [{ type: "credits", value: 500 }], setsFlag: "sold_corporate_data" },
      { id: "refuse", text: "Too risky.", effects: [] },
    ],
  },

  // ============================================
  // SOCIAL EVENTS (5 total)
  // ============================================
  {
    id: "social-bar-fight",
    trigger: "social",
    title: "Bar Fight",
    description: "Someone calls your crew corporate pets. Chairs move.",
    weight: 6,
    choices: [
      { id: "walk", text: "Walk away.", effects: [] },
      { id: "swing", text: "Swing first.", effects: [{ type: "credits", value: -100 }] },
    ],
  },
  {
    id: "social-good-song",
    trigger: "social",
    title: "A Good Song",
    description: "A street musician plays something that reminds you of home.",
    weight: 8,
    choices: [
      { id: "tip", text: "Tip them.", effects: [{ type: "credits", value: -25 }] },
      { id: "listen", text: "Just listen.", effects: [] },
    ],
  },
  {
    id: "social-old-friend",
    trigger: "social",
    title: "Old Friend",
    description: "You spot a familiar face from your past. They seem surprised to see you.",
    weight: 4,
    choices: [
      { id: "drink", text: "Buy them a drink.", effects: [{ type: "credits", value: -30 }], setsFlag: "reconnected_friend" },
      { id: "avoid", text: "Pretend you didn't see them.", effects: [] },
    ],
  },
  {
    id: "social-shady-deal",
    trigger: "social",
    title: "Shady Deal",
    description: "A nervous-looking dock worker offers you 'clean' fuel at a discount.",
    weight: 5,
    choices: [
      { id: "buy", text: "Take the deal.", effects: [{ type: "credits", value: -50 }, { type: "fuel", value: 10 }] },
      { id: "report", text: "Report them.", effects: [{ type: "credits", value: 25 }] },
      { id: "ignore", text: "Walk away.", effects: [] },
    ],
  },
  {
    id: "social-recruitment",
    trigger: "social",
    title: "Corporate Recruiter",
    description: "A corp rep in a clean suit offers you a 'real job' with benefits.",
    weight: 3,
    choices: [
      { id: "listen", text: "Hear them out.", effects: [{ type: "credits", value: 100 }] },
      { id: "refuse", text: "You're fine where you are.", effects: [] },
      { id: "insult", text: "Tell them where to shove it.", effects: [], setsFlag: "insulted_corp" },
    ],
  },

  // ============================================
  // TRAIT-TRIGGERED EVENTS (4 total)
  // ============================================
  {
    id: "trait-veteran-reunion",
    trigger: "social",
    title: "Old Unit",
    description: "Someone recognizes your crew member from their military days.",
    weight: 6,
    requiresTrait: "veteran",
    choices: [
      { id: "reminisce", text: "Share war stories.", effects: [{ type: "credits", value: 50 }] },
      { id: "distance", text: "Keep your distance.", effects: [] },
    ],
  },
  {
    id: "trait-lucky-windfall",
    trigger: "salvage",
    title: "Lucky Find",
    description: "Something catches your lucky crew member's eye—a hidden compartment!",
    weight: 4,
    requiresTrait: "lucky",
    choices: [
      { id: "open", text: "Check it out.", effects: [{ type: "credits", value: 180 }] },
    ],
  },
  {
    id: "trait-paranoid-conspiracy",
    trigger: "travel",
    title: "Something's Wrong",
    description: "Your paranoid crew member insists the navigation data's been tampered with.",
    weight: 5,
    requiresTrait: "paranoid",
    choices: [
      { id: "investigate", text: "Check the systems.", effects: [{ type: "fuel", value: -2 }] },
      { id: "ignore", text: "It's nothing.", effects: [] },
      { id: "reroute", text: "Take an alternate route.", effects: [{ type: "fuel", value: -4 }], setsFlag: "avoided_ambush" },
    ],
  },
  {
    id: "trait-idealist-dilemma",
    trigger: "salvage",
    title: "Corporate Evidence",
    description: "You find records of corporate negligence that caused the wreck.",
    weight: 4,
    requiresTrait: "idealist",
    choices: [
      { id: "expose", text: "Leak it to the press.", effects: [], setsFlag: "exposed_corporation" },
      { id: "blackmail", text: "Sell it back to them.", effects: [{ type: "credits", value: 300 }] },
      { id: "destroy", text: "Destroy the evidence.", effects: [] },
    ],
  },

  // ============================================
  // CHAINED/FOLLOW-UP EVENTS (4 total)
  // ============================================
  {
    id: "chain-survivor-thanks",
    trigger: "social",
    title: "Grateful Survivor",
    description: "The person you rescued is here—and they've got a gift for you.",
    weight: 10,
    requiresFlag: "rescued_survivor",
    excludesFlag: "survivor_thanked",
    choices: [
      { id: "accept", text: "Accept their gratitude.", effects: [{ type: "credits", value: 200 }], setsFlag: "survivor_thanked" },
    ],
  },
  {
    id: "chain-rival-revenge",
    trigger: "salvage",
    title: "Old Grudges",
    description: "That rival crew you threatened? They're back—and they brought friends.",
    weight: 8,
    requiresFlag: "made_enemies",
    excludesFlag: "settled_rivalry",
    choices: [
      { id: "fight", text: "Stand your ground.", effects: [{ type: "credits", value: -150 }], setsFlag: "settled_rivalry" },
      { id: "pay", text: "Pay them off.", effects: [{ type: "credits", value: -200 }], setsFlag: "settled_rivalry" },
      { id: "flee", text: "Abandon the site.", effects: [] },
    ],
  },
  {
    id: "chain-pilot-referral",
    trigger: "daily",
    title: "Word Gets Around",
    description: "The pilot you helped told others. Someone wants to hire your crew.",
    weight: 8,
    requiresFlag: "helped_stranded_pilot",
    excludesFlag: "pilot_job_done",
    choices: [
      { id: "accept", text: "Take the job.", effects: [{ type: "credits", value: 250 }], setsFlag: "pilot_job_done" },
      { id: "decline", text: "Too busy.", effects: [] },
    ],
  },
  {
    id: "chain-corp-retaliation",
    trigger: "daily",
    title: "Corporate Interest",
    description: "Someone's been asking about your crew. Suits with no humor.",
    weight: 6,
    requiresFlag: "exposed_corporation",
    excludesFlag: "corp_dealt_with",
    choices: [
      { id: "hide", text: "Lay low for a while.", effects: [{ type: "credits", value: -100 }], setsFlag: "corp_dealt_with" },
      { id: "face", text: "Meet them head-on.", effects: [], setsFlag: "corp_dealt_with" },
    ],
  },
];