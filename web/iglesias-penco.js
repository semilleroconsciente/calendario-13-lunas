/* ============================================================
   IGLESIAS DE PENCO — Calendario 13 Lunas
   Apartado propio: Territorio > Penco > ⛪ Iglesias
     (btnIglesias -> iglesiasDialog -> iglesiasPanel),
     al lado de 🎉 Penco | 🏛️ Municipalidad | 🚒 Bomberos |
     Guardianes | 🏪 Economía Local. Ya NO vive dentro de
     comunaDialog (se eliminó la pestaña tabComunaIglesias).
   - Base verificada: 3 parroquias católicas de la comuna según
     Directorio Diocesano 2026 (Arzobispado de Concepción, Decanato
     Costa Norte, junio 2026) + 8 capillas dependientes de la
     Parroquia Ntra. Sra. del Carmen (Redentoristas, La 977) +
     Monasterio de Trinitarias de Penco. Sin horarios inventados:
     confirmar misas en cada parroquia/capilla.
   - Panorama evangélico: en Penco hay decenas de templos y casas
     de oración (Metodista Pentecostal, Bautista, Adventista y otras,
     desde ~1930). Como no hay directorio público único con dirección
     y horario, no se inventan fichas: se deja 1 ficha-guía y cada
     vecino/a suma la suya verificada (afiche, puerta del templo).
   - Subsección 📜 Historia: de la primera iglesia de 1550 y el
     obispado en Penco (1603–1764) a las parroquias actuales y la
     fiesta del Carmen (16 jul).
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
   Fuentes:
   - Directorio Diocesano 2026 — Arzobispado de Concepción,
     Decanato Costa Norte (junio 2026): Carmen (1550), Divino
     Redentor (1961). Guía Eclesial abril 2024: mismos datos.
   - Parroquia La Purísima de Lirquén: sede en Manuel Rodríguez 177,
     Lirquén; atiende caletas El Refugio y La Cata; Decano Costa
     Norte: Pbro. Raúl Castillo.
   - 8 capillas de la Parroquia El Carmen: comunidad redentorista de
     Penco (La 977 / Redentoristas Chile): 4 del centro + 4 rurales.
   - Monasterio Trinitarias de Penco: Sierra Leona s/n, Bellavista
     Sur; fundado en 1736 en Concepción, ~30 años en Penco actual.
   - Templo del Carmen: muros de vidrio, arquitectura singular;
     redentoristas en Penco desde 1967 (O'Higgins 430, 41-2452616).
   - Panorama evangélico: Memoria Chilena / Biblioteca Nacional:
     Metodista Pentecostal (1909, principal desde cisma 1932),
     expansión fuerte desde 1930; presencia en todo el Gran
     Concepción. En Penco no hay directorio público único, por eso
     las fichas evangélicas se agregan solo verificadas. */
