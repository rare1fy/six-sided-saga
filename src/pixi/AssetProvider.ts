/**
 * AssetProvider - Unified asset abstraction layer
 *
 * All scenes/UI components obtain visual assets through this module.
 * Consumers only care about "give me a Sprite", not whether it's pixel matrix or PNG atlas.
 *
 * To swap in production art later, only modify this file's internal implementation.
 * All consumers: zero changes needed.
 *
 * Design:
 * 1. Single entry point for all asset access
 * 2. Strategy-switchable: pixel matrix / PNG atlas / SVG
 * 3. Unified RenderTexture cache
 * 4. Type-safe: all APIs return Sprite
 */
import { Graphics, RenderTexture, Sprite, Texture } from 'pixi.js';
import type { Application } from 'pixi.js';
import * as Icons from '../data/pixelIconData';
import { RELIC_PIXEL_DATA, DEFAULT_ICON } from '../data/relicPixelData';
import { ENEMY_SPRITES } from '../data/enemySprites';
import { ENEMY_IMAGE_MAP } from '../data/enemyImageMap';

// ============================================================
// Types
// ============================================================

export type AssetCategory = 'icon' | 'relic' | 'enemy';

export interface AssetProviderConfig {
  /** pixel = draw from matrix data, atlas = lookup from spritesheet */
  mode: 'pixel' | 'atlas';
  /** Atlas spritesheet path (reserved for future) */
  atlasPath?: string;
}

type PixelMatrix = readonly (readonly string[])[] | string[][];

// ============================================================
// Internal state
// ============================================================

let _app: Application | null = null;
let _config: AssetProviderConfig = { mode: 'pixel' };
const _cache = new Map<string, Texture>();

// ============================================================
// Init
// ============================================================

export function initAssetProvider(app: Application, config?: Partial<AssetProviderConfig>): void {
  _app = app;
  if (config) {
    _config = { ..._config, ...config };
  }
}

// ============================================================
// Public API - Icons
// ============================================================

export function getIcon(name: string, size: number = 32, tint?: number): Sprite {
  const cacheKey = `icon:${name}:${size}:${tint ?? 'none'}`;
  if (_cache.has(cacheKey)) {
    return new Sprite(_cache.get(cacheKey)!);
  }
  if (_config.mode === 'atlas') {
    return _getFromAtlas(cacheKey, `icon_${name}`, size);
  }
  const matrix = _getIconMatrix(name);
  if (!matrix) {
    return _createPlaceholder(size, 0x333333, cacheKey);
  }
  return _renderMatrixToSprite(matrix, size, cacheKey, tint);
}

// ============================================================
// Public API - Relic Icons
// ============================================================

export function getRelicIcon(relicId: string, size: number = 28): Sprite {
  const cacheKey = `relic:${relicId}:${size}`;
  if (_cache.has(cacheKey)) {
    return new Sprite(_cache.get(cacheKey)!);
  }
  if (_config.mode === 'atlas') {
    return _getFromAtlas(cacheKey, `relic_${relicId}`, size);
  }
  const matrix = RELIC_PIXEL_DATA[relicId] ?? DEFAULT_ICON;
  return _renderMatrixToSprite(matrix, size, cacheKey);
}

export function hasRelicIcon(relicId: string): boolean {
  return relicId in RELIC_PIXEL_DATA;
}

export function getRelicIconIds(): string[] {
  return Object.keys(RELIC_PIXEL_DATA);
}

// ============================================================
// Public API - Enemy Sprites
// ============================================================

