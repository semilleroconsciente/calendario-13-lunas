/* ============================================================
   FLORA — Calendario 13 Lunas (Penco · Bio-Bío)
   Apartado: Territorio > Flora (btnFlora -> floraDialog),
   pestañas: Flora hoy | Bitácora | Links de interés.
   - Flora hoy: intro cuenca estero Penco + catálogo base tocable
     (carga la especie en la bitácora) + especies propias.
   - Bitácora: registros privados y locales por usuario
     (fecha, lugar, especie, tipo, cantidad, notas + luna auto).
   - Links de interés: enlace Zenodo solicitado + accesos internos
     + enlaces propios del usuario (privados y locales).
   Todo local, sin red obligatoria. Se edita aquí mismo.
   Conecta con Bosque Nativo, Lawen Herbario y Aves.
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
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
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

/* ---------- datos base ---------- */
var FLORA_INTRO = 'Flora de la <b>cuenca del estero Penco</b>: ribera, quebradas y laderas que alimentan el humedal y la bahía. ' +
  'Hierbas, flores, juncos y arbustos —el piso vivo bajo el bosque nativo—. <b>Observa sin arrancar</b>: foto, lugar y fecha valen más que una muestra. ' +
  'Compara lo que veas con la lista publicada de la cuenca (pestaña 🔗 Links).';

var FLORA_BASE = [
  { nombre: 'Totora', cient: 'Schoenoplectus californicus', tipo: 'Junco ribereño', hab: 'Orilla del estero, pozas', epoca: 'Todo el año', nota: 'Filtra el agua y refugia aves. No cortes matas completas.' },
  { nombre: 'Junco', cient: 'Juncus spp.', tipo: 'Junco', hab: 'Vegas y bordes húmedos', epoca: 'Todo el año', nota: 'Indica agua casi permanente. Buen punto para volver a observar.' },
  { nombre: 'Nalca / Pangue', cient: 'Gunnera tinctoria', tipo: 'Hierba gigante', hab: 'Vegas y estero sombreado', epoca: 'Pewü (primavera)', nota: 'Peciolo comestible (nalca); hoja solo ornamental. Cosecha 1 peciolo por planta.' },
  { nombre: 'Chilco', cient: 'Fuchsia magellanica', tipo: 'Arbusto flor', hab: 'Quebradas húmedas', epoca: 'Pewü–Walüng', nota: 'Flor colgante favorita del picaflor. No cortes flores.' },
  { nombre: 'Helecho costilla de vaca', cient: 'Blechnum chilense', tipo: 'Helecho', hab: 'Quebrada sombreada', epoca: 'Todo el año', nota: 'Alfombra lo sombrío e indica aire y suelo sanos. Solo foto.' },
  { nombre: 'Maqui', cient: 'Aristotelia chilensis', tipo: 'Arbusto fruto', hab: 'Borde de bosque y estero', epoca: 'Walüng (verano)', nota: 'Baya negra en racimo. Cosecha 30%, deja 70% a aves y suelo.' },
  { nombre: 'Mora / Murra', cient: 'Rubus spp.', tipo: 'Arbusto fruto', hab: 'Cercos y quebradas bajas', epoca: 'Walüng', nota: 'Negra brillante = madura. Lavar por polvo de camino.' },
  { nombre: 'Llantén', cient: 'Plantago major', tipo: 'Hierba lawen', hab: 'Bordes de sendero húmedo', epoca: 'Pewü–Walüng', nota: 'Hoja en roseta con nervios paralelos. Uso externo tradicional.' },
  { nombre: 'Menta / Poleo', cient: 'Mentha spp.', tipo: 'Hierba aromática', hab: 'Acequias y vegas', epoca: 'Pewü–Walüng', nota: 'Tallo cuadrado y olor fresco. Corta puntas, no arranques raíz.' },
  { nombre: 'Cortadera / Cola de zorro', cient: 'Cortaderia spp.', tipo: 'Pasto penacho', hab: 'Laderas y bordes del estero', epoca: 'Rimü (otoño)', nota: 'Penacho plateado otoñal. Hojas cortan: observar de lejos.' }
];

