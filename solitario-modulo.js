/* ============================================================
   SOLITARIO (Klondike) — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa en Aprender (btnSolitario · sub juegos):
   - Jugar: Klondike clasico de 52 cartas (7 columnas, 4 fundaciones
     por palo, mazo con descarte). Modos 1 carta o 3 cartas, puntos,
     temporizador, movimientos, deshacer, pista, auto-terminar,
     guardado automatico de la partida en curso y victoria con
     celebracion lunar.
   - Aprender: objetivo, reparto, movimientos permitidos, puntuacion
     y consejos para destrabar partidas.
   - Mis registros: estadisticas por modo, mejor tiempo/puntos,
     historial privado y local por usuario.
   - Consejo lunar para entrenar la paciencia segun la fase.
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
  if ($('solitarioStyles')) return;
  var st = document.createElement('style');
  st.id = 'solitarioStyles';
  st.textContent = [
    '#solitarioDialog{width:min(680px,98vw);max-width:98vw}',
    '.sl-wrap{max-width:680px;width:100%;margin:0 auto}',
    '.sl-top{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px}',
    '.sl-bar{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}',
    '.sl-bar::-webkit-scrollbar{display:none}',
    '.sl-bar .sl-stat{flex:0 0 auto}',
    '.sl-stat{font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:4px 9px;color:var(--text);white-space:nowrap}',
    '.sl-stat b{color:var(--gold)}',
    '.sl-row{display:flex;gap:8px;justify-content:space-between;margin-bottom:10px}',
    '.sl-pile{flex:1;min-width:0;display:flex;gap:6px}',
    '.sl-row .sl-pile:first-child{flex:2}',
    '.sl-row .sl-pile.sl-fnd{flex:4}',
    '.sl-slot,.sl-col .sl-slot{flex:1;aspect-ratio:5/7;border-radius:9px;border:2px dashed rgba(232,197,106,.45);background:rgba(255,255,255,.03);position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;min-width:0;padding:0;color:var(--text)}',
    '.sl-slot .sl-ghost{opacity:.5;font-size:clamp(12px,3.4vw,18px)}',
    '.sl-fnd .sl-slot{border-style:solid}',
    '.sl-cols{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}',
    '.sl-col{display:flex;flex-direction:column;gap:3px;min-height:120px;border-radius:9px;padding:2px;cursor:pointer;border:1px solid transparent;background:transparent;color:var(--text)}',
    '.sl-col.sl-dest{border-color:var(--gold);background:rgba(232,197,106,.08)}',
    '.sl-card{width:100%;aspect-ratio:5/7;border-radius:8px;border:1px solid #2a2f45;background:linear-gradient(160deg,#fdfdfd,#e8e4d8);color:#1b2033;font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;box-shadow:0 2px 4px rgba(0,0,0,.35);font-size:clamp(14px,4vw,18px);line-height:1.1;padding:2px;touch-action:manipulation}',
    '.sl-col .sl-card{margin-top:0;flex:0 0 auto}',
    '.sl-col .sl-card:not(:last-child){aspect-ratio:auto;min-height:28px;height:auto;padding:3px 5px;justify-content:flex-start;align-items:stretch;text-align:left}',
    '.sl-col .sl-card:not(:last-child)>span:nth-child(2),.sl-col .sl-card:not(:last-child) .sl-corner.br{display:none !important}',
    '.sl-col .sl-card:not(:last-child) .sl-corner.tl{position:static;transform:none;font-size:13px;font-weight:800;line-height:1.2;display:block;white-space:nowrap;text-align:left}',
    '.sl-col .sl-card:not(:last-child) .sl-corner.tl br{display:none}',
    '.sl-col .sl-card:not(:last-child).down{min-height:22px;justify-content:center;align-items:center;font-size:12px}',
    '.sl-card.red{color:#b3261e}',
    '.sl-card.black{color:#1b2033}',
    '.sl-card.down{background:repeating-linear-gradient(45deg,#26315e,#26315e 6px,#1b2450 6px,#1b2450 12px);color:#e8c56a;border-color:#10142a;cursor:default}',
    '.sl-card.sel{outline:3px solid var(--gold);outline-offset:-1px;transform:translateY(-3px)}',
    '.sl-card.hint{animation:slflash 1s ease 2}',
    '@keyframes slflash{0%,100%{outline:2px solid transparent}50%{outline:3px solid #8fd694}}',
    '.sl-card small{font-size:.72em;font-weight:700;opacity:.85}',
    '.sl-card>span:nth-child(2){font-size:1.25em;line-height:1.05}',
    '.sl-corner{position:absolute;font-size:.82em;font-weight:800;line-height:1.15}',
    '.sl-corner.tl{top:4px;left:5px;text-align:left}',
    '.sl-corner.br{bottom:4px;right:5px;transform:rotate(180deg);text-align:left}',
    '.sl-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}',
    '.sl-tools-main{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}',
    '.sl-tools-main .btn{font-size:18px;padding:8px 4px;min-height:44px}',
    '.sl-tools-more{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}',
    '.sl-tools-more .btn{font-size:11px;min-height:38px}',
    '.sl-extra{margin-top:8px;border:1px solid var(--line);border-radius:8px;padding:6px 9px;font-size:11.5px;color:var(--muted)}',
    '.sl-extra summary{cursor:pointer;font-weight:700}',
    '.sl-msg{min-height:20px;font-size:12px;margin-top:6px}',
    '.sl-win{text-align:center;padding:14px;border:1px solid var(--gold);border-radius:12px;background:rgba(232,197,106,.1);margin-top:10px}',
    '@media (max-width:600px){',
    '#solitarioDialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;margin:0;border-radius:0;padding:8px 6px calc(10px + env(safe-area-inset-bottom))}',
    '#solitarioDialog>form{max-width:560px;margin:0 auto}',
    '#solitarioDialog>form>p.muted{display:none}',
    '#solitarioDialog h3{font-size:15px}',
    '#solitarioDialog .timer-tabs{display:flex;gap:4px}',
    '#solitarioDialog .timer-tabs .btn{flex:1;font-size:11px;padding:7px 4px}',
    '#solitarioDialog>form>.dlg-actions:last-child{display:none}',
    '.sl-wrap{max-width:100%}',
    '.sl-top{margin-bottom:6px}',
    '.sl-row{gap:4px;margin-bottom:6px}',
    '.sl-pile{gap:3px}',
    '.sl-cols{gap:3px}',
    '.sl-col{padding:1px;gap:2px;min-height:90px;border-radius:6px}',
    '.sl-card{border-radius:6px;font-size:clamp(15px,5vw,18px);box-shadow:0 1px 3px rgba(0,0,0,.4)}',
    '.sl-col .sl-card:not(:last-child){min-height:26px;padding:2px 4px}',
    '.sl-col .sl-card:not(:last-child) .sl-corner.tl{font-size:13px}',
    '.sl-slot,.sl-col .sl-slot{border-radius:6px;border-width:1.5px}',
    '.sl-stat{font-size:10px;padding:3px 7px}',
    '.sl-msg{font-size:11px}',
    '.sl-extra{font-size:11px}',
    '}'
  ].join('\n');
  document.head.appendChild(st);
}

/* ================= MOTOR KLONDIKE ================= */
var PALOS = ['♠', '♥', '♦', '♣'];
var NOMBRES = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
function rankTxt(r) { return NOMBRES[r] || String(r); }
function isRed(c) { return c.p === 1 || c.p === 2; }
function mkDeck() {
  var d = [];
  for (var p = 0; p < 4; p++) for (var r = 1; r <= 13; r++) d.push({ p: p, r: r, up: false });
  return d;
}
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function cloneState(s) {
  function cc(c) { return { p: c.p, r: c.r, up: c.up }; }
  return {
    stock: s.stock.map(cc), waste: s.waste.map(cc),
    fnd: s.fnd.map(function (f) { return f.map(cc); }),
    tab: s.tab.map(function (c) { return c.map(cc); }),
    draw: s.draw, moves: s.moves, score: s.score, seconds: s.seconds,
    startTs: s.startTs, won: s.won, passes: s.passes || 0
  };
}
function deal(draw) {
  var d = shuffle(mkDeck());
  var tab = [[], [], [], [], [], [], []];
  for (var col = 0; col < 7; col++) {
    for (var k = 0; k <= col; k++) {
      var c = d.pop();
      c.up = (k === col);
      tab[col].push(c);
    }
  }
  d.forEach(function (c) { c.up = false; });
  return { stock: d, waste: [], fnd: [[], [], [], []], tab: tab, draw: draw || 1, moves: 0, score: 0, seconds: 0, startTs: Date.now(), won: false, passes: 0, hist: [] };
}
function top(a) { return a.length ? a[a.length - 1] : null; }
function canTableau(stack, destTop) {
  // stack: array de cartas boca arriba a mover (primera = base)
  if (!stack.length) return false;
  var base = stack[0];
  if (!destTop) return base.r === 13;
  return isRed(base) !== isRed(destTop) && base.r === destTop.r - 1;
}
function canFoundation(card, pile) {
  if (!card) return false;
  if (!pile.length) return card.r === 1;
  var t = pile[pile.length - 1];
  return card.p === t.p && card.r === t.r + 1;
}
function stackOk(stack) {
  for (var i = 0; i < stack.length; i++) {
    if (!stack[i].up) return false;
    if (i > 0) {
      var a = stack[i - 1], b = stack[i];
      if (isRed(a) === isRed(b) || b.r !== a.r - 1) return false;
    }
  }
  return true;
}
function pushHist() {
  if (!G || G.won) return;
  G.hist.push(cloneState(G));
  if (G.hist.length > 120) G.hist.shift();
}
function addScore(n) {
  G.score = Math.max(0, (G.score || 0) + n);
}

