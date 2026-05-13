// ============================================================
// 遗物系统
// ============================================================

export type RelicTrigger = 
  | 'on_play'          // 每次出牌时
  | 'on_kill'          // 击杀敌人时
  | 'on_reroll'        // 重Roll时
  | 'on_turn_start'    // 回合开始时
  | 'on_turn_end'      // 回合结束时
  | 'on_battle_start'  // 战斗开始时
  | 'on_battle_end'    // 战斗结束时
  | 'on_damage_taken'  // 受到伤害时
  | 'on_fatal'        // 致命伤害时（急救沙漏免死）
  | 'on_floor_clear'   // 清层完成时
  | 'on_move'         // 地图移动时（导航罗盘/藏宝图）
  | 'on_combo'        // 连击时（盗贼专属遗物）
  | 'on_scar_gain'    // 获得伤痕时（战士专属遗物）
  | 'on_chant_end'    // 吟唱回合结束时（法师专属遗物）
  | 'on_control_success' // 控制成功时
  | 'on_overcharge'   // 过充状态时出牌
  | 'on_discard'      // 弃牌阶段时
  | 'on_hit'          // 受到攻击时（含反弹）
  | 'on_shop'         // 商店交互时
  | 'passive';        // 被动持续生效

export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface RelicContext {
  // 出牌信息
  handType?: string;
  diceCount?: number;
  diceValues?: number[];
  diceDefIds?: string[];
  pointSum?: number;
  // 战斗状态
  rerollsThisTurn?: number;
  hpLostThisTurn?: number;
  hpLostThisBattle?: number;
  currentHp?: number;
  maxHp?: number;
  currentGold?: number;
  enemiesKilledThisBattle?: number;
  overkillDamage?: number;
  // 元素追踪
  elementsUsedThisBattle?: Set<string>;
  // 特殊骰子追踪
  hasSplitDice?: boolean;
  splitDiceValue?: number;
  hasLoadedDice?: boolean;
  loadedDiceCount?: number;
  hasSpecialDice?: boolean;
  cursedDiceInHand?: number;
  crackedDiceInHand?: number;
  // 连续普攻追踪
  consecutiveNormalAttacks?: number;
  // 免费重Roll追踪
  freeRerollsUsed?: number;
  selectedDiceCount?: number;
  // 地图进度
  currentDepth?: number;           // 当前节点深度
  floorsCleared?: number;          // 已通过的战斗层数（层厅征服者用）
  didNotPlay?: boolean;            // 本回合是否未出牌（蓄力晶核用）
  handSize?: number;               // 当前手牌数（满溢魔力用）
  isComboPlay?: boolean;           // 是否为连击出牌（暗影吸取用）
  targetPoisonStacks?: number;     // 目标毒层数（毒爆晶石用）
  playsThisTurn?: number;          // 本回合已出牌次数（连击本能用）
  isBloodReroll?: boolean;         // 本次重投是否为卖血重投（黑市合同/血铸铠甲用）
  // v0.5 新增上下文
  scarLayers?: number;             // 当前伤痕层数（战士）
  comboCount?: number;             // 当前连击计数（盗贼）
  chantTurns?: number;             // 当前吟唱回合数（法师）
  shadowDiceInHand?: number;       // 手牌中暗影残骰数量（盗贼）
  isOvercharged?: boolean;         // 是否处于过充状态
  overchargeLayers?: number;       // 过充层数
  controlType?: string;            // 本次施加的控制类型
  bloodChainActive?: boolean;      // 是否有活跃血锁
  soloSealActive?: boolean;        // 是否处于单挑状态
  // v0.5 遗物效果需要的额外上下文
  diceIds?: string[];              // 出牌骰子的 diceDefId 列表
  uniqueDiceTypes?: number;        // 骰子库中不同种类数
  hpPercent?: number;              // 当前HP百分比 (0~1)
  targetHpPercent?: number;        // 目标HP百分比 (0~1)
  consecutivePlayTurns?: number;   // 连续出牌回合数
  damageDealt?: number;            // 本次造成的伤害
  currentArmor?: number;           // 当前护甲值
  cursedDiceCount?: number;        // 骰子库中诅咒/碎裂骰子数
  shieldBroken?: number;           // 被击破的屏障值
  sameElementCount?: number;       // 手牌中同元素骰子最大数量
  targetPoisonLayers?: number;     // 目标毒层数
  hasShadowDie?: boolean;          // 手牌中是否有暗影残骰
  consecutiveCombo?: number;       // 连续连击次数
  shadowDiceConsumedValue?: number; // 本次消耗的暗影残骰点数总和
}

