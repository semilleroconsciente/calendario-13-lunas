/* ============================================================
   REIKI — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnReiki (grupo Linaje > practicas, tras btnHooponopono)
   - Dialogo reikiDialog con 6 pestanas:
     1) Guia (que es, historia Usui, como funciona, niveles,
        simbolos (solo nombres, se aprenden con maestro/a),
        tecnicas basicas, Reiki y 13 lunas, etica y cuidados)
     2) Gokai (los 5 principios: significado, como vivirlo hoy,
        practicar, favorito, registro del dia)
     3) Posiciones (12 posiciones de autotratamiento + 7 chakras:
        significado, cuando usar, armar sesion)
     4) Autotratamiento (practica guiada: secuencia + paso a paso
        con temporizador por posicion + kenyoku/gassho +
        guardar sesion con antes/despues)
     5) Focos y Sesiones (inventario con permiso, historial,
        compartir, llevar a nota del dia)
     6) Mi avance (racha, totales, ciclo de 21 dias, por
        secuencia, por luna, ritmo sugerido)
   - Todo local y privado por usuario:
     userData().reiki = { focos:[], ses:[], totalMin:0,
       favGokai:'', gokai:{} }
   - Puentes: Espirituales, Espiritu, Energia y descanso,
     Respiracion, Metodos (topic reiki -> boton abrir), Recap.
   - Educativo y laico: no reemplaza atencion medica ni
     psicologica. Los simbolos y sintonizaciones se aprenden
     con maestro/a calificado/a presencial. 100% offline.
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
function blank() { return { focos: [], ses: [], totalMin: 0, favGokai: 'gratitud', gokai: {} }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.reiki) u.reiki = blank();
    var e = u.reiki;
    if (!Array.isArray(e.focos)) e.focos = [];
    if (!Array.isArray(e.ses)) e.ses = [];
    if (typeof e.totalMin !== 'number') e.totalMin = 0;
    if (typeof e.favGokai !== 'string') e.favGokai = 'gratitud';
    if (!e.gokai) e.gokai = {};
    return e;
  } catch (e2) { return blank(); }
}
function persistStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (u) u.reiki = store();
  } catch (e) {}
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
  ['Guia', 'Gokai', 'Pos', 'Auto', 'Ses', 'Ava'].forEach(function (t) {
    var p = $('rk' + t), b = $('tabRk' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return alert('Audio no disponible en este dispositivo');
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { try { alert('Audio no disponible'); } catch (e2) {} }
}

/* ============================================================
   DATOS
   ============================================================ */
