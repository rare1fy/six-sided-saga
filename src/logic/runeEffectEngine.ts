/**
 * runeEffectEngine.ts — 符文骰子效果触发引擎（v0.5）
 *
 * 职责：
 * 1. processHoldEffects — 在指定触发时机处理所有手牌中符文骰子的持有效果
 * 2. processCastEffect — 当符文骰子被打出时处理其打出效果
 *
 * 纯函数设计：接收状态，返回状态变更描述，不直接 setState。
 */

import type { Die, GameState, Enemy } from '../types/game';
import type { HoldEffect, CastEffect, HoldEffectTrigger } from '../types/dice';
import { getDiceDef } from '../data/dice';
import { isRuneDie } from './runeSystem';

// ============================================================
// 效果结果类型
// ============================================================

export interface RuneEffectResult {
  playerDelta: {
    hpChange?: number;
    armorChange?: number;
    scarChange?: number;
    shieldChange?: number;
    drawBonus?: number;
  };
  enemyEffects: Array<{
    targetUid?: string;
    damage?: number;
    trueDamage?: number;
    controlType?: string;
    controlDuration?: number;
    poisonLayers?: number;
  }>;
  diceChanges: Array<{
    dieId: number;
    baseDamageBonus?: number;
    transformToShadow?: boolean;
  }>;
  flags: {
    nextBasicAttackPointsDouble?: boolean;
    elementDoubleThisTurn?: boolean;
    comboMultiplierDouble?: boolean;
    nextScarMult?: number;
  };
  messages: Array<{ text: string; color: string; targetUid?: string }>;
}

const EMPTY_RESULT: RuneEffectResult = {
  playerDelta: {},
  enemyEffects: [],
  diceChanges: [],
  flags: {},
  messages: [],
};

function mergeResults(a: RuneEffectResult, b: RuneEffectResult): RuneEffectResult {
  return {
    playerDelta: {
      hpChange: (a.playerDelta.hpChange || 0) + (b.playerDelta.hpChange || 0) || undefined,
      armorChange: (a.playerDelta.armorChange || 0) + (b.playerDelta.armorChange || 0) || undefined,
      scarChange: (a.playerDelta.scarChange || 0) + (b.playerDelta.scarChange || 0) || undefined,
      shieldChange: (a.playerDelta.shieldChange || 0) + (b.playerDelta.shieldChange || 0) || undefined,
      drawBonus: (a.playerDelta.drawBonus || 0) + (b.playerDelta.drawBonus || 0) || undefined,
    },
    enemyEffects: [...a.enemyEffects, ...b.enemyEffects],
    diceChanges: [...a.diceChanges, ...b.diceChanges],
    flags: { ...a.flags, ...b.flags },
    messages: [...a.messages, ...b.messages],
  };
}

// ============================================================
// Hold Effect 处理
// ============================================================

export function processHoldEffects(
  trigger: HoldEffectTrigger,
  hand: Die[],
  game: GameState,
  enemies: Enemy[],
): RuneEffectResult {
  let result: RuneEffectResult = { ...EMPTY_RESULT, messages: [], enemyEffects: [], diceChanges: [] };

  for (const die of hand) {
    if (!isRuneDie(die)) continue;
    const def = getDiceDef(die.diceDefId);
    const hold = def.holdEffect;
    if (!hold || hold.trigger !== trigger) continue;

    const effect = processOneHoldEffect(hold, die, hand, game, enemies);
    result = mergeResults(result, effect);
  }

  return result;
}

