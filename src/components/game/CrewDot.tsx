import type { CrewMember } from "../../types";

function dominantSkill(crew: CrewMember): keyof CrewMember["skills"] {
  const entries = Object.entries(crew.skills) as Array<[
    keyof CrewMember["skills"],
    number
  ]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "technical";
}

function defaultSkillColor(skill: string): string {
  if (skill === "combat") return "#ef4444"; // red-500
  if (skill === "salvage") return "#22c55e"; // green-500
  if (skill === "piloting") return "#06b6d4"; // cyan-500
  return "#f59e0b"; // amber-500
}

interface CrewDotProps {
  crew: CrewMember;
  onClick?: () => void;
  offsetIndex?: number;
}

export default function CrewDot({ crew, onClick, offsetIndex = 0 }: CrewDotProps) {
  const skill = dominantSkill(crew);
  const initials = `${crew.firstName?.[0] ?? crew.name?.[0] ?? "?"}${crew.lastName?.[0] ?? ""}`.toUpperCase();

  const title = `${crew.name}\n${crew.status.toUpperCase()}\nHP: ${crew.hp}/${crew.maxHp}\nSTA: ${crew.stamina}/${crew.maxStamina}\nSAN: ${crew.sanity}/${crew.maxSanity}`;

  // Use custom color if set, otherwise use skill-based color
  const dotColor = crew.customDotColor || defaultSkillColor(String(skill));

  // Calculate offset for stacking multiple crew in same location
  const offsetX = (offsetIndex % 3) * 6;
  const offsetY = Math.floor(offsetIndex / 3) * 6;

  // Status indicator ring
  const statusRing = 
    crew.status === "injured" ? "ring-2 ring-red-500" :
    crew.status === "resting" ? "ring-2 ring-blue-400" :
    crew.status === "breakdown" ? "ring-2 ring-purple-500 animate-pulse" :
    "";

  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        backgroundColor: dotColor,
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        transition: "transform 0.3s ease-out, background-color 0.2s",
      }}
      className={`w-5 h-5 rounded-full text-zinc-900 flex items-center justify-center text-[10px] font-black border border-zinc-900/50 cursor-pointer hover:scale-110 ${statusRing}`}
    >
      {initials}
    </div>
  );
}