var RK_GOKAI = [
  { id: 'no-enojo', n: 'Solo por hoy, no me enojo', ico: '😌', color: '#7ab8ff',
    que: 'La ira avisa que un límite fue cruzado o algo necesita cuidado. No se reprime: se respira y se responde sin herir.',
    como: 'Cuando suba el calor: 3 respiraciones, manos al vientre, di «solo por hoy, suelto el enojo». Pregunta: ¿qué necesito cuidar aquí?' },
  { id: 'no-preocupo', n: 'Solo por hoy, no me preocupo', ico: '🌊', color: '#8fd694',
    que: 'Preocuparse es ocuparse antes de tiempo. Se honra planificando 1 paso concreto y soltando el resto.',
    como: 'Escribe la preocupación en 1 línea + 1 paso de hoy (10 min). Di «solo por hoy, hago mi parte y confío».' },
  { id: 'gratitud', n: 'Soy agradecida/o', ico: '🙏', color: '#e8c56a',
    que: 'La gratitud ordena la energía: lo que se agradece se multiplica en calma. Es el principio corazón del Reiki.',
    como: 'Mano al corazón, nombra 3 cosas de hoy en voz baja. Cierra con «gracias, gracias, gracias».' },
  { id: 'diligente', n: 'Trabajo diligente y honradamente', ico: '🌱', color: '#c9a9c9',
    que: 'Hacer bien lo que toca hoy —barrer, cocinar, estudiar— también es práctica espiritual. Presencia en lo simple.',
    como: 'Elige 1 tarea y hazla 15 min con presencia total (sin celu). Al terminar: «cumplí con amor mi parte».' },
  { id: 'amable', n: 'Soy amable con todo ser vivo', ico: '💗', color: '#e76e8a',
    que: 'Amabilidad = no dañar y aliviar cuando puedo: personas, animales, plantas, agua. Empieza por mí misma/o.',
    como: '1 gesto concreto hoy: palabra suave, agua a una planta, saludo al mar/río. Inclúyete: háblate con cariño.' }
];
var RK_POSICIONES = [
  { id: 'p1', n: '1 · Ojos y frente', zona: 'cabeza', ico: '👁️', min: 3, desc: 'Manos suaves sobre ojos cerrados, sin presionar. Para mente acelerada, pantallas, insomnio.' },
  { id: 'p2', n: '2 · Sienes y oídos', zona: 'cabeza', ico: '🧠', min: 3, desc: 'Palmas sobre sienes/orejas. Para ruidos mentales, dolor de cabeza tensional, preocupación.' },
  { id: 'p3', n: '3 · Nuca y base del cráneo', zona: 'cabeza', ico: '🌙', min: 3, desc: 'Manos bajo la nuca (acostada/o) o una sobre frente y otra en nuca. Para descansar el sistema nervioso.' },
  { id: 'p4', n: '4 · Garganta', zona: 'garganta', ico: '🗣️', min: 3, desc: 'Manos en V suave alrededor (no sobre) la garganta. Para lo no dicho, nudo emocional, tiroides (acompaña, no reemplaza control médico).' },
  { id: 'p5', n: '5 · Corazón y pecho', zona: 'tronco', ico: '💗', min: 3, desc: 'Una mano al centro del pecho, otra encima. Para pena, duelo, ansiedad. Respira 4-6.' },
  { id: 'p6', n: '6 · Costillas y pulmones', zona: 'tronco', ico: '🌬️', min: 3, desc: 'Manos abiertas bajo clavículas. Para respiración corta, angustia, cansancio.' },
  { id: 'p7', n: '7 · Plexo solar', zona: 'tronco', ico: '☀️', min: 3, desc: 'Manos sobre la boca del estómago. Para nervios, miedo, digestión nerviosa.' },
  { id: 'p8', n: '8 · Vientre bajo', zona: 'tronco', ico: '🌊', min: 3, desc: 'Manos en V bajo el ombligo. Para enraizar, ciclo menstrual (acompaña), creatividad bloqueada.' },
  { id: 'p9', n: '9 · Lumbares', zona: 'espalda', ico: '🌳', min: 3, desc: 'Manos en la cintura/espalda baja (sentada/o o con ayuda). Para sostén, cansancio de pie, riñones.' },
  { id: 'p10', n: '10 · Hombros', zona: 'espalda', ico: '🤲', min: 2, desc: 'Manos cruzadas sobre hombros (autoabrazo). Para carga, «llevo mucho peso». Suelta con cada exhalación.' },
  { id: 'p11', n: '11 · Rodillas', zona: 'piernas', ico: '🦵', min: 2, desc: 'Una mano en cada rodilla. Para rigidez, miedo a avanzar, piernas cansadas.' },
  { id: 'p12', n: '12 · Pies', zona: 'piernas', ico: '🦶', min: 2, desc: 'Manos envolviendo plantas/empeines (uno por vez). Para enraizar, insomnio, cerrar la sesión con gratitud.' }
];
var RK_CHAKRAS = [
  { id: 'c1', n: 'Raíz · Muladhara', color: '#e05555', zona: 'base/columna', desc: 'Seguridad, cuerpo, territorio. Manos en vientre bajo/pubis (sobre ropa). Afirmación: «estoy a salvo aquí».' },
  { id: 'c2', n: 'Sacro · Svadhisthana', color: '#ef9044', zona: 'bajo vientre', desc: 'Emociones, placer, crear. Manos bajo el ombligo. Afirmación: «siento y fluyo».' },
  { id: 'c3', n: 'Plexo · Manipura', color: '#e8c56a', zona: 'boca del estómago', desc: 'Voluntad, límites, digestión. Manos en plexo. Afirmación: «actúo con calma y firmeza».' },
  { id: 'c4', n: 'Corazón · Anahata', color: '#8fd694', zona: 'centro del pecho', desc: 'Amor, perdón, duelo. Manos al pecho. Afirmación: «amo y soy amada/o».' },
  { id: 'c5', n: 'Garganta · Vishuddha', color: '#7ab8ff', zona: 'cuello', desc: 'Voz, verdad, pedir ayuda. Manos en V al cuello. Afirmación: «digo lo verdadero con respeto».' },
  { id: 'c6', n: 'Entrecejo · Ajna', color: '#9d8df1', zona: 'frente', desc: 'Intuición, sueño, claridad. Manos suaves en frente/sienes. Afirmación: «veo con calma».' },
  { id: 'c7', n: 'Corona · Sahasrara', color: '#c9a9c9', zona: 'coronilla', desc: 'Conexión, sentido, silencio. Manos sobre la coronilla sin presionar. Afirmación: «confío y agradezco».' }
];
var RK_SECUENCIAS = [
  { id: 'completa', n: 'Completa · 12 posiciones (~30 min)', desc: 'Las 12 posiciones, 2–3 min cada una. Ideal domingo o luna nueva/llena.' },
  { id: 'corta', n: 'Corta · 6 posiciones (~15 min)', desc: 'Ojos, nuca, garganta, corazón, plexo, vientre. La diaria recomendada.' },
  { id: 'sos', n: 'SOS calma · 3 posiciones (~6 min)', desc: 'Corazón, plexo, autoabrazo de hombros. Para crisis de angustia o enojo.' },
  { id: 'chakras', n: 'Chakras · 7 centros (~21 min)', desc: 'Raíz a corona, 3 min cada uno. Para ordenar energía y cerrar la luna.' }
];
var RK_ESTADOS = ['activo', 'en pausa', 'cerrado'];

/* ---------- secuencias -> lista de pasos ---------- */
function pasosDeSecuencia(secId) {
  var pos = function (id) { for (var i = 0; i < RK_POSICIONES.length; i++) if (RK_POSICIONES[i].id === id) return RK_POSICIONES[i]; return null; };
  if (secId === 'corta') return ['p1', 'p3', 'p4', 'p5', 'p7', 'p8'].map(pos);
  if (secId === 'sos') return ['p5', 'p7', 'p10'].map(pos);
  if (secId === 'chakras') return RK_CHAKRAS.slice();
  return RK_POSICIONES.slice();
}
function gokaiById(id) {
  for (var i = 0; i < RK_GOKAI.length; i++) if (RK_GOKAI[i].id === id) return RK_GOKAI[i];
  return RK_GOKAI[2];
}

/* ---------- racha + ciclo 21 ---------- */
function rachaDias() {
  var set = {};
  store().ses.forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}
function ciclo21() {
  var set = {};
  store().ses.forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 21; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}

/* ============================================================
   RENDER — Gokai
   ============================================================ */
