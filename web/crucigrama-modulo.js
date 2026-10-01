/* ============================================================
   CRUCIGRAMA — Calendario 13 Lunas (Penco · Bio-Bio)
   Sección completa en Aprender > Juegos (btnCrucigrama):
   - Jugar: crucigramas temáticos de Penco (Mar, Mapuzugun,
     Bosque Nativo, Luna & Huerta) con generador propio:
     cada partida arma un tablero distinto, con pistas en
     español, teclado en pantalla + físico, comprobar,
     pistas, revelar palabra, temporizador y guardado
     automático de la partida en curso.
   - Aprender: qué es un crucigrama + cómo jugar + tips.
   - Mis registros: estadísticas por tema, mejor tiempo,
     historial privado y local por usuario.
   - Consejo lunar para entrenar la mente según la fase.
   Todo queda local y privado por usuario (DATA + scheduleSave).
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
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}

/* ================= ESTILOS ================= */
function injectCSS() {
  if ($('cruciStyles')) return;
  var st = document.createElement('style');
  st.id = 'cruciStyles';
  st.textContent = [
    '.cr-wrap{max-width:520px;margin:0 auto}',
    '.cr-temas{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}',
    '.cr-top{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px}',
    '.cr-stat{font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:4px 9px;color:var(--text)}',
    '.cr-stat b{color:var(--gold)}',
    '.cr-board{display:grid;gap:2px;background:transparent;touch-action:manipulation;justify-content:center}',
    '.cr-cell{position:relative;aspect-ratio:1;border:0;padding:0;border-radius:5px;background:var(--card);border:1px solid var(--line);color:var(--text);font-weight:800;font-size:clamp(12px,3.4vw,18px);cursor:pointer;display:flex;align-items:center;justify-content:center;text-transform:uppercase;min-width:0}',
    '.cr-cell .cr-num{position:absolute;top:1px;left:3px;font-size:8px;font-weight:700;color:var(--gold);line-height:1;pointer-events:none}',
    '.cr-black{background:transparent;border:0;cursor:default;box-shadow:none}',
    '.cr-active{background:rgba(232,197,106,.38)!important;outline:2px solid var(--gold);outline-offset:-2px}',
    '.cr-word{background:rgba(232,197,106,.14)}',
    '.cr-err{background:rgba(231,76,60,.45)!important;color:#ffb0b0}',
    '.cr-ok{color:#8fd694}',
    '.cr-clues{display:grid;gap:8px;margin-top:10px}',
    '@media(min-width:560px){.cr-clues{grid-template-columns:1fr 1fr}}',
    '.cr-clue-list{display:flex;flex-direction:column;gap:4px;max-height:190px;overflow:auto}',
    '.cr-clue{text-align:left;font-size:12px;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:6px 8px;cursor:pointer;line-height:1.35}',
    '.cr-clue b{color:var(--gold)}',
    '.cr-clue.sel{border-color:var(--gold);background:rgba(232,197,106,.14)}',
    '.cr-clue.done{opacity:.55;text-decoration:line-through}',
    '.cr-kb{display:grid;grid-template-columns:repeat(9,1fr);gap:4px;margin-top:10px}',
    '.cr-key{border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:8px;padding:8px 0;font-size:14px;font-weight:800;cursor:pointer}',
    '.cr-key:active{transform:scale(.94)}',
    '.cr-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
    '.cr-cur{font-size:12px;line-height:1.5;margin-top:8px}'
  ].join('\n');
  document.head.appendChild(st);
}