/* ================= ESTADO UI ================= */
var TAB = 'jugar';
var G = null;
var SEL = null; // {from:'waste'|{f:i}|{t:i,n:int}, ids}
var MSG = '';
var HINT = null;
var TIMER = null;
var DRAW_MODE = 1;

function getStats() {
  var s = store('solitarioStats', null);
  if (!s || typeof s !== 'object') {
    s = { jugadas: 0, ganadas: 0, mejorTiempo1: 0, mejorTiempo3: 0, mejorPuntos: 0, racha: 0 };
    try { userData().solitarioStats = s; } catch (e) {}
  }
  return s;
}
function getGames() { var a = store('solitarioGames', []); return Array.isArray(a) ? a : []; }
function getSaved() { try { return store('solitarioSave', null); } catch (e) { return null; } }
function persist() {
  try { userData().solitarioSave = cloneState(G); } catch (e) {}
  save();
}
function fmtTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  var m = Math.floor(s / 60), r = s % 60;
  return (m < 10 ? '0' + m : '' + m) + ':' + (r < 10 ? '0' + r : '' + r);
}
function lunaFaseAprox() {
  try {
    var now = new Date();
    var syn = 29.530588853;
    var ref = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
    var days = now.getTime() / 86400000 - ref;
    var age = ((days % syn) + syn) % syn;
    var idx = Math.floor(((age + 1.84566) % syn) / syn * 8 + 0.5) % 8;
    return idx;
  } catch (e) { return 4; }
}
var LUNA_TIPS = [
  '🌑 Luna nueva: parte una partida lenta en modo 1 carta. Como sembrar: sin apuro.',
  '🌒 Creciente: prueba el modo 3 cartas. La dificultad sube: ataca las columnas largas.',
  '🌓 Cuarto creciente: destapa cartas tapadas antes de vaciar columnas. Mitad del camino.',
  '🌔 Gibosa: no lleves todo a la fundación de inmediato: guarda un As para destrabar.',
  '🌕 Luna llena: juega tu mejor partida y anótala. Mente plena: paciencia y cálculo.',
  '🌖 Menguante: revisa tu historial: ¿dónde te trabas siempre? Suelta ese hábito.',
  '🌗 Cuarto menguante: usa Deshacer sin culpa: repasar también es aprender.',
  '🌘 Casi nueva: descansa: una partida corta y a dormir. El cerebro consolida durmiendo.'
];

