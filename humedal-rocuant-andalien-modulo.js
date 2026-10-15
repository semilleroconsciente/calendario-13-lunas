/* ============================================================
   HUMEDAL ROCUANT-ANDALIÉN — Calendario 13 Lunas (Penco · Bio-Bío)
   Apartado: Territorio > Costa y mar / Tierra (btnHumedal)
     (btnHumedal -> humedalDialog),
   pestañas: Hoy | Conocer | Vida | Visita | Defensa | Bitácora.
   Enfoque:
     🌾 Sistema Rocuant (Talcahuano) – Andalién (Penco) –
        Vasco Da Gama (Hualpén) – Paicaví / Tucapel Bajo
        (Concepción): ~1.500–2.000 ha, el humedal más grande
        del Gran Concepción y 2º del país para migratorias.
     🦩 Sitio IBA BirdLife (1 de 176 en Chile): 120–160
        especies de aves, nidificación y descanso migratorio.
     📜 Humedal Urbano declarado: Res. Ex. N°1.154/2026 MMA
        (06-03-2026, D.O. 10-03-2026, 1.377,2 ha, Talcahuano),
        rectificada por Res. N°2.293/2026. Ley 21.202.
     🤲 Visita ética + monitoreo ciudadano: pleamar concentra
        limícolas, amanecer levanta el canto; denunciar rellenos
        con foto+fecha ante SMA; sumarse a mingas y GEF Costeros.
   Todo local y privado por usuario: userData().humedal
     { avist: [], reportes: [], mingas: [] }
   Sin dependencias externas. 100% offline. Se edita aquí.
   Fuentes verificadas: MMA Res. 1.154/2026 + ficha 192 portal
     humedales, MMA 10-03-2026 (120 spp., pico recto, rayador,
     pelícano), GEF censo 16-feb-2023 (56 spp./2.673 ind.) +
     informe límites (pocha, sapitos, sosa, llinto, juncos),
     RHRAP/Manomet 2023 (Isla Reyes 52 ha, 120 parejas pilpilén),
     eBird Isla Reyes (chorlo semipalmado, pimpollo).
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
    if (!u) return { avist: [], reportes: [], mingas: [], custom: [] };
    if (!u.humedal) u.humedal = { avist: [], reportes: [], mingas: [], custom: [] };
    if (!Array.isArray(u.humedal.avist)) u.humedal.avist = [];
    if (!Array.isArray(u.humedal.reportes)) u.humedal.reportes = [];
    if (!Array.isArray(u.humedal.mingas)) u.humedal.mingas = [];
    if (!Array.isArray(u.humedal.custom)) u.humedal.custom = [];
    return u.humedal;
  } catch (e) { return { avist: [], reportes: [], mingas: [], custom: [] }; }
}
function getCustom() { try { var d = getData(); return Array.isArray(d.custom) ? d.custom : []; } catch (e) { return []; } }
function allAves() {
  var base = AVES_DESTACADAS.map(function (e) { var c = {}; for (var k in e) { if (Object.prototype.hasOwnProperty.call(e, k)) c[k] = e[k]; } return c; });
  var mine = getCustom().filter(function (e) { return e.kind === 'ave'; }).map(function (e) { var c = {}; for (var k in e) { if (Object.prototype.hasOwnProperty.call(e, k)) c[k] = e[k]; } c.mine = true; return c; });
  return base.concat(mine);
}
function allFF() {
  var base = FLORA_FAUNA.map(function (e) { var c = {}; for (var k in e) { if (Object.prototype.hasOwnProperty.call(e, k)) c[k] = e[k]; } return c; });
  var mine = getCustom().filter(function (e) { return e.kind !== 'ave'; }).map(function (e) { var c = {}; for (var k in e) { if (Object.prototype.hasOwnProperty.call(e, k)) c[k] = e[k]; } c.mine = true; return c; });
  return base.concat(mine);
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function lunaTxtFor(k) {
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(k); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(k); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  return '';
}
function tideToday() {
  try {
    var k = todayKey().slice(5);
    if (typeof getTidesForKey === 'function') return getTidesForKey(k);
  } catch (e) {}
  return null;
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}

/* ---------- contenido base ---------- */
var FICHA = {
  nombre: 'Sistema Humedal Rocuant-Andalién',
  tramo: 'Rocuant (Talcahuano) · Andalién (Penco) · Vasco Da Gama (Hualpén) · Paicaví / Tucapel Bajo (Concepción)',
  cuenca: 'Cuenca del río Andalién · Bahía de Concepción · Golfo de Arauco',
  superficie: 'Sistema ~1.500–2.000 ha · Humedal Urbano declarado 1.377,2 ha (Res. 1.154/2026)',
  figura: 'Humedal Urbano Ley 21.202 (MMA 06-03-2026, D.O. 10-03-2026; rect. Res. 2.293/2026) · Sitio IBA BirdLife · Piloto GEF Humedales Costeros',
  ambientes: 'Marisma y planicie mareal · totorales y juncales de agua dulce · pajonales · canales y estero · desembocadura del Andalién · isla Rocuant (antigua isla, hoy península por rellenos y 27F)'
};

var SERVICIOS = [
  { t: '🧽 Esponja anti-inundación', d: 'Amortigua crecidas del Andalién y marejadas. Cada relleno = más agua en las casas de Talcahuano–Penco–Concepción.' },
  { t: '🦩 Hotel migratorio', d: '2º humedal del país para migratorias: descanso y comida entre Alaska y Tierra del Fuego (sep–mar).' },
  { t: '🐟 Cuna de vida', d: 'Peces (lisa, pejerrey), coipo, anfibios y crustáceos crían entre totoras y canales.' },
  { t: '🌬️ Aire y clima', d: 'Captura carbono, enfría la ciudad y frena el viento con polvo industrial.' },
  { t: '📚 Aula viva', d: '160 especies contadas, monitoreo ROC/eBird, salidas educativas GEF y Fundación Cosmos.' }
];

