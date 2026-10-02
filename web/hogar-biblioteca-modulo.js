/* ============================================================
   MI BIBLIOTECA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección dentro de Hogar y Vida Práctica > Casa:
   - Botón btnBiblioteca (📚 Mi Biblioteca): inventario de libros
     del hogar + hábito lector + préstamos.
     Diálogo bibliotecaDialog con 4 pestañas:
     1) Resumen (totales, leyendo ahora, por género/estado,
        reto lector anual, prestados fuera)
     2) Libros (CRUD + progreso de lectura + filtros +
        terminar / prestar / archivar)
     3) Préstamos (prestar, devolver, historial, alertas >30 días)
     4) Guía (orden, cuidado, fomento lector, biblioteca Penco)
   - Todo local y privado por usuario:
     userData().biblioteca = { items: [], prestamos: [], reto: { meta, anio } }
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
function diffDays(aKey, bKey) {
  try {
    var a = new Date(aKey + 'T12:00:00').getTime(), b = new Date(bKey + 'T12:00:00').getTime();
    return Math.round((b - a) / 86400000);
  } catch (e) { return 0; }
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
function stars(n) {
  n = Math.max(0, Math.min(5, parseInt(n) || 0));
  var s = '';
  for (var i = 1; i <= 5; i++) s += (i <= n ? '★' : '☆');
  return s;
}

/* ---------------- REFERENCIAS ---------------- */
var GENEROS = ['📖 Novela / cuento', '🧒 Infantil / juvenil', '📜 Poesía', '🎭 Teatro', '📚 Historia / territorio', '🌿 Naturaleza / huerta', '🍳 Cocina', '🧠 Crecimiento / psicología', '🗣️ Mapuzugun / pueblos', '📖 Estudio / escuela', '⛪ Espiritualidad', '🔬 Ciencia', '📰 Cómic / manga', '📦 Otro'];
var FORMATOS = ['📕 Físico', '📱 Digital / PDF', '🎧 Audiolibro', '📄 Fotocopia / apuntes'];
var ESTADOS = ['📥 Por leer', '📖 Leyendo', '✅ Terminado', '⏸️ En pausa', '🤝 Prestado fuera'];
var UBIS = ['Repisa living', 'Velador / pieza', 'Repisa niños', 'Caja guardada', 'Mochila / cartera', 'Digital (este equipo)', 'Prestado fuera', 'Otro'];
var PREST_TIPOS = ['Préstamo a persona', 'Préstamo a institución (escuela, biblioteca)'];

function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { items: [], prestamos: [], reto: { meta: 12, anio: new Date().getFullYear() } };
    if (!u.biblioteca) u.biblioteca = { items: [], prestamos: [], reto: { meta: 12, anio: new Date().getFullYear() } };
    if (!Array.isArray(u.biblioteca.items)) u.biblioteca.items = [];
    if (!Array.isArray(u.biblioteca.prestamos)) u.biblioteca.prestamos = [];
    if (!u.biblioteca.reto || typeof u.biblioteca.reto.meta !== 'number') u.biblioteca.reto = { meta: 12, anio: new Date().getFullYear() };
    return u.biblioteca;
  } catch (e) { return { items: [], prestamos: [], reto: { meta: 12, anio: 12 } }; }
}
function byId(id) {
  var f = null;
  store().items.forEach(function (x) { if (x.id === id) f = x; });
  return f;
}
function progreso(x) {
  var tot = parseInt(x.paginas) || 0, act = parseInt(x.paginaActual) || 0;
  if (!tot || tot <= 0) return (x.estado === '✅ Terminado') ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round(act / tot * 100)));
}

