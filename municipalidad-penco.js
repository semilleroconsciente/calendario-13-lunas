/* ============================================================
   MUNICIPALIDAD DE PENCO — Calendario 13 Lunas
   Apartado: Territorio > 🏛️ Municipalidad (botón propio al lado
     de 🎉 Penco: btnMuni -> muniDialog -> muniPanel).
   - Sede, autoridades, direcciones y unidades, trámites con
     requisitos, salud/educación municipal, emergencias,
     historia de la municipalidad y participación.
   - Cada trámite tiene "📌 Calendario": crea un compromiso 🕐
     en el día elegido (con hora y 🔔 opcional), y "☑️ Hecho"
     para tu checklist personal.
   - "⭐ Mis trámites": checklist + notas + trámites propios.
   Todo local y privado por usuario: userData().muniPenco
     { hechos:{}, notas:{}, mios:[], avisos:[] }
   Fuente preferida: data/territorios/<id>/municipalidad.json
   vía window.Territorio (ver territorio.js). Fallback: datos
   embebidos abajo (Penco, fuentes penco.cl 2026-09).
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
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') { renderCurrentView(); return; } } catch (e) {}
  try { if (typeof renderLuna === 'function') renderLuna(); } catch (e2) {}
}

/* ---------- DATOS EMBEBIDOS (fallback Penco) ---------- */
var MUNI_PENCO = {
  sede: {
    nombre: 'Ilustre Municipalidad de Penco',
    rut: '69.150.500-6',
    direccion: "O'Higgins 500, Penco",
    fono: '+56 41 226 1471',
    oirs: 'oirs@penco.cl',
    web: 'https://penco.cl',
    horario: 'Lun a Vie 08:30 a 14:00 hrs atención público (verificar en penco.cl)',
    nota: 'Desde celular o red fija a anexos: marcar 41-226 + anexo. OIRS anexo 1346.'
  },
  autoridades: {
    alcalde: { nombre: 'Rodrigo Vera Riquelme', periodo: '2024–2028', correo: 'alcaldia@penco.cl', oficina: "O'Higgins 500 · anexo 1452" },
    concejo: [
      { nombre: 'Héctor Peñailillo Núñez', pacto: 'IND (UDI)' },
      { nombre: 'Leonardo Jara Jara', pacto: 'FREVS' },
      { nombre: 'María Carolina Inostroza Verdugo', pacto: 'PDC' },
      { nombre: 'Juan Manuel Viveros Esparza', pacto: 'UDI' },
      { nombre: 'Fernando Torres Rubio', pacto: 'IND – PSC' },
      { nombre: 'Leslie Valenzuela Muñoz', pacto: 'UDI' }
    ],
    notaConcejo: 'Concejo 2024–2028. Sesiones ordinarias abiertas; actas y sesiones en penco.cl > Municipalidad > Concejo Municipal.'
  },
  direcciones: [
    { id: 'alcaldia', icon: '🏛️', nombre: 'Alcaldía', director: 'Rodrigo Vera Riquelme', contacto: 'alcaldia@penco.cl · 41-2261452', direccion: "O'Higgins 500", funcion: 'Dirección superior y administración comunal. Preside el Concejo.', unidades: ['Gabinete (41-2261447)', 'Delegación Municipal Lirquén — Susana Villa (41-2261550)', 'Comunicaciones (41-2261447)'] },
    { id: 'adm-municipal', icon: '🗂️', nombre: 'Administración Municipal', director: 'Neil Palma Cartes', contacto: '41-2261455', direccion: "O'Higgins 500", funcion: 'Coordina y gestiona todas las unidades municipales por delegación del Alcalde.', unidades: ['Informática (41-2261428)', 'Alumbrado Público (41-2261428)', 'Mantenimiento', 'Consultorio Veterinario (+56 9 4401 1613)'] },
    { id: 'secretaria-municipal', icon: '📝', nombre: 'Secretaría Municipal', director: 'Pablo Sobarzo Osorio', contacto: '41-2261456', direccion: "O'Higgins 500", funcion: 'Ministro de fe, Concejo, JJVV y organizaciones (Ley 19.418 / 20.500).', unidades: ['Oficina de Partes y OIRS — Carolina Lagos (41-2261430 / 41-2261423 · oirs@penco.cl)'] },
    { id: 'dideco', icon: '🤝', nombre: 'DIDECO — Desarrollo Comunitario', director: 'Bernardino Parizot Riveros', contacto: '41-2261432', direccion: "O'Higgins 500", funcion: 'Apoyo social, organizaciones, empleo, cultura, deporte y familia.', unidades: ['Área Social', 'Registro Social de Hogares (41-2261413)', 'OMIL (41-2261347)', 'Fomento Productivo (41-2261408)', 'Casa Adulto Mayor y OOCC (41-2261522)', 'Discapacidad (41-2261537)', 'Mujer / Jefas de Hogar (41-2261472)', 'Deportes (41-2261402)', 'Cultura', 'Turismo (41-2261529)', 'Biblioteca', 'Museo', 'Protección Civil (41-2261305)', 'SENDA Previene (41-2261520)', 'EGIS Municipal (41-2261536)'] },
    { id: 'obras', icon: '🏗️', nombre: 'Obras Municipales (DOM)', director: 'Pablo Aguayo Herane', contacto: '41-2261437', direccion: "O'Higgins 500", funcion: 'Permisos de edificación, urbanización, recepciones y Plan Regulador.', unidades: ['Edificación y permisos', 'Inspección de obras', 'Catastro y Plan Regulador'] },
    { id: 'secplan', icon: '📐', nombre: 'SECPLAN — Planificación', director: 'Romina Pampaloni Pedreros', contacto: '41-2261418', direccion: 'Maipú 209', funcion: 'Estrategia comunal, PLADECO, presupuesto y proyectos de inversión.', unidades: ['Formulación de proyectos', 'Licitaciones y concursos públicos'] },
    { id: 'transito', icon: '🚗', nombre: 'Tránsito y Transporte Público', director: 'Nicolás Espinosa (s)', contacto: '41-2261326', direccion: 'Freire 510', funcion: 'Licencias de conducir, permisos de circulación, señalización.', unidades: ['Licencias (41-2261324)', 'Permisos Circulación (41-2261328)'] },
    { id: 'medioambiente', icon: '🌱', nombre: 'Medio Ambiente, Aseo y Ornato', director: 'Camila Riquelme (s)', contacto: '41-2261301', direccion: 'Talcahuano 131', funcion: 'Aseo, recolección, áreas verdes, reciclaje y tolvas comunitarias.', unidades: ['Recolección domiciliaria', 'Reciclaje y puntos limpios', 'Tolvas comunitarias'] },
    { id: 'finanzas', icon: '💰', nombre: 'Administración y Finanzas', director: 'Sergio Valenzuela (s)', contacto: '41-2261464', direccion: "O'Higgins 500", funcion: 'Tesorería, rentas, patentes, contabilidad y personal.', unidades: ['Tesorería (41-2261424)', 'Contabilidad (41-2261465)', 'Adquisiciones (41-2261468)', 'RRHH (41-2261451)', 'Patentes Comerciales', 'Inspección Municipal (41-2261477)'] },
    { id: 'juridica', icon: '⚖️', nombre: 'Dirección Jurídica', director: 'Winston Carrasco', contacto: '41-2261342', direccion: "O'Higgins 500", funcion: 'Asesoría legal al Alcalde, Concejo y unidades.', unidades: [] },
    { id: 'control', icon: '🔍', nombre: 'Dirección de Control', director: 'Valentina Escalona Rivas', contacto: '41-2261341', direccion: 'Maipú 209', funcion: 'Auditoría interna y control presupuestario. Transparencia activa.', unidades: ['Portal Transparencia (MU210)', 'Ley de Lobby (MU210)'] },
    { id: 'seguridad', icon: '🛡️', nombre: 'Seguridad Pública', director: 'Matías Aguayo', contacto: '*4157 · 41-2261362', direccion: 'Penco–Lirquén', funcion: 'Prevención, patrullaje e inspección con Carabineros.', unidades: ['Inspección Municipal (41-2261477)'] },
    { id: 'jpl', icon: '👩‍⚖️', nombre: 'Juzgado de Policía Local', director: 'Sergio Muñoz Cartes', contacto: '41-2261320', direccion: "O'Higgins 654", funcion: 'Tránsito, ordenanzas, rentas, alcoholes y consumidor.', unidades: [] },
    { id: 'salud', icon: '🏥', nombre: 'Salud Municipal (DAS)', director: 'Gerald Puchi Bizama', contacto: '41-2261359 · oirs@saludpenco.cl', direccion: "O'Higgins 654", funcion: 'Administra CESFAM, CECOSF y farmacia. Ver pestaña Salud.', unidades: ['CESFAM Penco — Maipú 573 (41-2723960)', 'CESFAM Lirquén — Ruta 150 s/n (41-2688321)', 'CECOSF Ríos de Chile', 'CECOSF Forjadores (41-2726262)', 'Hospital Penco-Lirquén (41-2724800)'] },
    { id: 'educacion', icon: '📚', nombre: 'Educación Municipal (DEM)', director: 'Andrea Navarrete (s)', contacto: '41-2261308 · educapenco.cl', direccion: 'Los Carrera 230', funcion: 'Escuelas y liceos municipales, preuniversitario y becas.', unidades: ['Liceo Pencopolitano — San Vicente 51', 'Escuela Los Conquistadores', 'Preuniversitario Municipal', 'Becas ESUP'] }
  ],
  tramites: [
    { id: 'permiso-circulacion', icon: '🚗', nombre: 'Permiso de circulación', donde: 'Tránsito · Freire 510 / pagos online penco.cl', cuando: 'Marzo (autos) · Mayo · Sept–Oct (carga)', requisitos: ['Permiso anterior', 'Revisión técnica y gases al día', 'SOAP vigente', 'Sin multas impagas'], costo: 'Según tasación SII', tip: 'Trasladar tu permiso a Penco deja recursos en la comuna.' },
    { id: 'licencia-conducir', icon: '🪪', nombre: 'Licencia de conducir', donde: 'Tránsito · Freire 510 · 41-2261324', cuando: 'Lun–Vie mañana. Pedir hora primero.', requisitos: ['Cédula vigente', 'Certificado estudios (primera vez)', 'Examen médico, teórico y práctico'], costo: 'Arancel municipal', tip: 'Lleva lentes si los usas y llega 15 min antes.' },
    { id: 'patente-comercial', icon: '🏪', nombre: 'Patente comercial / microempresa', donde: 'Finanzas · Patentes · O’Higgins 500', cuando: 'Todo el año. Pago semestral ene/jul.', requisitos: ['Inicio actividades SII', 'Informe DOM según giro', 'Resolución sanitaria (alimentos)'], costo: 'Según capital y giro', tip: 'Pregunta por Microempresa Familiar si trabajas en tu casa.' },
    { id: 'permiso-edificacion', icon: '🏗️', nombre: 'Permiso de edificación', donde: 'DOM · O’Higgins 500 · 41-2261437', cuando: 'Todo el año.', requisitos: ['Planos y EETT firmados', 'Certificado informaciones previas', 'Título dominio'], costo: 'Derechos según m²', tip: 'Pide primero el Certificado de Informaciones Previas.' },
    { id: 'rsh', icon: '📋', nombre: 'Registro Social de Hogares', donde: 'DIDECO · 41-2261413 / registrosocial.gob.cl', cuando: 'Todo el año.', requisitos: ['Cédula de integrantes', 'Comprobante domicilio', 'Clave Única'], costo: 'Gratuito', tip: 'Cartola al día abre becas y subsidios.' },
    { id: 'oirs-reclamo', icon: '📮', nombre: 'OIRS: reclamo o solicitud', donde: 'Oficina de Partes · oirs@penco.cl · 41-2261430', cuando: 'Lun–Vie 08:30–14:00.', requisitos: ['Nombre, RUT y contacto', 'Descripción clara + fotos', 'Dirección del hecho'], costo: 'Gratuito', tip: 'Pide número de folio para seguimiento.' },
    { id: 'omil-empleo', icon: '💼', nombre: 'OMIL — empleo', donde: 'DIDECO · OMIL · 41-2261347', cuando: 'Lun–Vie.', requisitos: ['CV actualizado', 'Cédula', 'Inscripción BNE'], costo: 'Gratuito', tip: 'Revisa ofertas cada lunes.' },
    { id: 'aseo-tolva', icon: '🧹', nombre: 'Aseo, tolvas y voluminosos', donde: 'Medio Ambiente · Talcahuano 131 · 41-2261301', cuando: 'Recolección semanal + tolvas por sector.', requisitos: ['Sacar basura en horario del sector', 'Voluminosos solo en operativo tolva'], costo: 'Incluido', tip: 'Lleva cachureos a la tolva, no a quebradas.' },
    { id: 'jjvv-personalidad', icon: '🏘️', nombre: 'JJVV: personalidad jurídica', donde: 'Secretaría Municipal · 41-2261456', cuando: 'Todo el año. FONDEVE 2º semestre.', requisitos: ['15+ socios, asamblea', 'Estatutos Ley 19.418', 'Ministro de fe'], costo: 'Gratuito', tip: 'Con personalidad vigente postulas a FONDEVE.' },
    { id: 'beca-superior', icon: '🎓', nombre: 'Beca Educación Superior', donde: 'DIDECO / DEM · penco.cl', cuando: 'Postulación anual 1er trimestre.', requisitos: ['Residencia en Penco', 'Matrícula ESUP', 'RSH y notas'], costo: 'Beneficio', tip: 'Junta tu certificado de matrícula apenas lo tengas.' },
    { id: 'farmacia-municipal', icon: '💊', nombre: 'Farmacia Municipal', donde: 'Red salud municipal · penco.cl', cuando: 'Lun–Vie horario salud.', requisitos: ['Receta vigente', 'Inscripción CESFAM'], costo: 'Precio costo', tip: 'Cotiza tus crónicos ahí.' },
    { id: 'veterinario', icon: '🐾', nombre: 'Veterinario Municipal', donde: '+56 9 4401 1613', cuando: 'Con hora. Operativos por junta.', requisitos: ['Residencia Penco'], costo: 'Bajo costo', tip: 'Esterilizar evita camadas y multas.' }
  ],
  salud: [
    { nombre: 'CESFAM Penco', dir: 'Maipú 573', fono: '41-2723960', horario: 'Lu–Ju 08:00–17:00 · Vi 08:00–16:00' },
    { nombre: 'CESFAM Lirquén', dir: 'Ruta 150 Camino a Tomé s/n', fono: '41-2688321', horario: 'Lu–Ju 08:00–17:00 · Vi 08:00–16:00 · Ext. hasta 20:00 · Sáb 08:00–14:00' },
    { nombre: 'CECOSF Ríos de Chile', dir: 'Lirquén', fono: 'DAS 41-2261359', horario: 'Lu–Ju 08:00–17:00 · Vi 08:00–16:00' },
    { nombre: 'CECOSF Forjadores', dir: 'Diego Portales 169', fono: '41-2726262', horario: 'Lu–Ju 08:00–17:00 · Vi 08:00–16:00' },
    { nombre: 'Hospital Penco-Lirquén', dir: 'Camino a Tomé', fono: '41-2724800', horario: 'Urgencia 24 h' },
    { nombre: 'Farmacia CESFAM Lirquén', dir: 'CESFAM Lirquén', fono: '41-2688321', horario: 'Lu–Vi 08:00–20:00 · Sáb 09:00–14:00' }
  ],
  emergencias: [
    { nombre: 'Seguridad Penco', numero: '*4157', nota: 'Denuncias y patrullaje comunal' },
    { nombre: 'SAMU ambulancia', numero: '131', nota: 'Urgencia salud 24 h' },
    { nombre: 'Bomberos Penco', numero: '132', nota: 'Incendios y rescate' },
    { nombre: 'Carabineros', numero: '133', nota: 'Tenencia Penco / Retén Lirquén' },
    { nombre: 'Inspección Municipal', numero: '41-2261477', nota: 'Ruidos, comercio irregular, microbasurales' },
    { nombre: 'Alumbrado Público', numero: '41-2261428', nota: 'Poste apagado o cable caído (sin tocar)' },
    { nombre: 'Protección Civil', numero: '41-2261305', nota: 'Marejadas, remociones, tsunami' }
  ],
  historia: {
    intro: "La Municipalidad de Penco nace con la República: de Villa (1843) a Comuna Autónoma (1891) y Ciudad (1898), hasta el municipio ciudadano de hoy en O'Higgins 500 con Delegación en Lirquén.",
    eras: [
      { t: '🏡 Villa de Penco', cuando: '29 de marzo de 1843 · Pdte. Manuel Bulnes', d: 'Tras el traslado a Concepción (1751) y 90 años de prohibición, Bulnes otorga el título de Villa. Primer subdelegado: Manuel Esteban Gajardo. Penco depende de Coelemu y luego de Concepción. Al norte crece la caleta de Lirquén (hacia 1850).' },
      { t: '🏛️ Comuna Autónoma', cuando: '1891 · Ley de Comuna Autónoma', d: 'Nace la Municipalidad de Penco con sede en Penco: administra la 8.ª subdelegación Palomares y la 9.ª Penco. Autogobierno local electivo por primera vez.' },
      { t: '🌆 Ciudad', cuando: '25 de abril de 1898 · Pdte. Federico Errázuriz', d: 'Decreto Supremo otorga el título de Ciudad. El damero y la Plaza heredan el plano colonial de 1550.' },
      { t: '🏭 Municipio fabril', cuando: '1886–1950 · CRAV, Loza, COSAF', d: 'Refinería de Azúcar (1886, luego CRAV), Fábrica de Loza (1898, luego Fanaloza), COSAF y Granja Cosmito. El municipio cobra patentes, regula el ferrocarril (1889, a Lirquén 1914) y apoya a Bomberos (1927) tras grandes incendios.' },
      { t: '🏗️ Expansión urbana', cuando: '1950–1973', d: 'Vidrios Planos de Lirquén (Vipla), fosfatos y calzado. Poblaciones obreras y conurbación Penco–Cerro Verde–Lirquén. Terremotos de 1939 y 1960 obligan a reconstruir.' },
      { t: '🌑 Dictadura', cuando: '1973–1990 · Alcaldes designados', d: 'Agustín Campos (1973), Beatriz Altamirano (1974), Alfonso Díaz (1976), Enrique Contreras (1977), Rodrigo Menéndez (1979–1987), Jorge Rivas (1987), Iván Norambuena (1988), Guillermo Cáceres (1989–1992). Declive fabril y cesantía; resisten puerto, pesca y organización vecinal.' },
      { t: '🗳️ Democracia', cuando: '1992–hoy', d: 'Ramón Fuentealba (1992–2004), Guillermo Cáceres (2004–2012), Víctor Hugo Figueroa (2012–2024; renuncia nov 2024), Leonardo Jara (interino 09/11–05/12/2024 elegido por el Concejo) y Rodrigo Vera Riquelme (2024–2028). Lirquén se vuelve puerto mayor (DP World), se crean DAS y DEM, CESFAM Penco y Lirquén, CECOSF, Farmacia Municipal y Seguridad *4157. El 27F de 2010 obliga a reconstruir el borde.' }
    ],
    alcaldes: ['Carlos Coddou (~1898)', 'Francisco Coddou (~1905–1930)', 'Armando Jofré Suazo (1939–1941)', 'Héctor Navarro (1944–1947)', 'Juan Pérez Flores (1956–1958)', 'Ramón Fuentealba (1992–2004)', 'Guillermo Cáceres (2004–2012)', 'Víctor Hugo Figueroa (2012–2024)', 'Leonardo Jara (interino 2024)', 'Rodrigo Vera Riquelme (2024–2028)'],
    sede: "Casa consistorial: O'Higgins 500. DEM en Los Carrera 230, Tránsito en Freire 510, Medio Ambiente en Talcahuano 131, JPL y DAS en O'Higgins 654, SECPLAN y Control en Maipú 209, Delegación Municipal en Lirquén."
  },
  participacion: {
    concejo: 'Sesiones ordinarias abiertas; tabla y actas en penco.cl > Concejo Municipal > Sesiones.',
    fondos: ['FONDEVE (vecinal, 2º semestre)', 'Becas ESUP (1er trimestre)', 'Tolvas y operativos por sector'],
    consejo: 'Pide la tabla por OIRS y asiste: es abierta.'
  },
  fuentes: 'penco.cl (Direcciones y Unidades, Concejo, Directorio Telefónico) · SINIM · saludpenco.cl · cesfamlirquen.cl · educapenco.cl. Verifica vigencia en penco.cl y OIRS.',
  actualizado: '2026-09'
};

