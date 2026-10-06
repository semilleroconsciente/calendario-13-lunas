/* ============================================================
   CONSTELACIONES FAMILIARES — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnConstelaciones (grupo Linaje > Familia, tras btnVozAbuelos)
   - Diálogo constelDialog con 5 pestañas:
     1) Guía (qué es, Hellinger en 1 min, órdenes del amor,
        cómo es un taller, cómo practicar a solas sin riesgo,
        cuidados y límites)
     2) Órdenes (8 fichas: pertenencia, jerarquía, equilibrio,
        asentir, lugar de hijo, honrar sin cargar,
        soltar expiación, lo nuevo + buscador + detalle +
        favorita + "honrar hoy")
     3) Prácticas (8 ejercicios individuales seguros +
        respiración de raíces 3 min + registro del día)
     4) Test (20 afirmaciones: ¿pertenencia, orden o
        equilibrio? + nivel de carga heredada)
     5) Mi camino (mi tema, diario, ejercicios, historial,
        racha, compartir, llevar a nota, borrar)
   - Todo local y privado por usuario: userData().constel
     { tests:[], miTema:'', practs:[], diario:{}, favs:[] }
   - Puentes: Árbol Genealógico (🌳), Duelo (🕊️),
     Recapitulación (🔁), Voz de los Abuelos (🗣️).
   - Educativo y de autoconocimiento, NO terapia ni
     constelación real: aquí nadie representa a tu familia,
     solo tú reflexionas a solas y a tu ritmo. 100% offline.
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
function blank() { return { tests: [], miTema: '', practs: [], diario: {}, favs: [] }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.constel) u.constel = blank();
    var e = u.constel;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.practs)) e.practs = [];
    if (!e.diario) e.diario = {};
    if (!Array.isArray(e.favs)) e.favs = [];
    if (typeof e.miTema !== 'string') e.miTema = '';
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
  ['Guia', 'Orden', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var p = $('const' + t), b = $('tabConst' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   DATOS — 8 órdenes y movimientos (lenguaje simple y cuidadoso)
   ============================================================ */
