/**
 * 六面史诗 · 像素风 UI 素材生成器 v3
 * 
 * 基础网格：32×32 px
 * 开发分辨率：720×1280
 * 缩放倍率：×4（32px → 128px 显示）
 * 渲染模式：NEAREST（锐利无模糊）
 * 配色：Peglin 暖棕 + WoW 金色 + 暗紫底
 * 
 * 运行：node scripts/generate-ui-assets.cjs
 * 输出：public/ui/
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'public', 'ui');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ── 工具函数 ──
function savePng(canvas, name) {
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('  [OK] ' + name + ' (' + canvas.width + 'x' + canvas.height + ')');
}
function px(ctx) { ctx.imageSmoothingEnabled = false; return ctx; }
function sp(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rgba(r, g, b, a) { return 'rgba(' + r + ',' + g + ',' + b + ',' + (a === undefined ? 1 : a) + ')'; }
function hex(h) { return h; }

// ── 配色板 ──
const C = {
  black: '#000000',
  bgDeep: '#0e0c14',
  bgDark: '#16122a',
  bgMid: '#1e1a30',
  // 棕色边框
  brnHi: '#9a8060',
  brnLt: '#8a7050',
  brnMd: '#6a5438',
  brnDk: '#4a3824',
  brnDp: '#2a1e14',
  // 金色
  gldBr: '#f0d860',
  gldMd: '#d4a030',
  gldDk: '#8a6a18',
  gldDp: '#5a4410',
  // 绿色
  grnBr: '#50c878',
  grnMd: '#3a9a52',
  grnDk: '#1e6b38',
  grnDp: '#0e4a22',
  // 红色
  redBr: '#e86860',
  redMd: '#c84040',
  redDk: '#8a2820',
  redDp: '#5a1810',
  // 紫色
  purBr: '#aa70cc',
  purMd: '#8a55aa',
  purDk: '#5a3078',
  purDp: '#301850',
  // 蓝色
  bluBr: '#5599dd',
  bluMd: '#4488cc',
  bluDk: '#2a5588',
  bluDp: '#1a3858',
  // 灰色
  gryLt: '#6a6a74',
  gryMd: '#4a4a54',
  gryDk: '#3a3a44',
  gryDp: '#2a2a34',
  // 橙色
  orgBr: '#f0a040',
  orgMd: '#d08030',
  orgDk: '#8a5020',
};

// ══════════════════════════════════════════════════════════════
// 通用绘制函数
// ══════════════════════════════════════════════════════════════

/** 绘制像素风矩形边框（填充式，非 lineStyle） */
function drawBorder(ctx, x, y, w, h, thickness, colorTop, colorBot, colorLeft, colorRight) {
  const t = thickness;
  ctx.fillStyle = colorTop;
  ctx.fillRect(x, y, w, t);
  ctx.fillStyle = colorBot;
  ctx.fillRect(x, y + h - t, w, t);
  ctx.fillStyle = colorLeft || colorTop;
  ctx.fillRect(x, y + t, t, h - t * 2);
  ctx.fillStyle = colorRight || colorBot;
  ctx.fillRect(x + w - t, y + t, t, h - t * 2);
}

/** 绘制四角铆钉 */
function drawRivets(ctx, x, y, w, h, size, hiColor, loColor) {
  const positions = [
    [x, y], [x + w - size, y],
    [x, y + h - size], [x + w - size, y + h - size],
  ];
  for (const [rx, ry] of positions) {
    ctx.fillStyle = hiColor;
    ctx.fillRect(rx, ry, size, size);
    // 高光点（左上）
    sp(ctx, rx, ry, hiColor);
    // 暗角（右下）
    sp(ctx, rx + size - 1, ry + size - 1, loColor);
  }
}

// ══════════════════════════════════════════════════════════════
// 1. 面板边框系列 — 32×32 九宫格
// ══════════════════════════════════════════════════════════════

