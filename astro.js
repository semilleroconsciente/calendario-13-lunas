const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;

function toJulian(ms) { return ms / DAY_MS - 0.5 + J1970; }
function fromJulian(j) { return (j + 0.5 - J1970) * DAY_MS; }
function toDays(ms) { return toJulian(ms) - J2000; }

const OBLIQUITY = RAD * 23.4397;

function solarMeanAnomaly(d) { return RAD * (357.5291 + 0.98560028 * d); }

function eclipticLongitude(M) {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372;
  return M + C + P + Math.PI;
}

function declination(l, b) {
  return Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
}

function rightAscension(l, b) {
  return Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
}

function julianCycle(d, lw) { return Math.round(d - 0.0009 - lw / (2 * Math.PI)); }

function approxTransit(Ht, lw, n) { return 0.0009 + (Ht + lw) / (2 * Math.PI) + n; }

function solarTransitJ(ds, M, L) { return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L); }

function hourAngle(h, phi, d) {
  return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));
}

function sunTimes(noonUTCms, lat, lng) {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d0 = toDays(noonUTCms);
  const n = julianCycle(d0, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);

  const h = RAD * -0.833;
  const w = hourAngle(h, phi, dec);
  if (!isFinite(w)) return { rise: null, set: null };
  const a = approxTransit(w, lw, n);
  const Jset = solarTransitJ(a, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  return { rise: fromJulian(Jrise), set: fromJulian(Jset) };
}

function meanPhase(k) {
  const T = k / 1236.85;
  return 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.000000150 * T * T * T + 0.00000000073 * T * T * T * T;
}

function phaseJDE(k) {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = RAD * (2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3);
  const Ms = RAD * (201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4);
  const F = RAD * (160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4);
  const O = RAD * (124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3);
  const frac = k - Math.floor(k);
  const newOrFull = frac < 0.001 || Math.abs(frac - 0.5) < 0.001;
  let c;
  if (newOrFull) {
    c = (-0.40720) * Math.sin(Ms) + (0.17241 * E) * Math.sin(M) + 0.01608 * Math.sin(2 * Ms) +
      0.01039 * Math.sin(2 * F) + (0.00739 * E) * Math.sin(Ms - M) - (0.00514 * E) * Math.sin(Ms + M) +
      (0.00208 * E * E) * Math.sin(2 * M) - 0.00111 * Math.sin(Ms - 2 * F) - 0.00057 * Math.sin(Ms + 2 * F) +
      (0.00056 * E) * Math.sin(2 * Ms + M) - 0.00042 * Math.sin(3 * Ms) + (0.00042 * E) * Math.sin(M + 2 * F) +
      (0.00038 * E) * Math.sin(M - 2 * F) - (0.00024 * E) * Math.sin(2 * Ms - M) - 0.00017 * Math.sin(O) -
      0.00007 * Math.sin(Ms + 2 * M) + 0.00004 * Math.sin(2 * Ms - 2 * F) + 0.00004 * Math.sin(3 * M) +
      0.00003 * Math.sin(Ms + M - 2 * F) + 0.00003 * Math.sin(2 * Ms + 2 * F) - 0.00003 * Math.sin(Ms + M + 2 * F) +
      0.00003 * Math.sin(Ms - M + 2 * F) - 0.00002 * Math.sin(Ms - M - 2 * F) - 0.00002 * Math.sin(3 * Ms + M) +
      0.00002 * Math.sin(4 * Ms);
  } else {
    c = (-0.62801) * Math.sin(Ms) + (0.17241 * E) * Math.sin(M) + 0.01608 * Math.sin(2 * Ms) +
      0.01039 * Math.sin(2 * F) + (0.00739 * E) * Math.sin(Ms - M) - (0.00514 * E) * Math.sin(Ms + M) +
      (0.00208 * E * E) * Math.sin(2 * M) - 0.00111 * Math.sin(Ms - 2 * F) - 0.00057 * Math.sin(Ms + 2 * F) +
      (0.00056 * E) * Math.sin(2 * Ms + M) - 0.00042 * Math.sin(3 * Ms) + (0.00042 * E) * Math.sin(M + 2 * F) +
      (0.00038 * E) * Math.sin(M - 2 * F) - (0.00024 * E) * Math.sin(2 * Ms - M) - 0.00017 * Math.sin(O) -
      0.00007 * Math.sin(Ms + 2 * M) +
      (Math.abs(frac - 0.25) < 0.001 ? 0.00306 : -0.00306) * Math.sin(F) + 0.000165 * Math.sin(O);
  }
  return meanPhase(k) + c;
}

const DELTA_T_S = 72;

function moonPhaseEvents(fromMs, toMs) {
  const events = [];
  const SYNODIC = 29.530588861;
  let k = Math.floor((new Date(fromMs).getUTCFullYear() - 2000) * 12.3685) - 2;
  const kEnd = k + Math.ceil(((toMs - fromMs) / DAY_MS) / SYNODIC) * 4 + 12;
  const types = [
    ['nueva', '🌑'],
    ['cuarto-creciente', '🌓'],
    ['llena', '🌕'],
    ['cuarto-menguante', '🌗']
  ];
  for (; k <= kEnd; k += 0.25) {
    const jde = phaseJDE(k);
    const utMs = fromJulian(jde) - DELTA_T_S * 1000;
    if (utMs >= fromMs - 2 * DAY_MS && utMs <= toMs + 2 * DAY_MS) {
      const idx = Math.round((k - Math.floor(k)) * 4) % 4;
      events.push({ utcMs: utMs, tipo: types[idx][0], simbolo: types[idx][1] });
    }
  }
  events.sort((a, b) => a.utcMs - b.utcMs);
  return events;
}

function moonCoords(d) {
  const L = RAD * (218.316 + 13.176396 * d);
  const M = RAD * (134.963 + 13.064993 * d);
  const F = RAD * (93.272 + 13.229350 * d);
  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

function moonInfo(ms) {
  const d = toDays(ms);
  const s = { dec: declination(eclipticLongitude(solarMeanAnomaly(d)), 0), ra: 0 };
  const sl = eclipticLongitude(solarMeanAnomaly(d));
  s.ra = rightAscension(sl, 0);
  const m = moonCoords(d);
  const SDIST = 149598000;
  const phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
  const inc = Math.atan2(SDIST * Math.sin(phi), m.dist - SDIST * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
  );
  const fraction = (1 + Math.cos(inc)) / 2;
  const phase = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI;
  return { fraction, phase };
}

const ICONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
function moonIcon(ms) {
  const p = moonInfo(ms).phase;
  return ICONS[Math.round(p * 8) % 8];
}

function tithi(ms) {
  const d = toDays(ms);
  const M = solarMeanAnomaly(d);
  const Ls = eclipticLongitude(M);
  const Lm = moonCoords(d);
  let lSun = Ls;
  let lMoon = Lm.l !== undefined ? Lm.l : Lm.ra;
  if (Lm.l !== undefined) {
    const l = Lm.l || (Lm.ra !== undefined ? Math.atan2(Math.sin(Lm.ra) * Math.cos(OBLIQUITY), Math.cos(Lm.ra)) : 0);
    lMoon = l;
  } else {
    lMoon = Math.atan2(Math.sin(Lm.ra) * Math.cos(OBLIQUITY), Math.cos(Lm.ra));
  }
  let elong = (lMoon - lSun) * 180 / Math.PI;
  elong = ((elong % 360) + 360) % 360;
  return Math.floor(elong / 12) + 1;
}

function tithiPrecise(ms) {
  const d = toDays(ms);
  const M = solarMeanAnomaly(d);
  const Ls = eclipticLongitude(M);
  const mc = moonCoords(d);
  let lMoon;
  {
    const L = RAD * (218.316 + 13.176396 * d);
    const Mm = RAD * (134.963 + 13.064993 * d);
    lMoon = L + RAD * 6.289 * Math.sin(Mm);
  }
  let elong = (lMoon - Ls) * 180 / Math.PI;
  elong = ((elong % 360) + 360) % 360;
  return Math.floor(elong / 12) + 1;
}

window.astro = { sunTimes, moonPhaseEvents, moonInfo, moonIcon, tithi: tithiPrecise };
