import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  glowColor?: 'amber' | 'green' | 'red' | 'cyan';
}

export default function CyberButton({ 
  children, 
  variant = 'primary', 
  glowColor, 
  className = '', 
  disabled,
  ...props 
}: CyberButtonProps) {
  const baseStyles = 'px-4 py-2 font-bold tracking-wider uppercase text-sm transition-all';
  
  const variantStyles = {
    primary: 'bg-amber-600 text-zinc-900 hover:bg-amber-500',
    secondary: 'bg-zinc-800 text-amber-50 border border-amber-600/30 hover:border-amber-500/50',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  };
  
  const disabledStyles = disabled 
    ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-600' 
    : '';
  
  const glowClass = glowColor && !disabled ? `text-glow-${glowColor}` : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${glowClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {disabled ? `[OFFLINE]` : children}
    </button>
  );
}
