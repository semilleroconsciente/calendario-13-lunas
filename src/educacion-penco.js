/* ============================================================
   EDUCACION EN PENCO — Calendario 13 Lunas
   Apartado: Territorio > Penco > 📚 Educacion
     (btnEducacion -> educacionDialog -> educacionPanel),
     al lado de 🎉 Penco | ⛪ Iglesias | 🏛️ Municipalidad |
     🚒 Bomberos | Guardianxs | Amenazas.
   - Base verificada DEM / penco.cl / MINEDUC (2025-2026):
     15 establecimientos municipales (10 basicas + 1 rural
     multigrado + 1 diferencial + 3 liceos, uno desde 2025),
     5 salas cuna y jardines VTF, mas particulares
     subvencionados y escuelas de lenguaje/especial con
     direccion verificada. Sin horarios inventados: confirmar
     en cada establecimiento / SAE.
   - Cada ficha trae breve historia (origen conocido o memoria
     por completar) + RBD + contacto + links verificados.
   - Subseccion 📜 Historia: 12 hitos desde el kimun lafkenche
     y la Universidad Pencopolitana (1718-1767) al tercer
     liceo (Republica de Italia, 2025).
   - Cada ficha tiene "📌 Calendario": matricula, visita,
     reunion o postulacion en el dia elegido.
   Todo local y privado por usuario: userData().educacionPenco
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
    if (!u.educacionPenco) u.educacionPenco = { mias: [], visitas: [] };
    var r = u.educacionPenco;
    if (!Array.isArray(r.mias)) r.mias = [];
    if (!Array.isArray(r.visitas)) r.visitas = [];
    return r;
  } catch (e) { return { mias: [], visitas: [] }; }
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') { renderCurrentView(); return; } } catch (e) {}
  try { if (typeof renderLuna === 'function') renderLuna(); } catch (e2) {}
}

/* ---------- BASE VERIFICADA (DEM 2025-2026 + penco.cl + MINEDUC) ----------
   RBD y contactos segun educapenco.cl/dem/establecimientos y
   /jardines-infantiles (2025-2026). Particulares segun vitrina
   SAE MINEDUC + sitios oficiales. La historia breve de cada ficha
   distingue lo verificado de la memoria por completar. */
