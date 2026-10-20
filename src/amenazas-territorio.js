/* ============================================================
   AMENAZAS DEL TERRITORIO — Calendario 13 Lunas (Penco · Bío-Bío)
   Apartado: Comuna y servicios > ⚠️ Amenazas (btnAmenazas ->
   amenazasDialog). Sección completa:
     - Fichas por amenaza (extractiva / natural / urbana) con
       nivel, estado, zona, impacto, señales, qué hacer, dónde
       denunciar, guardianes y fuente verificable.
     - Por sector: qué amenaza golpea a cada barrio (cruce con
       los 7 sectores de la Guía de Penco).
     - Qué hacer: directorio de denuncias + prevención.
     - Mis reportes: sigo/me-preocupa + reportes vecinales
       privados (foto+fecha+ubicación) con 📌 al calendario.
   Fuente preferida: data/territorios/<id>/amenazas.json vía
   window.Territorio. Fallback embebido (Penco, 2021-2026).
   100% offline. Verifica vigencia en terreno y expedientes.
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
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') { renderCurrentView(); return; } } catch (e) {}
  try { if (typeof renderLuna === 'function') renderLuna(); } catch (e2) {}
}

/* ---------- FALLBACK EMBEBIDO (Penco) ---------- */
var AMENAZAS_FALLBACK = {
  actualizado: '2026-10',
  nota: 'Amenazas que presionan hoy al territorio de Penco: extractivas, naturales y urbanas. Los estados cambian: verifica vigencia antes de difundir. Tus reportes quedan solo en tu dispositivo.',
  tipos: ['extractiva', 'natural', 'urbana'],
  amenazas: [
    { id: 'gnl-penco-lirquen', nombre: 'Terminal GNL Penco-Lirquén', icono: '🏭', tipo: 'extractiva', nivel: 'crítico', estado: 'activo', zona: 'Bahía de Concepción · frente a Penco y Lirquén', sectores: ['lirquen', 'playa-negra', 'rocuant'], queEs: 'Terminal de regasificación con buque, gasoducto y obras en la bahía. Más de una década en evaluación ambiental, con modificaciones, reclamaciones y exigencia de consulta indígena (Convenio 169).', impacto: ['Riesgo de accidente mayor en bahía cerrada', 'Afectación a pesca artesanal de Caleta El Refugio y La Cata', 'Presión sobre lafken y rutas ancestrales', 'Dragados y alteración de fondo marino'], senales: ['Buques gaseros o faenas en la bahía', 'Nuevas RCA / modificaciones en el SEA', 'Convocatorias a participación ciudadana (PAC)'], queHacer: ['Revisar el expediente en sea.gob.cl (busca GNL Penco)', 'Participar en PAC y pedir consulta indígena si corresponde', 'Acompañar a pescadores con respeto a sus vocerías', 'Registrar faenas con foto + fecha y denunciar ante SMA'], donde: 'SEA (sea.gob.cl) · SMA (sma.gob.cl) · Capitanía de Puerto Lirquén', guardianes: ['konintu-lafkenmapu', 'olca'], fuente: 'Resumen.cl 2021 · OLCA', fuenteUrl: 'https://resumen.cl/articulos/comunidades-logran-elevar-sus-reclamos-contra-proyecto-terminal-gnl-penco-lirquen' },
    { id: 'tierras-raras-aclara', nombre: 'Minería de tierras raras (Aclara)', icono: '⛏️', tipo: 'extractiva', nivel: 'crítico', estado: 'activo', zona: 'Cordillera de la Costa · Penco y alrededores', sectores: ['rural-este', 'cerro-verde', 'sur-ruta150'], queEs: 'Extracción de tierras raras sobre bosque nativo con keule (Monumento Natural en peligro). Rechazo del ~99% en consulta 2022; sigue en SEA y Tribunal Ambiental.', impacto: ['Pérdida de bosque nativo y hábitat del keule, pudú y güiña', 'Riesgo para vertientes y agua', 'Polvo, tronaduras y camiones junto a villas', 'Fragmentación del corredor Lirquén–Tomé'], senales: ['Sondajes o caminos en cerros', 'Nuevos ingresos al SEA o fallos del Tribunal', 'Ofertas de compra de predios rurales'], queHacer: ['Seguir el expediente en sea.gob.cl y asistir a PAC', 'Apoyar a Penco-Lirquén Libre de Mineras y Keule Resiste', 'No firmar servidumbres sin asesoría legal', 'Fotografiar faenas y denunciar ante SMA / CONAF'], donde: 'SEA · SMA · CONAF · *4157 Seguridad Penco', guardianes: ['penco-lirquen-libre-mineras', 'keule-resiste', 'corredor-biocultural-tome-lirquen', 'parque-para-penco', 'konintu-lafkenmapu', 'olca'], fuente: 'OLCA / Radio U. de Chile 2026', fuenteUrl: 'https://olca.cl/articulo/nota.php?id=111582' },
    { id: 'incendios-interfaz', nombre: 'Incendios forestales e interfaz', icono: '🔥', tipo: 'natural', nivel: 'crítico', estado: 'activo', zona: 'Toda la comuna · crítico Cosmito, Cerro Verde, rural este', sectores: ['sur-ruta150', 'cerro-verde', 'rural-este', 'centro'], queEs: 'En enero 2026 los incendios alcanzaron Penco y Lirquén con daño mayor. La interfaz (casas pegadas a plantaciones y quebradas) es la prioridad comunal N°1.', impacto: ['Pérdida de casas y bosque relicto', 'Humo y crisis respiratoria', 'Cortes de luz, agua y rutas', 'Erosión y aluviones en invierno'], senales: ['Humo o pavesas + viento fuerte', 'Quemas o fogatas en alerta roja', 'Pastizal seco pegado al cerco'], queHacer: ['Llama 132 de inmediato; si no responde, 131 o *4157', 'Desmaleza 10 m alrededor de tu casa', 'Prepara mochila 72 h y punto de encuentro', 'Denuncia quemas al 130 CONAF'], donde: '132 Bomberos · 130 CONAF · *4157 · SENAPRED', guardianes: ['parque-para-penco', 'corredor-biocultural-tome-lirquen'], fuente: 'Bomberos de Penco · SENAPRED', fuenteUrl: '' },
    { id: 'terremoto-tsunami', nombre: 'Terremoto y tsunami en borde costero', icono: '🌊', tipo: 'natural', nivel: 'alto', estado: 'latente', zona: 'Borde costero · Playa Negra, Lirquén, caletas', sectores: ['playa-negra', 'lirquen', 'centro', 'rocuant'], queEs: 'Penco nació y murió por terremotos: traslado de 1751 y 27F de 2010. Todo el borde bajo es zona de inundación por tsunami.', impacto: ['Destrucción de caletas y viviendas costeras', 'Cortes de ruta y servicios', 'Trauma y desplazamiento'], senales: ['Sismo largo que impide estar de pie (evacúa sin esperar)', 'Retroceso brusco del mar', 'Alerta SAE / sirenas'], queHacer: ['Si tiembla fuerte en la costa: sube a pie a cota 30 m', 'Conoce tu vía de evacuación (Protección Civil 41-2261305)', 'Mochila 72 h lista', 'No bajes a mirar el mar'], donde: 'SENAPRED · Protección Civil 41-2261305 · *4157', guardianes: [], fuente: 'Historia comunal · SENAPRED', fuenteUrl: '' },
    { id: 'rellenos-humedal', nombre: 'Rellenos del humedal Rocuant-Andalién', icono: '🦅', tipo: 'urbana', nivel: 'crítico', estado: 'activo', zona: 'Límite suroeste · marismas del Andalién', sectores: ['rocuant'], queEs: 'Humedal urbano protegido (1.377 ha, 2026) con 8 reclamaciones en el Tribunal Ambiental. Rellenos y escombreras lo asfixian.', impacto: ['Pérdida de aves migratorias', 'Menos esponja ante inundaciones', 'Basura en marismas', 'Riesgo de perder la declaratoria'], senales: ['Camiones botando escombro', 'Nuevos cierres o drenajes', 'Quemas de totora'], queHacer: ['Foto + fecha + ubicación y denuncia en SMA', 'Súmate a monitoreos y limpiezas', 'No botes escombros: usa tolvas municipales', 'Observa aves sin entrar a nidos'], donde: 'SMA · Fundación Bandada · *4157', guardianes: ['ong-defensa-ambiental', 'fundacion-bandada'], fuente: 'Ladera Sur · TVU/MMA 2026', fuenteUrl: 'https://laderasur.com/articulo/la-cruzada-para-recuperar-al-humedal-rocuant-andalien-el-guardian-de-la-bahia-de-concepcion-que-es-asfixiado-por-la-ciudad' },
    { id: 'contaminacion-bahia', nombre: 'Contaminación de la bahía', icono: '🛢️', tipo: 'extractiva', nivel: 'alto', estado: 'activo', zona: 'Bahía de Concepción · Lirquén, Playa Negra', sectores: ['lirquen', 'playa-negra'], queEs: 'Bahía semicerrada con puerto mayor, industria y descargas urbanas. Derrames y marea roja golpean pesca e intermareal.', impacto: ['Vedas y marea roja', 'Plásticos y enredos para fauna', 'Agua no apta tras lluvias', 'Pérdida de ingresos artesanales'], senales: ['Mancha o mortandad de peces', 'Olor a combustible', 'Aviso de marea roja (Sernapesca)'], queHacer: ['No coseches con marea roja: consulta sernapesca.cl', 'Denuncia derrames a Capitanía y SMA con foto + hora', 'Lleva tu basura y recoge aparejos', 'Prefiere caleta local y pesca responsable'], donde: 'Sernapesca · Capitanía Lirquén · SMA', guardianes: ['konintu-lafkenmapu'], fuente: 'Sernapesca · memoria caletas', fuenteUrl: '' },
    { id: 'forestales-agua', nombre: 'Plantaciones forestales y crisis del agua', icono: '🌲', tipo: 'extractiva', nivel: 'alto', estado: 'activo', zona: 'Cerros y rural este · Primer Agua, Coihueco', sectores: ['rural-este', 'cerro-verde', 'sur-ruta150'], queEs: 'Pino y eucalipto rodean vertientes: secan napas y arden como antorcha. Primer Agua lo nota cada verano.', impacto: ['Menos caudal en verano', 'Erosión y caminos cortados', 'Más combustible para incendios', 'Pérdida de bosque nativo'], senales: ['Tala rasa junto a quebradas', 'Camiones y polvo en caminos rurales', 'Vertiente que baja en verano'], queHacer: ['Denuncia corta ilegal ante CONAF', 'No plantes pino/eucalipto a menos de 20 m del agua', 'Súmate a restauración con nativo', 'Cuida el agua y cosecha lluvia'], donde: 'CONAF 130 · DGA · APR local', guardianes: ['parque-para-penco', 'keule-resiste', 'corredor-biocultural-tome-lirquen'], fuente: 'Memoria Primer Agua–Roa · CONAF', fuenteUrl: '' },
    { id: 'inmobiliaria-plano', nombre: 'Presión inmobiliaria y Plan Regulador', icono: '🏗️', tipo: 'urbana', nivel: 'medio', estado: 'activo', zona: 'Cerro Verde, borde costero, Coihueco', sectores: ['cerro-verde', 'playa-negra', 'rural-este', 'centro'], queEs: 'Loteos avanzan sobre quebradas y el parque urbano (Fundo Coihueco). Sin zona protegida, el bosque queda expuesto.', impacto: ['Quebradas rellenadas e inundación', 'Cierre de accesos a playa y cerro', 'Alzas de arriendo', 'Pérdida de sitio ceremonial'], senales: ['Movimientos de tierra en quebradas', 'Cambios al Plan Regulador sin difusión', 'Loteo sobre bosque o humedal'], queHacer: ['Revisa el Plan Regulador en SECPLAN/DOM', 'Pide zona protegida para Coihueco y quebradas', 'Organízate en JJVV con acta y folio OIRS', 'Camina y cuida los senderos'], donde: 'SECPLAN 41-2261418 · DOM · OIRS oirs@penco.cl', guardianes: ['parque-para-penco'], fuente: 'Radio UdeC 2025', fuenteUrl: 'https://www.radioudec.cl/penco-inaugura-la-primera-etapa-de-su-primer-parque-urbano-con-acceso-gratuito-a-la-comunidad' },
    { id: 'basura-escombros', nombre: 'Basura y microbasurales', icono: '🗑️', tipo: 'urbana', nivel: 'medio', estado: 'activo', zona: 'Quebradas, borde costero, sitios eriazos', sectores: ['cerro-verde', 'playa-negra', 'rocuant', 'sur-ruta150'], queEs: 'Escombros y basura terminan en quebradas, playa y humedal. Tapan cauces y alimentan incendios.', impacto: ['Cauces tapados → inundación', 'Quema tóxica y focos de incendio', 'Daño a pudú y aves', 'Playa con plástico y vidrio'], senales: ['Escombro fresco en quebrada', 'Quema de basura en las tardes', 'Tolva rebalsada'], queHacer: ['Pide tolva en Aseo municipal', 'Denuncia con foto + fecha al *4157', 'Organiza limpieza vecinal', 'Separa, composta y reduce'], donde: 'Aseo municipal · *4157 · JJVV', guardianes: ['ong-defensa-ambiental'], fuente: 'Municipalidad de Penco', fuenteUrl: '' },
    { id: 'marejadas-inundacion', nombre: 'Marejadas e inundaciones del Andalién', icono: '⛈️', tipo: 'natural', nivel: 'medio', estado: 'latente', zona: 'Desembocadura Andalién, pasos bajos', sectores: ['rocuant', 'sur-ruta150', 'centro'], queEs: 'Sudestadas y lluvias suben el Andalién y meten el mar a caminos y casas bajas. Cada vez más seguidas.', impacto: ['Casas y calles anegadas', 'Cortes de Ruta 150', 'Contaminación por arrastre', 'Pérdida de enseres'], senales: ['Aviso de marejadas (Armada/SENAPRED)', 'Río alto y chubascos seguidos', 'Agua subiendo en la calle'], queHacer: ['Limpia canaletas; guarda documentos en alto', 'No cruces calles inundadas', 'Desconecta gas y luz si entra agua', 'Avisa a Protección Civil y JJVV'], donde: 'SENAPRED · Protección Civil 41-2261305', guardianes: ['fundacion-bandada', 'ong-defensa-ambiental'], fuente: 'SENAPRED · Protección Civil', fuenteUrl: '' }
  ],
  denuncias: [
    { nombre: 'Seguridad Penco', dato: '*4157', nota: 'Primera llamada comunal: bota ilegal, faenas, humo.' },
    { nombre: 'Bomberos / CONAF', dato: '132 · 130', nota: '132 fuego y rescate; 130 quemas y forestal.' },
    { nombre: 'SMA', dato: 'sma.gob.cl / denuncia', nota: 'Rellenos, faenas, derrames. Foto + fecha + ubicación.' },
    { nombre: 'SEA', dato: 'sea.gob.cl', nota: 'Expedientes GNL y tierras raras; PAC.' },
    { nombre: 'SENAPRED / Protección Civil', dato: 'senapred.cl · 41-2261305', nota: 'Alertas: tsunami, marejadas, incendios.' },
    { nombre: 'Sernapesca / Capitanía', dato: 'sernapesca.cl', nota: 'Marea roja, pesca ilegal, derrames.' },
    { nombre: 'OIRS Municipal (folio)', dato: 'oirs@penco.cl · 41-2261430', nota: 'Todo reclamo vecinal pide folio.' }
  ],
  prevencion: [
    'Conoce tu sector: ¿cota de tsunami, quebrada, interfaz o humedal? Pregunta en tu JJVV.',
    'Mochila 72 h + punto de encuentro + papeles en bolsa hermética.',
    'Foto + fecha + ubicación: tu mejor aliado para denunciar.',
    'Participa en PAC y Plan Regulador: lo que no se defiende en el papel se pierde en el cerro.',
    'Cuida quebradas y humedal todo el año, no solo en la emergencia.',
    'Camina el territorio: quien lo conoce lo defiende.'
  ],
  fuentes: 'Prensa 2021-2026 · Bomberos · SENAPRED · SMA/SEA/Sernapesca · Historia comunal. Verifica vigencia en expedientes oficiales.'
};

