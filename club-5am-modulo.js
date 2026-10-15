/* ============================================================
   CLUB DE LAS 5 DE LA MAÑANA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente (inspirada en el método de
   levantarse a las 05:00 de Robin Sharma, en lenguaje propio):
   - Botón btnClub5am (🌅 Club 5 AM) en Mi Día > Organizar
   - Diálogo club5amDialog con 5 pestañas:
     1) 📖 Guía (qué es, por qué funciona, fórmula 20/20/20,
        los 4 imperios internos, regla 66/90/90/1, 60/10,
        adaptación a Penco, cuidados y a quién NO le sirve)
     2) 🌅 Mi Victoria (checklist diario 20/20/20: moverse,
        reflexionar, crecer + hora de despertar + nota)
     3) 🔥 Reto 66 días (grilla de 66 días en 3 fases:
        destrucción, instalación, integración + racha)
     4) 😴 Descanso (calculadora de hora de acostarse según
        hora de despertar + ritual nocturno + registro)
     5) 📊 Mi progreso (victorias, %, racha, últimas 2 lunas,
        compartir, llevar al calendario, borrar)
   - Todo local y privado por usuario: userData().club5am
     { dias:{'yyyy-mm-dd':{wake,move,reflect,grow,nota,stars}},
       inicio66:'yyyy-mm-dd', checks66:{1:true..}, sueno:{},
       ritual:{}, cfg:{wake:'05:00', dormirHoras:8} }
   - Educativo, no terapia ni consejo médico. 100% offline.
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
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function blank() {
  return {
    dias: {}, inicio66: '', checks66: {}, sueno: {},
    ritual: {}, cfg: { wake: '05:00', dormirHoras: 8 }
  };
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.club5am) u.club5am = blank();
    var c = u.club5am;
    if (!c.dias) c.dias = {};
    if (!c.checks66) c.checks66 = {};
    if (!c.sueno) c.sueno = {};
    if (!c.ritual) c.ritual = {};
    if (!c.cfg) c.cfg = { wake: '05:00', dormirHoras: 8 };
    if (!c.cfg.wake) c.cfg.wake = '05:00';
    if (!c.cfg.dormirHoras) c.cfg.dormirHoras = 8;
    return c;
  } catch (e) { return blank(); }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function refrescarCal() { try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch (e) {} }
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

/* ---------- fechas ---------- */
function parseKey(key) { var p = String(key || '').split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
function keyFromUTC(ms) {
  var d = new Date(ms);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
function addDays(key, n) { var p = parseKey(key); return keyFromUTC(Date.UTC(p.y, p.m - 1, p.d, 12) + n * 86400000); }
function diffDays(a, b) {
  try {
    var pa = parseKey(a), pb = parseKey(b);
    return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d, 12) - Date.UTC(pa.y, pa.m - 1, pa.d, 12)) / 86400000);
  } catch (e) { return 0; }
}
function validKey(k) { return /^\d{4}-\d{2}-\d{2}$/.test(k || ''); }
function lunaTxt(key) {
  try {
    if (typeof lunaMapForKey === 'function') {
      var r = lunaMapForKey(key);
      if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN;
    }
  } catch (e) {}
  return '';
}

/* ---------- calendario (llevar la victoria del día) ---------- */
function celdaPara(fechaKey) {
  var ref = null;
  try { if (typeof lunaMapForKey === 'function') ref = lunaMapForKey(fechaKey); } catch (e) {}
  if (!ref) return { error: 'Esa fecha está fuera del ciclo de 13 lunas visible.' };
  if (ref.luna === 'dft') return { ref: ref, dft: true };
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    var cyk = u && u.cycles ? u.cycles[String(ref.y)] : null;
    if (!cyk) return { error: 'No se pudo abrir el ciclo ' + ref.y + '.' };
    if (!cyk.moons[String(ref.luna)]) cyk.moons[String(ref.luna)] = { days: {} };
    var m = cyk.moons[String(ref.luna)];
    if (!m.days[ref.diaN]) m.days[ref.diaN] = { nota: '', animo: -1, agenda: [] };
    if (!Array.isArray(m.days[ref.diaN].agenda)) m.days[ref.diaN].agenda = [];
    return { ref: ref, cell: m.days[ref.diaN] };
  } catch (e) { return { error: 'No se pudo abrir ese día.' }; }
}
function llevarAlCalendario(fechaKey, texto, hora) {
  var hhmm = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(hora || '') ? hora : store().cfg.wake;
  var p = hhmm.split(':');
  var r = celdaPara(fechaKey);
  if (r.error) { try { alert(r.error); } catch (e) {} return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + texto + ' ' + hhmm : texto + ' ' + hhmm;
      save('📌 En el DFT ✓'); refrescarCal(); return;
    } catch (e) { try { alert('No se pudo guardar en el DFT.'); } catch (e2) {} return; }
  }
  var ya = r.cell.agenda.some(function (a) { return String(a.text || '').indexOf(texto.slice(0, 30)) >= 0; });
  if (!ya) r.cell.agenda.push({ id: uid('a'), hour: +p[0], minute: +p[1], time: hhmm, text: clean(texto, 80), notify: false, notified: false });
  save('📌 En el calendario ✓');
  refrescarCal();
}

