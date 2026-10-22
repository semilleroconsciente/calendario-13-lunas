/* ============================================================
   REGALO TERRITORIAL — Calendario 13 Lunas (Penco · Bio-Bio)
   Puerta unica del proposito-regalo: puente generacional,
   autoconocimiento, honra a quienes partieron y semilla para
   quienes vendran. Educativa y respetuosa.
   5 pestanas: Proposito · Memoria · Puente · Diario · Semilla.
   Todo local y privado por usuario (userData + scheduleSave).
   Estetica propia (clases rg-*, sin style inline) con heroe
   lunar, altar de velas, tarjetas y animacion suave.
   Sin dependencias. 100% offline. IIFE + window.cal13regalo.
   SPDX-License-Identifier: GPL-3.0-or-later
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
function uid(p) { return (p || 'rg') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function lunaTxt(key) {
  try { if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' dia ' + r.diaN; } } catch (e) {}
  try { if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' dia ' + m.dia; } } catch (e2) {}
  return '';
}
function estacionHoy() {
  try { if (typeof estacionForKey === 'function') return estacionForKey(todayKey()); } catch (e) {}
  try { if (typeof pencoData !== 'undefined' && pencoData.estaciones) return pencoData.estaciones; } catch (e2) {}
  return '';
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) { alert('Este aparato no tiene voz disponible; igual puedes leer en voz alta en familia.'); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.92;
    speechSynthesis.speak(u);
  } catch (e) {}
}
function reduceMotion() {
  try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

/* ---------- datos ---------- */
function getMemorias() { var a = store('regaloMemorias', []); return Array.isArray(a) ? a : []; }
function getDiario() { var a = store('regaloDiario', []); return Array.isArray(a) ? a : []; }
function getCapsula() { var a = store('regaloCapsula', []); return Array.isArray(a) ? a : []; }
function getPuente() {
  var d = store('regaloPuente', { calma: false, acts: {} });
  if (!d || typeof d !== 'object') d = { calma: false, acts: {} };
  if (!d.acts) d.acts = {};
  return d;
}
function getConsent() { var d = store('regaloConsent', { quien: '', fecha: '', alcance: 'privado' }); return d || {}; }

var EJEMPLOS = [
  { nombre: 'Abuela Rosa (ejemplo)', vinc: 'abuela', lugar: 'Lirquen', historia: 'Enseno el charquican y a saludar al mar antes de pedir. Decia: come caliente y comparte.', consejo: 'Comparte aunque sea poco.', alcance: 'privado' },
  { nombre: 'Abuelo Manuel (ejemplo)', vinc: 'abuelo', lugar: 'Penco centro', historia: 'Carpintero de ribera. Arreglaba botes y sillas sin cobrar a vecinos. Olor a viruta y mate.', consejo: 'El oficio se hereda ensenando.', alcance: 'privado' },
  { nombre: 'Tia Marta (ejemplo)', vinc: 'tia', lugar: 'Cosmito', historia: 'Guardaba semillas en frascos con nombre y luna. Hizo la primera huerta comunitaria de la cuadra.', consejo: 'Guarda semilla de lo que te alimenta.', alcance: 'privado' },
  { nombre: 'Don Pedro (ejemplo)', vinc: 'vecino mayor', lugar: 'Playa Negra', historia: 'Pescador. Leía la luna para salir: menguante para orilla, creciente para adentro.', consejo: 'Mira la luna antes que el celular.', alcance: 'privado' },
  { nombre: 'Mama Elena (ejemplo)', vinc: 'madre', lugar: 'Cerro Verde', historia: 'Cantaba cuecas lavando y contaba epew a los nietos. Nos junto cada luna llena.', consejo: 'Canten juntos una vez por luna.', alcance: 'privado' }
];

var ACTS = [
  { id: 'siembra', ico: '🌱', t: 'Siembra con un mayor', d: '1 almácigo juntos: el mayor enseña, el niño riega y anota la luna. Pregunta: ¿qué sembraban antes en esta fecha?' },
  { id: 'cocina', ico: '🍲', t: 'Cocina una receta de linaje', d: 'Elige 1 receta de Memoria o Voces de los Abuelos. Cocinen juntos y anoten qué cambió. Foto solo si autorizan.' },
  { id: 'lengua', ico: '🗣️', t: '5 palabras en mapuzugun', d: 'Aprendan juntos: mari (10), küla (3), küyen (luna), lawen (remedio), trafkintu (intercambio). Usen el Kimün del calendario.' }
];
var EMOS = ['alegría', 'tranquilidad', 'cariño', 'motivación', 'tristeza', 'rabia', 'miedo', 'ansiedad', 'cansancio', 'soledad'];
var MOONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