var AVES_DESTACADAS = [
  /* Residentes acuáticas — censo GEF 16-feb-2023 (2.673 ind., 56 spp. ese día; 77 acumuladas) */
  { nombre: 'Tagua común', cient: 'Fulica armillata', ico: '🦆', tipo: 'Residente · la más abundante', censo: '1.261 ind. (censo feb-2023)', nota: 'La dueña del humedal: nidos flotantes entre totoras, pichones en verano. Contar taguas = medir salud del agua.' },
  { nombre: 'Cisne cuello negro', cient: 'Cygnus melancoryphus', ico: '🦢', tipo: 'Residente', censo: '236 ind. (feb-2023)', nota: 'Nidifica oct–dic entre totoras. Distancia 50 m, nunca pan. Con pichones a cuestas en verano.' },
  { nombre: 'Cisne coscoroba', cient: 'Coscoroba coscoroba', ico: '🦢', tipo: 'Residente', censo: '105 ind. (feb-2023)', nota: 'Blanco total, pico rojo. Más escaso y confianzudo: si lo ves con crías, anota y retrocede.' },
  { nombre: 'Tagua chica', cient: 'Fulica leucoptera', ico: '🦆', tipo: 'Residente', censo: '92 ind. (feb-2023)', nota: 'Prima chica de la común, pico amarillo. Anda en canales calmos del borde dulce.' },
  { nombre: 'Pato jergón grande', cient: 'Anas georgica', ico: '🦆', tipo: 'Residente', censo: '51 ind. (feb-2023)', nota: 'El pato más fiel del humedal. Parejas estables en pozas permanentes.' },
  { nombre: 'Pato gargantillo', cient: 'Anas bahamensis', ico: '🦆', tipo: 'Residente', censo: '53 ind. (feb-2023)', nota: 'Mejilla blanca inconfundible. Se vio con pichones en el censo de verano.' },
  { nombre: 'Pato cuchara', cient: 'Spatula platalea', ico: '🦆', tipo: 'Residente', censo: '21 ind. (feb-2023)', nota: 'Pico en cuchara para filtrar barro. Come donde el agua apenas tapa el pico.' },
  { nombre: 'Pato rana pico delgado', cient: 'Oxyura vittata', ico: '🦆', tipo: 'Residente', censo: '21 ind. (feb-2023)', nota: 'Buceador de cola tiesa. Se zambulle y “desaparece”: espera 30 segundos y reaparece.' },
  { nombre: 'Pato real', cient: 'Mareca sibilatrix', ico: '🦆', tipo: 'Residente', censo: '14 ind. (feb-2023)', nota: 'Silbador de frente blanca. Pastorea en bordes con pasto corto.' },
  { nombre: 'Pato colorado', cient: 'Spatula cyanoptera', ico: '🦆', tipo: 'Residente', censo: '6 ind. (feb-2023)', nota: 'Macho color ladrillo. Escaso aquí: cada registro vale.' },
  { nombre: 'Huala', cient: 'Podiceps major', ico: '🦆', tipo: 'Residente', censo: '12 ind. (feb-2023)', nota: 'Zambullidor grande de cuello largo. Nido flotante anclado a juncos.' },
  { nombre: 'Pimpollo / Picurio', cient: 'Rollandia rolland', ico: '🦆', tipo: 'Residente', censo: '130 ind. (eBird Isla Reyes)', nota: 'Zambullidor chico de ojos rojos. El “patito que se hunde” de los canales.' },
  { nombre: 'Pidén común', cient: 'Pardirallus sanguinolentus', ico: '🐦', tipo: 'Residente · escondido', nota: 'Se oye más de lo que se ve: grito áspero al amanecer entre juncos.' },
  { nombre: 'Perrito', cient: 'Himantopus mexicanus', ico: '🦩', tipo: 'Residente', censo: '59 ind. (feb-2023)', nota: 'Zancos rosados, blanco y negro. Nido en barro: perros lejos en primavera.' },
  { nombre: 'Pilpilén común', cient: 'Haematopus palliatus pitanay', ico: '🐦', tipo: 'Residente · EMBLEMA', estado: 'Casi Amenazada · RHRAP 2023', censo: '~120 parejas (Isla Reyes, 52 ha)', nota: 'Pico naranjo, nido en arena. ≥1% de su población biogeográfica vive aquí. Vehículos, perros y pisadas = cero pichones. Solo mirador.' },
  { nombre: 'Cuervo de pantano', cient: 'Plegadis chihi', ico: '🦩', tipo: 'Residente', nota: 'Ibis café-bronce que hoza en el barro. Bandadas al atardecer = agua sana.' },
  { nombre: 'Trabajador', cient: 'Phleocryptes melanops', ico: '🐦', tipo: 'Especialista de totora', nota: 'Teje su nido colgando de la totora. No cortar totora sep–ene: es maternidad.' },
  { nombre: 'Queltrehue', cient: 'Vanellus chilensis', ico: '🐦', tipo: 'Residente borde', censo: '20 ind. (feb-2023)', nota: 'Guardián gritón del pastizal. Si grita mucho, hay nido cerca: desvía tu paso.' },
  { nombre: 'Yeco', cient: 'Phalacrocorax brasilianus', ico: '🦅', tipo: 'Residente', censo: '127 ind. (feb-2023)', nota: 'Seca sus alas abiertas en palos y muelles. Pesca en canales y desembocadura.' },
  { nombre: 'Garza cuca', cient: 'Ardea cocoi', ico: '🦢', tipo: 'Residente', nota: 'Garza gigante gris. Pesca inmóvil horas: si la espantas, pierde su comida del día.' },
  /* Migratorias — ruta del Pacífico (sep–mar) */
  { nombre: 'Zarapito común', cient: 'Numenius hudsonicus', ico: '🦩', tipo: 'Migratoria sep–mar · RHRAP', estado: '≥1% población biogeográfica', censo: '37 ind. (feb-2023)', nota: 'Pico curvo largo. Vuela desde Alaska; en pleamar se aprieta en bordes: no lo hagas volar, viene exhausto.' },
  { nombre: 'Zarapito pico recto', cient: 'Limosa haemastica', ico: '🦩', tipo: 'Migratoria (MMA)', nota: 'Pico recto bicolor, patas largas. Confirmado por MMA: joya del barro intermareal.' },
  { nombre: 'Gaviota de Franklin', cient: 'Leucophaeus pipixcan', ico: '🕊️', tipo: 'Migratoria', censo: '180 ind. (feb-2023)', nota: 'Capucha negra en verano, vuela desde Canadá. Descansa en bandadas: obsérvala sentada, sin acercarte.' },
  { nombre: 'Pitotoy chico', cient: 'Tringa flavipes', ico: '🐦', tipo: 'Migratoria', nota: 'Patas amarillas, pico fino. Come en barro con bajamar de mañana.' },
  { nombre: 'Gaviotín elegante', cient: 'Thalasseus elegans', ico: '🕊️', tipo: 'Migratoria / costera', nota: 'Piquero elegante en la desembocadura. Donde pesca, hay cardumen: dato para Pesca.' },
  { nombre: 'Rayador', cient: 'Rynchops niger', ico: '🕊️', tipo: 'Migratoria (MMA)', nota: '“Corta” el agua con el pico al volar bajo al atardecer. Inconfundible y escaso: foto a distancia.' },
  { nombre: 'Chorlo semipalmado', cient: 'Charadrius semipalmatus', ico: '🐧', tipo: 'Migratoria', censo: '12 ind. (eBird Isla Reyes)', nota: 'Chorlo chico de collar. Corre-picotea en planicie mareal con bajamar.' },
  { nombre: 'Pelícano peruano', cient: 'Pelecanus thagus', ico: '🦤', tipo: 'Costera', nota: 'Planea en fila sobre la rompiente y la desembocadura. No le des pescado: lo vuelve dependiente.' },
  { nombre: 'Chorlo nevado', cient: 'Charadrius nivosus', ico: '🐧', tipo: 'Nidifica oct–feb', nota: 'Nido invisible en arena. Un paso o una rueda = un nido menos. Solo mirador en verano.' },
  /* Borde, canto y rapaces */
  { nombre: 'Halcón peregrino', cient: 'Falco peregrinus', ico: '🦅', tipo: 'Depredador', nota: 'El más rápido del planeta caza patos sobre el humedal. Verlo cazar = cadena completa viva.' },
  { nombre: 'Halcón perdiguero', cient: 'Falco femoralis', ico: '🦅', tipo: 'Depredador (GEF)', nota: 'Caza en bordes y pastizales. Confirmado por GEF Costeros.' },
  { nombre: 'Cernícalo', cient: 'Falco sparverius', ico: '🦅', tipo: 'Depredador (GEF)', nota: 'Se cierne quieto contra el viento antes de clavarse. El halcón chico del borde.' },
  { nombre: 'Picaflor chico', cient: 'Sephanoides sephaniodes', ico: '🐝', tipo: 'Borde / migratoria austral', censo: '4 ind. (feb-2023)', nota: 'Poliniza chilco del borde. Si plantas nativo, vuelve.' },
  { nombre: 'Picaflor gigante', cient: 'Patagona gigas', ico: '🐝', tipo: 'Borde', censo: '1 ind. (feb-2023)', nota: 'El colibrí más grande del mundo, zumbido grave. Escaso aquí: gran registro.' },
  { nombre: 'Tortolita cuyana', cient: 'Columbina picui', ico: '🕊️', tipo: 'Borde', censo: '2 ind. (feb-2023)', nota: 'Palomita chica del matorral seco del borde alto.' },
  { nombre: 'Diuca común', cient: 'Diuca diuca', ico: '🐦', tipo: 'Borde', nota: 'Canto triste del cerco. Come semillas del borde sin entrar al pajonal.' }
];

