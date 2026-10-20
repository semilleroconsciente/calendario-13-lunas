/* ============================================================
   REGALO TERRITORIAL — Calendario 13 Lunas (Penco · Bio-Bio)
   Puerta unica del proposito-regalo: puente generacional,
   autoconocimiento, honra a quienes partieron y semilla para
   quienes vendran. Educativa y respetuosa.
   5 pestanas: Proposito · Memoria · Puente · Diario · Semilla.
   Todo local y privado por usuario (userData + scheduleSave).
   Sin dependencias. 100% offline. IIFE + window.cal13regalo.
   SPDX-License-Identifier: GPL-3.0-or-later
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
  return String(s == null ? '' : s).slice(0, n || 200);
}
function uid(p) { return (p || 'rg') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function lunaTxt(key) {
  try { if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' dia ' + r.diaN; } } catch (e) {}
  try { if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' dia ' + m.dia; } } catch (e2) {}
  return '';
}
function estacionHoy() {
  try { if (typeof estacionForKey === 'function') return estacionForKey(todayKey()); } catch (e) {}
  try { if (typeof pencoData !== 'undefined' && pencoData.estaciones) return pencoData.estaciones; } catch (e2) {}
  return '';
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) { alert('Este aparato no tiene voz disponible; igual puedes leer en voz alta en familia.'); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.92;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------- datos ---------- */
function getMemorias() { var a = store('regaloMemorias', []); return Array.isArray(a) ? a : []; }
function getDiario() { var a = store('regaloDiario', []); return Array.isArray(a) ? a : []; }
function getCapsula() { var a = store('regaloCapsula', []); return Array.isArray(a) ? a : []; }
function getPuente() {
  var d = store('regaloPuente', { calma: false, acts: {} });
  if (!d || typeof d !== 'object') d = { calma: false, acts: {} };
  if (!d.acts) d.acts = {};
  return d;
}
function getConsent() { var d = store('regaloConsent', { quien: '', fecha: '', alcance: 'privado' }); return d || {}; }

var EJEMPLOS = [
  { nombre: 'Abuela Rosa (ejemplo)', vinc: 'abuela', lugar: 'Lirquen', historia: 'Enseno el charquican y a saludar al mar antes de pedir. Decia: come caliente y comparte.', consejo: 'Comparte aunque sea poco.', alcance: 'privado' },
  { nombre: 'Abuelo Manuel (ejemplo)', vinc: 'abuelo', lugar: 'Penco centro', historia: 'Carpintero de ribera. Arreglaba botes y sillas sin cobrar a vecinos. Olor a viruta y mate.', consejo: 'El oficio se hereda ensenando.', alcance: 'privado' },
  { nombre: 'Tia Marta (ejemplo)', vinc: 'tia', lugar: 'Cosmito', historia: 'Guardaba semillas en frascos con nombre y luna. Hizo la primera huerta comunitaria de la cuadra.', consejo: 'Guarda semilla de lo que te alimenta.', alcance: 'privado' },
  { nombre: 'Don Pedro (ejemplo)', vinc: 'vecino mayor', lugar: 'Playa Negra', historia: 'Pescador. Leía la luna para salir: menguante para orilla, creciente para adentro.', consejo: 'Mira la luna antes que el celular.', alcance: 'privado' },
  { nombre: 'Mama Elena (ejemplo)', vinc: 'madre', lugar: 'Cerro Verde', historia: 'Cantaba cuecas lavando y contaba epew a los nietos. Nos junto cada luna llena.', consejo: 'Canten juntos una vez por luna.', alcance: 'privado' }
];

var ACTS = [
  { id: 'siembra', t: 'Siembra con un mayor', d: '1 almácigo juntos: el mayor enseña, el niño riega y anota la luna. Pregunta: ¿qué sembraban antes en esta fecha?' },
  { id: 'cocina', t: 'Cocina una receta de linaje', d: 'Elige 1 receta de Memoria/Voz Abuelos. Cocinen juntos y anoten qué cambió. Foto solo si autorizan.' },
  { id: 'lengua', t: '5 palabras en mapuzugun', d: 'Aprendan juntos: mari (10), küla (3), küyen (luna), lawen (remedio), trafkintu (intercambio). Usen 🗣️ Kimün del calendario.' }
];
var EMOS = ['alegría', 'tranquilidad', 'cariño', 'motivación', 'tristeza', 'rabia', 'miedo', 'ansiedad', 'cansancio', 'soledad'];

