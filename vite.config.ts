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
        srcDir: '.',                  // service-worker.ts lives here
        filename: 'service-worker.js',  // final output
        strategies: 'injectManifest',   // use custom service worker
        injectRegister: 'auto',
        src: 'service-worker.ts',       // entry file
        includeAssets: ['favicon.svg', 'robots.txt'],
        manifest: {
          name: 'AniGloK',
          short_name: 'AniGloK',
          description: 'Offline-ready Anime streaming app',
          theme_color: '#ffffff',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
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
        '@': path.resolve(__dirname, '.')
      }
    }
  };
});
