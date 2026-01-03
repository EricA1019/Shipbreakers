/**
 * IndustrialButton - Die-cut tab style button with title and description
 * 
 * Larger button style for primary actions, featuring both a title and
 * descriptive text. Includes audio feedback on click.
 * 
 * @example Primary action button
 * ```tsx
 * <IndustrialButton 
 *   title="🗺️ Mission Select"
 *   description="Browse wrecks & plan runs"
 *   variant="primary"
 *   onClick={() => navigate('wreck-select')}
 * />
 * ```
 * 
 * @example Danger action
 * ```tsx
 * <IndustrialButton 
 *   title="🚨 Emergency Evac"
 *   description="Immediate evac · forfeit haul"
 *   variant="danger"
 *   onClick={handleEmergencyEvac}
 * />
 * ```
 * 
 * @example Full width
 * ```tsx
 * <IndustrialButton 
 *   title="💰 Sell All Loot"
 *   description="Cash out entire cargo hold (18,400 credits)"
 *   variant="success"
 *   fullWidth
 *   onClick={sellAllLoot}
 * />
 * ```
 */

import { useAudio } from "../../hooks/useAudio";

interface IndustrialButtonProps {
  /** Button title (displayed in Orbitron font) */
  title: string;
  /** Description text (displayed in smaller muted font) */
  description?: string;
  /** Visual variant */
  variant?: "primary" | "success" | "danger" | "info" | "default";
  /** Whether button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Make button full width */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function IndustrialButton({
  title,
  description,
  variant = "default",
  disabled = false,
  onClick,
  fullWidth = false,
  className = "",
}: IndustrialButtonProps) {
  const audio = useAudio();

  const variantStyles = {
    default: "text-[var(--text)]",
    primary: "text-[var(--haz)]",
    success: "text-[var(--ok)]",
    danger: "text-[var(--bad)]",
    info: "text-[var(--cyan)]",
  };

  const titleColor = variantStyles[variant];

  const handleClick = () => {
    if (!disabled && onClick) {
      audio.playClick();
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        rounded-[14px] border border-[rgba(255,255,255,0.10)] 
        px-3 py-3 text-left relative overflow-hidden 
        transition-all duration-[120ms] ease-out
        min-h-[70px] flex flex-col justify-center
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:-translate-y-[1px] hover:border-[rgba(242,178,51,0.28)]"}
        ${className}
      `}
      style={{
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0)),
          rgba(0,0,0,0.22)
        `,
        boxShadow: disabled ? "none" : "var(--glowA)",
      }}
    >
      <div className="relative z-10">
        <div
          className={`font-['Orbitron'] tracking-[0.12em] uppercase text-[13px] mb-1.5 font-extrabold ${titleColor}`}
        >
          {title}
        </div>
        {description && (
          <div className="text-[var(--muted)] text-[11px] leading-[1.4]">
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
