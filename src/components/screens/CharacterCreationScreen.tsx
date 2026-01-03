import { useMemo, useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import { useAudio } from "../../hooks/useAudio";
import type { ScreenProps, TraitId } from "../../types";
import { getCharacterCreationTraitOptions } from "../../game/systems/CrewGenerator";
import { TRAITS } from "../../game/data/traits";

export default function CharacterCreationScreen({ onNavigate }: ScreenProps) {
  const { createCaptain } = useGameStore((s) => ({
    createCaptain: (s as any).createCaptain,
  }));

  const audio = useAudio();

  useEffect(() => {
    audio.playTransition();
  }, []);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [chosenTrait, setChosenTrait] = useState<TraitId | "">("");

  const seed = useMemo(() => {
    const f = firstName.trim() || "Player";
    const l = lastName.trim() || "Captain";
    return `cc-${f}-${l}`;
  }, [firstName, lastName]);

  const traitPick = useMemo(() => getCharacterCreationTraitOptions(seed), [seed]);
  const lockedTrait = traitPick.lockedTrait;
  const options = traitPick.options;

  const canStart = firstName.trim().length > 0 && lastName.trim().length > 0 && chosenTrait !== "";

  const begin = () => {
    if (!canStart) return;
    audio.playTransition();
    createCaptain({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      lockedTrait,
      chosenTrait: chosenTrait as TraitId,
    });
    onNavigate("hub");
  };

  // Background options for display purposes (not actually used in current impl)
  const backgrounds = [
    { 
      id: "ex-military",
      icon: "⚔️",
      name: "EX-MILITARY",
      desc: "Former combat veteran with tactical experience. Proficient in handling hazardous situations and salvaging military hardware.",
      traits: ["BRAVE", "TACTICAL"],
      selected: chosenTrait === lockedTrait
    },
    { 
      id: "engineer",
      icon: "🔧",
      name: "ENGINEER",
      desc: "Experienced with ship systems and technical salvage. Can identify valuable components and repair critical equipment.",
      traits: ["METHODICAL", "PRECISE"],
      selected: false
    },
    { 
      id: "hauler",
      icon: "🚚",
      name: "HAULER",
      desc: "Former cargo pilot with logistics expertise. Efficient at managing inventory and maximizing cargo space.",
      traits: ["EFFICIENT", "PRAGMATIC"],
      selected: false
    },
    { 
      id: "prospector",
      icon: "💎",
      name: "PROSPECTOR",
      desc: "Veteran salvager with an eye for valuable finds. Increased chance of discovering rare and exotic loot.",
      traits: ["GREEDY", "OBSERVANT"],
      selected: false
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto flex items-center justify-center min-h-screen py-8">
      <div className="w-full space-y-4">
        {/* Header */}
        <IndustrialPanel
          title="NEW SALVAGE LICENSE"
          subtitle="CINDER STATION · REGISTRATION TERMINAL"
        >
          <div />
        </IndustrialPanel>

        {/* Character Name */}
        <IndustrialPanel title="APPLICANT DETAILS">
          <div className="mb-4">
            <label className="block text-xs text-amber-400 uppercase tracking-wider mb-2">
              Captain Name
            </label>
            <input
              type="text"
              value={`${firstName} ${lastName}`.trim() || ""}
              onChange={(e) => {
                const parts = e.target.value.split(" ");
                setFirstName(parts[0] || "");
                setLastName(parts.slice(1).join(" ") || "");
              }}
              className="w-full bg-black/40 border border-white/12 rounded-lg px-4 py-3 text-zinc-100 font-['JetBrains_Mono'] text-sm transition-all focus:outline-none focus:border-amber-400 focus:bg-amber-500/5 focus:shadow-[0_0_0_3px_rgba(242,178,51,0.1)]"
              placeholder="Enter your name..."
            />
          </div>
          <div className="text-xs text-zinc-400 italic">
            This will be used in station communications and crew rosters.
          </div>
        </IndustrialPanel>

        {/* Background Selection */}
        <IndustrialPanel 
          title="BACKGROUND SELECTION"
          subtitle="CHOOSE YOUR STARTING SPECIALTY"
        >
          <div className="grid grid-cols-2 gap-3 mb-5">
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                className={`bg-black/26 border-2 rounded-xl p-4 transition-all cursor-pointer ${
                  bg.selected
                    ? 'border-cyan-500 bg-cyan-500/8 shadow-[0_0_20px_rgba(56,224,199,0.2)]'
                    : 'border-white/8 hover:border-amber-400 hover:bg-amber-500/5'
                }`}
                onClick={() => {
                  audio.playClick();
                  // This is just visual, actual trait selection is below
                }}
              >
                <div className="font-['Orbitron'] font-bold text-sm mb-2">
                  {bg.icon} {bg.name}
                </div>
                <div className="text-xs text-zinc-400 leading-relaxed mb-3">
                  {bg.desc}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bg.traits.map((trait, i) => (
                    <div
                      key={i}
                      className="text-[9px] px-2 py-1 rounded-md uppercase tracking-wide bg-cyan-500/12 border border-cyan-500/25 text-cyan-400"
                    >
                      {trait}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actual trait selection (using game logic) */}
          <div className="bg-black/30 border border-white/8 rounded-xl p-4 mb-4">
            <div className="text-xs text-amber-400 uppercase tracking-wider mb-3">
              Starting Trait (Locked)
            </div>
            <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-lg p-3">
              <div className="font-['Orbitron'] font-bold text-sm text-cyan-400 mb-1">
                {TRAITS[lockedTrait]?.name ?? lockedTrait}
              </div>
              <div className="text-xs text-zinc-400">
                {TRAITS[lockedTrait]?.description ?? ""}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs text-amber-400 uppercase tracking-wider mb-3">
              Choose Additional Trait
            </div>
            <div className="space-y-2">
              {options.map((id) => (
                <label
                  key={id}
                  onClick={() => audio.playClick()}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                    chosenTrait === id
                      ? 'border-cyan-500 bg-cyan-500/8'
                      : 'border-white/8 bg-black/20 hover:border-amber-400/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="trait"
                    checked={chosenTrait === id}
                    onChange={() => setChosenTrait(id)}
                    className="mt-1 accent-cyan-500"
                  />
                  <div className="flex-1">
                    <div className="font-['Orbitron'] font-bold text-sm text-zinc-100 mb-1">
                      {TRAITS[id]?.name ?? id}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {TRAITS[id]?.description ?? ""}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {chosenTrait && (
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/15 rounded-xl">
              <div className="text-xs text-cyan-400 mb-1 font-semibold">
                💡 SELECTED: {TRAITS[chosenTrait as TraitId]?.name?.toUpperCase()}
              </div>
              <div className="text-xs text-zinc-400">
                Your background provides permanent bonuses and affects starting equipment. Choose wisely - this decision is permanent.
              </div>
            </div>
          )}
        </IndustrialPanel>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <IndustrialButton
            variant="primary"
            onClick={begin}
            disabled={!canStart}
            title="✓ Confirm & Begin"
            description="Start your salvage career"
          />
          <IndustrialButton
            onClick={() => {
              audio.playClick();
              // Randomize names
              const firstNames = ["Kai", "Zara", "Rex", "Nova", "Marcus", "Elena"];
              const lastNames = ["Chen", "Volt", "Storm", "Kane", "Drake", "Reeves"];
              setFirstName(firstNames[Math.floor(Math.random() * firstNames.length)]);
              setLastName(lastNames[Math.floor(Math.random() * lastNames.length)]);
              // Random trait
              if (options.length > 0) {
                setChosenTrait(options[Math.floor(Math.random() * options.length)]);
              }
            }}
            title="🔄 Randomize"
            description="Generate random character"
          />
        </div>
      </div>
    </div>
  );
}