/* ---------------- DIALOGO ---------------- */
var TABS = ['Resumen', 'Libros', 'Prestamos', 'Guia'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('bib' + t), b = $('tabBib' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
var editId = null, fGen = 'todos', fEst = 'todos', fFmt = 'todos', fQ = '', fSoloFav = false;

function buildDialog() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabBibResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabBibLibros" class="btn" style="width:auto">📚 Libros</button>' +
    '<button type="button" id="tabBibPrestamos" class="btn" style="width:auto">🤝 Préstamos</button>' +
    '<button type="button" id="tabBibGuia" class="btn" style="width:auto">📖 Guía</button></div>' +

    '<div id="bibResumen"></div>' +

    '<div id="bibLibros" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ <span id="bibFormTitle">Nuevo libro</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Título * <input type="text" id="bibTitulo" placeholder="ej: Canto general, Papelucho, Azmapu" maxlength="80"></label>' +
    '<label>Autor <input type="text" id="bibAutor" placeholder="ej: Gabriela Mistral, M. Luisa Bombal" maxlength="60"></label></div>' +
    '<div class="conv-row"><label>Género <select id="bibGenero">' + GENEROS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Formato <select id="bibFormato">' + FORMATOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Estado <select id="bibEstado">' + ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Páginas totales <input type="number" id="bibPaginas" min="0" step="1" placeholder="ej: 220"></label>' +
    '<label>Voy en la página <input type="number" id="bibPaginaActual" min="0" step="1" placeholder="ej: 45"></label>' +
    '<label>Mi nota (0-5) <select id="bibRating"><option value="0">Sin nota</option><option value="1">★ 1</option><option value="2">★★ 2</option><option value="3">★★★ 3</option><option value="4">★★★★ 4</option><option value="5">★★★★★ 5</option></select></label></div>' +
    '<div class="conv-row"><label>Guardado en <select id="bibUbi">' + UBIS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="bibFav"> ⭐ Favorito</label></div>' +
    '<label>Reseña / por qué lo quiero <input type="text" id="bibNota" placeholder="ej: me lo regaló mi mamá, para leer con los niños, prestado por la tía" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="bibAdd" class="btn btn-accent" style="width:auto">+ Guardar libro</button>' +
    '<button type="button" id="bibCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="bibQ" placeholder="título, autor, nota..."></label>' +
    '<label>Género <select id="bibFQ"><option value="todos">Todos</option>' + GENEROS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Estado <select id="bibFE"><option value="todos">Todos</option>' + ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row" style="margin-top:6px"><label>Formato <select id="bibFF"><option value="todos">Todos</option>' + FORMATOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="bibFSolo"> ⭐ Solo favoritos / leyendo</label></div>' +
    '<div id="bibList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="bibPrestamos" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🤝 Prestar un libro</h4>' +
    '<div class="conv-row"><label style="flex:2">Libro * <select id="bibPLibro"></select></label>' +
    '<label>¿A quién? * <input type="text" id="bibPQuien" placeholder="ej: vecina Marta, primo Diego, 5°B" maxlength="50"></label></div>' +
    '<div class="conv-row"><label>Fecha préstamo <input type="date" id="bibPFecha"></label>' +
    '<label>Devuelve aprox. <input type="date" id="bibPDev"></label></div>' +
    '<label>Nota <input type="text" id="bibPNota" placeholder="ej: cuídalo, tiene dedicatoria" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="bibPAdd" class="btn btn-accent" style="width:auto">🤝 Registrar préstamo</button></div></div>' +
    '<div id="bibPActivos"></div>' +
    '<div id="bibPHist" style="margin-top:10px"></div></div>' +

    '<div id="bibGuia" class="hidden">' +
    '<div class="si-card"><h4>🏡 Orden que invita a leer</h4><p><b>Por ambiente, no por tamaño:</b> niños a su altura, cocina cerca de la cocina, estudio junto al escritorio. Un <b>rincón lector</b> vale más que una repisa llena: cojín, luz cálida y los 3 libros del mes a la vista. Revisa esta lista <b>1 vez por luna</b>: archiva lo ya terminado y deja a mano lo que estás leyendo.</p></div>' +
    '<div class="si-card"><h4>💧 Cuidado en casa pencóna (humedad)</h4><p>El papel sufre con la humedad de Penco: repisa <b>lejos del suelo y del baño</b>, lomo hacia afuera, nada apretado. Ventila en días de sol. Si un libro se humedece: intercala toalla nova, peso encima y sombra ventilada (nunca estufa directa). Digital: anota aquí dónde está el archivo para no perderlo.</p></div>' +
    '<div class="si-card"><h4>🌱 Hábito lector en familia (15 minutos)</h4><p>Meta mínima: <b>15 min diarios</b> o 10 páginas. Lee en voz alta con niños aunque ya sepan leer: vocabulario y vínculo. Marca tu avance con <b>“Voy en la página”</b> y usa el <b>reto anual</b> (ej: 12 libros al año = 1 por luna). Terminado: ponle nota ★ y una frase de reseña.</p></div>' +
    '<div class="si-card"><h4>🤝 Prestar sin perder</h4><p>Anota <b>siempre</b> a quién y cuándo (pestaña Préstamos). Regla sana: 1 libro fuera por persona, plazo 30 días, aviso amable a los 30. Lo con dedicatoria o descatalogado mejor <b>no sale</b>: se lee en casa. Si vuelve dañado, se conversa: reponer o arreglar juntos.</p></div>' +
    '<div class="si-card"><h4>📚 Biblioteca de Penco y trueque</h4><p>Biblioteca Municipal de Penco (Casa de la Cultura): préstamo gratis con carnet. Feria y grupos de trueque: suelta duplicados y trae novedad sin gastar. Dona lo que ya cumplió su ciclo: otro hogar lo espera. Anota donados como <b>archivados</b> para mantener tu cuenta real.</p></div>' +
    '</div>';

  makeDialog('bibliotecaDialog', '📚 Mi Biblioteca — los libros de casa',
    'Tu catálogo familiar: qué tienes, dónde está, qué estás leyendo y a quién prestaste. <b>Privado y local</b>, 100% offline.',
    body);
}

/* ---------------- RESUMEN ---------------- */
function renderResumen() {
  var box = $('bibResumen'); if (!box) return;
  var st = store();
  var items = st.items.filter(function (x) { return !x.archivada; });
  var arch = st.items.length - items.length;
  var leyendo = items.filter(function (x) { return x.estado === '📖 Leyendo'; }).sort(function (a, b) { return progreso(b) - progreso(a); });
  var porLeer = items.filter(function (x) { return x.estado === '📥 Por leer'; }).length;
  var term = items.filter(function (x) { return x.estado === '✅ Terminado'; });
  var prest = items.filter(function (x) { return x.estado === '🤝 Prestado fuera'; });
  var porGen = {};
  items.forEach(function (x) { porGen[x.genero] = (porGen[x.genero] || 0) + 1; });
  var favs = items.filter(function (x) { return x.fav; });

  /* Reto anual: terminados este año */
  var anio = new Date().getFullYear();
  if (!st.reto || !st.reto.anio) { st.reto = { meta: 12, anio: anio }; }
  var meta = Math.max(1, parseInt(st.reto.meta) || 12);
  var leidosAnio = term.filter(function (x) {
    var f = String(x.terminadoFecha || x.creado || '');
    return f.indexOf(String(anio)) === 0 || (!x.terminadoFecha && true);
  }).length;
  /* Si no hay fecha de término, cuenta terminados totales (modo simple) */
  var conFecha = term.some(function (x) { return !!x.terminadoFecha; });
  if (!conFecha) leidosAnio = term.length;
  var pctReto = Math.max(0, Math.min(100, Math.round(leidosAnio / meta * 100)));

  var activos = st.prestamos.filter(function (p) { return !p.devuelto; });
  var atrasados = activos.filter(function (p) {
    if (!p.dev) return diffDays(p.fecha || todayKey(), todayKey()) > 45;
    return diffDays(todayKey(), p.dev) < 0 && Math.abs(diffDays(todayKey(), p.dev)) > 0 && new Date(todayKey() + 'T12:00:00') > new Date(p.dev + 'T12:00:00');
  });

  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>📚 Mi biblioteca</h4><p style="font-size:22px;color:var(--gold)"><b>' + items.length + '</b> <span style="font-size:12px">libros</span></p>' +
    '<p class="muted" style="font-size:11px">📖 ' + leyendo.length + ' leyendo · 📥 ' + porLeer + ' por leer · ✅ ' + term.length + ' terminados' + (arch ? '<br>📦 ' + arch + ' archivado(s)/donados' : '') + '</p>' +
    (Object.keys(porGen).length ? '<p class="muted" style="font-size:11px">' + Object.keys(porGen).slice(0, 5).map(function (k) { return esc(k.split(' ')[0] + ' ' + porGen[k]); }).join(' · ') + '</p>' : '') + '</div>' +
    '<div class="menstrual-card"><h4>🎯 Reto lector ' + anio + '</h4><p style="font-size:22px;color:var(--gold)"><b>' + leidosAnio + '</b><span style="font-size:12px"> / ' + meta + ' libros</span></p>' +
    '<div style="background:var(--panel);border:1px solid var(--line);border-radius:8px;height:10px;overflow:hidden;margin:6px 0"><div style="height:100%;width:' + pctReto + '%;background:var(--gold)"></div></div>' +
    '<div class="conv-row" style="margin-top:6px"><label style="flex:1">Meta anual <input type="number" id="bibMeta" min="1" max="365" value="' + meta + '" style="width:90px"></label>' +
    '<button type="button" id="bibMetaSave" class="btn" style="width:auto;align-self:flex-end">Guardar</button></div>' +
    '<p class="muted" style="font-size:11px">🤝 ' + activos.length + ' prestado(s) fuera' + (atrasados.length ? ' · <b style="color:#e76e8a">' + atrasados.length + ' atrasado(s)</b>' : '') + (favs.length ? ' · ⭐ ' + favs.length + ' favorito(s)' : '') + '</p></div></div>' +

    (leyendo.length ? '<div class="menstrual-card" style="margin-top:10px"><h4>📖 Leyendo ahora</h4>' +
      leyendo.slice(0, 4).map(function (x) {
        var p = progreso(x);
        return '<div class="hora-item" style="align-items:center"><span style="font-size:12px;flex:1">📖 <b>' + esc(x.titulo) + '</b> <span class="muted">· ' + esc(x.autor || 's/a') + ' · pág ' + esc(String(x.paginaActual || 0)) + '/' + esc(String(x.paginas || '?')) + ' (' + p + '%)</span>' +
          '<span style="display:block;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:8px;margin-top:4px;overflow:hidden"><span style="display:block;height:100%;width:' + p + '%;background:var(--gold)"></span></span></span>' +
          '<span style="display:flex;gap:6px"><button type="button" class="btn bib-adv" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">+10 pág</button>' +
          '<button type="button" class="btn bib-fin" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✅ Terminar</button></span></div>';
      }).join('') + '</div>' : '') +

    (activos.length ? '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🤝 Fuera de casa — no olvidar</h4>' +
      activos.slice(0, 5).map(function (p) {
        var b = byId(p.libroId);
        var dias = p.fecha ? diffDays(p.fecha, todayKey()) : 0;
        var alerta = dias > 30 ? ' 🔴 ' + dias + ' días' : ' · hace ' + dias + ' d';
        return '<div class="hora-item"><span style="font-size:12px">🤝 <b>' + esc(b ? b.titulo : (p.titulo || 'Libro')) + '</b> <span class="muted">→ ' + esc(p.quien || '') + alerta + '</span></span>' +
          '<button type="button" class="btn bib-dev" data-k="' + esc(p.id) + '" style="width:auto;font-size:11px">↩ Devolver</button></div>';
      }).join('') + '</div>' : '') +

    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="bibGoAdd" class="btn" style="width:auto">➕ Anotar libro</button>' +
    '<button type="button" id="bibGoPrest" class="btn" style="width:auto">🤝 Prestar</button>' +
    '<button type="button" id="bibShareBtn" class="btn" style="width:auto">📤 Compartir</button></div>';

  var ms = $('bibMetaSave');
  if (ms) ms.onclick = function () {
    var v = Math.max(1, parseInt(($('bibMeta') || {}).value) || 12);
    st.reto = { meta: v, anio: new Date().getFullYear() };
    save('Meta guardada 🎯'); renderAll();
  };
  var g = $('bibGoAdd'); if (g) g.onclick = function () { switchTab('Libros'); };
  var gp = $('bibGoPrest'); if (gp) gp.onclick = function () { switchTab('Prestamos'); };
  var sh = $('bibShareBtn'); if (sh) sh.onclick = shareResumen;
  box.querySelectorAll('.bib-adv').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.paginaActual = (parseInt(x.paginaActual) || 0) + 10;
      if (x.paginas && x.paginaActual >= parseInt(x.paginas)) { x.paginaActual = parseInt(x.paginas); x.estado = '✅ Terminado'; x.terminadoFecha = todayKey(); }
      save(); renderAll();
    };
  });
  box.querySelectorAll('.bib-fin').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.estado = '✅ Terminado'; x.terminadoFecha = todayKey();
      if (x.paginas) x.paginaActual = parseInt(x.paginas);
      save('¡Libro terminado! ✅'); renderAll();
    };
  });
  box.querySelectorAll('.bib-dev').forEach(function (b) {
    b.onclick = function () { devolverPrestamo(b.dataset.k); };
  });
}

