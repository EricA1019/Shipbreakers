
import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import GraveyardMap from '../ui/GraveyardMap';
import ZoneUnlockModal from '../ui/ZoneUnlockModal';
import VictoryModal from '../ui/VictoryModal';
import WreckDetailsPanel from '../ui/WreckDetailsPanel';
import { getWreckPreview } from '../../game/wreckGenerator';

export default function WreckSelectScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const [selectedWreckId, setSelectedWreckId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

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

      if (e.key >= '1' && e.key <= '9') {
        const wreckIndex = parseInt(e.key) - 1;
        if (wreckIndex < availableWrecks.length) {
          e.preventDefault();
          setSelectedWreckId(availableWrecks[wreckIndex].id);
        }
      }

      if (e.key === 'Enter' && selectedWreckId) {
        e.preventDefault();
        const selected = availableWrecks.find((w) => w.id === selectedWreckId);
        if (selected) {
          startRun(selected.id);
          onNavigate('travel');
        }
      }

      // M key for map toggle
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setShowMap(!showMap);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
          onClose={() => setShowZoneModal(false)}
        />
      )}

      {/* Victory modal */}
      {showVictoryModal && (
        <VictoryModal
          stats={stats}
          onNewGame={() => {
            localStorage.removeItem('ship-breakers-store');
            initializeGame();
            window.location.reload();
          }}
          onContinue={() => setShowVictoryModal(false)}
        />
      )}

      {/* Header */}
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4 flex justify-between items-center">
        <div className="text-amber-500 font-bold">SALVAGE ASSIGNMENT</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-3 py-1 text-xs font-bold transition ${
              showMap
                ? 'bg-amber-600 text-zinc-900'
                : 'bg-zinc-700 text-amber-400 border border-amber-600/30'
            }`}
          >
            {showMap ? '🗺️ MAP' : '📋 LIST'} (M)
          </button>
          <button
            className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30"
            onClick={() => {
              if (credits >= 50) scanForWrecks();
            }}
          >
            🔍 Scan (50 CR)
          </button>
          <button
            className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30"
            onClick={() => onNavigate('hub')}
          >
            ← Back
          </button>
        </div>
      </div>

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
          {selectedWreck && (() => {
            const preview = wreckPreviews.find((p) => p.id === selectedWreckId);
            return (
              <div className="bg-zinc-800 border border-amber-600/20 p-4 rounded">
                <div className="text-amber-400 font-bold mb-3">{selectedWreck.name}</div>
                <div className="text-zinc-300 text-sm space-y-1">
                  <div>
                    Distance: <span className="text-amber-300 font-mono">{selectedWreck.distance} AU</span>
                  </div>
                  <div>
                    Type: <span className="text-amber-300">{selectedWreck.type.toUpperCase()}</span>
                  </div>
                  <div>
                    Rooms: <span className="text-amber-300">{selectedWreck.rooms.length}</span>
                  </div>
                  {preview && (
                    <div>
                      Estimated Mass: <span className="text-amber-300">{preview.estimatedMass.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (selectedWreckId) {
                      startRun(selectedWreckId);
                      onNavigate('travel');
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
            {availableWrecks.map((w, index) => (
              <div
                key={w.id}
                onClick={() => setSelectedWreckId(w.id)}
                className={`cursor-pointer p-3 border transition-all ${
                  selectedWreckId === w.id
                    ? 'bg-amber-600/10 border-amber-500'
                    : 'bg-zinc-800 border-amber-600/20 hover:border-amber-500/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-amber-100 font-bold flex items-center gap-2">
                      {w.name}
                      {index < 9 && (
                        <span className="text-amber-600 text-xs bg-zinc-900 px-2 py-0.5 rounded">
                          [{index + 1}]
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-400 text-xs">
                      {w.type.toUpperCase()} • {w.distance} AU • {w.rooms.length} rooms • Tier{' '}
                      {w.tier}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-amber-500 font-bold">
                      {w.rooms
                        .reduce(
                          (sum, room) =>
                            sum +
                            room.loot.reduce((s, item) => s + (item.value ?? 0), 0),
                          0
                        )
                        .toLocaleString()}{' '}
                      CR
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="space-y-3">
            {selectedWreck && (
              <>
                <WreckDetailsPanel wreck={selectedWreck} />
                <button
                  onClick={() => {
                    if (selectedWreckId) {
                      startRun(selectedWreckId);
                      onNavigate('travel');
                    }
                  }}
                  className="w-full bg-amber-600 text-zinc-900 font-bold py-2 rounded hover:bg-amber-500"
                >
                  🚀 LAUNCH (Enter)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