function renderGokai() {
  var box = $('rkGokaiGrid'); if (!box) return;
  var e = store();
  var hoy = e.gokai[todayKey()] || {};
  box.innerHTML = RK_GOKAI.map(function (g) {
    var isFav = e.favGokai === g.id;
    var hecho = !!hoy[g.id];
    return '<div class="menstrual-card" style="border-color:' + g.color + '66">' +
      '<h4 style="color:' + g.color + '">' + g.ico + ' ' + esc(g.n) + (isFav ? ' ⭐' : '') + (hecho ? ' · ✅ hoy' : '') + '</h4>' +
      '<p class="su-afb724"><b>Qué significa:</b> ' + esc(g.que) + '<br><b>Hoy:</b> ' + esc(g.como) + '</p>' +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn ' + (hecho ? 'su-30e741' : 'btn-accent su-e2cc6b') + '" data-gokai="' + esc(g.id) + '">' + (hecho ? '✅ Vivido hoy' : '🤲 Vivir hoy') + '</button>' +
      '<button type="button" class="btn su-337714" data-gvoz="' + esc(g.id) + '">🔊 Escuchar</button>' +
      '<button type="button" class="btn su-337714" data-gfav="' + esc(g.id) + '">' + (isFav ? '⭐ Favorito' : '☆ Favorito') + '</button>' +
      '</div></div>';
  }).join('');
  box.querySelectorAll('[data-gokai]').forEach(function (b) { b.onclick = function () {
    var id = b.getAttribute('data-gokai');
    var st = store(); var h = st.gokai[todayKey()] || (st.gokai[todayKey()] = {});
    h[id] = !h[id]; persistStore(); save(h[id] ? 'Principio vivido 🤲' : 'Guardado'); renderGokai(); renderAva();
  }; });
  box.querySelectorAll('[data-gvoz]').forEach(function (b) { b.onclick = function () { var g = gokaiById(b.getAttribute('data-gvoz')); speak(g.n + '. ' + g.que + ' ' + g.como); }; });
  box.querySelectorAll('[data-gfav]').forEach(function (b) { b.onclick = function () { store().favGokai = b.getAttribute('data-gfav'); persistStore(); save('Principio favorito guardado ⭐'); renderGokai(); }; });
}

/* ============================================================
   RENDER — Posiciones + Chakras
   ============================================================ */
