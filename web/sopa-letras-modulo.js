/* ============================================================
   SOPA DE LETRAS — Calendario 13 Lunas (Penco · Bio-Bio)
   Sección completa en Aprender > Juegos (btnSopa):
   - Jugar: sopas temáticas de Penco (Mar, Mapuzugun,
     Bosque Nativo, Luna & Huerta) de 12x12 con 10
     palabras en 8 direcciones, selección toca-toca
     (ideal en celular) con temporizador, pistas,
     progreso y guardado automático de la partida.
   - Aprender: qué es + cómo jugar + tips de búsqueda.
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
  if ($('sopaStyles')) return;
  var st = document.createElement('style');
  st.id = 'sopaStyles';
  st.textContent = [
    '.sp-wrap{max-width:520px;margin:0 auto}',
    '.sp-temas{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}',
    '.sp-top{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px}',
    '.sp-stat{font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:4px 9px;color:var(--text)}',
    '.sp-stat b{color:var(--gold)}',
    '.sp-board{display:grid;gap:2px;justify-content:center;touch-action:manipulation;user-select:none;-webkit-user-select:none}',
    '.sp-cell{aspect-ratio:1;border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:6px;font-weight:800;font-size:clamp(12px,3.2vw,17px);cursor:pointer;display:flex;align-items:center;justify-content:center;min-width:0;padding:0}',
    '.sp-cell.sp-anchor{background:rgba(232,197,106,.5)!important;outline:2px solid var(--gold);outline-offset:-2px}',
    '.sp-cell.sp-trail{background:rgba(232,197,106,.28)}',
    '.sp-cell.sp-found{background:rgba(143,214,148,.4)!important;border-color:#8fd694;color:var(--text)}',
    '.sp-cell.sp-hintflash{animation:spflash 1s ease 2}',
    '@keyframes spflash{0%,100%{background:var(--card)}50%{background:rgba(143,214,148,.6)}}',
    '.sp-words{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '.sp-word{font-size:12px;font-weight:700;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:5px 10px;cursor:default}',
    '.sp-word small{color:var(--muted);font-weight:400}',
    '.sp-word.done{background:rgba(143,214,148,.22);border-color:#8fd694;text-decoration:line-through;opacity:.85}',
    '.sp-word.hint{border-color:var(--gold)}',
    '.sp-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
    '.sp-msg{font-size:12px;line-height:1.5;margin-top:8px}'
  ].join('\n');
  document.head.appendChild(st);
}

/* ================= DATOS ================= */
var TEMAS = [
  { id: 'mar', n: '🌊 Mar de Penco', d: 'Mareas, pesca y costa del Golfo de Arauco.',
    words: ['MAREA', 'PESCA', 'LIRQUEN', 'PENCO', 'PLAYA', 'BOTE', 'RED', 'ANCLA', 'CORVINA', 'ROBALO', 'LUCHE', 'LAPA', 'JAIBA', 'PLEAMAR', 'BAJAMAR', 'GOLFO'],
    hints: { MAREA: 'Sube y baja del mar', PESCA: 'Sustento de caletas', LIRQUEN: 'Caleta vecina', PENCO: 'Nuestra comuna', PLAYA: 'Arena y olas', BOTE: 'Barco pequeño', RED: 'Para pescar', ANCLA: 'Frena el bote', CORVINA: 'Pez del Golfo', ROBALO: 'Pez de orilla', LUCHE: 'Alga de invierno', LAPA: 'Molusco de roca', JAIBA: 'Cangrejo', PLEAMAR: 'Marea alta', BAJAMAR: 'Marea baja', GOLFO: 'Brazo de mar' } },
  { id: 'mapu', n: '🗣️ Kimün Mapuzugun', d: 'Palabras de la lengua mapuche.',
    words: ['KUYEN', 'ANTU', 'KO', 'MAPU', 'KIMUN', 'EPEW', 'RUKA', 'LAWEN', 'MACHI', 'LONKO', 'PUKEM', 'PEWU', 'WALUNG', 'RIMU', 'WERKEN'],
    hints: { KUYEN: 'Luna', ANTU: 'Sol', KO: 'Agua', MAPU: 'Tierra', KIMUN: 'Saber', EPEW: 'Cuento', RUKA: 'Casa', LAWEN: 'Remedio', MACHI: 'Sanadora', LONKO: 'Autoridad', PUKEM: 'Invierno', PEWU: 'Primavera', WALUNG: 'Verano', RIMU: 'Otoño', WERKEN: 'Mensajero' } },
  { id: 'bosque', n: '🌳 Bosque Nativo', d: 'Árboles, hongos y aves de Penco.',
    words: ['CANELO', 'BOLDO', 'PEUMO', 'MAQUI', 'ARRAYAN', 'QUILLAY', 'ROBLE', 'HUALLE', 'COIGUE', 'CHANGLE', 'LOYO', 'HONGO', 'MUSGO', 'CHUCAO', 'PICAFLOR'],
    hints: { CANELO: 'Árbol sagrado', BOLDO: 'Hoja digestiva', PEUMO: 'Fruto rojo', MAQUI: 'Baya negra', ARRAYAN: 'Tronco frío', QUILLAY: 'Corteza jabón', ROBLE: 'Rey del bosque', HUALLE: 'Roble joven', COIGUE: 'Madera dura', CHANGLE: 'Hongo coral', LOYO: 'Hongo café', HONGO: 'Fruto del micelio', MUSGO: 'Alfombra verde', CHUCAO: 'Canta en espesura', PICAFLOR: 'Bebe flores' } },
  { id: 'luna', n: '🌙 Luna & Huerta', d: 'Siembra, cosecha y ritmo lunar.',
    words: ['LUNA', 'SIEMBRA', 'COSECHA', 'SEMILLA', 'COMPOST', 'HUERTA', 'TOMATE', 'LECHUGA', 'ZAPALLO', 'POROTO', 'MAIZ', 'PAPA', 'AJO', 'RIEGO', 'LLENA', 'MENGUANTE', 'CRECIENTE'],
    hints: { LUNA: 'Küyen', SIEMBRA: 'Poner semillas', COSECHA: 'Recoger frutos', SEMILLA: 'Vida futura', COMPOST: 'Tierra viva', HUERTA: 'Cantero', TOMATE: 'Rojo de verano', LECHUGA: 'Hoja verde', ZAPALLO: 'De guarda', POROTO: 'Grano trepador', MAIZ: 'Choclo', PAPA: 'Tubérculo', AJO: 'Diente protector', RIEGO: 'Dar agua', LLENA: 'Luna plena', MENGUANTE: 'Para podar', CRECIENTE: 'Para sembrar fruto' } }
];
function temaById(id) {
  for (var i = 0; i < TEMAS.length; i++) if (TEMAS[i].id === id) return TEMAS[i];
  return TEMAS[0];
}
var LUNA_TIPS = [
  { f: '🌑 Luna nueva', t: 'Siembra la vista: busca 1 palabra lenta, de izquierda a derecha.' },
  { f: '🌒 Creciente', t: 'La energía sube: prueba diagonales, donde se esconden las difíciles.' },
  { f: '🌓 Cuarto creciente', t: 'Mitad del camino: busca al revés, de derecha a izquierda.' },
  { f: '🌔 Gibosa', t: 'Profundiza: barre por columnas, de arriba hacia abajo.' },
  { f: '🌕 Luna llena', t: '¡A brillar! Compite con alguien al lado a ver quién ve más primero.' },
  { f: '🌖 Menguante', t: 'Revisa sin apuro: las que quedan suelen estar en diagonal.' },
  { f: '🌗 Cuarto menguante', t: 'Juego lento: una palabra a la vez, respirando entre cada hallazgo.' },
  { f: '🌘 Casi nueva', t: 'Descansa la vista: mira el mar de letras sin buscar, las palabras saltan solas.' }
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

/* ================= GENERADOR ================= */
var DIRS = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1]
];
var ABC = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function generateGrid(temaId, nWords) {
  var tema = temaById(temaId);
  var N = 12, NW = nWords || 10;
  var pool = shuffle(tema.words.slice());
  pool.sort(function (a, b) { return b.length - a.length; });
  pool = shuffle(pool.slice(0, Math.min(pool.length, NW + 3))).slice(0, NW);
  var grid = [], r, c;
  for (r = 0; r < N; r++) { grid.push([]); for (c = 0; c < N; c++) grid[r].push(''); }
  var placed = [];
  pool.forEach(function (w) {
    var dirs = shuffle(DIRS.slice());
    var ok = false;
    for (var t = 0; t < 220 && !ok; t++) {
      var d = dirs[t % dirs.length];
      var dr = d[0], dc = d[1];
      var r0 = Math.floor(Math.random() * N), c0 = Math.floor(Math.random() * N);
      var r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1);
      if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
      var good = true;
      for (var k = 0; k < w.length; k++) {
        var rr = r0 + dr * k, cc = c0 + dc * k;
        if (grid[rr][cc] && grid[rr][cc] !== w.charAt(k)) { good = false; break; }
      }
      if (!good) continue;
      for (var k2 = 0; k2 < w.length; k2++) {
        grid[r0 + dr * k2][c0 + dc * k2] = w.charAt(k2);
      }
      placed.push({ w: w, r0: r0, c0: c0, dr: dr, dc: dc });
      ok = true;
    }
  });
  // relleno aleatorio
  for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
    if (!grid[r][c]) grid[r][c] = ABC.charAt(Math.floor(Math.random() * ABC.length));
  }
  return { tema: tema.id, size: N, grid: grid, placed: placed };
}

