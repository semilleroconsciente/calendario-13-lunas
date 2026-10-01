/* ============================================================
   ECONOMÍA LOCAL DE PENCO — Calendario 13 Lunas (Penco · Bío-Bío)
   Apartado: Territorio > Penco (btnNegocios -> negociosDialog)
   Sección completa: negocios, emprendimientos, artesanos,
   oficios, cursos y moneda social que hay en la comuna.
    - Pestañas por tipo: Inicio | Negocios | Emprendimientos |
      Artesanos | Oficios (incluye 💚 Salud y cuidado) | Cursos |
      🪙 Moneda Social | Míos | Guía (+ ➕ Agregar global).
      Cada tipo se abre en sus rubros (solo rubros con fichas).
      🪙 Moneda Social es sección completa integrada: billetera
      (resumen), ofertas/pedidos, últimas transacciones, fichas
      que aceptan la moneda, guía mínima y accesos al módulo
      completo window.MonedaSocial (fuente única, sin duplicar).
   - Base inicial verificada 2022–2026 (NEGOCIOS_BASE): polo
     gastronómico de Lirquén, caletas, ferias libres y de
     emprendimiento, mujeres campesinas, agrupaciones de artesanos,
     talleres laborales, cueca, música y formación (OMIL, Sercotec).
     Cada ficha trae su fuente y lo no publicado dice "Por confirmar".
   - La sección sigue ABIERTA: agrega tus fichas en ➕ Agregar solo
     con datos verificados en terreno (local, horario y contacto).
   - Guía de rubros orientativa (sin nombres inventados) para saber
     qué buscar en cada sector de la comuna.
   - Por ficha: ⭐ Favorito · 📌 Llevar al calendario (visita, clase,
     encargo) · 📤 Compartir.
   - Campo "Acepta moneda social" + "Acepta trueque": se conecta con
     la sección 🪙 Moneda Social (si está instalada, badge cruzado).
   Todo local y privado por usuario: userData().negociosPenco
     { mios:[], favs:{}, visitas:[] }
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
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }

/* ---------- catálogos ---------- */
var TIPOS = {
  negocio: '🏪 Negocio',
  emprendimiento: '🌱 Emprendimiento',
  artesano: '🎨 Artesano/a',
  oficio: '🔧 Oficio',
  curso: '📚 Curso / Formación'
};
var CATS = {
  alimentos: '🥘 Alimentos',
  mar: '🐟 Mar y pesca',
  campo: '🌾 Campo y huerta',
  salud: '💚 Salud y cuidado',
  belleza: '💇 Belleza',
  ropa: '👕 Ropa y textil',
  hogar: '🏠 Hogar y construcción',
  reparacion: '🔧 Reparaciones',
  transporte: '🚐 Transporte',
  educacion: '📚 Educación y cursos',
  arte: '🎨 Arte y artesanía',
  musica: '🎶 Música',
  deporte: '🏅 Deporte',
  tecnologia: '💻 Tecnología',
  otro: '📌 Otro'
};
/* Guía de rubros por sector: orientación, SIN nombres inventados.
   Sirve para salir a mapear la comuna con datos reales. */
var RUBROS_GUIA = [
  { sector: 'Penco Centro y Borde Costero', icon: '🏛️', rubros: 'Almacenes, panaderías, feria y mercado, cocinerías y picadas, pescaderías, talleres mecánicos, peluquerías, librerías y bazares, academias y cursos. Borde costero: gastronomía marina, artesanía en concha/madera, paseos y fotografía.' },
  { sector: 'Lirquén (norte portuario-pesquero)', icon: '⚓', rubros: 'Caletas El Refugio y La Cata (pesca y mariscos), cocinerías de caleta, ahumados y conservas, carpintería de ribera y redes, minimarkets, transporte y fletes, cursos de pesca y buceo.' },
  { sector: 'Cerro Verde (alto y bajo)', icon: '⛰️', rubros: 'Almacenes de barrio, pan amasado y repostería casera, costura y arreglos, gasfitería y electricidad, cuidado de niños y personas mayores, huertas familiares y plantines.' },
  { sector: 'Eje Ruta 150 / Cosmito / La Greda', icon: '🛣️', rubros: 'Vulcanizaciones, ferreterías, viveros, forraje y alimentos, comida al paso, oficios de construcción, cursos de oficio (soldadura, cocina, cuidado).' },
  { sector: 'Zona Rural Este (Primer Agua, Roa)', icon: '🌾', rubros: 'Huevos y aves de campo, miel, quesos y lácteos, hortalizas de temporada, leña dimensionada, turismo rural y cabalgatas, cursos de huerta y bosque.' }
];
var SECTORES = ['Penco Centro', 'Playa Negra / Borde', 'Cerro Verde', 'Lirquén', 'Cosmito / Ruta 150', 'Zona Rural Este', 'Toda la comuna / a domicilio', 'Online (Penco)'];

/* Base verificada en terreno/prensa 2022–2026 (TVU, VisitaChile,
   Sercotec, SUBPESCA, Registro Civil/19862, PMC Penco, penco.cl).
   Solo trae nombre + dato publicado: lo no publicado dice
   "Por confirmar" para verificarse en terreno. Para fijar más
   fichas verificadas, agregar objetos con la forma
   { id, tipo:'negocio'|'emprendimiento'|'artesano'|'oficio'|'curso',
     icon, nombre, rubro(cat key), sector, direccion, horario,
     contacto, redes, desc, precio, moneda:bool, trueque:bool } */
