/**
 * PixelSpriteRenderer — 将像素画二维数组数据渲染为 PixiJS Graphics
 * 
 * 替代原项目的 PixelSprite.tsx (CSS box-shadow)
 * 输入格式不变：string[][] 二维数组，每个元素是 hex 颜色或 '' 表示透明
 */
import { useCallback } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';

interface PixelSpriteRendererProps {
  /** 像素数据：二维数组，每行每列对应一个像素的颜色 (hex string)，空串为透明 */
  data: string[][];
  /** 每个像素的大小 (px)，默认 2 */
  pixelSize?: number;
  /** x 坐标 */
  x?: number;
  /** y 坐标 */
  y?: number;
  /** 缩放 */
  scale?: number;
  /** 透明度 */
  alpha?: number;
}

export function PixelSpriteRenderer({
  data,
  pixelSize = 2,
  x = 0,
  y = 0,
  scale = 1,
  alpha = 1,
}: PixelSpriteRendererProps) {
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (let row = 0; row < data.length; row++) {
        const rowData = data[row];
        for (let col = 0; col < rowData.length; col++) {
          const color = rowData[col];
          if (!color) continue; // 透明像素
          const hexColor = color.startsWith('#')
            ? parseInt(color.slice(1), 16)
            : parseInt(color, 16);
          g.rect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
          g.fill({ color: hexColor });
        }
      }
    },
    [data, pixelSize],
  );

  return (
    <pixiGraphics
      draw={draw}
      x={x}
      y={y}
      scale={scale}
      alpha={alpha}
    />
  );
}
