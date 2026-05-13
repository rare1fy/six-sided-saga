/**
 * classes.ts — 职业系统核心数据
 * 
 * 定义三大职业的规则、初始配置和专属骰子池。
 * 职业差异来自"出牌规则"而非数值膨胀。
 */

import type { DiceDef } from '../types/game';

// ============================================================
// 职业类型定义
// ============================================================

export type ClassId = 'warrior' | 'mage' | 'rogue';

export interface ClassDef {
  id: ClassId;
  name: string;
  title: string;           // 副标题
  description: string;     // 简短描述
  color: string;           // 主题色
  colorLight: string;      // 浅色
  colorDark: string;       // 深色

  // 回合规则
  drawCount: number;       // 每回合抽骰数
  maxPlays: number;        // 出牌次数
  freeRerolls: number;     // 免费重投次数
  canBloodReroll: boolean; // 嗜血
  keepUnplayed: boolean;   // 保留未出牌骰子

  // 生命值
  hp: number;              // 初始血量
  maxHp: number;           // 最大血量

  // 初始骰子库
  initialDice: string[];   // 普通×4 + 职业骰×2

  // 职业特权描述（简短版，用于顶栏等）
  passiveDesc: string;
  // 职业技能列表（用于职业选择界面详细展示）
  skills: { name: string; desc: string }[];
  // 普攻特殊规则
  normalAttackMultiSelect: boolean; // 普攻可多选
}

// ============================================================
// 三大职业定义
// ============================================================

export const CLASS_DEFS: Record<ClassId, ClassDef> = {
  warrior: {
    id: 'warrior',
    name: '嗜血狂战',
    title: '铁血征服者',
    description: '以血换伤，一击致命。嗜血越多，越凶。',
    color: '#c04040',
    colorLight: '#ff6060',
    colorDark: '#601010',
    drawCount: 3,
    maxPlays: 1,
    freeRerolls: 1,
    canBloodReroll: true,
    keepUnplayed: false,
    hp: 120,
    maxHp: 120,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'w_bloodthirst', 'w_fury'],
    passiveDesc: '【嗜血战意】战斗本能多颗散打；搏命 HP×2^n% 重投；伤痕：自伤+层，普攻追加基础伤害=当前层数',
    skills: [
      { name: '战斗本能', desc: '一次普通攻击可选 ≥2 颗散骰，伤害=各骰点数和；散打期间所有骰子视为普通骰子（onPlay/element 不触发）' },
      { name: '搏命', desc: '消耗 HP×2^n% 购买额外重投（n=本回合已搏命次数）；主动自伤不触发反弹' },
      { name: '伤痕', desc: '主动自伤每损 1 HP +1 层（无上限）；普通攻击追加基础伤害=当前层数（不消耗、被动持续受益）；每敌方回合 -2 层；战斗结束清零' },
    ],
    normalAttackMultiSelect: true,
  },
  mage: {
    id: 'mage',
    name: '星界魔导',
    title: '星界禁咒师',
    description: '耐心吟唱2-3回合，攒齐完美手牌一波超载。',
    color: '#7040c0',
    colorLight: '#a070ff',
    colorDark: '#301060',
    drawCount: 3,
    maxPlays: 1,
    freeRerolls: 1,
    canBloodReroll: false,
    keepUnplayed: true,
    hp: 100,
    maxHp: 100,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'mage_elemental', 'mage_reverse'],
    passiveDesc: '【星界吟唱】未出牌骰子保留到下回合（3→4→5→6递增）；吟唱回合获得奥术屏障（减免一切伤害含DOT），但吟唱会导致【法脉紊乱】——每次受击累加 2^N 层易伤（第N次受击）；满6后继续吟唱每次+10%伤害；出牌后重置',
    skills: [
      { name: '星界吟唱', desc: '不出牌的骰子保留至下回合，上限 3→4→5→6 递增' },
      { name: '奥术屏障', desc: '吟唱回合获得屏障（4/6/8/10），可挡一切伤害' },
      { name: '法脉紊乱', desc: '吟唱时受击累加 2^N 层易伤；满6后每回合伤害再+10%；出牌后重置' },
    ],
    normalAttackMultiSelect: false,
  },
  rogue: {
    id: 'rogue',
    name: '影锋刺客',
    title: '暗影连击者',
    description: '一回合出牌2次，连击层层加成。',
    color: '#30a050',
    colorLight: '#60d080',
    colorDark: '#104020',
    drawCount: 3,
    maxPlays: 2,
    freeRerolls: 1,
    canBloodReroll: false,
    keepUnplayed: false,
    hp: 90,
    maxHp: 90,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'r_quickdraw', 'r_combomastery'],
    passiveDesc: '【双刃连击】每回合出牌2次；第2次非普攻+20%；同牌型再+25%。暗影残骰：部分骰子产出残骰，可被消耗换效果',
    skills: [
      { name: '双刃连击', desc: '每回合出牌2次；第2次非普攻+20%；同牌型再+25%' },
      { name: '暗影残骰', desc: '部分骰子产出残骰进入手牌，可被消耗换效果' },
      { name: '连击节奏', desc: '第1次出牌后+1次免费重投；额外出牌机会最多+1次' },
    ],
    normalAttackMultiSelect: false,
  },
};
// ============================================================
// 战士专属骰子（20个）
// 原则：嗜血卖血 → 直来直往 → 简单初学
// ============================================================

