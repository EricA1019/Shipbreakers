import type { ReactNode } from 'react';

interface CyberPanelProps {
  children: ReactNode;
  title?: string;
  variant?: 'default' | 'warning' | 'terminal';
  className?: string;
}

export default function CyberPanel({ children, title, variant = 'default', className = '' }: CyberPanelProps) {
  const variantStyles = {
    default: 'bg-zinc-900 border-amber-600/30',
    warning: 'bg-red-950/20 border-red-600/50',
    terminal: 'panel-terminal border-green-600/30',
  };

  return (
    <div className={`noise-overlay border ${variantStyles[variant]} p-6 relative ${className}`}>
      {title && (
        <div className={`text-xs font-semibold tracking-wider uppercase mb-4 ${
          variant === 'warning' ? 'text-red-500 text-glow-red' :
          variant === 'terminal' ? 'text-green-400 text-glow-green' :
          'text-amber-500 text-glow-amber'
        }`}>
          {title}
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