var NEGOCIOS_BASE = [
  /* ---- POLO GASTRONÓMICO MARINO: BARRIO CHINO + CALETAS ---- */
  { id: 'b-barrio-chino', tipo: 'negocio', icon: '🐟', nombre: 'Barrio Chino de Lirquén — polo gastronómico', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Calle Balmaceda, frente a Plaza de Lirquén', horario: 'Fines de semana y festivos, desde la mañana (llegada de botes 10:00–12:00)',
    contacto: 'Por confirmar', redes: '',
    desc: 'Más de 50 años de historia: marisquerías y cocinerías familiares con paila marina, pastel de jaiba, machas a la parmesana, empanadas de mariscos y pescado frito. Mejor hora: 10:00–12:00, descarga de la pesca del día. Afectado por el incendio de enero 2026: varios locales en reactivación, verificar abiertos. (Fuentes: TVU 2025, VisitaChile 2026, Diario Concepción 2026)',
    precio: 'Platos aprox. $8.500–$22.000', moneda: false, trueque: false },
  { id: 'b-mar-azul', tipo: 'negocio', icon: '🍽️', nombre: 'Restaurante Mar Azul', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Malaquías Concha 100-298, Lirquén', horario: 'Por confirmar', contacto: '9 7881 6461', redes: '',
    desc: 'Restaurante de pescados y mariscos con valoración 4,2/5. Carta tradicional de la zona. (Fuente: ficha pública restaurantess.cl)',
    precio: 'Por confirmar', moneda: false, trueque: false },
  { id: 'b-delicias-mar', tipo: 'negocio', icon: '🍽️', nombre: 'Restaurante Delicias del Mar', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Barrio Chino, Lirquén', horario: 'Por confirmar', contacto: '9 9436 7315', redes: '',
    desc: 'Comida marina en pleno Barrio Chino, valoración 4,5/5. Reservas al teléfono publicado. (Fuente: ficha pública restaurantess.cl)',
    precio: 'Por confirmar', moneda: false, trueque: false },
  { id: 'b-rinconcito', tipo: 'negocio', icon: '🦐', nombre: 'El Rinconcito — marisquería', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Camino Al Puerto Lirquén, La Marina Norte', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Marisquería familiar de cebiches, pescados y mariscos a la plancha, valoración 4,6/5. (Fuente: ficha pública restaurantess.cl)',
    precio: 'Por confirmar', moneda: false, trueque: false },
  { id: 'b-patrono-mar', tipo: 'negocio', icon: '🍽️', nombre: 'Restaurante Patrono del Mar', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Balmaceda 50-98, Lirquén', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Cocina marina con opciones vegetarianas y veganas, valoración 4,3/5. (Fuente: ficha pública restaurantess.cl)',
    precio: 'Por confirmar', moneda: false, trueque: false },
  { id: 'b-costa-bella', tipo: 'negocio', icon: '🍽️', nombre: 'Restaurante Costa Bella', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Pasaje Interior #15 (Barrio Chino), Lirquén', horario: 'Lun–Dom 13:00–21:00', contacto: 'Por confirmar (fijo publicado parcial)', redes: '',
    desc: 'Restaurante familiar de pescados y mariscos en el Barrio Chino. (Fuente: ficha pública mundochileno.com)',
    precio: 'Por confirmar', moneda: false, trueque: false },
  { id: 'b-refugio', tipo: 'negocio', icon: '🐠', nombre: 'Puesto comercial Caleta El Refugio', rubro: 'mar', sector: 'Cerro Verde',
    direccion: 'Caleta El Refugio, Cerro Verde Bajo (punto medio Penco–Lirquén por el litoral)', horario: 'Diurno, según llegada de botes', contacto: 'Por confirmar', redes: '',
    desc: 'Puesto comercial de pescados y mariscos + restaurantes de especialidad y comida rápida. Paseo familiar frente al mar (no apto para el baño). Llegan micros licitadas desde el Gran Concepción. (Fuente: Wikipedia Caleta El Refugio)',
    precio: 'Precio de caleta', moneda: false, trueque: false },
  /* ---- PESCA ARTESANAL (oficio productivo) ---- */
  { id: 'b-sindicato-lirquen', tipo: 'oficio', icon: '⚓', nombre: 'Pesca artesanal Caleta Lirquén — sindicatos', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Caleta Lirquén', horario: 'Faenas de madrugada y mañana', contacto: 'Por confirmar (Capitanía de Puerto de Lirquén)', redes: 'biobioescaleta.cl/caleta/caleta-lirquen',
    desc: 'Sindicato de Buzos Mariscadores + Sindicato Único de caleta Lirquén (~60 boteros). Área de manejo Punta Lirquén: cholga y navajuela con cuota SUBPESCA vigente. Tractor INDESPA para varado desde 2022. (Fuentes: Directemar 2022, SUBPESCA 2026, Biobío es Caleta)',
    precio: 'Venta directa en caleta', moneda: false, trueque: false },
  /* ---- FERIAS LIBRES Y DE EMPRENDIMIENTO ---- */
  { id: 'b-feria-penco', tipo: 'negocio', icon: '🧺', nombre: 'Feria Libre Penco (sábado)', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Por confirmar (ver ficha en ferias libres)', horario: 'Sábados, mañana a mediodía', contacto: 'Sindicato de Ferias Rotativas Penco-Lirquén', redes: '',
    desc: 'Feria del Sindicato de Ferias Rotativas (53 feriantes, presidenta María Angélica Novoa): frutas, verduras y abarrotes. Feria modelo Sercotec 2025 con pesas electrónicas y toldos. (Fuentes: penco.pymenton.cl, Bionoticias 2025)',
    precio: 'Precio justo de feria', moneda: false, trueque: false },
  { id: 'b-feria-lirquen', tipo: 'negocio', icon: '🧺', nombre: 'Feria Libre Lirquén (miércoles)', rubro: 'alimentos', sector: 'Lirquén',
    direccion: 'Lirquén (ver ficha en ferias libres)', horario: 'Miércoles, mañana a mediodía', contacto: 'Sindicato de Ferias Rotativas Penco-Lirquén', redes: '',
    desc: 'Feria rotativa del mismo sindicato (53 feriantes): compra semanal sin salir del sector norte. (Fuentes: penco.pymenton.cl, Bionoticias 2025)',
    precio: 'Precio justo de feria', moneda: false, trueque: false },
  { id: 'b-feria-baquedano', tipo: 'negocio', icon: '🧺', nombre: 'Feria Libre Baquedano (jueves)', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Sector Baquedano, Penco (ver ficha en ferias libres)', horario: 'Jueves, mañana a mediodía', contacto: 'Sindicato de Ferias Rotativas Penco-Lirquén', redes: '',
    desc: 'Tercera feria rotativa semanal del sindicato en Penco Centro. (Fuentes: penco.pymenton.cl, Bionoticias 2025)',
    precio: 'Precio justo de feria', moneda: false, trueque: false },
  { id: 'b-feria-plaza', tipo: 'emprendimiento', icon: '🎪', nombre: 'Feria de emprendedores — Plaza Los Conquistadores', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Plaza Los Conquistadores, Penco Centro', horario: 'Primer fin de semana de cada mes', contacto: 'Depto. de Fomento Productivo, Municipalidad de Penco', redes: 'linktr.ee/MunicipioCiudadanoPencoLirquen (IG + Facebook + WhatsApp municipio)',
    desc: 'Unos 11 años de historia: vecinos venden ropa, juguetes, artesanías, libros y comida con toldos rosados vía Fomento Productivo. Solo habitantes de la comuna. (Fuente: Tiempo Real UdeC 2025)',
    precio: 'Variado, economía popular', moneda: false, trueque: true },
  { id: 'b-feria-navidad', tipo: 'emprendimiento', icon: '🎄', nombre: 'Feria Navideña de Penco', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Plaza Los Conquistadores (16–24 dic)', horario: 'Anual, diciembre', contacto: 'Municipalidad de Penco', redes: 'linktr.ee/MunicipioCiudadanoPencoLirquen (IG + Facebook + WhatsApp municipio)',
    desc: 'Más de 200 emprendedores y 20.000 visitantes: regalos, artesanía y gastronomía local. Ventas del comercio local suben ~400%. Incluye jornada de inclusión y punto de reciclaje. (Fuente: Bionoticias 2024)',
    precio: 'Variado', moneda: false, trueque: false },
  { id: 'b-cholguazo', tipo: 'emprendimiento', icon: '🍲', nombre: 'Fiesta del Cholguazo — Plaza de Lirquén', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Plaza de Lirquén', horario: 'Anual (fecha se ajusta por clima)', contacto: 'Municipalidad de Penco', redes: 'linktr.ee/MunicipioCiudadanoPencoLirquen (IG + Facebook + WhatsApp municipio)',
    desc: 'Fiesta de identidad lirquenina: estofado de cholga en olla gigante, emprendedores del Barrio Chino, foodtrucks y cerveza artesanal, música en vivo. (Fuente: El Concecuente 2026)',
    precio: 'Popular', moneda: false, trueque: false },
  /* ---- CAMPO Y MUJERES PRODUCTORAS ---- */
  { id: 'b-mujeres-campesinas', tipo: 'emprendimiento', icon: '🍯', nombre: 'Mujeres Campesinas de Penco (Prodesal–INDAP)', rubro: 'campo', sector: 'Zona Rural Este',
    direccion: 'Bajan de Primer Agua al centro de Penco', horario: 'Jueves 09:30–15:00 (verificar vigencia en terreno)', contacto: 'Programa Prodesal, Municipalidad de Penco', redes: '',
    desc: 'Asociación de ~18 productoras (Primer Agua y Penco) afiliada a Slow Food desde 2003: miel, mermeladas, harina tostada, pan amasado, verduras de estación. Atienden en Freire 525. (Fuentes: blog Penco-Chile 2016, mundochileno.com — verificar vigencia)',
    precio: 'Bajo, directo de chacra', moneda: false, trueque: true },
  /* ---- ARTESANOS Y AGRUPACIONES ---- */
  { id: 'b-artesanos-penco', tipo: 'artesano', icon: '🎨', nombre: 'Asociación Cultural Artesanos por Penco', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Freire 515 D, Penco', horario: 'Ferias y encargos (consultar)', contacto: 'Por confirmar', redes: '',
    desc: 'Asociación con personalidad jurídica (2023): souvenirs y recuerdos de la comuna, trabajos en madera. Vistos en TVU Siempre Juntos 2024. (Fuentes: Registro 19862, TVU 2024)',
    precio: 'A convenir', moneda: false, trueque: false },
  { id: 'b-manos-artesanos', tipo: 'artesano', icon: '🤲', nombre: 'Agrupación Manos de Artesanos Penco', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Freire 520, Penco', horario: 'Ferias y encargos (consultar)', contacto: 'Por confirmar', redes: '',
    desc: 'Agrupación comunitaria (2022) de artesanas y artesanos penquinos. (Fuente: Registro 19862)',
    precio: 'A convenir', moneda: false, trueque: false },
  { id: 'b-penco-amor', tipo: 'artesano', icon: '💝', nombre: 'Agrupación Penco es Amor (artesanías y manualidades)', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Heras 541, Penco', horario: 'Ferias y encargos (consultar)', contacto: 'Por confirmar', redes: '',
    desc: 'Agrupación de artesanías y manualidades con personalidad jurídica municipal. (Fuente: Registro 19862)',
    precio: 'A convenir', moneda: false, trueque: false },
  { id: 'b-kr2', tipo: 'emprendimiento', icon: '👕', nombre: 'Estampados KR2', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Penco (emprendimiento familiar, venta en ferias)', horario: 'Encargos (consultar)', contacto: 'Por confirmar', redes: 'Instagram: @estampadoskr2',
    desc: 'Emprendimiento familiar: diseños personalizados en tazones, poleras, llaveros, shoperos y bolsos ecológicos. (Fuente: TVU 2024)',
    precio: 'A convenir', moneda: false, trueque: false },
  { id: 'b-creadores-biobio', tipo: 'artesano', icon: '🏺', nombre: 'Artesanos Creadores del Biobío (red regional, sede Penco)', rubro: 'arte', sector: 'Toda la comuna / a domicilio',
    direccion: 'Red regional con representantes en Penco', horario: 'Feria anual BIOBÍO noviembre (UdeC) + ferias REC', contacto: 'Por confirmar', redes: 'Instagram: Artesanos Creadores del Bio Bio',
    desc: 'Asociación gremial (11 años) con artesanos de Penco, Tomé y Talcahuano: feria "Biobío la última frontera y su artesanía" (15 expositores, Fondart 2026) y Feria REC. Revaloriza técnicas heredadas. (Fuentes: TVU 2026, Min. Culturas 2025)',
    precio: 'Según obra', moneda: false, trueque: false },
  { id: 'b-muralistas', tipo: 'artesano', icon: '🖌️', nombre: 'Muralistas de Penco — ruta de murales', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Ruta de murales por la ciudad (tríptico Oficina de Cultura)', horario: 'Encargos de murales (consultar)', contacto: 'Oficina Municipal de Cultura, Penco', redes: 'Instagram: @sayennartt (Francisca Salinas) · linktr.ee/MunicipioCiudadanoPencoLirquen',
    desc: '5 muralistas de la comuna con mapa de murales y reels financiados por RedCultura (SEREMI Culturas). Murales por encargo para casas y sedes. (Fuente: SEA Cultura 2025)',
    precio: 'A convenir', moneda: false, trueque: true },
  /* ---- CURSOS Y FORMACIÓN ---- */
  { id: 'b-talleres-laborales', tipo: 'curso', icon: '🧵', nombre: 'Talleres Laborales DIDECO (mujeres)', rubro: 'educacion', sector: 'Toda la comuna / a domicilio',
    direccion: 'Sedes vecinales (Villa Penco, Vista Hermosa, Nueva Villa Penco y más)', horario: 'Jornadas semanales (inscripción en DIDECO)', contacto: 'DIDECO, Municipalidad de Penco', redes: 'linktr.ee/MunicipioCiudadanoPencoLirquen (IG + Facebook + WhatsApp municipio)',
    desc: 'Red de talleres laborales para dueñas de casa y jefas de hogar con monitora calificada: manualidades, repostería, corte y confección, huertos orgánicos. (Fuentes: PMC Penco 2018–2024, Registro 19862)',
    precio: 'Gratuito', moneda: false, trueque: false },
  { id: 'b-escuela-cueca', tipo: 'curso', icon: '💃', nombre: 'Escuela y Club de Cueca (Renacer y otros)', rubro: 'educacion', sector: 'Penco Centro',
    direccion: 'Gimnasio Municipal y sedes (Encuentro Comunal de Cueca)', horario: 'Talleres anuales + encuentro comunal (agosto)', contacto: 'Oficina Municipal de Cultura / DEM Penco', redes: 'linktr.ee/MunicipioCiudadanoPencoLirquen (IG + Facebook + WhatsApp municipio)',
    desc: 'Cueca huasa y lugareña en básica y media: 15 establecimientos en el Encuentro Comunal 2025. Clubes con monitor (guitarra). (Fuentes: educapenco.cl 2025, PMC Penco)',
    precio: 'Gratuito', moneda: false, trueque: false },
  { id: 'b-musica-liceo', tipo: 'curso', icon: '🎶', nombre: 'Taller de Música Instrumental Liceo Pencopolitano', rubro: 'educacion', sector: 'Penco Centro',
    direccion: 'San Vicente s/n, Penco', horario: 'Año escolar (consultar)', contacto: 'Liceo Pencopolitano', redes: '',
    desc: 'Taller instrumental con personalidad jurídica propia para estudiantes de la comuna. (Fuente: Registro 19862)',
    precio: 'Gratuito', moneda: false, trueque: false },
  { id: 'b-centro-pencolirquen', tipo: 'curso', icon: '🎭', nombre: 'Centro Cultural y Comunitario Penco Lirquén', rubro: 'educacion', sector: 'Lirquén',
    direccion: 'Infante 40, Penco', horario: 'Actividades culturales (consultar)', contacto: 'Por confirmar', redes: '',
    desc: 'Centro cultural con personalidad jurídica municipal para actividades artísticas entre Penco y Lirquén. (Fuente: Registro 19862)',
    precio: 'Gratuito o aporte', moneda: false, trueque: false },
  { id: 'b-activa-penco', tipo: 'curso', icon: '🚀', nombre: 'Escuela Activa Penco (Sercotec + Fomento Productivo)', rubro: 'educacion', sector: 'Penco Centro',
    direccion: 'Dependencias municipales, Penco', horario: 'Ciclos anuales (43 certificados 2025)', contacto: 'Oficina de Fomento Productivo + Centro de Negocios Sercotec Talcahuano', redes: 'linktr.ee/MunicipioCiudadanoPencoLirquen (IG + Facebook + WhatsApp municipio)',
    desc: 'Formación emprendedora: iniciación de actividades, microempresa familiar, resolución sanitaria, vitrinismo, redes sociales y financiamiento. Puerta a fondos Sercotec. (Fuente: Bionoticias 2025)',
    precio: 'Gratuito', moneda: false, trueque: false },
  { id: 'b-omil', tipo: 'curso', icon: '💼', nombre: 'OMIL Penco — empleo y capacitación SENCE', rubro: 'educacion', sector: 'Penco Centro',
    direccion: 'Municipalidad de Penco (convenio SENCE)', horario: 'Atención municipal (consultar)', contacto: 'OMIL, Municipalidad de Penco', redes: 'penco.cl/servicios/omil · linktr.ee/MunicipioCiudadanoPencoLirquen',
    desc: 'Intermediación laboral + cursos gratuitos o subvencionados: habilidades blandas, oficios, ventas y atención al cliente, informática. Inscripción con cédula y CV. (Fuentes: penco.cl, SENCE)',
    precio: 'Gratuito', moneda: false, trueque: false },
  { id: 'b-jefas-hogar', tipo: 'curso', icon: '👩‍🍳', nombre: 'Mujeres Jefas de Hogar + DP World (chocolatería y marketing)', rubro: 'educacion', sector: 'Lirquén',
    direccion: 'Penco–Lirquén (programa municipal)', horario: 'Ciclos anuales (58 certificadas 2025)', contacto: 'Programa Mujeres Jefas de Hogar, Municipalidad de Penco', redes: 'linktr.ee/MunicipioCiudadanoPencoLirquen (IG + Facebook + WhatsApp municipio)',
    desc: 'Alianza municipio–DP World Puertos Lirquén: chocolatería artesanal y marketing digital para cuidadoras y jefas de hogar que quieren emprender. (Fuente: Diario Concepción 2025)',
    precio: 'Gratuito', moneda: false, trueque: false },
  /* ---- ALMACENES POR SECTOR (fichas con nombre y dirección publicados) ---- */
  { id: 'b-gabito', tipo: 'negocio', icon: '🛒', nombre: 'Supermercado Don Gabito', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Penco 410, Penco Centro', horario: 'Lun–Dom 09:00–medianoche (según reseñas)', contacto: 'WhatsApp +56 9 6513 1615 (verificar — figura en directorio)', redes: '',
    desc: 'Supermercado independiente más grande de la comuna (+1.100 reseñas): panadería y pastelería, carnicería, rotisería, verdulería, abarrotes, licores, librería y mascotas. "Empezó como pequeño negocio de barrio". (Fuente: chilopina.com 2025)',
    precio: 'Medio, con promociones', moneda: false, trueque: false, almacen: true },
  { id: 'b-miramar', tipo: 'negocio', icon: '🏪', nombre: 'Almacén Miramar', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Freire 108, Penco', horario: 'Por confirmar', contacto: '09 4624 4680', redes: '',
    desc: 'Almacén de barrio en pleno Freire. (Fuente: cylex.cl)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-oregon', tipo: 'negocio', icon: '🏪', nombre: 'Minimarket Oregon', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Freire 808, Penco', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Minimarket sobre Freire. (Fuente: chilopina.com 2025)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-otra-esquina', tipo: 'negocio', icon: '🏪', nombre: 'Minimarket La Otra Esquina', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'El Roble 235, Penco (también figura Las Heras 599 — verificar)', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Minimarket de barrio con 29 reseñas. Dos direcciones publicadas: confirmar cuál sigue vigente en terreno. (Fuentes: chilopina.com 2025, datosdepega.cl)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-tabita', tipo: 'negocio', icon: '🥖', nombre: 'Minimarket y Panadería Tabita', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'El Roble 450, Penco', horario: 'Por confirmar', contacto: '56 9 6604 1920', redes: '',
    desc: 'Minimarket con panadería propia en El Roble. (Fuente: datosdepega.cl)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-jessica-franco', tipo: 'negocio', icon: '🏪', nombre: 'Minimarket Jessica Franco', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Freire 973 A, Penco', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Minimarket formalizado (EIRL) con giro de almacenes pequeños y minimarket. (Fuente: chilepymes.com)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-juan-palma', tipo: 'negocio', icon: '🏪', nombre: 'Almacén Juan Palma Sánchez', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'El Roble 500, Penco', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Almacén formalizado (EIRL) en El Roble. (Fuente: chilepymes.com)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-don-tito', tipo: 'negocio', icon: '🏪', nombre: 'Minimarket Don Tito', rubro: 'alimentos', sector: 'Lirquén',
    direccion: 'Arturo Prat 33, Lirquén', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Minimarket de barrio en el centro de Lirquén. (Fuente: chilopina.com 2024)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-benjamin', tipo: 'negocio', icon: '🏪', nombre: 'Almacén El Benjamín', rubro: 'alimentos', sector: 'Lirquén',
    direccion: 'Francisco de Ulloa 275, Lirquén', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Almacén de barrio. (Fuente: chilopina.com 2025)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-sarai', tipo: 'emprendimiento', icon: '🥬', nombre: 'Frutería, Verdulería y Minimarket Sarai', rubro: 'alimentos', sector: 'Lirquén',
    direccion: 'Lirquén (local modular nuevo — preguntar en el sector)', horario: 'Reabierto 2026 (confirmar horario)', contacto: 'Por confirmar', redes: '',
    desc: 'Emprendimiento familiar de Juan Manuel Parra: empezó en 2018 con un cajón de tomates y se formalizó con vitrinas y congeladores. Lo perdió todo en el incendio de 2026 y reabrió con local modular equipado + mercadería (Walmart/Desafío Levantemos Chile). (Fuentes: Walmart Chile 2026, ADN Radio 2026)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-sara-arevalo', tipo: 'emprendimiento', icon: '🧵', nombre: 'Almacén y modistería de Sara Arévalo', rubro: 'alimentos', sector: 'Lirquén',
    direccion: 'Lirquén, en su hogar (reabriendo 2026)', horario: 'Reabriendo 2026 (confirmar)', contacto: 'Por confirmar', redes: '',
    desc: 'Más de 20 años sosteniendo a su familia: almacén + taller de modistería en su casa. Perdió todo en el incendio y reabre con local modular equipado. (Fuente: Walmart Chile 2026)',
    precio: 'De barrio', moneda: false, trueque: true, almacen: true },
  { id: 'b-teresa-troncoso', tipo: 'emprendimiento', icon: '🏪', nombre: 'Almacén de Teresa Troncoso (dirigenta vecinal)', rubro: 'alimentos', sector: 'Lirquén',
    direccion: 'Lirquén, en su domicilio (reabriendo 2026)', horario: 'Reabriendo 2026 (confirmar)', contacto: 'Por confirmar', redes: '',
    desc: 'Almacén de abarrotes y punto de abastecimiento del barrio, gestionado por dirigenta vecinal. Reabre con local modular + fondo de abastecimiento. (Fuente: Walmart Chile 2026)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-el-toto', tipo: 'negocio', icon: '🏪', nombre: 'Minimarket El Toto', rubro: 'alimentos', sector: 'Cosmito / Ruta 150',
    direccion: '1 Norte 54, Villa La Greda, Penco', horario: 'Por confirmar', contacto: 'Por confirmar', redes: '',
    desc: 'Minimarket formalizado (SpA) de Villa La Greda con giro de almacenes pequeños y minimarket. (Fuente: chilepymes.com)',
    precio: 'De barrio', moneda: false, trueque: false, almacen: true },
  { id: 'b-pronto-cosmito', tipo: 'negocio', icon: '⛽', nombre: 'Pronto Copec Cosmito', rubro: 'alimentos', sector: 'Cosmito / Ruta 150',
    direccion: 'Cosmito, Parcela N°3 Lote 1 (eje Ruta 150)', horario: 'Horario extendido de servicio (ver en tienda)', contacto: 'Por confirmar', redes: 'prontocopec.cl/tiendas/pronto-cosmito',
    desc: 'Tienda de conveniencia del eje Ruta 150 con baños y cajero automático. (Fuente: prontocopec.cl 2025)',
    precio: 'Conveniencia', moneda: false, trueque: false, almacen: true },
  { id: 'b-pueblito-cosmito', tipo: 'artesano', icon: '🪑', nombre: 'Pueblito de Cosmito — Cooperativa de Mueblistas', rubro: 'hogar', sector: 'Cosmito / Ruta 150',
    direccion: 'Ruta 150 km 4, sector Cosmito', horario: 'Verificar vigencia en terreno (fuente 2019)', contacto: 'Cooperativa de Mueblistas de Cosmito Ltda.', redes: '',
    desc: 'Polo comercial de 14 mueblistas con madera nativa, cafetería y talleres artísticos, financiado por el Comité de Desarrollo Productivo Biobío. (Fuente: Revista NOS 2019 — verificar si sigue activo)',
    precio: 'Según mueble', moneda: false, trueque: false },
  { id: 'b-pencofrozen', tipo: 'negocio', icon: '🧊', nombre: 'Pen-co-frozen (congelados a domicilio)', rubro: 'alimentos', sector: 'Toda la comuna / a domicilio',
    direccion: 'Cochrane s/n, Penco', horario: 'Entregas todos los días desde las 19:00 (previo pago)', contacto: '96 667 0957 · supercongeladopenco@gmail.com', redes: 'pencofrozen.webnode.cl',
    desc: 'Comercializadora y distribuidora penquina de congelados y alimentos: reparto gratis en Penco sobre $10.000; a Concepción–Talcahuano–San Pedro–Hualpén sobre $15.000. (Fuente: web propia)',
    precio: 'Mayorista y detalle', moneda: false, trueque: false, almacen: true },
  { id: 'b-mar-cerroverde', tipo: 'emprendimiento', icon: '🦀', nombre: 'Puestos de mariscos — Cerro Verde Bajo', rubro: 'mar', sector: 'Cerro Verde',
    direccion: 'Cerro Verde Bajo, ingreso norte al Puerto de Lirquén', horario: 'Diurno (puestos tradicionales)', contacto: 'Asoc. Gremial Productos del Mar (pdta. María Isabel Henríquez)', redes: '',
    desc: 'Puestos de mariscos y restaurantes del ingreso al puerto: nuevo estacionamiento municipal 2026 (demolición de casa abandonada + maquinaria DP World) los potencia como polo gastronómico. (Fuente: Sabes.cl 2026)',
    precio: 'Precio de caleta', moneda: false, trueque: false },
  /* ---- COMERCIOS TARJETA JOVEN + GASTRONOMÍA EXTRA (redes publicadas por el municipio) ---- */
  { id: 'b-cafeteria-dye', tipo: 'negocio', icon: '☕', nombre: 'Cafetería D&E', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Yerbas Buenas 180, Penco', horario: 'Mañana 07:30–11:00 · Tarde 17:00–21:30 (verificar)', contacto: 'Por confirmar', redes: 'Instagram: @cafeteriadye',
    desc: 'Cafetería de barrio adherida a Tarjeta Joven (10% descuento). (Fuente: penco.cl/tarjeta-joven 2025)',
    precio: 'Cafetería', moneda: false, trueque: false },
  { id: 'b-la-cafetera', tipo: 'negocio', icon: '☕', nombre: 'La Cafetera', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Maipú #501, Local C, Penco', horario: 'Lun–Vie 08:30–21:00 · Sáb 10:00–21:00 · Dom y festivos 16:00–21:00 (verificar)', contacto: '56 9 6613 6878', redes: 'Instagram: @lacafetera.penco',
    desc: 'Café adherido a Tarjeta Joven (15% descuento). (Fuente: penco.cl/tarjeta-joven 2025)',
    precio: 'Cafetería', moneda: false, trueque: false },
  { id: 'b-lomo-aleman', tipo: 'negocio', icon: '🌭', nombre: 'Lomo Alemán Penco', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Maipú 10, Penco', horario: 'Lun–Jue 13:00–22:00 · Vie–Dom 13:00–23:00 (verificar)', contacto: '56 9 4046 5717', redes: 'Instagram: @lomoaleman.penco',
    desc: 'Comida rápida adherida a Tarjeta Joven (10% en compras presenciales). (Fuente: penco.cl/tarjeta-joven 2025)',
    precio: 'Comida rápida', moneda: false, trueque: false },
  { id: 'b-nomade-sushi', tipo: 'negocio', icon: '🍣', nombre: 'Nómade Sushi', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Freire 190, frente al Liceo Pencopolitano', horario: 'Lun–Dom 12:00–23:25 (verificar)', contacto: '56 9 8645 5922', redes: 'salonnomadepenco.cl',
    desc: 'Sushi penquino adherido a Tarjeta Joven. (Fuente: penco.cl/tarjeta-joven 2025)',
    precio: 'Sushi', moneda: false, trueque: false },
  { id: 'b-galeria-gourmet', tipo: 'negocio', icon: '🍔', nombre: 'Galería Gourmet (Edificio Fanaloza)', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Calle Penco 125, Edificio Patrimonial Sindicato Fanaloza', horario: 'Mañana 08:30–13:30 · Tarde 16:00–medianoche (verificar)', contacto: 'Por confirmar', redes: 'Ver locales en penco.cl/tarjeta-joven',
    desc: 'Espacio gourmet en edificio patrimonial adherido a Tarjeta Joven (10% descuento). (Fuente: penco.cl/tarjeta-joven 2025)',
    precio: 'Variado', moneda: false, trueque: false },
  { id: 'b-mi-serviteca', tipo: 'oficio', icon: '🚗', nombre: 'Mi Serviteca', rubro: 'reparacion', sector: 'Lirquén',
    direccion: 'Infante 202, Penco–Lirquén', horario: 'Lun–Vie 09:00–18:00 · Sáb 09:00–13:00 (verificar)', contacto: 'Por confirmar', redes: 'Instagram: @miservitecapenco',
    desc: 'Servicio automotor adherido a Tarjeta Joven (15% descuento). (Fuente: penco.cl/tarjeta-joven 2025)',
    precio: 'Según servicio', moneda: false, trueque: false },
  { id: 'b-rincon-marino', tipo: 'negocio', icon: '🍽️', nombre: 'Restaurant Rincón Marino', rubro: 'mar', sector: 'Lirquén',
    direccion: 'Pedro Aguirre Cerda 171, Lirquén', horario: 'Por confirmar', contacto: '41 238 4547', redes: '',
    desc: 'Restaurante marino registrado en SERNATUR. (Fuente: serviciosturisticos.sernatur.cl)',
    precio: 'Por confirmar', moneda: false, trueque: false },
  { id: 'b-muebles-cosmito', tipo: 'artesano', icon: '🪑', nombre: 'Muebles Cosmito (madera nativa a medida)', rubro: 'hogar', sector: 'Cosmito / Ruta 150',
    direccion: 'Los Arrayanes 135, Penco', horario: 'Visitas al taller (coordinar)', contacto: '56 9 6836 9871 · contacto@mueblescosmito.cl', redes: 'mueblescosmito.cl',
    desc: 'Taller de muebles de madera nativa a medida con décadas de tradición en el polo mueblista de Cosmito. (Fuente: web propia mueblescosmito.cl)',
    precio: 'Según mueble', moneda: false, trueque: false },
  /* ---- CUENTAS APORTADAS POR LA COMUNIDAD (contacto = su Instagram) ---- */
  { id: 'u-tejeryrebrotar', tipo: 'emprendimiento', icon: '🌱', nombre: 'Tejer y Rebrotar — huertas Penco', rubro: 'campo', sector: 'Penco Centro',
    direccion: 'Penco (confirmar ubicación en su Instagram)', horario: 'Por confirmar', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @tejeryrebrotar.huertaspenco',
    desc: 'Huertas y tejido en Penco: rebrote, siembra y oficios textiles. (Cuenta aportada por la comunidad — verifica horarios y dirección en su Instagram)',
    precio: 'A convenir', moneda: false, trueque: true },
  { id: 'u-sebart', tipo: 'oficio', icon: '🖋️', nombre: 'Sebart Tattoo', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Penco (confirmar estudio en su Instagram)', horario: 'Con agenda (escribir por Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @sebart_tattoo',
    desc: 'Tatuador en Penco: diseños y sesiones con agenda. (Cuenta aportada por la comunidad — verifica estilos y disponibilidad en su Instagram)',
    precio: 'Según diseño', moneda: false, trueque: false },
  { id: 'u-xarl', tipo: 'oficio', icon: '🖋️', nombre: 'Xarl Tattoos', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Penco (confirmar estudio en su Instagram)', horario: 'Con agenda (escribir por Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @xarl_tattoos',
    desc: 'Tatuajes en Penco. (Cuenta aportada por la comunidad — verifica estilos y disponibilidad en su Instagram)',
    precio: 'Según diseño', moneda: false, trueque: false },
  { id: 'u-naico', tipo: 'artesano', icon: '🏺', nombre: 'Naico - Greda de Penco', rubro: 'arte', sector: 'Cosmito / Ruta 150',
    direccion: 'La Greda, Penco (confirmar en su Instagram)', horario: 'Por confirmar', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @naico_gredapenco',
    desc: 'Artesanía en greda de Penco, La Greda. (Cuenta aportada por la comunidad — verifica trabajos, encargos y valores en su Instagram)',
    precio: 'A convenir', moneda: false, trueque: false },
  { id: 'u-tayul', tipo: 'artesano', icon: '🎨', nombre: 'Tayul Molina', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Penco (confirmar en su Instagram)', horario: 'Encargos (escribir por Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @tayul_molina',
    desc: 'Artesanía penquina. (Cuenta aportada por la comunidad — verifica trabajos, encargos y valores en su Instagram)',
    precio: 'A convenir', moneda: false, trueque: false },
  { id: 'u-trenzas', tipo: 'oficio', icon: '💇', nombre: 'Trenzas con Intención', rubro: 'belleza', sector: 'Penco Centro',
    direccion: 'Penco (confirmar en su Instagram)', horario: 'Con hora (escribir por Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @trenzas_con_intencion',
    desc: 'Trenzado con intención en Penco. (Cuenta aportada por la comunidad — verifica estilos, valores y horas en su Instagram)',
    precio: 'Según trenzado', moneda: false, trueque: false },
  { id: 'u-dulces', tipo: 'emprendimiento', icon: '🍬', nombre: 'Dulces Tierra de Penko', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Penco (confirmar en su Instagram)', horario: 'Encargos (escribir por Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @dulces_tierradepenko',
    desc: 'Dulcería penquina por encargo. (Cuenta aportada por la comunidad — verifica catálogo y pedidos en su Instagram)',
    precio: 'Según pedido', moneda: false, trueque: false },
  { id: 'u-dolcecam', tipo: 'emprendimiento', icon: '🍰', nombre: 'Dolce Cam Penco', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Penco (confirmar en su Instagram)', horario: 'Encargos (escribir por Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @dolcecam_penco',
    desc: 'Pastelería y dulces por encargo en Penco. (Cuenta aportada por la comunidad — verifica catálogo y pedidos en su Instagram)',
    precio: 'Según pedido', moneda: false, trueque: false },
  { id: 'u-cafegaleria', tipo: 'negocio', icon: '☕', nombre: 'Café Galería', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Penco (confirmar dirección en su Instagram)', horario: 'Por confirmar', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @_cafegaleria_',
    desc: 'Café con galería en Penco. (Cuenta aportada por la comunidad — verifica carta, horarios y dirección en su Instagram)',
    precio: 'Cafetería', moneda: false, trueque: false },
  { id: 'u-nuxtram', tipo: 'oficio', icon: '🏠', nombre: 'Espacio Ñuxtram (nütram: conversación)', rubro: 'salud', sector: 'Penco Centro',
    direccion: 'Penco (confirmar en su Instagram)', horario: 'Según actividades (ver historias)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @espacio_nuxtram',
    desc: 'Espacio comunitario-cultural en Penco. (Cuenta aportada por la comunidad — verifica actividades y dirección en su Instagram)',
    precio: 'A convenir', moneda: false, trueque: true },
  { id: 'u-archivo', tipo: 'emprendimiento', icon: '📸', nombre: 'Archivo Salvaje', rubro: 'arte', sector: 'Penco Centro',
    direccion: 'Penco (confirmar en su Instagram)', horario: 'Encargos (escribir por Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @archivo.salvaje',
    desc: 'Archivo visual / fotografía salvaje del territorio. (Cuenta aportada por la comunidad — verifica servicios en su Instagram)',
    precio: 'A convenir', moneda: false, trueque: false },
  { id: 'u-ajedrez', tipo: 'curso', icon: '♟️', nombre: 'Club de Ajedrez Penco', rubro: 'deporte', sector: 'Playa Negra / Borde',
    direccion: 'Playa Negra 1, Penco', horario: 'Reuniones y torneos (consultar)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @clubajedrezpenco',
    desc: 'Club con personalidad jurídica del IND: juego, clases y torneos con jugadores rankeados (AJEFECH). Conecta con la sección ♟️ Ajedrez de la app. (Fuentes: Registro 19862, AJEDREZ-CL)',
    precio: 'Consultar', moneda: false, trueque: false },
  { id: 'u-biobird', tipo: 'emprendimiento', icon: '🦅', nombre: 'Biobird — turismo náutico', rubro: 'deporte', sector: 'Lirquén',
    direccion: 'Bahía de Concepción (confirmar zarpe en su Instagram)', horario: 'Salidas programadas (ver Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @biobird.turismonautico',
    desc: 'Turismo náutico y avistamiento de aves en la bahía. Conecta con 🦅 Aves y 🎣 Pesca de la app. (Cuenta aportada por la comunidad — verifica rutas y valores en su Instagram)',
    precio: 'Según salida', moneda: false, trueque: false },
  { id: 'u-kayak', tipo: 'curso', icon: '🛶', nombre: 'Club de Kayak Penco', rubro: 'deporte', sector: 'Playa Negra / Borde',
    direccion: 'Borde costero (confirmar base en su Instagram)', horario: 'Salidas y clases (ver Instagram)', contacto: 'Por confirmar (escribir por Instagram)', redes: 'Instagram: @clubkayakpenco',
    desc: 'Kayak de mar en la Bahía de Concepción: salidas y formación con seguridad. Revisa 🌊 Mareas antes de salir. (Cuenta aportada por la comunidad — verifica base y horarios en su Instagram)',
    precio: 'Según salida', moneda: false, trueque: false },
  /* ---- BONO PATRIMONIAL VERIFICADO EN PRENSA ---- */
  { id: 'b-riffo', tipo: 'negocio', icon: '🥖', nombre: 'Panadería Riffo — conejito dulce patrimonial', rubro: 'alimentos', sector: 'Penco Centro',
    direccion: 'Pleno centro de Penco, a metros de la playa y la Plaza (2° local en Lirquén)', horario: 'Lun–Vie colaciones + fin de semana (confirmar)', contacto: 'Por confirmar', redes: '',
    desc: 'Ícono del comercio local: el conejito dulce (receta de fines de 1940, marca registrada, patrimonio y comida típica 2022) a $350. 26 trabajadores entre Penco (20) y Lirquén (6), +350 conejitos diarios. (Fuente: Diario Concepción 2025)',
    precio: 'Popular ($350 el conejito)', moneda: false, trueque: false }
];
function dynBase() {
  try {
    var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.negocios;
    if (d) {
      if (Array.isArray(d)) return d;
      if (Array.isArray(d.base)) return d.base;
    }
  } catch (e) {}
  return NEGOCIOS_BASE;
}

/* ---------- store privado ---------- */
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { mios: [], favs: {}, visitas: [] };
    if (!u.negociosPenco) u.negociosPenco = { mios: [], favs: {}, visitas: [] };
    var r = u.negociosPenco;
    if (!Array.isArray(r.mios)) r.mios = [];
    if (!r.favs || Array.isArray(r.favs)) r.favs = {};
    if (!Array.isArray(r.visitas)) r.visitas = [];
    return r;
  } catch (e) { return { mios: [], favs: {}, visitas: [] }; }
}
function todos() {
  var base = dynBase().map(function (t) { t.oficial = true; return t; });
  var mios = store().mios.map(function (t) { t.oficial = false; return t; });
  return base.concat(mios);
}
function porId(id) {
  var all = todos();
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}
function monedaOn() {
  try { return !!(window.MonedaSocial && typeof window.MonedaSocial.unidad === 'function'); } catch (e) { return false; }
}

/* ---------- llevar al calendario (visita / clase / encargo) ---------- */
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
function llevarAlCalendario(t, fechaVal, horaVal, conAviso, motivo) {
  if (!t) return;
  var fecha = (fechaVal || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert('Elige una fecha válida.'); return; }
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : '10:00';
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[' + (motivo || 'Economía local') + '] ' + t.nombre + (t.direccion ? ' · ' + t.direccion : (t.sector ? ' · ' + t.sector : '')), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n[Eco local] ' + texto + ' ' + hhmm : '[Eco local] ' + texto + ' ' + hhmm;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) {
      try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {}
    }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  try {
    store().visitas.push({ id: uid('ev'), negId: t.id, nombre: t.nombre, tipo: t.tipo, fecha: fecha, hora: hhmm, motivo: motivo || 'visita', notify: !!conAviso, creado: todayKey() });
  } catch (e) {}
  save('📌 Agregado al calendario ✓');
  try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch (e2) {}
  try { render(); } catch (e3) {}
}

/* ---------- diálogo ---------- */
/* Subsecciones nuevas (reorg 2026): Inicio | Comer | Comprar | Crear | Aprender | Míos | Guía.
   - Comer: rubros mar + alimentos NO almacén (restaurantes, caletas, cafés, ferias comida, panadería Riffo).
   - Comprar: almacenes/minimarkets (almacen=true) + ferias de abastecimiento.
   - Crear: tipos emprendimiento + artesano + oficio.
   - Aprender: tipo curso.
   - Míos: favoritos + visitas + fichas propias (antes "Favoritos y míos").
   Compat: tabs viejos dir->inicio, almacenes->comprar, oficios->crear, cursos->aprender, favs->mios. */
var ecoTab = 'inicio';
var ecoQuery = '', ecoCat = 'todas', ecoSector = 'todos', ecoSoloMoneda = false, ecoSoloTrueque = false, ecoSoloAlmacen = false;
var ecoEditId = null;
/* Vistas distintas + paginación por páginas cortas */
var ecoView = 'cards'; /* cards | list | sectors */
var ecoPage = 1;
var ECO_PAGE_SIZE = 6;
var ecoExpanded = {};
var ECO_TABS_LABEL = { inicio: '🏠 Inicio', negocios: '🏪 Negocios', emprendimientos: '🌱 Emprendimientos', artesanos: '🎨 Artesanos', oficios: '🔧 Oficios', cursos: '📚 Cursos', moneda: '🪙 Moneda Social', mios: '⭐ Míos', guia: '🧭 Guía' };
/* Subcategoría = tipo; dentro de cada tipo, los rubros que correspondan (solo se muestran los que tienen fichas). */
var TAB_TIPO = { negocios: 'negocio', emprendimientos: 'emprendimiento', artesanos: 'artesano', oficios: 'oficio', cursos: 'curso' };
var RUBROS_POR_TIPO = {
  negocio: ['alimentos', 'mar', 'hogar', 'reparacion', 'salud', 'belleza', 'ropa', 'transporte', 'tecnologia', 'campo', 'arte', 'musica', 'deporte', 'educacion', 'otro'],
  emprendimiento: ['alimentos', 'mar', 'campo', 'arte', 'ropa', 'hogar', 'salud', 'belleza', 'deporte', 'musica', 'tecnologia', 'transporte', 'educacion', 'reparacion', 'otro'],
  artesano: ['arte', 'ropa', 'hogar', 'musica', 'belleza', 'campo', 'mar', 'alimentos', 'salud', 'deporte', 'tecnologia', 'transporte', 'educacion', 'reparacion', 'otro'],
  oficio: ['reparacion', 'hogar', 'mar', 'campo', 'transporte', 'salud', 'belleza', 'tecnologia', 'alimentos', 'ropa', 'arte', 'musica', 'deporte', 'educacion', 'otro'],
  curso: ['educacion', 'deporte', 'arte', 'musica', 'campo', 'mar', 'alimentos', 'hogar', 'salud', 'tecnologia', 'ropa', 'belleza', 'transporte', 'reparacion', 'otro']
};
function ecoNormalizeTab(t) {
  if (!t) return 'inicio';
  if (t === 'dir') return 'inicio';
  if (t === 'comer' || t === 'comprar' || t === 'almacenes') return 'negocios';
  if (t === 'crear') return 'emprendimientos';
  if (t === 'aprender') return 'cursos';
  if (t === 'oficios') return 'oficios';
  if (t === 'cursos') return 'cursos';
  if (t === 'moneda' || t === 'moneda-social' || t === 'monedasocial') return 'moneda';
  if (t === 'salud') return 'oficios';
  if (t === 'favs') return 'mios';
  if (ECO_TABS_LABEL[t]) return t;
  return 'inicio';
}
function ecoResetPage() { ecoPage = 1; ecoExpanded = {}; }

function ensureDialog() {
  var d = $('negociosDialog');
  if (d) {
    if (!$('tabNegEmp') || !$('tabNegMoneda') || !$('negMonList') || !$('negViewCards') || !$('negHomeBox') || !$('negEmpList') || !$('negSoloAlmacen') || !$('negFilterCard')) { try { d.remove(); } catch (e) {} d = null; _wired = false; }
    else return d;
  }
  d = document.createElement('dialog');
  d.id = 'negociosDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🏪 Economía Local — Penco</h3>' +
    '<button type="button" id="negCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Economía viva <b>de la comuna</b> en 6 subsecciones: 🏪 Negocios · 🌱 Emprendimientos · 🎨 Artesanos · 🔧 Oficios (incluye 💚 Salud) · 📚 Cursos · 🪙 Moneda Social. Parte en 🏠 Inicio y cambia de vista 📇/📋/🗂️ para explorar por partes. Agrega fichas con <b>datos verificados</b>; queda <b>privado y local</b>.</p>' +
    '<div id="negHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="timer-tabs" style="margin:10px 0;flex-wrap:wrap">' +
    '<button type="button" id="tabNegDir" class="btn btn-accent" style="width:auto">🏠 Inicio</button>' +
    '<button type="button" id="tabNegNeg" class="btn" style="width:auto">🏪 Negocios</button>' +
    '<button type="button" id="tabNegEmp" class="btn" style="width:auto">🌱 Emprendimientos</button>' +
    '<button type="button" id="tabNegArt" class="btn" style="width:auto">🎨 Artesanos</button>' +
    '<button type="button" id="tabNegOficios" class="btn" style="width:auto">🔧 Oficios</button>' +
    '<button type="button" id="tabNegCursos" class="btn" style="width:auto">📚 Cursos</button>' +
    '<button type="button" id="tabNegMoneda" class="btn" style="width:auto">🪙 Moneda Social</button>' +
    '<button type="button" id="tabNegFavs" class="btn" style="width:auto">⭐ Míos</button>' +
    '<button type="button" id="tabNegGuia" class="btn" style="width:auto">🧭 Guía</button>' +
    '</div>' +
    '<div class="menstrual-card" style="margin-bottom:10px;padding:8px 10px"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
    '<span class="muted" style="font-size:11px">Vista:</span>' +
    '<button type="button" id="negViewCards" class="btn" style="width:auto;font-size:11px">📇 Por rubro</button>' +
    '<button type="button" id="negViewList" class="btn" style="width:auto;font-size:11px">📋 Lista</button>' +
    '<button type="button" id="negViewSectors" class="btn" style="width:auto;font-size:11px">🗂️ Sectores</button>' +
    '<span class="muted" style="font-size:10px" id="negViewHint"></span></div></div>' +
    '<div id="negFilterCard" class="menstrual-card"><h4>🔍 Buscar y filtrar</h4>' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="negSearch" placeholder="ej: pan, costura, gasfiter, cueca, miel..." maxlength="60" autocomplete="off"></label>' +
    '<label>Rubro <select id="negCat"><option value="todas">Todos</option></select></label>' +
    '<label>Sector <select id="negSector"><option value="todos">Todos</option></select></label></div>' +
    '<div class="conv-row" style="margin-top:6px"><label class="check-row" style="margin:0"><input type="checkbox" id="negSoloMoneda"> 🪙 Moneda social</label>' +
    '<label class="check-row" style="margin:0"><input type="checkbox" id="negSoloTrueque"> 🔄 Trueque</label>' +
    '<label class="check-row" style="margin:0"><input type="checkbox" id="negSoloAlmacen"> 🏪 Almacén</label></div>' +
    '<p class="muted" style="font-size:11px;margin:4px 0 0" id="negCount"></p></div>' +
    '<div id="negDirPanel" style="margin-top:10px">' +
    '<div id="negHomeBox"></div>' +
    '<div id="negList" style="margin-top:10px"></div>' +
    '</div>' +
    '<div id="negEmpPanel" class="hidden" style="margin-top:10px"><div id="negEmpList"></div></div>' +
    '<div id="negArtPanel" class="hidden" style="margin-top:10px"><div id="negArtList"></div></div>' +
    '<div id="negOficiosPanel" class="hidden" style="margin-top:10px"><div id="negOficiosList"></div></div>' +
    '<div id="negCursosPanel" class="hidden" style="margin-top:10px"><div id="negCursosList"></div></div>' +
    '<div id="negMonPanel" class="hidden" style="margin-top:10px"><div id="negMonList"></div></div>' +
    '<div id="negFavsPanel" class="hidden" style="margin-top:10px"><div id="negFavsList"></div></div>' +
    '<div id="negGuiaPanel" class="hidden" style="margin-top:10px"><div id="negGuiaList"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>➕ Agregar negocio / emprendimiento / artesano / oficio / curso</h4>' +
    '<p class="muted" style="font-size:11px">Suma lo que existe hoy en Penco con datos verificados. Elige el <b>tipo</b> y el <b>rubro</b> que corresponda: la ficha aparece en su subsección. Queda en tu dispositivo.</p>' +
    '<div class="conv-row"><label>Tipo * <select id="negFTipo"><option value="negocio">🏪 Negocio</option><option value="emprendimiento">🌱 Emprendimiento</option><option value="artesano">🎨 Artesano/a</option><option value="oficio">🔧 Oficio</option><option value="curso">📚 Curso / Formación</option></select></label>' +
    '<label>Rubro <select id="negFRubro"></select></label>' +
    '<label>Icono <input type="text" id="negFIcon" maxlength="4" style="width:70px;text-align:center" value="🏪"></label></div>' +
    '<label>Nombre * <input type="text" id="negFNombre" placeholder="ej: Panadería Los Hornos / Miel Primer Agua" maxlength="60"></label>' +
    '<label>Qué ofrece <input type="text" id="negFDesc" placeholder="qué vende o hace, especialidad, qué llevar" maxlength="140"></label>' +
    '<div class="conv-row"><label>Sector <select id="negFSector"></select></label>' +
    '<label>Dirección / referencia <input type="text" id="negFDir" placeholder="ej: Freire 452, frente a plaza" maxlength="60"></label></div>' +
    '<div class="conv-row"><label>Horario <input type="text" id="negFDias" placeholder="ej: Lun–Sáb 9:00–19:00" maxlength="50"></label>' +
    '<label>Precio ref. <input type="text" id="negFPrecio" placeholder="ej: desde $2.000 / a convenir" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Contacto <input type="text" id="negFContacto" placeholder="ej: +56 9 ... / @cuenta (con permiso)" maxlength="60"></label>' +
    '<label>Redes / link <input type="text" id="negFRedes" placeholder="ej: instagram.com/... (opcional)" maxlength="80"></label></div>' +
    '<div class="conv-row"><label class="check-row" style="margin:0"><input type="checkbox" id="negFMoneda"> 🪙 Acepta moneda social</label>' +
    '<label class="check-row" style="margin:0"><input type="checkbox" id="negFTrueque"> 🔄 Acepta trueque</label>' +
    '<label class="check-row" style="margin:0"><input type="checkbox" id="negFAlmacen"> 🏪 Es almacén / minimarket de barrio</label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="negFSave" class="btn btn-accent" style="width:auto">+ Guardar</button>' +
    '<button type="button" id="negFCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="negClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}

function tipoNombre(t) { return TIPOS[t] || TIPOS.negocio; }
function catNombre(c) { return CATS[c] || CATS.otro; }

/* Ficha compacta: 1 línea + expandible. Muestra 1 ficha abierta a la vez. */
function ecoBadges(t) {
  var b = '';
  if (t.moneda) b += ' <span class="chip" style="font-size:10px;color:#e8c56a;border-color:#e8c56a55">🪙</span>';
  if (t.trueque) b += ' <span class="chip" style="font-size:10px;color:#8fd694;border-color:#8fd69455">🔄</span>';
  if (t.almacen) b += ' <span class="chip" style="font-size:10px;color:#9fc2ee;border-color:#9fc2ee55">🏪</span>';
  return b;
}
/* Links operativos en 1 clic: urls, @instagram, emails, teléfonos chilenos y mapa.
   Se aplica a contacto/redes/dirección: lo no publicado ("Por confirmar") queda como texto. */
function linkify(s) {
  var t = esc(s == null ? '' : s);
  if (!t) return '';
  var stash = [];
  function keep(html) { stash.push(html); return '\\x01' + (stash.length - 1) + '\\x01'; }
  t = t.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, function (m) {
    return keep('<a href="mailto:' + m + '">' + m + '</a>');
  });
  t = t.replace(/(\+?\d[\d\s.\-()]{6,}\d)/g, function (m) {
    var d = m.replace(/\D/g, '');
    if (/^0\d{9}$/.test(d)) d = d.slice(1);
    if (/^56\d{9}$/.test(d)) return keep('<a href="tel:+' + d + '">' + esc(m) + '</a>');
    if (/^\d{9}$/.test(d)) return keep('<a href="tel:+56' + d + '">' + esc(m) + '</a>');
    return m;
  });
  t = t.replace(/((?:https?:\/\/)?(?:[A-Za-z0-9-]+\.)+(?:cl|com|net|org|ee|es|dev|app|io|info|me)(?:\/[^\s<·,;()]*)?)/g, function (m) {
    var href = /^https?:\/\//i.test(m) ? m : 'https://' + m;
    var label = m.replace(/^https?:\/\//i, '');
    if (label.length > 42) label = label.slice(0, 40) + '…';
    return keep('<a href="' + href + '" target="_blank" rel="noopener">' + label + '</a>');
  });
  t = t.replace(/(^|[\s(:>])(@[A-Za-z0-9._]{2,30})/g, function (m, pre, h) {
    var user = h.slice(1).replace(/\.+$/, '');
    return pre + keep('<a href="https://instagram.com/' + user + '" target="_blank" rel="noopener">' + h + '</a>');
  });
  t = t.replace(/\\x01(\d+)\\x01/g, function (m, i) { return stash[+i]; });
  return t;
}
function mapsLink(texto) {
  var t = texto == null ? '' : String(texto);
  if (!t || /confirmar/i.test(t) || /online \(penco\)/i.test(t)) return '📍 ' + esc(t || 'Por confirmar');
  var q = encodeURIComponent(t + ', Penco, Chile');
  return '<a href="https://www.google.com/maps/search/?api=1&query=' + q + '" target="_blank" rel="noopener">📍 ' + esc(t) + '</a>';
}
function cardDetailInner(t, fav, vis) {
  var html = (t.desc ? '<p style="font-size:12px;line-height:1.5">' + esc(t.desc) + '</p>' : '') +
    '<p class="muted" style="font-size:11px;line-height:1.6">' + mapsLink(t.direccion || t.sector || 'Por confirmar') + (t.horario ? '<br>🕐 ' + esc(t.horario) : '') + (t.precio ? '<br>💰 ' + esc(t.precio) : '') + (t.contacto ? '<br>📞 ' + linkify(t.contacto) : '') + (t.redes ? '<br>🔗 ' + linkify(t.redes) : '') + '</p>' +
    '<div class="conv-row" style="align-items:flex-end">' +
    '<label>Fecha <input type="date" data-neg-fecha="' + t.id + '" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" data-neg-hora="' + t.id + '" value="10:00" style="max-width:110px"></label>' +
    '<label class="check-row" style="margin:0;white-space:nowrap" title="Avisar a esa hora"><input type="checkbox" data-neg-aviso="' + t.id + '"> 🔔</label></div>' +
    '<div class="conv-row" style="margin-top:4px"><label>Motivo <select data-neg-motivo="' + t.id + '"><option value="visita">📌 Visita / compra</option><option value="encargo">📦 Encargo / pedido</option><option value="clase">📚 Clase / curso</option><option value="cotizar">💰 Cotizar</option></select></label>' +
    '<button type="button" class="btn btn-accent" data-neg-add="' + t.id + '" style="width:auto;align-self:flex-end">📌 Calendario</button></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn" data-neg-fav="' + t.id + '" style="width:auto;font-size:11px">' + (fav ? '★ Favorito' : '☆ Favorito') + '</button>' +
    '<button type="button" class="btn" data-neg-share="' + t.id + '" style="width:auto;font-size:11px">📤 Compartir</button>';
  if (!t.oficial) {
    html += '<button type="button" class="btn" data-neg-edit="' + t.id + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn" data-neg-del="' + t.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button>';
  }
  html += '</div>';
  return html;
}
function cardHTML(t, mode) {
  var st = store();
  var fav = !!st.favs[t.id];
  var vis = st.visitas.filter(function (x) { return x.negId === t.id; }).length;
  mode = mode || ecoView || 'cards';
  if (mode === 'list') {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
      '<span style="min-width:0"><b style="font-size:12px">' + esc(t.icon || '🏪') + ' ' + esc(t.nombre) + '</b>' + ecoBadges(t) + (fav ? ' ★' : '') +
      '<br><span class="muted" style="font-size:10px">' + esc(t.sector || '') + ' · ' + esc(catNombre(t.rubro)) + (t.precio ? ' · ' + esc(t.precio) : '') + (vis ? ' · 📌' + vis : '') + '</span></span>' +
      '<span style="display:flex;gap:6px;flex:0 0 auto"><button type="button" class="btn" data-neg-toggle="' + t.id + '" style="width:auto;font-size:11px">👁 Ver</button>' +
      '<button type="button" class="btn" data-neg-fav="' + t.id + '" style="width:auto;font-size:11px">' + (fav ? '★' : '☆') + '</button></span></div>' +
      (ecoExpanded[t.id] ? '<div class="si-card" style="margin:-6px 0 8px;border-color:#d4af3766">' + cardDetailInner(t, fav, vis) + '</div>' : '');
  }
  var open = !!ecoExpanded[t.id];
  var html = '<details class="si-card" style="padding:8px 10px;border-color:#d4af3766"' + (open ? ' open' : '') + ' data-neg-details="' + t.id + '">' +
    '<summary style="cursor:pointer;font-size:12.5px;line-height:1.4"><b>' + esc(t.icon || '🏪') + ' ' + esc(t.nombre) + '</b>' + ecoBadges(t) + (fav ? ' ★' : '') +
    '<br><span class="muted" style="font-size:10px;font-weight:normal">' + esc(tipoNombre(t.tipo)) + ' · ' + esc(catNombre(t.rubro)) + ' · ' + esc(t.sector || '') + (vis ? ' · 📌' + vis : '') + '</span></summary>' +
    '<div style="margin-top:8px">' + cardDetailInner(t, fav, vis) + '</div></details>';
  return html;
}

function pasaFiltros(t, q, soloTipos) {
  if (soloTipos && soloTipos.indexOf(t.tipo) < 0) return false;
  if (ecoCat !== 'todas' && t.rubro !== ecoCat) return false;
  if (ecoSector !== 'todos' && t.sector !== ecoSector) return false;
  if (ecoSoloMoneda && !t.moneda) return false;
  if (ecoSoloTrueque && !t.trueque) return false;
  if (ecoSoloAlmacen && !t.almacen) return false;
  if (q) {
    var txt = ((t.nombre || '') + ' ' + (t.desc || '') + ' ' + (t.direccion || '') + ' ' + (t.sector || '') + ' ' + (t.contacto || '') + ' ' + (t.horario || '')).toLowerCase();
    if (txt.indexOf(q) < 0) return false;
  }
  return true;
}

function bindToggle(scope) {
  if (!scope) return;
  scope.querySelectorAll('[data-neg-toggle]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-neg-toggle');
      ecoExpanded[id] = !ecoExpanded[id];
      render();
    };
  });
  scope.querySelectorAll('[data-neg-details]').forEach(function (d) {
    d.ontoggle = function () {
      try { ecoExpanded[d.getAttribute('data-neg-details')] = d.open; } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-eco-goto]').forEach(function (b) {
    b.onclick = function () { switchTab(b.getAttribute('data-eco-goto')); };
  });
  scope.querySelectorAll('[data-eco-page]').forEach(function (b) {
    b.onclick = function () {
      var p = parseInt(b.getAttribute('data-eco-page'), 10);
      if (!isNaN(p) && p >= 1) { ecoPage = p; render(); try { $('negociosDialog').scrollTop = 0; } catch (e) {} }
    };
  });
  scope.querySelectorAll('[data-eco-more]').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-eco-more');
      ecoExpanded[k] = !ecoExpanded[k];
      render();
    };
  });
}
function bindCards(scope) {
  if (!scope) return;
  bindToggle(scope);
  scope.querySelectorAll('[data-neg-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-neg-add');
      var t = porId(id); if (!t) return;
      var f = (scope.querySelector('[data-neg-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (scope.querySelector('[data-neg-hora="' + id + '"]') || {}).value || '10:00';
      var av = !!(scope.querySelector('[data-neg-aviso="' + id + '"]') || {}).checked;
      var mo = (scope.querySelector('[data-neg-motivo="' + id + '"]') || {}).value || 'visita';
      llevarAlCalendario(t, f, h, av, mo);
    };
  });
  scope.querySelectorAll('[data-neg-fav]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-neg-fav');
      var st = store();
      if (st.favs[id]) delete st.favs[id]; else st.favs[id] = true;
      save(st.favs[id] ? '★ Favorito' : 'Quitado de favoritos');
      render();
    };
  });
  scope.querySelectorAll('[data-neg-share]').forEach(function (b) {
    b.onclick = async function () {
      var t = porId(b.getAttribute('data-neg-share')); if (!t) return;
      var txt = (t.icon || '🏪') + ' ' + t.nombre + ' — ' + tipoNombre(t.tipo) + ' · ' + catNombre(t.rubro) +
        '\n📍 ' + (t.direccion || t.sector || '') + (t.horario ? '\n🕐 ' + t.horario : '') +
        (t.precio ? '\n💰 ' + t.precio : '') + (t.desc ? '\n' + t.desc : '') +
        (t.contacto ? '\n📞 ' + t.contacto : '') +
        ((t.moneda || t.trueque) ? '\n' + (t.moneda ? '🪙 Acepta moneda social ' : '') + (t.trueque ? '🔄 Acepta trueque' : '') : '') +
        '\n— Economía local Penco';
      await share(t.nombre + ' — Penco', txt);
    };
  });
  scope.querySelectorAll('[data-neg-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta ficha? (Tus visitas agendadas se conservan como compromisos del día)')) return;
      var st = store();
      st.mios = st.mios.filter(function (x) { return x.id !== b.getAttribute('data-neg-del'); });
      save('Borrado'); render();
    };
  });
  scope.querySelectorAll('[data-neg-edit]').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      var t = st.mios.filter(function (x) { return x.id === b.getAttribute('data-neg-edit'); })[0];
      if (!t) return;
      ecoEditId = t.id;
      $('negFTipo').value = t.tipo || 'negocio';
      $('negFRubro').value = t.rubro || 'otro';
      $('negFIcon').value = t.icon || '🏪';
      $('negFNombre').value = t.nombre || '';
      $('negFDesc').value = t.desc || '';
      $('negFSector').value = t.sector || SECTORES[0];
      $('negFDir').value = t.direccion || '';
      $('negFDias').value = t.horario || '';
      $('negFPrecio').value = t.precio || '';
      $('negFContacto').value = t.contacto || '';
      $('negFRedes').value = t.redes || '';
      $('negFMoneda').checked = !!t.moneda;
      $('negFTrueque').checked = !!t.trueque;
      $('negFAlmacen').checked = !!t.almacen;
      $('negFSave').textContent = '↻ Actualizar';
      $('negFCancel').classList.remove('hidden');
      try { $('negFNombre').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    };
  });
}

