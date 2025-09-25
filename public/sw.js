// Service Worker - 開発中は無効化
console.log('[SW] Development mode - Service Worker disabled for debugging');

// 既存のService Workerを削除
self.addEventListener('install', (event) => {
  console.log('[SW] Unregistering for development');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Clearing all caches for development');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 開発中はフェッチをキャッシュしない
self.addEventListener('fetch', (event) => {
  console.log('[SW] Development mode - bypassing cache for:', event.request.url);
  // キャッシュを使わず、直接ネットワークリクエストを通す
  event.respondWith(fetch(event.request));
});