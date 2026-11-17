'use strict';
// ============================================================================
// tests/importacion-identidad.test.js — IMPORT-01.
//
// Importar una bitácora de otro perfil no puede ser silencioso. Se prueba el
// flujo programático (window.applyBitacoraJSON), usado por Restaurar y QR.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente, igualJSON } = require('./helpers.cjs');

function crearSandbox(opciones) {
  const opts = opciones || {};
  const sb = {
    console,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      key: () => null,
      length: 0,
    },
    document: {
      readyState: 'complete',
      getElementById: () => null,
      querySelector: (sel) => (String(sel).indexOf('.action-group[data-group]') === 0 ? {} : null),
      createElement: () => ({ set textContent(v) {}, set id(v) {}, style: {} }),
      head: { appendChild: () => {} },
      body: { appendChild: () => {} },
      addEventListener: () => {},
    },
    alert: () => {},
    prompt: () => null,
    confirm: () => {
      if (opts.confirmar === undefined) throw new Error('confirm no esperado');
      return opts.confirmar;
    },
    setTimeout,
    clearTimeout,
  };
  sb.window = sb;
  sb.DATA = {
    actual: 'u2',
    usuarios: [
      { id: 'u1', nombre: 'Origen' },
      { id: 'u2', nombre: 'Destino' },
    ],
    notas: {
      u1: { cycles: { '2026': { n: 1 } } },
      u2: { cycles: { '2026': { n: 2 } } },
    },
  };
  sb.userData = () => sb.DATA.notas[sb.DATA.actual];
  sb.guardados = 0;
  sb.window.cal13saveNow = async () => {
    sb.guardados++;
    return opts.guardar !== false;
  };
  vm.createContext(sb);
  vm.runInContext(leerFuente('data-schema.js'), sb, { filename: 'data-schema.js' });
  vm.runInContext(leerFuente('bitacoras-respaldo-modulo.js'), sb, {
    filename: 'bitacoras-respaldo-modulo.js',
  });
  return sb;
}

function payload(usuario) {
  return JSON.stringify({
    app: 'calendario-13-lunas',
    tipo: 'bitacora-individual',
    version: 1,
    grupo: 'calendario',
    titulo: '📅 Calendario principal (notas y agenda)',
    claves: ['cycles'],
    usuario,
    fecha: '2026-11-02',
    datos: { cycles: { '2027': { n: 9 } } },
  });
}

describe('Importación individual: identidad origen/destino', () => {
  it('cancelar la confirmación no modifica el perfil destino', async () => {
    const sb = crearSandbox({ confirmar: false });
    const antes = JSON.stringify(sb.DATA.notas.u2);
    const ok = await sb.window.applyBitacoraJSON(payload({ id: 'u1', nombre: 'Origen' }));
    assert.equal(ok, false);
    assert.equal(JSON.stringify(sb.DATA.notas.u2), antes);
    assert.equal(sb.guardados, 0);
  });

  it('confirmar aplica los datos al perfil activo y persiste antes de informar éxito', async () => {
    const sb = crearSandbox({ confirmar: true });
    const ok = await sb.window.applyBitacoraJSON(payload({ id: 'u1', nombre: 'Origen' }));
    assert.equal(ok, true);
    igualJSON(sb.DATA.notas.u2.cycles, { '2027': { n: 9 } });
    assert.equal(sb.guardados, 1);
  });

  it('si el archivo es del mismo perfil no pide confirmación', async () => {
    const sb = crearSandbox();
    const ok = await sb.window.applyBitacoraJSON(payload({ id: 'u2', nombre: 'Destino' }));
    assert.equal(ok, true);
    igualJSON(sb.DATA.notas.u2.cycles, { '2027': { n: 9 } });
  });

  it('si la persistencia falla, no informa éxito', async () => {
    const sb = crearSandbox({ confirmar: true, guardar: false });
    const ok = await sb.window.applyBitacoraJSON(payload({ id: 'u1', nombre: 'Origen' }));
    assert.equal(ok, false);
  });

  it('rechaza una bitácora de esquema futuro sin tocar el perfil', async () => {
    const sb = crearSandbox({ confirmar: true });
    const antes = JSON.stringify(sb.DATA.notas.u2);
    const p = JSON.parse(payload({ id: 'u2', nombre: 'Destino' }));
    p.schema = 99;
    const ok = await sb.window.applyBitacoraJSON(JSON.stringify(p));
    assert.equal(ok, false);
    assert.equal(JSON.stringify(sb.DATA.notas.u2), antes);
    assert.equal(sb.guardados, 0);
  });
});
