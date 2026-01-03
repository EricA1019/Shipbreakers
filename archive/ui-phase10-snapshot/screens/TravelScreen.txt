import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../stores/gameStore";

import type { ScreenProps } from "../../types";

export default function TravelScreen({ onNavigate }: ScreenProps) {
  const { currentRun, travelToWreck, availableWrecks, fuel } = useGameStore(
    (s) => ({
      currentRun: s.currentRun,
      travelToWreck: s.travelToWreck,
      availableWrecks: s.availableWrecks,
      fuel: s.fuel,
    }),
  );
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentRun) return;
    const wreck = availableWrecks.find((w) => w.id === currentRun.wreckId);
    const duration = Math.min(8000, (wreck?.distance ?? 1) * 300);
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        travelToWreck(currentRun.wreckId);
        onNavigate("salvage");
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentRun, availableWrecks]);

  if (!currentRun)
    return (
      <div>
        No active run. <button onClick={() => onNavigate("hub")}>Back</button>
      </div>
    );

  const wreck = availableWrecks.find((w) => w.id === currentRun.wreckId);

  const handleSkip = () => {
    setProgress(100);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    travelToWreck(currentRun.wreckId);
    onNavigate("salvage");
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
              TRAVEL
            </div>
            <div className="text-amber-100 font-bold mb-2">
              🚀 Approaching target — {wreck?.name ?? "Unknown Vessel"}
            </div>
            <div className="text-zinc-400 text-xs mb-2">
              Distance: {wreck?.distance ?? "?"} AU • Fuel: {fuel} CR
            </div>
            <div className="w-80 bg-zinc-700 h-3 overflow-hidden rounded mb-2">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-zinc-400 text-xs">{Math.floor(progress)}%</div>
          </div>

          <div className="text-sm text-zinc-400">
            {wreck ? "Destination: Unknown Vessel" : ""}
          </div>
        </div>

        {/* Ship sprite */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20"
          style={{
            left: `${Math.max(2, (progress / 100) * 80)}%`,
            transition: "left 120ms linear",
          }}
        >
          <div className="text-4xl animate-[engine-pulse_1.2s_ease-in-out_infinite]">
            🚀
          </div>
        </div>

        {/* Wreck icon on right */}
        <div
          className="absolute right-8 top-1/2 -translate-y-1/2 z-10"
          style={{
            transform: `translateY(-50%) scale(${0.5 + (progress / 100) * 0.5})`,
            transition: "transform 120ms linear",
          }}
        >
          <div className="text-3xl opacity-80">🛰️</div>
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 bg-zinc-700 px-2 py-1 text-xs border border-amber-600/30 z-30"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