function dynMuni() {
  try {
    var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.municipalidad;
    if (d && d.sede) return d;
  } catch (e) {}
  return MUNI_PENCO;
}

/* ---------- estado personal ---------- */
var tabMuni = 'muni';
var muniQuery = '';
function storeMuni() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { hechos: {}, notas: {}, mios: [], avisos: [] };
    if (!u.muniPenco) u.muniPenco = { hechos: {}, notas: {}, mios: [], avisos: [] };
    var r = u.muniPenco;
    if (!r.hechos || typeof r.hechos !== 'object') r.hechos = {};
    if (!r.notas || typeof r.notas !== 'object') r.notas = {};
    if (!Array.isArray(r.mios)) r.mios = [];
    if (!Array.isArray(r.avisos)) r.avisos = [];
    return r;
  } catch (e) { return { hechos: {}, notas: {}, mios: [], avisos: [] }; }
}

/* ---------- llevar al calendario ---------- */
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
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : '09:00';
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[Muni] ' + nombre + (detalle ? ' · ' + detalle : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      var linea = '[Muni Penco] ' + texto + ' ' + hhmm;
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + linea : linea;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) {
      try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {}
    }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  try {
    var st = storeMuni();
    st.avisos.push({ id: uid('mav'), nombre: nombre, detalle: detalle || '', fecha: fecha, hora: hhmm, notify: !!conAviso, creado: todayKey() });
  } catch (e) {}
  save('📌 Agregado al calendario ✓');
  refrescarCal();
  try { render(); } catch (e2) {}
}

