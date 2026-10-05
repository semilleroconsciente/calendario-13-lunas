/* ============================================================
   MATEMATICAS — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa dentro de Aprender, Crear y Jugar > Estudio:
   - Botón btnMatematicas (inyectado en grupo aprender, sub estudio)
   - Diálogo matematicasDialog con 6 pestañas:
     1) 📖 Guía (método sin miedo + números mapuzugun + luna)
     2) 🧮 Calculadora (expresión segura + % + regla de 3 +
         fracciones + MCD/MCM + primos)
     3) 🔢 Práctica (quiz configurable + tablas + adivinanza +
         reto 13×28)
     4) 📐 Geometría y medidas (áreas, volúmenes, Pitágoras,
         terreno y pintura Penco)
     5) 🏠 Mates del hogar (receta, descuento/IVA, interés
         simple, cuentas y trueque)
     6) 📓 Mi avance (racha, stats, bitácora privada, metas)
   - Todo local y privado por usuario: userData().matematicas
     { stats:{played,best,streak,lastDay}, logs:[] }
   - 100% offline. Sin eval(): parser propio de expresiones.
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
function store() {
  try {
    var blank = function () { return { stats: { played: 0, best: 0, streak: 0, lastDay: '', xp: 0, stars: {}, nivel: 1 }, logs: [] }; };
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.matematicas) u.matematicas = blank();
    var m = u.matematicas;
    if (!m.stats) m.stats = { played: 0, best: 0, streak: 0, lastDay: '', xp: 0, stars: {}, nivel: 1 };
    if (m.stats.xp == null) m.stats.xp = 0;
    if (!m.stats.stars || typeof m.stats.stars !== 'object') m.stats.stars = {};
    if (!m.stats.nivel) m.stats.nivel = 1;
    if (!Array.isArray(m.logs)) m.logs = [];
    return m;
  } catch (e2) { return { stats: { played: 0, best: 0, streak: 0, lastDay: '', xp: 0, stars: {}, nivel: 1 }, logs: [] }; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
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
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted" style="line-height:1.5">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(t) {
  ['Guia', 'Calc', 'Pract', 'Geo', 'Hogar', 'Ava'].forEach(function (x) {
    var p = $('mat' + x), b = $('tabMat' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function fmt(n, dec) {
  if (!isFinite(n)) return '—';
  var d = (dec == null) ? 2 : dec;
  var r = Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
  return String(r).replace('.', ',');
}
/* Formato inteligente para la calculadora: redondea a 6 decimales,
   recorta SOLO ceros decimales (nunca toca el entero) y usa
   formato chileno (miles con punto, decimal con coma). */
function fmtSmart(n) {
  if (!isFinite(n)) return '—';
  var r = Math.round(n * 1e6) / 1e6;
  if (r === 0) r = 0; /* evita "-0" */
  var parts = String(r).split('.');
  var entero = parts[0], sign = '';
  if (entero.charAt(0) === '-') { sign = '-'; entero = entero.slice(1); }
  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (parts.length < 2) return sign + entero;
  return sign + entero + ',' + parts[1];
}
function num(v) {
  if (typeof v !== 'string') v = String(v == null ? '' : v);
  /* tolera "$6.000", "4 kg", "19%", espacios y miles con punto */
  var t = v.replace(/\s/g, '');
  var m = t.match(/-?\d[\d.]*,?\d*/);
  if (!m) return NaN;
  var tok = m[0];
  /* si hay coma decimal, los puntos son miles: quitarlos */
  if (tok.indexOf(',') >= 0) tok = tok.replace(/\./g, '').replace(',', '.');
  /* sin coma: "6.000" o "1.500.000" son miles (convención chilena) */
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(tok)) tok = tok.replace(/\./g, '');
  var n = parseFloat(tok);
  return isFinite(n) ? n : NaN;
}

/* ---------------- PARSER SEGURO DE EXPRESIONES ----------------
   Acepta dígitos, + - * / % ( ) . , × ÷ − y espacios. Sin eval().
   % tiene dos usos:
   - posfijo (porcentaje): 50% → 0,5 · 100*19% → 19 ·
     200+10% → 220 (10% de 200) · 15000-19% → descuento.
   - binario (módulo): 10%3 → 1 (solo si le sigue un número). */
