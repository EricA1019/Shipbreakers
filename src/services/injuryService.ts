/**
 * Injury Service - Phase 14
 * Handles crew injuries, death, and recovery
 */

import type {
  CrewMember,
  Injury,
  InjuryType,
  InjurySeverity,
  InjuryConfig,
  DeadCrewMember,
  Skills,
} from "../types";
import {
  DEATH_CHANCE_ON_ZERO_HP,
  CRITICAL_INJURY_CHANCE,
  MAJOR_INJURY_CHANCE,
  MORALE_LOSS_ON_DEATH,
  MORALE_LOSS_CLOSE_FRIEND,
  BASE_MORALE,
} from "../game/constants";
import {
  getRelationshipValue,
} from "./relationshipService";
import type { CrewRelationship } from "../types";

/**
 * Injury configurations with effects per severity
 */
export const INJURY_CONFIGS: Record<InjuryType, InjuryConfig> = {
  broken_arm: {
    type: "broken_arm",
    name: "Broken Arm",
    description: "Fractured arm bone limits manual dexterity",
    severityDays: {
      minor: 3,
      major: 7,
      critical: 14,
    },
    effects: {
      minor: { skillPenalty: { technical: -1 } },
      major: { skillPenalty: { technical: -2, salvage: -1 } },
      critical: { skillPenalty: { technical: -3, salvage: -2 }, workDisabled: true },
    },
  },
  broken_leg: {
    type: "broken_leg",
    name: "Broken Leg",
    description: "Leg fracture severely limits mobility",
    severityDays: {
      minor: 4,
      major: 10,
      critical: 18,
    },
    effects: {
      minor: { skillPenalty: { piloting: -1 }, staminaModifier: -20 },
      major: { skillPenalty: { piloting: -2 }, staminaModifier: -40 },
      critical: { workDisabled: true, staminaModifier: -60 },
    },
  },
  concussion: {
    type: "concussion",
    name: "Concussion",
    description: "Head trauma causing disorientation",
    severityDays: {
      minor: 2,
      major: 5,
      critical: 10,
    },
    effects: {
      minor: { skillPenalty: { combat: -1 } },
      major: { skillPenalty: { combat: -2, technical: -1 } },
      critical: { skillPenalty: { combat: -3, technical: -2 }, workDisabled: true },
    },
  },
  radiation_sickness: {
    type: "radiation_sickness",
    name: "Radiation Sickness",
    description: "Exposure to dangerous radiation levels",
    severityDays: {
      minor: 3,
      major: 8,
      critical: 15,
    },
    effects: {
      minor: { staminaModifier: -15 },
      major: { staminaModifier: -30, skillPenalty: { salvage: -1 } },
      critical: { staminaModifier: -50, workDisabled: true },
    },
  },
  burns: {
    type: "burns",
    name: "Burns",
    description: "Thermal or chemical burns",
    severityDays: {
      minor: 2,
      major: 6,
      critical: 12,
    },
    effects: {
      minor: { skillPenalty: { technical: -1 } },
      major: { skillPenalty: { technical: -1, salvage: -1 }, staminaModifier: -20 },
      critical: { workDisabled: true, staminaModifier: -40 },
    },
  },
  trauma: {
    type: "trauma",
    name: "Psychological Trauma",
    description: "Mental trauma from a horrific experience",
    severityDays: {
      minor: 3,
      major: 7,
      critical: 14,
    },
    effects: {
      minor: { skillPenalty: { combat: -1 } },
      major: { skillPenalty: { combat: -2 } },
      critical: { workDisabled: true },
    },
  },
  internal_bleeding: {
    type: "internal_bleeding",
    name: "Internal Bleeding",
    description: "Dangerous internal hemorrhaging",
    severityDays: {
      minor: 4,
      major: 9,
      critical: 16,
    },
    effects: {
      minor: { staminaModifier: -25 },
      major: { staminaModifier: -50, workDisabled: true },
      critical: { workDisabled: true, staminaModifier: -70 },
    },
  },
};

/**
 * Roll for injury type based on cause
 */
