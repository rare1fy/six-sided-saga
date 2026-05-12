/**
 * SixSidedSagaApp — 主应用入口
 * 
 * 架构：
 * - PixiJS Canvas 层：渲染游戏场景（背景、敌人、粒子等）
 * - DOM 叠加层：渲染 HUD UI（血条、骰子、按钮等）
 * 
 * 后续接入 GameContext / BattleContext 后，
 * 两个层都从同一个 Context 读状态，实现联动。
 */
import { useRef, useState, useEffect } from 'react';
import { Stage } from '@pixi/react';
// 注册 PixiJS 组件（必须在使用前调用）
import './pixi/extend';
import { BattleScene } from './pixi/scenes/BattleScene';
import { DemoHUD } from './ui/DemoHUD';

export function SixSidedSagaApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 1280 });

  useEffect(() => {
    const updateSize = () => {
      // 竖屏游戏：宽度固定 720，高度按比例
      const w = Math.min(window.innerWidth, 720);
      const h = window.innerHeight;
      setSize({ width: w, height: h });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: size.width,
        height: size.height,
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* PixiJS Canvas 层 */}
      <Stage
        width={size.width}
        height={size.height}
        options={{
          backgroundColor: 0x0a0a0a,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio, 2),
          autoDensity: true,
        }}
      >
        <BattleScene width={size.width} height={size.height} />
      </Stage>

      {/* DOM HUD 叠加层（覆盖在 Canvas 上方） */}
      <DemoHUD width={size.width} height={size.height} />
    </div>
  );
}
