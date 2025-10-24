/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

// Precache all build assets injected by Vite
precacheAndRoute(self.__WB_MANIFEST);

// Cache versions
const STATIC_CACHE_NAME = 'static-cache-v4';
const API_STATIC_CACHE_NAME = 'api-cache-static-v3';
const API_DYNAMIC_CACHE_NAME = 'api-cache-dynamic-v1';
const IMAGE_CACHE_NAME = 'images-v1';

// App shell
const APP_SHELL_URLS = ['/', '/index.html', '/manifest.json'];

// API prefixes
const ANILIST_API_PREFIXES = [
  'https://graphql.anilist.co',
  'https://graphql.consumet.org',
];
const ZENSHIN_API_PREFIXES = [
  'https://zenshin-supabase-api.onrender.com',
  'https://zenshin-supabase-api-myig.onrender.com',
];

// Cache durations
const STATIC_DATA_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
const DYNAMIC_DATA_MAX_AGE_MS = 30 * 60 * 1000; // 30min

// --- Install ---
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// --- Activate ---
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (![STATIC_CACHE_NAME, API_STATIC_CACHE_NAME, API_DYNAMIC_CACHE_NAME, IMAGE_CACHE_NAME].includes(key)) {
            return caches.delete(key);
          }
          return null;
        })
      )
    ).then(() => self.clients.claim())
  );
});

// --- Fetch ---
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  if (request.method === 'POST' && ANILIST_API_PREFIXES.some(prefix => request.url.startsWith(prefix))) {
    event.respondWith(handleApiPostRequest(event));
    return;
  }

  if (request.method === 'GET' && ZENSHIN_API_PREFIXES.some(prefix => request.url.startsWith(prefix))) {
    event.respondWith(handleStaticGetApiRequest(event, API_STATIC_CACHE_NAME, STATIC_DATA_MAX_AGE_MS));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache =>
        cache.match(request).then(response => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        })
      )
    );
    return;
  }

  // Default cache-first for app shell and other assets
  event.respondWith(caches.match(request).then(res => res || fetch(request)));
});

// --- Helper Functions ---
async function getRequestPayload(request: Request): Promise<any> {
  try {
    return await request.clone().json();
  } catch {
    return null;
  }
}

function categorizeRequest(payload: any) {
  if (!payload || !payload.query) return { type: 'no-cache' };

  const query = payload.query;
  if (query.includes('Media(id:') || query.includes('GenreCollection') || query.includes('id_in: $ids') || query.includes('search: $search,')) {
    return { type: 'static', cacheName: API_STATIC_CACHE_NAME, maxAge: STATIC_DATA_MAX_AGE_MS };
  }
  if (query.includes('trending:') || query.includes('airingSchedules') || query.includes('search: $search')) {
    return { type: 'dynamic', cacheName: API_DYNAMIC_CACHE_NAME, maxAge: DYNAMIC_DATA_MAX_AGE_MS };
  }
  return { type: 'dynamic', cacheName: API_DYNAMIC_CACHE_NAME, maxAge: DYNAMIC_DATA_MAX_AGE_MS };
}

async function handleApiPostRequest(event: FetchEvent): Promise<Response> {
  const payload = await getRequestPayload(event.request);
  const category = categorizeRequest(payload);
  if (category.type === 'no-cache') return fetch(event.request);

  const { cacheName, maxAge } = category;
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      const ts = cachedResponse.headers.get('X-Cache-Timestamp');
      if (ts && Date.now() - parseInt(ts, 10) < maxAge) return cachedResponse;
    }

    const networkResponse = await fetch(event.request.clone());
    if (networkResponse.ok) await cache.put(event.request, await cloneResponseWithTimestamp(networkResponse));
    return networkResponse;

  } catch {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) return cachedResponse;
    return new Response(JSON.stringify({ error: 'Offline and no cache.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleStaticGetApiRequest(event: FetchEvent, cacheName: string, maxAge: number): Promise<Response> {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      const ts = cachedResponse.headers.get('X-Cache-Timestamp');
      if (ts && Date.now() - parseInt(ts, 10) < maxAge) return cachedResponse;
    }

    const networkResponse = await fetch(event.request.clone());
    if (networkResponse.ok) await cache.put(event.request, await cloneResponseWithTimestamp(networkResponse));
    return networkResponse;

  } catch {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) return cachedResponse;
    return new Response(JSON.stringify({ error: 'Offline and no cache for GET.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

async function cloneResponseWithTimestamp(response: Response): Promise<Response> {
  const body = await response.blob();
  const headers = new Headers(response.headers);
  headers.set('X-Cache-Timestamp', String(Date.now()));
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}
