import { useState, useEffect } from "react";
import { useGameStore } from "../../stores/gameStore";
import FuelDepotModal from "../ui/FuelDepotModal";
import MedicalBayModal from "../ui/MedicalBayModal";
import StatsModal from "../ui/StatsModal";
import SettingsModal from "../ui/SettingsModal";
import ConfirmationModal from "../ui/ConfirmationModal";
import HireCrewModal from "../ui/HireCrewModal";
import CrewSelectionModal from "../ui/CrewSelectionModal";
import StationBarPanel from "../ui/StationBarPanel";
import ShoreLeavePanel from "../ui/ShoreLeavePanel";
import IndustrialPanel from "../ui/IndustrialPanel";
import IndustrialButton from "../ui/IndustrialButton";
import StatChip from "../ui/StatChip";
import StatusPill from "../ui/StatusPill";
import { useAudio } from "../../hooks/useAudio";
import { LICENSE_TIERS } from "../../types";

import type { ScreenProps } from "../../types";

export default function HubScreen({ onNavigate }: ScreenProps) {
  const audio = useAudio();
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
    day,
    licenseDaysRemaining,
    licenseFee,
    payLicense,
    licenseTier,
    upgradeLicense,
    crewRoster,
  } = useGameStore((s) => ({
    credits: s.credits,
    fuel: s.fuel,
    initializeGame: s.initializeGame,
    currentRun: s.currentRun,
    sellAllLoot: s.sellAllLoot,
    day: s.day,
    licenseDaysRemaining: s.licenseDaysRemaining,
    licenseFee: s.licenseFee,
    payLicense: s.payLicense,
    licenseTier: s.licenseTier,
    upgradeLicense: s.upgradeLicense,
    crewRoster: s.crewRoster,
  }));

  // Play transition sound on mount
  useEffect(() => {
    audio.playTransition();
  }, []);

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

  const hasLootToSell =
    currentRun?.status === "completed" && currentRun.collectedLoot.length > 0;
  const lootValue = hasLootToSell
    ? currentRun.collectedLoot.reduce((s, l) => s + l.value, 0)
    : 0;

  const fuelPercent = Math.round((fuel / 100) * 100);

  const handleSellLoot = () => {
    audio.playSuccess();
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
    <div className="max-w-[1400px] mx-auto">
      {/* TOP STATUS BAR */}
      <IndustrialPanel
        title="CINDER STATION // HUB"
        subtitle={`SALVAGE LICENSE #47832 · TIER: ${licenseTier.toUpperCase()} · STATUS: ACTIVE`}
        showTape
        headerRight={
          <>
            <StatChip label="DAY" value={day} variant="amber" />
            <StatChip
              label="CREDITS"
              value={`${(credits / 1000).toFixed(1)}K`}
              variant="cyan"
            />
            <StatChip label="FUEL" value={`${fuelPercent}%`} variant="green" />
          </>
        }
      >
        <></>
      </IndustrialPanel>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
        {/* LEFT COLUMN */}
        <div>
          {/* STATION SERVICES */}
          <IndustrialPanel
            title="STATION SERVICES"
            showTape
            headerRight={<StatusPill icon="dot" label="DOCKED" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <IndustrialButton
                title="🗺️ Mission Select"
                description="Browse wrecks & plan runs"
                variant="primary"
                onClick={() => onNavigate("select")}
              />
              <IndustrialButton
                title="⛽ Fuel Depot"
                description="Refuel ship (85 cr/unit)"
                variant="info"
                onClick={() => setShowFuelDepot(true)}
              />
              <IndustrialButton
                title="🏥 Medical Bay"
                description="Heal injured crew (200 cr)"
                variant="success"
                onClick={() => setShowMedicalBay(true)}
              />
              <IndustrialButton
                title="🛠️ Ship Equipment"
                description="Manage loadout & power"
                variant="info"
                onClick={() => onNavigate("shipyard")}
              />
              <IndustrialButton
                title="🛒 Equipment Shop"
                description="Buy reactors, tools, systems"
                variant="info"
                onClick={() => onNavigate("shop")}
              />
              <IndustrialButton
                title="👥 Crew Management"
                description="Roster, skills, assignments"
                variant="info"
                onClick={() => onNavigate("crew")}
              />
            </div>
          </IndustrialPanel>

          {/* HAUL MANAGEMENT */}
          {hasLootToSell && (
            <IndustrialPanel
              title="HAUL MANAGEMENT"
              subtitle={`${currentRun.collectedLoot.length} ITEMS IN CARGO · ${(lootValue / 1000).toFixed(1)}K VALUE`}
              showTape
              variant="warning"
            >
              <div className="space-y-2 mb-4">
                {currentRun.collectedLoot.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.28)]"
                  >
                    <div>
                      <div className="font-semibold text-[13px]">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {item.rarity} · {item.category}
                      </div>
                    </div>
                    <div
                      className="font-['Orbitron'] text-lg font-extrabold text-[var(--cyan)]"
                      style={{ textShadow: "var(--glowC)" }}
                    >
                      {(item.value / 1000).toFixed(1)}K
                    </div>
                  </div>
                ))}
              </div>
              <IndustrialButton
                title="💰 Sell All Loot"
                description={`Cash out entire cargo hold (${lootValue} credits)`}
                variant="success"
                fullWidth
                onClick={handleSellLoot}
              />
            </IndustrialPanel>
          )}

          {/* LICENSE STATUS */}
          <IndustrialPanel
            title="LICENSE STATUS"
            showTape
            variant={licenseDaysRemaining <= 2 ? "warning" : "default"}
            headerRight={
              <StatusPill
                icon="dot"
                label={`${licenseDaysRemaining} DAYS LEFT`}
                variant={licenseDaysRemaining <= 2 ? "warning" : "default"}
              />
            }
          >
            <div className="space-y-4">
              {/* Current License */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider">
                    Current: {licenseTier.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-[var(--haz)]">
                    FEE: {licenseFee.toLocaleString()} cr
                  </span>
                </div>
                {licenseDaysRemaining <= 2 && (
                  <IndustrialButton
                    title="💳 Pay License Fee"
                    description="Extend license by 7 days"
                    variant="primary"
                    fullWidth
                    disabled={credits < licenseFee}
                    onClick={payLicense}
                  />
                )}
              </div>

              {/* Upgrade Option */}
              {nextTier && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[11px] text-[var(--muted)] uppercase tracking-wider">
                      Upgrade: {nextTier.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-[var(--cyan)]">
                      COST: {LICENSE_TIERS[nextTier].cost.toLocaleString()} cr
                    </span>
                  </div>
                  <IndustrialButton
                    title="⬆️ Upgrade License Tier"
                    description="Access high-value zones & better stock"
                    variant="info"
                    fullWidth
                    disabled={credits < LICENSE_TIERS[nextTier].cost}
                    onClick={() => upgradeLicense(nextTier)}
                  />
                </div>
              )}
            </div>
          </IndustrialPanel>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* CREW ROSTER */}
          <IndustrialPanel
            title="CREW ROSTER"
            subtitle={`${crewRoster.length} / 4 MEMBERS`}
            showTape
            headerRight={<StatusPill icon="dot" label="LINK STABLE" />}
          >
            <div className="space-y-3 mb-4">
              {crewRoster.map((crew) => {
                const hpPercent = (crew.hp / crew.maxHp) * 100;
                const staminaPercent = (crew.stamina / 100) * 100;
                const sanityPercent = (crew.sanity / 100) * 100;
                const isInjured = hpPercent < 50;

                return (
                  <div
                    key={crew.id}
                    className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.26)] p-3"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-[13px]">
                          {crew.name.toUpperCase()}
                        </div>
                        <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">
                          {crew.background || "HAULER"}
                        </div>
                      </div>
                      <div
                        className={`text-[10px] px-2 py-1 rounded-full border ${isInjured ? "border-[rgba(255,75,75,0.25)] bg-[rgba(0,0,0,0.28)] text-[var(--bad)]" : "border-[rgba(113,255,120,0.25)] bg-[rgba(0,0,0,0.28)] text-[var(--ok)]"} uppercase`}
                      >
                        {isInjured ? "INJURED" : "ACTIVE"}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <div className="text-[var(--muted)] uppercase tracking-wider">
                          HP
                        </div>
                        <div
                          className="h-1 rounded-full bg-[rgba(255,255,255,0.08)] mt-1 overflow-hidden"
                          style={{ border: "1px solid rgba(0,0,0,0.35)" }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${hpPercent}%`,
                              background: isInjured
                                ? "linear-gradient(90deg, rgba(255,75,75,0.85), rgba(255,106,42,0.85))"
                                : "linear-gradient(90deg, rgba(113,255,120,0.85), rgba(56,224,199,0.85))",
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--muted)] uppercase tracking-wider">
                          STAMINA
                        </div>
                        <div
                          className="h-1 rounded-full bg-[rgba(255,255,255,0.08)] mt-1 overflow-hidden"
                          style={{ border: "1px solid rgba(0,0,0,0.35)" }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${staminaPercent}%`,
                              background:
                                "linear-gradient(90deg, rgba(113,255,120,0.85), rgba(56,224,199,0.85))",
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--muted)] uppercase tracking-wider">
                          SANITY
                        </div>
                        <div
                          className="h-1 rounded-full bg-[rgba(255,255,255,0.08)] mt-1 overflow-hidden"
                          style={{ border: "1px solid rgba(0,0,0,0.35)" }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${sanityPercent}%`,
                              background:
                                "linear-gradient(90deg, rgba(113,255,120,0.85), rgba(56,224,199,0.85))",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <HireCrewModal />
              <CrewSelectionModal />
            </div>
          </IndustrialPanel>

          {/* STATION BAR */}
          <StationBarPanel />
          <ShoreLeavePanel />

          {/* SYSTEM OPTIONS */}
          <IndustrialPanel title="SYSTEM" showTape>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <IndustrialButton
                title="📊 Statistics"
                description="View career stats"
                variant="info"
                onClick={() => setShowStats(true)}
              />
              <IndustrialButton
                title="⚙️ Settings"
                description="Audio, controls, gameplay"
                variant="info"
                onClick={() => setShowSettings(true)}
              />
              <IndustrialButton
                title="📦 Sell Loot"
                description="Individual item sales"
                variant="info"
                onClick={() => onNavigate("sell")}
              />
              <IndustrialButton
                title="🔄 Reset Game"
                description="Start new career"
                variant="danger"
                onClick={handleReset}
              />
            </div>
          </IndustrialPanel>
        </div>
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
