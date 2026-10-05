/* ============================================================
   CUARTO CAMINO (Gurdjieff) — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnCuartoCamino (grupo Linaje > Interior, inyectado +
     estatico en index.html tras btnMetodos)
   - Dialogo cuartoCaminoDialog con 5 pestanas:
     1) Guia (que es, Gurdjieff en 1 min, 3 caminos vs 4to,
        ideas-mapa, como practicar sin escuela, cuidados)
     2) Ideas (14 fichas + buscador + detalle + favorito +
        "esta soy yo hoy")
     3) Practicas (8 practicas + STOP interactivo 1 min +
        registro de recuerdo de si)
     4) Test (21 preguntas: que centro te domina + cuanto sueno)
     5) Mi trabajo (mi centro, diario, stops, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().cuartoCamino
     { tests:[], miCentro:'', stops:[], diario:{}, favs:[] }
   - Puentes: Eneagrama (Gurdjieff es su raiz), Metodos (ficha
     "Cuarto camino" -> boton "Abrir mi Cuarto Camino"),
     Psicologia (auto-observacion) y Recapitulacion (repaso).
   - Educativo, no diagnostica. Sin dependencias. 100% offline.
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
function blank() { return { tests: [], miCentro: '', stops: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.cuartoCamino) u.cuartoCamino = blank();
    var e = u.cuartoCamino;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.stops)) e.stops = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miCentro !== 'string') e.miCentro = '';
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
  ['Guia', 'Ideas', 'Pract', 'Test', 'Trabajo'].forEach(function (t) {
    var p = $('cc' + t), b = $('tabCc' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 14 ideas del Cuarto Camino (lenguaje simple)
   ============================================================ */
