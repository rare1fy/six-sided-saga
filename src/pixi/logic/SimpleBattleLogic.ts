/**
 * SimpleBattleLogic — 简化版战斗逻辑
 * 
 * 不依赖 React 组件，纯 TypeScript 计算。
 * 后续接入完整 logic/ 层时替换。
 * 
 * 基本循环：选骰子 → 出牌 → 算伤害 → 扣血 → 敌人反击 → 下回合抽骰
 */
import type { GameState, Die, Enemy } from '../../types/game';

/** 计算出牌伤害（简化版） */
export function calcSimpleDamage(selectedDice: Die[], game: GameState): number {
  let base = 0;
  for (const d of selectedDice) {
    base += (d.value || 0);
  }
  // 多选加成（牌型）
  if (selectedDice.length >= 3) base = Math.floor(base * 1.5);
  else if (selectedDice.length >= 2) base = Math.floor(base * 1.2);
  return Math.max(1, base);
}

/** 执行出牌（返回新 GameState） */
export function playHandSimple(game: GameState, targetIdx: number = 0): GameState {
  const selected = game.dice.filter(d => d.selected && !d.spent);
  if (selected.length === 0) return game;

  const damage = calcSimpleDamage(selected, game);
  const newEnemies = [...game.enemies];
  
  if (newEnemies[targetIdx]) {
    newEnemies[targetIdx] = {
      ...newEnemies[targetIdx],
      hp: Math.max(0, newEnemies[targetIdx].hp - damage),
    };
  }

  // 标记骰子为已使用
  const newDice = game.dice.map(d => 
    d.selected ? { ...d, spent: true, selected: false } : d
  );

  const playsLeft = (game.playsLeft ?? 1) - 1;

  return {
    ...game,
    dice: newDice,
    enemies: newEnemies.filter(e => e.hp > 0), // 移除死亡敌人
    playsLeft,
    lastDamage: damage,
  };
}

/** 敌人回合（简化：每只活着的敌人打一次） */
export function enemyTurnSimple(game: GameState): GameState {
  let hp = game.hp;
  let armor = game.armor;

  for (const enemy of game.enemies) {
    const atk = enemy.attack || 3;
    if (armor > 0) {
      const absorbed = Math.min(armor, atk);
      armor -= absorbed;
      hp -= (atk - absorbed);
    } else {
      hp -= atk;
    }
  }

  return { ...game, hp: Math.max(0, hp), armor };
}

/** 抽新骰子（简化：随机1-6） */
export function drawDiceSimple(game: GameState): GameState {
  const drawCount = game.drawCount || 3;
  const newDice: Die[] = Array.from({ length: drawCount }, (_, i) => ({
    id: `die_${Date.now()}_${i}`,
    defId: 'standard',
    value: Math.floor(Math.random() * 6) + 1,
    selected: false,
    spent: false,
    rolling: false,
    locked: false,
    playing: false,
  }));
  return {
    ...game,
    dice: newDice,
    playsLeft: game.maxPlays || 1,
    freeRerollsLeft: game.freeRerollsPerTurn || 1,
    battleTurn: (game.battleTurn || 1) + 1,
    isEnemyTurn: false,
  };
}

/** 检查战斗结果 */
export function checkBattleResult(game: GameState): 'ongoing' | 'victory' | 'defeat' {
  if (game.hp <= 0) return 'defeat';
  if (game.enemies.length === 0) return 'victory';
  return 'ongoing';
}

/** 生成简单测试敌人 */
export function createTestEnemies(chapter: number = 1): Enemy[] {
  const names = ['食尸鬼', '剧毒蛛母', '腐化树人', '暗蝼蛛群'];
  const name = names[Math.floor(Math.random() * names.length)];
  const hp = 20 + chapter * 10 + Math.floor(Math.random() * 10);
  return [{
    id: `enemy_${Date.now()}`,
    name,
    hp,
    maxHp: hp,
    attack: 3 + chapter,
    armor: 0,
    intent: 'attack' as any,
    type: 'normal' as any,
    statusEffects: [],
    range: 'melee' as any,
    archetype: 'warrior' as any,
  }] as any;
}
