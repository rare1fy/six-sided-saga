/**
 * UIFactory — PixiJS UI 组件工厂
 * 替代 Tailwind CSS 布局，1:1 复刻原版 pixel-btn 视觉系统
 */
import { Container, Text, TextStyle } from 'pixi.js';
import { Graphics } from 'pixi.js';

// ===== 设计令牌（从原 CSS 变量映射） =====
export const COLORS = {
  bg: 0x0a0a0a,
  panelBg: 0x12101a,
  panelBorder: 0x2a2535,
  text: 0xc8c0d0,
  textBright: 0xe8e0f0,
  textDim: 0x6a6578,
  gold: 0xe8d068,
  green: 0x3cc864,
  red: 0xc8403c,
  blue: 0x3c6cc8,
  purple: 0x8b3cc8,
  hpGreen: 0x2a8a2a,
  mpBlue: 0x2a6ac8,
  orange: 0xe07830,
};

export const FONT = {
  pixel: 'FusionPixel, monospace',
  ui: 'Microsoft YaHei, sans-serif',
};

/**
 * 设计缩放系数
 * 原版 React 设计宽度 = max-w-md = 448px
 * PixiJS Canvas 设计宽度 = 720px
 * 所有原版绝对像素值 × S 得到 Canvas 等比值
 */
export const S = 720 / 448; // ≈ 1.607

// ===== 按钮变体色板（对标 index.css pixel-btn 系统） =====
export type ButtonVariant = 'primary' | 'danger' | 'gold' | 'purple' | 'ghost';

interface ButtonTheme {
  bg: number;
  border: number;
  textColor: number;
  insetTop: number;
  insetBottom: number;
  shadow: number;
}

const BUTTON_THEMES: Record<ButtonVariant, ButtonTheme> = {
  primary: {
    bg: 0x18803a, border: 0x0a3014, textColor: 0xc8ffd0,
    insetTop: 0x3ccc60, insetBottom: 0x0c4418, shadow: 0x042a0c,
  },
  danger: {
    bg: 0xa02820, border: 0x2a0808, textColor: 0xffc8c0,
    insetTop: 0xd04838, insetBottom: 0x601008, shadow: 0x1a0404,
  },
  gold: {
    bg: 0x907020, border: 0x2a2008, textColor: 0xfff0c0,
    insetTop: 0xc8a040, insetBottom: 0x604008, shadow: 0x1a1404,
  },
  purple: {
    bg: 0x582090, border: 0x180830, textColor: 0xe0c0ff,
    insetTop: 0x8840c0, insetBottom: 0x300850, shadow: 0x0c0418,
  },
  ghost: {
    bg: 0x1a1a2e, border: 0x2a2a40, textColor: 0x6a6578,
    insetTop: 0x282840, insetBottom: 0x0e0e1a, shadow: 0x0a0a14,
  },
};

/** 创建圆角矩形面板 */
export function createPanel(
  width: number, height: number,
  opts: { bg?: number; border?: number; borderWidth?: number; radius?: number; alpha?: number } = {},
): Graphics {
  const { bg = COLORS.panelBg, border = COLORS.panelBorder, borderWidth = 1, radius = 4, alpha = 0.95 } = opts;
  const g = new Graphics();
  g.beginFill(bg, alpha);
  g.drawRoundedRect(0, 0, width, height, radius);
  g.endFill();
  if (borderWidth > 0) {
    g.lineStyle(borderWidth, border, 1);
    g.drawRoundedRect(0, 0, width, height, radius);
    g.lineStyle(0);
  }
  return g;
}

/** 创建文字 — 默认像素字体 + 纯黑阴影 */
export function createText(
  str: string,
  opts: {
    size?: number; color?: number; bold?: boolean;
    align?: 'left' | 'center' | 'right'; maxWidth?: number;
    font?: string; shadow?: boolean; shadowDistance?: number; shadowAlpha?: number;
  } = {},
): Text {
  const {
    size = 14, color = COLORS.text, bold = false, align = 'left', maxWidth,
    font = FONT.pixel, shadow = true, shadowDistance = 2, shadowAlpha = 0.8,
  } = opts;
  const style = new TextStyle({
    fontFamily: font,
    fontSize: size,
    fill: color,
    fontWeight: bold ? 'bold' : 'normal',
    align,
    wordWrap: !!maxWidth,
    wordWrapWidth: maxWidth,
    breakWords: true,
    padding: Math.ceil(size * 0.2),
    dropShadow: shadow,
    dropShadowColor: 0x000000,
    dropShadowDistance: shadowDistance,
    dropShadowAngle: Math.PI / 4,
    dropShadowBlur: 0,
    dropShadowAlpha: shadowAlpha,
  });
  return new Text(str, style);
}

// ===== 像素按钮绘制（模拟 CSS box-shadow inset 立体效果） =====

function drawPixelButton(
  g: Graphics, w: number, h: number, theme: ButtonTheme, state: 'normal' | 'hover' | 'press',
): void {
  g.clear();
  const shadowH = 4;
  const bodyH = h - shadowH;

  if (state === 'press') {
    g.beginFill(theme.shadow, 1);
    g.drawRect(0, 0, w, h);
    g.endFill();
    g.beginFill(theme.bg, 1);
    g.drawRect(0, shadowH, w, bodyH);
    g.endFill();
    g.beginFill(theme.insetBottom, 1);
    g.drawRect(3, shadowH + 3, w - 6, 2);
    g.endFill();
    g.beginFill(theme.insetTop, 0.3);
    g.drawRect(3, h - 5, w - 6, 2);
    g.endFill();
    g.lineStyle(3, theme.border, 1);
    g.drawRect(0, shadowH, w, bodyH);
    g.lineStyle(0);
  } else {
    const yOff = state === 'hover' ? -2 : 0;
    g.beginFill(theme.shadow, 1);
    g.drawRect(0, bodyH + yOff, w, shadowH + (state === 'hover' ? 2 : 0));
    g.endFill();
    g.beginFill(theme.bg, 1);
    g.drawRect(0, yOff, w, bodyH);
    g.endFill();
    g.beginFill(theme.insetTop, 1);
    g.drawRect(3, yOff + 3, w - 6, 2);
    g.endFill();
    g.beginFill(theme.insetBottom, 1);
    g.drawRect(3, yOff + bodyH - 5, w - 6, 2);
    g.endFill();
    g.lineStyle(3, theme.border, 1);
    g.drawRect(0, yOff, w, bodyH);
    g.lineStyle(0);
  }
}