function shareResumen() {
  var st = store();
  var items = st.items.filter(function (x) { return !x.archivada; });
  var leyendo = items.filter(function (x) { return x.estado === '📖 Leyendo'; });
  var t = '📚 Mi Biblioteca — ' + todayKey() + '\nTotal: ' + items.length + ' libros · ✅ ' +
    items.filter(function (x) { return x.estado === '✅ Terminado'; }).length + ' terminados · 📖 ' + leyendo.length + ' leyendo\n' +
    (leyendo.length ? '\nLeyendo ahora:\n' + leyendo.map(function (x) { return '• ' + x.titulo + ' — ' + (x.autor || 's/a') + ' (' + progreso(x) + '%)'; }).join('\n') + '\n' : '') +
    '\nCatálogo:\n' + items.slice().sort(function (a, b) { return String(a.titulo).localeCompare(String(b.titulo)); }).slice(0, 40).map(function (x) {
      return '• ' + x.titulo + (x.autor ? ' — ' + x.autor : '') + ' [' + (x.estado || '') + ']' + (x.fav ? ' ⭐' : '');
    }).join('\n');
  share('Mi Biblioteca', t);
}

/* ---------------- LIBROS ---------------- */
function renderList() {
  var box = $('bibList'); if (!box) return;
  var q = (fQ || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = store().items.slice().sort(function (a, b) {
    return ((a.archivada ? 1 : 0) - (b.archivada ? 1 : 0)) || String(a.titulo).localeCompare(String(b.titulo));
  });
  if (fGen !== 'todos') list = list.filter(function (x) { return x.genero === fGen; });
  if (fEst !== 'todos') list = list.filter(function (x) { return x.estado === fEst; });
  if (fFmt !== 'todos') list = list.filter(function (x) { return x.formato === fFmt; });
  if (fSoloFav) list = list.filter(function (x) { return x.fav || x.estado === '📖 Leyendo'; });
  if (q) list = list.filter(function (x) {
    var t = ((x.titulo || '') + ' ' + (x.autor || '') + ' ' + (x.nota || '') + ' ' + (x.genero || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin libros con ese filtro. Anota el primero arriba: ej “Papelucho” 🧒.</p>';
    return;
  }
  box.innerHTML = list.map(function (x) {
    var p = progreso(x);
    var prestInfo = (x.estado === '🤝 Prestado fuera' && x.prestadoA) ? ' · 🤝 ' + esc(x.prestadoA) : '';
    return '<div class="si-card"' + (x.archivada ? ' style="opacity:.6"' : '') + '><h4>📚 ' + esc(x.titulo) + (x.fav ? ' ⭐' : '') + (x.archivada ? ' <span class="chip" style="font-size:10px">archivado</span>' : '') + '</h4>' +
      '<p class="muted" style="font-size:12px">' + esc(x.autor || 'Autor desconocido') + (x.rating ? ' · <span style="color:var(--gold)">' + stars(x.rating) + '</span>' : '') + '</p>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(x.genero || '') + '</span>' +
      '<span class="chip" style="font-size:10px">' + esc(x.formato || '') + '</span>' +
      '<span class="chip" style="font-size:10px">' + esc(x.estado || '') + '</span>' +
      (x.ubi ? '<span class="chip" style="font-size:10px">📍 ' + esc(x.ubi) + '</span>' : '') +
      (x.paginas ? '<span class="chip" style="font-size:10px">📄 ' + esc(String(x.paginaActual || 0)) + '/' + esc(String(x.paginas)) + ' · ' + p + '%</span>' : '') + '</p>' +
      ((x.paginas && x.estado === '📖 Leyendo') ? '<div style="background:var(--panel);border:1px solid var(--line);border-radius:6px;height:8px;overflow:hidden;margin:6px 0"><div style="height:100%;width:' + p + '%;background:var(--gold)"></div></div>' : '') +
      (x.nota ? '<p class="muted">“' + esc(x.nota) + '”' + prestInfo + '</p>' : (prestInfo ? '<p class="muted">' + prestInfo + '</p>' : '')) +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      (x.estado !== '✅ Terminado' && !x.archivada ? '<button type="button" class="btn bib-a10" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">+10 pág</button>' : '') +
      (x.estado !== '✅ Terminado' && !x.archivada ? '<button type="button" class="btn bib-term" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✅ Terminar</button>' : '') +
      (!x.archivada ? '<button type="button" class="btn bib-pres" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">🤝 Prestar</button>' : '') +
      '<button type="button" class="btn bib-edit" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn bib-arch" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">' + (x.archivada ? '📂 Reactivar' : '📦 Archivar') + '</button>' +
      '<button type="button" class="btn bib-del" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
  }).join('');

  box.querySelectorAll('.bib-a10').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.paginaActual = (parseInt(x.paginaActual) || 0) + 10;
      if (x.estado === '📥 Por leer' || x.estado === '⏸️ En pausa') x.estado = '📖 Leyendo';
      if (x.paginas && x.paginaActual >= parseInt(x.paginas)) { x.paginaActual = parseInt(x.paginas); x.estado = '✅ Terminado'; x.terminadoFecha = todayKey(); }
      save(); renderAll();
    };
  });
  box.querySelectorAll('.bib-term').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.estado = '✅ Terminado'; x.terminadoFecha = todayKey();
      if (x.paginas) x.paginaActual = parseInt(x.paginas);
      save('¡Libro terminado! ✅'); renderAll();
    };
  });
  box.querySelectorAll('.bib-pres').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      switchTab('Prestamos');
      var sel = $('bibPLibro');
      if (sel) sel.value = x.id;
      var q2 = $('bibPQuien');
      if (q2) q2.focus();
    };
  });
  box.querySelectorAll('.bib-edit').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      editId = x.id;
      $('bibTitulo').value = x.titulo || ''; $('bibAutor').value = x.autor || '';
      $('bibGenero').value = x.genero || GENEROS[0]; $('bibFormato').value = x.formato || FORMATOS[0];
      $('bibEstado').value = x.estado || ESTADOS[0];
      $('bibPaginas').value = x.paginas || ''; $('bibPaginaActual').value = x.paginaActual || '';
      $('bibRating').value = String(x.rating || 0);
      $('bibUbi').value = x.ubi || UBIS[0]; $('bibFav').checked = !!x.fav;
      $('bibNota').value = x.nota || '';
      $('bibFormTitle').textContent = 'Editar libro';
      $('bibAdd').textContent = '↻ Actualizar libro';
      $('bibCancel').classList.remove('hidden');
      window.scrollTo(0, 0);
    };
  });
  box.querySelectorAll('.bib-arch').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.archivada = !x.archivada; save(); renderAll();
    };
  });
  box.querySelectorAll('.bib-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este libro de la biblioteca?')) return;
      var st = store();
      st.items = st.items.filter(function (x) { return x.id !== b.dataset.k; });
      save(); renderAll();
    };
  });
}

