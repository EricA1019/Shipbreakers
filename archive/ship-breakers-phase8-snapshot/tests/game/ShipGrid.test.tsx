import { render } from '@testing-library/react';
import ShipGrid from '../../src/components/game/ShipGrid';
import { describe, it, expect } from 'vitest';

const mockShip = { name: 'Test Ship', width: 4 } as any;
const mockLayout = {
  template: 'Test',
  rooms: [ { x:0,y:0,w:2,h:1,kind:'cargo' }, { x:2,y:0,w:2,h:1,kind:'bridge' } ]
};

// Provide a minimal grid to satisfy ShipGrid layout mapping
const mockGrid = [
  [
    { id: 'r00', name: 'R 0,0', hazardLevel: 0, hazardType: 'mechanical', loot: [], looted: false, position: { x: 0, y: 0 }, connections: [] },
    { id: 'r10', name: 'R 1,0', hazardLevel: 0, hazardType: 'mechanical', loot: [], looted: false, position: { x: 1, y: 0 }, connections: [] },
    { id: 'r20', name: 'R 2,0', hazardLevel: 0, hazardType: 'mechanical', loot: [], looted: false, position: { x: 2, y: 0 }, connections: [] },
    { id: 'r30', name: 'R 3,0', hazardLevel: 0, hazardType: 'mechanical', loot: [], looted: false, position: { x: 3, y: 0 }, connections: [] },
  ],
];

describe('ShipGrid layout integration', () => {
  it('renders rooms from layout', () => {
    const { container } = render(<ShipGrid ship={{...mockShip, layout: mockLayout, grid: mockGrid, entryPosition: { x: 0, y: 0 }}} /> as any);
    const roomDivs = container.querySelectorAll('[data-testid="room"]');
    expect(roomDivs.length).toBeGreaterThan(0);
  });
});