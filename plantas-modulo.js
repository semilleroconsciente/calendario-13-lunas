/* ============================================================
   MIS PLANTAS — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección dentro de Hogar y Vida Práctica > 🍽️ Casa:
   - Botón btnPlantas (en grupo hogar, sub casa, junto a Tareas Hogar)
   - Diálogo plantasDialog con 4 pestañas:
     1) 🏡 Resumen (totales, por tipo, riegos hoy/vencidos,
        salud, próximos cuidados)
     2) 🪴 Mis Plantas (CRUD: nombre, tipo, ubicación, luz,
        riego cada N días, último riego + próximo automático,
        salud, favorita, archivo)
     3) ✅ Cuidados (riego, abono, poda, trasplante, plagas…
        pendientes/hechas, botón 💧 Regar hoy)
     4) 📖 Guía (suculentas, interior, árboles en maceta,
        flor, sustrato Penco, luz, agua, luna, toxicidad)
   - Todo local y privado por usuario: userData().plantas
     { items:[], cuidados:[] }
   - 100% offline, sin dependencias.
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
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function addDaysKey(key, days) {
  try {
    var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + days);
    return cal.fmtKey.format(d);
  } catch (e) {
    var d2 = new Date(key + 'T12:00:00'); d2.setDate(d2.getDate() + days);
    return d2.getFullYear() + '-' + String(d2.getMonth() + 1).padStart(2, '0') + '-' + String(d2.getDate()).padStart(2, '0');
  }
}
function diffDays(aKey, bKey) {
  try {
    var a = new Date(aKey + 'T12:00:00').getTime(), b = new Date(bKey + 'T12:00:00').getTime();
    return Math.round((b - a) / 86400000);
  } catch (e) { return 0; }
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { items: [], cuidados: [] };
    if (!u.plantas) u.plantas = { items: [], cuidados: [] };
    var p = u.plantas;
    if (!Array.isArray(p.items)) p.items = [];
    if (!Array.isArray(p.cuidados)) p.cuidados = [];
    return p;
  } catch (e2) { return { items: [], cuidados: [] }; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
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

/* ---------------- REFERENCIAS ---------------- */
var TIPOS = [
  '🌳 Árbol', '🌵 Cactus', '🪷 Suculenta', '🌺 Ornamental de flor',
  '🌿 Ornamental de hoja / interior', '🌱 Hierba / medicinal',
  '🌾 Trepadora / colgante', '🌴 Palmera', '🎍 Bonsái',
  '🍋 Frutal / cítrico en maceta', '🌸 Otro'
];
var UBICACIONES = ['Living', 'Cocina', 'Dormitorio', 'Baño', 'Escritorio / estudio', 'Balcón', 'Terraza', 'Patio', 'Entrada', 'Jardín', 'Invernadero', 'Otro'];
var LUCES = ['☀️ Sol directo (6h+)', '⛅ Semisombra (3–6h)', '💡 Interior luminoso', '🌥️ Sombra luminosa', '🌑 Interior poca luz'];
var SALUD = ['😍 Radiante', '🙂 Sana', '😐 Decaída', '🤒 Enferma / con plaga'];
var TIPOS_CUIDADO = ['💧 Riego', '🌱 Abono / fertilizante', '✂️ Poda / limpieza hojas', '🪴 Trasplante / cambio maceta', '🐛 Control plaga', '🔄 Girar / rotar', '💦 Pulverizar hojas', '🧪 Otra'];

