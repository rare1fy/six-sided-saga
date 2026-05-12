/**
 * CampfireScene — 营火休息界面
 */
import { Container, Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, createButton, COLORS } from '../UIFactory';

const W = 720, H = 1280;

export class CampfireScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private time = 0;
  private flames: Graphics[] = [];

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.build();
  }

  onExit() {
    this.container.removeChildren();
    this.flames = [];
  }

  onTick = (ticker: any) => {
    this.time += ticker.deltaTime * 0.016;
    this.flames.forEach((f, i) => {
      f.alpha = 0.4 + Math.sin(this.time * 4 + i) * 0.3;
      f.y = H * 0.38 - 20 + Math.sin(this.time * 3 + i * 2) * 5;
    });
  };

  private build() {
    const game = this.gameApp.game;

    // 暗背景
    const bg = new Graphics();
    bg.rect(0, 0, W, H);
    bg.fill({ color: 0x080604 });
    this.container.addChild(bg);

    // 火焰光晕
    const glow = new Graphics();
    glow.circle(W / 2, H * 0.4, 120);
    glow.fill({ color: 0xff6622, alpha: 0.08 });
    this.container.addChild(glow);

    // 篝火（多层火焰）
    const fireColors = [0xff4400, 0xff6622, 0xff8844, 0xffaa66];
    fireColors.forEach((color, i) => {
      const flame = new Graphics();
      const size = 20 - i * 4;
      flame.ellipse(W / 2, H * 0.38 - i * 8, size, size * 1.5);
      flame.fill({ color, alpha: 0.6 });
      this.container.addChild(flame);
      this.flames.push(flame);
    });

    // 木头
    const wood = new Graphics();
    wood.roundRect(W / 2 - 30, H * 0.42, 60, 8, 2);
    wood.fill({ color: 0x5a3a1a });
    wood.roundRect(W / 2 - 25, H * 0.43, 50, 6, 2);
    wood.fill({ color: 0x4a2a10 });
    this.container.addChild(wood);

    // 标题
    const title = createText('🔥 篝火休息', { size: 28, color: COLORS.orange, bold: true });
    title.anchor.set(0.5, 0);
    title.x = W / 2; title.y = 80;
    this.container.addChild(title);

    // HP 信息
    const hpInfo = createText(`HP: ${game.hp}/${game.maxHp}`, { size: 16, color: COLORS.hpGreen });
    hpInfo.anchor.set(0.5, 0);
    hpInfo.x = W / 2; hpInfo.y = 130;
    this.container.addChild(hpInfo);

    // 选项
    const healAmount = Math.floor(game.maxHp * 0.3);
    const restBtn = createButton(`❤ 休息 (恢复 ${healAmount} HP)`, 400, 52, {
      bg: 0x802020, border: 0x501010, textColor: 0xffc0c0, fontSize: 15,
    });
    restBtn.x = (W - 400) / 2;
    restBtn.y = H * 0.55;
    restBtn.on('pointertap', () => {
      this.gameApp.setGame(prev => ({
        ...prev,
        hp: Math.min(prev.maxHp, prev.hp + healAmount),
        phase: 'map',
        currentFloor: (prev.currentFloor ?? 0) + 1,
      }));
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(restBtn);

    const smithBtn = createButton('⚒ 锻造 (强化一颗骰子)', 400, 52, {
      bg: 0x604020, border: 0x3a2010, textColor: 0xffd8a0, fontSize: 15,
    });
    smithBtn.x = (W - 400) / 2;
    smithBtn.y = H * 0.55 + 70;
    smithBtn.on('pointertap', () => {
      // 简化：直接回地图
      this.gameApp.setGame(prev => ({
        ...prev, phase: 'map', currentFloor: (prev.currentFloor ?? 0) + 1,
      }));
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(smithBtn);

    // 跳过
    const skipBtn = createButton('跳过', 200, 40, {
      bg: 0x222222, border: 0x444444, textColor: 0x888888, fontSize: 13,
    });
    skipBtn.x = (W - 200) / 2;
    skipBtn.y = H * 0.55 + 150;
    skipBtn.on('pointertap', () => {
      this.gameApp.setGame(prev => ({
        ...prev, phase: 'map', currentFloor: (prev.currentFloor ?? 0) + 1,
      }));
      this.gameApp.sceneManager.switchTo('map');
    });
    this.container.addChild(skipBtn);
  }
}
