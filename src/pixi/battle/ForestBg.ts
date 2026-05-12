/**
 * ForestBg — 幽暗森林战斗背景 (PixiJS)
 * 1:1 复刻 ForestBattleScene.tsx
 */
import { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';

const W = 720, H = 1280;
const STAGE_H = H * 0.52; // 上半区

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/** 天空渐变 */
function buildSky(isBoss: boolean): Graphics {
  const g = new Graphics();
  const stops = isBoss
    ? [
        { y: 0, h: 0.12, c: 0x060204 }, { y: 0.12, h: 0.13, c: 0x0c0406 },
        { y: 0.25, h: 0.13, c: 0x140608 }, { y: 0.38, h: 0.12, c: 0x1a080a },
        { y: 0.50, h: 0.50, c: 0x0e0406 },
      ]
    : [
        { y: 0, h: 0.12, c: 0x04030a }, { y: 0.12, h: 0.13, c: 0x060610 },
        { y: 0.25, h: 0.13, c: 0x080a16 }, { y: 0.38, h: 0.12, c: 0x0a0c18 },
        { y: 0.50, h: 0.50, c: 0x0a0808 },
      ];
  for (const s of stops) {
    g.beginFill(s.c, 1);
    g.drawRect(0, STAGE_H * s.y, W, STAGE_H * s.h + 1);
    g.endFill();
  }
  return g;
}

/** 星星（仅普通模式） */
function buildStars(): Container {
  const c = new Container();
  const rng = seededRandom(42);
  for (let i = 0; i < 40; i++) {
    const star = new Graphics();
    const size = rng() > 0.88 ? 2 : 1;
    const brightness = 0.25 + rng() * 0.5;
    star.beginFill(0xc8cde6, brightness);
    star.drawRect(0, 0, size, size);
    star.endFill();
    star.x = rng() * W;
    star.y = rng() * STAGE_H * 0.38;
    c.addChild(star);
  }
  return c;
}

/** 像素月亮 */
function buildMoon(): Container {
  const c = new Container();
  c.x = W * 0.05;
  c.y = STAGE_H * 0.01;

  // 光晕
  const glow = new Graphics();
  glow.beginFill(0xb4bedd, 0.07);
    glow.drawCircle(40, 40, 70);
    glow.endFill();
  glow.beginFill(0xa0aac8, 0.03);
    glow.drawCircle(40, 40, 45);
    glow.endFill();
  c.addChild(glow);

  // 月面像素数据 (每行 = [x, y, w, h, color])
  const px: [number, number, number, number, number][] = [
    [24, 8, 32, 8, 0xddd8c0], [16, 16, 48, 8, 0xe8e0c8],
    [12, 24, 56, 8, 0xede6d0], [8, 32, 64, 16, 0xf0ecd8],
    [12, 48, 56, 8, 0xede6d0], [16, 56, 48, 8, 0xe8e0c8],
    [24, 64, 32, 8, 0xddd8c0],
    // 陨石坑
    [24, 32, 8, 8, 0xc8c4b0], [44, 24, 8, 8, 0xccc8b4],
    [36, 48, 12, 8, 0xc5c0ac], [20, 40, 8, 4, 0xbfbaa8],
    // 暗面（月牙效果）
    [52, 16, 12, 8, 0x0a0e19], [56, 24, 12, 8, 0x0a0e19],
    [60, 32, 12, 16, 0x0a0e19], [56, 48, 12, 8, 0x0a0e19],
    [52, 56, 12, 8, 0x0a0e19],
  ];
  const moon = new Graphics();
  for (const [x, y, w, h, color] of px) {
    // 暗面 alpha < 1
    const alpha = color === 0x0a0e19 ? 0.6 : 1;
    moon.beginFill(color, alpha);
    moon.drawRect(x, y, w, h);
    moon.endFill();
  }
  c.addChild(moon);
  return c;
}

/** 山脉三层 */
function buildMountains(): Graphics {
  const g = new Graphics();
  const base = STAGE_H * 0.50; // 山脉底部 = 地平线
  const mh = STAGE_H * 0.28;   // 山脉区域高度

  // 远山 — 蓝灰色 #2a2438
  const far = generateMountainPoints(W, 40, 0.45, 17);
  drawMountainPoly(g, far, base, mh, 0x2a2438);

  // 中山 — #1e1828
  const mid = generateMountainPoints(W, 50, 0.55, 23);
  drawMountainPoly(g, mid, base, mh * 0.75, 0x1e1828);

  // 近丘 — #14101c
  const near = generateMountainPoints(W, 30, 0.25, 31);
  drawMountainPoly(g, near, base, mh * 0.45, 0x14101c);

  return g;
}

function generateMountainPoints(w: number, count: number, intensity: number, seed: number): number[] {
  const rng = seededRandom(seed);
  const pts: number[] = [];
  for (let i = 0; i <= count; i++) {
    pts.push(rng() * intensity);
  }
  return pts;
}

function drawMountainPoly(g: Graphics, pts: number[], baseY: number, height: number, color: number) {
  const step = W / (pts.length - 1);
  g.beginFill(color);
  g.moveTo(0, baseY);
  for (let i = 0; i < pts.length; i++) {
    g.lineTo(i * step, baseY - height * pts[i]);
  }
  g.lineTo(W, baseY);
  g.closePath();
  g.endFill();
}

/** 远景枯树线（锯齿天际线） */
function buildTreeline(isBoss: boolean): Graphics {
  const g = new Graphics();
  const base = STAGE_H * 0.50;
  const th = STAGE_H * 0.14; // 树线高度

  g.moveTo(0, base);
  // 生成锯齿状树冠轮廓
  const rng = seededRandom(55);
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const x = (W / steps) * i;
    const h = th * (0.3 + rng() * 0.7);
    g.lineTo(x, base - h);
    // 添加锯齿
    if (i < steps) {
      g.lineTo(x + W / steps * 0.5, base - h * (0.5 + rng() * 0.3));
    }
  }
  g.beginFill(isBoss ? 0x1a0808 : 0x18121c);
  g.lineTo(W, base);
  g.closePath();
  g.endFill();

  // Boss 模式：树顶红光
  if (isBoss) {
    g.moveTo(0, base - th * 0.5);
    for (let i = 0; i <= steps; i++) {
      const x = (W / steps) * i;
      g.lineTo(x, base - th * (0.3 + seededRandom(55 + i)() * 0.7));
    }
    g.lineStyle(3, 0xc83c14, 0.15);
  }

  return g;
}

