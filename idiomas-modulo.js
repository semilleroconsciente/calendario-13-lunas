/* ============================================================
   IDIOMAS · CÓMO APRENDER CUALQUIER IDIOMA — Calendario 13 Lunas
   Sección completa dentro de Aprender > Idiomas y cultura:
   - Botón btnIdiomas (grupo aprender, sub idiomas, guía general
     antes de Kimün Mapuzugun e Inglés)
   - Diálogo idiomasDialog con 6 pestañas:
     1) Guía (método, niveles CEFR, errores, cómo elegir)
     2) Método 28 días (1 luna: plan semanal + checklist diario)
     3) Vocabulario (mazo personal + práctica + lista inicial)
     4) Escucha y habla (shadowing, dictado, TTS del dispositivo)
     5) Gramática base (plantillas universales + 20 frases comodín)
     6) Mi plan y avance (perfil, sesiones, racha, auto-test nivel)
   - Todo local y privado por usuario:
     userData().idiomas = { perfil, habitos, tarjetas, sesiones }
   - 100% offline, sin dependencias. TTS usa la voz del dispositivo
     (speechSynthesis), igual que el módulo de Inglés.
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
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function fmtHoy() {
  try { return cal.fmtDate.format(new Date()); } catch (e) { return todayKey(); }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
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
function userStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return mem();
    if (!u.idiomas) u.idiomas = { perfil: null, habitos: {}, tarjetas: [], sesiones: [] };
    var s = u.idiomas;
    if (!s.perfil) s.perfil = { idioma: '', nivel: 'A1 · principiante', meta: '', minDia: 20, inicio: todayKey(), voz: '' };
    if (!s.habitos) s.habitos = {};
    if (!s.tarjetas) s.tarjetas = [];
    if (!s.sesiones) s.sesiones = [];
    return s;
  } catch (e) { return mem(); }
}
var _mem = null;
function mem() {
  if (!_mem) _mem = { perfil: { idioma: '', nivel: 'A1 · principiante', meta: '', minDia: 20, inicio: todayKey(), voz: '' }, habitos: {}, tarjetas: [], sesiones: [] };
  return _mem;
}
function speak(txt, lang) {
  try {
    if (!('speechSynthesis' in window)) { alert('Este dispositivo no tiene voz disponible'); return; }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(String(txt || ''));
    u.lang = lang || userStore().perfil.voz || 'es-ES';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------------- REFERENCIAS ---------------- */