/* ================= ACCIONES ================= */
function newGame(draw) {
  DRAW_MODE = draw || DRAW_MODE || 1;
  G = deal(DRAW_MODE);
  SEL = null; MSG = ''; HINT = null;
  try {
    var st = getStats(); st.jugadas++;
    st.racha = 0;
    try { userData().solitarioStats = st; } catch (e) {}
  } catch (e2) {}
  persist();
  restartTimer();
  render();
  save('Partida nueva 🂡');
}
function drawFromStock() {
  if (!G || G.won) return;
  if (!G.stock.length) { recycleStock(); return; }
  pushHist();
  var n = Math.min(G.draw, G.stock.length);
  for (var i = 0; i < n; i++) {
    var c = G.stock.pop();
    c.up = true;
    G.waste.push(c);
  }
  G.moves++;
  SEL = null; MSG = '';
  persist(); render();
}
function recycleStock() {
  if (!G || G.won || G.stock.length || !G.waste.length) return;
  pushHist();
  while (G.waste.length) {
    var c = G.waste.pop();
    c.up = false;
    G.stock.push(c);
  }
  G.passes++;
  if (G.draw === 1) addScore(-15); else addScore(-30);
  G.moves++;
  SEL = null; MSG = '♻️ Mazo reciclado (' + G.passes + 'ª vuelta)';
  persist(); render();
}
function flipIfNeeded(t) {
  var col = G.tab[t];
  var t2 = top(col);
  if (t2 && !t2.up) { t2.up = true; addScore(5); }
}
function afterMove(msg) {
  G.moves++;
  SEL = null; HINT = null; MSG = msg || '';
  checkWin();
  persist(); render();
}
function moveWasteToTableau(t) {
  var c = top(G.waste);
  if (!c) return false;
  if (!canTableau([c], top(G.tab[t]))) return false;
  pushHist();
  G.waste.pop();
  G.tab[t].push(c);
  addScore(5);
  afterMove('');
  return true;
}
function moveWasteToFnd(f) {
  var c = top(G.waste);
  if (!c || !canFoundation(c, G.fnd[f])) return false;
  pushHist();
  G.waste.pop();
  G.fnd[f].push(c);
  addScore(10);
  afterMove('');
  return true;
}
function moveTabToFnd(t, f) {
  var col = G.tab[t];
  var c = top(col);
  if (!c || !c.up || !canFoundation(c, G.fnd[f])) return false;
  pushHist();
  col.pop();
  G.fnd[f].push(c);
  flipIfNeeded(t);
  addScore(10);
  afterMove('');
  return true;
}
function moveFndToTab(f, t) {
  var pile = G.fnd[f];
  var c = top(pile);
  if (!c || !canTableau([c], top(G.tab[t]))) return false;
  pushHist();
  pile.pop();
  G.tab[t].push(c);
  addScore(-15);
  afterMove('');
  return true;
}
function moveTabToTab(t, n, dest) {
  if (t === dest) return false;
  var col = G.tab[t];
  if (n < 0 || n >= col.length || !col[n].up) return false;
  var stack = col.slice(n);
  if (!stackOk(stack)) return false;
  if (!canTableau(stack, top(G.tab[dest]))) return false;
  pushHist();
  G.tab[t] = col.slice(0, n);
  for (var i = 0; i < stack.length; i++) G.tab[dest].push(stack[i]);
  flipIfNeeded(t);
  addScore(stack.length > 1 ? 8 : 3);
  afterMove('');
  return true;
}
function undo() {
  if (!G || !G.hist.length) { MSG = 'Sin jugadas para deshacer.'; render(); return; }
  var prev = G.hist.pop();
  var h = G.hist;
  G = prev; G.hist = h;
  SEL = null; HINT = null; MSG = '↩️ Jugada deshecha';
  persist(); render();
}
function autoToFndOnce() {
  // intenta subir 1 carta segura a fundación (waste + tableau tops)
  var c = top(G.waste);
  if (c) for (var f = 0; f < 4; f++) if (canFoundation(c, G.fnd[f])) { moveWasteToFnd(f); return true; }
  for (var t = 0; t < 7; t++) {
    var tc = top(G.tab[t]);
    if (tc && tc.up) for (var f2 = 0; f2 < 4; f2++) if (canFoundation(tc, G.fnd[f2])) { moveTabToFnd(t, f2); return true; }
  }
  return false;
}
function autoFinish() {
  if (!G || G.won) return;
  pushHist();
  var moved = 0, guard = 0;
  var changed = true;
  while (changed && guard++ < 200) {
    changed = false;
    var c = top(G.waste);
    if (c) for (var f = 0; f < 4; f++) if (canFoundation(c, G.fnd[f])) { G.waste.pop(); G.fnd[f].push(c); addScore(10); moved++; changed = true; break; }
    for (var t = 0; t < 7 && !changed; t++) {
      var tc = top(G.tab[t]);
      if (tc && tc.up) for (var f2 = 0; f2 < 4; f2++) if (canFoundation(tc, G.fnd[f2])) { G.tab[t].pop(); G.fnd[f2].push(tc); flipIfNeeded(t); addScore(10); moved++; changed = true; break; }
    }
  }
  if (moved) { G.moves += moved; afterMove('✨ ' + moved + ' cartas a su casa'); }
  else { G.hist.pop(); MSG = 'Auto-terminar: aún no hay cartas listas. Sigue destapando.'; render(); }
}
function hint() {
  if (!G || G.won) return;
  // 1) ¿algo sube a fundación?
  var c = top(G.waste);
  if (c) for (var f = 0; f < 4; f++) if (canFoundation(c, G.fnd[f])) { MSG = '💡 Sube ' + cardName(c) + ' a la fundación ' + PALOS[f]; HINT = { from: 'waste' }; render(); return; }
  for (var t = 0; t < 7; t++) {
    var tc = top(G.tab[t]);
    if (tc && tc.up) for (var f2 = 0; f2 < 4; f2++) if (canFoundation(tc, G.fnd[f2])) { MSG = '💡 Sube ' + cardName(tc) + ' de la columna ' + (t + 1) + ' a la fundación'; HINT = { from: 'tab', t: t }; render(); return; }
  }
  // 2) ¿tableau -> tableau que destapa?
  for (var a = 0; a < 7; a++) {
    var col = G.tab[a];
    for (var n = 0; n < col.length; n++) {
      if (!col[n].up) continue;
      var stack = col.slice(n);
      if (!stackOk(stack)) continue;
      for (var b = 0; b < 7; b++) {
        if (a === b) continue;
        if (canTableau(stack, top(G.tab[b]))) {
          var destapa = n > 0 && !col[n - 1].up;
          MSG = '💡 Mueve ' + cardName(stack[0]) + ' de la columna ' + (a + 1) + ' a la ' + (b + 1) + (destapa ? ' (destapa carta 🎁)' : '');
          HINT = { from: 'tab', t: a, n: n };
          render();
          return;
        }
      }
    }
  }
  // 3) ¿waste -> tableau?
  if (c) for (var d = 0; d < 7; d++) if (canTableau([c], top(G.tab[d]))) { MSG = '💡 Baja ' + cardName(c) + ' a la columna ' + (d + 1); HINT = { from: 'waste' }; render(); return; }
  // 4) ¿vaciar con K?
  for (var k = 0; k < 7; k++) {
    var ck = G.tab[k];
    for (var m = 0; m < ck.length; m++) {
      if (ck[m].up && ck[m].r === 13 && m > 0) {
        for (var e = 0; e < 7; e++) if (!G.tab[e].length) { MSG = '💡 Lleva el Rey de la columna ' + (k + 1) + ' a la columna vacía ' + (e + 1); HINT = { from: 'tab', t: k, n: m }; render(); return; }
      }
    }
  }
  MSG = G.stock.length ? '💡 Pide carta del mazo: no hay movimientos a la vista.' : (G.waste.length ? '💡 Recicla el mazo ♻️ y prueba otro orden.' : '💡 Sin movimientos visibles. Deshaz (↩️) o parte de nuevo.');
  HINT = null;
  render();
}
function checkWin() {
  var total = G.fnd[0].length + G.fnd[1].length + G.fnd[2].length + G.fnd[3].length;
  if (total === 52 && !G.won) {
    G.won = true;
    var bonus = Math.max(0, 700 - G.seconds);
    G.score += bonus;
    try {
      var st = getStats();
      st.ganadas++;
      st.racha = (st.racha || 0) + 1;
      if (G.score > (st.mejorPuntos || 0)) st.mejorPuntos = G.score;
      if (G.draw === 1 && (!st.mejorTiempo1 || G.seconds < st.mejorTiempo1)) st.mejorTiempo1 = G.seconds;
      if (G.draw === 3 && (!st.mejorTiempo3 || G.seconds < st.mejorTiempo3)) st.mejorTiempo3 = G.seconds;
      try { userData().solitarioStats = st; } catch (e) {}
      var games = getGames();
      games.unshift({ f: todayKey(), modo: G.draw, pts: G.score, movs: G.moves, tiempo: G.seconds, gano: true });
      while (games.length > 30) games.pop();
      try { userData().solitarioGames = games; } catch (e2) {}
    } catch (e3) {}
    MSG = 'win';
    try { if (navigator.vibrate) navigator.vibrate([80, 60, 120]); } catch (e4) {}
  }
}
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function cardName(c) {
  return rankTxt(c.r) + PALOS[c.p];
}

