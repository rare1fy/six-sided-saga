/**
 * 骰子 onPlay 战士效果 — ARCH-19 + v0.5 全字段实现
 *
 * 职责：处理战士职业骰子的 onPlay 效果。
 * v0.5 新增字段：bonusDamageOnNormalAttack / scarBonusDamagePerLayer / multPerHitTaken /
 *   vulnerableOnHits / multIfHitLastTurn / scaleWithLostHpCap / healMultFromValue /
 *   fullHpArmorMult / fullHpBonusMult / controlType / controlAoe / damagePerCleanse /
 *   normalAttackOnly / bonusDamageFromTotalPoints / executeHealPercent / executeHealPercentBoosted /
 *   executeDrawBonus / consumeScarPercent / permanentFaceBonus / permanentFaceBonusCap /
 *   armorMultBoosted / scarThresholdForBoost / aoeDamageBoosted / selfPointBonus /
 *   vulnerableToRandom / scatterBonusMult / scatterBonusCap / berserkDuration / berserkDamageMult /
 *   berserkTakenMult / berserkBloodCostReduction / selfDamageMultPer1Pct / selfDamageMultCap /
 *   scarMultPerLayer / scarOrSoloBonus / totalMultCap / trueDamage / guaranteedHpPercent /
 *   repeatSelfDamagePercent / repeatTrueDamage / repeatGuaranteedHpPercent
 */

import type { Die, DiceDef } from '../../types/game';
import type { DiceOnPlayContext, DiceOnPlayResult } from './types';

