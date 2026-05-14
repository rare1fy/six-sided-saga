/**
 * UIComponents.ts — 像素风 UI 组件库
 *
 * 混合方案：结构性组件用 Graphics 代码绘制，装饰性元素用贴图叠加。
 * 所有组件基于 v4 配色体系（暗紫底 + 酒红边框 + 米白线条）。
 *
 * 组件清单：
 * - Panel: 九宫格面板（代码绘制，尺寸自适应）
 * - Button: 像素按钮（多色变体 + 按下态）
 * - ProgressBar: 进度条（动态宽度）
 * - Card: 卡片容器（统一边框 + 可选强调色）
 * - Divider: 分隔线
 * - Badge: 徽章
 */
import { Container, Graphics } from 'pixi.js';
import { TUNING } from '../debug/DebugGUI';

// ══════════════════════════════════════════════════════════════
// 配色板 — v4 暗紫底 + 酒红边框 + 米白线条
// ══════════════════════════════════════════════════════════════

export const THEME = {
  // 背景层次
  bgDeep:   0x0c0810,
  bgDark:   0x14101e,
  bgMid:    0x1c1630,
  bgLt:     0x241e3a,

  // 酒红边框
  wineHi:   0xc85868,
  wineLt:   0xa84050,
  wineMd:   0x8a3040,
  wineDk:   0x6a2030,
  wineDp:   0x4a1020,

  // 米白线条
  cream:    0xe8d8c0,
  creamHi:  0xf0e8d8,
  creamDk:  0xc0a880,
  creamDp:  0x8a7858,

  // 功能色
  green:    0x60c040,
  greenDk:  0x308020,
  blue:     0x40a0d0,
  blueDk:   0x206090,
  red:      0xe06050,
  redDk:    0x8a2820,
  gold:     0xf0d860,
  goldMd:   0xe8c040,
  goldDk:   0xb08020,
  purple:   0xa070c0,
  purpleDk: 0x603880,

  // 灰色
  grayLt:   0x6a6a74,
  grayMd:   0x4a4a54,
  grayDk:   0x3a3a44,
} as const;

// ══════════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════════

/** 像素圆角填充矩形（四角各削 2px 斜角） */
function fillRounded(g: Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 1): void {
  g.beginFill(color, alpha);
  // 中间主体
  g.drawRect(x + 2, y, w - 4, h);
  // 左右边
  g.drawRect(x, y + 2, 2, h - 4);
  g.drawRect(x + w - 2, y + 2, 2, h - 4);
  // 四角各 1px
  g.drawRect(x + 1, y + 1, 1, 1);
  g.drawRect(x + w - 2, y + 1, 1, 1);
  g.drawRect(x + 1, y + h - 2, 1, 1);
  g.drawRect(x + w - 2, y + h - 2, 1, 1);
  g.endFill();
}

/** 像素圆角 1px 描边 */
function strokeRounded(g: Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 1): void {
  g.beginFill(color, alpha);
  g.drawRect(x + 2, y, w - 4, 1);           // 上
  g.drawRect(x + 2, y + h - 1, w - 4, 1);   // 下
  g.drawRect(x, y + 2, 1, h - 4);            // 左
  g.drawRect(x + w - 1, y + 2, 1, h - 4);   // 右
  g.drawRect(x + 1, y + 1, 1, 1);            // 左上
  g.drawRect(x + w - 2, y + 1, 1, 1);        // 右上
  g.drawRect(x + 1, y + h - 2, 1, 1);        // 左下
  g.drawRect(x + w - 2, y + h - 2, 1, 1);    // 右下
  g.endFill();
}

// ══════════════════════════════════════════════════════════════
// Panel — 面板组件
// ══════════════════════════════════════════════════════════════

export type PanelVariant = 'default' | 'selected' | 'dark' | 'tooltip' | 'modal';

export interface PanelOptions {
  width: number;
  height: number;
  variant?: PanelVariant;
  /** 自定义边框色（覆盖 variant 默认值） */
  borderColor?: number;
  /** 自定义填充色 */
  fillColor?: number;
  /** 是否显示米白内线 */
  innerLine?: boolean;
  /** 整体透明度 */
  alpha?: number;
}