const WARRIOR_DICE: DiceDef[] = [
  // === Common (4) · v0.5 ===
  { id: 'w_bloodthirst', name: '血之渴望', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'A',
    description: '失去最大生命的 2%（最少 1 点），造成 6 点基础伤害。如果作为普通攻击打出，基础伤害变成 10 点。',
    onPlay: { selfDamagePercent: 0.02, bonusDamage: 6, bonusDamageOnNormalAttack: 10 } },
  { id: 'w_armorbreak', name: '碎甲献祭', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'A',
    description: '失去最大生命的 3%，摧毁目标全部护甲。本击的伤害每有 1 层伤痕额外 +2 点（层数越多，这一击越狠）。',
    onPlay: { armorBreak: true, selfDamagePercent: 0.03, scarBonusDamagePerLayer: 2 } },
  { id: 'w_fury', name: '怒火', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'B',
    description: '越挨打越凶猛。最近一次敌方回合中你每被打掉一次血，本次出牌的增幅倍率 +25%（无上限）。若最近一次敌方回合中你被打掉血 ≥3 次，额外对主目标施加 1 层易伤。',
    onPlay: { multPerHitTaken: 0.25, vulnerableOnHits: 3 } },
  { id: 'w_warcry', name: '战吼', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'BC',
    description: '对目标施加 1 层易伤（每层使其受到的伤害 +50%，最多 5 层）。如果最近一次敌方回合中你曾被敌人打掉血，本次伤害额外 +50%。',
    onPlay: { statusToEnemy: { type: 'vulnerable', value: 1, duration: 99 }, multIfHitLastTurn: 0.5 } },

  // === Uncommon (6) · v0.5 ===
  { id: 'w_revenge', name: '复仇之刃', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'A',
    description: '越受伤越疼。打出时按你已损失的生命值 ×25% 追加基础伤害（封顶 80 点）——掉血越多，一击越重。',
    onPlay: { scaleWithLostHp: 0.25, scaleWithLostHpCap: 80 } },
  { id: 'w_bloodchain', name: '血锁链', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'uncommon',
    route: 'AC',
    description: '与目标缔结血锁，持续到下个敌方回合结束。期间你受到的伤害和你自伤的损失，都等额传给被锁的敌人。打出顺子时与命中的所有敌人同时缔结。新血锁覆盖旧血锁。',
    onPlay: { bloodChain: true } },
  { id: 'w_lifefurnace', name: '生命熔炉', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'C',
    description: '不满血时回复生命 = 本骰点数 × 2。满血时改为获得护甲 = 本骰点数 × 3，并使你本回合下一次出牌伤害 +20%（回合结束清除）。',
    onPlay: { healMultFromValue: 2, fullHpArmorMult: 3, fullHpBonusMult: 0.2 } },
  { id: 'w_roar', name: '怒吼净化', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'C',
    description: '怒吼一声，清掉自己身上所有的负面状态（中毒、灼烧、流血、易伤、虚弱、定身……），并嘲讽全场敌人 1 回合（被嘲讽的敌人会放弃原本的意图，强制改为普攻你，且本次普攻伤害降为 70%）。每洗掉 1 层负面状态，对随机敌人造成 1 点基础伤害。',
    onPlay: { purifyAll: true, controlType: 'taunt', controlAoe: true, damagePerCleanse: 1 } },
  { id: 'w_leech', name: '孤注之刃', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'B',
    description: '仅当作为普通攻击打出时生效——本次出牌伤害 ×3.0，并按所有打出骰子点数总和追加等量基础伤害。',
    onPlay: { normalAttackOnly: true, bonusMult: 3.0, bonusDamageFromTotalPoints: true } },
  { id: 'w_execute', name: '斩杀', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'BA',
    description: '残血敌人额外受重伤——目标生命低于 25% 时本次伤害 ×2。击杀目标时回复最大生命的 10%，并且下回合开始多抽 1 颗骰子。如果击杀时你身上有 5 层及以上伤痕，或目标处于血锁状态，回复变为 20%。',
    onPlay: { executeThreshold: 0.25, executeMult: 2, executeHealPercent: 0.1, executeHealPercentBoosted: 0.2, executeDrawBonus: 1 } },

  // === Rare (8) · v0.5 ===
  { id: 'w_bloodblade', name: '浴血之刃', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'A',
    description: '用伤痕铸就锋芒。打出时消耗当前伤痕的 50%（向下取整）；只要消耗成功（≥1 层），本骰所有面值永久 +1（本场最多 +5）。每次搏命重投后，本骰面值也永久 +1（与上述效果共用 +5 上限）。',
    onPlay: { consumeScarPercent: 0.5, permanentFaceBonus: 1, permanentFaceBonusCap: 5 } },
  { id: 'w_unyielding', name: '单挑！', element: 'normal', faces: [3,4,4,5,5,6], rarity: 'rare',
    route: 'AC',
    description: '与目标 1v1 决斗，持续 1 个完整回合。决斗期间：你打出的顺子等 AOE 牌型只命中该目标，但伤害 +40%；你和目标互相造成的伤害 +40%；其他敌人对你的攻击全部失效（攻击意图照常消耗）。骰子自带的全体伤害效果（如旋风斩）不受影响。Boss 也能被单挑。',
    onPlay: { soloSeal: true, soloSealDamageMult: 1.4 } },
  { id: 'w_warhammer', name: '战神之锤', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'B',
    description: '牌型越大越威猛。组成三条及以上牌型（三条 / 葫芦 / 大葫芦 / 三连对 / 四条 / 五条 / 六条）时，按所有打出骰子点数总和的 50% 追加基础伤害，并眩晕本次命中的目标 1 次行动（跳过其下次攻击/施法）。散打和顺子不触发。',
    onPlay: { bonusDamageFromPoints: 0.5, requiresTriple: true, controlType: 'stun' } },
  { id: 'w_giantshield', name: '巨人壁垒', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'C',
    description: '获得护甲 = 所有打出骰子点数总和 × 2.5，并嘲讽全场敌人 1 回合（被嘲讽的敌人会放弃原本的意图，强制改为普攻你，且本次普攻伤害降为 70%）。如果你身上已有 3 层及以上伤痕，护甲倍率提升至 ×3.5。',
    onPlay: { armorMultFromTotalPoints: 2.5, armorMultBoosted: 3.5, scarThresholdForBoost: 3, controlType: 'taunt', controlAoe: true } },
  { id: 'w_whirlwind', name: '旋风斩', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'B',
    description: '单颗打出时旋转劈砍——对全体敌人造成本骰点数的伤害，每个被命中的敌人额外承受 6 点基础伤害，并眩晕 1 次行动。如果最近一次敌方回合中你曾被敌人打掉血，基础伤害翻倍至 12 点。',
    onPlay: { aoe: true, aoeDamage: 6, aoeDamageBoosted: 12, controlType: 'stun', controlAoe: true } },
  { id: 'w_cleave', name: '顺劈斩', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'CB',
    description: '击杀目标时，溢出伤害 100% 转移给随机另一个敌人。',
    onPlay: { splinterDamage: 1.0 } },
  { id: 'w_quake', name: '震地', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'B',
    description: '单颗或带牌型打出：本骰点数 +3，并对随机一名敌人附加 3 层易伤（封顶 5 层）。当本次出牌触发战斗本能（散打）时：本次散打的最终伤害额外 +30%（单次封顶 +60，与战神之锤 +50% 基础伤害、旋风斩 AOE 乘算独立叠加）。',
    onPlay: { selfPointBonus: 3, vulnerableToRandom: 3, scatterBonusMult: 0.3, scatterBonusCap: 60 } },
  { id: 'w_berserk', name: '狂暴之心', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'AB',
    description: '进入狂暴 2 个玩家回合（本回合 + 下回合）：造成的伤害 +30%，但受到的伤害也 +20%。狂暴期间，搏命重投的 HP 代价 -50%。新打出的狂暴会刷新时长，不叠加。',
    onPlay: { selfBerserk: true, berserkDuration: 2, berserkDamageMult: 0.3, berserkTakenMult: 0.2, berserkBloodCostReduction: 0.5 } },

  // === Legendary (2) · v0.5 ===
  { id: 'w_bloodgod', name: '血神之眼', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    route: 'A',
    description: '嗜血滚雪球。打出时本回合每损失最大生命的 1%，本次伤害 +15%（最多 +120%）。同时按当前伤痕的 30% 消耗一部分层数，每消耗 1 层再加 5%。如果你身上已有伤痕，或正处于单挑状态，再额外 +20%。三段加成总计封顶 +200%。',
    onPlay: { scaleWithSelfDamage: true, selfDamageMultPer1Pct: 0.15, selfDamageMultCap: 1.2, consumeScarPercent: 0.3, scarMultPerLayer: 0.05, scarOrSoloBonus: 0.2, totalMultCap: 2.0 } },
  { id: 'w_titanfist', name: '泰坦之拳', element: 'normal', faces: [6,6,6,6,6,6], rarity: 'legendary',
    route: 'B',
    description: '散打的终结一拳。仅普通攻击时生效——失去最大生命的 10%，摧毁目标全部护甲，追加 30 点真实伤害（穿透护甲），并保底削掉目标当前生命的 60%。本场第 2 次起：失去最大生命改为 15%、追加真实伤害降为 15 点、保底削血降为 30%。',
    onPlay: { normalAttackOnly: true, selfDamagePercent: 0.10, armorBreak: true, trueDamage: 30, guaranteedHpPercent: 0.6, repeatSelfDamagePercent: 0.15, repeatTrueDamage: 15, repeatGuaranteedHpPercent: 0.3 } },
];

