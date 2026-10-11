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
  const sandbox = {
    window: {},
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'storage-idb.js'), 'utf8'), sandbox);
  return sandbox.window.cal13idb;
}

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
});
