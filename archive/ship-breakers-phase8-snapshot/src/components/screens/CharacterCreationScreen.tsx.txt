import { useMemo, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import CyberPanel from "../ui/CyberPanel";
import CyberButton from "../ui/CyberButton";
import type { ScreenProps, TraitId } from "../../types";
import { getCharacterCreationTraitOptions } from "../../game/systems/CrewGenerator";
import { TRAITS } from "../../game/data/traits";

export default function CharacterCreationScreen({ onNavigate }: ScreenProps) {
  const { createCaptain } = useGameStore((s) => ({
    createCaptain: (s as any).createCaptain,
  }));

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
    createCaptain({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      lockedTrait,
      chosenTrait: chosenTrait as TraitId,
    });
    onNavigate("hub");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <CyberPanel title="NEW GAME // CAPTAIN CREATION" className="mb-4">
        <div className="text-zinc-300 text-sm">
          Enter your captain name. You start with 1 locked trait and choose 1 from 3.
        </div>
      </CyberPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CyberPanel title="IDENTITY">
          <div className="space-y-3">
            <div>
              <div className="text-zinc-400 text-xs mb-1">FIRST NAME</div>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-zinc-950 border border-amber-600/20 px-3 py-2 text-amber-50"
                placeholder="e.g., Kai"
              />
            </div>
            <div>
              <div className="text-zinc-400 text-xs mb-1">LAST NAME</div>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-zinc-950 border border-amber-600/20 px-3 py-2 text-amber-50"
                placeholder="e.g., Vance"
              />
            </div>
            <div className="text-zinc-500 text-xs">
              Preview: <span className="text-amber-200">{(firstName || "Player").trim()} {(lastName || "Captain").trim()}</span>
            </div>
          </div>
        </CyberPanel>

        <CyberPanel title="TRAITS">
          <div className="space-y-3">
            <div className="bg-zinc-950 border border-amber-600/20 p-3">
              <div className="text-amber-400 text-xs font-bold">LOCKED TRAIT</div>
              <div className="text-amber-100 font-bold">{TRAITS[lockedTrait]?.name ?? lockedTrait}</div>
              <div className="text-zinc-400 text-xs">{TRAITS[lockedTrait]?.description ?? ""}</div>
            </div>

            <div className="text-amber-400 text-xs font-bold">CHOOSE ONE</div>
            <div className="space-y-2">
              {options.map((id) => (
                <label
                  key={id}
                  className={`block cursor-pointer border p-3 bg-zinc-950 transition ${
                    chosenTrait === id ? "border-amber-500" : "border-amber-600/20 hover:border-amber-500/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="trait"
                      checked={chosenTrait === id}
                      onChange={() => setChosenTrait(id)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-amber-100 font-bold">{TRAITS[id]?.name ?? id}</div>
                      <div className="text-zinc-400 text-xs">{TRAITS[id]?.description ?? ""}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <CyberButton
                variant="primary"
                glowColor="amber"
                onClick={begin}
                disabled={!canStart}
                className="w-full"
              >
                Begin
              </CyberButton>
            </div>
          </div>
        </CyberPanel>
      </div>
    </div>
  );
}