/** 枯树剪影（像素SVG → PixiJS） */
function buildDeadTree(
  x: number, bottom: number, scale: number,
  flip: boolean, variant: 'dead1' | 'dead2' | 'dead3', alpha: number,
): Container {
  const c = new Container();
  c.alpha = alpha;
  const g = new Graphics();

  // 树的像素块定义（variant 差异化）
  const px = variant === 'dead1' ? [
    // 树干
    [21, 30, 6, 70, 0x3e3024], [19, 60, 3, 36, 0x34281c], [26, 65, 3, 30, 0x34281c],
    [23, 35, 2, 25, 0x4e4030],
    // 左枯枝
    [10, 32, 12, 3, 0x3e3024], [8, 28, 4, 6, 0x3e3024], [5, 24, 5, 4, 0x34281c],
    [14, 22, 8, 3, 0x3e3024], [12, 18, 4, 5, 0x34281c],
    // 右枯枝
    [26, 28, 14, 3, 0x3e3024], [38, 24, 4, 6, 0x3e3024], [40, 20, 4, 5, 0x34281c],
    [26, 38, 10, 3, 0x34281c], [34, 35, 4, 5, 0x3e3024],
    // 顶
    [20, 20, 8, 3, 0x3e3024], [22, 16, 4, 5, 0x34281c],
    [18, 12, 3, 6, 0x34281c], [25, 10, 3, 5, 0x3e3024],
  ] : variant === 'dead2' ? [
    [20, 35, 5, 65, 0x382c1c], [18, 70, 3, 26, 0x302414], [24, 75, 3, 20, 0x302414],
    [22, 38, 2, 20, 0x4a3c2c],
    [8, 36, 13, 3, 0x382c1c], [6, 30, 4, 8, 0x302414], [3, 26, 5, 4, 0x382c1c],
    [24, 32, 12, 3, 0x382c1c], [34, 28, 5, 6, 0x302414],
    [24, 42, 8, 2, 0x302414],
    [19, 22, 6, 3, 0x382c1c], [16, 18, 4, 5, 0x302414],
    [24, 16, 4, 5, 0x382c1c], [27, 12, 3, 5, 0x302414],
  ] : [
    [18, 40, 8, 60, 0x3e3024], [16, 68, 4, 28, 0x34281c], [25, 72, 3, 24, 0x34281c],
    [20, 44, 3, 18, 0x4e4030],
    [18, 36, 3, 6, 0x3e3024], [23, 34, 3, 8, 0x382c1c], [20, 32, 4, 4, 0x4a3c2c],
    [8, 44, 11, 3, 0x34281c], [6, 40, 4, 5, 0x302414],
    [25, 48, 10, 3, 0x34281c], [33, 44, 4, 5, 0x302414],
  ];

  // 渲染所有像素块（SVG坐标 → PixiJS，按 4x 缩放）
  const s = 4 * scale;
  for (const [bx, by, bw, bh, bc] of px) {
    g.beginFill(bc, 1);
    g.drawRect(bx * s / 4, by * s / 4, bw * s / 4, bh * s / 4);
    g.endFill();
  }

  c.addChild(g);

  // 定位：以底部中心为锚点
  const treeW = 48 * scale;
  const treeH = 100 * scale;
  c.x = x - treeW / 2;
  c.y = bottom - treeH;
  if (flip) c.scale.x = -1;

  return c;
}