// ============================================================
// 法师专属骰子（20个）
// 原则：囤牌吟唱 → 元素操控 → 一波毁天灭地
// ============================================================

const MAGE_DICE: DiceDef[] = [
  // === Common (6) · v0.5 ===
  { id: 'mage_elemental', name: '元素之力', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'B', isElemental: true,
    description: '每回合随机变为火、风、雷、毒、圣元素之一，触发对应元素效果',
    onPlay: { elementPool: ['fire','wind','thunder','poison','holy'] } },
  { id: 'mage_reverse', name: '逆流', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'A',
    description: '摧毁目标全部护甲，并将护甲数值转化为对目标的伤害',
    onPlay: { armorBreak: true, armorToDamage: true } },
  { id: 'mage_missile', name: '奥术飞弹', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'B',
    description: '出牌结算后，对每个存活敌人各造成等于本骰子点数的独立伤害',
    onPlay: { chainBolt: true } },
  { id: 'mage_barrier', name: '魔力壁障', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'A',
    description: '出牌时获得免伤护盾，数值为本骰子点数的2倍，本回合内抵消等量伤害',
    onPlay: { damageShield: true } },
  { id: 'mage_meditate', name: '冥想', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'A',
    description: '吟唱回合自动回复4HP，并清除1层负面状态',
    onPlay: { healOnSkip: 4, purifyOneOnSkip: true } },
  { id: 'mage_amplify', name: '奥术增幅', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    route: 'B',
    description: '出牌时手牌中每有1颗元素骰子，最终伤害提升15%',
    onPlay: { multPerElement: 0.15 } },

  // === Uncommon (8) · v0.5 ===
  { id: 'mage_mirror', name: '命运骰', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'A',
    description: '出牌后不进弃骰库，留在手牌中并重新roll。1-3点回复等量HP；4-6点造成点数×3伤害。每回合限用1次。',
    onPlay: { fateDie: true, fateDieHealRange: [1,3], fateDieDamageRange: [4,6], fateDieDamageMult: 3 } },
  { id: 'mage_crystal', name: '蓄能水晶', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'A',
    description: '保留到下回合时，本骰子的点数增加2',
    onPlay: { bonusOnKeep: 2 } },
  { id: 'mage_temporal', name: '时光之沙', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'A',
    description: '保留到下回合时，自动将手牌中点数最低的骰子点数增加3。面值>6时分裂为6+溢出值两颗。',
    onPlay: { boostLowestOnKeep: 3 } },
  { id: 'mage_prism', name: '棱镜聚焦', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'B', isElemental: true,
    description: '出牌后锁定当前元素类型，下回合所有元素骰子沿用该类型',
    onPlay: { lockElement: true } },
  { id: 'mage_resonance', name: '共鸣', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'B', isElemental: true,
    description: '自动跟随本回合的元素坍缩结果，额外触发一次该元素效果',
    onPlay: { copyMajorityElement: true } },
  { id: 'mage_polymorph', name: '变羊术', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'C',
    description: '对目标施加变羊2回合（50%普通羊attack=1/50%羊王attack=20 hp=6）。Boss/精英100%豁免。',
    onPlay: { controlType: 'polymorph' } },
  { id: 'mage_purify', name: '净化之光', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'C',
    description: '清除自身全部负面状态，每清除1层回复5HP',
    onPlay: { purifyAll: true, healPerCleanse: 5 } },
  { id: 'mage_counter', name: '法力反制', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    route: 'C',
    description: '标记目标。若目标下次行动为施法，则打断并反弹50%伤害（穿护甲）。若为普攻则不触发。',
    onPlay: { manaCounter: true } },

  // === Rare (4) · v0.5 ===
  { id: 'mage_elemstorm', name: '元素风暴', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'B', isElemental: true,
    description: '出牌时每颗选中的骰子各触发1种随机元素效果（fire/wind/thunder/poison/holy）',
    onPlay: { multiElementBlast: true, elementPool: ['fire','wind','thunder','poison','holy'] } },
  { id: 'mage_burnecho', name: '自燃共鸣', element: 'fire', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'B',
    description: '追加伤害=目标灼烧层数×2，出牌后清空目标全部灼烧层。灼烧越多一击越重。',
    onPlay: { burnEchoMultPerLayer: 2, burnEchoClearAll: true } },
  { id: 'mage_star', name: '星辰', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    route: 'A',
    description: '每吟唱1回合，本骰子点数增加1，最多+3',
    onPlay: { bonusPerTurnKept: 1, keepBonusCap: 3 } },
  { id: 'mage_gale', name: '风压冲击', element: 'wind', faces: [2,3,3,4,4,5], rarity: 'rare',
    route: 'C',
    description: 'AOE击退全体敌人（distance+2，上限3），每个被击退的敌人受2点基础伤害。走applyControl统一入口。',
    onPlay: { aoe: true, controlType: 'knockback', controlAoe: true, aoeDamage: 2 } },

  // === Legendary (2) · v0.5 ===
  { id: 'mage_meteor', name: '禁咒·陨星', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    route: 'A',
    description: '需吟唱至少2回合才能释放；伤害提升50%，之后每多吟唱1回合再提升20%',
    onPlay: { bonusMult: 1.5, requiresCharge: 2, bonusMultPerExtraCharge: 0.2 } },
  { id: 'mage_elemheart', name: '元素之心', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    route: 'B', isElemental: true,
    description: '出牌时同时触发火、风、雷、毒、圣全部5种元素效果',
    onPlay: { triggerAllElements: true, elementPool: ['fire','wind','thunder','poison','holy'] } },
];

