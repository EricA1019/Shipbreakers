import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStore } from "../../src/stores/gameStore";
import { SHORE_LEAVE_OPTIONS } from "../../src/game/constants";

describe("Shore Leave Events", () => {
  beforeEach(() => {
    useGameStore.setState({
      credits: 10000,
      luxuryDrink: 20,
      day: 1,
      licenseDaysRemaining: 14,
      crewRoster: [
        {
          id: "crew1",
          firstName: "Test",
          lastName: "Crew",
          name: "Test Crew",
          background: "station_rat" as any,
          traits: [],
          skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
          skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
          hp: 100,
          maxHp: 100,
          stamina: 50,
          maxStamina: 100,
          sanity: 50,
          maxSanity: 100,
          currentJob: "idle",
          status: "active",
        },
      ],
      crew: null as any,
      activeEvent: null,
      stats: { daysPlayed: 1 } as any,
    });
  });

  it("triggers social events with appropriate probability - rest (10%)", () => {
    const trials = 1000;
    let eventCount = 0;

    for (let i = 0; i < trials; i++) {
      useGameStore.setState({
        activeEvent: null,
        day: 1,
        licenseDaysRemaining: 14,
        credits: 10000,
        luxuryDrink: 20,
        stats: { daysPlayed: 1 } as any,
      });

      useGameStore.getState().takeShoreLeave("rest");
      if (useGameStore.getState().activeEvent) eventCount++;
    }

    const observedRate = eventCount / trials;
    const expectedRate = SHORE_LEAVE_OPTIONS.rest.eventChance;
    expect(observedRate).toBeGreaterThan(expectedRate - 0.05);
    expect(observedRate).toBeLessThan(expectedRate + 0.05);
  });

  it("triggers social events with appropriate probability - recreation (30%)", () => {
    const trials = 1000;
    let eventCount = 0;

    for (let i = 0; i < trials; i++) {
      useGameStore.setState({
        activeEvent: null,
        day: 1,
        licenseDaysRemaining: 14,
        credits: 10000,
        luxuryDrink: 20,
        stats: { daysPlayed: 1 } as any,
      });

      useGameStore.getState().takeShoreLeave("recreation");
      if (useGameStore.getState().activeEvent) eventCount++;
    }

    const observedRate = eventCount / trials;
    const expectedRate = SHORE_LEAVE_OPTIONS.recreation.eventChance;
    expect(observedRate).toBeGreaterThan(expectedRate - 0.05);
    expect(observedRate).toBeLessThan(expectedRate + 0.05);
  });

  it("triggers social events with appropriate probability - party (60%)", () => {
    const trials = 1000;
    let eventCount = 0;

    for (let i = 0; i < trials; i++) {
      useGameStore.setState({
        activeEvent: null,
        day: 1,
        licenseDaysRemaining: 14,
        credits: 10000,
        luxuryDrink: 20,
        stats: { daysPlayed: 1 } as any,
      });

      useGameStore.getState().takeShoreLeave("party");
      if (useGameStore.getState().activeEvent) eventCount++;
    }

    const observedRate = eventCount / trials;
    const expectedRate = SHORE_LEAVE_OPTIONS.party.eventChance;
    expect(observedRate).toBeGreaterThan(expectedRate - 0.05);
    expect(observedRate).toBeLessThan(expectedRate + 0.05);
  });

  it("recovers crew stats correctly - rest", () => {
    const initialStamina = 50;
    const initialSanity = 50;

    useGameStore.getState().takeShoreLeave("rest");

    const crew = useGameStore.getState().crewRoster[0];
    expect(crew.stamina).toBe(initialStamina + SHORE_LEAVE_OPTIONS.rest.staminaRecovery);
    expect(crew.sanity).toBe(initialSanity + SHORE_LEAVE_OPTIONS.rest.sanityRecovery);
    expect(crew.status).toBe("resting");
    expect(crew.currentJob).toBe("resting");
  });

  it("advances time and decreases license days", () => {
    const initialDay = useGameStore.getState().day;
    const initialLicense = useGameStore.getState().licenseDaysRemaining;

    useGameStore.getState().takeShoreLeave("party");

    const state = useGameStore.getState();
    expect(state.day).toBe(initialDay + SHORE_LEAVE_OPTIONS.party.duration);
    expect(state.licenseDaysRemaining).toBe(initialLicense - SHORE_LEAVE_OPTIONS.party.duration);
  });
});
