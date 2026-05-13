/**
 * soloSealSystem.ts - 战士单挑系统（v0.5 新增）
 *
 * 设计文档：板块02 §2.8 单挑！
 * 与目标 1v1 决斗，持续 1 个完整回合。
 *
 * 规则：
 * - 你打出的 AOE 牌型只命中该目标，但伤害 +40%
 * - 你和目标互相造成的伤害 +40%
 * - 其他敌人对你的攻击全部失效（攻击意图照常消耗）
 * - 骰子自带的全体伤害效果（如旋风斩）不受影响
 * - Boss 也能被单挑
 */

import type { Enemy } from '../types/entities';
import type { GameState } from '../types/game';

/** 单挑伤害加成倍率 */
const SOLO_SEAL_DAMAGE_MULT = 1.4;

/**
 * 激活单挑
 * @param state 游戏状态
 * @param enemies 敌人列表
 * @param targetIndex 目标索引
 * @returns 更新后的 [state, enemies]
 */
export function activateSoloSeal(
  state: GameState,
  enemies: Enemy[],
  targetIndex: number,
): [GameState, Enemy[]] {
  const newState = {
    ...state,
    soloSealTarget: targetIndex,
    soloSealTurnsLeft: 1,
  };

  const newEnemies = enemies.map((e, i) => ({
    ...e,
    isSoloSealTarget: i === targetIndex,
  }));

  return [newState, newEnemies];
}

/**
 * 检查是否处于单挑状态
 */
export function isInSoloSeal(state: GameState): boolean {
  return (state.soloSealTurnsLeft ?? 0) > 0 && state.soloSealTarget != null;
}

/**
 * 获取单挑伤害倍率
 * @param state 游戏状态
 * @param targetIndex 当前攻击目标
 * @returns 伤害倍率（1.0 = 无加成）
 */
export function getSoloSealDamageMult(state: GameState, targetIndex: number): number {
  if (!isInSoloSeal(state)) return 1.0;
  if (state.soloSealTarget === targetIndex) return SOLO_SEAL_DAMAGE_MULT;
  return 1.0;
}

/**
 * 单挑期间过滤 AOE 目标（只命中单挑目标）
 * @param state 游戏状态
 * @param targetIndices 原始 AOE 目标列表
 * @returns 过滤后的目标列表
 */
export function filterAoeTargetsForSoloSeal(
  state: GameState,
  targetIndices: number[],
): number[] {
  if (!isInSoloSeal(state)) return targetIndices;
  const soloTarget = state.soloSealTarget!;
  return targetIndices.includes(soloTarget) ? [soloTarget] : [];
}

/**
 * 单挑期间过滤敌人攻击（其他敌人攻击无效）
 * @param state 游戏状态
 * @param attackerIndex 攻击者索引
 * @returns 攻击是否生效
 */
export function canEnemyAttackDuringSoloSeal(state: GameState, attackerIndex: number): boolean {
  if (!isInSoloSeal(state)) return true;
  return attackerIndex === state.soloSealTarget;
}

/**
 * 回合结束时衰减单挑
 */
export function decaySoloSeal(state: GameState, enemies: Enemy[]): [GameState, Enemy[]] {
  if (!isInSoloSeal(state)) return [state, enemies];

  const turnsLeft = (state.soloSealTurnsLeft ?? 0) - 1;

  if (turnsLeft <= 0) {
    return [
      { ...state, soloSealTarget: null, soloSealTurnsLeft: 0 },
      enemies.map(e => ({ ...e, isSoloSealTarget: false })),
    ];
  }

  return [
    { ...state, soloSealTurnsLeft: turnsLeft },
    enemies,
  ];
}