function ecoPagerHTML(total, label) {
  var pages = Math.max(1, Math.ceil(total / ECO_PAGE_SIZE));
  if (ecoPage > pages) ecoPage = pages;
  if (pages <= 1) return '<p class="muted" style="font-size:10px;margin:6px 0 0">' + total + ' ' + (label || 'fichas') + ' · sin más páginas</p>';
  var h = '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px">';
  h += '<button type="button" class="btn" data-eco-page="' + (ecoPage - 1) + '" style="width:auto;font-size:11px"' + (ecoPage <= 1 ? ' disabled' : '') + '>◀</button>';
  h += '<span class="muted" style="font-size:11px">Pág. ' + ecoPage + ' / ' + pages + ' · ' + total + ' ' + (label || 'fichas') + '</span>';
  h += '<button type="button" class="btn" data-eco-page="' + (ecoPage + 1) + '" style="width:auto;font-size:11px"' + (ecoPage >= pages ? ' disabled' : '') + '>▶</button></div>';
  return h;
}
function ecoSlice(list) {
  var pages = Math.max(1, Math.ceil(list.length / ECO_PAGE_SIZE));
  if (ecoPage > pages) ecoPage = pages;
  if (ecoPage < 1) ecoPage = 1;
  return list.slice((ecoPage - 1) * ECO_PAGE_SIZE, ecoPage * ECO_PAGE_SIZE);
}
function ecoGroupBySector(list) {
  var g = {};
  list.forEach(function (t) { var s = t.sector || 'Sin sector'; (g[s] = g[s] || []).push(t); });
  var orden = SECTORES.filter(function (s) { return g[s]; });
  Object.keys(g).forEach(function (s) { if (orden.indexOf(s) < 0) orden.push(s); });
  return orden.map(function (s) { return { sector: s, items: g[s] }; });
}
/* Subcategoría por tipo: agrupa las fichas del tipo en sus rubros (solo rubros con fichas). */
function ecoFiltradasTipo(tipo) {
  var q = (ecoQuery || '').toLowerCase().trim();
  return todos().filter(function (t) {
    if (t.tipo !== tipo) return false;
    return pasaFiltros(t, q, null);
  });
}
function renderTipoInto(boxId, tipo, titulo, vacioBase) {
  var box = $(boxId); if (!box) return;
  var list = ecoFiltradasTipo(tipo);
  var total = todos().length;
  var viewName = ecoView === 'list' ? '📋 Lista' : ecoView === 'sectors' ? '🗂️ Sectores' : '📇 Por rubro';
  var head = '<div class="menstrual-card"><h4>' + titulo + ' · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:10px">Vista <b>' + esc(viewName) + '</b> · cada rubro se abre aparte. Toca el título para abrir la ficha. Marca <b>☆</b> para tu lista corta.</p>';
  if (!list.length) {
    box.innerHTML = head + (total === 0
      ? '<p class="muted" style="font-size:11px;line-height:1.55">' + vacioBase + '</p>'
      : '<p class="muted">Sin resultados. Prueba otra búsqueda o agrega la ficha abajo en ➕ eligiendo tipo <b>' + esc(tipoNombre(tipo)) + '</b>.</p>') + '</div>';
    bindCards(box);
    return;
  }
  var body = '';
  if (ecoView === 'sectors') {
    var groups = ecoGroupBySector(list);
    body = groups.map(function (g) {
      var inner = ecoSlice(g.items).map(function (t) { return cardHTML(t, 'cards'); }).join('');
      return '<details class="menstrual-details"' + (groups.length === 1 ? ' open' : '') + '><summary>📍 ' + esc(g.sector) + ' · ' + g.items.length + '</summary>' + inner +
        (g.items.length > ECO_PAGE_SIZE ? '<p class="muted" style="font-size:10px">Mostrando ' + ecoSlice(g.items).length + ' de ' + g.items.length + '.</p>' : '') + '</details>';
    }).join('');
    body += ecoPagerHTML(list.length, 'fichas');
  } else if (ecoView === 'list') {
    body = ecoSlice(list).map(function (t) { return cardHTML(t, 'list'); }).join('') + ecoPagerHTML(list.length, 'fichas');
  } else {
    /* 📇 Por rubro: una subsección colapsable por rubro, en el orden que corresponde al tipo */
    var orden = RUBROS_POR_TIPO[tipo] || Object.keys(CATS);
    var grupos = [];
    orden.forEach(function (r) {
      var items = list.filter(function (t) { return (t.rubro || 'otro') === r; });
      if (items.length) grupos.push({ rubro: r, items: items });
    });
    /* rubros fuera de catálogo (por si acaso) al final */
    list.forEach(function (t) {
      var r = t.rubro || 'otro';
      if (orden.indexOf(r) < 0 && !grupos.some(function (g) { return g.rubro === r; })) {
        grupos.push({ rubro: r, items: list.filter(function (x) { return (x.rubro || 'otro') === r; }) });
      }
    });
    body = grupos.map(function (g, i) {
      var key = 'more_' + tipo + '_' + g.rubro;
      var abierto = !!ecoExpanded[key];
      var vis = abierto ? g.items : g.items.slice(0, ECO_PAGE_SIZE);
      var nota = '';
      if (g.rubro === 'alimentos' && ecoSector !== 'todos' && ALMACENES_NOTA[ecoSector]) {
        nota = '<p class="muted" style="font-size:11px;line-height:1.55">' + esc(ALMACENES_NOTA[ecoSector]) + '</p>';
      }
      return '<details class="menstrual-details"' + (grupos.length === 1 || i === 0 ? ' open' : '') + '><summary>' + esc(catNombre(g.rubro)) + ' · ' + g.items.length + '</summary>' + nota +
        vis.map(function (t) { return cardHTML(t, 'cards'); }).join('') +
        (g.items.length > ECO_PAGE_SIZE ? '<button type="button" class="btn" data-eco-more="' + key + '" style="width:auto;font-size:11px;margin-top:6px">' + (abierto ? '▲ Mostrar menos' : '▼ Ver las ' + g.items.length + ' fichas') + '</button>' : '') + '</details>';
    }).join('');
  }
  box.innerHTML = head + body + '</div>';
  bindCards(box);
}
function ecoCounts() {
  var all = todos();
  function nTipo(t) { return all.filter(function (x) { return x.tipo === t; }).length; }
  return {
    total: all.length,
    negocio: nTipo('negocio'), emprendimiento: nTipo('emprendimiento'),
    artesano: nTipo('artesano'), oficio: nTipo('oficio'), curso: nTipo('curso'),
    moneda: all.filter(function (t) { return t.moneda; }).length,
    trueque: all.filter(function (t) { return t.trueque; }).length,
    almacen: all.filter(function (t) { return t.almacen; }).length,
    mios: store().mios.length, favs: Object.keys(store().favs || {}).filter(function (k) { return store().favs[k]; }).length
  };
}
function renderHome() {
  var box = $('negHomeBox'); if (!box) return;
  if (ecoTab !== 'inicio') { box.innerHTML = ''; return; }
  var c = ecoCounts();
  var card = function (tab, icon, t, d, n) {
    return '<button type="button" data-eco-goto="' + tab + '" class="si-card" style="flex:1 1 140px;text-align:left;cursor:pointer">' +
      '<b style="font-size:12px">' + icon + ' ' + t + ' · ' + n + '</b><br><span class="muted" style="font-size:10px">' + d + '</span></button>';
  };
  box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🏠 Economía Local por tipo · ' + c.total + ' fichas</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.55">Cada tipo trae sus rubros adentro: abre la subsección y luego el rubro que buscas. Todo sigue privado y offline.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
    card('negocios', '🏪', 'Negocios', 'Comer, abasto, servicios', c.negocio) +
    card('emprendimientos', '🌱', 'Emprendimientos', 'Comida, campo, arte', c.emprendimiento) +
    card('artesanos', '🎨', 'Artesanos', 'Arte, textil, madera', c.artesano) +
    card('oficios', '🔧', 'Oficios', 'Reparación, salud, mar', c.oficio) +
    card('cursos', '📚', 'Cursos', 'Formación y talleres', c.curso) +
    card('moneda', '🪙', 'Moneda Social', 'Billetera, ofertas y red', '→') +
    card('mios', '⭐', 'Míos', c.favs + ' fav · ' + c.mios + ' propias', c.favs + c.mios) +
    card('guia', '🧭', 'Guía', 'Qué mapear por sector', '→') +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><span class="chip">🪙 ' + c.moneda + ' moneda social</span><span class="chip">🔄 ' + c.trueque + ' trueque</span><span class="chip">🏪 ' + c.almacen + ' almacenes</span></div></div>';
  bindToggle(box);
}

