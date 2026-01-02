import { useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import type { GameSettings } from "../../types";
import SaveManagerModal from "./SaveManagerModal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useGameStore((s) => ({
    settings: s.settings || {
      autoSave: true,
      confirmDialogs: true,
      showTooltips: true,
      showKeyboardHints: true,
    },
    updateSettings: s.updateSettings,
  }));
  const [showSaveManager, setShowSaveManager] = useState(false);

  const handleToggle = (key: keyof GameSettings) => {
    updateSettings({ [key]: !settings[key] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-amber-600/50 p-6 max-w-md w-full mx-4">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-4">
          ⚙️ SETTINGS
        </div>

        <div className="space-y-3 mb-6">
          {/* Auto-save */}
          <div className="flex justify-between items-center bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div>
              <div className="text-amber-100 font-bold text-sm">Auto-Save</div>
              <div className="text-zinc-400 text-xs mt-1">
                Automatically save game state
              </div>
            </div>
            <button
              onClick={() => handleToggle("autoSave")}
              className={`px-3 py-1 rounded text-xs font-bold ${
                settings.autoSave
                  ? "bg-green-600 text-white"
                  : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {settings.autoSave ? "ON" : "OFF"}
            </button>
          </div>

          {/* Confirmation Dialogs */}
          <div className="flex justify-between items-center bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div>
              <div className="text-amber-100 font-bold text-sm">
                Confirm Actions
              </div>
              <div className="text-zinc-400 text-xs mt-1">
                Ask before major decisions
              </div>
            </div>
            <button
              onClick={() => handleToggle("confirmDialogs")}
              className={`px-3 py-1 rounded text-xs font-bold ${
                settings.confirmDialogs
                  ? "bg-green-600 text-white"
                  : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {settings.confirmDialogs ? "ON" : "OFF"}
            </button>
          </div>

          {/* Tooltips */}
          <div className="flex justify-between items-center bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div>
              <div className="text-amber-100 font-bold text-sm">
                Show Tooltips
              </div>
              <div className="text-zinc-400 text-xs mt-1">
                Display helpful information
              </div>
            </div>
            <button
              onClick={() => handleToggle("showTooltips")}
              className={`px-3 py-1 rounded text-xs font-bold ${
                settings.showTooltips
                  ? "bg-green-600 text-white"
                  : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {settings.showTooltips ? "ON" : "OFF"}
            </button>
          </div>

          {/* Keyboard Hints */}
          <div className="flex justify-between items-center bg-zinc-800 border border-amber-600/20 p-3 rounded">
            <div>
              <div className="text-amber-100 font-bold text-sm">
                Keyboard Hints
              </div>
              <div className="text-zinc-400 text-xs mt-1">
                Show hotkey reminders
              </div>
            </div>
            <button
              onClick={() => handleToggle("showKeyboardHints")}
              className={`px-3 py-1 rounded text-xs font-bold ${
                settings.showKeyboardHints
                  ? "bg-green-600 text-white"
                  : "bg-zinc-700 text-zinc-400"
              }`}
            >
              {settings.showKeyboardHints ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-zinc-800 border border-amber-600/20 p-3 rounded mb-6">
          <div className="text-amber-500 text-[10px] font-bold tracking-wider mb-2">
            KEYBOARD SHORTCUTS
          </div>
          <div className="space-y-1 text-[10px] text-zinc-400">
            <div>
              <span className="text-amber-100 font-bold">H</span> - Return to
              hub
            </div>
            <div>
              <span className="text-amber-100 font-bold">I</span> - Toggle
              inventory
            </div>
            <div>
              <span className="text-amber-100 font-bold">S</span> - Open
              settings
            </div>
            <div>
              <span className="text-amber-100 font-bold">ESC</span> - Close
              dialogs
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveManager(true)}
            className="flex-1 bg-cyan-700 text-white px-4 py-2 font-bold hover:bg-cyan-600 rounded text-sm"
          >
            💾 Save Files
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-amber-500 text-zinc-900 px-4 py-2 font-bold hover:bg-amber-400 rounded"
          >
            Done
          </button>
        </div>
      </div>
      <SaveManagerModal
        isOpen={showSaveManager}
        onClose={() => setShowSaveManager(false)}
      />
    </div>
  );
}
