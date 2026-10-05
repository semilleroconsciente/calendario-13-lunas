/* ============================================================
   ANFIBIOS — Calendario 13 Lunas (Penco · Bio-Bío)
   Apartado: Territorio > Tierra y Monte
    (btnAnfibios -> anfibiosDialog),
   pestañas: Hoy | Catálogo | Bitácora | Guía.
   Enfoque:
     🐸 Sapos y ranas del Bio-Bío: ranita de Darwin,
        sapito de cuatro ojos, sapito de antifaz,
        rana chilena, rana esmeralda, sapito rosado
        + alerta rana africana (invasora).
     🌙 Coros nocturnos, charcos y quebradas de Penco:
        humedal Rocuant, estero Penco, Cerro Verde,
        Cosmito. Observación ética, sin tocar ni mover.
   Todo local y privado por usuario: userData().anfibios
     { registros: [] }
   Sin dependencias externas. 100% offline. Se edita aquí.
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
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function getData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { registros: [] };
    if (!u.anfibios) u.anfibios = { registros: [] };
    if (!Array.isArray(u.anfibios.registros)) u.anfibios.registros = [];
    return u.anfibios;
  } catch (e) { return { registros: [] }; }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function lunaTxt() {
  var k = todayKey();
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(k); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(k); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  return '';
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}

/* ---------- contenido ---------- */
var ESPECIES = [
  { nombre: 'Ranita de Darwin', cient: 'Rhinoderma darwinii', ico: '🐸', estado: 'En Peligro',
    hab: 'Sotobosque húmedo, quebradas del cerro',
    canto: 'Silbido suave parecido a un pajarito, de día entre la hojarasca.',
    nota: 'Emblema del bosque costero: el macho cuida los renacuajos en su saco vocal hasta que saltan como ranitas. Si la ves, no la toques ni la muevas: foto a distancia y silencio.' },
  { nombre: 'Sapito de cuatro ojos', cient: 'Pleurodema thaul', ico: '🐸', estado: 'Común',
    hab: 'Charcos, estero Penco, borde del humedal',
    canto: 'Coro nocturno largo y áspero, el que más se oye en Penco (ago–sep).',
    nota: 'Sus “cuatro ojos” son dos manchas que asustan depredadores. Gran comedor de zancudos: cada sapito cuida tu verano.' },
  { nombre: 'Sapito de antifaz', cient: 'Batrachyla taeniata', ico: '🐸', estado: 'Común',
    hab: 'Bosque y quebradas, bajo troncos húmedos',
    canto: 'Golpeteos cortos y metálicos al atardecer.',
    nota: 'Chico y de antifaz oscuro. Vive entre musgo y quila: si levantas un tronco para mirar, déjalo exactamente como estaba.' },
  { nombre: 'Rana chilena', cient: 'Calyptocephalella gayi', ico: '🐸', estado: 'Vulnerable',
    hab: 'Esteros hondos, pozas permanentes',
    canto: 'Gruñido grave bajo el agua, difícil de oír fuera.',
    nota: 'La gigante de Chile (hasta 30 cm). Cada vez más escasa por pérdida de pozas y rana africana. Ver una adulta es un regalo: observa desde la orilla, nunca entres a su poza.' },
  { nombre: 'Rana esmeralda', cient: 'Hylorina sylvatica', ico: '🐸', estado: 'Casi amenazada',
    hab: 'Bosque adulto húmedo, arroyos limpios',
    canto: 'Trino cristalino de noche, cerca del agua corriente.',
    nota: 'Verde esmeralda, trepadora de chilco y quila. Solo vive donde el agua está sana: su canto es certificado de quebrada viva.' },
  { nombre: 'Sapito rosado', cient: 'Eupsophus roseus', ico: '🐸', estado: 'Casi amenazada',
    hab: 'Quebradas sombrías del cerro',
    canto: 'Silbo corto y melancólico al anochecer.',
    nota: 'De pancita rosada, canta escondido entre piedras. Endémico del sur: Penco es borde norte de su casa, cuídalo como visita ilustre.' }
];
var INVASORA = { nombre: 'Rana africana', cient: 'Xenopus laevis', ico: '⚠️',
  hab: 'Humedal, canales, pozas artificiales',
  canto: 'Chasquidos bajo el agua, casi inaudible fuera.',
  nota: 'INVASORA: come de todo (incluso renacuajos nativos) y porta el hongo quitridio. No la muevas ni la sueltes en otro lado. Si la ves, anótala aquí con lugar y avisa al SAG (no la manipules).' };

