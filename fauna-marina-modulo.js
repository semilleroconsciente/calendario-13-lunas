/* ============================================================
   FAUNA MARINA — Calendario 13 Lunas (Penco · Bio-Bío)
   Apartado: Territorio > Costa y mar
     (btnFaunaMarina -> faunaMarinaDialog),
   pestañas: Hoy | Catálogo | Bitácora | Historia | Guía.
   Enfoque:
     🐋 Cetáceos del Golfo de Arauco: franca austral, jorobada,
        piloto, delfín austral, delfín chileno, marsopa, orca.
     🦭 Lobos + chungungo: lobo común, lobo fino, chungungo
        (nutria marina, en peligro).
     🐧 Pingüinos y aves marinas: Humboldt, Magallanes, yeco,
        piquero, pelícano (puente con 🦅 Aves e 🦀 Intermareal).
     🐢 Tortugas y visitantes: verde, olivácea, pez luna.
     🐟 Peces de orilla y roca (puente con 🎣 Pesca).
     🐙 Invertebrados emblema (puente con 🦀 Intermareal).
   Todo local y privado por usuario: userData().faunaMarina
     { registros: [], custom: [] }
   Sin dependencias externas. 100% offline. Se edita aquí.
   Datos dinámicos opcionales por territorio:
     window.Territorio.datos.faunaMarina (grupos) y
     window.Territorio.datos.historiaFaunaMarina (historia).
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
function getData() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { registros: [], custom: [] };
    if (!u.faunaMarina) u.faunaMarina = { registros: [], custom: [] };
    if (!Array.isArray(u.faunaMarina.registros)) u.faunaMarina.registros = [];
    if (!Array.isArray(u.faunaMarina.custom)) u.faunaMarina.custom = [];
    return u.faunaMarina;
  } catch (e) { return { registros: [], custom: [] }; }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function lunaTxt() {
  var k = todayKey();
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(k); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(k); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  return '';
}
function lunaTxtFor(key) {
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'L' + m.luna + '·d' + m.dia; }
  } catch (e) {}
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'L' + r.luna + '·d' + r.diaN; }
  } catch (e) {}
  return '';
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}

/* ---------- datos dinámicos por territorio ---------- */
function dynGrupos() {
  try {
    var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.faunaMarina;
    if (d && Array.isArray(d.grupos) && d.grupos.length) return d;
  } catch (e) {}
  return FAUNA_MARINA;
}
function dynHistoria() {
  try {
    var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.historiaFaunaMarina;
    if (d && Array.isArray(d.eras) && d.eras.length) return d;
  } catch (e) {}
  return HISTORIA_FAUNA;
}