export function createPanel(opts: PanelOptions): Graphics {
  const {
    width, height,
    variant = 'default',
    borderColor, fillColor,
    innerLine = true,
    alpha = 1,
  } = opts;

  const g = new Graphics();

  // 根据 variant 确定颜色
  let border1: number;
  let border2: number;
  let fill: number;
  let lineColor: number;

  switch (variant) {
    case 'selected':
      border1 = borderColor ?? THEME.goldMd;
      border2 = THEME.goldDk;
      fill = fillColor ?? THEME.bgDark;
      lineColor = THEME.goldDk;
      break;
    case 'dark':
      border1 = borderColor ?? THEME.grayDk;
      border2 = THEME.grayDk;
      fill = fillColor ?? THEME.bgDeep;
      lineColor = THEME.grayDk;
      break;
    case 'tooltip':
      border1 = borderColor ?? THEME.creamDk;
      border2 = THEME.creamDk;
      fill = fillColor ?? THEME.bgDeep;
      lineColor = THEME.creamDp;
      break;
    case 'modal':
      border1 = borderColor ?? THEME.wineMd;
      border2 = THEME.wineDk;
      fill = fillColor ?? THEME.bgDeep;
      lineColor = THEME.creamDp;
      break;
    default:
      border1 = borderColor ?? THEME.wineMd;
      border2 = THEME.wineDk;
      fill = fillColor ?? THEME.bgDark;
      lineColor = THEME.creamDp;
  }

  // 从 TUNING 读取描边参数
  const outlineW = TUNING.outline;
  const borderW = TUNING.border;

  // 1. 黑色轮廓（圆角）
  fillRounded(g, 0, 0, width, height, 0x000000);

  // 2. 双层边框（宽度由 TUNING 控制）
  for (let i = 0; i < borderW; i++) {
    const off = outlineW + i;
    strokeRounded(g, off, off, width - off * 2, height - off * 2, i === 0 ? border1 : border2);
  }

  // 3. 米白内线（可选）
  const lineOff = outlineW + borderW;
  if (innerLine) {
    strokeRounded(g, lineOff, lineOff, width - lineOff * 2, height - lineOff * 2, lineColor);
  }

  // 4. 深紫填充
  const inset = innerLine ? lineOff + 1 : lineOff;
  fillRounded(g, inset, inset, width - inset * 2, height - inset * 2, fill);

  // 5. 顶部微弱高光
  g.beginFill(THEME.cream, TUNING.innerHighlight);
  g.drawRect(inset + 1, inset, width - inset * 2 - 2, 1);
  g.endFill();

  // 6. 底部暗面
  g.beginFill(0x000000, TUNING.innerShadow);
  g.drawRect(inset + 1, inset + height - inset * 2 - 1, width - inset * 2 - 2, 1);
  g.endFill();

  g.alpha = alpha;
  return g;
}

// ══════════════════════════════════════════════════════════════
// Button — 按钮组件
// ══════════════════════════════════════════════════════════════

export type BtnColor = 'green' | 'purple' | 'red' | 'gold' | 'gray' | 'cream' | 'ghost' | 'wine';

interface BtnPalette {
  border: number;
  bodyHi: number;
  bodyMd: number;
  bodyDk: number;
}

const BTN_PALETTES: Record<BtnColor, BtnPalette> = {
  green:  { border: 0x288818, bodyHi: 0x58c848, bodyMd: 0x40a830, bodyDk: 0x288818 },
  purple: { border: 0x583080, bodyHi: 0x9868b8, bodyMd: 0x7848a0, bodyDk: 0x583080 },
  red:    { border: 0x882020, bodyHi: 0xd85848, bodyMd: 0xb83838, bodyDk: 0x882020 },
  gold:   { border: 0x987818, bodyHi: 0xe8c848, bodyMd: 0xc8a030, bodyDk: 0x987818 },
  gray:   { border: 0x343440, bodyHi: 0x5a5a64, bodyMd: 0x444450, bodyDk: 0x343440 },
  cream:  { border: 0xc0a880, bodyHi: 0xe8d8c0, bodyMd: 0xc0a880, bodyDk: 0x8a7858 },
  ghost:  { border: 0x8a7858, bodyHi: 0x241e3a, bodyMd: 0x14101e, bodyDk: 0x0c0810 },
  wine:   { border: 0x6a2030, bodyHi: 0xc85868, bodyMd: 0x8a3040, bodyDk: 0x6a2030 },
};

export interface ButtonOptions {
  width: number;
  height: number;
  color?: BtnColor;
  disabled?: boolean;
  /** 按钮文字（由调用方自行叠加 Text，这里只画背景） */
}

