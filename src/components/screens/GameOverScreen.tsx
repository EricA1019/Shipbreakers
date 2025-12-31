
import { useGameStore } from '../../stores/gameStore';
import CyberPanel from '../ui/CyberPanel';
import CyberButton from '../ui/CyberButton';

export default function GameOverScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { resetGame } = useGameStore((s) => ({ resetGame: s.resetGame }));
  return (
    <div className="max-w-4xl mx-auto text-center mt-24">
      {/* Red vignette overlay for dramatic effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(127, 0, 0, 0.5) 100%)',
        }}
      />
      
      <CyberPanel variant="warning" className="animate-pulse relative z-50">
        <div className="text-6xl font-bold mb-4 glitch text-glow-red-strong">
          GAME OVER
        </div>
        <div className="mb-6 text-xl text-red-300">
          ⚠️ CRITICAL SYSTEM FAILURE ⚠️
        </div>
        
        <CyberPanel variant="terminal" className="mb-6 text-left max-w-md mx-auto">
          <div className="text-xs space-y-1 font-mono">
            <div className="text-red-400 text-glow-red">&gt; LIFE SUPPORT: OFFLINE</div>
            <div className="text-red-400 text-glow-red">&gt; CREW STATUS: CRITICAL</div>
            <div className="text-red-400 text-glow-red">&gt; HULL INTEGRITY: COMPROMISED</div>
            <div className="text-amber-400 text-glow-amber">&gt; EMERGENCY BEACON: ACTIVATED</div>
            <div className="text-cyan-400 text-glow-cyan">&gt; AWAITING RESCUE...</div>
          </div>
        </CyberPanel>
        
        <div className="text-zinc-400 mb-6">
          Your crew has fallen. The station mourns another lost team.
        </div>
        
        <div className="flex justify-center gap-2">
          <CyberButton 
            variant="danger" 
            glowColor="red"
            onClick={() => { resetGame(); onNavigate('hub'); }}
          >
            🔄 Reset Game
          </CyberButton>
        </div>
      </CyberPanel>
    </div>
  );
}
