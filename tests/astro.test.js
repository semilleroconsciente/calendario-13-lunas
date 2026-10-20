// tests/astro.test.js — tests automaticos para astro.js + cal.js.
// Derivados de scripts/manual/test-astro.js: fijan el comportamiento verificado
// el 2026-10-10 (sol/luna Penco, 50 eventos de fase 2026-27, 8 fases doc).
// Uso: node --test tests/  (o npm test)
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Paso 3 del reorden src/: las fuentes viven en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');
global.window = {};
require(resolverFuente('astro.js'));
require(resolverFuente('data.js'));
Object.assign(global, global.window.pencoData);
require(resolverFuente('cal.js'));
const astro = global.window.astro;
const cal = global.window.cal;
const fmtKey = cal.fmtKey;

const SUN_DAYS = ['2026-06-21', '2026-08-15', '2026-09-05', '2026-09-06', '2026-12-21', '2027-04-03', '2027-06-21'];
const dayKey = (ms) => fmtKey.format(new Date(ms));

describe('sol en Penco (cal.sunForDay)', () => {
  for (const d of SUN_DAYS) {
    it(`${d}: salida y puesta caen el mismo dia`, () => {
      const [y, m, dd] = d.split('-').map(Number);
      const st = cal.sunForDay(Date.UTC(y, m - 1, dd, 12));
      assert.ok(st.rise, 'sin salida calculada');
      assert.ok(st.set, 'sin puesta calculada');
      assert.equal(dayKey(st.rise), d);
      assert.equal(dayKey(st.set), d);
      assert.ok(st.set > st.rise, 'la puesta debe ser posterior a la salida');
    });
  }
});

describe('luna en Penco (cal.moonForDay)', () => {
  for (const d of ['2026-08-28', '2026-09-10', '2026-09-11', '2026-12-21']) {
    it(`${d}: calcula sin lanzar y con valores coherentes`, () => {
      const [y, m, dd] = d.split('-').map(Number);
      const mr = cal.moonForDay(Date.UTC(y, m - 1, dd, 12));
      assert.ok(mr && typeof mr === 'object');
      for (const k of ['rise', 'set']) {
        assert.ok(mr[k] === null || typeof mr[k] === 'number', `${k} debe ser null o ms`);
      }
    });
  }
});

describe('fases lunares (astro.moonPhaseEvents)', () => {
  const evs = astro.moonPhaseEvents(cal.weTripantuUTC(2026), cal.weTripantuUTC(2027));
  it('ciclo 2026-27 trae una cantidad plausible de eventos (base: 50)', () => {
    assert.ok(evs.length >= 40 && evs.length <= 60, `total=${evs.length}`);
  });
  const doc = {
    '2026-06-21': 'cuarto-creciente', '2026-06-29': 'llena',
    '2026-07-07': 'cuarto-menguante', '2026-07-14': 'nueva',
    '2026-11-09': 'nueva', '2026-12-23': 'llena',
    '2027-03-08': 'nueva', '2027-06-18': 'llena',
  };
  for (const [day, tipo] of Object.entries(doc)) {
    it(`${day} ${tipo} encontrada`, () => {
      const hit = evs.find((e) => dayKey(e.utcMs) === day && e.tipo === tipo);
      assert.ok(hit, 'fase documentada no encontrada');
    });
  }
});
