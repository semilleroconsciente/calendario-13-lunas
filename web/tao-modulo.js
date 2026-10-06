/* ============================================================
   TAO — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnTao (grupo Linaje > Interior, tras btnTolteca)
   - Diálogo taoDialog con 5 pestañas:
     1) Guía (qué es, Lao Tsé y Zhuangzi, Tao Te Ching,
        yin-yang, wu wei, Te, Pu, 3 tesoros,
        cómo practicar sin maestro, cuidados)
     2) Textos (12 capítulos clave en lenguaje simple +
        buscador + detalle + favorita + "vivir hoy")
     3) Prácticas (9 prácticas del agua + respiración
        guiada 3 min + registro diario del Tao)
     4) Test (20 afirmaciones: ¿yin, yang o wu wei?
        + nivel de forzar/control)
     5) Mi Tao (mi forma, diario, prácticas, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().tao
     { tests:[], miForma:'', practs:[], diario:{}, favs:[] }
   - Puentes: Métodos (ficha Tao ☯️), Respiración (🌬️),
     Disciplina (forzar vs fluir), Gratitud (contento).
   - Educativo, no religión ni terapia. 100% offline.
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
function blank() { return { tests: [], miForma: '', practs: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.tao) u.tao = blank();
    var e = u.tao;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miForma !== 'string') e.miForma = '';
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
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted" style="line-height:1.5">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(name) {
  ['Guia', 'Textos', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var p = $('tao' + t), b = $('tabTao' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 12 capítulos clave del Tao Te Ching (versión simple,
   paráfrasis educativa breve, no traducción literal)
   ============================================================ */
