import { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import ItemCard from "../ui/ItemCard";
import FuelDepotModal from "../ui/FuelDepotModal";
import MedicalBayModal from "../ui/MedicalBayModal";
import StatsModal from "../ui/StatsModal";
import SettingsModal from "../ui/SettingsModal";
import ConfirmationModal from "../ui/ConfirmationModal";
import CrewRosterPanel from "../ui/CrewRosterPanel";
import HireCrewModal from "../ui/HireCrewModal";
import CrewSelectionModal from "../ui/CrewSelectionModal";
import StationBarPanel from "../ui/StationBarPanel";
import ShoreLeavePanel from "../ui/ShoreLeavePanel";
import ShipStatusPanel from "../game/ShipStatusPanel";
import CyberPanel from "../ui/CyberPanel";
import CyberButton from "../ui/CyberButton";
import BilingualLabel from "../ui/BilingualLabel";
import { HUB_GRAFFITI, pickCorp } from "../../utils/flavorText";
import { LICENSE_TIERS } from "../../types";

import type { ScreenProps } from "../../types";

export default function HubScreen({ onNavigate }: ScreenProps) {
  const [showFuelDepot, setShowFuelDepot] = useState(false);
  const [showMedicalBay, setShowMedicalBay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    credits,
    fuel,
    initializeGame,
    currentRun,
    sellAllLoot,
    inventory,
    sellItem,
    day,
    licenseDaysRemaining,
    licenseFee,
    payLicense,
    licenseTier,
    upgradeLicense,
    equipmentInventory,
  } = useGameStore((s) => ({
    credits: s.credits,
    fuel: s.fuel,
    initializeGame: s.initializeGame,
    currentRun: s.currentRun,
    sellAllLoot: s.sellAllLoot,
    inventory: s.inventory,
    sellItem: s.sellItem,
    day: s.day,
    licenseDaysRemaining: s.licenseDaysRemaining,
    licenseFee: s.licenseFee,
    payLicense: s.payLicense,
    licenseTier: s.licenseTier,
    upgradeLicense: s.upgradeLicense,
    equipmentInventory: s.equipmentInventory || [],
  }));

  // Determine next tier for upgrade
  const tierProgression: Array<typeof licenseTier> = [
    "basic",
    "standard",
    "premium",
  ];
  const currentTierIndex = tierProgression.indexOf(licenseTier);
  const nextTier =
    currentTierIndex < tierProgression.length - 1
      ? tierProgression[currentTierIndex + 1]
      : null;

  // Local flavor: pick a corp name for the hub (small bilingual label)
  const corp = pickCorp(day);

  const hasLootToSell =
    currentRun?.status === "completed" && currentRun.collectedLoot.length > 0;
  const lootValue = hasLootToSell
    ? currentRun.collectedLoot.reduce((s, l) => s + l.value, 0)
    : 0;

  const handleSellLoot = () => {
    sellAllLoot();
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    localStorage.removeItem("ship-breakers-store-v1");
    initializeGame();
    window.location.reload();
  };

  // Keyboard shortcuts for HubScreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setShowStats(!showStats);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setShowFuelDepot(!showFuelDepot);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setShowMedicalBay(!showMedicalBay);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStats, showFuelDepot, showMedicalBay]);

  return (
    <div className="max-w-4xl mx-auto">
      <CyberPanel title="[SHIPBREAKERS] CINDER STATION // HUD" className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="text-amber-100 font-bold text-xl tracking-wider text-glow-amber">
              STATION STATUS:{" "}
              <span className="text-green-400 text-glow-green">[NOMINAL]</span>
            </div>
            <div className="mt-1 text-xs text-amber-200/60">
              {HUB_GRAFFITI[day % HUB_GRAFFITI.length]}
            </div>
          </div>
          <div className="flex gap-4 text-sm items-center">
            <div>
              💰{" "}
              <span className="text-amber-100 text-glow-amber">
                {credits} CR
              </span>
            </div>
            <div>
              ⛽ <span className="text-orange-100 text-glow-amber">{fuel}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate("shipyard")}
                className="px-3 py-1 bg-zinc-800 border border-amber-600/30 text-amber-400 hover:bg-zinc-700 text-xs rounded"
              >
                🔧 SHIPYARD
              </button>
              <button
                onClick={() => onNavigate("shop")}
                className="px-3 py-1 bg-zinc-800 border border-amber-600/30 text-amber-400 hover:bg-zinc-700 text-xs rounded"
              >
                🛒 SHOP
              </button>
            </div>
          </div>
        </div>
      </CyberPanel>

      {/* Sell Loot Banner */}
      {hasLootToSell && (
        <CyberPanel
          variant="warning"
          title="💰 LOOT READY TO SELL"
          className="mb-4 animate-pulse"
        >
          <div className="text-amber-100 mb-3">
            You have {currentRun.collectedLoot.length} items worth {lootValue}{" "}
            CR from your last run.
          </div>
          <CyberButton
            variant="primary"
            glowColor="amber"
            onClick={handleSellLoot}
          >
            Sell All Loot ({lootValue} CR)
            {/* Equipment Inventory Banner */}
            {equipmentInventory.length > 0 && (
              <CyberPanel
                variant="default"
                title="🔧 EQUIPMENT INVENTORY"
                className="mb-4"
              >
                <div className="text-amber-100 mb-3">
                  You have {equipmentInventory.length} pieces of equipment.
                  Visit the Shipyard to install them on your ship.
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {equipmentInventory.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-800 border border-amber-600/20 p-2 rounded"
                    >
                      <div className="text-amber-400 font-bold">
                        {item.name}
                      </div>
                      <div className="text-zinc-400">Tier {item.tier}</div>
                    </div>
                  ))}
                </div>
                {equipmentInventory.length > 8 && (
                  <div className="mt-2 text-zinc-400 text-xs">
                    +{equipmentInventory.length - 8} more items
                  </div>
                )}
                <div className="mt-3">
                  <CyberButton
                    variant="secondary"
                    glowColor="amber"
                    onClick={() => onNavigate("shipyard")}
                  >
                    Go to Shipyard
                  </CyberButton>
                </div>
              </CyberPanel>
            )}
          </CyberButton>
        </CyberPanel>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-4">
          <CyberPanel title="CREW ROSTER">
            <div className="mb-2 flex justify-end">
              <button
                className="text-amber-500 text-xs hover:text-amber-400 border border-amber-600/30 px-2 py-1 rounded"
                onClick={() => onNavigate("crew")}
                title="View detailed crew stats"
              >
                📋 View All
              </button>
            </div>
            <CrewRosterPanel />
            <div className="mt-3 flex gap-2">
              <HireCrewModal />
              <CrewSelectionModal />
            </div>
          </CyberPanel>

          <StationBarPanel />
          <ShoreLeavePanel />

          <CyberPanel
            title="LICENSE STATUS"
            variant={licenseDaysRemaining <= 0 ? "warning" : "default"}
          >
            <div className="space-y-2 text-sm">
              <div className="mb-2">
                <BilingualLabel en={corp.en} zh={corp.zh} size="sm" />
              </div>
              <div className="text-zinc-400">
                DAY__________{" "}
                <span className="text-amber-400 text-glow-amber">{day}</span>
              </div>
              <div className="text-zinc-400">
                TIER_________{" "}
                <span className="text-amber-400 text-glow-amber font-bold">
                  {licenseTier.toUpperCase()}
                </span>
              </div>
              <div className="text-zinc-400">
                DAYS_LEFT____{" "}
                <span
                  className={
                    licenseDaysRemaining <= 2
                      ? "text-red-400 text-glow-red"
                      : "text-green-400 text-glow-green"
                  }
                >
                  {licenseDaysRemaining}
                </span>
              </div>

              {/* License upgrade section */}
              {nextTier && (
                <div className="bg-amber-900/20 border border-amber-600/30 p-2 rounded mt-2">
                  <div className="text-amber-400 text-xs font-bold mb-1 text-glow-amber">
                    Upgrade Available
                  </div>
                  <div className="text-zinc-400 text-xs mb-1">
                    {LICENSE_TIERS[nextTier].label}
                  </div>
                  <CyberButton
                    onClick={() => upgradeLicense(nextTier)}
                    disabled={credits < LICENSE_TIERS[nextTier].cost}
                    variant="primary"
                    glowColor="amber"
                    className="w-full text-xs"
                  >
                    Upgrade ({LICENSE_TIERS[nextTier].cost} CR)
                  </CyberButton>
                </div>
              )}

              {/* Renewal section */}
              {licenseDaysRemaining <= 2 && licenseDaysRemaining > 0 && (
                <CyberButton
                  onClick={payLicense}
                  disabled={credits < licenseFee}
                  variant="danger"
                  glowColor="amber"
                  className="w-full mt-2 text-xs"
                >
                  Renew License ({licenseFee} CR)
                </CyberButton>
              )}

              {licenseDaysRemaining <= 0 && (
                <div className="mt-2 text-red-500 text-xs font-bold text-glow-red-strong">
                  ⚠️ LICENSE EXPIRED!
                </div>
              )}
            </div>
          </CyberPanel>
        </div>

        <div className="col-span-5">
          <ShipStatusPanel />
        </div>

        <CyberPanel
          title={`INVENTORY (${inventory.length} items)`}
          className="col-span-4"
        >
          {inventory.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {inventory.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onSell={() => sellItem(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">No items in inventory</div>
          )}
        </CyberPanel>
      </div>

      <CyberPanel title="MISSION OBJECTIVE" className="mt-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-amber-100 font-bold text-glow-amber">
              TARGET: 10,000 CR (Prototype)
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CyberButton
              variant="primary"
              glowColor="amber"
              onClick={() => setShowFuelDepot(true)}
              className="text-xs relative group"
            >
              ⛽ Fuel Depot
              <span className="hidden group-hover:inline absolute -top-6 left-0 bg-amber-800 px-1 py-0.5 rounded text-[10px] text-amber-100 whitespace-nowrap">
                (F)
              </span>
            </CyberButton>
            <CyberButton
              variant="primary"
              glowColor="green"
              onClick={() => setShowMedicalBay(true)}
              className="text-xs relative group"
            >
              🏥 Medical Bay
              <span className="hidden group-hover:inline absolute -top-6 left-0 bg-amber-800 px-1 py-0.5 rounded text-[10px] text-amber-100 whitespace-nowrap">
                (M)
              </span>
            </CyberButton>
            <CyberButton
              variant="primary"
              glowColor="cyan"
              onClick={() => setShowStats(true)}
              className="text-xs relative group"
            >
              📊 Stats
              <span className="hidden group-hover:inline absolute -top-6 left-0 bg-amber-800 px-1 py-0.5 rounded text-[10px] text-amber-100 whitespace-nowrap">
                (S)
              </span>
            </CyberButton>
            <CyberButton
              variant="secondary"
              onClick={() => setShowSettings(true)}
              className="text-xs"
            >
              ⚙️ Settings
            </CyberButton>
            <CyberButton
              variant="primary"
              glowColor="amber"
              onClick={() => onNavigate("select")}
              className="text-xs"
            >
              🚀 Select Wreck
            </CyberButton>
            <CyberButton
              variant="danger"
              onClick={handleReset}
              className="text-xs"
            >
              🔄 Reset
            </CyberButton>
          </div>
        </div>
      </CyberPanel>

      <div className="mt-4">
        <CyberButton
          variant="primary"
          glowColor="amber"
          onClick={() => onNavigate("sell")}
        >
          Sell Loot
        </CyberButton>
      </div>

      <FuelDepotModal
        isOpen={showFuelDepot}
        onClose={() => setShowFuelDepot(false)}
      />
      <MedicalBayModal
        isOpen={showMedicalBay}
        onClose={() => setShowMedicalBay(false)}
      />
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <ConfirmationModal
        isOpen={showResetConfirm}
        title="Reset Game"
        message="Are you sure you want to reset the entire game? All progress will be lost permanently."
        confirmText="Yes, Reset"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
