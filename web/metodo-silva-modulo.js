/* ============================================================
   METODO SILVA — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnSilva (grupo Linaje > Interior, tras
     btnHooponopono / btnCuartoCamino)
   - Dialogo silvaDialog con 6 pestanas:
     1) Guia (que es, Jose Silva en 1 min, alfa/theta/beta,
        3 principios, como practicar 10 min, luna y mente,
        cuidados)
     2) Tecnicas (10 fichas + buscador + detalle + favorita +
        "practicar esta ahora")
     3) Practica (centrado guiado: relajacion paso a paso +
        contador 3-2-1 + temporizador 5/10/15 + respiracion +
        guardar sesion con antes/despues)
     4) Programaciones (mis deseos/proyectos: escena final,
        emocion, intensidad, estado pendiente/en proceso/cumplido)
     5) Sesiones (historial, diario, compartir,
        llevar a nota del dia)
     6) Mi avance (racha, totales, barra, por tecnica,
        por luna, ritmo sugerido)
   - Todo local y privado por usuario:
     userData().silva = { prog:[], ses:[], total:0, fav:'pantalla' }
   - Puentes: Metodos (topic silva -> boton abrir),
     Respiracion (calma antes de entrar a alfa),
     Diario Suenos (programar suenos), Gratitud (cierre),
     Ho'oponopono (limpiar antes de programar),
     Cuarto Camino (recuerdo de si).
   - Educativo, no terapia ni promesa magica.
     100% offline, sin dependencias.
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
function blank() { return { prog: [], ses: [], total: 0, fav: 'pantalla' }; }
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return blank();
    if (!u.silva) u.silva = blank();
    var e = u.silva;
    if (!Array.isArray(e.prog)) e.prog = [];
    if (!Array.isArray(e.ses)) e.ses = [];
    if (typeof e.total !== 'number') e.total = 0;
    if (typeof e.fav !== 'string') e.fav = 'pantalla';
    return e;
  } catch (e2) { return blank(); }
}
function persistStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (u) u.silva = store();
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
function addKw(id, extra) {
  try { var b = $(id); if (b && b.dataset && b.dataset.keywords && b.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) b.dataset.keywords += ' ' + extra; } catch (e) {}
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
function switchTab(name) {
  ['Guia', 'Tec', 'Prac', 'Prog', 'Ses', 'Ava'].forEach(function (t) {
    var p = $('sv' + t), b = $('tabSv' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return alert('Audio no disponible en este dispositivo');
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { try { alert('Audio no disponible'); } catch (e2) {} }
}

/* ============================================================
   DATOS — 10 tecnicas del Metodo Silva (lenguaje simple)
   ============================================================ */
