/* ============================================================
   BOMBEROS DE PENCO — Calendario 13 Lunas
   Apartado: Territorio > 🚒 Bomberos (botón propio al lado de
     🎉 Penco y 🏛️ Municipalidad: btnBomberos -> bomberosDialog
     -> bomberosPanel).
   - Emergencia (132, cómo pedir ayuda), compañías y cuarteles,
     historia del Cuerpo (1927–hoy), prevención por ficha y
     checklist de mi hogar.
   - Cada ficha de prevención tiene "📌 Calendario": crea un
     compromiso 🕐 en el día elegido (con hora y 🔔 opcional),
     y "☑️ Hecho" para tu checklist personal.
   - "⭐ Mi hogar": checklist + notas + mantenciones propias.
   Todo local y privado por usuario: userData().bomberosPenco
     { hechos:{}, notas:{}, mios:[], avisos:[] }
   Fuente preferida: data/territorios/<id>/bomberos.json
   vía window.Territorio (ver territorio.js). Fallback: datos
   embebidos abajo (Penco, libro 1927–2023, 2026-09).
   100% offline. Sin dependencias externas.
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
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado ✓'); } catch (e) {} }
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') { renderCurrentView(); return; } } catch (e) {}
  try { if (typeof renderLuna === 'function') renderLuna(); } catch (e2) {}
}

/* ---------- DATOS EMBEBIDOS (fallback Penco) ---------- */
var BOMB_PENCO = {
  cuerpo: {
    nombre: 'Cuerpo de Bomberos de Penco',
    fundacion: '30 de noviembre de 1927 (Bomba Refinería)',
    origen: 'Operarios de la Refinería de Azúcar fundan la Bomba Refinería tras voraces incendios fabriles.',
    emergencias: '132',
    companias: 4,
    voluntarios: 'Más de un centenar en 4 compañías + brigada (urbano y rural)',
    superintendente2023: 'César Jara Torres',
    libro: 'Bomberos de Penco 1927–2023. Llamado al deber — Boris Márquez Ochoa',
    aniversario: 'Fundación 30 de noviembre; la comuna celebra el aniversario con desfile en octubre (verificar fecha del año)'
  },
  companias: [
    { id: 'primera', icon: '🚒', nombre: 'Primera Compañía — Bomba Refinería', sector: 'Penco centro', lema: 'La fundadora (1927)', d: 'Nace en la Refinería de Azúcar con una treintena de operarios-voluntarios. Primera bomba y primer cuartel de la ciudad.', notas: ['Fundación: 30-11-1927', 'Origen fabril CRAV', "Primer cuartel: Aníbal Pinto esq. O'Higgins"] },
    { id: 'segunda', icon: '🪜', nombre: 'Segunda Compañía — “Trabajo y Constancia”', sector: 'Penco', lema: 'Trabajo y Constancia', d: 'La del estandarte regalado, la cotona azul y el primer carro portaescala de Penco. Tradición de mujeres bomberas segundinas.', notas: ['Uniforme: cotona azul', 'Primer portaescala de Penco', 'Mujeres bomberas, tradición segundina'] },
    { id: 'tercera', icon: '⚓', nombre: 'Tercera Compañía — Lirquén', sector: 'Lirquén', lema: 'Nuestro único enemigo es el fuego', d: 'La compañía del puerto: largo camino por un cuartel propio y guardias históricas en faenas de petróleo.', notas: ['Sector portuario e industrial', 'Guardias en faenas de petróleo', 'Material mayor de última generación'] },
    { id: 'cuarta', icon: '⛰️', nombre: 'Cuarta Compañía — Cosmito', sector: 'Cosmito / Ruta 150', lema: 'Unión y Lealtad', d: 'Obra de bien vecinal: el sacrificado camino de un cuartel en Cosmito, puerta sur de la comuna y zona de interfaz forestal.', notas: ['Sector sur / interfaz forestal', 'Cuartel levantado por vecinos y voluntarios'] }
  ],
  historia: {
    intro: 'De la Bomba Refinería de 1927 al Cuerpo de 4 compañías que cubre Penco, Lirquén, Cosmito y el campo: casi un siglo de voluntariado.',
    eras: [
      { t: '🔥 Bomba Refinería', cuando: '30 de noviembre de 1927', d: 'Voraces incendios en la zona fabril obligan a los operarios a organizarse: nace la Bomba Refinería con una treintena de fundadores.' },
      { t: '🚒 Segunda y expansión', cuando: '1928–1960', d: 'Se suman compañías (Segunda “Trabajo y Constancia”), llega el primer carro portaescala, se consiguen cuarteles y nace la romería y el funeral nocturno.' },
      { t: '🏭 Terremotos y temporales', cuando: '1939 · 1945 · 1960', d: 'Chillán 1939, el temporal de 1945 y Valdivia 1960: rescate, escombros e incendios en cada catástrofe.' },
      { t: '⚓ Tercera de Lirquén', cuando: 'Siglo XX', d: 'El puerto exige su compañía: guardias en faenas de petróleo y el largo camino por un cuartel propio.' },
      { t: '⛰️ Cuarta de Cosmito', cuando: 'Siglo XX–XXI', d: 'Los vecinos del acceso sur levantan la Cuarta “Unión y Lealtad”, clave en incendios de interfaz forestal.' },
      { t: '🌊 27F', cuando: '27 de febrero de 2010', d: 'Terremoto y tsunami: rescate en el borde costero, caletas y poblaciones.' },
      { t: '📖 Llamado al deber', cuando: '2023', d: 'El Cuerpo publica su historia (1927–2023) con Boris Márquez Ochoa.' },
      { t: '🌲 Incendios forestales', cuando: 'Enero 2026', d: 'Los incendios alcanzan Penco y Lirquén con daño mayor. La prevención de interfaz pasa a ser prioridad comunal N°1.' }
    ]
  },
  llamar132: {
    titulo: 'Cómo pedir ayuda al 132',
    pasos: ['1. Marca 132 (gratis, sin saldo). Si no hay respuesta, 131 SAMU o *4157 Seguridad Penco.', '2. Di: comuna PENCO, calle y número, intersección y referencia.', '3. Di qué se quema y si hay personas o mascotas atrapadas.', '4. No cuelgues primero. Deja a alguien en la esquina esperando el carro.', '5. Abre el portón, corta el gas si puedes sin riesgo y saca autos del pasaje.'],
    noHacer: ['No vuelvas a entrar por documentos o mascotas: avisa a bomberos dónde están.', 'No mojes un incendio eléctrico o de aceite con agua.', 'No tapes la pasada con autos mirones: los carros necesitan 3,5 m libres.']
  },
  prevencion: [
    { id: 'detector-humo', icon: '🚨', nombre: 'Detector de humo por piso', donde: 'Pasillo de dormitorios + living', cuando: 'Probar 1 vez al mes · cambio pila anual', requisitos: ['1 detector por piso (ideal interconectados)', 'Probar botón el día 1 de cada mes', 'Cambiar pila 1 vez al año'], costo: 'Desde ~$8.000 c/u', tip: 'El humo mata durmiendo: el detector despierta antes que el fuego bloquee la salida.' },
    { id: 'extintor-cocina', icon: '🧯', nombre: 'Extintor vigente en cocina', donde: 'Cocina, cerca de la salida (no sobre la cocina)', cuando: 'Revisar manómetro cada 6 meses · recarga anual/vencimiento', requisitos: ['PQS 5–6 kg multipropósito (ABC)', 'Manómetro en verde, sello y manguera sanos', 'Toda la familia sabe usarlo: P.A.S.S.'], costo: 'Recarga ~$15.000–25.000', tip: 'P.A.S.S.: Pasador, Apunta a la base, Suelta, barre de lado a lado.' },
    { id: 'red-gas', icon: '🔥', nombre: 'Cocina, gas y estufa a leña', donde: 'Cocina y living', cuando: 'Revisión antes de cada invierno', requisitos: ['Flexible de gas sin grietas + abrazaderas', 'Cañón de estufa limpio (deshollinar anual)', 'Nada combustible a 1 m de la estufa'], costo: 'Deshollinado ~$30.000–50.000', tip: 'El hollín del cañón es la causa N°1 de incendios de invierno en el sur.' },
    { id: 'red-electrica', icon: '🔌', nombre: 'Red eléctrica sin sobrecarga', donde: 'Toda la casa', cuando: 'Revisión anual + cada vez que salta el automático', requisitos: ['Sin zapatillas en cadena ni alargadores enrollados', 'Cargadores originales, no de noche en la cama', 'Tablero con automáticos y diferencial'], costo: 'Revisión eléctrico autorizado', tip: 'Si un enchufe calienta o huele a quemado, corta ese circuito.' },
    { id: 'plan-escape', icon: '🚪', nombre: 'Plan de escape familiar', donde: 'Toda la casa', cuando: 'Practicar 2 veces al año con toda la familia', requisitos: ['2 salidas por pieza (puerta + ventana)', 'Punto de encuentro fuera', 'Niños saben abrir seguros y llamar 132'], costo: 'Gratuito', tip: 'Practíquenlo de noche: los incendios graves ocurren durmiendo.' },
    { id: 'interfaz-forestal', icon: '🌲', nombre: 'Casa en interfaz forestal', donde: 'Perímetro de la casa (30 m)', cuando: 'Limpieza antes de cada verano (oct–nov)', requisitos: ['Techo y canaletas sin hojas ni pinocha', 'Pila de leña a 10+ m de la casa', 'Manguera de 20+ m siempre conectada'], costo: 'Solo trabajo', tip: 'Enero 2026 lo demostró: la casa defendible se salva.' },
    { id: 'grifo-libre', icon: '🚰', nombre: 'Grifo y pasada libres', donde: 'Tu cuadra', cuando: 'Ojo permanente', requisitos: ['No estacionar sobre ni frente al grifo', 'Pasajes con 3,5 m libres para el carro', 'Reportar grifo malo a Essbio / *4157'], costo: 'Gratuito', tip: 'Un auto frente al grifo puede costar una casa.' }
  ],
  voluntariado: {
    titulo: '¿Quieres ser bombero/a?',
    texto: 'Bomberos de Chile es 100% voluntario. Acércate al cuartel de tu sector (Penco, Lirquén o Cosmito), pregunta por la Brigada Juvenil o el proceso de postulación de la compañía.',
    aporte: 'Si no puedes ser voluntario: coopera en colectas, cuida grifos y pasadas, y dona sangre cuando la compañía la pida.'
  },
  fuentes: 'Bomberos de Penco 1927–2023. Llamado al deber (Boris Márquez Ochoa, Archivo Histórico de Concepción) · memoria compañías. Verifica cuarteles y fechas en el Cuerpo y en penco.cl.',
  actualizado: '2026-09'
};

