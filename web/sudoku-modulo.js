/* ============================================================
   SUDOKU — Calendario 13 Lunas (Penco · Bio-Bio)
   Sección completa en Mente & Estudio (btnSudoku):
   - Jugar: tablero 9x9 con 4 dificultades (Fácil, Medio,
     Difícil, Experto), generador propio con solución única,
     notas de lápiz (borrador), pistas, temporizador,
     contador de errores (3 fallos = derrota) y guardado
     automático de la partida en curso.
   - Aprender: reglas + 6 técnicas (solo, oculto, pares,
     pointing, box-line, X-Wing) con ejemplos.
   - Mis registros: estadísticas por dificultad, mejor tiempo,
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
  if ($('sudokuStyles')) return;
  var st = document.createElement('style');
  st.id = 'sudokuStyles';
  st.textContent = [
    '.sk-wrap{max-width:430px;margin:0 auto}',
    '.sk-top{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px}',
    '.sk-stat{font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:4px 9px;color:var(--text)}',
    '.sk-stat b{color:var(--gold)}',
    '.sk-board{display:grid;grid-template-columns:repeat(9,1fr);border:3px solid var(--gold);border-radius:10px;overflow:hidden;background:var(--panel);touch-action:manipulation}',
    '.sk-cell{aspect-ratio:1;border:0;padding:0;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;background:transparent;color:var(--text);font-weight:700;font-size:clamp(15px,4.4vw,22px);font-variant-numeric:tabular-nums;border-right:1px solid rgba(140,150,190,.22);border-bottom:1px solid rgba(140,150,190,.22)}',
    '.sk-cell:nth-child(3n):not(:nth-child(9n)){border-right:2px solid var(--gold)}',
    '.sk-cell:nth-child(n+19):nth-child(-n+27),.sk-cell:nth-child(n+46):nth-child(-n+54){border-bottom:2px solid var(--gold)}',
    '.sk-cell:nth-child(9n){border-right:0}',
    '.sk-cell:nth-child(n+73){border-bottom:0}',
    '.sk-given{color:var(--text);background:rgba(232,197,106,.07)}',
    '.sk-user{color:#7ab8ff}',
    '.sk-sel{background:rgba(232,197,106,.35)!important;outline:2px solid var(--gold);outline-offset:-2px}',
    '.sk-peer{background:rgba(232,197,106,.12)}',
    '.sk-same{background:rgba(122,184,255,.22)}',
    '.sk-err{background:rgba(231,76,60,.35)!important;color:#ff9a9a}',
    '.sk-hintflash{animation:skflash 1s ease 2}',
    '@keyframes skflash{0%,100%{background:transparent}50%{background:rgba(143,214,148,.5)}}',
    '.sk-notes{position:absolute;inset:1px;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);font-size:clamp(6px,1.8vw,9px);font-weight:600;color:#9aa3c7;line-height:1;pointer-events:none}',
    '.sk-notes span{display:flex;align-items:center;justify-content:center}',
    '.sk-pad{display:grid;grid-template-columns:repeat(9,1fr);gap:5px;margin-top:10px}',
    '.sk-key{border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:9px;padding:9px 0;font-size:17px;font-weight:800;cursor:pointer;position:relative}',
    '.sk-key small{display:block;font-size:9px;color:var(--gold);font-weight:700}',
    '.sk-key:active{transform:scale(.95)}',
    '.sk-key.done{opacity:.35}',
    '.sk-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
    '.sk-diff{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}'
  ].join('\n');
  document.head.appendChild(st);
}

/* ================= MOTOR SUDOKU ================= */
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function emptyGrid() { var g = []; for (var i = 0; i < 81; i++) g.push(0); return g; }
function peersOf(i) {
  var r = Math.floor(i / 9), c = i % 9, out = [];
  var seen = {};
  for (var k = 0; k < 9; k++) {
    var a = r * 9 + k, b = k * 9 + c;
    if (a !== i && !seen[a]) { seen[a] = 1; out.push(a); }
    if (b !== i && !seen[b]) { seen[b] = 1; out.push(b); }
  }
  var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (var dr = 0; dr < 3; dr++) for (var dc = 0; dc < 3; dc++) {
    var q = (br + dr) * 9 + (bc + dc);
    if (q !== i && !seen[q]) { seen[q] = 1; out.push(q); }
  }
  return out;
}
function candidates(g, i) {
  if (g[i]) return [];
  var used = {};
  var ps = peersOf(i);
  for (var k = 0; k < ps.length; k++) if (g[ps[k]]) used[g[ps[k]]] = 1;
  var out = [];
  for (var n = 1; n <= 9; n++) if (!used[n]) out.push(n);
  return out;
}
function fillGrid(g) {
  var best = -1, bestC = null;
  for (var i = 0; i < 81; i++) {
    if (!g[i]) {
      var c = candidates(g, i);
      if (!c.length) return false;
      if (!bestC || c.length < bestC.length) { best = i; bestC = c; if (c.length === 1) break; }
    }
  }
  if (best < 0) return true;
  shuffle(bestC);
  for (var k = 0; k < bestC.length; k++) {
    g[best] = bestC[k];
    if (fillGrid(g)) return true;
    g[best] = 0;
  }
  return false;
}
function countSolutions(g, limit) {
  var best = -1, bestC = null;
  for (var i = 0; i < 81; i++) {
    if (!g[i]) {
      var c = candidates(g, i);
      if (!c.length) return 0;
      if (!bestC || c.length < bestC.length) { best = i; bestC = c; if (c.length === 1) break; }
    }
  }
  if (best < 0) return 1;
  var total = 0;
  for (var k = 0; k < bestC.length; k++) {
    g[best] = bestC[k];
    total += countSolutions(g, limit);
    g[best] = 0;
    if (total >= limit) return total;
  }
  return total;
}
function solveGrid(g) {
  var c = g.slice();
  return fillGrid(c) ? c : null;
}
var DIFS = [
  { id: 'facil', n: '🌱 Fácil', givens: 46, d: 'Muchas pistas. Ideal para empezar y calentar la mente.' },
  { id: 'medio', n: '🧩 Medio', givens: 36, d: 'Equilibrio entre lógica y paciencia.' },
  { id: 'dificil', n: '⚔️ Difícil', givens: 30, d: 'Pocas pistas: exige técnicas avanzadas.' },
  { id: 'experto', n: '👑 Experto', givens: 26, d: 'Al límite: solo para mentes afiladas.' }
];
function difById(id) {
  for (var i = 0; i < DIFS.length; i++) if (DIFS[i].id === id) return DIFS[i];
  return DIFS[0];
}
function generatePuzzle(givens) {
  var sol = emptyGrid();
  fillGrid(sol);
  var puz = sol.slice();
  var order = shuffle(sol.map(function (_, i) { return i; }));
  var toRemove = 81 - givens;
  var removed = 0;
  for (var k = 0; k < order.length && removed < toRemove; k++) {
    var i = order[k];
    var mirror = 80 - i;
    var backup = puz[i], backupM = puz[mirror];
    if (!backup && !backupM) continue;
    puz[i] = 0;
    var didMirror = false;
    if (mirror !== i && puz[mirror] && removed + 1 < toRemove) { puz[mirror] = 0; didMirror = true; }
    var test = puz.slice();
    if (countSolutions(test, 2) !== 1) {
      puz[i] = backup;
      if (didMirror) puz[mirror] = backupM;
    } else {
      removed += didMirror ? 2 : 1;
    }
  }
  return { puzzle: puz, solution: sol };
}

