import { useEffect } from "react";

interface KeyboardShortcuts {
  h?: () => void; // Go to hub
  i?: () => void; // Inventory
  s?: () => void; // Settings
  Escape?: () => void; // Close dialogs
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      // Check for shortcuts
      if (key.toLowerCase() === "h" && shortcuts.h) {
        e.preventDefault();
        shortcuts.h();
      } else if (key.toLowerCase() === "i" && shortcuts.i) {
        e.preventDefault();
        shortcuts.i();
      } else if (key.toLowerCase() === "s" && shortcuts.s) {
        e.preventDefault();
        shortcuts.s();
      } else if (key === "Escape" && shortcuts.Escape) {
        e.preventDefault();
        shortcuts.Escape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};
