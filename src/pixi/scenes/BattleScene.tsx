/**
 * BattleScene — 战斗场景 (PixiJS 版)
 * 替代原 BattleSceneView.tsx + EnemyStageView.tsx 的渲染部分
 * 
 * 从现有 Context 读取战斗数据 → 渲染 PixiJS 场景
 */
import { useApplication } from '@pixi/react';
import { useCallback, useState } from 'react';
import { useTick } from '@pixi/react';
import { ForestBackground } from './ForestBackground';
import { PixelSpriteRenderer } from '../PixelSpriteRenderer';
import type { Graphics as PixiGraphics } from 'pixi.js';

/** 临时演示用的敌人数据 —— 后续接入 BattleContext */
const DEMO_GOBLIN_SPRITE: string[][] = (() => {
  // 简化的哥布林像素画 (16x16)
  const _ = '';
  const G = '#338833'; // 绿色皮肤
  const g = '#55bb55'; // 亮绿
  const R = '#ff2200'; // 红色眼睛
  const B = '#3a2a1a'; // 棕色
  const W = '#ddddaa'; // 牙齿
  return [
    [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_],
    [_,_,_,_,G,g,g,g,g,g,g,G,_,_,_,_],
    [_,_,_,G,g,g,g,g,g,g,g,g,G,_,_,_],
    [_,G,G,g,g,R,R,g,g,R,R,g,g,G,G,_],
    [_,G,g,g,g,R,R,g,g,R,R,g,g,g,G,_],
    [_,_,G,g,g,g,g,g,g,g,g,g,g,G,_,_],
    [_,_,_,G,g,g,W,g,g,W,g,g,G,_,_,_],
    [_,_,_,G,G,g,g,g,g,g,g,G,G,_,_,_],
    [_,_,_,_,G,G,G,G,G,G,G,G,_,_,_,_],
    [_,_,_,_,_,G,G,G,G,G,G,_,_,_,_,_],
    [_,_,_,B,B,G,G,G,G,G,G,B,B,_,_,_],
    [_,_,_,B,_,G,G,G,G,G,G,_,B,_,_,_],
    [_,_,_,B,_,G,_,_,_,_,G,_,B,_,_,_],
    [_,_,_,_,_,B,_,_,_,_,B,_,_,_,_,_],
    [_,_,_,_,_,B,B,_,_,B,B,_,_,_,_,_],
    [_,_,_,_,_,B,B,_,_,B,B,_,_,_,_,_],
  ];
})();

interface BattleSceneProps {
  width: number;
  height: number;
}

export function BattleScene({ width, height }: BattleSceneProps) {
  const [time, setTime] = useState(0);
  useTick(useCallback(() => setTime((t) => t + 0.016), []));

  // 敌人浮动动画
  const enemyY = height * 0.28 + Math.sin(time * 2) * 4;
  // 像素画居中
  const spriteWidth = 16 * 4; // 16像素 × 4倍放大
  const enemyX = (width - spriteWidth) / 2;

  /** 敌人名字 + 血条 */
  const drawEnemyUI = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const cx = width / 2;
      const barY = enemyY - 12;
      const barW = 80;
      const barH = 6;

      // 血条背景
      g.roundRect(cx - barW / 2, barY, barW, barH, 2);
      g.fill({ color: 0x220000 });
      // 血条
      g.roundRect(cx - barW / 2 + 1, barY + 1, barW - 2, barH - 2, 1);
      g.fill({ color: 0xcc2200 });

      // 橙色选中边框
      g.roundRect(
        enemyX - 6,
        enemyY - 6,
        spriteWidth + 12,
        16 * 4 + 12,
        4,
      );
      g.stroke({ color: 0xff6600, width: 2, alpha: 0.6 });
    },
    [width, enemyY, enemyX, spriteWidth],
  );

  return (
    <pixiContainer>
      {/* 背景 */}
      <ForestBackground width={width} height={height * 0.58} />

      {/* 敌人像素画 */}
      <PixelSpriteRenderer
        data={DEMO_GOBLIN_SPRITE}
        pixelSize={4}
        x={enemyX}
        y={enemyY}
      />

      {/* 敌人UI（血条/边框） */}
      <pixiGraphics draw={drawEnemyUI} />

      {/* 敌人名字（PixiJS Text） */}
      <pixiText
        text="食尸鬼"
        x={width / 2}
        y={enemyY - 28}
        anchor={0.5}
        style={{
          fontSize: 14,
          fill: 0x44ff44,
          fontFamily: 'Microsoft YaHei',
          fontWeight: 'bold',
          dropShadow: {
            alpha: 0.8,
            angle: Math.PI / 2,
            blur: 2,
            color: 0x000000,
            distance: 1,
          },
        }}
      />
    </pixiContainer>
  );
}
