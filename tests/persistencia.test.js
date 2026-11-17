'use strict';
// ============================================================================
// tests/persistencia.test.js — riesgos P0 de datos (DATA-01/02/03/05).
//
// Usa un IndexedDB falso en memoria (tests/helpers.cjs) para recorrer el
// camino real de storage-idb.js, no solo el fallback a localStorage.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {
  leerFuente,
  memoriaStorage,
  storageQueFalla,
  crearIndexedDBFalso,
} = require('./helpers.cjs');

function crearContexto(opciones) {
  const opts = opciones || {};
  const sb = {
    console,
    localStorage: opts.storage || memoriaStorage(),
    indexedDB: opts.idb || crearIndexedDBFalso(),
    navigator: {},
    document: { createElement: () => null, body: null },
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init && init.detail; }
    },
    setTimeout,
    clearTimeout,
    saveTimer: null,
  };
  sb.window = sb;
  sb.self = sb;
  sb.globalThis = sb;
  sb.dispatchEvent = () => {};
  vm.createContext(sb);
  vm.runInContext(leerFuente('storage-idb.js'), sb, { filename: 'storage-idb.js' });
  vm.runInContext(leerFuente('data-schema.js'), sb, { filename: 'data-schema.js' });
  vm.runInContext(leerFuente('web-api.js'), sb, { filename: 'web-api.js' });
  vm.runInContext(leerFuente('core-storage.js'), sb, { filename: 'core-storage.js' });
  return sb;
}

const USUARIOS = [
  { id: 'u1', nombre: 'Uno' },
  { id: 'u2', nombre: 'Dos' },
];
const GRUPOS = [
  { id: 'cal', keys: ['cycles'] },
  { id: 'pesca', keys: ['fishingLog'] },
];

describe('Persistencia: contrato real de escritura', () => {
  it('con IndexedDB disponible confirma backend indexeddb', async () => {
    const sb = crearContexto();
    const r = await sb.window.cal13idb.set('k1', 'hola');
    assert.equal(r.ok, true);
    assert.equal(r.backend, 'indexeddb');
    assert.equal(r.degradado, false);
    assert.equal(await sb.window.cal13idb.get('k1'), 'hola');
  });

  it('si IDB falla pero localStorage escribe, reporta degradado (no éxito silencioso)', async () => {
    const sb = crearContexto({ idb: crearIndexedDBFalso({ fallar: { kv: { put: true } } }) });
    const r = await sb.window.cal13idb.set('k2', 'valor');
    assert.equal(r.ok, true);
    assert.equal(r.backend, 'localstorage');
    assert.equal(r.degradado, true);
  });

  it('si IDB y localStorage fallan, saveData devuelve false y estado temporal', async () => {
    const sb = crearContexto({
      storage: storageQueFalla(),
      idb: crearIndexedDBFalso({ fallar: { kv: { put: true } } }),
    });
    const ok = await sb.window.api.saveData(JSON.stringify({ notas: {} }));
    assert.equal(ok, false, 'un fallo total no puede anunciarse como guardado');
    assert.equal(sb.window.api.lastSaveState.ok, false);
    assert.equal(sb.window.api.lastSaveState.temporal, true);
  });

  it('un borrado no se declara completo si el espejo localStorage falla', async () => {
    const sb = crearContexto({ storage: storageQueFalla() });
    await sb.window.cal13idb.set('k3', 'valor');
    const r = await sb.window.cal13idb.del('k3');
    assert.equal(r.ok, false, 'un espejo sin limpiar impide declarar borrado completo');
    assert.equal(r.parcial, true);
  });

  it('no adelgaza el blob si el store de bitácoras no pudo escribir', async () => {
    const sb = crearContexto({
      storage: storageQueFalla(),
      idb: crearIndexedDBFalso({ fallar: { bitacoras: { put: true } } }),
    });
    await sb.window.cal13idb.registrarGrupos(GRUPOS);
    const data = {
      actual: 'u1',
      usuarios: [USUARIOS[0]],
      notas: { u1: { cycles: { '2026': { n: 1 } } } },
    };
    const ok = await sb.window.api.saveData(JSON.stringify(data));
    assert.equal(ok, true, 'el blob principal sí se guardó en IDB');
    const crudo = await sb.window.cal13idb.get('cal13-data');
    const env = JSON.parse(crudo);
    assert.ok(env.data.notas.u1.cycles, 'las claves no deben borrarse si el store falló');
  });
});