function evalExpr(src) {
  var s = String(src || '').replace(/\s+/g, '')
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
    .replace(/,/g, '.');
  if (!s) throw new Error('vacía');
  if (/[^0-9+\-*/%().]/.test(s)) throw new Error('caracter no permitido');
  var i = 0;
  function peek() { return s[i]; }
  function eat() { return s[i++]; }
  function parseNum() {
    var st = i, pts = 0;
    while (i < s.length && /[0-9.]/.test(s[i])) { if (s[i] === '.') pts++; i++; }
    if (st === i) throw new Error('número esperado');
    var t = s.slice(st, i);
    if (pts > 1) throw new Error('número mal escrito');
    if (t === '.') throw new Error('número mal escrito');
    var n = parseFloat(t);
    if (!isFinite(n)) throw new Error('número inválido');
    return n;
  }
  function parseBase() {
    if (peek() === '(') { eat(); var v = parseAdd(); if (peek() !== ')') throw new Error('falta )'); eat(); return v; }
    if (peek() === '+' || peek() === '-') { var sg = eat() === '-' ? -1 : 1; return sg * parseBase(); }
    return parseNum();
  }
  function parseMul() {
    var v = parseBase();
    for (;;) {
      var c = peek();
      if (c === '*' || c === '/') {
        eat(); var r = parseBase();
        if (c === '*') v = v * r;
        else { if (r === 0) throw new Error('división por cero'); v = v / r; }
      } else if (c === '%') {
        var nx = s[i + 1], nnx = s[i + 2];
        var esModulo = nx !== undefined && (/[0-9.(]/.test(nx) ||
          ((nx === '+' || nx === '-') && nnx !== undefined && /[0-9.(]/.test(nnx)));
        if (esModulo) {
          eat(); var m = parseBase();
          v = v % m;
        } else {
          eat(); v = v / 100; /* porcentaje posfijo */
        }
      } else return v;
    }
  }
  function parseAdd() {
    var v = parseMul();
    for (;;) {
      var c = peek();
      if (c === '+' || c === '-') {
        eat();
        var r2 = parseMul();
        /* "200+10%" = 200 + 10% DE 200 (comportamiento de calculadora).
           Un módulo ("10%3") nunca termina en %, así que s[i-1]==='%'
           solo ocurre con porcentaje posfijo. */
        if (s[i - 1] === '%') r2 = v * r2;
        v = (c === '+') ? v + r2 : v - r2;
      } else return v;
    }
  }
  var out = parseAdd();
  if (i !== s.length) throw new Error('expresión incompleta');
  if (!isFinite(out)) throw new Error('resultado inválido');
  return out;
}
function gcd(a, b) { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); if (!a || !b) return a || b || 0; while (b) { var t = a % b; a = b; b = t; } return a; }
function lcm(a, b) { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); if (!a || !b) return 0; return Math.abs(a * b) / gcd(a, b); }
function esPrimo(n) {
  n = Math.round(n);
  if (n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0) return false;
  for (var i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

/* ---------------- NIVELES + QUIZ / PRÁCTICA ----------------
   5 niveles progresivos (XP + estrellas + desbloqueo):
   1 🌱 Semilla · 2 🌿 Brote · 3 🌳 Árbol · 4 🌙 Luna · 5 ☀️ Kimche */
var LEVELS = [
  { id: 1, ico: '🌱', nombre: 'Semilla', rango: '1–10', ops: ['+', '-'], max: 10, req: 0, tablas: null, advMax: 20, desc: 'Sumas y restas del 1 al 10, sin apuro. Para partir de cero y tomar confianza.' },
  { id: 2, ico: '🌿', nombre: 'Brote', rango: '1–20', ops: ['+', '-', '×'], max: 20, req: 60, tablas: [2, 3, 5], advMax: 50, desc: 'Sumas y restas hasta 20 + tablas del 2, 3 y 5. Como calcular la feria chica.' },
  { id: 3, ico: '🌳', nombre: 'Árbol', rango: '1–30', ops: ['+', '-', '×', '÷'], max: 30, req: 150, tablas: [2, 3, 4, 5, 6, 7, 8, 9], advMax: 100, desc: 'Multiplicación y división de verdad + todas las tablas. Las restas ya pueden dar negativo.' },
  { id: 4, ico: '🌙', nombre: 'Luna', rango: '1–50', ops: ['+', '-', '×', '÷'], max: 50, req: 300, tablas: null, advMax: 100, desc: 'Operaciones mixtas hasta 50. Puente a % y fracciones fáciles + regla de 3.' },
  { id: 5, ico: '☀️', nombre: 'Kimche', rango: '1–100', ops: ['+', '-', '×', '÷'], max: 100, req: 500, tablas: null, advMax: 100, desc: 'Nivel sabio: todo mezclado hasta 100 + geometría, IVA, interés y reto 13 lunas.' }
];
function lvlCfg(n) {
  var id = parseInt(n, 10);
  if (!isFinite(id)) {
    /* compatibilidad con Nivel antiguo: facil/medio/dificil */
    if (n === 'facil') id = 1; else if (n === 'medio') id = 2; else if (n === 'dificil') id = 4; else id = 1;
  }
  if (id < 1) id = 1; if (id > 5) id = 5;
  return LEVELS[id - 1];
}
function lvlUnlocked(id) {
  var xp = 0;
  try { xp = store().stats.xp || 0; } catch (e) {}
  return xp >= (LEVELS[id - 1].req || 0);
}
function lvlActual() {
  var xp = 0;
  try { xp = store().stats.xp || 0; } catch (e) {}
  var cur = 1;
  LEVELS.forEach(function (L) { if (xp >= L.req) cur = L.id; });
  return cur;
}
function addXP(n) {
  try {
    var m = store();
    m.stats.xp = (m.stats.xp || 0) + n;
    if (m.stats.xp < 0) m.stats.xp = 0;
    save();
  } catch (e) {}
  try { paintLevels(); } catch (e2) {}
  try { renderAva(); } catch (e3) {}
}
function starsFor(ok, total) {
  if (!total) return 0;
  var acc = ok / total;
  if (acc >= 0.9 && ok >= 5) return 3;
  if (acc >= 0.7) return 2;
  if (acc >= 0.5) return 1;
  return 0;
}
function paintLevels() {
  var xp = 0, stars = {}, sel = 1;
  try { var m = store(); xp = m.stats.xp || 0; stars = m.stats.stars || {}; sel = parseInt((($('matQNivel') || {}).value) || m.stats.nivel || lvlActual(), 10) || 1; } catch (e) {}
  if (!lvlUnlocked(sel)) sel = lvlActual();
  try { if ($('matQNivel') && $('matQNivel').value !== String(sel)) $('matQNivel').value = String(sel); } catch (eV) {}
  try { store().stats.nivel = sel; } catch (eN) {}
  var bar = $('matLvlBar'), txt = $('matLvlXP');
  var nextReq = null;
  for (var i = 0; i < LEVELS.length; i++) { if (LEVELS[i].req > xp) { nextReq = LEVELS[i].req; break; } }
  if (bar) bar.style.width = nextReq ? Math.min(100, Math.round(xp / nextReq * 100)) + '%' : '100%';
  if (txt) txt.textContent = '✨ ' + xp + ' XP · nivel actual ' + lvlActual() + '/5' + (nextReq ? ' · te faltan ' + (nextReq - xp) + ' XP para el siguiente' : ' · ¡nivel máximo! 🎉');
  var desc = $('matLvlDesc');
  try {
    var c = lvlCfg(sel);
    if (desc) desc.innerHTML = '<b>' + c.ico + ' Nivel ' + c.id + ' · ' + esc(c.nombre) + ' (' + esc(c.rango) + ')</b> — ' + esc(c.desc) + (lvlUnlocked(c.id) ? '' : ' <b>🔒 Requiere ' + c.req + ' XP.</b>');
  } catch (eD) {}
  /* El select de nivel nunca ofrece bloqueados como elegibles */
  try {
    var qn2 = $('matQNivel');
    if (qn2) {
      for (var oi = 0; oi < qn2.options.length; oi++) {
        var oid = parseInt(qn2.options[oi].value, 10) || 1;
        qn2.options[oi].disabled = !lvlUnlocked(oid);
      }
    }
    /* La lista de tablas respeta el nivel: fuera de rango, deshabilitada */
    var qt = $('matQTabla'), cfgSel = lvlCfg(sel);
    if (qt) {
      var allowed = cfgSel.tablas || [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      if (cfgSel.id === 1) allowed = [];
      for (var ti = 0; ti < qt.options.length; ti++) {
        var tv = parseInt(qt.options[ti].value, 10) || 0;
        qt.options[ti].disabled = (tv !== 0 && allowed.indexOf(tv) < 0);
      }
      var curT = parseInt(qt.value, 10) || 0;
      if (curT !== 0 && allowed.indexOf(curT) < 0) qt.value = '0';
      var qo = $('matQOp');
      if (qo) {
        for (var oo = 0; oo < qo.options.length; oo++) {
          var ov = qo.options[oo].value;
          qo.options[oo].disabled = (ov !== 'todo' && ov !== 'tablas' && cfgSel.ops.indexOf(ov) < 0) || (ov === 'tablas' && cfgSel.id === 1);
        }
        if (qo.selectedIndex >= 0 && qo.options[qo.selectedIndex].disabled) qo.value = 'todo';
      }
    }
  } catch (eO) {}
  document.querySelectorAll('#matematicasDialog [data-lvl]').forEach(function (b) {
    var id = parseInt(b.getAttribute('data-lvl'), 10);
    var un = lvlUnlocked(id);
    b.classList.toggle('sel', id === sel);
    b.classList.toggle('locked', !un);
    var st = 0;
    try { st = (store().stats.stars || {})[id] || 0; } catch (eS) {}
    var base = LEVELS[id - 1];
    b.innerHTML = '<span class="ml-ico">' + (un ? base.ico : '🔒') + '</span><span class="ml-n">' + id + ' · ' + esc(base.nombre) + '</span><span class="ml-s">' + (st ? '★'.repeat(st) + '☆'.repeat(3 - st) : '☆☆☆') + '</span>';
    b.disabled = !un;
    b.title = un ? base.desc : ('Desbloquea con ' + base.req + ' XP (llevas ' + xp + ')');
  });
}
var Q = { a: null, b: null, op: '+', ok: 0, total: 0, racha: 0, meta: 10, timer: null, seg: 0, tabla: 0, nivel: 1, asked: false };
function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function qNew(op, nivel, tablaFija) {
  var cfg = lvlCfg(nivel);
  Q.nivel = cfg.id;
  try { store().stats.nivel = cfg.id; } catch (e) {}
  var max = cfg.max;
  var notice = '';
  /* Validar operación contra el nivel: si no corresponde, se usa "todo del nivel" y se avisa */
  if (op !== 'todo' && op !== 'tablas' && cfg.ops.indexOf(op) < 0) {
    notice = 'Nivel ' + cfg.id + ' (' + cfg.nombre + ') practica ' + cfg.ops.join(' ') + '. Te puse una de esas 👇. Desbloquea más operaciones subiendo de nivel.';
    op = 'todo';
  }
  if (op === 'tablas' && cfg.id === 1) {
    notice = 'Nivel 1 aún no usa tablas: practicamos sumas y restas. Las tablas parten en Nivel 2 🌿.';
    op = 'todo';
  }
  var ops = op === 'todo' ? cfg.ops.slice() : [op];
  var o = ops[Math.floor(Math.random() * ops.length)];
  var useTablas = (op === 'tablas') || (o === '×' && cfg.tablas && op === 'todo' && Math.random() < 0.6);
  var a, b;
  if (useTablas) {
    var tz = cfg.tablas || [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    var t = (tablaFija && tz.indexOf(tablaFija) >= 0) ? tablaFija : tz[Math.floor(Math.random() * tz.length)];
    a = t; b = 1 + Math.floor(Math.random() * 10); o = '×';
  } else if (o === '÷') {
    var bMax = cfg.id <= 2 ? 5 : cfg.id === 3 ? 9 : 12;
    b = 2 + Math.floor(Math.random() * (bMax - 1));
    var c = 1 + Math.floor(Math.random() * (cfg.id >= 4 ? 12 : 10));
    a = b * c;
    if (cfg.id === 1) { o = '+'; a = rnd(1, 10); b = rnd(1, 10); }
  } else if (o === '-') {
    a = rnd(1, max);
    b = rnd(1, max);
    if (cfg.id <= 2 && b > a) { var tmp = a; a = b; b = tmp; } /* niveles 1-2: sin negativos */
  } else if (o === '+') {
    a = rnd(1, max);
    b = rnd(1, max);
  } else if (o === '×') {
    var baseT = cfg.tablas || [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    var f1 = cfg.id <= 2 ? baseT[Math.floor(Math.random() * baseT.length)] : rnd(2, cfg.id >= 4 ? 12 : 10);
    if (tablaFija && baseT.indexOf(tablaFija) >= 0) f1 = tablaFija;
    a = f1; b = rnd(1, cfg.id >= 4 ? 12 : 10);
  } else {
    a = rnd(1, max);
    b = rnd(1, max);
  }
  Q.a = a; Q.b = b; Q.op = o; Q.asked = true;
  paintQ();
  if (notice) {
    var fbN = $('matQFb');
    if (fbN) { fbN.textContent = notice; fbN.style.color = ''; }
  }
}
function qResp() {
  if (Q.a == null || Q.b == null) return NaN;
  if (Q.op === '+') return Q.a + Q.b;
  if (Q.op === '-') return Q.a - Q.b;
  if (Q.op === '×') return Q.a * Q.b;
  return Q.b === 0 ? NaN : Q.a / Q.b;
}
function curQSel() {
  return {
    op: (($('matQOp') || {}).value || 'todo'),
    niv: (($('matQNivel') || {}).value || String(Q.nivel || 1)),
    tabla: parseInt((($('matQTabla') || {}).value || '0'), 10) || 0
  };
}
function paintQ() {
  var t = $('matQTxt');
  if (t) {
    if (Q.a == null || Q.b == null) t.textContent = 'Elige nivel y toca “🎲 Nueva pregunta” para empezar. Con ⏎ compruebas sin usar el mouse.';
    else t.innerHTML = '¿Cuánto es <b style="font-size:20px">' + Q.a + ' ' + Q.op + ' ' + Q.b + '</b>? (' + Q.ok + '/' + Q.meta + ')';
  }
  var st = $('matQStats');
  if (st) {
    var xp = 0; try { xp = store().stats.xp || 0; } catch (e) {}
    st.textContent = '✅ ' + Q.ok + '/' + Q.total + ' · 🔥 racha ' + Q.racha + ' · meta ' + Q.meta + ' · N' + (Q.nivel || 1) + ' · ✨ ' + xp + ' XP';
  }
  var bar = $('matQBar');
  if (bar) bar.style.width = Q.meta ? Math.min(100, Math.round(Q.ok / Q.meta * 100)) + '%' : '0%';
}
function qCheck() {
  var inp = $('matQResp');
  var fb = $('matQFb');
  if (Q.a == null) { if (fb) fb.textContent = 'Primero toca “🎲 Nueva pregunta”.'; qNew(curQSel().op, curQSel().niv, curQSel().tabla); return; }
  var v = num((inp || {}).value);
  if (!isFinite(v)) { if (fb) fb.textContent = 'Escribe tu respuesta con números 🙂'; return; }
  var r = qResp();
  Q.total++;
  var bien = Math.abs(v - r) < 1e-9;
  if (bien) {
    Q.ok++; Q.racha++;
    var g = 10 + (Q.racha >= 3 ? 5 : 0) + ((Q.nivel || 1) >= 4 ? 5 : 0);
    try { var m0 = store(); m0.stats.xp = (m0.stats.xp || 0) + g; save(); } catch (e) {}
    if (fb) { fb.textContent = '¡Bien! 🎉 +' + g + ' XP · ' + Q.a + ' ' + Q.op + ' ' + Q.b + ' = ' + fmt(r, r % 1 ? 2 : 0); fb.style.color = '#8fd694'; }
  } else {
    Q.racha = 0;
    if (fb) { fb.textContent = 'Casi… era ' + fmt(r, r % 1 ? 2 : 0) + '. Vamos con la siguiente 💪'; fb.style.color = '#e8c56a'; }
  }
  if (inp) inp.value = '';
  try { inp.focus(); } catch (e) {}
  paintQ();
  try { paintLevels(); } catch (e2) {}
  if (Q.ok >= Q.meta && Q.total) { qFinish(); return; }
  /* Auto-avance: sin apretar “Nueva pregunta” a cada rato */
  try { var s = curQSel(); qNew(s.op === 'tablas' ? 'tablas' : s.op, s.niv, s.tabla); } catch (e3) {}
}
function qFinish() {
  var m = store();
  m.stats.played++;
  if (Q.ok > (m.stats.best || 0)) m.stats.best = Q.ok;
  var hoy = todayKey();
  if (m.stats.lastDay !== hoy) {
    var ayer = new Date(hoy + 'T12:00:00'); ayer.setDate(ayer.getDate() - 1);
    var ak = ayer.getFullYear() + '-' + String(ayer.getMonth() + 1).padStart(2, '0') + '-' + String(ayer.getDate()).padStart(2, '0');
    m.stats.streak = (m.stats.lastDay === ak) ? (m.stats.streak || 0) + 1 : 1;
    m.stats.lastDay = hoy;
  }
  var lvlId = Q.nivel || 1;
  var st = starsFor(Q.ok, Q.total);
  m.stats.stars = m.stats.stars || {};
  if (st > (m.stats.stars[lvlId] || 0)) m.stats.stars[lvlId] = st;
  var bonus = 20;
  m.stats.xp = (m.stats.xp || 0) + bonus;
  var cfg = lvlCfg(lvlId);
  m.logs.push({ id: uid('mt'), fecha: hoy, tipo: 'quiz', detalle: 'N' + lvlId + ' ' + cfg.nombre + ' · ' + Q.ok + '/' + Q.total + ' (' + (($('matQOp') || {}).value || 'todo') + ') · ' + '★'.repeat(st) + '☆'.repeat(3 - st) + ' · +' + bonus + ' XP bonus', ok: Q.ok, total: Q.total });
  if (m.logs.length > 200) m.logs = m.logs.slice(-200);
  save('¡Meta cumplida! +' + bonus + ' XP 🎉');
  renderAva();
  try { paintLevels(); } catch (eP) {}
  var fb = $('matQFb');
  var nxt = LEVELS[lvlId] ? (' · siguiente: ' + LEVELS[lvlId].ico + ' ' + LEVELS[lvlId].nombre + ' (' + LEVELS[lvlId].req + ' XP)') : ' · ¡nivel máximo! ☀️';
  if (fb) fb.textContent = '🏁 ¡Meta ' + Q.meta + ' cumplida! +' + bonus + ' XP bonus · ' + '★'.repeat(st) + '☆'.repeat(3 - st) + nxt;
  Q.ok = 0; Q.total = 0; Q.racha = 0;
  paintQ();
  try { var s2 = curQSel(); setTimeout(function () { try { qNew(s2.op === 'tablas' ? 'tablas' : s2.op, s2.niv, s2.tabla); } catch (eN) {} }, 1400); } catch (eT) { setTimeout(paintQ, 1200); }
}
/* adivinanza */
var ADV = { n: 0, intentos: 0, jugando: false, max: 100 };
function advNuevo() {
  var mx = 100;
  try {
    var sel = parseInt((($('matQNivel') || {}).value) || (store().stats.nivel) || lvlActual(), 10) || lvlActual();
    mx = lvlCfg(sel).advMax || 100;
  } catch (e) {}
  ADV.max = mx;
  ADV.n = 1 + Math.floor(Math.random() * mx);
  ADV.intentos = 0; ADV.jugando = true;
  var h = $('matAdvTitle'); if (h) h.textContent = '🎯 Adivina el número (1–' + mx + ')';
  var ai = $('matAdvIn');
  if (ai) { ai.max = String(mx); ai.placeholder = '1–' + mx; ai.value = ''; }
  var b = $('matAdvFb'); if (b) { b.textContent = 'Pienso un número del 1 al ' + mx + '… ¡adivínalo!'; b.style.color = ''; }
  var c = $('matAdvCount'); if (c) c.textContent = 'Intentos: 0';
}

/* ---------------- RENDER AVANCE ---------------- */
function renderAva() {
  var m = store();
  var box = $('matAvaBox'); if (!box) return;
  var s = m.stats || { played: 0, best: 0, streak: 0, xp: 0, stars: {}, nivel: 1 };
  var xp = s.xp || 0, stars = s.stars || {};
  var cur = lvlActual();
  var nxt = null;
  for (var i = 0; i < LEVELS.length; i++) { if (LEVELS[i].req > xp) { nxt = LEVELS[i]; break; } }
  var starRow = LEVELS.map(function (L) {
    var st = stars[L.id] || 0;
    return '<span title="' + esc(L.nombre) + ': ' + st + '/3"> ' + L.ico + ' ' + '★'.repeat(st) + '☆'.repeat(3 - st) + '</span>';
  }).join(' ');
  var logs = (m.logs || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 30);
  box.innerHTML = '<p class="muted" style="font-size:11px">🎮 Partidas: <b>' + (s.played || 0) + '</b> · 🏆 mejor: <b>' + (s.best || 0) + '</b> · 🔥 racha días: <b>' + (s.streak || 0) + '</b> · ✨ XP: <b>' + xp + '</b> · 🎚️ nivel: <b>' + cur + '/5 ' + LEVELS[cur - 1].ico + ' ' + esc(LEVELS[cur - 1].nombre) + '</b></p>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + (nxt ? Math.min(100, Math.round(xp / nxt.req * 100)) : 100) + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">' + starRow + (nxt ? ' · siguiente: ' + nxt.ico + ' ' + esc(nxt.nombre) + ' con ' + nxt.req + ' XP (faltan ' + (nxt.req - xp) + ')' : ' · ¡nivel máximo ☀️!') + '</p>' +
    (logs.length ? logs.map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>' + esc(r.fecha || '') + '</b> · ' + esc(r.tipo === 'quiz' ? '🔢 Quiz' : r.tipo === 'adivinanza' ? '🎯 Adivinanza' : '📝 Práctica') + ' · ' + esc(r.detalle || '') + '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted">Sin registros aún. Juega una partida en 🔢 Práctica y aquí verás tu avance por lunas.</p>');
  box.querySelectorAll('[data-del]').forEach(function (b) {
    b.onclick = function () {
      var dd = store().logs; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); });
      if (i >= 0) dd.splice(i, 1); save(); renderAva();
    };
  });
  var st = $('matAvaStats');
  if (st) st.textContent = (m.logs || []).length + ' registros · todo privado y local';
}

/* ---------------- DIALOGO ---------------- */
function rowCard(c) {
  return '<div class="si-card"><h4>' + c.h + '</h4><p>' + c.p + '</p></div>';
}
function buildDialog() {
  var body =
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabMatGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabMatCalc" class="btn" style="width:auto">🧮 Calculadora</button>' +
    '<button type="button" id="tabMatPract" class="btn" style="width:auto">🔢 Práctica</button>' +
    '<button type="button" id="tabMatGeo" class="btn" style="width:auto">📐 Geometría</button>' +
    '<button type="button" id="tabMatHogar" class="btn" style="width:auto">🏠 Hogar</button>' +
    '<button type="button" id="tabMatAva" class="btn" style="width:auto">📓 Mi avance</button></div>' +

    /* GUIA */
    '<div id="matGuia">' +
    rowCard({ h: '🔢 ¿Para qué sirven aquí las matemáticas?', p: 'Para la vida real de Penco: calcular la feria, dividir una receta, medir un terreno o cerco, estimar pintura, leer tu consumo eléctrico y jugar con la mente. <b>No es escuela con nota:</b> es herramienta. Si te costaron antes, aquí partes de cero, sin vergüenza y a tu ritmo.' }) +
    rowCard({ h: '🚶 Método sin miedo (15 min por día)', p: '<b>1)</b> Elige UN tema (ej: tablas del 7). <b>2)</b> Mira el ejemplo resuelto en cada pestaña. <b>3)</b> Haz 10 ejercicios en 🔢 Práctica. <b>4)</b> Anota 1 frase de lo aprendido en 📓 Mi avance. <b>5)</b> Repite mañana. La memoria ama lo poco y frecuente: mejor 15 min diarios que 3 horas un día.' }) +
    rowCard({ h: '🌙 Ritmo lunar sugerido', p: '<b>Creciente:</b> tema nuevo (tablas, fracciones). <b>Llena:</b> juega y celebra (quiz, adivinanza). <b>Menguante:</b> repasa lo difícil y ordena cuaderno. <b>Nueva:</b> descansa: la mente consolida durmiendo. El calendario de 13 lunas × 28 días = <b>364</b>: multiplica 13×28 en 🧮 para comprobarlo.' }) +
    rowCard({ h: '🗣️ Números que también son kimün', p: 'Mapuzugun del 1 al 13: <b>kiñe (1) · epu (2) · küla (3) · meli (4) · kechu (5) · kayu (6) · regle (7) · pura (8) · aylla (9) · mari (10) · mari kiñe (11) · mari epu (12) · mari küla (13)</b>. Mari küla küyen = 13 lunas. Contar también es pertenecer.' }) +
    rowCard({ h: '🎚️ 5 niveles: avanza sin miedo', p: '<b>🌱 1 Semilla (1–10):</b> sumas y restas para partir. <b>🌿 2 Brote (1–20):</b> + tablas 2, 3 y 5. <b>🌳 3 Árbol (1–30):</b> × ÷ de verdad. <b>🌙 4 Luna (1–50):</b> mixto + % y fracciones. <b>☀️ 5 Kimche (1–100):</b> vida real (IVA, interés, geometría). Ganas <b>+10 XP por buena</b> (+5 racha ≥3), <b>+20 XP al cumplir la meta</b> y <b>★ hasta 3 por nivel</b>. Los niveles 2–5 se desbloquean con 60 · 150 · 300 · 500 XP.' }) +
    rowCard({ h: '💡 Si te equivocas', p: 'El error es dato, no fracaso. En el quiz la respuesta correcta aparece al tiro para que aprendas. Si un tema te supera (divisiones largas, fracciones), baja un nivel y vuelve en 2 lunas. Y si quieres compañía: 🧠 Estudio y 🧩 Memoria del mismo grupo Aprender.' }) +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="matGoCalc" class="btn btn-accent" style="width:auto">🧮 Ir a la calculadora →</button> <button type="button" id="matGoPract" class="btn" style="width:auto">🔢 Practicar 10 min →</button></div>' +
    '</div>' +

    /* CALC */
    '<div id="matCalc" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧮 Calculadora de bolsillo</h4>' +
    '<label class="mat-expr-label">Expresión <input type="text" id="matExpr" class="mat-expr" placeholder="ej: 2500*3 · 15000-19% · 10%3 (módulo)" autocomplete="off" inputmode="decimal"></label>' +
    '<div class="dlg-actions mat-calc-actions"><button type="button" id="matCalcGo" class="btn btn-accent" style="width:auto">Calcular</button><button type="button" id="matCalcClear" class="btn" style="width:auto">Limpiar</button></div>' +
    '<div id="matCalcRes" class="chip mat-calc-res">Escribe y calcula. % solo = porcentaje (50% → 0,5). Tras + o − usa el total (200+10% → 220).</div>' +
    '<div class="mat-calc-pad">' +
    ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '%', '+', '(', ')', 'C', '='].map(function (k) { var lbl = (k === 'C' ? '⌫' : k); var cls = 'btn mat-pad-btn' + ((k === '/' || k === '*' || k === '-' || k === '+' || k === '%' || k === '(' || k === ')') ? ' mat-op' : '') + (k === '=' ? ' btn-accent' : ''); return '<button type="button" class="' + cls + '" data-pad="' + k + '">' + lbl + '</button>'; }).join('') +
    '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📏 Porcentaje y regla de 3</h4>' +
    '<div class="conv-row"><label>% de <input type="number" id="matPctBase" placeholder="ej: 15000"></label><label>% <input type="number" id="matPctP" placeholder="ej: 19"></label><label style="align-self:flex-end"><button type="button" id="matPctGo" class="btn btn-accent" style="width:auto">%</button></label></div>' +
    '<div id="matPctRes" class="chip" style="display:block;white-space:normal">Ej: 19% de 15000 = 2850.</div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Si <input type="number" id="matR3a" placeholder="4 kg"></label><label>cuestan <input type="number" id="matR3b" placeholder="$6000"></label><label>¿cuánto <input type="number" id="matR3c" placeholder="7 kg">? </label><label style="align-self:flex-end"><button type="button" id="matR3Go" class="btn btn-accent" style="width:auto">Regla 3</button></label></div>' +
    '<div id="matR3Res" class="chip" style="display:block;white-space:normal">Proporción directa: (b×c)/a.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🍰 Fracciones + MCD/MCM + primos</h4>' +
    '<div class="conv-row"><label>a/b <input type="text" id="matFr1" placeholder="ej: 3/4"></label><label>op <select id="matFrOp"><option value="+">+</option><option value="-">−</option><option value="*">×</option><option value="/">÷</option></select></label><label>c/d <input type="text" id="matFr2" placeholder="ej: 1/2"></label><label style="align-self:flex-end"><button type="button" id="matFrGo" class="btn btn-accent" style="width:auto">=</button></label></div>' +
    '<div id="matFrRes" class="chip" style="display:block;white-space:normal">Ej: 3/4 + 1/2 = 5/4 = 1,25.</div>' +
    '<div class="conv-row" style="margin-top:8px"><label>N1 <input type="number" id="matMc1" placeholder="12"></label><label>N2 <input type="number" id="matMc2" placeholder="18"></label><label style="align-self:flex-end"><button type="button" id="matMcGo" class="btn" style="width:auto">MCD/MCM</button></label><label style="align-self:flex-end"><button type="button" id="matPrimoGo" class="btn" style="width:auto">¿Primo N1?</button></label></div>' +
    '<div id="matMcRes" class="chip" style="display:block;white-space:normal">MCD divide, MCM multiplica en común.</div></div>' +
    '</div>' +

    /* PRACT */
    '<div id="matPract" class="hidden">' +
    '<div class="menstrual-card mat-level-card" style="border-color:var(--gold)"><h4>🎚️ Mis niveles — elige tu desafío</h4>' +
    '<div id="matLvlXP" class="muted" style="font-size:11px;margin-bottom:6px">✨ 0 XP</div>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden;margin-bottom:8px"><div id="matLvlBar" style="width:0%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
    '<div class="mat-level-grid">' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="1"></button>' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="2"></button>' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="3"></button>' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="4"></button>' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="5"></button>' +
    '</div>' +
    '<div id="matLvlDesc" class="chip mat-calc-res" style="margin-top:8px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🔢 Quiz relámpago — cumple la meta y gana XP</h4>' +
    '<div class="conv-row"><label>Operación <select id="matQOp"><option value="todo">Todas del nivel</option><option value="+">Sumas</option><option value="-">Restas</option><option value="×">Multiplicación</option><option value="÷">División</option><option value="tablas">Tablas ×</option></select></label>' +
    '<label>Nivel <select id="matQNivel"><option value="1">1 🌱 Semilla (1–10)</option><option value="2">2 🌿 Brote (1–20)</option><option value="3">3 🌳 Árbol (1–30)</option><option value="4">4 🌙 Luna (1–50)</option><option value="5">5 ☀️ Kimche (1–100)</option></select></label>' +
    '<label>Tabla <select id="matQTabla"><option value="0">Al azar</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select></label></div>' +
    '<div class="conv-row"><label>Meta <select id="matQMeta"><option value="5">5 buenas</option><option value="10" selected>10 buenas</option><option value="20">20 buenas</option></select></label>' +
    '<label style="align-self:flex-end"><button type="button" id="matQNew" class="btn btn-accent" style="width:auto">🎲 Empezar / saltar</button></label></div>' +
    '<div id="matQTxt" style="font-size:14px;margin:8px 0">Elige nivel y toca “Empezar”.</div>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div id="matQBar" style="width:0%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Tu respuesta <input type="text" id="matQResp" inputmode="decimal" placeholder="número" autocomplete="off"></label><label style="align-self:flex-end"><button type="button" id="matQCheck" class="btn btn-accent" style="width:auto">Comprobar ⏎</button></label></div>' +
    '<div id="matQFb" class="muted" style="font-size:12px;min-height:20px"></div>' +
    '<div id="matQStats" class="muted" style="font-size:11px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4 id="matAdvTitle">🎯 Adivina el número (1–100)</h4>' +
    '<p class="muted" style="font-size:11px">Pienso uno según tu nivel, tú lo adivinas. Te digo “más alto / más bajo”. Ideal para lógica y paciencia.</p>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="matAdvNew" class="btn" style="width:auto">🎲 Nuevo juego</button></div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Tu intento <input type="number" id="matAdvIn" min="1" max="100" placeholder="1–100"></label><label style="align-self:flex-end"><button type="button" id="matAdvGo" class="btn btn-accent" style="width:auto">Probar</button></label></div>' +
    '<div id="matAdvFb" class="muted" style="font-size:12px"></div><div id="matAdvCount" class="muted" style="font-size:11px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Reto 13 lunas</h4>' +
    '<p class="muted" style="font-size:11px">¿Cuántos días hay en 13 lunas de 28 días? ¿Y en medio ciclo (13 × 14)? Escríbelo y comprueba en 🧮.</p>' +
    '<div class="conv-row"><label>13 × 28 = <input type="text" id="matReto" placeholder="tu respuesta"></label><label style="align-self:flex-end"><button type="button" id="matRetoGo" class="btn" style="width:auto">Comprobar</button></label></div>' +
    '<div id="matRetoFb" class="muted" style="font-size:12px"></div></div>' +
    '</div>' +

    /* GEO */
    '<div id="matGeo" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📐 Áreas y perímetros</h4>' +
    '<div class="conv-row"><label>Figura <select id="matGeoFig"><option value="cuad">Cuadrado (lado)</option><option value="rect">Rectángulo (base × alto)</option><option value="tri">Triángulo (base × altura)</option><option value="circ">Círculo (radio)</option></select></label>' +
    '<label>A / base / lado / radio <input type="number" id="matGeoA" placeholder="ej: 5" step="any"></label>' +
    '<label>B / alto (si pide) <input type="number" id="matGeoB" placeholder="ej: 3" step="any"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="matGeoGo" class="btn btn-accent" style="width:auto">Calcular</button></div>' +
    '<div id="matGeoRes" class="chip" style="display:block;white-space:normal">Ej: cuadrado lado 5 → área 25, perímetro 20.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🧊 Volúmenes + Pitágoras</h4>' +
    '<div class="conv-row"><label>Cubo (arista) <input type="number" id="matCub" placeholder="ej: 2" step="any"></label><label style="align-self:flex-end"><button type="button" id="matCubGo" class="btn" style="width:auto">Cubo</button></label></div>' +
    '<div class="conv-row"><label>Cilindro r <input type="number" id="matCilR" placeholder="ej: 1" step="any"></label><label>h <input type="number" id="matCilH" placeholder="ej: 3" step="any"></label><label style="align-self:flex-end"><button type="button" id="matCilGo" class="btn" style="width:auto">Cilindro</button></label></div>' +
    '<div class="conv-row"><label>Cateto a <input type="number" id="matPitA" placeholder="3" step="any"></label><label>Cateto b <input type="number" id="matPitB" placeholder="4" step="any"></label><label style="align-self:flex-end"><button type="button" id="matPitGo" class="btn" style="width:auto">Hipotenusa</button></label></div>' +
    '<div id="matVolRes" class="chip" style="display:block;white-space:normal">3-4-5 es el triángulo más famoso: 3²+4²=5².</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🏡 Mi terreno / pieza (Penco)</h4>' +
    '<div class="conv-row"><label>Largo (m) <input type="number" id="matTerL" placeholder="ej: 12" step="any"></label><label>Ancho (m) <input type="number" id="matTerA" placeholder="ej: 8" step="any"></label><label style="align-self:flex-end"><button type="button" id="matTerGo" class="btn btn-accent" style="width:auto">Medir</button></label></div>' +
    '<div class="conv-row"><label>Rendimiento pintura (m²/L) <input type="number" id="matPinR" value="10" step="any"></label><label>Manos <input type="number" id="matPinM" value="2" min="1" max="4"></label><label style="align-self:flex-end"><button type="button" id="matPinGo" class="btn" style="width:auto">🎨 Pintura muros (perímetro × 2,4m)</button></label></div>' +
    '<div id="matTerRes" class="chip" style="display:block;white-space:normal">Te da m², perímetro (cerco) y litros de pintura estimados.</div></div>' +
    '</div>' +

    /* HOGAR */
    '<div id="matHogar" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🍲 Escalar receta</h4>' +
    '<div class="conv-row"><label>Porciones receta <input type="number" id="matRecBase" placeholder="ej: 4"></label><label>Quiero <input type="number" id="matRecQuiero" placeholder="ej: 6"></label><label>Cantidad ingrediente <input type="number" id="matRecCant" placeholder="ej: 2 tazas" step="any"></label><label style="align-self:flex-end"><button type="button" id="matRecGo" class="btn btn-accent" style="width:auto">Escalar</button></label></div>' +
    '<div id="matRecRes" class="chip" style="display:block;white-space:normal">Factor = quiero / base. Multiplica cada ingrediente.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🏷️ Descuento y precio con IVA</h4>' +
    '<div class="conv-row"><label>Precio <input type="number" id="matDescP" placeholder="ej: 20000"></label><label>Descuento % <input type="number" id="matDescD" placeholder="ej: 15"></label><label style="align-self:flex-end"><button type="button" id="matDescGo" class="btn btn-accent" style="width:auto">Aplicar</button></label></div>' +
    '<div class="conv-row"><label>Neto (sin IVA) <input type="number" id="matIvaN" placeholder="ej: 10000"></label><label style="align-self:flex-end"><button type="button" id="matIvaGo" class="btn" style="width:auto">+19% IVA</button></label></div>' +
    '<div id="matDescRes" class="chip" style="display:block;white-space:normal">IVA Chile 19%: total = neto × 1,19.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>💰 Interés simple + dividir cuentas</h4>' +
    '<div class="conv-row"><label>Capital $ <input type="number" id="matIntC" placeholder="ej: 100000"></label><label>Tasa % mensual <input type="number" id="matIntT" placeholder="ej: 2" step="any"></label><label>Meses <input type="number" id="matIntM" placeholder="ej: 6"></label><label style="align-self:flex-end"><button type="button" id="matIntGo" class="btn" style="width:auto">Interés</button></label></div>' +
    '<div class="conv-row"><label>Total a dividir $ <input type="number" id="matDivT" placeholder="ej: 45000"></label><label>Personas <input type="number" id="matDivP" placeholder="ej: 3"></label><label style="align-self:flex-end"><button type="button" id="matDivGo" class="btn" style="width:auto">Dividir</button></label></div>' +
    '<div id="matIntRes" class="chip" style="display:block;white-space:normal">Interés simple: I = C × i × t. Dividir: total / personas.</div>' +
    '<p class="muted" style="font-size:11px;margin-top:8px">Puentes: 💰 Finanzas para tu presupuesto, 📏 Conversión para unidades y ⚡ Consumo eléctrico para kWh. Encuéntralos con 🔍 Buscar.</p></div>' +
    '</div>' +

    /* AVA */
    '<div id="matAva" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📓 Mi avance matemático</h4>' +
    '<div class="conv-row"><label style="flex:2">¿Qué practiqué hoy? <input type="text" id="matLogTxt" placeholder="ej: tablas del 7, 8/10 buenas" maxlength="80"></label><label style="align-self:flex-end"><button type="button" id="matLogAdd" class="btn btn-accent" style="width:auto">+ Guardar</button></label></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="matAvaStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px"><button type="button" id="matAvaShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="matAvaClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '<div id="matAvaBox" class="habits-list" style="margin-top:10px;max-height:300px"></div>' +
    '</div>';

  makeDialog('matematicasDialog', '🔢 Matemáticas — pensar con las manos',
    'Calcula, practica y mide para la vida real pencona: feria, recetas, terreno y mente. Todo queda <b>privado y local</b> por usuario, 100% offline.',
    body);
}

function parseFrac(t) {
  var s = String(t || '').trim().replace(',', '.');
  var m = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) {
    var n = parseFloat(s);
    if (!isFinite(n)) return null;
    return { n: n, d: 1 };
  }
  var a = parseFloat(m[1]), b = parseFloat(m[2]);
  if (!isFinite(a) || !isFinite(b) || b === 0) return null;
  return { n: a, d: b };
}

/* ---------------- BINDINGS ---------------- */
function bindAll() {
  var on = function (id, fn) { var el = $(id); if (el) el.onclick = fn; };

  on('matGoCalc', function () { switchTab('Calc'); });
  on('matGoPract', function () { switchTab('Pract'); try { paintLevels(); if (!Q.asked) { var s0 = curQSel(); qNew(s0.op, s0.niv, s0.tabla); } else paintQ(); } catch (eG) {} });
  ['Guia', 'Calc', 'Pract', 'Geo', 'Hogar', 'Ava'].forEach(function (t) {
    on('tabMat' + t, function () {
      switchTab(t);
      if (t === 'Ava') renderAva();
      if (t === 'Pract') { try { paintLevels(); if (!Q.asked) { var sP = curQSel(); qNew(sP.op, sP.niv, sP.tabla); } } catch (eP) {} }
    });
  });

  /* calc expr + pad */
  var calcGo = function () {
    var src = ($('matExpr') || {}).value || '';
    var box = $('matCalcRes');
    try {
      var v = evalExpr(src);
      if (box) { box.textContent = src + ' = ' + fmtSmart(v); }
    } catch (e) { if (box) box.textContent = '⚠️ Revisa: ' + (e.message || 'expresión inválida') + '. Ej válido: (2500*3)+1500/2 · con %: 15000-19%'; }
  };
  on('matCalcGo', calcGo);
  on('matCalcClear', function () { if ($('matExpr')) $('matExpr').value = ''; if ($('matCalcRes')) $('matCalcRes').textContent = 'Escribe y calcula. % solo = porcentaje (50% → 0,5). Tras + o − usa el total.'; });
  document.querySelectorAll('#matematicasDialog [data-pad]').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-pad');
      var inp = $('matExpr');
      if (!inp) return;
      if (k === 'C') inp.value = inp.value.slice(0, -1);
      else if (k === '=') calcGo();
      else inp.value += k;
      try { inp.focus(); } catch (e) {}
    };
  });
  var expr = $('matExpr');
  if (expr && !expr.dataset.enter) { expr.dataset.enter = '1'; expr.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); calcGo(); } }); }

  /* % y regla 3 */
  on('matPctGo', function () {
    var base = num(($('matPctBase') || {}).value), p = num(($('matPctP') || {}).value);
    var box = $('matPctRes');
    if (!isFinite(base) || !isFinite(p)) { if (box) box.textContent = '⚠️ Escribe base y %.'; return; }
    if (box) box.textContent = fmt(p, 2) + '% de ' + fmt(base, 2) + ' = ' + fmt(base * p / 100, 2);
  });
  on('matR3Go', function () {
    var a = num(($('matR3a') || {}).value), b = num(($('matR3b') || {}).value), c = num(($('matR3c') || {}).value);
    var box = $('matR3Res');
    if (!isFinite(a) || !isFinite(b) || !isFinite(c) || a === 0) { if (box) box.textContent = '⚠️ Completa los 3 valores (el primero no puede ser 0).'; return; }
    if (box) box.textContent = 'Si ' + a + ' → ' + b + ', entonces ' + c + ' → ' + fmt(b * c / a, 2);
  });

  /* fracciones / mcd */
  on('matFrGo', function () {
    var f1 = parseFrac(($('matFr1') || {}).value), f2 = parseFrac(($('matFr2') || {}).value);
    var op = ($('matFrOp') || {}).value || '+';
    var box = $('matFrRes');
    if (!f1 || !f2) { if (box) box.textContent = '⚠️ Usa formato a/b, ej: 3/4 y 1/2.'; return; }
    var n, d;
    if (op === '+') { n = f1.n * f2.d + f2.n * f1.d; d = f1.d * f2.d; }
    else if (op === '-') { n = f1.n * f2.d - f2.n * f1.d; d = f1.d * f2.d; }
    else if (op === '*') { n = f1.n * f2.n; d = f1.d * f2.d; }
    else { if (f2.n === 0) { if (box) box.textContent = '⚠️ No se puede dividir por cero.'; return; } n = f1.n * f2.d; d = f1.d * f2.n; }
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    var ns = Math.round(n / g), ds = Math.round(d / g);
    if (box) box.textContent = 'Resultado: ' + n + '/' + d + ' = ' + ns + '/' + ds + ' = ' + fmt(ns / ds, 4);
  });
  on('matMcGo', function () {
    var a = num(($('matMc1') || {}).value), b = num(($('matMc2') || {}).value);
    var box = $('matMcRes');
    if (!isFinite(a) || !isFinite(b)) { if (box) box.textContent = '⚠️ Escribe N1 y N2 enteros.'; return; }
    if (box) box.textContent = 'MCD(' + a + ',' + b + ') = ' + gcd(a, b) + ' · MCM = ' + lcm(a, b);
  });
  on('matPrimoGo', function () {
    var a = num(($('matMc1') || {}).value);
    var box = $('matMcRes');
    if (!isFinite(a)) { if (box) box.textContent = '⚠️ Escribe N1.'; return; }
    if (box) box.textContent = Math.round(a) + (esPrimo(a) ? ' SÍ es primo ✅' : ' NO es primo (se puede dividir)');
  });

  /* quiz + niveles */
  var syncNivel = function (id) {
    var sel = $('matQNivel');
    if (sel) sel.value = String(id);
    try { store().stats.nivel = id; save(); } catch (e) {}
    try { paintLevels(); } catch (e2) {}
    Q.ok = 0; Q.total = 0; Q.racha = 0;
    Q.meta = parseInt((($('matQMeta') || {}).value || '10'), 10) || 10;
    try {
      var sN = curQSel();
      qNew(sN.op === 'tablas' ? 'tablas' : sN.op, String(id), sN.tabla);
      if ($('matQFb')) { $('matQFb').textContent = ''; }
    } catch (eN) { paintQ(); }
    advNuevo();
  };
  document.querySelectorAll('#matematicasDialog [data-lvl]').forEach(function (b) {
    b.onclick = function () {
      var id = parseInt(b.getAttribute('data-lvl'), 10) || 1;
      if (!lvlUnlocked(id)) {
        var xp0 = 0; try { xp0 = store().stats.xp || 0; } catch (e) {}
        alert('🔒 Nivel ' + id + ' (' + LEVELS[id - 1].nombre + ') se desbloquea con ' + LEVELS[id - 1].req + ' XP. Llevas ' + xp0 + ' XP. ¡Sigue practicando! 💪');
        return;
      }
      syncNivel(id);
      try { $('matQResp').focus(); } catch (eF) {}
    };
  });
  var qn = $('matQNivel');
  if (qn && !qn.dataset.lvl) {
    qn.dataset.lvl = '1';
    qn.addEventListener('change', function () {
      var id = parseInt(qn.value, 10) || 1;
      if (!lvlUnlocked(id)) {
        var xp1 = 0; try { xp1 = store().stats.xp || 0; } catch (e) {}
        alert('🔒 Ese nivel pide ' + lvlCfg(id).req + ' XP (llevas ' + xp1 + '). Te dejo en tu nivel actual.');
        try { qn.value = String(store().stats.nivel || lvlActual()); } catch (e2) {}
        paintLevels();
        return;
      }
      syncNivel(id);
    });
  }
  try {
    var initLvl = (store().stats.nivel || lvlActual());
    if (!lvlUnlocked(initLvl)) initLvl = lvlActual();
    if ($('matQNivel')) $('matQNivel').value = String(initLvl);
    Q.nivel = initLvl;
  } catch (eI) {}
  on('matQNew', function () {
    var op = ($('matQOp') || {}).value || 'todo';
    var niv = ($('matQNivel') || {}).value || '1';
    if (!lvlUnlocked(parseInt(niv, 10) || 1)) { alert('🔒 Nivel bloqueado: gana más XP primero.'); return; }
    Q.meta = parseInt(($('matQMeta') || {}).value, 10) || 10;
    Q.ok = 0; Q.total = 0; Q.racha = 0;
    var tf = parseInt(($('matQTabla') || {}).value, 10) || 0;
    qNew(op === 'tablas' ? 'tablas' : op, niv, tf);
    if ($('matQFb')) { $('matQFb').textContent = ''; }
    try { $('matQResp').focus(); } catch (e) {}
  });
  /* Cambiar operación/tabla/meta arranca ronda fresca (evita preguntas viejas) */
  ['matQOp', 'matQTabla'].forEach(function (sid) {
    var el = $(sid);
    if (el && !el.dataset.fresh) {
      el.dataset.fresh = '1';
      el.addEventListener('change', function () {
        try {
          Q.meta = parseInt((($('matQMeta') || {}).value || '10'), 10) || 10;
          Q.ok = 0; Q.total = 0; Q.racha = 0;
          var s = curQSel();
          qNew(s.op === 'tablas' ? 'tablas' : s.op, s.niv, s.tabla);
          if ($('matQFb')) $('matQFb').textContent = '';
        } catch (eC) {}
      });
    }
  });
  var qm = $('matQMeta');
  if (qm && !qm.dataset.fresh) {
    qm.dataset.fresh = '1';
    qm.addEventListener('change', function () {
      Q.meta = parseInt(qm.value, 10) || 10;
      Q.ok = 0; Q.total = 0; Q.racha = 0;
      paintQ();
    });
  }
  on('matQCheck', qCheck);
  var qi = $('matQResp');
  if (qi && !qi.dataset.enter) { qi.dataset.enter = '1'; qi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); qCheck(); } }); }

  /* adivinanza (rango según nivel + XP) */
  on('matAdvNew', advNuevo);
  on('matAdvGo', function () {
    if (!ADV.jugando) advNuevo();
    var mx = ADV.max || 100;
    var v = parseInt(($('matAdvIn') || {}).value, 10);
    var fb = $('matAdvFb'), ct = $('matAdvCount');
    if (!v || v < 1 || v > mx) { if (fb) fb.textContent = 'Escribe un número del 1 al ' + mx + ' (según tu nivel).'; return; }
    ADV.intentos++;
    if (ct) ct.textContent = 'Intentos: ' + ADV.intentos;
    if (v === ADV.n) {
      var g2 = Math.max(5, 30 - ADV.intentos);
      if (fb) { fb.textContent = '🎉 ¡Adivinaste! Era el ' + ADV.n + ' en ' + ADV.intentos + ' intentos. +' + g2 + ' XP'; fb.style.color = '#8fd694'; }
      ADV.jugando = false;
      var m = store(); var hoy = todayKey();
      m.stats.xp = (m.stats.xp || 0) + g2;
      m.logs.push({ id: uid('mt'), fecha: hoy, tipo: 'adivinanza', detalle: '1–' + mx + ' adivinado en ' + ADV.intentos + ' intentos · +' + g2 + ' XP', ok: 1, total: ADV.intentos });
      save('¡Adivinaste! +' + g2 + ' XP 🎯'); renderAva();
      try { paintLevels(); } catch (eP) {}
    } else if (v < ADV.n) { if (fb) { fb.textContent = 'Más alto ⬆️ (llevas ' + ADV.intentos + ')'; fb.style.color = ''; } }
    else { if (fb) { fb.textContent = 'Más bajo ⬇️ (llevas ' + ADV.intentos + ')'; fb.style.color = ''; } }
    if ($('matAdvIn')) $('matAdvIn').value = '';
  });

  /* reto 13 lunas (acepta ciclo completo y medio ciclo) */
  on('matRetoGo', function () {
    var v = num(($('matReto') || {}).value);
    var fb = $('matRetoFb');
    if (!isFinite(v)) { if (fb) fb.textContent = 'Escribe tu respuesta.'; return; }
    if (fb) {
      if (Math.abs(v - 364) < 1e-9) fb.textContent = '✅ ¡Exacto! 13 × 28 = 364 días. El día 365 es el Día Fuera del Tiempo.';
      else if (Math.abs(v - 182) < 1e-9) fb.textContent = '✅ ¡Bien! Medio ciclo = 13 × 14 = 182 días. ¿Y el ciclo completo? (13 × 28)';
      else fb.textContent = 'Casi… calcula 13 × 28 en 🧮 (pista: 10×28 + 3×28). Medio ciclo sería 13 × 14.';
    }
  });

  /* geometría */
  on('matGeoGo', function () {
    var f = ($('matGeoFig') || {}).value, a = num(($('matGeoA') || {}).value), b = num(($('matGeoB') || {}).value);
    var box = $('matGeoRes');
    if (!isFinite(a) || a <= 0) { if (box) box.textContent = '⚠️ Escribe una medida mayor que 0.'; return; }
    var t = '';
    if (f === 'cuad') t = 'Cuadrado lado ' + a + ' → área ' + fmt(a * a) + ' · perímetro ' + fmt(4 * a);
    else if (f === 'rect') { if (!isFinite(b) || b <= 0) { if (box) box.textContent = '⚠️ El rectángulo necesita base y alto.'; return; } t = 'Rectángulo ' + a + '×' + b + ' → área ' + fmt(a * b) + ' · perímetro ' + fmt(2 * (a + b)); }
    else if (f === 'tri') { if (!isFinite(b) || b <= 0) { if (box) box.textContent = '⚠️ El triángulo necesita base y altura.'; return; } t = 'Triángulo base ' + a + ' altura ' + b + ' → área ' + fmt(a * b / 2); }
    else { t = 'Círculo radio ' + a + ' → área ' + fmt(Math.PI * a * a) + ' · perímetro ' + fmt(2 * Math.PI * a); }
    if (box) box.textContent = t + ' (mismo brow: usa metros con metros).';
  });
  on('matCubGo', function () {
    var a = num(($('matCub') || {}).value); var box = $('matVolRes');
    if (!isFinite(a) || a <= 0) { if (box) box.textContent = '⚠️ Escribe la arista del cubo.'; return; }
    if (box) box.textContent = 'Cubo arista ' + a + ' → volumen ' + fmt(a * a * a) + ' · útil para estanques y cajones.';
  });
  on('matCilGo', function () {
    var r = num(($('matCilR') || {}).value), h = num(($('matCilH') || {}).value); var box = $('matVolRes');
    if (!isFinite(r) || !isFinite(h) || r <= 0 || h <= 0) { if (box) box.textContent = '⚠️ El cilindro necesita radio y altura.'; return; }
    if (box) box.textContent = 'Cilindro r=' + r + ' h=' + h + ' → volumen ' + fmt(Math.PI * r * r * h) + ' · ×1000 = litros.';
  });
  on('matPitGo', function () {
    var a = num(($('matPitA') || {}).value), b = num(($('matPitB') || {}).value); var box = $('matVolRes');
    if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) { if (box) box.textContent = '⚠️ Escribe ambos catetos.'; return; }
    if (box) box.textContent = 'Hipotenusa = √(' + a + '²+' + b + '²) = ' + fmt(Math.sqrt(a * a + b * b)) + '. Útil para escuadrar un cerco.';
  });
  on('matTerGo', function () {
    var l = num(($('matTerL') || {}).value), a = num(($('matTerA') || {}).value); var box = $('matTerRes');
    if (!isFinite(l) || !isFinite(a) || l <= 0 || a <= 0) { if (box) box.textContent = '⚠️ Escribe largo y ancho en metros.'; return; }
    if (box) box.textContent = 'Terreno ' + l + '×' + a + ' → ' + fmt(l * a) + ' m² · cerco perimetral ' + fmt(2 * (l + a)) + ' m (+10% despunte = ' + fmt(2 * (l + a) * 1.1) + ' m a comprar).';
  });
  on('matPinGo', function () {
    var l = num(($('matTerL') || {}).value), a = num(($('matTerA') || {}).value);
    var r = num(($('matPinR') || {}).value) || 10, m2 = parseInt(($('matPinM') || {}).value, 10) || 2;
    var box = $('matTerRes');
    if (!isFinite(l) || !isFinite(a) || l <= 0 || a <= 0) { if (box) box.textContent = '⚠️ Primero escribe largo y ancho arriba.'; return; }
    var muros = 2 * (l + a) * 2.4;
    if (box) box.textContent = 'Muros ≈ ' + fmt(muros) + ' m² → ' + fmt(muros * m2 / r) + ' L para ' + m2 + ' manos (rinde ' + r + ' m²/L). Descuenta puertas/ventanas a ojo (−10%).';
  });

  /* hogar */
  on('matRecGo', function () {
    var base = num(($('matRecBase') || {}).value), q = num(($('matRecQuiero') || {}).value), c = num(($('matRecCant') || {}).value);
    var box = $('matRecRes');
    if (!isFinite(base) || !isFinite(q) || !isFinite(c) || base <= 0) { if (box) box.textContent = '⚠️ Completa porciones base, deseadas y cantidad.'; return; }
    var f = q / base;
    if (box) box.textContent = 'Factor ×' + fmt(f, 3) + ' → ese ingrediente pasa de ' + c + ' a ' + fmt(c * f, 2) + '. Repite con cada ingrediente.';
  });
  on('matDescGo', function () {
    var p = num(($('matDescP') || {}).value), d = num(($('matDescD') || {}).value);
    var box = $('matDescRes');
    if (!isFinite(p) || !isFinite(d)) { if (box) box.textContent = '⚠️ Escribe precio y % descuento.'; return; }
    if (box) box.textContent = '$' + fmt(p, 0) + ' con ' + d + '% dcto → pagas $' + fmt(p * (1 - d / 100), 0) + ' (ahorras $' + fmt(p * d / 100, 0) + ').';
  });
  on('matIvaGo', function () {
    var n2 = num(($('matIvaN') || {}).value); var box = $('matDescRes');
    if (!isFinite(n2)) { if (box) box.textContent = '⚠️ Escribe el neto.'; return; }
    if (box) box.textContent = 'Neto $' + fmt(n2, 0) + ' + IVA 19% → total $' + fmt(n2 * 1.19, 0) + '.';
  });
  on('matIntGo', function () {
    var c = num(($('matIntC') || {}).value), t = num(($('matIntT') || {}).value), m2 = num(($('matIntM') || {}).value);
    var box = $('matIntRes');
    if (!isFinite(c) || !isFinite(t) || !isFinite(m2)) { if (box) box.textContent = '⚠️ Completa capital, tasa y meses.'; return; }
    var i = c * (t / 100) * m2;
    if (box) box.textContent = 'Interés simple: $' + fmt(i, 0) + ' → devuelves $' + fmt(c + i, 0) + ' en ' + m2 + ' meses. Ojo: el interés compuesto y CAE encarecen más.';
  });
  on('matDivGo', function () {
    var t = num(($('matDivT') || {}).value), p = num(($('matDivP') || {}).value);
    var box = $('matIntRes');
    if (!isFinite(t) || !isFinite(p) || p <= 0) { if (box) box.textContent = '⚠️ Escribe total y personas.'; return; }
    if (box) box.textContent = '$' + fmt(t, 0) + ' entre ' + p + ' → $' + fmt(t / p, 0) + ' c/u. En trueque: equivale a ' + fmt(t / p, 0) + ' en productos por persona.';
  });

  /* avance */
  on('matLogAdd', function () {
    var t = clean((($('matLogTxt') || {}).value || '').trim(), 80);
    if (!t) return alert('Escribe qué practicaste hoy');
    store().logs.push({ id: uid('mt'), fecha: ($('matLogFecha') || {}).value || todayKey(), tipo: 'nota', detalle: t, ok: 0, total: 0 });
    save('Avance guardado 🔢');
    if ($('matLogTxt')) $('matLogTxt').value = '';
    renderAva();
  });
  on('matAvaShare', function () {
    var m = store();
    if (!m.logs.length && !(m.stats.played || 0)) return alert('Sin avance aún: juega una partida primero');
    var cur2 = lvlActual();
    share('🔢 Mi avance matemático', 'Nivel ' + cur2 + '/5 ' + LEVELS[cur2 - 1].ico + ' ' + LEVELS[cur2 - 1].nombre + ' · XP ' + (m.stats.xp || 0) + ' · Partidas: ' + (m.stats.played || 0) + ' · Mejor: ' + (m.stats.best || 0) + ' · Racha: ' + (m.stats.streak || 0) + ' días\n' +
      m.logs.slice(-10).map(function (r) { return '• ' + r.fecha + ' · ' + r.detalle; }).join('\n'));
  });
  on('matAvaClear', function () {
    if (!confirm('¿Borrar tu bitácora matemática? (se mantienen guías)')) return;
    try { var u = userData(); if (u && u.matematicas) { u.matematicas.logs = []; u.matematicas.stats = { played: 0, best: 0, streak: 0, lastDay: '', xp: 0, stars: {}, nivel: 1 }; } } catch (e) {}
    Q.ok = 0; Q.total = 0; Q.racha = 0; Q.a = null; Q.b = null; Q.asked = false;
    save(); renderAva(); paintQ();
    try { paintLevels(); advNuevo(); var sC = curQSel(); qNew(sC.op, '1', 0); if ($('matQFb')) $('matQFb').textContent = ''; } catch (eP) {}
  });
}

