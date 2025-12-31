import type { GraveyardZone, WreckPreview } from '../../types';
import { ZONES } from '../../types';

interface GraveyardMapProps {
  unlockedZones: GraveyardZone[];
  availableWrecks: WreckPreview[];
  selectedWreckId?: string;
  onSelectWreck: (wreckId: string) => void;
  showScanAnimation?: boolean;
}

const ZONE_COLORS: Record<GraveyardZone, string> = {
  near: '#ea580c', // amber-600
  mid: '#f59e0b', // amber-500
  deep: '#fbbf24', // amber-400
};

const ZONE_LABELS: Record<GraveyardZone, string> = {
  near: 'NEAR ZONE',
  mid: 'MID ZONE',
  deep: 'DEEP ZONE',
};

const WRECK_MASS_SIZES: Record<string, number> = {
  small: 8,
  medium: 12,
  large: 16,
  massive: 22,
};

export default function GraveyardMap({
  unlockedZones,
  availableWrecks,
  selectedWreckId,
  onSelectWreck,
  showScanAnimation = false,
}: GraveyardMapProps) {
  const svgWidth = 600;
  const svgHeight = 500;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Zone circles (concentric)
  const zoneRadii = {
    near: 100,
    mid: 200,
    deep: 280,
  };

  // Check if zone is locked
  const isZoneLocked = (zone: GraveyardZone) => !unlockedZones.includes(zone);

  // Map distance to angle (0 to 360)
  const getAngle = (distance: number): number => {
    // Normalize distance to 0-360
    return (distance * 90) % 360;
  };

  // Get position for wreck based on distance and angle
  const getWreckPosition = (wreck: WreckPreview) => {
    const zone = wreck.zone;
    const radius = zoneRadii[zone];
    const angle = getAngle(wreck.distance);
    const radians = (angle * Math.PI) / 180;

    return {
      x: centerX + radius * Math.cos(radians),
      y: centerY + radius * Math.sin(radians),
    };
  };

  return (
    <div className="w-full bg-zinc-900 border border-amber-600/30 p-4 rounded">
      <div className="text-amber-500 font-bold text-sm mb-3 flex items-center gap-2">
        📡 GRAVEYARD SCAN
        {showScanAnimation && <span className="animate-pulse">scanning...</span>}
        <span className="text-zinc-400 text-xs ml-auto">{availableWrecks.length} wrecks detected</span>
      </div>

      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="bg-zinc-950 border border-amber-600/10 rounded"
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3f3f46" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

        {/* Center point */}
        <circle cx={centerX} cy={centerY} r="4" fill="#fbbf24" />

        {/* Zone circles */}
        {(['near', 'mid', 'deep'] as GraveyardZone[]).map((zone) => {
          const radius = zoneRadii[zone];
          const isLocked = isZoneLocked(zone);
          const color = isLocked ? '#52525b' : ZONE_COLORS[zone];
          const opacity = isLocked ? 0.3 : 0.5;

          return (
            <g key={zone}>
              {/* Circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity={opacity}
              />

              {/* Zone label */}
              <text
                x={centerX + radius}
                y={centerY - 10}
                fill={color}
                fontSize="11"
                fontWeight="bold"
                opacity={opacity}
                textAnchor="middle"
              >
                {ZONE_LABELS[zone]}
                {isLocked && ' (LOCKED)'}
              </text>

              {/* Distance range label */}
              <text
                x={centerX + radius}
                y={centerY + 8}
                fill={color}
                fontSize="9"
                opacity={opacity * 0.7}
                textAnchor="middle"
              >
                {ZONES[zone].distanceRange[0]}-{ZONES[zone].distanceRange[1]} AU
              </text>
            </g>
          );
        })}

        {/* Wreck markers */}
        {availableWrecks.map((wreck) => {
          const zone = wreck.zone;
          const isLocked = isZoneLocked(zone);
          const position = getWreckPosition(wreck);
          const size = WRECK_MASS_SIZES[wreck.estimatedMass];
          const isSelected = wreck.id === selectedWreckId;

          return (
            <g
              key={wreck.id}
              onClick={() => !isLocked && onSelectWreck(wreck.id)}
              style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
            >
              {/* Wreck circle */}
              <circle
                cx={position.x}
                cy={position.y}
                r={size}
                fill={
                  isLocked
                    ? '#71717a'
                    : isSelected
                      ? '#fbbf24'
                      : zone === 'near'
                        ? '#ea580c'
                        : zone === 'mid'
                          ? '#f59e0b'
                          : '#fbbf24'
                }
                opacity={isLocked ? 0.3 : 0.8}
              />

              {/* Selection ring */}
              {isSelected && !isLocked && (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={size + 6}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
              )}

              {/* Lock icon for locked zones */}
              {isLocked && (
                <text
                  x={position.x}
                  y={position.y + 5}
                  fill="#a1a1aa"
                  fontSize="14"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  🔒
                </text>
              )}
            </g>
          );
        })}

        {/* Angle markers (12 o'clock positions) */}
        {[0, 90, 180, 270].map((angle) => {
          const radians = (angle * Math.PI) / 180;
          const x = centerX + 290 * Math.cos(radians);
          const y = centerY + 290 * Math.sin(radians);
          return (
            <line
              key={`angle-${angle}`}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#52525b"
              strokeWidth="1"
              strokeDasharray="2,4"
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 text-zinc-400 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full"></span>
          <span>Small Wreck</span>
          <span className="w-4 h-4 bg-red-600 rounded-full ml-2"></span>
          <span>Medium</span>
          <span className="w-5 h-5 bg-red-600 rounded-full ml-2"></span>
          <span>Large</span>
          <span className="w-7 h-7 bg-red-600 rounded-full ml-2"></span>
          <span>Massive</span>
        </div>
        <div>Click wreck to select • Distance shown on angle</div>
      </div>
    </div>
  );
}
