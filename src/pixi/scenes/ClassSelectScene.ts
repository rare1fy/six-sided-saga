/**
 * ClassSelectScene — 职业选择界面 (PixiJS)
 *
 * 严格遵循 ART_SPEC.md v4.0 规范：
 * - 开发分辨率 720×1280
 * - 像素单位 1u = 2px
 * - 描边：中面板 2px(1u) 纯黑 + 2px(1u) 酒红
 * - 阴影：卡片 4px(2u) 纯黑 35%
 * - 圆角：中面板 4×4px(2u×2u) 削角
 * - 文字：H1=32px, H2=24px, H3=20px, 正文=16px, 注释=14px
 * - 内边距：卡片 20/24/20/24
 * - 间距：卡片之间 16-24px
 * - 光照方向：左上亮 → 右下暗
 * - 色卡来源：RPG Palettes
 */
import { Container, Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createText, COLORS } from '../UIFactory';
import { THEME } from '../ui/UIComponents';
import { getPixelSprite } from '../AssetProvider';
import { CLASS_DEFS, type ClassId } from '../../data/classes';
import { createInitialGameState } from '../../logic/gameInit';
import { TweenManager, Ease } from '../animation/Tween';
import gsap from 'gsap';
import { playSfx } from '../SoundBridge';
import { TUNING } from '../debug/DebugGUI';

// ============================================================
// 常量 — 基于 ART_SPEC 规范
// ============================================================

const W = 720;

// 色卡：Blood Moon（UI 主色调）
const PALETTE = {
  nightSky:    0x3d275a,
  moonlight:   0x664693,
  bloodRed:    0xdf1b3f,
  darkRed:     0x872347,
  deepPurple:  0x641844,
};

// 职业主题色
const CLASS_THEME: Record<ClassId, { main: number; light: number; dark: number }> = {
  warrior: { main: 0xc04040, light: 0xff6060, dark: 0x601010 },
  mage:    { main: 0x7040c0, light: 0xa070ff, dark: 0x301060 },
  rogue:   { main: 0x30a050, light: 0x60d080, dark: 0x104020 },
};

// ART_SPEC 文字规范 — 从 TUNING 实时读取
const FONT_SIZE = new Proxy({ h1: 32, h2: 24, h3: 20, body: 16, caption: 14, micro: 12 } as any, {
  get(_target: any, prop: string) {
    const map: Record<string, string> = {
      h1: 'fontH1', h2: 'fontH2', h3: 'fontH3', body: 'fontBody', caption: 'fontCaption',
    };
    if (map[prop]) return (TUNING as any)[map[prop]];
    return _target[prop];
  },
}) as any;

// ART_SPEC 间距规范 — 从 TUNING 实时读取
const SPACING = new Proxy({
  screenEdge: 40, cardGap: 20, titleToContent: 20,
  cardPadTop: 20, cardPadRight: 24, cardPadBottom: 20, cardPadLeft: 24,
  iconToText: 16, btnGap: 16,
} as any, {
  get(_target: any, prop: string) {
    const map: Record<string, string> = {
      screenEdge: 'screenEdge', cardGap: 'cardGap', titleToContent: 'titleToContent',
      cardPadTop: 'cardPadTop', cardPadRight: 'cardPadRight',
      cardPadBottom: 'cardPadBottom', cardPadLeft: 'cardPadLeft',
      iconToText: 'iconToText',
    };
    if (map[prop]) return (TUNING as any)[map[prop]];
    return _target[prop];
  },
}) as any;

// ART_SPEC 描边/阴影规范 — 从 TUNING 实时读取
const STROKE = new Proxy({
  outline: 2, border: 2, borderSelected: 4,
  shadow: 6, shadowNormal: 4, shadowAlpha: 0.35,
  shadowSelectedAlpha: 0.5, innerHighlight: 0.08, innerShadow: 0.2,
  glow: 4, glowAlpha: 0.25,
} as any, {
  get(_target: any, prop: string) {
    const map: Record<string, string> = {
      outline: 'outline', border: 'border', borderSelected: 'borderSelected',
      shadow: 'shadowSelected', shadowNormal: 'shadowNormal',
      shadowAlpha: 'shadowAlpha', shadowSelectedAlpha: 'shadowSelectedAlpha',
      innerHighlight: 'innerHighlight', innerShadow: 'innerShadow',
      glow: 'glow', glowAlpha: 'glowAlpha',
    };
    if (map[prop]) return (TUNING as any)[map[prop]];
    return _target[prop];
  },
}) as any;

// 卡片尺寸
const CARD_W = W - SPACING.screenEdge * 2;
const CARD_H_COLLAPSED = 120;
const CARD_H_EXPANDED = 420;
const CARDS_START_Y = 100;
const ANIM_DURATION = 0.4;
const CONFIRM_BTN_H = 64;
const CONFIRM_BTN_W = 400;