/* ---------- estetica propia ---------- */
function ensureRgCss() {
  if ($('rgCss')) { ensureCalma(); return; }
  var st = document.createElement('style');
  st.id = 'rgCss';
  st.textContent =
    '#regaloDialog .rg-hero{position:relative;text-align:center;border-radius:16px;padding:18px 14px 14px;margin:2px 0 10px;overflow:hidden;' +
    'background:radial-gradient(120% 130% at 50% 0%,#232c5c 0%,#141b3d 55%,#0b1026 100%);border:1px solid #e8c56a55;box-shadow:0 10px 30px #0009}' +
    '#regaloDialog .rg-moons{display:flex;justify-content:center;gap:7px;font-size:21px;margin-bottom:8px}' +
    '#regaloDialog .rg-moons span{display:inline-block;animation:rg-tw 3.2s ease-in-out infinite}' +
    '#regaloDialog .rg-moons span:nth-child(2n){animation-delay:.5s}' +
    '#regaloDialog .rg-moons span:nth-child(3n){animation-delay:1s}' +
    '#regaloDialog .rg-moons span:nth-child(4n){animation-delay:1.6s}' +
    '@keyframes rg-tw{0%,100%{opacity:.55;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}' +
    '#regaloDialog .rg-kicker{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9aa3c7;margin-bottom:4px}' +
    '#regaloDialog .rg-title{font-size:24px;margin:0 0 4px;color:#f5e9c8}' +
    '#regaloDialog .rg-sub{color:#c6cdea;font-size:13px;margin:0}' +
    '#regaloDialog .rg-sub b{color:#f0d488}' +
    '#regaloDialog .rg-tabs{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;margin-bottom:6px;scrollbar-width:thin}' +
    '#regaloDialog .rg-tabs .btn{flex:1 0 auto;white-space:nowrap;border-radius:999px}' +
    '#regaloDialog .rg-tabs .btn-accent{box-shadow:0 0 0 1px #e8c56a inset,0 4px 14px #e8c56a33}' +
    '#regaloDialog .rg-pane.rg-in{animation:rg-in .38s ease-out}' +
    '@keyframes rg-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
    '#regaloDialog .rg-vals{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0}' +
    '#regaloDialog .rg-val{background:linear-gradient(160deg,#1b2447,#121939);border:1px solid #e8c56a44;border-radius:12px;padding:10px;text-align:center}' +
    '#regaloDialog .rg-val .rg-vi{font-size:24px;display:block;margin-bottom:4px}' +
    '#regaloDialog .rg-val b{font-size:12.5px;color:#f5e9c8;display:block;margin-bottom:2px}' +
    '#regaloDialog .rg-val span{font-size:11.5px;color:#9aa3c7}' +
    '#regaloDialog .rg-nunca{border-left:3px solid #e8c56a;background:#e8c56a0d;border-radius:0 10px 10px 0;padding:8px 12px;margin:10px 0;font-size:12.5px;color:#c6cdea}' +
    '#regaloDialog .rg-altar-head{display:flex;align-items:center;gap:10px;background:radial-gradient(100% 160% at 50% 0%,#2a1f3d 0%,#161e3f 60%);border:1px solid #c9a9c955;border-radius:12px;padding:10px 12px;margin:10px 0}' +
    '#regaloDialog .rg-vela-ico{font-size:30px;animation:rg-fl 2.4s ease-in-out infinite;filter:drop-shadow(0 0 8px #ffca7a88)}' +
    '@keyframes rg-fl{0%,100%{transform:scale(1) rotate(-2deg)}50%{transform:scale(1.08) rotate(2deg)}}' +
    '#regaloDialog .rg-altar-head b{color:#f5e9c8;font-size:13.5px;display:block}' +
    '#regaloDialog .rg-altar-head span{font-size:11.5px;color:#9aa3c7}' +
    '#regaloDialog .rg-vela{background:linear-gradient(165deg,#221d3f 0%,#161e3f 70%);border:1px solid #c9a9c966;border-radius:14px;padding:12px;margin:8px 0;box-shadow:0 6px 18px #0007}' +
    '#regaloDialog .rg-vela-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px}' +
    '#regaloDialog .rg-vela-top .rg-n{font-size:26px;filter:drop-shadow(0 0 6px #ffca7a77)}' +
    '#regaloDialog .rg-vela-top b{font-size:14px;color:#f5e9c8}' +
    '#regaloDialog .rg-vela-h{font-size:13px;color:#dfe4ff;margin:6px 0;line-height:1.55}' +
    '#regaloDialog .rg-vela-c{font-size:13px;color:#a8e0b6;font-style:italic;margin:0 0 8px;line-height:1.5}' +
    '#regaloDialog .rg-vela-btns{display:flex;gap:6px}' +
    '#regaloDialog .rg-vela-btns .btn{flex:1}' +
    '#regaloDialog .rg-form{background:#10173a;border:1px solid #2a3565;border-radius:14px;padding:12px;margin:10px 0}' +
    '#regaloDialog .rg-form h4{margin:0 0 8px;color:#f0d488}' +
    '#regaloDialog .rg-act{display:flex;gap:12px;align-items:flex-start;background:linear-gradient(160deg,#1b2447,#121939);border:1px solid #2a3565;border-radius:14px;padding:12px;margin:8px 0;cursor:pointer;transition:border-color .2s}' +
    '#regaloDialog .rg-act.rg-done{border-color:#8fd69488;background:linear-gradient(160deg,#1d3a2c,#121939)}' +
    '#regaloDialog .rg-act input{width:22px;height:22px;margin-top:2px;accent-color:#8fd694;flex:none}' +
    '#regaloDialog .rg-act .rg-ai{font-size:28px;flex:none;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:#0b1026;border-radius:12px;border:1px solid #e8c56a44}' +
    '#regaloDialog .rg-act b{color:#f5e9c8;font-size:13.5px;display:block;margin-bottom:2px}' +
    '#regaloDialog .rg-act span{font-size:12px;color:#9aa3c7;line-height:1.5}' +
    '#regaloDialog .rg-bar{height:10px;border-radius:999px;background:#0b1026;border:1px solid #2a3565;overflow:hidden;margin:8px 0 2px}' +
    '#regaloDialog .rg-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694);transition:width .4s ease}' +
    '#regaloDialog .rg-tl{position:relative;margin:10px 0 0 8px;padding-left:18px;border-left:2px solid #e8c56a44}' +
    '#regaloDialog .rg-tl-item{position:relative;background:#10173a;border:1px solid #2a3565;border-radius:12px;padding:10px;margin:0 0 10px}' +
    '#regaloDialog .rg-tl-item::before{content:"";position:absolute;left:-24px;top:14px;width:10px;height:10px;border-radius:50%;background:#e8c56a;box-shadow:0 0 8px #e8c56a}' +
    '#regaloDialog .rg-tl-item b{color:#f5e9c8;font-size:13px}' +
    '#regaloDialog .rg-tl-item p{font-size:12.5px;margin:4px 0;color:#c6cdea}' +
    '#regaloDialog .rg-cap{background:linear-gradient(165deg,#2c2340 0%,#161e3f 75%);border:1px dashed #e8c56a88;border-radius:14px;padding:12px;margin:8px 0}' +
    '#regaloDialog .rg-cap b{color:#f5e9c8}' +
    '#regaloDialog .rg-cap .rg-abre{display:inline-block;background:#e8c56a22;border:1px solid #e8c56a66;color:#f0d488;border-radius:999px;font-size:11.5px;padding:2px 10px;margin-top:4px}' +
    '#regaloDialog .rg-cta{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}' +
    '#regaloDialog .rg-cta .btn{flex:1 1 140px}' +
    '#regaloDialog #rgPrintArea{border:1px dashed #888;border-radius:12px;padding:12px;margin-top:10px;background:#faf8f2;color:#222}' +
    '#regaloDialog #rgPrintArea h4{color:#8a5a00;margin:0 0 6px}' +
    '#regaloDialog #rgPrintArea p{color:#333;font-size:13px}' +
    '.regalo-calma{font-size:118%;line-height:1.8}' +
    '.regalo-calma .btn{min-height:48px;font-size:1.05rem}' +
    '.regalo-calma dialog{font-size:1.1rem}' +
    '@media print{body>*{display:none}body.print-regalo #regaloDialog{display:block;position:static}body.print-regalo #regaloDialog form>*{display:none}body.print-regalo #rgPrintArea{display:block}}' +
    '@media (max-width:480px){#regaloDialog .rg-vals{grid-template-columns:1fr 1fr}#regaloDialog .rg-title{font-size:20px}#regaloDialog .rg-moons{font-size:17px}}' +
    '@media (prefers-reduced-motion:reduce){#regaloDialog .rg-moons span,#regaloDialog .rg-vela-ico,#regaloDialog .rg-pane.rg-in{animation:none}}';
  document.head.appendChild(st);
  ensureCalma();
}
function ensureCalma() {
  try {
    var p = getPuente();
    if (p.calma) document.documentElement.classList.add('regalo-calma');
  } catch (e) {}
}

