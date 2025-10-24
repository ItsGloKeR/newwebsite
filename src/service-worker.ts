/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { WorkboxPlugin } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// This will be injected by vite-plugin-pwa, and includes index.html, JS, and CSS assets.
precacheAndRoute((self as any).__WB_MANIFEST || []);

// Clean up old caches from previous versions of workbox.
cleanupOutdatedCaches();

// --- Custom Plugins ---

// A plugin to create a unique cache key for GraphQL POST requests based on their body.
const graphqlPostCacheKeyPlugin: WorkboxPlugin = {
  cacheKeyWillBeUsed: async ({ request }) => {
    try {
      // Clone the request to safely read its body.
      const body = await request.clone().json();
      // Create a stable, unique cache key by combining the URL and the request body content.
      // This ensures different GraphQL queries to the same endpoint are cached separately.
      const bodyString = JSON.stringify(body);
      return `${request.url}-${bodyString}`;
    } catch (e) {
      // If body is not JSON or is empty, use the original URL as the key.
      return request.url;
    }
  }
};


// --- Caching Strategies ---

// Images - CacheFirst strategy. Serve from cache if available, otherwise fetch from network.
// Good for static assets like posters that don't change often.
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200, // Store up to 200 images
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache opaque responses (e.g., from CORS)
      }),
    ],
  })
);

// Google Fonts - StaleWhileRevalidate. Serve from cache immediately and update in the background.
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

// AniList API (POST requests) - NetworkFirst. Prioritize fresh data, but fallback to cache for offline.
registerRoute(
    ({ url }) => (url.origin === 'https://graphql.anilist.co' || url.origin === 'https://graphql.consumet.org'),
    new NetworkFirst({
        cacheName: 'api-dynamic-cache-v2', // Incremented version for new strategy
        networkTimeoutSeconds: 5, // Fallback to cache if network takes too long
        plugins: [
            // Use the custom plugin to generate a unique cache key from the POST body
            graphqlPostCacheKeyPlugin,
            new ExpirationPlugin({
                maxEntries: 50, // Cache up to 50 different API responses
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

// Handle navigation requests for the SPA by serving the precached index.html.
// This ensures that any deep link to the app will work offline.
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);


self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
});
