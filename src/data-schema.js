// data-schema.js — versión del esquema de DATA, validación y migraciones.
//
// Tres versiones distintas (no confundir):
//   1) contenedor de respaldo: {app:'cal13', v:1, schema:N, data:{...}}
//   2) esquema de DATA: este módulo (SCHEMA_VERSION)
//   3) versión de IndexedDB: storage-idb.js (V=2)
//
// Reglas:
// - El validador no modifica la entrada; devuelve un clon normalizado.
// - Una versión futura se rechaza sin tocar los datos actuales.
// - Las migraciones se aplican en orden vN -> vN+1 sobre una copia.
// - Solo se validan invariantes claras y módulos de alto riesgo; el resto de
//   los datos se conserva tal cual para no rechazar bitácoras válidas.
(function () {
  'use strict';

  var SCHEMA_VERSION = 1;
  var MAX_BYTES = 5 * 1024 * 1024;

  function esObjeto(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }
  function clonar(v) {
    return JSON.parse(JSON.stringify(v));
  }
  function texto(v) {
    return typeof v === 'string';
  }

  // Migraciones ordenadas. La clave es la versión de origen.
  // v0 = formato legado con DATA.cycles y sin usuarios/notas.
  var MIGRACIONES = {
    0: function (d) {
      var o = clonar(d);
      if (Array.isArray(o.usuarios)) return o;
      if (esObjeto(o.cycles)) {
        var cycles = o.cycles;
        delete o.cycles;
        o.usuarios = [{ id: 'u1', nombre: 'Principal' }];
        o.actual = 'u1';
        o.notas = { u1: { cycles: cycles } };
      }
      return o;
    }
  };

  function tamanoBytes(d) {
    try {
      var s = JSON.stringify(d);
      if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length;
      // Fallback Node: Buffer.byteLength cuenta UTF-8 real (no chars).
      try { if (typeof Buffer !== 'undefined') return Buffer.byteLength(s, 'utf8'); } catch (e2) {}
      return s.length;
    } catch (e) { return 0; }
  }

  function validar(d) {
    var errores = [];
    var advertencias = [];
    if (!esObjeto(d)) return { ok: false, errores: ['datos-no-objeto'], advertencias: advertencias };
    try {
      if (tamanoBytes(d) > MAX_BYTES) errores.push('demasiado-grande');
    } catch (e) {
      return { ok: false, errores: ['no-serializable'], advertencias: advertencias };
    }

    var ids = {};
    if (!Array.isArray(d.usuarios)) {
      errores.push('sin-usuarios');
    } else {
      if (!d.usuarios.length) errores.push('sin-usuarios');
      if (d.usuarios.length > 50) errores.push('demasiados-usuarios');
      d.usuarios.forEach(function (u, i) {
        if (!esObjeto(u)) { errores.push('usuario-' + i); return; }
        if (!texto(u.id) || !u.id.trim()) { errores.push('usuario-id-' + i); return; }
        if (u.id.length > 40) errores.push('usuario-id-largo-' + i);
        if (ids[u.id]) errores.push('usuario-id-duplicado:' + u.id);
        ids[u.id] = true;
        if (u.nombre !== undefined && !texto(u.nombre)) errores.push('usuario-nombre-' + i);
      });
      if (!texto(d.actual) || !ids[d.actual]) advertencias.push('actual-inexistente');
    }

    if (d.notas !== undefined && !esObjeto(d.notas)) errores.push('notas');
    if (esObjeto(d.notas)) {
      Object.keys(d.notas).forEach(function (uid) {
        if (Object.keys(ids).length && !ids[uid]) advertencias.push('notas-huerfanas:' + uid);
        var n = d.notas[uid];
        if (!esObjeto(n)) { errores.push('notas-usuario:' + uid); return; }
        if (n.cycles !== undefined && !esObjeto(n.cycles)) { errores.push('cycles:' + uid); return; }
        if (!esObjeto(n.cycles)) {
          // Sin cycles todavía puede haber datos de módulos; se validan abajo.
        } else {
          Object.keys(n.cycles).forEach(function (cy) {
            var c = n.cycles[cy];
            if (!esObjeto(c)) { errores.push('cycle:' + uid + ':' + cy); return; }
            if (c.moons !== undefined && !esObjeto(c.moons)) errores.push('moons:' + uid + ':' + cy);
            if (esObjeto(c.moons)) {
              Object.keys(c.moons).forEach(function (m) {
                var mo = c.moons[m];
                if (!esObjeto(mo)) errores.push('moon:' + uid + ':' + cy + ':' + m);
                else if (mo.days !== undefined && !esObjeto(mo.days)) errores.push('days:' + uid + ':' + cy + ':' + m);
              });
            }
            if (c.dft !== undefined && !esObjeto(c.dft)) errores.push('dft:' + uid + ':' + cy);
            if (c.dft2 !== undefined && !esObjeto(c.dft2)) errores.push('dft2:' + uid + ':' + cy);
          });
        }
        // Huerta vive dentro de las notas del usuario (userData()).
        // HUERTA-01: referencias relacionales → advertencias (no se borran).
        if (n.huerta !== undefined) {
          if (!esObjeto(n.huerta)) errores.push('huerta:' + uid);
          else {
            ['bancales', 'cultivos', 'tareas', 'cosechas'].forEach(function (k) {
              if (n.huerta[k] !== undefined && !Array.isArray(n.huerta[k])) errores.push('huerta-' + k + ':' + uid);
            });
            try {
              var bids = {};
              (Array.isArray(n.huerta.bancales) ? n.huerta.bancales : []).forEach(function (b) { if (b && b.id) bids[b.id] = true; });
              var cids = {};
              (Array.isArray(n.huerta.cultivos) ? n.huerta.cultivos : []).forEach(function (c) {
                if (c && c.id) cids[c.id] = true;
                if (c && c.bancalId && !bids[c.bancalId]) advertencias.push('huerta-huerfano:' + uid + ':cultivo:' + c.id);
              });
              (Array.isArray(n.huerta.tareas) ? n.huerta.tareas : []).forEach(function (t) {
                if (t && ((t.bancalId && !bids[t.bancalId]) || (t.cultivoId && !cids[t.cultivoId]))) advertencias.push('huerta-huerfano:' + uid + ':tarea:' + (t.id || '?'));
              });
              (Array.isArray(n.huerta.cosechas) ? n.huerta.cosechas : []).forEach(function (h) {
                if (h && h.cultivoId && !cids[h.cultivoId]) advertencias.push('huerta-huerfano:' + uid + ':cosecha:' + (h.id || '?'));
              });
            } catch (e2) {}
          }
        }
      });
    }

    // Módulo de alto riesgo: referencias relacionales de Huerta.
    if (d.config !== undefined && !esObjeto(d.config)) errores.push('config');

    return { ok: errores.length === 0, errores: errores, advertencias: advertencias };
  }

  // Completa invariantes sin descartar datos: notas por usuario, cycles y
  // actual válido. No renombra ids ni borra claves huérfanas.
  function normalizar(d) {
    var o = clonar(d);
    if (!Array.isArray(o.usuarios) || !o.usuarios.length) return o;
    if (o.notas === undefined || o.notas === null) o.notas = {};
    if (!esObjeto(o.notas)) return o; // no reemplazar una estructura inválida
    o.usuarios.forEach(function (u) {
      if (!esObjeto(u)) return;
      if (!texto(u.nombre)) u.nombre = String(u.id || 'Perfil');
      if (o.notas[u.id] === undefined || o.notas[u.id] === null) o.notas[u.id] = { cycles: {} };
      var n = o.notas[u.id];
      if (esObjeto(n) && (n.cycles === undefined || n.cycles === null)) n.cycles = {};
    });
    var ids = o.usuarios.map(function (u) { return esObjeto(u) ? u.id : null; }).filter(Boolean);
    if (ids.indexOf(o.actual) < 0) o.actual = ids[0];
    return o;
  }

  function migrar(d, desde, hasta) {
    var o = clonar(d);
    var v = desde;
    while (v < hasta) {
      var fn = MIGRACIONES[v];
      if (typeof fn !== 'function') throw new Error('migracion-ausente:' + v);
      o = fn(o);
      v++;
    }
    return o;
  }

  // schema ausente: se infiere 0 para formatos con cycles y sin usuarios;
  // 1 para respaldos actuales con usuarios/notas.
  function inferirVersion(d, schema) {
    if (typeof schema === 'number' && isFinite(schema)) return schema;
    if (esObjeto(d) && Array.isArray(d.usuarios)) return SCHEMA_VERSION;
    return 0;
  }

  function migrarYValidar(d, schema) {
    var desde = inferirVersion(d, schema);
    if (desde > SCHEMA_VERSION) {
      return { ok: false, errores: ['schema-futuro'], advertencias: [], data: null, schemaVersion: SCHEMA_VERSION };
    }
    if (desde < 0) {
      return { ok: false, errores: ['schema-invalido'], advertencias: [], data: null, schemaVersion: SCHEMA_VERSION };
    }
    var migrado;
    try {
      migrado = migrar(d, desde, SCHEMA_VERSION);
    } catch (e) {
      return { ok: false, errores: [String((e && e.message) || e)], advertencias: [], data: null, schemaVersion: SCHEMA_VERSION };
    }
    var v = validar(migrado);
    if (!v.ok) {
      return { ok: false, errores: v.errores, advertencias: v.advertencias, data: null, schemaVersion: SCHEMA_VERSION };
    }
    return {
      ok: true,
      data: normalizar(migrado),
      errores: [],
      advertencias: v.advertencias,
      schemaVersion: SCHEMA_VERSION,
      migrado: desde !== SCHEMA_VERSION
    };
  }

  function versionDeSobre(env) {
    if (esObjeto(env) && typeof env.schema === 'number') return env.schema;
    return 0;
  }

  var api = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    validar: validar,
    normalizar: normalizar,
    migrar: migrar,
    migrarYValidar: migrarYValidar,
    versionDeSobre: versionDeSobre
  };
  try { window.cal13schema = api; } catch (e) {}
})();
