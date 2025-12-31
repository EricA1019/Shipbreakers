import type { WreckType, LootCategory, Loot, LootRarity, ItemType } from '../types';
import { RARITY_MULTIPLIERS } from './constants';

export interface LootTemplate {
  name: string;
  category: LootCategory;
  minValue: number;
  maxValue: number;
  itemType: ItemType;
  description: string;
}

export const UNIVERSAL_LOOT: LootTemplate[] = [
  { name: 'Scrap Metal', category: 'universal', minValue: 100, maxValue: 500, itemType: 'material', description: 'Salvaged hull fragments' },
  { name: 'Hull Plating', category: 'universal', minValue: 300, maxValue: 800, itemType: 'material', description: 'Reinforced hull sections' },
  { name: 'Wiring Harness', category: 'universal', minValue: 200, maxValue: 600, itemType: 'tech', description: 'Power distribution cables' },
  { name: 'Fuel Cell', category: 'universal', minValue: 400, maxValue: 1000, itemType: 'material', description: 'Portable energy storage' },
  { name: 'Life Support Module', category: 'universal', minValue: 500, maxValue: 1200, itemType: 'tech', description: 'Air recycling system' },
  { name: 'Navigation Console', category: 'universal', minValue: 600, maxValue: 1500, itemType: 'tech', description: 'Ship navigation computer' },
];

export const MILITARY_LOOT: LootTemplate[] = [
  { name: 'Weapons Cache', category: 'military', minValue: 1000, maxValue: 3000, itemType: 'weapon', description: 'Military-grade armaments' },
  { name: 'Armor Plating', category: 'military', minValue: 800, maxValue: 2000, itemType: 'armor', description: 'Combat-rated protection' },
  { name: 'Targeting System', category: 'military', minValue: 1500, maxValue: 4000, itemType: 'tech', description: 'Advanced targeting AI' },
  { name: 'Military Encryption Key', category: 'military', minValue: 2000, maxValue: 5000, itemType: 'data', description: 'Classified access codes' },
];

export const SCIENCE_LOOT: LootTemplate[] = [
  { name: 'Data Core', category: 'science', minValue: 800, maxValue: 2500, itemType: 'data', description: 'Research database' },
  { name: 'Lab Samples', category: 'science', minValue: 600, maxValue: 1800, itemType: 'medical', description: 'Biological specimens' },
  { name: 'Experimental Tech', category: 'science', minValue: 2000, maxValue: 5000, itemType: 'tech', description: 'Prototype equipment' },
  { name: 'Research Archive', category: 'science', minValue: 3000, maxValue: 7000, itemType: 'data', description: 'Scientific findings' },
];

export const INDUSTRIAL_LOOT: LootTemplate[] = [
  { name: 'Heavy Machinery', category: 'industrial', minValue: 700, maxValue: 2000, itemType: 'tech', description: 'Industrial equipment' },
  { name: 'Raw Materials', category: 'industrial', minValue: 400, maxValue: 1200, itemType: 'material', description: 'Bulk resources' },
  { name: 'Power Couplings', category: 'industrial', minValue: 900, maxValue: 2500, itemType: 'tech', description: 'High-capacity connectors' },
  { name: 'Fusion Core', category: 'industrial', minValue: 2500, maxValue: 6000, itemType: 'tech', description: 'Ship power plant' },
];

export const CIVILIAN_LOOT: LootTemplate[] = [
  { name: 'Personal Effects', category: 'civilian', minValue: 200, maxValue: 800, itemType: 'misc', description: 'Passenger belongings' },
  { name: 'Medical Supplies', category: 'civilian', minValue: 500, maxValue: 1500, itemType: 'medical', description: 'First aid equipment' },
  { name: 'Luxury Goods', category: 'civilian', minValue: 1000, maxValue: 3500, itemType: 'luxury', description: 'High-end consumer items' },
  { name: 'Rare Antiques', category: 'civilian', minValue: 2000, maxValue: 5500, itemType: 'luxury', description: 'Collectible artifacts' },
];

export function getLootPool(wreckType: WreckType, tier: number) {
  // Tier adjusts universal/specific ratio: tier1 = 0.7 universal, tier5 = 0.5 universal
  const universalChance = Math.max(0.5, 0.7 - (tier - 1) * 0.05);

  let specificPool: LootTemplate[] = [];
  switch (wreckType) {
    case 'military':
      specificPool = MILITARY_LOOT;
      break;
    case 'science':
      specificPool = SCIENCE_LOOT;
      break;
    case 'industrial':
      specificPool = INDUSTRIAL_LOOT;
      break;
    case 'civilian':
      specificPool = CIVILIAN_LOOT;
      break;
  }

  return { universal: UNIVERSAL_LOOT, specific: specificPool, universalChance };
}

// Generate actual Loot item from template
export function generateLoot(template: LootTemplate, tier: number): Loot {
  const baseValue = Math.floor(Math.random() * (template.maxValue - template.minValue + 1)) + template.minValue;
  
  // Determine rarity based on tier
  const rarityRoll = Math.random();
  let rarity: LootRarity = 'common';
  if (tier >= 4) {
    if (rarityRoll < 0.10) rarity = 'legendary';
    else if (rarityRoll < 0.35) rarity = 'rare';
    else if (rarityRoll < 0.70) rarity = 'uncommon';
  } else if (tier >= 3) {
    if (rarityRoll < 0.05) rarity = 'legendary';
    else if (rarityRoll < 0.30) rarity = 'rare';
    else if (rarityRoll < 0.70) rarity = 'uncommon';
  } else {
    if (rarityRoll < 0.10) rarity = 'rare';
    else if (rarityRoll < 0.40) rarity = 'uncommon';
  }
  
  const value = Math.floor(baseValue * RARITY_MULTIPLIERS[rarity]);
  
  return {
    id: `loot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: template.name,
    category: template.category,
    value,
    rarity,
    itemType: template.itemType,
    manufacturer: 'Generic Corp', // Will be replaced with actual corp names later
    description: template.description,
  };
}