/* ================= DATOS: palabras + pistas (Penco) ================= */
var TEMAS = [
  { id: 'mar', n: '🌊 Mar de Penco', d: 'Mareas, pesca y costa del Golfo de Arauco.',
    words: [
      { w: 'MAREA', c: 'Sube y baja del mar dos veces al día' },
      { w: 'PESCA', c: 'Sustento artesanal de Lirquén y Penco' },
      { w: 'LIRQUEN', c: 'Caleta y puerto vecino de Penco' },
      { w: 'PENCO', c: 'Nuestra comuna junto al mar' },
      { w: 'PLAYA', c: 'Arena junto a las olas (Playa Negra)' },
      { w: 'BOTE', c: 'Embarcación pequeña de pescador' },
      { w: 'RED', c: 'Tejido para pescar' },
      { w: 'ANCLA', c: 'Frena el bote en el mar' },
      { w: 'CORVINA', c: 'Pez preciado del Golfo de Arauco' },
      { w: 'ROBALO', c: 'Pez de orilla muy buscado' },
      { w: 'LUCHE', c: 'Alga roja de invierno para el pan' },
      { w: 'LAPA', c: 'Molusco pegado a la roca' },
      { w: 'JAIBA', c: 'Cangrejo de patas planas' },
      { w: 'PLEAMAR', c: 'Marea alta' },
      { w: 'BAJAMAR', c: 'Marea baja, hora del roquerío' },
      { w: 'GOLFO', c: 'Golfo de … (brazo de mar de Penco)' }
    ] },
  { id: 'mapu', n: '🗣️ Kimün Mapuzugun', d: 'Palabras de la lengua mapuche.',
    words: [
      { w: 'KUYEN', c: 'Luna en mapuzugun' },
      { w: 'ANTU', c: 'Sol en mapuzugun' },
      { w: 'KO', c: 'Agua en mapuzugun' },
      { w: 'MAPU', c: 'Tierra en mapuzugun' },
      { w: 'KIMUN', c: 'Saber, conocimiento' },
      { w: 'EPEW', c: 'Cuento o relato tradicional' },
      { w: 'RUKA', c: 'Casa tradicional mapuche' },
      { w: 'LAWEN', c: 'Remedio, planta medicinal' },
      { w: 'MACHI', c: 'Autoridad espiritual y sanadora' },
      { w: 'LONKO', c: 'Cabeza, autoridad de la comunidad' },
      { w: 'PUKEM', c: 'Invierno' },
      { w: 'PEWU', c: 'Primavera, brote' },
      { w: 'WALUNG', c: 'Verano, tiempo de abundancia' },
      { w: 'RIMU', c: 'Otoño' },
      { w: 'NGILLATUN', c: 'Ceremonia de rogativa' },
      { w: 'WERKEN', c: 'Mensajero de la comunidad' }
    ] },
  { id: 'bosque', n: '🌳 Bosque Nativo', d: 'Árboles, hongos y aves de Penco.',
    words: [
      { w: 'CANELO', c: 'Árbol sagrado mapuche, de corteza picante' },
      { w: 'BOLDO', c: 'Árbol de hoja dura para el estómago' },
      { w: 'PEUMO', c: 'Árbol de fruto rojo, amigo del agua' },
      { w: 'MAQUI', c: 'Baya negra poderosa' },
      { w: 'ARRAYAN', c: 'Árbol de tronco anaranjado y frío' },
      { w: 'QUILLAY', c: 'Árbol de corteza jabonosa' },
      { w: 'ROBLE', c: 'Hualle adulto, rey del bosque' },
      { w: 'HUALLE', c: 'Roble joven' },
      { w: 'COIGUE', c: 'Árbol sureño de madera dura' },
      { w: 'CHANGLE', c: 'Hongo amarillo como coral' },
      { w: 'LOYO', c: 'Hongo de sombrero café-rojizo' },
      { w: 'HONGO', c: 'Fruto del micelio del bosque' },
      { w: 'MUSGO', c: 'Alfombra verde sobre rocas y troncos' },
      { w: 'CHUCAO', c: 'Pájaro que canta en la espesura' },
      { w: 'PICAFLOR', c: 'Ave pequeña que bebe flores' }
    ] },
  { id: 'luna', n: '🌙 Luna & Huerta', d: 'Siembra, cosecha y ritmo lunar.',
    words: [
      { w: 'LUNA', c: 'Küyen: marca el ritmo de siembra' },
      { w: 'SIEMBRA', c: 'Poner semillas en la tierra' },
      { w: 'COSECHA', c: 'Recoger los frutos maduros' },
      { w: 'SEMILLA', c: 'Guarda la vida futura' },
      { w: 'COMPOST', c: 'Tierra viva hecha de restos' },
      { w: 'HUERTA', c: 'Cantero donde crece la comida' },
      { w: 'TOMATE', c: 'Rojo y jugoso de verano' },
      { w: 'LECHUGA', c: 'Hoja verde de ensalada' },
      { w: 'ZAPALLO', c: 'Grande y naranjo de guarda' },
      { w: 'POROTO', c: 'Grano trepador de la cazuela' },
      { w: 'MAIZ', c: 'Choclo dorado' },
      { w: 'PAPA', c: 'Tubérculo base de la olla' },
      { w: 'AJO', c: 'Diente que protege y sazona' },
      { w: 'RIEGO', c: 'Agua que se da a las plantas' },
      { w: 'LLENA', c: 'Fase de luna plena' },
      { w: 'MENGUANTE', c: 'Fase para podar y desmalezar' },
      { w: 'CRECIENTE', c: 'Fase para sembrar lo que da fruto' }
    ] }
];
function temaById(id) {
  for (var i = 0; i < TEMAS.length; i++) if (TEMAS[i].id === id) return TEMAS[i];
  return TEMAS[0];
}
var LUNA_TIPS = [
  { f: '🌑 Luna nueva', t: 'Siembra palabras nuevas: arma 1 crucigrama fácil y aprende 3 pistas sin apuro.' },
  { f: '🌒 Creciente', t: 'La mente despierta: prueba un tema nuevo y usa el teclado con calma.' },
  { f: '🌓 Cuarto creciente', t: 'Mitad del camino: repite el crucigrama de ayer intentando menos pistas.' },
  { f: '🌔 Gibosa', t: 'Profundiza: completa sin revelar, comprobando solo al final.' },
  { f: '🌕 Luna llena', t: '¡A brillar! Reta a alguien al lado a completar el mismo crucigrama.' },
  { f: '🌖 Menguante', t: 'Revisa sin juicio: ¿qué pistas te costaron? Anótalas en tu bitácora.' },
  { f: '🌗 Cuarto menguante', t: 'Juego lento: 1 palabra a la vez, respirando. Paciencia de podador.' },
  { f: '🌘 Casi nueva', t: 'Descansa la mente: lee las pistas como cuentos y duerme bien.' }
];
function lunaFaseAprox() {
  try {
    var now = new Date();
    var syn = 29.530588853;
    var ref = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
    var days = now.getTime() / 86400000 - ref;
    var age = ((days % syn) + syn) % syn;
    var idx = Math.floor(((age + 1.84566) % syn) / syn * 8 + 0.5) % 8;
    return { age: age, idx: idx, ilum: Math.round((1 - Math.cos(2 * Math.PI * age / syn)) / 2 * 100) };
  } catch (e) { return { age: 14, idx: 4, ilum: 50 }; }
}

