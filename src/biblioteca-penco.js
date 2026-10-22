/* ============================================================
   BIBLIOTECA DE PENCO — Calendario 13 Lunas
   Apartado propio: Territorio > Penco > 📚 Biblioteca
     (btnBiblioPenco -> biblioPencoDialog -> biblioPencoPanel),
     NOTA: ids con prefijo "biblioPenco" para no chocar con
     "Mi Biblioteca" del hogar (hogar-biblioteca-modulo.js),
     que ya usa biblioPencoDialog/biblioPencoPanel.
     al lado de 🎉 Penco | 📚 Educación | ⛪ Iglesias |
     🏛️ Municipalidad | 🚒 Bomberos | Guardianxs | Amenazas.
   - Ficha verificada: Biblioteca Pública Municipal N° 33
     (código 033 BC1), red SNBP + BiblioRedes (DIBAM /
     Servicio Nacional del Patrimonio Cultural):
     horario Lun-Jue 08:30-20:00 continuado, Vie 08:30-17:00
     continuado; bibliotecadepenco@hotmail.com; 41 2455506;
     acceso discapacidad, café, estacionamiento bicicletas,
     wifi. Sin horarios inventados: confirmar vigencia en
     la biblioteca o en biblioredes.gob.cl/bibliotecas/penco.
   - Subsección 📜 Historia: de la biblioteca conventual y la
     Universidad Pencopolitana (1718-1767) a la N° 33,
     BiblioRedes, rincón infantil, Kamishibai, El Rayo Que
     No Cesa y la alianza con el Museo de la Historia.
     Lo no verificado se marca como "por confirmar" y la
     comunidad puede aportar el dato (relatos).
   - Cada ficha tiene "📌 Calendario": crea un compromiso
     en el día elegido (visita, devolución, taller, cuentacuentos).
   Todo local y privado por usuario: userData().bibliotecaPenco
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
    if (!u.bibliotecaPenco) u.bibliotecaPenco = { mias: [], visitas: [] };
    var r = u.bibliotecaPenco;
    if (!Array.isArray(r.mias)) r.mias = [];
    if (!Array.isArray(r.visitas)) r.visitas = [];
    return r;
  } catch (e) { return { mias: [], visitas: [] }; }
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') { renderCurrentView(); return; } } catch (e) {}
  try { if (typeof renderLuna === 'function') renderLuna(); } catch (e2) {}
}

/* ---------- FICHA CENTRAL VERIFICADA ----------
   Fuente: biblioredes.gob.cl/bibliotecas/penco
   (033 BC1, Biblioteca Pública Penco). */
var BIBLIO_FICHA = {
  id: 'biblio-penco-central',
  icon: '📚',
  nombre: 'Biblioteca Pública Municipal de Penco N° 33',
  codigo: '033 BC1 · Red SNBP + BiblioRedes',
  sector: 'Penco Centro',
  direccion: 'Casa de la Cultura — centro de Penco (confirma sala exacta en DIDECO O’Higgins 500 o al 41 2455506)',
  horario: 'Lun a Jue 08:30–20:00 continuado · Vie 08:30–17:00 continuado',
  contacto: 'bibliotecadepenco@hotmail.com · 41 2455506 · facebook: biblioteca.penco · twitter: @penco_de',
  acceso: 'Acceso discapacidad · Café · Estacionamiento bicicletas · Wifi',
  desc: 'Biblioteca pública municipal abierta a toda la comuna: <b>préstamo gratis a domicilio</b> con carnet, sala y <b>rincón infantil</b>, visitas guiadas con escuelas y jardines, cuenta cuentos con <b>Kamishibai</b>, computadores y wifi <b>BiblioRedes</b>, exposiciones, feria de manufactura local y encuentro literario <b>El Rayo Que No Cesa</b>. Trabaja en alianza con el <b>Museo de la Historia de Penco</b> (Penco 202, frente a la Plaza) y el Centro de Historia Natural Penco-Lirquén.',
  links: [
    ['📚 Ficha BiblioRedes Penco', 'https://www.biblioredes.gob.cl/bibliotecas/penco'],
    ['🔍 Catálogo en línea (SNBP)', 'https://www.biblioredes.gob.cl/bibliotecas/penco'],
    ['📖 Biblioteca Pública Digital', 'http://www.bpdigital.cl/'],
    ['🏛️ Blog patrimonial de Penco', 'http://penco-chile.blogspot.cl/'],
    ['🦕 Museo de la Historia de Penco', 'https://www.zem.cl/704/w3-article-117631.html']
  ]
};

var REQUISITOS = [
  { t: '🧑 Adultos', d: 'Carnet de identidad + verificar domicilio con boleta de luz o agua, o certificado de residencia.' },
  { t: '🧒 Estudiantes', d: 'Carnet de identidad + domicilio de los padres (boleta o certificado de residencia) o certificado de alumno regular.' },
  { t: '📖 Préstamo', d: 'Gratis a domicilio. Pregunta en mesón cuántos libros y por cuántos días (suele ser 2–3 semanas, renovable). Devuelve a tiempo: otros vecinos esperan.' }
];

