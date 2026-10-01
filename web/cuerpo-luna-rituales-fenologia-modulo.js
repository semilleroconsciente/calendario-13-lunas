/* ============================================================
   CUERPO + INTERIOR · LUNA, RITUALES Y FENOLOGÍA
   Calendario 13 Lunas (Penco · Bío-Bío)
   - Botón btnPelo (💇 Luna y Corte) en Cuerpo & Salud > Cuidado:
     calendario lunar de cortes según la tradición (creciente =
     crecimiento, llena = volumen, menguante = dura más, nueva =
     descanso). Diálogo peloDialog: Hoy / Calendario / Mis
     cortes / Guía. Las fases exactas se marcan con 💇 en el
     calendario principal y tus cortes con ✂️.
     userData().peloLunar = { cortes: [] }
   - Botón btnRituales (🧂 Rituales Salud) en Cuerpo & Salud >
     Cuidado: desintoxicación suave, ayuno intermitente guiado
     por fases (nueva = iniciar) y pausas digitales en menguante.
     Ligero y opcional, SIN promesas médicas, con
     contraindicaciones claras. Diálogo ritualDialog:
     Hoy / Ayuno / Pausa digital / Mis registros / Guía.
     userData().ritualesSalud = { regs: [] }
   - Botón btnFenologia (📜 Fenología) en Interior, Linaje y
     Memoria > Interior: almanaque vivo de Penco — primeras
     floraciones, llegadas, lluvias. Une 🦅 Aves, 🌳 Bosque,
     🌸 Flora, 🎣 Pesca y 🦀 Intermareal: tus observaciones
     aquí se marcan con 📜 en el calendario. Diálogo
     fenoDialog: Almanaque / Registrar / Mis obs / Guía.
     userData().fenologia = { obs: [] }
   - Todo local y privado por usuario. 100% offline.
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
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function fmtFecha(key) {
  try {
    var p = key.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12));
    return cal.fmtDate.format(d);
  } catch (e) { return key; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch (e) {}
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function makeDialog(id, title, sub, bodyHTML) {
  var old = $(id);
  if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = id;
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted" style="line-height:1.5">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function celdaPara(fechaKey) {
  var ref = null;
  try { if (typeof lunaMapForKey === 'function') ref = lunaMapForKey(fechaKey); } catch (e) {}
  if (!ref) return { error: 'Esa fecha está fuera del ciclo de 13 lunas visible.' };
  if (ref.luna === 'dft') return { ref: ref, dft: true };
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    var cyk = u && u.cycles ? u.cycles[String(ref.y)] : null;
    if (!cyk) return { error: 'No se pudo abrir el ciclo ' + ref.y + '.' };
    if (!cyk.moons[String(ref.luna)]) cyk.moons[String(ref.luna)] = { days: {} };
    var m = cyk.moons[String(ref.luna)];
    if (!m.days[ref.diaN]) m.days[ref.diaN] = { nota: '', animo: -1, agenda: [] };
    if (!Array.isArray(m.days[ref.diaN].agenda)) m.days[ref.diaN].agenda = [];
    return { ref: ref, cell: m.days[ref.diaN] };
  } catch (e) { return { error: 'No se pudo abrir ese día.' }; }
}
function llevarAlCal(tag, nombre, detalle, fechaVal, horaVal, conAviso) {
  var fecha = (fechaVal || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert('Elige una fecha válida.'); return; }
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : '10:00';
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[' + tag + '] ' + nombre + (detalle ? ' · ' + detalle : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + texto + ' ' + hhmm : texto + ' ' + hhmm;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) { try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {} }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  save('📌 Agregado al calendario ✓');
  refrescarCal();
}
/* Fases reales: usa el motor astronómico de la app */
function fasesReales(desdeMs, hastaMs) {
  try {
    if (window.astro && typeof window.astro.moonPhaseEvents === 'function')
      return window.astro.moonPhaseEvents(desdeMs, hastaMs).sort(function (a, b) { return a.utcMs - b.utcMs; });
  } catch (e) {}
  return [];
}
function faseKeyDeEvento(ev) {
  try { return cal.fmtKey.format(new Date(ev.utcMs)); } catch (e) { return ''; }
}

