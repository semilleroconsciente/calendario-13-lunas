// sw-registro.js — extraido de index.html (CSP fase 1: sin <script> inline).
// 1) Limpieza file://: si un SW de una version anterior quedo registrado,
//    desregistrarlo y borrar caches cal13, luego recargar.
//    La limpieza principal la hace main.js antes de abrir la ventana.
// 2) Registro del Service Worker solo en web http(s). En Electron (file://)
//    se omite: el calendario abre local sin depender de cache ni internet.
//    Si hay una version nueva del SW, se avisa con boton (SKIP_WAITING).
(function () {
  try {
    if (location.protocol === 'file:' && 'serviceWorker' in navigator) {
      var __swClean = function () {
        try {
          navigator.serviceWorker.getRegistrations().then(function (regs) {
            var controlled = !!navigator.serviceWorker.controller;
            if (!regs.length && !controlled) return;
            var ps = regs.map(function (r) { try { return r.unregister(); } catch (e) { return null; } });
            var cs = null;
            try {
              cs = caches.keys().then(function (keys) {
                return Promise.all(keys.filter(function (k) { return k.indexOf('cal13-') === 0; }).map(function (k) { return caches.delete(k); }));
              });
            } catch (e) { cs = null; }
            Promise.all(ps.concat([cs])).then(function () {
              try { if (navigator.serviceWorker.controller) location.reload(); } catch (e) {}
            }).catch(function () {});
          }).catch(function () {});
        } catch (e) {}
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', __swClean);
      else __swClean();
    }
  } catch (e) {}
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        try {
          reg.addEventListener('updatefound', function () {
            var nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', function () {
              try {
                if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                  var el = document.getElementById('statusMsg');
                  if (!el || document.getElementById('swUpdateBtn')) return;
                  var b = document.createElement('button');
                  b.id = 'swUpdateBtn';
                  b.className = 'btn btn-accent'; b.style.width = 'auto';
                  b.textContent = '⬆ Nueva versión disponible — actualizar';
                  b.onclick = function () { try { nw.postMessage({ type: 'SKIP_WAITING' }); } catch (e) {} };
                  el.appendChild(b);
                }
              } catch (e) {}
            });
          });
        } catch (e) {}
      }).catch(function () {});
      try {
        var reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
          if (reloaded) return; reloaded = true;
          window.location.reload();
        });
      } catch (e) {}
    });
  }
})();
