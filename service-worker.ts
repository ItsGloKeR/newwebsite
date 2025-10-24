/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// Cache versions. Increment to force updates.
const STATIC_CACHE_VERSION = 'v4';
const API_STATIC_CACHE_VERSION = 'api-static-v3';
const API_DYNAMIC_CACHE_VERSION = 'api-dynamic-v1';
const IMAGE_CACHE_VERSION = 'images-v1'; // For images

const STATIC_CACHE_NAME = `static-cache-${STATIC_CACHE_VERSION}`;
const API_STATIC_CACHE_NAME = `api-cache-static-${API_STATIC_CACHE_VERSION}`;
const API_DYNAMIC_CACHE_NAME = `api-cache-dynamic-${API_DYNAMIC_CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `image-cache-${IMAGE_CACHE_VERSION}`;


// A list of all the files that make up the "app shell"
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx', // Cache the main application script
];

const ANILIST_API_PREFIXES = [
  'https://graphql.anilist.co',
  'https://graphql.consumet.org',
];

const ZENSHIN_API_PREFIXES = [
  'https://zenshin-supabase-api.onrender.com',
  'https://zenshin-supabase-api-myig.onrender.com',
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
          const isOldCache = ![STATIC_CACHE_NAME, API_STATIC_CACHE_NAME, API_DYNAMIC_CACHE_NAME, IMAGE_CACHE_NAME].includes(cacheName);
          if (isOldCache) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Handle AniList POST requests
  if (request.method === 'POST' && ANILIST_API_PREFIXES.some(prefix => request.url.startsWith(prefix))) {
    event.respondWith(handleApiPostRequest(event));
    return;
  }
  
  // Handle Zenshin GET requests
  if (request.method === 'GET' && ZENSHIN_API_PREFIXES.some(prefix => request.url.startsWith(prefix))) {
    // Zenshin data is static, so we cache it for 24 hours.
    event.respondWith(handleStaticGetApiRequest(event, API_STATIC_CACHE_NAME, STATIC_DATA_MAX_AGE_MS));
    return;
  }

  // Handle image requests with a cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          // Return from cache if found, otherwise fetch from network
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // For all other GET requests (app shell, scripts, etc.), use a cache-first strategy.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request);
    })
  );
});

async function getRequestPayload(request: Request) {
    try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        return body;
    } catch (e) {
        return null;
    }
}

function categorizeRequest(payload: any) {
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

async function handleApiPostRequest(event: FetchEvent): Promise<Response> {
  const payload = await getRequestPayload(event.request);
  const category = categorizeRequest(payload);

  if (category.type === 'no-cache' || !category.cacheName || !category.maxAge) {
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

    const networkResponse = await fetch(event.request.clone());

    if (networkResponse.ok) {
      const responseToCache = await cloneResponseWithTimestamp(networkResponse);
      await cache.put(event.request, responseToCache);
    }

    return networkResponse;

  } catch (error) {
    console.error('Network request failed for POST API. Trying cache.', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(JSON.stringify({ error: 'Offline and no data in cache.' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleStaticGetApiRequest(event: FetchEvent, cacheName: string, maxAge: number): Promise<Response> {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);

    if (cachedResponse) {
      const timestampHeader = cachedResponse.headers.get('X-Cache-Timestamp');
      if (timestampHeader) {
        const cacheTimestamp = parseInt(timestampHeader, 10);
        const age = Date.now() - cacheTimestamp;
        if (age < maxAge) {
          return cachedResponse;
        }
      }
    }

    const networkResponse = await fetch(event.request.clone());
    if (networkResponse.ok) {
      const responseToCache = await cloneResponseWithTimestamp(networkResponse);
      await cache.put(event.request, responseToCache);
    }
    return networkResponse;

  } catch (error) {
    console.error('Network request failed for GET API. Trying cache.', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline and no data in cache for this GET request.' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cloneResponseWithTimestamp(response: Response): Promise<Response> {
  const body = await response.blob();
  const headers = new Headers(response.headers);
  headers.set('X-Cache-Timestamp', String(Date.now()));

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

export {};
