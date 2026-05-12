/**
 * BattleScenePixi — 战斗界面 (PixiJS)
 *
 * 使用 BattleController 复用原版 logic 层，
 * 渲染层通过 onChange 回调重建 UI。
 * 集成 GlobalTopBar + 弹窗层
 */
import { Container } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import type { GameState } from '../../types/game';
import { BattleController } from '../battle/BattleController';
import { buildForestBg, type FireflyData } from '../battle/ForestBg';
import { buildEnemyStage, type EnemySpriteEntry } from '../battle/EnemyStage';
import { buildPlayerHud, createFloatingDamage } from '../battle/PlayerHud';
import { buildToast } from '../battle/Tooltip';
import { GlobalTopBar, type TopBarData } from '../ui/GlobalTopBar';
import { BattleEffectsLayer } from '../battle/BattleEffects';
import { SettingsPanel, type SettingsCallbacks } from '../ui/SettingsPanel';
import { LevelUpModal, type LevelUpOption } from '../ui/LevelUpModal';
import { BattleLogPanel, type LogEntry } from '../ui/BattleLogPanel';
import type { BattleGameState } from '../battle/types';
import { CHAPTER_CONFIG } from '../../config';
import { showDeathScreen, showVictoryScreen } from '../animation/SceneTransition';

export class BattleScene implements GameScene {
  container: Container;
  private gameApp!: GameApp;
  private ctrl!: BattleController;
  private time = 0;

  private bgLayer: Container | null = null;
  private enemyLayer: Container | null = null;
  private hudLayer: Container | null = null;
  private floatLayer: Container | null = null;
  private popupLayer: Container | null = null;
  private topBar: GlobalTopBar | null = null;
  private effects: BattleEffectsLayer | null = null;
  private settingsModal: SettingsPanel | null = null;
  private battleLog: BattleLogPanel | null = null;
  private logEntries: LogEntry[] = [];

  private fireflies: FireflyData[] = [];
  private enemyEntries: EnemySpriteEntry[] = [];
  private floatingDamages: { container: Container; update: (dt: number) => boolean }[] = [];
  private toasts: { container: Container; update: (dt: number) => boolean }[] = [];

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;

    this.ctrl = new BattleController(gameApp.game);
    this.ctrl.onChange = () => {
      this.gameApp.game = this.ctrl.game as any;
      this.rebuild();
    };
    this.ctrl.onSceneSwitch = (scene: string) => {
      if (scene === 'map') {
        this.gameApp.setGame((prev: any) => ({ ...prev, phase: 'map' }));
        this.gameApp.sceneManager.switchTo('map');
      } else if (scene === 'victory') {
        this.handleVictory();
      } else if (scene === 'gameover') {
        this.handleDefeat();
      } else {
        this.gameApp.sceneManager.switchTo(scene);
      }
    };

    if (this.ctrl.enemies.length === 0) {
      const testNode = {
        id: 'test', type: 'enemy' as const, depth: 0,
        connectedTo: [], completed: false,
      };
      this.ctrl.startBattle(testNode);
    }