/* ---------------- PRESTAMOS ---------------- */
function renderPrestamos() {
  var sel = $('bibPLibro');
  if (sel) {
    var disp = store().items.filter(function (x) { return !x.archivada && x.estado !== '🤝 Prestado fuera'; })
      .sort(function (a, b) { return String(a.titulo).localeCompare(String(b.titulo)); });
    var cur = sel.value;
    sel.innerHTML = disp.length
      ? disp.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.titulo + (x.autor ? ' — ' + x.autor : '')) + '</option>'; }).join('')
      : '<option value="">(no hay libros disponibles — todos prestados o archivados)</option>';
    if (cur) { try { sel.value = cur; } catch (e) {} }
  }
  var boxA = $('bibPActivos'), boxH = $('bibPHist');
  if (!boxA || !boxH) return;
  var st = store();
  var act = st.prestamos.filter(function (p) { return !p.devuelto; })
    .sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); });
  var hist = st.prestamos.filter(function (p) { return p.devuelto; })
    .sort(function (a, b) { return String(b.devueltoFecha || '').localeCompare(String(a.devueltoFecha || '')); }).slice(0, 20);

  boxA.innerHTML = '<div class="menstrual-card" style="margin-top:10px"><h4>📤 Activos (' + act.length + ')</h4>' +
    (act.length ? act.map(function (p) {
      var b = byId(p.libroId);
      var dias = p.fecha ? diffDays(p.fecha, todayKey()) : 0;
      var mal = dias > 30;
      return '<div class="hora-item"><span style="font-size:12px">' + (mal ? '🔴' : '🤝') + ' <b>' + esc(b ? b.titulo : (p.titulo || 'Libro')) + '</b>' +
        '<span class="muted"> → ' + esc(p.quien || '') + ' · desde ' + esc(p.fecha || '') + (p.dev ? ' · devolver ' + esc(p.dev) : '') + ' · hace ' + dias + ' d' + (mal ? ' ⚠️ ¡recordar!' : '') + '</span></span>' +
        '<span style="display:flex;gap:6px"><button type="button" class="btn bib-dev2" data-k="' + esc(p.id) + '" style="width:auto;font-size:11px">↩ Devolvieron</button>' +
        '<button type="button" class="btn bib-msg" data-k="' + esc(p.id) + '" style="width:auto;font-size:11px">💬 Recordar</button></span></div>';
    }).join('') : '<p class="muted" style="font-size:11px">Nada fuera de casa. Todo en su repisa. 🏡</p>') + '</div>';

  boxH.innerHTML = '<div class="menstrual-card" style="margin-top:10px"><h4>📜 Historial (' + st.prestamos.filter(function (p) { return p.devuelto; }).length + ' devueltos)</h4>' +
    (hist.length ? hist.slice(0, 10).map(function (p) {
      var b = byId(p.libroId);
      return '<p class="muted" style="font-size:11px">↩ <b>' + esc(b ? b.titulo : (p.titulo || '')) + '</b> → ' + esc(p.quien || '') + ' · devuelto ' + esc(p.devueltoFecha || '') + '</p>';
    }).join('') : '<p class="muted" style="font-size:11px">Aún sin devoluciones registradas.</p>') +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span class="muted" style="font-size:11px">Tip: presta máximo 30 días.</span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="bibPShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="bibPClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar historial</button></span></div></div>';

  boxA.querySelectorAll('.bib-dev2').forEach(function (b) {
    b.onclick = function () { devolverPrestamo(b.dataset.k); };
  });
  boxA.querySelectorAll('.bib-msg').forEach(function (b) {
    b.onclick = function () {
      var p = null;
      store().prestamos.forEach(function (x) { if (x.id === b.dataset.k) p = x; });
      if (!p) return;
      var bb = byId(p.libroId);
      share('Recordatorio amable 💛',
        '¡Hola ' + (p.quien || '') + '! 💛 ¿Cómo vas con “' + (bb ? bb.titulo : (p.titulo || 'el libro')) + '”? ' +
        'Te lo presté el ' + (p.fecha || '') + '. Cuando lo termines me avisas y lo paso a buscar. ¡Gracias!');
    };
  });
  var ps = $('bibPShare');
  if (ps) ps.onclick = function () {
    var a2 = store().prestamos.filter(function (p) { return !p.devuelto; });
    share('Préstamos activos 🤝', a2.length ? a2.map(function (p) {
      var bb = byId(p.libroId);
      return '• ' + (bb ? bb.titulo : p.titulo) + ' → ' + p.quien + ' (desde ' + p.fecha + ')';
    }).join('\n') : 'Sin préstamos activos. Todo en casa 🏡');
  };
  var pc = $('bibPClear');
  if (pc) pc.onclick = function () {
    if (!confirm('¿Borrar historial de devueltos? (se mantienen los activos)')) return;
    var s2 = store();
    s2.prestamos = s2.prestamos.filter(function (p) { return !p.devuelto; });
    save(); renderAll();
  };
}

