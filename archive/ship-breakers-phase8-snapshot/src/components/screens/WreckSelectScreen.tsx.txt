import { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import GraveyardMap from "../ui/GraveyardMap";
import ZoneUnlockModal from "../ui/ZoneUnlockModal";
import VictoryModal from "../ui/VictoryModal";
import WreckDetailsPanel from "../ui/WreckDetailsPanel";
import CyberPanel from "../ui/CyberPanel";
import CyberButton from "../ui/CyberButton";
import { ScanningProgress } from "../ui/VisualEffects";
import { getWreckPreview } from "../../game/wreckGenerator";

import type { ScreenProps } from "../../types";

export default function WreckSelectScreen({ onNavigate }: ScreenProps) {
  const [selectedWreckId, setSelectedWreckId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  const {
    availableWrecks,
    startRun,
    scanForWrecks,
    credits,
    unlockedZones,
    lastUnlockedZone,
    stats,
    initializeGame,
    licenseTier,
    clearLastUnlockedZone,
  } = useGameStore((s) => ({
    availableWrecks: s.availableWrecks,
    startRun: s.startRun,
    scanForWrecks: s.scanForWrecks,
    credits: s.credits,
    unlockedZones: s.unlockedZones,
    lastUnlockedZone: s.lastUnlockedZone,
    stats: s.stats,
    initializeGame: s.initializeGame,
    licenseTier: s.licenseTier,
    clearLastUnlockedZone: (s as any).clearLastUnlockedZone,
  }));

  // Convert wrecks to preview format for map
  const wreckPreviews = availableWrecks.map((w) => getWreckPreview(w));
  const selectedWreck = selectedWreckId
    ? availableWrecks.find((w) => w.id === selectedWreckId)
    : null;

  // Check for victory condition
  useEffect(() => {
    if (credits >= 250000) {
      setShowVictoryModal(true);
    }
  }, [credits]);

  // Show zone unlock modal when new zone unlocked
  useEffect(() => {
    if (lastUnlockedZone) {
      setShowZoneModal(true);
    }
  }, [lastUnlockedZone]);

  // Default-select the first wreck when the list loads
  useEffect(() => {
    if (!selectedWreckId && availableWrecks.length > 0) {
      setSelectedWreckId(availableWrecks[0].id);
    }
    if (
      selectedWreckId &&
      !availableWrecks.find((w) => w.id === selectedWreckId) &&
      availableWrecks.length > 0
    ) {
      setSelectedWreckId(availableWrecks[0].id);
    }
  }, [availableWrecks, selectedWreckId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key >= "1" && e.key <= "9") {
        const wreckIndex = parseInt(e.key) - 1;
        if (wreckIndex < availableWrecks.length) {
          e.preventDefault();
          setSelectedWreckId(availableWrecks[wreckIndex].id);
        }
      }

      if (e.key === "Enter" && selectedWreckId) {
        e.preventDefault();
        const selected = availableWrecks.find((w) => w.id === selectedWreckId);
        if (selected) {
          startRun(selected.id);
          onNavigate("travel");
        }
      }

      // M key for map toggle
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setShowMap(!showMap);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWreckId, availableWrecks, showMap]);

  const handleSelectFromMap = (wreckId: string) => {
    setSelectedWreckId(wreckId);
    setShowMap(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Zone unlock modal */}
      {showZoneModal && lastUnlockedZone && (
        <ZoneUnlockModal
          zone={lastUnlockedZone}
          tier={licenseTier}
          onClose={() => {
            setShowZoneModal(false);
            clearLastUnlockedZone();
          }}
        />
      )}

      {/* Victory modal */}
      {showVictoryModal && (
        <VictoryModal
          stats={stats}
          onNewGame={() => {
            localStorage.removeItem("ship-breakers-store-v1");
            initializeGame();
            window.location.reload();
          }}
          onContinue={() => setShowVictoryModal(false)}
        />
      )}

      {/* Header */}
      <CyberPanel title="SALVAGE ASSIGNMENT" className="mb-4">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-3 py-1 text-xs font-bold transition ${
              showMap
                ? "bg-amber-600 text-zinc-900"
                : "bg-zinc-700 text-amber-400 border border-amber-600/30"
            }`}
          >
            {showMap ? "🗺️ MAP" : "📋 LIST"} (M)
          </button>
          <button
            className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30 hover:bg-zinc-600"
            onClick={() => {
              if (isScanning) return;
              if (credits >= 50) {
                setIsScanning(true);
                setScanKey((k) => k + 1);
              }
            }}
          >
            🔍 Scan (50 CR)
          </button>
          <button
            className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30 hover:bg-zinc-600"
            onClick={() => onNavigate("hub")}
          >
            🏠 Back
          </button>
        </div>
      </CyberPanel>

      {isScanning && (
        <CyberPanel className="mb-4">
          <ScanningProgress
            key={scanKey}
            label="SCANNING FOR WRECKS..."
            duration={4000}
            onComplete={() => {
              scanForWrecks();
              setIsScanning(false);
            }}
          />
        </CyberPanel>
      )}

      {showMap ? (
        // Map view
        <div className="space-y-4">
          <GraveyardMap
            unlockedZones={unlockedZones}
            availableWrecks={wreckPreviews}
            selectedWreckId={selectedWreckId ?? undefined}
            onSelectWreck={handleSelectFromMap}
          />

          {/* Details below map */}
          {selectedWreck &&
            (() => {
              const preview = wreckPreviews.find(
                (p) => p.id === selectedWreckId,
              );
              return (
                <div className="bg-zinc-800 border border-amber-600/20 p-4 rounded">
                  <div className="text-amber-400 font-bold mb-3">
                    {selectedWreck.name}
                  </div>
                  <div className="text-zinc-300 text-sm space-y-1">
                    <div>
                      Distance:{" "}
                      <span className="text-amber-300 font-mono">
                        {selectedWreck.distance} AU
                      </span>
                    </div>
                    <div>
                      Type:{" "}
                      <span className="text-amber-300">
                        {selectedWreck.type.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      Rooms:{" "}
                      <span className="text-amber-300">
                        {selectedWreck.rooms.length}
                      </span>
                    </div>
                    {preview && (
                      <div>
                        Estimated Mass:{" "}
                        <span className="text-amber-300">
                          {preview.estimatedMass.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (selectedWreckId) {
                        startRun(selectedWreckId);
                        onNavigate("travel");
                      }
                    }}
                    className="mt-4 w-full bg-amber-600 text-zinc-900 font-bold py-2 hover:bg-amber-500 transition"
                  >
                    🚀 LAUNCH (Enter)
                  </button>
                </div>
              );
            })()}
        </div>
      ) : (
        // List view
        <div className="grid grid-cols-3 gap-4">
          {/* Wreck List */}
          <div className="col-span-2 space-y-3">
            {availableWrecks.map((w, index) => {
              const totalValue = w.rooms.reduce(
                (sum, room) =>
                  sum + room.loot.reduce((s, item) => s + (item.value ?? 0), 0),
                0,
              );

              return (
                <div
                  key={w.id}
                  onClick={() => setSelectedWreckId(w.id)}
                  className="cursor-pointer"
                >
                  <CyberPanel
                    variant={selectedWreckId === w.id ? "default" : "default"}
                    className={`transition-all ${
                      selectedWreckId === w.id
                        ? "border-amber-500 border-2"
                        : "hover:border-amber-500/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-amber-100 font-bold flex items-center gap-2 text-glow-amber">
                          {w.name}
                          {index < 9 && (
                            <span className="text-amber-600 text-xs bg-zinc-900 px-2 py-0.5 rounded">
                              [{index + 1}]
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-400 text-xs mt-2 space-y-0.5 font-mono">
                          <div>
                            TYPE______ {w.type.toUpperCase()}{" "}
                            <span className="text-amber-300">
                              •{" "}
                              {{
                                military: "军事",
                                science: "科学",
                                industrial: "工业",
                                luxury: "豪华",
                                civilian: "平民",
                              }[w.type] ?? ""}
                            </span>
                          </div>
                          <div>TIER______ {w.tier}</div>
                          <div>DISTANCE__ {w.distance} AU</div>
                          <div>ROOMS_____ {w.rooms.length}</div>
                          <div>
                            VALUE_____{" "}
                            <span className="text-amber-500 text-glow-amber">
                              {totalValue.toLocaleString()} CR
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CyberPanel>
                </div>
              );
            })}
          </div>

          {/* Details Panel */}
          <div className="space-y-3">
            {selectedWreck && (
              <>
                <WreckDetailsPanel wreck={selectedWreck} />
                <CyberButton
                  variant="primary"
                  glowColor="amber"
                  onClick={() => {
                    if (selectedWreckId) {
                      startRun(selectedWreckId);
                      onNavigate("travel");
                    }
                  }}
                  className="w-full"
                >
                  🚀 LAUNCH (Enter)
                </CyberButton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
