/**
 * StatChip - Glowing metric display chip for key statistics
 * 
 * Used for displaying important metrics like credits, fuel, cargo, etc.
 * with automatic color-coding and glow effects.
 * 
 * @example Basic usage
 * ```tsx
 * <StatChip label="CREDITS" value="48.2K" variant="cyan" />
 * ```
 * 
 * @example In a flex container
 * ```tsx
 * <div className="flex gap-3">
 *   <StatChip label="DAY" value="042" variant="amber" />
 *   <StatChip label="FUEL" value="75%" variant="green" />
 *   <StatChip label="HEAT" value="19" variant="orange" />
 * </div>
 * ```
 */

interface StatChipProps {
  /** Label text (displayed in small uppercase muted text) */
  label: string;
  /** Value to display (displayed in large Orbitron font) */
  value: string | number;
  /** Color variant affecting value text color and glow */
  variant?: "amber" | "cyan" | "green" | "red" | "orange";
  /** Additional CSS classes */
  className?: string;
}

export default function StatChip({
  label,
  value,
  variant = "amber",
  className = "",
}: StatChipProps) {
  const variantStyles = {
    amber: {
      color: "text-[var(--haz)]",
      glow: "var(--glowA)",
    },
    cyan: {
      color: "text-[var(--cyan)]",
      glow: "var(--glowC)",
    },
    green: {
      color: "text-[var(--ok)]",
      glow: "0 0 18px rgba(113,255,120,.14)",
    },
    red: {
      color: "text-[var(--bad)]",
      glow: "0 0 18px rgba(255,75,75,.14)",
    },
    orange: {
      color: "text-[var(--rust)]",
      glow: "0 0 18px rgba(255,106,42,.14)",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`min-w-[110px] rounded-xl border border-[rgba(255,255,255,0.09)] 
      px-3 py-2 relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15))",
      }}
    >
      {/* Shine animation */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          transform: "translateX(-120%)",
          animation: "shine 4.8s ease-in-out infinite",
        }}
      />

      <div className="relative z-10">
        <div className="text-[10px] text-[var(--muted)] tracking-[0.10em] uppercase">
          {label}
        </div>
        <div
          className={`font-['Orbitron'] text-xl font-extrabold tracking-[0.02em] mt-0.5 ${styles.color}`}
          style={{ textShadow: styles.glow }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