var FLORA_FAUNA = [
  { nombre: 'Sosa de mar', cient: 'Sarcocornia fruticosa', ico: '🌿', grupo: 'Flora marisma (GEF)', nota: 'Alfombra suculenta que tolera sal. Marca la pleamar: ahí comen los playeros. Confirmada GEF/MMA.' },
  { nombre: 'Llinto', cient: 'Spartina densiflora', ico: '🌾', grupo: 'Flora marisma (GEF)', nota: 'Pasto duro de marisma que frena la ola y atrapa barro. Cuna de cangrejos y polluelos.' },
  { nombre: 'Botón de oro', cient: 'Cotula coronopifolia', ico: '🌼', grupo: 'Flora (MMA)', nota: 'Alfombra de botones amarillos en barro húmedo. Ficha oficial del expediente MMA 192.' },
  { nombre: 'Junco alto', cient: 'Juncus procerus', ico: '🌾', grupo: 'Flora dulce (GEF)', nota: 'Juncal alto de agua dulce: dormidero de pidén y trabajador.' },
  { nombre: 'Junquillo', cient: 'Juncus capitatus', ico: '🌾', grupo: 'Flora (GEF)', nota: 'Junco enano de pozas temporales. Piso frágil: no pisar fuera del sendero.' },
  { nombre: 'Totora', cient: 'Typha angustifolia', ico: '🌾', grupo: 'Flora dulce', nota: 'Filtra el agua y sostiene nidos colgantes. No cortar sep–ene (nidos).' },
  { nombre: 'Duraznillo de agua', cient: 'Polygonum persicaria', ico: '🌸', grupo: 'Flora borde (GEF)', nota: 'Espigas rosadas del borde húmedo. Marca canales sanos.' },
  { nombre: 'Pelillo', cient: 'Gracilaria chilensis', ico: '🌊', grupo: 'Alga estuario (GEF)', nota: 'Alga roja del estuario: guardería de alevines y pulgas de mar.' },
  { nombre: 'Coipo', cient: 'Myocastor coypus', ico: '🦦', grupo: 'Mamífero (MMA)', nota: 'Roedor nadador que abre canales entre totoras. Al atardecer, silencio y orilla. Ficha MMA 192.' },
  { nombre: 'Pocha', cient: 'Cheirodon galusdae', ico: '🐟', grupo: 'Pez endémico (GEF)', nota: 'Pecesito chileno de canales dulces. Si hay pochas, el agua respira.' },
  { nombre: 'Sapito de cuatro ojos', cient: 'Pleurodema thaul', ico: '🐸', grupo: 'Anfibio (GEF)', nota: 'Coro nocturno ago–sep en el borde dulce. Piel que respira: solo mirar.' },
  { nombre: 'Sapito de antifaz', cient: 'Batrachyla taeniata', ico: '🐸', grupo: 'Anfibio (GEF)', nota: 'Bajo troncos húmedos del borde. Devuelve cada piedra a su lugar.' },
  { nombre: 'Culebra de cola larga', cient: 'Philodryas chamissonis', ico: '🐍', grupo: 'Reptil · Preocupación Menor', nota: 'Endémica, cazadora de ratones del borde. No es peligrosa: déjala pasar.' },
  { nombre: 'Rana chilena', cient: 'Calyptocephalella gayi', ico: '🐸', grupo: 'Anfibio · Vulnerable', nota: 'Gigante de pozas permanentes. Ver una adulta = premio: solo desde la orilla.' }
];

var CICLO_ANUAL = [
  { m: 'ENE–FEB', t: '☀️ Polluelos y pleamar de verano', d: 'Cisnes y taguas con crías entre totoras. Chorlo nidificando: SOLO mirador, nada de entrar. Lleva agua y gorro; basura de vuelta (el viento la lleva al agua).' },
  { m: 'MAR', t: '🦩 Despedida migratoria', d: 'Últimas bandadas rumbo al norte. Grandes concentraciones con pleamar: mejor 2 h antes/después de la alta.' },
  { m: 'ABR–MAY', t: '🍂 Residentes y lluvia que lava', d: 'Llegan las primeras lluvias: el humedal se recarga. Patos y garzas dispersos. Buen tiempo para limpiezas de borde (con guantes, nunca solo).' },
  { m: 'JUN–AGO', t: '🌧️ Esponja a prueba', d: 'Pukem: el humedal frena inundaciones. Coscorobas y cisnes en cortejo. Evita bordes con barro hondo y no entres con lluvia fuerte.' },
  { m: 'SEP', t: '🦩 ¡Vuelven!', d: 'Llegan zarapitos, fío-fío y pitotoyes. Amanecer 06:30–09:00 = gran canto y movimiento. Anota primera llegada en Fenología.' },
  { m: 'OCT–DIC', t: '⚪ Nidificación sagrada', d: 'Pilpilén, chorlo, cisnes y trabajadores nidificando. Distancia, perros con correa o mejor no llevarlos, sin dron bajo, sin entrar a pajonales.' }
];

var ACCESOS = [
  { n: 'Desembocadura Andalién (Penco)', d: 'El acceso más cercano desde Penco: orilla y miradores naturales. Ideal amanecer + pleamar. Llega por borde costero, sin abrir huellas nuevas.' },
  { n: 'Borde Rocuant (Talcahuano)', d: 'Marisma amplia y aeropuerto Carriel al medio: quédate en caminos y miradores, no cruces pista ni pajonales. Atardecer con luz lateral = mejor conteo.' },
  { n: 'Vasco Da Gama / Paicaví (Hualpén–Concepción)', d: 'Tramo urbano fragmentado: parques de humedal Fundación Cosmos en diseño. Perfecto para limpiezas guiadas y monitoreo escolar.' },
  { n: 'Miradores, no trochas', d: 'El humedal se mira desde el borde: binoculares, ropa apagada, silencio. Cada pisada en marisma aplasta nidos invisibles.' }
];

var ETICA = [
  'Distancia 30–50 m a aves (más con polluelos). Si se alarman, ya estás muy cerca: retrocede.',
  'No alimentar (pan, papas, restos): enferma cisnes/patos y pudre el agua.',
  'Perros con correa corta o mejor no llevarlos en oct–feb. Un perro suelto = una nidada perdida.',
  'Basura de vuelta, incluida la orgánica. Colillas al bolsillo: una contamina 50 L.',
  'Sin dron bajo, sin parlantes, sin fogatas. El humedal es sala de maternidad, no cancha.',
  'No cortar totora/junco en primavera-verano ni abrir canales. Foto sí, “recuerdo” no.',
  'De noche solo borde y con luna: no entres al pajonal (nidos, coipos, barro).'
];

var AMENAZAS = [
  { t: 'Rellenos y escombreras', d: 'Décadas rellenando bordes para tomas, bodegas y caminos. Cada camión = menos esponja y más inundación. Denunciable ante SMA.' },
  { t: 'Descargas y alcantarillado', d: 'Aportes cloacales e industriales pudren canales. Si ves espuma, color raro u olor fuerte: foto + fecha + punto y denuncia.' },
  { t: 'Autopista interportuaria + aeropuerto', d: 'Fragmentan el sistema y atropellan fauna. No cruzar pista/vía a pie; avisa choques de aves con fecha.' },
  { t: 'Pastoreo y perros sueltos', d: 'Ovinos/bovinos compactan y comen brotes; perros matan nidadas. Ganado y mascotas fuera del pajonal.' },
  { t: 'Plantas invasoras y basura', d: 'Especies foráneas dominan por pastoreo y relleno. Saca 1 bolsa por visita; nunca tires poda o escombro “al humedal”.' },
  { t: '27F y marejadas', d: 'El tsunami 2010 remodeló bordes. Con alerta SENAPRED/SHOA: solo mirador alto, plan de evacuación a mano.' }
];

var HISTORIA = [
  { t: '🌊 Isla Rocuant y marisma eterna', cuando: 'Holoceno – s. XIX', d: 'Hualpén y Tumbes fueron islas; Rocuant, isla entre marismas del Andalién. Lafkenche pesca, marisca y navega a Quiriquina entre bandadas.' },
  { t: '🏭 Relleno del siglo XX', cuando: '1950–2000', d: 'Crecimiento urbano e industrial rellena bordes, instala aeropuerto Carriel en el medio y corta el sistema con caminos. El humedal “desaparece” del plano pero sigue ahí.' },
  { t: '🔭 Ciencia ciudadana', cuando: '2000–2020', d: 'ROC/eBird lo fijan como IBA: 120–160 especies. Piloto GEF Humedales Costeros, Comité Técnico Local, “Conociendo al Pilpilén”.' },
  { t: '📜 Solicitud municipal', cuando: '24-08-2022', d: 'Oficio N°599 Municipalidad de Talcahuano pide Humedal Urbano (1.561 ha). Admisibilidad SEREMI MMA N°1.064 (14-09-2022).' },
  { t: '✅ Declaratoria', cuando: '06-03-2026', d: 'Res. Ex. MMA N°1.154 reconoce Humedal Urbano Rocuant-Andalién Talcahuano (1.377,2 ha). Publicada D.O. 10-03-2026. Rectificada por Res. N°2.293 (05-05-2026, enlace expediente 192).' },
  { t: '⚖️ Disputa viva', cuando: '2026–hoy', d: 'GORE + gremios reclaman ante Tribunal Ambiental (plataforma logística vs protección); municipio, Fundación Bandada y ONG Defensa Ambiental defienden. 8 reclamaciones en curso: verifica estado antes de citar. Tu monitoreo con fecha ayuda al expediente.' },
  { t: '🌱 Parques de humedal', cuando: '2025–hoy', d: 'Fundación Cosmos + municipios diseñan parques de humedal (pasarelas, miradores) como en Río Maipo: restaurar sin pisar, vincular sin romper.' }
];

var LUGARES_BIT = ['Desembocadura Andalién (Penco)', 'Borde Rocuant (Talcahuano)', 'Vasco Da Gama (Hualpén)', 'Paicaví / Tucapel Bajo', 'Mirador / pasarela', 'Otro'];
var TIPOS_REPORTE = ['Relleno / escombro', 'Descarga rara / espuma', 'Perro suelto / ganado', 'Ave herida / muerta', 'Atropello / choque', 'Basural', 'Corta de totora', 'Otro'];
var TIPOS_MINGA = ['Avistamiento guiado', 'Limpieza de borde', 'Monitoreo ciudadano', 'Plantación borde', 'Educación / charla', 'Otro'];

