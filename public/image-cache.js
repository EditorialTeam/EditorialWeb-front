const CACHE = 'editorial-images-v1';
const MAX_AGE = 24 * 60 * 60 * 1000;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname !== '/api/files' || event.request.destination !== 'image') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached && Date.now() - Number(cached.headers.get('x-editorial-cached-at')) < MAX_AGE) return cached;
    const response = await fetch(event.request);
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      const headers = new Headers(response.headers);
      headers.set('x-editorial-cached-at', String(Date.now()));
      const stored = new Response(await response.clone().blob(), { status: response.status, headers });
      await cache.put(event.request, stored);
      const keys = await cache.keys();
      for (const key of keys.slice(0, Math.max(0, keys.length - 100))) await cache.delete(key);
    } else if (response.status === 404) await cache.delete(event.request);
    return response;
  })());
});
