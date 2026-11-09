// Offline support: the app opens instantly from the phone's cache and refreshes itself in the background.
const CACHE = 'ptl-7f5f7d888370';
const SHELL = ["./","index.html","manifest.webmanifest","icon-180.png","icon-512.png"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async c => {
      const cached = (await c.match('index.html')) || (await c.match('./'));
      const fresh = fetch(req).then(res => { if (res && res.ok) c.put('index.html', res.clone()); return res; }).catch(() => null);
      if (cached) { e.waitUntil(fresh); return cached; }
      return (await fresh) || new Response('Offline and not yet cached. Open the app once with a connection.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
});
