/**
 * 纯 PixiJS 入口 — 不依赖 React/DOM
 */

// 注册像素字体（原版 @font-face 在 index.css，纯 Canvas 需手动注册）
const fontFaces = [
  new FontFace('FusionPixel', "url('./fonts/fusion-pixel-12px-monospaced-zh_hans.woff2') format('woff2')", {
    weight: '400', style: 'normal', display: 'block',
  }),
  new FontFace('FusionPixel', "url('./fonts/fusion-pixel-12px-monospaced-latin.woff2') format('woff2')", {
    weight: '400', style: 'normal', display: 'block', unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  }),
];

async function loadFonts(): Promise<void> {
  const results = await Promise.allSettled(
    fontFaces.map(async (ff) => {
      const loaded = await ff.load();
      document.fonts.add(loaded);
    }),
  );
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn('[Font] Some fonts failed to load:', failed);
  } else {
    console.log('[Font] FusionPixel loaded OK');
  }
}

import { GameApp } from './GameApp';

async function boot() {
  await loadFonts();
  const gameApp = new GameApp();
  await gameApp.init();
  // 暴露到全局方便调试
  (globalThis as any).__gameApp = gameApp;
}

boot();
