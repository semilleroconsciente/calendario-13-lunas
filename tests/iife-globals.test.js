// tests/iife-globals.test.js — mejora: colisiones IIFE con 90 módulos.
//
// Cada módulo debe vivir en su IIFE y exponer 1 namespace en window.
// Un top-level fugado (var/function fuera del IIFE, o asignación sin
// declarar en modo sloppy) rompe otro módulo en silencio: el último
// script cargado gana. Este test carga cada .js raíz en un contexto `vm`
// con stubs de navegador, registra qué globales agrega cada archivo y
// falla si dos archivos definen el mismo global (salvo allowlist).
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
// Paso 3 del reorden src/: las fuentes viven en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');

// Archivos con scope propio (no compiten por window en el navegador).
const EXCLUIR = new Set([
  'main.js', // Node/Electron (require)
  'preload.js', // contexto Electron
  'capacitor.config.js', // config nativa
  'sw.js', // scope de ServiceWorker (self), no window
]);

// Colisiones CONOCIDAS a la fecha (documentadas, no nuevas):
// P2-A (2026-10-13): applyBitacoraJSON/applyBackupJSON eran FALSOS POSITIVOS
// del detector windowAssigns (contaba `window.X ===` como asignación).
// Tras corregir el regex, solo queda la redefinición INTENCIONAL por diseño:
// data.js expone el fallback embebido y territorio.js lo reemplaza por el
// territorio activo (window.pencoData = pd).
const CONOCIDAS = {
  // data.js expone el fallback embebido y territorio.js lo reemplaza por el
  // territorio activo (window.pencoData = pd). Redefinición por diseño.
  pencoData: ['data.js', 'territorio.js'],
};

function ordenCarga() {
  // Mismo orden que el navegador: defer de index.html + MODS de boot.
  // SOLO lo cableado (con build:min son los .min): las fuentes originales
  // no se cargan en runtime y no deben mezclarse aquí (sus const top-level
  // colisionarían con sus gemelos .min). Las fuentes se revisan igual en
  // fase A (contexto fresco por archivo: fugados + núcleo roto).
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const orden = [];
  const re = /<script[^>]+src="([^"]+\.js)(?:\?v=\d+)?"/g;
  let m;
  while ((m = re.exec(html))) if (!orden.includes(m[1])) orden.push(m[1]);
  try {
    const boot = fs.readFileSync(path.join(ROOT, 'boot-modulos.js'), 'utf8');
    const mods = boot.match(/var MODS = \[([\s\S]*?)\];/);
    if (mods) {
      const re2 = /'([^']+\.js)(?:\?v=\d+)?'/g;
      while ((m = re2.exec(mods[1]))) {
        const base = m[1].split('?')[0];
        if (!orden.includes(base)) orden.push(base);
      }
    }
  } catch {}
  return orden.filter((f) => !EXCLUIR.has(f) && fs.existsSync(path.join(ROOT, f)));
}

// Núcleo (nombre base: vale fuente en raíz o src/, o gemelo .min).
function esNucleo(f) {
  const base = f.replace(/^(min|src)\//, '').replace(/\.min\.js$/, '.js');
  return NUCLEO.has(base);
}

function memoriaStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); },
    clear: () => m.clear(),
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] || null,
  };
}

function makeEl(tag) {
  // Elemento stub: no-ops encadenables; navegación → null (termina loops).
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    id: '', className: '', textContent: '', innerHTML: '', value: '',
    dataset: {},
    style: { setProperty: () => {}, getPropertyValue: () => '', removeProperty: () => {} },
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    children: [], childNodes: [],
    parentNode: null, parentElement: null, firstChild: null, lastChild: null,
    nextSibling: null, previousSibling: null, nextElementSibling: null,
    addEventListener: () => {}, removeEventListener: () => {},
    appendChild: (c) => c, append: () => {}, prepend: () => {}, remove: () => {},
    setAttribute: () => {}, getAttribute: () => null, hasAttribute: () => false, removeAttribute: () => {},
    querySelector: () => null, querySelectorAll: () => [],
    click: () => {}, focus: () => {}, blur: () => {},
    showModal: () => {}, close: () => {},
    getContext: () => null, play: () => Promise.resolve(), pause: () => {},
  };
  return el;
}

