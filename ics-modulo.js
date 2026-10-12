/* ============================================================
   ICS · importar / exportar compromisos (.ics, RFC 5545)
   Lleva tus compromisos a otros calendarios (Google, Outlook,
   Apple, Thunderbird...) o trae los de ellos hacia acá. Sirve
   para horarios, reuniones, talleres y actividades comunales.
   - Exportar: luna visible, ciclo actual o todo → archivo .ics
     (título + hora + referencia lunar; tus notas privadas NO
     se exportan).
   - Importar: lee .ics (incluye recurrentes simples DAILY /
     WEEKLY, p. ej. un taller semanal) y crea los compromisos
     en sus días, sin duplicar los que ya existen.
   Todo queda privado y local: el archivo solo se crea cuando
   tú lo pides. Sin internet, sin cuentas.
   Patrón: botón 📅 en Mi Día > Organizar + <dialog> propio
   (igual que 📲 Traspaso QR) + checkbox en ⚙️ Ajustes.
   ============================================================ */
(function () {
'use strict';

var TZID = 'America/Santiago';
var PRODID = '-//Semillero Consciente//Calendario 13 Lunas//ES';
var MAX_IMPORT_CHARS = 2 * 1024 * 1024; // tope 2 MB por archivo
var MAX_INSTANCES = 2000; // tope eventos resultantes por archivo
var RRULE_CAP = 200; // tope instancias por evento recurrente
var MULTI_DAY_CAP = 31; // tope días de un evento de varios días

function $(id) { try { return document.getElementById(id); } catch (e) { return null; } }
function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function cleanText(t, max) {
  var s = String(t == null ? '' : t);
  if (typeof sanitizeText === 'function') { try { return sanitizeText(s, max); } catch (e) {} }
  return s.slice(0, max);
}
function pad2(n) { return String(n).padStart(2, '0'); }

/* ================= NÚCLEO ICS PURO (sin DOM) ================= */

function escText(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function unescText(s) {
  var P = '\\u0000';
  return String(s == null ? '' : s)
    .split('\\\\').join(P)
    .split('\\n').join('\n').split('\\N').join('\n')
    .split('\\;').join(';').split('\\,').join(',')
    .split(P).join('\\');
}

function chBytes(ch) {
  var c = ch.charCodeAt(0);
  if (c < 0x80) return 1;
  if (c < 0x800) return 2;
  if (c >= 0xD800 && c <= 0xDBFF) return 4; // par subrogado (emoji): cuenta aprox.
  return 3;
}

// Plega una línea >75 octetos (RFC 5545 §3.1): CRLF + espacio.
function foldLine(line) {
  var parts = [];
  var cur = '';
  var bytes = 0;
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i);
    var bl = chBytes(ch);
    if (bytes + bl > 75 && cur) { parts.push(cur); cur = ' '; bytes = 1; }
    cur += ch;
    bytes += bl;
  }
  parts.push(cur);
  return parts.join('\r\n');
}

function dtstampNow(d) {
  var t = (d instanceof Date) ? d : new Date();
  return t.getUTCFullYear() + pad2(t.getUTCMonth() + 1) + pad2(t.getUTCDate()) +
    'T' + pad2(t.getUTCHours()) + pad2(t.getUTCMinutes()) + pad2(t.getUTCSeconds()) + 'Z';
}

function basicFromKeyTime(key, time) {
  // 'YYYY-MM-DD' + 'HH:MM' -> 'YYYYMMDDTHHMMSS'
  var p = String(key || '').split('-');
  var t = String(time || '09:00').split(':');
  return p[0] + p[1] + p[2] + 'T' + pad2(+t[0] || 0) + pad2(+t[1] || 0) + '00';
}

function keyToMs(key) {
  var a = String(key || '').split('-');
  return Date.UTC(+a[0], (+a[1] || 1) - 1, +a[2] || 1, 12, 0, 0);
}

function msToKey(ms) {
  var d = new Date(ms);
  return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
}

function addDaysKey(key, n) { return msToKey(keyToMs(key) + n * 86400000); }

function uidSafe(s) {
  return String(s || 'ev').replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 80) || 'ev';
}

// Hora fin = inicio + 60 min (con cambio de día si pasa la medianoche).
function endKeyTime(key, time) {
  var t = String(time || '09:00').split(':');
  var mins = (+t[0] || 0) * 60 + (+t[1] || 0) + 60;
  if (mins < 1440) return { key: key, time: pad2(Math.floor(mins / 60)) + ':' + pad2(mins % 60) };
  return { key: addDaysKey(key, 1), time: pad2(Math.floor((mins - 1440) / 60)) + ':' + pad2((mins - 1440) % 60) };
}