function genPanels() {
  const S = 32;

  // --- 通用面板 ---
  function drawPanel(name, borderHi, borderMd, borderDk, borderDp, fillColor, rivetHi, rivetLo) {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);

    // 外轮廓 2px 纯黑
    g.fillStyle = C.black;
    g.fillRect(3, 0, S - 6, 2);
    g.fillRect(3, S - 2, S - 6, 2);
    g.fillRect(0, 3, 2, S - 6);
    g.fillRect(S - 2, 3, 2, S - 6);
    // 斜角
    g.fillRect(2, 2, 1, 1); g.fillRect(S - 3, 2, 1, 1);
    g.fillRect(2, S - 3, 1, 1); g.fillRect(S - 3, S - 3, 1, 1);

    // 边框 — 上/左亮，下/右暗（3px 宽）
    drawBorder(g, 2, 2, S - 4, S - 4, 3, borderHi, borderDk, borderMd, borderDp);

    // 内部填充
    g.fillStyle = fillColor;
    g.fillRect(5, 5, S - 10, S - 10);

    // 内高光线（顶部+左侧 1px）
    g.fillStyle = rgba(255, 240, 200, 0.08);
    g.fillRect(5, 5, S - 10, 1);
    g.fillRect(5, 6, 1, S - 12);
    // 内暗影线（底部+右侧 1px）
    g.fillStyle = rgba(0, 0, 0, 0.15);
    g.fillRect(5, S - 6, S - 10, 1);
    g.fillRect(S - 6, 5, 1, S - 10);

    // 四角铆钉 3×3
    drawRivets(g, 2, 2, S - 4, S - 4, 3, rivetHi, rivetLo);

    savePng(c, name);
    return c;
  }

  // 普通面板（棕色边框）
  drawPanel('panel-border.png', C.brnLt, C.brnMd, C.brnDk, C.brnDp, C.bgDark, C.brnHi, C.brnDp);

  // 选中态（金色边框）
  drawPanel('panel-border-selected.png', C.gldBr, C.gldMd, C.gldDk, C.gldDp, C.bgDark, C.gldBr, C.gldDk);

  // 深色面板（弹窗/模态框）
  drawPanel('panel-dark.png', C.gryMd, C.gryDk, C.gryDp, C.black, C.bgDeep, C.gryLt, C.black);

  // 提示框面板（更薄边框 2px）
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(2, 0, S - 4, 1); g.fillRect(2, S - 1, S - 4, 1);
    g.fillRect(0, 2, 1, S - 4); g.fillRect(S - 1, 2, 1, S - 4);
    g.fillRect(1, 1, 1, 1); g.fillRect(S - 2, 1, 1, 1);
    g.fillRect(1, S - 2, 1, 1); g.fillRect(S - 2, S - 2, 1, 1);
    drawBorder(g, 1, 1, S - 2, S - 2, 2, C.brnMd, C.brnDp, C.brnDk, C.brnDp);
    g.fillStyle = C.bgDeep;
    g.fillRect(3, 3, S - 6, S - 6);
    g.fillStyle = rgba(255, 240, 200, 0.05);
    g.fillRect(3, 3, S - 6, 1);
    savePng(c, 'panel-tooltip.png');
  }

  // 消息条面板（横向拉伸用）
  {
    const W = 32, H = 16;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = C.black;
    g.fillRect(2, 0, W - 4, 1); g.fillRect(2, H - 1, W - 4, 1);
    g.fillRect(0, 2, 1, H - 4); g.fillRect(W - 1, 2, 1, H - 4);
    g.fillRect(1, 1, 1, 1); g.fillRect(W - 2, 1, 1, 1);
    g.fillRect(1, H - 2, 1, 1); g.fillRect(W - 2, H - 2, 1, 1);
    g.fillStyle = C.bgDeep;
    g.fillRect(1, 1, W - 2, H - 2);
    g.fillStyle = C.brnDk;
    g.fillRect(2, 1, W - 4, 1);
    g.fillStyle = C.brnDp;
    g.fillRect(2, H - 2, W - 4, 1);
    savePng(c, 'panel-toast.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 2. 按钮系列 — 32×16 九宫格
// ══════════════════════════════════════════════════════════════

function genButtons() {
  const W = 32, H = 16;

  function drawBtn(name, topHi, topMd, bodyMd, botDk, botDp, shadowColor) {
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);

    // 底部阴影 2px
    g.fillStyle = shadowColor;
    g.fillRect(1, H - 2, W - 2, 2);
    g.fillRect(2, H - 3, W - 4, 1);

    // 黑色轮廓
    g.fillStyle = C.black;
    g.fillRect(2, 0, W - 4, 1);
    g.fillRect(2, H - 3, W - 4, 1);
    g.fillRect(0, 2, 1, H - 5);
    g.fillRect(W - 1, 2, 1, H - 5);
    g.fillRect(1, 1, 1, 1); g.fillRect(W - 2, 1, 1, 1);
    g.fillRect(1, H - 4, 1, 1); g.fillRect(W - 2, H - 4, 1, 1);

    // 按钮主体
    g.fillStyle = bodyMd;
    g.fillRect(1, 1, W - 2, H - 4);

    // 顶部高光 2px
    g.fillStyle = topHi;
    g.fillRect(2, 1, W - 4, 1);
    g.fillStyle = topMd;
    g.fillRect(2, 2, W - 4, 1);

    // 底部暗影 1px
    g.fillStyle = botDk;
    g.fillRect(2, H - 5, W - 4, 1);
    g.fillStyle = botDp;
    g.fillRect(2, H - 4, W - 4, 1);

    // 左侧亮 1px
    g.fillStyle = topMd;
    g.fillRect(1, 2, 1, H - 6);
    // 右侧暗 1px
    g.fillStyle = botDk;
    g.fillRect(W - 2, 2, 1, H - 6);

    savePng(c, name);
  }

  function drawBtnPressed(name, bodyDk, bodyDp, topDk, shadowColor) {
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);

    // 黑色轮廓（下移 2px）
    g.fillStyle = C.black;
    g.fillRect(2, 2, W - 4, 1);
    g.fillRect(2, H - 1, W - 4, 1);
    g.fillRect(0, 4, 1, H - 5);
    g.fillRect(W - 1, 4, 1, H - 5);
    g.fillRect(1, 3, 1, 1); g.fillRect(W - 2, 3, 1, 1);
    g.fillRect(1, H - 2, 1, 1); g.fillRect(W - 2, H - 2, 1, 1);

    // 顶部凹陷阴影
    g.fillStyle = shadowColor;
    g.fillRect(2, 0, W - 4, 2);
    g.fillRect(0, 2, 2, 2);
    g.fillRect(W - 2, 2, 2, 2);

    // 按钮主体（下移）
    g.fillStyle = bodyDk;
    g.fillRect(1, 3, W - 2, H - 4);
    g.fillStyle = topDk;
    g.fillRect(2, 3, W - 4, 1);
    g.fillStyle = bodyDp;
    g.fillRect(2, H - 2, W - 4, 1);

    savePng(c, name);
  }

  // 绿色按钮
  drawBtn('btn-green.png', '#60e890', '#40c868', '#2a9a48', '#1a7a34', '#0e5a22', '#062a10');
  drawBtnPressed('btn-green-pressed.png', '#1a7a34', '#0e5a22', '#0a4a18', '#062a10');

  // 紫色按钮
  drawBtn('btn-purple.png', '#cc88ee', '#aa60cc', '#7a40aa', '#5a2888', '#3a1060', '#1a0830');
  drawBtnPressed('btn-purple-pressed.png', '#5a2888', '#3a1060', '#2a0848', '#1a0830');

  // 红色按钮
  drawBtn('btn-red.png', '#ff8888', '#e06060', '#c04040', '#9a2828', '#6a1818', '#3a0808');
  drawBtnPressed('btn-red-pressed.png', '#9a2828', '#6a1818', '#4a1010', '#3a0808');

  // 金色按钮
  drawBtn('btn-gold.png', '#ffe888', '#e8c050', '#c89830', '#9a7020', '#6a4810', '#3a2808');
  drawBtnPressed('btn-gold-pressed.png', '#9a7020', '#6a4810', '#4a3008', '#3a2808');

  // 灰色按钮
  drawBtn('btn-gray.png', '#7a7a84', '#5a5a64', '#4a4a54', '#3a3a44', '#2a2a34', '#1a1a24');
  drawBtnPressed('btn-gray-pressed.png', '#3a3a44', '#2a2a34', '#222230', '#1a1a24');

  // 幽灵按钮（半透明边框）
  {
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    // 薄边框
    g.fillStyle = rgba(106, 101, 120, 0.5);
    g.fillRect(2, 0, W - 4, 1); g.fillRect(2, H - 1, W - 4, 1);
    g.fillRect(0, 2, 1, H - 4); g.fillRect(W - 1, 2, 1, H - 4);
    g.fillRect(1, 1, 1, 1); g.fillRect(W - 2, 1, 1, 1);
    g.fillRect(1, H - 2, 1, 1); g.fillRect(W - 2, H - 2, 1, 1);
    // 半透明填充
    g.fillStyle = rgba(26, 26, 46, 0.6);
    g.fillRect(1, 1, W - 2, H - 2);
    savePng(c, 'btn-ghost.png');

    const c2 = createCanvas(W, H);
    const g2 = px(c2.getContext('2d'));
    g2.clearRect(0, 0, W, H);
    g2.fillStyle = rgba(80, 80, 100, 0.5);
    g2.fillRect(2, 0, W - 4, 1); g2.fillRect(2, H - 1, W - 4, 1);
    g2.fillRect(0, 2, 1, H - 4); g2.fillRect(W - 1, 2, 1, H - 4);
    g2.fillRect(1, 1, 1, 1); g2.fillRect(W - 2, 1, 1, 1);
    g2.fillRect(1, H - 2, 1, 1); g2.fillRect(W - 2, H - 2, 1, 1);
    g2.fillStyle = rgba(20, 20, 36, 0.7);
    g2.fillRect(1, 1, W - 2, H - 2);
    savePng(c2, 'btn-ghost-pressed.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 3. 进度条系列 — 32×8 九宫格
// ══════════════════════════════════════════════════════════════

function genBars() {
  const W = 32, H = 8;

  // 背景槽
  {
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.fillStyle = C.black;
    g.fillRect(1, 0, W - 2, 1); g.fillRect(1, H - 1, W - 2, 1);
    g.fillRect(0, 1, 1, H - 2); g.fillRect(W - 1, 1, 1, H - 2);
    g.fillStyle = '#0a0810';
    g.fillRect(1, 1, W - 2, H - 2);
    // 内凹阴影
    g.fillStyle = rgba(0, 0, 0, 0.4);
    g.fillRect(1, 1, W - 2, 1);
    g.fillStyle = rgba(255, 255, 255, 0.03);
    g.fillRect(1, H - 2, W - 2, 1);
    savePng(c, 'bar-bg.png');
  }

  // 填充条
  function drawBarFill(name, topColor, midColor, botColor) {
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = topColor;
    g.fillRect(0, 0, W, 2);
    g.fillStyle = midColor;
    g.fillRect(0, 2, W, H - 4);
    g.fillStyle = botColor;
    g.fillRect(0, H - 2, W, 2);
    // 顶部高光
    g.fillStyle = rgba(255, 255, 255, 0.25);
    g.fillRect(0, 0, W, 1);
    // 底部暗影
    g.fillStyle = rgba(0, 0, 0, 0.2);
    g.fillRect(0, H - 1, W, 1);
    savePng(c, name);
  }

  drawBarFill('bar-hp.png', C.redBr, C.redMd, C.redDk);
  drawBarFill('bar-mp.png', C.bluBr, C.bluMd, C.bluDk);
  drawBarFill('bar-xp.png', C.gldBr, C.gldMd, C.gldDk);
  drawBarFill('bar-poison.png', C.grnBr, C.grnMd, C.grnDk);
  drawBarFill('bar-armor.png', '#6699cc', C.bluMd, C.bluDk);

  // 彩色强调条（用于卡片底部装饰）
  function drawAccentBar(name, color) {
    const c = createCanvas(W, 4);
    const g = px(c.getContext('2d'));
    g.fillStyle = color;
    g.fillRect(0, 0, W, 4);
    g.fillStyle = rgba(255, 255, 255, 0.2);
    g.fillRect(0, 0, W, 1);
    g.fillStyle = rgba(0, 0, 0, 0.3);
    g.fillRect(0, 3, W, 1);
    savePng(c, name);
  }

  drawAccentBar('bar-accent-red.png', C.redMd);
  drawAccentBar('bar-accent-green.png', C.grnMd);
  drawAccentBar('bar-accent-blue.png', C.bluMd);
  drawAccentBar('bar-accent-gold.png', C.gldMd);
  drawAccentBar('bar-accent-purple.png', C.purMd);
}

// ══════════════════════════════════════════════════════════════
// 4. 纹理系列 — 32×32 可平铺
// ══════════════════════════════════════════════════════════════

function genTextures() {
  const S = 32;

  // 石砖纹理
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    const base = [22, 18, 34];
    g.fillStyle = rgba(...base);
    g.fillRect(0, 0, S, S);

    // 4 行砖块，交错排列
    const rows = [
      { y: 0, h: 7, bricks: [[0, 14], [16, 31]] },
      { y: 8, h: 7, bricks: [[0, 6], [8, 22], [24, 31]] },
      { y: 16, h: 7, bricks: [[0, 14], [16, 31]] },
      { y: 24, h: 7, bricks: [[0, 6], [8, 22], [24, 31]] },
    ];
    for (const row of rows) {
      // 砖缝
      g.fillStyle = rgba(0, 0, 0, 0.35);
      g.fillRect(0, row.y + row.h, S, 1);
      for (const [bx0, bx1] of row.bricks) {
        const bw = bx1 - bx0 + 1;
        const dr = randInt(-3, 3), dg = randInt(-3, 3), db = randInt(-2, 2);
        g.fillStyle = rgba(base[0] + dr, base[1] + dg, base[2] + db);
        g.fillRect(bx0, row.y, bw, row.h);
        // 砖面高光
        g.fillStyle = rgba(255, 240, 220, 0.04);
        g.fillRect(bx0, row.y, bw, 1);
        g.fillRect(bx0, row.y + 1, 1, row.h - 2);
        // 砖面暗影
        g.fillStyle = rgba(0, 0, 0, 0.06);
        g.fillRect(bx0, row.y + row.h - 1, bw, 1);
        g.fillRect(bx1, row.y + 1, 1, row.h - 2);
        // 竖缝
        if (bx0 > 0) {
          g.fillStyle = rgba(0, 0, 0, 0.3);
          for (let y = row.y; y < row.y + row.h; y++) sp(g, bx0 - 1, y, rgba(0, 0, 0, 0.3));
        }
        // 噪点
        for (let i = 0; i < 3; i++) {
          const nx = bx0 + randInt(1, Math.max(1, bw - 2));
          const ny = row.y + randInt(1, Math.max(1, row.h - 2));
          sp(g, nx, ny, Math.random() > 0.5 ? rgba(255, 240, 220, 0.04) : rgba(0, 0, 0, 0.05));
        }
      }
    }
    savePng(c, 'stone-brick.png');
  }

  // 羊皮纸纹理
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    const base = [40, 36, 28];
    g.fillStyle = rgba(...base);
    g.fillRect(0, 0, S, S);
    // 纤维纹理
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const v = randInt(-5, 5);
        if (Math.abs(v) > 2) {
          sp(g, x, y, rgba(base[0] + v, base[1] + v, base[2] + Math.floor(v * 0.5), 0.4));
        }
      }
    }
    // 水平纤维线
    for (let i = 0; i < 6; i++) {
      const ly = randInt(2, S - 3);
      g.fillStyle = rgba(base[0] + 8, base[1] + 6, base[2] + 4, 0.15);
      g.fillRect(0, ly, S, 1);
    }
    savePng(c, 'parchment.png');
  }

  // 皮革纹理
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    const base = [30, 24, 18];
    g.fillStyle = rgba(...base);
    g.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const v = randInt(-4, 4);
        if (Math.abs(v) > 1) {
          sp(g, x, y, rgba(base[0] + v, base[1] + v, base[2] + v, 0.3));
        }
      }
    }
    // 交叉纹路
    for (let i = 0; i < 4; i++) {
      const sx = randInt(0, S - 1), sy = randInt(0, S - 1);
      const len = randInt(3, 8);
      for (let d = 0; d < len; d++) {
        const nx = sx + d, ny = sy + (d % 2 === 0 ? 0 : 1);
        if (nx < S && ny < S) sp(g, nx, ny, rgba(base[0] - 6, base[1] - 6, base[2] - 4, 0.2));
      }
    }
    savePng(c, 'tex-leather.png');
  }

  // 木纹纹理
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    const base = [48, 36, 22];
    g.fillStyle = rgba(...base);
    g.fillRect(0, 0, S, S);
    // 木纹线（水平）
    for (let y = 0; y < S; y++) {
      const wave = Math.sin(y * 0.4) * 2;
      const v = Math.floor(wave);
      g.fillStyle = rgba(base[0] + v * 3, base[1] + v * 2, base[2] + v, 0.6);
      g.fillRect(0, y, S, 1);
    }
    // 年轮节
    for (let i = 0; i < 2; i++) {
      const kx = randInt(8, S - 8), ky = randInt(8, S - 8);
      for (let r = 2; r < 5; r++) {
        g.fillStyle = rgba(base[0] - 10, base[1] - 8, base[2] - 4, 0.15);
        g.fillRect(kx - r, ky, r * 2, 1);
        g.fillRect(kx, ky - r, 1, r * 2);
      }
    }
    savePng(c, 'tex-wood.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 5. 图标框系列 — 32×32
// ══════════════════════════════════════════════════════════════

function genIconFrames() {
  const S = 32;

  function drawIconFrame(name, borderHi, borderMd, borderDk, bgColor) {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);

    // 外轮廓
    g.fillStyle = C.black;
    g.fillRect(2, 0, S - 4, 2); g.fillRect(2, S - 2, S - 4, 2);
    g.fillRect(0, 2, 2, S - 4); g.fillRect(S - 2, 2, 2, S - 4);

    // 边框
    drawBorder(g, 2, 2, S - 4, S - 4, 2, borderHi, borderDk, borderMd, borderDk);

    // 内部
    g.fillStyle = bgColor;
    g.fillRect(4, 4, S - 8, S - 8);

    // 内高光
    g.fillStyle = rgba(255, 255, 255, 0.06);
    g.fillRect(4, 4, S - 8, 1);
    g.fillRect(4, 5, 1, S - 10);

    savePng(c, name);
  }

  drawIconFrame('icon-frame.png', C.brnLt, C.brnMd, C.brnDk, '#0a0810');
  drawIconFrame('icon-frame-rare.png', C.bluBr, C.bluMd, C.bluDk, '#0a1020');
  drawIconFrame('icon-frame-epic.png', C.purBr, C.purMd, C.purDk, '#100a20');
  drawIconFrame('icon-frame-legendary.png', C.orgBr, C.orgMd, C.orgDk, '#1a0e08');
}

