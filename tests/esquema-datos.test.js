'use strict';
// ============================================================================
// tests/esquema-datos.test.js — MIG-01 / MIG-02.
//
// Valida versionado de esquema, migración legado v0 -> v1, rechazo de versiones
// futuras sin mutar la entrada y validación de invariantes claras.
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente } = require('./helpers.cjs');

function cargarEsquema() {
  const sb = { console };
  sb.window = sb;
  sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(leerFuente('data-schema.js'), sb, { filename: 'data-schema.js' });
  return sb.window.cal13schema;
}

const VALIDO = {
  actual: 'u1',
  usuarios: [{ id: 'u1', nombre: 'Uno' }],
  notas: { u1: { cycles: { '2026': { moons: { '1': { days: {} } }, dft: { nota: '' } } } } },
};

describe('Esquema de datos (MIG-01/MIG-02)', () => {
  it('acepta el esquema actual y normaliza notas/cycles sin perder datos', () => {
    const esq = cargarEsquema();
    const r = esq.migrarYValidar(VALIDO, 1);
    assert.equal(r.ok, true, JSON.stringify(r.errores));
    assert.equal(r.migrado, false);
    assert.equal(r.data.actual, 'u1');
    assert.ok(r.data.notas.u1.cycles['2026']);
  });

  it('migra el formato legado con DATA.cycles y sin usuarios', () => {
    const esq = cargarEsquema();
    const legado = { cycles: { '2026': { moons: {}, dft: { nota: 'x' } } }, config: { tema: 'noche' } };
    const r = esq.migrarYValidar(legado, 0);
    assert.equal(r.ok, true, JSON.stringify(r.errores));
    assert.equal(r.migrado, true);
    assert.equal(r.data.usuarios[0].id, 'u1');
    assert.equal(r.data.actual, 'u1');
    assert.equal(r.data.notas.u1.cycles['2026'].dft.nota, 'x');
    assert.equal(r.data.cycles, undefined);
    assert.equal(r.data.config.tema, 'noche', 'el resto de los datos se conserva');
  });

  it('rechaza una versión futura sin modificar la entrada', () => {
    const esq = cargarEsquema();
    const entrada = JSON.parse(JSON.stringify(VALIDO));
    const copia = JSON.parse(JSON.stringify(entrada));
    const r = esq.migrarYValidar(entrada, 99);
    assert.equal(r.ok, false);
    assert.equal(r.errores[0], 'schema-futuro');
    assert.equal(r.data, null);
    assert.deepEqual(entrada, copia, 'la entrada no debe mutarse');
  });

  it('rechaza ids duplicados y usuarios inválidos', () => {
    const esq = cargarEsquema();
    const d = {
      actual: 'u1',
      usuarios: [{ id: 'u1', nombre: 'Uno' }, { id: 'u1', nombre: 'Otro' }],
      notas: {},
    };
    const r = esq.migrarYValidar(d, 1);
    assert.equal(r.ok, false);
    assert.ok(r.errores.some((e) => e.indexOf('duplicado') >= 0), r.errores.join(','));
  });

  it('corrige actual ausente y crea notas faltantes como advertencia', () => {
    const esq = cargarEsquema();
    const d = {
      actual: 'no-existe',
      usuarios: [{ id: 'u1', nombre: 'Uno' }, { id: 'u2' }],
      notas: {},
    };
    const r = esq.migrarYValidar(d, 1);
    assert.equal(r.ok, true, JSON.stringify(r.errores));
    assert.equal(r.data.actual, 'u1');
    assert.ok(r.data.notas.u1);
    assert.ok(r.data.notas.u2);
    assert.ok(r.advertencias.indexOf('actual-inexistente') >= 0);
  });

  it('conserva notas huérfanas y las reporta', () => {
    const esq = cargarEsquema();
    const d = {
      actual: 'u1',
      usuarios: [{ id: 'u1', nombre: 'Uno' }],
      notas: { u1: { cycles: {} }, viejo: { cycles: { '2020': {} } } },
    };
    const r = esq.migrarYValidar(d, 1);
    assert.equal(r.ok, true, JSON.stringify(r.errores));
    assert.ok(r.data.notas.viejo, 'no se deben borrar datos sin decisión explícita');
    assert.ok(r.advertencias.some((a) => a.indexOf('notas-huerfanas:viejo') >= 0));
  });

  it('rechaza estructuras de Huerta incompatibles', () => {
    const esq = cargarEsquema();
    const d = JSON.parse(JSON.stringify(VALIDO));
    d.notas.u1.huerta = { bancales: 'no-es-array' };
    const r = esq.migrarYValidar(d, 1);
    assert.equal(r.ok, false);
    assert.ok(r.errores.indexOf('huerta-bancales:u1') >= 0, r.errores.join(','));
  });

  it('lee la versión del sobre y distingue ausente de 0', () => {
    const esq = cargarEsquema();
    assert.equal(esq.versionDeSobre({ app: 'cal13', v: 1, schema: 3 }), 3);
    assert.equal(esq.versionDeSobre({ app: 'cal13', v: 1 }), 0);
    assert.equal(esq.versionDeSobre(null), 0);
  });
});