var IGLESIAS_BASE = [
  { id: 'igl-carmen', credo: 'catolica', tipo: 'Parroquia madre', icon: '⛪', nombre: 'Parroquia Nuestra Señora del Carmen',
    sector: 'Penco Centro', direccion: 'O’Higgins 430, Penco (casilla 48)', horario: 'Misas: confirmar en parroquia',
    contacto: 'parroquiadelcarmenpenco@gmail.com · 41-2452616 · Redentoristas desde 1967',
    desc: 'Iglesia madre de Penco. Advocación del Carmen (fiesta 16 jul, novena-misión + procesión multitudinaria). Templo de hermosa arquitectura con muros de vidrio (“sin distancias entre la fe y el pueblo”). Párroco: R.P. Víctor Fernández; vic. R.P. Fernando Lacaux. Cabecera de 8 capillas (4 centro + 4 rurales).' },
  { id: 'igl-purisima', credo: 'catolica', tipo: 'Parroquia puerto', icon: '⛪', nombre: 'Parroquia La Purísima de Lirquén',
    sector: 'Lirquén', direccion: 'Manuel Rodríguez 177, Lirquén', horario: 'Misas: confirmar en parroquia',
    contacto: 'lapurisimalirquen@hotmail.com · Decano Costa Norte: Pbro. Raúl Castillo',
    desc: 'Parroquia del puerto-pesquero (fiesta patronal Inmaculada Concepción, 8 dic). Atiende Caleta El Refugio y Caleta La Cata, además de Villa El Rosal, Ríos de Chile, Bellavista (Lirquén), La Cantera y Las Pataguas.' },
  { id: 'igl-redentor', credo: 'catolica', tipo: 'Parroquia barrio', icon: '✝️', nombre: 'Parroquia Divino Redentor',
    sector: 'Penco Centro', direccion: 'Roberto Ovalle 200 (Ovalle 200), Penco — Barrio Patrimonial Ex CRAV', horario: 'Misas: confirmar en parroquia',
    contacto: 'pdrpenco@gmail.com',
    desc: 'Parroquia del sector alto y del Barrio Patrimonial Ex CRAV (erigida 1961). Punto de velatorios y vida barrial del centro-obrero. Responsable parroquial: Diác. Alejandro Montero (Roberto Ovalle 130).' },
  /* --- 8 capillas dependientes de El Carmen (Redentoristas) --- */
  { id: 'igl-cap-boldo', credo: 'catolica', tipo: 'Capilla centro', icon: '🕯️', nombre: 'Capilla Nuestra Señora del Boldo — La Ermita',
    sector: 'Cosmito / Ruta 150', direccion: 'La Ermita, sector El Boldo (confirmar ubicación exacta en parroquia El Carmen)', horario: 'Celebraciones: confirmar en parroquia El Carmen',
    contacto: 'Parroquia El Carmen · O’Higgins 430',
    desc: 'Capilla urbana del centro-sur, en la zona del boldo y la antigua Granja Cosmito. Fiestas y novenas de sector.' },
  { id: 'igl-cap-nazareno', credo: 'catolica', tipo: 'Capilla cerro', icon: '🕯️', nombre: 'Capilla Jesús Nazareno — Cerro Verde Alto',
    sector: 'Cerro Verde', direccion: 'Cerro Verde Alto (confirmar calle en parroquia El Carmen)', horario: 'Celebraciones: confirmar en parroquia',
    contacto: 'Parroquia El Carmen · O’Higgins 430',
    desc: 'Capilla del cerro que cose Penco con Lirquén. Semana Santa y Vía Crucis de altura; memoria minera y obrera del carbón.' },
  { id: 'igl-cap-socorro-cv', credo: 'catolica', tipo: 'Capilla cerro', icon: '🕯️', nombre: 'Capilla Perpetuo Socorro — Cerro Verde Bajo',
    sector: 'Cerro Verde', direccion: 'Cerro Verde Bajo (confirmar calle en parroquia El Carmen)', horario: 'Celebraciones: confirmar en parroquia',
    contacto: 'Parroquia El Carmen · O’Higgins 430',
    desc: 'Capilla redentorista del piedemonte (advocación del Perpetuo Socorro, patrona redentorista). Comunidades de base y pastoral juvenil.' },
  { id: 'igl-cap-teresa', credo: 'catolica', tipo: 'Capilla villa', icon: '🕯️', nombre: 'Capilla Santa Teresa de Los Andes — Villa Italia',
    sector: 'Penco Centro', direccion: 'Villa Italia, Penco (confirmar calle en parroquia El Carmen)', horario: 'Celebraciones: confirmar en parroquia',
    contacto: 'Parroquia El Carmen · O’Higgins 430',
    desc: 'Capilla de villa del centro (Santa Teresa, primera santa chilena). Catequesis y fiesta de octubre.' },
  { id: 'igl-cap-agua1', credo: 'catolica', tipo: 'Capilla rural', icon: '🌾', nombre: 'Capilla Nuestra Señora del Carmen — Primer Agua',
    sector: 'Zona Rural Este', direccion: 'Primer Agua, ruta Penco–Roa–Florida (confirmar en parroquia)', horario: 'Celebraciones: confirmar en parroquia',
    contacto: 'Parroquia El Carmen · misioneros recorren campos cercanos',
    desc: 'Capilla rural del agua y el bosque (vertientes, canelo, copihue). Misiones de los redentoristas a los campos cercanos.' },
  { id: 'igl-cap-aguabuena', credo: 'catolica', tipo: 'Capilla rural', icon: '🌾', nombre: 'Capilla Perpetuo Socorro — Agua Buena',
    sector: 'Zona Rural Este', direccion: 'Agua Buena, sector rural este (confirmar en parroquia)', horario: 'Celebraciones: confirmar en parroquia',
    contacto: 'Parroquia El Carmen · O’Higgins 430',
    desc: 'Capilla rural del este penqueño. Fiesta del Perpetuo Socorro (fines de junio) y trillas/mingas con misa a la chilena.' },
  { id: 'igl-cap-alfonso', credo: 'catolica', tipo: 'Capilla rural', icon: '🌾', nombre: 'Capilla San Alfonso — Poñén',
    sector: 'Zona Rural Este', direccion: 'Poñén (confirmar en parroquia El Carmen)', horario: 'Celebraciones: confirmar en parroquia',
    contacto: 'Parroquia El Carmen · O’Higgins 430',
    desc: 'Capilla rural dedicada a San Alfonso María de Ligorio, fundador redentorista (fiesta 1 ago). Memoria campesina y arriera.' },
  { id: 'igl-cap-antonio', credo: 'catolica', tipo: 'Capilla rural', icon: '🌾', nombre: 'Capilla San Antonio — San Antonio',
    sector: 'Zona Rural Este', direccion: 'San Antonio, sector rural (confirmar en parroquia)', horario: 'Celebraciones: confirmar en parroquia (fiesta 13 jun)',
    contacto: 'Parroquia El Carmen · O’Higgins 430',
    desc: 'Capilla rural de San Antonio de Padua (fiesta 13 jun, bendición de panes y animales).' },
  /* --- Vida consagrada --- */
  { id: 'igl-trinitarias', credo: 'catolica', tipo: 'Monasterio', icon: '🕊️', nombre: 'Monasterio de Religiosas Trinitarias de Penco',
    sector: 'Penco Centro', direccion: 'Sierra Leona s/n, Bellavista Sur, Penco', horario: 'Oración contemplativa; visitas: confirmar con el monasterio',
    contacto: 'Orden de la Santísima Trinidad · fundado en 1736 en Concepción, ~30 años en Penco',
    desc: 'Monasterio de clausura en Bellavista Sur (Hnas. Cecilia de la Anunciación, superiora, y comunidad). Corazón orante de la comuna; acoge encuentros (p. ej. Conferre) y pedidos de oración.' },
  /* --- Ficha-guía evangélica (no inventa direcciones) --- */
  { id: 'igl-evang-guia', credo: 'evangelica', tipo: 'Red de templos', icon: '🙏', nombre: 'Red de iglesias evangélicas de Penco (guía)',
    sector: 'Toda la comuna', direccion: 'Centro · Cerro Verde · Lirquén · Cosmito / Ruta 150 · Zona Rural Este (dirección exacta solo verificada)',
    horario: 'Cultos: miércoles / domingo según cada templo — confirmar en afiche o puerta del templo',
    contacto: 'Metodista Pentecostal (desde 1909) · Bautista · Adventista · otras pentecostales',
    desc: 'Penco tiene decenas de templos y casas de oración evangélicas, con fuerte crecimiento desde 1930 (fiesta nacional: Te Deum evangélico en septiembre, cultos de Semana Santa y fin de año). Como no hay directorio público único, esta ficha es una guía: suma tu iglesia en ➕ Agregar solo con dirección y horario verificados.' }
];