/* ---------- esqueleto (diálogo propio muniDialog) ---------- */
function asegurarPanel() {
  var panel = $('muniPanel') || $('comunaMuniPanel'); /* fallback legado */
  if (!panel) return null;
  if (!panel.dataset.muniOk) {
    panel.dataset.muniOk = '1';
    panel.innerHTML =
      '<p class="muted" style="font-size:11px;line-height:1.55">La <b>Municipalidad</b>: dónde queda, quiénes son, qué dirección resuelve qué, y qué llevar a cada trámite. Marca tu avance en <b>⭐ Mis trámites</b> y lleva vencimientos al calendario con <b>📌</b>. Todo queda <b>privado y local</b>.</p>' +
      '<div class="timer-tabs" style="margin:8px 0 10px;flex-wrap:wrap">' +
      '<button type="button" id="tabMuniMuni" class="btn btn-accent" style="width:auto">🏛️ Municipio</button>' +
      '<button type="button" id="tabMuniDir" class="btn" style="width:auto">📂 Direcciones</button>' +
      '<button type="button" id="tabMuniTra" class="btn" style="width:auto">🧾 Trámites</button>' +
      '<button type="button" id="tabMuniSal" class="btn" style="width:auto">🏥 Salud y Educación</button>' +
      '<button type="button" id="tabMuniEme" class="btn" style="width:auto">🚨 Emergencias</button>' +
      '<button type="button" id="tabMuniHist" class="btn" style="width:auto">📜 Historia</button>' +
      '<button type="button" id="tabMuniMios" class="btn" style="width:auto">⭐ Mis trámites</button>' +
      '</div>' +
      '<div class="menstrual-card" style="margin-top:0"><h4>🔍 Buscar en Municipalidad</h4>' +
      '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="muniSearch" placeholder="ej: licencia, OIRS, CESFAM, patente, *4157, 1891..." maxlength="60" autocomplete="off"></label></div></div>' +
      '<div id="muniBody" style="margin-top:10px"></div>';
    var map = { tabMuniMuni: 'muni', tabMuniDir: 'dir', tabMuniTra: 'tra', tabMuniSal: 'sal', tabMuniEme: 'eme', tabMuniHist: 'hist', tabMuniMios: 'mios' };
    Object.keys(map).forEach(function (id) {
      var b = $(id);
      if (b) b.onclick = function () { tabMuni = map[id]; render(); };
    });
    var q = $('muniSearch');
    if (q) q.addEventListener('input', function () { muniQuery = q.value; renderBody(); });
  }
  return panel;
}

