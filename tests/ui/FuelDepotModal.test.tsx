import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FuelDepotModal from '../../src/components/ui/FuelDepotModal';
import { useGameStore } from '../../src/stores/gameStore';
import { act } from 'react';

// Mock notifications
vi.mock('../../src/utils/notifications', () => ({
  showSuccessNotification: vi.fn(),
  showWarningNotification: vi.fn(),
}));

describe('FuelDepotModal', () => {
  beforeEach(() => {
    // Reset store
    act(() => {
      useGameStore.setState({
        credits: 1000,
        fuel: 50,
        buyFuel: vi.fn(() => true),
        refillFuel: vi.fn(() => ({ amount: 50, cost: 500 })),
      });
    });
  });

  it('renders without crashing', () => {
    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('FUEL DEPOT')).toBeDefined();
  });

  it('displays current fuel and credits', () => {
    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Current Fuel:/)).toBeDefined();
    expect(screen.getByText(/Credits:/)).toBeDefined();
  });

  it('renders all fuel purchase options', () => {
    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    
    // Should have 4 fuel options
    expect(screen.getByText('+10 fuel')).toBeDefined();
    expect(screen.getByText('+25 fuel')).toBeDefined();
    expect(screen.getByText('+50 fuel')).toBeDefined();
    expect(screen.getByText('+100 fuel')).toBeDefined();
  });

  it('renders Fill Tank button when fuel is not full', () => {
    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    
    const fillButton = screen.getByText(/FILL TANK/);
    expect(fillButton).toBeDefined();
  });

  it('does not render Fill Tank button when fuel is full', () => {
    act(() => {
      useGameStore.setState({ fuel: 100 });
    });

    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.queryByText(/FILL TANK/)).toBeNull();
  });

  it('Fill Tank button is disabled when insufficient credits', () => {
    act(() => {
      useGameStore.setState({
        credits: 100, // Not enough for refill
        fuel: 50,
      });
    });

    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    
    const fillButton = screen.getByText(/FILL TANK/).closest('button');
    expect(fillButton?.disabled).toBe(true);
  });

  it('Fill Tank button is enabled when sufficient credits', () => {
    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    
    const fillButton = screen.getByText(/FILL TANK/).closest('button');
    expect(fillButton?.disabled).toBe(false);
  });

  it('calls refillFuel when Fill Tank button is clicked', () => {
    const mockRefillFuel = vi.fn(() => ({ amount: 50, cost: 500 }));
    act(() => {
      useGameStore.setState({ refillFuel: mockRefillFuel });
    });

    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    
    const fillButton = screen.getByText(/FILL TANK/).closest('button');
    if (fillButton) {
      fireEvent.click(fillButton);
      expect(mockRefillFuel).toHaveBeenCalled();
    }
  });

  it('allows selecting individual fuel options', () => {
    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    
    const option25 = screen.getByText('+25 fuel').closest('button');
    if (option25) {
      fireEvent.click(option25);
      // Verify the button has selected styling (contains amber-500 in className)
      expect(option25.className).toContain('amber-500');
    }
  });

  it('closes modal when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<FuelDepotModal isOpen={true} onClose={onClose} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('maintains proper JSX structure with Fill Tank button before options', () => {
    render(<FuelDepotModal isOpen={true} onClose={() => {}} />);
    
    // Get all buttons in the modal
    const buttons = screen.getAllByRole('button');
    
    // Find Fill Tank button and fuel options
    const fillTankIndex = buttons.findIndex(btn => btn.textContent?.includes('FILL TANK'));
    const firstOptionIndex = buttons.findIndex(btn => btn.textContent?.includes('+10 fuel'));
    
    // Fill Tank button should come before fuel options
    expect(fillTankIndex).toBeLessThan(firstOptionIndex);
  });
});
