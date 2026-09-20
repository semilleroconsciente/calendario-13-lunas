/* ============================================================
   AJEDREZ — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa en Mente & Estudio (btnAjedrez):
   - Tablero libre jugable (2 jugadores o vs rival automático
     con 4 niveles: 🌱 Novato, 🧩 Aprendiz, ⚔️ Rival, 👑 Maestro),
     con reglas completas: enroque, peon al paso, promocion,
     jaque, mate y ahogado.
   - Aprender: piezas, valores, reglas especiales y notacion.
   - Tactica: 8 motivos + 8 puzzles de mate en 1 interactivos
     (Fácil/Media/Difícil con filtro y progreso).
   - Aperturas: 6 aperturas clasicas con planes.
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

/* ================= MOTOR DE AJEDREZ ================= */
var FILES = 'abcdefgh';
function RC(sq) { return [sq >> 3, sq & 7]; }
function SQ(r, f) { return r * 8 + f; }
function alg(sq) { var r = sq >> 3, f = sq & 7; return FILES[f] + (8 - r); }
function parseAlg(a) {
  var f = FILES.indexOf(String(a || '').charAt(0).toLowerCase());
  var rank = parseInt(String(a || '').slice(1), 10);
  if (f < 0 || !(rank >= 1 && rank <= 8)) return -1;
  return (8 - rank) * 8 + f;
}
var GLYPH = {
  'w': { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
  'b': { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};
var PIEZA_NOMBRE = { k: 'Rey', q: 'Dama', r: 'Torre', b: 'Alfil', n: 'Caballo', p: 'Peón' };

function opp(c) { return c === 'w' ? 'b' : 'w'; }

function initialState() {
  var back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  var b = new Array(64).fill(null);
  for (var f = 0; f < 8; f++) {
    b[SQ(0, f)] = { t: back[f], c: 'b' };
    b[SQ(1, f)] = { t: 'p', c: 'b' };
    b[SQ(6, f)] = { t: 'p', c: 'w' };
    b[SQ(7, f)] = { t: back[f], c: 'w' };
  }
  return { b: b, turn: 'w', cast: { K: true, Q: true, k: true, q: true }, ep: -1, half: 0, full: 1 };
}
function cloneState(st) {
  return { b: st.b.slice(), turn: st.turn, cast: { K: st.cast.K, Q: st.cast.Q, k: st.cast.k, q: st.cast.q }, ep: st.ep, half: st.half, full: st.full };
}
function attacked(b, s, by) {
  var r = s >> 3, f = s & 7, i, r1, f1;
  // peones
  var pr = by === 'w' ? r + 1 : r - 1;
  if (pr >= 0 && pr < 8) {
    for (var df = -1; df <= 1; df += 2) {
      var pf = f + df;
      if (pf >= 0 && pf < 8) { var q = b[pr * 8 + pf]; if (q && q.c === by && q.t === 'p') return true; }
    }
  }
  // caballos
  var NK = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (i = 0; i < NK.length; i++) {
    r1 = r + NK[i][0]; f1 = f + NK[i][1];
    if (r1 >= 0 && r1 < 8 && f1 >= 0 && f1 < 8) { var n = b[r1 * 8 + f1]; if (n && n.c === by && n.t === 'n') return true; }
  }
  // rey
  for (var dr = -1; dr <= 1; dr++) for (var df2 = -1; df2 <= 1; df2++) {
    if (!dr && !df2) continue;
    r1 = r + dr; f1 = f + df2;
    if (r1 >= 0 && r1 < 8 && f1 >= 0 && f1 < 8) { var k = b[r1 * 8 + f1]; if (k && k.c === by && k.t === 'k') return true; }
  }
  // deslizantes
  var DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  var ORT = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (i = 0; i < DIAG.length; i++) {
    r1 = r + DIAG[i][0]; f1 = f + DIAG[i][1];
    while (r1 >= 0 && r1 < 8 && f1 >= 0 && f1 < 8) {
      var d = b[r1 * 8 + f1];
      if (d) { if (d.c === by && (d.t === 'b' || d.t === 'q')) return true; break; }
      r1 += DIAG[i][0]; f1 += DIAG[i][1];
    }
  }
  for (i = 0; i < ORT.length; i++) {
    r1 = r + ORT[i][0]; f1 = f + ORT[i][1];
    while (r1 >= 0 && r1 < 8 && f1 >= 0 && f1 < 8) {
      var o = b[r1 * 8 + f1];
      if (o) { if (o.c === by && (o.t === 'r' || o.t === 'q')) return true; break; }
      r1 += ORT[i][0]; f1 += ORT[i][1];
    }
  }
  return false;
}
function kingSq(b, color) {
  for (var s = 0; s < 64; s++) { var p = b[s]; if (p && p.c === color && p.t === 'k') return s; }
  return -1;
}
function inCheck(st, color) {
  var k = kingSq(st.b, color);
  if (k < 0) return false;
  return attacked(st.b, k, opp(color));
}
function pseudoMoves(st, s) {
  var p = st.b[s];
  if (!p) return [];
  var r = s >> 3, f = s & 7, out = [];
  function add(to, flags) { var m = { from: s, to: to }; if (flags) for (var k in flags) m[k] = flags[k]; out.push(m); }
  var i, r1, f1, t;
  if (p.t === 'p') {
    var dir = p.c === 'w' ? -1 : 1;
    var start = p.c === 'w' ? 6 : 1;
    var last = p.c === 'w' ? 0 : 7;
    r1 = r + dir;
    if (r1 >= 0 && r1 < 8 && !st.b[r1 * 8 + f]) {
      if (r1 === last) { ['q', 'r', 'b', 'n'].forEach(function (pr) { add(r1 * 8 + f, { promo: pr }); }); }
      else {
        add(r1 * 8 + f);
        var r2 = r + 2 * dir;
        if (r === start && !st.b[r2 * 8 + f]) add(r2 * 8 + f, { dbl: true });
      }
    }
    [-1, 1].forEach(function (df) {
      var c2 = f + df, rr = r + dir;
      if (c2 < 0 || c2 > 7 || rr < 0 || rr > 7) return;
      var tt = rr * 8 + c2, qq = st.b[tt];
      if (qq && qq.c !== p.c) {
        if (rr === last) { ['q', 'r', 'b', 'n'].forEach(function (pr) { add(tt, { promo: pr }); }); }
        else add(tt);
      } else if (!qq && tt === st.ep) add(tt, { ep: true });
    });
  } else if (p.t === 'n') {
    var NK = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (i = 0; i < NK.length; i++) {
      r1 = r + NK[i][0]; f1 = f + NK[i][1];
      if (r1 < 0 || r1 > 7 || f1 < 0 || f1 > 7) continue;
      t = r1 * 8 + f1; var q2 = st.b[t];
      if (!q2 || q2.c !== p.c) add(t);
    }
  } else if (p.t === 'k') {
    for (var dr = -1; dr <= 1; dr++) for (var df = -1; df <= 1; df++) {
      if (!dr && !df) continue;
      r1 = r + dr; f1 = f + df;
      if (r1 < 0 || r1 > 7 || f1 < 0 || f1 > 7) continue;
      t = r1 * 8 + f1; var q3 = st.b[t];
      if (!q3 || q3.c !== p.c) add(t);
    }
    // enroque
    var home = p.c === 'w' ? 60 : 4;
    if (s === home && !inCheck(st, p.c)) {
      var enemy = opp(p.c);
      if (p.c === 'w') {
        if (st.cast.K && !st.b[61] && !st.b[62] && !attacked(st.b, 61, enemy) && !attacked(st.b, 62, enemy)) add(62, { castle: 'K' });
        if (st.cast.Q && !st.b[59] && !st.b[58] && !st.b[57] && !attacked(st.b, 59, enemy) && !attacked(st.b, 58, enemy)) add(58, { castle: 'Q' });
      } else {
        if (st.cast.k && !st.b[5] && !st.b[6] && !attacked(st.b, 5, enemy) && !attacked(st.b, 6, enemy)) add(6, { castle: 'K' });
        if (st.cast.q && !st.b[3] && !st.b[2] && !st.b[1] && !attacked(st.b, 3, enemy) && !attacked(st.b, 2, enemy)) add(2, { castle: 'Q' });
      }
    }
  } else {
    var dirs = p.t === 'b' ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : p.t === 'r' ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
      : [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
    for (i = 0; i < dirs.length; i++) {
      r1 = r + dirs[i][0]; f1 = f + dirs[i][1];
      while (r1 >= 0 && r1 < 8 && f1 >= 0 && f1 < 8) {
        t = r1 * 8 + f1; var q4 = st.b[t];
        if (!q4) add(t);
        else { if (q4.c !== p.c) add(t); break; }
        r1 += dirs[i][0]; f1 += dirs[i][1];
      }
    }
  }
  return out;
}
function doMove(st, m) {
  var p = st.b[m.from];
  var undo = { from: m.from, to: m.to, piece: p, captured: null, capSq: m.to, cast: { K: st.cast.K, Q: st.cast.Q, k: st.cast.k, q: st.cast.q }, ep: st.ep, half: st.half };
  if (m.ep) { undo.capSq = (m.from >> 3) * 8 + (m.to & 7); undo.captured = st.b[undo.capSq]; st.b[undo.capSq] = null; }
  else { undo.captured = st.b[m.to]; }
  st.b[m.to] = p; st.b[m.from] = null;
  if (m.promo) st.b[m.to] = { t: m.promo, c: p.c };
  if (m.castle) {
    if (m.to === 62) { st.b[61] = st.b[63]; st.b[63] = null; }
    else if (m.to === 58) { st.b[59] = st.b[56]; st.b[56] = null; }
    else if (m.to === 6) { st.b[5] = st.b[7]; st.b[7] = null; }
    else if (m.to === 2) { st.b[3] = st.b[0]; st.b[0] = null; }
  }
  // derechos de enroque
  if (p.t === 'k') { if (p.c === 'w') { st.cast.K = false; st.cast.Q = false; } else { st.cast.k = false; st.cast.q = false; } }
  [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']].forEach(function (rc) {
    if (m.from === rc[0] || m.to === rc[0]) st.cast[rc[1]] = false;
  });
  st.ep = m.dbl ? (((m.from >> 3) + (m.to >> 3)) / 2) * 8 + (m.from & 7) : -1;
  st.half = (p.t === 'p' || undo.captured) ? 0 : st.half + 1;
  if (st.turn === 'b') st.full++;
  st.turn = opp(st.turn);
  return undo;
}
function undoMove(st, m, undo) {
  st.turn = opp(st.turn);
  if (st.turn === 'b') st.full--;
  st.cast = undo.cast; st.ep = undo.ep; st.half = undo.half;
  if (m.castle) {
    if (m.to === 62) { st.b[63] = st.b[61]; st.b[61] = null; }
    else if (m.to === 58) { st.b[56] = st.b[59]; st.b[59] = null; }
    else if (m.to === 6) { st.b[7] = st.b[5]; st.b[5] = null; }
    else if (m.to === 2) { st.b[0] = st.b[3]; st.b[3] = null; }
  }
  st.b[m.from] = undo.piece;
  st.b[m.to] = null;
  if (undo.captured) st.b[undo.capSq] = undo.captured;
}
function legalMoves(st, s) {
  var p = st.b[s];
  if (!p || p.c !== st.turn) return [];
  var out = [];
  pseudoMoves(st, s).forEach(function (m) {
    var c2 = cloneState(st);
    doMove(c2, m);
    if (!inCheck(c2, p.c)) out.push(m);
  });
  return out;
}
function allLegal(st, color) {
  var out = [];
  for (var s = 0; s < 64; s++) {
    var p = st.b[s];
    if (p && p.c === color && color === st.turn) {
      legalMoves(st, s).forEach(function (m) { out.push(m); });
    }
  }
  return out;
}
function hasAnyLegal(st, color) {
  for (var s = 0; s < 64; s++) {
    var p = st.b[s];
    if (p && p.c === color && color === st.turn) {
      var pm = pseudoMoves(st, s);
      for (var i = 0; i < pm.length; i++) {
        var c2 = cloneState(st);
        doMove(c2, pm[i]);
        if (!inCheck(c2, p.c)) return true;
      }
    }
  }
  return false;
}
function gameStatus(st) {
  var turn = st.turn;
  var chk = inCheck(st, turn);
  var any = hasAnyLegal(st, turn);
  if (!any) {
    if (chk) return { over: true, result: turn === 'w' ? '0-1' : '1-0', reason: 'Jaque mate 🏆 — ganan las ' + (turn === 'w' ? 'negras' : 'blancas') };
    return { over: true, result: '½-½', reason: 'Tablas por ahogado 🤝 — sin jugadas legales' };
  }
  if (st.half >= 100) return { over: true, result: '½-½', reason: 'Tablas por 50 jugadas sin captura ni peón 🤝' };
  return { over: false, check: chk };
}
var SAN_LETRA = { n: 'C', b: 'A', r: 'T', q: 'D', k: 'R' };
var PROMO_LETRA = { q: 'D', r: 'T', b: 'A', n: 'C' };
function sanFor(st, m) {
  if (m.castle) return m.castle === 'K' ? 'O-O' : 'O-O-O';
  var p = st.b[m.from];
  var dest = alg(m.to);
  var isCap = !!(st.b[m.to] || m.ep);
  var s = '';
  if (p.t === 'p') {
    s = isCap ? FILES[m.from & 7] + 'x' + dest : dest;
    if (m.promo) s += '=' + (PROMO_LETRA[m.promo] || 'D');
  } else {
    // desambiguación mínima: otra pieza igual que también pueda ir al destino
    var amb = false, sameFile = false;
    for (var x = 0; x < 64; x++) {
      if (x === m.from) continue;
      var q = st.b[x];
      if (q && q.c === p.c && q.t === p.t) {
        var pm = pseudoMoves(st, x);
        for (var i = 0; i < pm.length; i++) {
          if (pm[i].to === m.to && !pm[i].promo) {
            var c2 = cloneState(st);
            doMove(c2, pm[i]);
            if (!inCheck(c2, p.c)) { amb = true; if ((x & 7) === (m.from & 7)) sameFile = true; }
            break;
          }
        }
      }
      if (amb && sameFile) break;
    }
    var dis = '';
    if (amb) dis = sameFile ? String(8 - (m.from >> 3)) : FILES[m.from & 7];
    s = SAN_LETRA[p.t] + dis + (isCap ? 'x' : '') + dest;
  }
  var c2b = cloneState(st);
  doMove(c2b, m);
  var foe = c2b.turn;
  if (inCheck(c2b, foe)) s += hasAnyLegal(c2b, foe) ? '+' : '#';
  return s;
}

/* ================= MOTOR DEL RIVAL (4 niveles) =================
   N0 dos jugadores · N1 Novato (casi azar) · N2 Aprendiz (voraz
   material 1-ply) · N3 Rival (minimax prof.2) · N4 Maestro
   (minimax prof.3 con tablas de posición). El rival juega negras. */
var AJ_NIVELES = [
  { id: 0, n: '👥 Dos jugadores', d: 'Juega con alguien al lado, pasando el dispositivo.' },
  { id: 1, n: '🌱 Novato', d: 'Juega casi al azar, a veces captura. Ideal para tu primera victoria.' },
  { id: 2, n: '🧩 Aprendiz', d: 'Siempre toma lo que brilla: gana material cuando puede. Castiga piezas colgadas.' },
  { id: 3, n: '⚔️ Rival', d: 'Piensa 2 jugadas adelante: ataca y defiende. Te exige cuidar cada pieza.' },
  { id: 4, n: '👑 Maestro', d: 'Piensa 3 jugadas con posición: centro, desarrollo y rey seguro. Un verdadero examen.' }
];
var AJ_VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
// Bonus chico por centralizar (perspectiva blancas; se espeja para negras)
function ajPst(t, s) {
  var r = s >> 3, f = s & 7;
  var c = Math.min(f, 7 - f) + Math.min(r, 7 - r); // 0 borde .. 6 centro
  if (t === 'n' || t === 'b') return (c - 2) * 4;
  if (t === 'p') return (t && r >= 2 && r <= 5 && f >= 2 && f <= 5) ? 8 : 0;
  if (t === 'q' || t === 'r') return (r <= 1 || r >= 6) ? 0 : 4;
  return 0;
}
function ajEval(st) {
  // + a favor blancas, - a favor negras
  var s = 0, i, p;
  for (i = 0; i < 64; i++) {
    p = st.b[i];
    if (!p) continue;
    var v = AJ_VAL[p.t] + ajPst(p.t, i);
    s += (p.c === 'w' ? v : -v);
  }
  return s;
}
function ajOrder(moves, st) {
  var scored = moves.map(function (m) {
    var v = 0;
    var tgt = st.b[m.to];
    if (tgt) v += 10 * AJ_VAL[tgt.t] - AJ_VAL[(st.b[m.from] || {}).t || 'p'];
    if (m.promo) v += 800;
    if (m.castle) v += 30;
    return { m: m, v: v };
  });
  scored.sort(function (a, b) { return b.v - a.v; });
  return scored.map(function (x) { return x.m; });
}
function ajSearch(st, depth, alpha, beta) {
  var gs = gameStatus(st);
  if (gs.over) {
    if (gs.result === '1-0') return 100000 + depth;
    if (gs.result === '0-1') return -100000 - depth;
    return 0;
  }
  if (depth <= 0) return ajEval(st);
  var moves = ajOrder(allLegal(st, st.turn), st);
  if (!moves.length) return ajEval(st);
  var i, sc;
  if (st.turn === 'w') {
    var best = -Infinity;
    for (i = 0; i < moves.length; i++) {
      var u = doMove(st, moves[i]);
      sc = ajSearch(st, depth - 1, alpha, beta);
      undoMove(st, moves[i], u);
      if (sc > best) best = sc;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    var bestB = Infinity;
    for (i = 0; i < moves.length; i++) {
      var u2 = doMove(st, moves[i]);
      sc = ajSearch(st, depth - 1, alpha, beta);
      undoMove(st, moves[i], u2);
      if (sc < bestB) bestB = sc;
      if (bestB < beta) beta = bestB;
      if (alpha >= beta) break;
    }
    return bestB;
  }
}
function ajBestMove(st, depth) {
  var moves = ajOrder(allLegal(st, st.turn), st);
  if (!moves.length) return null;
  var black = st.turn === 'b';
  var best = null, bestSc = black ? Infinity : -Infinity;
  var scored = [];
  for (var i = 0; i < moves.length; i++) {
    var u = doMove(st, moves[i]);
    var sc = ajSearch(st, depth - 1, -Infinity, Infinity);
    undoMove(st, moves[i], u);
    scored.push({ m: moves[i], sc: sc });
    if (black ? sc < bestSc : sc > bestSc) { bestSc = sc; best = moves[i]; }
  }
  return { best: best, scored: scored, score: bestSc };
}
function ajPickMove(st, nivel) {
  var all = allLegal(st, st.turn);
  if (!all.length) return null;
  function promoQ(m) {
    if (!m.promo || m.promo === 'q') return m;
    for (var i = 0; i < all.length; i++) {
      if (all[i].from === m.from && all[i].to === m.to && all[i].promo === 'q') return all[i];
    }
    return m;
  }
  if (nivel <= 1) {
    // Novato: prefiere capturas (70%), si no al azar
    var caps = all.filter(function (x) { return st.b[x.to] || x.ep; });
    var pick = caps.length && Math.random() < 0.7 ? caps[Math.floor(Math.random() * caps.length)] : all[Math.floor(Math.random() * all.length)];
    return promoQ(pick);
  }
  if (nivel === 2) {
    // Aprendiz: voraz 1-ply (mejor evaluación tras mover), 15% despiste
    if (Math.random() < 0.15) return promoQ(all[Math.floor(Math.random() * all.length)]);
    var r = ajBestMove(st, 1);
    if (r && r.best) return promoQ(r.best);
    return promoQ(all[0]);
  }
  var depth = nivel === 3 ? 2 : 3;
  var res = ajBestMove(st, depth);
  if (!res || !res.best) return promoQ(all[0]);
  if (nivel === 3 && res.scored.length > 1 && Math.random() < 0.12) {
    // Rival: a veces elige entre las 3 mejores para no ser predecible
    var black = st.turn === 'b';
    var s = res.scored.slice().sort(function (a, b2) { return black ? a.sc - b2.sc : b2.sc - a.sc; }).slice(0, 3);
    return promoQ(s[Math.floor(Math.random() * s.length)].m);
  }
  return promoQ(res.best);
}
function ajNivelNombre(id) {
  for (var i = 0; i < AJ_NIVELES.length; i++) if (AJ_NIVELES[i].id === id) return AJ_NIVELES[i].n;
  return '👥 Dos jugadores';
}

/* ================= CONTENIDO ================= */
var PIEZAS = [
  { g: '♟', n: 'Peón', v: '1 punto', m: 'Avanza 1 (2 desde inicio), captura en diagonal. Al llegar al final promociona: casi siempre Dama.', t: 'El alma del ajedrez. Los peones sanos ganan finales.' },
  { g: '♞', n: 'Caballo', v: '3 puntos', m: 'Salta en L (2+1). Es la única pieza que salta. Ideal en posiciones cerradas.', t: 'Horquilla: un salto que ataca 2 piezas a la vez.' },
  { g: '♝', n: 'Alfil', v: '3 puntos', m: 'Diagonales. Cada alfil cuida un solo color. Potente en posiciones abiertas.', t: 'Pareja de alfiles: controlan los dos colores.' },
  { g: '♜', n: 'Torre', v: '5 puntos', m: 'Filas y columnas. Domina columnas abiertas y la 7ª fila rival.', t: 'Torres dobladas en columna abierta = presión total.' },
  { g: '♛', n: 'Dama', v: '9 puntos', m: 'Torre + alfil combinados. La más fuerte: úsala con plan, no la saques antes de tiempo.', t: 'Dama temprana = riesgo: el rival la persigue ganando tiempos.' },
  { g: '♚', n: 'Rey', v: 'Infinito ♾️', m: '1 casilla en cualquier dirección. No puede quedar en jaque. En el final, ¡hazlo pelear!', t: 'Enroque: ponlo a salvo y conecta tus torres.' }
];
var REGLAS = [
  { t: '🎯 Objetivo', d: 'Dar jaque mate: atacar al rey rival sin que pueda escapar, taparse o capturar. No se “come” al rey: la partida termina un paso antes.' },
  { t: '⚪⚫ Turnos', d: 'Blancas siempre parten. 1 jugada por turno. Se anota: 1. e4 e5 · 2. Cf3…' },
  { t: '👑 Jaque', d: 'Si tu rey está atacado DEBES salir del jaque: moverlo, tapar la línea o capturar al atacante. No existe “pasar”.' },
  { t: '🏰 Enroque', d: 'Rey 2 casillas hacia la torre y la torre salta al lado. Requiere: ni rey ni torre movidos, sin piezas entremedio y sin pasar por jaque. Corto (O-O) y largo (O-O-O).' },
  { t: '👻 Peón al paso', d: 'Si un peón rival avanza 2 desde inicio y queda al lado del tuyo, puedes capturarlo “al paso” como si hubiera avanzado 1. Solo en la jugada siguiente.' },
  { t: '🎖️ Promoción', d: 'Peón que llega al final se convierte en Dama, Torre, Alfil o Caballo (casi siempre Dama). ¡Un peón puede decidir la partida!' },
  { t: '🤝 Tablas', d: 'Ahogado (sin jugadas y sin jaque), acuerdo mutuo, triple repetición, 50 jugadas sin captura ni peón, o material insuficiente (ej: rey vs rey).' },
  { t: '⏱️ Tres reglas de oro', d: '1) Domina el centro (e4, d4, e5, d5). 2) Desarrolla caballos y alfiles antes que la dama. 3) Enroca pronto y no muevas 2 veces la misma pieza en la apertura.' }
];
var MOTIVOS = [
  { n: '📌 Clavada', d: 'Atacas una pieza que no puede moverse porque detrás está el rey (clavada absoluta) o una pieza mayor (relativa). Ej: Alfil que clava un caballo al rey.' },
  { n: '🍴 Horquilla', d: 'Una pieza ataca 2 a la vez. El caballo es el rey de la horquilla: salta y las dos piezas no se pueden salvar.' },
  { n: '🔭 Rayos X', d: 'Tu pieza ataca A TRAVÉS de otra: si se mueve, cae la de atrás. Típico: torre en la misma columna que el rey rival.' },
  { n: '🎯 Desviación', d: 'Obligas a una pieza defensora a abandonar su puesto con un sacrificio o amenaza mayor. “La dama defendía el mate… hasta que tuvo que irse”.' },
  { n: '🧲 Atracción', d: 'Lo contrario: obligas al rey a venir a una casilla mortal, normalmente con un sacrificio. El mate de la coz es atracción pura.' },
  { n: '🧱 Mate del pasillo', d: 'El rey atrapado en su última fila por sus propios peones cae ante una torre o dama en la 8ª (o 1ª) fila. Solución eterna: ¡dale aire con h3/g3 o h6/g6!' },
  { n: '🐑 Mate pastor', d: 'El más famoso de principiantes: Dama + alfil atacan f7 (o f2). 1. e4 e5 2. Ac4 Cc6 3. Dh5 Cf6?? 4. Dxf7#. Defensa: Cf6 a tiempo, o …g6 y …Ag7.' },
  { n: '🏜️ Mate árabe', d: 'Torre + caballo: la torre da mate en la columna h apoyada por el caballo que quita la casilla de escape (g8). Elegante y antiguo.' }
];
function sqList(arr) {
  // arr: [[alg, 'w'/'b', tipo], ...]
  return arr.map(function (e) { return { s: parseAlg(e[0]), c: e[1], t: e[2] }; });
}
var PUZZLES = [
  {
    id: 'pasillo', n: '1 · El pasillo mortal', tema: 'Mate del pasillo', dif: 'Fácil ⭐',
    d: 'Las negras se encerraron con sus peones. Una torre manda. Juegan blancas.',
    piezas: [['g8', 'b', 'k'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p'], ['g1', 'w', 'k'], ['e1', 'w', 'r']],
    turn: 'w', sol: { from: 'e1', to: 'e8' }, pista: 'La última fila negra está cerrada… busca Te8.'
  },
  {
    id: 'pastor', n: '2 · El pastor ataca', tema: 'Mate pastor', dif: 'Fácil ⭐',
    d: 'Posición real de apertura. Las negras jugaron …Cf6?? El punto f7 está débil. Juegan blancas.',
    piezas: [['e1', 'w', 'k'], ['h5', 'w', 'q'], ['c4', 'w', 'b'], ['a2', 'w', 'p'], ['b2', 'w', 'p'], ['c2', 'w', 'p'], ['d2', 'w', 'p'], ['e4', 'w', 'p'], ['f2', 'w', 'p'], ['g2', 'w', 'p'], ['h2', 'w', 'p'], ['e8', 'b', 'k'], ['d8', 'b', 'q'], ['c6', 'b', 'n'], ['a7', 'b', 'p'], ['b7', 'b', 'p'], ['c7', 'b', 'p'], ['d7', 'b', 'p'], ['e5', 'b', 'p'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']],
    turn: 'w', sol: { from: 'h5', to: 'f7' }, pista: 'Dama x peón de f7: el rey no tiene escape.'
  },
  {
    id: 'dama-apoyo', n: '3 · La dama se apoya', tema: 'Dama + rey', dif: 'Fácil ⭐',
    d: 'Tu rey está cerca y cuida. Acerca la dama con apoyo y es mate. Juegan blancas.',
    piezas: [['d6', 'w', 'k'], ['e5', 'w', 'q'], ['e8', 'b', 'k']],
    turn: 'w', sol: { from: 'e5', to: 'e7' }, pista: 'De5-e7: el rey defiende la dama y no hay escape.'
  },
  {
    id: 'arabe', n: '4 · Mate árabe', tema: 'Torre + caballo', dif: 'Media ⭐⭐',
    d: 'El caballo quita el escape g8. La torre remata por la columna h. Juegan blancas.',
    piezas: [['e1', 'w', 'k'], ['h1', 'w', 'r'], ['f6', 'w', 'n'], ['h8', 'b', 'k'], ['g7', 'b', 'p'], ['a7', 'b', 'p'], ['b7', 'b', 'p']],
    turn: 'w', sol: { from: 'h1', to: 'h7' }, pista: 'Th7: el rey no puede capturar por el caballo.'
  },
  {
    id: 'corona', n: '5 · Coronación mortal', tema: 'Promoción', dif: 'Media ⭐⭐',
    d: 'Un peón a punto de coronar, con el rey apoyando. Solo una promoción da mate. Juegan blancas.',
    piezas: [['f7', 'w', 'k'], ['g7', 'w', 'p'], ['h8', 'b', 'k']],
    turn: 'w', sol: { from: 'g7', to: 'g8', promo: 'q' }, pista: 'Corona dama: cubre h7 y g7 a la vez.'
  },
  {
    id: 'sacro-h7', n: '6 · Sacrificio en h7', tema: 'Dama + alfil', dif: 'Media ⭐⭐',
    d: 'El alfil apunta a h7 desde lejos. La dama se sacrifica donde el alfil muerde. Juegan blancas.',
    piezas: [['g1', 'w', 'k'], ['h5', 'w', 'q'], ['c2', 'w', 'b'], ['g8', 'b', 'k'], ['f8', 'b', 'r'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']],
    turn: 'w', sol: { from: 'h5', to: 'h7' }, pista: 'Dxh7: la torre de f8 le quita el escape y el alfil defiende.'
  },
  {
    id: 'coz', n: '7 · La coz del caballo', tema: 'Mate de la coz', dif: 'Difícil ⭐⭐⭐',
    d: 'El rey negro se ahoga entre sus propias piezas. Un salto lo remata. Juegan blancas.',
    piezas: [['e1', 'w', 'k'], ['d6', 'w', 'n'], ['h8', 'b', 'k'], ['g8', 'b', 'r'], ['g7', 'b', 'p'], ['h7', 'b', 'p']],
    turn: 'w', sol: { from: 'd6', to: 'f7' }, pista: 'Cf7: el rey no tiene casilla entre los suyos.'
  },
  {
    id: 'red-dama', n: '8 · La red de la dama', tema: 'Dama + alfil', dif: 'Difícil ⭐⭐⭐',
    d: 'La dama cruza el tablero y el alfil la sostiene. Teje la red completa. Juegan blancas.',
    piezas: [['g1', 'w', 'k'], ['h5', 'w', 'q'], ['c6', 'w', 'b'], ['g8', 'b', 'k'], ['g7', 'b', 'p'], ['h7', 'b', 'p']],
    turn: 'w', sol: { from: 'h5', to: 'e8' }, pista: 'De8: el alfil cuida desde c6 y no hay escape.'
  }
];
var APERTURAS = [
  { n: '🇮🇹 Apertura Italiana', mov: '1. e4 e5 2. Cf3 Cc6 3. Ac4', seq: [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'c4']], idea: 'Control del centro + ataque rápido a f7. Ideal para aprender: desarrollo natural y enroque corto.', nivel: 'Principiante ⭐', plan: 'Enroca, juega d3 o d4, y presiona f7 con Dama + alfil si se descuida.' },
  { n: '🇪🇸 Apertura Española (Ruy López)', mov: '1. e4 e5 2. Cf3 Cc6 3. Ab5', seq: [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6'], ['f1', 'b5']], idea: 'Presión sobre el caballo que defiende e5. La más jugada de la historia: paciencia y ventaja duradera.', nivel: 'Intermedio ⭐⭐', plan: 'O-O, Te1, c3 y d4: el “martillo español” en el centro.' },
  { n: '🛡️ Defensa Siciliana', mov: '1. e4 c5', seq: [['e2', 'e4'], ['c7', 'c5']], idea: 'Las negras pelean el centro sin copiar. Partidas filosas y contrajuego. La favorita de campeones mundiales.', nivel: 'Intermedio ⭐⭐', plan: 'Blancas: d4 y ataque. Negras: …d6, …Cf6 y contraataque en el flanco dama.' },
  { n: '🇫🇷 Defensa Francesa', mov: '1. e4 e6 2. d4 d5', seq: [['e2', 'e4'], ['e7', 'e6'], ['d2', 'd4'], ['d7', 'd5']], idea: 'Muro sólido y contraataque con …c5. Estructura clara: aprende planes, no solo jugadas.', nivel: 'Intermedio ⭐⭐', plan: 'Negras: presiona d4 con c5 + Cc6. Blancas: cuida tu alfil “malo” de c1.' },
  { n: '🌆 Sistema Londres', mov: '1. d4 d5 2. Af4 Cf6 3. e3 e6 4. Cf3', seq: [['d2', 'd4'], ['d7', 'd5'], ['c1', 'f4'], ['g8', 'f6'], ['e2', 'e3'], ['e7', 'e6'], ['g1', 'f3']], idea: 'Esquema fijo y sólido con blancas: alfil fuera antes de e3. Perfecto para no memorizar toneladas.', nivel: 'Principiante ⭐', plan: 'C3, Ad3, O-O y ataque al flanco rey con Dama + torres.' },
  { n: '👑 Gambito de Dama', mov: '1. d4 d5 2. c4', seq: [['d2', 'd4'], ['d7', 'd5'], ['c2', 'c4']], idea: 'Sacrificas un peón lateral por centro total. Si aceptan (dxc4), desarrollas rápido y lo recuperas.', nivel: 'Avanzado ⭐⭐⭐', plan: 'e3, Axc4, Cf3, O-O: desarrollo relámpago y presión en c7.' }
];
/* Tableros demo de motivos (mismo orden que MOTIVOS): posición + jugada que la muestra */
var AJ_DEMOS = [
  { piezas: [['e1', 'w', 'k'], ['c1', 'w', 'b'], ['a2', 'w', 'p'], ['b2', 'w', 'p'], ['c2', 'w', 'p'], ['e4', 'w', 'p'], ['f2', 'w', 'p'], ['g2', 'w', 'p'], ['h2', 'w', 'p'], ['e8', 'b', 'k'], ['d8', 'b', 'q'], ['f6', 'b', 'n'], ['a7', 'b', 'p'], ['b7', 'b', 'p'], ['c7', 'b', 'p'], ['d7', 'b', 'p'], ['e7', 'b', 'p'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']], turn: 'w', from: 'c1', to: 'g5', jugada: 'Ag5', nota: 'El alfil clava el caballo a la dama: si el caballo se mueve, cae la dama.' },
  { piezas: [['e1', 'w', 'k'], ['e4', 'w', 'n'], ['a2', 'w', 'p'], ['b2', 'w', 'p'], ['c2', 'w', 'p'], ['d2', 'w', 'p'], ['f2', 'w', 'p'], ['g2', 'w', 'p'], ['h2', 'w', 'p'], ['e8', 'b', 'k'], ['f7', 'b', 'q'], ['a7', 'b', 'p'], ['b7', 'b', 'p'], ['c7', 'b', 'p'], ['d7', 'b', 'p'], ['e7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']], turn: 'w', from: 'e4', to: 'd6', jugada: 'Cd6+', nota: '¡Horquilla de caballo con jaque! Ataca rey y dama a la vez: una se salva, la otra cae.' },
  { piezas: [['g1', 'w', 'k'], ['e1', 'w', 'r'], ['f5', 'w', 'n'], ['a2', 'w', 'p'], ['b2', 'w', 'p'], ['c2', 'w', 'p'], ['d2', 'w', 'p'], ['f2', 'w', 'p'], ['g2', 'w', 'p'], ['h2', 'w', 'p'], ['e8', 'b', 'k'], ['e7', 'b', 'q'], ['a7', 'b', 'p'], ['b7', 'b', 'p'], ['c7', 'b', 'p'], ['d7', 'b', 'p'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']], turn: 'w', from: 'e1', to: 'e7', jugada: 'Txe7+', nota: 'Rayos X: la torre mira al rey A TRAVÉS de la dama y la gana (el caballo la defiende).' },
  { piezas: [['g1', 'w', 'k'], ['h5', 'w', 'q'], ['a2', 'w', 'p'], ['b2', 'w', 'p'], ['c2', 'w', 'p'], ['d2', 'w', 'p'], ['e2', 'w', 'p'], ['f2', 'w', 'p'], ['g2', 'w', 'p'], ['h2', 'w', 'p'], ['g8', 'b', 'k'], ['f5', 'b', 'b'], ['a7', 'b', 'p'], ['b7', 'b', 'p'], ['c7', 'b', 'p'], ['d7', 'b', 'p'], ['e7', 'b', 'p'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']], turn: 'w', from: 'g2', to: 'g4', jugada: 'g4', nota: 'Desviación: el peón ataca al alfil que cuida h7. Si se va, cae el mate en h7.' },
  { piezas: [['g1', 'w', 'k'], ['h5', 'w', 'q'], ['a2', 'w', 'p'], ['b2', 'w', 'p'], ['c2', 'w', 'p'], ['d2', 'w', 'p'], ['e2', 'w', 'p'], ['f2', 'w', 'p'], ['g2', 'w', 'p'], ['h2', 'w', 'p'], ['h8', 'b', 'k'], ['a7', 'b', 'p'], ['b7', 'b', 'p'], ['c7', 'b', 'p'], ['d7', 'b', 'p'], ['e7', 'b', 'p'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']], turn: 'w', from: 'h5', to: 'h7', jugada: 'Dxh7+', nota: 'Atracción: la dama se sacrifica y el rey DEBE capturar… quedando al descubierto.' },
  { piezas: [['g1', 'w', 'k'], ['e1', 'w', 'r'], ['g8', 'b', 'k'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']], turn: 'w', from: 'e1', to: 'e8', jugada: 'Te8#', nota: 'Mate del pasillo: la última fila está cerrada por sus propios peones.' },
  { piezas: [['e1', 'w', 'k'], ['h5', 'w', 'q'], ['c4', 'w', 'b'], ['e8', 'b', 'k'], ['d8', 'b', 'q'], ['a7', 'b', 'p'], ['b7', 'b', 'p'], ['c7', 'b', 'p'], ['d7', 'b', 'p'], ['e7', 'b', 'p'], ['f7', 'b', 'p'], ['g7', 'b', 'p'], ['h7', 'b', 'p']], turn: 'w', from: 'h5', to: 'f7', jugada: 'Dxf7#', nota: 'Mate pastor: dama + alfil sobre f7, el punto más débil al inicio.' },
  { piezas: [['e1', 'w', 'k'], ['h1', 'w', 'r'], ['f6', 'w', 'n'], ['h8', 'b', 'k'], ['g7', 'b', 'p'], ['a7', 'b', 'p'], ['b7', 'b', 'p']], turn: 'w', from: 'h1', to: 'h7', jugada: 'Th7#', nota: 'Mate árabe: la torre remata y el caballo quita el escape.' }
];
var LUNA_TIPS = [
  { f: '🌑 Luna nueva', t: 'Tiempo de estudiar: memoriza 1 apertura y 1 motivo táctico. Sin apuro, como sembrar.' },
  { f: '🌒 Creciente', t: 'Entrena puzzles fáciles y juega partidas rápidas. La energía sube: ataca y practica.' },
  { f: '🌓 Cuarto creciente', t: 'Mitad del camino: repasa tus partidas anotadas y corrige 1 error recurrente.' },
  { f: '🌔 Gibosa', t: 'Profundiza: 1 final básico (rey + dama vs rey) hasta hacerlo con los ojos cerrados.' },
  { f: '🌕 Luna llena', t: '¡A jugar! Partida completa con calma y anotación. La mente está plena: compite o enseña a alguien.' },
  { f: '🌖 Menguante', t: 'Analiza sin juicio: ¿dónde perdiste piezas? Anota 3 aprendizajes en tu bitácora.' },
  { f: '🌗 Cuarto menguante', t: 'Juego lento y finales: menos táctica, más paciencia. Bueno para repasar defensas.' },
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
var G = null;            // estado partida libre
var Ghist = [];          // {move, san, undo}
var Gsel = -1, Gmoves = [], Glast = null, Gflip = false, Gpromo = null;
var Gnivel = 0;          // 0 dos jugadores · 1 novato · 2 aprendiz · 3 rival · 4 maestro
var Gauto = false;       // compat: true si Gnivel > 0 (rival automático con negras)
var Gpensando = false;   // el motor está calculando
var PZ = null;           // estado puzzle actual
var PZsel = -1, PZmoves = [], PZidx = 0, PZdone = false;
var PZfiltro = 'Todos';
var MOTIVO_POS = -1;
function ajEsAuto() { return Gnivel > 0; }

function newFreeGame() {
  G = initialState();
  Ghist = []; Gsel = -1; Gmoves = []; Glast = null; Gpromo = null;
}
function posFromList(lista, turn) {
  var b = new Array(64).fill(null);
  sqList(lista).forEach(function (e) { if (e.s >= 0) b[e.s] = { t: e.t, c: e.c }; });
  return { b: b, turn: turn || 'w', cast: { K: false, Q: false, k: false, q: false }, ep: -1, half: 0, full: 1 };
}
function statsDef() { return { jugadas: 0, puzzles: {}, motivosVistos: 0 }; }
function getStats() { var s = store('ajedrezStats', null); if (!s || typeof s !== 'object') { s = statsDef(); try { var u = userData(); u.ajedrezStats = s; } catch (e) {} } if (!s.puzzles) s.puzzles = {}; return s; }
function getPartidas() { var a = store('ajedrezPartidas', []); return Array.isArray(a) ? a : []; }

/* ================= RENDER: TABLERO ================= */
function sqColorCls(r, f) { return ((r + f) % 2 === 0) ? 'aj-light' : 'aj-dark'; }
function boardHTML(st, opts) {
  opts = opts || {};
  var sel = opts.sel, moves = opts.moves || [], last = opts.last, checkSq = opts.checkSq;
  var moveTo = {};
  moves.forEach(function (m) { (moveTo[m.to] = moveTo[m.to] || []).push(m); });
  var h = '<div class="aj-board' + (opts.mini ? ' aj-mini' : '') + '">';
  for (var dr = 0; dr < 8; dr++) {
    var r = opts.flip ? 7 - dr : dr;
    for (var dc = 0; dc < 8; dc++) {
      var f = opts.flip ? 7 - dc : dc;
      var s = SQ(r, f);
      var p = st.b[s];
      var cls = 'aj-sq ' + sqColorCls(r, f);
      if (s === sel) cls += ' aj-sel';
      if (last && (s === last.from || s === last.to)) cls += ' aj-last';
      if (s === checkSq) cls += ' aj-check';
      var dest = moveTo[s];
      if (dest) cls += p ? ' aj-cap' : ' aj-dest';
      var g = p ? GLYPH[p.c][p.t] : '';
      var fg = p ? (p.c === 'w' ? ' aj-w' : ' aj-b') : '';
      var coord = '';
      if (dc === 0) coord += '<span class="aj-coord aj-rank">' + (8 - r) + '</span>';
      if (dr === 7) coord += '<span class="aj-coord aj-file">' + FILES[f] + '</span>';
      h += '<button type="button" class="' + cls + '" data-sq="' + s + '" aria-label="' + alg(s) + (p ? ' ' + PIEZA_NOMBRE[p.t] : '') + '"><span class="aj-p' + fg + '">' + g + '</span>' + coord + '</button>';
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
function capturedLists(st) {
  var start = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  var cur = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } };
  st.b.forEach(function (p) { if (p && p.t !== 'k') cur[p.c][p.t]++; });
  function missing(c) {
    var out = [];
    ['q', 'r', 'b', 'n', 'p'].forEach(function (t) {
      var n = start[t] - cur[c][t];
      for (var i = 0; i < n; i++) out.push(GLYPH[c][t]);
    });
    return out.join(' ');
  }
  return { byWhite: missing('b'), byBlack: missing('w') };
}
function materialDiff(st) {
  var val = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  var w = 0, b = 0;
  st.b.forEach(function (p) { if (p) { if (p.c === 'w') w += val[p.t]; else b += val[p.t]; } });
  if (w === b) return 'Material igualado';
  var d = Math.abs(w - b);
  return (w > b ? 'Blancas +' + d : 'Negras +' + d);
}

/* ---- partida libre ---- */
function renderFree() {
  var box = $('ajBoardBox');
  if (!box || !G) return;
  var st = gameStatus(G);
  var checkSq = -1;
  if (st.check || (st.over && st.result !== '½-½')) checkSq = kingSq(G.b, G.turn);
  box.innerHTML = boardHTML(G, { sel: Gsel, moves: Gmoves, last: Glast, checkSq: checkSq, flip: Gflip });
  bindBoard('ajBoardBox', pickFree);
  // promoción pendiente
  var pr = $('ajPromoBox');
  if (pr) {
    if (Gpromo) {
      pr.classList.remove('hidden');
      pr.innerHTML = '<b>🎖️ Promoción: elige pieza</b><div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' +
        [['q', '♛ Dama'], ['r', '♜ Torre'], ['b', '♝ Alfil'], ['n', '♞ Caballo']].map(function (x) {
          return '<button type="button" class="btn btn-accent aj-promo-btn" data-pr="' + x[0] + '" style="width:auto;font-size:16px">' + x[1] + '</button>';
        }).join('') + '</div>';
      pr.querySelectorAll('.aj-promo-btn').forEach(function (btn) {
        btn.onclick = function () { finishPromo(btn.getAttribute('data-pr')); };
      });
    } else { pr.classList.add('hidden'); pr.innerHTML = ''; }
  }
  // estado
  var info = $('ajStatusBox');
  if (info) {
    var t = '<div class="chip" style="display:block;white-space:normal;line-height:1.6">';
    t += (G.turn === 'w' ? '⚪ Juegan <b>blancas</b>' : '⚫ Juegan <b>negras</b>');
    t += ' · <span class="muted" style="font-size:11px">' + esc(ajNivelNombre(Gnivel)) + '</span>';
    if (Gpensando) t += ' · <b>🤔 pensando…</b>';
    else if (st.over) t += ' · <b>' + esc(st.reason) + '</b> (' + esc(st.result) + ')';
    else if (st.check) t += ' · <b style="color:#ff9a9a">¡Jaque al rey!</b>';
    t += '<br><span class="muted" style="font-size:11px">' + esc(materialDiff(G)) + ' · Jugada ' + G.full + '</span>';
    var cap = capturedLists(G);
    if (cap.byWhite) t += '<br><span style="font-size:13px">⚪ capturó: ' + cap.byWhite + '</span>';
    if (cap.byBlack) t += '<br><span style="font-size:13px">⚫ capturó: ' + cap.byBlack + '</span>';
    t += '</div>';
    info.innerHTML = t;
  }
  var ml = $('ajMovesBox');
  if (ml) {
    if (!Ghist.length) ml.innerHTML = '<span class="muted" style="font-size:11px">Sin jugadas aún. Mueve tocando una pieza y luego su destino.</span>';
    else {
      var h = '';
      for (var i = 0; i < Ghist.length; i += 2) {
        var n = i / 2 + 1;
        h += '<span class="aj-mv"><b>' + n + '.</b> ' + esc(Ghist[i].san) + (Ghist[i + 1] ? ' ' + esc(Ghist[i + 1].san) : '') + '</span>';
      }
      ml.innerHTML = h;
      ml.scrollTop = ml.scrollHeight;
    }
  }
  var fl = $('ajFlipBtn');
  if (fl) fl.textContent = Gflip ? '🔄 Ver desde blancas' : '🔄 Ver desde negras';
}
function pickFree(s) {
  if (!G || Gpromo || Gpensando) return;
  var st = gameStatus(G);
  if (st.over) return;
  var p = G.b[s];
  if (Gsel >= 0) {
    var mv = null;
    for (var i = 0; i < Gmoves.length; i++) if (Gmoves[i].to === s) { mv = Gmoves[i]; break; }
    if (mv) {
      // ¿hay varias promociones al mismo destino? pedir pieza
      var promos = Gmoves.filter(function (m) { return m.to === s && m.promo; });
      if (promos.length > 1) { Gpromo = { from: Gsel, to: s }; renderFree(); return; }
      playMove(mv);
      return;
    }
  }
  if (p && p.c === G.turn) {
    if (ajEsAuto() && G.turn === 'b') return; // turno del autómata
    Gsel = s;
    Gmoves = legalMoves(G, s);
    if (!Gmoves.length) { try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {} }
  } else { Gsel = -1; Gmoves = []; }
  renderFree();
}
function finishPromo(choice) {
  if (!Gpromo) return;
  var cand = legalMoves(G, Gpromo.from).filter(function (m) { return m.to === Gpromo.to && m.promo === choice; });
  Gpromo = null;
  if (cand.length) playMove(cand[0]);
  else renderFree();
}
function playMove(m) {
  var san = sanFor(G, m);
  var undo = doMove(G, m);
  Ghist.push({ move: m, san: san, undo: undo });
  Glast = { from: m.from, to: m.to };
  Gsel = -1; Gmoves = [];
  try { var st = getStats(); st.jugadas++; var u = userData(); u.ajedrezStats = st; save(); } catch (e) {}
  renderFree();
  var gs = gameStatus(G);
  if (gs.over) { save('Partida terminada: ' + gs.result); return; }
  if (ajEsAuto() && G.turn === 'b') {
    Gpensando = true; renderFree();
    var niv = Gnivel;
    var delay = niv >= 4 ? 600 : 450;
    setTimeout(function () {
      Gpensando = false;
      if (!G || $('ajedrezDialog') && !$('ajedrezDialog').open) return;
      if (gameStatus(G).over) { renderFree(); return; }
      var pick = null;
      try { pick = ajPickMove(G, niv); } catch (e) { pick = null; }
      if (!pick) {
        var all = allLegal(G, 'b');
        if (!all.length) { renderFree(); return; }
        pick = all[Math.floor(Math.random() * all.length)];
      }
      playMove(pick);
    }, delay);
  }
}
function undoFree() {
  if (Gpensando) return;
  var h = Ghist.pop();
  if (!h) return;
  undoMove(G, h.move, h.undo);
  if (ajEsAuto() && Ghist.length) { var h2 = Ghist.pop(); undoMove(G, h2.move, h2.undo); }
  Glast = Ghist.length ? { from: Ghist[Ghist.length - 1].move.from, to: Ghist[Ghist.length - 1].move.to } : null;
  Gsel = -1; Gmoves = []; Gpromo = null;
  renderFree();
}

/* ---- puzzles ---- */
function loadPuzzle(i) {
  PZidx = i; PZdone = false; PZsel = -1; PZmoves = [];
  var P = PUZZLES[i];
  PZ = posFromList(P.piezas, P.turn);
  renderPuzzle();
}
function renderPuzzle() {
  var P = PUZZLES[PZidx];
  var box = $('ajPuzBoard');
  if (!box || !PZ) return;
  var chk = inCheck(PZ, PZ.turn) ? kingSq(PZ.b, PZ.turn) : -1;
  var last = null;
  box.innerHTML = boardHTML(PZ, { sel: PZsel, moves: PZmoves, last: last, checkSq: chk, flip: false, mini: true });
  bindBoard('ajPuzBoard', pickPuzzle);
  var info = $('ajPuzInfo');
  if (info) {
    var st = getStats();
    var ok = st.puzzles[P.id] ? ' ✅ resuelto' : '';
    info.innerHTML = '<div class="si-card" style="border-color:var(--gold)"><h4>' + esc(P.n) + ok + ' <span class="chip" style="font-size:10px">' + esc(P.dif || 'Fácil ⭐') + '</span></h4>' +
      '<p>' + esc(P.d) + '</p>' +
      '<p class="muted" style="font-size:11px">Tema: ' + esc(P.tema) + ' · Juegan ' + (P.turn === 'w' ? 'blancas' : 'negras') + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn" id="ajPuzHint" style="width:auto;font-size:11px">💡 Pista</button>' +
      '<button type="button" class="btn" id="ajPuzReset" style="width:auto;font-size:11px">🔁 Reiniciar</button>' +
      '</div><div id="ajPuzMsg" class="chip" style="display:block;margin-top:8px;white-space:normal">' + (PZdone ? '🏆 ¡Mate! Excelente cálculo.' : 'Toca tu pieza y luego el destino. Da mate en 1.') + '</div></div>';
    var hb = $('ajPuzHint');
    if (hb) hb.onclick = function () { var m = $('ajPuzMsg'); if (m) m.textContent = '💡 ' + P.pista; };
    var rb = $('ajPuzReset');
    if (rb) rb.onclick = function () { loadPuzzle(PZidx); };
  }
  var nav = $('ajPuzNav');
  if (nav) {
    var st0 = getStats();
    var nOk = PUZZLES.filter(function (q) { return st0.puzzles[q.id]; }).length;
    var fBtns = ['Todos', 'Fácil ⭐', 'Media ⭐⭐', 'Difícil ⭐⭐⭐'].map(function (f) {
      return '<button type="button" class="btn' + (PZfiltro === f ? ' btn-accent' : '') + '" data-pzf="' + f + '" style="width:auto;font-size:10px">' + f + '</button>';
    }).join('');
    var list = PUZZLES.map(function (q, i) { return { q: q, i: i }; }).filter(function (x) {
      return PZfiltro === 'Todos' || (x.q.dif || '') === PZfiltro;
    });
    nav.innerHTML = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;align-items:center"><span class="muted" style="font-size:10px">🎯 ' + nOk + '/' + PUZZLES.length + ' · ver:</span>' + fBtns + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' + list.map(function (x) {
        return '<button type="button" class="btn' + (x.i === PZidx ? ' btn-accent' : '') + '" data-pz="' + x.i + '" style="width:auto;font-size:11px">' + (st0.puzzles[x.q.id] ? '✅ ' : '') + esc(x.q.n) + '</button>';
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
      var solFrom = parseAlg(P.sol.from), solTo = parseAlg(P.sol.to);
      var good = cands.filter(function (m) {
        return m.from === solFrom && m.to === solTo && (P.sol.promo ? m.promo === P.sol.promo : !m.promo);
      });
      var msg = $('ajPuzMsg');
      if (good.length) {
        var undo = doMove(PZ, good[0]);
        void undo;
        PZdone = true;
        try { var st = getStats(); st.puzzles[P.id] = true; var u = userData(); u.ajedrezStats = st; save('¡Puzzle resuelto! 🏆'); } catch (e) {}
      } else {
        if (msg) msg.textContent = '❌ Esa no da mate. Vuelve a mirar: ' + P.pista;
        try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
        PZsel = -1; PZmoves = [];
      }
      renderPuzzle();
      return;
    }
  }
  var p = PZ.b[s];
  if (p && p.c === PZ.turn) { PZsel = s; PZmoves = legalMoves(PZ, s); }
  else { PZsel = -1; PZmoves = []; }
  renderPuzzle();
}

/* ================= RENDER: PESTAÑAS ================= */
function switchTab(t) {
  TAB = t;
  ['jugar', 'aprender', 'tactica', 'aperturas', 'partidas'].forEach(function (k) {
    var b = $('tabAj' + k.charAt(0).toUpperCase() + k.slice(1));
    if (b) b.classList.toggle('btn-accent', k === t);
    var p = $('ajPanel' + k.charAt(0).toUpperCase() + k.slice(1));
    if (p) p.classList.toggle('hidden', k !== t);
  });
  if (t === 'jugar') renderFree();
  if (t === 'tactica') { renderDemoTactica(); renderPuzzle(); }
  if (t === 'aprender') { renderLuna(); renderDemoAprender(); }
  if (t === 'aperturas') renderDemoAperturas();
  if (t === 'partidas') renderPartidas();
}
function renderLuna() {
  var box = $('ajLunaBox');
  if (!box) return;
  var f = lunaFaseAprox();
  var tip = LUNA_TIPS[f.idx] || LUNA_TIPS[4];
  box.innerHTML = '<b>🌙 Consejo lunar · iluminación ' + f.ilum + '%</b><br>' +
    '<span style="color:var(--gold)">' + esc(tip.f) + '</span> — ' + esc(tip.t);
}
function renderAprender() {
  var box = $('ajPiezasBox');
  if (!box) return;
  box.innerHTML = PIEZAS.map(function (p) {
    return '<div class="si-card"><h4><span style="font-size:22px">' + p.g + '</span> ' + esc(p.n) + ' · <span class="muted">' + esc(p.v) + '</span></h4>' +
      '<p><b>Mueve:</b> ' + esc(p.m) + '</p><p class="muted" style="font-size:11px">💡 ' + esc(p.t) + '</p></div>';
  }).join('') + REGLAS.map(function (r) {
    return '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>' + esc(r.t) + '</h4><p>' + esc(r.d) + '</p></div>';
  }).join('') +
    '<div class="si-card"><h4>✍️ Notación (para tu bitácora)</h4><p class="muted" style="font-size:11px;line-height:1.7">Piezas: R=Rey · D=Dama · T=Torre · A=Alfil · C=Caballo (peón sin letra).<br>Ej: <b>Cf3</b> = caballo a f3 · <b>exd5</b> = peón e captura en d5 · <b>O-O</b> = enroque corto · <b>+</b> jaque · <b>#</b> mate · <b>1-0</b> ganan blancas · <b>0-1</b> ganan negras · <b>½-½</b> tablas.</p></div>';
}
function renderMotivos() {
  var box = $('ajMotivosBox');
  if (!box) return;
  box.innerHTML = MOTIVOS.map(function (m, i) {
    return '<div class="si-card"><h4>' + esc(m.n) + '</h4><p>' + esc(m.d) + '</p></div>';
  }).join('');
}
function renderAperturas() {
  var box = $('ajAperturasBox');
  if (!box) return;
  box.innerHTML = APERTURAS.map(function (a) {
    return '<div class="si-card"><h4>' + esc(a.n) + ' <span class="chip" style="font-size:10px">' + esc(a.nivel) + '</span></h4>' +
      '<p><b>' + esc(a.mov) + '</b></p><p>' + esc(a.idea) + '</p><p class="muted" style="font-size:11px">📋 Plan: ' + esc(a.plan) + '</p></div>';
  }).join('');
}

/* ============ DEMO 1 · APRENDER: explorador de movimientos ============ */
var DAst = null, DAsel = -1, DAmoves = [], DAlast = null, DAplies = 0;
function demoAInit() { DAst = initialState(); DAsel = -1; DAmoves = []; DAlast = null; DAplies = 0; }
function renderDemoAprender() {
  var box = $('ajDemoABoard');
  if (!box) return;
  if (!DAst) demoAInit();
  var chk = inCheck(DAst, DAst.turn) ? kingSq(DAst.b, DAst.turn) : -1;
  box.innerHTML = boardHTML(DAst, { sel: DAsel, moves: DAmoves, last: DAlast, checkSq: chk, flip: false, mini: true });
  bindBoard('ajDemoABoard', pickDemoA);
  var info = $('ajDemoAInfo');
  if (info) {
    var selTxt;
    if (DAsel >= 0 && DAst.b[DAsel]) {
      var p = DAst.b[DAsel];
      selTxt = '👆 <b>' + esc(PIEZA_NOMBRE[p.t]) + ' en ' + alg(DAsel) + '</b> → ' + DAmoves.length + ' destino' + (DAmoves.length === 1 ? '' : 's') + ' marcado' + (DAmoves.length === 1 ? '' : 's') + '. Toca un destino para mover.';
    } else {
      selTxt = '👆 Toca <b>cualquier pieza</b> (blanca o negra) y se iluminan sus jugadas legales. Toca un destino para moverla.';
    }
    info.innerHTML = '<div class="chip" style="display:block;white-space:normal;line-height:1.6">' + selTxt +
      '<br><span class="muted" style="font-size:11px">Jugadas hechas: ' + DAplies + ' · Turno: ' + (DAst.turn === 'w' ? '⚪ blancas' : '⚫ negras') + '</span></div>';
  }
}
function pickDemoA(s) {
  if (!DAst) demoAInit();
  if (DAsel >= 0) {
    var cands = DAmoves.filter(function (m) { return m.to === s; });
    if (cands.length) {
      var mv = cands[0];
      if (mv.promo) {
        var q = cands.filter(function (m) { return m.promo === 'q'; });
        if (q.length) mv = q[0];
      }
      doMove(DAst, mv);
      DAlast = { from: mv.from, to: mv.to };
      DAplies++;
      DAsel = -1; DAmoves = [];
      renderDemoAprender();
      return;
    }
  }
  var p = DAst.b[s];
  if (p) { DAst.turn = p.c; DAsel = s; DAmoves = legalMoves(DAst, s); }
  else { DAsel = -1; DAmoves = []; }
  renderDemoAprender();
}

/* ============ DEMO 2 · TÁCTICA: un motivo, una jugada ============ */
var MOidx = 0, MOst = null, MOshown = false, MOsan = '', MOsol = null, MOsel = -1, MOselMoves = [];
function demoTInit(i) {
  MOidx = (i == null ? MOidx : i);
  var D = AJ_DEMOS[MOidx];
  MOst = posFromList(D.piezas, D.turn);
  MOshown = false; MOsan = ''; MOsol = null; MOsel = -1; MOselMoves = [];
}
function renderDemoTactica() {
  var box = $('ajDemoTBoard');
  if (!box) return;
  if (!MOst) demoTInit(0);
  var D = AJ_DEMOS[MOidx], M = MOTIVOS[MOidx];
  var chk = inCheck(MOst, MOst.turn) ? kingSq(MOst.b, MOst.turn) : -1;
  box.innerHTML = boardHTML(MOst, { sel: MOsel, moves: MOselMoves, last: MOsol, checkSq: chk, flip: false, mini: true });
  bindBoard('ajDemoTBoard', pickDemoT);
  var btns = $('ajDemoTBtns');
  if (btns) {
    btns.innerHTML = MOTIVOS.map(function (m, i) {
      return '<button type="button" class="btn' + (i === MOidx ? ' btn-accent' : '') + '" data-mot="' + i + '" style="width:auto;font-size:10px">' + esc(m.n) + '</button>';
    }).join('');
    btns.querySelectorAll('[data-mot]').forEach(function (b) {
      b.onclick = function () { demoTInit(parseInt(b.getAttribute('data-mot'), 10)); renderDemoTactica(); };
    });
  }
  var info = $('ajDemoTInfo');
  if (info) {
    info.innerHTML = '<div class="si-card" style="border-color:var(--gold)"><h4>' + esc(M.n) + '</h4><p>' + esc(M.d) + '</p>' +
      (MOshown
        ? '<p>▶ Jugada: <b>' + esc(MOsan || D.jugada) + '</b> — ' + esc(D.nota) + '</p>'
        : '<p class="muted" style="font-size:11px">Mira la posición, intenta adivinar la jugada… y luego tócala en el tablero o pulsa ▶.</p>') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn btn-accent" id="ajDemoTShow" style="width:auto;font-size:11px">▶ Ver la jugada' + (MOshown ? ' ✓' : '') + '</button>' +
      '<button type="button" class="btn" id="ajDemoTReset" style="width:auto;font-size:11px">🔁 Reiniciar</button></div></div>';
    var sh = $('ajDemoTShow');
    if (sh) sh.onclick = function () { demoTPlay(); };
    var rs = $('ajDemoTReset');
    if (rs) rs.onclick = function () { demoTInit(MOidx); renderDemoTactica(); };
  }
}
function demoTPlay() {
  if (!MOst || MOshown) { renderDemoTactica(); return; }
  var D = AJ_DEMOS[MOidx];
  var from = parseAlg(D.from), to = parseAlg(D.to);
  MOst.turn = D.turn;
  var cands = legalMoves(MOst, from).filter(function (m) { return m.to === to; });
  if (!cands.length) { MOsan = ''; MOshown = true; renderDemoTactica(); return; }
  var mv = cands[0];
  MOsan = sanFor(MOst, mv) + ' (' + D.jugada + ')';
  doMove(MOst, mv);
  MOsol = { from: mv.from, to: mv.to };
  MOshown = true; MOsel = -1; MOselMoves = [];
  renderDemoTactica();
}
function pickDemoT(s) {
  if (!MOst || MOshown) return;
  var D = AJ_DEMOS[MOidx];
  if (MOsel >= 0) {
    var cands = MOselMoves.filter(function (m) { return m.to === s; });
    if (cands.length) {
      var solFrom = parseAlg(D.from), solTo = parseAlg(D.to);
      var good = cands.filter(function (m) { return m.from === solFrom && m.to === solTo; });
      if (good.length) { demoTPlay(); return; }
      MOsel = -1; MOselMoves = [];
      renderDemoTactica();
      return;
    }
  }
  var p = MOst.b[s];
  if (p && p.c === MOst.turn) { MOst.turn = p.c; MOsel = s; MOselMoves = legalMoves(MOst, s); }
  else { MOsel = -1; MOselMoves = []; }
  renderDemoTactica();
}

/* ============ DEMO 3 · APERTURAS: paso a paso ============ */
var APidx = 0, APply = 0;
function demoApPos() {
  var st = initialState();
  var sans = [];
  var seq = APERTURAS[APidx].seq || [];
  for (var i = 0; i < Math.min(APply, seq.length); i++) {
    var from = parseAlg(seq[i][0]), to = parseAlg(seq[i][1]);
    var cands = legalMoves(st, from).filter(function (m) { return m.to === to; });
    if (!cands.length) break;
    var mv = cands[0];
    if (mv.promo) { var q = cands.filter(function (m) { return m.promo === 'q'; }); if (q.length) mv = q[0]; }
    sans.push(sanFor(st, mv));
    doMove(st, mv);
  }
  return { st: st, sans: sans };
}
function renderDemoAperturas() {
  var box = $('ajDemoApBoard');
  if (!box) return;
  var A = APERTURAS[APidx];
  var seq = A.seq || [];
  if (APply < 0) APply = 0;
  if (APply > seq.length) APply = seq.length;
  var r = demoApPos();
  var chk = inCheck(r.st, r.st.turn) ? kingSq(r.st.b, r.st.turn) : -1;
  var last = null;
  if (APply > 0) {
    var prev = seq[APply - 1];
    last = { from: parseAlg(prev[0]), to: parseAlg(prev[1]) };
  }
  box.innerHTML = boardHTML(r.st, { sel: -1, moves: [], last: last, checkSq: chk, flip: false, mini: true });
  var sel = $('ajDemoApSel');
  if (sel && !sel.options.length) {
    sel.innerHTML = APERTURAS.map(function (a, i) { return '<option value="' + i + '">' + esc(a.n) + '</option>'; }).join('');
    sel.value = String(APidx);
    sel.onchange = function () { APidx = parseInt(sel.value, 10) || 0; APply = 0; renderDemoAperturas(); };
  }
  if (sel && sel.value !== String(APidx)) sel.value = String(APidx);
  var info = $('ajDemoApInfo');
  if (info) {
    var txt = r.sans.length ? r.sans.map(function (s2, i) {
      return (i % 2 === 0 ? Math.floor(i / 2 + 1) + '. ' : '') + s2;
    }).join(' ') : 'Posición inicial.';
    info.innerHTML = '<div class="chip" style="display:block;white-space:normal;line-height:1.6"><b>' + esc(A.n) + '</b> · jugada ' + APply + '/' + seq.length +
      '<br>' + esc(txt) +
      '<br><span class="muted" style="font-size:11px">' + esc(A.plan) + '</span></div>';
  }
  function go(n) { APply = Math.max(0, Math.min(seq.length, n)); renderDemoAperturas(); }
  var bS = $('ajDemoApStart'); if (bS) bS.onclick = function () { go(0); };
  var bP = $('ajDemoApPrev'); if (bP) bP.onclick = function () { go(APply - 1); };
  var bN = $('ajDemoApNext'); if (bN) bN.onclick = function () { go(APply + 1); };
  var bE = $('ajDemoApEnd'); if (bE) bE.onclick = function () { go(seq.length); };
}

/* ---- bitácora ---- */
var editId = null;
function renderPartidas() {
  var list = getPartidas();
  var box = $('ajLogList');
  if (!box) return;
  var w = list.filter(function (x) { return x.res === '1-0' && x.color === 'blancas' || x.res === '0-1' && x.color === 'negras'; }).length;
  var l = list.filter(function (x) { return x.res === '1-0' && x.color === 'negras' || x.res === '0-1' && x.color === 'blancas'; }).length;
  var d = list.filter(function (x) { return x.res === '½-½'; }).length;
  var st = $('ajLogStats');
  if (st) st.textContent = list.length ? (list.length + ' partidas · ✅ ' + w + ' ganadas · ❌ ' + l + ' perdidas · 🤝 ' + d + ' tablas') : 'Sin partidas aún';
  if (!list.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Anota tu primera partida: fecha, rival, apertura y qué aprendiste. El cuaderno hace al maestro.</p>'; return; }
  var sorted = list.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  box.innerHTML = sorted.map(function (x) {
    var resTxt = x.res === '1-0' ? '⚪ 1-0' : x.res === '0-1' ? '⚫ 0-1' : '🤝 ½-½';
    return '<div class="habit-item"><div class="habit-head"><b>' + esc(x.fecha) + '</b><span class="chip" style="font-size:10px">' + resTxt + '</span>' +
      '<span class="chip" style="font-size:10px">' + (x.color === 'blancas' ? '⚪' : '⚫') + ' ' + esc(x.color) + '</span>' +
      '<span style="flex:1"></span>' +
      '<button type="button" class="btn btn-icon" data-edit="' + x.id + '" title="Editar">✏️</button>' +
      '<button type="button" class="btn btn-icon" data-del="' + x.id + '" title="Borrar">🗑</button></div>' +
      '<div style="font-size:12px"><b>' + esc(x.rival || 'Sin rival') + '</b>' + (x.apertura ? ' · <span class="muted">' + esc(x.apertura) + '</span>' : '') + '</div>' +
      (x.notas ? '<div class="muted" style="font-size:11px;margin-top:2px">' + esc(x.notas) + '</div>' : '') + '</div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-del');
      var u = userData();
      u.ajedrezPartidas = getPartidas().filter(function (x) { return x.id !== id; });
      save('Partida borrada'); renderPartidas();
    };
  });
  box.querySelectorAll('[data-edit]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-edit');
      var x = getPartidas().filter(function (y) { return y.id === id; })[0];
      if (!x) return;
      editId = id;
      $('ajFecha').value = x.fecha || todayKey();
      $('ajRival').value = x.rival || '';
      $('ajColor').value = x.color || 'blancas';
      $('ajApertura').value = x.apertura || '';
      $('ajRes').value = x.res || '1-0';
      $('ajNotas').value = x.notas || '';
      $('ajAddBtn').textContent = '↻ Actualizar partida';
      $('ajCancelEdit').classList.remove('hidden');
    };
  });
}
function setupLog() {
  if (!$('ajFecha')) return;
  if (!$('ajFecha').value) $('ajFecha').value = todayKey();
  var add = $('ajAddBtn');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var u = userData();
      var arr = getPartidas();
      var data = {
        id: editId || uid('aj'),
        fecha: $('ajFecha').value || todayKey(),
        rival: clean($('ajRival').value, 30),
        color: $('ajColor').value,
        apertura: clean($('ajApertura').value, 40),
        res: $('ajRes').value,
        notas: clean($('ajNotas').value, 120)
      };
      if (editId) {
        for (var i = 0; i < arr.length; i++) if (arr[i].id === editId) arr[i] = data;
      } else arr.push(data);
      u.ajedrezPartidas = arr;
      editId = null;
      add.textContent = '+ Guardar partida';
      $('ajCancelEdit').classList.add('hidden');
      $('ajRival').value = ''; $('ajNotas').value = '';
      save('Partida guardada ♟️'); renderPartidas();
    };
  }
  var ce = $('ajCancelEdit');
  if (ce && !ce.dataset.w) {
    ce.dataset.w = '1';
    ce.onclick = function () {
      editId = null;
      $('ajAddBtn').textContent = '+ Guardar partida';
      ce.classList.add('hidden');
    };
  }
  var cl = $('ajClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de ajedrez?')) return;
      var u = userData();
      u.ajedrezPartidas = [];
      save('Bitácora borrada'); renderPartidas();
    };
  }
  var sh = $('ajShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var arr = getPartidas();
      if (!arr.length) { alert('Sin partidas para compartir'); return; }
      var txt = arr.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); })
        .map(function (x) { return x.fecha + ' · ' + (x.color === 'blancas' ? '⚪' : '⚫') + ' vs ' + (x.rival || '?') + ' · ' + x.res + (x.apertura ? ' · ' + x.apertura : '') + (x.notas ? '\n  → ' + x.notas : ''); }).join('\n');
      share('♟️ Mis partidas de ajedrez', txt);
    };
  }
}

/* ================= DIALOG ================= */
function buildDialog() {
  if ($('ajedrezDialog')) return $('ajedrezDialog');
  var d = document.createElement('dialog');
  d.id = 'ajedrezDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">♟️ Ajedrez — gimnasio de la mente</h3>' +
    '<button type="button" id="ajCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Juega, aprende y anota. Desde el mate pastor hasta tu primera victoria en la plaza. Todo queda <b>privado y local</b> por usuario.</p>' +
    '<div id="ajLunaBox" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px;font-size:12px;line-height:1.6"></div>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabAjJugar" class="btn btn-accent" style="width:auto">♟️ Jugar</button>' +
    '<button type="button" id="tabAjAprender" class="btn" style="width:auto">📖 Aprender</button>' +
    '<button type="button" id="tabAjTactica" class="btn" style="width:auto">⚔️ Táctica</button>' +
    '<button type="button" id="tabAjAperturas" class="btn" style="width:auto">♞ Aperturas</button>' +
    '<button type="button" id="tabAjPartidas" class="btn" style="width:auto">📓 Mis partidas</button>' +
    '</div>' +
    '<div id="ajPanelJugar">' +
    '<div id="ajStatusBox" style="margin-bottom:8px"></div>' +
    '<div id="ajBoardBox" class="aj-wrap"></div>' +
    '<div id="ajPromoBox" class="menstrual-card hidden" style="margin-top:8px;border-color:var(--gold)"></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;align-items:center">' +
    '<button type="button" id="ajUndoBtn" class="btn" style="width:auto;font-size:11px">↩ Deshacer</button>' +
    '<button type="button" id="ajNewBtn" class="btn" style="width:auto;font-size:11px">🔀 Nueva partida</button>' +
    '<button type="button" id="ajFlipBtn" class="btn" style="width:auto;font-size:11px">🔄 Ver desde negras</button>' +
    '<label style="margin:0;font-size:11px;display:flex;gap:6px;align-items:center">🤖 Rival <select id="ajNivel" style="max-width:150px">' +
    AJ_NIVELES.map(function (x) { return '<option value="' + x.id + '">' + x.n + '</option>'; }).join('') + '</select></label>' +
    '</div>' +
    '<p id="ajNivelHint" class="muted" style="font-size:10px;margin:6px 0 0"></p>' +
    '<div class="menstrual-card" style="margin-top:8px"><h4>📝 Jugadas</h4><div id="ajMovesBox" class="aj-moves"></div>' +
    '<p class="muted" style="font-size:10px;margin:6px 0 0">Copia esta notación a tu bitácora. Consejo: si pierdes una pieza sin compensación, respira y busca contrajuego.</p></div>' +
    '</div>' +
    '<div id="ajPanelAprender" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"><h4>♟️ Tablero: toca una pieza y ve a dónde puede ir</h4>' +
    '<p class="muted" style="font-size:11px">Explorador libre desde la posición inicial: toca <b>cualquier pieza</b> para iluminar sus jugadas legales y muévela. Vale para blancas y negras.</p>' +
    '<div id="ajDemoABoard" class="aj-wrap"></div>' +
    '<div id="ajDemoAInfo" style="margin-top:8px"></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ajDemoAReset" class="btn" style="width:auto;font-size:11px">🔁 Reiniciar tablero</button></div></div>' +
    '<div id="ajPiezasBox"></div>' +
    '</div>' +
    '<div id="ajPanelTactica" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"><h4>👁️ Tablero: mira el motivo en acción</h4>' +
    '<p class="muted" style="font-size:11px">Elige un motivo, estudia la posición e intenta la jugada en el tablero. Si no la ves, pulsa ▶.</p>' +
    '<div id="ajDemoTBtns" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"></div>' +
    '<div id="ajDemoTBoard" class="aj-wrap"></div>' +
    '<div id="ajDemoTInfo" style="margin-top:8px"></div></div>' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⚔️ Motivos que ganan partidas</h4><p class="muted" style="font-size:11px">La táctica es el 90% de las partidas entre principiantes: quien ve 1 jugada más, gana pieza y suele ganar.</p></div>' +
    '<div id="ajMotivosBox" style="margin-top:8px"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🧩 Mate en 1 — calcula y toca</h4>' +
    '<p class="muted" style="font-size:11px">8 puzzles por dificultad: 3 fáciles ⭐ · 3 medios ⭐⭐ · 2 difíciles ⭐⭐⭐. Filtra arriba y completa tu marcador.</p>' +
    '<div id="ajPuzNav" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"></div>' +
    '<div id="ajPuzBoard" class="aj-wrap"></div>' +
    '<div id="ajPuzInfo" style="margin-top:8px"></div></div>' +
    '</div>' +
    '<div id="ajPanelAperturas" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"><h4>♞ Tablero: recorre la apertura paso a paso</h4>' +
    '<p class="muted" style="font-size:11px">Elige una apertura y avanza jugada por jugada con ◀ ▶. Fíjate dónde queda cada pieza.</p>' +
    '<div class="conv-row"><label style="flex:2">Apertura <select id="ajDemoApSel"></select></label></div>' +
    '<div id="ajDemoApBoard" class="aj-wrap" style="margin-top:8px"></div>' +
    '<div id="ajDemoApInfo" style="margin-top:8px"></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
    '<button type="button" id="ajDemoApStart" class="btn" style="width:auto;font-size:11px">⏮ Inicio</button>' +
    '<button type="button" id="ajDemoApPrev" class="btn" style="width:auto;font-size:11px">◀ Atrás</button>' +
    '<button type="button" id="ajDemoApNext" class="btn btn-accent" style="width:auto;font-size:11px">Adelante ▶</button>' +
    '<button type="button" id="ajDemoApEnd" class="btn" style="width:auto;font-size:11px">Final ⏭</button></div></div>' +
    '<div id="ajAperturasBox"></div>' +
    '<div class="si-card"><h4>🧭 ¿Por dónde empiezo?</h4><p class="muted" style="font-size:11px">Elige 1 apertura con blancas (Italiana o Londres) y 1 defensa con negras (Francesa o Siciliana). Repite sus primeras 6 jugadas hasta soñarlas. Después, táctica todos los días.</p></div></div>' +
    '<div id="ajPanelPartidas" class="hidden">' +
    '<div class="menstrual-card"><h4>📓 Anotar partida</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ajFecha"></label>' +
    '<label>Rival <input type="text" id="ajRival" placeholder="ej: vecina Marta, primo, yo solo" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Color <select id="ajColor"><option value="blancas">⚪ Blancas</option><option value="negras">⚫ Negras</option></select></label>' +
    '<label>Resultado <select id="ajRes"><option value="1-0">1-0 ganan blancas</option><option value="0-1">0-1 ganan negras</option><option value="½-½">½-½ tablas</option></select></label></div>' +
    '<label>Apertura <input type="text" id="ajApertura" placeholder="ej: Italiana, Siciliana, libre…" maxlength="40"></label>' +
    '<label>¿Qué aprendí? <input type="text" id="ajNotas" placeholder="ej: no sacar la dama tan pronto, cuidar f7" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="ajAddBtn" class="btn btn-accent" style="width:auto">+ Guardar partida</button>' +
    '<button type="button" id="ajCancelEdit" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div id="ajLogList" class="habits-list" style="margin-top:10px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="ajLogStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="ajShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="ajClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div>' +
    '</div>' +
    '<div class="dlg-actions"><button type="button" id="ajClose" class="btn">Cerrar</button></div>' +
    '</form>';
  document.body.appendChild(d);
  $('ajCloseTop').onclick = function () { try { d.close(); } catch (e) {} };
  $('ajClose').onclick = function () { try { d.close(); } catch (e) {} };
  [['tabAjJugar', 'jugar'], ['tabAjAprender', 'aprender'], ['tabAjTactica', 'tactica'], ['tabAjAperturas', 'aperturas'], ['tabAjPartidas', 'partidas']].forEach(function (x) {
    var b = $(x[0]);
    if (b && !b.dataset.w) { b.dataset.w = '1'; b.onclick = function () { switchTab(x[1]); }; }
  });
  $('ajUndoBtn').onclick = undoFree;
  $('ajNewBtn').onclick = function () { newFreeGame(); renderFree(); };
  $('ajFlipBtn').onclick = function () { Gflip = !Gflip; renderFree(); };
  if ($('ajDemoAReset')) $('ajDemoAReset').onclick = function () { demoAInit(); renderDemoAprender(); };
  var _ajSyncHint = function () {
    var h = $('ajNivelHint');
    if (h) {
      var lv = AJ_NIVELES[Gnivel] || AJ_NIVELES[0];
      h.textContent = lv.d + (Gnivel > 0 ? ' Tú eres blancas, el rival mueve negras.' : '');
    }
    var sel = $('ajNivel');
    if (sel && String(Gnivel) !== sel.value) sel.value = String(Gnivel);
  };
  var _ajSel = $('ajNivel');
  if (_ajSel) {
    _ajSel.value = String(Gnivel || 0);
    _ajSel.onchange = function () {
      Gnivel = parseInt(_ajSel.value, 10) || 0;
      Gauto = Gnivel > 0;
      try { var st = getStats(); st.nivel = Gnivel; var u = userData(); u.ajedrezStats = st; save(); } catch (e) {}
      _ajSyncHint(); renderFree();
      if (Gnivel > 0 && G && G.turn === 'b' && !gameStatus(G).over) {
        Gpensando = true; renderFree();
        (function (niv) {
          setTimeout(function () {
            Gpensando = false;
            if (!G) return;
            var pick = null;
            try { pick = ajPickMove(G, niv); } catch (e2) { pick = null; }
            if (pick) playMove(pick); else renderFree();
          }, 450);
        })(Gnivel);
      }
    };
  }
  _ajSyncHint();
  try { var _st = getStats(); if (_st && _st.nivel >= 0 && _st.nivel <= 4) { Gnivel = _st.nivel; Gauto = Gnivel > 0; _ajSyncHint(); } } catch (e) {}
  return d;
}

/* ================= SETUP ================= */
function injectButton() {
  var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
  if (!g) g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
  if (!g) return;
  if ($('btnAjedrez')) {
    try {
      var cur = $('btnAjedrez');
      if (cur.parentNode !== g) g.appendChild(cur);
      try { cur.setAttribute('data-sub', 'juegos'); } catch (eS) {}
      if (typeof reordenarAcciones === 'function') reordenarAcciones();
    } catch (eM) {}
    return;
  }
  var btn = document.createElement('button');
  btn.id = 'btnAjedrez'; btn.className = 'btn'; btn.type = 'button';
  btn.textContent = '♟️ Ajedrez';
  try { btn.setAttribute('data-sub', 'juegos'); } catch (eS) {}
  btn.setAttribute('data-keywords', 'ajedrez chess mate apertura tactica puzzle gambito enroque caballo torre alfil dama rey peon tablero estrategia concentracion memoria calculo');
  g.appendChild(btn);
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnAjedrez') < 0) ALL_BTNS.push('btnAjedrez');
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
}
function injectConfig() {
  var groups = document.querySelectorAll('#configDialog .config-group h5');
  for (var i = 0; i < groups.length; i++) {
    if (/Aprender/.test(groups[i].textContent) && !groups[i].parentNode.querySelector('[data-btn="btnAjedrez"]')) {
      var lab = document.createElement('label');
      lab.className = 'check-row';
      lab.innerHTML = '<input type="checkbox" data-btn="btnAjedrez" checked> ♟️ Ajedrez';
      groups[i].parentNode.appendChild(lab);
      break;
    }
  }
}
function openAjedrez() {
  var d = buildDialog();
  renderLuna(); renderAprender(); renderMotivos(); renderAperturas();
  try { demoAInit(); renderDemoAprender(); } catch (e) {}
  try { demoTInit(MOidx || 0); renderDemoTactica(); } catch (e) {}
  try { renderDemoAperturas(); } catch (e) {}
  if (!G) newFreeGame();
  setupLog();
  switchTab(TAB || 'jugar');
  try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
}
var _retry = 0;
function setup() {
  injectButton();
  injectConfig();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf && ALL_BTNS.indexOf('btnAjedrez') < 0) ALL_BTNS.push('btnAjedrez');
  } catch (e) {}
  var b = $('btnAjedrez');
  if (!b) {
    if (_retry++ < 60) setTimeout(setup, 500);
    return;
  }
  if (!b.dataset.ajw) {
    b.dataset.ajw = '1';
    b.addEventListener('click', openAjedrez);
  }
  try { newFreeGame(); } catch (e) {}
  try { renderLuna(); } catch (e) {}
}

window.Ajedrez = {
  open: openAjedrez, newGame: function () { newFreeGame(); renderFree(); },
  sanFor: sanFor, initialState: initialState, legalMoves: legalMoves,
  doMove: doMove, gameStatus: gameStatus, allLegal: allLegal,
  parseAlg: parseAlg, alg: alg, puzzles: PUZZLES, posFromList: posFromList,
  niveles: AJ_NIVELES, evaluar: ajEval, mejorJugada: ajBestMove
};
setTimeout(setup, 600);

})();