var CONST_ORDENES = [
  { id: 'pertenencia', n: 'Todos pertenecen', ico: '🧺', tag: 'pertenencia excluir excluido todos parte olvidados',
    frase: '“Tú también eres parte. Te veo y te doy tu lugar.”',
    idea: 'En una familia nadie sobra: también pertenecen quien partió joven, quien se fue peleado, la hija o hijo no reconocido, la pareja anterior que hizo espacio. Cuando alguien es borrado, otro más joven suele cargarlo sin saberlo (repitiendo su destino o su pena).',
    sirve: 'Secretos familiares, alguien de quien “no se habla”, sentir que sobras, hijos que repiten historias de tíos o abuelos.',
    practica: 'Nombra hoy a 1 excluido en tu corazón: “tío X, eres parte de esta familia”. Si puedes, pregunta 1 dato de esa persona a un mayor.',
    trampa: 'Obligarte a querer a quien te dañó. Pertenecer no es abrazar al daño: es reconocer que existió, a distancia segura.',
    pregunta: '¿A quién de mi familia nadie nombra?' },
  { id: 'jerarquia', n: 'Cada uno en su lugar (jerarquía)', ico: '🪜', tag: 'jerarquia orden lugar antes despues mayores menores',
    frase: '“Tú llegaste antes; yo llegué después. Te respeto.”',
    idea: 'Quien llegó antes tiene prioridad: abuelos antes que padres, padres antes que hijos, primera pareja antes que la segunda. El desorden típico: la hija que manda a la madre, el hijo que se mete en la pareja de sus padres. Cada uno vuelve a su tamaño.',
    sirve: 'Hijos que retan a sus padres como si fueran sus hijos, hermanos que hacen de papá, meterse en peleas de pareja ajena.',
    practica: 'Ante un impulso de mandar arriba, di dentro: “soy la hija menor, no la madre”. Devuelve el mando a quien corresponde.',
    trampa: 'Usar la jerarquía para obedecer abusos (“es mi padre, aguanto”). El respeto no quita tu derecho a ponerte a salvo.',
    pregunta: '¿Dónde estoy mandando donde me toca obedecer (o al revés)?' },
  { id: 'equilibrio', n: 'Dar y recibir en su medida', ico: '⚖️', tag: 'equilibrio dar recibir medida deuda gratitud pareja',
    frase: '“Te doy lo que puedo y recibo lo que me das. Así quedamos libres.”',
    idea: 'Entre adultos (pareja, amistad) lo sano es equilibrar: doy y recibo parecido. Si solo doy, me agoto y el otro se achica; si solo recibo, quedo en deuda incómoda. Con los padres es distinto: ellos dieron la vida, eso no se devuelve; se pasa hacia adelante (a tus hijos o a la vida).',
    sirve: 'Parejas donde una parte da todo, amistades de puro pedir, culpa eterna con los padres por “todo lo que hicieron”.',
    practica: 'Hoy: recibe 1 cosa sin devolverla al tiro (un cumplido, ayuda, un mate). Y da 1 cosa sin cobrarla después.',
    trampa: 'Llevar cuentas frías (“te di 3, me debes 3”). El equilibrio se siente en el cuerpo, no en planilla.',
    pregunta: '¿Doy de más para que me quieran, o recibo de menos por orgullo?' },
  { id: 'asentir', n: 'Asentir a lo que fue', ico: '🌧️', tag: 'asentir destino aceptar pasado lo que fue realidad',
    frase: '“Fue así. Lo tomo como fue y sigo con mi vida.”',
    idea: 'Asentir no es estar de acuerdo ni perdonar obligado: es dejar de pelear con lo que ya pasó (la infancia que tuve, el padre que me tocó, la pérdida). Pelear con el pasado gasta la energía del presente.',
    sirve: 'Rencores viejos que dan vuelta, “si mi mamá hubiera…”, duelos atorados en el reclamo.',
    practica: 'Elige 1 hecho pasado que aún peleas. Respira 4-6 y di: “fue así”. Nota qué se suelta en el pecho. Solo 1 por día.',
    trampa: 'Asentir a lo que sigue pasando (violencia actual, deuda activa). Lo pasado se asiente; lo presente se enfrenta y se pone límite.',
    pregunta: '¿Qué pasado sigo queriendo cambiar?' },
  { id: 'lugar-hijo', n: 'Yo soy la hija / el hijo', ico: '🌱', tag: 'hijo hija lugar pequeno parentificacion cuidar padres',
    frase: '“Soy tu hija. Tú eres la grande y yo la pequeña. Yo me encargo de mi vida.”',
    idea: 'El movimiento que más alivia: volver a ser hija o hijo. Muchas hijas se vuelven “madres de su madre” (parentificación): consuelan, pagan, deciden. El amor ciego dice “yo por ti”; el amor que sana dice “tú eres grande, yo soy pequeña”.',
    sirve: 'Cansancio de sostener a tus padres, culpa si disfrutas, no poder irte de la casa por dentro aunque vivas lejos.',
    practica: 'Visualización de 2 min: imagina a tus padres delante, tú detrás más pequeña. Inclina la cabeza y di la frase. Si lloras suave, es buena señal; si te desbordas, detente.',
    trampa: 'Abandonar a padres enfermos llamándolo “mi lugar”. Ocupar tu lugar no quita ayudar: quita hacerte cargo de su destino.',
    pregunta: '¿De quién me estoy haciendo cargo como si fuera su madre o padre?' },
  { id: 'honrar', n: 'Honrar sin cargar', ico: '🕯️', tag: 'honrar ancestros agradecer cargar lealtad sana',
    frase: '“Gracias por la vida que me llega a través de ti. Lo demás lo dejo contigo.”',
    idea: 'Honrar es agradecer la vida que pasó por ellos, incluso si fallaron en lo demás. Cargar es llevar su pena, su culpa o su enfermedad como prueba de amor. La lealtad sana dice: “te honro viviendo bien”; la lealtad ciega dice: “si tú sufriste, yo sufro”.',
    sirve: 'Culpa por ser feliz si tu madre sufrió, dejar estudios o parejas “para no traicionar”, enfermarse como la abuela.',
    practica: 'Enciende una vela (o mira una foto) y di la frase a 1 ancestro. Después haz 1 acto de vida buena hoy (estudiar, pasear, reír).',
    trampa: 'Honrar de boca y seguir castigándote. La honra se mide en cómo vives, no en velas.',
    pregunta: '¿A quién intento demostrarle amor sufriendo?' },
  { id: 'expiacion', n: 'No pago culpas ajenas', ico: '🔓', tag: 'expiacion culpa pagar castigo destino repetir fracaso',
    frase: '“Esto es tuyo. Te lo devuelvo con amor y me quedo con mi vida.”',
    idea: 'A veces un hijo paga culpas que no son suyas: fracasa para acompañar al padre quebrado, no tiene hijos por la abuela que perdió los suyos, se enferma donde otro enfermó. Devolver no es frialdad: es dejar cada destino con su dueño.',
    sirve: 'Fracasos repetidos justo cuando te iba bien, elegir parejas imposibles como mamá, miedos que no calzan con tu historia.',
    practica: 'Escribe lo que cargas (“culpa de…”, “pena de…”) y al lado de quién es. Lee la frase en voz alta y rompe o guarda el papel. 1 tema por vez.',
    trampa: 'Culpar a los muertos de todo (“mi abuela me bloquea”). Sirve para soltar, no para acusar ni para no hacerte cargo de tu parte.',
    pregunta: '¿Qué carga llevo que empezó antes de que yo naciera?' },
  { id: 'lonuevo', n: 'Lo nuevo cuida lo anterior', ico: '🌅', tag: 'nuevo pareja hijos presente precedencia avanzar',
    frase: '“Gracias por lo que fue. Ahora elijo lo que viene.”',
    idea: 'Lo nuevo (tu pareja actual, tus hijos, tu casa de hoy) tiene preferencia sobre lo anterior. Mirar solo atrás —la ex pareja, la casa de infancia, el duelo sin cierre— deja sin fuerza lo de hoy. Honrar atrás y servir adelante.',
    sirve: 'Comparar la pareja actual con la anterior, vivir para la familia de origen y descuidar la propia, duelos que no dejan vivir.',
    practica: 'Hoy dedica tu mejor hora a lo nuevo (tu pareja, tus hijos, tu proyecto) sin hablar del pasado. Agradece atrás, riega adelante.',
    trampa: 'Borrar lo anterior (“nueva vida, gente nueva, chao todos”). Lo nuevo florece cuando lo anterior está honrado, no amputado.',
    pregunta: '¿Mi energía está en lo de hoy o secuestrada por lo de antes?' }
];
function constOrden(id) { for (var i = 0; i < CONST_ORDENES.length; i++) if (CONST_ORDENES[i].id === id) return CONST_ORDENES[i]; return null; }

