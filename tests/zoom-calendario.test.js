'use strict';
// ============================================================================
// tests/zoom-calendario.test.js — Ctrl+rueda cambia el tamaño del calendario.
//
// Carga zoom-calendario.js en un contexto `vm` con un DOM mínimo y simula:
// rueda con Ctrl sobre #gridWrap → zoom 110% → persiste → Ctrl+0 restablece.
// Solo PC (matchMedia + pointer:fine); en móvil no registra listeners.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { ROOT, leerFuente, memoriaStorage } = require('./helpers.cjs');
const fs = require('node:fs');
const path = require('node:path');

// --- DOM mínimo --------------------------------------------------------------
function crearEl(tag, id) {
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

function crearSandbox(esPC) {
  const savedCalls = [];
  const winListeners = {};
  const gridWrap = crearEl('section', 'gridWrap');
  const porId = { gridWrap, main: crearEl('main', 'main'), statusMsg: crearEl('span', 'statusMsg') };
  const sb = {
    console,
    innerWidth: esPC ? 1280 : 390,
    innerHeight: 800,
    localStorage: memoriaStorage(),
    matchMedia: () => ({ matches: Boolean(esPC) }),
    setTimeout: (fn) => { try { fn(); } catch { /* stub: ignora el diferido */ } return 0; },
    clearTimeout: () => {},
    MutationObserver: class { observe() {} disconnect() {} },
    DATA: {},
    scheduleSave: (msg) => savedCalls.push(msg),
    __savedCalls: savedCalls,
    __winListeners: winListeners,
  };
  sb.window = sb;
  sb.document = {
    readyState: 'complete',
    body: crearEl('body', 'body'),
    documentElement: crearEl('html', 'html'),
    createElement: (t) => crearEl(t),
    getElementById: (id) => porId[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
  };
  sb.addEventListener = (t, fn) => { (winListeners[t] = winListeners[t] || []).push(fn); };
  sb.__gridWrap = gridWrap;
  return sb;
}

function cargarModulo(sb) {
  vm.createContext(sb);
  const codigo = leerFuente('zoom-calendario.js');
  new vm.Script(codigo, { filename: 'zoom-calendario.js' }).runInContext(sb);
}

// Simula la rueda del mouse; devuelve si se interceptó (preventDefault).
function eventoRueda(sb, dir, dentro, conCtrl) {
  let interceptado = false;
  const ev = {
    ctrlKey: conCtrl !== false,
    deltaY: dir > 0 ? 100 : -100,
    target: { closest: (sel) => (dentro && sel === '#gridWrap' ? sb.__gridWrap : null) },
    preventDefault: () => { interceptado = true; },
    stopPropagation: () => {},
  };
  for (const fn of sb.__winListeners.wheel || []) fn(ev);
  return interceptado;
}

// Simula Ctrl+tecla; devuelve si se interceptó.
function eventoTecla(sb, tecla) {
  let interceptado = false;
  const ev = {
    ctrlKey: true, altKey: false, metaKey: false, key: tecla,
    target: { tagName: 'DIV' },
    preventDefault: () => { interceptado = true; },
    stopPropagation: () => {},
  };
  for (const fn of sb.__winListeners.keydown || []) fn(ev);
  return interceptado;
}

// --- Suite -------------------------------------------------------------------
describe('Zoom del calendario con Ctrl+rueda (zoom-calendario)', () => {
  it('la rueda arriba con Ctrl agranda, abajo achica, y persiste', () => {
    const sb = crearSandbox(true);
    cargarModulo(sb);
    assert.ok((sb.__winListeners.wheel || []).length > 0, 'listener wheel registrado en PC');

    assert.equal(eventoRueda(sb, -1, true, true), true, 'preventDefault frena el zoom del navegador');
    assert.equal(sb.__gridWrap.style.zoom, '1.1', 'zoom 110% aplicado a #gridWrap');
    assert.equal(sb.localStorage.getItem('cal13-cal-zoom-v1'), '1.1', 'zoom guardado en localStorage');
    assert.equal(sb.DATA.config.calZoom, 1.1, 'zoom guardado en DATA.config');

    eventoRueda(sb, 1, true, true);
    assert.equal(sb.__gridWrap.style.zoom, '', 'al volver a 100% se limpia el zoom');
    assert.equal(sb.localStorage.getItem('cal13-cal-zoom-v1'), '1', 'persiste el 100%');
  });

  it('sin Ctrl no cambia nada y fuera del calendario no interfiere', () => {
    const sb = crearSandbox(true);
    cargarModulo(sb);
    assert.equal(eventoRueda(sb, -1, true, false), false, 'sin Ctrl no se intercepta (scroll normal)');
    assert.ok(!sb.__gridWrap.style.zoom, 'sin cambios sin Ctrl');
    assert.equal(eventoRueda(sb, -1, false, true), false, 'fuera del calendario no se intercepta');
    assert.ok(!sb.__gridWrap.style.zoom, 'sin cambios fuera del calendario');
  });

  it('Ctrl+0 restablece y el rango se limita a 60%-180%', () => {
    const sb = crearSandbox(true);
    cargarModulo(sb);
    sb.__calZoom.set(1.5);
    assert.equal(sb.__gridWrap.style.zoom, '1.5', 'API __calZoom.set aplica');
    sb.__calZoom.set(9);
    assert.equal(sb.__gridWrap.style.zoom, '1.8', 'tope máximo 180%');
    sb.__calZoom.set(0.1);
    assert.equal(sb.__gridWrap.style.zoom, '0.6', 'tope mínimo 60%');

    assert.equal(eventoTecla(sb, '0'), true, 'Ctrl+0 interceptado');
    assert.equal(sb.DATA.config.calZoom, 1, 'Ctrl+0 restablece al 100%');
    assert.equal(sb.__gridWrap.style.zoom, '', 'zoom limpio al 100%');
  });

  it('en móvil no se registra nada', () => {
    const sb = crearSandbox(false);
    cargarModulo(sb);
    assert.equal((sb.__winListeners.wheel || []).length, 0, 'sin listener wheel en móvil');
  });

  it('index.html carga el módulo y styles.css trae la insignia solo en PC', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert.ok(html.includes('zoom-calendario.min.js'), 'script zoom-calendario en index.html');
    const css = leerFuente('styles.css');
    assert.ok(css.includes('#calZoomBadge'), 'estilos de la insignia presentes');
    const chunk = css.split('@media').find((c) => c.includes('#calZoomBadge') && c.includes('pointer: fine'));
    assert.ok(chunk, '#calZoomBadge solo en el media PC (pointer:fine)');
  });
});
