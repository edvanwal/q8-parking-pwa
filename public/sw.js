const CACHE_VERSION = 'v10';
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

// Push notifications (FCM)
self.addEventListener('push', (event) => {
  let data = { title: 'Q8 Parking', body: '' };
  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.notification?.title || payload.data?.title || 'Q8 Parking',
        body: payload.notification?.body || payload.data?.body || payload.data?.message || '',
        icon: payload.notification?.icon || payload.data?.icon || '/icons/favicon-32x32.png',
        tag: payload.data?.tag || 'q8-parking',
        url: payload.data?.url || '/',
      };
    }
  } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      tag: data.tag,
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