/* ==================== 💇 LUNA Y CORTE ==================== */
var PELO_RECO = {
  'nueva': { t: '🌑 Luna nueva — descanso', r: 'La tradición dice: evita cortes grandes. Solo despunte de puntas abiertas si acaso. Buen día para mascarilla capilar, aceitado y planificar el cambio.', marca: '🌑 descanso, evita corte 💇' },
  'cuarto-creciente': { t: '🌗 Cuarto creciente — crecimiento', r: 'Corte para que crezca rápido y largo: despuntes, capas, chasquilla que quieres dejar crecer. Ideal si buscas melena.', marca: '🌗 corte crecimiento 💇' },
  'llena': { t: '🌕 Luna llena — volumen y fuerza', r: 'El día estrella de la tradición: corte para abundancia y brillo, tintes y cambios de look. Se dice que el pelo queda más grueso y sano.', marca: '🌕 corte volumen 💇' },
  'cuarto-menguante': { t: '🌓 Cuarto menguante — dura más', r: 'Crece lento: ideal para mantener la forma (corte varón, flequillo, rapado, perfilado de barba). Dura más semanas sin retocar.', marca: '🌓 corte dura más 💇' }
};
var PELO_TIPOS = ['✂️ Despunte', '✂️ Corte completo', '🎨 Tinte / color', '🧔 Barba / perfilado', '💆 Tratamiento capilar', '📌 Otro'];
function peloStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { cortes: [] };
    if (!u.peloLunar) u.peloLunar = { cortes: [] };
    if (!Array.isArray(u.peloLunar.cortes)) u.peloLunar.cortes = [];
    return u.peloLunar;
  } catch (e) { return { cortes: [] }; }
}
function peloFaseCercana(fechaKey) {
  try {
    var p = fechaKey.split('-');
    var ms = Date.UTC(+p[0], +p[1] - 1, +p[2], 12);
    var evs = fasesReales(ms - 9 * 864e5, ms + 9 * 864e5);
    var best = null, bd = 1e15;
    evs.forEach(function (e) { var d = Math.abs(e.utcMs - ms); if (d < bd) { bd = d; best = e; } });
    if (best && bd < 5 * 864e5) return best;
  } catch (e) {}
  return null;
}
function peloBuild() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabPeloHoy" class="btn btn-accent" style="width:auto">💇 Hoy</button>' +
    '<button type="button" id="tabPeloCal" class="btn" style="width:auto">🌙 Calendario</button>' +
    '<button type="button" id="tabPeloMis" class="btn" style="width:auto">✂️ Mis cortes</button>' +
    '<button type="button" id="tabPeloGuia" class="btn" style="width:auto">📖 Guía</button></div>' +
    '<div id="peloHoy"></div>' +
    '<div id="peloCal" class="hidden"></div>' +
    '<div id="peloMis" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Anotar mi corte</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="peloFecha"></label>' +
    '<label style="flex:2">Tipo <select id="peloTipo">' + PELO_TIPOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label style="flex:2">Nota <input type="text" id="peloNota" placeholder="ej: despunte 3 cm, peluquería centro" maxlength="80"></label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="peloAviso"> 📌 cita</label></div>' +
    '<div class="conv-row"><label style="flex:2">Fecha cita (si es futura) <input type="date" id="peloCitaF"></label>' +
    '<label>Hora <input type="time" id="peloCitaH" value="11:00"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="peloAdd" class="btn btn-accent" style="width:auto">+ Guardar corte</button></div></div>' +
    '<div id="peloList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="peloGuia" class="hidden">' +
    '<div class="si-card"><h4>🌙 La regla en 4 líneas (tradición popular)</h4><p><b>🌑 Nueva:</b> descanso, no cortes grandes.<br><b>🌗 Creciente:</b> córtalo si quieres que <b>crezca rápido</b>.<br><b>🌕 Llena:</b> el día ideal: <b>volumen, brillo y cambios</b>.<br><b>🌓 Menguante:</b> córtalo si quieres que <b>dure la forma</b> (varón, flequillo, barba).<br><span class="muted">Es tradición transmitida por abuelas y peluqueras, no ciencia: no hay evidencia de que la luna cambie el pelo, pero ordenar tus cortes con ella no hace daño y ayuda a no postergar.</span></p></div>' +
    '<div class="si-card"><h4>💇 Consejos que sí tienen evidencia</h4><p>Despunta cada 8–12 semanas si hay horquilla · el tinte dura más con agua tibia (no caliente) y sin plancha diaria · en Penco el viento + sal resecan: aceite de coco/oliva 20 min antes del lavado 1 vez por luna · cuero cabelludo con picazón o caída en mechones → dermatólogo/CESFAM, no luna.</p></div>' +
    '<div class="si-card"><h4>📌 Cómo usarlo</h4><p>Revisa 🌙 Calendario, elige tu fase y agenda con <b>📌</b> (queda como compromiso en el día). Cuando te cortes, anótalo en ✂️ Mis cortes: verás en qué fase cortas más. Los días de fase exacta llevan 💇 en el calendario principal.</p></div>' +
    '</div>';
  makeDialog('peloDialog', '💇 Luna y Corte — calendario capilar',
    'Tradición popular: cada fase sugiere un tipo de corte. Fechas reales calculadas por la app y <b>marcadas con 💇 en el calendario</b>. <b>Privado y local</b>, 100% offline.',
    body);
}
function peloSwitch(t) {
  ['Hoy', 'Cal', 'Mis', 'Guia'].forEach(function (x) {
    var p = $('pelo' + x), b = $('tabPelo' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function peloRender() {
  var hoy = $('peloHoy'); if (!hoy) return;
  var ahora = Date.now();
  var evs = fasesReales(ahora - 10 * 864e5, ahora + 40 * 864e5);
  var pas = null, prox = null;
  evs.forEach(function (e) {
    if (e.utcMs <= ahora) pas = e;
    else if (!prox) prox = e;
  });
  var recHoy = pas ? PELO_RECO[pas.tipo] : null;
  var mist = peloStore().cortes.length;
  hoy.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>💇 Hoy: ' + esc(recHoy ? recHoy.t : 'mira el calendario') + '</h4>' +
    '<p style="font-size:12px;line-height:1.6">' + esc(recHoy ? recHoy.r : 'Calculando fases…') + '</p>' +
    (prox ? '<p class="muted" style="font-size:11px">Próxima: <b>' + esc(prox.simbolo + ' ' + prox.tipo.replace('-', ' ')) + '</b> · ' + esc(fmtFecha(faseKeyDeEvento(prox))) + ' — ' + esc((PELO_RECO[prox.tipo] || {}).t || '') + '</p>' : '') +
    '<p class="muted" style="font-size:11px">' + mist + ' corte(s) anotados · los días de fase llevan 💇 en el calendario</p></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="peloGoCal" class="btn" style="width:auto">🌙 Ver fechas</button>' +
    '<button type="button" id="peloGoMis" class="btn" style="width:auto">✂️ Anotar corte</button></div>';
  var gc = $('peloGoCal'); if (gc) gc.onclick = function () { peloSwitch('Cal'); };
  var gm = $('peloGoMis'); if (gm) gm.onclick = function () { peloSwitch('Mis'); };
  var cb = $('peloCal');
  if (cb) {
    var lista = fasesReales(ahora - 30 * 864e5, ahora + 95 * 864e5);
    cb.innerHTML = '<p class="muted" style="font-size:11px">Fases reales 2026 · hora Chile · toca 📌 para agendar tu corte ese día.</p>' +
      lista.map(function (e, i) {
        var k = faseKeyDeEvento(e);
        var r = PELO_RECO[e.tipo] || { t: e.tipo, r: '' };
        var esPasada = e.utcMs < ahora - 864e5;
        return '<div class="si-card' + (esPasada ? '" style="opacity:.55' : '') + '"><h4>' + esc(e.simbolo + ' ' + r.t) + '</h4>' +
          '<p class="muted">📅 ' + esc(k + ' · ' + fmtFecha(k)) + '</p><p style="font-size:12px">' + esc(r.r) + '</p>' +
          (esPasada ? '' : '<div style="margin-top:6px"><button type="button" class="btn pelo-cal" data-k="' + i + '" style="width:auto;font-size:11px">📌 Agendar corte</button></div>') + '</div>';
      }).join('');
    cb.querySelectorAll('.pelo-cal').forEach(function (b) {
      b.onclick = function () {
        var e = lista[parseInt(b.dataset.k, 10)]; if (!e) return;
        var k = faseKeyDeEvento(e);
        llevarAlCal('Pelo', '💇 Corte (' + e.tipo.replace('-', ' ') + ')', (PELO_RECO[e.tipo] || {}).t || '', k, '11:00', false);
      };
    });
  }
  var lb = $('peloList');
  if (lb) {
    var arr = peloStore().cortes.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    lb.innerHTML = arr.length ? arr.map(function (c) {
      var f = peloFaseCercana(c.fecha);
      return '<div class="si-card"><h4>✂️ ' + esc(c.fecha + ' · ' + fmtFecha(c.fecha)) + '</h4>' +
        '<p style="font-size:12px"><b>' + esc(c.tipo) + '</b>' + (f ? ' <span class="muted">· cerca de ' + esc(f.simbolo + ' ' + f.tipo.replace('-', ' ')) + '</span>' : '') + '</p>' +
        (c.nota ? '<p class="muted">' + esc(c.nota) + '</p>' : '') +
        '<div style="margin-top:6px"><button type="button" class="btn pelo-d" data-k="' + esc(c.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button></div></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin cortes aún. Anota el último que recuerdes.</p>';
    lb.querySelectorAll('.pelo-d').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('¿Borrar corte?')) return;
        var s = peloStore(); s.cortes = s.cortes.filter(function (x) { return x.id !== b.dataset.k; });
        save(); peloRender(); refrescarCal();
      };
    });
  }
  var pf = $('peloFecha'); if (pf && !pf.value) pf.value = todayKey();
  var pcf = $('peloCitaF'); if (pcf && !pcf.value) pcf.value = todayKey();
}

/* ==================== 🧂 RITUALES SALUD ==================== */
var RIT_TIPOS = ['⏳ Ayuno 12:12', '⏳ Ayuno 14:10', '⏳ Ayuno 16:8', '🌕 Cena ligera luna llena', '📵 Pausa digital', '🥗 Detox suave 3 días', '📌 Otro'];
var RIT_GUIA = [
  { t: '⏳ 12:12 — para empezar (nueva)', d: 'Cena 20:00 → desayuno 08:00. Solo alargas la noche sin comer. Agua e infusiones sí. Ideal para iniciar en 🌑 nueva.' },
  { t: '⏳ 14:10 — intermedio', d: 'Cena 19:00 → desayuno 09:00. Prueba 2–3 veces por semana cuando el 12:12 salga fácil.' },
  { t: '⏳ 16:8 — avanzado y opcional', d: 'Solo si el 14:10 va bien y sin mareos. Nunca todos los días seguidos al inicio. Si entrenas fuerte, ese día no ayunes.' },
  { t: '🌕 Cena ligera en llena', d: 'La tradición (ver 📿 Ekadashi): sopa, fruta, infusión. Liviano, sin culpa si tienes hambre real: come.' },
  { t: '📵 Pausa digital (menguante)', d: '1 h sin pantallas antes de dormir · 1 tarde sin redes por semana · celu fuera del dormitorio. La menguante es para soltar.' },
  { t: '🥗 Detox suave 3 días (nueva)', d: 'Más agua, verduras, fruta, infusión de boldo/manzanilla (ver 🌿 Lawen), caminata y dormir 8 h. Tu hígado y riñones ya detoxifican: esto es descanso, no cura.' }
];
function ritStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { regs: [] };
    if (!u.ritualesSalud) u.ritualesSalud = { regs: [] };
    if (!Array.isArray(u.ritualesSalud.regs)) u.ritualesSalud.regs = [];
    return u.ritualesSalud;
  } catch (e) { return { regs: [] }; }
}
function ritBuild() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabRitHoy" class="btn btn-accent" style="width:auto">🧂 Hoy</button>' +
    '<button type="button" id="tabRitAyuno" class="btn" style="width:auto">⏳ Ayuno</button>' +
    '<button type="button" id="tabRitPausa" class="btn" style="width:auto">📵 Pausa</button>' +
    '<button type="button" id="tabRitMis" class="btn" style="width:auto">📓 Mis registros</button>' +
    '<button type="button" id="tabRitGuia" class="btn" style="width:auto">📖 Guía</button></div>' +
    '<div id="ritHoy"></div>' +
    '<div id="ritAyuno" class="hidden"></div>' +
    '<div id="ritPausa" class="hidden">' +
    '<div class="si-card"><h4>📵 Pausa digital de menguante (elige 1)</h4><p>☐ Esta noche: 1 h sin pantallas antes de dormir<br>☐ Este finde: 1 tarde sin redes<br>☐ Celu fuera del dormitorio 3 noches<br>☐ Silencia 3 grupos ruidosos<br><span class="muted">Anota abajo cuál hiciste y cómo dormiste. La idea es soltar, no rendir.</span></p></div></div>' +
    '<div id="ritMis" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Anotar ritual de hoy</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="ritFecha"></label>' +
    '<label style="flex:2">Tipo <select id="ritTipo">' + RIT_TIPOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Sentir 1–5 <input type="number" id="ritSentir" min="1" max="5" step="1" value="3"></label></div>' +
    '<label>Nota <input type="text" id="ritNota" placeholder="ej: 12:12 sin hambre, dormí mejor" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="ritAdd" class="btn btn-accent" style="width:auto">+ Guardar</button></div></div>' +
    '<div id="ritList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="ritGuia" class="hidden">' +
    '<div class="si-card" style="border-color:#e76e8a"><h4>⛔ Cuándo NO ayunar</h4><p>Embarazo o lactancia · diabetes con remedios/insulina · presión con fármacos que exigen comida · historia de trastorno alimentario · menores de 18 · enfermedad aguda o post-operatorio · adultos mayores frágiles. <b>Si mareo fuerte, dolor de cabeza intenso, temblor o hambre que no pasa: come sin culpa y avisa.</b> Dudas → matrona/CESFAM antes de probar.</p></div>' +
    '<div class="si-card"><h4>🌙 Ritmo por fases (sugerido, opcional)</h4><p><b>🌑 Nueva:</b> inicia 12:12 + detox suave 3 días.<br><b>🌗 Creciente:</b> mantén lo que te funcionó, no subas exigencia.<br><b>🌕 Llena:</b> cena ligera 1 noche (o ayuno solo si ya lo dominas).<br><b>🌓 Menguante:</b> pausa digital + suelta 1 hábito que pese (azúcar nocturna, picoteo ansioso).<br><span class="muted">Nada es obligatorio: si una fase no te acomoda, repite la anterior.</span></p></div>' +
    '<div class="si-card"><h4>💧 Reglas de oro</h4><p>Agua siempre (2+ vasos en ayuno) · infusiones sin azúcar sí · café solo si lo toleras sin comida · rompe el ayuno con comida real (no ultraprocesados) · duerme 7–8 h: sin sueño el ayuno se sufre el doble · registra cómo te sentiste (1–5) para aprender tu medida.</p></div>' +
    '<div class="si-card"><h4>⚠️ Sin promesas</h4><p>Esto no baja de peso por arte de magia, no “limpia metales”, no cura nada. Es <b>descanso digestivo y orden de horarios</b>. Si buscas bajar mucho de peso o tienes una condición de salud, pide hora en CESFAM: es gratis y es lo seguro.</p></div>' +
    '</div>';
  makeDialog('ritualDialog', '🧂 Rituales de Salud — suave y por fases',
    'Ayuno intermitente liviano, detox suave y pausas digitales guiados por la luna. <b>Opcional, sin promesas médicas</b>: lee ⛔ cuándo no ayunar. <b>Privado y local</b>, 100% offline.',
    body);
}
function ritSwitch(t) {
  ['Hoy', 'Ayuno', 'Pausa', 'Mis', 'Guia'].forEach(function (x) {
    var p = $('rit' + x), b = $('tabRit' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function ritRender() {
  var box = $('ritHoy'); if (!box) return;
  var tithi = null;
  try {
    var noon = Date.now();
    if (window.astro && typeof window.astro.tithi === 'function') tithi = window.astro.tithi(noon);
  } catch (e) {}
  var ahora = Date.now();
  var evs = fasesReales(ahora - 10 * 864e5, ahora + 30 * 864e5);
  var pas = null, prox = null;
  evs.forEach(function (e) { if (e.utcMs <= ahora) pas = e; else if (!prox) prox = e; });
  var sug = 'Mantén horarios ordenados y agua a mano.';
  if (pas) {
    if (pas.tipo === 'nueva') sug = '🌑 Nueva: buen momento para <b>iniciar 12:12</b> o un detox suave de 3 días.';
    else if (pas.tipo === 'cuarto-creciente') sug = '🌗 Creciente: <b>mantén</b> lo que te funcionó, sin subir exigencia.';
    else if (pas.tipo === 'llena') sug = '🌕 Llena: prueba una <b>cena ligera</b> esta noche (o revisa 📿 Ekadashi).';
    else sug = '🌓 Menguante: toca <b>pausa digital</b> y soltar 1 hábito que pese.';
  }
  var regs = ritStore().regs;
  var r28 = regs.filter(function (r) { try { var p = r.fecha.split('-'); var ms = Date.UTC(+p[0], +p[1] - 1, +p[2]); return (ahora - ms) < 29 * 864e5; } catch (e) { return false; } }).length;
  box.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧂 Hoy</h4>' +
    '<p style="font-size:12px;line-height:1.6">' + sug + '</p>' +
    '<p class="muted" style="font-size:11px">' + (tithi ? 'Tithi ' + tithi + ' · ' : '') + (prox ? 'próxima fase: <b>' + esc(prox.simbolo + ' ' + prox.tipo.replace('-', ' ')) + '</b> ' + esc(fmtFecha(faseKeyDeEvento(prox))) : '') + '<br>' + r28 + ' registro(s) últimos 28 días</p></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="ritGoA" class="btn" style="width:auto">⏳ Ver ayunos</button>' +
    '<button type="button" id="ritGoM" class="btn" style="width:auto">📓 Anotar hoy</button>' +
    '<button type="button" id="ritGoE" class="btn" style="width:auto">📿 Abrir Ekadashi</button></div>';
  var ga = $('ritGoA'); if (ga) ga.onclick = function () { ritSwitch('Ayuno'); };
  var gm = $('ritGoM'); if (gm) gm.onclick = function () { ritSwitch('Mis'); };
  var ge = $('ritGoE'); if (ge) ge.onclick = function () { try { if ($('btnEkadashi')) $('btnEkadashi').click(); } catch (e) {} };
  var ab = $('ritAyuno');
  if (ab) {
    ab.innerHTML = RIT_GUIA.map(function (g) {
      return '<div class="si-card"><h4>' + esc(g.t) + '</h4><p style="font-size:12px">' + esc(g.d) + '</p></div>';
    }).join('');
  }
  var lb = $('ritList');
  if (lb) {
    var arr = regs.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 60);
    lb.innerHTML = arr.length ? arr.map(function (r) {
      var caritas = ['—', '😣', '😕', '🙂', '😊', '🌟'][Math.min(5, Math.max(0, parseInt(r.sentir) || 0))];
      return '<div class="si-card"><h4>' + esc(r.tipo) + ' · ' + esc(r.fecha) + ' ' + caritas + '</h4>' +
        (r.nota ? '<p class="muted">' + esc(r.nota) + '</p>' : '') +
        '<div style="margin-top:6px"><button type="button" class="btn rit-d" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button></div></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin registros. Anota el de hoy 📓.</p>';
    lb.querySelectorAll('.rit-d').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('¿Borrar registro?')) return;
        var s = ritStore(); s.regs = s.regs.filter(function (x) { return x.id !== b.dataset.k; });
        save(); ritRender();
      };
    });
  }
  var rf = $('ritFecha'); if (rf && !rf.value) rf.value = todayKey();
}

/* ==================== 📜 FENOLOGÍA ==================== */
var FENO_BASE = [
  { id: 'chilco', n: '🌸 Chilco — primera floración', meses: 'ago–oct', donde: 'Quebradas húmedas', bit: '🌸 Flora / 🌳 Bosque', tip: 'Flor colgante favorita del picaflor. Foto sin arrancar.' },
  { id: 'copihue', n: '🌺 Copihue — floración', meses: 'mar–jun', donde: 'Cerros Penco', bit: '🌳 Bosque', tip: 'Flor nacional: mirar, no cortar.' },
  { id: 'totora', n: '🌾 Totora — floración humedal', meses: 'nov–ene', donde: 'Rocuant-Andalién', bit: '🦅 Aves (hábitat)', tip: 'Marca con ella el verano del humedal.' },
  { id: 'maqui', n: '🫐 Maqui — fruto maduro', meses: 'dic–ene', donde: 'Borde bosque', bit: '🌸 Flora', tip: 'Cosecha 30%, deja 70% a las aves.' },
  { id: 'mora', n: '🍇 Mora/murra — madura', meses: 'dic–feb', donde: 'Cercos y quebradas', bit: '🌸 Flora', tip: 'Negra brillante = madura. Lavar por polvo de camino.' },
  { id: 'diguene', n: '🍄 Digueñes — aparecen', meses: 'sep–oct', donde: 'Hualles', bit: '🌳 Bosque', tip: 'Solo con lluvia previa. Cosecha sin arrancar el “pan”.' },
  { id: 'hongos', n: '🍄 Hongos de pino / loyo', meses: 'abr–jun', donde: 'Plantaciones y nativo', bit: '🌳 Bosque', tip: 'Si dudas de la especie: foto y no comer.' },
  { id: 'golondrina', n: '🐦 Golondrina chilena — llega', meses: 'sep–oct', donde: 'Cielo Penco', bit: '🦅 Aves', tip: 'Vuelo rasante en las tardes = volvió.' },
  { id: 'chorlo', n: '🐦 Chorlo nevado — nidifica', meses: 'oct–feb', donde: 'Playa/arena', bit: '🦅 Aves', tip: 'No pisar dunas ni soltar perros: abandona el nido.' },
  { id: 'zarapito', n: '🦅 Zarapito — migratorio', meses: 'sep–mar', donde: 'Rocuant', bit: '🦅 Aves', tip: 'Pico largo curvo: inconfundible en pleamar.' },
  { id: 'cisne', n: '🦢 Cisne cuello negro — polluelos', meses: 'oct–dic', donde: 'Rocuant', bit: '🦅 Aves', tip: 'Observar a 30 m, sin pan.' },
  { id: 'ballena', n: '🐋 Ballenas frente al golfo', meses: 'ago–nov', donde: 'Costa/Lirquén', bit: '🎣 Pesca (mar)', tip: 'No acercar embarcación a menos de 300 m.' },
  { id: 'luciernaga', n: '✨ Luciérnagas — peak', meses: 'dic–ene', donde: 'Borde bosque', bit: '🌳 Bosque', tip: 'De noche sin linterna: brillan más.' },
  { id: 'lluvia', n: '🌧️ Primera lluvia fuerte otoño', meses: 'mar–abr', donde: 'Todo Penco', bit: '🌤️ Clima', tip: 'Anota fecha + mm si tienes pluviómetro casero.' },
  { id: 'ranas', n: '🐸 Canto de ranas/sapos', meses: 'ago–sep', donde: 'Estero/quebradas', bit: '🦀 Intermareal no · humedal', tip: 'Coro nocturno = agua sana.' },
  { id: 'retamo', n: '🌼 Retamo/dedal — cerros en flor', meses: 'sep–nov', donde: 'Laderas', bit: '🌸 Flora', tip: 'Amarillo total: la primavera llegó.' }
];
var FENO_LUGARES = ['Penco centro', 'Lirquén', 'Rocuant / humedal', 'Playa / costanera', 'Cerro / ladera', 'Quebrada / estero', 'Cosmito / rural', 'Otro'];
function fenoStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { obs: [] };
    if (!u.fenologia) u.fenologia = { obs: [] };
    if (!Array.isArray(u.fenologia.obs)) u.fenologia.obs = [];
    return u.fenologia;
  } catch (e) { return { obs: [] }; }
}
function fenoBaseNombre(id) {
  var f = null;
  FENO_BASE.forEach(function (x) { if (x.id === id) f = x; });
  return f ? f.n : id;
}
function fenoBuild() {
  var opts = FENO_BASE.map(function (f) { return '<option value="' + esc(f.id) + '">' + esc(f.n) + '</option>'; }).join('') + '<option value="libre">✏️ Otra (escribir abajo)</option>';
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabFenoAlm" class="btn btn-accent" style="width:auto">📜 Almanaque</button>' +
    '<button type="button" id="tabFenoReg" class="btn" style="width:auto">➕ Registrar</button>' +
    '<button type="button" id="tabFenoMis" class="btn" style="width:auto">🌟 Mis obs</button>' +
    '<button type="button" id="tabFenoGuia" class="btn" style="width:auto">📖 Guía</button></div>' +
    '<div id="fenoAlm"></div>' +
    '<div id="fenoReg" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Registrar primera observación</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="fenoFecha"></label>' +
    '<label style="flex:2">Evento <select id="fenoEv">' + opts + '</select></label></div>' +
    '<div class="conv-row"><label style="flex:2">Si es otra, ¿cuál? <input type="text" id="fenoLibre" placeholder="ej: primera helada, boldo en flor" maxlength="60"></label>' +
    '<label>Lugar <select id="fenoLugar">' + FENO_LUGARES.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label class="check-row" style="margin:0"><input type="checkbox" id="fenoPrim" checked> 🌟 Primera vez este año</label></div>' +
    '<label>Nota <input type="text" id="fenoNota" placeholder="ej: 3 golondrinas sobre la plaza, 18:40" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="fenoAdd" class="btn btn-accent" style="width:auto">+ Guardar observación</button></div></div></div>' +
    '<div id="fenoMis" class="hidden"><div id="fenoList" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="fenoGuia" class="hidden">' +
    '<div class="si-card"><h4>📜 ¿Qué es fenología?</h4><p>El calendario de <b>“primeras veces”</b> del territorio: primera flor, primera llegada, primera lluvia. Año a año se vuelve un <b>almanaque vivo de Penco</b>: si el chilco florece cada vez antes, el clima está hablando. Tu registro chico + el de otras vecinas = memoria colectiva.</p></div>' +
    '<div class="si-card"><h4>🔗 Une tus bitácoras (no las duplica)</h4><p>Viste un ave → anótala con detalle en <b>🦅 Aves</b> y marca aquí su <b>primera vez del año</b>. Flor rara → <b>🌸 Flora</b> + primera aquí. Salida al bosque → <b>🌳 Bosque</b> + primera aquí. Esta capa solo guarda <b>fecha + primera</b>: lo gordo vive en cada bitácora.</p></div>' +
    '<div class="si-card"><h4>✅ Buena observación en 30 segundos</h4><p>1) Fecha real (no “la semana pasada”). 2) Lugar reconocible. 3) Qué viste en 1 línea. 4) Marca 🌟 solo si es la <b>primera del año calendario</b>. Sin foto obligatoria, sin GPS: mejor constancia que perfección.</p></div>' +
    '</div>';
  makeDialog('fenoDialog', '📜 Fenología del Territorio — almanaque vivo',
    'Las <b>primeras veces</b> de Penco: flores, llegadas, lluvias. Registra tu primera observación y mírala con <b>📜 en el calendario</b>. Une 🦅🦀🌳🌸🎣. <b>Privado y local</b>, 100% offline.',
    body);
}
function fenoSwitch(t) {
  ['Alm', 'Reg', 'Mis', 'Guia'].forEach(function (x) {
    var p = $('feno' + x), b = $('tabFeno' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function fenoRender() {
  var box = $('fenoAlm'); if (!box) return;
  var obs = fenoStore().obs;
  var counts = {};
  try {
    var bd = (typeof getBirdData === 'function') ? getBirdData() : null;
    if (bd && bd.entries) counts['🦅 Aves'] = bd.entries.length;
  } catch (e) {}
  try {
    var bq = (typeof getBosqueData === 'function') ? getBosqueData() : null;
    if (bq && bq.entries) counts['🌳 Bosque'] = bq.entries.length;
  } catch (e) {}
  try {
    var ps = (typeof getFishingLogData === 'function') ? getFishingLogData() : null;
    if (ps && ps.length) counts['🎣 Pesca'] = ps.length;
  } catch (e) {}
  try {
    var im = (typeof getIntermarealData === 'function') ? getIntermarealData() : null;
    if (im && im.entries) counts['🦀 Intermareal'] = im.entries.length;
  } catch (e) {}
  var keys = Object.keys(counts);
  var year = new Date().getFullYear();
  box.innerHTML =
    (keys.length ? '<div class="menstrual-card"><h4>🔗 Tus bitácoras ya guardan</h4><p class="muted" style="font-size:11px">' +
      keys.map(function (k) { return esc(k + ': ' + counts[k]); }).join(' · ') +
      '<br>La fenología no las repite: solo marca la <b>primera del año</b>.</p></div>' : '') +
    FENO_BASE.map(function (f) {
      var mine = obs.filter(function (o) { return o.ev === f.id; });
      var primYear = null;
      mine.forEach(function (o) {
        if (o.primera && String(o.fecha).slice(0, 4) === String(year) && (!primYear || o.fecha < primYear)) primYear = o.fecha;
      });
      return '<div class="si-card"><h4>' + (primYear ? '🌟 ' : '') + esc(f.n) + '</h4>' +
        '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">📅 típico ' + esc(f.meses) + '</span>' +
        '<span class="chip" style="font-size:10px">📍 ' + esc(f.donde) + '</span>' +
        '<span class="chip" style="font-size:10px">' + esc(f.bit) + '</span></p>' +
        '<p class="muted">' + esc(f.tip) + '</p>' +
        '<p style="font-size:11px">' + (primYear ? '🌟 Primera ' + year + ': <b>' + esc(primYear + ' · ' + fmtFecha(primYear)) + '</b>' : '<span class="muted">Sin primera marcada este año (' + mine.length + ' obs. total)</span>') + '</p>' +
        '<div style="margin-top:6px"><button type="button" class="btn feno-quick" data-k="' + esc(f.id) + '" style="width:auto;font-size:11px">➕ La vi hoy</button></div></div>';
    }).join('');
  box.querySelectorAll('.feno-quick').forEach(function (b) {
    b.onclick = function () {
      var id = b.dataset.k;
      var s = fenoStore();
      var y = todayKey().slice(0, 4);
      var yaPrim = s.obs.some(function (o) { return o.ev === id && o.primera && String(o.fecha).slice(0, 4) === y; });
      s.obs.push({ id: uid('fe'), fecha: todayKey(), ev: id, libre: '', lugar: '', primera: !yaPrim, nota: '', creado: todayKey() });
      save(yaPrim ? 'Observación guardada 📜' : '🌟 ¡Primera del año guardada!');
      fenoRender(); refrescarCal();
    };
  });
  var lb = $('fenoList');
  if (lb) {
    var arr = obs.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 80);
    lb.innerHTML = arr.length ? arr.map(function (o) {
      var nombre = o.ev === 'libre' ? (o.libre || 'Otra') : fenoBaseNombre(o.ev);
      return '<div class="si-card"><h4>' + (o.primera ? '🌟 ' : '📜 ') + esc(nombre) + '</h4>' +
        '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">📅 ' + esc(o.fecha + ' · ' + fmtFecha(o.fecha)) + '</span>' +
        (o.lugar ? '<span class="chip" style="font-size:10px">📍 ' + esc(o.lugar) + '</span>' : '') +
        (o.primera ? '<span class="chip" style="font-size:10px">🌟 primera del año</span>' : '') + '</p>' +
        (o.nota ? '<p class="muted">' + esc(o.nota) + '</p>' : '') +
        '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn feno-share" data-k="' + esc(o.id) + '" style="width:auto;font-size:11px">📤</button>' +
        '<button type="button" class="btn feno-d" data-k="' + esc(o.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin observaciones. Marca “La vi hoy” en el Almanaque.</p>';
    lb.querySelectorAll('.feno-d').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('¿Borrar observación?')) return;
        var s = fenoStore(); s.obs = s.obs.filter(function (x) { return x.id !== b.dataset.k; });
        save(); fenoRender(); refrescarCal();
      };
    });
    lb.querySelectorAll('.feno-share').forEach(function (b) {
      b.onclick = function () {
        var o = null;
        fenoStore().obs.forEach(function (x) { if (x.id === b.dataset.k) o = x; });
        if (!o) return;
        var nombre = o.ev === 'libre' ? (o.libre || 'Otra') : fenoBaseNombre(o.ev);
        share('📜 Fenología Penco', (o.primera ? '🌟 Primera del año\n' : '') + nombre + '\n📅 ' + o.fecha + (o.lugar ? ' · 📍 ' + o.lugar : '') + (o.nota ? '\n' + o.nota : ''));
      };
    });
  }
  var ff = $('fenoFecha'); if (ff && !ff.value) ff.value = todayKey();
}

/* ==================== BOTONES + SETUP ==================== */
function injectBtn(group, sub, id, txt, kw, refSel) {
  try {
    var g = document.querySelector('.action-group[data-group="' + group + '"] .group-btns');
    if (!g) return;
    if ($(id)) { try { $(id).setAttribute('data-sub', sub); } catch (e2) {} return; }
    var btn = document.createElement('button');
    btn.id = id; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = txt;
    try { btn.setAttribute('data-sub', sub); } catch (eS) {}
    btn.setAttribute('data-keywords', kw);
    if (refSel) {
      var ref = g.querySelector(refSel);
      if (ref) { g.insertBefore(btn, ref); return; }
    }
    g.appendChild(btn);
  } catch (e) {}
}
function registerBtn(group, sub, id, label, matchTitle) {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME[id] = [group, sub]; } catch (e) {}
  try { if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER[group + '|' + sub] && BTN_ORDER[group + '|' + sub].indexOf(id) < 0) BTN_ORDER[group + '|' + sub].push(id); } catch (e) {}
  try { if (typeof PRESETS !== 'undefined') Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p][id] = true; }); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="' + id + '"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf(matchTitle) >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="' + id + '"> ' + esc(label);
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis[id] !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible[id] = lab.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e2) {}
            };
          } catch (e2) {}
        }
      });
    }
  } catch (e) {}
}