// ============================================================
// 盗贼专属骰子（20个）
// 原则：单回合多次出牌 → 补手牌/补出牌 → 连击奖励
// ============================================================

const ROGUE_DICE: DiceDef[] = [
  // === Common (6) ===
  { id: 'r_envenom', name: '淬毒', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '对目标施加毒层，层数等于本骰子的点数', onPlay: { poisonFromValue: true } },
  { id: 'r_throwing', name: '飞刀', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'common',
    description: '出牌后弹回手牌可再次使用，每次弹回后本骰子点数+1，最多+3', onPlay: { bounceAndGrow: true } },
  { id: 'r_pursuit', name: '追击', element: 'normal', faces: [3,3,4,4,5,5], rarity: 'common',
    description: '本回合第3次及以上出牌时，伤害变为原来的2倍半', onPlay: { multOnThirdPlay: 2.5 } },
  { id: 'r_sleeve', name: '袖箭', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'common',
    description: '出牌后补1颗暗影残骰到手牌；作为连击出牌时，额外获得1次出牌机会', onPlay: { grantShadowDie: true, comboGrantPlay: true } },
  { id: 'r_quickdraw', name: '接应', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'common',
    description: '对主目标施加致盲1回合。出牌后从弃骰库回收1颗骰子；弃骰库为空时补1颗暗影残骰。',
    route: 'A', onPlay: { controlType: 'blind', recoverFromDiscard: 1, fallbackShadowDie: true } },
  { id: 'r_combomastery', name: '连击心得', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'common',
    description: '出牌后补1颗暗影残骰到手牌；作为连击出牌时，该残骰可保留到下回合', onPlay: { grantShadowDie: true, comboPersistShadow: true } },

  // === Uncommon (6) ===
  { id: 'r_toxblade', name: '剧毒匕首', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '对目标施加毒层：本骰子点数+3层；目标已中毒时再额外+2层', onPlay: { poisonBase: 3, poisonBonusIfPoisoned: 2 } },
  { id: 'r_shadow_clone', name: '影分身', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'uncommon',
    description: '消耗手牌中1颗暗影残骰，本次伤害×2。无残骰时正常结算。',
    route: 'A', onPlay: { consumeShadowDie: 1, consumeShadowDieMult: 2.0 } },
  { id: 'r_boomerang', name: '回旋刃', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'uncommon',
    description: '首次出牌后弹回手牌，获得一次免费重投', onPlay: { boomerangPlay: true } },
  { id: 'r_corrosion', name: '蚀骨毒液', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '追加基础伤害=目标毒层×2；连击时额外引爆25%毒层+致盲1回合。',
    route: 'B', onPlay: { poisonScaleDamage: 2, comboDetonatePoison: 0.25, comboControlType: 'blind' } },
  { id: 'r_chain_strike', name: '连锁打击', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'uncommon',
    description: '连击时致盲主目标1回合+对随机另一敌人造成点数×2伤害。非连击时仅正常伤害。',
    route: 'A', onPlay: { comboSplashDamage: 2, comboControlType: 'blind' } },
  { id: 'r_shadowstrike', name: '剔骨', element: 'normal', faces: [3,3,4,4,5,5], rarity: 'uncommon',
    description: '连击时缴械主目标1回合。伤害=点数×(1+comboCount×0.5)。非连击时仅正常伤害。',
    route: 'A', onPlay: { comboControlType: 'disarm', comboScaleMultPerCombo: 0.5 } },

  // === Rare (6) ===
  { id: 'r_venomfang', name: '毒王之牙', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '对目标施加毒层，层数为手牌中毒系骰子数量的3倍', onPlay: { poisonFromPoisonDice: 3 } },
  { id: 'r_tripleflash', name: '三连闪', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'rare',
    description: '第1次出牌：从弃骰库回收1颗骰子。第2次出牌起：获得+1次额外出牌机会。',
    route: 'A', onPlay: { firstPlayRecoverDiscard: 1, comboGrantExtraPlay: true } },
  { id: 'r_shadowdance', name: '暗影转化', element: 'normal', faces: [3,3,4,4,5,5], rarity: 'rare',
    description: '消耗1颗暗影残骰，追加基础伤害=消耗残骰点数×3。无残骰时正常结算。',
    route: 'C', onPlay: { consumeShadowDie: 1, consumeShadowDieDamageMult: 3 } },
  { id: 'r_plaguedet', name: '瘟疫引爆', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '引爆目标身上50%的毒层转化为即时伤害；本回合每多出1次牌，引爆比例+10%', onPlay: { detonatePoisonPercent: 0.5, detonateExtraPerPlay: 0.1 } },
  { id: 'r_phantom', name: '幻影', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '消耗手牌中所有暗影残骰，每颗追加基础伤害=残骰点数×2。消耗≥2颗时缴械主目标1回合。',
    route: 'C', onPlay: { consumeAllShadowDice: true, consumeShadowDieDamageMult: 2, consumeThresholdForControl: 2, controlType: 'disarm' } },
  { id: 'r_purifyblade', name: '净化之刃', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'rare',
    description: '清除1层负面状态；连击时额外回复4HP并补1颗暗影残骰。',
    route: 'cross', onPlay: { purifyOne: true, comboHeal: 4, comboGrantShadowDie: true } },

  // === Legendary (2) ===
  { id: 'r_deathtouch', name: '死神之触', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '作为本回合最后一次出牌时，引爆目标身上的全部负面状态为即时伤害', onPlay: { detonateAllOnLastPlay: true } },
  { id: 'r_bladestorm', name: '影刃风暴', element: 'normal', faces: [1,2,2,3,3,4], rarity: 'legendary',
    description: '本回合每出1次牌，后续伤害+40%并补1颗残骰。首次使用后触发暗影侵蚀：本回合骰子库全变残骰（下回合恢复）。每场限1次。',
    route: 'C', onPlay: { escalateDamage: 0.4, grantShadowDie: true, shadowCorrosion: true } },
];