/* ================= TIMER ================= */
function restartTimer() {
  try { if (TIMER) clearInterval(TIMER); } catch (e) {}
  TIMER = setInterval(function () {
    try {
      var d = $('solitarioDialog');
      if (!d || !d.open) return;
      if (!G || G.won) return;
      if (TAB !== 'jugar') return;
      G.seconds++;
      var el = $('slTime');
      if (el) el.innerHTML = '⏱ <b>' + fmtTime(G.seconds) + '</b>';
      if (G.seconds % 10 === 0) persist();
    } catch (e2) {}
  }, 1000);
}

/* ================= RENDER ================= */
function cardHTML(c, extra, sel) {
  if (!c.up) return '<button type="button" class="sl-card down' + (extra || '') + '" disabled aria-label="Carta tapada">🌙</button>';
  var cls = isRed(c) ? 'red' : 'black';
  return '<button type="button" class="sl-card ' + cls + (sel ? ' sel' : '') + (extra || '') + '" aria-label="' + rankTxt(c.r) + ' de ' + PALOS[c.p] + '">' +
    '<span class="sl-corner tl">' + rankTxt(c.r) + '<br>' + PALOS[c.p] + '</span>' +
    '<span>' + PALOS[c.p] + '<br><small>' + rankTxt(c.r) + '</small></span>' +
    '<span class="sl-corner br">' + rankTxt(c.r) + '<br>' + PALOS[c.p] + '</span></button>';
}
function render() {
  if (!$('slBoard')) return;
  renderTop();
  renderCols();
  renderBar();
  renderMsg();
}
function renderTop() {
  var stockBox = $('slStock'), wasteBox = $('slWaste');
  if (stockBox) {
    if (G.stock.length) {
      stockBox.innerHTML = '<button type="button" class="sl-card down" data-act="stock" aria-label="Mazo: pedir carta">🂠<br><small>' + G.stock.length + '</small></button>';
    } else {
      stockBox.innerHTML = '<button type="button" class="sl-slot" data-act="stock" aria-label="Reciclar descarte" style="aspect-ratio:5/7;width:100%">' +
        (G.waste.length ? '<span class="sl-ghost">♻️</span>' : '<span class="sl-ghost">·</span>') + '</button>';
    }
  }
  if (wasteBox) {
    var c = top(G.waste);
    wasteBox.innerHTML = c ? cardHTML(c, (SEL && SEL.from === 'waste' ? ' sel' : '')) : '<div class="sl-slot" style="aspect-ratio:5/7;width:100%"><span class="sl-ghost">·</span></div>';
    var wb = wasteBox.querySelector('.sl-card');
    if (wb) wb.setAttribute('data-act', 'waste');
  }
  for (var f = 0; f < 4; f++) {
    var el = $('slF' + f);
    if (!el) continue;
    var t2 = top(G.fnd[f]);
    el.innerHTML = t2 ? cardHTML(t2, '') : '<div class="sl-slot" data-act="fnd" data-f="' + f + '" style="aspect-ratio:5/7;width:100%"><span class="sl-ghost">' + PALOS[f] + '</span></div>';
    var fb = el.querySelector('.sl-card');
    if (fb) { fb.setAttribute('data-act', 'fnd-card'); fb.setAttribute('data-f', String(f)); }
  }
  bindTop();
}
function renderCols() {
  var box = $('slCols');
  if (!box) return;
  var h = '';
  for (var t = 0; t < 7; t++) {
    var col = G.tab[t];
    var dest = SEL && SEL.dest === t ? ' sl-dest' : '';
    h += '<div class="sl-col' + dest + '" data-col="' + t + '">';
    if (!col.length) h += '<div class="sl-slot" style="width:100%;aspect-ratio:5/7"><span class="sl-ghost">' + (t + 1) + '</span></div>';
    for (var i = 0; i < col.length; i++) {
      var sel = SEL && SEL.from === 'tab' && SEL.t === t && SEL.n === i;
      var hint = HINT && HINT.from === 'tab' && HINT.t === t && HINT.n === i;
      h += cardHTML(col[i], (sel ? ' sel' : '') + (hint ? ' hint' : ''), false).replace('class="sl-card', 'data-t="' + t + '" data-n="' + i + '" class="sl-card');
    }
    h += '</div>';
  }
  box.innerHTML = h;
  box.querySelectorAll('.sl-card[data-t]').forEach(function (el) {
    el.addEventListener('click', function () {
      pickTableau(parseInt(el.getAttribute('data-t'), 10), parseInt(el.getAttribute('data-n'), 10));
    });
  });
  box.querySelectorAll('.sl-col').forEach(function (el) {
    el.addEventListener('click', function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest('.sl-card')) return;
      dropTableau(parseInt(el.getAttribute('data-col'), 10));
    });
  });
}
function renderBar() {
  var bar = $('slBar');
  if (!bar) return;
  bar.innerHTML = '<span class="sl-stat">🏆 <b>' + (G.score || 0) + '</b> pts</span>' +
    '<span class="sl-stat" id="slTime">⏱ <b>' + fmtTime(G.seconds) + '</b></span>' +
    '<span class="sl-stat">👣 <b>' + G.moves + '</b></span>' +
    '<span class="sl-stat">🂠 <b>' + (G.draw === 1 ? '1 carta' : '3 cartas') + '</b></span>' +
    '<span class="sl-stat">📦 <b>' + G.stock.length + '</b></span>';
}
function renderMsg() {
  var m = $('slMsg');
  if (!m) return;
  if (MSG === 'win') {
    m.innerHTML = '<div class="sl-win">🏆 <b>¡Ganaste el Solitario!</b><br>' +
      '<span class="muted">' + G.score + ' pts · ' + G.moves + ' movimientos · ' + fmtTime(G.seconds) + ' · modo ' + G.draw + ' carta(s)</span><br>' +
      '<div class="sl-tools" style="justify-content:center"><button type="button" class="btn btn-accent" data-act="new">🂡 Nueva partida</button>' +
      '<button type="button" class="btn" data-act="share">📤 Compartir</button></div></div>';
  } else if (MSG) {
    m.innerHTML = '<span class="chip">' + esc(MSG) + '</span>';
  } else {
    var options = G.stock.length ? 'Toca el mazo 🂠 para pedir carta.' : (G.waste.length || hasMoves() ? 'Toca una carta y luego su destino. Doble toque = a la fundación.' : 'Sin movimientos: recicla ♻️, deshaz ↩️ o parte de nuevo.');
    m.innerHTML = '<span class="muted" style="font-size:11px">' + esc(options) + '</span>';
  }
  bindMsg(m);
}
function hasMoves() {
  if (top(G.waste)) {
    var c = top(G.waste);
    for (var f = 0; f < 4; f++) if (canFoundation(c, G.fnd[f])) return true;
    for (var d = 0; d < 7; d++) if (canTableau([c], top(G.tab[d]))) return true;
  }
  for (var t = 0; t < 7; t++) {
    var tc = top(G.tab[t]);
    if (tc && tc.up) {
      for (var f2 = 0; f2 < 4; f2++) if (canFoundation(tc, G.fnd[f2])) return true;
      for (var b = 0; b < 7; b++) if (b !== t && canTableau([tc], top(G.tab[b]))) return true;
    }
  }
  return false;
}
function bindTop() {
  var box = $('slBoard');
  if (!box) return;
  box.querySelectorAll('[data-act="stock"]').forEach(function (el) {
    el.onclick = function () { drawFromStock(); };
  });
  var wb = $('slWaste');
  if (wb) {
    var card = wb.querySelector('[data-act="waste"]');
    if (card) card.onclick = function () { pickWaste(); };
  }
  for (var f = 0; f < 4; f++) {
    (function (ff) {
      var el = $('slF' + ff);
      if (!el) return;
      var slot = el.querySelector('[data-act="fnd"]');
      if (slot) slot.onclick = function () { dropFoundation(ff); };
      var cd = el.querySelector('[data-act="fnd-card"]');
      if (cd) cd.onclick = function () { pickFoundation(ff); };
    })(f);
  }
}
function bindMsg(m) {
  m.querySelectorAll('[data-act="new"]').forEach(function (b) { b.onclick = function () { newGame(DRAW_MODE); }; });
  m.querySelectorAll('[data-act="share"]').forEach(function (b) {
    b.onclick = function () {
      share('🂡 ¡Gané el Solitario!', 'Solitario Klondike · modo ' + G.draw + ' carta(s)\n🏆 ' + G.score + ' pts · 👣 ' + G.moves + ' movs · ⏱ ' + fmtTime(G.seconds) + '\nCalendario 13 Lunas · Penco');
    };
  });
}