/* ================= GENERADOR DE CRUCIGRAMAS ================= */
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function emptyGrid(n) {
  var g = [], h = [], v = [], r, c;
  for (r = 0; r < n; r++) {
    g.push([]); h.push([]); v.push([]);
    for (c = 0; c < n; c++) { g[r].push(''); h[r].push(false); v[r].push(false); }
  }
  return { g: g, h: h, v: v };
}
function canPlace(st, word, r, c, dir, needCross) {
  var n = st.g.length, L = word.length, k, rr, cc;
  for (k = 0; k < L; k++) {
    rr = dir === 'V' ? r + k : r;
    cc = dir === 'H' ? c + k : c;
    if (rr < 0 || rr >= n || cc < 0 || cc >= n) return { ok: false };
  }
  // antes y después deben estar vacíos o fuera
  var br = dir === 'H' ? r : r - 1, bc = dir === 'H' ? c - 1 : c;
  if (br >= 0 && br < n && bc >= 0 && bc < n && st.g[br][bc]) return { ok: false };
  var ar = dir === 'H' ? r : r + L, ac = dir === 'H' ? c + L : c;
  if (ar >= 0 && ar < n && ac >= 0 && ac < n && st.g[ar][ac]) return { ok: false };
  var cross = 0;
  for (k = 0; k < L; k++) {
    rr = dir === 'V' ? r + k : r;
    cc = dir === 'H' ? c + k : c;
    var ch = word.charAt(k), cell = st.g[rr][cc];
    if (cell) {
      if (cell !== ch) return { ok: false };
      // cruce válido solo si la celda pertenece a la orientación contraria
      if (dir === 'H' && !st.v[rr][cc]) return { ok: false };
      if (dir === 'V' && !st.h[rr][cc]) return { ok: false };
      cross++;
    } else {
      // vecinos laterales deben estar vacíos (no pegar palabras)
      if (dir === 'H') {
        if (rr - 1 >= 0 && st.g[rr - 1][cc]) return { ok: false };
        if (rr + 1 < n && st.g[rr + 1][cc]) return { ok: false };
      } else {
        if (cc - 1 >= 0 && st.g[rr][cc - 1]) return { ok: false };
        if (cc + 1 < n && st.g[rr][cc + 1]) return { ok: false };
      }
    }
  }
  if (needCross && cross < 1) return { ok: false };
  return { ok: true, cross: cross };
}
function doPlace(st, entry, r, c, dir) {
  var word = entry.w;
  for (var k = 0; k < word.length; k++) {
    var rr = dir === 'V' ? r + k : r;
    var cc = dir === 'H' ? c + k : c;
    st.g[rr][cc] = word.charAt(k);
    if (dir === 'H') st.h[rr][cc] = true; else st.v[rr][cc] = true;
  }
}
function generatePuzzle(temaId) {
  var tema = temaById(temaId);
  var N = 11, MAXW = 9;
  var pool = shuffle(tema.words.slice());
  // palabras largas primero para mejor encaje
  pool.sort(function (a, b) { return b.w.length - a.w.length; });
  pool = shuffle(pool.slice(0, 12));
  var st = emptyGrid(N);
  var placements = [];
  // 1ª palabra al centro horizontal
  var first = null;
  for (var i = 0; i < pool.length; i++) {
    if (pool[i].w.length <= N - 2) { first = pool[i]; pool.splice(i, 1); break; }
  }
  if (!first) first = pool.shift();
  var fr = Math.floor(N / 2), fc = Math.floor((N - first.w.length) / 2);
  doPlace(st, first, fr, fc, 'H');
  placements.push({ w: first.w, c: first.c, r: fr, cc: fc, dir: 'H' });
  var used = {};
  used[first.w] = 1;
  // resto: buscan cruce
  for (var wi = 0; wi < pool.length && placements.length < MAXW; wi++) {
    var e = pool[wi];
    if (used[e.w] || e.w.length > N - 1) continue;
    var best = null;
    // recorre celdas con letra igual y prueba perpendicular
    for (var r = 0; r < N && !best; r++) {
      for (var c = 0; c < N; c++) {
        var cell = st.g[r][c];
        if (!cell) continue;
        for (var k = 0; k < e.w.length; k++) {
          if (e.w.charAt(k) !== cell) continue;
          var dirs = [];
          if (st.h[r][c] && !st.v[r][c]) dirs.push('V');
          else if (st.v[r][c] && !st.h[r][c]) dirs.push('H');
          else continue;
          for (var d = 0; d < dirs.length; d++) {
            var dir = dirs[d];
            var sr = dir === 'V' ? r - k : r;
            var sc = dir === 'H' ? c - k : c;
            var chk = canPlace(st, e.w, sr, sc, dir, true);
            if (chk.ok && (!best || chk.cross > best.cross)) {
              best = { r: sr, c: sc, dir: dir, cross: chk.cross };
              if (chk.cross >= 2) break;
            }
          }
          if (best && best.cross >= 2) break;
        }
        if (best && best.cross >= 2) break;
      }
    }
    if (best) {
      doPlace(st, e, best.r, best.c, best.dir);
      placements.push({ w: e.w, c: e.c, r: best.r, cc: best.c, dir: best.dir });
      used[e.w] = 1;
    }
  }
  // si quedaron muy pocas, reintenta una vez mezclando distinto
  if (placements.length < 4) return generatePuzzleRetry(temaId, 1);
  // recorta al área usada + número de pistas
  numberPlacements(placements);
  return { tema: tema.id, size: N, placements: placements, sol: st.g };
}
function generatePuzzleRetry(temaId, depth) {
  if (depth > 3) {
    // fallback mínimo garantizado: 3 palabras cruzadas fijas
    var st = emptyGrid(11);
    var pls = [
      { w: 'PENCO', c: 'Nuestra comuna junto al mar', r: 5, cc: 3, dir: 'H' },
      { w: 'PESCA', c: 'Sustento artesanal de Lirquén y Penco', r: 5, cc: 3, dir: 'V' },
      { w: 'KO', c: 'Agua en mapuzugun', r: 7, cc: 5, dir: 'H' }
    ];
    pls.forEach(function (p) { doPlace(st, p, p.r, p.cc, p.dir); });
    numberPlacements(pls);
    return { tema: temaId, size: 11, placements: pls, sol: st.g };
  }
  return generatePuzzle(temaId);
}
function numberPlacements(pls) {
  var starts = {};
  pls.forEach(function (p) {
    var k = p.r + ':' + p.cc;
    if (!starts[k]) starts[k] = { r: p.r, c: p.cc };
  });
  var keys = Object.keys(starts).sort(function (a, b) {
    var pa = a.split(':'), pb = b.split(':');
    return (parseInt(pa[0], 10) - parseInt(pb[0], 10)) || (parseInt(pa[1], 10) - parseInt(pb[1], 10));
  });
  var nums = {};
  keys.forEach(function (k, i) { nums[k] = i + 1; });
  pls.forEach(function (p) { p.n = nums[p.r + ':' + p.cc]; });
  pls.sort(function (a, b) { return (a.n - b.n) || (a.dir === 'H' ? -1 : 1); });
}
function whiteCells(puz) {
  var cells = {}, k;
  puz.placements.forEach(function (p) {
    for (var i = 0; i < p.w.length; i++) {
      var r = p.dir === 'V' ? p.r + i : p.r;
      var c = p.dir === 'H' ? p.cc + i : p.cc;
      cells[r + ':' + c] = puz.sol[r][c];
    }
  });
  return cells;
}

