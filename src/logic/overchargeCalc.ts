/**
 * overchargeCalc.ts - 过充伤害加成计算（v0.5 新增）
 *
 * 设计文档：板块01 §1.3.2
 * 当玩家当前回合实际持有的骰子数 > 当前手牌上限基线时，进入过充状态。
 *
 * 过充加成（全职业等价生效）：
 * +1颗 → +10%
 * +2颗 → +20%
 * +3颗 → +30%（封顶）
 *
 * 注意：符文骰子不计入过充判定。
 */

import type { Die } from '../types/game';

/** 默认手牌上限基线 */
const DEFAULT_HAND_LIMIT = 5;

/** 过充封顶层数 */
const MAX_OVERCHARGE_LAYERS = 3;

/** 每层过充加成 */
const OVERCHARGE_BONUS_PER_LAYER = 0.1;

/**
 * 计算过充加成倍率
 * @param hand 当前手牌（含所有骰子）
 * @param baseHandLimit 当前手牌上限基线（默认5，终极Boss后6）
 * @returns 过充倍率加成（0 = 无过充，0.1 = +10%，最高0.3）
 */
export function calcOverchargeBonus(hand: Die[], baseHandLimit: number = DEFAULT_HAND_LIMIT): number {
  // 过充只看非符文骰子数量
  const countableDice = hand.filter(d => {
    const def = d.diceDefId;
    // 符文骰子不计入过充判定
    // 通过 diceDefId 前缀 'rune_' 判断
    return !def.startsWith('rune_');
  });

  const excess = countableDice.length - baseHandLimit;
  if (excess <= 0) return 0;

  const layers = Math.min(excess, MAX_OVERCHARGE_LAYERS);
  return layers * OVERCHARGE_BONUS_PER_LAYER;
}

/**
 * 获取过充层数（UI显示用）
 */
export function getOverchargeLayers(hand: Die[], baseHandLimit: number = DEFAULT_HAND_LIMIT): number {
  const countableDice = hand.filter(d => !d.diceDefId.startsWith('rune_'));
  const excess = countableDice.length - baseHandLimit;
  return Math.max(0, Math.min(excess, MAX_OVERCHARGE_LAYERS));
}

/**
 * 是否处于过充状态
 */
export function isOvercharged(hand: Die[], baseHandLimit: number = DEFAULT_HAND_LIMIT): boolean {
  return getOverchargeLayers(hand, baseHandLimit) > 0;
}
