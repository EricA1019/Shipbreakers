import type { CrewBackground, BackgroundId } from "../../types";

export const BACKGROUNDS: Record<BackgroundId, CrewBackground> = {
  ship_captain: {
    id: "ship_captain",
    name: "Ship Captain",
    description: "You earned your license the hard way. Balanced skills.",
    skillModifiers: {},
    traitPool: ["steady", "brave", "pragmatic", "veteran"],
    statModifiers: {},
  },
  ex_military: {
    id: "ex_military",
    name: "Ex-Military",
    description: "Former corporate soldier. Combat-trained.",
    skillModifiers: { combat: 1 },
    traitPool: ["brave", "veteran", "paranoid", "loyal"],
    statModifiers: { sanity: -10 },
  },
  station_rat: {
    id: "station_rat",
    name: "Station Rat",
    description: "Grew up in maintenance shafts. Knows machines.",
    skillModifiers: { technical: 1 },
    traitPool: ["lucky", "paranoid", "quiet", "efficient"],
    statModifiers: {},
  },
  freighter_pilot: {
    id: "freighter_pilot",
    name: "Freighter Pilot",
    description: "Ran cargo routes for years. Steady hands.",
    skillModifiers: { piloting: 1 },
    traitPool: ["steady", "addicted", "pragmatic", "tireless"],
    statModifiers: {},
  },
  scrap_diver: {
    id: "scrap_diver",
    name: "Scrap Diver",
    description: "Illegal wreck salvager. Knows where loot hides.",
    skillModifiers: { salvage: 1 },
    traitPool: ["lucky", "reckless", "greedy", "eagle_eye"],
    statModifiers: {},
  },
  corporate_exile: {
    id: "corporate_exile",
    name: "Corporate Exile",
    description: "Fled a megacorp. Smart but not violent.",
    skillModifiers: { technical: 1, combat: -1 },
    traitPool: ["paranoid", "idealist", "coward", "efficient"],
    statModifiers: {},
  },
  dock_worker: {
    id: "dock_worker",
    name: "Dock Worker",
    description: "Years of freight built endurance.",
    skillModifiers: {},
    traitPool: ["tireless", "loyal", "quiet", "pragmatic"],
    statModifiers: { stamina: 20 },
  },
  medical_dropout: {
    id: "medical_dropout",
    name: "Medical Dropout",
    description: "Failed med school but can patch people up.",
    skillModifiers: {},
    traitPool: ["efficient", "idealist", "paranoid", "quiet"],
    statModifiers: {},
  },
  enforcer: {
    id: "enforcer",
    name: "Enforcer",
    description: "Debt collector. Loyal to those who pay.",
    skillModifiers: { combat: 1 },
    traitPool: ["brave", "loyal", "greedy", "reckless"],
    statModifiers: {},
  },
  smuggler: {
    id: "smuggler",
    name: "Smuggler",
    description: "Ran contraband. Quick hands, loose morals.",
    skillModifiers: { piloting: 1 },
    traitPool: ["greedy", "lucky", "reckless", "efficient"],
    statModifiers: {},
  },
  colonist: {
    id: "colonist",
    name: "Colonist",
    description: "Survivor of a failed colony. Makes do with nothing.",
    skillModifiers: { salvage: 1 },
    traitPool: ["idealist", "steady", "tireless", "lucky"],
    statModifiers: { stamina: 10, sanity: -5 },
  },
};

export function getHireableBackgrounds(): BackgroundId[] {
  return Object.keys(BACKGROUNDS).filter(
    (id) => id !== "ship_captain"
  ) as BackgroundId[];
}

export function getRandomBackground(randomFn: () => number): BackgroundId {
  const hireable = getHireableBackgrounds();
  const index = Math.floor(randomFn() * hireable.length);
  return hireable[index];
}