/* ================= ESTADO ================= */
var TAB = 'jugar';
var G = null; // {tema,size,placements,sol,fill,selR,selC,dir,hints,seconds,won,conAyuda,timerOn}
var timerInt = null;
var errFlash = null;

function statsDef() { return { jugadas: 0, ganadas: 0, mejor: {}, racha: 0 }; }
function getStats() {
  var s = store('cruciStats', null);
  if (!s || typeof s !== 'object' || !s.mejor) {
    s = statsDef();
    try { var u = userData(); u.cruciStats = s; } catch (e) {}
  }
  return s;
}
function getHistory() { var a = store('cruciHistory', []); return Array.isArray(a) ? a : []; }
function getSaved() { return store('cruciCurrent', null); }
function persistCurrent() {
  try {
    var u = userData();
    if (!G) { u.cruciCurrent = null; }
    else {
      u.cruciCurrent = {
        tema: G.tema, size: G.size, placements: G.placements, sol: G.sol,
        fill: G.fill, selR: G.selR, selC: G.selC, dir: G.dir,
        hints: G.hints, seconds: G.seconds, won: G.won, conAyuda: G.conAyuda
      };
    }
    save();
  } catch (e) {}
}
function fmtTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  var m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' + m : '' + m) + ':' + (r < 10 ? '0' + r : '' + r);
}
function startTimer() {
  stopTimer();
  timerInt = setInterval(function () {
    if (!G || !G.timerOn || G.won) return;
    var dlg = $('cruciDialog');
    if (!dlg || !dlg.open) return;
    G.seconds++;
    var el = $('crTime');
    if (el) el.innerHTML = '⏱️ <b>' + fmtTime(G.seconds) + '</b>';
    if (G.seconds % 15 === 0) persistCurrent();
  }, 1000);
}
function stopTimer() { if (timerInt) { try { clearInterval(timerInt); } catch (e) {} timerInt = null; } }

function newGame(temaId) {
  stopTimer();
  var puz;
  try { puz = generatePuzzle(temaId || (G && G.tema) || 'mar'); }
  catch (e) { puz = generatePuzzleRetry(temaId || 'mar', 9); }
  var fill = [];
  for (var r = 0; r < puz.size; r++) { fill.push([]); for (var c = 0; c < puz.size; c++) fill[r].push(''); }
  // primera celda blanca como selección
  var wc = whiteCells(puz);
  var keys = Object.keys(wc).sort();
  var sr = 5, sc = 3;
  if (keys.length) { var p0 = keys[0].split(':'); sr = parseInt(p0[0], 10); sc = parseInt(p0[1], 10); }
  G = {
    tema: puz.tema, size: puz.size, placements: puz.placements, sol: puz.sol,
    fill: fill, selR: sr, selC: sc, dir: 'H',
    hints: 3, seconds: 0, won: false, conAyuda: false, timerOn: true
  };
  // si la celda inicial no tiene palabra en H, usa V
  if (!activeWord() && wordAt(sr, sc, 'V')) G.dir = 'V';
  try { var st = getStats(); st.jugadas++; var u = userData(); u.cruciStats = st; } catch (e) {}
  persistCurrent();
  startTimer();
  renderAll();
}
function restoreGame(sv) {
  stopTimer();
  G = {
    tema: sv.tema || 'mar', size: sv.size || 11,
    placements: sv.placements || [], sol: sv.sol,
    fill: sv.fill, selR: sv.selR || 0, selC: sv.selC || 0, dir: sv.dir || 'H',
    hints: (sv.hints == null ? 3 : sv.hints),
    seconds: sv.seconds || 0, won: !!sv.won, conAyuda: !!sv.conAyuda,
    timerOn: !sv.won
  };
  if (G.timerOn) startTimer();
  renderAll();
}
function wordAt(r, c, dir) {
  if (!G) return null;
  for (var i = 0; i < G.placements.length; i++) {
    var p = G.placements[i];
    if (p.dir !== dir) continue;
    for (var k = 0; k < p.w.length; k++) {
      var rr = p.dir === 'V' ? p.r + k : p.r;
      var cc = p.dir === 'H' ? p.cc + k : p.cc;
      if (rr === r && cc === c) return p;
    }
  }
  return null;
}
function activeWord() { return G ? wordAt(G.selR, G.selC, G.dir) : null; }
function isWhite(r, c) {
  if (!G) return false;
  return !!(G.sol[r] && G.sol[r][c]);
}
function wordDone(p) {
  for (var k = 0; k < p.w.length; k++) {
    var rr = p.dir === 'V' ? p.r + k : p.r;
    var cc = p.dir === 'H' ? p.cc + k : p.cc;
    if ((G.fill[rr][cc] || '') !== p.w.charAt(k)) return false;
  }
  return true;
}
function progressPct() {
  if (!G) return 0;
  var wc = whiteCells({ placements: G.placements, sol: G.sol });
  var keys = Object.keys(wc), ok = 0;
  keys.forEach(function (k) {
    var rc = k.split(':');
    if ((G.fill[+rc[0]][+rc[1]] || '') === wc[k]) ok++;
  });
  return keys.length ? Math.round(ok / keys.length * 100) : 0;
}