/* ================= CONTENIDO ================= */
var TECNICAS = [
  { n: '1 · Último libre (naked single)', d: 'Si en una celda solo cabe un número (todos los demás aparecen en su fila, columna o caja), ese es. Revisa celdas con muchas vecinas llenas primero.' },
  { n: '2 · Único oculto (hidden single)', d: 'Si en una fila/columna/caja un número solo puede ir en una celda (aunque esa celda tenga otros candidatos), ahí va. Marca candidatos con ✏️ para verlo.' },
  { n: '3 · Pares desnudos (naked pair)', d: 'Si dos celdas de una unidad solo comparten los mismos 2 candidatos, esos números no van en ninguna otra celda de la unidad. ¡Limpia y sigue!' },
  { n: '4 · Apuntar (pointing)', d: 'Si en una caja un candidato solo aparece en una fila (o columna), entonces no puede estar en el resto de esa fila fuera de la caja. Táchalo.' },
  { n: '5 · Box-Line (claiming)', d: 'Lo inverso: si en una fila un candidato solo cabe dentro de una caja, elimínalo del resto de esa caja.' },
  { n: '6 · X-Wing', d: 'Si un número aparece solo en 2 columnas iguales en 2 filas, forma un rectángulo: elimínalo del resto de esas columnas. Técnica de nivel Experto.' }
];
var REGLAS = [
  { t: '🎯 Objetivo', d: 'Completa la cuadrícula 9×9: cada fila, cada columna y cada caja 3×3 debe tener los números del 1 al 9 sin repetir.' },
  { t: '✏️ Borrador', d: 'Activa ✏️ y toca números para anotar candidatos en lápiz. Toca de nuevo para quitarlos. Al escribir el número final, los borradores de esa celda se limpian solos.' },
  { t: '💡 Pistas', d: 'Tienes 3 pistas por partida: revelan una celda con el número correcto. Úsalas cuando estés trabado, no al inicio.' },
  { t: '❌ Errores', d: 'Si escribes un número que choca con la solución, cuenta 1 error y se marca en rojo. Con 3 errores la partida se pierde (puedes seguir en modo libre o empezar otra).' },
  { t: '⌨️ Teclado', d: 'En computador: toca una celda y pulsa 1-9 para escribir, 0 o Supr para borrar, N para borrador, flechas para moverte.' }
];
var LUNA_TIPS = [
  { f: '🌑 Luna nueva', t: 'Tiempo de aprender: juega 1 Fácil y estudia 1 técnica nueva sin apuro, como sembrar.' },
  { f: '🌒 Creciente', t: 'Sube el ritmo: prueba el nivel Medio y usa el borrador siempre. La energía crece: ataca los candidatos.' },
  { f: '🌓 Cuarto creciente', t: 'Mitad del camino: repite el puzzle de ayer intentando menos tiempo y menos pistas.' },
  { f: '🌔 Gibosa', t: 'Profundiza: juega 1 Difícil con calma, anotando pares desnudos y pointing.' },
  { f: '🌕 Luna llena', t: '¡A brillar! Intenta el Experto o reta a alguien al lado. La mente está plena: compite y comparte.' },
  { f: '🌖 Menguante', t: 'Revisa sin juicio: ¿dónde te equivocaste? Mira la solución y anota 1 aprendizaje en tu bitácora del día.' },
  { f: '🌗 Cuarto menguante', t: 'Juego lento: un Fácil sin pistas ni errores. Paciencia y respiración, como podar.' },
  { f: '🌘 Casi nueva', t: 'Descansa la mente: mira un puzzle resuelto paso a paso y duerme bien. El cerebro consolida durmiendo.' }
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

/* ================= ESTADO ================= */
var TAB = 'jugar';
var G = null; // {puzzle,solution,cur,given,notes,sel,errors,hints,seconds,dif,notesMode,over,won,timerOn}
var timerInt = null;

function statsDef() { return { jugadas: 0, ganadas: 0, mejor: {}, racha: 0 }; }
function getStats() {
  var s = store('sudokuStats', null);
  if (!s || typeof s !== 'object' || !s.mejor) {
    s = statsDef();
    try { var u = userData(); u.sudokuStats = s; } catch (e) {}
  }
  return s;
}
function getHistory() { var a = store('sudokuHistory', []); return Array.isArray(a) ? a : []; }
function getSaved() { return store('sudokuCurrent', null); }
function persistCurrent() {
  try {
    var u = userData();
    if (!G) { u.sudokuCurrent = null; }
    else {
      u.sudokuCurrent = {
        puzzle: G.puzzle, solution: G.solution, cur: G.cur, given: G.given,
        notes: G.notes.map(function (s) { return Array.from(s); }),
        errors: G.errors, hints: G.hints, seconds: G.seconds, dif: G.dif,
        over: G.over, won: G.won
      };
    }
    save();
  } catch (e) {}
}

function newGame(difId, keepStats) {
  stopTimer();
  var dif = difById(difId || (G && G.dif) || 'facil');
  var gen = generatePuzzle(dif.givens);
  var notes = [];
  for (var i = 0; i < 81; i++) notes.push(new Set());
  G = {
    puzzle: gen.puzzle, solution: gen.solution, cur: gen.puzzle.slice(),
    given: gen.puzzle.map(function (v) { return v !== 0; }),
    notes: notes, sel: -1, errors: 0, hints: 3, seconds: 0,
    dif: dif.id, notesMode: false, over: false, won: false, timerOn: true
  };
  if (!keepStats) {
    try { var st = getStats(); st.jugadas++; var u = userData(); u.sudokuStats = st; } catch (e) {}
  }
  persistCurrent();
  startTimer();
  renderAll();
}
function restoreGame(sv) {
  stopTimer();
  var notes = [];
  for (var i = 0; i < 81; i++) {
    var arr = (sv.notes && sv.notes[i]) || [];
    notes.push(new Set(arr));
  }
  G = {
    puzzle: sv.puzzle.slice(), solution: sv.solution.slice(), cur: sv.cur.slice(),
    given: sv.given.slice(), notes: notes, sel: -1,
    errors: sv.errors || 0, hints: (sv.hints == null ? 3 : sv.hints),
    seconds: sv.seconds || 0, dif: sv.dif || 'facil',
    notesMode: false, over: !!sv.over, won: !!sv.won, timerOn: !sv.over && !sv.won
  };
  if (G.timerOn) startTimer();
  renderAll();
}

function fmtTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  var m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' + m : '' + m) + ':' + (r < 10 ? '0' + r : '' + r);
}
function startTimer() {
  stopTimer();
  timerInt = setInterval(function () {
    if (!G || !G.timerOn || G.over || G.won) return;
    var dlg = $('sudokuDialog');
    if (!dlg || !dlg.open) return;
    G.seconds++;
    var el = $('skTime');
    if (el) el.innerHTML = '⏱️ <b>' + fmtTime(G.seconds) + '</b>';
    if (G.seconds % 15 === 0) persistCurrent();
  }, 1000);
}
function stopTimer() { if (timerInt) { try { clearInterval(timerInt); } catch (e) {} timerInt = null; } }