/* ---------- datos fijos ---------- */
var BLOQUES = [
  { id: 'move', ico: '🏃', n: '05:00–05:20 · Moverse', desc: '20 min de cuerpo: sudar para despertar el cerebro.',
    ideas: ['Caminata rápida por el borde costero o la cuadra (10 ida + 10 vuelta)', '20 sentadillas + 10 flexiones (apoyando rodillas si hace falta) + plancha 20s, x2', 'Subir y bajar escaleras 10 min + elongación 10 min', 'Baile con 5 canciones que te prendan', 'Trote suave + respiración por nariz'] },
  { id: 'reflect', ico: '🪞', n: '05:20–05:40 · Reflexionar', desc: '20 min de silencio: ordenar la mente antes que el mundo la desordene.',
    ideas: ['Escribir 1 página: lo que siento, lo que quiero, lo que agradezco', 'Meditar o rezar 10 min + gratitud escrita (3 cosas)', 'Releer tu ikigai o tu carta de honra y anotar 1 intención', 'Respiración 4-7-8: 6 ciclos + 5 min de silencio mirando el cielo', 'Diario de sueños (pewma): anotar lo soñado antes que se borre'] },
  { id: 'grow', ico: '🌱', n: '05:40–06:00 · Crecer', desc: '20 min de aprender: una idea diaria que te hace más capaz.',
    ideas: ['Leer 10–15 páginas de un libro que te forme', 'Estudiar mapuzugun: 5 palabras nuevas en voz alta', 'Escuchar un audio o clase corta y anotar 1 idea aplicable', 'Repasar tu oficio: practicar 1 técnica 20 min', 'Leer tu reto de 21 días y planificar el paso de hoy'] }
];
var RITUAL_NOCHE = [
  { id: 'pantallas', t: '📵 Pantallas fuera 1 h antes', d: 'Celular a cargar fuera del dormitorio. Nada de noticias ni redes en cama.' },
  { id: 'ropa', t: '👟 Ropa lista', d: 'Zapatillas + ropa de moverte dejadas junto a la cama. Quita la fricción de la mañana.' },
  { id: 'plan', t: '📝 Mañana en 3 líneas', d: 'Anota los 3 bloques de mañana (mover / reflexionar / crecer) + 1 prioridad del día.' },
  { id: 'luz', t: '💡 Luz baja y pieza fresca', d: 'Luz cálida tenue, pieza ventilada y oscura. El cuerpo duerme mejor con frío leve.' },
  { id: 'mate', t: '🍵 Guata liviana', d: 'Cena liviana 2–3 h antes. Nada de café después de las 14:00.' }
];
var FASES66 = [
  { n: 1, nombre: '⛏️ Destrucción (días 1–22)', desc: 'Cuesta: el cuerpo reclama la cama vieja. Gana por puntos, no por perfección. Si fallas un día, retoma al siguiente: la regla es nunca fallar dos veces seguidas.' },
  { n: 2, nombre: '🌿 Instalación (días 23–44)', desc: 'El hábito se instala: ya no peleas tanto. Sube la exigencia de a poco (más minutos, más silencio, mejor lectura).' },
  { n: 3, nombre: '🌸 Integración (días 45–66)', desc: 'Ya eres “persona de las 5 AM”: el cuerpo despierta solo. Consolida y planifica cómo sigue después del día 66.' }
];
function fase66(n) { if (n <= 22) return FASES66[0]; if (n <= 44) return FASES66[1]; return FASES66[2]; }

/* ---------- estado UI ---------- */
var tab = 'Guia';
var diaSel = '';

function diaRec(key) {
  var s = store();
  if (!s.dias[key]) s.dias[key] = { wake: s.cfg.wake, move: false, reflect: false, grow: false, nota: '', stars: 0 };
  return s.dias[key];
}
function puntaje(r) { return (r.move ? 1 : 0) + (r.reflect ? 1 : 0) + (r.grow ? 1 : 0); }
function esVictoria(r) { return !!(r.move && r.reflect && r.grow); }
function victorias() {
  var s = store(), n = 0;
  Object.keys(s.dias).forEach(function (k) { if (esVictoria(s.dias[k])) n++; });
  return n;
}
function racha() {
  var s = store(), n = 0;
  var cur = todayKey();
  if (!s.dias[cur] || !esVictoria(s.dias[cur])) cur = addDays(cur, -1);
  for (var i = 0; i < 500; i++) {
    var r = s.dias[cur];
    if (r && esVictoria(r)) { n++; cur = addDays(cur, -1); }
    else break;
  }
  return n;
}
function hechos66() {
  var s = store(), c = 0;
  for (var n = 1; n <= 66; n++) if (s.checks66[n]) c++;
  return c;
}
function racha66() {
  var s = store();
  if (!s.inicio66) return 0;
  var hoy = Math.min(Math.max(diffDays(s.inicio66, todayKey()) + 1, 1), 66);
  var r = 0;
  for (var n = hoy; n >= 1; n--) {
    if (s.checks66[n]) r++;
    else if (n < hoy) break;
  }
  return r;
}

