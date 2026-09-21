/* ============================================================
   TALLERES Y ACTIVIDADES DE PENCO — Calendario 13 Lunas
   Apartado: Territorio > Penco > pestaña 🎨 Talleres
     (tabComunaTalleres -> comunaTalleresPanel, dentro de comunaDialog,
      junto a Eventos | Guía | Sectores | Historia — ver penco-guia.js)
   - Sección abierta para ir rellenando los talleres y actividades
     que se realizan en la comuna (los agrega la vecina/el vecino
     con horario y lugar verificados; no trae catálogo inventado).
   - Cada ficha tiene opción directa "📌 Calendario":
     crea un compromiso 🕐 en el día elegido (con hora y 🔔 opcional).
   - "⭐ Mis inscritos": registro de a qué me inscribí / quiero ir.
   Todo local y privado por usuario: userData().talleresPenco
     { mios:[], inscripciones:[] }
   100% offline. Sin dependencias externas.
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
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado ✓'); } catch (e) {} }
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { mios: [], inscripciones: [] };
    if (!u.talleresPenco) u.talleresPenco = { mios: [], inscripciones: [] };
    var r = u.talleresPenco;
    if (!Array.isArray(r.mios)) r.mios = [];
    if (!Array.isArray(r.inscripciones)) r.inscripciones = [];
    return r;
  } catch (e) { return { mios: [], inscripciones: [] }; }
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') { renderCurrentView(); return; } } catch (e) {}
  try { if (typeof renderLuna === 'function') renderLuna(); } catch (e2) {}
}

/* ---------- CATÁLOGO BASE ----------
   La sección parte ABIERTA y VACÍA a propósito: no se publican
   talleres ni actividades con horarios sin confirmar.
   Agrega cada ficha en ➕ Agregar solo con horario y lugar
   verificados (Casa de la Cultura, DIDECO, CESFAM, Biblioteca,
   OMIL, Deporte Municipal o la sede/club que lo organiza).
   Para fijar una base oficial ya verificada, agrega objetos aquí con
   la forma { id, tipo:'taller'|'actividad', icon, nombre, org,
   lugar, dias, hora, edad, costo, contacto, desc, cat }. */
var TALLERES_BASE = [];
var ACTIVIDADES_BASE = [];

var CATS = {
  cultura: '🎭 Cultura', deporte: '🏅 Deporte', oficio: '🔧 Oficio',
  salud: '💚 Salud', educacion: '📚 Educación', medioambiente: '🌱 Medioambiente',
  fiesta: '🎉 Fiesta', feria: '🧺 Feria', otro: '📌 Otro'
};
var editId = null;
var tabActual = 'talleres';
var filtroCat = 'todas';
var filtroQuery = '';
var filtroGratis = false;

/* ---------- datos combinados ---------- */
function todos() {
  var r = store();
  var base = TALLERES_BASE.concat(ACTIVIDADES_BASE).map(function (t) { t.oficial = true; return t; });
  var mios = r.mios.map(function (t) { t.oficial = false; return t; });
  return base.concat(mios);
}
function porId(id) {
  var all = todos();
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}
function nombreCat(c) { return CATS[c] || CATS.otro; }

/* ---------- AGREGAR AL CALENDARIO (compromiso del día) ---------- */
function celdaPara(fechaKey) {
  var ref = null;
  try { if (typeof lunaMapForKey === 'function') ref = lunaMapForKey(fechaKey); } catch (e) {}
  if (!ref) return { error: 'Esa fecha está fuera del ciclo de 13 lunas visible.' };
  if (ref.luna === 'dft') return { ref: ref, dft: true };
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    var cyk = u && u.cycles ? u.cycles[String(ref.y)] : null;
    if (!cyk) return { error: 'No se pudo abrir el ciclo ' + ref.y + '.' };
    if (!cyk.moons[String(ref.luna)]) cyk.moons[String(ref.luna)] = { days: {} };
    var m = cyk.moons[String(ref.luna)];
    if (!m.days[ref.diaN]) m.days[ref.diaN] = { nota: '', animo: -1, agenda: [] };
    if (!Array.isArray(m.days[ref.diaN].agenda)) m.days[ref.diaN].agenda = [];
    return { ref: ref, cell: m.days[ref.diaN] };
  } catch (e) { return { error: 'No se pudo abrir ese día.' }; }
}
function agregarAlCalendario(t, fechaVal, horaVal, conAviso) {
  if (!t) return;
  var fecha = (fechaVal || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert('Elige una fecha válida.'); return; }
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : (t.hora || '10:00');
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[' + (t.tipo === 'actividad' ? 'Actividad' : 'Taller') + '] ' + t.nombre + (t.lugar ? ' · ' + t.lugar : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      var linea = '[Talleres Penco] ' + texto + ' ' + hhmm;
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + linea : linea;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) {
      try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {}
    }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  try {
    var st = store();
    st.inscripciones.push({ id: uid('ins'), tallerId: t.id, nombre: t.icon + ' ' + t.nombre, tipo: t.tipo, lugar: t.lugar || '', fecha: fecha, hora: hhmm, notify: !!conAviso, creado: todayKey() });
  } catch (e) {}
  save('📌 Agregado al calendario ✓');
  refrescarCal();
  try { render(); } catch (e2) {}
}