export interface RelicEffect {
  damage?: number;
  armor?: number;
  heal?: number;
  multiplier?: number;
  pierce?: number;
  goldBonus?: number;
  drawCountBonus?: number;
  shopDiscount?: number;
  statusEffects?: import('./dice').StatusEffect[];
  preventDeath?: boolean;      // 免疫致命伤害（急救沙漏）
  overflowDamage?: number;     // 溢出伤害转化
  freeRerolls?: number;
  // 特殊标记
  canLockDice?: boolean;
  maxPointsUnlocked?: boolean;
  straightUpgrade?: number;      // 顺子触发时升级量（3顺变4顺）
  pairAsTriplet?: boolean;       // 对子视为三条结算
  rerollPointBoost?: number;     // 重掷时骰子点数+N
  extraDraw?: number;            // 每回合额外抽骰子数量
  extraPlay?: number;            // 每回合额外出牌次数
  extraReroll?: number;          // 每回合额外免费重投次数
  normalElementChance?: number;  // 普通骰子获得元素概率
  tempDrawBonus?: number;        // 下回合临时+N手牌（魔法手套）
  unlockBloodReroll?: boolean;   // 解锁卖血重投（嗜血骰袋）
  grantFreeReroll?: number;      // 获得N次免费重投
  grantExtraPlay?: number;       // 获得N次额外出牌
  keepUnplayedOnce?: boolean;    // 本场战斗保留未使用骰子1次（命运之轮）
  keepHighestDie?: number;       // 保留点数最高的N颗骰子到下回合
  freeRerollChance?: number;     // 重投时N%概率不消耗次数
  oncePerTurn?: boolean;         // 每回合只触发一次
  purifyDebuff?: number;         // 净化N个负面状态
  // v0.5 新增效果字段
  scarBonus?: number;              // 伤痕层数加成
  comboBonus?: number;             // 连击伤害加成
  chantBonus?: number;             // 吟唱倍率加成
  overchargeBonus?: number;        // 过充加成
  shadowDieOnTrigger?: boolean;    // 触发时补残骰
  controlSuccessHeal?: number;     // 控制成功时回复HP
  bloodChainDamageMult?: number;   // 血锁传递伤害倍率
  // v0.5 遗物效果新增字段
  tempDrawCountBonus?: number;     // 临时抽牌数加成
  grantDieWithValue?: number;      // 补一颗指定点数的骰子
  forceAoe?: boolean;              // 强制AOE
  allowFullHandPlay?: boolean;     // 允许全手牌出牌
  maxPlaysPerTurn?: number;        // 每回合最大出牌次数限制
  echoLastPlay?: boolean;          // 回声：重复上次牌型
  straightTolerance?: number;      // 顺子容差
  pairTolerance?: number;          // 对子容差
  straightFullAoe?: boolean;       // 顺子全额AOE
  returnPairDice?: boolean;        // 葫芦对子部分回手
  boostMatchingDice?: number;      // 同点数骰子加成
  freeRerollOnSix?: boolean;       // 重投到6时免费再投
  rerollFloor?: number;            // 重投下限偏移
  guaranteedSix?: boolean;         // 保证重投出6
  randomDiceToSeven?: boolean;     // 随机骰子变7
  damageTakenMult?: number;        // 受伤倍率
  transferOverkill?: boolean;      // 溢出伤害转移
  reflectDamage?: number;          // 反弹伤害
  invincibleTurns?: number;        // 无敌回合数
  elementDamageMult?: number;      // 元素伤害倍率
  statusDurationBonus?: number;    // 状态持续时间加成
  purify?: number;                 // 净化层数
  extraElementTrigger?: boolean;   // 额外元素触发
  goldMultiplier?: number;         // 金币倍率
  revealHiddenChests?: boolean;    // 显示隐藏宝箱
  extraRelicChance?: number;       // 额外遗物概率
  upgradeDie?: boolean;            // 升级骰子
  sellDoubleGold?: boolean;        // 卖骰子双倍金币
  duplicateDie?: boolean;          // 复制骰子
  filterCommonDice?: boolean;      // 过滤普通骰子
  overchargeBonusMult?: number;    // 过充额外倍率
  controlDurationBonus?: number;   // 控制持续时间加成
  extraRelicOnEliteKill?: boolean; // 精英击杀额外遗物
  bloodRerollCostHalf?: boolean;   // 搏命代价减半
  firstBloodRerollFree?: boolean;  // 首次搏命免费
  scarDecayHalf?: boolean;         // 伤痕衰减减半
  bloodChainDurationBonus?: number; // 血锁链持续时间加成
  bloodChainTransferMult?: number; // 血锁链传递倍率
  bloodRerollFree?: boolean;       // 搏命免费
  scatterCritChance?: number;      // 散打暴击概率
  scatterCritMult?: number;        // 散打暴击倍率
  berserkExtraPlay?: number;       // 狂暴额外出牌
  berserkEndHpLoss?: number;       // 狂暴结束HP损失
  allDiceBaseDamageBonus?: number; // 所有骰子基础伤害加成
  chantKeepLimit?: number;         // 吟唱保留上限
  chantKeepScaling?: boolean;      // 吟唱保留递增
  elementRerollOnKeep?: boolean;   // 保留时元素重随机
  elementEffectDouble?: boolean;   // 元素效果翻倍
  maxVulnerableLayers?: number;    // 易伤层数上限
  meteorChantReduction?: number;   // 陨星吟唱减少
  grantExtraCrystal?: boolean;     // 额外蓄能水晶
  secondPlayComboBonus?: number;   // 第2次出牌连击加成
  poisonMultiplier?: number;       // 毒层倍率
  preserveShadowDice?: boolean;    // 保留暗影残骰
  poisonAllEnemies?: number;       // 全体施毒层数
}

