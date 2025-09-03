// Service Worker for Performance Optimization - 推し活コレクション
const CACHE_NAME = 'oshikatsu-collection-v2';
const STATIC_CACHE_NAME = 'static-v2';
const API_CACHE_NAME = 'api-v2';
const IMAGE_CACHE_NAME = 'images-v2';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// インストールイベント
self.addEventListener('install', (event) => {
  console.log('[SW] Installing optimized service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
  );
});

// アクティベートイベント
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating optimized service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes('v2')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// フェッチイベント（最適化されたキャッシュ戦略）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // HTMLページ: Network First
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静的アセット: Cache First
  if (request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // 画像: Cache First with Network Fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME));
    return;
  }

  // API: Stale While Revalidate
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME));
    return;
  }

  // YouTube画像: Cache First (長期キャッシュ)
  if (url.hostname.includes('img.youtube.com')) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME));
    return;
  }

  // その他: Network First
  event.respondWith(networkFirst(request));
});

// Network First戦略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Cache First戦略
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    // ✅ キャッシュ可能な条件をチェック
    if (networkResponse.ok && 
        networkResponse.status === 200 && // 完全なレスポンスのみ
        request.method === 'GET') {       // GET リクエストのみ
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, networkResponse.clone());
      } catch (error) {
        console.log('[SW] Cache first put failed (non-critical):', error.message);
      }
    }
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available', { status: 503 });
  }
}

// Stale While Revalidate戦略
async function staleWhileRevalidate(request, cacheName = CACHE_NAME) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      // ✅ キャッシュ可能な条件をチェック
      if (networkResponse.ok && 
          networkResponse.status === 200 && // 完全なレスポンスのみ
          request.method === 'GET') {       // GET リクエストのみ
        try {
          // Clone before using the response to avoid "body already used" error
          const responseToCache = networkResponse.clone();
          caches.open(cacheName).then(cache => 
            cache.put(request, responseToCache)
          ).catch(error => {
            console.log('[SW] Cache put failed (non-critical):', error.message);
          });
        } catch (error) {
          console.log('[SW] Response clone failed (non-critical):', error.message);
        }
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || networkResponsePromise || 
         new Response('Data not available', { status: 503 });
}