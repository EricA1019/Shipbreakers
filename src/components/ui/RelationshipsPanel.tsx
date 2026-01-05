/**
 * RelationshipsPanel - Phase 14
 * Displays crew relationships in a compact grid
 */

import { useGameStore } from "../../stores/gameStore";
import {
  getRelationshipValue,
  getRelationshipLevel,
  getRelationshipEmoji,
} from "../../services/relationshipService";
import IndustrialPanel from "./IndustrialPanel";

interface RelationshipsPanelProps {
  selectedCrewId?: string;
}

export default function RelationshipsPanel({ selectedCrewId }: RelationshipsPanelProps) {
  const { crewRoster, relationships } = useGameStore((s) => ({
    crewRoster: s.crewRoster,
    relationships: s.relationships || [],
  }));

  // Need at least 2 crew for relationships
  if (crewRoster.length < 2) {
    return (
      <IndustrialPanel title="CREW BONDS" subtitle="INTERPERSONAL DYNAMICS">
        <div className="text-center text-zinc-500 py-4">
          <div className="text-2xl mb-2">👤</div>
          <div className="text-sm">Hire more crew to see relationships</div>
        </div>
      </IndustrialPanel>
    );
  }

  // If a crew member is selected, show their relationships
  if (selectedCrewId) {
    const selectedCrew = crewRoster.find((c) => c.id === selectedCrewId);
    if (!selectedCrew) return null;

    const otherCrew = crewRoster.filter((c) => c.id !== selectedCrewId);

    return (
      <IndustrialPanel
        title={`${selectedCrew.firstName}'s BONDS`}
        subtitle="RELATIONSHIP STATUS"
      >
        <div className="space-y-2">
          {otherCrew.map((other) => {
            const value = getRelationshipValue(relationships, selectedCrewId, other.id);
            const level = getRelationshipLevel(value);
            const emoji = getRelationshipEmoji(level);

            return (
              <div
                key={other.id}
                className="flex items-center justify-between bg-black/30 border border-white/6 rounded-md px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: other.customDotColor || "#22c55e" }}
                  />
                  <span className="text-sm text-zinc-200">{other.firstName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <div className="w-20">
                    <div className="text-[9px] text-zinc-500 uppercase mb-0.5">
                      {level}
                    </div>
                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getRelationshipBarColor(value)}`}
                        style={{ width: `${(value / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-mono text-zinc-400 w-6 text-right">
                    {value}/10
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-white/6 flex flex-wrap gap-2 justify-center text-[9px] text-zinc-500">
          <span>💢 Hostile</span>
          <span>😤 Tense</span>
          <span>😐 Neutral</span>
          <span>🙂 Friendly</span>
          <span>😊 Close</span>
          <span>💕 Intimate</span>
        </div>
      </IndustrialPanel>
    );
  }

  // Overview mode - show relationship matrix
  return (
    <IndustrialPanel title="CREW BONDS" subtitle="RELATIONSHIP MATRIX">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left pb-2"></th>
              {crewRoster.map((crew) => (
                <th key={crew.id} className="pb-2 px-1 text-center">
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: crew.customDotColor || "#22c55e" }}
                    title={crew.firstName}
                  />
                  <span className="text-[8px] text-zinc-500 uppercase">
                    {crew.firstName.slice(0, 3)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crewRoster.map((row) => (
              <tr key={row.id}>
                <td className="py-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: row.customDotColor || "#22c55e" }}
                    />
                    <span className="text-zinc-300">{row.firstName}</span>
                  </div>
                </td>
                {crewRoster.map((col) => {
                  if (row.id === col.id) {
                    return (
                      <td key={col.id} className="px-1 py-1 text-center">
                        <span className="text-zinc-700">—</span>
                      </td>
                    );
                  }
                  const value = getRelationshipValue(relationships, row.id, col.id);
                  const level = getRelationshipLevel(value);
                  const emoji = getRelationshipEmoji(level);

                  return (
                    <td
                      key={col.id}
                      className="px-1 py-1 text-center cursor-help"
                      title={`${row.firstName} ↔ ${col.firstName}: ${value}/10 (${level})`}
                    >
                      <span className="text-sm">{emoji}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IndustrialPanel>
  );
}

function getRelationshipBarColor(value: number): string {
  if (value >= 8) return "bg-pink-500";
  if (value >= 6) return "bg-green-500";
  if (value >= 4) return "bg-zinc-500";
  if (value >= 2) return "bg-orange-500";
  return "bg-red-500";
}