/* ---------- hora de acostarse ---------- */
function horaAcostarse(wakeHHMM, horas) {
  try {
    var p = String(wakeHHMM || '05:00').split(':');
    var mins = (+p[0]) * 60 + (+p[1]) - Math.round((+horas || 8) * 60) - 15;
    mins = ((mins % 1440) + 1440) % 1440;
    var h = Math.floor(mins / 60), m = mins % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  } catch (e) { return '21:45'; }
}

/* ---------- render ---------- */
function cssOnce() {
  if ($('c5style')) return;
  var st = document.createElement('style');
  st.id = 'c5style';
  st.textContent =
    '.c5-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px}' +
    '.c5-day{border:1px solid var(--gold);border-radius:10px;padding:8px;background:var(--panel);font-size:11px;line-height:1.5}' +
    '.c5-day.hecho{border-color:#7fd08a;background:#12351f33}' +
    '.c5-day.hoy{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}' +
    '.c5-bar{height:10px;border-radius:6px;background:#ffffff22;overflow:hidden;margin:6px 0}' +
    '.c5-bar>i{display:block;height:100%;background:linear-gradient(90deg,#f5a623,var(--accent));border-radius:6px}' +
    '.c5-check{display:flex;gap:8px;align-items:flex-start;background:var(--panel);border:1px solid #ffffff22;border-radius:10px;padding:10px;margin-top:8px;cursor:pointer}' +
    '.c5-check.on{border-color:#7fd08a;background:#12351f33}' +
    '.c5-check input{transform:scale(1.4);margin-top:3px}';
  document.head.appendChild(st);
}
function barHTML(p) { return '<div class="c5-bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>'; }
function renderTabs() {
  ['Guia', 'Victoria', 'Reto', 'Descanso', 'Progreso'].forEach(function (t) {
    var b = $('tabC5' + t);
    if (b) { b.className = 'btn su-30e741' + (tab === t ? ' btn-accent' : ''); b.style.width = 'auto'; }
    var p = $('c5' + t + 'Panel');
    if (p) p.classList.toggle('hidden', tab !== t);
  });
}
function renderHead() {
  var box = $('c5head');
  if (!box) return;
  var s = store();
  var keys = Object.keys(s.dias);
  if (!keys.length && !s.inicio66) {
    box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>🌅 Tu hora victoriosa: 05:00–06:00</h4>' +
      '<p class="muted su-b439ab">Mientras Penco duerme, tú entrenas cuerpo, mente y espíritu en 3 bloques de 20 minutos. Marca tu primera victoria en <b>🌅 Mi Victoria</b>. La única competencia es la cama tibia.</p></div>';
    return;
  }
  var tot = keys.length, vic = victorias(), r = racha();
  var prom = tot ? Math.round(vic / tot * 100) : 0;
  var h66 = s.inicio66 ? hechos66() : 0;
  box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>🌅 ' + vic + ' victoriosa(s) · ' + prom + '% de tus mañanas · 🔥 racha ' + r + '</h4>' + barHTML(prom) +
    '<p class="muted su-11a508">' + (s.inicio66 ? '🔥 Reto 66: ' + h66 + '/66 días desde el ' + esc(s.inicio66) + '. ' : 'Sin reto 66 activo. ') +
    'Despertador habitual: ⏰ ' + esc(s.cfg.wake) + ' · Acostarse sugerido: 😴 ' + esc(horaAcostarse(s.cfg.wake, s.cfg.dormirHoras)) + '</p></div>';
}