// ============================================================
// 职业图标像素数据
// ============================================================

const WARRIOR_ICON: string[][] = [
  ['', '', '', '#5a4838', '', '', ''],
  ['#8898b0', '', '', '#5a4838', '', '', '#8898b0'],
  ['#98a8c0', '#98a8c0', '#4a4a56', '#4a4a56', '#4a4a56', '#98a8c0', '#98a8c0'],
  ['#a0b0c8', '#c04040', '#a0b0c8', '#5a4838', '#a0b0c8', '#a0b0c8', '#a0b0c8'],
  ['#98a8c0', '#98a8c0', '#4a4a56', '#4a4a56', '#4a4a56', '#98a8c0', '#98a8c0'],
  ['#8898b0', '', '', '#5a4838', '', '', '#8898b0'],
  ['', '', '', '#5a4838', '', '', ''],
];

const MAGE_ICON: string[][] = [
  ['', '', '', '#7050c0', '', '', ''],
  ['', '#6040a0', '', '#9070e0', '', '#6040a0', ''],
  ['', '', '#8060c0', '#b090ff', '#8060c0', '', ''],
  ['#7050c0', '#9070e0', '#b090ff', '#d0c0ff', '#b090ff', '#9070e0', '#7050c0'],
  ['', '', '#8060c0', '#b090ff', '#8060c0', '', ''],
  ['', '#6040a0', '', '#9070e0', '', '#6040a0', ''],
  ['', '', '', '#7050c0', '', '', ''],
];

const ROGUE_ICON: string[][] = [
  ['#40c060', '#708090', '', '', '', '', ''],
  ['#708090', '#a0b8c8', '#8098a8', '', '', '', ''],
  ['', '#8098a8', '#b0c8d8', '#90a8b8', '', '', ''],
  ['', '', '#90a8b8', '#c0d0e0', '', '', ''],
  ['', '', '', '', '#4a3828', '#40a060', ''],
  ['', '', '', '', '#40a060', '#3a2818', ''],
  ['', '', '', '', '', '', '#2a1808'],
];

const CLASS_ICONS: Record<ClassId, string[][]> = {
  warrior: WARRIOR_ICON, mage: MAGE_ICON, rogue: ROGUE_ICON,
};

// ============================================================
// 漂浮粒子
// ============================================================

interface FloatParticle {
  g: Graphics;
  x: number; y: number;
  vy: number; vx: number;
  life: number; maxLife: number;
  size: number; opacity: number;
}

// ============================================================
// 绘制工具 — 严格遵循 ART_SPEC 像素圆角规范
// ============================================================

function fillPixelRounded(
  g: Graphics, x: number, y: number, w: number, h: number,
  color: number, alpha = 1, cornerSize = 4,
): void {
  g.beginFill(color, alpha);
  g.drawRect(x + cornerSize, y, w - cornerSize * 2, h);
  g.drawRect(x, y + cornerSize, cornerSize, h - cornerSize * 2);
  g.drawRect(x + w - cornerSize, y + cornerSize, cornerSize, h - cornerSize * 2);
  for (let i = 0; i < cornerSize; i++) {
    const inset = cornerSize - i;
    g.drawRect(x + inset, y + i, cornerSize - inset, 1);
    g.drawRect(x + w - cornerSize, y + i, cornerSize - inset, 1);
    g.drawRect(x + inset, y + h - 1 - i, cornerSize - inset, 1);
    g.drawRect(x + w - cornerSize, y + h - 1 - i, cornerSize - inset, 1);
  }
  g.endFill();
}

function lightenColor(hex: number, factor: number): number {
  const r = Math.min(255, ((hex >> 16) & 0xff) + Math.round(255 * factor));
  const gg = Math.min(255, ((hex >> 8) & 0xff) + Math.round(255 * factor));
  const b = Math.min(255, (hex & 0xff) + Math.round(255 * factor));
  return (r << 16) | (gg << 8) | b;
}

function darkenColor(hex: number, factor: number): number {
  const r = Math.max(0, Math.round(((hex >> 16) & 0xff) * (1 - factor)));
  const gg = Math.max(0, Math.round(((hex >> 8) & 0xff) * (1 - factor)));
  const b = Math.max(0, Math.round((hex & 0xff) * (1 - factor)));
  return (r << 16) | (gg << 8) | b;
}

function noise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// ============================================================
// 背景绘制
// ============================================================