function matchQ() {
  var q = (muniQuery || '').toLowerCase().trim();
  if (!q) return null;
  return q;
}

/* ---------- renders por pestaña ---------- */
function renderSede(d) {
  var s = d.sede, a = d.autoridades;
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🏛️ ' + esc(s.nombre) + '</h4>' +
    '<p style="font-size:12px;line-height:1.6">📍 ' + esc(s.direccion) + '<br>📞 ' + esc(s.fono) + '<br>📮 ' + esc(s.oirs) + '<br>🌐 ' + esc(s.web) + '<br>🕐 ' + esc(s.horario) + '</p>' +
    '<p class="muted" style="font-size:11px">' + esc(s.nota) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn" data-muni-share-sede style="width:auto;font-size:11px">📤 Compartir contacto</button></div></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>👤 Alcalde · ' + esc(a.alcalde.periodo) + '</h4>' +
    '<p style="font-size:12px"><b>' + esc(a.alcalde.nombre) + '</b><br><span class="muted" style="font-size:11px">📮 ' + esc(a.alcalde.correo) + ' · ' + esc(a.alcalde.oficina) + '</span></p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>🗳️ Concejo Municipal · 6</h4>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' + a.concejo.map(function (c) {
      return '<span class="chip"><b>' + esc(c.nombre) + '</b> · ' + esc(c.pacto) + '</span>';
    }).join('') + '</div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">' + esc(a.notaConcejo) + '</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>🙋 Participación</h4>' +
    '<p class="muted" style="font-size:11px">' + esc(d.participacion.concejo) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + d.participacion.fondos.map(function (f) { return '<span class="chip">🎯 ' + esc(f) + '</span>'; }).join('') + '</div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">💡 ' + esc(d.participacion.consejo) + '</p></div>';
  html += '<p class="muted" style="font-size:10px;margin-top:8px">Fuentes: ' + esc(d.fuentes) + ' · Actualizado ' + esc(d.actualizado || '') + '. Verifica vigencia antes de ir.</p>';
  return html;
}