/* ---------- catálogo base ---------- */
var FAUNA_MARINA = {
  intro: 'La fauna marina de Penco —<b>bahía, roquerío y golfo</b>— se mira desde la orilla: ballenas de paso, delfines tras el cardumen, lobos en La Cata, chungungo escondido, pingüinos ocasionales y el vecindario de peces y pulpos. <b>Toca una especie para cargarla en tu bitácora.</b>',
  grupos: [
    {
      clave: 'cetaceos', ico: '🐋', t: 'Cetáceos: ballenas y delfines',
      d: 'De julio a noviembre mira soplos desde altura. El resto del año, delfines anuncian el pique.',
      items: [
        { n: 'Ballena franca austral', cient: 'Eubalaena australis', ico: '🐋', temp: 'Jul–Nov (pico ago–oct)', hab: 'Golfo y boca de la bahía', estado: 'Preocupación menor', nota: 'Lomo negro sin aleta dorsal, callosidades blancas, soplo en V. La más vista desde costa. Anota hora, rumbo y si hay cría.' },
        { n: 'Ballena jorobada', cient: 'Megaptera novaeangliae', ico: '🐋', temp: 'Paso ocasional (verano–otoño)', hab: 'Mar abierto del Golfo', estado: 'Preocupación menor', nota: 'Salto y cola blanca por debajo: la foto de cola es su huella. Registro escaso pero posible.' },
        { n: 'Calderón / Ballena piloto', cient: 'Globicephala melas', ico: '🐋', temp: 'Otoño–primavera (grupos)', hab: 'Borde costero y bahía', estado: 'Preocupación menor', nota: 'Grupos grandes de aleta curva que siguen al jurel. Nunca rodear con kayak o bote.' },
        { n: 'Delfín austral', cient: 'Lagenorhynchus australis', ico: '🐬', temp: 'Todo el año', hab: 'Bahía Concepción', estado: 'Preocupación menor', nota: 'Grupos chicos y veloces tras cardúmenes. Si los ves, avisa a 🎣 Pesca: hay pique.' },
        { n: 'Delfín chileno / Tonina', cient: 'Cephalorhynchus eutropia', ico: '🐬', temp: 'Todo el año', hab: 'Orilla y desembocaduras', estado: 'Casi amenazado', nota: 'Endémico de Chile, chico y de aleta redonda. Vive pegado a la costa: botes despacio donde ande.' },
        { n: 'Marsopa espinosa', cient: 'Phocoena spinipinnis', ico: '🐬', temp: 'Todo el año (difícil)', hab: 'Aguas costeras turbias', estado: 'Casi amenazado', nota: 'Chica, oscura y tímida: apenas un lomo que rueda. Verla bien es premio de mar calmo.' },
        { n: 'Orca', cient: 'Orcinus orca', ico: '🐋', temp: 'Ocasional', hab: 'Golfo abierto', estado: 'Datos insuficientes', nota: 'Aleta alta y mancha blanca. Paso raro frente a Tumbes–Quiriquina. Distancia máxima y sin perseguir.' }
      ]
    },
    {
      clave: 'lobos', ico: '🦭', t: 'Lobos y chungungo: los de la roca',
      d: 'Se miran con binoculares desde arriba. Nunca en medio de la lobería.',
      items: [
        { n: 'Lobo marino común', cient: 'Otaria flavescens', ico: '🦭', temp: 'Todo el año', hab: 'Rocas La Cata, Tumbes, Quiriquina', estado: 'Preocupación menor', nota: 'Macho de melena hasta 300 kg. No alimentar ni acercarse a crías. Herido o enredado: Sernapesca 800 320 032.' },
        { n: 'Lobo fino austral', cient: 'Arctocephalus australis', ico: '🦭', temp: 'Otoño–invierno', hab: 'Roqueríos expuestos', estado: 'Preocupación menor', nota: 'Más chico y peludo, hocico corto. Descansa entre cochayuyo: si duerme, no lo despiertes por la foto.' },
        { n: 'Chungungo', cient: 'Lontra felina', ico: '🦦', temp: 'Todo el año (amanecer)', hab: 'Roquerío Playa Negra–La Cata', estado: 'En Peligro', nota: 'La nutria marina más pequeña del mundo vive aquí. Solitario, come jaibas y piure entre olas. Perros con correa: un ataque lo mata.' }
      ]
    },
    {
      clave: 'avesmar', ico: '🐧', t: 'Pingüinos y aves marinas',
      d: 'Puente con 🦅 Aves: las de mar abierto se anotan aquí y allá.',
      items: [
        { n: 'Pingüino de Humboldt', cient: 'Spheniscus humboldti', ico: '🐧', temp: 'Invierno–primavera', hab: 'Golfo, Playa Negra, Lirquén', estado: 'Vulnerable', nota: 'Ocasional. En playa: 50 m de distancia, perros lejos, avisa a SAG/Sernapesca. No lo devuelvas al agua tú.' },
        { n: 'Pingüino de Magallanes', cient: 'Spheniscus magellanicus', ico: '🐧', temp: 'Paso austral (otoño)', hab: 'Mar abierto y bahía', estado: 'Casi amenazado', nota: 'De paso migratorio. Igual protocolo que Humboldt: mirar, anotar, avisar.' },
        { n: 'Yeco / Cormorán', cient: 'Phalacrocorax spp.', ico: '🐦', temp: 'Todo el año', hab: 'Roqueríos y boyas', estado: 'Común', nota: 'Seca las alas abierto al viento. Pesca donde él pesca (pero a tu escala y con medida).' },
        { n: 'Piquero', cient: 'Sula variegata', ico: '🐦', temp: 'Primavera–verano', hab: 'Puntas y mar abierto', estado: 'Preocupación menor', nota: 'Clavado vertical tras anchoveta. Lluvia de piqueros = cardumen abajo = delfines cerca.' },
        { n: 'Pelícano', cient: 'Pelecanus thagus', ico: '🐦', temp: 'Todo el año', hab: 'Caletas y orilla', estado: 'Casi amenazado', nota: 'Patrullero de caleta. No le des restos de carnada con anzuelos: lo enredan.' }
      ]
    },
    {
      clave: 'tortugas', ico: '🐢', t: 'Tortugas y visitantes cálidos',
      d: 'Llegan con aguas cálidas o corrientes. Todo encuentro se avisa.',
      items: [
        { n: 'Tortuga verde', cient: 'Chelonia mydas', ico: '🐢', temp: 'Ocasional (aguas cálidas)', hab: 'Bahía y golfo', estado: 'En Peligro', nota: 'Si la ves flotando o varada: no la toques, foto a distancia y avisa a Sernapesca/SAG. Anota punto exacto.' },
        { n: 'Tortuga olivácea', cient: 'Lepidochelys olivacea', ico: '🐢', temp: 'Ocasional', hab: 'Mar abierto', estado: 'Vulnerable', nota: 'Más chica y de paso. Mismo protocolo: distancia + aviso. Nunca “devolverla” sin indicación oficial.' },
        { n: 'Pez luna', cient: 'Mola mola', ico: '🐟', temp: 'Ocasional (verano)', hab: 'Mar abierto', estado: 'Vulnerable', nota: 'Rueda gigante tomando sol de lado. Parece varado pero suele estar sano: observa y anota.' }
      ]
    },
    {
      clave: 'peces', ico: '🐟', t: 'Peces de orilla y roca',
      d: 'Puente con 🎣 Pesca: aquí se observan, allá se registran las capturas con veda y talla.',
      items: [
        { n: 'Corvina', cient: 'Cilus gilberti', ico: '🐟', temp: 'Primavera–verano', hab: 'Orilla arenosa', estado: 'Vulnerable', nota: 'La reina de la orilla. Talla mínima y veda: verifica en Sernapesca antes de pescar.' },
        { n: 'Robalo', cient: 'Eleginops maclovinus', ico: '🐟', temp: 'Todo el año', hab: 'Desembocaduras y estero', estado: 'Común', nota: 'Entra al estero Penco con la pleamar. El de orilla se devuelve chico.' },
        { n: 'Pejerrey de mar', cient: 'Odontesthes regia', ico: '🐟', temp: 'Primavera–otoño', hab: 'Orilla y muelles', estado: 'Común', nota: 'Cardumen de amanecer. Buen indicador: donde come pejerrey, caza el róbalo.' },
        { n: 'Congrio colorado', cient: 'Genypterus chilensis', ico: '🐟', temp: 'Otoño–invierno', hab: 'Fondos rocosos', estado: 'Vulnerable', nota: 'De cueva y noche. Veda de invierno: respétala, es su reproducción.' },
        { n: 'Jurel', cient: 'Trachurus murphyi', ico: '🐟', temp: 'Primavera–verano', hab: 'Bahía y golfo', estado: 'Común', nota: 'Cardumen que mueve a delfines, piqueros y caletas. Lleva solo lo justo.' },
        { n: 'Sierra', cient: 'Thyrsites atun', ico: '🐟', temp: 'Verano–otoño', hab: 'Golfo', estado: 'Común', nota: 'Rápida y dentada. De cuchara desde orilla al atardecer.' },
        { n: 'Lenguado', cient: 'Paralichthys spp.', ico: '🐟', temp: 'Primavera–verano', hab: 'Fondos arenosos', estado: 'Común', nota: 'Plano y maestro del camuflaje. Pejerrey vivo o señuelo lento sobre arena.' },
        { n: 'Pejesapo / Chalaco', cient: 'Gobiesox marmoratus', ico: '🐟', temp: 'Todo el año', hab: 'Pozas intermareales', estado: 'Común', nota: 'El cabezón de la poza que se pega a la roca. Solo foto: vuelve a su poza.' }
      ]
    },
    {
      clave: 'invertebrados', ico: '🐙', t: 'Invertebrados emblema',
      d: 'Puente con 🦀 Intermareal: aquí el encuentro, allá la cosecha con medida.',
      items: [
        { n: 'Pulpo del sur', cient: 'Enteroctopus megalocyathus', ico: '🐙', temp: 'Todo el año', hab: 'Cuevas y grietas', estado: 'Común', nota: 'Nocturno e inteligente. Si lo ves de día en poza, déjalo: está descansando. Nunca sacarlo de su cueva.' },
        { n: 'Jibia', cient: 'Dosidicus gigas', ico: '🦑', temp: 'Verano–otoño', hab: 'Mar abierto y orilla', estado: 'Común', nota: 'Varazones ocasionales. No consumir varadas sin aviso sanitario (marea roja / contaminación).' },
        { n: 'Jaiba mora', cient: 'Homalaspis plana', ico: '🦀', temp: 'Sep–Mar', hab: 'Pozas, bajo piedras', estado: 'Común', nota: 'Hembras con huevos no se toman. Talla 12 cm. Devuelve chicas y deja la piedra igual.' },
        { n: 'Loco', cient: 'Concholepas concholepas', ico: '🐚', temp: 'Veda / AMERB', hab: 'Roquerío bajo', estado: 'Vulnerable', nota: 'Solo en áreas de manejo y con autorización. En poza común: foto y registro, no extracción.' },
        { n: 'Erizo rojo', cient: 'Loxechinus albus', ico: '🟣', temp: 'Veda variable', hab: 'Roquerío bajo', estado: 'Vulnerable', nota: 'Veda frecuente: consulta Sernapesca antes. No en luna llena (desove).' },
        { n: 'Estrella de mar', cient: 'Stichaster striatus', ico: '⭐', temp: 'Todo el año', hab: 'Pozas, rocas bajas', estado: 'Común', nota: 'No tocar ni sacar del agua. Indicadora de poza sana: cuéntalas, no las lleves.' }
      ]
    }
  ],
  nota: '¿Viste conteo, rumbo o conducta? Anótalo en 📓 Bitácora con mar y viento: es ciencia ciudadana del golfo.',
  cierre: 'Mirar sin perseguir es cuidar: 100 m a ballenas, 50 m a pingüinos, fuera de la lobería y perros con correa.'
};