/* ---------- SECCIÓN 🪙 MONEDA SOCIAL (dentro de Economía Local) ---------- */
/* Sección completa integrada: usa window.MonedaSocial como fuente única
   (sin duplicar datos). Muestra billetera, ofertas/pedidos, últimas
   transacciones, negocios que aceptan la moneda y guía mínima. */
function monData() {
  try {
    if (window.MonedaSocial && typeof window.MonedaSocial.store === 'function') {
      var s = window.MonedaSocial.store() || {};
      return {
        ok: true,
        cuenta: (typeof window.MonedaSocial.cuenta === 'function') ? window.MonedaSocial.cuenta() : (s.cuenta || {}),
        balance: (typeof window.MonedaSocial.balance === 'function') ? window.MonedaSocial.balance() : 0,
        unidad: (typeof window.MonedaSocial.unidad === 'function') ? window.MonedaSocial.unidad() : 'Lafken',
        ofertas: Array.isArray(s.ofertas) ? s.ofertas : [],
        txs: Array.isArray(s.txs) ? s.txs : [],
        tratos: Array.isArray(s.tratos) ? s.tratos : [],
        acuerdos: (s.acuerdos && typeof s.acuerdos === 'object') ? s.acuerdos : {}
      };
    }
  } catch (e) {}
  return { ok: false, cuenta: {}, balance: 0, unidad: 'Lafken', ofertas: [], txs: [], tratos: [], acuerdos: {} };
}
function monOpen(tab) {
  try {
    if (window.MonedaSocial && typeof window.MonedaSocial.open === 'function') { window.MonedaSocial.open(tab || 'guia'); return; }
  } catch (e) {}
  alert('La sección 🪙 Moneda Social aún se está cargando. Cierra y reabre en unos segundos.');
}
function renderMoneda() {
  var box = $('negMonList'); if (!box) return;
  if (ecoTab !== 'moneda') { box.innerHTML = ''; return; }
  var m = monData();
  var conMoneda = todos().filter(function (t) { return t.moneda; });
  var c = m.cuenta || {};
  var simb = c.simb || 'Lf';
  var unidad = c.unidad || m.unidad || 'Lafken';
  var bal = Number(m.balance) || 0;
  var tope = (c.tope === undefined || c.tope === null) ? -50 : Number(c.tope);
  var colBal = bal < tope ? '#e76e8a' : (bal < 0 ? '#e8c56a' : '#8fd694');
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🪙 Moneda Social — dentro de Economía Local</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.55">Unidad de cuenta propia del territorio para intercambiar sin depender solo del peso. Los tratos se cierran <b>en persona</b>; aquí vive el registro <b>privado y local</b>. Esta sección es la puerta de entrada: el módulo completo vive en <b>🪙 Moneda Social</b>.</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
    '<button type="button" class="btn btn-accent" data-mon-open="guia" style="width:auto;font-size:11px">📖 Abrir guía</button>' +
    '<button type="button" class="btn" data-mon-open="billetera" style="width:auto;font-size:11px">🪙 Mi Billetera</button>' +
    '<button type="button" class="btn" data-mon-open="ofertas" style="width:auto;font-size:11px">📋 Ofertas</button>' +
    '<button type="button" class="btn" data-mon-open="tx" style="width:auto;font-size:11px">💸 Transacciones</button>' +
    '<button type="button" class="btn" data-mon-open="acuerdos" style="width:auto;font-size:11px">🤝 Acuerdos</button></div></div>';
  /* 1. Mi billetera (resumen) */
  if (!m.ok) {
    html += '<div class="menstrual-card"><h4>🪙 Mi billetera</h4><p class="muted" style="font-size:11px">Módulo de moneda social cargando… Si no abre, recarga la app.</p>' +
      '<button type="button" class="btn btn-accent" data-mon-open="billetera" style="width:auto;font-size:11px">🪙 Abrir Moneda Social</button></div>';
  } else if (!c.nombre) {
    html += '<div class="menstrual-card" style="border-color:#e8c56a88"><h4>🪙 Mi billetera — sin cuenta aún</h4>' +
      '<p class="muted" style="font-size:11px;line-height:1.55">Aún no abres tu cuenta. Se abre en 1 minuto: nombre, moneda (ej: Lafken), símbolo y tope de confianza (sugerido −50 U).</p>' +
      '<button type="button" class="btn btn-accent" data-mon-open="billetera" style="width:auto;font-size:11px">🪙 Crear mi cuenta</button></div>';
  } else {
    var entradas = m.txs.filter(function (t) { return Number(t.monto) > 0; }).reduce(function (a, t) { return a + Number(t.monto); }, 0);
    var salidas = m.txs.filter(function (t) { return Number(t.monto) < 0; }).reduce(function (a, t) { return a + Math.abs(Number(t.monto)); }, 0);
    html += '<div class="menstrual-card"><h4>🪙 Mi billetera · ' + esc(c.nombre) + '</h4>' +
      '<p style="font-size:15px"><b style="color:' + colBal + '">' + esc(simb + ' ' + (Math.round(bal * 100) / 100)) + ' ' + esc(unidad) + '</b></p>' +
      '<p class="muted" style="font-size:11px">Recibido +' + esc(String(Math.round(entradas * 100) / 100)) + ' · Entregado −' + esc(String(Math.round(salidas * 100) / 100)) + ' · Tope ' + esc(String(tope)) + ' · ' + m.ofertas.length + ' oferta(s) · ' + m.txs.length + ' transacción(es)</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn btn-accent" data-mon-open="billetera" style="width:auto;font-size:11px">🪙 Ver billetera</button>' +
      '<button type="button" class="btn" data-mon-open="tx" style="width:auto;font-size:11px">💸 Registrar pago/cobro</button></div></div>';
  }
  /* 2. Ofertas y pedidos en moneda social */
  html += '<details class="menstrual-details" open><summary>📋 Ofertas y pedidos en moneda · ' + m.ofertas.length + '</summary>';
  if (!m.ok || !m.ofertas.length) {
    html += '<p class="muted" style="font-size:11px;line-height:1.55">Aún no hay ofertas en moneda social. La semilla de la red es <b>1 oferta + 1 pedido por persona</b> (ej: pan amasado, clases, flete, cuidados).</p>' +
      '<button type="button" class="btn btn-accent" data-mon-open="ofertas" style="width:auto;font-size:11px">➕ Publicar la primera</button>';
  } else {
    var of = m.ofertas.slice().sort(function (a, b) { return String(b.creado || '').localeCompare(String(a.creado || '')); }).slice(0, 6);
    html += of.map(function (o) {
      var chip = o.tipo === 'ofrezco' ? '🙌 Ofrezco' : '🙏 Necesito';
      return '<div class="si-card" style="padding:8px 10px"><b style="font-size:12px">' + chip + ' · ' + esc(o.titulo || '') + '</b>' +
        '<br><span class="muted" style="font-size:10px">' + esc(o.cat || '') + (o.precio ? ' · 💰 ' + esc(o.precio) + ' ' + esc(simb) : '') + (o.trueque ? ' · 🔄' : '') + (o.mixto ? ' · 💵 mixto' : '') + '</span>' +
        (o.detalle ? '<br><span style="font-size:11px">' + esc(o.detalle) + '</span>' : '') + '</div>';
    }).join('') +
      (m.ofertas.length > 6 ? '<p class="muted" style="font-size:10px">Mostrando 6 de ' + m.ofertas.length + '.</p>' : '') +
      '<button type="button" class="btn" data-mon-open="ofertas" style="width:auto;font-size:11px">📋 Ver todas / publicar</button>';
  }
  html += '</details>';
  /* 3. Últimas transacciones */
  html += '<details class="menstrual-details"><summary>💸 Últimas transacciones · ' + m.txs.length + '</summary>';
  if (!m.txs.length) {
    html += '<p class="muted" style="font-size:11px">Sin movimientos. Ej: recibí 10 por pan → +10; pagué 8 por corte → −8.</p>';
  } else {
    var txs = m.txs.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 6);
    html += txs.map(function (t) {
      var n = Number(t.monto) || 0;
      var col = n >= 0 ? '#8fd694' : '#e8a06a';
      return '<div class="habit-item"><span><b style="color:' + col + '">' + (n >= 0 ? '+' : '') + esc(String(Math.round(n * 100) / 100)) + ' ' + esc(simb) + '</b> · ' + esc(t.concepto || '') +
        '<br><span class="muted" style="font-size:10px">' + esc(t.fecha || '') + (t.contraparte ? ' · ' + esc(t.contraparte) : '') + '</span></span></div>';
    }).join('') +
      (m.txs.length > 6 ? '<p class="muted" style="font-size:10px">Mostrando 6 de ' + m.txs.length + '.</p>' : '');
  }
  html += '<div style="margin-top:6px"><button type="button" class="btn" data-mon-open="tx" style="width:auto;font-size:11px">💸 Abrir transacciones</button></div></details>';
  /* 4. Negocios que aceptan moneda social */
  html += '<details class="menstrual-details" open><summary>🏪 Aceptan 🪙 en Economía Local · ' + conMoneda.length + '</summary>' +
    '<p class="muted" style="font-size:11px">Cuando una ficha acepta la moneda, se marca con 🪙 y aparece aquí y en el módulo de Moneda Social. Pregunta siempre en persona antes de pagar.</p>';
  if (!conMoneda.length) {
    html += '<p class="muted" style="font-size:11px">Aún no hay fichas con 🪙. Marca <b>“Acepta moneda social”</b> al agregar o editar una ficha (➕ de abajo) y aparecerá aquí.</p>';
  } else {
    html += ecoSlice(conMoneda).map(function (t) { return cardHTML(t, 'cards'); }).join('') + ecoPagerHTML(conMoneda.length, 'fichas con 🪙');
  }
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn" data-mon-filter style="width:auto;font-size:11px">🔍 Ver solo 🪙 en Negocios</button></div></details>';
  /* 5. Guía mínima + acuerdos */
  var nAcu = Object.keys(m.acuerdos || {}).filter(function (k) { return m.acuerdos[k]; }).length;
  html += '<details class="menstrual-details"><summary>📖 Guía mínima + acuerdos · ' + nAcu + '/5</summary>' +
    '<div class="si-card"><h4>🪙 ¿Qué es?</h4><p>Unidad de cuenta propia del territorio para intercambiar bienes, saberes y cuidados sin depender solo del peso. Registro de quién dio y quién recibió, con reglas acordadas en persona.</p></div>' +
    '<div class="si-card"><h4>🤝 Reglas base</h4><p>1) La moneda la sostiene la red · 2) Todo trato es voluntario y se anota · 3) Saldo puede ser negativo hasta el tope · 4) Precios justos, sin especulación · 5) Balances visibles en asamblea · 6) Se sale saldando o compensando.</p></div>' +
    '<div class="si-card"><h4>⚖️ Equivalencia punto de partida</h4><p>1 hora de oficio o cuidado = <b>10 U</b> · docena de huevos = 4–6 U · pan amasado (6 un.) = 3–5 U · almuerzo = 8–12 U · corte de pelo = 8 U · flete corto = 10–15 U. La asamblea define las finales.</p></div>' +
    '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn" data-mon-open="guia" style="width:auto;font-size:11px">📖 Guía completa</button>' +
    '<button type="button" class="btn" data-mon-open="acuerdos" style="width:auto;font-size:11px">🤝 Ver acuerdos (' + nAcu + '/5)</button></div></details>';
  box.innerHTML = html;
  bindCards(box);
  box.querySelectorAll('[data-mon-open]').forEach(function (b) {
    b.onclick = function () { monOpen(b.getAttribute('data-mon-open')); };
  });
  var bf = box.querySelector('[data-mon-filter]');
  if (bf) bf.onclick = function () {
    ecoSoloMoneda = true; ecoResetPage();
    switchTab('negocios');
  };
}

