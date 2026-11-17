'use strict';
// ============================================================================
// tests/storage.test.js — sobre versionado de web-api.js (save/load).
//
// Garantiza: el renderer sigue viendo el JSON de DATA sin cambios, el legado
// sin sobre pasa tal cual y el guardado es idempotente.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente } = require('./helpers.cjs');

function cargarApi(inicial) {
  const store = { 'cal13-data': inicial };
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  };
  const sandbox = { window: {}, localStorage };
  vm.createContext(sandbox);
  vm.runInContext(leerFuente('web-api.js'), sandbox, { filename: 'web-api.js' });
  return { api: sandbox.window.api, store };
}

const MUESTRA = JSON.stringify({ notas: { '2026-10-10': 'riego almácigos' }, habitos: ['leer'] });

// --- Suite -------------------------------------------------------------------
describe('Sobre versionado (web-api.js)', () => {
  it('guardar envuelve y cargar devuelve el DATA original', async () => {
    const { api, store } = cargarApi(undefined);
    assert.equal(await api.saveData(MUESTRA), true);
    const env = JSON.parse(store['cal13-data']);
    assert.equal(env.app, 'cal13');
    assert.equal(env.v, 1);
    assert.equal(env.schema, 1);
    assert.ok(env.savedAt, 'falta savedAt en el sobre');
    assert.deepEqual(env.data, JSON.parse(MUESTRA));
    assert.equal(await api.loadData(), MUESTRA);
  });

  it('el legado sin sobre pasa tal cual', async () => {
    const { api } = cargarApi(MUESTRA);
    assert.equal(await api.loadData(), MUESTRA);
  });

  it('guardar un sobre ya envuelto es idempotente', async () => {
    const { api, store } = cargarApi(undefined);
    await api.saveData(MUESTRA);
    const unaVez = store['cal13-data'];
    await api.saveData(unaVez);
    assert.equal(store['cal13-data'], unaVez, 'el segundo guardado re-envolvió');
    assert.equal(await api.loadData(), MUESTRA);
  });

  it('el dato corrupto se rechaza en vez de devolverse como válido', async () => {
    const { api } = cargarApi('%%%no-json%%%');
    await assert.rejects(() => api.loadData(), /datos-corruptos/);
  });

  it('el almacén vacío devuelve {}', async () => {
    const { api } = cargarApi(undefined);
    assert.equal(await api.loadData(), '{}');
  });
});
