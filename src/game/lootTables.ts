import type {
  WreckType,
  LootCategory,
  Loot,
  LootRarity,
  ItemType,
  SlotType,
  ItemEffect,
} from "../types";
import { RARITY_MULTIPLIERS } from "./constants";

export interface LootTemplate {
  name: string;
  category: LootCategory;
  minValue: number;
  maxValue: number;
  itemType: ItemType;
  description: string;
  // Equipment properties - if slotType is present, item is equippable
  slotType?: SlotType;
  tier?: 1 | 2 | 3 | 4 | 5;
  powerDraw?: number;
  effects?: ItemEffect[];
}

export const UNIVERSAL_LOOT: LootTemplate[] = [
  {
    name: "Scrap Metal",
    category: "universal",
    minValue: 100,
    maxValue: 500,
    itemType: "material",
    description: "Salvaged hull fragments",
  },
  {
    name: "Hull Plating",
    category: "universal",
    minValue: 300,
    maxValue: 800,
    itemType: "material",
    description: "Reinforced hull sections",
    slotType: "engineering",
    tier: 1,
    powerDraw: 0,
    effects: [{ type: "hazard_resist", value: 5, hazard: "mechanical" }],
  },
  {
    name: "Wiring Harness",
    category: "universal",
    minValue: 200,
    maxValue: 600,
    itemType: "tech",
    description: "Power distribution cables",
    slotType: "engineering",
    tier: 1,
    powerDraw: 0,
    effects: [{ type: "fuel_efficiency", value: 3 }],
  },
  {
    name: "Fuel Cell",
    category: "universal",
    minValue: 400,
    maxValue: 1000,
    itemType: "material",
    description: "Portable energy storage",
    slotType: "engineering",
    tier: 2,
    powerDraw: 1,
    effects: [{ type: "fuel_efficiency", value: 8 }],
  },
  {
    name: "Life Support Module",
    category: "universal",
    minValue: 500,
    maxValue: 1200,
    itemType: "tech",
    description: "Air recycling system",
    slotType: "engineering",
    tier: 2,
    powerDraw: 1,
    effects: [{ type: "hazard_resist", value: 10, hazard: "environmental" }],
  },
  {
    name: "Navigation Console",
    category: "universal",
    minValue: 600,
    maxValue: 1500,
    itemType: "tech",
    description: "Ship navigation computer",
    slotType: "bridge",
    tier: 2,
    powerDraw: 1,
    effects: [{ type: "skill_bonus", value: 1, skill: "piloting" }],
  },
];

export const MILITARY_LOOT: LootTemplate[] = [
  {
    name: "Weapons Cache",
    category: "military",
    minValue: 1000,
    maxValue: 3000,
    itemType: "weapon",
    description: "Military-grade armaments",
    slotType: "combat",
    tier: 3,
    powerDraw: 2,
    effects: [{ type: "skill_bonus", value: 2, skill: "combat" }],
  },
  {
    name: "Armor Plating",
    category: "military",
    minValue: 800,
    maxValue: 2000,
    itemType: "armor",
    description: "Combat-rated protection",
    slotType: "combat",
    tier: 2,
    powerDraw: 0,
    effects: [{ type: "hazard_resist", value: 15, hazard: "combat" }],
  },
  {
    name: "Targeting System",
    category: "military",
    minValue: 1500,
    maxValue: 4000,
    itemType: "tech",
    description: "Advanced targeting AI",
    slotType: "bridge",
    tier: 3,
    powerDraw: 2,
    effects: [{ type: "skill_bonus", value: 2, skill: "combat" }],
  },
  {
    name: "Military Encryption Key",
    category: "military",
    minValue: 2000,
    maxValue: 5000,
    itemType: "data",
    description: "Classified access codes",
  },
];

export const SCIENCE_LOOT: LootTemplate[] = [
  {
    name: "Data Core",
    category: "science",
    minValue: 800,
    maxValue: 2500,
    itemType: "data",
    description: "Research database",
  },
  {
    name: "Lab Samples",
    category: "science",
    minValue: 600,
    maxValue: 1800,
    itemType: "medical",
    description: "Biological specimens",
    slotType: "medical",
    tier: 1,
    powerDraw: 0,
    effects: [{ type: "heal_rate", value: 5 }],
  },
  {
    name: "Experimental Tech",
    category: "science",
    minValue: 2000,
    maxValue: 5000,
    itemType: "tech",
    description: "Prototype equipment",
    slotType: "scanning",
    tier: 4,
    powerDraw: 2,
    effects: [
      { type: "scan_range", value: 2 },
      { type: "loot_bonus", value: 15 },
    ],
  },
  {
    name: "Research Archive",
    category: "science",
    minValue: 3000,
    maxValue: 7000,
    itemType: "data",
    description: "Scientific findings",
  },
];