var SECTOR_NOMBRE = {
  'sur-ruta150': '🛣️ Sector Sur / Eje Ruta 150',
  'centro': '🏛️ Penco Centro y Casco Histórico',
  'playa-negra': '🌊 Playa Negra y Borde Costero',
  'cerro-verde': '⛰️ Cerro Verde Alto y Bajo',
  'lirquen': '⚓ Lirquén',
  'rocuant': '🦅 Humedal Rocuant y Andalién',
  'rural-este': '🌾 Zona Rural Este'
};

function dynAmenazas() {
  try {
    if (typeof Territorio !== 'undefined' && Territorio && typeof Territorio.get === 'function') {
      var v = Territorio.get('amenazas', null);
      if (v && Array.isArray(v.amenazas)) return v;
    }
  } catch (e) {}
  return AMENAZAS_FALLBACK;
}

/* ---------- store privado ---------- */
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { sigo: {}, reportes: [] };
    if (!u.amenazas) u.amenazas = { sigo: {}, reportes: [] };
    var a = u.amenazas;
    if (!a.sigo || Array.isArray(a.sigo)) a.sigo = {};
    if (!Array.isArray(a.reportes)) a.reportes = [];
    return a;
  } catch (e) { return { sigo: {}, reportes: [] }; }
}

