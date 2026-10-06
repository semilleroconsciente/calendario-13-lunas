/* ============================================================
   ESTOICISMO — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnEstoicismo (grupo Linaje > Interior, tras btnTao)
   - Diálogo estoicismoDialog con 5 pestañas:
     1) Guía (qué es, Zenón/Séneca/Epicteto/Marco Aurelio,
        dicotomía del control, 4 virtudes, memento mori,
        amor fati, cómo practicar sin maestro, cuidados)
     2) Textos (12 principios clave en lenguaje simple +
        buscador + detalle + favorita + "vivir hoy")
     3) Prácticas (9 prácticas estoicas + pausa STOP 2 min
        + registro del día estoico)
     4) Test (20 afirmaciones: sabiduría, justicia, coraje,
        templanza + nivel de queja/descontrol)
     5) Mi Camino (mi virtud, diario, días, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().estoicismo
     { tests:[], miVirtud:'', practs:[], diario:{}, favs:[] }
   - Puentes: Métodos (ficha Estoicismo), Disciplina,
     Gratitud (suficiente), Respiración (pausa).
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
function blank() { return { tests: [], miVirtud: '', practs: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.estoicismo) u.estoicismo = blank();
    var e = u.estoicismo;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miVirtud !== 'string') e.miVirtud = '';
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
    var p = $('est' + t), b = $('tabEst' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 12 principios estoicos (paráfrasis educativa breve)
   ============================================================ */
