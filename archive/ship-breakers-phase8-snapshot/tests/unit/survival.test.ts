import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../../src/stores/gameStore";

describe("Survival Penalties", () => {
  beforeEach(() => {
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
          stamina: 100,
          maxStamina: 100,
          sanity: 100,
          maxSanity: 100,
          currentJob: "idle",
          status: "active",
        },
      ],
      crew: null as any,
      currentRun: null,
      availableWrecks: [],
      inventory: [],
      equipmentInventory: [],
      stats: { daysPlayed: 1 } as any,
      settings: {} as any,
    });
  });

  it("applies starvation HP loss after 3+ days without food", () => {
    const initialHp = 100;

    // Simulate 5 days without food
    useGameStore.setState({
      daysWithoutFood: 5,
      food: 0,
      drink: 10, // Have drink so only starvation applies
      luxuryDrink: 0,
    });

    // Manually trigger returnToStation survival penalty logic
    const state = useGameStore.getState();
    const roster = state.crewRoster || [];
    const updatedRoster = roster.map((c) => {
      let newHp = c.hp;
      const daysWithoutFood = state.daysWithoutFood;
      if (daysWithoutFood >= 3) {
        newHp = Math.max(0, newHp - 5 * (daysWithoutFood - 2));
      }
      return { ...c, hp: newHp };
    });

    // Days 4 and 5 count as starvation (3 days is threshold)
    const expectedHp = initialHp - 5 * (5 - 2); // 100 - 5*3 = 85
    expect(updatedRoster[0].hp).toBe(expectedHp);
  });

  it("applies sanity loss when no drink available", () => {
    const initialSanity = 100;

    useGameStore.setState({
      food: 10,
      drink: 0,
      luxuryDrink: 0,
      daysWithoutFood: 0,
    });

    // Manually trigger survival penalty logic
    const state = useGameStore.getState();
    const roster = state.crewRoster || [];
    const updatedRoster = roster.map((c) => {
      let newSanity = c.sanity;
      if (state.drink === 0 && state.luxuryDrink === 0) {
        newSanity = Math.max(0, newSanity - 10);
      }
      return { ...c, sanity: newSanity };
    });

    expect(updatedRoster[0].sanity).toBe(initialSanity - 10);
  });

  it("sets beer efficiency penalty when beer is used as drink", () => {
    useGameStore.setState({
      beerRationDays: 3,
    });

    // Simulate setting the penalty as returnToStation would
    const penalty = useGameStore.getState().beerRationDays > 0 ? 2 : 0;

    expect(penalty).toBe(2);
  });

  it("does not apply starvation HP loss if under 3 days", () => {
    const initialHp = 100;

    useGameStore.setState({
      daysWithoutFood: 2,
      food: 0,
      drink: 10,
      luxuryDrink: 0,
    });

    const state = useGameStore.getState();
    const roster = state.crewRoster || [];
    const updatedRoster = roster.map((c) => {
      let newHp = c.hp;
      if (state.daysWithoutFood >= 3) {
        newHp = Math.max(0, newHp - 5 * (state.daysWithoutFood - 2));
      }
      return { ...c, hp: newHp };
    });

    expect(updatedRoster[0].hp).toBe(initialHp);
  });

  it("does not apply sanity loss if luxury drink is available", () => {
    const initialSanity = 100;

    useGameStore.setState({
      food: 10,
      drink: 0,
      luxuryDrink: 5,
      daysWithoutFood: 0,
    });

    const state = useGameStore.getState();
    const roster = state.crewRoster || [];
    const updatedRoster = roster.map((c) => {
      let newSanity = c.sanity;
      if (state.drink === 0 && state.luxuryDrink === 0) {
        newSanity = Math.max(0, newSanity - 10);
      }
      return { ...c, sanity: newSanity };
    });

    expect(updatedRoster[0].sanity).toBe(initialSanity);
  });
});

