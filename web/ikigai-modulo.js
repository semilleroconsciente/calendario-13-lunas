/* ============================================================
   IKIGAI — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
    - Boton btnIkigai (grupo Linaje > Interior)
    - Dialogo ikigaiDialog con 5 pestanas:
      1) Guia (que es, origen, 5 pilares, 10 reglas, diagrama)
      2) Mis 4 circulos (listas + detector de cruces)
      3) Brujula (test 20 preguntas, 5 por circulo)
      4) Mi Ikigai (frase + micro-accion + historial)
      5) Mi camino (diario, historial, compartir)
    - Todo local y privado por usuario: userData().ikigai
      { circles:{ama[],bueno[],mundo[],pago[]}, tests:[],
        frase:{texto,amo,bueno,sirvo,avance,fecha,historia[]},
        diario:{} }
    - Sin dependencias externas. 100% offline.
    - Puente: la ficha chica de Ikigai en Metodos (Oriente)
      recibe boton "Abrir mi Ikigai" hacia esta seccion.
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
  return String(s == null ? '' : s).slice(0, n || 120);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.ikigai) u.ikigai = blank();
    var k = u.ikigai;
    if (!k.circles) k.circles = { ama: [], bueno: [], mundo: [], pago: [] };
    ['ama', 'bueno', 'mundo', 'pago'].forEach(function (c) { if (!Array.isArray(k.circles[c])) k.circles[c] = []; });
    if (!Array.isArray(k.tests)) k.tests = [];
    if (!k.frase) k.frase = { texto: '', amo: '', bueno: '', sirvo: '', avance: '', fecha: '', historia: [] };
    if (!Array.isArray(k.frase.historia)) k.frase.historia = [];
    if (!k.diario) k.diario = {};
    return k;
  } catch (e2) { return blank(); }
}
function blank() {
  return { circles: { ama: [], bueno: [], mundo: [], pago: [] }, tests: [], frase: { texto: '', amo: '', bueno: '', sirvo: '', avance: '', fecha: '', historia: [] }, diario: {} };
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
function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, '').trim().replace(/\s+/g, ' ');
}
function tokens(s) {
  return norm(s).split(' ').filter(function (w) { return w.length > 2; });
}
function similar(a, b) {
  // cruza si comparten palabra clave (>=3 letras) o una contiene a la otra
  var na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.indexOf(nb) >= 0 || nb.indexOf(na) >= 0) return true;
  var ta = tokens(a), tb = tokens(b);
  for (var i = 0; i < ta.length; i++) for (var j = 0; j < tb.length; j++) {
    if (ta[i] === tb[j]) return true;
    if (ta[i].length > 4 && tb[j].length > 4 && (ta[i].indexOf(tb[j]) === 0 || tb[j].indexOf(ta[i]) === 0)) return true;
  }
  return false;
}

/* ---------- contenido guia ---------- */
var PILARES = [
  { ico: '🌱', t: 'Empezar pequeño', d: 'Kodawari: cuida el detalle. Un micro-paso diario vale más que un gran plan que nunca parte. Riega una planta, escribe 2 líneas, camina 10 min.' },
  { ico: '🔓', t: 'Liberarte', d: 'Acepta quién eres y suelta la comparación. Tu ikigai no necesita aplausos: necesita verdad. Menos ego, más juego.' },
  { ico: '🌊', t: 'Armonía y sostenibilidad', d: 'Piensa en tu entorno: familia, vecinos, Ñuke Mapu. Lo que daña a otros o a la tierra no es ikigai, es deuda.' },
  { ico: '😊', t: 'Alegría de las pequeñas cosas', d: 'El té de la mañana, el sol en la cara, el pan amasado. Quien no goza lo chico, tampoco gozará lo grande.' },
  { ico: '🎯', t: 'Estar en el aquí y ahora', d: 'Flujo: una sola cosa a la vez, con atención plena. Apaga el piloto automático 3 veces al día y nota dónde estás.' }
];
var REGLAS10 = [
  'Mantente activo, no te jubiles de vivir',
  'Tómatelo con calma (la prisa mata el flujo)',
  'No llenes el estómago (hara hachi bu: 80%)',
  'Rodéate de buenos amigos (moai: círculo de apoyo)',
  'Ponte en forma para tu próximo cumpleaños',
  'Sonríe y agradece a diario',
  'Reconecta con la naturaleza',
  'Da las gracias (a tus ancestros, tu tierra, tu cuerpo)',
  'Vive el momento (ichi-go ichi-e: una vez, un encuentro)',
  'Sigue tu ikigai, aunque sea pequeñito'
];
var CIRCULOS = [
  { id: 'ama', ico: '❤️', nombre: 'Lo que AMAS', desc: 'Lo que harías aunque no te pagaran: te enciende, te da energía, pierdes la hora.', ph: 'ej: cocinar, conversar, mar, música, enseñar' },
  { id: 'bueno', ico: '🌟', nombre: 'En lo que eres BUENO', desc: 'Talentos y oficios: lo que te sale fácil y otros te reconocen.', ph: 'ej: escuchar, arreglar cosas, números, tejer, organizar' },
  { id: 'mundo', ico: '🌍', nombre: 'Lo que el MUNDO necesita', desc: 'Dolores reales de tu gente y tu territorio que podrías aliviar.', ph: 'ej: acompañar mayores, limpiar quebrada, feria local' },
  { id: 'pago', ico: '💰', nombre: 'Por lo que te pueden PAGAR', desc: 'Formas honestas de sostenerte: qué valor ofreces que otros necesitan.', ph: 'ej: pan amasado, clases, reparaciones, costura, guía' }
];
var CRUCES = [
  { id: 'pasion', ico: '🔥', nombre: 'PASIÓN', f: 'amas + eres bueno', desc: 'Gozo personal. Sin mundo ni pago se vuelve hobby lindo pero frágil.' },
  { id: 'mision', ico: '🤲', nombre: 'MISIÓN', f: 'amas + mundo necesita', desc: 'Servicio con corazón. Sin pago ni talento se vuelve agotamiento.' },
  { id: 'vocacion', ico: '🌱', nombre: 'VOCACIÓN', f: 'mundo necesita + te pagan', desc: 'Oficio útil. Sin amor se vuelve rutina vacía.' },
  { id: 'profesion', ico: '💼', nombre: 'PROFESIÓN', f: 'bueno + te pagan', desc: 'Sustento. Sin amor ni mundo se vuelve jaula dorada.' }
];
var BRUJULA = [
  { c: 'ama', txt: 'Hay actividades en las que pierdo la noción del tiempo porque las disfruto.' },
  { c: 'ama', txt: 'Me entusiasmo contando o mostrando algo que me gusta, aunque nadie me lo pida.' },
  { c: 'ama', txt: 'Aunque estuviera cansado/a, hay cosas que igual me dan ganas de hacer.' },
  { c: 'ama', txt: 'Siento curiosidad real por aprender más de algo que me apasiona.' },
  { c: 'ama', txt: 'Cuando hago lo que amo, termino con más energía de la que partí.' },
  { c: 'bueno', txt: 'Otras personas me piden ayuda en algo porque “a mí me sale bien”.' },
  { c: 'bueno', txt: 'Aprendo rápido oficios o habilidades prácticas cuando me lo propongo.' },
  { c: 'bueno', txt: 'Puedo enseñar a otra persona algo que sé hacer, paso a paso.' },
  { c: 'bueno', txt: 'Termino bien los trabajos que me encargan, con calidad.' },
  { c: 'bueno', txt: 'Tengo un talento u oficio que vengo puliendo hace tiempo.' },
  { c: 'mundo', txt: 'Veo problemas de mi barrio/familia/territorio que me duelen de verdad.' },
  { c: 'mundo', txt: 'Me nace ayudar aunque no me lo pidan ni me paguen.' },
  { c: 'mundo', txt: 'Sé qué necesita mi gente cercana (escucha, compañía, manos, organización).' },
  { c: 'mundo', txt: 'Me importa el cuidado de la tierra, el agua o los seres vivos de Penco.' },
  { c: 'mundo', txt: 'Participo (o quiero participar) en algo comunitario: minga, taller, junta, feria.' },
  { c: 'pago', txt: 'Hay algo que sé hacer por lo que otras personas pagarían.' },
  { c: 'pago', txt: 'Tengo (o veo) una forma concreta de ganarme la vida con mi oficio.' },
  { c: 'pago', txt: 'Sé poner precio justo a mi trabajo sin culpa ni vergüenza.' },
  { c: 'pago', txt: 'Tengo clientes, vecinos o contactos que valoran lo que ofrezco.' },
  { c: 'pago', txt: 'Mi sustento actual se acerca, aunque sea un poco, a lo que me gusta.' }
];
var LIKERT = [{ v: 0, t: 'Nunca' }, { v: 1, t: 'A veces' }, { v: 2, t: 'A menudo' }, { v: 3, t: 'Muy cierto' }];
var LUNAS_TIP = [
  { luna: 'Lunas 1-3 · Pukem (invierno)', tip: 'Mirar adentro: completa tus 4 círculos sin apuro. Ideal ❤️ y 🌟. Práctica: 1 lista de 10 “amo” y 10 “soy bueno”.' },
  { luna: 'Lunas 4-6 · Pewü (primavera)', tip: 'Sembrar: elige 1 micro-acción de tu cruce y prueba 28 días. Ideal 🔥 Pasión → 🌱 Vocación.' },
  { luna: 'Lunas 7-9 · Walüng (verano)', tip: 'Mostrarte: ofrece tu oficio a tu gente (feria, trueque, taller). Ideal 🌍 + 💰: cobra justo, sirve alegre.' },
  { luna: 'Lunas 10-13 · Rimü (otoño)', tip: 'Cosechar y podar: revisa tu frase ikigai. ¿Qué soltar? ¿Qué agradecer? Ajusta para el ciclo nuevo.' }
];
var MICRO_IDEAS = ['Regar 1 planta y agradecer en voz alta', 'Escribir 3 líneas de mi ikigai de hoy', 'Enseñar algo chico a alguien (5 min)', 'Caminar 10 min sin celular notando 3 seres vivos', 'Ordenar 1 cajón como acto de respeto', 'Saludar a un vecino por su nombre', 'Preparar algo rico y compartir la mitad', 'Anotar 1 cosa que el mundo necesita y 1 paso'];

