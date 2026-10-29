/* ============================================================
   CUMPLEAÑOS — Calendario 13 Lunas (Penco · Bío-Bío)
   Hogar y Vida Práctica > Familia y legado:
   - Botón btnCumple (🎂 Cumpleaños)
   - Agrega familiares y amistades con su fecha de nacimiento
     (el año es opcional), vínculo, nota e idea de regalo.
   - Pestañas: Próximos / Personas / Guía.
   - INTEGRACIÓN:
     · Marca 🎂 en las tarjetas del calendario (vista Luna, Mes y
       Semana) cada vez que un cumple cae en ese día.
     · Tarjeta 🎂 en la vista "Hoy" con los que cumplen hoy y los
       próximos 30 días.
     · "📅 Agendar" crea el compromiso en el día del próximo
       cumpleaños (con 🔔 aviso opcional) para que suene la
       notificación del calendario.
     · Aviso automático en statusMsg + notificación del sistema
       (si ya hay permiso) cuando alguien cumple hoy.
     · Exporta a 📓 Bitácoras / comparte por texto.
   Todo queda local y privado por usuario. 100% offline.
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
  return String(s == null ? '' : s).slice(0, n || 120);
}
function uid(p) { return (p || 'c') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
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
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted su-77e2fe">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }

/* ============ STORE ============ */
function cumStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { personas: [] };
    if (!u.cumpleanos) u.cumpleanos = { personas: [] };
    if (!Array.isArray(u.cumpleanos.personas)) u.cumpleanos.personas = [];
    return u.cumpleanos;
  } catch (e) { return { personas: [] }; }
}
function cumList() { return cumStore().personas.slice(); }

/* ============ FECHAS ============ */
function pad2(n) { return String(n).padStart(2, '0'); }
function todayKeyLocal() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
}
function mdDePersona(p) {
  // Devuelve "MM-DD" siempre; la persona puede no tener año.
  if (p.md) return p.md;
  if (p.fecha && /^\d{4}-\d{2}-\d{2}$/.test(p.fecha)) return p.fecha.slice(5);
  return null;
}
function edadQueCumple(p, anioProx) {
  if (!p.anio) return null;
  return anioProx - (+p.anio);
}
/* Próxima ocurrencia del cumple desde hoy (objeto {key, enDias}). */
function proximoCumple(p, baseKey) {
  var md = mdDePersona(p);
  if (!md) return null;
  var base = baseKey || todayKeyLocal();
  var y = +base.slice(0, 4);
  function keyDe(yy) {
    var mm = +md.slice(0, 2), dd = +md.slice(3, 5);
    if (mm === 2 && dd === 29) {
      var bisiesto = (yy % 4 === 0 && yy % 100 !== 0) || (yy % 400 === 0);
      dd = bisiesto ? 29 : 28; // en año común se celebra el 28-feb
    }
    return yy + '-' + pad2(mm) + '-' + pad2(dd);
  }
  var k1 = keyDe(y);
  if (k1 < base) return { key: keyDe(y + 1), enDias: diasEntre(base, keyDe(y + 1)), anio: y + 1 };
  return { key: k1, enDias: diasEntre(base, k1), anio: y };
}
function diasEntre(a, b) {
  try {
    var da = new Date(a + 'T12:00:00'), db = new Date(b + 'T12:00:00');
    return Math.round((db - da) / 864e5);
  } catch (e) { return 999; }
}
function fmtFechaCorta(key) {
  try {
    var p = String(key).split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12));
    return cal.fmtDate.format(d);
  } catch (e) { return key; }
}
function lunaDeFecha(key) {
  try {
    if (typeof lunaMapForKey === 'function') {
      var r = lunaMapForKey(key);
      if (r && r.luna !== 'dft') return { y: r.y, luna: r.luna, dia: r.diaN };
    }
  } catch (e) {}
  return null;
}