function progressPct() {
  if (!G) return 0;
  var fill = 0;
  for (var i = 0; i < 81; i++) if (G.cur[i]) fill++;
  return Math.round(fill / 81 * 100);
}

/* ================= RENDER ================= */
function conflictsAt(i, val) {
  var ps = peersOf(i);
  for (var k = 0; k < ps.length; k++) if (G.cur[ps[k]] === val) return true;
  return false;
}
function renderAll() {
  renderTop(); renderBoard(); renderPad(); renderHistPanel();
}
function renderTop() {
  var box = $('skTop');
  if (!box || !G) return;
  var dif = difById(G.dif);
  box.innerHTML =
    '<div class="sk-diff">' + DIFS.map(function (d) {
      return '<button type="button" class="btn' + (d.id === G.dif ? ' btn-accent' : '') + '" data-dif="' + d.id + '" style="width:auto;font-size:11px">' + d.n + '</button>';
    }).join('') + '</div>' +
    '<div class="sk-top">' +
    '<span class="sk-stat" id="skTime">⏱️ <b>' + fmtTime(G.seconds) + '</b></span>' +
    '<span class="sk-stat">❌ Errores <b>' + G.errors + '/3</b></span>' +
    '<span class="sk-stat">💡 Pistas <b>' + G.hints + '</b></span>' +
    '<span class="sk-stat">📊 <b>' + progressPct() + '%</b></span>' +
    '</div>' +
    '<p class="muted" style="font-size:11px;margin:4px 0">' + esc(dif.d) + '</p>';
  box.querySelectorAll('[data-dif]').forEach(function (b) {
    b.onclick = function () {
      if (!G || G.dif === b.getAttribute('data-dif')) return;
      if (G && !G.over && !G.won && progressPct() > 5) {
        if (!confirm('¿Empezar un tablero nuevo en ' + difById(b.getAttribute('data-dif')).n + '? Se pierde el avance actual.')) return;
      }
      newGame(b.getAttribute('data-dif'));
    };
  });
}
function renderBoard() {
  var box = $('skBoard');
  if (!box || !G) return;
  var selVal = G.sel >= 0 ? G.cur[G.sel] : 0;
  var selPeers = G.sel >= 0 ? peersOf(G.sel) : [];
  var inPeer = {};
  selPeers.forEach(function (p) { inPeer[p] = 1; });
  var h = '<div class="sk-board" role="grid" aria-label="Tablero de sudoku">';
  for (var i = 0; i < 81; i++) {
    var v = G.cur[i];
    var cls = 'sk-cell';
    if (G.given[i]) cls += ' sk-given'; else if (v) cls += ' sk-user';
    if (i === G.sel) cls += ' sk-sel';
    else if (selVal && v === selVal) cls += ' sk-same';
    else if (inPeer[i]) cls += ' sk-peer';
    if (!G.given[i] && v && v !== G.solution[i]) cls += ' sk-err';
    var inner;
    if (v) inner = '<span>' + v + '</span>';
    else {
      var ns = Array.from(G.notes[i]).sort();
      inner = '<span class="sk-notes">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) {
        return '<span>' + (ns.indexOf(n) >= 0 ? n : '') + '</span>';
      }).join('') + '</span>';
    }
    var aria = 'Celda fila ' + (Math.floor(i / 9) + 1) + ' columna ' + ((i % 9) + 1) + (v ? ' valor ' + v : ' vacía');
    h += '<button type="button" class="' + cls + '" data-cell="' + i + '" role="gridcell" aria-label="' + aria + '">' + inner + '</button>';
  }
  box.innerHTML = h + '</div>';
  box.querySelectorAll('[data-cell]').forEach(function (el) {
    el.onclick = function () { selectCell(parseInt(el.getAttribute('data-cell'), 10)); };
  });
  var msg = $('skMsg');
  if (msg) {
    if (G.won) msg.innerHTML = '🏆 <b>¡Sudoku completo!</b> ' + esc(difById(G.dif).n) + ' en ' + fmtTime(G.seconds) + ' con ' + G.errors + ' errores.';
    else if (G.over) msg.innerHTML = '💥 <b>3 errores.</b> Puedes seguir practicando en modo libre o empezar un tablero nuevo.';
    else msg.innerHTML = G.sel >= 0 ? 'Celda seleccionada: fila ' + (Math.floor(G.sel / 9) + 1) + ', columna ' + ((G.sel % 9) + 1) + '. Escribe con el teclado numérico o el teclado físico.' : 'Toca una celda vacía y escribe un número del 1 al 9.';
  }
}
function remainingCounts() {
  var left = {};
  for (var n = 1; n <= 9; n++) left[n] = 9;
  if (!G) return left;
  for (var i = 0; i < 81; i++) if (G.cur[i]) left[G.cur[i]]--;
  return left;
}
function renderPad() {
  var box = $('skPad');
  if (!box || !G) return;
  var left = remainingCounts();
  var h = '<div class="sk-pad">';
  for (var n = 1; n <= 9; n++) {
    h += '<button type="button" class="sk-key' + (left[n] <= 0 ? ' done' : '') + '" data-num="' + n + '">' + n + '<small>' + left[n] + '</small></button>';
  }
  box.innerHTML = h + '</div>' +
    '<div class="sk-tools">' +
    '<button type="button" class="btn' + (G.notesMode ? ' btn-accent' : '') + '" id="skNotesBtn" style="width:auto;font-size:12px">✏️ Borrador: ' + (G.notesMode ? 'ON' : 'OFF') + '</button>' +
    '<button type="button" class="btn" id="skEraseBtn" style="width:auto;font-size:12px">🧽 Borrar</button>' +
    '<button type="button" class="btn" id="skHintBtn" style="width:auto;font-size:12px">💡 Pista (' + G.hints + ')</button>' +
    '</div>' +
    '<div class="sk-tools">' +
    '<button type="button" class="btn" id="skRestartBtn" style="width:auto;font-size:12px">🔁 Reiniciar</button>' +
    '<button type="button" class="btn" id="skNewBtn" style="width:auto;font-size:12px">🎲 Nuevo tablero</button>' +
    '<button type="button" class="btn" id="skSolveBtn" style="width:auto;font-size:12px" title="Muestra la solución (cuenta como no ganado)">👁️ Ver solución</button>' +
    '</div>';
  box.querySelectorAll('[data-num]').forEach(function (b) {
    b.onclick = function () { enterNumber(parseInt(b.getAttribute('data-num'), 10)); };
  });
  $('skNotesBtn').onclick = function () { G.notesMode = !G.notesMode; renderPad(); };
  $('skEraseBtn').onclick = eraseCell;
  $('skHintBtn').onclick = useHint;
  $('skRestartBtn').onclick = function () {
    if (!G) return;
    if (!confirm('¿Reiniciar este tablero? Se borra tu avance pero se mantiene el puzzle.')) return;
    for (var i = 0; i < 81; i++) {
      if (!G.given[i]) { G.cur[i] = 0; G.notes[i] = new Set(); }
    }
    G.errors = 0; G.hints = 3; G.seconds = 0; G.sel = -1;
    G.over = false; G.won = false; G.timerOn = true;
    persistCurrent(); startTimer(); renderAll();
  };
  $('skNewBtn').onclick = function () { newGame(G.dif); };
  $('skSolveBtn').onclick = function () {
    if (!G) return;
    if (!confirm('¿Ver la solución? El tablero se completa pero no contará como victoria.')) return;
    G.cur = G.solution.slice();
    for (var i = 0; i < 81; i++) G.notes[i] = new Set();
    G.over = true; G.won = false; G.timerOn = false;
    persistCurrent(); renderAll();
  };
}
function renderLuna() {
  var box = $('skLunaBox');
  if (!box) return;
  var f = lunaFaseAprox();
  var tip = LUNA_TIPS[f.idx] || LUNA_TIPS[4];
  box.innerHTML = '<b>🌙 Consejo lunar · iluminación ' + f.ilum + '%</b><br>' +
    '<span style="color:var(--gold)">' + esc(tip.f) + '</span> — ' + esc(tip.t);
}
function renderAprender() {
  var box = $('skLearnBox');
  if (!box) return;
  box.innerHTML = REGLAS.map(function (r) {
    return '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>' + esc(r.t) + '</h4><p>' + esc(r.d) + '</p></div>';
  }).join('') + TECNICAS.map(function (t) {
    return '<div class="si-card"><h4>🔢 ' + esc(t.n) + '</h4><p>' + esc(t.d) + '</p></div>';
  }).join('');
}
function renderHistPanel() {
  var box = $('skHistBox');
  if (!box) return;
  var st = getStats();
  var hist = getHistory().slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 20);
  var mejor = DIFS.map(function (d) {
    var m = st.mejor && st.mejor[d.id];
    return '<span class="chip" style="font-size:10px">' + d.n + ': ' + (m ? fmtTime(m) : '—') + '</span>';
  }).join(' ');
  box.innerHTML =
    '<div class="menstrual-card"><h4>📊 Mis números</h4>' +
    '<p class="muted" style="font-size:12px">' + st.ganadas + ' ganados de ' + st.jugadas + ' jugados · racha actual: ' + (st.racha || 0) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="muted" style="font-size:11px">⏱️ Mejor tiempo:</span>' + mejor + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Últimas partidas</h4>' +
    (hist.length ? '<div class="habits-list" style="margin-top:6px">' + hist.map(function (r) {
      return '<div class="habit-item" style="font-size:12px">' + (r.won ? '🏆' : '💥') + ' <b>' + esc(difById(r.dif).n) + '</b> · ' + fmtTime(r.seconds) + ' · ' + r.errors + ' errores · ' + esc(r.fecha || '') + '</div>';
    }).join('') + '</div>' : '<p class="muted" style="font-size:12px">Aún sin partidas terminadas. ¡Completa tu primer tablero!</p>') +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" class="btn" id="skHistShare" style="width:auto;font-size:11px">📤 Compartir</button>' +
    '<button type="button" class="btn" id="skHistClear" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></div></div>';
  var sh = $('skHistShare');
  if (sh) sh.onclick = function () {
    if (!hist.length) return alert('Sin partidas aún');
    share('🔢 Mi Sudoku', hist.slice(0, 10).map(function (r) {
      return (r.won ? '🏆' : '💥') + ' ' + difById(r.dif).n + ' · ' + fmtTime(r.seconds) + ' · ' + r.errors + ' errores · ' + (r.fecha || '');
    }).join('\n'));
  };
  var cl = $('skHistClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar historial y estadísticas de Sudoku?')) return;
    try { var u = userData(); u.sudokuHistory = []; u.sudokuStats = statsDef(); } catch (e) {}
    save('Historial borrado'); renderHistPanel();
  };
}