/** 透视地面 */
function buildGround(isBoss: boolean): Container {
  const c = new Container();
  const groundTop = STAGE_H * 0.48;
  const groundH = STAGE_H - groundTop;

  const g = new Graphics();

  // 基底泥土
  g.beginFill(0x1c160c, 1);
    g.drawRect(0, groundTop, W, groundH);
    g.endFill();

  // 枯黄草地（两侧）
  const grassW = W * 0.375; // 120/320 ratio
  g.beginFill(0x1e1a08, 1);
    g.drawRect(0, groundTop, grassW, groundH);
    g.endFill();
  g.beginFill(0x1e1a08, 1);
    g.drawRect(W - grassW, groundTop, grassW, groundH);
    g.endFill();

  // 草地深浅条纹
  const stripes = [
    { y: 0, h: 8, c: 0x24200a }, { y: 14, h: 10, c: 0x1a1606 },
    { y: 32, h: 14, c: 0x24200a }, { y: 58, h: 18, c: 0x1a1606 },
    { y: 90, h: 24, c: 0x201c08 }, { y: 130, h: 30, c: 0x181406 },
  ];
  const scale = groundH / 200;
  for (const s of stripes) {
    // 左侧
    g.beginFill(s.c, 1);
    g.drawRect(0, groundTop + s.y * scale, grassW, s.h * scale);
    g.endFill();
    // 右侧
    g.beginFill(s.c, 1);
    g.drawRect(W - grassW, groundTop + s.y * scale, grassW, s.h * scale);
    g.endFill();
  }

  // 居中泥路（梯形）
  const roadL = grassW * 0.96;
  const roadR = W - grassW * 0.96;
  const roadBL = grassW * 0.125;
  const roadBR = W - grassW * 0.125;
  g.beginFill(0x1e1810);
  g.moveTo(roadL, groundTop);
  g.lineTo(roadR, groundTop);
  g.lineTo(roadBR, groundTop + groundH);
  g.lineTo(roadBL, groundTop + groundH);
  g.closePath();
  g.endFill();

  // 泥坑
  const puddles = [
    { cx: 0.5, cy: 0.075, rx: 30, ry: 6 },
    { cx: 0.48, cy: 0.2, rx: 40, ry: 8 },
    { cx: 0.52, cy: 0.375, rx: 50, ry: 10 },
    { cx: 0.47, cy: 0.6, rx: 65, ry: 14 },
    { cx: 0.53, cy: 0.825, rx: 80, ry: 16 },
  ];
  for (const p of puddles) {
    g.beginFill(0x14100a);
    g.drawEllipse(W * p.cx, groundTop + groundH * p.cy, p.rx, p.ry);
    g.endFill();
  }

  // 碎石
  const stones = [
    [0.44, 0.04, 7, 4], [0.53, 0.125, 9, 4], [0.41, 0.275, 11, 6],
    [0.56, 0.45, 14, 6], [0.38, 0.7, 18, 8], [0.63, 0.8, 18, 8],
  ];
  for (const [sx, sy, sw, sh] of stones) {
    g.beginFill(0x2e2818, 1);
    g.drawRect(W * sx, groundTop + groundH * sy, sw, sh);
    g.endFill();
  }

  // 路边沟
  g.lineStyle(2, 0x0e0a06, 0.6);
  g.moveTo(roadL, groundTop);
  g.lineTo(roadBL, groundTop + groundH);
  g.lineStyle(2, 0x0e0a06, 0.6);
  g.moveTo(roadR, groundTop);
  g.lineTo(roadBR, groundTop + groundH);

  // 骷髅散落（左侧）
  const skull = [
    [0.225, 0.15, 6, 2, 0xb8b09a], [0.222, 0.16, 8, 3, 0xc0b8a0],
    [0.225, 0.16, 2, 2, 0x1a1410], [0.238, 0.16, 2, 2, 0x1a1410],
  ];
  for (const [sx, sy, sw, sh, sc] of skull) {
    g.beginFill(sc, 1);
    g.drawRect(W * sx, groundTop + groundH * sy, sw, sh);
    g.endFill();
  }

  c.addChild(g);

  // 弧形地平线
  const arc = new Graphics();
  // 左侧草皮弧
  arc.beginFill(0x1e1a08);
  arc.moveTo(0, groundTop + 10);
  arc.lineTo(0, groundTop - 3);
  arc.bezierCurveTo(W * 0.12, groundTop - 8, W * 0.25, groundTop - 10, grassW, groundTop - 6);
  arc.lineTo(grassW, groundTop + 10);
  arc.closePath();
  arc.endFill();

  // 中间泥路入口
  arc.beginFill(0x1a140c);
  arc.moveTo(grassW, groundTop + 10);
  arc.lineTo(grassW, groundTop - 6);
  arc.bezierCurveTo(W * 0.44, groundTop - 4, W * 0.56, groundTop - 3, W - grassW, groundTop - 6);
  arc.lineTo(W - grassW, groundTop + 10);
  arc.closePath();
  arc.endFill();

  // 右侧草皮弧
  arc.beginFill(0x1e1a08);
  arc.moveTo(W - grassW, groundTop + 10);
  arc.lineTo(W - grassW, groundTop - 6);
  arc.bezierCurveTo(W * 0.75, groundTop - 10, W * 0.88, groundTop - 8, W, groundTop - 3);
  arc.lineTo(W, groundTop + 10);
  arc.closePath();
  arc.endFill();

  c.addChild(arc);

  return c;
}