var HISTORIA_FAUNA = {
  intro: 'La fauna marina de Penco —del <b>mar cretácico de Quiriquina</b> al <b>golfo vivo de hoy</b>— en <b>10 periodos</b>. La historia completa vive aquí; toca una especie para cargarla en tu bitácora.',
  eras: [
    { t: '🦕 Mar de Quiriquina: el golfo originario', cuando: 'Cretácico Superior (72–66 Ma) · Formación Quiriquina',
      d: 'Todo Penco era <b>mar profundo</b>: el plesiosaurio <b>Aristonectes quiriquinensis (9 m)</b>, <b>mosasaurios</b>, tortugas <b>Osteopygis y Euclastes</b> y el ave <b>Neogaeornis</b>, con <b>amonites gigantes y Neilo pencana</b>. El golfo de hoy es el nieto de ese mar.',
      sp: ['Ballena franca austral', 'Congrio colorado', 'Jurel'] },
    { t: '🌿 Delta sin bahía: se cocina la despensa', cuando: 'Paleoceno–Eoceno (~60–40 Ma) · Formación Cosmito',
      d: 'El mar se retira y la costa es <b>delta pantanoso</b>: ríos trenzados llevan nutrientes al futuro golfo. Se prepara la <b>despensa</b> (sardina, anchoveta, jurel) que alimentará a ballenas, delfines y lobos millones de años después.',
      sp: ['Pejerrey de mar', 'Robalo', 'Delfín austral'] },
    { t: '❄️ Nace la bahía: mar interior abrigado', cuando: 'Pleistoceno – Holoceno Medio (~2 Ma – 6.000 a.p.)',
      d: 'El <b>río Biobío desembocaba dentro de la bahía</b> y la transgresión la inunda: terrazas, marismas e <b>isla Rocuant</b>. <b>Hualpén y Tumbes eran islas</b>: costa recortada ideal para <b>lobos, chungungos y delfines costeros</b>. Nace el escenario de toda la fauna penqueña.',
      sp: ['Lobo marino común', 'Chungungo', 'Delfín chileno / Tonina', 'Pelícano'] },
    { t: '🛶 Primeros navegantes: caza con medida', cuando: 'Arcaico (7.000–2.000 a.p.) · Bellavista 1, Playa Negra 9',
      d: 'Más de <b>30 conchales</b> rodean la bahía. Pescadores sedentarios con <b>corrales de piedra y navegación a Quiriquina</b>: pesca de <b>jurel, sierra, merluza y róbalo</b>, caza de <b>lobo marino</b> y marisqueo de loco, lapa y choro. Uso estacional, sin arrasar.',
      sp: ['Lobo marino común', 'Jurel', 'Sierra', 'Loco', 'Erizo rojo'] },
    { t: '🏺 Mundo lafkenche: gente del mar', cuando: '130 d.C. – 1550 · Pitrén / El Vergel',
      d: 'Territorio <b>ayllarewe lafkenche</b>: la fauna se ordena por <b>luna y estación</b>. <b>Corvina y robalo</b> en orilla, <b>cochayuyo y chorito</b> en roquerío, <b>lobo</b> cazado con respeto y trueque con el interior. El mar es pariente, no bodega.',
      sp: ['Corvina', 'Robalo', 'Lobo marino común', 'Chungungo'] },
    { t: '⛵ Colonia: puerto y despensa', cuando: '1550–1800 · Concepción en Penco + traslado 1751',
      d: 'La bahía se vuelve <b>puerto y despensa</b> de Concepción. Pesca de orilla para consumo, pescado seco por trigo. El <b>terremoto-maremoto de 1751</b> vacía Penco 90 años: lobos y aves recuperan borde donde hubo ciudad.',
      sp: ['Corvina', 'Congrio colorado', 'Sierra', 'Yeco / Cormorán'] },
    { t: '🐋 Siglo XIX: balleneros en el Golfo', cuando: '1800–1900 · carbón, cobre y vela',
      d: 'En el <b>Golfo de Arauco faenan balleneros</b> (franca y jorobada en su ruta). Caletas a remo y vela (<b>Lirquén ~1850</b>), espinel y trasmallo. Minas y fundición traen más bocas: la presión sobre orilla y roquerío crece por primera vez.',
      sp: ['Ballena franca austral', 'Ballena jorobada', 'Sierra', 'Congrio colorado', 'Lenguado'] },
    { t: '🏭 Siglo XX: industria, vedas y protección', cuando: '1900–2000 · puerto, motor y Sernapesca',
      d: 'Pesca industrial (jurel, merluza, sardina) cambia la escala. La artesanal resiste con <b>bote a motor y buceo apnea</b>. Llegan <b>vedas y tallas</b>, vigilancia de <b>marea roja</b> y en 1996 la <b>Ley de Caza protege</b> lobos, chungungo y aves marinas. Terremotos del 39 y 60 golpean caletas.',
      sp: ['Jurel', 'Lobo marino común', 'Chungungo', 'Pingüino de Humboldt', 'Erizo rojo', 'Loco'] },
    { t: '⚓ Hoy: golfo vivo y observar para cuidar', cuando: '2000 – actualidad · 27F + San Pedro 29-jun',
      d: 'La <b>franca austral vuelve a mostrarse (jul–nov)</b>, delfines siguen cardúmenes a la bahía y el <b>chungungo resiste en Playa Negra–La Cata</b>. El <b>27F (2010)</b> remodeló el borde. El desafío: <b>mirar sin perseguir</b>, respetar vedas y avisar varamientos. Tu bitácora suma: fecha, lugar, mar y conducta.',
      sp: ['Ballena franca austral', 'Delfín austral', 'Chungungo', 'Pingüino de Humboldt', 'Pulpo del sur', 'Corvina'] },
    { t: '🌙 Mañana: el golfo que queremos', cuando: 'Próximas lunas · compromiso',
      d: 'Un golfo con <b>ballenas de paso, lobos en su roca, chungungo sin perros sueltos y pozas con estrellas</b> depende de lo que hagamos en cada salida: basura de vuelta, nada de “recuerdos vivos”, denuncias a Sernapesca y caleta viva. <b>Cada avistamiento anotado es un voto por ese golfo.</b>',
      sp: ['Ballena franca austral', 'Chungungo', 'Estrella de mar', 'Lobo fino austral'] }
  ],
  fuentes: 'Fuentes: HISTORIA_PENCO (Quiriquina-Neogaeornis, bahía, conchales, caletas) · Bustos y Vergara 2004 · Fiesta de San Pedro 29-jun · Sernapesca vedas/tallas/marea roja · SHOA mareas · Ley de Caza 19.473 · saberes caleta Lirquén · catálogos Pesca, Intermareal, Aves y Ballenas de esta app.'
};

