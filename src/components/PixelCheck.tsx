/**
 * PixelCheck — 像素风 ✓ 对勾图标（7x7 绿色）
 * [TOAST-ICON 2026-05-09] 用于"成功/购买/存档"类 toast
 */
import React from 'react';

interface PixelIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const GREEN_LIGHT = '#aef28a';
const GREEN_MID = '#5cb046';
const GREEN_DARK = '#2f6a1e';

const CHECK: readonly (readonly string[])[] = [
  ['', '', '', '', '', '', GREEN_LIGHT],
  ['', '', '', '', '', GREEN_LIGHT, GREEN_MID],
  ['', '', '', '', GREEN_LIGHT, GREEN_MID, GREEN_DARK],
  [GREEN_DARK, '', '', GREEN_LIGHT, GREEN_MID, GREEN_DARK, ''],
  [GREEN_MID, GREEN_DARK, GREEN_LIGHT, GREEN_MID, GREEN_DARK, '', ''],
  [GREEN_LIGHT, GREEN_MID, GREEN_DARK, '', '', '', ''],
  ['', GREEN_DARK, '', '', '', '', ''],
];

const renderCheckToDataURL = (pixels: readonly (readonly string[])[], ps: number): string => {
  const w = pixels[0]?.length || 0;
  const h = pixels.length;
  const canvas = document.createElement('canvas');
  canvas.width = w * ps;
  canvas.height = h * ps;
  const ctx = canvas.getContext('2d')!;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const color = pixels[r][c];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(c * ps, r * ps, ps, ps);
      }
    }
  }
  return canvas.toDataURL();
};

let checkCache: Map<number, string> = new Map();

export const PixelCheck: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const w = CHECK[0].length;
  const h = CHECK.length;
  if (!checkCache.has(size)) {
    checkCache.set(size, renderCheckToDataURL(CHECK, size));
  }
  return (
    <img
      src={checkCache.get(size)!}
      className={`inline-block ${className || ''}`}
      width={w * size}
      height={h * size}
      style={{ imageRendering: 'pixelated', ...style }}
      alt="✓"
    />
  );
};
