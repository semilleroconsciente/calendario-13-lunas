/* ============================================================
   MANTAK CHIA · TAO CURATIVO — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnMantak (grupo Linaje > practicas, tras btnTao)
   - Diálogo mantakDialog con 6 pestañas:
     1) Guía (quién es, Universal Healing Tao, 3 tesoros
        Jing-Qi-Shen, 3 Tan Tien, 5 elementos, cómo practicar
        sin maestro, límites y cuidados)
     2) Sonrisa (sonrisa interior + 6 sonidos curativos:
        fichas con órgano, emoción, sonido, pasos,
        buscador, favoritas, "vivir hoy")
     3) Órbita (órbita microcósmica básica: mapa de puntos,
        apertura segura en 9 vueltas + temporizador +
        registro de sesión)
     4) Cuerpo (respiración abdominal, Tao Yin en suelo,
        Camisa de Hierro básica, automasaje abdominal
        suave, cultivo del amor-sublimación casta)
     5) Test (20 afirmaciones: equilibrio Madera/Fuego/
        Tierra/Metal/Agua + nivel de tensión)
     6) Mi Camino (mi elemento, diario, sesiones de órbita,
        historial, racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().mantak
     { tests:[], miElem:'', practs:[], diario:{}, favs:[],
       sesiones:[] }
   - Puentes: Tao (wu wei), Respiración, Disciplina,
     Energía y descanso, Métodos. Educativo, laico,
     no médico ni terapéutico. 100% offline.
   NOTA: prácticas avanzadas (retención seminal prolongada,
   Fusión, Kan & Li, trabajo con pareja) SOLO se nombran
   como "con maestro/a presencial": aquí no se enseñan.
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
  return String(s == null ? '' : s).slice(0, n || 300);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function lunaTxt(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  return '';
}
function blank() { return { tests: [], miElem: '', practs: [], diario: {}, favs: [], sesiones: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.mantak) u.mantak = blank();
    var e = u.mantak;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (typeof e.miElem !== 'string') e.miElem = '';
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (!Array.isArray(e.sesiones)) e.sesiones = [];
    return e;
  } catch (e2) { return blank(); }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function addKw(id, extra) {
  try { var b = $(id); if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) b.dataset.keywords += ' ' + extra; } catch (e) {}
}
function makeDialog(id, title, sub, bodyHTML) {
  var old = $(id);
  if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = id;
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted su-77e2fe">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(name) {
  ['Guia', 'Soni', 'Orbi', 'Cuerpo', 'Test', 'Camino'].forEach(function (t) {
    var p = $('mk' + t), b = $('tabMk' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS
   ============================================================ */