/** 萤火虫（浮动动画用） */
export interface FireflyData { g: Graphics; baseX: number; baseY: number; phase: number; speed: number; }

function buildFireflies(): { container: Container; flies: FireflyData[] } {
  const c = new Container();
  const flies: FireflyData[] = [];
  const rng = seededRandom(77);

  for (let i = 0; i < 6; i++) {
    const fx = (10 + rng() * 80) / 100 * W;
    const fy = (30 + rng() * 35) / 100 * STAGE_H;
    const size = rng() > 0.7 ? 3 : 2;
    const g = new Graphics();
    // 核心
    g.beginFill(0x8cb446, 0.7);
    g.drawCircle(0, 0, size * 0.5);
    g.endFill();
    // 光晕
    g.beginFill(0x78aa3c, 0.15);
    g.drawCircle(0, 0, size + 2);
    g.endFill();
    g.x = fx;
    g.y = fy;
    c.addChild(g);
    flies.push({ g, baseX: fx, baseY: fy, phase: rng() * Math.PI * 2, speed: 0.3 + rng() * 0.3 });
  }

  return { container: c, flies };
}

/** 暗角渐暗层 */
function buildVignette(isBoss: boolean): Graphics {
  const g = new Graphics();
  // 中心较亮，四周变暗 — 用多层叠加近似径向渐变
  const cx = W / 2, cy = STAGE_H * 0.45;
  const layers = isBoss
    ? [
        { r: STAGE_H * 0.08, a: 0 }, { r: STAGE_H * 0.3, a: 0.3 },
        { r: STAGE_H * 0.55, a: 0.65 }, { r: STAGE_H * 1.0, a: 0.92 },
      ]
    : [
        { r: STAGE_H * 0.15, a: 0 }, { r: STAGE_H * 0.4, a: 0.2 },
        { r: STAGE_H * 0.65, a: 0.5 }, { r: STAGE_H * 1.0, a: 0.8 },
      ];

  // 使用半透明矩形近似（四角更暗）
  const edgeAlpha = isBoss ? 0.35 : 0.25;
  // 顶部渐暗
  g.beginFill(isBoss ? 0x060408 : 0x060408, 0.7);
    g.drawRect(0, 0, W, STAGE_H * 0.05);
    g.endFill();
  // 四角暗角
  g.beginFill(0x030204, edgeAlpha);
    g.drawRect(0, 0, W * 0.15, STAGE_H);
    g.endFill();
  g.beginFill(0x030204, edgeAlpha);
    g.drawRect(W * 0.85, 0, W * 0.15, STAGE_H);
    g.endFill();

  return g;
}