function drawBackground(g: Graphics, w: number, h: number): void {
  g.beginFill(THEME.bgDeep, 1);
  g.drawRect(0, 0, w, h);
  g.endFill();

  // 石砖纹理
  const brickW = 72;
  const brickH = 36;
  for (let row = 0; row * brickH < h; row++) {
    const offsetX = (row % 2) * (brickW / 2);
    for (let col = -1; col * brickW < w + brickW; col++) {
      const bx = col * brickW + offsetX;
      const by = row * brickH;
      const tint = ((row + col) % 2 === 0) ? 0xffffff : 0x000000;
      const tintA = ((row + col) % 2 === 0) ? 0.012 : 0.025;
      g.beginFill(tint, tintA);
      g.drawRect(bx + 1, by + 1, brickW - 2, brickH - 2);
      g.endFill();
    }
    g.beginFill(0x000000, 0.06);
    g.drawRect(0, row * brickH, w, 1);
    g.endFill();
  }

  // 噪点
  for (let py = 0; py < h; py += 8) {
    for (let px = 0; px < w; px += 10) {
      const n = noise(px, py);
      if (n > 0.82) {
        g.beginFill(0xffffff, 0.012);
        g.drawRect(px, py, 2, 2);
        g.endFill();
      } else if (n < 0.08) {
        g.beginFill(0x000000, 0.06);
        g.drawRect(px, py, 2, 2);
        g.endFill();
      }
    }
  }

  // 暗角
  const vignetteSteps = 16;
  for (let i = 0; i < vignetteSteps; i++) {
    const a = 0.45 * Math.pow(1 - i / vignetteSteps, 2);
    g.beginFill(0x000000, a);
    g.drawRect(0, i * 6, w, 6);
    g.endFill();
    g.beginFill(0x000000, a);
    g.drawRect(0, h - (i + 1) * 6, w, 6);
    g.endFill();
  }
  for (let i = 0; i < 10; i++) {
    const a = 0.3 * Math.pow(1 - i / 10, 2);
    g.beginFill(0x000000, a);
    g.drawRect(i * 8, 0, 8, h);
    g.endFill();
    g.beginFill(0x000000, a);
    g.drawRect(w - (i + 1) * 8, 0, 8, h);
    g.endFill();
  }

  // 中心氛围光
  const cx = w / 2;
  const cy = h * 0.4;
  for (let r = 6; r >= 0; r--) {
    const radius = 120 + r * 50;
    const a = 0.012 * (1 - r / 6);
    g.beginFill(PALETTE.nightSky, a);
    g.drawCircle(cx, cy, radius);
    g.endFill();
  }
}

// ============================================================
// 卡片面板绘制 — 严格遵循 ART_SPEC 三/四/五章
// ============================================================