/* ---------- esqueleto dentro del panel Penco ---------- */
function asegurarPanel() {
  var panel = $('comunaTalleresPanel');
  if (!panel) return null;
  if (!panel.dataset.tpeOk) {
    panel.dataset.tpeOk = '1';
    panel.innerHTML =
      '<p class="muted" style="font-size:11px;line-height:1.55">Sección abierta: aquí se juntan los talleres y actividades que <b>actualmente se realizan en la comuna</b>. Agrega cada ficha en ➕ Agregar <b>solo con horario y lugar verificados</b> y llévala a tu día con <b>📌 Calendario</b>. Queda <b>privado y local</b>.</p>' +
      '<div class="timer-tabs" style="margin:8px 0 10px;flex-wrap:wrap">' +
      '<button type="button" id="tabTpeTalleres" class="btn btn-accent" style="width:auto">📚 Talleres</button>' +
      '<button type="button" id="tabTpeActividades" class="btn" style="width:auto">🎉 Actividades</button>' +
      '<button type="button" id="tabTpeMios" class="btn" style="width:auto">⭐ Mis inscritos</button>' +
      '<button type="button" id="tabTpeAgregar" class="btn" style="width:auto">➕ Agregar</button>' +
      '</div>' +
      '<div id="tpeHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🔍 Buscar y filtrar</h4>' +
      '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="tpeSearch" placeholder="ej: cueca, fútbol, huerta, Lirquén..." maxlength="60" autocomplete="off"></label>' +
      '<label>Categoría <select id="tpeCat"><option value="todas">Todas</option></select></label></div>' +
      '<label class="check-row" style="margin-top:6px"><input type="checkbox" id="tpeGratis"> Solo gratuitos</label></div>' +
      '<div id="tpeList" style="margin-top:10px"></div>' +
      '<div id="tpeFormBox" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div>' +
      '<div id="tpeMiosBox" class="hidden" style="margin-top:10px"></div>';
    var sel = $('tpeCat');
    if (sel) Object.keys(CATS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = CATS[k]; sel.appendChild(o); });
    var bT = $('tabTpeTalleres'), bA = $('tabTpeActividades'), bM = $('tabTpeMios'), bG = $('tabTpeAgregar');
    if (bT) bT.onclick = function () { tabActual = 'talleres'; render(); };
    if (bA) bA.onclick = function () { tabActual = 'actividades'; render(); };
    if (bM) bM.onclick = function () { tabActual = 'mios'; render(); };
    if (bG) bG.onclick = function () { tabActual = 'agregar'; render(); };
    var q = $('tpeSearch');
    if (q) q.addEventListener('input', function () { filtroQuery = q.value; renderLista(); });
    var sc = $('tpeCat');
    if (sc) sc.onchange = function () { filtroCat = sc.value; renderLista(); };
    var g = $('tpeGratis');
    if (g) g.onchange = function () { filtroGratis = g.checked; renderLista(); };
  }
  return panel;
}

