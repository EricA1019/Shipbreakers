import React from "react";

interface ScannerProps {
  width?: string;
  height?: string;
  color?: string;
  speed?: number; // seconds
}

export default function ScannerEffect({
  width = "100%",
  height = "100%",
  color = "cyan",
  speed = 2,
}: ScannerProps) {
  const style: React.CSSProperties = {
    width,
    height,
  };

  const scanStyle: React.CSSProperties = {
    animationDuration: `${speed}s`,
    background:
      color === "cyan"
        ? "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.08) 45%, rgba(34,211,238,0.22) 50%, rgba(34,211,238,0.08) 55%, transparent 100%)"
        : undefined,
  };

  return (
    <div className="relative overflow-hidden pointer-events-none" style={style}>
      <div className="scan-line" style={scanStyle} />
    </div>
  );
}