/* Links de interés (base, no se borran) */
var FLORA_LINKS_BASE = [
  {
    titulo: 'Registro fotográfico y Lista de plantas observadas en la cuenca del estero Penco (Biobío, Chile)',
    autor: 'Avilez Soto, Bruno',
    url: 'https://zenodo.org/records/21269869',
    nota: 'Zenodo · registro abierto: fotos + lista de plantas de la cuenca. Úsalo para comparar lo que observes en terreno.'
  }
];

/* ---------- storage privado por usuario ---------- */
function getFloraData() {
  var a = store('flora', { entries: [] });
  if (!a || !Array.isArray(a.entries)) { try { var u = userData(); u.flora = { entries: [] }; return u.flora; } catch (e) { return { entries: [] }; } }
  return a;
}
function getFloraCustom() {
  var a = store('floraCustom', []);
  return Array.isArray(a) ? a : [];
}
function getFloraLinks() {
  var a = store('floraLinks', []);
  return Array.isArray(a) ? a : [];
}
var floraEditingId = null;
var floraCatQ = '';

/* ---------- pestañas ---------- */
var floraTab = 'hoy';
function switchFloraTab(t) {
  floraTab = t;
  var b1 = $('tabFloraHoy'), b2 = $('tabFloraBit'), b3 = $('tabFloraLinks');
  if (b1) b1.classList.toggle('btn-accent', t === 'hoy');
  if (b2) b2.classList.toggle('btn-accent', t === 'bit');
  if (b3) b3.classList.toggle('btn-accent', t === 'links');
  var p1 = $('floraHoyPanel'), p2 = $('floraBitPanel'), p3 = $('floraLinksPanel');
  if (p1) p1.classList.toggle('hidden', t !== 'hoy');
  if (p2) p2.classList.toggle('hidden', t !== 'bit');
  if (p3) p3.classList.toggle('hidden', t !== 'links');
  if (t === 'hoy') renderFloraHoy();
  if (t === 'bit') renderFloraLog();
  if (t === 'links') renderFloraLinks();
}

