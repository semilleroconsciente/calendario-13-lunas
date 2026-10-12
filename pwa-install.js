// pwa-install.js — botón "Instalar app" (beforeinstallprompt).
// Sin dependencias. Solo visible cuando el navegador lo permite y la app
// no corre ya instalada (standalone). En Electron/file:// nunca aparece.
(function () {
  'use strict';
  var deferred = null;
  var manual = false;
  function instalada() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.navigator && window.navigator.standalone) return true; // iOS
    } catch (e) {}
    return false;
  }
  function bipSoportado() {
    try { return 'onbeforeinstallprompt' in window; } catch (e) { return false; }
  }
  function esMovil() {
    try { return /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent || ''); } catch (e) { return false; }
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
    if (!deferred) { abrirInstrucciones(); return; }
    try {
      if (b) b.disabled = true;
      deferred.prompt();
      deferred.userChoice.then(function () { ocultar(); }).catch(function () { if (b) b.disabled = false; });
    } catch (e) { if (b) b.disabled = false; }
  }
  function abrirInstrucciones() {
    function conDialogo(dlg) {
      try {
        if (!dlg) throw new Error('sin-dialogo');
        var c = dlg.querySelector('#instalarClose');
        if (c) c.onclick = function () { try { dlg.close(); } catch (e) {} };
        if (!dlg.open) dlg.showModal();
      } catch (e) {
        try {
          alert('Instalar Calendario 13 Lunas:\n\niPhone/iPad: Compartir → Añadir a pantalla de inicio.\nAndroid: menú ⋮ → Instalar o Añadir a pantalla de inicio.');
        } catch (e2) {}
      }
    }
    try {
      var d = document.getElementById('instalarDialog');
      if (d) { conDialogo(d); return; }
      if (window.cal13tpl && window.cal13tpl.asegurar) {
        window.cal13tpl.asegurar('instalarDialog').then(conDialogo);
        return;
      }
    } catch (e) {}
    conDialogo(null);
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
    // Sin beforeinstallprompt (iOS Safari, Firefox): modo manual con guía.
    try {
      setTimeout(function () {
        if (!deferred && !instalada() && !bipSoportado() && esMovil() && btn()) {
          manual = true;
          mostrar();
        }
      }, 2500);
    } catch (e) {}
    window.cal13pwa = {
      disponible: function () { return !!deferred; },
      manual: function () { return manual; },
      instalar: instalar
    };
  } catch (e) {}
})();