function processOneHoldEffect(
  hold: HoldEffect,
  die: Die,
  hand: Die[],
  game: GameState,
  enemies: Enemy[],
): RuneEffectResult {
  const result: RuneEffectResult = {
    playerDelta: {},
    enemyEffects: [],
    diceChanges: [],
    flags: {},
    messages: [],
  };
  const defName = getDiceDef(die.diceDefId).name;

  // === 战士符文 ===
  if (hold.damageToBloodChainTargets && game.bloodChainTarget) {
    const target = enemies.find(e => e.uid === game.bloodChainTarget && e.hp > 0);
    if (target) {
      result.enemyEffects.push({ targetUid: target.uid, damage: hold.damageToBloodChainTargets });
      result.messages.push({ text: `${defName}: 血锁伤害 ${hold.damageToBloodChainTargets}`, color: 'text-red-400', targetUid: target.uid });
    }
  }

  if (hold.nextScarMult) {
    result.flags.nextScarMult = hold.nextScarMult;
    result.messages.push({ text: `${defName}: 伤痕倍率 x${hold.nextScarMult}`, color: 'text-orange-400' });
  }

  if (hold.armorGainPercent) {
    const hpLost = game.hpLostThisTurn || 0;
    if (hpLost > 0) {
      const armorGain = Math.ceil(hpLost * hold.armorGainPercent);
      result.playerDelta.armorChange = armorGain;
      result.messages.push({ text: `${defName}: +${armorGain} 护甲`, color: 'text-blue-400' });
    }
  }

  // === 法师符文 ===
  if (hold.boostLowestDie) {
    const nonRune = hand.filter(d => !isRuneDie(d) && !d.spent);
    if (nonRune.length > 0) {
      const lowest = nonRune.reduce((a, b) => a.value < b.value ? a : b);
      result.diceChanges.push({ dieId: lowest.id, baseDamageBonus: hold.boostLowestDie });
      result.messages.push({ text: `${defName}: 最低骰+${hold.boostLowestDie}伤害`, color: 'text-purple-400' });
    }
  }

  if (hold.collapseMultOverride) {
    (result.flags as any).collapseMultOverride = hold.collapseMultOverride;
    result.messages.push({ text: `${defName}: 坍缩加成 x${hold.collapseMultOverride}`, color: 'text-indigo-400' });
  }

  if (hold.healOnSuccess) {
    (result.flags as any).healOnControlSuccess = hold.healOnSuccess;
  }

  // === 盗贼符文 ===
  if (hold.transformLowestToShadow) {
    const nonRune = hand.filter(d => !isRuneDie(d) && !d.spent && !(d as any).isShadowRemnant);
    if (nonRune.length > 0) {
      const lowest = nonRune.reduce((a, b) => a.value < b.value ? a : b);
      result.diceChanges.push({ dieId: lowest.id, transformToShadow: true });
      result.messages.push({ text: `${defName}: 变形残骰`, color: 'text-gray-400' });
    }
  }

  if (hold.comboBonusPerPlay) {
    (result.flags as any).comboBonusPerPlay = hold.comboBonusPerPlay;
  }

  if (hold.autoPoison) {
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length > 0) {
      result.enemyEffects.push({ targetUid: aliveEnemies[0].uid, poisonLayers: hold.autoPoison });
      result.messages.push({ text: `${defName}: 自动叠毒 +${hold.autoPoison}`, color: 'text-green-400', targetUid: aliveEnemies[0].uid });
    }
  }

  return result;
}

// ============================================================
// Cast Effect 处理
// ============================================================

