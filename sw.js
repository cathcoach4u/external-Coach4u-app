/* ═══════════════════════════════════════════════════════════════
   Service Worker for Coach4U PWA
   Caching strategy: Static assets (cache-first), Pages (network-first), API (network-first)
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'coach4u-v0.5.2';
const STATIC_CACHE = CACHE_VERSION + '-static';
const PAGES_CACHE = CACHE_VERSION + '-pages';
const API_CACHE = CACHE_VERSION + '-api';

const STATIC_ASSETS = [
  '/Coach4uapp-strategy/',
  '/Coach4uapp-strategy/index.html',
  '/Coach4uapp-strategy/dashboard.html',
  '/Coach4uapp-strategy/offline.html',
  '/Coach4uapp-strategy/manifest.json',
  '/Coach4uapp-strategy/css/style.css',
  '/Coach4uapp-strategy/js/app.js',
  '/Coach4uapp-strategy/js/auth.js',
  '/Coach4uapp-strategy/js/supabase.js',
  '/Coach4uapp-strategy/js/ai.js',
  '/Coach4uapp-strategy/business/index.html',
  '/Coach4uapp-strategy/business/js/app.js',
  '/Coach4uapp-strategy/growth/index.html',
  '/Coach4uapp-strategy/growth/css/style.css',
  '/Coach4uapp-strategy/growth/js/app.js',
  '/Coach4uapp-strategy/growth/js/ai.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Fail gracefully if some assets aren't available
        console.log('Some static assets could not be cached');
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
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

// Fetch event: implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET
  if (!url.pathname.includes('/Coach4uapp-strategy/') && url.origin !== location.origin) {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  // API requests: network-first with fallback to cache
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
              JSON.stringify({ error: 'Offline', fallback: true }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // HTML pages: network-first with fallback to cache
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
            return cached || caches.match('/Coach4uapp-strategy/offline.html');
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images): cache-first with fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        if (response.ok && request.url.includes('/Coach4uapp-strategy/')) {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      }).catch(() => {
        // Return a placeholder for failed image requests
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
            '<rect fill="#f0f0f0" width="100" height="100"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        return new Response('Resource unavailable offline', { status: 503 });
      });
    })
  );
});