// ============================================================
// 按职业获取骰子池
// ============================================================

export const CLASS_DICE: Record<ClassId, DiceDef[]> = {
  warrior: WARRIOR_DICE,
  mage: MAGE_DICE,
  rogue: ROGUE_DICE,
};

/** 获取指定职业所有骰子的注册表 */
export function getClassDiceRegistry(classId: ClassId): Record<string, DiceDef> {
  const result: Record<string, DiceDef> = {};
  CLASS_DICE[classId].forEach(d => { result[d.id] = d; });
  return result;
}

/** 获取指定职业按稀有度分组的骰子 */
// ============================================================
// 符文骰子（9 颗 · 每职业 3 颗 · v0.5 新增）
// ============================================================
// 符文骰子无面值，不参与牌型组合，不造成点数伤害。
// 有两种效果：持有效果（在手牌中时自动生效）+ 打出效果（消耗出牌次数打出时触发）。

const WARRIOR_RUNE_DICE: DiceDef[] = [
  {
    id: 'rune_blood_pact', name: '血祭符文', element: 'normal', faces: [], rarity: 'rune',
    route: 'A', isRune: true,
    description: '持有：每次主动自伤后对血锁目标造成3点基础伤害。打出：消耗100%伤痕，真实伤害=层数×3。',
    holdEffect: { trigger: 'on_self_damage', damageToBloodChainTargets: 3 },
    castEffect: { consumeAllScar: true, trueDamagePerScar: 3 },
  },
  {
    id: 'rune_war_spirit', name: '战意符文', element: 'normal', faces: [], rarity: 'rune',
    route: 'B', isRune: true,
    description: '持有：普通攻击后下次伤痕放大器×1.5。打出：下次普通攻击点数翻倍。',
    holdEffect: { trigger: 'on_basic_attack', nextScarMult: 1.5 },
    castEffect: { nextBasicAttackPointsDouble: true },
  },
  {
    id: 'rune_iron_bastion', name: '铁壁符文', element: 'normal', faces: [], rarity: 'rune',
    route: 'C', isRune: true,
    description: '持有：受敌人攻击后获得护甲=伤害20%。打出：消耗全部护甲，AOE伤害=护甲80%+嘲讽全体。',
    holdEffect: { trigger: 'on_enemy_hit', armorGainPercent: 0.2 },
    castEffect: { consumeAllArmor: true, aoeDamagePercentOfArmor: 0.8, aoeControlType: 'taunt' },
  },
];

