// tests/ics.test.js — importar/exportar compromisos (.ics, RFC 5545).
// Cubre: roundtrip build->parse, escape/plegado, DTSTART (flotante,
// TZID, UTC->America/Santiago, solo-fecha), RRULE simple, evento de
// varios días, e inserción sin duplicar (applyEvents con stubs).
// Uso: node --test "tests/*.test.js" (o npm test)
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
// Paso 3 del reorden src/: ics-modulo.js vive en src/ tras la mudanza.
const { resolverFuente } = require('../scripts/paths.cjs');

function loadICS(stubs) {
  const sandbox = Object.assign({ window: {}, console }, stubs || {});
  vm.createContext(sandbox);
  vm.runInContext(
    fs.readFileSync(resolverFuente('ics-modulo.js'), 'utf8'),
    sandbox,
    { filename: 'ics-modulo.js' }
  );
  return sandbox.window.Cal13ICS;
}

const ICS = loadICS();

function vevent(ics, uid) {
  const blocks = ics.split('BEGIN:VEVENT').slice(1);
  if (!uid) return blocks[0];
  return blocks.find((b) => b.includes('UID:' + uid));
}

// Los arrays vienen del realm vm: se comparan tras pasar a JSON.
function eqArr(actual, expected) {
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected);
}

describe('ics: buildICS', () => {
  it('genera VCALENDAR válido con un evento', () => {
    const ics = ICS.buildICS([{
      uid: 'a1', dateKey: '2026-07-04', time: '08:37',
      summary: 'Reunión junta de vecinos', description: 'Luna 2 · Día 5 de 28 — Calendario 13 Lunas · Penco', alarm: true,
    }]);
    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('END:VCALENDAR'));
    assert.ok(ics.includes('METHOD:PUBLISH'));
    assert.ok(ics.includes('PRODID:-//Semillero Consciente//Calendario 13 Lunas//ES'));
    const ev = vevent(ics, 'a1@calendario-13-lunas');
    assert.ok(ev, 'evento con UID esperado');
    assert.ok(ev.includes('DTSTART;TZID=America/Santiago:20260704T083700'));
    assert.ok(ev.includes('DTEND;TZID=America/Santiago:20260704T093700'), 'fin = inicio + 60 min');
    assert.ok(ev.includes('SUMMARY:Reunión junta de vecinos'));
    assert.ok(ev.includes('BEGIN:VALARM') && ev.includes('TRIGGER:-PT15M'), '🔔 genera alarma');
    assert.ok(/DTSTAMP:\d{8}T\d{6}Z/.test(ev));
  });

  it('fin cruza la medianoche al día siguiente', () => {
    const ics = ICS.buildICS([{ uid: 'x', dateKey: '2026-07-04', time: '23:30', summary: 'Turno' }]);
    assert.ok(vevent(ics, 'x@').includes('DTEND;TZID=America/Santiago:20260705T003000'));
  });

  it('sin alarma no incluye VALARM y ordena por fecha', () => {
    const ics = ICS.buildICS([
      { uid: 'b', dateKey: '2026-07-05', time: '10:00', summary: 'B' },
      { uid: 'a', dateKey: '2026-07-04', time: '10:00', summary: 'A' },
    ]);
    assert.ok(!ics.includes('VALARM'));
    assert.ok(ics.indexOf('SUMMARY:A') < ics.indexOf('SUMMARY:B'));
  });

  it('escapa ; , \\ y saltos de línea (roundtrip)', () => {
    const sum = 'Taller; siembra, trasplante \\ y mate\nsegunda línea';
    const ics = ICS.buildICS([{ uid: 'e', dateKey: '2026-07-04', time: '10:00', summary: sum }]);
    assert.ok(ics.includes('Taller\\; siembra\\, trasplante \\\\ y mate\\nsegunda línea'));
    const back = ICS.parseICS(ics);
    assert.equal(back.events.length, 1);
    assert.equal(back.events[0].summary, sum);
  });

  it('pliega líneas largas y las recupera intactas (tope 80 de la agenda)', () => {
    const sum = 'Horario de riego del semillero comunitario del cerro verde con todas las familias del sector norte y sur'.repeat(2);
    const ics = ICS.buildICS([{ uid: 'l', dateKey: '2026-07-04', time: '10:00', summary: sum }]);
    assert.ok(ics.includes('\r\n '), 'hay plegado CRLF+espacio');
    const back = ICS.parseICS(ics);
    assert.equal(back.events[0].summary, sum.slice(0, 80));
  });
});