/* ---- selección táctil ---- */
function clearSel(msg) { SEL = null; if (msg !== undefined) MSG = msg; render(); }
function pickWaste() {
  if (!G || G.won) return;
  var c = top(G.waste);
  if (!c) return;
  if (SEL && SEL.from === 'waste') {
    // segundo toque: intenta fundación
    for (var f = 0; f < 4; f++) if (canFoundation(c, G.fnd[f])) { moveWasteToFnd(f); return; }
    clearSel('Esa carta no sube aún. Elige una columna.');
    return;
  }
  SEL = { from: 'waste' }; MSG = ''; HINT = null; render();
}
function pickFoundation(f) {
  if (!G || G.won) return;
  if (SEL && SEL.from === 'waste') { if (!moveWasteToFnd(f)) clearSel('No va ahí: la fundación pide el palo en orden.'); return; }
  if (SEL && SEL.from === 'tab') { if (!moveTabToFnd(SEL.t, f)) clearSel('No sube: orden o palo no calza.'); return; }
  if (SEL && SEL.from === 'fnd' && SEL.f === f) { clearSel(''); return; }
  SEL = { from: 'fnd', f: f }; MSG = 'Fundación ' + PALOS[f] + ': toca una columna para bajarla (−15).'; render();
}
function pickTableau(t, n) {
  if (!G || G.won) return;
  var col = G.tab[t];
  var c = col[n];
  if (!c || !c.up) return;
  // ¿destino de una selección previa?
  if (SEL && SEL.from === 'waste') { if (!moveWasteToTableau(t)) clearSel('No calza: alterna color y baja un número.'); return; }
  if (SEL && SEL.from === 'fnd') { if (!moveFndToTab(SEL.f, t)) clearSel('No calza ahí.'); return; }
  if (SEL && SEL.from === 'tab') {
    if (SEL.t === t && SEL.n === n) {
      // doble toque: intenta subir la carta superior
      if (n === col.length - 1) {
        for (var f = 0; f < 4; f++) if (canFoundation(c, G.fnd[f])) { moveTabToFnd(t, f); return; }
        clearSel('Aún no sube a la fundación.');
        return;
      }
      clearSel('');
      return;
    }
    if (!moveTabToTab(SEL.t, SEL.n, t)) clearSel('Movimiento inválido: alterna color y baja un número (solo K a vacío).');
    return;
  }
  // nueva selección
  var stack = col.slice(n);
  if (!stackOk(stack)) { MSG = 'Esa escalera está desordenada: no se puede mover junta.'; render(); return; }
  SEL = { from: 'tab', t: t, n: n }; MSG = ''; HINT = null; render();
}
function dropTableau(t) {
  if (!G || G.won || !SEL) return;
  if (SEL.from === 'waste') { if (!moveWasteToTableau(t)) clearSel('No calza: alterna color y baja un número.'); return; }
  if (SEL.from === 'fnd') { if (!moveFndToTab(SEL.f, t)) clearSel('No calza ahí.'); return; }
  if (SEL.from === 'tab') {
    if (SEL.t === t) { clearSel(''); return; }
    if (!moveTabToTab(SEL.t, SEL.n, t)) clearSel('Movimiento inválido (solo K abre columna vacía).');
  }
}
function dropFoundation(f) {
  if (!G || G.won || !SEL) return;
  if (SEL.from === 'waste') { if (!moveWasteToFnd(f)) clearSel('No va ahí: la fundación pide el palo en orden.'); return; }
  if (SEL.from === 'tab') {
    var col = G.tab[SEL.t];
    if (SEL.n !== col.length - 1) { clearSel('Solo la última carta sube a la fundación.'); return; }
    if (!moveTabToFnd(SEL.t, f)) clearSel('No sube: orden o palo no calza.');
    return;
  }
  clearSel('');
}

