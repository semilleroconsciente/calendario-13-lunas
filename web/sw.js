// Service Worker — Calendario 13 Lunas (offline-first, tolerante a versiones ?v=)
// Copyright (C) 2026 Semillero Consciente. Licencia: GNU GPLv3 o posterior (ver COPYING).
// SPDX-License-Identifier: GPL-3.0-or-later
// v55
const CACHE = 'cal13-v128-offline';

// Lista completa de archivos que usa index.html (bare + con ?v=).
// Si se agrega un JS nuevo en index.html, agregarlo aquí también (bare y ?v=).
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './donate.json',
  './robots.txt',
  './sitemap.xml',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './min/anime-v4.min.js',
  './min/anime-v4.min.js?v=1',
  './assets/notify.mp3',
  './assets/cuentos/luna01.mp3',
  './assets/cuentos/luna02.mp3',
  './assets/cuentos/luna03.mp3',
  './assets/cuentos/luna04.mp3',
  './assets/cuentos/luna05.mp3',
  './assets/cuentos/luna06.mp3',
  './assets/cuentos/luna07.mp3',
  './assets/cuentos/luna08.mp3',
  './assets/cuentos/luna09.mp3',
  './assets/cuentos/luna10.mp3',
  './assets/cuentos/luna11.mp3',
  './assets/cuentos/luna12.mp3',
  './assets/cuentos/luna13.mp3',
  './COPYING',
  './LICENSE.md',
  './LICENCIA-CONTENIDO-CC-BY-NC-SA-4.0.md',
  './legal/licencias.html',
  './legal/terminos.html',
  './legal/privacidad.html',
  './legal/cookies.html',
  './data/territorios/index.json',
  './data/territorios/penco/actores.json',
  './data/territorios/penco/amenazas.json',
  './data/territorios/penco/apoyo-emergencia.json',
  './data/territorios/penco/bomberos.json',
  './data/territorios/penco/consejos-bosque.json',
  './data/territorios/penco/cultivos/asociaciones.json',
  './data/territorios/penco/cultivos/preparados.json',
  './data/territorios/penco/especies/aves.json',
  './data/territorios/penco/especies/bosque.json',
  './data/territorios/penco/especies/fauna-marina.json',
  './data/territorios/penco/especies/flora.json',
  './data/territorios/penco/especies/intermareal.json',
  './data/territorios/penco/eventos.json',
  './data/territorios/penco/historia/aves-bosque.json',
  './data/territorios/penco/historia/companeros-bosque.json',
  './data/territorios/penco/historia/guia.json',
  './data/territorios/penco/historia/historia-aves.json',
  './data/territorios/penco/historia/historia-bosque.json',
  './data/territorios/penco/historia/historia-fauna-marina.json',
  './data/territorios/penco/historia/historia-pesca.json',
  './data/territorios/penco/historia/historia.json',
  './data/territorios/penco/historia/sectores.json',
  './data/territorios/penco/lunas.json',
  './data/territorios/penco/municipalidad.json',
  './data/territorios/penco/talleres.json',
  './data/territorios/penco/territorio.json',
  './data/territorios/_plantilla/territorio.json',
  './templates/aireDialog.html',
  './templates/animalCareDialog.html',
  './templates/apoyoDialog.html',
  './templates/astroDialog.html',
  './templates/birdsDialog.html',
  './templates/bomberosDialog.html',
  './templates/bosqueDialog.html',
  './templates/breathDialog.html',
  './templates/circadianDialog.html',
  './templates/claveDialog.html',
  './templates/compostDialog.html',
  './templates/comunaDialog.html',
  './templates/configDialog.html',
  './templates/convertDialog.html',
  './templates/dayDialog.html',
  './templates/disciplineDialog.html',
  './templates/donateDialog.html',
  './templates/dreamsDialog.html',
  './templates/educacionDialog.html',
  './templates/ekadashiDialog.html',
  './templates/energyDialog.html',
  './templates/englishDialog.html',
  './templates/espiritualDialog.html',
  './templates/evacDialog.html',
  './templates/financeDialog.html',
  './templates/firstAidDialog.html',
  './templates/fishingDialog.html',
  './templates/goldenDialog.html',
  './templates/gratitudDialog.html',
  './templates/gymDialog.html',
  './templates/habitsDialog.html',
  './templates/helpDialog.html',
  './templates/homeTasksDialog.html',
  './templates/iglesiasDialog.html',
  './templates/instalarDialog.html',
  './templates/intermarealDialog.html',
  './templates/lawenDialog.html',
  './templates/lenaDialog.html',
  './templates/mapuDialog.html',
  './templates/mealDialog.html',
  './templates/medicDialog.html',
  './templates/memoryDialog.html',
  './templates/menstrualDialog.html',
  './templates/metodosDialog.html',
  './templates/muniDialog.html',
  './templates/nutriDialog.html',
  './templates/psicoDialog.html',
  './templates/rutinasDialog.html',
  './templates/scheduleDialog.html',
  './templates/searchDialog.html',
  './templates/shoppingDialog.html',
  './templates/siembraDialog.html',
  './templates/studyDialog.html',
  './templates/taleLunaDialog.html',
  './templates/talesDialog.html',
  './templates/timerDialog.html',
  './templates/userDialog.html',
  './templates/violenceDialog.html',
  './templates/vozDialog.html',
  './screenshots/desktop-1280x720.png',
  './screenshots/movil-540x720.png',
  './boot-modulos.js',
  './boot-modulos.js?v=1',
  './min/accesibilidad-modulo.min.js',
  './min/accesibilidad-modulo.min.js?v=1',
  './min/actores-territorio.min.js',
  './min/actores-territorio.min.js?v=1',
  './min/adicciones-modulo.min.js',
  './min/adicciones-modulo.min.js?v=2',
  './min/adolescencia-modulo.min.js',
  './min/adolescencia-modulo.min.js?v=1',
  './min/ajedrez-modulo.min.js',
  './min/ajedrez-modulo.min.js?v=1',
  './min/amenazas-territorio.min.js',
  './min/amenazas-territorio.min.js?v=2',
  './min/ami-modulo.min.js',
  './min/ami-modulo.min.js?v=1',
  './min/anastasia-modulo.min.js',
  './min/anastasia-modulo.min.js?v=1',
  './min/anfibios-modulo.min.js',
  './min/anfibios-modulo.min.js?v=1',
  './min/apoyo-emergencia.min.js',
  './min/apoyo-emergencia.min.js?v=1',
  './min/arabe-modulo.min.js',
  './min/arabe-modulo.min.js?v=1',
  './min/astro.min.js',
  './min/astro.min.js?v=8',
  './min/auto-backup-modulo.min.js',
  './min/auto-backup-modulo.min.js?v=1',
  './min/aves-historia.min.js',
  './min/aves-historia.min.js?v=1',
  './min/basquetbol-modulo.min.js',
  './min/basquetbol-modulo.min.js?v=1',
  './min/bienvenida-modulo.min.js',
  './min/bienvenida-modulo.min.js?v=1',
  './min/bienvenida.min.css',
  './min/bienvenida.min.css?v=1',
  './min/bitacoras-respaldo-modulo.min.js',
  './min/bitacoras-respaldo-modulo.min.js?v=1',
  './min/bomberos-penco.min.js',
  './min/bomberos-penco.min.js?v=1',
  './min/bosque-historia.min.js',
  './min/bosque-historia.min.js?v=1',
  './min/bosque-semillero.min.js',
  './min/bosque-semillero.min.js?v=1',
  './min/buen-vivir-modulo.min.js',
  './min/buen-vivir-modulo.min.js?v=1',
  './min/cal.min.js',
  './min/cal.min.js?v=9',
  './min/carta-astral.min.js',
  './min/carta-astral.min.js?v=1',
  './min/chino-mandarin-modulo.min.js',
  './min/chino-mandarin-modulo.min.js?v=3',
  './min/ciberseguridad-modulo.min.js',
  './min/ciberseguridad-modulo.min.js?v=1',
  './min/club-5am-modulo.min.js',
  './min/club-5am-modulo.min.js?v=1',
  './min/consciencia-cristica-modulo.min.js',
  './min/consciencia-cristica-modulo.min.js?v=3',
  './min/constelaciones-modulo.min.js',
  './min/constelaciones-modulo.min.js?v=1',
  './min/convivencia-vecinal-modulo.min.js',
  './min/convivencia-vecinal-modulo.min.js?v=1',
  './min/core-audio.min.js',
  './min/core-audio.min.js?v=1',
  './min/core-bootstrap.min.js',
  './min/core-bootstrap.min.js?v=1',
  './min/core-calendario.min.js',
  './min/core-calendario.min.js?v=1',
  './min/core-clima.min.js',
  './min/core-clima.min.js?v=1',
  './min/core-dialogo-dia.min.js',
  './min/core-dialogo-dia.min.js?v=1',
  './min/core-sanitize.min.js',
  './min/core-sanitize.min.js?v=1',
  './min/core-storage.min.js',
  './min/core-storage.min.js?v=1',
  './min/core-themes.min.js',
  './min/core-themes.min.js?v=1',
  './min/crucigrama-modulo.min.js',
  './min/crucigrama-modulo.min.js?v=1',
  './min/cuarto-camino-modulo.min.js',
  './min/cuarto-camino-modulo.min.js?v=1',
  './min/cuerpo-luna-rituales-fenologia-modulo.min.js',
  './min/cuerpo-luna-rituales-fenologia-modulo.min.js?v=1',
  './min/dama-modulo.min.js',
  './min/dama-modulo.min.js?v=1',
  './min/data.min.js',
  './min/data.min.js?v=8',
  './min/dialogo-tamano.min.js',
  './min/dialogo-tamano.min.js?v=1',
  './min/domotica-modulo.min.js',
  './min/domotica-modulo.min.js?v=1',
  './min/educacion-penco.min.js',
  './min/educacion-penco.min.js?v=1',
  './min/electricidad-modulo.min.js',
  './min/electricidad-modulo.min.js?v=1',
  './min/electrocultura-modulo.min.js',
  './min/electrocultura-modulo.min.js?v=1',
  './min/electronica-modulo.min.js',
  './min/electronica-modulo.min.js?v=1',
  './min/eneagrama-modulo.min.js',
  './min/eneagrama-modulo.min.js?v=1',
  './min/energia-descanso-modulo.min.js',
  './min/energia-descanso-modulo.min.js?v=1',
  './min/espiritu-modulo.min.js',
  './min/espiritu-modulo.min.js?v=1',
  './min/estoicismo-modulo.min.js',
  './min/estoicismo-modulo.min.js?v=1',
  './min/etapas-vida-modulo.min.js',
  './min/etapas-vida-modulo.min.js?v=3',
  './min/fauna-marina-modulo.min.js',
  './min/fauna-marina-modulo.min.js?v=1',
  './min/feng-shui-modulo.min.js',
  './min/feng-shui-modulo.min.js?v=1',
  './min/finanzas-negocio-modulo.min.js',
  './min/finanzas-negocio-modulo.min.js?v=1',
  './min/flora.min.js',
  './min/flora.min.js?v=1',
  './min/fortalezas-via-modulo.min.js',
  './min/fortalezas-via-modulo.min.js?v=2',
  './min/frases.min.js',
  './min/frases.min.js?v=8',
  './min/futbol-modulo.min.js',
  './min/futbol-modulo.min.js?v=1',
  './min/grabovoi-modulo.min.js',
  './min/grabovoi-modulo.min.js?v=1',
  './min/hidroponia-modulo.min.js',
  './min/hidroponia-modulo.min.js?v=2',
  './min/hindi-modulo.min.js',
  './min/hindi-modulo.min.js?v=2',
  './min/hogar-biblioteca-modulo.min.js',
  './min/hogar-biblioteca-modulo.min.js?v=1',
  './min/hogar-corral-movilidad-escolar-modulo.min.js',
  './min/hogar-corral-movilidad-escolar-modulo.min.js?v=1',
  './min/hogar-despensa-closet-modulo.min.js',
  './min/hogar-despensa-closet-modulo.min.js?v=1',
  './min/hogar-herramientas-modulo.min.js',
  './min/hogar-herramientas-modulo.min.js?v=1',
  './min/hooponopono-modulo.min.js',
  './min/hooponopono-modulo.min.js?v=1',
  './min/huerta-modulo.min.js',
  './min/huerta-modulo.min.js?v=1',
  './min/humedal-rocuant-andalien-modulo.min.js',
  './min/humedal-rocuant-andalien-modulo.min.js?v=1',
  './min/ia-modulo.min.js',
  './min/ia-modulo.min.js?v=4',
  './min/ics-modulo.min.js',
  './min/ics-modulo.min.js?v=1',
  './min/idiomas-modulo.min.js',
  './min/idiomas-modulo.min.js?v=2',
  './min/iglesias-penco.min.js',
  './min/iglesias-penco.min.js?v=1',
  './min/ikigai-modulo.min.js',
  './min/ikigai-modulo.min.js?v=1',
  './min/info-clave.min.js',
  './min/info-clave.min.js?v=1',
  './min/italiano-modulo.min.js',
  './min/italiano-modulo.min.js?v=2',
  './min/japones-modulo.min.js',
  './min/japones-modulo.min.js?v=2',
  './min/jsqr-lib.min.js',
  './min/jsqr-lib.min.js?v=1',
  './min/kin-maya-modulo.min.js',
  './min/kin-maya-modulo.min.js?v=3',
  './min/latin-modulo.min.js',
  './min/latin-modulo.min.js?v=1',
  './min/legal-modulo.min.js',
  './min/legal-modulo.min.js?v=1',
  './min/linaje-modulos.min.js',
  './min/linaje-modulos.min.js?v=1',
  './min/matematicas-modulo.min.js',
  './min/matematicas-modulo.min.js?v=1',
  './min/mecanica-modulo.min.js',
  './min/mecanica-modulo.min.js?v=1',
  './min/metodo-silva-modulo.min.js',
  './min/metodo-silva-modulo.min.js?v=1',
  './min/moneda-social.min.js',
  './min/moneda-social.min.js?v=1',
  './min/municipalidad-penco.min.js',
  './min/municipalidad-penco.min.js?v=1',
  './min/musica-modulos.min.js',
  './min/musica-modulos.min.js?v=1',
  './min/natacion-modulo.min.js',
  './min/natacion-modulo.min.js?v=1',
  './min/negocios-penco.min.js',
  './min/negocios-penco.min.js?v=2',
  './min/neurodiversidad-modulo.min.js',
  './min/neurodiversidad-modulo.min.js?v=1',
  './min/nuevos-modulos.min.js',
  './min/nuevos-modulos.min.js?v=10',
  './min/numerologia-modulo.min.js',
  './min/numerologia-modulo.min.js?v=3',
  './min/onboarding-modulo.min.js',
  './min/onboarding-modulo.min.js?v=1',
  './min/open-source-modulo.min.js',
  './min/open-source-modulo.min.js?v=2',
  './min/oraculo-modulo.min.js',
  './min/oraculo-modulo.min.js?v=1',
  './min/orden-herramientas-modulo.min.js',
  './min/orden-herramientas-modulo.min.js?v=1',
  './min/penco-guia.min.js',
  './min/penco-guia.min.js?v=1',
  './min/permacultura-modulo.min.js',
  './min/permacultura-modulo.min.js?v=1',
  './min/pesca-historia.min.js',
  './min/pesca-historia.min.js?v=1',
  './min/plantas-modulo.min.js',
  './min/plantas-modulo.min.js?v=1',
  './min/portugues-modulo.min.js',
  './min/portugues-modulo.min.js?v=2',
  './min/psicologia-modulo.min.js',
  './min/psicologia-modulo.min.js?v=1',
  './min/pwa-install.min.js',
  './min/pwa-install.min.js?v=1',
  './min/qr-codec.min.js',
  './min/qr-codec.min.js?v=1',
  './min/qr-sync-modulo.min.js',
  './min/qr-sync-modulo.min.js?v=1',
  './min/qrcode-lib.min.js',
  './min/qrcode-lib.min.js?v=1',
  './min/recetas-naturales-modulo.min.js',
  './min/recetas-naturales-modulo.min.js?v=1',
  './min/red-comunitaria-modulo.min.js',
  './min/red-comunitaria-modulo.min.js?v=1',
  './min/reiki-modulo.min.js',
  './min/reiki-modulo.min.js?v=1',
  './min/renderer-territorio-vivo.min.js',
  './min/renderer-territorio-vivo.min.js?v=1',
  './min/renderer.min.js',
  './min/renderer.min.js?v=19',
  './min/retos-21-modulo.min.js',
  './min/retos-21-modulo.min.js?v=1',
  './min/ruso-modulo.min.js',
  './min/ruso-modulo.min.js?v=2',
  './min/semillero-guias.min.js',
  './min/semillero-guias.min.js?v=1',
  './min/solitario-modulo.min.js',
  './min/solitario-modulo.min.js?v=1',
  './min/sopa-letras-modulo.min.js',
  './min/sopa-letras-modulo.min.js?v=2',
  './min/splash.min.css',
  './min/splash.min.css?v=1',
  './min/storage-idb.min.js',
  './min/storage-idb.min.js?v=1',
  './min/styles-csp.min.css',
  './min/styles-csp.min.css?v=1',
  './min/styles.min.css',
  './min/styles.min.css?v=16',
  './min/sudoku-modulo.min.js',
  './min/sudoku-modulo.min.js?v=1',
  './min/talleres-penco.min.js',
  './min/talleres-penco.min.js?v=1',
  './min/tao-modulo.min.js',
  './min/tao-modulo.min.js?v=1',
  './min/tarot-modulo.min.js',
  './min/tarot-modulo.min.js?v=1',
  './min/templates-bundled.min.js',
  './min/templates-bundled.min.js?v=1',
  './min/territorio-fase2.min.js',
  './min/territorio-fase2.min.js?v=1',
  './min/territorio.min.js',
  './min/territorio.min.js?v=1',
  './min/tolteca-modulo.min.js',
  './min/tolteca-modulo.min.js?v=1',
  './min/vigyan-bhairav-modulo.min.js',
  './min/vigyan-bhairav-modulo.min.js?v=1',
  './min/voz-abuelos.min.js',
  './min/voz-abuelos.min.js?v=1',
  './min/web-api.min.js',
  './min/web-api.min.js?v=9',
  './min/zoom-calendario.min.js',
  './min/zoom-calendario.min.js?v=1',
  './sw-registro.js',
  './sw-registro.js?v=1',
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
