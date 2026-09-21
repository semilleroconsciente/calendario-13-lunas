/* ============================================================
   GUIA + HISTORIA DE PENCO — Calendario 13 Lunas (Penco · Bio-Bio)
   Apartado: Territorio > Penco (btnComuna -> comunaDialog),
   pestanas: Eventos | Guia de Penco | Sectores | Historia | Talleres.
   - Guia de Penco: marco, limites, lugares de interes y
     sectores de la comuna (sin historia: ver pestanas Sectores/Historia).
   - Sectores: cada sector con su historia conocida + hitos, y
     espacio para agregar relatos, historias e hitos propios
     (clave pencoSectorRelatos, privado por usuario).
   - Historia: el relato de Penco por periodos, desde el basamento
     gondwanico hasta el presente, en HISTORIA_PENCO.
   Contenido estatico y local (sin guardado salvo relatos):
   la edicion se hace aqui mismo, en GUIA_PENCO, HISTORIA_SECTORES
   e HISTORIA_PENCO. Conecta con Intermareal, Pesca, Aves
   (humedal Rocuant) y Bosque Nativo.
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
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}

/* ---------- GUIA (sin historia) ---------- */
var GUIA_PENCO = {
  marco: 'Ubicación: <b>Provincia de Concepción, Región del Biobío</b>, integrada al área metropolitana del <b>Gran Concepción</b>. Población comunal aproximada: <b>47.000 a 50.000 habitantes</b>.',
  limites: [
    { p: 'Norte', v: 'Tomé (hacia Punta de Parra y Quebrada Honda)' },
    { p: 'Sur', v: 'Concepción (eje Ruta 150 / Chillancito)' },
    { p: 'Oeste / Noroeste', v: 'Océano Pacífico (Bahía de Concepción)' },
    { p: 'Suroeste', v: 'Talcahuano (marismas del río Andalién e Isla Rocuant)' },
    { p: 'Este', v: 'Florida (cordillera de la Costa / sector rural)' }
  ],
  limitesNota: 'Penco se integra al área metropolitana del <b>Gran Concepción</b>. El límite con Talcahuano, hacia el suroeste, está marcado por las <b>marismas del río Andalién</b> y la <b>isla Rocuant</b>, cerca de su desembocadura.',
  lugares: [
    { n: 'Plaza Los Conquistadores y casco en damero', d: 'Centro histórico, comercio y servicios. Punto de partida para recorrer el Penco antiguo y el Barrio Patrimonial Ex CRAV.' },
    { n: 'Fuerte La Planchada', d: 'Fuerte de 1687 en el borde costero: único vestigio de la ciudad colonial de Concepción en Penco. Tres cañones, paseo y gastronomía.' },
    { n: 'Barrio Patrimonial Ex CRAV', d: 'Sector de valor patrimonial del centro penqueño, ligado a la antigua refinería de azúcar.' },
    { n: 'Playa Negra', d: 'Borde costero del centro: roqueríos, pozas intermareales y atardeceres. Revisa 🌊 Mareas y 🦀 Intermareal antes de ir.' },
    { n: 'Lirquén: caletas y puerto', d: 'Playa Lirquén, Caleta El Refugio y La Cata; Puerto Lirquén (DP World) y memoria minera del carbón y el vidrio plano. Población aproximada: 12.000 a 14.000 habitantes.' },
    { n: 'Humedal e isla Rocuant', d: 'Humedal costero del límite suroeste: observación de aves (ver 🦅 Aves). Marismas y desembocadura del río Andalién.' },
    { n: 'Cerro Bellavista', d: 'Hito natural del límite con Talcahuano, con vista a la Bahía de Concepción.' },
    { n: 'Cerro Verde', d: 'Sector residencial en altura, subdividido entre zonas altas y bajas.' },
    { n: 'Camino rural a Florida', d: 'Ruta Penco – Primer Agua – Roa – Florida (36 km): campo, agua y bosque hacia el límite este.' }
  ],
  sectores: [
    {
      n: '🛣️ Sector Sur / Eje Ruta 150 (Conexión Penco–Concepción)', d: 'Corredor residencial e industrial en el acceso sur de la comuna.',
      items: ['Cosmito (incluye Villa Cosmito)', 'La Greda', 'Nueva La Greda', 'El Boldo', 'Villa San Jorge', 'Villa Santa Rosa (“14-R Santa Rosa”)']
    },
    {
      n: '🏛️ Penco Centro y Borde Costero (Casco Histórico)', d: 'Asentamiento original de Concepción (1550). Poblaciones y villas tradicionales del sector:',
      items: ['Barrio Ex CRAV', 'Penco Norte', 'Penco Chico', 'Carlos Condell', 'Ignacio Carrera Pinto', 'Lomas de Penco', 'Juan Pérez Flores', 'Nueva Baquedano', 'Villa Jazmín', 'Alto Cementerio', 'Bellavista Sur', 'Playa Negra Norte', 'Bahía Azul', 'Bloques Vista al Mar', 'Corhabit', 'Lautaro Penco Centro', 'Desiderio Guzmán', 'Héctor Navarro', 'Armando Jofré Suazo', 'Hipocampo', 'Forjadores de Chile', 'Villarrica', 'Villa Las Américas', 'Villa Los Radales', 'Lord Cochrane', 'Gabriela Mistral']
    },
    {
      n: '⛰️ Cerro Verde', d: 'Sector residencial en altura, subdividido funcionalmente entre zonas altas y bajas.',
      items: ['Cerro Verde Alto', 'Cerro Verde Bajo', 'Víctor Ortal', 'Mejoreros', 'Bosques del Sur', 'Condominio Social Los Altos de Maitén', 'Agua de Peumo II B', 'Villa Montahue']
    },
    {
      n: '⚓ Lirquén (Sector Norte)', d: 'Localidad portuaria y pesquera costera (est. 1850). Barrios y poblaciones destacadas:',
      items: ['Lirquén Centro y Borde Costero (Playa Lirquén, Caleta El Refugio, La Cata)', 'Villa El Rosal', 'Ríos de Chile', 'Población Bellavista (Lirquén)', 'La Cantera', 'Las Pataguas']
    },
    {
      n: '🌾 Zona Rural Este (Límite con Florida)', d: 'Conectada por la ruta Penco – Primer Agua – Roa – Florida (36 km).',
      items: ['Primer Agua', 'Quebrada de las Ulloa', 'Fundo Coihueco / Huinquén']
    }
  ]
};

/* ---------- SECTORES CON HISTORIA (conocida + memoria vecinal) ----------
   Cada sector trae: historia conocida (sintesis honesta) e hitos.
   Lo que falta lo completa la comunidad abajo, con relatos propios.
   Para editar el texto oficial, editar aqui mismo. */
