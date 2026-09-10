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

// Salida y puesta de la luna para el día calendario (America/Santiago) que contiene noonMs.
// Barrido de 48h con paso de 4 min sobre la altitud lunar; se conservan los cruces del
// horizonte lunar (h = 0.133°) cuya fecha local coincide con el día pedido.
// Precisión aproximada ±10-15 min (horizonte astronómico, sin cerros). Puede no haber
// salida o puesta algunos días: en ese caso el campo correspondiente es null.
const _moonCache = {};
function moonForDay(noonMs) {
  const key = fmtKey.format(new Date(noonMs));
  if (_moonCache[key]) return _moonCache[key];
  const out = { rise: null, set: null };
  try {
    const [ys, ms, ds] = key.split('-').map(Number);
    const t0 = Date.UTC(ys, ms - 1, ds, 0, 0, 0) - 12 * 3600000;
    const t1 = t0 + 48 * 3600000;
    const step = 4 * 60000;
    const hc = 0.133 * Math.PI / 180;
    const alt = (t) => window.astro.moonPosition(t, PENCO.lat, PENCO.lng).altitude - hc;
    let pT = t0, pA = alt(t0);
    for (let t = t0 + step; t <= t1; t += step) {
      const a = alt(t);
      if ((pA < 0 && a >= 0) || (pA > 0 && a <= 0)) {
        const r = (0 - pA) / (a - pA);
        const tc = Math.round(pT + r * step);
        if (fmtKey.format(new Date(tc)) === key) {
          if (pA < 0 && out.rise === null) out.rise = tc;
          else if (pA > 0 && out.set === null) out.set = tc;
          if (out.rise !== null && out.set !== null) break;
        }
      }
      pT = t; pA = a;
    }
  } catch (e) {}
  _moonCache[key] = out;
  return out;
}

window.cal = { TZ, buildCycle, weTripantuUTC, santiagoParts, weekdayName, phasesByDay, sunForDay, moonForDay, fmtTime, fmtDate, fmtFull, fmtKey };
