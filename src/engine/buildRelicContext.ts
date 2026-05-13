/**
 * buildRelicContext.ts — 统一构建 RelicContext
 *
 * 核心目标：永远不会再遗漏 RelicContext 字段。
 * 所有 RelicContext 构建点统一走这个函数，新增字段只改这一处。
 *
 * SRP: 只负责"从游戏状态构建上下文"，不负责触发效果。
 */

import type { RelicContext, GameState, Enemy } from '../types/game';
import { getDiceDef } from '../data/dice';
import { getFloorsCleared } from './relicQueries';

/** 遗物上下文构建参数 */
export interface BuildRelicContextParams {
  game: GameState;
  dice: { value: number; diceDefId: string; spent: boolean }[];
  targetEnemy: Enemy | null;
  rerollsThisTurn: number;
  /** 出牌相关 */
  handType?: string;
  selectedDice?: { value: number; diceDefId: string; spent: boolean }[];
  pointSum?: number;
  /** 是否出了牌（用于 didNotPlay 判断） */
  hasPlayedThisTurn: boolean;
  /** 溢出伤害（on_kill 触发时传入） */
  overkillDamage?: number;
  /** 本次重投是否为卖血重投（on_reroll 触发时传入） */
  isBloodReroll?: boolean;
  /** v0.5: 本次造成的伤害 */
  damageDealt?: number;
  /** v0.5: 被击破的屏障值 */
  shieldBroken?: number;
  /** v0.5: 本次消耗的暗影残骰点数总和 */
  shadowDiceConsumedValue?: number;
}

/**
 * 统一构建 RelicContext
 *
 * 新增字段只需要改这一个地方，不用满项目搜 r.id。
 */
export const buildRelicContext = (params: BuildRelicContextParams): RelicContext => {
  const {
    game, dice, targetEnemy, rerollsThisTurn,
    handType, selectedDice, pointSum, hasPlayedThisTurn,
    overkillDamage, isBloodReroll, damageDealt, shieldBroken, shadowDiceConsumedValue,
  } = params;

  const selected = selectedDice || dice.filter(d => !d.spent);

  return {
    // 出牌信息
    handType,
    diceCount: selected.length,
    diceValues: selected.map(d => d.value),
    diceDefIds: selected.map(d => d.diceDefId),
    pointSum,

    // 战斗状态
    rerollsThisTurn,
    hpLostThisTurn: game.hpLostThisTurn || 0,
    hpLostThisBattle: game.hpLostThisBattle || 0,
    currentHp: game.hp,
    maxHp: game.maxHp,
    currentGold: game.souls,
    enemiesKilledThisBattle: game.enemiesKilledThisBattle || 0,
    overkillDamage,

    // 元素追踪
    elementsUsedThisBattle: new Set(game.elementsUsedThisBattle || []),

    // 特殊骰子追踪
    hasSplitDice: selected.some(d => getDiceDef(d.diceDefId).id === 'split'),
    splitDiceValue: selected.find(d => getDiceDef(d.diceDefId).id === 'split')?.value || 0,
    hasLoadedDice: selected.some(d => getDiceDef(d.diceDefId).id === 'heavy'),
    loadedDiceCount: selected.filter(d => getDiceDef(d.diceDefId).id === 'heavy').length,
    hasSpecialDice: selected.some(d => !['standard', 'heavy'].includes(getDiceDef(d.diceDefId).id)),
    cursedDiceInHand: dice.filter(d => getDiceDef(d.diceDefId).isCursed).length,
    crackedDiceInHand: dice.filter(d => getDiceDef(d.diceDefId).isCracked).length,

    // 连续普攻追踪
    consecutiveNormalAttacks: game.consecutiveNormalAttacks || 0,

    // 免费重Roll追踪
    freeRerollsUsed: Math.max(0, (game.freeRerollsPerTurn || 0) - (game.freeRerollsLeft || 0)),
    selectedDiceCount: selected.length,

    // 地图进度
    currentDepth: game.map?.find(n => n.id === game.currentNodeId)?.depth || 0,
    floorsCleared: getFloorsCleared(game.relics),

    // P0-4 补全字段
    didNotPlay: !hasPlayedThisTurn,
    handSize: dice.filter(d => !d.spent).length,
    isComboPlay: (game.comboCount || 0) >= 1,
    targetPoisonStacks: targetEnemy?.statuses?.find(s => s.type === 'poison')?.value || 0,
    playsThisTurn: (game.comboCount || 0) + 1,

    // 重投类型标记
    isBloodReroll,

    // v0.5 遗物效果需要的额外上下文
    diceIds: selected.map(d => d.diceDefId),
    uniqueDiceTypes: new Set(dice.map(d => d.diceDefId)).size,
    hpPercent: game.maxHp > 0 ? game.hp / game.maxHp : 1,
    targetHpPercent: targetEnemy ? (targetEnemy.maxHp > 0 ? targetEnemy.hp / targetEnemy.maxHp : 1) : 1,
    consecutivePlayTurns: game.consecutivePlayTurns || 0,
    damageDealt: damageDealt || 0,
    currentArmor: game.armor || 0,
    cursedDiceCount: dice.filter(d => getDiceDef(d.diceDefId).isCursed || getDiceDef(d.diceDefId).isCracked).length,
    shieldBroken: shieldBroken || 0,
    sameElementCount: (() => {
      const elemCounts: Record<string, number> = {};
      selected.forEach(d => {
        const elem = getDiceDef(d.diceDefId).element;
        if (elem) elemCounts[elem] = (elemCounts[elem] || 0) + 1;
      });
      return Math.max(0, ...Object.values(elemCounts));
    })(),
    targetPoisonLayers: targetEnemy?.statuses?.find(s => s.type === 'poison')?.value || 0,
    hasShadowDie: selected.some(d => (d as any).isShadowRemnant),
    consecutiveCombo: game.comboCount || 0,
    shadowDiceConsumedValue: shadowDiceConsumedValue || 0,
  };
};