var SERVICIOS = [
  { icon: '📖', n: 'Préstamo a domicilio', d: 'Lleva libros a casa gratis con tu credencial de socio. Ideal para novelas, poesía, infantil y patrimonio penqueño.' },
  { icon: '🧒', n: 'Rincón infantil + visitas guiadas', d: 'Colección infantil y rincón de lectura en alianza con escuelas y jardines. Visitas guiadas: curso completo bienvenido (coordina por correo o teléfono).' },
  { icon: '🎭', n: 'Cuenta cuentos Kamishibai', d: 'Teatro de papel japonés: la biblioteca sale a plazas y escuelas con cuentos y exposiciones fuera de sus muros.' },
  { icon: '🌐', n: 'BiblioRedes: computadores + wifi + cursos', d: 'Acceso gratis a internet, impresión básica y cursos (Aula Virtual, Jóvenes Programadores). Pregunta por capacitaciones del mes.' },
  { icon: '📰', n: 'Exposiciones y patrimonio', d: 'Exposición de Antropología, Fósiles y Minerales (2017) junto al Museo y al Centro de Historia Natural; feria artesanal y de manufactura local en el segundo piso.' },
  { icon: '🎙️', n: 'El Rayo Que No Cesa + poesía', d: 'Encuentro literario internacional con poetas (Waldo Leyva, Aldo González…) y recitales de colegios (ej. Los Conquistadores con la profesora Rosa).' },
  { icon: '☕', n: 'Sala de lectura con café', d: 'Lee y estudia en sala: café, wifi, estacionamiento de bicicletas y acceso para discapacidad.' },
  { icon: '💾', n: 'Catálogo en línea + BPDigital', d: 'Busca el libro antes de ir (catálogo SNBP) y pide prestado digital gratis en bpdigital.cl con tu RUT.' }
];

var COLECCIONES = [
  '🧒 Infantil y juvenil (rincón infantil, Juego de Tronos y novedades para jóvenes)',
  '📜 Poesía y literatura chilena (encuentro El Rayo Que No Cesa, autores locales como Reveko de la Jara)',
  '🏭 Patrimonio Penco (CRAV, Loza, carbón, 27F, caletas — vía Museo y blog patrimonial)',
  '🗣️ Mapuzugun y pueblos (complementa con 🗣️ Kimün Mapuzugun y 📖 Epew del calendario)',
  '🌿 Naturaleza y mar (fósiles de Quiriquina, humedal Rocuant, bosque nativo)',
  '📖 Referencia y estudio (apoyo a tareas, PAES, preuniversitario municipal)'
];

/* ---------- HISTORIA (verificada + honesta) ----------
   Lo exacto con fuente; lo no confirmado se marca "por confirmar"
   para que la comunidad aporte el dato (placa, decreto, memoria). */