/* ================= DIALOG ================= */
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
function buildDialog() {
  var d = $('solitarioDialog');
  if (d) return d;
  d = makeDialog('solitarioDialog', '🂡 Solitario — Klondike clásico',
    'El juego de cartas de toda la vida: ordena los 4 palos del As al Rey. <b>Toca una carta y luego su destino</b>; doble toque para subir a la fundación. Todo queda <b>privado y local</b>.',
    '<div class="timer-tabs su-dd1da5">' +
    '<button type="button" id="tabSlJugar" class="btn btn-accent su-30e741">🂡 Jugar</button>' +
    '<button type="button" id="tabSlAprender" class="btn su-30e741">📖 Aprender</button>' +
    '<button type="button" id="tabSlReg" class="btn su-30e741">📊 Registros</button></div>' +
    '<div id="slPanelJugar"><div class="sl-wrap">' +
    '<div id="slBar" class="sl-top sl-bar"></div>' +
    '<div id="slBoard"><div class="sl-row"><div class="sl-pile"><div id="slStock" style="flex:1"></div><div id="slWaste" style="flex:1"></div></div>' +
    '<div class="sl-pile sl-fnd"><div id="slF0" style="flex:1"></div><div id="slF1" style="flex:1"></div><div id="slF2" style="flex:1"></div><div id="slF3" style="flex:1"></div></div></div>' +
    '<div id="slCols" class="sl-cols"></div>' +
    '<div id="slMsg" class="sl-msg"></div>' +
    '<div class="sl-tools sl-tools-main">' +
    '<button type="button" id="slUndo" class="btn su-337714" title="Deshacer jugada" aria-label="Deshacer jugada">↩️</button>' +
    '<button type="button" id="slHint" class="btn su-337714" title="Pista" aria-label="Pista">💡</button>' +
    '<button type="button" id="slAuto" class="btn su-337714" title="Auto-terminar" aria-label="Auto-terminar">✨</button>' +
    '<button type="button" id="slMore" class="btn su-337714" title="Más opciones" aria-label="Más opciones">⋯</button>' +
    '</div>' +
    '<div id="slMoreBox" class="sl-tools sl-tools-more hidden">' +
    '<button type="button" id="slNew1" class="btn btn-accent su-337714">🂡 Nueva (1)</button>' +
    '<button type="button" id="slNew3" class="btn su-337714">🂡 Nueva (3)</button>' +
    '<button type="button" id="slShare" class="btn su-337714">📤 Compartir</button>' +
    '</div>' +
    '<details id="slExtra" class="sl-extra"><summary>🌙 Consejo lunar e instrucciones</summary><div id="slLuna" class="chip su-8c0a82" style="margin:6px 0"></div>' +
    '<p class="muted" style="margin:0">Toca una carta y luego su destino · doble toque sube a la fundación.</p></details>' +
    '</div></div>' +
    '<div id="slPanelAprender" class="hidden">' +
    '<div class="si-card"><h4>🎯 Objetivo</h4><p>Lleva las <b>52 cartas a las 4 fundaciones</b> (una por palo ♠♥♦♣), del <b>As al Rey</b> en orden. Ganaste cuando las 4 casas llegan al Rey.</p></div>' +
    '<div class="si-card"><h4>🂠 Reparto</h4><p>7 columnas: la 1ª con 1 carta, la 2ª con 2… la 7ª con 7. Solo la última de cada columna parte boca arriba. El resto es el mazo.</p></div>' +
    '<div class="si-card"><h4>↔️ Movimientos</h4><p><b>Columnas:</b> escalera descendente alternando color (ej: ♥7 sobre ♠8). Solo un <b>Rey</b> abre una columna vacía. Puedes mover varias cartas juntas si están en orden.<br><b>Fundaciones:</b> mismo palo ascendente desde el As (A→2→…→K).<br><b>Mazo:</b> pide 1 o 3 cartas al descarte; cuando se acaba, se <b>recicla ♻️</b> (resta puntos).<br><b>Doble toque</b> en una carta intenta subirla a su fundación.</p></div>' +
    '<div class="si-card"><h4>🏆 Puntos</h4><p>Descarte→columna +5 · a fundación +10 · destapar +5 · escalera larga +8 · bajar de fundación −15 · reciclar −15/−30. Ganar suma bono por tiempo (máx 700).</p></div>' +
    '<div class="si-card"><h4>💡 Consejos</h4><p>1) Destapa cartas tapadas antes que nada.<br>2) No subas todo a la fundación de inmediato: a veces conviene retener para armar escaleras.<br>3) Vacía una columna solo si tienes un Rey listo.<br>4) El modo 1 carta es para aprender; el de 3 cartas es el desafío real.<br>5) Usa ↩️ Deshacer para probar líneas sin miedo.</p></div>' +
    '</div>' +
    '<div id="slPanelReg" class="hidden"><div id="slStats"></div><div id="slGames" class="habits-list su-8c96f6"></div></div>');
  $('tabSlJugar').onclick = function () { switchTab('jugar'); };
  $('tabSlAprender').onclick = function () { switchTab('aprender'); };
  $('tabSlReg').onclick = function () { switchTab('reg'); renderRegs(); };
  $('slNew1').onclick = function () { newGame(1); };
  $('slNew3').onclick = function () { newGame(3); };
  $('slUndo').onclick = function () { undo(); };
  $('slHint').onclick = function () { hint(); };
  $('slAuto').onclick = function () { autoFinish(); };
  $('slMore').onclick = function () {
    var box = $('slMoreBox');
    if (box) box.classList.toggle('hidden');
  };
  $('slShare').onclick = function () {
    share('🂡 Solitario Klondike', 'Solitario · modo ' + (G ? G.draw : DRAW_MODE) + ' carta(s)\n🏆 ' + (G ? G.score : 0) + ' pts · 👣 ' + (G ? G.moves : 0) + ' movs · ⏱ ' + fmtTime(G ? G.seconds : 0) + '\nCalendario 13 Lunas · Penco');
  };
  return d;
}
function switchTab(t) {
  TAB = t;
  var map = { jugar: ['tabSlJugar', 'slPanelJugar'], aprender: ['tabSlAprender', 'slPanelAprender'], reg: ['tabSlReg', 'slPanelReg'] };
  Object.keys(map).forEach(function (k) {
    var b = $(map[k][0]), p = $(map[k][1]);
    if (b) b.classList.toggle('btn-accent', k === t);
    if (p) p.classList.toggle('hidden', k !== t);
  });
  if (t === 'jugar') render();
  if (t === 'reg') renderRegs();
}
function renderLuna() {
  var box = $('slLuna');
  if (!box) return;
  box.textContent = LUNA_TIPS[lunaFaseAprox()] || LUNA_TIPS[4];
}
function renderRegs() {
  var s = getStats();
  var box = $('slStats');
  if (box) {
    box.innerHTML = '<div class="si-card"><h4>📊 Mis números</h4>' +
      '<p class="muted">Partidas: <b>' + s.jugadas + '</b> · Ganadas: <b>' + s.ganadas + '</b>' +
      (s.jugadas ? ' (' + Math.round(s.ganadas / s.jugadas * 100) + '%)' : '') + '<br>' +
      'Mejor puntaje: <b>' + (s.mejorPuntos || 0) + '</b> · Racha actual ganadora: <b>' + (s.racha || 0) + '</b><br>' +
      'Mejor tiempo (1 carta): <b>' + (s.mejorTiempo1 ? fmtTime(s.mejorTiempo1) : '—') + '</b> · (3 cartas): <b>' + (s.mejorTiempo3 ? fmtTime(s.mejorTiempo3) : '—') + '</b></p></div>';
  }
  var gb = $('slGames');
  if (gb) {
    var games = getGames();
    gb.innerHTML = games.length ? games.slice(0, 20).map(function (g) {
      return '<div class="habit-item"><span>🏆 <b>' + g.f + '</b> · modo ' + g.modo + ' · ' + g.pts + ' pts · ' + g.movs + ' movs · ' + fmtTime(g.tiempo) + '</span></div>';
    }).join('') : '<p class="muted">Sin victorias registradas aún. ¡Tu primera corona te espera! 👑</p>';
  }
}
function openSolitario() {
  var d = buildDialog();
  renderLuna();
  if (!G) {
    var sv = getSaved();
    if (sv && sv.tab && sv.tab.length === 7) {
      G = sv; G.hist = G.hist || [];
      DRAW_MODE = G.draw || 1;
    } else {
      G = deal(DRAW_MODE);
      try { var st = getStats(); st.jugadas++; try { userData().solitarioStats = st; } catch (e) {} } catch (e2) {}
      persist();
    }
  }
  TAB = 'jugar';
  switchTab('jugar');
  try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
  try {
    var mb = $('slMoreBox');
    if (mb) mb.classList.add('hidden');
    var xt = $('slExtra');
    if (xt) xt.removeAttribute('open');
  } catch (e3) {}
}