// ============================================================
// 被动遗物字段 Brand Type（ARCH-3 类型安全）
// ============================================================

/**
 * 被动遗物特有的字段键名
 *
 * [RULES-A4] 这些字段只由 trigger: 'passive' 的遗物返回，
 * 不依赖 RelicContext，可以在 sumPassiveRelicValue 中安全查询。
 * 如果尝试用 sumPassiveRelicValue 查询不在此列表的字段，TypeScript 会报错。
 */
export type PassiveRelicKey =
  | 'maxPointsUnlocked'      // limit_breaker: 骰子面值上限解除
  | 'shopDiscount'           // merchant_compass: 商店折扣
  | 'keepUnplayedOnce'       // fortune_wheel_relic: 保留未使用骰子
  | 'straightUpgrade'        // dimension_crush: 顺子升级
  | 'pairAsTriplet'          // unified_pair: 对子视为三条
  | 'rerollPointBoost'       // chaos_face: 重投点数加成
  | 'extraPlay'              // extra_play_relic: 额外出牌
  | 'extraReroll'            // fate_coin: 额外重投
  | 'normalElementChance'    // element_infuser: 普通骰子元素概率
  | 'unlockBloodReroll';     // extra_free_reroll: 解锁卖血重投
  // 注意：'extraDraw' 不是被动遗物字段，没有遗物返回此字段

import type { ClassId } from '../data/classes';

export interface Relic {
  id: string;
  name: string;
  description: string;
  icon: string;           // icon标识符（对应PixelIcons中的组件）
  rarity: RelicRarity;
  trigger: RelicTrigger;
  effect: (context: RelicContext) => RelicEffect;
  // 职业限制：undefined=通用遗物，'warrior'/'mage'/'rogue'=仅该职业在常规商店可见
  classRestriction?: ClassId;
  // 职业黑名单：该职业不应 roll 到这个遗物（通常是因为该职业已有同等能力，遗物对其无用）
  classBan?: ClassId[];
  // 计数型遗物
  counter?: number;        // 当前计数值
  maxCounter?: number;      // 最大计数（用于显示进度）
  counterLabel?: string;    // 计数标签（如"层"、"次"）
}


// ============================================================
// 开局三选一机制（v0.5 新增）
// ============================================================

export interface StarterRelicChoice {
  relicId: string;
  hpCost: number;      // 选择代价（HP + maxHP）
  maxHpCost: number;
}

export interface StarterRelicSelection {
  choices: StarterRelicChoice[];  // 3个选项
  selectedIndex: number | null;   // 玩家选择（null = 跳过）
}

/** 开局遗物代价表 */
export const STARTER_RELIC_COST: Record<RelicRarity, { hp: number; maxHp: number }> = {
  common: { hp: 5, maxHp: 5 },
  uncommon: { hp: 10, maxHp: 10 },
  rare: { hp: 15, maxHp: 15 },
  legendary: { hp: 20, maxHp: 20 },
};