var TABS = ['Guia', 'Metodo', 'Vocab', 'Oir', 'Gram', 'Plan'];
var TAB_TITLES = { Guia: '📖 Guía', Metodo: '🌙 Método 28 días', Vocab: '🃏 Vocabulario', Oir: '👂 Escucha y habla', Gram: '🧩 Gramática base', Plan: '📈 Mi plan y avance' };
var NIVELES = [
  'A1 · principiante (entiendo saludos y frases sueltas)',
  'A2 · básico (me defiendo en compras, direcciones, pasado simple)',
  'B1 · intermedio (converso de mi vida y planes, aunque lento)',
  'B2 · intermedio-alto (opino y discuto con fluidez parcial)',
  'C1 · avanzado (trabajo/estudio en el idioma con soltura)'
];
var HABITOS = [
  { id: 'escucha', n: '👂 10 min de escucha', d: 'Audio lento + 1 repetición en voz alta (shadowing). Sin subtítulos la 2ª vez.' },
  { id: 'vocab', n: '🃏 7 palabras nuevas', d: 'Solo 7/día. Con ejemplo propio, no sueltas. Repasa las de ayer.' },
  { id: 'frase', n: '💬 3 frases en voz alta', d: 'Grábate 1 vez con el celu y escúchate. Compara mañana.' },
  { id: 'lectura', n: '📖 5 min de lectura', d: 'Texto fácil: cuento infantil, cartel, letra de canción. Subraya 3 palabras.' },
  { id: 'gram', n: '🧩 1 punto de gramática', d: 'Un solo tema (ej: presente de “ser”). 5 ejemplos propios.' },
  { id: 'escribe', n: '✍️ 3 líneas escritas', d: 'Diario mini: qué hice hoy en el idioma. Errores bienvenidos.' },
  { id: 'repaso', n: '🔁 Repaso espaciado', d: 'Caja de tarjetas: las falladas vuelven mañana, las sabidas en 3 días.' },
  { id: 'persona', n: '🤝 1 contacto real', d: 'Saluda, pregunta o enseña a alguien. 2 minutos bastan.' }
];
var SEMANAS = [
  { n: 'Semana 1 · Sonidos + supervivencia (días 1–7)', meta: 'Sonar entendible y sobrevivir: saludos, cortesía, números, yo/tú.', tareas: ['Aprende el alfabeto y 5 sonidos difíciles del idioma (grábate).', 'Memoriza 30 palabras: saludos + cortesía + números 1–20.', 'Arma tus 10 frases comodín (presentarte, pedir, agradecer).', 'Escucha 10 min/día del mismo audio corto (repetición > variedad).', 'Escribe tu presentación de 4 líneas y léela en voz alta 3 veces.'] },
  { n: 'Semana 2 · Frases + presente (días 8–14)', meta: 'Armar frases propias en presente y preguntar.', tareas: ['Suma 30 palabras de tu vida: casa, comida, trabajo, familia.', 'Domina presente de 5 verbos clave (ser, tener, ir, hacer, querer).', 'Practica preguntas: qué, dónde, cuándo, cuánto, puedes…', 'Dictado: escribe lo que escuchas (3 líneas) y corrige.', 'Primera conversación real de 3 minutos (aunque sea con guion).'] },
  { n: 'Semana 3 · Pasado + futuro + oído (días 15–21)', meta: 'Contar qué pasó y qué harás. Entender ideas generales.', tareas: ['Pasado de 5 verbos + 10 marcadores (ayer, después, mañana…).', 'Futuro con “voy a…” + tus 3 planes de la semana.', 'Escucha variada: canción + diálogo + noticia lenta (elige 1/día).', 'Lee un cuento corto completo y resume en 3 frases.', 'Conversación de 5 minutos: cuenta tu semana.'] },
  { n: 'Semana 4 · Conversar + sostener (días 22–28)', meta: 'Presentarte 2 minutos sin leer y sostener charla simple.', tareas: ['Prepara tu presentación de 2 minutos (quién eres, dónde vives, qué haces).', 'Opina simple: me gusta / prefiero / creo que… + por qué.', 'Simula: comprar, pedir ayuda, dar direcciones, presentarte.', 'Repaso total: rescata las 20 tarjetas más falladas.', 'Cierre de luna: graba tu presentación y compara con el día 1.'] }
];
var STARTER = [
  ['👋 Saludos y cortesía', 'hola · chao · buenos días · buenas noches · por favor · gracias · perdón · sí · no'],
  ['🙋 Presentarse', 'me llamo… · soy de… · vivo en… · tengo … años · hablo un poco de… · ¿y tú?'],
  ['🔢 Números útiles', '1–20 · 30, 40, 50 · 100 · cuánto cuesta · la cuenta, por favor'],
  ['🍲 Comer y comprar', 'agua · pan · comida · cuánto es · quiero… · la feria · el mercado · caro / barato'],
  ['🧭 Moverse', 'dónde queda… · izquierda / derecha · cerca / lejos · la micro · a pie'],
  ['💬 Comodines', 'no entiendo · más lento, por favor · ¿cómo se dice…? · repite, por favor · ¿puedes ayudarme?']
];
var FRASES_COMODIN = [
  'Me llamo… / My name is… / Je m’appelle…',
  'Soy de Penco, Chile. / I am from Penco, Chile.',
  '¿Hablas español? Hablo un poco de… / Do you speak…?',
  'No entiendo. Más lento, por favor. / I don’t understand. Slower, please.',
  '¿Cómo se dice ___? / How do you say ___?',
  '¿Cuánto cuesta? / How much is it?',
  'Quiero…, por favor. / I would like…, please.',
  '¿Dónde queda…? / Where is…?',
  '¿Puedes ayudarme? / Can you help me?',
  'Me gusta… / I like…',
  'Necesito… / I need…',
  'Ayer fui… / Yesterday I went…',
  'Mañana voy a… / Tomorrow I am going to…',
  'Creo que… porque… / I think… because…',
  'Perdón, estoy aprendiendo. / Sorry, I am learning.',
  '¿Puedes repetir? / Can you repeat that?',
  'Nos vemos mañana. / See you tomorrow.',
  '¿Qué significa…? / What does… mean?',
  'Estoy practicando todos los días. / I practice every day.',
  'Gracias por tu paciencia. / Thanks for your patience.'
];
var ERRORES = [
  ['❌ Estudiar 3 horas un día y 0 el resto', '✅ 20 min todos los días. La racha manda: 20×7 > 3×1.'],
  ['❌ Memorizar listas sueltas sin ejemplo', '✅ 7 palabras/día con frase propia (“quiero pan” > “pan”).'],
  ['❌ Esperar a “estar listo” para hablar', '✅ Habla desde el día 1: shadowing + grabarte + 1 persona.'],
  ['❌ Solo apps con puntos y rachas', '✅ App = 1/3. Suma audio real + cuaderno + conversación.'],
  ['❌ Traducir todo palabra por palabra', '✅ Aprende bloques (“me gustaría…”, “voy a…”) como piezas.'],
  ['❌ Vergüenza de sonar mal', '✅ Sonar mal 3 meses es el precio de sonar bien 30 años.']
];
var TEST_NIVEL = [
  { q: 'Entiendo saludos y me presento con frases memorizadas.', p: 1 },
  { q: 'Compro, pregunto precios y direcciones sin traductor constante.', p: 2 },
  { q: 'Cuento en pasado y futuro lo que hice y haré esta semana.', p: 3 },
  { q: 'Opino y discuto temas simples aunque me trabe a ratos.', p: 4 },
  { q: 'Trabajo o estudio en el idioma casi sin cambiar al español.', p: 5 },
  { q: 'Entiendo películas/noticias generales y leo textos reales.', p: 5 }
];
var RECURSOS = [
  ['📚 Biblioteca de Penco / Conce', 'Pide cuentos infantiles y diccionarios en tu idioma meta. Gratis y con fecha de devolución = tu plazo.'],
  ['📻 Radio y audio lento', 'Noticias lentas, cuentos con audio, canciones con letra. 1 audio repetido 7 días > 7 audios distintos.'],
  ['🤝 Intercambio real', 'Enseña español 15 min y recibe 15 min. Feria, junta de vecinos, iglesia, club: ofrece “intercambio”.'],
  ['📓 Cuaderno de luna', '1 página/día: 7 palabras + 3 frases + 1 error lindo. Relee cada luna llena.'],
  ['🗣️ Aquí mismo', 'Usa 🗣️ Kimün Mapuzugun, 🔤 Inglés y 🇧🇷 Portugués del calendario: el método de esta sección funciona igual ahí.']
];