function tipoDe(t) {
  for (var i = 0; i < TIPOS.length; i++) if (TIPOS[i] === t) return t;
  return '🌸 Otro';
}
function plantaById(id) {
  var p = store();
  for (var i = 0; i < p.items.length; i++) if (p.items[i].id === id) return p.items[i];
  return null;
}
function proxRiego(pl) {
  var f = parseInt(pl.freq, 10);
  if (isNaN(f) || f <= 0) f = 7;
  if (!pl.ultimoRiego) return todayKey();
  return addDaysKey(pl.ultimoRiego, f);
}
function estadoRiego(pl) {
  var hoy = todayKey(), pr = proxRiego(pl);
  var d = diffDays(hoy, pr);
  if (d < 0) return { k: 'venc', txt: 'vencido hace ' + Math.abs(d) + ' d', pr: pr };
  if (d === 0) return { k: 'hoy', txt: 'toca hoy', pr: pr };
  if (d === 1) return { k: 'man', txt: 'mañana', pr: pr };
  return { k: 'ok', txt: 'en ' + d + ' días', pr: pr };
}
function freqSugerida(tipo) {
  if (tipo.indexOf('Cactus') >= 0) return 21;
  if (tipo.indexOf('Suculenta') >= 0) return 14;
  if (tipo.indexOf('Bonsái') >= 0) return 2;
  if (tipo.indexOf('Palmera') >= 0) return 7;
  if (tipo.indexOf('Árbol') >= 0) return 7;
  if (tipo.indexOf('Frutal') >= 0) return 4;
  if (tipo.indexOf('flor') >= 0) return 3;
  if (tipo.indexOf('Trepadora') >= 0) return 5;
  if (tipo.indexOf('Hierba') >= 0) return 3;
  return 7;
}