/* ================= JUGADAS ================= */
function selectCell(i) {
  if (!G || G.won) return;
  G.sel = (G.sel === i) ? -1 : i;
  renderBoard();
}
function enterNumber(n) {
  if (!G || G.won) return;
  if (G.sel < 0) {
    var first = -1;
    for (var k = 0; k < 81; k++) if (!G.given[k] && !G.cur[k]) { first = k; break; }
    if (first < 0) return;
    G.sel = first;
  }
  var i = G.sel;
  if (G.given[i]) return;
  if (G.over) { // modo libre tras derrota: solo permite correctos
    if (G.solution[i] !== n) { flashHint(i); return; }
    G.cur[i] = n; G.notes[i] = new Set();
    clearNotesFromPeers(i, n);
    renderBoard(); renderPad(); persistCurrent(); checkWin();
    return;
  }
  if (G.notesMode) {
    if (G.cur[i]) return;
    if (G.notes[i].has(n)) G.notes[i].delete(n); else G.notes[i].add(n);
    renderBoard(); persistCurrent();
    return;
  }
  if (G.cur[i] === n) { renderBoard(); return; }
  if (n !== G.solution[i]) {
    G.errors++;
    G.cur[i] = n; // muestra el error en rojo
    G.notes[i] = new Set();
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
    if (G.errors >= 3) {
      G.over = true; G.timerOn = false;
      recordResult(false);
    }
    renderTop(); renderBoard(); renderPad(); persistCurrent();
    // limpia el número erróneo tras 900ms para seguir intentando
    (function (cell, expected) {
      setTimeout(function () {
        if (!G) return;
        if (G.cur[cell] !== 0 && G.cur[cell] !== G.solution[cell] && !G.given[cell]) {
          if (G.cur[cell] === expected) G.cur[cell] = 0;
          renderBoard(); renderPad(); persistCurrent();
        }
      }, 900);
    })(i, n);
    return;
  }
  G.cur[i] = n;
  G.notes[i] = new Set();
  clearNotesFromPeers(i, n);
  autoAdvance();
  renderTop(); renderBoard(); renderPad(); persistCurrent(); checkWin();
}
function clearNotesFromPeers(i, n) {
  var ps = peersOf(i);
  for (var k = 0; k < ps.length; k++) {
    if (G.notes[ps[k]] && G.notes[ps[k]].has(n)) G.notes[ps[k]].delete(n);
  }
}
function autoAdvance() {
  if (G.sel < 0) return;
  // avanza a la siguiente vacía no dada
  for (var k = G.sel + 1; k < 81; k++) {
    if (!G.given[k] && !G.cur[k]) { G.sel = k; return; }
  }
  for (var j = 0; j < G.sel; j++) {
    if (!G.given[j] && !G.cur[j]) { G.sel = j; return; }
  }
}
function eraseCell() {
  if (!G || G.sel < 0 || G.given[G.sel] || G.won) return;
  G.cur[G.sel] = 0;
  G.notes[G.sel] = new Set();
  renderBoard(); renderPad(); persistCurrent();
}
function useHint() {
  if (!G || G.won) return;
  if (G.hints <= 0) { alert('Sin pistas. Reinicia el tablero para recuperarlas.'); return; }
  var empties = [];
  for (var i = 0; i < 81; i++) if (!G.given[i] && G.cur[i] !== G.solution[i]) empties.push(i);
  if (!empties.length) return;
  var pick = G.sel >= 0 && empties.indexOf(G.sel) >= 0 ? G.sel : empties[Math.floor(Math.random() * empties.length)];
  G.cur[pick] = G.solution[pick];
  G.notes[pick] = new Set();
  clearNotesFromPeers(pick, G.cur[pick]);
  G.hints--;
  G.sel = pick;
  renderTop(); renderBoard(); renderPad(); persistCurrent(); checkWin();
  flashHint(pick);
}
function flashHint(i) {
  setTimeout(function () {
    var box = $('skBoard');
    if (!box) return;
    var el = box.querySelector('[data-cell="' + i + '"]');
    if (el) el.classList.add('sk-hintflash');
  }, 30);
}
function checkWin() {
  if (!G || G.won) return;
  for (var i = 0; i < 81; i++) if (G.cur[i] !== G.solution[i]) return;
  G.won = true; G.over = false; G.timerOn = false;
  recordResult(true);
  persistCurrent(); renderAll();
  save('¡Sudoku completo! 🏆');
  try { if (navigator.vibrate) navigator.vibrate([80, 40, 80]); } catch (e) {}
}
function recordResult(won) {
  try {
    var st = getStats();
    if (won) {
      st.ganadas++;
      st.racha = (st.racha || 0) + 1;
      if (!st.mejor) st.mejor = {};
      if (!st.mejor[G.dif] || G.seconds < st.mejor[G.dif]) st.mejor[G.dif] = G.seconds;
    } else {
      st.racha = 0;
    }
    var u = userData();
    u.sudokuStats = st;
    var h = getHistory();
    var d = new Date();
    var fecha = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    h.push({ ts: Date.now(), fecha: fecha, dif: G.dif, seconds: G.seconds, errors: G.errors, won: won });
    u.sudokuHistory = h.slice(-100);
    save();
  } catch (e) {}
}

