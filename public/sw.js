// Smaakenzzoo Artisanal Cafe - Production Service Worker
// Cache-first for media/fonts/static assets, Network-first for dynamic navigation with offline fallback.

const CACHE_NAME = 'smaakenzzoo-v1.0.0';

const PRECACHE_SHELL = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install: Pre-cache app shell and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: Purge obsolete caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET, extension requests, or analytics
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Exclude Firebase Firestore WebChannel / WebSocket / Auth requests from caching
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.pathname.includes('/google.firestore.')
  ) {
    return;
  }

  // 1. Navigation requests (HTML pages): Network-first with offline /index.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match('/index.html') || await cache.match('/');
          return cachedResponse || new Response('Offline: Please connect to the internet to load Smaakenzzoo.', {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // 2. Static Assets (Images, Fonts, Scripts, Styles): Stale-While-Revalidate / Cache-First
  const isStaticAsset = (
    url.origin === self.location.origin && (
      request.destination === 'image' ||
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|woff2|woff|ttf|css|js)$/i)
    )
  ) || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch update in background to refresh cache
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          // If offline and request is an image, fallback to favicon.svg
          if (request.destination === 'image') {
            return caches.match('/favicon.svg');
          }
        });
      })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