var amTab = 'fichas';
var amQuery = '';
var amTipo = 'todas';
var amNivel = 'todos';
var amEditId = null;

var NIVEL_COLOR = { 'crítico': '#e35d5d', 'alto': '#e8a04c', 'medio': '#e8c56a' };
var TIPO_ICO = { 'extractiva': '🏭', 'natural': '🌊', 'urbana': '🏘️' };

/* ---------- calendario ---------- */
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
function llevarAlCalendario(nombre, detalle, fechaVal, horaVal, conAviso) {
  var fecha = (fechaVal || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert('Elige una fecha válida.'); return; }
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : '10:00';
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[Amenaza] ' + nombre + (detalle ? ' · ' + detalle : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      var linea = '[Amenazas territorio] ' + texto + ' ' + hhmm;
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + linea : linea;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) {
      try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {}
    }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  save('📌 Agregado al calendario ✓');
  refrescarCal();
  try { render(); } catch (e2) {}
}

/* ---------- diálogo ---------- */
function ensureDialog() {
  var d = $('amenazasDialog');
  if (d) return d;
  d = document.createElement('dialog');
  d.id = 'amenazasDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">⚠️ Amenazas del territorio — Penco</h3>' +
    '<button type="button" id="amenazasCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Lo que hoy presiona a Penco: proyectos extractivos, riesgos naturales y presiones urbanas. Cada ficha trae <b>qué es, impacto, señales, qué hacer y dónde denunciar</b>. Tus seguimientos y reportes quedan <b>privados y locales</b>.</p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabAmFichas" class="btn btn-accent su-30e741">⚠️ Fichas</button>' +
    '<button type="button" id="tabAmSectores" class="btn su-30e741">🏘️ Por sector</button>' +
    '<button type="button" id="tabAmHacer" class="btn su-30e741">🤝 Qué hacer</button>' +
    '<button type="button" id="tabAmMios" class="btn su-30e741">⭐ Sigo y reporto</button>' +
    '</div>' +
    '<div id="amFichasPanel">' +
    '<div class="menstrual-card"><h4>🔍 Buscar y filtrar</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="amSearch" placeholder="ej: GNL, humedal, incendio, tsunami, basura..." maxlength="60" autocomplete="off"></label></div>' +
    '<div class="conv-row"><label>Tipo <select id="amTipo"><option value="todas">Todas</option><option value="extractiva">🏭 Extractiva</option><option value="natural">🌊 Natural</option><option value="urbana">🏘️ Urbana</option></select></label>' +
    '<label>Nivel <select id="amNivel"><option value="todos">Todos</option><option value="crítico">Crítico</option><option value="alto">Alto</option><option value="medio">Medio</option></select></label></div>' +
    '<p class="muted su-954796" id="amCount"></p></div>' +
    '<div id="amList" class="su-d2c171"></div>' +
    '<p class="muted su-a953a7" id="amNota"></p></div>' +
    '<div id="amSectoresPanel" class="hidden"></div>' +
    '<div id="amHacerPanel" class="hidden"></div>' +
    '<div id="amMiosPanel" class="hidden">' +
    '<div class="menstrual-card su-51d56a"><h4>➕ Reportar lo que veo (privado)</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Amenaza * <select id="amRepAmenaza"></select></label>' +
    '<label>Sector * <select id="amRepSector"></select></label></div>' +
    '<div class="conv-row"><label>Fecha * <input type="date" id="amRepFecha"></label>' +
    '<label>Lugar exacto <input type="text" id="amRepLugar" placeholder="ej: quebrada tras Villa Montahue" maxlength="60"></label></div>' +
    '<label>¿Qué viste? * <textarea id="amRepTexto" rows="3" placeholder="Camiones botando escombro a las 18h, 3 viajes. Foto guardada en mi galería..." maxlength="500"></textarea></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="amRepAdd" class="btn btn-accent su-30e741">+ Guardar reporte</button>' +
    '<button type="button" id="amRepCancel" class="btn hidden su-30e741">Cancelar</button></div>' +
    '<p class="muted su-0d5be0">Queda solo en tu dispositivo. Para denunciar formal usa SMA / *4157 / OIRS con foto + fecha + ubicación.</p></div>' +
    '<div id="amMiosList" class="su-d2c171"></div></div>' +
    '<div class="dlg-actions"><button type="button" id="amenazasClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}

function amenazaPorId(id) {
  var arr = dynAmenazas().amenazas || [];
  for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
  return null;
}
function nivelChip(n) {
  var c = NIVEL_COLOR[n] || '#9aa3c7';
  return '<span class="chip" style="background:' + c + ';color:#10142c">' + esc(n) + '</span>';
}
function estadoChip(e) {
  return '<span class="chip su-0d5be0">' + (e === 'activo' ? '🔴 activo' : '🟡 latente') + '</span>';
}

var GUARDIAN_NOMBRE = {
  'konintu-lafkenmapu': 'Asociación Indígena Koñintu Lafken Mapu',
  'parque-para-penco': 'Corporación Parque para Penco',
  'corredor-biocultural-tome-lirquen': 'Corredor Biocultural Lirquén - Tomé',
  'keule-resiste': 'Keule Resiste',
  'penco-lirquen-libre-mineras': 'Campaña Penco-Lirquén Libre de Mineras',
  'ong-defensa-ambiental': 'ONG Defensa Ambiental / Red de Humedales',
  'fundacion-bandada': 'Fundación Bandada',
  'olca': 'OLCA'
};
function guardNombre(id) {
  try {
    if (window.ActoresTerritorio && typeof window.ActoresTerritorio.list === 'function') {
      var arr = (window.ActoresTerritorio.list().actores || []);
      for (var i = 0; i < arr.length; i++) if (arr[i].id === id && arr[i].nombre) return arr[i].nombre;
    }
  } catch (e) {}
  return GUARDIAN_NOMBRE[id] || id;
}

function fichaCard(a) {
  var st = store();
  var sig = !!st.sigo[a.id];
  var guardianes = (a.guardianes || []).length
    ? '<p class="muted su-a6c665">🛡️ <b>Quiénes defienden:</b> ' + a.guardianes.map(function (g) { return esc(guardNombre(g)); }).join(' · ') + ' <button type="button" class="btn su-337714" data-am-guard="1">ver en Guardianes</button></p>'
    : '';
  var html = '<div class="si-card su-2285bd"><h4 class="su-5e0faa">' + esc(a.icono || '⚠️') + ' ' + esc(a.nombre) + '</h4>' +
    '<div class="su-93b961">' + nivelChip(a.nivel) + ' ' + estadoChip(a.estado) + ' <span class="chip su-0d5be0">' + esc(TIPO_ICO[a.tipo] || '') + ' ' + esc(a.tipo || '') + '</span></div>' +
    '<p class="muted su-541e41">📍 ' + esc(a.zona || '') + '</p>' +
    '<p class="su-afb724">' + esc(a.queEs || '') + '</p>' +
    '<details class="menstrual-details"><summary>💥 Impacto y señales</summary>' +
    ((a.impacto && a.impacto.length) ? '<ul class="su-a34d74">' + a.impacto.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
    ((a.senales && a.senales.length) ? '<p class="muted su-11a508"><b>👁️ Señales:</b></p><ul class="su-a34d74">' + a.senales.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
    '</details>' +
    '<details class="menstrual-details"><summary>✅ Qué hacer</summary>' +
    ((a.queHacer && a.queHacer.length) ? '<ul class="su-a34d74">' + a.queHacer.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
    (a.donde ? '<p class="muted su-11a508">📞 <b>Denuncia / infórmate:</b> ' + esc(a.donde) + '</p>' : '') +
    '</details>' +
    guardianes +
    (a.fuente ? '<p class="muted su-0d5be0">📰 ' + esc(a.fuente) + (a.fuenteUrl ? ' · <a href="' + esc(a.fuenteUrl) + '" target="_blank" rel="noopener">ver fuente</a>' : '') + '</p>' : '') +
    '<div class="su-c158a9">' +
    '<button type="button" class="btn su-337714" data-am-sigo="' + esc(a.id) + '">' + (sig ? '★ Me preocupa' : '☆ Me preocupa') + '</button>' +
    '<button type="button" class="btn su-337714" data-am-cal="' + esc(a.id) + '">📌 Al calendario</button>' +
    '<button type="button" class="btn su-337714" data-am-share="' + esc(a.id) + '">📤 Compartir</button>' +
    '<button type="button" class="btn su-337714" data-am-rep="' + esc(a.id) + '">👁️ Reportar</button>' +
    '</div>' +
    '<div class="conv-row su-7c1cbb" data-am-calrow="' + esc(a.id) + '" hidden>' +
    '<label>Fecha <input type="date" data-am-fecha="' + esc(a.id) + '" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" data-am-hora="' + esc(a.id) + '" value="10:00" class="su-91245b"></label>' +
    '<label class="check-row su-988f60"><input type="checkbox" data-am-aviso="' + esc(a.id) + '"> 🔔</label>' +
    '<button type="button" class="btn btn-accent su-30e741" data-am-add="' + esc(a.id) + '">📌 Guardar</button></div>' +
    '</div>';
  return html;
}

function matchFiltros(a) {
  var q = (amQuery || '').toLowerCase().trim();
  if (amTipo !== 'todas' && a.tipo !== amTipo) return false;
  if (amNivel !== 'todos' && a.nivel !== amNivel) return false;
  if (!q) return true;
  var t = ((a.nombre || '') + ' ' + (a.queEs || '') + ' ' + (a.zona || '') + ' ' + ((a.impacto || []).join(' ')) + ' ' + ((a.senales || []).join(' '))).toLowerCase();
  return t.indexOf(q) >= 0;
}

function renderFichas() {
  var box = $('amList');
  if (!box) return;
  var data = (dynAmenazas().amenazas || []).filter(matchFiltros);
  var total = (dynAmenazas().amenazas || []).length;
  var ct = $('amCount');
  if (ct) ct.textContent = data.length + ' / ' + total + ' amenazas' + (amTipo !== 'todas' ? ' · ' + amTipo : '') + (amNivel !== 'todos' ? ' · nivel ' + amNivel : '');
  box.innerHTML = data.length ? data.map(fichaCard).join('') : '<p class="muted">Sin resultados. Prueba “humedal”, “GNL”, “incendio”, “tsunami”... o mira Por sector.</p>';
  var nt = $('amNota');
  if (nt) { var d = dynAmenazas(); nt.textContent = (d.nota || '') + (d.actualizado ? ' · Actualizado ' + d.actualizado + '.' : ''); }
  wireCards(box);
}

function renderSectores() {
  var box = $('amSectoresPanel');
  if (!box) return;
  var data = dynAmenazas().amenazas || [];
  var porSector = {};
  data.forEach(function (a) {
    (a.sectores || []).forEach(function (s) {
      if (!porSector[s]) porSector[s] = [];
      porSector[s].push(a);
    });
  });
  var ids = Object.keys(SECTOR_NOMBRE);
  var html = '<p class="muted su-b6db47">Cada barrio convive con amenazas distintas. <b>Toca tu sector</b> para ver qué lo golpea y qué hacer. Cruce con la Guía de Penco (🏘️ Sectores).</p>';
  html += ids.map(function (sid) {
    var list = porSector[sid] || [];
    var crit = list.filter(function (a) { return a.nivel === 'crítico'; }).length;
    return '<details class="menstrual-details"' + (crit ? ' open' : '') + '><summary>' + esc(SECTOR_NOMBRE[sid]) + ' <span class="muted">· ' + list.length + ' amenaza(s)' + (crit ? ' · 🔴 ' + crit + ' crítica(s)' : '') + '</span></summary>' +
      (list.length ? list.map(function (a) {
        return '<div class="hora-item"><span class="su-6cb285"><b>' + esc(a.icono + ' ' + a.nombre) + '</b><br><span class="muted su-0d5be0">' + esc(a.nivel) + ' · ' + esc(a.estado) + ' · ' + esc(a.tipo) + '</span></span>' +
          '<span class="su-74cac9"><button type="button" class="btn btn-icon" data-am-goto="' + esc(a.id) + '" title="Ver ficha">👁️</button></span></div>';
      }).join('') : '<p class="muted">Sin amenaza fichada aquí. Si ves una, repórtala en ⭐.</p>') +
      '</details>';
  }).join('');
  html += '<p class="muted su-a953a7">¿No sabes tu sector? Míralo en 🎉 Penco → 📖 Guía → 🏘️ Sectores.</p>';
  box.innerHTML = html;
  box.querySelectorAll('[data-am-goto]').forEach(function (b) {
    b.onclick = function () { switchTab('fichas'); var id = b.getAttribute('data-am-goto'); setTimeout(function () { try { var el = document.querySelector('[data-am-sigo="' + id + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }, 60); };
  });
}

function renderHacer() {
  var box = $('amHacerPanel');
  if (!box) return;
  var d = dynAmenazas();
  var html = '<div class="menstrual-card su-68a1a9"><h4>🤝 Dónde denunciar e informarse</h4>' +
    (d.denuncias || []).map(function (x) {
      return '<div class="habit-item su-13313b"><span><b>' + esc(x.nombre) + '</b><br><span class="su-11a508"><b>' + esc(x.dato) + '</b></span><br><span class="muted su-11a508">' + esc(x.nota || '') + '</span></span>' +
        '<button type="button" class="btn su-30e741" data-am-tel="' + esc(x.dato) + '" title="Copiar">📋</button></div>';
    }).join('') + '</div>';
  html += '<div class="menstrual-card"><h4>🛡️ Prevención en casa y barrio</h4><ul class="su-a34d74">' +
    (d.prevencion || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
    '<div class="dlg-actions su-8a0a91"><button type="button" id="amGoApoyo" class="btn su-337714">🆘 Abrir Apoyo en emergencias</button>' +
    '<button type="button" id="amGoGuardianes" class="btn su-337714">🛡️ Ver Guardianes</button></div></div>';
  html += '<p class="muted su-a953a7">' + esc(d.fuentes || '') + '</p>';
  box.innerHTML = html;
  box.querySelectorAll('[data-am-tel]').forEach(function (b) {
    b.onclick = function () {
      var n = b.getAttribute('data-am-tel');
      try { if (navigator.clipboard) navigator.clipboard.writeText(n).then(function () { save('Copiado ✓'); }); } catch (e) {}
    };
  });
  var ga = $('amGoApoyo');
  if (ga) ga.onclick = function () { try { if (window.ApoyoPenco && typeof window.ApoyoPenco.open === 'function') window.ApoyoPenco.open(); } catch (e) {} };
  var gg = $('amGoGuardianes');
  if (gg) gg.onclick = function () { try { if (window.ActoresTerritorio && typeof window.ActoresTerritorio.open === 'function') window.ActoresTerritorio.open(); } catch (e) {} };
}

function fillRepSelects() {
  var sa = $('amRepAmenaza'), ss = $('amRepSector');
  if (sa) {
    var cur = sa.value;
    sa.innerHTML = (dynAmenazas().amenazas || []).map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.icono + ' ' + a.nombre) + '</option>'; }).join('');
    if (cur) sa.value = cur;
  }
  if (ss) {
    var cur2 = ss.value;
    ss.innerHTML = Object.keys(SECTOR_NOMBRE).map(function (k) { return '<option value="' + k + '">' + esc(SECTOR_NOMBRE[k]) + '</option>'; }).join('');
    if (cur2) ss.value = cur2;
  }
  var f = $('amRepFecha');
  if (f && !f.value) f.value = todayKey();
}

function renderMios() {
  var box = $('amMiosList');
  if (!box) return;
  fillRepSelects();
  var st = store();
  var data = dynAmenazas().amenazas || [];
  var seguidas = data.filter(function (a) { return st.sigo[a.id]; });
  var html = '<div class="menstrual-card"><h4>⭐ Me preocupan · ' + seguidas.length + '</h4>';
  html += seguidas.length ? seguidas.map(function (a) {
    return '<div class="hora-item"><span class="su-6cb285"><b>' + esc(a.icono + ' ' + a.nombre) + '</b><br><span class="muted su-0d5be0">' + esc(a.nivel) + ' · ' + esc(a.estado) + '</span></span>' +
      '<span class="su-74cac9"><button type="button" class="btn btn-icon" data-am-cal2="' + esc(a.id) + '" title="Al calendario">📌</button>' +
      '<button type="button" class="btn btn-icon" data-am-unsigo="' + esc(a.id) + '" title="Dejar de seguir">✕</button></span></div>';
  }).join('') : '<p class="muted su-11a508">Marca ☆ Me preocupa en las fichas para seguir una amenaza de cerca.</p>';
  html += '</div>';
  var reps = st.reportes.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  html += '<div class="menstrual-card su-d2c171"><h4>👁️ Mis reportes · ' + reps.length + '</h4>';
  html += reps.length ? reps.map(function (r) {
    var a = amenazaPorId(r.amenaza);
    return '<div class="si-card su-bd0a4f"><h4 class="su-6cb285">👁️ ' + esc(r.lugar || (a ? a.nombre : r.amenaza)) + '</h4>' +
      '<p class="muted su-0d5be0">' + esc(a ? (a.icono + ' ' + a.nombre) : r.amenaza) + ' · ' + esc(SECTOR_NOMBRE[r.sector] || r.sector || '') + ' · 📅 ' + esc(r.fecha || '') + '</p>' +
      '<p class="su-4dbc08">' + esc(r.texto || '') + '</p>' +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn su-337714" data-am-repcal="' + esc(r.id) + '">📌 Calendario</button>' +
      '<button type="button" class="btn su-337714" data-am-repshare="' + esc(r.id) + '">📤 Compartir</button>' +
      '<button type="button" class="btn su-337714" data-am-repedit="' + esc(r.id) + '">✏️ Editar</button>' +
      '<button type="button" class="btn su-fd834a" data-am-repdel="' + esc(r.id) + '">✕ Borrar</button></div></div>';
  }).join('') : '<p class="muted su-11a508">Aún no reportas. Arriba guarda lo que veas: camiones, faenas, humo, rellenos, vertidos. Con fecha y lugar exacto vale oro.</p>';
  html += '</div>';
  box.innerHTML = html;
  wireMios(box);
}

function wireCards(scope) {
  (scope || document).querySelectorAll('[data-am-sigo]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-am-sigo');
      var st = store();
      if (st.sigo[id]) delete st.sigo[id]; else st.sigo[id] = todayKey();
      save(st.sigo[id] ? '⭐ Te preocupa (seguida)' : 'Ya no la sigues');
      renderFichas(); renderMios();
    };
  });
  (scope || document).querySelectorAll('[data-am-guard]').forEach(function (b) {
    b.onclick = function () {
      try { if (window.ActoresTerritorio && typeof window.ActoresTerritorio.open === 'function') window.ActoresTerritorio.open(); else alert('Abre 🛡️ Guardianxs del territorio'); } catch (e) {}
    };
  });
  (scope || document).querySelectorAll('[data-am-share]').forEach(function (b) {
    b.onclick = async function () {
      var a = amenazaPorId(b.getAttribute('data-am-share'));
      if (!a) return;
      await share('⚠️ ' + a.nombre + ' — Penco',
        a.nombre + ' (' + (a.nivel || '') + ' · ' + (a.estado || '') + ')\n📍 ' + (a.zona || '') + '\n' + (a.queEs || '') +
        '\n\n✅ Qué hacer:\n• ' + ((a.queHacer || []).join('\n• ')) +
        '\n\n📞 ' + (a.donde || '') + (a.fuenteUrl ? '\n📰 ' + a.fuenteUrl : ''));
    };
  });
  (scope || document).querySelectorAll('[data-am-cal]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-am-cal');
      var row = document.querySelector('[data-am-calrow="' + id + '"]');
      if (row) row.hidden = !row.hidden;
    };
  });
  (scope || document).querySelectorAll('[data-am-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-am-add');
      var a = amenazaPorId(id);
      if (!a) return;
      var f = (document.querySelector('[data-am-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (document.querySelector('[data-am-hora="' + id + '"]') || {}).value || '10:00';
      var av = !!(document.querySelector('[data-am-aviso="' + id + '"]') || {}).checked;
      llevarAlCalendario(a.nombre + ' — vigilar', a.zona || '', f, h, av);
    };
  });
  (scope || document).querySelectorAll('[data-am-rep]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-am-rep');
      switchTab('mios');
      setTimeout(function () {
        var sa = $('amRepAmenaza');
        if (sa) sa.value = id;
        try { $('amRepTexto').focus(); } catch (e) {}
      }, 60);
    };
  });
}

