'use strict';
// ============================================================================
// tests/helpers.cjs — utilidades compartidas por la suite (node:test).
//
// - ROOT / resolverFuente / leerFuente: localización dual raíz+src/.
// - memoriaStorage(): localStorage en memoria (con length y key()).
// - cargarEnContexto(): ejecuta una fuente dentro de un contexto `vm`.
// - igualJSON(): comparación entre realms (vm) vía JSON (sin choques de
//   prototipo entre el sandbox y el proceso principal).
// - ordenarClaves(): normaliza el orden de claves para comparar blobs.
// - info() / aviso(): líneas de diagnóstico con prefijo ASCII (se leen bien
//   en PowerShell, cmd y terminales UTF-8).
// No es un test (no termina en .test.js): `node --test "tests/*.test.js"`
// no lo ejecuta.
// ============================================================================
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { resolverFuente } = require('../scripts/paths.cjs');

const ROOT = path.join(__dirname, '..');

// Lee una fuente del proyecto (src/ o raíz). Lanza si no existe.
function leerFuente(nombre) {
  const ruta = resolverFuente(nombre);
  if (!ruta) throw new Error('Fuente no encontrada (ni en src/ ni en raíz): ' + nombre);
  return fs.readFileSync(ruta, 'utf8');
}

// localStorage mínimo en memoria: get/set/remove + clear + key() + length.
function memoriaStorage() {
  const mapa = new Map();
  const api = {
    getItem: (k) => (mapa.has(String(k)) ? mapa.get(String(k)) : null),
    setItem: (k, v) => { mapa.set(String(k), String(v)); },
    removeItem: (k) => { mapa.delete(String(k)); },
    clear: () => { mapa.clear(); },
    key: (i) => [...mapa.keys()][i] ?? null,
  };
  Object.defineProperty(api, 'length', { get: () => mapa.size });
  return api;
}

// Ejecuta `nombreFuente` dentro del contexto `sb` (ya creado con
// vm.createContext) y devuelve el código leído (útil para aserciones
// estáticas sobre el fuente).
function cargarEnContexto(sb, nombreFuente, etiqueta) {
  const codigo = leerFuente(nombreFuente);
  new vm.Script(codigo, { filename: etiqueta || nombreFuente }).runInContext(sb);
  return codigo;
}

// Igualdad profunda a través del borde `vm`: ambos lados pasan por JSON,
// así no importa que vengan de reinos (prototipos) distintos.
function igualJSON(actual, esperado, mensaje) {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(actual)), esperado, mensaje);
}

// Ordena claves recursivamente (objetos y arreglos): para comparar blobs
// donde el orden de inserción puede variar (p. ej. overlay de bitácoras).
function ordenarClaves(valor) {
  if (Array.isArray(valor)) return valor.map(ordenarClaves);
  if (valor && typeof valor === 'object') {
    const ordenado = {};
    for (const clave of Object.keys(valor).sort()) ordenado[clave] = ordenarClaves(valor[clave]);
    return ordenado;
  }
  return valor;
}

// Diagnóstico con prefijos ASCII: legible en cualquier consola.
function info(mensaje) {
  console.log(`  [info] ${mensaje}`);
}

function aviso(mensaje) {
  console.log(`  [aviso] ${mensaje}`);
}

// localStorage que falla al escribir/leer: simula cuota agotada o modo
// restringido. El shim debe caer a memoria y reportarlo como temporal.
function storageQueFalla() {
  const lanza = () => { throw new Error('storage-no-disponible'); };
  return {
    getItem: lanza,
    setItem: lanza,
    removeItem: lanza,
    clear: lanza,
    key: lanza,
    get length() { return 0; },
  };
}

// IndexedDB mínimo en memoria para pruebas de integración. No es un polyfill
// completo: cubre open/upgrade, transacciones, put/get/delete y openCursor,
// que es lo que usa storage-idb.js. Permite probar el camino real de IDB
// (no solo el fallback a localStorage) sin agregar dependencias.
function crearIndexedDBFalso(opciones) {
  const opts = opciones || {};
  const bases = new Map();
  const luego = (fn) => setTimeout(fn, 0);

  function crearStore(registro) {
    const { datos, keyPath, fallar } = registro;
    return {
      put(valor, clave) {
        const req = {};
        luego(() => {
          if (fallar && fallar.put) {
            req.error = new Error('put-fallido');
            if (req.onerror) req.onerror();
            return;
          }
          const k = keyPath ? valor[keyPath] : clave;
          datos.set(String(k), JSON.parse(JSON.stringify(valor)));
          req.result = k;
          if (req.onsuccess) req.onsuccess();
        });
        return req;
      },
      get(clave) {
        const req = {};
        luego(() => {
          if (fallar && fallar.get) {
            req.error = new Error('get-fallido');
            if (req.onerror) req.onerror();
            return;
          }
          req.result = datos.has(String(clave))
            ? JSON.parse(JSON.stringify(datos.get(String(clave))))
            : undefined;
          if (req.onsuccess) req.onsuccess();
        });
        return req;
      },
      delete(clave) {
        const req = {};
        luego(() => {
          if (fallar && fallar.delete) {
            req.error = new Error('delete-fallido');
            if (req.onerror) req.onerror();
            return;
          }
          datos.delete(String(clave));
          req.result = undefined;
          if (req.onsuccess) req.onsuccess();
        });
        return req;
      },
      openCursor() {
        const req = {};
        const entradas = [...datos.entries()];
        let i = 0;
        const paso = () => {
          luego(() => {
            if (i >= entradas.length) {
              req.result = null;
              if (req.onsuccess) req.onsuccess();
              return;
            }
            const [, valor] = entradas[i++];
            req.result = {
              value: JSON.parse(JSON.stringify(valor)),
              continue: paso,
            };
            if (req.onsuccess) req.onsuccess();
          });
        };
        paso();
        return req;
      },
    };
  }

  function abrir(nombre, version) {
    const req = {};
    luego(() => {
      let db = bases.get(nombre);
      const nueva = !db;
      if (!db) {
        db = {
          name: nombre,
          version: version || 1,
          stores: new Map(),
          objectStoreNames: { contains: (n) => db.stores.has(n) },
          createObjectStore(n, o) {
            db.stores.set(n, { keyPath: o && o.keyPath, datos: new Map(), fallar: null });
            return {};
          },
          transaction(n, modo) {
            const tx = { error: null, onerror: null };
            tx.objectStore = (storeName) => {
              const registro = db.stores.get(storeName);
              if (!registro) throw new Error('store-inexistente:' + storeName);
              const fallar = opts.fallar && opts.fallar[storeName];
              registro.fallar = fallar || null;
              return crearStore(registro);
            };
            return tx;
          },
        };
        bases.set(nombre, db);
      }
      if (nueva || (version || 1) > db.version) {
        db.version = Math.max(db.version, version || 1);
        req.result = db;
        if (req.onupgradeneeded) req.onupgradeneeded();
      }
      req.result = db;
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }

  return { open: abrir, _bases: bases };
}

module.exports = {
  ROOT,
  resolverFuente,
  leerFuente,
  memoriaStorage,
  storageQueFalla,
  crearIndexedDBFalso,
  cargarEnContexto,
  igualJSON,
  ordenarClaves,
  info,
  aviso,
};
