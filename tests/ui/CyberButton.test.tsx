import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CyberButton from '../../src/components/ui/CyberButton';
import { describe, it, expect } from 'vitest';

describe('CyberButton', () => {
  it('renders with glow class and disabled state', async () => {
    render(<CyberButton glowColor="amber">Click</CyberButton>);
    const btn = screen.getByText('Click');
    expect(btn).toBeTruthy();
    // Should include text-glow-amber class
    expect(btn.closest('button')?.className).toContain('text-glow-amber');
  });

  it('shows offline when disabled', () => {
    render(<CyberButton disabled>Do</CyberButton>);
    expect(screen.getByText('[OFFLINE]')).toBeTruthy();
  });
});