/* ============================================================
   GRABOVOI — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnGrabovoi (grupo Linaje > Interior, tras btnSilva)
   - Dialogo grabovoiDialog con 6 pestanas:
     1) Guia (quien fue Grabovoi, que son las secuencias,
        como se practica el pilotaje, esfera, lectura por
        digitos, luna y concentracion, cuidados y contexto)
     2) Secuencias (catalogo ~36 + buscador por tema +
        detalle + favorita + "pilotar esta ahora" + voz)
     3) Pilotaje (practica guiada: elige intencion +
        secuencia + contador + temporizador + respiracion +
        guardar sesion con antes/despues)
     4) Intenciones (inventario: que pilotar, intensidad,
        estado pendiente/en proceso/armonizado)
     5) Sesiones (historial, compartir, llevar a nota del dia)
     6) Mi avance (racha, totales, barra, por secuencia,
        por luna, ritmo sugerido)
   - Todo local y privado por usuario:
     userData().grabovoi = { inten:[], ses:[], total:0, fav:'741' }
   - Puentes: Metodos (topic grabovoi -> boton abrir),
     Ho'oponopono (limpiar antes de pilotar),
     Metodo Silva (entrar a alfa antes),
     Respiracion (calma), Gratitud (cierre).
   - Educativo y de concentracion/meditacion. NO es terapia
     ni promesa medica o economica. 100% offline.
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
  return String(s == null ? '' : s).slice(0, n || 300);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function lunaTxt(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  return '';
}
function blank() { return { inten: [], ses: [], total: 0, fav: '741' }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.grabovoi) u.grabovoi = blank();
    var e = u.grabovoi;
    // compat: versiones previas u otros nombres
    if (!Array.isArray(e.inten)) e.inten = Array.isArray(e.sit) ? e.sit : (Array.isArray(e.prog) ? e.prog : []);
    if (!Array.isArray(e.ses)) e.ses = [];
    if (typeof e.total !== 'number') e.total = 0;
    if (typeof e.fav !== 'string' || !e.fav) e.fav = '741';
    return e;
  } catch (e2) { return blank(); }
}
function persistStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (u) u.grabovoi = store();
  } catch (e) {}
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
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
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { stopTimer(true); } catch (x) {} try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function switchTab(name) {
  ['Guia', 'Sec', 'Pil', 'Int', 'Ses', 'Ava'].forEach(function (t) {
    var p = $('gb' + t), b = $('tabGb' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return alert('Audio no disponible en este dispositivo');
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch (e) { try { alert('Audio no disponible'); } catch (e2) {} }
}
function seqSpoken(seq) {
  return String(seq || '').replace(/-/g, ' ').split('').map(function (c) {
    if (c === ' ') return '... ';
    if (/[0-9]/.test(c)) return c + '. ';
    return '';
  }).join(' ');
}

/* ============================================================
   DATOS — catalogo de secuencias de uso popular
   Recopilacion de libros y redes: las versiones varian segun
   la fuente. Se presentan como FOCO de concentracion y
   meditacion, no como tratamiento ni garantia de resultado.
   ============================================================ */
