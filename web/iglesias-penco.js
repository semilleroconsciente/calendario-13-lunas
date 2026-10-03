/* ============================================================
   IGLESIAS DE PENCO — Calendario 13 Lunas
   Apartado: Territorio > Penco > pestaña ⛪ Iglesias
     (tabComunaIglesias -> comunaIglesiasPanel, dentro de comunaDialog,
      junto a Eventos | Guía | Sectores | Historia | Talleres — ver penco-guia.js)
   - Base verificada: 3 parroquias católicas de la comuna según
     Directorio Diocesano 2026 (Arzobispado de Concepción, Decanato
     Costa Norte, junio 2026). Sin horarios inventados: confirmar
     misas en cada parroquia.
   - Sección abierta: agrega tu iglesia/capilla/casa de oración
     (católica, evangélica u otra) solo con horario y dirección
     verificados. Queda privada en tu dispositivo.
   - Cada ficha tiene "📌 Calendario": crea un compromiso 🕐
     en el día elegido (misa, culto, fiesta patronal).
   Todo local y privado por usuario: userData().iglesiasPenco
     { mias:[], visitas:[] }
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
    if (!u) return { mias: [], visitas: [] };
    if (!u.iglesiasPenco) u.iglesiasPenco = { mias: [], visitas: [] };
    var r = u.iglesiasPenco;
    if (!Array.isArray(r.mias)) r.mias = [];
    if (!Array.isArray(r.visitas)) r.visitas = [];
    return r;
  } catch (e) { return { mias: [], visitas: [] }; }
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') { renderCurrentView(); return; } } catch (e) {}
  try { if (typeof renderLuna === 'function') renderLuna(); } catch (e2) {}
}

/* ---------- BASE VERIFICADA (no inventar horarios) ----------
   Fuente: Directorio Diocesano 2026 — Arzobispado de Concepción,
   Decanato Costa Norte (junio 2026). */
var IGLESIAS_BASE = [
  { id: 'igl-carmen', credo: 'catolica', icon: '⛪', nombre: 'Parroquia Nuestra Señora del Carmen',
    sector: 'Penco Centro', direccion: 'O’Higgins 430, Penco', horario: 'Misas: confirmar en parroquia',
    contacto: 'parroquiadelcarmenpenco@gmail.com',
    desc: 'Iglesia madre de Penco (1550). Patrona del Carmen (16 jul). Párroco: R.P. Víctor Fernández.' },
  { id: 'igl-purisima', credo: 'catolica', icon: '⛪', nombre: 'Parroquia La Purísima de Lirquén',
    sector: 'Lirquén', direccion: 'Manuel Rodríguez 177, Lirquén', horario: 'Misas: confirmar en parroquia',
    contacto: 'lapurisimalirquen@hotmail.com',
    desc: 'Parroquia del puerto (1945). Atiende caletas El Refugio y La Cata. Párroco: Pbro. Raúl Castillo.' },
  { id: 'igl-redentor', credo: 'catolica', icon: '✝️', nombre: 'Parroquia Divino Redentor',
    sector: 'Penco Centro', direccion: 'Ovalle 200, Penco', horario: 'Misas: confirmar en parroquia',
    contacto: 'pdrpenco@gmail.com',
    desc: 'Parroquia del sector alto de Penco (1961). Responsable: Diác. Alejandro Montero.' }
];

var CREDOS = { catolica: '⛪ Católica', evangelica: '🙏 Evangélica', otra: '🕊️ Otra' };
var SECTORES = ['Penco Centro', 'Lirquén', 'Cerro Verde', 'Cosmito / Ruta 150', 'Zona Rural Este', 'Toda la comuna'];
var tabActual = 'todas';
var filtroQuery = '';
var editId = null;