var MK_SONIDOS = [
  { id: 'sonrisa', cap: 'Sonrisa interior · la base de todo', ico: '😊', tag: 'sonrisa interior gratitud organos ojos tercer ojo relajacion base',
    sonido: 'Sin sonido: solo sonríe por dentro',
    organo: 'Todo el cuerpo: ojos → rostro → garganta → corazón → hígado → bazo → pulmones → riñones → ombligo.',
    emo: 'Transforma tensión en amabilidad. La emoción madre: gratitud tranquila.',
    pasos: '1) Siéntate, lengua al paladar. 2) Sonríe con los ojos (que se achinen un poco). 3) Lleva esa sonrisa como luz tibia: frente → ojos → cara → cuello → corazón (agradece 3 latidos) → hígado → bazo → pulmones → riñones → ombligo 1 min. 4) Termina juntando manos al ombligo 30 seg.',
    cuando: 'Antes de todo: de cada práctica de esta sección, de comer, de dormir, de una conversación difícil.',
    trampa: 'Forzar una sonrisa falsa con la mandíbula apretada. Si no sale, solo afloja ojos y hombros: basta.' },
  { id: 'pulmon', cap: 'Pulmones · SSSSSSS', ico: '🤍', tag: 'pulmon metal tristeza pena duelo piel respiracion otono sss',
    sonido: 'SSSSSSS (como el aire de un neumático, lengua tras los dientes)',
    organo: 'Pulmones + piel + nariz. Elemento Metal. Estación: otoño.',
    emo: 'Suelta: tristeza, pena, duelo atorado. Cultiva: valor, soltar con dignidad.',
    pasos: '1) Manos en muslos, inhala. 2) Sube manos entrelazadas sobre la cabeza, palmas arriba, mira arriba y exhala lento SSSSSSS inclinando apenas el torso. 3) Visualiza gris que sale del pecho. 4) Inhala bajando manos, sonríe a tus pulmones e imagina luz blanca que los llena. 3 veces.',
    cuando: 'Pena, suspiros, opresión en pecho, otoño ventoso, después de llorar.',
    trampa: 'Exhalar hasta marearse. Exhala al 70%: guarda aire para volver.' },
  { id: 'rinon', cap: 'Riñones · CHOOO (FUUU)', ico: '💧', tag: 'rinon agua miedo inseguridad espalda oidos invierno chooo frio voluntad',
    sonido: 'CHOOO (apagando una vela, labios en O chica)',
    organo: 'Riñones + oídos + huesos + espalda baja. Elemento Agua. Estación: invierno. Guarda tu energía base (Jing).',
    emo: 'Suelta: miedo, inseguridad, susto. Cultiva: calma, voluntad tranquila.',
    pasos: '1) Sentado, manos abrazando rodillas. 2) Inhala y redondea la espalda mirando al frente-arriba. 3) Exhala CHOOO bajando el mentón al pecho y apretando suavemente rodillas contra pecho, siente los riñones. 4) Inhala, endereza, sonríe a tus riñones e imagina luz azul oscura. 3 veces.',
    cuando: 'Miedo, espalda baja fría o tensa, noches con trasnoche, oídos tapados por estrés.',
    trampa: 'Forzar la espalda si hay hernia o dolor fuerte: hazlo mini, sin doblar, solo sonido + sonrisa.' },
  { id: 'higado', cap: 'Hígado · SHHHH', ico: '💚', tag: 'higado madera rabia enojo frustracion ojos primavera shhh vision',
    sonido: 'SHHHH (como para callar, lengua al paladar)',
    organo: 'Hígado + ojos + tendones. Elemento Madera. Estación: primavera.',
    emo: 'Suelta: rabia, enojo, frustración, impaciencia. Cultiva: amabilidad, visión clara.',
    pasos: '1) Entrelaza dedos, estira brazos arriba inclinando a la derecha, inhala. 2) Exhala SHHHH mirando a la izquierda, siente el costado derecho. 3) Inhala bajando brazos, sonríe a tu hígado e imagina luz verde. 3 veces por lado (parte por el derecho).',
    cuando: 'Rabia, ojos cansados, mandíbula apretada, decisiones bajo presión.',
    trampa: 'Gritar el sonido o estirar hasta doler. Suave: el hígado se abre con amabilidad, no con lucha.' },
  { id: 'corazon', cap: 'Corazón · HAAAWWW', ico: '❤️', tag: 'corazon fuego alegria ansiedad insomnio lengua verano haw risa',
    sonido: 'HAAAWWW (bostezo con boca bien abierta)',
    organo: 'Corazón + lengua. Elemento Fuego. Estación: verano. Casa del Shen (ánimo).',
    emo: 'Suelta: ansiedad, prisa, exceso de risa nerviosa, insomnio. Cultiva: alegría serena, amor y respeto.',
    pasos: '1) Inhala, manos entrelazadas empujan al cielo. 2) Exhala HAAAWWW abriendo grande la boca, mira arriba. 3) Inhala bajando manos al corazón, sonríe y siente luz roja suave. 3 veces. Ideal antes de dormir.',
    cuando: 'Corazón acelerado, cabeza que no para, calor en el pecho, hablar rapidísimo.',
    trampa: 'Hiperventilar. Pausa entre cada sonido: 2 respiraciones normales.' },
  { id: 'bazo', cap: 'Bazo-Páncreas · HUUUU', ico: '💛', tag: 'bazo pancreas tierra preocupacion digestino boca estomago huu centro',
    sonido: 'HUUUU (desde la garganta profunda, como búho suave)',
    organo: 'Bazo-páncreas + estómago + boca. Elemento Tierra. Centro de las estaciones (cosechas).',
    emo: 'Suelta: preocupación circular, dar vueltas. Cultiva: centro, confianza, buena digestión de ideas y comida.',
    pasos: '1) Manos bajo las costillas, dedos al centro. 2) Inhala al vientre. 3) Exhala HUUUU presionando suavemente el centro con las yemas. 4) Inhala, sonríe a tu centro e imagina luz amarilla. 3 veces, sin comer recién comido (espera 1 hora).',
    cuando: 'Preocupación que repite, digestión pesada por nervios, mente dando vueltas de noche.',
    trampa: 'Apretar fuerte el abdomen. Presión pluma: el bazo se calma, no se exprime.' },
  { id: 'triple', cap: 'Triple Calentador · HEEEE', ico: '🔥', tag: 'triple calentador equilibrio temperatura estres general heee calor',
    sonido: 'HEEEE (sonrisa amplia, lengua abajo)',
    organo: 'Tres zonas: pecho (respiración), vientre (digestión), bajo vientre (base). Equilibra la temperatura interna.',
    emo: 'Suelta: tensión general, calor atrapado, estrés acumulado del día. Cultiva: equilibrio y descanso.',
    pasos: '1) Acostado o sentado, inhala. 2) Exhala HEEEE visualizando calor que baja de la cabeza al pecho, al vientre y a los pies como una cascada tibia. 3) Inhala fresco por la nariz. 4) Sonríe a los 3 centros. 3 veces. Cierre perfecto de la serie.',
    cuando: 'Cierre de la serie de sonidos, bochornos por estrés, noches inquietas, días muy cargados.',
    trampa: 'Hacerlo solo y saltarse la sonrisa. El HEEEE reparte; la sonrisa fija lo bueno.' }
];
function mkSonido(id) { for (var i = 0; i < MK_SONIDOS.length; i++) if (MK_SONIDOS[i].id === id) return MK_SONIDOS[i]; return null; }

var MK_ORBITA = [
  { n: '1 · Perineo (Huiyin)', d: 'Puerta base entre genitales y ano. Solo ATENCIÓN suave, sin apretar fuerte. Aquí nace la subida.' },
  { n: '2 · Sacro (Changqiang)', d: 'Base de la columna. Siente calorcito que sube como agua tibia por la espalda.' },
  { n: '3 · T11 (Mingmen, frente al ombligo)', d: 'Puerta de la vida, riñones. Con las manos en riñones si quieres: respira ahí.' },
  { n: '4 · C7 (Dazhui, base del cuello)', d: 'Cruce de hombros. Suelta hombros: la energía pasa mejor sin tensión.' },
  { n: '5 · Coronilla (Baihui)', d: 'Cima de la cabeza. Lengua al paladar para conectar el circuito.' },
  { n: '6 · Tercer ojo (Yintang)', d: 'Entrecejo. Baja la atención como miel lenta por la frente.' },
  { n: '7 · Paladar + garganta', d: 'La lengua pegada al paladar es el puente: de aquí el circuito baja adelante.' },
  { n: '8 · Corazón (Shanzhong)', d: 'Centro del pecho. Sonríe aquí una respiración: gratitud.' },
  { n: '9 · Ombligo (Shenque)', d: 'Almacén final (Tan Tien inferior). Junta manos al ombligo y guarda lo cultivado.' }
];

