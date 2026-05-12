/**
 * 微信小游戏兼容性测试入口
 * 
 * 方案说明：
 * 微信小游戏有两种模式：
 * 1. 纯 Canvas 模式 — 没有 DOM，需要全部用 Canvas API 绘制
 * 2. WebView 模式 (web-view组件) — 本质是内嵌浏览器，支持 DOM
 * 
 * 当前我们的游戏是 React DOM 项目，所以先测试：
 * - 小游戏的 Canvas 环境能否运行我们的 Canvas dataURL 渲染
 * - 如果不行，需要用 web-view 方案还是全量迁移到 Canvas
 * 
 * 这个文件模拟小游戏环境下的基本测试。
 */

// 获取 canvas
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const { windowWidth, windowHeight } = wx.getSystemInfoSync();

// 设置画布大小
canvas.width = windowWidth;
canvas.height = windowHeight;

// ====== 测试1：Canvas 基本绘制 ======
ctx.fillStyle = '#0a0a0a';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = '#fc6';
ctx.font = '20px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('六面史诗 — 小游戏兼容性测试', canvas.width / 2, 60);

// ====== 测试2：Canvas 像素画渲染（模拟 PixelSprite） ======
const testSprite = [
  ['', '', '#4a6a3a', '#4a6a3a', '#4a6a3a', '#4a6a3a', '', ''],
  ['', '#4a6a3a', '#6a8a4a', '#6a8a4a', '#6a8a4a', '#6a8a4a', '#4a6a3a', ''],
  ['', '#4a6a3a', '#c8403c', '#6a8a4a', '#6a8a4a', '#c8403c', '#4a6a3a', ''],
  ['', '#4a6a3a', '#6a8a4a', '#3a4a2a', '#3a4a2a', '#6a8a4a', '#4a6a3a', ''],
  ['', '', '#4a6a3a', '#4a6a3a', '#4a6a3a', '#4a6a3a', '', ''],
  ['', '#3a4a2a', '#4a6a3a', '#6a8a4a', '#6a8a4a', '#4a6a3a', '#3a4a2a', ''],
  ['#3a4a2a', '#4a6a3a', '#4a6a3a', '#4a6a3a', '#4a6a3a', '#4a6a3a', '#4a6a3a', '#3a4a2a'],
  ['', '#3a4a2a', '', '#4a6a3a', '#4a6a3a', '', '#3a4a2a', ''],
];

const pixelSize = 6;
const spriteX = (canvas.width - 8 * pixelSize) / 2;
const spriteY = 100;

ctx.fillStyle = '#333';
ctx.fillText('测试: Canvas 像素画渲染 (食尸鬼)', canvas.width / 2, spriteY - 10);

for (let row = 0; row < testSprite.length; row++) {
  for (let col = 0; col < testSprite[row].length; col++) {
    const color = testSprite[row][col];
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(spriteX + col * pixelSize, spriteY + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

// ====== 测试3：Canvas dataURL (模拟我们的渲染方式) ======
const testCanvas = wx.createCanvas();
testCanvas.width = 8 * pixelSize;
testCanvas.height = 8 * pixelSize;
const tCtx = testCanvas.getContext('2d');

for (let row = 0; row < testSprite.length; row++) {
  for (let col = 0; col < testSprite[row].length; col++) {
    const color = testSprite[row][col];
    if (color) {
      tCtx.fillStyle = color;
      tCtx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
    }
  }
}

// 尝试将 canvas 转为图片再绘制（模拟 dataURL 方案）
try {
  const dataURL = testCanvas.toDataURL('image/png');
  const img = wx.createImage();
  img.onload = () => {
    ctx.drawImage(img, spriteX, spriteY + 80);
    ctx.fillStyle = '#4c4';
    ctx.fillText('✓ dataURL → Image → drawImage 成功！', canvas.width / 2, spriteY + 80 + 8 * pixelSize + 20);
    
    showResults(true);
  };
  img.onerror = (e) => {
    ctx.fillStyle = '#f44';
    ctx.fillText('✗ dataURL → Image 加载失败', canvas.width / 2, spriteY + 170);
    showResults(false);
  };
  img.src = dataURL;
} catch (e) {
  ctx.fillStyle = '#f44';
  ctx.fillText('✗ toDataURL 不支持: ' + e.message, canvas.width / 2, spriteY + 170);
  showResults(false);
}

// ====== 测试4：SVG 支持检测 ======
function showResults(dataURLOk) {
  const y = spriteY + 260;
  
  ctx.fillStyle = '#888';
  ctx.font = '16px sans-serif';
  ctx.fillText('── 兼容性检测结果 ──', canvas.width / 2, y);
  
  const results = [
    { name: 'Canvas 2D 基本绘制', ok: true },
    { name: 'Canvas 像素画直绘', ok: true },
    { name: 'toDataURL → Image', ok: dataURLOk },
    { name: 'DOM (document.createElement)', ok: typeof document !== 'undefined' },
    { name: 'CSS (window.getComputedStyle)', ok: typeof window !== 'undefined' && typeof window.getComputedStyle === 'function' },
    { name: 'SVG (DOMParser)', ok: typeof DOMParser !== 'undefined' },
    { name: 'React (需要 DOM)', ok: typeof document !== 'undefined' && typeof document.getElementById === 'function' },
    { name: 'Web Audio API', ok: typeof (wx.createInnerAudioContext) === 'function' },
  ];
  
  results.forEach((r, i) => {
    ctx.fillStyle = r.ok ? '#4c4' : '#f44';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${r.ok ? '✓' : '✗'} ${r.name}`,
      40,
      y + 30 + i * 24
    );
  });
  
  // 总结建议
  const hasDom = typeof document !== 'undefined';
  ctx.fillStyle = '#fc6';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  
  if (hasDom) {
    ctx.fillText('→ 检测到 DOM 支持，可尝试直接加载 React 应用', canvas.width / 2, y + 30 + results.length * 24 + 30);
  } else {
    ctx.fillText('→ 无 DOM 支持，需要全量迁移到 Canvas 渲染', canvas.width / 2, y + 30 + results.length * 24 + 30);
    ctx.fillText('  或使用 web-view 组件方案', canvas.width / 2, y + 30 + results.length * 24 + 54);
  }
}