var CC_IDEAS = [
  { id: 'sueno', n: 'El hombre dormido', ico: '😴', tag: 'sueno despertar piloto automatico',
    idea: 'Vivimos dormidos: reaccionamos en piloto automatico, sin darnos cuenta de que estamos vivos. Despertar no es metafora: es notar "estoy aqui, ahora".',
    sirve: 'Dias en que haces todo apurado y al final no recuerdas nada. Irritabilidad, olvidos, "me paso la semana volando".',
    practica: '3 alarmas al dia (manana, mediodia, tarde): al sonar, frena 30 seg, mira tus manos, respira y di dentro: "estoy aqui".',
    trampa: 'Creer que ya estas despierto porque lo leiste. El sueno se mide en actos, no en ideas.',
    pregunta: 'En este momento: ¿estoy aqui o estoy en mi cabeza?' },
  { id: 'esencia', n: 'Esencia vs Personalidad', ico: '🌱', tag: 'esencia personalidad yo nino herida mascara',
    idea: 'Esencia: lo que trajiste de nina/o (curiosidad, risa facil, llanto honesto). Personalidad: la mascara que aprendiste para que te quieran (portarse bien, callar, rendir). El trabajo es que la personalidad deje de tapar la esencia.',
    sirve: 'Sentir que actuas un personaje en el trabajo, la familia o la pareja. Cansancio de fingir.',
    practica: 'Escribe 3 recuerdos de infancia donde eras TU sin esfuerzo. ¿Que hacia esa nina/o que hoy censuras?',
    trampa: 'Usarlo para culpar a los padres. Sirve para comprender, no para acusar.',
    pregunta: '¿Esto que hago sale de mi esencia o de mi miedo a no gustar?' },
  { id: 'centros', n: 'Los 3 cerebros (centros)', ico: '🧠', tag: 'centros intelectual emocional motor instintivo cuerpo',
    idea: 'Tenemos 3 cerebros: Intelectual (piensa), Emocional (siente) y Motor-Instintivo (se mueve, hambre, sueno, sexo). Cada uno tiene su atencion y su velocidad. Casi siempre uno manda y los otros obedecen.',
    sirve: 'Pensar sin parar (intelectual), ahogarte en emociones (emocional) o vivir solo haciendo sin sentir (motor).',
    practica: 'Hoy observa cada 3 horas: ¿que centro manda? Anotalo con I / E / M en tu diario.',
    trampa: 'Decir "soy emocional" como etiqueta fija. Los centros rotan: hoy manda uno, manana otro.',
    pregunta: '¿Quien habla ahora en mi: mi cabeza, mi corazon o mi cuerpo?' },
  { id: 'recuerdo', n: 'Recuerdo de si', ico: '🪞', tag: 'recuerdo de si presencia atencion dividida aqui',
    idea: 'La practica madre: dividirse entre lo que hago y el que lo hace. Ejemplo: lavo platos Y me doy cuenta de que yo lavo platos. No es pensar en ti: es sentirte presente.',
    sirve: 'Base de todo el trabajo. Sin esto, lo demas es teoria.',
    practica: 'Elige 1 acto diario (lavar loza, caminar a la micro, tomar te) y hazlo sintiendote: manos + respiracion + "yo estoy".',
    trampa: 'Convertirlo en frase mental ("yo estoy, yo estoy") sin sentir el cuerpo.',
    pregunta: '¿Puedo sentir mis pies y mis manos mientras leo esto?' },
  { id: 'autoobs', n: 'Auto-observacion sin juicio', ico: '👁️', tag: 'auto observacion testigo diario sin juicio',
    idea: 'Mirarte como un cientifico amable: registro, no condeno. "Noto que aprieto la mandibula cuando me corrigen". El juez interno no observa: castiga y esconde.',
    sirve: 'Descubrir tus programas: el que se apura, el que se victimiza, el que controla.',
    practica: 'Ficha de 3 lineas al dia: Situacion / Que hizo mi maquina / Que centro mando. Sin adjetivos ("soy tonto"). Solo hechos.',
    trampa: 'Observar a otros ("mi marido no se observa"). El trabajo es solo sobre ti.',
    pregunta: '¿Que estoy haciendo exactamente, descrito como camara?' },
  { id: 'identificacion', n: 'Identificacion: el pegoteo', ico: '🩹', tag: 'identificacion apego pegoteo desidentificar distancia',
    idea: 'Identificarse es pegarse: soy mi rabia, soy mi sueldo, soy mi like. Desidentificarse es dar un paso atras: "hay rabia en mi" en vez de "soy rabioso".',
    sirve: 'Discusiones donde pierdes la cabeza, compras por ansiedad, scroll que no puedes soltar.',
    practica: 'Cuando algo te atrape, nombra: "me identifico con ___". Respira 4-6 tres veces y pregunta: ¿y si lo miro desde 1 metro?',
    trampa: 'Usarlo para frialdad ("no siento nada"). Desidentificar no es disociar: es sentir sin ahogarte.',
    pregunta: '¿Que me tiene pegado ahora mismo?' },
  { id: 'consideracion', n: 'Consideracion interna y externa', ico: '🤝', tag: 'consideracion interna externa empatia ponerse lugar otro',
    idea: 'Interna: "¿que pensaran de mi?" (ruido que te roba energia). Externa: ponerte de verdad en los zapatos del otro (su cansancio, su miedo) y actuar en consecuencia.',
    sirve: 'Conflictos con pareja, vecinos, jefes. Ansiedad social.',
    practica: 'Antes de responder enojado: 10 seg imaginando el dia del otro. Luego responde a su cansancio, no a su tono.',
    trampa: 'Confundir consideracion externa con someterse ("digo que si para que no se enojen").',
    pregunta: '¿Estoy cuidando mi imagen o cuidando a la persona?' },
  { id: 'amortiguadores', n: 'Amortiguadores (buffers)', ico: '🛋️', tag: 'amortiguadores buffers contradicciones justificacion mentira',
    idea: 'Topes mentales que nos evitan ver nuestras contradicciones ("soy humilde, pero que todos lo noten"). Suavizan el choque... y nos dejan dormidos.',
    sirve: 'Darte cuenta de que predicas algo y haces lo contrario (salud, plata, amor).',
    practica: 'Escribe 1 contradiccion tuya sin justificarla: "digo X y hago Y". Solo mirala 1 minuto. Ese ardor es despertar.',
    trampa: 'Flagelarte. El punto es ver, no castigar.',
    pregunta: '¿Que contradiccion mia estoy tapando con una excusa linda?' },
  { id: 'emocneg', n: 'No expresar emociones negativas', ico: '🌊', tag: 'emociones negativas queja no expresar transformar',
    idea: 'Quejarse, criticar, apurar o victimizarse contamina tu casa interna y la ajena. No es reprimir: es no derramarla sobre otros y transformarla dentro (respirar, caminar, escribir).',
    sirve: 'Ambiente pesado en casa, mañanas arruinadas por una rabia chica.',
    practica: 'Reto 24 h: cada queja que nazca, escribela en vez de decirla. Al final del dia lee y quema/rompe el papel.',
    trampa: 'Tragarselo y explotar despues. Si hierve (9-10/10), muevete: camina, agua fria, habla manana en calma.',
    pregunta: '¿Esto que voy a decir alivia o solo contagia?' },
  { id: 'ley3', n: 'Ley de Tres: todo necesita 3 fuerzas', ico: '🔺', tag: 'ley de tres fuerzas activa pasiva neutralizante eneagrama',
    idea: 'Nada ocurre con 1 o 2 fuerzas: toda creacion une Activa (impulso), Pasiva (resistencia) y Neutralizante (contexto que une). Discutir es 2 fuerzas: falta la tercera (escuchar de verdad).',
    sirve: 'Proyectos trabados, peleas eternas, dietas que duran 3 dias.',
    practica: 'Toma 1 meta trabada y escribe sus 3 fuerzas: ¿que empuja? ¿que frena? ¿que tercera cosa falta (ayuda, plazo, lugar)?',
    trampa: 'Ver enemigos en la fuerza pasiva. La resistencia informa: te dice lo que falta.',
    pregunta: '¿Cual es la tercera fuerza que no estoy viendo?' },
  { id: 'ley7', n: 'Ley de Siete y las Octavas', ico: '🎼', tag: 'ley de siete octavas do re mi desvios intervalos choques',
    idea: 'Todo proceso avanza por escalones (do-re-mi-fa-sol-la-si) y se desvia en 2 intervalos (mi-fa y si-do) si nadie le da un choque consciente. Por eso los propositos se desinflan a las 2 semanas.',
    sirve: 'Entusiasmo que se apaga: gimnasio, huerta, ahorro, estudios.',
    practica: 'A tus metas pon 2 "choques" agendados: revision dia 7 y dia 21 (con otra persona si puedes). Ahi se salvan las octavas.',
    trampa: 'Creer que basta la motivacion inicial. La octava pide mantencion, no inspiracion.',
    pregunta: '¿Donde se desvio mi ultima meta: en el primer bajon o en el segundo?' },
  { id: 'hombres', n: 'Hombre Nº 1, 2, 3... hasta 7', ico: '🪜', tag: 'hombre numero 1 2 3 4 5 6 7 equilibrio escuela',
    idea: 'Nº1: manda el cuerpo. Nº2: manda la emocion. Nº3: manda la cabeza. Nº4: el equilibrado (trabaja sobre si). Nº5-7: unidad real. Casi todos somos 1, 2 o 3. No es ranking moral: es mapa.',
    sirve: 'Entender por que con algunos hablas con datos, con otros con cariño y con otros haciendo juntos.',
    practica: 'Haz el Test de esta seccion y lee tu centro dominante sin pelear con el resultado.',
    trampa: 'Creerte Nº4 por leer mucho. El Nº4 se nota en actos parejos, no en biblioteca.',
    pregunta: '¿Que numero soy hoy, honestamente?' },
  { id: 'escuela', n: 'Escuela y espejos (trabajo con otros)', ico: '🏫', tag: 'escuela grupo espejo senalar eneagrama trabajo',
    idea: 'Solo no te ves la espalda: necesitas espejos (grupo, amigo de trabajo, terapeuta) que te senalen con respeto lo que no ves. El Cuarto Camino se hace en la vida, pero se pule con otros.',
    sirve: 'Puntos ciegos que se repiten aunque "ya lo trabajaste".',
    practica: 'Pide a 1 persona de confianza: "dime 1 patron mio que me frena, con un ejemplo". Solo escucha y agradece.',
    trampa: 'Buscar gurues que te digan que hacer con tu plata, pareja o salud. Escuela seria no dirige tu vida: te devuelve tu atencion.',
    pregunta: '¿A quien autorizo para que me diga lo que no quiero ver?' },
  { id: 'eneagramaG', n: 'El Eneagrama de Gurdjieff (origen)', ico: '✡️', tag: 'eneagrama gurdjieff Ichazo Naranjo nueve tipos procesos',
    idea: 'El simbolo de 9 puntas que ves en 🔺 Eneagrama nacio aqui: Gurdjieff lo uso para mostrar como todo proceso (una comida, un proyecto, una vida) gira y se atasca. Despues Ichazo y Naranjo lo llevaron a la personalidad.',
    sirve: 'Puente perfecto: si te gusto el Eneagrama de tipos, aqui esta su raiz de procesos.',
    practica: 'Abre 🔺 Eneagrama y tu idea favorita de aqui al mismo tiempo: ¿como tu eneatipo usa (o evita) el recuerdo de si?',
    trampa: 'Quedarse solo en el test de personalidad y perderse el trabajo diario.',
    pregunta: '¿Mi tipo me ayuda a despertar o me da una excusa nueva?' }
];
function ccIdea(id) { for (var i = 0; i < CC_IDEAS.length; i++) if (CC_IDEAS[i].id === id) return CC_IDEAS[i]; return null; }

