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

// Archivos con scope propio (no compiten por window en el navegador).
const EXCLUIR = new Set([
  'main.js', // Node/Electron (require)
  'preload.js', // contexto Electron
  'capacitor.config.js', // config nativa
  'sw.js', // scope de ServiceWorker (self), no window
]);

// Colisiones CONOCIDAS a la fecha (documentadas, no nuevas):
// renderer.js (núcleo, carga primero) define estos helpers y los módulos
// de respaldo/QR los redefinen al cargarse después (ganan los módulos).
// Meta: eliminar el duplicado en renderer.js y vaciar esta lista.
const CONOCIDAS = {
  applyBitacoraJSON: ['renderer.js', 'bitacoras-respaldo-modulo.js'],
  applyBackupJSON: ['renderer.js', 'qr-sync-modulo.js'],
  // data.js expone el fallback embebido y territorio.js lo reemplaza por el
  // territorio activo (window.pencoData = pd). Redefinición por diseño.
  pencoData: ['data.js', 'territorio.js'],
};

function ordenCarga() {
  // Mismo orden que el navegador: defer de index.html + MODS de boot.
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
  // Cola: resto de .js raíz no cableados (igual se revisan).
  for (const f of fs.readdirSync(ROOT)) {
    if (f.endsWith('.js') && !orden.includes(f) && !EXCLUIR.has(f)) orden.push(f);
  }
  return orden.filter((f) => !EXCLUIR.has(f) && fs.existsSync(path.join(ROOT, f)));
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
function windowAssigns(codigo) {
  const set = new Set();
  const re = /(?:window|globalThis)\.([A-Za-z0-9_$]+)\s*=/g;
  let m;
  while ((m = re.exec(codigo))) set.add(m[1]);
  return set;
}

describe('colisiones IIFE (vm)', () => {
  it('ningún archivo agrega globales que choquen con otro módulo', () => {
    const archivos = ordenCarga();
    assert.ok(archivos.length > 80, 'se esperaban 80+ .js raíz, fueron ' + archivos.length);
    const sb = makeSandbox();
    vm.createContext(sb);
    const define = new Map(); // global -> [archivos que lo agregaron]
    const fugados = [];
    const rotosNucleo = [];
    const avisos = [];
    for (const f of archivos) {
      const antes = new Set(globalesDe(sb));
      const codigo = fs.readFileSync(path.join(ROOT, f), 'utf8');
      try {
        const script = new vm.Script(codigo, { filename: f, timeout: 1500 });
        script.runInContext(sb, { timeout: 1500 });
      } catch (e) {
        const msg = e && e.message ? String(e.message) : String(e);
        // Firma del top-level fugado en IIFE estricta: ReferenceError.
        if (/is not defined/.test(msg)) fugados.push(`${f}: posible global fugado → ${msg.split('\n')[0]}`);
        else if (NUCLEO.has(f)) rotosNucleo.push(`${f}: ${msg.split('\n')[0]}`);
        else avisos.push(`${f}: ${msg.split('\n')[0]}`);
        const redecl = msg.match(/Identifier '([^']+)' has already been declared/);
        if (redecl) {
          const g = redecl[1];
          if (!define.has(g)) define.set(g, []);
          define.get(g).push(f + ' (redeclara)');
        }
        continue;
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
    const colisiones = [...define.entries()].filter(([, fs2]) => {
      const reales = fs2.filter((x) => !x.includes('(redeclara)'));
      return reales.length > 1 || fs2.some((x) => x.includes('(redeclara)'));
    });
    const inesperadas = [];
    for (const [g, fs2] of colisiones) {
      const esperados = CONOCIDAS[g];
      const lista = fs2.map((x) => x.replace(' (redeclara)', ''));
      if (!esperados || esperados.slice().sort().join() !== [...new Set(lista)].slice().sort().join()) {
        inesperadas.push(`${g}: ${[...new Set(lista)].join(' ↔ ')}`);
      }
    }
    if (fugados.length) console.log('  ~ posibles fugados:\n    ' + fugados.join('\n    '));
    if (avisos.length) console.log(`  ~ ${avisos.length} módulo(s) no cargan en stub (API real ausente, se revisan igual):\n    ` + avisos.join('\n    '));
    console.log(`  i globals rastreados: ${define.size} en ${archivos.length} archivos`);
    assert.deepEqual(fugados, [], 'top-level fugados (ReferenceError en carga)');
    assert.deepEqual(rotosNucleo, [], 'archivos del núcleo que no cargan en el sandbox');
    assert.deepEqual(inesperadas, [], 'colisiones de globales entre módulos');
  });
});
