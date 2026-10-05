/* ============================================================
   HO'OPONOPONO — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnHooponopono (grupo Linaje > Interior, tras
     btnCuartoCamino / btnRecap)
   - Dialogo hooponoponoDialog con 6 pestanas:
     1) Guia (que es, origen Hawaii, Morrnah + Hew Len,
        como funciona, las 4 frases, como practicar,
        luna y limpieza, cuidados)
     2) Frases (4 frases + herramientas de limpieza:
        significado, cuando usar, practicar, favorito)
     3) Limpieza (practica guiada: elige situacion +
        frase/herramienta + contador + temporizador +
        respiracion + guardar sesion con antes/despues)
     4) Situaciones (inventario: que limpiar, intensidad,
        estado pendiente/en proceso/liberado)
     5) Sesiones (historial, diario, compartir,
        llevar a nota del dia)
     6) Mi avance (racha, totales, barra, por frase,
        por luna, ritmo sugerido)
   - Todo local y privado por usuario:
     userData().hooponopono = { sit:[], ses:[], total:0, fav:'' }
   - Puentes: Metodos (topic hoponopono -> boton abrir),
     Recapitulacion (llevar evento), Duelo, Gratitud,
     Respiracion (calma antes de limpiar).
   - Educativo, no terapia. 100% offline, sin dependencias.
   ============================================================ */