/* ---------- NOTAS DE ABASTO POR SECTOR ---------- */
/* Contexto por sector (verificado 2025–2026): orienta el mapeo sin
   inventar nombres. Se muestra en el rubro 🥘 Alimentos de Negocios y Emprendimientos. */
var ALMACENES_NOTA = {
  'Penco Centro': 'Eje Freire–El Roble–Penco: aquí está el supermercado independiente más grande de la comuna (Don Gabito, Lun–Dom 09:00–medianoche) conviviendo con almacenes de barrio. Verifica horarios puerta a puerta.',
  'Lirquén': 'El incendio de enero 2026 quemó 4 locales del centro (pastelería, ferretería, clínica dental, restorán) y afectó al Barrio Chino: varios almacenes están reabriendo en 2026 con apoyo Walmart/Desafío Levantemos Chile. Compra aquí para levantarlos.',
  'Cerro Verde': 'Tesis UdeC (Geografía) estudió 6 almacenes de Cerro Verde como conectores sociales del barrio: el almacén aquí es identidad, no solo comercio. Registra sus nombres y horarios con permiso.',
  'Playa Negra / Borde': 'Borde costero sin almacenes catastrados en la base: mapea quioscos y minimarkets de paso hacia la playa.',
  'Cosmito / Ruta 150': 'Villa La Greda y eje Ruta 150: minimarkets de barrio + Pronto Copec Cosmito. El Pueblito de Cosmito (Ruta 150 km 4) es polo mueblista, no almacén.',
  'Zona Rural Este': 'Primer Agua y Roa: mapea almacenes de camino y venta directa de chacra (huevos, miel, pan).',
  'Toda la comuna / a domicilio': 'Repartos a domicilio (ej: congelados Pen-co-frozen, gratis sobre $10.000 en Penco).',
  'Online (Penco)': 'Ventas por redes con entrega en la comuna: pide catálogo por mensaje.'
};
function renderFavs() {
  var box = $('negFavsList'); if (!box) return;
  if (ecoTab !== 'mios') { box.innerHTML = ''; return; }
  var st = store();
  var favIds = Object.keys(st.favs || {}).filter(function (k) { return st.favs[k]; });
  var favs = favIds.map(porId).filter(Boolean);
  var html = '<details class="menstrual-details" open><summary>⭐ Favoritos · ' + favs.length + '</summary>' +
    (favs.length ? ecoSlice(favs).map(function (t) { return cardHTML(t); }).join('') + ecoPagerHTML(favs.length, 'favoritos') : '<p class="muted" style="font-size:11px">Aún no marcas favoritos. Toca ☆ en cualquier ficha.</p>') + '</details>';
  var vis = st.visitas.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora).localeCompare(String(b.hora)); });
  html += '<details class="menstrual-details"><summary>📌 Mis visitas / encargos / clases · ' + vis.length + '</summary>' +
    '<p class="muted" style="font-size:11px">Ya están como compromisos 🕐 en tu calendario. Aquí los ves todos juntos.</p>' +
    (vis.length ? vis.slice(0, 10).map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(r.nombre) + '</b> <span class="chip" style="font-size:10px">' + esc(r.motivo || 'visita') + '</span><br><span class="muted" style="font-size:11px">📅 ' + esc(r.fecha) + ' · 🕐 ' + esc(r.hora) + (r.notify ? ' · 🔔' : '') + '</span></span>' +
        '<button type="button" class="btn" data-visdel="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div>';
    }).join('') + (vis.length > 10 ? '<p class="muted" style="font-size:10px">Mostrando 10 de ' + vis.length + ' (los próximos primero).</p>' : '') : '<p class="muted" style="font-size:11px">Sin visitas agendadas. Agenda una desde 🏪/🌱/🎨/🔧/📚.</p>') +
    (vis.length ? '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" id="negVisShare" class="btn" style="width:auto">📤 Compartir mi lista</button><button type="button" id="negVisClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar lista</button></div>' : '') + '</details>';
  html += '<details class="menstrual-details"><summary>📋 Mis fichas agregadas · ' + st.mios.length + '</summary>' +
    (st.mios.length ? st.mios.slice(0, ECO_PAGE_SIZE).map(function (t) { return cardHTML(t); }).join('') + '<p class="muted" style="font-size:10px">Mostrando hasta ' + ECO_PAGE_SIZE + ' fichas en esta vista.</p>' : '<p class="muted" style="font-size:11px">Aún no agregas fichas. Hazlo en ➕ de abajo.</p>') + '</details>';
  box.innerHTML = html;
  bindCards(box);
  box.querySelectorAll('[data-visdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Quitar de la lista? (El compromiso del día se conserva; bórralo en el día si quieres)')) return;
      var s2 = store();
      s2.visitas = s2.visitas.filter(function (x) { return x.id !== b.getAttribute('data-visdel'); });
      save('Quitado'); render();
    };
  });
  var sh = $('negVisShare');
  if (sh) sh.onclick = async function () {
    var s2 = store();
    var txt = s2.visitas.map(function (r) { return '• ' + r.fecha + ' ' + r.hora + ' [' + (r.motivo || 'visita') + '] ' + r.nombre; }).join('\n');
    await share('Mis visitas — Economía Penco', txt || 'Sin visitas');
  };
  var cl = $('negVisClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar toda tu lista de visitas? (Los compromisos del calendario se conservan)')) return;
    store().visitas = [];
    save('Lista borrada'); render();
  };
}

