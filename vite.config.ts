import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const githubPages = process.env.GITHUB_PAGES === 'true';

  return {
    base: githubPages ? '/EdgeQuity/' : '/',
    plugins: [react(), tailwindcss()],
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
