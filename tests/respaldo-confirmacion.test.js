'use strict';
// ============================================================================
// tests/respaldo-confirmacion.test.js — BACKUP-01.
//
// El recordatorio de respaldo no debe marcar la fecha por el simple clic:
// solo doBackup() lo hace cuando la exportación devuelve un resultado válido.
// Aquí se ejecuta el módulo real en un DOM mínimo y se pulsa su botón.
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente, memoriaStorage } = require('./helpers.cjs');

const KEY = 'cal13-ultimo-respaldo';

function crearContexto() {
  const storage = memoriaStorage();
  let checkProgramado = null;
  const status = { hijos: [], appendChild(nodo) { this.hijos.push(nodo); } };
  const cfgBackup = { clics: 0, click() { this.clics++; } };
  const sb = {
    console,
    localStorage: storage,
    setTimeout(fn) { checkProgramado = fn; return 1; },
    document: {
      readyState: 'complete',
      getElementById(id) {
        if (id === 'statusMsg') return status;
        if (id === 'cfgBackupBtn') return cfgBackup;
        return null;
      },
      createElement(tag) {
        return { tag, style: {}, textContent: '', id: '', className: '', onclick: null };
      },
      addEventListener() {},
    },
  };
  sb.window = sb;
  sb.self = sb;
  vm.createContext(sb);
  vm.runInContext(leerFuente('auto-backup-modulo.js'), sb, { filename: 'auto-backup-modulo.js' });
  return {
    sb,
    storage,
    status,
    cfgBackup,
    ejecutarCheck() {
      assert.equal(typeof checkProgramado, 'function', 'el módulo debe programar su revisión');
      checkProgramado();
    },
  };
}

describe('Recordatorio de respaldo (BACKUP-01)', () => {
  it('pulsar «Respaldar ahora» no marca el respaldo antes de exportar', () => {
    const ctx = crearContexto();
    ctx.ejecutarCheck();
    const boton = ctx.status.hijos.find((n) => n.id === 'bkWarnBtn');
    assert.ok(boton, 'debe mostrarse el recordatorio cuando no hay respaldo');

    boton.onclick();

    assert.equal(ctx.cfgBackup.clics, 1, 'el botón debe abrir el flujo real de respaldo');
    assert.equal(ctx.storage.getItem(KEY), null,
      'cancelar o fallar la exportación no puede reiniciar el plazo');
  });

  it('solo cal13backupDone() marca la fecha, y lo hace tras un resultado válido', () => {
    const ctx = crearContexto();
    assert.equal(ctx.storage.getItem(KEY), null);
    ctx.sb.window.cal13backupDone();
    assert.ok(ctx.storage.getItem(KEY), 'el flujo de exportación válido sí debe fechar el respaldo');
  });
});