var EST_TEXTOS = [
  { id: 'control', cap: '1 · Lo que depende de mí', ico: '⚖️', tag: 'control dicotomia epicteto depende elegir opinion impulso',
    texto: '“Algunas cosas dependen de nosotros y otras no. Si confundes unas con otras, te esclavizas.” — Epicteto',
    idea: 'La base de todo: tus juicios, decisiones y actos dependen de ti; el clima, la gente, el pasado y el resultado final, no del todo. Sufrimos cuando queremos mandar en lo segundo. Ocúpate de lo primero y suelta lo segundo.',
    sirve: 'Preocupación, rabia por el taco, la pega o la familia, querer que otros cambien ya.',
    practica: 'Dibuja 2 columnas: “depende de mí / no depende”. Escribe el problema de hoy en ambas. Actúa solo en la primera.',
    trampa: 'Usarlo para lavarse las manos (“no depende de mí” y no hago nada). Lo que sí depende, se hace.',
    pregunta: '¿Qué parte sí está en mis manos hoy?' },
  { id: 'obstaculo', cap: '2 · El obstáculo es el camino', ico: '🪨', tag: 'obstaculo marco aurelio camino dificultad adversidad',
    texto: '“Lo que estorba a la acción, la adelanta. El obstáculo se vuelve camino.” — Marco Aurelio',
    idea: 'El taco te enseña paciencia, la deuda te enseña orden, la enfermedad te enseña medida. No preguntes “¿por qué a mí?” sino “¿para qué me entrena esto?”.',
    sirve: 'Planes caídos, enfermedad, cesantía, hijos difíciles, trámites eternos.',
    practica: 'Ante el atajo de hoy escribe: “esto me entrena en ___”. Da el paso chico que el obstáculo pide.',
    trampa: 'Romantizar el sufrimiento y aguantar daño evitable. Entrenar no es auto-dañarse.',
    pregunta: '¿Qué virtud me está pidiendo este obstáculo?' },
  { id: 'virtud', cap: '3 · Solo la virtud es bien', ico: '🏛️', tag: 'virtud bien sabiduria justicia coraje templanza indiferentes',
    texto: '“La riqueza, la fama y la salud son indiferentes: solo el buen uso que les das es bueno.” — Zenón / Séneca',
    idea: 'Plata, likes y cuerpo van y vienen: no te hacen bueno ni malo. Lo único que siempre suma es actuar con sabiduría, justicia, coraje y templanza, tengas mucho o poco.',
    sirve: 'Comparación en redes, envidia, miedo a perder, decisiones por pura plata o aplauso.',
    practica: 'Filtro de 4 ante una decisión: ¿es sabia, justa, valiente y medida? Si falla en 2, achica o cambia.',
    trampa: 'Despreciar lo material y descuidar la vida real. Los indiferentes se usan bien, no se botan.',
    pregunta: '¿Esto me hace más virtuoso o solo más aparentador?' },
  { id: 'premeditatio', cap: '4 · Piensa el mal de antemano', ico: '🌧️', tag: 'premeditatio malorum anticipar prepararse perder ensayo',
    texto: '“Ensaya en tu mente lo que puede salir mal, para que cuando llegue no te quiebre.” — Séneca',
    idea: 'No es ser negativo: es vacunarte. Imagina 2 minutos que se cae el plan, se corta la luz o te dicen que no. ¿Qué harías? Cuando pasa de verdad, ya tienes plan B y calma.',
    sirve: 'Ansiedad por viajes, pruebas, entrevistas, invierno, cuentas que suben.',
    practica: 'Hoy: elige 1 miedo chico y escribe plan B en 3 líneas. “Si pasa ___, haré ___”.',
    trampa: 'Quedarse pegado imaginando tragedias todo el día. Se ensaya 2 minutos y se suelta.',
    pregunta: '¿Cuál es mi plan B sereno para hoy?' },
  { id: 'memento', cap: '5 · Recuerda que mueres', ico: '⏳', tag: 'memento mori muerte tiempo aprovechar ultimo dia',
    texto: '“Podrías dejar la vida ahora mismo. Deja que eso determine lo que haces y piensas.” — Marco Aurelio',
    idea: 'Recordar la muerte ordena la vida: el pelambre da lo mismo, el abrazo no. No es morbo: es recordar que el tiempo es lo único que no vuelve.',
    sirve: 'Postergar visitas, pelear por tonteras, perder horas en scroll, no decir lo importante.',
    practica: 'Pregunta de la mañana: “si este día fuera semilla de mi último mes, ¿qué no postergaría?”. Haz eso primero.',
    trampa: 'Angustiarse o correr a hacer locuras. Memento mori calma y enfoca, no acelera.',
    pregunta: '¿Qué haría hoy si el tiempo fuera oro?' },
  { id: 'amorfati', cap: '6 · Ama tu destino', ico: '🌊', tag: 'amor fati destino aceptar querer agradecer marco aurelio',
    texto: '“No pidas que las cosas pasen como quieres: quiere las cosas como pasan y te irá bien.” — Epicteto',
    idea: 'Amor fati: no solo aguantar lo que toca, sino quererlo como material. La lluvia que arruinó el paseo riega tu huerta. El “no” que dolió te ahorró una deuda.',
    sirve: 'Rabia con lo que ya pasó, compararte con “lo que pudo ser”, duelo chico y grande.',
    practica: 'Ante 1 hecho que no te gusta escribe: “pasó ___, lo uso para ___”. Agradece 1 cosa que trae.',
    trampa: 'Aguantar abusos o injusticias “amándolos”. Amar el destino no quita poner límites y pedir ayuda.',
    pregunta: '¿Cómo uso esto a mi favor en vez de pelearlo?' },
  { id: 'tiempo', cap: '7 · No es corta la vida', ico: '⌛', tag: 'tiempo seneca vida desperdiciar atencion presente brevitas',
    texto: '“No tenemos poco tiempo: perdemos mucho. La vida es larga si sabes usarla.” — Séneca',
    idea: 'Nos quejamos de falta de tiempo y lo regalamos a noticias, peleas y pantallas. El estoico cuida su atención como cuida su plata: cada hora tiene dueño.',
    sirve: '“No alcanzo a nada”, días que se van sin hacer lo importante, cansancio de pantalla.',
    practica: 'Hoy: 1 hora sin celu para lo importante (hijo, huerta, estudio, descanso). Anota en qué se te fue ayer.',
    trampa: 'Llenar cada minuto de producción y no descansar. Usar bien incluye dormir y mirar el mar.',
    pregunta: '¿A quién le estoy regalando mis horas?' },
  { id: 'ira', cap: '8 · La ira es breve locura', ico: '🌋', tag: 'ira seneca enojo pausa respirar ofensa',
    texto: '“La ira es una locura breve. Ningún castigo es mayor que dejar de ser quien quieres ser por un momento.” — Séneca',
    idea: 'El enojo miente: agranda la ofensa y achica tu razón. Séneca pide pausa: no respondas en caliente, examina el hecho sin el cuento (“me miró feo” vs “quizás venía cansado”).',
    sirve: 'Discusiones de pareja, hijos, vecinos, choferes, mensajes que encienden.',
    practica: 'STOP 2 min: Sal (aire), Toma 4-6 (respira), Observa el hecho pelado, Procede con 1 frase justa.',
    trampa: 'Tragarse la rabia y explotar después. La pausa es para responder justo, no para acumular.',
    pregunta: '¿Qué pasó de verdad, sin mi cuento?' },
  { id: 'vista', cap: '9 · La vista desde arriba', ico: '🦅', tag: 'vista arriba perspectiva cosmopolis universo pequeno',
    texto: '“Mira desde lo alto: ciudades, mares y tus problemas se achican. Eres parte de un todo.” — Marco Aurelio',
    idea: 'Sube tu mirada: tu cuadra, Penco, Chile, el planeta girando. Tu drama de hoy es una ola chica en un mar grande. Eso calma el ego y abre compasión.',
    sirve: 'Vergüenza, dramas, creerse el centro, miedo al qué dirán.',
    practica: 'Cierra 1 min e imagina subir: pieza → cuadra → bahía → planeta. Vuelve y decide desde ahí.',
    trampa: 'Achicarse hasta desaparecer (“no importo nada”). Eres pequeño y valioso: parte del todo, no nada.',
    pregunta: 'Visto desde arriba, ¿qué tan grande es esto?' },
  { id: 'deber', cap: '10 · Cumple tu deber', ico: '🤲', tag: 'deber justicia cosmopolis vecino rol marco aurelio hacer',
    texto: '“Haz lo que la naturaleza del conjunto pide: actúa por el bien común, que es tu bien.” — Marco Aurelio',
    idea: 'Eres hijo, vecina, trabajador, penqueño: cada rol trae un deber chico y claro. La felicidad estoica no es sentirse bien: es haber hecho lo que tocaba, bien hecho.',
    sirve: 'Flojera moral, “que lo haga otro”, tirar basura, no votar, no ayudar en la minga.',
    practica: 'Hoy 1 deber chico y visible: saludar, limpiar tu vereda, devolver, acompañar 10 min.',
    trampa: 'Cargarte con todos los deberes y quemarte. Tu deber primero es gobernarte; después, servir.',
    pregunta: '¿Qué me toca hoy en mi rol y lo haré bien?' },
  { id: 'suficiente', cap: '11 · Conténtate con poco', ico: '🍞', tag: 'suficiente contento pobreza riqueza deseo gratitud musonio',
    texto: '“No es pobre el que tiene poco, sino el que quiere más. Rico es quien se basta.” — Séneca / Epicteto',
    idea: 'Entrena el “me basta”: comer simple un día, vestir lo que hay, agradecer techo y agua. Quien necesita poco es libre: nadie lo compra ni lo asusta con quitarle.',
    sirve: 'Deudas por aparentar, compras por impulso, envidia, nunca sentirse suficiente.',
    practica: 'Hoy: 1 comida simple agradecida + lista de 3 cosas que ya tienes y te bastan.',
    trampa: 'Miseria fingida o avaricia. Contentarse es elegir libre, no cagarse de hambre pudiendo comer.',
    pregunta: '¿Esto lo necesito o solo quiero no quedarme atrás?' },
  { id: 'examen', cap: '12 · Examina tu día', ico: '🪞', tag: 'examen noche diario seneca repaso conciencia vespertino',
    texto: '“Cada noche pregúntate: ¿qué error curé hoy? ¿a qué vicio me enfrenté? ¿en qué soy mejor?” — Séneca',
    idea: 'El diario vespertino: 3 minutos para repasar sin látigo. Qué hice bien, dónde fallé, qué corrijo mañana. Así la virtud se entrena como músculo, día a día.',
    sirve: 'Repetir errores, culparse sin cambiar, días que pasan sin aprender.',
    practica: 'Noche: 3 líneas — hice bien / fallé en / mañana corrijo con ___. Sin insultarte.',
    trampa: 'Convertirlo en tribunal cruel. Se examina el acto, no se condena la persona.',
    pregunta: '¿En qué soy 1% mejor que ayer?' }
];
function estTexto(id) { for (var i = 0; i < EST_TEXTOS.length; i++) if (EST_TEXTOS[i].id === id) return EST_TEXTOS[i]; return null; }