// Muro horario America/Santiago de un instante UTC (para DTSTART ...Z).
function santiagoWall(ms) {
  try {
    var f = new Intl.DateTimeFormat('en-CA', {
      timeZone: TZID, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    var p = {};
    var parts = f.formatToParts(new Date(ms));
    for (var i = 0; i < parts.length; i++) p[parts[i].type] = parts[i].value;
    var hh = (p.hour === '24') ? '00' : p.hour;
    return { key: p.year + '-' + p.month + '-' + p.day, time: hh + ':' + p.minute };
  } catch (e) {
    var d = new Date(ms);
    return {
      key: d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()),
      time: pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes())
    };
  }
}

function validKey(key) { return /^\d{4}-\d{2}-\d{2}$/.test(key || ''); }
function validTime(t) { return /^\d{2}:\d{2}$/.test(t || ''); }

// events: [{uid,dateKey,time,summary,description,alarm}]
// Devuelve el texto .ics completo (CRLF).
function buildICS(events, opts) {
  var o = opts || {};
  var stamp = dtstampNow(o.now instanceof Date ? o.now : new Date());
  var lines = [
    'BEGIN:VCALENDAR',
    'PRODID:' + PRODID,
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + escText(o.calName || 'Calendario 13 Lunas — compromisos'),
    'X-WR-TIMEZONE:' + TZID
  ];
  var list = (events || []).slice().sort(function (a, b) {
    return String(a.dateKey + ' ' + a.time).localeCompare(String(b.dateKey + ' ' + b.time));
  });
  for (var i = 0; i < list.length; i++) {
    var ev = list[i];
    if (!validKey(ev.dateKey)) continue;
    var time = validTime(ev.time) ? ev.time : '09:00';
    var end = endKeyTime(ev.dateKey, time);
    var sum = escText(String(ev.summary || '(sin título)').slice(0, 200) || '(sin título)');
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uidSafe(ev.uid || ('cal13-' + ev.dateKey + '-' + time.replace(':', '') + '-' + i)) + '@calendario-13-lunas');
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART;TZID=' + TZID + ':' + basicFromKeyTime(ev.dateKey, time));
    lines.push('DTEND;TZID=' + TZID + ':' + basicFromKeyTime(end.key, end.time));
    lines.push('SUMMARY:' + sum);
    if (ev.description) lines.push('DESCRIPTION:' + escText(String(ev.description).slice(0, 500)));
    lines.push('CATEGORIES:' + escText('Compromisos,13 Lunas'));
    if (ev.alarm) {
      lines.push('BEGIN:VALARM');
      lines.push('TRIGGER:-PT15M');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:' + sum);
      lines.push('END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

function parseDtStart(ppar, val) {
  var v = String(val || '').trim();
  var m;
  if ((m = /^(\d{4})(\d{2})(\d{2})$/.exec(v))) {
    return { dateKey: m[1] + '-' + m[2] + '-' + m[3], time: null, allDay: true };
  }
  if ((m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z?)$/.exec(v))) {
    if (+m[4] > 23 || +m[5] > 59) return null;
    if (m[7] === 'Z') {
      var ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || '0'));
      var w = santiagoWall(ms);
      return { dateKey: w.key, time: w.time, allDay: false };
    }
    return { dateKey: m[1] + '-' + m[2] + '-' + m[3], time: m[4] + ':' + m[5], allDay: false };
  }
  return null;
}

function parseRRule(val) {
  var o = {};
  var segs = String(val || '').toUpperCase().split(';');
  for (var i = 0; i < segs.length; i++) {
    var kv = segs[i].split('=');
    if (kv[0]) o[kv[0]] = kv[1] || '';
  }
  if (o.FREQ !== 'DAILY' && o.FREQ !== 'WEEKLY') return null;
  var r = {
    freq: o.FREQ,
    interval: Math.max(1, parseInt(o.INTERVAL || '1', 10) || 1),
    count: 0,
    until: null,
    byday: null
  };
  if (o.COUNT) r.count = Math.min(RRULE_CAP, Math.max(0, parseInt(o.COUNT, 10) || 0));
  if (o.UNTIL) {
    var u = String(o.UNTIL);
    var m;
    if ((m = /^(\d{4})(\d{2})(\d{2})$/.exec(u))) r.until = m[1] + '-' + m[2] + '-' + m[3];
    else if ((m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z?)$/.exec(u))) {
      if (m[7] === 'Z') r.until = santiagoWall(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || '0'))).key;
      else r.until = m[1] + '-' + m[2] + '-' + m[3];
    }
  }
  if (o.BYDAY) {
    var days = String(o.BYDAY).split(',');
    var ok = [];
    for (var j = 0; j < days.length; j++) {
      var d = days[j].replace(/^[0-9+-]+/, ''); // ignora ordinal (1MO -> MO)
      if ('SUMOTUWETHFRSA'.indexOf(d) >= 0 && d.length === 2 && ok.indexOf(d) < 0) ok.push(d);
    }
    if (ok.length) r.byday = ok;
  }
  if (!r.count && !r.until) return null; // recurrente sin fin: no se importa
  return r;
}