/* ---------------- DIALOGO ---------------- */
var TABS = ['Resumen', 'Plantas', 'Cuidados', 'Guia'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('pla' + t), b = $('tabPla' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

var editId = null, fTipo = 'todos', fUbi = 'todas', fQ = '';

function buildDialog() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabPlaResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabPlaPlantas" class="btn" style="width:auto">🪴 Mis Plantas</button>' +
    '<button type="button" id="tabPlaCuidados" class="btn" style="width:auto">✅ Cuidados</button>' +
    '<button type="button" id="tabPlaGuia" class="btn" style="width:auto">📖 Guía</button></div>' +

    '<div id="plaResumen"></div>' +

    '<div id="plaPlantas" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ <span id="plaFormTitle">Nueva planta</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre * <input type="text" id="plNombre" placeholder="ej: Monstera, Ficus, Jade, Limonero" maxlength="40"></label>' +
    '<label>Tipo <select id="plTipo">' + TIPOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Nombre científico <input type="text" id="plCient" placeholder="ej: Monstera deliciosa" maxlength="50"></label>' +
    '<label>Ubicación <select id="plUbi">' + UBICACIONES.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Luz <select id="plLuz">' + LUCES.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Salud <select id="plSalud">' + SALUD.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Riego cada (días) <input type="number" id="plFreq" min="1" max="90" value="7"></label>' +
    '<label>Último riego <input type="date" id="plUltRiego"></label>' +
    '<label>Llegó a casa <input type="date" id="plLlego"></label></div>' +
    '<div class="conv-row"><label>Maceta / sustrato <input type="text" id="plMaceta" placeholder="ej: greda 20cm + compost + perlita" maxlength="60"></label></div>' +
    '<div class="conv-row"><label class="check-row" style="margin:0"><input type="checkbox" id="plTox"> ☠️ Tóxica mascotas / niños</label>' +
    '<label class="check-row" style="margin:0"><input type="checkbox" id="plFav"> ⭐ Favorita</label></div>' +
    '<label>Notas <input type="text" id="plNotas" placeholder="ej: junto a la ventana sur, no encharcar" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="plAdd" class="btn btn-accent" style="width:auto">+ Guardar planta</button>' +
    '<button type="button" id="plCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="plQ" placeholder="nombre, nota, maceta..."></label>' +
    '<label>Tipo <select id="plFQ"><option value="todos">Todos</option>' + TIPOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Ubicación <select id="plFU"><option value="todas">Todas</option>' + UBICACIONES.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div id="plaList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="plaCuidados" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Nuevo cuidado</h4>' +
    '<div class="conv-row"><label>Planta <select id="pcPlanta"></select></label>' +
    '<label>Tipo <select id="pcTipo">' + TIPOS_CUIDADO.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Fecha <input type="date" id="pcFecha"></label></div>' +
    '<label>Detalle <input type="text" id="pcNota" placeholder="ej: 500ml sin encharcar, té de plátano 1:5" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="pcAdd" class="btn btn-accent" style="width:auto">+ Guardar cuidado</button></div></div>' +
    '<div class="conv-row" style="margin-top:10px"><label>Mostrar <select id="pcFiltro"><option value="pendientes">Pendientes</option><option value="todas">Todos</option><option value="hechos">Hechos</option></select></label></div>' +
    '<div id="plaCuidList" class="habits-list" style="margin-top:8px;max-height:280px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="plaCuidStats" class="muted" style="font-size:11px"></span>' +
    '<button type="button" id="pcClear" class="btn" style="width:auto">🧹 Borrar hechos</button></div></div>' +

    '<div id="plaGuia" class="hidden">' +
    '<div class="si-card"><h4>🪷 Suculentas y 🌵 cactus (las que más se mueren por amor)</h4><p><b>Luz:</b> sol directo o interior muy luminoso (ventana sur). Sin luz se estiran (etiolan). <b>Agua:</b> solo cuando el sustrato está seco hasta el fondo: cactus cada ~21 días, suculentas cada ~14. Invierno Penco: la mitad. <b>Maceta:</b> SIEMPRE con hoyo + sustrato mineral (tierra + perlita/arena gruesa 50/50). Sin drenaje = pudrición. <b>Luna:</b> trasplanta en menguante.</p></div>' +
    '<div class="si-card"><h4>🌿 Interior de hoja (monstera, filodendro, potus, ficus, helecho)</h4><p><b>Luz:</b> interior luminoso sin sol quemante del mediodía (velo o 1 m de la ventana). <b>Agua:</b> dedo 2 cm seco = regar (~cada 7 días verano, 10–14 invierno). Pulveriza hojas en semanas secas y limpia el polvo (respiran mejor). <b>Gira</b> ¼ de vuelta cada luna para que crezca pareja. Amarillas blandas = exceso de agua; puntas marrones = aire seco o sales.</p></div>' +
    '<div class="si-card"><h4>🌳 Árboles y 🍋 frutales en maceta (ficus, olivo, limonero, nativo)</h4><p><b>Luz:</b> el máximo que tengas (terraza/patio ideal). <b>Maceta grande</b> (20 L+) con compost + perlita; trasplanta cada 1–2 años en menguante de otoño. <b>Agua:</b> profundo hasta que drene, deja secar la capa de arriba. <b>Poda:</b> limpia ramas cruzadas a fines de invierno. Cítricos: fierro + sol para hojas verdes (clorosis = pide abono).</p></div>' +
    '<div class="si-card"><h4>🌺 Ornamentales de flor (geranio, rayito, dimorfoteca, cala)</h4><p><b>Sol</b> 4–6 h para florecer. <b>Saca flores secas</b> (estimula nuevas). <b>Abono floración</b> en creciente de primavera-verano cada 15 días (té de plátano/compost). No mojes la flor al regar; riega a la base temprano AM.</p></div>' +
    '<div class="si-card"><h4>🟫 Sustrato pencón (arcilla + arena)</h4><p>La tierra de Penco se apelmaza: mézclala siempre — <b>40% tierra + 30% compost + 30% perlita/arena gruesa</b>. Capa de mulch (paja/hojas) arriba guarda humedad en verano. Si el agua queda empozada 1 día = cambia a maceta con hoyo y más perlita.</p></div>' +
    '<div class="si-card"><h4>🌙 Ritmo lunar simple</h4><p><b>Menguante:</b> trasplantes, podas, esquejes, control de plagas. <b>Creciente:</b> fertilizar y estimular hoja/flor. <b>Llena:</b> observar y fotografiar avance. <b>Nueva:</b> planificar compras y limpiar el rincón verde.</p></div>' +
    '<div class="si-card"><h4>☠️ Toxicidad + 🐛 plagas comunes</h4><p><b>Ojo mascotas/niños:</b> monstera, filodendro, potus, dieffenbachia, cala, laurel de flor y ficus irritan si se muerden — márcalas con ☠️ y ponlas en alto. <b>Plagas:</b> cochinilla (algodón en tallos: alcohol + cotonito), pulgón (chorro de agua + jabón potásico), hongos por exceso de agua (canela en polvo + menos riego). Aísla la enferma 2 semanas.</p></div>' +
    '</div>';

  makeDialog('plantasDialog', '🪴 Mis Plantas — mi selva en casa',
    'Tus árboles, suculentas, cactus y ornamentales: riego automático, cuidados y guía. <b>Privado y local</b> por usuario, 100% offline.',
    body);
}

/* ---------------- RENDER ---------------- */
function refreshCuidSelect() {
  var s = $('pcPlanta'); if (!s) return;
  var p = store();
  var act = p.items.filter(function (x) { return !x.archivada; });
  s.innerHTML = act.length ? act.map(function (x) {
    return '<option value="' + esc(x.id) + '">' + esc(tipoDe(x.tipo).split(' ')[0] + ' ' + x.nombre) + ' · ' + esc(x.ubicacion || '') + '</option>';
  }).join('') : '<option value="">(primero agrega una planta)</option>';
  var f = $('pcFecha'); if (f && !f.value) f.value = todayKey();
  var ur = $('plUltRiego'); if (ur && !ur.value) ur.value = todayKey();
  var ll = $('plLlego'); if (ll && !ll.value) ll.value = todayKey();
}

function renderResumen() {
  var box = $('plaResumen'); if (!box) return;
  var p = store(), hoy = todayKey();
  var act = p.items.filter(function (x) { return !x.archivada; });
  var arch = p.items.length - act.length;
  var porTipo = {};
  act.forEach(function (x) { porTipo[x.tipo] = (porTipo[x.tipo] || 0) + 1; });
  var rie = act.map(function (x) { return { x: x, e: estadoRiego(x) }; });
  var venc = rie.filter(function (r) { return r.e.k === 'venc'; }).sort(function (a, b) { return a.e.pr.localeCompare(b.e.pr); });
  var hoyL = rie.filter(function (r) { return r.e.k === 'hoy'; });
  var enfermas = act.filter(function (x) { return (x.salud || '').indexOf('Enferma') >= 0 || (x.salud || '').indexOf('Deca') >= 0; });
  var pend = p.cuidados.filter(function (c) { return !c.hecho; }).sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); });
  var pendVenc = pend.filter(function (c) { return c.fecha && c.fecha < hoy; });
  var favs = act.filter(function (x) { return x.fav; });

  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>🪴 Mi selva</h4><p style="font-size:22px;color:var(--gold)"><b>' + act.length + '</b> <span style="font-size:12px">plantas</span></p>' +
    '<p class="muted" style="font-size:11px">' + Object.keys(porTipo).map(function (k) { return esc(k + ': ' + porTipo[k]); }).join(' · ') + (act.length ? '' : 'Agrega tu primera planta en 🪴 Mis Plantas.') + (arch ? '<br>📦 ' + arch + ' archivada(s)' : '') + '</p></div>' +
    '<div class="menstrual-card"><h4>💧 Riego</h4><p style="font-size:22px;color:var(--gold)"><b>' + hoyL.length + '</b> <span style="font-size:12px">hoy</span>' + (venc.length ? ' · <b style="color:#e76e8a">' + venc.length + ' venc.</b>' : '') + '</p>' +
    '<p class="muted" style="font-size:11px">' + pend.length + ' cuidados pendientes' + (pendVenc.length ? ' (' + pendVenc.length + ' vencidos)' : '') + (enfermas.length ? ' · 🤒 ' + enfermas.length + ' pide(n) ayuda' : '') + '</p></div></div>' +

    '<div class="menstrual-card" style="margin-top:10px"><h4>💧 Riegos (automático según cada planta)</h4>' +
    (act.length ? rie.sort(function (a, b) { return a.e.pr.localeCompare(b.e.pr); }).slice(0, 6).map(function (r) {
      var dot = r.e.k === 'venc' ? '🔴' : r.e.k === 'hoy' ? '🔵' : r.e.k === 'man' ? '🟡' : '🟢';
      return '<div class="hora-item"><span style="font-size:12px">' + dot + ' <b>' + esc(r.x.nombre) + '</b> <span class="muted">· ' + esc(r.e.pr) + ' (' + esc(r.e.txt) + ')</span><br><span class="muted" style="font-size:10px">' + esc(r.x.tipo || '') + ' · ' + esc(r.x.ubicacion || '') + '</span></span>' +
        '<button type="button" class="btn pla-regar" data-k="' + esc(r.x.id) + '" style="width:auto;font-size:11px">💧 Regar</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px">Sin plantas aún.</p>') + '</div>' +

    (enfermas.length ? '<div class="menstrual-card" style="margin-top:10px;border-color:#e8c56a"><h4>🤒 Piden ayuda</h4><p class="muted" style="font-size:11px">' + enfermas.map(function (x) { return esc(x.nombre + ' (' + (x.salud || '') + ')'); }).join('<br>') + '</p></div>' : '') +

    '<div class="menstrual-card" style="margin-top:10px"><h4>✅ Próximos cuidados</h4>' +
    (pend.length ? pend.slice(0, 5).map(function (c) {
      var pl = plantaById(c.plantaId);
      var v = c.fecha && c.fecha < hoy;
      return '<div class="hora-item"><span style="font-size:12px">' + (v ? '🔴' : '⬜') + ' <b>' + esc(c.tipo || 'Cuidado') + '</b> · ' + esc(c.fecha || 'sin fecha') + '<br><span class="muted" style="font-size:10px">' + esc(pl ? pl.nombre : '') + (c.nota ? ' · ' + esc(c.nota) : '') + '</span></span></div>';
    }).join('') : '<p class="muted" style="font-size:11px">Sin cuidados pendientes. Crea uno en ✅ Cuidados.</p>') + '</div>' +

    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="plaGoAdd" class="btn" style="width:auto">➕ Agregar mi primera planta</button>' +
    '<button type="button" id="plaShareBtn" class="btn" style="width:auto">📤 Compartir resumen</button></div>';

  var g = $('plaGoAdd'); if (g) g.onclick = function () { switchTab('Plantas'); };
  var sh = $('plaShareBtn'); if (sh) sh.onclick = shareResumen;
  box.querySelectorAll('.pla-regar').forEach(function (b) {
    b.onclick = function () { regarHoy(b.dataset.k); };
  });
}

function regarHoy(id) {
  var pl = plantaById(id); if (!pl) return;
  pl.ultimoRiego = todayKey();
  var p = store();
  p.cuidados.push({ id: uid('pc'), plantaId: id, tipo: '💧 Riego', fecha: todayKey(), nota: 'Riego registrado', hecho: true });
  save('Riego guardado 💧');
  renderAll();
}

async function shareResumen() {
  var p = store();
  var act = p.items.filter(function (x) { return !x.archivada; });
  var t = '🪴 Mis plantas en casa — ' + todayKey() + '\n' +
    'Total: ' + act.length + ' plantas\n' +
    act.map(function (x) {
      var e = estadoRiego(x);
      return '• ' + x.nombre + ' (' + (x.tipo || '') + ' · ' + (x.ubicacion || '?') + ') · riego: ' + e.pr + ' (' + e.txt + ') · ' + (x.salud || 'Sana');
    }).join('\n');
  await share('Mis plantas', t);
}

function renderPlantas() {
  var box = $('plaList'); if (!box) return;
  var p = store();
  var q = (fQ || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = p.items.slice().sort(function (a, b) { return (a.archivada ? 1 : 0) - (b.archivada ? 1 : 0) || String(a.nombre).localeCompare(String(b.nombre)); });
  if (fTipo !== 'todos') list = list.filter(function (x) { return x.tipo === fTipo; });
  if (fUbi !== 'todas') list = list.filter(function (x) { return x.ubicacion === fUbi; });
  if (q) list = list.filter(function (x) {
    var t = ((x.nombre || '') + ' ' + (x.cient || '') + ' ' + (x.nota || '') + ' ' + (x.maceta || '') + ' ' + (x.tipo || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin plantas con ese filtro. Agrega la primera arriba: ej "Jade" 🪷 Suculenta.</p>';
    return;
  }
  box.innerHTML = list.map(function (x) {
    var e = estadoRiego(x);
    var dot = e.k === 'venc' ? '🔴' : e.k === 'hoy' ? '🔵' : e.k === 'man' ? '🟡' : '🟢';
    return '<div class="si-card' + (x.archivada ? '" style="opacity:.6' : '') + '"><h4>' + esc((x.tipo || '🌸').split(' ')[0] + ' ' + x.nombre) + (x.fav ? ' ⭐' : '') + (x.archivada ? ' <span class="chip" style="font-size:10px">archivada</span>' : '') + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(x.tipo || '') + '</span>' +
      (x.ubicacion ? '<span class="chip" style="font-size:10px">📍 ' + esc(x.ubicacion) + '</span>' : '') +
      (x.luz ? '<span class="chip" style="font-size:10px">' + esc(x.luz) + '</span>' : '') +
      '<span class="chip" style="font-size:10px">' + dot + ' riego: ' + esc(e.pr) + '</span>' +
      (x.salud ? '<span class="chip" style="font-size:10px">' + esc(x.salud) + '</span>' : '') +
      (x.tox ? '<span class="chip" style="font-size:10px">☠️ tóxica</span>' : '') + '</p>' +
      (x.cient ? '<p class="muted" style="font-style:italic">' + esc(x.cient) + '</p>' : '') +
      (x.maceta ? '<p><b>Maceta:</b> ' + esc(x.maceta) + '</p>' : '') +
      (x.nota ? '<p class="muted">' + esc(x.nota) + '</p>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn pla-r" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">💧 Regar hoy</button>' +
      '<button type="button" class="btn pla-c" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✅ + Cuidado</button>' +
      '<button type="button" class="btn pla-e" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn pla-a" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">' + (x.archivada ? '📂 Reactivar' : '📦 Archivar') + '</button>' +
      '<button type="button" class="btn pla-d" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('.pla-r').forEach(function (b) { b.onclick = function () { regarHoy(b.dataset.k); }; });
  box.querySelectorAll('.pla-c').forEach(function (b) {
    b.onclick = function () {
      switchTab('Cuidados'); refreshCuidSelect();
      var s = $('pcPlanta'); if (s) s.value = b.dataset.k;
    };
  });
  box.querySelectorAll('.pla-e').forEach(function (b) {
    b.onclick = function () {
      var x = plantaById(b.dataset.k); if (!x) return;
      editId = x.id;
      $('plNombre').value = x.nombre || ''; $('plTipo').value = x.tipo || TIPOS[0];
      $('plCient').value = x.cient || ''; $('plUbi').value = x.ubicacion || UBICACIONES[0];
      $('plLuz').value = x.luz || LUCES[0]; $('plSalud').value = x.salud || SALUD[1];
      $('plFreq').value = x.freq || 7; $('plUltRiego').value = x.ultimoRiego || todayKey();
      $('plLlego').value = x.llego || ''; $('plMaceta').value = x.maceta || '';
      $('plTox').checked = !!x.tox; $('plFav').checked = !!x.fav;
      $('plNotas').value = x.nota || '';
      $('plaFormTitle').textContent = 'Editar planta';
      $('plAdd').textContent = '↻ Actualizar planta';
      $('plCancel').classList.remove('hidden');
      switchTab('Plantas');
    };
  });
  box.querySelectorAll('.pla-a').forEach(function (b) {
    b.onclick = function () {
      var x = plantaById(b.dataset.k); if (!x) return;
      x.archivada = !x.archivada; save(); renderAll();
    };
  });
  box.querySelectorAll('.pla-d').forEach(function (b) {
    b.onclick = function () {
      var p2 = store();
      var n = p2.cuidados.filter(function (c) { return c.plantaId === b.dataset.k; }).length;
      if (!confirm(n ? '¿Borrar esta planta y sus ' + n + ' cuidado(s)?' : '¿Borrar esta planta?')) return;
      p2.items = p2.items.filter(function (x) { return x.id !== b.dataset.k; });
      p2.cuidados = p2.cuidados.filter(function (c) { return c.plantaId !== b.dataset.k; });
      save(); renderAll();
    };
  });
}

function renderCuidados() {
  var box = $('plaCuidList'); if (!box) return;
  var p = store();
  var f = ($('pcFiltro') || {}).value || 'pendientes';
  var list = p.cuidados.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); });
  if (f === 'pendientes') list = list.filter(function (c) { return !c.hecho; });
  if (f === 'hechos') list = list.filter(function (c) { return c.hecho; });
  var st = $('plaCuidStats');
  var pend = p.cuidados.filter(function (c) { return !c.hecho; }).length;
  if (st) st.textContent = p.cuidados.length + ' cuidados · ' + pend + ' pendientes';
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin cuidados aquí. Crea el primero arriba: ej "💧 Riego".</p>';
    return;
  }
  var hoy = todayKey();
  box.innerHTML = list.map(function (c) {
    var pl = plantaById(c.plantaId);
    var v = !c.hecho && c.fecha && c.fecha < hoy;
    return '<div class="hora-item' + (c.hecho ? '" style="opacity:.6' : '') + '"><span style="font-size:12px"><b>' + (c.hecho ? '✅' : v ? '🔴' : '⬜') + ' ' + esc(c.tipo || 'Cuidado') + '</b> · ' + esc(c.fecha || 'sin fecha') +
      '<br><span class="muted" style="font-size:10px">' + esc(pl ? pl.nombre : '(planta borrada)') + (c.nota ? ' · ' + esc(c.nota) : '') + '</span></span>' +
      '<span class="hora-actions"><button type="button" class="btn btn-icon pla-cd" data-k="' + esc(c.id) + '" title="Marcar">' + (c.hecho ? '↩' : '✓') + '</button>' +
      '<button type="button" class="btn btn-icon pla-cx" data-k="' + esc(c.id) + '">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.pla-cd').forEach(function (b) {
    b.onclick = function () {
      var p2 = store(), t = null;
      p2.cuidados.forEach(function (c) { if (c.id === b.dataset.k) t = c; });
      if (t) {
        t.hecho = !t.hecho;
        if (t.hecho && t.tipo && t.tipo.indexOf('Riego') >= 0 && t.plantaId) {
          var pl = plantaById(t.plantaId);
          if (pl) pl.ultimoRiego = t.fecha || todayKey();
        }
      }
      save(); renderAll();
    };
  });
  box.querySelectorAll('.pla-cx').forEach(function (b) {
    b.onclick = function () {
      var p2 = store();
      p2.cuidados = p2.cuidados.filter(function (c) { return c.id !== b.dataset.k; });
      save(); renderAll();
    };
  });
}

function renderAll() {
  refreshCuidSelect();
  renderResumen();
  renderPlantas();
  renderCuidados();
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) botón en Hogar y Vida Práctica > 🍽️ Casa (sin subsección aparte) */
  try {
    var g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
    if (g) {
      // limpieza: si quedó la etiqueta vieja 🪴 Mis Plantas de la versión anterior, quitarla
      try {
        var oldLab = g.querySelector('.sub-label[data-sub="plantas"]');
        if (oldLab && oldLab.parentNode) oldLab.parentNode.removeChild(oldLab);
      } catch (eL) {}
      if (!$('btnPlantas')) {
        var btn = document.createElement('button');
        btn.id = 'btnPlantas'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🪴 Mis Plantas';
        try { btn.setAttribute('data-sub', 'casa'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'plantas mis plantas arbol arboles suculenta suculentas cactus ornamental interior exterior maceta macetero riego abono poda trasplante jardin balcon terraza patio monstera ficus jade potus');
        // al final de Casa = justo antes de la etiqueta Energía y Taller
        var refE = g.querySelector('.sub-label[data-sub="energia"]');
        if (refE) g.insertBefore(btn, refE);
        else g.appendChild(btn);
      } else {
        try {
          $('btnPlantas').setAttribute('data-sub', 'casa');
          var be = $('btnPlantas');
          var refE2 = g.querySelector('.sub-label[data-sub="energia"]');
          if (refE2 && be && be.nextSibling !== refE2) g.insertBefore(be, refE2);
        } catch (eS2) {}
      }
    }
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnPlantas') < 0) ALL_BTNS.push('btnPlantas');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnPlantas = ['hogar', 'casa'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      // quitar orden viejo de subsección propia si existiera
      try { if (BTN_ORDER['hogar|plantas']) delete BTN_ORDER['hogar|plantas']; } catch (eD) {}
      if (BTN_ORDER['hogar|casa'] && BTN_ORDER['hogar|casa'].indexOf('btnPlantas') < 0) BTN_ORDER['hogar|casa'].push('btnPlantas');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnPlantas = true; });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnPlantas"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab2 = document.createElement('label');
          lab2.className = 'check-row';
          lab2.innerHTML = '<input type="checkbox" data-btn="btnPlantas"> 🪴 Mis Plantas';
          gr.appendChild(lab2);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab2.querySelector('input').checked = !vis || vis.btnPlantas !== false;
            lab2.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnPlantas = lab2.querySelector('input').checked;
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

  /* 2) diálogo */
  buildDialog();
  renderAll();

  var b = $('btnPlantas');
  if (b) b.onclick = function () {
    renderAll();
    switchTab('Resumen');
    openDlg('plantasDialog');
  };

  TABS.forEach(function (t) {
    var tb = $('tabPla' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  /* Planta: sugerir frecuencia según tipo + guardar */
  var tp = $('plTipo'), fr = $('plFreq');
  if (tp && fr) tp.onchange = function () { fr.value = freqSugerida(tp.value); };
  var ad = $('plAdd');
  if (ad) ad.onclick = function () {
    var nombre = clean((($('plNombre') || {}).value || '').trim(), 40);
    if (!nombre) return alert('Ponle nombre a tu planta (ej: Monstera, Jade, Limonero)');
    var p = store();
    var datos = {
      nombre: nombre, tipo: ($('plTipo') || {}).value || '🌸 Otro',
      cient: clean((($('plCient') || {}).value || '').trim(), 50),
      ubicacion: ($('plUbi') || {}).value || 'Living',
      luz: ($('plLuz') || {}).value || LUCES[0],
      salud: ($('plSalud') || {}).value || SALUD[1],
      freq: Math.max(1, Math.min(90, parseInt(($('plFreq') || {}).value) || 7)),
      ultimoRiego: ($('plUltRiego') || {}).value || todayKey(),
      llego: ($('plLlego') || {}).value || '',
      maceta: clean((($('plMaceta') || {}).value || '').trim(), 60),
      tox: !!($('plTox') || {}).checked, fav: !!($('plFav') || {}).checked,
      nota: clean((($('plNotas') || {}).value || '').trim(), 120)
    };
    if (editId) {
      var ex = plantaById(editId);
      if (ex) Object.keys(datos).forEach(function (k) { ex[k] = datos[k]; });
      editId = null;
      $('plaFormTitle').textContent = 'Nueva planta';
      ad.textContent = '+ Guardar planta';
      $('plCancel').classList.add('hidden');
    } else {
      datos.id = uid('pl'); datos.archivada = false; datos.creado = todayKey();
      p.items.push(datos);
    }
    save('Planta guardada 🪴');
    $('plNombre').value = ''; $('plCient').value = ''; $('plMaceta').value = ''; $('plNotas').value = '';
    $('plTox').checked = false; $('plFav').checked = false;
    renderAll();
  };
  var cc = $('plCancel');
  if (cc) cc.onclick = function () {
    editId = null;
    $('plaFormTitle').textContent = 'Nueva planta';
    $('plAdd').textContent = '+ Guardar planta';
    cc.classList.add('hidden');
    $('plNombre').value = ''; $('plCient').value = ''; $('plMaceta').value = ''; $('plNotas').value = '';
  };
  var qq = $('plQ'); if (qq) qq.oninput = function () { fQ = qq.value; renderPlantas(); };
  var fq = $('plFQ'); if (fq) fq.onchange = function () { fTipo = fq.value; renderPlantas(); };
  var fu = $('plFU'); if (fu) fu.onchange = function () { fUbi = fu.value; renderPlantas(); };

  /* Cuidado: guardar */
  var ca = $('pcAdd');
  if (ca) ca.onclick = function () {
    var pid = ($('pcPlanta') || {}).value || '';
    if (!pid) return alert('Primero agrega una planta en 🪴 Mis Plantas');
    var p = store();
    p.cuidados.push({
      id: uid('pc'), plantaId: pid,
      tipo: ($('pcTipo') || {}).value || '💧 Riego',
      fecha: ($('pcFecha') || {}).value || todayKey(),
      nota: clean((($('pcNota') || {}).value || '').trim(), 100), hecho: false
    });
    save('Cuidado guardado ✅');
    $('pcNota').value = '';
    renderAll();
  };
  var cf = $('pcFiltro'); if (cf) cf.onchange = function () { renderCuidados(); };
  var cl = $('pcClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar cuidados hechos?')) return;
    var p = store();
    p.cuidados = p.cuidados.filter(function (c) { return !c.hecho; });
    save(); renderAll();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
