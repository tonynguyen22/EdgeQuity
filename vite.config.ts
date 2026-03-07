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
      'process.env.FMP_API_KEY': JSON.stringify(env.FMP_API_KEY),
      'process.env.API_NINJAS_KEY': JSON.stringify(env.API_NINJAS_KEY),
      'process.env.MASSIVE_API_KEY': JSON.stringify(env.MASSIVE_API_KEY),
      'process.env.POLYGON_API_KEY': JSON.stringify(env.POLYGON_API_KEY),
      'process.env.TWELVE_API_KEY': JSON.stringify(env.TWELVE_API_KEY),
      'process.env.ALPHAVANTAGE_API_KEY': JSON.stringify(env.ALPHAVANTAGE_API_KEY),
      'process.env.TAAPI_API_KEY': JSON.stringify(env.TAAPI_API_KEY),
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