/* ---------- dialogo ---------- */
function makeDialog() {
  var old = $('regaloDialog');
  if (old) return old;
  var d = document.createElement('dialog');
  d.id = 'regaloDialog';
  d.setAttribute('aria-label', 'Regalo territorial: proposito, memoria, puente, diario y semilla');
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="rg-hero"><div class="rg-moons" aria-hidden="true">' +
    MOONS.map(function (m) { return '<span>' + m + '</span>'; }).join('') +
    '</div><div class="rg-kicker">Penco · Bío-Bío · Mari Küla Küyen</div>' +
    '<h3 class="rg-title">🎁 Regalo territorial</h3>' +
    '<p class="rg-sub">Puente generacional · autoconocimiento · honra a quienes partieron · semilla para quienes vendrán.<br>Todo <b>privado y local</b>, en tu aparato.</p></div>' +
    '<div class="rg-tabs timer-tabs su-dd1da5">' +
    '<button type="button" id="tabRgProp" class="btn btn-accent su-30e741">🌱 Propósito</button>' +
    '<button type="button" id="tabRgMem" class="btn su-30e741">🕯️ Memoria</button>' +
    '<button type="button" id="tabRgPue" class="btn su-30e741">🤝 Puente</button>' +
    '<button type="button" id="tabRgDia" class="btn su-30e741">🪞 Diario</button>' +
    '<button type="button" id="tabRgSem" class="btn su-30e741">🌰 Semilla</button></div>' +

    '<div id="rgProp" class="rg-pane">' +
    '<div class="rg-vals">' +
    '<div class="rg-val"><span class="rg-vi">🤝</span><b>Puente generacional</b><span>niños y mayores haciendo juntos</span></div>' +
    '<div class="rg-val"><span class="rg-vi">🪞</span><b>Autoconocimiento</b><span>observarse por lunas, sin culpa</span></div>' +
    '<div class="rg-val"><span class="rg-vi">🕯️</span><b>Honra</b><span>memoria viva de quienes partieron</span></div>' +
    '<div class="rg-val"><span class="rg-vi">🌰</span><b>Semilla</b><span>legado para quienes vendrán</span></div></div>' +
    '<div class="si-card"><h4>🌱 Este proyecto es un regalo</h4><p>Para todas las personas del territorio. Educativa y respetuosa: si una abuela no lo entiende, se simplifica. Si un niño no lo usa sin internet, se imprime. Si una familia no querría a su difunto ahí, no va.</p></div>' +
    '<div class="rg-nunca"><b>🚫 Lo que nunca hará:</b> no vende ni rastrea · no sube nada sin tu gesto · no suplanta a mayor, machi, matrona ni médico · no publica lo sagrado · no diagnostica. Red: *4141 · CESFAM · 131/133.</div>' +
    '<div class="rg-cta"><a class="btn su-30e741" href="legal/regalo.html" target="_blank" rel="noopener">📜 Leer propósito offline</a>' +
    '<button type="button" id="rgHearProp" class="btn su-30e741">🔊 Escuchar</button></div>' +
    '</div>' +

    '<div id="rgMem" class="rg-pane hidden">' +
    '<div class="rg-altar-head"><span class="rg-vela-ico" aria-hidden="true">🕯️</span><span><b>Altar de la memoria</b><span id="rgAltarSub">Cada vela es una historia con permiso familiar. Por defecto, solo en este aparato.</span></span></div>' +
    '<div class="si-card"><h4>🤝 Permiso primero</h4><p class="muted">Guardar con autorización familiar. <a href="legal/regalo.html" target="_blank" rel="noopener">Ver protocolo</a>. Puentes: 🌳 Árbol y 🗣️ Voces.</p>' +
    '<div class="conv-row"><label>Autoriza <input type="text" id="rgConsQuien" placeholder="ej: hija Rosa" maxlength="30"></label><label>Alcance <select id="rgConsAlc"><option value="privado">Solo este aparato</option><option value="compartible">Se puede compartir</option></select></label></div></div>' +
    '<div class="rg-form"><h4>➕ Encender una memoria</h4>' +
    '<div class="conv-row"><label>Nombre * <input type="text" id="rgMemNom" placeholder="ej: Abuela Rosa" maxlength="40"></label><label>Vínculo <input type="text" id="rgMemVinc" placeholder="abuela, vecino..." maxlength="20"></label></div>' +
    '<div class="conv-row"><label>Fecha (si la sabes) <input type="date" id="rgMemFec"></label><label>Lugar <input type="text" id="rgMemLug" placeholder="ej: Lirquén" maxlength="30"></label></div>' +
    '<label>Historia (2-4 líneas) <input type="text" id="rgMemHis" placeholder="qué me enseñó, qué olor la recuerda..." maxlength="200"></label>' +
    '<label>Consejo para el futuro <input type="text" id="rgMemCon" placeholder="ej: comparte aunque sea poco" maxlength="120"></label>' +
    '<div class="rg-cta"><button type="button" id="rgMemAdd" class="btn btn-accent su-30e741">🕯️ Guardar memoria</button>' +
    '<button type="button" id="rgMemEj" class="btn su-30e741">✨ 5 ejemplos</button></div></div>' +
    '<div id="rgMemList"></div>' +
    '<div class="dlg-actions su-efea1d"><span id="rgMemStats" class="muted su-11a508"></span>' +
    '<span class="su-a76d59"><button type="button" id="rgMemHear" class="btn su-30e741">🔊</button><button type="button" id="rgMemExp" class="btn su-30e741">📤</button><button type="button" id="rgMemClear" class="btn su-214f75">🗑</button></span></div>' +
    '</div>' +

    '<div id="rgPue" class="rg-pane hidden">' +
    '<div class="si-card"><h4>🤝 Puente: hacer juntos</h4><p class="muted">Marca 1 por luna. Lo importante es juntar 2 generaciones en 30 minutos.</p>' +
    '<div class="rg-bar" aria-hidden="true"><i id="rgActsBar"></i></div><p class="muted su-11a508" id="rgActsTxt"></p><div id="rgActs"></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>👵👶 Acceso mayor y niño</h4>' +
    '<div class="rg-cta"><button type="button" id="rgCalma" class="btn su-30e741">🔎 Texto grande</button>' +
    '<button type="button" id="rgHearAll" class="btn su-30e741">🔊 Escuchar</button>' +
    '<button type="button" id="rgPrint" class="btn su-30e741">🖨️ Imprimir luna</button></div>' +
    '<p class="muted su-11a508" id="rgCalmaLine">Texto grande ayuda a mayores y a leer juntos.</p></div>' +
    '</div>' +

    '<div id="rgDia" class="rg-pane hidden">' +
    '<div class="si-card"><h4>🪞 Diario lunar (privado)</h4><p class="muted">¿Cómo llegué? ¿Cómo me voy? ¿Qué soñé? Sin puntaje ni culpa. <b>No reemplaza terapia ni CESFAM.</b> Si la estás pasando mal: *4141 (24h) · 149 · 1455 · 131.</p></div>' +
    '<div class="rg-form"><h4>➕ Hoy ' + esc(todayKey()) + ' · ' + esc(lunaTxt(todayKey())) + '</h4>' +
    '<div class="conv-row"><label>Energía al llegar (1-10) <select id="rgDLle">' + Array.from({ length: 10 }, function (_, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + '</option>'; }).join('') + '</select></label>' +
    '<label>Emoción <select id="rgDEmo">' + EMOS.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label>' +
    '<label>Energía al irme (1-10) <select id="rgDVa">' + Array.from({ length: 10 }, function (_, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Sueño / pewma <input type="text" id="rgDSue" placeholder="soñé con..." maxlength="140"></label>' +
    '<label>1 gratitud <input type="text" id="rgDGrat" placeholder="agradezco..." maxlength="140"></label>' +
    '<div class="rg-cta"><button type="button" id="rgDAdd" class="btn btn-accent su-30e741">+ Guardar hoy</button></div></div>' +
    '<div id="rgDTrend" class="si-card"></div>' +
    '<div id="rgDList" class="rg-tl"></div>' +
    '</div>' +

    '<div id="rgSem" class="rg-pane hidden">' +
    '<div class="si-card"><h4>🌰 Cápsula del tiempo (para 10 años)</h4><p class="muted">1 mensaje por familia: qué sueñas para el territorio. Queda local + exportable. Sin apellido de niños.</p>' +
    '<div class="conv-row"><label>De <input type="text" id="rgCapDe" placeholder="ej: familia Rivera" maxlength="30"></label><label>Abrir en <input type="date" id="rgCapAbre"></label></div>' +
    '<label>Mensaje <input type="text" id="rgCapTx" placeholder="para quienes vengan..." maxlength="280"></label>' +
    '<div class="rg-cta"><button type="button" id="rgCapAdd" class="btn btn-accent su-30e741">🌰 Sellar cápsula</button>' +
    '<button type="button" id="rgSemExp" class="btn su-30e741">📤 Exportar semilla</button></div>' +
    '<div id="rgCapList"></div></div>' +
    '<div class="si-card"><h4>🌱 Llevar a otra comuna (30 min)</h4><p class="muted">En PC: <code>node scripts/nuevo-territorio.cjs maule "Maule"</code> → edita <code>data/territorios/maule/territorio.json</code> → abre <code>?territorio=maule</code> → <code>node scripts/validar-territorios.cjs</code>. Detalle offline en <code>docs/GUIA-CLONAR-Y-LEGADO.md</code>.</p>' +
    '<p class="muted">Respaldo comunitario: 1 copia en tu celu + 1 en pendrive de sede o escuela + 1 hoja impresa si quieres. En Comunidad → App → Respaldo.</p></div>' +
    '</div>' +

    '<div id="rgPrintArea" class="hidden"></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function switchTab(t) {
  ['Prop', 'Mem', 'Pue', 'Dia', 'Sem'].forEach(function (k) {
    var p = $('rg' + k), b = $('tabRg' + k);
    if (p) p.classList.toggle('hidden', k !== t);
    if (b) b.classList.toggle('btn-accent', k === t);
  });
  try {
    var pane = $('rg' + t);
    if (pane && !reduceMotion()) {
      pane.classList.remove('rg-in');
      void pane.offsetWidth;
      pane.classList.add('rg-in');
    }
  } catch (e) {}
}

/* ---------- renders ---------- */
function renderMem() {
  var box = $('rgMemList'); if (!box) return;
  var all = getMemorias();
  var d = all.slice().reverse();
  box.innerHTML = d.length ? d.map(function (r) {
    return '<div class="rg-vela"><div class="rg-vela-top"><span class="rg-n" aria-hidden="true">🕯️</span><span><b>' + esc(r.nombre) + '</b><br>' +
      '<span class="chip su-0d5be0">' + esc(r.vinc || '') + (r.lugar ? ' · ' + esc(r.lugar) : '') + '</span> ' +
      '<span class="chip su-0d5be0">' + esc(r.alcance === 'compartible' ? '📤 compartible' : '🔒 solo aquí') + '</span></span></div>' +
      (r.fecha ? '<div class="muted su-cdff1d">' + esc(r.fecha) + ' · ' + esc(lunaTxt(r.fecha)) + '</div>' : '') +
      (r.historia ? '<p class="rg-vela-h">' + esc(r.historia) + '</p>' : '') +
      (r.consejo ? '<p class="rg-vela-c">🌱 «' + esc(r.consejo) + '»</p>' : '') +
      '<div class="rg-vela-btns"><button class="btn su-337714" data-hear="' + r.id + '">🔊 Escuchar</button>' +
      '<button class="btn su-337714" data-share="' + r.id + '">📤</button>' +
      '<button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">El altar está vacío. Enciende 1 memoria arriba, o carga los 5 ejemplos para aprender sin exponer a nadie.</p>';
  var st = $('rgMemStats');
  if (st) st.textContent = all.length + (all.length === 1 ? ' vela' : ' velas') + ' · ' + all.filter(function (r) { return r.alcance === 'compartible'; }).length + ' compartibles · resto solo aquí';
  var sub = $('rgAltarSub');
  if (sub) sub.textContent = all.length ? (all.length + (all.length === 1 ? ' historia cuidada' : ' historias cuidadas') + ' con permiso familiar. Por defecto, solo en este aparato.') : 'Cada vela es una historia con permiso familiar. Por defecto, solo en este aparato.';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Apagar esta vela? Cualquier familiar puede pedirlo y se borra sin preguntas.')) return; var dd = getMemorias(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save('Vela apagada'); renderMem(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var r = getMemorias().find(function (x) { return x.id === b.getAttribute('data-share'); }); if (!r) return; if (r.alcance !== 'compartible') { alert('Esta memoria es solo local. Cambia su alcance solo con permiso familiar.'); return; } share('🕯️ En memoria de ' + r.nombre, (r.historia || '') + (r.consejo ? '\n🌱 ' + r.consejo : '')); }; });
  box.querySelectorAll('[data-hear]').forEach(function (b) { b.onclick = function () { var r = getMemorias().find(function (x) { return x.id === b.getAttribute('data-hear'); }); if (r) speak(r.nombre + '. ' + (r.historia || '') + ' ' + (r.consejo || '')); }; });
  var c = getConsent();
  if ($('rgConsQuien') && !$('rgConsQuien').value && c.quien) $('rgConsQuien').value = c.quien;
  if ($('rgConsAlc') && c.alcance) $('rgConsAlc').value = c.alcance;
}
function renderPuente() {
  var box = $('rgActs'); if (!box) return;
  var p = getPuente();
  var hechas = ACTS.filter(function (a) { return p.acts[a.id]; }).length;
  box.innerHTML = ACTS.map(function (a) {
    var on = !!p.acts[a.id];
    return '<label class="rg-act' + (on ? ' rg-done' : '') + '"><input type="checkbox" data-act="' + a.id + '"' + (on ? ' checked' : '') + '>' +
      '<span class="rg-ai" aria-hidden="true">' + a.ico + '</span>' +
      '<span><b>' + (on ? '✓ ' : '') + esc(a.t) + '</b><span>' + esc(a.d) + '</span></span></label>';
  }).join('');
  box.querySelectorAll('[data-act]').forEach(function (c) {
    c.onchange = function () {
      var dd = getPuente(); dd.acts[c.getAttribute('data-act')] = c.checked;
      save(c.checked ? 'Actividad lista 🤝' : 'Guardado');
      try {
        var lab = c.closest('.rg-act');
        if (lab) lab.classList.toggle('rg-done', c.checked);
        paintPuenteBar();
      } catch (e) { renderPuente(); }
    };
  });
  paintPuenteBar();
  paintCalma();
}
function paintPuenteBar() {
  var p = getPuente();
  var hechas = ACTS.filter(function (a) { return p.acts[a.id]; }).length;
  var bar = $('rgActsBar'), txt = $('rgActsTxt');
  try {
    if (bar) {
      bar.setAttribute('data-w', String(hechas));
      bar.style.width = Math.round(hechas / ACTS.length * 100) + '%';
    }
  } catch (e) {}
  if (txt) txt.textContent = hechas + '/' + ACTS.length + ' actividades esta luna' + (hechas === ACTS.length ? ' · ¡puente completo! 🌈' : ' · marca 1 por luna');
}
function renderDiario() {
  var box = $('rgDList'); if (!box) return;
  var d = getDiario().slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  box.innerHTML = d.length ? d.slice(0, 20).map(function (r) {
    return '<div class="rg-tl-item"><b>🪞 ' + esc(r.fecha) + '</b> <span class="muted">· ' + esc(lunaTxt(r.fecha)) + ' · ' + esc(r.emo || '') + ' · ⚡ ' + esc(String(r.lle)) + '→' + esc(String(r.va)) + '</span>' +
      (r.sue ? '<p>💭 ' + esc(r.sue) + '</p>' : '') +
      (r.grat ? '<p>🙏 ' + esc(r.grat) + '</p>' : '') +
      '<div><button class="btn su-9b8fb7" data-del="' + r.id + '">✕ Borrar día</button></div></div>';
  }).join('') : '<p class="muted">Sin registros. Guarda hoy en 20 segundos: energía, emoción, sueño y 1 gratitud.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar este día del diario?')) return; var dd = getDiario(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderDiario(); }; });
  var tr = $('rgDTrend');
  if (tr) {
    var ult = d.slice(0, 7);
    var prom = ult.length ? (ult.reduce(function (a, r) { return a + (+r.va || +r.lle || 0); }, 0) / ult.length) : 0;
    var pct = ult.length ? Math.round(prom * 10) : 0;
    tr.innerHTML = '<h4>⚡ Mi ritmo (7 días)</h4>' +
      '<p class="muted su-11a508">🌙 ' + esc(lunaTxt(todayKey())) + ' · 🍂 ' + esc(String(estacionHoy() || 'ciclo territorial')) + ' · energía media: <b>' + (ult.length ? prom.toFixed(1) : '—') + '</b> (' + ult.length + ' días)</p>' +
      '<div class="rg-bar" aria-hidden="true"><i data-w="' + pct + '"></i></div>' +
      '<p class="muted su-11a508">Solo sugiere ritmo: si baja 2+ lunas o hay ideas de daño, pide apoyo (*4141 / CESFAM).</p>';
    try {
      var fill = tr.querySelector('.rg-bar i');
      if (fill) fill.style.width = pct + '%';
    } catch (e) {}
  }
}
function renderCapsula() {
  var box = $('rgCapList'); if (!box) return;
  var d = getCapsula().slice().sort(function (a, b) { return String(a.abre).localeCompare(String(b.abre)); });
  box.innerHTML = d.length ? d.map(function (r) {
    return '<div class="rg-cap"><span>🌰 <b>De ' + esc(r.de) + '</b></span><br>' +
      '<span class="muted">' + esc(r.fecha) + ' · ' + esc(lunaTxt(r.fecha)) + '</span><br>' +
      '<p class="rg-vela-h">«' + esc(r.texto) + '»</p>' +
      '<span class="rg-abre">🔒 se abre ' + esc(r.abre) + '</span> ' +
      '<button class="btn su-9b8fb7" data-del="' + r.id + '">✕</button></div>';
  }).join('') : '<p class="muted">Vacía. Sella 1 mensaje para quienes vendrán en 10 años.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Romper esta cápsula?')) return; var dd = getCapsula(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderCapsula(); }; });
}
function renderAll() { try { renderMem(); } catch (e) {} try { renderPuente(); } catch (e) {} try { renderDiario(); } catch (e) {} try { renderCapsula(); } catch (e) {} }

