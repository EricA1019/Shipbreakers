import { describe, it, expect } from 'vitest';
import { initializePlayerShip } from '../../src/game/data/playerShip';
import { hasShipLayout } from '../../src/types';
import React from 'react';
import { render } from '@testing-library/react';
import ShipGrid from '../../src/components/game/ShipGrid';

describe('Player ship layout', () => {
  it('player ship has L-shaped layout attached', () => {
    const ship = initializePlayerShip('player-ship');
    expect(hasShipLayout(ship)).toBe(true);
    expect(ship.layout?.template).toBe('l-shaped-starter');
    expect(ship.layout?.rooms.length).toBeGreaterThanOrEqual(4);
  });

  it('ShipGrid renders rooms for player ship layout', () => {
    const ship = initializePlayerShip('player-ship');
    const { container } = render(React.createElement(ShipGrid, { ship: ship }));
    const rooms = container.querySelectorAll('[data-testid="room"]');
    expect(rooms.length).toBeGreaterThanOrEqual(4);
  });
});
