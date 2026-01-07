import type { Item, ItemFlags } from "../../types";
import equipmentData from "./equipment.json";

/**
 * Default flags for equipment items - all are equippable, sellable, and storable
 */
const defaultEquipmentFlags: ItemFlags = {
  equippable: true,
  sellable: true,
  storable: true,
  consumable: false,
  questItem: false,
  carryable: false,
  passive: true,
  powered: true,
};

export const EQUIPMENT: Record<string, Item> = {
  ...Object.fromEntries(
    Object.entries(equipmentData as Record<string, Omit<Item, "flags">>).map(
      ([key, item]) => [
        key,
        {
          ...item,
          flags: defaultEquipmentFlags,
        } satisfies Item,
      ],
    ),
  ),
};

export function getEquipmentById(id: string): Item | undefined {
  return (EQUIPMENT as Record<string, Item>)[id];
}

export function getAllEquipment(): Item[] {
  return Object.values(EQUIPMENT);
}