function wireMios(scope) {
  (scope || document).querySelectorAll('[data-am-unsigo]').forEach(function (b) {
    b.onclick = function () {
      var st = store(); delete st.sigo[b.getAttribute('data-am-unsigo')];
      save(); renderFichas(); renderMios();
    };
  });
  (scope || document).querySelectorAll('[data-am-cal2]').forEach(function (b) {
    b.onclick = function () {
      var a = amenazaPorId(b.getAttribute('data-am-cal2'));
      if (!a) return;
      llevarAlCalendario(a.nombre + ' — vigilar', a.zona || '', todayKey(), '10:00', false);
    };
  });
  (scope || document).querySelectorAll('[data-am-repdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este reporte?')) return;
      var st = store();
      st.reportes = st.reportes.filter(function (x) { return x.id !== b.getAttribute('data-am-repdel'); });
      save('Reporte borrado'); renderMios();
    };
  });
  (scope || document).querySelectorAll('[data-am-repedit]').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      var r = st.reportes.filter(function (x) { return x.id === b.getAttribute('data-am-repedit'); })[0];
      if (!r) return;
      amEditId = r.id;
      $('amRepAmenaza').value = r.amenaza; $('amRepSector').value = r.sector;
      $('amRepFecha').value = r.fecha || todayKey(); $('amRepLugar').value = r.lugar || '';
      $('amRepTexto').value = r.texto || '';
      $('amRepAdd').textContent = '↻ Actualizar reporte';
      $('amRepCancel').classList.remove('hidden');
      try { $('amRepAmenaza').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    };
  });
  (scope || document).querySelectorAll('[data-am-repshare]').forEach(function (b) {
    b.onclick = async function () {
      var st = store();
      var r = st.reportes.filter(function (x) { return x.id === b.getAttribute('data-am-repshare'); })[0];
      if (!r) return;
      var a = amenazaPorId(r.amenaza);
      await share('👁️ Reporte — ' + (a ? a.nombre : r.amenaza), '👁️ ' + (a ? a.nombre : r.amenaza) + ' · ' + (r.fecha || '') + '\n📍 ' + (SECTOR_NOMBRE[r.sector] || r.sector || '') + (r.lugar ? ' · ' + r.lugar : '') + '\n' + (r.texto || ''));
    };
  });
  (scope || document).querySelectorAll('[data-am-repcal]').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      var r = st.reportes.filter(function (x) { return x.id === b.getAttribute('data-am-repcal'); })[0];
      if (!r) return;
      var a = amenazaPorId(r.amenaza);
      llevarAlCalendario('Reporte: ' + (a ? a.nombre : r.amenaza), (r.lugar || '') + ' ' + (r.texto || ''), r.fecha || todayKey(), '10:00', false);
    };
  });
}