/* ---------- pestañas ---------- */
var tab = 'hoy';
function switchTab(t) {
  tab = t;
  var pares = [['tabHumHoy', 'humHoyPanel'], ['tabHumCon', 'humConPanel'], ['tabHumVida', 'humVidaPanel'], ['tabHumVis', 'humVisPanel'], ['tabHumDef', 'humDefPanel'], ['tabHumBit', 'humBitPanel']];
  var want = t === 'hoy' ? 'humHoyPanel' : t === 'con' ? 'humConPanel' : t === 'vida' ? 'humVidaPanel' : t === 'vis' ? 'humVisPanel' : t === 'def' ? 'humDefPanel' : 'humBitPanel';
  pares.forEach(function (p) {
    var panel = $(p[1]), b = $(p[0]);
    if (panel) panel.classList.toggle('hidden', p[1] !== want);
    if (b) b.classList.toggle('btn-accent', p[1] === want);
  });
  if (t === 'bit') renderBit();
}

function consejoHoy() {
  var mes = (new Date()).getMonth() + 1;
  if (mes === 9 || mes === 10) return { t: '🦩 Llegan las migratorias', d: 'Amanecer 06:30–09:00 + pleamar = máxima concentración. Lleva binoculares y anota tu primera bandada: es dato científico.' };
  if (mes >= 10 && mes <= 12) return { t: '⚪ Nidos por todas partes', d: 'Pilpilén, chorlo y cisnes nidificando. SOLO borde y mirador, perros lejos, sin dron bajo. Si ves nido, aléjate y anota a distancia.' };
  if (mes >= 1 && mes <= 3) return { t: '☀️ Polluelos + pleamar', d: 'Crías entre totoras y últimas migratorias. 2 h antes/después de pleamar es la ventana. Agua, gorro y bolsa para basura ajena.' };
  if (mes >= 4 && mes <= 5) return { t: '🍂 Recarga de otoño', d: 'Lluvias recargan el sistema. Buen mes para limpieza de borde con guantes y monitoreo de canales.' };
  return { t: '🌧️ Esponja trabajando', d: 'Pukem: el humedal frena crecidas. Observa niveles y compuertas desde caminos, sin entrar al barro. Reporta descargas raras.' };
}

function renderHoy() {
  var box = $('humHoyBox');
  if (!box) return;
  var k = todayKey(), c = consejoHoy(), lt = lunaTxtFor(k);
  var tide = tideToday();
  var tideTxt = '';
  if (tide && tide.tides && tide.tides.length) {
    var ple = tide.tides.filter(function (x) { return x.t === 'pleamar'; }).map(function (x) { return x.h; }).join(', ');
    var baj = tide.tides.filter(function (x) { return x.t === 'bajamar'; }).map(function (x) { return x.h; }).join(', ');
    tideTxt = 'Pleamar: ' + (ple || '—') + ' · Bajamar: ' + (baj || '—') + (tide.estimated ? ' (*est.)' : '');
  }
  var d = getData();
  box.innerHTML =
    '<div class="menstrual-card su-68a1a9 su-ead3fa">' +
    '<div class="su-2c76a2">' +
    '<span class="chip su-4261fc">🌾 Rocuant-Andalién · Talcahuano–Penco</span>' +
    '<span class="chip su-0e62e3">1.377,2 ha HU · 3° del país</span>' +
    '<span class="chip">🦩 IBA · RHRAP 2023</span>' +
    (lt ? '<span class="chip">' + esc(lt) + '</span>' : '') + '</div>' +
    '<h4 class="su-66dc28">🌾 Hoy en el humedal</h4>' +
    '<p class="su-6750b2 su-c53a70"><b>' + esc(c.t) + '</b></p>' +
    '<p class="muted su-83cb86">' + esc(c.d) + '</p>' +
    (tideTxt ? '<p class="muted su-11a508 su-5810cb">🌊 Mareas hoy (Talcahuano): <b>' + esc(tideTxt) + '</b> — pleamar concentra limícolas en bordes; bajamar los dispersa a comer. Ventana ideal: <b>2 h antes/después de pleamar</b>.</p>' : '') +
    '<p class="muted su-11a508">🌙 Luna viva: con <b>nueva/llena</b> hay mareas vivas; de noche nublada y tibia, coros de sapito de cuatro ojos en el borde dulce.</p>' +
    '<p class="muted su-b439ab">📓 Llevas <b>' + d.avist.length + '</b> avistamientos · <b>' + d.reportes.length + '</b> reportes · <b>' + d.mingas.length + '</b> mingas. Cada fecha suma al expediente vivo.</p></div>';
}

function renderConocer() {
  var box = $('humConBox');
  if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card su-ead3fa"><h4>🌾 ' + esc(FICHA.nombre) + '</h4>' +
    '<div class="su-38c0a4">' +
    '<span class="chip su-b0b544"><b>1.377,2 ha</b>&nbsp;humedal urbano</span>' +
    '<span class="chip"><b>~2.955 ha</b>&nbsp;sistema (GEF 2020)</span>' +
    '<span class="chip">🦩 <b>120+</b> aves · IBA 52</span>' +
    '<span class="chip">🌎 RHRAP · 1% pilpilén + zarapito</span></div>' +
    '<p class="muted su-11a508">📍 ' + esc(FICHA.tramo) + '<br>🌊 ' + esc(FICHA.cuenca) + '</p>' +
    '<p class="su-49f9d7">📐 ' + esc(FICHA.superficie) + '</p>' +
    '<p class="su-49f9d7">📜 ' + esc(FICHA.figura) + '</p>' +
    '<p class="muted su-83cb86">🏞️ ' + esc(FICHA.ambientes) + '</p>' +
    '<p class="muted su-d47a97 su-ae4019">Fuentes: MMA Res. 1.154/2026 (D.O. 10-03-2026, rect. 2.293/2026) · GEF Humedales Costeros · Manomet/RHRAP 2023 · Portal MMA ficha 192.</p></div>' +
    '<div class="menstrual-card su-d2c171"><h4>💚 Por qué te cuida (servicios)</h4>' +
    SERVICIOS.map(function (s) { return '<div class="si-card su-7aab68 su-055ce6"><b>' + esc(s.t) + '</b><p class="muted su-11a508">' + esc(s.d) + '</p></div>'; }).join('') + '</div>' +
    '<div class="menstrual-card"><h4>🗓️ Ciclo anual del humedal</h4>' +
    CICLO_ANUAL.map(function (c, ix) { return '<div class="si-card su-cfa1ec" style="border-left:4px solid ' + ['#e8c56a', '#e8c56a', '#a9d18e', '#7fb3d5', '#4db6ac', '#e76e8a'][ix % 6] + '"><b class="su-6750b2">' + esc(c.m) + ' — ' + esc(c.t) + '</b><p class="muted su-11a508">' + esc(c.d) + '</p></div>'; }).join('') + '</div>';
}

var humVidaCat = '';
function humCardAve(e) {
  var badge = '';
  if (e.estado) badge += ' <span class="chip su-6cf74d">' + esc(e.estado) + '</span>';
  if (e.censo) badge += ' <span class="chip su-4261fc">' + esc(e.censo) + '</span>';
  if (e.mine) badge += ' <span class="chip su-8323db">mía</span>';
  var emblema = /EMBLEMA|RHRAP/.test(e.tipo + ' ' + (e.estado || '')) ? ' style="border:2px solid #e8c56a"' : (e.mine ? ' style="border:2px dashed #a9d18e"' : '');
  return '<div class="si-card su-7aab68"' + emblema + '><b class="su-6cb285 su-6cc0e6">' + (e.ico || '🦩') + ' ' + esc(e.nombre) + '</b><br><span class="muted su-4adef8"><i>' + esc(e.cient || '—') + '</i></span><br>' +
    '<span class="chip su-fb2957">' + esc(e.tipo || 'Ave') + '</span>' + badge +
    '<p class="muted su-11a508 su-96ad60">' + esc(e.nota || '') + '</p>' +
    '<div class="su-6157e8"><button type="button" class="btn hum-cargar su-337714" data-n="' + esc(e.nombre) + '">📓 Cargar en bitácora</button>' +
    (e.mine && e.id ? '<button type="button" class="btn hum-spdel su-fd834a" data-id="' + e.id + '" title="Borrar mi especie">✕ Borrar</button>' : '') + '</div></div>';
}
function humCardFF(e) {
  return '<div class="si-card su-cfa1ec" style="border-left:4px solid ' + (e.mine ? '#a9d18e' : '#7fb3d5') + '"><b class="su-6cb285">' + (e.ico || '🌾') + ' ' + esc(e.nombre) + '</b> <span class="muted su-4adef8"><i>' + esc(e.cient || '—') + '</i></span><br>' +
    '<span class="chip">' + esc(e.grupo || e.tipo || 'Vecino') + '</span>' + (e.mine ? ' <span class="chip su-8323db">mía</span>' : '') +
    '<p class="muted su-11a508 su-96ad60">' + esc(e.nota || '') + '</p>' +
    (e.mine && e.id ? '<button type="button" class="btn hum-spdel su-fd834a" data-id="' + e.id + '" title="Borrar mi especie">✕ Borrar</button>' : '') + '</div>';
}

