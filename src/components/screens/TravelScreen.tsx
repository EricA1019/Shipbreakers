import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useAudio } from "../../hooks/useAudio";
import Icon from "../ui/Icon";

import type { ScreenProps } from "../../types";

export default function TravelScreen({ onNavigate }: ScreenProps) {
  const {
    currentRun,
    availableWrecks,
    fuel,
    crewRoster,
    setRunCrewTask,
    resolveAssignedRun,
  } = useGameStore(
    (s) => ({
      currentRun: s.currentRun,
      availableWrecks: s.availableWrecks,
      fuel: s.fuel,
      crewRoster: s.crewRoster,
      setRunCrewTask: (s as any).setRunCrewTask,
      resolveAssignedRun: (s as any).resolveAssignedRun,
    }),
  );
  const audio = useAudio();
  const [phase, setPhase] = useState<"assign" | "traveling" | "resolving">(
    "assign",
  );
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    audio.playTransition();
    if (!currentRun) return;
    if (phase !== "traveling") return;

    const wreck = availableWrecks.find((w) => w.id === currentRun.wreckId);
    const duration = Math.min(8000, (wreck?.distance ?? 1) * 300);
    const start = performance.now();

    const arrive = async () => {
      setPhase("resolving");
      audio.playSuccess();
      try {
        await resolveAssignedRun({ speed: 2 });
      } finally {
        onNavigate("summary");
      }
    };

    const step = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        void arrive();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentRun, availableWrecks, phase, resolveAssignedRun, onNavigate, audio]);

  if (!currentRun)
    return (
      <div>
        No active run. <button onClick={() => onNavigate("hub")}>Back</button>
      </div>
    );

  const wreck = availableWrecks.find((w) => w.id === currentRun.wreckId);

  const handleBeginTravel = () => {
    audio.playClick();
    setProgress(0);
    setPhase("traveling");
  };

  const handleSkip = async () => {
    if (phase !== "traveling") return;
    audio.playClick();
    setProgress(100);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhase("resolving");
    try {
      await resolveAssignedRun({ speed: 2 });
    } finally {
      onNavigate("summary");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative bg-zinc-800 border border-amber-600/20 p-6 overflow-hidden">
        {/* Parallax star layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#05030a] via-[#0b1020] to-[#070418] opacity-60" />
          <div className="absolute inset-0 animate-[stars-far_8s_linear_infinite] bg-[url('/stars-far.svg')]" />
          <div className="absolute inset-0 animate-[stars-mid_6s_linear_infinite] bg-[url('/stars-mid.svg')]" />
          <div className="absolute inset-0 animate-[stars-near_4s_linear_infinite] bg-[url('/stars-near.svg')]" />
        </div>

        <div className="flex justify-between items-start z-10 relative">
          <div>
            <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">
              {phase === "assign"
                ? "ASSIGN TASKS"
                : phase === "traveling"
                  ? "TRAVEL"
                  : "RESOLVING"}
            </div>
            <div className="text-amber-100 font-bold mb-2">
              {wreck?.name ?? "Unknown Vessel"}
            </div>
            <div className="text-zinc-400 text-xs mb-2">
              Distance: {wreck?.distance ?? "?"} AU • Fuel: {fuel} CR
            </div>

            {phase !== "assign" && (
              <>
                <div className="w-80 bg-zinc-700 h-3 overflow-hidden rounded mb-2">
                  <div
                    className="h-full bg-amber-500 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-zinc-400 text-xs">
                  {phase === "resolving" ? "Resolving…" : `${Math.floor(progress)}%`}
                </div>
              </>
            )}
          </div>

          <div className="text-sm text-zinc-400">
            {wreck ? "Destination: Unknown Vessel" : ""}
          </div>
        </div>

        {phase === "assign" && (
          <div className="relative z-10 mt-4 border border-amber-600/20 bg-zinc-900/50 p-3">
            <div className="text-zinc-400 text-xs mb-2">
              Set each crew member to Salvage, Repair, or Rest.
            </div>
            <div className="grid grid-cols-1 gap-2">
              {(crewRoster || []).map((c) => {
                const currentTask =
                  (currentRun.assignments as any)?.[c.id] ?? "salvage";
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between border border-amber-600/10 bg-zinc-800/40 px-2 py-2"
                  >
                    <div className="text-xs text-amber-100">
                      {c.name}
                      <span className="text-zinc-500"> • {c.status}</span>
                    </div>
                    <select
                      value={currentTask}
                      onChange={(e) =>
                        setRunCrewTask(c.id, e.target.value as any)
                      }
                      className="bg-zinc-800 border border-amber-600/30 text-amber-100 text-xs px-2 py-1"
                    >
                      <option value="salvage">Salvage</option>
                      <option value="repair">Repair</option>
                      <option value="rest">Rest</option>
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={handleBeginTravel}
                className="bg-zinc-700 px-3 py-2 text-xs border border-amber-600/30"
              >
                Begin Approach
              </button>
            </div>
          </div>
        )}

        {/* Ship sprite */}
        {phase !== "assign" && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20"
            style={{
              left: `${Math.max(2, (progress / 100) * 80)}%`,
              transition: "left 120ms linear",
            }}
          >
            <div className="animate-[engine-pulse_1.2s_ease-in-out_infinite] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              <Icon name="rocket" size={36} tint="amber" />
            </div>
          </div>
        )}

        {/* Wreck icon on right */}
        {phase !== "assign" && (
          <div
            className="absolute right-8 top-1/2 -translate-y-1/2 z-10"
            style={{
              transform: `translateY(-50%) scale(${0.5 + (progress / 100) * 0.5})`,
              transition: "transform 120ms linear",
            }}
          >
            <div className="opacity-80 drop-shadow-[0_0_8px_rgba(59,130,246,0.45)]">
              <Icon name="ship" size={38} tint="cyan" />
            </div>
          </div>
        )}

        {/* Skip button */}
        {phase === "traveling" && (
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 bg-zinc-700 px-2 py-1 text-xs border border-amber-600/30 z-30"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