var WD = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function expandRecur(startKey, rrule) {
  var keys = [startKey];
  var total = rrule.count || Infinity;
  var until = rrule.until;
  if (rrule.freq === 'DAILY') {
    var k = startKey;
    while (keys.length < total && keys.length < RRULE_CAP) {
      k = addDaysKey(k, rrule.interval);
      if (until && k > until) break;
      if (k > addDaysKey(startKey, 732)) break; // tope 2 años
      keys.push(k);
    }
    return keys;
  }
  // WEEKLY: avanza día a día; respeta INTERVAL (semanas) y BYDAY.
  var startMs = keyToMs(startKey);
  var startWd = WD[new Date(startMs).getUTCDay()];
  var want = (rrule.byday && rrule.byday.length) ? rrule.byday : [startWd];
  var step = 1;
  while (keys.length < total && keys.length < RRULE_CAP && step <= 732) {
    var ms = startMs + step * 86400000;
    var weekIdx = Math.floor((ms - startMs) / (7 * 86400000));
    var wd = WD[new Date(ms).getUTCDay()];
    if (weekIdx % rrule.interval === 0 && want.indexOf(wd) >= 0) {
      var kk = msToKey(ms);
      if (until && kk > until) break;
      keys.push(kk);
    }
    step++;
  }
  return keys;
}

// Lee un .ics y lo reduce a eventos simples listos para importar.
// Devuelve {events, skipped, warnings}: cada event es
// {uid,dateKey,time,allDay,summary,description,alarm}.
function parseICS(text) {
  var res = { events: [], skipped: 0, warnings: [] };
  var src = String(text || '');
  if (!src) return res;
  // Desplegado (unfold): CRLF/LF + espacio/tab inicial continúa la línea.
  var flat = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '');
  var lines = flat.split('\n');
  var inCal = false;
  var cur = null;
  var n = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/﻿/g, '').replace(/\s+$/g, '');
    if (!line) continue;
    if (/^BEGIN:VCALENDAR$/i.test(line)) { inCal = true; continue; }
    if (/^END:VCALENDAR$/i.test(line)) { inCal = false; continue; }
    if (!inCal) continue;
    if (/^BEGIN:VEVENT$/i.test(line)) { cur = {}; continue; }
    if (/^END:VEVENT$/i.test(line)) {
      if (cur) { n++; if (n <= MAX_INSTANCES) pushEvent(cur, res); else res.skipped++; cur = null; }
      continue;
    }
    if (!cur) continue;
    if (/^BEGIN:VALARM$/i.test(line)) { cur.alarm = true; continue; }
    var ci = line.indexOf(':');
    if (ci < 0) continue;
    var left = line.slice(0, ci);
    var val = line.slice(ci + 1);
    var semi = left.indexOf(';');
    var pname = (semi < 0 ? left : left.slice(0, semi)).toUpperCase();
    var ppar = semi < 0 ? '' : left.slice(semi + 1);
    if (pname === 'UID') cur.uid = val.slice(0, 200);
    else if (pname === 'SUMMARY') cur.summary = unescText(val);
    else if (pname === 'DESCRIPTION') cur.desc = unescText(val);
    else if (pname === 'DTSTART') cur.dtstart = parseDtStart(ppar, val);
    else if (pname === 'DTEND') {
      var de = parseDtStart(ppar, val);
      if (de && de.dateKey) cur.dtend = de.dateKey;
    }
    else if (pname === 'RRULE') cur.rrule = parseRRule(val);
  }
  return res;
}

function baseSummary(cur) {
  var s = String((cur.summary != null ? cur.summary : '')).trim();
  if (s) return s.slice(0, 80);
  var d = String((cur.desc != null ? cur.desc : '')).trim().split('\n')[0].trim();
  if (d) return d.slice(0, 80);
  return '(sin título)';
}

