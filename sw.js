const CACHE = 'cal13-v9-notify-sound';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './styles.css?v=8',
  './web-api.js',
  './web-api.js?v=8',
  './astro.js',
  './astro.js?v=8',
  './data.js',
  './data.js?v=8',
  './frases.js',
  './frases.js?v=8',
  './cal.js',
  './cal.js?v=8',
  './renderer.js',
  './renderer.js?v=8',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './assets/notify.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) {
        fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); }).catch(() => {});
        return hit;
      }
      return fetch(e.request).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
