import { useState } from 'react';
import './App.css';
import HubScreen from './components/screens/HubScreen';
import WreckSelectScreen from './components/screens/WreckSelectScreen';
import TravelScreen from './components/screens/TravelScreen';
import SalvageScreen from './components/screens/SalvageScreen';
import RunSummaryScreen from './components/screens/RunSummaryScreen';
import SellScreen from './components/screens/SellScreen';
import GameOverScreen from './components/screens/GameOverScreen';

type Screen = 'hub' | 'select' | 'travel' | 'salvage' | 'summary' | 'sell' | 'gameover';

function App() {
  const [screen, setScreen] = useState<Screen>('hub');

  // Basic top-level navigation
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

export default App;
