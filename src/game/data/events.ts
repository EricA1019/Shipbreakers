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

  // ============================================
  // HUB EVENTS - Triggered while at station (Phase 14)
  // ============================================
  {
    id: "hub-station-gossip",
    trigger: "hub",
    title: "Station Gossip",
    description: "Dock workers are chattering about a big score in the Deep Zone.",
    weight: 8,
    choices: [
      { id: "listen", text: "Listen carefully.", effects: [], setsFlag: "heard_deep_zone_rumor" },
      { id: "ignore", text: "Mind your own business.", effects: [] },
    ],
  },
  {
    id: "hub-maintenance-crew",
    trigger: "hub",
    title: "Maintenance Crew",
    description: "A station tech offers to check your ship's systems - for a price.",
    weight: 7,
    choices: [
      { id: "accept", text: "Pay for the inspection.", effects: [{ type: "credits", value: -75 }] },
      { id: "decline", text: "Your ship's fine.", effects: [] },
    ],
  },
  {
    id: "hub-market-deal",
    trigger: "hub",
    title: "Market Special",
    description: "A vendor's clearing out surplus rations at a steep discount.",
    weight: 6,
    choices: [
      { id: "buy-food", text: "Stock up on food.", effects: [{ type: "credits", value: -50 }, { type: "food", value: 5 }] },
      { id: "buy-drink", text: "Get drinks instead.", effects: [{ type: "credits", value: -50 }, { type: "drink", value: 5 }] },
      { id: "pass", text: "Pass on the deal.", effects: [] },
    ],
  },
  {
    id: "hub-stranger-approach",
    trigger: "hub",
    title: "Stranger's Approach",
    description: "A weathered salvager sidles up to you. They've got a proposition.",
    weight: 5,
    choices: [
      { id: "listen", text: "Hear them out.", effects: [{ type: "credits", value: 100 }], setsFlag: "took_stranger_job" },
      { id: "refuse", text: "Not interested.", effects: [] },
    ],
  },
  {
    id: "hub-security-patrol",
    trigger: "hub",
    title: "Security Patrol",
    description: "Station security is doing random checks. They're heading your way.",
    weight: 4,
    choices: [
      { id: "comply", text: "Cooperate fully.", effects: [] },
      { id: "bribe", text: "Slip them a bribe.", effects: [{ type: "credits", value: -50 }] },
      { id: "avoid", text: "Duck into a side corridor.", effects: [] },
    ],
  },

  // ============================================
  // LOUNGE EVENTS - Crew quarters/break room (Phase 14)
  // ============================================
  {
    id: "lounge-card-game",
    trigger: "lounge",
    title: "Card Game",
    description: "Some of your crew are playing cards in the lounge. Stakes are getting high.",
    weight: 8,
    choices: [
      { id: "join", text: "Join the game.", effects: [{ type: "credits", value: -20 }] },
      { id: "watch", text: "Watch and kibitz.", effects: [] },
      { id: "break-up", text: "Break it up before someone loses their shirt.", effects: [] },
    ],
  },
  {
    id: "lounge-shared-meal",
    trigger: "lounge",
    title: "Shared Meal",
    description: "Someone's cooking something that actually smells good for once.",
    weight: 7,
    choices: [
      { id: "join", text: "Sit down and eat together.", effects: [{ type: "food", value: -1 }, { type: "sanity", value: 5 }] },
      { id: "skip", text: "You've got things to do.", effects: [] },
    ],
  },
  {
    id: "lounge-argument",
    trigger: "lounge",
    title: "Heated Argument",
    description: "Two crew members are in each other's faces. It's about to get ugly.",
    weight: 6,
    choices: [
      { id: "intervene", text: "Step between them.", effects: [] },
      { id: "let-fight", text: "Let them sort it out.", effects: [] },
      { id: "pick-side", text: "Back one of them up.", effects: [] },
    ],
  },
  {
    id: "lounge-quiet-drink",
    trigger: "lounge",
    title: "Quiet Drink",
    description: "The lounge is peaceful. Someone's cracked open the good stuff.",
    weight: 7,
    choices: [
      { id: "join", text: "Have a drink.", effects: [{ type: "drink", value: -1 }, { type: "sanity", value: 10 }] },
      { id: "abstain", text: "Not tonight.", effects: [] },
    ],
  },
  {
    id: "lounge-movie-night",
    trigger: "lounge",
    title: "Movie Night",
    description: "Someone's rigged the projector. Old Earth cinema flickers on the wall.",
    weight: 5,
    choices: [
      { id: "watch", text: "Watch the movie.", effects: [{ type: "stamina", value: 10 }, { type: "sanity", value: 5 }] },
      { id: "skip", text: "You've seen it before.", effects: [] },
    ],
  },
  {
    id: "lounge-confession",
    trigger: "lounge",
    title: "Late Night Talk",
    description: "A crew member can't sleep. They want to talk about something personal.",
    weight: 4,
    choices: [
      { id: "listen", text: "Listen to them.", effects: [{ type: "sanity", value: -5 }], setsFlag: "heard_confession" },
      { id: "redirect", text: "Change the subject.", effects: [] },
    ],
  },

  // ============================================
  // ROMANCE CHAIN EVENTS (3 steps) - Phase 14
  // ============================================
  {
    id: "chain-romance-1",
    trigger: "lounge",
    title: "Catching Eyes",
    description: "You notice two crew members stealing glances at each other across the room.",
    weight: 4,
    excludesFlag: "romance_started",
    choices: [
      { id: "encourage", text: "Encourage the connection.", effects: [], setsFlag: "romance_started" },
      { id: "ignore", text: "Stay out of it.", effects: [] },
      { id: "discourage", text: "Remind them about fraternization.", effects: [], setsFlag: "romance_discouraged" },
    ],
  },
  {
    id: "chain-romance-2",
    trigger: "lounge",
    title: "First Date",
    description: "The two crew members ask for permission to take shore leave together.",
    weight: 6,
    requiresFlag: "romance_started",
    excludesFlag: "romance_date_done",
    choices: [
      { id: "approve", text: "Grant them the time.", effects: [{ type: "credits", value: -50 }], setsFlag: "romance_date_done" },
      { id: "deny", text: "Deny the request.", effects: [], setsFlag: "romance_denied" },
    ],
  },
  {
    id: "chain-romance-3",
    trigger: "lounge",
    title: "Making It Official",
    description: "Your two crew members want to make their relationship known to the crew.",
    weight: 8,
    requiresFlag: "romance_date_done",
    excludesFlag: "romance_complete",
    choices: [
      { id: "celebrate", text: "Throw a small party.", effects: [{ type: "credits", value: -100 }, { type: "drink", value: -2 }], setsFlag: "romance_complete" },
      { id: "acknowledge", text: "Simple acknowledgment.", effects: [], setsFlag: "romance_complete" },
    ],
  },

  // ============================================
  // RIVALRY CHAIN EVENTS (3 steps) - Phase 14
  // ============================================
  {
    id: "chain-rivalry-1",
    trigger: "lounge",
    title: "Cold Shoulder",
    description: "Two crew members refuse to sit near each other. The tension is palpable.",
    weight: 5,
    excludesFlag: "rivalry_started",
    choices: [
      { id: "investigate", text: "Ask what happened.", effects: [], setsFlag: "rivalry_started" },
      { id: "ignore", text: "Let them work it out.", effects: [], setsFlag: "rivalry_started" },
    ],
  },
  {
    id: "chain-rivalry-2",
    trigger: "lounge",
    title: "Words Exchanged",
    description: "The simmering conflict boils over. Accusations fly across the room.",
    weight: 6,
    requiresFlag: "rivalry_started",
    excludesFlag: "rivalry_confronted",
    choices: [
      { id: "mediate", text: "Try to mediate.", effects: [], setsFlag: "rivalry_confronted" },
      { id: "separate", text: "Separate them by force.", effects: [], setsFlag: "rivalry_confronted" },
      { id: "let-escalate", text: "Let them hash it out.", effects: [], setsFlag: "rivalry_violent" },
    ],
  },
  {
    id: "chain-rivalry-3a",
    trigger: "lounge",
    title: "Reconciliation",
    description: "After cooling off, the two crew members are ready to talk.",
    weight: 7,
    requiresFlag: "rivalry_confronted",
    excludesFlag: "rivalry_resolved",
    choices: [
      { id: "facilitate", text: "Help them reconcile.", effects: [{ type: "sanity", value: 10 }], setsFlag: "rivalry_resolved" },
      { id: "mandate", text: "Order them to be professional.", effects: [], setsFlag: "rivalry_resolved" },
    ],
  },
  {
    id: "chain-rivalry-3b",
    trigger: "lounge",
    title: "The Showdown",
    description: "Fists fly. The rivalry has turned violent.",
    weight: 8,
    requiresFlag: "rivalry_violent",
    excludesFlag: "rivalry_resolved",
    choices: [
      { id: "break-up", text: "Break up the fight.", effects: [{ type: "hp", value: -10 }], setsFlag: "rivalry_resolved" },
      { id: "let-finish", text: "Let them settle it.", effects: [], setsFlag: "rivalry_resolved" },
      { id: "fire-one", text: "Fire the instigator.", effects: [{ type: "credits", value: 200 }], setsFlag: "rivalry_resolved" },
    ],
  },

  // ============================================
  // STATION INTRIGUE CHAIN (3 steps) - Phase 14
  // ============================================
  {
    id: "chain-intrigue-1",
    trigger: "hub",
    title: "Overheard",
    description: "In a crowded corridor, you overhear something about a 'special shipment'.",
    weight: 4,
    excludesFlag: "intrigue_started",
    choices: [
      { id: "follow", text: "Try to hear more.", effects: [], setsFlag: "intrigue_started" },
      { id: "ignore", text: "Not your business.", effects: [] },
    ],
  },
  {
    id: "chain-intrigue-2",
    trigger: "hub",
    title: "Investigation",
    description: "You've found evidence of smuggling through the station. This could be valuable.",
    weight: 6,
    requiresFlag: "intrigue_started",
    excludesFlag: "intrigue_decided",
    choices: [
      { id: "report", text: "Report to station security.", effects: [{ type: "credits", value: 150 }], setsFlag: "intrigue_reported" },
      { id: "blackmail", text: "Approach the smugglers.", effects: [], setsFlag: "intrigue_blackmail" },
      { id: "join", text: "Offer to help them.", effects: [], setsFlag: "intrigue_joined" },
    ],
  },
  {
    id: "chain-intrigue-3a",
    trigger: "hub",
    title: "Informant's Reward",
    description: "Station security is grateful. They've got a reward and a favor to offer.",
    weight: 7,
    requiresFlag: "intrigue_reported",
    excludesFlag: "intrigue_complete",
    choices: [
      { id: "cash", text: "Take the cash.", effects: [{ type: "credits", value: 200 }], setsFlag: "intrigue_complete" },
      { id: "favor", text: "Ask for a license extension.", effects: [], setsFlag: "intrigue_complete" },
    ],
  },
  {
    id: "chain-intrigue-3b",
    trigger: "hub",
    title: "Dangerous Game",
    description: "The smugglers don't take kindly to threats. They've got a counter-offer.",
    weight: 7,
    requiresFlag: "intrigue_blackmail",
    excludesFlag: "intrigue_complete",
    choices: [
      { id: "accept", text: "Take their money.", effects: [{ type: "credits", value: 400 }], setsFlag: "intrigue_complete" },
      { id: "double", text: "Demand more.", effects: [{ type: "credits", value: 600 }], setsFlag: "intrigue_complete" },
      { id: "back-off", text: "Walk away.", effects: [], setsFlag: "intrigue_complete" },
    ],
  },
  {
    id: "chain-intrigue-3c",
    trigger: "hub",
    title: "In Deep",
    description: "The smugglers need you for a run. It's lucrative but risky.",
    weight: 7,
    requiresFlag: "intrigue_joined",
    excludesFlag: "intrigue_complete",
    choices: [
      { id: "commit", text: "You're in.", effects: [{ type: "credits", value: 500 }, { type: "fuel", value: -10 }], setsFlag: "intrigue_complete" },
      { id: "bail", text: "Too hot. Bail out.", effects: [{ type: "credits", value: -100 }], setsFlag: "intrigue_complete" },
    ],
  },

  // ============================================
  // MEDICAL EVENTS - Triggered when healing (Phase 14)
  // ============================================
  {
    id: "medical-complication",
    trigger: "medical",
    title: "Complications",
    description: "The treatment isn't going as planned. The doc looks worried.",
    weight: 5,
    choices: [
      { id: "push", text: "Push through anyway.", effects: [{ type: "hp", value: -5 }] },
      { id: "wait", text: "Take it slower.", effects: [{ type: "credits", value: -50 }] },
    ],
  },
  {
    id: "medical-discovery",
    trigger: "medical",
    title: "Hidden Strength",
    description: "The doc's impressed. Your crew member's recovering faster than expected.",
    weight: 6,
    choices: [
      { id: "good-news", text: "Take the good news.", effects: [{ type: "hp", value: 10 }] },
    ],
  },
  {
    id: "medical-shortage",
    trigger: "medical",
    title: "Supply Shortage",
    description: "The medbay's running low. Treatment will cost extra.",
    weight: 4,
    choices: [
      { id: "pay", text: "Pay the premium.", effects: [{ type: "credits", value: -75 }] },
      { id: "wait", text: "Wait for supplies.", effects: [] },
    ],
  },

  // ============================================
  // DOCK EVENTS - Triggered at the dock (Phase 14)
  // ============================================
  {
    id: "dock-fuel-deal",
    trigger: "dock",
    title: "Fuel Deal",
    description: "A fuel hauler's got excess they need to offload. Good price.",
    weight: 6,
    choices: [
      { id: "buy", text: "Fill up.", effects: [{ type: "credits", value: -100 }, { type: "fuel", value: 15 }] },
      { id: "pass", text: "You're good.", effects: [] },
    ],
  },
  {
    id: "dock-inspection",
    trigger: "dock",
    title: "Port Inspection",
    description: "Dock officials want to inspect your cargo hold.",
    weight: 4,
    choices: [
      { id: "allow", text: "Let them look.", effects: [] },
      { id: "bribe", text: "Grease some palms.", effects: [{ type: "credits", value: -30 }] },
    ],
  },
  {
    id: "dock-mechanic",
    trigger: "dock",
    title: "Wandering Mechanic",
    description: "An independent mechanic offers a quick hull patch.",
    weight: 5,
    choices: [
      { id: "hire", text: "Hire them.", effects: [{ type: "credits", value: -100 }] },
      { id: "decline", text: "No thanks.", effects: [] },
    ],
  },
];