var HISTORIA_SECTORES = [
  {
    id: 'sur-ruta150', n: '🛣️ Sector Sur / Eje Ruta 150 — Cosmito, La Greda, El Boldo',
    barrios: ['Cosmito (incluye Villa Cosmito)', 'La Greda', 'Nueva La Greda', 'El Boldo', 'Villa San Jorge', 'Villa Santa Rosa (“14-R Santa Rosa”)'],
    historia: 'Puerta de entrada a Penco desde Concepción. Aquí la geología le puso el nombre al barrio: la <b>Formación Cosmito (Paleoceno–Eoceno)</b> se describió en la <b>Estación de Ferrocarril de Cosmito</b>, con sus mantos de carbón. En el siglo XX fue campo lechero (<b>Granja Cosmito</b>: leche, aves, hortalizas de CRAV-COSAF) y luego corredor obrero junto a la vía: <b>ferrocarril a Penco (1889)</b>, poblaciones ferroviarias y villas. El estero y los faldeos guardan boldo y bosque relicto.',
    hitos: [
      { f: '~60–40 Ma', t: 'Se depositan las arenas y carbones de la Formación Cosmito' },
      { f: '1889', t: 'Llega el ferrocarril: Estación Cosmito conecta Penco–Concepción' },
      { f: '1900–1950', t: 'Granja Cosmito abastece de leche y verduras a la zona fabril' },
      { f: '1990–hoy', t: 'Eje Ruta 150: villas y corredor residencial-industrial' }
    ]
  },
  {
    id: 'centro', n: '🏛️ Penco Centro y Casco Histórico — Carapenco, damero, CRAV',
    barrios: ['Barrio Ex CRAV', 'Penco Norte', 'Penco Chico', 'Carlos Condell', 'Ignacio Carrera Pinto', 'Lomas de Penco', 'Juan Pérez Flores', 'Nueva Baquedano', 'Villa Jazmín', 'Alto Cementerio', 'Bellavista Sur', 'Lautaro Penco Centro', 'Desiderio Guzmán', 'Héctor Navarro', 'Armando Jofré Suazo', 'Hipocampo', 'Forjadores de Chile', 'Villarrica', 'Villa Las Américas', 'Villa Los Radales', 'Lord Cochrane', 'Gabriela Mistral'],
    historia: 'El corazón de 500 años. Aquí estaba el <b>asentamiento de Carapenco</b>, entre los esteros Penco y Landa, donde Valdivia trazó en <b>1550 La Concepción del Nuevo Extremo</b> (fuerte en Altos de Playa Negra, solares 3 de marzo, fundación 5 de octubre). Fue <b>capital del sur, obispado y Universidad Pencopolitana</b> hasta el <b>terremoto-maremoto del 25 de mayo de 1751</b> que obligó el traslado al Valle de la Mocha y prohibió habitar por ~90 años (en 1822 solo 51 familias piden a O’Higgins quedarse). Renace como <b>Villa (1843, Bulnes), Municipalidad (1891) y ciudad (1898)</b>. El damero y la Plaza heredan el plano colonial. Aquí levantaron la <b>Refinería de Azúcar (1886, luego CRAV)</b> con su muelle gigante, la <b>Fábrica de Loza (1898, luego Fanaloza/Lozapenco)</b> y la COSAF: nace el <b>Penco obrero</b> (Bomberos 1927, sindicatos, clubes, Observatorio Elke). El <b>Barrio Ex CRAV</b> es hoy zona patrimonial.',
    hitos: [
      { f: '1550', t: 'Batalla de Andalién (22 feb) + fundación de Concepción en Penco (5 oct)' },
      { f: '1554', t: 'Lautaro destruye la ciudad; refundaciones sucesivas' },
      { f: '1687', t: 'Fuerte La Planchada: único vestigio colonial en pie' },
      { f: '1570–1730', t: 'Terremotos que la tumban una y otra vez' },
      { f: '1751', t: 'Terremoto-maremoto final: traslado y prohibición de habitar' },
      { f: '1843 / 1891 / 1898', t: 'Villa, Municipalidad y ciudad: refundación republicana' },
      { f: '1886 / 1898', t: 'Refinería de Azúcar (CRAV) y Fábrica de Loza' },
      { f: '1927', t: 'Bomberos de Penco tras grandes incendios' },
      { f: '1939 / 1960 / 2010', t: 'Terremotos que golpean el casco y obligan a reconstruir' }
    ]
  },
  {
    id: 'playa-negra', n: '🌊 Playa Negra y Borde Costero Centro — conchal, fuerte y balneario',
    barrios: ['Playa Negra Norte', 'Bahía Azul', 'Bloques Vista al Mar', 'Corhabit'],
    historia: 'La primera y la última orilla. Sobre su terraza de 5 m está el conchal <b>Playa Negra 9</b> (Arcaico, pescadores con pesas de red, caza de lobo marino) y muy cerca <b>Bellavista 1</b> (3.000 m², 4.580–3.330 a.p.): cuando se ocuparon, el mar llegaba kilómetros adentro. En <b>1550 el primer fuerte español se alzó en Altos de Playa Negra</b>. Tres siglos después se vuelve <b>balneario popular</b> (1950–60) de roqueríos, pozas y atardeceres. Los temporales de <b>1945</b> destruyeron el muelle refinero de CRAV. Hoy es aula viva: revisa 🌊 Mareas y 🦀 Intermareal antes de bajar.',
    hitos: [
      { f: '~4.500 a.p.', t: 'Conchales Playa Negra 9 y Bellavista 1: pesca y marisqueo' },
      { f: '1550', t: 'Fuerte inicial en Altos de Playa Negra' },
      { f: '1945', t: 'Temporal destruye el muelle refinero de CRAV' },
      { f: '1950–60', t: 'Playa Negra, balneario popular del Gran Concepción' },
      { f: '2010', t: '27F golpea el borde: reconstrucción de defensas y paseo' }
    ]
  },
  {
    id: 'cerro-verde', n: '⛰️ Cerro Verde Alto y Bajo — carbón, toma y mirador',
    barrios: ['Cerro Verde Alto', 'Cerro Verde Bajo', 'Víctor Ortal', 'Mejoreros', 'Bosques del Sur', 'Condominio Social Los Altos de Maitén', 'Agua de Peumo II B', 'Villa Montahue'],
    historia: 'El cerro que cose Penco con Lirquén. Su nombre minero lo dice: aquí hubo <b>minas de carbón (Lirquén–Cerro Verde, 1850–1950s)</b> que pidieron leña y entibado al bosque (lingue, roble, laurel). Con el ferrocarril y las fábricas llegaron familias de Ñuble; el sector creció como <b>población obrera y luego como toma/mejora (“Mejoreros”, Víctor Ortal)</b>. En los <b>70–80 se conurba con Lirquén</b> en un solo aglomerado. Es también basamento gondwánico y mirador de la bahía: entre casas aún asoman quebradas con peumo, boldo y arrayán.',
    hitos: [
      { f: '1850–1950s', t: 'Minas de carbón de Cerro Verde–Lirquén' },
      { f: '1889–1914', t: 'Riel Penco–Lirquén: el cerro se vuelve corredor' },
      { f: '1970–80', t: 'Cerro Verde une Penco y Lirquén; crecen poblaciones' },
      { f: 'hoy', t: 'Miradores y quebradas: bosque relicto entre villas' }
    ]
  },
  {
    id: 'lirquen', n: '⚓ Lirquén — caleta, cobre, carbón, vidrio y puerto mayor',
    barrios: ['Lirquén Centro y Borde Costero (Playa Lirquén, Caleta El Refugio, La Cata)', 'Villa El Rosal', 'Ríos de Chile', 'Población Bellavista (Lirquén)', 'La Cantera', 'Las Pataguas'],
    historia: 'Pueblo dentro del pueblo (12.000–14.000 hab.). Caleta de <b>pescadores y alfareros hacia 1850</b>, con navegación antigua a Quiriquina. Encendió la economía con la <b>fundición de cobre</b> y las <b>minas de carbón</b>, cal, tejas y molinos. El <b>ferrocarril llegó en 1914</b> (ramal a Tomé–Coelemu–Chillán). En el siglo XX sumó la <b>Fábrica de Vidrios Planos (FNVP/Vipla, luego Vidrios Lirquén)</b>, fosfatos y calzado. Sus rocas guardan el mar cretácico: en <b>La Cata hay tortugas marinas fósiles y amonites de la Formación Quiriquina</b>. Sus caletas <b>El Refugio y La Cata</b> mantienen pesca artesanal y fiesta patronal; el <b>Puerto Lirquén (hoy DP World)</b> es puerto mayor. El 27F golpeó caletas y borde.',
    hitos: [
      { f: '72–66 Ma', t: 'Fósiles marinos en La Cata (Quiriquina): tortugas, amonites' },
      { f: '~1850', t: 'Caleta de pescadores y alfareros' },
      { f: '1850–1900', t: 'Fundición de cobre + minas de carbón' },
      { f: '1914', t: 'Ferrocarril a Lirquén' },
      { f: '1950–70', t: 'Vidrios Planos (Vipla), fosfatos: polo industrial' },
      { f: '1990–hoy', t: 'Puerto Lirquén / DP World: puerto mayor' },
      { f: '2010', t: '27F: daño y reconstrucción de caletas' }
    ]
  },
  {
    id: 'rocuant', n: '🦅 Humedal Rocuant, Andalién y Cerro Bellavista — agua y aves',
    barrios: ['Desembocadura río Andalién', 'Isla Rocuant y marismas', 'Cerro Bellavista (límite Talcahuano)'],
    historia: 'El límite vivo del suroeste. <b>Marismas del Andalién e isla Rocuant</b>: humedal costero de aves migratorias y residentes (ver 🦅 Aves). A orillas de la antigua desembocadura está el conchal <b>Bellavista 1</b>, con 2,5 m de basura de 4.000 años: ostiones, choro zapato, peces y lobos marinos. Los limos de inundación del Andalién y las dunas modelaron la llanura. El <b>Cerro Bellavista</b> es hito y mirador de la bahía. Proteger el humedal es el desafío actual: vivir con el mar y el río.',
    hitos: [
      { f: '~4.000 a.p.', t: 'Bellavista 1: aldea pescadora junto al Andalién antiguo' },
      { f: 'Holoceno', t: 'Transgresiones forman marismas y terraza de 5 m' },
      { f: 'hoy', t: 'Humedal Rocuant: observación de aves y restauración' }
    ]
  },
  {
    id: 'rural-este', n: '🌾 Zona Rural Este — Primer Agua, Roa y Florida (36 km)',
    barrios: ['Primer Agua', 'Quebrada de las Ulloa', 'Fundo Coihueco / Huinquén'],
    historia: 'El campo penqueño hacia Florida. Ruta de <b>agua y bosque</b>: vertientes (Primer Agua), quebradas con canelo, lingue, trihue y copihue, y fundos (Coihueco/Huinquén) de agricultura y forraje. Camino histórico a Florida (36 km por Roa). Aquí el bosque esclerófilo-laurifolio resiste mejor: queule relicto en la cuenca, boldo-peumo-quillay en laderas. Guarda memoria campesina y de arrieros que aún falta recoger.',
    hitos: [
      { f: 'prehispánico', t: 'Bosque lafkenche: remedio, fruto y wampo' },
      { f: 'colonial–XIX', t: 'Leña y carbón vegetal para minas y hornos' },
      { f: 'hoy', t: 'Ruta Penco–Primer Agua–Roa–Florida: agua, campo y semillero' }
    ]
  }
];

