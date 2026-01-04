import { describe, it, expect } from 'vitest';
import { useAudio } from '../../../src/hooks/useAudio';

describe('useAudio hook', () => {
  it('returns an object with all required methods', () => {
    const audio = useAudio();
    
    // Verify all methods exist
    expect(audio).toBeDefined();
    expect(typeof audio.playClick).toBe('function');
    expect(typeof audio.playTransition).toBe('function');
    expect(typeof audio.playNotification).toBe('function');
    expect(typeof audio.playError).toBe('function');
    expect(typeof audio.playSuccess).toBe('function');
    expect(typeof audio.startMusic).toBe('function');
    expect(typeof audio.stopMusic).toBe('function');
    expect(typeof audio.toggleMusic).toBe('function');
    expect(typeof audio.setMusicVolume).toBe('function');
  });

  describe('Sound effect methods', () => {
    it('all sound effect methods are callable without errors', () => {
      const audio = useAudio();
      
      expect(() => audio.playClick()).not.toThrow();
      expect(() => audio.playTransition()).not.toThrow();
      expect(() => audio.playNotification()).not.toThrow();
      expect(() => audio.playError()).not.toThrow();
      expect(() => audio.playSuccess()).not.toThrow();
    });
  });

  describe('Music control methods', () => {
    it('all music control methods are callable without errors', () => {
      const audio = useAudio();
      
      expect(() => audio.startMusic()).not.toThrow();
      expect(() => audio.stopMusic()).not.toThrow();
      expect(() => audio.toggleMusic()).not.toThrow();
      expect(() => audio.setMusicVolume(0.5)).not.toThrow();
    });

    it('setMusicVolume accepts values from 0 to 1', () => {
      const audio = useAudio();
      
      expect(() => audio.setMusicVolume(0)).not.toThrow();
      expect(() => audio.setMusicVolume(0.5)).not.toThrow();
      expect(() => audio.setMusicVolume(1)).not.toThrow();
    });
  });

  describe('Type safety and API contract', () => {
    it('has all required methods', () => {
      const audio = useAudio();
      
      // Methods that should exist to prevent runtime errors
      const requiredMethods: Array<keyof typeof audio> = [
        'playClick',
        'playTransition',
        'playNotification',
        'playError',
        'playSuccess',
        'startMusic',
        'stopMusic',
        'toggleMusic', // This was missing and caused build errors
        'setMusicVolume', // This was missing and caused build errors
      ];
      
      requiredMethods.forEach(method => {
        expect(audio[method]).toBeDefined();
        expect(typeof audio[method]).toBe('function');
      });
    });
  });

  describe('Error prevention regression tests', () => {
    it('provides toggleMusic and setMusicVolume to prevent build errors', () => {
      const audio = useAudio();
      
      // These methods were missing and caused TypeScript errors in SettingsModal
      expect(audio.toggleMusic).toBeDefined();
      expect(audio.setMusicVolume).toBeDefined();
      
      // Verify they're callable without errors
      expect(() => audio.toggleMusic()).not.toThrow();
      expect(() => audio.setMusicVolume(0.5)).not.toThrow();
    });
  });
});
