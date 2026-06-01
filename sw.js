/* DM Tuition service worker — basic offline support */
const CACHE = 'dmtuition-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './privacy.html',
  './manifest.json',
  './images/logo.jpg',
  './images/hero-photo-main.jpg',
  './images/hero-photo-secondary.jpg',
  './images/photo-main.jpg',
  './images/photo-accent.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Only handle same-origin requests; let the network handle fonts/CDNs.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for the HTML document, falling back to cache when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});