/* ================= RENDER ================= */
function renderAll() {
  renderTemas(); renderTop(); renderBoard(); renderClues(); renderPad(); renderHistPanel();
}
function renderTemas() {
  var box = $('crTemas');
  if (!box || !G) return;
  box.innerHTML = TEMAS.map(function (t) {
    return '<button type="button" class="btn' + (t.id === G.tema ? ' btn-accent' : '') + '" data-tema="' + t.id + '" style="width:auto;font-size:11px" title="' + esc(t.d) + '">' + t.n + '</button>';
  }).join('');
  box.querySelectorAll('[data-tema]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-tema');
      if (G && G.tema === id) return;
      if (G && !G.won && progressPct() > 5) {
        if (!confirm('¿Empezar un crucigrama nuevo de ' + temaById(id).n + '? Se pierde el avance actual.')) return;
      }
      newGame(id);
    };
  });
}
function renderTop() {
  var box = $('crTop');
  if (!box || !G) return;
  var t = temaById(G.tema);
  box.innerHTML =
    '<div class="cr-top">' +
    '<span class="cr-stat" id="crTime">⏱️ <b>' + fmtTime(G.seconds) + '</b></span>' +
    '<span class="cr-stat">💡 Pistas <b>' + G.hints + '</b></span>' +
    '<span class="cr-stat">📊 <b>' + progressPct() + '%</b></span>' +
    '<span class="cr-stat">📝 <b>' + G.placements.length + '</b> palabras</span>' +
    '</div>' +
    '<p class="muted" style="font-size:11px;margin:4px 0">' + esc(t.n) + ' — ' + esc(t.d) + '</p>';
}
function cellNum(r, c) {
  if (!G) return 0;
  for (var i = 0; i < G.placements.length; i++) {
    var p = G.placements[i];
    if (p.r === r && p.cc === c) return p.n;
  }
  return 0;
}
function inActiveWord(r, c) {
  var w = activeWord();
  if (!w) return false;
  for (var k = 0; k < w.w.length; k++) {
    var rr = w.dir === 'V' ? w.r + k : w.r;
    var cc = w.dir === 'H' ? w.cc + k : w.cc;
    if (rr === r && cc === c) return true;
  }
  return false;
}
function renderBoard() {
  var box = $('crBoard');
  if (!box || !G) return;
  var h = '<div class="cr-board" role="grid" aria-label="Crucigrama" style="grid-template-columns:repeat(' + G.size + ',1fr)">';
  for (var r = 0; r < G.size; r++) {
    for (var c = 0; c < G.size; c++) {
      if (!isWhite(r, c)) {
        h += '<span class="cr-cell cr-black" aria-hidden="true"></span>';
        continue;
      }
      var cls = 'cr-cell';
      if (r === G.selR && c === G.selC) cls += ' cr-active';
      else if (inActiveWord(r, c)) cls += ' cr-word';
      var v = G.fill[r][c] || '';
      var bad = errFlash && errFlash[r + ':' + c];
      if (bad) cls += ' cr-err';
      else if (v && v === G.sol[r][c]) cls += ' cr-ok';
      var num = cellNum(r, c);
      h += '<button type="button" class="' + cls + '" data-cr="' + r + ':' + c + '" role="gridcell" aria-label="Fila ' + (r + 1) + ' columna ' + (c + 1) + (v ? ' letra ' + v : ' vacía') + '">' +
        (num ? '<span class="cr-num">' + num + '</span>' : '') + esc(v) + '</button>';
    }
  }
  box.innerHTML = h + '</div>';
  box.querySelectorAll('[data-cr]').forEach(function (el) {
    el.onclick = function () {
      var rc = el.getAttribute('data-cr').split(':');
      pickCell(parseInt(rc[0], 10), parseInt(rc[1], 10));
    };
  });
  var cur = $('crCur');
  if (cur) {
    var w = activeWord();
    if (G.won) cur.innerHTML = '🏆 <b>¡Crucigrama completo!</b> ' + esc(temaById(G.tema).n) + ' en ' + fmtTime(G.seconds) + '.';
    else if (w) cur.innerHTML = '<b>' + w.n + ' ' + (w.dir === 'H' ? '→' : '↓') + '</b> · ' + esc(w.c) + ' <span class="muted">(' + w.w.length + ' letras)</span><br><span class="muted" style="font-size:11px">Toca la celda activa para cambiar de dirección.</span>';
    else cur.textContent = 'Toca una casilla blanca para empezar.';
  }
}
function renderClues() {
  var box = $('crClues');
  if (!box || !G) return;
  var w = activeWord();
  function list(dir, titulo) {
    var items = G.placements.filter(function (p) { return p.dir === dir; });
    var h = '<div class="menstrual-card" style="margin:0"><h4 style="font-size:12px">' + titulo + '</h4><div class="cr-clue-list">';
    if (!items.length) h += '<span class="muted" style="font-size:11px">—</span>';
    items.forEach(function (p) {
      var sel = (w && w.n === p.n && w.dir === p.dir) ? ' sel' : '';
      var done = wordDone(p) ? ' done' : '';
      h += '<button type="button" class="cr-clue' + sel + done + '" data-clue="' + p.n + p.dir + '">' +
        '<b>' + p.n + '.</b> ' + esc(p.c) + ' <span class="muted">(' + p.w.length + ')</span>' + (wordDone(p) ? ' ✅' : '') + '</button>';
    });
    return h + '</div></div>';
  }
  box.innerHTML = '<div class="cr-clues">' + list('H', '➡️ Horizontales') + list('V', '⬇️ Verticales') + '</div>';
  box.querySelectorAll('[data-clue]').forEach(function (el) {
    el.onclick = function () {
      var id = el.getAttribute('data-clue');
      var n = parseInt(id, 10), dir = id.slice(-1);
      for (var i = 0; i < G.placements.length; i++) {
        var p = G.placements[i];
        if (p.n === n && p.dir === dir) {
          G.dir = dir; G.selR = p.r; G.selC = p.cc;
          errFlash = null;
          renderBoard(); renderClues(); renderPad();
          return;
        }
      }
    };
  });
}
var KB = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
function renderPad() {
  var box = $('crPad');
  if (!box || !G) return;
  var h = '<div class="cr-kb" role="group" aria-label="Teclado">';
  KB.forEach(function (L) {
    h += '<button type="button" class="cr-key" data-k="' + L + '">' + L + '</button>';
  });
  box.innerHTML = h + '</div>' +
    '<div class="cr-tools">' +
    '<button type="button" class="btn" id="crBack" style="width:auto;font-size:12px">⌫ Borrar</button>' +
    '<button type="button" class="btn" id="crCheck" style="width:auto;font-size:12px">✅ Comprobar</button>' +
    '<button type="button" class="btn" id="crHint" style="width:auto;font-size:12px">💡 Pista (' + G.hints + ')</button>' +
    '</div>' +
    '<div class="cr-tools">' +
    '<button type="button" class="btn" id="crWord" style="width:auto;font-size:12px">🔎 Revelar palabra</button>' +
    '<button type="button" class="btn" id="crNew" style="width:auto;font-size:12px">🎲 Nuevo</button>' +
    '<button type="button" class="btn" id="crSolve" style="width:auto;font-size:12px" title="Muestra la solución (no cuenta como victoria)">👁️ Ver solución</button>' +
    '</div>';
  box.querySelectorAll('[data-k]').forEach(function (b) {
    b.onclick = function () { enterLetter(b.getAttribute('data-k')); };
  });
  $('crBack').onclick = eraseLetter;
  $('crCheck').onclick = checkBoard;
  $('crHint').onclick = useHint;
  $('crWord').onclick = revealWord;
  $('crNew').onclick = function () { newGame(G.tema); };
  $('crSolve').onclick = function () {
    if (!G || G.won) return;
    if (!confirm('¿Ver la solución? El tablero se completa pero no contará como victoria.')) return;
    for (var r = 0; r < G.size; r++) for (var c = 0; c < G.size; c++) {
      if (isWhite(r, c)) G.fill[r][c] = G.sol[r][c];
    }
    G.won = false; G.conAyuda = true; G.timerOn = false;
    recordResult(false);
    persistCurrent(); renderAll();
  };
}
function renderLuna() {
  var box = $('crLunaBox');
  if (!box) return;
  var f = lunaFaseAprox();
  var tip = LUNA_TIPS[f.idx] || LUNA_TIPS[4];
  box.innerHTML = '<b>🌙 Consejo lunar · iluminación ' + f.ilum + '%</b><br>' +
    '<span style="color:var(--gold)">' + esc(tip.f) + '</span> — ' + esc(tip.t);
}
function renderAprender() {
  var box = $('crLearnBox');
  if (!box) return;
  box.innerHTML =
    '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>📝 ¿Qué es?</h4><p>Un crucigrama es una grilla donde las palabras se cruzan: cada letra compartida une una palabra horizontal con una vertical. Aquí todas las palabras hablan de Penco: el mar, el mapuzugun, el bosque y la luna.</p></div>' +
    '<div class="si-card"><h4>👆 Cómo jugar</h4><p>1) Toca una casilla blanca y lee la pista. 2) Escribe con el teclado en pantalla o el físico. 3) Toca la casilla activa para cambiar entre → horizontal y ↓ vertical. 4) Las letras correctas se ponen verdes; ✅ Comprobar marca errores en rojo.</p></div>' +
    '<div class="si-card"><h4>💡 Estrategia</h4><p>Parte por las palabras cortas y las letras que ya se cruzan. Si te trabas, usa 💡 Pista (revela 1 letra) o 🔎 Revelar palabra. Cada tablero es distinto: 🎲 Nuevo genera otro con el mismo tema.</p></div>' +
    '<div class="si-card"><h4>⌨️ Teclado físico</h4><p>Letras A–Z y Ñ para escribir, Retroceso para borrar, Espacio para cambiar de dirección, flechas para moverte por la grilla.</p></div>';
}
function renderHistPanel() {
  var box = $('crHistBox');
  if (!box) return;
  var st = getStats();
  var hist = getHistory().slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 20);
  var mejor = TEMAS.map(function (t) {
    var m = st.mejor && st.mejor[t.id];
    return '<span class="chip" style="font-size:10px">' + t.n + ': ' + (m ? fmtTime(m) : '—') + '</span>';
  }).join(' ');
  box.innerHTML =
    '<div class="menstrual-card"><h4>📊 Mis números</h4>' +
    '<p class="muted" style="font-size:12px">' + st.ganadas + ' completados de ' + st.jugadas + ' jugados · racha actual: ' + (st.racha || 0) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="muted" style="font-size:11px">⏱️ Mejor tiempo:</span>' + mejor + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Últimos crucigramas</h4>' +
    (hist.length ? '<div class="habits-list" style="margin-top:6px">' + hist.map(function (r) {
      return '<div class="habit-item" style="font-size:12px">' + (r.won ? '🏆' : '👁️') + ' <b>' + esc(temaById(r.tema).n) + '</b> · ' + (r.palabras || 0) + ' palabras · ' + fmtTime(r.seconds) + ' · ' + esc(r.fecha || '') + '</div>';
    }).join('') + '</div>' : '<p class="muted" style="font-size:12px">Aún sin crucigramas terminados. ¡Completa el primero!</p>') +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" class="btn" id="crHistShare" style="width:auto;font-size:11px">📤 Compartir</button>' +
    '<button type="button" class="btn" id="crHistClear" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></div></div>';
  var sh = $('crHistShare');
  if (sh) sh.onclick = function () {
    if (!hist.length) return alert('Sin partidas aún');
    share('📝 Mi Crucigrama', hist.slice(0, 10).map(function (r) {
      return (r.won ? '🏆' : '👁️') + ' ' + temaById(r.tema).n + ' · ' + (r.palabras || 0) + ' palabras · ' + fmtTime(r.seconds) + ' · ' + (r.fecha || '');
    }).join('\n'));
  };
  var cl = $('crHistClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar historial y estadísticas del Crucigrama?')) return;
    try { var u = userData(); u.cruciHistory = []; u.cruciStats = statsDef(); } catch (e) {}
    save('Historial borrado'); renderHistPanel();
  };
}