function pushEvent(cur, res) {
  if (!cur.dtstart || !validKey(cur.dtstart.dateKey)) { res.skipped++; return; }
  var summary = baseSummary(cur);
  var desc = String((cur.desc != null ? cur.desc : '')).trim().slice(0, 300);
  var uid = String(cur.uid || ('imp-' + cur.dtstart.dateKey + '-' + (cur.dtstart.time || '0900'))).slice(0, 200);
  var alarm = !!cur.alarm;
  var st = cur.dtstart;
  if (st.allDay && cur.dtend && cur.dtend > st.dateKey) {
    // Varios días (todo el día): un compromiso por día.
    var k = st.dateKey;
    var c = 0;
    while (k < cur.dtend && c < MULTI_DAY_CAP && res.events.length < MAX_INSTANCES) {
      res.events.push({ uid: uid + '#' + k, dateKey: k, time: '09:00', allDay: true, summary: summary, description: desc, alarm: alarm });
      k = addDaysKey(k, 1);
      c++;
    }
    return;
  }
  if (!st.allDay && cur.rrule) {
    var keys = expandRecur(st.dateKey, cur.rrule);
    for (var i = 0; i < keys.length && res.events.length < MAX_INSTANCES; i++) {
      res.events.push({ uid: uid + '#' + keys[i], dateKey: keys[i], time: st.time || '09:00', allDay: false, summary: summary, description: desc, alarm: alarm });
    }
    return;
  }
  res.events.push({
    uid: uid, dateKey: st.dateKey, time: st.allDay ? '09:00' : (st.time || '09:00'),
    allDay: !!st.allDay, summary: summary, description: desc, alarm: alarm
  });
}

/* ============ PUENTE CON EL CALENDARIO (usa globales) ============ */

// Mapa fecha gregoriana 'YYYY-MM-DD' -> {y, luna, diaN}.
function buildKeyRefMap() {
  var map = {};
  try {
    if (typeof cal === 'undefined' || !cal.buildCycle) return map;
    var years = (typeof CYCLE_YEARS !== 'undefined' && CYCLE_YEARS.length) ? CYCLE_YEARS : [];
    if (!years.length && typeof userData === 'function') {
      try { years = Object.keys(userData().cycles || {}).map(Number); } catch (e) {}
    }
    for (var i = 0; i < years.length; i++) {
      var c;
      try { c = cal.buildCycle(years[i]); } catch (e) { continue; }
      for (var j = 0; j < c.days.length; j++) {
        var d = c.days[j];
        var key;
        try { key = cal.fmtKey.format(new Date(d.noonMs)); }
        catch (e) { key = new Date(d.noonMs).toISOString().slice(0, 10); }
        if (!map[key]) map[key] = { y: years[i], luna: d.luna, diaN: d.diaN };
      }
    }
  } catch (e) {}
  return map;
}

function agendaTimeOf(a) {
  if (typeof getAgendaTime === 'function') { try { return getAgendaTime(a); } catch (e) {} }
  if (a && typeof a.time === 'string' && /^\d{1,2}:\d{2}$/.test(a.time)) {
    var p = a.time.split(':');
    return pad2(+p[0]) + ':' + pad2(+p[1]);
  }
  return pad2((a && a.hour) || 0) + ':' + pad2((a && a.minute) || 0);
}

function ensureCell(y, luna, diaN) {
  if (typeof cyc === 'function') {
    try {
      var c = cyc(y);
      var m = c.moons[String(luna)];
      if (!m.days[diaN]) m.days[diaN] = { nota: '', animo: -1, agenda: [] };
      if (!Array.isArray(m.days[diaN].agenda)) m.days[diaN].agenda = [];
      return m.days[diaN];
    } catch (e) {}
  }
  var u = userData();
  if (!u.cycles[String(y)]) u.cycles[String(y)] = { moons: {}, dft: { nota: '' } };
  var cy = u.cycles[String(y)];
  if (!cy.moons[String(luna)]) cy.moons[String(luna)] = { monthNote: '', days: {} };
  if (!cy.moons[String(luna)].days[diaN]) cy.moons[String(luna)].days[diaN] = { nota: '', animo: -1, agenda: [] };
  var cell = cy.moons[String(luna)].days[diaN];
  if (!Array.isArray(cell.agenda)) cell.agenda = [];
  return cell;
}

