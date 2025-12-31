
import { useGameStore } from '../../stores/gameStore';
import ItemCard from '../ui/ItemCard';
import { SKILL_XP_THRESHOLDS } from '../../game/constants';

export default function HubScreen({ onNavigate }: { onNavigate: (s: any) => void }) {
  const { credits, fuel, crew, initializeGame, currentRun, sellAllLoot, inventory, sellItem, day, licenseDaysRemaining, licenseFee, payLicense } = useGameStore((s) => ({ 
    credits: s.credits, 
    fuel: s.fuel, 
    crew: s.crew, 
    initializeGame: s.initializeGame,
    currentRun: s.currentRun,
    sellAllLoot: s.sellAllLoot,
    inventory: s.inventory,
    sellItem: s.sellItem,
    day: s.day,
    licenseDaysRemaining: s.licenseDaysRemaining,
    licenseFee: s.licenseFee,
    payLicense: s.payLicense,
  }));

  const hasLootToSell = currentRun?.status === 'completed' && currentRun.collectedLoot.length > 0;
  const lootValue = hasLootToSell ? currentRun.collectedLoot.reduce((s, l) => s + l.value, 0) : 0;

  // Calculate XP thresholds for each skill
  const getXpProgress = (skillName: keyof typeof crew.skills) => {
    const currentLevel = crew.skills[skillName];
    const currentXp = crew.skillXp[skillName];
    
    console.log(`[HubScreen] ${skillName}: Lv.${currentLevel}, XP: ${currentXp}`);
    
    if (currentLevel >= 5) {
      return { current: currentXp, needed: 0, percent: 100, isMaxLevel: true };
    }
    
    // Calculate cumulative XP for current level
    let cumulativeXp = 0;
    for (let i = 0; i < currentLevel - 1; i++) {
      cumulativeXp += SKILL_XP_THRESHOLDS[i];
    }
    
    const nextThreshold = SKILL_XP_THRESHOLDS[currentLevel - 1];
    const xpIntoCurrentLevel = currentXp - cumulativeXp;
    const percent = (xpIntoCurrentLevel / nextThreshold) * 100;
    
    return { current: xpIntoCurrentLevel, needed: nextThreshold, percent, isMaxLevel: false };
  };

  const handleSellLoot = () => {
    sellAllLoot();
  };

  const handleReset = () => {
    localStorage.removeItem('ship-breakers-store');
    initializeGame();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-950 border-b-2 border-amber-600/30 p-3 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-amber-500 font-bold text-xl tracking-wider">[SHIPBREAKERS]</div>
            <div className="text-amber-600/50 text-sm">CINDER STATION // HUD</div>
          </div>
          <div className="flex gap-6 text-sm">
            <div>💰 <span className="text-amber-100">{credits} CR</span></div>
            <div>⛽ <span className="text-orange-100">{fuel}</span></div>
          </div>
        </div>
      </div>

      {/* Sell Loot Banner */}
      {hasLootToSell && (
        <div className="bg-amber-500/10 border-2 border-amber-500 p-4 mb-4 animate-pulse">
          <div className="text-amber-500 text-xs font-semibold tracking-wider mb-2">💰 LOOT READY TO SELL</div>
          <div className="text-amber-100 mb-3">
            You have {currentRun.collectedLoot.length} items worth {lootValue} CR from your last run.
          </div>
          <button 
            className="bg-amber-500 text-zinc-900 px-4 py-2 font-bold hover:bg-amber-400"
            onClick={handleSellLoot}
          >
            Sell All Loot ({lootValue} CR)
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800 border border-amber-600/20 p-4"> 
          <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">CREW</div>
          <div className="text-amber-100 font-bold">{crew.name}</div>
          <div className="text-zinc-400 text-xs">❤️ {crew.hp}/{crew.maxHp}</div>
          <div className="mt-3 space-y-3">
            {(['technical', 'combat', 'salvage', 'piloting'] as const).map((skill) => {
              const progress = getXpProgress(skill);
              return (
                <div key={skill}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300 capitalize font-semibold">{skill}</span>
                    <span className="text-amber-500 font-bold">Lv.{crew.skills[skill]}</span>
                  </div>
                  {!progress.isMaxLevel && (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 bg-black h-4 rounded border-2 border-amber-500/70 overflow-hidden shadow-lg">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-400 transition-all duration-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                          style={{ width: `${Math.max(3, progress.percent)}%` }}
                        />
                      </div>
                      <span className="text-amber-100 text-[10px] font-bold whitespace-nowrap">
                        {Math.floor(progress.current)}/{progress.needed}
                      </span>
                    </div>
                  )}
                  {progress.isMaxLevel && (
                    <div className="text-amber-400 text-xs font-bold bg-zinc-900 border border-amber-600/30 rounded px-2 py-1 text-center">⭐ MAX LEVEL</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-700">
            <div className="text-zinc-400 text-xs">Day: {day}</div>
            <div className="text-zinc-400 text-xs">License: {licenseDaysRemaining} days</div>
            {licenseDaysRemaining <= 2 && licenseDaysRemaining > 0 && (
              <button 
                onClick={payLicense}
                disabled={credits < licenseFee}
                className="mt-2 bg-amber-500 text-zinc-900 px-2 py-1 text-xs font-bold disabled:opacity-50"
              >
                Renew License ({licenseFee} CR)
              </button>
            )}
            {licenseDaysRemaining <= 0 && (
              <div className="mt-2 text-red-500 text-xs font-bold">⚠️ LICENSE EXPIRED!</div>
            )}
          </div>
        </div>

        <div className="col-span-2 bg-zinc-800 border border-amber-600/20 p-4">
          <div className="text-amber-500 text-xs font-semibold tracking-wider mb-3">INVENTORY ({inventory.length} items)</div>
          {inventory.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {inventory.map((item) => (
                <ItemCard key={item.id} item={item} onSell={() => sellItem(item.id)} />
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">No items in inventory</div>
          )}
        </div>
      </div>

      <div className="mt-4 bg-zinc-800 border border-amber-600/20 p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-amber-500 text-xs font-semibold tracking-wider mb-1">GOAL</div>
            <div className="text-amber-100 font-bold">10,000 CR (Prototype)</div>
          </div>
          <div className="flex gap-2">
            <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30" onClick={() => onNavigate('select')}>🚀 Select Wreck</button>
            <button className="bg-zinc-700 px-3 py-1 text-xs border border-amber-600/30" onClick={handleReset}>🔄 Reset</button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button className="bg-amber-500 text-zinc-900 px-4 py-2 rounded" onClick={() => onNavigate('sell')}>Sell Loot</button>
      </div>
    </div>
  );
}