/* ================= JUGADAS ================= */
function pickCell(r, c) {
  if (!G || G.won || !isWhite(r, c)) return;
  if (G.selR === r && G.selC === c) {
    // toggle dirección si hay palabra en la otra
    var other = G.dir === 'H' ? 'V' : 'H';
    if (wordAt(r, c, other)) G.dir = other;
  } else {
    G.selR = r; G.selC = c;
    if (!wordAt(r, c, G.dir)) {
      var other2 = G.dir === 'H' ? 'V' : 'H';
      if (wordAt(r, c, other2)) G.dir = other2;
    }
  }
  errFlash = null;
  renderBoard(); renderClues();
}
function moveSel(dr, dc) {
  if (!G) return;
  var r = G.selR + dr, c = G.selC + dc, guard = 0;
  while (guard++ < G.size * 2) {
    if (r < 0) r = G.size - 1; if (r >= G.size) r = 0;
    if (c < 0) c = G.size - 1; if (c >= G.size) c = 0;
    if (isWhite(r, c)) { G.selR = r; G.selC = c; return; }
    r += dr; c += dc;
  }
}
function stepAlong(dir) {
  if (!G) return;
  var w = activeWord();
  if (!w) return;
  // avanza a la siguiente celda de la palabra activa
  var idx = w.dir === 'H' ? (G.selC - w.cc) : (G.selR - w.r);
  var nxt = idx + 1;
  if (nxt < w.w.length) {
    if (w.dir === 'H') G.selC = w.cc + nxt; else G.selR = w.r + nxt;
  } else {
    // busca la primera vacía de la palabra
    for (var k = 0; k < w.w.length; k++) {
      var rr = w.dir === 'V' ? w.r + k : w.r;
      var cc = w.dir === 'H' ? w.cc + k : w.cc;
      if (!G.fill[rr][cc]) { G.selR = rr; G.selC = cc; return; }
    }
  }
}
function enterLetter(L) {
  if (!G || G.won || !isWhite(G.selR, G.selC)) return;
  G.fill[G.selR][G.selC] = L;
  errFlash = null;
  stepAlong();
  renderBoard(); renderClues(); renderTop(); persistCurrent(); checkWin();
}
function eraseLetter() {
  if (!G || G.won || !isWhite(G.selR, G.selC)) return;
  if (!G.fill[G.selR][G.selC]) {
    // retrocede una celda dentro de la palabra
    var w = activeWord();
    if (w) {
      var idx = w.dir === 'H' ? (G.selC - w.cc) : (G.selR - w.r);
      if (idx > 0) {
        if (w.dir === 'H') G.selC = w.cc + idx - 1; else G.selR = w.r + idx - 1;
      }
    }
  }
  G.fill[G.selR][G.selC] = '';
  errFlash = null;
  renderBoard(); renderClues(); renderTop(); persistCurrent();
}
function checkBoard() {
  if (!G || G.won) return;
  var bad = {};
  var wc = whiteCells({ placements: G.placements, sol: G.sol });
  Object.keys(wc).forEach(function (k) {
    var rc = k.split(':');
    var v = G.fill[+rc[0]][+rc[1]] || '';
    if (v && v !== wc[k]) bad[k] = 1;
  });
  errFlash = bad;
  var n = Object.keys(bad).length;
  renderBoard();
  if (!n) {
    var allFilled = Object.keys(wc).every(function (k) {
      var rc = k.split(':');
      return !!G.fill[+rc[0]][+rc[1]];
    });
    if (allFilled) checkWin();
    else save('Sin errores por ahora ✓');
  } else {
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
  }
  setTimeout(function () { errFlash = null; if (G && !G.won) renderBoard(); }, 1400);
}
function useHint() {
  if (!G || G.won) return;
  if (G.hints <= 0) { alert('Sin pistas. Genera un tablero nuevo para recuperarlas.'); return; }
  var w = activeWord();
  var cands = [];
  function pushCell(r, c) {
    if (isWhite(r, c) && (G.fill[r][c] || '') !== G.sol[r][c]) cands.push([r, c]);
  }
  if (w) {
    for (var k = 0; k < w.w.length; k++) pushCell(w.dir === 'V' ? w.r + k : w.r, w.dir === 'H' ? w.cc + k : w.cc);
  }
  if (!cands.length) {
    var wc = whiteCells({ placements: G.placements, sol: G.sol });
    Object.keys(wc).forEach(function (key) {
      var rc = key.split(':');
      if ((G.fill[+rc[0]][+rc[1]] || '') !== wc[key]) cands.push([+rc[0], +rc[1]]);
    });
  }
  if (!cands.length) return;
  var pick = cands[Math.floor(Math.random() * cands.length)];
  G.fill[pick[0]][pick[1]] = G.sol[pick[0]][pick[1]];
  G.selR = pick[0]; G.selC = pick[1];
  G.hints--; G.conAyuda = true;
  renderAll(); persistCurrent(); checkWin();
}
function revealWord() {
  if (!G || G.won) return;
  var w = activeWord();
  if (!w) return;
  if (!confirm('¿Revelar la palabra "' + w.n + ' ' + (w.dir === 'H' ? '→' : '↓') + '"? Contará como ayuda.')) return;
  for (var k = 0; k < w.w.length; k++) {
    var rr = w.dir === 'V' ? w.r + k : w.r;
    var cc = w.dir === 'H' ? w.cc + k : w.cc;
    G.fill[rr][cc] = w.w.charAt(k);
  }
  G.conAyuda = true;
  renderAll(); persistCurrent(); checkWin();
}
function checkWin() {
  if (!G || G.won) return;
  for (var i = 0; i < G.placements.length; i++) {
    if (!wordDone(G.placements[i])) return;
  }
  G.won = true; G.timerOn = false;
  recordResult(true);
  persistCurrent(); renderAll();
  save('¡Crucigrama completo! 🏆');
  try { if (navigator.vibrate) navigator.vibrate([80, 40, 80]); } catch (e) {}
}
function recordResult(won) {
  try {
    var st = getStats();
    if (won) {
      st.ganadas++;
      st.racha = (st.racha || 0) + 1;
      if (!st.mejor) st.mejor = {};
      if (!st.mejor[G.tema] || G.seconds < st.mejor[G.tema]) st.mejor[G.tema] = G.seconds;
    } else {
      st.racha = 0;
    }
    var u = userData();
    u.cruciStats = st;
    var h = getHistory();
    var d = new Date();
    var fecha = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    h.push({ ts: Date.now(), fecha: fecha, tema: G.tema, palabras: G.placements.length, seconds: G.seconds, won: won });
    u.cruciHistory = h.slice(-100);
    save();
  } catch (e) {}
}