function renderVida() {
  var box = $('humVidaBox');
  if (!box) return;
  var q = ((($('humVidaFilter') || {}).value || '') + '').toLowerCase();
  function inCat(e) {
    if (!humVidaCat) return true;
    if (humVidaCat === 'mig') return /Migratoria|Nidifica|Costera/i.test(e.tipo || '');
    if (humVidaCat === 'res') return /Residente|Especialista|Borde/i.test(e.tipo || '');
    if (humVidaCat === 'rap') return /Depredador/i.test(e.tipo || '');
    return true;
  }
  var avesTodas = allAves();
  var ffTodas = allFF();
  var aves = avesTodas.filter(function (e) {
    return inCat(e) && (!q || (e.nombre + ' ' + e.cient + ' ' + e.tipo + ' ' + (e.estado || '') + ' ' + e.nota).toLowerCase().indexOf(q) >= 0);
  });
  var resto = ffTodas.filter(function (e) {
    if (humVidaCat === 'flo') return /Flora|Alga/i.test(e.grupo || e.tipo || '');
    if (humVidaCat === 'fau') return /Mam|Pez|Anfibio|Reptil|Fauna|Vecino/i.test(e.grupo || e.tipo || '');
    if (humVidaCat === 'mig' || humVidaCat === 'res' || humVidaCat === 'rap') return false;
    return (!q || (e.nombre + ' ' + e.cient + ' ' + (e.grupo || e.tipo || '') + ' ' + e.nota).toLowerCase().indexOf(q) >= 0);
  });
  var nMine = getCustom().length;
  var showFlora = (!humVidaCat || humVidaCat === 'flo' || humVidaCat === 'fau');
  var cats = [['', '✨ Todas'], ['mig', '🦩 Migratorias'], ['res', '🦆 Residentes'], ['rap', '🦅 Rapaces'], ['flo', '🌾 Flora'], ['fau', '🦦 Fauna']];
  box.innerHTML =
    '<div class="menstrual-card su-896c2f"><h4>🦩 Vida confirmada del humedal</h4>' +
    '<p class="muted su-11a508"><b>' + AVES_DESTACADAS.length + ' aves</b> + <b>' + FLORA_FAUNA.length + ' flora/fauna</b> con ficha MMA · GEF · eBird. Censo GEF 16-feb-2023: <b>56 spp. / 2.673 ind.</b> en un día (tagua 1.261 · cuello negro 236 · Franklin 180 · yeco 127).</p>' +
    '<div class="su-38c0a4">' +
    cats.map(function (c) { return '<button type="button" class="btn hum-cat' + (humVidaCat === c[0] ? ' btn-accent' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
    '<div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="humVidaFilter2" placeholder="ej: pilpilén, rayador, sosa, coipo..." maxlength="40" value="' + esc(($('humVidaFilter') || {}).value || '') + '"></label></div></div>' +
    '<h4>🦩 Aves (' + aves.length + ' de ' + avesTodas.length + (nMine ? ' · ⭐ ' + getCustom().filter(function (x) { return x.kind === "ave"; }).length + ' mías' : '') + ')</h4>' +
    '<div class="su-14b4b5">' + aves.map(humCardAve).join('') + (aves.length ? '' : '<p class="muted">Sin coincidencias. Prueba “migratoria”, “residente” o limpia el filtro.</p>') + '</div>' +
    (showFlora ? '<h4>🌾🦦 Flora y fauna (' + resto.length + ' de ' + ffTodas.length + (nMine ? ' · ⭐ ' + getCustom().filter(function (x) { return x.kind !== "ave"; }).length + ' mías' : '') + ')</h4>' +
    '<div class="su-14b4b5">' + resto.map(humCardFF).join('') + (resto.length ? '' : '<p class="muted">Sin coincidencias en flora/fauna.</p>') + '</div>' : '') +
    '<details class="menstrual-card su-e39201"><summary><b>➕ Agregar mi especie</b> <span class="muted">— queda privada en tu celular' + (nMine ? ' · llevas ' + nMine : '') + '</span></summary>' +
    '<div class="conv-row"><label class="su-4b3de7">Nombre * <input type="text" id="humSpName" placeholder="ej: Garza blanca, Junco negro" maxlength="40"></label>' +
    '<label>Clase <select id="humSpKind"><option value="ave-mig">🦩 Ave migratoria</option><option value="ave-res">🦆 Ave residente</option><option value="ave-rap">🦅 Ave rapaz</option><option value="flo">🌾 Flora / alga</option><option value="fau">🦦 Fauna (mamífero, pez, anfibio...)</option></select></label></div>' +
    '<div class="conv-row"><label>Nombre científico <input type="text" id="humSpCient" placeholder="ej: Ardea alba" maxlength="50"></label>' +
    '<label>Icono <input type="text" id="humSpIco" placeholder="🦩" maxlength="4" class="su-460bb7"></label></div>' +
    '<label>Nota (dónde la viste, qué hacía) <input type="text" id="humSpNota" placeholder="ej: 3 en canal norte, comiendo con bajamar" maxlength="120"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="humSpAdd" class="btn btn-accent su-30e741">+ Guardar mi especie</button></div>' +
    '<p class="muted su-ae4019">Se suma al catálogo con borde ⭐ y al filtro/buscador. Tócala con “📓 Cargar” para llevarla a tu bitácora.</p></details>' +
    '<div class="menstrual-card"><p class="muted su-d47a97 su-ae4019">✅ Verificado: MMA ficha 192 (pilpilén, gaviotín, coscoroba, cuello negro, botón de oro, coipo, sosa, Franklin, pantano) · MMA 10-03-2026 (pico recto, rayador, pitotoy, pelícano) · GEF censo feb-2023 + informe límites (pocha, sapitos, llinto, juncos, pelillo) · RHRAP 2023 (Isla Reyes: 1% pilpilén + zarapito, 120 parejas) · eBird Isla Reyes (chorlo semipalmado, pimpollo). Taxonomía eBird/Clements 2022.</p></div>';
  box.querySelectorAll('.hum-cat').forEach(function (b) {
    b.onclick = function () { humVidaCat = b.getAttribute('data-cat'); renderVida(); };
  });
  var f2 = $('humVidaFilter2');
  if (f2 && !f2.dataset.w) { f2.dataset.w = '1'; f2.oninput = function () { var h = $('humVidaFilter'); if (h) h.value = f2.value; renderVida(); var n = $('humVidaFilter2'); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} } }; }
  box.querySelectorAll('.hum-cargar').forEach(function (b) {
    b.onclick = function () {
      var sp = $('humAvSp');
      if (sp) sp.value = b.getAttribute('data-n');
      switchTab('bit');
      try { if (sp) sp.focus(); } catch (e) {}
    };
  });
  box.querySelectorAll('.hum-spdel').forEach(function (b) {
    b.onclick = function (ev) {
      try { if (ev && ev.stopPropagation) ev.stopPropagation(); } catch (e2) {}
      if (!confirm('¿Borrar tu especie? También seguirá en tu bitácora si ya la anotaste.')) return;
      var arr = getCustom();
      var ix = -1;
      for (var i = 0; i < arr.length; i++) { if (arr[i].id === b.getAttribute('data-id')) { ix = i; break; } }
      if (ix >= 0) arr.splice(ix, 1);
      save('Especie borrada');
      renderVida();
    };
  });
  var sadd = $('humSpAdd');
  if (sadd) sadd.onclick = function () {
    var n = clean((($('humSpName') || {}).value || ''), 40).trim();
    if (!n) { alert('Pon el nombre de la especie'); return; }
    var kind = (($('humSpKind') || {}).value || 'ave-res');
    var isAve = kind.indexOf('ave') === 0;
    var todos = allAves().concat(allFF());
    var dup = false;
    for (var i = 0; i < todos.length; i++) { if (String(todos[i].nombre || '').toLowerCase() === n.toLowerCase()) { dup = true; break; } }
    if (dup) { alert('Esa especie ya existe en el catálogo'); return; }
    var tipoAve = kind === 'ave-mig' ? 'Migratoria' : kind === 'ave-rap' ? 'Depredador' : 'Residente';
    var grupoFF = kind === 'flo' ? 'Flora' : 'Fauna';
    var rec = {
      id: uid('hum-sp'),
      kind: isAve ? 'ave' : 'ff',
      nombre: n,
      cient: clean((($('humSpCient') || {}).value || ''), 50),
      ico: clean((($('humSpIco') || {}).value || ''), 4) || (isAve ? '🦩' : (kind === 'flo' ? '🌾' : '🦦')),
      tipo: isAve ? tipoAve + ' · mía' : undefined,
      grupo: !isAve ? grupoFF + ' · mía' : undefined,
      nota: clean((($('humSpNota') || {}).value || ''), 120) || 'Agregada por mí en terreno.'
    };
    getCustom().push(rec);
    save('Especie guardada ⭐');
    renderVida();
  };
}

function renderVisita() {
  var box = $('humVisBox');
  if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card"><h4>📍 Cómo llegar sin dañar</h4>' +
    ACCESOS.map(function (a) { return '<div class="si-card su-7aab68"><b>' + esc(a.n) + '</b><p class="muted su-11a508">' + esc(a.d) + '</p></div>'; }).join('') +
    '<p class="muted su-83cb86">🎒 Lleva: binoculares, ropa apagada, agua, gorro, bolsa para basura ajena, celular con eBird/Merlin (offline). Deja: dron bajo, parlante, pelota, pala.</p></div>' +
    '<div class="menstrual-card"><h4>🤲 Ética del borde (7 reglas)</h4><div class="su-28e216">' +
    ETICA.map(function (t) { return '<span class="chip su-656fb9">• ' + esc(t) + '</span>'; }).join('') + '</div></div>' +
    '<div class="menstrual-card"><h4>🔗 Camina con el calendario</h4><div class="su-6157e8">' +
    '<button type="button" class="btn hum-go su-337714" data-go="btnBirds">🦅 Aves</button>' +
    '<button type="button" class="btn hum-go su-337714" data-go="btnTides">🌊 Mareas</button>' +
    '<button type="button" class="btn hum-go su-337714" data-go="btnAnfibios">🐸 Anfibios</button>' +
    '<button type="button" class="btn hum-go su-337714" data-go="btnFenologia">🌼 Fenología</button>' +
    '<button type="button" class="btn hum-go su-337714" data-go="btnMinga">🤲 Minga</button>' +
    '</div></div>';
  box.querySelectorAll('.hum-go').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-go');
      try { $('humedalDialog').close(); } catch (e) {}
      setTimeout(function () { try { var tgt = $(id); if (tgt) tgt.click(); } catch (e2) {} }, 150);
    };
  });
}