function renderPos() {
  var box = $('rkPosGrid'); if (!box) return;
  box.innerHTML = '<div class="menstrual-card"><h4>🤲 12 posiciones de autotratamiento</h4>' +
    '<p class="muted su-11a508">Manos tibias, contacto suave, sin presionar. 2–3 min por posición, respiración 4-6. Si hay dolor o lesión, manos a los costados (no encima) y consulta profesional.</p>' +
    RK_POSICIONES.map(function (p) {
      return '<div class="habit-item su-c1fafc"><b>' + p.ico + ' ' + esc(p.n) + '</b> <span class="chip su-0d5be0">~' + p.min + ' min</span><br>' +
        '<span class="muted su-11a508">' + esc(p.desc) + '</span><br>' +
        '<button type="button" class="btn su-d2fb07" data-pos="' + esc(p.n) + '">🧘 Practicar esta</button></div>';
    }).join('') + '</div>' +
    '<div class="menstrual-card"><h4>🌈 Los 7 chakras (versión simple y laica)</h4>' +
    '<p class="muted su-11a508">Los ves como 7 zonas del cuerpo para ordenar la atención de abajo hacia arriba. Sin dogma: si la palabra “chakra” no te acomoda, llámalos “7 estaciones”.</p>' +
    RK_CHAKRAS.map(function (c) {
      return '<div class="habit-item su-c1fafc" style="border-color:' + c.color + '44"><b style="color:' + c.color + '">' + esc(c.n) + '</b><br>' +
        '<span class="muted su-11a508">📍 ' + esc(c.zona) + ' · ' + esc(c.desc) + '</span><br>' +
        '<button type="button" class="btn su-d2fb07" data-pos="' + esc(c.n) + '">🧘 Practicar este</button></div>';
    }).join('') + '</div>';
  box.querySelectorAll('[data-pos]').forEach(function (b) { b.onclick = function () {
    switchTab('Auto');
    var lbl = $('rkFocoLibre');
    if (lbl) lbl.textContent = 'Foco de hoy: ' + b.getAttribute('data-pos') + ' (autotratamiento)';
    try { $('rkAutoSec').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  }; });
}

/* ============================================================
   RENDER — Autotratamiento guiado
   ============================================================ */
var rkTimerIv = null, rkTimerLeft = 0, rkPasoIdx = 0, rkPasos = [];
function rkTimerStop(silent) {
  if (rkTimerIv) { clearInterval(rkTimerIv); rkTimerIv = null; }
  if (!silent) { var l = $('rkTimerLabel'); if (l) l.textContent = '⏱ Elige una secuencia y pulsa “Comenzar”. Cada posición suena al terminar.'; }
}
function rkPintarPaso() {
  var box = $('rkPasoBox'); if (!box) return;
  if (!rkPasos.length) { box.innerHTML = '<p class="muted">Sin secuencia. Elige arriba: completa, corta, SOS o chakras.</p>'; return; }
  var p = rkPasos[rkPasoIdx];
  var total = rkPasos.length;
  box.innerHTML = '<div class="menstrual-card su-7c1198"><div class="muted">PASO ' + (rkPasoIdx + 1) + ' / ' + total + '</div>' +
    '<h4>' + (p.ico ? p.ico + ' ' : '🌈 ') + esc(p.n) + '</h4>' +
    '<p class="su-afb724">' + esc(p.desc || '') + (p.min ? ' <span class="chip su-0d5be0">~' + p.min + ' min</span>' : '') + '</p>' +
    '<div class="su-e376dd"><button type="button" id="rkPrev" class="btn su-30e741">◀ Anterior</button>' +
    '<button type="button" id="rkNext" class="btn btn-accent su-e2cc6b">Siguiente ▶</button></div></div>';
  var pv = $('rkPrev'); if (pv) pv.onclick = function () { if (rkPasoIdx > 0) { rkPasoIdx--; rkIniciarPaso(); } };
  var nx = $('rkNext'); if (nx) nx.onclick = function () {
    if (rkPasoIdx < rkPasos.length - 1) { rkPasoIdx++; rkIniciarPaso(); }
    else { rkTimerStop(true); var l = $('rkTimerLabel'); if (l) l.innerHTML = '🌟 <b>Secuencia completa.</b> Frota tus manos, pásalas por la cara, toma agua y guarda tu sesión abajo.'; try { speak('Secuencia completa. Gracias.'); } catch (e) {} }
  };
}
function rkIniciarPaso() {
  rkTimerStop(true);
  rkPintarPaso();
  var p = rkPasos[rkPasoIdx]; if (!p) return;
  var mins = Math.max(1, Math.min(10, +((($('rkMinPorPaso') || {}).value) || p.min || 3)));
  rkTimerLeft = mins * 60;
  var l = $('rkTimerLabel');
  function paint() {
    if (!l) return;
    var m = Math.floor(rkTimerLeft / 60), s = rkTimerLeft % 60;
    l.innerHTML = '🤲 <b>' + esc(p.n) + '</b> · <b>' + m + ':' + String(s).padStart(2, '0') + '</b> · manos suaves, respiración 4-6. Paso ' + (rkPasoIdx + 1) + '/' + rkPasos.length + '.';
  }
  paint();
  rkTimerIv = setInterval(function () {
    rkTimerLeft--;
    if (rkTimerLeft <= 0) {
      rkTimerStop(true);
      try { if (typeof playNotifySound === 'function') playNotifySound(); } catch (e) {}
      if (l) l.innerHTML = '🔔 <b>' + esc(p.n) + '</b> completo. Pulsa “Siguiente ▶” para continuar.';
      return;
    }
    paint();
  }, 1000);
}
function rkSecElegida() {
  var s = $('rkAutoSec');
  return (s && s.value) || 'corta';
}
function renderAuto() {
  var sel = $('rkAutoSec'); if (!sel) return;
  var keep = sel.value || 'corta';
  sel.innerHTML = RK_SECUENCIAS.map(function (s) {
    return '<option value="' + s.id + '"' + (s.id === keep ? ' selected' : '') + '>' + esc(s.n) + '</option>';
  }).join('');
  var d = $('rkSecDesc');
  if (d) { var f = RK_SECUENCIAS.filter(function (s) { return s.id === keep; })[0]; if (f) d.textContent = f.desc; }
  var fs = $('rkFocoSel');
  if (fs) {
    var cur = fs.value || '';
    var acts = store().focos.filter(function (r) { return r.estado === 'activo'; });
    fs.innerHTML = '<option value="">Autotratamiento (para mí)</option>' + acts.map(function (r) {
      return '<option value="' + r.id + '"' + (r.id === cur ? ' selected' : '') + '>' + esc((r.titulo || 'Sin título').slice(0, 40)) + '</option>';
    }).join('');
  }
}
function guardarSesion() {
  var sec = rkSecElegida();
  var focoId = ($('rkFocoSel') || {}).value || '';
  var antes = +(($('rkAntes') || {}).value || 5);
  var desp = +(($('rkDespues') || {}).value || 5);
  var nota = clean((($('rkNota') || {}).value || '').trim(), 300);
  var mins = Math.max(1, +((($('rkMinTotal') || {}).value) || (rkPasos.length * 2) || 15));
  var titulo = 'Autotratamiento ' + sec;
  if (focoId) {
    var dd = store().focos, r = null;
    for (var i = 0; i < dd.length; i++) if (dd[i].id === focoId) r = dd[i];
    if (r) titulo = r.titulo;
  }
  if (!nota && !confirm('¿Guardar la sesión sin nota? (igual suma a tu racha y ciclo de 21 días)')) return;
  store().ses.push({ id: uid('rk'), fecha: (($('rkFecha') || {}).value) || todayKey(), sec: sec, titulo: titulo, focoId: focoId, minutos: mins, antes: antes, despues: desp, nota: nota });
  store().totalMin += mins;
  persistStore();
  save('Sesión de Reiki guardada 🤲');
  try { $('rkNota').value = ''; } catch (e) {}
  rkTimerStop(false);
  renderSes(); renderFocos(); renderAva(); renderAuto();
  switchTab('Ses');
}

/* ============================================================
   RENDER — Focos + Sesiones + Avance
   ============================================================ */
function renderFocos() {
  var box = $('rkFocosList'); if (!box) return;
  var q = (($('rkFocosQ') || {}).value || '').toLowerCase();
  var f = ($('rkFocosF') || {}).value || 'todos';
  var d = store().focos.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  var fil = d.filter(function (r) {
    if (f !== 'todos' && r.estado !== f) return false;
    if (q && ((r.titulo || '') + ' ' + (r.nota || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  box.innerHTML = fil.length ? fil.map(function (r) {
    var col = r.estado === 'cerrado' ? '#8fd694' : (r.estado === 'en pausa' ? '#e8c56a' : '#7ab8ff');
    return '<div class="habit-item"><div class="su-34136d"><span><b>' + esc(r.titulo) + '</b></span>' +
      '<span class="chip" style="font-size:10px;border-color:' + col + '55;color:' + col + '">' + esc(r.estado || 'activo') + '</span></div>' +
      '<div class="muted su-cdff1d">' + (r.permiso ? '✅ con permiso · ' : '⚠️ ' + esc(r.permisoNota || 'solo autotratamiento') + ' · ') + esc(lunaTxt(r.fecha) || '') + (r.nota ? '<br>📝 ' + esc(r.nota) : '') + '</div>' +
      '<div class="su-faf7a9">' +
      '<button class="btn su-337714" data-ses="' + r.id + '">🧘 Sesión</button>' +
      '<button class="btn su-337714" data-next="' + r.id + '">⏭ ' + (r.estado === 'activo' ? 'en pausa' : r.estado === 'en pausa' ? 'cerrado' : 'reactivar') + '</button>' +
      '<button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin focos. El Reiki siempre parte por ti: el autotratamiento diario es la base. Para otra persona, planta o espacio, pide permiso primero.</p>';
  var st = $('rkFocosStats');
  if (st) st.textContent = d.length + ' focos · ' + d.filter(function (r) { return r.estado === 'activo'; }).length + ' activos';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar este foco?')) return; var dd = store().focos; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); persistStore(); save(); renderFocos(); renderAva(); renderAuto(); }; });
  box.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { var dd = store().focos; var r = dd.find(function (x) { return x.id === b.getAttribute('data-next'); }); if (!r) return; r.estado = r.estado === 'activo' ? 'en pausa' : (r.estado === 'en pausa' ? 'cerrado' : 'activo'); persistStore(); save('Guardado 🤲'); renderFocos(); renderAva(); renderAuto(); }; });
  box.querySelectorAll('[data-ses]').forEach(function (b) { b.onclick = function () { switchTab('Auto'); renderAuto(); var s = $('rkFocoSel'); if (s) s.value = b.getAttribute('data-ses'); }; });
}
function renderSes() {
  var box = $('rkSesList'); if (!box) return;
  var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = d.length ? d.slice(0, 40).map(function (r) {
    return '<div class="habit-item"><b>🤲 ' + esc(r.fecha) + '</b> · ' + esc(r.sec || '') + ' · ' + (+r.minutos || 0) + ' min' +
      '<br><span class="muted su-11a508">📌 ' + esc(r.titulo || 'autotratamiento') + ' · ' + r.antes + '→' + r.despues + '/10 · ' + esc(lunaTxt(r.fecha)) + '</span>' +
      (r.nota ? '<p class="su-6cb285">💡 ' + esc(r.nota) + '</p>' : '') +
      '<div class="su-90237f"><button class="btn su-337714" data-share="' + r.id + '">📤</button><button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin sesiones aún. Ve a 🤲 Autotratamiento y regálate 6 minutos hoy (SOS calma).</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar sesión?')) return; var dd = store().ses; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) { store().totalMin = Math.max(0, store().totalMin - (+dd[i].minutos || 0)); dd.splice(i, 1); } persistStore(); save(); renderSes(); renderAva(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = store().ses; var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🤲 Mi Reiki ' + r.fecha, '📌 ' + (r.titulo || '') + '\n' + r.sec + ' · ' + r.minutos + ' min (' + r.antes + '→' + r.despues + '/10)' + (r.nota ? '\n💡 ' + r.nota : '')); }; });
  var st = $('rkSesStats');
  if (st) { var mins = d.reduce(function (a, r) { return a + (+r.minutos || 0); }, 0); st.textContent = d.length + ' sesiones · ' + mins + ' min · racha ' + rachaDias() + ' días'; }
}
function renderAva() {
  var box = $('rkAvaBox'); if (!box) return;
  var e = store();
  var ses = e.ses;
  var c21 = ciclo21();
  var pct = Math.round(c21 / 21 * 100);
  var porSec = {};
  ses.forEach(function (r) { porSec[r.sec] = (porSec[r.sec] || 0) + 1; });
  var topSec = Object.keys(porSec).sort(function (a, b) { return porSec[b] - porSec[a]; })[0] || '—';
  var gokaiHoy = Object.keys((e.gokai || {})[todayKey()] || {}).filter(function (k) { return e.gokai[todayKey()][k]; }).length;
  box.innerHTML = '<p class="muted su-11a508">🌱 Ciclo clásico de 21 días: <b>' + c21 + '/21</b> (' + pct + '%)</p>' +
    '<div class="su-ab9537"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#8fd694,#e8c56a,#e76e8a)"></div></div>' +
    '<p class="muted su-e13d76">🤲 ' + ses.length + ' sesiones · ⏱ ' + (e.totalMin || 0) + ' min de vida · 🔥 racha ' + rachaDias() + ' días · secuencia favorita: <b>' + esc(topSec) + '</b></p>' +
    '<p class="muted su-11a508">🙏 Gokai vividos hoy: <b>' + gokaiHoy + '/5</b> · Ritmo sugerido: 1 autotratamiento corto al día + 1 Gokai en la mañana. Menguante → soltar; nueva → sembrar intención con Gassho.</p>';
}
function renderAll() { try { renderGokai(); } catch (e) {} try { renderPos(); } catch (e) {} try { renderAuto(); rkPintarPaso(); } catch (e) {} try { renderFocos(); } catch (e) {} try { renderSes(); } catch (e) {} try { renderAva(); } catch (e) {} }

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  makeDialog('reikiDialog', '🤲 Reiki — energía vital con las manos',
    'Práctica japonesa de <b>armonización con imposición de manos</b>: un canal de calma para ti y —con permiso— para otros. Autotratamiento diario + 5 principios + registro. Todo queda <b>privado y local</b>.',
    '<div class="timer-tabs su-dd1da5">' +
    '<button type="button" id="tabRkGuia" class="btn btn-accent su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabRkGokai" class="btn su-30e741">🙏 Gokai</button>' +
    '<button type="button" id="tabRkPos" class="btn su-30e741">🗺️ Posiciones</button>' +
    '<button type="button" id="tabRkAuto" class="btn su-30e741">🤲 Autotratamiento</button>' +
    '<button type="button" id="tabRkSes" class="btn su-30e741">📓 Diario</button>' +
    '<button type="button" id="tabRkAva" class="btn su-30e741">📊 Mi avance</button></div>' +

    '<div id="rkGuia">' +
      '<div class="si-card"><h4>🤲 ¿Qué es Reiki?</h4><p><b>Rei</b> (universal) + <b>Ki</b> (energía vital). No es tu energía la que “das”: eres un <b>canal</b> que, con manos tibias y presencia, acompaña la calma del cuerpo. Se recibe con ropa, sentada/o o acostada/o, sin masaje ni presión. La ciencia lo estudia como relajación profunda: baja el estrés y acompaña el descanso. <b>No diagnostica ni reemplaza</b> remedios, terapia ni urgencias.</p></div>' +
      '<div class="si-card"><h4>⛰️ Historia en 1 minuto (Mikao Usui)</h4><p><b>Mikao Usui</b> (1865–1926, Japón) buscó un método simple para llevar bienestar a todos. Tras años de estudio y meditación, en <b>1922 en el monte Kurama</b> vivió una experiencia de claridad y creó el sistema <b>Usui Reiki Ryoho</b>. Su alumno <b>Chujiro Hayashi</b> ordenó las posiciones de manos; <b>Hawayo Takata</b> lo llevó a Hawái y Occidente. Linaje: Usui → Hayashi → Takata → miles de maestras/os. Hoy conviven escuelas (Usui tradicional, tibetano, Karuna, Jikiden): todas comparten Gokai + manos + respeto.</p></div>' +
      '<div class="si-card"><h4>🌬️ ¿Cómo funciona? (sin humo)</h4><p><b>1)</b> Calmas el cuerpo (Gassho + 3 respiraciones). <b>2)</b> Apoyas las manos 2–3 min por zona. <b>3)</b> El calor y la quietud activan el sistema de descanso (parasimpático): baja la tensión, se suelta el nudo. <b>4)</b> Cierras con gratitud y agua. Lo que sientas (calor, hormigueo, nada) está bien: “nada” también es sesión válida.</p></div>' +
      '<div class="si-card"><h4>🎓 Niveles y símbolos (honestidad primero)</h4><p><b>Nivel I (Shoden):</b> autotratamiento + historia + Gokai. <b>Nivel II (Okuden):</b> símbolos para enfocar y trabajo a distancia. <b>Nivel III/Maestría (Shinpiden):</b> profundización y enseñar/iniciar. Los <b>símbolos se reciben con sintonización de un/a maestro/a calificado/a</b>: aquí solo nombramos que existen (poder, armonía, distancia, maestría) sin dibujarlos, por respeto al linaje. Si quieres iniciarte, busca escuela presencial con referencias, valores claros y sin promesas milagrosas.</p></div>' +
      '<div class="si-card"><h4>🙏 Técnicas base (las puedes usar hoy)</h4><p><b>Gassho:</b> palmas juntas al pecho, 1–3 min respirando, intención clara («me armonizo para el bien»).<br><b>Kenyoku (limpieza seca):</b> mano derecha barre hombro izquierdo → cadera derecha; al revés; luego antebrazos. Como “sacudir el polvo” antes y después.<br><b>Joshin Kokyu Ho:</b> respiración al vientre imaginando luz que entra por la coronilla y baja a las manos.<br><b>Byosen (escaneo):</b> pasa la mano a 5 cm del cuerpo y nota calor/frío/hormigueo: ahí quédate 1 min más.<br><b>Reiji Ho:</b> pide guía interior antes de empezar («¿dónde necesitan mis manos hoy?»).</p></div>' +
      '<div class="si-card"><h4>🌙 Reiki y tus 13 lunas</h4><p><b>Nueva:</b> Gassho + intención del ciclo. <b>Creciente:</b> secuencia corta diaria (disciplina). <b>Llena:</b> lo pendiente se ve: SOS + Gokai del enojo/preocupación. <b>Menguante:</b> completa o chakras para soltar. Cada sesión queda marcada con su luna en 📓 Diario.</p></div>' +
      '<div class="si-card"><h4>⚠️ Ética y cuidados</h4><p><b>Pide permiso siempre</b> (personas, fotos, casas): sin permiso, solo te haces autotratamiento y envías gratitud general. <b>No prometas sanar</b> ni suspendas remedios: acompaña y deriva a CESFAM/médico/psicóloga/o. Higiene: manos limpias, sin perfume fuerte, avisa que no hay masaje. Si hay fiebre alta, crisis, ideas de daño o duelo fresco que desborda: calma breve + red de apoyo (*4141 Chile 24h). Embarazo, marcapasos o cáncer: autotratamiento suave y siempre con control profesional.</p></div>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="rkGoGokai" class="btn btn-accent su-30e741">🙏 Conocer los 5 principios →</button> <button type="button" id="rkGoAuto" class="btn su-30e741">🤲 Hacerme un SOS de 6 min →</button></div>' +
    '</div>' +

    '<div id="rkGokai" class="hidden"><p class="muted su-11a508">Los <b>5 principios (Gokai)</b> que Usui pedía recitar mañana y noche. Toca “Vivir hoy” cuando lo practiques: suma a tu avance.</p><div id="rkGokaiGrid"></div></div>' +

    '<div id="rkPos" class="hidden"><div id="rkPosGrid"></div></div>' +

    '<div id="rkAuto" class="hidden">' +
      '<div class="menstrual-card su-68a1a9"><h4>🤲 Autotratamiento guiado</h4>' +
      '<p class="muted su-11a508">Ritual mínimo: <b>Kenyoku</b> (barrido) → <b>Gassho</b> 3 respiraciones con intención → secuencia → gratitud + agua.</p>' +
      '<div class="conv-row"><label class="su-4b3de7">🌿 Secuencia <select id="rkAutoSec"></select></label><label>⏱ Min por posición <input type="number" id="rkMinPorPaso" min="1" max="10" value="2"></label></div>' +
      '<p id="rkSecDesc" class="muted su-11a508"></p>' +
      '<div class="conv-row"><label class="su-4b3de7">📌 Foco <select id="rkFocoSel"></select></label><label>📅 Fecha <input type="date" id="rkFecha"></label></div>' +
      '<div id="rkFocoLibre" class="muted su-11a508"></div>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="rkComenzar" class="btn btn-accent su-30e741">▶ Comenzar secuencia</button><button type="button" id="rkVozGuia" class="btn su-30e741">🔊 Guía por voz</button><button type="button" id="rkDetener" class="btn su-30e741">⏹ Detener</button></div>' +
      '<div id="rkPasoBox" class="su-c1fafc"></div>' +
      '<div id="rkTimerLabel" class="muted su-e13d76">⏱ Elige una secuencia y pulsa “Comenzar”. Cada posición suena al terminar.</div>' +
      '<div class="conv-row su-8a77e5"><label>Calma antes (0–10) <input type="number" id="rkAntes" min="0" max="10" value="6" class="su-8573ba"></label>' +
      '<label>Calma después (0–10) <input type="number" id="rkDespues" min="0" max="10" value="4" class="su-8573ba"></label>' +
      '<label class="su-97445a">Minutos totales <input type="number" id="rkMinTotal" min="1" value="15" class="su-581be4"></label></div>' +
      '<label>💡 Nota de la sesión <input type="text" id="rkNota" placeholder="ej: calor en el pecho, solté el nudo; cierro con gratitud" maxlength="300"></label>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="rkGuardarSes" class="btn btn-accent su-30e741">🤲 Guardar sesión</button></div></div>' +
    '</div>' +

    '<div id="rkSes" class="hidden">' +
      '<div class="menstrual-card su-68a1a9"><h4>➕ Foco de armonización (con permiso)</h4>' +
      '<div class="conv-row"><label class="su-4b3de7">Foco * <input type="text" id="rkFocoTitulo" placeholder="ej: mi descanso, mamá (con su permiso), mi huerta" maxlength="60"></label><label>Estado <select id="rkFocoEstado"><option value="activo">activo</option><option value="en pausa">en pausa</option><option value="cerrado">cerrado</option></select></label></div>' +
      '<div class="conv-row"><label class="check-row su-ffd20f"><input type="checkbox" id="rkFocoPermiso"> ✅ Tengo permiso (o soy yo / mi espacio)</label></div>' +
      '<label>Nota <input type="text" id="rkFocoNota" placeholder="ej: permiso verbal ayer; solo calma, sin promesas" maxlength="120"></label>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="rkFocoAdd" class="btn btn-accent su-30e741">+ Agregar foco</button></div>' +
      '<p class="muted su-11a508">Sin permiso no se trabaja a otro: hazte autotratamiento y ofrece gratitud general. La ética sostiene la energía.</p></div>' +
      '<div class="conv-row su-d2c171"><label class="su-4b3de7">🔍 Buscar <input type="text" id="rkFocosQ" placeholder="foco, palabra..." autocomplete="off"></label>' +
      '<label>Estado <select id="rkFocosF"><option value="todos">Todos</option><option value="activo">Activos</option><option value="en pausa">En pausa</option><option value="cerrado">Cerrados</option></select></label></div>' +
      '<div id="rkFocosList" class="habits-list su-8c96f6"></div>' +
      '<div class="dlg-actions su-efea1d"><span id="rkFocosStats" class="muted su-11a508"></span></div>' +
      '<div class="menstrual-card su-68a1a9"><h4>📓 Mis sesiones</h4>' +
      '<div id="rkSesList" class="habits-list su-0aced6"></div>' +
      '<div class="dlg-actions su-efea1d"><span id="rkSesStats" class="muted su-11a508"></span>' +
      '<span class="su-3de8f9"><button type="button" id="rkSesToNote" class="btn su-30e741">📝 Llevar a nota de hoy</button>' +
      '<button type="button" id="rkSesShareAll" class="btn su-30e741">📤 Compartir</button>' +
      '<button type="button" id="rkSesClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>' +
    '</div>' +

    '<div id="rkAva" class="hidden"><div id="rkAvaBox" class="menstrual-card su-68a1a9"></div>' +
      '<div class="si-card"><h4>🌙 Cierre de luna (ritual de 3 líneas)</h4><p>Responde en tu cuaderno o en 📝 nota del día:<br><b>1)</b> ¿Qué calmé esta luna?<br><b>2)</b> ¿Qué principio me sostuvo?<br><b>3)</b> ¿Qué suelto con gratitud?<br>Termina con Gassho y 3 «gracias».</p></div></div>');
}

/* ---------- puente Metodos ---------- */
function puenteMetodos() {
  try {
    var iv = setInterval(function () {
      var sel = $('metTopic');
      if (!sel) return;
      var v = null;
      try { v = sel.value; } catch (e) {}
      var dlg = $('metodosDialog');
      if (!dlg || !dlg.open) return;
      if (v === 'reiki' && !$('rkOpenFromMetodos')) {
        var fab = document.createElement('div');
        fab.innerHTML = '<button type="button" id="rkOpenFromMetodos" class="btn btn-accent su-e182f0">🤲 Abrir mi Reiki completo</button>';
        var f = dlg.querySelector('form') || dlg;
        f.appendChild(fab);
        var nb = $('rkOpenFromMetodos');
        if (nb) nb.onclick = function () { try { dlg.close(); } catch (e) {} openRk(); };
      }
      if (v !== 'reiki') { var old = $('rkOpenFromMetodos'); if (old && old.parentNode) old.parentNode.remove(); }
    }, 800);
    setTimeout(function () { clearInterval(iv); }, 1000 * 60 * 10);
  } catch (e) {}
}

function openRk() {
  try {
    var lf = $('rkFecha'); if (lf && !lf.value) lf.value = todayKey();
    renderAll();
  } catch (e) {}
  openDlg('reikiDialog');
}
try { window.openReiki = openRk; window.openReikiDialog = openRk; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar boton en Linaje > practicas (tras Ho'oponopono si existe) */
  try {
    if (!$('btnReiki')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnReiki'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🤲 Reiki';
        try { btn.setAttribute('data-sub', 'practicas'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'reiki usui energia manos gokai chakras autotratamiento kenyoku gassho calma armonizacion iniciacion shoden okuden takata hayashi kurama');
        var ref = g.querySelector('#btnHooponopono') || g.querySelector('#btnCuartoCamino') || g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnReiki');
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnReiki') < 0) ALL_BTNS.push('btnReiki');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnReiki = ['linaje', 'practicas'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|practicas'] && BTN_ORDER['linaje|practicas'].indexOf('btnReiki') < 0) {
      var oi = BTN_ORDER['linaje|practicas'].indexOf('btnHooponopono');
      if (oi >= 0) BTN_ORDER['linaje|practicas'].splice(oi + 1, 0, 'btnReiki');
      else BTN_ORDER['linaje|practicas'].push('btnReiki');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnReiki = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnReiki"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnReiki"> 🤲 Reiki';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnReiki !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnReiki = lab.querySelector('input').checked;
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
  /* keywords cruzadas */
  try { addKw('btnMetodos', 'reiki usui manos energia gokai'); } catch (e2) {}
  try { addKw('btnEspiritual', 'reiki manos calma energia'); } catch (e3) {}
  try { addKw('btnEspiritu', 'reiki energia calma manos'); } catch (e4) {}
  try { addKw('btnEnergia', 'reiki descanso calma manos energia'); } catch (e5) {}
  try { addKw('btnBreath', 'reiki gassho respiracion calma'); } catch (e6) {}
  try { addKw('btnRecap', 'reiki calma soltar energia'); } catch (e7) {}

  /* 4) dialogo + eventos */
  buildDialog();
  rkPasos = pasosDeSecuencia('corta');
  rkPasoIdx = 0;
  renderAll();

  var b = $('btnReiki');
  if (b) b.onclick = function () { openRk(); };

  ['Guia', 'Gokai', 'Pos', 'Auto', 'Ses', 'Ava'].forEach(function (t) {
    var tb = $('tabRk' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });
  var gg = $('rkGoGokai'); if (gg) gg.onclick = function () { switchTab('Gokai'); renderGokai(); };
  var ga = $('rkGoAuto'); if (ga) ga.onclick = function () { switchTab('Auto'); rkPasos = pasosDeSecuencia('sos'); rkPasoIdx = 0; renderAuto(); rkPintarPaso(); };

  var sec = $('rkAutoSec');
  if (sec) sec.onchange = function () { rkPasos = pasosDeSecuencia(rkSecElegida()); rkPasoIdx = 0; renderAuto(); rkPintarPaso(); rkTimerStop(false); };
  var com = $('rkComenzar'); if (com) com.onclick = function () { rkPasos = pasosDeSecuencia(rkSecElegida()); rkPasoIdx = 0; rkIniciarPaso(); };
  var det = $('rkDetener'); if (det) det.onclick = function () { rkTimerStop(false); };
  var vg = $('rkVozGuia'); if (vg) vg.onclick = function () {
    var p = rkPasos[rkPasoIdx];
    speak('Cierra los ojos. Palmas juntas al pecho. Respira. ' + (p ? ('Lleva tus manos a ' + p.n + '. ' + (p.desc || '')) : '') + ' Quédate 2 minutos respirando 4-6. Gracias.');
  };
  var gs = $('rkGuardarSes'); if (gs) gs.onclick = function () { guardarSesion(); };

  var fa = $('rkFocoAdd');
  if (fa) fa.onclick = function () {
    var t = clean(($('rkFocoTitulo').value || '').trim(), 60); if (!t) return alert('Escribe el foco de armonización');
    var perm = $('rkFocoPermiso').checked;
    var rec = { id: uid('rkf'), titulo: t, estado: ($('rkFocoEstado') || {}).value || 'activo', permiso: perm, permisoNota: perm ? '' : 'sin permiso: solo autotratamiento', nota: clean($('rkFocoNota').value, 120), fecha: todayKey() };
    store().focos.push(rec);
    persistStore(); save('Foco guardado 🤲');
    $('rkFocoTitulo').value = ''; $('rkFocoNota').value = ''; $('rkFocoPermiso').checked = false;
    renderFocos(); renderAva(); renderAuto();
  };
  var fq = $('rkFocosQ'); if (fq) fq.oninput = function () { renderFocos(); };
  var ff = $('rkFocosF'); if (ff) ff.onchange = function () { renderFocos(); };

  var stn = $('rkSesToNote');
  if (stn) stn.onclick = function () {
    var last = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); })[0];
    if (!last) return alert('Sin sesiones aún');
    var txt = ('🤲 Reiki: ' + last.sec + ' · ' + last.minutos + ' min · ' + (last.titulo || '') + ' (' + last.antes + '→' + last.despues + '/10)').slice(0, 280);
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var ssa = $('rkSesShareAll');
  if (ssa) ssa.onclick = function () {
    var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
    var t = d.length ? '🤲 Mi Reiki (últimas)\n' + d.map(function (r) { return '• ' + r.fecha + ' · ' + r.sec + ' · ' + r.minutos + ' min · ' + (r.titulo || '') + ' (' + r.antes + '→' + r.despues + ')'; }).join('\n') : '🤲 Sin sesiones aún';
    share('Mi Reiki', t);
  };
  var scl2 = $('rkSesClear');
  if (scl2) scl2.onclick = function () { if (!confirm('¿Borrar todo tu historial de sesiones? (los focos se mantienen)')) return; store().ses = []; store().totalMin = 0; persistStore(); save(); renderSes(); renderAva(); };

  /* 5) puente Metodos */
  try { puenteMetodos(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
