/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// This will be injected by vite-plugin-pwa
precacheAndRoute((self as any).__WB_MANIFEST || []);

// Clean up old caches from previous versions of workbox
cleanupOutdatedCaches();

// --- Caching Strategies ---

// Images - CacheFirst. Fast, good for static assets.
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100, // Store up to 100 images
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache opaque responses (e.g. from CORS)
      }),
    ],
  })
);

// Google Fonts - StaleWhileRevalidate. Good for assets that update infrequently.
registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    new StaleWhileRevalidate({
        cacheName: 'google-fonts-cache-v1',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
            }),
             new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
    })
);

// AniList API (POST requests) - NetworkFirst. Important data, try network first.
registerRoute(
    ({ url }) => (url.origin === 'https://graphql.anilist.co' || url.origin === 'https://graphql.consumet.org'),
    new NetworkFirst({
        cacheName: 'api-dynamic-cache-v1',
        networkTimeoutSeconds: 5, // Fallback to cache after 5s
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: 24 * 60 * 60, // Keep API data for 1 day
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    }),
    'POST'
);

// Zenshin API (GET requests) - StaleWhileRevalidate.
registerRoute(
  ({ url }) => url.origin === 'https://zenshin-supabase-api.onrender.com' || url.origin === 'https://zenshin-supabase-api-myig.onrender.com',
  new StaleWhileRevalidate({
    cacheName: 'api-static-cache-v3',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Handle navigation requests for the SPA (Single Page Application)
// Fallback to /index.html
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
});