var LUGARES = ['Mirador Cerro Verde', 'Borde Lirquén–Penco', 'Playa Negra / La Cata', 'Caleta / embarcado', 'Desembocadura / Rocuant', 'Isla Quiriquina (lejos)', 'Otro'];
var CONDUCTAS = [
  { id: 'soplo', t: '💨 Soplo / salto' },
  { id: 'nado', t: '🌊 Nado / rumbo' },
  { id: 'come', t: '🐟 Alimentándose' },
  { id: 'descanso', t: '😴 Descanso en roca' },
  { id: 'cria', t: '👶 Con cría' },
  { id: 'varamiento', t: '⚠️ Varamiento / herido' },
  { id: 'otro', t: '👁️ Otro' }
];
function mesConsejo() {
  var mes = (new Date()).getMonth() + 1;
  if (mes >= 7 && mes <= 11) return { t: '🐋 Temporada de ballenas (jul–nov)', d: 'Sube al Mirador Cerro Verde 08–11 h sin viento sur, con binoculares. Soplo en V = franca austral: anota hora, rumbo y si hay cría. 100 m mínimo desde bote/kayak.' };
  if (mes === 12 || mes <= 2) return { t: '🐬 Verano: delfines y pozas', d: 'Mar calmo temprano: delfines tras el cardumen y pozas con pejesapo, estrellas y pulpo. Revisa marea roja antes de tocar marisco. Gorro, agua y basura de vuelta.' };
  if (mes >= 3 && mes <= 5) return { t: '🍂 Otoño: pilotos y jurel', d: 'Grupos de piloto/calderón siguiendo jurel. Atardecer (hora dorada) en borde Lirquén–Penco: piqueros clavando = cardumen abajo. Lleva abrigo: el sur enfría.' };
  return { t: '🌧️ Invierno previo: lobos y chungungo', d: 'Con marejada no entres al roquerío: mira lobos desde arriba y busca chungungo al amanecer en Playa Negra–La Cata. Perros con correa siempre.' };
}
function fmChip(nombre, ico) {
  return '<span class="chip su-3b6a3a" data-fm="' + esc(nombre) + '" title="Toca para cargarla en la bitácora">' + esc(ico || '🌊') + ' ' + esc(nombre) + '</span>';
}
function wireFmChips(scope) {
  if (!scope || !scope.querySelectorAll) return;
  scope.querySelectorAll('[data-fm]').forEach(function (el) {
    el.onclick = function () {
      try { switchTab('bit'); } catch (e) {}
      setTimeout(function () {
        var inp = $('fmSpecies');
        if (inp) {
          inp.value = el.getAttribute('data-fm');
          try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {}
        }
      }, 60);
    };
  });
}

/* ---------- pestañas ---------- */
var tab = 'hoy';
function switchTab(t) {
  tab = t;
  var ids = [['tabFmHoy', 'fmHoyPanel'], ['tabFmCat', 'fmCatPanel'], ['tabFmBit', 'fmBitPanel'], ['tabFmHist', 'fmHistPanel'], ['tabFmGuia', 'fmGuiaPanel']];
  var want = t === 'hoy' ? 'fmHoyPanel' : t === 'cat' ? 'fmCatPanel' : t === 'bit' ? 'fmBitPanel' : t === 'hist' ? 'fmHistPanel' : 'fmGuiaPanel';
  ids.forEach(function (p) {
    var panel = $(p[1]), b = $(p[0]);
    if (panel) panel.classList.toggle('hidden', p[1] !== want);
    if (b) b.classList.toggle('btn-accent', p[1] === want);
  });
  if (t === 'bit') renderLog();
  if (t === 'hist') renderHistoria();
}

function allSpecies() {
  var base = [];
  dynGrupos().grupos.forEach(function (g) {
    (g.items || []).forEach(function (it) {
      base.push({ grupo: g.t, clave: g.clave, nombre: it.n, cient: it.cient || '', ico: it.ico || '🌊', temp: it.temp || '', hab: it.hab || '', estado: it.estado || '', nota: it.nota || '', mine: false });
    });
  });
  var customs = [];
  try { customs = getData().custom || []; } catch (e) {}
  customs.forEach(function (c) {
    base.push({ grupo: c.grupo || 'Mías', clave: c.clave || 'mias', nombre: c.nombre, cient: c.cient || '', ico: c.ico || '🌊', temp: c.temp || '', hab: c.hab || '', estado: '', nota: c.nota || '', mine: true, id: c.id });
  });
  return base;
}

