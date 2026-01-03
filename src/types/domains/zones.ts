/**
 * Zones domain types
 * Re-exports zone and license-related types and constants from the main types module
 */
export type {
  GraveyardZone,
  LicenseTier,
  ZoneConfig,
  LicenseTierConfig,
} from '../index';

// Re-export zone constants
export { ZONES, LICENSE_TIERS } from '../index';