var TAO_TEXTOS = [
  { id: 'cap1', cap: 'Cap. 1 · El Tao sin nombre', ico: '🌫️', tag: 'tao nombre misterio origen innombrable principio',
    texto: '“El Tao que puede nombrarse no es el Tao eterno. Sin nombre es el origen; con nombre, la madre de las cosas.”',
    idea: 'Lo más importante (la vida, el amor, el mar) no cabe en palabras. El Tao es el fondo que sostiene todo y no se deja atrapar por definiciones. Conocerlo es vivirlo, no explicarlo.',
    sirve: 'Cuando quieres controlarlo todo con la cabeza: ponerle nombre, plan y regla a cada cosa, y igual se te escapa.',
    practica: 'Hoy deja 1 cosa sin explicar: mira el mar, un árbol o tu respiración 1 minuto sin ponerle palabras. Solo estar.',
    trampa: 'Volverlo excusa vaga ("todo es Tao, nada importa"). El misterio pide respeto, no flojera.',
    pregunta: '¿Qué estoy tratando de encerrar en palabras que pide ser vivido?' },
  { id: 'cap2', cap: 'Cap. 2 · Nace el yin y el yang', ico: '☯️', tag: 'yin yang opuestos bello feo bien mal dualidad',
    texto: '“Cuando todos conocen lo bello como bello, nace lo feo. El ser y el no-ser se crean mutuamente; lo difícil y lo fácil se completan.”',
    idea: 'Nada existe solo: luz y sombra, ruido y silencio, pena y alegría se necesitan. Pelear contra una mitad (quiero solo lo bueno) te rompe. El sabio abraza el par completo.',
    sirve: 'Días buenos/malos, ánimo que sube y baja, discusiones de quién tiene la razón.',
    practica: 'Ante algo "malo" de hoy pregúntate: ¿qué trae de bueno escondido? Anota el par (ej: lluvia → tierra mojada → siembra).',
    trampa: 'Conformarse con todo ("así es la vida"). Ver el par sirve para elegir mejor, no para aguantar lo dañino.',
    pregunta: '¿Cuál es la otra mitad que no quiero mirar?' },
  { id: 'cap8', cap: 'Cap. 8 · Sé como el agua', ico: '💧', tag: 'agua humildad wu wei blando ceder fluir bondad',
    texto: '“La bondad suprema es como el agua: beneficia a todo sin pelear, habita los lugares bajos que otros desprecian.”',
    idea: 'El agua no discute con la roca: la rodea y con el tiempo la moldea. Ser como el agua es ceder sin rendirse: ir por lo bajo, ser útil, no pelear por el primer puesto.',
    sirve: 'Peleas de orgullo, tacos, filas, jefes o familiares difíciles: donde chocar solo te cansa.',
    practica: 'Hoy en 1 roce: en vez de chocar, rodea (escucha, cede lo chico, sostiene lo esencial). Gana sin pelea.',
    trampa: 'Dejarse pisotear llamándolo "fluir". El agua también horada: cede la forma, no el fondo.',
    pregunta: 'Aquí, ¿choco como roca o rodeo como agua?' },
  { id: 'cap11', cap: 'Cap. 11 · Lo útil es el vacío', ico: '🏺', tag: 'vacio util taza rueda casa silencio descanso',
    texto: '“Treinta radios se unen en el cubo: el vacío del centro hace útil la rueda. El barro hace la vasija; su hueco la hace útil.”',
    idea: 'Lo que sirve no es solo lo lleno: la taza sirve por su hueco, la casa por sus puertas, el día por sus pausas. Deja espacio o nada funciona.',
    sirve: 'Agenda llena, pieza llena de cachureos, cabeza llena de pendientes: mucho tener, poco usar.',
    practica: 'Vacía 1 hueco hoy: un cajón, 30 min sin celu, una hora sin compromiso. Nota cómo respiras después.',
    trampa: 'Vaciar por vaciar y botar lo necesario. El vacío es para usar, no para presumir minimalismo.',
    pregunta: '¿Qué lleno me está quitando lo útil?' },
  { id: 'cap16', cap: 'Cap. 16 · Vuelve a la quietud', ico: '🍂', tag: 'quietud raiz volver calma ansiedad centro',
    texto: '“Vacía tu mente y guarda la quietud. Las cosas nacen y vuelven a su raíz; volver a la raíz es quietud, y es volver al destino.”',
    idea: 'Todo se mueve y vuelve: el día a la noche, la ola a la orilla. Tu raíz es la calma. Cuando te agitas, no necesitas más estímulo: necesitas volver.',
    sirve: 'Ansiedad, cabeza acelerada, noticias que encienden, noches sin dormir.',
    practica: 'Respiración del retorno: 4 tiempos entra, 6 sale, 6 rondas. Siente los pies en tierra al final.',
    trampa: 'Buscar quietud con más ruido (scroll "para relajarse"). La raíz está en menos, no en más.',
    pregunta: '¿Qué me devuelve a mi raíz hoy?' },
  { id: 'cap22', cap: 'Cap. 22 · Cede y vencerás', ico: '🎋', tag: 'ceder doblarse bambu humildad vencerO flexible',
    texto: '“Lo doblado será enderezado; lo vacío será llenado; lo gastado será renovado. Cede y vencerás.”',
    idea: 'El bambú se dobla con el viento sur y no se quiebra; el árbol rígido sí. Ceder a tiempo (pedir perdón, cambiar de plan, reconocer) te devuelve más entero.',
    sirve: 'Orgullo que alarga peleas, planes que ya no funcionan pero no sueltas.',
    practica: 'Dobla 1 rama hoy: reconoce 1 error chico en voz alta y corrige sin drama.',
    trampa: 'Ceder siempre por miedo. Cede lo flexible, sostiene la raíz.',
    pregunta: '¿Dónde me estoy quebrando por no doblarme?' },
  { id: 'cap33', cap: 'Cap. 33 · Conócete y bástate', ico: '🪞', tag: 'conocerse fuerte vencerse contento bastarse poder',
    texto: '“Quien conoce a otros es sabio; quien se conoce a sí mismo es sabio de verdad. Vencer a otros es fuerza; vencerse es poder. Quien se contenta es rico.”',
    idea: 'El verdadero poder no es mandar afuera sino gobernarte dentro: conocer tu medida, frenar tu impulso, contentarte con lo que hay. Rico no es el que más tiene, sino el que menos necesita para estar bien.',
    sirve: 'Comparación (redes, vecinos), compras por impulso, querer ganar discusiones.',
    practica: 'Medida de hoy: anota 1 cosa que ya tienes y te basta. Ante un impulso de comprar/discutir: espera 24 h.',
    trampa: 'Contentarse con poco por miedo a pedir más. Contentarse es elegir, no resignarse.',
    pregunta: '¿Esto lo quiero o solo quiero no quedarme atrás?' },
  { id: 'cap44', cap: 'Cap. 44 · Fama o vida', ico: '⚖️', tag: 'fama fortuna vida salud limite soltar ambicion',
    texto: '“¿Qué quieres más: la fama o tu vida? ¿Qué vale más: tu vida o tus cosas? Quien mucho guarda, mucho pierde.”',
    idea: 'Pregunta filtro del Tao: si para ganar aplauso o plata pierdes salud, sueño y familia, el precio es malo. La vida primero; la fama, si llega, que no te cueste la vida.',
    sirve: 'Trabajo que te come, likes que te manejan, deudas por aparentar.',
    practica: 'Filtro de 3: ante una decisión, ¿cuida mi cuerpo, mi sueño y mi gente? Si falla 2 de 3, achica.',
    trampa: 'Usarlo para no esforzarse nunca. La vida primero incluye esforzarse por lo que amas.',
    pregunta: '¿Esto me da vida o me la cobra?' },
  { id: 'cap48', cap: 'Cap. 48 · Haz menos, logra más', ico: '🪶', tag: 'wu wei no hacer menos soltar estudio ruido',
    texto: '“Quien estudia suma cada día; quien sigue el Tao resta cada día. Resta y resta hasta llegar al no-forzar: sin forzar, nada queda sin hacer.”',
    idea: 'Wu wei no es no hacer nada: es no forzar. Cada día suelta un peso (un control, un trámite de más, una exigencia) y lo esencial se hace solo, sin agotarte.',
    sirve: 'Agotamiento por hacer de más, perfeccionismo, querer arreglar la vida de todos.',
    practica: 'Resta 1: elige 1 cosa que hoy NO harás (revisar 10 veces, contestar al tiro, ordenar perfecto) y haz lo mínimo eficaz.',
    trampa: 'Tirarse a vaguear y culpar al Tao. Wu wei es soltar el forcejeo, no la responsabilidad.',
    pregunta: '¿Qué puedo restar hoy para que lo importante fluya?' },
  { id: 'cap63', cap: 'Cap. 63 · Lo difícil se vuelve fácil', ico: '🐜', tag: 'pequeno dificil facil empezar pasos constancia',
    texto: '“Haz lo difícil cuando aún es fácil; haz lo grande cuando aún es pequeño. El sabio no hace grandes hazañas y por eso logra lo grande.”',
    idea: 'Todo lo grande fue chico: la deuda se paga por cuotas, el bosque por semillas, la pelea se evita con una frase a tiempo. Empieza chico y temprano.',
    sirve: 'Metas que asustan (ordenar la casa, estudiar, pagar, sembrar, entrenar).',
    practica: 'Paso hormiga: 10 minutos hoy en eso difícil (un cajón, una página, una llamada). Sin heroicidad.',
    trampa: 'Quedarse solo en lo chico y nunca dar el paso que sí pide coraje. Lo pequeño abre; lo valiente cruza.',
    pregunta: '¿Cuál es mi paso hormiga de hoy?' },
  { id: 'cap71', cap: 'Cap. 71 · Saber que no sabes', ico: '🎓', tag: 'humildad saber ignorancia aprender curiosidad',
    texto: '“Saber que no se sabe: eso es sabiduría. No saber que no se sabe: eso es enfermedad.”',
    idea: 'El sabio dice "no sé" con alegría: ahí empieza a aprender. El que cree saberlo todo se enferma de certeza y deja de escuchar.',
    sirve: 'Discusiones donde nadie escucha, crianza, pega nueva, consejos no pedidos.',
    practica: 'Di 1 "no sé, explícame" sincero hoy. Escucha completo antes de opinar.',
    trampa: 'Fingir humildad para manipular ("yo no sé nada, pero..."). El no-sé es real o no sirve.',
    pregunta: '¿Qué creo saber que en verdad no he vivido?' },
  { id: 'cap81', cap: 'Cap. 81 · Palabras verdaderas', ico: '🤲', tag: 'verdad palabras sabio discutir dar compartir',
    texto: '“Las palabras verdaderas no son bonitas; las bonitas no son verdaderas. El sabio no discute; el que discute no es sabio. Mientras más da, más tiene.”',
    idea: 'Cierre del libro: habla simple y verdadero, no pelees por tener razón, y comparte: lo dado vuelve. El Tao no promete cielo: promete vivir liviano y útil.',
    sirve: 'Chisme, ganas de ganar peleas con palabras, guardar lo bueno solo para ti.',
    practica: '1 verdad simple dicha con cariño + 1 cosa dada hoy (tiempo, comida, saber, escucha).',
    trampa: 'Decir "verdades" para herir. Verdadero + amable: sin una, la otra cojea.',
    pregunta: '¿Esto que diré es verdadero, necesario y amable?' }
];
function taoTexto(id) { for (var i = 0; i < TAO_TEXTOS.length; i++) if (TAO_TEXTOS[i].id === id) return TAO_TEXTOS[i]; return null; }

