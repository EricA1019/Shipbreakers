import type { ReactorModule } from "../../types";

export const REACTORS: Record<string, ReactorModule> = {
  "salvaged-reactor": {
    id: "salvaged-reactor",
    name: "Salvaged Reactor",
    tier: 1,
    powerOutput: 3,
    manufacturer: "Scrapyard Solutions",
    value: 1000,
  },
  "standard-reactor": {
    id: "standard-reactor",
    name: "Standard Reactor",
    tier: 2,
    powerOutput: 5,
    manufacturer: "Rustbelt Mining",
    value: 5000,
  },
  "industrial-reactor": {
    id: "industrial-reactor",
    name: "Forge Core",
    tier: 3,
    powerOutput: 8,
    manufacturer: "Forge Collective",
    value: 15000,
  },
  "fusion-reactor": {
    id: "fusion-reactor",
    name: "Titan Fusion Core",
    tier: 4,
    powerOutput: 12,
    manufacturer: "Titan Industries",
    value: 40000,
  },
  "zero-point-reactor": {
    id: "zero-point-reactor",
    name: "Zero Point Module",
    tier: 5,
    powerOutput: 20,
    manufacturer: "Zero Point Industries",
    value: 125000,
  },
};

export function getReactorById(id: string): ReactorModule | undefined {
  return REACTORS[id];
}
