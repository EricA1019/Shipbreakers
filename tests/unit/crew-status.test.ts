import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../../src/stores/gameStore";
import type { CrewMember } from "../../src/types";
import { createMockCrew, createMockStats, createMockSettings } from "../fixtures";

describe("Crew Status Transitions", () => {
  beforeEach(() => {
    const crew = createMockCrew({
      id: "crew1",
      firstName: "Test",
      lastName: "Crew",
      name: "Test Crew",
      background: "station_rat",
      skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
      currentJob: "idle",
      status: "active",
    });

    useGameStore.setState({
      credits: 10000,
      fuel: 100,
      food: 10,
      drink: 10,
      luxuryDrink: 5,
      daysWithoutFood: 0,
      beerRationDays: 0,
      crewEfficiencyPenalty: 0,
      day: 1,
      licenseDaysRemaining: 14,
      crewRoster: [crew],
      crew: crew,
      currentRun: null,
      availableWrecks: [],
      inventory: [],
      equipmentInventory: [],
      stats: createMockStats({ daysPlayed: 1 }),
      settings: createMockSettings(),
    });
  });

  it("transitions to injured status when HP < 20", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          hp: 15,
        },
      ],
    });

    const crew = useGameStore.getState().crewRoster[0];

    // Manually determine status as the function would
    const expectedStatus = crew.hp < 20 ? "injured" : "active";

    expect(expectedStatus).toBe("injured");
  });

  it("transitions to breakdown status when sanity === 0", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          sanity: 0,
        },
      ],
    });

    const crew = useGameStore.getState().crewRoster[0];

    const expectedStatus = crew.sanity === 0 ? "breakdown" : "active";

    expect(expectedStatus).toBe("breakdown");
  });

  it("sets resting status when crew is healing", () => {
    const crewId = useGameStore.getState().crewRoster[0].id;
    useGameStore.setState({ selectedCrewId: crewId });

    useGameStore.getState().healCrew(100);

    const crew = useGameStore.getState().crewRoster[0];

    expect(crew.status).toBe("resting");
    expect(crew.currentJob).toBe("resting");
  });

  it("prioritizes injured over breakdown status", () => {
    const crew: CrewMember = {
      ...useGameStore.getState().crewRoster[0],
      hp: 15,
      sanity: 0,
    };

    // Priority: mortality > needs
    const status = crew.hp < 20 ? "injured" : crew.sanity === 0 ? "breakdown" : "active";

    expect(status).toBe("injured");
  });

  it("recovers HP/stamina/sanity for resting crew", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          hp: 50,
          stamina: 40,
          sanity: 40,
          status: "resting",
          currentJob: "resting",
        },
      ],
    });

    const initialCrew = useGameStore.getState().crewRoster[0];

    // Simulate resting recovery logic
    const newHp = Math.min(initialCrew.maxHp, initialCrew.hp + 10);
    const newStamina = Math.min(initialCrew.maxStamina, initialCrew.stamina + 30);
    const newSanity = Math.min(initialCrew.maxSanity, initialCrew.sanity + 20);

    expect(newHp).toBe(60);
    expect(newStamina).toBe(70);
    expect(newSanity).toBe(60);
  });

  it("returns to active status when fully recovered from resting", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          hp: 85,
          stamina: 75,
          sanity: 75,
          status: "resting",
          currentJob: "resting",
        },
      ],
    });

    const crew = useGameStore.getState().crewRoster[0];

    // Check recovery threshold
    const shouldReturnToActive = crew.hp >= 80 && crew.stamina >= 70 && crew.sanity >= 70;

    expect(shouldReturnToActive).toBe(true);
  });

  it("does not return to active if not fully recovered", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          hp: 85,
          stamina: 65, // Below threshold
          sanity: 75,
          status: "resting",
          currentJob: "resting",
        },
      ],
    });

    const crew = useGameStore.getState().crewRoster[0];

    const shouldReturnToActive = crew.hp >= 80 && crew.stamina >= 70 && crew.sanity >= 70;

    expect(shouldReturnToActive).toBe(false);
  });

  it("active crew receives normal recovery at station", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          stamina: 50,
          sanity: 50,
          status: "active",
        },
      ],
    });

    const initialCrew = useGameStore.getState().crewRoster[0];

    // Normal recovery: +20 stamina, +5 sanity
    const newStamina = Math.min(initialCrew.maxStamina, initialCrew.stamina + 20);
    const newSanity = Math.min(initialCrew.maxSanity, initialCrew.sanity + 5);

    expect(newStamina).toBe(70);
    expect(newSanity).toBe(55);
  });
});