function makeSandbox() {
  const store = memoriaStore();
  const noop = () => {};
  const porId = new Map();
  const getById = (id) => {
    const k = String(id);
    if (!porId.has(k)) { const el = makeEl('div'); el.id = k; porId.set(k, el); }
    return porId.get(k);
  };
  const sb = {
    console,
    URLSearchParams,
    atob: (s) => Buffer.from(String(s), 'base64').toString('binary'),
    btoa: (s) => Buffer.from(String(s), 'binary').toString('base64'),
    performance: { now: () => 0 },
    devicePixelRatio: 1,
    innerWidth: 1024,
    innerHeight: 768,
    screen: { width: 1024, height: 768 },
    location: { protocol: 'https:', href: 'https://test/', search: '', reload: noop },
    navigator: { userAgent: 'node-vm-test', onLine: true, language: 'es' },
    localStorage: store,
    sessionStorage: memoriaStore(),
    fetch: () => Promise.reject(new Error('fetch stub (vm)')),
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    requestIdleCallback: noop, // no ejecutar diferidos: solo importan los globales
    requestAnimationFrame: noop,
    cancelAnimationFrame: noop,
    setTimeout: noop,
    clearTimeout: noop,
    setInterval: noop,
    clearInterval: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => true,
    CustomEvent: class CustomEvent { constructor(t, o = {}) { this.type = t; this.detail = o.detail; } },
    MutationObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class { observe() {} disconnect() {} },
    Audio: class { constructor() {} play() { return Promise.resolve(); } pause() {} },
    document: {
      readyState: 'complete',
      title: 'test',
      body: makeEl('body'),
      documentElement: makeEl('html'),
      activeElement: null,
      currentScript: null,
      querySelector: (s) => getById('q:' + s),
      querySelectorAll: () => [],
      getElementById: getById,
      getElementsByClassName: () => [],
      getElementsByTagName: () => [],
      createElement: (t) => makeEl(t),
      createElementNS: (ns, t) => makeEl(t),
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => true,
      hasFocus: () => false,
    },
  };
  sb.window = sb;
  sb.self = sb;
  sb.globalThis = sb;
  sb.top = sb;
  return sb;
}

// Núcleo que debe cargar limpio en el sandbox (sin throw de ningún tipo);
// en el resto de módulos un throw no-ReferenceError se reporta como aviso
// (suele ser API real ausente en el stub, no fuga de globals).
const NUCLEO = new Set([
  'web-api.js', 'storage-idb.js', 'astro.js', 'data.js', 'territorio.js',
  'frases.js', 'cal.js', 'renderer.js', 'nuevos-modulos.js',
  'boot-modulos.js', 'sw-registro.js',
]);

const BASE_KEYS = new Set(Object.getOwnPropertyNames(makeSandbox()));

function globalesDe(sb) {
  return Object.getOwnPropertyNames(sb).filter((k) => !BASE_KEYS.has(k));
}

// Asignaciones explícitas window.X = ... en el fuente. Se combinan con la
// detección dinámica: sin esto, una REDEFINICIÓN (el caso que rompe en
// silencio) es invisible, porque el global ya existe y el diff por archivo
// solo ve globales *nuevos*.
// P2-A: excluye comparaciones (==, ===, !==) y arrow (=>): antes
// `typeof window.X === 'function'` contaba como definición (falso positivo
// applyBackupJSON/applyBitacoraJSON). Solo `=` simple cuenta.
function windowAssigns(codigo) {
  const set = new Set();
  const re = /(?<![=!<>-])(?:window|globalThis)\.([A-Za-z0-9_$]+)\s*=(?![=>])/g;
  let m;
  while ((m = re.exec(codigo))) set.add(m[1]);
  return set;
}

