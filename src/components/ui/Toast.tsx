import { useUiStore } from "../../stores/uiStore";

const typeClass = (t: string) => {
  switch (t) {
    case "success":
      return "bg-green-600";
    case "error":
      return "bg-red-600";
    case "warning":
      return "bg-amber-600";
    default:
      return "bg-sky-600";
  }
};

export default function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  const remove = useUiStore((s) => s.removeToast);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${typeClass(t.type)} text-white px-4 py-2 rounded shadow-md w-80 flex items-start justify-between`}
          role="alert"
        >
          <div className="flex-1 pr-2">
            <div className="font-semibold">{t.type.toUpperCase()}</div>
            <div className="text-sm">{t.message}</div>
          </div>
          <button
            className="ml-2 text-white/70 hover:text-white"
            onClick={() => remove(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
