import { useGameStore } from "../../stores/gameStore";

export default function EventModal() {
  const { activeEvent, resolveActiveEvent, dismissActiveEvent } = useGameStore((s) => ({
    activeEvent: s.activeEvent,
    resolveActiveEvent: (s as any).resolveActiveEvent as ((id: string) => void) | undefined,
    dismissActiveEvent: (s as any).dismissActiveEvent as (() => void) | undefined,
  }));

  if (!activeEvent) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-amber-600/20 p-6 rounded max-w-lg w-full">
        <div className="font-mono font-bold text-amber-100 text-lg mb-2">
          {activeEvent.title}
        </div>
        <div className="text-zinc-300 text-sm mb-4">{activeEvent.description}</div>
        <div className="grid grid-cols-1 gap-2">
          {activeEvent.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => resolveActiveEvent?.(c.id)}
              className="px-3 py-2 bg-amber-600 text-zinc-900 font-bold rounded"
            >
              {c.text}
            </button>
          ))}
        </div>
        <div className="mt-3 text-right">
          <button
            onClick={() => dismissActiveEvent?.()}
            className="text-xs text-zinc-400 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