/* ---------- dialogo ---------- */
function makeDialog() {
  var old = $('regaloDialog');
  if (old) return old;
  var d = document.createElement('dialog');
  d.id = 'regaloDialog';
  d.setAttribute('aria-label', 'Regalo territorial: proposito, memoria, puente, diario y semilla');
  d.innerHTML =
    '<form method="dialog"><div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🎁 Regalo territorial</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Puente generacional · autoconocimiento · honra a quienes partieron · semilla para quienes vendrán. Todo <b>privado y local</b>.</p>' +
    '<div class="timer-tabs su-dd1da5">' +
    '<button type="button" id="tabRgProp" class="btn btn-accent su-30e741">🌱 Propósito</button>' +
    '<button type="button" id="tabRgMem" class="btn su-30e741">🕯️ Memoria</button>' +
    '<button type="button" id="tabRgPue" class="btn su-30e741">🤝 Puente</button>' +
    '<button type="button" id="tabRgDia" class="btn su-30e741">🪞 Diario</button>' +
    '<button type="button" id="tabRgSem" class="btn su-30e741">🌰 Semilla</button></div>' +

    '<div id="rgProp">' +
    '<div class="si-card"><h4>🌱 Este proyecto es un regalo</h4><p>Para todas las personas del territorio. Sirve de <b>puente generacional</b> y de <b>herramienta de autoconocimiento</b>. Honra a quienes ya partieron y se hace en honor a quienes vendrán. Educativa y respetuosa.</p>' +
    '<p class="muted">Si una abuela no lo entiende, se simplifica. Si un niño no lo usa sin internet, se imprime. Si una familia no querría a su difunto ahí, no va.</p></div>' +
    '<div class="si-card"><h4>🚫 Lo que nunca hará</h4><p>No vende ni rastrea · no sube nada sin tu gesto · no suplanta a mayor, machi, matrona ni médico · no publica lo sagrado · no diagnostica. Deriva a red: *4141 · CESFAM · 131/133.</p></div>' +
    '<div class="dlg-actions su-59a5a8"><a class="btn su-30e741" href="legal/regalo.html" target="_blank" rel="noopener">📜 Leer propósito offline</a>' +
    '<button type="button" id="rgHearProp" class="btn su-30e741">🔊 Escuchar</button></div>' +
    '</div>' +

    '<div id="rgMem" class="hidden">' +
    '<div class="si-card"><h4>🕯️ Memoria viva (con permiso)</h4><p class="muted">Guarda a quien partió o a un mayor en vida <b>con autorización familiar</b>. Por defecto queda solo en este aparato. <a href="legal/regalo.html" target="_blank" rel="noopener">Ver protocolo</a>. Puentes: 🌳 Árbol y 🗣️ Voces.</p>' +
    '<div class="conv-row"><label>Autoriza <input type="text" id="rgConsQuien" placeholder="ej: hija Rosa" maxlength="30"></label><label>Alcance <select id="rgConsAlc"><option value="privado">Solo este aparato</option><option value="compartible">Se puede compartir</option></select></label></div></div>' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Agregar memoria</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Nombre * <input type="text" id="rgMemNom" placeholder="ej: Abuela Rosa" maxlength="40"></label><label>Vínculo <input type="text" id="rgMemVinc" placeholder="abuela, vecino..." maxlength="20"></label></div>' +
    '<div class="conv-row"><label>Fecha (si la sabes) <input type="date" id="rgMemFec"></label><label>Lugar <input type="text" id="rgMemLug" placeholder="ej: Lirquén" maxlength="30"></label></div>' +
    '<label>Historia (2-4 líneas) <input type="text" id="rgMemHis" placeholder="qué me enseñó, qué olor la recuerda..." maxlength="200"></label>' +
    '<label>Consejo para el futuro <input type="text" id="rgMemCon" placeholder="ej: comparte aunque sea poco" maxlength="120"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="rgMemAdd" class="btn btn-accent su-30e741">+ Guardar memoria</button>' +
    '<button type="button" id="rgMemEj" class="btn su-30e741">✨ Cargar 5 ejemplos</button></div></div>' +
    '<div id="rgMemList" class="habits-list su-8c96f6"></div>' +
    '<div class="dlg-actions su-efea1d"><span id="rgMemStats" class="muted su-11a508"></span>' +
    '<span class="su-a76d59"><button type="button" id="rgMemHear" class="btn su-30e741">🔊</button><button type="button" id="rgMemExp" class="btn su-30e741">📤</button><button type="button" id="rgMemClear" class="btn su-214f75">🗑</button></span></div>' +
    '</div>' +

    '<div id="rgPue" class="hidden">' +
    '<div class="si-card"><h4>🤝 Puente: hacer juntos</h4><p class="muted">Marca 1 por luna. Lo importante es juntar 2 generaciones en 30 minutos.</p><div id="rgActs"></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>👵👶 Acceso mayor y niño</h4>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="rgCalma" class="btn su-30e741">🔎 Texto grande</button>' +
    '<button type="button" id="rgHearAll" class="btn su-30e741">🔊 Escuchar esta pestaña</button>' +
    '<button type="button" id="rgPrint" class="btn su-30e741">🖨️ Imprimir luna</button></div>' +
    '<p class="muted su-11a508" id="rgCalmaLine">Texto grande ayuda a mayores y a leer juntos.</p></div>' +
    '</div>' +

    '<div id="rgDia" class="hidden">' +
    '<div class="si-card"><h4>🪞 Diario lunar (privado)</h4><p class="muted">¿Cómo llegué? ¿Cómo me voy? ¿Qué soñé? Sin puntaje ni culpa. <b>No reemplaza terapia ni CESFAM.</b> Si la estás pasando mal: *4141 (24h) · 149 · 1455 · 131.</p></div>' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Hoy ' + esc(todayKey()) + ' · ' + esc(lunaTxt(todayKey())) + '</h4>' +
    '<div class="conv-row"><label>Energía al llegar (1-10) <select id="rgDLle">' + Array.from({ length: 10 }, function (_, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + '</option>'; }).join('') + '</select></label>' +
    '<label>Emoción <select id="rgDEmo">' + EMOS.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label>' +
    '<label>Energía al irme (1-10) <select id="rgDVa">' + Array.from({ length: 10 }, function (_, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Sueño / pewma <input type="text" id="rgDSue" placeholder="soñé con..." maxlength="140"></label>' +
    '<label>1 gratitud <input type="text" id="rgDGrat" placeholder="agradezco..." maxlength="140"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="rgDAdd" class="btn btn-accent su-30e741">+ Guardar hoy</button></div></div>' +
    '<div id="rgDTrend" class="si-card"></div>' +
    '<div id="rgDList" class="habits-list su-ebf445"></div>' +
    '</div>' +

    '<div id="rgSem" class="hidden">' +
    '<div class="si-card"><h4>🌰 Cápsula del tiempo (para 10 años)</h4><p class="muted">1 mensaje por familia: qué sueñas para el territorio. Queda local + exportable. Sin apellido de niños.</p>' +
    '<div class="conv-row"><label>De <input type="text" id="rgCapDe" placeholder="ej: familia Rivera" maxlength="30"></label><label>Abrir en <input type="date" id="rgCapAbre"></label></div>' +
    '<label>Mensaje <input type="text" id="rgCapTx" placeholder="para quienes vengan..." maxlength="280"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="rgCapAdd" class="btn btn-accent su-30e741">+ Guardar cápsula</button>' +
    '<button type="button" id="rgSemExp" class="btn su-30e741">📤 Exportar semilla</button></div>' +
    '<div id="rgCapList" class="habits-list su-3f7611"></div></div>' +
    '<div class="si-card"><h4>🌱 Llevar a otra comuna (30 min)</h4><p class="muted">En PC: <code>node scripts/nuevo-territorio.cjs maule "Maule"</code> → edita <code>data/territorios/maule/territorio.json</code> → abre <code>?territorio=maule</code> → <code>node scripts/validar-territorios.cjs</code>. Detalle offline en <code>docs/GUIA-CLONAR-Y-LEGADO.md</code>.</p>' +
    '<p class="muted">Respaldo comunitario: 1 copia en tu celu + 1 en pendrive de sede/escuela + 1 hoja impresa si quieres. En Comunidad → App → Respaldo.</p></div>' +
    '</div>' +

    '<div id="rgPrintArea" class="hidden"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function switchTab(t) {
  ['Prop', 'Mem', 'Pue', 'Dia', 'Sem'].forEach(function (k) {
    var p = $('rg' + k), b = $('tabRg' + k);
    if (p) p.classList.toggle('hidden', k !== t);
    if (b) b.classList.toggle('btn-accent', k === t);
  });
}

/* ---------- renders ---------- */
function renderMem() {
  var box = $('rgMemList'); if (!box) return;
  var d = getMemorias().slice().reverse();
  box.innerHTML = d.length ? d.map(function (r) {
    return '<div class="habit-item"><div class="su-6bf84b"><span><b>🕯️ ' + esc(r.nombre) + '</b></span>' +
      '<span class="chip su-0d5be0">' + esc(r.vinc || '') + (r.lugar ? ' · ' + esc(r.lugar) : '') + '</span></div>' +
      '<div class="muted su-cdff1d">' + (r.fecha ? esc(r.fecha) + ' · ' + esc(lunaTxt(r.fecha)) + ' · ' : '') + esc(r.alcance === 'compartible' ? '📤 compartible' : '🔒 solo aquí') + '</div>' +
      (r.historia ? '<p class="su-85c73c">' + esc(r.historia) + '</p>' : '') +
      (r.consejo ? '<p class="su-6cb285">🌱 «' + esc(r.consejo) + '»</p>' : '') +
      '<div class="su-faf7a9"><button class="btn su-337714" data-hear="' + r.id + '">🔊</button>' +
      '<button class="btn su-337714" data-share="' + r.id + '">📤</button>' +
      '<button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Vacío. Agrega a 1 persona arriba o carga los 5 ejemplos para aprender sin exponer a nadie.</p>';
  var st = $('rgMemStats');
  if (st) st.textContent = getMemorias().length + ' memorias · ' + getMemorias().filter(function (r) { return r.alcance === 'compartible'; }).length + ' compartibles · resto solo aquí';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar esta memoria? Cualquier familiar puede pedirlo y se borra sin preguntas.')) return; var dd = getMemorias(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save('Memoria borrada'); renderMem(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var r = getMemorias().find(function (x) { return x.id === b.getAttribute('data-share'); }); if (!r) return; if (r.alcance !== 'compartible') { alert('Esta memoria es solo local. Cambia su alcance solo con permiso familiar.'); return; } share('🕯️ En memoria de ' + r.nombre, (r.historia || '') + (r.consejo ? '\n🌱 ' + r.consejo : '')); }; });
  box.querySelectorAll('[data-hear]').forEach(function (b) { b.onclick = function () { var r = getMemorias().find(function (x) { return x.id === b.getAttribute('data-hear'); }); if (r) speak(r.nombre + '. ' + (r.historia || '') + ' ' + (r.consejo || '')); }; });
  var c = getConsent();
  if ($('rgConsQuien') && !$('rgConsQuien').value && c.quien) $('rgConsQuien').value = c.quien;
  if ($('rgConsAlc') && c.alcance) $('rgConsAlc').value = c.alcance;
}
function renderPuente() {
  var box = $('rgActs'); if (!box) return;
  var p = getPuente();
  box.innerHTML = ACTS.map(function (a) {
    var on = !!p.acts[a.id];
    return '<label class="check-row su-ffd20f su-71b4dc"><input type="checkbox" data-act="' + a.id + '"' + (on ? ' checked' : '') + '> <span><b>' + esc(a.t) + '</b><br><span class="muted">' + esc(a.d) + '</span></span></label>';
  }).join('');
  box.querySelectorAll('[data-act]').forEach(function (c) { c.onchange = function () { var dd = getPuente(); dd.acts[c.getAttribute('data-act')] = c.checked; save(c.checked ? 'Actividad lista 🤝' : 'Guardado'); }; });
  paintCalma();
}
function renderDiario() {
  var box = $('rgDList'); if (!box) return;
  var d = getDiario().slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  box.innerHTML = d.length ? d.slice(0, 20).map(function (r) {
    return '<div class="habit-item"><b>🪞 ' + esc(r.fecha) + '</b> <span class="muted">· ' + esc(lunaTxt(r.fecha)) + ' · ' + esc(r.emo || '') + ' · ' + esc(String(r.lle)) + '→' + esc(String(r.va)) + '</span>' +
      (r.sue ? '<p class="su-85c73c">💭 ' + esc(r.sue) + '</p>' : '') +
      (r.grat ? '<p class="su-6cb285">🙏 ' + esc(r.grat) + '</p>' : '') +
      '<div class="su-49cd09"><button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin registros. Guarda hoy en 20 segundos: energía, emoción, sueño y 1 gratitud.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar este día del diario?')) return; var dd = getDiario(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderDiario(); }; });
  var tr = $('rgDTrend');
  if (tr) {
    var ult = d.slice(0, 7);
    var prom = ult.length ? (ult.reduce(function (a, r) { return a + (+r.va || +r.lle || 0); }, 0) / ult.length).toFixed(1) : '—';
    tr.innerHTML = '<p class="muted su-11a508">🌙 ' + esc(lunaTxt(todayKey())) + ' · 🍂 ' + esc(String(estacionHoy() || 'ciclo territorial')) + ' · ⚡ energía media 7 días: <b>' + esc(String(prom)) + '</b> (' + ult.length + ' días). Solo sugiere ritmo: si baja 2+ lunas o hay ideas de daño, pide apoyo (*4141 / CESFAM).</p>';
  }
}
function renderCapsula() {
  var box = $('rgCapList'); if (!box) return;
  var d = getCapsula().slice().sort(function (a, b) { return String(a.abre).localeCompare(String(b.abre)); });
  box.innerHTML = d.length ? d.map(function (r) {
    return '<div class="habit-item su-13313b"><span>🌰 <b>De ' + esc(r.de) + '</b> → abre ' + esc(r.abre) + '<br><span class="muted">' + esc(r.fecha) + ' · ' + esc(lunaTxt(r.fecha)) + '</span><br>«' + esc(r.texto) + '»</span><button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div>';
  }).join('') : '<p class="muted">Vacía. Deja 1 mensaje para quienes vendrán en 10 años.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar cápsula?')) return; var dd = getCapsula(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderCapsula(); }; });
}
function renderAll() { try { renderMem(); } catch (e) {} try { renderPuente(); } catch (e) {} try { renderDiario(); } catch (e) {} try { renderCapsula(); } catch (e) {} }

