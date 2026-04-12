// ═══════════════════════════════════════════════════════════
//  PGE Estudos 2026 — Service Worker
//  Habilita instalação como PWA e cache offline básico
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = 'pge-estudos-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Instala e faz cache dos assets principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {
        // Se algum asset falhar (ex: ícones ainda não existem), ignora
        return cache.add('./index.html');
      });
    })
  );
  self.skipWaiting();
});

// Limpa caches antigos ao ativar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: Network First (sempre tenta buscar versão atual)
// Se offline, serve do cache
self.addEventListener('fetch', event => {
  // Ignora requisições para Supabase (sempre precisam de rede)
  if (event.request.url.includes('supabase.co') ||
      event.request.url.includes('supabase.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('jsdelivr.net')) {
    return;
  }

  // Para o app em si: Network First com fallback para cache
  if (event.request.mode === 'navigate' ||
      event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza cache com versão mais recente
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline: serve do cache
          return caches.match('./index.html');
        })
    );
  }
});