// scope: 'luna' (visible) | 'ciclo' (actual) | 'todo'
function collectEvents(scope) {
  var out = [];
  try {
    if (typeof userData !== 'function' || typeof cal === 'undefined' || !cal.buildCycle) return out;
    var u = userData();
    var curY = (typeof currentCycleYear === 'function') ? currentCycleYear() : null;
    var years;
    var onlyLuna = null;
    if (scope === 'luna') {
      years = curY != null ? [curY] : [];
      try {
        if (typeof currentView !== 'undefined' && currentView && currentView.tipo === 'luna') onlyLuna = currentView.luna;
      } catch (e) {}
      if (onlyLuna == null) return out;
    } else if (scope === 'ciclo') {
      years = curY != null ? [curY] : [];
    } else {
      years = (typeof CYCLE_YEARS !== 'undefined' && CYCLE_YEARS.length)
        ? CYCLE_YEARS.slice()
        : Object.keys(u.cycles || {}).map(Number);
    }
    for (var i = 0; i < years.length; i++) {
      var y = years[i];
      var cycDays;
      try { cycDays = cal.buildCycle(y).days; } catch (e) { continue; }
      var stored = (u.cycles && u.cycles[String(y)]) || null;
      if (!stored) continue;
      for (var j = 0; j < cycDays.length; j++) {
        var d = cycDays[j];
        if (d.luna === 'dft') continue;
        if (onlyLuna != null && d.luna !== onlyLuna) continue;
        var moon = stored.moons && stored.moons[String(d.luna)];
        var cell = moon && moon.days && moon.days[d.diaN];
        if (!cell || !Array.isArray(cell.agenda) || !cell.agenda.length) continue;
        var key;
        try { key = cal.fmtKey.format(new Date(d.noonMs)); }
        catch (e) { key = new Date(d.noonMs).toISOString().slice(0, 10); }
        for (var k = 0; k < cell.agenda.length; k++) {
          var a = cell.agenda[k];
          var text = String((a && a.text) || '').trim();
          if (!text) continue;
          var hhmm = agendaTimeOf(a);
          out.push({
            uid: uidSafe((a.id || ('cal13-' + y + '-' + d.luna + '-' + d.diaN + '-' + hhmm.replace(':', '')))),
            dateKey: key,
            time: hhmm,
            summary: text,
            description: 'Luna ' + d.luna + ' · Día ' + d.diaN + ' de 28 — Calendario 13 Lunas · Penco',
            alarm: !!(a && a.notify),
            luna: d.luna,
            dia: d.diaN
          });
        }
      }
    }
  } catch (e) {}
  return out;
}

// Inserta eventos importados como compromisos (sin duplicar).
// Devuelve {added, dup, fuera, dft}.
function applyEvents(list) {
  var res = { added: 0, dup: 0, fuera: 0, dft: 0 };
  try {
    if (typeof userData !== 'function' || !list || !list.length) return res;
    var map = buildKeyRefMap();
    for (var i = 0; i < list.length; i++) {
      var ev = list[i];
      if (!ev || !validKey(ev.dateKey)) { res.fuera++; continue; }
      var ref = map[ev.dateKey];
      if (!ref) { res.fuera++; continue; }
      if (ref.luna === 'dft') { res.dft++; continue; }
      var time = validTime(ev.time) ? ev.time : '09:00';
      var text = cleanText(ev.summary || '(sin título)', 80).trim() || '(sin título)';
      var cell;
      try { cell = ensureCell(ref.y, ref.luna, ref.diaN); } catch (e) { res.fuera++; continue; }
      var norm = text.toLowerCase();
      var dup = false;
      for (var j = 0; j < cell.agenda.length; j++) {
        var a = cell.agenda[j];
        if (agendaTimeOf(a) === time && String((a && a.text) || '').trim().toLowerCase() === norm) { dup = true; break; }
      }
      if (dup) { res.dup++; continue; }
      var hhmm = time.split(':');
      cell.agenda.push({
        id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) + i,
        hour: +hhmm[0], minute: +hhmm[1], time: time,
        text: text, notify: false, notified: false
      });
      res.added++;
    }
    if (res.added > 0) {
      try { if (typeof scheduleSave === 'function') scheduleSave('Compromisos importados ✓'); } catch (e) {}
      try { if (typeof rebuildLunaByKey === 'function') rebuildLunaByKey(); } catch (e) {}
      try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch (e) {}
    }
  } catch (e) {}
  return res;
}

/* ================= ARCHIVO (Electron / web) ================= */

function downloadICS(text, fileName) {
  var blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
}

function saveICSFile(text, fileName) {
  try {
    if (typeof window !== 'undefined' && window.api && typeof window.api.icsSave === 'function') {
      return window.api.icsSave(text, fileName).then(function (r) {
        if (r) return 'guardado';
        downloadICS(text, fileName);
        return 'descargado';
      }).catch(function () { downloadICS(text, fileName); return 'descargado'; });
    }
  } catch (e) {}
  try { downloadICS(text, fileName); } catch (e2) { return Promise.resolve(null); }
  return Promise.resolve('descargado');
}

function pickICSFile() {
  return new Promise(function (done) {
    try {
      if (typeof window !== 'undefined' && window.api && typeof window.api.icsOpen === 'function') {
        window.api.icsOpen().then(done).catch(function () { done(null); });
        return;
      }
    } catch (e) {}
    try {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.ics,text/calendar';
      inp.onchange = function () {
        var f = inp.files && inp.files[0];
        if (!f) { done(null); return; }
        var r = new FileReader();
        r.onload = function () { done(r.result); };
        r.onerror = function () { done(null); };
        r.readAsText(f);
      };
      inp.click();
    } catch (e) { done(null); }
  });
}

/* ================= INTERFAZ ================= */

