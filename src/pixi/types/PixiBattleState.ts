/**
 * PixiJS rendering layer extended types
 *
 * Extends GameState with temporary fields needed by the battle renderer.
 * These fields are NOT part of the formal GameState interface;
 * dice/enemies are managed by BattleController at runtime.
 */
import type { GameState, Die, Enemy } from '../../types/game';

/** Simplified battle state: GameState + renderer-specific temp fields */
export interface PixiBattleState extends GameState {
  /** Current hand (simplified: attached directly to state) */
  dice?: Die[];
  /** Current enemy list */
  enemies?: Enemy[];
  /** Last damage dealt (for floating text) */
  lastDamage?: number;
  /** Current wave (display only) */
  currentWave?: number;
  /** Current floor (display only, maps to chapter progress) */
  currentFloor?: number;
  /** Current location name (map display) */
  currentLocation?: string;
  /** Gold (simplified alias, formal version uses souls) */
  gold?: number;
}