function setup() {
  injectBtn('cuerpo', 'cuidado', 'btnPelo', '💇 Luna y Corte', 'pelo corte peluqueria peluquero luna creciente llena menguante nueva volumen crecimiento despunte tinte barba chasquilla calendario lunar 2026');
  injectBtn('cuerpo', 'cuidado', 'btnRituales', '🧂 Rituales Salud', 'ritual ayuno intermitente detox desintoxicacion pausa digital menguante nueva fases salud preventiva agua infusion dieta liviana cena ligera ekadashi');
  injectBtn('linaje', 'interior', 'btnFenologia', '📜 Fenología', 'fenologia primeras observacion almanaque chilco totora golondrina chorlo ballena lluvia floracion llegada naturaleza territorio memoria colectiva picaflor maqui humedal rocuant', '.sub-label[data-sub="familia"]');
  registerBtn('cuerpo', 'cuidado', 'btnPelo', '💇 Luna y Corte', 'Cuerpo');
  registerBtn('cuerpo', 'cuidado', 'btnRituales', '🧂 Rituales Salud', 'Cuerpo');
  registerBtn('linaje', 'interior', 'btnFenologia', '📜 Fenología', 'Interior');
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}

  peloBuild(); ritBuild(); fenoBuild();
  peloRender(); ritRender(); fenoRender();

  var b1 = $('btnPelo');
  if (b1) b1.onclick = function () { peloRender(); peloSwitch('Hoy'); openDlg('peloDialog'); };
  var b2 = $('btnRituales');
  if (b2) b2.onclick = function () { ritRender(); ritSwitch('Hoy'); openDlg('ritualDialog'); };
  var b3 = $('btnFenologia');
  if (b3) b3.onclick = function () { fenoRender(); fenoSwitch('Alm'); openDlg('fenoDialog'); };

  ['Hoy', 'Cal', 'Mis', 'Guia'].forEach(function (t) {
    var b = $('tabPelo' + t); if (b) b.onclick = function () { peloSwitch(t); };
  });
  ['Hoy', 'Ayuno', 'Pausa', 'Mis', 'Guia'].forEach(function (t) {
    var b = $('tabRit' + t); if (b) b.onclick = function () { ritSwitch(t); };
  });
  ['Alm', 'Reg', 'Mis', 'Guia'].forEach(function (t) {
    var b = $('tabFeno' + t); if (b) b.onclick = function () { fenoSwitch(t); };
  });

  var pa = $('peloAdd');
  if (pa) pa.onclick = function () {
    var fecha = ($('peloFecha') || {}).value || todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return alert('Fecha inválida');
    var tipo = ($('peloTipo') || {}).value || PELO_TIPOS[0];
    var nota = clean((($('peloNota') || {}).value || '').trim(), 80);
    peloStore().cortes.push({ id: uid('pe'), fecha: fecha, tipo: tipo, nota: nota, creado: todayKey() });
    save('Corte guardado 💇');
    if ($('peloAviso') && $('peloAviso').checked) {
      var cf = ($('peloCitaF') || {}).value || todayKey();
      var ch = ($('peloCitaH') || {}).value || '11:00';
      llevarAlCal('Pelo', '💇 ' + tipo, nota, cf, ch, false);
      $('peloAviso').checked = false;
    }
    $('peloNota').value = '';
    peloRender(); refrescarCal();
  };

  var ra = $('ritAdd');
  if (ra) ra.onclick = function () {
    var fecha = ($('ritFecha') || {}).value || todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return alert('Fecha inválida');
    var tipo = ($('ritTipo') || {}).value || RIT_TIPOS[0];
    var sentir = Math.min(5, Math.max(1, parseInt(($('ritSentir') || {}).value) || 3));
    var nota = clean((($('ritNota') || {}).value || '').trim(), 100);
    ritStore().regs.push({ id: uid('ri'), fecha: fecha, tipo: tipo, sentir: sentir, nota: nota, creado: todayKey() });
    save('Ritual guardado 🧂');
    $('ritNota').value = '';
    ritRender();
  };

  var fa = $('fenoAdd');
  if (fa) fa.onclick = function () {
    var fecha = ($('fenoFecha') || {}).value || todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return alert('Fecha inválida');
    var ev = ($('fenoEv') || {}).value || 'libre';
    var libre = clean((($('fenoLibre') || {}).value || '').trim(), 60);
    if (ev === 'libre' && !libre) return alert('Escribe cuál fue la observación');
    var lugar = ($('fenoLugar') || {}).value || '';
    var prim = !!($('fenoPrim') || {}).checked;
    var nota = clean((($('fenoNota') || {}).value || '').trim(), 120);
    fenoStore().obs.push({ id: uid('fe'), fecha: fecha, ev: ev, libre: libre, lugar: lugar, primera: prim, nota: nota, creado: todayKey() });
    save(prim ? '🌟 ¡Primera del año guardada!' : 'Observación guardada 📜');
    $('fenoLibre').value = ''; $('fenoNota').value = '';
    fenoRender(); refrescarCal();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
