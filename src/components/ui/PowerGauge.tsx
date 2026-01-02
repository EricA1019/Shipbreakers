import React from "react";

interface PowerGaugeProps {
  used: number;
  capacity: number;
  className?: string;
}

export const PowerGauge: React.FC<PowerGaugeProps> = ({
  used,
  capacity,
  className = "",
}) => {
  const pct = capacity === 0 ? 0 : Math.min(1, used / capacity);
  const percentText = Math.round(pct * 100);
  const statusColor =
    pct < 0.8 ? "bg-green-500" : pct < 1 ? "bg-amber-500" : "bg-red-500";

  return (
    <div
      className={`p-2 bg-zinc-800 border border-amber-600/20 rounded ${className}`}
    >
      <div className="flex justify-between items-center mb-1 font-mono text-xs text-amber-100">
        <div>POWER</div>
        <div>
          {used}/{capacity}
        </div>
      </div>
      <div className="h-3 bg-zinc-700 rounded overflow-hidden">
        <div
          className={`${statusColor} h-3 transition-all`}
          style={{ width: `${percentText}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-amber-200 font-mono">
        {percentText}%
      </div>
    </div>
  );
};

export default PowerGauge;
