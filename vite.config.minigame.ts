import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/pixi/main-pixi.ts'),
      formats: ['iife'],
      name: 'SixSidedSaga',
      fileName: () => 'game-bundle.js',
    },
    outDir: 'minigame',
    emptyOutDir: false,
    minify: 'terser',
    rollupOptions: {
      // 不排除任何依赖，全部打包进来
      external: [],
      output: {
        // 确保输出为单文件
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(''),
  },
});
