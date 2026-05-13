/**
 * 骰子 onPlay 计算的共享接口 — ARCH-19
 *
 * 所有 calc 模块共用的上下文/结果类型，避免循环依赖。
 */

import type { Die, StatusEffect, Enemy, GameState } from '../../types/game';
import type { ControlType } from '../../types/dice';

/** 骰子 onPlay 计算的上下文（只读快照） */
export interface DiceOnPlayContext {
  selected: Die[];
  dice: Die[];
  activeHands: string[];
  game: GameState;
  targetEnemy: Enemy | null;
  /** 基础元素倍率 */
  elementBonus: number;
  /** 是否跳过 onPlay（普通攻击单手牌时） */
  skipOnPlay: boolean;
  /** 统一元素（统一骰子效果） */
  unifiedElement: string | null;
  /** 法师怒火燎原 bonus */
  furyBonusDamage: number;
  // === v0.5 新增 ===
  /** 本次出牌是否为普通攻击 */
  isNormalAttack: boolean;
  /** 本次出牌是否为战士散打（>=2颗普通攻击） */
  isScatterAttack: boolean;
  /** 最近一次敌方回合中玩家被打掉血的次数 */
  hitsTakenLastTurn: number;
}

/** 骰子 onPlay 计算的增量输出 */
export interface DiceOnPlayResult {
  extraDamage: number;
  extraArmor: number;
  extraHeal: number;
  pierceDamage: number;
  armorBreak: boolean;
  multiplier: number;
  holyPurify: number;
  statusEffects: StatusEffect[];
  // === v0.5 新增 ===
  selfDamage: number;
  controlType: ControlType | null;
  controlAoe: boolean;
  bloodChain: boolean;
  soloSeal: boolean;
  soloSealDamageMult: number;
  berserk: { duration: number; damageMult: number; takenMult: number; bloodCostReduction: number } | null;
  trueDamage: number;
  guaranteedHpPercent: number;
  selfPointBonus: number;
  vulnerableToRandom: number;
  drawBonus: number;
  permanentFaceBonus: number;
  damagePerCleanse: number;
  scatterBonusMult: number;
  scatterBonusCap: number;
}

/**
 * 初始化一个空的 DiceOnPlayResult
 */
export function emptyDiceOnPlayResult(): DiceOnPlayResult {
  return {
    extraDamage: 0,
    extraArmor: 0,
    extraHeal: 0,
    pierceDamage: 0,
    armorBreak: false,
    multiplier: 1,
    holyPurify: 0,
    statusEffects: [],
    // v0.5
    selfDamage: 0,
    controlType: null,
    controlAoe: false,
    bloodChain: false,
    soloSeal: false,
    soloSealDamageMult: 1,
    berserk: null,
    trueDamage: 0,
    guaranteedHpPercent: 0,
    selfPointBonus: 0,
    vulnerableToRandom: 0,
    drawBonus: 0,
    permanentFaceBonus: 0,
    damagePerCleanse: 0,
    scatterBonusMult: 0,
    scatterBonusCap: 0,
  };
}
