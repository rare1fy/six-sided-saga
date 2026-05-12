import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isSingleFile = mode === 'singlefile';
  return {
    plugins: [
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
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        external: ['react', 'react/jsx-runtime'],
        ...(isSingleFile
          ? {
              output: { inlineDynamicImports: true },
              external: (id: string) => /\.(woff2|woff|ttf|otf|eot)$/i.test(id),
            }
          : {}),
      },
      ...(isSingleFile
        ? {
            assetsInlineLimit: 409600,
            cssCodeSplit: false,
          }
        : {}),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});


