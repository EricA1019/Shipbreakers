import { useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import { useAudio } from "../../hooks/useAudio";

import type { ScreenProps } from "../../types";

export default function GameOverScreen({ onNavigate }: ScreenProps) {
  const { resetGame, stats } = useGameStore((s) => ({
    resetGame: s.resetGame,
    stats: s.stats,
  }));

  const audio = useAudio();

  useEffect(() => {
    audio.playError();
  }, []);

  // Calculate some additional stats
  const totalEarned = (stats?.totalCreditsEarned ?? 0);
  const itemsCollected = (stats?.totalItemsCollected ?? 0);

  return (
    <div className="max-w-[700px] mx-auto flex items-center justify-center min-h-screen py-8">
      {/* Red vignette overlay for dramatic effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 75, 75, 0.15), transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full">
        <IndustrialPanel
          title="⚠️ MISSION FAILURE"
          subtitle="CAREER TERMINATED · SALVAGE LICENSE REVOKED"
          variant="danger"
          className="border-2 border-red-500/30 shadow-[0_0_40px_rgba(255,75,75,0.2)]"
        >
          {/* Reason Box */}
          <div className="bg-red-500/8 border border-red-500/25 rounded-xl p-5 mb-6 text-center">
            <div className="text-5xl mb-3">☠️</div>
            <div className="font-['Orbitron'] font-bold text-lg text-red-400 uppercase tracking-wide mb-2">
              TOTAL PARTY WIPE
            </div>
            <div className="text-sm text-zinc-400">
              All crew members incapacitated · No survivors
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Days Survived
              </div>
              <div className="font-['Orbitron'] font-extrabold text-3xl text-cyan-400 glow-cyan">
                {stats?.daysPlayed ?? 0}
              </div>
            </div>
            <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Total Earned
              </div>
              <div className="font-['Orbitron'] font-extrabold text-3xl text-cyan-400 glow-cyan">
                {(totalEarned / 1000).toFixed(1)}K
              </div>
            </div>
            <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Missions Run
              </div>
              <div className="font-['Orbitron'] font-extrabold text-3xl text-cyan-400 glow-cyan">
                {stats?.totalWrecksCleared ?? 0}
              </div>
            </div>
            <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Final Debt
              </div>
              <div className="font-['Orbitron'] font-extrabold text-3xl text-red-400 glow-red">
                0
              </div>
            </div>
          </div>

          {/* Career Summary */}
          <div className="mb-6">
            <div className="text-xs text-amber-400 uppercase tracking-wider text-center mb-3">
              CAREER SUMMARY
            </div>
            <div className="bg-black/26 border border-white/8 rounded-xl p-4">
              {[
                { label: "Wrecks Salvaged", value: stats?.totalWrecksCleared ?? 0 },
                { label: "Items Collected", value: itemsCollected },
                { label: "Rooms Explored", value: 0 },
                { label: "Crew Hired", value: 0 },
                { label: "Injuries Sustained", value: 0 },
                { label: "License Tier Reached", value: "BASIC" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-3 border-b border-white/5 last:border-b-0"
                >
                  <span className="text-sm">{stat.label}</span>
                  <span className="font-['Orbitron'] font-bold text-sm text-amber-400">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="bg-black/26 border border-white/6 rounded-xl p-4 mb-7 text-center">
            <div className="text-xs text-zinc-400 italic">
              "Another crew bites the dust. Should've been more careful out there, breaker.
              The void doesn't forgive mistakes."
            </div>
            <div className="text-[10px] text-zinc-500 mt-2 opacity-70">
              — Station Administrator
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <IndustrialButton
              variant="primary"
              onClick={() => {
                audio.playTransition();
                resetGame();
                onNavigate("hub");
              }}
              title="🔄 New Career"
              description="Start fresh with a new salvage license"
            />
          </div>
        </IndustrialPanel>
      </div>
    </div>
  );
}
