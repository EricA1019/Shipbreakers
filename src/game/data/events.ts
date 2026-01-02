import type { GameEvent } from "../../types";

export const EVENTS: GameEvent[] = [
  {
    id: "travel-ghost-signal",
    trigger: "travel",
    title: "Ghost Signal",
    description: "A broken distress beacon loops a message in a dead language.",
    weight: 10,
    choices: [
      {
        id: "ignore",
        text: "Ignore it.",
        effects: [],
      },
      {
        id: "record",
        text: "Record the signal and sell it later.",
        effects: [{ type: "credits", value: 50 }],
      },
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
];