function drawCardPanel(
  g: Graphics, w: number, h: number,
  opts: { selected: boolean; themeColor: number },
): void {
  const { selected, themeColor } = opts;
  const corner = 4;

  // 投影
  // 投影（选中态更深更大）
  const shadowDist = selected ? STROKE.shadow : STROKE.shadowNormal;
  const shadowA = selected ? STROKE.shadowSelectedAlpha : STROKE.shadowAlpha;
  fillPixelRounded(g, 0, shadowDist, w, h, 0x000000, shadowA, corner);

  if (selected) {
    const bw = STROKE.borderSelected; // 4px 主题色边框
    const ol = STROKE.outline;        // 2px 纯黑外轮廓
    const brightColor = lightenColor(themeColor, 0.25);
    const darkColor = darkenColor(themeColor, 0.35);

    // Layer 1: 外发光（主题色半透明扩散）
    for (let i = 1; i <= STROKE.glow; i++) {
      const glowA = STROKE.glowAlpha * (1 - i / (STROKE.glow + 1));
      g.beginFill(themeColor, glowA);
      g.drawRect(-i, -i, w + i * 2, h + i * 2);
      g.endFill();
    }

    // Layer 2: 纯黑外轮廓（2px）
    fillPixelRounded(g, 0, 0, w, h, 0x000000, 0.95, corner);

    // Layer 3: 主题色边框（4px，带光照方向）
    // 上边 - 最亮
    g.beginFill(brightColor, 0.95);
    g.drawRect(ol, ol, w - ol * 2, bw);
    g.endFill();
    // 左边 - 次亮
    g.beginFill(lightenColor(themeColor, 0.12), 0.9);
    g.drawRect(ol, ol + bw, bw, h - ol * 2 - bw * 2);
    g.endFill();
    // 下边 - 暗面
    g.beginFill(darkColor, 0.9);
    g.drawRect(ol, h - ol - bw, w - ol * 2, bw);
    g.endFill();
    // 右边 - 最暗
    g.beginFill(darkenColor(themeColor, 0.5), 0.85);
    g.drawRect(w - ol - bw, ol + bw, bw, h - ol * 2 - bw * 2);
    g.endFill();

    // Layer 4: 面板填充
    const inset = ol + bw;
    fillPixelRounded(g, inset, inset, w - inset * 2, h - inset * 2, THEME.bgDark, 0.95, 2);

    // Layer 5: 内高光条（顶部 2px 白色）+ 内暗面（底部 2px 黑色）
    g.beginFill(0xffffff, STROKE.innerHighlight);
    g.drawRect(inset, inset, w - inset * 2, 2);
    g.endFill();
    g.beginFill(0xffffff, 0.05);
    g.drawRect(inset, inset + 2, 2, h - inset * 2 - 4);
    g.endFill();
    g.beginFill(0x000000, STROKE.innerShadow);
    g.drawRect(inset, h - inset - 2, w - inset * 2, 2);
    g.endFill();
    g.beginFill(0x000000, 0.14);
    g.drawRect(w - inset - 2, inset + 2, 2, h - inset * 2 - 4);
    g.endFill();

    // Layer 6: 职业色氛围光（顶部渐变）
    for (let i = 0; i < 8; i++) {
      g.beginFill(themeColor, 0.05 * (1 - i / 8));
      g.drawRect(inset, inset + i * 2, w - inset * 2, 2);
      g.endFill();
    }

    // Layer 7: 左上角高光点
    g.beginFill(brightColor, 0.5);
    g.drawRect(ol, ol, 2, 2);
    g.endFill();

    // Layer 8: 四角铆钉（加大到 8px）
    const ns = 8;
    const corners = [[0, 0], [w - ns, 0], [0, h - ns], [w - ns, h - ns]];
    for (const [cx, cy] of corners) {
      g.beginFill(darkenColor(themeColor, 0.15), 0.95);
      g.drawRect(cx, cy, ns, ns);
      g.endFill();
      g.beginFill(brightColor, 0.55);
      g.drawRect(cx, cy, 2, 2);
      g.endFill();
      g.beginFill(0x000000, 0.5);
      g.drawRect(cx + ns - 2, cy + ns - 2, 2, 2);
      g.endFill();
      g.beginFill(brightColor, 0.3);
      g.drawRect(cx + 3, cy + 3, 2, 2);
      g.endFill();
    }
  } else {
    // 未选中态
    fillPixelRounded(g, 0, 0, w, h, 0x000000, 0.5, corner);
    const bw = STROKE.border;
    g.beginFill(0x2a2436, 0.45);
    g.drawRect(STROKE.outline, STROKE.outline, w - STROKE.outline * 2, bw);
    g.endFill();
    g.beginFill(0x1a1420, 0.35);
    g.drawRect(STROKE.outline, h - STROKE.outline - bw, w - STROKE.outline * 2, bw);
    g.endFill();
    g.beginFill(0x241e30, 0.4);
    g.drawRect(STROKE.outline, STROKE.outline + bw, bw, h - STROKE.outline * 2 - bw * 2);
    g.endFill();
    g.beginFill(0x181220, 0.3);
    g.drawRect(w - STROKE.outline - bw, STROKE.outline + bw, bw, h - STROKE.outline * 2 - bw * 2);
    g.endFill();

    const inset = STROKE.outline + bw;
    fillPixelRounded(g, inset, inset, w - inset * 2, h - inset * 2, THEME.bgDeep, 0.92, 2);
    g.beginFill(0xffffff, 0.04);
    g.drawRect(inset, inset, w - inset * 2, 2);
    g.endFill();
    g.beginFill(0x000000, 0.15);
    g.drawRect(inset, h - inset - 2, w - inset * 2, 2);
    g.endFill();
  }

  // 水平条纹纹理
  const inset = STROKE.outline + STROKE.border;
  for (let y = inset + 2; y < h - inset; y += 4) {
    g.beginFill(0x000000, 0.025);
    g.drawRect(inset, y, w - inset * 2, 2);
    g.endFill();
  }
}

// ============================================================
// 按钮绘制
// ============================================================

function drawButton(
  g: Graphics, w: number, h: number,
  color: number, pressed = false,
): void {
  const corner = 2;
  const darkColor = darkenColor(color, 0.35);

  if (!pressed) {
    g.beginFill(0x000000, 0.5);
    g.drawRect(corner, h - STROKE.shadow, w - corner * 2, STROKE.shadow);
    g.endFill();
    fillPixelRounded(g, 0, 0, w, h - STROKE.shadow, 0x000000, 1, corner);
    fillPixelRounded(g, STROKE.outline, STROKE.outline, w - STROKE.outline * 2, h - STROKE.shadow - STROKE.outline * 2, color, 1, corner);
    g.beginFill(lightenColor(color, 0.2));
    g.drawRect(STROKE.outline + corner, STROKE.outline, w - STROKE.outline * 2 - corner * 2, 2);
    g.endFill();
    g.beginFill(darkColor);
    g.drawRect(STROKE.outline + corner, h - STROKE.shadow - STROKE.outline - 2, w - STROKE.outline * 2 - corner * 2, 2);
    g.endFill();
  } else {
    fillPixelRounded(g, 0, 2, w, h - STROKE.shadow, 0x000000, 1, corner);
    fillPixelRounded(g, STROKE.outline, STROKE.outline + 2, w - STROKE.outline * 2, h - STROKE.shadow - STROKE.outline * 2, darkColor, 1, corner);
  }
}