/* ================= TABS + DIALOG ================= */
function switchTab(t) {
  TAB = t;
  ['jugar', 'aprender', 'registros'].forEach(function (k) {
    var b = $('tabCr' + k.charAt(0).toUpperCase() + k.slice(1));
    if (b) b.classList.toggle('btn-accent', k === t);
    var p = $('crPanel' + k.charAt(0).toUpperCase() + k.slice(1));
    if (p) p.classList.toggle('hidden', k !== t);
  });
  if (t === 'jugar') renderAll();
  if (t === 'aprender') renderAprender();
  if (t === 'registros') renderHistPanel();
}
function buildDialog() {
  injectCSS();
  var old = $('cruciDialog');
  if (old) return old;
  var d = document.createElement('dialog');
  d.id = 'cruciDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">📝 Crucigrama</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Palabras cruzadas de Penco: mar, mapuzugun, bosque y luna. Cada tablero es distinto. Todo queda <b>privado y local</b> en tu usuario.</p>' +
    '<div id="crLunaBox" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabCrJugar" class="btn btn-accent" style="width:auto">📝 Jugar</button>' +
    '<button type="button" id="tabCrAprender" class="btn" style="width:auto">📚 Aprender</button>' +
    '<button type="button" id="tabCrRegistros" class="btn" style="width:auto">🏆 Mis registros</button>' +
    '</div>' +
    '<div id="crPanelJugar"><div class="cr-wrap"><div id="crTemas" class="cr-temas"></div><div id="crTop"></div><div id="crBoard"></div>' +
    '<div id="crCur" class="chip cr-cur" style="display:block;white-space:normal"></div>' +
    '<div id="crClues"></div>' +
    '<div id="crPad"></div></div></div>' +
    '<div id="crPanelAprender" class="hidden"><div id="crLearnBox" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="crPanelRegistros" class="hidden"><div id="crHistBox"></div></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  d.style.width = '680px';
  d.style.maxWidth = '96vw';
  d.style.maxHeight = '88vh';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) {
    b.onclick = function () {
      persistCurrent();
      try { d.close(); } catch (e) {}
    };
  });
  $('tabCrJugar').onclick = function () { switchTab('jugar'); };
  $('tabCrAprender').onclick = function () { switchTab('aprender'); };
  $('tabCrRegistros').onclick = function () { switchTab('registros'); };
  d.addEventListener('keydown', function (ev) {
    if (!G || TAB !== 'jugar' || G.won) return;
    if (ev.key === 'Backspace') { eraseLetter(); ev.preventDefault(); }
    else if (ev.key === ' ' || ev.key === 'Spacebar') {
      var w = activeWord();
      if (w) {
        var other = G.dir === 'H' ? 'V' : 'H';
        if (wordAt(G.selR, G.selC, other)) { G.dir = other; renderBoard(); renderClues(); }
      }
      ev.preventDefault();
    }
    else if (ev.key.indexOf('Arrow') === 0) {
      if (ev.key === 'ArrowUp') moveSel(-1, 0);
      else if (ev.key === 'ArrowDown') moveSel(1, 0);
      else if (ev.key === 'ArrowLeft') moveSel(0, -1);
      else if (ev.key === 'ArrowRight') moveSel(0, 1);
      renderBoard(); renderClues();
      ev.preventDefault();
    }
    else if (/^[a-zA-ZñÑ]$/.test(ev.key)) { enterLetter(ev.key.toUpperCase()); ev.preventDefault(); }
  });
  return d;
}
function openCruci() {
  var d = buildDialog();
  renderLuna();
  renderAprender();
  if (!G) {
    var sv = getSaved();
    if (sv && sv.sol && sv.placements && sv.placements.length) {
      try { restoreGame(sv); } catch (e) { newGame('mar'); }
    } else newGame('mar');
  } else {
    if (!G.won && !timerInt) startTimer();
    renderAll();
  }
  switchTab(TAB || 'jugar');
  try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
}