// ══════════════════════════════════════════════════════════════
// 6. 分隔线 — 32×4
// ══════════════════════════════════════════════════════════════

function genDividers() {
  function drawDivider(name, color, dotColor) {
    const W = 32, H = 4;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = color;
    g.fillRect(0, 1, W, 1);
    g.fillStyle = rgba(0, 0, 0, 0.3);
    g.fillRect(0, 2, W, 1);
    // 中心装饰点
    if (dotColor) {
      sp(g, W / 2 - 1, 0, dotColor);
      sp(g, W / 2, 0, dotColor);
      sp(g, W / 2 - 1, 3, dotColor);
      sp(g, W / 2, 3, dotColor);
    }
    savePng(c, name);
  }

  drawDivider('divider.png', C.brnDk, null);
  drawDivider('divider-gold.png', C.gldDk, C.gldMd);
}

// ══════════════════════════════════════════════════════════════
// 7. 复选框/单选框 — 16×16
// ══════════════════════════════════════════════════════════════

function genCheckboxes() {
  const S = 16;

  // 复选框 - 未选中
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.fillStyle = C.black;
    g.fillRect(1, 0, S - 2, 1); g.fillRect(1, S - 1, S - 2, 1);
    g.fillRect(0, 1, 1, S - 2); g.fillRect(S - 1, 1, 1, S - 2);
    g.fillStyle = '#0a0810';
    g.fillRect(1, 1, S - 2, S - 2);
    g.fillStyle = C.brnDk;
    g.fillRect(2, 1, S - 4, 1);
    g.fillRect(1, 2, 1, S - 4);
    savePng(c, 'checkbox.png');
  }

  // 复选框 - 选中
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.fillStyle = C.black;
    g.fillRect(1, 0, S - 2, 1); g.fillRect(1, S - 1, S - 2, 1);
    g.fillRect(0, 1, 1, S - 2); g.fillRect(S - 1, 1, 1, S - 2);
    g.fillStyle = C.grnDk;
    g.fillRect(1, 1, S - 2, S - 2);
    // 勾号
    g.fillStyle = C.grnBr;
    sp(g, 3, 8, C.grnBr); sp(g, 4, 9, C.grnBr); sp(g, 5, 10, C.grnBr);
    sp(g, 6, 11, C.grnBr); sp(g, 7, 10, C.grnBr); sp(g, 8, 9, C.grnBr);
    sp(g, 9, 8, C.grnBr); sp(g, 10, 7, C.grnBr); sp(g, 11, 6, C.grnBr);
    sp(g, 12, 5, C.grnBr);
    savePng(c, 'checkbox-checked.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 8. 标签页 — 32×16
// ══════════════════════════════════════════════════════════════

function genTabs() {
  const W = 32, H = 16;

  // 激活态
  {
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = C.black;
    g.fillRect(2, 0, W - 4, 1);
    g.fillRect(0, 2, 1, H - 2); g.fillRect(W - 1, 2, 1, H - 2);
    g.fillRect(1, 1, 1, 1); g.fillRect(W - 2, 1, 1, 1);
    g.fillStyle = C.bgDark;
    g.fillRect(1, 1, W - 2, H - 1);
    g.fillStyle = C.gldMd;
    g.fillRect(2, 1, W - 4, 2);
    savePng(c, 'tab-active.png');
  }

  // 非激活态
  {
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = C.black;
    g.fillRect(2, 2, W - 4, 1);
    g.fillRect(0, 4, 1, H - 4); g.fillRect(W - 1, 4, 1, H - 4);
    g.fillRect(1, 3, 1, 1); g.fillRect(W - 2, 3, 1, 1);
    g.fillStyle = C.bgDeep;
    g.fillRect(1, 3, W - 2, H - 3);
    g.fillStyle = C.brnDp;
    g.fillRect(2, 3, W - 4, 1);
    savePng(c, 'tab-inactive.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 9. 滚动条 — 8×32 / 8×16
// ══════════════════════════════════════════════════════════════

function genScrollbar() {
  // 轨道
  {
    const c = createCanvas(8, 32);
    const g = px(c.getContext('2d'));
    g.fillStyle = rgba(10, 8, 16, 0.8);
    g.fillRect(0, 0, 8, 32);
    g.fillStyle = rgba(0, 0, 0, 0.3);
    g.fillRect(0, 0, 1, 32);
    g.fillStyle = rgba(255, 255, 255, 0.02);
    g.fillRect(7, 0, 1, 32);
    savePng(c, 'scroll-track.png');
  }

  // 滑块
  {
    const c = createCanvas(8, 16);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, 8, 16);
    g.fillStyle = C.brnDk;
    g.fillRect(1, 1, 6, 14);
    g.fillStyle = C.brnMd;
    g.fillRect(2, 1, 4, 1);
    g.fillRect(1, 2, 1, 12);
    g.fillStyle = C.brnDp;
    g.fillRect(2, 14, 4, 1);
    g.fillRect(6, 2, 1, 12);
    // 中间纹路
    g.fillStyle = C.brnLt;
    g.fillRect(3, 6, 2, 1);
    g.fillRect(3, 8, 2, 1);
    g.fillRect(3, 10, 2, 1);
    savePng(c, 'scroll-thumb.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 10. 地图节点 — 16×16
// ══════════════════════════════════════════════════════════════

function genMapNodes() {
  const S = 16;

  function drawNode(name, fillColor, borderColor, iconPixels) {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);

    // 圆形节点（像素近似）
    const circle = [
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    ];

    // 填充
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (circle[y][x]) sp(g, x, y, fillColor);
      }
    }

    // 边框（描边圆形外圈）
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (!circle[y][x]) continue;
        const neighbors = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= S || ny < 0 || ny >= S || !circle[ny][nx]) {
            sp(g, x, y, borderColor);
            break;
          }
        }
      }
    }

    // 图标像素
    if (iconPixels) {
      for (const [ix, iy, ic] of iconPixels) {
        sp(g, ix, iy, ic);
      }
    }

    savePng(c, name);
  }

  const W = '#ffffff';
  // 战斗节点（红色 + 剑图标）
  drawNode('map-node-enemy.png', C.redDk, C.redBr, [
    [7, 4, W], [8, 4, W], [7, 5, W], [8, 5, W],
    [6, 6, W], [9, 6, W], [5, 7, W], [10, 7, W],
    [7, 7, W], [8, 7, W], [7, 8, W], [8, 8, W],
    [6, 9, W], [9, 9, W], [7, 10, W], [8, 10, W],
    [7, 11, W], [8, 11, W],
  ]);

  // 精英节点（金色 + 骷髅）
  drawNode('map-node-elite.png', '#4a3818', C.gldBr, [
    [6, 4, W], [7, 4, W], [8, 4, W], [9, 4, W],
    [5, 5, W], [10, 5, W], [5, 6, '#222'], [7, 6, '#222'],
    [8, 6, '#222'], [10, 6, '#222'], [6, 7, W], [7, 7, W],
    [8, 7, W], [9, 7, W], [7, 8, W], [8, 8, W],
    [6, 9, W], [7, 9, W], [8, 9, W], [9, 9, W],
    [7, 10, W], [8, 10, W],
  ]);

  // Boss 节点（深红 + 皇冠）
  drawNode('map-node-boss.png', '#5a1010', '#ff4030', [
    [5, 4, C.gldBr], [7, 3, C.gldBr], [8, 3, C.gldBr], [10, 4, C.gldBr],
    [5, 5, C.gldMd], [6, 5, C.gldMd], [7, 5, C.gldMd], [8, 5, C.gldMd],
    [9, 5, C.gldMd], [10, 5, C.gldMd],
    [5, 6, C.gldDk], [6, 6, C.gldDk], [7, 6, C.gldDk], [8, 6, C.gldDk],
    [9, 6, C.gldDk], [10, 6, C.gldDk],
    [6, 7, C.redBr], [7, 7, C.gldBr], [8, 7, C.gldBr], [9, 7, C.redBr],
    [7, 9, W], [8, 9, W], [7, 10, W], [8, 10, W],
  ]);

  // 商店节点（绿色 + 金币）
  drawNode('map-node-shop.png', '#1a3a1a', C.grnBr, [
    [7, 5, C.gldBr], [8, 5, C.gldBr],
    [6, 6, C.gldMd], [7, 6, C.gldBr], [8, 6, C.gldBr], [9, 6, C.gldMd],
    [6, 7, C.gldMd], [7, 7, C.gldMd], [8, 7, C.gldMd], [9, 7, C.gldMd],
    [6, 8, C.gldDk], [7, 8, C.gldMd], [8, 8, C.gldMd], [9, 8, C.gldDk],
    [7, 9, C.gldDk], [8, 9, C.gldDk],
  ]);

  // 篝火节点（橙色 + 火焰）
  drawNode('map-node-campfire.png', '#2a1808', '#ff8844', [
    [7, 4, '#ff6030'], [8, 4, '#ff6030'],
    [6, 5, '#ff8844'], [7, 5, '#ffaa44'], [8, 5, '#ffaa44'], [9, 5, '#ff8844'],
    [6, 6, '#ff6030'], [7, 6, '#ffcc44'], [8, 6, '#ffcc44'], [9, 6, '#ff6030'],
    [7, 7, '#ff8844'], [8, 7, '#ff8844'],
    [5, 8, '#4a3020'], [6, 8, '#ff6030'], [7, 8, '#ff8844'], [8, 8, '#ff8844'],
    [9, 8, '#ff6030'], [10, 8, '#4a3020'],
    [6, 9, '#3a2010'], [7, 9, '#4a3020'], [8, 9, '#4a3020'], [9, 9, '#3a2010'],
  ]);

  // 事件节点（紫色 + 问号）
  drawNode('map-node-event.png', C.purDk, C.purBr, [
    [7, 4, W], [8, 4, W], [9, 4, W],
    [6, 5, W], [9, 5, W],
    [9, 6, W], [8, 7, W], [7, 8, W],
    [7, 10, W], [7, 11, W],
  ]);

  // 宝箱节点（金色 + 箱子）
  drawNode('map-node-treasure.png', '#2a2008', C.gldBr, [
    [5, 6, C.brnMd], [6, 6, C.brnMd], [7, 6, C.brnMd], [8, 6, C.brnMd],
    [9, 6, C.brnMd], [10, 6, C.brnMd],
    [5, 7, C.brnDk], [6, 7, C.brnLt], [7, 7, C.gldBr], [8, 7, C.gldBr],
    [9, 7, C.brnLt], [10, 7, C.brnDk],
    [5, 8, C.brnDk], [6, 8, C.brnMd], [7, 8, C.gldMd], [8, 8, C.gldMd],
    [9, 8, C.brnMd], [10, 8, C.brnDk],
    [5, 9, C.brnDp], [6, 9, C.brnDk], [7, 9, C.brnDk], [8, 9, C.brnDk],
    [9, 9, C.brnDk], [10, 9, C.brnDp],
  ]);

  // 已完成节点（灰色 + 勾号）
  drawNode('map-node-completed.png', '#222228', '#555560', [
    [5, 8, '#888'], [6, 9, '#888'], [7, 10, '#888'],
    [8, 9, '#888'], [9, 8, '#888'], [10, 7, '#888'], [11, 6, '#888'],
  ]);
}

