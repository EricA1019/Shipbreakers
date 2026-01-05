import { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import GraveyardMap from "../ui/GraveyardMap";
import ZoneUnlockModal from "../ui/ZoneUnlockModal";
import VictoryModal from "../ui/VictoryModal";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import StatusPill from "../ui/StatusPill";
import HazardTag from "../ui/HazardTag";
import { ScanningProgress } from "../ui/VisualEffects";
import { getWreckPreview } from "../../game/wreckGenerator";
import { useAudio } from "../../hooks/useAudio";
import { STORE_STORAGE_KEY } from "../../services/SaveService";

import type { ScreenProps } from "../../types";

export default function WreckSelectScreen({ onNavigate }: ScreenProps) {
  const [selectedWreckId, setSelectedWreckId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanKey, _setScanKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const audio = useAudio();

  useEffect(() => {
    audio.playTransition();
  }, []);

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
    audio.playClick();
    setSelectedWreckId(wreckId);
    setShowMap(false);
  };

  // Filter wrecks
  const filteredWrecks = availableWrecks.filter((w) => {
    if (typeFilter !== "all" && w.type !== typeFilter) return false;
    if (tierFilter !== "all" && w.tier.toString() !== tierFilter) return false;
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto">
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
            localStorage.removeItem(STORE_STORAGE_KEY);
            initializeGame();
            window.location.reload();
          }}
          onContinue={() => setShowVictoryModal(false)}
        />
      )}

      {/* Header */}
      <IndustrialPanel
        title="MISSION SELECT"
        subtitle="AVAILABLE SALVAGE CONTRACTS · CINDER STATION"
      >
        <div className="flex items-center gap-2">
          <StatChip label="CREDITS" value={`${(credits / 1000).toFixed(1)}K`} variant="amber" />
          <StatChip label="FUEL" value={useGameStore.getState().fuel} variant="cyan" />
        </div>
      </IndustrialPanel>

      {isScanning && (
        <IndustrialPanel className="my-4">
          <ScanningProgress
            key={scanKey}
            label="SCANNING FOR WRECKS..."
            duration={4000}
            onComplete={() => {
              scanForWrecks();
              setIsScanning(false);
              audio.playNotification();
            }}
          />
        </IndustrialPanel>
      )}

      {/* Filters */}
      {!showMap && (
        <IndustrialPanel title="FILTERS">
          <div className="flex items-center justify-between">
            <StatusPill variant="default" label={`${filteredWrecks.length} CONTRACTS`} />
          </div>
          <div className="mt-4 mb-3">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">TYPE</div>
            <div className="flex flex-wrap gap-2">
              {['all', 'military', 'industrial', 'science', 'civilian'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    audio.playClick();
                    setTypeFilter(type);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-wide transition-all ${
                    typeFilter === type
                      ? 'bg-amber-500/15 border border-amber-500 text-amber-400'
                      : 'bg-black/30 border border-white/8 text-zinc-400 hover:border-amber-400 hover:text-amber-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">TIER</div>
            <div className="flex flex-wrap gap-2">
              {['all', '1', '2', '3', '4'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => {
                    audio.playClick();
                    setTierFilter(tier);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs uppercase tracking-wide transition-all ${
                    tierFilter === tier
                      ? 'bg-amber-500/15 border border-amber-500 text-amber-400'
                      : 'bg-black/30 border border-white/8 text-zinc-400 hover:border-amber-400 hover:text-amber-400'
                  }`}
                >
                  {tier === 'all' ? 'ALL' : `T${tier}`}
                </button>
              ))}
            </div>
          </div>
        </IndustrialPanel>
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
          {selectedWreck && (
            <IndustrialPanel title={selectedWreck.name.toUpperCase()}>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <StatChip label="SIZE" value={selectedWreck.rooms.length} variant="cyan" />
                <StatChip 
                  label="VALUE" 
                  value={`${(selectedWreck.rooms.reduce((sum, room) => 
                    sum + room.loot.reduce((s, item) => s + (item.value ?? 0), 0), 0
                  ) / 1000).toFixed(1)}K`}
                  variant="amber" 
                />
                <StatChip label="FUEL" value={selectedWreck.distance} variant="cyan" />
              </div>
              <div className="text-xs text-zinc-400 mb-3">
                {selectedWreck.type.toUpperCase()} · {selectedWreck.distance} AU
              </div>
              <IndustrialButton
                variant="primary"
                onClick={() => {
                  if (selectedWreckId) {
                    audio.playTransition();
                    startRun(selectedWreckId);
                    onNavigate("travel");
                  }
                }}
                icon="rocket"
                title="LAUNCH"
                description="Begin salvage operation"
              />
            </IndustrialPanel>
          )}
        </div>
      ) : (
        // List view
        <>
          <IndustrialPanel title="AVAILABLE WRECKS">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
              {filteredWrecks.map((w) => {
                const totalValue = w.rooms.reduce(
                  (sum, room) =>
                    sum + room.loot.reduce((s, item) => s + (item.value ?? 0), 0),
                  0,
                );

                const hazards = [...new Set(
                  w.rooms.map((room) => room.hazardType)
                )];

                const isSelected = selectedWreckId === w.id;

                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      audio.playClick();
                      setSelectedWreckId(w.id);
                    }}
                    className={`bg-black/26 border rounded-xl p-4 cursor-pointer transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/8 shadow-[0_0_20px_rgba(56,224,199,0.2)]'
                        : 'border-white/8 hover:border-amber-400 hover:bg-amber-500/4 hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Type Badge */}
                    <div
                      className={`absolute top-3 right-3 text-[9px] px-2 py-1 rounded-md uppercase tracking-wide ${
                        w.type === 'military'
                          ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                          : w.type === 'industrial'
                          ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400'
                          : w.type === 'science'
                          ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
                          : 'bg-zinc-500/15 border border-zinc-500/30 text-zinc-400'
                      }`}
                    >
                      {w.type} · T{w.tier}
                    </div>

                    <div className="font-['Orbitron'] font-extrabold text-base text-amber-400 glow-amber mb-2 pr-20">
                      {w.name}
                    </div>
                    <div className="text-xs text-zinc-400 mb-3">
                      {w.type.charAt(0).toUpperCase() + w.type.slice(1)} vessel · {w.distance} AU
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-black/30 border border-white/6 rounded-md p-2 text-center">
                        <div className="text-[9px] text-zinc-400 uppercase tracking-wide mb-1">SIZE</div>
                        <div className="font-['Orbitron'] font-bold text-sm text-cyan-400">{w.rooms.length}</div>
                      </div>
                      <div className="bg-black/30 border border-white/6 rounded-md p-2 text-center">
                        <div className="text-[9px] text-zinc-400 uppercase tracking-wide mb-1">VALUE</div>
                        <div className="font-['Orbitron'] font-bold text-sm text-cyan-400">
                          {(totalValue / 1000).toFixed(1)}K
                        </div>
                      </div>
                      <div className="bg-black/30 border border-white/6 rounded-md p-2 text-center">
                        <div className="text-[9px] text-zinc-400 uppercase tracking-wide mb-1">FUEL</div>
                        <div className="font-['Orbitron'] font-bold text-sm text-cyan-400">{w.distance}</div>
                      </div>
                    </div>

                    {/* Hazards */}
                    {hazards.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {hazards.map((hazard, i) => (
                          <HazardTag key={i} label={hazard.toUpperCase()} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </IndustrialPanel>

          {/* Actions */}
          <IndustrialPanel>
            <div className="grid grid-cols-3 gap-3">
              <IndustrialButton
                variant="primary"
                onClick={() => {
                  if (selectedWreckId) {
                    audio.playTransition();
                    startRun(selectedWreckId);
                    onNavigate("travel");
                  }
                }}
                disabled={!selectedWreckId}
                icon="rocket"
                title="Begin Salvage"
                description="Launch to selected wreck"
              />
              <IndustrialButton
                onClick={() => {
                  audio.playClick();
                  setShowMap(true);
                }}
                icon="map"
                title="Map View"
                description="View graveyard map"
              />
              <IndustrialButton
                onClick={() => {
                  audio.playTransition();
                  onNavigate("hub");
                }}
                icon="home"
                title="← Back to Station"
                description="Return to hub"
              />
            </div>
          </IndustrialPanel>
        </>
      )}
    </div>
  );
}