var EST_PRACTICAS = [
  { id: 'columnas', n: 'Dicotomía en 2 columnas', ico: '⚖️', tiempo: '5 min mañana',
    pasos: 'Toma el problema de hoy y divídelo: columna 1 “depende de mí” (mis actos, palabras, esfuerzo, actitud); columna 2 “no depende” (clima, otros, pasado, resultado). Tacha la 2 y escribe 1 acción para la 1.',
    tip: 'Si te pillas rumiando la columna 2, vuelve a la 1 con 1 paso físico (llamar, ordenar, caminar).' },
  { id: 'premed', n: 'Premeditación del mal (2 min)', ico: '🌧️', tiempo: '2 min antes de salir',
    pasos: 'Imagina 1 cosa que podría fallar hoy (taco, lluvia, un “no”). Escribe plan B en 1 línea: “si pasa ___, haré ___”. Guarda el papel y suelta el miedo.',
    tip: 'Vacuna, no veneno: 2 minutos bastan. Si te angustia, vuelve a lo controlable.' },
  { id: 'incomodidad', n: 'Incomodidad voluntaria', ico: '❄️', tiempo: '1 acto al día o semana',
    pasos: 'Elige 1 chica: ducha tibia-fría 30 seg, caminar en vez de micro 10 min, 1 comida simple, dormir sin tele. Anota: “pude con ___”. Entrenas que el malestar no te manda.',
    tip: 'Chica y segura. Con enfermedad, embarazo o crisis, elige solo mental (esperar, agradecer) y cuídate.' },
  { id: 'vista', n: 'Vista desde arriba (3 min)', ico: '🦅', tiempo: '3 min cuando el ego se infla',
    pasos: 'Siéntate, respira 4-6 x3. Sube: pieza → cuadra → bahía de Penco → Chile → planeta. Mira tu problema desde ahí 30 seg. Baja y decide 1 frase justa.',
    tip: 'Ideal antes de responder mensajes que encienden o tras una vergüenza.' },
  { id: 'stop', n: 'STOP Séneca ante la ira', ico: '🛑', tiempo: '2 min en caliente',
    pasos: 'S: Sal del lugar (aire, agua fría en manos). T: Toma 4 respiraciones 4-6. O: Observa el hecho pelado (sin cuento). P: Procede con 1 frase justa o silencio digno.',
    tip: 'Hay botón con tiempo abajo. Si gritaste, repara después: pide perdón concreto y corrige.' },
  { id: 'deber', n: 'Un deber justo al día', ico: '🤲', tiempo: '10 min',
    pasos: 'Elige tu rol de hoy (padre, vecina, trabajador) y haz 1 deber visible: limpiar vereda, devolver algo, acompañar, cumplir palabra. Márcalo con ✓ y siente el bien hecho.',
    tip: 'Puente con Comunidad: tu deber penqueño sostiene la bahía entera.' },
  { id: 'suficiente', n: 'Entreno del suficiente', ico: '🍞', tiempo: '1 vez al día',
    pasos: 'Come 1 cosa simple agradeciendo en voz baja. Anota 3 que ya tienes (techo, agua, manos). Ante un impulso de comprar: espera 24 h y revisa el filtro de la virtud.',
    tip: 'Puente con 📓 Gratitud y 💰 Finanzas: contentarse también ahorra plata.' },
  { id: 'memento', n: 'Memento mori de la mañana', ico: '⏳', tiempo: '1 min al despertar',
    pasos: 'Recuerda: “este día no vuelve”. Elige 1 cosa no postergable (llamar, abrazar, avanzar) y hazla antes del mediodía. Lo urgente chico puede esperar.',
    tip: 'Si te angustia, achica: “hoy basta con ___ bien hecho”.' },
  { id: 'examen', n: 'Examen de la noche (3 líneas)', ico: '🪞', tiempo: '3 min antes de dormir',
    pasos: 'Acostado o en libreta: 1) hice bien ___. 2) fallé en ___. 3) mañana corrijo con ___. Sin insultos. Cierra con 1 agradecimiento y suelta el día.',
    tip: 'Si la cabeza no para, escribe las vueltas en papel junto a la cama.' }
];

