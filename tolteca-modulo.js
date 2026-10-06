/* ============================================================
   PRÁCTICAS TOLTECAS — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnTolteca (grupo Linaje > Interior, tras btnRecap)
   - Diálogo toltecaDialog con 5 pestañas:
     1) Guía (qué es, linaje don Juan/Castaneda, tonal y nagual,
        punto de encaje, 4 enemigos, camino del guerrero,
        impecabilidad, cómo practicar sin grupo, cuidados)
     2) Acuerdos (5 fichas: los 4 acuerdos de Ruiz + 5º +
        buscador + detalle + favorita + "trabajar hoy")
     3) Prácticas (9 prácticas guerreras + silencio guiado 3 min
        + registro diario del guerrero)
     4) Test (20 afirmaciones: ¿acechador, ensoñador o intento?
        + nivel de diálogo interno)
     5) Mi camino (mi arte, diario, prácticas, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().tolteca
     { tests:[], miArte:'', practs:[], diario:{}, favs:[] }
   - Puentes: Recapitulación (🔁), Diario Sueños (💭),
     Cuarto Camino (recuerdo de sí), Métodos (ficha tolteca).
   - Educativo, no terapia ni religión. 100% offline.
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
function blank() { return { tests: [], miArte: '', practs: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.tolteca) u.tolteca = blank();
    var e = u.tolteca;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miArte !== 'string') e.miArte = '';
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
  ['Guia', 'Acuerdos', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var p = $('tol' + t), b = $('tabTol' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 5 acuerdos (lenguaje simple, Ruiz + raíz Castaneda)
   ============================================================ */
var TOL_ACUERDOS = [
  { id: 'palabra', n: 'Sé impecable con tus palabras', ico: '🗣️', tag: 'palabras impecabilidad chisme verdad compromiso',
    idea: 'La palabra es tu magia: crea o destruye. Ser impecable es hablar con verdad y sin veneno, ni contra otros ni contra ti. Incluye lo que te dices por dentro.',
    sirve: 'Chisme, autocrítica feroz ("soy tonto"), promesas que no cumples, discusiones que escalan por una frase.',
    practica: 'Hoy: 0 chisme + 1 verdad amable dicha a tiempo + corrige 1 frase interna ("no puedo" → "aún estoy aprendiendo").',
    trampa: 'Usar "sinceridad" para herir ("te lo digo por tu bien"). Impecable = verdad + respeto, no filo.',
    pregunta: '¿Esto que voy a decir construye o envenena?' },
  { id: 'personal', n: 'No te tomes nada personalmente', ico: '🛡️', tag: 'personal ofensa opinion otro espejo desidentificar',
    idea: 'Lo que otros dicen y hacen es su película, no la tuya. Tomarlo personal te vuelve presa de su clima. Nada personal = libertad, no frialdad.',
    sirve: 'Críticas que te dan vuelta el día, likes que te suben o bajan, enojos ajenos que cargas.',
    practica: 'Ante un roce: respira 4-6 y pregúntate "¿qué día tuvo el otro?". Responde al cansancio, no al tono.',
    trampa: 'Volverse piedra ("nada me importa"). El guerrero siente, pero no se deja manejar.',
    pregunta: '¿Esto habla de mí o del mundo interno del otro?' },
  { id: 'suponer', n: 'No hagas suposiciones', ico: '❓', tag: 'suposiciones preguntar acuerdos claros comunicacion',
    idea: 'Suponer es soñar despierto: inventas intenciones, lees mentes y sufres por historias que nadie confirmó. El antídoto es preguntar y acordar en voz alta.',
    sirve: 'Pareja, pega y familia: "seguro que piensa...", "me dejó en visto, ya no me quiere".',
    practica: 'Hoy convierte 1 suposición en pregunta directa y corta. Anota el acuerdo logrado (quién, qué, cuándo).',
    trampa: 'Interrogar como fiscal. Preguntar es aclarar con calma, no arrinconar.',
    pregunta: '¿Esto lo sé o lo estoy inventando?' },
  { id: 'maximo', n: 'Haz siempre tu máximo', ico: '🔥', tag: 'maximo esfuerzo impecabilidad energia descanso constancia',
    idea: 'Tu máximo cambia: con gripe no es el mismo que sano. Darlo —ni más (te quemas) ni menos (te culpas)— es impecabilidad en acto. La acción disuelve la culpa.',
    sirve: 'Perfeccionismo que paraliza, culpa por descansar, metas que se caen a la semana.',
    practica: 'Define tu máximo de hoy de 0 a 10 (sueño, ánimo, tiempo) y actúa acorde. Noche: ¿di mi máximo real?',
    trampa: 'Confundir máximo con exceso. El guerrero descansa sin culpa: descansar también es dar el máximo.',
    pregunta: 'Con lo que tengo hoy, ¿cuál es mi verdadero máximo?' },
  { id: 'esceptico', n: 'Sé escéptico, pero aprende a escuchar (5º)', ico: '👁️', tag: 'esceptico quinto acuerdo discernir creer domestica',
    idea: 'No creas todo lo que oyes —ni en la tele, ni en tu cabeza—. Escucha, verifica en tu experiencia y quédate con lo que te hace libre. Así se rompe la domesticación.',
    sirve: 'Noticias que angustian, gurúes que piden obediencia, voz interna que repite "no sirves".',
    practica: 'Toma 1 creencia que te pesa ("ya estoy viejo para...") y pregúntale: ¿quién me la enseñó? ¿es verdad en mi experiencia?',
    trampa: 'Volverse cínico que nada le entra. Escéptico = filtro, no muro.',
    pregunta: '¿Esto me hace más libre o más miedoso?' }
];
function tolAcuerdo(id) { for (var i = 0; i < TOL_ACUERDOS.length; i++) if (TOL_ACUERDOS[i].id === id) return TOL_ACUERDOS[i]; return null; }

