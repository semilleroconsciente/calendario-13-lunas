// Service Worker — Calendario 13 Lunas (offline-first, tolerante a versiones ?v=)
// v24: fix hidroponia-modulo.js (mats string -> array, v=2)

const CACHE = 'cal13-v24-offline';

// Lista completa de archivos que usa index.html (bare + con ?v=).
// Si se agrega un JS nuevo en index.html, agregarlo aquí también (bare y ?v=).
const CORE = [
  './',
  './index.html',
  './styles.css',
  './styles.css?v=9',
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
  './nuevos-modulos.js',
  './nuevos-modulos.js?v=8',
  './linaje-modulos.js',
  './linaje-modulos.js?v=1',
  './eneagrama-modulo.js',
  './eneagrama-modulo.js?v=1',
  './carta-astral.js',
  './carta-astral.js?v=1',
  './voz-abuelos.js',
  './voz-abuelos.js?v=1',
  './penco-guia.js',
  './penco-guia.js?v=1',
  './bosque-historia.js',
  './bosque-historia.js?v=1',
  './bosque-semillero.js',
  './bosque-semillero.js?v=1',
  './aves-historia.js',
  './aves-historia.js?v=1',
  './pesca-historia.js',
  './pesca-historia.js?v=1',
  './semillero-guias.js',
  './semillero-guias.js?v=1',
  './ajedrez-modulo.js',
  './ajedrez-modulo.js?v=1',
  './sudoku-modulo.js',
  './sudoku-modulo.js?v=1',
  './info-clave.js',
  './info-clave.js?v=1',
  './psicologia-modulo.js',
  './psicologia-modulo.js?v=1',
  './adolescencia-modulo.js',
  './adolescencia-modulo.js?v=1',
  './etapas-vida-modulo.js',
  './etapas-vida-modulo.js?v=1',
  './electrocultura-modulo.js',
  './electrocultura-modulo.js?v=1',
  './red-comunitaria-modulo.js',
  './red-comunitaria-modulo.js?v=1',
  './hidroponia-modulo.js',
  './hidroponia-modulo.js?v=2',
  './huerta-modulo.js',
  './huerta-modulo.js?v=1',
  './web-api.js',
  './web-api.js?v=8',
  './donate.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './assets/notify.mp3'
];

// Install tolerante: si un archivo falla (404/red), los demás igual se cachean.
// (El anterior usaba cache.addAll: si 1 fallaba, NO se instalaba nada.)
self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await Promise.allSettled(
        CORE.map(async (u) => {
          try {
            const r = await fetch(u, { cache: 'reload' });
            if (r && r.ok) await c.put(u, r.clone());
          } catch (_) {
            // offline durante instalación: se omite, se intentará en uso
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      // Solo limpia cachés viejas (v15 y anteriores) si la nueva ya trae el
      // index.html (instalación con internet OK). Si el SW se actualizó sin
      // internet, la caché nueva viene vacía: se conserva la anterior para
      // no romper el modo offline, y se hereda su index.html.
      const hasIndex =
        (await c.match('./index.html')) || (await c.match('./'));
      const keys = await caches.keys();
      if (hasIndex) {
        await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      } else {
        for (const k of keys) {
          if (k === CACHE) continue;
          try {
            const old = await caches.open(k);
            const idx = (await old.match('./index.html')) || (await old.match('./'));
            if (idx) { await c.put('./index.html', idx.clone()); break; }
          } catch (_) {}
        }
      }
      // Navigation preload acelera la carga online (si el navegador lo soporta)
      try {
        if ('navigationPreload' in self.registration) await self.registration.navigationPreload.enable();
      } catch (_) {}
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (e) => {
  if (e && e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isAssetRequest(url) {
  return (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.ico')
  );
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }
  // Solo mismo origen (las APIs open-meteo etc. las maneja la página con su propio fallback offline)
  if (url.origin !== location.origin) return;

  // 1) Navegaciones (/, /index.html, ./): network-first con fallback a caché.
  //    Así la app abre offline aunque el HTML sea nuevo.
  if (req.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          const preload = await e.preloadResponse;
          if (preload) {
            const c = await caches.open(CACHE);
            c.put('./index.html', preload.clone()).catch(() => {});
            return preload;
          }
          const net = await fetch(req);
          if (net && net.ok) {
            const c = await caches.open(CACHE);
            c.put('./index.html', net.clone()).catch(() => {});
            return net;
          }
        } catch (_) {}
        const cached =
          (await caches.match('./index.html')) ||
          (await caches.match('./')) ||
          (await caches.match(req, { ignoreSearch: true }));
        if (cached) return cached;
        // Último recurso: página con reintento en vez de quedar en blanco
        return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#0b1026;color:#e8ecff;font-family:system-ui;padding:24px"><h3>Sin conexión</h3><p>Abre la app una vez con internet para activar el modo offline.</p><button onclick="location.reload()" style="padding:10px 18px;border-radius:8px;border:0;background:#e8c56a;font-weight:700">Reintentar</button>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // 2) CSS/JS/fuentes/datos locales: cache-first con tolerancia a ?v=
  //    Clave del bug anterior: pedían styles.css?v=9 pero solo existía ?v=8 en
  //    caché → miss → fetch offline falla → devolvían index.html como CSS.
  if (isAssetRequest(url) || req.destination === 'style' || req.destination === 'script' || req.destination === 'worker') {
    e.respondWith(
      (async () => {
        // a) match exacto (incluye ?v=)
        let hit = await caches.match(req);
        // b) match ignorando query (?v=9 <-> ?v=8 <-> sin query)
        if (!hit) {
          try {
            hit = await caches.match(req, { ignoreSearch: true });
          } catch (_) {}
        }
        if (hit) {
          // Revalida en segundo plano cuando hay internet
          fetch(req)
            .then((r) => {
              if (r && r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone()).catch(() => {}));
            })
            .catch(() => {});
          return hit;
        }
        // c) no estaba en caché: intenta red y la guarda
        try {
          const net = await fetch(req);
          if (net && net.ok) {
            const c = await caches.open(CACHE);
            c.put(req, net.clone()).catch(() => {});
            return net;
          }
          return net;
        } catch (_) {
          // d) offline y sin caché: NO devolver index.html (rompe MIME).
          //    Devuelve error 504 para que la página siga con lo que tenga,
          //    salvo donate.json donde un {} evita que falle el diálogo.
          if (url.pathname.endsWith('donate.json')) {
            return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
          }
          return new Response('', { status: 504, statusText: 'Offline sin caché' });
        }
      })()
    );
    return;
  }

  // 3) Resto (imágenes, prefetch): stale-while-revalidate genérico
  e.respondWith(
    (async () => {
      const hit = await caches.match(req);
      const netP = fetch(req)
        .then((r) => {
          if (r && r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone()).catch(() => {}));
          return r;
        })
        .catch(() => null);
      if (hit) return hit;
      const net = await netP;
      if (net) return net;
      return new Response('', { status: 504, statusText: 'Offline' });
    })()
  );
});