/* ---------- cruces ---------- */
function crucesDe(data) {
  var c = data.circles;
  function inter(a, b) {
    var out = [];
    (c[a] || []).forEach(function (x) {
      (c[b] || []).forEach(function (y) {
        if (similar(x.t, y.t)) { if (out.indexOf(x.t) < 0) out.push(x.t); }
      });
    });
    return out;
  }
  var pasion = inter('ama', 'bueno');
  var mision = inter('ama', 'mundo');
  var vocacion = inter('mundo', 'pago');
  var profesion = inter('bueno', 'pago');
  // centro: aparece en 3+ circulos
  var todas = [].concat(c.ama || [], c.bueno || [], c.mundo || [], c.pago || []).map(function (x) { return x.t; });
  var centro = [];
  todas.forEach(function (t) {
    var n = 0;
    ['ama', 'bueno', 'mundo', 'pago'].forEach(function (k) {
      if ((c[k] || []).some(function (x) { return similar(x.t, t); })) n++;
    });
    if (n >= 3 && centro.indexOf(t) < 0) centro.push(t);
  });
  return { pasion: pasion, mision: mision, vocacion: vocacion, profesion: profesion, centro: centro };
}

/* ---------- dialogo ---------- */
function makeDialog() {
  var old = $('ikigaiDialog');
  if (old) old.remove();
  var circHTML = CIRCULOS.map(function (c) {
    return '<div class="menstrual-card" style="margin-bottom:8px"><h4>' + c.ico + ' ' + esc(c.nombre) + '</h4>' +
      '<p class="muted" style="font-size:11px">' + esc(c.desc) + '</p>' +
      '<div style="display:flex;gap:6px"><input type="text" id="ikiIn_' + c.id + '" placeholder="' + esc(c.ph) + '" maxlength="60" style="flex:1">' +
      '<button type="button" class="btn btn-accent iki-add" data-c="' + c.id + '" style="width:auto">+</button></div>' +
      '<div id="ikiList_' + c.id + '" class="habits-list" style="margin-top:8px"></div></div>';
  }).join('');
  var testHTML = BRUJULA.map(function (q, i) {
    var opts = LIKERT.map(function (o) {
      return '<label class="check-row" style="margin:0;font-size:12px"><input type="radio" name="ikiQ' + i + '" value="' + o.v + '"> ' + o.t + '</label>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:8px"><b style="font-size:12px">' + (i + 1) + '. ' + esc(q.txt) + '</b>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + opts + '</div></div>';
  }).join('');
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabIkiGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabIkiCirc" class="btn" style="width:auto">⭘ 4 círculos</button>' +
    '<button type="button" id="tabIkiBruj" class="btn" style="width:auto">🧭 Brújula</button>' +
    '<button type="button" id="tabIkiFrase" class="btn" style="width:auto">🌸 Mi Ikigai</button>' +
    '<button type="button" id="tabIkiCam" class="btn" style="width:auto">🌱 Mi camino</button></div>' +

    '<div id="ikiGuia">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌸 Ikigai: tu razón de ser (生き甲斐)</h4>' +
    '<p class="muted" style="font-size:12px;line-height:1.6"><i>Iki</i> (vida) + <i>gai</i> (valor, merecer la pena). En Okinawa —zona azul de longevos— el ikigai no es “el trabajo soñado”: es <b>eso chico que te levanta en la mañana</b>: tu huerta, tus nietos, tu pan, tu canto, tu minga. Puede ser humilde y aun así sostener una vida entera.</p>' +
    '<p class="muted" style="font-size:12px;line-height:1.6">El diagrama de 4 círculos (❤️ amas · 🌟 bueno · 🌍 mundo necesita · 💰 te pagan) es una <b>versión occidental</b> útil para ordenar, no una traducción literal japonesa. Úsalo como mapa, no como examen: donde se cruzan aparece tu <b>pasión, misión, vocación, profesión</b>… y al centro, tu ikigai de hoy.</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px"><div class="menstrual-card"><h4>⭘ El mapa en 1 minuto</h4>' +
    '<p style="font-size:12px">❤️+🌟 = <b>🔥 Pasión</b> (gozo)<br>❤️+🌍 = <b>🤲 Misión</b> (servicio)<br>🌍+💰 = <b>🌱 Vocación</b> (oficio útil)<br>🌟+💰 = <b>💼 Profesión</b> (sustento)<br>❤️+🌟+🌍+💰 = <b>🌸 Ikigai</b> (cruce vivo)</p>' +
    '<p class="muted" style="font-size:11px">Sin amor → vacío · sin talento → torpeza · sin mundo → ego · sin pago → precariedad. El equilibrio se cultiva, no se encuentra hecho.</p></div>' +
    '<div class="menstrual-card"><h4>🏝️ Nota honesta desde Okinawa</h4>' +
    '<p class="muted" style="font-size:12px">En Ogimi no hablan de “4 círculos”: hablan de <i>moai</i> (tu grupo de apoyo de por vida), de comer liviano, de moverse cada día, de reír y agradecer. Si el diagrama te presiona (“¡tengo que tenerlo todo!”), vuelve a lo simple: <b>¿qué pequeño quehacer te da alegría hoy?</b> Ese es tu ikigai de hoy.</p></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌱 Los 5 pilares (Ken Mogi)</h4><div id="ikiPilares"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📜 Las 10 reglas (García & Miralles)</h4><div id="ikiReglas" style="display:flex;flex-direction:column;gap:4px"></div></div>' +
    '<details class="menstrual-details"><summary>⚠️ 5 errores comunes</summary><p class="muted" style="font-size:12px">❌ Buscarlo gigante (“cambiar el mundo”) y despreciar lo chico · ❌ Confundir ikigai con solo trabajo rentado · ❌ Querer los 4 círculos perfectos antes de partir · ❌ Compararte con otros (“su ikigai es mejor”) · ❌ Creer que es fijo: cambia con las lunas de la vida, se revisa cada ciclo.</p></details>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Ikigai × 13 lunas × küme mongen</h4><div id="ikiLunasBox"></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Como el <i>küme mongen</i>: tu buen vivir florece cuando te ubicas —en tu cuerpo, tu familia, tu territorio— y devuelves algo. Tu ikigai penqueño puede ser cuidar la quebrada, amasar, enseñar mapuzugun, acompañar.</p></div>' +
    '</div>' +

    '<div id="ikiCirc" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⭘ Tus 4 círculos</h4>' +
    '<p class="muted" style="font-size:11px">Escribe al menos 3 cosas por círculo (1 por vez, botón +). El calendario detecta solo las <b>coincidencias de palabras</b> y te muestra tus cruces. Todo queda privado y local.</p>' +
    '<div id="ikiCrucesBox"></div></div>' + circHTML +
    '<div class="menstrual-card"><h4>💡 Si te trabas</h4><p class="muted" style="font-size:11px">❤️ Pregunta a 2 personas: “¿cuándo me ves más vivo/a?” · 🌟 “¿para qué me pides ayuda siempre?” · 🌍 Camina tu cuadra y anota 3 dolores que veas · 💰 “¿qué me comprarían mis vecinos sin dudar?”.</p></div></div>' +

    '<div id="ikiBruj" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧭 Brújula (20 afirmaciones)</h4>' +
    '<p class="muted" style="font-size:11px">Responde cómo eres <b>casi siempre</b>. Escala: Nunca 0 · A veces 1 · A menudo 2 · Muy cierto 3. ~5 min. No es diagnóstico: es un espejo para ver tu círculo más débil y regarlo.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ikiTestReset" class="btn" style="width:auto">↺ Limpiar</button>' +
    '<button type="button" id="ikiTestCalc" class="btn btn-accent" style="width:auto">📊 Ver mi brújula</button></div>' +
    '<div id="ikiProgreso" class="muted" style="font-size:11px;margin-top:6px"></div></div>' +
    '<div style="margin-top:10px">' + testHTML + '</div>' +
    '<div id="ikiResultado" class="menstrual-card hidden" style="margin-top:10px;border-color:var(--gold)"></div></div>' +

    '<div id="ikiFrase" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌸 Mi frase ikigai</h4>' +
    '<p class="muted" style="font-size:11px">Completa y guarda. Se vale chico y concreto: “cuidar”, “amasar”, “acompañar”.</p>' +
    '<div class="conv-row"><label>Amo <input type="text" id="ikiF_amo" placeholder="ej: amasar pan" maxlength="60"></label>' +
    '<label>Soy bueno/a en <input type="text" id="ikiF_bueno" placeholder="ej: dejarlo esponjoso" maxlength="60"></label></div>' +
    '<div class="conv-row"><label>Sirvo en <input type="text" id="ikiF_sirvo" placeholder="ej: desayuno de mis vecinos" maxlength="60"></label>' +
    '<label>Avanzo en <input type="text" id="ikiF_avance" placeholder="ej: vender 10 panes a precio justo" maxlength="60"></label></div>' +
    '<label>Mi ikigai de esta luna es… <input type="text" id="ikiF_texto" placeholder="ej: amasar pan que abrigue a mi gente" maxlength="120"></label>' +
    '<label>🎯 Mi micro-acción de hoy (5 min) <input type="text" id="ikiF_micro" placeholder="ej: amasar 4 panes y regalar 1" maxlength="120"></label>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" id="ikiFraseIdea" class="btn" style="width:auto">🎲 Idea de micro-acción</button>' +
    '<button type="button" id="ikiFraseSave" class="btn btn-accent" style="width:auto">💾 Guardar mi ikigai</button></div>' +
    '<div id="ikiFraseViva" style="margin-top:8px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Historial de frases</h4><div id="ikiFraseHist"></div></div></div>' +

    '<div id="ikiCam" class="hidden">' +
    '<div class="menstrual-grid"><div class="menstrual-card" style="border-color:var(--gold)"><h4>🌸 Mi ikigai vigente</h4><div id="ikiVigente"></div></div>' +
    '<div class="menstrual-card"><h4>📓 Diario (1 línea basta)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ikiDiaFecha"></label></div>' +
    '<label>Hoy mi ikigai fue… <input type="text" id="ikiDiaTxt" placeholder="ej: regalé pan a la veci y me agradeció con mote" maxlength="140"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ikiDiaAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div>' +
    '<div id="ikiDiaList" class="habits-list" style="margin-top:8px;max-height:220px"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🧭 Historial de brújulas</h4><div id="ikiHistBox"></div></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">' +
    '<span id="ikiStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ikiShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="ikiToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
    '<button type="button" id="ikiExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="ikiClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div></div>';

  var old2 = $('ikigaiDialog');
  if (old2) old2.remove();
  var d = document.createElement('dialog');
  d.id = 'ikigaiDialog';
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🌸 Ikigai — tu razón de ser</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Lo que amas ❤️ · lo que haces bien 🌟 · lo que tu gente necesita 🌍 · cómo te sostienes 💰. Mapa + brújula + frase + diario. Todo <b>privado y local</b> por usuario.</p>' +
    body +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg() { var d = $('ikigaiDialog'); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(name) {
  ['Guia', 'Circ', 'Bruj', 'Frase', 'Cam'].forEach(function (t) {
    var p = $('iki' + t), b = $('tabIki' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ---------- renders ---------- */
function renderGuia() {
  var p = $('ikiPilares');
  if (p) p.innerHTML = PILARES.map(function (x) {
    return '<div class="si-card" style="padding:6px 10px"><b style="font-size:12px">' + x.ico + ' ' + esc(x.t) + '</b><p class="muted" style="font-size:11px;margin:2px 0 0">' + esc(x.d) + '</p></div>';
  }).join('');
  var r = $('ikiReglas');
  if (r) r.innerHTML = REGLAS10.map(function (t, i) { return '<span class="chip" style="font-size:11px;white-space:normal;text-align:left">' + (i + 1) + '. ' + esc(t) + '</span>'; }).join('');
  var l = $('ikiLunasBox');
  if (l) l.innerHTML = LUNAS_TIP.map(function (g) {
    return '<div class="si-card"><h4>' + esc(g.luna) + '</h4><p>' + esc(g.tip) + '</p></div>';
  }).join('');
}
function renderCirc() {
  var data = store();
  CIRCULOS.forEach(function (c) {
    var box = $('ikiList_' + c.id);
    if (!box) return;
    var arr = data.circles[c.id] || [];
    if (!arr.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Vacío. Agrega tu primera arriba 👆 (apunta a 3 o más).</p>'; return; }
    box.innerHTML = arr.map(function (x) {
      return '<div class="hora-item"><span style="font-size:12px">• ' + esc(x.t) + '</span>' +
        '<button type="button" class="btn btn-icon iki-del" data-c="' + c.id + '" data-id="' + x.id + '">✕</button></div>';
    }).join('');
  });
  document.querySelectorAll('.iki-del').forEach(function (b) {
    b.onclick = function () {
      var dd = store();
      dd.circles[b.dataset.c] = (dd.circles[b.dataset.c] || []).filter(function (x) { return x.id !== b.dataset.id; });
      save(); renderCirc(); renderCruces(); renderStats();
    };
  });
  renderCruces();
}
function renderCruces() {
  var box = $('ikiCrucesBox');
  if (!box) return;
  var data = store();
  var cr = crucesDe(data);
  var total = data.circles.ama.length + data.circles.bueno.length + data.circles.mundo.length + data.circles.pago.length;
  if (!total) { box.innerHTML = '<p class="muted" style="font-size:11px">Tus cruces aparecerán aquí cuando escribas en 2+ círculos. Parte con ❤️ Lo que amas.</p>'; return; }
  function chip(arr) {
    if (!arr.length) return '<span class="muted" style="font-size:11px">aún sin cruce — agrega palabras parecidas en ambos círculos</span>';
    return arr.map(function (t) { return '<span class="chip" style="font-size:11px">🌸 ' + esc(t) + '</span>'; }).join(' ');
  }
  var rows = [
    { h: '🔥 PASIÓN <span class="muted">❤️+🌟</span>', v: cr.pasion },
    { h: '🤲 MISIÓN <span class="muted">❤️+🌍</span>', v: cr.mision },
    { h: '🌱 VOCACIÓN <span class="muted">🌍+💰</span>', v: cr.vocacion },
    { h: '💼 PROFESIÓN <span class="muted">🌟+💰</span>', v: cr.profesion }
  ].map(function (r) {
    return '<div class="si-card" style="padding:6px 10px"><b style="font-size:12px">' + r.h + '</b><div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">' + chip(r.v) + '</div></div>';
  }).join('');
  var centro = cr.centro.length
    ? '<div class="menstrual-card" style="border-color:var(--gold);margin-top:8px"><h4>🌸 Tu centro vivo (' + cr.centro.length + ')</h4><div style="display:flex;gap:4px;flex-wrap:wrap">' + cr.centro.map(function (t) { return '<span class="chip" style="font-size:12px;border-color:var(--gold)">🌸 <b>' + esc(t) + '</b></span>'; }).join(' ') + '</div><p class="muted" style="font-size:11px">Eso que aparece en 3-4 círculos es tu pista más fuerte. Llévalo a 🌸 Mi Ikigai.</p></div>'
    : '<p class="muted" style="font-size:11px;margin-top:6px">💡 Centro vacío = normal al inicio. Cuando una misma palabra (ej “pan”, “niños”, “mar”) aparezca en 3+ círculos, brillará aquí 🌸.</p>';
  box.innerHTML = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
    CIRCULOS.map(function (c) { return '<span class="chip" style="font-size:11px">' + c.ico + ' ' + (data.circles[c.id] || []).length + '</span>'; }).join('') + '</div>' + rows + centro;
}
function calcBruj() {
  var scores = { ama: 0, bueno: 0, mundo: 0, pago: 0 };
  var n = 0;
  for (var i = 0; i < BRUJULA.length; i++) {
    var sel = document.querySelector('input[name="ikiQ' + i + '"]:checked');
    if (sel) { n++; scores[BRUJULA[i].c] += (+sel.value); }
  }
  return { scores: scores, n: n };
}
function updateProgreso() {
  var r = calcBruj();
  var box = $('ikiProgreso');
  if (box) box.textContent = r.n + ' / ' + BRUJULA.length + ' respondidas' + (r.n < BRUJULA.length ? ' — responde todas para una brújula fiable' : ' ✓ lista para calcular');
}
var CONSEJO = {
  ama: '❤️ Regar el amor: agenda 15 min diarios de eso que amas, sin culpa ni utilidad. El gozo es combustible.',
  bueno: '🌟 Afilar el talento: elige 1 habilidad y practícala 10 min al día por 28 días. Pide a alguien que te mire y te diga qué ve.',
  mundo: '🌍 Salir a servir: pregunta esta semana “¿en qué te ayudo?” 3 veces. Anota qué dolores se repiten: ahí hay misión.',
  pago: '💰 Sostener con dignidad: pon precio justo a 1 oficio, ofrece 3 muestras o trueques, y cobra sin pedir perdón.'
};
function showResultado(sc, saved) {
  var box = $('ikiResultado');
  if (!box) return;
  var arr = ['ama', 'bueno', 'mundo', 'pago'].map(function (k) { return { k: k, p: sc[k] || 0 }; });
  arr.sort(function (a, b) { return b.p - a.p; });
  var max = 15;
  var deb = arr[arr.length - 1];
  var meta = { ama: '❤️ Lo que amas', bueno: '🌟 En lo que eres bueno', mundo: '🌍 Lo que el mundo necesita', pago: '💰 Por lo que te pagan' };
  box.classList.remove('hidden');
  box.innerHTML = '<h4>🧭 Tu brújula ' + (saved ? '(guardada ✓)' : '(sin guardar)') + '</h4>' +
    '<p class="muted" style="font-size:11px">Máximo por círculo: 15 (5 preguntas × 3). Mira el más bajo: ahí está tu riego de esta luna.</p>' +
    ['ama', 'bueno', 'mundo', 'pago'].map(function (k) {
      var v = sc[k] || 0;
      var pct = Math.round(v / max * 100);
      var ico = { ama: '❤️', bueno: '🌟', mundo: '🌍', pago: '💰' }[k];
      var top = arr[0].k === k;
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="min-width:150px;font-size:12px">' + ico + ' ' + esc(meta[k].split(' ').slice(1).join(' ') || k) + '</span>' +
        '<span style="flex:1;background:var(--panel);border:1px solid var(--line);border-radius:6px;height:14px;overflow:hidden"><span style="display:block;height:100%;width:' + pct + '%;background:' + (top ? 'var(--gold)' : 'var(--accent)') + ';opacity:' + (top ? '1' : '.55') + '"></span></span>' +
        '<b style="min-width:30px;text-align:right">' + v + '</b></div>';
    }).join('') +
    '<div class="si-card" style="margin-top:8px"><h4>🌱 A regar: ' + esc(meta[deb.k]) + ' (' + deb.p + '/15)</h4><p>' + esc(CONSEJO[deb.k]) + '</p></div>' +
    '<div style="margin-top:8px"><button type="button" class="btn btn-accent" id="ikiSaveTest" style="width:auto">💾 Guardar esta brújula</button></div>';
  var sv = $('ikiSaveTest');
  if (sv) sv.onclick = function () {
    var dd = store();
    dd.tests.push({ id: uid('b'), fecha: todayKey(), scores: { ama: sc.ama || 0, bueno: sc.bueno || 0, mundo: sc.mundo || 0, pago: sc.pago || 0 } });
    save('Brújula guardada ✓'); renderHist(); renderStats();
    showResultado(sc, true);
  };
  try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
}
function fraseTexto(f) {
  if ((f.texto || '').trim()) return f.texto.trim();
  var parts = [];
  if ((f.amo || '').trim()) parts.push('amo ' + f.amo.trim());
  if ((f.bueno || '').trim()) parts.push('soy bueno/a en ' + f.bueno.trim());
  if ((f.sirvo || '').trim()) parts.push('sirvo en ' + f.sirvo.trim());
  if ((f.avance || '').trim()) parts.push('avance en ' + f.avance.trim());
  return parts.length ? ('Mi ikigai es vivir donde ' + parts.join(', ') + '.') : '';
}
function renderFrase() {
  var dd = store();
  var f = dd.frase || {};
  if ($('ikiF_amo') && document.activeElement !== $('ikiF_amo')) $('ikiF_amo').value = f.amo || '';
  if ($('ikiF_bueno') && document.activeElement !== $('ikiF_bueno')) $('ikiF_bueno').value = f.bueno || '';
  if ($('ikiF_sirvo') && document.activeElement !== $('ikiF_sirvo')) $('ikiF_sirvo').value = f.sirvo || '';
  if ($('ikiF_avance') && document.activeElement !== $('ikiF_avance')) $('ikiF_avance').value = f.avance || '';
  if ($('ikiF_texto') && document.activeElement !== $('ikiF_texto')) $('ikiF_texto').value = f.texto || '';
  var viva = $('ikiFraseViva');
  if (viva) {
    var t = fraseTexto(f);
    viva.innerHTML = t
      ? '<div class="chip" style="display:block;white-space:normal;line-height:1.6;border-color:var(--gold)">🌸 <b>' + esc(t) + '</b>' + (f.fecha ? '<br><span class="muted">vigente desde ' + esc(f.fecha) + '</span>' : '') + '</div>'
      : '<p class="muted" style="font-size:11px">Tu frase viva aparecerá aquí. Ejemplo: “Mi ikigai de esta luna es amasar pan que abrigue a mi gente, porque amo el horno, sirvo desayunos y avanzo a precio justo”.</p>';
  }
  var h = $('ikiFraseHist');
  if (h) {
    var hist = (f.historia || []).slice().reverse().slice(0, 10);
    h.innerHTML = hist.length ? hist.map(function (r) {
      return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(r.fecha || '') + '</b><br>' + esc(r.texto || '') + '</span></div>';
    }).join('') : '<p class="muted" style="font-size:11px">Sin versiones guardadas. Guarda tu primera frase arriba 👆.</p>';
  }
  var v = $('ikiVigente');
  if (v) {
    var t2 = fraseTexto(f);
    v.innerHTML = t2
      ? '<div class="chip" style="display:block;white-space:normal;line-height:1.6">🌸 <b>' + esc(t2) + '</b></div><p class="muted" style="font-size:11px;margin-top:6px">Revisa cada luna: ¿sigue vivo? Si cambió, edítalo en 🌸 Mi Ikigai.</p>'
      : '<p class="muted" style="font-size:11px">Aún sin frase. Ve a 🌸 Mi Ikigai y escribe tu primera versión (vale chica).</p>';
  }
}
function renderDiario() {
  var box = $('ikiDiaList');
  if (!box) return;
  var d = store().diario || {};
  var keys = Object.keys(d).sort().reverse().slice(0, 30);
  if (!keys.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin registros. 1 línea al día basta: “hoy mi ikigai fue…”.</p>'; return; }
  box.innerHTML = keys.map(function (k) {
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b><br>' + esc(d[k]) + '</span>' +
      '<button type="button" class="btn btn-icon iki-dia-del" data-k="' + esc(k) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.iki-dia-del').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.diario[x.dataset.k]; save(); renderDiario(); renderStats(); };
  });
}
function renderHist() {
  var box = $('ikiHistBox');
  if (!box) return;
  var t = store().tests || [];
  if (!t.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin brújulas guardadas. Responde la 🧭 Brújula y pulsa “💾 Guardar”.</p>'; return; }
  var meta = { ama: '❤️', bueno: '🌟', mundo: '🌍', pago: '💰' };
  box.innerHTML = t.slice().reverse().slice(0, 10).map(function (r) {
    var s = r.scores || {};
    var txt = ['ama', 'bueno', 'mundo', 'pago'].map(function (k) { return meta[k] + (s[k] == null ? '–' : s[k]); }).join(' · ');
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha || '') + '</b> · ' + esc(txt) + '</span>' +
      '<button type="button" class="btn btn-icon iki-hist-del" data-id="' + r.id + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.iki-hist-del').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = e.tests.filter(function (r) { return r.id !== x.dataset.id; }); save(); renderHist(); renderStats(); };
  });
}
function renderStats() {
  var st = $('ikiStats');
  if (!st) return;
  var e = store();
  var nc = (e.circles.ama.length + e.circles.bueno.length + e.circles.mundo.length + e.circles.pago.length);
  var nd = Object.keys(e.diario || {}).length;
  var cr = crucesDe(e);
  st.textContent = nc + ' idea(s) en círculos · ' + cr.centro.length + ' centro(s) · ' + e.tests.length + ' brújula(s) · ' + nd + ' día(s) de diario';
}
function buildShareText() {
  var e = store();
  var cr = crucesDe(e);
  var f = fraseTexto(e.frase || {});
  var t = '🌸 Mi Ikigai · ' + todayKey() + '\n\n';
  if (f) t += 'Frase: ' + f + '\n\n';
  t += '⭘ Círculos: ❤️' + e.circles.ama.length + ' · 🌟' + e.circles.bueno.length + ' · 🌍' + e.circles.mundo.length + ' · 💰' + e.circles.pago.length + '\n';
  if (cr.centro.length) t += 'Centro vivo: ' + cr.centro.join(' · ') + '\n';
  if (cr.pasion.length) t += 'Pasión: ' + cr.pasion.join(' · ') + '\n';
  if (cr.mision.length) t += 'Misión: ' + cr.mision.join(' · ') + '\n';
  var last = (e.tests || []).slice(-1)[0];
  if (last) t += 'Brújula (' + last.fecha + '): ❤️' + last.scores.ama + ' 🌟' + last.scores.bueno + ' 🌍' + last.scores.mundo + ' 💰' + last.scores.pago + '\n';
  var dk = Object.keys(e.diario || {}).sort().reverse().slice(0, 3);
  if (dk.length) { t += '\nÚltimos días:\n' + dk.map(function (k) { return '• ' + k + ': ' + e.diario[k]; }).join('\n') + '\n'; }
  return t + '\n— Pequeño cada día · Penco';
}

/* ---------- setup ---------- */
function ensureButton() {
  try {
    if (!$('btnIkigai')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnIkigai'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌸 Ikigai';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'ikigai proposito sentido vida razon ser japones okinawa diagrama venn pasion mision vocacion profesion brujula amor talento mundo pago microaccion flujo moai pilares reglas');
        var ref = $('btnEneagrama') || $('btnMetodos');
        if (ref && ref.parentNode === g) {
          if (ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
          else g.appendChild(btn);
        } else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnIkigai');
        var grp = cur.closest ? cur.closest('.action-group') : null;
        var nm = grp && grp.getAttribute ? grp.getAttribute('data-group') : null;
        if (nm && nm !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'interior'); } catch (eS2) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
}
function ensureCheckbox() {
  try {
    if (document.querySelector('#configDialog input[data-btn="btnIkigai"]')) return;
    var groups = document.querySelectorAll('#configDialog .config-group');
    groups.forEach(function (gr) {
      var h = gr.querySelector('h5');
      if (h && h.textContent.indexOf('Linaje') >= 0) {
        var lab = document.createElement('label');
        lab.className = 'check-row';
        lab.innerHTML = '<input type="checkbox" data-btn="btnIkigai"> 🌸 Ikigai';
        gr.appendChild(lab);
        try {
          var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
          lab.querySelector('input').checked = !vis || vis.btnIkigai !== false;
          lab.querySelector('input').onchange = function () {
            try {
              var DR = (typeof DATA !== 'undefined') ? DATA : null;
              if (DR) {
                DR.config = DR.config || {}; DR.config.visible = DR.config.visible || {};
                DR.config.visible.btnIkigai = lab.querySelector('input').checked;
                if (typeof scheduleSave === 'function') scheduleSave();
                if (typeof applyVisibility === 'function') applyVisibility();
              }
            } catch (e2) {}
          };
        } catch (e2) {}
      }
    });
  } catch (e) {}
}
function bridgeMetodos() {
  // La ficha chica de Ikigai vive en Metodos > Oriente: le sumamos boton a la seccion completa.
  try {
    var cards = document.querySelectorAll('#metodosPanel2 .discipline-card');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var h = c.querySelector('h4');
      if (h && h.textContent.indexOf('Ikigai') >= 0 && !c.querySelector('.iki-open-full')) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-accent iki-open-full';
        b.style.cssText = 'width:auto;margin-top:8px';
        b.textContent = '🌸 Abrir mi Ikigai (sección completa)';
        b.onclick = function () {
          try { var m = $('metodosDialog'); if (m && m.open) m.close(); } catch (e) {}
          setTimeout(function () { try { $('btnIkigai').click(); } catch (e2) { openDlg(); } }, 150);
        };
        c.appendChild(b);
        var p = c.querySelector('p.muted');
        if (p) p.innerHTML += ' <b>¿Quieres mapa, brújula y diario?</b> Usa el botón de abajo 👇.';
      }
    }
    // keywords: que buscar "ikigai" tambien sugiera el modulo
    try {
      var bm = $('btnMetodos');
      if (bm && bm.dataset && bm.dataset.keywords && bm.dataset.keywords.indexOf('seccion completa') < 0) bm.dataset.keywords += ' ikigai seccion completa modulo brujula circulos frase';
    } catch (e2) {}
  } catch (e) {}
}

function wire() {
  ensureButton();
  makeDialog();
  renderGuia();
  renderCirc();
  renderFrase();
  renderDiario();
  renderHist();
  renderStats();
  updateProgreso();

  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnIkigai') < 0) ALL_BTNS.push('btnIkigai');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnEneagrama && p.btnIkigai === undefined) p.btnIkigai = true;
        if (p.btnMetodos && p.btnIkigai === undefined) p.btnIkigai = true;
      });
    }
  } catch (e) {}
  ensureCheckbox();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  bridgeMetodos();

  var b = $('btnIkigai');
  if (b && !b.dataset.ikiW) {
    b.dataset.ikiW = '1';
    b.onclick = function () {
      try { renderGuia(); } catch (e) {}
      try { renderCirc(); } catch (e2) {}
      try { renderFrase(); } catch (e3) {}
      try { renderDiario(); renderHist(); renderStats(); updateProgreso(); } catch (e4) {}
      if (!$('ikiDiaFecha').value) $('ikiDiaFecha').value = todayKey();
      switchTab('Guia');
      openDlg();
    };
  }

  ['Guia', 'Circ', 'Bruj', 'Frase', 'Cam'].forEach(function (t) {
    var tb = $('tabIki' + t);
    if (tb && !tb.dataset.w) { tb.dataset.w = '1'; tb.onclick = function () { switchTab(t); }; }
  });

  document.querySelectorAll('.iki-add').forEach(function (btn) {
    if (btn.dataset.w) return;
    btn.dataset.w = '1';
    btn.onclick = function () {
      var c = btn.dataset.c;
      var inp = $('ikiIn_' + c);
      var v = clean((inp.value || '').trim(), 60);
      if (!v) { alert('Escribe una idea primero (ej: cocinar, escuchar, ayudar)'); return; }
      var dd = store();
      var ex = (dd.circles[c] || []).some(function (x) { return norm(x.t) === norm(v); });
      if (ex) { alert('Ya está en tu círculo'); return; }
      dd.circles[c].push({ id: uid('i'), t: v });
      inp.value = '';
      save('Guardado ✓');
      renderCirc(); renderStats();
      inp.focus();
    };
  });
  ['ama', 'bueno', 'mundo', 'pago'].forEach(function (c) {
    var inp = $('ikiIn_' + c);
    if (inp && !inp.dataset.w) {
      inp.dataset.w = '1';
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); var btn2 = document.querySelector('.iki-add[data-c="' + c + '"]'); if (btn2) btn2.click(); }
      });
    }
  });

  var rs = $('ikiTestReset');
  if (rs && !rs.dataset.w) {
    rs.dataset.w = '1';
    rs.onclick = function () {
      document.querySelectorAll('input[name^="ikiQ"]').forEach(function (r) { r.checked = false; });
      var rb = $('ikiResultado'); if (rb) rb.classList.add('hidden');
      updateProgreso();
    };
  }
  document.querySelectorAll('input[name^="ikiQ"]').forEach(function (r) {
    if (!r.dataset.w) { r.dataset.w = '1'; r.onchange = updateProgreso; }
  });
  var calc = $('ikiTestCalc');
  if (calc && !calc.dataset.w) {
    calc.dataset.w = '1';
    calc.onclick = function () {
      var r = calcBruj();
      if (r.n < BRUJULA.length) {
        if (!confirm('Respondiste ' + r.n + ' de ' + BRUJULA.length + '. La brújula será poco fiable. ¿Verla igual?')) return;
      }
      showResultado(r.scores, false);
      switchTab('Bruj');
    };
  }

  var idea = $('ikiFraseIdea');
  if (idea && !idea.dataset.w) {
    idea.dataset.w = '1';
    idea.onclick = function () {
      var m = $('ikiF_micro');
      if (m) m.value = MICRO_IDEAS[Math.floor(Math.random() * MICRO_IDEAS.length)];
    };
  }
  var fsv = $('ikiFraseSave');
  if (fsv && !fsv.dataset.w) {
    fsv.dataset.w = '1';
    fsv.onclick = function () {
      var amo = clean(($('ikiF_amo') || {}).value || '', 60).trim();
      var bueno = clean(($('ikiF_bueno') || {}).value || '', 60).trim();
      var sirvo = clean(($('ikiF_sirvo') || {}).value || '', 60).trim();
      var avance = clean(($('ikiF_avance') || {}).value || '', 60).trim();
      var texto = clean(($('ikiF_texto') || {}).value || '', 120).trim();
      var micro = clean(($('ikiF_micro') || {}).value || '', 120).trim();
      if (!amo && !bueno && !sirvo && !avance && !texto) { alert('Completa al menos un campo de tu ikigai'); return; }
      if (!texto) {
        var parts = [];
        if (amo) parts.push('amo ' + amo);
        if (bueno) parts.push('soy bueno/a en ' + bueno);
        if (sirvo) parts.push('sirvo en ' + sirvo);
        if (avance) parts.push('avance en ' + avance);
        texto = parts.length ? ('Mi ikigai es vivir donde ' + parts.join(', ') + '.') : '';
      }
      var dd = store();
      var prev = (dd.frase && dd.frase.texto) ? { fecha: dd.frase.fecha || todayKey(), texto: dd.frase.texto } : null;
      if (prev && prev.texto !== texto) dd.frase.historia.push(prev);
      dd.frase = { texto: texto, amo: amo, bueno: bueno, sirvo: sirvo, avance: avance, fecha: todayKey(), historia: dd.frase.historia || [] };
      if (micro) { dd.diario[todayKey()] = '🎯 ' + micro + (texto ? ' · 🌸 ' + texto : ''); }
      save('Tu ikigai guardado 🌸');
      renderFrase(); renderDiario(); renderStats();
      switchTab('Cam');
    };
  }

  var da = $('ikiDiaAdd');
  if (da && !da.dataset.w) {
    da.dataset.w = '1';
    da.onclick = function () {
      var k = ($('ikiDiaFecha') && $('ikiDiaFecha').value) || todayKey();
      var txt = clean((($('ikiDiaTxt') || {}).value || '').trim(), 300);
      if (!txt) return alert('Escribe tu línea de hoy primero');
      var e = store();
      e.diario[k] = txt;
      save('Guardado ✓'); $('ikiDiaTxt').value = '';
      renderDiario(); renderStats();
    };
  }

  var sh = $('ikiShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = async function () { await share('🌸 Mi Ikigai', buildShareText()); };
  }
  var ex = $('ikiExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var blob = new Blob([buildShareText()], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mi-ikigai.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var tn = $('ikiToNote');
  if (tn && !tn.dataset.w) {
    tn.dataset.w = '1';
    tn.onclick = function () {
      var e = store();
      var t = fraseTexto(e.frase || {});
      var txt = (($('ikiDiaTxt') || {}).value || '').trim() || (t ? ('🌸 ' + t) : '');
      if (!txt) return alert('Escribe algo primero o guarda tu frase');
      try {
        var info = (typeof todayInfo === 'function') ? todayInfo() : null;
        if (!info) return alert('No se pudo ubicar hoy');
        var note = txt.slice(0, 280);
        if (info.luna === 'dft') { var c = cyc(currentCycleYear()); c.dft.nota = (c.dft.nota ? c.dft.nota + '\n' : '') + note; }
        else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + note; }
        save(); if (typeof renderLuna === 'function' && typeof currentView !== 'undefined' && currentView.tipo === 'luna') renderLuna();
        alert('Llevado a la nota de hoy ✓');
      } catch (e2) { alert('No se pudo llevar a la nota'); }
    };
  }
  var cl = $('ikiClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar todo tu registro de Ikigai (círculos, tests, frase, diario)?')) return;
      try { var u = userData(); u.ikigai = blank(); } catch (e) {}
      save(); renderCirc(); renderFrase(); renderDiario(); renderHist(); renderStats();
    };
  }
}

window.Ikigai = { tab: switchTab, cruces: crucesDe, data: store, shareText: buildShareText, circulos: CIRCULOS };

var _retry = 0;
function setup() {
  var ready = false;
  try { ready = !!document.querySelector('.action-group[data-group="linaje"] .group-btns') && (typeof userData === 'function'); } catch (e) {}
  if (!ready) {
    _retry++;
    if (_retry < 80) setTimeout(setup, 500);
    return;
  }
  try { wire(); } catch (e) {}
  // reintento tardío del puente (metodosDialog es del núcleo y puede pintar después)
  setTimeout(function () { try { bridgeMetodos(); } catch (e) {} }, 2500);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