var LUGARES = ['Humedal Rocuant', 'Estero Penco', 'Quebrada Cerro Verde', 'Cosmito / rural', 'Charco temporal', 'Patio / jardín', 'Otro'];
var ACTIVIDADES = [
  { id: 'canto', t: '🔊 Solo canto' },
  { id: 'adulto', t: '🐸 Adulto visto' },
  { id: 'renacuajo', t: '🦐 Renacuajos' },
  { id: 'postura', t: '⚪ Huevos / postura' },
  { id: 'refugio', t: '🍂 En refugio (tronco/piedra)' }
];
function mesConsejo() {
  var mes = (new Date()).getMonth() + 1;
  if (mes === 8 || mes === 9) return { t: '🌧️ Peak de coros (ago–sep)', d: 'Noches húmedas después de lluvia: sal 21–23 h a escuchar el sapito de cuatro ojos en el estero. Lleva linterna roja y no apuntes directo a los ojos.' };
  if (mes === 10 || mes === 11) return { t: '⚪ Tiempo de posturas (oct–nov)', d: 'Mira cordones de huevos en charcos quietos. No los toques ni los cambies de poza: el agua de cada charco es su remedio.' };
  if (mes >= 12 || mes <= 2) return { t: '🦐 Renacuajos y metamorfosis (dic–feb)', d: 'Charcos con colitas y patitas. No saques renacuajos “para la casa”: sin su charco mueren. Sombra y agua quieta los crían solos.' };
  if (mes >= 3 && mes <= 5) return { t: '🍂 Refugio otoñal (mar–may)', d: 'Se esconden bajo troncos y piedras con la seca. Si mueves algo, devuélvelo igual. Anota refugios para volver en invierno.' };
  return { t: '💤 Letargo invernal (jun–jul)', d: 'Casi no cantan: duermen semienterrados. Es tiempo de cuidar el agua (no botar basura al estero) más que de buscar.' };
}

/* ---------- pestañas ---------- */
var tab = 'hoy';
function switchTab(t) {
  tab = t;
  var ids = [['tabAnfHoy', 'anfHoyPanel'], ['tabAnfCat', 'anfCatPanel'], ['tabAnfBit', 'anfBitPanel'], ['tabAnfGuia', 'anfGuiaPanel']];
  var want = t === 'hoy' ? 'anfHoyPanel' : t === 'cat' ? 'anfCatPanel' : t === 'bit' ? 'anfBitPanel' : 'anfGuiaPanel';
  ids.forEach(function (p) {
    var panel = $(p[1]), b = $(p[0]);
    if (panel) panel.classList.toggle('hidden', p[1] !== want);
    if (b) b.classList.toggle('btn-accent', p[1] === want);
  });
  if (t === 'bit') renderLog();
}

function renderHoy() {
  var box = $('anfHoyBox');
  if (!box) return;
  var c = mesConsejo();
  var lt = lunaTxt();
  box.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🐸 Esta noche en Penco ' + (lt ? '<span class="muted">· ' + esc(lt) + '</span>' : '') + '</h4>' +
    '<p style="font-size:12.5px"><b>' + esc(c.t) + '</b></p>' +
    '<p class="muted" style="font-size:11.5px;line-height:1.6">' + esc(c.d) + '</p>' +
    '<p class="muted" style="font-size:11px;line-height:1.6">🌙 Luna y coros: con <b>luna llena</b> ves mejor el camino pero los coros a veces se callan (más depredadores); las <b>noches nubladas y tibias tras la lluvia</b> son las de gran concierto. Viento sur fuerte = silencio.</p></div>';
  var box2 = $('anfHoyEspecies');
  if (box2) {
    box2.innerHTML = '<h4>🐸 Vecinos que puedes oír hoy</h4><div style="display:flex;flex-direction:column;gap:6px">' +
      ESPECIES.map(function (e) {
        return '<div class="si-card" style="padding:6px 10px"><b style="font-size:12px">' + e.ico + ' ' + esc(e.nombre) + '</b> <span class="muted" style="font-size:10.5px"><i>' + esc(e.cient) + '</i></span>' +
          '<p class="muted" style="font-size:11px;margin:2px 0 0">🔊 ' + esc(e.canto) + '</p></div>';
      }).join('') + '</div>';
  }
}