/* ---------- HISTORIA DE PENCO (periodos hasta el presente) ---------- */
var HISTORIA_PENCO = {
  intro: 'Penco es la <b>cuna de Concepción</b> y la tercera ciudad más antigua de Chile: del <b>fondo marino cretácico</b> y el <b>Lafken habitado</b> a la comuna costera e industrial de hoy, en <b>16 periodos</b>. La historia completa vive aquí; la Guía queda solo para recorrer el territorio.',
  eras: [
    {
      t: '🪨 Tiempo profundo: basamento de Gondwana', cuando: 'Paleozoico (~300 Ma) · Series metamórficas + Granitoides de Concepción',
      d: 'Antes de ser bahía, Penco era <b>fondo y borde de Gondwana</b>. Bajo tus pies está el <b>zócalo paleozoico</b>: filitas, esquistos y metarenitas de las Series Occidental y Oriental, intruidas por los <b>Granitoides de Concepción</b>. Ese basamento forma los <b>cerros y acantilados de la Cordillera de la Costa</b> (Cerro Verde, Bellavista, Tumbes) y es el piso sobre el que después se depositó el mar cretácico. La Costa nunca fue aplastada por los hielos andinos: por eso será <b>refugio de vida</b> por millones de años (ver 📖 Bosque Nativo → Tiempo profundo).'
    },
    {
      t: '🦕 Mar de Quiriquina: plesiosaurios frente a Penco', cuando: 'Cretácico Superior · Maastrichtiano (72–66 Ma)',
      d: 'Hace 70 millones de años <b>todo esto era mar</b>. La <b>Formación Quiriquina</b> —descrita por Biró (1982), localidad tipo en Isla Quiriquina— aflora en <b>Lirquén (La Cata), Punta de Parra, Cocholgüe</b> y los cerros isla del Gran Concepción. Aquí nadaron el plesiosaurio <b>Aristonectes quiriquinensis (hasta 9 m, filtrador como las ballenas)</b>, <b>mosasaurios tylosaurinos y halisaurinos (Halisaurus sp.)</b>, tortugas <b>Osteopygis y Euclastes</b>, tiburones y rayas, y voló/pescó <b>Neogaeornis wetzeli, la primera ave mesozoica descrita de Sudamérica</b>. Abundan <b>amonites (Baculites, Eubaculites, Menuites fresvillensis gigante), bivalvos Pacitrigonia, Cardium y Neilo pencana —que lleva el nombre de Penco—</b> y maderas con perforaciones de Teredolites. Sus 65 m de areniscas y coquinas cuentan una <b>transgresión marina con tormentas</b>, justo antes de la extinción K/Pg que mató a dinosaurios y amonites.'
    },
    {
      t: '🌿 Selvas del carbón: Cosmito', cuando: 'Paleoceno–Eoceno (~60–40 Ma) · Formaciones Cosmito / Curanilahue / Cerro Alto',
      d: 'Tras el impacto que acabó con los reptiles marinos, la costa se vuelve <b>delta pantanoso de selvas</b>. La <b>Formación Cosmito —descrita en la Estación de Ferrocarril de Cosmito, tu sector Cosmito, a 5 km al norte de Concepción—</b> junto a Curanilahue y Cerro Alto (Isla Quiriquina) guarda <b>areniscas, lutitas y mantos de carbón</b> con abundante <b>paleoflora mixta</b> (afinidades antárticas y tropicales). Es el <b>primer carbón de la cuenca de Arauco</b>: el antecedente profundo del carbón de Lirquén y Cerro Verde que moverá Penco 150 años después. El mar se retira y vuelve varias veces; queda el paisaje de llanuras y bosques que heredará el hombre.'
    },
    {
      t: '❄️ Hielos, refugio y nacimiento de la bahía', cuando: 'Pleistoceno – Holoceno Medio (~2 Ma – 6.000 a.p.)',
      d: 'Vienen los hielos, pero la <b>Cordillera de la Costa no se glacia</b>: con lluvias del Pacífico y relieve variado se vuelve <b>refugio glacial</b> (confirmado por genética en <b>Nothofagus y Proteaceae, Premoli et al. 2019</b> y polen de Villagrán). Sobreviven <b>keule, olivillo, lingue, avellano y robles</b> que hoy ves en quebradas. A fines del Pleistoceno el <b>río Biobío desembocaba dentro de la Bahía de Concepción</b> y la transgresión Flandriana la inunda: se forman las <b>terrazas marinas de 5 m (con ocupaciones) y 2 m (sin ocupaciones)</b>, limos del Andalién y dunas. <b>Hualpén y Tumbes eran islas</b>, Quiriquina estaba antepuesta a la costa: un <b>mar interior abrigado</b>, ideal para aprender a navegar. El bosque de entonces: <b>boldo y arrayán extensos</b> en la costa.'
    },
    {
      t: '🛶 Primeros navegantes: Complejo Talcahuano', cuando: 'Arcaico Medio–Tardío (7.000–2.000 a.p.) · 4.580 a.p. – 130 d.C.',
      d: 'Más de <b>30 sitios-conchales</b> rodean la bahía (Bustos y Vergara, Chungara 2004): <b>Bellavista 1 (>3.000 m², 2,5 m de basura), Talcahuano 1 (>3 ha, 4,5 m, el probable “Conchal Darwin”), Quiriquina 1-2, Vacas 1, Chome 1, Rocoto 1 y Playa Negra 9 aquí en Penco sur</b>. Fechas: <b>La Trila 4.580, Chome 4.570, Talcahuano 4.350–4.160, El Visal 3.920, Bellavista 3.880–3.330 a.p.</b> Eran cazadores-recolectores-pescadores <b>sedentarios</b>: <b>pesas de red acinturadas, puntas talcahuenenses dentadas con barbas, tajadores, chuzos mariscadores, morteros</b>; pesca de <b>jurel, sierra, merluza y róbalo</b> con red y anzuelo, caza de <b>lobo marino</b>, marisqueo de ostión, choro zapato, loco y lapa. Ya <b>navegaban a Quiriquina</b> y vivían en terrazas altas (90–100 m) junto a loberías. En Penco sur, <b>Playa Negra 9 y Bellavista 1</b> están sobre la terraza de 5 m, a 5–6 km de la costa actual: la línea de mar estaba adentro.'
    },
    {
      t: '🏺 Alfareros lafkenche: Pitrén y El Vergel', cuando: '130 d.C. – 1550 · Pitrén (300–500) / El Vergel (1.000–1.550)',
      d: 'Hacia el <b>130 d.C. aparece la cerámica</b> (Talcahuano 1). Luego las tradiciones <b>Pitrén y El Vergel (1.000–1.500 d.C.)</b>, más un <b>Complejo Temprano costero</b> de los primeros siglos: horticultura de <b>quinoa, papa, maíz y mango</b> (Isla Santa María, 1.030–1.460), <b>gallina prehispánica en Arauco (1.300–1.450, comprobada por ADN)</b>, camélidos, <b>metalurgia del cobre</b>, navegación a Quiriquina y entierros en <b>urna y wampo</b>. Sitios Vergel al norte: <b>Quiriquina (1.210 d.C.), Bellavista 1, Quinta Virginia, Chiguayante</b>. Al llegar los españoles, este era el territorio <b>“provincia de Concepción o Penco”</b>, con <b>ayllarewe costeros lafkenche</b> —gente del mar—, orfebrería de oro, plata y cobre, y lavaderos como <b>Quilacoya</b>. La ciudad de 1550 se trazó sobre el <b>asentamiento de Carapenco</b>, entre los esteros de Penco y Landa. De este tiempo <b>no hay crónicas propias</b>: hablan la arqueología y la memoria mapuche viva (🗣️ Voz de los Abuelos, 📖 Epew, 🗣️ Kimün Mapuzugun).'
    },
    {
      t: '⚔️ Fundación y destrucción', cuando: '1550–1554 · Concepción del Nuevo Extremo',
      d: 'Pedro de Valdivia llega al valle de <b>Penguco</b> y, tras la <b>Batalla de Andalién (22 de febrero de 1550)</b>, funda la ciudad: primero el fuerte en <b>Altos de Playa Negra</b>, reparto de solares el <b>3 de marzo</b> y fundación solemne el <b>5 de octubre de 1550</b> como <b>La Concepción de María Purísima del Nuevo Extremo</b>, con plaza de armas, iglesia, cabildo y hospital. Es el <b>asentamiento español más antiguo de la zona</b>. La guerra mapuche la alcanza pronto: tras la muerte de Valdivia en Tucapel (1553), <b>Lautaro destruye Concepción en 1554</b> y la ciudad debe refundarse.'
    },
    {
      t: '⛪ Penco, capital del sur', cuando: '1554–1751 · Ciudad colonial, obispado y terremotos',
      d: 'Refundada una y otra vez, Penco-Concepción se vuelve <b>capital político-militar del sur</b>: aquí residen gobernadores, sesiona el cabildo en pie de guerra y se traza la frontera del Biobío. Recibe <b>obispado</b>, conventos y la <b>Universidad Pencopolitana</b>. El trazado en <b>damero</b> y la <b>Plaza</b> de hoy heredan ese plano. La bahía se defiende con fuertes como <b>La Planchada (1687)</b>, único vestigio colonial en pie. Pero la tierra manda: terremotos en <b>1570, 1657, 1687 y 1730</b> la tumban una y otra vez, hasta el golpe final de 1751.'
    },
    {
      t: '🌊 El traslado y el largo silencio', cuando: '25 de mayo de 1751 – 1842 · Terremoto, maremoto y prohibición',
      d: 'El <b>gran terremoto y maremoto del 25 de mayo de 1751</b> sepulta la ciudad. Las autoridades ordenan el <b>traslado al Valle de la Mocha</b> (actual Concepción, a orillas del Biobío) y <b>prohíben ocupar Penco por casi 90 años</b>. Entre las ruinas queda un puñado de familias: en <b>1822, 51 familias</b> escriben a <b>Bernardo O’Higgins</b> pidiendo vivir allí libremente. La respuesta tarda dos décadas.'
    },
    {
      t: '🏡 Villa, comuna y ciudad', cuando: '1843–1898 · La refundación republicana',
      d: 'El presidente <b>Manuel Bulnes otorga el título de Villa el 29 de marzo de 1843</b>; el primer subdelegado es <b>Manuel Esteban Gajardo</b>. Penco es entonces subdelegación de Coelemu y luego de Concepción. Con la <b>Ley de Comuna Autónoma (1891)</b> nace la <b>Municipalidad de Penco</b>, y en <b>1898 es declarada ciudad</b>. De a poco renace el caserío entre las ruinas, y al norte crece la caleta de <b>Lirquén (hacia 1850)</b>, de pescadores y alfareros.'
    },
    {
      t: '⛏️🚂 Carbón, cobre y rieles', cuando: '1850–1900 · Minas, fundición y ferrocarril',
      d: 'El carbón de <b>Lirquén y Cerro Verde</b> y la <b>fundición de cobre de Lirquén</b> encienden la economía; hay además molinos de trigo, cal, tejas y adobes. La <b>llegada del ferrocarril a Penco (1889)</b> —extendido a <b>Lirquén en 1914</b> y conectado hacia Tomé, Coelemu y Chillán— acelera todo. En <b>1886</b> Teodoro Plate y Óscar Mengelbier fundan la <b>Refinería Sudamericana de Azúcar</b> (comprada por Mauricio Gleisner en 1889, luego <b>CRAV</b>), y en <b>1898</b> nace la <b>Fábrica Nacional de Loza</b>. Llegan familias de <b>Ñuble</b> buscando trabajo: Penco se vuelve polo obrero.'
    },
    {
      t: '🏭 Penco obrero-industrial', cuando: '1900–1950 · CRAV, Fanaloza, COSAF y vida de barrio',
      d: 'La primera mitad del siglo XX es el auge fabril: <b>CRAV</b> con su muelle refinero —uno de los más largos de Chile—, <b>Fanaloza</b> (relanzada por Juan Díaz en 1926, renovada en los 40-50), la <b>COSAF</b> con su muelle mecanizado, y la <b>Granja Cosmito</b> con leche, aves y hortalizas. Los operarios fundan el <b>Cuerpo de Bomberos (1927)</b> tras voraces incendios, y la CRAV sostiene hasta un <b>Observatorio “Elke”</b>. Los temporales de <b>1945</b> destruyen el muelle refinero y el <b>terremoto de Chillán (1939)</b> golpea la zona. Aun así, industria y ciudad crecen juntas: nace el <b>Penco obrero</b>, de sindicato, club deportivo y barrio.'
    },
    {
      t: '🏗️ Barrios, vidrio y maremotos', cuando: '1950–1973 · Expansión y Estado industrial',
      d: 'Penco se consolida como uno de los <b>centros industriales del sur</b>: a CRAV y Fanaloza (luego Lozapenco) se suma la <b>Fábrica Nacional de Vidrios Planos de Lirquén (FNVP / Vipla, luego Vidrios Lirquén)</b>, fosfatos y calzado. Crecen las <b>poblaciones obreras</b> y <b>Cerro Verde</b> empieza a unir Penco con Lirquén. El <b>terremoto de Valdivia (1960)</b> y sus maremotos azotan la bahía. <b>Playa Negra</b> se afirma como balneario popular y el borde costero se llena de vida.'
    },
    {
      t: '🌑 Crisis, dictadura y resistencia', cuando: '1973–1990 · Declive fabril',
      d: 'La dictadura y la apertura económica golpean la industria nacional: las <b>grandes fábricas entran en declive y cierran progresivamente</b>, con cesantía y empobrecimiento de los barrios obreros. El puerto y la pesca artesanal resisten. En las poblaciones, la <b>organización vecinal, la iglesia y los clubes</b> sostienen la vida comunitaria. El Penco fabril se vuelve memoria, y sus galpones y casas obreras, patrimonio en espera.'
    },
    {
      t: '⚓ Puerto moderno y 27F', cuando: '1990–2010 · Democracia, DP World y reconstrucción',
      d: 'Con la democracia, <b>Lirquén se moderniza como puerto mayor (hoy DP World / Puerto Lirquén)</b> y la comuna se integra de lleno al <b>Gran Concepción</b>. A fines de los 70 y en los 80, Cerro Verde ya había cosido Penco y Lirquén en un solo aglomerado. El <b>terremoto y tsunami del 27 de febrero de 2010</b> golpea el borde costero y obliga a <b>reconstruir</b> caletas, defensas y viviendas, y a repensar la relación con el mar.'
    },
    {
      t: '🌱 Penco patrimonial y costero', cuando: '2010 – presente · 47.000 a 50.000 habitantes',
      d: 'El Penco de hoy es <b>doble: Penco centro y Lirquén puerto-pesquero</b>, unidos por Cerro Verde y el eje Ruta 150. Cuida su historia —<b>Fuerte La Planchada, Plaza Los Conquistadores, Barrio Ex CRAV</b>— y su naturaleza: <b>Playa Negra y sus roqueríos, caletas El Refugio y La Cata, humedal e isla Rocuant</b> con sus aves. Los desafíos son los mismos del origen: <b>vivir con el mar y el río</b>, proteger el humedal, ordenar el borde y convertir la <b>memoria industrial y lafkenche</b> en futuro. Esta historia sigue escribiéndose cada 12 de febrero, aniversario de la fundación.'
    }
  ],
  fuentes: 'Fuentes: Sociedad de Historia de Penco (historiadepenco.cl) · Museo Hist. Nat. Concepción (Formación Quiriquina, Biró 1982, Stinnesbeck) · Repositorio UdeC (CRAV, Cosmito, Cerro Alto) · Bustos y Vergara Chungara 2004 (30 conchales, Arcaico 4.580 a.p.) · Torres et al. 2007 (Playa Negra 9) · Museo Precolombino (Pitrén–El Vergel) · Villagrán / Premoli et al. 2019 (refugio Costa) · Resumen.cl “Penco, historia e industria” · Wikipedia “Penco” · memoria caleta Lirquén.'
};