export function createButtonBg(opts: ButtonOptions): { normal: Graphics; pressed: Graphics } {
  const { width: w, height: h, color = 'green' } = opts;
  const pal = BTN_PALETTES[color];

  const normal = new Graphics();
  const pressed = new Graphics();

  // --- Normal ---
  // 底部阴影
  normal.beginFill(0x000000, 0.5);
  normal.drawRect(2, h - 2, w - 4, 2);
  normal.endFill();
  // 黑色轮廓
  fillRounded(normal, 0, 0, w, h - 2, 0x000000);
  // 主体
  fillRounded(normal, 1, 1, w - 2, h - 4, pal.bodyMd);
  // 顶部高光
  normal.beginFill(pal.bodyHi);
  normal.drawRect(3, 1, w - 6, 2);
  normal.endFill();
  // 底部暗影
  normal.beginFill(pal.bodyDk);
  normal.drawRect(3, h - 5, w - 6, 2);
  normal.endFill();
  // 边框色
  strokeRounded(normal, 0, 0, w, h - 2, pal.border);

  // --- Pressed ---
  fillRounded(pressed, 0, 2, w, h - 2, 0x000000);
  fillRounded(pressed, 1, 3, w - 2, h - 4, pal.bodyDk);
  strokeRounded(pressed, 0, 2, w, h - 2, pal.border);

  return { normal, pressed };
}

/** 创建完整的交互式按钮容器 */
export function createInteractiveButton(
  label: string,
  opts: ButtonOptions & { fontSize?: number; textColor?: number; onTap?: () => void },
): Container {
  const { fontSize = 14, textColor, onTap, disabled = false, color = 'green' } = opts;
  const { normal, pressed } = createButtonBg(opts);

  const container = new Container();
  container.eventMode = disabled ? 'none' : 'static';
  container.cursor = disabled ? 'default' : 'pointer';

  pressed.visible = false;
  container.addChild(normal);
  container.addChild(pressed);

  // 文字层
  const { createText: ct } = require('../UIFactory');
  const txtColor = textColor ?? (color === 'cream' ? 0x2a1e14 : 0xffffff);
  const text = ct(label, { size: fontSize, color: txtColor, bold: true, shadow: true });
  text.anchor.set(0.5, 0.5);
  text.x = opts.width / 2;
  text.y = (opts.height - 4) / 2;

  const contentLayer = new Container();
  contentLayer.addChild(text);
  container.addChild(contentLayer);

  if (disabled) {
    container.alpha = 0.5;
    return container;
  }

  container.on('pointerdown', () => {
    normal.visible = false;
    pressed.visible = true;
    contentLayer.y = 2;
  });
  container.on('pointerup', () => {
    normal.visible = true;
    pressed.visible = false;
    contentLayer.y = 0;
  });
  container.on('pointerupoutside', () => {
    normal.visible = true;
    pressed.visible = false;
    contentLayer.y = 0;
  });
  if (onTap) {
    container.on('pointertap', onTap);
  }

  // 暴露 contentLayer 供外部添加图标
  (container as any).contentLayer = contentLayer;

  return container;
}

// ══════════════════════════════════════════════════════════════
// ProgressBar — 进度条组件
// ══════════════════════════════════════════════════════════════

export type BarType = 'hp' | 'mp' | 'xp' | 'poison' | 'armor' | 'red';

const BAR_COLORS: Record<BarType, { hi: number; md: number; dk: number }> = {
  hp:     { hi: 0x78d858, md: 0x60c040, dk: 0x308020 },
  mp:     { hi: 0x58b8e0, md: 0x40a0d0, dk: 0x206090 },
  xp:     { hi: 0xf0d868, md: 0xe8c040, dk: 0xb08020 },
  poison: { hi: 0x58d878, md: 0x30b850, dk: 0x188830 },
  armor:  { hi: 0x68a8d8, md: 0x4888b8, dk: 0x286898 },
  red:    { hi: 0xe87060, md: 0xc04040, dk: 0x8a2820 },
};

export interface ProgressBarOptions {
  width: number;
  height: number;
  ratio: number;
  type?: BarType;
}

