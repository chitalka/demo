const CACHE_PREFIX = 'chitalka-shell-';
const CACHE_NAME = CACHE_PREFIX + 'd07145d8';
const PRECACHE = ["./","./manifest.webmanifest","./manifest.ru.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./icons/apple-touch-icon.png?v=face-1","./assets/Anna-Karenina-10258ZOi.fb2","./assets/index-CD6yxn-z.css","./assets/index-CEk_Sp2L.js"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request))
      || (await cache.match(new URL('./', self.registration.scope).href))
      || Response.error();
  }
}

async function networkFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

async function cachedAsset(event) {
  const request = event.request;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(request, response.clone());
    return response;
  });

  if (!cached) return refresh;
  event.waitUntil(refresh.then(() => undefined).catch(() => undefined));
  return cached;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const mutablePwaAsset = url.pathname.endsWith('.webmanifest')
    || url.pathname.includes('/icons/');

  event.respondWith(
    request.mode === 'navigate'
      ? networkFirstPage(request)
      : mutablePwaAsset
        ? networkFirstAsset(request)
        : cachedAsset(event).catch(async () => (await caches.match(request)) || Response.error()),
  );
});