export function processCastEffect(
  die: Die,
  game: GameState,
  enemies: Enemy[],
  hand: Die[],
): RuneEffectResult {
  if (!isRuneDie(die)) return { ...EMPTY_RESULT, messages: [], enemyEffects: [], diceChanges: [] };

  const def = getDiceDef(die.diceDefId);
  const cast = def.castEffect;
  if (!cast) return { ...EMPTY_RESULT, messages: [], enemyEffects: [], diceChanges: [] };

  const result: RuneEffectResult = {
    playerDelta: {},
    enemyEffects: [],
    diceChanges: [],
    flags: {},
    messages: [],
  };
  const defName = def.name;

  // === 战士符文 ===
  if (cast.consumeAllScar && cast.trueDamagePerScar) {
    const scars = game.scarStacks || 0;
    if (scars > 0) {
      const totalTrueDmg = scars * cast.trueDamagePerScar;
      const aliveEnemies = enemies.filter(e => e.hp > 0);
      if (aliveEnemies.length > 0) {
        result.enemyEffects.push({ targetUid: aliveEnemies[0].uid, trueDamage: totalTrueDmg });
      }
      result.playerDelta.scarChange = -scars;
      result.messages.push({ text: `${defName}: 消耗${scars}层伤痕 → ${totalTrueDmg}真伤`, color: 'text-red-500' });
    }
  }

  if (cast.nextBasicAttackPointsDouble) {
    result.flags.nextBasicAttackPointsDouble = true;
    result.messages.push({ text: `${defName}: 下次普攻点数翻倍!`, color: 'text-orange-500' });
  }

  if (cast.consumeAllArmor && cast.aoeDamagePercentOfArmor) {
    const armor = game.armor || 0;
    if (armor > 0) {
      const aoeDmg = Math.ceil(armor * cast.aoeDamagePercentOfArmor);
      enemies.filter(e => e.hp > 0).forEach(e => {
        result.enemyEffects.push({ targetUid: e.uid, damage: aoeDmg, controlType: cast.aoeControlType });
      });
      result.playerDelta.armorChange = -armor;
      result.messages.push({ text: `${defName}: 消耗${armor}护甲 → AOE ${aoeDmg}伤害`, color: 'text-blue-500' });
    }
  }

  // === 法师符文 ===
  if (cast.chantTurnsBonus) {
    const chantTurns = (game.chantTurns || 0) + cast.chantTurnsBonus;
    if (cast.barrierPerChantTurn) {
      const barrier = chantTurns * cast.barrierPerChantTurn;
      result.playerDelta.shieldChange = barrier;
      result.messages.push({ text: `${defName}: 吟唱+${cast.chantTurnsBonus} → 屏障${barrier}`, color: 'text-purple-500' });
    }
  }

  if (cast.elementDoubleThisTurn) {
    result.flags.elementDoubleThisTurn = true;
    result.messages.push({ text: `${defName}: 元素效果翻倍!`, color: 'text-indigo-500' });
  }

  if (cast.controlType) {
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length > 0) {
      result.enemyEffects.push({ targetUid: aliveEnemies[0].uid, controlType: cast.controlType, controlDuration: cast.controlDuration });
      result.messages.push({ text: `${defName}: ${cast.controlType}!`, color: 'text-cyan-500', targetUid: aliveEnemies[0].uid });
      if (cast.secondaryControl) {
        result.enemyEffects.push({ targetUid: aliveEnemies[0].uid, controlType: cast.secondaryControl });
      }
    }
  }

  // === 盗贼符文 ===
  if (cast.transformAllToShadow) {
    hand.filter(d => !isRuneDie(d) && !d.spent && d.id !== die.id).forEach(d => {
      result.diceChanges.push({ dieId: d.id, transformToShadow: true });
    });
    result.messages.push({ text: `${defName}: 全部变残骰!`, color: 'text-gray-500' });
  }

  if (cast.comboMultiplierDouble) {
    result.flags.comboMultiplierDouble = true;
    result.messages.push({ text: `${defName}: 连击加成翻倍!`, color: 'text-yellow-500' });
  }

  if (cast.detonateAllPoison && cast.damagePerPoisonLayer) {
    const dpl = cast.damagePerPoisonLayer;
    enemies.filter(e => e.hp > 0).forEach(e => {
      const poisonStacks = e.statuses?.find(s => s.type === 'poison')?.value || 0;
      if (poisonStacks > 0) {
        const detonateDmg = poisonStacks * dpl;
        result.enemyEffects.push({ targetUid: e.uid, damage: detonateDmg });
        result.messages.push({ text: `${defName}: 引爆${poisonStacks}毒 → ${detonateDmg}伤害`, color: 'text-green-500', targetUid: e.uid });
      }
    });
  }

  return result;
}
