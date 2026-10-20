// accesibilidad-modulo.js — parches A11y.
// 1) aria-expanded en <details.action-group> (summary ya es focable nativo).
// 2) Gestión de foco en <dialog>: guarda trigger, foco inicial, devuelve foco al cerrar.
// 3) Trampa de foco robusta (sin offsetParent) + respeta prefers-reduced-motion.
(function () {
  'use strict';
  function syncDetails() {
    try {
      document.querySelectorAll('details.action-group').forEach(function (d) {
        var s = d.querySelector('summary');
        if (!s) return;
        if (s.hasAttribute('tabindex') && s.getAttribute('tabindex') === '0') s.removeAttribute('tabindex');
        s.setAttribute('aria-expanded', d.open ? 'true' : 'false');
        if (!d.dataset.a11y) {
          d.dataset.a11y = '1';
          d.addEventListener('toggle', function () {
            try { s.setAttribute('aria-expanded', d.open ? 'true' : 'false'); } catch (e) {}
          });
        }
      });
    } catch (e) {}
  }
  function isVisible(el) {
    try {
      if (!el || el.disabled) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      var r = el.getBoundingClientRect();
      if (!r || (r.width === 0 && r.height === 0)) return false;
      var cs = window.getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      return true;
    } catch (e) { return false; }
  }
  function focusables(dlg) {
    try {
      var list = dlg.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, a[href], [tabindex]:not([tabindex="-1"])');
      return Array.prototype.filter.call(list, isVisible);
    } catch (e) { return []; }
  }
  function focusTrap() {
    try {
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var dlg = null;
        try { dlg = document.querySelector('dialog[open]'); } catch (_) { return; }
        if (!dlg) return;
        var f = focusables(dlg);
        if (!f.length) { e.preventDefault(); return; }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      });
    } catch (e) {}
  }
  function patchDialogs() {
    try {
      var proto = window.HTMLDialogElement && HTMLDialogElement.prototype;
      if (proto && !proto.__a11yFocusPatched) {
        proto.__a11yFocusPatched = true;
        var origModal = proto.showModal;
        proto.showModal = function () {
          try {
            if (!this._a11yTrigger || !this._a11yTrigger.isConnected) {
              this._a11yTrigger = document.activeElement;
            }
          } catch (e) {}
          var r = origModal.apply(this, arguments);
          try {
            var t = this.querySelector('[autofocus]') || this.querySelector('#dlgCloseTop, #configCloseTop, [data-autofocus]') || focusables(this)[0];
            if (t) { try { t.focus({ preventScroll: true }); } catch (e2) { try { t.focus(); } catch (e3) {} } }
          } catch (e) {}
          return r;
        };
      }
      document.addEventListener('close', function (e) {
        var dlg = e.target;
        if (!dlg || dlg.tagName !== 'DIALOG') return;
        try {
          var trig = dlg._a11yTrigger;
          dlg._a11yTrigger = null;
          if (trig && trig.isConnected && document.contains(trig)) {
            try { trig.focus({ preventScroll: true }); } catch (e2) { try { trig.focus(); } catch (e3) {} }
          }
        } catch (e) {}
      }, true);
    } catch (e) {}
  }
  function ensureDialogNames() {
    try {
      document.querySelectorAll('dialog').forEach(function (dlg) {
        if (dlg.hasAttribute('aria-labelledby') || dlg.hasAttribute('aria-label')) return;
        var h = dlg.querySelector('h2, h3, h4');
        if (h) {
          if (!h.id) h.id = dlg.id + '-title';
          dlg.setAttribute('aria-labelledby', h.id);
        } else {
          dlg.setAttribute('aria-label', 'Diálogo');
        }
        if (!dlg.hasAttribute('aria-modal')) dlg.setAttribute('aria-modal', 'true');
      });
    } catch (e) {}
  }
  function reducedMotion() {
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var st = document.createElement('style');
        st.textContent = '*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}';
        document.head.appendChild(st);
      }
    } catch (e) {}
  }
  function init() {
    syncDetails(); focusTrap(); patchDialogs(); ensureDialogNames(); reducedMotion();
    try {
      var obs = new MutationObserver(function () { syncDetails(); ensureDialogNames(); });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
