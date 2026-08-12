/* EARTH.ONLINE mobile app shell — versioned, same-origin static cache only. */
'use strict';

const CACHE_VERSION = 'eo-mobile-20260812-cat2';
const CORE_CACHE = `${CACHE_VERSION}-core`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const CORE_ASSETS = [
  './offline.html',
  './assets/app-icon-192.png',
  './assets/logo-earth.webp',
  './assets/style.css?v=ER20260713r20',
  './assets/mobile.css?v=20260716legal2',
  './assets/theme-boot.js?v=ER20260717site13',
  './assets/site-theme.css?v=ER20260717site13',
  './assets/site-theme.js?v=ER20260717site13',
  './assets/mobile-shell.js?v=ER20260812cat2',
  './assets/session.js?v=ER20260717site13',
  './assets/challenge.js?v=ER20260713r19'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('eo-mobile-') && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      ))
      .then(async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(async (key) => {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          await Promise.all(requests
            .filter((request) => /^\/admin(?:\.html|\/|$)|^\/admin-console(?:\/|$)/i.test(new URL(request.url).pathname))
            .map((request) => cache.delete(request)));
        }));
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (/^\/admin(?:\.html|\/|$)|^\/admin-console(?:\/|$)/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.pathname.startsWith('/assets/') && url.searchParams.has('v')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});

async function networkFirstPage(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return (await caches.match('./offline.html'));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch:false });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
      await trimCache(cache, 180);
    }
    return response;
  } catch (error) {
    return Response.error();
  }
}

async function staleWhileRevalidate(request, fetchEvent) {
  const cached = await caches.match(request, { ignoreSearch: false });
  const network = fetch(request).then(async (response) => {
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
      await trimCache(cache, 180);
    }
    return response;
  }).catch(() => null);

  if (cached) {
    fetchEvent.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}
