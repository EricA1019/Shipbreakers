import { useState, useEffect } from "react";

export interface AutoSalvageRules {
  maxHazardLevel: number;
  priorityRooms: ("cargo" | "labs" | "armory" | "any")[];
  stopOnInjury: boolean;
  stopOnLowStamina: number;
  stopOnLowSanity: number;
}

export interface AutoSalvagePreset {
  name: string;
  rules: AutoSalvageRules;
}

const PRESETS: AutoSalvagePreset[] = [
  {
    name: "Conservative",
    rules: {
      maxHazardLevel: 2,
      priorityRooms: ["cargo", "any"],
      stopOnInjury: true,
      stopOnLowStamina: 40,
      stopOnLowSanity: 50,
    },
  },
  {
    name: "Balanced",
    rules: {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 40,
    },
  },
  {
    name: "Aggressive",
    rules: {
      maxHazardLevel: 5,
      priorityRooms: ["armory", "labs", "cargo", "any"],
      stopOnInjury: false,
      stopOnLowStamina: 10,
      stopOnLowSanity: 20,
    },
  },
];

interface AutoSalvageMenuProps {
  wreckTier: number;
  wreckType: string;
  onStart: (rules: AutoSalvageRules, speed: number) => void;
  onCancel: () => void;
}

export default function AutoSalvageMenu({
  wreckTier,
  wreckType,
  onStart,
  onCancel,
}: AutoSalvageMenuProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Balanced");
  const [customRules, setCustomRules] = useState<AutoSalvageRules>(PRESETS[1].rules);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [showCustom, setShowCustom] = useState(false);

  // Load last-used rules from localStorage
  useEffect(() => {
    const storageKey = `autoSalvage_${wreckType}_tier${wreckTier}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomRules(parsed);
        setShowCustom(true);
        setSelectedPreset(null);
      } catch {
        // Ignore parse errors
      }
    }
  }, [wreckTier, wreckType]);

  const handlePresetSelect = (preset: AutoSalvagePreset) => {
    setSelectedPreset(preset.name);
    setCustomRules(preset.rules);
    setShowCustom(false);
  };

  const handleCustomChange = (field: keyof AutoSalvageRules, value: any) => {
    setSelectedPreset(null);
    setCustomRules((prev) => ({ ...prev, [field]: value }));
  };

  const validateRules = (): string | null => {
    if (customRules.maxHazardLevel < 1 || customRules.maxHazardLevel > 5) {
      return "Hazard level must be 1-5";
    }
    if (customRules.stopOnLowStamina < 0 || customRules.stopOnLowStamina > 100) {
      return "Stamina threshold must be 0-100";
    }
    if (customRules.stopOnLowSanity < 0 || customRules.stopOnLowSanity > 100) {
      return "Sanity threshold must be 0-100";
    }
    return null;
  };

  const handleStart = () => {
    const error = validateRules();
    if (error) {
      alert(error);
      return;
    }

    // Save to localStorage
    const storageKey = `autoSalvage_${wreckType}_tier${wreckTier}`;
    localStorage.setItem(storageKey, JSON.stringify(customRules));

    onStart(customRules, speed);
  };

  const handleSaveCustomPreset = () => {
    const name = prompt("Enter preset name:");
    if (!name) return;

    const customPresets = JSON.parse(localStorage.getItem("autoSalvage_customPresets") || "[]");
    customPresets.push({ name, rules: customRules });
    localStorage.setItem("autoSalvage_customPresets", JSON.stringify(customPresets));
    alert(`Preset "${name}" saved!`);
  };

  // Load custom presets
  const customPresets: AutoSalvagePreset[] = JSON.parse(
    localStorage.getItem("autoSalvage_customPresets") || "[]"
  );

  return (
    <div className="bg-zinc-900 border border-amber-600/30 rounded p-4 max-w-md">
      <div className="text-amber-500 font-bold text-lg mb-4">AUTO-SALVAGE CONFIGURATION</div>

      {/* Speed selector */}
      <div className="mb-4">
        <div className="text-zinc-400 text-xs font-mono mb-2">SPEED</div>
        <div className="flex gap-2">
          <button
            onClick={() => setSpeed(1)}
            className={`px-4 py-2 rounded font-bold ${
              speed === 1
                ? "bg-amber-600 text-zinc-900"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            1x Normal
          </button>
          <button
            onClick={() => setSpeed(2)}
            className={`px-4 py-2 rounded font-bold ${
              speed === 2
                ? "bg-amber-600 text-zinc-900"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            2x Fast
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <div className="text-zinc-400 text-xs font-mono mb-2">PRESETS</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-1.5 rounded text-sm font-bold ${
                selectedPreset === preset.name
                  ? "bg-amber-600 text-zinc-900"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              {preset.name}
            </button>
          ))}
          {customPresets.map((preset, i) => (
            <button
              key={`custom-${i}`}
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-1.5 rounded text-sm font-bold ${
                selectedPreset === preset.name
                  ? "bg-cyan-600 text-zinc-900"
                  : "bg-cyan-800 text-zinc-300 hover:bg-cyan-700"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom rules toggle */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className="text-amber-400 text-xs mb-2 hover:text-amber-300"
      >
        {showCustom ? "▼ Hide Custom Rules" : "► Show Custom Rules"}
      </button>

      {/* Custom rules */}
      {showCustom && (
        <div className="bg-zinc-800 border border-zinc-700 rounded p-3 mb-4 space-y-3">
          {/* Max hazard level */}
          <div>
            <label className="text-zinc-400 text-xs font-mono">Max Hazard Level (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={customRules.maxHazardLevel}
              onChange={(e) => handleCustomChange("maxHazardLevel", Number(e.target.value))}
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-amber-100 mt-1"
            />
          </div>

          {/* Stop on injury */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={customRules.stopOnInjury}
              onChange={(e) => handleCustomChange("stopOnInjury", e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-zinc-400 text-xs">Stop if crew is injured</label>
          </div>

          {/* Stamina threshold */}
          <div>
            <label className="text-zinc-400 text-xs font-mono">
              Stop at Stamina % ({customRules.stopOnLowStamina})
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={customRules.stopOnLowStamina}
              onChange={(e) => handleCustomChange("stopOnLowStamina", Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>

          {/* Sanity threshold */}
          <div>
            <label className="text-zinc-400 text-xs font-mono">
              Stop at Sanity % ({customRules.stopOnLowSanity})
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={customRules.stopOnLowSanity}
              onChange={(e) => handleCustomChange("stopOnLowSanity", Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>

          {/* Save custom preset button */}
          <button
            onClick={handleSaveCustomPreset}
            className="text-cyan-400 text-xs hover:text-cyan-300"
          >
            💾 Save as Custom Preset
          </button>
        </div>
      )}

      {/* Current rules summary */}
      <div className="bg-zinc-800 border border-zinc-700 rounded p-3 mb-4 text-xs">
        <div className="text-zinc-400 font-mono mb-2">CURRENT RULES</div>
        <div className="space-y-1 text-zinc-300">
          <div>Max hazard: Level {customRules.maxHazardLevel}</div>
          <div>🛑 Stop on injury: {customRules.stopOnInjury ? "Yes" : "No"}</div>
          <div>Stamina threshold: {customRules.stopOnLowStamina}%</div>
          <div>Sanity threshold: {customRules.stopOnLowSanity}%</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleStart}
          className="flex-1 bg-amber-600 text-zinc-900 py-2 font-bold rounded hover:bg-amber-500 transition"
        >
          ▶ Start Auto-Salvage
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
