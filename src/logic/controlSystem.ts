/**
 * controlSystem.ts - 统一控制效果施加入口（v0.5 新增）
 *
 * 设计文档：板块01 §1.8 + §1.9
 * 所有控制类骰子（嘲讽/眩晕/击退/变羊/致盲/缴械）强制走此入口。
 *
 * 核心规则：
 * - ccImmunity 梯度：0→100%, 1→50%, ≥2→0%
 * - 尝试即消耗：无论是否生效，ccImmunity += 1（变羊对Boss/精英fizzle除外）
 * - 衰减：每个敌人回合开始 ccImmunity -= 1
 */

import type { Enemy } from '../types/entities';
import type { ControlType } from '../types/dice';

export interface ControlResult {
  success: boolean;
  fizzled: boolean; // Boss/精英豁免变羊时为true
}

/**
 * 统一控制施加入口
 * @param enemy 目标敌人
 * @param controlType 控制类型
 * @param isBossOrElite 是否为Boss/精英（变羊专用豁免）
 * @returns 施加结果
 */
export function applyControl(
  enemy: Enemy,
  controlType: ControlType,
  isBossOrElite: boolean = false,
): ControlResult {
  // 变羊对Boss/精英 100% 豁免，不消耗ccImmunity
  if (controlType === 'polymorph' && isBossOrElite) {
    return { success: false, fizzled: true };
  }

  // 对已变羊目标施加第二次变羊：直接fizzle，但仍+1 ccImmunity
  if (controlType === 'polymorph' && (enemy.polymorphed ?? 0) > 0) {
    enemy.ccImmunity = (enemy.ccImmunity ?? 0) + 1;
    return { success: false, fizzled: false };
  }

  // 按ccImmunity梯度判定生效率
  const immunity = enemy.ccImmunity ?? 0;
  let success = false;

  if (immunity === 0) {
    success = true; // 100% 生效
  } else if (immunity === 1) {
    success = Math.random() < 0.5; // 50% 生效
  }
  // immunity >= 2: 0% 生效

  // 尝试即消耗
  enemy.ccImmunity = (enemy.ccImmunity ?? 0) + 1;

  // 施加控制状态
  if (success) {
    switch (controlType) {
      case 'taunt':
        applyTaunt(enemy);
        break;
      case 'stun':
        applyStun(enemy);
        break;
      case 'knockback':
        applyKnockback(enemy);
        break;
      case 'polymorph':
        applyPolymorph(enemy);
        break;
      case 'blind':
        applyBlind(enemy);
        break;
      case 'disarm':
        applyDisarm(enemy);
        break;
    }
  }

  return { success, fizzled: false };
}

/** 嘲讽：敌人强制普攻玩家，伤害×0.7，持续1回合 */
function applyTaunt(enemy: Enemy): void {
  enemy.taunted = 1;
}

/** 眩晕：跳过下一次行动，触发即消耗 */
function applyStun(enemy: Enemy): void {
  enemy.stunned = 1;
}

/** 击退：distance += 2，上限3 */
function applyKnockback(enemy: Enemy): void {
  enemy.distance = Math.min((enemy.distance ?? 0) + 2, 3);
}

/** 变羊：50%普通羊/50%羊王，持续2回合 */
function applyPolymorph(enemy: Enemy): void {
  // 保存快照
  enemy.prePolymorphSnapshot = {
    attack: enemy.attackDmg,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
  };

  // 50/50 抽签
  const isKingSheep = Math.random() < 0.5;
  if (isKingSheep) {
    // 羊王：attack=20, hp=6
    enemy.attackDmg = 20;
    enemy.hp = 6;
    enemy.maxHp = 6;
  } else {
    // 普通羊：attack=1, hp锁死当前值
    enemy.attackDmg = 1;
    // hp 和 maxHp 保持当前值不变
  }

  enemy.polymorphed = 2;
}

/** 致盲：敌人攻击随机另一敌人（多敌人）或自伤（单敌人），持续1回合 */
function applyBlind(enemy: Enemy): void {
  enemy.blinded = 1;
}

/** 缴械：普攻伤害强制为1，持续1回合 */
function applyDisarm(enemy: Enemy): void {
  enemy.disarmed = 1;
}

/**
 * 敌人回合开始时衰减ccImmunity（所有敌人并行）
 */
export function decayCcImmunity(enemies: Enemy[]): Enemy[] {
  return enemies.map(e => ({
    ...e,
    ccImmunity: Math.max(0, (e.ccImmunity ?? 0) - 1),
  }));
}

/**
 * 敌人回合结束时衰减控制状态
 */
export function decayControlStatuses(enemies: Enemy[]): Enemy[] {
  return enemies.map(e => {
    const updated = { ...e };

    // 嘲讽衰减
    if (updated.taunted && updated.taunted > 0) {
      updated.taunted = updated.taunted - 1;
    }

    // 致盲衰减
    if (updated.blinded && updated.blinded > 0) {
      updated.blinded = updated.blinded - 1;
    }

    // 缴械衰减
    if (updated.disarmed && updated.disarmed > 0) {
      updated.disarmed = updated.disarmed - 1;
    }

    // 变羊衰减
    if (updated.polymorphed && updated.polymorphed > 0) {
      updated.polymorphed = updated.polymorphed - 1;
      // 变羊期满恢复原数据
      if (updated.polymorphed <= 0 && updated.prePolymorphSnapshot) {
        updated.attackDmg = updated.prePolymorphSnapshot.attack;
        // hp 不恢复（期间受到的伤害保留），但 maxHp 恢复
        updated.maxHp = updated.prePolymorphSnapshot.maxHp;
        updated.hp = Math.min(updated.hp, updated.maxHp);
        updated.prePolymorphSnapshot = undefined;
      }
    }

    // 眩晕在行动时消耗，不在此处衰减

    return updated;
  });
}

/**
 * 获取控制生效率描述（UI tooltip用）
 */
export function getCcImmunityDesc(ccImmunity: number): string {
  if (ccImmunity === 0) return '下次控制生效率 100%';
  if (ccImmunity === 1) return '下次控制生效率 50%';
  return '下次控制生效率 0%（免疫）';
}