var HISTORIA_BIBLIO = [
  { t: '📿 Biblioteca conventual y universitaria', f: '1550–1767 · Concepción en Penco',
    d: 'Con la fundación de <b>La Concepción (1550)</b> llegan franciscanos y luego jesuitas: convento con <b>biblioteca</b> (Cook 2008), casa de estudios y entierro de gobernadores y obispos (iglesia San Francisco, excavada por la UdeC en 2018). El obispo <b>Nicolalde funda la Universidad Pencopolitana (1718)</b>, entregada a los <b>jesuitas (1724)</b>: 43 años de filosofía y teología con biblioteca propia, hasta el terremoto de <b>1751</b> y la expulsión (<b>1767</b>). Es la raíz letrada de Penco.' },
  { t: '📰 Prensa, escuelas y lectura republicana', f: '1843–1900 · Villa y ferrocarril',
    d: 'Con la <b>Villa (1843)</b> y la <b>Ley de Instrucción Primaria (1860)</b> llegan escuelas fiscales y lectura pública incipiente. El <b>ferrocarril a Penco (1889)</b> y a <b>Lirquén (1914)</b> trae diarios, folletos y bibliotecas de sindicato y club: leer se vuelve oficio obrero.' },
  { t: '🏭 Lectura obrera: CRAV, Loza y sindicato', f: '1886–1950 · Refinería, Fanaloza, COSAF',
    d: 'La <b>Refinería de Azúcar (1886, luego CRAV)</b>, la <b>Fábrica de Loza (1898)</b> y la <b>Granja Cosmito</b> sostienen barrios lectores: centros, ateneos y hasta el <b>Observatorio “Elke”</b> de CRAV. Los temporales de <b>1945</b> y el terremoto de <b>1939</b> golpean, pero la lectura barrial persiste.' },
  { t: '🏛️ Biblioteca Pública N° 33', f: 'Siglo XX · red DIBAM → SNBP (fecha exacta por confirmar)',
    d: 'Penco recibe su <b>Biblioteca Pública N° 33</b> dentro de la red nacional <b>DIBAM / Sistema Nacional de Bibliotecas Públicas</b>. Su sede histórica es la <b>Casa de la Cultura del centro</b>. La fecha y decreto exactos de creación están <b>por confirmar en DIDECO/Municipalidad</b> (O’Higgins 500): si tienes la placa, el decreto o la memoria del traslado, súmalo en ➕ Agregar → relato.' },
  { t: '🌐 BiblioRedes: internet para todos', f: '2002–hoy · programa nacional',
    d: 'La N° 33 se integra a <b>BiblioRedes (código 033 BC1)</b>: computadores, <b>wifi gratis</b>, catálogo en línea, Aula Virtual y Jóvenes Programadores. La biblioteca deja de ser solo estantería y se vuelve <b>telecentro y sala de estudio</b> del centro.' },
  { t: '🧒 Rincón infantil y visitas guiadas', f: '2014 · fomento lector infantil-juvenil',
    d: 'La biblioteca declara su apuesta (BiblioRedes, abr 2014): acercar la lectura <b>desde la infancia</b>. Colección infantil, <b>rincón infantil</b> y visitas guiadas con <b>escuelas y jardines</b>; a jóvenes los atrae con colecciones como <b>Juego de Tronos</b>. Nace el Penco lector de hoy.' },
  { t: '🎭 Kamishibai: cuentos fuera de muros', f: '2014–hoy · cuenta cuentos',
    d: 'La colección sale a la calle: exposiciones fuera de la biblioteca y <b>cuenta cuentos con Kamishibai</b> (teatro de papel japonés). El Día del Libro (abr 2014) lo celebra en la comuna con lecturas, exposición y regalos: la biblioteca en la plaza, no solo en la sala.' },
  { t: '🎙️ El Rayo Que No Cesa + poesía pencona', f: '2017 · encuentro internacional',
    d: 'La biblioteca recibe el encuentro <b>El Rayo Que No Cesa</b> (dic 2017) con poetas como <b>Waldo Leyva (Cuba)</b> y <b>Aldo González (Lolol)</b>, y el recital de los 5° del <b>Colegio Los Conquistadores</b> (profesora Rosa). El poeta local <b>Reveko de la Jara</b> lanza aquí la 2ª edición de <b>Eslabón Perdido</b> (nov 2017).' },
  { t: '🦕 Museo + ciencia + manufactura local', f: '2017 · alianza territorial',
    d: 'Junto al <b>Museo de la Historia de Penco</b> y el <b>Centro de Historia Natural Penco-Lirquén</b> monta la <b>Exposición de Antropología, Fósiles y Minerales</b> (nov 2017). En paralelo, la <b>Feria de Manufactura Local</b> (4–22 dic) ocupa el segundo piso: libros + oficio + barrio.' },
  { t: '🌱 Biblioteca hoy: sala viva del centro', f: '2026 · Lun-Jue 8:30-20:00 · Vie 8:30-17:00',
    d: 'Hoy: <b>préstamo gratis</b>, sala con café y wifi, rincón infantil, BiblioRedes y agenda con el Museo (Penco 202) y la Casa de la Cultura. Desafío vigente: <b>llevar la biblioteca a Lirquén, Cerro Verde y el campo</b> (puntos de préstamo, maletas viajeras). Esta historia sigue escribiéndose cada Día del Libro (23 abr).' }
];
var FUENTES_BIBLIO = 'Fuentes: biblioredes.gob.cl/bibliotecas/penco (033 BC1: horario, contacto, requisitos, servicios, noticias 2014-2017) · bpdigital.cl · zem.cl Museo de la Historia de Penco (Penco 202) · Schaaf et al. 2021 / UdeC 2018 (San Francisco colonial, biblioteca conventual, Cook 2008) · historiadepenco.cl · BNDigital (Carmen Donoso, Biblioteca N° 33, 1993). Horario y sede: confirmar vigencia en la biblioteca o DIDECO antes de ir.';

/* ---------- PUNTOS COMUNITARIOS (base + vecinos) ---------- */
var BIBLIO_BASE = [
  { id: 'bib-museo', cat: 'aliado', icon: '🏛️', nombre: 'Museo de la Historia de Penco (aliado lector)',
    sector: 'Penco Centro', direccion: 'Calle Penco 202, frente a la Plaza',
    contacto: 'museohistoria@penco.cl · 41 2921137 · Enc. Romina Torres',
    horario: 'Visitas: coordinar por correo (Noche de Museos hasta 23:30)',
    desc: 'Casa museo con dioramas y colecciones: <b>paleontología (Quiriquina), ocupaciones prehispánicas, Penco español, industria, cultura y educación</b>. Co-organiza exposiciones con la Biblioteca. Ideal para ir antes o después del préstamo: primero el libro, luego el fósil.' },
  { id: 'bib-casacultura', cat: 'sede', icon: '🎨', nombre: 'Casa de la Cultura (sede y ferias)',
    sector: 'Penco Centro', direccion: 'Centro de Penco — segundo piso (ferias; confirmar sala en DIDECO)',
    contacto: 'DIDECO O’Higgins 500 · 41 2261471',
    horario: 'Ferias y agenda cultural: ver penco.cl y facebook biblioteca.penco',
    desc: 'Espacio que acoge la <b>Feria de Manufactura Local y Artesanal</b> de la Biblioteca (diciembre) y la agenda cultural comunal. Si buscas taller, exposición o stand, pregunta aquí.' },
  { id: 'bib-bpdlirquen', cat: 'idea', icon: '💡', nombre: 'Punto de préstamo Lirquén (idea por concretar)',
    sector: 'Lirquén', direccion: 'Por definir con JJ.VV. / caletas (El Refugio, La Cata)',
    contacto: 'Propuesta vecinal: coordina con la Biblioteca central',
    horario: 'Idea: maleta viajera 1 tarde/semana',
    desc: 'Lirquén (12.000–14.000 hab.) merece préstamo sin viajar al centro. Propuesta: <b>maleta viajera</b> con 30 libros + Kamishibai en sede vecinal. Si te sumas, créalo en ➕ Agregar.' }
];

