// onboarding-modulo.js — tour de primera ejecución (4 pasos, 1 vez por usuario).
// Convención IIFE + botón: se auto-registra en el grupo App y muestra un
// diálogo secuencial: Hoy → Luna → Bitácora → Respaldo. Sin dependencias.
(function () {
  'use strict';
  var KEY = 'cal13-onboarding-v2';
  function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; } }
  function mark() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }

  var STEPS = [
    { t: '◉ Hoy', i: '🌅🧭', d: 'El botón «Ir a hoy» te lleva a la luna y el día actual. El reloj vive en hora de Penco (America/Santiago).' },
    { t: '🌙 Luna', i: '🌑🌒🌓🌔🌕', d: 'Cada luna tiene 28 días con fase e iluminación. Las 4 vistas (Luna, Semana lunar, Mes, Semana) cambian arriba de la grilla.' },
    { t: '📓 Bitácora', i: '📓✍️🔔', d: 'Toca cualquier día para abrir su ficha: notas, compromisos con 🔔, ánimo y frase del día. Todo queda privado y local.' },
    { t: '⚖️ Legal', i: '⚖️🔒', d: 'Lee Términos y Privacidad en el pie de página o en Comunidad → ⚖️ Legal. Salud y emergencias son solo orientación: verifica SHOA/SENAPRED y llama al 131/132/133 si lo necesitas.' },
    { t: '💾 Respaldo', i: '💾🤝', d: 'En Comunidad → App: «Respaldo» exporta tus datos y «Restaurar» los recupera. Haz uno hoy y repite cada luna.' }
  ];

  function show(step) {
    var s = STEPS[step];
    var box = document.createElement('div');
    box.id = 'onbBox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Guía inicial paso ' + (step + 1) + ' de ' + STEPS.length);
    box.style.cssText = 'position:fixed;z-index:99998;left:50%;bottom:18px;transform:translateX(-50%);max-width:min(440px,92vw);background:#161e3f;border:1px solid #e8c56a55;border-radius:12px;padding:14px 16px;color:#e8ecff;font-family:system-ui;box-shadow:0 8px 30px #000a';
    box.innerHTML = '<div class="su-5f8763" aria-hidden="true"></div><b></b><p class="su-829f7d"></p>' +
      '<div class="su-1ef9ff">' +
      '<span class="muted su-11a508"></span>' +
      '<span class="su-a76d59"><button class="btn su-30e741" data-a="skip">Omitir</button>' +
      '<button class="btn btn-accent su-30e741" data-a="next"></button></span></div>';
    box.querySelector('div').textContent = s.i || '🧭';
    box.querySelector('b').textContent = s.t;
    box.querySelector('p').textContent = s.d;
    box.querySelector('.muted').textContent = 'Paso ' + (step + 1) + '/' + STEPS.length + ' · Guía inicial';
    box.querySelector('[data-a="next"]').textContent = step === STEPS.length - 1 ? '¡Empezar! ✓' : 'Siguiente →';
    function close() { try { box.remove(); } catch (e) {} }
    box.querySelector('[data-a="skip"]').onclick = function () { mark(); close(); };
    box.querySelector('[data-a="next"]').onclick = function () {
      close();
      if (step + 1 < STEPS.length) show(step + 1);
      else {
        mark();
        try {
          var el = document.getElementById('statusMsg');
          if (el) el.textContent = '✓ Guía lista — busca funciones con 🔍 (Ctrl+K).';
        } catch (e) {}
      }
    };
    document.body.appendChild(box);
    try { box.querySelector('[data-a="next"]').focus(); } catch (e) {}
  }

  // Usuario que vuelve: si ya hay datos (respaldo hecho, blob con uso o
  // bitácoras en el store propio), no se auto-muestra (el botón Guía sigue
  // disponible para re-verlo). Solo auto para instalación fresca.
  function tieneDatosSync() {
    try {
      if (localStorage.getItem('cal13-ultimo-respaldo')) return true;
      var d = localStorage.getItem('cal13-data');
      if (d && d.length > 2000) return true; // sobre + uso real (fresco ≈ 100B)
    } catch (e) {}
    return false;
  }
  function maybeAuto() {
    if (seen()) return;
    if (tieneDatosSync()) { mark(); return; }
    // Bitácoras migradas al store propio también cuentan (async).
    try {
      if (window.cal13idb && window.cal13idb.bitacorasContar) {
        window.cal13idb.bitacorasContar().then(function (n) {
          if (n > 0) { mark(); return; }
          esperarPintado();
        }).catch(function () { esperarPintado(); });
        return;
      }
    } catch (e) {}
    esperarPintado();
  }

  function esperarPintado() {
    // Espera al calendario pintado para no tapar el splash.
    var t = setInterval(function () {
      try {
        if (window.__calReady || (document.getElementById('grid') || {}).children.length) {
          clearInterval(t);
          setTimeout(function () { if (!seen() && !tieneDatosSync()) show(0); }, 1200);
        }
      } catch (e) { clearInterval(t); }
    }, 800);
    setTimeout(function () { try { clearInterval(t); } catch (e) {} }, 30000);
  }

  function replay() { show(0); }

  // Botón «Guía inicial» en Comunidad → App (idempotente).
  function addBtn() {
    try {
      if (document.getElementById('btnOnboarding')) return;
      var anchor = document.getElementById('btnShortcut');
      if (!anchor || !anchor.parentElement) return;
      var b = document.createElement('button');
      b.id = 'btnOnboarding';
      b.className = 'btn';
      b.setAttribute('data-sub', 'app');
      b.setAttribute('data-keywords', 'guia inicial tour ayuda como usar empezar onboarding primera vez');
      b.textContent = '🧭 Guía inicial';
      b.onclick = replay;
      anchor.parentElement.insertBefore(b, anchor);
    } catch (e) {}
  }

  window.cal13onboarding = { show: replay };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { addBtn(); maybeAuto(); });
  else { addBtn(); maybeAuto(); }
})();
