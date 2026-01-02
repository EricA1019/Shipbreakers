import React from "react";
import type { Ship as ShipType, GridRoom, GridPosition, CrewMember } from "../../types";
import { hasShipLayout } from "../../types";
import ScannerEffect from "../ui/ScannerEffect";
import CrewDot from "./CrewDot";

interface ShipGridProps {
  ship: ShipType;
  currentRoom?: GridPosition;
  crewRoster?: CrewMember[];
  hideShipName?: boolean;
  allowedRoomIds?: Set<string>;
  isScanning?: boolean;
  onRoomClick?: (room: GridRoom) => void;
  locationFilter?: "ship" | "wreck" | "station";
}

export const ShipGrid: React.FC<ShipGridProps> = ({
  ship,
  currentRoom,
  crewRoster,
  hideShipName = false,
  allowedRoomIds,
  isScanning = false,
  onRoomClick,
  locationFilter = "ship",
}) => {
  const cols = ship.width;

  // If a layout is provided (from rust shapes) render absolute positions
  if (hasShipLayout(ship)) {
    const { rooms } = ship.layout;
    const minX = Math.min(...rooms.map((r) => r.x));
    const minY = Math.min(...rooms.map((r) => r.y));
    const maxX = Math.max(...rooms.map((r) => r.x + r.w));
    const maxY = Math.max(...rooms.map((r) => r.y + r.h));
    const width = maxX - minX;
    const height = maxY - minY;

    // Map layout rooms to grid rooms by index (they correspond 1:1)
    const gridRooms = ship.grid.flat();

    return (
      <div className="bg-zinc-900 border border-amber-600/20 rounded p-2">
        {!hideShipName && (
          <div className="text-amber-200 text-xs font-mono tracking-wider mb-2">
            {ship.name}
          </div>
        )}
        <div
          className="relative w-full"
          style={{ paddingTop: `${(height / width) * 100}%` }}
        >
          <div className="absolute inset-0">
            {/* Ghost grid to communicate the footprint (empty cells) */}
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${width}, 1fr)`,
                gridTemplateRows: `repeat(${height}, 1fr)`,
                opacity: 0.06,
              }}
            >
              {Array.from({ length: width * height }).map((_, i) => (
                <div key={i} className="border border-zinc-700/10" />
              ))}
            </div>

            {rooms.map((r, idx) => {
              // Match layout room to grid room by coordinates (not index)
              const gridRoom = gridRooms.find(
                (g) => g.position.x === r.x && g.position.y === r.y
              );
              const isCurrent =
                currentRoom &&
                gridRoom &&
                currentRoom.x === gridRoom.position.x &&
                currentRoom.y === gridRoom.position.y;

              const left = ((r.x - minX) / width) * 100;
              const top = ((r.y - minY) / height) * 100;
              const wPerc = (r.w / width) * 100;
              const hPerc = (r.h / height) * 100;
              const kindClass =
                r.kind === "cargo"
                  ? "bg-amber-900/20 border-amber-500/30"
                  : r.kind === "engine"
                    ? "bg-red-900/20 border-red-600/30"
                    : r.kind === "bridge"
                      ? "bg-cyan-900/20 border-cyan-500/30"
                      : r.kind === "medbay"
                        ? "bg-green-900/20 border-green-500/30"
                        : r.kind === "labs"
                          ? "bg-blue-900/20 border-blue-500/30"
                          : r.kind === "armory"
                            ? "bg-red-800/20 border-red-500/30"
                            : r.kind === "salon"
                              ? "bg-amber-800/20 border-amber-500/30"
                              : r.kind === "workshop"
                                ? "bg-orange-900/20 border-orange-500/30"
                                : r.kind === "lounge"
                                  ? "bg-purple-900/20 border-purple-500/30"
                                  : "bg-zinc-800 border-amber-600/20";

              const borderClass = isCurrent
                ? "border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                : "border-amber-600/30 hover:border-amber-500/50 hover:shadow-[0_0_8px_rgba(251,191,36,0.2)]";

              // Add pulsing red border for sealed rooms
              const sealedClass = gridRoom?.sealed
                ? "animate-pulse border-red-600/60 shadow-[0_0_8px_rgba(220,38,38,0.3)]"
                : "";

              return (
                <div
                  key={idx}
                  data-testid="room"
                  onClick={() =>
                    gridRoom && onRoomClick && onRoomClick(gridRoom)
                  }
                  className={`absolute rounded p-2 text-xs select-none transition-all ${kindClass.replace("border-amber-500/30", "").replace("border-amber-600/20", "")} ${sealedClass || borderClass} ${onRoomClick ? "cursor-pointer" : ""}`}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${wPerc}%`,
                    height: `${hPerc}%`,
                  }}
                >
                  {isCurrent && (
                    <div className="absolute -left-2 -top-2 bg-amber-500 text-zinc-900 text-[10px] font-black px-2 py-0.5 rounded shadow-lg z-10">
                      YOU
                    </div>
                  )}
                  {gridRoom?.sealed && (
                    <div className="absolute -right-1 -top-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg z-10">
                      🔒
                    </div>
                  )}
                  <div className="font-mono font-semibold text-amber-50 text-[11px] truncate">
                    {gridRoom ? gridRoom.name : r.kind.toUpperCase()}
                  </div>
                  <div className="text-zinc-400 text-[10px] mt-0.5 uppercase tracking-wider">
                    {r.kind}
                  </div>

                  {/* Crew dots */}
                  {crewRoster && gridRoom && (() => {
                    const crewInRoom = crewRoster.filter(
                      (c) => {
                        if (c.position?.location !== locationFilter) return false;
                        
                        // If crew has specific room assignment, match it
                        if (c.position.roomId) {
                          return c.position.roomId === gridRoom.id;
                        }
                        
                        // If crew has grid position, match it
                        if (c.position.gridPosition) {
                          return c.position.gridPosition.x === gridRoom.position.x &&
                                 c.position.gridPosition.y === gridRoom.position.y;
                        }
                        
                        // If crew has no specific assignment, show in entry room
                        return ship.entryPosition.x === gridRoom.position.x &&
                               ship.entryPosition.y === gridRoom.position.y;
                      }
                    );
                    return crewInRoom.length > 0 && (
                      <div className="absolute right-2 bottom-2 flex flex-wrap gap-0.5 z-20">
                        {crewInRoom.map((c, idx) => (
                          <CrewDot key={c.id} crew={c} offsetIndex={idx} />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70">
                <ScannerEffect />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-amber-600/20 rounded p-2">
      {!hideShipName && (
        <div className="text-amber-200 text-xs font-mono tracking-wider mb-2">
          {ship.name}
        </div>
      )}

      <div
        className="relative grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {ship.grid
          .flatMap((row) => row)
          .map((room) => {
            const isCurrent =
              currentRoom &&
              currentRoom.x === room.position.x &&
              currentRoom.y === room.position.y;
            const isEntry =
              room.position.x === ship.entryPosition.x &&
              room.position.y === ship.entryPosition.y;
            const isAllowed = allowedRoomIds
              ? allowedRoomIds.has(room.id)
              : true;

            return (
              <div
                key={room.id}
                data-testid="room"
                onClick={() => onRoomClick && onRoomClick(room)}
                className={`relative bg-zinc-800 rounded p-2 text-xs select-none border transition-all ${
                  room.sealed
                    ? "border-red-600/60 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.3)] cursor-pointer"
                    : !isAllowed
                      ? "border-zinc-700 opacity-40 cursor-not-allowed"
                      : isCurrent
                        ? "border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)] cursor-pointer"
                        : room.looted
                          ? "border-zinc-700 opacity-50 cursor-not-allowed"
                          : "border-amber-600/30 hover:border-amber-500/50 hover:shadow-[0_0_8px_rgba(251,191,36,0.2)] cursor-pointer"
                }`}
                style={{ minHeight: 64 }}
              >
                {isCurrent && (
                  <div className="absolute -left-2 -top-2 bg-amber-500 text-zinc-900 text-[10px] font-black px-2 py-0.5 rounded shadow-lg z-10">
                    YOU
                  </div>
                )}
                {room.sealed && (
                  <div className="absolute -right-1 -top-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg z-10">
                    🔒
                  </div>
                )}
                <div className="font-mono font-semibold text-amber-50 truncate">
                  {room.name}
                </div>
                <div className="text-zinc-400 text-[11px] mt-1 flex justify-between">
                  <div className="uppercase tracking-wider">
                    {room.hazardType}
                  </div>
                  <div
                    className={
                      room.sealed
                        ? "text-red-400 font-bold"
                        : !isAllowed
                          ? "text-zinc-700"
                          : room.looted
                            ? "text-zinc-600"
                            : "text-amber-300"
                    }
                  >
                    {room.sealed
                      ? "SEALED"
                      : !isAllowed
                        ? "SEALED"
                        : room.looted
                          ? "✓"
                          : `${room.loot.length}x`}
                  </div>
                </div>

                  {/* Crew dots */}
                  {crewRoster && (() => {
                    const crewInRoom = crewRoster.filter(
                      (c) => {
                        if (c.position?.location !== locationFilter) return false;
                        
                        // If crew has specific room assignment, match it
                        if (c.position.roomId) {
                          return c.position.roomId === room.id;
                        }
                        
                        // If crew has grid position, match it
                        if (c.position.gridPosition) {
                          return c.position.gridPosition.x === room.position.x &&
                                 c.position.gridPosition.y === room.position.y;
                        }
                        
                        // If crew has no specific assignment, show in entry room
                        return ship.entryPosition.x === room.position.x &&
                               ship.entryPosition.y === room.position.y;
                      }
                    );
                    return crewInRoom.length > 0 && (
                      <div className="absolute right-2 bottom-2 flex flex-wrap gap-0.5 z-20">
                        {crewInRoom.map((c, idx) => (
                          <CrewDot key={c.id} crew={c} offsetIndex={idx} />
                        ))}
                      </div>
                    );
                  })()}

                {/* Entry indicator */}
                {isEntry && (
                  <div className="absolute top-1 right-1 text-amber-400 text-[10px]">
                    ENT
                  </div>
                )}

                {/* Doors as small markers */}
                {room.connections.includes("north") && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 w-6 h-1 bg-amber-500"
                    style={{ transform: "translate(-50%, -50%)" }}
                  />
                )}
                {room.connections.includes("south") && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-1 bg-amber-500"
                    style={{ transform: "translate(-50%, 50%)" }}
                  />
                )}
                {room.connections.includes("west") && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-6 w-1 bg-amber-500"
                    style={{ transform: "translate(-50%, -50%)" }}
                  />
                )}
                {room.connections.includes("east") && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 right-0 h-6 w-1 bg-amber-500"
                    style={{ transform: "translate(50%, -50%)" }}
                  />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ShipGrid;
