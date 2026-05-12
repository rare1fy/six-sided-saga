import React from 'react';
import { RELIC_PIXEL_DATA, DEFAULT_ICON } from '../data/relicPixelData';

/**
 * 遗物专属像素图标 — 每个遗物按其效果设计独立的 7x7 像素图标
 * 使用与 PixelIcons.tsx 相同的 CSS box-shadow 绘制体系
 */

interface RelicIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const relicIconCache = new Map<string, string>();

const renderRelicToDataURL = (pixels: string[][], ps: number): string => {
  const w = pixels[0]?.length || 0;
  const h = pixels.length;
  const key = `relic_${w}x${h}@${ps}|${pixels.flat().filter(Boolean).join('')}`;
  const cached = relicIconCache.get(key);
  if (cached) return cached;

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
  const url = canvas.toDataURL();
  relicIconCache.set(key, url);
  return url;
};

const Base: React.FC<{ pixels: string[][]; ps: number; className?: string; style?: React.CSSProperties }> = ({ pixels, ps, className = '', style }) => {
  const w = pixels[0]?.length || 0;
  const h = pixels.length;
  const src = renderRelicToDataURL(pixels, ps);
  return (
    <img
      src={src}
      className={`inline-block ${className}`}
      width={w * ps}
      height={h * ps}
      style={{ imageRendering: 'pixelated', ...style }}
      alt=""
    />
  );
};

/** 通用遗物图标组件 — 传入 relicId 自动渲染对应像素图标 */
export const RelicPixelIcon: React.FC<RelicIconProps & { relicId: string }> = ({ relicId, size = 2, className, style }) => {
  const pixels = RELIC_PIXEL_DATA[relicId] || DEFAULT_ICON;
  return <Base pixels={pixels} ps={size} className={className} style={style} />;
};
