/* ============================================================
   CARTA ASTRAL / NATAL — Calendario 13 Lunas (Penco · Bio-Bio)
   Apartado: Territorio > Astro 🔭 > pestana "Carta Natal".
   - Calculo tropical aproximado (valido 1800-2050, precision ~1°;
     Luna/Asc sensibles a hora exacta). 100% local y offline.
   - Planetas por elementos orbitales JPL aproximados + Luna (serie
     truncada estilo Meeus/Schlyter) + Nodo Norte medio.
   - Asc/MC por tiempo sideral, casas iguales (cuspide 1 = ASC).
   - Rueda SVG, tabla, aspectos, interpretaciones base y perfiles
     guardados por usuario (DATA + scheduleSave).
   No reemplaza a un astrologo profesional; es educativo.
   ============================================================ */
(function () {
'use strict';

var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function clean(s, n) {
  if (typeof sanitizeText === 'function') return sanitizeText(s, n);
  return String(s == null ? '' : s).slice(0, n || 200);
}
function uid(p) { return (p || 'c') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado ✓'); } catch (e) {} }

/* ---------------- util astronomico ---------------- */
var D2R = Math.PI / 180, R2D = 180 / Math.PI;
function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
function sinD(x) { return Math.sin(x * D2R); }
function cosD(x) { return Math.cos(x * D2R); }
function tanD(x) { return Math.tan(x * D2R); }

/* Elementos JPL aproximados (a AU, e, I deg, L deg, varpi deg, Omega deg + tasas / siglo). */
var ELEM = {
  Mercury: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593, 0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  Venus:   [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255, 0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418],
  Earth:   [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0, 0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
  Mars:    [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  Jupiter: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  Saturn:  [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
  Uranus:  [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.96227630, 74.01692503, -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
  Neptune: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574, 0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664],
  Pluto:   [39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 132.38465405, -0.00031596, 0.00005170, 0.00004818, 145.20780515, -0.04062942, -0.92405365]
};
function keplerE(Mdeg, e) {
  var M = Mdeg * D2R, E = M + e * Math.sin(M);
  for (var i = 0; i < 12; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}
function helio(key, T) {
  var p = ELEM[key];
  var a = p[0] + p[6] * T, e = p[1] + p[7] * T, I = p[2] + p[8] * T,
      L = p[3] + p[9] * T, lp = p[4] + p[10] * T, om = p[5] + p[11] * T;
  var M = norm360(L - lp), w = norm360(lp - om);
  var E = keplerE(M, e);
  var xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  var v = Math.atan2(yp, xp) * R2D, r = Math.sqrt(xp * xp + yp * yp);
  var vw = (v + w) * D2R, oR = om * D2R, iR = I * D2R;
  return {
    x: r * (Math.cos(oR) * Math.cos(vw) - Math.sin(oR) * Math.sin(vw) * Math.cos(iR)),
    y: r * (Math.sin(oR) * Math.cos(vw) + Math.cos(oR) * Math.sin(vw) * Math.cos(iR)),
    z: r * (Math.sin(vw) * Math.sin(iR)), r: r
  };
}
/* Luna: longitud/latitud ecliptica geocentrica (serie truncada, ~0.3°). */
function moonEcl(JD) {
  var d = JD - 2451545.0;
  var N = norm360(125.1228 - 0.0529538083 * d);
  var i = 5.1454 * D2R;
  var w = norm360(318.0634 + 0.1643573223 * d);
  var e = 0.054900;
  var M = norm360(115.3654 + 13.0649929509 * d);
  var E = keplerE(M, e);
  var a = 60.2666, xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  var v = Math.atan2(yp, xp) * R2D, r = Math.sqrt(xp * xp + yp * yp);
  var vw = (v + w) * D2R, nR = N * D2R;
  var xh = r * (Math.cos(nR) * Math.cos(vw) - Math.sin(nR) * Math.sin(vw) * Math.cos(i));
  var yh = r * (Math.sin(nR) * Math.cos(vw) + Math.cos(nR) * Math.sin(vw) * Math.cos(i));
  var zh = r * (Math.sin(vw) * Math.sin(i));
  var lon = norm360(Math.atan2(yh, xh) * R2D);
  var lat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * R2D;
  /* perturbaciones principales */
  var Ms = norm360(356.0470 + 0.9856002585 * d);
  var wSun = norm360(282.9404 + 4.70935e-5 * d);
  var Ls = norm360(wSun + Ms);
  var Lm = norm360(N + w + M);
  var D = norm360(Lm - Ls);
  var F = norm360(Lm - N);
  lon += -1.274 * sinD(M - 2 * D) + 0.658 * sinD(2 * D) - 0.186 * sinD(Ms)
    - 0.059 * sinD(2 * M - 2 * D) - 0.057 * sinD(M - 2 * D + Ms)
    + 0.053 * sinD(M + 2 * D) + 0.046 * sinD(2 * D - Ms)
    + 0.041 * sinD(M - Ms) - 0.035 * sinD(D) - 0.031 * sinD(M + Ms)
    - 0.015 * sinD(2 * F - 2 * D) + 0.011 * sinD(M - 4 * D);
  lat += -0.173 * sinD(F - 2 * D) - 0.055 * sinD(M - F - 2 * D)
    - 0.046 * sinD(M + F - 2 * D) + 0.033 * sinD(F + 2 * D) + 0.017 * sinD(2 * M + F);
  r += -0.58 * cosD(M - 2 * D) - 0.46 * cosD(2 * D);
  return { lon: norm360(lon), lat: lat, dist: r };
}
function calcPlanets(jd) {
  var T = (jd - 2451545.0) / 36525;
  var E = helio('Earth', T);
  var out = {};
  out.Earth = E;
  var sunLon = norm360(Math.atan2(-E.y, -E.x) * R2D);
  out.Sun = { lon: sunLon, lat: 0 };
  ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].forEach(function (k) {
    var h = helio(k, T);
    var gx = h.x - E.x, gy = h.y - E.y, gz = h.z - E.z;
    out[k] = { lon: norm360(Math.atan2(gy, gx) * R2D), lat: Math.atan2(gz, Math.sqrt(gx * gx + gy * gy)) * R2D };
  });
  var mo = moonEcl(jd);
  out.Moon = { lon: mo.lon, lat: mo.lat };
  out.Node = { lon: norm360(125.04452 - 1934.136261 * T), lat: 0 };
  return out;
}
function obliquity(T) { return 23.4392911 - 0.0130042 * T - 0.00000164 * T * T + 0.000000504 * T * T * T; }
function gmstDeg(jd) {
  var T = (jd - 2451545.0) / 36525;
  var g = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
  return norm360(g);
}
function ascMc(jd, lat, lng) {
  var T = (jd - 2451545.0) / 36525;
  var eps = obliquity(T) * D2R;
  var ramc = norm360(gmstDeg(jd) + lng) * D2R;
  var phi = lat * D2R;
  var mc = Math.atan2(Math.tan(ramc), Math.cos(eps)) * R2D;
  mc = norm360(mc + (Math.cos(ramc) < 0 ? 180 : 0));
  var num = Math.cos(ramc);
  var den = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  var asc = Math.atan2(num, den) * R2D;
  return { asc: norm360(asc), mc: norm360(mc) };
}

/* ---------------- zodiaco / casas / aspectos ---------------- */
var SIGNOS = [
  { n: 'Aries', g: '♈', el: 'Fuego', q: 'Cardinal', reg: 'Marte', t: 'Impulso, inicio y coraje. Aprende a encender sin quemar: actuar con dirección.' },
  { n: 'Tauro', g: '♉', el: 'Tierra', q: 'Fijo', reg: 'Venus', t: 'Constancia, cuerpo y goce simple. Aprende a sostener sin aferrar.' },
  { n: 'Géminis', g: '♊', el: 'Aire', q: 'Mutable', reg: 'Mercurio', t: 'Curiosidad, palabra y vínculo. Aprende a comunicar sin dispersar.' },
  { n: 'Cáncer', g: '♋', el: 'Agua', q: 'Cardinal', reg: 'Luna', t: 'Cuidado, memoria y hogar. Aprende a proteger sin encerrar.' },
  { n: 'Leo', g: '♌', el: 'Fuego', q: 'Fijo', reg: 'Sol', t: 'Brillo, juego y corazón. Aprende a liderar desde la alegría, no del ego.' },
  { n: 'Virgo', g: '♍', el: 'Tierra', q: 'Mutable', reg: 'Mercurio', t: 'Orden, servicio y detalle. Aprende a mejorar sin criticarte.' },
  { n: 'Libra', g: '♎', el: 'Aire', q: 'Cardinal', reg: 'Venus', t: 'Encuentro, belleza y justicia. Aprende a acordar sin perderte.' },
  { n: 'Escorpio', g: '♏', el: 'Agua', q: 'Fijo', reg: 'Plutón/Marte', t: 'Profundidad, transformación y verdad. Aprende a soltar para renacer.' },
  { n: 'Sagitario', g: '♐', el: 'Fuego', q: 'Mutable', reg: 'Júpiter', t: 'Sentido, viaje y horizonte. Aprende a creer sin imponer.' },
  { n: 'Capricornio', g: '♑', el: 'Tierra', q: 'Cardinal', reg: 'Saturno', t: 'Meta, estructura y maestría. Aprende a llegar paso a paso.' },
  { n: 'Acuario', g: '♒', el: 'Aire', q: 'Fijo', reg: 'Urano/Saturno', t: 'Red, futuro y libertad. Aprende a ser diferente sin aislarte.' },
  { n: 'Piscis', g: '♓', el: 'Agua', q: 'Mutable', reg: 'Neptuno/Júpiter', t: 'Sueño, compasión y arte. Aprende a sentir sin disolverte.' }
];
var PLANETAS = [
  { id: 'Sun', nombre: 'Sol', g: '☉', color: '#e8c56a', orb: 8, txt: 'Identidad y propósito: lo que vienes a irradiar.' },
  { id: 'Moon', nombre: 'Luna', g: '☽', color: '#cdd3ee', orb: 8, txt: 'Mundo emocional y refugio: lo que necesitas para sentirte en casa.' },
  { id: 'Mercury', nombre: 'Mercurio', g: '☿', color: '#9fc2ee', orb: 6, txt: 'Mente y palabra: cómo piensas y comunicas.' },
  { id: 'Venus', nombre: 'Venus', g: '♀', color: '#f0a8c8', orb: 6, txt: 'Afectos y valores: cómo amas y qué disfrutas.' },
  { id: 'Mars', nombre: 'Marte', g: '♂', color: '#ff8c6a', orb: 6, txt: 'Acción y deseo: cómo vas por lo que quieres.' },
  { id: 'Jupiter', nombre: 'Júpiter', g: '♃', color: '#a9d18e', orb: 6, txt: 'Expansión y sentido: dónde creces con confianza.' },
  { id: 'Saturn', nombre: 'Saturno', g: '♄', color: '#b8a88f', orb: 6, txt: 'Límite y maestría: dónde maduras con esfuerzo.' },
  { id: 'Uranus', nombre: 'Urano', g: '♅', color: '#7ab8ff', orb: 5, txt: 'Cambio y libertad: dónde rompes moldes.' },
  { id: 'Neptune', nombre: 'Neptuno', g: '♆', color: '#8f9ff0', orb: 5, txt: 'Sueño y disolución: dónde idealizas y creas.' },
  { id: 'Pluto', nombre: 'Plutón', g: '♇', color: '#c88ff0', orb: 5, txt: 'Poder y transformación: dónde mueres y renaces.' },
  { id: 'Node', nombre: 'Nodo Norte', g: '☊', color: '#8fd694', orb: 4, txt: 'Rumbo del alma: la dirección de crecimiento en esta vida.' }
];
var CASAS_TXT = [
  'Yo y cuerpo: cómo te presentas al mundo.', 'Recursos y valor: dinero, autoestima, lo propio.',
  'Mente cercana: estudios, hermanos, entorno, palabra.', 'Hogar y raíces: familia, madre, territorio interior.',
  'Creación: hijos, arte, juego, romance.', 'Salud y oficio: trabajo diario, hábitos, servicio.',
  'Vínculos: pareja, socios, acuerdos cara a cara.', 'Lo compartido: crisis, herencias, sexualidad, renacer.',
  'Sentido: estudios largos, viajes, filosofía.', 'Vocación: profesión, prestigio, lugar público.',
  'Red: amistades, grupos, sueños colectivos.', 'Interior: retiro, inconsciente, cierre y compasión.'
];
var ASPECTOS = [
  { n: 'Conjunción', g: '☌', a: 0, orbe: 8, c: '#ff9a9a', t: 'Fusión de energías: se expresan juntas, para bien o tensión.' },
  { n: 'Sextil', g: '⚹', a: 60, orbe: 5, c: '#8fd694', t: 'Oportunidad fluida: talentos que se activan si los usas.' },
  { n: 'Cuadratura', g: '□', a: 90, orbe: 6, c: '#e76e8a', t: 'Fricción creativa: pide acción y ajuste, gran motor.' },
  { n: 'Trígono', g: '△', a: 120, orbe: 6, c: '#7ab8ff', t: 'Fluidez natural: dones que salen fácil, cuídalos del exceso.' },
  { n: 'Oposición', g: '☍', a: 180, orbe: 8, c: '#e8c56a', t: 'Polaridad: integrar dos polos, ni uno ni otro, ambos.' }
];
function signOf(lon) {
  var i = Math.floor(norm360(lon) / 30) % 12;
  var d = norm360(lon) - i * 30;
  return { idx: i, s: SIGNOS[i], grado: d };
}
function fmtGrado(lon) {
  var s = signOf(lon);
  var g = Math.floor(s.grado), m = Math.floor((s.grado - g) * 60);
  return g + '°' + String(m).padStart(2, '0') + '′ ' + s.s.g + ' ' + s.s.n;
}
function houseOf(lon, asc) {
  if (asc == null || !isFinite(asc)) return null;
  return Math.floor(norm360(lon - asc) / 30) + 1;
}
function calcCarta(utcMs, lat, lng, conHora) {
  var jd = utcMs / 86400000 + 2440587.5;
  var pos = calcPlanets(jd);
  var am = null;
  if (conHora) { try { am = ascMc(jd, lat, lng); } catch (e) { am = null; } }
  var asc = am ? am.asc : null, mc = am ? am.mc : null;
  /* retrogradacion: compara lon +0.6 dias */
  var pos2 = calcPlanets(jd + 0.6);
  var list = PLANETAS.map(function (p) {
    var o = pos[p.id]; if (!o) return null;
    var o2 = pos2[p.id];
    var retro = false;
    if (o2 && p.id !== 'Sun' && p.id !== 'Moon' && p.id !== 'Node') {
      var d = norm360(o2.lon - o.lon);
      retro = d > 180;
    }
    var s = signOf(o.lon);
    return { id: p.id, nombre: p.nombre, g: p.g, color: p.color, lon: o.lon, lat: o.lat, signo: s.s, signoIdx: s.idx, casa: houseOf(o.lon, asc), retro: retro, meta: p };
  }).filter(Boolean);
  var houses = [];
  if (asc != null) for (var i = 0; i < 12; i++) houses.push({ n: i + 1, cusp: norm360(asc + i * 30), signo: signOf(norm360(asc + i * 30)).s });
  var aspects = [];
  var pts = list.slice();
  if (asc != null) pts.push({ id: 'ASC', nombre: 'Ascendente', g: 'AC', color: '#ffffff', lon: asc, meta: { orb: 5 } });
  if (mc != null) pts.push({ id: 'MC', nombre: 'Medio Cielo', g: 'MC', color: '#ffffff', lon: mc, meta: { orb: 5 } });
  for (var a = 0; a < pts.length; a++) for (var b = a + 1; b < pts.length; b++) {
    var dRaw = Math.abs(norm360(pts[a].lon - pts[b].lon));
    var d = dRaw > 180 ? 360 - dRaw : dRaw;
    for (var k = 0; k < ASPECTOS.length; k++) {
      var asp = ASPECTOS[k];
      var orbeMax = Math.min(asp.orbe, ((pts[a].meta && pts[a].meta.orb) || 6 + 2), ((pts[b].meta && pts[b].meta.orb) || 6 + 2));
      if (pts[a].id === 'Sun' || pts[a].id === 'Moon' || pts[b].id === 'Sun' || pts[b].id === 'Moon') orbeMax = Math.min(9, asp.orbe + 2);
      if (Math.abs(d - asp.a) <= orbeMax) {
        aspects.push({ p1: pts[a], p2: pts[b], asp: asp, orbe: Math.abs(d - asp.a), diff: d });
        break;
      }
    }
  }
  aspects.sort(function (x, y) { return x.orbe - y.orbe; });
  return { jd: jd, utcMs: utcMs, lat: lat, lng: lng, conHora: conHora, planetas: list, asc: asc, mc: mc, houses: houses, aspects: aspects.slice(0, 24) };
}

/* ---------------- ciudades + zona horaria ---------------- */
var CIUDADES = [
  { n: 'Penco', lat: -36.7319, lng: -72.9925 },
  { n: 'Concepción', lat: -36.8282, lng: -73.0514 },
  { n: 'Talcahuano', lat: -36.7249, lng: -73.1169 },
  { n: 'Tomé', lat: -36.6177, lng: -72.9578 },
  { n: 'Chillán', lat: -36.6066, lng: -72.1024 },
  { n: 'Los Ángeles', lat: -37.4707, lng: -72.3497 },
  { n: 'Temuco', lat: -38.7359, lng: -72.5904 },
  { n: 'Valdivia', lat: -39.8142, lng: -73.2459 },
  { n: 'Santiago', lat: -33.4489, lng: -70.6693 },
  { n: 'Valparaíso', lat: -33.0458, lng: -71.6197 },
  { n: 'La Serena', lat: -29.9027, lng: -71.3439 },
  { n: 'Antofagasta', lat: -23.6500, lng: -70.4000 },
  { n: 'Iquique', lat: -20.2307, lng: -70.1357 },
  { n: 'Punta Arenas', lat: -53.1638, lng: -70.9171 },
  { n: 'Rapa Nui (Isla de Pascua)', lat: -27.1127, lng: -109.3497 },
  { n: 'Otra (manual)', lat: null, lng: null }
];
function tzOffsetMin(tz, utcMs) {
  try {
    var dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    var parts = {};
    dtf.formatToParts(new Date(utcMs)).forEach(function (p) { parts[p.type] = p.value; });
    var asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour === 24 ? 0 : +parts.hour, +parts.minute, +parts.second);
    return Math.round((asUTC - utcMs) / 60000);
  } catch (e) { return null; }
}
/* Convierte fecha+hora de muro en zona dada a UTC ms. */
function muroAZonaUTC(y, mo, d, hh, mm, zona) {
  var guess = Date.UTC(y, mo - 1, d, hh, mm, 0);
  if (!zona || zona === 'auto') zona = 'America/Santiago';
  if (/^UTC/.test(zona)) {
    var m = zona.match(/UTC([+-])(\d+)(?::(\d+))?/);
    if (m) { var off = (+m[2]) * 60 + (+(m[3] || 0)); if (m[1] === '-') off = -off; return guess - off * 60000; }
    return guess;
  }
  var off1 = tzOffsetMin(zona, guess - 4 * 3600000);
  if (off1 == null) off1 = -240;
  var utc = guess - off1 * 60000;
  var off2 = tzOffsetMin(zona, utc);
  if (off2 != null && off2 !== off1) utc = guess - off2 * 60000;
  return utc;
}

/* ---------------- almacenamiento por usuario ---------------- */
function getStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { perfiles: [], ultimo: null };
    if (!u.cartaNatal) u.cartaNatal = { perfiles: [], ultimo: null };
    if (!Array.isArray(u.cartaNatal.perfiles)) u.cartaNatal.perfiles = [];
    return u.cartaNatal;
  } catch (e) { return { perfiles: [], ultimo: null }; }
}

/* ---------------- rueda SVG ---------------- */
function polar(cx, cy, r, angDeg) {
  var a = (angDeg - 90) * D2R;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function buildWheel(carta, titulo) {
  var S = 360, C = 180, R = 172, Rs = 138, Rp = 104;
  var asc = (carta.asc != null) ? carta.asc : 0;
  function ang(lon) { return norm360(180 + (lon - asc)); }
  var h = '<svg viewBox="0 0 360 360" class="carta-wheel" role="img" aria-label="Rueda de carta natal">';
  h += '<circle cx="180" cy="180" r="172" class="cw-outer"/>';
  h += '<circle cx="180" cy="180" r="138" class="cw-mid"/>';
  h += '<circle cx="180" cy="180" r="96" class="cw-inner"/>';
  var elColor = { Fuego: '#ff8c6a', Tierra: '#a9d18e', Aire: '#7ab8ff', Agua: '#8f9ff0' };
  for (var i = 0; i < 12; i++) {
    var lon0 = i * 30, a0 = ang(lon0), a1 = ang(lon0 + 30);
    var p0 = polar(C, C, R, a0), p1 = polar(C, C, R, a1);
    var q0 = polar(C, C, Rs, a0), q1 = polar(C, C, Rs, a1);
    h += '<path d="M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' L' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' L' + q1[0].toFixed(1) + ' ' + q1[1].toFixed(1) + ' L' + q0[0].toFixed(1) + ' ' + q0[1].toFixed(1) + ' Z" class="cw-sign" style="--el:' + elColor[SIGNOS[i].el] + '"/>';
    var mid = polar(C, C, (R + Rs) / 2, ang(lon0 + 15));
    h += '<text x="' + mid[0].toFixed(1) + '" y="' + (mid[1] + 5).toFixed(1) + '" text-anchor="middle" class="cw-sign-g">' + SIGNOS[i].g + '</text>';
  }
  if (carta.conHora) {
    for (var hi = 0; hi < 12; hi++) {
      var cusp = norm360(asc + hi * 30), ac = ang(cusp);
      var c0 = polar(C, C, Rs, ac), c1 = polar(C, C, 60, ac);
      h += '<line x1="' + c0[0].toFixed(1) + '" y1="' + c0[1].toFixed(1) + '" x2="' + c1[0].toFixed(1) + '" y2="' + c1[1].toFixed(1) + '" class="cw-house"/>';
      var hn = polar(C, C, 78, ang(cusp + 15));
      h += '<text x="' + hn[0].toFixed(1) + '" y="' + (hn[1] + 3).toFixed(1) + '" text-anchor="middle" class="cw-house-n">' + (hi + 1) + '</text>';
    }
  }
  /* aspectos al centro */
  carta.aspects.slice(0, 14).forEach(function (x) {
    var A = polar(C, C, 58, ang(x.p1.lon)), B = polar(C, C, 58, ang(x.p2.lon));
    h += '<line x1="' + A[0].toFixed(1) + '" y1="' + A[1].toFixed(1) + '" x2="' + B[0].toFixed(1) + '" y2="' + B[1].toFixed(1) + '" style="stroke:' + x.asp.c + ';stroke-width:1;opacity:.55"/>';
  });
  /* planetas con anti-colision simple */
  var orden = carta.planetas.slice().sort(function (a, b) { return a.lon - b.lon; });
  var usados = [];
  orden.forEach(function (p) {
    var a = ang(p.lon);
    for (var k = 0; k < usados.length; k++) {
      var dd = Math.abs(norm360(a - usados[k]));
      dd = dd > 180 ? 360 - dd : dd;
      if (dd < 7) { a = norm360(usados[k] + 7); break; }
    }
    usados.push(a);
    p._a = a;
    var pp = polar(C, C, Rp, a);
    var dot = polar(C, C, 96, ang(p.lon));
    h += '<circle cx="' + dot[0].toFixed(1) + '" cy="' + dot[1].toFixed(1) + '" r="2.2" style="fill:' + p.color + '"/>';
    h += '<text x="' + pp[0].toFixed(1) + '" y="' + (pp[1] + 5).toFixed(1) + '" text-anchor="middle" class="cw-pl" style="fill:' + p.color + '" title="' + esc(p.nombre) + ' ' + fmtGrado(p.lon) + '">' + p.g + (p.retro ? '<tspan font-size="7"> ℞</tspan>' : '') + '</text>';
  });
  if (carta.conHora) {
    var pa = polar(C, C, Rp, ang(carta.asc));
    h += '<text x="' + pa[0].toFixed(1) + '" y="' + (pa[1] + 5).toFixed(1) + '" text-anchor="middle" class="cw-pl" style="fill:#fff">AC</text>';
  }
  h += '<text x="180" y="176" text-anchor="middle" class="cw-title">' + esc((titulo || 'Carta Natal').slice(0, 22)) + '</text>';
  h += '<text x="180" y="190" text-anchor="middle" class="cw-sub">casas iguales · trópico</text>';
  h += '</svg>';
  return h;
}

/* ---------------- interpretaciones ---------------- */
function interpSol(p) {
  return 'Tu <b>Sol en ' + p.signo.n + '</b> (' + fmtGrado(p.lon) + (p.casa ? ', casa ' + p.casa : '') + '): ' + p.signo.t + ' Como centro de la carta, pide brillar con constancia: agenda una acción semanal que honre a tu signo solar.';
}
function interpLuna(p) {
  return 'Tu <b>Luna en ' + p.signo.n + '</b> (' + fmtGrado(p.lon) + (p.casa ? ', casa ' + p.casa : '') + '): necesitas ' +
    ({ 'Aries': 'movimiento y franqueza', 'Tauro': 'calma, comida rica y rutina', 'Géminis': 'conversar y aprender', 'Cáncer': 'hogar y contención', 'Leo': 'juego y reconocimiento', 'Virgo': 'orden y cuidado del cuerpo', 'Libra': 'compañía y armonía', 'Escorpio': 'verdad y profundidad', 'Sagitario': 'aire libre y sentido', 'Capricornio': 'metas claras y respeto', 'Acuario': 'espacio propio y red', 'Piscis': 'silencio, mar y arte' }[p.signo.n] || 'cuidado') +
    ' para recargar. Honra tu luna antes de exigirte.';
}
function interpAsc(carta) {
  if (carta.asc == null) return 'Sin hora de nacimiento no se calcula <b>Ascendente</b>: es el dato que más depende del minuto y lugar. Agrega la hora para obtener ASC, MC y casas.';
  var s = signOf(carta.asc);
  return 'Tu <b>Ascendente en ' + s.s.n + '</b> (' + fmtGrado(carta.asc) + '): la puerta por donde entras al mundo. Te ven como alguien ' + s.s.t + ' El Medio Cielo en ' + signOf(carta.mc).s.n + ' tiñe tu vocación pública.';
}
function planetaLinea(p) {
  var base = '<b>' + p.g + ' ' + p.nombre + '</b> en <b>' + p.signo.n + '</b> ' + fmtGrado(p.lon) + (p.retro ? ' ℞ retro' : '') + (p.casa ? ' · casa ' + p.casa : '');
  var matiz = {
    Mercury: 'Piensas estilo ' + p.signo.n + ': ',
    Venus: 'Amas estilo ' + p.signo.n + ': ',
    Mars: 'Actúas estilo ' + p.signo.n + ': ',
    Jupiter: 'Creces donde hay ' + p.signo.n + ': ',
    Saturn: 'Maduras con rigor ' + p.signo.n + ': ',
    Uranus: 'Liberas lo ' + p.signo.n + ': ',
    Neptune: 'Sueñas lo ' + p.signo.n + ': ',
    Pluto: 'Transformas lo ' + p.signo.n + ': ',
    Node: 'Tu norte apunta a ' + p.signo.n + ': '
  }[p.id] || '';
  var casaT = p.casa ? ' En casa ' + p.casa + ': ' + CASAS_TXT[p.casa - 1] : ' (sin casas: falta hora exacta).';
  return base + '<br><span class="muted">' + matiz + p.meta.txt + casaT + '</span>';
}

/* ---------------- panel UI ---------------- */
var ultimaCarta = null, ultimoPerfil = null;

function leerForm() {
  var nombre = clean(($('caNombre') || {}).value || '', 40);
  var fecha = ($('caFecha') || {}).value || '';
  var hora = ($('caHora') || {}).value || '';
  var horaDesc = !!($('caHoraDesc') && $('caHoraDesc').checked);
  var ciudad = ($('caCiudad') || {}).value || 'Penco';
  var lat = parseFloat(($('caLat') || {}).value);
  var lng = parseFloat(($('caLng') || {}).value);
  var zona = ($('caZona') || {}).value || 'auto';
  if (!fecha) { alert('Elige la fecha de nacimiento'); return null; }
  if (isNaN(lat) || isNaN(lng)) { alert('Revisa latitud y longitud (usa punto decimal, ej -36.73)'); return null; }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { alert('Latitud -90 a 90, longitud -180 a 180'); return null; }
  var Y = +fecha.slice(0, 4), M = +fecha.slice(5, 7), D = +fecha.slice(8, 10);
  var hh = 12, mm = 0, conHora = !horaDesc;
  if (conHora) {
    if (!hora) { alert('Pon la hora o marca "Hora desconocida"'); return null; }
    hh = +hora.slice(0, 2); mm = +hora.slice(3, 5);
  }
  var utcMs = muroAZonaUTC(Y, M, D, hh, mm, zona);
  return { nombre: nombre || 'Sin nombre', fecha: fecha, hora: conHora ? hora : '', horaDesc: horaDesc, ciudad: ciudad, lat: lat, lng: lng, zona: zona, utcMs: utcMs, conHora: conHora };
}
function resumenTexto() {
  if (!ultimaCarta || !ultimoPerfil) return '';
  var c = ultimaCarta, p = ultimoPerfil;
  function by(id) { return c.planetas.filter(function (x) { return x.id === id; })[0]; }
  var sol = by('Sun'), luna = by('Moon');
  var L = [];
  L.push('Carta natal · ' + p.nombre + ' · ' + p.fecha + (p.horaDesc ? ' (hora desconocida)' : ' ' + p.hora) + ' · ' + p.ciudad + ' (' + p.lat.toFixed(2) + ', ' + p.lng.toFixed(2) + ')');
  L.push('Sol: ' + fmtGrado(sol.lon).replace(/<[^>]+>/g, '') + (sol.casa ? ' casa ' + sol.casa : ''));
  L.push('Luna: ' + fmtGrado(luna.lon).replace(/<[^>]+>/g, '') + (luna.casa ? ' casa ' + luna.casa : ''));
  L.push(c.asc != null ? 'Asc: ' + fmtGrado(c.asc) + ' · MC: ' + fmtGrado(c.mc) : 'Sin ASC (hora desconocida)');
  c.planetas.forEach(function (x) { L.push(x.nombre + ': ' + fmtGrado(x.lon) + (x.retro ? ' R' : '') + (x.casa ? ' casa ' + x.casa : '')); });
  if (c.aspects.length) { L.push('Aspectos:'); c.aspects.slice(0, 10).forEach(function (a) { L.push('- ' + a.p1.nombre + ' ' + a.asp.g + ' ' + a.p2.nombre + ' (' + a.asp.n + ', orbe ' + a.orbe.toFixed(1) + '°)'); }); }
  L.push('Calendario 13 Lunas · cálculo tropical aproximado, casas iguales. Educativo.');
  return L.join('\n');
}
function pintarResultado() {
  var box = $('caResult'); if (!box || !ultimaCarta || !ultimoPerfil) return;
  var c = ultimaCarta, p = ultimoPerfil;
  function by(id) { return c.planetas.filter(function (x) { return x.id === id; })[0]; }
  var sol = by('Sun'), luna = by('Moon');
  var tabla = c.planetas.map(function (x) {
    return '<div class="ca-row"><span class="ca-pl" style="color:' + x.color + '">' + x.g + ' ' + esc(x.nombre) + '</span><span><b>' + x.signo.g + ' ' + esc(x.signo.n) + '</b></span><span class="muted">' + fmtGrado(x.lon) + (x.retro ? ' ℞' : '') + '</span><span class="chip">' + (x.casa ? 'casa ' + x.casa : '—') + '</span></div>';
  }).join('');
  var casas = c.conHora ? c.houses.map(function (hh) {
    return '<div class="ca-row"><span><b>Casa ' + hh.n + '</b></span><span>' + hh.signo.g + ' ' + esc(hh.signo.n) + '</span><span class="muted">cúspide ' + fmtGrado(hh.cusp) + '</span></div>';
  }).join('') : '<p class="muted">Sin casas: marca una hora exacta para calcular ASC/MC y casas.</p>';
  var asps = c.aspects.length ? c.aspects.map(function (a) {
    return '<div class="ca-row"><span>' + a.p1.g + ' ' + esc(a.p1.nombre) + ' <b style="color:' + a.asp.c + '">' + a.asp.g + '</b> ' + a.p2.g + ' ' + esc(a.p2.nombre) + '</span><span class="muted">' + a.asp.n + ' · orbe ' + a.orbe.toFixed(1) + '°</span></div>';
  }).join('') : '<p class="muted">Sin aspectos mayores con orbes estándar.</p>';
  var detalle = c.planetas.map(function (x) { return '<div class="si-card"><h4 style="font-size:12px">' + x.g + ' ' + esc(x.nombre) + ' en ' + esc(x.signo.n) + '</h4><p style="font-size:11px">' + planetaLinea(x) + '</p></div>'; }).join('');
  box.innerHTML =
    '<div class="menstrual-card ca-hero"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:220px"><h4 style="margin:0 0 4px">☉ ' + esc(p.nombre) + ' · ' + esc(p.signoSol || '') + '</h4>' +
    '<div class="ca-big">' + sol.signo.g + ' Sol en ' + esc(sol.signo.n) + ' · ' + luna.signo.g + ' Luna en ' + esc(luna.signo.n) + (c.asc != null ? ' · AC ' + signOf(c.asc).s.g + ' ' + esc(signOf(c.asc).s.n) : '') + '</div>' +
    '<p class="muted" style="font-size:11px;margin:4px 0 0">' + esc(p.fecha) + (p.horaDesc ? ' · hora desconocida' : ' · ' + esc(p.hora)) + ' · ' + esc(p.ciudad) + ' (' + c.lat.toFixed(2) + ', ' + c.lng.toFixed(2) + ')</p></div>' +
    '<div class="ca-wheel-wrap">' + buildWheel(c, p.nombre) + '</div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌟 Lectura base</h4>' +
    '<div class="si-card"><h4>☉ Sol — identidad</h4><p>' + interpSol(sol) + '</p></div>' +
    '<div class="si-card"><h4>☽ Luna — refugio</h4><p>' + interpLuna(luna) + '</p></div>' +
    '<div class="si-card"><h4>AC Ascendente — puerta</h4><p>' + interpAsc(c) + '</p></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🪐 Planetas en signos y casas</h4><div class="ca-table">' + tabla + '</div>' +
    '<div class="ca-legend muted">℞ = retrógrado aparente · casas iguales (cúspide 1 = ASC) · zodiaco tropical</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🏠 Casas (iguales)</h4><div class="ca-table">' + casas + '</div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🔗 Aspectos mayores</h4><div class="ca-table">' + asps + '</div></div>' +
    '<details class="menstrual-details"><summary>📖 Detalle planeta por planeta</summary><div style="margin-top:8px">' + detalle + '</div></details>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap">' +
    '<button type="button" id="caShare" class="btn" style="width:auto">📤 Compartir texto</button>' +
    '<button type="button" id="caCopy" class="btn" style="width:auto">📋 Copiar</button></div>' +
    '<p class="muted" style="font-size:10px">Cálculo aproximado offline (±1° planetas; Luna y ASC sensibles a hora). Zodiaco tropical, casas iguales. Si la hora es aproximada, toma el ASC con calma y prioriza Sol, Luna y planetas. Nada sale de este dispositivo.</p>';
  p.signoSol = sol.signo.n;
  var bs = $('caShare');
  if (bs) bs.onclick = function () {
    var t = resumenTexto();
    try {
      if (navigator.share) navigator.share({ title: 'Mi carta natal', text: t }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { save('Texto copiado ✓'); });
    } catch (e) { try { if (navigator.clipboard) navigator.clipboard.writeText(t); } catch (e2) {} }
  };
  var bc = $('caCopy');
  if (bc) bc.onclick = function () {
    try { if (navigator.clipboard) navigator.clipboard.writeText(resumenTexto()).then(function () { save('Copiado ✓'); }); } catch (e) {}
  };
}
function calcularYMostrar(origen) {
  var f = leerForm();
  if (!f) return;
  try {
    ultimaCarta = calcCarta(f.utcMs, f.lat, f.lng, f.conHora);
    ultimoPerfil = f;
    var st = getStore();
    st.ultimo = f;
    save(origen === 'guardar' ? 'Carta guardada ✓' : 'Carta calculada ✓');
    pintarResultado();
    try { var r = $('caResult'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
  } catch (e) { alert('No se pudo calcular: ' + e.message); }
}
function renderCartaPanel() {
  try { if (typeof astroTab !== 'undefined') astroTab = 'carta'; } catch (e) {}
  ['tabAstroUpcoming', 'tabAstroMesLunar', 'tabAstroYear'].forEach(function (id) { var el = $(id); if (el) el.classList.remove('btn-accent'); });
  var tc = $('tabAstroCarta'); if (tc) tc.classList.add('btn-accent');
  var tC = $('tabAstroCielo'); if (tC) tC.classList.remove('btn-accent');
  var todayBox = $('astroTodayBox');
  if (todayBox) todayBox.innerHTML = '<h4 style="color:var(--gold)">✨ Carta Natal — trópico · casas iguales</h4><p class="muted" style="font-size:11px">Ingresa nacimiento y calcula Sol, Luna, Ascendente, planetas, casas y aspectos. Todo queda <b>local y privado</b>. Sin hora exacta igual obtienes planetas en signos.</p>';
  var list = $('astroList'); if (!list) return;
  var st = getStore();
  var ult = st.ultimo || {};
  var ciudadOpts = CIUDADES.map(function (c) { return '<option value="' + esc(c.n) + '"' + (ult.ciudad === c.n ? ' selected' : (!ult.ciudad && c.n === 'Penco' ? ' selected' : '')) + '>' + esc(c.n) + '</option>'; }).join('');
  var perfOpts = st.perfiles.length
    ? st.perfiles.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + ' · ' + esc(p.fecha) + '</option>'; }).join('')
    : '<option value="">— sin perfiles guardados —</option>';
  list.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📝 Datos de nacimiento</h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre <input type="text" id="caNombre" maxlength="40" placeholder="ej: Ayelén" value="' + esc(ult.nombre || '') + '"></label>' +
    '<label>Fecha <input type="date" id="caFecha" value="' + esc(ult.fecha || '') + '"></label></div>' +
    '<div class="conv-row"><label>Hora <input type="time" id="caHora" value="' + esc(ult.hora || '') + '"></label>' +
    '<label class="check-row" style="align-self:end"><input type="checkbox" id="caHoraDesc"' + (ult.horaDesc ? ' checked' : '') + '> Hora desconocida</label></div>' +
    '<p class="muted" style="font-size:10px;margin:2px 0 6px">La hora exacta define Ascendente y casas. Si no la sabes, márcalo: igual verás planetas en signos.</p>' +
    '<div class="conv-row"><label style="flex:2">Ciudad <select id="caCiudad">' + ciudadOpts + '</select></label>' +
    '<label>Zona <select id="caZona">' +
    '<option value="auto"' + ((!ult.zona || ult.zona === 'auto') ? ' selected' : '') + '>Auto (Stgo DST)</option>' +
    '<option value="America/Santiago"' + (ult.zona === 'America/Santiago' ? ' selected' : '') + '>America/Santiago</option>' +
    '<option value="UTC-4"' + (ult.zona === 'UTC-4' ? ' selected' : '') + '>UTC-4 (Chile invierno)</option>' +
    '<option value="UTC-3"' + (ult.zona === 'UTC-3' ? ' selected' : '') + '>UTC-3 (Chile verano/Magallanes)</option>' +
    '<option value="UTC-6"' + (ult.zona === 'UTC-6' ? ' selected' : '') + '>UTC-6 (Rapa Nui invierno)</option>' +
    '<option value="UTC-5"' + (ult.zona === 'UTC-5' ? ' selected' : '') + '>UTC-5 (Rapa Nui verano)</option>' +
    '</select></label></div>' +
    '<div class="conv-row"><label>Latitud <input type="number" id="caLat" step="0.0001" min="-90" max="90" value="' + (ult.lat != null ? ult.lat : -36.7319) + '"></label>' +
    '<label>Longitud <input type="number" id="caLng" step="0.0001" min="-180" max="180" value="' + (ult.lng != null ? ult.lng : -72.9925) + '"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap">' +
    '<button type="button" id="caCalc" class="btn btn-accent" style="width:auto">✨ Calcular carta</button>' +
    '<button type="button" id="caSave" class="btn" style="width:auto">💾 Calcular y guardar perfil</button></div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Perfiles guardados <select id="caPerfilSel">' + perfOpts + '</select></label>' +
    '<span style="display:flex;gap:6px;align-self:end"><button type="button" id="caLoad" class="btn" style="width:auto">Cargar</button>' +
    '<button type="button" id="caDel" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">Borrar</button></span></div>' +
    '</div><div id="caResult" style="margin-top:10px"></div>';
  var ciu = $('caCiudad');
  if (ciu) ciu.onchange = function () {
    var c = null;
    for (var i = 0; i < CIUDADES.length; i++) if (CIUDADES[i].n === ciu.value) c = CIUDADES[i];
    if (c && c.lat != null) { $('caLat').value = c.lat; $('caLng').value = c.lng; }
  };
  var hd = $('caHoraDesc'), hi = $('caHora');
  function syncHora() { if (hd && hd.checked && hi) { hi.disabled = true; hi.style.opacity = 0.45; } else if (hi) { hi.disabled = false; hi.style.opacity = 1; } }
  if (hd) hd.onchange = syncHora;
  syncHora();
  $('caCalc').onclick = function () { calcularYMostrar('calc'); };
  $('caSave').onclick = function () {
    var f = leerForm(); if (!f) return;
    f.id = uid('ca');
    try {
      var s = getStore();
      var ix = -1;
      for (var i = 0; i < s.perfiles.length; i++) if (s.perfiles[i].nombre === f.nombre && s.perfiles[i].fecha === f.fecha) ix = i;
      if (ix >= 0) { f.id = s.perfiles[ix].id; s.perfiles[ix] = f; } else s.perfiles.push(f);
      s.ultimo = f;
      save('Perfil guardado ✓');
    } catch (e) {}
    calcularYMostrar('guardar');
    renderCartaPanelKeepResult();
  };
  var ld = $('caLoad');
  if (ld) ld.onclick = function () {
    var sel = $('caPerfilSel'); if (!sel || !sel.value) return;
    var s = getStore(), f = null;
    for (var i = 0; i < s.perfiles.length; i++) if (s.perfiles[i].id === sel.value) f = s.perfiles[i];
    if (!f) return;
    s.ultimo = f; save();
    renderCartaPanel();
    try {
      ultimaCarta = calcCarta(f.utcMs, f.lat, f.lng, f.conHora !== false && !f.horaDesc);
      ultimoPerfil = f;
      pintarResultado();
    } catch (e) { alert('No se pudo cargar: ' + e.message); }
  };
  var del = $('caDel');
  if (del) del.onclick = function () {
    var sel = $('caPerfilSel'); if (!sel || !sel.value) return;
    try {
      var s = getStore();
      s.perfiles = s.perfiles.filter(function (p) { return p.id !== sel.value; });
      save('Perfil borrado ✓');
      renderCartaPanel();
    } catch (e) {}
  };
  /* si habia ultimo calculo, re-mostrar */
  try {
    if (ult && ult.fecha && ult.utcMs) {
      ultimoPerfil = ult;
      ultimaCarta = calcCarta(ult.utcMs, ult.lat, ult.lng, !ult.horaDesc);
      pintarResultado();
    } else if (ultimaCarta && ultimoPerfil) pintarResultado();
  } catch (e) {}
}
function renderCartaPanelKeepResult() {
  var keepCarta = ultimaCarta, keepPerfil = ultimoPerfil;
  renderCartaPanel();
  if (keepCarta && keepPerfil) { ultimaCarta = keepCarta; ultimoPerfil = keepPerfil; pintarResultado(); }
}

/* ---------------- fusion en Astro ---------------- */
function setupCartaFusion() {
  var tabYear = $('tabAstroYear');
  if (!tabYear || typeof renderAstroDialog !== 'function') {
    window._cartaAstroRetry = (window._cartaAstroRetry || 0) + 1;
    if (window._cartaAstroRetry < 60) setTimeout(setupCartaFusion, 500);
    return;
  }
  if (!$('tabAstroCarta')) {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'tabAstroCarta'; b.className = 'btn'; b.style.width = 'auto';
    b.textContent = '✨ Carta Natal';
    b.title = 'Calcula tu carta astral: Sol, Luna, Ascendente, planetas, casas y aspectos';
    tabYear.parentNode.appendChild(b);
    b.onclick = function () { try { renderAstroDialog('carta'); } catch (e) {} };
  }
  try {
    var btn = $('btnAstro');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('carta') < 0)
      btn.dataset.keywords += ' carta natal astral zodiaco horoscopo signo ascendente luna sol casas planetas';
  } catch (e) {}
  if (!window._cartaAstroWrapped) {
    window._cartaAstroWrapped = true;
    var orig = renderAstroDialog;
    renderAstroDialog = function (tab) {
      if (tab === 'carta') { try { renderCartaPanel(); } catch (e) {} return; }
      var r = orig(tab);
      var t = $('tabAstroCarta'); if (t) t.classList.remove('btn-accent');
      return r;
    };
  }
}

window.CartaAstral = { calc: calcCarta, signos: SIGNOS, planetas: PLANETAS, render: renderCartaPanel };
setTimeout(setupCartaFusion, 600);

})();