function chip(t) { return '<span class="chip" style="font-size:10px">' + esc(t) + '</span>'; }

/* ---------- RENDER: GUIA (sin historia) ---------- */
function renderGuiaPenco() {
  var box = $('comunaGuiaPanel');
  if (!box) return;
  var g = GUIA_PENCO;
  var html = '';
  html += '<p class="muted" style="font-size:11px;line-height:1.55">' + g.marco + '</p>';
  html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📜 La historia tiene su propia sección</h4>' +
    '<p style="font-size:12px;line-height:1.55">Del mar cretácico y el Lafken originario al Penco de hoy en <b>16 periodos</b>: Quiriquina, Cosmito, navegantes arcaicos, Pitrén–El Vergel, fundación de 1550, traslado de 1751, villa de 1843, carbón y rieles, Penco obrero, 27F y presente. Y cada barrio tiene su ficha en <b>🏘️ Sectores</b>.</p>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:6px"><button type="button" id="guiaGoSect" class="btn" style="width:auto;font-size:11px">🏘️ Ver Sectores</button><button type="button" id="guiaGoHist" class="btn" style="width:auto;font-size:11px">📜 Ver Historia de Penco</button></div></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>🧭 Límites comunales</h4>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">' +
    g.limites.map(function (l) { return '<span class="chip"><b>' + esc(l.p) + ':</b> ' + esc(l.v) + '</span>'; }).join('') + '</div>' +
    '<p class="muted" style="font-size:11px;line-height:1.55">' + g.limitesNota + '</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>📍 Lugares de interés</h4>' +
    g.lugares.map(function (l) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">📍 ' + esc(l.n) + '</h4><p style="font-size:11px">' + l.d + '</p></div>';
    }).join('') +
    '<p class="muted" style="font-size:10px;margin-top:6px">Guía básica en crecimiento: para mareas, pesca, aves e intermareal usa las secciones 🌊 Territorio.</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>🏘️ Sectores de la comuna · ' + g.sectores.length + '</h4>' +
    '<p class="muted" style="font-size:11px">Cada sector ya tiene su ficha con historia e hitos en la pestaña <b>🏘️ Sectores</b>, donde además puedes sumar tus relatos.</p>' +
    g.sectores.map(function (s) {
      return '<details class="menstrual-details"><summary>' + esc(s.n) + ' <span class="muted" style="font-size:11px">· ' + s.items.length + '</span></summary>' +
        '<p class="muted" style="font-size:11px">' + esc(s.d) + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + s.items.map(chip).join('') + '</div></details>';
    }).join('') + '<div class="dlg-actions" style="justify-content:flex-start;margin-top:6px"><button type="button" id="guiaGoSect2" class="btn" style="width:auto;font-size:11px">🏘️ Ir a Sectores e historias</button></div></div>';
  box.innerHTML = html;
  var go = $('guiaGoHist');
  if (go) go.onclick = function () { try { switchGuiaTab('historia'); } catch (e) {} };
  var gs = $('guiaGoSect');
  if (gs) gs.onclick = function () { try { switchGuiaTab('sectores'); } catch (e) {} };
  var gs2 = $('guiaGoSect2');
  if (gs2) gs2.onclick = function () { try { switchGuiaTab('sectores'); } catch (e) {} };
}