/* ================= SETUP ================= */
function injectButton() {
  var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
  if (!g) return;
  if ($('btnSolitario')) {
    try {
      var cur = $('btnSolitario');
      if (cur.parentNode !== g) g.appendChild(cur);
      try { cur.setAttribute('data-sub', 'juegos'); } catch (eS) {}
      if (typeof reordenarAcciones === 'function') reordenarAcciones();
    } catch (eM) {}
    return;
  }
  var btn = document.createElement('button');
  btn.id = 'btnSolitario'; btn.className = 'btn'; btn.type = 'button';
  btn.textContent = '🂡 Solitario';
  try { btn.setAttribute('data-sub', 'juegos'); } catch (eS2) {}
  btn.setAttribute('data-keywords', 'solitario klondike cartas juego paciencia escalera fundacion as rey pasatiempo concentracion memoria');
  var ref = $('btnSopa');
  if (ref && ref.parentNode === g && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
  else g.appendChild(btn);
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnSolitario') < 0) ALL_BTNS.push('btnSolitario');
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e2) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e3) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e4) {}
}
function injectConfig() {
  var groups = document.querySelectorAll('#configDialog .config-group h5');
  for (var i = 0; i < groups.length; i++) {
    if (/Aprender/.test(groups[i].textContent) && !groups[i].parentNode.querySelector('[data-btn="btnSolitario"]')) {
      var lab = document.createElement('label');
      lab.className = 'check-row';
      lab.innerHTML = '<input type="checkbox" data-btn="btnSolitario" checked> 🂡 Solitario';
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf && ALL_BTNS.indexOf('btnSolitario') < 0) ALL_BTNS.push('btnSolitario');
  } catch (e) {}
  var b = $('btnSolitario');
  if (!b) {
    if (_retry++ < 60) setTimeout(setup, 500);
    return;
  }
  if (!b.dataset.slw) {
    b.dataset.slw = '1';
    b.addEventListener('click', openSolitario);
  }
  try {
    var sv = getSaved();
    if (sv && sv.tab && !G) { G = sv; G.hist = G.hist || []; DRAW_MODE = G.draw || 1; }
  } catch (e2) {}
}

window.Solitario = {
  open: openSolitario, newGame: newGame, undo: undo, hint: hint,
  deal: deal, canTableau: canTableau, canFoundation: canFoundation,
  getState: function () { return G; }
};
setTimeout(setup, 600);

})();
