/**
 * useAudio - React hook for playing UI sound effects and background music
 * 
 * Provides convenient methods for triggering sound effects in components
 * and controlling background music playback.
 * Automatically respects global sound settings (enabled/volume).
 * 
 * @example Basic usage
 * ```tsx
 * function MyButton() {
 *   const audio = useAudio();
 *   
 *   return (
 *     <button onClick={() => {
 *       audio.playClick();
 *       handleAction();
 *     }}>
 *       Click Me
 *     </button>
 *   );
 * }
 * ```
 * 
 * @example Screen transitions with music
 * ```tsx
 * function ScreenComponent() {
 *   const audio = useAudio();
 *   
 *   useEffect(() => {
 *     audio.playTransition();
 *     audio.startMusic();
 *   }, []);
 *   
 *   // ...
 * }
 * ```
 */

import { audioService } from "../services/AudioService";
import { useUiStore } from "../stores/uiStore";

export function useAudio() {
  return {
    /**
     * Play click sound (buttons, menu items)
     */
    playClick: () => audioService.playClick(),
    
    /**
     * Play transition sound (screen changes, modals)
     */
    playTransition: () => audioService.playTransition(),
    
    /**
     * Play notification sound (toasts, alerts)
     */
    playNotification: () => audioService.playNotification(),
    
    /**
     * Play error sound (failures, warnings)
     */
    playError: () => audioService.playError(),
    
    /**
     * Play success sound (completions, achievements)
     */
    playSuccess: () => audioService.playSuccess(),

    /**
     * Start background music (shuffled playlist with looping)
     */
    startMusic: () => audioService.startMusic(),

    /**
     * Stop background music
     */
    stopMusic: () => audioService.stopMusic(),

    /**
     * Toggle background music on/off
     */
    toggleMusic: () => {
      const musicEnabled = useUiStore.getState().musicEnabled;
      audioService.toggleMusic(!musicEnabled);
    },

    /**
     * Set music volume (0.0 to 1.0)
     */
    setMusicVolume: (volume: number) => audioService.setMusicVolume(volume),
  };
}
