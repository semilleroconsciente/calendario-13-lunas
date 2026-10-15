// zoom-calendario.js — Zoom del calendario en PC con Ctrl+Rueda del mouse.
// - Solo PC: puntero fino + ancho > 920px. En móvil no hace nada.
// - Ctrl+rueda SOBRE el calendario (#gridWrap) agranda/achica la cuadrícula
//   e impide el zoom del navegador en esa zona (listener no-passive).
// - Atajos: Ctrl + '+' / '-' ajustan, Ctrl + '0' restablece al 100%.
// - Rango 60%–180%, paso 10% con rueda y 10% con teclado. Persiste en
//   DATA.config.calZoom (scheduleSave, con debounce) + localStorage
//   'cal13-cal-zoom-v1' para aplicar antes de cargar DATA.
// - Se aplica con la propiedad CSS `zoom` sobre #gridWrap: escala las
//   tarjetas sin romper el layout y sobrevive a los re-render del grid.
// - Insignia flotante con el % + botones A- / A+ / 1:1 (descubrible y
//   accesible por teclado/táctil). Expone window.__calZoom {get,set,reset}.
(function () {
  'use strict';
  var LS_KEY = 'cal13-cal-zoom-v1';
  var MIN = 0.6, MAX = 1.8, STEP = 0.1;
  var HINT = 'Ctrl + rueda para cambiar el tamaño · Ctrl + 0 restablece';

  function isPC() {
    try {
      var fine = window.matchMedia('(pointer:fine)').matches;
      var wide = window.matchMedia('(min-width: 921px)').matches;
      return fine && wide;
    } catch (e) { return window.innerWidth > 920; }
  }

  function clamp(n) {
    n = +n || 1;
    if (n < MIN) return MIN;
    if (n > MAX) return MAX;
    return Math.round(n * 100) / 100;
  }

  function readLS() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw === null || raw === undefined || raw === '') return 0;
      var v = parseFloat(raw);
      return isFinite(v) ? v : 0;
    } catch (e) { return 0; }
  }

  function getSaved() {
    try {
      if (typeof DATA !== 'undefined' && DATA && DATA.config && DATA.config.calZoom) {
        var d = parseFloat(DATA.config.calZoom);
        if (isFinite(d) && d > 0) return clamp(d);
      }
    } catch (e) {}
    var ls = readLS();
    if (ls > 0) return clamp(ls);
    return 1;
  }

  var saveTimer = null;
  function persist(z, instant) {
    try { localStorage.setItem(LS_KEY, String(z)); } catch (e) {}
    var flush = function () {
      saveTimer = null;
      try {
        if (typeof DATA !== 'undefined') {
          DATA.config = DATA.config || {};
          if (DATA.config.calZoom !== z) {
            DATA.config.calZoom = z;
            if (typeof scheduleSave === 'function') scheduleSave('Tamaño del calendario guardado ✓');
          }
        }
      } catch (e) {}
    };
    if (instant) {
      if (saveTimer) { try { clearTimeout(saveTimer); } catch (e) {} saveTimer = null; }
      flush();
    } else if (!saveTimer) {
      try { saveTimer = setTimeout(flush, 800); } catch (e) { flush(); }
    }
  }

  function gridWrap() {
    try { return document.getElementById('gridWrap'); } catch (e) { return null; }
  }

  function apply(z) {
    var gw = gridWrap();
    if (!gw) return z;
    if (!isPC()) {
      try { gw.style.zoom = ''; gw.removeAttribute('data-cal-zoom'); } catch (e) {}
      return 1;
    }
    z = clamp(z);
    try {
      gw.style.zoom = (z === 1) ? '' : String(z);
      gw.setAttribute('data-cal-zoom', String(Math.round(z * 100)));
      if (!gw.title || gw.title.indexOf('Ctrl') === -1) gw.title = HINT;
    } catch (e) {}
    showBadge(z);
    return z;
  }

  var badge = null, badgeTimer = null;
  function ensureBadge() {
    if (badge && badge.isConnected) return badge;
    try {
      badge = document.getElementById('calZoomBadge');
      if (badge) return badge;
      badge = document.createElement('div');
      badge.id = 'calZoomBadge';
      badge.setAttribute('role', 'status');
      badge.setAttribute('aria-live', 'polite');
      var main = null;
      try { main = document.getElementById('main') || document.body; } catch (e) { main = document.body; }
      (main || document.body).appendChild(badge);
      badge.addEventListener('click', function (ev) {
        try {
          var b = ev.target && ev.target.closest ? ev.target.closest('[data-zoom-act]') : null;
          if (!b) return;
          ev.preventDefault(); ev.stopPropagation();
          var cur = getSaved();
          if (b.getAttribute('data-zoom-act') === 'in') setZoom(clamp(cur + STEP), true);
          else if (b.getAttribute('data-zoom-act') === 'out') setZoom(clamp(cur - STEP), true);
          else if (b.getAttribute('data-zoom-act') === 'reset') setZoom(1, true);
        } catch (e) {}
      });
      return badge;
    } catch (e) { return null; }
  }

  function showBadge(z) {
    if (!isPC()) return;
    var b = ensureBadge();
    if (!b) return;
    try {
      var pct = Math.round(z * 100);
      b.innerHTML = '';
      var t = document.createElement('span');
      t.textContent = '🔍 Calendario ' + pct + '%';
      b.appendChild(t);
      var mk = function (act, label, title) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cal-zoom-btn';
        btn.setAttribute('data-zoom-act', act);
        btn.textContent = label;
        btn.title = title;
        btn.setAttribute('aria-label', title);
        return btn;
      };
      b.appendChild(mk('out', 'A−', 'Achicar calendario (Ctrl + −)'));
      b.appendChild(mk('reset', '100%', 'Restablecer al 100% (Ctrl + 0)'));
      b.appendChild(mk('in', 'A+', 'Agrandar calendario (Ctrl + +)'));
      b.classList.add('show');
      var sm = null;
      try { sm = document.getElementById('statusMsg'); } catch (e) {}
      if (sm) {
        try {
          sm.textContent = '🔍 Calendario ' + pct + '% · Ctrl+0 restablece';
          if (showBadge._t) { try { clearTimeout(showBadge._t); } catch (e2) {} }
          showBadge._t = setTimeout(function () { try { if (sm.textContent.indexOf('Calendario') === 2) sm.textContent = ''; } catch (e3) {} }, 2500);
        } catch (e) {}
      }
      if (badgeTimer) { try { clearTimeout(badgeTimer); } catch (e) {} }
      badgeTimer = setTimeout(function () { try { b.classList.remove('show'); } catch (e) {} }, 2200);
    } catch (e) {}
  }

  function setZoom(z, fromUI) {
    z = clamp(z);
    persist(z, !!fromUI);
    return apply(z);
  }

  function overCalendar(ev) {
    try {
      if (!ev || !ev.target || !ev.target.closest) return false;
      return !!ev.target.closest('#gridWrap');
    } catch (e) { return false; }
  }

  function onWheel(ev) {
    if (!ev || !ev.ctrlKey) return; // sin Ctrl: scroll normal
    if (!isPC()) return;
    if (!overCalendar(ev)) return; // fuera del calendario: zoom del navegador intacto
    try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
    var z = getSaved();
    var dir = (ev.deltaY || 0) > 0 ? -1 : 1; // rueda arriba = agrandar
    if (typeof ev.deltaY !== 'number' || ev.deltaY === 0) return;
    setZoom(clamp(Math.round((z + dir * STEP) * 100) / 100), false);
  }

  function inField(el) {
    try {
      if (!el || !el.tagName) return false;
      var t = el.tagName.toUpperCase();
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return true;
      return !!(el.isContentEditable);
    } catch (e) { return false; }
  }

  function onKey(ev) {
    if (!ev || !ev.ctrlKey || ev.altKey || ev.metaKey) return;
    if (!isPC()) return;
    var k = ev.key;
    var plus = (k === '+' || k === '=' || k === 'Add');
    var minus = (k === '-' || k === '_' || k === 'Subtract');
    var zero = (k === '0' || k === 'Numpad0');
    if (!plus && !minus && !zero) return;
    if (inField(ev.target)) return; // no robar Ctrl+0 / +/- en formularios
    try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
    var z = getSaved();
    if (plus) setZoom(clamp(z + STEP), true);
    else if (minus) setZoom(clamp(z - STEP), true);
    else setZoom(1, true);
  }

  function init() {
    if (!isPC()) return;
    try { apply(getSaved()); } catch (e) {}
    try {
      // capture + non-passive: imprescindible para frenar el zoom del navegador.
      window.addEventListener('wheel', onWheel, { capture: true, passive: false });
    } catch (e) {
      try { window.addEventListener('wheel', onWheel, true); } catch (e2) {}
    }
    try { window.addEventListener('keydown', onKey, true); } catch (e) {}
  }

  try {
    window.__calZoom = {
      get: getSaved,
      set: function (v) { return setZoom(v, true); },
      reset: function () { return setZoom(1, true); }
    };
    window.__calZoomReset = function () { return setZoom(1, true); };
  } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Segundo pase: DATA.config puede llegar después (carga async) → re-aplica.
  setTimeout(function () { try { if (isPC()) apply(getSaved()); } catch (e) {} }, 800);
  setTimeout(function () { try { if (isPC()) apply(getSaved()); } catch (e) {} }, 2500);
})();
