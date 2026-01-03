/**
 * Ship domain types
 * Re-exports ship-related types from the main types module
 */
export type {
  HazardType,
  WreckType,
  WreckMass,
  Corporation,
  Room,
  Direction,
  GridRoom,
  ShipLayout,
  Ship,
  ItemSlot,
  PlayerRoomType,
  PlayerShipRoom,
  ReactorModule,
  PlayerShip,
  Wreck,
  WreckPreview,
  GridPosition,
} from '../index';

// Re-export type guard
export { hasShipLayout } from '../index';
