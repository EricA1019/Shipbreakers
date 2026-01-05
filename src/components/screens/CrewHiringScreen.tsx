import { useEffect, useMemo } from "react";
import { useGameStore } from "../../stores/gameStore";
import { BACKGROUNDS } from "../../game/data/backgrounds";
import { TRAITS } from "../../game/data/traits";
import { calculateCrewCapacity } from "../../services/CrewService";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import { useAudio } from "../../hooks/useAudio";

import type { ScreenProps } from "../../types";

export default function CrewHiringScreen({ onNavigate }: ScreenProps) {
  const audio = useAudio();

  const {
    hireCandidates,
    dailyMarketRefresh,
    hireCrew,
    credits,
    crewRoster,
    playerShip,
    day,
  } = useGameStore((s) => ({
    hireCandidates: s.hireCandidates,
    dailyMarketRefresh: s.dailyMarketRefresh,
    hireCrew: s.hireCrew,
    credits: s.credits,
    crewRoster: s.crewRoster,
    playerShip: s.playerShip,
    day: s.day,
  }));

  const capacity = calculateCrewCapacity(playerShip);
  const isFull = crewRoster.length >= capacity;

  useEffect(() => {
    audio.playTransition();
  }, []);

  useEffect(() => {
    if (hireCandidates.length === 0) {
      dailyMarketRefresh();
    }
  }, [hireCandidates.length, dailyMarketRefresh]);

  const creditsLabel = useMemo(() => {
    if (credits >= 1000) return `${(credits / 1000).toFixed(1)}K`;
    return `${credits}`;
  }, [credits]);

  const getSkillColor = (level: number) => {
    if (level >= 4) return "text-green-400";
    if (level >= 3) return "text-amber-400";
    if (level >= 2) return "text-orange-400";
    return "text-zinc-400";
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <IndustrialPanel
        title="CREW MARKET"
        subtitle="CANDIDATE REVIEW · CINDER STATION"
      >
        <div className="flex items-center gap-2">
          <StatChip label="CREDITS" value={`${creditsLabel} CR`} variant="amber" />
          <StatChip label="ROSTER" value={`${crewRoster.length}/${capacity}`} variant={isFull ? "red" : "cyan"} />
          <StatChip label="DAY" value={day} variant="amber" />
          <IndustrialButton
            title="Back"
            description="Return to hub"
            variant="info"
            onClick={() => {
              audio.playClick();
              onNavigate("hub");
            }}
          />
        </div>
      </IndustrialPanel>

      <IndustrialPanel title="AVAILABLE HIRES">
        {hireCandidates.length === 0 ? (
          <div className="bg-black/20 border border-white/10 rounded-xl p-6 text-center">
            <div className="text-zinc-200 font-semibold mb-1">No candidates available</div>
            <div className="text-xs text-zinc-400">Check back after the daily market refresh</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hireCandidates.map((c) => {
              const canAfford = credits >= c.cost;
              const disabled = isFull || !canAfford;

              const backgroundName = c.background ? (BACKGROUNDS[c.background]?.name ?? c.background) : "Unknown";
              const traits = c.traits ?? [];

              return (
                <div
                  key={c.id}
                  className="bg-black/26 border border-white/8 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="font-['Orbitron'] font-extrabold text-base text-amber-400 glow-amber">
                        {c.name}
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {backgroundName}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-amber-100 font-['Orbitron'] font-bold">
                        {c.cost} CR
                      </div>
                      {!canAfford && (
                        <div className="text-[10px] text-red-400 font-semibold">
                          Insufficient credits
                        </div>
                      )}
                      {isFull && (
                        <div className="text-[10px] text-red-400 font-semibold">
                          Roster full
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-black/30 border border-white/8 rounded px-2 py-1">
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide">TECH</div>
                      <div className={`font-['Orbitron'] font-bold ${getSkillColor(c.skills.technical)}`}>{c.skills.technical}</div>
                    </div>
                    <div className="bg-black/30 border border-white/8 rounded px-2 py-1">
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide">COMBAT</div>
                      <div className={`font-['Orbitron'] font-bold ${getSkillColor(c.skills.combat)}`}>{c.skills.combat}</div>
                    </div>
                    <div className="bg-black/30 border border-white/8 rounded px-2 py-1">
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide">SALVAGE</div>
                      <div className={`font-['Orbitron'] font-bold ${getSkillColor(c.skills.salvage)}`}>{c.skills.salvage}</div>
                    </div>
                    <div className="bg-black/30 border border-white/8 rounded px-2 py-1">
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wide">PILOT</div>
                      <div className={`font-['Orbitron'] font-bold ${getSkillColor(c.skills.piloting)}`}>{c.skills.piloting}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">TRAITS</div>
                    {traits.length === 0 ? (
                      <div className="text-xs text-zinc-500">No notable traits</div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {traits.map((traitId) => {
                          const trait = TRAITS[traitId];
                          if (!trait) return null;
                          const categoryColor =
                            trait.category === "positive"
                              ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                              : trait.category === "negative"
                                ? "bg-red-500/15 border-red-500/30 text-red-400"
                                : "bg-zinc-500/15 border-zinc-500/30 text-zinc-400";

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
                  </div>

                  <div className="flex gap-2">
                    <button
                      className={`w-full px-4 py-2 font-bold rounded border transition ${
                        !disabled
                          ? "bg-amber-500 text-zinc-900 hover:bg-amber-400 border-amber-300/40"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60 border-white/10"
                      }`}
                      disabled={disabled}
                      onClick={() => {
                        audio.playClick();
                        const ok = hireCrew(c);
                        if (ok) onNavigate("hub");
                      }}
                    >
                      {isFull ? "Roster Full" : !canAfford ? "Need Credits" : "Hire"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </IndustrialPanel>
    </div>
  );
}
