/**
 * GameApp — 纯 PixiJS 游戏主控制器
 * 
 * 不依赖 React/DOM，可运行在微信小游戏 Canvas 环境
 * 使用场景管理器模式替代 React 路由
 */
import * as PIXI from 'pixi.js';

// 微信小游戏全局类型声明
declare const wx: any;
declare const GameGlobal: any;
// @pixi/layout 依赖 Yoga WASM，微信小游戏不支持，暂不使用
// import '@pixi/layout';
import type { PixiBattleState } from './types/PixiBattleState';
type GameState = PixiBattleState;
import { createInitialGameState } from '../logic/gameInit';
import { SceneManager } from './SceneManager';
import { StartScene } from './scenes/StartScene';
import { TweenManager } from './animation/Tween';
import { initAssetProvider } from './AssetProvider';

export class GameApp {
  app: PIXI.Application;
  sceneManager: SceneManager;
  game: GameState;
  /** 设计宽度（固定 720） */
  readonly designW = 720;
  /** 设计高度（根据窗口比例动态计算） */
  designH = 1280;
  private _setGame: (updater: GameState | ((prev: GameState) => GameState)) => void;

  constructor() {
    this.app = new PIXI.Application();
    this.game = createInitialGameState('warrior');
    this.sceneManager = new SceneManager(this);
    this._setGame = (updater) => {
      if (typeof updater === 'function') {
        this.game = updater(this.game);
      } else {
        this.game = updater;
      }
      this.sceneManager.onGameStateChanged(this.game);
    };
  }

  get setGame() { return this._setGame; }

  async init(canvas?: HTMLCanvasElement) {
    // 微信小游戏环境：使用全局 canvas；浏览器：传入或自动创建
    const gameCanvas = canvas
      || (typeof GameGlobal !== 'undefined' && (GameGlobal as any).canvas)
      || undefined;

    const initOpts: Partial<PIXI.IApplicationOptions> = {
      width: 720,
      height: 1280,
      backgroundColor: 0x0a0a0a,
      resolution: typeof wx !== 'undefined' ? (wx as any).getSystemInfoSync().pixelRatio : Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
      antialias: false,
      forceCanvas: false,
    };

    // 传入 canvas（关键！避免 PixiJS 调用 document.getElementById）
    if (gameCanvas) {
      initOpts.view = gameCanvas;
    }

    // v7: Application 构造函数直接接受选项，不需要 async init
    this.app = new PIXI.Application(initOpts);

    // 浏览器环境：挂载到 DOM
    if (!gameCanvas && typeof document !== 'undefined') {
      const root = document.getElementById('root');
      if (root) root.appendChild(this.app.view as HTMLCanvasElement);
    }

    // 适配屏幕
    this.resize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.resize());
    }

    // Bind TweenManager to app ticker for animation system
    TweenManager.bind(this.app.ticker);

    // Initialize unified asset provider
    initAssetProvider(this.app);

    // 从开始界面进入
    this.sceneManager.switchTo('start');
  }

  resize() {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // 限制最大渲染宽度为 720（设计宽度），超过不再放大
    const renderW = Math.min(w, 720);
    const scale = renderW / 720;
    this.app.renderer.resize(w, h);
    this.app.stage.scale.set(scale);
    // 超宽时居中
    this.app.stage.x = (w - renderW) / 2;
    this.designH = h / scale;
  }

  /** 供场景调用：切换游戏阶段 */
  switchPhase(phase: GameState['phase']) {
    this._setGame(prev => ({ ...prev, phase }));
    const PHASE_SCENE_MAP: Record<string, string> = {
      start: 'start',
      classSelect: 'classSelect',
      map: 'map',
      battle: 'battle',
      merchant: 'shop',
      campfire: 'campfire',
      event: 'event',
      loot: 'loot',
      diceReward: 'diceReward',
      gameover: 'gameover',
      victory: 'victory',
    };
    const sceneName = PHASE_SCENE_MAP[phase] || 'start';
    this.sceneManager.switchTo(sceneName);
  }
}