/* ---------- calma + print ---------- */
function ensureCalmaCss() {
  if ($('rgCalmaCss')) return;
  var st = document.createElement('style');
  st.id = 'rgCalmaCss';
  st.textContent = '.regalo-calma{font-size:118%!important;line-height:1.8!important}' +
    '.regalo-calma .btn{min-height:48px;font-size:1.05rem}' +
    '.regalo-calma dialog{font-size:1.1rem}' +
    '@media print{body>*{display:none!important}body.print-regalo>*{display:none!important}body.print-regalo #regaloDialog{display:block!important;position:static!important}body.print-regalo #regaloDialog form>*{display:none!important}body.print-regalo #rgPrintArea{display:block!important}}' +
    '#rgPrintArea{border:1px dashed #888;border-radius:10px;padding:10px;margin-top:8px}';
  document.head.appendChild(st);
}
function paintCalma() {
  var p = getPuente();
  try { document.documentElement.classList.toggle('regalo-calma', !!p.calma); } catch (e) {}
  var l = $('rgCalmaLine');
  if (l) l.textContent = p.calma ? '✓ Texto grande activado (toda la app). Tócalo de nuevo para volver.' : 'Texto grande ayuda a mayores y a leer juntos.';
  var b = $('rgCalma');
  if (b) b.textContent = p.calma ? '🔎 Volver a texto normal' : '🔎 Texto grande';
}
function imprimirLuna() {
  ensureCalmaCss();
  var mems = getMemorias();
  var m = mems.length ? mems[mems.length - 1] : null;
  var box = $('rgPrintArea');
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = '<h4>🖨️ Luna para llevar (papel)</h4>' +
    '<p><b>' + esc(lunaTxt(todayKey())) + '</b> · ' + esc(todayKey()) + ' · Penco · Mari Küla Küyen</p>' +
    '<p>🌱 Siembra: revisa Siembra lunar del calendario. 🌊 Marea: revisa Mareas SHOA hoy.</p>' +
    '<p>🤝 Actividad en familia: <b>' + esc(ACTS[0].t) + '</b> — ' + esc(ACTS[0].d) + '</p>' +
    (m ? '<p>🕯️ Memoria: <b>' + esc(m.nombre) + '</b> — ' + esc(m.historia || m.consejo || '') + '</p>' : '<p>🕯️ Memoria: pregunta hoy a un mayor: ¿qué sembraban en esta luna?</p>') +
    '<p class="muted">Regalo libre (GPL + CC BY-NC-SA). Todo lo digital queda en tu aparato.</p>';
  try {
    document.body.classList.add('print-regalo');
    window.print();
    setTimeout(function () { try { document.body.classList.remove('print-regalo'); } catch (e) {} }, 800);
  } catch (e) { share('🌙 Luna para llevar ' + todayKey(), box.textContent); }
}

