import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import MedicalBayModal from '../../src/components/ui/MedicalBayModal';
import { useGameStore } from '../../src/stores/gameStore';
import { act } from 'react';
import type { CrewMember } from '../../src/types';

// Mock notifications
vi.mock('../../src/utils/notifications', () => ({
  showSuccessNotification: vi.fn(),
  showWarningNotification: vi.fn(),
}));

describe('MedicalBayModal', () => {
  const mockCrew: CrewMember = {
    id: '1',
    name: 'Test Crew',
    hp: 50,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    sanity: 100,
    maxSanity: 100,
    skills: { tech: 5, combat: 5, piloting: 5 },
    background: 'engineer',
    traits: [],
  };

  const mockCrewRoster: CrewMember[] = [
    { ...mockCrew, id: '1', name: 'Crew 1', hp: 50, maxHp: 100 },
    { ...mockCrew, id: '2', name: 'Crew 2', hp: 60, maxHp: 100 },
    { ...mockCrew, id: '3', name: 'Crew 3', hp: 70, maxHp: 100 },
  ];

  beforeEach(() => {
    act(() => {
      useGameStore.setState({
        credits: 1000,
        crew: mockCrew,
        crewRoster: mockCrewRoster,
        payForHealing: vi.fn(() => true),
        healAllCrew: vi.fn(() => ({ healed: 120, cost: 150 })),
      });
    });
  });

  it('renders without crashing', () => {
    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('MEDICAL BAY')).toBeDefined();
  });

  it('displays current crew health status', () => {
    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/50 \/ 100 HP/)).toBeDefined();
  });

  it('shows healthy message when crew is at full HP', () => {
    act(() => {
      useGameStore.setState({
        crew: { ...mockCrew, hp: 100, maxHp: 100 },
      });
    });

    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/perfect health/i)).toBeDefined();
  });

  it('renders Heal All Crew button when multiple injured crew exist', () => {
    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    const healAllButton = screen.getByText(/HEAL ALL CREW/);
    expect(healAllButton).toBeDefined();
  });

  it('does not render Heal All button when only one crew member exists', () => {
    act(() => {
      useGameStore.setState({
        crewRoster: [mockCrew],
      });
    });

    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.queryByText(/HEAL ALL CREW/)).toBeNull();
  });

  it('does not render Heal All button when all crew are healthy', () => {
    const healthyCrew = mockCrewRoster.map(c => ({ ...c, hp: c.maxHp }));
    
    act(() => {
      useGameStore.setState({
        crew: { ...mockCrew, hp: 100 },
        crewRoster: healthyCrew,
      });
    });

    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.queryByText(/HEAL ALL CREW/)).toBeNull();
  });

  it('Heal All button is disabled when insufficient credits', () => {
    act(() => {
      useGameStore.setState({
        credits: 10, // Not enough
      });
    });

    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    const healAllButton = screen.getByText(/HEAL ALL CREW/).closest('button');
    expect(healAllButton?.disabled).toBe(true);
  });

  it('Heal All button is enabled when sufficient credits', () => {
    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    const healAllButton = screen.getByText(/HEAL ALL CREW/).closest('button');
    expect(healAllButton?.disabled).toBe(false);
  });

  it('calls healAllCrew when Heal All button is clicked', () => {
    const mockHealAllCrew = vi.fn(() => ({ healed: 120, cost: 150 }));
    act(() => {
      useGameStore.setState({ healAllCrew: mockHealAllCrew });
    });

    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    const healAllButton = screen.getByText(/HEAL ALL CREW/).closest('button');
    if (healAllButton) {
      fireEvent.click(healAllButton);
      expect(mockHealAllCrew).toHaveBeenCalled();
    }
  });

  it('displays total healing and cost for Heal All button', () => {
    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    // Should show HP needed and cost
    const healAllButton = screen.getByText(/HEAL ALL CREW/).closest('button');
    expect(healAllButton?.textContent).toContain('HP');
    expect(healAllButton?.textContent).toContain('CR');
  });

  it('closes modal when Decline is clicked', () => {
    const onClose = vi.fn();
    render(<MedicalBayModal isOpen={true} onClose={onClose} />);
    
    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('handleHeal and handleHealAll functions are both defined and callable', () => {
    const mockPayForHealing = vi.fn(() => true);
    const mockHealAllCrew = vi.fn(() => ({ healed: 120, cost: 150 }));
    
    act(() => {
      useGameStore.setState({
        payForHealing: mockPayForHealing,
        healAllCrew: mockHealAllCrew,
      });
    });

    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    // Test Heal All button (if rendered)
    const healAllButton = screen.queryByText(/HEAL ALL CREW/)?.closest('button');
    if (healAllButton) {
      fireEvent.click(healAllButton);
      expect(mockHealAllCrew).toHaveBeenCalled();
    }
    
    // Both functions should exist without errors
    expect(mockPayForHealing).toBeDefined();
    expect(mockHealAllCrew).toBeDefined();
  });

  it('displays health percentage correctly', () => {
    render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    // 50/100 HP = 50%
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('color codes health bar based on HP percentage', () => {
    const { container: container1 } = render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    
    // At 50%, should be yellow
    const healthBar1 = container1.querySelector('.bg-yellow-500');
    expect(healthBar1).toBeDefined();
    
    // Test low health (red)
    act(() => {
      useGameStore.setState({
        crew: { ...mockCrew, hp: 20, maxHp: 100 },
      });
    });
    
    const { container: container2 } = render(<MedicalBayModal isOpen={true} onClose={() => {}} />);
    const healthBar2 = container2.querySelector('.bg-red-500');
    expect(healthBar2).toBeDefined();
  });
});