function renderDefensa() {
  var box = $('humDefBox');
  if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card"><h4>📜 Historia de defensa (verifica vigencia)</h4>' +
    HISTORIA.map(function (h) { return '<div class="si-card su-cfa1ec"><b class="su-6750b2">' + esc(h.t) + '</b> <span class="muted">· ' + esc(h.cuando) + '</span><p class="muted su-11a508">' + esc(h.d) + '</p></div>'; }).join('') +
    '<p class="muted su-d47a97">⚖️ Hay ~8 reclamaciones ante el Tribunal Ambiental (GORE/gremios vs declaratoria). Busca “Rocuant-Andalién Tribunal Ambiental” antes de citar estado. Tus fotos con fecha y punto pueden servir de antecedente.</p></div>' +
    '<div class="menstrual-card su-d2c171"><h4>⚠️ Amenazas (míralas, repórtalas)</h4>' +
    AMENAZAS.map(function (a) { return '<div class="si-card su-7aab68"><b>• ' + esc(a.t) + '</b><p class="muted su-11a508">' + esc(a.d) + '</p></div>'; }).join('') + '</div>' +
    '<div class="menstrual-card"><h4>🛡️ Quiénes cuidan + dónde denunciar</h4>' +
    '<p class="muted su-11a508">• <b>ONG Defensa Ambiental / Red Humedales Biobío</b> — monitoreo y denuncia de rellenos (ver 🛡️ Actores).<br>• <b>Fundación Bandada</b> — defensa legal del humedal urbano.<br>• <b>GEF Humedales Costeros + Comité Técnico Local</b> — educación y salidas.<br>• <b>Fundación Cosmos + municipios</b> — parques de humedal.</p>' +
    '<p class="su-49f9d7">📢 Denuncia: SMA (sma.gob.cl) con foto + fecha + georreferencia · SAG ante fauna herida · Sernapesca 800 320 032 (fauna marina) · CITUC +56 2 2635 3800 (intoxicación) · 133/132 emergencias.</p>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="humGoActores" class="btn btn-accent su-30e741">🛡️ Ir a Actores del territorio</button></div></div>';
  var g = $('humGoActores');
  if (g && !g.dataset.w) { g.dataset.w = '1'; g.onclick = function () { try { $('humedalDialog').close(); } catch (e) {} setTimeout(function () { try { $('btnActores').click(); } catch (e2) {} }, 150); }; }
}

/* ---------- bitácora ---------- */
var bitSub = 'avist';
function switchBitSub(s) {
  bitSub = s;
  [['avist', 'humAvPanel', 'tabHumAv'], ['rep', 'humRepPanel', 'tabHumRep'], ['min', 'humMinPanel', 'tabHumMin']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== s);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === s);
  });
  renderBit();
}

function buildShareText() {
  var d = getData();
  var t = '🌾 Humedal Rocuant-Andalién — mi bitácora · Penco\n\n';
  t += '🦩 Avistamientos (' + d.avist.length + ')\n';
  d.avist.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).forEach(function (r) {
    t += '• ' + r.fecha + (r.hora ? ' ' + r.hora : '') + ' · ' + (r.especie || '—') + (r.cantidad ? ' ×' + r.cantidad : '') + ' · ' + (r.lugar || '') + (r.marea ? ' · ' + r.marea : '') + (r.notas ? ' — ' + r.notas : '') + '\n';
  });
  t += '\n⚠️ Reportes (' + d.reportes.length + ')\n';
  d.reportes.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).forEach(function (r) {
    t += '• ' + r.fecha + ' · ' + (r.tipo || '') + ' · ' + (r.lugar || '') + (r.notas ? ' — ' + r.notas : '') + '\n';
  });
  t += '\n🤲 Mingas (' + d.mingas.length + ')\n';
  d.mingas.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).forEach(function (r) {
    t += '• ' + r.fecha + ' · ' + (r.tipo || '') + ' · ' + (r.lugar || '') + (r.notas ? ' — ' + r.notas : '') + '\n';
  });
  return t + '\n— Guardián del humedal · Mari Küla Küyen';
}

