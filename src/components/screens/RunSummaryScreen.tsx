import { useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import { showSuccessNotification } from "../../utils/notifications";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import { useAudio } from "../../hooks/useAudio";

import type { ScreenProps } from "../../types";

export default function RunSummaryScreen({ onNavigate }: ScreenProps) {
  const { currentRun } = useGameStore((s) => ({ currentRun: s.currentRun }));
  const audio = useAudio();

  useEffect(() => {
    audio.playSuccess();
  }, []);

  if (!currentRun) {
    return (
      <div className="max-w-4xl mx-auto">
        <IndustrialPanel title="ERROR" variant="danger">
          <div className="mb-4">No run to summarize.</div>
          <IndustrialButton 
            onClick={() => onNavigate("hub")}
            title="Return to Hub"
          />
        </IndustrialPanel>
      </div>
    );
  }

  const total = currentRun.collectedLoot.reduce((s, l) => s + l.value, 0);

  // Calculate efficiency metrics
  const successRate = currentRun.stats?.roomsAttempted
    ? currentRun.stats.roomsSucceeded / currentRun.stats.roomsAttempted
    : 0;
  const efficiency = Math.round(successRate * 100);

  const xpTotal = Object.values(currentRun.stats?.xpGained || {}).reduce(
    (sum, val) => sum + (typeof val === "number" ? val : 0),
    0,
  );

  const onReturn = () => {
    // Show completion summary
    showSuccessNotification(
      "Run Complete!",
      `Earned ${total} CR, ${xpTotal} XP`,
    );
    audio.playTransition();
    onNavigate("hub");
  };

  // Calculate notable loot (top 4 by value)
  const notableLoot = [...currentRun.collectedLoot]
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  return (
    <div className="max-w-[800px] mx-auto flex items-center justify-center min-h-screen py-8">
      {/* Success vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(56, 224, 199, 0.1), transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full">
        <IndustrialPanel
          title="✓ MISSION COMPLETE"
          subtitle="SALVAGE RUN SUMMARY · {currentRun.wreckData?.name?.toUpperCase() || 'UNKNOWN WRECK'}"
          className="border-2 border-cyan-500/30 shadow-[0_0_40px_rgba(56,224,199,0.15)]"
        >
          {/* Success Banner */}
          <div className="bg-green-500/8 border border-green-500/25 rounded-xl p-5 mb-6 text-center">
            <div className="text-6xl mb-3">🎯</div>
            <div className="font-['Orbitron'] font-extrabold text-xl text-green-400 uppercase tracking-wide glow-ok mb-2">
              SUCCESSFUL OPERATION
            </div>
            <div className="text-sm text-zinc-400">
              All crew returned safely · Cargo secured
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Loot Collected
              </div>
              <div className="font-['Orbitron'] font-extrabold text-3xl text-green-400 glow-ok">
                +{(total / 1000).toFixed(1)}K
              </div>
            </div>
            <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Fuel Spent
              </div>
              <div className="font-['Orbitron'] font-extrabold text-3xl text-cyan-400 glow-cyan">
                -{currentRun.stats?.fuelSpent ?? 0}
              </div>
            </div>
            <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Rooms Explored
              </div>
              <div className="font-['Orbitron'] font-extrabold text-3xl text-cyan-400 glow-cyan">
                {currentRun.stats?.roomsSucceeded ?? 0} / {currentRun.stats?.roomsAttempted ?? 0}
              </div>
            </div>
            <div className="bg-black/30 border border-white/8 rounded-xl p-4 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">
                Time Elapsed
              </div>
              <div className="font-['Orbitron'] font-extrabold text-3xl text-cyan-400 glow-cyan">
                --m
              </div>
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="mb-6">
            <div className="text-xs text-amber-400 uppercase tracking-wider text-center mb-3">
              PERFORMANCE BREAKDOWN
            </div>
            <div className="bg-black/26 border border-white/8 rounded-xl p-4">
              {[
                { label: "Total Loot Value", value: `+${total.toLocaleString()}₵`, positive: true },
                { label: "Auto-Salvage Bonus", value: "+0₵", positive: true },
                { label: "Fuel Cost", value: `-${currentRun.stats?.fuelSpent ?? 0} fuel`, negative: true },
                { label: "Hazards Encountered", value: 0 },
                { label: "Crew Injuries", value: 0 },
                { label: "Efficiency Rating", value: `${efficiency}%`, positive: efficiency >= 80 },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-b-0"
                >
                  <span className="text-sm">{stat.label}</span>
                  <span className={`font-['Orbitron'] font-bold text-sm ${
                    stat.positive ? 'text-green-400' : stat.negative ? 'text-red-400' : 'text-cyan-400'
                  }`}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notable Salvage */}
          {notableLoot.length > 0 && (
            <div className="mb-6">
              <div className="text-xs text-amber-400 uppercase tracking-wider text-center mb-3">
                NOTABLE SALVAGE
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {notableLoot.map((item, i) => (
                  <div key={i} className="bg-black/30 border border-white/6 rounded-lg p-2.5 text-center">
                    <div className="text-2xl mb-1">
                      📦
                    </div>
                    <div className="text-[10px] text-zinc-400 leading-tight">
                      {item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* Action */}
          <IndustrialButton
            variant="primary"
            onClick={onReturn}
            title="→ Return to Station"
            description="Proceed to hub and manage loot"
          />
        </IndustrialPanel>
      </div>
    </div>
  );
}