var TAO_PRACTICAS = [
  { id: 'respira', n: 'Respiración del agua (4-6)', ico: '🌊', tiempo: '3 min, 1-2 veces al día',
    pasos: '1) Siéntate, hombros bajos, lengua al paladar. 2) Inhala 4 tiempos por la nariz (el aire entra como ola suave). 3) Exhala 6 tiempos (la ola se retira). 4) 6-9 rondas. Manos en vientre: que suba y baje como marea.',
    tip: 'Hay botón con tiempo abajo. Ideal antes de decidir algo o cuando vienes acelerado. Puente: 🌬️ Respiración del calendario.' },
  { id: 'wuwei', n: 'Wu wei del día (no forzar)', ico: '🪶', tiempo: '2 min mañana + revisión noche',
    pasos: 'Mañana: mira tu lista y marca con 🌊 lo que fluye y con 🪨 lo que estás empujando. Elige 1 🪨 y pregúntate: ¿lo suelto, lo achico o lo pido? Noche: ¿dónde forcé? ¿dónde fluí?',
    tip: 'Wu wei = mínimo eficaz. Menos empuje, mismo resultado, más energía al final del día.' },
  { id: 'yinyang', n: 'Pausa yin-yang (equilibrar)', ico: '☯️', tiempo: '3 registros al día',
    pasos: 'Mañana, tarde y noche anota: ¿estoy muy yang (acelerado, ruido, hacer) o muy yin (apagado, cama, evitar)? Ajusta con lo contrario: si yang → 10 min yin (té, sombra, silencio); si yin → 10 min yang (sol, caminar, ordenar 1 cosa).',
    tip: 'El equilibrio no es 50/50 fijo: cambia con la luna, la pega y el clima. Se ajusta, no se decreta.' },
  { id: 'caminata', n: 'Caminata lenta del sabio', ico: '🚶', tiempo: '10 min sin audífonos',
    pasos: 'Camina lento sintiendo planta-tobillo-rodilla + respiración + entorno (viento, pájaros, olor a mar). Lleva 1 pregunta en el pecho (ej: "¿qué suelto?") y no la respondas: deja que los pasos respondan.',
    tip: 'Ideal en Penco: borde costero, plaza o cerro. El viento sur ordena mejor que el scroll.' },
  { id: 'te', n: 'Té consciente (ceremonia pobre)', ico: '🍵', tiempo: '5-10 min',
    pasos: '1) Hierve agua y mírala (fuego + agua = yin-yang). 2) Sirve algo caliente (té, mate, manzanilla). 3) Toma en 3 tiempos: olor, sorbo chico, pausa. 4) Sin celu. Agradece en silencio a quien lo cultivó.',
    tip: 'No necesitas taza china: tu tazón de siempre sirve. Lo sagrado es la atención, no el objeto.' },
  { id: 'nohacer', n: 'Un no-hacer taoísta al día', ico: '🌀', tiempo: '5 min',
    pasos: 'Haz algo cotidiano distinto y más simple: come más lento, deja el celu en otra pieza 1 hora, responde mañana ese mensaje no urgente, toma la ruta más tranquila aunque demore 5 min más.',
    tip: 'El no-hacer afloja el control: le dice al cuerpo "no todo depende de mi apuro".' },
  { id: 'bambu', n: 'Flexibilidad del bambú', ico: '🎋', tiempo: 'ante cada plan que se cae',
    pasos: 'Cuando algo se tuerce: 1) Nombra lo que querías. 2) Dóblate: ¿plan B más chico? 3) Agradece lo que el cambio trae (tiempo, señal, descanso). Anota 1 frase: "quería ___, pasó ___, hice ___".',
    tip: 'Rígido se quiebra, flexible se endereza. Entrena con cosas chicas para estar listo en las grandes.' },
  { id: 'ordenar', n: 'Ordenar sin forzar (un cajón)', ico: '🏺', tiempo: '10 min',
    pasos: 'Elige 1 solo cajón/bolsa/rincón. Saca todo, limpia, deja solo lo útil y bello, lo demás a donar/botar/reciclar. Un lugar vacío = un hueco útil (Cap. 11). No ordenes la casa entera: 1 hueco por día.',
    tip: 'Puente con 🏠 Tareas Hogar: aquí 1 hueco diario; allá el plan grande por habitaciones.' },
  { id: 'noche', n: 'Soltar la noche (volver a la raíz)', ico: '🌙', tiempo: '3 min antes de dormir',
    pasos: 'Acostado: repasa el día como olas que pasan (no te detengas en ninguna). Suelta 1 control de mañana ("mañana veré"). 3 respiraciones 4-6 y duerme. Lo no resuelto queda para la marea de mañana.',
    tip: 'Si la cabeza no para, escribe las 3 vueltas en un papel junto a la cama y suéltalas ahí.' }
];

