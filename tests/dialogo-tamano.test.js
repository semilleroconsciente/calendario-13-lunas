// tests/dialogo-tamano.test.js — verifica que el tamaño dejado con el
// resize NATIVO (esquina inferior derecha) se guarde cuando se quiera y se
// aplique a CUALQUIER ventana, sin botones extra, y que SOLO la ✕ de cerrar
// quede persistente (flotante en la misma posición).
//
// Carga dialogo-tamano.js en un contexto `vm` con un DOM mínimo y simula:
// abrir → fijar tamaño vía __dlgSize → abrir otras ventanas.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
// Paso 3 del reorden src/: las fuentes viven en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');

// ---------- DOM mínimo ----------
// OJO: las clases se crean FRESCAS por sandbox (makeMini). Si se compartieran,
// el parcheo de `showModal` que hace el módulo sobre
// `HTMLDialogElement.prototype` cruzaría datos entre tests (cada `vm`
// compartiría el prototipo). En la app real hay un solo contexto y no pasa.
function makeMini() {
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
  removeChild(c) {
    const i = this.children.indexOf(c);
    if (i >= 0) this.children.splice(i, 1);
    c.parentNode = null;
    return c;
  }
  setAttribute(k, v) { this['attr:' + k] = String(v); }
  getAttribute(k) { return Object.prototype.hasOwnProperty.call(this, 'attr:' + k) ? this['attr:' + k] : null; }
  hasAttribute(k) {
    if (k === 'open') return !!this.open;
    return Object.prototype.hasOwnProperty.call(this, 'attr:' + k);
  }
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
    const w = px(this.style.width, 600);
    const h = px(this.style.height, 400);
    const top = 100, left = 340;
    return { width: w, height: h, x: left, y: top, top, left, right: left + w, bottom: top + h };
  }
  _walk(out, test) {
    if (test(this)) out.push(this);
    this.children.forEach((c) => c._walk(out, test));
    return out;
  }
  _matchSimple(sel) {
    const s = sel.trim();
    if (s.startsWith('.')) return this._cls.has(s.slice(1));
    const m = /^([a-z][a-z0-9]*)(?:\.([a-z0-9_-]+))?$/i.exec(s);
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

  return { MiniEl, MiniDialog };
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
  const { MiniEl, MiniDialog } = makeMini();
  const savedCalls = [];
  const sb = {
    console,
    innerWidth: 1280,
    innerHeight: 800,
    localStorage: makeStore(),
    matchMedia: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    setTimeout: (fn) => 0,
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
  sb.__MiniEl = MiniEl;
  sb.__MiniDialog = MiniDialog;
  return sb;
}

function makeDialog(sb, id) {
  const MiniDialog = sb.__MiniDialog;
  const MiniEl = sb.__MiniEl;
  const dlg = new MiniDialog();
  dlg.id = id;
  const form = new MiniEl('form');
  const h = new MiniEl('h3');
  h.textContent = id;
  const x = new MiniEl('button');
  x.className = 'btn btn-icon';
  x.setAttribute('title', 'Cerrar');
  x.setAttribute('aria-label', 'Cerrar');
  x.textContent = '✕';
  const head = new MiniEl('div');
  head.className = 'dlg-actions';
  head.appendChild(h);
  head.appendChild(x);
  const row = new MiniEl('div');
  row.className = 'dlg-actions';
  const c = new MiniEl('button');
  c.className = 'btn';
  c.textContent = 'Cerrar';
  row.appendChild(c);
  form.appendChild(head);
  form.appendChild(row);
  dlg.appendChild(form);
  sb.document.body.appendChild(dlg);
  return dlg;
}

describe('tamaño de sección nativo compartido (dialogo-tamano)', () => {
  it('solo resize nativo: el tamaño se cambia cuando se quiera y vale para cualquier ventana', () => {
    const sb = makeSandbox();
    vm.createContext(sb);
    const codigo = fs.readFileSync(resolverFuente('dialogo-tamano.js'), 'utf8');
    // Sin botones legacy en el código (solo limpieza de restos antiguos).
    assert.ok(!codigo.includes("className = 'dlg-expand-btn'"), 'no crea botón agrandar');
    assert.ok(!codigo.includes("className = 'dlg-resize-handle'"), 'no crea tirador custom');
    assert.ok(!codigo.includes("textContent = '⛶'"), 'sin icono ⛶');
    new vm.Script(codigo, { filename: 'dialogo-tamano.js' }).runInContext(sb);

    // 1) Abrir primera ventana: NO hay botones extra, sí clase resizable.
    const dlgA = makeDialog(sb, 'dlgA');
    dlgA.showModal();
    assert.equal(dlgA.querySelector('.dlg-resize-handle'), null, 'sin tirador custom');
    assert.equal(dlgA.querySelector('.dlg-expand-btn'), null, 'sin botón agrandar');
    assert.ok(dlgA.classList.contains('dlg-resizable'), 'clase dlg-resizable para resize nativo');

    // 2) Cambiar el tamaño cuando se quiera (vía API que invoca el
    // ResizeObserver con debounce al soltar el tirador nativo).
    assert.ok(sb.__dlgSize, 'API __dlgSize expuesta');
    sb.__dlgSize.setAndBroadcast({ w: 720, h: 480 });
    assert.equal(dlgA.style.width, '720px', 'ancho aplicado');
    assert.equal(dlgA.style.height, '480px', 'alto aplicado');

    // 3) Guardado: DATA.config + localStorage + aviso de guardado.
    assert.deepEqual({ ...sb.DATA.config.dialogSize }, { w: 720, h: 480 });
    assert.deepEqual(JSON.parse(sb.localStorage.getItem('cal13-dialog-size-v1')), { w: 720, h: 480 });
    assert.ok(sb.__savedCalls.length > 0, 'scheduleSave invocado al guardar');

    // 4) Cualquier ventana nueva hereda el MISMO tamaño.
    const dlgB = makeDialog(sb, 'dlgB');
    dlgB.showModal();
    assert.equal(dlgB.style.width, '720px', 'segunda ventana hereda ancho');
    assert.equal(dlgB.style.height, '480px', 'segunda ventana hereda alto');
    const dlgC = makeDialog(sb, 'dlgC');
    dlgC.showModal();
    assert.equal(dlgC.style.width, '720px', 'tercera ventana hereda ancho');

    // 5) Cambiar de nuevo el tamaño re-aplica a TODAS las abiertas.
    sb.__dlgSize.setAndBroadcast({ w: 800, h: 500 });
    assert.equal(dlgA.style.width, '800px', 'primera actualizada al re-cambiar');
    assert.equal(dlgB.style.width, '800px', 'segunda actualizada al re-cambiar');
    assert.equal(dlgC.style.height, '500px', 'tercera actualizada al re-cambiar');
    assert.deepEqual({ ...sb.__dlgSize.getSaved() }, { w: 800, h: 500 });
  });

  it('no se agranda solo: el eco del apply propio no se re-guarda', () => {
    const sb = makeSandbox();
    vm.createContext(sb);
    const codigo = fs.readFileSync(resolverFuente('dialogo-tamano.js'), 'utf8');
    new vm.Script(codigo, { filename: 'dialogo-tamano.js' }).runInContext(sb);
    assert.ok(sb.__dlgSize.checkResize, 'API checkResize expuesta');

    const dlgA = makeDialog(sb, 'dlgA');
    dlgA.showModal();
    sb.__dlgSize.setAndBroadcast({ w: 720, h: 480 });
    const savesTrasFijar = sb.__savedCalls.length;
    assert.ok(savesTrasFijar > 0, 'fijar avisa guardado una vez');

    // El observador ve el tamaño que pusimos nosotros → eco, no guarda.
    sb.__dlgSize.checkResize(dlgA);
    assert.equal(sb.__savedCalls.length, savesTrasFijar, 'eco propio no re-guarda');
    assert.deepEqual({ ...sb.__dlgSize.getSaved() }, { w: 720, h: 480 });

    // Abrir otra ventana aplica el mismo tamaño y tampoco deriva.
    const dlgB = makeDialog(sb, 'dlgB');
    dlgB.showModal();
    for (let i = 0; i < 5; i++) {
      sb.__dlgSize.checkResize(dlgA);
      sb.__dlgSize.checkResize(dlgB);
    }
    assert.deepEqual({ ...sb.__dlgSize.getSaved() }, { w: 720, h: 480 }, 'sin deriva tras ecos repetidos');
    assert.equal(dlgB.style.width, '720px', 'segunda ventana estable');
    assert.equal(sb.__savedCalls.length, savesTrasFijar, 'sin guardados extra');
  });

  it('arrastrar la esquina (gesto real) sí se guarda para todas', () => {
    const sb = makeSandbox();
    vm.createContext(sb);
    const codigo = fs.readFileSync(resolverFuente('dialogo-tamano.js'), 'utf8');
    new vm.Script(codigo, { filename: 'dialogo-tamano.js' }).runInContext(sb);
    const dlgA = makeDialog(sb, 'dlgA');
    dlgA.showModal();
    sb.__dlgSize.setAndBroadcast({ w: 720, h: 480 });
    const dlgB = makeDialog(sb, 'dlgB');
    dlgB.showModal();

    // La persona inicia el gesto sobre el tirador y arrastra a 900x600.
    sb.__dlgSize._testGrip(dlgA);
    dlgA.style.width = '900px';
    dlgA.style.height = '600px';
    sb.__dlgSize.checkResize(dlgA);
    assert.deepEqual({ ...sb.__dlgSize.getSaved() }, { w: 900, h: 600 }, 'gesto real guardado');
    assert.equal(dlgB.style.width, '900px', 're-aplicado a la otra ventana');
    assert.equal(dlgB.style.height, '600px', 're-aplicado el alto también');
    const savesTrasGesto = sb.__savedCalls.length;

    // Cambio programático (contenido) sin gesto: NO se guarda, solo re-marca.
    // (la persona ya soltó e hizo otra pulsación: el gesto anterior caducó)
    sb.__dlgSize._testPressElsewhere();
    dlgA.style.width = '950px';
    dlgA.style.height = '620px';
    sb.__dlgSize.checkResize(dlgA);
    assert.deepEqual({ ...sb.__dlgSize.getSaved() }, { w: 900, h: 600 }, 'sin gesto no se guarda');
    assert.equal(sb.__savedCalls.length, savesTrasGesto, 'sin avisos extra');

    // Gesto sin movimiento posterior: nada nuevo que guardar.
    sb.__dlgSize._testGrip(dlgA);
    sb.__dlgSize.checkResize(dlgA);
    assert.deepEqual({ ...sb.__dlgSize.getSaved() }, { w: 900, h: 600 }, 'sin cambio no se re-guarda');
  });

  it('abrir y cerrar repetido no agranda ni guarda nada solo', () => {
    const sb = makeSandbox();
    vm.createContext(sb);
    const codigo = fs.readFileSync(resolverFuente('dialogo-tamano.js'), 'utf8');
    new vm.Script(codigo, { filename: 'dialogo-tamano.js' }).runInContext(sb);
    const dlg = makeDialog(sb, 'dlgOC');
    dlg.showModal();
    // Abrir sin elección previa no inventa guardado.
    sb.__dlgSize.checkResize(dlg);
    assert.equal(sb.__savedCalls.length, 0, 'abrir no guarda solo');
    assert.deepEqual({ ...sb.__dlgSize.getSaved() }, { w: 0, h: 0 });

    // Elección de la persona vía API y luego 5 ciclos abrir/cerrar.
    sb.__dlgSize.setAndBroadcast({ w: 700, h: 460 });
    const savesTrasElegir = sb.__savedCalls.length;
    for (let i = 0; i < 5; i++) {
      dlg.open = false; // cerrar
      sb.__dlgSize.checkResize(dlg); // (cerrado: se ignora)
      dlg.showModal(); // abrir (el parche re-aplica el tamaño)
      sb.__dlgSize.checkResize(dlg); // (sin gesto: no guarda)
    }
    assert.deepEqual({ ...sb.__dlgSize.getSaved() }, { w: 700, h: 460 }, 'ciclos sin deriva');
    assert.equal(dlg.style.width, '700px', 'mismo ancho tras los ciclos');
    assert.equal(dlg.style.height, '460px', 'mismo alto tras los ciclos');
    assert.equal(sb.__savedCalls.length, savesTrasElegir, 'sin guardados extra en los ciclos');
  });

  it('solo la ✕ es persistente: flotante en la misma posición, el título no', () => {
    const sb = makeSandbox();
    vm.createContext(sb);
    const codigo = fs.readFileSync(resolverFuente('dialogo-tamano.js'), 'utf8');
    new vm.Script(codigo, { filename: 'dialogo-tamano.js' }).runInContext(sb);
    const dlg = makeDialog(sb, 'dlgX');
    dlg.showModal();

    const floats = dlg.querySelectorAll('.dlg-close-float');
    assert.equal(floats.length, 1, 'un solo elemento persistente');
    const x = floats[0];
    assert.equal(x.textContent, '✕', 'el persistente es la ✕ de cerrar');
    // Misma posición: top/right fijados desde el rect del diálogo.
    assert.ok(/^\d+px$/.test(x.style.top || ''), 'top fijado en la misma posición');
    assert.ok(/^\d+px$/.test(x.style.right || ''), 'right fijado en la misma posición');
    // El título NO flota.
    const h3 = dlg.querySelector('h3');
    assert.ok(!h3.classList.contains('dlg-close-float'), 'el título no es flotante');

    // CSS: solo la ✕ es fixed; la cabecera NO es sticky.
    const css = fs.readFileSync(resolverFuente('styles.css'), 'utf8');
    assert.ok(css.includes('.dlg-close-float'), 'regla .dlg-close-float presente');
    const fIdx = css.indexOf('.dlg-close-float');
    const fZone = css.slice(fIdx, fIdx + 400);
    assert.ok(fZone.includes('position: fixed') || fZone.includes('position:fixed'), 'la ✕ es fixed');
    const headRule = /\.dlg-actions:first-child[^{]*\{[^}]*position:\s*sticky/s.test(css);
    assert.ok(!headRule, 'la cabecera completa NO es sticky (solo la ✕)');
  });

  it('limpia botones legacy si existían y resetea', () => {
    const sb = makeSandbox();
    vm.createContext(sb);
    const codigo = fs.readFileSync(resolverFuente('dialogo-tamano.js'), 'utf8');
    new vm.Script(codigo, { filename: 'dialogo-tamano.js' }).runInContext(sb);
    const dlg = makeDialog(sb, 'dlgY');
    // Simula restos de versión anterior.
    const form = dlg.querySelector('form');
    const legacy1 = sb.document.createElement('button');
    legacy1.className = 'dlg-expand-btn';
    const legacy2 = sb.document.createElement('button');
    legacy2.className = 'dlg-resize-handle';
    form.appendChild(legacy1);
    form.appendChild(legacy2);
    dlg.showModal();
    assert.equal(dlg.querySelector('.dlg-expand-btn'), null, 'botón legacy eliminado');
    assert.equal(dlg.querySelector('.dlg-resize-handle'), null, 'tirador legacy eliminado');
    sb.__dlgSizeReset();
    assert.deepEqual({ ...sb.DATA.config.dialogSize }, { w: 0, h: 0 });
  });

  it('CSS: resize nativo en la esquina + botones extra ocultos', () => {
    const css = fs.readFileSync(resolverFuente('styles.css'), 'utf8');
    assert.ok(css.includes('.dlg-expand-btn, .dlg-resize-handle'), 'regla de ocultado legacy');
    assert.ok(css.includes('display: none !important'), 'botones extra siempre ocultos');
    const pcChunk = css.split('@media').find((c) => c.includes('dialog.dlg-resizable'));
    assert.ok(pcChunk, 'bloque dialog.dlg-resizable en el media PC');
    assert.ok(/dialog\.dlg-resizable\s*\{[^}]*resize:\s*both/.test(pcChunk), 'resize: both nativo');
    assert.ok(/dialog\.dlg-resizable\s*\{[^}]*box-sizing:\s*border-box/.test(pcChunk), 'border-box: sin deriva que agrande solo');
  });
});