function switchTab(t) {
  amTab = t;
  var pf = $('amFichasPanel'), ps = $('amSectoresPanel'), ph = $('amHacerPanel'), pm = $('amMiosPanel');
  var bf = $('tabAmFichas'), bs = $('tabAmSectores'), bh = $('tabAmHacer'), bm = $('tabAmMios');
  if (pf) pf.classList.toggle('hidden', t !== 'fichas');
  if (ps) ps.classList.toggle('hidden', t !== 'sectores');
  if (ph) ph.classList.toggle('hidden', t !== 'hacer');
  if (pm) pm.classList.toggle('hidden', t !== 'mios');
  if (bf) bf.classList.toggle('btn-accent', t === 'fichas');
  if (bs) bs.classList.toggle('btn-accent', t === 'sectores');
  if (bh) bh.classList.toggle('btn-accent', t === 'hacer');
  if (bm) bm.classList.toggle('btn-accent', t === 'mios');
  if (t === 'fichas') renderFichas();
  else if (t === 'sectores') renderSectores();
  else if (t === 'hacer') renderHacer();
  else renderMios();
}

function render() {
  ensureDialog();
  switchTab(amTab || 'fichas');
  renderMios();
}

function open() {
  ensureDialog();
  wireOnce();
  fillRepSelects();
  renderFichas(); renderSectores(); renderHacer(); renderMios();
  switchTab(amTab || 'fichas');
  var d = $('amenazasDialog');
  try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
}