const MAGE_RUNE_DICE: DiceDef[] = [
  {
    id: 'rune_astral_echo', name: '星界共鸣', element: 'normal', faces: [], rarity: 'rune',
    route: 'A', isRune: true,
    description: '持有：吟唱回合结束时给手牌最低点数骰子+4基础伤害。打出：吟唱回合数+2，获得屏障=吟唱回合×5。',
    holdEffect: { trigger: 'on_chant_end', boostLowestDie: 4 },
    castEffect: { chantTurnsBonus: 2, barrierPerChantTurn: 5 },
  },
  {
    id: 'rune_elem_prism', name: '元素棱镜', element: 'normal', faces: [], rarity: 'rune',
    route: 'B', isRune: true,
    description: '持有：元素坍缩加成从×1.5提升至×2.0。打出：本回合所有元素骰子效果执行2次。',
    holdEffect: { trigger: 'on_turn_start', collapseMultOverride: 2.0 },
    castEffect: { elementDoubleThisTurn: true },
  },
  {
    id: 'rune_seal', name: '封印符文', element: 'normal', faces: [], rarity: 'rune',
    route: 'C', isRune: true,
    description: '持有：控制成功后回复4HP。打出：对主目标施加定身1回合+虚弱1回合（伤害-30%）。',
    holdEffect: { trigger: 'on_control_success', healOnSuccess: 4 },
    castEffect: { controlType: 'root', controlDuration: 1, secondaryControl: 'weaken', weakenReduction: 0.3 },
  },
];

