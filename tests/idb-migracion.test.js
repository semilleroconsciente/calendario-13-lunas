// tests/idb-migracion.test.js — migración total a IndexedDB (v1.8).
// web-api parte las claves de bitácora al store propio (uid:grupo) y el blob
// se adelgaza; al cargar se superponen. Sin grupos registrados: legado.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
// Paso 3 del reorden src/: las fuentes viven en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');

function contexto() {
  const store = {};
  const keysOf = () => Object.keys(store);
  const sb = {
    console,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { for (const k of keysOf()) delete store[k]; },
      key: (i) => keysOf()[i] || null,
    },
    document: { createElement: () => null, body: null },
    navigator: {},
  };
  Object.defineProperty(sb.localStorage, 'length', { get: () => keysOf().length });
  sb.window = sb;
  sb.self = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(resolverFuente('storage-idb.js'), 'utf8'), sb, { filename: 'storage-idb.js' });
  vm.runInContext(fs.readFileSync(resolverFuente('web-api.js'), 'utf8'), sb, { filename: 'web-api.js' });
  return { sb, store };
}
function j(v) { return JSON.stringify(v); }
// Orden-insensible (el overlay reinserta claves al final): ordena recursivo.
function norm(v) {
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = norm(v[k]);
    return o;
  }
  return v;
}

const DATA = {
  actual: 'u1',
  config: { theme: 'noche' },
  notas: {
    u1: { cycles: { '2026': { n: 1 } }, fishingLog: [7], suelto: 'queda' },
    u2: { birds: { b: 2 } },
  },
};
const GRUPOS = [
  { id: 'cal', keys: ['cycles'] },
  { id: 'pes', keys: ['fishingLog', 'birds'] },
];

describe('migración IDB total', () => {
  it('save adelgaza el blob y load restaura (roundtrip)', async () => {
    const { sb, store } = contexto();
    assert.ok(sb.window.api, 'window.api no expuesto');
    assert.equal(await sb.window.cal13idb.registrarGrupos(GRUPOS), 2);
    assert.equal(await sb.window.api.saveData(j(DATA)), true);
    const blob = JSON.parse(store['cal13-data']);
    const du1 = blob.data.notas.u1;
    assert.ok(!('cycles' in du1) && !('fishingLog' in du1), 'blob no se adelgazó: ' + j(Object.keys(du1)));
    assert.equal(du1.suelto, 'queda');
    assert.equal(blob.data.config.theme, 'noche');
    const rec = await sb.window.cal13idb.bitacoraLeer('u1:cal');
    assert.equal(j(rec.keys), j({ cycles: { '2026': { n: 1 } } }));
    const out = j(norm(JSON.parse(await sb.window.api.loadData())));
    assert.equal(out, j(norm(DATA)), 'load no restauró el DATA original');
  });

  it('sin grupos registrados: blob completo (legado)', async () => {
    const { sb, store } = contexto();
    assert.equal(await sb.window.api.saveData(j(DATA)), true);
    const blob = JSON.parse(store['cal13-data']);
    assert.ok('cycles' in blob.data.notas.u1, 'legado debió conservar cycles');
    assert.equal(j(JSON.parse(await sb.window.api.loadData())), j(DATA));
  });

  it('store ausente pero blob con claves: no se pierde nada', async () => {
    const { sb } = contexto();
    await sb.window.cal13idb.registrarGrupos(GRUPOS);
    // Blob viejo (pre-migración) con todo adentro y store vacío.
    sb.localStorage.setItem('cal13-data', JSON.stringify({ app: 'cal13', v: 1, data: DATA }));
    const out = j(norm(JSON.parse(await sb.window.api.loadData())));
    assert.equal(out, j(norm(DATA)), 'blob pre-migración debe leerse intacto');
  });
});
