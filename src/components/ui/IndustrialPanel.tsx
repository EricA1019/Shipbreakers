import type { ReactNode } from "react";

/**
 * IndustrialPanel - Reusable panel component with industrial "plated" aesthetic
 * 
 * Features:
 * - Hazard-tape header stripe (optional)
 * - Corner rivets decoration (optional)
 * - Inner rim shadow effect
 * - Support for header icons, subtitles, and right-aligned content
 * - Multiple variants for different contexts
 * 
 * @example Basic panel with title
 * ```tsx
 * <IndustrialPanel title="DECK SCANNER">
 *   <p>Content goes here</p>
 * </IndustrialPanel>
 * ```
 * 
 * @example Panel with subtitle and status pill
 * ```tsx
 * <IndustrialPanel 
 *   title="CREW STATUS" 
 *   subtitle="3 / 4 MEMBERS"
 *   headerRight={<StatusPill icon="✓" label="LINK STABLE" />}
 *   showTape
 * >
 *   <CrewList />
 * </IndustrialPanel>
 * ```
 * 
 * @example Warning variant with footer
 * ```tsx
 * <IndustrialPanel 
 *   title="SYSTEM ALERT" 
 *   variant="warning"
 *   showTape
 *   footer={<button>Acknowledge</button>}
 * >
 *   <p>Low oxygen detected</p>
 * </IndustrialPanel>
 * ```
 */

interface IndustrialPanelProps {
  children: ReactNode;
  /** Main header title (displayed in Orbitron font with glow) */
  title?: string;
  /** Subtitle text (displayed below title in smaller muted font) */
  subtitle?: string;
  /** Icon to display before title */
  icon?: string | ReactNode;
  /** Visual variant affecting border and title color */
  variant?: "default" | "warning" | "danger" | "success";
  /** Show hazard-tape stripe at top of panel */
  showTape?: boolean;
  /** Show decorative rivet corners */
  showRivets?: boolean;
  /** ReactNode to display in top-right of header (e.g., status pills, chips) */
  headerRight?: ReactNode;
  /** ReactNode to display at bottom of panel */
  footer?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export default function IndustrialPanel({
  children,
  title,
  subtitle,
  icon,
  variant = "default",
  showTape = false,
  showRivets = false,
  headerRight,
  footer,
  className = "",
}: IndustrialPanelProps) {
  // Variant styles
  const variantStyles = {
    default: {
      border: "border-[rgba(255,255,255,0.07)]",
      titleColor: "text-[var(--haz)]",
      tapeOpacity: "opacity-[0.22]",
    },
    warning: {
      border: "border-[rgba(242,178,51,0.25)]",
      titleColor: "text-[var(--haz)]",
      tapeOpacity: "opacity-[0.35]",
    },
    danger: {
      border: "border-[rgba(255,75,75,0.25)]",
      titleColor: "text-[var(--bad)]",
      tapeOpacity: "opacity-[0.35]",
    },
    success: {
      border: "border-[rgba(113,255,120,0.25)]",
      titleColor: "text-[var(--ok)]",
      tapeOpacity: "opacity-[0.25]",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`relative rounded-[var(--radius2)] bg-gradient-to-b from-[rgba(255,255,255,0.04)] to-transparent 
      border ${styles.border} overflow-hidden mb-4 ${className}`}
      style={{
        boxShadow: "var(--shadow)",
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)),
          linear-gradient(180deg, rgba(15,18,22,0.92), rgba(9,10,13,0.92))
        `,
      }}
    >
      {/* Hazard Tape */}
      {showTape && (
        <div
          className={`h-[10px] border-b border-[rgba(255,255,255,0.06)] ${styles.tapeOpacity}`}
          style={{
            background: "repeating-linear-gradient(45deg, rgba(242,178,51,0.95) 0 10px, rgba(0,0,0,0.78) 10px 20px)",
          }}
        />
      )}

      {/* Header */}
      {(title || headerRight) && (
        <div className="px-[18px] py-[14px] flex justify-between items-center gap-4 flex-wrap">
          <div className="flex-1">
            {title && (
              <div className="flex items-center gap-3">
                {icon && (
                  <span className="text-xl opacity-80">{icon}</span>
                )}
                <div>
                  <h2
                    className={`font-['Orbitron'] tracking-[0.14em] font-extrabold text-lg ${styles.titleColor}`}
                    style={{ textShadow: "var(--glowA)" }}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <div className="text-[var(--muted)] text-[11px] tracking-[0.08em] uppercase mt-1">
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {headerRight && <div className="flex gap-2 items-center flex-wrap">{headerRight}</div>}
        </div>
      )}

      {/* Body */}
      <div className="px-[18px] pb-[18px] relative z-10">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-[18px] pb-[18px] pt-0 border-t border-[rgba(255,255,255,0.06)] relative z-10">
          {footer}
        </div>
      )}

      {/* Inner Rim Shadow */}
      <div
        className="absolute inset-0 rounded-[var(--radius2)] pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.65)" }}
      />

      {/* Decorative Rivets */}
      {showRivets && (
        <div className="absolute inset-0 pointer-events-none opacity-90">
          {/* Top-left */}
          <div className="absolute top-[10px] left-[10px] w-[9px] h-[9px] rounded-full border border-[rgba(255,255,255,0.06)]"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%),
                radial-gradient(circle at 70% 70%, rgba(0,0,0,0.55), rgba(0,0,0,0) 60%),
                linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))
              `,
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.45))",
            }}
          />
          {/* Top-right */}
          <div className="absolute top-[10px] right-[10px] w-[9px] h-[9px] rounded-full border border-[rgba(255,255,255,0.06)]"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%),
                radial-gradient(circle at 70% 70%, rgba(0,0,0,0.55), rgba(0,0,0,0) 60%),
                linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))
              `,
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.45))",
            }}
          />
          {/* Bottom-left */}
          <div className="absolute bottom-[10px] left-[10px] w-[9px] h-[9px] rounded-full border border-[rgba(255,255,255,0.06)]"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%),
                radial-gradient(circle at 70% 70%, rgba(0,0,0,0.55), rgba(0,0,0,0) 60%),
                linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))
              `,
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.45))",
            }}
          />
          {/* Bottom-right */}
          <div className="absolute bottom-[10px] right-[10px] w-[9px] h-[9px] rounded-full border border-[rgba(255,255,255,0.06)]"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%),
                radial-gradient(circle at 70% 70%, rgba(0,0,0,0.55), rgba(0,0,0,0) 60%),
                linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))
              `,
              filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.45))",
            }}
          />
        </div>
      )}
    </div>
  );
}
