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
          // El recordatorio lo marca doBackup() solo si la exportación devolvió
          // un resultado válido; aquí no se adelanta la fecha.
          var r = document.getElementById('cfgBackupBtn') || document.getElementById('btnBackup');
          if (r) r.click();
          else if (window.cal13doBackup) window.cal13doBackup();
        } catch (e) {}
      };
      el.appendChild(t); el.appendChild(b);
    } catch (e) {}
  }

  // Sin hook de clic: antes se fechaba el respaldo 2 s después de pulsar el
  // botón, aunque el usuario cancelara el diálogo o fallara la descarga.
  // La única fuente de verdad es doBackup() tras un resultado válido.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(check, 4000); });
  else { setTimeout(check, 4000); }
})();
