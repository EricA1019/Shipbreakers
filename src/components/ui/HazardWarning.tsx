export default function HazardWarning({
  message = "Hull breach detected",
  level = "critical",
}: {
  message?: string;
  level?: "info" | "warn" | "critical";
}) {
  const cls =
    level === "critical"
      ? "bg-red-600 text-amber-50 animate-pulse"
      : level === "warn"
        ? "bg-amber-600 text-zinc-900"
        : "bg-cyan-400 text-zinc-900";
  return (
    <div
      className={`p-3 rounded-md ${cls} shadow-glow-red flex items-center gap-3`}
    >
      <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center font-bold">
        !
      </div>
      <div className="text-sm font-bold tracking-wider">{message}</div>
    </div>
  );
}
