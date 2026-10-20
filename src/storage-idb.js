// storage-idb.js — almacenamiento con IndexedDB + fallback a localStorage.
//
// Por qué: las ~80 bitácoras personales vivían en un solo JSON
// ('cal13-data'). Con localStorage el límite (~5 MB) y el acceso síncrono
// bloquean el hilo. IndexedDB es asíncrono y con cuota amplia.
//
// v2: segundo object store 'bitacoras' (keyPath 'id'): cada grupo de claves
// de userData() (ver GROUPS en bitacoras-respaldo-modulo.js) puede vivir en
// su propio registro {id, titulo, keys, rev, updatedAt} en vez de inflar el
// blob único. La migración es opt-in (migrarGruposDesdeUserData): el boot
// sigue leyendo 'cal13-data' igual que antes.
//
// API: window.cal13idb = {
//   get/set/del (store 'kv', clave→string, con espejo localStorage),
//   backend(), info() -> {backend, quota, usage, latenciaMs},
//   bitacoraGuardar(id, registro), bitacoraLeer(id), bitacoraBorrar(id),
//   bitacorasListar(), bitacorasContar(), migrarGruposDesdeUserData(userData, grupos)
// } (promesas). Sin IndexedDB: fallback transparente a localStorage
// (kv directo, bitácoras bajo prefijo 'cal13-bit:').
(function () {
  'use strict';
  var DB = 'cal13', V = 2, KV = 'kv', BIT = 'bitacoras';
  var BIT_PREFIJO = 'cal13-bit:';
  var FLAG_GRUPOS = 'cal13-idb-grupos'; // kv: {v, at, grupos:[{id,keys}]}
  var mem = {}; // último recurso (navegación privada sin localStorage)

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return (k in mem) ? mem[k] : null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { try { mem[k] = v; } catch (_) {} } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { try { delete mem[k]; } catch (_) {} } }
  function lsKeys(pref) {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(pref) === 0) out.push(k.slice(pref.length));
      }
    } catch (e) {}
    return out;
  }

  function openDb() {
    return new Promise(function (res, rej) {
      if (!('indexedDB' in window)) return rej(new Error('sin-indexeddb'));
      try {
        var rq = indexedDB.open(DB, V);
        rq.onupgradeneeded = function () {
          try {
            var db = rq.result;
            if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
            if (!db.objectStoreNames.contains(BIT)) db.createObjectStore(BIT, { keyPath: 'id' });
          } catch (_) {}
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
  function enStore(store, mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        try {
          var t = d.transaction(store, mode);
          var s = t.objectStore(store);
          fn(s, res, rej);
          t.onerror = function () { rej(t.error || new Error('idb-tx')); };
        } catch (e) { rej(e); }
      });
    });
  }
  function ahoraIso() { try { return new Date().toISOString(); } catch (e) { return ''; } }

  window.cal13idb = {
    backend: function () { return idbOk === true ? 'indexeddb' : (idbOk === false ? 'localstorage' : 'detectando'); },
    get: function (k) {
      return enStore(KV, 'readonly', function (s, res, rej) {
        var r = s.get(k);
        r.onsuccess = function () { res(r.result == null ? lsGet(k) : String(r.result)); };
        r.onerror = function () { rej(r.error); };
      }).catch(function () { return lsGet(k); });
    },
    set: function (k, v) {
      lsSet(k, v); // espejo síncrono: arranque instantáneo aunque IDB tarde
      return enStore(KV, 'readwrite', function (s, res, rej) {
        var r = s.put(String(v), k);
        r.onsuccess = function () { res(true); };
        r.onerror = function () { rej(r.error); };
      }).catch(function () { return true; });
    },
    del: function (k) {
      lsDel(k);
      return enStore(KV, 'readwrite', function (s, res, rej) {
        var r = s.delete(k);
        r.onsuccess = function () { res(true); };
        r.onerror = function () { rej(r.error); };
      }).catch(function () { return true; });
    },
    // Cuota y latencia reales: estimate() + roundtrip de sonda en 'kv'.
    info: function () {
      var t0 = Date.now();
      var self = this;
      return self.set('__sonda__', '1').then(function () {
        return self.get('__sonda__');
      }).then(function () {
        return self.del('__sonda__');
      }).then(function () {
        var latenciaMs = Date.now() - t0;
        var est = null;
        try {
          if (navigator.storage && navigator.storage.estimate) {
            return navigator.storage.estimate().then(function (e) {
              return { backend: self.backend(), quota: (e && e.quota) || null, usage: (e && e.usage) || null, latenciaMs: latenciaMs };
            }).catch(function () {
              return { backend: self.backend(), quota: null, usage: null, latenciaMs: latenciaMs };
            });
          }
        } catch (e) {}
        return { backend: self.backend(), quota: (est && est.quota) || null, usage: null, latenciaMs: latenciaMs };
      });
    },
    // --- Bitácoras en store propio (un registro por grupo) ---
    // id namespaced por usuario ('uid:grupo') porque el DB es compartido.
    // Doble copia: IDB + espejo localStorage (igual que kv). Al leer, si el
    // registro IDB falta pero hay espejo, se usa el espejo (DB borrada a mano).
    bitacoraGuardar: function (id, registro) {
      var rec = {
        id: String(id),
        titulo: (registro && registro.titulo) || '',
        keys: (registro && registro.keys) || {},
        rev: (registro && registro.rev) || 1,
        updatedAt: ahoraIso()
      };
      lsSet(BIT_PREFIJO + rec.id, JSON.stringify(rec));
      return enStore(BIT, 'readwrite', function (s, res, rej) {
        var r = s.put(rec);
        r.onsuccess = function () { res(true); };
        r.onerror = function () { rej(r.error); };
      }).catch(function () { return true; });
    },
    bitacoraLeer: function (id) {
      function espejo() {
        try {
          var raw = lsGet(BIT_PREFIJO + id);
          return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
      }
      return enStore(BIT, 'readonly', function (s, res, rej) {
        var r = s.get(String(id));
        r.onsuccess = function () { res(r.result || espejo()); };
        r.onerror = function () { rej(r.error); };
      }).catch(espejo);
    },
    bitacoraBorrar: function (id) {
      lsDel(BIT_PREFIJO + id);
      return enStore(BIT, 'readwrite', function (s, res, rej) {
        var r = s.delete(String(id));
        r.onsuccess = function () { res(true); };
        r.onerror = function () { rej(r.error); };
      }).catch(function () { return true; });
    },
    bitacorasListar: function () {
      return enStore(BIT, 'readonly', function (s, res, rej) {
        var out = [];
        try {
          var rq = s.openCursor();
          rq.onsuccess = function () {
            var c = rq.result;
            if (!c) { res(out); return; }
            out.push({ id: c.value.id, titulo: c.value.titulo, updatedAt: c.value.updatedAt });
            c.continue();
          };
          rq.onerror = function () { rej(rq.error); };
        } catch (e) { rej(e); }
      }).catch(function () {
        return lsKeys(BIT_PREFIJO).map(function (id) {
          var titulo = '';
          try {
            var raw = lsGet(BIT_PREFIJO + id);
            titulo = (raw && JSON.parse(raw).titulo) || '';
          } catch (e) {}
          return { id: id, titulo: titulo, updatedAt: '' };
        });
      });
    },
    bitacorasContar: function () {
      var self = this;
      return self.bitacorasListar().then(function (l) { return l.length; });
    },
    // Registro de grupos (lo llama bitacoras-respaldo-modulo con GROUPS al
    // cargarse; web-api lo lee para partir/superponer sin duplicar la lista).
    registrarGrupos: function (grupos) {
      var lista = (Array.isArray(grupos) ? grupos : [])
        .filter(function (g) { return g && g.id && Array.isArray(g.keys); })
        .map(function (g) { return { id: String(g.id), keys: g.keys.map(String) }; });
      if (!lista.length) return Promise.resolve(0);
      var self = this;
      return self.set(FLAG_GRUPOS, JSON.stringify({ v: 1, at: ahoraIso(), grupos: lista }))
        .then(function () { return lista.length; });
    },
    gruposRegistrados: function () {
      return this.get(FLAG_GRUPOS).then(function (raw) {
        try {
          var o = raw ? JSON.parse(raw) : null;
          if (o && Array.isArray(o.grupos)) return o.grupos;
        } catch (e) {}
        return [];
      });
    },
    // y guarda cada grupo en el store propio. No borra el origen (el boot
    // sigue leyendo el blob hasta que la app adopte el store como primario).
    // Devuelve {migrados, claves, bytes}.
    migrarGruposDesdeUserData: function (userData, grupos) {
      var self = this;
      var lista = Array.isArray(grupos) ? grupos : [];
      var sel = lista.filter(function (g) { return g && g.id && Array.isArray(g.keys); });
      var cadena = Promise.resolve({ migrados: 0, claves: 0, bytes: 0 });
      sel.forEach(function (g) {
        cadena = cadena.then(function (rep) {
          var keys = {};
          var n = 0;
          g.keys.forEach(function (k) {
            if (userData && Object.prototype.hasOwnProperty.call(userData, k)) {
              keys[k] = userData[k];
              n++;
            }
          });
          if (!n) return rep;
          var payload = JSON.stringify(keys);
          return self.bitacoraGuardar(g.id, { titulo: g.titulo || g.id, keys: keys }).then(function () {
            rep.migrados++;
            rep.claves += n;
            rep.bytes += payload.length;
            return rep;
          });
        });
      });
      return cadena;
    }
  };
})();