/* ============ AVISOS ============ */
function cumpleHoy() {
  var hoy = todayKeyLocal().slice(5);
  return cumList().filter(function (p) { return mdDePersona(p) === hoy; });
}
function avisarHoy() {
  var hoy = cumpleHoy();
  if (!hoy.length) return;
  var nombres = hoy.map(function (p) {
    var e = p.anio ? ' (' + (new Date().getFullYear() - (+p.anio)) + ' años)' : '';
    return p.nombre + e;
  }).join(' · ');
  try {
    var el = $('statusMsg');
    if (el && !el.dataset.cumHoy) {
      el.dataset.cumHoy = todayKeyLocal();
      el.textContent = '🎂 ¡Hoy es el cumpleaños de ' + nombres + '! — ver 🎂 Cumpleaños';
    }
  } catch (e) {}
  // Solo notifica si el permiso YA está concedido (no se pide sin gesto).
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && !window._cumNotificado) {
      window._cumNotificado = hoy.map(function (p) { return p.id; }).join(',');
      hoy.forEach(function (p) {
        try { new Notification('🎂 ¡Cumpleaños hoy!', { body: p.nombre + ' está de cumpleaños. ¡Que no se te pase saludar! 🎉' }); } catch (e2) {}
      });
    }
  } catch (e) {}
}

/* ============ AGENDAR EN EL CALENDARIO ============ */
function agendarCumple(id) {
  var p = cumList().filter(function (x) { return x.id === id; })[0];
  if (!p) return alert('No se encontró la persona');
  var prox = proximoCumple(p);
  if (!prox) return alert('Fecha inválida');
  var ref = null;
  try { if (typeof lunaMapForKey === 'function') ref = lunaMapForKey(prox.key); } catch (e) {}
  if (!ref || ref.luna === 'dft') {
    // Día Fuera del Tiempo u otra vista: se agenda igual si hay celda gregoriana disponible.
    return alert('Ese día (' + fmtFechaCorta(prox.key) + ') está fuera del ciclo visible. Anótalo en 📓 Notas de ese día.');
  }
  var cell = null;
  try { cell = dayCell(ref.luna, ref.diaN); } catch (e) {}
  if (!cell) return alert('No se pudo abrir ese día del calendario');
  if (!Array.isArray(cell.agenda)) cell.agenda = [];
  var edad = edadQueCumple(p, prox.anio);
  var texto = '🎂 Cumpleaños de ' + p.nombre + (edad !== null ? ' (' + edad + ' años)' : '');
  var ya = cell.agenda.some(function (a) { return String(a.text || '').indexOf('Cumpleaños de ' + p.nombre) >= 0; });
  if (ya) { alert('Ya está agendado ese cumpleaños en ' + fmtFechaCorta(prox.key)); return; }
  var doNotify = confirm('Agendar "' + texto + '" el ' + fmtFechaCorta(prox.key) + ' a las 09:00.\n\nAceptar = CON 🔔 aviso · Cancelar = sin aviso.');
  cell.agenda.push({
    id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    hour: 9, minute: 0, time: '09:00',
    text: texto, notify: doNotify, notified: false
  });
  save('Cumpleaños agendado 🎂');
  refrescarCal();
  pintarCumple();
  alert('Agendado el ' + fmtFechaCorta(prox.key) + (doNotify ? ' con 🔔 aviso' : ' (sin aviso)') + '.');
}

/* ============ DIÁLOGO ============ */
var CUM_VINCS = ['familia', 'madre', 'padre', 'hija/o', 'hermana/o', 'abuela/o', 'nieta/o', 'tía/o', 'prima/o', 'pareja', 'amistad', 'vecina/o', 'madrina/padrino', 'ahijada/o', 'otra'];
var cumEditId = null;

