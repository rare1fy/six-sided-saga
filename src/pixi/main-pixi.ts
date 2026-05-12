/**
 * 纯 PixiJS 入口 — 不依赖 React/DOM
 */
// ⚠️ 必须在其他 pixi 导入之前加载 unsafe-eval 补丁
// 微信小游戏禁止 eval/new Function，此模块提供替代实现
import 'pixi.js/unsafe-eval';

import { GameApp } from './GameApp';

const gameApp = new GameApp();
gameApp.init();

// 暴露到全局方便调试
(globalThis as any).__gameApp = gameApp;