export function rollInjuryType(cause: string): InjuryType {
  const injuryTypes: InjuryType[] = Object.keys(INJURY_CONFIGS) as InjuryType[];
  
  // Weight certain injuries based on cause
  const weights: Record<string, Partial<Record<InjuryType, number>>> = {
    salvage: {
      broken_arm: 2,
      burns: 2,
      radiation_sickness: 1.5,
      concussion: 1,
    },
    combat: {
      broken_leg: 1.5,
      internal_bleeding: 2,
      concussion: 2,
      trauma: 1,
    },
    accident: {
      broken_arm: 2,
      broken_leg: 2,
      concussion: 1.5,
      burns: 1,
    },
    event: {
      trauma: 2,
      burns: 1,
      radiation_sickness: 1.5,
    },
  };

  const causeWeights = weights[cause] || {};
  const weightedTypes: InjuryType[] = [];
  
  for (const type of injuryTypes) {
    const weight = causeWeights[type] || 1;
    for (let i = 0; i < Math.ceil(weight * 10); i++) {
      weightedTypes.push(type);
    }
  }

  return weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
}

/**
 * Roll for injury severity
 */
export function rollInjurySeverity(isCritical: boolean): InjurySeverity {
  if (isCritical) {
    return "critical";
  }
  
  const roll = Math.random();
  if (roll < MAJOR_INJURY_CHANCE) {
    return "major";
  }
  return "minor";
}

/**
 * Create an injury object
 */
export function createInjury(type: InjuryType, severity: InjurySeverity): Injury {
  const config = INJURY_CONFIGS[type];
  const days = config.severityDays[severity];
  
  return {
    type,
    severity,
    daysRemaining: days,
    daysSuffered: days,
    effects: config.effects[severity],
  };
}

/**
 * Handle crew reaching 0 HP - determine death vs injury
 * Returns the outcome and any morale impacts
 */
export interface DeathOrInjuryResult {
  outcome: "death" | "critical_injury" | "injury";
  injury?: Injury;
  deadCrewRecord?: DeadCrewMember;
  moraleImpacts: Array<{ crewId: string; amount: number; reason: string }>;
}

export function handleCrewDown(
  crew: CrewMember,
  cause: string,
  day: number,
  relationships: CrewRelationship[],
  otherCrewIds: string[]
): DeathOrInjuryResult {
  const deathRoll = Math.random();
  
  if (deathRoll < DEATH_CHANCE_ON_ZERO_HP) {
    // Death
    const deadRecord: DeadCrewMember = {
      id: crew.id,
      firstName: crew.firstName,
      lastName: crew.lastName,
      name: crew.name,
      background: crew.background,
      traits: crew.traits,
      diedOnDay: day,
      causeOfDeath: cause,
      daysEmployed: crew.hiredDay ? day - crew.hiredDay : 0,
    };

    // Calculate morale impacts for surviving crew
    const moraleImpacts: Array<{ crewId: string; amount: number; reason: string }> = [];
    
    for (const otherId of otherCrewIds) {
      let totalLoss = MORALE_LOSS_ON_DEATH;
      const relationshipLevel = getRelationshipValue(relationships, crew.id, otherId);
      
      // Additional loss for close relationships
      if (relationshipLevel >= 8) {
        totalLoss += MORALE_LOSS_CLOSE_FRIEND;
      }
      
      moraleImpacts.push({
        crewId: otherId,
        amount: -totalLoss,
        reason: `Lost ${crew.name}`,
      });
    }

    return {
      outcome: "death",
      deadCrewRecord: deadRecord,
      moraleImpacts,
    };
  }

  // Survived - determine injury severity
  const isCritical = Math.random() < CRITICAL_INJURY_CHANCE;
  const severity = rollInjurySeverity(isCritical);
  const injuryType = rollInjuryType(cause);
  const injury = createInjury(injuryType, severity);

  return {
    outcome: isCritical ? "critical_injury" : "injury",
    injury,
    moraleImpacts: [], // Injuries don't cause morale loss (just concern)
  };
}

/**
 * Process daily injury recovery for all crew
 */
