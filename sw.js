/* Foco total — modo offline.
   Para publicar uma versão nova, troque o número de VERSAO abaixo. */
const VERSAO = 'foco-total-v1';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(chaves => Promise.all(chaves.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  /* fontes do Google: guarda na primeira vez e depois usa do cache */
  if (fonte) {
    e.respondWith(caches.open(VERSAO).then(c => c.match(req).then(hit =>
      hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit))));
    return;
  }

  /* arquivos do app: usa o cache e atualiza em segundo plano */
  if (url.origin === location.origin) {
    e.respondWith(caches.open(VERSAO).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
      const rede = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || rede;
    })));
  }
});
