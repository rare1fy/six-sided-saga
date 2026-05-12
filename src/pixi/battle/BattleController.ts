/**
 * BattleController - PixiJS Battle State Controller
 *
 * 替代 React useBattleState + useBattleLifecycle + useBattleCombat
 * 直接复用 src/logic/ 层的纯函数
 *
 * 职责
 *  1. 持有 GameState / dice / enemies 等运行时状
 *  2. 提供 setGame / setDice / setEnemies 等状态更新方
 *  3. 暴露 playHand / reroll / endTurn 等战斗动
 *  4. 产出事件流（浮动文字、音效、屏幕震动）供渲染层消费
 */
import type { GameState, Die, Enemy } from '../../types/game';
import { createInitialGameState } from '../../logic/gameInit';
import { buildBattleGameState } from '../../logic/battleInit';
import { getDiceDef, rollDiceDef } from '../../data/dice';
import { drawFromBag, initDiceBag } from '../../data/diceBag';
import { getEnemiesForNode } from '../../data/enemies';
import { buildRelicContext } from '../../engine/buildRelicContext';
import { sumPassiveRelicValue, hasFatalProtection } from '../../engine/relicQueries';
import { checkHands } from '../../utils/handEvaluator';
import { applyDiceSpecialEffects } from '../../logic/diceEffects';
import { CHAPTER_CONFIG } from '../../config';
import { executeEnemyTurn, type EnemyAICallbacks } from '../../logic/enemyAI';
import { triggerHourglass } from '../../engine/relicUpdates';
import type { MapNode, BattleWave } from '../../types/game';

// ============================================================
// 事件类型（渲染层消费
// ============================================================
export interface BattleEvent {
  type: 'floatingText' | 'toast' | 'sound' | 'screenShake' | 'enemyEffect' | 'playerEffect' | 'log';
  data: any;
}

// ============================================================
// 控制
// ============================================================
export class BattleController {
  game: GameState;
  dice: Die[] = [];
  enemies: Enemy[] = [];
  rerollCount = 0;

  /** 事件队列，渲染层每帧 drain */
  events: BattleEvent[] = [];

  /** 状态变更回渲染层监*/
  onChange: (() => void) | null = null;

  private _gameRef: { current: GameState };

  constructor(game?: GameState) {
    this.game = game || createInitialGameState('warrior');
    this._gameRef = { current: this.game };
  }

  // ==================== 状态更新原====================
  // 这些方法的签名兼React.Dispatch<SetStateAction<T>>

  setGame = (updater: GameState | ((prev: GameState) => GameState)) => {
    if (typeof updater === 'function') {
      this.game = updater(this.game);
    } else {
      this.game = updater;
    }
    this._gameRef.current = this.game;
    this.onChange?.();
  };

  setDice = (updater: Die[] | ((prev: Die[]) => Die[])) => {
    if (typeof updater === 'function') {
      this.dice = updater(this.dice);
    } else {
      this.dice = updater;
    }
    this.onChange?.();
  };

  setEnemies = (updater: Enemy[] | ((prev: Enemy[]) => Enemy[])) => {
    if (typeof updater === 'function') {
      this.enemies = updater(this.enemies);
    } else {
      this.enemies = updater;
    }
    this.onChange?.();
  };

  // ==================== 事件发射 ====================

  addFloatingText = (text: string, color: string = '', _icon?: any, target: string = 'enemy') => {
    this.events.push({ type: 'floatingText', data: { text, color, target } });
  };

  addToast = (msg: string, _type?: string) => {
    this.events.push({ type: 'toast', data: { msg } });
  };

  addLog = (msg: string) => {
    this.events.push({ type: 'log', data: { msg } });
    this.setGame(prev => ({ ...prev, logs: [...prev.logs.slice(-49), msg] }));
  };

  playSound = (id: string) => {
    this.events.push({ type: 'sound', data: { id } });
  };

