const CACHE_VERSION = 4;
const CACHE_NAME = `toi-et-moi-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.add(new Request(OFFLINE_URL, { cache: 'reload' })).catch(() => undefined)
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  const path = new URL(url).pathname;
  return /\.(js|css|woff2?|ttf|otf|ico|png|jpg|jpeg|svg|webp|avif|gif)$/.test(path)
    || path.startsWith('/_next/static/');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Navigation requests: try network, fall back to the offline page when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.open(CACHE_NAME).then((cache) =>
          cache.match(OFFLINE_URL).then((cached) =>
            cached ?? new Response('Hors ligne', { status: 503, statusText: 'Offline' })
          )
        )
      )
    );
    return;
  }

  // Only cache static assets — never cache HTML pages or RSC payloads
  // so that auth-gated, dynamic data (like questions progress) is always fresh.
  if (!isStaticAsset(event.request.url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetched = fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
        return cached || fetched;
      })
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