const ROGUE_RUNE_DICE: DiceDef[] = [
  {
    id: 'rune_shadow_ritual', name: '暗影仪式', element: 'normal', faces: [], rarity: 'rune',
    route: 'C', isRune: true,
    description: '持有：抽牌后自动将手牌中点数最低的非残骰变为暗影残骰。打出：手牌中所有剩余骰子全变残骰。',
    holdEffect: { trigger: 'on_draw_end', transformLowestToShadow: true },
    castEffect: { transformAllToShadow: true },
  },
  {
    id: 'rune_combo_mark', name: '连击印记', element: 'normal', faces: [], rarity: 'rune',
    route: 'A', isRune: true,
    description: '持有：每次出牌后下次连击加成额外+15%。打出：本回合剩余出牌连击加成翻倍。',
    holdEffect: { trigger: 'on_play', comboBonusPerPlay: 0.15 },
    castEffect: { comboMultiplierDouble: true },
  },
  {
    id: 'rune_venom_heart', name: '剧毒之心', element: 'normal', faces: [], rarity: 'rune',
    route: 'B', isRune: true,
    description: '持有：每次出牌后自动对目标施加2层毒。打出：引爆目标100%毒层，每层3点基础伤害。',
    holdEffect: { trigger: 'on_play', autoPoison: 2 },
    castEffect: { detonateAllPoison: true, damagePerPoisonLayer: 3 },
  },
];

/** 全部符文骰子 */
export const ALL_RUNE_DICE: DiceDef[] = [
  ...WARRIOR_RUNE_DICE,
  ...MAGE_RUNE_DICE,
  ...ROGUE_RUNE_DICE,
];

/** 按职业获取符文骰子 */
export function getRuneDiceForClass(classId: string): DiceDef[] {
  switch (classId) {
    case 'warrior': return WARRIOR_RUNE_DICE;
    case 'mage': return MAGE_RUNE_DICE;
    case 'rogue': return ROGUE_RUNE_DICE;
    default: return [];
  }
}

export function getClassDiceByRarity(classId: ClassId) {
  const pool = CLASS_DICE[classId];
  return {
    common: pool.filter(d => d.rarity === 'common'),
    uncommon: pool.filter(d => d.rarity === 'uncommon'),
    rare: pool.filter(d => d.rarity === 'rare'),
    legendary: pool.filter(d => d.rarity === 'legendary'),
  };
}
