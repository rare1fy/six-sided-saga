/**
 * DebugGUI — 实时调参面板
 *
 * 开发阶段使用 lil-gui 暴露所有视觉参数，
 * 拖滑块即时看到效果，调好后导出 JSON 写回代码。
 *
 * 发布时设置 DEBUG_GUI = false 即可完全移除。
 */
import GUI from 'lil-gui';

// ══════════════════════════════════════════════════════════════
// 全局可调参数（所有场景共享）
// ══════════════════════════════════════════════════════════════

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
};

// ══════════════════════════════════════════════════════════════
// GUI 实例管理
// ══════════════════════════════════════════════════════════════

let gui: GUI | null = null;
let onChangeCallback: (() => void) | null = null;

/**
 * 初始化 Debug GUI 面板
 * @param onChange 参数变化时的回调（通常是重绘当前场景）
 */
export function initDebugGUI(onChange?: () => void): void {
  // 仅浏览器环境
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 避免重复创建
  if (gui) return;

  onChangeCallback = onChange || null;

  gui = new GUI({ title: '\uD83C\uDFA8 UI 调参', width: 260 });
  gui.domElement.style.position = 'fixed';
  gui.domElement.style.top = '0';
  gui.domElement.style.right = '0';
  gui.domElement.style.zIndex = '9999';

  const notify = () => { if (onChangeCallback) onChangeCallback(); };

  // ── 描边 ──
  const fStroke = gui.addFolder('描边 Stroke');
  fStroke.add(TUNING, 'outline', 0, 8, 1).name('外轮廓').onChange(notify);
  fStroke.add(TUNING, 'border', 0, 8, 1).name('边框(未选)').onChange(notify);
  fStroke.add(TUNING, 'borderSelected', 0, 12, 1).name('边框(选中)').onChange(notify);
  fStroke.add(TUNING, 'glow', 0, 12, 1).name('外发光').onChange(notify);
  fStroke.add(TUNING, 'glowAlpha', 0, 1, 0.01).name('发光透明度').onChange(notify);

  // ── 阴影 ──
  const fShadow = gui.addFolder('阴影 Shadow');
  fShadow.add(TUNING, 'shadowNormal', 0, 16, 1).name('普通投影').onChange(notify);
  fShadow.add(TUNING, 'shadowSelected', 0, 16, 1).name('选中投影').onChange(notify);
  fShadow.add(TUNING, 'shadowAlpha', 0, 1, 0.01).name('普通透明度').onChange(notify);
  fShadow.add(TUNING, 'shadowSelectedAlpha', 0, 1, 0.01).name('选中透明度').onChange(notify);

  // ── 高光/暗面 ──
  const fLight = gui.addFolder('高光/暗面');
  fLight.add(TUNING, 'innerHighlight', 0, 0.5, 0.01).name('内高光').onChange(notify);
  fLight.add(TUNING, 'innerShadow', 0, 0.5, 0.01).name('内暗面').onChange(notify);

  // ── 间距 ──
  const fSpacing = gui.addFolder('间距 Spacing');
  fSpacing.add(TUNING, 'screenEdge', 0, 100, 2).name('屏幕边距').onChange(notify);
  fSpacing.add(TUNING, 'cardGap', 0, 60, 2).name('卡片间距').onChange(notify);
  fSpacing.add(TUNING, 'cardPadTop', 0, 60, 2).name('卡片内-上').onChange(notify);
  fSpacing.add(TUNING, 'cardPadRight', 0, 60, 2).name('卡片内-右').onChange(notify);
  fSpacing.add(TUNING, 'cardPadBottom', 0, 60, 2).name('卡片内-下').onChange(notify);
  fSpacing.add(TUNING, 'cardPadLeft', 0, 60, 2).name('卡片内-左').onChange(notify);
  fSpacing.add(TUNING, 'iconToText', 0, 40, 2).name('图标→文字').onChange(notify);
  fSpacing.add(TUNING, 'titleToContent', 0, 60, 2).name('标题→内容').onChange(notify);

  // ── 卡片尺寸 ──
  const fCard = gui.addFolder('卡片 Card');
  fCard.add(TUNING, 'cardHCollapsed', 60, 200, 2).name('收起高度').onChange(notify);
  fCard.add(TUNING, 'cardHExpanded', 200, 600, 2).name('展开高度').onChange(notify);
  fCard.add(TUNING, 'cardsStartY', 40, 200, 2).name('起始Y').onChange(notify);
  fCard.add(TUNING, 'rivetSize', 0, 16, 1).name('铆钉尺寸').onChange(notify);

  // ── 按钮 ──
  const fBtn = gui.addFolder('按钮 Button');
  fBtn.add(TUNING, 'confirmBtnW', 200, 680, 4).name('宽度').onChange(notify);
  fBtn.add(TUNING, 'confirmBtnH', 40, 100, 2).name('高度').onChange(notify);

  // ── 文字 ──
  const fFont = gui.addFolder('文字 Font');
  fFont.add(TUNING, 'fontH1', 16, 64, 1).name('H1 标题').onChange(notify);
  fFont.add(TUNING, 'fontH2', 12, 48, 1).name('H2 副标题').onChange(notify);
  fFont.add(TUNING, 'fontH3', 10, 40, 1).name('H3 卡片名').onChange(notify);
  fFont.add(TUNING, 'fontBody', 8, 32, 1).name('正文').onChange(notify);
  fFont.add(TUNING, 'fontCaption', 6, 24, 1).name('注释').onChange(notify);

  // ── 动画 ──
  const fAnim = gui.addFolder('动画');
  fAnim.add(TUNING, 'animDuration', 0.1, 2, 0.05).name('展开时长(s)');

  // ── 导出 ──
  gui.add({
    exportJSON: () => {
      const json = JSON.stringify(TUNING, null, 2);
      console.log('=== TUNING 导出 ===\n' + json);
      // 复制到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard.writeText(json).then(() => {
          console.log('\u2705 已复制到剪贴板');
        });
      }
    },
  }, 'exportJSON').name('\uD83D\uDCCB 导出JSON到剪贴板');

  // 默认折叠所有
  fStroke.close();
  fShadow.close();
  fLight.close();
  fSpacing.close();
  fCard.close();
  fBtn.close();
  fFont.close();
  fAnim.close();
}

/**
 * 销毁 Debug GUI
 */
export function destroyDebugGUI(): void {
  if (gui) {
    gui.destroy();
    gui = null;
  }
}

/**
 * 设置参数变化回调
 */
export function setDebugOnChange(cb: () => void): void {
  onChangeCallback = cb;
}