/* ---------- RENDER: HISTORIA ---------- */
function renderHistoriaPenco() {
  var box = $('comunaHistoriaPanel');
  if (!box) return;
  var h = HISTORIA_PENCO;
  var html = '<p class="muted" style="font-size:11px;line-height:1.55">' + h.intro + '</p>';
  html += h.eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + esc(e.cuando) + '</p>' +
      '<p style="font-size:12px;line-height:1.55">' + e.d + '</p></div>';
  }).join('');
  html += '<p class="muted" style="font-size:10px;margin-top:8px">' + esc(h.fuentes) + '</p>';
  box.innerHTML = html;
}

/* ---------- SECTORES: relatos vecinales (privado por usuario) ---------- */
var SECTOR_TIPOS = ['📖 Relato vecinal', '🏠 Historia familiar', '📍 Hito del sector', '👵 Memoria de abuelos/as', '🎣 Oficio / trabajo', '🎉 Fiesta / tradición'];
var sectorEditId = null;
var sectorFiltro = 'todos';
var sectorQuery = '';
function getSectorRelatos() { var a = store('pencoSectorRelatos', []); return Array.isArray(a) ? a : []; }
function sectorNombre(id) {
  var s = HISTORIA_SECTORES.filter(function (x) { return x.id === id; })[0];
  return s ? s.n : id;
}
function shareTxt(t, x) {
  try {
    if (navigator.share) { navigator.share({ title: t, text: x }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(t + '\n' + x).then(function () { save('Compartido ✓'); });
  } catch (e) {}
}
function relatoCard(r) {
  var html = '<div class="si-card" style="padding:8px 10px;border-color:#d4af3766"><h4 style="font-size:12px">' + esc(r.icon || '📖') + ' ' + esc(r.titulo) + '</h4>' +
    '<p class="muted" style="font-size:10px">' + esc(r.tipo) + ' · ' + esc(sectorNombre(r.sector)) + (r.quien ? ' · ' + esc(r.quien) : '') + (r.anio ? ' · ~' + esc(r.anio) : '') + '</p>' +
    (r.texto ? '<p style="font-size:11px;white-space:pre-wrap">' + esc(r.texto) + '</p>' : '') +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn" data-secedit="' + r.id + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
    '<button type="button" class="btn" data-secshare="' + r.id + '" style="width:auto;font-size:11px">📤 Compartir</button>' +
    '<button type="button" class="btn" data-secdel="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button></div></div>';
  return html;
}
function bindRelatos(scope) {
  if (!scope) return;
  scope.querySelectorAll('[data-secdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este relato?')) return;
      var dd = getSectorRelatos();
      var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-secdel'); });
      if (i >= 0) dd.splice(i, 1);
      save('Relato borrado'); renderSectores();
    };
  });
  scope.querySelectorAll('[data-secshare]').forEach(function (b) {
    b.onclick = function () {
      var r = getSectorRelatos().filter(function (x) { return x.id === b.getAttribute('data-secshare'); })[0];
      if (r) shareTxt('🏘️ ' + r.titulo + ' — ' + sectorNombre(r.sector), (r.texto || '') + '\n— ' + (r.quien || 'vecino/a') + ' · ' + r.tipo);
    };
  });
  scope.querySelectorAll('[data-secedit]').forEach(function (b) {
    b.onclick = function () {
      var r = getSectorRelatos().filter(function (x) { return x.id === b.getAttribute('data-secedit'); })[0];
      if (!r) return;
      sectorEditId = r.id;
      $('secSector').value = r.sector; $('secTipo').value = r.tipo;
      $('secTitulo').value = r.titulo || ''; $('secTexto').value = r.texto || '';
      $('secQuien').value = r.quien || ''; $('secAnio').value = r.anio || '';
      $('secAddBtn').textContent = '↻ Actualizar relato';
      $('secCancelBtn').classList.remove('hidden');
      $('secSector').scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  });
}
function renderSectores() {
  var box = $('comunaSectoresPanel');
  if (!box) return;
  var todos = getSectorRelatos();
  var q = (sectorQuery || '').toLowerCase();
  var html = '<p class="muted" style="font-size:11px;line-height:1.55">Todos los sectores en <b>' + HISTORIA_SECTORES.length + ' fichas</b>: lo que se sabe + lo que tú sabes. Agrega <b>relatos, historias, hitos, oficios y fiestas</b> de tu barrio: quedan <b>privados en tu dispositivo</b>.</p>';
  /* buscador + filtro */
  html += '<div class="menstrual-card"><h4>🔍 Buscar en sectores</h4><div class="conv-row"><label style="flex:2">Buscar <input type="text" id="secSearch" placeholder="ej: CRAV, carbón, caleta, 1960..." maxlength="60" autocomplete="off" value="' + esc(sectorQuery) + '"></label>' +
    '<label>Ver <select id="secFilter"><option value="todos">Todos</option>' +
    HISTORIA_SECTORES.map(function (s) { return '<option value="' + s.id + '"' + (sectorFiltro === s.id ? ' selected' : '') + '>' + esc(s.n) + '</option>'; }).join('') +
    '<option value="mios"' + (sectorFiltro === 'mios' ? ' selected' : '') + '>⭐ Solo mis relatos (' + todos.length + ')</option></select></label></div></div>';
  /* formulario */
  html += '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>➕ Agregar relato, historia o hito del sector</h4>' +
    '<div class="conv-row"><label style="flex:2">Sector * <select id="secSector">' +
    HISTORIA_SECTORES.map(function (s) { return '<option value="' + s.id + '">' + esc(s.n) + '</option>'; }).join('') + '</select></label>' +
    '<label>Tipo <select id="secTipo">' + SECTOR_TIPOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Título * <input type="text" id="secTitulo" placeholder="ej: La panadería de mi abuelo en Penco Chico" maxlength="70"></label>' +
    '<label>Relato / historia / hito <textarea id="secTexto" rows="3" placeholder="¿Qué pasó? ¿Quiénes? ¿Cuándo? Nombres, calles, años, olores, sonidos..." maxlength="1000"></textarea></label>' +
    '<div class="conv-row"><label>Quién cuenta <input type="text" id="secQuien" placeholder="ej: Rosa, vecina de Cerro Verde" maxlength="40"></label>' +
    '<label>Año aprox. <input type="text" id="secAnio" placeholder="ej: 1978" maxlength="12" style="width:110px"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="secAddBtn" class="btn btn-accent" style="width:auto">+ Guardar en mi sector</button>' +
    '<button type="button" id="secCancelBtn" class="btn hidden" style="width:auto">Cancelar</button>' +
    '<button type="button" id="secExportBtn" class="btn" style="width:auto">📤 Exportar mis relatos</button></div>' +
    '<p class="muted" style="font-size:10px">Se guarda solo en tu usuario. “Hito” = fecha/lugar verificable; “Relato” = memoria viva aunque no tenga fecha exacta.</p></div>';
  /* fichas */
  HISTORIA_SECTORES.forEach(function (s) {
    if (sectorFiltro !== 'todos' && sectorFiltro !== 'mios' && sectorFiltro !== s.id) return;
    var mios = todos.filter(function (r) { return r.sector === s.id; }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    if (sectorFiltro === 'mios' && !mios.length) return;
    var textoPlano = (s.n + ' ' + s.historia + ' ' + s.barrios.join(' ') + ' ' + s.hitos.map(function (h) { return h.f + ' ' + h.t; }).join(' ')).toLowerCase();
    var miosPlano = mios.map(function (r) { return (r.titulo + ' ' + r.texto + ' ' + (r.quien || '')).toLowerCase(); }).join(' ');
    if (q && textoPlano.indexOf(q) < 0 && miosPlano.indexOf(q) < 0) return;
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>' + esc(s.n) + ' <span class="muted" style="font-size:11px">· ' + s.barrios.length + ' barrios · ' + mios.length + ' míos</span></h4>' +
      '<p style="font-size:12px;line-height:1.55">' + s.historia + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">' + s.barrios.map(function (b) { return '<span class="chip" style="font-size:10px">' + esc(b) + '</span>'; }).join('') + '</div>' +
      '<div style="margin-top:6px">' + s.hitos.map(function (h) { return '<p style="font-size:11px;margin:3px 0">📌 <b>' + esc(h.f) + '</b> — ' + esc(h.t) + '</p>'; }).join('') + '</div>';
    if (mios.length) {
      html += '<div style="margin-top:8px"><p class="muted" style="font-size:11px">⭐ Mis relatos aquí (' + mios.length + '):</p>' + mios.map(relatoCard).join('') + '</div>';
    } else if (sectorFiltro === 'mios') {
      html += '';
    } else {
      html += '<p class="muted" style="font-size:11px;margin-top:6px">Aún no agregas relatos aquí. ¡Sé la primera memoria de este sector! 👆</p>';
    }
    html += '</div>';
  });
  if (sectorFiltro === 'mios' && !todos.length) html += '<p class="muted">Aún no tienes relatos. Agrega el primero arriba.</p>';
  html += '<p class="muted" style="font-size:10px;margin-top:8px">Fichas oficiales: Sociedad de Historia de Penco · Museo Hist. Nat. Concepción (Quiriquina) · Bustos y Vergara 2004 · Torres et al. 2007 · memoria caletas y barrios. Tus relatos son tuyos y no se suben a ningún servidor.</p>';
  box.innerHTML = html;
  bindRelatos(box);
  var ss = $('secSearch');
  if (ss) ss.addEventListener('input', function () { sectorQuery = ss.value; var pos = ss.selectionStart; renderSectores(); var n = $('secSearch'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } });
  var sf = $('secFilter');
  if (sf) sf.onchange = function () { sectorFiltro = sf.value; renderSectores(); };
  var add = $('secAddBtn');
  if (add) add.onclick = function () {
    var tit = clean(($('secTitulo') || {}).value, 70).trim();
    var txt = clean(($('secTexto') || {}).value, 1000).trim();
    if (!tit) return alert('Ponle título a tu relato');
    if (!txt) return alert('Cuéntanos la historia (aunque sean 2 líneas)');
    var rec = {
      sector: $('secSector').value, tipo: $('secTipo').value,
      titulo: tit, texto: txt,
      quien: clean(($('secQuien') || {}).value, 40).trim(),
      anio: clean(($('secAnio') || {}).value, 12).trim(),
      icon: '🏘️', fecha: (function () { try { return cal.fmtKey.format(new Date()); } catch (e) { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); } })()
    };
    if (rec.tipo.indexOf('Hito') === 0) rec.icon = '📍';
    else if (rec.tipo.indexOf('Historia') === 0) rec.icon = '🏠';
    else if (rec.tipo.indexOf('Memoria') === 0) rec.icon = '👵';
    else if (rec.tipo.indexOf('Oficio') === 0) rec.icon = '🎣';
    else if (rec.tipo.indexOf('Fiesta') === 0) rec.icon = '🎉';
    if (sectorEditId) {
      var dd = getSectorRelatos();
      var r = dd.filter(function (x) { return x.id === sectorEditId; })[0];
      if (r) { r.sector = rec.sector; r.tipo = rec.tipo; r.titulo = rec.titulo; r.texto = rec.texto; r.quien = rec.quien; r.anio = rec.anio; r.icon = rec.icon; }
      sectorEditId = null;
      save('Relato actualizado 🏘️');
    } else {
      rec.id = uid('sec');
      getSectorRelatos().push(rec);
      save('Relato guardado 🏘️');
    }
    renderSectores();
  };
  var cancel = $('secCancelBtn');
  if (cancel) cancel.onclick = function () { sectorEditId = null; renderSectores(); };
  var exp = $('secExportBtn');
  if (exp) exp.onclick = function () {
    var dd = getSectorRelatos();
    if (!dd.length) return alert('Aún no tienes relatos que exportar');
    var txt = dd.map(function (r) { return '🏘️ ' + r.titulo + ' [' + r.tipo + ' · ' + sectorNombre(r.sector) + (r.anio ? ' · ~' + r.anio : '') + ']\n' + (r.texto || '') + '\n— ' + (r.quien || 'vecino/a'); }).join('\n\n');
    shareTxt('🏘️ Mis relatos de Penco por sector', txt);
  };
}

