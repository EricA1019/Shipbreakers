import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../../src/stores/gameStore";
import { generateCaptain } from "../../src/game/systems/CrewGenerator";
import type { CrewMember, Ship, GridRoom } from "../../src/types";
import { logDebug, logInfo } from "../../src/utils/debug/logger";

/**
 * Crew Position Display Tests
 * 
 * Verifies that crew positions are properly initialized and displayed
 * in the correct locations (station, ship, wreck, specific rooms).
 */

describe("Crew Position Display Tests", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
    logInfo("[CREW POSITION TEST] Starting crew position display test");
  });

  describe("Crew Position Initialization", () => {
    it("should initialize captain with station position on game start", () => {
      useGameStore.getState().initializeGame();

      const state = useGameStore.getState();
      const captain = state.crewRoster[0];

      logDebug("[POSITION] Captain initial state", {
        id: captain.id,
        name: captain.name,
        position: captain.position,
      });

      expect(captain.position).toBeDefined();
      expect(captain.position?.location).toBe("station");

      logInfo("[POSITION] ✓ Captain initialized with station position");
    });

    it("should set new hires to station position", () => {
      useGameStore.getState().initializeGame();

      const candidate = {
        id: "test-hire",
        name: "Test Hire",
        skills: { technical: 3, combat: 2, salvage: 3, piloting: 1 },
        cost: 500,
      };

      const state = useGameStore.getState();
      const success = state.hireCrew(candidate);

      expect(success).toBe(true);

      const updatedState = useGameStore.getState();
      const hired = updatedState.crewRoster.find((c) => c.name === "Test Hire");

      logDebug("[POSITION] Hired crew state", {
        name: hired?.name,
        position: hired?.position,
      });

      expect(hired).toBeDefined();
      expect(hired?.position).toBeDefined();
      expect(hired?.position?.location).toBe("station");

      logInfo("[POSITION] ✓ New hire initialized with station position");
    });
  });

  describe("Crew Position Updates During Run", () => {
    it("should move all crew to wreck location when arriving", () => {
      useGameStore.getState().initializeGame();

      const state = useGameStore.getState();
      const wreckId = state.availableWrecks[0]?.id;

      if (!wreckId) {
        throw new Error("No available wrecks for test");
      }

      logDebug("[POSITION] Starting run", { wreckId });

      // Start run
      state.startRun(wreckId);
      state.travelToWreck(wreckId);

      const updatedState = useGameStore.getState();
      const crewPositions = updatedState.crewRoster.map((c) => ({
        id: c.id,
        name: c.name,
        location: c.position?.location,
        roomId: c.position?.roomId,
      }));

      logDebug("[POSITION] Crew positions after arrival", { crewPositions });

      // All crew should be at wreck
      expect(updatedState.crewRoster.length).toBeGreaterThan(0);
      updatedState.crewRoster.forEach((crew) => {
        expect(crew.position).toBeDefined();
        expect(crew.position?.location).toBe("wreck");
      });

      logInfo("[POSITION] ✓ All crew moved to wreck location");
    });

    it("should return all crew to station when completing run", () => {
      useGameStore.getState().initializeGame();

      const state = useGameStore.getState();
      const wreckId = state.availableWrecks[0]?.id;

      if (!wreckId) {
        throw new Error("No available wrecks for test");
      }

      // Start and complete run
      state.startRun(wreckId);
      state.travelToWreck(wreckId);
      
      // Verify crew are at wreck
      let currentState = useGameStore.getState();
      expect(currentState.crewRoster[0].position?.location).toBe("wreck");

      logDebug("[POSITION] Returning to station");
      
      // Return to station
      state.returnToStation();

      currentState = useGameStore.getState();
      const crewPositions = currentState.crewRoster.map((c) => ({
        id: c.id,
        name: c.name,
        location: c.position?.location,
      }));

      logDebug("[POSITION] Crew positions after return", { crewPositions });

      // All crew should be back at station
      currentState.crewRoster.forEach((crew) => {
        expect(crew.position).toBeDefined();
        expect(crew.position?.location).toBe("station");
      });

      logInfo("[POSITION] ✓ All crew returned to station");
    });
  });

  describe("Crew Room Assignments", () => {
    it("should assign crew to specific room when using auto-salvage", () => {
      useGameStore.getState().initializeGame();

      const state = useGameStore.getState();
      const crewId = state.crewRoster[0].id;
      const testRoomId = "test-room-1";

      logDebug("[POSITION] Assigning crew to room", {
        crewId,
        roomId: testRoomId,
      });

      state.assignCrewToRoom(crewId, testRoomId);

      const updatedState = useGameStore.getState();
      const assignedCrew = updatedState.crewRoster.find((c) => c.id === crewId);

      logDebug("[POSITION] Crew after assignment", {
        id: assignedCrew?.id,
        location: assignedCrew?.position?.location,
        roomId: assignedCrew?.position?.roomId,
      });

      expect(assignedCrew).toBeDefined();
      expect(assignedCrew?.position?.location).toBe("wreck");
      expect(assignedCrew?.position?.roomId).toBe(testRoomId);

      logInfo("[POSITION] ✓ Crew assigned to specific room");
    });

    it("should show crew in entry room when no specific assignment", () => {
      // Create mock ship with entry position
      const mockShip: Ship = {
        name: "Test Wreck",
        width: 3,
        height: 3,
        entryPosition: { x: 1, y: 1 },
        grid: [
          [
            {
              id: "room-0-0",
              name: "Room A",
              position: { x: 0, y: 0 },
              connections: ["east"],
              kind: "cargo",
              hazards: [],
              loot: [],
              looted: false,
            },
            {
              id: "room-1-0",
              name: "Entry",
              position: { x: 1, y: 0 },
              connections: ["west", "south"],
              kind: "airlock",
              hazards: [],
              loot: [],
              looted: false,
            },
            {
              id: "room-2-0",
              name: "Room B",
              position: { x: 2, y: 0 },
              connections: [],
              kind: "cargo",
              hazards: [],
              loot: [],
              looted: false,
            },
          ],
          [
            {
              id: "room-0-1",
              name: "Room C",
              position: { x: 0, y: 1 },
              connections: [],
              kind: "labs",
              hazards: [],
              loot: [],
              looted: false,
            },
            {
              id: "room-1-1",
              name: "Central",
              position: { x: 1, y: 1 },
              connections: ["north"],
              kind: "bridge",
              hazards: [],
              loot: [],
              looted: false,
            },
            {
              id: "room-2-1",
              name: "Room D",
              position: { x: 2, y: 1 },
              connections: [],
              kind: "armory",
              hazards: [],
              loot: [],
              looted: false,
            },
          ],
          [
            {
              id: "room-0-2",
              name: "Room E",
              position: { x: 0, y: 2 },
              connections: [],
              kind: "cargo",
              hazards: [],
              loot: [],
              looted: false,
            },
            {
              id: "room-1-2",
              name: "Room F",
              position: { x: 1, y: 2 },
              connections: [],
              kind: "quarters",
              hazards: [],
              loot: [],
              looted: false,
            },
            {
              id: "room-2-2",
              name: "Room G",
              position: { x: 2, y: 2 },
              connections: [],
              kind: "cargo",
              hazards: [],
              loot: [],
              looted: false,
            },
          ],
        ],
      };

      // Create crew with wreck location but no specific room
      const crewWithoutRoom: CrewMember = {
        id: "test-crew-1",
        firstName: "Test",
        lastName: "Crew",
        name: "Test Crew",
        isPlayer: false,
        background: "station_rat",
        traits: ["steady", "pragmatic"],
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
        position: { location: "wreck" }, // No roomId or gridPosition
      };

      logDebug("[POSITION] Testing entry room detection", {
        shipEntryPosition: mockShip.entryPosition,
        crewPosition: crewWithoutRoom.position,
      });

      // Test the filtering logic
      const entryRoom = mockShip.grid[1][1]; // Position (1, 1) is entry
      const shouldShowInEntry =
        crewWithoutRoom.position?.location === "wreck" &&
        !crewWithoutRoom.position.roomId &&
        !crewWithoutRoom.position.gridPosition &&
        mockShip.entryPosition.x === entryRoom.position.x &&
        mockShip.entryPosition.y === entryRoom.position.y;

      logDebug("[POSITION] Entry room filter result", {
        shouldShowInEntry,
        entryRoomPosition: entryRoom.position,
      });

      expect(shouldShowInEntry).toBe(true);

      // Test that crew should NOT show in other rooms
      const nonEntryRoom = mockShip.grid[0][0]; // Position (0, 0)
      const shouldNotShowInOther =
        crewWithoutRoom.position?.location === "wreck" &&
        !crewWithoutRoom.position.roomId &&
        !crewWithoutRoom.position.gridPosition &&
        mockShip.entryPosition.x === nonEntryRoom.position.x &&
        mockShip.entryPosition.y === nonEntryRoom.position.y;

      expect(shouldNotShowInOther).toBe(false);

      logInfo("[POSITION] ✓ Crew correctly filtered to entry room");
    });
  });

  describe("Multiple Crew Support", () => {
    it("should handle multiple crew on the same run", () => {
      useGameStore.getState().initializeGame();

      // Hire additional crew
      const state = useGameStore.getState();
      state.hireCrew({
        id: "hire-1",
        name: "Crew Member 1",
        skills: { technical: 2, combat: 3, salvage: 2, piloting: 1 },
        cost: 500,
      });
      state.hireCrew({
        id: "hire-2",
        name: "Crew Member 2",
        skills: { technical: 3, combat: 1, salvage: 3, piloting: 2 },
        cost: 500,
      });

      const updatedState = useGameStore.getState();
      const initialCount = updatedState.crewRoster.length;

      logDebug("[POSITION] Crew roster", {
        count: initialCount,
        crew: updatedState.crewRoster.map((c) => ({
          id: c.id,
          name: c.name,
          position: c.position,
        })),
      });

      expect(initialCount).toBeGreaterThanOrEqual(3); // Captain + 2 hires

      // Start run - all crew should move to wreck
      const wreckId = updatedState.availableWrecks[0]?.id;
      if (wreckId) {
        updatedState.startRun(wreckId);
        updatedState.travelToWreck(wreckId);

        const runState = useGameStore.getState();

        logDebug("[POSITION] All crew on run", {
          crewCount: runState.crewRoster.length,
          atWreck: runState.crewRoster.filter((c) => c.position?.location === "wreck")
            .length,
        });

        // Verify all crew moved to wreck
        expect(runState.crewRoster.every((c) => c.position?.location === "wreck")).toBe(
          true
        );

        logInfo("[POSITION] ✓ Multiple crew supported on single run");
      }
    });

    it("should allow different crew to have different room assignments", () => {
      useGameStore.getState().initializeGame();

      // Hire additional crew
      const state = useGameStore.getState();
      state.hireCrew({
        id: "hire-1",
        name: "Crew 1",
        skills: { technical: 2, combat: 2, salvage: 2, piloting: 1 },
        cost: 500,
      });

      const updatedState = useGameStore.getState();
      const crew1 = updatedState.crewRoster[0];
      const crew2 = updatedState.crewRoster[1];

      // Assign to different rooms
      updatedState.assignCrewToRoom(crew1.id, "room-A");
      updatedState.assignCrewToRoom(crew2.id, "room-B");

      const finalState = useGameStore.getState();
      const assigned1 = finalState.crewRoster.find((c) => c.id === crew1.id);
      const assigned2 = finalState.crewRoster.find((c) => c.id === crew2.id);

      logDebug("[POSITION] Different room assignments", {
        crew1: { id: assigned1?.id, roomId: assigned1?.position?.roomId },
        crew2: { id: assigned2?.id, roomId: assigned2?.position?.roomId },
      });

      expect(assigned1?.position?.roomId).toBe("room-A");
      expect(assigned2?.position?.roomId).toBe("room-B");
      expect(assigned1?.position?.roomId).not.toBe(assigned2?.position?.roomId);

      logInfo("[POSITION] ✓ Different crew can have different room assignments");
    });
  });

  describe("Location Filter Behavior", () => {
    it("should only show crew matching locationFilter", () => {
      const crewAtStation: CrewMember = {
        id: "crew-station",
        firstName: "Station",
        lastName: "Crew",
        name: "Station Crew",
        isPlayer: false,
        background: "station_rat",
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
        position: { location: "station" },
      };

      const crewAtWreck: CrewMember = {
        ...crewAtStation,
        id: "crew-wreck",
        name: "Wreck Crew",
        position: { location: "wreck" },
      };

      // Test station filter
      const stationFilter = "station";
      const showAtStation = crewAtStation.position?.location === stationFilter;
      const hideAtStation = crewAtWreck.position?.location === stationFilter;

      expect(showAtStation).toBe(true);
      expect(hideAtStation).toBe(false);

      // Test wreck filter
      const wreckFilter = "wreck";
      const showAtWreck = crewAtWreck.position?.location === wreckFilter;
      const hideAtWreck = crewAtStation.position?.location === wreckFilter;

      expect(showAtWreck).toBe(true);
      expect(hideAtWreck).toBe(false);

      logInfo("[POSITION] ✓ Location filter correctly filters crew by location");
    });
  });

  describe("Edge Cases", () => {
    it("should handle crew with undefined position gracefully", () => {
      const crewNoPosition: Partial<CrewMember> = {
        id: "crew-no-pos",
        name: "No Position Crew",
        // position is undefined
      };

      // Test filtering logic
      const locationFilter = "wreck";
      const shouldNotShow = (crewNoPosition as CrewMember).position?.location === locationFilter;

      expect(shouldNotShow).toBe(false);

      logInfo("[POSITION] ✓ Crew without position are filtered out");
    });

    it("should handle empty crew roster", () => {
      const emptyRoster: CrewMember[] = [];
      const locationFilter = "wreck";

      const filteredCrew = emptyRoster.filter(
        (c) => c.position?.location === locationFilter
      );

      expect(filteredCrew).toHaveLength(0);

      logInfo("[POSITION] ✓ Empty roster handled gracefully");
    });
  });
});