/* ---------- HISTORIA DE LAS IGLESIAS EN PENCO (subsección) ----------
   Síntesis honesta con fuentes al pie. Para editar, editar aquí. */
var HISTORIA_IGLESIAS = [
  { t: '⛪ 1550: la primera iglesia, en la fundación', f: '5 oct 1550 · La Concepción del Nuevo Extremo',
    d: 'Con la fundación de <b>La Concepción de María Purísima del Nuevo Extremo</b> (fuerte en Altos de Playa Negra, solares 3 mar, fundación 5 oct) se traza también la <b>primera iglesia</b> junto a plaza, cabildo y hospital. Es la iglesia matriz del sur: de aquí saldrá la diócesis. Excavaciones recientes (UdeC, 2018, mapa Frezier 1712) buscan el <b>convento franciscano y la iglesia de la Inmaculada</b> frente a la actual plaza, donde yacerían gobernadores (Villagra, Ribera, Ulloa).' },
  { t: '✝️ Obispado en Penco y ciudad-convento', f: '1563 La Imperial → 7 feb 1603 Penco → 1764 Valle de la Mocha',
    d: 'La diócesis se erige en <b>La Imperial (1563)</b> y traslada su sede a <b>Concepción-Penco en 1603</b>, donde permanece <b>160 años</b>. Penco es entonces <b>ciudad episcopal</b>: catedral de cal y ladrillo con cimientos de piedra y ciprés, conventos (franciscanos, y luego agustinos y otras órdenes), cofradías y hospital San Juan. Los obispos resisten aquí la guerra del Biobío hasta el éxodo.' },
  { t: '🌹 La Cofradía del Carmen y la Patrona', f: '1648 primera Cofradía en Concepción (Penco) · 16 jul',
    d: 'Los <b>agustinos traen la devoción del Carmen (~1595)</b> y en <b>1648 fundan en Concepción-Penco la primera Cofradía del Carmen</b>: cada 16 de julio sacan la imagen en procesión. De esa raíz nace la <b>Virgen del Carmen, Patrona y Generala de Chile</b> (jurada en 1817–1818, coronada Reina en 1926, centenario en 2026). Penco la celebra hasta hoy con <b>novena-misión y procesión multitudinaria</b>, “joya de religiosidad popular”.' },
  { t: '🌊 1751: la catedral sepultada y el largo silencio', f: '25 may 1751 terremoto-maremoto · traslado 1764',
    d: 'El maremoto <b>sepulta catedral, iglesias y conventos</b> (“solo las ruinas recordaban su heroico pasado”, con 17 muertos pese al daño total). En <b>cabildo abierto (1 sep 1751)</b> se decide el traslado al <b>Valle de la Mocha</b>; el obispo Toro y Zambrano se opone hasta 1760 y la sede se mueve en <b>1764</b>. Penco queda <b>prohibido por ~90 años</b>: la fe sobrevive en oratorios de las 51 familias que piden a O’Higgins quedarse (1822).' },
  { t: '🏡 Refundación republicana: vuelve la parroquia', f: 'Villa 1843 · Municipalidad 1891 · ciudad 1898',
    d: 'Con la <b>Villa (Bulnes, 1843)</b> renace la vida parroquial entre las ruinas. Lirquén crece como caleta (~1850) con su propia capilla porteña. La <b>Refinería de Azúcar (1886, luego CRAV)</b> y la <b>Loza (1898)</b> traen miles de obreros: la Iglesia los acompaña con escuelas, sindicatos católicos y fiestas patronales de barrio.' },
  { t: '❤️ 1967: llegan los Redentoristas al Carmen', f: '1967 fundación · O’Higgins 430 · 8 capillas',
    d: 'Se acepta la <b>fundación redentorista de Penco (1967)</b>: padres en “casita estrecha apegada al templo” de <b>muros de vidrio</b>, “pan para toda la ciudad”. Surgen <b>comunidades de base y capillas en los sectores</b> (hoy 4 del centro: Boldo/Ermita, Nazareno/Cerro Verde Alto, Socorro/Cerro Verde Bajo, Teresa/Villa Italia; y 4 rurales: Primer Agua, Agua Buena, Poñén, San Antonio), pastoral juvenil misionera y obras por los más pobres. La <b>fiesta del Carmen</b> se vuelve el corazón del año penqueño.' },
  { t: '⚓ Lirquén y Cerro Verde: parroquias del puerto y del barrio', f: 'Divino Redentor 1961 · La Purísima (8 dic) · Trinitarias (~1990s en Penco)',
    d: 'El siglo XX suma la <b>Parroquia Divino Redentor (1961, Ovalle 200, Barrio CRAV)</b> para el Penco alto-obrero, y la <b>Parroquia La Purísima de Lirquén (Manuel Rodríguez 177)</b> para el puerto, las caletas El Refugio y La Cata y los barrios del carbón y el vidrio. El <b>Monasterio de Trinitarias (fundado 1736)</b> se instala en <b>Bellavista Sur hace ~30 años</b> como pulmón contemplativo. Terremotos de <b>1939, 1960 y 2010 (27F)</b> dañan templos y obligan a reconstruir, con velatorios y ollas que sostienen a los barrios.' },
  { t: '🙏 Penco ecuménico: evangélicos y fiestas que unen', f: '1909 Metodista Pentecostal · expansión desde 1930 · hoy',
    d: 'En paralelo crece la <b>Iglesia evangélica chilena</b>: la <b>Metodista Pentecostal (1909, principal tras el cisma de 1932)</b> y luego bautistas, adventistas y pentecostales levantan <b>decenas de templos en Centro, Cerro Verde, Lirquén y Cosmito</b>. Hoy Penco vive un <b>calendario compartido</b>: <b>16 jul Carmen</b> (novena + procesión), <b>8 dic Purísima/La Cata</b>, <b>Semana Santa</b> (Vía Crucis al cerro y a la costa), <b>fiestas de caletas</b> (San Pedro) y <b>Te Deum de septiembre</b>. La consigna de esta sección: <b>solo fichas verificadas</b>, todas las fes con respeto.' }
];
var FUENTES_IGLESIAS = 'Fuentes: Directorio Diocesano 2026 + Guía Eclesial 2024 (Arzobispado de Concepción, Decanato Costa Norte) · Redentoristas Chile / La 977 (8 capillas del Carmen, 1967) · Iglesia de Concepción (Trinitarias Bellavista Sur, fund. 1736) · Opus Dei/Cofradía del Carmen (1648) y Fides/AICA (centenario coronación 1926–2026) · Archivo Histórico de Concepción / Cartes (terremotos 1570–1751, traslado 1764) · EconomiayNegocios/UdeC (excavación convento 2018, Frezier 1712) · Memoria Chilena BN (evangélicas 1819–2002, Metodista Pentecostal 1909). Horarios siempre por confirmar en cada templo.';