function todas() {
  var r = store();
  var base = IGLESIAS_BASE.map(function (t) { t.oficial = true; return t; });
  var mias = r.mias.map(function (t) { t.oficial = false; return t; });
  return base.concat(mias);
}
function porId(id) {
  var all = todas();
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

/* ---------- AGREGAR AL CALENDARIO ---------- */
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
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : '10:00';
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[Iglesia] ' + t.nombre + (t.direccion ? ' · ' + t.direccion : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      var linea = '[Iglesias Penco] ' + texto + ' ' + hhmm;
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
    st.visitas.push({ id: uid('iv'), iglesiaId: t.id, nombre: (t.icon || '⛪') + ' ' + t.nombre, credo: t.credo, lugar: t.direccion || '', fecha: fecha, hora: hhmm, notify: !!conAviso, creado: todayKey() });
  } catch (e) {}
  save('📌 Agregado al calendario ✓');
  refrescarCal();
  try { render(); } catch (e2) {}
}

/* ---------- UI ---------- */
function asegurarPanel() {
  var panel = $('comunaIglesiasPanel');
  if (!panel) return null;
  if (!panel.dataset.iglOk) {
    panel.dataset.iglOk = '1';
    panel.innerHTML =
      '<p class="muted" style="font-size:11px;line-height:1.55">Fe y comunidad en Penco: <b>3 parroquias católicas verificadas</b> + tus capillas e iglesias evangélicas con horario confirmado. Elige fecha/hora y llévala a tu día con <b>📌 Calendario</b>. Queda <b>privado y local</b>.</p>' +
      '<div class="timer-tabs" style="margin:8px 0 10px;flex-wrap:wrap">' +
      '<button type="button" id="tabIglTodas" class="btn btn-accent" style="width:auto">⛪ Todas</button>' +
      '<button type="button" id="tabIglCat" class="btn" style="width:auto">⛪ Católicas</button>' +
      '<button type="button" id="tabIglEva" class="btn" style="width:auto">🙏 Evangélicas</button>' +
      '<button type="button" id="tabIglVis" class="btn" style="width:auto">📌 Mis visitas</button>' +
      '<button type="button" id="tabIglAgr" class="btn" style="width:auto">➕ Agregar</button>' +
      '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🔍 Buscar</h4>' +
      '<label>Buscar <input type="text" id="iglSearch" placeholder="ej: Carmen, Lirquén, culto, Ovalle..." maxlength="60" autocomplete="off"></label></div>' +
      '<div id="iglList" style="margin-top:10px"></div>' +
      '<div id="iglFormBox" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div>' +
      '<div id="iglVisBox" class="hidden" style="margin-top:10px"></div>';
    var bT = $('tabIglTodas'), bC = $('tabIglCat'), bE = $('tabIglEva'), bV = $('tabIglVis'), bA = $('tabIglAgr');
    if (bT) bT.onclick = function () { tabActual = 'todas'; render(); };
    if (bC) bC.onclick = function () { tabActual = 'catolica'; render(); };
    if (bE) bE.onclick = function () { tabActual = 'evangelica'; render(); };
    if (bV) bV.onclick = function () { tabActual = 'visitas'; render(); };
    if (bA) bA.onclick = function () { tabActual = 'agregar'; render(); };
    var q = $('iglSearch');
    if (q) q.addEventListener('input', function () { filtroQuery = q.value; renderLista(); });
  }
  return panel;
}

