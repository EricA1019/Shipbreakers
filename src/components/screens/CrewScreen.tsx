import { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { BACKGROUNDS } from "../../game/data/backgrounds";
import { TRAITS } from "../../game/data/traits";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import StatusPill from "../ui/StatusPill";
import { useAudio } from "../../hooks/useAudio";
import { calculateCrewCapacity } from "../../services/CrewService";

import type { ScreenProps } from "../../types";

export default function CrewScreen({ onNavigate }: ScreenProps) {
  const { crewRoster, selectedCrewId, selectCrew, day, playerShip } = useGameStore((s) => ({
    crewRoster: s.crewRoster,
    selectedCrewId: s.selectedCrewId,
    selectCrew: s.selectCrew,
    day: s.day,
    playerShip: s.playerShip,
  }));

  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const audio = useAudio();

  useEffect(() => {
    audio.playTransition();
  }, []);

  const crewCapacity = calculateCrewCapacity(playerShip);

  const DOT_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
  ];

  const getSkillColor = (level: number) => {
    if (level >= 4) return "text-green-400";
    if (level >= 3) return "text-amber-400";
    if (level >= 2) return "text-orange-400";
    return "text-zinc-400";
  };

  const getHealthColor = (hp: number, maxHp: number) => {
    const percent = (hp / maxHp) * 100;
    if (percent >= 70) return "bg-green-500";
    if (percent >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStaminaColor = (stamina: number, maxStamina: number) => {
    const percent = (stamina / maxStamina) * 100;
    if (percent >= 70) return "bg-cyan-500";
    if (percent >= 40) return "bg-cyan-600";
    return "bg-cyan-800";
  };

  const getSanityColor = (sanity: number, maxSanity: number) => {
    const percent = (sanity / maxSanity) * 100;
    if (percent >= 70) return "bg-purple-500";
    if (percent >= 40) return "bg-purple-600";
    return "bg-purple-800";
  };

  const getSkillBarColor = (level: number) => {
    if (level >= 4) return "bg-green-500";
    if (level >= 3) return "bg-amber-500";
    if (level >= 2) return "bg-orange-500";
    return "bg-zinc-500";
  };

  const handleColorChange = (crewId: string, color: string) => {
    useGameStore.setState((state) => ({
      crewRoster: state.crewRoster.map((c) =>
        c.id === crewId ? { ...c, customDotColor: color } : c
      ),
    }));
    setColorPickerOpen(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <IndustrialPanel
        title="CREW MANIFEST"
        subtitle="PERSONNEL MANAGEMENT · CINDER STATION"
      >
        <div className="flex items-center gap-2">
          <StatChip label="ROSTER" value={`${crewRoster.length}/${crewCapacity}`} variant="cyan" />
          <StatChip label="DAY" value={day} variant="amber" />
        </div>
      </IndustrialPanel>

      {/* Crew member cards */}
      <IndustrialPanel title="ACTIVE PERSONNEL">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {crewRoster.map((crew) => {
            const isSelected = crew.id === selectedCrewId;
            const healthPercent = (crew.hp / crew.maxHp) * 100;
            const staminaPercent = (crew.stamina / crew.maxStamina) * 100;
            const sanityPercent = (crew.sanity / crew.maxSanity) * 100;
            const daysEmployed = crew.hiredDay ? day - crew.hiredDay : day;

            return (
              <div
                key={crew.id}
                onClick={() => {
                  audio.playClick();
                  selectCrew(crew.id);
                }}
                className={`bg-black/26 border rounded-xl p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/8 shadow-[0_0_20px_rgba(56,224,199,0.2)]'
                    : 'border-white/8 hover:border-amber-400 hover:bg-amber-500/4'
                }`}
              >
                {/* Header with status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {/* Dot color */}
                      <div
                        className="w-3 h-3 rounded-full border border-white/20 cursor-pointer hover:scale-110 transition"
                        style={{ backgroundColor: crew.customDotColor || "#22c55e" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playClick();
                          setColorPickerOpen(colorPickerOpen === crew.id ? null : crew.id);
                        }}
                        title="Change indicator color"
                      />
                      <div className="font-['Orbitron'] font-extrabold text-base text-amber-400 glow-amber">
                        {crew.name}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 mb-2">
                      {BACKGROUNDS[crew.background]?.name || crew.background} · {daysEmployed} DAYS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {crew.isPlayer && (
                        <StatusPill variant="warning" label="CAPTAIN" icon="👑" />
                      )}
                      <StatusPill
                        variant={
                          crew.status === 'active' ? 'default' :
                          crew.status === 'injured' ? 'danger' :
                          crew.status === 'breakdown' ? 'warning' : 'info'
                        }
                        label={crew.status.toUpperCase()}
                      />
                      {isSelected && !crew.isPlayer && (
                        <StatusPill variant="default" label="ASSIGNED" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Color picker */}
                {colorPickerOpen === crew.id && (
                  <div className="mb-3 p-2 bg-black/40 border border-white/10 rounded-md">
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wide mb-2">INDICATOR COLOR</div>
                    <div className="flex gap-2 flex-wrap">
                      {DOT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleColorChange(crew.id, color);
                            audio.playClick();
                          }}
                          className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition ${
                            crew.customDotColor === color ? "border-white" : "border-white/20"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Traits */}
                {crew.traits.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {crew.traits.map((traitId) => {
                      const trait = TRAITS[traitId];
                      if (!trait) return null;
                      const categoryColor = 
                        trait.category === "positive" ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" :
                        trait.category === "negative" ? "bg-red-500/15 border-red-500/30 text-red-400" :
                        "bg-zinc-500/15 border-zinc-500/30 text-zinc-400";
                      return (
                        <span
                          key={traitId}
                          className={`px-2 py-0.5 text-[10px] uppercase tracking-wide rounded border ${categoryColor} cursor-help`}
                          title={trait.description}
                        >
                          {trait.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Status bars */}
                <div className="space-y-2 mb-3">
                  {/* Health */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide">HEALTH</div>
                      <div className={`text-xs font-['Orbitron'] font-bold ${
                        healthPercent >= 70 ? 'text-cyan-400' :
                        healthPercent >= 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {crew.hp}/{crew.maxHp}
                      </div>
                    </div>
                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/6">
                      <div
                        className={`h-full transition-all duration-500 ${getHealthColor(crew.hp, crew.maxHp)}`}
                        style={{ width: `${healthPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stamina */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide">STAMINA</div>
                      <div className={`text-xs font-['Orbitron'] font-bold ${
                        staminaPercent >= 70 ? 'text-cyan-400' :
                        staminaPercent >= 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {crew.stamina}/{crew.maxStamina}
                      </div>
                    </div>
                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/6">
                      <div
                        className={`h-full transition-all duration-500 ${getStaminaColor(crew.stamina, crew.maxStamina)}`}
                        style={{ width: `${staminaPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Sanity */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide">🧠 SANITY</div>
                      <div className={`text-xs font-['Orbitron'] font-bold ${
                        sanityPercent >= 70 ? 'text-cyan-400' :
                        sanityPercent >= 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {crew.sanity}/{crew.maxSanity}
                      </div>
                    </div>
                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/6">
                      <div
                        className={`h-full transition-all duration-500 ${getSanityColor(crew.sanity, crew.maxSanity)}`}
                        style={{ width: `${sanityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Warning messages */}
                {(crew.hp < crew.maxHp || staminaPercent < 30 || sanityPercent < 40) && (
                  <div className="mb-3 space-y-1">
                    {crew.hp < crew.maxHp && (
                      <div className="text-[10px] text-red-400 flex items-center gap-1">
                        NEEDS MEDICAL ATTENTION
                      </div>
                    )}
                    {staminaPercent < 30 && (
                      <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                        LOW STAMINA - NEEDS REST
                      </div>
                    )}
                    {sanityPercent < 40 && (
                      <div className="text-[10px] text-purple-300 flex items-center gap-1">
                        LOW SANITY - BREAKDOWN RISK
                      </div>
                    )}
                  </div>
                )}

                {/* Skills */}
                <div className="bg-black/40 border border-white/6 rounded-md p-2 space-y-1.5">
                  <div className="text-[9px] text-zinc-400 uppercase tracking-wider mb-1">SKILLS</div>
                  {[
                    { key: 'technical', icon: '', name: 'Technical' },
                    { key: 'combat', icon: '', name: 'Combat' },
                    { key: 'salvage', icon: '', name: 'Salvage' },
                    { key: 'piloting', icon: '', name: 'Piloting' },
                  ].map(({ key, icon, name }) => {
                    const level = crew.skills[key as keyof typeof crew.skills];
                    const xp = crew.skillXp[key as keyof typeof crew.skillXp];
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-0.5">
                          <div className="text-[10px] text-zinc-300">{icon} {name}</div>
                          <div className={`text-[10px] font-['Orbitron'] font-bold ${getSkillColor(level)}`}>
                            LV.{level} <span className="text-zinc-500">({xp} XP)</span>
                          </div>
                        </div>
                        <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getSkillBarColor(level)} transition-all`}
                            style={{ width: `${(level / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action button */}
                {!isSelected && !crew.isPlayer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.playClick();
                      selectCrew(crew.id);
                    }}
                    className="mt-3 w-full bg-amber-500/15 border border-amber-500 text-amber-400 py-2 text-xs uppercase tracking-wide rounded-md hover:bg-amber-500/25 transition font-['Orbitron'] font-bold"
                  >
                    → Assign to Next Run
                  </button>
                )}

                {isSelected && !crew.isPlayer && (
                  <div className="mt-3 w-full bg-cyan-500/15 border border-cyan-500 text-cyan-400 py-2 text-xs uppercase tracking-wide rounded-md text-center font-['Orbitron'] font-bold">
                    Currently Assigned
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: 5 - crewRoster.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="bg-black/15 border-2 border-dashed border-white/8 rounded-xl p-4 flex items-center justify-center min-h-[300px]"
            >
              <div className="text-center text-zinc-600">
                <div className="text-4xl mb-2">➕</div>
                <div className="text-sm">EMPTY SLOT</div>
                <div className="text-xs mt-1">Hire crew from station</div>
              </div>
            </div>
          ))}
        </div>
      </IndustrialPanel>

      {/* Actions */}
      <IndustrialPanel>
        <div className="grid grid-cols-1 gap-3">
          <IndustrialButton
            onClick={() => {
              audio.playTransition();
              onNavigate("hub");
            }}
            icon="home"
            title="← Back to Station"
            description="Return to hub"
          />
        </div>
      </IndustrialPanel>
    </div>
  );
}
