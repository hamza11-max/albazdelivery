const CACHE_NAME = 'albaz-static-v1'
const ASSETS = [
  '/',
  '/vendor',
  '/logo.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  // Serve GET requests from cache first, then network
  if (req.method === 'GET') {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        try { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, clone)) } catch(e) {}
        return res
      }).catch(() => caches.match('/')))
    )
  }
  // For non-GET, let the network handle it (app's offline queue will handle failures)
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
  )
})