function renderHoy() {
  var box = $('fmHoyBox');
  if (!box) return;
  var c = mesConsejo();
  var lt = lunaTxt();
  var regs = [];
  try { regs = getData().registros || []; } catch (e) {}
  var spp = {};
  regs.forEach(function (r) { if (r.especie) spp[r.especie] = true; });
  box.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🦭 Hoy en el golfo ' + (lt ? '<span class="muted">· ' + esc(lt) + '</span>' : '') + '</h4>' +
    '<p class="su-6750b2"><b>' + esc(c.t) + '</b></p>' +
    '<p class="muted su-83cb86">' + esc(c.d) + '</p>' +
    '<p class="muted su-b439ab">🌙 Luna y mar: con <b>luna nueva/llena</b> hay mareas vivas (bajamares más bajas para roquerío, más corriente para bote). <b>Luna llena + pleamar + amanecer</b> = mejor visibilidad de soplos. Viento sur fuerte = no salir.</p>' +
    '<div class="su-c158a9"><span class="chip">' + regs.length + ' avistamientos</span><span class="chip">' + Object.keys(spp).length + ' especies vistas</span></div></div>';
  var box2 = $('fmHoyDestacadas');
  if (box2) {
    var g = dynGrupos();
    var dest = [];
    (g.grupos[0].items || []).slice(0, 3).forEach(function (it) { dest.push(it); });
    (g.grupos[1].items || []).slice(0, 2).forEach(function (it) { dest.push(it); });
    box2.innerHTML = '<h4>🔭 Para mirar hoy</h4><div class="su-14b4b5">' +
      dest.map(function (e) {
        return '<div class="si-card su-7aab68"><b class="su-6cb285">' + esc(e.ico || '🌊') + ' ' + esc(e.n) + '</b> <span class="muted su-4adef8"><i>' + esc(e.cient || '') + '</i></span>' +
          '<p class="muted su-aa314c">' + esc(e.temp || '') + ' · ' + esc(e.hab || '') + '</p></div>';
      }).join('') + '</div>';
  }
}

function renderCatalogo() {
  var box = $('fmCatBox');
  if (!box) return;
  var g = dynGrupos();
  var q = (($('fmCatFilter') || {}).value || '').toLowerCase();
  var gf = ($('fmCatGrupo') || {}).value || 'todos';
  var html = '';
  g.grupos.forEach(function (gr) {
    if (gf !== 'todos' && gr.clave !== gf) return;
    var items = (gr.items || []).filter(function (it) {
      return !q || ((it.n + ' ' + (it.cient || '') + ' ' + (it.hab || '') + ' ' + (it.temp || '')).toLowerCase().indexOf(q) >= 0);
    });
    var mias = [];
    try {
      mias = (getData().custom || []).filter(function (c) {
        return (c.clave || 'mias') === gr.clave &&
          (!q || ((c.nombre + ' ' + (c.cient || '') + ' ' + (c.hab || '')).toLowerCase().indexOf(q) >= 0));
      });
    } catch (e) {}
    if (!items.length && !mias.length) return;
    html += '<div class="menstrual-card su-d2c171"><h4>' + esc(gr.ico || '🌊') + ' ' + esc(gr.t) + '</h4>' +
      '<p class="muted su-11a508">' + esc(gr.d || '') + '</p>' +
      items.map(function (e) {
        return '<div class="si-card su-cfa1ec"><h4 class="su-6750b2">' + esc(e.ico || '🌊') + ' ' + esc(e.n) + ' <span class="muted su-7e3a94">· <i>' + esc(e.cient || '') + '</i></span></h4>' +
          '<p class="su-49f9d7">📍 ' + esc(e.hab || '') + (e.temp ? ' · ' + esc(e.temp) : '') + (e.estado ? ' · ' + esc(e.estado) : '') + '</p>' +
          '<p class="su-83cb86">' + esc(e.nota || '') + '</p>' +
          '<button type="button" class="btn fm-cargar su-337714" data-n="' + esc(e.n) + '">📓 Cargar en bitácora</button></div>';
      }).join('') +
      mias.map(function (c) {
        return '<div class="si-card su-a3194a"><h4 class="su-6cb285">' + esc(c.ico || '🌊') + ' ' + esc(c.nombre) + ' <span class="chip su-421073">mía</span></h4>' +
          (c.nota ? '<p class="su-48eb2e">' + esc(c.nota) + '</p>' : '') +
          '<div class="su-30b926"><button type="button" class="btn su-337714 fm-cargar" data-n="' + esc(c.nombre) + '">📓 Cargar</button> ' +
          '<button type="button" class="btn su-fd834a" data-fmdel="' + c.id + '">✕ Borrar</button></div></div>';
      }).join('') +
      '<details class="su-c8c413"><summary class="su-d9db22"><b>➕ Agregar especie en esta sección</b></summary>' +
      '<div class="conv-row su-8a77e5"><label class="su-4b3de7">Nombre * <input type="text" id="fmN-' + gr.clave + '" placeholder="ej: Gaviota, Chungungo" maxlength="40"></label></div>' +
      '<label>Nota <input type="text" id="fmR-' + gr.clave + '" placeholder="ej: visto en La Cata al amanecer" maxlength="120"></label>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" class="btn btn-accent su-30e741" data-fmadd="' + gr.clave + '">+ Guardar especie</button></div></details></div>';
  });
  box.innerHTML = html || '<p class="muted su-11a508">Sin resultados. Prueba “ballena”, “lobo”, “poza”, “orilla”…</p>';
  box.querySelectorAll('.fm-cargar').forEach(function (b) {
    b.onclick = function () {
      var sp = $('fmSpecies');
      if (sp) sp.value = b.getAttribute('data-n');
      switchTab('bit');
      try { sp.focus(); } catch (e) {}
    };
  });
  box.querySelectorAll('[data-fmadd]').forEach(function (btn) {
    btn.onclick = function () {
      var k = btn.getAttribute('data-fmadd');
      var nEl = $('fmN-' + k), rEl = $('fmR-' + k);
      var nombre = String((nEl && nEl.value) || '').trim().slice(0, 40);
      if (!nombre) { alert('Ponle nombre a la especie'); return; }
      var gr = null;
      dynGrupos().grupos.forEach(function (x) { if (x.clave === k) gr = x; });
      getData().custom.push({ id: uid('fm'), clave: k, grupo: gr ? gr.t : k, nombre: nombre, ico: (gr && gr.ico) || '🌊', cient: '', hab: '', temp: '', nota: String((rEl && rEl.value) || '').trim().slice(0, 120) });
      save('Especie guardada 🦭');
      renderCatalogo();
      refreshSpeciesSelect();
    };
  });
  box.querySelectorAll('[data-fmdel]').forEach(function (btn) {
    btn.onclick = function () {
      if (!confirm('¿Borrar tu especie?')) return;
      var d = getData();
      d.custom = (d.custom || []).filter(function (x) { return x.id !== btn.getAttribute('data-fmdel'); });
      save('Especie borrada');
      renderCatalogo();
      refreshSpeciesSelect();
    };
  });
}

