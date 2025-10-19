// service-worker.js

// Cache versions. Increment to force updates.
const STATIC_CACHE_VERSION = 'v3';
const API_STATIC_CACHE_VERSION = 'api-static-v2'; // Incremented due to duration change
const API_DYNAMIC_CACHE_VERSION = 'api-dynamic-v1';

const STATIC_CACHE_NAME = `static-cache-${STATIC_CACHE_VERSION}`;
const API_STATIC_CACHE_NAME = `api-cache-static-${API_STATIC_CACHE_VERSION}`;
const API_DYNAMIC_CACHE_NAME = `api-cache-dynamic-${API_DYNAMIC_CACHE_VERSION}`;

// A list of all the files that make up the "app shell"
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/index.tsx', // Cache the main application script
];

const API_URL_PREFIXES = [
  'https://graphql.anilist.co',
  'https://graphql.consumet.org',
];

// Cache Durations
const STATIC_DATA_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const DYNAMIC_DATA_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

// On install, pre-cache the app shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Pre-caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// On activate, clean up old caches and take control.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that are not the current ones
          const isOldCache = ![STATIC_CACHE_NAME, API_STATIC_CACHE_NAME, API_DYNAMIC_CACHE_NAME].includes(cacheName);
          if (isOldCache) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Handle API requests with a specific caching strategy.
  if (request.method === 'POST' && API_URL_PREFIXES.some(prefix => request.url.startsWith(prefix))) {
    event.respondWith(handleApiRequest(event));
    return;
  }

  // For all other GET requests (app shell, scripts, etc.), use a cache-first strategy.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // If we have a match in the cache, return it.
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise, fetch from the network.
      return fetch(request);
    })
  );
});

async function getRequestPayload(request) {
    try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        return body;
    } catch (e) {
        return null;
    }
}

function categorizeRequest(payload) {
    if (!payload || !payload.query) {
        return { type: 'no-cache' };
    }
    const query = payload.query;

    // Static data queries: details, genres, multi-details, search/discover results
    if (query.includes('Media(id:') || query.includes('GenreCollection') || query.includes('id_in: $ids') || query.includes('search: $search,')) {
        return { type: 'static', cacheName: API_STATIC_CACHE_NAME, maxAge: STATIC_DATA_MAX_AGE_MS };
    }
    
    // Dynamic data queries: homepage carousels, airing schedules, search suggestions
    if (query.includes('trending:') || query.includes('airingSchedules') || query.includes('search: $search')) {
        return { type: 'dynamic', cacheName: API_DYNAMIC_CACHE_NAME, maxAge: DYNAMIC_DATA_MAX_AGE_MS };
    }
    
    // Default to dynamic for safety
    return { type: 'dynamic', cacheName: API_DYNAMIC_CACHE_NAME, maxAge: DYNAMIC_DATA_MAX_AGE_MS };
}

async function handleApiRequest(event) {
  const payload = await getRequestPayload(event.request);
  const category = categorizeRequest(payload);

  if (category.type === 'no-cache') {
    return fetch(event.request);
  }

  const { cacheName, maxAge } = category;

  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);

    if (cachedResponse) {
      const timestampHeader = cachedResponse.headers.get('X-Cache-Timestamp');
      if (timestampHeader) {
        const cacheTimestamp = parseInt(timestampHeader, 10);
        const age = Date.now() - cacheTimestamp;
        // If the cache is fresh, return it immediately.
        if (age < maxAge) {
          return cachedResponse;
        }
      }
    }

    // If no cache or cache is stale, fetch from the network.
    const networkResponse = await fetch(event.request.clone());

    // Create a new response to add our custom header and cache it.
    if (networkResponse.ok) {
      const responseToCache = await cloneResponse(networkResponse);
      await cache.put(event.request, responseToCache);
    }

    return networkResponse;

  } catch (error) {
    // Network failed. Try to serve from cache, even if stale.
    console.error('Network request failed. Trying cache.', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cache and network fails, return a basic error response.
    return new Response(JSON.stringify({ error: 'Offline and no data in cache.' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Clones a response and adds a timestamp header.
 * Reading the body of a response consumes it, so we need to clone it first
 * and then create a new response with the body and new headers.
 */
async function cloneResponse(response) {
  const body = await response.blob();
  const headers = new Headers(response.headers);
  headers.set('X-Cache-Timestamp', String(Date.now()));

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}