describe('colisiones IIFE (vm)', () => {
  it('ningún archivo agrega globales que choquen con otro módulo', () => {
    const cableados = ordenCarga();
    assert.ok(cableados.length > 80, 'se esperaban 80+ .js cableados, fueron ' + cableados.length);
    // Fuentes en el mismo orden relativo que los cableados (gemelo .min →
    // fuente). Las fuentes nunca se mezclan con sus gemelos en un mismo
    // contexto: sus const top-level colisionarían entre sí (falso positivo).
    // Tras el reorden src/ viven en src/ (resolver dual raíz/src).
    const aFuente = (f) => f.replace(/^(min|src)\//, '').replace(/\.min\.js$/, '.js');
    const fuentes = [];
    for (const f of cableados) {
      const s = aFuente(f);
      if (s === f) continue;
      const r = resolverFuente(s);
      if (!r) continue;
      // path.relative da 'src\\x.js' en Windows: normalizar a '/' para que
      // coincida con el barrido y no se cargue el mismo archivo dos veces.
      const rel = path.relative(ROOT, r).split(path.sep).join('/');
      if (!fuentes.includes(rel)) fuentes.push(rel);
    }
    for (const dir of ['', 'src/']) {
      let lista = [];
      try { lista = fs.readdirSync(path.join(ROOT, dir)); } catch { continue; }
      for (const f of lista) {
        const rel = dir + f;
        if (f.endsWith('.js') && !EXCLUIR.has(f) && !fuentes.includes(rel) && !cableados.includes(rel)) fuentes.push(rel);
      }
    }
    // Rechazos asíncronos de los stubs (fetch stub, inits diferidos): se
    // capturan para informar, sin tumbar el runner por unhandledRejection.
    // (En el navegador esos globals sí existen por el orden de carga.)
    const asyncErrs = new Set();
    const asyncH = (e) => asyncErrs.add(String((e && e.message) || e).split('\n')[0]);
    process.on('unhandledRejection', asyncH);
    const fugados = [];
    const rotosNucleo = [];
    const avisos = [];
    const define = new Map(); // global -> [archivos que lo agregaron]
    try {
      // Fase A: fuentes en contexto compartido (orden de carga real).
      const sbA = makeSandbox();
      vm.createContext(sbA);
      for (const f of fuentes) correrEn(sbA, f, fugados, rotosNucleo, avisos, define);
      // Fase B: cableados (.min) en contexto compartido, orden de carga →
      // colisiones reales (el último en cargar gana, igual que en el navegador).
      const sbB = makeSandbox();
      vm.createContext(sbB);
      for (const f of cableados) correrEn(sbB, f, fugados, rotosNucleo, avisos, define);
    } finally {
      process.removeListener('unhandledRejection', asyncH);
    }
    function correrEn(sb, f, fugados, rotosNucleo, avisos, define) {
      const antes = new Set(globalesDe(sb));
      const codigo = fs.readFileSync(path.join(ROOT, f), 'utf8');
      try {
        const script = new vm.Script(codigo, { filename: f, timeout: 1500 });
        script.runInContext(sb, { timeout: 1500 });
      } catch (e) {
        const msg = e && e.message ? String(e.message) : String(e);
        // Firma del top-level fugado en IIFE estricta: ReferenceError.
        if (/is not defined/.test(msg)) fugados.push(`${f}: posible global fugado → ${msg.split('\n')[0]}`);
        else if (esNucleo(f)) rotosNucleo.push(`${f}: ${msg.split('\n')[0]}`);
        else avisos.push(`${f}: ${msg.split('\n')[0]}`);
        const redecl = msg.match(/Identifier '([^']+)' has already been declared/);
        if (redecl) {
          const g = redecl[1];
          if (!define.has(g)) define.set(g, []);
          define.get(g).push(f + ' (redeclara)');
        }
        return;
      }
      for (const g of globalesDe(sb)) {
        if (antes.has(g)) continue;
        if (!define.has(g)) define.set(g, []);
        define.get(g).push(f);
      }
      // Redefiniciones explícitas: aunque el global ya existía, este
      // archivo lo reasigna (gana el último en cargar).
      for (const g of windowAssigns(codigo)) {
        if (!define.has(g)) define.set(g, []);
        const arr = define.get(g);
        if (arr[arr.length - 1] !== f) arr.push(f);
      }
    }
    // Fuente y gemelo .min definen lo mismo en contextos distintos: se
    // normaliza por archivo base; colisión = >1 archivo base distinto.
    const base = (x) => x.replace(' (redeclara)', '').replace(/^(min|src)\//, '').replace(/\.min\.js$/, '.js');
    const colisiones = [...define.entries()]
      .map(([g, fs2]) => [g, [...new Set(fs2.map(base))]])
      .filter(([, bases]) => bases.length > 1);
    const inesperadas = [];
    for (const [g, lista] of colisiones) {
      const esperados = CONOCIDAS[g];
      if (!esperados || esperados.slice().sort().join() !== lista.slice().sort().join()) {
        inesperadas.push(`${g}: ${lista.join(' ↔ ')}`);
      }
    }
    if (fugados.length) console.log('  ~ posibles fugados:\n    ' + fugados.join('\n    '));
    if (avisos.length) console.log(`  ~ ${avisos.length} módulo(s) no cargan en stub (API real ausente, se revisan igual):\n    ` + avisos.join('\n    '));
    console.log(`  i globals rastreados: ${define.size} en ${fuentes.length} fuentes + ${cableados.length} cableados`);
    if (asyncErrs.size) console.log('  ~ rechazos async en stub (orden de carga los evita en navegador):\n    ' + [...asyncErrs].join('\n    '));
    assert.deepEqual(fugados, [], 'top-level fugados (ReferenceError en carga)');
    assert.deepEqual(rotosNucleo, [], 'archivos del núcleo que no cargan en el sandbox');
    assert.deepEqual(inesperadas, [], 'colisiones de globales entre módulos');
  });
});
