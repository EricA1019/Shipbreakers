interface StatusItem {
  key: string;
  label: string;
  value: string | number;
  status?: "ok" | "warn" | "danger";
}

export default function StatusGrid({ items }: { items: StatusItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {items.map((it) => (
        <div
          key={it.key}
          className={`p-2 rounded border ${it.status === "danger" ? "border-red-500/40 animate-pulse-border" : it.status === "warn" ? "border-amber-500/30" : "border-amber-600/10"} bg-zinc-900/40`}
        >
          <div className="flex justify-between items-center">
            <div className="text-amber-50/80 uppercase tracking-wider">
              {it.label}
            </div>
            <div
              className={`font-mono ${it.status === "danger" ? "text-glow-red-strong" : it.status === "warn" ? "text-glow-amber" : "text-glow-cyan"}`}
            >
              {it.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
