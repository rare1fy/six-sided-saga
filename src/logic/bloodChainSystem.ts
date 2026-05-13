/**
 * bloodChainSystem.ts - 战士血锁链系统（v0.5 新增）
 *
 * 设计文档：板块02 §2.6 血锁链
 * 与目标缔结血锁，期间你受到的伤害和自伤的损失等额传给被锁的敌人。
 *
 * 规则：
 * - 持续到下个敌方回合结束
 * - 新血锁覆盖旧血锁（同时只能锁 1 个目标）
 * - 打出顺子时与命中的所有敌人同时缔结
 * - 传递的伤害不触发敌人的反击/反弹
 * - 传递的伤害受目标护甲减免
 */

import type { Enemy } from '../types/entities';
import type { GameState } from '../types/game';

/**
 * 建立血锁链
 * @param enemies 敌人列表
 * @param targetIndices 目标索引列表（顺子时可能多个）
 * @param currentTurn 当前回合数
 * @returns 更新后的敌人列表
 */
export function applyBloodChain(
  enemies: Enemy[],
  targetIndices: number[],
  currentTurn: number,
): Enemy[] {
  return enemies.map((e, i) => {
    if (targetIndices.includes(i)) {
      return {
        ...e,
        bloodChainUntilTurn: currentTurn + 1, // 持续到下个敌方回合结束
      };
    }
    // 新血锁覆盖旧血锁
    if (e.bloodChainUntilTurn && e.bloodChainUntilTurn > 0) {
      return { ...e, bloodChainUntilTurn: undefined };
    }
    return e;
  });
}

/**
 * 计算血锁传递伤害
 * @param enemies 敌人列表
 * @param damageToPlayer 玩家受到的伤害（含自伤）
 * @param currentTurn 当前回合数
 * @returns 每个敌人应受到的血锁传递伤害
 */
export function calcBloodChainDamage(
  enemies: Enemy[],
  damageToPlayer: number,
  currentTurn: number,
): number[] {
  return enemies.map(e => {
    if (e.bloodChainUntilTurn && e.bloodChainUntilTurn >= currentTurn && e.hp > 0) {
      return damageToPlayer; // 等额传递
    }
    return 0;
  });
}

/**
 * 敌方回合结束时清理过期血锁
 */
export function cleanupBloodChains(enemies: Enemy[], currentTurn: number): Enemy[] {
  return enemies.map(e => {
    if (e.bloodChainUntilTurn && e.bloodChainUntilTurn <= currentTurn) {
      return { ...e, bloodChainUntilTurn: undefined };
    }
    return e;
  });
}

/**
 * 检查是否有活跃的血锁目标
 */
export function hasActiveBloodChain(enemies: Enemy[], currentTurn: number): boolean {
  return enemies.some(e => e.bloodChainUntilTurn && e.bloodChainUntilTurn >= currentTurn && e.hp > 0);
}

/**
 * 获取血锁目标索引
 */
export function getBloodChainTargets(enemies: Enemy[], currentTurn: number): number[] {
  return enemies
    .map((e, i) => (e.bloodChainUntilTurn && e.bloodChainUntilTurn >= currentTurn && e.hp > 0) ? i : -1)
    .filter(i => i >= 0);
}