/* ---------- setup ---------- */
function openDlg() {
  makeDialog();
  switchTab('Prop');
  renderAll();
  var d = $('regaloDialog');
  try { if (d && d.showModal && !d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
}
function ensureSection() {
  var box = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!box) return;
  var lab = box.querySelector('.sub-label[data-sub="regalo"]');
  if (!lab) {
    lab = document.createElement('span');
    lab.className = 'sub-label'; lab.setAttribute('data-sub', 'regalo'); lab.textContent = '🎁 Regalo territorial';
    box.appendChild(lab);
  }
  var el = $('btnRegalo');
  if (!el) {
    el = document.createElement('button');
    el.id = 'btnRegalo'; el.className = 'btn'; el.type = 'button';
    box.appendChild(el);
  }
  el.textContent = '🎁 Regalo';
  el.setAttribute('data-keywords', 'regalo proposito puente generacional memoria honra diario autoconocimiento capsula semilla futuro texto grande escuchar imprimir luna legado don');
  try { el.setAttribute('data-sub', 'regalo'); el.dataset.sub = 'regalo'; } catch (eS) {}
  try { box.insertBefore(lab, el); } catch (eO) {}
  el.onclick = openDlg;
}
function registerVisibility() {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnRegalo') < 0) ALL_BTNS.push('btnRegalo'); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnRegalo = ['comunidad', 'regalo']; } catch (e2) {}
  try { if (typeof BTN_ORDER !== 'undefined') BTN_ORDER['comunidad|regalo'] = ['btnRegalo']; } catch (e3) {}
  try { if (typeof PRESETS !== 'undefined') Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnRegalo = true; }); } catch (e4) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e5) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e6) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e7) {}
}
function wire() {
  makeDialog();
  ensureCalmaCss();
  try {
    var p = getPuente();
    if (p.calma) document.documentElement.classList.add('regalo-calma');
  } catch (e) {}
  if ($('tabRgProp')) $('tabRgProp').onclick = function () { switchTab('Prop'); };
  if ($('tabRgMem')) $('tabRgMem').onclick = function () { switchTab('Mem'); renderMem(); };
  if ($('tabRgPue')) $('tabRgPue').onclick = function () { switchTab('Pue'); renderPuente(); };
  if ($('tabRgDia')) $('tabRgDia').onclick = function () { switchTab('Dia'); renderDiario(); };
  if ($('tabRgSem')) $('tabRgSem').onclick = function () { switchTab('Sem'); renderCapsula(); };
  if ($('rgHearProp')) $('rgHearProp').onclick = function () { speak('Este proyecto es un regalo para el territorio. Puente generacional, autoconocimiento, honra a quienes partieron y semilla para quienes vendrán.'); };
  if ($('rgMemAdd')) $('rgMemAdd').onclick = function () {
    var n = clean(($('rgMemNom') || {}).value, 40);
    if (!n) { alert('Escribe el nombre'); return; }
    var q = clean(($('rgConsQuien') || {}).value, 30);
    if (!q) { alert('Escribe quién autoriza (protocolo de memoria).'); return; }
    var alc = ($('rgConsAlc') || {}).value || 'privado';
    try { var u = userData(); u.regaloConsent = { quien: q, fecha: todayKey(), alcance: alc }; } catch (e) {}
    getMemorias().push({ id: uid('rm'), nombre: n, vinc: clean(($('rgMemVinc') || {}).value, 20) || 'familia', fecha: ($('rgMemFec') || {}).value || '', lugar: clean(($('rgMemLug') || {}).value, 30), historia: clean(($('rgMemHis') || {}).value, 200), consejo: clean(($('rgMemCon') || {}).value, 120), alcance: alc });
    save('Memoria guardada 🕯️');
    ['rgMemNom', 'rgMemVinc', 'rgMemFec', 'rgMemLug', 'rgMemHis', 'rgMemCon'].forEach(function (id) { var el = $(id); if (el) el.value = ''; });
    renderMem();
  };
  if ($('rgMemEj')) $('rgMemEj').onclick = function () {
    if (getMemorias().length && !confirm('Ya tienes memorias. ¿Agregar igual los 5 ejemplos para aprender?')) return;
    EJEMPLOS.forEach(function (e) { getMemorias().push({ id: uid('rm'), nombre: e.nombre, vinc: e.vinc, fecha: '', lugar: e.lugar, historia: e.historia, consejo: e.consejo, alcance: 'privado' }); });
    save('Ejemplos cargados ✨'); renderMem();
  };
  if ($('rgMemHear')) $('rgMemHear').onclick = function () { var d = getMemorias(); speak(d.length ? d.slice(-3).map(function (r) { return r.nombre + '. ' + (r.historia || ''); }).join(' ') : 'Aún no hay memorias.'); };
  if ($('rgMemExp')) $('rgMemExp').onclick = function () { var d = getMemorias().filter(function (r) { return r.alcance === 'compartible'; }); if (!d.length) { alert('Nada compartible: por defecto todo queda local. Marca alcance compartible solo con permiso.'); return; } share('🕯️ Memorias compartibles (' + d.length + ')', d.map(function (r) { return '· ' + r.nombre + ' (' + (r.vinc || '') + '): ' + (r.historia || '') + (r.consejo ? ' 🌱 ' + r.consejo : ''); }).join('\n')); };
  if ($('rgMemClear')) $('rgMemClear').onclick = function () { if (!getMemorias().length) return; if (!confirm('¿Borrar TODAS las memorias de este aparato?')) return; try { userData().regaloMemorias = []; } catch (e) {} save(); renderMem(); };
  if ($('rgCalma')) $('rgCalma').onclick = function () { var dd = getPuente(); dd.calma = !dd.calma; save(dd.calma ? 'Texto grande ✓' : 'Texto normal'); paintCalma(); };
  if ($('rgHearAll')) $('rgHearAll').onclick = function () { speak('Puente generacional. Tres actividades: ' + ACTS.map(function (a) { return a.t + '. ' + a.d; }).join(' ')); };
  if ($('rgPrint')) $('rgPrint').onclick = imprimirLuna;
  if ($('rgDAdd')) $('rgDAdd').onclick = function () {
    getDiario().push({ id: uid('rd'), fecha: todayKey(), lle: +($('rgDLle') || {}).value || 5, emo: ($('rgDEmo') || {}).value || '', va: +($('rgDVa') || {}).value || 5, sue: clean(($('rgDSue') || {}).value, 140), grat: clean(($('rgDGrat') || {}).value, 140) });
    save('Día guardado 🪞');
    if ($('rgDSue')) $('rgDSue').value = ''; if ($('rgDGrat')) $('rgDGrat').value = '';
    renderDiario();
  };
  if ($('rgCapAdd')) $('rgCapAdd').onclick = function () {
    var t = clean(($('rgCapTx') || {}).value, 280);
    if (!t) { alert('Escribe el mensaje para el futuro'); return; }
    getCapsula().push({ id: uid('rc'), de: clean(($('rgCapDe') || {}).value, 30) || 'una familia', fecha: todayKey(), abre: ($('rgCapAbre') || {}).value || '2036-01-01', texto: t });
    save('Cápsula guardada 🌰');
    if ($('rgCapTx')) $('rgCapTx').value = '';
    renderCapsula();
  };
  if ($('rgSemExp')) $('rgSemExp').onclick = function () {
    var payload;
    try { payload = { app: 'calendario-13-lunas', tipo: 'semilla-regalo', fecha: new Date().toISOString(), memorias: getMemorias(), diario: getDiario(), capsula: getCapsula(), puente: getPuente() }; } catch (e) { payload = {}; }
    try {
      var blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'semilla-13lunas.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e2) {} }, 2000);
      save('Semilla exportada 🌰');
    } catch (e2) { share('🌰 Semilla 13 lunas', JSON.stringify(payload).slice(0, 2000)); }
  };
  try { renderAll(); } catch (e2) {}
}

window.cal13regalo = { open: openDlg, list: getMemorias, version: 1 };

function setup() { ensureSection(); registerVisibility(); wire(); try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(function () { try { ensureSection(); registerVisibility(); } catch (e) {} }, 2000);

})();
