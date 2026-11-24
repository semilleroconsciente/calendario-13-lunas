/* ============================================================
   CARTAS DEL UNIVERSO — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección para atesorar textos/cartas que irás enviando:
   - Botón btnCartasUniverso (grupo Linaje > practicas)
   - Diálogo cartasUniversoDialog con 3 pestañas:
     1) Cartas (lista + buscador + favoritas)
     2) Lectura (carta completa, frase por frase, compartir,
        copiar, llevar a nota del día)
     3) Mi Diario (reflexión del día + historial + racha)
   - Todo local y privado: userData().cartasUniverso
     { favs:[], diario:{}, lecturas:[] }
   - 100% offline. Sin religión impuesta, tono universal.

   ★ CÓMO AGREGAR UNA NUEVA CARTA (para el mantenedor) ★
   1) Duplica uno de los bloques dentro de CARTAS_UNIVERSO
      (copia desde { id: ... hasta }, inclusive).
   2) Cambia id (único, sin espacios: 'carta-2', ...),
      titulo, subtitulo, fecha y el arreglo parrafos[].
   3) Guarda. El listado, buscador, favoritas y diario
      funcionan solos. No hay que tocar nada más.
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
  return String(s == null ? '' : s).slice(0, n || 500);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function blank() { return { favs: [], diario: {}, lecturas: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.cartasUniverso) u.cartasUniverso = blank();
    var e = u.cartasUniverso;
    if (!Array.isArray(e.favs)) e.favs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.lecturas)) e.lecturas = [];
    return e;
  } catch (e2) { return blank(); }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n\n' + text);
    alert('Copiado al portapapeles ✓');
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

/* ============================================================
   DATOS — CARTAS
   Para agregar más cartas: duplica un bloque { ... }, cambia
   el id y rellena titulo / subtitulo / parrafos[].
   parrafos[]: cada string es un párrafo de la carta.
   cierre: frase final destacada. firma: quién firma.
   ============================================================ */