export function applyWarriorCalc(
  op: NonNullable<DiceDef['onPlay']>,
  d: Die,
  ctx: DiceOnPlayContext,
  out: DiceOnPlayResult,
): void {
  const { selected, game, targetEnemy, elementBonus, activeHands, isNormalAttack, isScatterAttack, hitsTakenLastTurn } = ctx;

  const currentDepth = game.map.find(n => n.id === game.currentNodeId)?.depth ?? 0;
  const depthDmgBonus = 1 + Math.floor(currentDepth / 3) * 0.15;

  // --- 自伤 ---
  if (op.selfDamagePercent) {
    const selfDmg = Math.max(1, Math.ceil(game.maxHp * op.selfDamagePercent));
    out.selfDamage += selfDmg;
  }

  // --- 基础伤害 ---
  if (op.bonusDamage) {
    out.extraDamage += Math.ceil(op.bonusDamage * elementBonus * depthDmgBonus);
  }
  // v0.5: 普通攻击时基础伤害覆盖（w_bloodthirst）
  if (op.bonusDamageOnNormalAttack && isNormalAttack) {
    // 覆盖 bonusDamage 的值
    const base = op.bonusDamage || 0;
    out.extraDamage += Math.ceil((op.bonusDamageOnNormalAttack - base) * elementBonus * depthDmgBonus);
  }

  // --- 护甲 ---
  if (op.armor) out.extraArmor += op.armor;
  if (op.armorFromTotalPoints) out.extraArmor += selected.reduce((sum, sd) => sum + sd.value, 0);
  if (op.armorMultFromTotalPoints) {
    const total = selected.reduce((sum, sd) => sum + sd.value, 0);
    let mult = op.armorMultFromTotalPoints;
    // v0.5: 伤痕层数达标时护甲倍率提升（w_giantshield）
    if (op.armorMultBoosted && op.scarThresholdForBoost) {
      const scarStacks = (game as any).scarStacks || 0;
      if (scarStacks >= op.scarThresholdForBoost) mult = op.armorMultBoosted;
    }
    out.extraArmor += Math.ceil(total * mult);
  }
  if (op.armorBreak) out.armorBreak = true;
  if (op.armorToDamage && targetEnemy) out.extraDamage += (targetEnemy.armor || 0);

  // --- 伤痕系统 ---
  // v0.5: 每层伤痕追加伤害（w_armorbreak）
  if (op.scarBonusDamagePerLayer) {
    const scarStacks = (game as any).scarStacks || 0;
    out.extraDamage += scarStacks * op.scarBonusDamagePerLayer;
  }
  // v0.5: 消耗伤痕百分比（w_bloodblade / w_bloodgod）
  if (op.consumeScarPercent) {
    const scarStacks = (game as any).scarStacks || 0;
    const consumed = Math.floor(scarStacks * op.consumeScarPercent);
    // 永久面值加成（w_bloodblade）
    if (op.permanentFaceBonus && consumed >= 1) {
      out.permanentFaceBonus += op.permanentFaceBonus;
    }
    // 每消耗1层加成（w_bloodgod）
    if (op.scarMultPerLayer) {
      out.multiplier *= (1 + consumed * op.scarMultPerLayer);
    }
  }

  // --- 条件增幅 ---
  // v0.5: 被打次数增幅（w_fury）
  if (op.multPerHitTaken) {
    out.multiplier *= (1 + hitsTakenLastTurn * op.multPerHitTaken);
  }
  // v0.5: 被打>=N次施加易伤（w_fury）
  if (op.vulnerableOnHits && hitsTakenLastTurn >= op.vulnerableOnHits) {
    out.statusEffects.push({ type: 'vulnerable', value: 1, duration: 99 });
  }
  // v0.5: 上回合被打过则增幅（w_warcry）
  if (op.multIfHitLastTurn && hitsTakenLastTurn > 0) {
    out.multiplier *= (1 + op.multIfHitLastTurn);
  }
  // v0.5: 仅普通攻击生效（w_leech / w_titanfist）
  if (op.normalAttackOnly && !isNormalAttack) {
    // 不是普通攻击，跳过后续效果
    return;
  }
  // v0.5: 按已损失HP缩放（w_revenge）
  if (op.scaleWithLostHp) {
    const lostHp = game.maxHp - game.hp;
    let bonus = Math.ceil(lostHp * op.scaleWithLostHp);
    if (op.scaleWithLostHpCap) bonus = Math.min(bonus, op.scaleWithLostHpCap);
    out.extraDamage += bonus;
  }

  // --- 生存 ---
  // v0.5: 按点数回血（w_lifefurnace）
  if (op.healMultFromValue) {
    if (game.hp < game.maxHp) {
      out.extraHeal += d.value * op.healMultFromValue;
    } else if (op.fullHpArmorMult) {
      // 满血时改为护甲
      out.extraArmor += d.value * op.fullHpArmorMult;
      if (op.fullHpBonusMult) out.multiplier *= (1 + op.fullHpBonusMult);
    }
  }

  // --- 控制效果 ---
  // v0.5: 统一控制施加（w_roar / w_warhammer / w_giantshield / w_whirlwind）
  if (op.controlType) {
    out.controlType = op.controlType as any;
    out.controlAoe = !!op.controlAoe;
  }
  // v0.5: 净化 + 每清除1层造成伤害（w_roar）
  if (op.purifyAll) out.holyPurify += 99;
  if (op.damagePerCleanse) {
    const negCount = game.statuses.filter(s =>
      ['poison', 'burn', 'vulnerable', 'weak', 'freeze', 'root'].includes(s.type)
    ).length;
    out.damagePerCleanse = negCount * op.damagePerCleanse;
  }

  // --- 斩杀 ---
  if (op.executeThreshold && op.executeMult && targetEnemy) {
    if (targetEnemy.hp / targetEnemy.maxHp < op.executeThreshold) {
      out.multiplier *= op.executeMult;
      // v0.5: 击杀回血
      if (op.executeHealPercent) {
        let healPct = op.executeHealPercent;
        // 伤痕>=5 或 血锁状态 → 回血翻倍
        if (op.executeHealPercentBoosted) {
          const scarStacks = (game as any).scarStacks || 0;
          const hasBloodChain = (game as any).bloodChainTarget != null;
          if (scarStacks >= 5 || hasBloodChain) healPct = op.executeHealPercentBoosted;
        }
        out.extraHeal += Math.ceil(game.maxHp * healPct);
      }
      // v0.5: 击杀额外抽牌
      if (op.executeDrawBonus) out.drawBonus += op.executeDrawBonus;
    }
  }

  // --- 血锁链 ---
  if (op.bloodChain) out.bloodChain = true;

  // --- 单挑 ---
  if (op.soloSeal) {
    out.soloSeal = true;
    if (op.soloSealDamageMult) out.soloSealDamageMult = op.soloSealDamageMult;
  }

  // --- 三条系牌型增幅（w_warhammer） ---
  if (op.requiresTriple && op.bonusDamageFromPoints) {
    const tripleHands = ['三条', '四条', '五条', '六条', '葫芦', '大葫芦', '三连对'];
    if (activeHands.some((h: string) => tripleHands.includes(h))) {
      const totalPoints = selected.reduce((sum, sd) => sum + sd.value, 0);
      out.extraDamage += Math.ceil(totalPoints * op.bonusDamageFromPoints);
    }
  }

  // --- AOE 伤害（w_whirlwind） ---
  if (op.aoeDamage) {
    let dmg = op.aoeDamage;
    // v0.5: 被打过则AOE伤害翻倍
    if (op.aoeDamageBoosted && hitsTakenLastTurn > 0) dmg = op.aoeDamageBoosted;
    out.extraDamage += dmg;
  }

  // --- 溢出伤害转移（w_cleave） ---
  if (op.splinterDamage) {
    // 溢出伤害在 postPlayEffects 中处理，这里只标记
  }

  // --- 震地（w_quake） ---
  // v0.5: 本骰点数加成
  if (op.selfPointBonus) out.selfPointBonus += op.selfPointBonus;
  // v0.5: 对随机敌人施加易伤
  if (op.vulnerableToRandom) out.vulnerableToRandom += op.vulnerableToRandom;
  // v0.5: 散打乘区
  if (op.scatterBonusMult && isScatterAttack) {
    out.scatterBonusMult = op.scatterBonusMult;
    out.scatterBonusCap = op.scatterBonusCap || 60;
  }

  // --- 狂暴（w_berserk） ---
  if (op.selfBerserk) {
    out.berserk = {
      duration: op.berserkDuration || 2,
      damageMult: op.berserkDamageMult || 0.3,
      takenMult: op.berserkTakenMult || 0.2,
      bloodCostReduction: op.berserkBloodCostReduction || 0.5,
    };
    // 狂暴期间造成伤害+30%
    out.multiplier *= (1 + (op.berserkDamageMult || 0.3));
  }

  // --- 血神之眼（w_bloodgod） ---
  if (op.scaleWithSelfDamage) {
    // 本回合每损失maxHP的1%，伤害+N%
    const selfDmgPct = ((game as any).selfDamageThisTurn || 0) / game.maxHp * 100;
    const multPer1Pct = op.selfDamageMultPer1Pct || 0.15;
    const selfDmgMult = Math.min(selfDmgPct * multPer1Pct, op.selfDamageMultCap || 1.2);
    let totalMult = selfDmgMult;
    // 伤痕/单挑额外加成
    if (op.scarOrSoloBonus) {
      const scarStacks = (game as any).scarStacks || 0;
      const inSolo = (game as any).soloSealTarget != null;
      if (scarStacks > 0 || inSolo) totalMult += op.scarOrSoloBonus;
    }
    // 总封顶
    if (op.totalMultCap) totalMult = Math.min(totalMult, op.totalMultCap);
    out.multiplier *= (1 + totalMult);
  }

  // --- 泰坦之拳（w_titanfist） ---
  if (op.trueDamage) {
    const useCount = (game as any).titanfistUseCount || 0;
    if (useCount >= 1 && op.repeatTrueDamage !== undefined) {
      out.trueDamage += op.repeatTrueDamage;
      out.selfDamage += Math.max(1, Math.ceil(game.maxHp * (op.repeatSelfDamagePercent || 0.15)));
      out.guaranteedHpPercent = op.repeatGuaranteedHpPercent || 0.3;
    } else {
      out.trueDamage += op.trueDamage;
      out.guaranteedHpPercent = op.guaranteedHpPercent || 0;
    }
  }

  // --- 按总点数追加伤害（w_leech 孤注之刃） ---
  if (op.bonusDamageFromTotalPoints) {
    const totalPoints = selected.reduce((sum, sd) => sum + sd.value, 0);
    out.extraDamage += totalPoints;
  }

  // --- 旧版兼容 ---
  if (op.scaleWithHits) out.extraDamage += ctx.furyBonusDamage;
  if (op.firstPlayOnly && op.bonusDamage) {
    const isFirstPlay = (game.comboCount || 0) === 0 && game.battleTurn <= 1;
    if (isFirstPlay) out.extraDamage += Math.ceil(op.bonusDamage * elementBonus * depthDmgBonus);
  }
  if (op.scaleWithBloodRerolls && game.bloodRerollCount) {
    out.extraDamage += Math.min(game.bloodRerollCount, 3);
  }
  if (op.damageFromArmor) {
    out.extraDamage += Math.ceil((game.armor + out.extraArmor) * op.damageFromArmor);
  }
  if (op.healFromValue) out.extraHeal += d.value;
  if (op.maxHpBonus) out.extraHeal += op.maxHpBonus;
  if (op.healOrMaxHp) {
    if (game.hp < game.maxHp) out.extraHeal += d.value;
  }
  if (op.lowHpOverrideValue && op.lowHpThreshold) {
    if (game.hp / game.maxHp < op.lowHpThreshold && d.value < op.lowHpOverrideValue) {
      out.extraDamage += (op.lowHpOverrideValue - d.value);
    }
  }
  if (op.tauntAll) { /* 在出牌后实际应用时处理 — 已被 controlType:'taunt' + controlAoe:true 取代 */ }
}