function prestar(libroId, quien, fecha, dev, nota) {
  var st = store();
  var b = byId(libroId);
  if (!b) { alert('Elige un libro disponible'); return false; }
  if (!quien) { alert('Anota a quién se lo prestas'); return false; }
  var p = { id: uid('bp'), libroId: libroId, titulo: b.titulo, quien: quien, fecha: fecha || todayKey(), dev: dev || '', nota: nota || '', devuelto: false, creado: todayKey() };
  st.prestamos.push(p);
  b.estado = '🤝 Prestado fuera';
  b.prestadoA = quien;
  b.ubi = 'Prestado fuera';
  save('Préstamo registrado 🤝');
  return true;
}

function devolverPrestamo(pid) {
  var st = store();
  var p = null;
  st.prestamos.forEach(function (x) { if (x.id === pid) p = x; });
  if (!p) return;
  p.devuelto = true; p.devueltoFecha = todayKey();
  var b = byId(p.libroId);
  if (b && b.estado === '🤝 Prestado fuera') { b.estado = '📥 Por leer'; b.prestadoA = ''; b.ubi = 'Repisa living'; }
  save('¡Devuelto! 🏡');
  renderAll();
}

function renderAll() { renderResumen(); renderList(); renderPrestamos(); }

/* ---------------- SETUP ---------------- */
function injectBtn(id, txt, kw) {
  try {
    var g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
    if (!g) return;
    if ($(id)) {
      try {
        $(id).setAttribute('data-sub', 'casa');
        var be = $(id);
        var ref0 = g.querySelector('.sub-label[data-sub="energia"]');
        if (ref0 && be && be.compareDocumentPosition(ref0) & 4) g.insertBefore(be, ref0);
      } catch (e2) {}
      return;
    }
    var btn = document.createElement('button');
    btn.id = id; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = txt;
    try { btn.setAttribute('data-sub', 'casa'); } catch (eS) {}
    btn.setAttribute('data-keywords', kw);
    var refE = g.querySelector('.sub-label[data-sub="energia"]');
    if (refE) g.insertBefore(btn, refE);
    else g.appendChild(btn);
  } catch (e) {}
}
function registerBtn(id) {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME[id] = ['hogar', 'casa']; } catch (e) {}
  try { if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|casa'] && BTN_ORDER['hogar|casa'].indexOf(id) < 0) BTN_ORDER['hogar|casa'].push(id); } catch (e) {}
  try { if (typeof PRESETS !== 'undefined') Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p][id] = true; }); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="' + id + '"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="' + id + '"> 📚 Mi Biblioteca';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis[id] !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible[id] = lab.querySelector('input').checked;
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
}

