/* ============================================================
   DAMA (Damas chilenas) — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa en Aprender, Crear y Jugar (btnDama):
   - Tablero libre jugable (2 jugadores o vs rival automatico
     con 4 niveles: 🌱 Novato, 🧩 Aprendiz, ⚔️ Rival, 👑 Maestro),
     con reglas chilenas: captura obligatoria, multi-salto,
     peon que captura adelante y atras, dama larga (alfil) y
     coronacion. Gana quien deja sin piezas o bloquea al rival.
   - Aprender: ficha, dama, capturas, coronacion y notacion.
   - Tactica: 6 motivos + 8 puzzles (come y gana / corona)
     interactivos (Facil/Media/Dificil con filtro y progreso).
   - Salidas: 6 salidas clasicas paso a paso.
   - Mis partidas: bitacora privada y local por usuario.
   - Consejo lunar para entrenar la mente segun la fase.
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
  if ($('damaStyles')) return;
  var st = document.createElement('style');
  st.id = 'damaStyles';
  st.textContent = [
    '.dm-wrap{max-width:460px;margin:0 auto}',
    '.dm-board{display:grid;grid-template-columns:repeat(8,1fr);border:3px solid var(--gold);border-radius:10px;overflow:hidden;touch-action:manipulation;user-select:none}',
    '.dm-sq{aspect-ratio:1;border:0;padding:0;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center}',
    '.dm-light{background:#e9dcc3}',
    '.dm-dark{background:#7a5c3e}',
    '.dm-sq.dm-sel{outline:3px solid var(--gold);outline-offset:-3px}',
    '.dm-sq.dm-last{box-shadow:inset 0 0 0 3px rgba(232,197,106,.9)}',
    '.dm-dot{position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(46,160,67,.85);pointer-events:none}',
    '.dm-ring{position:absolute;inset:6%;border-radius:50%;border:3px solid rgba(231,76,60,.9);pointer-events:none}',
    '.dm-p{width:78%;height:78%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;box-shadow:0 2px 4px rgba(0,0,0,.45), inset 0 -3px 6px rgba(0,0,0,.25), inset 0 3px 5px rgba(255,255,255,.25);font-size:clamp(14px,4vw,22px)}',
    '.dm-w{background:radial-gradient(circle at 35% 30%,#fff,#e8d9b8 60%,#c9ab72);color:#5a3d1e;border:2px solid #8a6a3e}',
    '.dm-b{background:radial-gradient(circle at 35% 30%,#5a5a6a,#2b2b38 60%,#101018);color:#f0e6d2;border:2px solid #000}',
    '.dm-q{outline:3px solid var(--gold);outline-offset:-1px}',
    '.dm-coord{position:absolute;font-size:9px;font-weight:700;opacity:.75;pointer-events:none}',
    '.dm-rank{top:1px;left:3px}',
    '.dm-file{bottom:1px;right:4px}',
    '.dm-light .dm-coord{color:#7a5c3e}',
    '.dm-dark .dm-coord{color:#e9dcc3}',
    '.dm-moves{max-height:110px;overflow:auto;display:flex;flex-wrap:wrap;gap:4px}',
    '.dm-mv{background:var(--panel);border:1px solid var(--line);border-radius:7px;padding:2px 8px;font-size:12px}',
    '.dm-mini .dm-board{max-width:340px;margin:0 auto}'
  ].join('\n');
  document.head.appendChild(st);
}

/* ================= MOTOR DE DAMAS ================= */
var FILES = 'abcdefgh';
function SQ(r, f) { return r * 8 + f; }
function alg(sq) { return FILES[sq & 7] + (8 - (sq >> 3)); }
function parseAlg(a) {
  var f = FILES.indexOf(String(a || '').charAt(0).toLowerCase());
  var rank = parseInt(String(a || '').slice(1), 10);
  if (f < 0 || !(rank >= 1 && rank <= 8)) return -1;
  return (8 - rank) * 8 + f;
}
function inside(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }
function darkSq(sq) { return (((sq >> 3) + (sq & 7)) % 2) === 1; }
function opp(c) { return c === 'w' ? 'b' : 'w'; }
var DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

function initialState() {
  var b = new Array(64).fill(null);
  for (var r = 0; r < 3; r++) for (var f = 0; f < 8; f++) {
    if (((r + f) % 2) === 1) b[SQ(r, f)] = { t: 'm', c: 'b' };
  }
  for (var r2 = 5; r2 < 8; r2++) for (var f2 = 0; f2 < 8; f2++) {
    if (((r2 + f2) % 2) === 1) b[SQ(r2, f2)] = { t: 'm', c: 'w' };
  }
  return { b: b, turn: 'w', cont: -1, half: 0, full: 1 };
}
function cloneState(st) {
  return { b: st.b.slice(), turn: st.turn, cont: st.cont, half: st.half, full: st.full };
}
function posFromList(lista, turn) {
  var b = new Array(64).fill(null);
  lista.forEach(function (e) {
    var s = parseAlg(e[0]);
    if (s >= 0) b[s] = { t: e[2], c: e[1] };
  });
  return { b: b, turn: turn || 'w', cont: -1, half: 0, full: 1 };
}

/* Un salto (paso) simple desde s. Para la dama: largo alcance. */
function jumpsFrom(st, s) {
  var p = st.b[s];
  if (!p) return [];
  var r = s >> 3, f = s & 7, out = [], i;
  if (p.t === 'm') {
    for (i = 0; i < 4; i++) {
      var mr = r + DIRS[i][0], mf = f + DIRS[i][1];
      var lr = r + 2 * DIRS[i][0], lf = f + 2 * DIRS[i][1];
      if (!inside(lr, lf) || !inside(mr, mf)) continue;
      var mid = st.b[SQ(mr, mf)], land = st.b[SQ(lr, lf)];
      if (mid && mid.c !== p.c && !land) out.push({ from: s, to: SQ(lr, lf), cap: SQ(mr, mf) });
    }
  } else {
    for (i = 0; i < 4; i++) {
      var dr = DIRS[i][0], df = DIRS[i][1], step = 1, foe = -1;
      while (true) {
        var rr = r + dr * step, ff = f + df * step;
        if (!inside(rr, ff)) break;
        var q = st.b[SQ(rr, ff)];
        if (foe < 0) {
          if (!q) { step++; continue; }
          if (q.c === p.c) break;
          foe = SQ(rr, ff); step++; continue;
        } else {
          if (q) break;
          out.push({ from: s, to: SQ(rr, ff), cap: foe });
          step++;
        }
      }
    }
  }
  return out;
}
function quietsFrom(st, s) {
  var p = st.b[s];
  if (!p) return [];
  var r = s >> 3, f = s & 7, out = [], i;
  if (p.t === 'm') {
    var dr = p.c === 'w' ? -1 : 1;
    for (i = -1; i <= 1; i += 2) {
      var rr = r + dr, ff = f + i;
      if (!inside(rr, ff)) continue;
      if (!st.b[SQ(rr, ff)]) out.push({ from: s, to: SQ(rr, ff), cap: -1 });
    }
  } else {
    for (i = 0; i < 4; i++) {
      var ddr = DIRS[i][0], ddf = DIRS[i][1], stp = 1;
      while (true) {
        var r2 = r + ddr * stp, f2 = f + ddf * stp;
        if (!inside(r2, f2)) break;
        if (st.b[SQ(r2, f2)]) break;
        out.push({ from: s, to: SQ(r2, f2), cap: -1 });
        stp++;
      }
    }
  }
  return out;
}
/* Todos los pasos legales del turno (captura obligatoria). */
function allSteps(st) {
  if (st.cont >= 0) return jumpsFrom(st, st.cont);
  var caps = [];
  for (var s = 0; s < 64; s++) {
    var p = st.b[s];
    if (p && p.c === st.turn) {
      var j = jumpsFrom(st, s);
      for (var k = 0; k < j.length; k++) caps.push(j[k]);
    }
  }
  if (caps.length) return caps;
  var out = [];
  for (var s2 = 0; s2 < 64; s2++) {
    var p2 = st.b[s2];
    if (p2 && p2.c === st.turn) {
      var q2 = quietsFrom(st, s2);
      for (var k2 = 0; k2 < q2.length; k2++) out.push(q2[k2]);
    }
  }
  return out;
}
function stepsFrom(st, s) {
  var p = st.b[s];
  if (!p || p.c !== st.turn) return [];
  if (st.cont >= 0 && st.cont !== s) return [];
  var all = allSteps(st);
  var anyCap = false, i;
  for (i = 0; i < all.length; i++) if (all[i].cap >= 0) { anyCap = true; break; }
  if (st.cont >= 0) return jumpsFrom(st, s);
  if (anyCap) return jumpsFrom(st, s);
  return quietsFrom(st, s);
}
function lastRank(c) { return c === 'w' ? 0 : 7; }
function doStep(st, m) {
  var p = st.b[m.from];
  var undo = { from: m.from, to: m.to, piece: p, captured: null, capSq: m.cap, wasQueen: p.t === 'q', prevCont: st.cont, prevTurn: st.turn, prevHalf: st.half, prevFull: st.full, crowned: false };
  if (m.cap >= 0 && st.b[m.cap]) { undo.captured = st.b[m.cap]; st.b[m.cap] = null; }
  st.b[m.to] = p; st.b[m.from] = null;
  var crowned = false;
  if (p.t === 'm' && (m.to >> 3) === lastRank(p.c)) { st.b[m.to] = { t: 'q', c: p.c }; crowned = true; }
  undo.crowned = crowned;
  if (m.cap >= 0 || crowned) st.half = 0; else st.half++;
  if (m.cap >= 0 && !crowned && jumpsFrom(st, m.to).length) {
    st.cont = m.to; // multi-salto: sigue la misma pieza, mismo turno
  } else {
    st.cont = -1;
    if (st.turn === 'b') st.full++;
    st.turn = opp(st.turn);
  }
  return undo;
}
function undoStep(st, m, undo) {
  st.turn = undo.prevTurn; st.cont = undo.prevCont; st.half = undo.prevHalf; st.full = undo.prevFull;
  st.b[m.from] = undo.piece;
  st.b[m.to] = null;
  if (undo.captured) st.b[undo.capSq] = undo.captured;
}
function countPieces(st) {
  var w = 0, b = 0, wq = 0, bq = 0;
  st.b.forEach(function (p) {
    if (!p) return;
    if (p.c === 'w') { w++; if (p.t === 'q') wq++; } else { b++; if (p.t === 'q') bq++; }
  });
  return { w: w, b: b, wq: wq, bq: bq };
}
function gameStatus(st) {
  var c = countPieces(st);
  if (c.w === 0) return { over: true, result: '0-1', reason: 'Sin fichas blancas 🏆 — ganan las negras' };
  if (c.b === 0) return { over: true, result: '1-0', reason: 'Sin fichas negras 🏆 — ganan las blancas' };
  var mv = allSteps(st);
  if (!mv.length) {
    return { over: true, result: st.turn === 'w' ? '0-1' : '1-0', reason: 'Bloqueo total 🧱 — ' + (st.turn === 'w' ? 'blancas' : 'negras') + ' sin jugadas, ganan las ' + (st.turn === 'w' ? 'negras' : 'blancas') };
  }
  if (st.half >= 80) return { over: true, result: '½-½', reason: 'Tablas por 40 jugadas sin captura ni corona 🤝' };
  var anyCap = false;
  for (var i = 0; i < mv.length; i++) if (mv[i].cap >= 0) { anyCap = true; break; }
  return { over: false, mustCapture: anyCap, cont: st.cont >= 0 };
}
function stepSAN(st, m, crowned) {
  var sep = m.cap >= 0 ? 'x' : '-';
  var s = alg(m.from) + sep + alg(m.to);
  if (crowned) s += '=D';
  return s;
}

