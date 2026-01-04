import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGameStore } from "../../src/stores/gameStore";
import { ShipExpansionService } from "../../src/services/ShipExpansionService";
import { calculateCrewCapacity } from "../../src/services/CrewService";
import { initializePlayerShip } from "../../src/game/data/playerShip";
import { ROOM_PURCHASE_OPTIONS } from "../../src/game/data/roomPurchases";
import { MAX_SHIP_GRID_SIZE, STARTING_CREDITS } from "../../src/game/constants";
import type { PlayerShip, Item, GridPosition } from "../../src/types";

describe("Phase 13: Ship Expansion & Unified Inventory", () => {
  beforeEach(() => {
    useGameStore.setState({
      credits: 100000, // Give plenty of credits for testing
      inventory: [],
      crewRoster: [],
      playerShip: initializePlayerShip("test-ship"),
      licenseTier: "premium", // Unlock all rooms
    });
  });

  describe("Ship Expansion Service", () => {
    it("should calculate room costs with scaling", () => {
      const ship = useGameStore.getState().playerShip!;
      const baseCost = ROOM_PURCHASE_OPTIONS.find(o => o.roomType === "cargo")!.baseCost;
      
      // Initial cost (4 rooms exist in starter ship)
      // Scaling is 0.25 per room. 4 rooms * 0.25 = +100% cost? 
      // Let's check the formula: 1 + (count * 0.25)
      // 4 rooms -> 1 + 1 = 2x multiplier
      
      const cost = ShipExpansionService.calculateRoomCost(ship, "cargo");
      const expectedMultiplier = 1 + (ship.rooms.length * 0.25);
      expect(cost).toBe(Math.floor(baseCost * expectedMultiplier));
    });

    it("should validate adjacency correctly", () => {
      const ship = useGameStore.getState().playerShip!;
      
      // Starter ship is L-shaped:
      // [0,0] Bridge, [1,0] Engine
      // [0,1] Medbay
      // [0,2] Cargo
      
      // Valid spot: [1,1] (adjacent to Engine, Medbay, Cargo)
      const validPos: GridPosition = { x: 1, y: 1 };
      const validCheck = ShipExpansionService.validateAdjacency(ship, validPos);
      expect(validCheck).toBe(true);

      // Invalid spot: [3,3] (far away)
      const invalidPos: GridPosition = { x: 3, y: 3 };
      const invalidCheck = ShipExpansionService.validateAdjacency(ship, invalidPos);
      expect(invalidCheck).toBe(false);
    });

    it("should purchase and place a new room", () => {
      const store = useGameStore.getState();
      const ship = store.playerShip!;
      // Starter ship is 2x2 full.
      // (0,0) Bridge, (1,0) Engine
      // (0,1) Medbay, (1,1) Cargo
      
      // Build at (2,0) - adjacent to Engine (1,0)
      const pos: GridPosition = { x: 2, y: 0 };
      
      const result = store.purchaseRoom("quarters", pos);
      
      expect(result.success).toBe(true);
      
      const updatedShip = useGameStore.getState().playerShip!;
      const newRoom = updatedShip.grid[0][2];
      
      expect(newRoom).toBeDefined();
      expect(newRoom?.roomType).toBe("quarters");
      expect(updatedShip.rooms.length).toBe(ship.rooms.length + 1);
      
      // Check connections
      // (2,0) connects to West (1,0)
      expect(newRoom?.connections).toContain("west");
      
      // Check neighbor connections updated
      const engine = updatedShip.grid[0][1]; // y=0, x=1
      expect(engine?.connections).toContain("east");
    });

    it("should expand grid bounds when building outside current bounds", () => {
      const store = useGameStore.getState();
      // Starter ship is 2x3 (w=2, h=3)
      // Build at [2,0] (East of Engine [1,0])
      const pos: GridPosition = { x: 2, y: 0 };
      
      const result = store.purchaseRoom("workshop", pos);
      expect(result.success).toBe(true);
      
      const updatedShip = useGameStore.getState().playerShip!;
      expect(updatedShip.width).toBeGreaterThanOrEqual(3);
      expect(updatedShip.grid[0][2]?.roomType).toBe("workshop");
    });
  });

  describe("Dynamic Capacity", () => {
    it("should increase crew capacity when quarters are built", () => {
      const store = useGameStore.getState();
      const initialCapacity = calculateCrewCapacity(store.playerShip);
      
      // Build Quarters at [2,0]
      store.purchaseRoom("quarters", { x: 2, y: 0 });
      
      const newCapacity = calculateCrewCapacity(useGameStore.getState().playerShip);
      expect(newCapacity).toBe(initialCapacity + 1);
    });

    it("should increase cargo capacity when cargo bay is built", () => {
      const store = useGameStore.getState();
      const initialCargo = store.playerShip!.cargoCapacity;
      
      // Build Cargo at [2,0]
      store.purchaseRoom("cargo", { x: 2, y: 0 });
      
      const updatedShip = useGameStore.getState().playerShip!;
      // Base 4 + 4 per room. Initial has 1 cargo room (8 total?). 
      // Let's check logic: 4 + (cargoRooms * 4).
      // Starter: 1 cargo room -> 4 + 4 = 8.
      // Add 1 -> 2 cargo rooms -> 4 + 8 = 12.
      expect(updatedShip.cargoCapacity).toBe(initialCargo + 4);
    });
  });

  describe("Unified Inventory", () => {
    it("should handle buying items into unified inventory", () => {
      const store = useGameStore.getState();
      const item: Item = {
        id: "test-item",
        name: "Test Item",
        value: 100,
        rarity: "common",
        itemType: "equipment",
        manufacturer: "Test",
        description: "Test",
        slotType: "cargo"
      };
      
      // Manually simulate buy (since buy logic is in component, but we can test store update)
      useGameStore.setState(state => ({
        inventory: [...state.inventory, item],
        credits: state.credits - item.value
      }));
      
      const updated = useGameStore.getState();
      expect(updated.inventory).toContainEqual(item);
      expect(updated.credits).toBe(99900);
    });

    it("should allow equipping from unified inventory", () => {
      const store = useGameStore.getState();
      const ship = store.playerShip!;
      
      // Find a cargo slot
      const cargoRoom = ship.rooms.find(r => r.roomType === "cargo")!;
      const slot = cargoRoom.slots[0];
      
      const item: Item = {
        id: "cargo-pod",
        name: "Cargo Pod",
        value: 100,
        rarity: "common",
        itemType: "equipment",
        manufacturer: "Test",
        description: "Test",
        slotType: "cargo"
      };
      
      // Add to inventory
      useGameStore.setState({ inventory: [item] });
      
      // Install
      const success = store.installItemOnShip(cargoRoom.id, slot.id, item.id);
      expect(success).toBe(true);
      
      const updatedStore = useGameStore.getState();
      const updatedShip = updatedStore.playerShip!;
      const updatedRoom = updatedShip.rooms.find(r => r.id === cargoRoom.id)!;
      
      expect(updatedRoom.slots[0].installedItem?.id).toBe(item.id);
      expect(updatedStore.inventory).not.toContainEqual(item);
    });

    it("should handle selling items from unified inventory", () => {
      const store = useGameStore.getState();
      const item: Item = {
        id: "sell-item",
        name: "Sell Item",
        value: 200,
        rarity: "common",
        itemType: "equipment",
        manufacturer: "Test",
        description: "Test",
        slotType: "cargo"
      };
      
      useGameStore.setState(state => ({
        inventory: [item],
        credits: 1000
      }));
      
      // Simulate sell
      useGameStore.setState(state => ({
        inventory: state.inventory.filter(i => i.id !== item.id),
        credits: state.credits + item.value
      }));
      
      const updated = useGameStore.getState();
      expect(updated.inventory).toHaveLength(0);
      expect(updated.credits).toBe(1200);
    });
  });

  describe("Room Selling", () => {
    it("should allow selling a room and refund credits", () => {
      const store = useGameStore.getState();
      const ship = store.playerShip!;
      
      // We need a room that is safe to sell (not bridge/engine/reactor usually, but here we can sell anything that isn't critical path if logic allows)
      // Or we can build one then sell it.
      
      // Build a room first
      store.purchaseRoom("quarters", { x: 2, y: 0 });
      const shipWithRoom = useGameStore.getState().playerShip!;
      const roomToSell = shipWithRoom.grid[0][2]!;
      const creditsBeforeSell = useGameStore.getState().credits;
      
      // Sell it
      const result = store.sellRoom(roomToSell.id);
      expect(result.success).toBe(true);
      
      const finalShip = useGameStore.getState().playerShip!;
      expect(finalShip.grid[0][2]).toBeUndefined();
      expect(useGameStore.getState().credits).toBeGreaterThan(creditsBeforeSell);
    });

    it("should prevent selling the last bridge", () => {
      const store = useGameStore.getState();
      const ship = store.playerShip!;
      const bridge = ship.rooms.find(r => r.roomType === "bridge")!;
      
      const result = store.sellRoom(bridge.id);
      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/bridge/i);
    });

    it("should decrease cargo capacity when cargo bay is sold", () => {
      const store = useGameStore.getState();
      
      // Build a cargo bay first at [2,0]
      store.purchaseRoom("cargo", { x: 2, y: 0 });
      const capacityAfterBuild = useGameStore.getState().playerShip!.cargoCapacity;
      
      const ship = useGameStore.getState().playerShip!;
      const newRoom = ship.grid[0][2]!;
      
      // Sell it
      store.sellRoom(newRoom.id);
      
      const finalCapacity = useGameStore.getState().playerShip!.cargoCapacity;
      expect(finalCapacity).toBeLessThan(capacityAfterBuild);
      // Should return to base capacity (starter ship has 1 cargo room -> 8 capacity)
      // After build: 2 cargo rooms -> 12 capacity
      // After sell: 1 cargo room -> 8 capacity
      expect(finalCapacity).toBe(8);
    });
  });
});