function dynBomb() {
  try {
    var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.bomberos;
    if (d && d.cuerpo) return d;
  } catch (e) {}
  return BOMB_PENCO;
}

/* ---------- estado personal ---------- */
var tabBomb = 'eme';
var bombQuery = '';
function storeBomb() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { hechos: {}, notas: {}, mios: [], avisos: [] };
    if (!u.bomberosPenco) u.bomberosPenco = { hechos: {}, notas: {}, mios: [], avisos: [] };
    var r = u.bomberosPenco;
    if (!r.hechos || typeof r.hechos !== 'object') r.hechos = {};
    if (!r.notas || typeof r.notas !== 'object') r.notas = {};
    if (!Array.isArray(r.mios)) r.mios = [];
    if (!Array.isArray(r.avisos)) r.avisos = [];
    return r;
  } catch (e) { return { hechos: {}, notas: {}, mios: [], avisos: [] }; }
}

/* ---------- llevar al calendario ---------- */
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
function llevarAlCalendario(nombre, detalle, fechaVal, horaVal, conAviso) {
  var fecha = (fechaVal || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert('Elige una fecha válida.'); return; }
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : '10:00';
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[Bomberos] ' + nombre + (detalle ? ' · ' + detalle : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      var linea = '[Bomberos Penco] ' + texto + ' ' + hhmm;
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + linea : linea;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) {
      try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {}
    }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  try {
    var st = storeBomb();
    st.avisos.push({ id: uid('bav'), nombre: nombre, detalle: detalle || '', fecha: fecha, hora: hhmm, notify: !!conAviso, creado: todayKey() });
  } catch (e) {}
  save('📌 Agregado al calendario ✓');
  refrescarCal();
  try { render(); } catch (e2) {}
}