function renderGuia() {
  var box = $('c5guiaBox');
  if (!box || box.dataset.done) return;
  box.dataset.done = '1';
  box.innerHTML =
    '<div class="si-card"><h4>🌅 ¿Qué es el Club de las 5 de la mañana?</h4>' +
    '<p>Un método simple: <b>levántate a las 05:00 y regálate la primera hora del día</b> (la “hora victoriosa”, de 05:00 a 06:00) antes de que el trabajo, el celular y la casa te la quiten. Esa hora se divide en <b>3 bloques de 20 minutos</b>: moverse, reflexionar y crecer. La idea no es dormir menos, sino <b>acostarse más temprano</b> para dormir lo mismo y ganar una hora de oro.</p></div>' +
    '<div class="si-card"><h4>🧪 ¿Por qué funciona?</h4>' +
    '<p><b>1) Silencio:</b> a las 5 nadie te pide nada: foco total.<br><b>2) Cuerpo primero:</b> moverte al amanecer sube la energía del día entero.<br><b>3) Mente ordenada:</b> escribir y meditar antes de leer noticias evita partir reactivo.<br><b>4) Interés compuesto:</b> 1 hora diaria × 66 días = 66 horas de entrenamiento que casi nadie hace.</p></div>' +
    '<div class="help-grid su-8a77e5">' +
    '<div class="help-card"><h4>🏃 20 · Moverse</h4><p class="su-11a508">Sudar 20 min: caminata, sentadillas, escaleras, baile. Despierta el cerebro mejor que el café.</p></div>' +
    '<div class="help-card"><h4>🪞 20 · Reflexionar</h4><p class="su-11a508">Escribir, meditar, rezar o agradecer. Ordena emociones y fija la intención del día.</p></div>' +
    '<div class="help-card"><h4>🌱 20 · Crecer</h4><p class="su-11a508">Leer, estudiar o practicar tu oficio. Una idea diaria = 365 ideas al año.</p></div>' +
    '</div>' +
    '<div class="si-card"><h4>🏛️ Los 4 imperios internos</h4>' +
    '<p>El método propone entrenar 4 áreas a la vez, sin obsesionarte con una sola: <b>mente</b> (aprender y pensar claro), <b>corazón</b> (emociones, vínculos, perdón), <b>cuerpo</b> (movimiento, sueño, comida) y <b>espíritu</b> (sentido, gratitud, servicio). Cada mañana toca al menos 2 de los 4: el cuerpo con el bloque 1, el espíritu con el 2, la mente con el 3.</p></div>' +
    '<div class="si-card"><h4>📏 Las reglas que lo sostienen</h4>' +
    '<p><b>66 días mínimo:</b> 22 para romper la resistencia, 22 para instalar, 22 para integrar.<br><b>90/90/1:</b> 90 días, los primeros 90 minutos del día, dedicados a tu proyecto más importante.<br><b>60/10:</b> trabaja 60 min a fondo y descansa 10 sin pantallas.<br><b>Ciclo gemelo:</b> rinde fuerte de día y recupera fuerte de noche (sueño, calma, naturaleza).<br><b>Nunca dos seguidas:</b> fallar un día es humano; fallar dos seguidos crea la costumbre vieja.</p></div>' +
    '<div class="si-card"><h4>🌊 Adaptado a Penco</h4>' +
    '<p>En invierno amanece tarde y hace frío: parte con luz encendida, zapatillas al lado de la cama y movimiento <b>dentro de la casa</b> (escaleras, baile, sentadillas). En verano aprovecha el borde costero: caminar mirando el mar a las 5 es gratis y no necesita gym. Si trabajas por turnos o te acuestas pasada la medianoche, <b>mueve tu “5 AM”</b>: levántate 1 hora antes de lo habitual, sea a las 5, las 6 o las 7. El número importa menos que el ritual.</p></div>' +
    '<div class="si-card"><h4>⚠️ Cuidados (léeme)</h4>' +
    '<p>Esto <b>no es para dormir menos</b>: necesitas 7–9 h igual. Si debes levantarte a las 5, acuéstate ~21:30–22:00. <b>No lo hagas así no más</b> si estás embarazada, con depresión o insomnio severo, con enfermedad al corazón, tomando medicamentos que dan sueño, o si eres adolescente (necesitan 8–10 h). En esos casos consulta tu CESFAM y adapta la hora. Si sientes somnolencia manejando o en el trabajo, duerme más: la constancia rinde solo con descanso real.</p></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="c5goVic" class="btn btn-accent su-30e741">🌅 Marcar mi victoria de hoy →</button> <button type="button" id="c5goReto" class="btn su-30e741">🔥 Partir el reto 66 →</button></div>';
  if ($('c5goVic')) $('c5goVic').onclick = function () { tab = 'Victoria'; render(); };
  if ($('c5goReto')) $('c5goReto').onclick = function () { tab = 'Reto'; render(); };
}

function bloqueCheckHTML(r, b) {
  var on = !!r[b.id === 'move' ? 'move' : b.id === 'reflect' ? 'reflect' : 'grow'];
  var key = b.id === 'move' ? 'move' : b.id === 'reflect' ? 'reflect' : 'grow';
  return '<label class="c5-check' + (on ? ' on' : '') + '"><input type="checkbox" data-bloq="' + key + '"' + (on ? ' checked' : '') + '>' +
    '<span><b>' + b.ico + ' ' + esc(b.n) + '</b><br><span class="muted">' + esc(b.desc) + '</span><br>' +
    '<span class="muted su-0d5be0">💡 Hoy puedes: ' + esc(b.ideas[Math.floor(Math.random() * b.ideas.length)]) + '</span></span></label>';
}

