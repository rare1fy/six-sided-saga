/**
 * 六面史诗 · UI 素材修正补丁
 * 
 * 修正问题：
 * 1. 卡片颜色过多 → 统一棕色边框，仅底部强调条区分
 * 2. 立体感不足 → 增强光照方向感（上亮下暗）+ 内嵌阴影
 * 3. 拐角太直角 → 像素圆角（四角削 2px 斜角）
 * 
 * 运行：node scripts/fix-ui-assets.cjs
 * 输出：public/ui/ （覆盖需要修正的素材）
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'public', 'ui');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function savePng(canvas, name) {
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('  [OK] ' + name + ' (' + canvas.width + 'x' + canvas.height + ')');
}
function px(ctx) { ctx.imageSmoothingEnabled = false; return ctx; }
function sp(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
function rgba(r, g, b, a) { return 'rgba(' + r + ',' + g + ',' + b + ',' + (a === undefined ? 1 : a) + ')'; }

const C = {
  black: '#000000',
  bgDeep: '#0e0c14',
  bgDark: '#16122a',
  bgMid: '#1e1a30',
  brnHi: '#9a8060', brnLt: '#8a7050', brnMd: '#6a5438', brnDk: '#4a3824', brnDp: '#2a1e14',
  gldBr: '#f0d860', gldMd: '#d4a030', gldDk: '#8a6a18', gldDp: '#5a4410',
  grnBr: '#50c878', grnMd: '#3a9a52', grnDk: '#1e6b38', grnDp: '#0e4a22',
  redBr: '#e86860', redMd: '#c84040', redDk: '#8a2820', redDp: '#5a1810',
  purBr: '#aa70cc', purMd: '#8a55aa', purDk: '#5a3078', purDp: '#301850',
  bluBr: '#5599dd', bluMd: '#4488cc', bluDk: '#2a5588', bluDp: '#1a3858',
  gryLt: '#6a6a74', gryMd: '#4a4a54', gryDk: '#3a3a44', gryDp: '#2a2a34',
  orgBr: '#f0a040', orgMd: '#d08030', orgDk: '#8a5020',
};

// ══════════════════════════════════════════════════════════════
// 核心：像素圆角轮廓绘制
// ══════════════════════════════════════════════════════════════

/**
 * 绘制带像素圆角的矩形轮廓（2px 斜角）
 * 四角各削掉 [0,0] [1,0] [0,1] 三个像素
 */
function drawRoundedOutline(ctx, x, y, w, h, t, color) {
  ctx.fillStyle = color;
  // 上边（去掉两端各 2px）
  ctx.fillRect(x + 2, y, w - 4, t);
  // 下边
  ctx.fillRect(x + 2, y + h - t, w - 4, t);
  // 左边（去掉两端各 2px）
  ctx.fillRect(x, y + 2, t, h - 4);
  // 右边
  ctx.fillRect(x + w - t, y + 2, t, h - 4);
  // 四角斜角像素（1px 对角线）
  ctx.fillRect(x + 1, y + 1, t, t);           // 左上
  ctx.fillRect(x + w - t - 1, y + 1, t, t);   // 右上
  ctx.fillRect(x + 1, y + h - t - 1, t, t);   // 左下
  ctx.fillRect(x + w - t - 1, y + h - t - 1, t, t); // 右下
}

/**
 * 绘制带像素圆角的填充矩形
 */
function fillRounded(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  // 主体（去掉四角）
  ctx.fillRect(x + 2, y, w - 4, h);
  ctx.fillRect(x, y + 2, 2, h - 4);
  ctx.fillRect(x + w - 2, y + 2, 2, h - 4);
  // 四角各补 1px 斜角
  ctx.fillRect(x + 1, y + 1, 1, 1);
  ctx.fillRect(x + w - 2, y + 1, 1, 1);
  ctx.fillRect(x + 1, y + h - 2, 1, 1);
  ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
}

/**
 * 清除四角像素（用于在已填充的矩形上削角）
 */