/* ---------- Flora hoy: intro + hoy + catálogo ---------- */
function allFloraSpecies() {
  return FLORA_BASE.map(function (f) { f.mine = false; return f; })
    .concat(getFloraCustom().map(function (f) { f.mine = true; return f; }));
}
function renderFloraHoy() {
  var todayBox = $('floraTodayBox');
  if (todayBox) {
    var k = todayKey();
    var entries = [];
    try { entries = getFloraData().entries || []; } catch (e) {}
    var spp = {};
    entries.forEach(function (x) { var s = String(x.species || '').trim().toLowerCase(); if (s) spp[s] = 1; });
    var hoy = entries.filter(function (x) { return x.date === k; }).length;
    todayBox.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span style="font-size:14px"><b>🌸 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip" style="background:var(--gold);color:#10142c">' + hoy + ' hoy · ' + entries.length + ' total · ' + Object.keys(spp).length + ' especies</span></div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">' + FLORA_INTRO + '</p>';
  }
  var moonBox = $('floraMoonBox');
  if (moonBox) {
    var k2 = todayKey();
    var fase = '';
    try {
      var tithi = (window.astro && window.astro.tithi) ? window.astro.tithi(new Date(k2 + 'T12:00:00').getTime()) : 0;
      fase = tithi < 7 ? 'Creciente — flores y brotes (foto, no corte)' : tithi < 14 ? 'Llena — máxima savia, mejor para observar y oler' : tithi < 21 ? 'Menguante — semilla madura, guarda en papel' : 'Nueva — descanso, ordena fotos y notas';
      moonBox.innerHTML = '<b>' + esc(fase) + '</b> (tithi ' + tithi + ') · ' + esc(lunaTxt(k2));
    } catch (e) { moonBox.innerHTML = esc(lunaTxt(k2)); }
  }
  var catBox = $('floraCatalogBox');
  if (!catBox) return;
  var q = (floraCatQ || '').toLowerCase();
  var list = allFloraSpecies().filter(function (f) {
    if (!q) return true;
    return ((f.nombre || '') + ' ' + (f.cient || '') + ' ' + (f.tipo || '') + ' ' + (f.hab || '')).toLowerCase().indexOf(q) >= 0;
  });
  var nMine = getFloraCustom().length;
  var html = '<input type="text" id="floraCatFilter" placeholder="🔍 Filtrar... (ej: ribera, flor, helecho)" autocomplete="off" value="' + esc(floraCatQ) + '" style="margin-bottom:6px">';
  html += '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + FLORA_BASE.length + ' base' + (nMine ? ' + <b>' + nMine + ' mías</b>' : '') + ' · mostrando ' + list.length + ' · toca una para cargarla en la bitácora.</p>';
  if (!list.length) html += '<p class="muted">Sin resultados. Prueba con "estero", "flor" o "quebrada" — o agrégala abajo.</p>';
  html += '<div class="fishing-species">' + list.map(function (f) {
    var mineChip = f.mine ? ' <span class="chip" style="font-size:9px;background:#a9d18e22;color:#a9d18e;border-color:#a9d18e55">mía</span>' : '';
    return '<div class="fishing-species-item" style="cursor:pointer' + (f.mine ? ';border-color:#a9d18e55' : '') + '" data-flora="' + esc(f.nombre) + '"><b>🌸 ' + esc(f.nombre) + '</b>' + mineChip +
      ' — <span class="muted" style="font-size:10px">' + esc(f.cient || '') + '</span> <span class="chip" style="font-size:9px;margin-left:6px">' + esc(f.tipo || '') + '</span><br>' +
      '<span style="font-size:11px">' + esc(f.hab || '') + ' · ' + esc(f.epoca || '') + '</span><br>' +
      '<span class="muted" style="font-size:10px">' + esc(f.nota || '') + '</span></div>';
  }).join('') + '</div>';
  html += '<details style="border:1px dashed var(--gold);border-radius:10px;padding:8px 10px;margin-top:6px"><summary style="cursor:pointer;font-size:12px;color:var(--gold)"><b>➕ Agregar especie</b></summary>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Especie * <input type="text" id="floraSpName" placeholder="ej: Dedal de oro, Tabaco del diablo" maxlength="30"></label></div>' +
    '<div class="conv-row"><label style="flex:2">Nombre científico <input type="text" id="floraSpCient" placeholder="ej: Eschscholzia californica" maxlength="40"></label><label>Tipo <input type="text" id="floraSpTipo" placeholder="ej: Flor, Hierba, Arbusto" maxlength="20"></label></div>' +
    '<div class="conv-row"><label style="flex:2">Dónde la viste <input type="text" id="floraSpHab" placeholder="ej: Borde estero Penco" maxlength="50"></label><label>Época <input type="text" id="floraSpEpoca" placeholder="ej: Pewü" maxlength="25"></label></div>' +
    '<label>Nota <input type="text" id="floraSpNota" placeholder="ej: Solo foto, no cortar" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="floraSpAdd" class="btn btn-accent" style="width:auto">+ Guardar especie</button></div></details>';
  catBox.innerHTML = html;
  var filt = $('floraCatFilter');
  if (filt) filt.oninput = function () {
    floraCatQ = filt.value || '';
    var items = catBox.querySelectorAll('[data-flora]');
    var q2 = floraCatQ.toLowerCase();
    items.forEach(function (it) { it.style.display = (!q2 || it.textContent.toLowerCase().indexOf(q2) >= 0) ? '' : 'none'; });
  };
  catBox.querySelectorAll('[data-flora]').forEach(function (el) {
    el.onclick = function () {
      switchFloraTab('bit');
      setTimeout(function () {
        var inp = $('floraSpecies');
        if (inp) { inp.value = el.getAttribute('data-flora'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
      }, 60);
    };
  });
  var add = $('floraSpAdd');
  if (add) add.onclick = function () {
    var n = clean(($('floraSpName') || {}).value || '', 30).trim();
    if (!n) { alert('Pon el nombre de la especie'); return; }
    var arr = getFloraCustom();
    var exists = FLORA_BASE.some(function (x) { return x.nombre.toLowerCase() === n.toLowerCase(); }) ||
      arr.some(function (x) { return String(x.nombre || '').toLowerCase() === n.toLowerCase(); });
    if (exists) { alert('Esa especie ya existe'); return; }
    arr.push({
      nombre: n,
      cient: clean(($('floraSpCient') || {}).value || '', 40),
      tipo: clean(($('floraSpTipo') || {}).value || '', 20) || 'Flora',
      hab: clean(($('floraSpHab') || {}).value || '', 50) || 'Cuenca estero Penco',
      epoca: clean(($('floraSpEpoca') || {}).value || '', 25) || 'Todo el año',
      nota: clean(($('floraSpNota') || {}).value || '', 80)
    });
    save('Especie guardada 🌸');
    renderFloraHoy();
  };
}

/* ---------- Bitácora ---------- */
function buildFloraShareText(entryOrAll) {
  if (Array.isArray(entryOrAll)) {
    if (!entryOrAll.length) return 'Bitácora flora — cuenca estero Penco · sin registros aún';
    var t = '🌸 Bitácora flora — cuenca estero Penco\n' + entryOrAll.length + ' registros\n\n';
    entryOrAll.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
      t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + e.species + ' (' + (e.kind || '—') + ')' + (e.qty ? ' · ' + e.qty : '') + ' · ' + (e.place || '—');
      if (e.notes) t += ' — ' + e.notes;
      t += '\n';
    });
    return t + '\n— Mari Küla Küyen · Penco';
  }
  var e2 = entryOrAll;
  return '🌸 ' + e2.species + ' · ' + (e2.kind || '') + ' · ' + e2.date + ' ' + (e2.time || '') + '\n' +
    (e2.place ? '📍 ' + e2.place + '\n' : '') + (e2.qty ? 'Cantidad: ' + e2.qty + '\n' : '') +
    (e2.notes ? '📝 ' + e2.notes + '\n' : '') + '🌙 ' + lunaTxt(e2.date) + '\n— Bitácora flora · Mari Küla Küyen';
}
function renderFloraLog() {
  var box = $('floraLogBox');
  if (!box) return;
  var data = [];
  try { data = getFloraData().entries || []; } catch (e) {}
  var stats = $('floraStats');
  if (!data.length) { box.innerHTML = '<p class="muted">Sin registros. Observa una planta del estero o quebrada y anótala: fecha, lugar y foto valen ciencia.</p>'; if (stats) stats.textContent = '0 registros'; return; }
  var sorted = data.slice().sort(function (a, b) { return (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')); });
  box.innerHTML = sorted.slice(0, 80).map(function (it) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(it.species) + '</b> · <span class="chip" style="font-size:10px">' + esc(it.kind || 'observación') + '</span>' + (it.qty ? ' · ' + esc(it.qty) : '') + ' — ' + esc(it.place || '—') +
      '<br><span class="muted" style="font-size:11px">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted" style="font-size:11px">' + esc(it.notes || '') + '</span></span>' +
      '<span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="' + it.id + '" class="btn flora-share" style="width:auto;font-size:11px" title="Compartir">📤</button><button data-id="' + it.id + '" class="btn flora-edit" style="width:auto;font-size:11px">✏️</button><button data-id="' + it.id + '" class="btn flora-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
  }).join('');
  var set = {};
  data.forEach(function (x) { set[String(x.species || '').toLowerCase()] = 1; });
  if (stats) stats.textContent = data.length + ' registros · ' + Object.keys(set).length + ' especies';
  box.querySelectorAll('.flora-share').forEach(function (b) {
    b.onclick = function () {
      var it = getFloraData().entries.find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (it) share('🌸 ' + it.species + ' · ' + it.date, buildFloraShareText(it));
    };
  });
  box.querySelectorAll('.flora-edit').forEach(function (b) {
    b.onclick = function () {
      var d = getFloraData().entries.find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (!d) return;
      floraEditingId = d.id;
      $('floraDate').value = d.date; $('floraTime').value = d.time || '09:00'; $('floraPlace').value = d.place || '';
      $('floraSpecies').value = d.species || ''; $('floraKind').value = d.kind || 'observación';
      $('floraQty').value = d.qty || ''; $('floraNotes').value = d.notes || '';
      $('floraAdd').textContent = '↻ Actualizar'; $('floraCancelEdit').classList.remove('hidden');
      try { $('floraSpecies').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    };
  });
  box.querySelectorAll('.flora-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar registro de flora?')) return;
      var arr = getFloraData().entries;
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderFloraLog(); renderFloraHoy();
    };
  });
}