var GB_CATS = [
  { id: 'todas', n: '🌌 Todas' },
  { id: 'armonia', n: '☯️ Armonía del día' },
  { id: 'calma', n: '🌙 Calma y descanso' },
  { id: 'cuerpo', n: '💚 Cuerpo y energía' },
  { id: 'amor', n: '💗 Amor y vínculos' },
  { id: 'abundancia', n: '🌾 Trabajo y abundancia' },
  { id: 'hogar', n: '🏡 Hogar y viajes' }
];
var GB_SEQS = [
  { id: '741', seq: '741', n: 'Despeje y solución', cat: 'armonia', uso: 'Cuando algo se traba: respira y concentra 3–5 min dígito por dígito.', como: 'Mira el 741, lee “siete, cuatro, uno” lento 7 veces. Imagina que el nudo se suelta.' },
  { id: '318798', seq: '318 798', n: 'El día fluye en norma', cat: 'armonia', uso: 'Foco de la mañana: ordenar el día antes de partir.', como: 'Repite por bloques “tres uno ocho… siete nueve ocho” 3 rondas mirando tu agenda.' },
  { id: '1888948', seq: '188 8948', n: 'Paz interior', cat: 'armonia', uso: 'Irritabilidad, ruido mental, discusiones. Volver al centro.', como: 'Mano al pecho, 4 respiraciones y repite suave 5 min.' },
  { id: '71931', seq: '719 31', n: 'Protección del día', cat: 'armonia', uso: 'Salir de casa, trámites, reuniones tensas. Foco de resguardo.', como: 'Visualiza una esfera plateada a tu alrededor mientras lees los dígitos.' },
  { id: '71042', seq: '71042', n: 'Calma rápida', cat: 'calma', uso: 'Ansiedad puntual, susto, enojo. Primer auxilio de respiración.', como: 'Exhala largo y lee “siete uno cero cuatro dos” al ritmo del aire, 7 veces.' },
  { id: '4781488', seq: '478 1488', n: 'Soltar la tensión', cat: 'calma', uso: 'Hombros duros, mandíbula apretada, mente acelerada.', como: 'Recorre tu cuerpo de arriba abajo repitiendo la secuencia en silencio.' },
  { id: '511516319081', seq: '511 516 319 081', n: 'Dormir mejor', cat: 'calma', uso: 'Ritual nocturno: apagar pantallas y aquietar la mente.', como: 'En cama, a oscuras, repite bloque por bloque hasta bostezar. Sin exigencia.' },
  { id: '5197148', seq: '519 7148', n: 'Mente clara', cat: 'calma', uso: 'Antes de estudiar, rendir o decidir. Enfoque breve.', como: '3 respiraciones + 21 repeticiones mirando un punto fijo.' },
  { id: '14854232190', seq: '148 542 321 90', n: 'Energía vital del día', cat: 'cuerpo', uso: 'Cansancio, mañanas pesadas, cambio de estación.', como: 'De pie, estira brazos y lee la secuencia en voz alta 3 veces.' },
  { id: '918794818', seq: '918 794 818', n: 'Cabeza liviana', cat: 'cuerpo', uso: 'Dolor de cabeza tensional por pantalla o estrés. Foco + agua + pausa.', como: 'Cierra ojos, afloja cuello y repite 10 min. Si persiste, consulta profesional.' },
  { id: '4812412', seq: '481 2412', n: 'Espalda y postura', cat: 'cuerpo', uso: 'Molestia lumbar por estar sentado. Foco + estiramiento.', como: 'Camina 2 min, estira y concentra en la zona mientras repites.' },
  { id: '8144567', seq: '814 4567', n: 'Digestión tranquila', cat: 'cuerpo', uso: 'Pesadez después de comer. Foco + caminata suave.', como: 'Mano al vientre, respira lento y repite 5 min.' },
  { id: '18543121', seq: '185 43121', n: 'Defensas y abrigo', cat: 'cuerpo', uso: 'Cambio de clima en Penco, frío y humedad. Foco de cuidado.', como: 'Abrígate, toma algo tibio y repite visualizando calor en el pecho.' },
  { id: '8884121289018', seq: '888 412 128 9018', n: 'Amor y vínculos sanos', cat: 'amor', uso: 'Peleas, distancia, querer reconectar sin pelear.', como: 'Piensa en la persona sin reclamo, repite y termina con “gracias”.' },
  { id: '48154211', seq: '481 542 11', n: 'Amor propio', cat: 'amor', uso: 'Autoexigencia, vergüenza, días grises. Volver a tratarse bien.', como: 'Frente al espejo, mano al corazón, 7 repeticiones lentas.' },
  { id: '0918', seq: '0918', n: 'Reconciliación', cat: 'amor', uso: 'Pedir perdón o perdonar por dentro, aunque el otro no esté.', como: 'Escribe 3 líneas de lo que quieres soltar y repite la secuencia encima.' },
  { id: '5207418', seq: '520 741 8', n: 'Flujo económico', cat: 'abundancia', uso: 'La más compartida en redes para “dinero inesperado”. Úsala como foco + acción.', como: 'Repítela 21 veces mirando tu cuaderno de finanzas y anota 1 acción de hoy.' },
  { id: '71427321893', seq: '714 273 218 93', n: 'Trabajo y oportunidades', cat: 'abundancia', uso: 'Buscar pega, entrevista, emprendimiento en Penco.', como: 'Visualiza tu escena final (firmando, atendiendo) y repite 10 min.' },
  { id: '318612518714', seq: '318 612 518 714', n: 'Ventas y oficio justo', cat: 'abundancia', uso: 'Feria, negocio de barrio, trabajo independiente.', como: 'Repite antes de abrir y agradece cada venta del día.' },
  { id: '497241', seq: '497 241', n: 'Estudios y memoria', cat: 'abundancia', uso: 'Pruebas, exámenes, practicar mapuzugun o inglés.', como: 'Lee la secuencia, estudia 25 min, repite, descansa 5 (pomodoro).' },
  { id: '41981871928', seq: '419 818 719 28', n: 'Hogar en armonía', cat: 'hogar', uso: 'Desorden, ruido, visitas, cuentas de la casa.', como: 'Recorre tu casa ordenando 10 min mientras repites por dentro.' },
  { id: '8898', seq: '8898', n: 'Viaje resguardado', cat: 'hogar', uso: 'Viaje Penco–Conce, bus, bici, caminata nocturna.', como: 'Antes de salir, 7 repeticiones imaginando llegada tranquila.' },
  { id: '71941871', seq: '719 418 71', n: 'Huerta y siembra', cat: 'hogar', uso: 'Sembrar, trasplantar, regar con intención (muy Penco).', como: 'Con las manos en la tierra, repite 7 veces y riega.' },
  { id: '4818967', seq: '481 8967', n: 'Niños y calma en casa', cat: 'hogar', uso: 'Patraletas, tareas, hora de dormir de los peques.', como: 'Baja la luz, abraza y susurra los dígitos como arrullo.' },
  { id: '398', seq: '398', n: 'Alegría simple', cat: 'armonia', uso: 'Días planos: encender gratitud sin motivo grande.', como: 'Sonríe y repite caminando 5 min. Anota 3 cosas buenas.' },
  { id: '975132', seq: '975 132', n: 'Perdonar el pasado', cat: 'amor', uso: 'Recuerdos que vuelven. Complementa con Ho’oponopono.', como: 'Escribe, respira, repite y rompe el papel con respeto.' },
  { id: '5218349', seq: '521 8349', n: 'Decisión clara', cat: 'armonia', uso: 'Duda entre dos caminos: aquietar para elegir.', como: 'Escribe pro/contra, repite 5 min y elige lo amable.' },
  { id: '6135487', seq: '613 5487', n: 'Duelo suave', cat: 'calma', uso: 'Extrañar a quien partió. Foco de consuelo, no de olvido.', como: 'Mira su foto, repite y termina encendiendo una velita.' },
  { id: '8142109', seq: '814 2109', n: 'Examen y entrevista', cat: 'abundancia', uso: 'Nervios antes de prueba o entrevista.', como: 'Técnica 3-2-1 de Silva + 21 repeticiones de la secuencia.' },
  { id: '316849', seq: '316 849', n: 'Orden y limpieza', cat: 'hogar', uso: 'Casa patas arriba, diógenes leve, papeles.', como: 'Pon timer 15 min, repite y ordena un solo cajón.' },
  { id: '718412', seq: '718 412', n: 'Aire y respiro', cat: 'cuerpo', uso: 'Agobio, calor, humo, alergia primaveral. Foco + ventilar.', como: 'Abre ventana, 10 respiraciones y repite mirando el cielo.' },
  { id: '2954851', seq: '295 4851', n: 'Manos a la obra', cat: 'abundancia', uso: 'Procrastinación: partir aunque sea 5 minutos.', como: 'Repite 7 veces y parte por lo más chico. Suma +1.' },
  { id: '198513', seq: '198 513', n: 'Barrio y vecinos', cat: 'hogar', uso: 'Convivencia, ruido, microbasural, junta vecinal.', como: 'Repite antes de hablar y lleva 1 propuesta amable.' },
  { id: '1234814', seq: '123 4814', n: 'Comienzo nuevo', cat: 'armonia', uso: 'Luna nueva: sembrar intención del ciclo de 28 días.', como: 'Escribe tu intención en la nota de la luna y repite 21 veces.' },
  { id: '777', seq: '777', n: 'Agradecer lo bueno', cat: 'armonia', uso: 'Cierre del día: sellar lo que sí funcionó.', como: 'Acuéstate, repite 7 veces y nombra 1 logro chico.' },
  { id: '8888', seq: '8888', n: 'Norma y equilibrio', cat: 'armonia', uso: 'La “norma” grabovoi: volver todo a su medida sana.', como: 'Visualiza esfera plateada con la situación dentro, repite 10 min.' }
];
var GB_INT_AREAS = ['armonía', 'calma/descanso', 'cuerpo/energía', 'amor/vínculos', 'trabajo/dinero', 'hogar/viaje', 'duelo/memoria', 'otro'];
var GB_INT_ESTADOS = ['pendiente', 'en proceso', 'armonizado'];