var TOL_PRACTICAS = [
  { id: 'recap', n: 'Recapitulación respirada (cosechar energía)', ico: '🔁', tiempo: '10-15 min',
    pasos: '1) Siéntate, espalda recta. 2) Elige 1 escena de hoy o del pasado. 3) Inhala lento girando la cabeza a la derecha (recoges tu energía), exhala girando a la izquierda (devuelves lo ajeno). 4) Repite 5-10 respiraciones por escena. 5) Cierra: "esto ya pasó, me quedo con el aprendizaje".',
    tip: 'Hay sección completa en 🔁 Recapitulación: úsala para inventario largo. Aquí anota sesiones cortas diarias.' },
  { id: 'acecho', n: 'Acecho del día (cázate a ti mismo)', ico: '🐾', tiempo: '3 registros al día',
    pasos: 'Mañana, tarde y noche anota: ¿qué gatilló mi reacción? ¿qué hice? ¿qué acuerdo rompí? Sin juzgarte: el acechador registra como científico, no como juez.',
    tip: 'Caza 1 rutina fija una luna (ej: el apuro, la queja, el celu). Lo que se repite 7 días es tu presa.' },
  { id: 'silencio', n: 'Parar el diálogo interno (3 min)', ico: '🤫', tiempo: '3 min, 1-2 veces al día',
    pasos: '1) Siéntate y fija la mirada suave en un punto (no fuerces). 2) Escucha todos los sonidos a la vez sin nombrarlos. 3) Siente el cuerpo entero. 4) Cuando un pensamiento te lleve, vuelve al sonido. Usa el botón de abajo con tiempo.',
    tip: 'Caminar mirando el horizonte (playa, cerro) y la "marcha" lenta ayudan más que pelear con la mente.' },
  { id: 'nohacer', n: 'Un no-hacer al día (rompe la rutina)', ico: '🌀', tiempo: '5 min',
    pasos: 'Haz algo cotidiano de forma no habitual: come con la otra mano, camina otra ruta, báñate con agua un poco más fría, escribe con letra distinta, duerme al otro lado. Pequeño pero real.',
    tip: 'El no-hacer afloja el punto de encaje: le dice al cuerpo "hay más de una forma de ser yo".' },
  { id: 'ensueno', n: 'Ensueño: higiene del soñar', ico: '🌙', tiempo: '5 min noche + 2 min mañana',
    pasos: 'Noche: repite 3 veces tu intención ("esta noche me doy cuenta de que sueño; miro mis manos"). Deja libreta al lado. Mañana: anota 3 imágenes aunque no tengan sentido. Viernes: relee la semana buscando señales repetidas.',
    tip: '💭 Diario Sueños del calendario es tu bitácora madre: el botón de abajo te lleva directo.' },
  { id: 'muerte', n: 'La muerte como consejera', ico: '💀', tiempo: '2 min ante una decisión',
    pasos: 'Imagina que te queda 1 año (o 1 día) de vida. Mira tu dilema desde ahí: ¿esto importaría? ¿qué elegiría mi guerrero? Actúa en consecuencia hoy, no "algún día".',
    tip: 'No es morbo: es filtro. Lo trivial se cae solo y lo esencial pide acción inmediata.' },
  { id: 'historia', n: 'Borrar la historia personal', ico: '🧹', tiempo: '1 acto por semana',
    pasos: 'Deja de contarte igual: 1 semana sin repetir tu "historia de siempre" (la queja, el trauma-tarjeta, el título). Prueba 1 cosa que "tú no haces". Que te conozcan por tus actos de hoy.',
    tip: 'Empieza chico: cambia tu presentación, tu ruta, tu respuesta automática ("yo soy así").' },
  { id: 'tirano', n: 'Desatino controlado y pequeños tiranos', ico: '🎭', tiempo: 'ante cada roce difícil',
    pasos: 'Ante alguien difícil: 1) No te lo tomes personal (es tu maestro). 2) Elige tu respuesta como actor impecable (firme + amable). 3) Después anota: ¿qué botón me apretó? ¿qué acuerdo me salvó?',
    tip: 'El tirano no se evita: se usa. Te muestra justo donde pierdes impecabilidad.' },
  { id: 'intento', n: 'Caminata de intento (silencio en movimiento)', ico: '🚶', tiempo: '10 min sin audífonos',
    pasos: 'Camina 10 min sintiendo pasos + respiración + entorno a la vez. Lleva 1 intención clara en el pecho (ej: "suelto el apuro"). Al volver, anota 1 frase de lo visto.',
    tip: 'Ideal en Penco: borde costero, plaza o cerro. El viento sur ordena la cabeza mejor que el scroll.' }
];

