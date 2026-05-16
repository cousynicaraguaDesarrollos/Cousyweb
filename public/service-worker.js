const CACHE_NAME = "cousy-cache-v13";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./manifest-ventas-gastos.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/app.css",
  "./assets/favicon.ico",
  "./assets/logo-cousy.png",
  "./assets/logo-cousy.webp",
  "./es/index.html",
  "./es/vg/",
  "./es/tienda.html",
  "./es/cotizacion.html",
  "./es/casos-de-exito.html",
  "./es/nosotros.html",
  "./es/sostenibilidad.html",
  "./js/layout.js",
  "./js/site.js",
  "./js/cart.js",
  "./js/cotizacion.js",
  "./js/header.js",
  "./js/tienda.js",
  "./config/site.json",
  "./data/products.json",
  "./partials/header-es.html",
  "./partials/footer-es.html"
];

async function preCache() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.allSettled(
    PRECACHE_URLS.map(async (url) => {
      await cache.add(new Request(url, { cache: "reload" }));
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    preCache().then(() => {
      self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (shouldCacheResponse(networkResponse)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const fallbackResponse = await cache.match("./es/index.html");
    if (fallbackResponse) {
      return fallbackResponse;
    }

    return cache.match("./index.html");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (shouldCacheResponse(networkResponse)) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  if (request.destination === "document") {
    return cache.match("./index.html");
  }

  return new Response("", { status: 504, statusText: "Offline" });
}

function shouldCacheResponse(response) {
  if (!(response instanceof Response)) return false;
  // Cache API no soporta respuestas parciales 206.
  if (response.status !== 200) return false;
  return true;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
