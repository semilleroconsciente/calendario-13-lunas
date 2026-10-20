/* ============================================================
   HISTORIA DEL BOSQUE NATIVO — Calendario 13 Lunas (Penco)
   Apartado: Territorio > Bosque Nativo (btnBosque -> bosqueDialog),
   pestana "Historia del bosque": las especies a lo largo del tiempo,
   desde los linajes gondwanicos hasta la restauracion actual.
   Contenido estatico y local (sin guardado): se edita aqui mismo,
   en HISTORIA_BOSQUE. Las especies del catálogo (data.js) se pueden
   tocar para cargarlas en el formulario de la bitácora.
   Conecta con Guía de Penco (Antes de 1550) y Siembra lunar.
   ============================================================ */
(function () {
'use strict';

/* Datos dinamicos por territorio: data/territorios/<id>/historia/*.json (ver territorio.js) */
function dynHistBosque() { try { var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.historiaBosque; if (d) return d; } catch (e) {} return HISTORIA_BOSQUE; }
function dynAcompan() { try { var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.companerosBosque; if (d) return d; } catch (e) {} return ACOMPANANTES; }

var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* cat: true = existe en el catálogo BOSQUE_NATIVO_PENCO (tocable)
   Estructura espejo de HISTORIA_PENCO (penco-guia.js):
   intro + eras[{t, cuando, d}] + sp/hoy temáticos + fuentes.
   Mismo render: tarjeta por periodo, fecha muted, descripción,
   chips tocables y nota 🔎. */
var HISTORIA_BOSQUE = {
  intro: 'El bosque de Penco —<b>esclerófilo en laderas y laurifolio en quebradas</b>— es un <b>relicto de millones de años</b> en la Cordillera de la Costa. Del <b>basamento gondwánico</b> al <b>relicto que hoy restauramos</b>, en <b>10 periodos</b>, con las especies que estuvieron (y están) presentes. La historia completa vive aquí.',
  eras: [
    {
      t: '🪨 Tiempo profundo: basamento de Gondwana', cuando: 'Paleozoico (~300 Ma) · Series metamórficas + Granitoides de Concepción',
      d: 'Antes de ser bosque, Penco era <b>fondo y borde de Gondwana</b>. Bajo tus pies está el <b>zócalo paleozoico</b>: filitas, esquistos y metarenitas intruidas por los <b>Granitoides de Concepción</b>. Ese basamento forma los <b>cerros de la Cordillera de la Costa</b> (Cerro Verde, Bellavista) y es el piso donde, millones de años después, echará raíz el bosque. Aquí nacen los <b>linajes gondwánicos</b> que aún te rodean.',
      sp: [
        { n: 'Keule', cat: true }, { n: 'Avellano', cat: true }, { n: 'Lingue', cat: true },
        { n: 'Roble / Hualo (Nothofagus)', cat: false }, { n: 'Olivillo', cat: false }
      ],
      hoy: 'Mira el suelo: donde hay <b>granito y quebrada húmeda</b>, el bosque antiguo resiste mejor.'
    },
    {
      t: '🦕 Mar de Quiriquina: aún sin bosque', cuando: 'Cretácico Superior · Maastrichtiano (72–66 Ma)',
      d: 'Hace 70 millones de años <b>todo esto era mar</b> (Formación Quiriquina: La Cata, Punta de Parra). No había bosque penqueño todavía, pero sí <b>maderas flotantes con perforaciones de Teredolites</b>: los árboles del continente ya llegaban al mar. Nadaban <b>plesiosaurios y mosasaurios</b> donde hoy caminas entre boldos. El bosque estaba tierra adentro, esperando que el mar se retirara.',
      sp: [
        { n: 'Madera fósil (Teredolites)', cat: false }
      ],
      hoy: 'En <b>La Cata</b> aún aflora ese mar: arenisca con <b>amonites y madera fósil</b>.'
    },
    {
      t: '🌿 Selvas del carbón: Cosmito', cuando: 'Paleoceno–Eoceno (~60–40 Ma) · Formaciones Cosmito / Curanilahue / Cerro Alto',
      d: 'El mar se retira y la costa se vuelve <b>delta pantanoso de selvas</b>. La <b>Formación Cosmito —descrita en tu sector Cosmito—</b> guarda <b>areniscas, lutitas y mantos de carbón</b> con <b>paleoflora mixta</b> (afinidades antárticas y tropicales). Esos pantanos son el <b>antecedente profundo del carbón de Lirquén y Cerro Verde</b> que, 50 millones después, pedirá leña al bosque para entibar minas.',
      sp: [
        { n: 'Peumo', cat: true }, { n: 'Boldo', cat: true }, { n: 'Lingue', cat: true },
        { n: 'Roble / Hualo (Nothofagus)', cat: false }
      ],
      hoy: 'El carbón que quemó Penco nació de un bosque pantanoso como este.'
    },
    {
      t: '❄️ Hielos, refugio y terrazas', cuando: 'Pleistoceno – Holoceno Medio (~2 Ma – 6.000 a.p.)',
      d: 'Vienen los hielos, pero la <b>Cordillera de la Costa no se glacia</b>: con lluvias del Pacífico se vuelve <b>refugio glacial</b> (genética en <b>Nothofagus y Proteaceae, Premoli et al. 2019</b>; polen de Villagrán). Sobreviven <b>keule, olivillo, lingue, avellano y robles</b>. Su fruto —<b>drupa amarilla de 3,5–5 cm y 20–40 g, con cuesco leñoso durísimo</b>— es un <b>fruto megafaunal anacrónico Tipo 1</b> (Muñoz-Concha et al. 2020, <i>Plants</i>): evolucionó para ser tragado entero y dispersado a kilómetros por la <b>megafauna del Pleistoceno — gonfoterios (<i>Notiomastodon/Stegomastodon platensis</i>), caballos nativos (<i>Equidae</i>) y perezosos terrestres gigantes (<i>Mylodontidae</i>)</b> y cérvidos grandes. Extintos hace ~11–12 mil años, hoy el fruto cae y se pudre al pie del árbol. Se forman las <b>terrazas de 5 m y 2 m</b>, limos del Andalién y dunas: el piso donde el bosque y el hombre se encontrarán. El MMA describe aquí el ecosistema <b>“Bosque caducifolio costero de Nothofagus obliqua – Gomortega keule”</b>.',
      sp: [
        { n: 'Keule', cat: true }, { n: 'Canelo', cat: true }, { n: 'Avellano', cat: true },
        { n: 'Lingue', cat: true }, { n: 'Arrayán', cat: true }, { n: 'Peumo', cat: true },
        { n: 'Roble / Hualo (Nothofagus)', cat: false }, { n: 'Olivillo', cat: false }
      ],
      hoy: 'El <b>keule</b> es único en su género y familia (endémico Maule–Biobío). Sin sus dispersores originales sufre <b>anacronismo de dispersión</b>: el <b>pudú (<i>Pudu puda</i>, 8–10 kg) solo mordisquea la pulpa sin tragar el cuesco</b>, roedores nativos no lo mueven a distancia y la <b>rata negra (<i>Rattus rattus</i>)</b> lo depreda (Barceló & Simonetti 2020). Eso explica su <b>alta diferenciación genética entre poblaciones a pocos km</b> y su persistencia por <b>rebrote vegetativo de raíz</b> (Lander et al. 2019). El sitio <b>“Queule del Estero Bellavista”</b> recuerda que estos linajes viven —o vivieron— en Penco.'
    },
    {
      t: '🛶 Primeros navegantes: leña del conchal', cuando: 'Arcaico Medio–Tardío (7.000–2.000 a.p.) · Bellavista 1, Playa Negra 9',
      d: 'Los cazadores-pescadores del <b>Complejo Talcahuano</b> (Bellavista 1, Playa Negra 9) ya usan el bosque: <b>leña para fogones, mangos de chuzo mariscador, morteros y wampo</b> en sus 2,5 m de conchal. Pesca de <b>jurel, sierra y róbalo</b> con red y anzuelo. Uso intenso pero local: el bosque sigue continuo del cerro al mar, con <b>boldo y arrayán extensos</b>.',
      sp: [
        { n: 'Peumo', cat: true }, { n: 'Boldo', cat: true }, { n: 'Arrayán', cat: true },
        { n: 'Maitén', cat: true }, { n: 'Quillay', cat: true }
      ],
      hoy: 'En la terraza de 5 m (Playa Negra–Bellavista) pisas fogones de 4.000 años bajo boldos actuales.'
    },
    {
      t: '🏺 Antes de 1550: el bosque lafkenche', cuando: '130 d.C. – 1550 · Pitrén (300–500) / El Vergel (1.000–1.550)',
      d: 'Las comunidades <b>lafkenche</b> habitan este bosque sin talarlo a gran escala: alimento, medicina, madera y ritual. El <b>canelo (foye)</b> es árbol sagrado; <b>trihue/laurel y lingue</b> dan madera noble; <b>avellano (ngefu), maqui, peumo y boldo</b> dan fruto y remedio; con troncos ahuecados se hacen <b>wampo</b> (canoas). Horticultura de <b>quinoa, papa y maíz</b> en claros. Ver 📖 Guía de Penco → Historia y 🗣️ Voz de los Abuelos.',
      sp: [
        { n: 'Canelo', cat: true }, { n: 'Trihue / Laurel', cat: true }, { n: 'Lingue', cat: true },
        { n: 'Avellano', cat: true }, { n: 'Maqui', cat: true }, { n: 'Peumo', cat: true },
        { n: 'Boldo', cat: true }, { n: 'Arrayán', cat: true }, { n: 'Copihue', cat: true }, { n: 'Quillay', cat: true }
      ],
      hoy: 'Casi todas estas especies siguen en quebradas y cerros: son el corazón del catálogo actual.'
    },
    {
      t: '⛪ Colonia: fuerte, iglesia y leña', cuando: '1550–1751 · Concepción en Penco + traslado de 1751',
      d: 'La fundación de <b>Concepción en Penco (1550)</b>, sus refundaciones y terremotos (<b>1570, 1657, 1687, 1730</b>) piden <b>vigas, tejas, leña y carbón vegetal</b> una y otra vez. El <b>Fuerte La Planchada (1687)</b> se levanta con madera local. El bosque de faldeo se abre, pero las <b>quebradas laurifolias</b> (canelo, lingue, trihue) resisten por húmedas y empinadas. Tras el <b>terremoto-maremoto de 1751</b> y la prohibición de habitar, el bosque recupera parte de lo perdido.',
      sp: [
        { n: 'Lingue', cat: true }, { n: 'Trihue / Laurel', cat: true }, { n: 'Arrayán', cat: true },
        { n: 'Roble / Hualo (Nothofagus)', cat: false }, { n: 'Canelo', cat: true }
      ],
      hoy: 'Cada terremoto colonial fue también una tala: reconstruir quemaba bosque.'
    },
    {
      t: '⛏️ Siglo XIX: carbón, cobre y rieles', cuando: '1843–1900 · Minas Lirquén–Cerro Verde + ferrocarril 1889/1914',
      d: 'La <b>fundición de cobre de Lirquén</b> y las <b>minas de carbón (1843–1958)</b> demandan enormes volúmenes de <b>leña, carbón vegetal y entibado</b> (hornos, piques, construcción). <b>Lingue, roble, laurel y arrayán</b> —maderas nobles— son los más cortados; los faldeos se abren a praderas y cultivos. El <b>ferrocarril a Penco (1889)</b> y a <b>Lirquén (1914)</b> acelera la salida de madera. Nace además la <b>Refinería de Azúcar (1886, luego CRAV)</b> y la <b>Loza (1898)</b>.',
      sp: [
        { n: 'Lingue', cat: true }, { n: 'Trihue / Laurel', cat: true }, { n: 'Arrayán', cat: true },
        { n: 'Roble / Hualo (Nothofagus)', cat: false }, { n: 'Peumo', cat: true },
        { n: 'Boldo', cat: true }, { n: 'Maitén', cat: true }
      ],
      hoy: 'El <b>lingue</b> quedó <b>vulnerable</b>: hoy solo se observa y protege, no se corta.'
    },
    {
      t: '🌲 Siglo XX: pinos, eucaliptos y fragmentos', cuando: '1900–2000 · CRAV, Fanaloza, Vipla + Ley 20.283 (2008)',
      d: 'Las <b>plantaciones de pino radiata y eucalipto</b> cubren la Cordillera de la Costa, <b>fragmentando y reemplazando</b> al nativo (MMA). El auge fabril (<b>CRAV, Fanaloza, COSAF, Vidrios Lirquén</b>) mantiene la presión por madera y suelo. El nativo resiste en <b>quebradas húmedas</b> (canelo, lingue, trihue, arrayán, copihue) y <b>laderas</b> (boldo, peumo, quillay, maitén). En 2008 la <b>Ley de Bosque Nativo (20.283)</b> da por primera vez un marco legal para su manejo y protección.',
      sp: [
        { n: 'Canelo', cat: true }, { n: 'Lingue', cat: true }, { n: 'Trihue / Laurel', cat: true },
        { n: 'Arrayán', cat: true }, { n: 'Copihue', cat: true }, { n: 'Boldo', cat: true },
        { n: 'Peumo', cat: true }, { n: 'Quillay', cat: true }, { n: 'Maitén', cat: true },
        { n: 'Naranjillo', cat: true }, { n: 'Pino / Eucalipto (introducidos)', cat: false }
      ],
      hoy: 'Si ves <b>zarza, pino o eucalipto invasor</b>, anótalo en la bitácora para jornada de control.'
    },
    {
      t: '🌱 Hoy: relictos y restauración', cuando: '2000 – actualidad · 27F, humedal Rocuant, semillero',
      d: 'Quedan <b>relictos</b> que piden cuidado urgente: <b>keule en peligro</b> (Monumento Natural desde 1995), <b>lingue y naranjillo vulnerables</b>, <b>trihue muy escaso</b> en Penco y <b>copihue protegido por ley</b>. El <b>27F (2010)</b> recordó que el bosque de quebrada también afirma laderas. El keule es el caso emblemático de <b>fruto huérfano</b>: sin gonfoterios ni caballos nativos que lo dispersaran, hoy su drupa cae bajo el árbol y se pudre; el ganado (vaca/cerdo/caballo) a veces lo traga pero suele <b>dañar el cuesco al masticar y baja la germinación</b> —no reemplaza al dispersor extinto (Muñoz-Concha et al. 2020)— por lo que casi no hay plántulas y persiste por <b>rebrote</b> (Lander et al. 2019). Restaurar es posible: planta <b>peumo, quillay, boldo, canelo, arrayán, maitén y avellano</b> en Pukem con lluvia, guarda semilla <b>con medida</b>, y en otoño disfruta los <b>hongos</b> (loyo, changle) sin arrancar el micelio. Observa keule, no recolectes sin permiso CONAF.',
      sp: [
        { n: 'Keule', cat: true }, { n: 'Lingue', cat: true }, { n: 'Naranjillo', cat: true },
        { n: 'Trihue / Laurel', cat: true }, { n: 'Copihue', cat: true }, { n: 'Peumo', cat: true },
        { n: 'Quillay', cat: true }, { n: 'Boldo', cat: true }, { n: 'Canelo', cat: true },
        { n: 'Arrayán', cat: true }, { n: 'Avellano', cat: true }, { n: 'Maitén', cat: true },
        { n: 'Maqui', cat: true }, { n: 'Lloyin / Hongos', cat: true }, { n: 'Chupalla', cat: true }
      ],
      hoy: 'Sin megafauna, el keule no viaja: si ves fruto en el suelo, foto y bitácora, <b>no te lleves el cuesco</b> (Monumento Natural). Toca una especie del catálogo para cargarla en tu bitácora.'
    }
  ],
  fuentes: 'Fuentes: HISTORIA_PENCO (basamento, Quiriquina, Cosmito, refugio) · Premoli et al. 2019 (refugios Costa) · Muñoz-Concha et al. 2020 <i>Plants</i> 9:1492 (fruto megafaunal anacrónico, gonfoterio/equidos/milodóntidos) · Lander et al. 2019 (clones y dispersión) · Barceló & Simonetti 2020 NZ J. Bot. (Rattus rattus depredador) · MMA-SIMBIO (N. obliqua–G. keule; Queule En Peligro) · Bustos y Vergara 2004 (conchales) · Ley 20.283 Bosque Nativo · catálogo BOSQUE_NATIVO_PENCO de esta app.'
};

function chip(sp) {
  if (sp.cat) return '<span class="chip chip-bosque su-3b6a3a" data-bosque="' + esc(sp.n) + '" title="Toca para cargarla en el formulario">🌿 ' + esc(sp.n) + '</span>';
  return '<span class="chip su-90aee4">' + esc(sp.n) + '</span>';
}

/* ============================================================
   ACOMPAÑANTES DEL BOSQUE — la red que vive con los árboles:
   hongos, aves, sotobosque y polinizadores del bosque
   esclerófilo-laurifolio costero. Tono honesto: no todo se deja
   ver todos los días; registra lo que observes en la bitácora.
   ============================================================ */
var ACOMPANANTES = {
  intro: 'Un árbol nativo nunca está solo: es una <b>red viva en 4 capas</b> — <b>dosel</b> (árboles nodriza que dan sombra), <b>sotobosque</b> (arbustos y quila que guardan humedad), <b>suelo vivo</b> (hongos, micorrizas y lombrices que alimentan raíces) y <b>quebrada</b> (agua que conecta todo). En sus ramas comen y siembran <b>aves</b>, sus flores alimentan <b>polinizadores</b>, de noche patrullan <b>animales</b> y entre la hojarasca trabajan <b>insectos, arácnidos y libélulas</b>. Esta es la compañía completa del bosque penqueño, con <b>cuándo y dónde mirar</b> cada grupo.',
  grupos: [
    {
      clave: 'hongos',
      t: '🍄 Hongos compañeros', d: 'Reciclan la hojarasca y, como <b>micorrizas</b>, conectan sus hilos a las raíces de peumo, boldo y roble: intercambian agua y nutrientes por azúcares. Sin hongos, el bosque se empobrece. <b>Temporada fuerte: otoño (Abr–Jun)</b> tras las primeras lluvias.',
      items: [
        { n: 'Digüeñe', cient: 'Cyttaria espinosae', icon: '🍄', r: 'Crece sobre robles y hualos; fruto otoñal comestible muy querido. Se corta, no se arranca. En Penco solo donde quede roble/hualo (relicto N. obliqua–keule, hoy escaso).', temp: 'Abr–May', con: ['Roble / Hualo (Nothofagus)', 'Avellano'] },
        { n: 'Changle', cient: 'Ramaria spp.', icon: '🪸', r: 'Ramitas doradas del suelo otoñal; vive asociado al bosque nativo. Indicador de suelo sano. En Penco solo donde quede roble/hualo o quebrada bien conservada.', temp: 'Abr–Jun', con: ['Roble / Hualo (Nothofagus)', 'Avellano'] },
        { n: 'Loyo', cient: 'Boletus loyo', icon: '🍄', r: 'Grande y carnoso, micorrícico de Nothofagus. Solo si 100% seguro: tiene dobles tóxicos. En Penco muy localizado (requiere roble).', temp: 'Abr–Jun', con: ['Roble / Hualo (Nothofagus)'] },
        { n: 'Gargal', cient: 'Grifola gargal · endémico', icon: '🍄', r: 'Hongo endémico en madera muerta de roble viejo (Ñuble al sur; Penco es su límite norte). Aquí no lo esperes: si lo ves en un tronco añoso, foto y bitácora, gran noticia.', temp: 'Abr–May', con: ['Roble / Hualo (Nothofagus)', 'Quebradas húmedas'] },
        { n: 'Ostra', cient: 'Pleurotus ostreatus', icon: '🦪', r: 'En troncos caídos: recicladora que ablanda la madera muerta y abre casa a insectos.', temp: 'Todo el año (más en otoño)', con: ['Árboles caídos', 'Hojarasca y troncos'] },
        { n: 'Pique / Suillus (de pino)', cient: 'Suillus spp.', icon: '⚠️', r: 'Sale bajo pinos introducidos, no bajo nativo. Sirve para distinguir: donde hay pique, hay plantación que fragmenta.', temp: 'Abr–Jun', con: ['Pino / Eucalipto (introducidos)'] }
      ],
      nota: 'Regla de oro: <b>cosecha con tijera o cuchillo, deja el micelio</b>, lleva canasto aireado y nunca arranques todo. Si dudas, foto y bitácora.'
    },
    {
      clave: 'aves',
      t: '🐦 Aves que siembran y polinizan', d: 'Las aves son las grandes <b>sembradoras</b> del bosque: comen fruto y devuelven semilla lejos, lista para germinar. El <b>picaflor chico</b> poliniza las flores colgantes. <b>Mira al amanecer</b>, tras la lluvia.',
      items: [
        { n: 'Zorzal', cient: 'Turdus falcklandii', icon: '🐦', r: 'Dispersa maqui, arrayán y quillay por todo el cerro. Su canto anuncia lluvia.', temp: 'Todo el año', con: ['Maqui', 'Arrayán', 'Quillay'] },
        { n: 'Tenca', cient: 'Mimus thenca · endémica', icon: '🎶', r: 'Imitadora; come frutos y mueve semillas entre quebradas.', temp: 'Todo el año', con: ['Maqui', 'Maitén'] },
        { n: 'Fío-Fío', cient: 'Elaenia albiceps', icon: '🐦', r: 'Migrador que reparte semillas de mirtáceas en primavera. Llega con el pewü.', temp: 'Sep–Mar', con: ['Arrayán'] },
        { n: 'Rayadito', cient: 'Aphrastura spinicauda', icon: '🐦', r: 'Trepa troncos de canelo y arrayán buscando insectos. Muy fiel a su quebrada.', temp: 'Todo el año', con: ['Canelo', 'Arrayán'] },
        { n: 'Torcaza', cient: 'Patagioenas araucana', icon: '🕊️', r: 'Paloma nativa de bandadas otoñales; siembra peumo y boldo a distancia.', temp: 'Mar–Jun (bandadas)', con: ['Peumo', 'Boldo'] },
        { n: 'Carpintero chico', cient: 'Veniliornis lignarius', icon: '🐦', r: 'Golpea troncos viejos buscando larvas; abre huecos que luego usan otras aves.', temp: 'Todo el año', con: ['Árboles caídos', 'Roble / Hualo (Nothofagus)'] },
        { n: 'Chucao', cient: 'Scelorchilus rubecula', icon: '🐦', r: 'Dueño del canto del sotobosque húmedo (Colchagua–Aysén; confirmado en Nonguén, junto a Penco). Raro al norte: solo en quebradas grandes y densas con quila; si lo oyes en Penco, gran noticia.', temp: 'Todo el año (más vocal en invierno)', con: ['Quebradas húmedas', 'Quila', 'Hojarasca'] },
        { n: 'Picaflor chico', cient: 'Sephanoides sephaniodes', icon: '🐝', r: 'Poliniza copihue y quintral flor por flor. El más austral del mundo.', temp: 'Sep–Abr', con: ['Copihue'] }
      ],
      nota: '¿Viste quién comió qué? Anótalo en 🦅 Aves y en la bitácora del bosque: es ciencia ciudadana. Binoculares y silencio valen más que suerte.'
    },
    {
      clave: 'sotobosque',
      t: '🌿 Sotobosque que acompaña', d: 'Bajo el dosel vive otra selva en miniatura: da <b>refugio</b>, guarda la <b>humedad</b> y afirma el suelo. <b>No se limpia “para ordenar”</b>: es la despensa y la cuna del bosque.',
      items: [
        { n: 'Quila / Colihue', cient: 'Chusquea quila', icon: '🎋', r: 'Bambú nativo: refugio de aves y brotes comestibles en primavera. Marca quebrada sana.', temp: 'Brotes Sep–Nov', con: ['Quebradas húmedas', 'Canelo'] },
        { n: 'Chilco', cient: 'Fuchsia magellanica', icon: '🌺', r: 'Flor colgante roja favorita del picaflor. Sus bayas alimentan zorzales en verano.', temp: 'Flor Nov–Mar', con: ['Quebradas húmedas', 'Canelo', 'Arrayán'] },
        { n: 'Murta / Murtilla', cient: 'Ugni molinae', icon: '🫐', r: 'Arbusto de baya aromática (Dic–Mar). Melífero y comestible con medida.', temp: 'Fruto Dic–Mar', con: ['Boldo', 'Peumo', 'Quillay'] },
        { n: 'Michay', cient: 'Berberis spp.', icon: '🌼', r: 'Arbusto espinudo de flor amarilla y baya ácida para aves. Cerco vivo natural.', temp: 'Flor Sep–Nov', con: ['Boldo', 'Peumo'] },
        { n: 'Helechos', cient: 'varias spp.', icon: '🌿', r: 'Alfombran lo sombrío e indican aire y suelo sanos. Donde hay helecho, hay agua cerca.', temp: 'Todo el año', con: ['Canelo', 'Arrayán'] },
        { n: 'Quintral', cient: 'Tristerix corymbosus', icon: '❤️', r: 'Hemiparásito de flores rojas que el picaflor adora; lo siembra el monito del monte en las ramas.', temp: 'Flor May–Oct', con: ['Maitén', 'Árboles altos', 'Maqui'] }
      ],
      nota: 'Si plantas nativo, planta su compañía: quila a la sombra, chilco junto al agua, michay al sol.'
    },
    {
      clave: 'polinizadores',
      t: '🐝 Polinizadores', d: 'Sin ellos no hay fruto ni semilla. Las flores de <b>boldo, quillay, canelo y arrayán</b> son melíferas y los llaman cada primavera. <b>Mira entre 10–15 h</b> en días tibios.',
      items: [
        { n: 'Abejas nativas', cient: 'Caupolicana spp. · endémicas', icon: '🐝', r: 'Endémicas de Chile; visitan las flores del esclerófilo. Nidifican en suelo: no pises taludes arenosos.', temp: 'Sep–Mar', con: ['Quillay', 'Boldo'] },
        { n: 'Abejorros y moscas florícolas', cient: 'varias spp.', icon: '🐝', r: 'Polinizan en días fríos cuando las abejas salen poco. Clave en invierno tardío.', temp: 'Jul–Oct', con: ['Canelo', 'Arrayán', 'Boldo'] },
        { n: 'Escarabajos florícolas', cient: 'Coleoptera', icon: '🪲', r: 'Visitan flores blancas de boldo y trihue; sus larvas reciclan madera muerta.', temp: 'Oct–Ene', con: ['Boldo', 'Trihue / Laurel'] },
        { n: 'Mariposas nocturnas', cient: 'Lepidoptera nocturno', icon: '🦋', r: 'Visitan las flores blancas y perfumadas de la noche (trihue, jazmines nativos).', temp: 'Noches tibias Oct–Mar', con: ['Trihue / Laurel'] },
        { n: 'Picaflor chico (en flores)', cient: 'Sephanoides sephaniodes', icon: '🐦', r: 'El mejor polinizador de flores tubulares: copihue, chilco y quintral dependen de él.', temp: 'Sep–Abr', con: ['Copihue', 'Chilco'] }
      ],
      nota: 'Si plantas nativo, planta también su compañía: flores escalonadas de invierno a verano (boldo → quillay → arrayán → murta).'
    },
    {
      clave: 'suelo',
      t: '🪱 Suelo vivo y micorrizas', d: 'Bajo tus pies hay otra red: <b>hilos de micorriza</b> que conectan árbol con árbol, lombrices que airean y musgos que guardan agua. <b>Un suelo pisoteado o quemado tarda años en volver.</b>',
      items: [
        { n: 'Red de micorrizas', cient: 'hongos micorrícicos', icon: '🕸️', r: 'Hilos blancos bajo la hojarasca que llevan agua a peumo y boldo. No escarbes sin necesidad.', temp: 'Todo el año', con: ['Peumo', 'Boldo', 'Quillay'] },
        { n: 'Lombriz nativa', cient: 'varias spp.', icon: '🪱', r: 'Airea y fertiliza sin pedir nada. Donde hay lombriz, la tierra huele a bosque.', temp: 'Invierno–primavera', con: ['Hojarasca y troncos'] },
        { n: 'Musgos', cient: 'Bryophyta', icon: '🟢', r: 'Esponjas que guardan lluvia para el verano. Alfombran rocas y troncos norte-sombríos.', temp: 'Todo el año', con: ['Canelo', 'Arrayán', 'Quebradas húmedas'] },
        { n: 'Líquenes barba de viejo', cient: 'Usnea spp.', icon: '🧔', r: 'Indican aire limpio: si desaparecen, el aire empeoró. No los arranques.', temp: 'Todo el año', con: ['Árboles altos', 'Quebradas húmedas'] },
        { n: 'Chanchitos de tierra', cient: 'Isopoda nativo', icon: '🦐', r: 'Reciclan hojas duras de boldo y peumo. Los niños los aman: míralos y devuélvelos.', temp: 'Todo el año', con: ['Hojarasca y troncos'] }
      ],
      nota: 'Cuida el suelo: camina por sendero, no compactes con bici/moto y nunca quemes hojarasca.'
    },
    {
      clave: 'agua',
      t: '💧 Agua y quebrada', d: 'La quebrada es la <b>vena del bosque</b>: trae anfibios, libélulas y aves pescadoras. <b>Si la quebrada canta, el bosque está vivo.</b> No laves, no represes, no desvíes.',
      items: [
        { n: 'Rana chilena', cient: 'Calyptocephalella gayi · vulnerable', icon: '🐸', r: 'Anfibio grande y chileno, en retroceso. Solo mirar y no tocar: su piel respira.', temp: 'Sep–Mar (noches)', con: ['Esteros y vertientes', 'Quebradas húmedas'] },
        { n: 'Sapito de cuatro ojos', cient: 'Pleurodema thaul', icon: '🐸', r: 'Canta tras la lluvia en pozas temporales. Sus “cuatro ojos” son manchas defensivas.', temp: 'Invierno–primavera', con: ['Esteros y vertientes'] },
        { n: 'Libélulas y matapiojos', cient: 'Odonata', icon: '🪰', r: 'Patrullan esteros comiendo zancudos. Donde hay libélulas, el agua está sana.', temp: 'Oct–Mar', con: ['Esteros y vertientes'] },
        { n: 'Martín pescador', cient: 'Megaceryle torquata', icon: '🐦', r: 'Pesca en esteros limpios del borde bosque. Verlo es buena señal del agua.', temp: 'Todo el año', con: ['Esteros y vertientes', 'Arrayán'] },
        { n: 'Berro y totora de orilla', cient: 'varias spp.', icon: '🌾', r: 'Filtran el agua y dan casa a renacuajos. No los arranques: afirman la orilla.', temp: 'Todo el año', con: ['Esteros y vertientes'] }
      ],
      nota: 'Una quebrada sana se escucha antes de verse. Si el agua huele mal o va lechosa, anótalo en la bitácora y avisa.'
    },
    {
      clave: 'dosel',
      t: '🌳 Dosel y árboles nodriza', d: 'Los grandes <b>crían a los chicos</b>: bajo un peumo o quillay madre hay sombra, humedad y micorriza lista para que germine lo nuevo. <b>Planta siempre a la sombra de una nodriza.</b>',
      items: [
        { n: 'Peumo nodriza', cient: 'Cryptocarya alba', icon: '🌳', r: 'Copa densa que cría arrayán, canelo joven y chilco bajo ella. Fruto que alimenta torcazas.', temp: 'Fruto Mar–May', con: ['Peumo', 'Arrayán', 'Canelo'] },
        { n: 'Quillay nodriza', cient: 'Quillaja saponaria', icon: '🌳', r: 'Aguanta sol y da media-sombra donde prende boldo y maitén. Melífero clave.', temp: 'Flor Nov–Ene', con: ['Quillay', 'Boldo', 'Maitén'] },
        { n: 'Arrayán refugio', cient: 'Luma apiculata', icon: '🟠', r: 'Tronco frío y corteza que guarda agua; bajo él viven helechos y musgos.', temp: 'Fruto Feb–Abr', con: ['Arrayán', 'Canelo'] },
        { n: 'Olivillo costero', cient: 'Aextoxicon punctatum', icon: '🌳', r: 'Relicto laurifolio de quebrada (30°–43°S, costa): donde está, el bosque antiguo resistió. En Penco escaso y puntual. Solo observar.', temp: 'Todo el año', con: ['Quebradas húmedas', 'Canelo', 'Lingue'] }
      ],
      nota: 'Busca la nodriza antes de plantar: hoyo 40×40 a 1–2 m del tronco madre, lado sur, con compost y acolchado.'
    },
    {
      clave: 'animales',
      t: '🦊 Animales del bosque', d: 'Los que caminan de noche y al atardecer: <b>remueven el suelo, controlan roedores e insectos</b> y siembran a su paso. Son esquivos: si ves uno, anótalo, es gran noticia. <b>Mira huellas al barro blando tras la lluvia.</b>',
      items: [
        { n: 'Chingue', cient: 'Conepatus chinga', icon: '🦨', r: 'Zorrillo común que remueve el suelo buscando insectos y dispersa semillas.', temp: 'Atardeceres', con: ['Sotobosque', 'Quebradas'] },
        { n: 'Zorro chilla / culpeo', cient: 'Lycalopex spp.', icon: '🦊', r: 'Visita los bordes del bosque y controla ratones y conejos. Huye del perro suelto.', temp: 'Noche y amanecer', con: ['Praderas y bordes'] },
        { n: 'Pudú', cient: 'Pudu puda · vulnerable', icon: '🦌', r: 'Ciervo enano (Curicó–Aysén; 233 registros en Nonguén, junto a Penco). Hoy muy raro en Penco fragmentado, posible de paso. Ver uno es premio mayor: silencio y distancia.', temp: 'Amanecer / atardecer', con: ['Quebradas húmedas', 'Quila'] },
        { n: 'Güiña', cient: 'Leopardus guigna tigrillo · vulnerable', icon: '🐈', r: 'Gato silvestre nocturno (Coquimbo–Aysén; persiste en cerros periurbanos de Concepción con presa y refugio). Muy esquiva en Penco: solo cámara trampa o huella.', temp: 'Noche', con: ['Quebradas húmedas', 'Árboles altos'] },
        { n: 'Monito del monte', cient: 'Dromiciops gliroides', icon: '🐭', r: 'Marsupial nocturno (Maule–Los Lagos; confirmado en Nonguén). Penco está cerca de su límite norte: solo en quebradas conservadas con quila y árboles viejos. Hiberna en invierno.', temp: 'Noches tibias Oct–Abr', con: ['Quintral (Tristerix corymbosus)'] },
        { n: 'Lagartijas y culebra de cola larga', cient: 'varias spp.', icon: '🦎', r: 'Controlan insectos entre rocas y claros. Se observan de lejos, sin molestar.', temp: 'Días tibios Sep–Mar', con: ['Roqueríos y claros'] }
      ],
      nota: 'Mira huellas, fecas y senderos: el bosque se lee también sin ver al animal. Nunca alimentes fauna: la enfermas.'
    },
    {
      clave: 'noche',
      t: '🦉 Noche del bosque', d: 'De noche el bosque cambia de turno: <b>cazan los silenciosos</b> y abren las flores blancas. <b>Apaga la linterna un rato</b> y escucha 5 minutos: la noche te cuenta cómo está el bosque.',
      items: [
        { n: 'Concón', cient: 'Strix rufipes', icon: '🦉', r: 'Búho del bosque nativo; caza ratones entre canelos. Su ulular grave es inconfundible.', temp: 'Noches todo el año', con: ['Canelo', 'Quebradas húmedas', 'Árboles altos'] },
        { n: 'Murciélago cola corta', cient: 'varias spp.', icon: '🦇', r: 'Come zancudos y polillas por cientos cada noche. No temas: te cuida.', temp: 'Noches tibias', con: ['Quebradas húmedas', 'Árboles altos'] },
        { n: 'Monito del monte (de noche)', cient: 'Dromiciops gliroides', icon: '🌙', r: 'Trepa de noche buscando insectos y quintral. Ojos grandes que brillan con frontal rojo.', temp: 'Noches Oct–Abr', con: ['Quintral (Tristerix corymbosus)'] },
        { n: 'Mariposas nocturnas y polillas', cient: 'Lepidoptera nocturno', icon: '🦋', r: 'Polinizan flores blancas de trihue. No las toques: el polvo de sus alas es su abrigo.', temp: 'Noches tibias', con: ['Trihue / Laurel'] },
        { n: 'Luciérnaga del Gran Concepción', cient: 'Phanophorus perspicax (Elateridae)', icon: '✨', r: 'Las nuestras no son Lampyridae sino escarabajos bioluminiscentes (saltapericos): la hembra destella desde la hojarasca y el macho vuela bajo. Danza ~3 semanas entre enero y febrero, 1 hora tras la puesta de sol. Apaga toda luz para verlas.', temp: 'Ene–Feb, tras la puesta de sol', con: ['Quebradas húmedas', 'Hojarasca y troncos'] }
      ],
      nota: 'De noche: luz roja suave, voz baja y sendero marcado. Nunca uses flash directo a los ojos.'
    },
    {
      clave: 'insectos',
      t: '🐛 Insectos e invertebrados', d: 'Los más pequeños y los más trabajadores: <b>polinizan, reciclan y alimentan</b> a todo el resto de la red. <b>Da vuelta un tronco, mira y devuélvelo igual.</b>',
      items: [
        { n: 'Abejorro chileno', cient: 'Bombus dahlbomii · en retroceso', icon: '🐝', r: 'Polinizador grande y peludo, en retroceso: si lo ves, no lo molestes. Foto y bitácora.', temp: 'Oct–Mar', con: ['Quillay', 'Boldo', 'Canelo'] },
        { n: 'Mariposas diurnas', cient: 'varias spp.', icon: '🦋', r: 'Sus orugas comen hojas nativas y las adultas polinizan flores. Oruga no es plaga: es futura mariposa.', temp: 'Oct–Abr', con: ['Flores del sotobosque', 'Michay'] },
        { n: 'Chinitas', cient: 'Eriopis spp.', icon: '🐞', r: 'Devoran pulgones que atacan los brotes nuevos. Guardianas del vivero.', temp: 'Sep–Mar', con: ['Brotes y renovales'] },
        { n: 'Caracol negro', cient: 'Macrocyclis peruvianus', icon: '🐌', r: 'Reciclador nocturno de la hojarasca húmeda. Sale tras la lluvia.', temp: 'Noches húmedas', con: ['Hojarasca y troncos'] },
        { n: 'Palote / chinchemollo', cient: 'Phasmatodea', icon: '🦗', r: 'Maestro del camuflaje en boldo y maqui. Si lo encuentras, devuélvelo a su rama.', temp: 'Nov–Mar', con: ['Boldo', 'Maqui'] },
        { n: 'Libélulas (del suelo al agua)', cient: 'Odonata', icon: '🪰', r: 'Patrullan esteros y quebradas comiendo zancudos. Sus larvas viven en el agua limpia.', temp: 'Oct–Mar', con: ['Esteros y vertientes'] }
      ],
      nota: 'Una quebrada con libélulas y abejorros es una quebrada sana. Sin insectos no hay aves.'
    },
    {
      clave: 'aracnidos',
      t: '🕷️ Arácnidos del bosque', d: 'Cazadores silenciosos de <b>8 patas</b> (no son insectos): <b>controlan moscas, zancudos y polillas</b> sin pedir nada. Casi todos son inofensivos si no los aprietas: <b>mira, no toques</b>. Levanta un tronco, mira y devuélvelo igual.',
      items: [
        { n: 'Araña lobo', cient: 'Lycosidae · cazadora de suelo', icon: '🕷️', r: 'Corre por la hojarasca cazando insectos; carga a sus crías en el lomo. Inofensiva si no se aprieta.', temp: 'Todo el año', con: ['Hojarasca y troncos', 'Sotobosque'] },
        { n: 'Araña tejedora de bosque', cient: 'Araneidae · tela orbicular', icon: '🕸️', r: 'Teje su red entre arbustos y quila; atrapa zancudos y polillas. Su tela con rocío matinal delata quebrada sana.', temp: 'Oct–Mar', con: ['Flores del sotobosque', 'Quebradas húmedas', 'Quila'] },
        { n: 'Opiliones (segadores)', cient: 'Opiliones · sin veneno', icon: '🕷️', r: 'Parecen arañas de patas larguísimas; no tienen veneno ni tejen tela. Reciclan bichos muertos bajo troncos húmedos.', temp: 'Noches húmedas', con: ['Hojarasca y troncos', 'Quebradas húmedas'] },
        { n: 'Ácaros del suelo', cient: 'Acari · microscópicos', icon: '🔬', r: 'Diminutos recicladores de la hojarasca junto a lombrices y chanchitos. No se ven a ojo, pero sin ellos el suelo se empobrece.', temp: 'Todo el año', con: ['Hojarasca y troncos', 'Peumo', 'Boldo'] },
        { n: 'Araña pollito', cient: 'Grammostola rosea · Theraphosidae', icon: '🕷️', r: 'Tarántula chilena (Coquimbo–Biobío: Penco es su límite sur). Vive en cuevas bajo piedras de roqueríos secos, no en quebrada húmeda. Dócil pero con pelos urticantes: solo mirar, nunca manipular.', temp: 'Todo el año (más activa en calor)', con: ['Roqueríos y claros', 'Praderas y bordes'] }
      ],
      nota: 'Araña no es plaga: es guardiana. Nunca fumigues el bosque; si una entra a tu casa, vaso y papel y devuélvela al cerro.'
    },
    {
      clave: 'amenazas',
      t: '⚠️ Amenazas y cómo ayudar', d: 'El bosque también tiene sus <b>heridas</b>: invasoras, perros sueltos, fuego y basura. <b>Ver la amenaza a tiempo es cuidarlo.</b> Todo esto se anota en la bitácora como <b>limpieza / control invasoras</b>.',
      items: [
        { n: 'Zarza mora', cient: 'Rubus spp. · invasora', icon: '⚠️', r: 'Cierra senderos y ahoga renovales. Se controla con arranque de raíz en invierno, nunca solo con machete.', temp: 'Todo el año', con: ['Praderas y bordes', 'Quebradas'] },
        { n: 'Pino / eucalipto invasor', cient: 'Pinus, Eucalyptus · introducidos', icon: '🌲', r: 'Secan napas y acidifican suelo; sus renuevos se arrancan chicos en menguante. No plantes más.', temp: 'Renuevos en invierno', con: ['Pino / Eucalipto (introducidos)'] },
        { n: 'Rata negra', cient: 'Rattus rattus · introducida', icon: '🐀', r: 'Depreda semillas de keule y huevos de aves. No dejes basura ni comida en el cerro.', temp: 'Todo el año', con: ['Keule', 'Hojarasca y troncos'] },
        { n: 'Perro suelto / gato asilvestrado', cient: 'introducidos', icon: '🐕', r: 'Persiguen pudú, güiña y aves que nidifican bajo. Lleva tu perro con correa o déjalo en casa.', temp: 'Todo el año', con: ['Praderas y bordes', 'Quebradas'] },
        { n: 'Fuego y basura', cient: 'amenaza humana', icon: '🔥', r: 'Una colilla o fogata basta para perder quebradas enteras. Vuelve con toda tu basura, incluida la orgánica.', temp: 'Verano crítico', con: ['Roqueríos y claros', 'Praderas y bordes'] },
        { n: 'Erosión y compactación', cient: 'suelo herido', icon: '⛰️', r: 'Atajos en bici/moto y pisoteo abren cárcavas. Camina por sendero marcado y no abras nuevos.', temp: 'Invierno (barro)', con: ['Senderos', 'Quebradas'] }
      ],
      nota: 'Si ves amenaza, no la ignores: foto + bitácora + jornada vecinal. Un cerro limpio entre todos dura.'
    }
  ],
  cierre: 'Todo esto cabe en tu bitácora: <b>observación</b> para lo que veas, <b>hongos</b> para lo que coseches con medida, <b>plantación</b> para lo que restaures y <b>limpieza</b> para amenazas. <b>Observar la red completa es cuidar el bosque completo.</b> Prueba el juego: ¿viste hoy algo de cada capa — dosel, sotobosque, suelo y quebrada?'
};

/* Especies agregadas por el usuario en cada grupo del Ecosistema (clave ecoCustom, por usuario) */
function ecoUid(p) { return (p || 'e') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function ecoSave(m) { try { if (typeof scheduleSave === 'function') scheduleSave(m || 'Guardado ✓'); } catch (e) {} }
function getEcoCustom() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return [];
    if (!Array.isArray(u.ecoCustom)) u.ecoCustom = [];
    return u.ecoCustom;
  } catch (e) { return []; }
}
function ecoAddRecord(grupo, rec) {
  var nombre = String((rec && rec.nombre) || '').trim().slice(0, 40);
  if (!nombre) return null;
  var arr = getEcoCustom();
  var r = {
    id: ecoUid('eco'), grupo: grupo, nombre: nombre,
    icon: String((rec && rec.icon) || '').trim().slice(0, 4) || '🌱',
    cient: String((rec && rec.cient) || '').trim().slice(0, 50),
    rol: String((rec && rec.rol) || '').trim().slice(0, 120),
    con: String((rec && rec.con) || '').trim().slice(0, 80)
  };
  arr.push(r);
  ecoSave('Especie guardada 🌱');
  return r;
}
function ecoDelRecord(id) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u || !Array.isArray(u.ecoCustom)) return false;
    var i = u.ecoCustom.findIndex(function (x) { return x.id === id; });
    if (i < 0) return false;
    u.ecoCustom.splice(i, 1);
    ecoSave('Especie borrada');
    return true;
  } catch (e) { return false; }
}

