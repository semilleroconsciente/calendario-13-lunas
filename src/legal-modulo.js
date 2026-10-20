/* ============================================================
   LEGAL Y PRIVACIDAD — Calendario 13 Lunas (Penco)
   Licencia del código: GNU GPLv3 o posterior (ver COPYING).
   SPDX-License-Identifier: GPL-3.0-or-later
   Sección: Comunidad > sub "legal"
   Botones: btnLegal (diálogo) — abre Términos/Privacidad/Cookies,
   exportar respaldo y borrado local (derecho de supresión Ley 21.719).
   - 100% offline. Aceptación versionada en localStorage (cal13-legal-v1).
   - Los textos completos viven en legal/*.html (standalone, precacheados
     en sw.js). Este diálogo es el resumen operativo + acciones.
   ============================================================ */
(function () {
'use strict';

var LEGAL_VER = 'v1.0-2026-10-14';
var ACCEPT_KEY = 'cal13-legal-v1';

var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function acceptedVer() { try { return localStorage.getItem(ACCEPT_KEY) || ''; } catch (e) { return 'x'; } }
function accept() { try { localStorage.setItem(ACCEPT_KEY, LEGAL_VER); } catch (e) {} }

/* ---------- Diálogo ---------- */
function makeDialog() {
  var old = $('legalDialog');
  if (old) return old;
  var d = document.createElement('dialog');
  d.id = 'legalDialog';
  d.innerHTML =
    '<form method="dialog"><div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">⚖️ Legal y privacidad</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">App gratuita, sin cuentas y sin rastreo. Tus datos viven <b>en tu dispositivo</b>. Textos completos (offline):</p>' +
    '<div class="dlg-actions su-117179">' +
    '<a class="btn su-abb0f2" href="legal/terminos.html" target="_blank" rel="noopener">📜 Términos</a>' +
    '<a class="btn su-abb0f2" href="legal/privacidad.html" target="_blank" rel="noopener">🔒 Privacidad</a>' +
    '<a class="btn su-abb0f2" href="legal/cookies.html" target="_blank" rel="noopener">🍪 Almacenamiento</a></div>' +
    '<div class="si-card"><h4>🩺 Salud y emergencias</h4>' +
    '<p class="muted">Contenido educativo/cultural. <b>No sustituye</b> diagnóstico ni tratamiento. Verifica mareas/clima/tsunami en <b>SHOA · SENAPRED · CONAF</b>. Urgencias: SAMU 131 · Bomberos 132 · Carabineros 133 · Violencia 1455/149 · Senda *4141.</p></div>' +
    '<div class="menstrual-card"><h4>💾 Mis datos (derecho de supresión Ley 21.719)</h4>' +
    '<p class="muted su-11a508">Exporta antes de borrar. El borrado limpia este navegador/aparato; los respaldos que exportaste antes quedan bajo tu custodia.</p>' +
    '<div class="dlg-actions su-59a5a8">' +
    '<button type="button" id="legalExport" class="btn su-30e741">📤 Exportar mis datos</button>' +
    '<button type="button" id="legalErase" class="btn su-214f75">🗑️ Borrar todo en este aparato</button></div>' +
    '<p class="muted su-11a508" id="legalAcceptLine"></p></div>' +
    '<div class="dlg-actions"><button type="button" id="legalOk" class="btn btn-accent">✓ Entendido</button>' +
    '<button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) {
    b.onclick = function () { try { d.close(); } catch (e) {} };
  });
  return d;
}

function paintAccept() {
  var line = $('legalAcceptLine');
  if (!line) return;
  var v = acceptedVer();
  line.textContent = v === LEGAL_VER
    ? '✓ Aceptaste esta versión (' + LEGAL_VER + '). Gracias por leer lo legal.'
    : 'Versión ' + LEGAL_VER + ' · contacto: semilleroconsciente@gmail.com · Al pulsar “Entendido” registras tu lectura (solo en tu aparato).';
}

function downloadJson(name, obj) {
  try {
    var blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 2000);
    return true;
  } catch (e) { return false; }
}

function exportMine() {
  try {
    var data = null;
    try { data = (typeof userData === 'function') ? userData() : null; } catch (e) {}
    var payload = {
      app: 'calendario-13-lunas', tipo: 'respaldo-legal',
      version: LEGAL_VER, fecha: new Date().toISOString(),
      datos: data || {},
      localKeys: {}
    };
    try {
      ['cal13-data', 'cal13-onboarding-v1', ACCEPT_KEY].forEach(function (k) {
        try { payload.localKeys[k] = localStorage.getItem(k) ? '(presente)' : null; } catch (e) {}
      });
    } catch (e) {}
    var ok = downloadJson('respaldo-13lunas-legal.json', payload);
    var st = $('statusMsg');
    if (st) st.textContent = ok ? '📤 Respaldo descargado ✓' : '⚠ No se pudo exportar';
  } catch (e) { try { alert('No se pudo exportar en este navegador.'); } catch (e2) {} }
}