/* ---------- esqueleto (diálogo propio bomberosDialog) ---------- */
function asegurarPanel() {
  var panel = $('bomberosPanel');
  if (!panel) return null;
  if (!panel.dataset.bombOk) {
    panel.dataset.bombOk = '1';
    panel.innerHTML =
      '<p class="muted" style="font-size:11px;line-height:1.55">El <b>Cuerpo de Bomberos de Penco</b>: cómo pedir ayuda al <b>132</b>, sus 4 compañías, su historia desde 1927 y cómo dejar tu casa a prueba de fuego. Marca tu avance en <b>⭐ Mi hogar</b> y agenda mantenciones con <b>📌</b>. Todo queda <b>privado y local</b>.</p>' +
      '<div class="timer-tabs" style="margin:8px 0 10px;flex-wrap:wrap">' +
      '<button type="button" id="tabBombEme" class="btn btn-accent" style="width:auto">🚨 Emergencia</button>' +
      '<button type="button" id="tabBombCias" class="btn" style="width:auto">🚒 Compañías</button>' +
      '<button type="button" id="tabBombHist" class="btn" style="width:auto">📜 Historia</button>' +
      '<button type="button" id="tabBombPrev" class="btn" style="width:auto">🧯 Prevención</button>' +
      '<button type="button" id="tabBombMios" class="btn" style="width:auto">⭐ Mi hogar</button>' +
      '</div>' +
      '<div class="menstrual-card" style="margin-top:0"><h4>🔍 Buscar en Bomberos</h4>' +
      '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="bombSearch" placeholder="ej: 132, extintor, Lirquén, detector, 1927..." maxlength="60" autocomplete="off"></label></div></div>' +
      '<div id="bombBody" style="margin-top:10px"></div>';
    var map = { tabBombEme: 'eme', tabBombCias: 'cias', tabBombHist: 'hist', tabBombPrev: 'prev', tabBombMios: 'mios' };
    Object.keys(map).forEach(function (id) {
      var b = $(id);
      if (b) b.onclick = function () { tabBomb = map[id]; render(); };
    });
    var q = $('bombSearch');
    if (q) q.addEventListener('input', function () { bombQuery = q.value; renderBody(); });
  }
  return panel;
}