function clearCorners(ctx, x, y, w, h) {
  ctx.clearRect(x, y, 2, 1);
  ctx.clearRect(x, y, 1, 2);
  ctx.clearRect(x + w - 2, y, 2, 1);
  ctx.clearRect(x + w - 1, y, 1, 2);
  ctx.clearRect(x, y + h - 1, 2, 1);
  ctx.clearRect(x, y + h - 2, 1, 2);
  ctx.clearRect(x + w - 2, y + h - 1, 2, 1);
  ctx.clearRect(x + w - 1, y + h - 2, 1, 2);
}

// ══════════════════════════════════════════════════════════════
// 1. 修正卡片系列 — 统一棕色边框 + 像素圆角 + 增强立体感
// ══════════════════════════════════════════════════════════════

function fixCards() {
  const S = 32;

  function drawCard(name, accentColor) {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);

    // 1. 硬阴影（右下偏移 2px，带圆角）
    fillRounded(g, 2, 2, S - 2, S - 2, rgba(0, 0, 0, 0.5));

    // 2. 黑色轮廓（带像素圆角）
    fillRounded(g, 0, 0, S - 2, S - 2, C.black);

    // 3. 统一棕色边框 — 上/左亮，下/右暗（3px 宽）
    // 上边框（亮棕）
    g.fillStyle = C.brnLt;
    g.fillRect(3, 1, S - 8, 3);
    g.fillRect(2, 2, 1, 2);
    // 左边框（中棕）
    g.fillStyle = C.brnMd;
    g.fillRect(1, 3, 3, S - 8);
    g.fillRect(2, 2, 2, 1);
    // 下边框（暗棕）
    g.fillStyle = C.brnDk;
    g.fillRect(3, S - 6, S - 8, 3);
    g.fillRect(2, S - 6, 1, 2);
    // 右边框（深棕）
    g.fillStyle = C.brnDp;
    g.fillRect(S - 6, 3, 3, S - 8);
    g.fillRect(S - 6, S - 6, 2, 1);

    // 斜角补丁
    sp(g, 2, 2, C.brnLt);
    sp(g, S - 5, 2, C.brnLt);
    sp(g, 2, S - 5, C.brnDk);
    sp(g, S - 5, S - 5, C.brnDp);

    // 4. 内部填充（深紫底）
    g.fillStyle = C.bgDark;
    g.fillRect(4, 4, S - 10, S - 10);

    // 5. 内嵌阴影（顶部+左侧 2px 暗影 — 凹陷感）
    g.fillStyle = rgba(0, 0, 0, 0.25);
    g.fillRect(4, 4, S - 10, 1);
    g.fillStyle = rgba(0, 0, 0, 0.15);
    g.fillRect(4, 5, S - 10, 1);
    g.fillStyle = rgba(0, 0, 0, 0.2);
    g.fillRect(4, 4, 1, S - 10);
    g.fillStyle = rgba(0, 0, 0, 0.1);
    g.fillRect(5, 4, 1, S - 10);

    // 6. 内部底部+右侧反光（微弱高光 — 凸起感）
    g.fillStyle = rgba(255, 240, 200, 0.06);
    g.fillRect(4, S - 7, S - 10, 1);
    g.fillStyle = rgba(255, 240, 200, 0.04);
    g.fillRect(S - 7, 4, 1, S - 10);

    // 7. 底部强调条（唯一的颜色区分）
    if (accentColor) {
      g.fillStyle = accentColor;
      g.fillRect(4, S - 7, S - 10, 2);
      // 强调条高光
      g.fillStyle = rgba(255, 255, 255, 0.15);
      g.fillRect(4, S - 7, S - 10, 1);
    }

    // 8. 边框高光线（上边框内侧 1px 亮线）
    g.fillStyle = rgba(255, 240, 200, 0.1);
    g.fillRect(4, 1, S - 10, 1);
    // 边框暗影线（下边框外侧 1px）
    g.fillStyle = rgba(0, 0, 0, 0.3);
    g.fillRect(4, S - 4, S - 10, 1);

    savePng(c, name);
  }

  // 所有卡片统一棕色边框，仅底部强调条不同
  drawCard('card-default.png', null);                    // 通用 — 无强调
  drawCard('shop-item-bg.png', C.grnDk);                // 商品 — 绿色条
  drawCard('loot-card.png', C.gldDk);                   // 战利品 — 金色条
  drawCard('event-card.png', C.purDk);                   // 事件 — 紫色条
  drawCard('relic-card.png', C.purMd);                   // 遗物 — 亮紫条
  drawCard('dice-card.png', C.bluDk);                    // 骰子 — 蓝色条
  drawCard('campfire-option.png', '#6a4020');             // 篝火 — 暖棕条
  drawCard('levelup-option.png', C.gldMd);               // 升级 — 亮金条
  drawCard('settings-row.png', null);                    // 设置 — 无强调
  drawCard('log-row.png', null);                         // 日志 — 无强调
  drawCard('stat-row.png', C.gldDp);                     // 统计 — 深金条
}