/* ================= RIVAL AUTOMATICO (4 niveles) ================= */
var DM_NIVELES = [
  { id: 0, n: '👥 Dos jugadores', d: 'Juega con alguien al lado, pasando el dispositivo.' },
  { id: 1, n: '🌱 Novato', d: 'Juega casi al azar, a veces come. Ideal para tu primera victoria.' },
  { id: 2, n: '🧩 Aprendiz', d: 'Siempre come cuando puede y avanza a dama. Castiga piezas colgadas.' },
  { id: 3, n: '⚔️ Rival', d: 'Piensa 4 jugadas adelante: arma golpes y cuida su corona.' },
  { id: 4, n: '👑 Maestro', d: 'Piensa 6 jugadas con posicion: centro, coronacion y finales. Un verdadero examen.' }
];
function dmEval(st) {
  var s = 0;
  for (var i = 0; i < 64; i++) {
    var p = st.b[i];
    if (!p) continue;
    var r = i >> 3, f = i & 7;
    var v = 0;
    if (p.t === 'm') {
      v = 100 + (p.c === 'w' ? (7 - r) * 5 : r * 5);
      var c = Math.min(f, 7 - f);
      v += c * 3;
      if (p.c === 'w' && r >= 6) v += 8;
      if (p.c === 'b' && r <= 1) v += 8;
    } else {
      var cc = Math.min(f, 7 - f) + Math.min(r, 7 - r);
      v = 300 + cc * 3;
    }
    s += (p.c === 'w' ? v : -v);
  }
  return s;
}
function dmOrder(moves, st) {
  var scored = moves.map(function (m) {
    var v = 0;
    if (m.cap >= 0) {
      var victim = st.b[m.cap];
      v += 1000 + (victim ? (victim.t === 'q' ? 300 : 100) : 100);
    }
    var p = st.b[m.from];
    if (p && p.t === 'm' && (m.to >> 3) === lastRank(p.c)) v += 500;
    return { m: m, v: v };
  });
  scored.sort(function (a, b) { return b.v - a.v; });
  return scored.map(function (x) { return x.m; });
}
var DM_NODES = 0, DM_DEADLINE = 0;
function dmQuies(st, alpha, beta, qd) {
  DM_NODES++;
  if (DM_NODES % 512 === 0 && Date.now() > DM_DEADLINE) return dmEval(st);
  var gs = gameStatus(st);
  if (gs.over) {
    if (gs.result === '1-0') return 100000;
    if (gs.result === '0-1') return -100000;
    return 0;
  }
  var stand = dmEval(st);
  if (qd <= 0) return stand;
  var moves = dmOrder(allSteps(st).filter(function (m) { return m.cap >= 0; }), st);
  if (!moves.length) return stand;
  var i, sc;
  if (st.turn === 'w') {
    if (stand > alpha) alpha = stand;
    if (alpha >= beta) return alpha;
    for (i = 0; i < moves.length; i++) {
      var u = doStep(st, moves[i]);
      sc = dmQuies(st, alpha, beta, qd - 1);
      undoStep(st, moves[i], u);
      if (sc > alpha) alpha = sc;
      if (alpha >= beta) break;
    }
    return alpha;
  } else {
    if (stand < beta) beta = stand;
    if (alpha >= beta) return beta;
    for (i = 0; i < moves.length; i++) {
      var u2 = doStep(st, moves[i]);
      sc = dmQuies(st, alpha, beta, qd - 1);
      undoStep(st, moves[i], u2);
      if (sc < beta) beta = sc;
      if (alpha >= beta) break;
    }
    return beta;
  }
}
function dmSearch(st, depth, alpha, beta) {
  DM_NODES++;
  if (DM_NODES % 512 === 0 && Date.now() > DM_DEADLINE) return dmEval(st);
  var gs = gameStatus(st);
  if (gs.over) {
    if (gs.result === '1-0') return 100000 + depth;
    if (gs.result === '0-1') return -100000 - depth;
    return 0;
  }
  if (depth <= 0) return dmQuies(st, alpha, beta, 4);
  var moves = dmOrder(allSteps(st), st);
  if (!moves.length) return dmEval(st);
  var i, sc;
  if (st.turn === 'w') {
    var best = -Infinity;
    for (i = 0; i < moves.length; i++) {
      var u = doStep(st, moves[i]);
      sc = dmSearch(st, depth - 1, alpha, beta);
      undoStep(st, moves[i], u);
      if (sc > best) best = sc;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    var bestB = Infinity;
    for (i = 0; i < moves.length; i++) {
      var u2 = doStep(st, moves[i]);
      sc = dmSearch(st, depth - 1, alpha, beta);
      undoStep(st, moves[i], u2);
      if (sc < bestB) bestB = sc;
      if (bestB < beta) beta = bestB;
      if (alpha >= beta) break;
    }
    return bestB;
  }
}
function dmBest(st, depth, ms) {
  var moves = dmOrder(allSteps(st), st);
  if (!moves.length) return null;
  DM_NODES = 0; DM_DEADLINE = Date.now() + (ms || 900);
  var black = st.turn === 'b';
  var best = moves[0], bestSc = black ? Infinity : -Infinity, scored = [];
  for (var i = 0; i < moves.length; i++) {
    var u = doStep(st, moves[i]);
    var sc = dmSearch(st, depth - 1, -Infinity, Infinity);
    undoStep(st, moves[i], u);
    scored.push({ m: moves[i], sc: sc });
    if (black ? sc < bestSc : sc > bestSc) { bestSc = sc; best = moves[i]; }
    if (Date.now() > DM_DEADLINE) break;
  }
  return { best: best, scored: scored, score: bestSc };
}
function dmPickMove(st, nivel) {
  var all = allSteps(st);
  if (!all.length) return null;
  if (nivel <= 1) {
    var caps = all.filter(function (x) { return x.cap >= 0; });
    var pool = caps.length && Math.random() < 0.7 ? caps : all;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (nivel === 2) {
    if (Math.random() < 0.15) return all[Math.floor(Math.random() * all.length)];
    var black = st.turn === 'b', bi = -1, bs = black ? Infinity : -Infinity, i;
    for (i = 0; i < all.length; i++) {
      var u = doStep(st, all[i]);
      var sc = dmEval(st);
      undoStep(st, all[i], u);
      if (black ? sc < bs : sc > bs) { bs = sc; bi = i; }
    }
    return all[Math.max(0, bi)];
  }
  var depth = nivel === 3 ? 4 : 6;
  var res = dmBest(st, depth, nivel === 3 ? 700 : 1200);
  if (!res || !res.best) return all[0];
  if (nivel === 3 && res.scored.length > 1 && Math.random() < 0.12) {
    var blk = st.turn === 'b';
    var s = res.scored.slice().sort(function (a, b2) { return blk ? a.sc - b2.sc : b2.sc - a.sc; }).slice(0, 3);
    return s[Math.floor(Math.random() * s.length)].m;
  }
  return res.best;
}
function dmNivelNombre(id) {
  for (var i = 0; i < DM_NIVELES.length; i++) if (DM_NIVELES[i].id === id) return DM_NIVELES[i].n;
  return '👥 Dos jugadores';
}

/* ================= CONTENIDO ================= */
var PIEZAS = [
  { g: '⚪', n: 'Ficha (peón)', v: '1 punto', m: 'Avanza 1 casilla en diagonal hacia adelante, siempre por casillas oscuras. No retrocede caminando.', t: 'El alma del juego. Las fichas sanas y avanzadas ganan finales.' },
  { g: '👑', n: 'Dama', v: '3 puntos', m: 'Nace al coronar: mueve como alfil, todas las casillas que quiera en diagonal. Come a distancia, saltando una pieza con hueco detrás.', t: 'Una dama activa vale por tres fichas. ¡Corona cuanto antes!' },
  { g: '⚔️', n: 'Captura valiente', v: 'obligatoria', m: 'La ficha captura saltando por encima, adelante Y atrás. Si puedes comer, DEBES comer. El multi-salto sigue con la misma pieza.', t: 'Cuenta siempre: “¿qué me come si muevo aquí?”.' },
  { g: '🎖️', n: 'Coronación', v: 'premio', m: 'Ficha que llega al fondo (fila 8 rival) se convierte en Dama en el acto y termina su turno. ¡Un peón puede decidir la partida!', t: 'Avanza peones protegidos: uno corona, los demás cuidan.' }
];
var REGLAS = [
  { t: '🎯 Objetivo', d: 'Dejar al rival sin fichas o sin jugadas (bloqueo). No se “perdona”: la partida termina cuando no hay qué mover.' },
  { t: '⚪⚫ Turnos', d: 'Blancas siempre parten. Se juega solo por casillas oscuras. 1 paso por turno, salvo multi-salto que sigue con la misma pieza.' },
  { t: '⚔️ Comer es obligatorio', d: 'Si tienes al menos una captura, DEBES elegir una de ellas (la que quieras). El tablero te las marca con anillo rojo ⭕.' },
  { t: '🔗 Multi-salto', d: 'Tras comer, si la misma pieza puede seguir comiendo, DEBE seguir. La dama encadena saltos largos igual que la ficha los cortos.' },
  { t: '🎖️ Coronación', d: 'Al pisar la última fila coronas y tu turno termina ahí (aunque la dama nueva “vería” más capturas). Desde tu próximo turno vuelas como alfil.' },
  { t: '🧱 Bloqueo también gana', d: 'Si el rival tiene fichas pero ninguna se puede mover en su turno, pierde igual. Encerrar vale tanto como comer.' },
  { t: '🤝 Tablas', d: 'Acuerdo mutuo, o 40 jugadas sin captura ni corona. Con damas solas, busca el encierro antes que el paseo.' },
  { t: '⏱️ Tres reglas de oro', d: '1) No dejes fichas “colgadas” (sin defensa). 2) Avanza con parejas que se cuidan. 3) Corona por los bordes, donde hay menos golpes.' }
];
var MOTIVOS = [
  { n: '🎁 El regalo (sacrificio)', d: 'Entregas 1 ficha para que el rival quede obligado a comer… y tu siguiente salto come 2 o corona. Lo obligado es predecible: úsalo.' },
  { n: '👑 Golpe de dama', d: 'Tu dama a distancia salta una pieza con hueco detrás. Mira diagonales largas: la víctima ni la ve venir.' },
  { n: '🎖️ Carrera de coronación', d: 'Peón avanzado + rival lejos = dama gratis. Cuenta los tiempos: si llegas antes de que te alcancen, corre.' },
  { n: '🧱 El encierro', d: 'Sin comer todo se gana: arrincona la última ficha rival contra el borde hasta que no tenga paso. Bloqueo = victoria.' },
  { n: '🔗 Cadena (multi-salto)', d: 'Un solo salto que encadena 2 o 3 capturas. Antes de comer, mira dónde aterrizas: la cadena se arma desde el final.' },
  { n: '🪤 La trampa del borde', d: 'El borde es refugio y es cárcel: la ficha de orilla tiene la mitad de escapes. Lleva al rival hacia su orilla y ciérrala con tu dama.' }
];
function sqList(arr) {
  return arr.map(function (e) { return { s: parseAlg(e[0]), c: e[1], t: e[2] }; });
}
var PUZZLES = [
  { id: 'golpe1', n: '1 · El primer golpe', tema: 'Captura simple', dif: 'Fácil ⭐', d: 'Negras dejaron una ficha colgada. Come y empieza la fiesta. Juegan blancas.', piezas: [['g1', 'w', 'm'], ['c3', 'w', 'm'], ['h2', 'w', 'm'], ['e8', 'b', 'm'], ['d4', 'b', 'm'], ['a5', 'b', 'm']], turn: 'w', sol: [{ from: 'c3', to: 'e5' }], pista: 'c3 se come a d4 y aterriza en e5.' },
  { id: 'doble', n: '2 · Doble salto', tema: 'Multi-salto', dif: 'Fácil ⭐', d: 'Dos fichas en línea y tu salto las encadena. Juegan blancas: come las dos.', piezas: [['g1', 'w', 'm'], ['c3', 'w', 'm'], ['d4', 'b', 'm'], ['f6', 'b', 'm'], ['e8', 'b', 'm'], ['a7', 'b', 'm']], turn: 'w', sol: [{ from: 'c3', to: 'e5' }, { from: 'e5', to: 'g7' }], pista: 'c3xe5 y SIN SOLTAR sigue e5xg7. El multi-salto es obligatorio.' },
  { id: 'corona', n: '3 · Corona ya', tema: 'Coronación', dif: 'Fácil ⭐', d: 'Comiendo coronas en la misma jugada. Juegan blancas.', piezas: [['g1', 'w', 'm'], ['f6', 'w', 'm'], ['g7', 'b', 'm'], ['e8', 'b', 'm'], ['a3', 'b', 'm']], turn: 'w', sol: [{ from: 'f6', to: 'h8' }], pista: 'f6 salta a g7 y aterriza en h8 coronando (=D).' },
  { id: 'dama-castiga', n: '4 · La dama castiga', tema: 'Dama larga', dif: 'Media ⭐⭐', d: 'Tu dama mira toda la diagonal. Cobra a distancia. Juegan blancas.', piezas: [['g1', 'w', 'm'], ['c1', 'w', 'q'], ['e3', 'b', 'm'], ['g5', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', sol: [{ from: 'c1', to: 'f4' }, { from: 'f4', to: 'h6' }], pista: 'Dama c1 salta e3 hasta f4… y desde ahí salta g5 hasta h6.' },
  { id: 'regalo', n: '5 · El regalo', tema: 'Sacrificio', dif: 'Media ⭐⭐', d: 'Parece que pierdes una… pero la cadena come dos. Juegan blancas.', piezas: [['g1', 'w', 'm'], ['e3', 'w', 'm'], ['g3', 'w', 'm'], ['d4', 'b', 'm'], ['f4', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', sol: [{ from: 'e3', to: 'g5' }], pista: 'e3 salta f4 hasta g5: la cadena manda.' },
  { id: 'borde', n: '6 · Trampa del borde', tema: 'Borde', dif: 'Media ⭐⭐', d: 'La ficha de orilla tiene medio escape. Cázala. Juegan blancas.', piezas: [['g1', 'w', 'm'], ['d2', 'w', 'q'], ['h4', 'b', 'm'], ['e8', 'b', 'm'], ['a5', 'b', 'm']], turn: 'w', sol: [{ from: 'd2', to: 'g5' }], pista: 'Dama d2 por la diagonal hasta g5: salta y cae sobre h4.' },
  { id: 'cadena3', n: '7 · La gran cadena', tema: 'Triple salto', dif: 'Difícil ⭐⭐⭐', d: 'Tres víctimas alineadas para tu dama. Calcúlala completa. Juegan blancas.', piezas: [['g1', 'w', 'm'], ['a1', 'w', 'q'], ['b2', 'b', 'm'], ['d4', 'b', 'm'], ['f6', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', sol: [{ from: 'a1', to: 'c3' }, { from: 'c3', to: 'e5' }, { from: 'e5', to: 'g7' }], pista: 'a1 salta b2 (a c3), luego d4 (a e5), luego f6 (a g7). Tres saltos.' },
  { id: 'cierre', n: '8 · Cierre final', tema: 'Bloqueo', dif: 'Difícil ⭐⭐⭐', d: 'No hace falta comerlo todo: este salto deja al rival sin pasos. Juegan blancas.', piezas: [['g1', 'w', 'm'], ['c5', 'w', 'q'], ['a7', 'b', 'm'], ['b8', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', sol: [{ from: 'c5', to: 'b6' }], pista: 'Dama c5-b6: domina la esquina y encierra.' }
];
var SALIDAS = [
  { n: '🌱 Clásica 11-15', mov: '1. c3-d4 d6-c5', seq: [['c3', 'd4'], ['d6', 'c5']], idea: 'Control del centro desde el inicio. La más jugada para aprender: fichas al centro, parejas que se cuidan.', nivel: 'Principiante ⭐', plan: 'Sigue con e3-f4 o b2-c3: completa el centro y no regales la dama rival.' },
  { n: '🛡️ Muro de piedra', mov: '1. c3-d4 f6-e5 2. d4xf6 g7xe5', seq: [['c3', 'd4'], ['f6', 'e5'], ['d4', 'f6'], ['g7', 'e5']], idea: 'Cambio central obligado: aprendes la regla de oro (comer es obligatorio) desde la salida. Tras los cambios, el centro queda abierto.', nivel: 'Principiante ⭐', plan: 'Después del cambio, ocupa el centro con e3-f4 y mantén la fila de atrás completa: es tu seguro.' },
  { n: '⚔️ Cruce del centro', mov: '1. e3-f4 f6-e5', seq: [['e3', 'f4'], ['f6', 'e5']], idea: 'Choque inmediato en el centro: quien calcula mejor el cambio, queda mejor. Filosa y divertida.', nivel: 'Intermedio ⭐⭐', plan: 'Cuenta cada cambio antes de cruzar: “como 1, me comen 1… ¿y después?”.' },
  { n: '🌊 Ataque al flanco', mov: '1. a3-b4 b6-a5 2. b4-c5', seq: [['a3', 'b4'], ['b6', 'a5'], ['b4', 'c5']], idea: 'Presión lateral para abrir la corona por el borde. El rival debe gastar tiempos defendiendo.', nivel: 'Intermedio ⭐⭐', plan: 'Si te responden …d6xb4, recaptura con tu otra ficha y quedas centralizado.' },
  { n: '🎁 Gambito de ficha', mov: '1. c3-b4 d6-e5 2. b4-a5', seq: [['c3', 'b4'], ['d6', 'e5'], ['b4', 'a5']], idea: 'Regalas un tiempo por ataque: la ficha de punta molesta y abre diagonales de dama. Solo para valientes.', nivel: 'Avanzado ⭐⭐⭐', plan: 'Si aceptan el regalo, la cadena de vuelta come doble. Calcula 3 saltos antes de ofrecerla.' },
  { n: '👑 Carrera de coronas', mov: '1. g3-f4 f6-g5 2. h2-g3 g5-h4', seq: [['g3', 'f4'], ['f6', 'g5'], ['h2', 'g3'], ['g5', 'h4']], idea: 'Los dos corren por su orilla: gana quien corona primero y baja a ayudar. Pura cuenta de tiempos.', nivel: 'Avanzado ⭐⭐⭐', plan: 'Frena la carrera rival con 1 sacrificio a tiempo: una ficha frena dos turnos.' }
];
var DM_DEMOS = [
  { piezas: [['g1', 'w', 'm'], ['c3', 'w', 'm'], ['d4', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', seq: [['c3', 'e5']], jugada: 'c3xe5', nota: 'El regalo: entregas el salto y quedas mejor. Lo obligado se provoca.' },
  { piezas: [['g1', 'w', 'm'], ['c1', 'w', 'q'], ['e3', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', seq: [['c1', 'f4']], jugada: 'Dc1xf4', nota: 'Golpe de dama: salta a distancia con hueco detrás.' },
  { piezas: [['g1', 'w', 'm'], ['f6', 'w', 'm'], ['g7', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', seq: [['f6', 'h8']], jugada: 'f6xh8=D', nota: 'Carrera de coronación: comer y coronar en el mismo salto.' },
  { piezas: [['g1', 'w', 'm'], ['c5', 'w', 'q'], ['a7', 'b', 'm'], ['b8', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', seq: [['c5', 'b6']], jugada: 'Dc5-b6', nota: 'El encierro: sin comerlo todo, lo dejas sin pasos y ganas igual.' },
  { piezas: [['g1', 'w', 'm'], ['c3', 'w', 'm'], ['d4', 'b', 'm'], ['f6', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', seq: [['c3', 'e5'], ['e5', 'g7']], jugada: 'c3xe5xg7', nota: 'Cadena: un salto que encadena dos capturas. Mira el aterrizaje final.' },
  { piezas: [['g1', 'w', 'm'], ['d2', 'w', 'q'], ['h4', 'b', 'm'], ['e8', 'b', 'm']], turn: 'w', seq: [['d2', 'g5']], jugada: 'Dd2xg5', nota: 'Trampa del borde: la ficha de orilla tiene medio escape.' }
];
var LUNA_TIPS = [
  { f: '🌑 Luna nueva', t: 'Tiempo de estudiar: repasa 1 salida y 1 motivo táctico sin apuro, como sembrar.' },
  { f: '🌒 Creciente', t: 'Entrena puzzles fáciles y juega partidas rápidas. La energía sube: ataca y practica.' },
  { f: '🌓 Cuarto creciente', t: 'Mitad del camino: repasa tus partidas anotadas y corrige 1 error recurrente.' },
  { f: '🌔 Gibosa', t: 'Profundiza: practica 1 final (dama contra 2 fichas) hasta hacerlo con los ojos cerrados.' },
  { f: '🌕 Luna llena', t: '¡A jugar! Partida completa con calma y anotación. La mente está plena: compite o enseña a alguien.' },
  { f: '🌖 Menguante', t: 'Analiza sin juicio: ¿dónde regalaste fichas? Anota 3 aprendizajes en tu bitácora.' },
  { f: '🌗 Cuarto menguante', t: 'Juego lento y encierros: menos golpes, más paciencia. Bueno para practicar bloqueo.' },
  { f: '🌘 Casi nueva', t: 'Descansa la mente: mira 1 partida famosa comentada y duerme bien. El cerebro consolida durmiendo.' }
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

/* ================= ESTADO UI ================= */
var TAB = 'jugar';
var G = null;
var Ghist = [];   // {move:{from,to,cap}, san, undo, crowned}
var Gsel = -1, Gmoves = [], Glast = null, Gflip = false;
var Gnivel = 0;
var Gpensando = false;
var PZ = null, PZsel = -1, PZmoves = [], PZidx = 0, PZdone = false, PZstep = 0;
var PZfiltro = 'Todos';
function dmEsAuto() { return Gnivel > 0; }
function newFreeGame() {
  G = initialState();
  Ghist = []; Gsel = -1; Gmoves = []; Glast = null;
}
function statsDef() { return { jugadas: 0, ganadas: 0, puzzles: {}, nivel: 0 }; }
function getStats() {
  var s = store('damaStats', null);
  if (!s || typeof s !== 'object') { s = statsDef(); try { var u = userData(); u.damaStats = s; } catch (e) {} }
  if (!s.puzzles) s.puzzles = {};
  return s;
}
function getPartidas() { var a = store('damaPartidas', []); return Array.isArray(a) ? a : []; }
function getSaved() { return store('damaCurrent', null); }
function persistCurrent() {
  try {
    var u = userData();
    if (!G) { u.damaCurrent = null; }
    else {
      u.damaCurrent = { b: G.b, turn: G.turn, cont: G.cont, half: G.half, full: G.full, hist: Ghist.map(function (h) { return { from: h.move.from, to: h.move.to, cap: h.move.cap, san: h.san, crowned: !!h.crowned }; }) };
    }
    save();
  } catch (e) {}
}
function restoreCurrent(sv) {
  G = { b: sv.b.slice(), turn: sv.turn === 'b' ? 'b' : 'w', cont: (sv.cont == null ? -1 : sv.cont), half: sv.half || 0, full: sv.full || 1 };
  Ghist = [];
  (sv.hist || []).forEach(function (h) {
    var m = { from: h.from, to: h.to, cap: h.cap };
    var undo = doStep(G, m);
    void undo;
    Ghist.push({ move: m, san: h.san || stepSAN(G, m, h.crowned), undo: null, crowned: !!h.crowned });
  });
  // Re-jugar para undo real (los undo guardados no sirven tras recargar):
  var steps = (sv.hist || []).map(function (h) { return { from: h.from, to: h.to, cap: h.cap }; });
  G = { b: sv.b ? initialState().b : initialState().b, turn: 'w', cont: -1, half: 0, full: 1 };
  Ghist = []; Gsel = -1; Gmoves = []; Glast = null;
  // Reconstruye desde el inicio aplicando pasos sobre un clon del tablero guardado:
  // (simple y seguro: parte del tablero guardado y solo rearma el historial visible)
  G = { b: sv.b.slice(), turn: sv.turn === 'b' ? 'b' : 'w', cont: (sv.cont == null ? -1 : sv.cont), half: sv.half || 0, full: sv.full || 1 };
  Ghist = (sv.hist || []).map(function (h) { return { move: { from: h.from, to: h.to, cap: h.cap }, san: h.san, undo: null, crowned: !!h.crowned }; });
  if (Ghist.length) { var l = Ghist[Ghist.length - 1].move; Glast = { from: l.from, to: l.to }; }
}

/* ================= RENDER: TABLERO ================= */
function boardHTML(st, opts) {
  opts = opts || {};
  var sel = opts.sel, moves = opts.moves || [], last = opts.last;
  var destMap = {}, capMap = {};
  moves.forEach(function (m) { if (st.b[m.to]) return; if (m.cap >= 0) capMap[m.to] = 1; else destMap[m.to] = 1; });
  var gs = null;
  try { gs = gameStatus(st); } catch (e) { gs = null; }
  var h = '<div class="dm-board" role="grid" aria-label="Tablero de damas">';
  for (var dr = 0; dr < 8; dr++) {
    var r = opts.flip ? 7 - dr : dr;
    for (var dc = 0; dc < 8; dc++) {
      var f = opts.flip ? 7 - dc : dc;
      var s = SQ(r, f);
      var isDark = ((r + f) % 2) === 1;
      var cls = 'dm-sq ' + (isDark ? 'dm-dark' : 'dm-light');
      if (s === sel) cls += ' dm-sel';
      if (last && (s === last.from || s === last.to)) cls += ' dm-last';
      var p = st.b[s];
      var inner = '';
      if (p) {
        var isQ = p.t === 'q';
        inner = '<span class="dm-p ' + (p.c === 'w' ? 'dm-w' : 'dm-b') + (isQ ? ' dm-q' : '') + '" aria-hidden="true">' + (isQ ? '♛' : '●') + '</span>';
      } else if (capMap[s]) inner = '<span class="dm-ring"></span>';
      else if (destMap[s]) inner = '<span class="dm-dot"></span>';
      var coord = '';
      if (dc === 0) coord += '<span class="dm-coord dm-rank">' + (8 - r) + '</span>';
      if (dr === 7) coord += '<span class="dm-coord dm-file">' + FILES[f] + '</span>';
      h += '<button type="button" class="' + cls + '" data-sq="' + s + '" aria-label="' + alg(s) + (p ? (p.c === 'w' ? (p.t === 'q' ? ' dama blanca' : ' ficha blanca') : (p.t === 'q' ? ' dama negra' : ' ficha negra')) : (isDark ? '' : ' casilla clara')) + '">' + inner + coord + '</button>';
    }
  }
  return h + '</div>';
}
function bindBoard(boxId, onPick) {
  var box = $(boxId);
  if (!box) return;
  box.querySelectorAll('[data-sq]').forEach(function (el) {
    el.onclick = function () { onPick(parseInt(el.getAttribute('data-sq'), 10)); };
  });
}
function materialTxt(st) {
  var c = countPieces(st);
  return '⚪ ' + c.w + ' (👑' + c.wq + ') · ⚫ ' + c.b + ' (👑' + c.bq + ')';
}

/* ---- partida libre ---- */
function renderFree() {
  var box = $('dmBoardBox');
  if (!box || !G) return;
  var st = gameStatus(G);
  box.innerHTML = boardHTML(G, { sel: Gsel, moves: Gmoves, last: Glast, flip: Gflip });
  bindBoard('dmBoardBox', pickFree);
  var info = $('dmStatusBox');
  if (info) {
    var t = '<div class="chip su-8c0a82">';
    t += (G.turn === 'w' ? '⚪ Juegan <b>blancas</b>' : '⚫ Juegan <b>negras</b>');
    t += ' · <span class="muted su-11a508">' + esc(dmNivelNombre(Gnivel)) + '</span>';
    if (Gpensando) t += ' · <b>🤔 pensando…</b>';
    else if (st.over) t += ' · <b>' + esc(st.reason) + '</b> (' + esc(st.result) + ')';
    else if (st.cont) t += ' · <b class="su-23dd39">🔗 ¡Sigue el multi-salto con la misma pieza!</b>';
    else if (st.mustCapture) t += ' · <b class="su-23dd39">⚔️ ¡Captura obligatoria!</b>';
    t += '<br><span class="muted su-11a508">' + esc(materialTxt(G)) + ' · Jugada ' + G.full + '</span>';
    t += '</div>';
    info.innerHTML = t;
  }
  var ml = $('dmMovesBox');
  if (ml) {
    if (!Ghist.length) ml.innerHTML = '<span class="muted su-11a508">Sin jugadas aún. Toca una ficha y luego su destino (⭕ = captura obligada).</span>';
    else {
      var h = '', seq = '';
      for (var i = 0; i < Ghist.length; i++) {
        var san = Ghist[i].san;
        if (i === 0 || Ghist[i].move.cap < 0 || Ghist[i - 1].move.to !== Ghist[i].move.from || Ghist[i - 1].move.cap < 0) {
          if (seq) h += '<span class="dm-mv">' + esc(seq) + '</span>';
          seq = san;
          if (Ghist[i].move.cap < 0) { h += '<span class="dm-mv">' + esc(seq) + '</span>'; seq = ''; }
        } else {
          seq += 'x' + alg(Ghist[i].move.to) + (Ghist[i].crowned ? '=D' : '');
        }
      }
      if (seq) h += '<span class="dm-mv">' + esc(seq) + '</span>';
      ml.innerHTML = h;
      ml.scrollTop = ml.scrollHeight;
    }
  }
  var fl = $('dmFlipBtn');
  if (fl) fl.textContent = Gflip ? '🔄 Ver desde blancas' : '🔄 Ver desde negras';
}
function pickFree(s) {
  if (!G || Gpensando) return;
  var st = gameStatus(G);
  if (st.over) return;
  if (Gsel >= 0) {
    for (var i = 0; i < Gmoves.length; i++) {
      if (Gmoves[i].to === s) { playStep(Gmoves[i]); return; }
    }
  }
  var p = G.b[s];
  if (p && p.c === G.turn) {
    if (dmEsAuto() && G.turn === 'b') return;
    Gsel = s;
    Gmoves = stepsFrom(G, s);
    if (!Gmoves.length) { try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {} }
  } else { Gsel = -1; Gmoves = []; }
  renderFree();
}
function playStep(m) {
  var san = stepSAN(G, m, false);
  var piece = G.b[m.from];
  var willCrown = piece && piece.t === 'm' && (m.to >> 3) === lastRank(piece.c);
  if (willCrown) san += '=D';
  var undo = doStep(G, m);
  Ghist.push({ move: { from: m.from, to: m.to, cap: m.cap }, san: san, undo: undo, crowned: willCrown });
  Glast = { from: m.from, to: m.to };
  Gsel = -1; Gmoves = [];
  // Si hay multi-salto pendiente, preselecciona la pieza para seguir
  var gs = gameStatus(G);
  if (!gs.over && G.cont >= 0) { Gsel = G.cont; Gmoves = stepsFrom(G, G.cont); }
  try { var s2 = getStats(); s2.jugadas++; var u = userData(); u.damaStats = s2; } catch (e) {}
  persistCurrent();
  renderFree();
  if (gs.over) {
    try {
      var st = getStats();
      if ((gs.result === '1-0' && true)) { }
      var u2 = userData(); u2.damaStats = st; save('Partida terminada: ' + gs.result);
    } catch (e2) {}
    save('Partida terminada: ' + gs.result);
    return;
  }
  if (dmEsAuto() && G.turn === 'b') {
    Gpensando = true; renderFree();
    var niv = Gnivel;
    setTimeout(function () {
      Gpensando = false;
      var dlg = $('damaDialog');
      if (!G || (dlg && !dlg.open)) return;
      if (gameStatus(G).over) { renderFree(); return; }
      var pick = null;
      try { pick = dmPickMove(G, niv); } catch (e3) { pick = null; }
      if (!pick) {
        var all = allSteps(G);
        if (!all.length) { renderFree(); return; }
        pick = all[Math.floor(Math.random() * all.length)];
      }
      playStep(pick);
      // El autómata también encadena su multi-salto solo
      (function chain() {
        if (!G || gameStatus(G).over) return;
        if (G.turn === 'b' && G.cont >= 0 && dmEsAuto()) {
          Gpensando = true; renderFree();
          setTimeout(function () {
            Gpensando = false;
            if (!G || gameStatus(G).over) { renderFree(); return; }
            var nx = null;
            try { nx = dmPickMove(G, niv); } catch (e4) { nx = null; }
            if (!nx) { var a2 = allSteps(G); if (!a2.length) { renderFree(); return; } nx = a2[0]; }
            playStep(nx);
            chain();
          }, 450);
        }
      })();
    }, 500);
  }
}
function undoFree() {
  if (Gpensando || !Ghist.length) return;
  // Deshace la secuencia completa del último turno (incluye multi-salto)
  var steps = 1;
  for (var i = Ghist.length - 1; i > 0; i--) {
    var cur = Ghist[i], prev = Ghist[i - 1];
    if (cur.move.cap >= 0 && prev.move.cap >= 0 && cur.move.from === prev.move.to) steps++;
    else break;
  }
  for (var k = 0; k < steps; k++) {
    var h = Ghist.pop();
    if (h && h.undo) undoStep(G, h.move, h.undo);
    else break;
  }
  // Si juega el autómata, deshace también su turno completo anterior
  if (dmEsAuto() && Ghist.length) {
    var steps2 = 1;
    for (var j = Ghist.length - 1; j > 0; j--) {
      var c2 = Ghist[j], p2 = Ghist[j - 1];
      if (c2.move.cap >= 0 && p2.move.cap >= 0 && c2.move.from === p2.move.to) steps2++;
      else break;
    }
    // Solo si el último en historial fue de negras (el autómata)
    // (aprox: deshace 1 turno más para devolverle el turno a blancas)
    for (var k2 = 0; k2 < steps2; k2++) {
      var h2 = Ghist.pop();
      if (h2 && h2.undo) undoStep(G, h2.move, h2.undo);
      else { if (h2) Ghist.push(h2); break; }
    }
    // Si quedó a medio reconstruir (sin undo por recarga), reinicia limpio
    if (G.cont !== -1 && !allSteps(G).length) { G.cont = -1; }
  }
  Glast = Ghist.length ? { from: Ghist[Ghist.length - 1].move.from, to: Ghist[Ghist.length - 1].move.to } : null;
  Gsel = -1; Gmoves = [];
  persistCurrent();
  renderFree();
}

/* ---- puzzles ---- */
function loadPuzzle(i) {
  PZidx = i; PZdone = false; PZsel = -1; PZmoves = []; PZstep = 0;
  var P = PUZZLES[i];
  PZ = posFromList(P.piezas, P.turn);
  renderPuzzle();
}
function renderPuzzle() {
  var P = PUZZLES[PZidx];
  var box = $('dmPuzBoard');
  if (!box || !PZ) return;
  box.innerHTML = boardHTML(PZ, { sel: PZsel, moves: PZmoves, last: null, flip: false });
  bindBoard('dmPuzBoard', pickPuzzle);
  var info = $('dmPuzInfo');
  if (info) {
    var st = getStats();
    var ok = st.puzzles[P.id] ? ' ✅ resuelto' : '';
    var total = (P.sol || []).length;
    info.innerHTML = '<div class="si-card su-68a1a9"><h4>' + esc(P.n) + ok + ' <span class="chip su-0d5be0">' + esc(P.dif || 'Fácil ⭐') + '</span></h4>' +
      '<p>' + esc(P.d) + '</p>' +
      '<p class="muted su-11a508">Tema: ' + esc(P.tema) + ' · Juegan ' + (P.turn === 'w' ? 'blancas' : 'negras') + (total > 1 ? ' · secuencia de ' + total + ' saltos (' + (PZstep + 1) + '/' + total + ')' : '') + '</p>' +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn su-337714" id="dmPuzHint">💡 Pista</button>' +
      '<button type="button" class="btn su-337714" id="dmPuzReset">🔁 Reiniciar</button>' +
      '</div><div id="dmPuzMsg" class="chip su-3aa9e1">' + (PZdone ? '🏆 ¡Bien calculado! Secuencia completa.' : (PZstep > 0 ? '🔗 ¡Bien! Sigue el multi-salto con la misma pieza.' : 'Toca tu ficha y luego el destino. ¡Comer es obligatorio!')) + '</div></div>';
    var hb = $('dmPuzHint');
    if (hb) hb.onclick = function () { var m = $('dmPuzMsg'); if (m) m.textContent = '💡 ' + P.pista; };
    var rb = $('dmPuzReset');
    if (rb) rb.onclick = function () { loadPuzzle(PZidx); };
  }
  var nav = $('dmPuzNav');
  if (nav) {
    var st0 = getStats();
    var nOk = PUZZLES.filter(function (q) { return st0.puzzles[q.id]; }).length;
    var fBtns = ['Todos', 'Fácil ⭐', 'Media ⭐⭐', 'Difícil ⭐⭐⭐'].map(function (f) {
      return '<button type="button" class="btn' + (PZfiltro === f ? ' btn-accent' : '') + ' su-b0ee80" data-pzf="' + f + '">' + f + '</button>';
    }).join('');
    var list = PUZZLES.map(function (q, i) { return { q: q, i: i }; }).filter(function (x) {
      return PZfiltro === 'Todos' || (x.q.dif || '') === PZfiltro;
    });
    nav.innerHTML = '<div class="su-ab39bd"><span class="muted su-0d5be0">🎯 ' + nOk + '/' + PUZZLES.length + ' · ver:</span>' + fBtns + '</div>' +
      '<div class="su-6157e8">' + list.map(function (x) {
        return '<button type="button" class="btn' + (x.i === PZidx ? ' btn-accent' : '') + ' su-337714" data-pz="' + x.i + '">' + (st0.puzzles[x.q.id] ? '✅ ' : '') + esc(x.q.n) + '</button>';
      }).join('') + '</div>';
    nav.querySelectorAll('[data-pzf]').forEach(function (b) {
      b.onclick = function () { PZfiltro = b.getAttribute('data-pzf'); renderPuzzle(); };
    });
    nav.querySelectorAll('[data-pz]').forEach(function (b) {
      b.onclick = function () { loadPuzzle(parseInt(b.getAttribute('data-pz'), 10)); };
    });
  }
}
function pickPuzzle(s) {
  var P = PUZZLES[PZidx];
  if (!PZ || PZdone) return;
  if (PZsel >= 0) {
    var cands = PZmoves.filter(function (m) { return m.to === s; });
    if (cands.length) {
      var want = (P.sol || [])[PZstep];
      var good = cands.filter(function (m) {
        return m.from === parseAlg(want.from) && m.to === parseAlg(want.to);
      });
      var msg = $('dmPuzMsg');
      if (good.length) {
        doStep(PZ, good[0]);
        PZstep++;
        PZsel = -1; PZmoves = [];
        if (PZstep >= (P.sol || []).length) {
          PZdone = true;
          try { var st = getStats(); st.puzzles[P.id] = true; var u = userData(); u.damaStats = st; save('¡Puzzle resuelto! 🏆'); } catch (e) {}
        } else if (PZ.cont >= 0) {
          PZsel = PZ.cont; PZmoves = stepsFrom(PZ, PZ.cont);
        }
      } else {
        if (msg) msg.textContent = '❌ Esa no es. Vuelve a mirar: ' + P.pista;
        try { if (navigator.vibrate) navigator.vibrate(60); } catch (e2) {}
        PZsel = -1; PZmoves = [];
      }
      renderPuzzle();
      return;
    }
  }
  var p = PZ.b[s];
  if (p && p.c === PZ.turn) { PZsel = s; PZmoves = stepsFrom(PZ, s); }
  else { PZsel = -1; PZmoves = []; }
  renderPuzzle();
}

/* ================= RENDER: PESTAÑAS ================= */
function switchTab(t) {
  TAB = t;
  ['jugar', 'aprender', 'tactica', 'salidas', 'partidas'].forEach(function (k) {
    var b = $('tabDm' + k.charAt(0).toUpperCase() + k.slice(1));
    if (b) b.classList.toggle('btn-accent', k === t);
    var p = $('dmPanel' + k.charAt(0).toUpperCase() + k.slice(1));
    if (p) p.classList.toggle('hidden', k !== t);
  });
  if (t === 'jugar') renderFree();
  if (t === 'tactica') { renderDemoTactica(); renderPuzzle(); }
  if (t === 'aprender') { renderLuna(); renderDemoAprender(); }
  if (t === 'salidas') renderDemoSalidas();
  if (t === 'partidas') renderPartidas();
}
function renderLuna() {
  var box = $('dmLunaBox');
  if (!box) return;
  var f = lunaFaseAprox();
  var tip = LUNA_TIPS[f.idx] || LUNA_TIPS[4];
  box.innerHTML = '<b>🌙 Consejo lunar · iluminación ' + f.ilum + '%</b><br>' +
    '<span class="su-e39eba">' + esc(tip.f) + '</span> — ' + esc(tip.t);
}
function renderAprender() {
  var box = $('dmPiezasBox');
  if (!box) return;
  box.innerHTML = PIEZAS.map(function (p) {
    return '<div class="si-card"><h4><span class="su-881f70">' + p.g + '</span> ' + esc(p.n) + ' · <span class="muted">' + esc(p.v) + '</span></h4>' +
      '<p><b>Mueve:</b> ' + esc(p.m) + '</p><p class="muted su-11a508">💡 ' + esc(p.t) + '</p></div>';
  }).join('') + REGLAS.map(function (r) {
    return '<div class="si-card su-63ba3c"><h4>' + esc(r.t) + '</h4><p>' + esc(r.d) + '</p></div>';
  }).join('') +
    '<div class="si-card"><h4>✍️ Notación (para tu bitácora)</h4><p class="muted su-583677">Casillas: a1 abajo-izquierda (blancas) hasta h8.<br>Ej: <b>c3-d4</b> = mueve sin comer · <b>c3xe5</b> = come saltando · <b>c3xe5xg7</b> = cadena · <b>=D</b> = corona (ej: f6xh8=D) · <b>1-0</b> ganan blancas · <b>0-1</b> ganan negras · <b>½-½</b> tablas.</p></div>';
}
function renderMotivos() {
  var box = $('dmMotivosBox');
  if (!box) return;
  box.innerHTML = MOTIVOS.map(function (m) {
    return '<div class="si-card"><h4>' + esc(m.n) + '</h4><p>' + esc(m.d) + '</p></div>';
  }).join('');
}
function renderSalidas() {
  var box = $('dmSalidasBox');
  if (!box) return;
  box.innerHTML = SALIDAS.map(function (a) {
    return '<div class="si-card"><h4>' + esc(a.n) + ' <span class="chip su-0d5be0">' + esc(a.nivel) + '</span></h4>' +
      '<p><b>' + esc(a.mov) + '</b></p><p>' + esc(a.idea) + '</p><p class="muted su-11a508">📋 Plan: ' + esc(a.plan) + '</p></div>';
  }).join('');
}

/* ============ DEMO 1 · APRENDER: explorador ============ */
var DAst = null, DAsel = -1, DAmoves = [], DAlast = null, DAplies = 0;
function demoAInit() { DAst = initialState(); DAsel = -1; DAmoves = []; DAlast = null; DAplies = 0; }
function renderDemoAprender() {
  var box = $('dmDemoABoard');
  if (!box) return;
  if (!DAst) demoAInit();
  box.innerHTML = boardHTML(DAst, { sel: DAsel, moves: DAmoves, last: DAlast, flip: false });
  bindBoard('dmDemoABoard', pickDemoA);
  var info = $('dmDemoAInfo');
  if (info) {
    var selTxt;
    if (DAsel >= 0 && DAst.b[DAsel]) {
      var p = DAst.b[DAsel];
      var nm = p.t === 'q' ? 'Dama' : 'Ficha';
      selTxt = '👆 <b>' + nm + ' en ' + alg(DAsel) + '</b> → ' + DAmoves.length + ' destino' + (DAmoves.length === 1 ? '' : 's') + '. Toca un destino para mover.';
    } else {
      selTxt = '👆 Toca <b>cualquier ficha</b> (blanca o negra) y se iluminan sus jugadas (⭕ = captura). Toca un destino para moverla.';
    }
    info.innerHTML = '<div class="chip su-8c0a82">' + selTxt +
      '<br><span class="muted su-11a508">Jugadas hechas: ' + DAplies + ' · Turno: ' + (DAst.turn === 'w' ? '⚪ blancas' : '⚫ negras') + (DAst.cont >= 0 ? ' · 🔗 multi-salto en curso' : '') + '</span></div>';
  }
}
function pickDemoA(s) {
  if (!DAst) demoAInit();
  if (DAsel >= 0) {
    for (var i = 0; i < DAmoves.length; i++) {
      if (DAmoves[i].to === s) {
        doStep(DAst, DAmoves[i]);
        DAlast = { from: DAmoves[i].from, to: DAmoves[i].to };
        DAplies++;
        DAsel = -1; DAmoves = [];
        if (DAst.cont >= 0 && !gameStatus(DAst).over) { DAsel = DAst.cont; DAmoves = stepsFrom(DAst, DAst.cont); }
        renderDemoAprender();
        return;
      }
    }
  }
  var p = DAst.b[s];
  if (p) { DAst.turn = p.c; DAst.cont = -1; DAsel = s; DAmoves = stepsFrom(DAst, s); }
  else { DAsel = -1; DAmoves = []; }
  renderDemoAprender();
}

/* ============ DEMO 2 · TÁCTICA ============ */
var MOidx = 0, MOst = null, MOshown = false, MOstep = 0;
function demoTInit(i) {
  MOidx = (i == null ? MOidx : i);
  var D = DM_DEMOS[MOidx];
  MOst = posFromList(D.piezas, D.turn);
  MOshown = false; MOstep = 0;
}
function renderDemoTactica() {
  var box = $('dmDemoTBoard');
  if (!box) return;
  if (!MOst) demoTInit(0);
  var D = DM_DEMOS[MOidx], M = MOTIVOS[MOidx];
  box.innerHTML = boardHTML(MOst, { sel: -1, moves: [], last: null, flip: false });
  bindBoard('dmDemoTBoard', pickDemoT);
  var btns = $('dmDemoTBtns');
  if (btns) {
    btns.innerHTML = MOTIVOS.map(function (m, i) {
      return '<button type="button" class="btn' + (i === MOidx ? ' btn-accent' : '') + ' su-b0ee80" data-mot="' + i + '">' + esc(m.n) + '</button>';
    }).join('');
    btns.querySelectorAll('[data-mot]').forEach(function (b) {
      b.onclick = function () { demoTInit(parseInt(b.getAttribute('data-mot'), 10)); renderDemoTactica(); };
    });
  }
  var info = $('dmDemoTInfo');
  if (info) {
    info.innerHTML = '<div class="si-card su-68a1a9"><h4>' + esc(M.n) + '</h4><p>' + esc(M.d) + '</p>' +
      (MOshown
        ? '<p>▶ Jugada: <b>' + esc(D.jugada) + '</b> — ' + esc(D.nota) + '</p>'
        : '<p class="muted su-11a508">Mira la posición, intenta la jugada en el tablero… y luego pulsa ▶ para comprobar.</p>') +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn btn-accent su-337714" id="dmDemoTShow">▶ Ver la jugada' + (MOshown ? ' ✓' : '') + '</button>' +
      '<button type="button" class="btn su-337714" id="dmDemoTReset">🔁 Reiniciar</button></div></div>';
    var sh = $('dmDemoTShow');
    if (sh) sh.onclick = function () { demoTPlay(); };
    var rs = $('dmDemoTReset');
    if (rs) rs.onclick = function () { demoTInit(MOidx); renderDemoTactica(); };
  }
}
function demoTPlay() {
  if (!MOst || MOshown) { renderDemoTactica(); return; }
  var D = DM_DEMOS[MOidx];
  for (var i = 0; i < (D.seq || []).length; i++) {
    var from = parseAlg(D.seq[i][0]), to = parseAlg(D.seq[i][1]);
    var cands = stepsFrom(MOst, from).filter(function (m) { return m.to === to; });
    if (!cands.length) break;
    doStep(MOst, cands[0]);
  }
  MOshown = true;
  renderDemoTactica();
}
function pickDemoT(s) {
  if (!MOst || MOshown) return;
  var D = DM_DEMOS[MOidx];
  var want = (D.seq || [])[MOstep];
  if (!want) return;
  var from = parseAlg(want[0]), to = parseAlg(want[1]);
  var opts = stepsFrom(MOst, from);
  var isFrom = s === from;
  var isTo = opts.some(function (m) { return m.to === s; }) && s === to;
  if (isTo) {
    var cands = stepsFrom(MOst, from).filter(function (m) { return m.to === to; });
    if (cands.length) {
      doStep(MOst, cands[0]);
      MOstep++;
      if (MOstep >= (D.seq || []).length) { MOshown = true; }
      renderDemoTactica();
    }
    return;
  }
  if (isFrom) { renderDemoTactica(); return; }
  renderDemoTactica();
}

/* ============ DEMO 3 · SALIDAS paso a paso ============ */
var APidx = 0, APply = 0;
function demoApPos() {
  var st = initialState();
  var sans = [];
  var seq = SALIDAS[APidx].seq || [];
  for (var i = 0; i < Math.min(APply, seq.length); i++) {
    var from = parseAlg(seq[i][0]), to = parseAlg(seq[i][1]);
    var cands = stepsFrom(st, from).filter(function (m) { return m.to === to; });
    if (!cands.length) break;
    var crowned = st.b[from] && st.b[from].t === 'm' && (to >> 3) === lastRank(st.b[from].c);
    sans.push(stepSAN(st, cands[0], crowned));
    doStep(st, cands[0]);
  }
  return { st: st, sans: sans };
}
function renderDemoSalidas() {
  var box = $('dmDemoApBoard');
  if (!box) return;
  var A = SALIDAS[APidx];
  var seq = A.seq || [];
  if (APply < 0) APply = 0;
  if (APply > seq.length) APply = seq.length;
  var r = demoApPos();
  var last = null;
  if (APply > 0) {
    var prev = seq[APply - 1];
    last = { from: parseAlg(prev[0]), to: parseAlg(prev[1]) };
  }
  box.innerHTML = boardHTML(r.st, { sel: -1, moves: [], last: last, flip: false });
  var sel = $('dmDemoApSel');
  if (sel && !sel.options.length) {
    sel.innerHTML = SALIDAS.map(function (a, i) { return '<option value="' + i + '">' + esc(a.n) + '</option>'; }).join('');
    sel.value = String(APidx);
    sel.onchange = function () { APidx = parseInt(sel.value, 10) || 0; APply = 0; renderDemoSalidas(); };
  }
  if (sel && sel.value !== String(APidx)) sel.value = String(APidx);
  var info = $('dmDemoApInfo');
  if (info) {
    var txt = r.sans.length ? r.sans.join(' ') : 'Posición inicial.';
    info.innerHTML = '<div class="chip su-8c0a82"><b>' + esc(A.n) + '</b> · jugada ' + APply + '/' + seq.length +
      '<br>' + esc(txt) +
      '<br><span class="muted su-11a508">' + esc(A.plan) + '</span></div>';
  }
  function go(n) { APply = Math.max(0, Math.min(seq.length, n)); renderDemoSalidas(); }
  var bS = $('dmDemoApStart'); if (bS) bS.onclick = function () { go(0); };
  var bP = $('dmDemoApPrev'); if (bP) bP.onclick = function () { go(APply - 1); };
  var bN = $('dmDemoApNext'); if (bN) bN.onclick = function () { go(APply + 1); };
  var bE = $('dmDemoApEnd'); if (bE) bE.onclick = function () { go(seq.length); };
}

/* ---- bitácora ---- */
var editId = null;
function renderPartidas() {
  var list = getPartidas();
  var box = $('dmLogList');
  if (!box) return;
  var st = $('dmLogStats');
  var w = list.filter(function (x) { return x.res === '1-0'; }).length;
  var l = list.filter(function (x) { return x.res === '0-1'; }).length;
  var d = list.filter(function (x) { return x.res === '½-½'; }).length;
  if (st) st.textContent = list.length ? (list.length + ' partidas · ✅ ' + w + ' blancas · ❌ ' + l + ' negras · 🤝 ' + d + ' tablas') : 'Sin partidas aún';
  if (!list.length) { box.innerHTML = '<p class="muted su-11a508">Anota tu primera partida: fecha, rival, salida y qué aprendiste. El cuaderno hace a la maestra.</p>'; return; }
  var sorted = list.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  box.innerHTML = sorted.map(function (x) {
    var resTxt = x.res === '1-0' ? '⚪ 1-0' : x.res === '0-1' ? '⚫ 0-1' : '🤝 ½-½';
    return '<div class="habit-item"><div class="habit-head"><b>' + esc(x.fecha) + '</b><span class="chip su-0d5be0">' + resTxt + '</span>' +
      '<span class="su-97445a"></span>' +
      '<button type="button" class="btn btn-icon" data-edit="' + x.id + '" title="Editar">✏️</button>' +
      '<button type="button" class="btn btn-icon" data-del="' + x.id + '" title="Borrar">🗑</button></div>' +
      '<div class="su-6cb285"><b>' + esc(x.rival || 'Sin rival') + '</b>' + (x.apertura ? ' · <span class="muted">' + esc(x.apertura) + '</span>' : '') + '</div>' +
      (x.notas ? '<div class="muted su-21f4b1">' + esc(x.notas) + '</div>' : '') + '</div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-del');
      var u = userData();
      u.damaPartidas = getPartidas().filter(function (x) { return x.id !== id; });
      save('Partida borrada'); renderPartidas();
    };
  });
  box.querySelectorAll('[data-edit]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-edit');
      var x = getPartidas().filter(function (y) { return y.id === id; })[0];
      if (!x) return;
      editId = id;
      $('dmFecha').value = x.fecha || todayKey();
      $('dmRival').value = x.rival || '';
      $('dmApertura').value = x.apertura || '';
      $('dmRes').value = x.res || '1-0';
      $('dmNotas').value = x.notas || '';
      $('dmAddBtn').textContent = '↻ Actualizar partida';
      $('dmCancelEdit').classList.remove('hidden');
    };
  });
}
function setupLog() {
  if (!$('dmFecha')) return;
  if (!$('dmFecha').value) $('dmFecha').value = todayKey();
  var add = $('dmAddBtn');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var u = userData();
      var arr = getPartidas();
      var data = {
        id: editId || uid('dm'),
        fecha: $('dmFecha').value || todayKey(),
        rival: clean($('dmRival').value, 30),
        apertura: clean($('dmApertura').value, 40),
        res: $('dmRes').value,
        notas: clean($('dmNotas').value, 120)
      };
      if (editId) {
        for (var i = 0; i < arr.length; i++) if (arr[i].id === editId) arr[i] = data;
      } else arr.push(data);
      u.damaPartidas = arr;
      editId = null;
      add.textContent = '+ Guardar partida';
      $('dmCancelEdit').classList.add('hidden');
      $('dmRival').value = ''; $('dmNotas').value = '';
      save('Partida guardada 👑'); renderPartidas();
    };
  }
  var ce = $('dmCancelEdit');
  if (ce && !ce.dataset.w) {
    ce.dataset.w = '1';
    ce.onclick = function () {
      editId = null;
      $('dmAddBtn').textContent = '+ Guardar partida';
      ce.classList.add('hidden');
    };
  }
  var cl = $('dmClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de damas?')) return;
      var u = userData();
      u.damaPartidas = [];
      save('Bitácora borrada'); renderPartidas();
    };
  }
  var sh = $('dmShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var arr = getPartidas();
      if (!arr.length) { alert('Sin partidas para compartir'); return; }
      var txt = arr.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); })
        .map(function (x) { return x.fecha + ' · vs ' + (x.rival || '?') + ' · ' + x.res + (x.apertura ? ' · ' + x.apertura : '') + (x.notas ? '\n  → ' + x.notas : ''); }).join('\n');
      share('👑 Mis partidas de damas', txt);
    };
  }
}

/* ================= DIALOG ================= */
function buildDialog() {
  injectCSS();
  if ($('damaDialog')) return $('damaDialog');
  var d = document.createElement('dialog');
  d.id = 'damaDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">👑 Damas — el juego de la corona</h3>' +
    '<button type="button" id="dmCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Come, corona y encierra. Damas chilenas con captura obligatoria y dama larga. Todo queda <b>privado y local</b> por usuario.</p>' +
    '<div id="dmLunaBox" class="menstrual-card su-a91bab"></div>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabDmJugar" class="btn btn-accent su-30e741">👑 Jugar</button>' +
    '<button type="button" id="tabDmAprender" class="btn su-30e741">📖 Aprender</button>' +
    '<button type="button" id="tabDmTactica" class="btn su-30e741">⚔️ Táctica</button>' +
    '<button type="button" id="tabDmSalidas" class="btn su-30e741">🌱 Salidas</button>' +
    '<button type="button" id="tabDmPartidas" class="btn su-30e741">📓 Mis partidas</button>' +
    '</div>' +
    '<div id="dmPanelJugar">' +
    '<div id="dmStatusBox" class="su-fdf33f"></div>' +
    '<div id="dmBoardBox" class="dm-wrap"></div>' +
    '<div class="su-1e4d3b">' +
    '<button type="button" id="dmUndoBtn" class="btn su-337714">↩ Deshacer</button>' +
    '<button type="button" id="dmNewBtn" class="btn su-337714">🔀 Nueva partida</button>' +
    '<button type="button" id="dmFlipBtn" class="btn su-337714">🔄 Ver desde negras</button>' +
    '<label class="su-611744">🤖 Rival <select id="dmNivel" class="su-7eba57">' +
    DM_NIVELES.map(function (x) { return '<option value="' + x.id + '">' + x.n + '</option>'; }).join('') + '</select></label>' +
    '</div>' +
    '<p id="dmNivelHint" class="muted su-cb3213"></p>' +
    '<div class="menstrual-card su-8a77e5"><h4>📝 Jugadas</h4><div id="dmMovesBox" class="dm-moves"></div>' +
    '<p class="muted su-cb3213">x = captura · =D = corona. Si pierdes una ficha sin compensación, respira y busca la cadena de vuelta.</p></div>' +
    '</div>' +
    '<div id="dmPanelAprender" class="hidden">' +
    '<div class="menstrual-card su-39553d"><h4>👑 Tablero: toca una ficha y ve a dónde puede ir</h4>' +
    '<p class="muted su-11a508">Explorador libre desde la posición inicial: toca <b>cualquier ficha</b> para iluminar sus pasos (⭕ = captura obligada).</p>' +
    '<div id="dmDemoABoard" class="dm-wrap dm-mini"></div>' +
    '<div id="dmDemoAInfo" class="su-8a77e5"></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="dmDemoAReset" class="btn su-337714">🔁 Reiniciar tablero</button></div></div>' +
    '<div id="dmPiezasBox"></div>' +
    '</div>' +
    '<div id="dmPanelTactica" class="hidden">' +
    '<div class="menstrual-card su-39553d"><h4>👁️ Tablero: mira el motivo en acción</h4>' +
    '<p class="muted su-11a508">Elige un motivo e intenta la jugada en el tablero. Si no la ves, pulsa ▶.</p>' +
    '<div id="dmDemoTBtns" class="su-f787da"></div>' +
    '<div id="dmDemoTBoard" class="dm-wrap dm-mini"></div>' +
    '<div id="dmDemoTInfo" class="su-8a77e5"></div></div>' +
    '<div class="menstrual-card su-68a1a9"><h4>⚔️ Motivos que ganan partidas</h4><p class="muted su-11a508">En damas lo obligado manda: quien calcula 1 salto más, come y suele ganar.</p></div>' +
    '<div id="dmMotivosBox" class="su-8a77e5"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🧩 Come y gana — calcula y toca</h4>' +
    '<p class="muted su-11a508">8 puzzles por dificultad: 3 fáciles ⭐ · 3 medios ⭐⭐ · 2 difíciles ⭐⭐⭐. Filtra arriba y completa tu marcador.</p>' +
    '<div id="dmPuzNav" class="su-f787da"></div>' +
    '<div id="dmPuzBoard" class="dm-wrap dm-mini"></div>' +
    '<div id="dmPuzInfo" class="su-8a77e5"></div></div>' +
    '</div>' +
    '<div id="dmPanelSalidas" class="hidden">' +
    '<div class="menstrual-card su-39553d"><h4>🌱 Tablero: recorre la salida paso a paso</h4>' +
    '<p class="muted su-11a508">Elige una salida y avanza paso por paso con ◀ ▶. Fíjate dónde queda cada ficha.</p>' +
    '<div class="conv-row"><label class="su-4b3de7">Salida <select id="dmDemoApSel"></select></label></div>' +
    '<div id="dmDemoApBoard" class="dm-wrap dm-mini su-8a77e5"></div>' +
    '<div id="dmDemoApInfo" class="su-8a77e5"></div>' +
    '<div class="su-0ad856">' +
    '<button type="button" id="dmDemoApStart" class="btn su-337714">⏮ Inicio</button>' +
    '<button type="button" id="dmDemoApPrev" class="btn su-337714">◀ Atrás</button>' +
    '<button type="button" id="dmDemoApNext" class="btn btn-accent su-337714">Adelante ▶</button>' +
    '<button type="button" id="dmDemoApEnd" class="btn su-337714">Final ⏭</button></div></div>' +
    '<div id="dmSalidasBox"></div>' +
    '<div class="si-card"><h4>🧭 ¿Por dónde empiezo?</h4><p class="muted su-11a508">Elige 1 salida (Clásica o Muro) y repite sus primeros pasos hasta soñarlos. Después, táctica todos los días.</p></div></div>' +
    '<div id="dmPanelPartidas" class="hidden">' +
    '<div class="menstrual-card"><h4>📓 Anotar partida</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="dmFecha"></label>' +
    '<label>Rival <input type="text" id="dmRival" placeholder="ej: vecina Marta, primo, yo solo" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Resultado <select id="dmRes"><option value="1-0">1-0 ganan blancas</option><option value="0-1">0-1 ganan negras</option><option value="½-½">½-½ tablas</option></select></label></div>' +
    '<label>Salida <input type="text" id="dmApertura" placeholder="ej: Clásica, Muro, libre…" maxlength="40"></label>' +
    '<label>¿Qué aprendí? <input type="text" id="dmNotas" placeholder="ej: no dejar fichas colgadas, coronar por el borde" maxlength="120"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="dmAddBtn" class="btn btn-accent su-30e741">+ Guardar partida</button>' +
    '<button type="button" id="dmCancelEdit" class="btn hidden su-30e741">Cancelar</button></div></div>' +
    '<div id="dmLogList" class="habits-list su-d2c171"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="dmLogStats" class="muted su-11a508"></span>' +
    '<span class="su-a76d59"><button type="button" id="dmShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="dmClear" class="btn su-214f75">🗑 Borrar</button></span></div>' +
    '</div>' +
    '<div class="dlg-actions"><button type="button" id="dmClose" class="btn">Cerrar</button></div>' +
    '</form>';
  document.body.appendChild(d);
  d.style.width = '680px';
  d.style.maxWidth = '96vw';
  d.style.maxHeight = '88vh';
  $('dmCloseTop').onclick = function () { persistCurrent(); try { d.close(); } catch (e) {} };
  $('dmClose').onclick = function () { persistCurrent(); try { d.close(); } catch (e) {} };
  [['tabDmJugar', 'jugar'], ['tabDmAprender', 'aprender'], ['tabDmTactica', 'tactica'], ['tabDmSalidas', 'salidas'], ['tabDmPartidas', 'partidas']].forEach(function (x) {
    var b = $(x[0]);
    if (b && !b.dataset.w) { b.dataset.w = '1'; b.onclick = function () { switchTab(x[1]); }; }
  });
  $('dmUndoBtn').onclick = undoFree;
  $('dmNewBtn').onclick = function () { newFreeGame(); persistCurrent(); renderFree(); };
  $('dmFlipBtn').onclick = function () { Gflip = !Gflip; renderFree(); };
  if ($('dmDemoAReset')) $('dmDemoAReset').onclick = function () { demoAInit(); renderDemoAprender(); };
  var syncHint = function () {
    var h = $('dmNivelHint');
    if (h) {
      var lv = DM_NIVELES[Gnivel] || DM_NIVELES[0];
      h.textContent = lv.d + (Gnivel > 0 ? ' Tú eres blancas, el rival mueve negras.' : '');
    }
    var sel = $('dmNivel');
    if (sel && String(Gnivel) !== sel.value) sel.value = String(Gnivel);
  };
  var selN = $('dmNivel');
  if (selN) {
    selN.value = String(Gnivel || 0);
    selN.onchange = function () {
      Gnivel = parseInt(selN.value, 10) || 0;
      try { var s2 = getStats(); s2.nivel = Gnivel; var u = userData(); u.damaStats = s2; save(); } catch (e) {}
      syncHint(); persistCurrent(); renderFree();
      if (Gnivel > 0 && G && G.turn === 'b' && !gameStatus(G).over) {
        Gpensando = true; renderFree();
        (function (niv) {
          setTimeout(function () {
            Gpensando = false;
            if (!G) return;
            var pick = null;
            try { pick = dmPickMove(G, niv); } catch (e2) { pick = null; }
            if (pick) playStep(pick); else renderFree();
          }, 450);
        })(Gnivel);
      }
    };
  }
  syncHint();
  try { var _s = getStats(); if (_s && _s.nivel >= 0 && _s.nivel <= 4) { Gnivel = _s.nivel; syncHint(); } } catch (e2) {}
  return d;
}

/* ================= SETUP ================= */
function injectButton() {
  var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
  if (!g) g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
  if (!g) return;
  if ($('btnDama')) {
    try {
      var cur = $('btnDama');
      if (cur.parentNode !== g) g.appendChild(cur);
      try { cur.setAttribute('data-sub', 'juegos'); } catch (eS) {}
      if (typeof reordenarAcciones === 'function') reordenarAcciones();
    } catch (eM) {}
    return;
  }
  var btn = document.createElement('button');
  btn.id = 'btnDama'; btn.className = 'btn'; btn.type = 'button';
  btn.textContent = '👑 Damas';
  try { btn.setAttribute('data-sub', 'juegos'); } catch (eS2) {}
  btn.setAttribute('data-keywords', 'damas dama juego corona captura obligatoria tablero fichas reina salto tactica estrategia concentracion memoria calculo chilenas');
  // Ubica justo tras Ajedrez para que los juegos queden juntos
  var ref = $('btnAjedrez');
  if (ref && ref.parentNode === g && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
  else g.appendChild(btn);
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnDama') < 0) ALL_BTNS.push('btnDama');
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e2) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e3) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e4) {}
}
function injectConfig() {
  var groups = document.querySelectorAll('#configDialog .config-group h5');
  for (var i = 0; i < groups.length; i++) {
    if (/Aprender/.test(groups[i].textContent) && !groups[i].parentNode.querySelector('[data-btn="btnDama"]')) {
      var lab = document.createElement('label');
      lab.className = 'check-row';
      lab.innerHTML = '<input type="checkbox" data-btn="btnDama" checked> 👑 Damas';
      var juegos = groups[i].parentNode.querySelector('[data-btn="btnAjedrez"]');
      if (juegos && juegos.parentNode && juegos.nextSibling) juegos.parentNode.insertBefore(lab, juegos.nextSibling);
      else groups[i].parentNode.appendChild(lab);
      break;
    }
  }
}
function openDama() {
  var d = buildDialog();
  renderLuna(); renderAprender(); renderMotivos(); renderSalidas();
  try { demoAInit(); renderDemoAprender(); } catch (e) {}
  try { demoTInit(MOidx || 0); renderDemoTactica(); } catch (e2) {}
  try { renderDemoSalidas(); } catch (e3) {}
  if (!G) {
    var sv = getSaved();
    if (sv && sv.b && sv.b.length === 64) { try { restoreCurrent(sv); } catch (e4) { newFreeGame(); } }
    else newFreeGame();
  }
  setupLog();
  switchTab(TAB || 'jugar');
  try { if (!d.open) d.showModal(); } catch (e5) { try { d.showModal(); } catch (e6) {} }
}
var _retry = 0;
function setup() {
  injectCSS();
  injectButton();
  injectConfig();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf && ALL_BTNS.indexOf('btnDama') < 0) ALL_BTNS.push('btnDama');
  } catch (e) {}
  var b = $('btnDama');
  if (!b) {
    if (_retry++ < 60) setTimeout(setup, 500);
    return;
  }
  if (!b.dataset.dmw) {
    b.dataset.dmw = '1';
    b.addEventListener('click', openDama);
  }
  try {
    var sv = getSaved();
    if (sv && sv.b && !G) restoreCurrent(sv);
    else if (!G) newFreeGame();
  } catch (e2) {}
}

window.Damas = {
  open: openDama, newGame: function () { newFreeGame(); renderFree(); },
  initialState: initialState, posFromList: posFromList,
  stepsFrom: stepsFrom, allSteps: allSteps, jumpsFrom: jumpsFrom,
  doStep: doStep, undoStep: undoStep, gameStatus: gameStatus,
  parseAlg: parseAlg, alg: alg, puzzles: PUZZLES, salidas: SALIDAS,
  niveles: DM_NIVELES, evaluar: dmEval, mejorJugada: dmBest
};
setTimeout(setup, 600);

})();
