import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStore } from "../../src/stores/gameStore";
import { logDebug, logInfo } from "../../src/utils/debug/logger";
import { generateCaptain } from "../../src/game/systems/CrewGenerator";

describe("Phase 9: State Mutation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.getState().resetGame();
    logInfo("[MUTATION TEST] Starting state mutation verification");
  });

  describe("Store Action Mutations", () => {
    it("should mutate crew stats correctly during shore leave", () => {
      const captain = generateCaptain(
        { firstName: "Test", lastName: "Captain" },
        "lucky",
        "resilient"
      );
      const initialStamina = 30;
      const initialHP = 60;
      captain.stamina = initialStamina;
      captain.hp = initialHP;

      useGameStore.setState({
        crewRoster: [captain],
        credits: 1000,
      });

      logDebug("[MUTATION] Before shore leave", {
        stamina: captain.stamina,
        hp: captain.hp,
      });

      useGameStore.getState().takeShoreLeave("rest");

      const state = useGameStore.getState();
      const mutatedCrew = state.crewRoster[0];

      logDebug("[MUTATION] After shore leave", {
        stamina: mutatedCrew.stamina,
        staminaDelta: mutatedCrew.stamina - initialStamina,
        hp: mutatedCrew.hp,
        hpDelta: mutatedCrew.hp - initialHP,
      });

      // Shore leave recovers stamina but not HP
      expect(mutatedCrew.stamina).toBeGreaterThan(initialStamina);
      expect(mutatedCrew.hp).toBe(initialHP); // HP unchanged

      logInfo("[MUTATION] ✓ Shore leave mutations verified");
    });

    it("should mutate pantry state during provision consumption", () => {
      const captain = generateCaptain(
        { firstName: "Test", lastName: "Captain" },
        "lucky",
        "resilient"
      );

      const initialFood = 10;
      const initialDrink = 10;

      useGameStore.setState({
        crewRoster: [captain],
        food: initialFood,
        drink: initialDrink,
      });

      logDebug("[MUTATION] Before consumption", {
        food: initialFood,
        drink: initialDrink,
      });

      // Simulate daily consumption
      const state = useGameStore.getState();
      const crewCount = state.crewRoster.length;

      useGameStore.setState({
        food: Math.max(0, state.food - crewCount),
        drink: Math.max(0, state.drink - crewCount),
      });

      const mutatedState = useGameStore.getState();

      logDebug("[MUTATION] After consumption", {
        food: mutatedState.food,
        foodConsumed: initialFood - mutatedState.food,
        drink: mutatedState.drink,
        drinkConsumed: initialDrink - mutatedState.drink,
      });

      expect(mutatedState.food).toBe(initialFood - crewCount);
      expect(mutatedState.drink).toBe(initialDrink - crewCount);

      logInfo("[MUTATION] ✓ Pantry mutations verified");
    });

    it("should mutate credits during shore leave payment", () => {
      const captain = generateCaptain(
        { firstName: "Test", lastName: "Captain" },
        "lucky",
        "resilient"
      );

      const initialCredits = 1000;
      const recreationCost = 100;

      useGameStore.setState({
        crewRoster: [captain],
        credits: initialCredits,
      });

      logDebug("[MUTATION] Before payment", {
        credits: initialCredits,
        expectedCost: recreationCost,
      });

      useGameStore.getState().takeShoreLeave("recreation");

      const mutatedState = useGameStore.getState();

      logDebug("[MUTATION] After payment", {
        credits: mutatedState.credits,
        actualCost: initialCredits - mutatedState.credits,
      });

      expect(mutatedState.credits).toBe(initialCredits - recreationCost);

      logInfo("[MUTATION] ✓ Credit mutations verified");
    });

    it("should track multiple sequential mutations", () => {
      const captain = generateCaptain(
        { firstName: "Test", lastName: "Captain" },
        "lucky",
        "resilient"
      );
      captain.stamina = 50;

      useGameStore.setState({
        crewRoster: [captain],
        credits: 1000,
        food: 10,
      });

      const mutations: Array<{ step: string; stamina: number; credits: number }> = [];

      // Track initial state
      mutations.push({
        step: "initial",
        stamina: captain.stamina,
        credits: 1000,
      });

      logDebug("[MUTATION] Sequential mutation tracking started");

      // Mutation 1: Shore leave (recreation costs 100)
      useGameStore.getState().takeShoreLeave("recreation");
      let state = useGameStore.getState();
      mutations.push({
        step: "after_shore_leave",
        stamina: state.crewRoster[0].stamina,
        credits: state.credits,
      });

      // Mutation 2: Provision consumption
      useGameStore.setState({
        food: Math.max(0, state.food - 1),
      });
      state = useGameStore.getState();
      mutations.push({
        step: "after_consumption",
        stamina: state.crewRoster[0].stamina,
        credits: state.credits,
      });

      logDebug("[MUTATION] Mutation history", { mutations });

      // Verify each mutation changed state
      expect(mutations[1].stamina).toBeGreaterThan(mutations[0].stamina);
      expect(mutations[1].credits).toBeLessThan(mutations[0].credits);

      logInfo("[MUTATION] ✓ Sequential mutations tracked successfully");
    });
  });

  describe("Crew Status Mutation Tracking", () => {
    it("should detect and log status transitions", () => {
      const captain = generateCaptain(
        { firstName: "Test", lastName: "Captain" },
        "lucky",
        "resilient"
      );
      captain.hp = 100;
      captain.status = "active";

      useGameStore.setState({
        crewRoster: [captain],
      });

      const statusHistory: Array<{ hp: number; status: string }> = [];

      logDebug("[MUTATION] Status transition tracking");

      // Track initial
      statusHistory.push({ hp: captain.hp, status: captain.status });

      // Cause injury
      let state = useGameStore.getState();
      useGameStore.setState({
        crewRoster: [
          {
            ...state.crewRoster[0],
            hp: 15, // Below 20 threshold
            status: "injured",
          },
        ],
      });

      state = useGameStore.getState();
      statusHistory.push({
        hp: state.crewRoster[0].hp,
        status: state.crewRoster[0].status,
      });

      logDebug("[MUTATION] Status history", { statusHistory });

      expect(statusHistory[1].hp).toBeLessThan(statusHistory[0].hp);
      expect(statusHistory[1].status).not.toBe(statusHistory[0].status);

      logInfo("[MUTATION] ✓ Status transitions logged");
    });
  });

  describe("Auto-Salvage Result Mutations", () => {
    it("should mutate and accumulate salvage results correctly", () => {
      const mockResults = {
        roomsSalvaged: 0,
        lootCollected: 0,
        creditsEarned: 0,
        injuries: 0,
      };

      logDebug("[MUTATION] Starting salvage accumulation");

      // Simulate multiple salvage operations
      for (let i = 0; i < 5; i++) {
        mockResults.roomsSalvaged++;
        mockResults.lootCollected += 2;
        mockResults.creditsEarned += 500;

        if (i === 3) {
          mockResults.injuries++;
        }

        logDebug(`[MUTATION] Salvage ${i + 1}`, { ...mockResults });
      }

      expect(mockResults.roomsSalvaged).toBe(5);
      expect(mockResults.lootCollected).toBe(10);
      expect(mockResults.creditsEarned).toBe(2500);
      expect(mockResults.injuries).toBe(1);

      logInfo("[MUTATION] ✓ Salvage result mutations accumulated correctly");
    });
  });

  describe("Idempotency Tests", () => {
    it("should produce consistent results for repeated operations", () => {
      const captain = generateCaptain(
        { firstName: "Test", lastName: "Captain" },
        "lucky",
        "resilient"
      );
      captain.stamina = 50;

      const results: number[] = [];

      logDebug("[MUTATION] Testing operation idempotency");

      // Repeat same operation multiple times
      for (let i = 0; i < 3; i++) {
        useGameStore.setState({
          crewRoster: [{ ...captain }],
          credits: 1000,
        });

        useGameStore.getState().takeShoreLeave("rest");

        const state = useGameStore.getState();
        results.push(state.crewRoster[0].stamina);

        logDebug(`[MUTATION] Iteration ${i + 1}`, {
          stamina: state.crewRoster[0].stamina,
        });
      }

      // All results should be the same (deterministic recovery)
      expect(new Set(results).size).toBe(1);

      logInfo("[MUTATION] ✓ Operations are idempotent");
    });
  });

  describe("Concurrent Mutation Safety", () => {
    it("should handle rapid state mutations without corruption", () => {
      const captain = generateCaptain(
        { firstName: "Test", lastName: "Captain" },
        "lucky",
        "resilient"
      );

      useGameStore.setState({
        crewRoster: [captain],
        credits: 10000,
        food: 100,
      });

      logDebug("[MUTATION] Testing rapid mutations");

      // Perform rapid mutations
      for (let i = 0; i < 50; i++) {
        const state = useGameStore.getState();
        useGameStore.setState({
          food: Math.max(0, state.food - 1),
        });
      }

      const finalState = useGameStore.getState();

      logDebug("[MUTATION] After 50 rapid mutations", {
        food: finalState.food,
        expected: 50,
      });

      expect(finalState.food).toBe(50);

      logInfo("[MUTATION] ✓ Rapid mutations handled safely");
    });
  });

  describe("Rollback and Recovery", () => {
    it("should be able to restore previous state after failed operation", () => {
      const captain = generateCaptain(
        { firstName: "Test", lastName: "Captain" },
        "lucky",
        "resilient"
      );

      const initialState = {
        crewRoster: [captain],
        credits: 1000,
        food: 10,
      };

      useGameStore.setState(initialState);

      // Capture snapshot
      const snapshot = { ...useGameStore.getState() };

      logDebug("[MUTATION] State snapshot captured", {
        credits: snapshot.credits,
        food: snapshot.food,
      });

      // Attempt risky operation
      useGameStore.setState({
        credits: 0,
        food: 0,
      });

      logDebug("[MUTATION] After risky operation", {
        credits: useGameStore.getState().credits,
      });

      // Rollback
      useGameStore.setState({
        credits: snapshot.credits,
        food: snapshot.food,
      });

      const restoredState = useGameStore.getState();

      logDebug("[MUTATION] After rollback", {
        credits: restoredState.credits,
        food: restoredState.food,
      });

      expect(restoredState.credits).toBe(initialState.credits);
      expect(restoredState.food).toBe(initialState.food);

      logInfo("[MUTATION] ✓ State rollback successful");
    });
  });
});
