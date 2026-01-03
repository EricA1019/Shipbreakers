import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EquipmentShopScreen from '../../src/components/screens/EquipmentShopScreen';
import { useGameStore } from '../../src/stores/gameStore';
import { REACTORS } from '../../src/game/data/reactors';

describe('Equipment Shop (UI)', () => {
  beforeEach(() => {
    // Reset store to a known state
    useGameStore.setState({
      credits: 10000,
      equipmentInventory: [],
      day: 1,
      licenseTier: 'basic',
    });
  });

  it('allows buying a reactor and deducts credits / adds to equipment inventory', async () => {
    render(<EquipmentShopScreen onNavigate={() => {}} />);

    // Switch to Reactors tab
    fireEvent.click(screen.getByText('Reactors'));

    // Find the first reactor buy button
    const buyButtons = await screen.findAllByText(/Buy \d+CR/);
    expect(buyButtons.length).toBeGreaterThan(0);

    const beforeCredits = useGameStore.getState().credits;
    const r = Object.values(REACTORS)[0];

    // Click the reactor buy button for the first reactor (match by price text)
    const targetBtn = buyButtons.find((btn) => btn.textContent?.includes(String(r.value)));
    expect(targetBtn).toBeDefined();

    fireEvent.click(targetBtn!);

    await waitFor(() => {
      const state = useGameStore.getState();
      expect(state.equipmentInventory.find((it: any) => it.id === r.id)).toBeDefined();
      expect(state.credits).toBe(beforeCredits - r.value);
    });
  });
});