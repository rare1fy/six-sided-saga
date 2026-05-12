/**
 * StartScene - 开始界面 (PixiJS)
 * 精确还原原版 React StartScreen
 * 原版设计宽度 448px -> Canvas 720px, S = 1.607
 *
 * 发光效果方案：手绘多层同心半透明 Graphics 环 + 粒子光晕。
 * 完全不使用 filter（GlowFilter / BlurFilter），像素图永远锐利。
 * - 静态底光：多圈渐变透明椭圆 Graphics，模拟柔和光晕底色
 * - 粒子光晕：小方块粒子沿椭圆轨道环绕飘动，密集叠加形成动态光晕
 * - 呼吸动画：整体 alpha 随 sin 波动，模拟原版 CSS drop-shadow 呼吸
 */
import { Container, Text, TextStyle } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createButton, createText, COLORS, FONT, S } from '../UIFactory';
import { getPixelSprite, getIcon } from '../AssetProvider';
import { playSfx } from '../SoundBridge';
import { TweenManager, Ease } from '../animation/Tween';
import { SoulShopModal } from '../ui/SoulShopModal';

const W = 720;
const s = (v: number) => Math.round(v * S);

const GRID_COLORS = [
  { x: 0, y: 0, w: 2, h: 2, c: 0x242220, a: 0.8 },
  { x: 4, y: 2, w: 2, h: 2, c: 0x100e0c, a: 0.7 },
  { x: 2, y: 4, w: 2, h: 2, c: 0x282624, a: 0.6 },
  { x: 6, y: 6, w: 2, h: 2, c: 0x100e0c, a: 0.7 },
  { x: 0, y: 6, w: 2, h: 1, c: 0x2c2a26, a: 0.5 },
  { x: 6, y: 0, w: 1, h: 2, c: 0x262420, a: 0.5 },
  { x: 3, y: 1, w: 1, h: 1, c: 0x302e2a, a: 0.4 },
  { x: 5, y: 5, w: 1, h: 1, c: 0x0c0a08, a: 0.5 },
  { x: 1, y: 3, w: 1, h: 1, c: 0x343230, a: 0.35 },
  { x: 7, y: 3, w: 1, h: 1, c: 0x201e1c, a: 0.4 },
];

/** 背景漂浮粒子 */
interface FloatParticle {
  g: Graphics;
  x: number; y: number;
  vy: number; vx: number;
  life: number; maxLife: number;
  size: number; opacity: number;
}

/** 光晕粒子：沿椭圆轨道环绕 */
interface GlowMote {
  g: Graphics;
  angle: number;
  speed: number;
  radiusX: number;
  radiusY: number;
  baseAlpha: number;
  size: number;
  /** 距离中心的层级(0=最内, 1=中, 2=最外)，越外越淡 */
  layer: number;
}

/** 粒子光晕系统 */
interface ParticleAura {
  container: Container;
  staticGlow: Graphics;
  motes: GlowMote[];
}