/* ================= TABS + DIALOG ================= */
function switchTab(t) {
  TAB = t;
  ['jugar', 'aprender', 'registros'].forEach(function (k) {
    var b = $('tabSk' + k.charAt(0).toUpperCase() + k.slice(1));
    if (b) b.classList.toggle('btn-accent', k === t);
    var p = $('skPanel' + k.charAt(0).toUpperCase() + k.slice(1));
    if (p) p.classList.toggle('hidden', k !== t);
  });
  if (t === 'jugar') renderAll();
  if (t === 'aprender') renderAprender();
  if (t === 'registros') renderHistPanel();
}
function buildDialog() {
  injectCSS();
  var old = $('sudokuDialog');
  if (old) return old;
  var d = document.createElement('dialog');
  d.id = 'sudokuDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🔢 Sudoku</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">El clásico puzzle 9×9 con solución única, 4 niveles y borrador. Todo queda <b>privado y local</b> en tu usuario.</p>' +
    '<div id="skLunaBox" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabSkJugar" class="btn btn-accent" style="width:auto">🔢 Jugar</button>' +
    '<button type="button" id="tabSkAprender" class="btn" style="width:auto">📚 Aprender</button>' +
    '<button type="button" id="tabSkRegistros" class="btn" style="width:auto">🏆 Mis registros</button>' +
    '</div>' +
    '<div id="skPanelJugar"><div class="sk-wrap"><div id="skTop"></div><div id="skBoard"></div>' +
    '<div id="skMsg" class="chip" style="display:block;white-space:normal;margin-top:8px;line-height:1.5"></div>' +
    '<div id="skPad"></div></div></div>' +
    '<div id="skPanelAprender" class="hidden"><div id="skLearnBox" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="skPanelRegistros" class="hidden"><div id="skHistBox"></div></div>' +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  // ancho como ajedrez
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
  $('tabSkJugar').onclick = function () { switchTab('jugar'); };
  $('tabSkAprender').onclick = function () { switchTab('aprender'); };
  $('tabSkRegistros').onclick = function () { switchTab('registros'); };
  d.addEventListener('keydown', function (ev) {
    if (!G || TAB !== 'jugar') return;
    if (ev.key >= '1' && ev.key <= '9') { enterNumber(parseInt(ev.key, 10)); ev.preventDefault(); }
    else if (ev.key === '0' || ev.key === 'Backspace' || ev.key === 'Delete') { eraseCell(); ev.preventDefault(); }
    else if (ev.key === 'n' || ev.key === 'N') { G.notesMode = !G.notesMode; renderPad(); }
    else if (ev.key.indexOf('Arrow') === 0 && G.sel >= 0) {
      var r = Math.floor(G.sel / 9), c = G.sel % 9;
      if (ev.key === 'ArrowUp') r = (r + 8) % 9;
      if (ev.key === 'ArrowDown') r = (r + 1) % 9;
      if (ev.key === 'ArrowLeft') c = (c + 8) % 9;
      if (ev.key === 'ArrowRight') c = (c + 1) % 9;
      G.sel = r * 9 + c; renderBoard(); ev.preventDefault();
    }
  });
  return d;
}
function openSudoku() {
  var d = buildDialog();
  renderLuna();
  renderAprender();
  if (!G) {
    var sv = getSaved();
    if (sv && sv.puzzle && sv.solution && sv.cur) {
      try { restoreGame(sv); } catch (e) { newGame('facil'); }
    } else newGame('facil');
  } else {
    if (!G.won && !G.over && !timerInt) startTimer();
    renderAll();
  }
  switchTab(TAB || 'jugar');
  try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
}

