// accesibilidad-modulo.js — parches A11y sin tocar renderer.js (990 KB).
// 1) Sincroniza aria-expanded en los 7 <details.action-group>.
// 2) Trampa de foco liviana en <dialog> abiertos (Tab no escapa).
// 3) Respeta prefers-reduced-motion (desactiva animaciones).
(function () {
  'use strict';
  function syncDetails() {
    try {
      document.querySelectorAll('details.action-group').forEach(function (d) {
        var s = d.querySelector('summary');
        if (!s) return;
        if (!s.hasAttribute('tabindex')) s.setAttribute('tabindex', '0');
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
  function focusTrap() {
    try {
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var dlg = null;
        try {
          dlg = document.querySelector('dialog[open]');
        } catch (_) { return; }
        if (!dlg) return;
        var f = dlg.querySelectorAll('button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])');
        f = Array.prototype.filter.call(f, function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      });
    } catch (e) {}
  }
  function reducedMotion() {
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var st = document.createElement('style');
        st.textContent = '*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}';
        document.head.appendChild(st);
      }
    } catch (e) {}
  }
  function init() { syncDetails(); focusTrap(); reducedMotion(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