function cumBuild() {
  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabCumProx" class="btn btn-accent su-30e741">🎂 Próximos</button>' +
    '<button type="button" id="tabCumPers" class="btn su-30e741">👥 Personas</button>' +
    '<button type="button" id="tabCumGuia" class="btn su-30e741">📖 Guía</button></div>' +
    '<div id="cumProx"></div>' +
    '<div id="cumPers" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Agregar / editar persona</h4>' +
    '<div class="conv-row"><label>Nombre * <input type="text" id="cumNombre" placeholder="ej: María" maxlength="60"></label>' +
    '<label>Vínculo <select id="cumVinc">' + CUM_VINCS.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Fecha de nacimiento * <input type="date" id="cumFecha" aria-label="Fecha de nacimiento: día, mes y año"></label></div>' +
    '<label class="check-row"><input type="checkbox" id="cumSinAnio"> No sé el año (avisa igual cada año, sin edad)</label>' +
    '<div class="conv-row"><label>Nota <input type="text" id="cumNota" placeholder="ej: le gusta el mote con huesillo" maxlength="120"></label>' +
    '<label>🎁 Idea de regalo <input type="text" id="cumRegalo" placeholder="ej: libro, planta, minga" maxlength="120"></label></div>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="cumAdd" class="btn btn-accent su-30e741">+ Guardar</button>' +
    '<button type="button" id="cumCancelEdit" class="btn su-214f75 hidden">✕ Cancelar edición</button></div></div>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar <input type="text" id="cumQ" placeholder="nombre, vínculo..."></label></div>' +
    '<div id="cumList" class="su-bf3828"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="cumStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="cumShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="cumClear" class="btn su-214f75">🗑 Borrar todo</button></span></div></div>' +
    '<div id="cumGuia" class="hidden">' +
    '<div class="si-card"><h4>🎂 ¿Para qué sirve?</h4><p>Una sola lista con los cumpleaños de tu gente. El calendario marca <b>🎂 en cada día</b> que toque, la vista <b>Hoy</b> te avisa quién cumple, y con <b>📅 Agendar</b> creas el compromiso con 🔔 para que el aviso suene aunque no abras esta sección.</p></div>' +
    '<div class="si-card"><h4>✅ Cómo usarla</h4><p>1) En <b>👥 Personas</b> agrega nombre + fecha completa (día, mes y año). Si no sabes el año, marca «No sé el año»: igual avisa cada año, solo sin mostrar la edad. 2) Mira <b>🎂 Próximos</b> para ver quién viene en 30 días. 3) Toca <b>📅 Agendar</b> en cada persona para crear el aviso anual. 4) Repite cada año o deja el compromiso con 🔔.</p></div>' +
    '<div class="si-card"><h4>🎁 Ideas sin gastar de más</h4><p>Una comida hecha en casa, una caminata al humedal Rocuant, una carta, una minga de ayuda, semillas de tu huerta, una canción. Lo que más se recuerda es el gesto, no el precio.</p></div>' +
    '<div class="si-card"><h4>🔒 Privado</h4><p>Todo queda <b>solo en tu dispositivo y usuario</b>, 100% offline. Se respalda junto a tus notas en 📓 Bitácoras → respaldo.</p></div>' +
    '</div>';
  makeDialog('cumpleDialog', '🎂 Cumpleaños — familia y amistades',
    'Agrega una vez, celebra siempre: el calendario marca <b>🎂</b> cada cumple y te avisa quién cumple <b>hoy</b>. <b>Privado y local</b>.',
    body);
}
function cumSwitch(t) {
  ['Prox', 'Pers', 'Guia'].forEach(function (x) {
    var p = $('cum' + x), b = $('tabCum' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}

function cumRender() {
  var hoyBox = $('cumProx'); if (!hoyBox) return;
  var personas = cumList();
  var hoy = todayKeyLocal();
  var conProx = personas.map(function (p) { return { p: p, prox: proximoCumple(p, hoy) }; })
    .filter(function (x) { return x.prox; })
    .sort(function (a, b) { return a.prox.enDias - b.prox.enDias; });
  var cumplenHoy = conProx.filter(function (x) { return x.prox.enDias === 0; });
  var prox30 = conProx.filter(function (x) { return x.prox.enDias > 0 && x.prox.enDias <= 30; });
  function fila(x, destacado) {
    var p = x.p, edad = edadQueCumple(p, x.prox.anio);
    var l = null;
    try { l = lunaDeFecha(x.prox.key); } catch (e) {}
    return '<div class="hora-item"><span class="su-6cb285">🎂 <b>' + esc(p.nombre) + '</b>' +
      (edad !== null ? ' · cumple ' + edad : '') +
      ' <span class="muted">· ' + esc(fmtFechaCorta(x.prox.key)) +
      (x.prox.enDias === 0 ? ' · <b>¡HOY! 🎉</b>' : ' · en ' + x.prox.enDias + ' día(s)') +
      (l ? ' · Luna ' + l.luna + ' día ' + l.dia : '') +
      (p.vinc && p.vinc !== 'otra' ? ' · ' + esc(p.vinc) : '') +
      (p.regalo ? '<br><span class="muted su-0d5be0">🎁 ' + esc(p.regalo) + '</span>' : '') +
      '</span></span>' +
      '<span class="su-3de8f9"><button type="button" class="btn cum-agendar" data-k="' + esc(p.id) + '" title="Crear compromiso con aviso en el calendario">📅 Agendar</button> ' +
      '<button type="button" class="btn btn-icon cum-edit" data-k="' + esc(p.id) + '" title="Editar">✏️</button></span></div>';
  }
  hoyBox.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🎂 Hoy · ' + esc(hoy + ' · ' + fmtFechaCorta(hoy)) + '</h4>' +
    (cumplenHoy.length
      ? cumplenHoy.map(function (x) { return fila(x, true); }).join('')
      : '<p class="su-616df7">Hoy nadie cumple (que sepamos 🎈). Agrega a tu gente en 👥 Personas.</p>') +
    '</div>' +
    '<div class="menstrual-card"><h4>📅 Próximos 30 días (' + prox30.length + ')</h4>' +
    (prox30.length ? prox30.map(function (x) { return fila(x, false); }).join('')
      : '<p class="muted su-6cb285">Nada en 30 días. Tranquilidad… o te falta gente por anotar 😉.</p>') + '</div>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="cumGoP" class="btn su-30e741">👥 Agregar persona</button></div>';
  var gp = $('cumGoP'); if (gp) gp.onclick = function () { cumSwitch('Pers'); };
  hoyBox.querySelectorAll('.cum-agendar').forEach(function (b) { b.onclick = function () { agendarCumple(b.dataset.k); }; });
  hoyBox.querySelectorAll('.cum-edit').forEach(function (b) { b.onclick = function () { cumStartEdit(b.dataset.k); cumSwitch('Pers'); }; });

  /* ---- lista personas ---- */
  var lb = $('cumList');
  if (lb) {
    var q = (($('cumQ') || {}).value || '').toLowerCase();
    var arr = conProx.filter(function (x) {
      if (!q) return true;
      return (x.p.nombre + ' ' + (x.p.vinc || '') + ' ' + (x.p.nota || '')).toLowerCase().indexOf(q) >= 0;
    }).slice(0, 120);
    lb.innerHTML = arr.length ? arr.map(function (x) {
      var p = x.p, edad = edadQueCumple(p, x.prox.anio);
      return '<div class="hora-item"><span class="su-6cb285">👤 <b>' + esc(p.nombre) + '</b>' +
        (p.vinc ? ' · ' + esc(p.vinc) : '') +
        '<br><span class="muted su-0d5be0">🎂 ' + esc(fmtFechaCorta('2000-' + mdDePersona(p))) +
        (p.anio ? ' (nac. ' + esc(String(p.anio)) + ')' : ' (año sin registrar)') +
        ' · próximo: ' + esc(fmtFechaCorta(x.prox.key)) + (edad !== null ? ' → ' + edad + ' años' : '') +
        (x.prox.enDias === 0 ? ' · <b>¡HOY! 🎉</b>' : ' · en ' + x.prox.enDias + ' día(s)') +
        (p.nota ? '<br>📝 ' + esc(p.nota) : '') +
        (p.regalo ? '<br>🎁 ' + esc(p.regalo) : '') + '</span></span>' +
        '<span class="su-3de8f9"><button type="button" class="btn cum-agendar" data-k="' + esc(p.id) + '">📅</button> ' +
        '<button type="button" class="btn btn-icon cum-edit" data-k="' + esc(p.id) + '">✏️</button> ' +
        '<button type="button" class="btn btn-icon cum-del" data-k="' + esc(p.id) + '">✕</button></span></div>';
    }).join('') : '<p class="muted su-e201a8">Sin personas' + (personas.length ? ' para este filtro.' : '. Agrega la primera arriba 🎈.') + '</p>';
    lb.querySelectorAll('.cum-del').forEach(function (x) {
      x.onclick = function () {
        if (!confirm('¿Borrar a esta persona de tus cumpleaños?')) return;
        var s = cumStore();
        s.personas = s.personas.filter(function (r) { return r.id !== x.dataset.k; });
        save(); cumRender(); pintarCumple();
      };
    });
    lb.querySelectorAll('.cum-edit').forEach(function (x) {
      x.onclick = function () { cumStartEdit(x.dataset.k); };
    });
    lb.querySelectorAll('.cum-agendar').forEach(function (b) { b.onclick = function () { agendarCumple(b.dataset.k); }; });
    var st = $('cumStats');
    if (st) st.textContent = personas.length ? (personas.length + ' persona(s)') : '';
  }
}

function cumStartEdit(id) {
  var p = cumList().filter(function (x) { return x.id === id; })[0];
  if (!p) return;
  cumEditId = id;
  if ($('cumNombre')) $('cumNombre').value = p.nombre || '';
  if ($('cumVinc')) $('cumVinc').value = p.vinc || 'otra';
  if ($('cumFecha')) $('cumFecha').value = (p.anio || 2000) + '-' + mdDePersona(p);
  if ($('cumSinAnio')) $('cumSinAnio').checked = !p.anio;
  if ($('cumNota')) $('cumNota').value = p.nota || '';
  if ($('cumRegalo')) $('cumRegalo').value = p.regalo || '';
  var ad = $('cumAdd'); if (ad) ad.textContent = '💾 Guardar cambios';
  var ce = $('cumCancelEdit'); if (ce) ce.classList.remove('hidden');
  try { $('cumNombre').focus(); } catch (e) {}
}
function cumCancelEdit() {
  cumEditId = null;
  ['cumNombre', 'cumNota', 'cumRegalo'].forEach(function (i) { if ($(i)) $(i).value = ''; });
  if ($('cumFecha')) $('cumFecha').value = '';
  if ($('cumSinAnio')) $('cumSinAnio').checked = false;
  if ($('cumVinc')) $('cumVinc').value = 'otra';
  var ad = $('cumAdd'); if (ad) ad.textContent = '+ Guardar';
  var ce = $('cumCancelEdit'); if (ce) ce.classList.add('hidden');
}

function cumGuardar() {
  var nombre = clean((($('cumNombre') || {}).value || '').trim(), 60);
  if (!nombre) return alert('Ponle un nombre 🙂');
  var fechaRaw = (($('cumFecha') || {}).value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) return alert('Elige la fecha de nacimiento (día, mes y año)');
  var md = fechaRaw.slice(5);
  var sinAnio = !!($('cumSinAnio') && $('cumSinAnio').checked);
  var anio = sinAnio ? null : parseInt(fechaRaw.slice(0, 4), 10);
  if (!sinAnio && (isNaN(anio) || anio < 1900 || anio > 2100)) return alert('Año inválido (1900–2100) o marca «No sé el año»');
  var vinc = (($('cumVinc') || {}).value || 'otra');
  var nota = clean((($('cumNota') || {}).value || '').trim(), 120);
  var regalo = clean((($('cumRegalo') || {}).value || '').trim(), 120);
  var s = cumStore();
  if (cumEditId) {
    var ex = s.personas.filter(function (r) { return r.id === cumEditId; })[0];
    if (!ex) cumEditId = null;
    else {
      ex.nombre = nombre; ex.md = md; ex.anio = anio; ex.vinc = vinc; ex.nota = nota; ex.regalo = regalo;
      ex.fecha = anio ? (anio + '-' + md) : null;
      save('Cumpleaños actualizado 🎂');
      cumCancelEdit(); cumRender(); pintarCumple();
      return;
    }
  }
  // evita duplicados exactos
  var dup = s.personas.some(function (r) { return r.nombre.toLowerCase() === nombre.toLowerCase() && mdDePersona(r) === md; });
  if (dup && !confirm('Ya existe alguien con ese nombre y fecha. ¿Agregar igual?')) return;
  s.personas.push({ id: uid('cum'), nombre: nombre, md: md, anio: anio, fecha: anio ? (anio + '-' + md) : null, vinc: vinc, nota: nota, regalo: regalo });
  save('Cumpleaños guardado 🎂');
  cumCancelEdit(); cumRender(); pintarCumple();
}

/* ============ INTEGRACIÓN EN EL CALENDARIO ============ */
function cumPorMD(md) {
  return cumList().filter(function (p) { return mdDePersona(p) === md; });
}
/* Marca 🎂 en cada tarjeta visible cuyo MM-DD tenga cumpleaños. Idempotente. */
function pintarCumple() {
  try {
    var cards = document.querySelectorAll('.day-card[data-key]');
    if (!cards.length) return;
    cards.forEach(function (c) {
      var key = c.dataset.key;
      if (!key || key.length < 10) return;
      var md = key.slice(5);
      var personas = cumPorMD(md);
      var vieja = c.querySelector('.dc-cumple');
      if (!personas.length) { if (vieja) vieja.remove(); return; }
      var titulo = personas.map(function (p) {
        var e = p.anio ? ' (' + (new Date().getFullYear() - (+p.anio)) + ' años)' : '';
        return '🎂 ' + p.nombre + e;
      }).join(' · ');
      if (vieja) { vieja.setAttribute('title', titulo); vieja.textContent = '🎂'; return; }
      var div = document.createElement('div');
      div.className = 'dc-habits dc-cumple';
      div.setAttribute('title', titulo + ' — ver 🎂 Cumpleaños');
      div.textContent = '🎂';
      div.style.cursor = 'pointer';
      div.onclick = function (ev) { try { ev.stopPropagation(); } catch (e) {} cumRender(); cumSwitch('Prox'); openDlg('cumpleDialog'); };
      // insertar arriba, antes de efemérides/notas
      var head = c.querySelector('.dc-head');
      if (head && head.nextSibling) c.insertBefore(div, head.nextSibling);
      else c.appendChild(div);
    });
  } catch (e) {}
}
/* Rellena la tarjeta nativa 🎂 (data-home="cumple", 3ª en ◉ Hoy).
   La tarjeta la dibuja el núcleo (respeta orden y toggle); aquí solo el contenido. */
function rellenarHoyCard() {
  try {
    var body = $('todayCumpleBody');
    if (!body) return;
    var hoy = todayKeyLocal();
    var personas = cumList().map(function (p) { return { p: p, prox: proximoCumple(p, hoy) }; })
      .filter(function (x) { return x.prox; })
      .sort(function (a, b) { return a.prox.enDias - b.prox.enDias; });
    if (!personas.length) {
      body.innerHTML = '<p class="muted su-11a508">🎈 Sin personas aún. Agrega a tu familia y amistades en 🎂 Cumpleaños.</p>';
      return;
    }
    var hoyC = personas.filter(function (x) { return x.prox.enDias === 0; });
    var sem = personas.filter(function (x) { return x.prox.enDias > 0 && x.prox.enDias <= 30; });
    if (!hoyC.length && !sem.length) {
      var sig = personas[0];
      body.innerHTML = '<p class="muted su-11a508">Próximo: <b>' + esc(sig.p.nombre) + '</b> el ' +
        esc(fmtFechaCorta(sig.prox.key)) + ' (en ' + sig.prox.enDias + ' días).</p>';
      return;
    }
    var html = '';
    if (hoyC.length) {
      html += hoyC.map(function (x) {
        var e = edadQueCumple(x.p, x.prox.anio);
        return '<p class="su-6cb285">🎉 <b>¡Hoy ' + esc(x.p.nombre) + (e !== null ? ' cumple ' + e + '!' : ' está de cumple!') + '</b></p>';
      }).join('');
    }
    if (sem.length) {
      html += '<p class="muted su-11a508">Se viene: ' + sem.map(function (x) {
        return esc(x.p.nombre) + ' (' + esc(fmtFechaCorta(x.prox.key)) + ', en ' + x.prox.enDias + 'd)';
      }).join(' · ') + '</p>';
    }
    body.innerHTML = html;
  } catch (e) {}
}
/* Re-pinta tras cada render del calendario observando el DOM
   (sin reasignar funciones del núcleo: el render reconstruye #grid y
   #todayView, así los observadores bastan). */
var _cumParcheado = false;
function parcharRender() {
  if (_cumParcheado) return; _cumParcheado = true;
  try {
    var g = $('grid');
    if (g && typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function () {
        try { pintarCumple(); } catch (e) {}
        try { avisarHoy(); } catch (e2) {}
      });
      obs.observe(g, { childList: true, subtree: false });
    }
    var tv = $('todayView');
    if (tv && typeof MutationObserver !== 'undefined') {
      var obs2 = new MutationObserver(function () {
        try { rellenarHoyCard(); } catch (e) {}
      });
      obs2.observe(tv, { childList: true });
    }
  } catch (e) {}
}

/* ============ SETUP / BOTÓN ============ */
function setup() {
  try {
    var g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
    if (g && !$('btnCumple')) {
      var btn = document.createElement('button');
      btn.id = 'btnCumple'; btn.className = 'btn'; btn.type = 'button';
      btn.textContent = '🎂 Cumpleaños';
      try { btn.setAttribute('data-sub', 'familia'); } catch (eS) {}
      btn.setAttribute('data-keywords', 'cumpleaños cumpleanos birthday torta fiesta recordar aviso familiar amigo amiga hijo hija madre padre regalo celebrar');
      var ref = g.querySelector('#btnConstelaciones');
      if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
      else g.appendChild(btn);
    } else if ($('btnCumple')) {
      try { $('btnCumple').setAttribute('data-sub', 'familia'); } catch (eS2) {}
    }
  } catch (e) {}
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnCumple') < 0) ALL_BTNS.push('btnCumple'); } catch (e2) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnCumple = ['hogar', 'familia']; } catch (e3) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|familia'] && BTN_ORDER['hogar|familia'].indexOf('btnCumple') < 0) {
      BTN_ORDER['hogar|familia'].push('btnCumple');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnCumple = true; });
    }
  } catch (e5) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnCumple"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnCumple"> 🎂 Cumpleaños';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnCumple !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnCumple = lab.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e6) {}
            };
          } catch (e7) {}
        }
      });
    }
  } catch (e8) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e9) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e10) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e11) {}

  cumBuild();
  cumRender();
  parcharRender();
  pintarCumple();
  rellenarHoyCard();
  avisarHoy();

  var b = $('btnCumple');
  if (b) b.onclick = function () { cumRender(); cumSwitch('Prox'); openDlg('cumpleDialog'); };
  ['Prox', 'Pers', 'Guia'].forEach(function (t) {
    var tb = $('tabCum' + t); if (tb) tb.onclick = function () { cumSwitch(t); };
  });
  var qq = $('cumQ'); if (qq) qq.oninput = cumRender;
  var ad = $('cumAdd'); if (ad) ad.onclick = cumGuardar;
  var ce = $('cumCancelEdit'); if (ce) ce.onclick = cumCancelEdit;
  var sh = $('cumShare');
  if (sh) sh.onclick = async function () {
    var d = cumList().map(function (p) { return { p: p, prox: proximoCumple(p) }; })
      .filter(function (x) { return x.prox; })
      .sort(function (a, b) { return a.prox.enDias - b.prox.enDias; });
    if (!d.length) return alert('Sin personas aún');
    var t = '🎂 Cumpleaños (por fecha)\n' + d.map(function (x) {
      var e = edadQueCumple(x.p, x.prox.anio);
      return '• ' + x.p.nombre + ' · ' + fmtFechaCorta(x.prox.key) +
        (e !== null ? ' → ' + e + ' años' : '') +
        (x.p.vinc ? ' · ' + x.p.vinc : '') +
        (x.p.regalo ? ' · 🎁 ' + x.p.regalo : '');
    }).join('\n');
    await share('Cumpleaños', t);
  };
  var cl = $('cumClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar TODAS las personas de tus cumpleaños?')) return;
    try { var u = userData(); if (u && u.cumpleanos) u.cumpleanos.personas = []; } catch (e12) {}
    cumCancelEdit(); save(); cumRender(); pintarCumple();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

try {
  window.cal13cumple = {
    store: cumStore, list: cumList,
    proximos: function () {
      var hoy = todayKeyLocal();
      return cumList().map(function (p) { return { p: p, prox: proximoCumple(p, hoy) }; })
        .filter(function (x) { return x.prox; })
        .sort(function (a, b) { return a.prox.enDias - b.prox.enDias; });
    },
    cumpleHoy: cumpleHoy, agendar: agendarCumple, repintar: pintarCumple, rellenarHoy: rellenarHoyCard
  };
} catch (e) {}

})();
