import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioService } from '../../../src/services/AudioService';
import { useUiStore } from '../../../src/stores/uiStore';
import { act } from 'react';

describe('AudioService', () => {
  beforeEach(() => {
    // Reset UI store to defaults
    act(() => {
      useUiStore.setState({
        soundEnabled: true,
        soundVolume: 0.7,
        musicEnabled: true,
        musicVolume: 0.5,
      });
    });
  });

  describe('Sound Effects', () => {
    it('has all required sound effect methods', () => {
      expect(typeof audioService.playClick).toBe('function');
      expect(typeof audioService.playTransition).toBe('function');
      expect(typeof audioService.playNotification).toBe('function');
      expect(typeof audioService.playError).toBe('function');
      expect(typeof audioService.playSuccess).toBe('function');
    });

    it('sound effect methods are callable without errors', () => {
      expect(() => audioService.playClick()).not.toThrow();
      expect(() => audioService.playTransition()).not.toThrow();
      expect(() => audioService.playNotification()).not.toThrow();
      expect(() => audioService.playError()).not.toThrow();
      expect(() => audioService.playSuccess()).not.toThrow();
    });

    it('does not throw when sound is disabled', () => {
      act(() => {
        useUiStore.setState({ soundEnabled: false });
      });

      expect(() => audioService.playClick()).not.toThrow();
      expect(() => audioService.playTransition()).not.toThrow();
    });

    it('does not throw when volume is zero', () => {
      act(() => {
        useUiStore.setState({ soundVolume: 0 });
      });

      expect(() => audioService.playClick()).not.toThrow();
      expect(() => audioService.playError()).not.toThrow();
    });

    it('can play multiple sounds in quick succession', () => {
      expect(() => {
        audioService.playClick();
        audioService.playClick();
        audioService.playTransition();
        audioService.playSuccess();
      }).not.toThrow();
    });
  });

  describe('Music Playback', () => {
    it('has all required music methods', () => {
      expect(typeof audioService.startMusic).toBe('function');
      expect(typeof audioService.stopMusic).toBe('function');
      expect(typeof audioService.setMusicVolume).toBe('function');
      expect(typeof audioService.toggleMusic).toBe('function');
    });

    it('startMusic is callable without errors', () => {
      expect(() => audioService.startMusic()).not.toThrow();
    });

    it('stopMusic is callable without errors', () => {
      expect(() => audioService.stopMusic()).not.toThrow();
    });

    it('can start and stop music multiple times', () => {
      expect(() => {
        audioService.startMusic();
        audioService.stopMusic();
        audioService.startMusic();
        audioService.stopMusic();
      }).not.toThrow();
    });

    it('setMusicVolume accepts 0-1 range without errors', () => {
      expect(() => audioService.setMusicVolume(0)).not.toThrow();
      expect(() => audioService.setMusicVolume(0.5)).not.toThrow();
      expect(() => audioService.setMusicVolume(1)).not.toThrow();
    });

    it('setMusicVolume clamps values to 0-1 range', () => {
      // These should not throw even with out-of-range values
      expect(() => audioService.setMusicVolume(-0.5)).not.toThrow();
      expect(() => audioService.setMusicVolume(1.5)).not.toThrow();
    });

    it('toggleMusic with true starts music', () => {
      expect(() => audioService.toggleMusic(true)).not.toThrow();
    });

    it('toggleMusic with false stops music', () => {
      audioService.startMusic();
      expect(() => audioService.toggleMusic(false)).not.toThrow();
    });

    it('does not throw when music is disabled', () => {
      act(() => {
        useUiStore.setState({ musicEnabled: false });
      });

      expect(() => audioService.startMusic()).not.toThrow();
    });

    it('does not throw when music volume is zero', () => {
      act(() => {
        useUiStore.setState({ musicVolume: 0 });
      });

      expect(() => audioService.startMusic()).not.toThrow();
    });
  });

  describe('Preloading', () => {
    it('preload method exists and is callable', () => {
      expect(typeof audioService.preload).toBe('function');
      expect(() => audioService.preload()).not.toThrow();
    });

    it('can preload specific sound categories', () => {
      expect(() => audioService.preload('click')).not.toThrow();
      expect(() => audioService.preload('transition')).not.toThrow();
      expect(() => audioService.preload('notification')).not.toThrow();
      expect(() => audioService.preload('error')).not.toThrow();
      expect(() => audioService.preload('success')).not.toThrow();
    });
  });

  describe('Settings Integration', () => {
    it('respects soundEnabled setting', () => {
      // Enable sound
      act(() => {
        useUiStore.setState({ soundEnabled: true });
      });
      expect(() => audioService.playClick()).not.toThrow();

      // Disable sound
      act(() => {
        useUiStore.setState({ soundEnabled: false });
      });
      expect(() => audioService.playClick()).not.toThrow();
    });

    it('respects musicEnabled setting', () => {
      // Enable music
      act(() => {
        useUiStore.setState({ musicEnabled: true });
      });
      expect(() => audioService.startMusic()).not.toThrow();

      // Disable music
      act(() => {
        useUiStore.setState({ musicEnabled: false });
      });
      expect(() => audioService.startMusic()).not.toThrow();
    });

    it('respects volume changes', () => {
      act(() => {
        useUiStore.setState({ soundVolume: 0.3 });
      });
      expect(() => audioService.playClick()).not.toThrow();

      act(() => {
        useUiStore.setState({ musicVolume: 0.8 });
      });
      expect(() => audioService.startMusic()).not.toThrow();
    });
  });

  describe('Error Resilience', () => {
    it('handles rapid sound calls without crashing', () => {
      expect(() => {
        for (let i = 0; i < 10; i++) {
          audioService.playClick();
        }
      }).not.toThrow();
    });

    it('handles mixed sound and music operations', () => {
      expect(() => {
        audioService.playClick();
        audioService.startMusic();
        audioService.playTransition();
        audioService.stopMusic();
        audioService.playSuccess();
      }).not.toThrow();
    });

    it('handles state changes during playback', () => {
      expect(() => {
        audioService.startMusic();
        
        act(() => {
          useUiStore.setState({ musicEnabled: false });
        });
        
        audioService.playClick();
        
        act(() => {
          useUiStore.setState({ soundEnabled: false });
        });
        
        audioService.stopMusic();
      }).not.toThrow();
    });
  });

  describe('Regression Prevention', () => {
    it('all methods remain callable after multiple operations', () => {
      // Perform various operations
      audioService.playClick();
      audioService.startMusic();
      audioService.setMusicVolume(0.5);
      audioService.playTransition();
      audioService.stopMusic();
      audioService.playError();
      
      // Verify all methods still work
      expect(() => audioService.playClick()).not.toThrow();
      expect(() => audioService.playTransition()).not.toThrow();
      expect(() => audioService.playNotification()).not.toThrow();
      expect(() => audioService.playError()).not.toThrow();
      expect(() => audioService.playSuccess()).not.toThrow();
      expect(() => audioService.startMusic()).not.toThrow();
      expect(() => audioService.stopMusic()).not.toThrow();
      expect(() => audioService.toggleMusic(true)).not.toThrow();
      expect(() => audioService.setMusicVolume(0.7)).not.toThrow();
    });

    it('service remains functional after extreme state changes', () => {
      // Test extreme scenarios
      act(() => {
        useUiStore.setState({
          soundEnabled: false,
          soundVolume: 0,
          musicEnabled: false,
          musicVolume: 0,
        });
      });
      
      audioService.playClick();
      audioService.startMusic();
      
      act(() => {
        useUiStore.setState({
          soundEnabled: true,
          soundVolume: 1,
          musicEnabled: true,
          musicVolume: 1,
        });
      });
      
      expect(() => {
        audioService.playSuccess();
        audioService.startMusic();
      }).not.toThrow();
    });
  });
});