// ============================================================
// 动画卡片容器
// ============================================================

interface AnimCard {
  outer: Container;
  inner: Container;
  clipMask: Graphics;
  panelGfx: Graphics;
  classId: ClassId;
  currentH: number;
  targetH: number;
}

// ============================================================
// 场景实现
// ============================================================

export class ClassSelectScene implements GameScene {
  container: Container;
  private gameApp!: GameApp;
  private selected: ClassId | null = null;
  private confirming = false;
  private contentLayer: Container | null = null;
  private animCards: AnimCard[] = [];
  private animating = false;
  private confirmBtn: Container | null = null;
  private particles: FloatParticle[] = [];
  private time = 0;

  constructor(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.container = new Container();
  }

  onEnter(gameApp: GameApp) {
    this.gameApp = gameApp;
    this.selected = null;
    this.confirming = false;
    this.animating = false;
    this.animCards = [];
    this.particles = [];
    this.time = 0;
    this.buildFull();
  }

  onExit() {
    this.container.removeChildren();
    this.contentLayer = null;
    this.animCards = [];
    this.confirmBtn = null;
    this.particles = [];
  }

  onGameStateChanged() {}

  onTick = (delta: number) => {
    const dt = delta * 0.016;
    this.time += dt;

    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) this.resetParticle(p);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.g.x = Math.floor(p.x);
      p.g.y = Math.floor(p.y);
      const progress = 1 - p.life / p.maxLife;
      if (progress < 0.15) p.g.alpha = (progress / 0.15) * p.opacity;
      else if (progress > 0.85) p.g.alpha = ((1 - progress) / 0.15) * p.opacity;
      else p.g.alpha = p.opacity;
    }
  };

  private resetParticle(p: FloatParticle) {
    const H = this.gameApp.designH;
    p.x = Math.random() * W;
    p.y = H * 0.3 + Math.random() * H * 0.5;
    const duration = 3 + Math.random() * 4;
    p.life = duration;
    p.maxLife = duration;
    p.vy = -(60 + Math.random() * 40) / duration;
    p.vx = (-10 + Math.random() * 20) / duration;
  }

  private buildFull() {
    this.container.removeChildren();
    this.animCards = [];
    const H = this.gameApp.designH;

    const bgLayer = new Graphics();
    drawBackground(bgLayer, W, H);
    this.container.addChild(bgLayer);

    this.createParticles(H);

    this.contentLayer = new Container();
    this.container.addChild(this.contentLayer);

    // 标题
    const title = createText('选择职业', {
      size: FONT_SIZE.h1, color: THEME.cream, bold: true,
      shadowDistance: 2, shadowAlpha: 0.8,
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = 32;
    this.contentLayer.addChild(title);

    // 副标题
    const subtitle = createText('每个职业拥有独特的战斗风格和专属骰子', {
      size: FONT_SIZE.caption, color: THEME.creamDp, shadowDistance: 2, shadowAlpha: 0.4,
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = W / 2;
    subtitle.y = 32 + FONT_SIZE.h1 + SPACING.titleToContent / 2;
    this.contentLayer.addChild(subtitle);

    // 职业卡片
    const classes: ClassId[] = ['warrior', 'mage', 'rogue'];
    let cardY = CARDS_START_Y;

    for (const classId of classes) {
      const ac = this.createAnimCard(classId, CARD_H_COLLAPSED);
      ac.outer.x = SPACING.screenEdge;
      ac.outer.y = cardY;
      this.contentLayer.addChild(ac.outer);
      this.animCards.push(ac);
      cardY += CARD_H_COLLAPSED + SPACING.cardGap;
    }

    this.rebuildConfirmButton();
    this.playEntrance();
  }

  private createParticles(H: number) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const size = 2 + Math.floor(Math.random() * 2) * 2;
      const g = new Graphics();
      const colors = [PALETTE.nightSky, PALETTE.moonlight, PALETTE.darkRed];
      const color = colors[Math.floor(Math.random() * colors.length)];
      g.beginFill(color);
      g.drawRect(0, 0, size, size);
      g.endFill();
      const duration = 3 + Math.random() * 4;
      const x = Math.random() * W;
      const y = H * 0.2 + Math.random() * H * 0.6;
      g.x = Math.floor(x);
      g.y = Math.floor(y);
      g.alpha = 0;
      this.container.addChild(g);
      this.particles.push({
        g, x, y,
        vy: -(60 + Math.random() * 40) / duration,
        vx: (-10 + Math.random() * 20) / duration,
        life: Math.random() * duration,
        maxLife: duration,
        size,
        opacity: 0.25 + Math.random() * 0.2,
      });
    }
  }

  private createAnimCard(classId: ClassId, h: number): AnimCard {
    const outer = new Container();
    outer.eventMode = 'static';
    outer.cursor = 'pointer';

    const clipMask = new Graphics();
    clipMask.beginFill(0xffffff);
    clipMask.drawRect(0, 0, CARD_W + 8, h + 8);
    clipMask.endFill();
    outer.addChild(clipMask);

    const inner = new Container();
    inner.mask = clipMask;
    outer.addChild(inner);

    const panelGfx = new Graphics();
    inner.addChild(panelGfx);

    const ac: AnimCard = { outer, inner, clipMask, panelGfx, classId, currentH: h, targetH: h };
    this.drawCardContent(ac, false);

    outer.on('pointertap', () => {
      if (this.animating || this.confirming) return;
      if (this.selected === classId) return;
      playSfx('select');
      this.selectClass(classId);
    });

    return ac;
  }

  private drawCardContent(ac: AnimCard, expanded: boolean) {
    const { inner, panelGfx, classId } = ac;
    while (inner.children.length > 1) {
      inner.removeChildAt(inner.children.length - 1);
    }

    const def = CLASS_DEFS[classId];
    const isSelected = this.selected === classId;
    const theme = CLASS_THEME[classId];
    const h = expanded ? CARD_H_EXPANDED : CARD_H_COLLAPSED;

    panelGfx.clear();
    drawCardPanel(panelGfx, CARD_W, h, { selected: isSelected, themeColor: theme.main });

    // 选中态左侧竖条
    if (isSelected) {
      const barX = STROKE.outline + STROKE.border;
      const barY = STROKE.outline + STROKE.border + 4;
      const barH = h - (STROKE.outline + STROKE.border) * 2 - 8;
      const accent = new Graphics();
      accent.beginFill(theme.main, 0.85);
      accent.drawRect(barX, barY, 4, barH);
      accent.endFill();
      accent.beginFill(lightenColor(theme.main, 0.2), 0.3);
      accent.drawRect(barX, barY, 2, barH);
      accent.endFill();
      accent.beginFill(0x000000, 0.3);
      accent.drawRect(barX + 3, barY, 1, barH);
      accent.endFill();
      inner.addChild(accent);
    }

    // 职业图标
    const iconPixelSize = 8;
    const iconSprite = getPixelSprite(CLASS_ICONS[classId], iconPixelSize, `class_icon_${classId}_${Date.now()}`);
    iconSprite.x = SPACING.cardPadLeft;
    iconSprite.y = SPACING.cardPadTop;
    inner.addChild(iconSprite);

    const textX = SPACING.cardPadLeft + 7 * iconPixelSize + SPACING.iconToText;

    // 职业名称
    const nameText = createText(def.name, {
      size: FONT_SIZE.h3, color: theme.light, bold: true,
      shadowDistance: 2, shadowAlpha: 0.8,
    });
    nameText.x = textX;
    nameText.y = SPACING.cardPadTop;
    inner.addChild(nameText);

    // 职业称号
    const titleText = createText(def.title, {
      size: FONT_SIZE.caption, color: theme.main, bold: true,
      shadowDistance: 2, shadowAlpha: 0.4,
    });
    titleText.x = textX + nameText.width + 12;
    titleText.y = SPACING.cardPadTop + 4;
    inner.addChild(titleText);

    // 描述
    const maxDescW = CARD_W - textX - SPACING.cardPadRight;
    const descText = createText(def.description, {
      size: FONT_SIZE.body, color: THEME.creamDk, maxWidth: maxDescW,
      shadowDistance: 2, shadowAlpha: 0.6,
    });
    descText.x = textX;
    descText.y = SPACING.cardPadTop + FONT_SIZE.h3 + 8;
    inner.addChild(descText);

    // 属性行
    const statsData = [
      { label: '抽骰', value: def.drawCount },
      { label: '出牌', value: def.maxPlays },
      { label: '重投', value: def.freeRerolls },
      { label: 'HP', value: def.hp },
    ];
    let sx = textX;
    const statsY = SPACING.cardPadTop + FONT_SIZE.h3 + 8 + FONT_SIZE.body * 1.5 + 8;
    for (const stat of statsData) {
      const lbl = createText(stat.label, {
        size: FONT_SIZE.caption, color: THEME.creamDp, shadowDistance: 2, shadowAlpha: 0.4,
      });
      lbl.x = sx;
      lbl.y = statsY;
      inner.addChild(lbl);
      sx += lbl.width + 4;
      const val = createText(String(stat.value), {
        size: FONT_SIZE.caption, color: THEME.creamHi, bold: true,
        shadowDistance: 2, shadowAlpha: 0.4,
      });
      val.x = sx;
      val.y = statsY;
      inner.addChild(val);
      sx += val.width + 12;
    }

    // 特性标签
    const tags: string[] = [];
    if (def.canBloodReroll) tags.push('卖血');
    if (def.keepUnplayed) tags.push('留牌');
    if (classId === 'rogue') tags.push('连击');
    if (tags.length > 0) {
      const tagText = createText(tags.join(' '), {
        size: FONT_SIZE.caption, color: theme.light, bold: true,
        shadowDistance: 2, shadowAlpha: 0.4,
      });
      tagText.x = CARD_W - tagText.width - SPACING.cardPadRight;
      tagText.y = statsY;
      inner.addChild(tagText);
    }

    // 展开区域
    if (expanded) {
      const skillSection = this.buildSkillSection(classId, CARD_W, theme);
      skillSection.y = CARD_H_COLLAPSED;
      skillSection.alpha = 0;
      inner.addChild(skillSection);
      TweenManager.to(skillSection, { alpha: 1 }, {
        duration: ANIM_DURATION * 0.6,
        delay: ANIM_DURATION * 0.3,
        ease: Ease.easeOut,
      });
    }
  }

  private updateClipMask(ac: AnimCard, h: number) {
    ac.clipMask.clear();
    ac.clipMask.beginFill(0xffffff);
    ac.clipMask.drawRect(-1, -1, CARD_W + 10, h + 10);
    ac.clipMask.endFill();
    ac.currentH = h;
  }

  private buildSkillSection(
    classId: ClassId, cardW: number,
    theme: { main: number; light: number; dark: number },
  ): Container {
    const section = new Container();
    const def = CLASS_DEFS[classId];

    // 分隔线
    const divider = new Graphics();
    const divX = SPACING.cardPadLeft;
    const divW = cardW - SPACING.cardPadLeft - SPACING.cardPadRight;
    divider.beginFill(theme.main, 0.4);
    divider.drawRect(divX, 0, divW, 2);
    divider.endFill();
    divider.beginFill(theme.dark, 0.3);
    divider.drawRect(divX, 2, divW, 2);
    divider.endFill();
    section.addChild(divider);

    const skillTitle = createText('\u25C6 职业技能 \u25C6', {
      size: FONT_SIZE.caption, color: theme.main, bold: true,
      shadowDistance: 2, shadowAlpha: 0.4,
    });
    skillTitle.x = SPACING.cardPadLeft;
    skillTitle.y = 10;
    section.addChild(skillTitle);

    def.skills.forEach((skill, i) => {
      const yPos = 30 + i * 72;

      const nameBg = new Graphics();
      const nbx = SPACING.cardPadLeft;
      const nby = yPos;
      const nbw = 100;
      const nbh = 24;
      nameBg.beginFill(theme.main, 0.15);
      nameBg.drawRect(nbx, nby, nbw, nbh);
      nameBg.endFill();
      nameBg.beginFill(theme.main, 0.4);
      nameBg.drawRect(nbx, nby, nbw, 2);
      nameBg.drawRect(nbx, nby + nbh - 2, nbw, 2);
      nameBg.drawRect(nbx, nby + 2, 2, nbh - 4);
      nameBg.drawRect(nbx + nbw - 2, nby + 2, 2, nbh - 4);
      nameBg.endFill();
      section.addChild(nameBg);

      const nameT = createText(skill.name, {
        size: FONT_SIZE.caption, color: theme.light, bold: true,
        shadowDistance: 2, shadowAlpha: 0.4,
      });
      nameT.x = nbx + 6;
      nameT.y = nby + 4;
      section.addChild(nameT);

      const descT = createText(skill.desc, {
        size: FONT_SIZE.caption, color: THEME.creamDk,
        maxWidth: cardW - nbx - nbw - SPACING.cardPadRight - 16,
        shadowDistance: 2, shadowAlpha: 0.4,
      });
      descT.x = nbx + nbw + 12;
      descT.y = nby + 4;
      section.addChild(descT);
    });

    return section;
  }

  private getCardsBottomY(): number {
    let maxBottom = CARDS_START_Y;
    for (const ac of this.animCards) {
      const bottom = ac.outer.y + ac.currentH;
      if (bottom > maxBottom) maxBottom = bottom;
    }
    return maxBottom;
  }

  private rebuildConfirmButton() {
    if (this.confirmBtn && this.contentLayer) {
      this.contentLayer.removeChild(this.confirmBtn);
    }

    const container = new Container();
    const btnGfx = new Graphics();
    const isActive = !!this.selected && !this.confirming;
    const btnColor = isActive ? 0x18803a : THEME.grayDk;

    drawButton(btnGfx, CONFIRM_BTN_W, CONFIRM_BTN_H, btnColor);
    container.addChild(btnGfx);

    const btnLabel = this.selected
      ? `选择 ${CLASS_DEFS[this.selected].name} 开启冒险`
      : '请选择一个职业';
    const textColor = isActive ? 0xc8ffd0 : THEME.grayLt;
    const text = createText(btnLabel, {
      size: FONT_SIZE.h3, color: textColor, bold: true,
      shadowDistance: 2, shadowAlpha: 0.8,
    });
    text.anchor.set(0.5, 0.5);
    text.x = CONFIRM_BTN_W / 2;
    text.y = (CONFIRM_BTN_H - STROKE.shadow) / 2;
    container.addChild(text);

    container.x = (W - CONFIRM_BTN_W) / 2;
    container.y = this.getCardsBottomY() + SPACING.cardGap;

    if (isActive) {
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointerdown', () => {
        btnGfx.clear();
        drawButton(btnGfx, CONFIRM_BTN_W, CONFIRM_BTN_H, btnColor, true);
        text.y = (CONFIRM_BTN_H - STROKE.shadow) / 2 + 2;
      });
      container.on('pointerup', () => {
        btnGfx.clear();
        drawButton(btnGfx, CONFIRM_BTN_W, CONFIRM_BTN_H, btnColor);
        text.y = (CONFIRM_BTN_H - STROKE.shadow) / 2;
      });
      container.on('pointerupoutside', () => {
        btnGfx.clear();
        drawButton(btnGfx, CONFIRM_BTN_W, CONFIRM_BTN_H, btnColor);
        text.y = (CONFIRM_BTN_H - STROKE.shadow) / 2;
      });
      container.on('pointertap', () => this.handleConfirm());
    } else {
      container.alpha = 0.5;
    }

    this.contentLayer!.addChild(container);
    this.confirmBtn = container;
  }

  private updateConfirmBtnPosition() {
    if (!this.confirmBtn) return;
    this.confirmBtn.y = this.getCardsBottomY() + SPACING.cardGap;
  }

  private selectClass(classId: ClassId) {
    if (this.animating) return;
    this.animating = true;
    this.selected = classId;

    this.animCards.forEach((ac) => {
      const isTarget = ac.classId === classId;
      const newH = isTarget ? CARD_H_EXPANDED : CARD_H_COLLAPSED;
      ac.targetH = newH;

      this.drawCardContent(ac, isTarget);

      const startH = ac.currentH;
      const proxy = { val: startH };
      gsap.to(proxy, {
        val: newH,
        duration: ANIM_DURATION,
        ease: 'power2.inOut',
        onUpdate: () => {
          const h = Math.round(proxy.val);
          this.updateClipMask(ac, h);
          ac.panelGfx.clear();
          drawCardPanel(ac.panelGfx, CARD_W, h, {
            selected: ac.classId === classId,
            themeColor: CLASS_THEME[ac.classId].main,
          });
        },
      });
    });

    let cardY = CARDS_START_Y;
    this.animCards.forEach((ac) => {
      TweenManager.to(ac.outer, { y: cardY }, {
        duration: ANIM_DURATION,
        ease: Ease.easeInOut,
        onUpdate: () => this.updateConfirmBtnPosition(),
      });
      cardY += ac.targetH + SPACING.cardGap;
    });

    this.rebuildConfirmButton();
    setTimeout(() => { this.animating = false; }, ANIM_DURATION * 1000 + 50);
  }

  private playEntrance() {
    if (!this.contentLayer) return;
    const children = this.contentLayer.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as Container;
      if (!child) continue;
      const origY = child.y;
      child.y = origY + 24;
      child.alpha = 0;
      TweenManager.to(child, { y: origY, alpha: 1 }, {
        duration: 0.45,
        ease: Ease.easeOut,
        delay: i * 0.08,
      });
    }
  }

  private handleConfirm() {
    if (!this.selected || this.confirming) return;
    this.confirming = true;
    playSfx('gate_close');

    const H = this.gameApp.designH;
    const mask = new Graphics();
    mask.beginFill(0x000000, 1);
    mask.drawRect(0, 0, W, H);
    mask.endFill();
    mask.alpha = 0;
    this.container.addChild(mask);

    TweenManager.to(mask as any, { alpha: 1 }, {
      duration: 0.6,
      ease: Ease.easeIn,
      onComplete: () => {
        const newGame = createInitialGameState(this.selected!);
        newGame.phase = 'map';
        (newGame as any).playerClass = this.selected;
        this.gameApp.setGame(newGame);
        this.gameApp.sceneManager.switchTo('map');
      },
    });
  }
}