function renderBit() {
  var d = getData();
  // avistamientos
  var ab = $('humAvBox');
  if (ab) {
    var st = $('humAvStats');
    if (st) {
      var spp = {};
      d.avist.forEach(function (r) { if (r.especie) spp[r.especie] = true; });
      st.textContent = d.avist.length ? (d.avist.length + ' avistamientos · ' + Object.keys(spp).length + ' especie(s)') : 'Sin avistamientos aún';
    }
    if (!d.avist.length) ab.innerHTML = '<p class="muted su-11a508">Sin avistamientos. Sube al borde en pleamar, mira sin entrar y anota: fecha, especie, cantidad y marea.</p>';
    else {
      var sorted = d.avist.slice().sort(function (a, b) { return String(b.fecha + (b.hora || '')).localeCompare(String(a.fecha + (a.hora || ''))); });
      ab.innerHTML = sorted.slice(0, 60).map(function (r) {
        return '<div class="habit-item su-78abdc"><span class="su-fbb1e4">' +
          '🦩 <b>' + esc(r.especie || '—') + '</b>' + (r.cantidad ? ' ×' + esc(r.cantidad) : '') + ' · ' + esc(r.fecha || '') + (r.hora ? ' ' + esc(r.hora) : '') +
          '<br><span class="muted su-4adef8">' + esc(r.lugar || '') + (r.marea ? ' · 🌊 ' + esc(r.marea) : '') + (lunaTxtFor(r.fecha) ? ' · ' + esc(lunaTxtFor(r.fecha)) : '') + '</span>' +
          (r.notas ? '<br><span class="su-11a508">' + esc(r.notas) + '</span>' : '') + '</span>' +
          '<span class="su-3a76ac"><button type="button" class="btn hum-avdel su-fd834a" data-id="' + r.id + '" title="Borrar">✕</button></span></div>';
      }).join('');
      ab.querySelectorAll('.hum-avdel').forEach(function (b) {
        b.onclick = function () {
          if (!confirm('¿Borrar este avistamiento?')) return;
          var dd = getData();
          dd.avist = dd.avist.filter(function (x) { return x.id !== b.getAttribute('data-id'); });
          save(); renderBit(); renderHoy();
        };
      });
    }
  }
  // reportes
  var rb = $('humRepBox');
  if (rb) {
    var st2 = $('humRepStats');
    if (st2) st2.textContent = d.reportes.length ? (d.reportes.length + ' reportes ciudadanos') : 'Sin reportes';
    if (!d.reportes.length) rb.innerHTML = '<p class="muted su-11a508">Sin reportes. ¿Viste relleno, espuma rara o perro suelto? Anota con lugar + foto (la foto queda en tu galería, aquí el dato).</p>';
    else {
      var s2 = d.reportes.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
      rb.innerHTML = s2.slice(0, 60).map(function (r) {
        return '<div class="habit-item su-78abdc"><span class="su-fbb1e4">' +
          '⚠️ <b>' + esc(r.tipo || '') + '</b> · ' + esc(r.fecha || '') +
          '<br><span class="muted su-4adef8">' + esc(r.lugar || '') + (lunaTxtFor(r.fecha) ? ' · ' + esc(lunaTxtFor(r.fecha)) : '') + '</span>' +
          (r.notas ? '<br><span class="su-11a508">' + esc(r.notas) + '</span>' : '') +
          '<br><span class="muted">📢 Denuncia en sma.gob.cl con foto+fecha+punto.</span></span>' +
          '<span class="su-3a76ac"><button type="button" class="btn hum-repdel su-fd834a" data-id="' + r.id + '" title="Borrar">✕</button></span></div>';
      }).join('');
      rb.querySelectorAll('.hum-repdel').forEach(function (b) {
        b.onclick = function () {
          if (!confirm('¿Borrar este reporte?')) return;
          var dd = getData();
          dd.reportes = dd.reportes.filter(function (x) { return x.id !== b.getAttribute('data-id'); });
          save(); renderBit(); renderHoy();
        };
      });
    }
  }
  // mingas
  var mb = $('humMinBox');
  if (mb) {
    var st3 = $('humMinStats');
    if (st3) st3.textContent = d.mingas.length ? (d.mingas.length + ' mingas / salidas') : 'Sin mingas aún';
    if (!d.mingas.length) mb.innerHTML = '<p class="muted su-11a508">Sin mingas. Súmate a una limpieza o monitoreo: fecha, tipo y con quién fuiste ya es memoria.</p>';
    else {
      var s3 = d.mingas.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
      mb.innerHTML = s3.slice(0, 60).map(function (r) {
        return '<div class="habit-item su-78abdc"><span class="su-fbb1e4">' +
          '🤲 <b>' + esc(r.tipo || '') + '</b> · ' + esc(r.fecha || '') +
          '<br><span class="muted su-4adef8">' + esc(r.lugar || '') + '</span>' +
          (r.notas ? '<br><span class="su-11a508">' + esc(r.notas) + '</span>' : '') + '</span>' +
          '<span class="su-3a76ac"><button type="button" class="btn hum-mindel su-fd834a" data-id="' + r.id + '" title="Borrar">✕</button></span></div>';
      }).join('');
      mb.querySelectorAll('.hum-mindel').forEach(function (b) {
        b.onclick = function () {
          if (!confirm('¿Borrar esta minga?')) return;
          var dd = getData();
          dd.mingas = dd.mingas.filter(function (x) { return x.id !== b.getAttribute('data-id'); });
          save(); renderBit(); renderHoy();
        };
      });
    }
  }
}

/* ---------- botón + diálogo + cableado ---------- */
function ensureButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g || $('btnHumedal')) return;
  var b = document.createElement('button');
  b.id = 'btnHumedal';
  b.className = 'btn';
  b.type = 'button';
  b.setAttribute('data-sub', 'mar');
  b.setAttribute('data-keywords', 'humedal rocuant andalien vasco paicavi tucapel desembocadura marisma totora zarapito pilpilen cisne coipo humedal urbano iba birdlife gef relleno denuncia minga avistamiento pleamar');
  b.textContent = '🌾 Humedal Rocuant';
  var ref = $('btnTides') || $('btnFishing');
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
    else g.appendChild(b);
  } else g.appendChild(b);
}

function ensureCheckbox() {
  if (document.querySelector('[data-btn="btnHumedal"]')) return;
  var ref = document.querySelector('[data-btn="btnTides"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnHumedal"> 🌾 Humedal Rocuant';
    var wrap = ref.closest('label');
    if (wrap && wrap.parentNode) wrap.parentNode.insertBefore(lab, wrap.nextSibling);
  }
}

function ensureDialog() {
  if ($('humedalDialog')) return $('humedalDialog');
  var d = document.createElement('dialog');
  d.id = 'humedalDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🌾 Humedal Rocuant-Andalién</h3>' +
    '<button type="button" id="humCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">El humedal más grande del Gran Concepción 🌾: marisma, totora y hotel migratorio. Míralo desde el borde, anota y defiende. Tus registros quedan <b>privados y locales</b>.</p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabHumHoy" class="btn btn-accent su-30e741">🌾 Hoy</button>' +
    '<button type="button" id="tabHumCon" class="btn su-30e741">📖 Conocer</button>' +
    '<button type="button" id="tabHumVida" class="btn su-30e741">🦩 Vida</button>' +
    '<button type="button" id="tabHumVis" class="btn su-30e741">📍 Visita</button>' +
    '<button type="button" id="tabHumDef" class="btn su-30e741">🛡️ Defensa</button>' +
    '<button type="button" id="tabHumBit" class="btn su-30e741">📓 Bitácora</button></div>' +
    '<div id="humHoyPanel"><div id="humHoyBox"></div><input type="hidden" id="humVidaFilter" value=""></div>' +
    '<div id="humConPanel" class="hidden"><div id="humConBox" class="su-be2653"></div></div>' +
    '<div id="humVidaPanel" class="hidden"><div id="humVidaBox" class="su-be2653"></div></div>' +
    '<div id="humVisPanel" class="hidden"><div id="humVisBox" class="su-be2653"></div></div>' +
    '<div id="humDefPanel" class="hidden"><div id="humDefBox" class="su-be2653"></div></div>' +
    '<div id="humBitPanel" class="hidden">' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabHumAv" class="btn btn-accent su-30e741">🦩 Avistar</button>' +
    '<button type="button" id="tabHumRep" class="btn su-30e741">⚠️ Reportar</button>' +
    '<button type="button" id="tabHumMin" class="btn su-30e741">🤲 Mingas</button></div>' +
    '<div id="humAvPanel"><div class="menstrual-card"><h4>🦩 Nuevo avistamiento</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="humAvDate"></label>' +
    '<label>Hora <input type="time" id="humAvTime" value="08:00"></label>' +
    '<label>Lugar <select id="humAvPlace"></select></label></div>' +
    '<div class="conv-row"><label class="su-4b3de7">Especie <input type="text" id="humAvSp" placeholder="ej: Zarapito, Pilpilén" maxlength="40"></label>' +
    '<label>Cantidad <input type="number" id="humAvQty" min="1" value="1" class="su-8573ba"></label>' +
    '<label>Marea <input type="text" id="humAvTide" placeholder="ej: pleamar 08:20" maxlength="30"></label></div>' +
    '<label>Notas <input type="text" id="humAvNotes" placeholder="ej: 12 en borde, con cría, foto en galería" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="humAvAdd" class="btn btn-accent su-30e741">+ Guardar avistamiento</button></div>' +
    '<div id="humAvBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="humAvStats" class="muted su-11a508"></span></div></div></div>' +
    '<div id="humRepPanel" class="hidden"><div class="menstrual-card"><h4>⚠️ Nuevo reporte ciudadano</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="humRepDate"></label>' +
    '<label>Lugar <select id="humRepPlace"></select></label>' +
    '<label class="su-4b3de7">Tipo <select id="humRepType"></select></label></div>' +
    '<label>Detalle (punto, patente, hora, foto en galería) <input type="text" id="humRepNotes" placeholder="ej: camión botando escombro, camino borde norte 11:20" maxlength="100"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="humRepAdd" class="btn btn-accent su-30e741">+ Guardar reporte</button></div>' +
    '<p class="muted su-11a508">📢 Con este dato denuncia en sma.gob.cl (foto + fecha + punto). No te expongas: observa de lejos.</p>' +
    '<div id="humRepBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="humRepStats" class="muted su-11a508"></span></div></div></div>' +
    '<div id="humMinPanel" class="hidden"><div class="menstrual-card"><h4>🤲 Nueva minga / salida</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="humMinDate"></label>' +
    '<label>Lugar <select id="humMinPlace"></select></label>' +
    '<label class="su-4b3de7">Tipo <select id="humMinType"></select></label></div>' +
    '<label>Notas <input type="text" id="humMinNotes" placeholder="ej: limpieza borde con junta de vecinos, 8 bolsas" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="humMinAdd" class="btn btn-accent su-30e741">+ Guardar minga</button></div>' +
    '<div id="humMinBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="humMinStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="humShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="humExport" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="humClear" class="btn su-214f75">🗑 Borrar todo</button></span></div></div></div>' +
    '</div>' +
    '<div class="dlg-actions"><button type="button" id="humClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  function fill(sel, arr) {
    var s = d.querySelector(sel);
    if (!s) return;
    arr.forEach(function (l) { var o = document.createElement('option'); o.value = l; o.textContent = l; s.appendChild(o); });
  }
  fill('#humAvPlace', LUGARES_BIT);
  fill('#humRepPlace', LUGARES_BIT);
  fill('#humMinPlace', LUGARES_BIT);
  fill('#humRepType', TIPOS_REPORTE);
  fill('#humMinType', TIPOS_MINGA);
  return d;
}

