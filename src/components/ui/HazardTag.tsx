/**
 * HazardTag - Small badge for displaying hazard types or warning labels
 * 
 * Used in room displays, item cards, and anywhere hazards need to be flagged.
 * 
 * @example Basic hazard
 * ```tsx
 * <HazardTag label="RADIATION" />
 * ```
 * 
 * @example Multiple hazards
 * ```tsx
 * <div className="flex gap-2">
 *   <HazardTag label="FIRE" />
 *   <HazardTag label="UXO" />
 *   <HazardTag label="BREACH" />
 * </div>
 * ```
 * 
 * @example Info badge (non-hazard)
 * ```tsx
 * <HazardTag label="CLEAR" variant="info" />
 * ```
 */

interface HazardTagProps {
  /** Label text to display */
  label: string;
  /** Visual variant */
  variant?: "danger" | "warning" | "info";
  /** Additional CSS classes */
  className?: string;
}

export default function HazardTag({
  label,
  variant = "danger",
  className = "",
}: HazardTagProps) {
  const variantStyles = {
    danger: {
      border: "border-[rgba(255,75,75,0.28)]",
      bg: "rgba(0,0,0,0.24)",
      color: "text-[rgba(255,195,195,0.95)]",
    },
    warning: {
      border: "border-[rgba(242,178,51,0.28)]",
      bg: "rgba(0,0,0,0.24)",
      color: "text-[rgba(255,223,155,0.95)]",
    },
    info: {
      border: "border-[rgba(255,255,255,0.12)]",
      bg: "rgba(0,0,0,0.24)",
      color: "text-[var(--muted)]",
    },
  };

  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-block px-2 py-1 rounded-full border ${styles.border} ${styles.color} 
      text-[10px] tracking-[0.10em] uppercase whitespace-nowrap ${className}`}
      style={{ background: styles.bg }}
    >
      {label}
    </span>
  );
}