export function getEnemySprite(enemyName: string, pixelSize: number = 4): Sprite {
  const cacheKey = `enemy:${enemyName}:${pixelSize}`;
  if (_cache.has(cacheKey)) {
    return new Sprite(_cache.get(cacheKey)!);
  }

  // 优先：PNG 图片模式
  const imageUrl = ENEMY_IMAGE_MAP[enemyName];
  if (imageUrl) {
    const sp = Sprite.from(imageUrl);
    const targetSize = pixelSize * 16;
    // 等比缩放到目标尺寸
    if (sp.texture.valid) {
      const scale = targetSize / Math.max(sp.texture.width, sp.texture.height);
      sp.scale.set(scale, scale);
    } else {
      sp.texture.baseTexture.once('loaded', () => {
        const scale = targetSize / Math.max(sp.texture.width, sp.texture.height);
        sp.scale.set(scale, scale);
      });
    }
    return sp;
  }

  if (_config.mode === 'atlas') {
    return _getFromAtlas(cacheKey, `enemy_${enemyName}`, pixelSize * 16);
  }
  const spriteData = (ENEMY_SPRITES as Record<string, { pixels: string[][]; width: number; height: number }>)[enemyName];
  if (!spriteData) {
    return _createPlaceholder(pixelSize * 16, 0x660000, cacheKey);
  }
  return _renderRawPixelsToSprite(spriteData.pixels, pixelSize, cacheKey);
}

// ============================================================
// Public API - Cache Management
// ============================================================

export function clearAssetCache(): void {
  _cache.forEach((tex) => tex.destroy(true));
  _cache.clear();
}

export function clearCategoryCache(category: AssetCategory): void {
  const prefix = `${category}:`;
  const keysToDelete: string[] = [];
  _cache.forEach((_, key) => {
    if (key.startsWith(prefix)) keysToDelete.push(key);
  });
  keysToDelete.forEach((key) => {
    _cache.get(key)?.destroy(true);
    _cache.delete(key);
  });
}

/**
 * Switch asset mode at runtime.
 * Call this when swapping from pixel placeholders to production art.
 */
export function setAssetMode(mode: AssetProviderConfig['mode'], atlasPath?: string): void {
  clearAssetCache();
  _config.mode = mode;
  if (atlasPath) _config.atlasPath = atlasPath;
}

// ============================================================
// Internal - Pixel matrix rendering
// ============================================================

function _renderMatrixToSprite(
  matrix: PixelMatrix,
  size: number,
  cacheKey: string,
  tint?: number,
): Sprite {
  if (!_app) throw new Error('[AssetProvider] Not initialized. Call initAssetProvider(app) first.');

  const rows = matrix.length;
  const cols = Math.max(...matrix.map((r) => r.length));
  const pixelSize = Math.max(1, Math.floor(size / Math.max(rows, cols)));

  const g = new Graphics();
  for (let y = 0; y < rows; y++) {
    const row = matrix[y];
    for (let x = 0; x < row.length; x++) {
      const color = row[x];
      if (!color) continue;
      const fillColor = tint ?? parseInt(color.replace('#', ''), 16);
      g.beginFill(fillColor);
      g.drawRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      g.endFill();
    }
  }

  const width = cols * pixelSize;
  const height = rows * pixelSize;
  const rt = RenderTexture.create({ width, height });
  _app.renderer.render(g, { renderTexture: rt });
  _cache.set(cacheKey, rt);
  g.destroy();
  return new Sprite(rt);
}

function _renderRawPixelsToSprite(
  pixels: string[][],
  pixelSize: number,
  cacheKey: string,
): Sprite {
  if (!_app) throw new Error('[AssetProvider] Not initialized. Call initAssetProvider(app) first.');

  const h = pixels.length;
  const w = pixels[0]?.length || 0;
  const g = new Graphics();

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const color = pixels[row][col];
      if (color) {
        const hex = parseInt(color.replace('#', ''), 16);
        g.beginFill(hex);
        g.drawRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
        g.endFill();
      }
    }
  }

  const rt = RenderTexture.create({ width: w * pixelSize, height: h * pixelSize });
  _app.renderer.render(g, { renderTexture: rt });
  _cache.set(cacheKey, rt);
  g.destroy();
  return new Sprite(rt);
}

// ============================================================
// Internal - Atlas mode (reserved for production art)
// ============================================================

function _getFromAtlas(cacheKey: string, frameName: string, size: number): Sprite {
  // Future: load from spritesheet
  // const sheet = Assets.get(_config.atlasPath);
  // const texture = sheet.textures[frameName];
  // if (texture) { _cache.set(cacheKey, texture); return new Sprite(texture); }
  return _createPlaceholder(size, 0xff00ff, cacheKey);
}