function renderGuia() {
  var box = $('negGuiaList'); if (!box) return;
  box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧭 Guía de rubros por sector — qué mapear</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.55">No trae nombres inventados: es una brújula para salir a registrar la economía real con datos verificados. Registra nombre, horario, dirección y contacto <b>con permiso del negocio</b>.</p>' +
    RUBROS_GUIA.map(function (g) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + g.icon + ' ' + esc(g.sector) + '</h4><p style="font-size:11px;line-height:1.55">' + esc(g.rubros) + '</p></div>';
    }).join('') +
    '<div class="si-card" style="padding:8px 10px;border-color:var(--gold)"><h4 style="font-size:12px">🤝 Consejos de mapeo vecinal</h4><p style="font-size:11px;line-height:1.6">1) Pide permiso y explica que es un directorio vecinal offline. 2) Foto del horario pegado en la puerta (la mejor fuente). 3) Pregunta si acepta 🪙 moneda social o 🔄 trueque. 4) Actualiza 1 vez por luna: lo que cierra y lo que abre.</p></div></div>';
}

function paintViewBtns() {
  var m = { cards: $('negViewCards'), list: $('negViewList'), sectors: $('negViewSectors') };
  Object.keys(m).forEach(function (k) { if (m[k]) m[k].classList.toggle('btn-accent', ecoView === k); });
  var h = $('negViewHint');
  if (h) h.textContent = ecoView === 'list' ? 'rápida para comparar' : ecoView === 'sectors' ? 'agrupada por barrio' : 'por rubro, un grupo abierto a la vez';
}
function switchTab(t) {
  ecoTab = ecoNormalizeTab(t);
  ecoResetPage();
  var map = {
    inicio: ['negDirPanel', 'tabNegDir'],
    negocios: ['negDirPanel', 'tabNegNeg'],
    emprendimientos: ['negEmpPanel', 'tabNegEmp'],
    artesanos: ['negArtPanel', 'tabNegArt'],
    oficios: ['negOficiosPanel', 'tabNegOficios'],
    cursos: ['negCursosPanel', 'tabNegCursos'],
    moneda: ['negMonPanel', 'tabNegMoneda'],
    mios: ['negFavsPanel', 'tabNegFavs'],
    guia: ['negGuiaPanel', 'tabNegGuia']
  };
  /* inicio y negocios comparten negDirPanel (portada + lista) */
  var showDir = (ecoTab === 'inicio' || ecoTab === 'negocios');
  Object.keys(map).forEach(function (k) {
    var p = $(map[k][0]), b = $(map[k][1]);
    if (map[k][0] === 'negDirPanel') { if (p) p.classList.toggle('hidden', !showDir); }
    else if (p) p.classList.toggle('hidden', k !== ecoTab);
    if (b) b.classList.toggle('btn-accent', k === ecoTab);
  });
  var fc = $('negFilterCard');
  if (fc) fc.classList.toggle('hidden', !(ecoTab === 'negocios' || ecoTab === 'emprendimientos' || ecoTab === 'artesanos' || ecoTab === 'oficios' || ecoTab === 'cursos' || ecoTab === 'moneda'));
  paintViewBtns();
  render();
}