/* ---------- calma + print ---------- */
function paintCalma() {
  var p = getPuente();
  try { document.documentElement.classList.toggle('regalo-calma', !!p.calma); } catch (e) {}
  var l = $('rgCalmaLine');
  if (l) l.textContent = p.calma ? '✓ Texto grande activado (toda la app). Tócalo de nuevo para volver.' : 'Texto grande ayuda a mayores y a leer juntos.';
  var b = $('rgCalma');
  if (b) b.textContent = p.calma ? '🔎 Volver a texto normal' : '🔎 Texto grande';
}
function imprimirLuna() {
  ensureRgCss();
  var mems = getMemorias();
  var m = mems.length ? mems[mems.length - 1] : null;
  var box = $('rgPrintArea');
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = '<h4>🌙 Luna para llevar · Mari Küla Küyen</h4>' +
    '<p><b>' + esc(lunaTxt(todayKey())) + '</b> · ' + esc(todayKey()) + ' · Penco, Bío-Bío</p>' +
    '<p>🌱 <b>Siembra:</b> revisa Siembra lunar del calendario. &nbsp; 🌊 <b>Marea:</b> revisa Mareas SHOA hoy.</p>' +
    '<p>🤝 <b>En familia:</b> ' + esc(ACTS[0].t) + ' — ' + esc(ACTS[0].d) + '</p>' +
    (m ? '<p>🕯️ <b>Memoria:</b> ' + esc(m.nombre) + ' — ' + esc(m.historia || m.consejo || '') + (m.consejo ? '<br>🌱 «' + esc(m.consejo) + '»' : '') + '</p>' : '<p>🕯️ <b>Pregunta hoy a un mayor:</b> ¿qué sembraban en esta luna?</p>') +
    '<p>🎁 Regalo libre (GPL + CC BY-NC-SA) · Semillero Consciente. Lo digital queda en tu aparato.</p>';
  try {
    document.body.classList.add('print-regalo');
    window.print();
    setTimeout(function () { try { document.body.classList.remove('print-regalo'); } catch (e) {} }, 800);
  } catch (e) { share('🌙 Luna para llevar ' + todayKey(), box.textContent); }
}