/** 岩石像素 */
function buildRock(x: number, y: number, size: 'sm' | 'md'): Graphics {
  const g = new Graphics();
  if (size === 'sm') {
    g.beginFill(0x38342a, 1);
    g.drawRect(2, 4, 8, 4);
    g.endFill();
    g.beginFill(0x444030, 1);
    g.drawRect(4, 2, 6, 4);
    g.endFill();
    g.beginFill(0x504c40, 1);
    g.drawRect(5, 2, 2, 2);
    g.endFill();
  } else {
    g.beginFill(0x38342a, 1);
    g.drawRect(2, 6, 16, 6);
    g.endFill();
    g.beginFill(0x444030, 1);
    g.drawRect(4, 3, 14, 5);
    g.endFill();
    g.beginFill(0x4c4838, 1);
    g.drawRect(6, 1, 10, 4);
    g.endFill();
    g.beginFill(0x585440, 1);
    g.drawRect(8, 1, 4, 2);
    g.endFill();
  }
  g.x = x;
  g.y = y;
  return g;
}

/** 水洼 */
function buildPuddle(x: number, y: number, size: 'sm' | 'md'): Graphics {
  const g = new Graphics();
  if (size === 'sm') {
    g.beginFill(0x121c1e, 0.7);
    g.drawEllipse(9, 3, 8, 3);
    g.endFill();
    g.beginFill(0x19262a, 0.6);
    g.drawEllipse(9, 3, 6, 2);
    g.endFill();
    g.beginFill(0x46646e, 0.3);
    g.drawRect(6, 2, 2, 1);
    g.endFill();
  } else {
    g.beginFill(0x121c1e, 0.7);
    g.drawEllipse(14, 4, 13, 4);
    g.endFill();
    g.beginFill(0x162328, 0.6);
    g.drawEllipse(14, 4, 10, 3);
    g.endFill();
    g.beginFill(0x1c2d32, 0.5);
    g.drawEllipse(14, 4, 6, 2);
    g.endFill();
    g.beginFill(0x466e78, 0.25);
    g.drawRect(8, 2, 3, 1);
    g.endFill();
  }
  g.x = x;
  g.y = y;
  return g;
}