var _wired = false;
function wireOnce() {
  if (_wired) return; _wired = true;
  var bf = $('tabAmFichas'), bs = $('tabAmSectores'), bh = $('tabAmHacer'), bm = $('tabAmMios');
  if (bf) bf.onclick = function () { switchTab('fichas'); };
  if (bs) bs.onclick = function () { switchTab('sectores'); };
  if (bh) bh.onclick = function () { switchTab('hacer'); };
  if (bm) bm.onclick = function () { switchTab('mios'); };
  var ct = $('amenazasCloseTop'), cb = $('amenazasClose');
  if (ct) ct.onclick = function () { try { $('amenazasDialog').close(); } catch (e) {} };
  if (cb) cb.onclick = function () { try { $('amenazasDialog').close(); } catch (e) {} };
  var q = $('amSearch');
  if (q) q.addEventListener('input', function () { amQuery = q.value; renderFichas(); });
  var ft = $('amTipo');
  if (ft) ft.onchange = function () { amTipo = ft.value; renderFichas(); };
  var fn = $('amNivel');
  if (fn) fn.onchange = function () { amNivel = fn.value; renderFichas(); };
  var add = $('amRepAdd');
  if (add) add.onclick = function () {
    var am = ($('amRepAmenaza') || {}).value;
    var txt = clean((($('amRepTexto') || {}).value || '').trim(), 500);
    if (!am) { alert('Elige la amenaza'); return; }
    if (!txt) { alert('Cuenta qué viste (aunque sean 2 líneas)'); return; }
    var st = store();
    if (amEditId) {
      var r = st.reportes.filter(function (x) { return x.id === amEditId; })[0];
      if (r) {
        r.amenaza = am; r.sector = ($('amRepSector') || {}).value || '';
        r.fecha = ($('amRepFecha') || {}).value || todayKey();
        r.lugar = clean((($('amRepLugar') || {}).value || '').trim(), 60);
        r.texto = txt;
      }
      amEditId = null;
      $('amRepAdd').textContent = '+ Guardar reporte';
      $('amRepCancel').classList.add('hidden');
      save('Reporte actualizado 👁️');
    } else {
      st.reportes.push({
        id: uid('amr'), amenaza: am, sector: ($('amRepSector') || {}).value || '',
        fecha: ($('amRepFecha') || {}).value || todayKey(),
        lugar: clean((($('amRepLugar') || {}).value || '').trim(), 60), texto: txt
      });
      save('Reporte guardado 👁️');
    }
    $('amRepLugar').value = ''; $('amRepTexto').value = '';
    renderMios();
  };
  var cancel = $('amRepCancel');
  if (cancel) cancel.onclick = function () {
    amEditId = null; cancel.classList.add('hidden');
    $('amRepAdd').textContent = '+ Guardar reporte';
    $('amRepLugar').value = ''; $('amRepTexto').value = '';
  };
}

