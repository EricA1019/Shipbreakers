/**
 * Icon.tsx - 1-bit game icon component
 * Replaces emojis with real game assets from itch.io asset pack
 */
import React from 'react';

// Semantic icon mapping - maps friendly names to actual filenames
export const Icons = {
  // Currency & Resources
  coin: 'RPG_Coin_Gold_Currency_Money_GP',
  credits: 'RPG_Coin_Gold_Currency_Money_GP',
  fuel: 'Travel_Petrol_Oil_Barrel_Fuel',
  scrap: 'Tools_Crafting_Joints_Bolt',
  
  // Health & Status
  health: 'RPG_Stat_HP_Health_Heart',
  heart: 'RPG_Stat_HP_Health_Heart',
  skull: 'RPG_Skull_Death_Dead_Small',
  death: 'RPG_Skull_Death_Dead_Small',
  
  // Ship & Travel
  ship: 'Travel_Spaceship_Jet_Shooter',
  rocket: 'Travel_Spaceship_Jet_Shooter',
  shuttle: 'Travel_UFO_Alien_Spaceship',
  
  // Crew & People
  person: 'RPG_Item_Armor_Equipment_Slot_Head_Helmet',
  crew: 'RPG_Item_Armor_Equipment_Slot_Head_Helmet',
  worker: 'Hats_Miner_Mining_Helmet_Safety',
  
  // Tools & Equipment
  wrench: 'Tools_Crafting_Wrench_Mechanics',
  tool: 'Tools_Crafting_Wrench_Mechanics',
  hammer: 'Tools_Crafting_Smithing_Hammer',
  gear: 'Software_Options_Settings_Cogwheel_Gear_Mechanics',
  
  // Hazards
  fire: 'Weather_Wildfire_Flame_Element_Hot_Burn',
  flame: 'Weather_Wildfire_Flame_Element_Hot_Burn',
  radiation: 'Weather_Radioactive_Nuclear_Explosion_Nuke_Atomic_Danger',
  toxic: 'Misc_Poison_Bottle_Venom_Pesticide',
  poison: 'Misc_Poison_Bottle_Venom_Pesticide',
  electrical: 'Software_Power_Electricity_Battery_Thunder_Lightning_Bolt_Zap',
  lightning: 'Software_Power_Electricity_Battery_Thunder_Lightning_Bolt_Zap',
  structural: 'Warfare_Explosion_Bomb',
  vacuum: 'Misc_Air_Bubble_Breath',
  
  // Combat & Danger
  sword: 'RPG_Item_Weapon_Sword_Attack_Melee_Slashing_Damage',
  shield: 'RPG_Item_Stat_Shield_Defense_Armor',
  explosion: 'Warfare_Explosion_Bomb',
  warning: 'Software_Warning_Sign_Triangle_Exclaimation_Mark_Error',
  danger: 'Software_Warning_Sign_Triangle_Exclaimation_Mark_Error',
  
  // UI & Navigation
  check: 'Software_Signs_Checkmark_Checkbox_Ticked_Todo',
  cross: 'Software_Sign_Crossout_Cancel_Forbidden_Illegal_1',
  star: 'RPG_Stat_MP_Mana_Star',
  lock: 'Tools_Crafting_Padlock_Locked',
  unlock: 'Tools_Crafting_Padlock_Unlocked_1',
  info: 'Software_Warning_Sign_Circle_Information_Help',
  question: 'Software_Warning_Sign_Circle_Question_Mark_Help',
  
  // Loot & Items
  chest: 'Tools_Crafting_Chest_Locked_Loot',
  treasure: 'Tools_Crafting_Chest_Locked_Loot',
  potion: 'Alchemy_Potion_Vial_Bottle_Heart_Health_Life_Full',
  key: 'Tools_Crafting_Key_Unlock_1',
  gem: 'RPG_Gem_Jewelcrafting_Diamond_Points_Currency',
  
  // Food & Supplies
  food: 'Food_Meat_Chicken_Leg_Drumstick',
  apple: 'Food_Fruit_Apple',
  drink: 'Food_Drink_Glass_Water_Juice',
  
  // Misc
  clock: 'Software_Clock_Time_Wait_Chronometer_Timer_Countdown',
  time: 'Software_Clock_Time_Wait_Chronometer_Timer_Countdown',
  home: 'Map_Markers_Building_Home_House',
  target: 'RPG_Stat_Accuracy_Ranged_Target',
  anchor: 'Travel_Ship_Anchor_Navy',
  compass: 'Map_Markers_Compass_Rose_1',
  map: 'Map_Markers_Scroll_Map_Location',
  flag: 'Map_Markers_Flagpole',
  
  // Emojis (for transition)
  smile: 'Emoji_Face_Happy',
  sad: 'Emoji_Face_Sad',
  angry: 'Emoji_Face_Angry_Anger',
} as const;

export type IconName = keyof typeof Icons;

interface IconProps {
  /** The semantic name of the icon */
  name: IconName;
  /** Size in pixels (default: 16) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether to invert the icon (for dark backgrounds) */
  invert?: boolean;
  /** Custom color tint (CSS filter) */
  tint?: 'amber' | 'cyan' | 'red' | 'green' | 'white' | 'none';
}

/**
 * Icon component for displaying 1-bit game icons
 * Supports semantic naming, sizing, and color tinting
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  className = '',
  alt,
  invert = true,
  tint = 'none',
}) => {
  const filename = Icons[name];

  // Sprites are served from Vite's `public/` directory.
  // Keeping these in `public/` avoids bundling ~1.5k images into the module graph.
  const src = `/assets/Sprites_Cropped/${filename}.png`;

  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    setFailed(false);
  }, [filename]);

  if (failed) {
    const isTest = import.meta.env.MODE === 'test';
    if (!isTest) {
      console.warn(`Icon failed to load: ${name} (${filename})`);
    }
    return <span className={className} aria-hidden="true">?</span>;
  }
  
  // Build filter classes for tinting
  const tintClasses: Record<string, string> = {
    amber: 'brightness-0 invert sepia saturate-[10] hue-rotate-[15deg]',
    cyan: 'brightness-0 invert sepia saturate-[10] hue-rotate-[150deg]',
    red: 'brightness-0 invert sepia saturate-[10] hue-rotate-[330deg]',
    green: 'brightness-0 invert sepia saturate-[10] hue-rotate-[80deg]',
    white: 'brightness-0 invert',
    none: '',
  };
  
  const filterClass = invert && tint === 'none' 
    ? 'brightness-0 invert opacity-90' 
    : tintClasses[tint] || '';
  
  return (
    <img
      src={src}
      alt={alt || name}
      width={size}
      height={size}
      className={`inline-block ${filterClass} ${className}`}
      style={{ 
        imageRendering: 'pixelated',
        verticalAlign: 'middle',
      }}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
};

/**
 * Inline icon for use within text - slightly smaller with better baseline
 */
export const InlineIcon: React.FC<Omit<IconProps, 'size'> & { size?: number }> = ({
  size = 14,
  className = '',
  ...props
}) => (
  <Icon
    {...props}
    size={size}
    className={`-mt-0.5 ${className}`}
  />
);

export default Icon;
