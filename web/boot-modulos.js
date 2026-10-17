// boot-modulos.js — extraido de index.html (CSP fase 1: sin <script> inline).
// Carga diferida de modulos no criticos tras la primera pintura.
// El calendario abre solo con el nucleo; el resto (guias, juegos,
// comunidad, QR...) se inyecta en segundo plano, en el mismo orden,
// cuando el navegador esta desocupado. Recorta ~60% del JS inicial.
//
// FUENTE DE VERDAD del MODS: scripts/build-sw.cjs tambien lee este
// archivo (var MODS) para generar el CORE del SW. Si agregas un modulo,
// hazlo aqui (no en index.html).
(function () {
  var MODS = [
    'min/linaje-modulos.min.js?v=1',
    'min/eneagrama-modulo.min.js?v=1',
    'min/ikigai-modulo.min.js?v=1',
    'min/fortalezas-via-modulo.min.js?v=2',
    'min/cuarto-camino-modulo.min.js?v=1',
    'min/hooponopono-modulo.min.js?v=1',
    'min/reiki-modulo.min.js?v=1',
    'min/consciencia-cristica-modulo.min.js?v=3',
    'min/tolteca-modulo.min.js?v=1',
    'min/tao-modulo.min.js?v=1',
    'min/anastasia-modulo.min.js?v=1',
    'min/ami-modulo.min.js?v=1',
    'min/vigyan-bhairav-modulo.min.js?v=1',
    'min/estoicismo-modulo.min.js?v=1',
    'min/espiritu-modulo.min.js?v=1',
    'min/constelaciones-modulo.min.js?v=1',
    'min/metodo-silva-modulo.min.js?v=1',
    'min/grabovoi-modulo.min.js?v=1',
    'min/carta-astral.min.js?v=1',
    'min/voz-abuelos.min.js?v=1',
    'min/penco-guia.min.js?v=1',
    'min/bosque-historia.min.js?v=1',
    'min/bosque-semillero.min.js?v=1',
    'min/aves-historia.min.js?v=1',
    'min/pesca-historia.min.js?v=1',
    'min/flora.min.js?v=1',
    'min/buen-vivir-modulo.min.js?v=1',
    'min/anfibios-modulo.min.js?v=1',
    'min/fauna-marina-modulo.min.js?v=1',
    'min/semillero-guias.min.js?v=1',
    'min/ajedrez-modulo.min.js?v=1',
    'min/dama-modulo.min.js?v=1',
    'min/matematicas-modulo.min.js?v=1',
    'min/idiomas-modulo.min.js?v=1',
    'min/portugues-modulo.min.js?v=1',
    'min/chino-mandarin-modulo.min.js?v=2',
    'min/musica-modulos.min.js?v=1',
    'min/sudoku-modulo.min.js?v=1',
    'min/crucigrama-modulo.min.js?v=1',
    'min/sopa-letras-modulo.min.js?v=2',
    'min/solitario-modulo.min.js?v=1',
    'min/info-clave.min.js?v=1',
    'min/psicologia-modulo.min.js?v=1',
    'min/adicciones-modulo.min.js?v=2',
    'min/retos-21-modulo.min.js?v=1',
    'min/club-5am-modulo.min.js?v=1',
    'min/neurodiversidad-modulo.min.js?v=1',
    'min/kin-maya-modulo.min.js?v=3',
    'min/tarot-modulo.min.js?v=1',
    'min/numerologia-modulo.min.js?v=3',
    'min/oraculo-modulo.min.js?v=1',
    'min/adolescencia-modulo.min.js?v=1',
    'min/etapas-vida-modulo.min.js?v=1',
    'min/electrocultura-modulo.min.js?v=1',
    'min/red-comunitaria-modulo.min.js?v=1',
    'min/convivencia-vecinal-modulo.min.js?v=1',
    'min/ciberseguridad-modulo.min.js?v=1',
    'min/open-source-modulo.min.js?v=2',
    'min/ia-modulo.min.js?v=4',
    'min/hidroponia-modulo.min.js?v=2',
    'min/huerta-modulo.min.js?v=1',
    'min/permacultura-modulo.min.js?v=1',
    'min/mecanica-modulo.min.js?v=1',
    'min/domotica-modulo.min.js?v=1',
    'min/electronica-modulo.min.js?v=1',
    'min/electricidad-modulo.min.js?v=1',
    'min/plantas-modulo.min.js?v=1',
    'min/hogar-despensa-closet-modulo.min.js?v=1',
    'min/hogar-herramientas-modulo.min.js?v=1',
    'min/hogar-corral-movilidad-escolar-modulo.min.js?v=1',
    'min/hogar-biblioteca-modulo.min.js?v=1',
    'min/feng-shui-modulo.min.js?v=1',
    'min/cuerpo-luna-rituales-fenologia-modulo.min.js?v=1',
    'min/energia-descanso-modulo.min.js?v=1',
    'min/natacion-modulo.min.js?v=1',
    'min/futbol-modulo.min.js?v=1',
    'min/talleres-penco.min.js?v=1',
    'min/iglesias-penco.min.js?v=1',
    'min/municipalidad-penco.min.js?v=1',
    'min/bomberos-penco.min.js?v=1',
    'min/apoyo-emergencia.min.js?v=1',
    'min/actores-territorio.min.js?v=1',
    'min/amenazas-territorio.min.js?v=2',
    'min/negocios-penco.min.js?v=2',
    'min/moneda-social.min.js?v=1',
    'min/finanzas-negocio-modulo.min.js?v=1',
    'min/humedal-rocuant-andalien-modulo.min.js?v=1',
    'min/territorio-fase2.min.js?v=1',
    'min/qrcode-lib.min.js?v=1',
    'min/jsqr-lib.min.js?v=1',
    'min/qr-codec.min.js?v=1',
    'min/qr-sync-modulo.min.js?v=1',
    'min/bitacoras-respaldo-modulo.min.js?v=1',
    'min/ics-modulo.min.js?v=1',
    'min/recetas-naturales-modulo.min.js?v=1',
    'min/accesibilidad-modulo.min.js?v=1',
    'min/onboarding-modulo.min.js?v=1',
    'min/legal-modulo.min.js?v=1',
    'min/auto-backup-modulo.min.js?v=1',
    'min/orden-herramientas-modulo.min.js?v=1'
  ];
  var started = false;
  var failedMods = [];
  function loadOne(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = function () { cb(true); };
    s.onerror = function () { cb(false); };
    try { document.body.appendChild(s); }
    catch (e) { cb(false); }
  }
  // Paralelo limitado (4 en vuelo): los <script> usan async=false, asi el
  // navegador los EJECUTA en orden de inserción aunque los descargue en
  // paralelo. Un fallo ya no bloquea la cadena: cada módulo reintenta 1 vez
  // y la cola avanza. ~4x más rápido que secuencial en 4G.
  var MAX_PAR = 4;
  function loadWithRetry(src, cb) {
    loadOne(src, function (ok) {
      if (ok) { cb(true); return; }
      setTimeout(function () {
        loadOne(src, function (ok2) { cb(ok2); });
      }, 1000);
    });
  }
  function pool() {
    var idx = 0, done = 0;
    if (!MODS.length) { reportMods(); return; }
    function next() {
      if (idx >= MODS.length) return;
      var my = idx++;
      var src = MODS[my];
      loadWithRetry(src, function (ok) {
        if (!ok) failedMods.push(src);
        done++;
        if (done >= MODS.length) { reportMods(); return; }
        next();
      });
    }
    for (var k = 0; k < Math.min(MAX_PAR, MODS.length); k++) next();
  }
  function seq(i) { pool(); }
  function reportMods() {
    try {
      if (!failedMods.length) return;
      var el = document.getElementById('statusMsg');
      if (!el) return;
      el.innerHTML = '';
      var t = document.createElement('span');
      t.textContent = '⚠ ' + failedMods.length + ' módulo(s) no cargaron (' +
        failedMods.map(function (m) { return m.split('?')[0]; }).join(', ') + '). ';
      var b = document.createElement('button');
      b.className = 'btn'; b.style.width = 'auto'; b.textContent = '↻ Reintentar';
      b.onclick = function () {
        var retry = failedMods.slice(); failedMods = [];
        el.textContent = 'Reintentando módulos…';
        (function next(k) {
          if (k >= retry.length) { reportMods(); return; }
          loadOne(retry[k], function (ok) { if (!ok) failedMods.push(retry[k]); next(k + 1); });
        })(0);
      };
      el.appendChild(t); el.appendChild(b);
    } catch (e) {}
  }
  function kick() { if (started) return; started = true; pool(); }
  try {
    if ('requestIdleCallback' in window) requestIdleCallback(kick, { timeout: 2500 });
    else if (document.readyState === 'complete') setTimeout(kick, 600);
    else window.addEventListener('load', function () { setTimeout(kick, 600); });
  } catch (e) {
    window.addEventListener('load', function () { setTimeout(kick, 600); });
  }
  // Red de seguridad: si el nucleo pinto el calendario pero no oculto el
  // aviso (falla parcial), no dejar el spinner eterno: a los 15s, si ya
  // hay dias dibujados, se oculta igual.
  setTimeout(function () {
    try {
      if (window.__calReady) return;
      var g = document.getElementById('grid');
      var sp = document.getElementById('bootSplash');
      if (sp && g && g.children.length) {
        sp.classList.add('done');
        setTimeout(function () { try { sp.remove(); } catch (e2) {} }, 400);
      }
    } catch (e) {}
  }, 15000);
})();