var MK_PRACTICAS = [
  { id: 'respi', n: 'Respiración abdominal taoísta', ico: '🌬️', tiempo: '3-5 min, 1-2 veces al día',
    pasos: '1) Siéntate, lengua al paladar, hombros bajos. 2) Inhala por la nariz: el vientre bajo se INFLA (no el pecho). 3) Exhala: el vientre se recoge solo hacia la columna. 4) 9-18 rondas lentas. Manos en ombligo: siente la ola.',
    tip: 'Base de TODO el sistema Chia. Si solo haces una cosa, haz esta. Puente: 🌬️ Respiración del calendario.' },
  { id: 'taoyin', n: 'Tao Yin en el suelo (despertar suave)', ico: '🐉', tiempo: '10 min en manta o colchoneta',
    pasos: '1) Gato-vaca lento 6 veces. 2) Cobra suave (manos bajo hombros, codos doblados, 3 respiraciones). 3) Torsión acostada: rodillas a un lado, brazos en cruz, 3 respiraciones por lado. 4) Puente suave 3 veces. Sin dolor: al 60% de tu rango.',
    tip: 'Tao Yin = yoga taoísta en el suelo para columna y tendones. Ideal en Penco en mañanas frías: despierta sin impacto.' },
  { id: 'camisa', n: 'Camisa de Hierro básica (arraigo)', ico: '🌳', tiempo: '5 min de pie',
    pasos: '1) Pies ancho de hombros, rodillas blandas, como sentado en silla alta. 2) Abrazo el árbol: brazos en círculo frente al pecho, axilas aireadas. 3) Lengua al paladar, respira al ombligo 9 veces. 4) Siente pies pesados y cabeza liviana. NO aguantes la respiración ni aprietes: versión suave y segura.',
    tip: 'La versión avanzada con empaques y presión es SOLO con maestro/a. Aquí solo postura + respiración: ya fortalece.' },
  { id: 'auto', n: 'Automasaje abdominal (Chi Nei Tsang suave)', ico: '🤲', tiempo: '5 min, lejos de comidas',
    pasos: '1) Acostado, rodillas dobladas. 2) Con yemas, círculos suaves alrededor del ombligo (sentido horario) 36 veces. 3) Si hay un punto tenso: respira ahí + sonrisa, sin clavar. 4) Termina con manos tibias en el ombligo. Detente si hay dolor, embarazo o post-operatorio.',
    tip: 'El vientre guarda tensión ("segundo cerebro"). Suave = profundo. Nunca con dolor ni moretones.' },
  { id: 'amor', n: 'Cultivo del amor · sublimación (versión casta)', ico: '💗', tiempo: 'Solo energía, sin técnicas íntimas',
    pasos: 'Enfoque 100% energético y respetuoso: 1) Sonrisa interior + respiración abdominal. 2) Ante deseo o energía fuerte: inhala, contrae SUAVE el suelo pélvico 3 seg, exhala llevando atención por la espalda hasta la coronilla y bajando al ombligo (1 órbita). 3) Guarda manos en ombligo. Sin pornografía ni forzar el cuerpo: si hay confusión o culpa, conversa y detente.',
    tip: 'Las técnicas íntimas detalladas (hombre/mujer, retención, pareja) se aprenden SOLO presencial con maestro/a calificado/a. Aquí solo el principio: no desperdiciar tu energía, subirla y guardarla.' },
  { id: 'fusi', n: 'Fusión simple de una emoción (puerta segura)', ico: '🌀', tiempo: '5 min cuando algo pesa',
    pasos: '1) Nombra la emoción (ej: rabia) y su órgano (hígado). 2) Sonido curativo 3 veces. 3) Sonríe al órgano y pregúntale: ¿qué virtud me ofrece? (rabia→amabilidad). 4) Lleva esa virtud al ombligo con las manos. La Fusión completa de 5 elementos es con guía: esto es su semilla segura.',
    tip: 'No revuelvas traumas graves a solas: con pena fuerte o crisis, pide apoyo (CESFAM, *4141 24 h).' }
];

var MK_TEST = [
  { c: 'M', txt: 'Me enojo o impaciento con facilidad; me cuesta esperar.' },
  { c: 'F', txt: 'Ando acelerado/a, hablo rápido o me cuesta dormir por ideas.' },
  { c: 'T', txt: 'Le doy vueltas a lo mismo y me cuesta decidir.' },
  { c: 'P', txt: 'Me invade la pena, suspiro mucho o me resfrío seguido.' },
  { c: 'A', txt: 'Siento miedo o inseguridad ante cambios, aunque sean chicos.' },
  { c: 'M', txt: 'Mis ojos se cansan o mi cuello-hombros viven tensos.' },
  { c: 'F', txt: 'Siento calor en pecho/cara o el corazón late fuerte sin razón.' },
  { c: 'T', txt: 'Mi digestión se resiente cuando me preocupo.' },
  { c: 'P', txt: 'Me cuesta soltar: guardo cosas, rencores u objetos.' },
  { c: 'A', txt: 'Mi espalda baja se enfría o duele; me agoto con facilidad.' },
  { c: 'M', txt: 'Hago muchas cosas a la vez y me frustro si se traban.' },
  { c: 'F', txt: 'Paso de la risa al bajón en el mismo día.' },
  { c: 'T', txt: 'Como apurado/a o picoteo por ansiedad.' },
  { c: 'P', txt: 'Prefiero el silencio y me agota el ruido social.' },
  { c: 'A', txt: 'Dejo para mañana lo que me asusta empezar.' },
  { c: 'M', txt: 'Critico (a otros o a mí) más de lo que quisiera.' },
  { c: 'F', txt: 'Me cuesta parar: pantallas hasta tarde, mente encendida.' },
  { c: 'T', txt: 'Dudo de mí aunque los demás me digan que voy bien.' },
  { c: 'P', txt: 'El otoño o los duelos me bajan más que al resto.' },
  { c: 'A', txt: 'Aprieto mandíbula o me encojo cuando algo me supera.' }
];
var MK_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var MK_ELEMS = {
  M: { n: 'Madera · Hígado', ico: '🌳', col: '#8fd694', desc: 'Visión y decisión. Fuerte: inicias, planeas, avanzas. En exceso: rabia, rigidez, ojos y cuello tensos.',
    entrena: 'Sonido SHHH + estirar costados suave + 1 decisión chica al día (no 10). Acostarte antes de las 23 h cuida al hígado.',
    sonido: 'higado', pract: 'Tao Yin en el suelo (despertar suave)' },
  F: { n: 'Fuego · Corazón', ico: '🔥', col: '#e07878', desc: 'Alegría y vínculo. Fuerte: animas, conectas, celebras. En exceso: ansiedad, insomnio, hablar sin parar.',
    entrena: 'Sonido HAAAWWW + sonrisa al corazón + pausa de pantallas 1 h antes de dormir. Menos café, más caminata.',
    sonido: 'corazon', pract: 'Respiración abdominal taoísta' },
  T: { n: 'Tierra · Bazo', ico: '🌾', col: '#e8c56a', desc: 'Centro y digestión. Fuerte: sostienes, ordenas, nutres. En exceso: preocupación circular, digestión pesada.',
    entrena: 'Sonido HUUUU + comer sentado y lento + 1 preocupación escrita y soltada al día.',
    sonido: 'bazo', pract: 'Automasaje abdominal (Chi Nei Tsang suave)' },
  P: { n: 'Metal · Pulmones', ico: '🤍', col: '#cfd6e4', desc: 'Soltar y poner límites. Fuerte: ordenas, dices que no, dejas ir. En exceso: pena guardada, rigidez, piel y nariz sensibles.',
    entrena: 'Sonido SSSSSSS + caminata con exhalaciones largas + soltar 1 objeto o pendiente por semana.',
    sonido: 'pulmon', pract: 'Respiración abdominal taoísta' },
  A: { n: 'Agua · Riñones', ico: '💧', col: '#7ab8ff', desc: 'Reserva y voluntad. Fuerte: perseveras, cuidas tu energía. En exceso: miedo, agotamiento, espalda baja fría.',
    entrena: 'Sonido CHOOO + abrigo lumbar + dormir 7-8 h + menos trasnoche. Guarda tu energía: 1 no a tiempo.',
    sonido: 'rinon', pract: 'Camisa de Hierro básica (arraigo)' }
};