/* ================= ESTADO ================= */
var TAB = 'jugar';
var G = null; // {tema,size,grid,words:[{w,found,hint,r0,c0,dr,dc}],anchor,seconds,hintsLeft,won,timerOn,conAyuda}
var timerInt = null;

function statsDef() { return { jugadas: 0, ganadas: 0, mejor: {}, racha: 0 }; }
function getStats() {
  var s = store('sopaStats', null);
  if (!s || typeof s !== 'object' || !s.mejor) {
    s = statsDef();
    try { var u = userData(); u.sopaStats = s; } catch (e) {}
  }
  return s;
}
function getHistory() { var a = store('sopaHistory', []); return Array.isArray(a) ? a : []; }
function getSaved() { return store('sopaCurrent', null); }
function persistCurrent() {
  try {
    var u = userData();
    if (!G) { u.sopaCurrent = null; }
    else {
      u.sopaCurrent = {
        tema: G.tema, size: G.size, grid: G.grid,
        words: G.words, anchor: G.anchor,
        seconds: G.seconds, hintsLeft: G.hintsLeft, won: G.won, conAyuda: G.conAyuda
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
    var dlg = $('sopaDialog');
    if (!dlg || !dlg.open) return;
    G.seconds++;
    var el = $('spTime');
    if (el) el.innerHTML = '⏱️ <b>' + fmtTime(G.seconds) + '</b>';
    if (G.seconds % 15 === 0) persistCurrent();
  }, 1000);
}
function stopTimer() { if (timerInt) { try { clearInterval(timerInt); } catch (e) {} timerInt = null; } }

function newGame(temaId) {
  stopTimer();
  var gen;
  try { gen = generateGrid(temaId || (G && G.tema) || 'mar', 10); }
  catch (e) { gen = generateGrid('mar', 10); }
  G = {
    tema: gen.tema, size: gen.size, grid: gen.grid,
    words: gen.placed.map(function (p) { return { w: p.w, found: false, hint: false, r0: p.r0, c0: p.c0, dr: p.dr, dc: p.dc }; }),
    anchor: null, seconds: 0, hintsLeft: 3, won: false, timerOn: true, conAyuda: false
  };
  try { var st = getStats(); st.jugadas++; var u = userData(); u.sopaStats = st; } catch (e) {}
  persistCurrent();
  startTimer();
  renderAll();
}
function restoreGame(sv) {
  stopTimer();
  G = {
    tema: sv.tema || 'mar', size: sv.size || 12, grid: sv.grid,
    words: sv.words || [], anchor: null,
    seconds: sv.seconds || 0, hintsLeft: (sv.hintsLeft == null ? 3 : sv.hintsLeft),
    won: !!sv.won, conAyuda: !!sv.conAyuda, timerOn: !sv.won
  };
  if (G.timerOn) startTimer();
  renderAll();
}
function foundCount() {
  if (!G) return 0;
  return G.words.filter(function (w) { return w.found; }).length;
}
function cellsOf(w) {
  var out = [];
  for (var k = 0; k < w.w.length; k++) out.push([w.r0 + w.dr * k, w.c0 + w.dc * k]);
  return out;
}
function foundCells() {
  var map = {};
  G.words.forEach(function (w) {
    if (!w.found) return;
    cellsOf(w).forEach(function (rc) { map[rc[0] + ':' + rc[1]] = 1; });
  });
  return map;
}
// celdas entre anchor y (r,c) si forman línea recta válida (8 dirs)
function lineCells(r0, c0, r1, c1) {
  var dr = r1 - r0, dc = c1 - c0;
  if (!dr && !dc) return [[r0, c0]];
  var sdr = dr === 0 ? 0 : (dr > 0 ? 1 : -1);
  var sdc = dc === 0 ? 0 : (dc > 0 ? 1 : -1);
  if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
  var len = Math.max(Math.abs(dr), Math.abs(dc));
  var out = [];
  for (var k = 0; k <= len; k++) out.push([r0 + sdr * k, c0 + sdc * k]);
  return out;
}
function lineWord(cells) {
  return cells.map(function (rc) { return G.grid[rc[0]][rc[1]]; }).join('');
}
function rev(s) { return s.split('').reverse().join(''); }

/* ================= RENDER ================= */
function renderAll() {
  renderTemas(); renderTop(); renderBoard(); renderWords(); renderHistPanel();
}
function renderTemas() {
  var box = $('spTemas');
  if (!box || !G) return;
  box.innerHTML = TEMAS.map(function (t) {
    return '<button type="button" class="btn' + (t.id === G.tema ? ' btn-accent' : '') + '" data-tema="' + t.id + '" style="width:auto;font-size:11px" title="' + esc(t.d) + '">' + t.n + '</button>';
  }).join('');
  box.querySelectorAll('[data-tema]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-tema');
      if (G && G.tema === id) return;
      if (G && !G.won && foundCount() > 0 && foundCount() < G.words.length) {
        if (!confirm('¿Empezar una sopa nueva de ' + temaById(id).n + '? Se pierde el avance actual.')) return;
      }
      newGame(id);
    };
  });
}
function renderTop() {
  var box = $('spTop');
  if (!box || !G) return;
  var t = temaById(G.tema);
  box.innerHTML =
    '<div class="sp-top">' +
    '<span class="sp-stat" id="spTime">⏱️ <b>' + fmtTime(G.seconds) + '</b></span>' +
    '<span class="sp-stat">🔎 <b>' + foundCount() + '/' + G.words.length + '</b></span>' +
    '<span class="sp-stat">💡 Pistas <b>' + G.hintsLeft + '</b></span>' +
    '</div>' +
    '<p class="muted" style="font-size:11px;margin:4px 0">' + esc(t.n) + ' — ' + esc(t.d) + '</p>';
}
function renderBoard() {
  var box = $('spBoard');
  if (!box || !G) return;
  var fc = foundCells();
  var trail = {};
  if (G.anchor && G.hover) {
    var lc = lineCells(G.anchor[0], G.anchor[1], G.hover[0], G.hover[1]);
    if (lc) lc.forEach(function (rc) { trail[rc[0] + ':' + rc[1]] = 1; });
  }
  var h = '<div class="sp-board" role="grid" aria-label="Sopa de letras" style="grid-template-columns:repeat(' + G.size + ',1fr)">';
  for (var r = 0; r < G.size; r++) {
    for (var c = 0; c < G.size; c++) {
      var k = r + ':' + c;
      var cls = 'sp-cell';
      if (fc[k]) cls += ' sp-found';
      else if (G.anchor && G.anchor[0] === r && G.anchor[1] === c) cls += ' sp-anchor';
      else if (trail[k]) cls += ' sp-trail';
      h += '<button type="button" class="' + cls + '" data-sp="' + k + '" role="gridcell" aria-label="Fila ' + (r + 1) + ' columna ' + (c + 1) + ' letra ' + G.grid[r][c] + '">' + G.grid[r][c] + '</button>';
    }
  }
  box.innerHTML = h + '</div>';
  box.querySelectorAll('[data-sp]').forEach(function (el) {
    el.onclick = function () {
      var rc = el.getAttribute('data-sp').split(':');
      tapCell(parseInt(rc[0], 10), parseInt(rc[1], 10));
    };
    el.onmouseenter = function () {
      if (!G || !G.anchor || G.won) return;
      var rc = el.getAttribute('data-sp').split(':');
      G.hover = [parseInt(rc[0], 10), parseInt(rc[1], 10)];
      paintTrail();
    };
  });
  var msg = $('spMsg');
  if (msg) {
    if (G.won) msg.innerHTML = '🏆 <b>¡Sopa completa!</b> ' + esc(temaById(G.tema).n) + ' en ' + fmtTime(G.seconds) + '.';
    else if (G.anchor) msg.innerHTML = '👆 Inicio marcado en fila ' + (G.anchor[0] + 1) + ', columna ' + (G.anchor[1] + 1) + ' (<b>' + G.grid[G.anchor[0]][G.anchor[1]] + '</b>). Toca la <b>última letra</b> de la palabra. Toca el inicio de nuevo para cancelar.';
    else msg.innerHTML = '👆 Toca la <b>primera letra</b> de una palabra y luego su <b>última letra</b> (vale en 8 direcciones, también al revés).';
  }
}
function paintTrail() {
  // repintado liviano del rastro sin reconstruir listeners
  var box = $('spBoard');
  if (!box || !G) return;
  var fc = foundCells();
  var trail = {};
  if (G.anchor && G.hover) {
    var lc = lineCells(G.anchor[0], G.anchor[1], G.hover[0], G.hover[1]);
    if (lc) lc.forEach(function (rc) { trail[rc[0] + ':' + rc[1]] = 1; });
  }
  box.querySelectorAll('[data-sp]').forEach(function (el) {
    var k = el.getAttribute('data-sp');
    el.classList.toggle('sp-trail', !!trail[k] && !fc[k]);
  });
}
function renderWords() {
  var box = $('spWords');
  if (!box || !G) return;
  var tema = temaById(G.tema);
  var h = '<div class="sp-words">';
  G.words.forEach(function (w) {
    var pista = tema.hints && tema.hints[w.w] ? ' <small>· ' + esc(tema.hints[w.w]) + '</small>' : '';
    h += '<span class="sp-word' + (w.found ? ' done' : '') + (w.hint && !w.found ? ' hint' : '') + '">' +
      (w.found ? '✅ ' : (w.hint ? '💡 ' : '')) + w.w + pista + '</span>';
  });
  box.innerHTML = h + '</div>' +
    '<div class="sp-tools">' +
    '<button type="button" class="btn" id="spHint" style="width:auto;font-size:12px">💡 Pista (' + G.hintsLeft + ')</button>' +
    '<button type="button" class="btn" id="spCancel" style="width:auto;font-size:12px">✖️ Cancelar marca</button>' +
    '<button type="button" class="btn" id="spNew" style="width:auto;font-size:12px">🎲 Nueva sopa</button>' +
    '<button type="button" class="btn" id="spSolve" style="width:auto;font-size:12px" title="Muestra todas (no cuenta como victoria)">👁️ Ver todas</button>' +
    '</div>';
  $('spHint').onclick = useHint;
  $('spCancel').onclick = function () { G.anchor = null; G.hover = null; renderBoard(); persistCurrent(); };
  $('spNew').onclick = function () { newGame(G.tema); };
  $('spSolve').onclick = function () {
    if (!G || G.won) return;
    if (!confirm('¿Mostrar todas las palabras? No contará como victoria.')) return;
    G.words.forEach(function (w) { w.found = true; });
    G.anchor = null; G.hover = null; G.timerOn = false; G.conAyuda = true;
    recordResult(false);
    persistCurrent(); renderAll();
  };
}
function renderLuna() {
  var box = $('spLunaBox');
  if (!box) return;
  var f = lunaFaseAprox();
  var tip = LUNA_TIPS[f.idx] || LUNA_TIPS[4];
  box.innerHTML = '<b>🌙 Consejo lunar · iluminación ' + f.ilum + '%</b><br>' +
    '<span style="color:var(--gold)">' + esc(tip.f) + '</span> — ' + esc(tip.t);
}
function renderAprender() {
  var box = $('spLearnBox');
  if (!box) return;
  box.innerHTML =
    '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>🔎 ¿Qué es?</h4><p>Una sopa de letras esconde palabras entre letras revueltas. Aquí se esconden 10 palabras de Penco en una grilla de 12×12, en 8 direcciones: horizontal, vertical y diagonal, al derecho y al revés.</p></div>' +
    '<div class="si-card"><h4>👆 Cómo jugar</h4><p>1) Toca la primera letra de la palabra. 2) Toca la última letra en línea recta. Si es correcta, se pinta verde y se tacha de la lista. Cada palabra trae una <b>pista</b> al lado para ayudarte. Toca el inicio de nuevo para cancelar la marca.</p></div>' +
    '<div class="si-card"><h4>💡 Estrategia</h4><p>Busca primero las letras raras (K, W, J, Ñ, X): delatan la palabra. Barre por filas, luego columnas y al final diagonales. Con 💡 Pista se ilumina una palabra escondida.</p></div>' +
    '<div class="si-card"><h4>🌙 Dato lunar</h4><p>Las sopas entrenan atención y vocabulario: ideales para aprender mapuzugun jugando, en familia, una luna a la vez.</p></div>';
}
function renderHistPanel() {
  var box = $('spHistBox');
  if (!box) return;
  var st = getStats();
  var hist = getHistory().slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 20);
  var mejor = TEMAS.map(function (t) {
    var m = st.mejor && st.mejor[t.id];
    return '<span class="chip" style="font-size:10px">' + t.n + ': ' + (m ? fmtTime(m) : '—') + '</span>';
  }).join(' ');
  box.innerHTML =
    '<div class="menstrual-card"><h4>📊 Mis números</h4>' +
    '<p class="muted" style="font-size:12px">' + st.ganadas + ' completadas de ' + st.jugadas + ' jugadas · racha actual: ' + (st.racha || 0) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="muted" style="font-size:11px">⏱️ Mejor tiempo:</span>' + mejor + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Últimas sopas</h4>' +
    (hist.length ? '<div class="habits-list" style="margin-top:6px">' + hist.map(function (r) {
      return '<div class="habit-item" style="font-size:12px">' + (r.won ? '🏆' : '👁️') + ' <b>' + esc(temaById(r.tema).n) + '</b> · ' + (r.halladas || 0) + '/' + (r.total || 0) + ' · ' + fmtTime(r.seconds) + ' · ' + esc(r.fecha || '') + '</div>';
    }).join('') + '</div>' : '<p class="muted" style="font-size:12px">Aún sin sopas terminadas. ¡Encuentra tus primeras 10 palabras!</p>') +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" class="btn" id="spHistShare" style="width:auto;font-size:11px">📤 Compartir</button>' +
    '<button type="button" class="btn" id="spHistClear" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></div></div>';
  var sh = $('spHistShare');
  if (sh) sh.onclick = function () {
    if (!hist.length) return alert('Sin partidas aún');
    share('🔎 Mi Sopa de Letras', hist.slice(0, 10).map(function (r) {
      return (r.won ? '🏆' : '👁️') + ' ' + temaById(r.tema).n + ' · ' + (r.halladas || 0) + '/' + (r.total || 0) + ' · ' + fmtTime(r.seconds) + ' · ' + (r.fecha || '');
    }).join('\n'));
  };
  var cl = $('spHistClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar historial y estadísticas de la Sopa de Letras?')) return;
    try { var u = userData(); u.sopaHistory = []; u.sopaStats = statsDef(); } catch (e) {}
    save('Historial borrado'); renderHistPanel();
  };
}

