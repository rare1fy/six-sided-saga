/**
 * build-minigame.cjs — 打包 PixiJS 游戏为微信小游戏 bundle
 * 
 * 用法: node build-minigame.cjs
 * 输出: minigame/game-bundle.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 构建微信小游戏 bundle...');

// 用 vite build 打包，指定入口为 pixi/main-pixi.ts
// 输出为 IIFE 格式的单文件
const buildCmd = [
  'npx vite build',
  '--config vite.config.minigame.ts',
].join(' ');

try {
  execSync(buildCmd, { stdio: 'inherit', cwd: __dirname });
} catch (e) {
  console.error('构建失败，尝试直接使用 esbuild...');
  // fallback: 用 esbuild 直接打包
  const esbuildCmd = [
    'npx esbuild',
    'src/pixi/main-pixi.ts',
    '--bundle',
    '--format=iife',
    '--platform=browser',
    '--target=es2020',
    '--outfile=minigame/game-bundle.js',
    '--external:react',
    '--external:react-dom',
    '--external:motion',
    '--alias:react=./src/pixi/shims/react-shim.ts',
  ].join(' ');
  execSync(esbuildCmd, { stdio: 'inherit', cwd: __dirname });
}

console.log('✅ 构建完成: minigame/game-bundle.js');
console.log('📱 用微信开发者工具打开 minigame/ 目录即可测试');