function renderCatalogo() {
  var box = $('anfCatBox');
  if (!box) return;
  var q = (($('anfCatFilter') || {}).value || '').toLowerCase();
  var list = ESPECIES.filter(function (e) {
    return !q || (e.nombre + ' ' + e.cient + ' ' + e.hab + ' ' + e.estado).toLowerCase().indexOf(q) >= 0;
  });
  box.innerHTML = list.map(function (e) {
    return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12.5px">' + e.ico + ' ' + esc(e.nombre) + ' <span class="muted" style="font-weight:400">· <i>' + esc(e.cient) + '</i></span></h4>' +
      '<p style="font-size:11px;color:var(--gold)">📍 ' + esc(e.hab) + ' · ' + esc(e.estado) + '</p>' +
      '<p style="font-size:11px">🔊 ' + esc(e.canto) + '</p>' +
      '<p style="font-size:11.5px;line-height:1.6">' + esc(e.nota) + '</p>' +
      '<button type="button" class="btn anf-cargar" data-n="' + esc(e.nombre) + '" style="width:auto;font-size:11px">📓 Cargar en bitácora</button></div>';
  }).join('') +
    '<div class="si-card" style="padding:8px 10px;border-color:#e76e8a"><h4 style="font-size:12.5px">' + INVASORA.ico + ' ' + esc(INVASORA.nombre) + ' <span class="muted" style="font-weight:400">· <i>' + esc(INVASORA.cient) + '</i></span></h4>' +
    '<p style="font-size:11px;color:#e76e8a">📍 ' + esc(INVASORA.hab) + '</p>' +
    '<p style="font-size:11.5px;line-height:1.6">' + esc(INVASORA.nota) + '</p>' +
    '<button type="button" class="btn anf-cargar" data-n="' + esc(INVASORA.nombre) + '" style="width:auto;font-size:11px">📓 Cargar en bitácora</button></div>' +
    (list.length ? '' : '<p class="muted" style="font-size:11px">Sin resultados. Prueba “bosque”, “humedal”, “canto”…</p>');
  box.querySelectorAll('.anf-cargar').forEach(function (b) {
    b.onclick = function () {
      var sp = $('anfSpecies');
      if (sp) sp.value = b.getAttribute('data-n');
      switchTab('bit');
      try { sp.focus(); } catch (e) {}
    };
  });
}

function renderLog() {
  var box = $('anfLogBox');
  if (!box) return;
  var arr = [];
  try { arr = getData().registros || []; } catch (e) {}
  var st = $('anfStats');
  if (st) {
    var especies = {};
    arr.forEach(function (r) { if (r.especie) especies[r.especie] = true; });
    st.textContent = arr.length ? (arr.length + ' salidas · ' + Object.keys(especies).length + ' especie(s)') : 'Sin salidas aún';
  }
  if (!arr.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin salidas. Escucha un coro, mira un charco y anótalo: fecha, lugar y qué oíste/viste.</p>'; return; }
  var sorted = arr.slice().sort(function (a, b) { return String(b.fecha + (b.hora || '')).localeCompare(String(a.fecha + (a.hora || ''))); });
  box.innerHTML = sorted.slice(0, 60).map(function (r) {
    var act = ACTIVIDADES.filter(function (a) { return a.id === r.actividad; })[0];
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px"><span style="font-size:11.5px;flex:1;min-width:0">' +
      '🐸 <b>' + esc(r.especie || 'Anfibio') + '</b> · ' + esc(r.fecha || '') + (r.hora ? ' ' + esc(r.hora) : '') +
      '<br><span class="muted" style="font-size:10.5px">' + esc(r.lugar || '') + (act ? ' · ' + esc(act.t) : '') + (r.cantidad ? ' · ×' + esc(r.cantidad) : '') + (lunaTxtFor(r.fecha) ? ' · ' + esc(lunaTxtFor(r.fecha)) : '') + '</span>' +
      (r.notas ? '<br><span style="font-size:11px">' + esc(r.notas) + '</span>' : '') + '</span>' +
      '<span style="display:flex;gap:4px;flex:0 0 auto">' +
      '<button type="button" class="btn anf-edit" data-id="' + r.id + '" style="width:auto;font-size:11px" title="Editar">✏️</button>' +
      '<button type="button" class="btn anf-del" data-id="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55" title="Borrar">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.anf-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta salida?')) return;
      var d = getData();
      d.registros = d.registros.filter(function (x) { return x.id !== b.getAttribute('data-id'); });
      save(); renderLog();
    };
  });
  box.querySelectorAll('.anf-edit').forEach(function (b) {
    b.onclick = function () {
      var d = getData();
      var r = null;
      d.registros.forEach(function (x) { if (x.id === b.getAttribute('data-id')) r = x; });
      if (!r) return;
      if ($('anfDate')) $('anfDate').value = r.fecha || '';
      if ($('anfTime')) $('anfTime').value = r.hora || '';
      if ($('anfPlace')) $('anfPlace').value = r.lugar || '';
      if ($('anfSpecies')) $('anfSpecies').value = r.especie || '';
      if ($('anfQty')) $('anfQty').value = r.cantidad || '';
      if ($('anfAct')) $('anfAct').value = r.actividad || 'canto';
      if ($('anfWeather')) $('anfWeather').value = r.clima || '';
      if ($('anfNotes')) $('anfNotes').value = r.notas || '';
      d.registros = d.registros.filter(function (x) { return x.id !== r.id; });
      save('Salida cargada para editar ✏️ (guárdala de nuevo)');
      renderLog();
      try { $('anfDate').focus(); } catch (e) {}
    };
  });
}

