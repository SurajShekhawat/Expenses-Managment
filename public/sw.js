const CACHE_NAME = 'fingroww-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // Purge all old and v1 caches
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // On localhost/development, never intercept to prevent Next.js CSS chunk hash desync
  const url = new URL(event.request.url);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // Network-first strategy for production PWA
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