/* ---------- Links de interés ---------- */
function renderFloraLinks() {
  var box = $('floraLinksPanel');
  if (!box) return;
  var mine = [];
  try { mine = getFloraLinks() || []; } catch (e) {}
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🔗 Links de interés — flora cuenca estero Penco</h4>' +
    '<p class="muted" style="font-size:11px">Referencias abiertas para comparar tus observaciones. El primero es el registro publicado de la cuenca.</p>';
  html += FLORA_LINKS_BASE.map(function (l) {
    return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">📚 ' + esc(l.titulo) + '</h4>' +
      '<p class="muted" style="font-size:11px">👤 ' + esc(l.autor) + '</p>' +
      '<p style="font-size:11px">' + esc(l.nota) + '</p>' +
      '<div class="dlg-actions" style="justify-content:flex-start;margin-top:6px"><a class="btn btn-accent" style="width:auto;text-decoration:none" href="' + esc(l.url) + '" target="_blank" rel="noopener">🔗 Abrir registro (Zenodo)</a>' +
      '<button type="button" class="btn" style="width:auto" data-copy="' + esc(l.url) + '">📋 Copiar enlace</button></div>' +
      '<p class="muted" style="font-size:10px;margin-top:4px;word-break:break-all">' + esc(l.url) + '</p></div>';
  }).join('');
  html += '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" id="floraGoBosque" class="btn" style="width:auto;font-size:11px">🌳 Ir a Bosque Nativo</button>' +
    '<button type="button" id="floraGoLawen" class="btn" style="width:auto;font-size:11px">🌿 Ir a Lawen Herbario</button>' +
    '<button type="button" id="floraGoAves" class="btn" style="width:auto;font-size:11px">🦅 Ir a Aves</button></div></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>➕ Mis enlaces (privados)</h4>' +
    '<p class="muted" style="font-size:11px">Guarda guías, PDFs o fotos de referencia. Quedan solo en tu usuario.</p>' +
    '<label>Título * <input type="text" id="floraLinkTitle" placeholder="ej: Guía de helechos de Chile" maxlength="80"></label>' +
    '<label>URL * <input type="url" id="floraLinkUrl" placeholder="https://..." maxlength="300"></label>' +
    '<label>Nota <input type="text" id="floraLinkNota" placeholder="ej: Clave para distinguir Blechnum" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="floraLinkAdd" class="btn btn-accent" style="width:auto">+ Guardar enlace</button></div>';
  if (mine.length) {
    html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">' + mine.map(function (l) {
      return '<div class="si-card" style="padding:8px 10px;border-style:dashed"><h4 style="font-size:12px">🔗 ' + esc(l.titulo) + ' <span class="chip" style="font-size:9px">mío</span></h4>' +
        (l.nota ? '<p class="muted" style="font-size:11px">' + esc(l.nota) + '</p>' : '') +
        '<div class="dlg-actions" style="justify-content:flex-start;margin-top:4px"><a class="btn" style="width:auto;font-size:11px;text-decoration:none" href="' + esc(l.url) + '" target="_blank" rel="noopener">Abrir</a>' +
        '<button type="button" class="btn" style="width:auto;font-size:11px" data-copy="' + esc(l.url) + '">📋 Copiar</button>' +
        '<button type="button" class="btn" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55" data-linkdel="' + l.id + '">✕ Borrar</button></div></div>';
    }).join('') + '</div>';
  } else {
    html += '<p class="muted" style="font-size:11px;margin-top:6px">Aún no guardas enlaces propios.</p>';
  }
  html += '</div>';
  box.innerHTML = html;
  box.querySelectorAll('[data-copy]').forEach(function (b) {
    b.onclick = function () {
      var u = b.getAttribute('data-copy');
      try { navigator.clipboard.writeText(u).then(function () { alert('Enlace copiado'); }, function () { prompt('Copia el enlace:', u); }); }
      catch (e) { prompt('Copia el enlace:', u); }
    };
  });
  box.querySelectorAll('[data-linkdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar tu enlace?')) return;
      var arr = getFloraLinks();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-linkdel'); });
      if (i >= 0) arr.splice(i, 1);
      save('Enlace borrado'); renderFloraLinks();
    };
  });
  var la = $('floraLinkAdd');
  if (la) la.onclick = function () {
    var t = clean(($('floraLinkTitle') || {}).value || '', 80).trim();
    var u = clean(($('floraLinkUrl') || {}).value || '', 300).trim();
    if (!t || !u) { alert('Título y URL son obligatorios'); return; }
    if (!/^https?:\/\//i.test(u)) { alert('La URL debe partir con http:// o https://'); return; }
    getFloraLinks().push({ id: uid('fl'), titulo: t, url: u, nota: clean(($('floraLinkNota') || {}).value || '', 120) });
    save('Enlace guardado 🔗'); renderFloraLinks();
  };
  var gb = $('floraGoBosque');
  if (gb) gb.onclick = function () { try { $('floraDialog').close(); } catch (e) {} setTimeout(function () { try { $('btnBosque').click(); } catch (e2) {} }, 150); };
  var gl = $('floraGoLawen');
  if (gl) gl.onclick = function () { try { $('floraDialog').close(); } catch (e) {} setTimeout(function () { try { $('btnLawen').click(); } catch (e2) {} }, 150); };
  var ga = $('floraGoAves');
  if (ga) ga.onclick = function () { try { $('floraDialog').close(); } catch (e) {} setTimeout(function () { try { $('btnBirds').click(); } catch (e2) {} }, 150); };
}

