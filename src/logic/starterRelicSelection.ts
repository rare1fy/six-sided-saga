/**
 * starterRelicSelection.ts - 开局三选一遗物系统（v0.5 新增）
 *
 * 设计文档：板块05 §一/§三
 * 进入第一个战斗节点前，从当前职业的10个专属遗物中随机抽3个展示。
 * 玩家付出HP/maxHP代价选择1个（或跳过）。
 *
 * 规则：
 * - 选择池：当前职业的10个专属遗物
 * - 代价：common=5, uncommon=10, rare=15, legendary=20
 * - 跳过：不付代价
 * - 选中的遗物计入已拥有列表，后续不重复出现
 */

import type { StarterRelicChoice, StarterRelicSelection } from '../types/relics';
import type { RelicRarity } from '../types/relics';

/** 代价表 */
const COST_BY_RARITY: Record<RelicRarity, number> = {
  common: 5,
  uncommon: 10,
  rare: 15,
  legendary: 20,
};

/**
 * 生成开局三选一选项
 * @param playerClass 玩家职业
 * @param classRelicPool 该职业的专属遗物池（10个）
 * @param ownedRelicIds 已拥有的遗物ID列表
 * @returns 三选一选项
 */
export function generateStarterRelicChoices(
  classRelicPool: Array<{ id: string; rarity: RelicRarity }>,
  ownedRelicIds: string[],
): StarterRelicSelection {
  // 过滤已拥有的
  const available = classRelicPool.filter(r => !ownedRelicIds.includes(r.id));

  // 随机抽3个
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);

  const choices: StarterRelicChoice[] = picked.map(r => ({
    relicId: r.id,
    hpCost: COST_BY_RARITY[r.rarity],
    maxHpCost: COST_BY_RARITY[r.rarity],
  }));

  return {
    choices,
    selectedIndex: null,
  };
}

/**
 * 应用开局遗物选择的代价
 * @param currentHp 当前HP
 * @param currentMaxHp 当前最大HP
 * @param choice 选择的遗物
 * @returns [newHp, newMaxHp]
 */
export function applyStarterRelicCost(
  currentHp: number,
  currentMaxHp: number,
  choice: StarterRelicChoice,
): [number, number] {
  const newMaxHp = currentMaxHp - choice.maxHpCost;
  const newHp = Math.max(1, currentHp - choice.hpCost);
  return [newHp, newMaxHp];
}
