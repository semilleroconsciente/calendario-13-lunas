// storage-idb.js — almacenamiento con IndexedDB + fallback a localStorage.
//
// Por qué: las ~80 bitácoras personales viven en una sola clave
// ('cal13-data'). Con localStorage el límite (~5 MB) y el acceso síncrono
// bloquean el hilo. IndexedDB es asíncrono y con cuota amplia.
//
// API: window.cal13idb = { get(key), set(key, value), del(key) } (promesas).
// Si IndexedDB no existe o falla, usa localStorage transparente.
// El sobre versionado {app:'cal13',v:1,...} lo siguen manejando
// web-api.js y main.js — aquí solo es clave→string.
(function () {
  'use strict';
  var DB = 'cal13', STORE = 'kv';
  var mem = {}; // último recurso (navegación privada sin localStorage)

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return (k in mem) ? mem[k] : null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { try { mem[k] = v; } catch (_) {} } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { try { delete mem[k]; } catch (_) {} } }

  function openDb() {
    return new Promise(function (res, rej) {
      if (!('indexedDB' in window)) return rej(new Error('sin-indexeddb'));
      try {
        var rq = indexedDB.open(DB, 1);
        rq.onupgradeneeded = function () {
          try { rq.result.createObjectStore(STORE); } catch (_) {}
        };
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { rej(rq.error || new Error('idb-error')); };
      } catch (e) { rej(e); }
    });
  }
  var dbP = null, idbOk = null;
  function db() {
    if (!dbP) {
      dbP = openDb().then(function (d) { idbOk = true; return d; }, function (e) { idbOk = false; throw e; });
    }
    return dbP;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        try {
          var t = d.transaction(STORE, mode);
          var s = t.objectStore(STORE);
          fn(s, res, rej);
          t.onerror = function () { rej(t.error || new Error('idb-tx')); };
        } catch (e) { rej(e); }
      });
    });
  }

  window.cal13idb = {
    backend: function () { return idbOk === true ? 'indexeddb' : (idbOk === false ? 'localstorage' : 'detectando'); },
    get: function (k) {
      return tx('readonly', function (s, res, rej) {
        var r = s.get(k);
        r.onsuccess = function () { res(r.result == null ? lsGet(k) : String(r.result)); };
        r.onerror = function () { rej(r.error); };
      }).catch(function () { return lsGet(k); });
    },
    set: function (k, v) {
      lsSet(k, v); // espejo síncrono: arranque instantáneo aunque IDB tarde
      return tx('readwrite', function (s, res, rej) {
        var r = s.put(String(v), k);
        r.onsuccess = function () { res(true); };
        r.onerror = function () { rej(r.error); };
      }).catch(function () { return true; });
    },
    del: function (k) {
      lsDel(k);
      return tx('readwrite', function (s, res, rej) {
        var r = s.delete(k);
        r.onsuccess = function () { res(true); };
        r.onerror = function () { rej(r.error); };
      }).catch(function () { return true; });
    }
  };
})();