function paintHoy() {
  var b = $('negHoyBox'); if (!b) return;
  try {
    var st = store();
    var hk = todayKey();
    var deHoy = st.visitas.filter(function (x) { return x.fecha === hk; });
    var nMon = todos().filter(function (t) { return t.moneda; }).length;
    b.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px"><span><b>🏪 Hoy — ' + esc((function () { try { return cal.fmtFull.format(new Date()); } catch (e) { return hk; } })()) + '</b></span><span class="chip">' + todos().length + ' fichas · 🪙 ' + nMon + ' con moneda social</span></div>' +
      (deHoy.length ? deHoy.map(function (r) { return '<div class="chip" style="display:block;margin-top:6px">🕐 ' + esc(r.hora) + ' · <b>' + esc(r.nombre) + '</b> [' + esc(r.motivo || 'visita') + ']</div>'; }).join('')
        : '<p class="muted" style="font-size:11px;margin-top:6px">Hoy no tienes visitas agendadas.' + (todos().length ? ' Elige una ficha y pulsa <b>📌 Calendario</b>.' : ' ¡Agrega la primera ficha abajo!') + '</p>');
  } catch (e) {}
}

function fillSelects() {
  var c = $('negCat');
  if (c && c.options.length <= 1) Object.keys(CATS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = CATS[k]; c.appendChild(o); });
  var s = $('negSector');
  if (s && s.options.length <= 1) SECTORES.forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; s.appendChild(o); });
  var fr = $('negFRubro');
  if (fr && !fr.options.length) Object.keys(CATS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = CATS[k]; fr.appendChild(o); });
  var fs = $('negFSector');
  if (fs && !fs.options.length) SECTORES.forEach(function (v) { var o = document.createElement('option'); o.value = v; o.textContent = v; fs.appendChild(o); });
}

