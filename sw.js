// PGE Estudos 2026 — Service Worker
// Upload este arquivo ao mesmo repositório GitHub que o index.html

const CACHE = 'pge-estudos-v2';
const MAIN  = './index.html'; // arquivo principal

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.add(MAIN)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Supabase e CDNs externos — sempre busca na rede
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('cdn.jsdelivr.net') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('canvas-confetti')) return;
  // App principal — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});
