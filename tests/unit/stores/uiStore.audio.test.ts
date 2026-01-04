import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '../../../src/stores/uiStore';
import { act } from 'react';

describe('UiStore - Audio Settings', () => {
  beforeEach(() => {
    // Reset to defaults
    act(() => {
      useUiStore.setState({
        soundEnabled: true,
        soundVolume: 0.7,
        musicEnabled: true,
        musicVolume: 0.5,
      });
    });
  });

  describe('Sound Settings', () => {
    it('has soundEnabled property', () => {
      const state = useUiStore.getState();
      expect(state.soundEnabled).toBeDefined();
      expect(typeof state.soundEnabled).toBe('boolean');
    });

    it('has soundVolume property', () => {
      const state = useUiStore.getState();
      expect(state.soundVolume).toBeDefined();
      expect(typeof state.soundVolume).toBe('number');
    });

    it('has setSoundEnabled method', () => {
      const state = useUiStore.getState();
      expect(typeof state.setSoundEnabled).toBe('function');
    });

    it('has setSoundVolume method', () => {
      const state = useUiStore.getState();
      expect(typeof state.setSoundVolume).toBe('function');
    });

    it('setSoundEnabled updates soundEnabled state', () => {
      act(() => {
        useUiStore.getState().setSoundEnabled(false);
      });
      
      expect(useUiStore.getState().soundEnabled).toBe(false);
      
      act(() => {
        useUiStore.getState().setSoundEnabled(true);
      });
      
      expect(useUiStore.getState().soundEnabled).toBe(true);
    });

    it('setSoundVolume updates soundVolume state', () => {
      act(() => {
        useUiStore.getState().setSoundVolume(0.3);
      });
      
      expect(useUiStore.getState().soundVolume).toBe(0.3);
      
      act(() => {
        useUiStore.getState().setSoundVolume(0.9);
      });
      
      expect(useUiStore.getState().soundVolume).toBe(0.9);
    });

    it('setSoundVolume clamps to 0-1 range', () => {
      act(() => {
        useUiStore.getState().setSoundVolume(-0.5);
      });
      expect(useUiStore.getState().soundVolume).toBe(0);
      
      act(() => {
        useUiStore.getState().setSoundVolume(1.5);
      });
      expect(useUiStore.getState().soundVolume).toBe(1);
    });

    it('soundVolume defaults to valid range', () => {
      const volume = useUiStore.getState().soundVolume;
      expect(volume).toBeGreaterThanOrEqual(0);
      expect(volume).toBeLessThanOrEqual(1);
    });
  });

  describe('Music Settings', () => {
    it('has musicEnabled property', () => {
      const state = useUiStore.getState();
      expect(state.musicEnabled).toBeDefined();
      expect(typeof state.musicEnabled).toBe('boolean');
    });

    it('has musicVolume property', () => {
      const state = useUiStore.getState();
      expect(state.musicVolume).toBeDefined();
      expect(typeof state.musicVolume).toBe('number');
    });

    it('has setMusicEnabled method', () => {
      const state = useUiStore.getState();
      expect(typeof state.setMusicEnabled).toBe('function');
    });

    it('has setMusicVolume method', () => {
      const state = useUiStore.getState();
      expect(typeof state.setMusicVolume).toBe('function');
    });

    it('setMusicEnabled updates musicEnabled state', () => {
      act(() => {
        useUiStore.getState().setMusicEnabled(false);
      });
      
      expect(useUiStore.getState().musicEnabled).toBe(false);
      
      act(() => {
        useUiStore.getState().setMusicEnabled(true);
      });
      
      expect(useUiStore.getState().musicEnabled).toBe(true);
    });

    it('setMusicVolume updates musicVolume state', () => {
      act(() => {
        useUiStore.getState().setMusicVolume(0.2);
      });
      
      expect(useUiStore.getState().musicVolume).toBe(0.2);
      
      act(() => {
        useUiStore.getState().setMusicVolume(0.8);
      });
      
      expect(useUiStore.getState().musicVolume).toBe(0.8);
    });

    it('setMusicVolume clamps to 0-1 range', () => {
      act(() => {
        useUiStore.getState().setMusicVolume(-1);
      });
      expect(useUiStore.getState().musicVolume).toBe(0);
      
      act(() => {
        useUiStore.getState().setMusicVolume(2);
      });
      expect(useUiStore.getState().musicVolume).toBe(1);
    });

    it('musicVolume defaults to valid range', () => {
      const volume = useUiStore.getState().musicVolume;
      expect(volume).toBeGreaterThanOrEqual(0);
      expect(volume).toBeLessThanOrEqual(1);
    });
  });

  describe('State Independence', () => {
    it('sound and music settings are independent', () => {
      act(() => {
        useUiStore.getState().setSoundEnabled(false);
        useUiStore.getState().setMusicEnabled(true);
      });
      
      expect(useUiStore.getState().soundEnabled).toBe(false);
      expect(useUiStore.getState().musicEnabled).toBe(true);
    });

    it('sound and music volumes are independent', () => {
      act(() => {
        useUiStore.getState().setSoundVolume(0.3);
        useUiStore.getState().setMusicVolume(0.8);
      });
      
      expect(useUiStore.getState().soundVolume).toBe(0.3);
      expect(useUiStore.getState().musicVolume).toBe(0.8);
    });

    it('changing sound settings does not affect music settings', () => {
      const initialMusicEnabled = useUiStore.getState().musicEnabled;
      const initialMusicVolume = useUiStore.getState().musicVolume;
      
      act(() => {
        useUiStore.getState().setSoundEnabled(!initialMusicEnabled);
        useUiStore.getState().setSoundVolume(0.1);
      });
      
      expect(useUiStore.getState().musicEnabled).toBe(initialMusicEnabled);
      expect(useUiStore.getState().musicVolume).toBe(initialMusicVolume);
    });

    it('changing music settings does not affect sound settings', () => {
      const initialSoundEnabled = useUiStore.getState().soundEnabled;
      const initialSoundVolume = useUiStore.getState().soundVolume;
      
      act(() => {
        useUiStore.getState().setMusicEnabled(!initialSoundEnabled);
        useUiStore.getState().setMusicVolume(0.9);
      });
      
      expect(useUiStore.getState().soundEnabled).toBe(initialSoundEnabled);
      expect(useUiStore.getState().soundVolume).toBe(initialSoundVolume);
    });
  });

  describe('Rapid State Changes', () => {
    it('handles rapid sound setting changes', () => {
      expect(() => {
        act(() => {
          for (let i = 0; i < 10; i++) {
            useUiStore.getState().setSoundEnabled(i % 2 === 0);
            useUiStore.getState().setSoundVolume(i / 10);
          }
        });
      }).not.toThrow();
    });

    it('handles rapid music setting changes', () => {
      expect(() => {
        act(() => {
          for (let i = 0; i < 10; i++) {
            useUiStore.getState().setMusicEnabled(i % 2 === 0);
            useUiStore.getState().setMusicVolume(i / 10);
          }
        });
      }).not.toThrow();
    });

    it('handles interleaved sound and music changes', () => {
      expect(() => {
        act(() => {
          useUiStore.getState().setSoundVolume(0.1);
          useUiStore.getState().setMusicVolume(0.2);
          useUiStore.getState().setSoundEnabled(false);
          useUiStore.getState().setMusicEnabled(true);
          useUiStore.getState().setSoundVolume(0.5);
          useUiStore.getState().setMusicVolume(0.6);
        });
      }).not.toThrow();
    });
  });

  describe('Regression Prevention', () => {
    it('audio settings added in Phase 12 exist', () => {
      const state = useUiStore.getState();
      
      // These were added in Phase 12 for music system
      expect(state.musicEnabled).toBeDefined();
      expect(state.musicVolume).toBeDefined();
      expect(state.setMusicEnabled).toBeDefined();
      expect(state.setMusicVolume).toBeDefined();
    });

    it('all audio setting methods are callable', () => {
      const state = useUiStore.getState();
      
      expect(() => state.setSoundEnabled(true)).not.toThrow();
      expect(() => state.setSoundVolume(0.5)).not.toThrow();
      expect(() => state.setMusicEnabled(true)).not.toThrow();
      expect(() => state.setMusicVolume(0.5)).not.toThrow();
    });

    it('maintains type safety for all audio properties', () => {
      const state = useUiStore.getState();
      
      expect(typeof state.soundEnabled).toBe('boolean');
      expect(typeof state.soundVolume).toBe('number');
      expect(typeof state.musicEnabled).toBe('boolean');
      expect(typeof state.musicVolume).toBe('number');
      expect(typeof state.setSoundEnabled).toBe('function');
      expect(typeof state.setSoundVolume).toBe('function');
      expect(typeof state.setMusicEnabled).toBe('function');
      expect(typeof state.setMusicVolume).toBe('function');
    });
  });
});
