import { useGameStore } from "../../stores/gameStore";
import type { EventResolutionSummary } from "../../types";

function formatSignedAmount(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${Math.abs(value)}`;
}

export default function EventSummaryModal() {
  const { pendingEventSummary, clearPendingEventSummary } = useGameStore((s) => ({
    pendingEventSummary: (s as any).pendingEventSummary as EventResolutionSummary | null | undefined,
    clearPendingEventSummary: (s as any).clearPendingEventSummary as
      | (() => void)
      | undefined,
  }));

  if (!pendingEventSummary) return null;

  const gains: Array<{ label: string; value: number }> = [];
  const losses: Array<{ label: string; value: number }> = [];

  const addDelta = (label: string, value?: number) => {
    if (!value) return;
    if (value > 0) gains.push({ label, value });
    if (value < 0) losses.push({ label, value });
  };

  addDelta("Credits", pendingEventSummary.deltas.credits);
  addDelta("Fuel", pendingEventSummary.deltas.fuel);
  addDelta("Food", pendingEventSummary.deltas.food);
  addDelta("Drink", pendingEventSummary.deltas.drink);
  addDelta("Luxury", pendingEventSummary.deltas.luxuryDrink);

  const hasAny =
    gains.length > 0 ||
    losses.length > 0 ||
    (pendingEventSummary.crew?.length ?? 0) > 0 ||
    (pendingEventSummary.flagsSet?.length ?? 0) > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-amber-600/20 p-6 rounded max-w-lg w-full">
        <div className="font-mono font-bold text-amber-100 text-lg mb-1">
          {pendingEventSummary.eventTitle}
        </div>
        <div className="text-zinc-300 text-sm mb-4">
          You chose: <span className="text-amber-100">{pendingEventSummary.choiceText}</span>
        </div>

        {!hasAny && (
          <div className="text-sm text-zinc-400">No changes.</div>
        )}

        {gains.length > 0 && (
          <div className="mb-3">
            <div className="text-zinc-400 text-xs">Gained</div>
            <ul className="ml-4 list-disc text-xs">
              {gains.map((g) => (
                <li key={g.label} className="text-amber-200">
                  {g.label} {formatSignedAmount(g.value)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {losses.length > 0 && (
          <div className="mb-3">
            <div className="text-zinc-400 text-xs">Lost</div>
            <ul className="ml-4 list-disc text-xs">
              {losses.map((l) => (
                <li key={l.label} className="text-amber-200/70">
                  {l.label} {formatSignedAmount(l.value)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(pendingEventSummary.crew?.length ?? 0) > 0 && (
          <div className="mb-3">
            <div className="text-zinc-400 text-xs">Crew</div>
            <ul className="ml-4 list-disc text-xs text-zinc-200">
              {pendingEventSummary.crew.map((c) => {
                const parts: string[] = [];
                if (typeof c.hpDelta === "number") parts.push(`HP ${formatSignedAmount(c.hpDelta)}`);
                if (typeof c.staminaDelta === "number")
                  parts.push(`Stamina ${formatSignedAmount(c.staminaDelta)}`);
                if (typeof c.sanityDelta === "number")
                  parts.push(`Sanity ${formatSignedAmount(c.sanityDelta)}`);
                if (c.statusBefore && c.statusAfter && c.statusBefore !== c.statusAfter) {
                  parts.push(`Status ${c.statusBefore} → ${c.statusAfter}`);
                }

                return (
                  <li key={c.crewId}>
                    <span className="text-amber-100">{c.name}:</span> {parts.join(", ")}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {(pendingEventSummary.flagsSet?.length ?? 0) > 0 && (
          <div className="mb-3">
            <div className="text-zinc-400 text-xs">Flags set</div>
            <div className="text-xs text-zinc-300">
              {pendingEventSummary.flagsSet.join(", ")}
            </div>
          </div>
        )}

        <div className="mt-3 text-right">
          <button
            onClick={() => clearPendingEventSummary?.()}
            className="px-3 py-2 bg-amber-600 text-zinc-900 font-bold rounded"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