var MK_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): Agua. Sonrisa + CHOOO + abrigo lumbar + dormir temprano. Guarda tu Jing: menos trasnoche, más caldo y descanso.',
  'Lunas 4-6 (Pewu · primavera): Madera. SHHH + Tao Yin + 1 proyecto que brote sin apuro. Estira, mira lejos (ojos), acuéstate temprano.',
  'Lunas 7-9 (Walung · verano): Fuego. HAAAWWW + corazón sereno + dar y celebrar. Cuida el exceso de calor: sombra, agua, siesta corta.',
  'Lunas 10-13 (Rimu · otoño): Metal-Tierra. SSSSSSS + HUUUU + soltar (un cajón, un rencor) + comer tibio y simple. Cosecha y guarda.'
];

/* ============================================================
   DIÁLOGO
   ============================================================ */
function buildDialog() {
  var soniGrid = MK_SONIDOS.map(function (it) {
    return '<button type="button" class="btn mk-soni-card su-1c48e1" data-tx="' + it.id + '">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted su-11a508">' + esc(it.sonido) + '</span></button>';
  }).join('');

  var practHTML = MK_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted su-11a508">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p class="su-6cb285">' + esc(p.pasos) + '</p>' +
      '<p class="muted su-6cb285">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn mk-pract-add su-30e741" data-p="' + esc(p.n) + '">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var orbitaHTML = MK_ORBITA.map(function (p, i) {
    return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + esc(p.n) + '</b><br>' + esc(p.d) + '</span>' +
      '<b class="su-803c87">' + (i + 1) + '/9</b></div>';
  }).join('');

  var testHTML = MK_TEST.map(function (q, i) {
    var opts = MK_LIKERT.map(function (o) {
      return '<label class="check-row su-a16b97"><input type="radio" name="mkQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card su-fdf33f"><b class="su-6cb285">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div class="su-8fd176">' + opts + '</div></div>';
  }).join('');

  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabMkGuia" class="btn btn-accent su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabMkSoni" class="btn su-30e741">😊 Sonidos</button>' +
    '<button type="button" id="tabMkOrbi" class="btn su-30e741">🌀 Órbita</button>' +
    '<button type="button" id="tabMkCuerpo" class="btn su-30e741">🐉 Cuerpo</button>' +
    '<button type="button" id="tabMkTest" class="btn su-30e741">📝 Test</button>' +
    '<button type="button" id="tabMkCamino" class="btn su-30e741">🌱 Mi camino</button></div>' +

    '<div id="mkGuia">' +
    '<div class="menstrual-card su-68a1a9"><h4>🐉 ¿Quién es Mantak Chia?</h4>' +
    '<p class="muted su-616df7">Maestro taoísta nacido en Tailandia (1944), enseñado desde niño por el monje <b>Yi Eng</b>. Estudió tai chi, kung fu, yoga y meditación, y en 1979 fundó en Nueva York el <b>Universal Healing Tao</b> (Tao Curativo) para enseñar en lenguaje simple lo que antes era secreto de monasterio. Escribió decenas de libros (<i>Despierta la energía curativa a través del Tao, La órbita microcósmica, Tao Yin, Los seis sonidos curativos, El cultivo de la energía sexual masculina/femenina, Camisa de Hierro, Fusión de los 5 elementos</i>) y creó <b>Tao Garden</b> en Chiang Mai. Su idea: <b>tu cuerpo ya sabe sanarse; solo hay que sonreírle, respirarlo y moverlo</b>.</p>' +
    '<p class="muted su-616df7">Esta sección enseña solo sus <b>bases seguras y castas</b>: sonrisa interior, 6 sonidos, respiración abdominal, órbita básica, Tao Yin suave y arraigo. Lo avanzado se nombra pero <b>no se enseña aquí</b>: se aprende presencial con maestro/a.</p></div>' +
    '<div class="fishing-grid su-d2c171">' +
    '<div class="menstrual-card"><h4>💎 Los 3 tesoros (Jing · Qi · Shen)</h4>' +
    '<p class="muted su-6cb285"><b>Jing (esencia):</b> tu reserva —riñones, huesos, trasnoche y excesos la gastan; dormir, abrigarte y moderación la cuidan. <b>Qi (energía):</b> lo que circula hoy —respiración, comida tibia y movimiento la suben. <b>Shen (espíritu):</b> tu ánimo y claridad —se nubla con pantallas y rencor; se ilumina con sonrisa, gratitud y silencio. Las 3 se cuidan juntas.</p></div>' +
    '<div class="menstrual-card"><h4>🏺 Los 3 Tan Tien (calderos)</h4>' +
    '<p class="muted su-6cb285"><b>Inferior (ombligo):</b> almacén de energía —aquí termina toda práctica (manos al ombligo). <b>Medio (corazón):</b> transforma emoción en amabilidad. <b>Superior (entrecejo):</b> claridad y observación. Regla de oro Chia: <b>siempre guarda al final en el ombligo</b>, no dejes la energía arriba (mareo).</p></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🖐️ Los 5 elementos (mapa rápido)</h4>' +
    '<p class="muted su-6cb285">🌳 <b>Madera</b>-Hígado (rabia→amabilidad) · 🔥 <b>Fuego</b>-Corazón (ansiedad→alegría serena) · 🌾 <b>Tierra</b>-Bazo (preocupación→centro) · 🤍 <b>Metal</b>-Pulmones (pena→valor de soltar) · 💧 <b>Agua</b>-Riñones (miedo→calma). El test 📝 te dice cuál nutrir primero.</p></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar sin maestro? (rutina mínima segura)</summary>' +
    '<p class="muted su-6cb285"><b>Mañana:</b> sonrisa interior 2 min + respiración abdominal 9 rondas. <b>Día:</b> 1 sonido según tu emoción (rabia→SHHH, pena→SSS, miedo→CHOOO, ansiedad→HAAAWWW, vueltas→HUUUU, cargado→HEEEE). <b>Semana:</b> Tao Yin 2 veces + órbita básica 1 vez + automasaje 1 vez. 10-15 min diarios bastan. Junta manos al ombligo al cerrar. <b>Avanzado NO incluido:</b> retención prolongada, Fusión completa, Kan & Li, prácticas de pareja: solo con guía presencial.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted su-6cb285">✅ Prácticas <b>suaves y educativas</b>, sin posturas extremas ni apneas. ✅ <b>Detente</b> si hay mareo, dolor, palpitaciones o angustia: respira normal, camina, toma agua. ✅ Embarazo, hipertensión no controlada, hernias, post-operatorio, glaucoma: solo sonrisa + respiración suave y consulta tu matrona/médico antes de Tao Yin, camisa o automasaje. ✅ No reemplaza médico, terapeuta ni red: con crisis, CESFAM o *4141 (Chile, 24 h). ✅ Contenido <b>casto</b>: aquí no hay técnicas íntimas explícitas.</p></details>' +
    '<div class="menstrual-card su-d2c171"><h4>🌙 Chia × 13 lunas (Penco)</h4><div id="mkLunasBox"></div>' +
    '<p class="muted su-e13d76">Puentes: ☯️ <b>Tao</b> (wu wei y agua) · 🌬️ <b>Respiración</b> · 🎯 <b>Disciplina</b> (constancia amable) · ⚡ <b>Energía y descanso</b> (dormir guarda Jing).</p></div>' +
    '</div>' +

    '<div id="mkSoni" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>😊 Sonrisa interior + 6 sonidos curativos</h4>' +
    '<p class="muted su-6cb285">El corazón del sistema Chia: <b>sonríes al órgano, sueltas su emoción con el sonido y lo llenas de virtud</b>. 3 veces cada uno, siempre en este orden: Pulmones → Riñones → Hígado → Corazón → Bazo → Triple Calentador. Empieza y termina con sonrisa.</p>' +
    '<div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="mkQ" placeholder="ej: rabia, miedo, pena, dormir, digestión..." maxlength="40"></label></div></div>' +
    '<div id="mkSoniGrid" class="su-1e9d45">' + soniGrid + '</div>' +
    '<div id="mkDetalle" class="menstrual-card su-51d56a"><p class="muted">Toca una ficha para ver su paso a paso 👆</p></div></div>' +

    '<div id="mkOrbi" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🌀 Órbita microcósmica básica (9 vueltas suaves)</h4>' +
    '<p class="muted su-6cb285">Sube la atención por la <b>espalda</b> al inhalar y bájala por el <b>frente</b> al exhalar, con la lengua al paladar. Versión <b>segura</b>: solo atención + respiración, sin apretar ni aguantar el aire. Si te mareas, abre los ojos y mira lejos.</p>' +
    '<div class="su-58703f"><button type="button" id="mkOrbitaBtn" class="btn btn-accent su-30e741">▶ Guiar 9 vueltas (~5 min)</button> ' +
    '<span id="mkOrbitaMsg" class="muted su-6cb285"></span></div>' +
    '<div class="conv-row su-8a77e5"><label>Antes (0-10) <input type="number" id="mkOrbAntes" min="0" max="10" placeholder="tensión"></label>' +
    '<label>Después (0-10) <input type="number" id="mkOrbDespues" min="0" max="10" placeholder="calma"></label></div>' +
    '<div class="dlg-actions su-41efc8"><button type="button" id="mkOrbSave" class="btn btn-accent su-30e741">💾 Guardar sesión de órbita</button>' +
    '<button type="button" id="mkGoRespira" class="btn su-30e741">🌬️ Ir a Respiración</button></div></div>' +
    '<div class="su-d2c171">' + orbitaHTML + '</div>' +
    '<div class="menstrual-card"><h4>🗺️ Cómo girar (1 vuelta)</h4>' +
    '<p class="muted su-6cb285">Inhala: perineo → sacro → Mingmen → C7 → coronilla. Exhala: tercer ojo → paladar → garganta → corazón → ombligo. 9 vueltas, manos al ombligo 1 min al final. Eso es todo: simple, repetido, guardado.</p></div></div>' +

    '<div id="mkCuerpo" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>🐉 Cuerpo taoísta (5 prácticas seguras)</h4>' +
    '<p class="muted su-6cb285">Elige 1 por día. Todas al 60%: <b>suave = profundo</b>. Con dolor, embarazo, hipertensión o post-operatorio: solo respiración + sonrisa y consulta profesional.</p></div>' +
    practHTML + '</div>' +

    '<div id="mkTest" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>📝 Test: ¿qué elemento pide auxilio? (20 afirmaciones)</h4>' +
    '<p class="muted su-6cb285">Responde según <b>cómo eres casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide tu <b>Madera 🌳 · Fuego 🔥 · Tierra 🌾 · Metal 🤍 · Agua 💧</b>: mientras más alto, más cargado ese órgano-emoción. <b>No es diagnóstico</b>: es una brújula para elegir tu sonido.</p>' +
    '<div class="su-3de8f9"><button type="button" id="mkTestReset" class="btn su-30e741">↺ Limpiar</button> ' +
    '<button type="button" id="mkTestCalc" class="btn btn-accent su-30e741">📊 Ver mi resultado</button></div>' +
    '<div id="mkProgreso" class="muted su-e13d76"></div></div>' +
    '<div id="mkTestBox" class="su-d2c171">' + testHTML + '</div>' +
    '<div id="mkResultado" class="menstrual-card hidden su-51d56a"></div></div>' +

    '<div id="mkCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card su-68a1a9"><h4>🌱 Mi elemento a nutrir</h4>' +
    '<div class="conv-row"><label>Mi elemento <select id="mkMiElem"><option value="">— sin definir —</option><option value="M">🌳 Madera · Hígado</option><option value="F">🔥 Fuego · Corazón</option><option value="T">🌾 Tierra · Bazo</option><option value="P">🤍 Metal · Pulmones</option><option value="A">💧 Agua · Riñones</option></select></label></div>' +
    '<div id="mkMiElemBox" class="su-fe7b49"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario del Tao Curativo</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="mkDiaFecha"></label></div>' +
    '<label>Hoy en mi práctica… (sonido / órbita / cuerpo) <input type="text" id="mkDiaTxt" placeholder="ej: SHHH x3 + órbita 9 vueltas, rabia bajó de 7 a 4" maxlength="140"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="mkDiaAdd" class="btn btn-accent su-30e741">+ Guardar hoy</button></div>' +
    '<div id="mkDiaList" class="habits-list su-ebf445"></div></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🌀 Mis sesiones de órbita</h4><div id="mkSesBox"></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🌊 Mis días de práctica</h4><div id="mkPractsBox"></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🕘 Historial de tests</h4><div id="mkHistBox"></div></div>' +
    '<div class="dlg-actions su-a1935c">' +
    '<span id="mkStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="mkShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="mkToNote" class="btn su-30e741">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="mkClear" class="btn su-214f75">🗑 Borrar todo</button></span></div></div>';

  makeDialog('mantakDialog', '🐉 Mantak Chia · Tao Curativo',
    'Sonrisa interior, 6 sonidos y órbita microcósmica para cuidar tu energía en lo cotidiano. Suave, casto y paso a paso. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('mkLunasBox'); if (!box) return;
  box.innerHTML = MK_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalle(id) {
  var box = $('mkDetalle'); if (!box) return;
  var t = mkSonido(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  box.innerHTML =
    '<h4 class="su-e39eba">' + t.ico + ' ' + esc(t.cap) + '</h4>' +
    '<p class="su-616df7">🔊 <b>' + esc(t.sonido) + '</b></p>' +
    '<p class="su-6cb285">🫀 <b>Órgano:</b> ' + esc(t.organo) + '</p>' +
    '<p class="su-616df7">💧 <b>Emoción:</b> ' + esc(t.emo) + '</p>' +
    '<div class="si-card"><h4>✏️ Paso a paso</h4><p>' + esc(t.pasos) + '</p><p class="muted">🧰 ¿Cuándo? ' + esc(t.cuando) + '</p></div>' +
    '<p class="muted su-6cb285">⚠️ Trampa típica: ' + esc(t.trampa) + '</p>' +
    '<div class="su-67b198">' +
    '<button type="button" class="btn su-30e741" id="mkFavBtn">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent su-30e741" id="mkHoyBtn">✓ Practicar hoy</button></div>';
  var fb = $('mkFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('mkHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '😊 Hoy practiqué: ' + t.cap + ' (' + t.sonido + ')';
    save('Sonido llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function filterSonidos() {
  var q = (($('mkQ') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#mkSoniGrid .mk-soni-card');
  cards.forEach(function (card) {
    var t = mkSonido(card.dataset.tx);
    if (!t) return;
    var hay = ((t.cap + ' ' + t.tag + ' ' + t.sonido + ' ' + t.emo + ' ' + t.cuando).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function calcTest() {
  var sc = { M: 0, F: 0, T: 0, P: 0, A: 0 };
  var contestadas = 0;
  for (var i = 0; i < MK_TEST.length; i++) {
    var sel = document.querySelector('input[name="mkQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[MK_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('mkProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + MK_TEST.length + ' respondidas' + (r.contestadas < MK_TEST.length ? ' — responde todas para una brújula fiel' : ' ✓ listo para calcular');
}
function showResultado(sc) {
  var box = $('mkResultado'); if (!box) return;
  var arr = [{ k: 'M', p: sc.M }, { k: 'F', p: sc.F }, { k: 'T', p: sc.T }, { k: 'P', p: sc.P }, { k: 'A', p: sc.A }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max(arr[0].p, 1);
  var dom = arr[0].k;
  var total = sc.M + sc.F + sc.T + sc.P + sc.A;
  var cargaTxt = total <= 12 ? 'Liviana: energía bastante equilibrada. Sostén con sonrisa + 1 sonido al día.' : total <= 24 ? 'Media: hay un órgano pidiendo auxilio. Parte por el primero + órbita 1 vez por semana.' : 'Alta: varios focos cargados. Empieza suave (sonrisa + respiración + 1 sonido) y pide apoyo si lo necesitas.';
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu brújula (sin guardar)</h4>' +
    '<p class="muted su-11a508">Máximo por elemento: 12 (4 preguntas × 3). Más alto = más cargado = priorízalo con amabilidad.</p>' +
    arr.map(function (a) {
      var c = MK_ELEMS[a.k];
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div class="su-0d84b3">' +
        '<span class="su-b53707"><b>' + c.ico + ' ' + esc(c.n) + '</b></span>' +
        '<span class="su-2982dd">' +
        '<span class="mk-bar" data-w="' + pct + '" data-c="' + c.col + '" data-top="' + (isTop ? '1' : '0') + '"></span></span>' +
        '<b class="su-803c87">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card su-8a77e5"><h4>' + MK_ELEMS[dom].ico + ' A nutrir primero: ' + esc(MK_ELEMS[dom].n) + '</h4>' +
    '<p>' + esc(MK_ELEMS[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(MK_ELEMS[dom].entrena) + '</p>' +
    '<p class="muted">Carga total: <b>' + total + '/60</b> — ' + esc(cargaTxt) + '</p></div>' +
    '<div class="su-ac5453"><button type="button" class="btn btn-accent su-30e741" id="mkSaveTest">💾 Guardar este test</button>' +
    '<button type="button" class="btn su-30e741" id="mkSetElem">✓ Mi elemento: ' + esc(MK_ELEMS[dom].n) + '</button>' +
    '<button type="button" class="btn su-30e741" id="mkReadSoni">😊 Ir al sonido que me sirve</button></div>';
  try {
    box.querySelectorAll('.mk-bar').forEach(function (sp) {
      sp.style.display = 'block'; sp.style.height = '100%';
      sp.style.width = sp.getAttribute('data-w') + '%';
      sp.style.background = sp.getAttribute('data-c');
      sp.style.opacity = sp.getAttribute('data-top') === '1' ? '1' : '.55';
    });
  } catch (eBar) {}
  var sv = $('mkSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('m'), fecha: todayKey(), M: sc.M, F: sc.F, T: sc.T, P: sc.P, A: sc.A, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('mkSetElem');
  if (st) st.onclick = function () {
    var d = store(); d.miElem = dom; save('Tu elemento guardado ✓');
    syncMiElem(); renderMiElemBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('mkReadSoni');
  if (ri) ri.onclick = function () {
    switchTab('Soni'); renderDetalle(MK_ELEMS[dom].sonido);
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiElem() {
  var sel = $('mkMiElem'); if (!sel) return;
  sel.value = store().miElem || '';
}
function renderMiElemBox() {
  var box = $('mkMiElemBox'); if (!box) return;
  var k = store().miElem || '';
  if (!k || !MK_ELEMS[k]) { box.innerHTML = '<p class="muted su-6cb285">Aún sin definir. Haz el test 📝 o elígela arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = MK_ELEMS[k];
  box.innerHTML = '<div class="chip su-d7c8b3"><b>' + c.ico + ' ' + esc(c.n) + '</b><br>' +
    '<span class="muted">' + esc(c.desc) + '<br><b>Entrena:</b> ' + esc(c.entrena) + '</span></div>';
}
function rachaPracts() {
  var set = {};
  (store().practs || []).forEach(function (r) { set[r.fecha] = true; });
  (store().sesiones || []).forEach(function (r) { set[r.fecha] = true; });
  var s = 0, d = new Date();
  for (var i = 0; i < 365; i++) {
    var k;
    try { k = cal.fmtKey.format(d); } catch (e) { k = d.toISOString().slice(0, 10); }
    if (set[k]) { s++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return s;
}
function renderSesiones() {
  var box = $('mkSesBox'); if (!box) return;
  var d = (store().sesiones || []).slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 10);
  if (!d.length) { box.innerHTML = '<p class="muted su-e201a8">Sin sesiones de órbita aún. Gira 9 vueltas arriba 🌀 y guárdala.</p>'; return; }
  box.innerHTML = d.map(function (r) {
    return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + esc(r.fecha) + '</b> · 🌀 ' + esc(String(r.vueltas || 9)) + ' vueltas' +
      (r.antes !== '' && r.antes != null ? ' · ' + esc(String(r.antes)) + '→' + esc(String(r.despues)) : '') +
      (r.nota ? '<br>💬 ' + esc(r.nota) : '') + '</span>' +
      '<button type="button" class="btn btn-icon mk-ses-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.mk-ses-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.sesiones = e.sesiones.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderSesiones(); renderStats(); };
  });
}
function renderPracts() {
  var box = $('mkPractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted su-11a508">🔥 Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) de práctica · órbitas: ' + (store().sesiones || []).length + '.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + esc(r.fecha) + '</b><br>' + esc(r.txt) + '</span>' +
        '<button type="button" class="btn btn-icon mk-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted su-e201a8">Sin días aún. Anota tu primera práctica arriba 🐉.</p>');
  box.querySelectorAll('.mk-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('mkDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted su-e201a8">Sin registros. 1 línea basta: sonido + cómo quedaste.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item su-0486f7"><span class="su-11a508"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon mk-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.mk-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('mkHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted su-11a508">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span class="su-11a508"><b>' + esc(r.fecha) + '</b> · 🌳' + r.M + ' 🔥' + r.F + ' 🌾' + r.T + ' 🤍' + r.P + ' 💧' + r.A + ' · nutrir <b>' + esc(r.dom || '') + '</b></span>' +
      '<button type="button" class="btn btn-icon mk-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.mk-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('mkStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miElem ? MK_ELEMS[e.miElem].n : 'elemento por definir';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) práctica · ' + (e.sesiones || []).length + ' órbita(s) · ' + c;
}

/* Órbita guiada: 9 vueltas con mensajes */
var mkOrbTimer = null;
function runOrbita() {
  var msg = $('mkOrbitaMsg'), btn = $('mkOrbitaBtn');
  if (!msg) return;
  if (mkOrbTimer) { clearInterval(mkOrbTimer); mkOrbTimer = null; if (btn) btn.textContent = '▶ Guiar 9 vueltas (~5 min)'; msg.textContent = ''; return; }
  var vueltas = 9, paso = 0;
  var total = vueltas * 9;
  if (btn) btn.textContent = '⏹ Detener';
  var fases = ['sube por la espalda…', 'coronilla…', 'baja por el frente…'];
  mkOrbTimer = setInterval(function () {
    paso++;
    var v = Math.floor(paso / 9) + 1, f = fases[Math.floor((paso % 9) / 3)];
    if (paso >= total) {
      clearInterval(mkOrbTimer); mkOrbTimer = null;
      if (btn) btn.textContent = '▶ Guiar 9 vueltas (~5 min)';
      msg.textContent = '✓ 9 vueltas completas. Manos al ombligo 1 min y guarda tu sesión abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    msg.textContent = 'Vuelta ' + Math.min(v, 9) + '/9 · ' + f + ' (lengua al paladar)';
  }, 3000);
  msg.textContent = 'Vuelta 1/9 · inhala, sube por la espalda… (lengua al paladar)';
}

/* Puente hacia Métodos */
function puenteMetodos() {
  try {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (tries > 40) { clearInterval(iv); return; }
      var dlg = $('metodosDialog') || document.getElementById('metodosDialog');
      if (!dlg) return;
      var html = dlg.innerHTML || '';
      var low = html.toLowerCase();
      if (low.indexOf('chia') < 0 && low.indexOf('sonrisa interior') < 0 && low.indexOf('orbita') < 0) return;
      if ($('mkOpenFromMetodos')) { clearInterval(iv); return; }
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var t = (b.textContent || '').toLowerCase();
        if (t.indexOf('chia') >= 0 || t.indexOf('sonrisa') >= 0 || t.indexOf('orbita') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.id = 'mkOpenFromMetodos';
          open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '🐉 Abrir mi Tao Curativo';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openMk(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
    }, 500);
  } catch (e) {}
}

function openMk() {
  try {
    if ($('mkDiaFecha') && !$('mkDiaFecha').value) $('mkDiaFecha').value = todayKey();
    syncMiElem(); renderMiElemBox(); renderDiario(); renderHist(); renderPracts(); renderSesiones(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('mantakDialog');
}
try { window.openMantak = openMk; window.openMantakChia = openMk; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > Interior (tras Tao si existe) */
  try {
    if (!$('btnMantak')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnMantak'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🐉 Mantak Chia';
        try { btn.setAttribute('data-sub', 'practicas'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'mantak chia universal healing tao sonrisa interior seis sonidos curativos orbita microcosmica tao yin camisa hierro chi kung qigong jing qi shen tan tien cinco elementos madera fuego tierra metal agua jing qi shen respiracion abdominal automasaje sublimacion');
        var ref = g.querySelector('#btnTao');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnMantak');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'practicas'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnMantak') < 0) ALL_BTNS.push('btnMantak');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnMantak = ['linaje', 'practicas'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|practicas'] && BTN_ORDER['linaje|practicas'].indexOf('btnMantak') < 0) {
      var oi = BTN_ORDER['linaje|practicas'].indexOf('btnTao');
      if (oi >= 0) BTN_ORDER['linaje|practicas'].splice(oi + 1, 0, 'btnMantak');
      else BTN_ORDER['linaje|practicas'].push('btnMantak');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnMantak = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnMantak"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnMantak"> 🐉 Mantak Chia';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnMantak !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnMantak = lab.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e2) {}
            };
          } catch (e2) {}
        }
      });
    }
  } catch (e) {}
  try { addKw('btnMetodos', 'mantak chia sonrisa orbita tao curativo'); } catch (e2) {}
  try { addKw('btnTao', 'mantak chia sonrisa orbita wu wei'); } catch (e3) {}
  try { addKw('btnBreath', 'mantak chia respiracion abdominal orbita'); } catch (e4) {}
  try { addKw('btnDiscipline', 'mantak chia constancia sonrisa orbita'); } catch (e5) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiElem();
  renderMiElemBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderSesiones();
  renderStats();

  var b = $('btnMantak');
  if (b) b.onclick = function () { openMk(); };

  ['Guia', 'Soni', 'Orbi', 'Cuerpo', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabMk' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('mkQ'); if (q) q.oninput = filterSonidos;
  document.querySelectorAll('#mkSoniGrid .mk-soni-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.tx); };
  });
  document.querySelectorAll('.mk-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🐉 Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var ob = $('mkOrbitaBtn'); if (ob) ob.onclick = runOrbita;
  var os = $('mkOrbSave');
  if (os) os.onclick = function () {
    var a = (($('mkOrbAntes') || {}).value || '');
    var dp = (($('mkOrbDespues') || {}).value || '');
    var e = store();
    e.sesiones.push({ id: uid('mko'), fecha: todayKey(), vueltas: 9, antes: a, despues: dp, nota: 'órbita básica 9 vueltas' });
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + '🌀 Órbita 9 vueltas (' + (a !== '' ? a + '→' + dp : 'sin puntaje') + ')';
    save('Sesión de órbita guardada ✓');
    if ($('mkOrbAntes')) $('mkOrbAntes').value = '';
    if ($('mkOrbDespues')) $('mkOrbDespues').value = '';
    renderSesiones(); renderDiario(); renderStats();
  };
  var gr = $('mkGoRespira');
  if (gr) gr.onclick = function () { try { var r = $('btnBreath'); if (r) r.click(); else alert('Abre 🌬️ Respiración desde Mi Día'); } catch (e) {} };

  var tc = $('mkTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < MK_TEST.length) { alert('Te faltan ' + (MK_TEST.length - r.contestadas) + ' por responder para una brújula fiel 🐉'); }
    showResultado(r.sc);
  };
  var tr = $('mkTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < MK_TEST.length; i++) {
      document.querySelectorAll('input[name="mkQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('mkResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#mkTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('mkMiElem');
  if (ma) ma.onchange = function () { var e = store(); e.miElem = ma.value || ''; save('Tu elemento guardado ✓'); renderMiElemBox(); renderStats(); };
  var da = $('mkDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('mkDiaFecha') || {}).value || todayKey();
    var t = clean((($('mkDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu práctica de hoy 🐉'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('mkDiaTxt')) $('mkDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('mkShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miElem ? MK_ELEMS[e.miElem].n : 'elemento por definir';
    share('🐉 Mi Tao Curativo (Mantak Chia)', 'Sonrisa + órbita + cuerpo · ' + c + '\n🔥 Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días práctica · ' + (e.sesiones || []).length + ' órbitas · ' + nd + ' días diario · ' + e.tests.length + ' test(s).\n' + MK_LUNAS[0]);
  };
  var tn = $('mkToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miElem ? MK_ELEMS[e.miElem].n : 'sonrisa + órbita';
      var txt2 = '🐉 Mantak Chia (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy 1 sonido + respiración abdominal');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('mkClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu Tao Curativo (tests, diario, días, órbitas, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.mantak = blank();
    } catch (e) {}
    syncMiElem(); renderMiElemBox(); renderDiario(); renderHist(); renderPracts(); renderSesiones(); renderStats();
    save('Tao Curativo borrado');
  };

  puenteMetodos();
  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