var guiaTab = 'eventos';
function switchGuiaTab(t) {
  guiaTab = t;
  var tE = $('tabComunaEventos'), tG = $('tabComunaGuia'), tS = $('tabComunaSectores'), tH = $('tabComunaHistoria'), tT = $('tabComunaTalleres');
  if (tE) tE.classList.toggle('btn-accent', t === 'eventos');
  if (tG) tG.classList.toggle('btn-accent', t === 'guia');
  if (tS) tS.classList.toggle('btn-accent', t === 'sectores');
  if (tH) tH.classList.toggle('btn-accent', t === 'historia');
  if (tT) tT.classList.toggle('btn-accent', t === 'talleres');
  var pE = $('comunaEventosPanel'), pG = $('comunaGuiaPanel'), pS = $('comunaSectoresPanel'), pH = $('comunaHistoriaPanel'), pT = $('comunaTalleresPanel');
  if (pE) pE.classList.toggle('hidden', t !== 'eventos');
  if (pG) pG.classList.toggle('hidden', t !== 'guia');
  if (pS) pS.classList.toggle('hidden', t !== 'sectores');
  if (pH) pH.classList.toggle('hidden', t !== 'historia');
  if (pT) pT.classList.toggle('hidden', t !== 'talleres');
  if (t === 'guia') renderGuiaPenco();
  if (t === 'sectores') renderSectores();
  if (t === 'historia') renderHistoriaPenco();
  if (t === 'talleres' && window.TalleresPenco && typeof window.TalleresPenco.render === 'function') { try { window.TalleresPenco.render(); } catch (e) {} }
}