function matchQ() {
  var q = (bombQuery || '').toLowerCase().trim();
  if (!q) return null;
  return q;
}

/* ---------- renders por pestaña ---------- */
function renderEmergencia(d) {
  var c = d.cuerpo, l = d.llamar132;
  var html = '<div class="menstrual-card" style="border-color:#ff6b6b"><h4 style="color:#ff6b6b">🚨 Emergencia de incendio — llama al 132</h4>' +
    '<p style="font-size:13px;line-height:1.6">📞 <b style="font-size:18px">132</b> <span class="muted" style="font-size:11px">(gratis, sin saldo · Bomberos de Chile 24 h)</span><br>' +
    '<span class="muted" style="font-size:11px">Si no hay respuesta: 131 SAMU · *4157 Seguridad Penco</span></p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn" data-bomb-tel="132" style="width:auto;font-size:11px">📋 Copiar 132</button>' +
    '<button type="button" class="btn" data-bomb-share132 style="width:auto;font-size:11px">📤 Compartir cómo pedir ayuda</button></div></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>📢 ' + esc(l.titulo) + '</h4>' +
    '<ol style="font-size:11px;line-height:1.6;margin:4px 0 4px 18px">' + l.pasos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
    '<p style="font-size:12px;margin-top:6px"><b>⛔ Lo que NO hay que hacer:</b></p>' +
    '<ul style="font-size:11px;line-height:1.6;margin:2px 0 2px 18px">' + l.noHacer.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>🚒 ' + esc(c.nombre) + '</h4>' +
    '<p style="font-size:12px;line-height:1.6">Fundado el <b>' + esc(c.fundacion) + '</b><br><span class="muted" style="font-size:11px">' + esc(c.origen) + '</span></p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<span class="chip">🚒 ' + esc(String(c.companias)) + ' compañías</span>' +
    '<span class="chip">👨‍🚒 ' + esc(c.voluntarios) + '</span></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">📖 ' + esc(c.libro) + '</p></div>';
  return html;
}

