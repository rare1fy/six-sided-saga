/**
 * 六面史诗 · 像素风 UI 素材生成器 v4
 * 
 * 风格参考：暗紫底 + 酒红边框 + 米白线条（高对比度像素RPG风）
 * 基础网格：32×32 px
 * 开发分辨率：720×1280
 * 缩放倍率：×4（32px → 128px 显示）
 * 渲染模式：NEAREST（锐利无模糊）
 * 
 * 运行：node scripts/generate-ui-assets-v4.cjs
 * 输出：public/ui/
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, 'ui-out');
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

const C = {
  black: '#000000',
  bgDeep: '#0c0810', bgDark: '#14101e', bgMid: '#1c1630', bgLt: '#241e3a',
  wineHi: '#c85868', wineLt: '#a84050', wineMd: '#8a3040', wineDk: '#6a2030', wineDp: '#4a1020',
  cream: '#e8d8c0', creamHi: '#f0e8d8', creamDk: '#c0a880', creamDp: '#8a7858',
  grnBr: '#60c040', grnMd: '#48a030', grnDk: '#308020', grnDp: '#186010',
  bluBr: '#40a0d0', bluMd: '#3080b0', bluDk: '#206090', bluDp: '#104060',
  redBr: '#e06050', redMd: '#c04040', redDk: '#8a2820', redDp: '#5a1810',
  gldBr: '#f0d860', gldMd: '#e8c040', gldDk: '#b08020', gldDp: '#705010',
  purBr: '#a070c0', purMd: '#8050a0', purDk: '#603880', purDp: '#402060',
  orgBr: '#e8a040', orgMd: '#c08030', orgDk: '#8a5020',
  gryLt: '#6a6a74', gryMd: '#4a4a54', gryDk: '#3a3a44', gryDp: '#2a2a34',
};

function fillRounded(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y, w - 4, h);
  ctx.fillRect(x, y + 2, 2, h - 4);
  ctx.fillRect(x + w - 2, y + 2, 2, h - 4);
  sp(ctx, x + 1, y + 1, color); sp(ctx, x + w - 2, y + 1, color);
  sp(ctx, x + 1, y + h - 2, color); sp(ctx, x + w - 2, y + h - 2, color);
}
function strokeRounded(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y, w - 4, 1); ctx.fillRect(x + 2, y + h - 1, w - 4, 1);
  ctx.fillRect(x, y + 2, 1, h - 4); ctx.fillRect(x + w - 1, y + 2, 1, h - 4);
  sp(ctx, x + 1, y + 1, color); sp(ctx, x + w - 2, y + 1, color);
  sp(ctx, x + 1, y + h - 2, color); sp(ctx, x + w - 2, y + h - 2, color);
}
function strokeRounded2(ctx, x, y, w, h, c1, c2) {
  strokeRounded(ctx, x, y, w, h, c1);
  strokeRounded(ctx, x + 1, y + 1, w - 2, h - 2, c2 || c1);
}

// ═══ PANELS ═══
function genPanels() {
  const S = 32;
  // 通用面板
  let c = createCanvas(S, S), g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  fillRounded(g, 0, 0, S, S, C.black);
  strokeRounded2(g, 1, 1, S - 2, S - 2, C.wineMd, C.wineDk);
  strokeRounded(g, 3, 3, S - 6, S - 6, C.creamDp);
  fillRounded(g, 4, 4, S - 8, S - 8, C.bgDark);
  g.fillStyle = rgba(232, 216, 192, 0.04); g.fillRect(5, 4, S - 10, 1);
  savePng(c, 'panel-border.png');

  // 选中面板
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  fillRounded(g, 0, 0, S, S, C.black);
  strokeRounded2(g, 1, 1, S - 2, S - 2, C.gldMd, C.gldDk);
  strokeRounded(g, 3, 3, S - 6, S - 6, C.gldDp);
  fillRounded(g, 4, 4, S - 8, S - 8, C.bgDark);
  g.fillStyle = rgba(240, 216, 96, 0.05); g.fillRect(5, 4, S - 10, 2);
  savePng(c, 'panel-border-selected.png');

  // 深色面板
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  fillRounded(g, 0, 0, S, S, C.black);
  strokeRounded(g, 1, 1, S - 2, S - 2, C.gryDk);
  fillRounded(g, 2, 2, S - 4, S - 4, C.bgDeep);
  savePng(c, 'panel-dark.png');

  // 提示框
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  fillRounded(g, 0, 0, S, S, C.black);
  strokeRounded(g, 1, 1, S - 2, S - 2, C.creamDk);
  fillRounded(g, 2, 2, S - 4, S - 4, C.bgDeep);
  g.fillStyle = C.creamDp; g.fillRect(4, 2, S - 8, 1);
  savePng(c, 'panel-tooltip.png');

  // 模态框
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  fillRounded(g, 2, 2, S - 2, S - 2, rgba(0, 0, 0, 0.5));
  fillRounded(g, 0, 0, S - 2, S - 2, C.black);
  strokeRounded2(g, 1, 1, S - 4, S - 4, C.wineMd, C.wineDk);
  strokeRounded(g, 3, 3, S - 8, S - 8, C.creamDp);
  fillRounded(g, 4, 4, S - 10, S - 10, C.bgDeep);
  savePng(c, 'modal-bg.png');

  // 消息条
  c = createCanvas(32, 16); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 32, 16);
  g.fillStyle = C.black;
  g.fillRect(2, 0, 28, 1); g.fillRect(2, 15, 28, 1);
  g.fillRect(0, 2, 1, 12); g.fillRect(31, 2, 1, 12);
  sp(g, 1, 1, C.black); sp(g, 30, 1, C.black); sp(g, 1, 14, C.black); sp(g, 30, 14, C.black);
  g.fillStyle = C.bgDeep; g.fillRect(1, 1, 30, 14);
  g.clearRect(0, 0, 1, 1); g.clearRect(31, 0, 1, 1); g.clearRect(0, 15, 1, 1); g.clearRect(31, 15, 1, 1);
  g.fillStyle = C.wineDk; g.fillRect(2, 1, 28, 1);
  savePng(c, 'panel-toast.png');
}

// ═══ BUTTONS ═══
function genButtons() {
  const W = 32, H = 16;
  function drawBtn(name, bdr, hi, md, dk) {
    const c = createCanvas(W, H), g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = rgba(0, 0, 0, 0.5);
    g.fillRect(3, H - 2, W - 6, 2); sp(g, 2, H - 1, rgba(0, 0, 0, 0.5)); sp(g, W - 3, H - 1, rgba(0, 0, 0, 0.5));
    g.fillStyle = C.black;
    g.fillRect(3, 0, W - 6, 1); g.fillRect(3, H - 3, W - 6, 1);
    g.fillRect(0, 3, 1, H - 6); g.fillRect(W - 1, 3, 1, H - 6);
    sp(g, 1, 1, C.black); sp(g, 2, 1, C.black); sp(g, W - 3, 1, C.black); sp(g, W - 2, 1, C.black);
    sp(g, 1, 2, C.black); sp(g, W - 2, 2, C.black);
    sp(g, 1, H - 4, C.black); sp(g, 2, H - 4, C.black); sp(g, W - 3, H - 4, C.black); sp(g, W - 2, H - 4, C.black);
    sp(g, 1, H - 5, C.black); sp(g, W - 2, H - 5, C.black);
    g.fillStyle = md; g.fillRect(2, 2, W - 4, H - 5); g.fillRect(3, 1, W - 6, 1); g.fillRect(1, 3, 1, H - 7); g.fillRect(W - 2, 3, 1, H - 7);
    g.fillStyle = hi; g.fillRect(3, 1, W - 6, 1); g.fillRect(2, 2, W - 4, 1);
    g.fillStyle = dk; g.fillRect(2, H - 5, W - 4, 1); g.fillRect(3, H - 4, W - 6, 1);
    g.fillStyle = bdr; g.fillRect(3, 0, W - 6, 1); g.fillRect(0, 3, 1, H - 6); g.fillRect(W - 1, 3, 1, H - 6);
    sp(g, 1, 1, bdr); sp(g, W - 2, 1, bdr); sp(g, 1, 2, bdr); sp(g, W - 2, 2, bdr);
    savePng(c, name);
  }
  function drawBtnP(name, bdr, md, dk) {
    const c = createCanvas(W, H), g = px(c.getContext('2d'));
    g.clearRect(0, 0, W, H);
    g.fillStyle = C.black;
    g.fillRect(3, 1, W - 6, 1); g.fillRect(3, H - 2, W - 6, 1);
    g.fillRect(0, 4, 1, H - 6); g.fillRect(W - 1, 4, 1, H - 6);
    sp(g, 1, 2, C.black); sp(g, 2, 2, C.black); sp(g, W - 3, 2, C.black); sp(g, W - 2, 2, C.black);
    sp(g, 1, 3, C.black); sp(g, W - 2, 3, C.black);
    sp(g, 1, H - 3, C.black); sp(g, 2, H - 3, C.black); sp(g, W - 3, H - 3, C.black); sp(g, W - 2, H - 3, C.black);
    sp(g, 1, H - 4, C.black); sp(g, W - 2, H - 4, C.black);
    g.fillStyle = dk; g.fillRect(2, 3, W - 4, H - 5); g.fillRect(3, 2, W - 6, 1); g.fillRect(1, 4, 1, H - 7); g.fillRect(W - 2, 4, 1, H - 7);
    g.fillStyle = bdr; g.fillRect(3, 1, W - 6, 1); sp(g, 1, 2, bdr); sp(g, W - 2, 2, bdr);
    savePng(c, name);
  }
  drawBtn('btn-green.png', C.grnDk, '#58c848', '#40a830', '#288818');
  drawBtnP('btn-green-pressed.png', C.grnDk, '#40a830', '#288818');
  drawBtn('btn-purple.png', C.purDk, '#9868b8', '#7848a0', '#583080');
  drawBtnP('btn-purple-pressed.png', C.purDk, '#7848a0', '#583080');
  drawBtn('btn-red.png', C.redDk, '#d85848', '#b83838', '#882020');
  drawBtnP('btn-red-pressed.png', C.redDk, '#b83838', '#882020');
  drawBtn('btn-gold.png', C.gldDk, '#e8c848', '#c8a030', '#987818');
  drawBtnP('btn-gold-pressed.png', C.gldDk, '#c8a030', '#987818');
  drawBtn('btn-gray.png', C.gryDk, '#5a5a64', '#444450', '#343440');
  drawBtnP('btn-gray-pressed.png', C.gryDk, '#444450', '#343440');
  drawBtn('btn-cream.png', C.creamDk, C.cream, C.creamDk, C.creamDp);
  drawBtnP('btn-cream-pressed.png', C.creamDk, C.creamDk, C.creamDp);
  // Ghost
  let c2 = createCanvas(W, H), g2 = px(c2.getContext('2d'));
  g2.clearRect(0, 0, W, H);
  g2.fillStyle = C.creamDp;
  g2.fillRect(3, 0, W - 6, 1); g2.fillRect(3, H - 1, W - 6, 1);
  g2.fillRect(0, 3, 1, H - 6); g2.fillRect(W - 1, 3, 1, H - 6);
  sp(g2, 1, 1, C.creamDp); sp(g2, W - 2, 1, C.creamDp); sp(g2, 1, 2, C.creamDp); sp(g2, W - 2, 2, C.creamDp);
  sp(g2, 1, H - 3, C.creamDp); sp(g2, W - 2, H - 3, C.creamDp); sp(g2, 1, H - 2, C.creamDp); sp(g2, W - 2, H - 2, C.creamDp);
  g2.fillStyle = rgba(20, 16, 30, 0.5); g2.fillRect(1, 1, W - 2, H - 2);
  savePng(c2, 'btn-ghost.png');
  c2 = createCanvas(W, H); g2 = px(c2.getContext('2d'));
  g2.clearRect(0, 0, W, H);
  g2.fillStyle = C.cream;
  g2.fillRect(3, 0, W - 6, 1); g2.fillRect(3, H - 1, W - 6, 1);
  g2.fillRect(0, 3, 1, H - 6); g2.fillRect(W - 1, 3, 1, H - 6);
  sp(g2, 1, 1, C.cream); sp(g2, W - 2, 1, C.cream); sp(g2, 1, 2, C.cream); sp(g2, W - 2, 2, C.cream);
  sp(g2, 1, H - 3, C.cream); sp(g2, W - 2, H - 3, C.cream); sp(g2, 1, H - 2, C.cream); sp(g2, W - 2, H - 2, C.cream);
  g2.fillStyle = rgba(20, 16, 30, 0.7); g2.fillRect(1, 1, W - 2, H - 2);
  savePng(c2, 'btn-ghost-pressed.png');
}

// ═══ BARS ═══
function genBars() {
  const W = 32, H = 8;
  let c = createCanvas(W, H), g = px(c.getContext('2d'));
  g.fillStyle = C.black; g.fillRect(1, 0, W - 2, H); g.fillRect(0, 1, W, H - 2);
  g.fillStyle = '#0a0810'; g.fillRect(1, 1, W - 2, H - 2);
  g.fillStyle = rgba(0, 0, 0, 0.4); g.fillRect(1, 1, W - 2, 1);
  savePng(c, 'bar-bg.png');
  function drawFill(name, hi, md, dk) {
    c = createCanvas(W, H); g = px(c.getContext('2d'));
    g.fillStyle = md; g.fillRect(0, 0, W, H);
    g.fillStyle = hi; g.fillRect(0, 0, W, 2);
    g.fillStyle = dk; g.fillRect(0, H - 2, W, 2);
    g.fillStyle = rgba(255, 255, 255, 0.15); g.fillRect(0, 2, W, 1);
    savePng(c, name);
  }
  drawFill('bar-hp.png', '#78d858', C.grnBr, C.grnDk);
  drawFill('bar-mp.png', '#58b8e0', C.bluBr, C.bluDk);
  drawFill('bar-xp.png', '#f0d868', C.gldMd, C.gldDk);
  drawFill('bar-poison.png', '#58d878', '#30b850', '#188830');
  drawFill('bar-armor.png', '#68a8d8', '#4888b8', '#286898');
  drawFill('bar-red.png', '#e87060', C.redMd, C.redDk);
  function drawAccent(name, color) { c = createCanvas(W, H); g = px(c.getContext('2d')); g.fillStyle = color; g.fillRect(0, 0, W, H); savePng(c, name); }
  drawAccent('bar-accent-red.png', C.redMd); drawAccent('bar-accent-green.png', C.grnMd);
  drawAccent('bar-accent-blue.png', C.bluMd); drawAccent('bar-accent-gold.png', C.gldMd);
  drawAccent('bar-accent-purple.png', C.purMd);
}

// ═══ TEXTURES ═══
function genTextures() {
  const S = 32;
  // Stone brick
  let c = createCanvas(S, S), g = px(c.getContext('2d'));
  g.fillStyle = '#18102a'; g.fillRect(0, 0, S, S);
  const blocks = [[0,0,10,8],[10,0,12,8],[22,0,10,8],[4,8,11,9],[15,8,10,9],[25,8,7,9],[0,8,4,9],[0,17,8,8],[8,17,13,8],[21,17,11,8],[3,25,10,7],[13,25,9,7],[22,25,10,7],[0,25,3,7]];
  for (const [bx,by,bw,bh] of blocks) { const sh = randInt(-6,6); g.fillStyle = rgba(24+sh,16+sh,42+sh,1); g.fillRect(bx,by,bw,bh); }
  g.fillStyle = rgba(0,0,0,0.35); g.fillRect(0,8,S,1); g.fillRect(0,17,S,1); g.fillRect(0,25,S,1);
  const vs = [[10,0,8],[22,0,8],[4,9,8],[15,9,8],[25,9,8],[8,18,7],[21,18,7],[3,26,6],[13,26,6],[22,26,6]];
  for (const [vx,vy,vh] of vs) { g.fillStyle = rgba(0,0,0,0.3); g.fillRect(vx,vy,1,vh); }
  for (let i = 0; i < 30; i++) sp(g, randInt(0,S-1), randInt(0,S-1), rgba(255,255,255,0.02));
  savePng(c, 'stone-brick.png');

  // Parchment
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.fillStyle = '#2a2238'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) sp(g, randInt(0,S-1), randInt(0,S-1), rgba(randInt(200,240),randInt(180,220),randInt(160,200),0.03));
  savePng(c, 'parchment.png');

  // Leather
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.fillStyle = '#1a1428'; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 3) { g.fillStyle = rgba(30,20,50,0.3); g.fillRect(0,y,S,1); }
  for (let i = 0; i < 40; i++) sp(g, randInt(0,S-1), randInt(0,S-1), rgba(255,255,255,0.02));
  savePng(c, 'tex-leather.png');

  // Wood
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.fillStyle = '#1e1428'; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) { const v = Math.sin(y*0.8)*3; g.fillStyle = rgba(40+v,28+v,50+v,0.4); g.fillRect(0,y,S,1); }
  savePng(c, 'tex-wood.png');

  // Stone slab
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.fillStyle = '#161224'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 50; i++) sp(g, randInt(0,S-1), randInt(0,S-1), rgba(randInt(20,40),randInt(16,30),randInt(40,60),0.3));
  savePng(c, 'tex-stone-slab.png');

  // Stone wall
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.fillStyle = '#14101e'; g.fillRect(0, 0, S, S);
  const stones = [[0,0,7,6],[7,0,9,7],[16,0,8,6],[24,0,8,7],[2,7,8,7],[10,7,7,6],[17,6,9,7],[26,7,6,6],[0,14,6,6],[6,13,10,7],[16,13,8,6],[24,13,8,7],[3,20,7,6],[10,20,9,7],[19,19,7,7],[26,20,6,6],[0,26,8,6],[8,27,8,5],[16,26,9,6],[25,26,7,6]];
  for (const [sx,sy,sw,sh] of stones) { const sd = randInt(-4,4); g.fillStyle = rgba(20+sd,16+sd,34+sd,1); g.fillRect(sx,sy,sw,sh); }
  g.fillStyle = rgba(0,0,0,0.3);
  for (const [sx,sy,sw,sh] of stones) { g.fillRect(sx,sy+sh,sw,1); g.fillRect(sx+sw,sy,1,sh); }
  savePng(c, 'tex-stone-wall.png');

  // Wood plank
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.fillStyle = '#1c1428'; g.fillRect(0, 0, S, S);
  const planks = [0, 8, 17, 25];
  for (let i = 0; i < planks.length; i++) {
    const px0 = planks[i], pw = (i < planks.length - 1 ? planks[i + 1] : S) - px0;
    const sd = randInt(-3, 3); g.fillStyle = rgba(28+sd,20+sd,40+sd,1); g.fillRect(px0,0,pw,S);
    g.fillStyle = rgba(0,0,0,0.3); g.fillRect(px0,0,1,S);
  }
  for (let y = 0; y < S; y += randInt(3, 6)) { g.fillStyle = rgba(255,255,255,0.02); g.fillRect(0,y,S,1); }
  savePng(c, 'tex-wood-plank.png');

  // Wood grain
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.fillStyle = '#1e1628'; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) { const ring = Math.sin(y*0.5+Math.sin(y*0.2)*2)*4; g.fillStyle = rgba(36+ring,26+ring,48+ring,0.5); g.fillRect(0,y,S,1); }
  savePng(c, 'tex-wood-grain.png');
}

// ═══ ICON FRAMES ═══
function genIconFrames() {
  const S = 32;
  function drawFrame(name, bdr, bg) {
    const c = createCanvas(S, S), g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    fillRounded(g, 2, 2, S - 2, S - 2, rgba(0, 0, 0, 0.4));
    fillRounded(g, 0, 0, S - 2, S - 2, C.black);
    strokeRounded(g, 1, 1, S - 4, S - 4, bdr);
    fillRounded(g, 2, 2, S - 6, S - 6, bg);
    g.fillStyle = rgba(0, 0, 0, 0.2); g.fillRect(3, 2, S - 8, 1);
    savePng(c, name);
  }
  drawFrame('icon-frame.png', C.creamDp, '#0a0810');
  drawFrame('icon-frame-rare.png', C.bluMd, '#0a1020');
  drawFrame('icon-frame-epic.png', C.purMd, '#100a20');
  drawFrame('icon-frame-legendary.png', C.gldMd, '#1a1008');
}

// ═══ DIVIDERS ═══
function genDividers() {
  function drawDiv(name, color, alpha) {
    const c = createCanvas(64, 4), g = px(c.getContext('2d'));
    g.clearRect(0, 0, 64, 4);
    g.fillStyle = color; g.fillRect(0, 1, 64, 1);
    g.fillStyle = rgba(parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16),alpha||0.3);
    g.fillRect(0, 2, 64, 1);
    savePng(c, name);
  }
  drawDiv('divider.png', C.creamDp, 0.3);
  drawDiv('divider-gold.png', C.gldDk, 0.3);
  drawDiv('divider-wine.png', C.wineDk, 0.3);
}

// ═══ CHECKBOXES ═══
function genCheckboxes() {
  const S = 16;
  function box(g) {
    g.fillStyle = C.black;
    g.fillRect(2,0,S-4,1); g.fillRect(2,S-1,S-4,1);
    g.fillRect(0,2,1,S-4); g.fillRect(S-1,2,1,S-4);
    sp(g,1,1,C.black); sp(g,S-2,1,C.black); sp(g,1,S-2,C.black); sp(g,S-2,S-2,C.black);
  }
  let c = createCanvas(S, S), g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S); box(g);
  g.fillStyle = '#0a0810'; g.fillRect(1,1,S-2,S-2);
  g.fillStyle = C.wineDk; g.fillRect(2,1,S-4,1); g.fillRect(1,2,1,S-4);
  g.fillStyle = C.wineDp; g.fillRect(2,S-2,S-4,1); g.fillRect(S-2,2,1,S-4);
  savePng(c, 'checkbox.png');

  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S); box(g);
  g.fillStyle = C.grnDk; g.fillRect(1,1,S-2,S-2);
  g.fillStyle = C.grnBr; g.fillRect(2,1,S-4,1);
  g.fillStyle = C.grnDp; g.fillRect(2,S-2,S-4,1);
  const W = '#ffffff';
  sp(g,3,7,W); sp(g,4,8,W); sp(g,5,9,W); sp(g,6,8,W); sp(g,7,7,W); sp(g,8,6,W); sp(g,9,5,W); sp(g,10,4,W);
  savePng(c, 'checkbox-checked.png');
}

// ═══ TABS ═══
function genTabs() {
  const W = 32, H = 16;
  let c = createCanvas(W, H), g = px(c.getContext('2d'));
  g.clearRect(0, 0, W, H);
  g.fillStyle = C.black; g.fillRect(2,0,W-4,1); g.fillRect(0,2,1,H-2); g.fillRect(W-1,2,1,H-2);
  sp(g,1,1,C.black); sp(g,W-2,1,C.black);
  g.fillStyle = C.wineMd; g.fillRect(3,1,W-6,1); g.fillRect(1,3,1,H-3); g.fillRect(W-2,3,1,H-3);
  sp(g,2,2,C.wineMd); sp(g,W-3,2,C.wineMd);
  g.fillStyle = C.bgDark; g.fillRect(2,2,W-4,H-2); g.fillRect(3,1,W-6,1);
  g.fillStyle = C.bgDark; g.fillRect(1,H-1,W-2,1);
  savePng(c, 'tab-active.png');

  c = createCanvas(W, H); g = px(c.getContext('2d'));
  g.clearRect(0, 0, W, H);
  g.fillStyle = C.black; g.fillRect(2,0,W-4,1); g.fillRect(0,2,1,H-2); g.fillRect(W-1,2,1,H-2);
  sp(g,1,1,C.black); sp(g,W-2,1,C.black);
  g.fillStyle = C.wineDp; g.fillRect(3,1,W-6,1); g.fillRect(1,3,1,H-3); g.fillRect(W-2,3,1,H-3);
  sp(g,2,2,C.wineDp); sp(g,W-3,2,C.wineDp);
  g.fillStyle = C.bgDeep; g.fillRect(2,2,W-4,H-2);
  g.fillStyle = C.wineDk; g.fillRect(0,H-1,W,1);
  savePng(c, 'tab-inactive.png');
}

// ═══ SCROLLBAR ═══
function genScrollbar() {
  let c = createCanvas(8, 32), g = px(c.getContext('2d'));
  g.fillStyle = C.bgDeep; g.fillRect(0,0,8,32);
  g.fillStyle = rgba(0,0,0,0.3); g.fillRect(0,0,1,32); g.fillRect(7,0,1,32);
  savePng(c, 'scroll-track.png');
  c = createCanvas(8, 32); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 8, 32);
  g.fillStyle = C.wineDk; g.fillRect(1,0,6,32); g.fillRect(0,1,8,30);
  g.fillStyle = C.wineMd; g.fillRect(1,0,6,1);
  g.fillStyle = C.wineDp; g.fillRect(1,31,6,1);
  savePng(c, 'scroll-thumb.png');
}

// ═══ MAP NODES ═══
function genMapNodes() {
  const S = 16;
  function drawNode(name, bg, bdr, icons) {
    const c = createCanvas(S, S), g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(2,0,S-4,1); g.fillRect(2,S-1,S-4,1); g.fillRect(0,2,1,S-4); g.fillRect(S-1,2,1,S-4);
    sp(g,1,1,C.black); sp(g,S-2,1,C.black); sp(g,1,S-2,C.black); sp(g,S-2,S-2,C.black);
    g.fillStyle = bg; g.fillRect(1,1,S-2,S-2);
    g.clearRect(0,0,1,1); g.clearRect(S-1,0,1,1); g.clearRect(0,S-1,1,1); g.clearRect(S-1,S-1,1,1);
    g.fillStyle = bdr; g.fillRect(2,1,S-4,1); g.fillRect(1,2,1,S-4);
    for (const [ix,iy,ic] of icons) sp(g, ix, iy, ic);
    savePng(c, name);
  }
  drawNode('map-node-enemy.png', C.wineDk, C.wineHi, [[6,4,'#fff'],[7,5,'#fff'],[8,6,'#fff'],[9,7,'#fff'],[10,8,'#fff'],[7,9,'#fff'],[8,8,'#fff'],[6,10,'#fff'],[5,11,'#fff']]);
  drawNode('map-node-elite.png', C.purDk, C.purBr, [[7,3,'#f0d860'],[8,3,'#f0d860'],[6,5,'#f0d860'],[9,5,'#f0d860'],[5,7,'#f0d860'],[6,7,'#f0d860'],[9,7,'#f0d860'],[10,7,'#f0d860'],[6,9,'#f0d860'],[9,9,'#f0d860'],[7,11,'#f0d860'],[8,11,'#f0d860']]);
  drawNode('map-node-boss.png', '#4a0818', '#e85060', [[6,3,'#fff'],[7,3,'#fff'],[8,3,'#fff'],[9,3,'#fff'],[5,4,'#fff'],[10,4,'#fff'],[5,5,'#000'],[6,5,'#fff'],[7,5,'#000'],[8,5,'#fff'],[9,5,'#000'],[10,5,'#fff'],[6,7,'#fff'],[7,7,'#fff'],[8,7,'#fff'],[9,7,'#fff'],[6,8,'#fff'],[8,8,'#fff'],[7,9,'#fff'],[8,9,'#fff']]);
  drawNode('map-node-shop.png', C.grnDk, C.grnBr, [[6,4,'#f0d860'],[7,4,'#f0d860'],[8,4,'#f0d860'],[9,4,'#f0d860'],[5,5,'#f0d860'],[10,5,'#f0d860'],[5,6,'#f0d860'],[7,6,'#b08020'],[8,6,'#b08020'],[10,6,'#f0d860'],[5,7,'#f0d860'],[10,7,'#f0d860'],[6,8,'#f0d860'],[7,8,'#f0d860'],[8,8,'#f0d860'],[9,8,'#f0d860']]);
  drawNode('map-node-campfire.png', '#2a1808', '#e8a040', [[7,4,'#f0d860'],[8,4,'#f0d860'],[6,5,'#e88040'],[7,5,'#f0d860'],[8,5,'#f0d860'],[9,5,'#e88040'],[6,6,'#e86040'],[7,6,'#f0d860'],[8,6,'#e88040'],[9,6,'#e86040'],[7,7,'#e86040'],[8,7,'#e86040'],[5,8,'#8a5020'],[6,8,'#8a5020'],[7,8,'#8a5020'],[8,8,'#8a5020'],[9,8,'#8a5020'],[10,8,'#8a5020']]);
  drawNode('map-node-event.png', C.purDk, C.purBr, [[6,3,'#fff'],[7,3,'#fff'],[8,3,'#fff'],[9,3,'#fff'],[9,4,'#fff'],[10,4,'#fff'],[8,5,'#fff'],[9,5,'#fff'],[7,6,'#fff'],[8,6,'#fff'],[7,7,'#fff'],[7,9,'#fff'],[8,9,'#fff']]);
  drawNode('map-node-treasure.png', '#2a1808', C.gldMd, [[5,5,'#f0d860'],[6,5,'#f0d860'],[7,5,'#f0d860'],[8,5,'#f0d860'],[9,5,'#f0d860'],[10,5,'#f0d860'],[5,6,'#b08020'],[6,6,'#f0d860'],[7,6,'#f0d860'],[8,6,'#f0d860'],[9,6,'#f0d860'],[10,6,'#b08020'],[5,7,'#8a5020'],[6,7,'#8a5020'],[7,7,'#f0d860'],[8,7,'#f0d860'],[9,7,'#8a5020'],[10,7,'#8a5020'],[5,8,'#8a5020'],[6,8,'#b08020'],[7,8,'#b08020'],[8,8,'#b08020'],[9,8,'#b08020'],[10,8,'#8a5020']]);
  drawNode('map-node-completed.png', '#1a1828', '#555560', [[5,7,'#888'],[6,8,'#888'],[7,9,'#888'],[8,8,'#888'],[9,7,'#888'],[10,6,'#888'],[11,5,'#888']]);
}

// ═══ CARDS ═══
function genCards() {
  const S = 32;
  function drawCard(name, accent) {
    const c = createCanvas(S, S), g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    fillRounded(g, 0, 0, S, S, C.black);
    strokeRounded(g, 1, 1, S - 2, S - 2, C.wineDk);
    strokeRounded(g, 2, 2, S - 4, S - 4, C.creamDp);
    fillRounded(g, 3, 3, S - 6, S - 6, C.bgDark);
    g.fillStyle = rgba(232,216,192,0.04); g.fillRect(4, 3, S - 8, 1);
    if (accent) { g.fillStyle = accent; g.fillRect(3, S - 5, S - 6, 2); }
    savePng(c, name);
  }
  drawCard('card-default.png', null);
  drawCard('shop-item-bg.png', C.grnDk);
  drawCard('loot-card.png', C.gldDk);
  drawCard('event-card.png', C.purDk);
  drawCard('relic-card.png', C.purMd);
  drawCard('dice-card.png', C.bluDk);
  drawCard('campfire-option.png', '#6a3020');
  drawCard('levelup-option.png', C.gldMd);
  drawCard('settings-row.png', null);
  drawCard('log-row.png', null);
  drawCard('stat-row.png', C.gldDp);

  let c2 = createCanvas(S, S), g2 = px(c2.getContext('2d'));
  g2.fillStyle = rgba(10,8,16,0.6); g2.fillRect(0,0,S,S);
  for (let i = 0; i < S*2; i += 6) for (let d = 0; d < S; d++) { const x = i-d, y = d; if (x>=0&&x<S&&y>=0&&y<S) sp(g2,x,y,rgba(40,40,50,0.3)); }
  savePng(c2, 'shop-item-sold.png');
  c2 = createCanvas(S, S); g2 = px(c2.getContext('2d'));
  g2.fillStyle = rgba(10,8,16,0.5); g2.fillRect(0,0,S,S);
  savePng(c2, 'loot-card-collected.png');
}

// ═══ MODAL PARTS ═══
function genModalParts() {
  let c = createCanvas(32, 12), g = px(c.getContext('2d'));
  g.fillStyle = rgba(138,48,64,0.3); g.fillRect(0,0,32,12);
  g.fillStyle = C.wineDk; g.fillRect(0,11,32,1);
  g.fillStyle = rgba(232,216,192,0.04); g.fillRect(0,0,32,1);
  savePng(c, 'modal-title-bar.png');

  const S = 16;
  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  g.fillStyle = C.black;
  g.fillRect(2,0,S-4,1); g.fillRect(2,S-1,S-4,1); g.fillRect(0,2,1,S-4); g.fillRect(S-1,2,1,S-4);
  sp(g,1,1,C.black); sp(g,S-2,1,C.black); sp(g,1,S-2,C.black); sp(g,S-2,S-2,C.black);
  g.fillStyle = C.wineDk; g.fillRect(1,1,S-2,S-2);
  g.fillStyle = C.wineHi; g.fillRect(2,1,S-4,1);
  g.fillStyle = C.wineDp; g.fillRect(2,S-2,S-4,1);
  const X = C.cream;
  sp(g,4,4,X); sp(g,5,5,X); sp(g,6,6,X); sp(g,7,7,X); sp(g,8,8,X); sp(g,9,9,X); sp(g,10,10,X);
  sp(g,10,4,X); sp(g,9,5,X); sp(g,8,6,X); sp(g,6,8,X); sp(g,5,9,X); sp(g,4,10,X);
  savePng(c, 'close-btn.png');
}

// ═══ BATTLE HUD ═══
function genBattleHud() {
  const S = 32;
  function drawSlot(name, bdr) {
    const c = createCanvas(S, S), g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    fillRounded(g, 0, 0, S, S, C.black);
    strokeRounded(g, 1, 1, S - 2, S - 2, bdr);
    fillRounded(g, 2, 2, S - 4, S - 4, '#08060e');
    g.fillStyle = rgba(0,0,0,0.3); g.fillRect(3, 2, S - 6, 1);
    savePng(c, name);
  }
  drawSlot('dice-slot.png', C.creamDp);
  drawSlot('dice-slot-active.png', C.gldMd);

  let c = createCanvas(32, 16), g = px(c.getContext('2d'));
  g.clearRect(0, 0, 32, 16);
  g.fillStyle = C.black;
  g.fillRect(2,0,28,1); g.fillRect(2,15,28,1); g.fillRect(0,2,1,12); g.fillRect(31,2,1,12);
  sp(g,1,1,C.black); sp(g,30,1,C.black); sp(g,1,14,C.black); sp(g,30,14,C.black);
  g.fillStyle = C.bgDeep; g.fillRect(1,1,30,14);
  g.fillStyle = C.wineDp; g.fillRect(2,1,28,1);
  savePng(c, 'intent-bg.png');

  c = createCanvas(32, 6); g = px(c.getContext('2d'));
  g.fillStyle = C.black; g.fillRect(0,0,32,6);
  g.fillStyle = '#0a0810'; g.fillRect(1,1,30,4);
  savePng(c, 'enemy-hp-bg.png');

  c = createCanvas(32, 6); g = px(c.getContext('2d'));
  g.fillStyle = C.redMd; g.fillRect(0,0,32,6);
  g.fillStyle = C.redBr; g.fillRect(0,0,32,2);
  g.fillStyle = C.redDk; g.fillRect(0,5,32,1);
  savePng(c, 'enemy-hp-fill.png');

  c = createCanvas(32, 8); g = px(c.getContext('2d'));
  g.fillStyle = rgba(12,8,16,0.85); g.fillRect(0,0,32,8);
  g.fillStyle = C.wineDp; g.fillRect(0,0,32,1); g.fillRect(0,7,32,1);
  savePng(c, 'hud-bg.png');

  function drawBadge(name, bg, hi, dk) {
    c = createCanvas(32, 16); g = px(c.getContext('2d'));
    g.clearRect(0, 0, 32, 16);
    g.fillStyle = C.black;
    g.fillRect(2,0,28,1); g.fillRect(2,15,28,1); g.fillRect(0,2,1,12); g.fillRect(31,2,1,12);
    sp(g,1,1,C.black); sp(g,30,1,C.black); sp(g,1,14,C.black); sp(g,30,14,C.black);
    g.fillStyle = bg; g.fillRect(1,1,30,14);
    g.fillStyle = hi; g.fillRect(2,1,28,1);
    if (dk) { g.fillStyle = dk; g.fillRect(2,14,28,1); }
    savePng(c, name);
  }
  drawBadge('turn-badge.png', C.wineDk, C.wineHi, C.wineDp);
  drawBadge('wave-badge.png', C.purDk, C.purBr, C.purDp);

  c = createCanvas(32, 12); g = px(c.getContext('2d'));
  g.fillStyle = rgba(12,8,16,0.9); g.fillRect(0,0,32,12);
  g.fillStyle = C.wineDk; g.fillRect(0,11,32,1);
  savePng(c, 'topbar-bg.png');

  c = createCanvas(16, 16); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 16, 16);
  g.fillStyle = C.black;
  g.fillRect(2,0,12,1); g.fillRect(2,15,12,1); g.fillRect(0,2,1,12); g.fillRect(15,2,1,12);
  sp(g,1,1,C.black); sp(g,14,1,C.black); sp(g,1,14,C.black); sp(g,14,14,C.black);
  g.fillStyle = C.bgMid; g.fillRect(1,1,14,14);
  g.fillStyle = C.wineDp; g.fillRect(2,1,12,1);
  g.fillStyle = rgba(0,0,0,0.2); g.fillRect(2,14,12,1);
  savePng(c, 'topbar-btn.png');

  c = createCanvas(16, 8); g = px(c.getContext('2d'));
  g.fillStyle = C.black; g.fillRect(1,0,14,8); g.fillRect(0,1,16,6);
  g.fillStyle = '#1a1008'; g.fillRect(1,1,14,6);
  g.fillStyle = C.gldDk; g.fillRect(1,1,14,1);
  savePng(c, 'price-tag.png');
}

// ═══ VIGNETTE ═══
function genVignette() {
  const S = 64, c = createCanvas(S, S), g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  const cx = S/2, cy = S/2;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x-cx)/cx, dy = (y-cy)/cy, d = Math.sqrt(dx*dx+dy*dy);
    const a = Math.min(1, Math.max(0, (d-0.3)*0.8));
    if (a > 0.01) sp(g, x, y, rgba(12,8,16,a));
  }
  savePng(c, 'vignette.png');
}

// ═══ SMALL ICONS ═══
function genSmallIcons() {
  // Star
  let c = createCanvas(16, 16), g = px(c.getContext('2d'));
  g.clearRect(0, 0, 16, 16);
  const starPx = [[7,1],[8,1],[7,2],[8,2],[6,3],[7,3],[8,3],[9,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[4,8],[5,8],[6,8],[9,8],[10,8],[11,8],[3,9],[4,9],[5,9],[10,9],[11,9],[12,9],[3,10],[4,10],[11,10],[12,10]];
  for (const [sx,sy] of starPx) sp(g, sx, sy, '#f0d860');
  sp(g,7,2,'#fff8c0'); sp(g,8,2,'#fff8c0'); sp(g,7,3,'#fff8c0');
  savePng(c, 'star.png');

  c = createCanvas(16, 16); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 16, 16);
  const outline = [[7,1],[8,1],[6,3],[9,3],[3,5],[12,5],[5,6],[10,6],[5,7],[10,7],[4,8],[11,8],[3,9],[12,9],[3,10],[12,10]];
  for (const [sx,sy] of outline) sp(g, sx, sy, C.creamDp);
  savePng(c, 'star-empty.png');

  c = createCanvas(8, 8); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 8, 8);
  sp(g,3,1,C.cream); sp(g,4,1,C.cream); sp(g,2,2,C.cream); sp(g,5,2,C.cream);
  sp(g,1,3,C.cream); sp(g,6,3,C.cream); sp(g,3,4,C.cream); sp(g,4,4,C.cream);
  sp(g,3,5,C.cream); sp(g,4,5,C.cream); sp(g,3,6,C.cream); sp(g,4,6,C.cream);
  savePng(c, 'arrow-down.png');

  // Small panel 16x16
  c = createCanvas(16, 16); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 16, 16);
  g.fillStyle = C.black;
  g.fillRect(2,0,12,1); g.fillRect(2,15,12,1); g.fillRect(0,2,1,12); g.fillRect(15,2,1,12);
  sp(g,1,1,C.black); sp(g,14,1,C.black); sp(g,1,14,C.black); sp(g,14,14,C.black);
  g.fillStyle = C.bgDark; g.fillRect(1,1,14,14);
  g.fillStyle = C.wineDp; g.fillRect(2,1,12,1);
  savePng(c, 'small-panel.png');

  // Dice face slot 16x16
  c = createCanvas(16, 16); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 16, 16);
  g.fillStyle = C.black;
  g.fillRect(2,0,12,1); g.fillRect(2,15,12,1); g.fillRect(0,2,1,12); g.fillRect(15,2,1,12);
  sp(g,1,1,C.black); sp(g,14,1,C.black); sp(g,1,14,C.black); sp(g,14,14,C.black);
  g.fillStyle = '#08060e'; g.fillRect(1,1,14,14);
  g.fillStyle = C.creamDp; g.fillRect(2,1,12,1); g.fillRect(1,2,1,12);
  g.fillStyle = rgba(0,0,0,0.3); g.fillRect(2,14,12,1); g.fillRect(14,2,1,12);
  savePng(c, 'dice-face-slot.png');

  // Relic cells
  function drawCell(name, bdr, bg) {
    c = createCanvas(16, 16); g = px(c.getContext('2d'));
    g.clearRect(0, 0, 16, 16);
    g.fillStyle = C.black;
    g.fillRect(2,0,12,1); g.fillRect(2,15,12,1); g.fillRect(0,2,1,12); g.fillRect(15,2,1,12);
    sp(g,1,1,C.black); sp(g,14,1,C.black); sp(g,1,14,C.black); sp(g,14,14,C.black);
    g.fillStyle = bg; g.fillRect(1,1,14,14);
    g.fillStyle = bdr; g.fillRect(2,1,12,1);
    savePng(c, name);
  }
  drawCell('relic-cell.png', C.purDk, '#0e0a18');
  drawCell('relic-cell-locked.png', '#1a1a22', '#08080e');
}

// ═══ GLOWS ═══
function genGlows() {
  function drawGlow(name, r, g2, b, size) {
    const c = createCanvas(size, size), g = px(c.getContext('2d'));
    g.clearRect(0, 0, size, size);
    const cx = size/2, cy = size/2;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = (x-cx)/cx, dy = (y-cy)/cy, d = Math.sqrt(dx*dx+dy*dy);
      const a = Math.max(0, 1-d*d)*0.6;
      if (a > 0.01) sp(g, x, y, rgba(r, g2, b, a));
    }
    savePng(c, name);
  }
  drawGlow('glow-white.png',255,255,255,64); drawGlow('glow-red.png',224,96,80,64);
  drawGlow('glow-green.png',96,192,64,64); drawGlow('glow-gold.png',240,216,96,64);
  drawGlow('glow-purple.png',160,112,192,64); drawGlow('glow-wine.png',200,88,104,64);
  drawGlow('glow-white-lg.png',255,255,255,128); drawGlow('glow-red-lg.png',224,96,80,128);
  drawGlow('glow-green-lg.png',96,192,64,128); drawGlow('glow-gold-lg.png',240,216,96,128);
  drawGlow('glow-purple-lg.png',160,112,192,128); drawGlow('glow-wine-lg.png',200,88,104,128);
}

// ═══ DECORATIONS ═══
function genDecorations() {
  function drawGem(name, hi, md, dk) {
    const S = 8, c = createCanvas(S, S), g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    const outline = [[3,0],[4,0],[2,1],[5,1],[1,2],[6,2],[0,3],[7,3],[0,4],[7,4],[1,5],[6,5],[2,6],[5,6],[3,7],[4,7]];
    for (const [ox,oy] of outline) sp(g, ox, oy, C.black);
    const top = [[3,1],[4,1],[2,2],[3,2],[4,2],[5,2],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3]];
    for (const [tx,ty] of top) sp(g, tx, ty, md);
    const bot = [[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[2,5],[3,5],[4,5],[5,5],[3,6],[4,6]];
    for (const [bx,by] of bot) sp(g, bx, by, dk);
    sp(g,3,1,hi); sp(g,3,2,hi);
    savePng(c, name);
  }
  drawGem('gem-red.png','#ff8888','#c04040','#801818');
  drawGem('gem-blue.png','#88ccff','#4088c0','#183880');
  drawGem('gem-green.png','#88ff88','#40c040','#188018');
  drawGem('gem-purple.png','#cc88ff','#8040c0','#481880');
  drawGem('gem-amber.png','#ffe888','#c0a040','#806018');
  drawGem('gem-diamond.png','#ffffff','#c0d0e0','#8090a0');

  function drawRivet(name, size, hi, md, dk) {
    const c = createCanvas(size, size), g = px(c.getContext('2d'));
    g.clearRect(0, 0, size, size);
    g.fillStyle = md; g.fillRect(0,0,size,size);
    sp(g,0,0,hi); if (size>2) { sp(g,1,0,hi); sp(g,0,1,hi); }
    sp(g,size-1,size-1,dk); if (size>2) { sp(g,size-2,size-1,dk); sp(g,size-1,size-2,dk); }
    savePng(c, name);
  }
  drawRivet('rivet-small.png',3,C.creamHi,C.creamDk,C.creamDp);
  drawRivet('rivet-medium.png',4,C.creamHi,C.creamDk,C.creamDp);
  drawRivet('rivet-gold-small.png',3,'#fff8c0',C.gldMd,C.gldDk);
  drawRivet('rivet-gold.png',4,'#fff8c0',C.gldMd,C.gldDk);

  // Corner decorations
  let c = createCanvas(8, 8), g = px(c.getContext('2d'));
  g.clearRect(0, 0, 8, 8);
  g.fillStyle = C.wineMd; g.fillRect(0,0,8,2); g.fillRect(0,0,2,8);
  g.fillStyle = C.wineHi; g.fillRect(0,0,8,1); g.fillRect(0,0,1,8);
  savePng(c, 'corner-tl.png');

  c = createCanvas(8, 8); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 8, 8);
  g.fillStyle = C.gldDk; g.fillRect(0,0,8,2); g.fillRect(0,0,2,8);
  g.fillStyle = C.gldBr; g.fillRect(0,0,8,1); g.fillRect(0,0,1,8);
  savePng(c, 'corner-tl-gold.png');

  // Chain
  c = createCanvas(4, 16); g = px(c.getContext('2d'));
  g.clearRect(0, 0, 4, 16);
  g.fillStyle = C.creamDk;
  g.fillRect(1,0,2,1); g.fillRect(0,1,1,2); g.fillRect(3,1,1,2); g.fillRect(1,3,2,1);
  g.fillRect(1,4,2,1); g.fillRect(0,5,1,2); g.fillRect(3,5,1,2); g.fillRect(1,7,2,1);
  g.fillRect(1,8,2,1); g.fillRect(0,9,1,2); g.fillRect(3,9,1,2); g.fillRect(1,11,2,1);
  g.fillRect(1,12,2,1); g.fillRect(0,13,1,2); g.fillRect(3,13,1,2); g.fillRect(1,15,2,1);
  savePng(c, 'tex-chain.png');
}

// ═══ SOUL SHOP ═══
function genSoulShop() {
  const S = 32;
  let c = createCanvas(S, S), g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  fillRounded(g, 0, 0, S, S, C.black);
  strokeRounded(g, 1, 1, S - 2, S - 2, C.wineDp);
  fillRounded(g, 2, 2, S - 4, S - 4, C.bgDark);
  savePng(c, 'soul-shop-row.png');

  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  fillRounded(g, 0, 0, S, S, C.black);
  strokeRounded(g, 1, 1, S - 2, S - 2, C.grnDp);
  fillRounded(g, 2, 2, S - 4, S - 4, '#0a100e');
  savePng(c, 'soul-shop-row-owned.png');

  c = createCanvas(S, S); g = px(c.getContext('2d'));
  g.clearRect(0, 0, S, S);
  fillRounded(g, 0, 0, S, S, C.black);
  strokeRounded2(g, 1, 1, S - 2, S - 2, C.purDk, C.purDp);
  strokeRounded(g, 3, 3, S - 6, S - 6, C.creamDp);
  fillRounded(g, 4, 4, S - 8, S - 8, C.bgDeep);
  savePng(c, 'relic-detail.png');
}

// ═══ MAP PATH ═══
function genMapPath() {
  const c = createCanvas(4, 4), g = px(c.getContext('2d'));
  g.clearRect(0, 0, 4, 4);
  g.fillStyle = C.creamDp; g.fillRect(1,0,2,4);
  g.fillStyle = C.creamDk; g.fillRect(1,0,1,4);
  savePng(c, 'map-path.png');
}

// ═══ BADGES ═══
function genBadges() {
  const S = 16;
  function drawBadge(name, bg, hi, dk) {
    const c = createCanvas(S, S), g = px(c.getContext('2d'));
    g.clearRect(0, 0, S, S);
    g.fillStyle = C.black;
    g.fillRect(2,0,S-4,1); g.fillRect(2,S-1,S-4,1); g.fillRect(0,2,1,S-4); g.fillRect(S-1,2,1,S-4);
    sp(g,1,1,C.black); sp(g,S-2,1,C.black); sp(g,1,S-2,C.black); sp(g,S-2,S-2,C.black);
    g.fillStyle = bg; g.fillRect(1,1,S-2,S-2);
    g.fillStyle = hi; g.fillRect(2,1,S-4,2);
    g.fillStyle = dk; g.fillRect(2,S-3,S-4,1);
    savePng(c, name);
  }
  drawBadge('badge-gold.png', C.gldDk, C.gldBr, C.gldDp);
  drawBadge('badge-silver.png', C.gryMd, C.gryLt, C.gryDp);
}

// ═══ EXECUTE ═══
console.log('\n  六面史诗 · UI 素材 v4');
console.log('  风格：暗紫底 + 酒红边框 + 米白线条');
console.log('  输出: ' + OUT + '\n');

genPanels(); genButtons(); genBars(); genTextures(); genIconFrames();
genDividers(); genCheckboxes(); genTabs(); genScrollbar(); genMapNodes();
genCards(); genModalParts(); genBattleHud(); genVignette(); genSmallIcons();
genGlows(); genDecorations(); genSoulShop(); genMapPath(); genBadges();

console.log('\n  总计: ' + fs.readdirSync(OUT).length + ' 个素材');
console.log('  完成!\n');