function injectCSS() {
  try {
    if ($('icsCSS') || !document.head) return;
    var st = document.createElement('style');
    st.id = 'icsCSS';
    st.textContent =
      '#icsDialog{width:560px;max-width:96vw;max-height:88vh;overflow-y:auto}' +
      '#icsDialog .ics-sec{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px}' +
      '#icsDialog .ics-sec h4{margin:0 0 6px}' +
      '#icsDialog .ics-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}' +
      '#icsDialog select{max-width:100%}' +
      '#icsDialog .ics-count{font-size:12px;color:var(--muted)}' +
      '#icsDialog .ics-msg{font-size:13px;line-height:1.55;margin-top:8px;min-height:18px}';
    document.head.appendChild(st);
  } catch (e) {}
}

function injectBtn() {
  try {
    if ($('btnICS')) {
      try {
        var cur = $('btnICS');
        cur.setAttribute('data-sub', 'organizar');
      } catch (eS) {}
    } else {
      var g = document.querySelector('.action-group[data-group="dia"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnICS';
        btn.className = 'btn';
        btn.type = 'button';
        btn.textContent = '📅 Otro calendario (.ics)';
        try { btn.setAttribute('data-sub', 'organizar'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'ics calendario importar exportar google outlook apple eventos compromisos reunion reuniones taller talleres horario actividades comunales traspaso');
        btn.onclick = openDlg;
        var anchor = $('btnRemind');
        if (anchor && anchor.parentNode === g) g.insertBefore(btn, anchor.nextSibling);
        else g.appendChild(btn);
      }
    }
    var b2 = $('btnICS');
    if (b2 && !b2.dataset.icsW) { b2.dataset.icsW = '1'; b2.onclick = openDlg; }
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnICS') < 0) ALL_BTNS.push('btnICS');
  } catch (eA) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnICS = ['dia', 'organizar']; } catch (eH) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['dia|organizar'] && BTN_ORDER['dia|organizar'].indexOf('btnICS') < 0) {
      BTN_ORDER['dia|organizar'].push('btnICS');
    }
  } catch (eO) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnICS = true; });
    }
  } catch (eP) {}
}

function injectCfgChk() {
  try {
    if (document.querySelector('#configDialog input[data-btn="btnICS"]')) return;
    var groups = document.querySelectorAll('#configDialog .config-group');
    groups.forEach(function (gr) {
      var h = gr.querySelector('h5');
      if (h && h.textContent.indexOf('Mi Día') >= 0) {
        var lab = document.createElement('label');
        lab.className = 'check-row';
        lab.textContent = ' 📅 Otro calendario (.ics)';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('data-btn', 'btnICS');
        lab.insertBefore(cb, lab.firstChild);
        gr.appendChild(lab);
        try {
          var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
          cb.checked = !vis || vis.btnICS !== false;
          cb.onchange = function () {
            try {
              if (typeof DATA !== 'undefined' && DATA) {
                DATA.config = DATA.config || {};
                DATA.config.visible = DATA.config.visible || {};
                DATA.config.visible.btnICS = cb.checked;
                if (typeof scheduleSave === 'function') scheduleSave('Guardado ✓');
                if (typeof applyVisibility === 'function') applyVisibility();
              }
            } catch (e) {}
          };
        } catch (e2) {}
      }
    });
  } catch (e) {}
}

var dlg = null;
var pendingImport = null;

function scopeLabel() {
  try {
    if (typeof currentView !== 'undefined' && currentView && currentView.tipo === 'luna' && currentView.luna) {
      return 'Luna ' + currentView.luna;
    }
  } catch (e) {}
  return 'luna visible';
}