/* Destacados de temporada para la pestaña Bosque hoy (por estación mapuche) */
var DESTACADOS_ESTACION = {
  PUKEM: { t: 'Pukem — plantar y hongos', d: 'Suelo blando con lluvia: planta nativo y guarda semilla. Ojo a los hongos otoñales que alcanzan el invierno.', sp: ['Peumo', 'Quillay', 'Canelo', 'Boldo', 'Lloyin / Hongos'] },
  PEWU: { t: 'Pewü — flores y esquejes', d: 'Floración de boldo y canelo: no cortes flores; es tiempo de esquejes y de controlar invasoras.', sp: ['Boldo', 'Canelo', 'Naranjillo', 'Trihue / Laurel', 'Arrayán'] },
  WALUNG: { t: 'Walüng — frutos', d: 'Cosecha con medida (30% tú, 70% aves y suelo): maqui, avellana y arrayán maduros.', sp: ['Maqui', 'Avellano', 'Arrayán', 'Quillay', 'Maitén'] },
  RIMU: { t: 'Rimü — siembra directa', d: 'La semilla que cae, se siembra: peumo y avellana directo a tierra; hongos en canasto aireado.', sp: ['Peumo', 'Avellano', 'Keule', 'Lingue', 'Lloyin / Hongos'] }
};
var bosqueCatQ = '';

