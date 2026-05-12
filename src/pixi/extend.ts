/**
 * PixiJS 组件注册表
 * @pixi/react 要求先用 extend() 注册后才能在 JSX 中使用
 * 在应用入口尽早调用
 */
import { extend } from '@pixi/react';
import {
  Container,
  Graphics,
  Sprite,
  Text,
  AnimatedSprite,
  TilingSprite,
  NineSliceSprite,
  Texture,
} from 'pixi.js';

// 注册后可以在 JSX 中使用 <pixiContainer>, <pixiGraphics>, <pixiSprite> 等
extend({
  Container,
  Graphics,
  Sprite,
  Text,
  AnimatedSprite,
  TilingSprite,
  NineSliceSprite,
});

// 导出常用类型方便其他文件使用
export { Texture };