/* ---------- integración Comuna y servicios ---------- */
function ensureButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g) return false;
  var b = $('btnAmenazas');
  if (!b) {
    b = document.createElement('button');
    b.id = 'btnAmenazas';
    b.className = 'btn';
    b.type = 'button';
    b.setAttribute('data-sub', 'penco');
    b.setAttribute('data-keywords', 'amenaza amenazas riesgo territorio gnl minera tierras raras incendio tsunami maremoto humedal relleno contaminacion bahia forestal agua inmobiliaria basura marejada inundacion denuncia sma sea senapred conaf reporte riesgo sector vigilancia defensa');
    b.textContent = '⚠️ Amenazas';
    var ref = $('btnActores');
    if (ref && ref.parentNode === g) {
      if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
      else g.appendChild(b);
    } else g.appendChild(b);
  } else {
    try { b.setAttribute('data-sub', 'penco'); b.dataset.sub = 'penco'; } catch (e) {}
  }
  if (!b.dataset.amW) { b.dataset.amW = '1'; b.addEventListener('click', open); }
  return true;
}
function ensureCheckbox() {
  if (document.querySelector('[data-btn="btnAmenazas"]')) return;
  var ref = document.querySelector('[data-btn="btnActores"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnAmenazas" checked> ⚠️ Amenazas';
    try {
      ref.closest('label').parentNode.insertBefore(lab, ref.closest('label').nextSibling);
      if (typeof applyVisibility === 'function') {
        var inp = lab.querySelector('input');
        if (inp) inp.addEventListener('change', function () { try { applyVisibility(); } catch (e) {} });
      }
    } catch (e) {}
  }
}
function register() {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnAmenazas') < 0) ALL_BTNS.push('btnAmenazas'); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnAmenazas = ['territorio', 'penco']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      var k = 'territorio|penco';
      if (!BTN_ORDER[k]) BTN_ORDER[k] = ['btnComuna'];
      if (BTN_ORDER[k].indexOf('btnAmenazas') < 0) BTN_ORDER[k].push('btnAmenazas');
    }
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnAmenazas') < 0) ORDEN_TERRITORIO.push('btnAmenazas');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (!PRESETS[p] || typeof PRESETS[p] !== 'object') return;
        if (PRESETS[p].btnComuna && PRESETS[p].btnAmenazas === undefined) PRESETS[p].btnAmenazas = true;
      });
    }
  } catch (e) {}
}

var _retry = 0;
function setup() {
  var okBtn = ensureButton();
  if (!okBtn || typeof userData !== 'function') {
    _retry++;
    if (_retry < 80) setTimeout(setup, 500);
    return;
  }
  ensureDialog();
  ensureCheckbox();
  register();
  wireOnce();
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

window.AmenazasTerritorio = { open: open, tab: switchTab, render: render, list: function () { return dynAmenazas(); }, store: store };
try {
  Object.defineProperty(window.AmenazasTerritorio, 'data', { get: dynAmenazas });
} catch (e) { window.AmenazasTerritorio.data = AMENAZAS_FALLBACK; }
try { document.addEventListener('territorio:listo', function () { try { renderFichas(); renderSectores(); renderHacer(); renderMios(); } catch (e) {} }); } catch (e2) {}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(setup, 1800);

})();