function renderGuia() {
  var box = $('anfGuiaBox');
  if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card"><h4>🔄 Su ciclo (agua + tierra)</h4>' +
    '<p style="font-size:12px;line-height:1.7">🥚 <b>Huevos</b> en charcos quietos → 🦐 <b>renacuajos</b> que comen algas → 🐸 <b>metamorfosis</b> (salen patitas, se acorta la cola) → 🐸 <b>adulto</b> que vuelve al agua a cantar y reproducirse. Todo en el <b>mismo charco</b>: por eso cada poza cuenta.</p></div>' +
    '<div class="menstrual-card"><h4>🤲 Ética: mirar sin dañar</h4>' +
    '<div style="display:flex;flex-direction:column;gap:4px">' +
    ['No tocar con manos secas, con crema o bloqueador: su piel respira y absorbe todo. Foto a distancia.'].concat([
      'No mover sapos, ranas ni renacuajos entre pozas: así viaja el hongo quitridio que los mata.',
      'Luz roja o luna: la linterna blanca directa los ciega y corta el coro.',
      'Pies fuera del charco: un pisotón mata una postura entera. Observa desde la orilla.',
      'Perros con correa junto al agua: un hocico curioso basta para romper una noche de reproducción.',
      'Nunca llevar renacuajos “para la casa” ni soltar mascotas (rana africana, peces) en el humedal.'
    ]).map(function (t) { return '<span class="chip" style="font-size:11px;white-space:normal;text-align:left">• ' + esc(t) + '</span>'; }).join('') + '</div></div>' +
    '<div class="menstrual-card"><h4>🦠 Bioseguridad (quitridio)</h4>' +
    '<p class="muted" style="font-size:11.5px;line-height:1.6">Si entras a una poza o quebrada, lava botas y manos antes y después, y <b>no compartas agua</b> entre lugares. Si ves varios muertos sin causa clara, anota lugar y fecha y avisa al SAG.</p></div>' +
    '<div class="menstrual-card"><h4>🔗 Camina con el calendario</h4>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
    '<button type="button" class="btn anf-go" data-go="btnBirds" style="width:auto;font-size:11px">🦅 Aves</button>' +
    '<button type="button" class="btn anf-go" data-go="btnBosque" style="width:auto;font-size:11px">🌳 Bosque</button>' +
    '<button type="button" class="btn anf-go" data-go="btnCompost" style="width:auto;font-size:11px">🪱 Compost</button>' +
    '<button type="button" class="btn anf-go" data-go="btnGratitud" style="width:auto;font-size:11px">📓 Gratitud</button>' +
    '</div></div>';
}

function buildShareText(list) {
  if (!list.length) return '🐸 Mis salidas de anfibios — aún sin registros';
  var t = '🐸 Mis salidas de anfibios · ' + list.length + '\n\n';
  list.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).forEach(function (r) {
    t += '• ' + r.fecha + (r.hora ? ' ' + r.hora : '') + ' · ' + (r.especie || 'anfibio') + ' · ' + (r.lugar || '') + (r.cantidad ? ' ×' + r.cantidad : '') + (r.notas ? ' — ' + r.notas : '') + '\n';
  });
  return t + '\n— Coro nocturno · Penco';
}

/* ---------- botón + diálogo + cableado ---------- */
function ensureButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g || $('btnAnfibios')) return;
  var b = document.createElement('button');
  b.id = 'btnAnfibios';
  b.className = 'btn';
  b.type = 'button';
  b.setAttribute('data-sub', 'tierra');
  b.setAttribute('data-keywords', 'anfibios rana sapo ranita darwin cuatro ojos canto coro nocturno renacuajo humedal estero quebrada charco observacion rana chilena esmeralda invasora africana xenopus');
  b.textContent = '🐸 Anfibios';
  var ref = $('btnBirds');
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
    else g.appendChild(b);
  } else g.appendChild(b);
}