function renderDirecciones(d) {
  var q = matchQ();
  var list = d.direcciones.slice();
  if (q) list = list.filter(function (x) {
    return ((x.nombre || '') + ' ' + (x.director || '') + ' ' + (x.funcion || '') + ' ' + (x.contacto || '') + ' ' + (x.unidades || []).join(' ')).toLowerCase().indexOf(q) >= 0;
  });
  if (!list.length) return '<p class="muted">Sin resultados. Prueba “licencia”, “DIDECO”, “tránsito”, “aseo”...</p>';
  return '<div class="menstrual-card"><h4>📂 Direcciones y unidades · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:10px">Anexos: antepone <b>41-226</b> al número (ej 1452 → 41-2261452). Datos de penco.cl; confirma por OIRS.</p>' +
    list.map(function (x) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + esc(x.icon || '📂') + ' ' + esc(x.nombre) + '</h4>' +
        '<p class="muted" style="font-size:11px">👤 ' + esc(x.director) + ' · 📞 ' + esc(x.contacto) + '<br>📍 ' + esc(x.direccion) + '</p>' +
        '<p style="font-size:11px">' + esc(x.funcion) + '</p>' +
        (x.unidades && x.unidades.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">' + x.unidades.map(function (u) { return '<span class="chip" style="font-size:10px">' + esc(u) + '</span>'; }).join('') + '</div>' : '') + '</div>';
    }).join('') + '</div>';
}