function setupGuiaPenco() {
  if (!$('comunaDialog') || !$('tabComunaGuia') || !$('tabComunaHistoria')) {
    window._guiaRetry = (window._guiaRetry || 0) + 1;
    if (window._guiaRetry < 60) setTimeout(setupGuiaPenco, 500);
    return;
  }
  try {
    var btn = $('btnComuna');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('historia') < 0)
      btn.dataset.keywords += ' historia guia sectores barrios lirquen cosmito cerro verde primer agua florida tome talcahuano concepcion limite barrio crav playa negra rocuant andalien damero fundacion valdivia fanaloza carbon ferrocarril 1751 1843 villa planchada lautaro quiriquina cretacico plesiosaurio mosasaurio amonite gondwana arcaico conchal bellavista pitren vergel lafkenche carapenco pencana relato hito memoria vecino fiche sector';
  } catch (e) {}
  var tE = $('tabComunaEventos'), tG = $('tabComunaGuia'), tS = $('tabComunaSectores'), tH = $('tabComunaHistoria'), tT = $('tabComunaTalleres');
  if (tE && !tE.dataset.w) { tE.dataset.w = '1'; tE.onclick = function () { switchGuiaTab('eventos'); }; }
  if (tG && !tG.dataset.w) { tG.dataset.w = '1'; tG.onclick = function () { switchGuiaTab('guia'); }; }
  if (tS && !tS.dataset.w) { tS.dataset.w = '1'; tS.onclick = function () { switchGuiaTab('sectores'); }; }
  if (tH && !tH.dataset.w) { tH.dataset.w = '1'; tH.onclick = function () { switchGuiaTab('historia'); }; }
  if (tT && !tT.dataset.w) { tT.dataset.w = '1'; tT.onclick = function () { switchGuiaTab('talleres'); }; }
  /* al abrir, volver a la pestana de eventos (comportamiento original) */
  var b = $('btnComuna');
  if (b && !b.dataset.guiaW) {
    b.dataset.guiaW = '1';
    b.addEventListener('click', function () { try { switchGuiaTab('eventos'); } catch (e) {} });
  }
  try { renderGuiaPenco(); } catch (e) {}
  try { renderSectores(); } catch (eS) {}
  try { renderHistoriaPenco(); } catch (e2) {}
}

window.PencoGuia = { render: renderGuiaPenco, renderHistoria: renderHistoriaPenco, renderSectores: renderSectores, data: GUIA_PENCO, sectores: HISTORIA_SECTORES, historia: HISTORIA_PENCO, tab: switchGuiaTab, sectorRelatos: getSectorRelatos };
setTimeout(setupGuiaPenco, 600);

})();
