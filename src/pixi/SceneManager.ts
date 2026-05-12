/**
 * SceneManager — 场景管理器
 * 替代 DiceHeroGame.tsx 的 React 路由逻辑
 */
import { Container } from 'pixi.js';
import type { GameApp } from './GameApp';
import type { GameState } from '../types/game';

export interface GameScene {
  /** 场景容器 */
  container: Container;
  /** 场景激活时调用 */
  onEnter(gameApp: GameApp): void;
  /** 场景离开时调用（清理） */
  onExit(): void;
  /** 游戏状态变更时调用 */
  onGameStateChanged?(game: GameState): void;
  /** 每帧更新（可选） */
  onTick?(dt: number): void;
}

type SceneFactory = (gameApp: GameApp) => GameScene;

export class SceneManager {
  private gameApp: GameApp;
  private scenes: Map<string, SceneFactory> = new Map();
  private currentScene: GameScene | null = null;
  private currentName: string = '';

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    // 注册默认场景（延迟导入避免循环依赖）
    this.registerDefaults();
  }

  private async registerDefaults() {
    // 动态注册场景，按需加载
    this.register('start', async (app) => {
      const { StartScene } = await import('./scenes/StartScene');
      return new StartScene(app);
    });
    this.register('classSelect', async (app) => {
      const { ClassSelectScene } = await import('./scenes/ClassSelectScene');
      return new ClassSelectScene(app);
    });
    this.register('map', async (app) => {
      const { MapScene } = await import('./scenes/MapScene');
      return new MapScene(app);
    });
    this.register('battle', async (app) => {
      const { BattleScene } = await import('./scenes/BattleScenePixi');
      return new BattleScene(app);
    });
    this.register('shop', async (app) => {
      const { ShopScene } = await import('./scenes/ShopScene');
      return new ShopScene(app);
    });
    this.register('campfire', async (app) => {
      const { CampfireScene } = await import('./scenes/CampfireScene');
      return new CampfireScene(app);
    });
    this.register('event', async (app) => {
      const { EventScene } = await import('./scenes/EventScene');
      return new EventScene(app);
    });
  }

  register(name: string, factory: (app: GameApp) => GameScene | Promise<GameScene>) {
    this.scenes.set(name, factory as SceneFactory);
  }

  async switchTo(name: string) {
    // 退出当前场景
    if (this.currentScene) {
      this.currentScene.onExit();
      this.gameApp.app.stage.removeChild(this.currentScene.container);
      // 取消 tick
      if (this.currentScene.onTick) {
        this.gameApp.app.ticker.remove(this.currentScene.onTick, this.currentScene);
      }
    }

    const factory = this.scenes.get(name);
    if (!factory) {
      console.warn(`[SceneManager] 场景 "${name}" 未注册，回退到 start`);
      if (name !== 'start') return this.switchTo('start');
      return;
    }

    const scene = await factory(this.gameApp);
    this.currentScene = scene;
    this.currentName = name;

    this.gameApp.app.stage.addChild(scene.container);
    scene.onEnter(this.gameApp);

    // 注册 tick
    if (scene.onTick) {
      this.gameApp.app.ticker.add(scene.onTick, scene);
    }
  }

  onGameStateChanged(game: GameState) {
    this.currentScene?.onGameStateChanged?.(game);
  }
}