/** 创建像素风按钮（支持 variant 变体 + hover/press 动效） */
export function createButton(
  label: string,
  width: number, height: number,
  opts: {
    variant?: ButtonVariant;
    bg?: number; hoverBg?: number; textColor?: number;
    border?: number; fontSize?: number; disabled?: boolean;
  } = {},
): Container {
  const { variant, fontSize = 14, disabled = false } = opts;

  if (variant) {
    return createVariantButton(label, width, height, variant, fontSize, disabled);
  }

  // --- 兼容旧调用 ---
  const { bg = COLORS.green, textColor = 0xffffff, border = 0x1a6b34 } = opts;
  const container = new Container();
  container.eventMode = 'static';
  container.cursor = 'pointer';

  const bgGraphics = new Graphics();
  bgGraphics.beginFill(bg, 1);
  bgGraphics.drawRoundedRect(0, 0, width, height, 4);
  bgGraphics.endFill();
  bgGraphics.lineStyle(2, border, 1);
  bgGraphics.drawRoundedRect(0, 0, width, height, 4);
  bgGraphics.lineStyle(0);
  container.addChild(bgGraphics);

  const highlight = new Graphics();
  highlight.beginFill(0xffffff, 0.15);
  highlight.drawRect(2, 2, width - 4, 2);
  highlight.endFill();
  container.addChild(highlight);

  const text = createText(label, { size: fontSize, color: textColor, bold: true });
  text.anchor.set(0.5, 0.5);
  text.x = width / 2;
  text.y = height / 2;
  container.addChild(text);

  container.on('pointerover', () => { container.y -= 2; });
  container.on('pointerout', () => { container.y += 2; });
  container.on('pointerdown', () => { container.y += 4; });
  container.on('pointerup', () => { container.y -= 4; });
  container.on('pointerupoutside', () => { container.y -= 2; });

  return container;
}

/** 创建带变体主题的像素风按钮 */
function createVariantButton(
  label: string, width: number, height: number,
  variant: ButtonVariant, fontSize: number, disabled: boolean,
): Container {
  const theme = BUTTON_THEMES[variant];
  const container = new Container();
  container.eventMode = disabled ? 'none' : 'static';
  container.cursor = disabled ? 'default' : 'pointer';

  const bgGraphics = new Graphics();
  drawPixelButton(bgGraphics, width, height, theme, 'normal');
  container.addChild(bgGraphics);

  // 内容层：文字 + 图标等子元素一起跟随按钮状态移动
  const contentLayer = new Container();
  contentLayer.y = 0;
  container.addChild(contentLayer);

  const text = createText(label, {
    size: fontSize, color: theme.textColor, bold: true,
    shadow: true, shadowDistance: Math.round(S), shadowAlpha: 0.9,
  });
  text.anchor.set(0.5, 0.5);
  text.x = width / 2;
  text.y = (height - 4) / 2;
  contentLayer.addChild(text);

  // 暴露 contentLayer 供外部添加图标等子元素
  (container as any).contentLayer = contentLayer;

  if (disabled) {
    container.alpha = 0.5;
    return container;
  }

  const baseY = (height - 4) / 2;
  container.on('pointerover', () => {
    drawPixelButton(bgGraphics, width, height, theme, 'hover');
    contentLayer.y = -2;
  });
  container.on('pointerout', () => {
    drawPixelButton(bgGraphics, width, height, theme, 'normal');
    contentLayer.y = 0;
  });
  container.on('pointerdown', () => {
    drawPixelButton(bgGraphics, width, height, theme, 'press');
    contentLayer.y = 4;
  });
  container.on('pointerup', () => {
    drawPixelButton(bgGraphics, width, height, theme, 'hover');
    contentLayer.y = -2;
  });
  container.on('pointerupoutside', () => {
    drawPixelButton(bgGraphics, width, height, theme, 'normal');
    contentLayer.y = 0;
  });

  return container;
}

/** 创建进度条（HP/MP） */
export function createProgressBar(
  width: number, height: number,
  ratio: number,
  opts: { bg?: number; fill?: number; border?: number } = {},
): Container {
  const { bg = 0x222222, fill = COLORS.hpGreen, border = 0x333333 } = opts;
  const container = new Container();

  const bgBar = new Graphics();
  bgBar.beginFill(bg, 1);
  bgBar.drawRoundedRect(0, 0, width, height, height / 2);
  bgBar.endFill();
  bgBar.lineStyle(1, border, 1);
  bgBar.drawRoundedRect(0, 0, width, height, height / 2);
  bgBar.lineStyle(0);
  container.addChild(bgBar);

  if (ratio > 0) {
    const fillBar = new Graphics();
    fillBar.beginFill(fill);
    fillBar.drawRoundedRect(1, 1, (width - 2) * Math.min(ratio, 1), height - 2, (height - 2) / 2);
    fillBar.endFill();
    container.addChild(fillBar);
  }

  return container;
}
