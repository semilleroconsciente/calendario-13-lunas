// dialogo-tamano.js — Secciones agrandables en PC (dialogs <dialog>).
// - Agrega botón ⛶ Agrandar en la cabecera + tirador ⤡ en la esquina inferior derecha.
// - Arrastrar el tirador cambia el tamaño; doble clic en el tirador alterna agrandado.
// - El tamaño/agrandado se guarda una vez y se aplica igual a TODAS las secciones.
// - Solo en PC: puntero fino + ancho > 920px. En móvil no aparece ni afecta.
// - Persiste en DATA.config.dialogSize (scheduleSave) + caché localStorage para aplicar antes de cargar DATA.
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
    // 1) DATA.config (fuente de verdad por usuario) 2) localStorage (caché rápido)
    try {
      if (typeof DATA !== 'undefined' && DATA && DATA.config && DATA.config.dialogSize) {
        var d = DATA.config.dialogSize;
        return { w: +d.w || 0, h: +d.h || 0, expanded: !!d.expanded };
      }
    } catch (e) {}
    var ls = readLS();
    if (ls) return { w: +ls.w || 0, h: +ls.h || 0, expanded: !!ls.expanded };
    return { w: 0, h: 0, expanded: false };
  }

  function persist(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
    try {
      if (typeof DATA !== 'undefined') {
        DATA.config = DATA.config || {};
        DATA.config.dialogSize = { w: s.w, h: s.h, expanded: !!s.expanded };
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
    if (s.expanded) {
      dlg.classList.add('dlg-expanded');
      dlg.style.width = clamp(Math.max(s.w || 0, 900), MIN_W, b.w) + 'px';
      dlg.style.height = clamp(Math.max(s.h || 0, Math.floor(b.h * 0.92)), MIN_H, b.h) + 'px';
    } else {
      dlg.classList.remove('dlg-expanded');
      if (s.w > 0 && s.h > 0) {
        dlg.style.width = clamp(s.w, MIN_W, b.w) + 'px';
        dlg.style.height = clamp(s.h, MIN_H, b.h) + 'px';
      } else {
        dlg.style.width = '';
        dlg.style.height = '';
      }
    }
    var btn = dlg.querySelector(':scope > .dlg-expand-btn, form > .dlg-expand-btn');
    if (btn) {
      var exp = dlg.classList.contains('dlg-expanded');
      btn.textContent = exp ? '🗗' : '⛶';
      btn.title = exp ? 'Restaurar tamaño' : 'Agrandar sección';
      btn.setAttribute('aria-label', btn.title);
      btn.setAttribute('aria-pressed', exp ? 'true' : 'false');
    }
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

  function enhance(dlg) {
    if (!dlg || dlg.dataset.dlgSizeBound === '1') return;
    dlg.dataset.dlgSizeBound = '1';
    dlg.classList.add('dlg-resizable');

    // Botón ⛶ Agrandar: se ancla arriba a la derecha, junto a la ✕ si existe.
    var expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'dlg-expand-btn';
    expand.textContent = '⛶';
    expand.title = 'Agrandar sección';
    expand.setAttribute('aria-label', 'Agrandar sección');
    expand.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      var cur = getSaved();
      var nowExpanded = !dlg.classList.contains('dlg-expanded');
      if (nowExpanded) {
        // Guarda el tamaño actual como base y marca expandido grande.
        var r = dlg.getBoundingClientRect();
        var b = maxBounds();
        setAndBroadcast({
          w: clamp(Math.round(Math.max(r.width, 900)), MIN_W, b.w),
          h: clamp(Math.round(Math.max(r.height, b.h * 0.85)), MIN_H, b.h),
          expanded: true
        });
      } else {
        setAndBroadcast({ w: cur.w, h: cur.h, expanded: false });
      }
    });

    // Tirador ⤡ esquina inferior derecha: arrastrar para cambiar tamaño.
    var grip = document.createElement('button');
    grip.type = 'button';
    grip.className = 'dlg-resize-handle';
    grip.textContent = '⤡';
    grip.title = 'Arrastra o usa flechas para cambiar el tamaño (vale para todas las secciones)';
    grip.setAttribute('aria-label', 'Cambiar tamaño de la sección (flechas para ajustar, Enter para agrandar)');
    grip.addEventListener('keydown', function (ev) {
      if (!isPC()) return;
      var step = ev.shiftKey ? 40 : 16;
      var handled = true;
      try {
        var r = dlg.getBoundingClientRect();
        var b = maxBounds();
        var w = r.width, h = r.height;
        if (ev.key === 'ArrowRight') w += step;
        else if (ev.key === 'ArrowLeft') w -= step;
        else if (ev.key === 'ArrowDown') h += step;
        else if (ev.key === 'ArrowUp') h -= step;
        else if (ev.key === 'Enter') { expand.click(); return; }
        else handled = false;
        if (handled) {
          ev.preventDefault(); ev.stopPropagation();
          w = clamp(Math.round(w), MIN_W, b.w);
          h = clamp(Math.round(h), MIN_H, b.h);
          dlg.classList.remove('dlg-expanded');
          dlg.style.width = w + 'px';
          dlg.style.height = h + 'px';
          persist({ w: w, h: h, expanded: false });
        }
      } catch (e) {}
    });

    // Inserción: dentro del <form> si existe (respeta method=dialog), si no directo.
    var host = dlg.querySelector('form') || dlg;
    // Evita que el botón cierre el form method=dialog: es type=button y frena submit.
    host.appendChild(expand);
    host.appendChild(grip);

    // Doble clic en el tirador = agrandar/restaurar rápido.
    grip.addEventListener('dblclick', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      expand.click();
    });

    grip.addEventListener('pointerdown', function (ev) {
      if (!isPC()) return;
      ev.preventDefault(); ev.stopPropagation();
      try { grip.setPointerCapture(ev.pointerId); } catch (e) {}
      var startX = ev.clientX, startY = ev.clientY;
      var rect = dlg.getBoundingClientRect();
      var startW = rect.width, startH = rect.height;
      document.body.classList.add('dlg-resizing');

      function onMove(me) {
        var b = maxBounds();
        var w = clamp(Math.round(startW + (me.clientX - startX)), MIN_W, b.w);
        var h = clamp(Math.round(startH + (me.clientY - startY)), MIN_H, b.h);
        dlg.classList.remove('dlg-expanded');
        dlg.style.width = w + 'px';
        dlg.style.height = h + 'px';
        var btn = dlg.querySelector('.dlg-expand-btn');
        if (btn) { btn.textContent = '⛶'; btn.title = 'Agrandar sección'; btn.setAttribute('aria-label', 'Agrandar sección'); }
      }
      function onUp(ue) {
        try {
          grip.removeEventListener('pointermove', onMove);
          grip.removeEventListener('pointerup', onUp);
          grip.removeEventListener('pointercancel', onUp);
        } catch (e) {}
        document.body.classList.remove('dlg-resizing');
        var b2 = maxBounds();
        var r2 = dlg.getBoundingClientRect();
        setAndBroadcast({
          w: clamp(Math.round(r2.width), MIN_W, b2.w),
          h: clamp(Math.round(r2.height), MIN_H, b2.h),
          expanded: false
        });
        if (ue) { try { ue.preventDefault(); } catch (e2) {} }
      }
      grip.addEventListener('pointermove', onMove);
      grip.addEventListener('pointerup', onUp);
      grip.addEventListener('pointercancel', onUp);
    });

    // Al abrirse, aplica el tamaño guardado compartido.
    applyToDialog(dlg, getSaved());
  }

  function enhanceAll() {
    if (!isPC()) return;
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
        return origModal.apply(this, arguments);
      };
      if (origShow) {
        proto.show = function () {
          try { enhance(this); if (isPC()) applyToDialog(this, getSaved()); } catch (e) {}
          return origShow.apply(this, arguments);
        };
      }
    }
  } catch (e) {}

  // Diálogos inyectados tarde (templates-bundled) + cambios PC/móvil.
  try {
    var obs = new MutationObserver(function (muts) {
      if (!isPC()) return;
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
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
      if (!isPC()) return;
      // Re-clampea diálogos abiertos al rotar/cambiar ventana.
      applyToAll();
    });
  } catch (e) {}

  // Exponer reset para Ajustes/consola: window.__dlgSizeReset()
  try {
    window.__dlgSizeReset = function () {
      setAndBroadcast({ w: 0, h: 0, expanded: false });
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