function tramiteCard(t) {
  var st = storeMuni();
  var hecho = !!st.hechos[t.id];
  var nota = st.notas[t.id] || '';
  var html = '<div class="si-card" style="padding:10px 12px;border-color:#d4af3766' + (hecho ? ';opacity:.85' : '') + '">' +
    '<h4 style="font-size:13px">' + (hecho ? '✅ ' : esc(t.icon || '🧾') + ' ') + esc(t.nombre) + '</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.6">📍 ' + esc(t.donde) + '<br>🗓️ ' + esc(t.cuando) + ' · 💰 ' + esc(t.costo || 'Consultar') + '</p>' +
    '<p style="font-size:12px"><b>Requisitos:</b></p><ul style="font-size:11px;margin:2px 0 6px 18px;line-height:1.5">' +
    (t.requisitos || []).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' +
    (t.tip ? '<p class="muted" style="font-size:11px">💡 ' + esc(t.tip) + '</p>' : '') +
    '<label style="font-size:11px">📝 Mi nota <input type="text" data-muni-nota="' + esc(t.id) + '" placeholder="ej: folio 1234, hora pedida..." maxlength="80" value="' + esc(nota) + '"></label>' +
    '<div class="conv-row" style="align-items:flex-end;margin-top:6px">' +
    '<label>Fecha <input type="date" data-muni-fecha="' + esc(t.id) + '" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" data-muni-hora="' + esc(t.id) + '" value="09:00" style="max-width:110px"></label>' +
    '<label class="check-row" style="margin:0;white-space:nowrap"><input type="checkbox" data-muni-aviso="' + esc(t.id) + '"> 🔔</label>' +
    '<button type="button" class="btn btn-accent" data-muni-add="' + esc(t.id) + '" style="width:auto">📌 Calendario</button>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn" data-muni-hecho="' + esc(t.id) + '" style="width:auto;font-size:11px">' + (hecho ? '↩️ Reabrir' : '☑️ Marcar hecho') + '</button>' +
    '<button type="button" class="btn" data-muni-share="' + esc(t.id) + '" style="width:auto;font-size:11px">📤 Compartir</button></div></div>';
  return html;
}

function renderTramites(d) {
  var q = matchQ();
  var base = d.tramites.slice();
  var mios = storeMuni().mios.map(function (t) { t._mio = true; return t; });
  var list = base.concat(mios);
  if (q) list = list.filter(function (t) {
    return ((t.nombre || '') + ' ' + (t.donde || '') + ' ' + (t.cuando || '') + ' ' + ((t.requisitos || []).join(' '))).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧾 Trámites · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:11px">Guarda fecha con <b>📌 Calendario</b> (queda como compromiso 🕐 en tu día) y marca <b>☑️ Hecho</b> cuando lo termines. Tu nota queda privada.</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>➕ Agregar mi trámite</h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre * <input type="text" id="muniMioNombre" placeholder="ej: Renovar permiso auto" maxlength="60"></label>' +
    '<label>Dónde <input type="text" id="muniMioDonde" placeholder="ej: Freire 510" maxlength="50"></label></div>' +
    '<label>Requisitos / notas <input type="text" id="muniMioReq" placeholder="qué llevar, folio, horario..." maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="muniMioAdd" class="btn btn-accent" style="width:auto">+ Guardar trámite</button></div></div>';
  html += list.length ? list.map(tramiteCard).join('') : '<p class="muted">Sin resultados.</p>';
  return html;
}

function renderSalud(d) {
  var q = matchQ();
  var list = (d.salud || []).slice();
  if (q) list = list.filter(function (x) { return ((x.nombre || '') + ' ' + (x.dir || '')).toLowerCase().indexOf(q) >= 0; });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🏥 Salud municipal (DAS)</h4>' +
    '<p class="muted" style="font-size:11px">Urgencia 24 h: Hospital Penco-Lirquén. Para horas: SOME de tu CESFAM o Portal Paciente. Lleva carnet + carnet de control.</p>' +
    list.map(function (x) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">🏥 ' + esc(x.nombre) + '</h4>' +
        '<p class="muted" style="font-size:11px">📍 ' + esc(x.dir) + ' · 📞 ' + esc(x.fono) + '<br>🕐 ' + esc(x.horario) + '</p></div>';
    }).join('') + '</div>';
  var edu = (d.direcciones || []).filter(function (x) { return x.id === 'educacion'; })[0];
  if (edu && (!q || 'educacion dem escuela liceo beca preuniversitario'.indexOf(q) >= 0)) {
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>📚 Educación municipal (DEM)</h4>' +
      '<p style="font-size:12px"><b>' + esc(edu.nombre) + '</b> — ' + esc(edu.director) + '<br><span class="muted" style="font-size:11px">📍 ' + esc(edu.direccion) + ' · 📞 ' + esc(edu.contacto) + '</span></p>' +
      '<p style="font-size:11px">' + esc(edu.funcion) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' + (edu.unidades || []).map(function (u) { return '<span class="chip" style="font-size:10px">' + esc(u) + '</span>'; }).join('') + '</div></div>';
  }
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>💊 Farmacia + 🐾 Veterinario</h4>' +
    '<p style="font-size:11px">💊 Farmacia Municipal: receta vigente + inscripción CESFAM, precio costo.<br>🐾 Veterinario Municipal: +56 9 4401 1613, con hora y operativos de esterilización.</p></div>';
  return html;
}

function renderEmerg(d) {
  var q = matchQ();
  var list = (d.emergencias || []).slice();
  if (q) list = list.filter(function (x) { return ((x.nombre || '') + ' ' + (x.numero || '')).toLowerCase().indexOf(q) >= 0; });
  var html = '<div class="menstrual-card" style="border-color:#ff6b6b"><h4 style="color:#ff6b6b">🚨 Emergencias — llama primero, avisa después</h4>' +
    list.map(function (x) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(x.nombre) + '</b><br><span class="muted" style="font-size:11px">📞 <b>' + esc(x.numero) + '</b> · ' + esc(x.nota || '') + '</span></span>' +
        '<button type="button" class="btn" data-muni-tel="' + esc(x.numero) + '" style="width:auto" title="Copiar número">📋</button></div>';
    }).join('') + '</div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>🌊 Tsunami / marejada (Penco costero)</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.55">• Si tiembla fuerte y no te puedes poner de pie → evacúa a pie a cota alta (cerro) sin esperar alarma.<br>• Punto de encuentro familiar acordado de antemano.<br>• Mochila: agua, remedios, linterna, documentos, abrigo.<br>• Info oficial: SENAPRED + SHOA + Protección Civil 41-2261305. Ver sección 🌊🚨 Evacuación Tsunami.</p></div>';
  return html;
}

