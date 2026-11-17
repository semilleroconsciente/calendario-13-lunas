'use strict';
// ============================================================================
// tests/astro.test.js — Sol, Luna y fases para Penco (astro.js + cal.js).
//
// Fija el comportamiento verificado el 2026-10-10:
// - salida/puesta del sol caen el mismo día (Penco, 7 fechas testigo),
// - la luna nunca lanza y devuelve valores coherentes,
// - el ciclo 2026-27 trae ~50 eventos con las 8 fases documentadas.
// Uso: node --test tests/  (o npm test)
// ============================================================================
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolverFuente } = require('./helpers.cjs');

// Cal.js y astro.js son IIFE de navegador: se exponen vía `window`.
global.window = {};
require(resolverFuente('astro.js'));
require(resolverFuente('data.js'));
Object.assign(global, global.window.pencoData);
require(resolverFuente('cal.js'));

const astro = global.window.astro;
const cal = global.window.cal;
const fmtKey = cal.fmtKey;

// --- Datos testigo -----------------------------------------------------------
const SUN_DAYS = [
  '2026-06-21', '2026-08-15', '2026-09-05', '2026-09-06',
  '2026-12-21', '2027-04-03', '2027-06-21',
];
const MOON_DAYS = ['2026-08-28', '2026-09-10', '2026-09-11', '2026-12-21'];
// Fases documentadas del ciclo (fecha -> tipo esperado).
const FASES_DOC = {
  '2026-06-21': 'cuarto-creciente',
  '2026-06-29': 'llena',
  '2026-07-07': 'cuarto-menguante',
  '2026-07-14': 'nueva',
  '2026-11-09': 'nueva',
  '2026-12-23': 'llena',
  '2027-03-08': 'nueva',
  '2027-06-18': 'llena',
};

const dayKey = (ms) => fmtKey.format(new Date(ms));
const utcNoon = (isoDay) => {
  const [y, m, dd] = isoDay.split('-').map(Number);
  return Date.UTC(y, m - 1, dd, 12);
};

// --- Suite -------------------------------------------------------------------
describe('Sol en Penco (cal.sunForDay)', () => {
  for (const dia of SUN_DAYS) {
    it(`${dia}: la salida y la puesta caen el mismo dia`, () => {
      const st = cal.sunForDay(utcNoon(dia));
      assert.ok(st.rise, 'sin salida calculada');
      assert.ok(st.set, 'sin puesta calculada');
      assert.equal(dayKey(st.rise), dia);
      assert.equal(dayKey(st.set), dia);
      assert.ok(st.set > st.rise, 'la puesta debe ser posterior a la salida');
    });
  }
});

describe('Luna en Penco (cal.moonForDay)', () => {
  for (const dia of MOON_DAYS) {
    it(`${dia}: calcula sin lanzar y con valores coherentes`, () => {
      const mr = cal.moonForDay(utcNoon(dia));
      assert.ok(mr && typeof mr === 'object', 'sin resultado de luna');
      for (const k of ['rise', 'set']) {
        assert.ok(mr[k] === null || typeof mr[k] === 'number', `${k} debe ser null o ms`);
      }
    });
  }
});

describe('Fases lunares (astro.moonPhaseEvents)', () => {
  const eventos = astro.moonPhaseEvents(cal.weTripantuUTC(2026), cal.weTripantuUTC(2027));

  it('el ciclo 2026-27 trae una cantidad plausible de eventos (base: 50)', () => {
    assert.ok(eventos.length >= 40 && eventos.length <= 60, `total=${eventos.length}`);
  });

  for (const [dia, tipo] of Object.entries(FASES_DOC)) {
    it(`${dia} trae fase ${tipo}`, () => {
      const hit = eventos.find((e) => dayKey(e.utcMs) === dia && e.tipo === tipo);
      assert.ok(hit, 'fase documentada no encontrada');
    });
  }
});
