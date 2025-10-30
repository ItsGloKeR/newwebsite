import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0'
    },
    plugins: [
      react(),
      VitePWA({
        srcDir: 'src',
        filename: 'service-worker.ts',
        strategies: 'injectManifest',
        injectRegister: null,
        includeAssets: ['favicon.svg', 'robots.txt'],
        manifest: {
          name: 'AniGloK',
          short_name: 'AniGloK',
          description: 'A modern anime streaming web application that allows users to watch their favorite anime from multiple sources.',
          start_url: '/',
          display: 'standalone',
          background_color: '#030712',
          theme_color: '#06b6d4',
          icons: [
            {
              "src": "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 32 32'%3e%3crect width='32' height='32' fill='%23030712'/%3e%3cpath d='M16 4L2 28H30L16 4Z' stroke='%2322d3ee' stroke-width='2.5' fill='none'/%3e%3cpath d='M16 15L11 23H21L16 15Z' fill='white'/%3e%3c/svg%3e",
              "type": "image/svg+xml",
              "sizes": "192x192"
            },
            {
              "src": "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 32 32'%3e%3crect width='32' height='32' fill='%23030712'/%3e%3cpath d='M16 4L2 28H30L16 4Z' stroke='%2322d3ee' stroke-width='2.5' fill='none'/%3e%3cpath d='M16 15L11 23H21L16 15Z' fill='white'/%3e%3c/svg%3e",
              "type": "image/svg+xml",
              "sizes": "512x512"
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve('.')
      }
    }
  };
});