import { useState, useEffect } from "react";
// import { Tooltip } from 'react-tooltip';
import "./App.css";
import HubScreen from "./components/screens/HubScreen";
import CharacterCreationScreen from "./components/screens/CharacterCreationScreen";
import WreckSelectScreen from "./components/screens/WreckSelectScreen";
import TravelScreen from "./components/screens/TravelScreen";
import SalvageScreen from "./components/screens/SalvageScreen";
import RunSummaryScreen from "./components/screens/RunSummaryScreen";
import SellScreen from "./components/screens/SellScreen";
import GameOverScreen from "./components/screens/GameOverScreen";
import CrewScreen from "./components/screens/CrewScreen";
import CrewHiringScreen from "./components/screens/CrewHiringScreen";
import ShipyardScreen from "./components/screens/ShipyardScreen";
import EquipmentShopScreen from "./components/screens/EquipmentShopScreen";
import DevTools from "./components/debug/DevTools";
import Toasts from "./components/ui/Toast";
import {
  NotificationProvider,
  useNotifications,
  setGlobalNotificationHandler,
} from "./components/ui/NotificationSystem";
import { useGameStore } from "./stores/gameStore";
import { wasmBridge } from "./game/wasm/WasmBridge";
import EventModal from "./components/ui/EventModal";
import EventSummaryModal from "./components/ui/EventSummaryModal";
import { useAudio } from "./hooks/useAudio";
// import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
// import { useGameNotifications } from './hooks/useGameNotifications';

import type { Screen } from "./types";

function AppContent() {
  const [screen, setScreen] = useState<Screen>("hub");
  const isNewGame = useGameStore((s: any) => s.isNewGame ?? false);
  const tickCrewMovement = useGameStore((s: any) => s.tickCrewMovement);
  const { addNotification } = useNotifications();
  const audio = useAudio();

  // Initialize WASM bridge early
  useEffect(() => {
    wasmBridge.init();
  }, []);

  // Register global notification handler
  useEffect(() => {
    setGlobalNotificationHandler(addNotification);
  }, [addNotification]);

  // Start music on app load
  useEffect(() => {
    audio.startMusic();
  }, [audio]);

  // Global crew movement tick for visible feedback
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof tickCrewMovement !== "function") return;

    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      tickCrewMovement(dt);
    }, 150);

    return () => window.clearInterval(id);
  }, [tickCrewMovement]);

  return (
    <div className="min-h-screen bg-zinc-900 text-amber-50 font-mono p-4">
      {isNewGame && <CharacterCreationScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "hub" && <HubScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "select" && <WreckSelectScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "travel" && <TravelScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "salvage" && <SalvageScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "summary" && <RunSummaryScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "sell" && <SellScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "gameover" && <GameOverScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "crew" && <CrewScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "hire" && <CrewHiringScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "shipyard" && <ShipyardScreen onNavigate={(s) => setScreen(s)} />}
      {!isNewGame && screen === "shop" && <EquipmentShopScreen onNavigate={(s) => setScreen(s)} /> }
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
      <Toasts />
      <EventModal />
      <EventSummaryModal />
      {/* Toggle with the backtick (`) key */}
      <DevTools />
    </NotificationProvider>
  );
}

export default App;