function renderVictoria() {
  var box = $('c5vicBox');
  if (!box) return;
  var s = store();
  if (!diaSel || !validKey(diaSel)) diaSel = todayKey();
  var r = diaRec(diaSel);
  var p = Math.round(puntaje(r) / 3 * 100);
  var luna = lunaTxt(diaSel);
  box.innerHTML =
    '<div class="conv-row"><label class="su-4b3de7">📅 Día <input type="date" id="c5vicFecha" value="' + esc(diaSel) + '"></label>' +
    '<label>⏰ Desperté <input type="time" id="c5vicWake" value="' + esc(r.wake || s.cfg.wake) + '"></label>' +
    '<label>⭐ Mi mañana <select id="c5vicStars">' +
    [0, 1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (+r.stars === n ? ' selected' : '') + '>' + (n === 0 ? 'sin nota' : '★'.repeat(n)) + '</option>'; }).join('') +
    '</select></label></div>' +
    (luna ? '<p class="muted su-11a508">🌙 ' + esc(luna) + '</p>' : '') +
    '<div class="menstrual-card su-68a1a9"><h4>' + (esVictoria(r) ? '🏆 ¡VICTORIA! 3/3 completos' : '🌅 Mi hora victoriosa: ' + puntaje(r) + '/3 (' + p + '%)') + '</h4>' + barHTML(p) +
    BLOQUES.map(function (b) { return bloqueCheckHTML(r, b); }).join('') +
    '<label>📝 Frase o nota de mi mañana <input type="text" id="c5vicNota" placeholder="ej: caminé 20 min y leí 12 páginas, día claro" maxlength="140" value="' + esc(r.nota || '') + '"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="c5vicSave" class="btn btn-accent su-30e741">💾 Guardar</button>' +
    '<button type="button" id="c5vicCal" class="btn su-30e741">📌 Llevar al calendario</button>' +
    '<button type="button" id="c5vicShare" class="btn su-30e741">📤 Compartir</button></div></div>' +
    '<p class="muted su-11a508">Consejo: deja la ropa lista esta noche y el celular lejos. A las 5 no se negocia: se ejecuta con los ojos pegados igual.</p>';
  if ($('c5vicFecha')) $('c5vicFecha').onchange = function () {
    if (!validKey($('c5vicFecha').value)) { alert('Fecha inválida'); return; }
    diaSel = $('c5vicFecha').value;
    renderVictoria();
  };
  box.querySelectorAll('[data-bloq]').forEach(function (ch) {
    ch.onchange = function () {
      var k = ch.getAttribute('data-bloq');
      r[k] = ch.checked;
      save(ch.checked ? 'Bloque logrado ✅' : 'Marca quitada');
      renderVictoria(); renderHead();
    };
  });
  if ($('c5vicWake')) $('c5vicWake').onchange = function () {
    r.wake = $('c5vicWake').value || s.cfg.wake;
    s.cfg.wake = r.wake;
    save('Despertador: ' + r.wake + ' ⏰');
    renderHead();
  };
  if ($('c5vicStars')) $('c5vicStars').onchange = function () { r.stars = +$('c5vicStars').value; save('Guardado ⭐'); };
  if ($('c5vicSave')) $('c5vicSave').onclick = function () {
    r.nota = clean(($('c5vicNota') || {}).value || '', 140);
    r.wake = ($('c5vicWake') || {}).value || r.wake;
    save(esVictoria(r) ? '🏆 ¡Victoria guardada!' : 'Mañana guardada 🌅');
    renderVictoria(); renderHead();
  };
  if ($('c5vicShare')) $('c5vicShare').onclick = function () {
    share('🌅 Mi mañana 5 AM (' + diaSel + ')',
      '⏰ Desperté: ' + (r.wake || '-') + '\n' + (r.move ? '✅' : '⭕') + ' Moverse 20\n' + (r.reflect ? '✅' : '⭕') + ' Reflexionar 20\n' + (r.grow ? '✅' : '⭕') + ' Crecer 20' + (r.nota ? '\n📝 ' + r.nota : ''));
  };
  if ($('c5vicCal')) $('c5vicCal').onclick = function () {
    var txt = '[5AM] 🌅 Hora victoriosa ' + puntaje(r) + '/3' + (r.nota ? ': ' + r.nota : '');
    llevarAlCalendario(diaSel, txt, r.wake || s.cfg.wake);
  };
}