/* ---------------- SETUP ---------------- */
function addKw(id, extra) {
  try { var b = $(id); if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) b.dataset.keywords += ' ' + extra; } catch (e) {}
}
function setup() {
  /* 1) inyectar botón en Aprender > Estudio (junto a Estudio/Memoria/Idiomas) */
  try {
    var existing = $('btnMatematicas');
    if (existing) {
      try { existing.setAttribute('data-sub', 'estudio'); } catch (eS) {}
    }
    if (!existing) {
      var g = document.querySelector('.action-group[data-group="aprender"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnMatematicas'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🔢 Matemáticas';
        try { btn.setAttribute('data-sub', 'estudio'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'matematicas calculo calculadora porcentaje fraccion geometria area perimetro volumen pitagoras tablas multiplicar sumar restar dividir quiz practica numeros mapuzugun interes descuento iva receta escala terreno pintura');
        var ref = g.querySelector('#btnGuitar') || g.querySelector('#btnEnglish');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else if (ref) g.appendChild(btn);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + orden aprender|estudio + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnMatematicas') < 0) ALL_BTNS.push('btnMatematicas');
  } catch (e2) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnMatematicas = ['aprender', 'estudio'];
  } catch (e3) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['aprender|estudio'] && BTN_ORDER['aprender|estudio'].indexOf('btnMatematicas') < 0) {
      BTN_ORDER['aprender|estudio'].push('btnMatematicas');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente' || p === 'infantil')) PRESETS[p].btnMatematicas = true;
      });
    }
  } catch (e5) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e6) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e7) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e8) {}
  /* 3) checkbox en configDialog (grupo Aprender) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnMatematicas"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Aprender') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnMatematicas"> 🔢 Matemáticas';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnMatematicas !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnMatematicas = lab.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e9) {}
            };
          } catch (e10) {}
        }
      });
    }
  } catch (e11) {}

  /* 4) diálogo + bindings (solo se construye una vez: evita borrar la ronda en curso) */
  if (!setup._built) {
    buildDialog();
    bindAll();
    setup._built = true;
  } else {
    try { bindAll(); } catch (eB) {}
  }
  renderAva();
  try { paintLevels(); } catch (ePL) {}
  paintQ();
  if (!Q.asked) { try { var sI = curQSel(); qNew(sI.op, sI.niv, sI.tabla); } catch (eQ) {} }
  advNuevo();

  var b = $('btnMatematicas');
  if (!b) { if ((setup._r = (setup._r || 0) + 1) < 60) setTimeout(setup, 500); return; }
  if (!b.dataset.mtk) {
    b.dataset.mtk = '1';
    b.addEventListener('click', function () {
      switchTab('Guia'); renderAva();
      openDlg('matematicasDialog');
      try { paintLevels(); paintQ(); if (!Q.asked) { var sO = curQSel(); qNew(sO.op, sO.niv, sO.tabla); } } catch (ePP) {}
    });
  }
  /* puentes de descubrimiento */
  try {
    addKw('btnStudy', 'matematicas calculo geometria fracciones quiz');
    addKw('btnMemory', 'matematicas numeros tablas calculo');
    addKw('btnConvert', 'matematicas calculadora porcentaje regla3 geometria');
    addKw('btnFinance', 'matematicas porcentaje iva descuento interes');
  } catch (e12) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
