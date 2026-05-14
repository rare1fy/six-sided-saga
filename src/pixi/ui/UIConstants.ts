/**
 * UIConstants — UI 视觉参数常量
 *
 * 所有场景共享的描边、阴影、间距、字号等数值。
 * 修改此处即可全局生效。
 */

export const TUNING = {
  // 描边
  outline: 2,
  border: 2,
  borderSelected: 4,
  glow: 4,
  glowAlpha: 0.25,

  // 阴影
  shadowNormal: 4,
  shadowSelected: 6,
  shadowAlpha: 0.35,
  shadowSelectedAlpha: 0.5,

  // 高光/暗面
  innerHighlight: 0.08,
  innerShadow: 0.2,

  // 间距
  screenEdge: 40,
  cardGap: 20,
  cardPadTop: 20,
  cardPadRight: 24,
  cardPadBottom: 20,
  cardPadLeft: 24,
  iconToText: 16,
  titleToContent: 20,

  // 卡片尺寸
  cardHCollapsed: 120,
  cardHExpanded: 420,
  cardsStartY: 100,

  // 按钮
  confirmBtnW: 400,
  confirmBtnH: 64,

  // 文字
  fontH1: 32,
  fontH2: 24,
  fontH3: 20,
  fontBody: 16,
  fontCaption: 14,

  // 铆钉
  rivetSize: 8,

  // 动画
  animDuration: 0.4,
} as const;