export class StartScene implements GameScene {
  container: Container;
  private gameApp: GameApp;
  private time = 0;
  private contentLayer: Container | null = null;
  private diceWrapper: Container | null = null;
  private diceBaseY = 0;
  private diceAura: ParticleAura | null = null;
  private glowGraphics: Graphics | null = null;
  private subtitleText: Text | null = null;
  private btnAura: ParticleAura | null = null;
  private particles: FloatParticle[] = [];
  private fading = false;
  private contentTotalH = 0;
  private soulShopModal: SoulShopModal | null = null;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.fading = false;
    this.time = 0;
    this.build();
  }

  onExit() {
    TweenManager.killTweensOf(this.container);
    this.container.removeChildren();
    this.particles = [];
    this.contentLayer = null;
    this.diceWrapper = null;
    this.diceAura = null;
    this.glowGraphics = null;
    this.subtitleText = null;
    this.btnAura = null;
    this.contentTotalH = 0;
    if (this.soulShopModal) {
      this.soulShopModal.destroy();
      this.soulShopModal = null;
    }
  }

  onGameStateChanged() {}

  onTick = (delta: number) => {
    const dt = delta * 0.016;
    this.time += dt;

    // 实时居中适配：designH 随窗口变化，content 要始终垂直居中
    if (this.contentLayer && this.contentTotalH > 0) {
      const H = this.gameApp.designH;
      this.contentLayer.y = Math.max((H - this.contentTotalH) / 2, s(24));
    }

    // 骰子浮动
    if (this.diceWrapper) {
      this.diceWrapper.y = this.diceBaseY + Math.sin(this.time * 2.1) * s(8);
      this.diceWrapper.rotation = Math.sin(this.time * 0.8) * 0.07;
    }

    // 骰子粒子光晕呼吸
    if (this.diceAura) {
      const phase = (Math.sin(this.time * 2.51) + 1) / 2; // 0→1
      // 静态底光呼吸: alpha 0.25→0.65
      this.diceAura.staticGlow.alpha = 0.25 + phase * 0.40;
      this.updateAuraMotes(this.diceAura, dt, phase);
    }

    // 中心脉冲光晕
    if (this.glowGraphics) {
      this.glowGraphics.alpha = 0.03 + (Math.sin(this.time * 1.57) + 1) / 2 * 0.05;
    }

    // 副标题呼吸
    if (this.subtitleText) {
      this.subtitleText.alpha = 0.6 + (Math.sin(this.time * 2.1) + 1) / 2 * 0.4;
    }

    // 按钮粒子光晕呼吸
    if (this.btnAura) {
      const btnPhase = (Math.sin(this.time * 3.14) + 1) / 2;
      this.btnAura.staticGlow.alpha = 0.12 + btnPhase * 0.23;
      this.updateAuraMotes(this.btnAura, dt, btnPhase);
    }

    // 背景漂浮粒子
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) this.resetBgParticle(p);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.g.x = Math.floor(p.x);
      p.g.y = Math.floor(p.y);
      const progress = 1 - p.life / p.maxLife;
      if (progress < 0.1) p.g.alpha = (progress / 0.1) * p.opacity;
      else if (progress > 0.9) p.g.alpha = ((1 - progress) / 0.1) * p.opacity;
      else p.g.alpha = p.opacity;
    }
  };

  /** 更新光晕粒子：沿椭圆轨道运动 + 呼吸 alpha */
  private updateAuraMotes(aura: ParticleAura, dt: number, breathPhase: number) {
    for (const m of aura.motes) {
      m.angle += m.speed * dt;
      m.g.x = Math.cos(m.angle) * m.radiusX;
      m.g.y = Math.sin(m.angle) * m.radiusY;
      // 层级越外基础alpha越低，呼吸时整体变亮
      const layerMul = m.layer === 0 ? 1.0 : m.layer === 1 ? 0.75 : 0.45;
      m.g.alpha = m.baseAlpha * layerMul * (0.5 + breathPhase * 0.5);
    }
  }

  private resetBgParticle(p: FloatParticle) {
    const H = this.gameApp.designH;
    p.x = Math.random() * W;
    p.y = H * 0.3 + Math.random() * H * 0.6;
    const duration = 2 + Math.random() * 3;
    p.life = duration;
    p.maxLife = duration;
    p.vy = -s(100) / duration;
    p.vx = s(15) / duration;
  }

  private build() {
    const H = this.gameApp.designH;
    this.drawBackground(H);
    this.createBgParticles(H);
    this.buildContent(H);
    this.drawScanlines(H);
    const version = createText('v0.9', { size: s(7), color: COLORS.textDim });
    version.x = s(10);
    version.y = H - s(20);
    this.container.addChild(version);
    this.playEntrance();
  }

  private buildContent(H: number) {
    const content = new Container();
    this.contentLayer = content;
    const diceSize = s(56);
    const diceGap = s(36);    // 骰子到标题的间距（拉大）
    const titleH = s(40);
    const subH = s(14);
    const btnH = s(40);
    const shopBtnH = s(36);
    const tutH = s(14);
    this.contentTotalH = diceSize + diceGap + titleH + s(8) + subH + s(40)
      + btnH + s(16) + shopBtnH + s(20) + tutH;
    let curY = 0;
    this.createGoldDice(content, curY + diceSize / 2);
    curY += diceSize + diceGap;
    this.createTitle(content, curY + titleH / 2);
    curY += titleH + s(8);
    this.createSubtitle(content, curY);
    curY += subH + s(40);
    this.createStartButton(content, curY);
    curY += btnH + s(16);
    this.createShopButton(content, curY);
    curY += shopBtnH + s(20);
    this.createTutorialButton(content, curY);
    content.x = 0;
    content.y = Math.max((H - this.contentTotalH) / 2, s(24));
    this.container.addChild(content);
  }

  // ===== 粒子光晕系统 =====

  /**
   * 创建粒子光晕：围绕目标中心的多层半透明小方块 + 静态渐变底光。
   * 完全不使用 filter，用 additive blending 般的半透明叠加实现柔和效果。
   *
   * @param halfW 目标半宽
   * @param halfH 目标半高
   * @param color 光晕颜色
   * @param moteCount 粒子总数 (建议 20~40)
   * @param layers 层数配置 [{radiusScale, count}]
   */
  private createParticleAura(
    halfW: number, halfH: number, color: number,
    layers: { radiusScale: number; count: number; sizeRange: [number, number] }[],
  ): ParticleAura {
    const auraContainer = new Container();

    // 1) 静态底光：多圈同心渐变椭圆，无 filter
    const staticGlow = new Graphics();
    const ringCount = 12;
    for (let i = ringCount; i >= 0; i--) {
      const ratio = i / ringCount;
      const rx = halfW * (1.0 + ratio * 1.8);
      const ry = halfH * (1.0 + ratio * 1.8);
      // 从外到内：外圈极淡，内圈略浓
      const a = 0.06 * (1 - ratio * 0.6);
      staticGlow.beginFill(color, a);
      staticGlow.drawEllipse(0, 0, rx, ry);
      staticGlow.endFill();
    }
    staticGlow.alpha = 0.45;
    auraContainer.addChild(staticGlow);

    // 2) 光晕粒子：分层环绕
    const motes: GlowMote[] = [];
    for (let li = 0; li < layers.length; li++) {
      const layer = layers[li];
      for (let i = 0; i < layer.count; i++) {
        const angle = (Math.PI * 2 / layer.count) * i + Math.random() * 0.5;
        const sizeMin = layer.sizeRange[0];
        const sizeMax = layer.sizeRange[1];
        const size = sizeMin + Math.random() * (sizeMax - sizeMin);

        const g = new Graphics();
        g.beginFill(color);
        g.drawRect(-size / 2, -size / 2, size, size);
        g.endFill();

        const rx = halfW * layer.radiusScale * (0.9 + Math.random() * 0.2);
        const ry = halfH * layer.radiusScale * (0.9 + Math.random() * 0.2);
        const speed = (0.3 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1);

        g.x = Math.cos(angle) * rx;
        g.y = Math.sin(angle) * ry;
        g.alpha = 0;
        auraContainer.addChild(g);

        motes.push({
          g, angle, speed,
          radiusX: rx, radiusY: ry,
          baseAlpha: 0.35 + Math.random() * 0.40,
          size, layer: li,
        });
      }
    }

    return { container: auraContainer, staticGlow, motes };
  }

  // ===== 背景 =====

  private drawBackground(H: number) {
    const bg = new Graphics();
    bg.beginFill(0x0a0908);
    bg.drawRect(0, 0, W, H);
    bg.endFill();
    this.container.addChild(bg);
    this.drawPixelGrid(H);
    this.drawVignette(H);
    const topFog = new Graphics();
    for (let i = 0; i < 20; i++) {
      topFog.beginFill(0x040306, 0.7 * (1 - i / 20));
      topFog.drawRect(0, Math.floor(H * 0.3 * i / 20), W, Math.ceil(H * 0.3 / 20) + 1);
      topFog.endFill();
    }
    this.container.addChild(topFog);
    const bottomFog = new Graphics();
    for (let i = 0; i < 20; i++) {
      bottomFog.beginFill(0x040306, 0.8 * (i / 20));
      bottomFog.drawRect(0, Math.floor(H * 0.75 + H * 0.25 * i / 20), W, Math.ceil(H * 0.25 / 20) + 1);
      bottomFog.endFill();
    }
    this.container.addChild(bottomFog);
    const glow = new Graphics();
    const glowR = s(180);
    for (let i = 20; i >= 0; i--) {
      const r = glowR * (i / 20);
      glow.beginFill(0xd4a030, 0.12 * (1 - i / 20));
      glow.drawEllipse(W / 2, H * 0.28, r * 1.2, r * 0.8);
      glow.endFill();
    }
    this.glowGraphics = glow;
    this.container.addChild(glow);
  }

  private drawPixelGrid(H: number) {
    const grid = new Graphics();
    const tileSize = 8;
    const cols = Math.ceil(W / tileSize);
    const rows = Math.ceil(H / tileSize);
    grid.beginFill(0x181614);
    grid.drawRect(0, 0, W, H);
    grid.endFill();
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const ox = col * tileSize;
        const oy = row * tileSize;
        for (const cell of GRID_COLORS) {
          grid.beginFill(cell.c, cell.a);
          grid.drawRect(ox + cell.x, oy + cell.y, cell.w, cell.h);
          grid.endFill();
        }
      }
    }
    grid.alpha = 0.3;
    this.container.addChild(grid);
  }

  private drawVignette(H: number) {
    const vig = new Graphics();
    const cx = W / 2;
    const cy = H * 0.4;
    const maxR = Math.max(W, H) * 0.8;
    for (let i = 30; i >= 0; i--) {
      const ratio = i / 30;
      const r = maxR * ratio;
      let alpha: number;
      if (ratio > 0.6) alpha = 0.85 * ((ratio - 0.6) / 0.4);
      else if (ratio > 0.2) alpha = 0.4 * ((ratio - 0.2) / 0.4);
      else alpha = 0;
      vig.beginFill(0x060408, 0.85 - alpha);
      vig.drawEllipse(cx, cy, r * 1.1, r * 0.9);
      vig.endFill();
    }
    this.container.addChild(vig);
  }

  // ===== 背景漂浮粒子 =====

  private createBgParticles(H: number) {
    for (let i = 0; i < 8; i++) {
      const size = s(3 + Math.random() * 3);
      const g = new Graphics();
      const color = this.hslToHex(42 + Math.random() * 20, 80, 50 + Math.random() * 20);
      g.beginFill(color);
      g.drawRect(0, 0, size, size);
      g.endFill();
      const duration = 2 + Math.random() * 3;
      const x = Math.random() * W;
      const y = H * 0.2 + Math.random() * H * 0.6;
      g.x = Math.floor(x);
      g.y = Math.floor(y);
      g.alpha = 0;
      this.container.addChild(g);
      this.particles.push({
        g, x, y,
        vy: -s(100) / duration, vx: s(15) / duration,
        life: Math.random() * duration, maxLife: duration,
        size, opacity: 0.5 + Math.random() * 0.3,
      });
    }
  }

  // ===== 金色骰子 =====

  private createGoldDice(parent: Container, centerY: number) {
    const wrapper = new Container();
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
    const diceScale = s(8);
    const diceW = 7 * diceScale;
    const diceH = 7 * diceScale;

    // 1) 粒子光晕（放在骰子下方，三层环绕）
    const aura = this.createParticleAura(
      diceW / 2, diceH / 2, 0xd4a030,
      [
        { radiusScale: 1.1, count: 8,  sizeRange: [s(3), s(6)] },   // 内层：紧贴骰子
        { radiusScale: 1.8, count: 9,  sizeRange: [s(4), s(7)] },   // 中层
        { radiusScale: 2.8, count: 6,  sizeRange: [s(3), s(5)] },   // 外层：远距离淡光
      ],
    );
    wrapper.addChild(aura.container);
    this.diceAura = aura;

    // 2) 像素骰子（无 filter，保持锐利）
    const dice = getPixelSprite(dicePixels, diceScale, 'gold_dice_start');
    dice.x = -diceW / 2;
    dice.y = -diceH / 2;
    wrapper.addChild(dice);

    wrapper.x = W / 2;
    wrapper.y = centerY;
    this.diceBaseY = centerY;
    this.diceWrapper = wrapper;
    parent.addChild(wrapper);
  }

  // ===== 标题 =====

  private createTitle(parent: Container, centerY: number) {
    const baseStyle = {
      fontFamily: FONT.pixel,
      fontSize: s(36),
      fontWeight: 'bold' as const,
      letterSpacing: s(5),
      padding: s(8),
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: s(4),
      dropShadowAngle: Math.PI / 4,
      dropShadowBlur: 0,
      dropShadowAlpha: 0.9,
    };
    const titleLeft = new Text('\u516d\u9762', new TextStyle({ ...baseStyle, fill: COLORS.textBright }));
    titleLeft.anchor.set(1, 0.5);
    titleLeft.x = W / 2 + s(3);
    titleLeft.y = centerY;
    parent.addChild(titleLeft);
    const titleRight = new Text('\u53f2\u8bd7', new TextStyle({ ...baseStyle, fill: COLORS.green }));
    titleRight.anchor.set(0, 0.5);
    titleRight.x = W / 2 + s(3);
    titleRight.y = centerY;
    parent.addChild(titleRight);
  }

  private createSubtitle(parent: Container, topY: number) {
    const subtitle = new Text('\u25c6  SIX-SIDED SAGA  \u25c6', new TextStyle({
      fontFamily: FONT.pixel, fontSize: s(10), fill: COLORS.gold,
      letterSpacing: s(2), padding: s(4),
      dropShadow: true, dropShadowColor: 0x000000,
      dropShadowDistance: s(2), dropShadowAngle: Math.PI / 4,
      dropShadowBlur: 0, dropShadowAlpha: 0.8,
    }));
    subtitle.anchor.set(0.5, 0);
    subtitle.x = W / 2;
    subtitle.y = topY;
    this.subtitleText = subtitle;
    parent.addChild(subtitle);
  }

  // ===== 按钮 =====

  private layoutIconAndTextInButton(
    btn: Container, btnW: number, btnH: number,
    icon: Container, iconGap: number,
  ) {
    const contentLayer = (btn as any).contentLayer as Container | undefined;
    if (!contentLayer) return;
    const textChild = contentLayer.children.find(c => c instanceof Text) as Text | undefined;
    if (!textChild) return;
    const totalW = icon.width + iconGap + textChild.width;
    const startX = (btnW - totalW) / 2;
    icon.x = startX;
    icon.y = (btnH - 4) / 2 - icon.height / 2;
    contentLayer.addChild(icon);
    textChild.anchor.set(0, 0.5);
    textChild.x = startX + icon.width + iconGap;
    textChild.y = (btnH - 4) / 2;
  }

  private createStartButton(parent: Container, topY: number) {
    const btnW = s(220);
    const btnH = s(40);
    const btnWrapper = new Container();

    // 1) 按钮粒子光晕（椭圆形，扁平贴合按钮形状）
    const aura = this.createParticleAura(
      btnW / 2, btnH / 2, 0x3cc864,
      [
        { radiusScale: 1.2, count: 8, sizeRange: [s(3), s(5)] },
        { radiusScale: 2.0, count: 6, sizeRange: [s(2), s(4)] },
      ],
    );
    // 光晕中心对齐按钮中心
    aura.container.x = btnW / 2;
    aura.container.y = btnH / 2;
    btnWrapper.addChild(aura.container);
    this.btnAura = aura;

    // 2) 按钮本体（无 filter）
    const startBtn = createButton('\u5f00\u542f\u5f81\u7a0b', btnW, btnH, { variant: 'primary', fontSize: s(14) });
    btnWrapper.addChild(startBtn);

    const swordIcon = getIcon('sword', s(18));
    this.layoutIconAndTextInButton(startBtn, btnW, btnH, swordIcon, s(6));

    startBtn.on('pointertap', () => this.handleStart());

    btnWrapper.x = (W - btnW) / 2;
    btnWrapper.y = topY;
    parent.addChild(btnWrapper);
  }

  private createShopButton(parent: Container, topY: number) {
    const btnW = s(220);
    const btnH = s(36);
    const shopBtn = createButton('\u9b42\u6676\u5546\u5e97', btnW, btnH, { variant: 'purple', fontSize: s(14) });

    const crystalIcon = getIcon('soul_crystal', s(18));
    this.layoutIconAndTextInButton(shopBtn, btnW, btnH, crystalIcon, s(6));

    shopBtn.x = (W - btnW) / 2;
    shopBtn.y = topY;
    shopBtn.on('pointertap', () => this.openSoulShop());
    parent.addChild(shopBtn);
  }

  private createTutorialButton(parent: Container, topY: number) {
    const tutorialBtn = new Container();
    tutorialBtn.eventMode = 'static';
    tutorialBtn.cursor = 'pointer';
    const bookSmall = getIcon('book', s(14));
    tutorialBtn.addChild(bookSmall);
    const tutText = createText('\u67e5\u770b\u6559\u7a0b', { size: s(9), color: COLORS.textDim });
    tutText.x = bookSmall.width + s(4);
    tutText.y = (bookSmall.height - tutText.height) / 2;
    tutorialBtn.addChild(tutText);
    const totalW = bookSmall.width + s(4) + tutText.width;
    tutorialBtn.x = (W - totalW) / 2;
    tutorialBtn.y = topY;
    tutorialBtn.on('pointerover', () => { tutText.style.fill = COLORS.green; });
    tutorialBtn.on('pointerout', () => { tutText.style.fill = COLORS.textDim; });
    parent.addChild(tutorialBtn);
  }

  // ===== 覆盖层 =====

  private drawScanlines(H: number) {
    const scanlines = new Graphics();
    for (let y = 0; y < H; y += 4) {
      scanlines.beginFill(0x000000, 0.08);
      scanlines.drawRect(0, y + 2, W, 2);
      scanlines.endFill();
    }
    this.container.addChild(scanlines);
  }

  // ===== 入场动画 =====

  private playEntrance() {
    if (!this.contentLayer) return;
    for (let i = 0; i < this.contentLayer.children.length; i++) {
      const child = this.contentLayer.children[i] as Container;
      if (!child) continue;
      const origY = child.y;
      const origAlpha = child.alpha;
      child.y = origY + s(20);
      child.alpha = 0;
      TweenManager.to(child, { y: origY, alpha: origAlpha }, {
        duration: 0.8, ease: Ease.easeOut, delay: 0.1 + i * 0.06,
      });
    }
  }

  // ===== 交互 =====

  private openSoulShop() {
    if (this.soulShopModal) {
      this.soulShopModal.open();
      return;
    }
    const modal = new SoulShopModal(this.gameApp);
    this.soulShopModal = modal;
    this.container.addChild(modal.container);
    modal.open();
  }

  private handleStart() {
    if (this.fading) return;
    this.fading = true;
    playSfx('gate_close');
    const H = this.gameApp.designH;
    const mask = new Graphics();
    mask.beginFill(0x000000);
    mask.drawRect(0, 0, W, H);
    mask.endFill();
    mask.alpha = 0;
    this.container.addChild(mask);
    TweenManager.to(mask as any, { alpha: 1 }, {
      duration: 1.2, ease: Ease.easeIn,
      onComplete: () => { this.gameApp.switchPhase('classSelect'); },
    });
  }

  // ===== 工具 =====

  private hslToHex(h: number, sat: number, l: number): number {
    const sn = sat / 100;
    const ln = l / 100;
    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = ln - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255);
  }
}
