/**
 * PixelRenderer — 纯 PixiJS 像素画渲染
 * 将像素数组数据渲染为 PIXI.Texture，缓存复用
 * 不依赖 DOM（document.createElement），可运行在小游戏环境
 */
import { Graphics, Texture, Sprite, RenderTexture, Container } from 'pixi.js';
import type { Application } from 'pixi.js';

const textureCache = new Map<string, Texture>();

/** 将像素二维数组渲染为 PIXI.Sprite */
export function createPixelSprite(
  app: Application,
  pixels: string[][],
  pixelSize: number = 4,
  cacheKey?: string,
): Sprite {
  const key = cacheKey || `px_${pixels.length}x${(pixels[0]?.length || 0)}@${pixelSize}_${simpleHash(pixels)}`;

  if (!textureCache.has(key)) {
    const w = pixels[0]?.length || 0;
    const h = pixels.length;
    const g = new Graphics();
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const color = pixels[row][col];
        if (color) {
          const hex = parseInt(color.replace('#', ''), 16);
          g.rect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
          g.fill({ color: hex });
        }
      }
    }
    // 渲染到纹理并缓存
    const rt = RenderTexture.create({ width: w * pixelSize, height: h * pixelSize });
    app.renderer.render({ container: g, target: rt });
    textureCache.set(key, rt);
    g.destroy();
  }

  return new Sprite(textureCache.get(key)!);
}

/** 简单 hash 用于缓存 key */
function simpleHash(pixels: string[][]): string {
  let h = 0;
  const flat = pixels.flat();
  for (let i = 0; i < flat.length; i += 3) {
    const s = flat[i] || '';
    for (let j = 0; j < s.length; j++) {
      h = ((h << 5) - h + s.charCodeAt(j)) | 0;
    }
  }
  return h.toString(36);
}

/** 从 SPRITE_DATA 格式创建精灵 */
export function createSpriteFromData(
  app: Application,
  data: { pixels: string[][]; width: number; height: number },
  pixelSize: number = 4,
  cacheKey?: string,
): Sprite {
  return createPixelSprite(app, data.pixels, pixelSize, cacheKey);
}

/** 清除纹理缓存 */
export function clearPixelCache() {
  textureCache.forEach(t => t.destroy(true));
  textureCache.clear();
}