function cardHTML(t) {
  var nvis = store().visitas.filter(function (x) { return x.iglesiaId === t.id; }).length;
  var html = '<div class="si-card" style="padding:10px 12px;border-color:#d4af3766">' +
    '<h4 style="font-size:13px">' + esc(t.icon || '⛪') + ' ' + esc(t.nombre) + '</h4>' +
    '<p class="muted" style="font-size:10px">' + esc(CREDOS[t.credo] || CREDOS.otra) + ' · ' + esc(t.sector || '') + (t.oficial ? ' · base verificada' : ' · mía') + (nvis ? ' · 📌 ' + nvis + ' en calendario' : '') + '</p>' +
    '<p style="font-size:12px;line-height:1.5">' + esc(t.desc || '') + '</p>' +
    '<p class="muted" style="font-size:11px;line-height:1.6">📍 ' + esc(t.direccion || 'Por confirmar') + '<br>🕐 ' + esc(t.horario || 'Por confirmar') + (t.contacto ? '<br>📞 ' + esc(t.contacto) : '') + '</p>' +
    '<div class="conv-row" style="align-items:flex-end">' +
    '<label>Fecha <input type="date" data-igl-fecha="' + t.id + '" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" data-igl-hora="' + t.id + '" value="10:00" style="max-width:110px"></label>' +
    '<label class="check-row" style="margin:0;white-space:nowrap" title="Avisar a esa hora"><input type="checkbox" data-igl-aviso="' + t.id + '"> 🔔</label>' +
    '<button type="button" class="btn btn-accent" data-igl-add="' + t.id + '" style="width:auto">📌 Calendario</button>' +
    '</div>';
  if (!t.oficial) {
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn" data-igl-edit="' + t.id + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn" data-igl-share="' + t.id + '" style="width:auto;font-size:11px">📤 Compartir</button>' +
      '<button type="button" class="btn" data-igl-del="' + t.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button></div>';
  }
  html += '</div>';
  return html;
}
function bindCards(scope) {
  if (!scope) return;
  scope.querySelectorAll('[data-igl-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-igl-add');
      var t = porId(id); if (!t) return;
      var f = (scope.querySelector('[data-igl-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (scope.querySelector('[data-igl-hora="' + id + '"]') || {}).value || '10:00';
      var av = !!(scope.querySelector('[data-igl-aviso="' + id + '"]') || {}).checked;
      agregarAlCalendario(t, f, h, av);
    };
  });
  scope.querySelectorAll('[data-igl-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta ficha? (Tus visitas al calendario se conservan como compromisos del día)')) return;
      var st = store();
      st.mias = st.mias.filter(function (x) { return x.id !== b.getAttribute('data-igl-del'); });
      save('Borrada'); render();
    };
  });
  scope.querySelectorAll('[data-igl-share]').forEach(function (b) {
    b.onclick = function () {
      var t = porId(b.getAttribute('data-igl-share')); if (!t) return;
      var txt = (t.icon || '⛪') + ' ' + t.nombre + '\n📍 ' + (t.direccion || '') + '\n🕐 ' + (t.horario || '') + '\n' + (t.desc || '') + (t.contacto ? '\n📞 ' + t.contacto : '');
      try {
        if (navigator.share) { navigator.share({ title: t.nombre + ' — Penco', text: txt }).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(t.nombre + ' — Penco\n' + txt).then(function () { save('Compartido ✓'); });
      } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-igl-edit]').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      var t = st.mias.filter(function (x) { return x.id === b.getAttribute('data-igl-edit'); })[0];
      if (!t) return;
      editId = t.id; tabActual = 'agregar'; render();
    };
  });
}
function renderForm() {
  var box = $('iglFormBox'); if (!box) return;
  var st = store();
  var ed = editId ? st.mias.filter(function (x) { return x.id === editId; })[0] : null;
  function v(k, d) { return esc(ed ? (ed[k] || '') : (d || '')); }
  box.classList.toggle('hidden', tabActual !== 'agregar');
  if (tabActual !== 'agregar') return;
  box.innerHTML = '<h4>' + (ed ? '✏️ Editar iglesia / capilla' : '➕ Agregar iglesia, capilla o casa de oración') + '</h4>' +
    '<p class="muted" style="font-size:11px">Solo con <b>dirección y horario verificados</b> (afiche, puerta del templo o contacto directo). Queda en tu dispositivo.</p>' +
    '<div class="conv-row"><label>Credo * <select id="iglFCre"><option value="catolica">⛪ Católica</option><option value="evangelica">🙏 Evangélica</option><option value="otra">🕊️ Otra</option></select></label>' +
    '<label>Sector <select id="iglFSec">' + SECTORES.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></label>' +
    '<label>Icono <input type="text" id="iglFIcon" maxlength="4" style="width:70px;text-align:center" value="' + v('icon', '⛪') + '"></label></div>' +
    '<label>Nombre * <input type="text" id="iglFNom" placeholder="ej: Capilla Santa María de Lirquén" maxlength="60" value="' + v('nombre', '') + '"></label>' +
    '<label>Dirección * <input type="text" id="iglFDir" placeholder="ej: Calle 123, Lirquén" maxlength="60" value="' + v('direccion', '') + '"></label>' +
    '<label>Horario misas / cultos * <input type="text" id="iglFHora" placeholder="ej: Dom 11:00 y 19:00 / Culto mié 20:00" maxlength="80" value="' + v('horario', '') + '"></label>' +
    '<label>Descripción <input type="text" id="iglFDesc" placeholder="ej: Capilla de barrio, fiesta patronal en diciembre" maxlength="140" value="' + v('desc', '') + '"></label>' +
    '<label>Contacto <input type="text" id="iglFCon" placeholder="ej: +56 9 ... / correo / @cuenta" maxlength="60" value="' + v('contacto', '') + '"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="iglFSave" class="btn btn-accent" style="width:auto">' + (ed ? '↻ Actualizar' : '+ Guardar') + '</button>' +
    (ed ? '<button type="button" id="iglFCancel" class="btn" style="width:auto">Cancelar</button>' : '') + '</div>';
  if (ed) { try { $('iglFCre').value = ed.credo || 'catolica'; $('iglFSec').value = ed.sector || SECTORES[0]; } catch (e) {} }
  $('iglFSave').onclick = function () {
    var nombre = clean(($('iglFNom') || {}).value, 60).trim();
    var dir = clean(($('iglFDir') || {}).value, 60).trim();
    if (!nombre) { alert('Ponle nombre a la iglesia'); return; }
    if (!dir) { alert('Pon la dirección (verificada)'); return; }
    var rec = {
      credo: $('iglFCre').value, sector: $('iglFSec').value,
      icon: clean(($('iglFIcon') || {}).value, 4) || '⛪',
      nombre: nombre, direccion: dir,
      horario: clean(($('iglFHora') || {}).value, 80) || 'Por confirmar',
      desc: clean(($('iglFDesc') || {}).value, 140),
      contacto: clean(($('iglFCon') || {}).value, 60)
    };
    if (editId && ed) { Object.keys(rec).forEach(function (k) { ed[k] = rec[k]; }); editId = null; save('Actualizada ✓'); }
    else { rec.id = uid('igl'); st.mias.push(rec); save('Iglesia guardada ⛪'); }
    tabActual = (rec.credo === 'evangelica') ? 'evangelica' : (rec.credo === 'catolica' && tabActual === 'evangelica' ? 'evangelica' : 'todas');
    render();
  };
  var c = $('iglFCancel');
  if (c) c.onclick = function () { editId = null; render(); };
}
function renderVisitas() {
  var box = $('iglVisBox'); if (!box) return;
  var st = store();
  box.classList.toggle('hidden', tabActual !== 'visitas');
  if (tabActual !== 'visitas') return;
  if (!st.visitas.length) {
    box.innerHTML = '<div class="menstrual-card"><h4>📌 Mis visitas</h4><p class="muted" style="font-size:11px">Aún no llevas nada al calendario. En ⛪ Todas elige fecha/hora y pulsa <b>📌 Calendario</b>.</p></div>';
    return;
  }
  var arr = st.visitas.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora).localeCompare(String(b.hora)); });
  box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📌 Mis visitas · ' + arr.length + '</h4>' +
    arr.map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(r.nombre) + '</b><br><span class="muted" style="font-size:11px">📅 ' + esc(r.fecha) + ' · 🕐 ' + esc(r.hora) + (r.notify ? ' · 🔔' : '') + (r.lugar ? ' · 📍 ' + esc(r.lugar) : '') + '</span></span>' +
        '<button type="button" class="btn" data-igldel="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div>';
    }).join('') +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" id="iglVisShare" class="btn" style="width:auto">📤 Compartir mi lista</button>' +
    '<button type="button" id="iglVisClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar lista</button></div></div>';
  box.querySelectorAll('[data-igldel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Quitar de Mis visitas? (El compromiso del día se conserva)')) return;
      store().visitas = store().visitas.filter(function (x) { return x.id !== b.getAttribute('data-igldel'); });
      save('Quitada'); render();
    };
  });
  var sh = $('iglVisShare');
  if (sh) sh.onclick = function () {
    var txt = store().visitas.map(function (r) { return '• ' + r.fecha + ' ' + r.hora + ' — ' + r.nombre + (r.lugar ? ' (' + r.lugar + ')' : ''); }).join('\n');
    try {
      if (navigator.share) { navigator.share({ title: 'Mis iglesias en Penco', text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText('⛪ Mis iglesias en Penco\n' + txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
  var cl = $('iglVisClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar toda tu lista de visitas? (Los compromisos del calendario se conservan)')) return;
    store().visitas = [];
    save('Lista borrada'); render();
  };
}
function render() {
  var panel = asegurarPanel();
  if (!panel) return;
  var tabs = { todas: $('tabIglTodas'), catolica: $('tabIglCat'), evangelica: $('tabIglEva'), visitas: $('tabIglVis'), agregar: $('tabIglAgr') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', tabActual === k); });
  var q2 = $('iglSearch');
  if (q2 && q2.value !== filtroQuery && document.activeElement !== q2) q2.value = filtroQuery;
  renderLista();
  renderForm();
  renderVisitas();
}
function renderLista() {
  var box = $('iglList'); if (!box) return;
  if (tabActual === 'visitas' || tabActual === 'agregar') { box.innerHTML = ''; return; }
  var q = (filtroQuery || '').toLowerCase().trim();
  var list = todas();
  if (tabActual === 'catolica') list = list.filter(function (t) { return t.credo === 'catolica'; });
  if (tabActual === 'evangelica') list = list.filter(function (t) { return t.credo === 'evangelica'; });
  if (q) list = list.filter(function (t) {
    return ((t.nombre || '') + ' ' + (t.desc || '') + ' ' + (t.direccion || '') + ' ' + (t.sector || '') + ' ' + (t.horario || '')).toLowerCase().indexOf(q) >= 0;
  });
  var titulo = tabActual === 'catolica' ? '⛪ Católicas' : tabActual === 'evangelica' ? '🙏 Evangélicas' : '⛪ Iglesias de Penco';
  var html = '<div class="menstrual-card"><h4>' + titulo + ' · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:10px">Base católica verificada (Directorio 2026) + tus fichas. En cada ficha elige fecha/hora y pulsa <b>📌 Calendario</b>.</p>' +
    (list.length ? list.map(cardHTML).join('') : '<p class="muted">Sin resultados. Si es tu iglesia evangélica o capilla de barrio, súmala en <b>➕ Agregar</b> con horario verificado.</p>') + '</div>';
  html += '<p class="muted" style="font-size:10px;margin-top:8px">Fuente base: Directorio Diocesano 2026, Arzobispado de Concepción (Decanato Costa Norte). Horarios: confirmar en cada parroquia. Tus fichas son privadas, no se suben a ningún servidor.</p>';
  box.innerHTML = html;
  bindCards(box);
}

function setup() {
  if (!$('comunaIglesiasPanel') || !$('tabComunaIglesias')) {
    window._iglRetry = (window._iglRetry || 0) + 1;
    if (window._iglRetry < 60) setTimeout(setup, 500);
    return;
  }
  try {
    var b = $('btnComuna');
    if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf('iglesia') < 0)
      b.dataset.keywords += ' iglesia iglesias parroquia capilla misa culto evangelica catolica carmen purisima redentor lirquen ovalle ohiggins';
  } catch (e2) {}
}

window.IglesiasPenco = { render: render, todas: todas, agregarAlCalendario: agregarAlCalendario, base: IGLESIAS_BASE };
setTimeout(setup, 600);
setTimeout(setup, 1800);

})();
