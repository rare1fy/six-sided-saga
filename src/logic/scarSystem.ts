/**
 * scarSystem.ts - 战士伤痕系统（v0.5 新增）
 *
 * 设计文档：板块02 §1.1.3
 * 伤痕是战士的核心资源——主动自伤每损 1 HP +1 层（无上限）。
 *
 * 规则：
 * - 来源：搏命重投、血之渴望、碎甲献祭、泰坦之拳等主动自伤
 * - 不来源：敌人攻击、DOT、反弹伤害
 * - 普通攻击追加基础伤害 = 当前伤痕层数（不消耗、被动持续受益）
 * - 每个敌方回合开始 -2 层
 * - 战斗结束清零
 * - 部分骰子可消耗伤痕换取更强效果（浴血之刃、血神之眼）
 */

import type { GameState } from '../types/game';

/**
 * 增加伤痕层数（主动自伤时调用）
 * @param state 当前游戏状态
 * @param hpLost 本次自伤损失的 HP
 * @returns 更新后的伤痕层数
 */
export function addScarLayers(state: GameState, hpLost: number): number {
  const current = state.scarLayers ?? 0;
  const newLayers = current + hpLost;
  return newLayers; // 无上限
}

/**
 * 消耗伤痕层数（浴血之刃、血神之眼等）
 * @param currentLayers 当前层数
 * @param percent 消耗比例（0.5 = 50%）
 * @returns [消耗后剩余层数, 实际消耗层数]
 */
export function consumeScarLayers(currentLayers: number, percent: number): [number, number] {
  const consumed = Math.floor(currentLayers * percent);
  return [currentLayers - consumed, consumed];
}

/**
 * 敌方回合开始时衰减伤痕（-2 层）
 */
export function decayScarLayers(currentLayers: number): number {
  return Math.max(0, currentLayers - 2);
}

/**
 * 计算普通攻击的伤痕追加伤害
 * @param scarLayers 当前伤痕层数
 * @returns 追加的基础伤害
 */
export function calcScarBonusDamage(scarLayers: number): number {
  return scarLayers; // 1:1
}

/**
 * 战斗结束清零
 */
export function resetScarLayers(): number {
  return 0;
}