// ══════════════════════════════════════════════════════════════
// 2. 修正面板系列 — 像素圆角 + 增强立体感
// ══════════════════════════════════════════════════════════════

function fixPanels() {
  const S = 32;

  function drawPanel(name, borderHi, borderMd, borderDk, borderDp, fillColor, rivetHi, rivetLo) {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);

    // 硬阴影（右下 3px）
    fillRounded(g, 3, 3, S - 3, S - 3, rgba(0, 0, 0, 0.45));

    // 黑色轮廓（像素圆角）
    fillRounded(g, 0, 0, S - 3, S - 3, C.black);

    // 边框 — 上/左亮，下/右暗（3px 宽，带光照方向）
    // 上边（亮）
    g.fillStyle = borderHi;
    g.fillRect(4, 1, S - 11, 3);
    g.fillRect(3, 2, 1, 2);
    // 左边（中亮）
    g.fillStyle = borderMd;
    g.fillRect(1, 4, 3, S - 11);
    g.fillRect(2, 3, 2, 1);
    // 下边（暗）
    g.fillStyle = borderDk;
    g.fillRect(4, S - 7, S - 11, 3);
    g.fillRect(3, S - 7, 1, 2);
    // 右边（最暗）
    g.fillStyle = borderDp;
    g.fillRect(S - 7, 4, 3, S - 11);
    g.fillRect(S - 7, S - 7, 2, 1);

    // 斜角
    sp(g, 3, 3, borderHi);
    sp(g, S - 7, 3, borderMd);
    sp(g, 3, S - 7, borderDk);
    sp(g, S - 7, S - 7, borderDp);

    // 内部填充
    g.fillStyle = fillColor;
    g.fillRect(4, 4, S - 11, S - 11);

    // 内嵌阴影（凹陷感）
    g.fillStyle = rgba(0, 0, 0, 0.2);
    g.fillRect(4, 4, S - 11, 1);
    g.fillStyle = rgba(0, 0, 0, 0.12);
    g.fillRect(4, 5, S - 11, 1);
    g.fillStyle = rgba(0, 0, 0, 0.15);
    g.fillRect(4, 4, 1, S - 11);

    // 内部底部反光
    g.fillStyle = rgba(255, 240, 200, 0.05);
    g.fillRect(4, S - 8, S - 11, 1);
    g.fillStyle = rgba(255, 240, 200, 0.03);
    g.fillRect(S - 8, 4, 1, S - 11);

    // 边框高光线
    g.fillStyle = rgba(255, 240, 200, 0.12);
    g.fillRect(5, 1, S - 13, 1);

    // 四角铆钉 3×3
    const rivets = [
      [2, 2], [S - 8, 2], [2, S - 8], [S - 8, S - 8],
    ];
    for (const [rx, ry] of rivets) {
      g.fillStyle = rivetLo;
      g.fillRect(rx, ry, 3, 3);
      g.fillStyle = rivetHi;
      sp(g, rx, ry, rivetHi);
      sp(g, rx + 1, ry, rivetHi);
      sp(g, rx, ry + 1, rivetHi);
      g.fillStyle = rgba(0, 0, 0, 0.4);
      sp(g, rx + 2, ry + 2, rgba(0, 0, 0, 0.4));
    }

    savePng(c, name);
  }

  drawPanel('panel-border.png', C.brnLt, C.brnMd, C.brnDk, C.brnDp, C.bgDark, C.brnHi, C.brnDp);
  drawPanel('panel-border-selected.png', C.gldBr, C.gldMd, C.gldDk, C.gldDp, C.bgDark, C.gldBr, C.gldDk);
  drawPanel('panel-dark.png', C.gryMd, C.gryDk, C.gryDp, C.black, C.bgDeep, C.gryLt, C.black);
}

