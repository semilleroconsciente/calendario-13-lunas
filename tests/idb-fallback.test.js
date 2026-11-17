'use strict';
// ============================================================================
// tests/idb-fallback.test.js — IndexedDB con degradado (mejora #5).
//
// Sin indexedDB en el entorno, storage-idb.js baja a localStorage y mantiene
// el roundtrip get/set, las bitácoras y la migración por grupos.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente, memoriaStorage, igualJSON } = require('./helpers.cjs');

function cargarShim() {
  const sandbox = { window: {}, localStorage: memoriaStorage() };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(leerFuente('storage-idb.js'), sandbox, { filename: 'storage-idb.js' });
  return sandbox.window.cal13idb;
}

// --- Suite -------------------------------------------------------------------
describe('storage-idb con fallback a localStorage', () => {
  it('sin indexedDB usa el backend localstorage con roundtrip', async () => {
    const idb = cargarShim();
    assert.ok(idb, 'window.cal13idb no expuesto');
    await idb.set('k1', 'hola');
    assert.equal(await idb.get('k1'), 'hola');
    assert.equal(idb.backend(), 'localstorage');
    await idb.del('k1');
    assert.equal(await idb.get('k1'), null);
  });

  it('bitácoras en fallback: guardar, leer, listar, contar y borrar', async () => {
    const idb = cargarShim();
    assert.equal(await idb.bitacorasContar(), 0);
    await idb.bitacoraGuardar('calendario', { titulo: 'Calendario', keys: { ciclo: [1, 2] } });
    await idb.bitacoraGuardar('pesca', { titulo: 'Pesca', keys: {} });
    assert.equal(await idb.bitacorasContar(), 2);

    const leida = await idb.bitacoraLeer('calendario');
    assert.equal(leida.titulo, 'Calendario');
    igualJSON(leida.keys, { ciclo: [1, 2] });

    const lista = await idb.bitacorasListar();
    assert.deepEqual([...lista.map((x) => x.id)].sort(), ['calendario', 'pesca']);

    await idb.bitacoraBorrar('pesca');
    assert.equal(await idb.bitacoraLeer('pesca'), null);
    assert.equal(await idb.bitacorasContar(), 1);
  });

  it('info() trae forma y latencia medida aunque sea fallback', async () => {
    const idb = cargarShim();
    const info = await idb.info();
    assert.equal(info.backend, 'localstorage');
    assert.ok(typeof info.latenciaMs === 'number' && info.latenciaMs >= 0, 'sin latenciaMs');
    assert.ok('quota' in info && 'usage' in info, 'sin cuota/uso');
  });

  it('migrarGruposDesdeUserData parte por grupos sin borrar el origen', async () => {
    const idb = cargarShim();
    const userData = { ciclo: 'x', notas: 'y', otra: 'z' };
    const grupos = [
      { id: 'cal', titulo: 'Calendario', keys: ['ciclo', 'notas'] },
      { id: 'vacio', titulo: 'Vacío', keys: ['inexistente'] },
    ];
    const rep = await idb.migrarGruposDesdeUserData(userData, grupos);
    assert.equal(rep.migrados, 1);
    assert.equal(rep.claves, 2);
    assert.ok(rep.bytes > 0, 'sin bytes migrados');
    assert.deepEqual(userData, { ciclo: 'x', notas: 'y', otra: 'z' }, 'el origen no debe mutar');

    const g = await idb.bitacoraLeer('cal');
    igualJSON(g.keys, { ciclo: 'x', notas: 'y' });
  });
});
