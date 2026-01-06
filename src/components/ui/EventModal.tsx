import { useGameStore } from "../../stores/gameStore";
import {
  buildChoiceImplications,
  evaluateChoiceRequirements,
} from "../../game/systems/EventManager";

function rowClass(direction: 'gain' | 'loss'): string {
  return direction === 'gain' ? 'text-amber-200' : 'text-amber-200/70';
}

function formatImplicationRow(row: { label: string; amountText: string; targetText?: string }) {
  return `${row.label} ${row.amountText}${row.targetText ? ` ${row.targetText}` : ''}`;
}

export default function EventModal() {
  const {
    activeEvent,
    credits,
    inventory,
    crewRoster,
    selectedCrewId,
    crew,
    resolveActiveEvent,
    dismissActiveEvent,
  } = useGameStore((s) => ({
    activeEvent: s.activeEvent,
    credits: s.credits,
    inventory: (s as any).inventory ?? [],
    crewRoster: (s as any).crewRoster ?? [],
    selectedCrewId: (s as any).selectedCrewId ?? null,
    crew: (s as any).crew,
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
          {activeEvent.choices.map((c) => {
            const stateForChecks: any = {
              credits,
              inventory,
              crewRoster,
              selectedCrewId,
              crew,
            };

            const req = evaluateChoiceRequirements(stateForChecks, c.requirements);
            const implications = buildChoiceImplications(stateForChecks, c);
            const hasImplications =
              implications.gains.length > 0 || implications.losses.length > 0;

            return (
              <div key={c.id} className="rounded border border-amber-600/10 p-2">
                <button
                  onClick={() => req.allowed && resolveActiveEvent?.(c.id)}
                  disabled={!req.allowed}
                  className={
                    req.allowed
                      ? "w-full px-3 py-2 bg-amber-600 text-zinc-900 font-bold rounded"
                      : "w-full px-3 py-2 bg-zinc-700 text-zinc-300 font-bold rounded cursor-not-allowed"
                  }
                >
                  {c.text}
                </button>

                {req.reasons.length > 0 && (
                  <div className="mt-1 text-xs text-amber-200/80">
                    {req.reasons.join(" • ")}
                  </div>
                )}

                {hasImplications && (
                  <div className="mt-2 text-xs">
                    {implications.gains.length > 0 && (
                      <div className="mb-1">
                        <div className="text-zinc-400">Gains</div>
                        <ul className="ml-4 list-disc">
                          {implications.gains.map((r, idx) => (
                            <li key={idx} className={rowClass(r.direction)}>
                              {formatImplicationRow(r)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {implications.losses.length > 0 && (
                      <div>
                        <div className="text-zinc-400">Losses</div>
                        <ul className="ml-4 list-disc">
                          {implications.losses.map((r, idx) => (
                            <li key={idx} className={rowClass(r.direction)}>
                              {formatImplicationRow(r)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
