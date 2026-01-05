import type {
  CrewMember,
  Skills,
  BackgroundId,
  TraitId,
  HireCandidate,
} from "../../types";
import { generateFullName } from "../data/crewNames";
import { BACKGROUNDS, getRandomBackground } from "../data/backgrounds";
import { TRAITS, getPositiveTraits } from "../data/traits";
import { BASE_STAMINA, BASE_SANITY } from "../constants";

export class SeededRandom {
  private seed: number;

  constructor(seed: string | number) {
    if (typeof seed === "string") {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      this.seed = Math.abs(hash);
    } else {
      this.seed = seed;
    }
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export function generateSkills(
  background: BackgroundId,
  rng: SeededRandom
): Skills {
  const bg = BACKGROUNDS[background];
  const skills: Skills = {
    technical: rng.nextInt(1, 4),
    combat: rng.nextInt(1, 4),
    salvage: rng.nextInt(1, 4),
    piloting: rng.nextInt(1, 4),
  };

  if (bg.skillModifiers) {
    for (const [skill, mod] of Object.entries(bg.skillModifiers)) {
      const s = skill as keyof Skills;
      skills[s] = Math.max(1, Math.min(5, skills[s] + (mod || 0)));
    }
  }

  return skills;
}

export function generateTraits(
  background: BackgroundId,
  rng: SeededRandom
): TraitId[] {
  const bg = BACKGROUNDS[background];
  const traits: TraitId[] = [];

  if (bg.traitPool.length > 0 && rng.next() < 0.7) {
    const poolIndex = Math.floor(rng.next() * bg.traitPool.length);
    const poolTrait = bg.traitPool[poolIndex];
    if (poolTrait && TRAITS[poolTrait]) {
      traits.push(poolTrait);
    }
  }

  if (rng.next() < 0.3) {
    const allTraits = Object.keys(TRAITS) as TraitId[];
    const available = allTraits.filter((t) => !traits.includes(t));
    if (available.length > 0) {
      const index = Math.floor(rng.next() * available.length);
      traits.push(available[index]);
    }
  }

  return traits;
}

export function generateCrewMember(
  id: string,
  rng: SeededRandom,
  overrides?: Partial<CrewMember>
): CrewMember {
  const background = overrides?.background || getRandomBackground(() => rng.next());
  const bg = BACKGROUNDS[background];
  const nameData = generateFullName(() => rng.next());
  const skills = generateSkills(background, rng);
  const traits = overrides?.traits || generateTraits(background, rng);

  const staminaMod = bg.statModifiers?.stamina || 0;
  const sanityMod = bg.statModifiers?.sanity || 0;
  const maxStamina = BASE_STAMINA + staminaMod;
  const maxSanity = BASE_SANITY + sanityMod;

  return {
    id,
    firstName: overrides?.firstName || nameData.firstName,
    lastName: overrides?.lastName || nameData.lastName,
    name: overrides?.name || nameData.name,
    isPlayer: overrides?.isPlayer || false,
    background,
    traits,
    stats: overrides?.stats || { movement: { multiplier: 1 } },
    skills: overrides?.skills || skills,
    skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
    hp: 100,
    maxHp: 100,
    stamina: maxStamina,
    maxStamina,
    sanity: maxSanity,
    maxSanity,
    currentJob: "idle",
    status: "active",
    ...overrides,
    inventory: [],
  };
}

export function generateCaptain(
  firstName: string,
  lastName: string,
  lockedTrait: TraitId,
  chosenTrait: TraitId
): CrewMember {
  const rng = new SeededRandom(`captain-${firstName}-${lastName}`);
  return generateCrewMember("captain-1", rng, {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    isPlayer: true,
    background: "ship_captain",
    traits: [lockedTrait, chosenTrait],
    skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
    skillXp: { technical: 100, combat: 100, salvage: 100, piloting: 100 },
  });
}

export function generateHireCandidates(
  day: number,
  count: number = 3
): HireCandidate[] {
  const rng = new SeededRandom(`hire-${day}`);
  const candidates: HireCandidate[] = [];

  for (let i = 0; i < count; i++) {
    const id = `hire-${day}-${i}`;
    const crew = generateCrewMember(id, rng);
    const totalSkill =
      crew.skills.technical +
      crew.skills.combat +
      crew.skills.salvage +
      crew.skills.piloting;
    const cost = 500 + totalSkill * 100;

    candidates.push({
      id,
      name: crew.name,
      skills: crew.skills,
      background: crew.background,
      traits: crew.traits,
      cost,
    });
  }

  return candidates;
}

export function getCharacterCreationTraitOptions(seed: string): {
  lockedTrait: TraitId;
  options: TraitId[];
} {
  const rng = new SeededRandom(seed);
  const positive = getPositiveTraits();
  const shuffled = [...positive].sort(() => rng.next() - 0.5);

  return {
    lockedTrait: shuffled[0],
    options: shuffled.slice(1, 4),
  };
}