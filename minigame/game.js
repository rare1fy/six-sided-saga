/**
 * 微信小游戏入口
 * 参考: https://juejin.cn/post/7211088034179121213
 */

// 1. 加载成熟的 weapp-adapter2（模拟 DOM/BOM）
require('./libs/weapp-adapter/index.js');

// 2. 确保全局 canvas 可用
const canvas = GameGlobal.canvas;

// 3. 补充 PixiJS 渲染时需要的 DOM 方法
const alwaysTrue = { value: function(el) { return true; }, writable: true, configurable: true };
try { if (document.body && !document.body.contains) Object.defineProperty(document.body, 'contains', alwaysTrue); } catch(e) {}
try { if (document.documentElement && !document.documentElement.contains) Object.defineProperty(document.documentElement, 'contains', alwaysTrue); } catch(e) {}
try { if (!document.contains) Object.defineProperty(document, 'contains', alwaysTrue); } catch(e) {}

// 3. 补充 PixiJS 可能需要的额外全局变量
if (typeof URL === 'undefined' || !URL.prototype) {
  GameGlobal.URL = function(url, base) {
    this.href = String(url || '');
    this.origin = 'https://game.local';
    this.protocol = 'https:';
    this.pathname = '/';
    this.toString = function() { return this.href; };
  };
  GameGlobal.URL.createObjectURL = function() { return ''; };
  GameGlobal.URL.revokeObjectURL = function() {};
}

// 4. 补充 PixiJS 需要的全局类型（文字测量等）
if (typeof CanvasRenderingContext2D === 'undefined') {
  // 从一个临时 canvas 取出其 context 的构造函数
  const _tmpCanvas = wx.createCanvas();
  const _tmpCtx = _tmpCanvas.getContext('2d');
  GameGlobal.CanvasRenderingContext2D = _tmpCtx.constructor || function(){};
  _tmpCanvas.width = 0; _tmpCanvas.height = 0; // 释放
}
if (typeof WebGLRenderingContext === 'undefined') {
  try {
    const _glCanvas = wx.createCanvas();
    const _gl = _glCanvas.getContext('webgl');
    if (_gl) GameGlobal.WebGLRenderingContext = _gl.constructor || function(){};
    _glCanvas.width = 0; _glCanvas.height = 0;
  } catch(e) { GameGlobal.WebGLRenderingContext = function(){}; }
}

// 5. 加载游戏 bundle
require('./game-bundle');
