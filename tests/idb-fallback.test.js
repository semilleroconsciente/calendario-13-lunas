// tests/idb-fallback.test.js — mejora #5 (IndexedDB con fallback).
// Sin indexedDB en el entorno, storage-idb.js debe degradar a localStorage
// y mantener roundtrip get/set.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function loadShim() {
  const store = {};
  const keysOf = () => Object.keys(store);
  const sandbox = {
    window: {},
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { for (const k of keysOf()) delete store[k]; },
      key: (i) => keysOf()[i] || null,
    },
  };
  Object.defineProperty(sandbox.localStorage, 'length', { get: () => keysOf().length });
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'storage-idb.js'), 'utf8'), sandbox);
  return sandbox.window.cal13idb;
}
// Los objetos cruzan el borde vm (prototipo de otro realm): se comparan
// por JSON para no pelear con deepStrictEqual entre realms.
function j(v) { return JSON.stringify(v); }

describe('storage-idb fallback', () => {
  it('sin indexedDB: backend localstorage + roundtrip', async () => {
    const idb = loadShim();
    assert.ok(idb, 'window.cal13idb no expuesto');
    await idb.set('k1', 'hola');
    assert.equal(await idb.get('k1'), 'hola');
    assert.equal(idb.backend(), 'localstorage');
    await idb.del('k1');
    assert.equal(await idb.get('k1'), null);
  });

  it('store bitacoras en fallback: guardar/leer/listar/contar/borrar', async () => {
    const idb = loadShim();
    assert.equal(await idb.bitacorasContar(), 0);
    await idb.bitacoraGuardar('calendario', { titulo: 'Calendario', keys: { ciclo: [1, 2] } });
    await idb.bitacoraGuardar('pesca', { titulo: 'Pesca', keys: {} });
    assert.equal(await idb.bitacorasContar(), 2);
    const leida = await idb.bitacoraLeer('calendario');
    assert.equal(leida.titulo, 'Calendario');
    assert.equal(j(leida.keys), j({ ciclo: [1, 2] }));
    const lista = await idb.bitacorasListar();
    assert.deepEqual([...lista.map((x) => x.id)].sort(), ['calendario', 'pesca']);
    await idb.bitacoraBorrar('pesca');
    assert.equal(await idb.bitacoraLeer('pesca'), null);
    assert.equal(await idb.bitacorasContar(), 1);
  });

  it('info(): forma + latencia medida aunque sea fallback', async () => {
    const idb = loadShim();
    const info = await idb.info();
    assert.equal(info.backend, 'localstorage');
    assert.ok(typeof info.latenciaMs === 'number' && info.latenciaMs >= 0, 'sin latenciaMs');
    assert.ok('quota' in info && 'usage' in info, 'sin cuota/uso');
  });

  it('migrarGruposDesdeUserData: parte por grupos sin borrar origen', async () => {
    const idb = loadShim();
    const userData = { ciclo: 'x', notas: 'y', otra: 'z' };
    const grupos = [
      { id: 'calendario', titulo: 'Calendario', keys: ['ciclo', 'notas'] },
      { id: 'vacio', titulo: 'Vacío', keys: ['inexistente'] },
    ];
    const rep = await idb.migrarGruposDesdeUserData(userData, grupos);
    assert.equal(rep.migrados, 1);
    assert.equal(rep.claves, 2);
    assert.ok(rep.bytes > 0);
    assert.deepEqual(userData, { ciclo: 'x', notas: 'y', otra: 'z' });
    const g = await idb.bitacoraLeer('calendario');
    assert.equal(j(g.keys), j({ ciclo: 'x', notas: 'y' }));
  });
});
