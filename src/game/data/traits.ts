import type { CrewTrait, TraitId } from "../../types";

export const TRAITS: Record<TraitId, CrewTrait> = {
  // POSITIVE
  brave: {
    id: "brave",
    name: "Brave",
    description: "Faces danger head-on. Won't flee.",
    category: "positive",
    effects: [
      { type: "event_chance", target: "horror", value: -20, description: "+20% horror resist" },
    ],
  },
  lucky: {
    id: "lucky",
    name: "Lucky",
    description: "Fortune favors them.",
    category: "positive",
    effects: [
      { type: "event_chance", target: "all", value: 5, description: "+5% all rolls" },
    ],
  },
  efficient: {
    id: "efficient",
    name: "Efficient",
    description: "Gets work done faster.",
    category: "positive",
    effects: [
      { type: "work_speed", value: -15, description: "-15% work time" },
    ],
  },
  eagle_eye: {
    id: "eagle_eye",
    name: "Eagle Eye",
    description: "Spots hidden loot.",
    category: "positive",
    effects: [
      { type: "loot_bonus", value: 10, description: "+10% loot discovery" },
    ],
  },
  loyal: {
    id: "loyal",
    name: "Loyal",
    description: "Bonds deeply with crewmates.",
    category: "positive",
    effects: [
      { type: "sanity_mod", target: "crew_bond", value: 10, description: "+10 sanity from bonding" },
    ],
  },
  steady: {
    id: "steady",
    name: "Steady",
    description: "Unflappable under pressure.",
    category: "positive",
    effects: [
      { type: "sanity_mod", target: "loss_rate", value: -30, description: "-30% sanity loss" },
    ],
  },
  tireless: {
    id: "tireless",
    name: "Tireless",
    description: "Keeps going when others rest.",
    category: "positive",
    effects: [
      { type: "stamina_mod", target: "consumption", value: -20, description: "-20% stamina use" },
    ],
  },

  // NEGATIVE
  greedy: {
    id: "greedy",
    name: "Greedy",
    description: "May pocket small items.",
    category: "negative",
    effects: [
      { type: "special", value: 1, description: "5% steal chance" },
    ],
  },
  coward: {
    id: "coward",
    name: "Coward",
    description: "May flee from danger.",
    category: "negative",
    effects: [
      { type: "special", value: 1, description: "20% flee chance" },
    ],
  },
  reckless: {
    id: "reckless",
    name: "Reckless",
    description: "Higher chance of injury.",
    category: "negative",
    effects: [
      { type: "event_chance", target: "injury", value: 15, description: "+15% injury chance" },
    ],
  },
  lazy: {
    id: "lazy",
    name: "Lazy",
    description: "Work takes longer.",
    category: "negative",
    effects: [
      { type: "work_speed", value: 25, description: "+25% work time" },
    ],
  },
  paranoid: {
    id: "paranoid",
    name: "Paranoid",
    description: "Worse social outcomes.",
    category: "negative",
    effects: [
      { type: "event_chance", target: "social", value: -20, description: "-20% social outcomes" },
    ],
  },
  addicted: {
    id: "addicted",
    name: "Addicted",
    description: "Needs luxury drinks.",
    category: "negative",
    effects: [
      { type: "sanity_mod", target: "no_luxury", value: -10, description: "-10 sanity/day without luxury" },
    ],
  },
  clumsy: {
    id: "clumsy",
    name: "Clumsy",
    description: "More equipment damage.",
    category: "negative",
    effects: [
      { type: "event_chance", target: "equipment_damage", value: 10, description: "+10% damage chance" },
    ],
  },

  // NEUTRAL
  quiet: {
    id: "quiet",
    name: "Quiet",
    description: "Fewer social events.",
    category: "neutral",
    effects: [
      { type: "event_chance", target: "social", value: -50, description: "-50% social events" },
    ],
  },
  veteran: {
    id: "veteran",
    name: "Veteran",
    description: "Better combat, worse horror resist.",
    category: "neutral",
    effects: [
      { type: "skill_mod", target: "combat", value: 10, description: "+10% combat" },
      { type: "event_chance", target: "horror", value: 10, description: "-10% horror resist" },
    ],
  },
  idealist: {
    id: "idealist",
    name: "Idealist",
    description: "Strong reactions to moral choices.",
    category: "neutral",
    effects: [
      { type: "sanity_mod", target: "good_event", value: 15, description: "+15 from good outcomes" },
      { type: "sanity_mod", target: "bad_event", value: -15, description: "-15 from bad outcomes" },
    ],
  },
  pragmatic: {
    id: "pragmatic",
    name: "Pragmatic",
    description: "Unaffected by moral choices.",
    category: "neutral",
    effects: [
      { type: "special", value: 1, description: "No moral sanity change" },
    ],
  },
};

export function getPositiveTraits(): TraitId[] {
  return Object.values(TRAITS)
    .filter((t) => t.category === "positive")
    .map((t) => t.id);
}

export function getNegativeTraits(): TraitId[] {
  return Object.values(TRAITS)
    .filter((t) => t.category === "negative")
    .map((t) => t.id);
}

export function getNeutralTraits(): TraitId[] {
  return Object.values(TRAITS)
    .filter((t) => t.category === "neutral")
    .map((t) => t.id);
}

export function getRandomTraits(
  pool: TraitId[],
  count: number,
  randomFn: () => number
): TraitId[] {
  const shuffled = [...pool].sort(() => randomFn() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}