function buildDialog() {
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.id = 'icsDialog';
  dlg.innerHTML =
    '<form method="dialog">' +
      '<div class="dlg-actions su-d2d053">' +
        '<h3 class="su-ee0cfe">📅 Otro calendario (.ics)</h3>' +
        '<button type="button" id="icsCloseTop" class="btn btn-icon" title="Cerrar" aria-label="Cerrar">✕</button>' +
      '</div>' +
      '<p class="muted su-77e2fe">Lleva tus compromisos a Google, Outlook u otro calendario —o trae los de ellos— con archivos <b>.ics</b>. Ideal para <b>horarios, reuniones, talleres y actividades comunales</b>. Todo sigue <b>privado y local</b>: el archivo solo se crea cuando tú lo pides.</p>' +
      '<div class="ics-sec">' +
        '<h4>📤 Exportar mis compromisos</h4>' +
        '<p class="muted su-11a508">Se exportan título + hora + referencia lunar. Tus notas privadas no salen del dispositivo.</p>' +
        '<div class="ics-row">' +
          '<label class="muted" for="icsScope">Alcance</label>' +
          '<select id="icsScope">' +
            '<option value="luna">Esta luna visible</option>' +
            '<option value="ciclo" selected>Ciclo actual completo</option>' +
            '<option value="todo">Todo lo guardado</option>' +
          '</select>' +
        '</div>' +
        '<div class="ics-row"><span id="icsCount" class="ics-count"></span></div>' +
        '<div class="ics-row"><button type="button" id="icsExport" class="btn btn-accent su-30e741">📤 Exportar .ics</button></div>' +
        '<div id="icsExportMsg" class="ics-msg"></div>' +
      '</div>' +
      '<div class="ics-sec">' +
        '<h4>📥 Importar desde .ics</h4>' +
        '<p class="muted su-11a508">Lee el archivo y crea los compromisos en sus días. No duplica los que ya existen. Si una fecha cae fuera de tus ciclos guardados, se informa y se omite.</p>' +
        '<div class="ics-row">' +
          '<button type="button" id="icsPick" class="btn su-30e741">📂 Elegir archivo .ics</button>' +
          '<span id="icsFileName" class="ics-count"></span>' +
        '</div>' +
        '<div id="icsPreview" class="ics-msg"></div>' +
        '<div class="ics-row"><button type="button" id="icsImport" class="btn btn-accent su-30e741" disabled>✅ Importar</button></div>' +
        '<div id="icsImportMsg" class="ics-msg"></div>' +
      '</div>' +
      '<div class="dlg-actions"><button type="button" id="icsClose" class="btn">Cerrar</button></div>' +
    '</form>';
  document.body.appendChild(dlg);
  $('icsCloseTop').onclick = closeDlg;
  $('icsClose').onclick = closeDlg;
  $('icsScope').onchange = refreshCount;
  $('icsExport').onclick = doExport;
  $('icsPick').onclick = doPick;
  $('icsImport').onclick = doImport;
  return dlg;
}

function refreshCount() {
  try {
    var sc = ($('icsScope') || {}).value || 'ciclo';
    var evs = collectEvents(sc);
    var lbl = sc === 'luna' ? scopeLabel() : sc === 'ciclo' ? 'ciclo actual' : 'todo lo guardado';
    $('icsCount').textContent = evs.length
      ? '📌 ' + evs.length + ' compromiso(s) en ' + lbl + ' — listos para exportar.'
      : 'Sin compromisos en ' + lbl + ' todavía.';
  } catch (e) {}
}

function fileNameFor(scope) {
  var base = 'compromisos-13-lunas';
  try {
    if (scope === 'luna') {
      var l = (typeof currentView !== 'undefined' && currentView && currentView.luna) ? currentView.luna : 'luna';
      return base + '-luna' + l + '.ics';
    }
    if (scope === 'ciclo' && typeof currentCycleYear === 'function') return base + '-ciclo' + currentCycleYear() + '.ics';
  } catch (e) {}
  return base + '.ics';
}

function doExport() {
  var msg = $('icsExportMsg');
  try {
    var sc = ($('icsScope') || {}).value || 'ciclo';
    var evs = collectEvents(sc);
    if (!evs.length) {
      if (msg) msg.textContent = 'Sin compromisos en este alcance. Agrega uno con 🕐 en cualquier día e intenta de nuevo.';
      return;
    }
    if (msg) msg.textContent = '⏳ Generando archivo...';
    var text = buildICS(evs, { calName: 'Calendario 13 Lunas — compromisos' });
    var btn = $('icsExport');
    if (btn) { btn.disabled = true; }
    saveICSFile(text, fileNameFor(sc)).then(function (r) {
      if (btn) { btn.disabled = false; }
      if (msg) msg.textContent = r ? '✅ ' + evs.length + ' compromiso(s) exportados ✓ — impórtalos en Google, Outlook u otro calendario.' : 'No se pudo generar el archivo.';
      try {
        if (typeof window !== 'undefined' && $('statusMsg')) {
          $('statusMsg').textContent = r ? 'Archivo .ics exportado ✓' : 'Exportación cancelada';
          setTimeout(function () { $('statusMsg').textContent = ''; }, 2500);
        }
      } catch (e) {}
    });
  } catch (e) {
    if (msg) msg.textContent = 'No se pudo exportar.';
  }
}

