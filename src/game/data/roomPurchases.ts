import type { PlayerRoomType, LicenseTier, SlotType } from "../../types";
import { ROOM_BASE_COSTS } from "../constants";

export interface RoomPurchaseOption {
  roomType: PlayerRoomType;
  name: string;
  baseCost: number;
  slots: SlotType[];
  description: string;
  requiredLicense: LicenseTier;
  crewBonus?: number;
  cargoBonus?: number;
}

export const ROOM_PURCHASE_OPTIONS: RoomPurchaseOption[] = [
  {
    roomType: "cargo",
    name: "Cargo Bay",
    baseCost: ROOM_BASE_COSTS.cargo,
    slots: ["cargo", "cargo", "cargo", "cargo"],
    description: "Increases cargo capacity by 4 slots.",
    requiredLicense: "basic",
    cargoBonus: 4,
  },
  {
    roomType: "quarters",
    name: "Crew Quarters",
    baseCost: ROOM_BASE_COSTS.quarters,
    slots: ["bridge"], // Using bridge slot as generic 'personal' slot for now
    description: "Increases crew capacity by 1.",
    requiredLicense: "basic",
    crewBonus: 1,
  },
  {
    roomType: "workshop",
    name: "Workshop",
    baseCost: ROOM_BASE_COSTS.workshop,
    slots: ["engineering", "engineering"],
    description: "Provides engineering slots for repair modules.",
    requiredLicense: "standard",
  },
  {
    roomType: "medbay",
    name: "Medical Bay",
    baseCost: ROOM_BASE_COSTS.medbay,
    slots: ["medical", "medical"],
    description: "Provides medical slots for healing modules.",
    requiredLicense: "standard",
  },
  {
    roomType: "armory",
    name: "Armory",
    baseCost: ROOM_BASE_COSTS.armory,
    slots: ["combat", "combat"],
    description: "Provides combat slots for weapon modules.",
    requiredLicense: "standard",
  },
  {
    roomType: "engine",
    name: "Engine Room",
    baseCost: ROOM_BASE_COSTS.engine,
    slots: ["engineering", "engineering", "engineering"],
    description: "Provides engineering slots and increases power capacity.",
    requiredLicense: "premium",
  },
  {
    roomType: "lounge",
    name: "Crew Lounge",
    baseCost: ROOM_BASE_COSTS.lounge,
    slots: [],
    description: "A place for crew to relax. (Future: Morale bonus)",
    requiredLicense: "basic",
  },
];