// ============================================================
// Internal - Utilities
// ============================================================

function _createPlaceholder(size: number, color: number, cacheKey: string): Sprite {
  if (!_app) return new Sprite(Texture.EMPTY);

  const g = new Graphics();
  g.beginFill(color, 0.5);
  g.drawRect(0, 0, size, size);
  g.endFill();
  g.lineStyle(1, 0xffffff, 0.8);
  g.moveTo(0, 0);
  g.lineTo(size, size);
  g.moveTo(size, 0);
  g.lineTo(0, size);

  const rt = RenderTexture.create({ width: size, height: size });
  _app.renderer.render(g, { renderTexture: rt });
  _cache.set(cacheKey, rt);
  g.destroy();
  return new Sprite(rt);
}

function _getIconMatrix(name: string): PixelMatrix | null {
  const ICON_MAP: Record<string, PixelMatrix | undefined> = {
    sword: Icons.SWORD,
    skull: Icons.SKULL,
    crown: Icons.CROWN,
    shop_bag: Icons.SHOP_BAG,
    question: Icons.QUESTION,
    campfire: Icons.CAMPFIRE,
    poison: Icons.POISON,
    flame: Icons.FLAME,
    wind: Icons.WIND,
    arrow_up: Icons.ARROW_UP,
    arrow_down: Icons.ARROW_DOWN,
    shield: Icons.SHIELD,
    heart: Icons.HEART,
    coin: Icons.COIN,
    zap: Icons.ZAP,
    pair: Icons.PAIR,
    layers: Icons.LAYERS,
    triangle: Icons.TRIANGLE,
    arrow_right: Icons.ARROW_RIGHT,
    droplet: Icons.DROPLET,
    blood_drop: Icons.BLOOD_DROP,
    house: Icons.HOUSE,
    square: Icons.SQUARE,
    star: Icons.STAR,
    level_arrow: Icons.LEVEL_ARROW,
    trophy: Icons.TROPHY,
    waves: Icons.WAVES,
    dice: Icons.DICE,
    refresh: Icons.REFRESH,
    play: Icons.PLAY,
    attack_intent: Icons.ATTACK_INTENT,
    magic: Icons.MAGIC,
    book: Icons.BOOK,
    soul_crystal: Icons.SOUL_CRYSTAL,
    cards: Icons.CARDS,
    dice_icon: Icons.DICE_ICON,
    gem: Icons.GEM,
    claw: Icons.CLAW,
    close: Icons.CLOSE,
    info: Icons.INFO,
    gear: Icons.GEAR,
    fist: Icons.FIST,
    dice_chaos: Icons.DICE_CHAOS,
    dice_blood: Icons.DICE_BLOOD,
    dice_weighted: Icons.DICE_WEIGHTED,
    volume: Icons.VOLUME,
    mute: Icons.MUTE,
    music: Icons.MUSIC,
    cracked_heart: Icons.CRACKED_HEART,
    arcane_skull: Icons.ARCANE_SKULL,
    bloodthirst: Icons.BLOODTHIRST,
  };
  return ICON_MAP[name.toLowerCase()] ?? null;
}


// ============================================================
// Public API - Generic pixel matrix rendering
// ============================================================

/**
 * Render any pixel matrix to a cached Sprite.
 * Use for one-off pixel data that doesn't belong to icon/relic/enemy categories.
 * @param pixels The pixel matrix (string[][] with hex colors, '' = transparent)
 * @param pixelSize Size of each pixel block in px
 * @param cacheKey Unique cache key (caller must ensure uniqueness)
 */
export function getPixelSprite(
  pixels: string[][],
  pixelSize: number = 4,
  cacheKey?: string,
): Sprite {
  const key = cacheKey || `px_${pixels.length}x${(pixels[0]?.length || 0)}@${pixelSize}_${_simpleHash(pixels)}`;
  if (_cache.has(key)) {
    return new Sprite(_cache.get(key)!);
  }
  return _renderRawPixelsToSprite(pixels, pixelSize, key);
}

function _simpleHash(pixels: string[][]): string {
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