// ===================== 导出 =====================

export interface ForestBgResult {
  container: Container;
  fireflies: FireflyData[];
  stars: Container | null;
}

export function buildForestBg(isBoss: boolean = false): ForestBgResult {
  const container = new Container();
  let stars: Container | null = null;

  // 1. 天空
  container.addChild(buildSky(isBoss));

  // 2. 星星 / 月亮（普通模式）
  if (!isBoss) {
    stars = buildStars();
    container.addChild(stars);
    container.addChild(buildMoon());
  }

  // 3. Boss: 远处火光
  if (isBoss) {
    const fireGlow = new Graphics();
    fireGlow.beginFill(0xc83c14, 0.08);
    fireGlow.drawEllipse(W * 0.5, STAGE_H * 0.35, W * 0.3, STAGE_H * 0.15);
    fireGlow.endFill();
    container.addChild(fireGlow);
  }

  // 4. 山脉
  container.addChild(buildMountains());

  // 5. 枯树线
  container.addChild(buildTreeline(isBoss));

  // 6. 枯树剪影
  const horizon = STAGE_H * 0.50;
  const treeConfigs: [number, number, number, boolean, 'dead1' | 'dead2' | 'dead3', number][] = isBoss
    ? [
        [W * 0.04, horizon, 1.5, false, 'dead1', 0.9],
        [W * 0.88, horizon, 1.4, true, 'dead2', 0.85],
        [W * -0.03, horizon, 1.8, false, 'dead3', 0.6],
        [W * 0.95, horizon, 1.6, true, 'dead1', 0.65],
      ]
    : [
        [W * 0.04, horizon, 1.5, false, 'dead1', 0.85],
        [W * 0.88, horizon, 1.4, true, 'dead2', 0.8],
        [W * -0.03, horizon, 1.8, false, 'dead3', 0.55],
        [W * 0.95, horizon, 1.6, true, 'dead1', 0.6],
        [W * -0.05, horizon - STAGE_H * 0.04, 2.4, false, 'dead2', 0.35],
        [W * 0.93, horizon - STAGE_H * 0.04, 2.2, true, 'dead3', 0.3],
      ];
  for (const [tx, ty, ts, tf, tv, ta] of treeConfigs) {
    container.addChild(buildDeadTree(tx, ty, ts, tf, tv, ta));
  }

  // 7. 透视地面
  container.addChild(buildGround(isBoss));

  // 8. 地面装饰（普通模式）
  if (!isBoss) {
    container.addChild(buildRock(W * 0.28, horizon - 4, 'md'));
    container.addChild(buildRock(W * 0.58, horizon - 2, 'sm'));
    container.addChild(buildRock(W * 0.88, horizon - 4, 'sm'));
    container.addChild(buildRock(W * 0.05, horizon - 4, 'sm'));
    container.addChild(buildPuddle(W * 0.12, horizon - 6, 'md'));
    container.addChild(buildPuddle(W * 0.68, horizon - 4, 'sm'));
  }

  // 9. Boss: 树根火光
  if (isBoss) {
    for (const side of [-1, 1]) {
      const torch = new Graphics();
      const tx = side < 0 ? W * 0.08 : W * 0.92;
      torch.beginFill(0xdc5014, 0.12);
      torch.drawEllipse(tx, horizon - STAGE_H * 0.02, W * 0.1, STAGE_H * 0.04);
      torch.endFill();
      container.addChild(torch);
    }
  }

  // 10. 萤火虫
  const { container: flyContainer, flies } = buildFireflies();
  container.addChild(flyContainer);

  // 11. 暗角
  container.addChild(buildVignette(isBoss));

  return { container, fireflies: flies, stars };
}