var EST_TEST = [
  { c: 'S', txt: 'Ante un problema separo qué puedo controlar y qué no.' },
  { c: 'C', txt: 'Hago lo correcto aunque me dé lata o vergüenza.' },
  { c: 'F', txt: 'Me quejo en voz alta varias veces al día.' },
  { c: 'T', txt: 'Freno a tiempo con comida, celu o compras.' },
  { c: 'J', txt: 'Trato con justicia incluso a quien no me cae bien.' },
  { c: 'S', txt: 'Antes de opinar en caliente, espero y respiro.' },
  { c: 'C', txt: 'Digo una verdad necesaria aunque sea incómoda.' },
  { c: 'F', txt: 'Culpo a otros o a la suerte cuando algo sale mal.' },
  { c: 'T', txt: 'Cuido mis horarios de sueño y descanso.' },
  { c: 'J', txt: 'Ayudo en algo concreto cada semana sin que me lo pidan.' },
  { c: 'S', txt: 'Cuando me equivoco lo reconozco y corrijo sin drama.' },
  { c: 'C', txt: 'Sostengo una tarea difícil al menos 10 minutos sin arrancar.' },
  { c: 'F', txt: 'Repaso el futuro con angustia, incluso de noche.' },
  { c: 'T', txt: 'Si me enojo, me aparto y vuelvo calmado en vez de explotar.' },
  { c: 'J', txt: 'No hablo mal de ausentes ni me sumo al pelambre.' },
  { c: 'S', txt: 'Busco qué aprender de cada revés en vez de solo sufrirlo.' },
  { c: 'C', txt: 'Tomo una incomodidad chica voluntaria cada semana (frío, caminata, madrugar).' },
  { c: 'F', txt: 'Quiero que todo salga como lo planeé y me frustro si cambia.' },
  { c: 'T', txt: 'Vivo con lo suficiente: agradezco antes de pedir más.' },
  { c: 'J', txt: 'Cumplo mi palabra casi siempre.' }
];
var EST_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var EST_VIRTUDES = {
  S: { nombre: 'Sabiduría · ver claro', ico: '🦉', desc: 'Tu fuerza es el juicio: distingues controlable de incontrolable, pausas antes de actuar, aprendes del error. Riesgo: quedarte en pura cabeza y no actuar.',
       entrena: 'Suma coraje: 1 acción chica diaria aunque sea imperfecta + examen de noche de 3 líneas.' },
  J: { nombre: 'Justicia · hacer el bien', ico: '🤲', desc: 'Tu fuerza es el prójimo: tratas justo, cumples, ayudas, no pelambras. Como el cosmopolita estoico: tu bien es el bien común. Riesgo: cargarte con todos y quemarte.',
       entrena: 'Suma templanza: 1 deber al día, no diez. Primero gobernarte, después servir.' },
  C: { nombre: 'Coraje · actuar pese al miedo', ico: '🦁', desc: 'Tu fuerza es el pecho: dices la verdad, sostienes lo difícil, tomas incomodidad voluntaria. Riesgo: confundir coraje con dureza y no pedir ayuda.',
       entrena: 'Suma sabiduría: pausa STOP + pide consejo 1 vez por semana antes del acto valiente.' },
  T: { nombre: 'Templanza · medida justa', ico: '🍵', desc: 'Tu fuerza es la medida: frenas impulsos, cuidas sueño y bolsillo, no explotas. Riesgo: volverte rígido o apagar la alegría.',
       entrena: 'Suma amor fati: 1 gozo simple al día sin culpa (sol, pan, risa) + agradece 3 cosas.' }
};