describe('Esquema y carga segura (MIG-01)', () => {
  it('envuelve el guardado con la versión de esquema actual', async () => {
    const sb = crearContexto();
    assert.equal(await sb.window.api.saveData(JSON.stringify({ usuarios: [{ id: 'u1', nombre: 'Uno' }], notas: {} })), true);
    const env = JSON.parse(await sb.window.cal13idb.get('cal13-data'));
    assert.equal(env.schema, sb.window.cal13schema.SCHEMA_VERSION);
    assert.ok(env.data);
  });

  it('rechaza un esquema futuro al cargar y no lo trata como datos vacíos', async () => {
    const sb = crearContexto();
    await sb.window.cal13idb.set('cal13-data', JSON.stringify({
      app: 'cal13', v: 1, schema: 99, data: { usuarios: [{ id: 'u1' }], notas: {} },
    }));
    await assert.rejects(() => sb.window.api.loadData(), /schema-futuro/);
  });

  it('rechaza datos corruptos en vez de devolver {}', async () => {
    const sb = crearContexto();
    await sb.window.cal13idb.set('cal13-data', '{roto');
    await assert.rejects(() => sb.window.api.loadData(), /datos-corruptos/);
  });

  it('bloquea guardados si la carga inicial falló', async () => {
    const sb = crearContexto();
    sb.window.cal13NoGuardar = true;
    const ok = await sb.window.api.saveData(JSON.stringify({ usuarios: [{ id: 'u1' }], notas: {} }));
    assert.equal(ok, false);
    assert.equal(sb.window.api.lastSaveState.backend, 'bloqueado');
  });

  it('replaceData no toca el store si no puede leer el estado anterior', async () => {
    const sb = crearContexto();
    await sb.window.cal13idb.set('cal13-data', JSON.stringify({
      app: 'cal13', v: 1, schema: 99, data: { usuarios: [{ id: 'u1' }], notas: {} },
    }));
    const ok = await sb.window.api.replaceData(JSON.stringify({
      usuarios: [{ id: 'u1', nombre: 'Uno' }], notas: { u1: { cycles: {} } },
    }));
    assert.equal(ok, false);
    assert.equal(sb.window.api.lastSaveState.motivo, 'schema-futuro');
  });

  it('replaceData rechaza un contenedor de esquema futuro', async () => {
    const sb = crearContexto();
    const ok = await sb.window.api.replaceData(JSON.stringify({
      app: 'cal13', v: 1, schema: 99, data: { usuarios: [{ id: 'u1' }], notas: {} },
    }));
    assert.equal(ok, false);
    assert.equal(sb.window.api.lastSaveState.motivo, 'schema-futuro');
  });
});

describe('Restauración coordinada (DATA-02)', () => {
  it('replaceData elimina grupos del store que no están en el respaldo', async () => {
    const sb = crearContexto();
    const idb = sb.window.cal13idb;
    assert.equal(await idb.registrarGrupos(GRUPOS), 2);

    const respaldoViejo = {
      actual: 'u1',
      usuarios: [USUARIOS[0]],
      notas: { u1: { cycles: { '2026': { n: 1 } }, fishingLog: [{ id: 'p1' }] } },
    };
    assert.equal(await sb.window.api.saveData(JSON.stringify(respaldoViejo)), true);
    assert.ok(await idb.bitacoraLeer('u1:pesca'), 'el grupo debió quedar en el store');

    // Respaldo nuevo: ya no trae pesca.
    const respaldoNuevo = {
      actual: 'u1',
      usuarios: [USUARIOS[0]],
      notas: { u1: { cycles: { '2027': { n: 2 } } } },
    };
    assert.equal(await sb.window.api.replaceData(JSON.stringify(respaldoNuevo)), true);

    assert.equal(await idb.bitacoraLeer('u1:pesca'), null, 'el grupo viejo debe borrarse');
    const leido = JSON.parse(await sb.window.api.loadData());
    assert.deepEqual(leido.notas.u1, { cycles: { '2027': { n: 2 } } });
  });

  it('replaceData conserva los grupos que sí están en el respaldo', async () => {
    const sb = crearContexto();
    await sb.window.cal13idb.registrarGrupos(GRUPOS);
    const data = {
      actual: 'u1',
      usuarios: [USUARIOS[0]],
      notas: { u1: { cycles: { '2026': { n: 1 } }, fishingLog: [{ id: 'p1' }] } },
    };
    assert.equal(await sb.window.api.replaceData(JSON.stringify(data)), true);
    const leido = JSON.parse(await sb.window.api.loadData());
    assert.deepEqual(leido.notas.u1, data.notas.u1);
  });
});

