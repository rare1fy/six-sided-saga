/**
 * ClassSelectScene - 职业选择界面 (PixiJS)
 * 西幻像素风：微妙石砖纹理 + 四周暗角 + 漂浮粒子氛围 + 展开/收起动画
 */
import { Container, Graphics } from 'pixi.js';
import type { GameScene } from '../SceneManager';
import type { GameApp } from '../GameApp';
import { createButton, createText, COLORS, S } from '../UIFactory';
import { getPixelSprite } from '../AssetProvider';
import { CLASS_DEFS, type ClassId } from '../../data/classes';
import { createInitialGameState } from '../../logic/gameInit';
import { TweenManager, Ease } from '../animation/Tween';
import gsap from 'gsap';
import { playSfx } from '../SoundBridge';

const W = 720;
const sc = (v: number) => Math.round(v * S);
const s = (v: number) => Math.round(v * S);

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
  warrior: WARRIOR_ICON,
  mage: MAGE_ICON,
  rogue: ROGUE_ICON,
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
// 纹理绘制工具
// ============================================================

/** 简易伪随机 */
function noise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** HSL 转 hex */
function hslToHex(h: number, sat: number, light: number): number {
  const s2 = sat / 100;
  const l = light / 100;
  const a = s2 * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

/**
 * 绘制背景：深色基底 + 极微妙石砖暗纹 + 四周径向暗角
 * 纹理只做"若隐若现"的底色，不抢卡片视觉焦点
 */
function drawBackground(g: Graphics, w: number, h: number): void {
  // 深色基底
  g.beginFill(0x0a0812, 1);
  g.drawRect(0, 0, w, h);
  g.endFill();

  // 石砖暗纹 — 极低对比度，只在仔细看时才能察觉
  const brickW = sc(36);
  const brickH = sc(18);
  for (let row = 0; row * brickH < h; row++) {
    const offsetX = (row % 2) * (brickW / 2);
    for (let col = -1; col * brickW < w + brickW; col++) {
      const bx = col * brickW + offsetX;
      const by = row * brickH;
      // 砖块微妙色差（alpha 极低）
      const tint = ((row + col) % 2 === 0) ? 0xffffff : 0x000000;
      const tintA = ((row + col) % 2 === 0) ? 0.012 : 0.03;
      g.beginFill(tint, tintA);
      g.drawRect(bx + 1, by + 1, brickW - 2, brickH - 2);
      g.endFill();
    }
    // 水平砖缝（1px，极淡）
    g.beginFill(0x000000, 0.08);
    g.drawRect(0, row * brickH, w, 1);
    g.endFill();
  }
  // 垂直砖缝
  for (let row = 0; row * brickH < h; row++) {
    const offsetX = (row % 2) * (brickW / 2);
    for (let col = 0; col * brickW < w + brickW; col++) {
      const bx = col * brickW + offsetX;
      g.beginFill(0x000000, 0.06);
      g.drawRect(bx, row * brickH, 1, brickH);
      g.endFill();
    }
  }

  // 稀疏噪点（增加一点粗糙质感）
  for (let py = 0; py < h; py += 8) {
    for (let px = 0; px < w; px += 10) {
      const n = noise(px, py);
      if (n > 0.82) {
        g.beginFill(0xffffff, 0.015);
        g.drawRect(px, py, 1, 1);
        g.endFill();
      } else if (n < 0.08) {
        g.beginFill(0x000000, 0.08);
        g.drawRect(px, py, 1, 1);
        g.endFill();
      }
    }
  }

  // === 四周暗角（上下左右都有，形成隧道/地牢感） ===
  const vignetteSteps = 20;

  // 上方暗角
  for (let i = 0; i < vignetteSteps; i++) {
    const a = 0.5 * Math.pow(1 - i / vignetteSteps, 2);
    g.beginFill(0x000000, a);
    g.drawRect(0, i * sc(5), w, sc(5));
    g.endFill();
  }
  // 下方暗角
  for (let i = 0; i < vignetteSteps; i++) {
    const a = 0.5 * Math.pow(1 - i / vignetteSteps, 2);
    g.beginFill(0x000000, a);
    g.drawRect(0, h - (i + 1) * sc(5), w, sc(5));
    g.endFill();
  }
  // 左侧暗角
  for (let i = 0; i < 12; i++) {
    const a = 0.35 * Math.pow(1 - i / 12, 2);
    g.beginFill(0x000000, a);
    g.drawRect(i * sc(6), 0, sc(6), h);
    g.endFill();
  }
  // 右侧暗角
  for (let i = 0; i < 12; i++) {
    const a = 0.35 * Math.pow(1 - i / 12, 2);
    g.beginFill(0x000000, a);
    g.drawRect(w - (i + 1) * sc(6), 0, sc(6), h);
    g.endFill();
  }

  // 中心微弱暖光（让中间区域稍亮，引导视觉焦点）
  const cx = w / 2;
  const cy = h * 0.42;
  for (let r = 8; r >= 0; r--) {
    const radius = sc(60 + r * 25);
    const a = 0.015 * (1 - r / 8);
    g.beginFill(0x2a1808, a);
    g.drawCircle(cx, cy, radius);
    g.endFill();
  }
}

/** 绘制卡片面板 — 像素风粗边框 */
function drawCardPanel(
  g: Graphics, w: number, h: number,
  opts: { bg: number; border: number; selected: boolean; themeColor: number },
): void {
  const { bg, border, selected, themeColor } = opts;
  const bw = selected ? 3 : 2; // 边框粗度：选中3px，未选中2px

  // ── 外部硬阴影（像素风标志性偏移投影）──
  g.beginFill(0x000000, 0.7);
  g.drawRect(4, 4, w, h);
  g.endFill();

  // ── 外层边框（深色，形成双层效果的外圈）──
  g.beginFill(0x000000, selected ? 0.9 : 0.6);
  g.drawRect(0, 0, w, h);
  g.endFill();

  // ── 主体填充（内缩 bw 像素）──
  g.beginFill(bg, 0.95);
  g.drawRect(bw, bw, w - bw * 2, h - bw * 2);
  g.endFill();

  // ── 内层边框高光（紧贴主体内侧，形成凹陷感）──
  // 顶部高光线
  g.beginFill(0xffffff, 0.08);
  g.drawRect(bw, bw, w - bw * 2, 1);
  g.endFill();
  // 左侧高光线
  g.beginFill(0xffffff, 0.05);
  g.drawRect(bw, bw, 1, h - bw * 2);
  g.endFill();
  // 底部暗影线
  g.beginFill(0x000000, 0.4);
  g.drawRect(bw, h - bw - 1, w - bw * 2, 1);
  g.endFill();
  // 右侧暗影线
  g.beginFill(0x000000, 0.25);
  g.drawRect(w - bw - 1, bw, 1, h - bw * 2);
  g.endFill();

  // ── 极微妙水平条纹纹理 ──
  for (let y = bw + 1; y < h - bw; y += 3) {
    g.beginFill(0x000000, 0.035);
    g.drawRect(bw + 1, y, w - bw * 2 - 2, 1);
    g.endFill();
  }

  if (selected) {
    // ── 选中态：外层边框用职业色替换 ──
    // 上边框
    g.beginFill(themeColor, 0.85);
    g.drawRect(0, 0, w, bw);
    g.endFill();
    // 下边框
    g.beginFill(themeColor, 0.7);
    g.drawRect(0, h - bw, w, bw);
    g.endFill();
    // 左边框
    g.beginFill(themeColor, 0.8);
    g.drawRect(0, bw, bw, h - bw * 2);
    g.endFill();
    // 右边框
    g.beginFill(themeColor, 0.65);
    g.drawRect(w - bw, bw, bw, h - bw * 2);
    g.endFill();

    // 边框上的高光（顶部和左侧各1px亮线，模拟光照）
    g.beginFill(0xffffff, 0.2);
    g.drawRect(0, 0, w, 1);
    g.endFill();
    g.beginFill(0xffffff, 0.12);
    g.drawRect(0, 0, 1, h);
    g.endFill();

    // 四角铆钉（加大到5x5）
    const ns = 5;
    const corners = [
      [1, 1], [w - 1 - ns, 1],
      [1, h - 1 - ns], [w - 1 - ns, h - 1 - ns],
    ];
    for (const [cx, cy] of corners) {
      // 铆钉底色
      g.beginFill(themeColor, 0.9);
      g.drawRect(cx, cy, ns, ns);
      g.endFill();
      // 铆钉高光（左上2x2）
      g.beginFill(0xffffff, 0.35);
      g.drawRect(cx, cy, 2, 2);
      g.endFill();
      // 铆钉暗角（右下1x1）
      g.beginFill(0x000000, 0.4);
      g.drawRect(cx + ns - 1, cy + ns - 1, 1, 1);
      g.endFill();
    }

    // 底部职业色渐变条
    for (let i = 0; i < 6; i++) {
      g.beginFill(themeColor, 0.18 - i * 0.03);
      g.drawRect(bw + 1, h - bw - 6 + i, w - bw * 2 - 2, 1);
      g.endFill();
    }
  } else {
    // ── 未选中态：暗色粗边框 ──
    // 上边框
    g.beginFill(border, 0.4);
    g.drawRect(0, 0, w, bw);
    g.endFill();
    // 下边框
    g.beginFill(border, 0.3);
    g.drawRect(0, h - bw, w, bw);
    g.endFill();
    // 左边框
    g.beginFill(border, 0.35);
    g.drawRect(0, bw, bw, h - bw * 2);
    g.endFill();
    // 右边框
    g.beginFill(border, 0.25);
    g.drawRect(w - bw, bw, bw, h - bw * 2);
    g.endFill();

    // 顶部微弱高光
    g.beginFill(0xffffff, 0.04);
    g.drawRect(0, 0, w, 1);
    g.endFill();
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

const CARD_H_COLLAPSED = sc(78);
const CARD_H_EXPANDED = sc(180);
const CARD_GAP = sc(6);
const CARD_X = sc(16);
const CARD_W = W - sc(32);
const CARDS_START_Y = sc(74);
const ANIM_DURATION = 0.4;
const CONFIRM_BTN_GAP = sc(16);

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

  /** 每帧更新：驱动粒子动画 */
  onTick = (delta: number) => {
    const dt = delta * 0.016;
    this.time += dt;

    // 漂浮粒子
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
  }

  private resetParticle(p: FloatParticle) {
    const H = this.gameApp.designH;
    p.x = Math.random() * W;
    p.y = H * 0.3 + Math.random() * H * 0.5;
    const duration = 3 + Math.random() * 4;
    p.life = duration;
    p.maxLife = duration;
    p.vy = -s(60 + Math.random() * 40) / duration;
    p.vx = s(-10 + Math.random() * 20) / duration;
  }

  // ── 完整构建 ──────────────────────────────────────────

  private buildFull() {
    this.container.removeChildren();
    this.animCards = [];
    const H = this.gameApp.designH;

    // 背景
    const bgLayer = new Graphics();
    drawBackground(bgLayer, W, H);
    this.container.addChild(bgLayer);

    // 漂浮粒子（在背景之上、内容之下）
    this.createParticles(H);

    // 内容层
    this.contentLayer = new Container();
    this.container.addChild(this.contentLayer);

    // 标题
    const title = createText('选择职业', {
      size: sc(22), color: COLORS.textBright, bold: true,
      shadowDistance: 3, shadowAlpha: 1.0,
    });
    title.anchor.set(0.5, 0);
    title.x = W / 2;
    title.y = sc(26);
    this.contentLayer.addChild(title);

    // 副标题
    const subtitle = createText('每个职业拥有独特的战斗风格和专属骰子', {
      size: sc(8), color: COLORS.textDim, shadowDistance: 1,
    });
    subtitle.anchor.set(0.5, 0);
    subtitle.x = W / 2;
    subtitle.y = sc(52);
    this.contentLayer.addChild(subtitle);

    // 职业卡片
    const classes: ClassId[] = ['warrior', 'mage', 'rogue'];
    let cardY = CARDS_START_Y;

    for (const classId of classes) {
      const cardH = CARD_H_COLLAPSED;
      const ac = this.createAnimCard(classId, cardH);
      ac.outer.x = CARD_X;
      ac.outer.y = cardY;
      this.contentLayer.addChild(ac.outer);
      this.animCards.push(ac);
      cardY += cardH + CARD_GAP;
    }

    // 确认按钮
    this.rebuildConfirmButton();

    // 入场动画
    this.playEntrance();
  }

  // ── 漂浮粒子 ──────────────────────────────────────────

  private createParticles(H: number) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const size = s(2 + Math.random() * 2);
      const g = new Graphics();
      // 暖色调粒子（琥珀/金色系，呼应西幻氛围）
      const color = hslToHex(30 + Math.random() * 25, 60 + Math.random() * 30, 45 + Math.random() * 20);
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
        vy: -s(60 + Math.random() * 40) / duration,
        vx: s(-10 + Math.random() * 20) / duration,
        life: Math.random() * duration,
        maxLife: duration,
        size,
        opacity: 0.3 + Math.random() * 0.25,
      });
    }
  }

  // ── 创建可动画卡片 ────────────────────────────────────

  private createAnimCard(classId: ClassId, h: number): AnimCard {
    const outer = new Container();
    outer.eventMode = 'static';
    outer.cursor = 'pointer';

    // 裁剪遮罩
    const clipMask = new Graphics();
    clipMask.beginFill(0xffffff);
    clipMask.drawRect(0, 0, CARD_W + 6, h + 6);
    clipMask.endFill();
    outer.addChild(clipMask);

    // 内层容器
    const inner = new Container();
    inner.mask = clipMask;
    outer.addChild(inner);

    // 面板背景
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

  /** 绘制/重绘卡片内容 */
  private drawCardContent(ac: AnimCard, expanded: boolean) {
    const { inner, panelGfx, classId } = ac;
    while (inner.children.length > 1) {
      inner.removeChildAt(inner.children.length - 1);
    }

    const def = CLASS_DEFS[classId];
    const isSelected = this.selected === classId;
    const themeColor = parseInt(def.color.replace('#', ''), 16);
    const lightColor = parseInt(def.colorLight.replace('#', ''), 16);
    const h = expanded ? CARD_H_EXPANDED : CARD_H_COLLAPSED;

    panelGfx.clear();
    drawCardPanel(panelGfx, CARD_W, h, {
      bg: isSelected ? 0x14101c : 0x0c0a12,
      border: isSelected ? themeColor : 0x1a1626,
      selected: isSelected,
      themeColor,
    });

    // 选中态左侧竖条（加粗到4px）
    if (isSelected) {
      const accent = new Graphics();
      accent.beginFill(themeColor, 0.9);
      accent.drawRect(0, 3, 4, h - 6);
      accent.endFill();
      // 竖条高光（左侧1px）
      accent.beginFill(0xffffff, 0.2);
      accent.drawRect(0, 4, 1, h - 8);
      accent.endFill();
      // 竖条暗边（右侧1px）
      accent.beginFill(0x000000, 0.3);
      accent.drawRect(3, 4, 1, h - 8);
      accent.endFill();
      inner.addChild(accent);
    }

    // 职业图标
    const iconPixelSize = sc(6);
    const iconSprite = getPixelSprite(CLASS_ICONS[classId], iconPixelSize, `class_icon_${classId}_${Date.now()}`);
    iconSprite.x = sc(14);
    iconSprite.y = sc(10);
    inner.addChild(iconSprite);

    // 文字区域
    const textX = sc(14) + 7 * iconPixelSize + sc(14);

    const nameText = createText(def.name, {
      size: sc(14), color: lightColor, bold: true,
      shadowDistance: 2, shadowAlpha: 1.0,
    });
    nameText.x = textX;
    nameText.y = sc(8);
    inner.addChild(nameText);

    const titleText = createText(def.title, {
      size: sc(7), color: themeColor, bold: true, shadowDistance: 1,
    });
    titleText.x = textX + nameText.width + sc(6);
    titleText.y = sc(12);
    inner.addChild(titleText);

    const maxDescW = CARD_W - textX - sc(12);
    const descText = createText(def.description, {
      size: sc(8), color: COLORS.text, maxWidth: maxDescW, shadowDistance: 1,
    });
    descText.x = textX;
    descText.y = sc(28);
    inner.addChild(descText);

    // 属性行
    const statsData = [
      { label: '抽骰', value: def.drawCount },
      { label: '出牌', value: def.maxPlays },
      { label: '重投', value: def.freeRerolls },
      { label: 'HP', value: def.hp },
    ];
    let sx = textX;
    const statsY = sc(48);
    for (const stat of statsData) {
      const lbl = createText(stat.label, { size: sc(7), color: COLORS.textDim, shadowDistance: 1 });
      lbl.x = sx;
      lbl.y = statsY;
      inner.addChild(lbl);
      sx += lbl.width + sc(1);
      const val = createText(String(stat.value), {
        size: sc(7), color: COLORS.textBright, bold: true, shadowDistance: 1,
      });
      val.x = sx;
      val.y = statsY;
      inner.addChild(val);
      sx += val.width + sc(6);
    }

    // 特性标签
    const tags: string[] = [];
    if (def.canBloodReroll) tags.push('卖血');
    if (def.keepUnplayed) tags.push('留牌');
    if (classId === 'rogue') tags.push('连击');
    if (tags.length > 0) {
      const tagText = createText(tags.join(' '), {
        size: sc(7), color: lightColor, bold: true, shadowDistance: 1,
      });
      tagText.x = CARD_W - tagText.width - sc(12);
      tagText.y = statsY;
      inner.addChild(tagText);
    }

    // 展开区域
    if (expanded) {
      const skillSection = this.buildSkillSection(classId, CARD_W, themeColor, lightColor);
      skillSection.y = sc(68);
      skillSection.alpha = 0;
      inner.addChild(skillSection);
      TweenManager.to(skillSection, { alpha: 1 }, {
        duration: ANIM_DURATION * 0.6,
        delay: ANIM_DURATION * 0.3,
        ease: Ease.easeOut,
      });
    }
  }

  /** 更新裁剪遮罩 */
  private updateClipMask(ac: AnimCard, h: number) {
    ac.clipMask.clear();
    ac.clipMask.beginFill(0xffffff);
    ac.clipMask.drawRect(-1, -1, CARD_W + 8, h + 8);
    ac.clipMask.endFill();
    ac.currentH = h;
  }

  // ── 技能详情 ──────────────────────────────────────────

  private buildSkillSection(classId: ClassId, cardW: number, themeColor: number, lightColor: number): Container {
    const section = new Container();
    const def = CLASS_DEFS[classId];

    // 像素虚线分隔（加粗到2px高，段更长）
    const divider = new Graphics();
    let dx = sc(10);
    const divEnd = cardW - sc(10);
    while (dx < divEnd) {
      divider.beginFill(themeColor, 0.5);
      divider.drawRect(dx, 0, 6, 2);
      divider.endFill();
      dx += 10;
    }
    section.addChild(divider);

    const skillTitle = createText('◆ 职业技能 ◆', {
      size: sc(8), color: themeColor, bold: true, shadowDistance: 1,
    });
    skillTitle.x = sc(10);
    skillTitle.y = sc(5);
    section.addChild(skillTitle);

    def.skills.forEach((skill, i) => {
      const yPos = sc(20) + i * sc(24);

      const nameBg = new Graphics();
      // 技能名框硬阴影
      nameBg.beginFill(0x000000, 0.4);
      nameBg.drawRect(sc(10) + 2, yPos + 2, sc(52), sc(14));
      nameBg.endFill();
      // 技能名框底色
      nameBg.beginFill(themeColor, 0.18);
      nameBg.drawRect(sc(10), yPos, sc(52), sc(14));
      nameBg.endFill();
      // 技能名框粗边框（2px，用drawRect填充方式）
      const nbx = sc(10); const nby = yPos; const nbw = sc(52); const nbh = sc(14);
      nameBg.beginFill(themeColor, 0.5);
      nameBg.drawRect(nbx, nby, nbw, 2);           // 上
      nameBg.drawRect(nbx, nby + nbh - 2, nbw, 2); // 下
      nameBg.drawRect(nbx, nby + 2, 2, nbh - 4);   // 左
      nameBg.drawRect(nbx + nbw - 2, nby + 2, 2, nbh - 4); // 右
      nameBg.endFill();
      section.addChild(nameBg);

      const nameT = createText(skill.name, {
        size: sc(7), color: lightColor, bold: true, shadowDistance: 1,
      });
      nameT.x = sc(13);
      nameT.y = yPos + sc(2);
      section.addChild(nameT);

      const descT = createText(skill.desc, {
        size: sc(7), color: COLORS.text, maxWidth: cardW - sc(78), shadowDistance: 1,
      });
      descT.x = sc(66);
      descT.y = yPos + sc(2);
      section.addChild(descT);
    });

    return section;
  }

  // ── 确认按钮 ──────────────────────────────────────────

  private rebuildConfirmButton() {
    if (this.confirmBtn && this.contentLayer) {
      this.contentLayer.removeChild(this.confirmBtn);
    }
    const H = this.gameApp.designH;
    const btnW = sc(260);
    const btnLabel = this.selected
      ? `选择 ${CLASS_DEFS[this.selected].name} 开启冒险`
      : '请选择一个职业';
    const btn = createButton(btnLabel, btnW, sc(36), {
      variant: 'primary',
      fontSize: sc(11),
      disabled: !this.selected || this.confirming,
    });
    btn.x = (W - btnW) / 2;
    btn.y = H - sc(52);
    btn.name = 'confirmBtn';
    if (this.selected && !this.confirming) {
      btn.on('pointertap', () => this.handleConfirm());
    }
    this.contentLayer!.addChild(btn);
    this.confirmBtn = btn;
  }

  // ── 选择职业 — 展开/收起动画 ──────────────────────────

  private selectClass(classId: ClassId) {
    this.selected = classId;
    this.animating = true;

    const targetHeights: number[] = [];
    const targetYs: number[] = [];
    let curY = CARDS_START_Y;
    for (const ac of this.animCards) {
      const isTarget = ac.classId === classId;
      const tH = isTarget ? CARD_H_EXPANDED : CARD_H_COLLAPSED;
      targetHeights.push(tH);
      targetYs.push(curY);
      curY += tH + CARD_GAP;
    }

    this.animCards.forEach((ac, idx) => {
      const isTarget = ac.classId === classId;
      const tH = targetHeights[idx];
      const tY = targetYs[idx];
      const startH = ac.currentH;

      this.drawCardContent(ac, isTarget);

      if (startH !== tH) {
        const proxy = { h: startH };
        const def = CLASS_DEFS[ac.classId];
        const themeColor = parseInt(def.color.replace('#', ''), 16);

        gsap.to(proxy, {
          h: tH,
          duration: ANIM_DURATION,
          ease: 'power2.inOut',
          onUpdate: () => {
            const curH = Math.round(proxy.h);
            this.updateClipMask(ac, curH);
            ac.panelGfx.clear();
            drawCardPanel(ac.panelGfx, CARD_W, curH, {
              bg: isTarget ? 0x14101c : 0x0c0a12,
              border: isTarget ? themeColor : 0x1a1626,
              selected: isTarget,
              themeColor,
            });
          },
        });
      } else {
        this.updateClipMask(ac, tH);
      }

      if (ac.outer.y !== tY) {
        TweenManager.to(ac.outer, { y: tY }, {
          duration: ANIM_DURATION,
          ease: Ease.easeInOut,
        });
      }
    });

    this.rebuildConfirmButton();
    setTimeout(() => { this.animating = false; }, ANIM_DURATION * 1000 + 50);
  }

  // ── 入场动画 ──────────────────────────────────────────

  private playEntrance() {
    if (!this.contentLayer) return;
    const children = this.contentLayer.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as Container;
      if (!child) continue;
      const origY = child.y;
      child.y = origY + sc(18);
      child.alpha = 0;
      TweenManager.to(child, { y: origY, alpha: 1 }, {
        duration: 0.45,
        ease: Ease.easeOut,
        delay: i * 0.08,
      });
    }
  }

  // ── 确认选择 ──────────────────────────────────────────

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