export function processInjuryRecovery(
  crewRoster: CrewMember[]
): { updatedRoster: CrewMember[]; recoveredCrew: string[] } {
  const recoveredCrew: string[] = [];
  
  const updatedRoster = crewRoster.map((crew) => {
    if (!crew.injury) return crew;
    
    const newDaysRemaining = crew.injury.daysRemaining - 1;
    
    if (newDaysRemaining <= 0) {
      // Fully recovered
      recoveredCrew.push(crew.name);
      return {
        ...crew,
        injury: undefined,
        status: "active" as const,
        hp: Math.max(crew.hp, Math.floor(crew.maxHp * 0.5)), // Recover to at least 50% HP
      };
    }
    
    return {
      ...crew,
      injury: { ...crew.injury, daysRemaining: newDaysRemaining },
    };
  });
  
  return { updatedRoster, recoveredCrew };
}

/**
 * Apply injury skill penalties to a crew member's effective skills
 */
export function getEffectiveSkills(crew: CrewMember): Skills {
  const base = { ...crew.skills };
  
  if (!crew.injury?.effects.skillPenalty) {
    return base;
  }
  
  const penalty = crew.injury.effects.skillPenalty;
  
  return {
    technical: Math.max(1, base.technical + (penalty.technical || 0)),
    combat: Math.max(1, base.combat + (penalty.combat || 0)),
    salvage: Math.max(1, base.salvage + (penalty.salvage || 0)),
    piloting: Math.max(1, base.piloting + (penalty.piloting || 0)),
  };
}

/**
 * Get effective max stamina considering injury
 */
export function getEffectiveMaxStamina(crew: CrewMember): number {
  if (!crew.injury?.effects.staminaModifier) {
    return crew.maxStamina;
  }
  
  const modifier = crew.injury.effects.staminaModifier;
  return Math.floor(crew.maxStamina * (1 + modifier / 100));
}

/**
 * Check if crew can work (considering injury)
 */
export function isCrewWorkCapable(crew: CrewMember): boolean {
  if (crew.injury?.effects.workDisabled) {
    return false;
  }
  return true;
}

/**
 * Get injury display info for UI
 */
export function getInjuryDisplayInfo(injury: Injury): {
  name: string;
  severity: string;
  description: string;
  daysLeft: number;
  canWork: boolean;
} {
  const config = INJURY_CONFIGS[injury.type];
  return {
    name: config.name,
    severity: injury.severity.charAt(0).toUpperCase() + injury.severity.slice(1),
    description: config.description,
    daysLeft: injury.daysRemaining,
    canWork: !injury.effects.workDisabled,
  };
}

/**
 * Get severity color for UI
 */
export function getInjurySeverityColor(severity: InjurySeverity): string {
  const colors: Record<InjurySeverity, string> = {
    minor: "text-yellow-400",
    major: "text-orange-400",
    critical: "text-red-400",
  };
  return colors[severity];
}

/**
 * Initialize morale for a new crew member
 */
export function initializeCrewMorale(crew: CrewMember): CrewMember {
  return {
    ...crew,
    morale: crew.morale ?? BASE_MORALE,
  };
}

/**
 * Update crew morale
 */
export function updateCrewMorale(
  crew: CrewMember,
  delta: number,
  _reason: string
): CrewMember {
  const currentMorale = crew.morale ?? BASE_MORALE;
  const newMorale = Math.max(0, Math.min(100, currentMorale + delta));
  
  return {
    ...crew,
    morale: newMorale,
  };
}

/**
 * Get morale level description
 */
export function getMoraleLevel(morale: number): string {
  if (morale >= 80) return "Excellent";
  if (morale >= 60) return "Good";
  if (morale >= 40) return "Fair";
  if (morale >= 20) return "Low";
  return "Critical";
}

/**
 * Get morale color for UI
 */
export function getMoraleColor(morale: number): string {
  if (morale >= 80) return "text-green-400";
  if (morale >= 60) return "text-blue-400";
  if (morale >= 40) return "text-yellow-400";
  if (morale >= 20) return "text-orange-400";
  return "text-red-400";
}