function render() {
  if (!$('negociosDialog')) return;
  ecoTab = ecoNormalizeTab(ecoTab);
  fillSelects();
  paintHoy();
  paintViewBtns();
  var c = $('negCat'); if (c && c.value !== ecoCat) c.value = ecoCat;
  var s = $('negSector'); if (s && s.value !== ecoSector) s.value = ecoSector;
  var q = $('negSearch'); if (q && q.value !== ecoQuery && document.activeElement !== q) q.value = ecoQuery;
  var sm = $('negSoloMoneda'); if (sm) sm.checked = !!ecoSoloMoneda;
  var st2 = $('negSoloTrueque'); if (st2) st2.checked = !!ecoSoloTrueque;
  var sa = $('negSoloAlmacen'); if (sa) sa.checked = !!ecoSoloAlmacen;
  renderHome();
  /* subcategoría por tipo: cada tab muestra su tipo con sus rubros adentro */
  if (ecoTab === 'negocios') {
    renderTipoInto('negList', 'negocio', '🏪 Negocios',
      'Aún no hay negocios. Suma el primero en ➕ con tipo Negocio y su rubro.');
  } else if ($('negList')) $('negList').innerHTML = '';
  if (ecoTab === 'emprendimientos') {
    renderTipoInto('negEmpList', 'emprendimiento', '🌱 Emprendimientos',
      'Aún no hay emprendimientos. Súmalos en ➕ con tipo Emprendimiento y su rubro.');
  } else if ($('negEmpList')) $('negEmpList').innerHTML = '';
  if (ecoTab === 'artesanos') {
    renderTipoInto('negArtList', 'artesano', '🎨 Artesanos/as',
      'Aquí vivirán quienes crean con las manos. Agrégalos en ➕ con tipo Artesano/a y su rubro.');
  } else if ($('negArtList')) $('negArtList').innerHTML = '';
  if (ecoTab === 'oficios') {
    renderTipoInto('negOficiosList', 'oficio', '🔧 Oficios (incluye 💚 Salud)',
      'Gasfitería, electricidad, pesca artesanal, costura, tattoo, salud y cuidado... Agrégalos en ➕ con tipo Oficio y su rubro.');
  } else if ($('negOficiosList')) $('negOficiosList').innerHTML = '';
  if (ecoTab === 'cursos') {
    renderTipoInto('negCursosList', 'curso', '📚 Cursos y formación',
      'Cursos y talleres con inscripción. Agrégalos en ➕ con tipo Curso y su rubro. Para llevar una clase a tu día usa 📌 Calendario con motivo "clase".');
  } else if ($('negCursosList')) $('negCursosList').innerHTML = '';
  var ct = $('negCount');
  if (ct) {
    var tt = TAB_TIPO[ecoTab];
    var enVista = tt ? ecoFiltradasTipo(tt).length : todos().length;
    var n = todos().length, nm = todos().filter(function (t) { return t.moneda; }).length, nt = todos().filter(function (t) { return t.trueque; }).length, na = todos().filter(function (t) { return t.almacen; }).length;
    ct.textContent = enVista + ' en esta vista / ' + n + ' fichas · 🪙 ' + nm + ' · 🔄 ' + nt + ' · 🏪 ' + na + ' almacenes';
  }
  renderFavs();
  renderGuia();
  renderMoneda();
}

function open(tab) {
  ensureDialog();
  wireOnce();
  fillSelects();
  switchTab(tab || ecoTab || 'inicio');
  openDlg('negociosDialog');
}

var _wired = false;
function wireOnce() {
  if (_wired) {
    try { paintViewBtns(); } catch (e) {}
    return;
  }
  _wired = true;
  var ct = $('negCloseTop'), cb = $('negClose');
  if (ct) ct.onclick = function () { try { $('negociosDialog').close(); } catch (e) {} };
  if (cb) cb.onclick = function () { try { $('negociosDialog').close(); } catch (e) {} };
  var tD = $('tabNegDir'), tN = $('tabNegNeg'), tE = $('tabNegEmp'), tAr = $('tabNegArt'), tO = $('tabNegOficios'), tC = $('tabNegCursos'), tM = $('tabNegMoneda'), tF = $('tabNegFavs'), tG = $('tabNegGuia');
  if (tD) tD.onclick = function () { switchTab('inicio'); };
  if (tN) tN.onclick = function () { switchTab('negocios'); };
  if (tE) tE.onclick = function () { switchTab('emprendimientos'); };
  if (tAr) tAr.onclick = function () { switchTab('artesanos'); };
  if (tO) tO.onclick = function () { switchTab('oficios'); };
  if (tC) tC.onclick = function () { switchTab('cursos'); };
  if (tM) tM.onclick = function () { switchTab('moneda'); };
  if (tF) tF.onclick = function () { switchTab('mios'); };
  if (tG) tG.onclick = function () { switchTab('guia'); };
  var vC = $('negViewCards'), vL = $('negViewList'), vS = $('negViewSectors');
  if (vC) vC.onclick = function () { ecoView = 'cards'; ecoResetPage(); render(); };
  if (vL) vL.onclick = function () { ecoView = 'list'; ecoResetPage(); render(); };
  if (vS) vS.onclick = function () { ecoView = 'sectors'; ecoResetPage(); render(); };
  var q = $('negSearch');
  if (q) q.addEventListener('input', function () { ecoQuery = q.value; ecoPage = 1; render(); });
  var c = $('negCat');
  if (c) c.onchange = function () { ecoCat = c.value; ecoResetPage(); render(); };
  var s = $('negSector');
  if (s) s.onchange = function () { ecoSector = s.value; ecoResetPage(); render(); };
  var sm = $('negSoloMoneda');
  if (sm) sm.onchange = function () { ecoSoloMoneda = sm.checked; ecoResetPage(); render(); };
  var stt = $('negSoloTrueque');
  if (stt) stt.onchange = function () { ecoSoloTrueque = stt.checked; ecoResetPage(); render(); };
  var sal = $('negSoloAlmacen');
  if (sal) sal.onchange = function () { ecoSoloAlmacen = sal.checked; ecoResetPage(); render(); };
  var sv = $('negFSave');
  if (sv) sv.onclick = function () {
    var nombre = clean(($('negFNombre') || {}).value, 60).trim();
    if (!nombre) { alert('Ponle nombre a la ficha'); return; }
    var tipo = ($('negFTipo') || {}).value || 'negocio';
    var icons = { negocio: '🏪', emprendimiento: '🌱', artesano: '🎨', oficio: '🔧', curso: '📚' };
    var rec = {
      tipo: tipo,
      rubro: ($('negFRubro') || {}).value || 'otro',
      icon: clean(($('negFIcon') || {}).value, 4) || icons[tipo] || '🏪',
      nombre: nombre,
      desc: clean(($('negFDesc') || {}).value, 140),
      sector: ($('negFSector') || {}).value || SECTORES[0],
      direccion: clean(($('negFDir') || {}).value, 60),
      horario: clean(($('negFDias') || {}).value, 50),
      precio: clean(($('negFPrecio') || {}).value, 30),
      contacto: clean(($('negFContacto') || {}).value, 60),
      redes: clean(($('negFRedes') || {}).value, 80),
      moneda: !!($('negFMoneda') || {}).checked,
      trueque: !!($('negFTrueque') || {}).checked,
      almacen: !!($('negFAlmacen') || {}).checked
    };
    var st = store();
    if (ecoEditId) {
      var ed = st.mios.filter(function (x) { return x.id === ecoEditId; })[0];
      if (ed) Object.keys(rec).forEach(function (k) { ed[k] = rec[k]; });
      ecoEditId = null;
      $('negFSave').textContent = '+ Guardar';
      $('negFCancel').classList.add('hidden');
      save('Actualizado ✓');
    } else {
      rec.id = uid('neg');
      st.mios.push(rec);
      save('Ficha guardada 🏪');
    }
    ['negFNombre', 'negFDesc', 'negFDir', 'negFDias', 'negFPrecio', 'negFContacto', 'negFRedes'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
    var m = $('negFMoneda'); if (m) m.checked = false;
    var t2 = $('negFTrueque'); if (t2) t2.checked = false;
    var a2 = $('negFAlmacen'); if (a2) a2.checked = false;
    var _tabPorTipo = { negocio: 'negocios', emprendimiento: 'emprendimientos', artesano: 'artesanos', oficio: 'oficios', curso: 'cursos' };
    switchTab(_tabPorTipo[rec.tipo] || 'inicio');
  };
  var cn = $('negFCancel');
  if (cn) cn.onclick = function () {
    ecoEditId = null;
    $('negFSave').textContent = '+ Guardar';
    cn.classList.add('hidden');
    ['negFNombre', 'negFDesc', 'negFDir', 'negFDias', 'negFPrecio', 'negFContacto', 'negFRedes'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
  };
  var ft = $('negFTipo');
  if (ft) ft.onchange = function () {
    var icons = { negocio: '🏪', emprendimiento: '🌱', artesano: '🎨', oficio: '🔧', curso: '📚' };
    var ic = $('negFIcon');
    if (ic && icons[ft.value]) ic.value = icons[ft.value];
  };
}

/* ---------- integración Territorio > Penco ---------- */
function ensureButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g) return false;
  var b = $('btnNegocios');
  if (!b) {
    b = document.createElement('button');
    b.id = 'btnNegocios';
    b.className = 'btn';
    b.type = 'button';
    b.setAttribute('data-sub', 'penco');
    b.setAttribute('data-keywords', 'negocios emprendimiento pyme artesano artesania oficio maestro curso formacion taller economia local comercio feria tienda almacen almacenes minimarket supermercado panaderia botilleria comprar vender encargo cotizar visita moneda trueque');
    b.textContent = '🏪 Economía Local';
    var ref = $('btnActores');
    if (ref && ref.parentNode === g) {
      if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
      else g.appendChild(b);
    } else {
      var ref2 = $('btnBomberos');
      if (ref2 && ref2.parentNode === g) {
        if (ref2.nextSibling) g.insertBefore(b, ref2.nextSibling);
        else g.appendChild(b);
      } else g.appendChild(b);
    }
  } else {
    try { b.setAttribute('data-sub', 'penco'); b.dataset.sub = 'penco'; } catch (e) {}
  }
  if (!b.dataset.negW) { b.dataset.negW = '1'; b.addEventListener('click', function () { open('inicio'); }); }
  return true;
}
function ensureCheckbox() {
  if (document.querySelector('[data-btn="btnNegocios"]')) return;
  var ref = document.querySelector('[data-btn="btnActores"]') || document.querySelector('[data-btn="btnBomberos"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnNegocios" checked> 🏪 Economía Local';
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
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnNegocios') < 0) ALL_BTNS.push('btnNegocios'); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnNegocios = ['territorio', 'penco']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      var k = 'territorio|penco';
      if (!BTN_ORDER[k]) BTN_ORDER[k] = ['btnComuna'];
      if (BTN_ORDER[k].indexOf('btnNegocios') < 0) BTN_ORDER[k].push('btnNegocios');
    }
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnNegocios') < 0) ORDEN_TERRITORIO.push('btnNegocios');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (!PRESETS[p] || typeof PRESETS[p] !== 'object') return;
        if (PRESETS[p].btnComuna && PRESETS[p].btnNegocios === undefined) PRESETS[p].btnNegocios = true;
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

window.NegociosPenco = { open: open, tab: switchTab, list: todos, store: store, llevarAlCalendario: llevarAlCalendario, linkify: linkify, mapsLink: mapsLink };
try { document.addEventListener('territorio:listo', function () { try { render(); } catch (e) {} }); } catch (e) {}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(setup, 1800);

})();