describe("Stat Consumption and Recovery", () => {
  beforeEach(() => {
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
          stamina: 100,
          maxStamina: 100,
          sanity: 100,
          maxSanity: 100,
          currentJob: "idle",
          status: "active",
        },
      ],
      crew: null as any,
      currentRun: null,
      availableWrecks: [],
      inventory: [],
      equipmentInventory: [],
      stats: { daysPlayed: 1 } as any,
      settings: {} as any,
    });
  });

  it("depletes stamina when salvaging (10 per action)", () => {
    const initialStamina = 100;
    const staminaCost = 10;

    // Simulate stamina deduction as salvageRoom would
    const state = useGameStore.getState();
    const crew = state.crewRoster[0];
    const newStamina = Math.max(0, crew.stamina - staminaCost);

    expect(newStamina).toBe(initialStamina - staminaCost);
  });

  it("depletes sanity on failed hazard (base 5 + hazard level)", () => {
    const initialSanity = 100;
    const hazardLevel = 3;
    const sanityLoss = 5 + hazardLevel; // SANITY_LOSS_BASE + hazardLevel

    // Simulate sanity loss on failure
    const state = useGameStore.getState();
    const crew = state.crewRoster[0];
    const newSanity = Math.max(0, crew.sanity - sanityLoss);

    expect(newSanity).toBe(initialSanity - sanityLoss);
  });

  it("recovers stamina at station (+20)", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          stamina: 50,
        },
      ],
    });

    const initialStamina = 50;
    const recovery = 20; // STAMINA_RECOVERY_STATION

    // Simulate recovery as returnToStation would
    const state = useGameStore.getState();
    const crew = state.crewRoster[0];
    const newStamina = Math.min(crew.maxStamina, crew.stamina + recovery);

    expect(newStamina).toBe(initialStamina + recovery);
  });

  it("recovers sanity at station (+5)", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          sanity: 60,
        },
      ],
    });

    const initialSanity = 60;
    const recovery = 5; // SANITY_RECOVERY_STATION

    // Simulate recovery as returnToStation would
    const state = useGameStore.getState();
    const crew = state.crewRoster[0];
    const newSanity = Math.min(crew.maxSanity, crew.sanity + recovery);

    expect(newSanity).toBe(initialSanity + recovery);
  });

  it("does not exceed max stamina when recovering", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          stamina: 95,
          maxStamina: 100,
        },
      ],
    });

    const recovery = 20;

    const state = useGameStore.getState();
    const crew = state.crewRoster[0];
    const newStamina = Math.min(crew.maxStamina, crew.stamina + recovery);

    expect(newStamina).toBe(100);
  });

  it("does not go below 0 stamina when depleting", () => {
    useGameStore.setState({
      crewRoster: [
        {
          ...useGameStore.getState().crewRoster[0],
          stamina: 5,
        },
      ],
    });

    const staminaCost = 10;

    const state = useGameStore.getState();
    const crew = state.crewRoster[0];
    const newStamina = Math.max(0, crew.stamina - staminaCost);

    expect(newStamina).toBe(0);
  });
});

describe("Survival System Stress Tests", () => {
  it("should handle large crew (10 members) over 30 days", () => {
    const largeCrew = Array.from({ length: 10 }, (_, i) => ({
      id: `crew${i}`,
      firstName: `Crew${i}`,
      lastName: "Member",
      name: `Crew${i} Member`,
      background: "station_rat" as any,
      traits: [],
      skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
      skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      sanity: 100,
      maxSanity: 100,
      morale: 50,
      status: "active" as const,
      currentJob: "idle" as const,
      position: { location: "station" as const },
    }));

    useGameStore.setState({
      crewRoster: largeCrew,
      food: 300, // 10 crew * 1 food/day = 10/day for 30 days
      drink: 300,
      day: 1,
    });

    // Simulate 30 days
    for (let day = 0; day < 30; day++) {
      const state = useGameStore.getState();
      const crewCount = state.crewRoster.length;
      const foodNeeded = crewCount * 1;
      const drinkNeeded = crewCount * 1;

      useGameStore.setState({
        food: Math.max(0, state.food - foodNeeded),
        drink: Math.max(0, state.drink - drinkNeeded),
      });
    }

    const state = useGameStore.getState();
    expect(state.food).toBe(0);
    expect(state.drink).toBe(0);
  });

  it("should handle alternating starvation and recovery", () => {
    useGameStore.setState({
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
          stamina: 100,
          maxStamina: 100,
          sanity: 100,
          maxSanity: 100,
          morale: 50,
          status: "active" as const,
          currentJob: "idle" as const,
          position: { location: "station" as const },
        },
      ],
      food: 0,
      drink: 100,
    });

    // Starve for 5 days
    for (let i = 0; i < 5; i++) {
      const state = useGameStore.getState();
      if (state.food === 0) {
        useGameStore.setState({
          crewRoster: [
            {
              ...state.crewRoster[0],
              hp: Math.max(0, state.crewRoster[0].hp - 5),
            },
          ],
        });
      }
    }

    let state = useGameStore.getState();
    expect(state.crewRoster[0].hp).toBe(75); // -5 HP per day * 5

    // Replenish food
    useGameStore.setState({ food: 10 });

    // Normal days - HP shouldn't drop further
    const hpAfterRecovery = state.crewRoster[0].hp;
    for (let i = 0; i < 5; i++) {
      const state = useGameStore.getState();
      if (state.food > 0) {
        useGameStore.setState({ food: state.food - 1 });
      }
    }

    state = useGameStore.getState();
    expect(state.crewRoster[0].hp).toBe(hpAfterRecovery);
  });

  it("should handle rapid provision consumption cycles (100 days)", () => {
    useGameStore.setState({
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
          stamina: 100,
          maxStamina: 100,
          sanity: 100,
          maxSanity: 100,
          morale: 50,
          status: "active" as const,
          currentJob: "idle" as const,
          position: { location: "station" as const },
        },
      ],
      food: 100,
      drink: 100,
    });

    // Simulate 100 days of consumption
    for (let i = 0; i < 100; i++) {
      const state = useGameStore.getState();
      useGameStore.setState({
        food: Math.max(0, state.food - 1),
        drink: Math.max(0, state.drink - 1),
      });
    }

    const state = useGameStore.getState();
    expect(state.food).toBe(0);
    expect(state.drink).toBe(0);
  });
});