describe('ics: parseICS', () => {
  it('lee flotante, TZID y fecha sola', () => {
    const ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\n' +
      'BEGIN:VEVENT\r\nUID:1\r\nDTSTART:20260704T083700\r\nSUMMARY:Flotante\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nUID:2\r\nDTSTART;TZID=America/Santiago:20260705T140500\r\nSUMMARY:Con zona\r\nEND:VEVENT\r\n' +
      'BEGIN:VEVENT\r\nUID:3\r\nDTSTART;VALUE=DATE:20260706\r\nSUMMARY:Día completo\r\nEND:VEVENT\r\n' +
      'END:VCALENDAR\r\n';
    const r = ICS.parseICS(ics);
    assert.equal(r.events.length, 3);
    assert.deepEqual([r.events[0].dateKey, r.events[0].time], ['2026-07-04', '08:37']);
    assert.deepEqual([r.events[1].dateKey, r.events[1].time], ['2026-07-05', '14:05']);
    assert.equal(r.events[2].time, '09:00');
    assert.equal(r.events[2].allDay, true);
  });

  it('convierte DTSTART UTC (...Z) a hora de Penco', () => {
    // 2026-07-04 12:37 UTC = 08:37 en America/Santiago (invierno, UTC-4)
    const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:z\r\nDTSTART:20260704T123700Z\r\nSUMMARY:Zulu\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    const r = ICS.parseICS(ics);
    assert.equal(r.events.length, 1);
    const f = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const p = {};
    for (const part of f.formatToParts(new Date(Date.UTC(2026, 6, 4, 12, 37)))) p[part.type] = part.value;
    const hh = p.hour === '24' ? '00' : p.hour;
    assert.equal(r.events[0].dateKey, `${p.year}-${p.month}-${p.day}`);
    assert.equal(r.events[0].time, `${hh}:${p.minute}`);
  });

  it('expande RRULE semanal con COUNT (taller semanal)', () => {
    const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:w\r\nDTSTART:20260706T100000\r\nRRULE:FREQ=WEEKLY;COUNT=3\r\nSUMMARY:Taller\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    const r = ICS.parseICS(ics);
    assert.equal(r.events.length, 3);
    eqArr(r.events.map((e) => e.dateKey), ['2026-07-06', '2026-07-13', '2026-07-20']);
  });

  it('recurrente sin COUNT ni UNTIL importa solo la primera instancia', () => {
    const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:w\r\nDTSTART:20260706T100000\r\nRRULE:FREQ=WEEKLY\r\nSUMMARY:Sin fin\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    const r = ICS.parseICS(ics);
    assert.equal(r.events.length, 1);
    assert.equal(r.events[0].dateKey, '2026-07-06');
    assert.equal(r.skipped, 0);
  });

  it('evento de varios días crea un compromiso por día', () => {
    const ics = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:m\r\nDTSTART;VALUE=DATE:20260706\r\nDTEND;VALUE=DATE:20260708\r\nSUMMARY:Fiesta\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    const r = ICS.parseICS(ics);
    eqArr(r.events.map((e) => e.dateKey), ['2026-07-06', '2026-07-07']);
  });

  it('sin DTSTART se omite y archivo vacío no rompe', () => {
    const r = ICS.parseICS('BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:s\r\nSUMMARY:Sin fecha\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n');
    assert.equal(r.events.length, 0);
    assert.equal(r.skipped, 1);
    eqArr(ICS.parseICS('').events, []);
    eqArr(ICS.parseICS(null).events, []);
  });
});

describe('ics: applyEvents (con stubs)', () => {
  function loadWithStubs() {
    const store = { cycles: {} };
    return {
      api: loadICS({
        CYCLE_YEARS: [2026],
        cal: {
          buildCycle: (y) => ({
            days: [
              { luna: 1, diaN: 1, noonMs: Date.UTC(2026, 5, 21, 12) },
              { luna: 'dft', diaN: 1, noonMs: Date.UTC(2027, 5, 20, 12) },
            ],
          }),
          fmtKey: { format: (d) => d.toISOString().slice(0, 10) },
        },
        userData: () => store,
        sanitizeText: (s, m) => String(s).slice(0, m),
        scheduleSave: () => {},
        rebuildLunaByKey: () => {},
        renderCurrentView: () => {},
        store,
      }),
      store,
    };
  }

  it('inserta, no duplica, e informa fuera-rango y DFT', () => {
    const { api, store } = loadWithStubs();
    const evs = [
      { uid: 'a', dateKey: '2026-06-21', time: '10:00', summary: 'Minga' },
      { uid: 'b', dateKey: '2030-01-01', time: '10:00', summary: 'Lejos' },
      { uid: 'c', dateKey: '2027-06-20', time: '10:00', summary: 'Cierre' },
    ];
    const r1 = api.applyEvents(evs);
    assert.equal(r1.added, 1);
    assert.equal(r1.fuera, 1);
    assert.equal(r1.dft, 1);
    const cell = store.cycles['2026'].moons['1'].days[1];
    assert.equal(cell.agenda.length, 1);
    assert.equal(cell.agenda[0].text, 'Minga');
    assert.equal(cell.agenda[0].time, '10:00');
    const r2 = api.applyEvents([evs[0]]);
    assert.equal(r2.added, 0);
    assert.equal(r2.dup, 1);
  });
});