var CC_PRACTICAS = [
  { id: 'stop', n: 'STOP sagrado (1 minuto)', ico: '🛑', tiempo: '1 min, 2-3 veces al dia',
    pasos: '1) Para todo (manos quietas, espalda recta). 2) Siente pies + manos + respiracion a la vez. 3) Mira alrededor como si fuera primera vez. 4) Pregunta: ¿donde estoy, como estoy? 5) Sigue con 1 cosa a la vez.',
    tip: 'El boton "Hacer STOP ahora" de esta pestana te guia con tiempo. Usalo cuando suene tu alarma o antes de entrar a casa.' },
  { id: 'recuerdo3', n: 'Recuerdo de si x3', ico: '🪞', tiempo: '3 x 30 seg al dia',
    pasos: 'Manana / mediodia / tarde: 30 seg sintiendo "yo estoy aqui" mientras haces algo simple (te, micro, loza). Marca cada uno abajo: 0 a 3 al dia.',
    tip: 'Atado a habitos que ya existen (hervidor, semaforo, puerta) funciona 10x mejor que "cuando me acuerde".' },
  { id: 'centro-dia', n: 'Caza del centro dominante', ico: '🎯', tiempo: '3 registros al dia',
    pasos: 'Manana, tarde y noche anota: I (cabeza parlotea), E (emocion manda) o M (puro hacer). Al final de la luna veras tu pelicula.',
    tip: 'Sin pelear con lo que salga. El dato repetido 7 dias es tu diagnostico real.' },
  { id: 'noqueja', n: '24 h sin derramar negatividad', ico: '🤐', tiempo: '1 dia por luna',
    pasos: 'Elige 1 dia: cada queja/critica/apuro se escribe (no se dice). Noche: lee, subraya el patron y rompe el papel. Celebra lo que SI lograste contener.',
    tip: 'Avisa en casa: "hoy practico no quejarme, ayudame". Conviertelo en juego, no en ley seca.' },
  { id: 'externa', n: 'Consideracion externa (1 acto)', ico: '💛', tiempo: '5 min',
    pasos: 'Elige 1 roce de hoy. Escribe: ¿que dia tuvo el otro? ¿que necesitaba? Manana haz 1 acto que le aliviane (no que te luzca).',
    tip: 'El perdon real a veces pide reparacion concreta: devolver, ordenar, llamar, pagar.' },
  { id: 'caminata', n: 'Atencion dividida caminando', ico: '🚶', tiempo: '10 min',
    pasos: 'Camina 10 min sintiendo pies + respiracion + entorno a la vez (3 focos). Cuando te pierdas en pensamientos, vuelve suave a los pies.',
    tip: 'Ideal en Penco: borde costero, plaza o vuelta a la manzana. Sin audifonos.' },
  { id: 'revision', n: 'Revision nocturna (5 min)', ico: '🌙', tiempo: '5 min antes de dormir',
    pasos: '1) ¿Cuando estuve presente hoy? 2) ¿Cuando me identifique? 3) ¿Que centro mando? 4) 1 agradecimiento. Escribelo en Mi trabajo.',
    tip: 'Es la recapitulacion tolteca en miniatura: si la haces 13 lunas seguidas, te conoces entera/o.' },
  { id: 'choque', n: 'Choque a mi octava caída', ico: '🥁', tiempo: '15 min por semana',
    pasos: 'Elige 1 meta desviada. Detecta en que intervalo cayo (primer bajon o segundo). Agenda 1 choque: ayuda, plazo, lugar o companero.',
    tip: 'Las octavas se salvan con choques externos agendados, no con culpa interna.' }
];

