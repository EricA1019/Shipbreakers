import { useState, useEffect } from 'react';
// import { Tooltip } from 'react-tooltip';
import './App.css';
import HubScreen from './components/screens/HubScreen';
import WreckSelectScreen from './components/screens/WreckSelectScreen';
import TravelScreen from './components/screens/TravelScreen';
import SalvageScreen from './components/screens/SalvageScreen';
import RunSummaryScreen from './components/screens/RunSummaryScreen';
import SellScreen from './components/screens/SellScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import { NotificationProvider, useNotifications, setGlobalNotificationHandler } from './components/ui/NotificationSystem';
// import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
// import { useGameNotifications } from './hooks/useGameNotifications';

type Screen = 'hub' | 'select' | 'travel' | 'salvage' | 'summary' | 'sell' | 'gameover';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('hub');
  const { addNotification } = useNotifications();

  // Register global notification handler
  useEffect(() => {
    setGlobalNotificationHandler(addNotification);
  }, [addNotification]);

  return (
    <div className="min-h-screen bg-zinc-900 text-amber-50 font-mono p-4">
      {screen === 'hub' && <HubScreen onNavigate={setScreen} />}
      {screen === 'select' && <WreckSelectScreen onNavigate={setScreen} />}
      {screen === 'travel' && <TravelScreen onNavigate={setScreen} />}
      {screen === 'salvage' && <SalvageScreen onNavigate={setScreen} />}
      {screen === 'summary' && <RunSummaryScreen onNavigate={setScreen} />}
      {screen === 'sell' && <SellScreen onNavigate={setScreen} />}
      {screen === 'gameover' && <GameOverScreen onNavigate={setScreen} />}
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