function refreshSpeciesSelect() {
  var sp = $('fmSpecies');
  if (!sp) return;
  var cur = sp.value;
  sp.innerHTML = '';
  allSpecies().forEach(function (e) {
    var o = document.createElement('option');
    o.value = e.nombre;
    o.textContent = e.ico + ' ' + e.nombre;
    sp.appendChild(o);
  });
  if (cur) sp.value = cur;
}

function renderLog() {
  var box = $('fmLogBox');
  if (!box) return;
  var arr = [];
  try { arr = getData().registros || []; } catch (e) {}
  var st = $('fmStats');
  if (st) {
    var especies = {};
    arr.forEach(function (r) { if (r.especie) especies[r.especie] = true; });
    st.textContent = arr.length ? (arr.length + ' avistamientos · ' + Object.keys(especies).length + ' especie(s)') : 'Sin avistamientos aún';
  }
  if (!arr.length) { box.innerHTML = '<p class="muted su-11a508">Sin avistamientos. Sube al mirador, camina la orilla o mira la poza y anótalo: fecha, lugar, especie y conducta.</p>'; return; }
  var sorted = arr.slice().sort(function (a, b) { return String(b.fecha + (b.hora || '')).localeCompare(String(a.fecha + (a.hora || ''))); });
  box.innerHTML = sorted.slice(0, 80).map(function (r) {
    var cnd = CONDUCTAS.filter(function (a) { return a.id === r.conducta; })[0];
    return '<div class="habit-item su-78abdc"><span class="su-fbb1e4">' +
      '🦭 <b>' + esc(r.especie || 'Fauna marina') + '</b> · ' + esc(r.fecha || '') + (r.hora ? ' ' + esc(r.hora) : '') +
      '<br><span class="muted su-4adef8">' + esc(r.lugar || '') + (cnd ? ' · ' + esc(cnd.t) : '') + (r.cantidad ? ' · ×' + esc(r.cantidad) : '') + (lunaTxtFor(r.fecha) ? ' · ' + esc(lunaTxtFor(r.fecha)) : '') + '</span>' +
      (r.mar ? '<br><span class="muted su-4adef8">🌊 ' + esc(r.mar) + '</span>' : '') +
      (r.notas ? '<br><span class="su-11a508">' + esc(r.notas) + '</span>' : '') + '</span>' +
      '<span class="su-3a76ac">' +
      '<button type="button" class="btn fm-edit su-337714" data-id="' + r.id + '" title="Editar">✏️</button>' +
      '<button type="button" class="btn fm-del su-fd834a" data-id="' + r.id + '" title="Borrar">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.fm-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este avistamiento?')) return;
      var d = getData();
      d.registros = d.registros.filter(function (x) { return x.id !== b.getAttribute('data-id'); });
      save(); renderLog();
    };
  });
  box.querySelectorAll('.fm-edit').forEach(function (b) {
    b.onclick = function () {
      var d = getData();
      var r = null;
      d.registros.forEach(function (x) { if (x.id === b.getAttribute('data-id')) r = x; });
      if (!r) return;
      if ($('fmDate')) $('fmDate').value = r.fecha || '';
      if ($('fmTime')) $('fmTime').value = r.hora || '';
      if ($('fmPlace')) $('fmPlace').value = r.lugar || '';
      refreshSpeciesSelect();
      if ($('fmSpecies')) $('fmSpecies').value = r.especie || '';
      if ($('fmQty')) $('fmQty').value = r.cantidad || '';
      if ($('fmConduct')) $('fmConduct').value = r.conducta || 'nado';
      if ($('fmSea')) $('fmSea').value = r.mar || '';
      if ($('fmNotes')) $('fmNotes').value = r.notas || '';
      d.registros = d.registros.filter(function (x) { return x.id !== r.id; });
      save('Avistamiento cargado para editar ✏️ (guárdalo de nuevo)');
      renderLog();
      try { $('fmDate').focus(); } catch (e) {}
    };
  });
}

function renderHistoria() {
  var box = $('fmHistPanel');
  if (!box) return;
  var g = dynHistoria();
  var html = '<p class="muted su-b6db47">' + g.intro + '</p>';
  html += g.eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted su-2c4c6c">' + esc(e.cuando) + '</p>' +
      '<p class="su-afb724">' + e.d + '</p>' +
      '<div class="su-c158a9">' + (e.sp || []).map(function (n) { return fmChip(n, '🌊'); }).join('') + '</div></div>';
  }).join('');
  html += '<p class="muted su-a953a7">' + esc(g.fuentes) + '</p>';
  box.innerHTML = html;
  wireFmChips(box);
}

