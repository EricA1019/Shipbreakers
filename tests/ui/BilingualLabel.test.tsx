import { render, screen } from '@testing-library/react';
import BilingualLabel from '../../src/components/ui/BilingualLabel';
import { describe, it, expect } from 'vitest';

describe('BilingualLabel', () => {
  it('renders both languages', () => {
    render(<BilingualLabel en="Test" zh="测试" />);
    expect(screen.getByText('Test')).toBeTruthy();
    expect(screen.getByText('测试')).toBeTruthy();
  });
});