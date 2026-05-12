/**
 * weapp-adapter — 微信小游戏 DOM 适配层
 * 模拟 PixiJS 所需的最小浏览器 API
 */

// ⚠️ URL polyfill 必须最先定义，PixiJS bundle 顶层就会用
(function() {
  if (typeof URL !== 'undefined' && typeof URL.prototype !== 'undefined') {
    // 已有完整 URL，检查是否能正常 construct
    try { new URL('https://test.com'); return; } catch(e) {}
  }
  class URLPolyfill {
    constructor(url, base) {
      let fullUrl = String(url || '');
      if (base && !fullUrl.startsWith('http') && !fullUrl.startsWith('data:') && !fullUrl.startsWith('blob:')) {
        const baseStr = String(base);
        if (baseStr.endsWith('/')) fullUrl = baseStr + fullUrl;
        else fullUrl = baseStr.replace(/\/[^/]*$/, '/') + fullUrl;
      }
      if (!fullUrl || fullUrl === 'undefined') fullUrl = 'https://game.local/';
      this.href = fullUrl;
      this.origin = 'https://game.local';
      this.protocol = 'https:';
      this.host = 'game.local';
      this.hostname = 'game.local';
      this.port = '';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
      this.searchParams = { get() { return null; }, has() { return false; } };
      const protoMatch = fullUrl.match(/^(\w+):\/\//);
      if (protoMatch) {
        this.protocol = protoMatch[1] + ':';
        const rest = fullUrl.slice(protoMatch[0].length);
        const pathStart = rest.indexOf('/');
        if (pathStart >= 0) {
          this.host = rest.slice(0, pathStart);
          this.hostname = this.host.split(':')[0];
          this.port = this.host.split(':')[1] || '';
          this.pathname = rest.slice(pathStart);
        } else {
          this.host = rest;
          this.hostname = rest;
        }
        this.origin = this.protocol + '//' + this.host;
      }
    }
    toString() { return this.href; }
    toJSON() { return this.href; }
    static createObjectURL(obj) { return 'blob:local/' + Date.now(); }
    static revokeObjectURL(url) {}
  }
  if (typeof GameGlobal !== 'undefined') GameGlobal.URL = URLPolyfill;
  if (typeof globalThis !== 'undefined') globalThis.URL = URLPolyfill;
})();

// 主 Canvas
const canvas = wx.createCanvas();
canvas.id = 'gameCanvas';

// 模拟 window
if (typeof window === 'undefined') {
  const { windowWidth, windowHeight, pixelRatio } = wx.getSystemInfoSync();
  
  GameGlobal.window = {
    innerWidth: windowWidth,
    innerHeight: windowHeight,
    devicePixelRatio: pixelRatio,
    screen: { width: windowWidth, height: windowHeight },
    navigator: { userAgent: 'wxgame', language: 'zh-CN' },
    location: { href: 'https://game.local/', protocol: 'https:', host: 'game.local', hostname: 'game.local', pathname: '/', origin: 'https://game.local' },
    performance: wx.getPerformance ? wx.getPerformance() : { now: Date.now },
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() {},
    getComputedStyle: function() { return { getPropertyValue: () => '' }; },
    scrollTo: function() {},
    focus: function() {},
  };
  GameGlobal.window.self = GameGlobal.window;
  
  // 让 globalThis/self 指向 window
  if (typeof globalThis !== 'undefined') {
    Object.assign(globalThis, { window: GameGlobal.window });
    globalThis.self = GameGlobal.window;
    globalThis.top = GameGlobal.window;
    globalThis.parent = GameGlobal.window;
  }
  // 让全局也能访问
  GameGlobal.self = GameGlobal.window;
  GameGlobal.top = GameGlobal.window;
  GameGlobal.parent = GameGlobal.window;
}

// 模拟 document
if (typeof document === 'undefined') {
  const imgs = [];
  
  GameGlobal.document = {
    documentElement: { style: {} },
    head: { appendChild() {}, removeChild() {} },
    body: { appendChild() {}, removeChild() {}, style: {} },
    readyState: 'complete',
    visibilityState: 'visible',
    hidden: false,
    
    createElement(tag) {
      if (tag === 'canvas') {
        // PixiJS 会创建额外 canvas 用于纹理等
        const c = wx.createCanvas();
        c.style = {};
        c.classList = { add() {}, remove() {} };
        c.addEventListener = function(type, listener) {
          if (type === 'webglcontextlost' || type === 'webglcontextrestored') return;
          c['on' + type] = listener;
        };
        c.removeEventListener = function() {};
        c.getBoundingClientRect = function() {
          return { x: 0, y: 0, top: 0, left: 0, width: c.width, height: c.height, right: c.width, bottom: c.height };
        };
        return c;
      }
      if (tag === 'img' || tag === 'IMG') {
        const img = wx.createImage();
        img.addEventListener = function(type, listener) { img['on' + type] = listener; };
        img.removeEventListener = function() {};
        imgs.push(img);
        return img;
      }
      if (tag === 'div' || tag === 'span' || tag === 'style' || tag === 'link') {
        return {
          style: {},
          classList: { add() {}, remove() {} },
          appendChild() {},
          removeChild() {},
          addEventListener() {},
          removeEventListener() {},
          setAttribute() {},
          getAttribute() { return null; },
          innerHTML: '',
          textContent: '',
          childNodes: [],
          parentNode: null,
        };
      }
      return {};
    },
    
    createElementNS(ns, tag) {
      // SVG 支持 — PixiJS Text 可能用到
      return this.createElement(tag);
    },
    
    getElementById(id) {
      if (id === 'gameCanvas' || id === 'root') return canvas;
      return null;
    },
    
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementsByTagName() { return []; },
    addEventListener() {},
    removeEventListener() {},
    createTextNode(text) { return { textContent: text }; },
  };
}

// 模拟 HTMLCanvasElement / Image
if (typeof HTMLCanvasElement === 'undefined') {
  GameGlobal.HTMLCanvasElement = canvas.constructor || function() {};
}
if (typeof HTMLImageElement === 'undefined') {
  GameGlobal.HTMLImageElement = (wx.createImage()).constructor || function() {};
}
if (typeof Image === 'undefined') {
  GameGlobal.Image = function() { return wx.createImage(); };
}

// 模拟 Event
if (typeof Event === 'undefined') {
  GameGlobal.Event = function(type) { this.type = type; };
}
if (typeof TouchEvent === 'undefined') {
  GameGlobal.TouchEvent = function(type) { this.type = type; this.touches = []; };
}

// 模拟 XMLHttpRequest（PixiJS 资源加载可能用到）
if (typeof XMLHttpRequest === 'undefined') {
  GameGlobal.XMLHttpRequest = function() {
    this.readyState = 0;
    this.status = 0;
    this.responseType = '';
    this.response = null;
    this.open = function() {};
    this.send = function() {};
    this.setRequestHeader = function() {};
    this.addEventListener = function() {};
    this.removeEventListener = function() {};
  };
}

// DOMParser polyfill
if (typeof DOMParser === 'undefined') {
  GameGlobal.DOMParser = function() {
    this.parseFromString = function() { return { documentElement: {} }; };
  };
}

// 导出主 canvas 供游戏使用
GameGlobal.gameCanvas = canvas;
module.exports = { canvas };
