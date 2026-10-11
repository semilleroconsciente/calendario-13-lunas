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
    'linaje-modulos.js?v=1',
    'eneagrama-modulo.js?v=1',
    'ikigai-modulo.js?v=1',
    'fortalezas-via-modulo.js?v=2',
    'cuarto-camino-modulo.js?v=1',
    'hooponopono-modulo.js?v=1',
    'tolteca-modulo.js?v=1',
    'tao-modulo.js?v=1',
    'anastasia-modulo.js?v=1',
    'ami-modulo.js?v=1',
    'vigyan-bhairav-modulo.js?v=1',
    'estoicismo-modulo.js?v=1',
    'constelaciones-modulo.js?v=1',
    'metodo-silva-modulo.js?v=1',
    'grabovoi-modulo.js?v=1',
    'carta-astral.js?v=1',
    'voz-abuelos.js?v=1',
    'penco-guia.js?v=1',
    'bosque-historia.js?v=1',
    'bosque-semillero.js?v=1',
    'aves-historia.js?v=1',
    'pesca-historia.js?v=1',
    'flora.js?v=1',
    'buen-vivir-modulo.js?v=1',
    'anfibios-modulo.js?v=1',
    'semillero-guias.js?v=1',
    'ajedrez-modulo.js?v=1',
    'matematicas-modulo.js?v=1',
    'sudoku-modulo.js?v=1',
    'crucigrama-modulo.js?v=1',
    'sopa-letras-modulo.js?v=2',
    'info-clave.js?v=1',
    'psicologia-modulo.js?v=1',
    'adicciones-modulo.js?v=2',
    'retos-21-modulo.js?v=1',
    'neurodiversidad-modulo.js?v=1',
    'kin-maya-modulo.js?v=3',
    'tarot-modulo.js?v=1',
    'numerologia-modulo.js?v=3',
    'oraculo-modulo.js?v=1',
    'adolescencia-modulo.js?v=1',
    'etapas-vida-modulo.js?v=1',
    'electrocultura-modulo.js?v=1',
    'red-comunitaria-modulo.js?v=1',
    'convivencia-vecinal-modulo.js?v=1',
    'ciberseguridad-modulo.js?v=1',
    'open-source-modulo.js?v=2',
    'ia-modulo.js?v=4',
    'hidroponia-modulo.js?v=2',
    'huerta-modulo.js?v=1',
    'mecanica-modulo.js?v=1',
    'domotica-modulo.js?v=1',
    'electronica-modulo.js?v=1',
    'plantas-modulo.js?v=1',
    'hogar-despensa-closet-modulo.js?v=1',
    'hogar-herramientas-modulo.js?v=1',
    'hogar-corral-movilidad-escolar-modulo.js?v=1',
    'hogar-biblioteca-modulo.js?v=1',
    'feng-shui-modulo.js?v=1',
    'cuerpo-luna-rituales-fenologia-modulo.js?v=1',
    'natacion-modulo.js?v=1',
    'talleres-penco.js?v=1',
    'iglesias-penco.js?v=1',
    'municipalidad-penco.js?v=1',
    'bomberos-penco.js?v=1',
    'apoyo-emergencia.js?v=1',
    'actores-territorio.js?v=1',
    'negocios-penco.js?v=2',
    'moneda-social.js?v=1',
    'finanzas-negocio-modulo.js?v=1',
    'territorio-fase2.js?v=1',
    'qrcode-lib.js?v=1',
    'jsqr-lib.js?v=1',
    'qr-codec.js?v=1',
    'qr-sync-modulo.js?v=1',
    'bitacoras-respaldo-modulo.js?v=1',
    'recetas-naturales-modulo.js?v=1',
    'accesibilidad-modulo.js?v=1',
    'onboarding-modulo.js?v=1',
    'auto-backup-modulo.js?v=1'
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
  // Secuencial a proposito: los modulos se ejecutan en el mismo orden
  // en que aparecen en MODS (igual que antes). La mejora: un reintento
  // por modulo ante red inestable y reporte visible de los que fallen.
  function seq(i) {
    if (i >= MODS.length) { reportMods(); return; }
    loadOne(MODS[i], function (ok) {
      if (ok) { seq(i + 1); return; }
      setTimeout(function () {
        loadOne(MODS[i], function (ok2) {
          if (!ok2) failedMods.push(MODS[i]);
          seq(i + 1);
        });
      }, 1000);
    });
  }
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
  function kick() { if (started) return; started = true; seq(0); }
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
