import type { GraveyardZone, LicenseTier } from '../../types';
import { ZONES, LICENSE_TIERS } from '../../types';

interface ZoneUnlockModalProps {
  zone: GraveyardZone;
  tier: LicenseTier;
  onClose: () => void;
}

const ZONE_DESCRIPTIONS: Record<GraveyardZone, string> = {
  near: 'The Near Zone contains mostly civilian and industrial wrecks. Relatively safe salvage opportunities with modest rewards.',
  mid: 'The Mid Zone contains military and science vessels. Increased hazards and better loot, but higher risks.',
  deep: 'The Deep Zone is the final frontier - luxury liners and top-secret research vessels. Maximum danger, maximum profit.',
};

export default function ZoneUnlockModal({ zone, tier, onClose }: ZoneUnlockModalProps) {
  const tierConfig = LICENSE_TIERS[tier];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-amber-500 p-6 max-w-md rounded">
        {/* Header */}
        <div className="mb-4 border-b border-amber-600/30 pb-3">
          <div className="text-amber-500 font-bold text-lg">🔓 NEW ZONE UNLOCKED</div>
          <div className="text-amber-400 font-bold text-xl mt-2">
            {ZONES[zone].label}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 mb-5">
          <div>
            <div className="text-zinc-400 text-xs font-mono">ZONE DETAILS</div>
            <div className="text-zinc-300 text-sm mt-1">{ZONE_DESCRIPTIONS[zone]}</div>
          </div>

          <div className="bg-zinc-800 p-3 rounded border border-amber-600/20">
            <div className="text-zinc-400 text-xs font-mono mb-2">DISTANCE RANGE</div>
            <div className="text-amber-400 font-bold">
              {ZONES[zone].distanceRange[0]}.0 - {ZONES[zone].distanceRange[1]}.9 AU
            </div>
          </div>

          <div className="bg-zinc-800 p-3 rounded border border-amber-600/20">
            <div className="text-zinc-400 text-xs font-mono mb-2">LICENSE INFO</div>
            <div className="text-amber-400 font-bold">{tierConfig.label}</div>
            <div className="text-zinc-400 text-xs mt-1">
              Valid for {tierConfig.duration} days
            </div>
          </div>

          <div className="bg-zinc-800 p-3 rounded border border-green-600/20">
            <div className="text-zinc-400 text-xs font-mono mb-1">AVAILABLE WRECKS</div>
            <div className="text-green-400 text-sm">
              {ZONES[zone].wreckCountMin}-{ZONES[zone].wreckCountMax} wrecks in zone
            </div>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={onClose}
          className="w-full bg-amber-600 text-zinc-900 font-bold py-2 rounded hover:bg-amber-500 transition"
        >
          READY TO EXPLORE
        </button>
      </div>
    </div>
  );
}