function renderCias(d) {
  var q = matchQ();
  var list = (d.companias || []).slice();
  if (q) list = list.filter(function (x) {
    return ((x.nombre || '') + ' ' + (x.sector || '') + ' ' + (x.lema || '') + ' ' + (x.d || '') + ' ' + (x.notas || []).join(' ')).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🚒 Compañías · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:11px">Más de un centenar de voluntarios en 4 compañías + brigada, cubriendo todo el territorio urbano y rural. Superintendente (2023): <b>' + esc(d.cuerpo.superintendente2023) + '</b>.</p></div>';
  if (!list.length) return html + '<p class="muted">Sin resultados.</p>';
  html += list.map(function (x) {
    return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + esc(x.icon || '🚒') + ' ' + esc(x.nombre) + '</h4>' +
      '<p class="muted" style="font-size:11px">📍 ' + esc(x.sector) + ' · 💬 “' + esc(x.lema) + '”</p>' +
      '<p style="font-size:11px">' + esc(x.d) + '</p>' +
      (x.notas && x.notas.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">' + x.notas.map(function (n) { return '<span class="chip" style="font-size:10px">' + esc(n) + '</span>'; }).join('') + '</div>' : '') + '</div>';
  }).join('');
  var v = d.voluntariado;
  if (v && (!q || 'voluntario brigada postular'.indexOf(q) >= 0)) {
    html += '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>👨‍🚒 ' + esc(v.titulo) + '</h4>' +
      '<p style="font-size:11px;line-height:1.55">' + esc(v.texto) + '</p>' +
      '<p class="muted" style="font-size:11px">💡 ' + esc(v.aporte) + '</p></div>';
  }
  return html;
}

function renderHistoria(d) {
  var h = d.historia;
  if (!h || !h.eras) return '<p class="muted">Historia bomberil en preparación.</p>';
  var q = matchQ();
  var eras = h.eras.slice();
  if (q) eras = eras.filter(function (e) {
    return ((e.t || '') + ' ' + (e.cuando || '') + ' ' + (e.d || '')).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<p class="muted" style="font-size:11px;line-height:1.55">' + h.intro + '</p>';
  html += eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + esc(e.cuando) + '</p>' +
      '<p style="font-size:12px;line-height:1.55">' + esc(e.d) + '</p></div>';
  }).join('');
  html += '<p class="muted" style="font-size:10px;margin-top:8px">Fuentes: ' + esc(d.fuentes || '') + '</p>';
  return html;
}

function fichaCard(t) {
  var st = storeBomb();
  var hecho = !!st.hechos[t.id];
  var nota = st.notas[t.id] || '';
  var html = '<div class="si-card" style="padding:10px 12px;border-color:#d4af3766' + (hecho ? ';opacity:.85' : '') + '">' +
    '<h4 style="font-size:13px">' + (hecho ? '✅ ' : esc(t.icon || '🧯') + ' ') + esc(t.nombre) + '</h4>' +
    '<p class="muted" style="font-size:11px;line-height:1.6">📍 ' + esc(t.donde) + '<br>🗓️ ' + esc(t.cuando) + ' · 💰 ' + esc(t.costo || 'Consultar') + '</p>' +
    '<p style="font-size:12px"><b>Revisar:</b></p><ul style="font-size:11px;margin:2px 0 6px 18px;line-height:1.5">' +
    (t.requisitos || []).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' +
    (t.tip ? '<p class="muted" style="font-size:11px">💡 ' + esc(t.tip) + '</p>' : '') +
    '<label style="font-size:11px">📝 Mi nota <input type="text" data-bomb-nota="' + esc(t.id) + '" placeholder="ej: extintor vence 03/27, pila cambiada..." maxlength="80" value="' + esc(nota) + '"></label>' +
    '<div class="conv-row" style="align-items:flex-end;margin-top:6px">' +
    '<label>Fecha <input type="date" data-bomb-fecha="' + esc(t.id) + '" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" data-bomb-hora="' + esc(t.id) + '" value="10:00" style="max-width:110px"></label>' +
    '<label class="check-row" style="margin:0;white-space:nowrap"><input type="checkbox" data-bomb-aviso="' + esc(t.id) + '"> 🔔</label>' +
    '<button type="button" class="btn btn-accent" data-bomb-add="' + esc(t.id) + '" style="width:auto">📌 Calendario</button>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn" data-bomb-hecho="' + esc(t.id) + '" style="width:auto;font-size:11px">' + (hecho ? '↩️ Reabrir' : '☑️ Marcar hecho') + '</button>' +
    '<button type="button" class="btn" data-bomb-share="' + esc(t.id) + '" style="width:auto;font-size:11px">📤 Compartir</button></div></div>';
  return html;
}

function renderPrev(d) {
  var q = matchQ();
  var base = (d.prevencion || []).slice();
  var mios = storeBomb().mios.map(function (t) { t._mio = true; return t; });
  var list = base.concat(mios);
  if (q) list = list.filter(function (t) {
    return ((t.nombre || '') + ' ' + (t.donde || '') + ' ' + (t.cuando || '') + ' ' + ((t.requisitos || []).join(' '))).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧯 Prevención en casa · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:11px">Agenda cada mantención con <b>📌 Calendario</b> (queda como compromiso 🕐 en tu día) y marca <b>☑️ Hecho</b> al hacerla. Tu nota queda privada.</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>➕ Agregar mi mantención</h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre * <input type="text" id="bombMioNombre" placeholder="ej: Deshollinar estufa" maxlength="60"></label>' +
    '<label>Dónde <input type="text" id="bombMioDonde" placeholder="ej: living" maxlength="50"></label></div>' +
    '<label>Detalle <input type="text" id="bombMioReq" placeholder="qué revisar, técnico, fecha..." maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="bombMioAdd" class="btn btn-accent" style="width:auto">+ Guardar mantención</button></div></div>';
  html += list.length ? list.map(fichaCard).join('') : '<p class="muted">Sin resultados.</p>';
  return html;
}

function renderMios(d) {
  var st = storeBomb();
  var hechos = (d.prevencion || []).filter(function (t) { return st.hechos[t.id]; });
  var avisos = st.avisos.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⭐ Mi hogar · ' + hechos.length + ' hechos · ' + avisos.length + ' en calendario · ' + st.mios.length + ' propios</h4>' +
    '<p class="muted" style="font-size:11px">Tus mantenciones ya están como compromisos 🕐 en tu calendario. Aquí las ves todas juntas.</p>';
  if (hechos.length) {
    html += '<p class="muted" style="font-size:11px">✅ Hechos:</p>' + hechos.map(function (t) {
      return '<div class="chip" style="display:block;margin-top:4px">✅ <b>' + esc(t.nombre) + '</b>' + (st.notas[t.id] ? ' · ' + esc(st.notas[t.id]) : '') + '</div>';
    }).join('');
  } else {
    html += '<p class="muted" style="font-size:11px">Aún no marcas hechos. Ve a 🧯 Prevención y pulsa ☑️.</p>';
  }
  if (avisos.length) {
    html += '<div style="margin-top:8px">' + avisos.map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(r.nombre) + '</b><br><span class="muted" style="font-size:11px">📅 ' + esc(r.fecha) + ' · 🕐 ' + esc(r.hora) + (r.notify ? ' · 🔔' : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
        '<button type="button" class="btn" data-bomb-avdel="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div>';
    }).join('') + '</div>';
  }
  if (st.mios.length) {
    html += '<p class="muted" style="font-size:11px;margin-top:8px">📌 Mis mantenciones propias:</p>' + st.mios.map(function (t) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(t.icon || '📌') + ' ' + esc(t.nombre) + '</b>' + (st.hechos[t.id] ? ' ✅' : '') + '<br><span class="muted" style="font-size:11px">' + esc(t.donde || '') + '</span></span>' +
        '<span style="display:flex;gap:6px"><button type="button" class="btn" data-bomb-hecho="' + esc(t.id) + '" style="width:auto;font-size:11px">☑️</button>' +
        '<button type="button" class="btn" data-bomb-miodel="' + esc(t.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
    }).join('');
  }
  html += '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" id="bombShareAll" class="btn" style="width:auto">📤 Compartir mi lista</button>' +
    '<button type="button" id="bombClearAll" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar lista</button></div></div>';
  return html;
}

/* ---------- body + binds ---------- */
function renderBody() {
  var body = $('bombBody');
  if (!body) return;
  var d = dynBomb();
  var html = '';
  if (tabBomb === 'eme') html = renderEmergencia(d);
  else if (tabBomb === 'cias') html = renderCias(d);
  else if (tabBomb === 'hist') html = renderHistoria(d);
  else if (tabBomb === 'prev') html = renderPrev(d);
  else html = renderMios(d);
  body.innerHTML = html;
  bindBody(body, d);
}

function porFicha(id) {
  var d = dynBomb();
  var all = (d.prevencion || []).concat(storeBomb().mios || []);
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

function bindBody(scope, d) {
  if (!scope) return;
  scope.querySelectorAll('[data-bomb-tel]').forEach(function (b) {
    b.onclick = function () {
      var n = b.getAttribute('data-bomb-tel');
      try { if (navigator.clipboard) navigator.clipboard.writeText(n).then(function () { save('Número copiado ✓'); }); } catch (e) {}
    };
  });
  var sh132 = scope.querySelector('[data-bomb-share132]');
  if (sh132) sh132.onclick = function () {
    var l = dynBomb().llamar132;
    var txt = '🚨 Cómo pedir ayuda al 132 (Bomberos Penco)\n' + l.pasos.join('\n') + '\n⛔ ' + l.noHacer.join('\n');
    try {
      if (navigator.share) { navigator.share({ title: 'Cómo pedir ayuda al 132', text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
  scope.querySelectorAll('[data-bomb-nota]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var st = storeBomb();
      st.notas[inp.getAttribute('data-bomb-nota')] = clean(inp.value, 80);
      save('Nota guardada ✓');
    });
  });
  scope.querySelectorAll('[data-bomb-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-bomb-add');
      var t = porFicha(id);
      if (!t) return;
      var f = (scope.querySelector('[data-bomb-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (scope.querySelector('[data-bomb-hora="' + id + '"]') || {}).value || '10:00';
      var av = !!(scope.querySelector('[data-bomb-aviso="' + id + '"]') || {}).checked;
      llevarAlCalendario(t.nombre, t.donde, f, h, av);
    };
  });
  scope.querySelectorAll('[data-bomb-hecho]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-bomb-hecho');
      var st = storeBomb();
      if (st.hechos[id]) delete st.hechos[id]; else st.hechos[id] = todayKey();
      save(st.hechos[id] ? 'Mantención hecha ✅' : 'Reabierta');
      render();
    };
  });
  scope.querySelectorAll('[data-bomb-share]').forEach(function (b) {
    b.onclick = function () {
      var t = porFicha(b.getAttribute('data-bomb-share'));
      if (!t) return;
      var txt = (t.icon || '🧯') + ' ' + t.nombre + '\n📍 ' + (t.donde || '') + '\n🗓️ ' + (t.cuando || '') + '\n• ' + ((t.requisitos || []).join('\n• ')) + '\n💰 ' + (t.costo || '');
      try {
        if (navigator.share) { navigator.share({ title: t.nombre + ' — Bomberos Penco', text: txt }).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(t.nombre + ' — Bomberos Penco\n' + txt).then(function () { save('Compartido ✓'); });
      } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-bomb-avdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Quitar de Mi hogar? (El compromiso del día se conserva)')) return;
      var st = storeBomb();
      st.avisos = st.avisos.filter(function (x) { return x.id !== b.getAttribute('data-bomb-avdel'); });
      save('Quitado'); render();
    };
  });
  scope.querySelectorAll('[data-bomb-miodel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta mantención propia?')) return;
      var st = storeBomb();
      st.mios = st.mios.filter(function (x) { return x.id !== b.getAttribute('data-bomb-miodel'); });
      save('Borrada'); render();
    };
  });
  var sh = $('bombShareAll');
  if (sh) sh.onclick = function () {
    var st = storeBomb();
    var txt = '🚒 Mi hogar a prueba de fuego (Bomberos Penco)\n✅ Hechos: ' + Object.keys(st.hechos).length + '\n' +
      st.avisos.map(function (r) { return '• ' + r.fecha + ' ' + r.hora + ' — ' + r.nombre; }).join('\n');
    try {
      if (navigator.share) { navigator.share({ title: 'Mi hogar — Bomberos Penco', text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
  var cl = $('bombClearAll');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar hechos, avisos y propios? (Los compromisos del calendario se conservan)')) return;
    var st = storeBomb();
    st.hechos = {}; st.avisos = []; st.mios = []; st.notas = {};
    save('Lista borrada'); render();
  };
  var add = $('bombMioAdd');
  if (add) add.onclick = function () {
    var nombre = clean(($('bombMioNombre') || {}).value, 60).trim();
    if (!nombre) { alert('Ponle nombre a tu mantención'); return; }
    var rec = {
      id: uid('bom'), icon: '📌', nombre: nombre,
      donde: clean(($('bombMioDonde') || {}).value, 50) || 'Mi casa',
      cuando: 'Mi fecha', costo: 'Consultar',
      requisitos: [clean(($('bombMioReq') || {}).value, 120) || 'Ver detalle con la compañía'],
      tip: ''
    };
    storeBomb().mios.push(rec);
    save('Mantención guardada 📌');
    render();
  };
}

function render() {
  var panel = asegurarPanel();
  if (!panel) return;
  var tabs = { eme: $('tabBombEme'), cias: $('tabBombCias'), hist: $('tabBombHist'), prev: $('tabBombPrev'), mios: $('tabBombMios') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', tabBomb === k); });
  var q2 = $('bombSearch');
  if (q2 && q2.value !== bombQuery && document.activeElement !== q2) q2.value = bombQuery;
  renderBody();
}

function openBomberos() {
  try { render(); } catch (e) {}
  try {
    var dlg = $('bomberosDialog');
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    else if (dlg) dlg.setAttribute('open', '');
  } catch (e2) {}
}

function setup() {
  if (!$('bomberosPanel') && !$('bomberosDialog')) {
    window._bombRetry = (window._bombRetry || 0) + 1;
    if (window._bombRetry < 60) setTimeout(setup, 500);
    return;
  }
  try {
    var b = $('btnBomberos');
    if (b && !b.dataset.bombW) { b.dataset.bombW = '1'; b.addEventListener('click', openBomberos); }
  } catch (e) {}
  try {
    var c1 = $('bomberosCloseTop'), c2 = $('bomberosClose');
    if (c1 && !c1.dataset.w) { c1.dataset.w = '1'; c1.onclick = function () { try { $('bomberosDialog').close(); } catch (e) {} }; }
    if (c2 && !c2.dataset.w) { c2.dataset.w = '1'; c2.onclick = function () { try { $('bomberosDialog').close(); } catch (e) {} }; }
  } catch (e3) {}
}

window.BomberosPenco = { render: render, open: openBomberos, tab: function (t) { tabBomb = t || tabBomb; render(); }, datos: function () { return dynBomb(); }, llevarAlCalendario: llevarAlCalendario };
try {
  Object.defineProperty(window.BomberosPenco, 'data', { get: dynBomb });
} catch (e) { window.BomberosPenco.data = BOMB_PENCO; }
try { document.addEventListener('territorio:listo', function () { try { render(); } catch (e) {} }); } catch (e2) {}
setTimeout(setup, 600);
setTimeout(setup, 1800);

})();