  setScreenShake = (_v: boolean) => {
    this.events.push({ type: 'screenShake', data: {} });
  };

  // ==================== 战斗流程 ====================

  /** 开始战斗（进入战斗节点*/
  startBattle(node: MapNode) {
    const chapterScale = CHAPTER_CONFIG.chapterScaling[
      Math.min(this.game.chapter - 1, CHAPTER_CONFIG.chapterScaling.length - 1)
    ];
    const waves = getEnemiesForNode(
      node, node.depth,
      this.game.enemyHpMultiplier * chapterScale.hpMult,
      chapterScale.dmgMult,
      this.game.chapter,
    );
    const firstWave = waves[0]?.enemies || [];
    this.enemies = firstWave;

    // 构建战斗初始状
    const battleGame = buildBattleGameState({
      prev: this.game,
      node,
      waves,
      firstWave,
      battleChallenge: null as any, // 简化：暂不生成挑战
    });
    this.game = battleGame;
    this._gameRef.current = this.game;

    // 自动选中第一个敌
    if (firstWave.length > 0 && !this.game.targetEnemyUid) {
      this.game = { ...this.game, targetEnemyUid: firstWave[0].uid };
    }

    // 初始抽骰
    this.rollAllDice();
  }

  /** 抽骰子（回合开始） */
  rollAllDice() {
    const g = this.game;
    const drawCount = g.drawCount + (g.challengeDrawBonus || 0) +
      (g.playerClass === 'mage' ? (g.chargeStacks || 0) : 0);
    const maxHand = 6;
    const existing = this.dice.filter(d => !d.spent);
    const slotsAvailable = Math.max(0, maxHand - existing.length);
    const toDraw = Math.min(drawCount, slotsAvailable);

    let bag = [...g.diceBag];
    let discard = [...g.discardPile];
    const drawn: Die[] = [];

    for (let i = 0; i < toDraw; i++) {
      if (bag.length === 0) {
        // 洗牌
        bag = [...discard].sort(() => Math.random() - 0.5);
        discard = [];
      }
      if (bag.length === 0) break;
      const defId = bag.shift()!;
      const def = getDiceDef(defId);
      const value = rollDiceDef(def);
      drawn.push({
        id: Date.now() + i,
        diceDefId: defId,
        value,
        element: def.element || 'normal',
        selected: false,
        spent: false,
      } as Die);
    }

    this.dice = [...existing, ...drawn];
    this.game = {
      ...this.game,
      diceBag: bag,
      discardPile: discard,
      freeRerollsLeft: g.freeRerollsPerTurn + sumPassiveRelicValue(g.relics, 'extraReroll'),
      playsLeft: g.maxPlays + sumPassiveRelicValue(g.relics, 'extraPlay'),
      isEnemyTurn: false,
      battleTurn: (g.battleTurn || 0) + 1,
    };
    this._gameRef.current = this.game;
    this.rerollCount = 0;
    this.onChange?.();
  }

  /** 切换骰子选中 */
  toggleSelect(dieId: number) {
    this.dice = this.dice.map(d =>
      d.id === dieId ? { ...d, selected: !d.selected } : d
    );
    this.onChange?.();
  }

  /** 重投选中的骰*/
  reroll() {
    const g = this.game;
    const freeRerolls = g.freeRerollsLeft + (g.boomerangFreeReroll || 0) + (g.comboFreeReroll || 0);

    if (freeRerolls > 0) {
      // 免费重投
      this.setGame(prev => ({ ...prev, freeRerollsLeft: Math.max(0, prev.freeRerollsLeft - 1) }));
    } else {
      // 卖血重投 (HP -3)
      const cost = 3;
      if (g.hp <= cost) {
        this.addToast('生命不足，无法卖血重投');
        return;
      }
      this.setGame(prev => ({
        ...prev,
        hp: prev.hp - cost,
        bloodRerollCount: (prev.bloodRerollCount || 0) + 1,
      }));
      this.addFloatingText(`-${cost}`, 'text-red-400', undefined, 'player');
    }

    // 重投选中骰子
    this.dice = this.dice.map(d => {
      if (!d.selected || d.spent) return d;
      const def = getDiceDef(d.diceDefId);
      return { ...d, value: rollDiceDef(def), selected: false };
    });

    this.rerollCount++;
    this.setGame(prev => ({ ...prev, rerollsThisWave: (prev.rerollsThisWave || 0) + 1 }));
    this.playSound('reroll');
    this.onChange?.();
  }

