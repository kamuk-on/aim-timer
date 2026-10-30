/**
 * Self-cleaning Service Worker:
 * Elimina cualquier Service Worker o CacheStorage previo que haya quedado registrado en Chrome
 * y recarga las pestañas abiertas con los archivos frescos.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clientsList = await self.clients.matchAll({ type: 'window' });
      for (const client of clientsList) {
        client.navigate(client.url);
      }
    })()
  );
});

