// onboarding-modulo.js — tour de primera ejecución (4 pasos, 1 vez por usuario).
// Convención IIFE + botón: se auto-registra en el grupo App y muestra un
// diálogo secuencial: Hoy → Luna → Bitácora → Respaldo. Sin dependencias.
(function () {
  'use strict';
  var KEY = 'cal13-onboarding-v1';
  function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; } }
  function mark() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }

  var STEPS = [
    { t: '◉ Hoy', d: 'El botón «Ir a hoy» te lleva a la luna y el día actual. El reloj vive en hora de Penco (America/Santiago).' },
    { t: '🌙 Luna', d: 'Cada luna tiene 28 días con fase e iluminación. Las 4 vistas (Luna, Semana lunar, Mes, Semana) cambian arriba de la grilla.' },
    { t: '📓 Bitácora', d: 'Toca cualquier día para abrir su ficha: notas, compromisos con 🔔, ánimo y frase del día. Todo queda privado y local.' },
    { t: '💾 Respaldo', d: 'En Comunidad → App: «Respaldo» exporta tus datos y «Restaurar» los recupera. Haz uno hoy y repite cada luna.' }
  ];

  function show(step) {
    var s = STEPS[step];
    var box = document.createElement('div');
    box.id = 'onbBox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Guía inicial paso ' + (step + 1) + ' de ' + STEPS.length);
    box.style.cssText = 'position:fixed;z-index:99998;left:50%;bottom:18px;transform:translateX(-50%);max-width:min(440px,92vw);background:#161e3f;border:1px solid #e8c56a55;border-radius:12px;padding:14px 16px;color:#e8ecff;font-family:system-ui;box-shadow:0 8px 30px #000a';
    box.innerHTML = '<b></b><p style="font-size:13px;line-height:1.5;margin:8px 0 12px"></p>' +
      '<div style="display:flex;gap:8px;justify-content:space-between;align-items:center">' +
      '<span class="muted" style="font-size:11px"></span>' +
      '<span style="display:flex;gap:8px"><button class="btn" data-a="skip" style="width:auto">Omitir</button>' +
      '<button class="btn btn-accent" data-a="next" style="width:auto"></button></span></div>';
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

  function maybeAuto() {
    if (seen()) return;
    // Espera al calendario pintado para no tapar el splash.
    var t = setInterval(function () {
      try {
        if (window.__calReady || (document.getElementById('grid') || {}).children.length) {
          clearInterval(t);
          setTimeout(function () { if (!seen()) show(0); }, 1200);
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