var TAO_TEST = [
  { c: 'Y', txt: 'Me cuesta parar: sigo haciendo aunque el cuerpo pida descanso.' },
  { c: 'G', txt: 'Decido rápido y actúo: me gusta empujar las cosas hasta lograrlas.' },
  { c: 'W', txt: 'Cuando algo se traba, busco el camino más simple en vez de forzarlo.' },
  { c: 'F', txt: 'Quiero que todo salga como lo planeé y me frustro si cambia.' },
  { c: 'Y', txt: 'Escucho antes de opinar: dejo que el otro termine.' },
  { c: 'G', txt: 'Me cargan las vueltas: voy directo al grano.' },
  { c: 'W', txt: 'Suelto rencores o enganches en días, no en meses.' },
  { c: 'F', txt: 'Reviso el celu a cada rato por si algo se me escapa.' },
  { c: 'Y', txt: 'Disfruto el silencio, la sombra, el té lento, mirar sin hacer.' },
  { c: 'G', txt: 'En un grupo, suelo tomar la palabra y ordenar.' },
  { c: 'W', txt: 'Ante un cambio de planes, me adapto sin gran drama.' },
  { c: 'F', txt: 'Me comparo con otros y siento que voy atrasado.' },
  { c: 'Y', txt: 'Descanso sin culpa cuando lo necesito.' },
  { c: 'G', txt: 'Hago ejercicio, salgo al sol, muevo el cuerpo cada semana.' },
  { c: 'W', txt: 'Hago lo mínimo eficaz: bien hecho, sin exagerar.' },
  { c: 'F', txt: 'Discuto para tener la razón aunque me canse.' },
  { c: 'Y', txt: 'Noto mi respiración y mi cuerpo varias veces al día.' },
  { c: 'G', txt: 'Cumplo lo que digo casi siempre.' },
  { c: 'W', txt: 'Doy sin calcular: tiempo, escucha o ayuda, y me vuelve bien.' },
  { c: 'F', txt: 'Mi cabeza repasa y planea sin descanso, incluso de noche.' }
];
var TAO_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var TAO_FORMAS = {
  Y: { nombre: 'Yin · Luna receptiva', ico: '🌙', desc: 'Tu fuerza es recibir: escuchar, descansar, cuidar, intuir. Como la luna y el valle: contienes sin agotarte. Riesgo: quedarte quieto de más (evitar, apagar, callar lo que sí debes decir).',
       entrena: 'Suma yang suave: sol de mañana + caminata 10 min + 1 paso hormiga (Cap. 63) al día. Descansa sin esconderte.' },
  G: { nombre: 'Yang · Sol activo', ico: '☀️', desc: 'Tu fuerza es actuar: decidir, empujar, ordenar, sostener. Como el sol y la montaña: das forma y avanzas. Riesgo: forzar de más (prisa, control, ganar por ganar) y quemarte.',
       entrena: 'Suma yin diario: respiración 4-6 + té consciente + soltar 1 control (Cap. 48). Actúa sin atropellar.' },
  W: { nombre: 'Agua · Wu wei que fluye', ico: '💧', desc: 'Tu arte es fluir: ceder sin rendirte, simplificar, dar. Como el agua: blanda y persistente, útil en lo bajo. Riesgo: pasar de fluir a diluirse (decir que sí a todo).',
       entrena: 'Sostén la raíz: 1 no-hacer + 1 hueco útil + filtro fama-o-vida (Cap. 44) ante decisiones. Fluye con orilla.' }
};