/* ================= SETUP ================= */
function injectButton() {
  var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
  if (!g) g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
  if (!g) return;
  if ($('btnCrucigrama')) {
    try {
      var cur = $('btnCrucigrama');
      if (cur.parentNode !== g) g.appendChild(cur);
      try { cur.setAttribute('data-sub', 'juegos'); } catch (eS) {}
      if (typeof reordenarAcciones === 'function') reordenarAcciones();
    } catch (eM) {}
    return;
  }
  var btn = document.createElement('button');
  btn.id = 'btnCrucigrama'; btn.className = 'btn'; btn.type = 'button';
  btn.textContent = '📝 Crucigrama';
  try { btn.setAttribute('data-sub', 'juegos'); } catch (eS) {}
  btn.setAttribute('data-keywords', 'crucigrama palabras crossword letras definicion pistas juego mente vocabulario mapuzugun mar bosque luna pasatiempo');
  g.appendChild(btn);
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnCrucigrama') < 0) ALL_BTNS.push('btnCrucigrama');
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
}
function injectConfig() {
  var groups = document.querySelectorAll('#configDialog .config-group h5');
  for (var i = 0; i < groups.length; i++) {
    if (/Aprender/.test(groups[i].textContent) && !groups[i].parentNode.querySelector('[data-btn="btnCrucigrama"]')) {
      var lab = document.createElement('label');
      lab.className = 'check-row';
      lab.innerHTML = '<input type="checkbox" data-btn="btnCrucigrama" checked> 📝 Crucigrama';
      groups[i].parentNode.appendChild(lab);
      break;
    }
  }
}
var _retry = 0;
function setup() {
  injectCSS();
  injectButton();
  injectConfig();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf && ALL_BTNS.indexOf('btnCrucigrama') < 0) ALL_BTNS.push('btnCrucigrama');
  } catch (e) {}
  var b = $('btnCrucigrama');
  if (!b) {
    if (_retry++ < 60) setTimeout(setup, 500);
    return;
  }
  if (!b.dataset.crw) {
    b.dataset.crw = '1';
    b.addEventListener('click', openCruci);
  }
}

window.Crucigrama = {
  open: openCruci, newGame: newGame,
  generate: generatePuzzle, temas: TEMAS
};
setTimeout(setup, 600);

})();