function doPick() {
  var prev = $('icsPreview');
  var imsg = $('icsImportMsg');
  var imp = $('icsImport');
  var fn = $('icsFileName');
  pendingImport = null;
  if (imp) imp.disabled = true;
  if (imsg) imsg.textContent = '';
  if (prev) prev.textContent = '⏳ Leyendo archivo...';
  if (fn) fn.textContent = '';
  pickICSFile().then(function (content) {
    if (content == null) {
      if (prev) prev.textContent = '';
      return;
    }
    var text = String(content);
    if (text.length > MAX_IMPORT_CHARS) {
      if (prev) prev.textContent = '❌ Archivo muy grande (más de 2 MB). Parte el calendario en archivos menores.';
      return;
    }
    var parsed;
    try { parsed = parseICS(text); }
    catch (e) { parsed = null; }
    if (!parsed || (!parsed.events.length && !parsed.skipped)) {
      if (prev) prev.textContent = '❌ Ese archivo no trae eventos .ics válidos (¿es .ics de calendario?). Nada fue modificado.';
      return;
    }
    pendingImport = parsed.events;
    if (fn) fn.textContent = ' · ' + parsed.events.length + ' evento(s) leídos' + (parsed.skipped ? ' · ' + parsed.skipped + ' omitido(s) por formato' : '');
    if (prev) {
      prev.textContent = parsed.events.length
        ? '📌 ' + parsed.events.length + ' evento(s) listos para importar' +
          (parsed.skipped ? ' (' + parsed.skipped + ' se omiten por formato)' : '') +
          '. Revisa y confirma abajo.'
        : 'Sin eventos aprovechables en ese archivo.';
    }
    if (imp) imp.disabled = !parsed.events.length;
  });
}

function doImport() {
  var imsg = $('icsImportMsg');
  if (!pendingImport || !pendingImport.length) return;
  var btn = $('icsImport');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Importando...'; }
  setTimeout(function () {
    var r;
    try { r = applyEvents(pendingImport); }
    catch (e) { r = null; }
    if (btn) { btn.disabled = false; btn.textContent = '✅ Importar'; }
    if (!r) { if (imsg) imsg.textContent = '❌ No se pudo importar. Nada fue modificado.'; return; }
    var parts = [];
    if (r.added) parts.push('✅ ' + r.added + ' compromiso(s) creados');
    if (r.dup) parts.push(r.dup + ' ya existían (sin duplicar)');
    if (r.fuera) parts.push(r.fuera + ' fuera de tus ciclos (omitidos)');
    if (r.dft) parts.push(r.dft + ' en Día Fuera del Tiempo (sin horario, omitidos)');
    if (imsg) imsg.textContent = parts.length ? parts.join(' · ') + '.' : 'Sin cambios.';
    if (r.added) { pendingImport = null; refreshCount(); }
    try {
      if ($('statusMsg')) {
        $('statusMsg').textContent = r.added ? 'Compromisos importados ✓' : 'Sin compromisos nuevos';
        setTimeout(function () { $('statusMsg').textContent = ''; }, 2500);
      }
    } catch (e) {}
  }, 30);
}

function openDlg() {
  try {
    buildDialog();
    pendingImport = null;
    var imp = $('icsImport');
    if (imp) { imp.disabled = true; imp.textContent = '✅ Importar'; }
    if ($('icsPreview')) $('icsPreview').textContent = '';
    if ($('icsImportMsg')) $('icsImportMsg').textContent = '';
    if ($('icsExportMsg')) $('icsExportMsg').textContent = '';
    if ($('icsFileName')) $('icsFileName').textContent = '';
    refreshCount();
    try { if (dlg.showModal) dlg.showModal(); else dlg.show(); }
    catch (e) { try { dlg.setAttribute('open', ''); } catch (e2) {} }
  } catch (e) {}
}
function closeDlg() { try { if (dlg) dlg.close(); } catch (e) {} }

/* ---------- init (patrón de los demás módulos) ---------- */
var _tries = 0;
function init() {
  try {
    if (!document.querySelector('.action-group[data-group="dia"] .group-btns')) { if (_tries++ < 40) setTimeout(init, 500); return; }
    if (typeof userData !== 'function') { if (_tries++ < 40) setTimeout(init, 500); return; }
  } catch (e) { if (_tries++ < 40) { try { setTimeout(init, 500); } catch (e2) {} } return; }
  injectCSS();
  injectBtn();
  injectCfgChk();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { window.cal13icsOpen = openDlg; } catch (e) {}
  var _rb = 0;
  (function rebind() {
    try {
      var b = $('btnICS');
      if (b && !b.dataset.icsW) { b.dataset.icsW = '1'; b.onclick = openDlg; }
      injectCfgChk();
    } catch (e) {}
    try {
      if ((typeof userData === 'function') && _rb++ < 20) {
        var still = !$('btnICS');
        if (still) setTimeout(rebind, 500);
      }
    } catch (e) {}
  })();
}
try {
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
} catch (e) {}

window.Cal13ICS = {
  buildICS: buildICS,
  parseICS: parseICS,
  escText: escText,
  unescText: unescText,
  foldLine: foldLine,
  collectEvents: collectEvents,
  applyEvents: applyEvents,
  open: openDlg,
  version: 1
};

})();