var EDU_BASE = [
  /* ----- 3 liceos municipales ----- */
  { id: 'edu-pencopolitano', cat: 'media', dep: 'Municipal DEM', icon: '🎓', nombre: 'Liceo Pencopolitano',
    sector: 'Penco Centro', direccion: 'San Vicente 51, Penco', contacto: 'Dir. Alex Díaz Villouta · 41-2451016 · alex.diaz@liceopencopolitano.cl · RBD 4805-4',
    niveles: '7° básico a 4° medio · HC + TP (Gastronomía, Operaciones Portuarias, Acuicultura) + 3ª jornada vespertina adultos (básica y media)',
    links: [['🌐 Liceo', 'https://liceopencopolitano.cl'], ['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos'], ['📝 SAE/MINEDUC RBD 4805', 'https://admision.mineduc.cl/']],
    desc: 'El liceo emblemático de la comuna. Origen <b>1957</b>: grupo de vecinos y profesores normalistas fundadores —<b>Rosauro Montero y Amulio Leyton</b>— abre cursos vespertinos para obreros de las fábricas que no habían terminado la escuela (Sociedad de Historia de Penco, Radio Penco 2013). Liceo de enseñanza media desde <b>1967</b>, HC y TP portuario-gastronómico ligado al puerto de Lirquén.' },
  { id: 'edu-repitalia', cat: 'media', dep: 'Municipal DEM', icon: '🎓', nombre: 'Colegio / Liceo República de Italia',
    sector: 'Penco Centro', direccion: 'Roberto Ovalle 2, Penco (Barrio Ex CRAV)', contacto: 'Dir. Elizabeth Aguirre Rodríguez · 940918188 · escuelaitaliapenco@gmail.com · RBD 4806',
    niveles: 'Prekínder a 8° básico + 1° medio desde 2025 (crece a media completa)',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos'], ['📰 Tercer liceo 2025 (DEM)', 'https://educapenco.cl/dem/452-2'], ['📝 SAE/MINEDUC RBD 4806', 'https://admision.mineduc.cl/']],
    desc: 'Escuela pública con <b>sello de idioma italiano</b> (obligatorio desde <b>2019</b>, reconocido por MINEDUC). En <b>dic 2024</b> recibe certificación para media y en <b>2025 abre 1° medio con 39 estudiantes</b>: tercer liceo municipal de Penco, proyecto de la comunidad, municipio, concejo y centro de padres.' },
  { id: 'edu-rios', cat: 'media', dep: 'Municipal DEM', icon: '🎓', nombre: 'Liceo Ríos de Chile',
    sector: 'Lirquén', direccion: 'Camino Forestal Dichoco s/n, Lirquén', contacto: 'Dir. Paulina Raig Zúñiga · 41-2261308 · riosdechileliceo@gmail.com · RBD 17782-2',
    niveles: 'Básica + media técnico-profesional',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos'], ['📝 SAE/MINEDUC RBD 17782', 'https://admision.mineduc.cl/']],
    desc: 'Liceo TP del sector norte, junto al camino forestal de Lirquén. Atiende a barrios puerto-pesqueros (Ríos de Chile, Bellavista, La Cantera) y articula formación técnica con el borde costero y el puerto mayor.' },
  /* ----- 10 escuelas básicas municipales ----- */
  { id: 'edu-islapascua', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Isla de Pascua',
    sector: 'Penco Centro', direccion: 'Las Heras 485, Penco', contacto: 'Dir. Ricardo Sandoval Ramírez · 412456235 · ricardo.sandoval@escuelaisladepascua.cl · RBD 4807-0',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela pública de matrícula grande del centro (más de 500 estudiantes). Parte de la red DEM; su historia barrial —ligada a las poblaciones del casco— está en archivos DEM y memoria vecinal por recoger.' },
  { id: 'edu-penco', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Penco',
    sector: 'Penco Centro', direccion: 'Maitén 297, Penco', contacto: 'Dir. Sandra Sanzana Castro · 412451282 · escuelapenco@escuelapenco.cl · RBD 4808-9',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela que lleva el nombre de la comuna, en el barrio Maitén. Escuela pública de cercanía del centro; SNED premiado (Excelencia) en 2022-2023.' },
  { id: 'edu-campbell', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Eduardo Campbell Saavedra',
    sector: 'Cerro Verde', direccion: 'Central 455, Cerro Verde Bajo', contacto: 'Dir. Soraya Neira Contreras · 995436323 · RBD 4809-7',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela del cerro que cose Penco con Lirquén. Nombre de educador; atiende a Cerro Verde Bajo, sector de origen minero-obrero y tomas históricas (“Mejoreros”).' },
  { id: 'edu-jorgemontt', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Almirante Jorge Montt Álvarez',
    sector: 'Penco Centro', direccion: 'Lorenzo Riveros 338, Penco', contacto: 'Dir. Felipe Aguayo Córdova · 412458119 · RBD 4810-0',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela pública del centro-oriente, nombre de marino. SNED premiado 2024-2025. Historia ligada a los barrios obreros del eje Lorenzo Riveros.' },
  { id: 'edu-lynch', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Almirante Patricio Lynch',
    sector: 'Lirquén', direccion: 'Camilo Henríquez 6, Lirquén', contacto: 'Dir. Sandra Susperreguy Torres · 991267825 · RBD 4811-9',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela del puerto de Lirquén. Certificación ambiental SNCAE <b>Excelencia</b> y SNED premiado. Atiende a familias de caletas, puerto y barrios del carbón y el vidrio.' },
  { id: 'edu-greda', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela La Greda',
    sector: 'Cosmito / Ruta 150', direccion: 'Calle Dos Poniente 23, Pob. La Greda', contacto: 'Dir. Ana María Jara Delva · 940918196 · RBD 4812-7',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela del sector sur (eje Ruta 150), zona de la Formación Cosmito y la antigua Granja Cosmito lechera. SNCAE Excelencia; escuela de corredor obrero-ferroviario.' },
  { id: 'edu-vipla', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Vipla',
    sector: 'Lirquén', direccion: 'Calle Belgeri s/n, Pob. Vipla, Lirquén', contacto: 'Dir. Paulina Riquelme González · 935616510 · RBD 4813-5',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela de la población obrera de <b>Vidrios Planos (Vipla)</b>, polo industrial de Lirquén (1950-70). Memoria fabril viva en sus patios.' },
  { id: 'edu-ethel', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Ethel Henck de Grant',
    sector: 'Cosmito / Ruta 150', direccion: 'Los Lirios 101, Villa Cosmito', contacto: 'Dir. Karina Pérez Soto · 41-2261308 · RBD 4814-3',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela de Villa Cosmito, camino a Penco-Cosmito. Mejor SIMCE público de la comuna (277). Nombre de educadora; historia ligada a la villa y al campo lechero.' },
  { id: 'edu-forjadores', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Forjadores de Chile',
    sector: 'Penco Centro', direccion: 'Eusebio Lillo 235, Pob. Forjadores de Chile', contacto: 'Dir. Carla Herrera Quiroz · 412450080 · RBD 18015-7',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela de población obrera del centro; comparte manzana con el jardín VTF Rincón de Luz. SNCAE Excelencia; nombre de oficio forjador.' },
  { id: 'edu-conquistadores', cat: 'escuela', dep: 'Municipal DEM', icon: '🏫', nombre: 'Escuela Los Conquistadores',
    sector: 'Penco Centro', direccion: 'Cochrane 40, Penco', contacto: 'Dir. Leopoldo Valencia Silva · 412456058 · RBD 18014-9',
    niveles: 'Prekínder a 8° básico',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela céntrica junto a la historia del damero colonial (nombre alude a 1550). SNCAE Excelencia; matrícula grande de barrios del casco.' },
  /* ----- rural + diferencial ----- */
  { id: 'edu-primeragua', cat: 'escuela', dep: 'Municipal DEM', icon: '🌾', nombre: 'Escuela Primer Agua Abajo (rural multigrado)',
    sector: 'Zona Rural Este', direccion: 'Fundo Primer Agua Abajo s/n, ruta Penco–Roa–Florida', contacto: 'Dir. Pamela Jarpa Tapia · 999395711 · RBD 4817-8',
    niveles: 'Multigrado rural (prekínder a básica)',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'La escuela rural de la comuna (ruta del agua y el bosque, 36 km a Florida). Aula multigrado: pocos estudiantes, bosque y vertientes como sala. Transporte y cercanía con la comunidad campesina.' },
  { id: 'edu-stowhas', cat: 'especial', dep: 'Municipal DEM', icon: '💬', nombre: 'Escuela Especial Marta Stowhas Kargus (diferencial)',
    sector: 'Penco Centro', direccion: 'Freire 260, Penco', contacto: 'Dir. Mónica Arrau Gamonal · 41-2183847 · RBD 4803-8',
    niveles: 'Educación especial / diferencial',
    links: [['🏛️ DEM', 'https://educapenco.cl/dem/establecimientos']],
    desc: 'Escuela diferencial pública. Proyecto 2026 con UDLA y Copec Penco para mejorar espacios (“Transformando espacios”). Atiende discapacidad intelectual y necesidades permanentes.' },
  /* ----- 5 jardines VTF municipales ----- */
  { id: 'edu-burbujitas', cat: 'jardin', dep: 'Municipal DEM (VTF JUNJI)', icon: '🧸', nombre: 'Sala Cuna Burbujitas del Mar',
    sector: 'Lirquén', direccion: 'Camino Forestal Dichoco 100, Lirquén', contacto: 'Dir. Elizabeth Núñez Reyes · 41-2377037 · RBD 34302-1',
    niveles: 'Sala cuna y jardín VTF',
    links: [['🏛️ DEM Jardines', 'https://educapenco.cl/dem/jardines-infantiles']],
    desc: 'Jardín VTF del sector norte, junto al Liceo Ríos de Chile. En 2026 se trabajó su habilitación tras temporales e incendios (Fondo de Emergencia JUNJI).' },
  { id: 'edu-rinconluz', cat: 'jardin', dep: 'Municipal DEM (VTF JUNJI)', icon: '🧸', nombre: 'Sala Cuna y Jardín Rincón de Luz',
    sector: 'Penco Centro', direccion: 'Eusebio Lillo 300, Forjadores de Chile', contacto: 'Dir. Cynthia Sanhueza Cartes · 41-2305043 · RBD 34304-8',
    niveles: 'Sala cuna y jardín VTF',
    links: [['🏛️ DEM Jardines', 'https://educapenco.cl/dem/jardines-infantiles']],
    desc: 'Jardín VTF de la población Forjadores, junto a la escuela homónima. Red de cuidado del centro-obrero.' },
  { id: 'edu-pasitos', cat: 'jardin', dep: 'Municipal DEM (VTF JUNJI)', icon: '🧸', nombre: 'Sala Cuna y Jardín Pasitos del Futuro',
    sector: 'Cosmito / Ruta 150', direccion: 'Los Lirios 100, Cosmito', contacto: 'Dir. Evelyn Cruces Navarrete · +569 987159576 · RBD 34305-6',
    niveles: 'Sala cuna y jardín VTF',
    links: [['🏛️ DEM Jardines', 'https://educapenco.cl/dem/jardines-infantiles']],
    desc: 'Jardín VTF de Villa Cosmito, corredor sur. Puerta de entrada a la educación inicial del sector.' },
  { id: 'edu-gotitas', cat: 'jardin', dep: 'Municipal DEM (VTF JUNJI)', icon: '🧸', nombre: 'Sala Cuna y Jardín Gotitas de Mar',
    sector: 'Cerro Verde', direccion: 'Lorenzo Riveros 349, Cerro Verde Alto', contacto: 'Dir. Sandra Carvajal Guerra · 41-2386583 · RBD 34306-4',
    niveles: 'Sala cuna y jardín VTF',
    links: [['🏛️ DEM Jardines', 'https://educapenco.cl/dem/jardines-infantiles']],
    desc: 'Jardín VTF del cerro, entre quebradas con peumo y boldo. Nombre de mar para un cerro mirador.' },
  { id: 'edu-molino', cat: 'jardin', dep: 'Municipal DEM (VTF JUNJI)', icon: '🧸', nombre: 'Sala Cuna y Jardín Los Pequeños del Molino',
    sector: 'Penco Centro', direccion: 'Maitén 500, Penco', contacto: 'Dir. Solange Araya Soto · 41-2452533 · RBD 34307-2',
    niveles: 'Sala cuna y jardín VTF',
    links: [['🏛️ DEM Jardines', 'https://educapenco.cl/dem/jardines-infantiles']],
    desc: 'Jardín VTF del barrio Maitén, junto a la Escuela Penco. Memoria molinera del trigo y la molienda local.' },
  /* ----- JUNJI / Integra (red pública inicial) ----- */
  { id: 'edu-junji', cat: 'jardin', dep: 'JUNJI / Integra (pública)', icon: '🧸', nombre: 'Red JUNJI e Integra en Penco (guía)',
    sector: 'Toda la comuna', direccion: 'Jardines clásicos, alternativos y VTF: consultar buscador JUNJI / Integra', contacto: 'Postulación: buscatujardin.junji.gob.cl · integra.cl · DEM 41-2261308',
    niveles: 'Sala cuna y jardín público',
    links: [['🔍 Busca tu jardín JUNJI', 'https://buscatujardin.junji.gob.cl/'], ['🌱 Integra', 'https://www.integra.cl/nuestros-jardines-infantiles']],
    desc: 'Además de los 5 VTF municipales: jardines JUNJI clásicos y alternativos (p. ej. <b>Florcita Silvestre</b> de Villa Italia —trasladado temporalmente a <b>Manitos Pintadas</b> en 2026— y reposición de <b>Punta de Parra</b> tras incendios, JUNJI Biobío feb 2026) y jardines Integra. Postulación anual oct–dic.' },
  /* ----- particulares subvencionados ----- */
  { id: 'edu-refugio', cat: 'particular', dep: 'Particular subvencionado', icon: '🏫', nombre: 'Colegio El Refugio',
    sector: 'Penco Centro', direccion: "O'Higgins 115, Penco", contacto: 'Dir. Waldo Castillo Sepúlveda · 41-2451325 · RBD 4822-4 · Gratuito SEP/PIE',
    niveles: 'Prekínder a 4° medio',
    links: [['🌐 Colegio', 'https://colegioelrefugio.cl/'], ['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Fundado en <b>1983 en Caleta El Refugio</b> (Cerro Verde Bajo); <b>edificio actual en O’Higgins 115 desde 2008</b>. Mejor SIMCE/PAES comunal (283 SIMCE, PAES ~708). Proyecto inclusivo con equipo PIE completo.' },
  { id: 'edu-alafken', cat: 'particular', dep: 'Particular subvencionado', icon: '🏫', nombre: 'Colegio A-Lafken',
    sector: 'Penco Centro', direccion: 'Heriberto Urzúa 127, Penco (sede Cruz 10)', contacto: 'Desde 2006 · secretaria@alafken.cl · PIE',
    niveles: 'Prebásica, básica y media + EPJA adultos',
    links: [['🌐 Colegio', 'https://www.colegioalafken.cl/'], ['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Colegio lafkenche de nombre (“a-lafken”, junto al mar). Desde <b>2006</b>: valores, creatividad y excelencia; atiende NEE con PIE amplio (9 especialidades) y educación de adultos.' },
  { id: 'edu-alborada', cat: 'particular', dep: 'Particular subvencionado', icon: '🏫', nombre: 'Centro Educacional Alborada',
    sector: 'Penco Centro', direccion: 'Membrillar 656, Penco', contacto: 'Fundación 2007 · 41-2451646 · RBD 18127 · PIE',
    niveles: 'Kínder y básica + PIE',
    links: [['🌐 Centro', 'https://cealborada.cl/'], ['📝 SAE/MINEDUC RBD 18127', 'https://admision.mineduc.cl/']],
    desc: 'Centro de barrio fundado en <b>2007</b> (“todos pueden aprender”). Deportes, convivencia y PIE (intelectual, TEA, TEL, TDA, limítrofe).' },
  { id: 'edu-gloria', cat: 'particular', dep: 'Particular subvencionado', icon: '🏫', nombre: 'Complejo Educacional Gloria Méndez Briones',
    sector: 'Penco Centro', direccion: 'Roberto Ovalle 99, Penco', contacto: '41-2455878 · admision@cegmb.cl · RBD 18111',
    niveles: 'Prekínder a 8° básico',
    links: [['🌐 Complejo', 'https://cegmb.cl/'], ['📝 SAE/MINEDUC RBD 18111', 'https://admision.mineduc.cl/']],
    desc: '<b>35+ años</b> de trayectoria en el Barrio Ex CRAV. Formación integral parvularia-básica con especialistas de educación inicial.' },
  { id: 'edu-queen', cat: 'particular', dep: 'Particular subvencionado', icon: '🏫', nombre: 'Escuela Particular Queen Elizabeth School',
    sector: 'Penco Centro', direccion: 'Cochrane (Lord Cochrane) 469, Penco', contacto: 'RBD 4820 · PIE · Gratuito',
    niveles: 'Parvularia y básica',
    links: [['📝 SAE/MINEDUC RBD 4820', 'https://admision.mineduc.cl/']],
    desc: 'Escuela particular de barrio céntrico con PIE y apoyo multiprofesional. Nombre de tradición anglófona; comunidad de familias del casco.' },
  { id: 'edu-funny', cat: 'particular', dep: 'Particular subvencionado', icon: '🏫', nombre: 'Colegio Particular Funny School',
    sector: 'Penco Centro', direccion: 'Penco (confirmar dirección exacta en SAE/MINEDUC)', contacto: 'Parvularia y básica · Gratuito',
    niveles: 'Parvularia y básica',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Colegio particular de educación inicial y básica. Verificar sede y vacantes en vitrina SAE antes de postular.' },
  /* ----- lenguaje y especial particulares ----- */
  { id: 'edu-palabras', cat: 'especial', dep: 'Particular subvencionado', icon: '💬', nombre: 'Escuela Especial de Lenguaje Jardín de Palabras',
    sector: 'Penco Centro', direccion: 'Roberto Ovalle 107, Ex CRAV, Penco', contacto: 'RBD 18178-1 · SNCAE Excelencia',
    niveles: 'Educación especial / lenguaje',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Escuela de lenguaje del barrio patrimonial Ex CRAV. Certificación ambiental <b>Excelencia</b>.' },
  { id: 'edu-kimalu', cat: 'especial', dep: 'Particular subvencionado', icon: '💬', nombre: 'Escuela Especial de Lenguaje Kimalu',
    sector: 'Cosmito / Ruta 150', direccion: 'Principal 208, Sector Cosmito', contacto: 'RBD 18203',
    niveles: 'Educación especial / lenguaje',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Escuela de lenguaje del sector sur (“kimalu”, conocimiento mapuche). Atiende TEL con fonoaudiología y PIE.' },
  { id: 'edu-nfuturo', cat: 'especial', dep: 'Particular subvencionado', icon: '💬', nombre: 'Escuela Especial de Lenguaje Nuevo Futuro',
    sector: 'Lirquén', direccion: 'Diego de Almagro 132, Lirquén', contacto: 'Lenguaje · Lirquén',
    niveles: 'Educación especial / lenguaje',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Escuela de lenguaje del puerto. Red de apoyo a la primera infancia lirquenina.' },
  { id: 'edu-sannicolas', cat: 'especial', dep: 'Particular subvencionado', icon: '💬', nombre: 'Escuela de Lenguaje San Nicolás',
    sector: 'Penco Centro', direccion: 'Yerbas Buenas 227, Penco', contacto: 'Lenguaje',
    niveles: 'Educación especial / lenguaje',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Escuela de lenguaje céntrica. Confirmar niveles y vacantes en SAE.' },
  { id: 'edu-alcazar', cat: 'especial', dep: 'Particular subvencionado', icon: '💬', nombre: 'Escuela Especial de Lenguaje Alcázar',
    sector: 'Penco Centro', direccion: 'Blanco 113, Penco', contacto: 'Lenguaje',
    niveles: 'Educación especial / lenguaje',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Escuela de lenguaje del centro. Confirmar niveles y vacantes en SAE.' },
  /* ----- jardines particulares ----- */
  { id: 'edu-botecito', cat: 'jardin', dep: 'Particular subvencionado', icon: '🧸', nombre: 'Jardín Infantil Botecito de Papel',
    sector: 'Penco Centro', direccion: 'Penco (ver SAE; sostenedor individual Penco)', contacto: 'Parvularia · Gratuito',
    niveles: 'Jardín infantil',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Jardín particular subvencionado de la comuna. Verificar dirección y niveles en vitrina SAE.' },
  { id: 'edu-pasito', cat: 'jardin', dep: 'Particular subvencionado', icon: '🧸', nombre: 'Jardín Infantil Pasito a Pasito',
    sector: 'Penco Centro', direccion: 'Penco (ver SAE)', contacto: 'Parvularia',
    niveles: 'Jardín infantil',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Jardín particular de primera infancia. Verificar sede en SAE.' },
  { id: 'edu-golden', cat: 'jardin', dep: 'Particular subvencionado', icon: '🧸', nombre: 'Jardín Infantil Golden Kind’s / Mi Mundo de Dulzura',
    sector: 'Penco Centro', direccion: 'Penco (ver SAE)', contacto: 'Parvularia',
    niveles: 'Jardín infantil',
    links: [['📝 SAE/MINEDUC', 'https://admision.mineduc.cl/']],
    desc: 'Oferta parvularia particular (nombres registrados en nómina MINEDUC/Grandes Colegios). Confirmar sede vigente en SAE: los jardines cambian de nombre/sede con frecuencia.' }
];

/* ---------- HISTORIA EDUCACIONAL DE PENCO (subsección completa) ---------- */
var HISTORIA_EDU = [
  { t: '🌿 Kimün lafkenche: aprender del mar y el bosque', f: 'Antes de 1550 · ayllarewe costeros',
    d: 'Antes de la escuela hubo <b>kimün</b>: los niños y niñas lafkenche aprendían pescando con red y anzuelo, mariscando en el intermareal, navegando en <b>wampo</b> a Quiriquina y conociendo el bosque (canelo, lingue, remedios). Sin edificio: la playa, el humedal y el bosque eran la sala. Esa pedagogía del territorio sigue viva en 🗣️ Kimün Mapuzugun y 📖 Epew.' },
  { t: '✝️ Doctrina y primeras letras', f: '1550–1603 · fundación y obispado',
    d: 'Con la fundación de <b>La Concepción del Nuevo Extremo (1550)</b> llegan doctrina franciscana y primeras letras junto a plaza, iglesia y cabildo. La educación es catequesis y castellanización; no hay escuelas para todos. La memoria de este tiempo vive en la arqueología (convento franciscano frente a la plaza actual, UdeC 2018).' },
  { t: '🎓 Universidad Pencopolitana', f: '1718–1767 · obispo Nicolalde + jesuitas desde 1724',
    d: 'El obispo <b>Juan de Nicolalde funda en 1718 la Universidad Pencopolitana</b>, entregada a los <b>jesuitas (1724)</b>: filosofía y teología escolástica, dogmática y moral. Recibe categoría <b>pontificia</b> y forma al clero y la élite del sur durante <b>43 años</b>, hasta el terremoto-maremoto de <b>1751</b> y la expulsión jesuita (<b>1767</b>). Es la raíz universitaria de Penco, anterior a Concepción actual.' },
  { t: '📖 Escuelas fiscales republicanas', f: '1843–1860 · Villa + Ley de Instrucción Primaria',
    d: 'Con la <b>Villa (1843)</b> renace el caserío y con la <b>Ley de Instrucción Primaria (1860)</b> llegan las primeras <b>escuelas fiscales mixtas y rurales</b> (la N°18 rural, antecedente de muchas). Penco depende de Coelemu y luego de Concepción; Lirquén crece como caleta (~1850) con su propia escuelita porteña. Alfabetizar es tarea del Estado docente.' },
  { t: '🏭 Escuelas obreras: CRAV, Loza y ferrocarril', f: '1886–1930 · Refinería, Fanaloza, riel 1889/1914',
    d: 'La <b>Refinería de Azúcar (1886, luego CRAV)</b>, la <b>Fábrica de Loza (1898)</b> y el <b>ferrocarril (Penco 1889, Lirquén 1914)</b> traen miles de familias de Ñuble. Surgen <b>escuelas de barrio obrero y de fábrica</b>, muchas con nombre de marinos y educadores (Lynch, Montt, Campbell). La escuela acompaña al sindicato, al club y a los Bomberos (1927).' },
  { t: '🌙 Liceo Pencopolitano vespertino: los obreros a clases', f: '1957–1967 · Rosauro Montero + Amulio Leyton',
    d: 'A mediados de los 50, profesores normalistas —<b>Rosauro Montero y Amulio Leyton</b>— abren <b>cursos vespertinos gratuitos</b> para obreros sin escolaridad (Sociedad de Historia de Penco, Radio Penco 2013). De ese altruismo nace el <b>Liceo Pencopolitano</b> (media desde <b>1967</b>): HC más TP <b>Gastronomía, Operaciones Portuarias y Acuicultura</b>, mirando al puerto. Sigue en San Vicente 51.' },
  { t: '🏘️ Expansión barrial y puerto', f: '1960–1973 · Vipla, Cerro Verde, Cosmito',
    d: 'Con <b>Vidrios Planos (Vipla)</b>, fosfatos y calzado, Penco se conurba (Cerro Verde une Penco y Lirquén). Cada población levanta su escuela: <b>Vipla, La Greda, Ethel Henck (Cosmito), Forjadores, Conquistadores</b>. La escuela es centro social del barrio: fiestas patrias, campeonatos y veladas.' },
  { t: '🏛️ Municipalización', f: '1980–1990 · DEM en Los Carrera 230',
    d: 'El traspaso a la <b>municipalidad</b> crea el actual sistema: <b>DEM en Los Carrera 230</b> administra hoy <b>15 establecimientos</b> (10 básicas + rural Primer Agua + diferencial Marta Stowhas + 3 liceos). Tiempos de cesantía fabril: la escuela sostiene ollas, becas y contención.' },
  { t: '📚 JEC, SEP, PIE y 27F', f: '1997–2010 · jornada completa e inclusión',
    d: 'La <b>Jornada Escolar Completa (1997)</b>, la <b>SEP</b> y el <b>PIE (Decreto 170)</b> llevan psicólogos, fonoaudiólogos, diferenciales y reforzamiento a cada escuela. El <b>terremoto 27F (2010)</b> daña el borde y obliga a reconstruir escuelas y caletas: la comunidad educativa se vuelve red de emergencia.' },
  { t: '🧸 Jardines: VTF, JUNJI e Integra', f: '2000–hoy · 5 VTF + red pública',
    d: 'La educación inicial se vuelve derecho: <b>5 salas cuna y jardines VTF</b> municipales (Burbujitas, Rincón de Luz, Pasitos, Gotitas, Molino) más <b>JUNJI</b> (clásicos y alternativos como <b>Florcita Silvestre / Manitos Pintadas</b>) e <b>Integra</b>. En <b>2026</b> incendios obligan a trasladar y reponer jardines (Punta de Parra, Villa Italia): la continuidad se defiende en comunidad.' },
  { t: '🇮🇹 Sello italiano y tercer liceo', f: '2019–2025 · República de Italia a media',
    d: 'El <b>italiano</b> se vuelve asignatura obligatoria de la Escuela República de Italia (<b>2019</b>). La comunidad pide media: proceso <b>2020–2024</b>, certificación <b>dic 2024</b> y <b>1° medio con 39 estudiantes en 2025</b>. Penco pasa de 2 a <b>3 liceos municipales</b>. En paralelo crecen particulares con historia propia: <b>El Refugio (1983/2008), A-Lafken (2006), Alborada (2007), Gloria Méndez (35+ años)</b>.' },
  { t: '🌱 Penco aprende hoy', f: '2026 · 28 establecimientos · PADEM + preuniversitario',
    d: 'Hoy: <b>28 establecimientos</b> (15 públicos + 13 particulares subvencionados; 21 con parvularia, 23 con básica, <b>5 con media</b>). Herramientas: <b>SAE</b> (admision.mineduc.cl), <b>PADEM 2026</b> (educapenco.cl), <b>Preuniversitario Municipal</b> (penco.cl), <b>JUNAEB/TNE</b> y <b>Beca ESUP</b> (DIDECO/DEM). El desafío es el de siempre: que ningún niño ni niña quede fuera, del cerro al mar.' }
];
var FUENTES_EDU = 'Fuentes: DEM Penco — educapenco.cl/dem/establecimientos y /jardines-infantiles (2025-2026) · penco.cl/educacion/establecimientos · MINEDUC vitrina SAE admision.mineduc.cl (por RBD) y PEI Liceo Pencopolitano RBD 4805 · historiadepenco.cl “El origen del Liceo Pencopolitano” (2013/2025) · colegioelrefugio.cl (1983/2008) · colegioalafken.cl (2006) · cealborada.cl (2007) · cegmb.cl (35+ años) · educapenco.cl/dem/452-2 (Liceo República de Italia 2025) · Arquidiócesis de Concepción/Wikipedia (Univ. Pencopolitana 1718-1767) · JUNJI Biobío (reposición jardines feb 2026) · Grandes Colegios (28 establecimientos, SIMCE/PAES). Direcciones y direcciones de correo pueden cambiar: verificar en DEM/SAE antes de ir.';

var CATS = { jardin: '🧸 Jardines', escuela: '🏫 Escuelas básicas', media: '🎓 Liceos / media', especial: '💬 Especial y lenguaje', particular: '🏫 Particulares' };
var tabActual = 'todas';
var filtroQuery = '';
var editId = null;

function todas() {
  var r = store();
  var base = EDU_BASE.map(function (t) { t.oficial = true; return t; });
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
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : '09:00';
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[Educación] ' + t.nombre + (t.direccion ? ' · ' + t.direccion : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      var linea = '[Educación Penco] ' + texto + ' ' + hhmm;
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
    st.visitas.push({ id: uid('ev'), eduId: t.id, nombre: (t.icon || '📚') + ' ' + t.nombre, dep: t.dep, lugar: t.direccion || '', fecha: fecha, hora: hhmm, notify: !!conAviso, creado: todayKey() });
  } catch (e) {}
  save('📌 Agregado al calendario ✓');
  refrescarCal();
  try { render(); } catch (e2) {}
}

/* ---------- UI ---------- */
function asegurarPanel() {
  var panel = $('educacionPanel');
  if (!panel) return null;
  if (!panel.dataset.eduOk) {
    panel.dataset.eduOk = '1';
    panel.innerHTML =
      '<p class="muted su-b6db47">Toda la educación de la comuna: <b>15 municipales + 5 jardines VTF + red JUNJI/Integra + particulares y lenguaje</b>, cada uno con su historia y sus links. Revisa <b>📜 Historia</b> y <b>🧰 Útil</b> (SAE, JUNAEB, TNE, preuniversitario). Queda <b>privado y local</b>.</p>' +
      '<div class="timer-tabs su-525c61">' +
      '<button type="button" id="tabEduTodas" class="btn btn-accent su-30e741">📚 Todas</button>' +
      '<button type="button" id="tabEduJardin" class="btn su-30e741">🧸 Jardines</button>' +
      '<button type="button" id="tabEduEscuela" class="btn su-30e741">🏫 Escuelas</button>' +
      '<button type="button" id="tabEduMedia" class="btn su-30e741">🎓 Liceos</button>' +
      '<button type="button" id="tabEduEsp" class="btn su-30e741">💬 Especial</button>' +
      '<button type="button" id="tabEduHis" class="btn su-30e741">📜 Historia</button>' +
      '<button type="button" id="tabEduUtil" class="btn su-30e741">🧰 Útil</button>' +
      '<button type="button" id="tabEduVis" class="btn su-30e741">📌 Mis fechas</button>' +
      '<button type="button" id="tabEduAgr" class="btn su-30e741">➕ Agregar</button>' +
      '</div>' +
      '<div class="menstrual-card su-d2c171"><h4>🔍 Buscar</h4>' +
      '<label>Buscar <input type="text" id="eduSearch" placeholder="ej: Lynch, Lirquén, jardín, RBD 4805, italiano, PIE, TP..." maxlength="60" autocomplete="off"></label></div>' +
      '<div id="eduList" class="su-d2c171"></div>' +
      '<div id="eduHisBox" class="su-d2c171"></div>' +
      '<div id="eduUtilBox" class="su-d2c171"></div>' +
      '<div id="eduFormBox" class="menstrual-card hidden su-51d56a"></div>' +
      '<div id="eduVisBox" class="hidden su-d2c171"></div>';
    var bT = $('tabEduTodas'), bJ = $('tabEduJardin'), bE = $('tabEduEscuela'), bM = $('tabEduMedia'), bS = $('tabEduEsp'), bH = $('tabEduHis'), bU = $('tabEduUtil'), bV = $('tabEduVis'), bA = $('tabEduAgr');
    if (bT) bT.onclick = function () { tabActual = 'todas'; render(); };
    if (bJ) bJ.onclick = function () { tabActual = 'jardin'; render(); };
    if (bE) bE.onclick = function () { tabActual = 'escuela'; render(); };
    if (bM) bM.onclick = function () { tabActual = 'media'; render(); };
    if (bS) bS.onclick = function () { tabActual = 'especial'; render(); };
    if (bH) bH.onclick = function () { tabActual = 'historia'; render(); };
    if (bU) bU.onclick = function () { tabActual = 'util'; render(); };
    if (bV) bV.onclick = function () { tabActual = 'visitas'; render(); };
    if (bA) bA.onclick = function () { tabActual = 'agregar'; render(); };
    var q = $('eduSearch');
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
  var nvis = store().visitas.filter(function (x) { return x.eduId === t.id; }).length;
  var cat = CATS[t.cat] || t.cat || '';
  var html = '<div class="si-card su-df4827">' +
    '<h4 class="su-5e0faa">' + esc(t.icon || '📚') + ' ' + esc(t.nombre) + '</h4>' +
    '<p class="muted su-0d5be0">' + esc(t.dep || '') + (cat ? ' · ' + esc(cat) : '') + ' · ' + esc(t.sector || '') + (t.oficial ? ' · base verificada' : ' · mía') + (nvis ? ' · 📌 ' + nvis + ' en calendario' : '') + '</p>' +
    '<p class="su-37e316">' + (t.desc || '') + '</p>' +
    '<p class="muted su-b439ab">📍 ' + esc(t.direccion || 'Por confirmar') + '<br>👤 ' + esc(t.contacto || '') + '<br>🎒 ' + esc(t.niveles || '') + '</p>' +
    linksHTML(t) +
    '<div class="conv-row su-7fed8e">' +
    '<label>Fecha <input type="date" data-edu-fecha="' + t.id + '" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" data-edu-hora="' + t.id + '" value="09:00" class="su-91245b"></label>' +
    '<label class="check-row su-988f60" title="Avisar a esa hora"><input type="checkbox" data-edu-aviso="' + t.id + '"> 🔔</label>' +
    '<button type="button" class="btn btn-accent su-30e741" data-edu-add="' + t.id + '">📌 Calendario</button>' +
    '</div>';
  if (!t.oficial) {
    html += '<div class="su-c158a9">' +
      '<button type="button" class="btn su-337714" data-edu-edit="' + t.id + '">✏️ Editar</button>' +
      '<button type="button" class="btn su-337714" data-edu-share="' + t.id + '">📤 Compartir</button>' +
      '<button type="button" class="btn su-fd834a" data-edu-del="' + t.id + '">✕ Borrar</button></div>';
  }
  html += '</div>';
  return html;
}
function bindCards(scope) {
  if (!scope) return;
  scope.querySelectorAll('[data-edu-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-edu-add');
      var t = porId(id); if (!t) return;
      var f = (scope.querySelector('[data-edu-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (scope.querySelector('[data-edu-hora="' + id + '"]') || {}).value || '09:00';
      var av = !!(scope.querySelector('[data-edu-aviso="' + id + '"]') || {}).checked;
      agregarAlCalendario(t, f, h, av);
    };
  });
  scope.querySelectorAll('[data-edu-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta ficha? (Tus fechas del calendario se conservan como compromisos del día)')) return;
      var st = store();
      st.mias = st.mias.filter(function (x) { return x.id !== b.getAttribute('data-edu-del'); });
      save('Borrada'); render();
    };
  });
  scope.querySelectorAll('[data-edu-share]').forEach(function (b) {
    b.onclick = function () {
      var t = porId(b.getAttribute('data-edu-share')); if (!t) return;
      var txt = (t.icon || '📚') + ' ' + t.nombre + '\n📍 ' + (t.direccion || '') + '\n👤 ' + (t.contacto || '') + '\n🎒 ' + (t.niveles || '') + '\n' + (t.desc || '').replace(/<[^>]+>/g, '');
      try {
        if (navigator.share) { navigator.share({ title: t.nombre + ' — Penco', text: txt }).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(t.nombre + ' — Penco\n' + txt).then(function () { save('Compartido ✓'); });
      } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-edu-edit]').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      var t = st.mias.filter(function (x) { return x.id === b.getAttribute('data-edu-edit'); })[0];
      if (!t) return;
      editId = t.id; tabActual = 'agregar'; render();
    };
  });
}
function renderForm() {
  var box = $('eduFormBox'); if (!box) return;
  var st = store();
  var ed = editId ? st.mias.filter(function (x) { return x.id === editId; })[0] : null;
  function v(k, d) { return esc(ed ? (ed[k] || '') : (d || '')); }
  box.classList.toggle('hidden', tabActual !== 'agregar');
  if (tabActual !== 'agregar') return;
  box.innerHTML = '<h4>' + (ed ? '✏️ Editar establecimiento' : '➕ Agregar jardín, escuela o taller') + '</h4>' +
    '<p class="muted su-11a508">Solo con <b>dirección verificada</b> (afiche, puerta o contacto directo). Queda en tu dispositivo.</p>' +
    '<div class="conv-row"><label>Categoría * <select id="eduFCat"><option value="jardin">🧸 Jardín</option><option value="escuela">🏫 Escuela</option><option value="media">🎓 Liceo/media</option><option value="especial">💬 Especial/lenguaje</option><option value="particular">🏫 Particular</option></select></label>' +
    '<label>Sector <select id="eduFSec"><option>Penco Centro</option><option>Lirquén</option><option>Cerro Verde</option><option>Cosmito / Ruta 150</option><option>Zona Rural Este</option><option>Toda la comuna</option></select></label>' +
    '<label>Icono <input type="text" id="eduFIcon" maxlength="4" class="su-745e46" value="' + v('icon', '📚') + '"></label></div>' +
    '<label>Nombre * <input type="text" id="eduFNom" placeholder="ej: Taller de reforzamiento Villa Italia" maxlength="60" value="' + v('nombre', '') + '"></label>' +
    '<label>Dirección * <input type="text" id="eduFDir" placeholder="ej: Calle 123, Lirquén" maxlength="60" value="' + v('direccion', '') + '"></label>' +
    '<label>Contacto <input type="text" id="eduFCon" placeholder="ej: directora, fono, correo, RBD" maxlength="80" value="' + v('contacto', '') + '"></label>' +
    '<label>Niveles <input type="text" id="eduFNiv" placeholder="ej: prekínder a 8° básico" maxlength="80" value="' + v('niveles', '') + '"></label>' +
    '<label>Historia / descripción <input type="text" id="eduFDesc" placeholder="ej: jardín de barrio, fiesta de fin de año en diciembre" maxlength="140" value="' + v('desc', '') + '"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="eduFSave" class="btn btn-accent su-30e741">' + (ed ? '↻ Actualizar' : '+ Guardar') + '</button>' +
    (ed ? '<button type="button" id="eduFCancel" class="btn su-30e741">Cancelar</button>' : '') + '</div>';
  if (ed) { try { $('eduFCat').value = ed.cat || 'escuela'; $('eduFSec').value = ed.sector || 'Penco Centro'; } catch (e) {} }
  $('eduFSave').onclick = function () {
    var nombre = clean(($('eduFNom') || {}).value, 60).trim();
    var dir = clean(($('eduFDir') || {}).value, 60).trim();
    if (!nombre) { alert('Ponle nombre al establecimiento'); return; }
    if (!dir) { alert('Pon la dirección (verificada)'); return; }
    var rec = {
      cat: $('eduFCat').value, sector: $('eduFSec').value, dep: 'Ficha vecinal',
      icon: clean(($('eduFIcon') || {}).value, 4) || '📚',
      nombre: nombre, direccion: dir,
      contacto: clean(($('eduFCon') || {}).value, 80),
      niveles: clean(($('eduFNiv') || {}).value, 80),
      desc: clean(($('eduFDesc') || {}).value, 140), links: []
    };
    if (editId && ed) { Object.keys(rec).forEach(function (k) { ed[k] = rec[k]; }); editId = null; save('Actualizada ✓'); }
    else { rec.id = uid('edu'); st.mias.push(rec); save('Establecimiento guardado 📚'); }
    tabActual = 'todas';
    render();
  };
  var c = $('eduFCancel');
  if (c) c.onclick = function () { editId = null; render(); };
}
function renderVisitas() {
  var box = $('eduVisBox'); if (!box) return;
  box.classList.toggle('hidden', tabActual !== 'visitas');
  if (tabActual !== 'visitas') return;
  var st = store();
  if (!st.visitas.length) {
    box.innerHTML = '<div class="menstrual-card"><h4>📌 Mis fechas</h4><p class="muted su-11a508">Aún no llevas nada al calendario. En 📚 Todas elige fecha/hora (matrícula, visita, reunión SAE) y pulsa <b>📌 Calendario</b>.</p></div>';
    return;
  }
  var arr = st.visitas.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora).localeCompare(String(b.hora)); });
  box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>📌 Mis fechas · ' + arr.length + '</h4>' +
    arr.map(function (r) {
      return '<div class="habit-item su-13313b"><span><b>' + esc(r.nombre) + '</b><br><span class="muted su-11a508">📅 ' + esc(r.fecha) + ' · 🕐 ' + esc(r.hora) + (r.notify ? ' · 🔔' : '') + (r.lugar ? ' · 📍 ' + esc(r.lugar) : '') + '</span></span>' +
        '<button type="button" class="btn su-fd834a" data-edudel="' + r.id + '">✕</button></div>';
    }).join('') +
    '<div class="dlg-actions su-efea1d"><button type="button" id="eduVisShare" class="btn su-30e741">📤 Compartir mi lista</button>' +
    '<button type="button" id="eduVisClear" class="btn su-214f75">🗑 Borrar lista</button></div></div>';
  box.querySelectorAll('[data-edudel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Quitar de Mis fechas? (El compromiso del día se conserva)')) return;
      store().visitas = store().visitas.filter(function (x) { return x.id !== b.getAttribute('data-edudel'); });
      save('Quitada'); render();
    };
  });
  var sh = $('eduVisShare');
  if (sh) sh.onclick = function () {
    var txt = store().visitas.map(function (r) { return '• ' + r.fecha + ' ' + r.hora + ' — ' + r.nombre + (r.lugar ? ' (' + r.lugar + ')' : ''); }).join('\n');
    try {
      if (navigator.share) { navigator.share({ title: 'Mi educación en Penco', text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText('📚 Mi educación en Penco\n' + txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
  var cl = $('eduVisClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar toda tu lista de fechas? (Los compromisos del calendario se conservan)')) return;
    store().visitas = [];
    save('Lista borrada'); render();
  };
}
function renderUtil() {
  var box = $('eduUtilBox'); if (!box) return;
  if (tabActual !== 'util') { box.innerHTML = ''; return; }
  box.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🧰 Útil: matrícula, beneficios y DEM</h4>' +
    '<p class="muted su-11a508"><b>DEM Penco:</b> Los Carrera 230 · 41-2261308 · <b>educapenco.cl/dem</b> · OIRS municipal oirs@penco.cl. Para cada escuela verifica vacantes, horarios y transporte en su dirección o en SAE.</p>' +
    '<div class="su-c158a9">' +
    '<a class="btn su-337714" href="https://educapenco.cl/dem/establecimientos" target="_blank" rel="noopener">🏛️ DEM Establecimientos ↗</a>' +
    '<a class="btn su-337714" href="https://educapenco.cl/dem/jardines-infantiles" target="_blank" rel="noopener">🧸 DEM Jardines VTF ↗</a>' +
    '<a class="btn su-337714" href="https://educapenco.cl/dem/padem-2026" target="_blank" rel="noopener">📋 PADEM 2026 ↗</a>' +
    '<a class="btn su-337714" href="https://penco.cl/educacion/establecimientos" target="_blank" rel="noopener">🏛️ penco.cl Educación ↗</a>' +
    '<a class="btn su-337714" href="https://penco.cl/educacion/preuniversitario-municipal" target="_blank" rel="noopener">🎓 Preuniversitario Municipal ↗</a>' +
    '</div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>📝 Matrícula y beneficios</h4>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">📝 SAE — Sistema de Admisión Escolar</h4><p class="su-11a508">Postulación online a municipales y particulares subvencionados (todos los RBD de esta sección). Calendario anual MINEDUC (postulación ~ago–sep, resultados oct–dic). Lleva tu fecha con 📌.</p><div class="su-c158a9"><a class="btn su-337714" href="https://admision.mineduc.cl/" target="_blank" rel="noopener">📝 admision.mineduc.cl ↗</a></div></div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🎒 JUNAEB: PAE, TNE y útiles</h4><p class="su-11a508">Alimentación (PAE), Tarjeta Nacional Estudiantil (TNE) y Programas de Salud Escolar se gestionan en cada establecimiento + JUNAEB Biobío. Pregunta en inspectoría/UTP por tu curso.</p><div class="su-c158a9"><a class="btn su-337714" href="https://www.junaeb.cl/" target="_blank" rel="noopener">🎒 junaeb.cl ↗</a></div></div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🚌 Transporte y ruralidad</h4><p class="su-11a508">Escuela Primer Agua Abajo (rural multigrado): consulta transporte escolar y acercamientos en el DEM. Para Lirquén–Cerro Verde–Cosmito revisa 🚌 Movilidad y 🎒 Escolar del grupo Hogar.</p></div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🎓 Beca ESUP + becas municipales</h4><p class="su-11a508">Beca Educación Superior (postulación 1er trimestre, DIDECO/DEM) + RSH al día. Ver 🏛️ Municipalidad → Trámites → Beca Educación Superior.</p></div>' +
    '</div>' +
    '<p class="muted su-a953a7">Verifica siempre vigencia en DEM/SAE/JUNAEB antes de ir: cupos, fechas y requisitos cambian cada año.</p>';
}
function renderHistoria() {
  var box = $('eduHisBox'); if (!box) return;
  if (tabActual !== 'historia') { box.innerHTML = ''; return; }
  var q = (filtroQuery || '').toLowerCase().trim();
  var eras = HISTORIA_EDU.filter(function (e) {
    if (!q) return true;
    return ((e.t || '') + ' ' + (e.f || '') + ' ' + (e.d || '')).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<div class="menstrual-card su-68a1a9"><h4>📜 Historia educacional de Penco · ' + eras.length + ' hitos</h4>' +
    '<p class="muted su-b6db47">Del kimün lafkenche y 43 años de universidad pontificia a 28 establecimientos y el tercer liceo (2025). Usa el buscador 🔍 para filtrar (ej: 1957, jesuitas, Vipla, italiano).</p>' +
    eras.map(function (e) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(e.t) + '</h4>' +
        '<p class="muted su-2c4c6c">' + esc(e.f) + '</p>' +
        '<p class="su-afb724">' + e.d + '</p></div>';
    }).join('') + '</div>';
  html += '<p class="muted su-a953a7">' + esc(FUENTES_EDU) + '</p>';
  box.innerHTML = html;
}
function renderLista() {
  var box = $('eduList'); if (!box) return;
  if (tabActual === 'visitas' || tabActual === 'agregar' || tabActual === 'historia' || tabActual === 'util') { box.innerHTML = ''; return; }
  var q = (filtroQuery || '').toLowerCase().trim();
  var list = todas();
  if (tabActual === 'jardin') list = list.filter(function (t) { return t.cat === 'jardin'; });
  if (tabActual === 'escuela') list = list.filter(function (t) { return t.cat === 'escuela' || t.cat === 'particular'; });
  if (tabActual === 'media') list = list.filter(function (t) { return t.cat === 'media'; });
  if (tabActual === 'especial') list = list.filter(function (t) { return t.cat === 'especial'; });
  if (q) list = list.filter(function (t) {
    return ((t.nombre || '') + ' ' + (t.desc || '').replace(/<[^>]+>/g, '') + ' ' + (t.direccion || '') + ' ' + (t.sector || '') + ' ' + (t.contacto || '') + ' ' + (t.niveles || '') + ' ' + (t.dep || '')).toLowerCase().indexOf(q) >= 0;
  });
  var titulo = tabActual === 'jardin' ? '🧸 Jardines y salas cuna' : tabActual === 'escuela' ? '🏫 Escuelas y colegios básicos' : tabActual === 'media' ? '🎓 Liceos y media' : tabActual === 'especial' ? '💬 Especial y lenguaje' : '📚 Educación en Penco';
  var html = '<div class="menstrual-card"><h4>' + titulo + ' · ' + list.length + '</h4>' +
    '<p class="muted su-0d5be0">15 municipales + 5 VTF + red JUNJI/Integra + particulares y lenguaje + tus fichas. En cada ficha elige fecha/hora y pulsa <b>📌 Calendario</b> (matrícula, visita, reunión).</p>' +
    (list.length ? list.map(cardHTML).join('') : '<p class="muted">Sin resultados. Si es tu jardín o escuela de barrio, súmalo en <b>➕ Agregar</b> con dirección verificada.</p>') + '</div>';
  html += '<p class="muted su-a953a7">' + esc(FUENTES_EDU) + '</p>';
  box.innerHTML = html;
  bindCards(box);
}
function render() {
  var panel = asegurarPanel();
  if (!panel) return;
  var tabs = { todas: $('tabEduTodas'), jardin: $('tabEduJardin'), escuela: $('tabEduEscuela'), media: $('tabEduMedia'), especial: $('tabEduEsp'), historia: $('tabEduHis'), util: $('tabEduUtil'), visitas: $('tabEduVis'), agregar: $('tabEduAgr') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', tabActual === k); });
  var q2 = $('eduSearch');
  if (q2 && q2.value !== filtroQuery && document.activeElement !== q2) q2.value = filtroQuery;
  renderLista();
  renderHistoria();
  renderUtil();
  renderForm();
  renderVisitas();
}

function openEdu() {
  try { render(); } catch (e) {}
  try {
    var dlg = $('educacionDialog');
    if (dlg && typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
    else if (dlg && !dlg.open) dlg.setAttribute('open', '');
  } catch (e2) {}
}

function setup() {
  if (!$('educacionPanel') || !$('educacionDialog')) {
    window._eduRetry = (window._eduRetry || 0) + 1;
    if (window._eduRetry < 60) setTimeout(setup, 500);
    return;
  }
  try {
    var b = $('btnEducacion');
    if (b && !b.dataset.eduW) { b.dataset.eduW = '1'; b.addEventListener('click', openEdu); }
  } catch (e) {}
  try {
    if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf('liceo') < 0)
      b.dataset.keywords += ' liceo colegio escuela jardin sala cuna parvulo basica media tecnico profesional rbd sae matricula tne junaeb pae preuniversitario padem dem italia pencopolitano rios chile vipla lynch montt campbell ethel forjadores conquistadores primer agua stowhas refugio alafken alborada gloria queen kimalu palabras futuro nicolas alcazar botecito historia educacional universidad pencopolitana jesuitas';
  } catch (e2) {}
  try {
    var c1 = $('educacionCloseTop'), c2 = $('educacionClose');
    if (c1 && !c1.dataset.w) { c1.dataset.w = '1'; c1.onclick = function () { try { $('educacionDialog').close(); } catch (e) {} }; }
    if (c2 && !c2.dataset.w) { c2.dataset.w = '1'; c2.onclick = function () { try { $('educacionDialog').close(); } catch (e) {} }; }
  } catch (e3) {}
}

window.EducacionPenco = { render: render, open: openEdu, todas: todas, agregarAlCalendario: agregarAlCalendario, base: EDU_BASE, historia: HISTORIA_EDU, fuentes: FUENTES_EDU };
setTimeout(setup, 600);
setTimeout(setup, 1800);

})();
