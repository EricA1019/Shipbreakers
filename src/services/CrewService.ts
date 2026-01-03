/**
 * Crew Service
 * 
 * Handles crew management operations: hiring, healing, shore leave.
 * These are pure functions that return state updates for Zustand.
 */
import type { 
  GameState, 
  CrewMember, 
  HireCandidate,
  SkillXp,
  CrewStatus,
  CrewJob,
} from '../types';
import { BASE_STAMINA, BASE_SANITY, SHORE_LEAVE_OPTIONS } from '../game/constants';

const MAX_CREW_ROSTER = 5;
const HEALING_COST = 50;
const HEALING_AMOUNT = 10;

/**
 * Result of a crew operation
 */
export interface CrewResult {
  success: boolean;
  updates?: Partial<GameState>;
  error?: string;
  triggerEvent?: boolean; // Whether to check for social events
}

/**
 * Generate a unique crew ID
 */
function generateCrewId(): string {
  return `crew-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000).toString(36)}`;
}

/**
 * Hire a new crew member from candidates
 */
export function hireCrew(
  state: Pick<GameState, 'credits' | 'crewRoster' | 'day'>,
  candidate: HireCandidate
): CrewResult {
  const cost = candidate.cost;

  if (state.credits < cost) {
    return { success: false, error: 'Insufficient credits' };
  }

  if (state.crewRoster.length >= MAX_CREW_ROSTER) {
    return { success: false, error: 'Crew roster full' };
  }

  const newCrew: CrewMember = {
    id: generateCrewId(),
    firstName: candidate.name,
    lastName: '',
    name: candidate.name,
    isPlayer: false,
    background: 'station_rat',
    traits: [],
    skills: candidate.skills,
    skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 } as SkillXp,
    hp: 100,
    maxHp: 100,
    stamina: BASE_STAMINA,
    maxStamina: BASE_STAMINA,
    sanity: BASE_SANITY,
    maxSanity: BASE_SANITY,
    hiredDay: state.day,
    hireCost: cost,
    currentJob: 'idle' as CrewJob,
    status: 'active' as CrewStatus,
    position: { location: 'station' },
    inventory: [],
  };

  return {
    success: true,
    updates: {
      credits: state.credits - cost,
      crewRoster: [...state.crewRoster, newCrew],
    },
  };
}

/**
 * Select a crew member as active
 */
export function selectCrew(
  _state: Pick<GameState, 'crewRoster'>,
  crewId: string
): CrewResult {
  return {
    success: true,
    updates: {
      selectedCrewId: crewId,
    },
  };
}

/**
 * Heal a crew member at medical bay
 */
export function healCrew(
  state: Pick<GameState, 'credits' | 'crewRoster' | 'selectedCrewId'>,
  crewId?: string
): CrewResult {
  const targetId = crewId ?? state.selectedCrewId;
  const crew = state.crewRoster.find((c) => c.id === targetId) ?? state.crewRoster[0];

  if (!crew) {
    return { success: false, error: 'No crew member found' };
  }

  if (state.credits < HEALING_COST) {
    return { success: false, error: 'Insufficient credits' };
  }

  if (crew.hp >= crew.maxHp) {
    return { success: false, error: 'Crew member is already at full health' };
  }

  const updatedRoster = state.crewRoster.map((c) =>
    c.id === crew.id
      ? { ...c, hp: Math.min(c.hp + HEALING_AMOUNT, c.maxHp) }
      : c
  );

  return {
    success: true,
    updates: {
      credits: state.credits - HEALING_COST,
      crewRoster: updatedRoster,
      crew: updatedRoster.find((c) => c.id === crew.id),
    },
  };
}

type ShoreLeaveType = 'rest' | 'recreation' | 'party';

/**
 * Take shore leave to recover crew stats
 */
export function takeShoreLeave(
  state: Pick<GameState, 'credits' | 'crewRoster' | 'luxuryDrink' | 'day' | 'licenseDaysRemaining' | 'stats' | 'selectedCrewId'>,
  type: ShoreLeaveType
): CrewResult {
  const opt = SHORE_LEAVE_OPTIONS[type];
  if (!opt) {
    return { success: false, error: 'Invalid shore leave type' };
  }

  const crewCount = state.crewRoster.length;
  const beerNeed = (opt as { beerPerCrew?: number }).beerPerCrew 
    ? crewCount * ((opt as { beerPerCrew?: number }).beerPerCrew ?? 0) 
    : 0;

  if (state.credits < opt.cost) {
    return { success: false, error: 'Insufficient credits' };
  }

  if (beerNeed > 0 && state.luxuryDrink < beerNeed) {
    return { success: false, error: 'Insufficient luxury drinks' };
  }

  // Update crew stats
  const updatedRoster = state.crewRoster.map((c) => ({
    ...c,
    stamina: Math.min(c.maxStamina, (c.stamina ?? c.maxStamina) + opt.staminaRecovery),
    sanity: Math.min(c.maxSanity, (c.sanity ?? c.maxSanity) + opt.sanityRecovery),
    status: 'resting' as CrewStatus,
    currentJob: 'resting' as CrewJob,
    position: { location: 'station' as const },
  }));

  const selectedCrew = updatedRoster.find((c) => c.id === state.selectedCrewId) ?? updatedRoster[0];

  return {
    success: true,
    updates: {
      credits: state.credits - opt.cost,
      luxuryDrink: beerNeed > 0 ? state.luxuryDrink - beerNeed : state.luxuryDrink,
      crewRoster: updatedRoster,
      crew: selectedCrew,
      day: state.day + opt.duration,
      licenseDaysRemaining: Math.max(0, state.licenseDaysRemaining - opt.duration),
      stats: { ...state.stats, daysPlayed: state.stats.daysPlayed + opt.duration },
    },
    triggerEvent: Math.random() < opt.eventChance,
  };
}

/**
 * Assign crew member to a room for auto-salvage
 */
export function assignCrewToRoom(
  state: Pick<GameState, 'crewRoster' | 'autoAssignments'>,
  crewId: string,
  roomId: string
): CrewResult {
  const updatedRoster = state.crewRoster.map((c) =>
    c.id === crewId
      ? { 
          ...c, 
          position: { location: 'wreck' as const, roomId }, 
          currentJob: 'salvaging' as CrewJob 
        }
      : c
  );

  return {
    success: true,
    updates: {
      autoAssignments: { ...(state.autoAssignments || {}), [crewId]: roomId },
      crewRoster: updatedRoster,
    },
  };
}

/**
 * Get crew member by ID
 */
export function getCrewById(roster: CrewMember[], crewId: string): CrewMember | undefined {
  return roster.find((c) => c.id === crewId);
}

/**
 * Get active (non-injured) crew members
 */
export function getActiveCrewMembers(roster: CrewMember[]): CrewMember[] {
  return roster.filter((c) => c.status === 'active');
}

/**
 * Check if crew can work based on settings thresholds
 */
export function canCrewWork(
  crew: CrewMember,
  settings: { minCrewHpPercent: number; minCrewStamina: number; minCrewSanity: number }
): boolean {
  const hpPercent = (crew.hp / crew.maxHp) * 100;
  return (
    hpPercent >= settings.minCrewHpPercent &&
    crew.stamina >= settings.minCrewStamina &&
    crew.sanity >= settings.minCrewSanity
  );
}
