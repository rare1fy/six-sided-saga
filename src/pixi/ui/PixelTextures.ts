/**
 * PixelTextures.ts — 像素材质纹理系统 (PixiJS v7)
 *
 * 原版 index.css 中有 4 种 8x8 像素纹理（--tex-stone/wood/iron/parchment），
 * 用于骰子背景、面板装饰等。这里用 Graphics + RenderTexture 生成可平铺纹理。
 */
import { Graphics, RenderTexture, TilingSprite } from 'pixi.js';
import type { Application } from 'pixi.js';

const textureCache = new Map<string, RenderTexture>();

// ============================================================
// 纹理定义（从原版 CSS 内联 SVG 精确翻译）
// 每个像素块 = [x, y, w, h, color, alpha]
// ============================================================

type PixelBlock = [number, number, number, number, number, number];

const TEX_STONE: PixelBlock[] = [
  // base: #181614
  [0, 0, 8, 8, 0x181614, 1],
  [0, 0, 2, 2, 0x1c1a16, 0.6],
  [4, 2, 2, 2, 0x141210, 0.5],
  [2, 4, 2, 2, 0x1e1c18, 0.4],
  [6, 6, 2, 2, 0x141210, 0.5],
  [0, 6, 2, 1, 0x222018, 0.3],
  [6, 0, 1, 2, 0x201e16, 0.3],
  [3, 1, 1, 1, 0x242220, 0.25],
  [5, 5, 1, 1, 0x0e0c0a, 0.35],
];

const TEX_WOOD: PixelBlock[] = [
  // base: #1a1408
  [0, 0, 8, 8, 0x1a1408, 1],
  [0, 0, 8, 1, 0x201a0c, 0.5],
  [0, 3, 8, 1, 0x161006, 0.6],
  [0, 5, 8, 1, 0x221c0e, 0.4],
  [0, 7, 8, 1, 0x141008, 0.5],
  [2, 1, 1, 1, 0x282010, 0.3],
  [6, 4, 1, 1, 0x241c0c, 0.25],
];

const TEX_IRON: PixelBlock[] = [
  // base: #222020
  [0, 0, 6, 6, 0x222020, 1],
  [0, 0, 1, 1, 0x2a2828, 0.6],
  [3, 1, 1, 1, 0x1a1818, 0.5],
  [1, 3, 1, 1, 0x2e2c2c, 0.4],
  [4, 4, 1, 1, 0x161414, 0.5],
  [5, 2, 1, 1, 0x282626, 0.35],
  [2, 5, 1, 1, 0x201e1e, 0.3],
];

const TEX_PARCHMENT: PixelBlock[] = [
  // base: #282018
  [0, 0, 8, 8, 0x282018, 1],
  [1, 0, 2, 1, 0x2e2618, 0.4],
  [5, 2, 2, 2, 0x221a10, 0.5],
  [0, 4, 2, 2, 0x2c2416, 0.35],
  [4, 6, 2, 1, 0x201810, 0.4],
  [6, 1, 1, 1, 0x342c1e, 0.25],
  [3, 5, 1, 1, 0x1c1408, 0.3],
];

const TEXTURE_DEFS: Record<string, { blocks: PixelBlock[]; tileSize: number }> = {
  stone:     { blocks: TEX_STONE,     tileSize: 8 },
  wood:      { blocks: TEX_WOOD,      tileSize: 8 },
  iron:      { blocks: TEX_IRON,      tileSize: 6 },
  parchment: { blocks: TEX_PARCHMENT, tileSize: 8 },
};

/**
 * 生成纹理 RenderTexture（带缓存）
 */
export function getPixelTexture(
  app: Application,
  textureName: string,
  scale: number = 1,
): RenderTexture {
  const cacheKey = `tex_${textureName}_${scale}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const def = TEXTURE_DEFS[textureName];
  if (!def) {
    // 返回 1x1 黑色纹理
    const fallback = RenderTexture.create({ width: 1, height: 1 });
    textureCache.set(cacheKey, fallback);
    return fallback;
  }

  const { blocks, tileSize } = def;
  const size = Math.ceil(tileSize * scale);
  const g = new Graphics();

  for (const [x, y, w, h, color, alpha] of blocks) {
    g.beginFill(color, alpha);
    g.drawRect(
      Math.round(x * scale),
      Math.round(y * scale),
      Math.max(1, Math.round(w * scale)),
      Math.max(1, Math.round(h * scale)),
    );
    g.endFill();
  }

  const rt = RenderTexture.create({ width: size, height: size });
  app.renderer.render(g, { renderTexture: rt });
  textureCache.set(cacheKey, rt);
  g.destroy();

  return rt;
}

/**
 * 创建可平铺的纹理精灵
 * @param app PixiJS Application
 * @param textureName 纹理名称（stone/wood/iron/parchment）
 * @param width 平铺区域宽度
 * @param height 平铺区域高度
 * @param scale 纹理缩放（默认 2x 让像素更明显）
 * @param alpha 整体透明度
 */
export function createTilingTexture(
  app: Application,
  textureName: string,
  width: number,
  height: number,
  scale: number = 2,
  alpha: number = 1,
): TilingSprite {
  const rt = getPixelTexture(app, textureName, scale);
  const tiling = new TilingSprite(rt, width, height);
  tiling.alpha = alpha;
  return tiling;
}

/** 可用纹理名称列表 */
export const TEXTURE_NAMES = Object.keys(TEXTURE_DEFS);

/** 清除纹理缓存 */
export function clearTextureCache(): void {
  textureCache.forEach((rt) => rt.destroy(true));
  textureCache.clear();
}