function eraseAll() {
  var msg = '¿Borrar TODOS tus datos de este aparato?\n\n' +
    'Se borran bitácoras, hábitos, notas y ajustes locales.\n' +
    'No se puede deshacer. Consejo: exporta primero.';
  if (!window.confirm(msg)) return;
  if (!window.confirm('Confirmación final: ¿borrar todo y recargar?')) return;
  try {
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('cal13') === 0 || k.indexOf('clima') === 0 || k.indexOf('aire') === 0) localStorage.removeItem(k); }); } catch (e) {}
    try {
      if (window.indexedDB && indexedDB.databases) {
        indexedDB.databases().then(function (dbs) {
          (dbs || []).forEach(function (db) { try { if (db && db.name) indexedDB.deleteDatabase(db.name); } catch (e) {} });
          finishWipe();
        }).catch(finishWipe);
        return;
      }
    } catch (e) {}
    finishWipe();
  } catch (e) { finishWipe(); }
  function finishWipe() {
    try {
      var st = $('statusMsg');
      if (st) st.textContent = '🗑️ Datos locales borrados. Recargando…';
    } catch (e) {}
    setTimeout(function () { try { location.reload(); } catch (e) {} }, 900);
  }
}

function openDlg() {
  makeDialog();
  paintAccept();
  var d = $('legalDialog');
  var ex = $('legalExport'), er = $('legalErase'), ok = $('legalOk');
  if (ex) ex.onclick = exportMine;
  if (er) er.onclick = eraseAll;
  if (ok) ok.onclick = function () { accept(); paintAccept(); try { d.close(); } catch (e) {} };
  try { if (d && d.showModal && !d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
}

/* ---------- Setup: integra en Comunidad ---------- */
var BTNS = [
  { id: 'btnLegal', label: '⚖️ Legal y privacidad', kw: 'legal terminos condiciones privacidad cookies datos borrar exportar supresion reclamo sernac ley 19628 21719 consentimiento salud descargo' }
];
var SUB_LABEL = { id: 'legal', label: '⚖️ Legal' };

function ensureSection() {
  var box = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!box) return;
  var lab = box.querySelector('.sub-label[data-sub="' + SUB_LABEL.id + '"]');
  if (!lab) {
    lab = document.createElement('span');
    lab.className = 'sub-label'; lab.setAttribute('data-sub', SUB_LABEL.id); lab.textContent = SUB_LABEL.label;
    var ref = box.querySelector('.sub-label[data-sub="codigo-abierto"]');
    if (ref && ref.parentNode === box) box.insertBefore(lab, ref);
    else box.appendChild(lab);
  }
  BTNS.forEach(function (b) {
    var el = document.getElementById(b.id);
    if (!el) {
      el = document.createElement('button');
      el.id = b.id; el.className = 'btn'; el.type = 'button';
      box.appendChild(el);
    }
    el.textContent = b.label;
    el.setAttribute('data-keywords', b.kw);
    try { el.setAttribute('data-sub', SUB_LABEL.id); el.dataset.sub = SUB_LABEL.id; } catch (eS) {}
  });
  try {
    BTNS.forEach(function (b) {
      var el = document.getElementById(b.id);
      if (el) box.insertBefore(el, lab.nextSibling);
    });
    box.insertBefore(lab, document.getElementById(BTNS[0].id));
  } catch (eO) {}
  BTNS.forEach(function (b) {
    var el2 = document.getElementById(b.id);
    if (el2) el2.onclick = openDlg;
  });
}

function registerVisibility() {
  try {
    if (typeof ALL_BTNS !== 'undefined') {
      BTNS.forEach(function (b) { if (ALL_BTNS.indexOf(b.id) < 0) ALL_BTNS.push(b.id); });
    }
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') {
      BTNS.forEach(function (b) { BTN_HOME[b.id] = ['comunidad', 'legal']; });
    }
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      BTN_ORDER['comunidad|legal'] = BTNS.map(function (b) { return b.id; });
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p]) BTNS.forEach(function (b) { PRESETS[p][b.id] = true; });
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
}

window.cal13legal = { open: openDlg, version: LEGAL_VER };

function setup() {
  ensureSection();
  registerVisibility();
  makeDialog();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(function () { try { ensureSection(); registerVisibility(); } catch (e) {} }, 2000);

})();
