const CACHE_VERSION = 3;
const CACHE_NAME = `toi-et-moi-v${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
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