var TOL_TEST = [
  { c: 'A', txt: 'Registro lo que hago en el día (no solo lo pienso): sé qué me gatilla.' },
  { c: 'E', txt: 'Recuerdo mis sueños al menos 2-3 veces por semana.' },
  { c: 'I', txt: 'Suelto rencores o enganches en días, no en meses.' },
  { c: 'S', txt: 'Mi cabeza no para: repaso y planeo sin descanso.' },
  { c: 'A', txt: 'Cumplo lo que digo (a otros y a mí) casi siempre.' },
  { c: 'E', txt: 'Antes de dormir pongo intención de soñar consciente.' },
  { c: 'I', txt: 'Ante un roce difícil, elijo mi respuesta en vez de explotar.' },
  { c: 'S', txt: 'Me tomo personal críticas o indiferencias y me dan vueltas.' },
  { c: 'A', txt: 'Detecto cuando supongo y pregunto en vez de inventar.' },
  { c: 'E', txt: 'Anoto sueños o señales (ya tengo libreta o app).' },
  { c: 'I', txt: 'Hago mi máximo real del día sin quemarme ni tirarme a menos.' },
  { c: 'S', txt: 'Repito mi "historia de siempre" para justificarme.' },
  { c: 'A', txt: 'Evito el chisme: no lo inicio ni lo alimento.' },
  { c: 'E', txt: 'En el día practico atención (mirar, escuchar, sentir el cuerpo).' },
  { c: 'I', txt: 'Uso la idea de la muerte para priorizar lo esencial.' },
  { c: 'S', txt: 'Me cuesta estar en silencio sin celu o ruido.' },
  { c: 'A', txt: 'Reviso mi día de noche: qué rompí, qué sostuve.' },
  { c: 'E', txt: 'He tenido al menos un sueño lúcido o casi-lúcido.' },
  { c: 'I', txt: 'Cambio rutinas a propósito (rutas, mano, horarios) sin drama.' },
  { c: 'S', txt: 'Mi autocrítica interna es dura y frecuente.' }
];
var TOL_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var TOL_ARTES = {
  A: { nombre: 'Acecho (guerrero sobrio)', ico: '🐾', desc: 'Tu fuerza está en la vigilia: registrarte, cumplir tu palabra, no suponer, cazar rutinas. Don: impecabilidad en acto. Riesgo: volverte rígido o juez de ti mismo.',
       entrena: 'Acecho del día 🐾 + 1 no-hacer 🌀 por día. Revisión nocturna de 3 líneas. Un acuerdo por luna.' },
  E: { nombre: 'Ensueño (soñador atento)', ico: '🌙', desc: 'Tu puerta es el soñar y la atención sutil: registras sueños, notas señales, paras el diálogo. Don: intuición y memoria amplia. Riesgo: volar sin anclar (mucho sueño, poca tierra).',
       entrena: 'Higiene del soñar 🌙 + silencio 🤫 3 min diarios. Ancla cada hallazgo en 1 acto concreto del día.' },
  I: { nombre: 'Intento (el que suelta y elige)', ico: '🔥', desc: 'Tu arte es soltar y dirigir energía: muerte consejera, desatino con tiranos, borrar historia. Don: libertad y humor. Riesgo: evadir lo cotidiano "porque todo es sueño".',
       entrena: 'Muerte consejera 💀 ante decisiones + 1 borrado de historia 🧹 por semana. Cierra cada día soltando 1 enganche.' }
};