var SV_TECNICAS = [
  { id: '321', n: 'Cuenta 3-2-1 (entrar a alfa)', ico: '🔢', color: '#7ab8ff',
    que: 'La puerta de entrada: contar 3-2-1 con los ojos cerrados y la mirada 20° hacia arriba relaja el cuerpo y baja el ritmo mental de beta (despierto apurado) a alfa (tranquilo y receptivo).',
    cuando: 'Siempre al empezar: antes de programar, estudiar, dormir o usar cualquier otra técnica.',
    como: 'Siéntate, pies en tierra. Cierra los ojos, míralos hacia arriba como a tu frente. Di dentro: «3… me relajo» (suelta cabeza-cuello), «2… más profundo» (suelta pecho-brazos), «1… estoy en alfa». Quédate 1 minuto respirando.' },
  { id: '54321', n: 'Relajación 5 a 1 (profundo)', ico: '🪜', color: '#7ab8ff',
    que: 'Versión larga del centrado para días tensos o insomnio: del 5 al 1 relajando cada zona del cuerpo por turnos.',
    cuando: 'Ansiedad, mente acelerada, antes de dormir, cuando el 3-2-1 no bastó.',
    como: 'En alfa di: 5 suelto cara y mandíbula · 4 suelto hombros · 3 suelto brazos y manos · 2 suelto piernas y pies · 1 estoy profunda y tranquila/o. 3 respiraciones y listo.' },
  { id: 'pantalla', n: 'Pantalla mental', ico: '🖥️', color: '#e8c56a',
    que: 'Tu cine interior: una pantalla imaginaria a 2 metros frente a ti donde proyectas lo que quieres ver (el problema y luego la solución). Verlo claro es programarlo.',
    cuando: 'Para todo: estudiar, rendir, sanar un hábito, preparar una conversación difícil.',
    como: 'En alfa, dibuja tu pantalla. Proyecta primero la escena actual 10 seg, luego bórrala y proyecta 1 minuto la escena YA resuelta, con colores, sonidos y tu sonrisa.' },
  { id: 'espejo', n: 'Espejo de la mente', ico: '🪞', color: '#c9a9c9',
    que: 'La técnica madre para cambiar algo: imagen azul del problema (lo que no quieres) → la borras → imagen blanca luminosa de la solución (lo que sí quieres).',
    cuando: 'Un hábito, un dolor, una prueba, una deuda, un conflicto: una cosa a la vez.',
    como: 'En alfa: encuadra en azul el problema 15 seg. Di «esto se va». Borra con luz blanca. Encuadra 1 minuto la solución con alegría. Cierra: «así es y así será». Una vez al día basta.' },
  { id: 'dedos', n: 'Tres dedos (ancla)', ico: '👌', color: '#8fd694',
    que: 'Juntar pulgar + índice + medio de cualquier mano como interruptor: «cada vez que uno mis 3 dedos, vuelvo a alfa al instante». Es memoria del cuerpo.',
    cuando: 'En la micro, antes de una prueba, entrevista, partido, discusión: calma en 10 segundos sin cerrar los ojos.',
    como: 'En alfa profundo une tus 3 dedos y di 3 veces: «cada vez que uno mis 3 dedos, entro a mi nivel». Practica 7 días seguidos y el ancla queda.' },
  { id: 'despertar', n: 'Despertar sin despertador', ico: '⏰', color: '#8fd694',
    que: 'Programar tu reloj interno: decirle a tu mente a qué hora despertar (y dormirte con esa orden). Clásico de Silva que casi todos logran la primera semana.',
    cuando: 'Turnos, clases temprano, viajes, dejar el celular lejos de la cama.',
    como: 'Acostado, en alfa: visualiza un reloj con tu hora (ej 06:30) y di: «mañana despierto a las 6:30, fresco y de buen ánimo». Imagínate levantándote contento. Sin ansiedad: si fallas 10 min, igual cuenta.' },
  { id: 'vaso', n: 'Vaso de agua', ico: '💧', color: '#7ab8ff',
    que: 'Técnica nocturna para respuestas: bebes medio vaso con una pregunta en mente, duermes, y al despertar bebes el resto esperando la respuesta del día.',
    cuando: 'Decisiones trabadas (pega, plata, amor), insomnio con vueltas, bloqueo creativo.',
    como: 'Noche: sirve medio vaso. En alfa sosténlo y di tu pregunta 3 veces («¿qué hago con ___?»). Bebe la mitad y duerme. Mañana bebe el resto y anota lo primero que venga, aunque sea raro.' },
  { id: 'sueno', n: 'Control de sueños', ico: '💭', color: '#c9a9c9',
    que: 'Pedirle a tu mente un sueño útil: irte a dormir con un tema y despertar con una pista (imagen, frase, calma). No es interpretar: es sembrar.',
    cuando: 'Problemas que das vueltas de noche, duelos, ideas para un proyecto, miedo a exámenes.',
    como: 'En alfa antes de dormir di: «esta noche sueño con ___ y despierto recordando lo útil». Papel y lápiz al lado. Al despertar quédate quieta/o 1 minuto y anota. Llévalo a 💭 Diario Sueños.' },
  { id: 'lab', n: 'Laboratorio mental + asesores', ico: '🔬', color: '#e8c56a',
    que: 'Tu taller interior: un lugar tuyo (playa de Penco, bosque, pieza ideal) con una silla y dos consejeros sabios que te escuchan. Sirve para pensar sin ruido.',
    cuando: 'Decisiones grandes, soledad, cuando necesitas consejo sin juicio.',
    como: 'En alfa entra a tu lugar. Sienta a tus 2 asesores (pueden ser abuela/o, maestra/o, personaje). Cuéntales el tema y escucha 2 minutos sin forzar. Agradece y sal contando 1-2-3.' },
  { id: 'guante', n: 'Guante de anestesia (calma el cuerpo)', ico: '🧤', color: '#e76e8a',
    que: 'Llevar calma a una zona tensa: imaginar la mano fresca e insensible como un guante y apoyarla (en imagen) donde duele o aprieta. Acompaña, no reemplaza al médico.',
    cuando: 'Dolor de cabeza tensional, muelas, espalda, nervios antes de dentista o prueba. Siempre + atención médica real.',
    como: 'En alfa imagina tu mano izquierda fresca, dormida y liviana. Apóyala en imagen sobre la zona 2 minutos respirando. Si el dolor es fuerte, nuevo o con fiebre: CESFAM primero.' }
];
var SV_AREAS = ['salud/cuerpo', 'estudio/memoria', 'trabajo/dinero', 'familia', 'pareja', 'hábito que quiero cambiar', 'sueño/descanso', 'paz interior', 'otro'];
var SV_ESTADOS = ['pendiente', 'en proceso', 'cumplido'];

/* ---------- racha ---------- */
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
   RENDER — Tecnicas
   ============================================================ */
