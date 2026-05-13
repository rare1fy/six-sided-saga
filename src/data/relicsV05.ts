/**
 * relicsV05.ts - v0.5 遗物注册表（80件）
 *
 * 设计文档：板块05
 * 包含：50件通用遗物 + 10件战士专属 + 10件法师专属 + 10件盗贼专属
 *
 * 本文件仅定义遗物元数据（ID/名称/描述/稀有度/触发/CD）。
 * effect 函数在 relicEffects/ 目录下分文件实现。
 */

import type { RelicRarity, RelicTrigger } from '../types/relics';

export interface RelicV05Def {
  id: string;
  name: string;
  description: string;
  rarity: RelicRarity;
  trigger: RelicTrigger;
  cd?: string;           // CD 标记
  classRestriction?: 'warrior' | 'mage' | 'rogue'; // 职业限制
}

// ============================================================
// 通用遗物（50件）
// ============================================================

export const COMMON_RELICS_V05: RelicV05Def[] = [
  // --- 4.1 抽牌/手牌规则类（6件）---
  { id: 'relic_greedy_hand', name: '贪婪之手', description: '每回合多抽1颗骰子，但手牌上限-1', rarity: 'uncommon', trigger: 'on_turn_start', cd: '常驻' },
  { id: 'relic_slowpoke', name: '慢性子', description: '每回合少抽1颗骰子，但所有骰子点数+1（上限6）', rarity: 'rare', trigger: 'on_turn_start', cd: '常驻' },
  { id: 'relic_boomerang', name: '回旋镖', description: '弃牌阶段，弃掉的骰子中点数最高的1颗直接回到手牌', rarity: 'uncommon', trigger: 'on_discard', cd: '每次触发' },
  { id: 'relic_fate_gear', name: '命运齿轮', description: '抽牌后可将1颗骰子放回骰子库顶部（下回合必抽到）', rarity: 'rare', trigger: 'on_turn_start', cd: '常驻' },
  { id: 'relic_gambler_creed', name: '赌徒信条', description: '每回合+1次免费重投，但重投后点数更低则该骰子锁定', rarity: 'legendary', trigger: 'on_turn_start', cd: '常驻' },
  { id: 'relic_mirror_bag', name: '镜像骰袋', description: '单颗出牌时，从骰子库抽1颗相同点数的骰子加入手牌', rarity: 'uncommon', trigger: 'on_play', cd: '回合CD：2' },

  // --- 4.2 出牌规则类（6件）---
  { id: 'relic_minimalist', name: '极简主义', description: '只选1颗骰子出牌时，本次伤害×2', rarity: 'rare', trigger: 'on_play', cd: '每次触发' },
  { id: 'relic_perfectionist', name: '完美主义', description: '葫芦/四条/五条/六条且所有骰子同ID时，伤害×3', rarity: 'legendary', trigger: 'on_play', cd: '每次触发' },
  { id: 'relic_shotgun', name: '散弹枪', description: '普通攻击改为AOE，但伤害-40%', rarity: 'uncommon', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_all_in', name: '赌上一切', description: '每回合只能出牌1次，但可选全部手牌一起打出', rarity: 'legendary', trigger: 'on_turn_start', cd: '常驻' },
  { id: 'relic_chain_reaction', name: '连锁反应', description: '击杀敌人时获得1次额外出牌机会（每回合限1次）', rarity: 'rare', trigger: 'on_kill', cd: '每次触发' },
  { id: 'relic_echo', name: '回声', description: '出牌后下一次自动重复上一次牌型（消耗手牌）', rarity: 'legendary', trigger: 'on_play', cd: '回合CD：3' },

  // --- 4.3 牌型规则类（6件）---
  { id: 'relic_dimension_break', name: '降维打击', description: '顺子判定允许1颗骰子偏差±1', rarity: 'rare', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_chaos_face', name: '混沌骰面', description: '对子/三条/四条判定时点数差1也算相同', rarity: 'uncommon', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_pure_heart', name: '纯净之心', description: '骰子库种类≤5种时，所有牌型倍率+0.5', rarity: 'legendary', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_straight_master', name: '顺子大师', description: '顺子系AOE改为对每个敌人独立结算全额伤害', rarity: 'uncommon', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_fullhouse_collector', name: '葫芦收藏家', description: '打出葫芦/大葫芦时，对子部分骰子直接回手牌', rarity: 'rare', trigger: 'on_play', cd: '每次触发' },
  { id: 'relic_sync_resonance', name: '同调共振', description: '打出对子时，手牌中同点数骰子点数+2（本回合）', rarity: 'uncommon', trigger: 'on_play', cd: '每次触发' },

  // --- 4.4 重投/骰面规则类（4件）---
  { id: 'relic_lucky_face', name: '幸运骰面', description: '重投到6时额外获得1次免费重投（可连锁）', rarity: 'uncommon', trigger: 'on_reroll', cd: '常驻' },
  { id: 'relic_stabilizer', name: '稳定器', description: '重投时新点数不会低于原点数-1', rarity: 'uncommon', trigger: 'on_reroll', cd: '常驻' },
  { id: 'relic_loaded_dice', name: '灌铅骰子', description: '每场战斗首次重投必定出6', rarity: 'rare', trigger: 'on_reroll', cd: '战斗CD：1' },
  { id: 'relic_chaos_engine', name: '混沌引擎', description: '每回合开始时随机1颗骰子点数变为7（超限值，计算时视为6+1）', rarity: 'legendary', trigger: 'on_turn_start', cd: '常驻' },

  // --- 4.5 伤害计算类（6件）---
  { id: 'relic_glass_cannon', name: '玻璃大炮', description: '所有伤害+50%，但受到的伤害也+50%', rarity: 'rare', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_berserker_blood', name: '狂战士之血', description: 'HP≤50%时伤害+30%', rarity: 'uncommon', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_overkill', name: '过杀', description: '击杀敌人时溢出伤害转移给随机另一敌人', rarity: 'rare', trigger: 'on_kill', cd: '每次触发' },
  { id: 'relic_momentum', name: '动量', description: '连续3回合出牌（不跳过），第3回合伤害+40%', rarity: 'uncommon', trigger: 'on_play', cd: '每次触发' },
  { id: 'relic_first_blood', name: '先手优势', description: '每场战斗第1次出牌伤害+60%', rarity: 'uncommon', trigger: 'on_play', cd: '战斗CD：1' },
  { id: 'relic_executioner', name: '处刑人', description: '目标HP≤25%时伤害×2', rarity: 'rare', trigger: 'on_play', cd: '每次触发' },

  // --- 4.6 防御/生存类（6件）---
  { id: 'relic_iron_skin', name: '铁皮', description: '每场战斗开始时获得8点护甲', rarity: 'common', trigger: 'on_battle_start', cd: '每次触发' },
  { id: 'relic_regeneration', name: '再生', description: '每个玩家回合开始时回复2HP', rarity: 'uncommon', trigger: 'on_turn_start', cd: '每次触发' },
  { id: 'relic_thorns', name: '荆棘', description: '受到攻击时反弹3点伤害给攻击者', rarity: 'common', trigger: 'on_hit', cd: '每次触发' },
  { id: 'relic_last_stand', name: '背水一战', description: '致命伤害时保留1HP并获得无敌1回合（每场战斗限1次）', rarity: 'legendary', trigger: 'on_hit', cd: '战斗CD：1' },
  { id: 'relic_blood_pact', name: '血之契约', description: '出牌造成伤害时回复伤害值10%的HP（上限5）', rarity: 'uncommon', trigger: 'on_play', cd: '每次触发' },
  { id: 'relic_shield_bash', name: '盾击', description: '护甲≥10时出牌额外造成护甲值20%的基础伤害', rarity: 'rare', trigger: 'on_play', cd: '每次触发' },

  // --- 4.7 元素/状态类（4件）---
  { id: 'relic_elemental_mastery', name: '元素精通', description: '元素效果伤害+50%（灼烧/雷击/毒伤/风压）', rarity: 'rare', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_status_amplifier', name: '状态放大器', description: '施加的负面状态持续时间+1回合', rarity: 'uncommon', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_purify_aura', name: '净化光环', description: '每3回合自动清除1层负面状态', rarity: 'uncommon', trigger: 'on_turn_start', cd: '回合CD：3' },
  { id: 'relic_elemental_overflow', name: '元素溢出', description: '元素坍缩时额外触发1次最弱元素效果', rarity: 'rare', trigger: 'on_play', cd: '每次触发' },

  // --- 4.8 经济/探索类（4件）---
  { id: 'relic_gold_magnet', name: '吸金石', description: '战斗胜利后额外获得20%金币', rarity: 'common', trigger: 'on_battle_end', cd: '每次触发' },
  { id: 'relic_treasure_map', name: '藏宝图', description: '地图上显示隐藏宝箱位置', rarity: 'uncommon', trigger: 'on_move', cd: '常驻' },
  { id: 'relic_merchant_badge', name: '商人徽章', description: '商店物品价格-15%', rarity: 'uncommon', trigger: 'on_shop', cd: '常驻' },
  { id: 'relic_lucky_coin', name: '幸运硬币', description: '每次战斗胜利后30%概率获得额外遗物选择', rarity: 'rare', trigger: 'on_battle_end', cd: '每次触发' },

  // --- 4.9 骰子库管理类（4件）---
  { id: 'relic_forge_hammer', name: '锻造之锤', description: '每3场战斗后可选择1颗骰子永久+1点数（上限6）', rarity: 'uncommon', trigger: 'on_battle_end', cd: '节点CD：3' },
  { id: 'relic_recycler', name: '回收站', description: '卖掉骰子时获得双倍金币', rarity: 'common', trigger: 'on_shop', cd: '每次触发' },
  { id: 'relic_duplicator', name: '复制器', description: '每5场战斗后可复制1颗骰子（骰子库中出现2颗）', rarity: 'rare', trigger: 'on_battle_end', cd: '节点CD：5' },
  { id: 'relic_quality_filter', name: '品质过滤器', description: '骰子奖励池中不再出现普通稀有度骰子', rarity: 'rare', trigger: 'on_battle_end', cd: '常驻' },

  // --- 4.10 特殊机制类（4件）---
  { id: 'relic_overcharge_core', name: '过充核心', description: '过充状态时额外+10%伤害（叠加在过充基础加成上）', rarity: 'uncommon', trigger: 'on_overcharge', cd: '常驻' },
  { id: 'relic_control_mastery', name: '控制大师', description: '控制效果持续时间+1回合', rarity: 'rare', trigger: 'on_play', cd: '常驻' },
  { id: 'relic_elite_hunter', name: '精英猎手', description: '击杀精英/Boss时额外获得1次遗物选择', rarity: 'rare', trigger: 'on_kill', cd: '每次触发' },
  { id: 'relic_curse_collector', name: '诅咒收集者', description: '骰子库中每有1颗诅咒/碎裂骰子，出牌伤害+8%', rarity: 'rare', trigger: 'on_play', cd: '常驻' },
];

// ============================================================
// 战士专属遗物（10件）
// ============================================================

export const WARRIOR_RELICS_V05: RelicV05Def[] = [
  { id: 'relic_warrior_starter', name: '血契之印', description: '搏命重投HP代价减半，每场首次搏命免费', rarity: 'common', trigger: 'on_reroll', cd: '常驻', classRestriction: 'warrior' },
  { id: 'relic_wound_collector', name: '伤痕收集者', description: '伤痕衰减速度减半（每敌方回合-1层）', rarity: 'uncommon', trigger: 'on_turn_start', cd: '常驻', classRestriction: 'warrior' },
  { id: 'relic_chain_extender', name: '锁链延伸', description: '血锁链持续时间+1个敌方回合', rarity: 'rare', trigger: 'on_play', cd: '常驻', classRestriction: 'warrior' },
  { id: 'relic_chain_amplifier', name: '锁链放大器', description: '血锁链传递伤害变为150%', rarity: 'legendary', trigger: 'on_play', cd: '常驻', classRestriction: 'warrior' },
  { id: 'relic_undying_spirit', name: '不灭斗志', description: 'HP≤30%时搏命重投不消耗HP', rarity: 'rare', trigger: 'on_reroll', cd: '常驻', classRestriction: 'warrior' },
  { id: 'relic_scatter_bracer', name: '散打护腕', description: '散打时每颗骰子独立判定暴击（20%×2伤害）', rarity: 'uncommon', trigger: 'on_play', cd: '每次触发', classRestriction: 'warrior' },
  { id: 'relic_warlord_emblem', name: '战神纹章', description: '击杀敌人时下回合多抽1颗骰子', rarity: 'rare', trigger: 'on_kill', cd: '每次触发', classRestriction: 'warrior' },
  { id: 'relic_berserker_mask', name: '狂暴面具', description: '狂暴期间出牌次数+1，狂暴结束失去15%当前HP', rarity: 'legendary', trigger: 'on_turn_start', cd: '常驻', classRestriction: 'warrior' },
  { id: 'relic_iron_heart', name: '铁壁之心', description: '护甲≥20时获得护甲额外+50%', rarity: 'uncommon', trigger: 'on_play', cd: '每次触发', classRestriction: 'warrior' },
  { id: 'relic_blood_drum', name: '血怒战鼓', description: '每次搏命后本回合下次出牌所有骰子基础伤害+2', rarity: 'common', trigger: 'on_reroll', cd: '每次触发', classRestriction: 'warrior' },
];

// ============================================================
// 法师专属遗物（10件）
// ============================================================

export const MAGE_RELICS_V05: RelicV05Def[] = [
  { id: 'relic_mage_starter', name: '星界棱镜', description: '吟唱第1回合保留上限从3提升至4', rarity: 'common', trigger: 'on_turn_start', cd: '常驻', classRestriction: 'mage' },
  { id: 'relic_time_dilation', name: '时间膨胀', description: '吟唱保留上限递增翻倍（3→5→6）', rarity: 'rare', trigger: 'on_turn_start', cd: '常驻', classRestriction: 'mage' },
  { id: 'relic_elem_cycle', name: '元素轮回', description: '元素骰子保留时不锁定元素，每回合重新随机', rarity: 'uncommon', trigger: 'on_turn_start', cd: '常驻', classRestriction: 'mage' },
  { id: 'relic_barrier_echo', name: '屏障回响', description: '奥术屏障被击破时对攻击者造成屏障值50%的伤害', rarity: 'uncommon', trigger: 'on_hit', cd: '每次触发', classRestriction: 'mage' },
  { id: 'relic_chant_mastery', name: '吟唱大师', description: '吟唱3回合后下次出牌伤害额外+50%', rarity: 'rare', trigger: 'on_chant_end', cd: '每次触发', classRestriction: 'mage' },
  { id: 'relic_elem_convergence', name: '元素汇聚', description: '出牌时手牌中≥3颗同元素骰子，该元素效果×2', rarity: 'rare', trigger: 'on_play', cd: '每次触发', classRestriction: 'mage' },
  { id: 'relic_arcane_overflow', name: '奥术溢出', description: '出牌时手牌≥5颗，伤害+25%', rarity: 'uncommon', trigger: 'on_play', cd: '每次触发', classRestriction: 'mage' },
  { id: 'relic_disruption_ward', name: '法脉护盾', description: '法脉紊乱易伤上限从6层降至4层', rarity: 'legendary', trigger: 'on_turn_start', cd: '常驻', classRestriction: 'mage' },
  { id: 'relic_meteor_shard', name: '陨星碎片', description: '禁咒·陨星的吟唱需求从2回合降至1回合', rarity: 'legendary', trigger: 'on_play', cd: '常驻', classRestriction: 'mage' },
  { id: 'relic_mana_crystal', name: '法力水晶', description: '每场战斗开始时获得1颗额外的蓄能水晶到手牌', rarity: 'common', trigger: 'on_battle_start', cd: '每次触发', classRestriction: 'mage' },
];

// ============================================================
// 盗贼专属遗物（10件）
// ============================================================

export const ROGUE_RELICS_V05: RelicV05Def[] = [
  { id: 'relic_rogue_starter', name: '暗影匕首', description: '第2次出牌的连击加成从+20%提升至+30%', rarity: 'common', trigger: 'on_play', cd: '常驻', classRestriction: 'rogue' },
  { id: 'relic_shadow_cloak', name: '暗影斗篷', description: '手牌中有暗影残骰时受到的伤害-15%', rarity: 'uncommon', trigger: 'on_hit', cd: '常驻', classRestriction: 'rogue' },
  { id: 'relic_combo_counter', name: '连击计数器', description: '连续3次连击后获得1次额外出牌机会', rarity: 'rare', trigger: 'on_play', cd: '每次触发', classRestriction: 'rogue' },
  { id: 'relic_poison_mastery', name: '剧毒精通', description: '施加的毒层+50%（向上取整）', rarity: 'uncommon', trigger: 'on_play', cd: '常驻', classRestriction: 'rogue' },
  { id: 'relic_shadow_reserve', name: '暗影储备', description: '回合结束时暗影残骰不消失（保留到下回合）', rarity: 'rare', trigger: 'on_turn_start', cd: '常驻', classRestriction: 'rogue' },
  { id: 'relic_blade_dance', name: '刃舞', description: '每回合第3次出牌伤害+60%', rarity: 'rare', trigger: 'on_play', cd: '每次触发', classRestriction: 'rogue' },
  { id: 'relic_venom_sac', name: '毒囊', description: '每场战斗开始时对全体敌人施加3层毒', rarity: 'common', trigger: 'on_battle_start', cd: '每次触发', classRestriction: 'rogue' },
  { id: 'relic_shadow_step', name: '暗影步', description: '消耗暗影残骰时回复2HP', rarity: 'uncommon', trigger: 'on_play', cd: '每次触发', classRestriction: 'rogue' },
  { id: 'relic_death_mark', name: '死亡印记', description: '目标毒层≥10时，出牌伤害+40%', rarity: 'legendary', trigger: 'on_play', cd: '每次触发', classRestriction: 'rogue' },
  { id: 'relic_phantom_blade', name: '幻影之刃', description: '消耗暗影残骰时，每颗额外造成残骰点数的基础伤害', rarity: 'legendary', trigger: 'on_play', cd: '每次触发', classRestriction: 'rogue' },
];

// ============================================================
// 汇总导出
// ============================================================

/** 全部 v0.5 遗物（80件） */
export const ALL_RELICS_V05: RelicV05Def[] = [
  ...COMMON_RELICS_V05,
  ...WARRIOR_RELICS_V05,
  ...MAGE_RELICS_V05,
  ...ROGUE_RELICS_V05,
];

/** 按职业获取专属遗物池 */
export function getClassRelics(classId: string): RelicV05Def[] {
  switch (classId) {
    case 'warrior': return WARRIOR_RELICS_V05;
    case 'mage': return MAGE_RELICS_V05;
    case 'rogue': return ROGUE_RELICS_V05;
    default: return [];
  }
}

/** 获取通用遗物池 */
export function getCommonRelics(): RelicV05Def[] {
  return COMMON_RELICS_V05;
}
