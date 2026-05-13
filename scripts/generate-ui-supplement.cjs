/**
 * 六面史诗 · 补充素材生成器
 * 
 * 新增：石板、木板、石墙、宝石、铆钉、改进木纹
 * 运行：node scripts/generate-ui-supplement.cjs
 * 输出：public/ui/
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
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rgba(r, g, b, a) { return 'rgba(' + r + ',' + g + ',' + b + ',' + (a === undefined ? 1 : a) + ')'; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// 配色
const C = {
  black: '#000000',
  bgDeep: '#0e0c14',
  brnHi: '#9a8060', brnLt: '#8a7050', brnMd: '#6a5438', brnDk: '#4a3824', brnDp: '#2a1e14',
  gldBr: '#f0d860', gldMd: '#d4a030', gldDk: '#8a6a18', gldDp: '#5a4410',
  gryLt: '#6a6a74', gryMd: '#4a4a54', gryDk: '#3a3a44', gryDp: '#2a2a34',
};

// ══════════════════════════════════════════════════════════════
// 1. 石板材质 — 32×32 可平铺
//    大块不规则石板，有裂纹、磨损、苔藓痕迹
// ══════════════════════════════════════════════════════════════

function genStoneSlab() {
  const S = 32;
  const c = createCanvas(S, S);
  const g = px(c.getContext('2d'));

  // 基底色：冷灰蓝石板
  const base = [36, 38, 42];
  g.fillStyle = rgba(...base);
  g.fillRect(0, 0, S, S);

  // 大块石板分区（不规则切割）
  // 用几条不规则的缝隙把 32×32 分成 4-5 块大石板
  const slabs = [
    { x: 0, y: 0, w: 18, h: 14 },
    { x: 19, y: 0, w: 13, h: 10 },
    { x: 19, y: 11, w: 13, h: 8 },
    { x: 0, y: 15, w: 12, h: 17 },
    { x: 13, y: 15, w: 7, h: 17 },
    { x: 21, y: 20, w: 11, h: 12 },
  ];

  for (const slab of slabs) {
    // 每块石板略有色差
    const dr = randInt(-6, 6), dg = randInt(-6, 6), db = randInt(-4, 4);
    const sr = clamp(base[0] + dr, 20, 60);
    const sg = clamp(base[1] + dg, 22, 62);
    const sb = clamp(base[2] + db, 28, 68);
    g.fillStyle = rgba(sr, sg, sb);
    g.fillRect(slab.x, slab.y, slab.w, slab.h);

    // 石板表面粗糙噪点
    for (let i = 0; i < slab.w * slab.h * 0.15; i++) {
      const nx = slab.x + randInt(0, slab.w - 1);
      const ny = slab.y + randInt(0, slab.h - 1);
      const nv = randInt(-8, 8);
      sp(g, nx, ny, rgba(
        clamp(sr + nv, 16, 72),
        clamp(sg + nv, 18, 74),
        clamp(sb + nv, 22, 78),
        0.6
      ));
    }

    // 石板边缘高光（上/左 1px）
    g.fillStyle = rgba(255, 255, 255, 0.04);
    g.fillRect(slab.x, slab.y, slab.w, 1);
    g.fillRect(slab.x, slab.y + 1, 1, slab.h - 2);

    // 石板边缘暗影（下/右 1px）
    g.fillStyle = rgba(0, 0, 0, 0.08);
    g.fillRect(slab.x, slab.y + slab.h - 1, slab.w, 1);
    g.fillRect(slab.x + slab.w - 1, slab.y, 1, slab.h);
  }

  // 石板缝隙（深色不规则线）
  // 水平缝
  for (let x = 0; x < S; x++) {
    const y1 = 14 + (x > 16 ? -4 : 0) + (Math.random() > 0.7 ? randInt(-1, 1) : 0);
    if (y1 >= 0 && y1 < S) sp(g, x, y1, rgba(8, 8, 12, 0.7));
  }
  // 竖缝
  for (let y = 0; y < 14; y++) {
    const x1 = 18 + (Math.random() > 0.7 ? randInt(-1, 0) : 0);
    if (x1 >= 0 && x1 < S) sp(g, x1, y, rgba(8, 8, 12, 0.7));
  }
  for (let y = 15; y < S; y++) {
    const x1 = 12 + (Math.random() > 0.6 ? randInt(-1, 1) : 0);
    if (x1 >= 0 && x1 < S) sp(g, x1, y, rgba(8, 8, 12, 0.6));
    const x2 = 20 + (Math.random() > 0.6 ? randInt(-1, 1) : 0);
    if (x2 >= 0 && x2 < S) sp(g, x2, y, rgba(8, 8, 12, 0.6));
  }

  // 裂纹（1-2条斜线）
  let cx = randInt(4, 12), cy = randInt(2, 8);
  for (let i = 0; i < randInt(4, 8); i++) {
    if (cx >= 0 && cx < S && cy >= 0 && cy < S) {
      sp(g, cx, cy, rgba(16, 16, 22, 0.5));
    }
    cx += randInt(0, 1);
    cy += 1;
  }

  // 苔藓/污渍（绿色微点）
  for (let i = 0; i < 4; i++) {
    const mx = randInt(1, S - 2), my = randInt(1, S - 2);
    sp(g, mx, my, rgba(40, 55, 35, 0.25));
    if (Math.random() > 0.5) sp(g, mx + 1, my, rgba(35, 50, 30, 0.2));
  }

  savePng(c, 'tex-stone-slab.png');
}

// ══════════════════════════════════════════════════════════════
// 2. 木板材质 — 32×32 可平铺
//    竖向木板，有木节、年轮纹、钉孔
// ══════════════════════════════════════════════════════════════

function genWoodPlank() {
  const S = 32;
  const c = createCanvas(S, S);
  const g = px(c.getContext('2d'));

  // 暖棕木色基底
  const base = [58, 42, 26];
  g.fillStyle = rgba(...base);
  g.fillRect(0, 0, S, S);

  // 3 条竖向木板
  const planks = [
    { x: 0, w: 10 },
    { x: 11, w: 10 },
    { x: 22, w: 10 },
  ];

  for (const plank of planks) {
    // 每块板略有色差
    const dr = randInt(-8, 8);
    const pr = clamp(base[0] + dr, 38, 78);
    const pg = clamp(base[1] + Math.floor(dr * 0.7), 28, 58);
    const pb = clamp(base[2] + Math.floor(dr * 0.4), 16, 40);

    g.fillStyle = rgba(pr, pg, pb);
    g.fillRect(plank.x, 0, plank.w, S);

    // 纵向木纹线（深浅交替的水平条纹模拟年轮截面）
    for (let y = 0; y < S; y++) {
      const wave = Math.sin(y * 0.3 + plank.x * 0.2) * 4 + Math.sin(y * 0.7) * 2;
      const v = Math.floor(wave);
      if (Math.abs(v) > 1) {
        g.fillStyle = rgba(
          clamp(pr + v * 2, 30, 90),
          clamp(pg + v, 20, 65),
          clamp(pb + Math.floor(v * 0.5), 10, 45),
          0.5
        );
        g.fillRect(plank.x, y, plank.w, 1);
      }
    }

    // 木纹细线（更深的纵向纹路）
    for (let i = 0; i < 3; i++) {
      const lx = plank.x + randInt(1, plank.w - 2);
      for (let y = 0; y < S; y++) {
        const drift = Math.sin(y * 0.4 + i) > 0.3 ? 1 : 0;
        const fx = lx + drift;
        if (fx >= plank.x && fx < plank.x + plank.w) {
          sp(g, fx, y, rgba(pr - 12, pg - 8, pb - 4, 0.3));
        }
      }
    }

    // 木节（1-2个椭圆形暗斑）
    if (Math.random() > 0.3) {
      const kx = plank.x + randInt(2, plank.w - 3);
      const ky = randInt(6, S - 6);
      // 木节中心（深色）
      sp(g, kx, ky, rgba(30, 22, 14, 0.7));
      sp(g, kx + 1, ky, rgba(32, 24, 16, 0.6));
      sp(g, kx, ky + 1, rgba(32, 24, 16, 0.6));
      // 木节环（稍浅）
      sp(g, kx - 1, ky, rgba(40, 30, 18, 0.4));
      sp(g, kx + 2, ky, rgba(40, 30, 18, 0.4));
      sp(g, kx, ky - 1, rgba(40, 30, 18, 0.4));
      sp(g, kx, ky + 2, rgba(40, 30, 18, 0.4));
      sp(g, kx + 1, ky + 1, rgba(35, 26, 16, 0.5));
      // 年轮弧线围绕木节
      for (let r = 3; r <= 5; r++) {
        for (let a = -2; a <= 2; a++) {
          const rx = kx + Math.round(Math.cos(a * 0.5) * r);
          const ry = ky + Math.round(Math.sin(a * 0.5) * r * 0.6);
          if (rx >= plank.x && rx < plank.x + plank.w && ry >= 0 && ry < S) {
            sp(g, rx, ry, rgba(pr - 8, pg - 6, pb - 3, 0.25));
          }
        }
      }
    }

    // 板边高光（左 1px）
    g.fillStyle = rgba(255, 240, 200, 0.06);
    g.fillRect(plank.x, 0, 1, S);
    // 板边暗影（右 1px）
    g.fillStyle = rgba(0, 0, 0, 0.1);
    g.fillRect(plank.x + plank.w - 1, 0, 1, S);
  }

  // 板缝（深色竖线）
  g.fillStyle = rgba(14, 10, 6, 0.8);
  g.fillRect(10, 0, 1, S);
  g.fillRect(21, 0, 1, S);

  // 钉孔（2个小黑点 + 金属反光）
  const nails = [[4, 4], [15, 4], [26, 4], [4, 28], [15, 28], [26, 28]];
  for (const [nx, ny] of nails) {
    sp(g, nx, ny, rgba(10, 8, 6, 0.8));
    sp(g, nx + 1, ny, rgba(10, 8, 6, 0.6));
    sp(g, nx, ny + 1, rgba(10, 8, 6, 0.6));
    sp(g, nx + 1, ny + 1, rgba(60, 55, 50, 0.3)); // 金属反光
  }

  savePng(c, 'tex-wood-plank.png');
}

// ══════════════════════════════════════════════════════════════
// 3. 石墙材质 — 32×32 可平铺
//    不规则石块堆砌，大小不一，灰泥填缝
// ══════════════════════════════════════════════════════════════

function genStoneWall() {
  const S = 32;
  const c = createCanvas(S, S);
  const g = px(c.getContext('2d'));

  // 灰泥底色（缝隙色）
  g.fillStyle = rgba(20, 18, 16);
  g.fillRect(0, 0, S, S);

  // 不规则石块定义（手工排列，大小不一）
  const stones = [
    // 第一行
    { x: 0, y: 0, w: 8, h: 6 },
    { x: 9, y: 0, w: 6, h: 7 },
    { x: 16, y: 0, w: 10, h: 5 },
    { x: 27, y: 0, w: 5, h: 7 },
    // 第二行
    { x: 0, y: 7, w: 5, h: 5 },
    { x: 6, y: 7, w: 9, h: 6 },
    { x: 16, y: 6, w: 7, h: 5 },
    { x: 24, y: 6, w: 8, h: 6 },
    // 第三行
    { x: 0, y: 13, w: 7, h: 6 },
    { x: 8, y: 13, w: 5, h: 5 },
    { x: 14, y: 12, w: 8, h: 7 },
    { x: 23, y: 13, w: 9, h: 5 },
    // 第四行
    { x: 0, y: 19, w: 10, h: 5 },
    { x: 11, y: 19, w: 6, h: 6 },
    { x: 18, y: 19, w: 7, h: 5 },
    { x: 26, y: 19, w: 6, h: 6 },
    // 第五行
    { x: 0, y: 25, w: 6, h: 7 },
    { x: 7, y: 25, w: 8, h: 7 },
    { x: 16, y: 25, w: 5, h: 7 },
    { x: 22, y: 25, w: 10, h: 7 },
  ];

  for (const st of stones) {
    // 每块石头独立色调（灰色系，偏暖或偏冷随机）
    const warm = Math.random() > 0.5;
    const baseR = warm ? randInt(38, 56) : randInt(34, 48);
    const baseG = warm ? randInt(36, 50) : randInt(36, 52);
    const baseB = warm ? randInt(30, 42) : randInt(38, 54);

    // 石块主体
    g.fillStyle = rgba(baseR, baseG, baseB);
    g.fillRect(st.x, st.y, st.w, st.h);

    // 石面粗糙噪点
    for (let i = 0; i < st.w * st.h * 0.2; i++) {
      const nx = st.x + randInt(0, st.w - 1);
      const ny = st.y + randInt(0, st.h - 1);
      const nv = randInt(-6, 6);
      sp(g, nx, ny, rgba(
        clamp(baseR + nv, 24, 68),
        clamp(baseG + nv, 24, 66),
        clamp(baseB + nv, 20, 66),
        0.5
      ));
    }

    // 石块上/左高光
    g.fillStyle = rgba(255, 255, 255, 0.06);
    g.fillRect(st.x, st.y, st.w, 1);
    g.fillRect(st.x, st.y + 1, 1, st.h - 2);

    // 石块下/右暗影
    g.fillStyle = rgba(0, 0, 0, 0.12);
    g.fillRect(st.x, st.y + st.h - 1, st.w, 1);
    g.fillRect(st.x + st.w - 1, st.y, 1, st.h);

    // 偶尔有凹坑
    if (Math.random() > 0.6 && st.w > 4 && st.h > 4) {
      const px2 = st.x + randInt(2, st.w - 3);
      const py2 = st.y + randInt(2, st.h - 3);
      sp(g, px2, py2, rgba(baseR - 12, baseG - 10, baseB - 8, 0.5));
    }
  }

  // 灰泥缝隙加强（在石块间隙补深色）
  // 扫描每个像素，如果周围有两块不同石头的边界，加深
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let inStone = false;
      for (const st of stones) {
        if (x >= st.x && x < st.x + st.w && y >= st.y && y < st.y + st.h) {
          inStone = true;
          break;
        }
      }
      if (!inStone) {
        // 灰泥填缝 + 微妙色差
        sp(g, x, y, rgba(
          20 + randInt(-3, 3),
          18 + randInt(-3, 3),
          16 + randInt(-2, 2),
          1
        ));
      }
    }
  }

  savePng(c, 'tex-stone-wall.png');
}

// ══════════════════════════════════════════════════════════════
// 4. 改进木纹 — 32×32 可平铺
//    更有树木质感：明显的年轮弧线、树皮边缘
// ══════════════════════════════════════════════════════════════

function genWoodGrain() {
  const S = 32;
  const c = createCanvas(S, S);
  const g = px(c.getContext('2d'));

  // 深棕基底
  const base = [52, 38, 24];
  g.fillStyle = rgba(...base);
  g.fillRect(0, 0, S, S);

  // 年轮弧线（从底部中心向外扩散的弧形）
  const cx = 16, cy = 40; // 圆心在画面下方外
  for (let r = 4; r < 50; r += randInt(2, 4)) {
    const dark = r % 6 < 3;
    const ringR = dark ? base[0] - 8 : base[0] + 6;
    const ringG = dark ? base[1] - 6 : base[1] + 4;
    const ringB = dark ? base[2] - 4 : base[2] + 2;

    for (let a = -1.2; a < 1.2; a += 0.02) {
      const px2 = Math.round(cx + Math.cos(a - Math.PI / 2) * r);
      const py2 = Math.round(cy + Math.sin(a - Math.PI / 2) * r);
      if (px2 >= 0 && px2 < S && py2 >= 0 && py2 < S) {
        sp(g, px2, py2, rgba(
          clamp(ringR + randInt(-2, 2), 24, 72),
          clamp(ringG + randInt(-2, 2), 18, 56),
          clamp(ringB + randInt(-1, 1), 12, 40),
          0.6
        ));
      }
    }
  }

  // 径向纹理线（从中心向外的细线）
  for (let i = 0; i < 5; i++) {
    const angle = randInt(-60, 60) * Math.PI / 180 - Math.PI / 2;
    for (let r = 0; r < 40; r++) {
      const lx = Math.round(cx + Math.cos(angle) * r);
      const ly = Math.round(cy + Math.sin(angle) * r);
      if (lx >= 0 && lx < S && ly >= 0 && ly < S) {
        sp(g, lx, ly, rgba(base[0] + 4, base[1] + 2, base[2] + 1, 0.15));
      }
    }
  }

  // 表面噪点
  for (let i = 0; i < 30; i++) {
    const nx = randInt(0, S - 1), ny = randInt(0, S - 1);
    const nv = randInt(-5, 5);
    sp(g, nx, ny, rgba(
      clamp(base[0] + nv, 30, 70),
      clamp(base[1] + nv, 22, 54),
      clamp(base[2] + nv, 14, 38),
      0.3
    ));
  }

  savePng(c, 'tex-wood-grain.png');
}

// ══════════════════════════════════════════════════════════════
// 5. 宝石素材 — 8×8 每颗
//    红宝石、蓝宝石、绿宝石、紫水晶、琥珀
// ══════════════════════════════════════════════════════════════

function genGems() {
  const S = 8;

  function drawGem(name, colors) {
    // colors: { outline, dark, mid, light, highlight }
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);

    // 菱形宝石轮廓
    //     ##
    //    ####
    //   ######
    //  ########  (中间最宽 = 第3-4行)
    //   ######
    //    ####
    //     ##
    const rows = [
      { y: 0, x0: 3, x1: 4 },
      { y: 1, x0: 2, x1: 5 },
      { y: 2, x0: 1, x1: 6 },
      { y: 3, x0: 0, x1: 7 },
      { y: 4, x0: 0, x1: 7 },
      { y: 5, x0: 1, x1: 6 },
      { y: 6, x0: 2, x1: 5 },
      { y: 7, x0: 3, x1: 4 },
    ];

    // 填充主体
    for (const row of rows) {
      for (let x = row.x0; x <= row.x1; x++) {
        // 上半部分偏亮，下半部分偏暗
        const isTop = row.y < 4;
        const isEdge = x === row.x0 || x === row.x1;
        let color;
        if (isEdge) {
          color = colors.outline;
        } else if (isTop && row.y <= 1) {
          color = colors.light;
        } else if (isTop) {
          color = colors.mid;
        } else if (row.y >= 6) {
          color = colors.dark;
        } else {
          color = colors.mid;
        }
        sp(g, x, row.y, color);
      }
    }

    // 高光点（左上角 1-2 像素）
    sp(g, 3, 1, colors.highlight);
    sp(g, 2, 2, colors.highlight);
    sp(g, 3, 2, colors.light);

    // 底部暗角
    sp(g, 3, 6, colors.dark);
    sp(g, 4, 6, colors.dark);

    // 切面线（中间横线）
    sp(g, 1, 3, colors.outline);
    sp(g, 6, 3, colors.outline);
    sp(g, 1, 4, colors.outline);
    sp(g, 6, 4, colors.outline);

    savePng(c, name);
  }

  // 红宝石
  drawGem('gem-red.png', {
    outline: '#5a1010',
    dark: '#8a2020',
    mid: '#cc3030',
    light: '#e85050',
    highlight: '#ff9090',
  });

  // 蓝宝石
  drawGem('gem-blue.png', {
    outline: '#0a1840',
    dark: '#1a3068',
    mid: '#2a58a8',
    light: '#4080d0',
    highlight: '#80b8ff',
  });

  // 绿宝石
  drawGem('gem-green.png', {
    outline: '#0a3010',
    dark: '#1a5020',
    mid: '#2a8838',
    light: '#40b850',
    highlight: '#80e890',
  });

  // 紫水晶
  drawGem('gem-purple.png', {
    outline: '#2a0840',
    dark: '#4a1868',
    mid: '#7a30a8',
    light: '#a050d0',
    highlight: '#d090ff',
  });

  // 琥珀
  drawGem('gem-amber.png', {
    outline: '#3a2008',
    dark: '#6a4010',
    mid: '#c88020',
    light: '#e8a840',
    highlight: '#ffe080',
  });

  // 钻石（白色/冰蓝）
  drawGem('gem-diamond.png', {
    outline: '#3a4050',
    dark: '#8090a0',
    mid: '#b0c0d0',
    light: '#d0e0f0',
    highlight: '#ffffff',
  });
}

// ══════════════════════════════════════════════════════════════
// 6. 铆钉素材 — 多种尺寸
//    4×4 小铆钉、6×6 中铆钉、8×8 大铆钉
// ══════════════════════════════════════════════════════════════

function genRivets() {
  // 4×4 小铆钉（铁质）
  {
    const S = 4;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    //  .##.
    //  #HL#
    //  #LM#
    //  .##.
    sp(g, 1, 0, '#4a4a54'); sp(g, 2, 0, '#4a4a54');
    sp(g, 0, 1, '#4a4a54'); sp(g, 1, 1, '#8a8a94'); sp(g, 2, 1, '#6a6a74'); sp(g, 3, 1, '#3a3a44');
    sp(g, 0, 2, '#3a3a44'); sp(g, 1, 2, '#6a6a74'); sp(g, 2, 2, '#5a5a64'); sp(g, 3, 2, '#2a2a34');
    sp(g, 1, 3, '#2a2a34'); sp(g, 2, 3, '#2a2a34');
    savePng(c, 'rivet-small.png');
  }

  // 6×6 中铆钉（铁质，有高光和暗角）
  {
    const S = 6;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    // 外圈
    const o = '#2a2a34';
    sp(g, 2, 0, o); sp(g, 3, 0, o);
    sp(g, 1, 1, o); sp(g, 4, 1, o);
    sp(g, 0, 2, o); sp(g, 5, 2, o);
    sp(g, 0, 3, o); sp(g, 5, 3, o);
    sp(g, 1, 4, o); sp(g, 4, 4, o);
    sp(g, 2, 5, o); sp(g, 3, 5, o);
    // 主体
    const m = '#5a5a64';
    sp(g, 2, 1, m); sp(g, 3, 1, m);
    sp(g, 1, 2, m); sp(g, 2, 2, '#7a7a84'); sp(g, 3, 2, '#6a6a74'); sp(g, 4, 2, m);
    sp(g, 1, 3, '#4a4a54'); sp(g, 2, 3, '#6a6a74'); sp(g, 3, 3, '#5a5a64'); sp(g, 4, 3, '#4a4a54');
    sp(g, 2, 4, '#4a4a54'); sp(g, 3, 4, '#4a4a54');
    // 高光
    sp(g, 2, 1, '#9a9aa4');
    sp(g, 1, 2, '#8a8a94');
    savePng(c, 'rivet-medium.png');
  }

  // 8×8 大铆钉（金色装饰铆钉）
  {
    const S = 8;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    // 外圈（深金）
    const o = '#3a2808';
    sp(g, 3, 0, o); sp(g, 4, 0, o);
    sp(g, 2, 1, o); sp(g, 5, 1, o);
    sp(g, 1, 2, o); sp(g, 6, 2, o);
    sp(g, 0, 3, o); sp(g, 7, 3, o);
    sp(g, 0, 4, o); sp(g, 7, 4, o);
    sp(g, 1, 5, o); sp(g, 6, 5, o);
    sp(g, 2, 6, o); sp(g, 5, 6, o);
    sp(g, 3, 7, o); sp(g, 4, 7, o);
    // 主体（金色渐变）
    sp(g, 3, 1, '#c89830'); sp(g, 4, 1, '#b88828');
    sp(g, 2, 2, '#c89830'); sp(g, 3, 2, '#e8c050'); sp(g, 4, 2, '#d4a030'); sp(g, 5, 2, '#a87820');
    sp(g, 1, 3, '#b88828'); sp(g, 2, 3, '#e8c050'); sp(g, 3, 3, '#f0d860'); sp(g, 4, 3, '#e8c050'); sp(g, 5, 3, '#c89830'); sp(g, 6, 3, '#8a6818');
    sp(g, 1, 4, '#a87820'); sp(g, 2, 4, '#d4a030'); sp(g, 3, 4, '#e8c050'); sp(g, 4, 4, '#d4a030'); sp(g, 5, 4, '#b88828'); sp(g, 6, 4, '#7a5810');
    sp(g, 2, 5, '#9a7020'); sp(g, 3, 5, '#c89830'); sp(g, 4, 5, '#b88828'); sp(g, 5, 5, '#8a6818');
    sp(g, 3, 6, '#8a6818'); sp(g, 4, 6, '#7a5810');
    // 高光点
    sp(g, 3, 2, '#ffe888');
    sp(g, 2, 3, '#ffe888');
    savePng(c, 'rivet-gold.png');
  }

  // 4×4 小铆钉（金色版）
  {
    const S = 4;
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    sp(g, 1, 0, '#8a6818'); sp(g, 2, 0, '#8a6818');
    sp(g, 0, 1, '#8a6818'); sp(g, 1, 1, '#f0d860'); sp(g, 2, 1, '#d4a030'); sp(g, 3, 1, '#5a4410');
    sp(g, 0, 2, '#5a4410'); sp(g, 1, 2, '#d4a030'); sp(g, 2, 2, '#b88828'); sp(g, 3, 2, '#3a2808');
    sp(g, 1, 3, '#3a2808'); sp(g, 2, 3, '#3a2808');
    savePng(c, 'rivet-gold-small.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 7. 角落装饰 — 8×8
//    用于面板四角的金属角饰
// ══════════════════════════════════════════════════════════════

function genCornerDecor() {
  const S = 8;

  // 左上角装饰（铁质）
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    // L 形角铁
    const d = '#2a2a34', m = '#5a5a64', h = '#8a8a94';
    // 水平条
    for (let x = 0; x < 7; x++) sp(g, x, 0, d);
    for (let x = 0; x < 6; x++) sp(g, x, 1, x < 2 ? h : m);
    for (let x = 0; x < 5; x++) sp(g, x, 2, m);
    // 竖直条
    sp(g, 0, 3, m); sp(g, 1, 3, m); sp(g, 2, 3, d);
    sp(g, 0, 4, m); sp(g, 1, 4, d);
    sp(g, 0, 5, m); sp(g, 1, 5, d);
    sp(g, 0, 6, d);
    // 铆钉
    sp(g, 1, 1, '#aaaaaa');
    savePng(c, 'corner-tl.png');
  }

  // 左上角装饰（金色）
  {
    const c = createCanvas(S, S);
    const g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    const d = '#3a2808', m = '#8a6818', h = '#d4a030', b = '#f0d860';
    for (let x = 0; x < 7; x++) sp(g, x, 0, d);
    for (let x = 0; x < 6; x++) sp(g, x, 1, x < 2 ? b : h);
    for (let x = 0; x < 5; x++) sp(g, x, 2, m);
    sp(g, 0, 3, h); sp(g, 1, 3, m); sp(g, 2, 3, d);
    sp(g, 0, 4, h); sp(g, 1, 4, d);
    sp(g, 0, 5, m); sp(g, 1, 5, d);
    sp(g, 0, 6, d);
    sp(g, 1, 1, '#ffe888');
    savePng(c, 'corner-tl-gold.png');
  }
}

// ══════════════════════════════════════════════════════════════
// 8. 链条/锁链纹理 — 8×16 可平铺
//    用于装饰边框或分隔
// ══════════════════════════════════════════════════════════════

function genChain() {
  const W = 8, H = 16;
  const c = createCanvas(W, H);
  const g = px(c.getContext('2d'));
  g.clearRect(0, 0, W, H);

  // 链环 1（上半）
  const o = '#3a3a44', m = '#6a6a74', h = '#8a8a94';
  // 上环
  sp(g, 3, 0, o); sp(g, 4, 0, o);
  sp(g, 2, 1, o); sp(g, 3, 1, h); sp(g, 4, 1, m); sp(g, 5, 1, o);
  sp(g, 2, 2, m); sp(g, 5, 2, o);
  sp(g, 2, 3, m); sp(g, 5, 3, o);
  sp(g, 2, 4, o); sp(g, 5, 4, o);
  sp(g, 3, 5, o); sp(g, 4, 5, o);
  // 连接段
  sp(g, 3, 6, m); sp(g, 4, 6, o);
  sp(g, 3, 7, o); sp(g, 4, 7, o);
  // 下环
  sp(g, 3, 8, o); sp(g, 4, 8, o);
  sp(g, 2, 9, o); sp(g, 3, 9, h); sp(g, 4, 9, m); sp(g, 5, 9, o);
  sp(g, 2, 10, m); sp(g, 5, 10, o);
  sp(g, 2, 11, m); sp(g, 5, 11, o);
  sp(g, 2, 12, o); sp(g, 5, 12, o);
  sp(g, 3, 13, o); sp(g, 4, 13, o);
  sp(g, 3, 14, m); sp(g, 4, 14, o);
  sp(g, 3, 15, o); sp(g, 4, 15, o);

  savePng(c, 'tex-chain.png');
}

// ══════════════════════════════════════════════════════════════
// 执行
// ══════════════════════════════════════════════════════════════

console.log('\n  六面史诗 · 补充素材生成器');
console.log('  输出: ' + OUT);
console.log('  ════════════════════════════════════════\n');

console.log('--- 1. 石板材质 ---');
genStoneSlab();

console.log('\n--- 2. 木板材质 ---');
genWoodPlank();

console.log('\n--- 3. 石墙材质 ---');
genStoneWall();

console.log('\n--- 4. 改进木纹 ---');
genWoodGrain();

console.log('\n--- 5. 宝石 ---');
genGems();

console.log('\n--- 6. 铆钉 ---');
genRivets();

console.log('\n--- 7. 角落装饰 ---');
genCornerDecor();

console.log('\n--- 8. 锁链纹理 ---');
genChain();

console.log('\n  ════════════════════════════════════════');
const newFiles = [
  'tex-stone-slab.png', 'tex-wood-plank.png', 'tex-stone-wall.png', 'tex-wood-grain.png',
  'gem-red.png', 'gem-blue.png', 'gem-green.png', 'gem-purple.png', 'gem-amber.png', 'gem-diamond.png',
  'rivet-small.png', 'rivet-medium.png', 'rivet-gold.png', 'rivet-gold-small.png',
  'corner-tl.png', 'corner-tl-gold.png',
  'tex-chain.png',
];
console.log('  新增: ' + newFiles.length + ' 个素材');
console.log('  完成!\n');
