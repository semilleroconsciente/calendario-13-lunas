// tests/dialogo-tamano.test.js — verifica que el tamaño de una pestaña
// (diálogo/sección) se guarde y se aplique a TODAS las demás.
//
// Carga dialogo-tamano.js en un contexto `vm` con un DOM mínimo (suficiente
// para los selectores que usa el módulo) y simula: abrir → arrastrar el
// tirador ⤡ → abrir otro diálogo → agrandar ⛶ → abrir un tercero.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
// Paso 3 del reorden src/: las fuentes viven en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');

// ---------- DOM mínimo ----------
function makeClassList(el) {
  return {
    add: (...cs) => cs.forEach((c) => el._cls.add(c)),
    remove: (...cs) => cs.forEach((c) => el._cls.delete(c)),
    contains: (c) => el._cls.has(c),
    toggle: (c, f) => {
      const on = f === undefined ? !el._cls.has(c) : !!f;
      if (on) el._cls.add(c); else el._cls.delete(c);
      return on;
    },
  };
}

class MiniEl {
  constructor(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.children = [];
    this.parentNode = null;
    this._cls = new Set();
    this.classList = makeClassList(this);
    this.dataset = {};
    this.style = {};
    this._listeners = {};
    this.textContent = '';
    this.title = '';
    this.open = false;
    let cn = '';
    Object.defineProperty(this, 'className', {
      get: () => cn,
      set: (v) => { cn = String(v || ''); this._cls = new Set(cn.split(/\s+/).filter(Boolean)); },
    });
    Object.defineProperty(this, 'nextSibling', { get: () => null });
  }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  setAttribute(k, v) { this['attr:' + k] = String(v); }
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this, 'attr:' + k) ? this['attr:' + k] : null; }
  hasAttribute(k) { return Object.prototype.hasOwnProperty.call(this, 'attr:' + k); }
  removeAttribute(k) { delete this['attr:' + k]; }
  addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); }
  removeEventListener(t, fn) {
    const a = this._listeners[t] || [];
    const i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
  }
  dispatch(t, ev) {
    const e = Object.assign({ type: t, target: this, preventDefault: () => {}, stopPropagation: () => {} }, ev || {});
    (this._listeners[t] || []).slice().forEach((fn) => fn.call(this, e));
    return e;
  }
  getBoundingClientRect() {
    const px = (v, d) => {
      const m = /^(-?\d+(?:\.\d+)?)px$/.exec(String(v || ''));
      return m ? +m[1] : d;
    };
    return { width: px(this.style.width, 600), height: px(this.style.height, 400), x: 0, y: 0 };
  }
  _walk(out, test) {
    if (test(this)) out.push(this);
    this.children.forEach((c) => c._walk(out, test));
    return out;
  }
  _matchSimple(sel) {
    const s = sel.trim();
    if (s.startsWith('.')) return this._cls.has(s.slice(1));
    const m = /^([a-z]+)(?:\.([a-z0-9_-]+))?$/i.exec(s);
    if (!m) return false;
    if (this.tagName !== m[1].toUpperCase()) return false;
    if (m[2] && !this._cls.has(m[2])) return false;
    return true;
  }
  querySelectorAll(sel) {
    const out = [];
    sel.split(',').map((p) => p.trim()).forEach((part) => {
      let m = /^:scope > (.+)$/.exec(part);
      if (m) {
        this.children.forEach((c) => { if (c._matchSimple(m[1]) && !out.includes(c)) out.push(c); });
        return;
      }
      m = /^([a-z]+) > (.+)$/i.exec(part);
      if (m) {
        this._walk([], (n) => n.tagName === m[1].toUpperCase()).forEach((f) => {
          f.children.forEach((c) => { if (c._matchSimple(m[2]) && !out.includes(c)) out.push(c); });
        });
        return;
      }
      this._walk(out, (n) => n._matchSimple(part) && !out.includes(n));
    });
    return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  setPointerCapture() {}
  click() { this.dispatch('click', {}); }
}

class MiniDialog extends MiniEl {
  constructor() { super('dialog'); }
  showModal() { this.open = true; }
}

function makeStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); },
  };
}

function makeSandbox() {
  const savedCalls = [];
  const sb = {
    console,
    innerWidth: 1280,
    innerHeight: 800,
    localStorage: makeStore(),
    matchMedia: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    setTimeout: () => 0, // no diferidos: el flujo showModal basta
    clearTimeout: () => {},
    addEventListener: () => {},
    MutationObserver: class { observe() {} disconnect() {} },
    HTMLDialogElement: MiniDialog,
    DATA: {},
    scheduleSave: (msg) => savedCalls.push(msg),
    __savedCalls: savedCalls,
  };
  const body = new MiniEl('body');
  const html = new MiniEl('html');
  html.appendChild(new MiniEl('head'));
  html.appendChild(body);
  sb.document = {
    readyState: 'complete',
    body,
    documentElement: html,
    createElement: (t) => (String(t).toLowerCase() === 'dialog' ? new MiniDialog() : new MiniEl(t)),
    querySelectorAll: (s) => html.querySelectorAll(s),
    querySelector: (s) => html.querySelector(s),
    getElementById: () => null,
    addEventListener: () => {},
  };
  sb.window = sb;
  sb.self = sb;
  sb.globalThis = sb;
  return sb;
}