  /** 出牌 */
  async playHand() {
    const selected = this.dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0) return;
    if (this.game.playsLeft <= 0) return;

    // 评估牌型
    const hand = checkHands(selected);
    const bestHand = hand.bestHand || '高牌';

    // 计算伤害（简化版 后续可接入完settlement
    let damage = 0;
    for (const d of selected) damage += d.value;
    if (selected.length >= 3) damage = Math.floor(damage * 1.5);
    else if (selected.length >= 2) damage = Math.floor(damage * 1.2);
    damage = Math.max(1, damage);

    // 应用伤害到目标敌
    const targetUid = this.game.targetEnemyUid;
    const targetIdx = targetUid
      ? this.enemies.findIndex(e => e.uid === targetUid)
      : 0;

    if (targetIdx >= 0 && this.enemies[targetIdx]) {
      const newEnemies = [...this.enemies];
      newEnemies[targetIdx] = {
        ...newEnemies[targetIdx],
        hp: Math.max(0, newEnemies[targetIdx].hp - damage),
      };
      // 移除死亡敌人
      this.enemies = newEnemies.filter(e => e.hp > 0);
    }

    // 标记骰子已使
    this.dice = this.dice.map(d =>
      d.selected ? { ...d, spent: true, selected: false } : d
    );

    // 更新游戏状
    this.setGame(prev => ({
      ...prev,
      playsLeft: prev.playsLeft - 1,
      playsThisWave: (prev.playsThisWave || 0) + 1,
    }));

    // 伤害飘字
    this.addFloatingText(`-${damage}`, 'text-red-400', undefined, 'enemy');
    this.playSound('attack');

    // 检查胜
    if (this.enemies.length === 0) {
      this.handleVictory();
      return;
    }

    // 如果出牌次数用完，自动结束回
    if (this.game.playsLeft <= 0) {
      await this.endTurn();
    }