/* ---------- setup ---------- */
function openDlg() {
  makeDialog();
  switchTab('Prop');
  renderAll();
  var d = $('regaloDialog');
  try { if (d && d.showModal && !d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
}
function ensureSection() {
  var box = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!box) return;
  var lab = box.querySelector('.sub-label[data-sub="regalo"]');
  if (!lab) {
    lab = document.createElement('span');
    lab.className = 'sub-label'; lab.setAttribute('data-sub', 'regalo'); lab.textContent = '🎁 Regalo territorial';
    box.appendChild(lab);
  }
  var el = $('btnRegalo');
  if (!el) {
    el = document.createElement('button');
    el.id = 'btnRegalo'; el.className = 'btn'; el.type = 'button';
    box.appendChild(el);
  }
  el.textContent = '🎁 Regalo';
  el.setAttribute('data-keywords', 'regalo proposito puente generacional memoria honra altar velas diario autoconocimiento capsula semilla futuro texto grande escuchar imprimir luna legado don');
  try { el.setAttribute('data-sub', 'regalo'); el.dataset.sub = 'regalo'; } catch (eS) {}
  try { box.insertBefore(lab, el); } catch (eO) {}
  el.onclick = openDlg;
}
function registerVisibility() {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnRegalo') < 0) ALL_BTNS.push('btnRegalo'); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnRegalo = ['comunidad', 'regalo']; } catch (e2) {}
  try { if (typeof BTN_ORDER !== 'undefined') BTN_ORDER['comunidad|regalo'] = ['btnRegalo']; } catch (e3) {}
  try { if (typeof PRESETS !== 'undefined') Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnRegalo = true; }); } catch (e4) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e5) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e6) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e7) {}
}
function wire() {
  makeDialog();
  ensureRgCss();
  if ($('tabRgProp')) $('tabRgProp').onclick = function () { switchTab('Prop'); };
  if ($('tabRgMem')) $('tabRgMem').onclick = function () { switchTab('Mem'); renderMem(); };
  if ($('tabRgPue')) $('tabRgPue').onclick = function () { switchTab('Pue'); renderPuente(); };
  if ($('tabRgDia')) $('tabRgDia').onclick = function () { switchTab('Dia'); renderDiario(); };
  if ($('tabRgSem')) $('tabRgSem').onclick = function () { switchTab('Sem'); renderCapsula(); };
  if ($('rgHearProp')) $('rgHearProp').onclick = function () { speak('Este proyecto es un regalo para el territorio. Puente generacional, autoconocimiento, honra a quienes partieron y semilla para quienes vendrán.'); };
  if ($('rgMemAdd')) $('rgMemAdd').onclick = function () {
    var n = clean(($('rgMemNom') || {}).value, 40);
    if (!n) { alert('Escribe el nombre'); return; }
    var q = clean(($('rgConsQuien') || {}).value, 30);
    if (!q) { alert('Escribe quién autoriza (protocolo de memoria).'); return; }
    var alc = ($('rgConsAlc') || {}).value || 'privado';
    try { var u = userData(); u.regaloConsent = { quien: q, fecha: todayKey(), alcance: alc }; } catch (e) {}
    getMemorias().push({ id: uid('rm'), nombre: n, vinc: clean(($('rgMemVinc') || {}).value, 20) || 'familia', fecha: ($('rgMemFec') || {}).value || '', lugar: clean(($('rgMemLug') || {}).value, 30), historia: clean(($('rgMemHis') || {}).value, 200), consejo: clean(($('rgMemCon') || {}).value, 120), alcance: alc });
    save('Memoria guardada 🕯️');
    ['rgMemNom', 'rgMemVinc', 'rgMemFec', 'rgMemLug', 'rgMemHis', 'rgMemCon'].forEach(function (id) { var el = $(id); if (el) el.value = ''; });
    renderMem();
  };
  if ($('rgMemEj')) $('rgMemEj').onclick = function () {
    if (getMemorias().length && !confirm('Ya tienes memorias. ¿Agregar igual los 5 ejemplos para aprender?')) return;
    EJEMPLOS.forEach(function (e) { getMemorias().push({ id: uid('rm'), nombre: e.nombre, vinc: e.vinc, fecha: '', lugar: e.lugar, historia: e.historia, consejo: e.consejo, alcance: 'privado' }); });
    save('Ejemplos cargados ✨'); renderMem();
  };
  if ($('rgMemHear')) $('rgMemHear').onclick = function () { var d = getMemorias(); speak(d.length ? d.slice(-3).map(function (r) { return r.nombre + '. ' + (r.historia || ''); }).join(' ') : 'El altar está vacío.'); };
  if ($('rgMemExp')) $('rgMemExp').onclick = function () { var d = getMemorias().filter(function (r) { return r.alcance === 'compartible'; }); if (!d.length) { alert('Nada compartible: por defecto todo queda local. Marca alcance compartible solo con permiso.'); return; } share('🕯️ Memorias compartibles (' + d.length + ')', d.map(function (r) { return '· ' + r.nombre + ' (' + (r.vinc || '') + '): ' + (r.historia || '') + (r.consejo ? ' 🌱 ' + r.consejo : ''); }).join('\n')); };
  if ($('rgMemClear')) $('rgMemClear').onclick = function () { if (!getMemorias().length) return; if (!confirm('¿Apagar TODAS las velas de este aparato?')) return; try { userData().regaloMemorias = []; } catch (e) {} save(); renderMem(); };
  if ($('rgCalma')) $('rgCalma').onclick = function () { var dd = getPuente(); dd.calma = !dd.calma; save(dd.calma ? 'Texto grande ✓' : 'Texto normal'); paintCalma(); };
  if ($('rgHearAll')) $('rgHearAll').onclick = function () { speak('Puente generacional. Tres actividades: ' + ACTS.map(function (a) { return a.t + '. ' + a.d; }).join(' ')); };
  if ($('rgPrint')) $('rgPrint').onclick = imprimirLuna;
  if ($('rgDAdd')) $('rgDAdd').onclick = function () {
    getDiario().push({ id: uid('rd'), fecha: todayKey(), lle: +($('rgDLle') || {}).value || 5, emo: ($('rgDEmo') || {}).value || '', va: +($('rgDVa') || {}).value || 5, sue: clean(($('rgDSue') || {}).value, 140), grat: clean(($('rgDGrat') || {}).value, 140) });
    save('Día guardado 🪞');
    if ($('rgDSue')) $('rgDSue').value = ''; if ($('rgDGrat')) $('rgDGrat').value = '';
    renderDiario();
  };
  if ($('rgCapAdd')) $('rgCapAdd').onclick = function () {
    var t = clean(($('rgCapTx') || {}).value, 280);
    if (!t) { alert('Escribe el mensaje para el futuro'); return; }
    getCapsula().push({ id: uid('rc'), de: clean(($('rgCapDe') || {}).value, 30) || 'una familia', fecha: todayKey(), abre: ($('rgCapAbre') || {}).value || '2036-01-01', texto: t });
    save('Cápsula sellada 🌰');
    if ($('rgCapTx')) $('rgCapTx').value = '';
    renderCapsula();
  };
  if ($('rgSemExp')) $('rgSemExp').onclick = function () {
    var payload;
    try { payload = { app: 'calendario-13-lunas', tipo: 'semilla-regalo', fecha: new Date().toISOString(), memorias: getMemorias(), diario: getDiario(), capsula: getCapsula(), puente: getPuente() }; } catch (e) { payload = {}; }
    try {
      var blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'semilla-13lunas.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e2) {} }, 2000);
      save('Semilla exportada 🌰');
    } catch (e2) { share('🌰 Semilla 13 lunas', JSON.stringify(payload).slice(0, 2000)); }
  };
  try { renderAll(); } catch (e2) {}
}

window.cal13regalo = { open: openDlg, list: getMemorias, version: 2 };

function setup() { ensureSection(); registerVisibility(); wire(); try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {} }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(function () { try { ensureSection(); registerVisibility(); } catch (e) {} }, 2000);

})();