var CARTAS_UNIVERSO = [
  {
    id: 'carta-1-ver-la-vida',
    titulo: 'La carta que te hará ver la vida de otra manera',
    subtitulo: 'Carta 1 · El Universo te escribe',
    fecha: 'Carta madre · para releer en luna nueva',
    icono: '💌',
    tags: 'universo carta vida amor gratitud alma conciencia libertad sueños pachamama gaia muerte energia proposito huella',
    parrafos: [
      'Estimado humano, si justo ahora estás leyendo esta carta, quiero darte la noticia de que eres un gran afortunado.',
      'Entre millones y millones de estrellas, galaxias y planetas, tú estás aquí, en este preciso momento, y tienes la posibilidad de leer, de reír, de llorar, de amar, y de vivir.',
      'No todos los conjuntos de átomos tienen esa suerte, y ni siquiera la tengo yo.',
      'No pude crearte como un ser perfecto, ni como un ser divino, pero te otorgué alma y conciencia, te hice un ser libre.',
      'Estoy aquí para ayudarte a cumplir tus sueños. Pero tendrás que ser consciente de lo que me pidas: siembra en tu mente paz y tranquilidad, y te la daré.',
      'Tus actos, pensamientos y palabras son el espejo de lo que en algún momento te regresaré cien veces más.',
      'Quiero darte algunas sugerencias. No son órdenes, pero si escuchas, agradecerás.',
      'Ama mucho y ama siempre, pero recuerda que el amor no se trata de posesión sino de apreciar, admirar, compartir y sentir.',
      'Recuerda que para poder amar a otros seres debes amarte primeramente a ti, tal cual eres.',
      'Deja de lado el odio, la injusticia, el racismo, el materialismo. Alimenta tu alma con arte, con música.',
      'Aliméntate todos los días con lo que amas hacer, sal a conocer el mundo, viaja.',
      'Recuerda que tú eres parte de mí así como yo soy parte de ti. Si alimentas tu alma también alimentarás la mía y lograremos ese gran balance.',
      'Estimado humano, te haré caer varias veces, y quizás pienses que te he defraudado, pero debes saber que lo hago para que aprendas a levantarte con más fuerza.',
      'Te llenaré de lágrimas en varias ocasiones, de tristezas, pero recuerda que al final de esa gran oscuridad siempre habrá una luz para ti.',
      'A través de tu vida te iré quitando a algunos de tus hermanos cercanos, pero no te preocupes, recuerda que todo tiene un propósito: la muerte es sólo una extensión de la vida, no mueren, solo pasan a ser esencia y energía del universo, la misma que tú respiras todos los días.',
      'Humano, nunca estás solo. Cuando te sientas solo recuerda que estoy aquí, te veo y te siento.',
      'Sería muy complicado regalarte una forma física de todo mi ser, pero te he regalado trocitos de mi alma, te he regalado una luna que puedes contemplar todas las noches, las estrellas, el sol, te he regalado flores, te he regalado a una naturaleza perfecta, a tu madre naturaleza.',
      'Ella se llama Pachamama, Gaia, tierra y debes cuidarla, amarla y respetarla, aprender de ella porque es sabia.',
      'Yo no hice las religiones, ni las ideologías que sólo actúan completamente en mi opuesto, separando a las personas y clasificándolas. Yo creé seres libres.',
      'Por ello eres libre de darme la forma que tú desees. Puede ser la de un Dios, la de una ideología, la de una divinidad, puedes simplemente no creer en mí.',
      'Es muy complicado darte a conocer mis secretos, la historia de mi creación y mi propósito. Simplemente deseo que aproveches este segundo que te he otorgado en toda mi historia, que vivas al máximo cada día que te otorgo.',
      'Por favor, haz que te recuerde, deja huella como humano en esta hermosa historia del universo.'
    ],
    cierre: 'Recuerda que cada acción que hagas con el corazón, tendrá ecos en todo el universo.',
    firma: '— El Universo'
  },
  {
    id: 'carta-2-oracion-ute',
    titulo: 'Tierra, enséñame…',
    subtitulo: 'Carta 2 · Oración del pueblo Ute',
    fecha: 'Para leer despacio, una estrofa por respiración',
    icono: '🌎',
    tags: 'tierra oracion ute quietud hierba corazon perdon humildad paciencia compasion valentia arbol libertad aguila aceptacion renovacion semilla bondad naturaleza rezo',
    parrafos: [
      'Tierra… enséñame la quietud de la hierba inmóvil bajo la nueva luz… Así podré escuchar el susurro de mi corazón.',
      'Tierra… enséñame el sufrimiento que las viejas rocas guardan en la memoria… Así puedo saber lo que es el dolor, y elegir perdonar y ser libre.',
      'Tierra… enséñame la humildad, como la flor es humilde al abrirse. Así puedo aprender a ser paciente con todas las cosas, especialmente conmigo mismo.',
      'Tierra… enséñame a cuidar, como la Madre Natura a sus niños. Así puedo desarrollar compasión por todos los seres.',
      'Tierra… enséñame la valentía del árbol que permanece solo. Así puedo conocer lo que la fuerza interior es.',
      'Tierra… enséñame la limitación, como la de la hormiga que se arrastra sobre el suelo. Así puedo descubrir el gran poder de la unificación.',
      'Tierra… enséñame la libertad del águila que sobrevuela el cielo. Así puedo saber qué se siente al seguir a mi corazón.',
      'Tierra… enséñame la aceptación de las hojas que mueren y caen. Así puedo amablemente permitir y aceptar el natural flujo de las cosas.',
      'Tierra… enséñame la renovación, como la semilla que brota en la primavera… Así puedo experimentar nuevos comienzos cuando emerjo con nuevas ideas y creaciones.',
      'Tierra… enséñame a olvidarme de mí mismo, como la nieve derretida se olvida de esta vida. Así puedo recordar el gran propósito de mi existencia.',
      'Tierra, enséñame a recordar la bondad, como los secos campos limpiados por la lluvia… Para que pueda practicar la bondad cada día.'
    ],
    cierre: '',
    firma: '— Oración del pueblo Ute'
  },
  {
    id: 'carta-3-siente-tu-alma',
    titulo: 'Siente tu alma: ilumínate…',
    subtitulo: 'Carta 3 · Manifiesto para vivir despierto',
    fecha: 'Para leer una estrofa al día',
    icono: '🌅',
    tags: 'amanecer paz amor respirar sonreir presente fluir intuicion angel sol silencio meditacion yoga gratitud dar misterio universo libertad ritmo alma iluminar manifiesto vivir',
    parrafos: [
      'Observa cada amanecer de manera diferente. Genera paz y entusiasmo.',
      'Ama, respira, vive. Sonríe. No niegues ni prohíbas nada. Sé natural, no especules. Vive sin el reloj en la mente.',
      'No seas posesivo. Sé feliz sin depender. Aprecia un cuadro, píntate uno. Cambia el peinado. Sé jardinero. Sueña y realiza. Busca tu destino.',
      'Seduce. Confía. Brilla con luz propia. No te identifiques, eres solo un pasajero. Ora. Guarda los secretos. Vuélvete niño. Cultiva el espíritu.',
      'Cuida tu cuerpo. Conoce tus deseos. Goza. Siente la lluvia. Canta tu canción favorita. Vuélvete creativo. Estate atento, sé receptivo.',
      'Cambia de rumbo. No critiques, ni condenes. Danza de forma erótica. Siente el fuego. Confía en ti mismo. No te enfermes, purifícate. Imagina de manera positiva.',
      'Mata la rutina. Libérate. No controles, fluye. Usa la magia. Vive sin miedos. No pongas trabas: sé simple. ¿Sabes quién eres?',
      'Busca el éxtasis. No te apegues. Emociónate. No te preocupes. Usa el tacto. Perfúmate. Sé flexible. Vence lo triste. No dividas. Sorprende. Vive el presente. Eleva tu energía. ¡Despiértate!',
      'Usa la conciencia, no la moral. No creas en la tradición, busca la causa. Adáptate a los cambios. Salta fuera de la masa. No busques la seguridad.',
      'Disfruta tu trabajo. Acuéstate en el pasto. Siente el silencio. Brinda un servicio. Enamórate. Celebra. Supera las pruebas. Confía en Dios-Amor.',
      'No hagas daño. No reprimas lo que sientes. Mira a los ojos. Respeta tu divinidad interior. Relájate y haz meditación. Vence la pereza. Sigue tu vocación.',
      'Amígate con tu soledad. Observa el cielo. Practica yoga. Conéctate. No te dejes desacreditar, mantén tu postura. Exprésate. No guardes rencor. Sé agradecido. Ama a alguien.',
      'Abre la mente. No hables mal de los demás. Sé honesto y divertido. Concéntrate en dar: así todos recibimos. Ordena tus cosas. Cierra los ojos, busca lo místico.',
      'Expándete. Comete errores: nunca dos veces el mismo. Llora. No estudies, aprende. Interpreta los sueños. Usa el poder. No marques el camino. Confía en la intuición. Llama a tu ángel. Toma la energía del sol.',
      'Estírate, pega el salto. No acumules cosas innecesarias. Ten una cita. Escribe un poema. Respira profundo. Haz un regalo. No cargues el pasado. Sé práctico. Duerme 8 horas. Trabaja 8 horas. Goza 8 horas.',
      'Dile no a los extremos. Confía en el plan. Busca la evolución. No te dejes dominar. No generes demasiada expectativa. Cocina tu alimento. Toma un masaje. Vive en secreto. Entra en un bosque.',
      'No des todo por sentado. Descubre los mitos. Interpreta los símbolos. Escribe una carta. Cultiva la telepatía. Ama a los animales. Piensa con abundancia. Destierra la envidia. Siente el misterio. Observa al universo, no tiene un tope.',
      'No sufras por cosas que no existen. Usa tu libertad. No rindas cuentas. Usa la alquimia. Sube una montaña. Abraza un árbol. Sé espiritual. No te apures. No te demores. Sigue tu ritmo.',
      'Entiende bien algunas cosas. No hables demasiado. No mires demasiados noticieros. Vuélvete sabio. Mira para adentro. No eches culpas. Realiza un viaje. Juega la vida. Vuélvete artista. Suéltate.'
    ],
    cierre: 'Siente tu alma: ilumínate…',
    firma: ''
  },
  {
    id: 'carta-4-quien-eres',
    titulo: '¿Quién eres?',
    subtitulo: 'Carta 4 · Lo que nada material dice de ti',
    fecha: 'Para releer cuando te compares con otros',
    icono: '🪞',
    tags: 'quien eres identidad amabilidad perdon empatia generosidad tolerancia humildad inclusion bondad inteligencia emocional amor sonrisa sinceridad status redes comparacion',
    parrafos: [
      'Tú no eres tu apellido, tu color de ojos o piel…',
      'No eres el colegio al que tuviste el privilegio de ir, un título universitario, tu “éxito laboral”, ni el cargo que tengas donde trabajas…',
      'No eres el carro que manejas ni la casa donde vives; no eres tus viajes, todo lo que te compras, tus conexiones, tu monto salarial ni tu dinero.',
      'No eres la “imagen o status” que quieres demostrar en las redes sociales. No eres con quien te casaste, todo lo que ostentas ni los “estándares sociales” que sigues.',
      'Nada de eso te hace mejor que nadie, porque nada de eso habla de quién eres tú en verdad.',
      'Tú eres la amabilidad que eres al hablar, el perdón que otorgas cuando te ofenden y la empatía sincera que tengas ante cualquiera que pasa un difícil momento.',
      'Eres la generosidad que eres al compartir lo que no te sobra con otro; eres la tolerancia ante alguien que te impacienta, y la humildad de no hacer sentir a otros menos que tú.',
      'Eres la inclusión al no discriminar a otros por sus gustos, costumbres o posición; eres la gentileza que eres hacia otro que no puede hacer nada por ti; eres la bondad que eres ante un niño, un adulto mayor o una mascota.',
      'Eres la inteligencia emocional que eres, al pensar antes de hablar para no herir a otros.',
      'Eres el aliento que transmites al que está en el suelo sintiéndose deprimido o derrotado; eres el coraje que le contagias para que se sienta valorado; eres el amor desprendido que le brindas a otro sin esperar algo a cambio… sin intenciones.',
      'Eres la sonrisa que le brindas al desconocido que pasa a tu lado caminando, o el abrazo honesto que compartes con otro ser humano. Eres la madurez y consecuencia con la que llevas la vida, en lo que dices y en lo que haces.'
    ],
    cierre: 'Eres la sinceridad cuando miras al otro a los ojos y le dices te amo, no por inercia sino sabiendo todo lo que amar de verdad significa.',
    firma: '☉❤'
  },
  {
    id: 'carta-5-versos-amor',
    titulo: 'Versos al Amor',
    subtitulo: 'Carta 5 · Poemas místicos para el corazón',
    fecha: 'Para leer en voz baja, de noche',
    icono: '🌹',
    tags: 'amor versos poemas mistico rumi rostro belleza gracia alma misericordia compasion gratitud vida angel silencio corazon',
    parrafos: [
      'A lo largo de mi vida he buscado tu rostro, mas hoy, por fin lo he visto.\nHoy he visto el encanto, la belleza, la gracia insondable del rostro que buscaba.\nHoy te encontré, y quienes ayer reían y me despreciaban se entristecen ahora por no haberte buscado como yo.\nEl esplendor de tu belleza me deslumbra y quisiera mirarte con cien ojos.\nMi corazón ardía con pasión buscando perpetuamente la belleza sublime que ahora contemplo.\nLa fragancia de tu aliento se extiende como brisa matinal por la quietud del jardín.\nAlumbras una vida nueva en mi interior y ahora soy tu sol y también tu sombra.\nMi alma grita extasiada, cada fibra de mi ser está prendada de ti.\nTu ardiente resplandor me ha incendiado el corazón, haciendo radiantes a mis ojos la tierra y el cielo.\nMi flecha de amor ha dado en el blanco.\nEstoy en la mansión de la gracia y mi corazón es ahora lugar de oración…',
      'Vienes a nosotros\ndesde otro mundo.\nDesde más allá de las estrellas.\nVacío, trascendente, puro,\nde belleza inimaginable,\ntrayendo contigo\nla esencia del amor.\nTransformas a todo aquel tocado por ti.\nPreocupaciones mundanas,\nproblemas y lamentos\ndesaparecen ante ti,\ntrayendo regocijo\nal gobernante y al gobernado,\nal campesino y al rey.\nNos desconciertas\ncon tu gracia.\nTodas las maldades\nse transforman en bondades.\nEres el Alquimista Maestro.\nEnciendes la llama del amor\nen la tierra y en el cielo,\nen el alma y corazón de cada ser.\nA través de tu amor se funde\nla no-existencia y la existencia.\nLos opuestos se unen. Todo\nlo profano vuelve a ser sagrado…',
      'Actúa como si fueras\nun sol de misericordia\ny compasión.\nActúa como la noche\nque cubre los errores\nde los demás.\nActúa como un río de\ngenerosidad y sacrificio.\nActúa como si estuvieras\nmuerto, cuando estás\nfurioso.\nActúa como la tierra, llena\nde humildad y carente de\negoísmo.\nActúa acorde a tu aspecto,\naparenta acorde a como actúas.',
      'Sé agradecido por tu vida,\npor todos los sencillos detalles de la misma,\ny tu rostro llegará a brillar como un sol,\ny todos los que lo vean comenzarán a\nestar felices y en paz.',
      '💗 El amor me vio y dijo… “He aparecido, limpia tus lágrimas y permanece en silencio”.\nDije: “Oh Amor, estoy asustado, pero no eres tú”.\nEl amor me dijo: “No hay nada que no sea yo, permanece en silencio”.\n🌹',
      'Cierra los ojos…\nSiente amor.\nPermanece allí…'
    ],
    cierre: '',
    firma: '— Versos místicos al Amor'
  },
  {
    id: 'carta-6-nuevo-camino',
    titulo: 'Consejos para el nuevo camino',
    subtitulo: 'Carta 6 · 19 consejos para el viaje',
    fecha: 'Para releer un consejo al día',
    icono: '🧭',
    tags: 'camino consejos karma no reaccionar desapego perdon enamorarse vida consciencia presencia ahora amor meditacion silencio salud destino servicio felicidad alma legado viaje',
    parrafos: [
      '1) ¡No reacciones! Te hagan lo que te hagan, te digan lo que te digan, te adulen o te agredan, solamente deja fluir y no reacciones. Así cortarás el karma que envuelve dicha agresión, y la energía del Universo fluirá para tu perfecto bien.',
      '2) Practica el desapego en todas sus formas: todo es temporal, momentáneo. No puedes controlar la desaparición, muerte o el cambio en personas u objetos. Aceptar este hecho te quita un gran peso de encima.',
      '3) Viaja liviano de equipaje: no te cargues mochilas en la espalda que no te pertenecen, ni cargues con demasiados lastres. Solo acepta llevar lo indispensable en este viaje llamado Vida.',
      '4) Otorga el perdón a todos: no te envenenes el corazón con odios ni rencores. ¡Aprende a domar tus dragones! El que se daña eres siempre tú mismo, y mientras tanto el mundo continúa con su actitud mientras tú te enfermas.',
      '5) Enamórate de la Vida: ama todo lo que el Universo contiene, desde una pequeña oruga hasta un imponente árbol. Sé un apasionado de tu hoy, de tus mañanas, de tus tardes, de tus noches. ¡Ama la Vida!',
      '6) Toma consciencia de tus actos. Cada paso que des, cada momento, siéntelo desde el SER, desde la consciencia, no desde la mente que siempre estará condicionada por los miedos.',
      '7) Vuélvete “Presencia”. Permanece en el Aquí y el Ahora. Enfoca tu vida en el momento presente como si no tuvieras pasado ni memoria, como si no tuvieras futuro. Cada día es único. Recuerda que “morirás”. No lo recuerdes un día, ni una semana, ni una temporada. ¡Recuerda para siempre que partirás! Es inevitable: tu espíritu debe liberarse del cuerpo tarde o temprano, así que no te aferres a nada.',
      '9) Acepta y mentalízate el no saber qué pasará mañana: vuélvete un nuevo SER cada día, renuévate como la vida misma. Quítale el polvo a tus pensamientos viejos y recíclalos. Invéntate de nuevo en cada amanecer. ¿Quién dijo que siempre eres el/la mism@?',
      '10) Que el Amor sea tu lema, tu estandarte y tu guía: que sea el punto de partida y el de llegada. Pero que sea sobre todo el camino y el destino de todo. Vuélvete Amor, evolucionando a niveles cada vez más elevados y abrazando tu alma.',
      '12) Admite tu historia y acepta tus errores: es la única forma de curar tus traumas y bloqueos. Es lo que ES. No malgastes energía tratando de modificar algo que ya ES como es.',
      '13) Medita, reflexiona, cuida tus espacios y tu entorno de soledad y de silencio. ¡Vacíate de ti y llénate del Universo! Aprende a programarte cada noche para tener un día siguiente mágico.',
      '14) Aún estás vivo: aún hay tiempo para disfrutar de este maravilloso mundo e incluso de arreglar aquello que crees que puede ser mejorado; encuentra el camino y la razón por la que estás aquí. No te quejes, no te lamentes, entrégate al Universo dando gracias por tu existencia.',
      '15) No pienses tanto: detén esa mente que escudriña, analiza, revisa y juzga todo. Esos constantes y repetitivos pensamientos son más de lo mismo… ¿acaso no lo ves? Desde allí, desde esa lucha interior de tu mente, nada cambiará. Tus pensamientos solo te hacen ruido y te confunden, pero no resolverán ni crearán nada. Usa tu cerebro para cosas realmente importantes. El resto del tiempo no pienses: “siente”.',
      '16) Elige siempre la salud como primera prioridad: en tus alimentos, en tus pensamientos, en tus emociones, en tus relaciones, en tu mirada, en tus acciones, en tus palabras, en todo elige ser sano. Naciste sano, no elijas enfermarte ni te dejes envenenar.',
      '17) Confía en el Destino; ten fe. No trates de conocer todo el Plan Divino. Conócete a ti mismo y tu misión se revelará ante ti.',
      '18) Emprende el mejor viaje que puedas realizar: es el viaje de regreso a ti mismo/a. Ese viaje que es tu mejor aventura y es también tu conquista y tu legado.',
      '19) Ayuda a los otros a encontrar su camino. No hay mejor regalo, no hay mayor labor. El servicio es Amor.',
      '20) Sé feliz en todas las circunstancias de tu vida: tú no eres las circunstancias. No te identifiques con tus circunstancias. Regresa a la fuente de la felicidad y paz que es tu alma. Allí vive la fuerza y la Luz del Universo en ti.'
    ],
    cierre: '21) Que tu vida sea un legado digno de recordar y transmitir: un milagro, un canto de esperanza, un granito de arena, una voz de Amor.',
    firma: ''
  },
  {
    id: 'carta-7-pergamino-krato',
    titulo: 'Pergamino de Krato',
    subtitulo: 'Carta 7 · El misterio que solo al Amor se revela',
    fecha: 'Para leer en silencio, con el corazón',
    icono: '📜',
    tags: 'krato pergamino amor conciencia corazon dios dar misterio universo sentido existencia dicha espiritu',
    parrafos: [
      'Hay un viejo misterio en el universo: ¿por qué la vida? ¿para qué la creación?',
      'Los intelectos se afanan, buscan y no encuentran, y como no encuentran, inventan teorías.',
      'Pero el antiguo misterio sólo al Amor se revela, a la conciencia iluminada por Amor. Privilegio de simples y sencillos, como niños…',
      'Amor es un ingrediente sutil de la conciencia. Es capaz de mostrar el sentido profundo de la existencia.',
      'Amor es la única “droga” legal. Algunos buscan equivocadamente en el licor y otras drogas lo que produce el Amor.',
      'Amor es lo más necesario en la vida. Los sabios conocen el secreto, y buscan sólo Amor. Los demás lo ignoran, por eso buscan lo externo.',
      '¿Cómo obtener el Amor? Ninguna técnica sirve, porque el Amor no es material. No está sometido a las leyes del pensamiento y la razón. Ellas están sometidas a Él.',
      'Para obtener Amor, primero hay que saber que el Amor no es un sentimiento, sino un Ser. Amor es alguien, un Espíritu viviente y real, que cuando ingresa a nosotros llega la dicha, llega todo.',
      '¿Cómo hacer que venga? Primero hay que creer que existe (porque no se ve, sólo se siente; algunos le llaman Dios). Después hay que buscarlo en su morada íntima: el Corazón.',
      'No hay que llamarlo, porque ya está en nosotros. No hay que pedirle que venga sino… dejarlo salir… liberarlo… entregarlo. No se trata de pedir Amor, sino de dar Amor.'
    ],
    cierre: '¿Cómo se obtiene Amor? Dando Amor… ¡Amando!',
    firma: '— Pergamino de Krato'
  },
  {
    id: 'carta-8-recuerda',
    titulo: 'Recuerda…',
    subtitulo: 'Carta 8 · Lo que tu corazón ya sabe',
    fecha: 'Para leer en voz alta, frente al espejo',
    icono: '🌟',
    tags: 'recuerda atomos estrella energia valor miedo amor presencia familia humanidad corazon paraiso empatia planeta cosmos yo soy tu',
    parrafos: [
      'Recuerda que tus átomos fueron forjados en el taller artesanal ubicado en el corazón de una estrella.',
      'Recuerda que en toda la historia del universo no ha existido nunca, ni va a volver a existir nunca, alguien como tú.',
      'Recuerda que somos energía y esa energía nunca desaparece, solo se transforma.',
      'Recuerda que el miedo surge de la inestabilidad de no manifestar y reconocer nuestro valor.',
      'Recuerda que si liberas con amor tu ser y te expresas, nos regalarás a tod@s el mayor de los regalos que nos puedas hacer: tu más plena presencia.',
      'Recuerda que este sistema se sostiene en mantenernos inconscientes de nuestro valor, sentirnos descartables, desechables, intrascendentes. Si nos vivimos valiosos, no hay inseguridad frente al otro, se disuelve la competencia y el individualismo, incluso sus más tristes caras violentas.',
      'Si nos vivimos valiosos y sabemos que cada átomo del universo es igualmente valioso, podemos comenzar a cultivar el cuidado por todo lo existente, enamorándonos de la belleza de cada singularidad.',
      'Recuerda que mientras más demos y recibamos amor en gestos cotidianos, más reconocemos nuestro valor y el valor de toda la vida.',
      'Recuerda que toda la humanidad es una gran familia. Recuerda que cada ser ha sido amado por alguien, como tú amas a quienes más has amado, o como a ti te aman las personas que más cariño te han entregado en la vida.',
      'Recuerda que cada corazón se alimenta de ese amor para latir.',
      'Recuerda que nos haría bien crear junt@s un paraíso para tod@s l@s seres. Recuerda que en ese equilibrio tod@s celebramos.',
      'Recuerda que empatizando sí podemos crear otra forma de habitar este precioso planeta.',
      'Recuerda que siempre hemos sido y seremos una gran familia viviente con todo lo que existe en el infinito cosmos.'
    ],
    cierre: 'Recuerda: yo soy tú y tú eres yo, y por lo tanto cuando te encuentro me encuentro, y cuando tú me encuentras, te encuentras a ti…',
    firma: ''
  },
  {
    id: 'carta-9-sendero-maestro',
    titulo: 'El sendero del maestro',
    subtitulo: 'Carta 9 · Cómo escuchar al maestro que hay en ti',
    fecha: 'Para leer por partes, una enseñanza al día',
    icono: '🕉️',
    tags: 'maestro sendero eterno absoluto conciencia cosmos estrellas universo retorno dialogo sabiduria verdad amor evolucion libertad interior',
    parrafos: [
      'Es tiempo. Es hora de escuchar la voz del Eterno en este tercer tiempo.',
      'El Ser Cósmico. Esta obra es para todos aquellos que no han despertado y no lo saben. Esta obra es para todos aquellos que son y no lo saben, y quieren liberarse.',
      'Esta obra es para los que son libres y alegran la libertad de sus semejantes.',
      'Algunos pensamientos de esta obra son del pasado, pero parecieran del futuro.',
      'Algunos pensamientos de esta obra son del futuro, pero parecerán del presente.',
      'Algunos los comprendieron en el pasado, otros los comprenderán en el presente, pero todos los comprenderán y practicarán en el futuro.',
      'El sendero del maestro.',
      'Has buscado al maestro por la eternidad. Hoy sabrás que lo llevas en tu interno desde la eternidad. Le construyes templos por todo el infinito. Hoy sabrás que el infinito es tu templo.',
      'El sendero del maestro. El espíritu, tu espíritu.',
      'Para llegar a ser maestro no basta con decir lo que los maestros dijeron: hay que hacer lo que los maestros hicieron.',
      'Quien aún no practica el amor que ha aprendido en los libros del maestro, aún no puede llegar a la escala superior que anhela.',
      'El camino está en la maestría, y la maestría está en el camino.',
      'Los maestros no salvan, enseñan en el camino.',
      'El aprendiz pide sin dar; el maestro da sin pedir.',
      'La diferencia entre el maestro y tú es que él ya comprendió que viene del Absoluto.',
      'Los grandes maestros ya hicieron algo por ti. ¿Cuándo empezarás tú a hacer algo por los demás?',
      'La luz del maestro desciende; el pensamiento del discípulo asciende.',
      'Cada maestro superior nace en determinado tiempo, en determinado universo, planeta y lugar, según el momento histórico cósmico que la humanidad esté viviendo. Cada maestro superior da la enseñanza y la sabiduría que debe dar, acorde al nivel de evolución y comprensión de las conciencias. Cada maestro superior manifiesta determinado tipo de poderes y facultades interiores, acorde al grado de comprensión de quienes lo rodean.',
      'Inspiración estelar. De las estrellas descienden pensamientos a tu mente hoy; de tu mente ascenderán pensamientos a las estrellas.',
      'No es conveniente hacer comparaciones entre los maestros superiores, ya que cada uno participa en distinta modalidad misionera dentro de la única misión universal. No confundas al que envía con el enviado.',
      'En el pasado buscaste al maestro individual en el maestro colectivo. Hoy debes buscar al maestro colectivo en el maestro individual.',
      'El maestro unifica, el maestro da el ejemplo, sirve, ilumina, irradia paz, enseña. El maestro es canal de la Mente Universal. El maestro sabe que lo que enseña no es de él. El maestro libera. Practica las costumbres del maestro, pero más aún sus enseñanzas.',
      'Inspiración estelar.',
      'Penetra en el silencio de tu cámara interna y escucharás la voz del cosmos.',
      'Las estrellas algún día fueron átomos; el átomo algún día será estrella. En el universo todo es cambiante, pero su esencia es inmutable. Para comprender el universo hay que tener una mente universalista.',
      'Desde el espacio sideral llega sabiduría al hombre, sabiduría que lleva oculta en su conciencia. El cosmos no está más allá del Sol: está en tu interior. De tu mente fluyen ríos de pensamientos; mañana fluirán ríos de estrellas. Todo el universo tiene una razón de ser y de estar. El universo exterior es reflejo de tu universo interior.',
      'Eternidad: sucesión de instantes. Tiempo: partícula de eternidad.',
      'Infinito: sucesión de espacios. Espacio: partícula del infinito.',
      'Tiempo, espacio, eternidad; infinito, tiempo eterno, espacio infinito; infinito tiempo y eterno espacio, cada instante.',
      'La mente es tan grande que tiene en su interno al universo, y el universo es tan grande que tiene en su interno a la mente. De las estrellas a tu conciencia, y de tu conciencia a las estrellas, no existe distancia.',
      'El eterno retorno cósmico.',
      'El fruto viene del árbol, pero el árbol es más que el fruto.',
      'El color y el aroma vienen de la flor, pero la flor es más que el aroma y el color.',
      'El canto viene del pájaro, pero el pájaro es más que el canto.',
      'La gota de agua viene de la fuente, pero la fuente es más que la gota de agua.',
      'Las estrellas y los soles emergen del océano universal, pero el universo es más que estrellas y soles.',
      'El universo viene del Absoluto, pero el Absoluto es más que el universo.',
      'El hijo viene del Padre, pero el Padre es más que el hijo.',
      'La esencia del cosmos es la conciencia. La esencia de la conciencia es…',
      'Las estrellas fueron pensamientos; sus pensamientos algún día serán estrellas. Las hormigas te estimulan a ver la tierra; algún día las estrellas te estimularán a ver el cielo.',
      'Del Supremo a lo Supremo: del yo supremo a la conciencia, y de la conciencia al universo; y del universo al Supremo. El eterno retorno.',
      'De la conciencia cósmica a la conciencia individual; de la conciencia individual a la conciencia cósmica.',
      'De lo inmanifestado a lo manifestado, y de lo manifestado a lo inmanifestado.',
      'De lo temporal a lo atemporal, y de lo atemporal a lo temporal.',
      'De lo finito al infinito, de lo infinito a lo finito.',
      'De la energía a la materia, y de la materia a la energía.',
      'De la materia a la antimateria, y de la antimateria a la materia.',
      'Del yo personal al yo impersonal, y del yo impersonal al yo personal.',
      'De la macromente a la micromente, y de la micromente a la macromente.',
      'Del perfecto al perfectible, y del perfectible al perfecto.',
      'De la causa al efecto, y del efecto a la causa.',
      'De la superenergía a la infraenergía, y de la infraenergía a la superenergía.',
      'Del cósmico al yo cósmico, y del yo cósmico al cósmico.',
      'Del todo al yo, y del yo al todo.',
      'De lo abstracto a lo concreto, y de lo concreto a lo abstracto.',
      'Preguntando al Absoluto.',
      'Trata de conocer lo incognoscible, trata de tocar lo intocable, trata de observar lo inobservable, trata de explicar lo inexplicable. ¿Por qué?',
      'Al tratar de conocer lo incognoscible, se abrirán las puertas a la intuición.',
      'Al tratar de tocar lo intocable, se abrirán las puertas a la percepción.',
      'Al tratar de observar lo inobservable, se abrirán las ventanas a la visión.',
      'Al tratar de explicar lo inexplicable, se abrirán las ventanas a la razón.',
      'Si explicas, conoces, observas y tocas, en ti será la liberación.',
      'Del Absoluto a lo relativo, y de lo relativo al Absoluto. Del principio al fin, y del fin al principio. Del Eterno al retorno cósmico.',
      'Diálogo con el Absoluto.',
      '¿Qué eres?\nSoy la voz sin sonido, soy el sonido sin voz. Sin hablar soy escuchado, y sin ser visto soy sentido.',
      '¿En dónde estás?\nEn la energía, en el átomo y la materia, pero soy algo más que materia, átomo y energía.',
      '¿En dónde estás?\nEn las flores, los pájaros y las mariposas, pero soy algo más que mariposa, pájaro y flor.',
      '¿En dónde estás?\nEn el agua, la tierra y el sol, pero soy algo más que el agua, la tierra y el sol.',
      '¿En dónde estás?\nEn los planetas, las estrellas y las galaxias, pero soy algo más que galaxias, estrellas y planetas.',
      '¿En dónde estás?\nEn el universo, pero soy algo más que el universo.',
      '¿En dónde estás?\nEstoy más allá del universo y más acá de tu conciencia.',
      '¿En dónde encuentro tu palabra?\nMi palabra vibra en el bosque, en las montañas, en los ríos y en los lagos.',
      '¿En dónde encuentro tu palabra?\nMi palabra vibra en el mar, en la tierra y en el cielo.',
      '¿En dónde encuentro tu palabra?\nMi palabra vibra en el universo y más allá de él.',
      '¿En dónde encuentro tu palabra?\nEn el futuro, mi palabra será la voz del hombre, y la palabra del hombre será mi voz.',
      'Pensamientos para ser libre.',
      'En el planeta Tierra hay dos tipos de seres: los que vibran en la ignorancia y los que anhelan ser sabios. Si eres sabio, ayuda al que vibra en la ignorancia; y si vibras en la ignorancia, busca y aprende de un sabio.',
      'Sabiduría y verdad.',
      'No te conformes con la espuma del mar: penetra el océano de la sabiduría. Busca la sabiduría y, al encontrarla, practícala. Con tu cuerpo limpio y conectado con tu corazón, tendrás elevación, y al descender, la sabiduría florece.',
      'El día que digas que solo tú tienes la verdad, estarás demostrando que no la tienes. El día que dejes de decir que solo tú tienes la verdad, ese día la tendrás.',
      'El conocimiento material sin fundamento espiritual ata al ser humano a la materia.',
      'El conocimiento material fundamentado en la sabiduría espiritual libera al ser humano del mundo de la materia.',
      'El camino de la luz no es para servirse de los demás: es para servir a los demás.',
      'El día que la ciencia humana diga que tiene la verdad absoluta, dejará de ser ciencia. Todo hombre racional debe reconocer que la ciencia humana es limitada, y eso debe impulsarlo a buscar la verdad en las profundidades del universo y en las profundidades de su conciencia.',
      'Busca la sabiduría y encontrarás amor; busca amor y encontrarás sabiduría, conocimiento y sabiduría. Son dos soles para que la luz del hombre se ilumine y no se ciegue. El conocimiento, con amor, deja de ser solo conocimiento, porque el amor se transmuta en sabiduría.',
      'La oscuridad de tu interior no desaparece al abrir los ojos: hay que buscar una fuente de luz, la luz de la sabiduría, la luz de tu conciencia.',
      'Al buscar la verdad fuera de ti mismo, encuentras conocimiento. Al buscar la verdad dentro de ti mismo, encuentras sabiduría.',
      'El ser adquiere conocimiento investigando el universo exterior; el ser adquiere sabiduría investigando su universo interior.',
      'Conocimiento: verdad finita. Sabiduría: verdad infinita.',
      'Conocimiento: verdad transitoria. Sabiduría: verdad eterna.',
      'Conocimiento y sabiduría, lo externo y lo interno; sabiduría y conocimiento, lo interno y lo externo: componentes de la verdad absoluta.',
      'El pensamiento pregunta a la energía, y la energía pregunta a la subpartícula; la subpartícula pregunta a la partícula, y la partícula pregunta al átomo; el átomo pregunta a la molécula, y la molécula pregunta a la materia; y la materia responde con energía pensante.',
      'El pétalo pregunta a la flor, y la flor responde con aroma y color. La gota de agua pregunta a la nube, y la nube responde con lluvia. El pequeño pregunta al grande, y el grande responde con la luz de su propia sabiduría.'
    ],
    cierre: 'Evolución: camino de retorno a tu punto de origen.',
    firma: ''
  }
  /* ★ PEGA AQUÍ LA CARTA 10, 11, ... ★
  ,{
    id: 'carta-10',
    titulo: 'Título de la carta 10',
    subtitulo: 'Carta 10 · ...',
    fecha: '',
    icono: '💌',
    tags: 'palabras clave para el buscador',
    parrafos: ['Párrafo 1...', 'Párrafo 2...'],
    cierre: 'Frase final destacada.',
    firma: '— El Universo'
  }
  */
];
function cartaPorId(id) {
  for (var i = 0; i < CARTAS_UNIVERSO.length; i++) if (CARTAS_UNIVERSO[i].id === id) return CARTAS_UNIVERSO[i];
  return null;
}
var cartaActual = CARTAS_UNIVERSO.length ? CARTAS_UNIVERSO[0].id : null;