var CONST_PRACTICAS = [
  { id: 'raices', n: 'Respiración de raíces (volver al cuerpo)', ico: '🌳', tiempo: '3 min, cuando notes carga',
    pasos: '1) Sentada, pies bien apoyados, espalda recta. 2) Inhala 4 imaginando que sube fuerza de la tierra por tus pies. 3) Exhala 6 soltando peso hacia abajo. 4) 6-9 rondas. Manos en muslos: nota calor y peso. Usa el botón con tiempo de abajo.',
    tip: 'Si aparece pena fuerte o temblor, vuelve a respiración normal, abre los ojos, toma agua. El cuerpo manda: nunca fuerces.' },
  { id: 'genograma', n: 'Genograma consciente (3 generaciones)', ico: '📝', tiempo: '15-20 min una vez por luna',
    pasos: 'En papel dibuja tu árbol de 3 generaciones (tú, padres, abuelos + hermanos). Marca con símbolos: ✝ partió, ⚡ pelea/distancia, ❤ cercanía, ? dato que falta. No investigues como detective: anota lo que sabes y deja huecos en paz.',
    tip: 'Puente: 🌳 Árbol Genealógico del calendario guarda estos datos. Aquí el dibujo; allá la ficha.' },
  { id: 'milugar', n: 'Volver a mi lugar (visualización)', ico: '🌱', tiempo: '2-5 min',
    pasos: 'Cierra los ojos. Imagina a tu madre a la derecha y a tu padre a la izquierda, delante de ti (ellos grandes, tú pequeña). Inclina la cabeza y di dentro: “soy su hija, ellos son los grandes”. Respira. Abre los ojos y anota 1 frase de lo sentido.',
    tip: 'Si te desbordas (llanto fuerte, angustia), detente, camina, toma agua. Retoma otro día o acompañada.' },
  { id: 'frase', n: 'Frase sanadora del día', ico: '💬', tiempo: '1 min mañana y noche',
    pasos: 'Elige 1 frase de la pestaña Órdenes que te toque hoy. Dila en voz alta mirando una foto o al horizonte, 3 veces lento. Anota qué cambió en el cuerpo (pecho, hombros, respiración).',
    tip: 'Las frases no son magia: son dirección. Repite 1 luna la misma si te sirve; cambiar cada día diluye.' },
  { id: 'carta', n: 'Carta no enviada', ico: '💌', tiempo: '10-15 min, máx 1 por semana',
    pasos: 'Escribe a quien necesites (viva o que partió): lo que pasó, lo que sentí, lo que necesito, lo que te devuelvo, lo que te agradezco. No se envía: se lee en voz alta a solas y se guarda o se quema con cuidado. Cierra con agua y caminata.',
    tip: 'Si el tema es violencia o abuso, NO la escribas a solas: hazla con terapeuta o red de apoyo. Tu seguridad primero.' },
  { id: 'devolucion', n: 'Devolución con amor', ico: '🎒', tiempo: '5 min ante una carga clara',
    pasos: 'Nombra la carga (“la culpa de…”, “la pena de…”) y de quién viene. En voz alta: “esto es tuyo, te lo devuelvo con amor y me quedo con mi vida”. Imagina dejar una mochila a sus pies e irte liviana 3 pasos. Anota cómo quedas.',
    tip: '1 carga por vez. Si son muchas, empieza por la más liviana: el músculo se entrena de a poco.' },
  { id: 'honra', n: 'Honra con vela o foto', ico: '🕯️', tiempo: '5 min, 1 vez por semana',
    pasos: 'Foto, vela o vaso de agua para 1 ancestro. Dile: “gracias por la vida que me llega a través de ti. Te honro viviendo bien”. Después haz 1 acto de vida buena (llamar a una amiga, estudiar, cocinar rico). La honra se verifica en la vida.',
    tip: 'Puente con 🗣️ Voz de los Abuelos: graba 1 historia linda de esa persona para que no se pierda.' },
  { id: 'pausa', n: 'Pausa adulta (cuando hierve)', ico: '⏸️', tiempo: '90 segundos ante un roce familiar',
    pasos: 'Ante el roce: 1) No respondas al tiro. 2) Pregúntate: “¿cuántos años tengo ahora? ¿respondo como adulta o como niña herida?”. 3) Responde corto como adulta (firme + amable) o pide tiempo: “lo hablamos mañana”. Anota después qué niña se activó.',
    tip: 'Ideal con madres, parejas e hijos adolescentes: el 90% de la pelea es pasado; solo el 10% es hoy.' }
];

var CONST_TEST = [
  { c: 'P', txt: 'Siento que en mi familia sobro o estoy de más.' },
  { c: 'O', txt: 'Me siento madre o padre de mis propios padres.' },
  { c: 'E', txt: 'Doy mucho más de lo que recibo y termino agotada.' },
  { c: 'C', txt: 'Cargo culpas o tristezas que empezaron antes de que yo naciera.' },
  { c: 'P', txt: 'Hay alguien en mi familia de quien no se puede hablar.' },
  { c: 'O', txt: 'Me meto en problemas de pareja o decisiones que no me tocan.' },
  { c: 'E', txt: 'Me cuesta recibir ayuda, cumplidos o cariño.' },
  { c: 'C', txt: 'Cuando me empieza a ir bien, algo se tuerce (pareja, plata, salud).' },
  { c: 'P', txt: 'Me cuesta pedir mi lugar: hablo bajito o mejor callo.' },
  { c: 'O', txt: 'Decido por mis hermanos o familiares adultos como si fueran niños.' },
  { c: 'E', txt: 'Digo que sí cuando quiero decir que no, por no pelear.' },
  { c: 'C', txt: 'Repito la historia de alguien: parejas, embarazos, quiebras, enfermedades.' },
  { c: 'P', txt: 'Siento que debo elegir entre mi familia de origen y mi pareja o hijos.' },
  { c: 'O', txt: 'Me cuesta respetar decisiones de mis padres aunque ya sea adulta.' },
  { c: 'E', txt: 'Si recibo algo, siento deuda incómoda y quiero devolverlo al tiro.' },
  { c: 'C', txt: 'Me va mal disfrutar si mi madre o mi familia sufrió.' },
  { c: 'P', txt: 'Comparo mi familia con otras y siento vergüenza de la mía.' },
  { c: 'O', txt: 'Mis hijos me mandan o me tratan como par, no como madre o padre.' },
  { c: 'E', txt: 'En pareja, una parte da todo y la otra recibe todo.' },
  { c: 'C', txt: 'Sueño o pienso en hechos duros de antepasados que ni conocí.' }
];
var CONST_LIKERT = [
  { v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }
];
var CONST_TEMAS = {
  P: { nombre: 'Pertenencia herida', ico: '🧺', desc: 'Tu nudo está en el pertenecer: alguien fue excluido (o te sientes excluida tú) y el sistema pide incluir. Se nota en callar, sobrar o partirse entre dos bandos. Alivio: nombrar e incluir en el corazón, sin obligarte a amar al daño.',
       entrena: 'Orden 1 (Todos pertenecen) + genograma 📝 + 1 frase sanadora por luna. Si hay secreto grande, trabájalo acompañada.' },
  O: { nombre: 'Lugar invertido', ico: '🪜', desc: 'Tu nudo está en el orden: estás fuera de tu lugar (arriba cuidando, en medio mandando, abajo siendo mandada por tus hijos). Se nota en cansancio de sostener a todos. Alivio: volver a tu tamaño — hija con padres, adulta con hermanos, madre con hijos.',
       entrena: 'Órdenes 2 y 5 (jerarquía + lugar de hija) + visualización 🌱 + pausa adulta ⏸️ en cada roce.' },
  E: { nombre: 'Dador agotado', ico: '⚖️', desc: 'Tu nudo está en el dar-recibir: das de más para que te quieran (o recibes de menos por orgullo) y el vínculo se deforma. Se nota en agotamiento y deuda. Alivio: recibir 1 cosa al día y dar sin cobrar.',
       entrena: 'Orden 3 (equilibrio) + devolución 🎒 de culpas + practicar recibir sin devolver al tiro.' }
};

