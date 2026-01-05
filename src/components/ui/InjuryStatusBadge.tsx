/**
 * InjuryStatusBadge - Phase 14
 * Displays injury status on crew cards
 */

import type { Injury } from "../../types";
import {
  getInjuryDisplayInfo,
  getInjurySeverityColor,
} from "../../services/injuryService";

interface InjuryStatusBadgeProps {
  injury: Injury;
  compact?: boolean;
}

export default function InjuryStatusBadge({
  injury,
  compact = false,
}: InjuryStatusBadgeProps) {
  const info = getInjuryDisplayInfo(injury);
  const severityColor = getInjurySeverityColor(injury.severity);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wide rounded border bg-red-500/15 border-red-500/30 ${severityColor}`}
        title={`${info.name} - ${info.description}\n${info.daysLeft} days until recovery`}
      >
        🩹 {info.severity}
      </div>
    );
  }

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2">
      <div className="flex items-center justify-between mb-1">
        <div className={`text-xs font-bold uppercase ${severityColor}`}>
          🩹 {info.name}
        </div>
        <div className="text-[10px] text-red-400">
          {info.daysLeft} days to recover
        </div>
      </div>
      <div className="text-[10px] text-zinc-400 mb-2">{info.description}</div>
      <div className="flex items-center gap-2 text-[9px]">
        <span className={`px-1.5 py-0.5 rounded ${
          injury.severity === "critical" ? "bg-red-500/20 text-red-400" :
          injury.severity === "major" ? "bg-orange-500/20 text-orange-400" :
          "bg-yellow-500/20 text-yellow-400"
        }`}>
          {info.severity.toUpperCase()}
        </span>
        {!info.canWork && (
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
            CANNOT WORK
          </span>
        )}
      </div>
    </div>
  );
}