var TAO_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): quietud. Respiración 4-6 + soltar la noche + leer Cap. 16 y 11. Pregunta: ¿qué hueco necesito?',
  'Lunas 4-6 (Pewu · primavera): brotar sin empujar. Paso hormiga (Cap. 63) + caminata lenta + 1 no-hacer al día. Riega, no tires la semilla.',
  'Lunas 7-9 (Walung · verano): actuar sin poseer. Wu wei del día + filtro fama-o-vida (Cap. 44) + dar cada semana (Cap. 81). Cosecha y comparte.',
  'Lunas 10-13 (Rimu · otoño): soltar como hojas. Flexibilidad del bambú (Cap. 22) + ordenar sin forzar + releer tu diario y elegir 1 forma madre.'
];

/* ============================================================
   DIÁLOGO
   ============================================================ */
function buildDialog() {
  var txGrid = TAO_TEXTOS.map(function (it) {
    return '<button type="button" class="btn tao-tx-card" data-tx="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var testHTML = TAO_TEST.map(function (q, i) {
    var opts = TAO_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="taoQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var practHTML = TAO_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p style="font-size:12px">' + esc(p.pasos) + '</p>' +
      '<p class="muted" style="font-size:12px">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn tao-pract-add" data-p="' + esc(p.n) + '" style="width:auto">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabTaoGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabTaoTextos" class="btn" style="width:auto">📜 12 Textos</button>' +
    '<button type="button" id="tabTaoPract" class="btn" style="width:auto">🛠️ Prácticas</button>' +
    '<button type="button" id="tabTaoTest" class="btn" style="width:auto">📝 Test yin-yang</button>' +
    '<button type="button" id="tabTaoCamino" class="btn" style="width:auto">🌱 Mi Tao</button></div>' +

    '<div id="taoGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>☯️ ¿Qué es el Tao?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Tao (道) significa <b>camino</b>: el curso natural de la vida, como el agua que baja al mar sin que nadie la empuje. Nace en la China antigua con <b>Lao Tsé</b> (el viejo sabio del <i>Tao Te Ching</i>, 81 poemas cortos) y <b>Zhuangzi</b> (cuentos con humor: mariposas, pescadores, carpinteros). No es religión ni club: es un <b>arte de vivir simple</b> —hacer menos y mejor, ceder a tiempo, contentarse.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Idea de una línea: <b>deja de pelear con la corriente</b>. Mira dónde fuerzas, suelta un control, haz lo mínimo eficaz y deja que la vida haga su parte.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🗺️ El mapa en 6 piezas</h4>' +
    '<p class="muted" style="font-size:12px"><b>1) Tao:</b> el fondo que sostiene todo (no se explica, se vive). <b>2) Yin-yang ☯️:</b> todo viene en pares (noche-día, blando-duro); la salud es alternarlos. <b>3) Wu wei 🪶:</b> actuar sin forzar, como remar a favor. <b>4) Te 🤲:</b> la virtud que brota sola cuando sigues el Tao (no la que se presume). <b>5) Pu 🪵:</b> el tronco sin tallar: simple, natural, sin adornos. <b>6) 3 tesoros:</b> compasión, sencillez y no creerse primero.</p></div>' +
    '<div class="menstrual-card"><h4>📚 Los sabios en 1 minuto</h4>' +
    '<p class="muted" style="font-size:12px"><b>Lao Tsé</b> ("viejo maestro", s. VI a.C. según la leyenda) deja 81 capítulos cortos para gobernar y vivir sin agotarse. <b>Zhuangzi</b> (s. IV a.C.) los cuenta con risa: sueña que es mariposa y despierta sin saber si es hombre o mariposa —¿tan serio es tu "yo"? Después vienen el <b>I Ching</b> (libro de cambios, yin-yang en movimiento), la medicina china y el tai chi: el mismo Tao en cuerpo y estaciones. Puerta de entrada: Cap. 1, 8, 11 y 48 de esta sección.</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar sin maestro? (rutina mínima)</summary>' +
    '<p class="muted" style="font-size:12px"><b>Mañana:</b> wu wei del día (marca 🌊/🪨) + 1 paso hormiga. <b>Día:</b> pausa yin-yang x3 + té consciente + 1 no-hacer. <b>Noche:</b> soltar la noche 3 min + 1 línea en tu diario. <b>Por luna:</b> 1 texto madre + 1 cajón vaciado + releer diario. 15 min diarios bastan; lo simple, repetido, cambia la corriente.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Esto es <b>sabiduría educativa</b>, no religión ni terapia. ✅ Sin rituales raros ni maestros que cobren caro u obediencia: desconfía de gurúes exprés del "Tao". ✅ El Tao no reemplaza médico, terapeuta ni red: con pena, ansiedad fuerte o crisis, pide apoyo (CESFAM, *4141 en Chile 24 h). Si un ejercicio te desborda, detente, camina, toma agua y conversa.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Tao × 13 lunas (Penco)</h4><div id="taoLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puentes dentro de la app: 🌬️ <b>Respiración</b> (técnicas) · 🎯 <b>Disciplina</b> (forzar vs fluir) · 📿 <b>Métodos</b> (ficha Tao) · 📓 <b>Gratitud</b> (contentarse).</p></div>' +
    '</div>' +

    '<div id="taoTextos" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="taoQ" placeholder="ej: agua, vacío, fama, difícil, nombre, ceder..." maxlength="40"></label></div>' +
    '<div id="taoTxGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + txGrid + '</div>' +
    '<div id="taoDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca un texto para ver su ficha completa 👆</p></div></div>' +

    '<div id="taoPract" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌊 Respiración del agua — 3 minutos</h4>' +
    '<p class="muted" style="font-size:12px">Inhala 4, exhala 6, como olas. El botón te marca el tiempo; al terminar anota tu wu wei del día.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" id="taoRespiraBtn" class="btn btn-accent" style="width:auto">▶ Respirar ahora (3 min)</button>' +
    '<span id="taoRespiraMsg" class="muted" style="font-size:12px"></span></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Hoy fuerzo en… <input type="text" id="taoFuerzoHoy" placeholder="ej: quiero que mi hijo coma todo ya" maxlength="140"></label></div>' +
    '<div class="conv-row"><label>Lo suelto / achico así… <input type="text" id="taoSueltoHoy" placeholder="ej: le sirvo menos y sin pelear" maxlength="140"></label>' +
    '<label>Mi mínimo eficaz… <input type="text" id="taoMinimoHoy" placeholder="ej: caminar 10 min + 1 cajón" maxlength="100"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button type="button" id="taoPractSave" class="btn btn-accent" style="width:auto">💾 Guardar día Tao</button>' +
    '<button type="button" id="taoGoRespira" class="btn" style="width:auto">🌬️ Ir a Respiración</button></div></div>' +
    practHTML + '</div>' +

    '<div id="taoTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test: ¿fluyes o fuerzas? (20 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo eres casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide tu <b>Yin 🌙 · Yang ☀️ · Wu wei 💧</b> + tu <b>nivel de forzar/control 🪨</b> (F). <b>No es diagnóstico</b>: es un espejo para equilibrarte.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="taoTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="taoTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="taoProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="taoTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="taoResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="taoCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi forma</h4>' +
    '<div class="conv-row"><label>Mi forma dominante <select id="taoMiForma"><option value="">— sin definir —</option><option value="Y">🌙 Yin · Luna receptiva</option><option value="G">☀️ Yang · Sol activo</option><option value="W">💧 Agua · Wu wei</option></select></label></div>' +
    '<div id="taoMiFormaBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario del Tao</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="taoDiaFecha"></label></div>' +
    '<label>Hoy en mi Tao… (forcé / solté / mínimo eficaz) <input type="text" id="taoDiaTxt" placeholder="ej: forcé la siesta; solté el control; caminé 10 min" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="taoDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="taoDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌊 Mis días Tao (racha de fluir)</h4><div id="taoPractsBox"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="taoHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="taoStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="taoShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="taoToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="taoClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('taoDialog', '☯️ Tao',
    'Yin-yang, wu wei y simpleza para la vida común: suelta un control, haz lo mínimo eficaz y vuelve a tu raíz. En Penco, en tu casa, hoy. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('taoLunasBox'); if (!box) return;
  box.innerHTML = TAO_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalle(id) {
  var box = $('taoDetalle'); if (!box) return;
  var t = taoTexto(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.ico + ' ' + esc(t.cap) + '</h4>' +
    '<blockquote class="dlg-quote" style="font-size:12px">' + esc(t.texto) + '</blockquote>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(t.idea) + '</p>' +
    '<p style="font-size:12px">🧰 <b>¿Cuándo sirve?</b> ' + esc(t.sirve) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica de hoy</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta que despierta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<p class="muted" style="font-size:12px">⚠️ Trampa típica: ' + esc(t.trampa) + '</p>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn" id="taoFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="taoHoyBtn" style="width:auto">✓ Vivir este hoy</button></div>';
  var fb = $('taoFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('taoHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '📜 Hoy vivo: ' + t.cap + ' — ' + t.pregunta;
    save('Texto llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function filterTextos() {
  var q = (($('taoQ') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#taoTxGrid .tao-tx-card');
  cards.forEach(function (card) {
    var t = taoTexto(card.dataset.tx);
    if (!t) return;
    var hay = ((t.cap + ' ' + t.tag + ' ' + t.idea + ' ' + t.texto).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function calcTest() {
  var sc = { Y: 0, G: 0, W: 0, F: 0 };
  var contestadas = 0;
  for (var i = 0; i < TAO_TEST.length; i++) {
    var sel = document.querySelector('input[name="taoQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[TAO_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('taoProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + TAO_TEST.length + ' respondidas' + (r.contestadas < TAO_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ listo para calcular');
}
function showResultado(sc) {
  var box = $('taoResultado'); if (!box) return;
  var arr = [{ k: 'Y', p: sc.Y }, { k: 'G', p: sc.G }, { k: 'W', p: sc.W }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max(arr[0].p, 1);
  var dom = arr[0].k;
  var forza = sc.F;
  var forzaTxt = forza <= 5 ? 'Liviano: fuerzas poco. Sostén con 1 wu wei diario.' : forza <= 9 ? 'Medio: control frecuente. Suelta 1 control + respira 4-6 cada día.' : 'Pesado: mucho empuje y control. Parte por 1 resta (Cap. 48) + 1 caminata, sin exigirte todo.';
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted" style="font-size:11px">Máximo por forma: 15 (5 preguntas × 3). Forzar (F): máximo 15 — mientras más alto, más empuje.</p>' +
    arr.map(function (a) {
      var c = TAO_FORMAS[a.k];
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px"><b>' + c.ico + ' ' + esc(c.nombre) + '</b></span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>' + TAO_FORMAS[dom].ico + ' Tu forma fuerte: ' + esc(TAO_FORMAS[dom].nombre) + '</h4>' +
    '<p>' + esc(TAO_FORMAS[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(TAO_FORMAS[dom].entrena) + '</p>' +
    '<p class="muted">🪨 Nivel de forzar: <b>' + forza + '/15</b> — ' + esc(forzaTxt) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="taoSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="taoSetForma" style="width:auto">✓ Mi forma: ' + esc(TAO_FORMAS[dom].nombre) + '</button>' +
    '<button type="button" class="btn" id="taoReadTx" style="width:auto">📖 Leer texto que me sirve</button></div>';
  var sv = $('taoSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), Y: sc.Y, G: sc.G, W: sc.W, F: sc.F, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('taoSetForma');
  if (st) st.onclick = function () {
    var d = store(); d.miForma = dom; save('Tu forma guardada ✓');
    syncMiForma(); renderMiFormaBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('taoReadTx');
  if (ri) ri.onclick = function () {
    var map = { Y: 'cap16', G: 'cap48', W: 'cap8' };
    if (forza >= 10) map[dom] = 'cap48';
    switchTab('Textos'); renderDetalle(map[dom] || 'cap8');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiForma() {
  var sel = $('taoMiForma'); if (!sel) return;
  sel.value = store().miForma || '';
}
function renderMiFormaBox() {
  var box = $('taoMiFormaBox'); if (!box) return;
  var k = store().miForma || '';
  if (!k || !TAO_FORMAS[k]) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o elígela arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = TAO_FORMAS[k];
  box.innerHTML = '<div class="chip" style="display:block;white-space:normal;line-height:1.5"><b>' + c.ico + ' ' + esc(c.nombre) + '</b><br>' +
    '<span class="muted">' + esc(c.desc) + '<br><b>Entrena:</b> ' + esc(c.entrena) + '</span></div>';
}
function rachaPracts() {
  var set = {};
  (store().practs || []).forEach(function (r) { set[r.fecha] = true; });
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
function renderPracts() {
  var box = $('taoPractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted" style="font-size:11px">🌊 Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) Tao · fuerzo → suelto → mínimo eficaz.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b><br>' +
        (r.fuerzo ? '🪨 ' + esc(r.fuerzo) + '<br>' : '') + (r.suelto ? '🪶 ' + esc(r.suelto) + '<br>' : '') + (r.minimo ? '🌱 ' + esc(r.minimo) : '') + '</span>' +
        '<button type="button" class="btn btn-icon tao-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin días aún. Guarda tu primer día Tao arriba ☯️.</p>');
  box.querySelectorAll('.tao-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('taoDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 3 líneas bastan: forcé + solté + mínimo eficaz.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon tao-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.tao-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('taoHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · 🌙' + r.Y + ' ☀️' + r.G + ' 💧' + r.W + ' · fuerte <b>' + esc(r.dom || '') + '</b> · forzar ' + esc(String(r.F)) + '/15</span>' +
      '<button type="button" class="btn btn-icon tao-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.tao-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('taoStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miForma ? TAO_FORMAS[e.miForma].nombre : 'sin forma';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) Tao · ' + c;
}

/* Respiración timer 3 min */
var taoRespTimer = null;
function runRespira() {
  var msg = $('taoRespiraMsg'), btn = $('taoRespiraBtn');
  if (!msg) return;
  if (taoRespTimer) { clearInterval(taoRespTimer); taoRespTimer = null; if (btn) btn.textContent = '▶ Respirar ahora (3 min)'; msg.textContent = ''; return; }
  var seg = 180;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Ola que entra… 3:00 (inhala 4, exhala 6)';
  taoRespTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(taoRespTimer); taoRespTimer = null;
      if (btn) btn.textContent = '▶ Respirar ahora (3 min)';
      msg.textContent = '✓ Listo. ¿Qué se soltó con la marea? Anota tu día Tao abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    if (seg === 90) msg.textContent = 'Suelta los hombros… 1:30';
    else if (seg === 30) msg.textContent = 'Últimas olas… 0:30';
    else msg.textContent = 'Inhala 4 · exhala 6… ' + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

/* Puente hacia Métodos: botón "Abrir mi Tao" en su ficha */
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
      if (low.indexOf('tao') < 0 && low.indexOf('wu wei') < 0 && low.indexOf('lao') < 0) return;
      if ($('taoOpenFromMetodos')) { clearInterval(iv); return; }
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var t = (b.textContent || '').toLowerCase();
        if (t.indexOf('tao') >= 0 || t.indexOf('wu wei') >= 0 || t.indexOf('lao') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.id = 'taoOpenFromMetodos';
          open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '☯️ Abrir mi Tao';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openTao(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
    }, 500);
  } catch (e) {}
}

function openTao() {
  try {
    if ($('taoDiaFecha') && !$('taoDiaFecha').value) $('taoDiaFecha').value = todayKey();
    syncMiForma(); renderMiFormaBox(); renderDiario(); renderHist(); renderPracts(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('taoDialog');
}
try { window.openTao = openTao; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > Interior (tras Tolteca si existe) */
  try {
    if (!$('btnTao')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnTao'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '☯️ Tao';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'tao lao tse laozi zhuangzi chuang tzu tao te ching i ching yin yang wu wei te pu tres tesoros agua bambu fluir soltar control respiracion 4-6 te consciente caminata lenta no hacer fama contento impermanencia cambio equilibrio');
        var ref = g.querySelector('#btnTolteca') || g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnTao');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'interior'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnTao') < 0) ALL_BTNS.push('btnTao');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnTao = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnTao') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnTolteca');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnTao');
      else BTN_ORDER['linaje|interior'].push('btnTao');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnTao = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnTao"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnTao"> ☯️ Tao';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnTao !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnTao = lab.querySelector('input').checked;
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
  try { addKw('btnMetodos', 'tao wu wei lao zhuang yin yang'); } catch (e2) {}
  try { addKw('btnBreath', 'tao respiracion agua 4-6'); } catch (e3) {}
  try { addKw('btnDiscipline', 'tao wu wei forzar fluir minimo eficaz'); } catch (e4) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiForma();
  renderMiFormaBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderStats();

  var b = $('btnTao');
  if (b) b.onclick = function () { openTao(); };

  ['Guia', 'Textos', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabTao' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('taoQ'); if (q) q.oninput = filterTextos;
  document.querySelectorAll('#taoTxGrid .tao-tx-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.tx); };
  });
  document.querySelectorAll('.tao-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('taoRespiraBtn'); if (sb) sb.onclick = runRespira;
  var ps = $('taoPractSave');
  if (ps) ps.onclick = function () {
    var fz = clean((($('taoFuerzoHoy') || {}).value || ''), 140);
    var su = clean((($('taoSueltoHoy') || {}).value || ''), 140);
    var mi = clean((($('taoMinimoHoy') || {}).value || ''), 100);
    if (!fz && !su && !mi) { alert('Escribe al menos dónde fuerzas, qué sueltas o tu mínimo eficaz de hoy ☯️'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), fuerzo: fz, suelto: su, minimo: mi });
    var txt = '☯️ Día Tao';
    if (fz) txt += ' · 🪨 ' + fz;
    if (su) txt += ' · 🪶 ' + su;
    if (mi) txt += ' · 🌱 ' + mi;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día Tao guardado ✓');
    if ($('taoFuerzoHoy')) $('taoFuerzoHoy').value = '';
    if ($('taoSueltoHoy')) $('taoSueltoHoy').value = '';
    if ($('taoMinimoHoy')) $('taoMinimoHoy').value = '';
    renderPracts(); renderDiario(); renderStats();
  };
  var gr = $('taoGoRespira');
  if (gr) gr.onclick = function () { try { var r = $('btnBreath'); if (r) r.click(); else alert('Abre 🌬️ Respiración desde Mi Día'); } catch (e) {} };

  var tc = $('taoTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < TAO_TEST.length) { alert('Te faltan ' + (TAO_TEST.length - r.contestadas) + ' por responder para un espejo fiel ☯️'); }
    showResultado(r.sc);
  };
  var tr = $('taoTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < TAO_TEST.length; i++) {
      document.querySelectorAll('input[name="taoQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('taoResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#taoTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('taoMiForma');
  if (ma) ma.onchange = function () { var e = store(); e.miForma = ma.value || ''; save('Tu forma guardada ✓'); renderMiFormaBox(); renderStats(); };
  var da = $('taoDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('taoDiaFecha') || {}).value || todayKey();
    var t = clean((($('taoDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu Tao de hoy ☯️'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('taoDiaTxt')) $('taoDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('taoShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miForma ? TAO_FORMAS[e.miForma].nombre : 'forma por definir';
    share('☯️ Mi Tao', 'Fluir sin forzar · ' + c + '\n🌊 Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días Tao · ' + nd + ' días de diario · ' + e.tests.length + ' test(s).\n' + TAO_LUNAS[0]);
  };
  var tn = $('taoToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miForma ? TAO_FORMAS[e.miForma].nombre : 'fluir sin forzar';
      var txt2 = '☯️ Tao (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy suelto 1 control + mínimo eficaz');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('taoClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu Tao (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.tao = blank();
    } catch (e) {}
    syncMiForma(); renderMiFormaBox(); renderDiario(); renderHist(); renderPracts(); renderStats();
    save('Tao borrado');
  };

  puenteMetodos();
  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