function wire() {
  ensureButton();
  ensureDialog();
  ensureCheckbox();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnHumedal') < 0) ALL_BTNS.push('btnHumedal');
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnHumedal') < 0) {
      var i = ORDEN_TERRITORIO.indexOf('btnTides');
      if (i >= 0) ORDEN_TERRITORIO.splice(i + 1, 0, 'btnHumedal');
      else ORDEN_TERRITORIO.push('btnHumedal');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnTides && p.btnHumedal === undefined) p.btnHumedal = true;
      });
    }
  } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  var btn = $('btnHumedal');
  if (btn && !btn.dataset.humW) {
    btn.dataset.humW = '1';
    btn.onclick = function () {
      try { renderHoy(); } catch (e1) {}
      try { renderConocer(); } catch (e2) {}
      try { renderVida(); } catch (e3) {}
      try { renderVisita(); } catch (e4) {}
      try { renderDefensa(); } catch (e5) {}
      try { switchTab(tab || 'hoy'); } catch (e6) {}
      try { switchBitSub(bitSub || 'avist'); } catch (e7) {}
      if ($('humAvDate') && !$('humAvDate').value) $('humAvDate').value = todayKey();
      if ($('humRepDate') && !$('humRepDate').value) $('humRepDate').value = todayKey();
      if ($('humMinDate') && !$('humMinDate').value) $('humMinDate').value = todayKey();
      var dlg = $('humedalDialog');
      if (dlg && dlg.showModal) { try { dlg.showModal(); } catch (e8) { try { dlg.show(); } catch (e9) {} } }
    };
  }
  var tabs = [['tabHumHoy', 'hoy'], ['tabHumCon', 'con'], ['tabHumVida', 'vida'], ['tabHumVis', 'vis'], ['tabHumDef', 'def'], ['tabHumBit', 'bit']];
  tabs.forEach(function (t) {
    var b = $(t[0]);
    if (b && !b.dataset.w) { b.dataset.w = '1'; b.onclick = function () { switchTab(t[1]); }; }
  });
  var subs = [['tabHumAv', 'avist'], ['tabHumRep', 'rep'], ['tabHumMin', 'min']];
  subs.forEach(function (t) {
    var b = $(t[0]);
    if (b && !b.dataset.w) { b.dataset.w = '1'; b.onclick = function () { switchBitSub(t[1]); }; }
  });
  var ct = $('humCloseTop'), cb = $('humClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { try { $('humedalDialog').close(); } catch (e) {} }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { try { $('humedalDialog').close(); } catch (e) {} }; }
  var avAdd = $('humAvAdd');
  if (avAdd && !avAdd.dataset.w) {
    avAdd.dataset.w = '1';
    avAdd.onclick = function () {
      var esp = clean((($('humAvSp') || {}).value || ''), 40).trim();
      if (!esp) { alert('Pon la especie primero (o cárgala desde 🦩 Vida)'); return; }
      getData().avist.push({
        id: uid('hum-av'),
        fecha: ($('humAvDate') && $('humAvDate').value) || todayKey(),
        hora: ($('humAvTime') && $('humAvTime').value) || '',
        lugar: (($('humAvPlace') || {}).value || ''),
        especie: esp,
        cantidad: clean((($('humAvQty') || {}).value || '1'), 6),
        marea: clean((($('humAvTide') || {}).value || ''), 30),
        notas: clean((($('humAvNotes') || {}).value || ''), 80)
      });
      if ($('humAvNotes')) $('humAvNotes').value = '';
      save('Avistamiento guardado 🦩');
      renderBit(); renderHoy();
    };
  }
  var repAdd = $('humRepAdd');
  if (repAdd && !repAdd.dataset.w) {
    repAdd.dataset.w = '1';
    repAdd.onclick = function () {
      getData().reportes.push({
        id: uid('hum-rep'),
        fecha: ($('humRepDate') && $('humRepDate').value) || todayKey(),
        lugar: (($('humRepPlace') || {}).value || ''),
        tipo: (($('humRepType') || {}).value || 'Otro'),
        notas: clean((($('humRepNotes') || {}).value || ''), 100)
      });
      if ($('humRepNotes')) $('humRepNotes').value = '';
      save('Reporte guardado ⚠️ (denuncia en sma.gob.cl)');
      renderBit(); renderHoy();
    };
  }
  var minAdd = $('humMinAdd');
  if (minAdd && !minAdd.dataset.w) {
    minAdd.dataset.w = '1';
    minAdd.onclick = function () {
      getData().mingas.push({
        id: uid('hum-min'),
        fecha: ($('humMinDate') && $('humMinDate').value) || todayKey(),
        lugar: (($('humMinPlace') || {}).value || ''),
        tipo: (($('humMinType') || {}).value || 'Otro'),
        notas: clean((($('humMinNotes') || {}).value || ''), 80)
      });
      if ($('humMinNotes')) $('humMinNotes').value = '';
      save('Minga guardada 🤲');
      renderBit(); renderHoy();
    };
  }
  var tideInp = $('humAvTide');
  if (tideInp && !tideInp.dataset.w) {
    tideInp.dataset.w = '1';
    tideInp.addEventListener('focus', function () {
      if (tideInp.value) return;
      try {
        var k = (($('humAvDate') || {}).value || todayKey()).slice(5);
        var t = getTidesForKey(k);
        if (t && t.tides && t.tides.length) tideInp.placeholder = t.tides.map(function (x) { return x.h + ' ' + x.t; }).join(', ');
      } catch (e) {}
    });
  }
  var sh = $('humShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var dd = getData();
      if (!dd.avist.length && !dd.reportes.length && !dd.mingas.length) { alert('Sin registros aún'); return; }
      share('🌾 Mi humedal Rocuant-Andalién', buildShareText());
    };
  }
  var ex = $('humExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var dd = getData();
      if (!dd.avist.length && !dd.reportes.length && !dd.mingas.length) { alert('Sin registros aún'); return; }
      var blob = new Blob([buildShareText()], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'humedal-rocuant-andalien.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var cl = $('humClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar TODA tu bitácora del humedal (avistamientos + reportes + mingas)?')) return;
      var dd = getData();
      dd.avist = []; dd.reportes = []; dd.mingas = [];
      save(); renderBit(); renderHoy();
    };
  }
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

window.HumedalRocuant = {
  tab: switchTab, renderHoy: renderHoy, renderConocer: renderConocer,
  renderVida: renderVida, renderVisita: renderVisita, renderDefensa: renderDefensa,
  renderBit: renderBit, list: getData, aves: AVES_DESTACADAS, ficha: FICHA
};

var _humRetry = 0;
function setupHum() {
  if (!document.querySelector('.action-group[data-group="territorio"] .group-btns') || typeof userData !== 'function') {
    _humRetry++;
    if (_humRetry < 80) setTimeout(setupHum, 500);
    return;
  }
  try { wire(); } catch (e) {}
  try { renderHoy(); } catch (e2) {}
  try { renderConocer(); } catch (e3) {}
}

document.addEventListener('territorio:listo', function () {
  try { renderConocer(); } catch (e) {}
});
setTimeout(setupHum, 700);

})();