/* ---------- diálogo + botón ---------- */
function ensureFloraDialog() {
  if ($('floraDialog')) return $('floraDialog');
  var d = document.createElement('dialog');
  d.id = 'floraDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🌸 Flora — cuenca estero Penco</h3>' +
    '<button type="button" id="floraCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Plantas de la cuenca del estero Penco (Biobío, Chile): ribera, quebradas y laderas. Registra <b>privado y local</b> por usuario. Observa sin arrancar.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabFloraHoy" class="btn btn-accent" style="width:auto">🌸 Flora hoy</button>' +
    '<button type="button" id="tabFloraBit" class="btn" style="width:auto">📓 Bitácora</button>' +
    '<button type="button" id="tabFloraLinks" class="btn" style="width:auto">🔗 Links de interés</button></div>' +
    '<div id="floraHoyPanel"><div id="floraTodayBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="fishing-grid" style="margin-top:10px"><div class="menstrual-card"><h4>🌸 Especies de la cuenca</h4><div id="floraCatalogBox" class="fishing-species"></div></div>' +
    '<div class="menstrual-card"><h4>🌙 Luna & observación</h4><p class="muted" style="font-size:11px">Llena: mejor luz y aroma para identificar flores. Menguante: semilla madura para guardar en papel. Nueva: ordena fotos y compara con la lista Zenodo.</p>' +
    '<div id="floraMoonBox" class="chip" style="display:block;white-space:normal"></div>' +
    '<div class="menstrual-card" style="margin-top:8px;background:var(--panel)"><h4 style="font-size:11px">⚠️ Buen vivir</h4><p class="muted" style="font-size:11px">• Foto antes que muestra. • No arranques raíz ni cortes matas. • Anota lugar + fecha + luna. • Lava calzado si vienes de otro estero (evita dispersar plagas).</p></div></div></div></div>' +
    '<div id="floraBitPanel" class="hidden"><div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitácora — salidas a flora</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="floraDate"></label><label>Hora <input type="time" id="floraTime" value="09:00"></label>' +
    '<label>Lugar <input type="text" id="floraPlace" placeholder="ej: Estero Penco, Quebrada Honda" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Especie <input type="text" id="floraSpecies" placeholder="ej: Totora, Nalca, Chilco" maxlength="30"></label>' +
    '<label>Tipo <select id="floraKind"><option value="observación">Observación</option><option value="floración">Floración</option><option value="fruto/semilla">Fruto / semilla</option><option value="recolección">Recolección</option><option value="plantación">Plantación</option><option value="foto">Solo foto</option></select></label>' +
    '<label>Cantidad <input type="text" id="floraQty" placeholder="ej: 1 mata, 5 fotos" maxlength="20"></label></div>' +
    '<label>Notas <input type="text" id="floraNotes" placeholder="ej: ribera norte, suelo húmedo, con picaflor" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="floraAdd" class="btn btn-accent" style="width:auto">+ Guardar registro</button>' +
    '<button type="button" id="floraCancelEdit" class="btn hidden" style="width:auto">Cancelar</button></div>' +
    '<div id="floraLogBox" class="habits-list" style="margin-top:10px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="floraStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="floraShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="floraExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="floraClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div></div>' +
    '<div id="floraLinksPanel" class="hidden" style="margin-top:10px"></div>' +
    '<div class="dlg-actions"><button type="button" id="floraClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}

function ensureFloraButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g || $('btnFlora')) return;
  var b = document.createElement('button');
  b.id = 'btnFlora';
  b.className = 'btn';
  b.setAttribute('data-sub', 'tierra');
  b.setAttribute('data-keywords', 'flora plantas flor flores herbario estero penco cuenca zenodo avilez lista registro fotografico ribera quebrada totora nalca chilco helecho nativa observacion links interes');
  b.textContent = '🌸 Flora';
  var ref = $('btnBosque');
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
    else g.appendChild(b);
  } else g.appendChild(b);
}