/* ================= JUGADAS ================= */
function tapCell(r, c) {
  if (!G || G.won) return;
  if (!G.anchor) {
    G.anchor = [r, c]; G.hover = null;
    try { if (navigator.vibrate) navigator.vibrate(20); } catch (e) {}
    renderBoard();
    return;
  }
  // tocar el mismo inicio = cancelar
  if (G.anchor[0] === r && G.anchor[1] === c) {
    G.anchor = null; G.hover = null;
    renderBoard(); persistCurrent();
    return;
  }
  var lc = lineCells(G.anchor[0], G.anchor[1], r, c);
  if (!lc) {
    // no es línea recta: cambia el inicio a la nueva celda
    G.anchor = [r, c]; G.hover = null;
    renderBoard();
    return;
  }
  var fwd = lineWord(lc), bwd = rev(fwd);
  var hit = null;
  for (var i = 0; i < G.words.length; i++) {
    var w = G.words[i];
    if (w.found) continue;
    // la selección debe cubrir EXACTO la palabra (mismo largo y letras)
    if (lc.length !== w.w.length) continue;
    if (fwd === w.w || bwd === w.w) {
      // además debe coincidir la posición (evita falsos primos con misma palabra)
      var cells = cellsOf(w);
      var setA = {}, k;
      for (k = 0; k < cells.length; k++) setA[cells[k][0] + ':' + cells[k][1]] = 1;
      var same = lc.every(function (rc) { return setA[rc[0] + ':' + rc[1]]; });
      if (same) { hit = w; break; }
    }
  }
  if (hit) {
    hit.found = true;
    G.anchor = null; G.hover = null;
    try { if (navigator.vibrate) navigator.vibrate([40, 30, 40]); } catch (e) {}
    renderTop(); renderBoard(); renderWords(); persistCurrent(); checkWin();
  } else {
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
    // deja el final como nuevo inicio para seguir buscando fluido
    G.anchor = [r, c]; G.hover = null;
    renderBoard();
    var msg = $('spMsg');
    if (msg) msg.innerHTML = '❌ Esa selección (' + esc(fwd) + ') no es una palabra buscada. Nuevo inicio marcado: <b>' + G.grid[r][c] + '</b>.';
  }
}
function useHint() {
  if (!G || G.won) return;
  if (G.hintsLeft <= 0) { alert('Sin pistas. Genera una sopa nueva para recuperarlas.'); return; }
  var rest = G.words.filter(function (w) { return !w.found; });
  if (!rest.length) return;
  var pick = rest[Math.floor(Math.random() * rest.length)];
  pick.hint = true;
  G.hintsLeft--; G.conAyuda = true;
  // ilumina su primera letra un momento
  renderWords();
  setTimeout(function () {
    var box = $('spBoard');
    if (!box) return;
    var el = box.querySelector('[data-sp="' + pick.r0 + ':' + pick.c0 + '"]');
    if (el) el.classList.add('sp-hintflash');
  }, 30);
  var msg = $('spMsg');
  if (msg) {
    var tema = temaById(G.tema);
    var pista = (tema.hints && tema.hints[pick.w]) || '';
    msg.innerHTML = '💡 Busca <b>' + pick.w.charAt(0) + '…</b> (' + pick.w.length + ' letras' + (pista ? ' · ' + esc(pista) : '') + '). Primera letra iluminada ✨';
  }
  renderTop(); renderWords(); persistCurrent();
}
function checkWin() {
  if (!G || G.won) return;
  var all = G.words.length && G.words.every(function (w) { return w.found; });
  if (!all) return;
  G.won = true; G.timerOn = false;
  recordResult(true);
  persistCurrent(); renderAll();
  save('¡Sopa completa! 🏆');
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
    u.sopaStats = st;
    var h = getHistory();
    var d = new Date();
    var fecha = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    h.push({ ts: Date.now(), fecha: fecha, tema: G.tema, halladas: foundCount(), total: G.words.length, seconds: G.seconds, won: won });
    u.sopaHistory = h.slice(-100);
    save();
  } catch (e) {}
}

