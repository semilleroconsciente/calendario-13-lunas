'use strict';
// ============================================================================
// tests/calendario-continuidad.test.js — CAL-01.
//
// Documenta la regla actual: 13×28 + DFT con inicio fijo el 21 de junio.
// Detecta huecos/duplicados al cruzar años bisiestos. No corrige la regla:
// el informe exige una decisión de producto antes de cambiarla.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { leerFuente } = require('./helpers.cjs');

function cargarCal() {
  const sb = { window: {}, Intl, Date, console };
  sb.window.astro = {};
  vm.createContext(sb);
  vm.runInContext(leerFuente('cal.js'), sb, { filename: 'cal.js' });
  return sb.window.cal;
}

function clave(cal, ms) {
  return cal.fmtKey.format(new Date(ms));
}

function fechasDelCiclo(cal, year) {
  return cal.buildCycle(year).days.map((d) => clave(cal, d.noonMs));
}

describe('Calendario 13 lunas: estructura y continuidad', () => {
  const cal = cargarCal();

  it('cada ciclo tiene 13×28 días más DFT simple o doble en bisiesto (CAL-01)', () => {
    for (let y = 2020; y <= 2040; y++) {
      const c = cal.buildCycle(y);
      const bisiesto = cal.esBisiesto(y + 1);
      assert.equal(c.days.length, bisiesto ? 366 : 365, 'ciclo ' + y + ' longitud inesperada');
      const lunas = new Set(c.days.filter((d) => d.luna !== 'dft').map((d) => d.luna));
      assert.equal(lunas.size, 13, 'ciclo ' + y + ' no tiene 13 lunas');
      assert.equal(c.days.filter((d) => d.luna === 'dft').length, bisiesto ? 2 : 1, 'ciclo ' + y + ' DFT inesperado');
    }
  });

  it('el inicio de cada ciclo es el 21 de junio (regla actual)', () => {
    for (let y = 2020; y <= 2040; y++) {
      assert.equal(clave(cal, cal.buildCycle(y).start), y + '-06-21');
    }
  });

  it('no hay fechas duplicadas entre ciclos consecutivos', () => {
    const vistas = new Map();
    const duplicadas = [];
    for (let y = 2019; y <= 2040; y++) {
      for (const f of fechasDelCiclo(cal, y)) {
        if (vistas.has(f)) duplicadas.push(f + ' (' + vistas.get(f) + ' y ' + y + ')');
        vistas.set(f, y);
      }
    }
    assert.deepEqual(duplicadas, [], 'fechas con doble asignación: ' + duplicadas.join(', '));
  });

  it('no hay huecos entre ciclos consecutivos (doble DFT cubre bisiestos)', () => {
    const cubiertas = new Set();
    for (let y = 2019; y <= 2040; y++) fechasDelCiclo(cal, y).forEach((f) => cubiertas.add(f));
    const huecos = [];
    const inicio = Date.UTC(2019, 5, 21, 12);
    const fin = Date.UTC(2041, 5, 21, 12);
    for (let ms = inicio; ms < fin; ms += 86400000) {
      const f = clave(cal, ms);
      if (!cubiertas.has(f)) huecos.push(f);
    }
    assert.deepEqual(huecos, [], 'huecos no documentados: ' + huecos.join(', '));
  });

  // Criterio de aceptación CAL-01 (doble DFT): cobertura total verificada.
  it('todas las fechas gregorianas tienen exactamente una asignación', () => {
    const cubiertas = new Set();
    for (let y = 2019; y <= 2040; y++) fechasDelCiclo(cal, y).forEach((f) => cubiertas.add(f));
    const huecos = [];
    const inicio = Date.UTC(2019, 5, 21, 12);
    const fin = Date.UTC(2041, 5, 21, 12);
    for (let ms = inicio; ms < fin; ms += 86400000) {
      const f = clave(cal, ms);
      if (!cubiertas.has(f)) huecos.push(f);
    }
    assert.deepEqual(huecos, [], 'fechas sin asignación: ' + huecos.join(', '));
  });
});
