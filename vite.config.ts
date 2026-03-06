import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.FINNHUB_API_KEY': JSON.stringify(env.FINNHUB_API_KEY),
      'process.env.EDGARTOOLS_API_URL': JSON.stringify(env.EDGARTOOLS_API_URL || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/sec-api': {
          target: 'https://www.sec.gov',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/sec-api/, ''),
        },
        '/edgar-search': {
          target: 'https://efts.sec.gov',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/edgar-search/, ''),
        },
        '/edgar-facts': {
          target: 'https://data.sec.gov',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/edgar-facts/, ''),
        },
      },
    },
  };
});
