// dialogo-tamano.js — Secciones con tamaño nativo en PC (dialogs <dialog>).
// - Sin botón ⛶ Agrandar ni tirador ⤡ custom: solo el resize nativo de la
//   esquina inferior derecha (CSS `resize: both`).
// - Se guarda SOLO la elección de la persona (gesto real iniciado sobre el
//   tirador) y se aplica igual a TODAS las secciones
//   (DATA.config.dialogSize + caché localStorage). Abrir/cerrar o cambios de
//   contenido jamás se guardan: la sección no se agranda sola.
// - Solo en PC: puntero fino + ancho > 920px. En móvil no aplica tamaño.
// - Solo la ✕ de cerrar queda flotante en la misma posición (fixed en la
//   esquina superior derecha del diálogo), visible aunque se baje el scroll.
//   El título se desplaza normal.
(function () {
  'use strict';
  var LS_KEY = 'cal13-dialog-size-v1';
  var MIN_W = 340, MIN_H = 240;

  function isPC() {
    try {
      var fine = window.matchMedia('(pointer:fine)').matches;
      var wide = window.matchMedia('(min-width: 921px)').matches;
      return fine && wide;
    } catch (e) { return window.innerWidth > 920; }
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function readLS() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object') return null;
      return o;
    } catch (e) { return null; }
  }

  function getSaved() {
    // Fuente de verdad: DATA.config. Compat: ignora `expanded` legacy,
    // solo importan w/h.
    try {
      if (typeof DATA !== 'undefined' && DATA && DATA.config && DATA.config.dialogSize) {
        var d = DATA.config.dialogSize;
        return { w: +d.w || 0, h: +d.h || 0 };
      }
    } catch (e) {}
    var ls = readLS();
    if (ls) return { w: +ls.w || 0, h: +ls.h || 0 };
    return { w: 0, h: 0 };
  }

  function persist(s) {
    var clean = { w: Math.round(+s.w || 0), h: Math.round(+s.h || 0) };
    try { localStorage.setItem(LS_KEY, JSON.stringify(clean)); } catch (e) {}
    try {
      if (typeof DATA !== 'undefined') {
        DATA.config = DATA.config || {};
        DATA.config.dialogSize = clean;
        if (typeof scheduleSave === 'function') scheduleSave('Tamaño de ventana guardado ✓');
      }
    } catch (e) {}
  }

  function maxBounds() {
    return { w: Math.floor(window.innerWidth * 0.96), h: Math.floor(window.innerHeight * 0.92) };
  }

  function applyToDialog(dlg, s) {
    if (!dlg || !dlg.classList.contains('dlg-resizable')) return;
    var b = maxBounds();
    if (s.w > 0 && s.h > 0) {
      dlg.style.width = clamp(s.w, MIN_W, b.w) + 'px';
      dlg.style.height = clamp(s.h, MIN_H, b.h) + 'px';
    } else {
      dlg.style.width = '';
      dlg.style.height = '';
    }
    // Marca el tamaño resultante: el ResizeObserver lo verá como eco de
    // nuestro propio apply y NO lo re-guardará (evita que crezca solo).
    // Se mide post-apply (reflow sincrónico) para que valga con cualquier
    // box-sizing (incluye padding/borde si los hay).
    try {
      var nr = dlg.getBoundingClientRect();
      if (nr && nr.width && nr.height) {
        appliedSize.set(dlg, { w: Math.round(nr.width), h: Math.round(nr.height) });
      } else {
        appliedSize.delete(dlg);
      }
    } catch (e) {}
  }

  function applyToAll() {
    if (!isPC()) return;
    var s = getSaved();
    document.querySelectorAll('dialog.dlg-resizable').forEach(function (d) { applyToDialog(d, s); });
  }

  function setAndBroadcast(s) {
    persist(s);
    applyToAll();
  }

  // Guarda SOLO la elección de la persona: gesto real con inicio sobre el
  // tirador NATIVO (esquina inferior derecha). ResizeObserver avisa en cada
  // paso; se persiste con debounce cuando el tamaño se estabiliza.
  // - Abrir/cerrar/contenido/apply programático NO se guarda (no hubo gesto):
  //   así la sección jamás se agranda sola; solo re-marca su base.
  // - El eco del propio apply también se ignora (doble seguro).
  var ro = null;
  var pending = new Map(); // dlg -> timeoutId
  var appliedSize = new Map(); // dlg -> {w,h} resultantes del último apply
  var gripPress = null; // {t, dlg} del último pointerdown sobre el tirador
  function gripZone(dlg, x, y) {
    try {
      var r = dlg.getBoundingClientRect();
      if (!r || !r.width || !r.height) return false;
      var p = 64, m = 14;
      return x >= r.right - p && x <= r.right + m && y >= r.bottom - p && y <= r.bottom + m;
    } catch (e) { return false; }
  }
  function notePointerDown(x, y) {
    gripPress = null;
    try {
      var list = document.querySelectorAll('dialog.dlg-resizable[open], dialog[open]');
      (list || []).forEach(function (d) {
        try { if (gripZone(d, x, y)) gripPress = { t: Date.now(), dlg: d }; } catch (e) {}
      });
    } catch (e) {}
    try {
      if (!gripPress && document.body && document.body.children) {
        Array.prototype.forEach.call(document.body.children, function (d) {
          try {
            if (d && d.tagName === 'DIALOG' && d.open && gripZone(d, x, y)) {
              gripPress = { t: Date.now(), dlg: d };
            }
          } catch (e2) {}
        });
      }
    } catch (e3) {}
  }
  try {
    window.addEventListener('pointerdown', function (ev) {
      try { notePointerDown(ev.clientX, ev.clientY); } catch (e) {}
    }, true);
  } catch (e) {}
  function isGripGesture(t) {
    try {
      if (!gripPress || gripPress.dlg !== t) return false;
      if (Date.now() - gripPress.t > 15000) return false;
      return true;
    } catch (e) { return false; }
  }
  function checkResizeEntry(t) {
    try {
      if (!isPC()) return;
      if (!t || !t.classList || !t.classList.contains('dlg-resizable')) return;
      if (!t.open && !t.hasAttribute('open')) return;
      var r = t.getBoundingClientRect();
      var b = maxBounds();
      // Ignora tamaños transitorios mínimos (diálogo recién abierto).
      if (!r || !r.width || !r.height) return;
      try {
        var prev = appliedSize.get(t);
        if (prev && Math.abs(r.width - prev.w) < 2 && Math.abs(r.height - prev.h) < 2) return; // eco propio
      } catch (e0) {}
      // Sin gesto en el tirador no se guarda nada (abrir/cerrar/contenido):
      // solo se re-marca la base para que no derive.
      if (!isGripGesture(t)) {
        try { appliedSize.set(t, { w: Math.round(r.width), h: Math.round(r.height) }); } catch (e1) {}
        return;
      }
      var w = clamp(Math.round(r.width), MIN_W, b.w);
      var h = clamp(Math.round(r.height), MIN_H, b.h);
      // Solo persiste si difiere de lo guardado (evita bucles).
      var cur = getSaved();
      if (cur.w === w && cur.h === h) return;
      if (Math.abs(cur.w - w) < 2 && Math.abs(cur.h - h) < 2) return;
      t.classList.remove('dlg-expanded');
      setAndBroadcast({ w: w, h: h });
    } catch (e) {}
  }
  function observeNative(dlg) {
    if (typeof ResizeObserver === 'undefined') return;
    // Evita doble observación del mismo diálogo.
    if (dlg.dataset.dlgSizeObserved === '1') return;
    dlg.dataset.dlgSizeObserved = '1';
    try {
      if (!ro) {
        var RO = ResizeObserver;
        ro = new RO(function (entries) {
          if (!isPC()) return;
          entries.forEach(function (en) {
            var t = en.target;
            if (!t || !t.classList || !t.classList.contains('dlg-resizable')) return;
            // La ✕ flotante sigue pegada a la esquina aunque cambie el tamaño.
            try { positionFloats(); } catch (e0) {}
            if (!t.open && !t.hasAttribute('open')) return;
            if (pending.has(t)) {
              try { clearTimeout(pending.get(t)); } catch (e) {}
            }
            var id = setTimeout(function () {
              pending.delete(t);
              checkResizeEntry(t);
            }, 450);
            pending.set(t, id);
          });
        });
      }
      ro.observe(dlg);
    } catch (e) {}
  }

  function isExcluded(dlg) {
    try {
      // Sudokus/crucigramas a pantalla completa gestionan su propio tamaño
      // y su appbar ya deja la ✕ visible (no se flota ni redimensiona).
      if (dlg.classList.contains('sk-full') || dlg.classList.contains('cr-full')) return true;
    } catch (e) {}
    return false;
  }

  // --- Solo la ✕ flotante (el título sigue su scroll normal) ---
  function findTopClose(dlg) {
    // 1) Selectores directos (navegador real).
    try {
      var sels = [
        'form > .dlg-actions:first-child > button[title="Cerrar"]',
        'form > .dlg-actions:first-child > button[aria-label="Cerrar"]',
        'form > .dlg-actions:first-child > button[id$="CloseTop"]',
        'form > .dlg-actions:first-child > [data-close]',
        '.dlg-actions:first-child > button'
      ];
      for (var i = 0; i < sels.length; i++) {
        var b = dlg.querySelector(sels[i]);
        if (b) return b;
      }
    } catch (e) {}
    // 2) Recorrido manual (robustez + DOMs mínimos de test).
    try {
      var form = (dlg.querySelector && dlg.querySelector('form')) || dlg;
      var kids = form.children || [];
      for (var k = 0; k < kids.length; k++) {
        var head = kids[k];
        if (!head || !head.classList || !head.classList.contains('dlg-actions')) continue;
        var btns = head.children || [];
        for (var j = 0; j < btns.length; j++) {
          var c = btns[j];
          if (c && c.tagName === 'BUTTON') return c;
        }
        break; // solo la primera fila de acciones
      }
    } catch (e2) {}
    return null;
  }

  function placeFloat(dlg, btn) {
    try {
      var r = dlg.getBoundingClientRect();
      if (!r || !r.width || !r.height) return;
      var vw = window.innerWidth || 1280;
      var top = (r.top != null ? r.top : (r.y || 0));
      var right = (r.right != null ? r.right : ((r.x != null ? r.x : (r.left || 0)) + (r.width || 0)));
      btn.style.top = Math.max(8, Math.round(top + 10)) + 'px';
      btn.style.right = Math.max(8, Math.round(vw - right + 10)) + 'px';
    } catch (e) {}
  }

  function pinClose(dlg) {
    if (!dlg || isExcluded(dlg)) return;
    var btn = findTopClose(dlg);
    if (!btn) return;
    try {
      if (!btn.classList.contains('dlg-close-float')) btn.classList.add('dlg-close-float');
    } catch (e) {}
    placeFloat(dlg, btn);
    // El rect del diálogo no se mueve con su scroll interno, pero se
    // reposiciona igual por seguridad (zoom/rotación).
    try {
      if (!dlg.dataset.dlgCloseScrollBound) {
        dlg.dataset.dlgCloseScrollBound = '1';
        dlg.addEventListener('scroll', function () { placeFloat(dlg, btn); }, { passive: true });
      }
    } catch (e2) {}
  }

  function positionFloats() {
    try {
      var list = document.querySelectorAll('dialog.dlg-resizable[open], dialog[open]');
      (list || []).forEach(function (d) {
        try {
          var b = d.querySelector('.dlg-close-float');
          if (b) placeFloat(d, b);
        } catch (e) {}
      });
    } catch (e) {}
    // Fallback para DOMs mínimos sin selector de atributo [open].
    try {
      if (document.body && document.body.children) {
        Array.prototype.forEach.call(document.body.children, function (d) {
          try {
            if (d && d.tagName === 'DIALOG' && d.open) {
              var b2 = d.querySelector('.dlg-close-float');
              if (b2) placeFloat(d, b2);
            }
          } catch (e2) {}
        });
      }
    } catch (e3) {}
  }

  function cleanupLegacy(dlg) {
    try {
      dlg.classList.remove('dlg-expanded');
      var ex = dlg.querySelector('.dlg-expand-btn');
      if (ex && ex.parentNode) ex.parentNode.removeChild(ex);
      var gr = dlg.querySelector('.dlg-resize-handle');
      if (gr && gr.parentNode) gr.parentNode.removeChild(gr);
    } catch (e) {}
    // Limpieza legacy también dentro del form (botones inyectados ahí).
    try {
      var host = dlg.querySelector('form');
      if (host) {
        host.querySelectorAll('.dlg-expand-btn,.dlg-resize-handle').forEach(function (n) {
          try { n.parentNode && n.parentNode.removeChild(n); } catch (e2) {}
        });
      }
    } catch (e) {}
  }

  function enhance(dlg) {
    if (!dlg) return;
    cleanupLegacy(dlg);
    if (isExcluded(dlg)) return;
    pinClose(dlg); // siempre (PC + móvil): solo la ✕ flotante
    if (!isPC()) return; // el tamaño guardado, solo en PC
    if (dlg.dataset.dlgSizeBound !== '1') dlg.dataset.dlgSizeBound = '1';
    dlg.classList.add('dlg-resizable');
    applyToDialog(dlg, getSaved());
    observeNative(dlg);
    pinClose(dlg); // reposiciona tras aplicar el tamaño guardado
  }

  function enhanceAll() {
    // Limpieza legacy siempre (aunque sea móvil); tamaño solo en PC.
    document.querySelectorAll('dialog').forEach(enhance);
    applyToAll();
  }

  // Parchea showModal/show para aplicar tamaño justo al abrir (todas las secciones pasan por aquí).
  try {
    var proto = window.HTMLDialogElement && HTMLDialogElement.prototype;
    if (proto && !proto.__dlgSizePatched) {
      proto.__dlgSizePatched = true;
      var origModal = proto.showModal;
      var origShow = proto.show;
      proto.showModal = function () {
        try { enhance(this); if (isPC()) applyToDialog(this, getSaved()); } catch (e) {}
        var r = origModal.apply(this, arguments);
        try { pinClose(this); } catch (e2) {}
        return r;
      };
      if (origShow) {
        proto.show = function () {
          try { enhance(this); if (isPC()) applyToDialog(this, getSaved()); } catch (e) {}
          var r2 = origShow.apply(this, arguments);
          try { pinClose(this); } catch (e3) {}
          return r2;
        };
      }
    }
  } catch (e) {}

  // Diálogos inyectados tarde (templates-bundled) + cambios PC/móvil.
  try {
    var obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        (m.addedNodes || []).forEach(function (n) {
          if (!n || n.nodeType !== 1) return;
          try {
            if (n.tagName === 'DIALOG') enhance(n);
            else if (n.querySelectorAll) n.querySelectorAll('dialog').forEach(enhance);
          } catch (e2) {}
        });
      });
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  try {
    window.addEventListener('resize', function () {
      try { positionFloats(); } catch (e0) {}
      if (!isPC()) return;
      // Re-clampea diálogos abiertos al rotar/cambiar ventana.
      applyToAll();
      try { positionFloats(); } catch (e1) {}
    });
    window.addEventListener('scroll', function () {
      try { positionFloats(); } catch (e2) {}
    }, true);
  } catch (e) {}

  // Exponer reset + API para Ajustes/consola/tests.
  try {
    window.__dlgSizeReset = function () {
      setAndBroadcast({ w: 0, h: 0 });
    };
    window.__dlgSize = {
      getSaved: getSaved,
      setAndBroadcast: setAndBroadcast,
      applyToAll: applyToAll,
      checkResize: checkResizeEntry,
      // Hook de test/consola: simula el inicio del gesto sobre el tirador.
      _testGrip: function (dlg) {
        try { gripPress = { t: Date.now(), dlg: dlg }; } catch (e) {}
      },
      // Hook de test/consola: simula una pulsación fuera del tirador
      // (en la app real, cada pointerdown reinicia el gesto).
      _testPressElsewhere: function () {
        try { gripPress = null; } catch (e) {}
      }
    };
  } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceAll);
  } else {
    enhanceAll();
  }
  // Segundo pase: DATA.config puede llegar después (carga async) → re-aplica.
  setTimeout(enhanceAll, 800);
  setTimeout(enhanceAll, 2500);
})();
