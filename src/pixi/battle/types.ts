/**
 * PixiJS 战斗专用状态类型
 * 
 * React 版使用 BattleContext 管理 dice/enemies 等战斗字段；
 * PixiJS 版不用 React Context，直接在 GameState 上扩展。
 */
import type { GameState, Die, Enemy, StatusEffect } from '../../types/game';

/** PixiJS 版战斗所需的扩展字段 */
export interface BattleGameState extends GameState {
  /** 当前手牌骰子 */
  dice: Die[];
  /** 当前波次敌人 */
  enemies: Enemy[];
  /** 上次伤害（浮动数字用） */
  lastDamage?: number;
  /** 当前波次索引 */
  currentWave?: number;
}

/** 将 GameState 宽松转为 BattleGameState（运行时已有这些字段） */
export function asBattle(game: GameState): BattleGameState {
  return game as unknown as BattleGameState;
}
