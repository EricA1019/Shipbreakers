import React from 'react';
import { render, screen } from '@testing-library/react';
import Toasts from '../../src/components/ui/Toast';
import { useUiStore } from '../../src/stores/uiStore';
import { act } from 'react-dom/test-utils';

describe('Toasts UI', () => {
  it('renders added toasts and allows dismissal', () => {
    const add = useUiStore.getState().addToast;
    const remove = useUiStore.getState().removeToast;

    act(() => {
      add({ message: 'Test toast', type: 'success', duration: 10000 });
    });

    render(<Toasts />);

    expect(screen.getByText('Test toast')).toBeDefined();

    // Dismiss programmatically
    act(() => {
      const t = useUiStore.getState().toasts[0];
      if (t) remove(t.id);
    });

    expect(screen.queryByText('Test toast')).toBeNull();
  });
});