/* ---------- historia de la municipalidad ---------- */
function renderHistoriaMuni(d) {
  var h = d.historia;
  if (!h || !h.eras) return '<p class="muted">Historia municipal en preparación.</p>';
  var q = matchQ();
  var eras = h.eras.slice();
  if (q) eras = eras.filter(function (e) {
    return ((e.t || '') + ' ' + (e.cuando || '') + ' ' + (e.d || '')).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<p class="muted" style="font-size:11px;line-height:1.55">' + h.intro + '</p>';
  html += eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + esc(e.cuando) + '</p>' +
      '<p style="font-size:12px;line-height:1.55">' + esc(e.d) + '</p></div>';
  }).join('');
  if (h.alcaldes && h.alcaldes.length && (!q || 'alcalde'.indexOf(q) >= 0 || h.alcaldes.join(' ').toLowerCase().indexOf(q) >= 0)) {
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>🗳️ Alcaldes de Penco (resumen)</h4>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' + h.alcaldes.map(function (a) { return '<span class="chip" style="font-size:10px">' + esc(a) + '</span>'; }).join('') + '</div></div>';
  }
  if (h.sede && (!q || h.sede.toLowerCase().indexOf(q) >= 0)) {
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>📍 Sedes municipales</h4>' +
      '<p style="font-size:11px;line-height:1.55">' + esc(h.sede) + '</p></div>';
  }
  html += '<p class="muted" style="font-size:10px;margin-top:8px">Fuentes: ' + esc(d.fuentes || '') + '</p>';
  return html;
}

function renderMios(d) {
  var st = storeMuni();
  var hechos = d.tramites.filter(function (t) { return st.hechos[t.id]; });
  var avisos = st.avisos.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⭐ Mis trámites · ' + hechos.length + ' hechos · ' + avisos.length + ' en calendario · ' + st.mios.length + ' propios</h4>' +
    '<p class="muted" style="font-size:11px">Tus vencimientos ya están como compromisos 🕐 en tu calendario. Aquí los ves todos juntos.</p>';
  if (hechos.length) {
    html += '<p class="muted" style="font-size:11px">✅ Hechos:</p>' + hechos.map(function (t) {
      return '<div class="chip" style="display:block;margin-top:4px">✅ <b>' + esc(t.nombre) + '</b>' + (st.notas[t.id] ? ' · ' + esc(st.notas[t.id]) : '') + '</div>';
    }).join('');
  } else {
    html += '<p class="muted" style="font-size:11px">Aún no marcas hechos. Ve a 🧾 Trámites y pulsa ☑️.</p>';
  }
  if (avisos.length) {
    html += '<div style="margin-top:8px">' + avisos.map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(r.nombre) + '</b><br><span class="muted" style="font-size:11px">📅 ' + esc(r.fecha) + ' · 🕐 ' + esc(r.hora) + (r.notify ? ' · 🔔' : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
        '<button type="button" class="btn" data-muni-avdel="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div>';
    }).join('') + '</div>';
  }
  if (st.mios.length) {
    html += '<p class="muted" style="font-size:11px;margin-top:8px">📌 Mis trámites propios:</p>' + st.mios.map(function (t) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(t.icon || '📌') + ' ' + esc(t.nombre) + '</b>' + (st.hechos[t.id] ? ' ✅' : '') + '<br><span class="muted" style="font-size:11px">' + esc(t.donde || '') + '</span></span>' +
        '<span style="display:flex;gap:6px"><button type="button" class="btn" data-muni-hecho="' + esc(t.id) + '" style="width:auto;font-size:11px">☑️</button>' +
        '<button type="button" class="btn" data-muni-miodel="' + esc(t.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
    }).join('');
  }
  html += '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" id="muniShareAll" class="btn" style="width:auto">📤 Compartir mi lista</button>' +
    '<button type="button" id="muniClearAll" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar lista</button></div></div>';
  return html;
}

/* ---------- body + binds ---------- */
function renderBody() {
  var body = $('muniBody');
  if (!body) return;
  var d = dynMuni();
  var html = '';
  if (tabMuni === 'muni') html = renderSede(d);
  else if (tabMuni === 'dir') html = renderDirecciones(d);
  else if (tabMuni === 'tra') html = renderTramites(d);
  else if (tabMuni === 'sal') html = renderSalud(d);
  else if (tabMuni === 'eme') html = renderEmerg(d);
  else if (tabMuni === 'hist') html = renderHistoriaMuni(d);
  else html = renderMios(d);
  body.innerHTML = html;
  bindBody(body, d);
}