function ensureCheckbox() {
  if (document.querySelector('[data-btn="btnAnfibios"]')) return;
  var ref = document.querySelector('[data-btn="btnBirds"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnAnfibios"> 🐸 Anfibios';
    var wrap = ref.closest('label');
    if (wrap && wrap.parentNode) wrap.parentNode.insertBefore(lab, wrap.nextSibling);
  }
}

function ensureDialog() {
  if ($('anfibiosDialog')) return $('anfibiosDialog');
  var d = document.createElement('dialog');
  d.id = 'anfibiosDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🐸 Anfibios — coros de Penco</h3>' +
    '<button type="button" id="anfCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Sapos y ranas del Bio-Bío 🐸: escucha el coro, conoce a tus vecinos y anota tus salidas. Observar sin tocar, sin mover. Tus registros quedan <b>privados y locales</b>.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabAnfHoy" class="btn btn-accent" style="width:auto">🐸 Hoy</button>' +
    '<button type="button" id="tabAnfCat" class="btn" style="width:auto">📖 Catálogo</button>' +
    '<button type="button" id="tabAnfBit" class="btn" style="width:auto">📓 Bitácora</button>' +
    '<button type="button" id="tabAnfGuia" class="btn" style="width:auto">🌙 Guía</button></div>' +
    '<div id="anfHoyPanel"><div id="anfHoyBox"></div><div id="anfHoyEspecies" class="menstrual-card" style="margin-top:10px"></div></div>' +
    '<div id="anfCatPanel" class="hidden"><div class="conv-row"><label style="flex:2">Buscar <input type="text" id="anfCatFilter" placeholder="ej: bosque, humedal, canto..." maxlength="40"></label></div><div id="anfCatBox" style="display:flex;flex-direction:column;gap:8px;margin-top:8px"></div></div>' +
    '<div id="anfBitPanel" class="hidden"><div class="menstrual-card"><h4>📓 Nueva salida</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="anfDate"></label>' +
    '<label>Hora <input type="time" id="anfTime" value="21:30"></label>' +
    '<label>Lugar <select id="anfPlace"></select></label></div>' +
    '<div class="conv-row"><label style="flex:2">Especie <select id="anfSpecies"></select></label>' +
    '<label>Cantidad <input type="number" id="anfQty" min="1" value="1" style="width:80px"></label>' +
    '<label>Actividad <select id="anfAct"></select></label></div>' +
    '<div class="conv-row"><label style="flex:2">Clima <input type="text" id="anfWeather" placeholder="ej: lluvia suave, nublado" maxlength="30"></label></div>' +
    '<label>Notas <input type="text" id="anfNotes" placeholder="ej: coro fuerte tras la lluvia, 3 cantando" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start">' +
    '<button type="button" id="anfAdd" class="btn btn-accent" style="width:auto">+ Guardar salida</button></div>' +
    '<div id="anfLogBox" class="habits-list" style="margin-top:10px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px">' +
    '<span id="anfStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap">' +
    '<button type="button" id="anfShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="anfExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="anfClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div></div>' +
    '<div id="anfGuiaPanel" class="hidden"><div id="anfGuiaBox" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div class="dlg-actions"><button type="button" id="anfClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  var pl = d.querySelector('#anfPlace');
  if (pl) LUGARES.forEach(function (l) { var o = document.createElement('option'); o.value = l; o.textContent = l; pl.appendChild(o); });
  var sp = d.querySelector('#anfSpecies');
  if (sp) ESPECIES.concat([INVASORA]).forEach(function (e) { var o = document.createElement('option'); o.value = e.nombre; o.textContent = e.ico + ' ' + e.nombre; sp.appendChild(o); });
  var ac = d.querySelector('#anfAct');
  if (ac) ACTIVIDADES.forEach(function (a) { var o = document.createElement('option'); o.value = a.id; o.textContent = a.t; ac.appendChild(o); });
  return d;
}