// ══════════════════════════════════════════════════════════════
// 11. 卡片系列 — 32×32 九宫格
// ══════════════════════════════════════════════════════════════

function genCards() {
  const S = 32;

  function drawCard(name, borderColor, bgColor, accentColor) {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);

    // 外轮廓
    g.fillStyle = C.black;
    g.fillRect(2, 0, S - 4, 1); g.fillRect(2, S - 1, S - 4, 1);
    g.fillRect(0, 2, 1, S - 4); g.fillRect(S - 1, 2, 1, S - 4);
    g.fillRect(1, 1, 1, 1); g.fillRect(S - 2, 1, 1, 1);
    g.fillRect(1, S - 2, 1, 1); g.fillRect(S - 2, S - 2, 1, 1);

    // 边框
    drawBorder(g, 1, 1, S - 2, S - 2, 2, borderColor, borderColor, borderColor, borderColor);

    // 填充
    g.fillStyle = bgColor;
    g.fillRect(3, 3, S - 6, S - 6);

    // 内高光
    g.fillStyle = rgba(255, 255, 255, 0.05);
    g.fillRect(3, 3, S - 6, 1);
    g.fillRect(3, 4, 1, S - 8);

    // 底部强调条
    if (accentColor) {
      g.fillStyle = accentColor;
      g.fillRect(3, S - 5, S - 6, 2);
    }

    savePng(c, name);
  }

  // 通用卡片
  drawCard('card-default.png', C.brnDk, C.bgDark, null);
  // 商品卡片
  drawCard('shop-item-bg.png', C.grnDk, '#0e1018', C.grnDk);
  // 战利品卡片
  drawCard('loot-card.png', C.gldDk, '#14101e', C.gldDk);
  // 事件卡片
  drawCard('event-card.png', C.purDk, '#14101e', C.purDk);
  // 遗物卡片
  drawCard('relic-card.png', C.purMd, '#1a1428', C.purDk);
  // 骰子卡片
  drawCard('dice-card.png', C.bluDk, '#101828', C.bluDk);
  // 篝火选项
  drawCard('campfire-option.png', '#6a4020', '#1a1008', '#4a2810');
  // 升级选项
  drawCard('levelup-option.png', C.gldMd, '#1a1810', C.gldDk);
  // 设置行
  drawCard('settings-row.png', C.gryDk, C.bgDark, null);
  // 日志行
  drawCard('log-row.png', '#1a1828', '#0e0c14', null);
  // 统计行
  drawCard('stat-row.png', C.gldDp, '#0e0c14', null);

  // 已售出覆盖（半透明灰）
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.fillStyle = rgba(10, 8, 16, 0.6);
    g.fillRect(0, 0, S, S);
    // 斜线纹理
    for (let i = 0; i < S * 2; i += 6) {
      g.fillStyle = rgba(40, 40, 50, 0.3);
      for (let d = 0; d < S; d++) {
        const x = i - d, y = d;
        if (x >= 0 && x < S && y >= 0 && y < S) sp(g, x, y, rgba(40, 40, 50, 0.3));
      }
    }
    savePng(c, 'shop-item-sold.png');
  }

  // 已拾取覆盖
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.fillStyle = rgba(10, 8, 16, 0.5);
    g.fillRect(0, 0, S, S);
    savePng(c, 'loot-card-collected.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 12. 弹窗系统组件
// ══════════════════════════════════════════════════════════════

function genModalParts() {
  // 模态框背景 32×32
  {
    const S = 32;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    // 外轮廓
    g.fillStyle = C.black;
    g.fillRect(3, 0, S - 6, 2); g.fillRect(3, S - 2, S - 6, 2);
    g.fillRect(0, 3, 2, S - 6); g.fillRect(S - 2, 3, 2, S - 6);
    g.fillRect(2, 2, 1, 1); g.fillRect(S - 3, 2, 1, 1);
    g.fillRect(2, S - 3, 1, 1); g.fillRect(S - 3, S - 3, 1, 1);
    // 双层边框
    drawBorder(g, 2, 2, S - 4, S - 4, 2, C.purDk, C.purDp, C.purDk, C.purDp);
    drawBorder(g, 4, 4, S - 8, S - 8, 1, C.brnDk, C.brnDp, C.brnDk, C.brnDp);
    // 填充
    g.fillStyle = C.bgDeep;
    g.fillRect(5, 5, S - 10, S - 10);
    savePng(c, 'modal-bg.png');
  }

  // 标题栏 32×12
  {
    const W = 32, H = 12;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.fillStyle = rgba(42, 37, 64, 0.4);
    g.fillRect(0, 0, W, H);
    g.fillStyle = C.purDk;
    g.fillRect(0, H - 1, W, 1);
    g.fillStyle = rgba(255, 240, 200, 0.04);
    g.fillRect(0, 0, W, 1);
    savePng(c, 'modal-title-bar.png');
  }

  // 关闭按钮 16×16
  {
    const S = 16;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(1, 0, S - 2, 1); g.fillRect(1, S - 1, S - 2, 1);
    g.fillRect(0, 1, 1, S - 2); g.fillRect(S - 1, 1, 1, S - 2);
    g.fillStyle = C.redDk;
    g.fillRect(1, 1, S - 2, S - 2);
    g.fillStyle = C.redBr;
    g.fillRect(2, 1, S - 4, 1);
    // X 图标
    g.fillStyle = '#ffffff';
    for (let i = 3; i < S - 3; i++) {
      sp(g, i, i, '#ffffff');
      sp(g, S - 1 - i, i, '#ffffff');
    }
    savePng(c, 'close-btn.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 13. 战斗 HUD 组件
// ══════════════════════════════════════════════════════════════

function genBattleHud() {
  // 骰子槽位 32×32
  function drawDiceSlot(name, borderColor, bgColor) {
    const S = 32;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(2, 0, S - 4, 2); g.fillRect(2, S - 2, S - 4, 2);
    g.fillRect(0, 2, 2, S - 4); g.fillRect(S - 2, 2, 2, S - 4);
    g.fillStyle = bgColor;
    g.fillRect(2, 2, S - 4, S - 4);
    drawBorder(g, 2, 2, S - 4, S - 4, 1, borderColor, borderColor, borderColor, borderColor);
    // 内凹效果
    g.fillStyle = rgba(0, 0, 0, 0.2);
    g.fillRect(3, 3, S - 6, 1);
    g.fillRect(3, 4, 1, S - 8);
    g.fillStyle = rgba(255, 255, 255, 0.03);
    g.fillRect(3, S - 4, S - 6, 1);
    g.fillRect(S - 4, 3, 1, S - 6);
    savePng(c, name);
  }

  drawDiceSlot('dice-slot.png', C.brnDk, '#08060e');
  drawDiceSlot('dice-slot-active.png', C.gldMd, '#14100a');

  // 敌人血条背景 32×6
  {
    const W = 32, H = 6;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.fillStyle = C.black;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#0a0810';
    g.fillRect(1, 1, W - 2, H - 2);
    savePng(c, 'enemy-hp-bg.png');
  }

  // 敌人血条填充 32×6
  {
    const W = 32, H = 6;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.fillStyle = C.redBr;
    g.fillRect(0, 0, W, 3);
    g.fillStyle = C.redDk;
    g.fillRect(0, 3, W, 3);
    g.fillStyle = rgba(255, 255, 255, 0.2);
    g.fillRect(0, 0, W, 1);
    savePng(c, 'enemy-hp-fill.png');
  }

  // 意图背景框 24×24
  {
    const S = 24;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(1, 0, S - 2, 1); g.fillRect(1, S - 1, S - 2, 1);
    g.fillRect(0, 1, 1, S - 2); g.fillRect(S - 1, 1, 1, S - 2);
    g.fillStyle = rgba(14, 12, 20, 0.9);
    g.fillRect(1, 1, S - 2, S - 2);
    g.fillStyle = C.redDk;
    g.fillRect(2, 1, S - 4, 1);
    savePng(c, 'intent-bg.png');
  }

  // 回合/波次徽章 24×12
  function drawBadge(name, color) {
    const W = 24, H = 12;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = C.black;
    g.fillRect(2, 0, W - 4, 1); g.fillRect(2, H - 1, W - 4, 1);
    g.fillRect(0, 2, 1, H - 4); g.fillRect(W - 1, 2, 1, H - 4);
    g.fillRect(1, 1, 1, 1); g.fillRect(W - 2, 1, 1, 1);
    g.fillRect(1, H - 2, 1, 1); g.fillRect(W - 2, H - 2, 1, 1);
    g.fillStyle = color;
    g.fillRect(1, 1, W - 2, H - 2);
    g.fillStyle = rgba(255, 255, 255, 0.15);
    g.fillRect(2, 1, W - 4, 1);
    g.fillStyle = rgba(0, 0, 0, 0.2);
    g.fillRect(2, H - 2, W - 4, 1);
    savePng(c, name);
  }

  drawBadge('turn-badge.png', C.bgMid);
  drawBadge('wave-badge.png', C.gldDp);
  drawBadge('badge-gold.png', C.gldDk);
  drawBadge('badge-silver.png', C.gryDk);

  // HUD 底板 32×32
  {
    const S = 32;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.fillStyle = C.bgDeep;
    g.fillRect(0, 0, S, S);
    // 顶部分隔线
    g.fillStyle = C.brnMd;
    g.fillRect(0, 0, S, 2);
    g.fillStyle = C.brnDp;
    g.fillRect(0, 2, S, 1);
    // 微妙纹理
    for (let i = 0; i < 8; i++) {
      const x = randInt(0, S - 1), y = randInt(4, S - 1);
      sp(g, x, y, rgba(255, 255, 255, 0.02));
    }
    savePng(c, 'hud-bg.png');
  }

  // 顶栏背景 32×12
  {
    const W = 32, H = 12;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.fillStyle = rgba(10, 8, 16, 0.95);
    g.fillRect(0, 0, W, H);
    g.fillStyle = C.brnDp;
    g.fillRect(0, H - 1, W, 1);
    g.fillStyle = rgba(255, 240, 200, 0.03);
    g.fillRect(0, 0, W, 1);
    savePng(c, 'topbar-bg.png');
  }

  // 顶栏按钮 16×16
  {
    const S = 16;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(1, 0, S - 2, 1); g.fillRect(1, S - 1, S - 2, 1);
    g.fillRect(0, 1, 1, S - 2); g.fillRect(S - 1, 1, 1, S - 2);
    g.fillStyle = C.bgMid;
    g.fillRect(1, 1, S - 2, S - 2);
    g.fillStyle = rgba(255, 255, 255, 0.06);
    g.fillRect(2, 1, S - 4, 1);
    savePng(c, 'topbar-btn.png');
  }

  // 价格标签 24×10
  {
    const W = 24, H = 10;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = C.black;
    g.fillRect(1, 0, W - 2, 1); g.fillRect(1, H - 1, W - 2, 1);
    g.fillRect(0, 1, 1, H - 2); g.fillRect(W - 1, 1, 1, H - 2);
    g.fillStyle = C.gldDp;
    g.fillRect(1, 1, W - 2, H - 2);
    g.fillStyle = C.gldMd;
    g.fillRect(2, 1, W - 4, 1);
    savePng(c, 'price-tag.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 14. 暗角遮罩 — 64×64（LINEAR 渲染）
// ══════════════════════════════════════════════════════════════

function genVignette() {
  const S = 64;
  const c = createCanvas(S, S);
  const g = c.getContext('2d');
  // 径向渐变暗角
  const grad = g.createRadialGradient(S / 2, S / 2, S * 0.15, S / 2, S / 2, S * 0.5);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
  grad.addColorStop(0.8, 'rgba(0,0,0,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0.7)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  savePng(c, 'vignette.png');
}

// ══════════════════════════════════════════════════════════════
// 15. 小图标 — 16×16
// ══════════════════════════════════════════════════════════════

function genSmallIcons() {
  const S = 16;

  // 星星（满）
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    const star = [
      [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0],
      [0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0],
      [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1],
      [1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (star[y][x]) sp(g, x, y, C.gldBr);
      }
    }
    savePng(c, 'star.png');
  }

  // 星星（空）
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    const star = [
      [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
      [0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
      [1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1],
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
      [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
      [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0],
      [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
      [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
      [0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ];
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (star[y][x]) sp(g, x, y, C.gryMd);
      }
    }
    savePng(c, 'star-empty.png');
  }

  // 箭头（下）
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = '#ffffff';
    g.fillRect(7, 3, 2, 8);
    g.fillRect(5, 9, 6, 2);
    g.fillRect(6, 11, 4, 1);
    g.fillRect(7, 12, 2, 1);
    savePng(c, 'arrow-down.png');
  }

  // 小面板（用于 tooltip 内嵌小框）
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(1, 0, S - 2, 1); g.fillRect(1, S - 1, S - 2, 1);
    g.fillRect(0, 1, 1, S - 2); g.fillRect(S - 1, 1, 1, S - 2);
    g.fillStyle = '#0a0810';
    g.fillRect(1, 1, S - 2, S - 2);
    g.fillStyle = C.brnDp;
    g.fillRect(2, 1, S - 4, 1);
    savePng(c, 'small-panel.png');
  }

  // 标题装饰边框 32×8
  {
    const W = 32, H = 8;
    const c = createCanvas(W, H);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    // 中心线
    g.fillStyle = C.gldDk;
    g.fillRect(0, 3, W, 1);
    g.fillStyle = C.gldDp;
    g.fillRect(0, 4, W, 1);
    // 两端装饰
    g.fillStyle = C.gldMd;
    g.fillRect(0, 2, 3, 4);
    g.fillRect(W - 3, 2, 3, 4);
    // 中心菱形
    sp(g, W / 2 - 1, 1, C.gldBr); sp(g, W / 2, 1, C.gldBr);
    sp(g, W / 2 - 2, 2, C.gldMd); sp(g, W / 2 + 1, 2, C.gldMd);
    sp(g, W / 2 - 2, 5, C.gldDk); sp(g, W / 2 + 1, 5, C.gldDk);
    sp(g, W / 2 - 1, 6, C.gldDk); sp(g, W / 2, 6, C.gldDk);
    savePng(c, 'title-border.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 16. 骰子面槽位 — 16×16
// ══════════════════════════════════════════════════════════════

function genDiceFaceSlots() {
  const S = 16;

  function drawFaceSlot(name, borderColor, bgColor) {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(1, 0, S - 2, 1); g.fillRect(1, S - 1, S - 2, 1);
    g.fillRect(0, 1, 1, S - 2); g.fillRect(S - 1, 1, 1, S - 2);
    g.fillStyle = bgColor;
    g.fillRect(1, 1, S - 2, S - 2);
    g.fillStyle = borderColor;
    g.fillRect(2, 1, S - 4, 1);
    g.fillRect(1, 2, 1, S - 4);
    g.fillStyle = rgba(0, 0, 0, 0.2);
    g.fillRect(2, S - 2, S - 4, 1);
    g.fillRect(S - 2, 2, 1, S - 4);
    savePng(c, name);
  }

  drawFaceSlot('dice-face-slot.png', C.brnDk, '#0a0810');
  // 遗物格子
  drawFaceSlot('relic-cell.png', C.purDk, '#0e0a18');
  drawFaceSlot('relic-cell-locked.png', '#1a1a22', '#08080e');
}

// ══════════════════════════════════════════════════════════════
// 17. 魂晶商店专用
// ══════════════════════════════════════════════════════════════

function genSoulShop() {
  const S = 32;

  // 商品行背景
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.fillStyle = '#121020';
    g.fillRect(0, 0, S, S);
    g.fillStyle = rgba(42, 37, 64, 0.5);
    g.fillRect(0, 0, S, 1);
    g.fillRect(0, S - 1, S, 1);
    g.fillRect(0, 0, 1, S);
    g.fillRect(S - 1, 0, 1, S);
    // 内高光
    g.fillStyle = rgba(255, 255, 255, 0.03);
    g.fillRect(1, 1, S - 2, 1);
    savePng(c, 'soul-shop-row.png');
  }

  // 已拥有行
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.fillStyle = rgba(26, 104, 48, 0.15);
    g.fillRect(0, 0, S, S);
    g.fillStyle = rgba(52, 208, 88, 0.15);
    g.fillRect(0, 0, S, 1);
    g.fillRect(0, S - 1, S, 1);
    g.fillRect(0, 0, 1, S);
    g.fillRect(S - 1, 0, 1, S);
    savePng(c, 'soul-shop-row-owned.png');
  }

  // 遗物详情弹窗
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(2, 0, S - 4, 1); g.fillRect(2, S - 1, S - 4, 1);
    g.fillRect(0, 2, 1, S - 4); g.fillRect(S - 1, 2, 1, S - 4);
    g.fillRect(1, 1, 1, 1); g.fillRect(S - 2, 1, 1, 1);
    g.fillRect(1, S - 2, 1, 1); g.fillRect(S - 2, S - 2, 1, 1);
    drawBorder(g, 1, 1, S - 2, S - 2, 2, C.purMd, C.purDp, C.purDk, C.purDp);
    g.fillStyle = '#1e1c28';
    g.fillRect(3, 3, S - 6, S - 6);
    savePng(c, 'relic-detail.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 18. 地图路径纹理 — 8×8 可平铺
// ══════════════════════════════════════════════════════════════

function genMapPath() {
  const S = 8;
  const c = createCanvas(S, S);
  const g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  // 虚线纹理
  g.fillStyle = C.brnDk;
  g.fillRect(0, 3, 4, 2);
  g.fillStyle = rgba(0, 0, 0, 0.3);
  g.fillRect(0, 5, 4, 1);
  savePng(c, 'map-path.png');
}

// ══════════════════════════════════════════════════════════════
// 执行
// ══════════════════════════════════════════════════════════════

console.log('\n  六面史诗 · UI 素材生成器 v3');
console.log('  基础网格: 32x32 | 配色: Peglin + WoW 西幻');
console.log('  输出: ' + OUT);
console.log('  ════════════════════════════════════════\n');

console.log('--- 1. 面板边框 ---');
genPanels();

console.log('\n--- 2. 按钮 ---');
genButtons();

console.log('\n--- 3. 进度条 ---');
genBars();

console.log('\n--- 4. 纹理 ---');
genTextures();

console.log('\n--- 5. 图标框 ---');
genIconFrames();

console.log('\n--- 6. 分隔线 ---');
genDividers();

console.log('\n--- 7. 复选框 ---');
genCheckboxes();

console.log('\n--- 8. 标签页 ---');
genTabs();

console.log('\n--- 9. 滚动条 ---');
genScrollbar();

console.log('\n--- 10. 地图节点 ---');
genMapNodes();

console.log('\n--- 11. 卡片 ---');
genCards();

console.log('\n--- 12. 弹窗组件 ---');
genModalParts();

console.log('\n--- 13. 战斗 HUD ---');
genBattleHud();

console.log('\n--- 14. 暗角遮罩 ---');
genVignette();

console.log('\n--- 15. 小图标 ---');
genSmallIcons();

console.log('\n--- 16. 骰子面槽 ---');
genDiceFaceSlots();

console.log('\n--- 17. 魂晶商店 ---');
genSoulShop();

console.log('\n--- 18. 地图路径 ---');
genMapPath();

console.log('\n  ════════════════════════════════════════');
const files = fs.readdirSync(OUT);
console.log('  总计: ' + files.length + ' 个素材文件');
console.log('  完成!\n');