export const INDUSTRIAL_LOOT: LootTemplate[] = [
  {
    name: "Heavy Machinery",
    category: "industrial",
    minValue: 700,
    maxValue: 2000,
    itemType: "tech",
    description: "Industrial equipment",
    slotType: "engineering",
    tier: 3,
    powerDraw: 0,
    effects: [{ type: "skill_bonus", value: 2, skill: "salvage" }],
  },
  {
    name: "Raw Materials",
    category: "industrial",
    minValue: 400,
    maxValue: 1200,
    itemType: "material",
    description: "Bulk resources",
  },
  {
    name: "Power Couplings",
    category: "industrial",
    minValue: 900,
    maxValue: 2500,
    itemType: "tech",
    description: "High-capacity connectors",
    slotType: "engineering",
    tier: 2,
    powerDraw: 0,
    effects: [{ type: "hazard_resist", value: 8, hazard: "mechanical" }],
  },
  {
    name: "Fusion Core",
    category: "industrial",
    minValue: 2500,
    maxValue: 6000,
    itemType: "tech",
    description: "Ship power plant",
    slotType: "engineering",
    tier: 4,
    powerDraw: 0,
    effects: [{ type: "skill_bonus", value: 3, skill: "technical" }],
  },
];

export const CIVILIAN_LOOT: LootTemplate[] = [
  {
    name: "Personal Effects",
    category: "civilian",
    minValue: 200,
    maxValue: 800,
    itemType: "misc",
    description: "Passenger belongings",
  },
  {
    name: "Medical Supplies",
    category: "civilian",
    minValue: 500,
    maxValue: 1500,
    itemType: "medical",
    description: "First aid equipment",
    slotType: "medical",
    tier: 1,
    powerDraw: 0,
    effects: [{ type: "heal_rate", value: 8 }],
  },
  {
    name: "Luxury Goods",
    category: "civilian",
    minValue: 1000,
    maxValue: 3500,
    itemType: "luxury",
    description: "High-end consumer items",
  },
  {
    name: "Rare Antiques",
    category: "civilian",
    minValue: 2000,
    maxValue: 5500,
    itemType: "luxury",
    description: "Collectible artifacts",
  },
];

export function getLootPool(wreckType: WreckType, tier: number) {
  // Tier adjusts universal/specific ratio: tier1 = 0.7 universal, tier5 = 0.5 universal
  const universalChance = Math.max(0.5, 0.7 - (tier - 1) * 0.05);

  let specificPool: LootTemplate[] = [];
  switch (wreckType) {
    case "military":
      specificPool = MILITARY_LOOT;
      break;
    case "science":
      specificPool = SCIENCE_LOOT;
      break;
    case "industrial":
      specificPool = INDUSTRIAL_LOOT;
      break;
    case "civilian":
      specificPool = CIVILIAN_LOOT;
      break;
  }

  return { universal: UNIVERSAL_LOOT, specific: specificPool, universalChance };
}

// Generate actual Loot item from template
export function generateLoot(template: LootTemplate, tier: number): Loot {
  const baseValue =
    Math.floor(Math.random() * (template.maxValue - template.minValue + 1)) +
    template.minValue;

  // Determine rarity based on tier
  const rarityRoll = Math.random();
  let rarity: LootRarity = "common";
  if (tier >= 4) {
    if (rarityRoll < 0.1) rarity = "legendary";
    else if (rarityRoll < 0.35) rarity = "rare";
    else if (rarityRoll < 0.7) rarity = "uncommon";
  } else if (tier >= 3) {
    if (rarityRoll < 0.05) rarity = "legendary";
    else if (rarityRoll < 0.3) rarity = "rare";
    else if (rarityRoll < 0.7) rarity = "uncommon";
  } else {
    if (rarityRoll < 0.1) rarity = "rare";
    else if (rarityRoll < 0.4) rarity = "uncommon";
  }

  const value = Math.floor(baseValue * RARITY_MULTIPLIERS[rarity]);

  return {
    id: `loot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    category: template.category,
    value,
    rarity,
    itemType: template.itemType,
    manufacturer: "Generic Corp", // Will be replaced with actual corp names later
    description: template.description,
    // Pass through equipment fields if present
    ...(template.slotType && { slotType: template.slotType }),
    ...(template.tier && { tier: template.tier }),
    ...(template.powerDraw !== undefined && { powerDraw: template.powerDraw }),
    ...(template.effects && { effects: template.effects }),
  } as Loot;
}