var CATS = { sede: '🏛️ Sede y central', aliado: '🤝 Aliados lectores', idea: '💡 Puntos por crear', vecinal: '🏘️ Punto vecinal' };
var tabActual = 'info';
var filtroQuery = '';
var editId = null;

function todas() {
  var r = store();
  var base = BIBLIO_BASE.map(function (t) { t.oficial = true; return t; });
  var mias = r.mias.map(function (t) { t.oficial = false; return t; });
  return base.concat(mias).concat([Object.assign({}, BIBLIO_FICHA, { id: 'biblio-central', cat: 'sede', oficial: true })]);
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
  var texto = clean('[Biblioteca] ' + t.nombre + (t.direccion ? ' · ' + t.direccion : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + '[Biblioteca Penco] ' + texto + ' ' + hhmm : '[Biblioteca Penco] ' + texto + ' ' + hhmm;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) {
      try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {}
    }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  try {
    var st = store();
    st.visitas.push({ id: uid('bv'), bibId: t.id, nombre: (t.icon || '📚') + ' ' + t.nombre, lugar: t.direccion || '', fecha: fecha, hora: hhmm, notify: !!conAviso, creado: todayKey() });
  } catch (e) {}
  save('📌 Agregado al calendario ✓');
  refrescarCal();
  try { render(); } catch (e2) {}
}

/* ---------- UI ---------- */
function asegurarPanel() {
  var panel = $('biblioPencoPanel');
  if (!panel) return null;
  if (!panel.dataset.bibOk) {
    panel.dataset.bibOk = '1';
    panel.innerHTML =
      '<p class="muted su-b6db47">La biblioteca pública de la comuna: <b>N° 33 · 033 BC1</b>, préstamo gratis, rincón infantil, BiblioRedes y agenda cultural. Revisa <b>📜 Historia</b> y <b>🧰 Cómo usarla</b>. Queda <b>privado y local</b>.</p>' +
      '<div class="timer-tabs su-525c61">' +
      '<button type="button" id="tabBibInfo" class="btn btn-accent su-30e741">📚 Biblioteca</button>' +
      '<button type="button" id="tabBibServ" class="btn su-30e741">🧰 Servicios</button>' +
      '<button type="button" id="tabBibHis" class="btn su-30e741">📜 Historia</button>' +
      '<button type="button" id="tabBibUtil" class="btn su-30e741">🧭 Cómo usarla</button>' +
      '<button type="button" id="tabBibVis" class="btn su-30e741">📌 Mis visitas</button>' +
      '<button type="button" id="tabBibAgr" class="btn su-30e741">➕ Agregar</button>' +
      '</div>' +
      '<div class="menstrual-card su-d2c171"><h4>🔍 Buscar</h4>' +
      '<label>Buscar <input type="text" id="biblioSearch" placeholder="ej: préstamo, Kamishibai, Lirquén, horario, socio..." maxlength="60" autocomplete="off"></label></div>' +
      '<div id="biblioList" class="su-d2c171"></div>' +
      '<div id="biblioHisBox" class="su-d2c171"></div>' +
      '<div id="biblioUtilBox" class="su-d2c171"></div>' +
      '<div id="biblioFormBox" class="menstrual-card hidden su-51d56a"></div>' +
      '<div id="biblioVisBox" class="hidden su-d2c171"></div>';
    var bI = $('tabBibInfo'), bS = $('tabBibServ'), bH = $('tabBibHis'), bU = $('tabBibUtil'), bV = $('tabBibVis'), bA = $('tabBibAgr');
    if (bI) bI.onclick = function () { tabActual = 'info'; render(); };
    if (bS) bS.onclick = function () { tabActual = 'servicios'; render(); };
    if (bH) bH.onclick = function () { tabActual = 'historia'; render(); };
    if (bU) bU.onclick = function () { tabActual = 'util'; render(); };
    if (bV) bV.onclick = function () { tabActual = 'visitas'; render(); };
    if (bA) bA.onclick = function () { tabActual = 'agregar'; render(); };
    var q = $('biblioSearch');
    if (q) q.addEventListener('input', function () { filtroQuery = q.value; renderLista(); renderHistoria(); });
  }
  return panel;
}

function linksHTML(t) {
  if (!t.links || !t.links.length) return '';
  return '<div class="su-c158a9">' + t.links.map(function (l) {
    var label = l[0], url = l[1];
    return '<a class="btn su-337714" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + ' ↗</a>';
  }).join('') + '</div>';
}
function cardHTML(t) {
  var nvis = store().visitas.filter(function (x) { return x.bibId === t.id; }).length;
  var cat = CATS[t.cat] || t.cat || '';
  var html = '<div class="si-card su-df4827">' +
    '<h4 class="su-5e0faa">' + esc(t.icon || '📚') + ' ' + esc(t.nombre) + '</h4>' +
    '<p class="muted su-0d5be0">' + esc(cat || t.codigo || '') + (t.sector ? ' · ' + esc(t.sector) : '') + (t.oficial ? ' · base verificada' : ' · mía') + (nvis ? ' · 📌 ' + nvis + ' en calendario' : '') + '</p>' +
    (t.codigo && t.id === 'biblio-central' ? '<p class="muted su-0d5be0">' + esc(t.codigo) + '</p>' : '') +
    '<p class="su-37e316">' + (t.desc || '') + '</p>' +
    '<p class="muted su-b439ab">📍 ' + esc(t.direccion || 'Por confirmar') + '<br>🕐 ' + esc(t.horario || 'Confirmar vigencia') + '<br>👤 ' + esc(t.contacto || '') + (t.acceso ? '<br>♿ ' + esc(t.acceso) : '') + '</p>' +
    linksHTML(t) +
    '<div class="conv-row su-7fed8e">' +
    '<label>Fecha <input type="date" data-bib-fecha="' + t.id + '" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" data-bib-hora="' + t.id + '" value="10:00" class="su-91245b"></label>' +
    '<label class="check-row su-988f60" title="Avisar a esa hora"><input type="checkbox" data-bib-aviso="' + t.id + '"> 🔔</label>' +
    '<button type="button" class="btn btn-accent su-30e741" data-bib-add="' + t.id + '">📌 Calendario</button>' +
    '</div>';
  if (!t.oficial) {
    html += '<div class="su-c158a9">' +
      '<button type="button" class="btn su-337714" data-bib-edit="' + t.id + '">✏️ Editar</button>' +
      '<button type="button" class="btn su-337714" data-bib-share="' + t.id + '">📤 Compartir</button>' +
      '<button type="button" class="btn su-fd834a" data-bib-del="' + t.id + '">✕ Borrar</button></div>';
  }
  html += '</div>';
  return html;
}
function bindCards(scope) {
  if (!scope) return;
  scope.querySelectorAll('[data-bib-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-bib-add');
      var t = porId(id); if (!t) return;
      var f = (scope.querySelector('[data-bib-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (scope.querySelector('[data-bib-hora="' + id + '"]') || {}).value || '10:00';
      var av = !!(scope.querySelector('[data-bib-aviso="' + id + '"]') || {}).checked;
      agregarAlCalendario(t, f, h, av);
    };
  });
  scope.querySelectorAll('[data-bib-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta ficha? (Tus visitas del calendario se conservan como compromisos del día)')) return;
      var st = store();
      st.mias = st.mias.filter(function (x) { return x.id !== b.getAttribute('data-bib-del'); });
      save('Borrada'); render();
    };
  });
  scope.querySelectorAll('[data-bib-share]').forEach(function (b) {
    b.onclick = function () {
      var t = porId(b.getAttribute('data-bib-share')); if (!t) return;
      var txt = (t.icon || '📚') + ' ' + t.nombre + '\n📍 ' + (t.direccion || '') + '\n🕐 ' + (t.horario || '') + '\n👤 ' + (t.contacto || '') + '\n' + (t.desc || '').replace(/<[^>]+>/g, '');
      try {
        if (navigator.share) { navigator.share({ title: t.nombre + ' — Penco', text: txt }).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(t.nombre + ' — Penco\n' + txt).then(function () { save('Compartido ✓'); });
      } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-bib-edit]').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      var t = st.mias.filter(function (x) { return x.id === b.getAttribute('data-bib-edit'); })[0];
      if (!t) return;
      editId = t.id; tabActual = 'agregar'; render();
    };
  });
}
function renderForm() {
  var box = $('biblioFormBox'); if (!box) return;
  var st = store();
  var ed = editId ? st.mias.filter(function (x) { return x.id === editId; })[0] : null;
  function v(k, d) { return esc(ed ? (ed[k] || '') : (d || '')); }
  box.classList.toggle('hidden', tabActual !== 'agregar');
  if (tabActual !== 'agregar') return;
  box.innerHTML = '<h4>' + (ed ? '✏️ Editar punto lector' : '➕ Agregar punto lector o relato de biblioteca') + '</h4>' +
    '<p class="muted su-11a508">Solo con <b>dirección verificada</b> (afiche, puerta, sede vecinal). Queda en tu dispositivo. Úsalo para maletas viajeras, clubes de lectura o el dato exacto de fundación de la N° 33.</p>' +
    '<div class="conv-row"><label class="su-4b3de7">Categoría * <select id="biblioFCat"><option value="vecinal">🏘️ Punto vecinal</option><option value="aliado">🤝 Aliado lector</option><option value="idea">💡 Punto por crear</option><option value="sede">🏛️ Sede</option></select></label>' +
    '<label>Sector <select id="biblioFSec"><option>Penco Centro</option><option>Lirquén</option><option>Cerro Verde</option><option>Cosmito / Ruta 150</option><option>Zona Rural Este</option><option>Toda la comuna</option></select></label>' +
    '<label>Icono <input type="text" id="biblioFIcon" maxlength="4" class="su-745e46" value="' + v('icon', '📚') + '"></label></div>' +
    '<label>Nombre * <input type="text" id="biblioFNom" placeholder="ej: Maleta viajera Villa Italia, Club lectura Cerro Verde" maxlength="60" value="' + v('nombre', '') + '"></label>' +
    '<label>Dirección * <input type="text" id="biblioFDir" placeholder="ej: Sede JJ.VV. Villa Italia, calle 123" maxlength="60" value="' + v('direccion', '') + '"></label>' +
    '<label>Contacto / horario <input type="text" id="biblioFCon" placeholder="ej: encargada, fono, días de préstamo" maxlength="80" value="' + v('contacto', '') + '"></label>' +
    '<label>Historia / descripción <input type="text" id="biblioFDesc" placeholder="ej: 30 libros + Kamishibai, jueves 17h" maxlength="140" value="' + v('desc', '') + '"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="biblioFSave" class="btn btn-accent su-30e741">' + (ed ? '↻ Actualizar' : '+ Guardar') + '</button>' +
    (ed ? '<button type="button" id="biblioFCancel" class="btn su-30e741">Cancelar</button>' : '') + '</div>';
  if (ed) { try { $('biblioFCat').value = ed.cat || 'vecinal'; $('biblioFSec').value = ed.sector || 'Penco Centro'; } catch (e) {} }
  $('biblioFSave').onclick = function () {
    var nombre = clean(($('biblioFNom') || {}).value, 60).trim();
    var dir = clean(($('biblioFDir') || {}).value, 60).trim();
    if (!nombre) { alert('Ponle nombre al punto lector'); return; }
    if (!dir) { alert('Pon la dirección (verificada)'); return; }
    var rec = {
      cat: $('biblioFCat').value, sector: $('biblioFSec').value,
      icon: clean(($('biblioFIcon') || {}).value, 4) || '📚',
      nombre: nombre, direccion: dir,
      contacto: clean(($('biblioFCon') || {}).value, 80),
      horario: clean(($('biblioFCon') || {}).value, 80),
      desc: clean(($('biblioFDesc') || {}).value, 140), links: []
    };
    if (editId && ed) { Object.keys(rec).forEach(function (k) { ed[k] = rec[k]; }); editId = null; save('Actualizada ✓'); }
    else { rec.id = uid('bib'); rec.horario = rec.horario || 'Coordinar con encargada'; st.mias.push(rec); save('Punto lector guardado 📚'); }
    tabActual = 'info';
    render();
  };
  var c = $('biblioFCancel');
  if (c) c.onclick = function () { editId = null; render(); };
}
function renderVisitas() {
  var box = $('biblioVisBox'); if (!box) return;
  box.classList.toggle('hidden', tabActual !== 'visitas');
  if (tabActual !== 'visitas') return;
  var st = store();
  if (!st.visitas.length) {
    box.innerHTML = '<div class="menstrual-card"><h4>📌 Mis visitas</h4><p class="muted su-11a508">Aún no llevas nada al calendario. En 📚 Biblioteca elige fecha/hora (visita, devolución, taller, cuentacuentos) y pulsa <b>📌 Calendario</b>.</p></div>';
    return;
  }
  var arr = st.visitas.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora).localeCompare(String(b.hora)); });
  box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>📌 Mis visitas · ' + arr.length + '</h4>' +
    arr.map(function (r) {
      return '<div class="habit-item su-13313b"><span><b>' + esc(r.nombre) + '</b><br><span class="muted su-11a508">📅 ' + esc(r.fecha) + ' · 🕐 ' + esc(r.hora) + (r.notify ? ' · 🔔' : '') + (r.lugar ? ' · 📍 ' + esc(r.lugar) : '') + '</span></span>' +
        '<button type="button" class="btn su-fd834a" data-bibvdel="' + r.id + '">✕</button></div>';
    }).join('') +
    '<div class="dlg-actions su-efea1d"><button type="button" id="biblioVisShare" class="btn su-30e741">📤 Compartir mi lista</button>' +
    '<button type="button" id="biblioVisClear" class="btn su-214f75">🗑 Borrar lista</button></div></div>';
  box.querySelectorAll('[data-bibvdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Quitar de Mis visitas? (El compromiso del día se conserva)')) return;
      store().visitas = store().visitas.filter(function (x) { return x.id !== b.getAttribute('data-bibvdel'); });
      save('Quitada'); render();
    };
  });
  var sh = $('biblioVisShare');
  if (sh) sh.onclick = function () {
    var txt = store().visitas.map(function (r) { return '• ' + r.fecha + ' ' + r.hora + ' — ' + r.nombre + (r.lugar ? ' (' + r.lugar + ')' : ''); }).join('\n');
    try {
      if (navigator.share) { navigator.share({ title: 'Mi Biblioteca en Penco', text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText('📚 Mi Biblioteca en Penco\n' + txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
  var cl = $('biblioVisClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar toda tu lista de visitas? (Los compromisos del calendario se conservan)')) return;
    store().visitas = [];
    save('Lista borrada'); render();
  };
}
function renderUtil() {
  var box = $('biblioUtilBox'); if (!box) return;
  if (tabActual !== 'util') { box.innerHTML = ''; return; }
  var q = (filtroQuery || '').toLowerCase().trim();
  function hit(t) { return !q || (t.t + ' ' + t.d).toLowerCase().indexOf(q) >= 0; }
  var reqs = REQUISITOS.filter(hit);
  box.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🧭 Cómo usarla: hazte socio en 10 minutos</h4>' +
    '<p class="muted su-11a508"><b>Biblioteca N° 33:</b> bibliotecadepenco@hotmail.com · <b>41 2455506</b> · Lun–Jue 08:30–20:00 · Vie 08:30–17:00. Lleva carnet + comprobante de domicilio. Todo gratis.</p>' +
    '<div class="su-c158a9">' +
    '<a class="btn su-337714" href="https://www.biblioredes.gob.cl/bibliotecas/penco" target="_blank" rel="noopener">📚 Ficha BiblioRedes ↗</a>' +
    '<a class="btn su-337714" href="http://www.bpdigital.cl/" target="_blank" rel="noopener">📖 Préstamo digital (BPDigital) ↗</a>' +
    '</div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🎫 Requisitos de socio y préstamo · ' + reqs.length + '</h4>' +
    reqs.map(function (r) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(r.t) + '</h4><p class="su-afb724">' + esc(r.d) + '</p></div>';
    }).join('') + '</div>' +
    '<div class="menstrual-card su-d2c171"><h4>🗂️ Colecciones para pedir en mesón</h4>' +
    COLECCIONES.map(function (c) { return '<p class="su-9a1ec9">📌 ' + esc(c) + '</p>'; }).join('') +
    '<p class="muted su-11a508">Tip: si el libro no está, pide <b>préstamo interbibliotecario</b> (red SNBP) o su versión digital en BPDigital con tu RUT.</p></div>' +
    '<p class="muted su-a953a7">' + esc(FUENTES_BIBLIO) + '</p>';
}
function renderHistoria() {
  var box = $('biblioHisBox'); if (!box) return;
  if (tabActual !== 'historia') { box.innerHTML = ''; return; }
  var q = (filtroQuery || '').toLowerCase().trim();
  var eras = HISTORIA_BIBLIO.filter(function (e) {
    if (!q) return true;
    return ((e.t || '') + ' ' + (e.f || '') + ' ' + (e.d || '')).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<div class="menstrual-card su-68a1a9"><h4>📜 Historia de la biblioteca en Penco · ' + eras.length + ' hitos</h4>' +
    '<p class="muted su-b6db47">De la biblioteca conventual y 43 años de universidad pontificia a la N° 33, BiblioRedes y El Rayo Que No Cesa. Usa el buscador 🔍 para filtrar (ej: 1751, Kamishibai, fósiles). Lo marcado “por confirmar” espera tu dato.</p>' +
    eras.map(function (e) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(e.t) + '</h4>' +
        '<p class="muted su-2c4c6c">' + esc(e.f) + '</p>' +
        '<p class="su-afb724">' + e.d + '</p></div>';
    }).join('') + '</div>';
  html += '<p class="muted su-a953a7">' + esc(FUENTES_BIBLIO) + '</p>';
  box.innerHTML = html;
}
function renderLista() {
  var box = $('biblioList'); if (!box) return;
  if (tabActual === 'visitas' || tabActual === 'agregar' || tabActual === 'historia' || tabActual === 'util') { box.innerHTML = ''; return; }
  var q = (filtroQuery || '').toLowerCase().trim();
  var list = todas();
  if (tabActual === 'servicios') {
    var serv = SERVICIOS.filter(function (s) {
      if (!q) return true;
      return ((s.n || '') + ' ' + (s.d || '')).toLowerCase().indexOf(q) >= 0;
    });
    box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>🧰 Servicios de la N° 33 · ' + serv.length + '</h4>' +
      '<p class="muted su-11a508">Todo gratis con tu credencial. En 📚 Biblioteca lleva la visita al calendario con 📌.</p>' +
      serv.map(function (s) {
        return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(s.icon) + ' ' + esc(s.n) + '</h4><p class="su-afb724">' + esc(s.d) + '</p></div>';
      }).join('') + '</div>' +
      '<p class="muted su-a953a7">' + esc(FUENTES_BIBLIO) + '</p>';
    return;
  }
  if (q) list = list.filter(function (t) {
    return ((t.nombre || '') + ' ' + (t.desc || '').replace(/<[^>]+>/g, '') + ' ' + (t.direccion || '') + ' ' + (t.sector || '') + ' ' + (t.contacto || '') + ' ' + (t.horario || '')).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<div class="menstrual-card"><h4>📚 Biblioteca y puntos lectores · ' + list.length + '</h4>' +
    '<p class="muted su-0d5be0">Central N° 33 + aliados (Museo, Casa de la Cultura) + puntos por crear + tus fichas. En cada ficha elige fecha/hora y pulsa <b>📌 Calendario</b>.</p>' +
    (list.length ? list.map(cardHTML).join('') : '<p class="muted">Sin resultados. Si es tu punto lector de barrio, súmalo en <b>➕ Agregar</b> con dirección verificada.</p>') + '</div>';
  html += '<p class="muted su-a953a7">' + esc(FUENTES_BIBLIO) + '</p>';
  box.innerHTML = html;
  bindCards(box);
}
function render() {
  var panel = asegurarPanel();
  if (!panel) return;
  var tabs = { info: $('tabBibInfo'), servicios: $('tabBibServ'), historia: $('tabBibHis'), util: $('tabBibUtil'), visitas: $('tabBibVis'), agregar: $('tabBibAgr') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', tabActual === k); });
  var q2 = $('biblioSearch');
  if (q2 && q2.value !== filtroQuery && document.activeElement !== q2) q2.value = filtroQuery;
  renderLista();
  renderHistoria();
  renderUtil();
  renderForm();
  renderVisitas();
}

function openBiblio() {
  try { render(); } catch (e) {}
  try {
    var dlg = $('biblioPencoDialog');
    if (dlg && typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
    else if (dlg && !dlg.open) dlg.setAttribute('open', '');
  } catch (e2) {}
}

function ensureCheckbox() {
  try {
    if (document.querySelector('[data-btn="btnBiblioPenco"]')) return;
    var ref = document.querySelector('[data-btn="btnEducacion"]');
    if (ref && ref.closest) {
      var lab = document.createElement('label');
      lab.className = 'check-row';
      lab.innerHTML = '<input type="checkbox" data-btn="btnBiblioPenco" checked> 📚 Biblioteca';
      ref.closest('label').parentNode.insertBefore(lab, ref.closest('label').nextSibling);
      if (typeof applyVisibility === 'function') {
        var inp = lab.querySelector('input');
        if (inp) inp.addEventListener('change', function () { try { applyVisibility(); } catch (e) {} });
      }
    }
  } catch (e) {}
}
function register() {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnBiblioPenco') < 0) ALL_BTNS.push('btnBiblioPenco'); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnBiblioPenco = ['territorio', 'penco']; } catch (e2) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      var k = 'territorio|penco';
      if (!BTN_ORDER[k]) BTN_ORDER[k] = ['btnComuna'];
      if (BTN_ORDER[k].indexOf('btnBiblioPenco') < 0) {
        var ie = BTN_ORDER[k].indexOf('btnEducacion');
        if (ie >= 0) BTN_ORDER[k].splice(ie + 1, 0, 'btnBiblioPenco');
        else BTN_ORDER[k].push('btnBiblioPenco');
      }
    }
  } catch (e3) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnBiblioPenco') < 0) {
      var oe = ORDEN_TERRITORIO.indexOf('btnEducacion');
      if (oe >= 0) ORDEN_TERRITORIO.splice(oe + 1, 0, 'btnBiblioPenco');
      else ORDEN_TERRITORIO.push('btnBiblioPenco');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (!PRESETS[p] || typeof PRESETS[p] !== 'object') return;
        if (PRESETS[p].btnEducacion && PRESETS[p].btnBiblioPenco === undefined) PRESETS[p].btnBiblioPenco = true;
      });
    }
  } catch (e5) {}
}

function setup() {
  if (!$('biblioPencoPanel') || !$('biblioPencoDialog')) {
    window._biblioRetry = (window._biblioRetry || 0) + 1;
    if (window._biblioRetry < 60) setTimeout(setup, 500);
    return;
  }
  ensureCheckbox();
  register();
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (eO) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (eR) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (eU) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (eV) {}
  try {
    var b = $('btnBiblioPenco');
    if (b && !b.dataset.bibW) { b.dataset.bibW = '1'; b.addEventListener('click', openBiblio); }
  } catch (e) {}
  try {
    if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf('biblioteca') < 0)
      b.dataset.keywords += ' biblioteca lectura libro prestamo socio carnet kamishibai cuentacuentos rayo cesa poesia museo crav historia biblio redes bpdigital catalogo cultura casa cultura n33 033 rincon infantil juvenil feria manufactura';
  } catch (e2) {}
  try {
    var c1 = $('biblioPencoCloseTop'), c2 = $('biblioPencoClose');
    if (c1 && !c1.dataset.w) { c1.dataset.w = '1'; c1.onclick = function () { try { $('biblioPencoDialog').close(); } catch (e) {} }; }
    if (c2 && !c2.dataset.w) { c2.dataset.w = '1'; c2.onclick = function () { try { $('biblioPencoDialog').close(); } catch (e) {} }; }
  } catch (e3) {}
}

window.BibliotecaPenco = { render: render, open: openBiblio, todas: todas, agregarAlCalendario: agregarAlCalendario, ficha: BIBLIO_FICHA, historia: HISTORIA_BIBLIO, servicios: SERVICIOS, fuentes: FUENTES_BIBLIO };
setTimeout(setup, 600);
setTimeout(setup, 1800);

})();