/* ---------- renders ---------- */
function cardHTML(t) {
  var ins = store().inscripciones.filter(function (x) { return x.tallerId === t.id; }).length;
  var html = '<div class="si-card" style="padding:10px 12px;border-color:#d4af3766">' +
    '<h4 style="font-size:13px">' + esc(t.icon || (t.tipo === 'actividad' ? '🎉' : '🎨')) + ' ' + esc(t.nombre) + '</h4>' +
    '<p class="muted" style="font-size:10px">' + esc(nombreCat(t.cat)) + ' · ' + esc(t.tipo === 'actividad' ? 'Actividad' : 'Taller') + (t.oficial ? ' · base comunal' : ' · mío') + (ins ? ' · ⭐ ' + ins + ' en calendario' : '') + '</p>' +
    '<p style="font-size:12px;line-height:1.5">' + esc(t.desc || '') + '</p>' +
    '<p class="muted" style="font-size:11px;line-height:1.6">📍 ' + esc(t.lugar || 'Por confirmar') + '<br>🗓️ ' + esc(t.dias || '') + (t.hora ? ' · 🕐 ' + esc(t.hora) : '') + '<br>👥 ' + esc(t.edad || 'Todo público') + ' · 💰 ' + esc(t.costo || 'Por confirmar') + (t.org ? '<br>🏛️ ' + esc(t.org) : '') + (t.contacto ? '<br>📞 ' + esc(t.contacto) : '') + '</p>' +
    '<div class="conv-row" style="align-items:flex-end">' +
    '<label>Fecha <input type="date" data-tpe-fecha="' + t.id + '" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" data-tpe-hora="' + t.id + '" value="' + esc(t.hora || '10:00') + '" style="max-width:110px"></label>' +
    '<label class="check-row" style="margin:0;white-space:nowrap" title="Avisar a esa hora"><input type="checkbox" data-tpe-aviso="' + t.id + '"> 🔔</label>' +
    '<button type="button" class="btn btn-accent" data-tpe-add="' + t.id + '" style="width:auto">📌 Calendario</button>' +
    '</div>';
  if (!t.oficial) {
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn" data-tpe-edit="' + t.id + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn" data-tpe-share="' + t.id + '" style="width:auto;font-size:11px">📤 Compartir</button>' +
      '<button type="button" class="btn" data-tpe-del="' + t.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button></div>';
  }
  html += '</div>';
  return html;
}
function bindCards(scope) {
  if (!scope) return;
  scope.querySelectorAll('[data-tpe-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-tpe-add');
      var t = porId(id); if (!t) return;
      var f = (scope.querySelector('[data-tpe-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (scope.querySelector('[data-tpe-hora="' + id + '"]') || {}).value || t.hora || '10:00';
      var av = !!(scope.querySelector('[data-tpe-aviso="' + id + '"]') || {}).checked;
      agregarAlCalendario(t, f, h, av);
    };
  });
  scope.querySelectorAll('[data-tpe-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este taller/actividad? (Tus inscripciones al calendario se conservan como compromisos del día)')) return;
      var st = store();
      st.mios = st.mios.filter(function (x) { return x.id !== b.getAttribute('data-tpe-del'); });
      save('Borrado'); render();
    };
  });
  scope.querySelectorAll('[data-tpe-share]').forEach(function (b) {
    b.onclick = function () {
      var t = porId(b.getAttribute('data-tpe-share')); if (!t) return;
      var txt = (t.icon || '🎨') + ' ' + t.nombre + '\n' + (t.dias || '') + (t.hora ? ' ' + t.hora : '') + '\n📍 ' + (t.lugar || '') + '\n👥 ' + (t.edad || '') + ' · 💰 ' + (t.costo || '') + '\n' + (t.desc || '') + (t.contacto ? '\n📞 ' + t.contacto : '');
      try {
        if (navigator.share) { navigator.share({ title: t.nombre + ' — Penco', text: txt }).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(t.nombre + ' — Penco\n' + txt).then(function () { save('Compartido ✓'); });
      } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-tpe-edit]').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      var t = st.mios.filter(function (x) { return x.id === b.getAttribute('data-tpe-edit'); })[0];
      if (!t) return;
      editId = t.id; tabActual = 'agregar'; render();
    };
  });
}
function renderForm() {
  var box = $('tpeFormBox'); if (!box) return;
  var st = store();
  var ed = editId ? st.mios.filter(function (x) { return x.id === editId; })[0] : null;
  function v(k, d) { return esc(ed ? (ed[k] || '') : (d || '')); }
  box.classList.toggle('hidden', tabActual !== 'agregar');
  if (tabActual !== 'agregar') return;
  box.innerHTML = '<h4>' + (ed ? '✏️ Editar taller / actividad' : '➕ Agregar taller o actividad de la comuna') + '</h4>' +
    '<p class="muted" style="font-size:11px">Suma lo que se hace hoy en Penco: talleres municipales, de JJVV, clubes, iglesia, CESFAM, colectivos. Queda en tu dispositivo.</p>' +
    '<div class="conv-row"><label>Tipo * <select id="tpeFTipo"><option value="taller"' + ((ed ? ed.tipo : 'taller') === 'taller' ? ' selected' : '') + '>📚 Taller (recurrente)</option><option value="actividad"' + ((ed && ed.tipo === 'actividad') ? ' selected' : '') + '>🎉 Actividad (puntual)</option></select></label>' +
    '<label>Categoría <select id="tpeFCat">' + Object.keys(CATS).map(function (k) { return '<option value="' + k + '"' + ((ed ? ed.cat : 'cultura') === k ? ' selected' : '') + '>' + esc(CATS[k]) + '</option>'; }).join('') + '</select></label>' +
    '<label>Icono <input type="text" id="tpeFIcon" maxlength="4" style="width:70px;text-align:center" value="' + v('icon', '🎨') + '"></label></div>' +
    '<label>Nombre * <input type="text" id="tpeFNombre" placeholder="ej: Taller de cueca / Feria Lirquén" maxlength="60" value="' + v('nombre', '') + '"></label>' +
    '<label>Descripción <input type="text" id="tpeFDesc" placeholder="qué se hace, para quién, qué llevar" maxlength="140" value="' + v('desc', '') + '"></label>' +
    '<div class="conv-row"><label>Organiza <input type="text" id="tpeFOrg" placeholder="ej: DIDECO, JJVV Cerro Verde" maxlength="40" value="' + v('org', '') + '"></label>' +
    '<label>Lugar <input type="text" id="tpeFLugar" placeholder="ej: Sede Lirquén, Casa de la Cultura" maxlength="50" value="' + v('lugar', '') + '"></label></div>' +
    '<div class="conv-row"><label>Días / fecha <input type="text" id="tpeFDias" placeholder="ej: Mar y Jue · 19:00 / 12 feb anual" maxlength="50" value="' + v('dias', '') + '"></label>' +
    '<label>Hora habitual <input type="time" id="tpeFHora" value="' + (ed && ed.hora ? esc(ed.hora) : '10:00') + '"></label></div>' +
    '<div class="conv-row"><label>Edad <input type="text" id="tpeFEdad" placeholder="ej: 6–12, 60+, todo público" maxlength="30" value="' + v('edad', 'Todo público') + '"></label>' +
    '<label>Costo <input type="text" id="tpeFCosto" placeholder="ej: Gratuito, $5.000" maxlength="30" value="' + v('costo', 'Gratuito') + '"></label></div>' +
    '<label>Contacto <input type="text" id="tpeFContacto" placeholder="ej: 41 226 1020 / @cuenta" maxlength="60" value="' + v('contacto', '') + '"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="tpeFSave" class="btn btn-accent" style="width:auto">' + (ed ? '↻ Actualizar' : '+ Guardar') + '</button>' +
    (ed ? '<button type="button" id="tpeFCancel" class="btn" style="width:auto">Cancelar</button>' : '') + '</div>';
  $('tpeFSave').onclick = function () {
    var nombre = clean(($('tpeFNombre') || {}).value, 60).trim();
    if (!nombre) { alert('Ponle nombre al taller o actividad'); return; }
    var rec = {
      tipo: $('tpeFTipo').value, cat: $('tpeFCat').value, icon: clean(($('tpeFIcon') || {}).value, 4) || '🎨',
      nombre: nombre, desc: clean(($('tpeFDesc') || {}).value, 140),
      org: clean(($('tpeFOrg') || {}).value, 40), lugar: clean(($('tpeFLugar') || {}).value, 50),
      dias: clean(($('tpeFDias') || {}).value, 50), hora: ($('tpeFHora') || {}).value || '10:00',
      edad: clean(($('tpeFEdad') || {}).value, 30) || 'Todo público',
      costo: clean(($('tpeFCosto') || {}).value, 30) || 'Gratuito',
      contacto: clean(($('tpeFContacto') || {}).value, 60)
    };
    if (editId && ed) { Object.keys(rec).forEach(function (k) { ed[k] = rec[k]; }); editId = null; save('Actualizado ✓'); }
    else { rec.id = uid('tpe'); st.mios.push(rec); save('Taller guardado 🎨'); }
    tabActual = rec.tipo === 'actividad' ? 'actividades' : 'talleres';
    render();
  };
  var c = $('tpeFCancel');
  if (c) c.onclick = function () { editId = null; render(); };
}
function renderMios() {
  var box = $('tpeMiosBox'); if (!box) return;
  var st = store();
  box.classList.toggle('hidden', tabActual !== 'mios');
  if (tabActual !== 'mios') return;
  if (!st.inscripciones.length) {
    box.innerHTML = '<div class="menstrual-card"><h4>⭐ Mis inscritos</h4><p class="muted" style="font-size:11px">Aún no agregas nada al calendario. Ve a 📚 Talleres o 🎉 Actividades, elige fecha/hora y pulsa <b>📌 Calendario</b>.</p></div>';
    return;
  }
  var arr = st.inscripciones.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora).localeCompare(String(b.hora)); });
  box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⭐ Mis inscritos · ' + arr.length + '</h4>' +
    '<p class="muted" style="font-size:11px">Ya están como compromisos 🕐 en tu calendario. Aquí los ves todos juntos.</p>' +
    arr.map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(r.nombre) + '</b><br><span class="muted" style="font-size:11px">📅 ' + esc(r.fecha) + ' · 🕐 ' + esc(r.hora) + (r.notify ? ' · 🔔' : '') + (r.lugar ? ' · 📍 ' + esc(r.lugar) : '') + '</span></span>' +
        '<span style="display:flex;gap:6px;flex:0 0 auto"><button type="button" class="btn" data-insgo="' + r.id + '" style="width:auto;font-size:11px" title="Ir a ese día">📅</button>' +
        '<button type="button" class="btn" data-insdel="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
    }).join('') +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" id="tpeInsShare" class="btn" style="width:auto">📤 Compartir mi lista</button>' +
    '<button type="button" id="tpeInsClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar lista</button></div></div>';
  box.querySelectorAll('[data-insdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Quitar de Mis inscritos? (El compromiso del día se conserva; bórralo en el día si quieres)')) return;
      var s2 = store();
      s2.inscripciones = s2.inscripciones.filter(function (x) { return x.id !== b.getAttribute('data-insdel'); });
      save('Quitado'); render();
    };
  });
  box.querySelectorAll('[data-insgo]').forEach(function (b) {
    b.onclick = function () {
      var s2 = store();
      var r2 = s2.inscripciones.filter(function (x) { return x.id === b.getAttribute('data-insgo'); })[0];
      if (!r2) return;
      try {
        if (typeof lunaMapForKey === 'function') {
          var ref = lunaMapForKey(r2.fecha);
          if (ref && ref.luna !== 'dft' && typeof abrirDia === 'function') { abrirDia(ref.luna, ref.diaN); return; }
        }
      } catch (e) {}
      alert('📅 ' + r2.fecha + ' ' + r2.hora + ' — ' + r2.nombre);
    };
  });
  var sh = $('tpeInsShare');
  if (sh) sh.onclick = function () {
    var s2 = store();
    var txt = s2.inscripciones.map(function (r) { return '• ' + r.fecha + ' ' + r.hora + ' — ' + r.nombre + (r.lugar ? ' (' + r.lugar + ')' : ''); }).join('\n');
    try {
      if (navigator.share) { navigator.share({ title: 'Mis talleres en Penco', text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText('🎨 Mis talleres en Penco\n' + txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
  var cl = $('tpeInsClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar toda tu lista de inscritos? (Los compromisos del calendario se conservan)')) return;
    store().inscripciones = [];
    save('Lista borrada'); render();
  };
}
function diaSemanaEs(d) { try { return ['domingo', 'lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado'][d.getDay()]; } catch (e) { return ''; } }
function render() {
  var panel = asegurarPanel();
  if (!panel) return;
  var tabs = { talleres: $('tabTpeTalleres'), actividades: $('tabTpeActividades'), mios: $('tabTpeMios'), agregar: $('tabTpeAgregar') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', tabActual === k); });
  var sel = $('tpeCat');
  if (sel && sel.value !== filtroCat) sel.value = filtroCat;
  var q2 = $('tpeSearch');
  if (q2 && q2.value !== filtroQuery && document.activeElement !== q2) q2.value = filtroQuery;
  var g2 = $('tpeGratis');
  if (g2) g2.checked = !!filtroGratis;
  /* hoy */
  var hoy = $('tpeHoyBox');
  if (hoy) {
    try {
      var st = store();
      var hk = todayKey();
      var deHoy = st.inscripciones.filter(function (x) { return x.fecha === hk; });
      var ds = diaSemanaEs(new Date());
      var sug = todos().filter(function (t) { return (t.dias || '').toLowerCase().indexOf(ds) >= 0; }).slice(0, 3);
      hoy.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center"><span><b>🎨 Hoy — ' + esc((function () { try { return cal.fmtFull.format(new Date()); } catch (e) { return hk; } })()) + '</b></span><span class="chip">' + (deHoy.length ? deHoy.length + ' en calendario' : 'Sin inscritos hoy') + '</span></div>' +
        (deHoy.length ? deHoy.map(function (r) { return '<div class="chip" style="display:block;margin-top:6px">🕐 ' + esc(r.hora) + ' · <b>' + esc(r.nombre) + '</b>' + (r.lugar ? ' · ' + esc(r.lugar) : '') + '</div>'; }).join('') : '<p class="muted" style="font-size:11px;margin-top:6px">Hoy no tienes talleres en el calendario.' + (sug.length ? ' Sugerencia por día de semana: <b>' + esc(sug.map(function (s) { return s.nombre; }).join(' · ')) + '</b>.' : ' ¡Agrega uno abajo!') + '</p>');
    } catch (e) {}
  }
  renderLista();
  renderForm();
  renderMios();
}
function renderLista() {
  var box = $('tpeList'); if (!box) return;
  if (tabActual === 'mios' || tabActual === 'agregar') { box.innerHTML = ''; return; }
  var tipo = tabActual === 'actividades' ? 'actividad' : 'taller';
  var q = (filtroQuery || '').toLowerCase().trim();
  var list = todos().filter(function (t) { return t.tipo === tipo; });
  if (filtroCat !== 'todas') list = list.filter(function (t) { return t.cat === filtroCat; });
  if (filtroGratis) list = list.filter(function (t) { return /gratuit/i.test(t.costo || ''); });
  if (q) list = list.filter(function (t) {
    return ((t.nombre || '') + ' ' + (t.desc || '') + ' ' + (t.lugar || '') + ' ' + (t.org || '') + ' ' + (t.dias || '')).toLowerCase().indexOf(q) >= 0;
  });
  var titulo = tipo === 'actividad' ? '🎉 Actividades en la comuna' : '📚 Talleres en la comuna';
  var vacia = todos().length === 0;
  var html = '<div class="menstrual-card"><h4>' + titulo + ' · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:10px">En cada ficha elige fecha/hora y pulsa <b>📌 Calendario</b> para llevarla a tu día.</p>' +
    (list.length ? list.map(cardHTML).join('') : (vacia
      ? '<p class="muted" style="font-size:11px;line-height:1.55">Sección recién abierta: aún no hay fichas. Suma la primera en <b>➕ Agregar</b> con horario y lugar verificados (Casa de la Cultura, DIDECO, CESFAM, Biblioteca, OMIL, Deporte Municipal o tu sede/club).</p>'
      : '<p class="muted">Sin resultados. Prueba otra búsqueda o agrega la ficha en ➕ Agregar.</p>')) + '</div>';
  box.innerHTML = html;
  bindCards(box);
}

/* ---------- setup: la pestaña la maneja penco-guia.js; aquí solo respaldo ---------- */
function setup() {
  if (!$('comunaTalleresPanel') || !$('tabComunaTalleres')) {
    window._tpeRetry = (window._tpeRetry || 0) + 1;
    if (window._tpeRetry < 60) setTimeout(setup, 500);
    return;
  }
  /* respaldo por si penco-guia.js cargó antes que el DOM completo */
  try {
    var tT = $('tabComunaTalleres');
    if (tT && !tT.dataset.w) {
      tT.dataset.w = '1';
      tT.onclick = function () { try { window.PencoGuia.tab('talleres'); } catch (e) {} };
    }
  } catch (e) {}
  try {
    var b = $('btnComuna');
    if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf('taller') < 0)
      b.dataset.keywords += ' taller actividad curso inscripcion';
  } catch (e2) {}
}

window.TalleresPenco = { render: render, todos: todos, agregarAlCalendario: agregarAlCalendario, base: TALLERES_BASE.concat(ACTIVIDADES_BASE) };
setTimeout(setup, 600);
setTimeout(setup, 1800);

})();
