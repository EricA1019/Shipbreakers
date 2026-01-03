/**
 * useAudio - React hook for playing UI sound effects
 * 
 * Provides convenient methods for triggering sound effects in components.
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
 * @example Screen transitions
 * ```tsx
 * function ScreenComponent() {
 *   const audio = useAudio();
 *   
 *   useEffect(() => {
 *     audio.playTransition();
 *   }, []);
 *   
 *   // ...
 * }
 * ```
 */

import { audioService } from "../services/AudioService";

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
  };
}