/* ---------- estado UI ---------- */
var CU_TAB = 'Cartas';
function switchTab(name) {
  CU_TAB = name;
  ['Cartas', 'Lectura', 'Diario'].forEach(function (t) {
    var p = $('cu' + t), b = $('tabCu' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ---------- render lista ---------- */
function esFav(id) { return store().favs.indexOf(id) >= 0; }
function toggleFav(id) {
  var e = store();
  var i = e.favs.indexOf(id);
  if (i >= 0) e.favs.splice(i, 1); else e.favs.push(id);
  save(e.favs.length && i < 0 ? 'Guardada en favoritas 💛' : 'Guardado OK');
  renderLista(); renderLectura();
}
function leidasSet() { var s = {}; try { store().lecturas.forEach(function (r) { s[r.id] = 1; }); } catch (e) {} return s; }
function renderLista(filtro) {
  var box = $('cuLista'); if (!box) return;
  var q = (filtro !== undefined ? filtro : (($('cuBuscar') || {}).value || '')).toLowerCase().trim();
  var e = store();
  var leidas = leidasSet();
  var hc = $('cuHeroCount');
  if (hc) hc.textContent = '✨ ' + CARTAS_UNIVERSO.length + ' cartas · 💛 ' + e.favs.length + ' favoritas · 👁️ ' + Object.keys(leidas).length + ' leídas';
  var list = CARTAS_UNIVERSO.slice();
  if (q) {
    list = list.filter(function (c) {
      var hay = (c.titulo + ' ' + c.subtitulo + ' ' + (c.tags || '') + ' ' + c.parrafos.join(' ')).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }
  list.sort(function (a, b) {
    var fa = e.favs.indexOf(a.id) >= 0 ? 0 : 1, fb = e.favs.indexOf(b.id) >= 0 ? 0 : 1;
    return fa - fb;
  });
  if (!list.length) {
    box.innerHTML = '<p class="muted su-3a6477">Sin resultados para “' + esc(q) + '”. Prueba con: amor, alma, pachamama, muerte, sueños…</p>';
    return;
  }
  box.innerHTML = '<div class="cu-grid">' + list.map(function (c) {
    var n = CARTAS_UNIVERSO.indexOf(c) + 1;
    var fav = e.favs.indexOf(c.id) >= 0;
    var led = !!leidas[c.id];
    var primero = c.parrafos.length ? c.parrafos[0] : '';
    if (primero.length > 150) primero = primero.slice(0, 150) + '…';
    return '<article class="cu-card" data-card="' + esc(c.id) + '" role="button" tabindex="0" aria-label="Leer ' + esc(c.titulo) + '">' +
      '<div class="cu-card-top"><span class="cu-ico">' + esc(c.icono || '💌') + '</span>' +
      '<div><b>' + esc(c.titulo) + '</b><br><span class="cu-sub">' + esc(c.subtitulo || '') + '</span></div>' +
      '<span class="cu-num">n.º ' + n + '</span></div>' +
      '<p class="cu-quote">“' + esc(primero) + '”</p>' +
      '<div class="cu-chips"><span class="cu-chip">📄 ' + c.parrafos.length + ' párrafos</span>' +
      (led ? '<span class="cu-chip ok">✓ leída</span>' : '<span class="cu-chip">○ por leer</span>') +
      (fav ? '<span class="cu-chip fav">💛 favorita</span>' : '') + '</div>' +
      '<div class="cu-card-actions">' +
      '<button type="button" class="btn btn-accent su-30e741" data-leer="' + esc(c.id) + '">📖 Leer carta</button>' +
      '<button type="button" class="btn su-30e741" data-fav="' + esc(c.id) + '">' + (fav ? '💛' : '🤍') + '</button>' +
      '</div></article>';
  }).join('') + '</div>';
  function abrir(id) { cartaActual = id; marcarLectura(id); renderLista(); renderLectura(); switchTab('Lectura'); }
  box.querySelectorAll('[data-leer]').forEach(function (b) {
    b.onclick = function (ev) { try { ev.stopPropagation(); } catch (e2) {} abrir(b.getAttribute('data-leer')); };
  });
  box.querySelectorAll('.cu-card').forEach(function (card) {
    card.onclick = function () { abrir(card.getAttribute('data-card')); };
    card.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { try { ev.preventDefault(); } catch (e2) {} abrir(card.getAttribute('data-card')); } };
  });
  box.querySelectorAll('[data-fav]').forEach(function (b) {
    b.onclick = function (ev) { try { ev.stopPropagation(); } catch (e2) {} toggleFav(b.getAttribute('data-fav')); };
  });
}

/* ---------- lectura ---------- */
function marcarLectura(id) {
  try {
    var e = store();
    e.lecturas.push({ id: id, fecha: todayKey(), ts: Date.now() });
    if (e.lecturas.length > 200) e.lecturas = e.lecturas.slice(-200);
    save();
  } catch (err) {}
}
function renderLectura() {
  var box = $('cuLectura'); if (!box) return;
  var c = cartaPorId(cartaActual) || CARTAS_UNIVERSO[0];
  if (!c) { box.innerHTML = '<p class="muted">Aún no hay cartas.</p>'; return; }
  cartaActual = c.id;
  var fav = esFav(c.id);
  var total = CARTAS_UNIVERSO.length;
  var idx = CARTAS_UNIVERSO.indexOf(c);
  var prev = CARTAS_UNIVERSO[(idx - 1 + total) % total];
  var next = CARTAS_UNIVERSO[(idx + 1) % total];
  var paras = c.parrafos.map(function (p, i) { return '<p class="' + (i === 0 ? 'cu-p0' : '') + '">' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  box.innerHTML =
    '<div class="cu-nav">' +
    '<button type="button" class="btn su-30e741" id="cuPrev" title="Carta anterior">◀ ' + esc(prev.icono || '💌') + '</button>' +
    '<span>✨ Carta ' + (idx + 1) + ' de ' + total + ' ✨</span>' +
    '<button type="button" class="btn su-30e741" id="cuNext" title="Carta siguiente">' + esc(next.icono || '💌') + ' ▶</button></div>' +
    '<article class="cu-letter">' +
    '<header><span class="cu-ico xl">' + esc(c.icono || '💌') + '</span>' +
    '<h4>' + esc(c.titulo) + '</h4>' +
    '<p class="cu-sub">' + esc(c.subtitulo || '') + (c.fecha ? ' · ' + esc(c.fecha) : '') + '</p></header>' +
    '<div class="cu-carta">' + paras + '</div>' +
    (c.cierre ? '<div class="cu-cierre">✨ ' + esc(c.cierre) + '</div>' : '') +
    (c.firma ? '<p class="cu-firma">' + esc(c.firma) + '</p>' : '') +
    '<div class="cu-actions">' +
    '<button type="button" class="btn su-30e741" id="cuFavBtn">' + (fav ? '💛 En favoritas' : '🤍 Guardar en favoritas') + '</button>' +
    '<button type="button" class="btn su-30e741" id="cuShareBtn">📤 Compartir</button>' +
    '<button type="button" class="btn su-30e741" id="cuCopyBtn">📋 Copiar texto</button>' +
    '<button type="button" class="btn su-30e741" id="cuLlevarBtn">📝 Llevar a nota del día</button>' +
    '</div></article>';
  var fb = $('cuFavBtn'); if (fb) fb.onclick = function () { toggleFav(c.id); };
  var pv = $('cuPrev');
  if (pv) pv.onclick = function () { cartaActual = prev.id; marcarLectura(prev.id); renderLista(); renderLectura(); };
  var nx = $('cuNext');
  if (nx) nx.onclick = function () { cartaActual = next.id; marcarLectura(next.id); renderLista(); renderLectura(); };
  var sh = $('cuShareBtn');
  if (sh) sh.onclick = function () {
    var txt = c.titulo + '\n\n' + c.parrafos.join('\n\n') + (c.cierre ? '\n\n' + c.cierre : '') + (c.firma ? '\n' + c.firma : '');
    share('💌 ' + c.titulo, txt);
  };
  var cp = $('cuCopyBtn');
  if (cp) cp.onclick = function () {
    var txt = c.titulo + '\n\n' + c.parrafos.join('\n\n') + (c.cierre ? '\n\n' + c.cierre : '') + (c.firma ? '\n' + c.firma : '');
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { save('Carta copiada 📋'); }, function () { alert(txt); });
      else alert(txt);
    } catch (e2) { try { alert(txt); } catch (e3) {} }
  };
  var lv = $('cuLlevarBtn');
  if (lv) lv.onclick = function () {
    try {
      var txt = '💌 ' + c.titulo + ': “' + (c.cierre || c.parrafos[0] || '').slice(0, 140) + '”';
      if (typeof dayCell !== 'undefined' && typeof currentView !== 'undefined') {
        var info = (typeof todayInfo === 'function') ? todayInfo() : null;
        if (info && info.luna && info.dia) {
          var cell = dayCell(info.luna, info.dia);
          cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt;
          save('Llevada a la nota de hoy 📝');
          return;
        }
      }
      var e = store(); var k = todayKey();
      e.diario[k] = (e.diario[k] ? e.diario[k] + ' | ' : '') + txt;
      save('Guardada en tu diario de cartas 📝');
      renderDiario();
    } catch (err2) { alert('No se pudo llevar a la nota'); }
  };
}

/* ---------- diario ---------- */
function renderDiario() {
  var box = $('cuDiarioLista'); if (!box) return;
  var e = store();
  var keys = Object.keys(e.diario || {}).sort().reverse().slice(0, 30);
  var total = e.lecturas.length;
  var racha = 0;
  try {
    var fechas = {}; e.lecturas.forEach(function (r) { fechas[r.fecha] = 1; });
    var d = new Date(); var k0 = todayKey();
    var dd = new Date(d.getTime());
    if (!fechas[k0]) dd = new Date(d.getTime() - 86400000);
    while (true) {
      var kk = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');
      if (fechas[kk]) { racha++; dd = new Date(dd.getTime() - 86400000); } else break;
      if (racha > 365) break;
    }
  } catch (err) {}
  var st = $('cuStats');
  if (st) st.innerHTML = '<div class="cu-pills"><span class="cu-pill">📖 ' + CARTAS_UNIVERSO.length + ' cartas</span>' +
    '<span class="cu-pill">💛 ' + e.favs.length + ' favoritas</span>' +
    '<span class="cu-pill">👁️ ' + total + ' lecturas</span>' +
    '<span class="cu-pill">🔥 racha ' + racha + ' día(s)</span></div>';
  if (!keys.length) {
    box.innerHTML = '<p class="muted su-3a6477">Aún no escribes. Lee una carta y anota qué te movió: 1 frase basta. Todo queda en tu dispositivo.</p>';
    return;
  }
  box.innerHTML = keys.map(function (k) {
    return '<div class="cu-entry"><b>📅 ' + esc(k) + '</b><p>' + esc(e.diario[k]) + '</p></div>';
  }).join('');
}

/* ---------- diálogo ---------- */
function buildDialog() {
  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabCuCartas" class="btn btn-accent su-30e741">💌 Cartas</button>' +
    '<button type="button" id="tabCuLectura" class="btn su-30e741">📖 Lectura</button>' +
    '<button type="button" id="tabCuDiario" class="btn su-30e741">🌱 Mi Diario</button></div>' +

    '<div id="cuCartas">' +
    '<div class="cu-hero"><h4>💌 Cartas del Universo</h4>' +
    '<p>Textos para ver la vida de otra manera. Léelos despacio, uno por vez. Marca 💛 tus favoritos y lleva su frase madre a tu día. <b>Irán llegando más cartas</b>: quedarán guardadas aquí, en orden.</p>' +
    '<span class="cu-total" id="cuHeroCount"></span></div>' +
    '<div class="cu-search"><span>🔍</span><input type="search" id="cuBuscar" placeholder="Buscar: amor, alma, pachamama, muerte…" autocomplete="off" aria-label="Buscar cartas"></div>' +
    '<div id="cuLista"></div>' +
    '</div>' +

    '<div id="cuLectura" class="hidden"></div>' +

    '<div id="cuDiario" class="hidden">' +
    '<div class="cu-hero"><h4>🌱 Mi diario de cartas</h4>' +
    '<p>¿Qué te movió de la carta de hoy? Una frase basta. Todo queda en tu dispositivo.</p>' +
    '<div id="cuStats"></div></div>' +
    '<div class="cu-search" style="flex-direction:column;align-items:stretch;gap:8px"><label style="font-size:.85em;opacity:.85">Hoy esta carta me dice…<textarea id="cuHoyTxt" rows="3" placeholder="1 frase basta: ¿qué te movió de la carta?" style="width:100%;margin-top:6px"></textarea></label>' +
    '<div class="cu-card-actions"><button type="button" class="btn btn-accent su-30e741" id="cuGuardarHoy">💾 Guardar hoy</button>' +
    '<button type="button" class="btn su-30e741" id="cuAzar">🎲 Carta al azar</button></div></div>' +
    '<div id="cuDiarioLista"></div>' +
    '</div>';
  makeDialog('cartasUniversoDialog', '💌 Cartas del Universo', 'El Universo te escribe · lee, siente, deja huella', body);
}

function openCU() {
  try {
    if (!document.getElementById('cuEstilo')) {
      var st = document.createElement('style');
      st.id = 'cuEstilo';
      st.textContent = '.cu-hero{background:radial-gradient(120% 170% at 15% 0%,#2b3a7a 0%,#141b3d 45%,#0b1026 100%);border:1px solid rgba(232,197,106,.45);border-radius:16px;padding:16px 14px;color:#f2ecd9;position:relative;overflow:hidden;margin-bottom:4px}'
        + '.cu-hero:after{content:"\\2726  \\22C6  \\2726  \\22C6  \\2726";position:absolute;right:12px;top:8px;opacity:.5;letter-spacing:4px;font-size:12px}'
        + '.cu-hero h4{margin:0 0 4px;font-size:1.2em;color:#f5d97e}'
        + '.cu-hero p{margin:0;font-size:.9em;opacity:.92;line-height:1.5}'
        + '.cu-hero .cu-total{display:inline-block;margin-top:10px;background:rgba(232,197,106,.15);border:1px solid rgba(232,197,106,.55);border-radius:999px;padding:3px 14px;font-size:.8em;color:#f5d97e}'
        + '.cu-search{display:flex;gap:8px;align-items:center;border:1px solid rgba(232,197,106,.4);border-radius:12px;padding:9px 12px;margin:10px 0;background:rgba(232,197,106,.06)}'
        + '.cu-search input{flex:1;background:transparent;border:0;outline:0;color:inherit;font-size:1em;min-width:0}'
        + '.cu-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}'
        + '.cu-card{background:linear-gradient(160deg,rgba(232,197,106,.12),rgba(122,111,165,.10));border:1px solid rgba(232,197,106,.4);border-radius:14px;padding:12px;cursor:pointer;transition:transform .15s,box-shadow .15s}'
        + '.cu-card:hover,.cu-card:focus{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.35);outline:2px solid rgba(232,197,106,.6)}'
        + '.cu-card-top{display:flex;gap:10px;align-items:center}'
        + '.cu-ico{font-size:26px;background:rgba(232,197,106,.16);border-radius:12px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;flex:none}'
        + '.cu-ico.xl{font-size:34px;width:60px;height:60px;margin:0 auto}'
        + '.cu-card-top b{font-size:1em;line-height:1.3}'
        + '.cu-sub{font-size:.8em;opacity:.75}'
        + '.cu-num{margin-left:auto;font-size:.75em;opacity:.65;background:rgba(255,255,255,.09);border-radius:999px;padding:2px 10px;flex:none}'
        + '.cu-quote{font-style:italic;margin:9px 0 4px;font-size:.92em;line-height:1.55;opacity:.92}'
        + '.cu-chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}'
        + '.cu-chip{font-size:.75em;background:rgba(255,255,255,.09);border-radius:999px;padding:2px 10px;opacity:.92}'
        + '.cu-chip.ok{background:rgba(143,214,148,.18);color:#9fe0a8}'
        + '.cu-chip.fav{background:rgba(232,197,106,.20);color:#f5d97e}'
        + '.cu-card-actions{display:flex;gap:8px;margin-top:8px}'
        + '.cu-card-actions .btn{flex:1}'
        + '.cu-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;font-size:.85em}'
        + '.cu-nav .btn{width:auto;flex:none}'
        + '.cu-nav span{opacity:.8}'
        + '.cu-letter{background:linear-gradient(180deg,#fdf8ec,#f6eed9);color:#3a2f1d;border-radius:16px;padding:18px 16px;box-shadow:0 8px 24px rgba(0,0,0,.35);border:1px solid #e3d3a8}'
        + '.cu-letter header{text-align:center;margin-bottom:4px}'
        + '.cu-letter h4{margin:8px 0 2px;color:#5a3f10;font-size:1.25em}'
        + '.cu-letter .cu-sub{color:#8a6d2f}'
        + '.cu-carta{margin:10px 0}'
        + '.cu-carta p{line-height:1.7;margin:.8em 0}'
        + '.cu-p0::first-letter{font-size:2.4em;float:left;line-height:1;margin:2px 6px 0 0;color:#8a6d2f;font-family:Georgia,serif}'
        + '.cu-cierre{background:linear-gradient(135deg,#f5d97e,#e8a94e);color:#3a2a08;border-radius:12px;padding:10px 14px;margin:12px 0;font-size:1.02em;line-height:1.55;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)}'
        + '.cu-firma{text-align:right;font-style:italic;color:#8a6d2f;margin:4px 0 12px}'
        + '.cu-actions{display:flex;gap:8px;flex-wrap:wrap}'
        + '.cu-actions .btn{flex:1 1 40%;background:#fffdf6;color:#3a2f1d;border:1px solid #d9c48a}'
        + '.cu-pills{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}'
        + '.cu-pill{background:rgba(232,197,106,.14);border:1px solid rgba(232,197,106,.5);border-radius:999px;padding:3px 12px;font-size:.8em}'
        + '.cu-entry{background:linear-gradient(160deg,rgba(232,197,106,.10),transparent);border:1px solid rgba(232,197,106,.32);border-radius:12px;padding:10px 12px;margin:8px 0}'
        + '.cu-entry b{font-size:.85em}'
        + '.cu-entry p{margin:.4em 0 0;line-height:1.55}'
        + '@media(max-width:560px){.cu-grid{grid-template-columns:1fr}}';
      document.head.appendChild(st);
    }
  } catch (e) {}
  try { renderLista(); renderLectura(); renderDiario(); } catch (e) {}
  openDlg('cartasUniversoDialog');
}
try { window.openCartasUniverso = openCU; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  try {
    if (!$('btnCartasUniverso')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnCartasUniverso'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '💌 Cartas del Universo';
        try { btn.setAttribute('data-sub', 'practicas'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'cartas universo carta vida amor alma conciencia libertad sueños pachamama gaia muerte energia proposito huella espiritu leer reflexion texto mensaje');
        var ref = g.querySelector('#btnEspiritu') || g.querySelector('#btnAmi') || g.querySelector('#btnEspiritual');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else if (ref) g.appendChild(btn);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnCartasUniverso') < 0) ALL_BTNS.push('btnCartasUniverso');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnCartasUniverso = ['linaje', 'practicas'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|practicas'] && BTN_ORDER['linaje|practicas'].indexOf('btnCartasUniverso') < 0) {
      var oi = BTN_ORDER['linaje|practicas'].indexOf('btnEspiritu');
      if (oi >= 0) BTN_ORDER['linaje|practicas'].splice(oi + 1, 0, 'btnCartasUniverso');
      else BTN_ORDER['linaje|practicas'].push('btnCartasUniverso');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['todo', 'adulto', 'adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnCartasUniverso = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnCartasUniverso"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnCartasUniverso"> 💌 Cartas del Universo';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnCartasUniverso !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnCartasUniverso = lab.querySelector('input').checked;
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
  try { addKw('btnEspiritu', 'cartas universo carta vida amor alma mensaje'); } catch (e2) {}
  try { addKw('btnMetodos', 'cartas universo carta mensaje'); } catch (e3) {}

  buildDialog();
  renderLista(); renderLectura(); renderDiario();

  var b = $('btnCartasUniverso');
  if (b) b.onclick = function () { openCU(); };
  var t1 = $('tabCuCartas'); if (t1) t1.onclick = function () { switchTab('Cartas'); };
  var t2 = $('tabCuLectura'); if (t2) t2.onclick = function () { switchTab('Lectura'); };
  var t3 = $('tabCuDiario'); if (t3) t3.onclick = function () { switchTab('Diario'); };
  var q = $('cuBuscar'); if (q) q.oninput = function () { renderLista(q.value); };
  var gd = $('cuGuardarHoy');
  if (gd) gd.onclick = function () {
    var t = clean((($('cuHoyTxt') || {}).value || ''), 500);
    if (!t) { alert('Escribe 1 frase: ¿qué te movió de la carta? 💌'); return; }
    var e = store(); var k = todayKey();
    e.diario[k] = (e.diario[k] ? e.diario[k] + ' | ' : '') + t;
    save('Guardado en tu diario 💌');
    if ($('cuHoyTxt')) $('cuHoyTxt').value = '';
    renderDiario();
  };
  var az = $('cuAzar');
  if (az) az.onclick = function () {
    if (!CARTAS_UNIVERSO.length) return;
    var i = Math.floor(Math.random() * CARTAS_UNIVERSO.length);
    cartaActual = CARTAS_UNIVERSO[i].id;
    marcarLectura(cartaActual); renderLectura(); switchTab('Lectura');
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