describe('Escrituras concurrentes (DATA-05)', () => {
  it('serializa guardados: una escritura lenta no pisa a la última', async () => {
    const sb = crearContexto();
    const escrituras = [];
    let primera = true;
    sb.window.api.saveData = async (json) => {
      escrituras.push(JSON.parse(json));
      const espera = primera ? 40 : 0;
      primera = false;
      await new Promise((resolve) => setTimeout(resolve, espera));
      sb.ultimo = JSON.parse(json);
      return true;
    };
    sb.DATA = { notas: { u1: { cycles: { '2026': { n: 1 } } } } };
    const p1 = sb.window.cal13saveNow('uno');
    sb.DATA = { notas: { u1: { cycles: { '2026': { n: 2 } } } } };
    const p2 = sb.window.cal13saveNow('dos');
    const [r1, r2] = await Promise.all([p1, p2]);
    assert.equal(r1, true);
    assert.equal(r2, true);
    assert.equal(escrituras.length, 2, 'ambas escrituras deben ejecutarse');
    assert.deepEqual(sb.ultimo.notas.u1.cycles['2026'], { n: 2 },
      'el estado final debe ser el último cambio, no la escritura lenta');
  });
});

describe('Eliminación coordinada de perfiles (DATA-01)', () => {
  it('borra datos, store de bitácoras y espejos del perfil eliminado', async () => {
    const sb = crearContexto();
    const idb = sb.window.cal13idb;
    await idb.registrarGrupos(GRUPOS);

    sb.DATA = {
      actual: 'u1',
      usuarios: [USUARIOS[0], USUARIOS[1]],
      notas: {
        u1: { cycles: { '2026': { n: 1 } }, fishingLog: [{ id: 'p1' }] },
        u2: { cycles: { '2026': { n: 2 } } },
      },
    };
    assert.equal(await sb.window.api.saveData(JSON.stringify(sb.DATA)), true);
    assert.ok(await idb.bitacoraLeer('u1:cal'));

    const r = await sb.window.cal13perfiles.eliminarPerfil('u1', sb.DATA);
    assert.equal(r.ok, true, 'fallos: ' + JSON.stringify(r.fallos));
    assert.deepEqual(sb.DATA.usuarios, [USUARIOS[1]]);
    assert.equal(sb.DATA.actual, 'u2');
    assert.equal(sb.DATA.notas.u1, undefined);

    assert.equal(await idb.bitacoraLeer('u1:cal'), null);
    assert.equal(await idb.bitacoraLeer('u1:pesca'), null);
    assert.ok(await idb.bitacoraLeer('u2:cal'), 'el otro perfil debe quedar intacto');
    assert.equal(sb.localStorage.getItem('cal13-bit:u1:cal'), null);
    assert.equal(sb.localStorage.getItem('cal13-bit:u1:pesca'), null);

    const leido = JSON.parse(await sb.window.api.loadData());
    assert.equal(leido.notas.u1, undefined);
    assert.ok(leido.notas.u2);
  });

  it('no permite eliminar el último perfil ni altera sus datos', async () => {
    const sb = crearContexto();
    sb.DATA = {
      actual: 'u1',
      usuarios: [USUARIOS[0]],
      notas: { u1: { cycles: {} } },
    };
    const r = await sb.window.cal13perfiles.eliminarPerfil('u1', sb.DATA);
    assert.equal(r.ok, false);
    assert.equal(r.motivo, 'ultimo-perfil');
    assert.deepEqual(sb.DATA.usuarios, [USUARIOS[0]]);
    assert.ok(sb.DATA.notas.u1);
  });
});
