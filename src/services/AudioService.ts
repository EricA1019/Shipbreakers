/**
 * AudioService - Centralized UI sound effects management
 * 
 * Provides simple methods for playing categorized sound effects with
 * volume control and enable/disable support.
 * 
 * Sound Categories:
 * - Click: Button presses, menu navigation
 * - Transition: Screen changes, modal open/close
 * - Notification: Toasts, alerts, status updates
 * - Error: Failures, warnings, errors
 * - Success: Completions, achievements, positive outcomes
 * 
 * Audio files are located in: assets/audio/SCI-FI_UI_SFX_PACK/
 */

import { useUiStore } from "../stores/uiStore";

type SoundCategory = "click" | "transition" | "notification" | "error" | "success";

// Sound file mappings
const SOUNDS: Record<SoundCategory, string[]> = {
  click: [
    "/assets/audio/SCI-FI_UI_SFX_PACK/Clicks/Click.wav",
    "/assets/audio/SCI-FI_UI_SFX_PACK/Clicks/Click_1.wav",
    "/assets/audio/SCI-FI_UI_SFX_PACK/Clicks/Click_2.wav",
  ],
  transition: [
    "/assets/audio/SCI-FI_UI_SFX_PACK/Click Combos/Click_Combo.wav",
    "/assets/audio/SCI-FI_UI_SFX_PACK/Click Combos/Click_Combo_1.wav",
  ],
  notification: [
    "/assets/audio/SCI-FI_UI_SFX_PACK/Rings/Reverse_Ring.wav",
    "/assets/audio/SCI-FI_UI_SFX_PACK/Rings/Ring_Pitched_Up.wav",
  ],
  error: [
    "/assets/audio/SCI-FI_UI_SFX_PACK/Glitches/Glitch.wav",
    "/assets/audio/SCI-FI_UI_SFX_PACK/Glitches/Glitch_1.wav",
    "/assets/audio/SCI-FI_UI_SFX_PACK/Glitches/Glitch_19.wav",
  ],
  success: [
    "/assets/audio/SCI-FI_UI_SFX_PACK/Tone1/Basic Tones/Tone1_A_Single.wav",
    "/assets/audio/SCI-FI_UI_SFX_PACK/Tone1/Major/Tone1_Major.wav",
  ],
};

class AudioService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  /**
   * Preload audio files into cache
   */
  preload(category?: SoundCategory) {
    const categories = category ? [category] : Object.keys(SOUNDS) as SoundCategory[];
    
    for (const cat of categories) {
      for (const path of SOUNDS[cat]) {
        if (!this.audioCache.has(path)) {
          const audio = new Audio(path);
          audio.preload = "auto";
          this.audioCache.set(path, audio);
        }
      }
    }
  }

  /**
   * Play a sound from the specified category
   * Picks a random variant if multiple files are available
   */
  private play(category: SoundCategory) {
    const { soundEnabled, soundVolume } = useUiStore.getState();
    
    if (!soundEnabled || soundVolume === 0) return;

    const files = SOUNDS[category];
    if (!files || files.length === 0) return;

    // Pick random variant
    const path = files[Math.floor(Math.random() * files.length)];
    
    // Get or create audio element
    let audio = this.audioCache.get(path);
    if (!audio) {
      audio = new Audio(path);
      this.audioCache.set(path, audio);
    }

    // Clone to allow overlapping sounds
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = soundVolume;
    clone.play().catch(err => {
      console.warn(`Failed to play sound: ${path}`, err);
    });
  }

  /**
   * Play click sound (buttons, menu items)
   */
  playClick() {
    this.play("click");
  }

  /**
   * Play transition sound (screen changes, modals)
   */
  playTransition() {
    this.play("transition");
  }

  /**
   * Play notification sound (toasts, alerts)
   */
  playNotification() {
    this.play("notification");
  }

  /**
   * Play error sound (failures, warnings)
   */
  playError() {
    this.play("error");
  }

  /**
   * Play success sound (completions, achievements)
   */
  playSuccess() {
    this.play("success");
  }
}

// Export singleton instance
export const audioService = new AudioService();

// Preload common sounds on module load
if (typeof window !== "undefined") {
  audioService.preload("click");
  audioService.preload("transition");
}