/* ================= SETUP ================= */
function injectButton() {
  var g = document.querySelector('.action-group[data-group="mente"] .group-btns');
  if (!g || $('btnSudoku')) return;
  var btn = document.createElement('button');
  btn.id = 'btnSudoku'; btn.className = 'btn'; btn.type = 'button';
  btn.textContent = '🔢 Sudoku';
  btn.setAttribute('data-keywords', 'sudoku puzzle numeros logica concentracion memoria calculo pasatiempo juego mente 9x9');
  var ref = $('btnAjedrez') || $('btnMemory');
  if (ref && ref.parentNode === g && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
  else g.appendChild(btn);
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnSudoku') < 0) ALL_BTNS.push('btnSudoku');
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}
function injectConfig() {
  var groups = document.querySelectorAll('#configDialog .config-group h5');
  for (var i = 0; i < groups.length; i++) {
    if (/Mente/.test(groups[i].textContent) && !groups[i].parentNode.querySelector('[data-btn="btnSudoku"]')) {
      var lab = document.createElement('label');
      lab.className = 'check-row';
      lab.innerHTML = '<input type="checkbox" data-btn="btnSudoku" checked> 🔢 Sudoku';
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf && ALL_BTNS.indexOf('btnSudoku') < 0) ALL_BTNS.push('btnSudoku');
  } catch (e) {}
  var b = $('btnSudoku');
  if (!b) {
    if (_retry++ < 60) setTimeout(setup, 500);
    return;
  }
  if (!b.dataset.skw) {
    b.dataset.skw = '1';
    b.addEventListener('click', openSudoku);
  }
  // precarga diferida: restaura sin bloquear el arranque
  try {
    var sv = getSaved();
    if (sv && sv.puzzle && !G) restoreGame(sv);
  } catch (e) {}
}

window.Sudoku = {
  open: openSudoku, newGame: newGame,
  generate: generatePuzzle, solve: solveGrid,
  difficulties: DIFS
};
setTimeout(setup, 600);

})();
