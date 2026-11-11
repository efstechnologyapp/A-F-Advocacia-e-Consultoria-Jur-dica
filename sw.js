// Funcionamento sem internet: guarda os arquivos do app; servidor, login e fontes vão direto à rede.
const CACHE = 'amorim-firmo-v1.10.1';
const ARQUIVOS = ['./', 'index.html', 'app.js', 'config.js', 'manifest.json', 'brasao.png', 'brasao-claro.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  // rede primeiro (pega atualizações), cache se estiver sem internet
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