function renderGuia() {
  var box = $('fmGuiaBox');
  if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card"><h4>🤲 Ética: mirar sin perseguir</h4>' +
    '<div class="su-28e216">' + [
      '100 m mínimo a ballenas (bote/kayak en neutro, nunca entre madre y cría ni por delante del rumbo).',
      '50 m a pingüinos y fuera de la lobería: los lobos muerden si se sienten acorralados.',
      'Chungungo y nutrias: silencio, sin perros sueltos, nunca alimentar.',
      'Pozas: pies fuera, foto sin sacar nada del agua (estrellas, pulpo y pejesapo se quedan).',
      'Nada de “recuerdos vivos”: concha, estrella o caracol en la roca valen más que en la casa.',
      'Basura de vuelta, colillas incluidas: un plástico mata más que una red perdida.'
    ].map(function (t) { return '<span class="chip su-656fb9">• ' + esc(t) + '</span>'; }).join('') + '</div></div>' +
    '<div class="menstrual-card"><h4>🆘 Varamiento o herido: qué hacer</h4>' +
    '<p class="muted su-83cb86"><b>1)</b> No lo devuelvas al agua ni lo arrastres. <b>2)</b> Distancia + perros lejos + sombra si es pingüino/tortuga (sin mojar espiráculo de cetáceos). <b>3)</b> Anota punto exacto, hora, tamaño y fotos a distancia. <b>4)</b> Avisa: <b>Sernapesca 800 320 032</b>, SAG o Capitanía de Puerto. Tu bitácora con conducta “⚠️ Varamiento” sirve de respaldo.</p></div>' +
    '<div class="menstrual-card"><h4>☠️ Marea roja y consumo</h4>' +
    '<p class="muted su-83cb86">En <b>marea roja no coseches ni consumas</b> mariscos (chorito, choro, piure, loco). Revisa siempre <b>sernapesca.cl</b> antes de mariscar. Jibias o peces varados: no consumir sin aviso sanitario.</p></div>' +
    '<div class="menstrual-card"><h4>🌙 Luna, marea y viento</h4>' +
    '<p class="muted su-83cb86"><b>Luna nueva/llena</b> = mareas vivas: bajamares más bajas (ventana de roquerío 1 h antes a 1 h después de la mínima &lt;0,6 m) y más corriente para bote. <b>Llena + pleamar + amanecer</b> = soplos visibles. <b>Sur fuerte</b> = no salir (marejada y roca resbalosa). Nunca solo en roquerío: zapatilla con agarre y celu cargado.</p></div>' +
    '<div class="menstrual-card"><h4>🔗 Camina con el calendario</h4>' +
    '<div class="su-6157e8">' +
    '<button type="button" class="btn fm-go su-337714" data-go="btnFishing">🎣 Pesca</button>' +
    '<button type="button" class="btn fm-go su-337714" data-go="btnIntermareal">🦀 Intermareal</button>' +
    '<button type="button" class="btn fm-go su-337714" data-go="btnBallenas">🐋 Ballenas</button>' +
    '<button type="button" class="btn fm-go su-337714" data-go="btnBirds">🦅 Aves</button>' +
    '<button type="button" class="btn fm-go su-337714" data-go="btnKayak">⛵ Navegación menor</button>' +
    '<button type="button" class="btn fm-go su-337714" data-go="btnTides">🌊 Mareas</button>' +
    '</div></div>';
}

function buildShareText(list) {
  if (!list.length) return '🦭 Mis avistamientos de fauna marina — aún sin registros';
  var t = '🦭 Mis avistamientos de fauna marina · ' + list.length + '\n\n';
  list.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).forEach(function (r) {
    t += '• ' + r.fecha + (r.hora ? ' ' + r.hora : '') + ' · ' + (r.especie || 'fauna') + ' · ' + (r.lugar || '') + (r.cantidad ? ' ×' + r.cantidad : '') + (r.notas ? ' — ' + r.notas : '') + '\n';
  });
  return t + '\n— Bahía Concepción / Golfo de Arauco · Penco';
}

/* ---------- botón + diálogo + cableado ---------- */
function ensureButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g || $('btnFaunaMarina')) return;
  var b = document.createElement('button');
  b.id = 'btnFaunaMarina';
  b.className = 'btn';
  b.type = 'button';
  b.setAttribute('data-sub', 'mar');
  b.setAttribute('data-keywords', 'fauna marina ballena delfin lobo chungungo pinguino tortuga pulpo jibia loco erizo corvina robalo pejerrey congrio avistamiento varamiento golfo bahia roquerio poza orilla marea');
  b.textContent = '🦭 Fauna Marina';
  var ref = $('btnBallenas');
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
    else g.appendChild(b);
  } else g.appendChild(b);
}

function ensureCheckbox() {
  if (document.querySelector('[data-btn="btnFaunaMarina"]')) return;
  var ref = document.querySelector('[data-btn="btnBallenas"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnFaunaMarina"> 🦭 Fauna Marina';
    var wrap = ref.closest('label');
    if (wrap && wrap.parentNode) wrap.parentNode.insertBefore(lab, wrap.nextSibling);
  }
}

function ensureDialog() {
  if ($('faunaMarinaDialog')) return $('faunaMarinaDialog');
  var d = document.createElement('dialog');
  d.id = 'faunaMarinaDialog';
  var gruposOpts = dynGrupos().grupos.map(function (gr) { return '<option value="' + esc(gr.clave) + '">' + esc(gr.t) + '</option>'; }).join('');
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🦭 Fauna Marina — bahía y golfo de Penco</h3>' +
    '<button type="button" id="fmCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Ballenas, delfines, lobos, chungungo, pingüinos, peces y pulpos del Bio-Bío 🦭: mira desde la orilla, anota y cuida. Tus registros quedan <b>privados y locales</b>.</p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabFmHoy" class="btn btn-accent su-30e741">🦭 Hoy</button>' +
    '<button type="button" id="tabFmCat" class="btn su-30e741">📖 Catálogo</button>' +
    '<button type="button" id="tabFmBit" class="btn su-30e741">📓 Bitácora</button>' +
    '<button type="button" id="tabFmHist" class="btn su-30e741">📜 Historia</button>' +
    '<button type="button" id="tabFmGuia" class="btn su-30e741">🌙 Guía</button></div>' +
    '<div id="fmHoyPanel"><div id="fmHoyBox"></div><div id="fmHoyDestacadas" class="menstrual-card su-d2c171"></div></div>' +
    '<div id="fmCatPanel" class="hidden"><div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="fmCatFilter" placeholder="ej: ballena, lobo, poza..." maxlength="40"></label>' +
    '<label>Grupo <select id="fmCatGrupo"><option value="todos">Todos</option>' + gruposOpts + '</select></label></div><div id="fmCatBox" class="su-a22da5"></div></div>' +
    '<div id="fmBitPanel" class="hidden"><div class="menstrual-card"><h4>📓 Nuevo avistamiento</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="fmDate"></label>' +
    '<label>Hora <input type="time" id="fmTime" value="09:00"></label>' +
    '<label>Lugar <select id="fmPlace"></select></label></div>' +
    '<div class="conv-row"><label class="su-4b3de7">Especie <select id="fmSpecies"></select></label>' +
    '<label>Cantidad <input type="number" id="fmQty" min="1" value="1" class="su-8573ba"></label>' +
    '<label>Conducta <select id="fmConduct"></select></label></div>' +
    '<div class="conv-row"><label class="su-4b3de7">Mar / viento <input type="text" id="fmSea" placeholder="ej: calmo, sur suave" maxlength="30"></label></div>' +
    '<label>Notas <input type="text" id="fmNotes" placeholder="ej: 2 soplos rumbo norte, con cría" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8">' +
    '<button type="button" id="fmAdd" class="btn btn-accent su-30e741">+ Guardar avistamiento</button></div>' +
    '<div id="fmLogBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c">' +
    '<span id="fmStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9">' +
    '<button type="button" id="fmShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="fmExport" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="fmClear" class="btn su-214f75">🗑 Borrar</button></span></div></div></div>' +
    '<div id="fmHistPanel" class="hidden su-d2c171"></div>' +
    '<div id="fmGuiaPanel" class="hidden"><div id="fmGuiaBox" class="su-be2653"></div></div>' +
    '<div class="dlg-actions"><button type="button" id="fmClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  var pl = d.querySelector('#fmPlace');
  if (pl) LUGARES.forEach(function (l) { var o = document.createElement('option'); o.value = l; o.textContent = l; pl.appendChild(o); });
  refreshSpeciesSelect();
  var ac = d.querySelector('#fmConduct');
  if (ac) CONDUCTAS.forEach(function (a) { var o = document.createElement('option'); o.value = a.id; o.textContent = a.t; ac.appendChild(o); });
  return d;
}

