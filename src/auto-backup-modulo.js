// auto-backup-modulo.js — recuerda respaldar si pasan >30 días sin hacerlo.
// No guarda nada fuera del dispositivo: solo una fecha local y un aviso con
// botón directo al Respaldo en ⚙️ Ajustes. IIFE, sin dependencias.
(function () {
  'use strict';
  var KEY = 'cal13-ultimo-respaldo';
  var DIAS = 30;

  function last() { try { var v = localStorage.getItem(KEY); return v ? new Date(v) : null; } catch (e) { return null; } }
  // Otros módulos (Respaldo) pueden avisar: window.cal13backupDone()
  window.cal13backupDone = function () {
    try { localStorage.setItem(KEY, new Date().toISOString()); } catch (e) {}
  };

  function daysSince(d) { return Math.floor((Date.now() - d.getTime()) / 86400000); }

  function check() {
    try {
      var l = last();
      var overdue = !l || daysSince(l) > DIAS;
      if (!overdue) return;
      var el = document.getElementById('statusMsg');
      if (!el || document.getElementById('bkWarnBtn')) return;
      var t = document.createElement('span');
      t.textContent = l
        ? '⚠ Último respaldo hace ' + daysSince(l) + ' días — '
        : '⚠ Aún no registras respaldo — ';
      var b = document.createElement('button');
      b.id = 'bkWarnBtn';
      b.className = 'btn'; b.style.width = 'auto';
      b.textContent = '💾 Respaldar ahora';
      b.onclick = function () {
        try {
          // Lo técnico vive en ⚙️ Ajustes (cfgBackupBtn); compat con btnBackup antiguo.
          var r = document.getElementById('cfgBackupBtn') || document.getElementById('btnBackup');
          if (r) { r.click(); window.cal13backupDone(); }
          else if (window.cal13doBackup) { window.cal13doBackup(); window.cal13backupDone(); }
        } catch (e) {}
      };
      el.appendChild(t); el.appendChild(b);
    } catch (e) {}
  }

  // Marca automática: si el usuario usa el diálogo de respaldo, queda fechado.
  function hook() {
    try {
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (t && (t.id === 'cfgBackupBtn' || t.id === 'btnBackup')) {
          setTimeout(function () { try { window.cal13backupDone(); } catch (_) {} }, 2000);
        }
      });
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hook(); setTimeout(check, 4000); });
  else { hook(); setTimeout(check, 4000); }
})();