/* ================= TABS + DIALOG ================= */
function switchTab(t) {
  TAB = t;
  ['jugar', 'aprender', 'registros'].forEach(function (k) {
    var b = $('tabSp' + k.charAt(0).toUpperCase() + k.slice(1));
    if (b) b.classList.toggle('btn-accent', k === t);
    var p = $('spPanel' + k.charAt(0).toUpperCase() + k.slice(1));
    if (p) p.classList.toggle('hidden', k !== t);
  });
  if (t === 'jugar') renderAll();
  if (t === 'aprender') renderAprender();
  if (t === 'registros') renderHistPanel();
}
function buildDialog() {
  injectCSS();
  var old = $('sopaDialog');
  if (old) return old;
  var d = document.createElement('dialog');
  d.id = 'sopaDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🔎 Sopa de Letras</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Encuentra 10 palabras escondidas de Penco en 8 direcciones. Toca inicio y fin. Todo queda <b>privado y local</b> en tu usuario.</p>' +
    '<div id="spLunaBox" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabSpJugar" class="btn btn-accent" style="width:auto">🔎 Jugar</button>' +
    '<button type="button" id="tabSpAprender" class="btn" style="width:auto">📚 Aprender</button>' +
    '<button type="button" id="tabSpRegistros" class="btn" style="width:auto">🏆 Mis registros</button>' +
    '</div>' +
    '<div id="spPanelJugar"><div class="sp-wrap"><div id="spTemas" class="sp-temas"></div><div id="spTop"></div><div id="spBoard"></div>' +
    '<div id="spMsg" class="chip sp-msg" style="display:block;white-space:normal"></div>' +
    '<div id="spWords"></div></div></div>' +
    '<div id="spPanelAprender" class="hidden"><div id="spLearnBox" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="spPanelRegistros" class="hidden"><div id="spHistBox"></div></div>' +
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
  $('tabSpJugar').onclick = function () { switchTab('jugar'); };
  $('tabSpAprender').onclick = function () { switchTab('aprender'); };
  $('tabSpRegistros').onclick = function () { switchTab('registros'); };
  return d;
}
function openSopa() {
  var d = buildDialog();
  renderLuna();
  renderAprender();
  if (!G) {
    var sv = getSaved();
    if (sv && sv.grid && sv.words && sv.words.length) {
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
  if ($('btnSopa')) {
    try {
      var cur = $('btnSopa');
      if (cur.parentNode !== g) g.appendChild(cur);
      try { cur.setAttribute('data-sub', 'juegos'); } catch (eS) {}
      if (typeof reordenarAcciones === 'function') reordenarAcciones();
    } catch (eM) {}
    return;
  }
  var btn = document.createElement('button');
  btn.id = 'btnSopa'; btn.className = 'btn'; btn.type = 'button';
  btn.textContent = '🔎 Sopa de Letras';
  try { btn.setAttribute('data-sub', 'juegos'); } catch (eS) {}
  btn.setAttribute('data-keywords', 'sopa letras palabras buscar encontrar vocabulario mapuzugun mar bosque luna juego mente atencion pasatiempo infantil');
  g.appendChild(btn);
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnSopa') < 0) ALL_BTNS.push('btnSopa');
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
}
function injectConfig() {
  var groups = document.querySelectorAll('#configDialog .config-group h5');
  for (var i = 0; i < groups.length; i++) {
    if (/Aprender/.test(groups[i].textContent) && !groups[i].parentNode.querySelector('[data-btn="btnSopa"]')) {
      var lab = document.createElement('label');
      lab.className = 'check-row';
      lab.innerHTML = '<input type="checkbox" data-btn="btnSopa" checked> 🔎 Sopa de Letras';
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf && ALL_BTNS.indexOf('btnSopa') < 0) ALL_BTNS.push('btnSopa');
  } catch (e) {}
  var b = $('btnSopa');
  if (!b) {
    if (_retry++ < 60) setTimeout(setup, 500);
    return;
  }
  if (!b.dataset.spw) {
    b.dataset.spw = '1';
    b.addEventListener('click', openSopa);
  }
}

window.SopaLetras = {
  open: openSopa, newGame: newGame,
  generate: generateGrid, temas: TEMAS
};
setTimeout(setup, 600);

})();
