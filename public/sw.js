const CACHE_NAME = 'fingroww-cache-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // Network-first strategy for production PWA
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// --- Push Notification Listener ---
self.addEventListener('push', (event) => {
  let payload = {
    title: 'FinGroww Alert 🔔',
    body: 'Aapka bill ya EMI due hone wala hai!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'fingroww-due-alert',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-192x192.png',
      tag: payload.tag || 'fingroww-alert',
      vibrate: [200, 100, 200],
      data: payload.url || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
