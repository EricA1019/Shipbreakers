import { useMemo } from "react";

interface RadarProps {
  size?: number;
  blips?: { x: number; y: number; label?: string }[];
}

export default function RadarDisplay({ size = 160, blips = [] }: RadarProps) {
  const blipElements = useMemo(
    () =>
      blips.map((b, i) => {
        const left = `${(b.x + 0.5) * 100}%`;
        const top = `${(b.y + 0.5) * 100}%`;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-amber-500 shadow-glow-amber"
            style={{ left, top, transform: "translate(-50%, -50%)" }}
            title={b.label}
          />
        );
      }),
    [blips],
  );

  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full overflow-hidden bg-zinc-900/60 border border-amber-600/10"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full opacity-40"
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          stroke="#2dd4bf"
          strokeWidth="0.5"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="32"
          stroke="#2dd4bf"
          strokeWidth="0.3"
          fill="none"
        />
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke="#2dd4bf"
          strokeWidth="0.2"
        />
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="100"
          stroke="#2dd4bf"
          strokeWidth="0.2"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-0 h-0 rounded-full radar-sweep"
          style={{
            width: size,
            height: size,
            boxShadow: "inset 0 0 40px rgba(34,211,238,0.05)",
          }}
        />
      </div>
      {blipElements}
    </div>
  );
}
