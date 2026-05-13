/**
 * runeSystem.ts - 符文骰子系统（v0.5 新增）
 *
 * 设计文档：板块01 §三补
 * 符文骰子是独立于20颗普通骰子的特殊骰子，每职业3颗。
 * 核心决策：符文骰子占1个手牌位，玩家需要权衡"持有收益 vs 手牌位代价 vs 打出时机"。
 *
 * 规则：
 * - 无面值，不参与牌型组合
 * - 持有效果：在手牌中时自动生效
 * - 打出效果：消耗1次出牌次数，触发一次性强力效果
 * - 不参与自动弃牌（永不自动弃）
 * - 可被重投选中
 * - 不可被选入战士散打
 * - 不计入过充判定
 * - 打出时计入连击计数
 */

import type { Die } from '../types/game';
import { getDiceDef } from '../data/dice';

/**
 * 判断骰子是否为符文骰子
 */
export function isRuneDie(die: Die): boolean {
  const def = getDiceDef(die.diceDefId);
  return def.isRune === true;
}

/**
 * 判断骰子ID是否为符文骰子
 */
export function isRuneDiceId(diceDefId: string): boolean {
  return diceDefId.startsWith('rune_');
}

/**
 * 从手牌中获取所有符文骰子
 */
export function getRuneDiceInHand(hand: Die[]): Die[] {
  return hand.filter(d => isRuneDie(d));
}

/**
 * 从手牌中获取所有非符文骰子（用于过充判定等）
 */
export function getNonRuneDiceInHand(hand: Die[]): Die[] {
  return hand.filter(d => !isRuneDie(d));
}

/**
 * 计算实际可抽牌数（扣除手牌中已有的符文骰子占位）
 * @param baseDrawCount 基础抽牌数
 * @param currentHand 当前手牌（含符文骰子）
 * @returns 实际应抽取的普通骰子数
 */
export function calcActualDrawCount(baseDrawCount: number, currentHand: Die[]): number {
  const runeCount = getRuneDiceInHand(currentHand).length;
  return Math.max(0, baseDrawCount - runeCount);
}

/**
 * 自动弃牌排序：状态骰优先弃 → 普通骰按点数低优先弃 → 符文骰子永不自动弃
 * @param hand 当前手牌
 * @param discardCount 需要弃掉的数量
 * @returns 应弃掉的骰子ID列表
 */
export function getAutoDiscardOrder(hand: Die[], discardCount: number): number[] {
  // 符文骰子排除
  const discardable = hand.filter(d => !isRuneDie(d));

  // 状态骰优先
  const statusDice = discardable.filter(d =>
    d.isShadowRemnant || d.diceDefId === 'cursed' || d.diceDefId === 'cracked' || d.diceDefId === 'temp_rogue'
  );
  const normalDice = discardable.filter(d =>
    !d.isShadowRemnant && d.diceDefId !== 'cursed' && d.diceDefId !== 'cracked' && d.diceDefId !== 'temp_rogue'
  );

  // 普通骰按点数低优先
  normalDice.sort((a, b) => a.value - b.value);

  const ordered = [...statusDice, ...normalDice];
  return ordered.slice(0, discardCount).map(d => d.id);
}

/**
 * 符文骰子是否可被选入出牌（战士散打时不可选）
 */
export function canSelectRuneForPlay(die: Die, isWarriorMultiAttack: boolean): boolean {
  if (!isRuneDie(die)) return true; // 非符文骰子不受限
  if (isWarriorMultiAttack) return false; // 散打模式下不可选
  return true;
}