function seqById(id) {
  for (var i = 0; i < GB_SEQS.length; i++) if (GB_SEQS[i].id === id) return GB_SEQS[i];
  return GB_SEQS[0];
}
function rachaDias() {
  var set = {};
  store().ses.forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}

/* ============================================================
   RENDER — Secuencias (catalogo)
   ============================================================ */
function renderSeqs() {
  var box = $('gbSeqGrid'); if (!box) return;
  var e = store();
  var q = (($('gbSeqQ') || {}).value || '').toLowerCase();
  var cat = ($('gbSeqCat') || {}).value || 'todas';
  var list = GB_SEQS.filter(function (s) {
    if (cat !== 'todas' && s.cat !== cat) return false;
    if (q && (s.n + ' ' + s.seq + ' ' + s.uso).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  box.innerHTML = list.length ? list.map(function (s) {
    var isFav = e.fav === s.id;
    var catN = '🌌'; GB_CATS.forEach(function (c) { if (c.id === s.cat) catN = c.n; });
    return '<div class="menstrual-card" style="border-color:#8fd69455">' +
      '<h4 style="color:#8fd694">🔢 ' + esc(s.seq) + (isFav ? ' ⭐' : '') + '</h4>' +
      '<p style="font-size:13px;margin:2px 0"><b>' + esc(s.n) + '</b> <span class="muted" style="font-size:10px">· ' + esc(catN) + '</span></p>' +
      '<p style="font-size:12px;line-height:1.55"><b>Foco:</b> ' + esc(s.uso) + '<br><b>Cómo:</b> ' + esc(s.como) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn btn-accent" style="width:auto;font-size:11px" data-pilot="' + esc(s.id) + '">🎯 Pilotar</button>' +
      '<button type="button" class="btn" style="width:auto;font-size:11px" data-voz="' + esc(s.id) + '">🔊 Escuchar</button>' +
      '<button type="button" class="btn" style="width:auto;font-size:11px" data-fav="' + esc(s.id) + '">' + (isFav ? '⭐ Favorita' : '☆ Marcar') + '</button>' +
      '</div></div>';
  }).join('') : '<p class="muted">Sin resultados. Prueba con “calma”, “dinero”, “dormir”, “amor”…</p>';
  box.querySelectorAll('[data-pilot]').forEach(function (b) { b.onclick = function () { irAPilotaje(b.getAttribute('data-pilot'), null); }; });
  box.querySelectorAll('[data-voz]').forEach(function (b) { b.onclick = function () { var s = seqById(b.getAttribute('data-voz')); speak(s.n + '. Secuencia: ' + seqSpoken(s.seq) + '. ' + s.como); }; });
  box.querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { store().fav = b.getAttribute('data-fav'); persistStore(); save('Secuencia favorita guardada ⭐'); renderSeqs(); renderPilot(); }; });
}
function irAPilotaje(seqId, intenId) {
  switchTab('Pil');
  var ss = $('gbPilSeq'); if (ss && seqId) ss.value = seqId;
  if (intenId) { var si = $('gbPilInten'); if (si) si.value = intenId; }
  try { renderPilot(); } catch (e) {}
  try { $('gbPilSeq').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
}

/* ============================================================
   RENDER — Pilotaje (practica)
   ============================================================ */
var gbCount = 0, gbTimerIv = null, gbTimerLeft = 0;
function gbCountPaint() {
  var c = $('gbCountNum'); if (c) c.textContent = String(gbCount);
  var bar = $('gbCountBar'); if (bar) bar.style.width = Math.min(100, Math.round(gbCount / 108 * 100)) + '%';
}
function gbBump(n) {
  gbCount += (n || 1);
  gbCountPaint();
  var e = store(); e.total += (n || 1); persistStore();
  try { renderAva(); } catch (x) {}
}
function stopTimer(silent) {
  if (gbTimerIv) { clearInterval(gbTimerIv); gbTimerIv = null; }
  if (!silent) { var l = $('gbTimerLabel'); if (l) l.textContent = '⏱ Temporizador listo: 1, 5 o 10 min de concentración suave.'; }
}
function gbTimerStart(mins) {
  stopTimer(true);
  gbTimerLeft = mins * 60;
  var l = $('gbTimerLabel');
  function paint() {
    if (!l) return;
    var m = Math.floor(gbTimerLeft / 60), s = gbTimerLeft % 60;
    l.innerHTML = '🎯 Pilotando… <b>' + m + ':' + String(s).padStart(2, '0') + '</b> · lee dígito por dígito al respirar. <span class="muted">Cada respiración suma +1.</span>';
  }
  paint();
  gbTimerIv = setInterval(function () {
    gbTimerLeft--;
    gbBump(1);
    if (gbTimerLeft <= 0) {
      stopTimer(true);
      if (l) l.innerHTML = '🌌 <b>Pilotaje completo.</b> Toma agua, anota 1 señal y guarda tu sesión abajo.';
      try { if (typeof playNotifySound === 'function') playNotifySound(); } catch (e) {}
      try { speak('Pilotaje completo. Gracias.'); } catch (e2) {}
      return;
    }
    paint();
  }, 1000);
}
function gbIntenOptions(selectedId) {
  var d = store().inten.filter(function (r) { return r.estado !== 'armonizado'; });
  return '<option value="">Pilotaje libre (sin tema)</option>' + d.map(function (r) {
    return '<option value="' + r.id + '"' + (r.id === selectedId ? ' selected' : '') + '>' + esc((r.titulo || 'Sin título').slice(0, 40)) + ' · ' + (r.inten0 || 0) + '/10</option>';
  }).join('');
}
function gbSeqOptions() {
  return GB_SEQS.map(function (s) { return '<option value="' + s.id + '">' + esc(s.seq) + ' · ' + esc(s.n) + '</option>'; }).join('');
}
function renderPilot() {
  var sel = $('gbPilInten'); if (!sel) return;
  var keep = sel.value || '';
  sel.innerHTML = gbIntenOptions(keep);
  var ss = $('gbPilSeq');
  if (ss) {
    if (!ss.options || !ss.options.length) ss.innerHTML = gbSeqOptions();
    if (!ss.value) ss.value = store().fav || '741';
  }
  gbCountPaint();
  var fb = $('gbPilSeqBox');
  if (fb && ss) { var s = seqById(ss.value); fb.innerHTML = '<span class="chip" style="border-color:#8fd69488;color:#8fd694">🔢 ' + esc(s.seq) + ' · ' + esc(s.n) + ': ' + esc(s.como) + '</span>'; }
}
function guardarSesion() {
  var intenId = ($('gbPilInten') || {}).value || '';
  var seqId = ($('gbPilSeq') || {}).value || '741';
  var antes = +(($('gbAntes') || {}).value || 5);
  var despues = +(($('gbDespues') || {}).value || 5);
  var insight = clean((($('gbInsight') || {}).value || '').trim(), 300);
  var reps = gbCount || +(($('gbReps') || {}).value || 0) || 0;
  if (!reps && !insight) { if (!confirm('Aún no sumaste repeticiones. ¿Guardar igual la sesión?')) return; }
  var s = seqById(seqId);
  var titulo = 'Pilotaje libre';
  if (intenId) {
    var dd = store().inten, r = null;
    for (var i = 0; i < dd.length; i++) if (dd[i].id === intenId) r = dd[i];
    if (r) {
      titulo = r.titulo;
      r.estado = despues <= 3 ? 'armonizado' : 'en proceso';
      r.inten0 = despues;
    }
  }
  store().ses.push({ id: uid('gb'), fecha: (($('gbPilFecha') || {}).value) || todayKey(), intenId: intenId, titulo: titulo, seqId: seqId, seq: s.seq, reps: reps, antes: antes, despues: despues, insight: insight });
  persistStore();
  save('Sesión guardada 🌌');
  gbCount = 0; gbCountPaint();
  try { $('gbInsight').value = ''; } catch (e) {}
  renderSes(); renderInt(); renderAva(); renderPilot();
  switchTab('Ses');
}

/* ============================================================
   RENDER — Intenciones + Sesiones + Avance
   ============================================================ */
var gbIntEditId = null;
function renderInt() {
  var box = $('gbIntList'); if (!box) return;
  var q = (($('gbIntQ') || {}).value || '').toLowerCase();
  var f = ($('gbIntF') || {}).value || 'todas';
  var d = store().inten.slice().sort(function (a, b) { return (b.inten0 || 0) - (a.inten0 || 0); });
  var fil = d.filter(function (r) {
    if (f !== 'todas' && r.estado !== f) return false;
    if (q && ((r.titulo || '') + ' ' + (r.nota || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  box.innerHTML = fil.length ? fil.map(function (r) {
    var col = r.estado === 'armonizado' ? '#8fd694' : (r.estado === 'en proceso' ? '#e8c56a' : '#9ab8ff');
    var s = r.seqId ? seqById(r.seqId) : null;
    return '<div class="habit-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><span><b>' + esc(r.titulo) + '</b></span>' +
      '<span class="chip" style="font-size:10px;border-color:' + col + '55;color:' + col + '">' + esc(r.estado || 'pendiente') + ' · ' + (r.inten0 || 0) + '/10</span></div>' +
      '<div class="muted" style="font-size:11px;margin-top:4px">' + (s ? '🔢 ' + esc(s.seq) + ' · ' + esc(s.n) + ' · ' : '') + (r.area ? '🏷️ ' + esc(r.area) + ' · ' : '') + esc(lunaTxt(r.fecha) || '') + (r.nota ? '<br>📝 ' + esc(r.nota) : '') + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' +
      '<button class="btn" style="width:auto;font-size:11px" data-pilot="' + r.id + '">🎯 Pilotar</button>' +
      '<button class="btn" style="width:auto;font-size:11px" data-next="' + r.id + '">⏭ ' + (r.estado === 'pendiente' ? 'en proceso' : r.estado === 'en proceso' ? 'armonizado' : 'reabrir') + '</button>' +
      '<button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️</button>' +
      '<button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Inventario vacío. Anota 1 tema a pilotar: lo que se nombra, se puede ordenar.</p>';
  var st = $('gbIntStats');
  if (st) st.textContent = d.length + ' intenciones · ' + d.filter(function (r) { return r.estado === 'armonizado'; }).length + ' armonizadas 🌌';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar esta intención?')) return; var dd = store().inten; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); persistStore(); save(); renderInt(); renderAva(); renderPilot(); }; });
  box.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { var dd = store().inten; var r = dd.find(function (x) { return x.id === b.getAttribute('data-next'); }); if (!r) return; r.estado = r.estado === 'pendiente' ? 'en proceso' : (r.estado === 'en proceso' ? 'armonizado' : 'pendiente'); persistStore(); save(r.estado === 'armonizado' ? 'Armonizado 🌌' : 'Guardado'); renderInt(); renderAva(); renderPilot(); }; });
  box.querySelectorAll('[data-pilot]').forEach(function (b) { b.onclick = function () { var dd = store().inten; var r = dd.find(function (x) { return x.id === b.getAttribute('data-pilot'); }); switchTab('Pil'); renderPilot(); var si = $('gbPilInten'); if (si) si.value = b.getAttribute('data-pilot'); if (r && r.seqId) { var ss = $('gbPilSeq'); if (ss) ss.value = r.seqId; } renderPilot(); var an = $('gbAntes'); if (an && r) an.value = String(r.inten0 || 5); }; });
  box.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { var dd = store().inten; var r = dd.find(function (x) { return x.id === b.getAttribute('data-edit'); }); if (!r) return; gbIntEditId = r.id;
    $('gbIntTitulo').value = r.titulo || ''; $('gbIntArea').value = r.area || GB_INT_AREAS[0]; $('gbIntSeq').value = r.seqId || '741'; $('gbIntInten').value = String(r.inten0 || 5); $('gbIntEstado').value = r.estado || 'pendiente'; $('gbIntNota').value = r.nota || '';
    $('gbIntAdd').textContent = '↻ Actualizar'; $('gbIntCancel').classList.remove('hidden');
  }; });
}
function renderSes() {
  var box = $('gbSesList'); if (!box) return;
  var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = d.length ? d.slice(0, 40).map(function (r) {
    return '<div class="habit-item"><b>🌌 ' + esc(r.fecha) + '</b> · 🔢 ' + esc(r.seq || '') + ' · ×' + (+r.reps || 0) +
      '<br><span class="muted" style="font-size:11px">📌 ' + esc(r.titulo || 'libre') + ' · ' + r.antes + '→' + r.despues + '/10 · ' + esc(lunaTxt(r.fecha)) + '</span>' +
      (r.insight ? '<p style="font-size:12px">💡 ' + esc(r.insight) + '</p>' : '') +
      '<div style="display:flex;gap:6px;margin-top:4px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin sesiones aún. Ve a 🎯 Pilotaje y regala 3 minutos a tu foco de hoy.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar sesión?')) return; var dd = store().ses; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); persistStore(); save(); renderSes(); renderAva(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = store().ses; var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🌌 Mi pilotaje ' + r.fecha, '📌 ' + (r.titulo || '') + '\n🔢 ' + (r.seq || '') + ' ×' + r.reps + ' (' + r.antes + '→' + r.despues + '/10)' + (r.insight ? '\n💡 ' + r.insight : '')); }; });
  var st = $('gbSesStats');
  if (st) { var reps = d.reduce(function (a, r) { return a + (+r.reps || 0); }, 0); st.textContent = d.length + ' sesiones · ×' + reps + ' repeticiones · racha ' + rachaDias() + ' días'; }
}
function renderAva() {
  var box = $('gbAvaBox'); if (!box) return;
  var e = store();
  var inv = e.inten, ses = e.ses;
  var arm = inv.filter(function (r) { return r.estado === 'armonizado'; }).length;
  var pct = inv.length ? Math.round(arm / inv.length * 100) : 0;
  var totalReps = ses.reduce(function (a, r) { return a + (+r.reps || 0); }, 0);
  var vidaReps = (e.total || 0) > totalReps ? (e.total || 0) : totalReps;
  var porSeq = {};
  ses.forEach(function (r) { var k = r.seq || r.seqId || '?'; porSeq[k] = (porSeq[k] || 0) + 1; });
  var topSeq = Object.keys(porSeq).sort(function (a, b) { return porSeq[b] - porSeq[a]; })[0] || '—';
  box.innerHTML = '<p class="muted" style="font-size:11px">🌌 Intenciones armonizadas: <b>' + arm + '/' + inv.length + '</b> (' + pct + '%)</p>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#8fd694,#7ab8ff,#e8c56a)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">🎯 ' + ses.length + ' sesiones · 🔁 ×' + vidaReps + ' repeticiones de vida · 🔥 racha ' + rachaDias() + ' días · secuencia más usada: <b>' + esc(topSeq) + '</b></p>' +
    '<p class="muted" style="font-size:11px">Ritmo sugerido: 1 pilotaje corto al día (3–5 min). Luna menguante → ordenar y soltar; luna nueva → sembrar intención. Lo que vuelve se pilota de nuevo, sin culpa.</p>';
}
function renderAll() { try { renderSeqs(); } catch (e) {} try { renderPilot(); } catch (e) {} try { renderInt(); } catch (e) {} try { renderSes(); } catch (e) {} try { renderAva(); } catch (e) {} }

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  makeDialog('grabovoiDialog', '🌌 Grabovoi — secuencias y pilotaje de la realidad',
    'Método de concentración del autor ruso <b>Grigori Grabovoi</b>: lees secuencias numéricas dígito por dígito, sostienes la imagen del resultado y actúas en coherencia. Aquí lo usamos como <b>meditación de foco + acción concreta</b>. Todo queda <b>privado y local</b>.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabGbGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabGbSec" class="btn" style="width:auto">🔢 Secuencias</button>' +
    '<button type="button" id="tabGbPil" class="btn" style="width:auto">🎯 Pilotaje</button>' +
    '<button type="button" id="tabGbInt" class="btn" style="width:auto">📋 Intenciones</button>' +
    '<button type="button" id="tabGbSes" class="btn" style="width:auto">📓 Sesiones</button>' +
    '<button type="button" id="tabGbAva" class="btn" style="width:auto">📊 Mi avance</button></div>' +

    '<div id="gbGuia">' +
      '<div class="si-card"><h4>🌌 ¿Qué es esto de Grabovoi?</h4><p><b>Grigori Grabovoi</b> (Kazajistán, 1963) propone que la <b>concentración sostenida</b> en formas —números, esferas, imágenes— ordena primero tu mente y luego tus actos: a eso llama <b>pilotaje de la realidad</b>. Sus libros (<i>Recuperación del organismo</i>, <i>Secuencias numéricas</i>) listan cientos de secuencias. En redes se popularizaron unas decenas para el día a día. Aquí reunimos las más compartidas como <b>foco meditativo</b>.</p></div>' +
      '<div class="si-card"><h4>🔢 ¿Cómo se lee una secuencia?</h4><p><b>1)</b> Lee dígito por dígito, lento: “cinco, dos, cero…”.<br><b>2)</b> Haz una micro-pausa donde hay espacio (“520 · 741 · 8”).<br><b>3)</b> Mientras lees, sostén la imagen del resultado ya dado (llegar tranquilo, pagar en paz, dormir profundo).<br><b>4)</b> 21 repeticiones ≈ 3 min; 108 ≈ 10 min. Mejor poco y diario que mucho una vez.</p></div>' +
      '<div class="si-card"><h4>🎯 El pilotaje en 5 minutos (paso a paso)</h4><p><b>1)</b> Elige 1 intención (empieza con carga ≤6).<br><b>2)</b> Siéntate, 3 respiraciones lentas.<br><b>3)</b> Lee tu secuencia 7–21 veces mirándola o de memoria.<br><b>4)</b> Visualiza 30 segundos la <b>escena final</b> (no el problema).<br><b>5)</b> Mide 0–10: ¿bajó 1–2 puntos? Suficiente por hoy.<br><b>6)</b> Anota <b>1 acción concreta</b> (llamar, ordenar, postular) y hazla hoy. Sin acción, el número es solo adorno.</p></div>' +
      '<div class="si-card"><h4>🔮 La esfera plateada (técnica clásica)</h4><p>Imagina una <b>esfera de luz plateada</b> frente a ti. Mete dentro tu tema + la secuencia escrita en luz. Mírala 1–3 min mientras repites. Al terminar, imagina que la esfera se eleva y se disuelve: “entrego y actúo”. Sirve para no rumiar: concentras, sueltas, actúas.</p></div>' +
      '<div class="si-card"><h4>🌙 Grabovoi y tus 13 lunas</h4><p><b>Menguante</b> → ordenar, pagar, soltar (741, 318 798). <b>Nueva</b> → sembrar intención del ciclo (123 4814). <b>Llena</b> → ver claro y agradecer (777, 8888). <b>Creciente</b> → trabajo y estudios (714…, 497 241). Cada sesión queda marcada con su luna en 📓 Sesiones.</p></div>' +
      '<div class="si-card"><h4>⚠️ Contexto honesto y cuidados</h4><p>Las secuencias <b>no tienen respaldo científico</b> y Grabovoi es una figura controvertida (fue condenado en Rusia en 2008 por fraude). Úsalo como <b>concentración y calma</b>, nunca como reemplazo de medicina, terapia o decisiones económicas: <b>no abandones tratamientos, no entregues dinero por “activaciones”, no te endeudes por promesas</b>. Si un tema te desborda: *4141 (Chile, 24h), CESFAM o profesional. Si algo te pide plata a cambio de “normar”, aléjate.</p></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="gbGoSec" class="btn btn-accent" style="width:auto">🔢 Ver secuencias →</button> <button type="button" id="gbGoPil" class="btn" style="width:auto">🎯 Pilotar ahora →</button></div>' +
    '</div>' +

    '<div id="gbSec" class="hidden">' +
      '<div class="conv-row"><label style="flex:2">🔍 Buscar <input type="text" id="gbSeqQ" placeholder="calma, dinero, dormir, amor..." autocomplete="off"></label>' +
      '<label>Categoría <select id="gbSeqCat">' + GB_CATS.map(function (c) { return '<option value="' + c.id + '">' + c.n + '</option>'; }).join('') + '</select></label></div>' +
      '<p class="muted" style="font-size:11px">Recopilación popular: las versiones varían entre fuentes. Úsalas como foco de concentración + 1 acción real.</p>' +
      '<div id="gbSeqGrid"></div></div>' +

    '<div id="gbPil" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🎯 Pilotaje guiado</h4>' +
      '<div class="conv-row"><label style="flex:2">📌 Intención <select id="gbPilInten"></select></label><label>📅 Fecha <input type="date" id="gbPilFecha"></label></div>' +
      '<div class="conv-row"><label style="flex:2">🔢 Secuencia <select id="gbPilSeq">' + GB_SEQS.map(function (s) { return '<option value="' + s.id + '">' + esc(s.seq) + ' · ' + esc(s.n) + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="gbPilSeqBox" style="margin:6px 0"></div>' +
      '<div class="menstrual-card" style="background:var(--panel);text-align:center"><div style="font-size:11px" class="muted">CONTADOR DE REPETICIONES (meta dulce: 108)</div>' +
      '<div id="gbCountNum" style="font-size:44px;font-weight:800;color:var(--gold)">0</div>' +
      '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin:6px 0"><div id="gbCountBar" style="width:0%;height:100%;background:linear-gradient(90deg,#8fd694,#7ab8ff,#e8c56a)"></div></div>' +
      '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap"><button type="button" id="gbPlus1" class="btn btn-accent" style="width:auto;font-size:15px">+1 🎯</button>' +
      '<button type="button" id="gbPlus7" class="btn" style="width:auto">+7</button><button type="button" id="gbPlus21" class="btn" style="width:auto">+21</button>' +
      '<button type="button" id="gbZero" class="btn" style="width:auto">↺ 0</button><button type="button" id="gbVozPil" class="btn" style="width:auto">🔊 Guía por voz</button></div>' +
      '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px"><button type="button" id="gbT1" class="btn" style="width:auto">⏱ 1 min</button>' +
      '<button type="button" id="gbT5" class="btn" style="width:auto">⏱ 5 min</button><button type="button" id="gbT10" class="btn" style="width:auto">⏱ 10 min</button>' +
      '<button type="button" id="gbTStop" class="btn" style="width:auto">⏹ Detener</button></div>' +
      '<div id="gbTimerLabel" class="muted" style="font-size:11px;margin-top:6px">⏱ Temporizador listo: 1, 5 o 10 min de concentración suave.</div></div>' +
      '<div class="conv-row" style="margin-top:8px"><label>Carga antes (0–10) <input type="number" id="gbAntes" min="0" max="10" value="6" style="width:80px"></label>' +
      '<label>Carga después (0–10) <input type="number" id="gbDespues" min="0" max="10" value="4" style="width:80px"></label>' +
      '<label style="flex:1">Repeticiones manuales <input type="number" id="gbReps" min="0" value="0" style="width:90px"></label></div>' +
      '<label>💡 Señal / acción de hoy <input type="text" id="gbInsight" placeholder="ej: llamé al dato de pega; pagué la mitad de la deuda" maxlength="300"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="gbGuardarSes" class="btn btn-accent" style="width:auto">🌌 Guardar sesión</button></div>' +
      '<p class="muted" style="font-size:11px">Tip: sin intención clara, pilota libre con 741 o 318 798 antes de dormir. Suma igual a tu racha.</p></div>' +
    '</div>' +

    '<div id="gbInt" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ ¿Qué quiero pilotar?</h4>' +
      '<div class="conv-row"><label style="flex:2">Intención * <input type="text" id="gbIntTitulo" placeholder="ej: pagar la deuda de la luz en paz" maxlength="60"></label><label>Secuencia <select id="gbIntSeq">' + GB_SEQS.map(function (s) { return '<option value="' + s.id + '">' + esc(s.seq) + ' · ' + esc(s.n) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="conv-row"><label>Área <select id="gbIntArea">' + GB_INT_AREAS.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label>' +
      '<label>Carga (0–10) <input type="number" id="gbIntInten" min="0" max="10" value="6" style="width:80px"></label>' +
      '<label>Estado <select id="gbIntEstado"><option>pendiente</option><option>en proceso</option><option>armonizado</option></select></label></div>' +
      '<label>Nota <input type="text" id="gbIntNota" placeholder="ej: me aprieta el pecho al pensar en la cuenta" maxlength="120"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="gbIntAdd" class="btn btn-accent" style="width:auto">+ Agregar</button><button type="button" id="gbIntCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
      '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="gbIntQ" placeholder="tema..." autocomplete="off"></label>' +
      '<label>Estado <select id="gbIntF"><option value="todas">Todas</option><option value="pendiente">Pendientes</option><option value="en proceso">En proceso</option><option value="armonizado">Armonizadas</option></select></label></div>' +
      '<div id="gbIntList" class="habits-list" style="margin-top:8px;max-height:300px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="gbIntStats" class="muted" style="font-size:11px"></span>' +
      '<span style="display:flex;gap:8px"><button type="button" id="gbIntShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="gbIntClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar armonizadas</button></span></div>' +
    '</div>' +

    '<div id="gbSes" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📓 Mis sesiones de pilotaje</h4>' +
      '<p class="muted" style="font-size:11px">Cada foco cuenta, aunque baje solo 1 punto. La constancia ordena más que la intensidad.</p>' +
      '<div id="gbSesList" class="habits-list" style="max-height:320px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="gbSesStats" class="muted" style="font-size:11px"></span>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="gbSesToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
      '<button type="button" id="gbSesShareAll" class="btn" style="width:auto">📤 Compartir</button>' +
      '<button type="button" id="gbSesClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '</div>' +

    '<div id="gbAva" class="hidden"><div id="gbAvaBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
      '<div class="si-card"><h4>🌙 Cierre de luna (ritual de 3 líneas)</h4><p>Cada fin de luna responde en tu cuaderno o en 📝 nota del día:<br><b>1)</b> ¿Qué piloté esta luna?<br><b>2)</b> ¿Qué acción concreta hice?<br><b>3)</b> ¿Qué dejo ordenado?<br>Termina con 7 repeticiones de tu secuencia favorita.</p></div></div>');
}

/* ---------- puente Metodos ---------- */
function puenteMetodos() {
  try {
    var iv = setInterval(function () {
      var sel = $('metTopic');
      if (!sel) return;
      var v = null;
      try { v = sel.value; } catch (e) {}
      var dlg = $('metodosDialog');
      if (!dlg || !dlg.open) return;
      if ((v === 'grabovoi' || v === 'hoponopono') && !$('gbOpenFromMetodos')) {
        var fab = document.createElement('div');
        fab.innerHTML = '<button type="button" id="gbOpenFromMetodos" class="btn btn-accent" style="width:auto;margin-top:8px">🌌 Abrir mi Grabovoi completo</button>';
        var f = dlg.querySelector('form') || dlg;
        f.appendChild(fab);
        var nb = $('gbOpenFromMetodos');
        if (nb) nb.onclick = function () { try { dlg.close(); } catch (e) {} openGb(); };
      }
      if (v !== 'grabovoi' && v !== 'hoponopono') { var old = $('gbOpenFromMetodos'); if (old && old.parentNode) old.parentNode.remove(); }
    }, 800);
    setTimeout(function () { clearInterval(iv); }, 1000 * 60 * 10);
  } catch (e) {}
}

function openGb() {
  try {
    var lf = $('gbPilFecha'); if (lf && !lf.value) lf.value = todayKey();
    renderAll();
  } catch (e) {}
  openDlg('grabovoiDialog');
}
try { window.openGrabovoi = openGb; window.openGrabovoiDialog = openGb; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar boton en Linaje > Interior (tras btnSilva si existe) */
  try {
    if (!$('btnGrabovoi')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnGrabovoi'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌌 Grabovoi';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'grabovoi graboboi grigori gravoboi secuencias numericas pilotaje realidad esfera plateada concentracion numeros foco norma 741 dinero abundancia norma armonia meditacion');
        var ref = g.querySelector('#btnSilva') || g.querySelector('#btnHooponopono') || g.querySelector('#btnRecap');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnGrabovoi');
        var curG = cur.closest ? cur.closest('.action-group') : null;
        var curN = curG && curG.getAttribute ? curG.getAttribute('data-group') : null;
        if (curN && curN !== 'linaje') {
          var gd = document.querySelector('.action-group[data-group="linaje"] .group-btns');
          if (gd) { gd.appendChild(cur); try { cur.setAttribute('data-sub', 'interior'); } catch (eS) {} }
        }
      } catch (eM) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnGrabovoi') < 0) ALL_BTNS.push('btnGrabovoi');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnGrabovoi = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnGrabovoi') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnSilva');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnGrabovoi');
      else BTN_ORDER['linaje|interior'].push('btnGrabovoi');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnGrabovoi = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnGrabovoi"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnGrabovoi"> 🌌 Grabovoi';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnGrabovoi !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnGrabovoi = lab.querySelector('input').checked;
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
  /* keywords cruzadas (incluye la grafia "graboboi" que escriben muchos) */
  function addKw(id, extra) {
    try { var b = $(id); if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) b.dataset.keywords += ' ' + extra; } catch (e) {}
  }
  try { addKw('btnMetodos', 'grabovoi graboboi pilotaje secuencias'); } catch (e2) {}
  try { addKw('btnHooponopono', 'grabovoi limpiar antes pilotar'); } catch (e3) {}
  try { addKw('btnSilva', 'grabovoi alfa concentracion pilotaje'); } catch (e4) {}
  try { addKw('btnGratitud', 'grabovoi gracias norma pilotaje'); } catch (e5) {}
  try { addKw('btnBreath', 'grabovoi calma respiracion concentracion'); } catch (e6) {}

  /* 4) dialogo + eventos */
  buildDialog();
  renderAll();

  var b = $('btnGrabovoi');
  if (b) b.onclick = function () { openGb(); };

  ['Guia', 'Sec', 'Pil', 'Int', 'Ses', 'Ava'].forEach(function (t) {
    var tb = $('tabGb' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });
  var gs = $('gbGoSec'); if (gs) gs.onclick = function () { switchTab('Sec'); renderSeqs(); };
  var gp = $('gbGoPil'); if (gp) gp.onclick = function () { switchTab('Pil'); renderPilot(); };

  var qq = $('gbSeqQ'); if (qq) qq.oninput = function () { renderSeqs(); };
  var qc = $('gbSeqCat'); if (qc) qc.onchange = function () { renderSeqs(); };
  var ss2 = $('gbPilSeq'); if (ss2) ss2.onchange = function () { renderPilot(); };

  var p1 = $('gbPlus1'); if (p1) p1.onclick = function () { gbBump(1); };
  var p7 = $('gbPlus7'); if (p7) p7.onclick = function () { gbBump(7); };
  var p21 = $('gbPlus21'); if (p21) p21.onclick = function () { gbBump(21); };
  var z0 = $('gbZero'); if (z0) z0.onclick = function () { gbCount = 0; gbCountPaint(); };
  var vz = $('gbVozPil'); if (vz) vz.onclick = function () {
    var sq = ($('gbPilSeq') || {}).value || '741';
    var s = seqById(sq);
    speak('Respira. Lee conmigo: ' + seqSpoken(s.seq) + '. Sostén la imagen de ' + s.n + '. Sigue a tu ritmo. Gracias.');
  };
  var t1 = $('gbT1'); if (t1) t1.onclick = function () { gbTimerStart(1); };
  var t5 = $('gbT5'); if (t5) t5.onclick = function () { gbTimerStart(5); };
  var t10 = $('gbT10'); if (t10) t10.onclick = function () { gbTimerStart(10); };
  var ts = $('gbTStop'); if (ts) ts.onclick = function () { stopTimer(false); };
  var gsave = $('gbGuardarSes'); if (gsave) gsave.onclick = function () { guardarSesion(); };

  var ia = $('gbIntAdd');
  if (ia) ia.onclick = function () {
    var t = clean(($('gbIntTitulo').value || '').trim(), 60); if (!t) return alert('Escribe la intención a pilotar');
    var rec = { id: gbIntEditId || uid('gb'), titulo: t, seqId: $('gbIntSeq').value || '741', area: $('gbIntArea').value || 'otro', inten0: Math.max(0, Math.min(10, +$('gbIntInten').value || 0)), estado: $('gbIntEstado').value || 'pendiente', nota: clean($('gbIntNota').value, 120), fecha: todayKey() };
    var dd = store().inten;
    if (gbIntEditId) { var i = dd.findIndex(function (x) { return x.id === gbIntEditId; }); if (i >= 0) dd[i] = rec; gbIntEditId = null; $('gbIntAdd').textContent = '+ Agregar'; $('gbIntCancel').classList.add('hidden'); }
    else dd.push(rec);
    persistStore(); save('Intención guardada 🌌');
    $('gbIntTitulo').value = ''; $('gbIntNota').value = '';
    renderInt(); renderAva(); renderPilot();
  };
  var ic = $('gbIntCancel');
  if (ic) ic.onclick = function () { gbIntEditId = null; $('gbIntAdd').textContent = '+ Agregar'; ic.classList.add('hidden'); ['gbIntTitulo', 'gbIntNota'].forEach(function (id) { var el = $(id); if (el) el.value = ''; }); };
  var iq = $('gbIntQ'); if (iq) iq.oninput = function () { renderInt(); };
  var iff = $('gbIntF'); if (iff) iff.onchange = function () { renderInt(); };
  var ish = $('gbIntShare');
  if (ish) ish.onclick = function () { var dd = store().inten; if (!dd.length) return alert('Sin intenciones'); share('🌌 Cosas que estoy pilotando (' + dd.length + ')', dd.map(function (r) { var s = r.seqId ? seqById(r.seqId) : null; return '· ' + r.titulo + ' [' + (s ? s.seq : '') + '] (' + r.estado + ' ' + r.inten0 + '/10)'; }).join('\n')); };
  var icl = $('gbIntClear');
  if (icl) icl.onclick = function () { if (!confirm('¿Borrar las intenciones ya armonizadas?')) return; var e = store(); e.inten = e.inten.filter(function (r) { return r.estado !== 'armonizado'; }); persistStore(); save(); renderInt(); renderAva(); renderPilot(); };

  var stn = $('gbSesToNote');
  if (stn) stn.onclick = function () {
    var last = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); })[0];
    if (!last) return alert('Sin sesiones aún');
    var txt = ('🌌 Grabovoi ' + (last.seq || '') + ' ×' + last.reps + ' · ' + (last.titulo || '') + ' (' + last.antes + '→' + last.despues + '/10)').slice(0, 280);
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var ssa = $('gbSesShareAll');
  if (ssa) ssa.onclick = function () {
    var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
    var t = d.length ? '🌌 Mis pilotajes (últimos)\n' + d.map(function (r) { return '• ' + r.fecha + ' · ' + (r.seq || '') + ' ×' + r.reps + ' · ' + (r.titulo || '') + ' (' + r.antes + '→' + r.despues + ')'; }).join('\n') : '🌌 Sin sesiones aún';
    share('Mi Grabovoi', t);
  };
  var scl2 = $('gbSesClear');
  if (scl2) scl2.onclick = function () { if (!confirm('¿Borrar todo tu historial de sesiones? (las intenciones se mantienen)')) return; store().ses = []; persistStore(); save(); renderSes(); renderAva(); };

  /* 5) puente Metodos */
  try { puenteMetodos(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