    this.onChange?.();
  }

  /** 结束回合（调用原版敌人AI*/
  async endTurn() {
    if (this.enemies.length === 0 || this.game.isEnemyTurn) return;

    // 构建 AI 回调接口
    const cb: EnemyAICallbacks = {
      setGame: this.setGame,
      setEnemies: this.setEnemies,
      setEnemyEffects: () => {},
      setDyingEnemies: () => {},
      setEnemyEffectForUid: () => {},
      enemyPreAction: async () => false,
      addLog: this.addLog,
      addFloatingText: this.addFloatingText as any,
      addToast: this.addToast as any,
      playSound: this.playSound,
      setScreenShake: this.setScreenShake as any,
      setPlayerEffect: () => {},
      showEnemyQuote: () => {},
      scheduleDelayedQuote: () => {},
      getEnemyQuotes: () => undefined,
      pickQuote: () => null,
      setRerollCount: (v) => { this.rerollCount = typeof v === 'function' ? v(this.rerollCount) : v; },
      setWaveAnnouncement: () => {},
      setDice: (v) => { this.dice = v; },
      rollAllDice: () => this.rollAllDice(),
      buildRelicContext,
      hasFatalProtection,
      triggerHourglass,
      handleVictory: () => this.handleVictory(),
      gameRef: this._gameRef,
      enemiesRef: { current: this.enemies },
    };

    try {
      const result = await executeEnemyTurn(
        this.game, this.enemies, this.dice, this.rerollCount, cb
      );

      // 检查死
      if (this.game.hp <= 0) {
        this.handleDefeat();
        return;
      }

      // 波次转换AI 内部处理
      if (!result.waveTransitioned) {
        // 弃骰 + 抽新
        const discarded = this.dice.filter(d => !d.spent).map(d => d.diceDefId);
        this.setGame(prev => ({
          ...prev,
          discardPile: [...prev.discardPile, ...discarded],
        }));
        this.dice = [];
        await this.delay(200);
        this.rollAllDice();
      }
    } catch (e) {
      // 如果原版AI有问题（缺少某些依赖），fallback到简化版
      console.warn('[BattleController] enemyAI error, using fallback:', e);
      await this.endTurnFallback();
    }
  }

  /** 简化版敌人回合（fallback*/
  private async endTurnFallback() {
    this.setGame(prev => ({ ...prev, isEnemyTurn: true }));
    this.onChange?.();
    await this.delay(600);

    let totalDmg = 0;
    for (const enemy of this.enemies) {
      totalDmg += enemy.attackDmg || 3;
    }

    let armor = this.game.armor;
    let hp = this.game.hp;
    if (armor > 0) {
      const absorbed = Math.min(armor, totalDmg);
      armor -= absorbed;
      totalDmg -= absorbed;
    }
    hp -= totalDmg;

    this.setGame(prev => ({ ...prev, hp: Math.max(0, hp), armor, isEnemyTurn: false }));

    if (totalDmg > 0) {
      this.addFloatingText(`-${totalDmg}`, 'text-red-400', undefined, 'player');
      this.setScreenShake(true);
    }

    if (hp <= 0) { this.handleDefeat(); return; }

    const discarded = this.dice.filter(d => !d.spent).map(d => d.diceDefId);
    this.setGame(prev => ({ ...prev, discardPile: [...prev.discardPile, ...discarded] }));
    this.dice = [];
    await this.delay(300);
    this.rollAllDice();
  }

  // ==================== 战斗结果 ====================

  /** 场景切换回调（由 BattleScenePixi 设置*/
  onSceneSwitch: ((scene: string) => void) | null = null;

  private handleVictory() {
    // 检查是否有下一
    const nextWaveIdx = this.game.currentWaveIndex + 1;
    if (nextWaveIdx < this.game.battleWaves.length) {
      // 下一
      const nextWave = this.game.battleWaves[nextWaveIdx];
      this.enemies = nextWave.enemies;
      this.setGame(prev => ({
        ...prev,
        currentWaveIndex: nextWaveIdx,
        targetEnemyUid: nextWave.enemies[0]?.uid || null,
        playsThisWave: 0,
        rerollsThisWave: 0,
      }));
      this.addFloatingText(`{nextWaveIdx + 1}`, 'text-yellow-300', undefined, 'player');
      this.onChange?.();
      return;
    }

    // 完全胜利
    this.addToast('战斗胜利!');
    this.setGame(prev => ({ ...prev, phase: 'map' }));
    this.onSceneSwitch?.('map');
    this.onChange?.();
  }

  private handleDefeat() {
    this.addToast('战败...');
    this.setGame(prev => ({ ...prev, phase: 'gameover' }));
    this.onSceneSwitch?.('start');
    this.onChange?.();
  }

  // ==================== 工具 ====================

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  /** 获取当前手牌的牌*/
  getCurrentHand(): { bestHand: string } {
    const selected = this.dice.filter(d => d.selected && !d.spent);
    if (selected.length === 0) return { bestHand: '' };
    const result = checkHands(selected);
    return { bestHand: result.bestHand || '高牌' };
  }

  /** 获取目标敌人 */
  getTargetEnemy(): Enemy | null {
    const uid = this.game.targetEnemyUid;
    return uid ? this.enemies.find(e => e.uid === uid) || null : this.enemies[0] || null;
  }

  /** drain 事件队列 */
  drainEvents(): BattleEvent[] {
    const evts = [...this.events];
    this.events = [];
    return evts;
  }
}

