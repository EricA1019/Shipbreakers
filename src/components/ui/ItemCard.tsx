import type { Loot } from '../../types';

interface ItemCardProps {
  item: Loot;
  onSell?: () => void;
}

const RARITY_COLORS = {
  common: 'border-zinc-600 text-zinc-400',
  uncommon: 'border-green-600 text-green-400',
  rare: 'border-blue-600 text-blue-400',
  legendary: 'border-purple-600 text-purple-400 animate-pulse',
};

export default function ItemCard({ item, onSell }: ItemCardProps) {
  const colorClass = RARITY_COLORS[item.rarity];
  
  return (
    <div className={`bg-zinc-800 border-2 ${colorClass} p-2 relative group`}>
      <div className="text-sm font-semibold text-amber-100">{item.name}</div>
      <div className="text-xs text-zinc-400">{item.manufacturer}</div>
      <div className="text-xs text-green-400">{item.value} CR</div>
      {onSell && (
        <button
          onClick={onSell}
          className="absolute inset-0 bg-amber-500/90 text-zinc-900 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Sell
        </button>
      )}
    </div>
  );
}