function makeDialog(sb, id) {
  const dlg = new MiniDialog();
  dlg.id = id;
  const form = new MiniEl('form');
  const h = new MiniEl('h3');
  h.textContent = id;
  const x = new MiniEl('button');
  x.className = 'btn btn-icon';
  x.textContent = '✕';
  const row = new MiniEl('div');
  row.className = 'dlg-actions';
  const c = new MiniEl('button');
  c.className = 'btn';
  c.textContent = 'Cerrar';
  row.appendChild(c);
  form.appendChild(h);
  form.appendChild(x);
  form.appendChild(row);
  dlg.appendChild(form);
  sb.document.body.appendChild(dlg);
  return dlg;
}

function dragGrip(grip, x0, y0, x1, y1) {
  grip.dispatch('pointerdown', { clientX: x0, clientY: y0, pointerId: 7 });
  grip.dispatch('pointermove', { clientX: x1, clientY: y1, pointerId: 7 });
  grip.dispatch('pointerup', { clientX: x1, clientY: y1, pointerId: 7 });
}

describe('tamaño de pestaña compartido (dialogo-tamano)', () => {
  it('arrastrar guarda y se aplica a todas las demás secciones', () => {
    const sb = makeSandbox();
    vm.createContext(sb);
    const codigo = fs.readFileSync(resolverFuente('dialogo-tamano.js'), 'utf8');
    new vm.Script(codigo, { filename: 'dialogo-tamano.js' }).runInContext(sb);

    // 1) Abrir primera sección y arrastrar el tirador +120x+80.
    const dlgA = makeDialog(sb, 'dlgA');
    dlgA.showModal();
    const gripA = dlgA.querySelector('.dlg-resize-handle');
    const expA = dlgA.querySelector('.dlg-expand-btn');
    assert.ok(gripA, 'tirador ⤡ inyectado en el diálogo');
    assert.ok(expA, 'botón ⛶ inyectado en el diálogo');
    dragGrip(gripA, 500, 500, 620, 580);
    assert.equal(dlgA.style.width, '720px', 'ancho aplicado al arrastrar');
    assert.equal(dlgA.style.height, '480px', 'alto aplicado al arrastrar');

    // 2) Guardado: DATA.config + localStorage + aviso de guardado.
    // (spread: el objeto vive en el reino vm y deepEqual exige mismo prototipo)
    assert.deepEqual({ ...sb.DATA.config.dialogSize }, { w: 720, h: 480, expanded: false });
    assert.deepEqual(JSON.parse(sb.localStorage.getItem('cal13-dialog-size-v1')), { w: 720, h: 480, expanded: false });
    assert.ok(sb.__savedCalls.length > 0, 'scheduleSave invocado al soltar');

    // 3) Abrir segunda sección: hereda el MISMO tamaño.
    const dlgB = makeDialog(sb, 'dlgB');
    dlgB.showModal();
    assert.equal(dlgB.style.width, '720px', 'segunda sección hereda ancho');
    assert.equal(dlgB.style.height, '480px', 'segunda sección hereda alto');

    // 4) Agrandar ⛶ en una: se expande en TODAS.
    dlgB.querySelector('.dlg-expand-btn').click();
    assert.ok(dlgB.classList.contains('dlg-expanded'), 'segunda sección expandida');
    assert.ok(dlgA.classList.contains('dlg-expanded'), 'primera sección también expandida (vale para todas)');
    assert.equal(sb.DATA.config.dialogSize.expanded, true);

    // 5) Abrir tercera sección: nace ya expandida con el mismo tamaño.
    const dlgC = makeDialog(sb, 'dlgC');
    dlgC.showModal();
    assert.ok(dlgC.classList.contains('dlg-expanded'), 'tercera sección nace expandida');
    assert.equal(dlgC.style.width, dlgB.style.width, 'mismo ancho en la tercera');

    // 6) Doble clic al tirador restaura en todas.
    dlgA.querySelector('.dlg-resize-handle').dispatch('dblclick', {});
    assert.ok(!dlgA.classList.contains('dlg-expanded'), 'restaurada la primera');
    assert.ok(!dlgB.classList.contains('dlg-expanded'), 'restaurada la segunda');
  });

  it('tirador pequeño en la esquina (no tapa el Cerrar)', () => {
    const css = fs.readFileSync(resolverFuente('styles.css'), 'utf8');
    const chunk = css.split('@media').find((c) => c.includes('.dlg-resize-handle {'));
    assert.ok(chunk, 'bloque .dlg-resize-handle en el media PC');
    const m = /\.dlg-resize-handle \{([^}]+)\}/.exec(chunk);
    const px = (prop) => {
      const r = new RegExp(prop + ':\\s*(\\d+)px').exec(m[1]);
      return r ? +r[1] : null;
    };
    assert.ok(px('width') <= 30 && px('height') <= 30, 'tirador chico (≤30px), era 40px');
    assert.ok(px('bottom') <= 6 && px('right') <= 6, 'pegado a la esquina inferior derecha');
  });
});
