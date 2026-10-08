/* ============================================================
   MATEMATICAS — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa dentro de Aprender, Crear y Jugar > Estudio:
   - Botón btnMatematicas (inyectado en grupo aprender, sub estudio)
    - Diálogo matematicasDialog con 9 pestañas:
      1) 📖 Guía (método sin miedo + números mapuzugun + luna)
      2) 🧮 Calculadora (expresión segura + % + regla de 3 +
          fracciones + MCD/MCM + primos)
      3) 🔢 Práctica (quiz 10 niveles + tablas + adivinanza +
         reto 13×28: 1 Semilla · 2 Brote · 3 Árbol · 4 Luna ·
         5 Kimche · 6 Lafken fracciones · 7 Pewen % ·
         8 Kuyam geometría · 9 Wenu potencias · 10 Newen total)
      4) 📐 Geometría y medidas (áreas, volúmenes, Pitágoras,
          terreno y pintura Penco)
      5) 🏠 Mates del hogar (receta, descuento/IVA, interés
          simple, cuentas y trueque)
      6) 📚 Básica (1°–8° Chile: números, 4 operaciones,
          fracciones, decimales, %, geometría + quiz con XP)
      7) 🎒 Media (I–IV: ecuaciones, funciones, potencias,
          trigonometría, distancia/pendiente, prob + quiz XP)
      8) 🎓 Superior (derivadas, integrales, matrices 2×2,
          interés compuesto, estadística, lógica + quiz XP)
      9) 📓 Mi avance (racha, stats, bitácora privada, metas)
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
  ['Guia', 'Calc', 'Pract', 'Geo', 'Hogar', 'Bas', 'Med', 'Sup', 'Ava'].forEach(function (x) {
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
   10 niveles progresivos (XP + estrellas + desbloqueo):
   1 🌱 Semilla · 2 🌿 Brote · 3 🌳 Árbol · 4 🌙 Luna · 5 ☀️ Kimche ·
   6 🌊 Lafken · 7 ⛰️ Pewen · 8 🦉 Kuyam · 9 🌌 Wenu · 10 🔥 Newen */
