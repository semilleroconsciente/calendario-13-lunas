// tests/zoom-calendario.test.js — Ctrl+rueda cambia el tamaño del calendario (PC).
//
// Carga zoom-calendario.js en un contexto `vm` con un DOM mínimo y simula:
// rueda con Ctrl sobre #gridWrap → zoom 110% → persiste → Ctrl+0 restablece.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); },
  };
}

function makeEl(tag, id) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    id: id || '',
    children: [],
    style: {},
    dataset: {},
    title: '',
    textContent: '',
    _cls: new Set(),
    _listeners: {},
    isConnected: true,
    classList: null,
    parentNode: null,
  };
  el.classList = {
    add: (...cs) => cs.forEach((c) => el._cls.add(c)),
    remove: (...cs) => cs.forEach((c) => el._cls.delete(c)),
    contains: (c) => el._cls.has(c),
  };
  el.setAttribute = (k, v) => { el['attr:' + k] = String(v); };
  el.getAttribute = (k) => (k in el ? el[k] : (('attr:' + k) in el ? el['attr:' + k] : null));
  el.addEventListener = (t, fn) => { (el._listeners[t] = el._listeners[t] || []).push(fn); };
  el.appendChild = (c) => { c.parentNode = el; el.children.push(c); return c; };
  el.closest = (sel) => {
    if (sel === '#gridWrap' && (el.id === 'gridWrap' || el._insideGrid)) return el;
    return null;
  };
  return el;
}

function makeSandbox(pc) {
  const savedCalls = [];
  const winListeners = {};
  const gridWrap = makeEl('section', 'gridWrap');
  const main = makeEl('main', 'main');
  const statusMsg = makeEl('span', 'statusMsg');
  const byId = { gridWrap, main, statusMsg };
  const sb = {
    console,
    innerWidth: pc ? 1280 : 390,
    innerHeight: 800,
    localStorage: makeStore(),
    matchMedia: () => ({ matches: !!pc }),
    setTimeout: (fn) => { try { fn(); } catch (e) {} return 0; },
    clearTimeout: () => {},
    MutationObserver: class { observe() {} disconnect() {} },
    DATA: {},
    scheduleSave: (msg) => savedCalls.push(msg),
    __savedCalls: savedCalls,
    __winListeners: winListeners,
  };
  sb.window = sb;
  const doc = {
    readyState: 'complete',
    body: makeEl('body', 'body'),
    documentElement: makeEl('html', 'html'),
    createElement: (t) => makeEl(t),
    getElementById: (id) => byId[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  sb.document = doc;
  sb.addEventListener = (t, fn) => { (winListeners[t] = winListeners[t] || []).push(fn); };
  sb.__gridWrap = gridWrap;
  return sb;
}

function loadModule(sb) {
  vm.createContext(sb);
  const codigo = fs.readFileSync(path.join(ROOT, 'zoom-calendario.js'), 'utf8');
  new vm.Script(codigo, { filename: 'zoom-calendario.js' }).runInContext(sb);
}

function wheelEvent(sb, dir, inside, ctrl) {
  let prevented = false;
  const target = { closest: (sel) => (inside && sel === '#gridWrap' ? sb.__gridWrap : null) };
  const ev = {
    ctrlKey: ctrl !== false,
    deltaY: dir > 0 ? 100 : -100,
    target,
    preventDefault: () => { prevented = true; },
    stopPropagation: () => {},
  };
  const fns = sb.__winListeners.wheel || [];
  fns.forEach((fn) => fn(ev));
  return prevented;
}

function keyEvent(sb, key) {
  let prevented = false;
  const ev = {
    ctrlKey: true, altKey: false, metaKey: false, key,
    target: { tagName: 'DIV' },
    preventDefault: () => { prevented = true; },
    stopPropagation: () => {},
  };
  (sb.__winListeners.keydown || []).forEach((fn) => fn(ev));
  return prevented;
}

describe('zoom del calendario con Ctrl+rueda (zoom-calendario)', () => {
  it('rueda arriba con Ctrl agranda, abajo achica, y persiste', () => {
    const sb = makeSandbox(true);
    loadModule(sb);
    assert.ok((sb.__winListeners.wheel || []).length > 0, 'listener wheel registrado en PC');

    const p1 = wheelEvent(sb, -1, true, true);
    assert.equal(p1, true, 'preventDefault frena el zoom del navegador');
    assert.equal(sb.__gridWrap.style.zoom, '1.1', 'zoom 110% aplicado a #gridWrap');
    assert.equal(sb.localStorage.getItem('cal13-cal-zoom-v1'), '1.1', 'zoom guardado en localStorage');
    assert.equal(sb.DATA.config.calZoom, 1.1, 'zoom guardado en DATA.config');

    wheelEvent(sb, 1, true, true);
    assert.equal(sb.__gridWrap.style.zoom, '', 'al volver a 100% se limpia el zoom');
    assert.equal(sb.localStorage.getItem('cal13-cal-zoom-v1'), '1', 'persiste el 100%');
  });

  it('sin Ctrl no cambia nada; fuera del calendario no interfiere', () => {
    const sb = makeSandbox(true);
    loadModule(sb);
    const p = wheelEvent(sb, -1, true, false);
    assert.equal(p, false, 'sin Ctrl no se intercepta (scroll normal)');
    assert.ok(!sb.__gridWrap.style.zoom, 'sin cambios sin Ctrl');
    const p2 = wheelEvent(sb, -1, false, true);
    assert.equal(p2, false, 'fuera del calendario no se intercepta (zoom navegador intacto)');
    assert.ok(!sb.__gridWrap.style.zoom, 'sin cambios fuera del calendario');
  });

  it('Ctrl+0 restablece; el rango se limita a 60%–180%', () => {
    const sb = makeSandbox(true);
    loadModule(sb);
    sb.__calZoom.set(1.5);
    assert.equal(sb.__gridWrap.style.zoom, '1.5', 'API __calZoom.set aplica');
    sb.__calZoom.set(9);
    assert.equal(sb.__gridWrap.style.zoom, '1.8', 'tope máximo 180%');
    sb.__calZoom.set(0.1);
    assert.equal(sb.__gridWrap.style.zoom, '0.6', 'tope mínimo 60%');
    const p = keyEvent(sb, '0');
    assert.equal(p, true, 'Ctrl+0 interceptado');
    assert.equal(sb.DATA.config.calZoom, 1, 'Ctrl+0 restablece al 100%');
    assert.equal(sb.__gridWrap.style.zoom, '', 'zoom limpio al 100%');
  });

  it('en móvil no se registra nada', () => {
    const sb = makeSandbox(false);
    loadModule(sb);
    assert.equal((sb.__winListeners.wheel || []).length, 0, 'sin listener wheel en móvil');
  });

  it('index.html carga el módulo y styles.css trae la insignia solo en PC', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert.ok(html.includes('zoom-calendario.min.js'), 'script zoom-calendario en index.html');
    const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
    assert.ok(css.includes('#calZoomBadge'), 'estilos de la insignia presentes');
    const chunk = css.split('@media').find((c) => c.includes('#calZoomBadge') && c.includes('pointer: fine'));
    assert.ok(chunk, '#calZoomBadge solo en el media PC (pointer:fine)');
  });
});