function wire() {
  ensureButton();
  ensureDialog();
  ensureCheckbox();
  refreshSpeciesSelect();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnFaunaMarina') < 0) ALL_BTNS.push('btnFaunaMarina');
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnFaunaMarina') < 0) {
      var i = ORDEN_TERRITORIO.indexOf('btnBallenas');
      if (i >= 0) ORDEN_TERRITORIO.splice(i + 1, 0, 'btnFaunaMarina');
      else ORDEN_TERRITORIO.push('btnFaunaMarina');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnBallenas && p.btnFaunaMarina === undefined) p.btnFaunaMarina = true;
      });
    }
  } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  var btn = $('btnFaunaMarina');
  if (btn && !btn.dataset.fmW) {
    btn.dataset.fmW = '1';
    btn.onclick = function () {
      try { renderHoy(); } catch (e1) {}
      try { renderCatalogo(); } catch (e2) {}
      try { renderGuia(); } catch (e3) {}
      try { renderHistoria(); } catch (e4) {}
      try { switchTab(tab || 'hoy'); } catch (e5) {}
      try { renderLog(); } catch (e6) {}
      try { refreshSpeciesSelect(); } catch (e7) {}
      if ($('fmDate') && !$('fmDate').value) $('fmDate').value = todayKey();
      var dlg = $('faunaMarinaDialog');
      if (dlg && dlg.showModal) { try { dlg.showModal(); } catch (e8) { try { dlg.show(); } catch (e9) {} } }
    };
  }
  var t1 = $('tabFmHoy'), t2 = $('tabFmCat'), t3 = $('tabFmBit'), t4 = $('tabFmHist'), t5 = $('tabFmGuia');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchTab('cat'); }; }
  if (t3 && !t3.dataset.w) { t3.dataset.w = '1'; t3.onclick = function () { switchTab('bit'); }; }
  if (t4 && !t4.dataset.w) { t4.dataset.w = '1'; t4.onclick = function () { switchTab('hist'); }; }
  if (t5 && !t5.dataset.w) { t5.dataset.w = '1'; t5.onclick = function () { renderGuia(); switchTab('guia'); }; }
  var ct = $('fmCloseTop'), cb = $('fmClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { try { $('faunaMarinaDialog').close(); } catch (e) {} }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { try { $('faunaMarinaDialog').close(); } catch (e) {} }; }
  var dlg2 = $('faunaMarinaDialog');
  if (dlg2 && !dlg2.dataset.goW) {
    dlg2.dataset.goW = '1';
    dlg2.querySelectorAll('.fm-go').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-go');
        try { $('faunaMarinaDialog').close(); } catch (e) {}
        setTimeout(function () { try { var tgt = $(id); if (tgt) tgt.click(); } catch (e2) {} }, 150);
      };
    });
  }
  var cf = $('fmCatFilter');
  if (cf && !cf.dataset.w) { cf.dataset.w = '1'; cf.oninput = renderCatalogo; }
  var cg = $('fmCatGrupo');
  if (cg && !cg.dataset.w) { cg.dataset.w = '1'; cg.onchange = renderCatalogo; }
  var add = $('fmAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var esp = (($('fmSpecies') || {}).value || '').trim();
      if (!esp) { alert('Elige la especie primero'); return; }
      getData().registros.push({
        id: uid('fm'),
        fecha: ($('fmDate') && $('fmDate').value) || todayKey(),
        hora: ($('fmTime') && $('fmTime').value) || '',
        lugar: (($('fmPlace') || {}).value || ''),
        especie: esp,
        cantidad: clean((($('fmQty') || {}).value || '1'), 6),
        conducta: (($('fmConduct') || {}).value || 'nado'),
        mar: clean((($('fmSea') || {}).value || ''), 30),
        notas: clean((($('fmNotes') || {}).value || ''), 80)
      });
      if ($('fmNotes')) $('fmNotes').value = '';
      save('Avistamiento guardado 🦭');
      renderLog();
    };
  }
  var sh = $('fmShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var list = [];
      try { list = getData().registros || []; } catch (e) {}
      if (!list.length) { alert('Sin avistamientos aún'); return; }
      share('🦭 Mis avistamientos de fauna marina', buildShareText(list));
    };
  }
  var ex = $('fmExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var list = [];
      try { list = getData().registros || []; } catch (e) {}
      if (!list.length) { alert('Sin avistamientos aún'); return; }
      var blob = new Blob([buildShareText(list)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fauna-marina-avistamientos.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var cl = $('fmClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar todos tus avistamientos de fauna marina?')) return;
      getData().registros = [];
      save(); renderLog();
    };
  }
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

window.FaunaMarina = {
  tab: switchTab, renderHoy: renderHoy, renderCatalogo: renderCatalogo,
  renderLog: renderLog, renderHistoria: renderHistoria, renderGuia: renderGuia,
  list: getData, allSpecies: allSpecies
};
try {
  Object.defineProperties(window.FaunaMarina, {
    grupos: { get: dynGrupos },
    historia: { get: dynHistoria }
  });
} catch (e) { window.FaunaMarina.grupos = FAUNA_MARINA; window.FaunaMarina.historia = HISTORIA_FAUNA; }
try { document.addEventListener('territorio:listo', function () { try { renderCatalogo(); } catch (e) {} try { renderHistoria(); } catch (e2) {} try { refreshSpeciesSelect(); } catch (e3) {} }); } catch (e4) {}

var _fmRetry = 0;
function setupFm() {
  if (!document.querySelector('.action-group[data-group="territorio"] .group-btns') || typeof userData !== 'function') {
    _fmRetry++;
    if (_fmRetry < 80) setTimeout(setupFm, 500);
    return;
  }
  try { wire(); } catch (e) {}
  try { renderHoy(); } catch (e2) {}
  try { renderCatalogo(); } catch (e3) {}
  try { renderGuia(); } catch (e4) {}
}
setTimeout(setupFm, 700);

})();