var CREDOS = { catolica: '⛪ Católica', evangelica: '🙏 Evangélica', otra: '🕊️ Otra' };
var SECTORES = ['Penco Centro', 'Lirquén', 'Cerro Verde', 'Cosmito / Ruta 150', 'Zona Rural Este', 'Bellavista Sur', 'Villa Italia', 'Toda la comuna'];
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

/* ---------- UI (diálogo propio) ---------- */
function asegurarPanel() {
  var panel = $('iglesiasPanel');
  if (!panel) return null;
  if (!panel.dataset.iglOk) {
    panel.dataset.iglOk = '1';
    panel.innerHTML =
      '<p class="muted" style="font-size:11px;line-height:1.55">Fe y comunidad en Penco: <b>3 parroquias + 8 capillas + monasterio verificados</b> + red evangélica y tus fichas con horario confirmado. Elige fecha/hora y llévala a tu día con <b>📌 Calendario</b>. Revisa también <b>📜 Historia</b>. Queda <b>privado y local</b>.</p>' +
      '<div class="timer-tabs" style="margin:8px 0 10px;flex-wrap:wrap">' +
      '<button type="button" id="tabIglTodas" class="btn btn-accent" style="width:auto">⛪ Todas</button>' +
      '<button type="button" id="tabIglCat" class="btn" style="width:auto">⛪ Católicas</button>' +
      '<button type="button" id="tabIglEva" class="btn" style="width:auto">🙏 Evangélicas</button>' +
      '<button type="button" id="tabIglHis" class="btn" style="width:auto">📜 Historia</button>' +
      '<button type="button" id="tabIglVis" class="btn" style="width:auto">📌 Mis visitas</button>' +
      '<button type="button" id="tabIglAgr" class="btn" style="width:auto">➕ Agregar</button>' +
      '</div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🔍 Buscar</h4>' +
      '<label>Buscar <input type="text" id="iglSearch" placeholder="ej: Carmen, Lirquén, capilla, Cerro Verde, Primer Agua, culto..." maxlength="60" autocomplete="off"></label></div>' +
      '<div id="iglList" style="margin-top:10px"></div>' +
      '<div id="iglHisBox" style="margin-top:10px"></div>' +
      '<div id="iglFormBox" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div>' +
      '<div id="iglVisBox" class="hidden" style="margin-top:10px"></div>';
    var bT = $('tabIglTodas'), bC = $('tabIglCat'), bE = $('tabIglEva'), bH = $('tabIglHis'), bV = $('tabIglVis'), bA = $('tabIglAgr');
    if (bT) bT.onclick = function () { tabActual = 'todas'; render(); };
    if (bC) bC.onclick = function () { tabActual = 'catolica'; render(); };
    if (bE) bE.onclick = function () { tabActual = 'evangelica'; render(); };
    if (bH) bH.onclick = function () { tabActual = 'historia'; render(); };
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
    '<p class="muted" style="font-size:10px">' + esc(CREDOS[t.credo] || CREDOS.otra) + (t.tipo ? ' · ' + esc(t.tipo) : '') + ' · ' + esc(t.sector || '') + (t.oficial ? ' · base verificada' : ' · mía') + (nvis ? ' · 📌 ' + nvis + ' en calendario' : '') + '</p>' +
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
  var tabs = { todas: $('tabIglTodas'), catolica: $('tabIglCat'), evangelica: $('tabIglEva'), historia: $('tabIglHis'), visitas: $('tabIglVis'), agregar: $('tabIglAgr') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', tabActual === k); });
  var q2 = $('iglSearch');
  if (q2 && q2.value !== filtroQuery && document.activeElement !== q2) q2.value = filtroQuery;
  renderLista();
  renderHistoria();
  renderForm();
  renderVisitas();
}
function renderHistoria() {
  var box = $('iglHisBox'); if (!box) return;
  if (tabActual !== 'historia') { box.innerHTML = ''; return; }
  var q = (filtroQuery || '').toLowerCase().trim();
  var eras = HISTORIA_IGLESIAS.filter(function (e) {
    if (!q) return true;
    return ((e.t || '') + ' ' + (e.f || '') + ' ' + (e.d || '')).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📜 Historia de las iglesias en Penco · ' + eras.length + ' hitos</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.55">De la primera iglesia de 1550 y 160 años de obispado en Penco a las 3 parroquias, 8 capillas y el monasterio de hoy. Usa el buscador 🔍 para filtrar (ej: 1751, redentoristas, Lirquén).</p>' +
    eras.map(function (e) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + esc(e.t) + '</h4>' +
        '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + esc(e.f) + '</p>' +
        '<p style="font-size:12px;line-height:1.55">' + e.d + '</p></div>';
    }).join('') + '</div>';
  html += '<p class="muted" style="font-size:10px;margin-top:8px">' + esc(FUENTES_IGLESIAS) + '</p>';
  box.innerHTML = html;
}
function renderLista() {
  var box = $('iglList'); if (!box) return;
  if (tabActual === 'visitas' || tabActual === 'agregar' || tabActual === 'historia') { box.innerHTML = ''; return; }
  var his = $('iglHisBox'); if (his && tabActual !== 'historia') his.innerHTML = '';
  var q = (filtroQuery || '').toLowerCase().trim();
  var list = todas();
  if (tabActual === 'catolica') list = list.filter(function (t) { return t.credo === 'catolica'; });
  if (tabActual === 'evangelica') list = list.filter(function (t) { return t.credo === 'evangelica'; });
  if (q) list = list.filter(function (t) {
    return ((t.nombre || '') + ' ' + (t.desc || '') + ' ' + (t.direccion || '') + ' ' + (t.sector || '') + ' ' + (t.horario || '') + ' ' + (t.tipo || '')).toLowerCase().indexOf(q) >= 0;
  });
  var titulo = tabActual === 'catolica' ? '⛪ Católicas' : tabActual === 'evangelica' ? '🙏 Evangélicas' : '⛪ Iglesias de Penco';
  var html = '<div class="menstrual-card"><h4>' + titulo + ' · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:10px">3 parroquias + 8 capillas + monasterio verificados + guía evangélica + tus fichas. En cada ficha elige fecha/hora y pulsa <b>📌 Calendario</b>.</p>' +
    (list.length ? list.map(cardHTML).join('') : '<p class="muted">Sin resultados. Si es tu iglesia evangélica o capilla de barrio, súmala en <b>➕ Agregar</b> con horario verificado.</p>') + '</div>';
  html += '<p class="muted" style="font-size:10px;margin-top:8px">' + esc(FUENTES_IGLESIAS) + '</p>';
  box.innerHTML = html;
  bindCards(box);
}

function openIglesias() {
  try { render(); } catch (e) {}
  try {
    var dlg = $('iglesiasDialog');
    if (dlg && typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
    else if (dlg && !dlg.open) dlg.setAttribute('open', '');
  } catch (e2) {}
}

function setup() {
  if (!$('iglesiasPanel') || !$('iglesiasDialog')) {
    window._iglRetry = (window._iglRetry || 0) + 1;
    if (window._iglRetry < 60) setTimeout(setup, 500);
    return;
  }
  try {
    var b = $('btnIglesias');
    if (b && !b.dataset.iglW) { b.dataset.iglW = '1'; b.addEventListener('click', openIglesias); }
  } catch (e) {}
  try {
    var c1 = $('iglesiasCloseTop'), c2 = $('iglesiasClose');
    if (c1 && !c1.dataset.w) { c1.dataset.w = '1'; c1.onclick = function () { try { $('iglesiasDialog').close(); } catch (e) {} }; }
    if (c2 && !c2.dataset.w) { c2.dataset.w = '1'; c2.onclick = function () { try { $('iglesiasDialog').close(); } catch (e) {} }; }
  } catch (e3) {}
}

window.IglesiasPenco = { render: render, open: openIglesias, todas: todas, agregarAlCalendario: agregarAlCalendario, base: IGLESIAS_BASE, historia: HISTORIA_IGLESIAS, fuentes: FUENTES_IGLESIAS };
setTimeout(setup, 600);
setTimeout(setup, 1800);

})();