export function createProgressBar(opts: ProgressBarOptions): Container {
  const { width: w, height: h, ratio, type = 'hp' } = opts;
  const colors = BAR_COLORS[type];
  const container = new Container();

  // 背景槽
  const bg = new Graphics();
  bg.beginFill(0x000000);
  bg.drawRect(1, 0, w - 2, h);
  bg.drawRect(0, 1, w, h - 2);
  bg.endFill();
  bg.beginFill(0x0a0810);
  bg.drawRect(1, 1, w - 2, h - 2);
  bg.endFill();
  // 内嵌阴影
  bg.beginFill(0x000000, 0.4);
  bg.drawRect(1, 1, w - 2, 1);
  bg.endFill();
  container.addChild(bg);

  // 填充条
  if (ratio > 0) {
    const fillW = Math.max(1, Math.round((w - 2) * Math.min(ratio, 1)));
    const fill = new Graphics();
    fill.beginFill(colors.md);
    fill.drawRect(1, 1, fillW, h - 2);
    fill.endFill();
    // 顶部高光
    fill.beginFill(colors.hi);
    fill.drawRect(1, 1, fillW, 2);
    fill.endFill();
    // 底部暗影
    fill.beginFill(colors.dk);
    fill.drawRect(1, h - 3, fillW, 2);
    fill.endFill();
    // 中间亮线
    fill.beginFill(0xffffff, 0.15);
    fill.drawRect(1, 3, fillW, 1);
    fill.endFill();
    container.addChild(fill);
  }

  return container;
}

// ══════════════════════════════════════════════════════════════
// Card — 卡片组件
// ══════════════════════════════════════════════════════════════

export interface CardOptions {
  width: number;
  height: number;
  /** 底部强调条颜色（null = 无强调条） */
  accentColor?: number | null;
  /** 是否选中态 */
  selected?: boolean;
}

export function createCard(opts: CardOptions): Graphics {
  const { width: w, height: h, accentColor = null, selected = false } = opts;
  const g = new Graphics();

  // 从 TUNING 读取描边参数
  const outW = TUNING.outline;
  const brdW = selected ? TUNING.borderSelected : TUNING.border;

  // 黑色轮廓
  fillRounded(g, 0, 0, w, h, 0x000000);

  // 边框（宽度由 TUNING 控制）
  const borderColor = selected ? THEME.goldMd : THEME.wineDk;
  for (let i = 0; i < brdW; i++) {
    const off = outW + i;
    strokeRounded(g, off, off, w - off * 2, h - off * 2, i === 0 ? borderColor : (selected ? THEME.goldDk : THEME.wineDp));
  }

  // 米白内线
  const lineOff2 = outW + brdW;
  strokeRounded(g, lineOff2, lineOff2, w - lineOff2 * 2, h - lineOff2 * 2, selected ? THEME.goldDk : THEME.creamDp);

  // 填充
  const cardInset = lineOff2 + 1;
  fillRounded(g, cardInset, cardInset, w - cardInset * 2, h - cardInset * 2, THEME.bgDark);

  // 顶部微光
  g.beginFill(THEME.cream, TUNING.innerHighlight);
  g.drawRect(cardInset + 1, cardInset, w - cardInset * 2 - 2, 1);
  g.endFill();

  // 底部强调条
  if (accentColor !== null && accentColor !== undefined) {
    g.beginFill(accentColor);
    g.drawRect(3, h - 5, w - 6, 2);
    g.endFill();
  }

  return g;
}

// ══════════════════════════════════════════════════════════════
// Divider — 分隔线
// ══════════════════════════════════════════════════════════════

export function createDivider(width: number, color: number = THEME.creamDp): Graphics {
  const g = new Graphics();
  g.beginFill(color);
  g.drawRect(0, 0, width, 1);
  g.endFill();
  g.beginFill(color, 0.3);
  g.drawRect(0, 1, width, 1);
  g.endFill();
  return g;
}

// ══════════════════════════════════════════════════════════════
// Badge — 徽章
// ══════════════════════════════════════════════════════════════

export function createBadge(
  width: number, height: number,
  color: number = THEME.wineDk, hiColor: number = THEME.wineHi,
): Graphics {
  const g = new Graphics();
  // 轮廓
  g.beginFill(0x000000);
  g.drawRect(2, 0, width - 4, 1);
  g.drawRect(2, height - 1, width - 4, 1);
  g.drawRect(0, 2, 1, height - 4);
  g.drawRect(width - 1, 2, 1, height - 4);
  g.drawRect(1, 1, 1, 1);
  g.drawRect(width - 2, 1, 1, 1);
  g.drawRect(1, height - 2, 1, 1);
  g.drawRect(width - 2, height - 2, 1, 1);
  g.endFill();
  // 填充
  g.beginFill(color);
  g.drawRect(1, 1, width - 2, height - 2);
  g.endFill();
  // 高光
  g.beginFill(hiColor);
  g.drawRect(2, 1, width - 4, 2);
  g.endFill();
  return g;
}
