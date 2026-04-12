const SHELL_CACHE = "albaz-vendor-shell-v3";
const RUNTIME_CACHE = "albaz-vendor-runtime-v3";
const CORE_ASSETS = ["/vendor", "/logo.png", "/manifest.webmanifest"];

const NEXT_STATIC_PATTERN = /\/_next\/static\//;
const STATIC_FILE_PATTERN = /\.(?:css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$/i;

/** Store response in cache. Pass a dedicated clone — never the same instance returned to `respondWith`. */
async function putInCache(cacheName, request, responseForCache) {
  if (!responseForCache || responseForCache.status !== 200) return;
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, responseForCache);
  } catch {
    // quota / opaque response / etc.
  }
}

self.addEventListener("install", (event) => {
  // Precache each URL separately so one 404 (e.g. slow server) does not fail the whole batch.
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(CORE_ASSETS.map((url) => cache.add(url).catch(() => undefined)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Do not cache browser extensions or non-http(s) requests.
  if (!url.protocol.startsWith("http")) return;

  // API routes: network-first, fallback to cached response if offline.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            void putInCache(RUNTIME_CACHE, req, res.clone());
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || new Response(JSON.stringify({ offline: true }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }

  // Navigation requests: network-first, fallback to vendor shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            void putInCache(SHELL_CACHE, req, res.clone());
          }
          return res;
        })
        .catch(async () => {
          const fallback = await caches.match("/vendor");
          return fallback || caches.match("/");
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (NEXT_STATIC_PATTERN.test(url.pathname) || STATIC_FILE_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkPromise = fetch(req)
          .then((res) => {
            if (res.ok) {
              void putInCache(RUNTIME_CACHE, req, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
  }
});
