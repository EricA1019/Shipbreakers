import { useEffect, useState } from 'react';

interface ScanningProgressProps {
  label?: string;
  duration?: number;
  onComplete?: () => void;
}

export function ScanningProgress({ label = 'SCANNING...', duration = 5000, onComplete }: ScanningProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onComplete?.();
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="space-y-3">
      <div className="text-cyan-400 text-sm text-glow-cyan">{label}</div>
      <div className="relative h-4 bg-zinc-800 border border-zinc-700 overflow-hidden">
        {progress < 100 && <div className="scan-line" />}
        <div
          className="absolute h-full bg-cyan-500 transition-all duration-100"
          style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }}
        />
        <div
          className="absolute h-full w-1 bg-cyan-300 animate-pulse"
          style={{ left: `${progress}%`, boxShadow: '0 0 15px rgba(103, 232, 249, 0.8)' }}
        />
      </div>
      <div className="text-zinc-400 text-xs font-mono">
        [{progress}%] {'█'.repeat(Math.floor(progress / 5))}{'░'.repeat(20 - Math.floor(progress / 5))}
      </div>
    </div>
  );
}

interface RadarDisplayProps {
  contacts?: number;
  size?: number;
}

export function RadarDisplay({ contacts = 3, size = 192 }: RadarDisplayProps) {
  const [pings, setPings] = useState<Array<{ id: number; angle: number; distance: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pings.length < contacts) {
        const newPing = {
          id: Date.now(),
          angle: Math.random() * Math.PI * 2,
          distance: 20 + Math.random() * 60,
        };
        setPings((prev) => [...prev, newPing]);

        setTimeout(() => {
          setPings((prev) => prev.filter((p) => p.id !== newPing.id));
        }, 2000);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [pings.length, contacts]);

  const center = size / 2;
  const maxRadius = size / 2 - 16;

  return (
    <div className="space-y-2">
      <div className="text-amber-500 text-xs font-semibold">PROXIMITY RADAR</div>
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg className="absolute inset-0 w-full h-full">
          <circle cx={center} cy={center} r={maxRadius} fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1" />
          <circle cx={center} cy={center} r={maxRadius * 0.75} fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1" />
          <circle cx={center} cy={center} r={maxRadius * 0.5} fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1" />
          <circle cx={center} cy={center} r={maxRadius * 0.25} fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1" />

          <line
            x1={center}
            y1={center}
            x2={center}
            y2={16}
            stroke="rgba(34, 197, 94, 0.5)"
            strokeWidth="2"
            className="radar-sweep"
            style={{ transformOrigin: `${center}px ${center}px` }}
          />

          {pings.map((ping) => (
            <circle
              key={ping.id}
              cx={center + Math.cos(ping.angle) * (ping.distance * maxRadius) / 100}
              cy={center + Math.sin(ping.angle) * (ping.distance * maxRadius) / 100}
              r="3"
              fill="rgba(239, 68, 68, 0.8)"
              className="animate-ping"
            />
          ))}

          <circle cx={center} cy={center} r="4" fill="rgba(34, 197, 94, 1)" />
        </svg>
      </div>
      <div className="text-green-400 text-xs text-center text-glow-green">CONTACTS: {pings.length}</div>
    </div>
  );
}

interface TerminalOutputProps {
  lines: Array<{ text: string; type?: 'success' | 'error' | 'warning' | 'info' }>;
}

export function TerminalOutput({ lines }: TerminalOutputProps) {
  return (
    <div className="bg-black p-4 text-green-400 text-xs font-mono space-y-1 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(34, 197, 94, 0.03) 0px, rgba(34, 197, 94, 0.03) 1px, transparent 1px, transparent 3px)' }}
      />
      {lines.map((line, i) => {
        let colorClass = 'text-green-400';
        let glowClass = 'text-glow-green';

        if (line.type === 'error') {
          colorClass = 'text-red-400';
          glowClass = 'text-glow-red';
        } else if (line.type === 'warning') {
          colorClass = 'text-amber-400';
          glowClass = 'text-glow-amber';
        } else if (line.type === 'info') {
          colorClass = 'text-cyan-400';
          glowClass = 'text-glow-cyan';
        } else if (line.type === 'success') {
          colorClass = 'text-green-300';
          glowClass = 'text-glow-green';
        }

        return (
          <div key={i} className={`${colorClass} ${glowClass} relative z-10`}>
            {line.text}
          </div>
        );
      })}
      <div className="animate-pulse text-glow-green relative z-10">_</div>
    </div>
  );
}

export function DataStream({ lines = 15 }: { lines?: number }) {
  return (
    <div className="h-32 overflow-hidden text-xs text-green-400 leading-tight font-mono opacity-50 relative">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="data-stream-char" style={{ animationDelay: `${i * 150}ms` }}>
          {Math.random().toString(16).substring(2, 18).toUpperCase()}
        </div>
      ))}
    </div>
  );
}

interface HazardWarningProps {
  title: string;
  level?: 'warning' | 'critical';
}

export function HazardWarning({ title, level = 'warning' }: HazardWarningProps) {
  const borderColor = level === 'critical' ? 'border-red-500' : 'border-orange-500';
  const textColor = level === 'critical' ? 'text-red-400' : 'text-orange-400';
  const bgColor = level === 'critical' ? 'bg-red-950/20' : 'bg-orange-950/20';

  return (
    <div className={`border-2 ${borderColor} ${bgColor} p-4 animate-pulse-border`}>
      <div className={`${textColor} text-sm font-mono text-center space-y-2`}>
        <div className="text-xl">⚠ {title} ⚠</div>
        <div className="animate-pulse">{'█ '.repeat(10)}</div>
        <div>
          EXPOSURE LEVEL: <span className={level === 'critical' ? 'text-red-300' : 'text-orange-300'}>{level.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

export function ASCIIBox({ title, children }: { title: string; children: React.ReactNode }) {
  const border = '═'.repeat(title.length + 2);
  return (
    <pre className="text-cyan-400 text-xs leading-tight text-glow-cyan">
{`╔${border}╗
║ ${title} ║
╠${border}╣`}
{children}
{`╚${border}╝`}
    </pre>
  );
}