var TOL_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): recapitulación. Inventario + sesiones cortas respiradas. Pregunta: ¿dónde dejé mi energía?',
  'Lunas 4-6 (Pewu · primavera): los 4 acuerdos, uno por semana. Acecho diario + 1 no-hacer al día.',
  'Lunas 7-9 (Walung · verano): probarse con gente. Desatino con pequeños tiranos + borrar historia. El roce muestra lo que el cojín esconde.',
  'Lunas 10-13 (Rimu · otoño): ensueño. Higiene del soñar + silencio diario + releer bitácora y elegir 1 arte madre para el próximo ciclo.'
];

/* ============================================================
   DIÁLOGO
   ============================================================ */
function buildDialog() {
  var acGrid = TOL_ACUERDOS.map(function (it) {
    return '<button type="button" class="btn tol-ac-card" data-ac="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.n) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var testHTML = TOL_TEST.map(function (q, i) {
    var opts = TOL_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="tolQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var practHTML = TOL_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p style="font-size:12px">' + esc(p.pasos) + '</p>' +
      '<p class="muted" style="font-size:12px">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn tol-pract-add" data-p="' + esc(p.n) + '" style="width:auto">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabTolGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabTolAcuerdos" class="btn" style="width:auto">🤝 5 Acuerdos</button>' +
    '<button type="button" id="tabTolPract" class="btn" style="width:auto">🛠️ Prácticas</button>' +
    '<button type="button" id="tabTolTest" class="btn" style="width:auto">📝 Test guerrero</button>' +
    '<button type="button" id="tabTolCamino" class="btn" style="width:auto">🌱 Mi camino</button></div>' +

    '<div id="tolGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🦅 ¿Qué son las prácticas toltecas?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Tolteca = <b>artista y hombre/mujer de conocimiento</b> del México antiguo. Lo que hoy practicamos viene sobre todo del linaje de <b>don Juan Matus</b> contado por <b>Carlos Castaneda</b> (<i>Las enseñanzas de don Juan, Viaje a Ixtlán, El arte de ensoñar</i>…), más la síntesis simple de <b>don Miguel Ruiz</b> (<i>Los Cuatro Acuerdos</i>). No es religión ni club: es un <b>camino del guerrero en la vida diaria</b> —cazar tus rutinas, soñar con atención y soltar lo que te roba energía.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Idea de una línea: <b>deja de gastarte en lo que no importa</b>. Recapitulando el pasado, acechándote en el presente y ensoñando el futuro recuperas energía para vivir impecable: decir, hacer y soltar a tiempo.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🗺️ El mapa en 6 piezas</h4>' +
    '<p class="muted" style="font-size:12px"><b>1) Tonal y nagual:</b> lo conocido (tu mundo ordenado) y lo desconocido (todo lo demás). El guerrero honra ambos. <b>2) Punto de encaje:</b> donde "sintonizas" tu realidad; se mueve con no-haceres, silencio y ensueño. <b>3) 3 artes:</b> acecho (actuar sobrio), ensueño (atención soñando), intento (dirigir energía). <b>4) 4 enemigos:</b> miedo → claridad → poder → vejez/cansancio. Cada victoria pide humildad. <b>5) Impecabilidad:</b> hacer tu máximo, nada más. <b>6) Muerte aliada:</b> te recuerda lo esencial.</p></div>' +
    '<div class="menstrual-card"><h4>📚 El linaje en 1 minuto</h4>' +
    '<p class="muted" style="font-size:12px">Don Juan Matus (yaqui, Sonora) enseña a Castaneda (antropólogo, años 60-70) 13 años: <b>plantas, acecho, ensueño, intento</b>. Su compañero <b>don Genaro</b> muestra el nagual con humor. Décadas después, <b>Ruiz</b> resume la ética en 4 (+1) acuerdos y <b>Víctor Sánchez / Theun Mares</b> ordenan el acecho para gente común. Lee el original si te engancha: <i>Viaje a Ixtlán</i> es la mejor puerta.</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar sin grupo? (rutina mínima)</summary>' +
    '<p class="muted" style="font-size:12px"><b>Mañana:</b> intención del día + 1 no-hacer. <b>Día:</b> acecho x3 (gatillo + acto + acuerdo) y silencio 3 min. <b>Noche:</b> recapitulación de 10 min + anotar sueños al despertar. <b>Por luna:</b> 1 acuerdo madre + 1 borrado de historia + releer diario. 15-20 min diarios bastan; la constancia mueve el punto de encaje.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados (léeme)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Esto es <b>autoconocimiento educativo</b>, no terapia ni religión. ✅ Las plantas de poder del relato <b>NO se practican aquí</b>: el camino que proponemos es sobrio (respiración, acecho, ensueño, silencio). ❌ Ningún linaje serio pide plata grande, obediencia ciega ni sexo/secretos. Desconfía de "chamanes" exprés. ✅ Con trauma, duelo fresco o crisis, practica acompañado (terapeuta, CESFAM, *4141 en Chile 24 h). Si un ejercicio te desborda, detente, camina, toma agua y conversa.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Toltecas × 13 lunas</h4><div id="tolLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puentes dentro de la app: 🔁 <b>Recapitulación</b> (inventario largo) · 💭 <b>Diario Sueños</b> (bitácora madre) · 🛤️ <b>Cuarto Camino</b> (recuerdo de sí) · 📿 <b>Métodos</b> (ficha tolteca).</p></div>' +
    '</div>' +

    '<div id="tolAcuerdos" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="tolQ" placeholder="ej: palabra, personal, suponer, máximo, escéptico..." maxlength="40"></label></div>' +
    '<div id="tolAcGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + acGrid + '</div>' +
    '<div id="tolDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca un acuerdo para ver su ficha completa 👆</p></div></div>' +

    '<div id="tolPract" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🤫 Silencio guiado — 3 minutos</h4>' +
    '<p class="muted" style="font-size:12px">Fija la mirada suave, escucha todo a la vez, siente el cuerpo. El botón te marca el tiempo; al terminar anota tu acecho del día.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" id="tolSilencioBtn" class="btn btn-accent" style="width:auto">▶ Silencio ahora (3 min)</button>' +
    '<span id="tolSilencioMsg" class="muted" style="font-size:12px"></span></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Acecho de hoy (gatillo → acto → acuerdo) <input type="text" id="tolAcechoHoy" placeholder="ej: taco → respiré, no toqué bocina → no personal" maxlength="140"></label></div>' +
    '<div class="conv-row"><label>Ensueño de anoche <input type="text" id="tolEnsuenoHoy" placeholder="ej: soñé mar revuelto + manos; señal: soltar control" maxlength="140"></label>' +
    '<label>No-hacer de hoy <input type="text" id="tolNoHacerHoy" placeholder="ej: caminé otra ruta sin celu" maxlength="100"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button type="button" id="tolPractSave" class="btn btn-accent" style="width:auto">💾 Guardar día guerrero</button>' +
    '<button type="button" id="tolGoRecap" class="btn" style="width:auto">🔁 Ir a Recapitulación</button>' +
    '<button type="button" id="tolGoSuenos" class="btn" style="width:auto">💭 Ir a Diario Sueños</button></div></div>' +
    practHTML + '</div>' +

    '<div id="tolTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test: ¿qué guerrero eres? (20 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo eres casi siempre</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide tus 3 artes (Acecho · Ensueño · Intento) + <b>nivel de diálogo interno</b> (S). <b>No es diagnóstico</b>: es un espejo para elegir por dónde empezar.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="tolTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="tolTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="tolProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="tolTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="tolResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="tolCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi arte</h4>' +
    '<div class="conv-row"><label>Mi arte dominante <select id="tolMiArte"><option value="">— sin definir —</option><option value="A">🐾 Acecho</option><option value="E">🌙 Ensueño</option><option value="I">🔥 Intento</option></select></label></div>' +
    '<div id="tolMiArteBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario del guerrero</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="tolDiaFecha"></label></div>' +
    '<label>Hoy en mi camino… (acecho + ensueño + acuerdo) <input type="text" id="tolDiaTxt" placeholder="ej: no supuse con mi hija, pregunté; soñé río; acuerdo: máximo" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="tolDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="tolDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌀 Mis días guerreros (racha de impecabilidad)</h4><div id="tolPractsBox"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="tolHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="tolStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="tolShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="tolToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="tolClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('toltecaDialog', '🦅 Prácticas Toltecas — el camino del guerrero',
    'Acecho, ensueño e intento para la vida común: recupera energía, cumple tu palabra y sueña con atención. Sin grupo ni humo: en Penco, en tu casa, hoy. Todo <b>privado y local</b>.',
    body);
}

function renderLunasBox() {
  var box = $('tolLunasBox'); if (!box) return;
  box.innerHTML = TOL_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalle(id) {
  var box = $('tolDetalle'); if (!box) return;
  var t = tolAcuerdo(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.ico + ' ' + esc(t.n) + '</h4>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(t.idea) + '</p>' +
    '<p style="font-size:12px">🧰 <b>¿Cuándo sirve?</b> ' + esc(t.sirve) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica de hoy</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta que despierta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<p class="muted" style="font-size:12px">⚠️ Trampa típica: ' + esc(t.trampa) + '</p>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn" id="tolFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="tolHoyBtn" style="width:auto">✓ Trabajar este hoy</button></div>';
  var fb = $('tolFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('tolHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🤝 Hoy trabajo: ' + t.n + ' — ' + t.pregunta;
    save('Acuerdo llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function filterAcuerdos() {
  var q = (($('tolQ') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#tolAcGrid .tol-ac-card');
  cards.forEach(function (card) {
    var t = tolAcuerdo(card.dataset.ac);
    if (!t) return;
    var hay = ((t.n + ' ' + t.tag + ' ' + t.idea).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function calcTest() {
  var sc = { A: 0, E: 0, I: 0, S: 0 };
  var contestadas = 0;
  for (var i = 0; i < TOL_TEST.length; i++) {
    var sel = document.querySelector('input[name="tolQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[TOL_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('tolProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + TOL_TEST.length + ' respondidas' + (r.contestadas < TOL_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ listo para calcular');
}
function showResultado(sc) {
  var box = $('tolResultado'); if (!box) return;
  var arr = [{ k: 'A', p: sc.A }, { k: 'E', p: sc.E }, { k: 'I', p: sc.I }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max(arr[0].p, 1);
  var dom = arr[0].k;
  var dial = sc.S;
  var dialTxt = dial <= 5 ? 'Quieto: hay silencio disponible. Sostén con 3 min diarios.' : dial <= 9 ? 'Medio: parloteo frecuente. Silencio + caminata te cambian la luna.' : 'Ruidoso: la mente manda. Parte por 1 silencio + 1 no-hacer, sin exigirte todo.';
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted" style="font-size:11px">Máximo por arte: 15 (5 preguntas × 3). Diálogo (S): máximo 15 — mientras más alto, más ruido.</p>' +
    arr.map(function (a) {
      var c = TOL_ARTES[a.k];
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px"><b>' + c.ico + ' ' + esc(c.nombre) + '</b></span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>' + TOL_ARTES[dom].ico + ' Tu arte fuerte: ' + esc(TOL_ARTES[dom].nombre) + '</h4>' +
    '<p>' + esc(TOL_ARTES[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(TOL_ARTES[dom].entrena) + '</p>' +
    '<p class="muted">🌀 Diálogo interno: <b>' + dial + '/15</b> — ' + esc(dialTxt) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="tolSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="tolSetArte" style="width:auto">✓ Mi arte: ' + esc(TOL_ARTES[dom].nombre) + '</button>' +
    '<button type="button" class="btn" id="tolReadAc" style="width:auto">📖 Leer acuerdo que me sirve</button></div>';
  var sv = $('tolSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), A: sc.A, E: sc.E, I: sc.I, S: sc.S, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('tolSetArte');
  if (st) st.onclick = function () {
    var d = store(); d.miArte = dom; save('Tu arte guardado ✓');
    syncMiArte(); renderMiArteBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('tolReadAc');
  if (ri) ri.onclick = function () {
    var map = { A: 'suponer', E: 'esceptico', I: 'personal' };
    switchTab('Acuerdos'); renderDetalle(map[dom] || 'maximo');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiArte() {
  var sel = $('tolMiArte'); if (!sel) return;
  sel.value = store().miArte || '';
}
function renderMiArteBox() {
  var box = $('tolMiArteBox'); if (!box) return;
  var k = store().miArte || '';
  if (!k || !TOL_ARTES[k]) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o elígelo arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = TOL_ARTES[k];
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
  var box = $('tolPractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted" style="font-size:11px">🔥 Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) guerrero(s) · acecho + ensueño + no-hacer.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b><br>' +
        (r.acecho ? '🐾 ' + esc(r.acecho) + '<br>' : '') + (r.ensueno ? '🌙 ' + esc(r.ensueno) + '<br>' : '') + (r.nohacer ? '🌀 ' + esc(r.nohacer) : '') + '</span>' +
        '<button type="button" class="btn btn-icon tol-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin días aún. Guarda tu primer día guerrero arriba 🦅.</p>');
  box.querySelectorAll('.tol-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('tolDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 3 líneas bastan: acecho + ensueño + acuerdo.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon tol-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.tol-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('tolHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · 🐾' + r.A + ' 🌙' + r.E + ' 🔥' + r.I + ' · fuerte <b>' + esc(r.dom || '') + '</b> · diálogo ' + esc(String(r.S)) + '/15</span>' +
      '<button type="button" class="btn btn-icon tol-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.tol-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('tolStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miArte ? TOL_ARTES[e.miArte].nombre : 'sin arte';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) guerrero(s) · ' + c;
}

/* Silencio timer 3 min */
var tolSilTimer = null;
function runSilencio() {
  var msg = $('tolSilencioMsg'), btn = $('tolSilencioBtn');
  if (!msg) return;
  if (tolSilTimer) { clearInterval(tolSilTimer); tolSilTimer = null; if (btn) btn.textContent = '▶ Silencio ahora (3 min)'; msg.textContent = ''; return; }
  var seg = 180;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Escucha todo a la vez, sin nombrar… 3:00';
  tolSilTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(tolSilTimer); tolSilTimer = null;
      if (btn) btn.textContent = '▶ Silencio ahora (3 min)';
      msg.textContent = '✓ Listo. ¿Qué quedó cuando calló la mente? Anota tu acecho abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    if (seg === 90) msg.textContent = 'Siente el cuerpo entero… 1:30';
    else if (seg === 30) msg.textContent = 'Vuelve suave al sonido… 0:30';
    else msg.textContent = 'Escucha y siente… ' + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

/* Puente hacia Métodos: botón "Abrir mis Prácticas Toltecas" en su ficha */
function puenteMetodos() {
  try {
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (tries > 40) { clearInterval(iv); return; }
      var dlg = $('metodosDialog') || document.getElementById('metodosDialog');
      if (!dlg) return;
      var html = dlg.innerHTML || '';
      if (html.toLowerCase().indexOf('tolteca') < 0 && html.toLowerCase().indexOf('castaneda') < 0) return;
      if ($('tolOpenFromMetodos')) { clearInterval(iv); return; }
      var btns = dlg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var t = (b.textContent || '').toLowerCase();
        if (t.indexOf('tolteca') >= 0 || t.indexOf('castaneda') >= 0 || t.indexOf('cuatro acuerdos') >= 0) {
          var open = document.createElement('button');
          open.type = 'button'; open.id = 'tolOpenFromMetodos';
          open.className = 'btn btn-accent'; open.style.width = 'auto'; open.style.marginLeft = '8px';
          open.textContent = '🦅 Abrir mis Prácticas Toltecas';
          open.onclick = function (ev) { try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {} openTolteca(); };
          try { b.parentNode.insertBefore(open, b.nextSibling); } catch (e) { dlg.appendChild(open); }
          clearInterval(iv); return;
        }
      }
    }, 500);
  } catch (e) {}
}

function openTolteca() {
  try {
    if ($('tolDiaFecha') && !$('tolDiaFecha').value) $('tolDiaFecha').value = todayKey();
    syncMiArte(); renderMiArteBox(); renderDiario(); renderHist(); renderPracts(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('toltecaDialog');
}
try { window.openTolteca = openTolteca; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > Interior (tras Recap si existe) */
  try {
    if (!$('btnTolteca')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnTolteca'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🦅 Prácticas Toltecas';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'tolteca toltecas castaneda don juan don genaro ixtlan cuatro acuerdos ruiz acecho ensueno intento recapitulacion no hacer punto encaje tonal nagual dialogo interno silencio impecabilidad muerte consejera tirano desatino guerrero camino guerrero hombre conocimiento');
        var ref = g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnTolteca');
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnTolteca') < 0) ALL_BTNS.push('btnTolteca');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnTolteca = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnTolteca') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnRecap');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnTolteca');
      else BTN_ORDER['linaje|interior'].push('btnTolteca');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnTolteca = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnTolteca"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnTolteca"> 🦅 Prácticas Toltecas';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnTolteca !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnTolteca = lab.querySelector('input').checked;
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
  try { addKw('btnMetodos', 'tolteca castaneda cuatro acuerdos acecho ensueno'); } catch (e2) {}
  try { addKw('btnRecap', 'tolteca guerrero acecho ensueno'); } catch (e3) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiArte();
  renderMiArteBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderStats();

  var b = $('btnTolteca');
  if (b) b.onclick = function () { openTolteca(); };

  ['Guia', 'Acuerdos', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabTol' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('tolQ'); if (q) q.oninput = filterAcuerdos;
  document.querySelectorAll('#tolAcGrid .tol-ac-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.ac); };
  });
  document.querySelectorAll('.tol-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('tolSilencioBtn'); if (sb) sb.onclick = runSilencio;
  var ps = $('tolPractSave');
  if (ps) ps.onclick = function () {
    var az = clean((($('tolAcechoHoy') || {}).value || ''), 140);
    var en = clean((($('tolEnsuenoHoy') || {}).value || ''), 140);
    var nh = clean((($('tolNoHacerHoy') || {}).value || ''), 100);
    if (!az && !en && !nh) { alert('Escribe al menos tu acecho, tu ensueño o tu no-hacer de hoy 🦅'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), acecho: az, ensueno: en, nohacer: nh });
    var txt = '🦅 Día guerrero';
    if (az) txt += ' · 🐾 ' + az;
    if (en) txt += ' · 🌙 ' + en;
    if (nh) txt += ' · 🌀 ' + nh;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día guerrero guardado ✓');
    if ($('tolAcechoHoy')) $('tolAcechoHoy').value = '';
    if ($('tolEnsuenoHoy')) $('tolEnsuenoHoy').value = '';
    if ($('tolNoHacerHoy')) $('tolNoHacerHoy').value = '';
    renderPracts(); renderDiario(); renderStats();
  };
  var gr = $('tolGoRecap');
  if (gr) gr.onclick = function () { try { var r = $('btnRecap'); if (r) r.click(); else alert('Abre 🔁 Recapitulación desde Interior'); } catch (e) {} };
  var gs = $('tolGoSuenos');
  if (gs) gs.onclick = function () { try { var r2 = $('btnDreams'); if (r2) r2.click(); else alert('Abre 💭 Diario Sueños desde Mi Día'); } catch (e) {} };

  var tc = $('tolTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < TOL_TEST.length) { alert('Te faltan ' + (TOL_TEST.length - r.contestadas) + ' por responder para un espejo fiel 🦅'); }
    showResultado(r.sc);
  };
  var tr = $('tolTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < TOL_TEST.length; i++) {
      document.querySelectorAll('input[name="tolQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('tolResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#tolTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('tolMiArte');
  if (ma) ma.onchange = function () { var e = store(); e.miArte = ma.value || ''; save('Tu arte guardado ✓'); renderMiArteBox(); renderStats(); };
  var da = $('tolDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('tolDiaFecha') || {}).value || todayKey();
    var t = clean((($('tolDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu camino de hoy 🦅'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('tolDiaTxt')) $('tolDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('tolShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miArte ? TOL_ARTES[e.miArte].nombre : 'arte por definir';
    share('🦅 Mis Prácticas Toltecas', 'Camino del guerrero · ' + c + '\n🔥 Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días guerreros · ' + nd + ' días de diario · ' + e.tests.length + ' test(s).\n' + TOL_LUNAS[0]);
  };
  var tn = $('tolToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miArte ? TOL_ARTES[e.miArte].nombre : 'camino del guerrero';
      var txt2 = '🦅 Toltecas (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy practico 1 acuerdo + 1 no-hacer');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('tolClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu camino tolteca (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.tolteca = blank();
    } catch (e) {}
    syncMiArte(); renderMiArteBox(); renderDiario(); renderHist(); renderPracts(); renderStats();
    save('Camino tolteca borrado');
  };

  puenteMetodos();
  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