function renderReto() {
  var box = $('c5retoBox');
  if (!box) return;
  var s = store();
  if (!s.inicio66) {
    box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>🔥 El reto de los 66 días</h4>' +
      '<p class="muted su-b439ab">Un día victorioso (3/3) = 1 día del reto. El método dice que un hábito nuevo necesita <b>66 días mínimo</b>: 22 para romper la resistencia, 22 para instalar y 22 para integrar. ¿Partimos?</p>' +
      '<div class="conv-row"><label>📅 Parto el <input type="date" id="c5retoInicio" value="' + esc(todayKey()) + '"></label></div>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="c5retoGo" class="btn btn-accent su-30e741">🔥 Partir mi reto 66</button></div></div>' +
      FASES66.map(function (f) { return '<div class="si-card"><h4>' + esc(f.nombre) + '</h4><p>' + esc(f.desc) + '</p></div>'; }).join('');
    if ($('c5retoGo')) $('c5retoGo').onclick = function () {
      var f = ($('c5retoInicio') || {}).value || todayKey();
      if (!validKey(f)) { alert('Fecha inválida'); return; }
      s.inicio66 = f;
      save('🔥 ¡Reto 66 iniciado!');
      renderReto(); renderHead();
    };
    return;
  }
  var h = hechos66(), p = Math.round(h / 66 * 100);
  var hoyN = Math.min(Math.max(diffDays(s.inicio66, todayKey()) + 1, 1), 66);
  var grid = '';
  for (var n = 1; n <= 66; n++) {
    var f = fase66(n);
    var col = f.n === 1 ? '#e79a7a' : f.n === 2 ? '#e8c56a' : '#8fd694';
    var cls = s.checks66[n] ? 'hecho' : (n === hoyN ? 'hoy' : '');
    var mark = s.checks66[n] ? '✅' : (n === hoyN ? '👉' : '⭕');
    grid += '<div class="c5-day ' + cls + '" title="' + esc(f.nombre) + '"><b>' + mark + ' D' + n + '</b> · ' + esc(addDays(s.inicio66, n - 1).slice(5)) +
      '<br><span class="chip" style="font-size:9px;border-color:' + col + '55">' + esc(f.nombre.split('(')[0]) + '</span>' +
      '<div><button type="button" class="btn su-9f0529" data-c66="' + n + '">' + (s.checks66[n] ? '↩️' : '✓') + '</button></div></div>';
  }
  box.innerHTML = '<div class="menstrual-card su-435dbc"><h4>🔥 Reto 66 · ' + h + '/66 (' + p + '%) · 🔥 racha ' + racha66() + '</h4>' + barHTML(p) +
    '<p class="muted su-11a508">📅 ' + esc(s.inicio66) + ' → ' + esc(addDays(s.inicio66, 65)) + ' · hoy es el día ' + hoyN + '/66 · ' + esc(fase66(hoyN).nombre) + '</p>' +
    '<p class="su-11a508">' + esc(fase66(hoyN).desc) + '</p>' +
    '<div class="su-c158a9"><button type="button" id="c5retoSync" class="btn su-337714">🔄 Sincronizar con mis victorias</button>' +
    '<button type="button" id="c5retoCal" class="btn su-337714">📌 Llevar lo que falta al calendario</button>' +
    '<button type="button" id="c5retoReset" class="btn su-337714">🗑 Reiniciar reto</button></div></div>' +
    '<div class="c5-grid">' + grid + '</div>';
  box.querySelectorAll('[data-c66]').forEach(function (b) {
    b.onclick = function () {
      var n2 = +b.getAttribute('data-c66');
      if (s.checks66[n2]) delete s.checks66[n2]; else s.checks66[n2] = true;
      save(s.checks66[n2] ? 'Día ' + n2 + ' ✅' : 'Marca quitada');
      renderReto(); renderHead();
    };
  });
  if ($('c5retoSync')) $('c5retoSync').onclick = function () {
    var c = 0;
    for (var n3 = 1; n3 <= 66; n3++) {
      var k = addDays(s.inicio66, n3 - 1);
      var r = s.dias[k];
      if (r && esVictoria(r) && !s.checks66[n3]) { s.checks66[n3] = true; c++; }
    }
    save(c ? '🔄 ' + c + ' victoria(s) sincronizadas' : 'Sin victorias nuevas que sincronizar');
    renderReto(); renderHead();
  };
  if ($('c5retoCal')) $('c5retoCal').onclick = function () {
    var ok = 0, fuera = 0;
    for (var n4 = hoyN; n4 <= 66; n4++) {
      if (s.checks66[n4]) continue;
      var fk = addDays(s.inicio66, n4 - 1);
      var rr = celdaPara(fk);
      if (rr.error || rr.dft) { fuera++; continue; }
      var txt = clean('[5AM] 🔥 Reto 66 · Día ' + n4 + '/66 (' + fase66(n4).nombre.split('(')[0].trim() + ')', 80);
      var ya = rr.cell.agenda.some(function (a) { return String(a.text || '').indexOf('[5AM]') >= 0 && String(a.text || '').indexOf('Día ' + n4 + '/66') >= 0; });
      if (!ya) {
        var hp = String(s.cfg.wake || '05:00').split(':');
        rr.cell.agenda.push({ id: uid('a'), hour: +hp[0], minute: +hp[1], time: s.cfg.wake, text: txt, notify: false, notified: false });
        ok++;
      }
    }
    save(ok ? '📌 ' + ok + ' día(s) en el calendario ✓' : 'Sin cambios');
    refrescarCal();
    try { alert('📌 Agregados: ' + ok + (fuera ? ' · fuera del ciclo visible: ' + fuera : '')); } catch (e) {}
  };
  if ($('c5retoReset')) $('c5retoReset').onclick = function () {
    if (!confirm('¿Reiniciar el reto 66? (Tus mañanas guardadas se conservan)')) return;
    s.inicio66 = ''; s.checks66 = {};
    save('Reto reiniciado');
    renderReto(); renderHead();
  };
}