function porTramite(id) {
  var d = dynMuni();
  var all = (d.tramites || []).concat(storeMuni().mios || []);
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

function bindBody(scope, d) {
  if (!scope) return;
  scope.querySelectorAll('[data-muni-tel]').forEach(function (b) {
    b.onclick = function () {
      var n = b.getAttribute('data-muni-tel');
      try { if (navigator.clipboard) navigator.clipboard.writeText(n).then(function () { save('Número copiado ✓'); }); } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-muni-nota]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var st = storeMuni();
      st.notas[inp.getAttribute('data-muni-nota')] = clean(inp.value, 80);
      save('Nota guardada ✓');
    });
  });
  scope.querySelectorAll('[data-muni-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-muni-add');
      var t = porTramite(id);
      if (!t) return;
      var f = (scope.querySelector('[data-muni-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (scope.querySelector('[data-muni-hora="' + id + '"]') || {}).value || '09:00';
      var av = !!(scope.querySelector('[data-muni-aviso="' + id + '"]') || {}).checked;
      llevarAlCalendario(t.nombre, t.donde, f, h, av);
    };
  });
  scope.querySelectorAll('[data-muni-hecho]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-muni-hecho');
      var st = storeMuni();
      if (st.hechos[id]) delete st.hechos[id]; else st.hechos[id] = todayKey();
      save(st.hechos[id] ? 'Trámite hecho ✅' : 'Reabierto');
      render();
    };
  });
  scope.querySelectorAll('[data-muni-share]').forEach(function (b) {
    b.onclick = function () {
      var t = porTramite(b.getAttribute('data-muni-share'));
      if (!t) return;
      var txt = (t.icon || '🧾') + ' ' + t.nombre + '\n📍 ' + (t.donde || '') + '\n🗓️ ' + (t.cuando || '') + '\n• ' + ((t.requisitos || []).join('\n• ')) + '\n💰 ' + (t.costo || '');
      try {
        if (navigator.share) { navigator.share({ title: t.nombre + ' — Muni Penco', text: txt }).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(t.nombre + ' — Muni Penco\n' + txt).then(function () { save('Compartido ✓'); });
      } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-muni-avdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Quitar de Mis trámites? (El compromiso del día se conserva)')) return;
      var st = storeMuni();
      st.avisos = st.avisos.filter(function (x) { return x.id !== b.getAttribute('data-muni-avdel'); });
      save('Quitado'); render();
    };
  });
  scope.querySelectorAll('[data-muni-miodel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este trámite propio?')) return;
      var st = storeMuni();
      st.mios = st.mios.filter(function (x) { return x.id !== b.getAttribute('data-muni-miodel'); });
      save('Borrado'); render();
    };
  });
  var sh = $('muniShareAll');
  if (sh) sh.onclick = function () {
    var st = storeMuni();
    var txt = '🏛️ Mis trámites Muni Penco\n✅ Hechos: ' + Object.keys(st.hechos).length + '\n' +
      st.avisos.map(function (r) { return '• ' + r.fecha + ' ' + r.hora + ' — ' + r.nombre; }).join('\n');
    try {
      if (navigator.share) { navigator.share({ title: 'Mis trámites Muni Penco', text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
  var cl = $('muniClearAll');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar hechos, avisos y propios? (Los compromisos del calendario se conservan)')) return;
    var st = storeMuni();
    st.hechos = {}; st.avisos = []; st.mios = []; st.notas = {};
    save('Lista borrada'); render();
  };
  var add = $('muniMioAdd');
  if (add) add.onclick = function () {
    var nombre = clean(($('muniMioNombre') || {}).value, 60).trim();
    if (!nombre) { alert('Ponle nombre a tu trámite'); return; }
    var rec = {
      id: uid('mun'), icon: '📌', nombre: nombre,
      donde: clean(($('muniMioDonde') || {}).value, 50) || "O'Higgins 500",
      cuando: 'Mi fecha', costo: 'Consultar',
      requisitos: [clean(($('muniMioReq') || {}).value, 120) || 'Ver requisitos en OIRS'],
      tip: ''
    };
    storeMuni().mios.push(rec);
    save('Trámite guardado 📌');
    render();
  };
  var ss = scope.querySelector('[data-muni-share-sede]');
  if (ss) ss.onclick = function () {
    var s = dynMuni().sede;
    var txt = s.nombre + '\n📍 ' + s.direccion + '\n📞 ' + s.fono + '\n📮 ' + s.oirs + '\n🌐 ' + s.web + '\n🕐 ' + s.horario;
    try {
      if (navigator.share) { navigator.share({ title: s.nombre, text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
}

function render() {
  var panel = asegurarPanel();
  if (!panel) return;
  var tabs = { muni: $('tabMuniMuni'), dir: $('tabMuniDir'), tra: $('tabMuniTra'), sal: $('tabMuniSal'), eme: $('tabMuniEme'), hist: $('tabMuniHist'), mios: $('tabMuniMios') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', tabMuni === k); });
  var q2 = $('muniSearch');
  if (q2 && q2.value !== muniQuery && document.activeElement !== q2) q2.value = muniQuery;
  renderBody();
}

function openMuni() {
  try { render(); } catch (e) {}
  try {
    var dlg = $('muniDialog');
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    else if (dlg) dlg.setAttribute('open', '');
  } catch (e2) {}
}

function setup() {
  if (!$('muniPanel') && !$('muniDialog')) {
    /* compatibilidad: si aún existe el panel legado dentro de Penco, úsalo */
    if (!$('comunaMuniPanel')) {
      window._muniRetry = (window._muniRetry || 0) + 1;
      if (window._muniRetry < 60) setTimeout(setup, 500);
      return;
    }
  }
  try {
    var b = $('btnMuni');
    if (b && !b.dataset.muniW) { b.dataset.muniW = '1'; b.addEventListener('click', openMuni); }
  } catch (e) {}
  try {
    var c1 = $('muniCloseTop'), c2 = $('muniClose');
    if (c1 && !c1.dataset.w) { c1.dataset.w = '1'; c1.onclick = function () { try { $('muniDialog').close(); } catch (e) {} }; }
    if (c2 && !c2.dataset.w) { c2.dataset.w = '1'; c2.onclick = function () { try { $('muniDialog').close(); } catch (e) {} }; }
  } catch (e3) {}
}

window.MuniPenco = { render: render, open: openMuni, tab: function (t) { tabMuni = t || tabMuni; render(); }, datos: function () { return dynMuni(); }, llevarAlCalendario: llevarAlCalendario };
try {
  Object.defineProperty(window.MuniPenco, 'data', { get: dynMuni });
} catch (e) { window.MuniPenco.data = MUNI_PENCO; }
try { document.addEventListener('territorio:listo', function () { try { render(); } catch (e) {} }); } catch (e2) {}
setTimeout(setup, 600);
setTimeout(setup, 1800);

})();
