/**
 * relicEffectsV05.ts — v0.5 遗物效果实现
 *
 * 将 relicsV05.ts 中的元数据定义转换为完整的 Relic 对象（带 effect 函数）。
 * 遵循原有遗物系统的接口约定：effect(ctx) => RelicEffect
 */

import type { Relic, RelicContext, RelicEffect } from '../types/game';
import { ALL_RELICS_V05 } from './relicsV05';

// ============================================================
// 效果实现映射
// ============================================================

type EffectFn = (ctx: RelicContext) => RelicEffect;

const EFFECT_MAP: Record<string, EffectFn> = {
  // === 4.1 抽牌/手牌规则类 ===
  relic_greedy_hand: () => ({ tempDrawCountBonus: 1 }),
  relic_slowpoke: () => ({ tempDrawCountBonus: -1 }),
  relic_boomerang: () => ({ keepHighestDie: 1 }),
  relic_fate_gear: () => ({}), // UI 交互：选择骰子放回顶部，需要 UI 层配合
  relic_gambler_creed: () => ({ freeRerolls: 1 }),
  relic_mirror_bag: (ctx) => ({
    grantDieWithValue: ctx.diceCount === 1 ? (ctx.diceValues?.[0] || 0) : 0,
  }),

  // === 4.2 出牌规则类 ===
  relic_minimalist: (ctx) => ({
    multiplier: ctx.diceCount === 1 ? 2 : 1,
  }),
  relic_perfectionist: (ctx) => {
    const isFullHouse = ['葫芦', '大葫芦', '四条', '五条', '六条'].includes(ctx.handType || '');
    const allSameId = ctx.diceIds ? new Set(ctx.diceIds).size === 1 : false;
    return { multiplier: (isFullHouse && allSameId) ? 3 : 1 };
  },
  relic_shotgun: () => ({ forceAoe: true, multiplier: 0.6 }),
  relic_all_in: () => ({ maxPlaysPerTurn: 1, allowFullHandPlay: true }),
  relic_chain_reaction: () => ({ grantExtraPlay: 1 }),
  relic_echo: () => ({ echoLastPlay: true }),

  // === 4.3 牌型规则类 ===
  relic_dimension_break: () => ({ straightTolerance: 1 }),
  relic_chaos_face: () => ({ pairTolerance: 1 }),
  relic_pure_heart: (ctx) => ({
    multiplier: (ctx.uniqueDiceTypes || 99) <= 5 ? 1.5 : 1,
  }),
  relic_straight_master: () => ({ straightFullAoe: true }),
  relic_fullhouse_collector: () => ({ returnPairDice: true }),
  relic_sync_resonance: () => ({ boostMatchingDice: 2 }),

  // === 4.4 重投/骰面规则类 ===
  relic_lucky_face: () => ({ freeRerollOnSix: true }),
  relic_stabilizer: () => ({ rerollFloor: -1 }),
  relic_loaded_dice: () => ({ guaranteedSix: true }),
  relic_chaos_engine: () => ({ randomDiceToSeven: true }),

  // === 4.5 伤害计算类 ===
  relic_glass_cannon: (ctx) => ({
    multiplier: 1.5,
    damageTakenMult: 1.5,
  }),
  relic_berserker_blood: (ctx) => ({
    multiplier: (ctx.hpPercent || 1) <= 0.5 ? 1.3 : 1,
  }),
  relic_overkill: () => ({ transferOverkill: true }),
  relic_momentum: (ctx) => ({
    multiplier: (ctx.consecutivePlayTurns || 0) >= 3 ? 1.4 : 1,
  }),
  relic_first_blood: () => ({ multiplier: 1.6 }),
  relic_executioner: (ctx) => ({
    multiplier: (ctx.targetHpPercent || 1) <= 0.25 ? 2 : 1,
  }),

  // === 4.6 防御/生存类 ===
  relic_iron_skin: () => ({ armor: 8 }),
  relic_regeneration: () => ({ heal: 2 }),
  relic_thorns: () => ({ reflectDamage: 3 }),
  relic_last_stand: () => ({ preventDeath: true, invincibleTurns: 1 }),
  relic_blood_pact: (ctx) => ({
    heal: Math.min(5, Math.ceil((ctx.damageDealt || 0) * 0.1)),
  }),
  relic_shield_bash: (ctx) => ({
    damage: (ctx.currentArmor || 0) >= 10 ? Math.ceil((ctx.currentArmor || 0) * 0.2) : 0,
  }),

  // === 4.7 元素/状态类 ===
  relic_elemental_mastery: () => ({ elementDamageMult: 1.5 }),
  relic_status_amplifier: () => ({ statusDurationBonus: 1 }),
  relic_purify_aura: () => ({ purify: 1 }),
  relic_elemental_overflow: () => ({ extraElementTrigger: true }),

  // === 4.8 经济/探索类 ===
  relic_gold_magnet: () => ({ goldMultiplier: 1.2 }),
  relic_treasure_map: () => ({ revealHiddenChests: true }),
  relic_merchant_badge: () => ({ shopDiscount: 0.15 }),
  relic_lucky_coin: () => ({ extraRelicChance: 0.3 }),

  // === 4.9 骰子库管理类 ===
  relic_forge_hammer: () => ({ upgradeDie: true }),
  relic_recycler: () => ({ sellDoubleGold: true }),
  relic_duplicator: () => ({ duplicateDie: true }),
  relic_quality_filter: () => ({ filterCommonDice: true }),

  // === 4.10 特殊机制类 ===
  relic_overcharge_core: () => ({ overchargeBonusMult: 0.1 }),
  relic_control_mastery: () => ({ controlDurationBonus: 1 }),
  relic_elite_hunter: () => ({ extraRelicOnEliteKill: true }),
  relic_curse_collector: (ctx) => ({
    multiplier: 1 + (ctx.cursedDiceCount || 0) * 0.08,
  }),

  // === 战士专属 ===
  relic_warrior_starter: () => ({ bloodRerollCostHalf: true, firstBloodRerollFree: true }),
  relic_wound_collector: () => ({ scarDecayHalf: true }),
  relic_chain_extender: () => ({ bloodChainDurationBonus: 1 }),
  relic_chain_amplifier: () => ({ bloodChainTransferMult: 1.5 }),
  relic_undying_spirit: (ctx) => ({
    bloodRerollFree: (ctx.hpPercent || 1) <= 0.3,
  }),
  relic_scatter_bracer: () => ({ scatterCritChance: 0.2, scatterCritMult: 2 }),
  relic_warlord_emblem: () => ({ tempDrawCountBonus: 1 }),
  relic_berserker_mask: () => ({ berserkExtraPlay: 1, berserkEndHpLoss: 0.15 }),
  relic_iron_heart: (ctx) => ({
    armor: (ctx.currentArmor || 0) >= 20 ? Math.ceil((ctx.currentArmor || 0) * 0.5) : 0,
  }),
  relic_blood_drum: () => ({ allDiceBaseDamageBonus: 2 }),

  // === 法师专属 ===
  relic_mage_starter: () => ({ chantKeepLimit: 4 }),
  relic_time_dilation: () => ({ chantKeepScaling: true }),
  relic_elem_cycle: () => ({ elementRerollOnKeep: true }),
  relic_barrier_echo: (ctx) => ({
    reflectDamage: Math.ceil((ctx.shieldBroken || 0) * 0.5),
  }),
  relic_chant_mastery: () => ({ multiplier: 1.5 }),
  relic_elem_convergence: (ctx) => ({
    elementEffectDouble: (ctx.sameElementCount || 0) >= 3,
  }),
  relic_arcane_overflow: (ctx) => ({
    multiplier: (ctx.handSize || 0) >= 5 ? 1.25 : 1,
  }),
  relic_disruption_ward: () => ({ maxVulnerableLayers: 4 }),
  relic_meteor_shard: () => ({ meteorChantReduction: 1 }),
  relic_mana_crystal: () => ({ grantExtraCrystal: true }),

  // === 盗贼专属 ===
  relic_rogue_starter: () => ({ secondPlayComboBonus: 0.3 }),
  relic_shadow_cloak: (ctx) => ({
    damageTakenMult: (ctx.hasShadowDie || false) ? 0.85 : 1,
  }),
  relic_combo_counter: (ctx) => ({
    grantExtraPlay: (ctx.consecutiveCombo || 0) >= 3 ? 1 : 0,
  }),
  relic_poison_mastery: () => ({ poisonMultiplier: 1.5 }),
  relic_shadow_reserve: () => ({ preserveShadowDice: true }),
  relic_blade_dance: (ctx) => ({
    multiplier: (ctx.playsThisTurn || 0) === 2 ? 1.6 : 1, // 第3次出牌时 playsThisTurn=2
  }),
  relic_venom_sac: () => ({ poisonAllEnemies: 3 }),
  relic_shadow_step: () => ({ heal: 2 }),
  relic_death_mark: (ctx) => ({
    multiplier: (ctx.targetPoisonLayers || 0) >= 10 ? 1.4 : 1,
  }),
  relic_phantom_blade: (ctx) => ({
    damage: ctx.shadowDiceConsumedValue || 0,
  }),
};

// ============================================================
// 转换函数：RelicV05Def → Relic
// ============================================================

/**
 * 将 v0.5 遗物元数据转换为完整的 Relic 对象
 */
export function convertV05ToRelic(def: typeof ALL_RELICS_V05[number]): Relic {
  const effectFn = EFFECT_MAP[def.id];
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    rarity: def.rarity as any,
    trigger: def.trigger as any,
    effect: effectFn || (() => ({})),
  };
}

/**
 * 获取全部 v0.5 遗物（已转换为 Relic 对象）
 */
export function getAllV05Relics(): Relic[] {
  return ALL_RELICS_V05.map(convertV05ToRelic);
}

/**
 * 按职业获取 v0.5 遗物池
 */
export function getV05RelicsForClass(classId: string): Relic[] {
  return ALL_RELICS_V05
    .filter(r => !r.classRestriction || r.classRestriction === classId)
    .map(convertV05ToRelic);
}
