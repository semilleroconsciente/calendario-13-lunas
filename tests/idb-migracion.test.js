'use strict';
// ============================================================================
// tests/idb-migracion.test.js — migración total a IndexedDB (v1.8).
//
// web-api parte las claves de bitácora al store propio (uid:grupo) y el blob
// se adelgaza; al cargar se superponen. Sin grupos registrados: legado.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente, memoriaStorage, ordenarClaves } = require('./helpers.cjs');

function crearContexto() {
  const store = memoriaStorage();
  const sb = {
    console,
    localStorage: store,
    document: { createElement: () => null, body: null },
    navigator: {},
  };
  sb.window = sb;
  sb.self = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(leerFuente('storage-idb.js'), sb, { filename: 'storage-idb.js' });
  vm.runInContext(leerFuente('web-api.js'), sb, { filename: 'web-api.js' });
  return { sb, store };
}

// JSON canónico (orden de claves irrelevante: el overlay reinserta al final).
const canon = (v) => JSON.stringify(ordenarClaves(v));

// --- Datos testigo -----------------------------------------------------------
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

// --- Suite -------------------------------------------------------------------
describe('Migración total a IndexedDB', () => {
  it('save adelgaza el blob y load restaura el DATA (roundtrip)', async () => {
    const { sb, store } = crearContexto();
    assert.ok(sb.window.api, 'window.api no expuesto');
    assert.equal(await sb.window.cal13idb.registrarGrupos(GRUPOS), 2);
    assert.equal(await sb.window.api.saveData(canon(DATA)), true);

    const blob = JSON.parse(store.getItem('cal13-data'));
    const du1 = blob.data.notas.u1;
    assert.ok(!('cycles' in du1) && !('fishingLog' in du1), 'blob no se adelgazó: ' + Object.keys(du1));
    assert.equal(du1.suelto, 'queda');
    assert.equal(blob.data.config.theme, 'noche');

    const rec = await sb.window.cal13idb.bitacoraLeer('u1:cal');
    assert.equal(canon(rec.keys), canon({ cycles: { '2026': { n: 1 } } }));

    const out = canon(JSON.parse(await sb.window.api.loadData()));
    assert.equal(out, canon(DATA), 'load no restauró el DATA original');
  });

  it('sin grupos registrados guarda el blob completo (legado)', async () => {
    const { sb, store } = crearContexto();
    assert.equal(await sb.window.api.saveData(canon(DATA)), true);
    const blob = JSON.parse(store.getItem('cal13-data'));
    assert.ok('cycles' in blob.data.notas.u1, 'legado debió conservar cycles');
    assert.equal(canon(JSON.parse(await sb.window.api.loadData())), canon(DATA));
  });

  it('con store ausente pero blob con claves no se pierde nada', async () => {
    const { sb } = crearContexto();
    await sb.window.cal13idb.registrarGrupos(GRUPOS);
    // Blob viejo (pre-migración) con todo adentro y store vacío.
    sb.localStorage.setItem('cal13-data', JSON.stringify({ app: 'cal13', v: 1, data: DATA }));
    const out = canon(JSON.parse(await sb.window.api.loadData()));
    assert.equal(out, canon(DATA), 'el blob pre-migración debe leerse intacto');
  });
});
