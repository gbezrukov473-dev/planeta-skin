/**
 * Service Worker для "Планета здоровой кожи".
 *
 * Стратегии:
 *  - HTML: network-first (сеть приоритетна, кеш как fallback, офлайн-страница)
 *  - Статика (JS/CSS/шрифты/SVG): cache-first
 *  - Картинки: stale-while-revalidate с ограничением размера кеша
 *
 * Версия (__BUILD_VERSION__) подставляется vite-plugin-deploy при сборке.
 * Scope/base берется из registration.scope — не захардкожено в код.
 */

const BUILD_VERSION = '__BUILD_VERSION__';
const CACHE_VERSION = `pzk-sw-v${BUILD_VERSION}`;
const PAGES_CACHE = `${CACHE_VERSION}:pages`;
const ASSETS_CACHE = `${CACHE_VERSION}:assets`;
const IMAGES_CACHE = `${CACHE_VERSION}:images`;

const IMAGES_CACHE_LIMIT = 200;

// scope SW — префикс всех ресурсов, включая офлайн-страницу
const SCOPE = new URL(self.registration ? self.registration.scope : self.location.href).pathname;

const PRECACHE_ASSETS = [
  `${SCOPE}offline.html`,
  `${SCOPE}img/icons.svg`,
  `${SCOPE}favicon.svg`,
];

// === INSTALL ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
    )
  );
});

// === ACTIVATE ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith('pzk-sw-v') && !name.startsWith(CACHE_VERSION))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// === MESSAGE ===
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// === FETCH ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/@') || url.pathname.includes('__vite')) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstStrategy(request, PAGES_CACHE));
  } else if (isAssetRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, ASSETS_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(request, IMAGES_CACHE));
  }
});

// === HELPERS ===

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.headers.get('Accept') || '').includes('text/html');
}

function isAssetRequest(url) {
  const pathname = url.pathname;
  if (pathname.includes('/assets/')) return true;
  if (pathname.includes('/fonts/') || pathname.endsWith('.woff2') || pathname.endsWith('.woff')) return true;
  if (pathname.endsWith('.css') || pathname.endsWith('.js')) return true;
  if (pathname.endsWith('.svg')) return true;
  return false;
}

function isImageRequest(url) {
  const p = url.pathname.toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico'].some((ext) => p.endsWith(ext));
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// === СТРАТЕГИИ ===

async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const assetsCache = await caches.open(ASSETS_CACHE);
    const offline = await assetsCache.match(`${SCOPE}offline.html`);
    return offline || new Response('Offline', { status: 503 });
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return new Response('Asset not available', { status: 503 });
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        trimCache(cacheName, IMAGES_CACHE_LIMIT);
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;
  const response = await fetchPromise;
  return response || new Response('', { status: 503 });
}
