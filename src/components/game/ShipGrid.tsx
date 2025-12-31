import React from 'react';
import type { Ship as ShipType, GridRoom, GridPosition } from '../../types';

interface ShipGridProps {
  ship: ShipType;
  currentRoom?: GridPosition;
  hideShipName?: boolean;
  allowedRoomIds?: Set<string>;
  onRoomClick?: (room: GridRoom) => void;
}

export const ShipGrid: React.FC<ShipGridProps> = ({ ship, currentRoom, hideShipName = false, allowedRoomIds, onRoomClick }) => {
  const cols = ship.width;

  return (
    <div className="bg-zinc-900 border border-amber-600/20 rounded p-2">
      {!hideShipName && (
        <div className="text-amber-200 text-xs font-mono tracking-wider mb-2">{ship.name}</div>
      )}

      <div
        className="relative grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {ship.grid.flatMap((row) => row).map((room) => {
          const isCurrent = currentRoom && currentRoom.x === room.position.x && currentRoom.y === room.position.y;
          const isEntry = room.position.x === ship.entryPosition.x && room.position.y === ship.entryPosition.y;
          const isAllowed = allowedRoomIds ? allowedRoomIds.has(room.id) : true;

          return (
            <div
              key={room.id}
              onClick={() => onRoomClick && onRoomClick(room)}
              className={`relative bg-zinc-800 rounded p-2 text-xs select-none border transition-all ${
                !isAllowed
                  ? 'border-zinc-700 opacity-40 cursor-not-allowed'
                  : isCurrent 
                    ? 'border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)] cursor-pointer'
                    : room.looted 
                      ? 'border-zinc-700 opacity-50 cursor-not-allowed'
                      : 'border-amber-600/30 hover:border-amber-500/50 hover:shadow-[0_0_8px_rgba(251,191,36,0.2)] cursor-pointer'
              }`}
              style={{ minHeight: 64 }}
            >
              {isCurrent && (
                <div className="absolute -left-2 -top-2 bg-amber-500 text-zinc-900 text-[10px] font-black px-2 py-0.5 rounded shadow-lg">
                  YOU
                </div>
              )}
              <div className="font-mono font-semibold text-amber-50 truncate">{room.name}</div>
              <div className="text-zinc-400 text-[11px] mt-1 flex justify-between">
                <div className="uppercase tracking-wider">{room.hazardType}</div>
                <div className={!isAllowed ? 'text-zinc-700' : room.looted ? 'text-zinc-600' : 'text-amber-300'}>{!isAllowed ? 'SEALED' : room.looted ? '✓' : `${room.loot.length}x`}</div>
              </div>

              {/* Entry indicator */}
              {isEntry && (
                <div className="absolute top-1 right-1 text-amber-400 text-[10px]">ENT</div>
              )}

              {/* Doors as small markers */}
              {room.connections.includes('north') && (
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-6 h-1 bg-amber-500" style={{ transform: 'translate(-50%, -50%)' }} />
              )}
              {room.connections.includes('south') && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-1 bg-amber-500" style={{ transform: 'translate(-50%, 50%)' }} />
              )}
              {room.connections.includes('west') && (
                <div className="absolute top-1/2 -translate-y-1/2 left-0 h-6 w-1 bg-amber-500" style={{ transform: 'translate(-50%, -50%)' }} />
              )}
              {room.connections.includes('east') && (
                <div className="absolute top-1/2 -translate-y-1/2 right-0 h-6 w-1 bg-amber-500" style={{ transform: 'translate(50%, -50%)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShipGrid;
