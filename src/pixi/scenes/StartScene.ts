/**
 * StartScene — 纯 PixiJS 开始界面
 * 复刻原 StartScreen.tsx 的视觉效果
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createButton, createText, COLORS, FONT } from '../UIFactory';
import { createPixelSprite } from '../PixelRenderer';
import { playSfx } from '../SoundBridge';

export class StartScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private time = 0;
  private diceSprite: Container | null = null;
  private particles: { g: Graphics; vx: number; vy: number; life: number; maxLife: number }[] = [];

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
    this.particles = [];
  }

  onGameStateChanged() {}

  onTick = (ticker: any) => {
    const dt = ticker.deltaTime * 0.016;
    this.time += dt;

    // 骰子浮动动画
    if (this.diceSprite) {
      this.diceSprite.y = 520 + Math.sin(this.time * 2) * 8;
      this.diceSprite.rotation = Math.sin(this.time * 0.8) * 0.08;
    }

    // 粒子更新
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) {
        p.life = p.maxLife;
        p.g.x = Math.random() * 720;
        p.g.y = Math.random() * 1280;
      }
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      p.g.alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.6;
    }
  };

  private build() {
    const W = 720, H = 1280;

    // ===== 背景 =====
    const bg = new Graphics();
    bg.rect(0, 0, W, H);
    bg.fill({ color: 0x0a0a0a });
    this.container.addChild(bg);

    // 暗角渐变（用多层半透明矩形模拟）
    const vignette = new Graphics();
    vignette.rect(0, 0, W, H * 0.3);
    vignette.fill({ color: 0x040306, alpha: 0.7 });
    this.container.addChild(vignette);
    const vigBottom = new Graphics();
    vigBottom.rect(0, H * 0.75, W, H * 0.25);
    vigBottom.fill({ color: 0x040306, alpha: 0.8 });
    this.container.addChild(vigBottom);

    // 像素网格背景
    const grid = new Graphics();
    for (let x = 0; x < W; x += 16) {
      grid.moveTo(x, 0); grid.lineTo(x, H);
      grid.stroke({ color: 0x1a1820, width: 0.5, alpha: 0.3 });
    }
    for (let y = 0; y < H; y += 16) {
      grid.moveTo(0, y); grid.lineTo(W, y);
      grid.stroke({ color: 0x1a1820, width: 0.5, alpha: 0.3 });
    }
    this.container.addChild(grid);

    // ===== 微光粒子 =====
    for (let i = 0; i < 12; i++) {
      const g = new Graphics();
      g.circle(0, 0, 1 + Math.random() * 1.5);
      g.fill({ color: 0xe8d068, alpha: 0.5 });
      g.x = Math.random() * W;
      g.y = Math.random() * H;
      this.container.addChild(g);
      this.particles.push({
        g,
        vx: (Math.random() - 0.5) * 10,
        vy: -5 - Math.random() * 15,
        life: Math.random() * 4 + 2,
        maxLife: 4 + Math.random() * 2,
      });
    }

    // ===== 光晕 =====
    const glow = new Graphics();
    glow.circle(W / 2, 500, 180);
    glow.fill({ color: 0xd4a030, alpha: 0.06 });
    this.container.addChild(glow);

    // ===== 金色骰子 =====
    const diceContainer = new Container();
    const B = '#6b5520', HL = '#f0d860', F = '#dcc040', D = '#a88a28', DOT = '#3a2a10';
    const dicePixels = [
      [B, HL, HL, HL, HL, HL, B],
      [HL, F, F, F, F, F, D],
      [HL, F, DOT, F, F, F, D],
      [HL, F, F, DOT, F, F, D],
      [HL, F, F, F, DOT, F, D],
      [HL, F, F, F, F, F, D],
      [B, D, D, D, D, D, B],
    ];
    const dice = createPixelSprite(this.gameApp.app, dicePixels, 8, 'gold_dice');
    dice.x = -28; dice.y = -28;
    diceContainer.addChild(dice);
    diceContainer.x = W / 2;
    diceContainer.y = 520;
    this.diceSprite = diceContainer;
    this.container.addChild(diceContainer);

    // ===== 标题 =====
    const titleLeft = new Text({
      text: '六面',
      style: new TextStyle({
        fontFamily: FONT.ui,
        fontSize: 48,
        fontWeight: 'bold',
        fill: COLORS.textBright,
        letterSpacing: 8,
      }),
    });
    titleLeft.anchor.set(1, 0.5);
    titleLeft.x = W / 2 + 4;
    titleLeft.y = 610;
    this.container.addChild(titleLeft);

    const titleRight = new Text({
      text: '史诗',
      style: new TextStyle({
        fontFamily: FONT.ui,
        fontSize: 48,
        fontWeight: 'bold',
        fill: COLORS.green,
        letterSpacing: 8,
      }),
    });
    titleRight.anchor.set(0, 0.5);
    titleRight.x = W / 2 + 4;
    titleRight.y = 610;
    this.container.addChild(titleRight);

    // 副标题
    const subtitle = new Text({
      text: '◆  6  S I D E S  B A T T L E  ◆',
      style: new TextStyle({
        fontFamily: FONT.ui, fontSize: 10, fill: COLORS.gold, letterSpacing: 4,
      }),
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = W / 2; subtitle.y = 645;
    this.container.addChild(subtitle);

    // ===== 按钮区域 =====
    // 开启征程
    const startBtn = createButton('⚔ 开启征程', 400, 48, {
      bg: 0x18803a, border: 0x0a3014, textColor: 0xc8ffd0, fontSize: 16,
    });
    startBtn.x = (W - 400) / 2;
    startBtn.y = 720;
    startBtn.on('pointertap', () => {
      playSfx('gate_close');
      this.gameApp.switchPhase('classSelect');
    });
    this.container.addChild(startBtn);

    // 魂晶商店
    const shopBtn = createButton('💎 魂晶商店', 400, 42, {
      bg: 0x503080, border: 0x2a1848, textColor: 0xd0b0ff, fontSize: 14,
    });
    shopBtn.x = (W - 400) / 2;
    shopBtn.y = 780;
    this.container.addChild(shopBtn);

    // 底部信息
    const version = createText('数据收程', { size: 10, color: COLORS.textDim });
    version.x = 20; version.y = H - 30;
    this.container.addChild(version);
  }
}
