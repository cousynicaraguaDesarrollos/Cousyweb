const CACHE_NAME = "cousy-cache-v18";
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
  "./es/tienda/",
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
    await safeCachePut(cache, request, networkResponse);
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
    .then(async (networkResponse) => {
      await safeCachePut(cache, request, networkResponse);
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

async function safeCachePut(cache, request, response) {
  if (!shouldCacheResponse(response)) return;
  try {
    await cache.put(request, response.clone());
  } catch {
    // noop: evita romper por respuestas no cacheables en navegadores estrictos.
  }
}

function normalizeRequest(request) {
  const url = new URL(request.url);
  let pathname = url.pathname;

  if (pathname.startsWith("/es/assets/")) {
    pathname = pathname.replace("/es/assets/", "/assets/");
  } else if (pathname.startsWith("/es/config/")) {
    pathname = pathname.replace("/es/config/", "/config/");
  }

  if (pathname === url.pathname) return request;

  const nextUrl = `${url.origin}${pathname}${url.search}`;
  return new Request(nextUrl, request);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  if (request.headers.has("range")) {
    event.respondWith(fetch(request));
    return;
  }

  const normalizedRequest = normalizeRequest(request);
  const url = new URL(normalizedRequest.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Respetar solicitudes explícitas sin caché (ej: parciales y config del layout).
  if (normalizedRequest.cache === "no-store") {
    event.respondWith(fetch(normalizedRequest));
    return;
  }

  if (normalizedRequest.mode === "navigate") {
    event.respondWith(networkFirst(normalizedRequest));
    return;
  }

  event.respondWith(staleWhileRevalidate(normalizedRequest));
});
