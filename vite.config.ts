import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import postcssNest from 'postcss-nesting';
import postcssPresetEnv from 'postcss-preset-env';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'util', 'stream'],
    }),
  ],
  // base: '/front/',
  server: { port: 5007 },
  css: {
    modules: {
      generateScopedName: '[local]-[hash:base64:5]',
      localsConvention: 'dashes',
    },
    postcss: {
      plugins: [
        postcssNest(),
        postcssPresetEnv({
          stage: 3,
          autoprefixer: {
            flexbox: 'no-2009',
          },
        }),
      ],
    },
  },
  resolve: {
    alias: {
      '@assets': resolve(__dirname, 'src/assets'),
      '@features': resolve(__dirname, 'src/features'),
      '@configs': resolve(__dirname, 'src/configs'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
    },
  },
});
