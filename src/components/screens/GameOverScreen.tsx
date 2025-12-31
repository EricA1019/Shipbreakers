
import { useGameStore } from '../../stores/gameStore';

export default function GameOverScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { resetGame } = useGameStore((s) => ({ resetGame: s.resetGame }));
  return (
    <div className="max-w-4xl mx-auto text-center mt-24">
      <div className="bg-zinc-800 border border-red-600/30 p-6 text-red-300">
        <div className="text-2xl font-bold mb-2">GAME OVER</div>
        <div className="mb-4">Your crew has fallen. Reset and try again.</div>
        <div className="flex justify-center gap-2">
          <button className="bg-amber-500 text-zinc-900 px-4 py-2" onClick={() => { resetGame(); onNavigate('hub'); }}>Reset Game</button>
        </div>
      </div>
    </div>
  );
}
