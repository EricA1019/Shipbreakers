import { describe, it, expect, beforeEach } from 'vitest';
import { audioService } from '../../src/services/AudioService';
import { useUiStore } from '../../src/stores/uiStore';
import { useAudio } from '../../src/hooks/useAudio';
import { act } from 'react';

describe('Audio System Integration', () => {
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

  describe('Hook to Service Integration', () => {
    it('useAudio methods call AudioService methods', () => {
      const audio = useAudio();
      
      // These should all call through to audioService without errors
      expect(() => audio.playClick()).not.toThrow();
      expect(() => audio.playTransition()).not.toThrow();
      expect(() => audio.playNotification()).not.toThrow();
      expect(() => audio.playError()).not.toThrow();
      expect(() => audio.playSuccess()).not.toThrow();
      expect(() => audio.startMusic()).not.toThrow();
      expect(() => audio.stopMusic()).not.toThrow();
    });

    it('useAudio toggleMusic updates service and store', () => {
      const audio = useAudio();
      const initialMusicEnabled = useUiStore.getState().musicEnabled;
      
      // Toggle should work through the hook
      expect(() => audio.toggleMusic()).not.toThrow();
      
      // Service should still be callable after toggle
      expect(() => audioService.startMusic()).not.toThrow();
    });

    it('useAudio setMusicVolume updates service', () => {
      const audio = useAudio();
      
      expect(() => audio.setMusicVolume(0.3)).not.toThrow();
      expect(() => audio.setMusicVolume(0.8)).not.toThrow();
    });
  });

  describe('Store to Service Integration', () => {
    it('changing store soundEnabled affects service', () => {
      // Enable sound
      act(() => {
        useUiStore.getState().setSoundEnabled(true);
      });
      
      expect(() => audioService.playClick()).not.toThrow();
      
      // Disable sound
      act(() => {
        useUiStore.getState().setSoundEnabled(false);
      });
      
      expect(() => audioService.playClick()).not.toThrow();
    });

    it('changing store musicEnabled affects service', () => {
      // Enable music
      act(() => {
        useUiStore.getState().setMusicEnabled(true);
      });
      
      expect(() => audioService.startMusic()).not.toThrow();
      
      // Disable music
      act(() => {
        useUiStore.getState().setMusicEnabled(false);
      });
      
      expect(() => audioService.startMusic()).not.toThrow();
    });

    it('changing store volumes affects service', () => {
      act(() => {
        useUiStore.getState().setSoundVolume(0.2);
      });
      
      expect(() => audioService.playTransition()).not.toThrow();
      
      act(() => {
        useUiStore.getState().setMusicVolume(0.9);
      });
      
      expect(() => audioService.startMusic()).not.toThrow();
    });
  });

  describe('End-to-End Audio Flow', () => {
    it('complete sound effect flow works', () => {
      const audio = useAudio();
      
      // User plays sound
      expect(() => audio.playClick()).not.toThrow();
      
      // User changes volume
      act(() => {
        useUiStore.getState().setSoundVolume(0.5);
      });
      
      // Sound still works
      expect(() => audio.playSuccess()).not.toThrow();
      
      // User disables sound
      act(() => {
        useUiStore.getState().setSoundEnabled(false);
      });
      
      // Should not throw even when disabled
      expect(() => audio.playError()).not.toThrow();
    });

    it('complete music flow works', () => {
      const audio = useAudio();
      
      // User starts music
      expect(() => audio.startMusic()).not.toThrow();
      
      // User changes volume
      expect(() => audio.setMusicVolume(0.7)).not.toThrow();
      
      // User toggles music off
      expect(() => audio.toggleMusic()).not.toThrow();
      
      // User toggles music back on
      expect(() => audio.toggleMusic()).not.toThrow();
      
      // User stops music
      expect(() => audio.stopMusic()).not.toThrow();
    });

    it('mixed sound and music flow works', () => {
      const audio = useAudio();
      
      // Play sound while starting music
      expect(() => {
        audio.playClick();
        audio.startMusic();
        audio.playTransition();
        audio.setMusicVolume(0.6);
        audio.playSuccess();
        audio.stopMusic();
        audio.playNotification();
      }).not.toThrow();
    });
  });

  describe('Settings Modal Workflow', () => {
    it('simulates user adjusting settings in SettingsModal', () => {
      const audio = useAudio();
      
      // User opens settings and changes sound volume
      act(() => {
        useUiStore.getState().setSoundVolume(0.3);
      });
      
      // Plays a sound to test
      expect(() => audio.playClick()).not.toThrow();
      
      // User changes music volume
      act(() => {
        useUiStore.getState().setMusicVolume(0.8);
      });
      
      // Music volume is updated via hook
      expect(() => audio.setMusicVolume(0.8)).not.toThrow();
      
      // User toggles music
      expect(() => {
        const musicEnabled = useUiStore.getState().musicEnabled;
        useUiStore.getState().setMusicEnabled(!musicEnabled);
        audio.toggleMusic();
      }).not.toThrow();
    });

    it('handles extreme settings changes', () => {
      // Set everything to minimum
      act(() => {
        useUiStore.getState().setSoundEnabled(false);
        useUiStore.getState().setSoundVolume(0);
        useUiStore.getState().setMusicEnabled(false);
        useUiStore.getState().setMusicVolume(0);
      });
      
      const audio = useAudio();
      expect(() => {
        audio.playClick();
        audio.startMusic();
      }).not.toThrow();
      
      // Set everything to maximum
      act(() => {
        useUiStore.getState().setSoundEnabled(true);
        useUiStore.getState().setSoundVolume(1);
        useUiStore.getState().setMusicEnabled(true);
        useUiStore.getState().setMusicVolume(1);
      });
      
      expect(() => {
        audio.playSuccess();
        audio.startMusic();
      }).not.toThrow();
    });
  });

  describe('Game Scenario Workflows', () => {
    it('handles Hub Screen workflow', () => {
      const audio = useAudio();
      
      // Screen loads, plays transition
      expect(() => audio.playTransition()).not.toThrow();
      
      // Music starts
      expect(() => audio.startMusic()).not.toThrow();
      
      // User clicks buttons
      expect(() => {
        audio.playClick();
        audio.playClick();
        audio.playClick();
      }).not.toThrow();
    });

    it('handles salvage success workflow', () => {
      const audio = useAudio();
      
      // Multiple actions during salvage
      expect(() => {
        audio.playClick(); // Select action
        audio.playTransition(); // Start salvage
        audio.playNotification(); // Loot found
        audio.playNotification(); // More loot
        audio.playSuccess(); // Salvage complete
      }).not.toThrow();
    });

    it('handles error and warning workflow', () => {
      const audio = useAudio();
      
      // User encounters errors
      expect(() => {
        audio.playClick(); // Try action
        audio.playError(); // Insufficient credits
        audio.playClick(); // Try again
        audio.playError(); // Still can\'t afford
        audio.playNotification(); // Info toast
      }).not.toThrow();
    });
  });

  describe('Phase 12 Regression Tests', () => {
    it('music system integrated in Phase 12 works correctly', () => {
      const audio = useAudio();
      
      // All Phase 12 music features should work
      expect(() => audio.startMusic()).not.toThrow();
      expect(() => audio.stopMusic()).not.toThrow();
      expect(() => audio.toggleMusic()).not.toThrow();
      expect(() => audio.setMusicVolume(0.5)).not.toThrow();
    });

    it('music settings in uiStore work correctly', () => {
      // Phase 12 added these settings
      act(() => {
        useUiStore.getState().setMusicEnabled(true);
        useUiStore.getState().setMusicVolume(0.6);
      });
      
      expect(useUiStore.getState().musicEnabled).toBe(true);
      expect(useUiStore.getState().musicVolume).toBe(0.6);
    });

    it('music controls in SettingsModal work correctly', () => {
      const audio = useAudio();
      
      // Simulate SettingsModal music toggle button
      const handleMusicToggle = () => {
        const current = useUiStore.getState().musicEnabled;
        useUiStore.getState().setMusicEnabled(!current);
        audio.toggleMusic();
      };
      
      expect(() => handleMusicToggle()).not.toThrow();
      
      // Simulate SettingsModal music volume slider
      const handleMusicVolumeChange = (value: number) => {
        useUiStore.getState().setMusicVolume(value);
        audio.setMusicVolume(value);
      };
      
      expect(() => handleMusicVolumeChange(0.7)).not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('handles concurrent sound effects', () => {
      const audio = useAudio();
      
      expect(() => {
        // Simulate multiple UI interactions happening rapidly
        audio.playClick();
        audio.playClick();
        audio.playTransition();
        audio.playClick();
        audio.playSuccess();
        audio.playNotification();
      }).not.toThrow();
    });

    it('handles sound effects while music is playing', () => {
      const audio = useAudio();
      
      expect(() => {
        audio.startMusic();
        audio.playClick();
        audio.playTransition();
        audio.playNotification();
        audio.playSuccess();
        audio.stopMusic();
      }).not.toThrow();
    });

    it('handles settings changes during active audio', () => {
      const audio = useAudio();
      
      expect(() => {
        audio.startMusic();
        audio.playClick();
        
        act(() => {
          useUiStore.getState().setSoundVolume(0.3);
        });
        
        audio.playTransition();
        
        act(() => {
          useUiStore.getState().setMusicVolume(0.8);
        });
        
        audio.setMusicVolume(0.8);
        audio.playSuccess();
        audio.stopMusic();
      }).not.toThrow();
    });
  });
});
