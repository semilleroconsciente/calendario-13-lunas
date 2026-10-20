// tests/storage.test.js — sobre versionado de web-api.js (save/load).
// Garantiza: el renderer sigue viendo el JSON de DATA sin cambios,
// legado sin sobre pasa tal cual, y el guardado es idempotente.
// Uso: node --test "tests/*.test.js"  (o npm test)
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
// Paso 3 del reorden src/: web-api.js vive en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');

function loadApi(initial) {
  const store = { 'cal13-data': initial };
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  };
  const sandbox = { window: {}, localStorage };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(resolverFuente('web-api.js'), 'utf8'), sandbox, { filename: 'web-api.js' });
  return { api: sandbox.window.api, store };
}

const SAMPLE = JSON.stringify({ notas: { '2026-10-10': 'riego almácigos' }, habitos: ['leer'] });

describe('sobre versionado (web-api.js)', () => {
  it('guardar envuelve y cargar devuelve el DATA original', async () => {
    const { api, store } = loadApi(undefined);
    assert.equal(await api.saveData(SAMPLE), true);
    const raw = store['cal13-data'];
    const env = JSON.parse(raw);
    assert.equal(env.app, 'cal13');
    assert.equal(env.v, 1);
    assert.ok(env.savedAt);
    assert.deepEqual(env.data, JSON.parse(SAMPLE));
    assert.equal(await api.loadData(), SAMPLE);
  });

  it('legado sin sobre pasa tal cual', async () => {
    const { api } = loadApi(SAMPLE);
    assert.equal(await api.loadData(), SAMPLE);
  });

  it('guardar un sobre ya envuelto es idempotente', async () => {
    const { api, store } = loadApi(undefined);
    await api.saveData(SAMPLE);
    const once = store['cal13-data'];
    await api.saveData(once);
    assert.equal(store['cal13-data'], once);
    assert.equal(await api.loadData(), SAMPLE);
  });

  it('dato corrupto no rompe: se devuelve crudo (el llamador usa {})', async () => {
    const { api } = loadApi('%%%no-json%%%');
    assert.equal(await api.loadData(), '%%%no-json%%%');
  });

  it('vacio devuelve {}', async () => {
    const { api } = loadApi(undefined);
    delete api.__x;
    assert.equal(await api.loadData(), '{}');
  });
});
