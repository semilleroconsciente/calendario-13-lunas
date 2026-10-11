// pwa-install.js — botón "Instalar app" (beforeinstallprompt).
// Sin dependencias. Solo visible cuando el navegador lo permite y la app
// no corre ya instalada (standalone). En Electron/file:// nunca aparece.
(function () {
  'use strict';
  var deferred = null;
  function instalada() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator && window.navigator.standalone) return true; // iOS
    } catch (e) {}
    return false;
  }
  function btn() { try { return document.getElementById('btnInstall'); } catch (e) { return null; } }
  function mostrar() {
    var b = btn();
    if (!b || instalada()) return;
    try { b.hidden = false; } catch (e) {}
  }
  function ocultar() {
    var b = btn();
    if (!b) return;
    try { b.hidden = true; } catch (e) {}
    deferred = null;
  }
  function instalar() {
    var b = btn();
    if (!deferred) return;
    try {
      if (b) b.disabled = true;
      deferred.prompt();
      deferred.userChoice.then(function () { ocultar(); }).catch(function () { if (b) b.disabled = false; });
    } catch (e) { if (b) b.disabled = false; }
  }
  try {
    window.addEventListener('beforeinstallprompt', function (e) {
      try { e.preventDefault(); } catch (_) {}
      deferred = e;
      mostrar();
    });
    window.addEventListener('appinstalled', function () { ocultar(); });
    var b = btn();
    if (b) b.onclick = instalar;
    if (instalada()) ocultar();
    window.cal13pwa = {
      disponible: function () { return !!deferred; },
      instalar: instalar
    };
  } catch (e) {}
})();
