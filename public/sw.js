/**
 * Service Worker для "Планета здоровой кожи"
 * Стратегии кеширования:
 * - HTML: Network-first (сеть приоритетна, кеш как fallback)
 * - Assets (JS/CSS/шрифты/SVG): Cache-first (быстрая загрузка)
 * - Изображения: Stale-while-revalidate (быстро + обновление в фоне)
 * 
 * Версия генерируется автоматически на основе даты билда
 */

// Автоматическая версия: ГГММДД (обновляется при каждом деплое)
const BUILD_DATE = '20260121'; // Обновляется скриптом при билде
const CACHE_VERSION = `pzk-sw-v${BUILD_DATE}`;
const PAGES_CACHE = `${CACHE_VERSION}:pages`;
const ASSETS_CACHE = `${CACHE_VERSION}:assets`;
const IMAGES_CACHE = `${CACHE_VERSION}:images`;

// Лимит записей в кеше изображений
const IMAGES_CACHE_LIMIT = 80;

// Файлы для предварительного кеширования при установке
const PRECACHE_ASSETS = [
  '/offline.html',
  '/img/icons.svg',
  '/favicon.svg'
];

// === INSTALL ===
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(ASSETS_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installed, waiting for activation');
        // НЕ вызываем skipWaiting() автоматически — ждём сигнала от клиента
      })
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

// === ACTIVATE ===
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !name.startsWith(CACHE_VERSION))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// === MESSAGE (для контролируемого обновления) ===
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING, activating now');
    self.skipWaiting();
  }
});

// === FETCH ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Игнорируем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Игнорируем внешние домены (только same-origin)
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Игнорируем запросы к dev-серверу Vite
  if (url.pathname.startsWith('/@') || url.pathname.includes('__vite')) {
    return;
  }
  
  // Определяем тип запроса и применяем соответствующую стратегию
  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstStrategy(request, PAGES_CACHE));
  } else if (isAssetRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, ASSETS_CACHE));
  } else if (isImageRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(request, IMAGES_CACHE));
  }
  // Остальные запросы идут напрямую в сеть без кеширования
});

// === HELPERS ===

/**
 * Проверяет, является ли запрос навигационным (HTML страница)
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.headers.get('Accept') || '').includes('text/html');
}

/**
 * Проверяет, является ли запрос статическим ассетом
 */
function isAssetRequest(url) {
  const pathname = url.pathname;
  
  // Файлы из /assets/ (сборка Vite)
  if (pathname.startsWith('/assets/')) {
    return true;
  }
  
  // Шрифты
  if (pathname.startsWith('/fonts/') || pathname.endsWith('.woff2') || pathname.endsWith('.woff')) {
    return true;
  }
  
  // CSS/JS файлы
  if (pathname.endsWith('.css') || pathname.endsWith('.js')) {
    return true;
  }
  
  // SVG иконки (кроме изображений)
  if (pathname.endsWith('.svg')) {
    return true;
  }
  
  return false;
}

/**
 * Проверяет, является ли запрос изображением
 */
function isImageRequest(url) {
  const pathname = url.pathname.toLowerCase();
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico'];
  
  return imageExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Ограничивает размер кеша, удаляя старые записи
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    console.log(`[SW] Trimming ${cacheName}: removing ${deleteCount} old entries`);
    
    // Удаляем самые старые (первые в списке)
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// === СТРАТЕГИИ КЕШИРОВАНИЯ ===

/**
 * Network-first: сначала сеть, при ошибке - кеш, при отсутствии - offline.html
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    // Кешируем только успешные ответы
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Ищем в конкретном кеше, а не глобально
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Если нет в кеше - показываем офлайн страницу
    console.log('[SW] No cache, returning offline page');
    const assetsCache = await caches.open(ASSETS_CACHE);
    return assetsCache.match('/offline.html');
  }
}

/**
 * Cache-first: сначала кеш, при отсутствии - сеть и кеширование
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  // Ищем в конкретном кеше
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', request.url);
    return new Response('Asset not available', { status: 503 });
  }
}

/**
 * Stale-while-revalidate: возвращаем из кеша сразу, обновляем в фоне
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Запускаем обновление в фоне
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        // Ограничиваем размер кеша изображений
        trimCache(cacheName, IMAGES_CACHE_LIMIT);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Background fetch failed:', request.url);
      return null;
    });
  
  // Возвращаем кеш сразу, если есть
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Если кеша нет - ждём сеть
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // Fallback для изображений
  return new Response('', { status: 503 });
}