var EST_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): adentro. Dicotomía en 2 columnas + examen de noche + leer principios 1, 4 y 12. Pregunta: ¿qué sí controlo con este frío?',
  'Lunas 4-6 (Pewu · primavera): brotar con deber. Un deber justo al día + paso hormiga ante el obstáculo (principio 2). Siembra sin exigir cosecha.',
  'Lunas 7-9 (Walung · verano): servir sin poseer. Vista desde arriba + suficiente + 1 ayuda semanal (principios 9, 11 y 10). Comparte la cosecha.',
  'Lunas 10-13 (Rimu · otoño): soltar como hojas. Memento mori + amor fati + releer tu diario y elegir 1 virtud madre (principios 5 y 6).'
];

/* ============================================================
   DIÁLOGO
   ============================================================ */
function buildDialog() {
  var txGrid = EST_TEXTOS.map(function (it) {
    return '<button type="button" class="btn est-tx-card" data-tx="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.cap) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var testHTML = EST_TEST.map(function (q, i) {
    var opts = EST_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="estQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var practHTML = EST_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p style="font-size:12px">' + esc(p.pasos) + '</p>' +
      '<p class="muted" style="font-size:12px">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn est-pract-add" data-p="' + esc(p.n) + '" style="width:auto">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabEstGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabEstTextos" class="btn" style="width:auto">📜 12 Principios</button>' +
    '<button type="button" id="tabEstPract" class="btn" style="width:auto">🛠️ Prácticas</button>' +
    '<button type="button" id="tabEstTest" class="btn" style="width:auto">📝 Test virtudes</button>' +
    '<button type="button" id="tabEstCamino" class="btn" style="width:auto">🌱 Mi Camino</button></div>' +

    '<div id="estGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🏛️ ¿Qué es el estoicismo?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Filosofía nacida en Atenas con <b>Zenón de Citio</b> (el Pórtico, hace 2300 años) y llevada a Roma por <b>Séneca</b> (cartas y ensayos), <b>Epicteto</b> (esclavo liberto: el <i>Manual</i>) y <b>Marco Aurelio</b> (emperador que escribía de noche sus <i>Meditaciones</i> en campaña). No es aguantar callado ni poner cara dura: es un <b>entrenamiento del carácter</b> —gobernarte para servir mejor.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Idea de una línea: <b>haz bien lo que depende de ti y suelta el resto</b>. Si hoy separas tu 2 columnas, frenas 1 impulso y cumples 1 deber, ya viviste estoico.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🗺️ El mapa en 6 piezas</h4>' +
    '<p class="muted" style="font-size:12px"><b>1) Dicotomía:</b> hay cosas que dependen de ti (juicio, acto, esfuerzo) y otras que no (clima, otros, resultado). <b>2) 4 virtudes:</b> sabiduría 🦉, justicia 🤲, coraje 🦁, templanza 🍵: el único bien seguro. <b>3) Indiferentes:</b> plata, fama y salud se usan bien, no se adoran. <b>4) Obstáculo-camino 🪨:</b> cada traba entrena una virtud. <b>5) Memento mori ⏳ + amor fati 🌊:</b> el tiempo es oro y lo que pasa se usa. <b>6) Cosmópolis 🌍:</b> eres parte de Penco, de Chile, del mundo: tu bien es el bien común.</p></div>' +
    '<div class="menstrual-card"><h4>📚 Los sabios en 1 minuto</h4>' +
    '<p class="muted" style="font-size:12px"><b>Zenón</b> funda el Pórtico: vivir según la naturaleza y la razón. <b>Séneca</b> escribe a Lucilio sobre tiempo, ira y pobreza (lee <i>Cartas</i> 1, 18 y <i>Sobre la ira</i>). <b>Epicteto</b> resume: controla tu juicio y serás libre (<i>Manual</i> 1-5). <b>Marco Aurelio</b> se lo repite a sí mismo en la guerra (<i>Meditaciones</i> II, IV, VIII). Puerta de entrada: principios 1, 8 y 12 de esta sección.</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar sin maestro? (rutina mínima)</summary>' +
    '<p class="muted" style="font-size:12px"><b>Mañana (2 min):</b> memento mori + 2 columnas del día + 1 deber justo. <b>Día:</b> STOP ante la ira + vista desde arriba si el ego se infla + 1 incomodidad chica. <b>Noche (3 min):</b> examen de 3 líneas. <b>Por luna:</b> 1 principio madre + releer diario. 10 min diarios bastan; lo simple, repetido, forja carácter.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Esto es <b>filosofía educativa</b>, no religión ni terapia. ✅ El estoicismo no pide aguantar violencia, acoso ni explotación “con templanza”: pide poner límites, pedir ayuda y denunciar. ✅ No reemplaza médico ni terapeuta: con pena, ansiedad fuerte o crisis, pide apoyo (CESFAM, *4141 en Chile 24 h). Si un ejercicio te desborda, detente, camina, toma agua y conversa.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Estoicismo × 13 lunas (Penco)</h4><div id="estLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puentes dentro de la app: 🎯 <b>Disciplina</b> (hacer lo difícil) · 📓 <b>Gratitud</b> (suficiente) · 🌬️ <b>Respiración</b> (pausa STOP) · 📿 <b>Métodos</b> (ficha Estoicismo).</p></div>' +
    '</div>' +

    '<div id="estTextos" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="estQ" placeholder="ej: control, ira, muerte, tiempo, deber, obstáculo..." maxlength="40"></label></div>' +
    '<div id="estTxGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + txGrid + '</div>' +
    '<div id="estDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca un principio para ver su ficha completa 👆</p></div></div>' +

    '<div id="estPract" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🛑 STOP Séneca — 2 minutos</h4>' +
    '<p class="muted" style="font-size:12px">Cuando algo te enciende: Sal, Toma aire 4-6, Observa el hecho pelado, Procede justo. El botón te marca el tiempo.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" id="estStopBtn" class="btn btn-accent" style="width:auto">▶ Pausa STOP ahora (2 min)</button>' +
    '<span id="estStopMsg" class="muted" style="font-size:12px"></span></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Hoy depende de mí… <input type="text" id="estDependeHoy" placeholder="ej: llamar al CESFAM, ordenar mi pieza" maxlength="140"></label></div>' +
    '<div class="conv-row"><label>Hoy suelto (no depende)… <input type="text" id="estSueltoHoy" placeholder="ej: que mi jefe ande de malas" maxlength="140"></label>' +
    '<label>Mi deber justo de hoy… <input type="text" id="estDeberHoy" placeholder="ej: acompañar 10 min a mi mamá" maxlength="100"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button type="button" id="estPractSave" class="btn btn-accent" style="width:auto">💾 Guardar día estoico</button>' +
    '<button type="button" id="estGoRespira" class="btn" style="width:auto">🌬️ Ir a Respiración</button></div></div>' +
    practHTML + '</div>' +

    '<div id="estTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test: tus 4 virtudes (20 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo eres casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide <b>Sabiduría 🦉 · Justicia 🤲 · Coraje 🦁 · Templanza 🍵</b> + tu <b>nivel de queja/descontrol 🌪️</b> (F). <b>No es diagnóstico</b>: es un espejo para entrenar.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="estTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="estTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="estProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="estTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="estResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="estCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi virtud a entrenar</h4>' +
    '<div class="conv-row"><label>Mi virtud <select id="estMiVirtud"><option value="">— sin definir —</option><option value="S">🦉 Sabiduría · ver claro</option><option value="J">🤲 Justicia · hacer el bien</option><option value="C">🦁 Coraje · actuar pese al miedo</option><option value="T">🍵 Templanza · medida justa</option></select></label></div>' +
    '<div id="estMiVirtudBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario estoico</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="estDiaFecha"></label></div>' +
    '<label>Hoy en mi camino… (hice bien / fallé / corrijo) <input type="text" id="estDiaTxt" placeholder="ej: hice bien esperar; fallé en gritar; corrijo con STOP" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="estDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="estDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🏛️ Mis días estoicos (racha de carácter)</h4><div id="estPractsBox"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="estHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="estStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="estShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="estToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="estClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('estoicismoDialog', '🏛️ Estoicismo — carácter para la vida real',
    'Dicotomía del control, 4 virtudes y examen diario para Penco: haz lo que depende de ti, suelta el resto y cumple tu deber. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('estLunasBox'); if (!box) return;
  box.innerHTML = EST_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalle(id) {
  var box = $('estDetalle'); if (!box) return;
  var t = estTexto(id); if (!t) return;
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
    '<button type="button" class="btn" id="estFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="estHoyBtn" style="width:auto">✓ Vivir este hoy</button></div>';
  var fb = $('estFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('estHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '📜 Hoy vivo: ' + t.cap + ' — ' + t.pregunta;
    save('Principio llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function filterTextos() {
  var q = (($('estQ') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#estTxGrid .est-tx-card');
  cards.forEach(function (card) {
    var t = estTexto(card.dataset.tx);
    if (!t) return;
    var hay = ((t.cap + ' ' + t.tag + ' ' + t.idea + ' ' + t.texto).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function calcTest() {
  var sc = { S: 0, J: 0, C: 0, T: 0, F: 0 };
  var contestadas = 0;
  for (var i = 0; i < EST_TEST.length; i++) {
    var sel = document.querySelector('input[name="estQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[EST_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('estProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + EST_TEST.length + ' respondidas' + (r.contestadas < EST_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ listo para calcular');
}
function showResultado(sc) {
  var box = $('estResultado'); if (!box) return;
  var arr = [{ k: 'S', p: sc.S }, { k: 'J', p: sc.J }, { k: 'C', p: sc.C }, { k: 'T', p: sc.T }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = 12;
  var dom = arr[0].k;
  var queja = sc.F;
  var quejaTxt = queja <= 3 ? 'Sereno: te quejas poco. Sostén con examen de noche.' : queja <= 6 ? 'Medio: queja frecuente. Entrena 2 columnas + STOP cada día.' : 'Alto: mucha queja y control. Parte por 1 columna + 1 STOP + 1 deber, sin exigirte todo.';
  box.classList.remove('hidden');
  var icoMap = { S: '🦉', J: '🤲', C: '🦁', T: '🍵' };
  var nomMap = { S: 'Sabiduría', J: 'Justicia', C: 'Coraje', T: 'Templanza' };
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted" style="font-size:11px">Máximo por virtud: 12 (4 preguntas × 3). Queja/descontrol (F): máximo 12 — mientras más alto, más sufres por lo incontrolable.</p>' +
    arr.map(function (a) {
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px"><b>' + icoMap[a.k] + ' ' + esc(nomMap[a.k]) + '</b></span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>' + EST_VIRTUDES[dom].ico + ' Tu virtud fuerte: ' + esc(EST_VIRTUDES[dom].nombre) + '</h4>' +
    '<p>' + esc(EST_VIRTUDES[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(EST_VIRTUDES[dom].entrena) + '</p>' +
    '<p class="muted">🌪️ Nivel de queja/descontrol: <b>' + queja + '/12</b> — ' + esc(quejaTxt) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="estSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="estSetVirtud" style="width:auto">✓ Mi virtud: ' + esc(EST_VIRTUDES[dom].nombre) + '</button>' +
    '<button type="button" class="btn" id="estReadTx" style="width:auto">📖 Leer principio que me sirve</button></div>';
  var sv = $('estSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), S: sc.S, J: sc.J, C: sc.C, T: sc.T, F: sc.F, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('estSetVirtud');
  if (st) st.onclick = function () {
    var d = store(); d.miVirtud = dom; save('Tu virtud guardada ✓');
    syncMiVirtud(); renderMiVirtudBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('estReadTx');
  if (ri) ri.onclick = function () {
    var map = { S: 'control', J: 'deber', C: 'obstaculo', T: 'ira' };
    if (queja >= 7) map[dom] = 'control';
    switchTab('Textos'); renderDetalle(map[dom] || 'control');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiVirtud() {
  var sel = $('estMiVirtud'); if (!sel) return;
  sel.value = store().miVirtud || '';
}
function renderMiVirtudBox() {
  var box = $('estMiVirtudBox'); if (!box) return;
  var k = store().miVirtud || '';
  if (!k || !EST_VIRTUDES[k]) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o elígela arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = EST_VIRTUDES[k];
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
  var box = $('estPractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted" style="font-size:11px">🏛️ Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) estoicos · depende → suelto → deber.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b><br>' +
        (r.depende ? '⚖️ ' + esc(r.depende) + '<br>' : '') + (r.suelto ? '🌊 ' + esc(r.suelto) + '<br>' : '') + (r.deber ? '🤲 ' + esc(r.deber) : '') + '</span>' +
        '<button type="button" class="btn btn-icon est-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin días aún. Guarda tu primer día estoico arriba 🏛️.</p>');
  box.querySelectorAll('.est-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('estDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 3 líneas bastan: hice bien + fallé + corrijo.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon est-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.est-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('estHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · 🦉' + r.S + ' 🤲' + r.J + ' 🦁' + r.C + ' 🍵' + r.T + ' · fuerte <b>' + esc(r.dom || '') + '</b> · queja ' + esc(String(r.F)) + '/12</span>' +
      '<button type="button" class="btn btn-icon est-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.est-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('estStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miVirtud ? EST_VIRTUDES[e.miVirtud].nombre : 'sin virtud';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) estoicos · ' + c;
}

/* STOP timer 2 min */
var estStopTimer = null;
function runStop() {
  var msg = $('estStopMsg'), btn = $('estStopBtn');
  if (!msg) return;
  if (estStopTimer) { clearInterval(estStopTimer); estStopTimer = null; if (btn) btn.textContent = '▶ Pausa STOP ahora (2 min)'; msg.textContent = ''; return; }
  var seg = 120;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'S · Sal: aire y agua fría… 2:00 (no respondas aún)';
  estStopTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(estStopTimer); estStopTimer = null;
      if (btn) btn.textContent = '▶ Pausa STOP ahora (2 min)';
      msg.textContent = '✓ Listo. Observa el hecho pelado y procede con 1 frase justa. Anota tu día abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    var fase = seg > 60 ? 'T · Toma aire 4-6… ' : (seg > 30 ? 'O · Observa el hecho sin cuento… ' : 'P · Procede justo en… ');
    msg.textContent = fase + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

/* Puente hacia Métodos: botón "Abrir mi Estoicismo" en su ficha */
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
      if (low.indexOf('estoic') < 0 && low.indexOf('seneca') < 0 && low.indexOf('marco aurelio') < 0 && low.indexOf('epicteto') < 0) return;
      if ($('estOpenFromMetodos')) { clearInterval(iv); return; }
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var t = (b.textContent || '').toLowerCase();
        if (t.indexOf('estoic') >= 0 || t.indexOf('seneca') >= 0 || t.indexOf('marco aurelio') >= 0 || t.indexOf('epicteto') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.id = 'estOpenFromMetodos';
          open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '🏛️ Abrir mi Estoicismo';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openEst(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
    }, 500);
  } catch (e) {}
}

function openEst() {
  try {
    if ($('estDiaFecha') && !$('estDiaFecha').value) $('estDiaFecha').value = todayKey();
    syncMiVirtud(); renderMiVirtudBox(); renderDiario(); renderHist(); renderPracts(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('estoicismoDialog');
}
try { window.openEstoicismo = openEst; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > Interior (tras Tao si existe) */
  try {
    if (!$('btnEstoicismo')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnEstoicismo'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🏛️ Estoicismo · Carácter firme';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'estoicismo estoico seneca epicteto marco aurelio zenon meditaciones manual cartas virtud sabiduria justicia coraje templanza control dicotomia obstaculo memento mori amor fati premeditacion examen ira tiempo deber suficiente calma caracter firmeza serenidad');
        var ref = g.querySelector('#btnTao') || g.querySelector('#btnTolteca') || g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnEstoicismo');
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnEstoicismo') < 0) ALL_BTNS.push('btnEstoicismo');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnEstoicismo = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnEstoicismo') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnTao');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnEstoicismo');
      else BTN_ORDER['linaje|interior'].push('btnEstoicismo');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnEstoicismo = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnEstoicismo"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnEstoicismo"> 🏛️ Estoicismo · Carácter firme';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnEstoicismo !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnEstoicismo = lab.querySelector('input').checked;
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
  try { addKw('btnMetodos', 'estoicismo estoico seneca epicteto marco aurelio virtud'); } catch (e2) {}
  try { addKw('btnBreath', 'estoicismo pausa stop seneca ira calma'); } catch (e3) {}
  try { addKw('btnDiscipline', 'estoicismo virtud deber coraje templanza disciplina'); } catch (e4) {}
  try { addKw('btnPsico', 'estoicismo seneca marco aurelio epicteto virtud control'); } catch (e5) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiVirtud();
  renderMiVirtudBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderStats();

  var b = $('btnEstoicismo');
  if (b) b.onclick = function () { openEst(); };

  ['Guia', 'Textos', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabEst' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('estQ'); if (q) q.oninput = filterTextos;
  document.querySelectorAll('#estTxGrid .est-tx-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.tx); };
  });
  document.querySelectorAll('.est-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('estStopBtn'); if (sb) sb.onclick = runStop;
  var ps = $('estPractSave');
  if (ps) ps.onclick = function () {
    var dp = clean((($('estDependeHoy') || {}).value || ''), 140);
    var su = clean((($('estSueltoHoy') || {}).value || ''), 140);
    var db = clean((($('estDeberHoy') || {}).value || ''), 100);
    if (!dp && !su && !db) { alert('Escribe al menos qué depende de ti, qué sueltas o tu deber de hoy 🏛️'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), depende: dp, suelto: su, deber: db });
    var txt = '🏛️ Día estoico';
    if (dp) txt += ' · ⚖️ ' + dp;
    if (su) txt += ' · 🌊 ' + su;
    if (db) txt += ' · 🤲 ' + db;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día estoico guardado ✓');
    if ($('estDependeHoy')) $('estDependeHoy').value = '';
    if ($('estSueltoHoy')) $('estSueltoHoy').value = '';
    if ($('estDeberHoy')) $('estDeberHoy').value = '';
    renderPracts(); renderDiario(); renderStats();
  };
  var gr = $('estGoRespira');
  if (gr) gr.onclick = function () { try { var r = $('btnBreath'); if (r) r.click(); else alert('Abre 🌬️ Respiración desde Mi Día'); } catch (e) {} };

  var tc = $('estTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < EST_TEST.length) { alert('Te faltan ' + (EST_TEST.length - r.contestadas) + ' por responder para un espejo fiel 🏛️'); }
    showResultado(r.sc);
  };
  var tr = $('estTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < EST_TEST.length; i++) {
      document.querySelectorAll('input[name="estQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('estResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#estTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('estMiVirtud');
  if (ma) ma.onchange = function () { var e = store(); e.miVirtud = ma.value || ''; save('Tu virtud guardada ✓'); renderMiVirtudBox(); renderStats(); };
  var da = $('estDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('estDiaFecha') || {}).value || todayKey();
    var t = clean((($('estDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu camino de hoy 🏛️'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('estDiaTxt')) $('estDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('estShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miVirtud ? EST_VIRTUDES[e.miVirtud].nombre : 'virtud por definir';
    share('🏛️ Mi Estoicismo', 'Carácter para la vida real · ' + c + '\n🏛️ Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días estoicos · ' + nd + ' días de diario · ' + e.tests.length + ' test(s).\n' + EST_LUNAS[0]);
  };
  var tn = $('estToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miVirtud ? EST_VIRTUDES[e.miVirtud].nombre : 'hacer lo que depende de mí';
      var txt2 = '🏛️ Estoicismo (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy: 2 columnas + 1 STOP + 1 deber');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('estClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu Estoicismo (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.estoicismo = blank();
    } catch (e) {}
    syncMiVirtud(); renderMiVirtudBox(); renderDiario(); renderHist(); renderPracts(); renderStats();
    save('Estoicismo borrado');
  };

  puenteMetodos();
  updateProgreso();
}

var _retry = 0;
function setupRetry() {
  var ready = false;
  try { ready = !!document.querySelector('.action-group[data-group="linaje"] .group-btns'); } catch (e) {}
  if (!ready) {
    _retry++;
    if (_retry < 80) { setTimeout(setupRetry, 500); return; }
  }
  try { setup(); } catch (e) {}
  setTimeout(function () { try { puenteMetodos(); } catch (e2) {} }, 2500);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setupRetry, 400); });
else setTimeout(setupRetry, 400);

})();