    this.build();
  }

  onExit() {
    this.container.removeChildren();
    this.bgLayer = null;
    this.enemyLayer = null;
    this.hudLayer = null;
    this.floatLayer = null;
    this.popupLayer = null;
    this.topBar = null;
    this.effects = null;
    this.fireflies = [];
    this.enemyEntries = [];
    this.floatingDamages = [];
    this.toasts = [];
  }

  onGameStateChanged(_game: GameState) {}

  onTick = (ticker: any) => {
    const dt = typeof ticker === 'number' ? ticker * 0.016 : (ticker.deltaTime ?? ticker) * 0.016;
    this.time += dt;

    for (const entry of this.enemyEntries) {
      if (entry.sprite) {
        entry.container.y = entry.baseY + Math.sin(this.time * 2 + entry.idx * 1.2) * 3;
      }
    }

    for (const fly of this.fireflies) {
      fly.g.x = fly.baseX + Math.sin(this.time * fly.speed + fly.phase) * 15;
      fly.g.y = fly.baseY + Math.cos(this.time * fly.speed * 0.7 + fly.phase) * 10;
      fly.g.alpha = 0.3 + Math.sin(this.time * 1.5 + fly.phase) * 0.4;
    }

    // 粒子/特效层更新
    if (this.effects) this.effects.update(dt);

    this.floatingDamages = this.floatingDamages.filter(fd => {
      const done = fd.update(dt);
      if (done && this.floatLayer) this.floatLayer.removeChild(fd.container);
      return !done;
    });

    this.toasts = this.toasts.filter(t => {
      const done = t.update(dt);
      if (done && this.floatLayer) this.floatLayer.removeChild(t.container);
      return !done;
    });

    // 消费战斗事件
    const events = this.ctrl.drainEvents();
    for (const evt of events) {
      if (evt.type === 'floatingText') {
        const { text, target } = evt.data;
        const x = 360;
        const y = target === 'player' ? 800 : 300;
        const color = text.startsWith('-') ? 0xff4444 : 0x44ff44;
        this.spawnDamageNumber(text, x, y, color);
        // 写入日志
        const logType = text.startsWith('-') ? 'damage' : 'heal';
        this.logEntries.push({ text: `${target === 'player' ? '你' : '敌人'} ${text}`, type: logType as any });
        if (this.battleLog) this.battleLog.addEntry({ text: `${target === 'player' ? '你' : '敌人'} ${text}`, type: logType as any });
      } else if (evt.type === 'toast') {
        this.spawnToast(evt.data.msg);
        this.logEntries.push({ text: evt.data.msg, type: 'info' });
        if (this.battleLog) this.battleLog.addEntry({ text: evt.data.msg, type: 'info' });
      } else if (evt.type === 'screenShake') {
        if (this.effects) this.effects.screenShake(this.container);
      } else if (evt.type === 'log') {
        const entry: LogEntry = { text: evt.data.msg || evt.data.text || '', type: evt.data.logType || 'info' };
        this.logEntries.push(entry);
        if (this.battleLog) this.battleLog.addEntry(entry);
      } else if (evt.type === 'sound') {
        // 音效（playSfx 暂跳过）
      }
    }
  };

  private build() {
    this.container.removeChildren();
    this.floatingDamages = [];
    const game = this.makeBattleView();

    // 背景
    const isBoss = this.ctrl.enemies.some(e => (e as any).type === 'boss');
    const bgResult = buildForestBg(isBoss);
    this.bgLayer = bgResult.container;
    this.fireflies = bgResult.fireflies;
    this.container.addChild(this.bgLayer);

    // 敌人舞台
    const enemyResult = buildEnemyStage(this.gameApp, game);
    this.enemyLayer = enemyResult.container;
    this.enemyEntries = enemyResult.enemyEntries;
    this.container.addChild(this.enemyLayer);

    // 玩家 HUD
    const hudResult = buildPlayerHud(this.gameApp, game, () => this.rebuild(), this.ctrl);
    this.hudLayer = hudResult.container;
    this.container.addChild(this.hudLayer);

    // 浮动层
    this.floatLayer = new Container();
    this.container.addChild(this.floatLayer);

    // 特效层
    this.effects = new BattleEffectsLayer();
    this.container.addChild(this.effects.container);

    // 弹窗层
    this.popupLayer = new Container();
    this.container.addChild(this.popupLayer);

    // 顶部状态栏
    const chapterNames = (CHAPTER_CONFIG as any).chapterNames || ['幽暗森林'];
    const chapterIdx = Math.min((game.chapter || 1) - 1, chapterNames.length - 1);
    const topBarData: TopBarData = {
      soulCrystals: (game as any).blackMarketQuota || 0,
      soulMultiplier: (game as any).soulCrystalMultiplier || 1,
      gold: game.souls ?? (game as any).gold ?? 0,
      totalDamage: (game as any).stats?.totalDamageDealt || 0,
      chapterName: chapterNames[chapterIdx],
    };
    this.topBar = new GlobalTopBar(topBarData, () => {
      this.openSettings();
    });
    this.container.addChild(this.topBar.container);
  }

  private openSettings() {
    if (this.settingsModal) return;
    this.settingsModal = new SettingsPanel({
      onOpenLog: () => {
        // TODO: 打开战斗日志弹窗
      },
      onClose: () => {
        if (this.settingsModal) {
          this.settingsModal.destroy();
          this.settingsModal = null;
        }
      },
    });
    this.container.addChild(this.settingsModal.container);
    this.settingsModal.open();
  }

  private handleVictory() {
    const game = this.gameApp.game as any;
    const stats = {
      totalDamage: game.stats?.totalDamageDealt || 0,
      enemiesKilled: game.stats?.enemiesKilled || 0,
    };
    showVictoryScreen(this.container, stats, () => {
      // 胜利后给升级选项
      this.showLevelUp();
    });
  }

  private handleDefeat() {
    const game = this.gameApp.game as any;
    const stats = {
      totalDamage: game.stats?.totalDamageDealt || 0,
      enemiesKilled: game.stats?.enemiesKilled || 0,
      floor: game.currentFloor || 1,
    };
    showDeathScreen(this.container, stats, () => {
      this.gameApp.switchPhase('start');
    });
  }

  private showLevelUp() {
    const options: LevelUpOption[] = [
      { id: 'hp', icon: '\u2764', title: 'HP +20', description: '增加最大生命值', rarity: 'common' },
      { id: 'reroll', icon: '\ud83d\udd04', title: '重投 +1', description: '每回合多一次免费重投', rarity: 'rare' },
      { id: 'draw', icon: '\ud83c\udfb2', title: '抽骰 +1', description: '每回合多抽一颗骰子', rarity: 'epic' },
    ];
    const modal = new LevelUpModal(options, (id) => {
      let g = { ...this.gameApp.game } as any;
      if (id === 'hp') { g.maxHp += 20; g.hp = Math.min(g.hp + 20, g.maxHp); }
      else if (id === 'reroll') { g.freeRerolls = (g.freeRerolls || 0) + 1; }
      else if (id === 'draw') { g.drawCount = (g.drawCount || 3) + 1; }
      g.phase = 'map';
      this.gameApp.setGame(g);
      modal.destroy();
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(modal.container);
    modal.open();
  }

  private rebuild() { this.build(); }

  private makeBattleView(): BattleGameState {
    return {
      ...this.ctrl.game,
      dice: this.ctrl.dice,
      enemies: this.ctrl.enemies,
    } as unknown as BattleGameState;
  }

  private spawnDamageNumber(text: string, x: number, y: number, color: number) {
    if (!this.floatLayer) return;
    const fd = createFloatingDamage(text, x, y, color);
    this.floatLayer.addChild(fd.container);
    this.floatingDamages.push(fd);
  }

  private spawnToast(msg: string) {
    if (!this.floatLayer) return;
    const t = buildToast(msg);
    this.floatLayer.addChild(t.container);
    this.toasts.push(t);
  }
}