/* ---------------- ESTADO UI ---------------- */
var curTab = 'Guia';
var quizSel = {};
var quizRes = null;
var vocabMode = 'lista';
var vocabQuiz = null;
var vocabShowBack = false;

/* ---------------- CÁLCULOS ---------------- */
function diaDelPlan() {
  try {
    var s = userStore(), ini = (s.perfil && s.perfil.inicio) || todayKey();
    var a = new Date(ini + 'T12:00:00').getTime(), b = new Date(todayKey() + 'T12:00:00').getTime();
    if (isNaN(a)) return 1;
    var d = Math.floor((b - a) / 86400000) + 1;
    if (d < 1) d = 1; if (d > 28) d = ((d - 1) % 28) + 1;
    return d;
  } catch (e) { return 1; }
}
function semanaDe(d) { return d <= 7 ? 0 : d <= 14 ? 1 : d <= 21 ? 2 : 3; }
function checksHoy() {
  var s = userStore(), k = todayKey();
  if (!s.habitos[k]) s.habitos[k] = [];
  return s.habitos[k];
}
function racha() {
  var s = userStore(), n = 0, d = new Date();
  for (var i = 0; i < 365; i++) {
    var k;
    try { k = cal.fmtKey.format(d); } catch (e) { k = d.toISOString().slice(0, 10); }
    var ok = (s.habitos[k] && s.habitos[k].length) || s.sesiones.some(function (x) { return x.fecha === k; });
    if (ok) { n++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return n;
}
function statsVocab() {
  var t = userStore().tarjetas, ok = 0, bad = 0;
  t.forEach(function (c) { ok += (+c.ok || 0); bad += (+c.bad || 0); });
  return { n: t.length, ok: ok, bad: bad };
}

/* ---------------- DIÁLOGO ---------------- */
function buildDialog() {
  var body =
    '<div class="timer-tabs su-f7ad78">' +
    TABS.map(function (t, i) {
      return '<button type="button" id="tabIdi' + t + '" class="btn su-30e741' + (i === 0 ? ' btn-accent' : '') + '">' + TAB_TITLES[t] + '</button>';
    }).join('') + '</div>' +
    '<div id="idiStreak" class="menstrual-card su-39553d"></div>' +
    '<div id="idiGuia"></div>' +
    '<div id="idiMetodo" class="hidden"></div>' +
    '<div id="idiVocab" class="hidden"></div>' +
    '<div id="idiOir" class="hidden"></div>' +
    '<div id="idiGram" class="hidden"></div>' +
    '<div id="idiPlan" class="hidden"></div>';
  makeDialog('idiomasDialog', '🌍 Aprende cualquier idioma — método completo',
    'Un solo método para <b>cualquier idioma</b> (inglés, mapuzugun, portugués, francés, creole…): 20 min/día, 1 luna (28 días) por ciclo, 4 habilidades y repaso espaciado. Todo <b>privado, local y offline</b>. ¿Ya elegiste? Practica en 🗣️ <b>Kimün Mapuzugun</b>, 🔤 <b>Inglés</b> y 🇧🇷 <b>Portugués</b> del calendario.',
    body);
}
function switchTab(t) {
  curTab = t;
  TABS.forEach(function (x) {
    var p = $('idi' + x); if (p) p.classList.toggle('hidden', x !== t);
    var b = $('tabIdi' + x); if (b) b.classList.toggle('btn-accent', x === t);
  });
}

/* ---------------- RENDERS ---------------- */
function renderStreak() {
  var el = $('idiStreak'); if (!el) return;
  var s = userStore(), v = statsVocab(), ses = s.sesiones.length;
  var mins = s.sesiones.reduce(function (a, x) { return a + (+x.min || 0); }, 0);
  var idioma = (s.perfil.idioma || 'tu idioma').trim() || 'tu idioma';
  el.innerHTML = '<b>🌍 ' + esc(idioma) + '</b> · día <b>' + diaDelPlan() + '/28</b> de tu luna · ' +
    '🔥 racha <b>' + racha() + ' días</b> · 🃏 <b>' + v.n + '</b> tarjetas (' + v.ok + '✓) · ⏱️ <b>' + ses + '</b> sesiones (' + mins + ' min)' +
    '<span class="muted su-11a508"> — 20 min/día bastan. Marca abajo tu checklist de hoy.</span>';
}
function renderGuia() {
  var box = $('idiGuia'); if (!box) return;
  box.innerHTML =
    '<div class="si-card"><h4>🎯 El método en 1 minuto</h4><p><b>1)</b> Elige 1 idioma y 1 meta (“presentarme 2 minutos en 28 días”). ' +
    '<b>2)</b> 20 min/día: 10 escuchar+repetir, 5 palabras con frase, 5 leer/escribir. <b>3)</b> Habla desde el día 1 (aunque sea solo). ' +
    '<b>4)</b> Repasa con tarjetas: lo fallado vuelve mañana. <b>5)</b> Cada 7 días: 1 conversación real + 1 grabación. ' +
    'Funciona para <b>cualquier idioma</b> porque no depende del idioma: depende del hábito.</p></div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>📊 ¿En qué nivel estoy? (CEFR)</h4><p>' +
    '<b>A1</b> saludos y frases sueltas · <b>A2</b> me defiendo (compras, direcciones, pasado simple)<br>' +
    '<b>B1</b> converso de mi vida aunque lento · <b>B2</b> opino con fluidez parcial<br>' +
    '<b>C1</b> trabajo/estudio en el idioma. La mayoría llega a B1 con <b>3–4 lunas (90–120 días)</b> de 20 min/día.<br>' +
    '<span class="muted">Haz el auto-test en 📈 Mi plan y avance.</span></p></div>' +
    '<div class="discipline-card"><h4>🧭 ¿Qué idioma elijo?</h4><p>El que <b>usarás</b>: ' +
    '🗣️ <b>Mapuzugun</b> (territorio, familia, escuela) · 🔤 <b>Inglés</b> (trabajo, estudios, viaje) · ' +
    '🇧🇷 <b>Portugués</b> · 🇫🇷 <b>Francés</b> · 🇭🇹 <b>Creole</b> (comunidad migrante en Penco). ' +
    '1 idioma por luna: el que suma 2, suma 0.</p>' +
    '<div class="su-6157e8"><button type="button" class="btn su-30e741" data-go="btnMapu">🗣️ Ir a Kimün</button>' +
    '<button type="button" class="btn su-30e741" data-go="btnEnglish">🔤 Ir a Inglés</button>' +
    '<button type="button" class="btn su-30e741" data-go="btnPortugues">🇧🇷 Ir a Portugués</button></div></div>' +
    '</div>' +
    '<div class="si-card"><h4>🚫 6 errores que frenan (y su arreglo)</h4><p>' +
    ERRORES.map(function (e) { return '• ' + esc(e[0]) + '<br><span class="muted">' + esc(e[1]) + '</span>'; }).join('<br>') + '</p></div>' +
    '<div class="si-card"><h4>🗺️ Cómo usar esta sección</h4><p>1) Lee esta guía una vez. 2) Define tu plan en 📈 <b>Mi plan</b> (idioma + meta + minutos). ' +
    '3) Sigue 🌙 <b>Método 28 días</b> día a día. 4) Guarda tus palabras en 🃏 <b>Vocabulario</b>. 5) Entrena oído y boca en 👂 <b>Escucha y habla</b>. ' +
    'Repite 1 luna por ciclo: cada luna subes un escalón.</p></div>';
  bindGo(box);
}
function bindGo(scope) {
  (scope || document).querySelectorAll('[data-go]').forEach(function (b) {
    b.onclick = function () {
      try {
        var d = $('idiomasDialog'); try { d.close(); } catch (e) {}
        var t = $(b.getAttribute('data-go')); if (t) t.click();
      } catch (e) {}
    };
  });
}
function renderMetodo() {
  var box = $('idiMetodo'); if (!box) return;
  var d = diaDelPlan(), sem = semanaDe(d), s = userStore(), chk = checksHoy();
  var semHTML = SEMANAS.map(function (w, i) {
    var open = (i === sem);
    return '<div class="menstrual-card' + (open ? ' su-68a1a9' : '') + '"><h4>' + (open ? '👉 ' : '') + esc(w.n) + '</h4>' +
      '<p class="muted su-11a508">Meta: ' + esc(w.meta) + '</p><p>' +
      w.tareas.map(function (t, k) { return (k + 1) + ') ' + esc(t); }).join('<br>') + '</p></div>';
  }).join('');
  box.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🌙 Tu luna de 28 días — hoy es tu día ' + d + ' (' + esc(SEMANAS[sem].n.split('·')[0]) + ')</h4>' +
    '<p class="muted su-11a508">Inicio: <b>' + esc((s.perfil && s.perfil.inicio) || todayKey()) + '</b> · cambia tu fecha de inicio en 📈 Mi plan. Marca lo de hoy: con 3 de 8 ya avanzas.</p>' +
    '<div class="su-2fb621">' + HABITOS.map(function (h) {
      var on = chk.indexOf(h.id) >= 0;
      return '<label class="check-row"><input type="checkbox" class="idi-hab" value="' + h.id + '"' + (on ? ' checked' : '') + '> <b>' + esc(h.n) + '</b><br><span class="muted">' + esc(h.d) + '</span></label>';
    }).join('') + '</div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="idiHoyOk" class="btn btn-accent su-30e741">💾 Guardar día (' + chk.length + '/8)</button> ' +
    '<span id="idiHoyMsg" class="muted su-11a508"></span></div></div>' +
    semHTML +
    '<div class="si-card"><h4>📏 Regla de la luna</h4><p>Días 1–7 siembra (sonidos) · 8–14 brote (frases) · 15–21 luna llena (conversar sin miedo) · 22–28 menguante (repasar y grabar). ' +
    'Si fallas 1 día, no partas de cero: sigue al día siguiente. La racha se cuida, no se sufre.</p></div>';
  box.querySelectorAll('.idi-hab').forEach(function (c) {
    c.onchange = function () {
      var st = userStore(), k = todayKey(), arr = st.habitos[k] || (st.habitos[k] = []);
      var i = arr.indexOf(c.value);
      if (c.checked && i < 0) arr.push(c.value);
      if (!c.checked && i >= 0) arr.splice(i, 1);
      save('Día guardado ✓');
      var b = $('idiHoyOk'); if (b) b.textContent = '💾 Guardar día (' + arr.length + '/8)';
      var m = $('idiHoyMsg'); if (m) m.textContent = arr.length >= 3 ? '¡Bien! Sigue así 🌱' : arr.length + '/8 — con 3 ya avanzas';
      renderStreak();
    };
  });
  var ok = $('idiHoyOk');
  if (ok) ok.onclick = function () {
    save('Día ' + d + ' guardado 🌙 (' + checksHoy().length + '/8)');
    var m = $('idiHoyMsg'); if (m) m.textContent = 'Guardado ✓ · día ' + d + '/28';
    renderStreak();
  };
}
function vocabCardHTML(c) {
  var show = vocabQuiz && vocabQuiz.id === c.id ? vocabShowBack : false;
  return '<div class="habit-item su-6bf84b"><span><b>' + esc(c.front) + '</b><br>' +
    '<span class="muted su-11a508">' + (show ? esc(c.back) : '··· toca “ver”') + ' · ✓' + (+c.ok || 0) + ' ✗' + (+c.bad || 0) + '</span></span>' +
    '<span class="su-49cd09"><button type="button" class="btn btn-icon idi-vsee" data-k="' + esc(c.id) + '" title="Ver respuesta">👁</button>' +
    '<button type="button" class="btn btn-icon idi-vok" data-k="' + esc(c.id) + '" title="La supe">✓</button>' +
    '<button type="button" class="btn btn-icon idi-vno" data-k="' + esc(c.id) + '" title="Fallé">✗</button>' +
    '<button type="button" class="btn btn-icon idi-vsay" data-k="' + esc(c.id) + '" title="Escuchar">🔊</button>' +
    '<button type="button" class="btn btn-icon idi-vdel" data-k="' + esc(c.id) + '" title="Borrar">🗑</button></span></div>';
}
function renderVocab() {
  var box = $('idiVocab'); if (!box) return;
  var s = userStore(), v = statsVocab();
  var list = s.tarjetas.slice().reverse().slice(0, 40);
  var practicando = vocabQuiz ? s.tarjetas.filter(function (c) { return c.id === vocabQuiz.id; })[0] : null;
  box.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🃏 Mi mazo — ' + v.n + ' tarjetas · ' + v.ok + '✓ / ' + v.bad + '✗</h4>' +
    '<p class="muted su-11a508">Agrega de a 7 por día, siempre con ejemplo (“quiero pan”, no “pan”). Toca ✓/✗ al practicar: las ✗ vuelven mañana.</p>' +
    '<div class="conv-row"><label>Anverso (en tu idioma meta) <input type="text" id="idiVFront" placeholder="ej: I would like bread" maxlength="80"></label>' +
    '<label>Reverso (significado/ejemplo) <input type="text" id="idiVBack" placeholder="ej: quisiera pan — en la feria" maxlength="120"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="idiVAdd" class="btn btn-accent su-30e741">+ Guardar tarjeta</button> ' +
    '<button type="button" id="idiVPract" class="btn su-30e741">🎲 Practicar (aleatoria)</button> ' +
    '<button type="button" id="idiVShare" class="btn su-30e741">📤 Compartir mazo</button></div>' +
    (practicando ? '<div class="si-card su-68a1a9"><h4>🎯 Practicando: ' + esc(practicando.front) + '</h4><p>' + (vocabShowBack ? '<b>' + esc(practicando.back) + '</b>' : 'Piensa el significado… y toca 👁') + '</p></div>' : '') +
    '</div>' +
    '<div class="si-card"><h4>🌱 Para partir hoy (tradúcelas a tu idioma)</h4><p>' +
    STARTER.map(function (g) { return '<b>' + esc(g[0]) + '</b><br><span class="muted">' + esc(g[1]) + '</span>'; }).join('<br><br>') +
    '</p><p class="muted">Copia 7 a tu mazo con su traducción. Mañana, otras 7.</p></div>' +
    '<div class="menstrual-card"><h4>📇 Mis últimas tarjetas (' + list.length + ')</h4><div class="habits-list su-5701fb">' +
    (list.length ? list.map(vocabCardHTML).join('') : '<p class="muted">Sin tarjetas. Agrega tus primeras 7 arriba ☝️</p>') + '</div></div>';
  $('idiVAdd').onclick = function () {
    var f = clean((($('idiVFront') || {}).value || '').trim(), 80);
    var b = clean((($('idiVBack') || {}).value || '').trim(), 120);
    if (!f) return alert('Escribe el anverso (en tu idioma meta)');
    if (!b) return alert('Escribe el reverso (significado o ejemplo)');
    userStore().tarjetas.push({ id: uid('vc'), front: f, back: b, fecha: todayKey(), ok: 0, bad: 0 });
    save('Tarjeta guardada 🃏');
    renderVocab(); renderStreak();
  };
  var pr = $('idiVPract');
  if (pr) pr.onclick = function () {
    var t = userStore().tarjetas;
    if (!t.length) return alert('Agrega primero tus 7 tarjetas de hoy');
    var cand = t.filter(function (c) { return (+c.bad || 0) > 0; });
    var pick = (cand.length && Math.random() < 0.6 ? cand : t)[Math.floor(Math.random() * (cand.length && Math.random() < 0.6 ? cand.length : t.length))];
    vocabQuiz = { id: pick.id }; vocabShowBack = false;
    save('A practicar 🎲'); renderVocab();
  };
  var sh = $('idiVShare');
  if (sh) sh.onclick = function () {
    var t = userStore().tarjetas;
    if (!t.length) return alert('Sin tarjetas para compartir');
    share('🃏 Mi mazo (' + t.length + ')', t.slice(-20).map(function (c) { return '· ' + c.front + ' = ' + c.back; }).join('\n'));
  };
  box.querySelectorAll('.idi-vsee').forEach(function (b) {
    b.onclick = function () { vocabQuiz = { id: b.dataset.k }; vocabShowBack = true; renderVocab(); };
  });
  box.querySelectorAll('.idi-vok').forEach(function (b) {
    b.onclick = function () {
      var c = userStore().tarjetas.filter(function (x) { return x.id === b.dataset.k; })[0];
      if (c) { c.ok = (+c.ok || 0) + 1; save('¡Bien! ✓'); }
      vocabQuiz = null; vocabShowBack = false; renderVocab(); renderStreak();
    };
  });
  box.querySelectorAll('.idi-vno').forEach(function (b) {
    b.onclick = function () {
      var c = userStore().tarjetas.filter(function (x) { return x.id === b.dataset.k; })[0];
      if (c) { c.bad = (+c.bad || 0) + 1; save('Vuelve mañana 🔁'); }
      vocabQuiz = null; vocabShowBack = false; renderVocab(); renderStreak();
    };
  });
  box.querySelectorAll('.idi-vsay').forEach(function (b) {
    b.onclick = function () {
      var c = userStore().tarjetas.filter(function (x) { return x.id === b.dataset.k; })[0];
      if (c) speak(c.front);
    };
  });
  box.querySelectorAll('.idi-vdel').forEach(function (b) {
    b.onclick = function () {
      var st = userStore();
      st.tarjetas = st.tarjetas.filter(function (x) { return x.id !== b.dataset.k; });
      save('Borrada 🗑'); renderVocab(); renderStreak();
    };
  });
}
function renderOir() {
  var box = $('idiOir'); if (!box) return;
  var voz = userStore().perfil.voz || '';
  box.innerHTML =
    '<div class="si-card"><h4>🗣️ Shadowing (la técnica madre)</h4><p>1) Escucha 1 frase corta. 2) Repite <b>encima del audio</b>, pegado a la voz (como sombra). ' +
    '3) Repite 5 veces la misma frase. 4) Grábate y compara. 10 min de shadowing > 1 hora de escucha pasiva. Sirve igual para mapuzugun, inglés o creole.</p></div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>🎧 Rutina de escucha (10 min)</h4><p>Min 0–3: escucha general (¿de qué trata?).<br>Min 3–7: shadowing frase por frase.<br>Min 7–10: sin audio, cuenta lo que entendiste en voz alta.<br><span class="muted">1 audio × 7 días. Cambiar cada día es no aprender ninguno.</span></p></div>' +
    '<div class="discipline-card"><h4>✍️ Dictado (5 min)</h4><p>Escucha 3 líneas, escríbelas, corrige. Marca: ¿fallé oído (no escuché), vocabulario (no sé) u ortografía? Cada tipo se entrena distinto.</p></div>' +
    '</div>' +
    '<div class="menstrual-card su-68a1a9"><h4>🔊 Practica con la voz del dispositivo</h4>' +
    '<p class="muted su-11a508">Escribe una frase de tu idioma meta y escúchala. Para mejor acento, ajusta el código de voz (en-US inglés · es-ES español · fr-FR francés · pt-BR portugués).</p>' +
    '<div class="conv-row"><label>Frase <input type="text" id="idiSayTxt" placeholder="ej: Where is the market?" maxlength="140"></label>' +
    '<label>Código voz <input type="text" id="idiSayVoz" value="' + esc(voz || 'en-US') + '" maxlength="12"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="idiSayBtn" class="btn btn-accent su-30e741">🔊 Escuchar</button> ' +
    '<button type="button" id="idiSaySave" class="btn su-30e741">💾 Guardar voz</button></div></div>' +
    '<div class="si-card"><h4>🤝 Hablar con personas (sin miedo)</h4><p>• <b>Semana 1:</b> saluda a 1 persona (hola + cómo estás). • <b>Semana 2:</b> pregunta 1 cosa (precio, hora). ' +
    '• <b>Semana 3:</b> cuenta 3 frases de tu día. • <b>Semana 4:</b> conversación de 5 min con guion. ' +
    'Frase salvavidas: <i>“Estoy aprendiendo, ¿me ayudas?”</i> — funciona en todos los idiomas.</p></div>';
  $('idiSayBtn').onclick = function () {
    var t = (($('idiSayTxt') || {}).value || '').trim();
    if (!t) return alert('Escribe una frase primero');
    speak(t, (($('idiSayVoz') || {}).value || '').trim() || undefined);
  };
  $('idiSaySave').onclick = function () {
    userStore().perfil.voz = clean((($('idiSayVoz') || {}).value || '').trim(), 12);
    save('Voz guardada 🔊'); renderOir();
  };
}
function renderGram() {
  var box = $('idiGram'); if (!box) return;
  box.innerHTML =
    '<div class="si-card"><h4>🧩 Gramática mínima que abre todo</h4><p>No estudies “toda la gramática”: domina estas <b>6 piezas</b> y ya conversas. Busca cómo se dicen en tu idioma y crea 3 ejemplos de tu vida con cada una.</p></div>' +
    '<div class="help-grid su-d2c171">' +
    [
      ['👥 Pronombres', 'yo · tú · él/ella · nosotros · ustedes · ellos. Todo parte aquí.'],
      ['🫀 Ser + tener + ir', 'soy / estoy · tengo · voy. Con 3 verbos dices el 50% del día.'],
      ['⏳ Presente', '“yo + verbo”: trabajo, como, vivo. 1 forma bien > 10 a medias.'],
      ['🔙 Pasado simple', '“ayer + verbo”: fui, comí, hablé. Solo pasado simple el primer mes.'],
      ['🔜 Futuro con “voy a”', '“mañana voy a…”. El futuro más fácil de todos los idiomas.'],
      ['❓ Preguntar y negar', 'qué/dónde/cuánto + “no”: no entiendo, no tengo. Preguntar abre conversaciones.']
    ].map(function (g) { return '<div class="help-card"><h4>' + esc(g[0]) + '</h4><p class="su-b439ab">' + esc(g[1]) + '</p></div>'; }).join('') + '</div>' +
    '<div class="menstrual-card su-4adf8c"><h4>💬 20 frases comodín (tradúcelas a tu idioma)</h4><p>' +
    FRASES_COMODIN.map(function (f, i) { return (i + 1) + '. ' + esc(f); }).join('<br>') +
    '</p><div class="dlg-actions su-59a5a8"><button type="button" id="idiGramCopy" class="btn su-30e741">📋 Copiar lista</button></div></div>';
  $('idiGramCopy').onclick = function () {
    share('💬 Mis 20 frases comodín', FRASES_COMODIN.map(function (f, i) { return (i + 1) + '. ' + f; }).join('\n'));
  };
}
function renderPlan() {
  var box = $('idiPlan'); if (!box) return;
  var s = userStore(), p = s.perfil;
  var ses = s.sesiones.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 12);
  var mins = s.sesiones.reduce(function (a, x) { return a + (+x.min || 0); }, 0);
  box.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🎯 Mi plan</h4>' +
    '<div class="conv-row"><label>Idioma meta <input type="text" id="idiPIdioma" value="' + esc(p.idioma || '') + '" placeholder="ej: Inglés, Mapuzugun, Portugués" maxlength="30"></label>' +
    '<label>Nivel hoy <select id="idiPNivel">' + NIVELES.map(function (n) { return '<option' + (p.nivel === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Mi meta de esta luna <input type="text" id="idiPMeta" value="' + esc(p.meta || '') + '" placeholder="ej: presentarme 2 min sin leer" maxlength="80"></label>' +
    '<label>Minutos/día <input type="number" id="idiPMin" min="5" max="180" value="' + (+p.minDia || 20) + '"></label></div>' +
    '<div class="conv-row"><label>Inicio de mi luna (día 1) <input type="date" id="idiPInicio" value="' + esc(p.inicio || todayKey()) + '"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="idiPSave" class="btn btn-accent su-30e741">💾 Guardar plan</button></div></div>' +
    '<div class="menstrual-card"><h4>⏱️ Registrar sesión de hoy (' + esc(fmtHoy()) + ')</h4>' +
    '<div class="conv-row"><label>Minutos <input type="number" id="idiSMin" min="1" max="300" value="' + (+p.minDia || 20) + '"></label>' +
    '<label>Foco <select id="idiSFoco"><option>Escucha+habla</option><option>Vocabulario</option><option>Lectura</option><option>Gramática</option><option>Escritura</option><option>Conversación real</option></select></label></div>' +
    '<label>Nota <input type="text" id="idiSNota" placeholder="ej: shadowing 10 min + 7 tarjetas" maxlength="120"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="idiSAdd" class="btn btn-accent su-30e741">+ Guardar sesión</button></div>' +
    '<p class="muted su-11a508">Llevas <b>' + s.sesiones.length + '</b> sesiones · <b>' + mins + '</b> min totales · racha <b>' + racha() + '</b> días.</p></div>' +
    '<div class="menstrual-card"><h4>🧪 Auto-test de nivel (marca lo que ya haces)</h4>' +
    TEST_NIVEL.map(function (t, i) {
      return '<label class="check-row"><input type="checkbox" class="idi-test" value="' + i + '"' + (quizSel[i] ? ' checked' : '') + '> ' + esc(t.q) + '</label>';
    }).join('') +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="idiTestGo" class="btn btn-accent su-30e741">Ver mi nivel</button></div>' +
    '<div id="idiTestRes">' + (quizRes ? '<div class="si-card su-68a1a9"><h4>' + esc(quizRes) + '</h4></div>' : '') + '</div></div>' +
    '<div class="menstrual-card"><h4>📓 Mis sesiones (últimas ' + ses.length + ')</h4><div class="habits-list su-5701fb">' +
    (ses.length ? ses.map(function (x) {
      return '<div class="hora-item"><span><b>' + esc(x.fecha) + '</b> · ' + (+x.min || 0) + ' min · ' + esc(x.foco || '') + (x.nota ? '<br><span class="muted">' + esc(x.nota) + '</span>' : '') + '</span><button type="button" class="btn btn-icon idi-sdel" data-k="' + esc(x.id) + '">✕</button></div>';
    }).join('') : '<p class="muted">Sin sesiones. Registra la primera arriba ☝️</p>') + '</div>' +
    '<div class="dlg-actions su-cc4a4c"><span class="muted"></span><span class="su-3de8f9"><button type="button" id="idiShare" class="btn su-30e741">📤 Compartir avance</button> ' +
    '<button type="button" id="idiClear" class="btn su-214f75">🗑 Borrar datos</button></span></div></div>' +
    '<div class="si-card"><h4>📚 Recursos sin pagar (Penco)</h4><p>' +
    RECURSOS.map(function (r) { return '<b>' + esc(r[0]) + '</b><br><span class="muted">' + esc(r[1]) + '</span>'; }).join('<br><br>') + '</p></div>';
  $('idiPSave').onclick = function () {
    var st = userStore();
    st.perfil.idioma = clean((($('idiPIdioma') || {}).value || '').trim(), 30);
    st.perfil.nivel = ($('idiPNivel') || {}).value || st.perfil.nivel;
    st.perfil.meta = clean((($('idiPMeta') || {}).value || '').trim(), 80);
    st.perfil.minDia = Math.max(5, Math.min(180, +($('idiPMin') || {}).value || 20));
    st.perfil.inicio = ($('idiPInicio') || {}).value || todayKey();
    save('Plan guardado 🎯');
    renderStreak(); renderMetodo(); renderPlan();
  };
  $('idiSAdd').onclick = function () {
    userStore().sesiones.push({
      id: uid('ss'), fecha: todayKey(),
      min: Math.max(1, Math.min(300, +($('idiSMin') || {}).value || 20)),
      foco: ($('idiSFoco') || {}).value || '',
      nota: clean((($('idiSNota') || {}).value || '').trim(), 120)
    });
    save('Sesión guardada ⏱️');
    if ($('idiSNota')) $('idiSNota').value = '';
    renderStreak(); renderPlan();
  };
  box.querySelectorAll('.idi-test').forEach(function (c) {
    c.onchange = function () { if (c.checked) quizSel[c.value] = 1; else delete quizSel[c.value]; };
  });
  $('idiTestGo').onclick = function () {
    var pts = Object.keys(quizSel).reduce(function (a, k) { return a + TEST_NIVEL[+k].p; }, 0);
    var n = Object.keys(quizSel).length;
    if (!n) return alert('Marca al menos 1 frase que ya haces');
    quizRes = pts <= 2 ? '🌱 Estás en A1 · principiante — parte en Semana 1 del Método 28 días.'
      : pts <= 5 ? '🌿 Estás en A2 · básico — parte en Semana 2 y suma conversación.'
      : pts <= 9 ? '💬 Estás en B1 · intermedio — haz la luna completa y graba tu presentación.'
      : pts <= 14 ? '📜 Estás en B2 · intermedio-alto — opina y discute; te falta C1.'
      : '🏆 Estás en C1 · avanzado — enseña a alguien: enseñar fija el idioma.';
    var r = $('idiTestRes');
    if (r) r.innerHTML = '<div class="si-card su-68a1a9"><h4>' + esc(quizRes) + '</h4><p class="muted">Marcaste ' + n + '/6 · puntaje ' + pts + '. Repite este test cada luna.</p></div>';
    save('Nivel estimado ✓');
  };
  box.querySelectorAll('.idi-sdel').forEach(function (b) {
    b.onclick = function () {
      var st = userStore();
      st.sesiones = st.sesiones.filter(function (x) { return x.id !== b.dataset.k; });
      save('Borrada'); renderStreak(); renderPlan();
    };
  });
  var sh = $('idiShare');
  if (sh) sh.onclick = function () {
    var st = userStore(), v = statsVocab();
    share('🌍 Mi avance (' + (st.perfil.idioma || 'idioma') + ')',
      '🌍 ' + (st.perfil.idioma || 'Mi idioma') + ' · nivel ' + (st.perfil.nivel || '?') +
      '\nMeta: ' + (st.perfil.meta || '—') +
      '\nRacha: ' + racha() + ' días · día ' + diaDelPlan() + '/28' +
      '\nTarjetas: ' + v.n + ' (' + v.ok + '✓) · Sesiones: ' + st.sesiones.length);
  };
  var cl = $('idiClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu avance de idiomas? (guías intactas)')) return;
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (u && u.idiomas) u.idiomas = null;
    } catch (e) {}
    _mem = null; quizSel = {}; quizRes = null; vocabQuiz = null;
    save('Borrado 🗑'); renderAll();
  };
}
function renderAll() {
  renderStreak(); renderGuia(); renderMetodo(); renderVocab(); renderOir(); renderGram(); renderPlan();
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) inyectar botón en Aprender > Idiomas (guía general primero) */
  try {
    var existing = $('btnIdiomas');
    if (existing) {
      try { existing.setAttribute('data-sub', 'idiomas'); } catch (eS) {}
    }
    if (!existing) {
      var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnIdiomas'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌍 Aprende un idioma';
        try { btn.setAttribute('data-sub', 'idiomas'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'idioma idiomas aprender ingles portugues frances creole mapuzugun metodo vocabulario gramatica conversacion shadowing ceFR a1 b2 polyglot duolingo traducir hablar escuchar pronunciacion luna 28 dias plan');
        var ref = g.querySelector('#btnMapu');
        if (ref) g.insertBefore(btn, ref);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnIdiomas') < 0) ALL_BTNS.unshift('btnIdiomas');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnIdiomas = ['aprender', 'idiomas'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|idiomas'] && BTN_ORDER['aprender|idiomas'].indexOf('btnIdiomas') < 0) {
      BTN_ORDER['aprender|idiomas'].unshift('btnIdiomas');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnIdiomas = true; });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Aprender) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnIdiomas"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnIdiomas"> 🌍 Aprende un idioma';
          var ref2 = gr.querySelector('input[data-btn="btnMapu"]');
          if (ref2 && ref2.closest && ref2.closest('label') && ref2.closest('label').parentNode) {
            ref2.closest('label').parentNode.insertBefore(lab, ref2.closest('label'));
          } else { gr.appendChild(lab); }
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnIdiomas !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnIdiomas = lab.querySelector('input').checked;
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

  /* 4) diálogo + renders */
  buildDialog();
  renderAll();

  var b = $('btnIdiomas');
  if (b) b.onclick = function () {
    renderAll();
    switchTab('Guia');
    openDlg('idiomasDialog');
  };

  TABS.forEach(function (t) {
    var tb = $('tabIdi' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
