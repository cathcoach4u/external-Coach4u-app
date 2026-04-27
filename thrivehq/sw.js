/* Service Worker for ThriveHQ PWA */

const CACHE_VERSION = 'thrivehq-v1.0.0';
const STATIC_CACHE = CACHE_VERSION + '-static';
const PAGES_CACHE = CACHE_VERSION + '-pages';
const API_CACHE = CACHE_VERSION + '-api';

const STATIC_ASSETS = [
  '/external-Coach4u-app/thrivehq/',
  '/external-Coach4u-app/thrivehq/index.html',
  '/external-Coach4u-app/thrivehq/dashboard.html',
  '/external-Coach4u-app/thrivehq/brain-pulse-detail.html',
  '/external-Coach4u-app/thrivehq/resources.html',
  '/external-Coach4u-app/thrivehq/account.html',
  '/external-Coach4u-app/thrivehq/manifest.json',
  '/external-Coach4u-app/thrivehq/css/style.css',
  '/external-Coach4u-app/thrivehq/js/app.js',
  '/external-Coach4u-app/thrivehq/js/auth.js',
  '/external-Coach4u-app/thrivehq/js/supabase.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.log('Some static assets could not be cached');
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.startsWith(CACHE_VERSION)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET
  if (!url.pathname.includes('/external-Coach4u-app/thrivehq/') && url.origin !== location.origin) {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  // API requests: network-first
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ error: 'Offline' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // HTML pages: network-first
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(PAGES_CACHE).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/external-Coach4u-app/thrivehq/index.html');
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok && request.url.includes('/external-Coach4u-app/thrivehq/')) {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      }).catch(() => {
        return new Response('Resource unavailable offline', { status: 503 });
      });
    })
  );
});
