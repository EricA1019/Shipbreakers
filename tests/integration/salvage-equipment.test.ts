import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../src/stores/gameStore';
import type { Item, Loot } from '../../src/types';

describe('Salvage equipment pickup', () => {
  beforeEach(() => {
    // reset to minimal state
    useGameStore.setState({
      availableWrecks: [],
      currentRun: null,
      crewRoster: [
        { 
          id: 'c1', 
          name: 'Test', 
          skills: { technical: 5, combat: 5, salvage: 5, piloting: 5 }, 
          skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 }, 
          hp: 100, 
          maxHp: 100, 
          stamina: 100, 
          maxStamina: 100, 
          sanity: 100, 
          maxSanity: 100, 
          status: 'active',
          inventory: []
        }
      ],
      selectedCrewId: 'c1',
      settings: { minCrewHpPercent: 50, minCrewStamina: 20, minCrewSanity: 20 }
    });
  });

  it('adds salvaged item to crew inventory on successful salvage', () => {
    // Create a loot item in the room
    const lootItem: Loot = {
      id: 'loot-1',
      name: 'Salvaged Component',
      category: 'universal',
      value: 100,
      rarity: 'common',
      itemType: 'material',
      manufacturer: 'TestCorp',
      description: 'A test salvage item',
    };

    const wreck = {
      id: 'wr1',
      name: 'Test Wreck',
      distance: 1,
      type: 'industrial' as const,
      tier: 1,
      rooms: [ { id: 'r1', name: 'Room 1', hazardLevel: 0, hazardType: 'mechanical' as const, loot: [lootItem], looted: false } ],
      ship: undefined,
      stripped: false,
    } as any;

    useGameStore.setState({ 
      availableWrecks: [wreck], 
      currentRun: { 
        wreckId: wreck.id, 
        status: 'salvaging', 
        timeRemaining: 10, 
        collectedLoot: [], 
        stats: { roomsAttempted:0, roomsSucceeded:0, roomsFailed:0, damageTaken:0, fuelSpent:0, xpGained: { technical:0, combat:0, salvage:0, piloting:0 } } 
      } as any 
    });

    // Force success by making Math.random => 0
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    // Use the new API: salvageItem(roomId, itemId)
    const result = useGameStore.getState().salvageItem('r1', 'loot-1');
    expect(result.success).toBe(true);

    const s = useGameStore.getState();
    
    // Item should be in crew's inventory (salvageItem puts it there)
    const crew = s.crewRoster.find(c => c.id === 'c1');
    expect(crew?.inventory?.find((it: any) => it.id === lootItem.id)).toBeDefined();

    // room loot should be removed
    const updatedRoom = s.availableWrecks.find((w) => w.id === 'wr1')!.rooms.find((r: any) => r.id === 'r1');
    expect(updatedRoom.loot.find((l: Loot) => l.id === 'loot-1')).toBeUndefined();

    mathSpy.mockRestore();
  });

  it('transfers item from crew inventory to collectedLoot', () => {
    // Create a loot item in the room
    const lootItem: Loot = {
      id: 'loot-1',
      name: 'Salvaged Component',
      category: 'universal',
      value: 100,
      rarity: 'common',
      itemType: 'material',
      manufacturer: 'TestCorp',
      description: 'A test salvage item',
    };

    const wreck = {
      id: 'wr1',
      name: 'Test Wreck',
      distance: 1,
      type: 'industrial' as const,
      tier: 1,
      rooms: [ { id: 'r1', name: 'Room 1', hazardLevel: 0, hazardType: 'mechanical' as const, loot: [lootItem], looted: false } ],
      ship: undefined,
      stripped: false,
    } as any;

    useGameStore.setState({ 
      availableWrecks: [wreck], 
      playerShip: { cargoCapacity: 10, grid: [[]] } as any,
      currentRun: { 
        wreckId: wreck.id, 
        status: 'salvaging', 
        timeRemaining: 10, 
        collectedLoot: [], 
        stats: { roomsAttempted:0, roomsSucceeded:0, roomsFailed:0, damageTaken:0, fuelSpent:0, xpGained: { technical:0, combat:0, salvage:0, piloting:0 } } 
      } as any 
    });

    // Force success by making Math.random => 0
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    // Salvage item first
    useGameStore.getState().salvageItem('r1', 'loot-1');
    
    // Transfer from crew to ship
    const transferred = useGameStore.getState().transferItemToShip('c1', 'loot-1');
    expect(transferred).toBe(true);

    const s = useGameStore.getState();
    
    // Item should now be in collectedLoot
    expect(s.currentRun?.collectedLoot?.find((it: any) => it.id === lootItem.id)).toBeDefined();
    
    // And removed from crew inventory
    const crew = s.crewRoster.find(c => c.id === 'c1');
    expect(crew?.inventory?.find((it: any) => it.id === lootItem.id)).toBeUndefined();

    mathSpy.mockRestore();
  });
});