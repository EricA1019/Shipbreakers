/**
 * Services Index
 * 
 * Re-exports all service modules for convenient imports.
 * 
 * These services contain pure functions that:
 * 1. Take state as input
 * 2. Return state updates or results
 * 3. Can be tested independently
 * 
 * The gameStore coordinates these services and manages state transitions.
 */

// Economy operations
export * from './EconomyService';
export type { EconomyResult } from './EconomyService';

// Crew management
export * from './CrewService';
export type { CrewResult } from './CrewService';

// Ship management
export * from './ShipService';
export type { ShipResult } from './ShipService';

// Salvage operations
export * from './SalvageService';
export type { SalvageResult } from './SalvageService';

// Save/load operations
export * from './SaveService';

// Phase 14: Relationship system
export * from './relationshipService';

// Phase 14: Injury system
export * from './injuryService';