function wire() {
  ensureButton();
  ensureDialog();
  ensureCheckbox();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnAnfibios') < 0) ALL_BTNS.push('btnAnfibios');
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnAnfibios') < 0) {
      var i = ORDEN_TERRITORIO.indexOf('btnBirds');
      if (i >= 0) ORDEN_TERRITORIO.splice(i + 1, 0, 'btnAnfibios');
      else ORDEN_TERRITORIO.push('btnAnfibios');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnBirds && p.btnAnfibios === undefined) p.btnAnfibios = true;
      });
    }
  } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  var btn = $('btnAnfibios');
  if (btn && !btn.dataset.anfW) {
    btn.dataset.anfW = '1';
    btn.onclick = function () {
      try { renderHoy(); } catch (e1) {}
      try { renderCatalogo(); } catch (e2) {}
      try { renderGuia(); } catch (e3) {}
      try { switchTab(tab || 'hoy'); } catch (e4) {}
      try { renderLog(); } catch (e5) {}
      if ($('anfDate') && !$('anfDate').value) $('anfDate').value = todayKey();
      var dlg = $('anfibiosDialog');
      if (dlg && dlg.showModal) { try { dlg.showModal(); } catch (e6) { try { dlg.show(); } catch (e7) {} } }
    };
  }
  var t1 = $('tabAnfHoy'), t2 = $('tabAnfCat'), t3 = $('tabAnfBit'), t4 = $('tabAnfGuia');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchTab('cat'); }; }
  if (t3 && !t3.dataset.w) { t3.dataset.w = '1'; t3.onclick = function () { switchTab('bit'); }; }
  if (t4 && !t4.dataset.w) { t4.dataset.w = '1'; t4.onclick = function () { renderGuia(); switchTab('guia'); }; }
  var ct = $('anfCloseTop'), cb = $('anfClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { try { $('anfibiosDialog').close(); } catch (e) {} }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { try { $('anfibiosDialog').close(); } catch (e) {} }; }
  var dlg2 = $('anfibiosDialog');
  if (dlg2 && !dlg2.dataset.goW) {
    dlg2.dataset.goW = '1';
    dlg2.querySelectorAll('.anf-go').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-go');
        try { $('anfibiosDialog').close(); } catch (e) {}
        setTimeout(function () { try { var tgt = $(id); if (tgt) tgt.click(); } catch (e2) {} }, 150);
      };
    });
  }
  var cf = $('anfCatFilter');
  if (cf && !cf.dataset.w) { cf.dataset.w = '1'; cf.oninput = renderCatalogo; }
  var add = $('anfAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var esp = (($('anfSpecies') || {}).value || '').trim();
      if (!esp) { alert('Elige la especie primero'); return; }
      getData().registros.push({
        id: uid('anf'),
        fecha: ($('anfDate') && $('anfDate').value) || todayKey(),
        hora: ($('anfTime') && $('anfTime').value) || '',
        lugar: (($('anfPlace') || {}).value || ''),
        especie: esp,
        cantidad: clean((($('anfQty') || {}).value || '1'), 6),
        actividad: (($('anfAct') || {}).value || 'canto'),
        clima: clean((($('anfWeather') || {}).value || ''), 30),
        notas: clean((($('anfNotes') || {}).value || ''), 80)
      });
      if ($('anfNotes')) $('anfNotes').value = '';
      save('Salida guardada 🐸');
      renderLog();
    };
  }
  var sh = $('anfShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var list = [];
      try { list = getData().registros || []; } catch (e) {}
      if (!list.length) { alert('Sin salidas aún'); return; }
      share('🐸 Mis salidas de anfibios', buildShareText(list));
    };
  }
  var ex = $('anfExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var list = [];
      try { list = getData().registros || []; } catch (e) {}
      if (!list.length) { alert('Sin salidas aún'); return; }
      var blob = new Blob([buildShareText(list)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'anfibios-salidas.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var cl = $('anfClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar todas tus salidas de anfibios?')) return;
      getData().registros = [];
      save(); renderLog();
    };
  }
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

window.Anfibios = {
  tab: switchTab, renderHoy: renderHoy, renderCatalogo: renderCatalogo,
  renderLog: renderLog, list: getData, especies: ESPECIES
};

var _anfRetry = 0;
function setupAnf() {
  if (!document.querySelector('.action-group[data-group="territorio"] .group-btns') || typeof userData !== 'function') {
    _anfRetry++;
    if (_anfRetry < 80) setTimeout(setupAnf, 500);
    return;
  }
  try { wire(); } catch (e) {}
  try { renderHoy(); } catch (e2) {}
  try { renderCatalogo(); } catch (e3) {}
  try { renderGuia(); } catch (e4) {}
}
setTimeout(setupAnf, 700);

})();