var LEVELS = [
  { id: 1, ico: '🌱', nombre: 'Semilla', rango: '1–10', ops: ['+', '-'], max: 10, req: 0, tablas: null, advMax: 20, desc: 'Sumas y restas del 1 al 10, sin apuro. Para partir de cero y tomar confianza.' },
  { id: 2, ico: '🌿', nombre: 'Brote', rango: '1–20', ops: ['+', '-', '×'], max: 20, req: 60, tablas: [2, 3, 5], advMax: 50, desc: 'Sumas y restas hasta 20 + tablas del 2, 3 y 5. Como calcular la feria chica.' },
  { id: 3, ico: '🌳', nombre: 'Árbol', rango: '1–30', ops: ['+', '-', '×', '÷'], max: 30, req: 150, tablas: [2, 3, 4, 5, 6, 7, 8, 9], advMax: 100, desc: 'Multiplicación y división de verdad + todas las tablas. Las restas ya pueden dar negativo.' },
  { id: 4, ico: '🌙', nombre: 'Luna', rango: '1–50', ops: ['+', '-', '×', '÷'], max: 50, req: 300, tablas: null, advMax: 100, desc: 'Operaciones mixtas hasta 50. Puente a % y fracciones fáciles + regla de 3.' },
  { id: 5, ico: '☀️', nombre: 'Kimche', rango: '1–100', ops: ['+', '-', '×', '÷'], max: 100, req: 500, tablas: null, advMax: 100, desc: 'Nivel sabio base: todo mezclado hasta 100 + geometría, IVA, interés y reto 13 lunas.' },
  { id: 6, ico: '🌊', nombre: 'Lafken', rango: 'fracciones', ops: ['+', '-', '×', '÷'], max: 100, req: 800, tablas: null, advMax: 200, modo: 'fraccion', desc: 'Mar de fracciones y decimales: 1/2 + 1/4, 3/4 de algo, 0,5 + 0,25. Ideal para recetas y repartos.' },
  { id: 7, ico: '⛰️', nombre: 'Pewen', rango: '% y proporción', ops: ['+', '-', '×', '÷'], max: 200, req: 1200, tablas: null, advMax: 200, modo: 'porcentaje', desc: 'Montaña del porcentaje: 10%, 25%, 50% mentales + descuentos, IVA y regla de 3. Para feria y negocio.' },
  { id: 8, ico: '🦉', nombre: 'Kuyam', rango: 'geometría', ops: ['+', '-', '×', '÷'], max: 200, req: 1700, tablas: null, advMax: 200, modo: 'geometria', desc: 'Ojo de búho que mide: áreas y perímetros mentales (cuadrado, rectángulo, triángulo, círculo) + volúmenes.' },
  { id: 9, ico: '🌌', nombre: 'Wenu', rango: 'potencias', ops: ['+', '-', '×', '÷'], max: 200, req: 2300, tablas: null, advMax: 300, modo: 'potencia', desc: 'Cielo de potencias y raíces: cuadrados, cubos, √ exacta y ecuaciones tipo x + 7 = 15. Puerta al álgebra.' },
  { id: 10, ico: '🔥', nombre: 'Newen', rango: '1–200 total', ops: ['+', '-', '×', '÷'], max: 200, req: 3000, tablas: null, advMax: 500, modo: 'mixto', desc: 'Fuerza total: TODO mezclado hasta 200 + fracciones, %, geometría y potencias. El desafío del sabio penquén.' }
];
function lvlCfg(n) {
  var id = parseInt(n, 10);
  if (!isFinite(id)) {
    /* compatibilidad con Nivel antiguo: facil/medio/dificil */
    if (n === 'facil') id = 1; else if (n === 'medio') id = 2; else if (n === 'dificil') id = 4; else id = 1;
  }
  if (id < 1) id = 1; if (id > LEVELS.length) id = LEVELS.length;
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
  if (txt) txt.textContent = '✨ ' + xp + ' XP · nivel actual ' + lvlActual() + '/' + LEVELS.length + (nextReq ? ' · te faltan ' + (nextReq - xp) + ' XP para el siguiente' : ' · ¡nivel máximo! 🎉');
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
var Q = { a: null, b: null, op: '+', txt: '', ans: null, ok: 0, total: 0, racha: 0, meta: 10, timer: null, seg: 0, tabla: 0, nivel: 1, asked: false };
function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
/* --- Generadores especiales para niveles 6-10 (respuesta siempre exacta, sin decimales eternos) --- */
function qEspecial(modo, cfg) {
  var r;
  if (modo === 'fraccion') {
    var dens = [2, 3, 4, 5, 6, 8, 10];
    var kind = pick(['suma', 'suma', 'resta', 'mitad', 'decimal']);
    if (kind === 'decimal') {
      var decs = [[0.5, '1/2'], [0.25, '1/4'], [0.75, '3/4'], [0.2, '1/5'], [0.1, '1/10']];
      var d = pick(decs);
      var e = pick(decs);
      return { txt: d[0] + ' + ' + e[0] + ' <span class="muted">(piensa en ' + d[1] + ' + ' + e[1] + ')</span>', ans: Math.round((d[0] + e[0]) * 100) / 100 };
    }
    if (kind === 'mitad') {
      var base = pick([10, 20, 50, 100, 200, 12, 24]);
      var f = pick([['1/2', 2], ['1/4', 4], ['3/4', 4], ['1/3', 3]]);
      while (base % f[1] !== 0) base = pick([12, 24, 20, 100, 200]);
      return { txt: f[0] + ' de ' + base, ans: base / f[1] * parseInt(f[0].charAt(0), 10) };
    }
    var d1 = pick(dens), d2 = pick(dens);
    var n1 = rnd(1, d1 - 1), n2 = rnd(1, d2 - 1);
    if (kind === 'suma' && d1 !== d2 && Math.random() < 0.5) d2 = d1; /* mismo denominador = más amable */
    var opF = (kind === 'resta') ? '−' : '+';
    var num = (opF === '+') ? n1 * d2 + n2 * d1 : n1 * d2 - n2 * d1;
    var den = d1 * d2;
    var g = gcd(num, den) || 1;
    var ns = num / g, ds = den / g;
    r = { txt: n1 + '/' + d1 + ' ' + opF + ' ' + n2 + '/' + d2 + ' <span class="muted">(responde decimal, ej: ' + fmt(ns / ds, 2) + ' → escribe ' + fmt(ns / ds, 2) + ')</span>', ans: Math.round(ns / ds * 10000) / 10000 };
    r.ansRaw = ns / ds;
    return r;
  }
  if (modo === 'porcentaje') {
    var k2 = pick(['pctFacil', 'pctFacil', 'descuento', 'regla3']);
    if (k2 === 'regla3') {
      var a3 = pick([2, 4, 5, 10]);
      var b3 = pick([1000, 2000, 4000, 6000]);
      var c3 = pick([6, 8, 7, 3]);
      if (c3 === a3) c3 = a3 * 2;
      return { txt: 'Si ' + a3 + ' kg cuestan $' + b3 + ' ¿cuánto cuestan ' + c3 + ' kg?', ans: Math.round(b3 * c3 / a3) };
    }
    if (k2 === 'descuento') {
      var p = pick([10000, 15000, 20000, 30000]);
      var dsc = pick([10, 15, 20, 25, 50]);
      return { txt: '$' + p + ' con ' + dsc + '% dcto ¿cuánto pagas?', ans: Math.round(p * (1 - dsc / 100)) };
    }
    var baseP = pick([100, 200, 400, 1000, 2000, 150, 300, 600]);
    var pct = pick([10, 20, 25, 50, 75, 5]);
    return { txt: pct + '% de ' + baseP, ans: Math.round(baseP * pct / 100 * 100) / 100 };
  }
  if (modo === 'geometria') {
    var k3 = pick(['cuad', 'rect', 'tri', 'perim']);
    if (k3 === 'cuad') { var l = rnd(2, 12); return { txt: 'Área del cuadrado lado ' + l + ' (lado × lado)', ans: l * l }; }
    if (k3 === 'rect') { var bR = rnd(2, 12), hR = rnd(2, 10); return { txt: 'Área rectángulo ' + bR + ' × ' + hR, ans: bR * hR }; }
    if (k3 === 'tri') { var bT = pick([4, 6, 8, 10, 12]), hT = pick([2, 4, 5, 6, 10]); return { txt: 'Área triángulo base ' + bT + ' altura ' + hT + ' (base × altura ÷ 2)', ans: bT * hT / 2 }; }
    var l2 = rnd(3, 15), a2 = rnd(3, 10);
    return { txt: 'Perímetro terreno ' + l2 + ' × ' + a2 + ' (2 × (largo + ancho))', ans: 2 * (l2 + a2) };
  }
  if (modo === 'potencia') {
    var k4 = pick(['cuad', 'cubo', 'raiz', 'ecu']);
    if (k4 === 'cubo') { var c4 = rnd(2, 5); return { txt: c4 + '³ (= ' + c4 + ' × ' + c4 + ' × ' + c4 + ')', ans: c4 * c4 * c4 }; }
    if (k4 === 'raiz') { var rq = pick([4, 9, 16, 25, 36, 49, 64, 81, 100]); return { txt: '√' + rq, ans: Math.sqrt(rq) }; }
    if (k4 === 'ecu') { var x = rnd(2, 20), s = rnd(3, 15); return { txt: 'Si x + ' + s + ' = ' + (x + s) + ' ¿cuánto vale x?', ans: x }; }
    var c5 = rnd(2, 12); return { txt: c5 + '² (= ' + c5 + ' × ' + c5 + ')', ans: c5 * c5 };
  }
  /* modo mixto (nivel 10): sortea entre todos los anteriores + operación dura */
  var sub = pick(['basico', 'fraccion', 'porcentaje', 'geometria', 'potencia']);
  if (sub === 'basico') return null;
  return qEspecial(sub, cfg);
}
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
  /* Niveles 6-10: "Todas del nivel" mezcla operación base + reto especial del nivel */
  var quiereEspecial = (op === 'todo') && cfg.modo && (cfg.id === 10 ? Math.random() < 0.6 : Math.random() < 0.5);
  if (quiereEspecial) {
    var esp = qEspecial(cfg.modo === 'mixto' ? 'mixto' : cfg.modo, cfg);
    if (esp && (cfg.modo !== 'mixto' || esp.txt)) {
      Q.a = null; Q.b = null; Q.op = '★'; Q.txt = esp.txt; Q.ans = esp.ans; Q.asked = true;
      paintQ();
      if (notice) { var fbNE = $('matQFb'); if (fbNE) { fbNE.textContent = notice; fbNE.style.color = ''; } }
      return;
    }
    /* si modo mixto tocó "basico", sigue al flujo normal con max grande */
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
    if (cfg.id >= 7) bMax = 15;
    b = 2 + Math.floor(Math.random() * (bMax - 1));
    var c = 1 + Math.floor(Math.random() * (cfg.id >= 4 ? 12 : 10));
    if (cfg.id >= 10) c = 2 + Math.floor(Math.random() * 18);
    a = b * c;
    if (cfg.id === 1) { o = '+'; a = rnd(1, 10); b = rnd(1, 10); }
  } else if (o === '-') {
    a = rnd(1, max);
    b = rnd(1, max);
    if (cfg.id <= 2 && b > a) { var tmp = a; a = b; b = tmp; } /* niveles 1-2: sin negativos */
  } else if (o === '+') {
    a = rnd(1, max);
    b = rnd(1, max);
    if (cfg.id >= 10) { a = rnd(20, 200); b = rnd(20, 200); }
  } else if (o === '×') {
    var baseT = cfg.tablas || [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    var f1 = cfg.id <= 2 ? baseT[Math.floor(Math.random() * baseT.length)] : rnd(2, cfg.id >= 4 ? 12 : 10);
    if (cfg.id >= 7) f1 = rnd(3, 15);
    if (tablaFija && baseT.indexOf(tablaFija) >= 0) f1 = tablaFija;
    a = f1; b = rnd(1, cfg.id >= 4 ? 12 : 10);
    if (cfg.id >= 9) b = rnd(2, 15);
  } else {
    a = rnd(1, max);
    b = rnd(1, max);
  }
  Q.a = a; Q.b = b; Q.op = o; Q.txt = ''; Q.ans = null; Q.asked = true;
  paintQ();
  if (notice) {
    var fbN = $('matQFb');
    if (fbN) { fbN.textContent = notice; fbN.style.color = ''; }
  }
}
function qResp() {
  if (Q.ans != null) return Q.ans;
  if (Q.a == null || Q.b == null) return NaN;
  if (Q.op === '+') return Q.a + Q.b;
  if (Q.op === '-') return Q.a - Q.b;
  if (Q.op === '×') return Q.a * Q.b;
  return Q.b === 0 ? NaN : Q.a / Q.b;
}
function qEnunciado() {
  if (Q.txt) return Q.txt;
  if (Q.a == null) return '';
  return Q.a + ' ' + Q.op + ' ' + Q.b;
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
    if (Q.a == null && !Q.txt) t.textContent = 'Elige nivel y toca “🎲 Nueva pregunta” para empezar. Con ⏎ compruebas sin usar el mouse.';
    else t.innerHTML = '¿Cuánto es <b style="font-size:20px">' + qEnunciado() + '</b>? (' + Q.ok + '/' + Q.meta + ')';
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
  if (Q.a == null && Q.txt == null) { if (fb) fb.textContent = 'Primero toca “🎲 Nueva pregunta”.'; qNew(curQSel().op, curQSel().niv, curQSel().tabla); return; }
  if (Q.a == null && !Q.txt) { if (fb) fb.textContent = 'Primero toca “🎲 Nueva pregunta”.'; qNew(curQSel().op, curQSel().niv, curQSel().tabla); return; }
  var v = num((inp || {}).value);
  if (!isFinite(v)) { if (fb) fb.textContent = 'Escribe tu respuesta con números 🙂'; return; }
  var r = qResp();
  Q.total++;
  var tol = (Q.txt && Math.abs(r % 1) > 1e-9) ? 0.011 : 1e-9;
  var bien = Math.abs(v - r) < tol;
  if (bien) {
    Q.ok++; Q.racha++;
    var g = 10 + (Q.racha >= 3 ? 5 : 0) + ((Q.nivel || 1) >= 4 ? 5 : 0) + ((Q.nivel || 1) >= 6 ? 5 : 0) + ((Q.nivel || 1) >= 9 ? 5 : 0) + (Q.txt ? 5 : 0);
    try { var m0 = store(); m0.stats.xp = (m0.stats.xp || 0) + g; save(); } catch (e) {}
    if (fb) { fb.textContent = '¡Bien! 🎉 +' + g + ' XP · ' + qEnunciado() + ' = ' + fmt(r, r % 1 ? 2 : 0); fb.style.color = '#8fd694'; }
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
  var bonus = 20 + (lvlId >= 6 ? 10 : 0) + (lvlId >= 9 ? 10 : 0);
  m.stats.xp = (m.stats.xp || 0) + bonus;
  var cfg = lvlCfg(lvlId);
  m.logs.push({ id: uid('mt'), fecha: hoy, tipo: 'quiz', detalle: 'N' + lvlId + ' ' + cfg.nombre + ' · ' + Q.ok + '/' + Q.total + ' (' + (($('matQOp') || {}).value || 'todo') + ') · ' + '★'.repeat(st) + '☆'.repeat(3 - st) + ' · +' + bonus + ' XP bonus', ok: Q.ok, total: Q.total });
  if (m.logs.length > 200) m.logs = m.logs.slice(-200);
  save('¡Meta cumplida! +' + bonus + ' XP 🎉');
  renderAva();
  try { paintLevels(); } catch (eP) {}
  var fb = $('matQFb');
  var nxt = LEVELS[lvlId] ? (' · siguiente: ' + LEVELS[lvlId].ico + ' ' + LEVELS[lvlId].nombre + ' (' + LEVELS[lvlId].req + ' XP)') : ' · ¡nivel máximo! 🔥';
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
  box.innerHTML = '<p class="muted" style="font-size:11px">🎮 Partidas: <b>' + (s.played || 0) + '</b> · 🏆 mejor: <b>' + (s.best || 0) + '</b> · 🔥 racha días: <b>' + (s.streak || 0) + '</b> · ✨ XP: <b>' + xp + '</b> · 🎚️ nivel: <b>' + cur + '/' + LEVELS.length + ' ' + LEVELS[cur - 1].ico + ' ' + esc(LEVELS[cur - 1].nombre) + '</b></p>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + (nxt ? Math.min(100, Math.round(xp / nxt.req * 100)) : 100) + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">' + starRow + (nxt ? ' · siguiente: ' + nxt.ico + ' ' + esc(nxt.nombre) + ' con ' + nxt.req + ' XP (faltan ' + (nxt.req - xp) + ')' : ' · ¡nivel máximo ☀️!') + '</p>' +
    (logs.length ? logs.map(function (r) {
      var tag = r.tipo === 'quiz' ? '🔢 Quiz' : r.tipo === 'adivinanza' ? '🎯 Adivinanza' : r.tipo === 'basica' ? '📚 Básica' : r.tipo === 'media' ? '🎒 Media' : r.tipo === 'superior' ? '🎓 Superior' : '📝 Práctica';
      return '<div class="habit-item" style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>' + esc(r.fecha || '') + '</b> · ' + esc(tag) + ' · ' + esc(r.detalle || '') + '</span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
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
    '<button type="button" id="tabMatBas" class="btn" style="width:auto">📚 Básica</button>' +
    '<button type="button" id="tabMatMed" class="btn" style="width:auto">🎒 Media</button>' +
    '<button type="button" id="tabMatSup" class="btn" style="width:auto">🎓 Superior</button>' +
    '<button type="button" id="tabMatAva" class="btn" style="width:auto">📓 Mi avance</button></div>' +

    /* GUIA */
    '<div id="matGuia">' +
    rowCard({ h: '🔢 ¿Para qué sirven aquí las matemáticas?', p: 'Para la vida real de Penco: calcular la feria, dividir una receta, medir un terreno o cerco, estimar pintura, leer tu consumo eléctrico y jugar con la mente. <b>No es escuela con nota:</b> es herramienta. Si te costaron antes, aquí partes de cero, sin vergüenza y a tu ritmo.' }) +
    rowCard({ h: '🚶 Método sin miedo (15 min por día)', p: '<b>1)</b> Elige UN tema (ej: tablas del 7). <b>2)</b> Mira el ejemplo resuelto en cada pestaña. <b>3)</b> Haz 10 ejercicios en 🔢 Práctica. <b>4)</b> Anota 1 frase de lo aprendido en 📓 Mi avance. <b>5)</b> Repite mañana. La memoria ama lo poco y frecuente: mejor 15 min diarios que 3 horas un día.' }) +
    rowCard({ h: '🌙 Ritmo lunar sugerido', p: '<b>Creciente:</b> tema nuevo (tablas, fracciones). <b>Llena:</b> juega y celebra (quiz, adivinanza). <b>Menguante:</b> repasa lo difícil y ordena cuaderno. <b>Nueva:</b> descansa: la mente consolida durmiendo. El calendario de 13 lunas × 28 días = <b>364</b>: multiplica 13×28 en 🧮 para comprobarlo.' }) +
    rowCard({ h: '🗣️ Números que también son kimün', p: 'Mapuzugun del 1 al 13: <b>kiñe (1) · epu (2) · küla (3) · meli (4) · kechu (5) · kayu (6) · regle (7) · pura (8) · aylla (9) · mari (10) · mari kiñe (11) · mari epu (12) · mari küla (13)</b>. Mari küla küyen = 13 lunas. Contar también es pertenecer.' }) +
    rowCard({ h: '🎚️ 10 niveles: avanza sin miedo', p: '<b>🌱 1 Semilla (1–10):</b> sumas y restas para partir. <b>🌿 2 Brote (1–20):</b> + tablas 2, 3 y 5. <b>🌳 3 Árbol (1–30):</b> × ÷ de verdad. <b>🌙 4 Luna (1–50):</b> mixto + % y fracciones. <b>☀️ 5 Kimche (1–100):</b> vida real (IVA, interés, geometría).<br><b>🌊 6 Lafken:</b> fracciones y decimales (1/2 + 1/4, mitad de algo). <b>⛰️ 7 Pewen:</b> % mentales, descuentos y regla de 3. <b>🦉 8 Kuyam:</b> áreas y perímetros mentales. <b>🌌 9 Wenu:</b> potencias, √ exacta y ecuaciones x + a = b. <b>🔥 10 Newen:</b> TODO mezclado hasta 200, el desafío sabio.<br>Ganas <b>+10 XP por buena</b> (+5 racha ≥3, +5 desde N4, +5 desde N6, +5 desde N9, +5 extra en retos ★), <b>+20–40 XP al cumplir la meta</b> (más en niveles altos) y <b>★ hasta 3 por nivel</b>. Desbloqueos: 60 · 150 · 300 · 500 · 800 · 1200 · 1700 · 2300 · 3000 XP.' }) +
    rowCard({ h: '💡 Si te equivocas', p: 'El error es dato, no fracaso. En el quiz la respuesta correcta aparece al tiro para que aprendas. Si un tema te supera (divisiones largas, fracciones), baja un nivel y vuelve en 2 lunas. Y si quieres compañía: 🧠 Estudio y 🧩 Memoria del mismo grupo Aprender.' }) +
    rowCard({ h: '🎓 Ruta por etapa educativa', p: '<b>📚 Básica (1°–8°):</b> números, 4 operaciones, fracciones, decimales, % y geometría base. <b>🎒 Media (I–IV):</b> ecuaciones, funciones, trigonometría y probabilidad (puente PAES). <b>🎓 Superior:</b> derivadas, integrales, matrices, interés compuesto y estadística. Cada etapa trae <b>guía + herramientas + quiz con XP</b> que suma a tus mismos niveles y a 📓 Mi avance.' }) +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="matGoCalc" class="btn btn-accent" style="width:auto">🧮 Ir a la calculadora →</button> <button type="button" id="matGoPract" class="btn" style="width:auto">🔢 Practicar 10 min →</button> <button type="button" id="matGoBas" class="btn" style="width:auto">📚 Básica →</button> <button type="button" id="matGoMed" class="btn" style="width:auto">🎒 Media →</button> <button type="button" id="matGoSup" class="btn" style="width:auto">🎓 Superior →</button></div>' +
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
    '<button type="button" class="btn mat-lvl-btn" data-lvl="6"></button>' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="7"></button>' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="8"></button>' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="9"></button>' +
    '<button type="button" class="btn mat-lvl-btn" data-lvl="10"></button>' +
    '</div>' +
    '<div id="matLvlDesc" class="chip mat-calc-res" style="margin-top:8px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>🔢 Quiz relámpago — cumple la meta y gana XP</h4>' +
    '<div class="conv-row"><label>Operación <select id="matQOp"><option value="todo">Todas del nivel</option><option value="+">Sumas</option><option value="-">Restas</option><option value="×">Multiplicación</option><option value="÷">División</option><option value="tablas">Tablas ×</option></select></label>' +
    '<label>Nivel <select id="matQNivel"><option value="1">1 🌱 Semilla (1–10)</option><option value="2">2 🌿 Brote (1–20)</option><option value="3">3 🌳 Árbol (1–30)</option><option value="4">4 🌙 Luna (1–50)</option><option value="5">5 ☀️ Kimche (1–100)</option><option value="6">6 🌊 Lafken (fracciones)</option><option value="7">7 ⛰️ Pewen (% y proporción)</option><option value="8">8 🦉 Kuyam (geometría)</option><option value="9">9 🌌 Wenu (potencias)</option><option value="10">10 🔥 Newen (todo 1–200)</option></select></label>' +
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

    /* BASICA 1-8 Chile */
    '<div id="matBas" class="hidden">' +
    rowCard({ h: '📚 Básica 1°–8° · mapa rápido (Chile)', p: '<b>1°–2°:</b> números hasta 1.000, suma y resta, mitades y dobles, medir con regla. <b>3°–4°:</b> tablas ×÷, fracciones 1/2 1/4 3/4, perímetro, gráficos de barras. <b>5°–6°:</b> decimales, % de 10/25/50, MCM/MCD, áreas de cuadrado y rectángulo. <b>7°–8°:</b> enteros (+/−), potencias, proporciones, álgebra intro (x + 5 = 12). Parte por tu ciclo y sube: todo suma XP igual que 🔢 Práctica.' }) +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>✏️ Quiz Básica — gana XP (+15 por buena)</h4>' +
    '<div class="conv-row"><label>Tema <select id="matEBTema"><option value="todo">Todo mezclado</option><option value="op">4 operaciones</option><option value="frac">Fracciones</option><option value="dec">Decimales</option><option value="pct">Porcentajes</option><option value="geo">Geometría base</option><option value="prob">Problemas (feria/hogar)</option></select></label>' +
    '<label style="align-self:flex-end"><button type="button" id="matEBNew" class="btn btn-accent" style="width:auto">🎲 Nueva</button></label></div>' +
    '<div id="matEBTxt" style="font-size:14px;margin:8px 0">Toca “🎲 Nueva” para partir.</div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Tu respuesta <input type="text" id="matEBResp" inputmode="decimal" placeholder="número" autocomplete="off"></label><label style="align-self:flex-end"><button type="button" id="matEBCheck" class="btn btn-accent" style="width:auto">Comprobar ⏎</button></label></div>' +
    '<div id="matEBFb" class="muted" style="font-size:12px;min-height:20px"></div>' +
    '<div id="matEBStats" class="muted" style="font-size:11px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🔢 Valor posicional (descomponer)</h4>' +
    '<div class="conv-row"><label style="flex:2">Número <input type="text" id="matEBNum" inputmode="numeric" placeholder="ej: 3.457"></label><label style="align-self:flex-end"><button type="button" id="matEBGo" class="btn btn-accent" style="width:auto">Descomponer</button></label></div>' +
    '<div id="matEBRes" class="chip" style="display:block;white-space:normal">Ej: 3.457 = 3UM + 4C + 5D + 7U.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>➗ División con resto + redondeo</h4>' +
    '<div class="conv-row"><label>Dividendo <input type="number" id="matEBD1" placeholder="ej: 47"></label><label>Divisor <input type="number" id="matEBD2" placeholder="ej: 6"></label><label style="align-self:flex-end"><button type="button" id="matEBDGo" class="btn" style="width:auto">Dividir</button></label></div>' +
    '<div id="matEBDRes" class="chip" style="display:block;white-space:normal">Te da cociente y resto (ej: 47 ÷ 6 = 7 resto 5).</div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Número <input type="text" id="matEBR1" placeholder="ej: 3,476"></label><label>Decimales <input type="number" id="matEBR2" value="2" min="0" max="4"></label><label style="align-self:flex-end"><button type="button" id="matEBRGo" class="btn" style="width:auto">Redondear</button></label></div>' +
    '<div id="matEBRRes" class="chip" style="display:block;white-space:normal">Ej: 3,476 a 2 decimales → 3,48.</div></div>' +
    '</div>' +

    /* MEDIA I-IV Chile + PAES */
    '<div id="matMed" class="hidden">' +
    rowCard({ h: '🎒 Media I–IV · mapa rápido (Chile + PAES)', p: '<b>I°:</b> racionales, potencias y raíces, álgebra (factorizar, productos notables). <b>II°:</b> ecuación cuadrática, función lineal y afín, trigonometría en triángulo rectángulo. <b>III°:</b> probabilidad, estadística, geometría analítica (distancia/pendiente). <b>IV°:</b> funciones, repaso PAES: sin calculadora primero, luego verifica aquí. Todo con ejemplo resuelto en cada herramienta.' }) +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>✏️ Quiz Media — gana XP (+20 por buena)</h4>' +
    '<div class="conv-row"><label>Tema <select id="matEMTema"><option value="todo">Todo mezclado</option><option value="ecu1">Ecuación lineal</option><option value="ecu2">Ecuación cuadrática</option><option value="func">Función lineal</option><option value="pot">Potencias y raíces</option><option value="trig">Trigonometría exacta</option><option value="analit">Distancia y pendiente</option></select></label>' +
    '<label style="align-self:flex-end"><button type="button" id="matEMNew" class="btn btn-accent" style="width:auto">🎲 Nueva</button></label></div>' +
    '<div id="matEMTxt" style="font-size:14px;margin:8px 0">Toca “🎲 Nueva” para partir.</div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Tu respuesta <input type="text" id="matEMResp" inputmode="decimal" placeholder="número" autocomplete="off"></label><label style="align-self:flex-end"><button type="button" id="matEMCheck" class="btn btn-accent" style="width:auto">Comprobar ⏎</button></label></div>' +
    '<div id="matEMFb" class="muted" style="font-size:12px;min-height:20px"></div>' +
    '<div id="matEMStats" class="muted" style="font-size:11px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🟰 Ecuación lineal ax + b = 0 y cuadrática ax² + bx + c = 0</h4>' +
    '<div class="conv-row"><label>a <input type="text" id="matEMa" placeholder="ej: 2"></label><label>b <input type="text" id="matEMb" placeholder="ej: -8"></label><label style="align-self:flex-end"><button type="button" id="matEMGo" class="btn btn-accent" style="width:auto">Resolver lineal</button></label></div>' +
    '<div id="matEMRes" class="chip" style="display:block;white-space:normal">Ej: 2x − 8 = 0 → x = 4.</div>' +
    '<div class="conv-row" style="margin-top:8px"><label>a <input type="text" id="matECa" placeholder="ej: 1"></label><label>b <input type="text" id="matECb" placeholder="ej: -5"></label><label>c <input type="text" id="matECc" placeholder="ej: 6"></label><label style="align-self:flex-end"><button type="button" id="matECGo" class="btn" style="width:auto">Resolver cuadrática</button></label></div>' +
    '<div id="matECRes" class="chip" style="display:block;white-space:normal">Con discriminante Δ = b² − 4ac y raíces reales cuando Δ ≥ 0.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📈 Función lineal f(x) = mx + n + trigonometría</h4>' +
    '<div class="conv-row"><label>m <input type="text" id="matEMm" placeholder="ej: 3"></label><label>n <input type="text" id="matEMn" placeholder="ej: 2"></label><label>x <input type="text" id="matEMx" placeholder="ej: 4"></label><label style="align-self:flex-end"><button type="button" id="matEMfGo" class="btn" style="width:auto">Evaluar f(x)</button></label></div>' +
    '<div id="matEMfRes" class="chip" style="display:block;white-space:normal">Ej: f(x)=3x+2 con x=4 → 14. Pendiente m = subida/avance.</div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Ángulo (°) <input type="number" id="matEMAng" placeholder="30 / 45 / 60"></label><label style="align-self:flex-end"><button type="button" id="matEMTrigGo" class="btn" style="width:auto">sen · cos · tan</button></label></div>' +
    '<div id="matEMTrigRes" class="chip" style="display:block;white-space:normal">Exactos de memoria: sen30°=0,5 · cos60°=0,5 · tan45°=1.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📍 Distancia y pendiente entre 2 puntos</h4>' +
    '<div class="conv-row"><label>x1 <input type="text" id="matEMx1" placeholder="1"></label><label>y1 <input type="text" id="matEMy1" placeholder="2"></label><label>x2 <input type="text" id="matEMx2" placeholder="4"></label><label>y2 <input type="text" id="matEMy2" placeholder="6"></label><label style="align-self:flex-end"><button type="button" id="matEMDPGo" class="btn" style="width:auto">Calcular</button></label></div>' +
    '<div id="matEMDPRes" class="chip" style="display:block;white-space:normal">d = √[(x2−x1)²+(y2−y1)²] · m = (y2−y1)/(x2−x1).</div></div>' +
    '</div>' +

    /* SUPERIOR */
    '<div id="matSup" class="hidden">' +
    rowCard({ h: '🎓 Superior · mapa rápido (técnica y universidad)', p: '<b>Cálculo:</b> derivada = ritmo de cambio, integral = área acumulada. <b>Álgebra lineal:</b> matrices 2×2 para sistemas y transformaciones. <b>Estadística:</b> media, mediana y desviación para leer datos reales. <b>Finanzas:</b> interés compuesto y anualidades (CAE, créditos). <b>Lógica:</b> ∧ ∨ ¬ para programar y argumentar. Todo offline y con pasos visibles.' }) +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>✏️ Quiz Superior — gana XP (+25 por buena)</h4>' +
    '<div class="conv-row"><label>Tema <select id="matSQTema"><option value="todo">Todo mezclado</option><option value="der">Derivadas</option><option value="int">Integrales</option><option value="mat">Matrices (det)</option><option value="fin">Interés compuesto</option><option value="est">Promedios</option><option value="log">Lógica (1=V,0=F)</option></select></label>' +
    '<label style="align-self:flex-end"><button type="button" id="matSQNew" class="btn btn-accent" style="width:auto">🎲 Nueva</button></label></div>' +
    '<div id="matSQTXT" style="font-size:14px;margin:8px 0">Toca “🎲 Nueva” para partir.</div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Tu respuesta <input type="text" id="matSQResp" inputmode="decimal" placeholder="número" autocomplete="off"></label><label style="align-self:flex-end"><button type="button" id="matSQCheck" class="btn btn-accent" style="width:auto">Comprobar ⏎</button></label></div>' +
    '<div id="matSQFb" class="muted" style="font-size:12px;min-height:20px"></div>' +
    '<div id="matSQStats" class="muted" style="font-size:11px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>Δ Derivada de ax³ + bx² + cx + d (y valor en x₀)</h4>' +
    '<div class="conv-row"><label>a <input type="text" id="matSUa" placeholder="ej: 2"></label><label>b <input type="text" id="matSUb" placeholder="ej: -3"></label><label>c <input type="text" id="matSUc" placeholder="ej: 4"></label><label>d <input type="text" id="matSUd" placeholder="ej: 1"></label><label>x₀ <input type="text" id="matSUx0" placeholder="ej: 2"></label><label style="align-self:flex-end"><button type="button" id="matSUDevGo" class="btn btn-accent" style="width:auto">Derivar</button></label></div>' +
    '<div id="matSUDevRes" class="chip" style="display:block;white-space:normal">Ej: 2x³−3x²+4x+1 → f′ = 6x²−6x+4 · f′(2) = 16.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>∫ Integral definida de ax² + bx + c entre L1 y L2</h4>' +
    '<div class="conv-row"><label>a <input type="text" id="matSUiA" placeholder="ej: 3"></label><label>b <input type="text" id="matSUiB" placeholder="ej: 2"></label><label>c <input type="text" id="matSUiC" placeholder="ej: 1"></label><label>L1 <input type="text" id="matSUiL1" placeholder="ej: 0"></label><label>L2 <input type="text" id="matSUiL2" placeholder="ej: 2"></label><label style="align-self:flex-end"><button type="button" id="matSUiGo" class="btn" style="width:auto">Integrar</button></label></div>' +
    '<div id="matSUiRes" class="chip" style="display:block;white-space:normal">Antiderivada: (a/3)x³ + (b/2)x² + cx, evaluada L2 − L1.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🔢 Matrices 2×2: suma, producto y determinantes</h4>' +
    '<div class="conv-row"><label>A11 <input type="text" id="matSMa" placeholder="1"></label><label>A12 <input type="text" id="matSMb" placeholder="2"></label><label>A21 <input type="text" id="matSMc" placeholder="3"></label><label>A22 <input type="text" id="matSMd" placeholder="4"></label></div>' +
    '<div class="conv-row"><label>B11 <input type="text" id="matSMe" placeholder="5"></label><label>B12 <input type="text" id="matSMf" placeholder="6"></label><label>B21 <input type="text" id="matSMg" placeholder="7"></label><label>B22 <input type="text" id="matSMh" placeholder="8"></label><label style="align-self:flex-end"><span style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="matSMAdd" class="btn" style="width:auto">A+B</button><button type="button" id="matSMMul" class="btn" style="width:auto">A×B</button><button type="button" id="matSMDet" class="btn" style="width:auto">det A y det B</button></span></label></div>' +
    '<div id="matSMRes" class="chip" style="display:block;white-space:normal">det = a·d − b·c. Si det ≠ 0 la matriz tiene inversa.</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>💰 Interés compuesto + estadística de lista</h4>' +
    '<div class="conv-row"><label>Capital $ <input type="number" id="matSUC" placeholder="ej: 100000"></label><label>Tasa % por período <input type="text" id="matSUT" placeholder="ej: 5"></label><label>Períodos <input type="number" id="matSUN" placeholder="ej: 3"></label><label style="align-self:flex-end"><button type="button" id="matSUIntGo" class="btn" style="width:auto">Monto</button></label></div>' +
    '<div id="matSUIntRes" class="chip" style="display:block;white-space:normal">M = C·(1+i)ⁿ. Compara con interés simple de 🏠 Hogar.</div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Lista (separa con comas) <input type="text" id="matSUList" placeholder="ej: 4, 7, 7, 9, 13"></label><label style="align-self:flex-end"><button type="button" id="matSUStatGo" class="btn" style="width:auto">Analizar</button></label></div>' +
    '<div id="matSUStatRes" class="chip" style="display:block;white-space:normal">Te da n, media, mediana, mín, máx y desviación.</div></div>' +
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

/* ---------------- ETAPAS EDUCATIVAS: XP + QUIZ COMPARTIDO ----------------
   📚 Básica (+15) · 🎒 Media (+20) · 🎓 Superior (+25).
   Todo suma al mismo XP de niveles y queda en 📓 Mi avance. */
function logEtapa(tipo, detalle, xp) {
  try {
    var m = store();
    m.stats.xp = (m.stats.xp || 0) + xp;
    if (m.stats.xp < 0) m.stats.xp = 0;
    m.logs.push({ id: uid('mt'), fecha: todayKey(), tipo: tipo, detalle: detalle + ' · +' + xp + ' XP', ok: 1, total: 1 });
    if (m.logs.length > 200) m.logs = m.logs.slice(-200);
    save();
  } catch (e) {}
  try { paintLevels(); } catch (e2) {}
  try { renderAva(); } catch (e3) {}
}
/* Quiz genérico de etapa: prefijos EB / EM / SQ con generador propio */
function etapaQuiz(prefix, genFn, baseXP, label) {
  var S = { txt: '', ans: null, ok: 0, total: 0, racha: 0, asked: false };
  function paint() {
    var t = $(prefix + 'Txt'), st = $(prefix + 'Stats');
    if (t) {
      if (!S.asked) t.textContent = 'Toca “🎲 Nueva” para partir.';
      else t.innerHTML = '¿Cuánto es <b style="font-size:20px">' + S.txt + '</b>? (✅ ' + S.ok + '/' + S.total + ')';
    }
    if (st) st.textContent = '✅ ' + S.ok + '/' + S.total + ' · 🔥 racha ' + S.racha + ' · ' + label + ' · +' + baseXP + ' XP por buena';
  }
  function nuevo() {
    try {
      var tema = (($((prefix === 'matSQ') ? 'matSQTema' : prefix + 'Tema') || {}).value || 'todo');
      var r = genFn(tema === 'todo' ? 'todo' : tema);
      S.txt = r.txt; S.ans = r.ans; S.asked = true;
    } catch (e) { S.txt = '2 + 3'; S.ans = 5; S.asked = true; }
    paint();
    var fb = $(prefix + 'Fb');
    if (fb) { fb.textContent = ''; }
  }
  function check() {
    var inp = $(prefix + 'Resp'), fb = $(prefix + 'Fb');
    if (!S.asked) { if (fb) fb.textContent = 'Primero toca “🎲 Nueva”.'; nuevo(); return; }
    var v = num((inp || {}).value);
    if (!isFinite(v)) { if (fb) fb.textContent = 'Escribe tu respuesta con números 🙂'; return; }
    S.total++;
    var tol = (Math.abs(S.ans % 1) > 1e-9) ? 0.011 : 1e-9;
    if (Math.abs(v - S.ans) < tol) {
      S.ok++; S.racha++;
      var g = baseXP + (S.racha >= 3 ? 5 : 0);
      logEtapa(label === '📚 Básica' ? 'basica' : label === '🎒 Media' ? 'media' : 'superior', label + ' · ' + S.txt + ' = ' + fmt(S.ans, S.ans % 1 ? 2 : 0), g);
      if (fb) { fb.textContent = '¡Bien! 🎉 +' + g + ' XP · ' + S.txt + ' = ' + fmt(S.ans, S.ans % 1 ? 2 : 0); fb.style.color = '#8fd694'; }
    } else {
      S.racha = 0;
      if (fb) { fb.textContent = 'Casi… era ' + fmt(S.ans, S.ans % 1 ? 2 : 0) + '. Vamos con la siguiente 💪'; fb.style.color = '#e8c56a'; }
    }
    if (inp) inp.value = '';
    try { inp.focus(); } catch (e) {}
    paint();
    nuevo();
  }
  return { S: S, paint: paint, nuevo: nuevo, check: check };
}
/* --- Generadores Básica 1°–8° (respuestas exactas) --- */
function ebGen(tema) {
  var t = tema;
  if (t === 'todo') t = pick(['op', 'op', 'frac', 'dec', 'pct', 'geo', 'prob']);
  if (t === 'frac') {
    var d = pick([2, 4, 8]);
    var n1 = rnd(1, d - 1), n2 = rnd(1, d - 1);
    if (Math.random() < 0.5) return { txt: n1 + '/' + d + ' + ' + n2 + '/' + d, ans: Math.round((n1 + n2) / d * 10000) / 10000 };
    var dd = pick([2, 4]);
    var b = pick([10, 20, 100]);
    return { txt: '1/' + dd + ' de ' + b, ans: b / dd };
  }
  if (t === 'dec') {
    var x = pick([0.5, 0.25, 0.75, 1.5, 2.25]), y = pick([0.5, 0.25, 0.75, 1.25]);
    return { txt: String(x).replace('.', ',') + ' + ' + String(y).replace('.', ','), ans: Math.round((x + y) * 100) / 100 };
  }
  if (t === 'pct') {
    var base = pick([40, 80, 100, 200]), p = pick([10, 25, 50]);
    return { txt: p + '% de ' + base, ans: base * p / 100 };
  }
  if (t === 'geo') {
    if (Math.random() < 0.5) { var l = rnd(2, 12); return { txt: 'Área cuadrado lado ' + l, ans: l * l }; }
    var w = rnd(2, 10), h = rnd(2, 9);
    return { txt: 'Perímetro rectángulo ' + w + ' × ' + h, ans: 2 * (w + h) };
  }
  if (t === 'prob') {
    var kg = rnd(2, 5), pk = pick([1000, 1500, 2000]);
    return { txt: kg + ' kg a $' + pk + ' el kg ¿total?', ans: kg * pk };
  }
  var o = pick(['+', '-', '×', '÷']);
  if (o === '+') { var a1 = rnd(3, 99), b1 = rnd(3, 99); return { txt: a1 + ' + ' + b1, ans: a1 + b1 }; }
  if (o === '-') { var a2 = rnd(10, 99), b2 = rnd(1, a2); return { txt: a2 + ' − ' + b2, ans: a2 - b2 }; }
  if (o === '÷') { var d3 = rnd(2, 9), c3 = rnd(2, 12); return { txt: (d3 * c3) + ' ÷ ' + d3, ans: c3 }; }
  var t1 = rnd(2, 9), t2 = rnd(2, 9);
  return { txt: t1 + ' × ' + t2, ans: t1 * t2 };
}
/* --- Generadores Media I–IV (respuestas exactas o tolerancia 0,01) --- */
function emGen(tema) {
  var t = tema;
  if (t === 'todo') t = pick(['ecu1', 'ecu2', 'func', 'pot', 'trig', 'analit']);
  if (t === 'ecu1') {
    var x = rnd(2, 12), a = rnd(2, 6), c = a * x + rnd(1, 9);
    return { txt: a + 'x + ' + (c - a * x) + ' = ' + c + ' → x', ans: x };
  }
  if (t === 'ecu2') {
    if (Math.random() < 0.5) { var r = pick([3, 4, 5, 6, 7, 8, 9]); return { txt: 'x² = ' + (r * r) + ' → x positivo', ans: r }; }
    var r1 = rnd(1, 6), r2 = rnd(1, 6);
    var b = -(r1 + r2), cc = r1 * r2;
    return { txt: 'x² ' + (b < 0 ? '− ' + Math.abs(b) : '+ ' + b) + 'x + ' + cc + ' = 0 → raíz mayor', ans: Math.max(r1, r2) };
  }
  if (t === 'func') {
    var m = rnd(2, 6), n = rnd(1, 9), xv = rnd(1, 9);
    return { txt: 'f(x) = ' + m + 'x + ' + n + ' · f(' + xv + ')', ans: m * xv + n };
  }
  if (t === 'pot') {
    var k = pick(['cuad', 'cubo', 'raiz']);
    if (k === 'cubo') { var cb = rnd(2, 4); return { txt: cb + '³', ans: cb * cb * cb }; }
    if (k === 'raiz') { var rq = pick([16, 25, 36, 49, 81, 144]); return { txt: '√' + rq, ans: Math.sqrt(rq) }; }
    var pb = rnd(2, 9), pe = rnd(2, 3);
    return { txt: pb + '^' + pe, ans: Math.pow(pb, pe) };
  }
  if (t === 'trig') {
    var tg = pick([['sen 30°', 0.5], ['cos 60°', 0.5], ['tan 45°', 1], ['sen 90°', 1], ['cos 0°', 1]]);
    return { txt: tg[0], ans: tg[1] };
  }
  var x1 = rnd(0, 5), y1 = rnd(0, 5), x2 = x1 + rnd(1, 5), y2 = y1 + rnd(1, 5);
  if (Math.random() < 0.5) return { txt: 'pendiente (P1=' + x1 + ',' + y1 + ' P2=' + x2 + ',' + y2 + ')', ans: Math.round((y2 - y1) / (x2 - x1) * 100) / 100 };
  return { txt: 'distancia (P1=' + x1 + ',' + y1 + ' P2=' + x2 + ',' + y2 + ') ≈ 2 decimales', ans: Math.round(Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) * 100) / 100 };
}
/* --- Generadores Superior (respuestas exactas o tolerancia 0,01) --- */
function esGen(tema) {
  var t = tema;
  if (t === 'todo') t = pick(['der', 'int', 'mat', 'fin', 'est', 'log']);
  if (t === 'der') {
    var k = rnd(2, 4), x0 = rnd(1, 3);
    return { txt: "f(x) = " + k + "x² · f′(" + x0 + ')', ans: 2 * k * x0 };
  }
  if (t === 'int') {
    var kk = rnd(1, 4), L = 2;
    return { txt: '∫₀..' + L + ' ' + kk + 'x dx', ans: kk * L * L / 2 };
  }
  if (t === 'mat') {
    var a = rnd(1, 5), b = rnd(1, 5), c = rnd(1, 5), d = rnd(1, 5);
    return { txt: 'det [' + a + ' ' + b + '; ' + c + ' ' + d + ']', ans: a * d - b * c };
  }
  if (t === 'fin') {
    var C = pick([100000, 200000]), i = 5, n2 = 2;
    return { txt: '$' + C + ' al 5% compuesto 2 períodos → monto', ans: Math.round(C * 1.05 * 1.05) };
  }
  if (t === 'est') {
    var v1 = rnd(2, 9), v2 = rnd(2, 9), v3 = rnd(2, 9);
    return { txt: 'promedio de ' + v1 + ', ' + v2 + ', ' + v3, ans: Math.round((v1 + v2 + v3) / 3 * 100) / 100 };
  }
  var lg = pick([['V ∧ F (1=V,0=F)', 0], ['V ∨ F (1=V,0=F)', 1], ['¬F (1=V,0=F)', 1], ['V ∧ V (1=V,0=F)', 1]]);
  return { txt: lg[0], ans: lg[1] };
}
var EBQ = null, EMQ = null, ESQ = null;
function etapaQuizzes() {
  if (!EBQ) EBQ = etapaQuiz('matEB', ebGen, 15, '📚 Básica');
  if (!EMQ) EMQ = etapaQuiz('matEM', emGen, 20, '🎒 Media');
  if (!ESQ) ESQ = etapaQuiz('matSQ', esGen, 25, '🎓 Superior');
  return { EBQ: EBQ, EMQ: EMQ, ESQ: ESQ };
}

/* ---------------- BINDINGS ---------------- */
function bindAll() {
  var on = function (id, fn) { var el = $(id); if (el) el.onclick = fn; };

  on('matGoCalc', function () { switchTab('Calc'); });
  on('matGoPract', function () { switchTab('Pract'); try { paintLevels(); if (!Q.asked) { var s0 = curQSel(); qNew(s0.op, s0.niv, s0.tabla); } else paintQ(); } catch (eG) {} });
  on('matGoBas', function () { switchTab('Bas'); try { var e1 = etapaQuizzes(); e1.EBQ.paint(); if (!e1.EBQ.S.asked) e1.EBQ.nuevo(); } catch (eG2) {} });
  on('matGoMed', function () { switchTab('Med'); try { var e2 = etapaQuizzes(); e2.EMQ.paint(); if (!e2.EMQ.S.asked) e2.EMQ.nuevo(); } catch (eG3) {} });
  on('matGoSup', function () { switchTab('Sup'); try { var e3 = etapaQuizzes(); e3.ESQ.paint(); if (!e3.ESQ.S.asked) e3.ESQ.nuevo(); } catch (eG4) {} });
  ['Guia', 'Calc', 'Pract', 'Geo', 'Hogar', 'Bas', 'Med', 'Sup', 'Ava'].forEach(function (t) {
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

  /* ---- ETAPAS: quizzes + herramientas ---- */
  try {
    var EZ = etapaQuizzes();
    on('matEBNew', EZ.EBQ.nuevo);
    on('matEBCheck', EZ.EBQ.check);
    on('matEMNew', EZ.EMQ.nuevo);
    on('matEMCheck', EZ.EMQ.check);
    on('matSQNew', EZ.ESQ.nuevo);
    on('matSQCheck', EZ.ESQ.check);
    var ebi = $('matEBResp');
    if (ebi && !ebi.dataset.enter) { ebi.dataset.enter = '1'; ebi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); EZ.EBQ.check(); } }); }
    var emi = $('matEMResp');
    if (emi && !emi.dataset.enter) { emi.dataset.enter = '1'; emi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); EZ.EMQ.check(); } }); }
    var esi = $('matSQResp');
    if (esi && !esi.dataset.enter) { esi.dataset.enter = '1'; esi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); EZ.ESQ.check(); } }); }
    EZ.EBQ.paint(); EZ.EMQ.paint(); EZ.ESQ.paint();
  } catch (eEZ) {}

  /* Básica: valor posicional */
  on('matEBGo', function () {
    var raw = String(($('matEBNum') || {}).value || '').replace(/\s|\./g, '').replace(',', '.');
    var box = $('matEBRes');
    var n = parseInt(raw, 10);
    if (!isFinite(n) || n < 0 || n > 9999999) { if (box) box.textContent = '⚠️ Escribe un número entero entre 0 y 9.999.999.'; return; }
    var um = Math.floor(n / 1000), resto = n % 1000;
    var c = Math.floor(resto / 100); resto = resto % 100;
    var d = Math.floor(resto / 10), u = resto % 10;
    var partes = [];
    if (um) partes.push(um + 'UM');
    if (c) partes.push(c + 'C');
    if (d) partes.push(d + 'D');
    if (u || !partes.length) partes.push(u + 'U');
    if (box) box.textContent = fmt(n, 0) + ' = ' + partes.join(' + ') + ' · (' + String(n).length + ' cifras)';
  });
  /* Básica: división con resto + redondeo */
  on('matEBDGo', function () {
    var a = num(($('matEBD1') || {}).value), b = num(($('matEBD2') || {}).value);
    var box = $('matEBDRes');
    a = Math.round(a); b = Math.round(b);
    if (!isFinite(a) || !isFinite(b) || b === 0) { if (box) box.textContent = '⚠️ Escribe dividendo y divisor (divisor ≠ 0).'; return; }
    var q = Math.trunc(a / b), r = a - q * b;
    if (box) box.textContent = a + ' ÷ ' + b + ' = ' + q + ' resto ' + Math.abs(r) + (r === 0 ? ' (exacta ✅)' : ' · comprueba: ' + b + '×' + q + '+' + Math.abs(r) + '=' + a);
  });
  on('matEBRGo', function () {
    var v = num(($('matEBR1') || {}).value), dec = parseInt(($('matEBR2') || {}).value, 10);
    var box = $('matEBRRes');
    if (!isFinite(v)) { if (box) box.textContent = '⚠️ Escribe el número a redondear.'; return; }
    if (!isFinite(dec) || dec < 0 || dec > 4) dec = 2;
    if (box) box.textContent = fmt(v, 4) + ' a ' + dec + ' decimales → ' + fmt(v, dec);
  });
  /* Media: lineal + cuadrática */
  on('matEMGo', function () {
    var a = num(($('matEMa') || {}).value), b = num(($('matEMb') || {}).value);
    var box = $('matEMRes');
    if (!isFinite(a) || !isFinite(b)) { if (box) box.textContent = '⚠️ Escribe a y b.'; return; }
    if (a === 0) { if (box) box.textContent = b === 0 ? '∞ soluciones (0 = 0)' : 'Sin solución (' + b + ' ≠ 0)'; return; }
    if (box) box.textContent = a + 'x + (' + b + ') = 0 → x = ' + fmt(-b / a, 4) + ' · verifica reemplazando.';
  });
  on('matECGo', function () {
    var a = num(($('matECa') || {}).value), b = num(($('matECb') || {}).value), c = num(($('matECc') || {}).value);
    var box = $('matECRes');
    if (!isFinite(a) || !isFinite(b) || !isFinite(c) || a === 0) { if (box) box.textContent = '⚠️ Escribe a (≠0), b y c.'; return; }
    var D = b * b - 4 * a * c;
    if (D < 0) { if (box) box.textContent = 'Δ = ' + fmt(D, 2) + ' < 0 → sin raíces reales (dos complejas).'; return; }
    var x1 = (-b + Math.sqrt(D)) / (2 * a), x2 = (-b - Math.sqrt(D)) / (2 * a);
    if (box) box.textContent = 'Δ = ' + fmt(D, 2) + (D === 0 ? ' → raíz doble x = ' + fmt(x1, 4) : ' → x₁ = ' + fmt(x1, 4) + ' · x₂ = ' + fmt(x2, 4));
  });
  /* Media: función lineal + trigonometría */
  on('matEMfGo', function () {
    var m = num(($('matEMm') || {}).value), n = num(($('matEMn') || {}).value), x = num(($('matEMx') || {}).value);
    var box = $('matEMfRes');
    if (!isFinite(m) || !isFinite(n) || !isFinite(x)) { if (box) box.textContent = '⚠️ Escribe m, n y x.'; return; }
    if (box) box.textContent = 'f(' + x + ') = ' + m + '·' + x + ' + ' + n + ' = ' + fmt(m * x + n, 4) + ' · raíz en x = ' + (m === 0 ? '—' : fmt(-n / m, 4));
  });
  on('matEMTrigGo', function () {
    var g = num(($('matEMAng') || {}).value);
    var box = $('matEMTrigRes');
    if (!isFinite(g)) { if (box) box.textContent = '⚠️ Escribe el ángulo en grados.'; return; }
    var r = g * Math.PI / 180;
    var s = Math.sin(r), c2 = Math.cos(r);
    var t2 = Math.abs(c2) < 1e-12 ? '∞ (no definida)' : fmt(s / c2, 4);
    if (box) box.textContent = 'sen(' + g + '°)=' + fmt(s, 4) + ' · cos=' + fmt(c2, 4) + ' · tan=' + t2;
  });
  /* Media: distancia + pendiente */
  on('matEMDPGo', function () {
    var x1 = num(($('matEMx1') || {}).value), y1 = num(($('matEMy1') || {}).value);
    var x2 = num(($('matEMx2') || {}).value), y2 = num(($('matEMy2') || {}).value);
    var box = $('matEMDPRes');
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) { if (box) box.textContent = '⚠️ Escribe los 4 valores.'; return; }
    var d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    var t = 'd = ' + fmt(d, 4);
    if (x2 !== x1) t += ' · pendiente m = ' + fmt((y2 - y1) / (x2 - x1), 4);
    else t += ' · recta vertical (pendiente ∞)';
    if (box) box.textContent = t;
  });
  /* Superior: derivada */
  on('matSUDevGo', function () {
    var a = num(($('matSUa') || {}).value) || 0, b = num(($('matSUb') || {}).value) || 0;
    var c = num(($('matSUc') || {}).value) || 0, d = num(($('matSUd') || {}).value) || 0;
    var x0 = num(($('matSUx0') || {}).value);
    var box = $('matSUDevRes');
    var d2 = 3 * a, d1 = 2 * b;
    var t = 'f′ = ' + fmt(d2, 2) + 'x² + ' + fmt(d1, 2) + 'x + ' + fmt(c, 2);
    if (isFinite(x0)) t += ' · f′(' + x0 + ') = ' + fmt(d2 * x0 * x0 + d1 * x0 + c, 4);
    else t += ' (d constante = 0)';
    if (box) box.textContent = t;
  });
  /* Superior: integral definida */
  on('matSUiGo', function () {
    var a = num(($('matSUiA') || {}).value) || 0, b = num(($('matSUiB') || {}).value) || 0, c = num(($('matSUiC') || {}).value) || 0;
    var L1 = num(($('matSUiL1') || {}).value), L2 = num(($('matSUiL2') || {}).value);
    var box = $('matSUiRes');
    if (!isFinite(L1) || !isFinite(L2)) { if (box) box.textContent = '⚠️ Escribe los límites L1 y L2.'; return; }
    var F = function (x) { return (a / 3) * x * x * x + (b / 2) * x * x + c * x; };
    if (box) box.textContent = '∫(' + a + 'x²+' + b + 'x+' + c + ') de ' + L1 + ' a ' + L2 + ' = ' + fmt(F(L2) - F(L1), 4);
  });
  /* Superior: matrices 2x2 */
  var matSUGet = function () {
    return {
      a: num(($('matSMa') || {}).value) || 0, b: num(($('matSMb') || {}).value) || 0,
      c: num(($('matSMc') || {}).value) || 0, d: num(($('matSMd') || {}).value) || 0,
      e: num(($('matSMe') || {}).value) || 0, f: num(($('matSMf') || {}).value) || 0,
      g: num(($('matSMg') || {}).value) || 0, h: num(($('matSMh') || {}).value) || 0
    };
  };
  var matSUOut = function (t) { var box = $('matSMRes'); if (box) box.textContent = t; };
  on('matSMAdd', function () {
    var m = matSUGet();
    matSUOut('A+B = [' + fmt(m.a + m.e, 2) + ' ' + fmt(m.b + m.f, 2) + '; ' + fmt(m.c + m.g, 2) + ' ' + fmt(m.d + m.h, 2) + ']');
  });
  on('matSMMul', function () {
    var m = matSUGet();
    matSUOut('A×B = [' + fmt(m.a * m.e + m.b * m.g, 2) + ' ' + fmt(m.a * m.f + m.b * m.h, 2) + '; ' + fmt(m.c * m.e + m.d * m.g, 2) + ' ' + fmt(m.c * m.f + m.d * m.h, 2) + '] (no conmuta: A×B ≠ B×A)');
  });
  on('matSMDet', function () {
    var m = matSUGet();
    var da = m.a * m.d - m.b * m.c, db = m.e * m.h - m.f * m.g;
    matSUOut('det A = ' + fmt(da, 2) + (da !== 0 ? ' (tiene inversa ✅)' : ' (singular, sin inversa)') + ' · det B = ' + fmt(db, 2) + (db !== 0 ? ' (tiene inversa ✅)' : ' (singular)'));
  });
  /* Superior: interés compuesto + estadística */
  on('matSUIntGo', function () {
    var C = num(($('matSUC') || {}).value), i = num(($('matSUT') || {}).value), n = num(($('matSUN') || {}).value);
    var box = $('matSUIntRes');
    if (!isFinite(C) || !isFinite(i) || !isFinite(n) || C <= 0 || n < 0) { if (box) box.textContent = '⚠️ Completa capital, tasa y períodos.'; return; }
    var M = C * Math.pow(1 + i / 100, n);
    if (box) box.textContent = 'M = ' + fmt(C, 0) + '·(1+' + i + '%)^' + n + ' = $' + fmt(M, 0) + ' · interés ganado $' + fmt(M - C, 0);
  });
  on('matSUStatGo', function () {
    var raw = String(($('matSUList') || {}).value || '');
    var box = $('matSUStatRes');
    var vs = raw.split(/[,;\s]+/).map(function (x) { return num(x); }).filter(function (x) { return isFinite(x); });
    if (vs.length < 2) { if (box) box.textContent = '⚠️ Escribe al menos 2 números separados por comas.'; return; }
    vs.sort(function (x, y) { return x - y; });
    var n = vs.length, s = vs.reduce(function (a, b) { return a + b; }, 0), me = s / n;
    var med = (n % 2) ? vs[(n - 1) / 2] : (vs[n / 2 - 1] + vs[n / 2]) / 2;
    var v = vs.reduce(function (a, b) { return a + (b - me) * (b - me); }, 0) / n;
    if (box) box.textContent = 'n=' + n + ' · media=' + fmt(me, 2) + ' · mediana=' + fmt(med, 2) + ' · mín=' + fmt(vs[0], 2) + ' · máx=' + fmt(vs[n - 1], 2) + ' · DE=' + fmt(Math.sqrt(v), 2);
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
    share('🔢 Mi avance matemático', 'Nivel ' + cur2 + '/' + LEVELS.length + ' ' + LEVELS[cur2 - 1].ico + ' ' + LEVELS[cur2 - 1].nombre + ' · XP ' + (m.stats.xp || 0) + ' · Partidas: ' + (m.stats.played || 0) + ' · Mejor: ' + (m.stats.best || 0) + ' · Racha: ' + (m.stats.streak || 0) + ' días\n' +
      m.logs.slice(-10).map(function (r) { return '• ' + r.fecha + ' · ' + r.detalle; }).join('\n'));
  });
  on('matAvaClear', function () {
    if (!confirm('¿Borrar tu bitácora matemática? (se mantienen guías)')) return;
    try { var u = userData(); if (u && u.matematicas) { u.matematicas.logs = []; u.matematicas.stats = { played: 0, best: 0, streak: 0, lastDay: '', xp: 0, stars: {}, nivel: 1 }; } } catch (e) {}
    Q.ok = 0; Q.total = 0; Q.racha = 0; Q.a = null; Q.b = null; Q.txt = ''; Q.ans = null; Q.asked = false;
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
        btn.setAttribute('data-keywords', 'matematicas calculo calculadora porcentaje fraccion geometria area perimetro volumen pitagoras tablas multiplicar sumar restar dividir quiz practica numeros mapuzugun interes descuento iva receta escala terreno pintura basica media superior ecuacion funcion trigonometria derivada integral matriz paes lineal cuadratica estadistica');
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
        if (PRESETS[p] && (p === 'todo' || p === 'adulto' || p === 'estudiante' || p === 'docente' || p === 'adolescente')) PRESETS[p].btnMatematicas = true;
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
    addKw('btnStudy', 'matematicas calculo geometria fracciones quiz basica media superior paes');
    addKw('btnMemory', 'matematicas numeros tablas calculo basica');
    addKw('btnConvert', 'matematicas calculadora porcentaje regla3 geometria');
    addKw('btnFinance', 'matematicas porcentaje iva descuento interes compuesto');
  } catch (e12) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
