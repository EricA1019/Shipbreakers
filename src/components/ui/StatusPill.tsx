/**
 * StatusPill - Compact status indicator with optional animated dot
 * 
 * Used for displaying connection status, operational state, and other
 * real-time indicators in panel headers.
 * 
 * @example With pulsing dot
 * ```tsx
 * <StatusPill icon="dot" label="SCAN ACTIVE" />
 * ```
 * 
 * @example With custom icon
 * ```tsx
 * <StatusPill icon="⚠️" label="3 DAYS LEFT" variant="warning" />
 * ```
 * 
 * @example Without icon
 * ```tsx
 * <StatusPill label="DOCKED" />
 * ```
 */

interface StatusPillProps {
  /** Label text to display */
  label: string;
  /** Icon to show before label - use "dot" for animated dot, or any emoji/text */
  icon?: string | "dot";
  /** Visual variant affecting dot color */
  variant?: "default" | "warning" | "danger" | "info";
  /** Additional CSS classes */
  className?: string;
}

export default function StatusPill({
  label,
  icon,
  variant = "default",
  className = "",
}: StatusPillProps) {
  const variantStyles = {
    default: {
      dotBg: "var(--ok)",
      dotShadow: "0 0 12px rgba(113,255,120,0.35)",
    },
    warning: {
      dotBg: "var(--haz)",
      dotShadow: "0 0 12px rgba(242,178,51,0.35)",
    },
    danger: {
      dotBg: "var(--bad)",
      dotShadow: "0 0 12px rgba(255,75,75,0.35)",
    },
    info: {
      dotBg: "var(--cyan)",
      dotShadow: "0 0 12px rgba(56,224,199,0.35)",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`inline-flex gap-2 items-center px-[10px] py-[6px] rounded-full 
      border border-[rgba(255,255,255,0.10)] text-[var(--muted)] 
      text-[11px] tracking-[0.08em] uppercase ${className}`}
      style={{ background: "rgba(0,0,0,0.30)" }}
    >
      {icon && (
        <>
          {icon === "dot" ? (
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: styles.dotBg,
                boxShadow: styles.dotShadow,
                animation: "pulse 1.6s ease-in-out infinite",
              }}
            />
          ) : (
            <span className="text-sm">{icon}</span>
          )}
        </>
      )}
      <span>{label}</span>
    </div>
  );
}