function renderDescanso() {
  var box = $('c5desBox');
  if (!box) return;
  var s = store();
  var wake = s.cfg.wake || '05:00';
  var hs = [7, 7.5, 8, 8.5, 9];
  var sug = hs.map(function (h) { return { h: h, bed: horaAcostarse(wake, h) }; });
  var hoy = todayKey();
  var reg = s.sueno[hoy] || { horas: '', calidad: 0 };
  box.innerHTML =
    '<div class="si-card"><h4>😴 Calculadora de acostada</h4>' +
    '<p>Si despiertas a las <b>⏰ ' + esc(wake) + '</b> (cámbialo en 🌅 Mi Victoria), acuéstate 15 min antes de lo calculado para quedarte dormido:</p>' +
    '<p>' + sug.map(function (x) { return '<span class="chip su-0d5be0">😴 ' + x.h + 'h → ' + x.bed + '</span>'; }).join(' ') + '</p>' +
    '<div class="conv-row"><label>Horas que quiero dormir <select id="c5cfgHoras">' +
    hs.map(function (h) { return '<option value="' + h + '"' + (+s.cfg.dormirHoras === h ? ' selected' : '') + '>' + h + ' horas</option>'; }).join('') + '</select></label></div></div>' +
    '<div class="menstrual-card su-68a1a9"><h4>🌙 Mi ritual de esta noche (' + esc(hoy) + ')</h4>' +
    RITUAL_NOCHE.map(function (r) {
      var on = !!s.ritual[r.id + '_' + hoy];
      return '<label class="c5-check' + (on ? ' on' : '') + '"><input type="checkbox" data-rit="' + r.id + '"' + (on ? ' checked' : '') + '><span><b>' + esc(r.t) + '</b><br><span class="muted">' + esc(r.d) + '</span></span></label>';
    }).join('') +
    '<div class="conv-row"><label>😴 Dormí (horas) <input type="number" id="c5sueHoras" min="0" max="14" step="0.5" value="' + esc(String(reg.horas === '' ? '' : reg.horas)) + '" placeholder="ej: 7.5"></label>' +
    '<label>⭐ Calidad <select id="c5sueCal">' + [0, 1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (+reg.calidad === n ? ' selected' : '') + '>' + (n === 0 ? 'sin nota' : '★'.repeat(n)) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="c5sueSave" class="btn btn-accent su-30e741">💾 Guardar noche</button></div></div>' +
    '<p class="muted su-11a508">Sin pantallas, con ropa lista y guata liviana, las 5 AM dejan de doler en ~2 semanas.</p>';
  if ($('c5cfgHoras')) $('c5cfgHoras').onchange = function () { s.cfg.dormirHoras = +$('c5cfgHoras').value; save('Meta de sueño: ' + s.cfg.dormirHoras + 'h 😴'); renderDescanso(); renderHead(); };
  box.querySelectorAll('[data-rit]').forEach(function (ch) {
    ch.onchange = function () {
      var k = ch.getAttribute('data-rit') + '_' + hoy;
      if (ch.checked) s.ritual[k] = true; else delete s.ritual[k];
      save(ch.checked ? 'Ritual ✅' : 'Marca quitada');
      renderDescanso();
    };
  });
  if ($('c5sueSave')) $('c5sueSave').onclick = function () {
    var hv = clean((($('c5sueHoras') || {}).value || '').trim(), 5);
    s.sueno[hoy] = { horas: hv, calidad: +($('c5sueCal') || {}).value || 0 };
    save('Noche guardada 😴');
    renderDescanso(); renderProgreso();
  };
}

function renderProgreso() {
  var box = $('c5proBox');
  if (!box) return;
  var s = store();
  var keys = Object.keys(s.dias).sort();
  var vic = victorias();
  var ultimas = keys.slice(-14).reverse();
  var promStars = 0, nStars = 0;
  keys.forEach(function (k) { var st = +(s.dias[k].stars || 0); if (st) { promStars += st; nStars++; } });
  var promTxt = nStars ? (promStars / nStars).toFixed(1) + '★ (' + nStars + ' notas)' : 'sin notas aún';
  var sueKeys = Object.keys(s.sueno).sort().slice(-7);
  var sueTxt = sueKeys.length ? sueKeys.map(function (k) { var r = s.sueno[k]; return k.slice(5) + ': ' + (r.horas === '' ? '—' : r.horas + 'h') + (r.calidad ? ' ' + '★'.repeat(r.calidad) : ''); }).join(' · ') : 'sin registro de sueño esta semana';
  box.innerHTML =
    '<div class="menstrual-card su-435dbc"><h4>📊 Tu constancia</h4>' +
    '<p class="muted su-11a508">🌅 ' + keys.length + ' mañanas registradas · 🏆 ' + vic + ' victorias 3/3 · 🔥 racha ' + racha() + ' · ⭐ promedio ' + esc(promTxt) + '</p>' +
    (s.inicio66 ? '<p class="muted su-11a508">🔥 Reto 66: ' + hechos66() + '/66 (' + Math.round(hechos66() / 66 * 100) + '%) · ' + esc(fase66(Math.min(Math.max(diffDays(s.inicio66, todayKey()) + 1, 1), 66)).nombre) + '</p>' : '') +
    '<p class="muted su-11a508">😴 Últimas noches: ' + esc(sueTxt) + '</p>' +
    '<div class="su-c158a9"><button type="button" id="c5proShare" class="btn su-337714">📤 Compartir mi constancia</button>' +
    '<button type="button" id="c5proClear" class="btn su-337714">🗑 Borrar mis datos</button></div></div>' +
    (ultimas.length ? '<div class="si-card"><h4>🗓️ Últimas mañanas</h4><p>' +
      ultimas.map(function (k) {
        var r = s.dias[k];
        return '<span class="chip su-0d5be0">' + k.slice(5) + ' ' + (esVictoria(r) ? '🏆' : puntaje(r) + '/3') + '</span>';
      }).join(' ') + '</p></div>'
      : '<p class="muted">Sin mañanas aún. Tu primera victoria te espera en 🌅 Mi Victoria.</p>');
  if ($('c5proShare')) $('c5proShare').onclick = function () {
    share('🌅 Mi Club 5 AM',
      '🏆 ' + vic + ' victorias · 🔥 racha ' + racha() + ' · ⭐ ' + promTxt + (s.inicio66 ? '\n🔥 Reto 66: ' + hechos66() + '/66' : '') + '\n“La primera hora del día es el timón de la jornada.”');
  };
  if ($('c5proClear')) $('c5proClear').onclick = function () {
    if (!confirm('¿Borrar todos tus datos del Club 5 AM?')) return;
    try { userData().club5am = blank(); } catch (e) {}
    diaSel = todayKey();
    save('Datos borrados');
    render();
  };
}

function render() { renderHead(); renderTabs(); renderGuia(); renderVictoria(); renderReto(); renderDescanso(); renderProgreso(); }

/* ---------- diálogo ---------- */
function build() {
  cssOnce();
  makeDialog('club5amDialog', '🌅 Club de las 5 de la mañana',
    'Levántate a las <b>05:00</b>, gana la primera hora (20 moverse · 20 reflexionar · 20 crecer) y acuéstate temprano para dormir lo mismo. Todo queda <b>privado y local</b> por usuario.',
    '<div id="c5head"></div>' +
    '<div class="timer-tabs su-ca7e11">' +
    '<button type="button" id="tabC5Guia" class="btn btn-accent su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabC5Victoria" class="btn su-30e741">🌅 Mi Victoria</button>' +
    '<button type="button" id="tabC5Reto" class="btn su-30e741">🔥 Reto 66</button>' +
    '<button type="button" id="tabC5Descanso" class="btn su-30e741">😴 Descanso</button>' +
    '<button type="button" id="tabC5Progreso" class="btn su-30e741">📊 Progreso</button>' +
    '</div>' +
    '<div id="c5GuiaPanel"><div id="c5guiaBox"></div></div>' +
    '<div id="c5VictoriaPanel" class="hidden"><div id="c5vicBox"></div></div>' +
    '<div id="c5RetoPanel" class="hidden"><div id="c5retoBox"></div></div>' +
    '<div id="c5DescansoPanel" class="hidden"><div id="c5desBox"></div></div>' +
    '<div id="c5ProgresoPanel" class="hidden"><div id="c5proBox"></div></div>');
}
function bind() {
  ['Guia', 'Victoria', 'Reto', 'Descanso', 'Progreso'].forEach(function (t) {
    var b = $('tabC5' + t);
    if (b) b.onclick = function () { tab = t; render(); };
  });
}

/* ---------- botón + setup ---------- */
function injectBtn(group, sub, id, txt, kw) {
  try {
    var g = document.querySelector('.action-group[data-group="' + group + '"] .group-btns');
    if (!g) return;
    if ($(id)) { try { $(id).setAttribute('data-sub', sub); } catch (e2) {} return; }
    var btn = document.createElement('button');
    btn.id = id; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = txt;
    try { btn.setAttribute('data-sub', sub); } catch (eS) {}
    btn.setAttribute('data-keywords', kw);
    var ref = $('btnRetos21') || $('btnRemind');
    if (ref && ref.parentElement === g && ref.nextSibling) { g.insertBefore(btn, ref.nextSibling); return; }
    g.appendChild(btn);
  } catch (e) {}
}
function registerBtn(group, sub, id, label, matchTitle) {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME[id] = [group, sub]; } catch (e) {}
  try { if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER[group + '|' + sub] && BTN_ORDER[group + '|' + sub].indexOf(id) < 0) BTN_ORDER[group + '|' + sub].push(id); } catch (e) {}
  try { if (typeof PRESETS !== 'undefined') Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p][id] = true; }); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="' + id + '"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf(matchTitle) >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="' + id + '"> ' + esc(label);
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis[id] !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible[id] = lab.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e2) {}
            };
          } catch (e3) {}
        }
      });
    }
  } catch (e) {}
}

function setup() {
  injectBtn('dia', 'organizar', 'btnClub5am', '🌅 Club 5 AM', 'club cinco 5 mañana madrugada despertar temprano habito rutina victoria 20 20 sharma hora victoriosa moverse reflexionar crecer reto 66 sesenta seis dormir descanso constancia disciplina');
  registerBtn('dia', 'organizar', 'btnClub5am', '🌅 Club 5 AM', 'Mi D');
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  diaSel = todayKey();
  build();
  bind();
  render();
  var b = $('btnClub5am');
  if (b) b.onclick = function () { diaSel = todayKey(); render(); openDlg('club5amDialog'); };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
