/**
 * ForestBackground — 森林战斗背景场景 (PixiJS 版)
 * 替代原 ForestBattleScene.tsx (SVG)
 */
import { useCallback } from 'react';
import { useTick } from '@pixi/react';
import { useState } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';

interface ForestBackgroundProps {
  width: number;
  height: number;
}

export function ForestBackground({ width, height }: ForestBackgroundProps) {
  const [time, setTime] = useState(0);
  useTick(useCallback(() => setTime((t) => t + 0.016), []));

  /** 天空 + 地面 + 远山 */
  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // 天空渐变（从深蓝到深绿）
      g.rect(0, 0, width, height * 0.55);
      g.fill({ color: 0x0a1a0a });

      // 远处天际线微光
      g.rect(0, height * 0.3, width, height * 0.05);
      g.fill({ color: 0x1a2a15 });

      // 地面
      g.rect(0, height * 0.55, width, height * 0.45);
      g.fill({ color: 0x1a1410 });

      // 走廊地面线条（透视感）
      const centerX = width / 2;
      const horizon = height * 0.35;
      for (let i = 0; i < 15; i++) {
        const y = horizon + i * (height * 0.55 - horizon) / 15;
        const spread = ((y - horizon) / (height - horizon)) * width * 0.5;
        g.moveTo(centerX - spread, y);
        g.lineTo(centerX + spread, y);
        g.stroke({ color: 0x2a2418, width: 1 });
      }
      // 纵线
      for (let i = -3; i <= 3; i++) {
        g.moveTo(centerX + i * 5, horizon);
        g.lineTo(centerX + i * width * 0.15, height);
        g.stroke({ color: 0x221a12, width: 1 });
      }
    },
    [width, height],
  );

  /** 远山剪影 */
  const drawMountains = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const horizon = height * 0.35;
      // 第一层山（远）
      g.moveTo(0, horizon);
      for (let x = 0; x <= width; x += 30) {
        const h = Math.sin(x * 0.008) * 40 + Math.sin(x * 0.015) * 25 + 20;
        g.lineTo(x, horizon - h);
      }
      g.lineTo(width, horizon);
      g.fill({ color: 0x0f1a0c });

      // 第二层山（近，稍高）
      g.moveTo(0, horizon);
      for (let x = 0; x <= width; x += 20) {
        const h = Math.sin(x * 0.012 + 1) * 30 + Math.sin(x * 0.02 + 2) * 20 + 10;
        g.lineTo(x, horizon - h);
      }
      g.lineTo(width, horizon);
      g.fill({ color: 0x152210 });
    },
    [width, height],
  );

  /** 树影 */
  const drawTrees = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const horizon = height * 0.35;
      const treePositions = [0.05, 0.12, 0.22, 0.78, 0.88, 0.95];
      for (const tx of treePositions) {
        const x = width * tx;
        const h = 60 + Math.sin(tx * 20) * 20;
        // 树干
        g.rect(x - 3, horizon - h * 0.3, 6, h * 0.3);
        g.fill({ color: 0x1a1208 });
        // 树冠（三角形叠加）
        for (let j = 0; j < 3; j++) {
          const y = horizon - h * 0.3 - j * 18;
          const w = 25 - j * 5;
          g.moveTo(x, y - 22);
          g.lineTo(x - w, y);
          g.lineTo(x + w, y);
          g.closePath();
          g.fill({ color: 0x0a1a08 });
        }
      }
    },
    [width, height],
  );

  /** 星星闪烁 */
  const drawStars = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const stars = [
        [0.1, 0.08], [0.25, 0.15], [0.4, 0.05], [0.55, 0.12],
        [0.7, 0.07], [0.85, 0.18], [0.15, 0.22], [0.6, 0.2],
        [0.33, 0.25], [0.9, 0.1],
      ];
      for (const [sx, sy] of stars) {
        const alpha = 0.3 + Math.sin(time * 2 + sx * 10) * 0.3;
        const size = 1 + Math.sin(time * 3 + sy * 15) * 0.5;
        g.circle(width * sx, height * sy, size);
        g.fill({ color: 0xffffff, alpha });
      }
    },
    [width, height, time],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBg} />
      <pixiGraphics draw={drawMountains} />
      <pixiGraphics draw={drawTrees} />
      <pixiGraphics draw={drawStars} />
    </pixiContainer>
  );
}