var CONST_LUNAS = [
  'Lunas 1-3 (Pukem · invierno): mirar. Genograma 📝 + nombrar 1 excluido + honra con vela 🕯️. Pregunta: ¿quién falta en mi mapa?',
  'Lunas 4-6 (Pewu · primavera): ordenar. Volver a mi lugar 🌱 + pausa adulta ⏸️ + 1 devolución liviana 🎒. Una carga por vez.',
  'Lunas 7-9 (Walung · verano): equilibrar. Dar-recibir ⚖️ en pareja y amistad + recibir sin culpa + cerrar 1 carta 💌.',
  'Lunas 10-13 (Rimu · otoño): honrar y soltar. Releer diario, agradecer la vida recibida y elegir 1 tema madre para el próximo ciclo.'
];

/* ============================================================
   DIÁLOGO
   ============================================================ */
function buildDialog() {
  var ordGrid = CONST_ORDENES.map(function (it) {
    return '<button type="button" class="btn const-ord-card" data-ord="' + it.id + '" style="text-align:left;height:auto;padding:10px">' +
      '<b>' + it.ico + ' ' + esc(it.n) + '</b><br>' +
      '<span class="muted" style="font-size:11px">' + esc(it.tag.split(' ').slice(0, 3).join(' · ')) + '</span></button>';
  }).join('');

  var testHTML = CONST_TEST.map(function (q, i) {
    var opts = CONST_LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="constQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');

  var practHTML = CONST_PRACTICAS.map(function (p) {
    return '<div class="menstrual-card"><h4>' + p.ico + ' ' + esc(p.n) + '</h4>' +
      '<p class="muted" style="font-size:11px">⏱ ' + esc(p.tiempo) + '</p>' +
      '<p style="font-size:12px">' + esc(p.pasos) + '</p>' +
      '<p class="muted" style="font-size:12px">💡 ' + esc(p.tip) + '</p>' +
      '<button type="button" class="btn const-pract-add" data-p="' + esc(p.n) + '" style="width:auto">+ Anotar en mi diario de hoy</button></div>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabConstGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabConstOrden" class="btn" style="width:auto">🤲 8 Órdenes</button>' +
    '<button type="button" id="tabConstPract" class="btn" style="width:auto">🛠️ Prácticas</button>' +
    '<button type="button" id="tabConstTest" class="btn" style="width:auto">📝 Test familiar</button>' +
    '<button type="button" id="tabConstCamino" class="btn" style="width:auto">🌱 Mi camino</button></div>' +

    '<div id="constGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌳 ¿Qué son las constelaciones familiares?</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Son una mirada creada por <b>Bert Hellinger</b>: cada familia es un <b>sistema</b> donde lo que le pasó a una generación mueve a la siguiente (secretos, duelos, culpas, migraciones). En un taller, una persona elige <b>representantes</b> para su familia y, con frases simples y movimientos lentos, el enredo se ve y se ordena. Aquí NO constelamos de verdad: <b>nadie representa a tu familia</b>. Solo reflexionas a solas, a tu ritmo, con ejercicios seguros.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">Idea de una línea: <b>ocupa tu lugar de hija, honra lo que fue y deja cada carga con su dueña</b>. Lo demás —pareja, hijos, trabajo— se ordena solo.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>🤲 Los 3 órdenes del amor</h4>' +
    '<p class="muted" style="font-size:12px"><b>1) Pertenencia 🧺:</b> todos tienen derecho a pertenecer. <b>2) Jerarquía 🪜:</b> quien llegó antes va primero. <b>3) Equilibrio ⚖️:</b> dar y recibir en su medida. Cuando uno se rompe aparece el enredo: exclusiones, hijas-madres, dadores agotados. Las 8 fichas de la pestaña Órdenes los explican uno por uno con su frase sanadora.</p></div>' +
    '<div class="menstrual-card"><h4>👁️ ¿Cómo es un taller real?</h4>' +
    '<p class="muted" style="font-size:12px">Una persona plantea su tema, elige representantes entre el grupo y los ubica en el espacio. El facilitador observa, mueve posiciones y propone <b>frases</b> (“te veo”, “te dejo tu destino”, “soy tu hija”). Dura 30-60 min y suele remover: por eso se hace con facilitador formado, grupo cuidado y cierre. Si te interesa vivir una, busca constelador con formación acreditada y referencias — nunca por redes con promesas mágicas.</p></div></div>' +
    '<details class="menstrual-details"><summary>🚶 ¿Cómo practicar a solas sin riesgo? (rutina mínima)</summary>' +
    '<p class="muted" style="font-size:12px"><b>Mañana:</b> 1 frase sanadora 💬 + intención (“hoy ocupo mi lugar”). <b>Ante un roce:</b> pausa adulta ⏸️ (90 segundos). <b>Noche:</b> respiración de raíces 🌳 3 min + 1 línea en tu diario. <b>Por luna:</b> avanza tu genograma 📝 + 1 honra 🕯️ + 1 devolución liviana 🎒. 10-15 min diarios bastan. Regla de oro: <b>1 tema por vez, lo liviano primero</b>.</p></details>' +
    '<details class="menstrual-details"><summary>⚠️ Cuidados y límites (léeme antes de partir)</summary>' +
    '<p class="muted" style="font-size:12px">✅ Esto es <b>autoconocimiento educativo</b>, no terapia ni constelación real. ✅ A solas trabaja solo temas livianos y con el cuerpo calmado. ⛔ <b>Detente</b> si hay llanto incontrolable, angustia fuerte, disociación o ideas de daño: camina, toma agua, habla con alguien. ⛔ Temas de <b>abuso, violence intrafamiliar, duelo fresco o trauma grave NO se trabajan a solas</b>: pide apoyo (CESFAM, terapeuta, *4141 en Chile 24 h, 149 familia). ✅ Ningún facilitador serio pide obediencia, plata grande, secretos ni favores íntimos: desconfía. ✅ Con familia mapuche u otra cosmovisión, honra primero a tus propios mayores y modos.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Constelaciones × 13 lunas</h4><div id="constLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puentes dentro de la app: 🌳 <b>Árbol Genealógico</b> (tu mapa) · 🕊️ <b>Duelo</b> (pérdidas) · 🔁 <b>Recapitulación</b> (eventos) · 🗣️ <b>Voz de los Abuelos</b> (historias).</p></div>' +
    '</div>' +

    '<div id="constOrden" class="hidden">' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="constQ" placeholder="ej: pertenecer, jerarquía, equilibrio, culpa, lugar, honrar..." maxlength="40"></label></div>' +
    '<div id="constTxGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px">' + ordGrid + '</div>' +
    '<div id="constDetalle" class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p class="muted">Toca un orden para ver su ficha completa 👆</p></div></div>' +

    '<div id="constPract" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌳 Respiración de raíces — 3 minutos</h4>' +
    '<p class="muted" style="font-size:12px">Pies en tierra, inhala 4 (sube fuerza), exhala 6 (suelta peso). El botón te marca el tiempo; al terminar anota tu día.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" id="constRespiraBtn" class="btn btn-accent" style="width:auto">▶ Respirar ahora (3 min)</button>' +
    '<span id="constRespiraMsg" class="muted" style="font-size:12px"></span></div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Hoy siento/cargo… <input type="text" id="constSientoHoy" placeholder="ej: culpa por disfrutar si mi mamá sufrió" maxlength="140"></label></div>' +
    '<div class="conv-row"><label>Lo devuelvo / ordeno así… <input type="text" id="constDevuelvoHoy" placeholder="ej: le devuelvo su pena con amor" maxlength="140"></label>' +
    '<label>Ocupo mi lugar así… <input type="text" id="constOcupoHoy" placeholder="ej: soy la hija, no su madre" maxlength="100"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button type="button" id="constPractSave" class="btn btn-accent" style="width:auto">💾 Guardar día</button>' +
    '<button type="button" id="constGoArbol" class="btn" style="width:auto">🌳 Ir a mi Árbol</button>' +
    '<button type="button" id="constGoDuelo" class="btn" style="width:auto">🕊️ Ir a Duelo</button></div></div>' +
    practHTML + '</div>' +

    '<div id="constTest" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Test: ¿dónde está mi nudo? (20 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:12px">Responde según <b>cómo eres casi siempre en tu familia</b>. Escala: Nunca (0) · A veces (1) · A menudo (2) · Muy cierto (3). ~5 minutos. Mide <b>Pertenencia 🧺 · Orden 🪜 · Equilibrio ⚖️</b> + tu <b>nivel de carga heredada 🎒</b> (C). <b>No es diagnóstico</b>: es un espejo para elegir por dónde empezar — ojalá acompañada.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="constTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="constTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi resultado</button></div>' +
    '<div id="constProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div id="constTestBox" style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="constResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="constCamino" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌱 Mi tema</h4>' +
    '<div class="conv-row"><label>Mi nudo principal <select id="constMiTema"><option value="">— sin definir —</option><option value="P">🧺 Pertenencia herida</option><option value="O">🪜 Lugar invertido</option><option value="E">⚖️ Dador agotado</option></select></label></div>' +
    '<div id="constMiTemaBox" style="margin-top:6px"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario del sistema</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="constDiaFecha"></label></div>' +
    '<label>Hoy en mi familia… (siento / devuelvo / ocupo) <input type="text" id="constDiaTxt" placeholder="ej: sentí culpa; devolví su pena; ocupé mi lugar de hija" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="constDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="constDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌳 Mis días de orden (racha)</h4><div id="constPractsBox"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de tests</h4><div id="constHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="constStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="constShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="constToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="constClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  makeDialog('constelDialog', '🌳 Constelaciones Familiares — ocupa tu lugar',
    'Pertenencia, orden y equilibrio para mirar tu sistema con amor y sin cargarlo. Ejercicios suaves y a solas, a tu ritmo. Todo <b>privado y local</b>. Esto no reemplaza terapia ni un taller real.',
    body);
}

function renderLunasBox() {
  var box = $('constLunasBox'); if (!box) return;
  box.innerHTML = CONST_LUNAS.map(function (t) {
    return '<div class="si-card"><p>' + esc(t) + '</p></div>';
  }).join('');
}

function renderDetalle(id) {
  var box = $('constDetalle'); if (!box) return;
  var t = constOrden(id); if (!t) return;
  var e = store();
  var fav = e.favs.indexOf(id) >= 0;
  box.innerHTML =
    '<h4 style="color:var(--gold)">' + t.ico + ' ' + esc(t.n) + '</h4>' +
    '<blockquote class="dlg-quote" style="font-size:12px">' + esc(t.frase) + '</blockquote>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(t.idea) + '</p>' +
    '<p style="font-size:12px">🧰 <b>¿Cuándo sirve?</b> ' + esc(t.sirve) + '</p>' +
    '<div class="si-card"><h4>✏️ Práctica de hoy</h4><p>' + esc(t.practica) + '</p><p class="muted">Pregunta que despierta: <i>' + esc(t.pregunta) + '</i></p></div>' +
    '<p class="muted" style="font-size:12px">⚠️ Trampa típica: ' + esc(t.trampa) + '</p>' +
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<button type="button" class="btn" id="constFavBtn" style="width:auto">' + (fav ? '★ Quitar de favoritas' : '☆ Marcar favorita') + '</button>' +
    '<button type="button" class="btn btn-accent" id="constHoyBtn" style="width:auto">✓ Honrar este hoy</button></div>';
  var fb = $('constFavBtn');
  if (fb) fb.onclick = function () {
    var d = store();
    var i = d.favs.indexOf(id);
    if (i >= 0) d.favs.splice(i, 1); else d.favs.push(id);
    save(); renderDetalle(id);
  };
  var hb = $('constHoyBtn');
  if (hb) hb.onclick = function () {
    var k = todayKey();
    var d = store();
    d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🤲 Hoy honro: ' + t.n + ' — ' + t.frase;
    save('Orden llevado a tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
  };
}

function filterOrdenes() {
  var q = (($('constQ') || {}).value || '').toLowerCase();
  var cards = document.querySelectorAll('#constTxGrid .const-ord-card');
  cards.forEach(function (card) {
    var t = constOrden(card.dataset.ord);
    if (!t) return;
    var hay = ((t.n + ' ' + t.tag + ' ' + t.idea + ' ' + t.frase).toLowerCase().indexOf(q) >= 0);
    card.style.display = hay ? '' : 'none';
  });
}

function calcTest() {
  var sc = { P: 0, O: 0, E: 0, C: 0 };
  var contestadas = 0;
  for (var i = 0; i < CONST_TEST.length; i++) {
    var sel = document.querySelector('input[name="constQ' + i + '"]:checked');
    if (sel) { contestadas++; sc[CONST_TEST[i].c] += +sel.value; }
  }
  return { sc: sc, contestadas: contestadas };
}
function updateProgreso() {
  var r = calcTest();
  var box = $('constProgreso');
  if (box) box.textContent = r.contestadas + ' / ' + CONST_TEST.length + ' respondidas' + (r.contestadas < CONST_TEST.length ? ' — responde todas para un espejo fiel' : ' ✓ listo para calcular');
}
function showResultado(sc) {
  var box = $('constResultado'); if (!box) return;
  var arr = [{ k: 'P', p: sc.P }, { k: 'O', p: sc.O }, { k: 'E', p: sc.E }];
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = Math.max(arr[0].p, 1);
  var dom = arr[0].k;
  var carga = sc.C;
  var cargaTxt = carga <= 5 ? 'Liviana: poca carga heredada a la vista. Sostén con 1 honra por luna.' : carga <= 9 ? 'Media: hay lealtades pesando. Trabaja 1 tema liviano por vez, ojalá acompañada.' : 'Pesada: mucha carga heredada. No lo hagas a solas: busca taller real o terapeuta y avanza 1 paso por vez.';
  box.classList.remove('hidden');
  box.innerHTML = '<h4>📊 Tu espejo (sin guardar)</h4>' +
    '<p class="muted" style="font-size:11px">Máximo por tema: 15 (5 preguntas × 3). Carga (C): máximo 15 — mientras más alta, más peso heredado.</p>' +
    arr.map(function (a) {
      var c = CONST_TEMAS[a.k];
      var pct = Math.round(a.p / max * 100);
      var isTop = dom === a.k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px"><b>' + c.ico + ' ' + esc(c.nombre) + '</b></span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;position:relative;overflow:hidden">' +
        '<span style="display:block;height:100%;width:' + pct + '%;background:' + (isTop ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (isTop ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + a.p + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>' + CONST_TEMAS[dom].ico + ' Tu nudo principal: ' + esc(CONST_TEMAS[dom].nombre) + '</h4>' +
    '<p>' + esc(CONST_TEMAS[dom].desc) + '</p><p><b>Entrena así:</b> ' + esc(CONST_TEMAS[dom].entrena) + '</p>' +
    '<p class="muted">🎒 Nivel de carga heredada: <b>' + carga + '/15</b> — ' + esc(cargaTxt) + '</p></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn btn-accent" id="constSaveTest" style="width:auto">💾 Guardar este test</button>' +
    '<button type="button" class="btn" id="constSetTema" style="width:auto">✓ Mi tema: ' + esc(CONST_TEMAS[dom].nombre) + '</button>' +
    '<button type="button" class="btn" id="constReadOrd" style="width:auto">📖 Leer orden que me sirve</button></div>';
  var sv = $('constSaveTest');
  if (sv) sv.onclick = function () {
    var d = store();
    d.tests.push({ id: uid('t'), fecha: todayKey(), P: sc.P, O: sc.O, E: sc.E, C: sc.C, dom: dom });
    save('Test guardado ✓'); renderHist(); renderStats();
  };
  var st = $('constSetTema');
  if (st) st.onclick = function () {
    var d = store(); d.miTema = dom; save('Tu tema guardado ✓');
    syncMiTema(); renderMiTemaBox(); renderStats(); switchTab('Camino');
  };
  var ri = $('constReadOrd');
  if (ri) ri.onclick = function () {
    var map = { P: 'pertenencia', O: 'lugar-hijo', E: 'equilibrio' };
    if (carga >= 10) map[dom] = 'expiacion';
    switchTab('Orden'); renderDetalle(map[dom] || 'asentir');
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}

function syncMiTema() {
  var sel = $('constMiTema'); if (!sel) return;
  sel.value = store().miTema || '';
}
function renderMiTemaBox() {
  var box = $('constMiTemaBox'); if (!box) return;
  var k = store().miTema || '';
  if (!k || !CONST_TEMAS[k]) { box.innerHTML = '<p class="muted" style="font-size:12px">Aún sin definir. Haz el test 📝 o elígelo arriba: es tu punto de partida, no tu jaula.</p>'; return; }
  var c = CONST_TEMAS[k];
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
  var box = $('constPractsBox'); if (!box) return;
  var d = store().practs || [];
  var ult7 = d.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
  box.innerHTML = '<p class="muted" style="font-size:11px">🌳 Racha: <b>' + rachaPracts() + ' días</b> · ' + d.length + ' día(s) de orden · siento → devuelvo → ocupo.</p>' +
    (ult7.length ? ult7.map(function (r) {
      return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b><br>' +
        (r.siento ? '💭 ' + esc(r.siento) + '<br>' : '') + (r.devuelvo ? '🎒 ' + esc(r.devuelvo) + '<br>' : '') + (r.ocupo ? '🌱 ' + esc(r.ocupo) : '') + '</span>' +
        '<button type="button" class="btn btn-icon const-pract-del" data-id="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin días aún. Guarda tu primer día de orden arriba 🌳.</p>');
  box.querySelectorAll('.const-pract-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.practs = e.practs.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderPracts(); renderStats(); };
  });
}
function renderDiario() {
  var box = $('constDiaList'); if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 3 líneas bastan: siento + devuelvo + ocupo.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon const-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.const-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('constHistBox'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 10);
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin tests guardados. Responde y pulsa “💾 Guardar este test”.</p>'; return; }
  box.innerHTML = t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · 🧺' + r.P + ' 🪜' + r.O + ' ⚖️' + r.E + ' · nudo <b>' + esc(r.dom || '') + '</b> · carga ' + esc(String(r.C)) + '/15</span>' +
      '<button type="button" class="btn btn-icon const-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.const-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('constStats'); if (!st) return;
  var e = store();
  var nd = Object.keys(e.diario || {}).length;
  var c = e.miTema ? CONST_TEMAS[e.miTema].nombre : 'sin tema';
  st.textContent = (e.tests.length ? e.tests.length + ' test(s)' : 'sin tests') + ' · ' + nd + ' día(s) diario · ' + e.practs.length + ' día(s) de orden · ' + c;
}

/* Respiración timer 3 min */
var constRespTimer = null;
function runRespira() {
  var msg = $('constRespiraMsg'), btn = $('constRespiraBtn');
  if (!msg) return;
  if (constRespTimer) { clearInterval(constRespTimer); constRespTimer = null; if (btn) btn.textContent = '▶ Respirar ahora (3 min)'; msg.textContent = ''; return; }
  var seg = 180;
  if (btn) btn.textContent = '⏹ Detener';
  msg.textContent = 'Siente tus pies en tierra… 3:00 (inhala 4, exhala 6)';
  constRespTimer = setInterval(function () {
    seg--;
    if (seg <= 0) {
      clearInterval(constRespTimer); constRespTimer = null;
      if (btn) btn.textContent = '▶ Respirar ahora (3 min)';
      msg.textContent = '✓ Listo. ¿Qué peso se soltó? Anota tu día abajo.';
      try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
      return;
    }
    var m = Math.floor(seg / 60), s = seg % 60;
    if (seg === 90) msg.textContent = 'Suelta los hombros, eres la pequeña… 1:30';
    else if (seg === 30) msg.textContent = 'Últimas respiraciones… 0:30';
    else msg.textContent = 'Inhala 4 · exhala 6… ' + m + ':' + String(s).padStart(2, '0');
  }, 1000);
}

function openConstel() {
  try {
    if ($('constDiaFecha') && !$('constDiaFecha').value) $('constDiaFecha').value = todayKey();
    syncMiTema(); renderMiTemaBox(); renderDiario(); renderHist(); renderPracts(); renderStats(); updateProgreso();
  } catch (e) {}
  openDlg('constelDialog');
}
try { window.openConstel = openConstel; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar botón en Linaje > Familia (tras VozAbuelos si existe) */
  try {
    if (!$('btnConstelaciones')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnConstelaciones'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌳 Constelaciones Familiares';
        try { btn.setAttribute('data-sub', 'familia'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'constelaciones familiares hellinger sistema familiar ordenes amor pertenencia jerarquia equilibrio asentir genograma parentificacion lealtad honrar ancestros devolucion frase sanadora lugar hijo exclusión');
        var ref = g.querySelector('#btnVozAbuelos');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else {
          var fam = g.querySelector('[data-sub="familia"]');
          if (fam) g.appendChild(btn);
          else g.appendChild(btn);
        }
      }
    } else {
      try {
        var cur = $('btnConstelaciones');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'familia'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnConstelaciones') < 0) ALL_BTNS.push('btnConstelaciones');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnConstelaciones = ['linaje', 'familia'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|familia'] && BTN_ORDER['linaje|familia'].indexOf('btnConstelaciones') < 0) {
      var oi = BTN_ORDER['linaje|familia'].indexOf('btnVozAbuelos');
      if (oi >= 0) BTN_ORDER['linaje|familia'].splice(oi + 1, 0, 'btnConstelaciones');
      else BTN_ORDER['linaje|familia'].push('btnConstelaciones');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnConstelaciones = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnConstelaciones"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnConstelaciones"> 🌳 Constelaciones Familiares';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnConstelaciones !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnConstelaciones = lab.querySelector('input').checked;
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
  try { addKw('btnArbolFull', 'constelaciones hellinger sistema ordenes genograma'); } catch (e2) {}
  try { addKw('btnDueloFull', 'constelaciones honrar ancestros asentir perdida'); } catch (e3) {}
  try { addKw('btnMetodos', 'constelaciones hellinger familia sistema'); } catch (e4) {}

  /* 4) diálogo */
  buildDialog();
  renderLunasBox();
  syncMiTema();
  renderMiTemaBox();
  renderDiario();
  renderHist();
  renderPracts();
  renderStats();

  var b = $('btnConstelaciones');
  if (b) b.onclick = function () { openConstel(); };

  ['Guia', 'Orden', 'Pract', 'Test', 'Camino'].forEach(function (t) {
    var tb = $('tabConst' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('constQ'); if (q) q.oninput = filterOrdenes;
  document.querySelectorAll('#constTxGrid .const-ord-card').forEach(function (card) {
    card.onclick = function () { renderDetalle(card.dataset.ord); };
  });
  document.querySelectorAll('.const-pract-add').forEach(function (bp) {
    bp.onclick = function () {
      var k = todayKey();
      var d = store();
      d.diario[k] = (d.diario[k] ? d.diario[k] + ' | ' : '') + '🛠️ Practiqué: ' + bp.dataset.p;
      save('Práctica anotada en tu diario ✓'); renderDiario(); renderStats(); switchTab('Camino');
    };
  });

  var sb = $('constRespiraBtn'); if (sb) sb.onclick = runRespira;
  var ps = $('constPractSave');
  if (ps) ps.onclick = function () {
    var si = clean((($('constSientoHoy') || {}).value || ''), 140);
    var de = clean((($('constDevuelvoHoy') || {}).value || ''), 140);
    var oc = clean((($('constOcupoHoy') || {}).value || ''), 100);
    if (!si && !de && !oc) { alert('Escribe al menos qué sientes, qué devuelves o cómo ocupas tu lugar hoy 🌳'); return; }
    var e = store();
    e.practs = e.practs.filter(function (r) { return r.fecha !== todayKey(); });
    e.practs.push({ id: uid('p'), fecha: todayKey(), siento: si, devuelvo: de, ocupo: oc });
    var txt = '🌳 Día de orden';
    if (si) txt += ' · 💭 ' + si;
    if (de) txt += ' · 🎒 ' + de;
    if (oc) txt += ' · 🌱 ' + oc;
    e.diario[todayKey()] = (e.diario[todayKey()] ? e.diario[todayKey()] + ' | ' : '') + txt;
    save('Día de orden guardado ✓');
    if ($('constSientoHoy')) $('constSientoHoy').value = '';
    if ($('constDevuelvoHoy')) $('constDevuelvoHoy').value = '';
    if ($('constOcupoHoy')) $('constOcupoHoy').value = '';
    renderPracts(); renderDiario(); renderStats();
  };
  var ga = $('constGoArbol');
  if (ga) ga.onclick = function () { try { var r = $('btnArbolFull'); if (r) r.click(); else alert('Abre 🌳 Árbol Genealógico desde Familia'); } catch (e) {} };
  var gd = $('constGoDuelo');
  if (gd) gd.onclick = function () { try { var r2 = $('btnDueloFull'); if (r2) r2.click(); else alert('Abre 🕊️ Duelo desde Interior'); } catch (e) {} };

  var tc = $('constTestCalc');
  if (tc) tc.onclick = function () {
    var r = calcTest();
    if (r.contestadas < CONST_TEST.length) { alert('Te faltan ' + (CONST_TEST.length - r.contestadas) + ' por responder para un espejo fiel 🌳'); }
    showResultado(r.sc);
  };
  var tr = $('constTestReset');
  if (tr) tr.onclick = function () {
    for (var i = 0; i < CONST_TEST.length; i++) {
      document.querySelectorAll('input[name="constQ' + i + '"]').forEach(function (x) { x.checked = false; });
    }
    var rb = $('constResultado'); if (rb) rb.classList.add('hidden');
    updateProgreso();
  };
  document.querySelectorAll('#constTestBox input[type="radio"]').forEach(function (x) {
    x.onchange = updateProgreso;
  });

  var ma = $('constMiTema');
  if (ma) ma.onchange = function () { var e = store(); e.miTema = ma.value || ''; save('Tu tema guardado ✓'); renderMiTemaBox(); renderStats(); };
  var da = $('constDiaAdd');
  if (da) da.onclick = function () {
    var f = ($('constDiaFecha') || {}).value || todayKey();
    var t = clean((($('constDiaTxt') || {}).value || ''), 300);
    if (!t) { alert('Escribe 1 línea de tu camino de hoy 🌳'); return; }
    var e = store();
    e.diario[f] = (e.diario[f] ? e.diario[f] + ' | ' : '') + t;
    save('Diario guardado ✓');
    if ($('constDiaTxt')) $('constDiaTxt').value = '';
    renderDiario(); renderStats();
  };
  var sh = $('constShare');
  if (sh) sh.onclick = function () {
    var e = store();
    var nd = Object.keys(e.diario || {}).length;
    var c = e.miTema ? CONST_TEMAS[e.miTema].nombre : 'tema por definir';
    share('🌳 Mis Constelaciones Familiares', 'Ocupa tu lugar · ' + c + '\n🌳 Racha: ' + rachaPracts() + ' días · ' + e.practs.length + ' días de orden · ' + nd + ' días de diario · ' + e.tests.length + ' test(s).\n' + CONST_LUNAS[0]);
  };
  var tn = $('constToNote');
  if (tn) tn.onclick = function () {
    try {
      var e = store();
      var c2 = e.miTema ? CONST_TEMAS[e.miTema].nombre : 'ocupar mi lugar';
      var txt2 = '🌳 Constelaciones (' + c2 + ') · racha ' + rachaPracts() + 'd · ' + (e.diario[todayKey()] || 'hoy 1 frase sanadora + ocupar mi lugar');
      if (typeof appendToTodayNote === 'function') { appendToTodayNote(txt2); save('Llevado a tu nota de hoy ✓'); }
      else if (typeof userData === 'function') {
        var u = userData();
        u.notas = u.notas || {}; var k = todayKey();
        u.notas[k] = u.notas[k] || {}; u.notas[k].nota = ((u.notas[k].nota || '') + '\n' + txt2).trim();
        save('Llevado a tu nota de hoy ✓');
      }
    } catch (e) {}
  };
  var cl = $('constClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu camino sistémico (tests, diario, días, favoritas)?')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u) u.constel = blank();
    } catch (e) {}
    syncMiTema(); renderMiTemaBox(); renderDiario(); renderHist(); renderPracts(); renderStats();
    save('Camino sistémico borrado');
  };

  updateProgreso();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();

})();
