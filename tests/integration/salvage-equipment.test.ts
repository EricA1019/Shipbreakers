import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../src/stores/gameStore';
import type { Item } from '../../src/types';

describe('Salvage equipment pickup', () => {
  beforeEach(() => {
    // reset to minimal state
    useGameStore.setState({
      availableWrecks: [],
      currentRun: null,
      crewRoster: [
        { id: 'c1', name: 'Test', skills: { technical: 5, combat: 5, salvage: 5, piloting: 5 }, skillXp: { technical: 0, combat: 0, salvage: 0, piloting: 0 }, hp: 100, maxHp: 100 }
      ],
      selectedCrewId: 'c1'
    });
  });

  it('adds equipment from room to currentRun.collectedEquipment on successful salvage', () => {
    const item: Item = {
      id: 'equip-1',
      name: 'Salvaged Module',
      description: 'Test equipment',
      slotType: 'engineering',
      tier: 1,
      rarity: 'uncommon',
      powerDraw: 0,
      effects: [],
      value: 250,
    };

    const wreck = {
      id: 'wr1',
      name: 'Test Wreck',
      distance: 1,
      type: 'industrial' as const,
      tier: 1,
      rooms: [ { id: 'r1', name: 'Room 1', hazardLevel: 0, hazardType: 'mechanical' as const, loot: [], looted: false, equipment: item } ],
      ship: undefined,
      stripped: false,
    } as any;

    useGameStore.setState({ availableWrecks: [wreck], currentRun: { wreckId: wreck.id, timeRemaining: 10, collectedLoot: [], collectedEquipment: [], stats: { roomsAttempted:0, roomsSucceeded:0, roomsFailed:0, damageTaken:0, fuelSpent:0, xpGained: { technical:0, combat:0, salvage:0, piloting:0 } } } as any });

    // Force success by making Math.random => 0
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = useGameStore.getState().salvageRoom('r1');
    expect(result.success).toBe(true);

    const s = useGameStore.getState();
    expect(s.currentRun?.collectedEquipment?.find((it: any) => it.id === item.id)).toBeDefined();

    // room equipment should be cleared
    const updatedRoom = s.availableWrecks.find((w) => w.id === 'wr1')!.rooms.find((r: any) => r.id === 'r1');
    expect(updatedRoom.equipment).toBeNull();

    mathSpy.mockRestore();
  });
});