function setup() {
  injectBtn('btnBiblioteca', '📚 Mi Biblioteca', 'biblioteca libros libro leer lectura lector biblioteca repisa novela cuento poesia infantil juvenil autor prestamo prestar devolver reto leer nota reseña biblioteca hogar casa cultura');
  registerBtn('btnBiblioteca');
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}

  buildDialog();
  renderAll();

  var bb = $('btnBiblioteca');
  if (bb) bb.onclick = function () { renderAll(); switchTab('Resumen'); openDlg('bibliotecaDialog'); };

  TABS.forEach(function (t) {
    var tb = $('tabBib' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  /* Libros: guardar */
  var ad = $('bibAdd');
  if (ad) ad.onclick = function () {
    var titulo = clean((($('bibTitulo') || {}).value || '').trim(), 80);
    if (!titulo) return alert('Anota el título del libro (ej: Papelucho, Canto general)');
    var st = store();
    var datos = {
      titulo: titulo,
      autor: clean((($('bibAutor') || {}).value || '').trim(), 60),
      genero: ($('bibGenero') || {}).value || GENEROS[0],
      formato: ($('bibFormato') || {}).value || FORMATOS[0],
      estado: ($('bibEstado') || {}).value || ESTADOS[0],
      paginas: Math.max(0, parseInt(($('bibPaginas') || {}).value) || 0),
      paginaActual: Math.max(0, parseInt(($('bibPaginaActual') || {}).value) || 0),
      rating: Math.max(0, Math.min(5, parseInt(($('bibRating') || {}).value) || 0)),
      ubi: ($('bibUbi') || {}).value || UBIS[0],
      fav: !!($('bibFav') || {}).checked,
      nota: clean((($('bibNota') || {}).value || '').trim(), 140)
    };
    if (datos.paginas && datos.paginaActual > datos.paginas) datos.paginaActual = datos.paginas;
    if (editId) {
      var ex = byId(editId);
      if (ex) {
        var prevEstado = ex.estado;
        Object.keys(datos).forEach(function (k) { ex[k] = datos[k]; });
        if (ex.estado === '✅ Terminado' && prevEstado !== '✅ Terminado' && !ex.terminadoFecha) ex.terminadoFecha = todayKey();
        if (ex.estado !== '✅ Terminado') ex.terminadoFecha = '';
      }
      editId = null;
      $('bibFormTitle').textContent = 'Nuevo libro';
      ad.textContent = '+ Guardar libro';
      $('bibCancel').classList.add('hidden');
    } else {
      datos.id = uid('bi'); datos.archivada = false; datos.creado = todayKey();
      if (datos.estado === '✅ Terminado') datos.terminadoFecha = todayKey();
      st.items.push(datos);
    }
    save('Libro guardado 📚');
    $('bibTitulo').value = ''; $('bibAutor').value = ''; $('bibPaginas').value = '';
    $('bibPaginaActual').value = ''; $('bibNota').value = ''; $('bibFav').checked = false;
    renderAll();
  };
  var cc = $('bibCancel');
  if (cc) cc.onclick = function () {
    editId = null;
    $('bibFormTitle').textContent = 'Nuevo libro';
    $('bibAdd').textContent = '+ Guardar libro';
    cc.classList.add('hidden');
    $('bibTitulo').value = ''; $('bibAutor').value = ''; $('bibNota').value = '';
  };
  var qq = $('bibQ'); if (qq) qq.oninput = function () { fQ = qq.value; renderList(); };
  var fq = $('bibFQ'); if (fq) fq.onchange = function () { fGen = fq.value; renderList(); };
  var fe = $('bibFE'); if (fe) fe.onchange = function () { fEst = fe.value; renderList(); };
  var ff = $('bibFF'); if (ff) ff.onchange = function () { fFmt = ff.value; renderList(); };
  var fs = $('bibFSolo'); if (fs) fs.onchange = function () { fSoloFav = fs.checked; renderList(); };

  /* Préstamos: guardar */
  var pf = $('bibPFecha'); if (pf && !pf.value) pf.value = todayKey();
  var pa = $('bibPAdd');
  if (pa) pa.onclick = function () {
    var libroId = ($('bibPLibro') || {}).value || '';
    var quien = clean((($('bibPQuien') || {}).value || '').trim(), 50);
    var fecha = ($('bibPFecha') || {}).value || todayKey();
    var dev = ($('bibPDev') || {}).value || '';
    var nota = clean((($('bibPNota') || {}).value || '').trim(), 100);
    if (prestar(libroId, quien, fecha, dev, nota)) {
      $('bibPQuien').value = ''; $('bibPNota').value = ''; $('bibPDev').value = '';
      renderAll();
    }
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
