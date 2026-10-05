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
    '.sp-wrap{max-width:560px;margin:0 auto}',
    '.sp-temas{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}',
    '.sp-difs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center}',
    '.sp-dif{font-size:11px;font-weight:800;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:20px;padding:5px 12px;cursor:pointer}',
    '.sp-dif.on{background:var(--gold);border-color:var(--gold);color:#222}',
    '.sp-top{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px}',
    '.sp-stat{font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:4px 9px;color:var(--text)}',
    '.sp-stat b{color:var(--gold)}',
    '.sp-prog{height:8px;background:var(--panel);border:1px solid var(--line);border-radius:99px;overflow:hidden;margin:6px 0 8px}',
    '.sp-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--gold),#8fd694);transition:width .35s ease}',
    '.sp-board{display:grid;gap:2px;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none}',
    '.sp-cell{aspect-ratio:1;border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:6px;font-weight:800;font-size:clamp(11px,3vw,16px);cursor:pointer;display:flex;align-items:center;justify-content:center;min-width:0;padding:0;transition:background .12s,transform .12s}',
    '.sp-cell.sp-anchor{background:rgba(232,197,106,.55)!important;outline:2px solid var(--gold);outline-offset:-2px;transform:scale(1.06)}',
    '.sp-cell.sp-trail{background:rgba(232,197,106,.30)}',
    '.sp-cell.sp-found{color:#10231a!important;font-weight:900}',
    '.sp-cell.sp-hintflash{animation:spflash 1s ease 3}',
    '@keyframes spflash{0%,100%{background:var(--card)}50%{background:rgba(143,214,148,.7);transform:scale(1.1)}}',
    '@keyframes sppop{0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}',
    '.sp-cell.sp-pop{animation:sppop .35s ease}',
    '.sp-words{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '.sp-word{font-size:12px;font-weight:700;background:var(--panel);border:1px solid var(--line);border-left-width:5px;color:var(--text);border-radius:8px;padding:5px 10px;cursor:default}',
    '.sp-word small{color:var(--muted);font-weight:400}',
    '.sp-word.done{text-decoration:line-through;opacity:.92}',
    '.sp-word.hint{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}',
    '.sp-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
    '.sp-msg{font-size:12px;line-height:1.5;margin-top:8px}',
    '.sp-win{text-align:center;padding:14px 10px}',
    '.sp-win .big{font-size:44px}',
    '.sp-confetti{font-size:20px;letter-spacing:2px;animation:sppop .5s ease}',
    '.sp-live{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}'
  ].join('\n');
  document.head.appendChild(st);
}
var SP_COLORS = ['#8fd694','#e8c56a','#7ec8e3','#e39ec1','#b8a7e8','#f2a65a','#8ad8c8','#e07a5f','#a8d86b','#f4e285'];
function spColor(i){ return SP_COLORS[i % SP_COLORS.length]; }
function beep(ok){
  try{
    var C = window.AudioContext || window.webkitAudioContext;
    if(!C) return;
    var ctx = beep._c || (beep._c = new C());
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = ok ? 660 : 220;
    o.type = ok ? 'sine' : 'sawtooth';
    g.gain.value = 0.08;
    o.start(); o.stop(ctx.currentTime + (ok ? 0.18 : 0.22));
  }catch(e){}
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
/* Dificultades: tamaño, nº palabras y direcciones permitidas */
var DIFS = [
  { id: 'facil', n: '🌱 Fácil', size: 8, nwords: 6, dirs: 'recto', desc: '8×8 · 6 palabras · solo → y ↓' },
  { id: 'normal', n: '🌊 Normal', size: 12, nwords: 10, dirs: 'ocho', desc: '12×12 · 10 palabras · 8 direcciones' },
  { id: 'experto', n: '🔥 Experto', size: 14, nwords: 13, dirs: 'ocho', desc: '14×14 · 13 palabras · 8 direcciones' }
];
function difById(id) {
  for (var i = 0; i < DIFS.length; i++) if (DIFS[i].id === id) return DIFS[i];
  return DIFS[1];
}
function dirsFor(difId) {
  if (difId === 'facil') return [[0, 1], [1, 0]];
  return DIRS;
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
function tryPlaceAll(tema, N, list, dirs) {
  var grid = [], r, c;
  for (r = 0; r < N; r++) { grid.push([]); for (c = 0; c < N; c++) grid[r].push(''); }
  var placed = [];
  var okAll = true;
  for (var wi = 0; wi < list.length; wi++) {
    var w = list[wi];
    if (w.length > N) { okAll = false; break; }
    var dlist = shuffle(dirs.slice());
    var ok = false;
    for (var t = 0; t < 400 && !ok; t++) {
      var d = dlist[t % dlist.length];
      var dr = d[0], dc = d[1];
      var r0 = Math.floor(Math.random() * N), c0 = Math.floor(Math.random() * N);
      var r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1);
      if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
      var good = true, cross = 0;
      for (var k = 0; k < w.length; k++) {
        var rr = r0 + dr * k, cc = c0 + dc * k;
        if (grid[rr][cc]) {
          if (grid[rr][cc] !== w.charAt(k)) { good = false; break; }
          cross++;
        }
      }
      if (!good) continue;
      // evita colocar 100% solapada sobre otra idéntica
      if (cross === w.length && placed.length) continue;
      for (var k2 = 0; k2 < w.length; k2++) grid[r0 + dr * k2][c0 + dc * k2] = w.charAt(k2);
      placed.push({ w: w, r0: r0, c0: c0, dr: dr, dc: dc });
      ok = true;
    }
    if (!ok) { okAll = false; break; }
  }
  return { ok: okAll, grid: grid, placed: placed };
}
function generateGrid(temaId, nWords, difId) {
  var tema = temaById(temaId);
  var dif = difById(difId || (G && G.dif) || 'normal');
  var N = dif.size, NW = nWords || dif.nwords;
  var dirs = dirsFor(dif.id);
  // candidatas: filtra por largo y prioriza largas pero con azar
  var cands = tema.words.filter(function (w) { return w.length <= N; });
  if (!cands.length) cands = tema.words.slice();
  cands = shuffle(cands.slice());
  cands.sort(function (a, b) { return (b.length - a.length) || (Math.random() - 0.5); });
  var best = null;
  for (var att = 0; att < 12; att++) {
    var list = shuffle(cands.slice()).slice(0, Math.min(cands.length, NW + 2));
    // ordena: intercala largas y cortas para mejor encaje
    list.sort(function (a, b) { return b.length - a.length; });
    list = list.slice(0, NW);
    var res = tryPlaceAll(tema, N, list, dirs);
    if (res.ok) { best = res; best.list = list; break; }
    if (!best || res.placed.length > best.placed.length) { best = res; best.list = list; }
  }
  var grid = best.grid, placed = best.placed;
  // relleno aleatorio evitando completar por azar palabras buscadas obvias: simple random está bien
  for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
    if (!grid[r][c]) grid[r][c] = ABC.charAt(Math.floor(Math.random() * ABC.length));
  }
  return { tema: tema.id, dif: dif.id, size: N, grid: grid, placed: placed };
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
        tema: G.tema, dif: G.dif, size: G.size, grid: G.grid,
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

function newGame(temaId, difId) {
  stopTimer();
  var td = temaId || (G && G.tema) || 'mar';
  var dd = difId || (G && G.dif) || 'normal';
  var gen;
  try { gen = generateGrid(td, difById(dd).nwords, dd); }
  catch (e) { gen = generateGrid('mar', 10, 'normal'); }
  G = {
    tema: gen.tema, dif: gen.dif || dd, size: gen.size, grid: gen.grid,
    words: gen.placed.map(function (p, i) { return { w: p.w, found: false, hint: false, r0: p.r0, c0: p.c0, dr: p.dr, dc: p.dc, color: spColor(i) }; }),
    anchor: null, hover: null, seconds: 0, hintsLeft: 3, won: false, timerOn: true, conAyuda: false
  };
  // partidas antiguas sin color: asigna
  G.words.forEach(function (w, i) { if (!w.color) w.color = spColor(i); });
  try { var st = getStats(); st.jugadas++; var u = userData(); u.sopaStats = st; } catch (e) {}
  persistCurrent();
  startTimer();
  renderAll();
  announce('Nueva sopa: ' + temaById(G.tema).n + ', dificultad ' + difById(G.dif).n);
}
function restoreGame(sv) {
  stopTimer();
  var dd = sv.dif || 'normal';
  G = {
    tema: sv.tema || 'mar', dif: dd, size: sv.size || difById(dd).size || 12, grid: sv.grid,
    words: sv.words || [], anchor: null, hover: null,
    seconds: sv.seconds || 0, hintsLeft: (sv.hintsLeft == null ? 3 : sv.hintsLeft),
    won: !!sv.won, conAyuda: !!sv.conAyuda, timerOn: !sv.won
  };
  G.words.forEach(function (w, i) { if (!w.color) w.color = spColor(i); });
  if (G.timerOn) startTimer();
  renderAll();
}
function announce(t) {
  var el = $('spLive');
  if (el) el.textContent = t;
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
    cellsOf(w).forEach(function (rc) { map[rc[0] + ':' + rc[1]] = w.color || '#8fd694'; });
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
      newGame(id, G.dif);
    };
  });
  var db = $('spDifs');
  if (db) {
    db.innerHTML = '<span class="muted" style="font-size:11px">Dificultad:</span>' + DIFS.map(function (d) {
      return '<button type="button" class="sp-dif' + (d.id === G.dif ? ' on' : '') + '" data-dif="' + d.id + '" title="' + esc(d.desc) + '">' + d.n + '</button>';
    }).join('') + '<span class="muted" style="font-size:10px">' + esc(difById(G.dif).desc) + '</span>';
    db.querySelectorAll('[data-dif]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-dif');
        if (G.dif === id) return;
        if (G && !G.won && foundCount() > 0) {
          if (!confirm('¿Cambiar a ' + difById(id).n + '? Se genera una sopa nueva.')) return;
        }
        newGame(G.tema, id);
      };
    });
  }
}
function renderTop() {
  var box = $('spTop');
  if (!box || !G) return;
  var t = temaById(G.tema);
  var pct = G.words.length ? Math.round(foundCount() / G.words.length * 100) : 0;
  box.innerHTML =
    '<div class="sp-top">' +
    '<span class="sp-stat" id="spTime">⏱️ <b>' + fmtTime(G.seconds) + '</b></span>' +
    '<span class="sp-stat">🔎 <b>' + foundCount() + '/' + G.words.length + '</b></span>' +
    '<span class="sp-stat">💡 Pistas <b>' + G.hintsLeft + '</b></span>' +
    '<span class="sp-stat">' + difById(G.dif).n + '</span>' +
    '</div>' +
    '<div class="sp-prog" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' +
    '<p class="muted" style="font-size:11px;margin:4px 0">' + esc(t.n) + ' — ' + esc(t.d) + ' · Arrastra el dedo o toca inicio y fin.</p>';
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
  var h = '<div class="sp-board" id="spGrid" role="grid" aria-label="Sopa de letras ' + G.size + ' por ' + G.size + '" style="grid-template-columns:repeat(' + G.size + ',1fr)">';
  for (var r = 0; r < G.size; r++) {
    for (var c = 0; c < G.size; c++) {
      var k = r + ':' + c;
      var cls = 'sp-cell';
      var style = '';
      if (fc[k]) { cls += ' sp-found'; style = ' style="background:' + fc[k] + '55;border-color:' + fc[k] + '"'; }
      else if (G.anchor && G.anchor[0] === r && G.anchor[1] === c) cls += ' sp-anchor';
      else if (trail[k]) cls += ' sp-trail';
      h += '<button type="button" class="' + cls + '"' + style + ' data-sp="' + k + '" role="gridcell" aria-label="Fila ' + (r + 1) + ' columna ' + (c + 1) + ' letra ' + G.grid[r][c] + '">' + G.grid[r][c] + '</button>';
    }
  }
  box.innerHTML = h + '</div>';
  var gridEl = $('spGrid');
  var dragging = false;
  function rcOf(el) {
    var rc = el.getAttribute('data-sp').split(':');
    return [parseInt(rc[0], 10), parseInt(rc[1], 10)];
  }
  function cellFromPoint(x, y) {
    var el = document.elementFromPoint(x, y);
    if (el && el.getAttribute) {
      var v = el.getAttribute('data-sp');
      if (v) return v.split(':').map(function (n) { return parseInt(n, 10); });
    }
    return null;
  }
  box.querySelectorAll('[data-sp]').forEach(function (el) {
    el.onclick = function () {
      if (G._dragged) { G._dragged = false; return; }
      var rc = rcOf(el);
      tapCell(rc[0], rc[1]);
    };
    el.onmouseenter = function () {
      if (!G || !G.anchor || G.won) return;
      if (dragging || G.anchor) {
        var rc = rcOf(el);
        G.hover = rc;
        paintTrail();
      }
    };
  });
  if (gridEl) {
    gridEl.onpointerdown = function (ev) {
      if (!G || G.won) return;
      var t = ev.target && ev.target.getAttribute ? ev.target.getAttribute('data-sp') : null;
      if (!t) return;
      try { gridEl.setPointerCapture(ev.pointerId); } catch (e) {}
      var rc = t.split(':').map(function (n) { return parseInt(n, 10); });
      G.anchor = rc; G.hover = rc; dragging = true; G._dragged = false;
      renderBoard();
      ev.preventDefault();
    };
    gridEl.onpointermove = function (ev) {
      if (!dragging || !G || !G.anchor) return;
      var rc = cellFromPoint(ev.clientX, ev.clientY);
      if (rc) {
        G.hover = rc; G._dragged = true;
        paintTrail();
      }
    };
    var endDrag = function (ev) {
      if (!dragging) return;
      dragging = false;
      if (!G || !G.anchor || !G.hover) return;
      var a = G.anchor, b = G.hover;
      // toque simple sin mover = deja el anchor puesto (modo toca-toca)
      if (a[0] === b[0] && a[1] === b[1]) { renderBoard(); return; }
      G._dragged = true;
      setTimeout(function () { if (G) G._dragged = false; }, 250);
      resolveSelection(a[0], a[1], b[0], b[1]);
    };
    gridEl.onpointerup = endDrag;
    gridEl.onpointercancel = function () { dragging = false; };
  }
  var msg = $('spMsg');
  if (msg) {
    if (G.won) msg.innerHTML = '🏆 <b>¡Sopa completa!</b> ' + esc(temaById(G.tema).n) + ' (' + difById(G.dif).n + ') en ' + fmtTime(G.seconds) + '.';
    else if (G.anchor) msg.innerHTML = '👆 Inicio marcado en fila ' + (G.anchor[0] + 1) + ', columna ' + (G.anchor[1] + 1) + ' (<b>' + G.grid[G.anchor[0]][G.anchor[1]] + '</b>). Arrastra o toca la <b>última letra</b>. Toca el inicio para cancelar.';
    else if (G.dif === 'facil') msg.innerHTML = '👆 Toca la <b>primera letra</b> y luego la <b>última</b>. En fácil solo → horizontal y ↓ vertical.';
    else msg.innerHTML = '👆 Toca la <b>primera letra</b> y luego su <b>última letra</b> (8 direcciones, también al revés) o arrastra el dedo.';
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
  var h = '<div class="sp-words" aria-live="polite">';
  G.words.forEach(function (w) {
    var pista = tema.hints && tema.hints[w.w] ? ' <small>· ' + esc(tema.hints[w.w]) + '</small>' : '';
    var st = w.found
      ? ' style="border-left-color:' + w.color + ';background:' + w.color + '33;border-color:' + w.color + '"'
      : (w.hint ? '' : ' style="border-left-color:var(--line)"');
    h += '<span class="sp-word' + (w.found ? ' done' : '') + (w.hint && !w.found ? ' hint' : '') + '"' + st + '>' +
      (w.found ? '✅ ' : (w.hint ? '💡 ' : '')) + w.w + pista + '</span>';
  });
  box.innerHTML = h + '</div>' +
    '<div class="sp-tools">' +
    '<button type="button" class="btn" id="spHint" style="width:auto;font-size:12px">💡 Pista (' + G.hintsLeft + ')</button>' +
    '<button type="button" class="btn" id="spCancel" style="width:auto;font-size:12px">✖️ Cancelar</button>' +
    '<button type="button" class="btn" id="spNew" style="width:auto;font-size:12px">🎲 Nueva</button>' +
    '<button type="button" class="btn" id="spShare" style="width:auto;font-size:12px">📤 Compartir</button>' +
    '<button type="button" class="btn" id="spSolve" style="width:auto;font-size:12px" title="Muestra todas (no cuenta como victoria)">👁️ Ver</button>' +
    '</div>';
  $('spHint').onclick = useHint;
  $('spCancel').onclick = function () { G.anchor = null; G.hover = null; renderBoard(); persistCurrent(); };
  $('spNew').onclick = function () { newGame(G.tema, G.dif); };
  $('spShare').onclick = shareResult;
  $('spSolve').onclick = function () {
    if (!G || G.won) return;
    if (!confirm('¿Mostrar todas las palabras? No contará como victoria.')) return;
    G.words.forEach(function (w) { w.found = true; });
    G.anchor = null; G.hover = null; G.timerOn = false; G.conAyuda = true;
    recordResult(false);
    persistCurrent(); renderAll();
  };
}
function shareResult() {
  if (!G) return;
  var t = '🔎 Sopa de Letras · ' + temaById(G.tema).n + ' (' + difById(G.dif).n + ')\n' +
    '✅ ' + foundCount() + '/' + G.words.length + ' · ⏱️ ' + fmtTime(G.seconds) + '\n' +
    G.words.map(function (w) { return (w.found ? '✅ ' : '⬜ ') + w.w; }).join('\n');
  share('🔎 Mi Sopa de Letras', t);
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
    '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>🔎 ¿Qué es?</h4><p>Palabras escondidas entre letras revueltas. Según la dificultad: 🌱 8×8 con 6 palabras (→ ↓), 🌊 12×12 con 10 (8 direcciones), 🔥 14×14 con 13 (8 direcciones). Todo de Penco: mar, mapuzugun, bosque y luna.</p></div>' +
    '<div class="si-card"><h4>👆 Cómo jugar</h4><p>1) <b>Arrastra</b> el dedo desde la primera a la última letra, o toca inicio y fin. 2) Si es correcta se pinta con su color y se tacha. 3) Toca el inicio de nuevo para cancelar. Cada palabra trae su <b>significado</b> al lado.</p></div>' +
    '<div class="si-card"><h4>💡 Estrategia</h4><p>Busca letras raras (K, W, J, Ñ, X). Barre por filas → columnas → diagonales. La 💡 Pista te dice dirección (→ ↓ ↘) e ilumina las 2 primeras letras. En fácil solo hay 2 direcciones: ideal para niños.</p></div>' +
    '<div class="si-card"><h4>🌙 Dato lunar</h4><p>Las sopas entrenan atención y vocabulario: ideales para aprender mapuzugun jugando, en familia, una luna a la vez.</p></div>';
}
function renderHistPanel() {
  var box = $('spHistBox');
  if (!box) return;
  var st = getStats();
  var hist = getHistory().slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 20);
  var mejor = [];
  TEMAS.forEach(function (t) {
    DIFS.forEach(function (d) {
      var m = st.mejor && (st.mejor[t.id + ':' + d.id] || (d.id === 'normal' && st.mejor[t.id]));
      mejor.push('<span class="chip" style="font-size:10px">' + t.n + ' ' + d.n + ': ' + (m ? fmtTime(m) : '—') + '</span>');
    });
  });
  mejor = mejor.join(' ');
  box.innerHTML =
    '<div class="menstrual-card"><h4>📊 Mis números</h4>' +
    '<p class="muted" style="font-size:12px">' + st.ganadas + ' completadas de ' + st.jugadas + ' jugadas · racha actual: ' + (st.racha || 0) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="muted" style="font-size:11px">⏱️ Mejor tiempo:</span>' + mejor + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🕘 Últimas sopas</h4>' +
    (hist.length ? '<div class="habits-list" style="margin-top:6px">' + hist.map(function (r) {
      return '<div class="habit-item" style="font-size:12px">' + (r.won ? '🏆' : '👁️') + ' <b>' + esc(temaById(r.tema).n) + '</b> · ' + esc(difById(r.dif || 'normal').n) + ' · ' + (r.halladas || 0) + '/' + (r.total || 0) + ' · ' + fmtTime(r.seconds) + ' · ' + esc(r.fecha || '') + '</div>';
    }).join('') + '</div>' : '<p class="muted" style="font-size:12px">Aún sin sopas terminadas. ¡Encuentra tus primeras palabras!</p>') +
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
function resolveSelection(r0, c0, r1, c1) {
  if (!G || G.won) return;
  var lc = lineCells(r0, c0, r1, c1);
  if (!lc) {
    G.anchor = [r1, c1]; G.hover = null;
    renderBoard();
    return;
  }
  var fwd = lineWord(lc), bwd = rev(fwd);
  var hit = null;
  for (var i = 0; i < G.words.length; i++) {
    var w = G.words[i];
    if (w.found) continue;
    if (lc.length !== w.w.length) continue;
    if (fwd === w.w || bwd === w.w) {
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
    beep(true);
    try { if (navigator.vibrate) navigator.vibrate([40, 30, 40]); } catch (e) {}
    announce('¡Encontrada: ' + hit.w + '! Llevas ' + foundCount() + ' de ' + G.words.length);
    // pop visual en esas celdas
    renderTop(); renderBoard(); renderWords(); persistCurrent(); checkWin();
    var box = $('spBoard');
    if (box) {
      cellsOf(hit).forEach(function (rc) {
        var el = box.querySelector('[data-sp="' + rc[0] + ':' + rc[1] + '"]');
        if (el) el.classList.add('sp-pop');
      });
    }
  } else {
    beep(false);
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
    G.anchor = [r1, c1]; G.hover = null;
    renderBoard();
    var msg = $('spMsg');
    if (msg) msg.innerHTML = '❌ <b>' + esc(fwd) + '</b> no es una palabra buscada (largo ' + lc.length + '). Nuevo inicio: <b>' + G.grid[r1][c1] + '</b>. Revisa la lista: largos ' + G.words.filter(function (w) { return !w.found; }).map(function (w) { return w.w.length; }).join(', ') + '.';
  }
}
function tapCell(r, c) {
  if (!G || G.won) return;
  if (!G.anchor) {
    G.anchor = [r, c]; G.hover = null;
    try { if (navigator.vibrate) navigator.vibrate(20); } catch (e) {}
    renderBoard();
    return;
  }
  if (G.anchor[0] === r && G.anchor[1] === c) {
    G.anchor = null; G.hover = null;
    renderBoard(); persistCurrent();
    return;
  }
  resolveSelection(G.anchor[0], G.anchor[1], r, c);
}
function useHint() {
  if (!G || G.won) return;
  if (G.hintsLeft <= 0) { alert('Sin pistas. Genera una sopa nueva para recuperarlas.'); return; }
  var rest = G.words.filter(function (w) { return !w.found; });
  if (!rest.length) return;
  // prioriza palabras sin pista previa y más largas
  rest.sort(function (a, b) { return ((b.hint ? 0 : 1) - (a.hint ? 0 : 1)) || (b.w.length - a.w.length); });
  var pick = rest[0];
  pick.hint = true;
  G.hintsLeft--; G.conAyuda = true;
  renderWords(); renderTop(); persistCurrent();
  announce('Pista: busca ' + pick.w.charAt(0) + ' de ' + pick.w.length + ' letras');
  setTimeout(function () {
    var box = $('spBoard');
    if (!box) return;
    cellsOf(pick).forEach(function (rc, i) {
      var el = box.querySelector('[data-sp="' + rc[0] + ':' + rc[1] + '"]');
      if (el && i < 2) { el.classList.add('sp-hintflash'); setTimeout(function () { el.classList.remove('sp-hintflash'); }, 3200); }
    });
  }, 30);
  var msg = $('spMsg');
  if (msg) {
    var tema = temaById(G.tema);
    var pista = (tema.hints && tema.hints[pick.w]) || '';
    var dirTxt = (pick.dr === 0) ? '→ horizontal' : (pick.dc === 0 ? '↓ vertical' : '↘ diagonal');
    msg.innerHTML = '💡 Busca <b>' + pick.w.charAt(0) + '…</b> (' + pick.w.length + ' letras, ' + dirTxt + (pista ? ' · ' + esc(pista) : '') + '). Primeras 2 letras iluminadas ✨';
  }
}
function checkWin() {
  if (!G || G.won) return;
  var all = G.words.length && G.words.every(function (w) { return w.found; });
  if (!all) return;
  G.won = true; G.timerOn = false;
  recordResult(true);
  persistCurrent(); renderAll();
  save('¡Sopa completa! 🏆');
  beep(true); setTimeout(function () { beep(true); }, 250);
  try { if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 120]); } catch (e) {}
  announce('¡Sopa completa en ' + fmtTime(G.seconds) + '!');
  setTimeout(showWin, 350);
}
function showWin() {
  if (!G || !G.won) return;
  var st = getStats();
  var key = G.tema + ':' + G.dif;
  var best = st.mejor && st.mejor[key] ? fmtTime(st.mejor[key]) : fmtTime(G.seconds);
  var html = '<div class="sp-win"><div class="sp-confetti">🎉🏆🎉</div><div class="big">🏆</div>' +
    '<h3 style="margin:6px 0;color:var(--accent)">¡Sopa completa!</h3>' +
    '<p class="muted">' + esc(temaById(G.tema).n) + ' · ' + difById(G.dif).n + ' · ⏱️ ' + fmtTime(G.seconds) + (G.conAyuda ? ' (con ayuda)' : ' (sin ayuda 🌟)') + '<br>Mejor en este nivel: ' + best + ' · Racha: ' + (st.racha || 0) + '</p>' +
    '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:10px">' +
    '<button type="button" class="btn btn-accent" id="spWinNew" style="width:auto">🎲 Nueva sopa</button>' +
    '<button type="button" class="btn" id="spWinShare" style="width:auto">📤 Compartir</button>' +
    '</div></div>';
  var msg = $('spMsg');
  if (msg) msg.innerHTML = html;
  var nb = $('spWinNew'), sb = $('spWinShare');
  if (nb) nb.onclick = function () { newGame(G.tema, G.dif); };
  if (sb) sb.onclick = shareResult;
}
function statKey() { return G.tema + ':' + (G.dif || 'normal'); }
function recordResult(won) {
  try {
    var st = getStats();
    if (won) {
      st.ganadas++;
      st.racha = (st.racha || 0) + 1;
      if (!st.mejor) st.mejor = {};
      var k = statKey();
      // compat: migra mejor antiguo por tema simple
      if (st.mejor[G.tema] && !st.mejor[G.tema + ':normal']) st.mejor[G.tema + ':normal'] = st.mejor[G.tema];
      if (!st.mejor[k] || G.seconds < st.mejor[k]) st.mejor[k] = G.seconds;
    } else {
      st.racha = 0;
    }
    var u = userData();
    u.sopaStats = st;
    var h = getHistory();
    var d = new Date();
    var fecha = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    h.push({ ts: Date.now(), fecha: fecha, tema: G.tema, dif: G.dif, halladas: foundCount(), total: G.words.length, seconds: G.seconds, won: won });
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
    '<p class="muted" style="line-height:1.5">Encuentra las palabras escondidas de Penco. Arrastra o toca inicio y fin. 3 dificultades. Todo queda <b>privado y local</b> en tu usuario.</p>' +
    '<div id="spLunaBox" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabSpJugar" class="btn btn-accent" style="width:auto">🔎 Jugar</button>' +
    '<button type="button" id="tabSpAprender" class="btn" style="width:auto">📚 Aprender</button>' +
    '<button type="button" id="tabSpRegistros" class="btn" style="width:auto">🏆 Mis registros</button>' +
    '</div>' +
    '<div id="spPanelJugar"><div class="sp-wrap"><div id="spTemas" class="sp-temas"></div><div id="spDifs" class="sp-difs"></div><div id="spTop"></div><div id="spBoard"></div>' +
    '<div id="spMsg" class="chip sp-msg" style="display:block;white-space:normal"></div><div id="spLive" class="sp-live" aria-live="polite"></div>' +
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
  generate: generateGrid, temas: TEMAS, dificultades: DIFS
};
setTimeout(setup, 600);

})();
