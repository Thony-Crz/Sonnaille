/*
 * Former service worker (Vite PWA, until November 2026). Devices that installed it get this one
 * when it checks for updates: it empties the old Workbox caches, unregisters itself and reloads
 * the open pages, which then load the Angular app and its own service worker (ngsw-worker.js).
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.includes('workbox')).map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url))),
  );
});
