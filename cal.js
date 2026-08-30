const TZ = 'America/Santiago';

const fmtTime = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDate = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, day: 'numeric', month: 'short' });
const fmtFull = new Intl.DateTimeFormat('es-CL', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const fmtKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

function santiagoParts(ms) {
  const p = {};
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  });
  for (const part of fmt.formatToParts(new Date(ms))) p[part.type] = part.value;
  return { y: +p.year, m: +p.month, d: +p.day, hh: p.hour === '24' ? '00' : p.hour };
}

function utcNoon(y, m0, d) { return Date.UTC(y, m0, d, 12, 0, 0); }

function weTripantuUTC(year) { return utcNoon(year, 5, 21); }

function buildCycle(year) {
  const start = weTripantuUTC(year);
  const days = [];
  for (let luna = 1; luna <= 13; luna++) {
    for (let dia = 1; dia <= 28; dia++) {
      const ms = start + ((luna - 1) * 28 + (dia - 1)) * 86400000;
      days.push({ luna, diaN: dia, noonMs: ms });
    }
  }
  days.push({ luna: 'dft', diaN: 1, noonMs: start + 364 * 86400000 });
  return { year, start, days };
}

function weekdayName(ms) {
  const { y, m, d } = santiagoParts(ms);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][wd];
}

function phasesByDay(fromMs, toMs) {
  const map = {};
  for (const ev of window.astro.moonPhaseEvents(fromMs - 86400000, toMs + 86400000)) {
    const key = fmtKey.format(new Date(ev.utcMs));
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  }
  return map;
}

function sunForDay(noonMs) {
  const { y, m, d } = santiagoParts(noonMs);
  const base = Date.UTC(y, m - 1, d, 12, 0, 0);
  return window.astro.sunTimes(base, PENCO.lat, PENCO.lng);
}

window.cal = { TZ, buildCycle, weTripantuUTC, santiagoParts, weekdayName, phasesByDay, sunForDay, fmtTime, fmtDate, fmtFull, fmtKey };