(function () {
'use strict';

var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function clean(s, n) {
  if (typeof sanitizeText === 'function') return sanitizeText(s, n);
  return String(s == null ? '' : s).slice(0, n || 300);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function lunaTxt(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  return '';
}
function blank() { return { sit: [], ses: [], total: 0, fav: 'te amo' }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.hooponopono) u.hooponopono = blank();
    var e = u.hooponopono;
    if (!Array.isArray(e.sit)) e.sit = [];
    if (!Array.isArray(e.ses)) e.ses = [];
    if (typeof e.total !== 'number') e.total = 0;
    if (typeof e.fav !== 'string') e.fav = 'te amo';
    return e;
  } catch (e2) { return blank(); }
}
function persistStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (u) u.hooponopono = store();
  } catch (e) {}
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function addKw(id, extra) {
  try { var b = $(id); if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) b.dataset.keywords += ' ' + extra; } catch (e) {}
}
function makeDialog(id, title, sub, bodyHTML) {
  var old = $(id);
  if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = id;
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted" style="line-height:1.5">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(name) {
  ['Guia', 'Frases', 'Limp', 'Sit', 'Ses', 'Ava'].forEach(function (t) {
    var p = $('ho' + t), b = $('tabHo' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return alert('Audio no disponible en este dispositivo');
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { try { alert('Audio no disponible'); } catch (e2) {} }
}

/* ============================================================
   DATOS — las 4 frases + herramientas de limpieza
   ============================================================ */
var HO_FRASES = [
  { id: 'lo siento', n: 'Lo siento', ico: '💧', color: '#7ab8ff',
    que: 'Reconozco que hay una memoria en mí que crea esto. No es culpa: es responsabilidad amorosa.',
    cuando: 'Cuando aparece rabia, vergüenza o juicio (propio o ajeno). Es el primer paso: nombrar sin pelear.',
    como: 'Respira y di dentro: «Lo siento» 3 veces, mano al pecho. Siente el peso 10 segundos y suéltalo al exhalar.' },
  { id: 'perdoname', n: 'Perdóname', ico: '🤲', color: '#c9a9c9',
    que: 'Pido perdón a mi niña/o interior, al otro y a la Divinidad por sostener esa memoria. Pido limpieza.',
    cuando: 'Rencores viejos, culpas, deudas, peleas familiares. Lo que vuelve una y otra vez.',
    como: 'Di «Perdóname» mirando la situación como una película lejana. No necesitas respuesta del otro para limpiar.' },
  { id: 'gracias', n: 'Gracias', ico: '🙏', color: '#e8c56a',
    que: 'Acepto y agradezco la oportunidad de limpiar. La gratitud cierra el circuito: lo que se agradece, se suelta.',
    cuando: 'Al cerrar una limpieza, al despertar, al pagar una cuenta, ante un problema: «gracias por mostrarme esto».',
    como: 'Sonríe leve y di «Gracias» 3 veces. Anota 1 cosa que esa situación te enseñó.' },
  { id: 'te amo', n: 'Te amo', ico: '💗', color: '#e76e8a',
    que: 'Vuelvo al amor: transmuto la memoria en luz. Es la frase que lo abarca todo y la favorita de Hew Len.',
    cuando: 'Para todo: dolor físico, miedo, insomnio, antes de dormir, al mirar a alguien difícil.',
    como: 'Mano al corazón, di «Te amo» al ritmo de tu respiración. Si solo tienes 1 minuto, usa solo esta.' }
];
var HO_TOOLS = [
  { id: 'llovizna', n: 'Llovizna ☔', desc: 'Repite mentalmente «llovizna, llovizna» para limpiar memorias de dinero, deudas y carencia. Visualiza lluvia fina que lava.' },
  { id: 'hielo azul', n: 'Hielo azul 🧊', desc: 'Repite «hielo azul» ante dolor físico, inflamación o palabras que queman. Imagina frescor azul que calma.' },
  { id: 'goma borrar', n: 'Goma de borrar ✏️', desc: 'Da toquecitos en fotos, cuentas o pantallazos con un lápiz con goma mientras dices «te amo». Borra la carga, no el papel.' },
  { id: 'agua solar', n: 'Agua solar azul 💙', desc: 'Agua en botella azul al sol 1 hora; bébela o riega con intención de limpieza. Clásico de Morrnah.' },
  { id: 'papel moscas', n: 'Papel para moscas 🪰', desc: 'Repite «papel para moscas» cuando un pensamiento se pega y no sale. Lo despega sin pelear.' },
  { id: 'verde esmeralda', n: 'Hoja verde esmeralda 🌿', desc: 'Repite para sanar cuerpo y emociones. Visualiza luz verde en la zona tensa.' }
];
var HO_AREAS = ['familia', 'pareja', 'hijos', 'dinero/trabajo', 'salud/cuerpo', 'ancestros', 'vecinos/comunidad', 'miedo/culpa', 'otro'];
var HO_ESTADOS = ['pendiente', 'en proceso', 'liberado'];

/* ---------- racha ---------- */
function rachaDias() {
  var set = {};
  store().ses.forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}

/* ============================================================
   RENDER — Frases
   ============================================================ */
function fraseById(id) {
  for (var i = 0; i < HO_FRASES.length; i++) if (HO_FRASES[i].id === id) return HO_FRASES[i];
  return HO_FRASES[3];
}
function renderFrases() {
  var box = $('hoFrasesGrid'); if (!box) return;
  var e = store();
  box.innerHTML = HO_FRASES.map(function (f) {
    var isFav = e.fav === f.id;
    return '<div class="menstrual-card" style="border-color:' + f.color + '66">' +
      '<h4 style="color:' + f.color + '">' + f.ico + ' ' + esc(f.n) + (isFav ? ' ⭐' : '') + '</h4>' +
      '<p style="font-size:12px;line-height:1.55"><b>Qué es:</b> ' + esc(f.que) + '<br><b>Cuándo:</b> ' + esc(f.cuando) + '<br><b>Cómo:</b> ' + esc(f.como) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn" style="width:auto;font-size:11px" data-pract="' + esc(f.id) + '">🧘 Practicar</button>' +
      '<button type="button" class="btn" style="width:auto;font-size:11px" data-voz="' + esc(f.id) + '">🔊 Escuchar</button>' +
      '<button type="button" class="btn" style="width:auto;font-size:11px" data-fav="' + esc(f.id) + '">' + (isFav ? '⭐ Favorita' : '☆ Marcar') + '</button>' +
      '</div></div>';
  }).join('') +
  '<div class="menstrual-card"><h4>🧰 Herramientas de limpieza (Morrnah)</h4>' +
  '<p class="muted" style="font-size:11px">Palabras-gatillo que se repiten sin analizar. Elige una y úsala 1–3 minutos ante el tema difícil.</p>' +
  HO_TOOLS.map(function (t) {
    return '<div class="habit-item" style="margin:6px 0"><b style="font-size:12px">' + esc(t.n) + '</b><br><span class="muted" style="font-size:11px">' + esc(t.desc) + '</span><br>' +
      '<button type="button" class="btn" style="width:auto;font-size:11px;margin-top:4px" data-tool="' + esc(t.n) + '">🧘 Limpiar con esta</button></div>';
  }).join('') + '</div>';
  box.querySelectorAll('[data-pract]').forEach(function (b) { b.onclick = function () { irALimpieza(b.getAttribute('data-pract'), null); }; });
  box.querySelectorAll('[data-tool]').forEach(function (b) { b.onclick = function () { irALimpieza('te amo', b.getAttribute('data-tool')); }; });
  box.querySelectorAll('[data-voz]').forEach(function (b) { b.onclick = function () { var f = fraseById(b.getAttribute('data-voz')); speak(f.n + '. ' + f.que + ' ' + f.como); }; });
  box.querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { store().fav = b.getAttribute('data-fav'); persistStore(); save('Frase favorita guardada ⭐'); renderFrases(); renderLimpieza(); }; });
}
function irALimpieza(fraseId, tool) {
  switchTab('Limp');
  var fs = $('hoLimpFrase'); if (fs && fraseId) fs.value = fraseId;
  if (tool) { var ts = $('hoLimpTool'); if (ts) ts.value = tool; }
  try { renderLimpieza(); } catch (e) {}
  try { $('hoLimpFrase').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
}

/* ============================================================
   RENDER — Limpieza (práctica)
   ============================================================ */
var hoCount = 0, hoTimerIv = null, hoTimerLeft = 0;
function hoCountPaint() {
  var c = $('hoCountNum'); if (c) c.textContent = String(hoCount);
  var bar = $('hoCountBar'); if (bar) bar.style.width = Math.min(100, Math.round(hoCount / 108 * 100)) + '%';
}
function hoBump(n) {
  hoCount += (n || 1);
  hoCountPaint();
  var e = store(); e.total += (n || 1); persistStore();
  try { renderAva(); } catch (x) {}
}
function hoTimerStop(silent) {
  if (hoTimerIv) { clearInterval(hoTimerIv); hoTimerIv = null; }
  if (!silent) { var l = $('hoTimerLabel'); if (l) l.textContent = '⏱ Temporizador listo: 1, 5 o 10 min de repetición suave.'; }
}
function hoTimerStart(mins) {
  hoTimerStop(true);
  hoTimerLeft = mins * 60;
  var l = $('hoTimerLabel');
  function paint() {
    if (!l) return;
    var m = Math.floor(hoTimerLeft / 60), s = hoTimerLeft % 60;
    l.innerHTML = '🧘 Limpiando… <b>' + m + ':' + String(s).padStart(2, '0') + '</b> · repite tu frase al respirar. <span class="muted">Cada respiración suma +1 al contador.</span>';
  }
  paint();
  hoTimerIv = setInterval(function () {
    hoTimerLeft--;
    hoBump(1);
    if (hoTimerLeft <= 0) {
      hoTimerStop(true);
      if (l) l.innerHTML = '🌺 <b>Limpieza completa.</b> Toma agua, anota 1 insight y guarda tu sesión abajo.';
      try { if (typeof playNotifySound === 'function') playNotifySound(); } catch (e) {}
      try { speak('Limpieza completa. Gracias. Te amo.'); } catch (e2) {}
      return;
    }
    paint();
  }, 1000);
}
function hoSitOptions(selectedId) {
  var d = store().sit.filter(function (r) { return r.estado !== 'liberado'; });
  var html = '<option value="">Limpieza libre (sin tema)</option>' + d.map(function (r) {
    return '<option value="' + r.id + '"' + (r.id === selectedId ? ' selected' : '') + '>' + esc((r.titulo || 'Sin título').slice(0, 40)) + ' · ' + (r.inten || 0) + '/10</option>';
  }).join('');
  return html;
}
function renderLimpieza() {
  var sel = $('hoLimpSit'); if (!sel) return;
  var keep = sel.value || '';
  sel.innerHTML = hoSitOptions(keep);
  var fs = $('hoLimpFrase');
  if (fs && !fs.value) fs.value = store().fav || 'te amo';
  hoCountPaint();
  var fb = $('hoLimpFavBox');
  if (fb) { var f = fraseById((fs && fs.value) || store().fav || 'te amo'); fb.innerHTML = '<span class="chip" style="border-color:' + f.color + '88;color:' + f.color + '">' + f.ico + ' ' + esc(f.n) + ': ' + esc(f.como) + '</span>'; }
}
function guardarSesion() {
  var sitId = ($('hoLimpSit') || {}).value || '';
  var frase = ($('hoLimpFrase') || {}).value || 'te amo';
  var tool = ($('hoLimpTool') || {}).value || '';
  var antes = +(($('hoAntes') || {}).value || 5);
  var despues = +(($('hoDespues') || {}).value || 5);
  var insight = clean((($('hoInsight') || {}).value || '').trim(), 300);
  var reps = hoCount || +(($('hoReps') || {}).value || 0) || 0;
  if (!reps && !insight) { if (!confirm('Aún no sumaste repeticiones. ¿Guardar igual la sesión?')) return; }
  var titulo = 'Limpieza libre';
  if (sitId) {
    var r = null, dd = store().sit;
    for (var i = 0; i < dd.length; i++) if (dd[i].id === sitId) r = dd[i];
    if (r) {
      titulo = r.titulo;
      r.estado = despues <= 3 ? 'liberado' : 'en proceso';
      r.inten = despues;
    }
  }
  store().ses.push({ id: uid('hs'), fecha: (($('hoLimpFecha') || {}).value) || todayKey(), sitId: sitId, titulo: titulo, frase: frase, tool: tool, reps: reps, antes: antes, despues: despues, insight: insight });
  persistStore();
  save('Sesión guardada 🌺');
  hoCount = 0; hoCountPaint();
  try { $('hoInsight').value = ''; } catch (e) {}
  renderSes(); renderSit(); renderAva(); renderLimpieza();
  switchTab('Ses');
}

/* ============================================================
   RENDER — Situaciones (inventario)
   ============================================================ */
var hoSitEditId = null;
function renderSit() {
  var box = $('hoSitList'); if (!box) return;
  var q = (($('hoSitQ') || {}).value || '').toLowerCase();
  var f = ($('hoSitF') || {}).value || 'todas';
  var d = store().sit.slice().sort(function (a, b) { return (b.inten || 0) - (a.inten || 0); });
  var fil = d.filter(function (r) {
    if (f !== 'todas' && r.estado !== f) return false;
    if (q && ((r.titulo || '') + ' ' + (r.persona || '') + ' ' + (r.nota || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  box.innerHTML = fil.length ? fil.map(function (r) {
    var col = r.estado === 'liberado' ? '#8fd694' : (r.estado === 'en proceso' ? '#e8c56a' : '#c9a9c9');
    return '<div class="habit-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><span><b>' + esc(r.titulo) + '</b></span>' +
      '<span class="chip" style="font-size:10px;border-color:' + col + '55;color:' + col + '">' + esc(r.estado || 'pendiente') + ' · ' + (r.inten || 0) + '/10</span></div>' +
      '<div class="muted" style="font-size:11px;margin-top:4px">' + (r.persona ? '👤 ' + esc(r.persona) + ' · ' : '') + (r.area ? '🏷️ ' + esc(r.area) + ' · ' : '') + esc(lunaTxt(r.fecha) || '') + (r.nota ? '<br>📝 ' + esc(r.nota) : '') + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' +
      '<button class="btn" style="width:auto;font-size:11px" data-limp="' + r.id + '">🧘 Limpiar</button>' +
      '<button class="btn" style="width:auto;font-size:11px" data-next="' + r.id + '">⏭ ' + (r.estado === 'pendiente' ? 'en proceso' : r.estado === 'en proceso' ? 'liberado' : 'reabrir') + '</button>' +
      '<button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️</button>' +
      '<button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Inventario vacío. Anota 1 situación que quieras limpiar: lo que se nombra, se puede soltar.</p>';
  var st = $('hoSitStats');
  if (st) st.textContent = d.length + ' situaciones · ' + d.filter(function (r) { return r.estado === 'liberado'; }).length + ' liberadas 🌺';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar esta situación?')) return; var dd = store().sit; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); persistStore(); save(); renderSit(); renderAva(); renderLimpieza(); }; });
  box.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { var dd = store().sit; var r = dd.find(function (x) { return x.id === b.getAttribute('data-next'); }); if (!r) return; r.estado = r.estado === 'pendiente' ? 'en proceso' : (r.estado === 'en proceso' ? 'liberado' : 'pendiente'); persistStore(); save(r.estado === 'liberado' ? 'Liberado 🌺' : 'Guardado'); renderSit(); renderAva(); renderLimpieza(); }; });
  box.querySelectorAll('[data-limp]').forEach(function (b) { b.onclick = function () { switchTab('Limp'); renderLimpieza(); var s = $('hoLimpSit'); if (s) s.value = b.getAttribute('data-limp'); var dd = store().sit; var r = dd.find(function (x) { return x.id === b.getAttribute('data-limp'); }); var an = $('hoAntes'); if (an && r) an.value = String(r.inten || 5); }; });
  box.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { var dd = store().sit; var r = dd.find(function (x) { return x.id === b.getAttribute('data-edit'); }); if (!r) return; hoSitEditId = r.id;
    $('hoSitTitulo').value = r.titulo || ''; $('hoSitPersona').value = r.persona || ''; $('hoSitArea').value = r.area || HO_AREAS[0]; $('hoSitInten').value = String(r.inten || 5); $('hoSitEstado').value = r.estado || 'pendiente'; $('hoSitNota').value = r.nota || '';
    $('hoSitAdd').textContent = '↻ Actualizar'; $('hoSitCancel').classList.remove('hidden');
  }; });
}

/* ============================================================
   RENDER — Sesiones + Avance
   ============================================================ */
function renderSes() {
  var box = $('hoSesList'); if (!box) return;
  var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = d.length ? d.slice(0, 40).map(function (r) {
    var f = fraseById(r.frase);
    return '<div class="habit-item"><b>🌺 ' + esc(r.fecha) + '</b> · ' + f.ico + ' ' + esc(r.frase) + (r.tool ? ' + ' + esc(r.tool) : '') + ' · ×' + (+r.reps || 0) +
      '<br><span class="muted" style="font-size:11px">📌 ' + esc(r.titulo || 'libre') + ' · ' + r.antes + '→' + r.despues + '/10 · ' + esc(lunaTxt(r.fecha)) + '</span>' +
      (r.insight ? '<p style="font-size:12px">💡 ' + esc(r.insight) + '</p>' : '') +
      '<div style="display:flex;gap:6px;margin-top:4px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin sesiones aún. Ve a 🧘 Limpieza y regala 3 minutos a tu paz de hoy.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar sesión?')) return; var dd = store().ses; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); persistStore(); save(); renderSes(); renderAva(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = store().ses; var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🌺 Mi limpieza ' + r.fecha, '📌 ' + (r.titulo || '') + '\n' + r.frase + ' ×' + r.reps + ' (' + r.antes + '→' + r.despues + '/10)' + (r.insight ? '\n💡 ' + r.insight : '')); }; });
  var st = $('hoSesStats');
  if (st) { var reps = d.reduce(function (a, r) { return a + (+r.reps || 0); }, 0); st.textContent = d.length + ' sesiones · ×' + reps + ' repeticiones · racha ' + rachaDias() + ' días'; }
}
function renderAva() {
  var box = $('hoAvaBox'); if (!box) return;
  var e = store();
  var inv = e.sit, ses = e.ses;
  var lib = inv.filter(function (r) { return r.estado === 'liberado'; }).length;
  var pct = inv.length ? Math.round(lib / inv.length * 100) : 0;
  var totalReps = ses.reduce(function (a, r) { return a + (+r.reps || 0); }, 0);
  var vidaReps = (e.total || 0) > totalReps ? (e.total || 0) : totalReps;
  var porFrase = {};
  ses.forEach(function (r) { porFrase[r.frase] = (porFrase[r.frase] || 0) + 1; });
  var topFrase = Object.keys(porFrase).sort(function (a, b) { return porFrase[b] - porFrase[a]; })[0] || '—';
  box.innerHTML = '<p class="muted" style="font-size:11px">🌺 Situaciones liberadas: <b>' + lib + '/' + inv.length + '</b> (' + pct + '%)</p>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#c9a9c9,#e8c56a,#e76e8a)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">🧘 ' + ses.length + ' sesiones · 🔁 ×' + vidaReps + ' repeticiones de vida · 🔥 racha ' + rachaDias() + ' días · frase más usada: <b>' + esc(topFrase) + '</b></p>' +
    '<p class="muted" style="font-size:11px">Ritmo sugerido: 1 limpieza corta al día (3–5 min). Luna menguante → soltar; luna nueva → sembrar paz. Lo que vuelve se limpia de nuevo, sin culpa.</p>';
}
function renderAll() { try { renderFrases(); } catch (e) {} try { renderLimpieza(); } catch (e) {} try { renderSit(); } catch (e) {} try { renderSes(); } catch (e) {} try { renderAva(); } catch (e) {} }

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  makeDialog('hooponoponoDialog', '🌺 Ho\'oponopono — limpiar memorias, volver al amor',
    'Práctica hawaiana de <b>reconciliación y perdón</b>: asumes tu parte, limpias la memoria y vuelves a la paz. 4 frases, 3 minutos, 1 situación a la vez. Todo queda <b>privado y local</b>.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabHoGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabHoFrases" class="btn" style="width:auto">💗 4 Frases</button>' +
    '<button type="button" id="tabHoLimp" class="btn" style="width:auto">🧘 Limpieza</button>' +
    '<button type="button" id="tabHoSit" class="btn" style="width:auto">📋 Situaciones</button>' +
    '<button type="button" id="tabHoSes" class="btn" style="width:auto">📓 Sesiones</button>' +
    '<button type="button" id="tabHoAva" class="btn" style="width:auto">📊 Mi avance</button></div>' +

    '<div id="hoGuia">' +
      '<div class="si-card"><h4>🌺 ¿Qué es Ho\'oponopono?</h4><p><b>Ho\'oponopono</b> significa «corregir un error» en hawaiano. Es el arte familiar de <b>hacer lo correcto</b>: cuando algo duele, no buscas culpables afuera; limpias la memoria que se activó <b>en ti</b>. No cambias al otro: cambias la carga con que lo miras. El resultado es paz, y desde la paz decides mejor.</p></div>' +
      '<div class="si-card"><h4>🌊 Origen en 1 minuto</h4><p>Práctica ancestral de Hawaii para resolver conflictos en familia (<i>ohana</i>). <b>Morrnah Nalamaku Simeona</b> (1913–1992) la adaptó al mundo moderno como auto-limpieza: no necesitas reunir a nadie, limpias tú. Su alumno <b>Dr. Ihaleakalá Hew Len</b> la hizo famosa limpiando memorias del pabellón psiquiátrico de Hawaii solo con fichas de pacientes, repitiendo <b>«Lo siento, perdóname, gracias, te amo»</b>.</p></div>' +
      '<div class="si-card"><h4>🧠 ¿Cómo funciona? (sin misticismo raro)</h4><p><b>1)</b> Todo lo que te altera activa una <b>memoria/programa</b> (infancia, linaje, noticias).<br><b>2)</b> Al decir las frases con presencia, dejas de alimentar el relato y <b>entregas</b> la carga (llámalo Divinidad, amor, inconsciente: el nombre da igual).<br><b>3)</b> Llega la <b>inspiración</b>: calma, idea clara o simple alivio. Psicología lo reconoce como auto-compasión + reevaluación + gratitud. No es magia: es higiene mental diaria.</p></div>' +
      '<div class="si-card"><h4>💗 Las 4 frases (el corazón)</h4><p><b>«Lo siento»</b> → reconozco la memoria.<br><b>«Perdóname»</b> → pido limpieza.<br><b>«Gracias»</b> → acepto y cierro.<br><b>«Te amo»</b> → transmuto en amor.<br>Orden clásico completo, pero si tienes 1 minuto usa solo <b>«Te amo, gracias»</b>. Lo importante es la <b>sensación sentida</b>, no el número perfecto.</p></div>' +
      '<div class="si-card"><h4>🕯️ Práctica de 5 minutos (paso a paso)</h4><p><b>1)</b> Elige 1 situación (empieza con intensidad ≤6).<br><b>2)</b> Mano al pecho, 3 respiraciones lentas.<br><b>3)</b> Nombra: «esto que siento con ___».<br><b>4)</b> Repite las 4 frases en ronda 5–10 min (o temporizador de aquí).<br><b>5)</b> Mide del 0 al 10: ¿bajó 1–2 puntos? Suficiente por hoy.<br><b>6)</b> Cierra con «gracias», agua y 1 frase de aprendizaje.</p></div>' +
      '<div class="si-card"><h4>🌙 Ho\'oponopono y tus 13 lunas</h4><p><b>Menguante</b> → ideal para soltar rencores y culpas (limpieza profunda). <b>Nueva</b> → siembra paz: limpia y luego escribe tu intención. <b>Llena</b> → lo pendiente se ve claro: buena noche para «gracias». <b>Creciente</b> → practica «te amo» preventivo cada mañana. Cada sesión queda marcada con su luna en 📓 Sesiones.</p></div>' +
      '<div class="si-card"><h4>⚠️ Cuidados</h4><p>No es para justificar daño ni para quedarte en un vínculo violento: <b>limpias dentro y actúas fuera</b> (límites, denuncia, apoyo). Si un recuerdo te desborda, detente y pide ayuda: *4141 (Chile, 24h), CESFAM o terapeuta. No reemplaza tratamiento médico o psicológico: lo acompaña.</p></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="hoGoFrases" class="btn btn-accent" style="width:auto">💗 Conocer las 4 frases →</button> <button type="button" id="hoGoLimp" class="btn" style="width:auto">🧘 Limpiar ahora →</button></div>' +
    '</div>' +

    '<div id="hoFrases" class="hidden"><div id="hoFrasesGrid"></div></div>' +

    '<div id="hoLimp" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧘 Limpieza guiada</h4>' +
      '<div class="conv-row"><label style="flex:2">📌 Situación <select id="hoLimpSit"></select></label><label>📅 Fecha <input type="date" id="hoLimpFecha"></label></div>' +
      '<div class="conv-row"><label>💗 Frase <select id="hoLimpFrase"><option value="lo siento">💧 Lo siento</option><option value="perdoname">🤲 Perdóname</option><option value="gracias">🙏 Gracias</option><option value="te amo">💗 Te amo</option></select></label>' +
      '<label style="flex:2">🧰 Herramienta <select id="hoLimpTool"><option value="">— solo frase —</option>' + HO_TOOLS.map(function (t) { return '<option>' + t.n + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="hoLimpFavBox" style="margin:6px 0"></div>' +
      '<div class="menstrual-card" style="background:var(--panel);text-align:center"><div style="font-size:11px" class="muted">CONTADOR DE REPETICIONES (meta dulce: 108)</div>' +
      '<div id="hoCountNum" style="font-size:44px;font-weight:800;color:var(--gold)">0</div>' +
      '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin:6px 0"><div id="hoCountBar" style="width:0%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#e76e8a)"></div></div>' +
      '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap"><button type="button" id="hoPlus1" class="btn btn-accent" style="width:auto;font-size:15px">+1 💗</button>' +
      '<button type="button" id="hoPlus7" class="btn" style="width:auto">+7</button><button type="button" id="hoPlus21" class="btn" style="width:auto">+21</button>' +
      '<button type="button" id="hoZero" class="btn" style="width:auto">↺ 0</button><button type="button" id="hoVozLimp" class="btn" style="width:auto">🔊 Guía por voz</button></div>' +
      '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px"><button type="button" id="hoT1" class="btn" style="width:auto">⏱ 1 min</button>' +
      '<button type="button" id="hoT5" class="btn" style="width:auto">⏱ 5 min</button><button type="button" id="hoT10" class="btn" style="width:auto">⏱ 10 min</button>' +
      '<button type="button" id="hoTStop" class="btn" style="width:auto">⏹ Detener</button></div>' +
      '<div id="hoTimerLabel" class="muted" style="font-size:11px;margin-top:6px">⏱ Temporizador listo: 1, 5 o 10 min de repetición suave.</div></div>' +
      '<div class="conv-row" style="margin-top:8px"><label>Carga antes (0–10) <input type="number" id="hoAntes" min="0" max="10" value="6" style="width:80px"></label>' +
      '<label>Carga después (0–10) <input type="number" id="hoDespues" min="0" max="10" value="4" style="width:80px"></label>' +
      '<label style="flex:1">Repeticiones manuales <input type="number" id="hoReps" min="0" value="0" style="width:90px"></label></div>' +
      '<label>💡 Insight / aprendizaje <input type="text" id="hoInsight" placeholder="ej: no era rabia, era pena; suelto y pongo límite con amor" maxlength="300"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="hoGuardarSes" class="btn btn-accent" style="width:auto">🌺 Guardar sesión</button></div>' +
      '<p class="muted" style="font-size:11px">Tip: si no tienes situación, haz limpieza libre con «te amo, gracias» antes de dormir. Suma igual a tu racha.</p></div>' +
    '</div>' +

    '<div id="hoSit" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ ¿Qué quiero limpiar?</h4>' +
      '<div class="conv-row"><label style="flex:2">Situación * <input type="text" id="hoSitTitulo" placeholder="ej: pelea con mi hermano por la herencia" maxlength="60"></label><label>Con / por <input type="text" id="hoSitPersona" placeholder="ej: hermano, mamá, yo" maxlength="30"></label></div>' +
      '<div class="conv-row"><label>Área <select id="hoSitArea">' + HO_AREAS.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label>' +
      '<label>Carga (0–10) <input type="number" id="hoSitInten" min="0" max="10" value="6" style="width:80px"></label>' +
      '<label>Estado <select id="hoSitEstado"><option>pendiente</option><option>en proceso</option><option>liberado</option></select></label></div>' +
      '<label>Nota <input type="text" id="hoSitNota" placeholder="ej: me aprieta el pecho cuando lo recuerdo" maxlength="120"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="hoSitAdd" class="btn btn-accent" style="width:auto">+ Agregar</button><button type="button" id="hoSitCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
      '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="hoSitQ" placeholder="persona, tema..." autocomplete="off"></label>' +
      '<label>Estado <select id="hoSitF"><option value="todas">Todas</option><option value="pendiente">Pendientes</option><option value="en proceso">En proceso</option><option value="liberado">Liberadas</option></select></label></div>' +
      '<div id="hoSitList" class="habits-list" style="margin-top:8px;max-height:300px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="hoSitStats" class="muted" style="font-size:11px"></span>' +
      '<span style="display:flex;gap:8px"><button type="button" id="hoSitShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="hoSitClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar liberadas</button></span></div>' +
    '</div>' +

    '<div id="hoSes" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📓 Mis sesiones de limpieza</h4>' +
      '<p class="muted" style="font-size:11px">Cada limpieza cuenta, aunque baje solo 1 punto. La constancia limpia más que la intensidad.</p>' +
      '<div id="hoSesList" class="habits-list" style="max-height:320px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="hoSesStats" class="muted" style="font-size:11px"></span>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="hoSesToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
      '<button type="button" id="hoSesShareAll" class="btn" style="width:auto">📤 Compartir</button>' +
      '<button type="button" id="hoSesClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '</div>' +

    '<div id="hoAva" class="hidden"><div id="hoAvaBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
      '<div class="si-card"><h4>🌙 Cierre de luna (ritual de 3 líneas)</h4><p>Cada fin de luna responde en tu cuaderno o en 📝 nota del día:<br><b>1)</b> ¿Qué limpié esta luna?<br><b>2)</b> ¿Qué paz gané?<br><b>3)</b> ¿Qué dejo en esta luna?<br>Termina con 7 «te amo, gracias».</p></div></div>');
}

/* ---------- puente Metodos ---------- */
function puenteMetodos() {
  try {
    var iv = setInterval(function () {
      var sel = $('metTopic');
      if (!sel) return;
      var v = null;
      try { v = sel.value; } catch (e) {}
      var dlg = $('metodosDialog');
      if (!dlg || !dlg.open) return;
      if (v === 'hoponopono' && !$('hoOpenFromMetodos')) {
        var fab = document.createElement('div');
        fab.innerHTML = '<button type="button" id="hoOpenFromMetodos" class="btn btn-accent" style="width:auto;margin-top:8px">🌺 Abrir mi Ho\'oponopono completo</button>';
        var f = dlg.querySelector('form') || dlg;
        f.appendChild(fab);
        var nb = $('hoOpenFromMetodos');
        if (nb) nb.onclick = function () { try { dlg.close(); } catch (e) {} openHo(); };
      }
      if (v !== 'hoponopono') { var old = $('hoOpenFromMetodos'); if (old && old.parentNode) old.parentNode.remove(); }
    }, 800);
    setTimeout(function () { clearInterval(iv); }, 1000 * 60 * 10);
  } catch (e) {}
}

function openHo() {
  try {
    var lf = $('hoLimpFecha'); if (lf && !lf.value) lf.value = todayKey();
    renderAll();
  } catch (e) {}
  openDlg('hooponoponoDialog');
}
try { window.openHooponopono = openHo; window.openHooponoponoDialog = openHo; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar boton en Linaje > Interior (tras Cuarto Camino / Recap si existen) */
  try {
    if (!$('btnHooponopono')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnHooponopono'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = "🌺 Ho'oponopono";
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', "hooponopono ho'oponopono hoponopono hawaii perdon gracias te amo lo siento perdoname limpieza memorias morrnah hew len responsabilidad paz reconciliacion soltar rencor culpa miedo duelo");
        var ref = g.querySelector('#btnCuartoCamino') || g.querySelector('#btnRecap') || g.querySelector('#btnMetodos');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnHooponopono');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'interior'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnHooponopono') < 0) ALL_BTNS.push('btnHooponopono');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnHooponopono = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnHooponopono') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnCuartoCamino');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnHooponopono');
      else BTN_ORDER['linaje|interior'].push('btnHooponopono');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnHooponopono = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnHooponopono"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnHooponopono"> 🌺 Ho\'oponopono';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnHooponopono !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnHooponopono = lab.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e2) {}
            };
          } catch (e2) {}
        }
      });
    }
  } catch (e) {}
  /* keywords cruzadas */
  try { addKw('btnMetodos', "hooponopono hooponopono limpieza paz"); } catch (e2) {}
  try { addKw('btnRecap', "hooponopono perdon soltar limpieza"); } catch (e3) {}
  try { addKw('btnGratitud', "hooponopono gracias te amo limpieza"); } catch (e4) {}
  try { addKw('btnBreath', "hooponopono calma respiracion limpieza"); } catch (e5) {}
  try { addKw('btnDueloFull', "hooponopono perdon despedida paz"); } catch (e6) {}

  /* 4) dialogo + eventos */
  buildDialog();
  renderAll();

  var b = $('btnHooponopono');
  if (b) b.onclick = function () { openHo(); };

  ['Guia', 'Frases', 'Limp', 'Sit', 'Ses', 'Ava'].forEach(function (t) {
    var tb = $('tabHo' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });
  var gf = $('hoGoFrases'); if (gf) gf.onclick = function () { switchTab('Frases'); renderFrases(); };
  var gl = $('hoGoLimp'); if (gl) gl.onclick = function () { switchTab('Limp'); renderLimpieza(); };

  var p1 = $('hoPlus1'); if (p1) p1.onclick = function () { hoBump(1); };
  var p7 = $('hoPlus7'); if (p7) p7.onclick = function () { hoBump(7); };
  var p21 = $('hoPlus21'); if (p21) p21.onclick = function () { hoBump(21); };
  var z0 = $('hoZero'); if (z0) z0.onclick = function () { hoCount = 0; hoCountPaint(); };
  var vz = $('hoVozLimp'); if (vz) vz.onclick = function () {
    var fr = ($('hoLimpFrase') || {}).value || 'te amo';
    var tl = ($('hoLimpTool') || {}).value || '';
    speak('Respira. Di dentro: lo siento, perdóname, gracias, ' + fr + (tl ? '. Herramienta: ' + tl : '') + '. Sigue a tu ritmo. Gracias. Te amo.');
  };
  var t1 = $('hoT1'); if (t1) t1.onclick = function () { hoTimerStart(1); };
  var t5 = $('hoT5'); if (t5) t5.onclick = function () { hoTimerStart(5); };
  var t10 = $('hoT10'); if (t10) t10.onclick = function () { hoTimerStart(10); };
  var ts = $('hoTStop'); if (ts) ts.onclick = function () { hoTimerStop(false); };
  var lf2 = $('hoLimpFrase'); if (lf2) lf2.onchange = function () { renderLimpieza(); };
  var gs = $('hoGuardarSes'); if (gs) gs.onclick = function () { guardarSesion(); };

  var sa = $('hoSitAdd');
  if (sa) sa.onclick = function () {
    var t = clean(($('hoSitTitulo').value || '').trim(), 60); if (!t) return alert('Escribe la situación a limpiar');
    var rec = { id: hoSitEditId || uid('ho'), titulo: t, persona: clean($('hoSitPersona').value, 30), area: $('hoSitArea').value || 'otro', inten: Math.max(0, Math.min(10, +$('hoSitInten').value || 0)), estado: $('hoSitEstado').value || 'pendiente', nota: clean($('hoSitNota').value, 120), fecha: todayKey() };
    var dd = store().sit;
    if (hoSitEditId) { var i = dd.findIndex(function (x) { return x.id === hoSitEditId; }); if (i >= 0) dd[i] = rec; hoSitEditId = null; $('hoSitAdd').textContent = '+ Agregar'; $('hoSitCancel').classList.add('hidden'); }
    else dd.push(rec);
    persistStore(); save('Situación guardada 🌺');
    $('hoSitTitulo').value = ''; $('hoSitPersona').value = ''; $('hoSitNota').value = '';
    renderSit(); renderAva(); renderLimpieza();
  };
  var sc = $('hoSitCancel');
  if (sc) sc.onclick = function () { hoSitEditId = null; $('hoSitAdd').textContent = '+ Agregar'; sc.classList.add('hidden'); ['hoSitTitulo', 'hoSitPersona', 'hoSitNota'].forEach(function (id) { var el = $(id); if (el) el.value = ''; }); };
  var sq = $('hoSitQ'); if (sq) sq.oninput = function () { renderSit(); };
  var sf = $('hoSitF'); if (sf) sf.onchange = function () { renderSit(); };
  var ss = $('hoSitShare');
  if (ss) ss.onclick = function () { var dd = store().sit; if (!dd.length) return alert('Sin situaciones'); share("🌺 Cosas que estoy limpiando (" + dd.length + ")", dd.map(function (r) { return '· ' + r.titulo + ' (' + r.estado + ' ' + r.inten + '/10)'; }).join('\n')); };
  var scl = $('hoSitClear');
  if (scl) scl.onclick = function () { if (!confirm('¿Borrar las situaciones ya liberadas?')) return; var e = store(); e.sit = e.sit.filter(function (r) { return r.estado !== 'liberado'; }); persistStore(); save(); renderSit(); renderAva(); renderLimpieza(); };

  var stn = $('hoSesToNote');
  if (stn) stn.onclick = function () {
    var last = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); })[0];
    if (!last) return alert('Sin sesiones aún');
    var txt = ('🌺 Ho\'oponopono: ' + last.frase + ' ×' + last.reps + ' · ' + (last.titulo || '') + ' (' + last.antes + '→' + last.despues + '/10)').slice(0, 280);
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var ssa = $('hoSesShareAll');
  if (ssa) ssa.onclick = function () {
    var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
    var t = d.length ? "🌺 Mis limpiezas (últimas)\n" + d.map(function (r) { return '• ' + r.fecha + ' · ' + r.frase + ' ×' + r.reps + ' · ' + (r.titulo || '') + ' (' + r.antes + '→' + r.despues + ')'; }).join('\n') : '🌺 Sin sesiones aún';
    share('Mi Ho\'oponopono', t);
  };
  var scl2 = $('hoSesClear');
  if (scl2) scl2.onclick = function () { if (!confirm('¿Borrar todo tu historial de sesiones? (las situaciones se mantienen)')) return; store().ses = []; persistStore(); save(); renderSes(); renderAva(); };

  /* 5) puente Metodos */
  try { puenteMetodos(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