var CC_TEST = [
  { c: 'I', txt: 'Vivo en mi cabeza: repaso conversaciones y planeo todo el rato.' },
  { c: 'E', txt: 'Mis emociones deciden por mi: si estoy mal, todo se tiñe.' },
  { c: 'M', txt: 'Estoy siempre haciendo: me cuesta quedarme quieto sin celu o pega.' },
  { c: 'I', txt: 'Me explican algo emocional y lo convierto en teoria en vez de sentirlo.' },
  { c: 'E', txt: 'Necesito que me quieran/aprueben para sentirme bien.' },
  { c: 'M', txt: 'Como, duermo y me muevo en automatico, sin registrar el cuerpo.' },
  { c: 'I', txt: 'Dudo mucho antes de actuar: necesito un dato mas.' },
  { c: 'E', txt: 'Me ofendo o entusiasmo rapido, y despues me arrepiento.' },
  { c: 'M', txt: 'Cuando paro (feriado, fila, taco) me pongo ansioso o me duermo.' },
  { c: 'I', txt: 'Memoria de elefante para datos, mala memoria para lo que senti.' },
  { c: 'E', txt: 'Lloro o rio con facilidad viendo a otros (me fusiono).' },
  { c: 'M', txt: 'Resuelvo todo con el cuerpo: ordenar, apretar, caminar, comer.' },
  { c: 'I', txt: 'Me pierdo en pantallas/lecturas y se me pasa la micro.' },
  { c: 'E', txt: 'Una critica me deja dando vueltas el dia entero.' },
  { c: 'M', txt: 'Termino el dia molido pero no se en que gaste la energia.' },
  { c: 'S', txt: 'Hago casi todo apurado, sin darme cuenta de que estoy vivo.' },
  { c: 'S', txt: 'Digo una cosa y hago otra, y me justifico rapido.' },
  { c: 'S', txt: 'Me quejo o critico varias veces al dia.' },
  { c: 'S', txt: 'Reacciono igual ante lo mismo (siempre el mismo enojo, mismo apuro).' },
  { c: 'S', txt: 'Me cuesta escuchar sin preparar mi respuesta.' },
  { c: 'S', txt: 'Al final del dia no recuerdo momentos concretos, solo cansancio.' }
];
var CC_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var CC_CENTROS = {
  I: { nombre: 'Intelectual (cabeza)', ico: '🧠', desc: 'Manda tu cabeza: analizas todo, dudas, planeas, teorizas. Don: claridad y memoria. Riesgo: vivir en la mente y no habitar el cuerpo ni el corazon.',
       entrena: 'Vuelve al cuerpo 3x al dia: pies, manos, respiracion. Camina 10 min sin pensar (practica 🚶). Decide 1 cosa rapida al dia sin pedir 3 opiniones.' },
  E: { nombre: 'Emocional (corazon)', ico: '💗', desc: 'Manda tu corazon: sientes fuerte, te fusionas, buscas amor/aprobacion. Don: calidez y empatia. Riesgo: ahogarte en la ola y decidir desde la herida.',
       entrena: 'Nombra la emocion y midela 0-10 antes de actuar. Practica 🤐 24 h y 💛 consideracion externa. Escribe, no derrames.' },
  M: { nombre: 'Motor-Instintivo (cuerpo)', ico: '🏃', desc: 'Manda tu cuerpo: haces sin parar, comes/duermes en automatico, te inquieta parar. Don: energia y concrecion. Riesgo: maquina eficiente pero dormida.',
       entrena: 'Frena a proposito: STOP 🛑 3x al dia, come 1 vez al dia sintiendo cada bocado, acuestate 10 min sin estimulo.' }
};