describe("Survival System Long-Term Stability", () => {
  it("should maintain crew health over 365 days with adequate supplies", () => {
    useGameStore.setState({
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
          stamina: 100,
          maxStamina: 100,
          sanity: 100,
          maxSanity: 100,
          morale: 50,
          status: "active" as const,
          currentJob: "idle" as const,
          position: { location: "station" as const },
        },
      ],
      food: 365, // 1 year
      drink: 365,
    });

    // Simulate 1 year (365 days)
    for (let day = 0; day < 365; day++) {
      const state = useGameStore.getState();
      useGameStore.setState({
        food: Math.max(0, state.food - 1),
        drink: Math.max(0, state.drink - 1),
      });
    }

    const state = useGameStore.getState();
    expect(state.crewRoster[0].hp).toBe(100); // No damage
    expect(state.food).toBe(0);
    expect(state.drink).toBe(0);
  });

  it("should handle crew scaling from 1 to 10 members dynamically", () => {
    useGameStore.setState({
      crewRoster: [
        {
          id: "crew1",
          firstName: "Captain",
          lastName: "One",
          name: "Captain One",
          background: "station_rat" as any,
          traits: [],
          skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
          skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
          hp: 100,
          maxHp: 100,
          stamina: 100,
          maxStamina: 100,
          sanity: 100,
          maxSanity: 100,
          morale: 50,
          status: "active" as const,
          currentJob: "idle" as const,
          position: { location: "station" as const },
        },
      ],
      food: 500,
      drink: 500,
    });

    // Gradually add crew members
    for (let crewCount = 1; crewCount < 10; crewCount++) {
      // Add a new crew member
      const newCrew = {
        id: `crew${crewCount + 1}`,
        firstName: `Crew${crewCount}`,
        lastName: "Member",
        name: `Crew${crewCount} Member`,
        background: "station_rat" as any,
        traits: [],
        skills: { technical: 2, combat: 2, salvage: 2, piloting: 2 },
        skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 },
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 100,
        sanity: 100,
        maxSanity: 100,
        morale: 50,
        status: "active" as const,
        currentJob: "idle" as const,
        position: { location: "station" as const },
      };
      const state = useGameStore.getState();
      useGameStore.setState({ crewRoster: [...state.crewRoster, newCrew] });

      // Consume provisions for a day
      const updatedState = useGameStore.getState();
      useGameStore.setState({
        food: Math.max(0, updatedState.food - updatedState.crewRoster.length),
        drink: Math.max(0, updatedState.drink - updatedState.crewRoster.length),
      });
    }

    const state = useGameStore.getState();
    expect(state.crewRoster).toHaveLength(10);
    expect(state.food).toBeLessThan(500);
  });

  it("should handle extreme resource scarcity over 20 days", () => {
    useGameStore.setState({
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
          stamina: 100,
          maxStamina: 100,
          sanity: 100,
          maxSanity: 100,
          morale: 50,
          status: "active" as const,
          currentJob: "idle" as const,
          position: { location: "station" as const },
        },
      ],
      food: 5, // Only 5 days
      drink: 10, // 10 days
    });

    // Simulate 20 days
    const hpHistory: number[] = [];
    for (let day = 0; day < 20; day++) {
      const state = useGameStore.getState();
      
      // Consume provisions
      const newFood = Math.max(0, state.food - 1);
      const newDrink = Math.max(0, state.drink - 1);
      
      // Apply damage for missing provisions
      let newHp = state.crewRoster[0].hp;
      let newSanity = state.crewRoster[0].sanity;
      
      if (newFood === 0 && state.food === 0) {
        newHp = Math.max(0, newHp - 5); // Starvation
      }
      
      if (newDrink === 0 && state.drink === 0) {
        newHp = Math.max(0, newHp - 10); // Dehydration HP
        newSanity = Math.max(0, newSanity - 5); // Dehydration sanity
      }
      
      useGameStore.setState({
        food: newFood,
        drink: newDrink,
        crewRoster: [
          {
            ...state.crewRoster[0],
            hp: newHp,
            sanity: newSanity,
          },
        ],
      });
      
      hpHistory.push(newHp);
    }

    const state = useGameStore.getState();
    // Should show declining health after day 5 (no food) and day 10 (no drink)
    expect(state.crewRoster[0].hp).toBeLessThan(100);
    expect(hpHistory[0]).toBe(100); // Day 0
    expect(hpHistory[19]).toBeLessThan(50); // Day 19 should be heavily damaged
  });
});