function tecById(id) {
  for (var i = 0; i < SV_TECNICAS.length; i++) if (SV_TECNICAS[i].id === id) return SV_TECNICAS[i];
  return SV_TECNICAS[2];
}
function renderTecCards() {
  var box = $('svTecGrid'); if (!box) return;
  var e = store();
  var q = (($('svTecQ') || {}).value || '').toLowerCase();
  var fil = SV_TECNICAS.filter(function (t) {
    if (!q) return true;
    return (t.n + ' ' + t.que + ' ' + t.cuando + ' ' + t.como).toLowerCase().indexOf(q) >= 0;
  });
  box.innerHTML = fil.length ? fil.map(function (f) {
    var isFav = e.fav === f.id;
    return '<div class="menstrual-card" style="border-color:' + f.color + '66">' +
      '<h4 style="color:' + f.color + '">' + f.ico + ' ' + esc(f.n) + (isFav ? ' ⭐' : '') + '</h4>' +
      '<p style="font-size:12px;line-height:1.55"><b>Qué es:</b> ' + esc(f.que) + '<br><b>Cuándo:</b> ' + esc(f.cuando) + '<br><b>Cómo:</b> ' + esc(f.como) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn btn-accent" style="width:auto;font-size:11px" data-pract="' + esc(f.id) + '">🧘 Practicar</button>' +
      '<button type="button" class="btn" style="width:auto;font-size:11px" data-voz="' + esc(f.id) + '">🔊 Escuchar</button>' +
      '<button type="button" class="btn" style="width:auto;font-size:11px" data-fav="' + esc(f.id) + '">' + (isFav ? '⭐ Favorita' : '☆ Marcar') + '</button>' +
      '</div></div>';
  }).join('') : '<p class="muted">Sin resultados. Prueba con “alfa”, “sueño”, “agua”, “dedos”…</p>';
  box.querySelectorAll('[data-pract]').forEach(function (b) { b.onclick = function () { irAPractica(b.getAttribute('data-pract')); }; });
  box.querySelectorAll('[data-voz]').forEach(function (b) { b.onclick = function () { var f = tecById(b.getAttribute('data-voz')); speak(f.n + '. ' + f.que + ' ' + f.como); }; });
  box.querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { store().fav = b.getAttribute('data-fav'); persistStore(); save('Técnica favorita guardada ⭐'); renderTecCards(); renderPractica(); }; });
}
function irAPractica(tecId) {
  switchTab('Prac');
  var ts = $('svPracTec'); if (ts && tecId) ts.value = tecId;
  try { renderPractica(); } catch (e) {}
  try { $('svPracTec').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {}
}

/* ============================================================
   RENDER — Practica (centrado + contador + timer)
   ============================================================ */
var svCount = 0, svTimerIv = null, svTimerLeft = 0, svPaso = 0;
var SV_PASOS = [
  '1️⃣ Siéntate, pies en tierra, manos en las piernas. 3 respiraciones lentas…',
  '2️⃣ Cierra los ojos y míralos hacia arriba, a tu frente (20°). Suelta la mandíbula…',
  '3️⃣ Di dentro: «3… me relajo» — suelta cabeza, cuello y hombros.',
  '4️⃣ Di dentro: «2… más profundo» — suelta pecho, brazos y manos.',
  '5️⃣ Di dentro: «1… estoy en alfa» — quédate 1 minuto en calma. Ya puedes programar 🖥️.'
];
function svCountPaint() {
  var c = $('svCountNum'); if (c) c.textContent = String(svCount);
  var bar = $('svCountBar'); if (bar) bar.style.width = Math.min(100, Math.round(svCount / 21 * 100)) + '%';
  var p = $('svPasoTxt'); if (p) p.innerHTML = SV_PASOS[Math.min(svPaso, SV_PASOS.length - 1)];
}
function svBump(n) {
  svCount += (n || 1);
  persistTotal(n || 1);
  svCountPaint();
  try { renderAva(); } catch (x) {}
}
function persistTotal(n) {
  try { var e = store(); e.total += n; persistStore(); } catch (e2) {}
}
function svTimerStop(silent) {
  if (svTimerIv) { clearInterval(svTimerIv); svTimerIv = null; }
  if (!silent) { var l = $('svTimerLabel'); if (l) l.textContent = '⏱ Temporizador listo: 5, 10 o 15 min en alfa con tu técnica.'; }
}
function svTimerStart(mins) {
  svTimerStop(true);
  svTimerLeft = mins * 60;
  var l = $('svTimerLabel');
  function paint() {
    if (!l) return;
    var m = Math.floor(svTimerLeft / 60), s = svTimerLeft % 60;
    l.innerHTML = '🧘 En alfa… <b>' + m + ':' + String(s).padStart(2, '0') + '</b> · sostén tu pantalla o tu escena. <span class="muted">Cada minuto suma +1.</span>';
  }
  paint();
  svTimerIv = setInterval(function () {
    svTimerLeft--;
    if (svTimerLeft % 60 === 0) svBump(1);
    if (svTimerLeft <= 0) {
      svTimerStop(true);
      if (l) l.innerHTML = '🌅 <b>Centrado completo.</b> Cuenta 1-2-3 para salir, mueve manos y pies, toma agua y guarda tu sesión abajo.';
      try { if (typeof playNotifySound === 'function') playNotifySound(); } catch (e) {}
      try { speak('Centrado completo. Cuenta uno, dos, tres, abre los ojos, fresco y despierto.'); } catch (e2) {}
      return;
    }
    paint();
  }, 1000);
}
function svProgOptions(selectedId) {
  var d = store().prog.filter(function (r) { return r.estado !== 'cumplido'; });
  return '<option value="">Práctica libre (sin programación)</option>' + d.map(function (r) {
    return '<option value="' + r.id + '"' + (r.id === selectedId ? ' selected' : '') + '>' + esc((r.titulo || 'Sin título').slice(0, 40)) + ' · ' + (r.inten || 0) + '/10</option>';
  }).join('');
}
function renderPractica() {
  var sel = $('svPracProg'); if (!sel) return;
  var keep = sel.value || '';
  sel.innerHTML = svProgOptions(keep);
  var ts = $('svPracTec');
  if (ts && !ts.value) ts.value = store().fav || 'pantalla';
  svCountPaint();
  var fb = $('svPracFavBox');
  if (fb) { var f = tecById((ts && ts.value) || store().fav || 'pantalla'); fb.innerHTML = '<span class="chip" style="border-color:' + f.color + '88;color:' + f.color + ';display:block;white-space:normal;line-height:1.5">' + f.ico + ' ' + esc(f.n) + ': ' + esc(f.como) + '</span>'; }
}
function guardarSesion() {
  var progId = ($('svPracProg') || {}).value || '';
  var tec = ($('svPracTec') || {}).value || 'pantalla';
  var antes = +(($('svAntes') || {}).value || 5);
  var despues = +(($('svDespues') || {}).value || 5);
  var insight = clean((($('svInsight') || {}).value || '').trim(), 300);
  var ciclos = svCount || +(($('svCiclos') || {}).value || 0) || 0;
  if (!ciclos && !insight) { if (!confirm('Aún no sumaste ciclos. ¿Guardar igual la sesión?')) return; }
  var titulo = 'Práctica libre en alfa';
  if (progId) {
    var r = null, dd = store().prog;
    for (var i = 0; i < dd.length; i++) if (dd[i].id === progId) r = dd[i];
    if (r) {
      titulo = r.titulo;
      r.estado = despues <= 2 ? 'cumplido' : 'en proceso';
    }
  }
  store().ses.push({ id: uid('ss'), fecha: (($('svPracFecha') || {}).value) || todayKey(), progId: progId, titulo: titulo, tec: tec, ciclos: ciclos, antes: antes, despues: despues, insight: insight });
  persistStore();
  save('Sesión guardada 🧠');
  svCount = 0; svPaso = 0; svCountPaint();
  try { $('svInsight').value = ''; } catch (e) {}
  renderSes(); renderProg(); renderAva(); renderPractica();
  switchTab('Ses');
}

/* ============================================================
   RENDER — Programaciones (deseos/proyectos)
   ============================================================ */
var svProgEditId = null;
function renderProg() {
  var box = $('svProgList'); if (!box) return;
  var q = (($('svProgQ') || {}).value || '').toLowerCase();
  var f = ($('svProgF') || {}).value || 'todas';
  var d = store().prog.slice().sort(function (a, b) { return (b.inten || 0) - (a.inten || 0); });
  var fil = d.filter(function (r) {
    if (f !== 'todas' && r.estado !== f) return false;
    if (q && ((r.titulo || '') + ' ' + (r.escena || '') + ' ' + (r.nota || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  box.innerHTML = fil.length ? fil.map(function (r) {
    var col = r.estado === 'cumplido' ? '#8fd694' : (r.estado === 'en proceso' ? '#e8c56a' : '#c9a9c9');
    var t = tecById(r.tec);
    return '<div class="habit-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><span><b>' + esc(r.titulo) + '</b></span>' +
      '<span class="chip" style="font-size:10px;border-color:' + col + '55;color:' + col + '">' + esc(r.estado || 'pendiente') + ' · ' + (r.inten || 0) + '/10</span></div>' +
      '<div class="muted" style="font-size:11px;margin-top:4px">' + t.ico + ' ' + esc(t.n) + (r.area ? ' · 🏷️ ' + esc(r.area) : '') + ' · ' + esc(lunaTxt(r.fecha) || '') + (r.escena ? '<br>🎬 ' + esc(r.escena) : '') + (r.nota ? '<br>📝 ' + esc(r.nota) : '') + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' +
      '<button class="btn btn-accent" style="width:auto;font-size:11px" data-prog="' + r.id + '">🧘 Programar</button>' +
      '<button class="btn" style="width:auto;font-size:11px" data-next="' + r.id + '">⏭ ' + (r.estado === 'pendiente' ? 'en proceso' : r.estado === 'en proceso' ? 'cumplido' : 'reabrir') + '</button>' +
      '<button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️</button>' +
      '<button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin programaciones. Agrega 1 deseo concreto arriba: lo que se ve claro en la pantalla, se programa.</p>';
  var st = $('svProgStats');
  if (st) st.textContent = d.length + ' programaciones · ' + d.filter(function (r) { return r.estado === 'cumplido'; }).length + ' cumplidas 🌅';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar esta programación?')) return; var dd = store().prog; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); persistStore(); save(); renderProg(); renderAva(); renderPractica(); }; });
  box.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { var dd = store().prog; var r = dd.find(function (x) { return x.id === b.getAttribute('data-next'); }); if (!r) return; r.estado = r.estado === 'pendiente' ? 'en proceso' : (r.estado === 'en proceso' ? 'cumplido' : 'pendiente'); persistStore(); save(r.estado === 'cumplido' ? 'Cumplido 🌅 ¡celébralo!' : 'Guardado'); renderProg(); renderAva(); renderPractica(); }; });
  box.querySelectorAll('[data-prog]').forEach(function (b) { b.onclick = function () { switchTab('Prac'); renderPractica(); var s = $('svPracProg'); if (s) s.value = b.getAttribute('data-prog'); }; });
  box.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { var dd = store().prog; var r = dd.find(function (x) { return x.id === b.getAttribute('data-edit'); }); if (!r) return; svProgEditId = r.id;
    $('svProgTitulo').value = r.titulo || ''; $('svProgEscena').value = r.escena || ''; $('svProgArea').value = r.area || SV_AREAS[0]; $('svProgTec').value = r.tec || 'espejo'; $('svProgInten').value = String(r.inten || 5); $('svProgEstado').value = r.estado || 'pendiente'; $('svProgNota').value = r.nota || '';
    $('svProgAdd').textContent = '↻ Actualizar'; $('svProgCancel').classList.remove('hidden');
  }; });
}

/* ============================================================
   RENDER — Sesiones + Avance
   ============================================================ */
function renderSes() {
  var box = $('svSesList'); if (!box) return;
  var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = d.length ? d.slice(0, 40).map(function (r) {
    var f = tecById(r.tec);
    return '<div class="habit-item"><b>🧠 ' + esc(r.fecha) + '</b> · ' + f.ico + ' ' + esc(f.n) + ' · ×' + (+r.ciclos || 0) +
      '<br><span class="muted" style="font-size:11px">🎯 ' + esc(r.titulo || 'libre') + ' · ' + r.antes + '→' + r.despues + '/10 · ' + esc(lunaTxt(r.fecha)) + '</span>' +
      (r.insight ? '<p style="font-size:12px">💡 ' + esc(r.insight) + '</p>' : '') +
      '<div style="display:flex;gap:6px;margin-top:4px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin sesiones aún. Ve a 🧘 Práctica y regálate 10 minutos en alfa hoy.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar sesión?')) return; var dd = store().ses; var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); persistStore(); save(); renderSes(); renderAva(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = store().ses; var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🧠 Mi práctica Silva ' + r.fecha, '🎯 ' + (r.titulo || '') + '\n' + tecById(r.tec).n + ' ×' + r.ciclos + ' (' + r.antes + '→' + r.despues + '/10)' + (r.insight ? '\n💡 ' + r.insight : '')); }; });
  var st = $('svSesStats');
  if (st) { var c = d.reduce(function (a, r) { return a + (+r.ciclos || 0); }, 0); st.textContent = d.length + ' sesiones · ×' + c + ' ciclos · racha ' + rachaDias() + ' días'; }
}
function renderAva() {
  var box = $('svAvaBox'); if (!box) return;
  var e = store();
  var pr = e.prog, ses = e.ses;
  var ok = pr.filter(function (r) { return r.estado === 'cumplido'; }).length;
  var pct = pr.length ? Math.round(ok / pr.length * 100) : 0;
  var ciclos = ses.reduce(function (a, r) { return a + (+r.ciclos || 0); }, 0);
  var vida = (e.total || 0) > ciclos ? (e.total || 0) : ciclos;
  var porTec = {};
  ses.forEach(function (r) { porTec[r.tec] = (porTec[r.tec] || 0) + 1; });
  var top = Object.keys(porTec).sort(function (a, b) { return porTec[b] - porTec[a]; })[0];
  box.innerHTML = '<p class="muted" style="font-size:11px">🌅 Programaciones cumplidas: <b>' + ok + '/' + pr.length + '</b> (' + pct + '%)</p>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">🧘 ' + ses.length + ' sesiones · 🔁 ×' + vida + ' ciclos de vida · 🔥 racha ' + rachaDias() + ' días' + (top ? ' · técnica más usada: <b>' + esc(tecById(top).n) + '</b>' : '') + '</p>' +
    '<p class="muted" style="font-size:11px">Ritmo sugerido: 10 min al día (mañana o noche). Luna creciente → programar metas; luna llena → cargar la escena con emoción; menguante → soltar y agradecer.</p>';
}
function renderAll() { try { renderTecCards(); } catch (e) {} try { renderPractica(); } catch (e) {} try { renderProg(); } catch (e) {} try { renderSes(); } catch (e) {} try { renderAva(); } catch (e) {} }

/* ============================================================
   DIALOGO
   ============================================================ */
function buildDialog() {
  var tecOpts = SV_TECNICAS.map(function (t) { return '<option value="' + t.id + '">' + t.ico + ' ' + esc(t.n) + '</option>'; }).join('');
  makeDialog('silvaDialog', '🧠 Método Silva — calma tu mente, programa tu día',
    'El método de <b>José Silva</b> para entrar a <b>alfa</b> (mente tranquila y enfocada) y desde ahí <b>visualizar, decidir y estudiar mejor</b>. 10 minutos, 1 técnica, 1 escena a la vez. Todo queda <b>privado y local</b>.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabSvGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabSvTec" class="btn" style="width:auto">🧰 Técnicas</button>' +
    '<button type="button" id="tabSvPrac" class="btn" style="width:auto">🧘 Práctica</button>' +
    '<button type="button" id="tabSvProg" class="btn" style="width:auto">🎯 Programar</button>' +
    '<button type="button" id="tabSvSes" class="btn" style="width:auto">📓 Sesiones</button>' +
    '<button type="button" id="tabSvAva" class="btn" style="width:auto">📊 Mi avance</button></div>' +

    '<div id="svGuia">' +
      '<div class="si-card"><h4>🧠 ¿Qué es el Método Silva?</h4><p>Es un entrenamiento de <b>control mental</b> creado por <b>José Silva</b> (Texas, 1966): aprendes a bajar a propósito tu ritmo cerebral a <b>alfa (7–14 Hz)</b> —ese estado entre dormido y despierto donde imaginas vívido y te concentras mejor— y desde ahí <b>programas</b> lo que quieres: memoria, calma, salud de hábitos, decisiones y metas. No es magia: es <b>relajación + visualización + repetición</b>, lo mismo que usan deportistas y estudiantes. Su curso se llama hoy <i>Silva Ultramind</i> y se enseña en decenas de países.</p></div>' +
      '<div class="si-card"><h4>👨‍🔧 José Silva en 1 minuto</h4><p>Técnico en electrónica sin universidad que estudiaba hipnosis y ritmos cerebrales. Entrenó primero a sus hijos a <b>estudiar en alfa</b> (mejoraron las notas), luego a vecinos de Laredo, y en 1966 lanzó <i>Mind Control</i>. Sus 3 ideas: <b>1)</b> puedes entrar a alfa a voluntad · <b>2)</b> en alfa la imagen manda (lo que ves claro, lo actúas) · <b>3)</b> programar de noche + actuar de día cambia resultados.</p></div>' +
      '<div class="si-card"><h4>🌊 Beta · Alfa · Theta (en simple)</h4><p><b>Beta (14–21 Hz):</b> despierto apurado, parloteo, celu, micro. Sirve para actuar, no para programar.<br><b>Alfa (7–14 Hz):</b> tranquilo, cuerpo suelto, imagen viva. Aquí se estudia, se visualiza y se decide bien.<br><b>Theta (4–7 Hz):</b> borde del sueño, imágenes sueltas. Se visita al dormir, no se fuerza.<br>El Método Silva trabaja en <b>alfa con conciencia</b>: relajado pero despierto, al mando.</p></div>' +
      '<div class="si-card"><h4>💎 Los 3 principios</h4><p><b>1) El estado manda:</b> primero calma (3-2-1), después contenido. Sin calma no hay programa.<br><b>2) La escena final manda:</b> ve el resultado YA logrado 1 minuto con emoción (alegría, alivio), no el esfuerzo.<br><b>3) Una cosa a la vez:</b> 1 programación 7–14 días. El que programa 10 cosas, programa ninguna.</p></div>' +
      '<div class="si-card"><h4>🕯️ Práctica de 10 minutos (paso a paso)</h4><p><b>1)</b> Siéntate, 3 respiraciones.<br><b>2)</b> Cuenta 3-2-1 con ojos arriba (pestaña 🧘 Práctica te guía).<br><b>3)</b> Proyecta tu escena final 1–2 minutos (pantalla o espejo).<br><b>4)</b> Une tus 3 dedos y di tu frase («cada día mejor»).<br><b>5)</b> Sal contando 1-2-3, toma agua y anota 1 línea. Listo: actúa de día lo que programaste de mañana/noche.</p></div>' +
      '<div class="si-card"><h4>🌙 Silva y tus 13 lunas</h4><p><b>Creciente</b> → programa metas y estudio (siembra). <b>Llena</b> → carga tu escena con emoción fuerte. <b>Menguante</b> → suelta el cómo y agradece (vaso de agua, espejo en azul→blanco). <b>Nueva</b> → elige tu 1 programación de la luna. Cada sesión queda marcada con su luna en 📓 Sesiones.</p></div>' +
      '<div class="si-card"><h4>⚠️ Cuidados</h4><p>Es <b>entrenamiento educativo</b>: no diagnostica ni cura. Ante dolor fuerte, insomnio de semanas, angustia o ideas de daño, ve a tu <b>CESFAM / *4141 (Chile, 24 h)</b> además de practicar. No dejes tratamientos para “programar”. Y desconfía de quien te venda “alfa milagroso” por mucha plata: el método real es práctica diaria simple.</p></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="svGoTec" class="btn btn-accent" style="width:auto">🧰 Conocer las técnicas →</button> <button type="button" id="svGoPrac" class="btn" style="width:auto">🧘 Centrarme ahora →</button></div>' +
    '</div>' +

    '<div id="svTec" class="hidden">' +
      '<div class="conv-row"><label style="flex:2">🔍 Buscar <input type="text" id="svTecQ" placeholder="ej: alfa, sueño, agua, dedos, espejo..." autocomplete="off"></label></div>' +
      '<div id="svTecGrid"></div></div>' +

    '<div id="svPrac" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧘 Centrado guiado en alfa</h4>' +
      '<div class="conv-row"><label style="flex:2">🎯 Programación <select id="svPracProg"></select></label><label>📅 Fecha <input type="date" id="svPracFecha"></label></div>' +
      '<div class="conv-row"><label style="flex:2">🧰 Técnica <select id="svPracTec">' + tecOpts + '</select></label></div>' +
      '<div id="svPracFavBox" style="margin:6px 0"></div>' +
      '<div class="menstrual-card" style="background:var(--panel);text-align:center"><div class="muted" style="font-size:11px">PASO A PASO (toca Siguiente)</div>' +
      '<div id="svPasoTxt" style="font-size:13px;line-height:1.6;margin:6px 0;min-height:44px"></div>' +
      '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap"><button type="button" id="svPasoBtn" class="btn btn-accent" style="width:auto">Siguiente →</button>' +
      '<button type="button" id="svPasoReset" class="btn" style="width:auto">↺ Reiniciar</button>' +
      '<button type="button" id="svVozGuia" class="btn" style="width:auto">🔊 Guía por voz</button></div></div>' +
      '<div class="menstrual-card" style="background:var(--panel);text-align:center;margin-top:8px"><div style="font-size:11px" class="muted">CICLOS EN ALFA (meta dulce: 21)</div>' +
      '<div id="svCountNum" style="font-size:44px;font-weight:800;color:var(--gold)">0</div>' +
      '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin:6px 0"><div id="svCountBar" style="width:0%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
      '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap"><button type="button" id="svPlus1" class="btn btn-accent" style="width:auto;font-size:15px">+1 🧠</button>' +
      '<button type="button" id="svPlus5" class="btn" style="width:auto">+5</button>' +
      '<button type="button" id="svZero" class="btn" style="width:auto">↺ 0</button></div>' +
      '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px"><button type="button" id="svT5" class="btn" style="width:auto">⏱ 5 min</button>' +
      '<button type="button" id="svT10" class="btn" style="width:auto">⏱ 10 min</button><button type="button" id="svT15" class="btn" style="width:auto">⏱ 15 min</button>' +
      '<button type="button" id="svTStop" class="btn" style="width:auto">⏹ Detener</button></div>' +
      '<div id="svTimerLabel" class="muted" style="font-size:11px;margin-top:6px">⏱ Temporizador listo: 5, 10 o 15 min en alfa con tu técnica.</div></div>' +
      '<div class="conv-row" style="margin-top:8px"><label>Tensión antes (0–10) <input type="number" id="svAntes" min="0" max="10" value="6" style="width:80px"></label>' +
      '<label>Calma después (0–10) <input type="number" id="svDespues" min="0" max="10" value="3" style="width:80px"></label>' +
      '<label style="flex:1">Ciclos manuales <input type="number" id="svCiclos" min="0" value="0" style="width:90px"></label></div>' +
      '<label>💡 Insight / escena que vi <input type="text" id="svInsight" placeholder="ej: me vi rindiendo tranquila, sonreí al entregar" maxlength="300"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="svGuardarSes" class="btn btn-accent" style="width:auto">🌅 Guardar sesión</button></div>' +
      '<p class="muted" style="font-size:11px">Tip: para salir di dentro «1… salgo, 2… me muevo, 3… ojos abiertos, fresco y despierto». Toma agua.</p></div>' +
    '</div>' +

    '<div id="svProg" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ ¿Qué quiero programar?</h4>' +
      '<div class="conv-row"><label style="flex:2">Deseo / meta * <input type="text" id="svProgTitulo" placeholder="ej: rendir tranquila el examen de mate" maxlength="60"></label><label>Con técnica <select id="svProgTec">' + tecOpts + '</select></label></div>' +
      '<label>🎬 Escena final (ya logrado, en presente) <input type="text" id="svProgEscena" placeholder="ej: entrego la prueba sonriendo, sé que me fue bien" maxlength="140"></label>' +
      '<div class="conv-row"><label>Área <select id="svProgArea">' + SV_AREAS.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select></label>' +
      '<label>Carga/importancia (0–10) <input type="number" id="svProgInten" min="0" max="10" value="6" style="width:80px"></label>' +
      '<label>Estado <select id="svProgEstado"><option>pendiente</option><option>en proceso</option><option>cumplido</option></select></label></div>' +
      '<label>Nota <input type="text" id="svProgNota" placeholder="ej: programo 10 min cada mañana por 2 semanas + estudio 40 min" maxlength="120"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="svProgAdd" class="btn btn-accent" style="width:auto">+ Agregar</button><button type="button" id="svProgCancel" class="btn hidden" style="width:auto">Cancelar</button></div>' +
      '<p class="muted" style="font-size:11px">Fórmula Silva: escena en presente + emoción + 1 acción real de día. Sin acción, no hay programa.</p></div>' +
      '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="svProgQ" placeholder="meta, escena..." autocomplete="off"></label>' +
      '<label>Estado <select id="svProgF"><option value="todas">Todas</option><option value="pendiente">Pendientes</option><option value="en proceso">En proceso</option><option value="cumplido">Cumplidas</option></select></label></div>' +
      '<div id="svProgList" class="habits-list" style="margin-top:8px;max-height:300px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="svProgStats" class="muted" style="font-size:11px"></span>' +
      '<span style="display:flex;gap:8px"><button type="button" id="svProgShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="svProgClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar cumplidas</button></span></div>' +
    '</div>' +

    '<div id="svSes" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📓 Mis sesiones en alfa</h4>' +
      '<p class="muted" style="font-size:11px">Cada centrado cuenta, aunque la calma suba solo 1 punto. La constancia programa más que la intensidad.</p>' +
      '<div id="svSesList" class="habits-list" style="max-height:320px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="svSesStats" class="muted" style="font-size:11px"></span>' +
      '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="svSesToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button>' +
      '<button type="button" id="svSesShareAll" class="btn" style="width:auto">📤 Compartir</button>' +
      '<button type="button" id="svSesClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '</div>' +

    '<div id="svAva" class="hidden"><div id="svAvaBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
      '<div class="si-card"><h4>🌙 Cierre de luna (ritual de 3 líneas)</h4><p>Cada fin de luna responde en tu cuaderno o en 📝 nota del día:<br><b>1)</b> ¿Qué programé esta luna?<br><b>2)</b> ¿Qué acción real hice cada día?<br><b>3)</b> ¿Qué suelto y qué sigo?<br>Termina uniendo tus 3 dedos: «cada día, en todo sentido, estoy mejor».</p></div></div>');
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
      if (v === 'silva' && !$('svOpenFromMetodos')) {
        var fab = document.createElement('div');
        fab.innerHTML = '<button type="button" id="svOpenFromMetodos" class="btn btn-accent" style="width:auto;margin-top:8px">🧠 Abrir mi Método Silva completo</button>';
        var f = dlg.querySelector('form') || dlg;
        f.appendChild(fab);
        var nb = $('svOpenFromMetodos');
        if (nb) nb.onclick = function () { try { dlg.close(); } catch (e) {} openSilva(); };
      }
      if (v !== 'silva') { var old = $('svOpenFromMetodos'); if (old && old.parentNode) old.parentNode.remove(); }
    }, 800);
    setTimeout(function () { clearInterval(iv); }, 1000 * 60 * 10);
  } catch (e) {}
}

function openSilva() {
  try {
    var pf = $('svPracFecha'); if (pf && !pf.value) pf.value = todayKey();
    renderAll();
  } catch (e) {}
  openDlg('silvaDialog');
}
try { window.openSilva = openSilva; window.openSilvaDialog = openSilva; window.openMetodoSilva = openSilva; } catch (e) {}

/* ---------- setup ---------- */
function setup() {
  /* 1) inyectar boton en Linaje > Interior (tras Ho'oponopono si existe) */
  try {
    if (!$('btnSilva')) {
      var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnSilva'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🧠 Método Silva';
        try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'silva metodo silva jose silva ultramind mind control alfa theta beta 321 pantalla mental espejo mente tres dedos vaso agua despertar laboratorio asesores programar visualizar concentracion memoria examen entrevista dormir suenos');
        var ref = g.querySelector('#btnHooponopono') || g.querySelector('#btnCuartoCamino') || g.querySelector('#btnMetodos');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var cur = $('btnSilva');
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
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnSilva') < 0) ALL_BTNS.push('btnSilva');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnSilva = ['linaje', 'interior'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['linaje|interior'] && BTN_ORDER['linaje|interior'].indexOf('btnSilva') < 0) {
      var oi = BTN_ORDER['linaje|interior'].indexOf('btnHooponopono');
      if (oi >= 0) BTN_ORDER['linaje|interior'].splice(oi + 1, 0, 'btnSilva');
      else BTN_ORDER['linaje|interior'].push('btnSilva');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      ['adolescente', 'estudiante', 'salud', 'docente', 'mayor'].forEach(function (p) {
        if (PRESETS[p]) PRESETS[p].btnSilva = true;
      });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnSilva"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnSilva"> 🧠 Método Silva';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnSilva !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnSilva = lab.querySelector('input').checked;
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
  /* keywords cruzadas */
  try { addKw('btnMetodos', 'silva alfa programar visualizar'); } catch (e2) {}
  try { addKw('btnBreath', 'silva alfa calma centrado relajacion'); } catch (e3) {}
  try { addKw('btnDreams', 'silva suenos control programar dormir'); } catch (e4) {}
  try { addKw('btnGratitud', 'silva programar agradecer escena'); } catch (e5) {}
  try { addKw('btnStudy', 'silva alfa memoria examen concentracion'); } catch (e6) {}

  /* 4) dialogo + eventos */
  buildDialog();
  renderAll();

  var b = $('btnSilva');
  if (b) b.onclick = function () { openSilva(); };

  ['Guia', 'Tec', 'Prac', 'Prog', 'Ses', 'Ava'].forEach(function (t) {
    var tb = $('tabSv' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });
  var gt = $('svGoTec'); if (gt) gt.onclick = function () { switchTab('Tec'); renderTecCards(); };
  var gp = $('svGoPrac'); if (gp) gp.onclick = function () { switchTab('Prac'); renderPractica(); };
  var tq = $('svTecQ'); if (tq) tq.oninput = function () { renderTecCards(); };

  var spb = $('svPasoBtn');
  if (spb) spb.onclick = function () { if (svPaso < SV_PASOS.length - 1) svPaso++; svBump(1); };
  var spr = $('svPasoReset');
  if (spr) spr.onclick = function () { svPaso = 0; svCountPaint(); };
  var svg = $('svVozGuia');
  if (svg) svg.onclick = function () {
    var tec = ($('svPracTec') || {}).value || 'pantalla';
    var f = tecById(tec);
    speak('Cierra los ojos. Tres. Me relajo. Dos. Más profundo. Uno. Estoy en alfa. Ahora: ' + f.como + ' Quédate un minuto en tu escena. Gracias.');
  };

  var p1 = $('svPlus1'); if (p1) p1.onclick = function () { svBump(1); };
  var p5 = $('svPlus5'); if (p5) p5.onclick = function () { svBump(5); };
  var z0 = $('svZero'); if (z0) z0.onclick = function () { svCount = 0; svCountPaint(); };
  var t5 = $('svT5'); if (t5) t5.onclick = function () { svTimerStart(5); };
  var t10 = $('svT10'); if (t10) t10.onclick = function () { svTimerStart(10); };
  var t15 = $('svT15'); if (t15) t15.onclick = function () { svTimerStart(15); };
  var tst = $('svTStop'); if (tst) tst.onclick = function () { svTimerStop(false); };
  var pt = $('svPracTec'); if (pt) pt.onchange = function () { renderPractica(); };
  var gs = $('svGuardarSes'); if (gs) gs.onclick = function () { guardarSesion(); };

  var sa = $('svProgAdd');
  if (sa) sa.onclick = function () {
    var t = clean(($('svProgTitulo').value || '').trim(), 60); if (!t) return alert('Escribe lo que quieres programar');
    var esc1 = clean(($('svProgEscena').value || '').trim(), 140); if (!esc1) return alert('Describe tu escena final (ya logrado)');
    var rec = { id: svProgEditId || uid('sv'), titulo: t, escena: esc1, tec: $('svProgTec').value || 'espejo', area: $('svProgArea').value || 'otro', inten: Math.max(0, Math.min(10, +$('svProgInten').value || 0)), estado: $('svProgEstado').value || 'pendiente', nota: clean($('svProgNota').value, 120), fecha: todayKey() };
    var dd = store().prog;
    if (svProgEditId) { var i = dd.findIndex(function (x) { return x.id === svProgEditId; }); if (i >= 0) dd[i] = rec; svProgEditId = null; $('svProgAdd').textContent = '+ Agregar'; $('svProgCancel').classList.add('hidden'); }
    else dd.push(rec);
    persistStore(); save('Programación guardada 🧠');
    $('svProgTitulo').value = ''; $('svProgEscena').value = ''; $('svProgNota').value = '';
    renderProg(); renderAva(); renderPractica();
  };
  var sc = $('svProgCancel');
  if (sc) sc.onclick = function () { svProgEditId = null; $('svProgAdd').textContent = '+ Agregar'; sc.classList.add('hidden'); ['svProgTitulo', 'svProgEscena', 'svProgNota'].forEach(function (id) { var el = $(id); if (el) el.value = ''; }); };
  var sq = $('svProgQ'); if (sq) sq.oninput = function () { renderProg(); };
  var sf = $('svProgF'); if (sf) sf.onchange = function () { renderProg(); };
  var ss = $('svProgShare');
  if (ss) ss.onclick = function () { var dd = store().prog; if (!dd.length) return alert('Sin programaciones'); share('🧠 Lo que estoy programando (' + dd.length + ')', dd.map(function (r) { return '· ' + r.titulo + ' (' + r.estado + ' ' + r.inten + '/10)\n  🎬 ' + (r.escena || ''); }).join('\n')); };
  var scl = $('svProgClear');
  if (scl) scl.onclick = function () { if (!confirm('¿Borrar las programaciones ya cumplidas?')) return; var e = store(); e.prog = e.prog.filter(function (r) { return r.estado !== 'cumplido'; }); persistStore(); save(); renderProg(); renderAva(); renderPractica(); };

  var stn = $('svSesToNote');
  if (stn) stn.onclick = function () {
    var last = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); })[0];
    if (!last) return alert('Sin sesiones aún');
    var txt = ('🧠 Silva: ' + tecById(last.tec).n + ' ×' + last.ciclos + ' · ' + (last.titulo || '') + ' (' + last.antes + '→' + last.despues + '/10)').slice(0, 280);
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt; }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt; }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };
  var ssa = $('svSesShareAll');
  if (ssa) ssa.onclick = function () {
    var d = store().ses.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 7);
    var t = d.length ? '🧠 Mis prácticas Silva (últimas)\n' + d.map(function (r) { return '• ' + r.fecha + ' · ' + tecById(r.tec).n + ' ×' + r.ciclos + ' · ' + (r.titulo || '') + ' (' + r.antes + '→' + r.despues + ')'; }).join('\n') : '🧠 Sin sesiones aún';
    share('Mi Método Silva', t);
  };
  var scl2 = $('svSesClear');
  if (scl2) scl2.onclick = function () { if (!confirm('¿Borrar todo tu historial de sesiones? (las programaciones se mantienen)')) return; store().ses = []; persistStore(); save(); renderSes(); renderAva(); };

  /* 5) puente Metodos */
  try { puenteMetodos(); } catch (e) {}
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 400); });
else setTimeout(setup, 400);

})();
