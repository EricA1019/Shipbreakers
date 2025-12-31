import type { GameState } from '../../types';
import { logger } from './logger';

export const Diagnostics = {
  validateGameState: (state: GameState) => {
    const issues: string[] = [];

    // Check persistence integrity
    if (!state.currentRun) {
      // No run, nothing to check
      return issues;
    }

    // Time remaining should never be negative
    if (state.currentRun.timeRemaining < 0) {
      issues.push(`timeRemaining is negative: ${state.currentRun.timeRemaining}`);
    }

    const wreck = state.availableWrecks.find(w => w.id === state.currentRun?.wreckId);
    if (!wreck) {
      issues.push('Current run references missing wreck ID');
    } else {
      // Check ship data
      const ship = (wreck as any).ship;
      if (!ship) {
        issues.push('Wreck missing ship data');
      } else {
        // Check grid integrity
        if (!ship.grid || !Array.isArray(ship.grid)) {
          issues.push('Ship missing grid array');
        } else {
          // Check entry position
          const entry = ship.entryPosition;
          if (!entry || typeof entry.x !== 'number' || typeof entry.y !== 'number') {
            issues.push('Invalid entry position');
          } else {
            // Verify entry points to a real room
            const entryRoom = ship.grid[entry.y]?.[entry.x];
            if (!entryRoom) {
              issues.push(`Entry position (${entry.x},${entry.y}) points to null room`);
            }
          }
        }
      }

      // Loot integrity: ensure every room has a loot array
      if (wreck.rooms && Array.isArray(wreck.rooms)) {
        wreck.rooms.forEach((room, idx) => {
          if (!room || typeof room.id !== 'string') {
            issues.push(`Room at index ${idx} missing id`);
          }
          if (!Array.isArray(room.loot)) {
            issues.push(`Room ${room?.id ?? idx} loot is not an array`);
          }
        });
      }
    }

    // Crew HP bounds
    state.crewRoster.forEach((crew) => {
      if (crew.maxHp <= 0) {
        issues.push(`Crew ${crew.name} has non-positive maxHp (${crew.maxHp})`);
      }
      if (crew.hp < 0 || crew.hp > crew.maxHp) {
        issues.push(`Crew ${crew.name} has invalid hp ${crew.hp}/${crew.maxHp}`);
      }
    });

    if (issues.length > 0) {
      logger.error('Diagnostics found issues:', { issues });
    } else {
      logger.info('Diagnostics passed: Game state appears healthy');
    }

    return issues;
  }
};
