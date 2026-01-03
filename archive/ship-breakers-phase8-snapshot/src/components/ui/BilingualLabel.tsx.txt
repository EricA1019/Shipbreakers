export default function BilingualLabel({
  en,
  zh,
  size = "sm",
}: {
  en: string;
  zh?: string;
  size?: "sm" | "md" | "lg";
}) {
  const enCls =
    size === "lg" ? "text-lg" : size === "md" ? "text-sm" : "text-xs";
  const zhCls =
    size === "lg" ? "text-sm" : size === "md" ? "text-xs" : "text-xxs";
  return (
    <div className="flex flex-col">
      <div className={`font-bold tracking-wider ${enCls} text-amber-50`}>
        {en}
      </div>
      {zh ? (
        <div className={`text-amber-100/60 font-mono ${zhCls}`}>{zh}</div>
      ) : null}
    </div>
  );
}