// ══════════════════════════════════════════════════════════════
// 3. 修正小组件 — 像素圆角 + 立体感
// ══════════════════════════════════════════════════════════════

function fixSmallWidgets() {
  // --- 提示框面板（像素圆角 + 立体感）---
  {
    const S = 32;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);

    // 阴影
    fillRounded(g, 2, 2, S - 2, S - 2, rgba(0, 0, 0, 0.4));
    // 轮廓
    fillRounded(g, 0, 0, S - 2, S - 2, C.black);
    // 边框（2px，上亮下暗）
    g.fillStyle = C.brnMd;
    g.fillRect(3, 1, S - 8, 2);
    g.fillRect(1, 3, 2, S - 8);
    g.fillStyle = C.brnDp;
    g.fillRect(3, S - 5, S - 8, 2);
    g.fillRect(S - 5, 3, 2, S - 8);
    sp(g, 2, 2, C.brnMd);
    sp(g, S - 5, 2, C.brnMd);
    sp(g, 2, S - 5, C.brnDp);
    sp(g, S - 5, S - 5, C.brnDp);
    // 填充
    g.fillStyle = C.bgDeep;
    g.fillRect(3, 3, S - 8, S - 8);
    // 内嵌阴影
    g.fillStyle = rgba(0, 0, 0, 0.2);
    g.fillRect(3, 3, S - 8, 1);
    g.fillStyle = rgba(255, 240, 200, 0.04);
    g.fillRect(3, S - 6, S - 8, 1);
    savePng(c, 'panel-tooltip.png');
  }

  // --- 消息条面板（像素圆角）---
  {
    const W = 32, H = 16;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    // 轮廓（圆角）
    g.fillStyle = C.black;
    g.fillRect(2, 0, W - 4, 1); g.fillRect(2, H - 1, W - 4, 1);
    g.fillRect(0, 2, 1, H - 4); g.fillRect(W - 1, 2, 1, H - 4);
    sp(g, 1, 1, C.black); sp(g, W - 2, 1, C.black);
    sp(g, 1, H - 2, C.black); sp(g, W - 2, H - 2, C.black);
    // 填充
    g.fillStyle = C.bgDeep;
    g.fillRect(1, 1, W - 2, H - 2);
    g.clearRect(0, 0, 1, 1); g.clearRect(W - 1, 0, 1, 1);
    g.clearRect(0, H - 1, 1, 1); g.clearRect(W - 1, H - 1, 1, 1);
    // 上边框亮线
    g.fillStyle = C.brnDk;
    g.fillRect(2, 1, W - 4, 1);
    // 下边框暗线
    g.fillStyle = C.brnDp;
    g.fillRect(2, H - 2, W - 4, 1);
    savePng(c, 'panel-toast.png');
  }

  // --- 复选框（像素圆角 + 立体感）---
  {
    const S = 16;
    // 未选中
    {
      const c = createCanvas(S, S);
      const g = px(c.getContext('2d'));
      g.clearRect(0, 0, S, S);
      // 阴影
      g.fillStyle = rgba(0, 0, 0, 0.4);
      g.fillRect(2, 2, S - 2, S - 2);
      // 轮廓（圆角）
      g.fillStyle = C.black;
      g.fillRect(2, 0, S - 4, 1); g.fillRect(2, S - 3, S - 4, 1);
      g.fillRect(0, 2, 1, S - 4); g.fillRect(S - 3, 2, 1, S - 4);
      sp(g, 1, 1, C.black); sp(g, S - 4, 1, C.black);
      sp(g, 1, S - 4, C.black); sp(g, S - 4, S - 4, C.black);
      // 填充
      g.fillStyle = '#0a0810';
      g.fillRect(1, 1, S - 4, S - 4);
      // 上亮下暗边框
      g.fillStyle = C.brnDk;
      g.fillRect(2, 1, S - 6, 1);
      g.fillRect(1, 2, 1, S - 6);
      g.fillStyle = C.brnDp;
      g.fillRect(2, S - 4, S - 6, 1);
      g.fillRect(S - 4, 2, 1, S - 6);
      // 内嵌阴影
      g.fillStyle = rgba(0, 0, 0, 0.3);
      g.fillRect(2, 2, S - 6, 1);
      savePng(c, 'checkbox.png');
    }
    // 选中
    {
      const c = createCanvas(S, S);
      const g = px(c.getContext('2d'));
      g.clearRect(0, 0, S, S);
      g.fillStyle = rgba(0, 0, 0, 0.4);
      g.fillRect(2, 2, S - 2, S - 2);
      g.fillStyle = C.black;
      g.fillRect(2, 0, S - 4, 1); g.fillRect(2, S - 3, S - 4, 1);
      g.fillRect(0, 2, 1, S - 4); g.fillRect(S - 3, 2, 1, S - 4);
      sp(g, 1, 1, C.black); sp(g, S - 4, 1, C.black);
      sp(g, 1, S - 4, C.black); sp(g, S - 4, S - 4, C.black);
      g.fillStyle = C.grnDk;
      g.fillRect(1, 1, S - 4, S - 4);
      // 上亮下暗
      g.fillStyle = C.grnBr;
      g.fillRect(2, 1, S - 6, 1);
      g.fillStyle = C.grnDp;
      g.fillRect(2, S - 4, S - 6, 1);
      // 勾号
      const W = '#ffffff';
      sp(g, 3, 7, W); sp(g, 4, 8, W); sp(g, 5, 9, W);
      sp(g, 6, 8, W); sp(g, 7, 7, W); sp(g, 8, 6, W);
      sp(g, 9, 5, W); sp(g, 10, 4, W);
      savePng(c, 'checkbox-checked.png');
    }
  }

  // --- 骰子面槽 / 遗物格（像素圆角 + 立体感）---
  {
    const S = 16;
    function drawSlot(name, borderColor, bgColor) {
      const c = createCanvas(S, S);
      const g = px(c.getContext('2d'));
      g.clearRect(0, 0, S, S);
      // 阴影
      g.fillStyle = rgba(0, 0, 0, 0.35);
      g.fillRect(2, 2, S - 2, S - 2);
      // 轮廓（圆角）
      g.fillStyle = C.black;
      g.fillRect(2, 0, S - 4, 1); g.fillRect(2, S - 3, S - 4, 1);
      g.fillRect(0, 2, 1, S - 4); g.fillRect(S - 3, 2, 1, S - 4);
      sp(g, 1, 1, C.black); sp(g, S - 4, 1, C.black);
      sp(g, 1, S - 4, C.black); sp(g, S - 4, S - 4, C.black);
      // 填充
      g.fillStyle = bgColor;
      g.fillRect(1, 1, S - 4, S - 4);
      // 边框（上亮下暗）
      g.fillStyle = borderColor;
      g.fillRect(2, 1, S - 6, 1);
      g.fillRect(1, 2, 1, S - 6);
      // 暗边
      g.fillStyle = rgba(0, 0, 0, 0.3);
      g.fillRect(2, S - 4, S - 6, 1);
      g.fillRect(S - 4, 2, 1, S - 6);
      // 内嵌阴影
      g.fillStyle = rgba(0, 0, 0, 0.25);
      g.fillRect(2, 2, S - 6, 1);
      g.fillRect(2, 3, 1, S - 8);
      // 底部反光
      g.fillStyle = rgba(255, 255, 255, 0.03);
      g.fillRect(2, S - 5, S - 6, 1);
      savePng(c, name);
    }
    drawSlot('dice-face-slot.png', C.brnDk, '#0a0810');
    drawSlot('relic-cell.png', C.purDk, '#0e0a18');
    drawSlot('relic-cell-locked.png', '#1a1a22', '#08080e');
    drawSlot('small-panel.png', C.brnDp, '#0a0810');
  }

  // --- 骰子槽位 32×32（像素圆角 + 立体感）---
  {
    const S = 32;
    function drawDiceSlot(name, borderHi, borderDk, bgColor) {
      const c = createCanvas(S, S);
      const g = px(c.getContext('2d'));
      g.clearRect(0, 0, S, S);
      // 阴影
      fillRounded(g, 2, 2, S - 2, S - 2, rgba(0, 0, 0, 0.4));
      // 轮廓
      fillRounded(g, 0, 0, S - 2, S - 2, C.black);
      // 填充
      g.fillStyle = bgColor;
      g.fillRect(3, 3, S - 8, S - 8);
      sp(g, 2, 2, bgColor); sp(g, S - 5, 2, bgColor);
      sp(g, 2, S - 5, bgColor); sp(g, S - 5, S - 5, bgColor);
      // 上/左边框亮
      g.fillStyle = borderHi;
      g.fillRect(4, 1, S - 10, 1);
      g.fillRect(1, 4, 1, S - 10);
      sp(g, 2, 2, borderHi);
      // 下/右边框暗
      g.fillStyle = borderDk;
      g.fillRect(4, S - 4, S - 10, 1);
      g.fillRect(S - 4, 4, 1, S - 10);
      sp(g, S - 5, S - 5, borderDk);
      // 内嵌阴影
      g.fillStyle = rgba(0, 0, 0, 0.3);
      g.fillRect(3, 3, S - 8, 1);
      g.fillRect(3, 4, 1, S - 10);
      // 底部反光
      g.fillStyle = rgba(255, 255, 255, 0.04);
      g.fillRect(3, S - 6, S - 8, 1);
      savePng(c, name);
    }
    drawDiceSlot('dice-slot.png', C.brnDk, C.brnDp, '#08060e');
    drawDiceSlot('dice-slot-active.png', C.gldMd, C.gldDp, '#14100a');
  }

  // --- 按钮修正（像素圆角）---
  {
    const W = 32, H = 16;
    function drawBtn(name, topHi, topMd, bodyMd, botDk, botDp, shadowColor) {
      const c = createCanvas(W, H);
      const g = px(c.getContext('2d'));
      g.clearRect(0, 0, W, H);

      // 底部阴影 2px（圆角）
      g.fillStyle = shadowColor;
      g.fillRect(2, H - 2, W - 4, 2);
      g.fillRect(3, H - 3, W - 6, 1);

      // 黑色轮廓（圆角）
      g.fillStyle = C.black;
      g.fillRect(3, 0, W - 6, 1);
      g.fillRect(3, H - 3, W - 6, 1);
      g.fillRect(0, 3, 1, H - 6);
      g.fillRect(W - 1, 3, 1, H - 6);
      sp(g, 1, 1, C.black); sp(g, 2, 1, C.black);
      sp(g, W - 3, 1, C.black); sp(g, W - 2, 1, C.black);
      sp(g, 1, H - 4, C.black); sp(g, 2, H - 4, C.black);
      sp(g, W - 3, H - 4, C.black); sp(g, W - 2, H - 4, C.black);
      sp(g, 1, 2, C.black); sp(g, W - 2, 2, C.black);
      sp(g, 1, H - 5, C.black); sp(g, W - 2, H - 5, C.black);

      // 按钮主体
      g.fillStyle = bodyMd;
      g.fillRect(1, 1, W - 2, H - 4);
      // 清除四角
      g.clearRect(0, 0, 1, 3); g.clearRect(W - 1, 0, 1, 3);
      g.clearRect(0, H - 3, 1, 3); g.clearRect(W - 1, H - 3, 1, 3);
      g.clearRect(1, 0, 2, 1); g.clearRect(W - 3, 0, 2, 1);

      // 重绘主体（安全区域）
      g.fillStyle = bodyMd;
      g.fillRect(2, 2, W - 4, H - 6);
      g.fillRect(3, 1, W - 6, 1);
      g.fillRect(1, 3, 1, H - 7);
      g.fillRect(W - 2, 3, 1, H - 7);

      // 顶部高光 2px
      g.fillStyle = topHi;
      g.fillRect(3, 1, W - 6, 1);
      g.fillStyle = topMd;
      g.fillRect(2, 2, W - 4, 1);

      // 底部暗影
      g.fillStyle = botDk;
      g.fillRect(2, H - 5, W - 4, 1);
      g.fillStyle = botDp;
      g.fillRect(3, H - 4, W - 6, 1);

      // 左侧亮
      g.fillStyle = topMd;
      g.fillRect(1, 3, 1, H - 7);
      // 右侧暗
      g.fillStyle = botDk;
      g.fillRect(W - 2, 3, 1, H - 7);

      savePng(c, name);
    }

    drawBtn('btn-green.png', '#60e890', '#40c868', '#2a9a48', '#1a7a34', '#0e5a22', '#062a10');
    drawBtn('btn-purple.png', '#cc88ee', '#aa60cc', '#7a40aa', '#5a2888', '#3a1060', '#1a0830');
    drawBtn('btn-red.png', '#ff8888', '#e06060', '#c04040', '#9a2828', '#6a1818', '#3a0808');
    drawBtn('btn-gold.png', '#ffe888', '#e8c050', '#c89830', '#9a7020', '#6a4810', '#3a2808');
    drawBtn('btn-gray.png', '#7a7a84', '#5a5a64', '#4a4a54', '#3a3a44', '#2a2a34', '#1a1a24');
  }

  // --- 图标框修正（像素圆角 + 立体感）---
  {
    const S = 32;
    function drawIconFrame(name, borderHi, borderMd, borderDk, bgColor) {
      const c = createCanvas(S, S);
      const g = px(c.getContext('2d'));
      g.clearRect(0, 0, S, S);
      // 阴影
      fillRounded(g, 2, 2, S - 2, S - 2, rgba(0, 0, 0, 0.4));
      // 轮廓
      fillRounded(g, 0, 0, S - 2, S - 2, C.black);
      // 边框（上亮下暗）
      g.fillStyle = borderHi;
      g.fillRect(3, 1, S - 8, 2);
      g.fillRect(1, 3, 2, S - 8);
      g.fillStyle = borderDk;
      g.fillRect(3, S - 5, S - 8, 2);
      g.fillRect(S - 5, 3, 2, S - 8);
      sp(g, 2, 2, borderHi); sp(g, S - 5, 2, borderMd);
      sp(g, 2, S - 5, borderDk); sp(g, S - 5, S - 5, borderDk);
      // 填充
      g.fillStyle = bgColor;
      g.fillRect(3, 3, S - 8, S - 8);
      // 内嵌阴影
      g.fillStyle = rgba(0, 0, 0, 0.25);
      g.fillRect(3, 3, S - 8, 1);
      g.fillRect(3, 4, 1, S - 10);
      // 底部反光
      g.fillStyle = rgba(255, 255, 255, 0.05);
      g.fillRect(3, S - 6, S - 8, 1);
      savePng(c, name);
    }
    drawIconFrame('icon-frame.png', C.brnLt, C.brnMd, C.brnDk, '#0a0810');
    drawIconFrame('icon-frame-rare.png', C.bluBr, C.bluMd, C.bluDk, '#0a1020');
    drawIconFrame('icon-frame-epic.png', C.purBr, C.purMd, C.purDk, '#100a20');
    drawIconFrame('icon-frame-legendary.png', C.orgBr, C.orgMd, C.orgDk, '#1a0e08');
  }

  // --- 模态框修正（像素圆角 + 立体感）---
  {
    const S = 32;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    // 阴影
    fillRounded(g, 3, 3, S - 3, S - 3, rgba(0, 0, 0, 0.5));
    // 轮廓
    fillRounded(g, 0, 0, S - 3, S - 3, C.black);
    // 外层紫色边框
    g.fillStyle = C.purDk;
    g.fillRect(4, 1, S - 11, 2);
    g.fillRect(1, 4, 2, S - 11);
    g.fillStyle = C.purDp;
    g.fillRect(4, S - 6, S - 11, 2);
    g.fillRect(S - 6, 4, 2, S - 11);
    sp(g, 3, 3, C.purDk); sp(g, S - 7, 3, C.purDk);
    sp(g, 3, S - 7, C.purDp); sp(g, S - 7, S - 7, C.purDp);
    // 内层棕色边框
    g.fillStyle = C.brnDk;
    g.fillRect(4, 3, S - 11, 1);
    g.fillRect(3, 4, 1, S - 11);
    g.fillStyle = C.brnDp;
    g.fillRect(4, S - 7, S - 11, 1);
    g.fillRect(S - 7, 4, 1, S - 11);
    // 填充
    g.fillStyle = C.bgDeep;
    g.fillRect(4, 4, S - 11, S - 11);
    // 内嵌阴影
    g.fillStyle = rgba(0, 0, 0, 0.2);
    g.fillRect(4, 4, S - 11, 1);
    g.fillStyle = rgba(255, 240, 200, 0.04);
    g.fillRect(4, S - 8, S - 11, 1);
    savePng(c, 'modal-bg.png');
  }

  // --- 关闭按钮（像素圆角）---
  {
    const S = 16;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    // 阴影
    g.fillStyle = rgba(0, 0, 0, 0.4);
    g.fillRect(2, 2, S - 2, S - 2);
    // 轮廓（圆角）
    g.fillStyle = C.black;
    g.fillRect(2, 0, S - 4, 1); g.fillRect(2, S - 3, S - 4, 1);
    g.fillRect(0, 2, 1, S - 4); g.fillRect(S - 3, 2, 1, S - 4);
    sp(g, 1, 1, C.black); sp(g, S - 4, 1, C.black);
    sp(g, 1, S - 4, C.black); sp(g, S - 4, S - 4, C.black);
    // 填充
    g.fillStyle = C.redDk;
    g.fillRect(1, 1, S - 4, S - 4);
    // 上亮
    g.fillStyle = C.redBr;
    g.fillRect(2, 1, S - 6, 1);
    // 下暗
    g.fillStyle = C.redDp;
    g.fillRect(2, S - 4, S - 6, 1);
    // X 图标
    g.fillStyle = '#ffffff';
    sp(g, 3, 3, '#fff'); sp(g, 4, 4, '#fff'); sp(g, 5, 5, '#fff');
    sp(g, 6, 6, '#fff'); sp(g, 7, 7, '#fff'); sp(g, 8, 8, '#fff');
    sp(g, 9, 9, '#fff');
    sp(g, 9, 3, '#fff'); sp(g, 8, 4, '#fff'); sp(g, 7, 5, '#fff');
    sp(g, 5, 7, '#fff'); sp(g, 4, 8, '#fff'); sp(g, 3, 9, '#fff');
    savePng(c, 'close-btn.png');
  }

  // --- 顶栏按钮（像素圆角）---
  {
    const S = 16;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(2, 0, S - 4, 1); g.fillRect(2, S - 1, S - 4, 1);
    g.fillRect(0, 2, 1, S - 4); g.fillRect(S - 1, 2, 1, S - 4);
    sp(g, 1, 1, C.black); sp(g, S - 2, 1, C.black);
    sp(g, 1, S - 2, C.black); sp(g, S - 2, S - 2, C.black);
    g.fillStyle = C.bgMid;
    g.fillRect(1, 1, S - 2, S - 2);
    g.clearRect(0, 0, 1, 1); g.clearRect(S - 1, 0, 1, 1);
    g.clearRect(0, S - 1, 1, 1); g.clearRect(S - 1, S - 1, 1, 1);
    // 上亮
    g.fillStyle = rgba(255, 255, 255, 0.08);
    g.fillRect(2, 1, S - 4, 1);
    // 下暗
    g.fillStyle = rgba(0, 0, 0, 0.15);
    g.fillRect(2, S - 2, S - 4, 1);
    savePng(c, 'topbar-btn.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 执行
// ══════════════════════════════════════════════════════════════

console.log('\n  六面史诗 · UI 素材修正补丁');
console.log('  修正: 卡片统一配色 + 像素圆角 + 增强立体感');
console.log('  输出: ' + OUT);
console.log('  ════════════════════════════════════════\n');

console.log('--- 1. 修正卡片系列 ---');
fixCards();

console.log('\n--- 2. 修正面板系列 ---');
fixPanels();

console.log('\n--- 3. 修正小组件 ---');
fixSmallWidgets();

console.log('\n  ════════════════════════════════════════');
console.log('  修正完成!\n');
