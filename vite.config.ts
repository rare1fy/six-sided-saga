import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isSingleFile = mode === 'singlefile';
  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isSingleFile ? [viteSingleFile({ removeViteModuleLoader: true })] : []),
    ],
    base: './',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      ...(isSingleFile
        ? {
            assetsInlineLimit: 409600,
            cssCodeSplit: false,
            rollupOptions: {
              output: { inlineDynamicImports: true },
              external: (id) => /\.(woff2|woff|ttf|otf|eot)$/i.test(id),
            },
          }
        : {}),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