function renderBosqueHistoria() {
  var box = $('bosqueHistoriaPanel');
  if (!box) return;
  var g = dynHistBosque();
  var html = '<p class="muted su-b6db47">' + g.intro + '</p>';
  html += g.eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted su-2c4c6c">' + esc(e.cuando) + '</p>' +
      '<p class="su-afb724">' + e.d + '</p>' +
      '<div class="su-c158a9">' + e.sp.map(chip).join('') + '</div>' +
      '<p class="muted su-e13d76">🔎 ' + e.hoy + '</p></div>';
  }).join('');
  html += '<p class="muted su-a953a7">' + esc(g.fuentes) + '</p>';
  box.innerHTML = html;
  box.querySelectorAll('[data-bosque]').forEach(function (el) {
    el.onclick = function () {
      var inp = $('bosqueSpecies');
      if (inp) { inp.value = el.getAttribute('data-bosque'); try { inp.focus(); } catch (e) {} }
      try { switchBosqueTab('actual'); } catch (e) {}
    };
  });
}

var ecoQ = '';
function ecoNorm(s) { try { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { return String(s == null ? '' : s).toLowerCase(); } }
function ecoCard(it) {
  var cons = Array.isArray(it.con) ? it.con : String(it.con || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var icon = it.icon || '🌱';
  return '<div class="eco-card" data-eco-card>' +
    '<div class="eco-card-top"><span class="eco-ico">' + esc(icon) + '</span>' +
    '<div><b>' + esc(it.n) + '</b>' +
    (it.cient ? '<br><span class="muted eco-cient"><i>' + esc(it.cient) + '</i></span>' : '') + '</div></div>' +
    '<p class="eco-rol">' + esc(it.r) + '</p>' +
    (it.temp ? '<p class="muted eco-temp">📅 ' + esc(it.temp) + '</p>' : '') +
    (cons.length ? '<div class="eco-cons"><span class="muted su-0d5be0">Acompaña a:</span> ' + cons.map(chipAcompan).join('') + '</div>' : '') +
    '</div>';
}
function ecoCustomCard(r) {
  var cons = String(r.con || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  return '<div class="eco-card eco-mia" data-eco-card><div class="eco-card-top"><span class="eco-ico">' + esc(r.icon || '🌱') + '</span>' +
    '<div><b>' + esc(r.nombre) + '</b> <span class="chip su-421073">mía</span>' +
    (r.cient ? '<br><span class="muted eco-cient"><i>' + esc(r.cient) + '</i></span>' : '') + '</div></div>' +
    (r.rol ? '<p class="eco-rol">' + esc(r.rol) + '</p>' : '') +
    (cons.length ? '<div class="eco-cons"><span class="muted su-0d5be0">Acompaña a:</span> ' + cons.map(chipAcompan).join('') + '</div>' : '') +
    '<div class="su-30b926"><button type="button" class="btn su-fd834a" data-ecodel="' + r.id + '">✕ Borrar</button></div></div>';
}
function ecoAddForm(clave) {
  return '<details class="su-c8c413"><summary class="su-d9db22"><b>➕ Agregar especie en este grupo</b></summary>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">Nombre * <input type="text" id="ecoN-' + clave + '" placeholder="ej: Loica, Palito, Murta" maxlength="40"></label>' +
    '<label>Icono <input type="text" id="ecoI-' + clave + '" placeholder="🌱" maxlength="4" class="su-4a6a2f"></label></div>' +
    '<label>Nombre científico (opcional) <input type="text" id="ecoC-' + clave + '" placeholder="ej: Sturnella loyca" maxlength="50"></label>' +
    '<label>Qué hace / rol <input type="text" id="ecoR-' + clave + '" placeholder="ej: Canta al amanecer y come semillas" maxlength="120"></label>' +
    '<label>Acompaña a (separa con comas) <input type="text" id="ecoW-' + clave + '" placeholder="ej: Maqui, Quebradas" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" class="btn btn-accent su-30e741" data-ecoadd="' + clave + '">+ Guardar especie</button></div></details>';
}
function renderAcompan() {
  var box = $('bosqueAcompanPanel');
  if (!box) return;
  var g = dynAcompan();
  var customs = getEcoCustom();
  var totalBase = 0;
  g.grupos.forEach(function (gr) { totalBase += (gr.items || []).length; });
  var html = '<p class="muted su-b6db47">' + g.intro + '</p>';
  html += '<div class="menstrual-card su-68a1a9"><div class="su-0ad856">' +
    '<span class="chip">🌱 ' + g.grupos.length + ' grupos</span>' +
    '<span class="chip">🐾 ' + totalBase + ' especies</span>' +
    (customs.length ? '<span class="chip">⭐ +' + customs.length + ' mías</span>' : '') + '</div>' +
    '<input type="text" id="ecoFilter" placeholder="🔍 Buscar en el ecosistema... (ej: picaflor, quebrada, noche)" autocomplete="off" value="' + esc(ecoQ) + '" class="su-4e420a">' +
    '<div class="su-c158a9" id="ecoIndex">' +
    g.grupos.map(function (gr, i) { return '<a href="#eco-gr-' + esc(gr.clave) + '" class="chip" data-ecoindex="' + i + '">' + esc(gr.t.split(' ')[0]) + ' ' + esc(gr.clave) + '</a>'; }).join('') +
    '</div>' +
    '<p class="muted su-e13d76">Toca un chip de especie del catálogo para cargarlo en tu bitácora. Lo tuyo se guarda privado por usuario.</p></div>';
  html += g.grupos.map(function (gr) {
    var items = (gr.items || []).map(ecoCard).join('');
    var mias = customs.filter(function (x) { return x.grupo === gr.clave; }).map(ecoCustomCard).join('');
    var nBase = (gr.items || []).length, nMias = customs.filter(function (x) { return x.grupo === gr.clave; }).length;
    return '<div class="menstrual-card su-d2c171" id="eco-gr-' + esc(gr.clave) + '"><h4>' + esc(gr.t) + ' <span class="muted su-11a508">· ' + nBase + (nMias ? ' + <b>' + nMias + ' mías</b>' : '') + '</span></h4>' +
      '<p class="muted su-11a508">' + gr.d + '</p><div class="eco-grid">' + items + mias + '</div>' + ecoAddForm(gr.clave) +
      '<p class="muted su-e13d76">💡 ' + gr.nota + '</p></div>';
  }).join('');
  html += '<div class="menstrual-card su-51d56a"><p class="su-6cb285">' + g.cierre + '</p>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="acompanGoAves" class="btn su-30e741">🦅 Ir a Aves</button><button type="button" id="acompanGoBosque" class="btn su-30e741">🌿 Ir a Especies nativas</button></div></div>';
  box.innerHTML = html;
  var f = $('ecoFilter');
  if (f) {
    var aplicarEco = function () {
      ecoQ = (f.value || '').toLowerCase();
      var q = ecoNorm(f.value || '');
      box.querySelectorAll('[data-eco-card]').forEach(function (it) {
        it.style.display = (!q || ecoNorm(it.textContent).indexOf(q) >= 0) ? '' : 'none';
      });
    };
    f.addEventListener('input', aplicarEco);
    if (ecoQ) aplicarEco();
  }
  box.querySelectorAll('[data-bosque]').forEach(function (el) {
    el.onclick = function () {
      var inp = $('bosqueSpecies');
      if (inp) { inp.value = el.getAttribute('data-bosque'); try { inp.focus(); } catch (e) {} }
      try { switchBosqueTab('actual'); } catch (e) {}
    };
  });
  box.querySelectorAll('[data-ecoadd]').forEach(function (btn) {
    btn.onclick = function () {
      var k = btn.getAttribute('data-ecoadd');
      var nEl = $('ecoN-' + k), iEl = $('ecoI-' + k), cEl = $('ecoC-' + k), rEl = $('ecoR-' + k), wEl = $('ecoW-' + k);
      var r = ecoAddRecord(k, {
        nombre: nEl ? nEl.value : '', icon: iEl ? iEl.value : '',
        cient: cEl ? cEl.value : '', rol: rEl ? rEl.value : '', con: wEl ? wEl.value : ''
      });
      if (!r) { alert('Ponle nombre a la especie'); return; }
      renderAcompan();
    };
  });
  box.querySelectorAll('[data-ecodel]').forEach(function (btn) {
    btn.onclick = function () {
      if (!confirm('¿Borrar tu especie?')) return;
      ecoDelRecord(btn.getAttribute('data-ecodel'));
      renderAcompan();
    };
  });
  var ga = $('acompanGoAves');
  if (ga) ga.onclick = function () {
    try { var d = $('bosqueDialog'); if (d) d.close(); } catch (e) {}
    setTimeout(function () { try { $('btnBirds').click(); } catch (e2) {} }, 150);
  };
  var gb = $('acompanGoBosque');
  if (gb) gb.onclick = function () { try { switchBosqueTab('actual'); } catch (e) {} };
}
function chipAcompan(nombre) {
  var enCat = false;
  try {
    var cat = (typeof BOSQUE_CATALOG !== 'undefined') ? BOSQUE_CATALOG : ((window.pencoData || {}).BOSQUE_NATIVO_PENCO || []);
    enCat = cat.some(function (b) { return b.nombre === nombre; });
  } catch (e) {}
  if (enCat) return '<span class="chip chip-bosque su-3b6a3a" data-bosque="' + esc(nombre) + '" title="Toca para cargarla en el formulario">🌿 ' + esc(nombre) + '</span>';
  return '<span class="chip su-90aee4">' + esc(nombre) + '</span>';
}

var bosqueTab = 'actual';
function switchBosqueTab(t) {
  bosqueTab = t;
  var tA = $('tabBosqueActual'), tH = $('tabBosqueHistoria'), tC = $('tabBosqueAcompan');
  if (tA) tA.classList.toggle('btn-accent', t === 'actual');
  if (tH) tH.classList.toggle('btn-accent', t === 'historia');
  if (tC) tC.classList.toggle('btn-accent', t === 'acompan');
  var pA = $('bosqueActualPanel'), pH = $('bosqueHistoriaPanel'), pC = $('bosqueAcompanPanel');
  if (pA) pA.classList.toggle('hidden', t !== 'actual');
  if (pH) pH.classList.toggle('hidden', t !== 'historia');
  if (pC) pC.classList.toggle('hidden', t !== 'acompan');
  if (t === 'historia') renderBosqueHistoria();
  if (t === 'acompan') renderAcompan();
}

/* ---------- Mejoras de la pestaña Bosque hoy (sin tocar renderer.js) ----------
   Envuelve renderBosqueDialog: tras el render original agrega (1) tarjeta de
   resumen con estadísticas de tu bitácora + destacados de la estación con
   especies tocables, y (2) un filtro de búsqueda en el catálogo. */
function estacionBosqueHoy() {
  try {
    if (typeof currentView !== 'undefined' && currentView && currentView.tipo !== 'dft' && typeof MOONS !== 'undefined')
      return MOONS[currentView.luna - 1].estacion;
  } catch (e) {}
  var m = new Date().getMonth();
  return (m === 5 || m === 6 || m === 7) ? 'PUKEM' : (m === 8 || m === 9 || m === 10) ? 'PEWU' : (m === 11 || m === 0 || m === 1) ? 'WALUNG' : 'RIMU';
}
function mejorarBosqueHoy() {
  /* 1) resumen + destacados al final de la tarjeta de hoy */
  var todayBox = $('bosqueTodayBox');
  if (todayBox && !$('bosqueHoyPlus')) {
    var entries = [];
    try { entries = getBosqueData().entries || []; } catch (e) {}
    var plant = entries.filter(function (x) { return x.action === 'plantación'; }).length;
    var spp = {};
    entries.forEach(function (x) { var s = String(x.species || '').trim().toLowerCase(); if (s) spp[s] = 1; });
    var est = estacionBosqueHoy();
    var dest = DESTACADOS_ESTACION[est] || DESTACADOS_ESTACION.PUKEM;
    var div = document.createElement('div');
    div.id = 'bosqueHoyPlus';
    div.innerHTML =
      '<div class="su-0ad856">' +
      '<span class="chip">📓 ' + entries.length + ' registros</span>' +
      '<span class="chip">🌱 ' + plant + ' plantaciones</span>' +
      '<span class="chip">🌿 ' + Object.keys(spp).length + ' especies distintas</span></div>' +
      '<div class="menstrual-card su-afef99"><h4 class="su-49f9d7">⭐ Destacado: ' + esc(dest.t) + '</h4>' +
      '<p class="muted su-11a508">' + esc(dest.d) + '</p>' +
      '<div class="su-c158a9">' +
      dest.sp.map(function (n) { return '<span class="chip chip-bosque su-3b6a3a" data-bosque="' + esc(n) + '" title="Toca para cargarla en el formulario">🌿 ' + esc(n) + '</span>'; }).join('') +
      '</div><div class="dlg-actions su-8a0a91">' +
      '<button type="button" id="bhoyGoForm" class="btn su-337714">📓 Ir a la bitácora</button>' +
      '<button type="button" id="bhoyGoHist" class="btn su-337714">📜 Ver historia</button></div></div>';
    todayBox.appendChild(div);
    div.querySelectorAll('[data-bosque]').forEach(function (el) {
      el.onclick = function () {
        var inp = $('bosqueSpecies');
        if (inp) { inp.value = el.getAttribute('data-bosque'); try { inp.focus(); } catch (e) {} }
      };
    });
    var gf = $('bhoyGoForm');
    if (gf) gf.onclick = function () { try { var f = $('bosqueDate'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} };
    var gh = $('bhoyGoHist');
    if (gh) gh.onclick = function () { try { switchBosqueTab('historia'); } catch (e) {} };
  }
  /* 2) compat: el catálogo nuevo ya trae su propio filtro; solo se aplica el texto guardado si existe input viejo */
  try {
    var catBox = $('bosqueCatalogBox');
    if (catBox && bosqueCatQ) {
      var q = ecoNorm(bosqueCatQ);
      catBox.querySelectorAll('.bosque-sp-card, .fishing-species-item').forEach(function (it) {
        it.style.display = (!q || ecoNorm(it.textContent).indexOf(q) >= 0) ? '' : 'none';
      });
      var cnt = $('bosqueSpCount');
      if (cnt) {
        var vis = 0;
        catBox.querySelectorAll('.bosque-sp-card').forEach(function (it) { if (it.style.display !== 'none') vis++; });
        if (vis) cnt.textContent = vis + ' visibles';
      }
    }
  } catch (e2) {}
}

function setupBosqueHistoria() {
  if (!$('bosqueDialog') || !$('tabBosqueHistoria')) {
    window._bhistRetry = (window._bhistRetry || 0) + 1;
    if (window._bhistRetry < 60) setTimeout(setupBosqueHistoria, 500);
    return;
  }
  try {
    var btn = $('btnBosque');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('historia') < 0)
      btn.dataset.keywords += ' historia bosque tiempo especies gondwana refugio keule queule hualo roble olivillo plantacion pino eucalipto restauracion relicto monumento ley nativo';
  } catch (e) {}
  var tA = $('tabBosqueActual'), tH = $('tabBosqueHistoria'), tC = $('tabBosqueAcompan');
  if (tA && !tA.dataset.w) { tA.dataset.w = '1'; tA.onclick = function () { switchBosqueTab('actual'); }; }
  if (tH && !tH.dataset.w) { tH.dataset.w = '1'; tH.onclick = function () { switchBosqueTab('historia'); }; }
  if (tC && !tC.dataset.w) { tC.dataset.w = '1'; tC.onclick = function () { switchBosqueTab('acompan'); }; }
  try {
    var _bk = $('btnBosque');
    if (_bk && _bk.dataset && _bk.dataset.keywords && _bk.dataset.keywords.indexOf('micorriza') < 0)
      _bk.dataset.keywords += ' acompanantes micorriza sotobosque picaflor dispersor quintral quila diguene changle loyo gargal hongos red polinizador zorzal tenca chucao torcaza rayadito pudu guina concon suelo quebrada rana nodriza chilco murta noche amenaza zarza semilla aracnidos arana opilion libelula luciernaga matapiojos tejedora lobo pollito grammostola phanophorus elateridae saltaperico';
  } catch (e) {}
  try {
    if (typeof renderBosqueDialog === 'function' && !window._bhoyWrapped) {
      window._bhoyWrapped = true;
      var origB = renderBosqueDialog;
      renderBosqueDialog = function () {
        var r = origB.apply(this, arguments);
        try { mejorarBosqueHoy(); } catch (e) {}
        return r;
      };
    }
  } catch (e) {}
  try { renderAcompan(); } catch (e) {}
  var b = $('btnBosque');
  if (b && !b.dataset.bhistW) {
    b.dataset.bhistW = '1';
    b.addEventListener('click', function () { try { switchBosqueTab('actual'); } catch (e) {} });
  }
  try { renderBosqueHistoria(); } catch (e) {}
}

window.BosqueHistoria = { render: renderBosqueHistoria, renderAcompan: renderAcompan, tab: switchBosqueTab, ecoAdd: ecoAddRecord, ecoDel: ecoDelRecord, ecoList: getEcoCustom };
try {
  Object.defineProperties(window.BosqueHistoria, {
    data: { get: dynHistBosque },
    acompan: { get: dynAcompan }
  });
} catch (e) { window.BosqueHistoria.data = HISTORIA_BOSQUE; window.BosqueHistoria.acompan = ACOMPANANTES; }
try { document.addEventListener('territorio:listo', function () { try { renderBosqueHistoria(); } catch (e) {} }); } catch (e2) {}
setTimeout(setupBosqueHistoria, 600);

})();