var CC_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): mirar adentro. Auto-observacion + revision nocturna. Pregunta: ¿que programa me maneja?',
  'Lunas 4-6 (Pewu · primavera): sembrar recuerdo de si x3 + 1 acto de consideracion externa por semana.',
  'Lunas 7-9 (Walung · verano): probarse con gente. Reto 🤐 + pedir 1 espejo (escuela). El roce muestra lo que el cojin esconde.',
  'Lunas 10-13 (Rimu · otono): cosechar. Releer diario, marcar octavas salvadas y elegir 1 practica madre para el proximo ciclo.'
];

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  var ideasGrid = CC_IDEAS.map(function (it) {
    return '<button type="button" class="btn cc-idea-card" data-idea="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.n) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var testHTML = CC_TEST.map(function (q, i) {
    var opts = CC_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="ccQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var practHTML = CC_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p style="font-size:12px">' + esc(p.pasos) + '</p>' +
      '<p class="muted" style="font-size:12px">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn cc-pract-add" data-p="' + esc(p.n) + '" style="width:auto">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabCcGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabCcIdeas" class="btn" style="width:auto">💡 14 Ideas</button>' +
    '<button type="button" id="tabCcPract" class="btn" style="width:auto">🛠️ Prácticas</button>' +
    '<button type="button" id="tabCcTest" class="btn" style="width:auto">📝 Test centros</button>' +
    '<button type="button" id="tabCcTrabajo" class="btn" style="width:auto">🌱 Mi trabajo</button></div>' +

    '<div id="ccGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🛤️ ¿Qué es el Cuarto Camino?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Es la vía de <b>despertar en medio de la vida común</b>, enseñada por <b>G. I. Gurdjieff</b> (Armenia/Grecia, ~1866-1949) y ordenada por su alumno <b>P. D. Ouspensky</b> en <i>Fragmentos de una enseñanza desconocida</i>. Hay 3 caminos clásicos: el del <b>faquir</b> (cuerpo y aguante), el del <b>monje</b> (fe y emoción) y el del <b>yogui</b> (mente y saber). El <b>Cuarto</b> no se retira al monasterio ni al Himalaya: <b>usa tu casa, tu pega y tu familia como escuela</b>, trabajando los 3 centros a la vez.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Idea de una línea: <b>estás dormido creyendo que estás despierto</b>. Hablas dormido, te enojas dormido, decides dormido. Despertar = <b>recordarte a ti mismo</b> varias veces al día, observar tu máquina sin mentirte y soltar lo que te tiene pegado.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🧭 El mapa en 6 piezas</h4>' +
    '<p class="muted" style="font-size:12px"><b>1) Sueño:</b> piloto automático. <b>2) 3 centros:</b> cabeza, corazón, cuerpo (uno manda). <b>3) Identificación:</b> te pegas a todo. <b>4) Consideración interna:</b> ruido del "qué dirán". <b>5) Amortiguadores:</b> excusas que tapan contradicciones. <b>6) Leyes 3 y 7:</b> por qué todo se traba y se desvía.</p></div>' +
    '<div class="menstrual-card"><h4>🙋 Gurdjieff en 1 minuto</h4>' +
    '<p class="muted" style="font-size:12px">Buscador de escuelas olvidadas (sufíes, monte Athos, Asia central). En Moscú (1915) enseña a Ouspensky; tras la revolución huye al <b>Instituto del Prieuré</b> (Francia). Métodos famosos: <b>STOP</b>, danzas sagradas, trabajo en grupos, el <b>Eneagrama de procesos</b>. Murió en 1949 dejando alumnos (Ouspensky, Nicoll, Rodney Collin) que escribieron todo.</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo se practica sin escuela? (rutina mínima)</summary>' +
    '<p class="muted" style="font-size:12px"><b>Manana:</b> 1 STOP + intencion ("hoy me observo en ___"). <b>Día:</b> recuerdo de si x3 atado a hábitos + 1 no-queja escrita. <b>Noche:</b> revision 5 min (¿presente? ¿pegado? ¿qué centro mandó?). <b>Por luna:</b> 1 reto 🤐 de 24 h + 1 espejo (pedir senalamiento) + releer diario. 15 min diarios bastan; la constancia hace el camino.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Esto es <b>autoconocimiento educativo</b>, no terapia ni religión. ✅ Si un ejercicio te desborda (angustia fuerte, disociación, llanto incontrolable), detente, camina, toma agua y conversa con alguien. ✅ Con trauma grave, duelo fresco o crisis de salud mental, practica acompañado (terapeuta, CESFAM, *4141 en Chile 24 h). ❌ Ninguna escuela seria te pide plata grande, obediencia ciega ni decisiones sobre pareja/salud. Desconfía de gurúes.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Cuarto Camino × 13 lunas</h4><div id="ccLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puentes dentro de la app: 🔺 <b>Eneagrama</b> (su hija famosa: ver ficha ✡️) · 📿 <b>Métodos</b> (ficha Cuarto camino) · 🪞 <b>Autoconocimiento</b> · 🔁 <b>Recapitulación</b> (revisión nocturna grande).</p></div>' +
    '</div>' +

    '<div id="ccIdeas" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="ccQ" placeholder="ej: sueño, identificación, ley de tres, eneagrama..." maxlength="40"></label></div>' +
    '<div id="ccIdeasGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + ideasGrid + '</div>' +
    '<div id="ccDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca una idea para ver su ficha completa 👆</p></div></div>' +

    '<div id="ccPract" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🛑 STOP guiado — 1 minuto</h4>' +
    '<p class="muted" style="font-size:12px">Para todo. Siente pies + manos + respiración. Mira como si fuera primera vez. Cuando termines, marca abajo tu recuerdo del día.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" id="ccStopBtn" class="btn btn-accent" style="width:auto">▶ Hacer STOP ahora (60 seg)</button>' +
    '<span id="ccStopMsg" class="muted" style="font-size:12px"></span></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Recuerdo de sí hoy (0-3) <select id="ccRecSel"><option value="0">0 · dormido total</option><option value="1">1 · un momento</option><option value="2">2 · dos momentos</option><option value="3">3 · mañana + tarde + noche</option></select></label>' +
    '<label>Centro que mandó hoy <select id="ccCentroHoy"><option value="">—</option><option value="I">🧠 Intelectual</option><option value="E">💗 Emocional</option><option value="M">🏃 Motor-instintivo</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ccPractSave" class="btn btn-accent" style="width:auto">💾 Guardar práctica de hoy</button></div></div>' +
    practHTML + '</div>' +

    '<div id="ccTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test: ¿qué centro te domina? (21 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo eres casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Incluye 6 preguntas de <b>nivel de sueño</b> (S). <b>No es diagnóstico</b>: es un espejo para elegir por dónde empezar.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ccTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="ccTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="ccProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="ccTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="ccResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="ccTrabajo" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi centro</h4>' +
    '<div class="conv-row"><label>Mi centro dominante <select id="ccMiCentro"><option value="">— sin definir —</option><option value="I">🧠 Intelectual</option><option value="E">💗 Emocional</option><option value="M">🏃 Motor-instintivo</option></select></label></div>' +
    '<div id="ccMiCentroBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario del observador</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ccDiaFecha"></label></div>' +
    '<label>Hoy me observé… (situación + centro + ¿me pegué?) <input type="text" id="ccDiaTxt" placeholder="ej: me apuré en la fila; M; respiré y solté" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ccDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="ccDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🛑 Mis STOPs (racha de presencia)</h4><div id="ccStopsBox"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="ccHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="ccStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ccShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="ccToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="ccClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('cuartoCaminoDialog', '🛤️ Cuarto Camino — despertar en la vida diaria',
    'Gurdjieff para gente común: recuerda que existes, observa tu máquina y suelta lo que te maneja. Sin monasterio: en Penco, en tu casa, hoy. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('ccLunasBox'); if (!box) return;
  box.innerHTML = CC_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalle(id) {
  var box = $('ccDetalle'); if (!box) return;
  var t = ccIdea(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.ico + ' ' + esc(t.n) + '</h4>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(t.idea) + '</p>' +
    '<p style="font-size:12px">🧰 <b>¿Cuándo sirve?</b> ' + esc(t.sirve) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta que despierta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<p class="muted" style="font-size:12px">⚠️ Trampa típica: ' + esc(t.trampa) + '</p>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn" id="ccFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="ccHoyBtn" style="width:auto">✓ Trabajar esta hoy</button></div>';
  var fb = $('ccFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('ccHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '💡 Hoy trabajo: ' + t.n + ' — ' + t.pregunta;
    save('Idea llevada a tu diario ✓'); renderDiario(); renderStats(); switchTab('Trabajo');
  };
}

function filterIdeas() {
  var q = (($('ccQ') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#ccIdeasGrid .cc-idea-card');
  cards.forEach(function (card) {
    var t = ccIdea(card.dataset.idea);
    if (!t) return;
    var hay = ((t.n + ' ' + t.tag + ' ' + t.idea).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function calcTest() {
  var sc = { I: 0, E: 0, M: 0, S: 0 };
  var contestadas = 0;
  for (var i = 0; i < CC_TEST.length; i++) {
    var sel = document.querySelector('input[name="ccQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[CC_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('ccProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + CC_TEST.length + ' respondidas' + (r.contestadas < CC_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ listo para calcular');
}
function showResultado(sc, saved) {
  var box = $('ccResultado'); if (!box) return;
  var arr = [{ k: 'I', p: sc.I }, { k: 'E', p: sc.E }, { k: 'M', p: sc.M }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max(arr[0].p, 1);
  var dom = arr[0].k;
  var sueno = sc.S;
  var suenoTxt = sueno <= 6 ? 'Liviano: hay presencia. Sostén con recuerdo x3.' : sueno <= 11 ? 'Medio: piloto automático frecuente. STOP diario te cambia la luna.' : 'Denso: andas muy en máquina. Parte por 1 STOP + revisión nocturna, sin exigirte todo.';
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu espejo ' + (saved ? '(guardado ✓)' : '(sin guardar)') + '</h4>' +
    '<p class="muted" style="font-size:11px">Máximo por centro: 21 (7 preguntas × 3). Sueño (S): máximo 18.</p>' +
    arr.map(function (a) {
      var c = CC_CENTROS[a.k];
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px"><b>' + c.ico + ' ' + esc(c.nombre) + '</b></span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>' + CC_CENTROS[dom].ico + ' Tu centro dominante: ' + esc(CC_CENTROS[dom].nombre) + '</h4>' +
    '<p>' + esc(CC_CENTROS[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(CC_CENTROS[dom].entrena) + '</p>' +
    '<p class="muted">😴 Nivel de sueño: <b>' + sueno + '/18</b> — ' + esc(suenoTxt) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="ccSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="ccSetCentro" style="width:auto">✓ Soy ' + esc(CC_CENTROS[dom].nombre) + '</button>' +
    '<button type="button" class="btn" id="ccReadIdea" style="width:auto">📖 Leer idea que me sirve</button></div>';
  var sv = $('ccSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), I: sc.I, E: sc.E, M: sc.M, S: sc.S, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('ccSetCentro');
  if (st) st.onclick = function () {
    var d = store(); d.miCentro = dom; save('Tu centro guardado ✓');
    syncMiCentro(); renderMiCentroBox(); renderStats(); switchTab('Trabajo');
  };
  var ri = $('ccReadIdea');
  if (ri) ri.onclick = function () {
    var map = { I: 'centros', E: 'identificacion', M: 'recuerdo' };
    switchTab('Ideas'); renderDetalle(map[dom] || 'recuerdo');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiCentro() {
  var sel = $('ccMiCentro'); if (!sel) return;
  sel.value = store().miCentro || '';
}
function renderMiCentroBox() {
  var box = $('ccMiCentroBox'); if (!box) return;
  var k = store().miCentro || '';
  if (!k || !CC_CENTROS[k]) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o elígelo arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = CC_CENTROS[k];
  box.innerHTML = '<div class="chip" style="display:block;white-space:normal;line-height:1.5"><b>' + c.ico + ' ' + esc(c.nombre) + '</b><br>' +
    '<span class="muted">' + esc(c.desc) + '<br><b>Entrena:</b> ' + esc(c.entrena) + '</span></div>';
}
function rachaStops() {
  var set = {};
  (store().stops || []).forEach(function (r) { set[r.fecha] = true; });
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
function renderStops() {
  var box = $('ccStopsBox'); if (!box) return;
  var d = store().stops || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted" style="font-size:11px">🔥 Racha: <b>' + rachaStops() + ' días</b> · ' + d.length + ' práctica(s) guardada(s) · marca 1 por día (recuerdo 0-3 + centro de hoy).</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · recuerdo ' + esc(String(r.rec)) + '/3' + (r.centro ? ' · centro ' + esc(r.centro) : '') + '</span>' +
        '<button type="button" class="btn btn-icon cc-stop-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin prácticas aún. Haz un STOP 🛑 y guárdalo arriba.</p>');
  box.querySelectorAll('.cc-stop-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.stops = e.stops.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderStops(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('ccDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 3 líneas al día bastan: situación + centro + ¿me pegué?</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon cc-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.cc-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('ccHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · 🧠' + r.I + ' 💗' + r.E + ' 🏃' + r.M + ' · domina <b>' + esc(r.dom || '') + '</b> · sueño ' + esc(String(r.S)) + '/18</span>' +
      '<button type="button" class="btn btn-icon cc-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.cc-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('ccStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miCentro ? CC_CENTROS[e.miCentro].nombre : 'sin centro';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.stops.length + ' práctica(s) · ' + c;
}

/* STOP timer 60s */
var ccStopTimer = null;
function runStop() {
  var msg = $('ccStopMsg'), btn = $('ccStopBtn');
  if (!msg) return;
  if (ccStopTimer) { clearInterval(ccStopTimer); ccStopTimer = null; if (btn) btn.textContent = '▶ Hacer STOP ahora (60 seg)'; msg.textContent = ''; return; }
  var seg = 60;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Para. Siente pies + manos + respiración… 60';
  ccStopTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(ccStopTimer); ccStopTimer = null;
      if (btn) btn.textContent = '▶ Hacer STOP ahora (60 seg)';
      msg.textContent = '✓ Listo. ¿Dónde estás, cómo estás? Guarda tu práctica abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    if (seg === 30) msg.textContent = 'Mira alrededor como si fuera primera vez… 30';
    else if (seg === 10) msg.textContent = '1 cosa a la vez al volver… 10';
    else msg.textContent = 'Siente tu cuerpo… ' + seg;
  }, 1000);
}

/* Puente hacia Metodos: boton "Abrir mi Cuarto Camino" en su ficha */
function puenteMetodos() {
  try {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (tries > 40) { clearInterval(iv); return; }
      var dlg = $('metodosDialog') || document.getElementById('metodosDialog');
      if (!dlg) return;
      var html = dlg.innerHTML || '';
      if (html.toLowerCase().indexOf('gurdjieff') < 0 && html.toLowerCase().indexOf('cuarto camino') < 0) return;
      if ($('ccOpenFromMetodos')) { clearInterval(iv); return; }
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var t = (b.textContent || '').toLowerCase();
        if (t.indexOf('cuarto camino') >= 0 || t.indexOf('gurdjieff') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.id = 'ccOpenFromMetodos';
          open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '🛤️ Abrir mi Cuarto Camino';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openCuartoCamino(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
      if (tries > 20) {
        var fab = document.createElement('div');
        fab.innerHTML = '<button type="button" id="ccOpenFromMetodos" class="btn btn-accent" style="width:auto;margin-top:8px">🛤️ Abrir mi Cuarto Camino</button>';
        var f = dlg.querySelector('form') || dlg;
        f.appendChild(fab);
        var nb = $('ccOpenFromMetodos');
        if (nb) nb.onclick = function () { openCuartoCamino(); };
        clearInterval(iv); return;
      }
    }, 500);
  } catch (e) {}
}

function openCuartoCamino() {
  try {
    if ($('ccDiaFecha') && !$('ccDiaFecha').value) $('ccDiaFecha').value = todayKey();
    syncMiCentro(); renderMiCentroBox(); renderDiario(); renderHist(); renderStops(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('cuartoCaminoDialog');
}
try { window.openCuartoCamino = openCuartoCamino; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar boton en Linaje > Interior (tras Metodos si existe) */
  try {
    if (!$('btnCuartoCamino')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnCuartoCamino'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🛤️ Cuarto Camino';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'cuarto camino gurdjieff ouspensky nicoll collin recuerdo de si auto observacion identificacion consideracion amortiguadores ley de tres ley de siete octavas eneagrama stop despertar sueno esencia personalidad centros hombre numero 4 faquir monje yogui escuela despertar presencia atencion');
        var ref = g.querySelector('#btnMetodos');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnCuartoCamino');
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnCuartoCamino') < 0) ALL_BTNS.push('btnCuartoCamino');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnCuartoCamino = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnCuartoCamino') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnMetodos');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnCuartoCamino');
      else BTN_ORDER['linaje|interior'].push('btnCuartoCamino');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnCuartoCamino = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnCuartoCamino"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnCuartoCamino"> 🛤️ Cuarto Camino';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnCuartoCamino !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnCuartoCamino = lab.querySelector('input').checked;
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
  try { addKw('btnMetodos', 'cuarto camino gurdjieff despertar recuerdo'); } catch (e2) {}
  try { addKw('btnEneagrama', 'gurdjieff cuarto camino origen procesos'); } catch (e3) {}
  try { addKw('btnPsico', 'gurdjieff auto observacion cuarto camino'); } catch (e4) {}

  /* 4) dialogo */
  buildDialog();
  renderLunasBox();
  syncMiCentro();
  renderMiCentroBox();
  renderDiario();
  renderHist();
  renderStops();
  renderStats();

  var b = $('btnCuartoCamino');
  if (b) b.onclick = function () { openCuartoCamino(); };

  ['Guia', 'Ideas', 'Pract', 'Test', 'Trabajo'].forEach(function (t) {
    var tb = $('tabCc' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('ccQ'); if (q) q.oninput = filterIdeas;
  document.querySelectorAll('#ccIdeasGrid .cc-idea-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.idea); };
  });

  var sb = $('ccStopBtn'); if (sb) sb.onclick = runStop;
  var ps = $('ccPractSave');
  if (ps) ps.onclick = function () {
    var rec = +(($('ccRecSel') || {}).value || 0);
    var ch = ($('ccCentroHoy') || {}).value || '';
    var e = store();
    e.stops.push({ id: uid('s'), fecha: todayKey(), rec: rec, centro: ch });
    save('Práctica guardada ✓'); renderStops(); renderStats();
  };

  document.querySelectorAll('input[name^="ccQ"]').forEach(function (r) {
    r.onchange = updateProgreso;
  });
  var rs = $('ccTestReset');
  if (rs) rs.onclick = function () {
    document.querySelectorAll('input[name^="ccQ"]').forEach(function (r) { r.checked = false; });
    var rb = $('ccResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  var calc = $('ccTestCalc');
  if (calc) calc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < CC_TEST.length) {
      if (!confirm('Respondiste ' + r.contestadas + ' de ' + CC_TEST.length + '. El espejo será poco fiel. ¿Verlo igual?')) return;
    }
    showResultado(r.sc, false);
  };

  document.querySelectorAll('.cc-pract-add').forEach(function (btn2) {
    btn2.onclick = function () {
      var k = todayKey();
      var e = store();
      e.diario[k] = (e.diario[k] ? e.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + btn2.dataset.p;
      save('Anotado en tu diario ✓'); renderDiario(); renderStats(); switchTab('Trabajo');
    };
  });

  var mt = $('ccMiCentro');
  if (mt) mt.onchange = function () { var e = store(); e.miCentro = mt.value || ''; save('Tu centro guardado ✓'); renderMiCentroBox(); renderStats(); };

  var da = $('ccDiaAdd');
  if (da) da.onclick = function () {
    var k = ($('ccDiaFecha') && $('ccDiaFecha').value) || todayKey();
    var txt = clean((($('ccDiaTxt') || {}).value || '').trim(), 300);
    if (!txt) return alert('Escribe tu observación primero (3 líneas bastan)');
    var e = store();
    e.diario[k] = txt;
    save('Guardado ✓'); $('ccDiaTxt').value = '';
    renderDiario(); renderStats();
  };

  var sh = $('ccShare');
  if (sh) sh.onclick = async function () {
    var e = store();
    var c = e.miCentro && CC_CENTROS[e.miCentro] ? CC_CENTROS[e.miCentro].nombre : 'sin definir';
    var last = (e.tests || []).slice(-1)[0];
    var txt = '🛤️ Mi Cuarto Camino\nCentro dominante: ' + c + '\nRacha STOP: ' + rachaStops() + ' días\n' +
      (last ? ('Último espejo (' + last.fecha + '): 🧠' + last.I + ' 💗' + last.E + ' 🏃' + last.M + ' · sueño ' + last.S + '/18') : 'Sin test aún: el espejo parte con 21 preguntas.');
    await share('Mi Cuarto Camino', txt);
  };
  var tn = $('ccToNote');
  if (tn) tn.onclick = function () {
    var e = store();
    var c = e.miCentro && CC_CENTROS[e.miCentro] ? ('🛤️ ' + CC_CENTROS[e.miCentro].nombre) : '🛤️ Trabajo del Cuarto Camino';
    var propio = (($('ccDiaTxt') || {}).value || '').trim();
    var txt = (propio || (c + ': recuerdo de sí x3 + 1 STOP')) .slice(0, 280);
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var cl = $('ccClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu registro del Cuarto Camino (tests, centro, prácticas, diario)?')) return;
    try { var u = userData(); u.cuartoCamino = blank(); } catch (e) {}
    save(); syncMiCentro(); renderMiCentroBox(); renderDiario(); renderHist(); renderStops(); renderStats();
  };

  /* 5) puente Metodos */
  try { puenteMetodos(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
