/**
 * UIFactory — 用 Pixi Layout 创建 UI 组件
 * 替代 Tailwind CSS 布局，提供类似 CSS 的 Flexbox 能力
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';

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

/** 创建圆角矩形面板 */
export function createPanel(
  width: number, height: number,
  opts: { bg?: number; border?: number; borderWidth?: number; radius?: number; alpha?: number } = {},
): Graphics {
  const { bg = COLORS.panelBg, border = COLORS.panelBorder, borderWidth = 1, radius = 4, alpha = 0.95 } = opts;
  const g = new Graphics();
  g.roundRect(0, 0, width, height, radius);
  g.fill({ color: bg, alpha });
  if (borderWidth > 0) {
    g.roundRect(0, 0, width, height, radius);
    g.stroke({ color: border, width: borderWidth });
  }
  return g;
}

/** 创建文字 */
export function createText(
  str: string,
  opts: { size?: number; color?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; maxWidth?: number } = {},
): Text {
  const { size = 14, color = COLORS.text, bold = false, align = 'left', maxWidth } = opts;
  const style = new TextStyle({
    fontFamily: FONT.ui,
    fontSize: size,
    fill: color,
    fontWeight: bold ? 'bold' : 'normal',
    align,
    wordWrap: !!maxWidth,
    wordWrapWidth: maxWidth,
  });
  return new Text({ text: str, style });
}

/** 创建像素风按钮 */
export function createButton(
  label: string,
  width: number, height: number,
  opts: { bg?: number; hoverBg?: number; textColor?: number; border?: number; fontSize?: number } = {},
): Container {
  const { bg = COLORS.green, hoverBg, textColor = 0xffffff, border = 0x1a6b34, fontSize = 14 } = opts;
  const container = new Container();
  container.eventMode = 'static';
  container.cursor = 'pointer';

  const bgGraphics = new Graphics();
  bgGraphics.roundRect(0, 0, width, height, 4);
  bgGraphics.fill({ color: bg });
  bgGraphics.roundRect(0, 0, width, height, 4);
  bgGraphics.stroke({ color: border, width: 2 });
  container.addChild(bgGraphics);

  // 高光（顶部亮线）
  const highlight = new Graphics();
  highlight.rect(2, 2, width - 4, 2);
  highlight.fill({ color: 0xffffff, alpha: 0.15 });
  container.addChild(highlight);

  const text = createText(label, { size: fontSize, color: textColor, bold: true });
  text.anchor = { x: 0.5, y: 0.5 } as any;
  text.x = width / 2;
  text.y = height / 2;
  container.addChild(text);

  // hover 效果
  if (hoverBg) {
    container.on('pointerover', () => {
      bgGraphics.clear();
      bgGraphics.roundRect(0, 0, width, height, 4);
      bgGraphics.fill({ color: hoverBg });
      bgGraphics.roundRect(0, 0, width, height, 4);
      bgGraphics.stroke({ color: border, width: 2 });
    });
    container.on('pointerout', () => {
      bgGraphics.clear();
      bgGraphics.roundRect(0, 0, width, height, 4);
      bgGraphics.fill({ color: bg });
      bgGraphics.roundRect(0, 0, width, height, 4);
      bgGraphics.stroke({ color: border, width: 2 });
    });
  }

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
  bgBar.roundRect(0, 0, width, height, height / 2);
  bgBar.fill({ color: bg });
  bgBar.roundRect(0, 0, width, height, height / 2);
  bgBar.stroke({ color: border, width: 1 });
  container.addChild(bgBar);

  if (ratio > 0) {
    const fillBar = new Graphics();
    fillBar.roundRect(1, 1, (width - 2) * Math.min(ratio, 1), height - 2, (height - 2) / 2);
    fillBar.fill({ color: fill });
    container.addChild(fillBar);
  }

  return container;
}