function ensureFloraCheckbox() {
  if (document.querySelector('[data-btn="btnFlora"]')) return;
  var ref = document.querySelector('[data-btn="btnBosque"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnFlora"> 🌸 Flora';
    ref.closest('label').parentNode.insertBefore(lab, ref.closest('label').nextSibling);
  }
}

function wireFlora() {
  ensureFloraButton();
  ensureFloraDialog();
  ensureFloraCheckbox();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnFlora') < 0) ALL_BTNS.push('btnFlora');
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnFlora') < 0) {
      var i = ORDEN_TERRITORIO.indexOf('btnBosque');
      if (i >= 0) ORDEN_TERRITORIO.splice(i + 1, 0, 'btnFlora');
      else ORDEN_TERRITORIO.push('btnFlora');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnBosque && p.btnFlora === undefined) p.btnFlora = true;
      });
    }
  } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  var btn = $('btnFlora');
  if (btn && !btn.dataset.floraW) {
    btn.dataset.floraW = '1';
    btn.onclick = function () {
      try { switchFloraTab(floraTab || 'hoy'); } catch (e) {}
      try { renderFloraHoy(); } catch (e2) {}
      try { renderFloraLog(); } catch (e3) {}
      try {
        var d = $('floraDate');
        if (d && !d.value) d.value = todayKey();
      } catch (e4) {}
      var dlg = $('floraDialog');
      if (dlg && dlg.showModal) { try { dlg.showModal(); } catch (e5) { try { dlg.show(); } catch (e6) {} } }
    };
  }
  var t1 = $('tabFloraHoy'), t2 = $('tabFloraBit'), t3 = $('tabFloraLinks');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchFloraTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchFloraTab('bit'); }; }
  if (t3 && !t3.dataset.w) { t3.dataset.w = '1'; t3.onclick = function () { switchFloraTab('links'); }; }
  var ct = $('floraCloseTop'), cb = $('floraClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { try { $('floraDialog').close(); } catch (e) {} }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { try { $('floraDialog').close(); } catch (e) {} }; }
  var add = $('floraAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('floraDate') || {}).value || '';
      var species = clean(($('floraSpecies') || {}).value || '', 30).trim();
      if (!date || !species) { alert('Fecha y especie son obligatorias'); return; }
      var rec = {
        id: floraEditingId || uid('fl'),
        date: date, time: ($('floraTime') || {}).value || '09:00',
        place: clean(($('floraPlace') || {}).value || '', 30),
        species: species, kind: ($('floraKind') || {}).value || 'observación',
        qty: clean(($('floraQty') || {}).value || '', 20),
        notes: clean(($('floraNotes') || {}).value || '', 80)
      };
      var arr = getFloraData().entries;
      if (floraEditingId) {
        var ix = arr.findIndex(function (x) { return x.id === floraEditingId; });
        if (ix >= 0) arr[ix] = rec;
        floraEditingId = null; add.textContent = '+ Guardar registro';
        $('floraCancelEdit').classList.add('hidden');
      } else arr.push(rec);
      save();
      $('floraSpecies').value = ''; $('floraQty').value = ''; $('floraNotes').value = '';
      renderFloraLog();
    };
  }
  var cancel = $('floraCancelEdit');
  if (cancel && !cancel.dataset.w) {
    cancel.dataset.w = '1';
    cancel.onclick = function () {
      floraEditingId = null; $('floraAdd').textContent = '+ Guardar registro';
      cancel.classList.add('hidden'); $('floraSpecies').value = ''; $('floraQty').value = ''; $('floraNotes').value = '';
    };
  }
  var clear = $('floraClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de flora?')) return;
      getFloraData().entries = [];
      save(); renderFloraLog();
    };
  }
  var sh = $('floraShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = [];
      try { d = getFloraData().entries || []; } catch (e) {}
      if (!d.length) { alert('Sin registros'); return; }
      share('🌸 Mi bitácora flora — estero Penco', buildFloraShareText(d));
    };
  }
  var ex = $('floraExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = [];
      try { d = getFloraData().entries || []; } catch (e) {}
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([buildFloraShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'flora-estero-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

window.FloraPenco = {
  tab: switchFloraTab, renderHoy: renderFloraHoy, renderLog: renderFloraLog,
  renderLinks: renderFloraLinks, base: FLORA_BASE, linksBase: FLORA_LINKS_BASE,
  list: getFloraData, customs: getFloraCustom, links: getFloraLinks
};

var _floraRetry = 0;
function setupFlora() {
  if (!document.querySelector('.action-group[data-group="territorio"] .group-btns') || typeof userData !== 'function') {
    _floraRetry++;
    if (_floraRetry < 80) setTimeout(setupFlora, 500);
    return;
  }
  try { wireFlora(); } catch (e) {}
  try { renderFloraHoy(); } catch (e2) {}
}
setTimeout(setupFlora, 600);

})();
