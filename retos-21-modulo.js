/* ============================================================
   RETOS — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnRetos21 (🔥 Retos) en Mi Día > Organizar
   - Diálogo retos21Dialog (id histórico, título "🔥 Retos") con 5 pestañas:
     1) 📋 Catálogo (12 plantillas con plan día a día y progresión en 3 fases)
     2) 🚀 Mis retos (activos, progreso, racha, archivar, duplicar, editar)
     3) 📅 Día a día (detalle del reto: grilla N días, check diario,
        notas, editar tarea, llevar días al calendario)
     4) ➕ Armar plan (constructor a medida: duración 3-90 días,
        hábito / lista / progresivo / combinado + plantillas propias)
     5) 🏆 Guía y logros
   - Duración flexible: 7 · 14 · 21 · 30 · 66 o personalizada (3-90).
     Fases adaptativas por tercios: 🌱 Siembra · 🌿 Brote · 🌸 Florece.
   - Calendario: llevar los N días, lo que falta o un día suelto como
     agenda [Reto xxxxx] con hora y aviso 🔔; también quitar del
     calendario (reconoce tags antiguos [R21 xxxxx]). Todo con
     lunaMapForKey, válido dentro del ciclo de 13 lunas visible.
   - Todo local y privado por usuario: userData().retos
     (migra y espeja userData().retos21 por compatibilidad)
     { activos:[], archivo:[], customs:[] }
     activo = { id, tag, plantillaId, nombre, icono, cat,
       inicio:'yyyy-mm-dd', hora:'HH:MM', conAviso:bool, total:21,
       checks:{1:true..}, notas:{}, creado, dias?:[N] }
   - 100% offline, sin dependencias.
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

/* ---------- fechas ---------- */
function parseKey(key) {
  var p = String(key || '').split('-');
  return { y: +p[0], m: +p[1], d: +p[2] };
}
function keyFromUTC(ms) {
  var d = new Date(ms);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
function addDays(key, n) {
  var p = parseKey(key);
  return keyFromUTC(Date.UTC(p.y, p.m - 1, p.d, 12) + n * 86400000);
}
function diffDays(a, b) {
  try {
    var pa = parseKey(a), pb = parseKey(b);
    return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d, 12) - Date.UTC(pa.y, pa.m - 1, pa.d, 12)) / 86400000);
  } catch (e) { return 0; }
}
function fmtFecha(key) {
  try {
    var p = parseKey(key);
    var d = new Date(Date.UTC(p.y, p.m - 1, p.d, 12));
    return cal.fmtDate.format(d);
  } catch (e) { return key; }
}
function validKey(k) { return /^\d{4}-\d{2}-\d{2}$/.test(k || ''); }
function validHora(h) { return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(h || ''); }
function clampDur(n) {
  n = parseInt(n, 10);
  if (isNaN(n)) return 21;
  return Math.min(90, Math.max(3, n));
}

/* ---------- calendario ---------- */
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
function pushAgenda(fechaKey, hora, texto, conAviso) {
  var hhmm = validHora(hora) ? hora : '10:00';
  var hh = parseInt(hhmm.split(':')[0], 10), mm = parseInt(hhmm.split(':')[1], 10);
  hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var r = celdaPara(fechaKey);
  if (r.error) return { ok: false, error: r.error };
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + texto + ' ' + hhmm : texto + ' ' + hhmm;
      return { ok: true, dft: true };
    } catch (e) { return { ok: false, error: 'No se pudo guardar en el DFT.' }; }
  }
  if (conAviso) { try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {} }
  // evita duplicar el mismo tag + día
  var ya = r.cell.agenda.some(function (a) { return String(a.text || '').indexOf(texto.slice(0, 24)) >= 0; });
  if (!ya) r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 5), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  return { ok: true };
}
// tag corto (últimos 5 del id) sirve para borrar tanto [R21 x] antiguos como [Reto x] nuevos
function tagCorto(reto) { return String(reto.id || '').slice(-5); }

/* ---------- store (migra retos21 -> retos) ---------- */
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { activos: [], archivo: [], customs: [] };
    if (!u.retos && u.retos21) u.retos = u.retos21;
    if (!u.retos) u.retos = { activos: [], archivo: [], customs: [] };
    var s = u.retos;
    if (!Array.isArray(s.activos)) s.activos = [];
    if (!Array.isArray(s.archivo)) s.archivo = [];
    if (!Array.isArray(s.customs)) s.customs = [];
    var norm = function (r) {
      if (!r.checks) r.checks = {};
      if (!r.notas) r.notas = {};
      if (!r.tag) r.tag = '[Reto ' + String(r.id || 'x').slice(-5) + ']';
      if (!r.hora) r.hora = '10:00';
      if (!r.inicio) r.inicio = todayKey();
      if (!r.total) r.total = (r.dias && r.dias.length) ? r.dias.length : 21;
      r.total = clampDur(r.total);
    };
    s.activos.forEach(norm);
    s.archivo.forEach(norm);
    // espejo por compatibilidad con versiones anteriores
    try { u.retos21 = s; } catch (e) {}
    return s;
  } catch (e) { return { activos: [], archivo: [], customs: [] }; }
}

/* ---------- duración / fases / progreso ---------- */
function totalDias(reto) {
  if (reto.total) return clampDur(reto.total);
  if (reto.dias && reto.dias.length) return reto.dias.length;
  return 21;
}
function tercios(total) {
  total = clampDur(total);
  var t1 = Math.max(1, Math.ceil(total / 3));
  var t2 = Math.max(t1 + 1, Math.ceil(total * 2 / 3));
  if (t2 >= total) t2 = total - 1;
  return { t1: t1, t2: t2 };
}
function faseDe(n, total) {
  total = clampDur(total || 21);
  var t = tercios(total);
  if (n <= t.t1) return { n: 1, nombre: '🌱 Siembra', desc: 'Suave: instala el hábito sin pelear.' };
  if (n <= t.t2) return { n: 2, nombre: '🌿 Brote', desc: 'Sube la exigencia de a poco.' };
  return { n: 3, nombre: '🌸 Florece', desc: 'Consolida: tu mejor versión del reto.' };
}
function fechaDeDia(reto, n) { return addDays(reto.inicio, n - 1); }
function diaNumHoy(reto) { return diffDays(reto.inicio, todayKey()) + 1; }
function hechos(reto) {
  var c = 0, T = totalDias(reto);
  for (var n = 1; n <= T; n++) if (reto.checks[n]) c++;
  return c;
}
function pct(reto) { var T = totalDias(reto); return T ? Math.round(hechos(reto) / T * 100) : 0; }
function rachaActual(reto) {
  var T = totalDias(reto);
  var hoy = diaNumHoy(reto);
  var desde = Math.min(Math.max(hoy, 1), T);
  var r = 0;
  for (var n = desde; n >= 1; n--) {
    if (reto.checks[n]) r++;
    else if (n < hoy) break;
    else continue; // días futuros no cortan racha
  }
  return r;
}
function estadoDia(reto, n) {
  if (reto.checks[n]) return 'hecho';
  var hoy = diaNumHoy(reto);
  if (n === hoy) return 'hoy';
  if (n < hoy) return 'pendiente-atrasado';
  return 'pendiente';
}

/* ---------- catálogo: 12 retos con progresión real ---------- */
function D(t, d) { return { t: t, d: d || '' }; }
function buildCatalogo() {
  var vasos = [4, 4, 5, 5, 6, 6, 7, 6, 7, 7, 8, 8, 8, 9, 8, 8, 9, 9, 10, 10, 10];
  var camMin = [10, 12, 12, 15, 15, 18, 20, 20, 22, 22, 25, 25, 28, 30, 30, 30, 32, 35, 35, 40, 45];
  var calmaMin = [3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 10, 10, 11, 12, 12, 13, 14, 15];
  var leePag = [5, 5, 8, 8, 10, 10, 12, 12, 14, 14, 16, 16, 18, 20, 20, 22, 22, 25, 25, 28, 30];
  var ahorro = [500, 500, 500, 700, 700, 700, 1000, 700, 700, 1000, 1000, 1000, 1200, 1500, 1000, 1000, 1200, 1500, 1500, 2000, 2000];
  var gratitud = [
    '3 cosas buenas de hoy', 'una persona que te ayudó', 'algo de tu cuerpo que agradeces',
    'un sabor o comida de hoy', 'algo de Penco (mar, cerro, gente)', 'un error que te enseñó algo',
    'algo que das por sentado', 'un recuerdo lindo de infancia', 'algo que aprendiste esta semana',
    'una fortaleza tuya', 'alguien que te hace reír', 'un lugar que te da calma',
    'algo que superaste', 'un pequeño lujo diario', 'una tradición familiar',
    'algo de la naturaleza hoy', 'un desafío que te hizo crecer', 'algo que perdonaste o soltaste',
    'tu luna favorita del ciclo', 'una carta a tu yo de mañana', 'las 21: tu lista completa y brindis'
  ];
  var mapu = [
    'mari mari (hola) · úsalo 3 veces', 'küyen (luna) · mira la luna y nómbrala', 'ko (agua) · bebe un vaso diciendo ko',
    'antü (sol) · saluda al sol de la mañana', 'mapu (tierra) · pisa descalzo y di mapu', 'lawen (remedio) · nombra una hierba',
    'peñi / lamgen (hermano/hermana) · saluda así a alguien', 'küme (bueno) · di küme antü hoy',
    'wenu (arriba/cielo) · mira el cielo 1 min', 'trafkintu (intercambio) · comparte algo', 'epew (cuento) · cuenta un mini epew',
    'kimün (saber) · aprende 2 palabras nuevas', 'newen (fuerza) · haz 10 sentadillas con newen',
    ' Pewma (sueño) · anota tu pewma', 'kütral (fuego) · enciende una vela con intención',
    'lof (comunidad) · ayuda a alguien del lof', 'chem (persona) · chem anüm? ¿qué hiciste hoy?', 'ruka (casa) · ordena un rincón de la ruka',
    'pukem/walung (invierno/verano) · nombra la estación', 'frase: “küme küyen, küme mogen” (buena luna, buen vivir)',
    'frase completa a un peñi/lamgen + repaso de tus 21'
  ];
  var sueno = ['23:30', '23:30', '23:25', '23:25', '23:20', '23:20', '23:15', '23:15', '23:10', '23:10', '23:05', '23:05', '23:00', '23:00', '22:55', '22:55', '22:50', '22:50', '22:45', '22:40', '22:30'];
  var fuerza = [
    '10 sentadillas + 5 flexiones (rodillas ok)', '12 sentadillas + 6 flexiones', 'caminata 15 min + 10 sentadillas',
    '14 sentadillas + 8 flexiones + plancha 20s', '16 sentadillas + 8 flexiones', 'descanso activo: elongar 10 min',
    '18 sentadillas + 10 flexiones + plancha 30s', '20 sentadillas + 10 flexiones', 'caminata 20 min + 12 estocadas',
    '22 sentadillas + 12 flexiones + plancha 35s', '24 sentadillas + 12 flexiones', 'descanso activo: movilidad 10 min',
    '26 sentadillas + 14 flexiones + plancha 40s', 'caminata 25 min + 14 estocadas', '28 sentadillas + 14 flexiones',
    '30 sentadillas + 16 flexiones + plancha 45s', '32 sentadillas + 16 flexiones', 'caminata 30 min + 16 estocadas',
    '34 sentadillas + 18 flexiones + plancha 50s', '36 sentadillas + 18 flexiones', '40 sentadillas + 20 flexiones + plancha 60s 🎉'
  ];
  var digital = [
    'cena sin pantallas', '1h sin celular antes de dormir', 'mañana sin redes hasta las 10:00',
    '2h de modo avión a la tarde', 'caminata sin audífonos ni celular', 'noche: celular fuera del dormitorio',
    'domingo lento: solo 1h de pantallas recreativas', 'desactiva 5 notificaciones', 'tarde completa sin redes sociales',
    'llama por voz en vez de chatear', 'lee 20 min en papel', 'ordena fotos y borra 50',
    'silencia 3 grupos ruidosos', '2 noches seguidas sin pantallas en cena', 'mañana completa analógica',
    'desinstala 1 app que te roba tiempo', 'camina + conversa sin mirar el celular', 'noche de juegos o epew en familia',
    'día con máx 2h de pantallas totales', 'repite tu mejor día analógico', 'balance: escribe tus reglas digitales 🎉'
  ];
  var azucar = [
    'toma solo agua hoy (0 bebidas)', 'desayuno sin azúcar añadida', 'fruta en vez de postre',
    'lee 3 etiquetas: busca azúcar escondida', '0 pan dulce / galletas hoy', 'mate o té sin endulzar',
    'cocina algo dulce con fruta (sin azúcar)', 'repite 2 días seguidos sin bebidas', 'colación sana preparada en casa',
    'pide agua en vez de jugo fuera de casa', 'postre solo fin de semana (hoy no)', '0 azúcar visible todo el día',
    'invita a alguien a sumarse 1 día', 'cocina plato completo sin ultraprocesados', 'anota tu energía del 1 al 10',
    'repite semana: 5/7 días ya limpios', 'prueba receta salada nueva', '0 bebidas en toda la semana',
    'solo 1 gusto planificado (sábado)', 'balance: ¿qué cambió en tu cuerpo?', 'festejo sano + plan de mantención 🎉'
  ];
  var huerta = [
    'riega y observa 10 min', 'saca malezas de 1 bancal', 'siembra almácigo (lechuga/acelga)',
    'compost: voltea y agrega secos', 'trasplanta 3 plantines', 'cosecha lo listo + guarda semillas',
    'asocia: planta albahaca junto a tomates', 'preparado: purín de ortiga o té de compost', 'mulch: cubre suelo desnudo',
    'riego profundo solo 2 veces esta semana', 'esqueje de romero o menta', 'control plagas a mano (pulgón/chapes)',
    'siembra directa: zanahoria o rabanito', 'limpia y afila 1 herramienta', 'intercambia semillas (trafkintu)',
    'planta flor para polinizadores', 'cosecha y cocina algo de tu huerta', 'arma almácigo de otoño/primavera',
    'mide: anota qué rindió más', 'regala un plantín a un vecino', 'foto + balance de tus 21 días 🌱🎉'
  ];
  function arr(fn) { var o = []; for (var i = 0; i < 21; i++) o.push(fn(i)); return o; }
  return [
    { id: 'agua', icono: '💧', nombre: 'Agua viva', cat: 'Cuerpo', desc: 'Hidrátate de menos a más: de 4 a 10 vasos diarios.', beneficio: 'Más energía, mejor digestión y piel.', hora: '09:00',
      dias: arr(function (i) { return D(vasos[i] + ' vasos de agua', 'Reparte en el día. Un vaso al despertar + uno por comida + resto a sorbos. Marca cada vaso.'); }), },
    { id: 'caminar', icono: '🚶', nombre: 'Caminar Penco', cat: 'Cuerpo', desc: 'De 10 a 45 minutos diarios: borde costero, cerro o barrio.', beneficio: 'Corazón, ánimo y sueño.', hora: '08:00',
      dias: arr(function (i) { return D('Caminar ' + camMin[i] + ' min', (i < 7 ? 'Ritmo suave, respira por nariz. ' : i < 14 ? 'Ritmo alegre + 5 cuestas o escalones. ' : 'Ritmo fuerte + 10 cuestas. ') + 'Sin audífonos al menos 5 min: escucha el territorio.'); }), },
    { id: 'fuerza', icono: '💪', nombre: 'Fuerza en casa', cat: 'Cuerpo', desc: 'Sentadillas, flexiones y plancha con progresión semanal.', beneficio: 'Músculo y postura sin gym.', hora: '18:00',
      dias: arr(function (i) { return D(fuerza[i], i % 7 === 5 ? 'Día suave: moverse igual cuenta. ' : 'Calienta 2 min (marcha en el lugar). Si duele una articulación, baja a la mitad.'); }), },
    { id: 'calma', icono: '🌬️', nombre: 'Respira y calma', cat: 'Mente', desc: 'Respiración y silencio: de 3 a 15 minutos.', beneficio: 'Menos ansiedad, mejor foco.', hora: '21:00',
      dias: arr(function (i) { return D('Respirar ' + calmaMin[i] + ' min', '4-7-8 o caja (4-4-4-4). ' + (i >= 14 ? 'Últimos 3 min en silencio total, solo observar.' : i >= 7 ? 'Mitad respiración + mitad silencio.' : 'Solo sigue el aire, sin exigirte.')) }), },
    { id: 'digital', icono: '📵', nombre: 'Pausa digital', cat: 'Mente', desc: 'Recupera tu atención con pausas cada vez más valientes.', beneficio: 'Sueño y presencia.', hora: '20:00',
      dias: arr(function (i) { return D(digital[i], 'Avisa a tu gente antes. El antojo de mirar pasa en ~15 min: camina, agua, respira.'); }), },
    { id: 'lectura', icono: '📖', nombre: 'Lectura lunar', cat: 'Mente', desc: 'De 5 a 30 páginas diarias. Un libro en 21 días.', beneficio: 'Vocabulario, calma y memoria.', hora: '22:00',
      dias: arr(function (i) { return D('Leer ' + leePag[i] + ' páginas', 'Mismo lugar y hora. Celular en otra pieza. Subraya 1 idea y anótala.'); }), },
    { id: 'gratitud', icono: '📓', nombre: 'Gratitud diaria', cat: 'Espíritu', desc: 'Un motivo diario con prompts guiados.', beneficio: 'Ánimo y resiliencia.', hora: '21:30',
      dias: arr(function (i) { return D(gratitud[i], 'Escríbelo (papel o notas del día). 2-3 líneas bastan. Relee los domingos.'); }), },
    { id: 'azucar', icono: '🥗', nombre: 'Dulce medida', cat: 'Cuerpo', desc: 'Baja el azúcar paso a paso, sin prohibiciones extremas.', beneficio: 'Energía estable.', hora: '12:00',
      dias: arr(function (i) { return D(azucar[i], 'Si fallas un día, retoma al siguiente sin castigo. La racha se reconstruye.'); }), },
    { id: 'ahorro', icono: '💰', nombre: 'Ahorro hormiga', cat: 'Hogar', desc: 'Guarda de $500 a $2000 diarios. ~$20.000 en 21 días.', beneficio: 'Colchón y hábito.', hora: '19:00',
      dias: arr(function (i) { return D('Guardar $' + ahorro[i].toLocaleString('es-CL'), 'Alcancía o sobre marcado. Si un día no puedes, guarda la mitad y sigue. Total aprox: $21.400.'); }), },
    { id: 'huerta', icono: '🌱', nombre: 'Manos a la tierra', cat: 'Territorio', desc: '21 micro-tareas de huerta y suelo, 15-20 min.', beneficio: 'Comida y vínculo con la tierra.', hora: '10:00',
      dias: arr(function (i) { return D(huerta[i], 'Hazlo con la luna a tu favor: siembra en creciente, cosecha en llena, poda en menguante.'); }), },
    { id: 'mapuzugun', icono: '🗣️', nombre: 'Mapuzugun vivo', cat: 'Territorio', desc: 'Una palabra o frase diaria, de saludo a conversación.', beneficio: 'Lengua y respeto por el kimün.', hora: '09:30',
      dias: arr(function (i) { return D(mapu[i], 'Pronuncia en voz alta 3 veces. Úsala con alguien hoy. Anota dudas para tu próximo taller.'); }), },
    { id: 'sueno', icono: '😴', nombre: 'Dormir a la hora', cat: 'Cuerpo', desc: 'Adelanta tu hora de dormir de 23:30 a 22:30.', beneficio: 'Descanso real.', hora: '22:00',
      dias: arr(function (i) { return D('A la cama ' + sueno[i] + ' + ritual', 'Luz baja 1h antes, nada de pantallas 30 min antes, pieza fresca y oscura. Levántate a la misma hora.'); }), }
  ];
}
var CATS = ['Todos', 'Cuerpo', 'Mente', 'Espíritu', 'Hogar', 'Territorio', 'Estudio', 'Personalizado'];
var DURACIONES = [7, 14, 21, 30, 66];

/* ---------- estado UI ---------- */
var tab = 'Catalogo';
var selId = null;
var catFilter = 'Todos';
var catQuery = '';
var previewId = null;
// constructor a medida
var armMode = 'habito';
var armDur = 21;
var editTplId = null;

/* ---------- helpers de planes ---------- */
function getReto(id) {
  var s = store();
  for (var i = 0; i < s.activos.length; i++) if (s.activos[i].id === id) return s.activos[i];
  for (var j = 0; j < s.archivo.length; j++) if (s.archivo[j].id === id) return s.archivo[j];
  return null;
}
function diasDe(reto) {
  var T = totalDias(reto);
  if (reto.dias && reto.dias.length >= T) return reto.dias.slice(0, T);
  if (reto.dias && reto.dias.length) {
    // extiende ciclando la base (para duraciones mayores que la plantilla)
    var out = reto.dias.slice();
    var k = 0;
    while (out.length < T) { var b = reto.dias[k % reto.dias.length]; out.push({ t: b.t, d: (b.d || '') + ' (sigue)' }); k++; }
    return out;
  }
  var cat = buildCatalogo();
  for (var i = 0; i < cat.length; i++) {
    if (cat[i].id === reto.plantillaId) {
      var base = cat[i].dias;
      if (base.length === T) return base;
      if (base.length > T) return base.slice(0, T);
      var o2 = base.slice(); var j = 0;
      while (o2.length < T) { o2.push(base[j % base.length]); j++; }
      return o2;
    }
  }
  return [];
}
function tareaCorta(reto, n) {
  var ds = diasDe(reto);
  var d = ds[n - 1];
  if (!d) return 'Día ' + n;
  return String(d.t || d).slice(0, 70);
}
function ajustarDiasBase(baseDias, total) {
  total = clampDur(total);
  if (baseDias.length === total) return baseDias.slice();
  if (baseDias.length > total) return baseDias.slice(0, total);
  var out = baseDias.slice(); var i = 0;
  while (out.length < total) { out.push(baseDias[i % baseDias.length]); i++; }
  return out;
}
// generador progresivo: rampa lineal entre ini y fin
function generarProgresivo(actividad, unidad, ini, fin, total, motivo) {
  total = clampDur(total);
  ini = parseFloat(String(ini).replace(',', '.')); fin = parseFloat(String(fin).replace(',', '.'));
  if (isNaN(ini) || isNaN(fin)) return null;
  var out = [];
  for (var i = 0; i < total; i++) {
    var v = total === 1 ? fin : ini + (fin - ini) * (i / (total - 1));
    v = Math.round(v * 10) / 10;
    var f = faseDe(i + 1, total);
    out.push(D(actividad + ' ' + ('' + v).replace('.', ',') + ' ' + unidad,
      (motivo ? 'Tu motivo: ' + motivo + '. ' : '') + f.nombre + ': ' + f.desc +
      (i % 7 === 6 ? ' Hoy puedes hacer un 20% menos: descansar también avanza.' : '')));
  }
  return out;
}
function generarHabito(accion, total, motivo) {
  total = clampDur(total);
  var out = [];
  for (var i = 0; i < total; i++) {
    var f = faseDe(i + 1, total);
    out.push(D(accion, (motivo ? 'Tu motivo: ' + motivo + '. ' : '') + f.nombre + ': ' + f.desc));
  }
  return out;
}
function generarCombo(acciones, total, motivo) {
  total = clampDur(total);
  var titulo = acciones.join(' + ');
  if (titulo.length > 90) titulo = titulo.slice(0, 87) + '…';
  var out = [];
  for (var i = 0; i < total; i++) {
    var f = faseDe(i + 1, total);
    out.push(D(titulo, (motivo ? 'Tu motivo: ' + motivo + '. ' : '') + f.nombre + ': ' + f.desc +
      ' Marca ✓ solo si hiciste todo el combo; si no, anota en 📝 qué sí hiciste.'));
  }
  return out;
}

/* ---------- crear / mutar ---------- */
function empezarReto(plantillaId, inicio, hora, conAviso, duracion) {
  var cat = buildCatalogo();
  var p = null, custom = null;
  for (var i = 0; i < cat.length; i++) if (cat[i].id === plantillaId) p = cat[i];
  if (!p) {
    var s0 = store();
    for (var c = 0; c < s0.customs.length; c++) if (s0.customs[c].id === plantillaId) custom = s0.customs[c];
    if (!custom) return null;
  }
  var total = clampDur(duracion || (p ? p.dias.length : (custom.dias || []).length) || 21);
  var id = uid('rto');
  var baseDias = p ? p.dias : (custom.dias || []);
  var r = {
    id: id, tag: '[Reto ' + id.slice(-5) + ']',
    plantillaId: plantillaId,
    nombre: p ? p.nombre : custom.nombre,
    icono: p ? p.icono : (custom.icono || '🔥'),
    cat: p ? p.cat : (custom.cat || 'Personalizado'),
    inicio: validKey(inicio) ? inicio : todayKey(),
    hora: validHora(hora) ? hora : ((p && p.hora) || (custom && custom.hora) || '10:00'),
    conAviso: !!conAviso,
    total: total,
    checks: {}, notas: {}, creado: todayKey(),
    dias: p ? null : (custom.dias ? ajustarDiasBase(custom.dias, total) : null)
  };
  if (p && total !== p.dias.length) r.dias = ajustarDiasBase(p.dias, total);
  var hp = r.hora.split(':');
  r.hora = String(hp[0]).padStart(2, '0') + ':' + String(hp[1]).padStart(2, '0');
  store().activos.push(r);
  save('Reto iniciado 🔥');
  selId = id;
  return r;
}
function crearRetoMedida(opts) {
  var total = clampDur(opts.total || 21);
  var id = uid('rto');
  var r = {
    id: id, tag: '[Reto ' + id.slice(-5) + ']',
    plantillaId: null,
    nombre: clean(opts.nombre, 50),
    icono: clean(opts.icono, 4) || '🔥',
    cat: opts.cat || 'Personalizado',
    inicio: validKey(opts.inicio) ? opts.inicio : todayKey(),
    hora: validHora(opts.hora) ? opts.hora : '10:00',
    conAviso: !!opts.conAviso,
    total: total,
    checks: {}, notas: {}, creado: todayKey(),
    dias: opts.dias.slice(0, total),
    motivo: clean(opts.motivo || '', 120)
  };
  store().activos.push(r);
  save('Reto creado 🔥');
  selId = id;
  return r;
}
function llevarDias(reto, lista) {
  var T = totalDias(reto);
  var ok = 0, fuera = 0, dft = 0, dup = 0;
  lista.forEach(function (n) {
    if (n < 1 || n > T) return;
    var fecha = fechaDeDia(reto, n);
    var texto = clean(reto.tag + ' ' + reto.icono + ' ' + reto.nombre + ' · Día ' + n + '/' + T + ': ' + tareaCorta(reto, n), 90);
    var cellAntes = celdaPara(fecha);
    var antes = (cellAntes.cell && cellAntes.cell.agenda.length) || 0;
    var res = pushAgenda(fecha, reto.hora, texto, reto.conAviso);
    if (!res.ok) { fuera++; return; }
    if (res.dft) { dft++; return; }
    var cellDesp = celdaPara(fecha);
    var desp = (cellDesp.cell && cellDesp.cell.agenda.length) || 0;
    if (desp === antes) dup++; else ok++;
  });
  save(ok ? '📌 ' + ok + ' día(s) en el calendario ✓' : 'Sin cambios');
  refrescarCal();
  var msg = '📌 Agregados: ' + ok;
  if (dup) msg += ' · ya estaban: ' + dup;
  if (dft) msg += ' · en DFT: ' + dft;
  if (fuera) msg += ' · fuera del ciclo visible: ' + fuera + ' (acércalos al ciclo actual)';
  try { alert(msg); } catch (e) {}
  render();
}
function llevarTodo(reto) {
  var lista = [], T = totalDias(reto);
  for (var n = 1; n <= T; n++) lista.push(n);
  llevarDias(reto, lista);
}
function llevarFaltantes(reto) {
  var lista = [], T = totalDias(reto);
  var hoy = diaNumHoy(reto);
  for (var n = Math.max(hoy, 1); n <= T; n++) if (!reto.checks[n]) lista.push(n);
  if (!lista.length) { try { alert('Nada que llevar: ya marcaste todo lo pendiente. 🎉'); } catch (e) {} return; }
  llevarDias(reto, lista);
}
function quitarDelCalendario(reto) {
  if (!confirm('¿Quitar los días de “' + reto.nombre + '” del calendario? (Tus ✓ se conservan)')) return;
  var corto = tagCorto(reto), quitados = 0, T = totalDias(reto);
  for (var n = 1; n <= T; n++) {
    var fecha = fechaDeDia(reto, n);
    var r = celdaPara(fecha);
    if (r.error || r.dft || !r.cell) continue;
    var antes = r.cell.agenda.length;
    r.cell.agenda = r.cell.agenda.filter(function (a) {
      var t = String(a.text || '');
      return t.indexOf(reto.tag) < 0 && t.indexOf(corto) < 0 && t.indexOf('[R21 ' + corto + ']') < 0;
    });
    quitados += antes - r.cell.agenda.length;
  }
  // también limpia DFT
  try {
    var u = userData();
    Object.keys(u.cycles || {}).forEach(function (yk) {
      var cy = u.cycles[yk];
      if (cy && cy.dft && cy.dft.nota && (cy.dft.nota.indexOf(corto) >= 0)) {
        cy.dft.nota = cy.dft.nota.split('\n').filter(function (l) { return l.indexOf(corto) < 0; }).join('\n');
      }
    });
  } catch (e) {}
  save('Quitado del calendario ✓ (' + quitados + ')');
  refrescarCal();
  render();
}
function duplicarReto(reto) {
  var s = store();
  var id = uid('rto');
  var copia = JSON.parse(JSON.stringify(reto));
  copia.id = id;
  copia.tag = '[Reto ' + id.slice(-5) + ']';
  copia.nombre = clean(reto.nombre + ' (copia)', 50);
  copia.inicio = todayKey();
  copia.checks = {}; copia.notas = {};
  copia.creado = todayKey();
  s.activos.push(copia);
  save('Reto duplicado 🔁');
  selId = id;
  render();
}

/* ---------- logros ---------- */
function logrosDe(reto) {
  var T = totalDias(reto), h = hechos(reto), t = tercios(T), L = [];
  function on(c, label) { L.push({ ok: !!c, label: label }); }
  on(h >= 1, '🚀 Día 1: partiste');
  on(h >= Math.min(3, T), '🌱 3 días: semilla');
  on(h >= t.t1, '🌿 Siembra completa (' + t.t1 + ' días)');
  on(h >= t.t2, '🌳 Brote completo (' + t.t2 + ' días)');
  on(h >= T, '🌸 ¡reto completado! (' + T + '/' + T + ')');
  on(rachaActual(reto) >= Math.min(7, T), '🔥 Racha de ' + Math.min(7, T));
  return L;
}

/* ---------- render ---------- */
function cssOnce() {
  if ($('r21style')) return;
  var st = document.createElement('style');
  st.id = 'r21style';
  st.textContent = '.r21-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px}' +
    '.r21-day{border:1px solid var(--gold);border-radius:10px;padding:8px;background:var(--panel);font-size:11px;line-height:1.5}' +
    '.r21-day.hecho{border-color:#7fd08a;background:#12351f33}' +
    '.r21-day.hoy{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}' +
    '.r21-day.atras{border-style:dashed;opacity:.92}' +
    '.r21-bar{height:10px;border-radius:6px;background:#ffffff22;overflow:hidden;margin:6px 0}' +
    '.r21-bar>i{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--accent));border-radius:6px}' +
    '.r21-cat{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-top:8px}' +
    '.r21-durs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}';
  document.head.appendChild(st);
}
function barHTML(p) {
  return '<div class="r21-bar"><i style="width:' + p + '%"></i></div>';
}
function faseChip(n, total) {
  var f = faseDe(n, total || 21);
  var col = f.n === 1 ? '#9fd49a' : f.n === 2 ? '#e8c56a' : '#e79ac2';
  return '<span class="chip" style="font-size:10px;border-color:' + col + '55">' + esc(f.nombre) + '</span>';
}
function durLabel(total) { return total + ' días'; }
function renderHead() {
  var s = store();
  var box = $('r21head');
  if (!box) return;
  if (!s.activos.length && !s.archivo.length) {
    box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>🔥 ¿Por qué retos?</h4>' +
      '<p class="muted su-b439ab">Un reto es un plan corto con fecha, hora y marca diaria: elige una plantilla del catálogo o <b>arma tu propio plan a medida</b> (duración, progresión y tareas). La regla es <b>nunca fallar dos veces seguidas</b>. Llévalo al calendario con 📌 para no olvidarlo.</p></div>';
    return;
  }
  var tot = 0, n = 0, racha = 0, checks = 0;
  s.activos.forEach(function (r) { tot += pct(r); n++; racha = Math.max(racha, rachaActual(r)); checks += hechos(r); });
  var prom = n ? Math.round(tot / n) : 0;
  box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>🔥 Tu fuego: ' + s.activos.length + ' activo(s) · promedio ' + prom + '% · mejor racha ' + racha + ' 🔥 · ' + checks + ' ✓ totales</h4>' + barHTML(prom) +
    '<p class="muted su-11a508">Marca el día de hoy en 🚀 Mis retos o en 📅 Día a día. Lleva tus días al calendario con 📌. Crea los tuyos en ➕ Armar plan.</p></div>';
}
function renderTabs() {
  ['Catalogo', 'Mis', 'Detalle', 'Crear', 'Guia'].forEach(function (t) {
    var b = $('tabR21' + t);
    if (!b) return;
    b.className = 'btn' + (tab === t ? ' btn-accent' : '');
    b.style.width = 'auto';
  });
  ['Catalogo', 'Mis', 'Detalle', 'Crear', 'Guia'].forEach(function (t) {
    var p = $('r21' + t + 'Panel');
    if (p) p.classList.toggle('hidden', tab !== t);
  });
}
function renderCatalogo() {
  var box = $('r21catBox');
  if (!box) return;
  var cat = buildCatalogo();
  var customs = store().customs;
  var all = cat.map(function (p) { return { kind: 'base', p: p }; })
    .concat(customs.map(function (c) { return { kind: 'custom', p: { id: c.id, icono: c.icono || '🔥', nombre: c.nombre, cat: c.cat || 'Personalizado', desc: c.desc || 'Plantilla propia.', hora: c.hora || '10:00', dias: c.dias } }; }));
  var q = (catQuery || '').toLowerCase();
  var list = all.filter(function (x) {
    if (catFilter !== 'Todos' && x.p.cat !== catFilter) return false;
    if (q && (String(x.p.nombre) + ' ' + String(x.p.desc || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  var fbox = $('r21catFilter');
  if (fbox && !fbox.dataset.built) {
    fbox.dataset.built = '1';
    fbox.innerHTML = '<div class="su-6157e8">' + CATS.map(function (c) { return '<button type="button" class="btn r21-f su-337714" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
      '<div class="conv-row"><label class="su-4b3de7">Buscar <input type="text" id="r21q" placeholder="ej: agua, calma, huerta…" maxlength="40"></label></div>';
    fbox.querySelectorAll('.r21-f').forEach(function (b) {
      b.onclick = function () { catFilter = b.dataset.c; renderCatalogo(); };
    });
    var qi = $('r21q');
    if (qi) qi.oninput = function () { catQuery = qi.value; var v = qi.value, pos = qi.selectionStart; renderCatalogo(); var nq = $('r21q'); if (nq) { nq.focus(); try { nq.setSelectionRange(pos, pos); } catch (e) {} } };
  }
  if (fbox) {
    fbox.querySelectorAll('.r21-f').forEach(function (b) {
      b.classList.toggle('btn-accent', b.dataset.c === catFilter);
    });
    var qkeep = $('r21q');
    if (qkeep && qkeep.value !== catQuery) qkeep.value = catQuery;
  }
  if (!list.length) { box.innerHTML = '<p class="muted su-91a870">Sin retos en esta categoría. Prueba en ➕ Armar plan crear el tuyo a medida.</p>'; return; }
  box.innerHTML = list.map(function (x) {
    var p = x.p;
    var prev = previewId === p.id;
    var dias = (p.dias || []).slice(0, 21);
    var nDias = (p.dias || []).length || 21;
    return '<div class="si-card"><h4>' + esc(p.icono + ' ' + p.nombre) + '</h4>' +
      '<p class="su-6157e8"><span class="chip su-0d5be0">' + esc(p.cat) + '</span>' +
      '<span class="chip su-0d5be0">' + nDias + ' días base</span>' +
      '<span class="chip su-0d5be0">⏰ ' + esc(p.hora || '10:00') + '</span>' +
      (x.kind === 'custom' ? '<span class="chip su-0d5be0">✨ propia</span>' : '') + '</p>' +
      '<p class="muted">' + esc(p.desc || '') + '</p>' +
      (prev ? '<div class="su-521ff7">' +
        dias.map(function (d, i) {
          var f = faseDe(i + 1, dias.length);
          return '<div>· <b>D' + (i + 1) + '</b> <span class="muted">(' + esc(f.nombre) + ')</span> — ' + esc(d.t) + '</div>';
        }).join('') + (nDias > 21 ? '<div class="muted">… +' + (nDias - 21) + ' días más</div>' : '') + '</div>' : '') +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn r21-prev su-337714" data-k="' + esc(p.id) + '">' + (prev ? '🙈 Ocultar plan' : '👁️ Ver plan') + '</button>' +
      '<button type="button" class="btn btn-accent r21-start su-337714" data-k="' + esc(p.id) + '">▶ Empezar</button>' +
      '</div></div>';
  }).join('');
  box.querySelectorAll('.r21-prev').forEach(function (b) {
    b.onclick = function () { previewId = previewId === b.dataset.k ? null : b.dataset.k; renderCatalogo(); };
  });
  box.querySelectorAll('.r21-start').forEach(function (b) {
    b.onclick = function () { openStart(b.dataset.k); };
  });
}
/* Diálogo de inicio: fecha + duración + hora + aviso (reemplaza prompts) */
function openStart(plantillaId) {
  var cat = buildCatalogo(), base = null, custom = null;
  for (var i = 0; i < cat.length; i++) if (cat[i].id === plantillaId) base = cat[i];
  if (!base) {
    var s = store();
    for (var c = 0; c < s.customs.length; c++) if (s.customs[c].id === plantillaId) custom = s.customs[c];
    if (!custom) { alert('No se encontró la plantilla.'); return; }
  }
  var horaDef = (base && base.hora) || (custom && custom.hora) || '10:00';
  var baseLen = (base ? base.dias.length : (custom.dias || []).length) || 21;
  var d = makeDialog('r21startDialog', '▶ Empezar reto',
    'Elige fecha, duración y hora. Si acortas, se toman los primeros días; si alargas, el plan se continúa.',
    '<div class="conv-row"><label>Inicio <input type="date" id="r21sFecha" value="' + esc(todayKey()) + '"></label>' +
    '<label>Hora <input type="time" id="r21sHora" value="' + esc(horaDef) + '"></label></div>' +
    '<div><label>Duración</label><div class="r21-durs" id="r21sDurs">' +
    DURACIONES.map(function (x) { return '<button type="button" class="btn r21sd su-337714" data-v="' + x + '"' + (x === Math.min(baseLen, 21) || (baseLen === 21 && x === 21) ? ' data-def="1"' : '') + '>' + x + ' días</button>'; }).join('') +
    '<label class="su-4b3de7">Otra <input type="number" id="r21sCustom" min="3" max="90" value="' + baseLen + '" class="su-ef1212"></label></div></div>' +
    '<label class="check-row su-53cf90"><input type="checkbox" id="r21sAviso" checked> 🔔 aviso en el calendario</label>' +
    '<p class="muted su-11a508">Base: ' + baseLen + ' días. La progresión 🌱→🌿→🌸 se recalcula a tu duración.</p>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="r21sGo" class="btn btn-accent su-30e741">🔥 Crear reto</button></div>');
  var selDur = baseLen;
  d.querySelectorAll('.r21sd').forEach(function (b) {
    if (b.dataset.def) { b.classList.add('btn-accent'); selDur = +b.dataset.v; }
    b.onclick = function () {
      d.querySelectorAll('.r21sd').forEach(function (x) { x.classList.remove('btn-accent'); });
      b.classList.add('btn-accent');
      selDur = +b.dataset.v;
      var ci = $('r21sCustom'); if (ci) ci.value = selDur;
    };
  });
  var ci0 = $('r21sCustom');
  if (ci0) ci0.oninput = function () {
    d.querySelectorAll('.r21sd').forEach(function (x) { x.classList.remove('btn-accent'); });
    selDur = clampDur(ci0.value);
  };
  openDlg('r21startDialog');
  var go = $('r21sGo');
  if (go) go.onclick = function () {
    var f = ($('r21sFecha') || {}).value || todayKey();
    if (!validKey(f)) { alert('Fecha inválida. Usa formato aaaa-mm-dd.'); return; }
    var h = ($('r21sHora') || {}).value || horaDef;
    if (!validHora(h)) { alert('Hora inválida, se usará ' + horaDef + '.'); h = horaDef; }
    var ci = $('r21sCustom');
    var dur = ci && ci.value ? clampDur(ci.value) : selDur;
    var av = !!($('r21sAviso') || {}).checked;
    try { d.close(); } catch (e) {}
    var r = empezarReto(plantillaId, f, h, av, dur);
    if (!r) { alert('No se pudo crear el reto.'); return; }
    tab = 'Detalle';
    render();
    var llevar = confirm('🔥 ¡Reto creado (' + dur + ' días)! ¿Llevar los días al calendario ahora?\nAceptar = Sí · Cancelar = lo marco yo después');
    if (llevar) llevarTodo(r);
  };
}
function renderMis() {
  var box = $('r21misBox');
  if (!box) return;
  var s = store();
  var ab = $('r21archBox');
  if (!s.activos.length) {
    box.innerHTML = '<p class="muted su-91a870">Sin retos activos. Elige uno en 📋 Catálogo o arma el tuyo en ➕ Armar plan.</p>';
    if (ab) ab.innerHTML = s.archivo.length ? archivadosHTML(s) : '';
    return;
  }
  var arr = s.activos.slice().sort(function (a, b) { return pct(b) - pct(a); });
  box.innerHTML = arr.map(function (r) {
    var T = totalDias(r), p = pct(r), h = hechos(r), hoy = diaNumHoy(r), ra = rachaActual(r);
    var estado = hoy < 1 ? '⏳ Empieza el ' + r.inicio : hoy > T ? (h >= T ? '🌸 ¡Completado!' : '🏁 Terminó: ' + h + '/' + T) : '📅 Hoy es el día ' + hoy + '/' + T;
    var tareaHoy = hoy >= 1 && hoy <= T ? tareaCorta(r, hoy) : '—';
    return '<div class="si-card"><h4>' + esc(r.icono + ' ' + r.nombre) + '</h4>' +
      '<p class="su-6157e8"><span class="chip su-0d5be0">' + esc(r.cat || '') + '</span>' +
      '<span class="chip su-0d5be0">📅 ' + esc(r.inicio) + ' → ' + esc(addDays(r.inicio, T - 1)) + '</span>' +
      '<span class="chip su-0d5be0">' + T + ' días</span>' +
      '<span class="chip su-0d5be0">⏰ ' + esc(r.hora) + '</span>' +
      '<span class="chip su-0d5be0">🔥 racha ' + ra + '</span></p>' +
      '<p class="su-6cb285"><b>' + h + '/' + T + ' · ' + p + '%</b> — ' + esc(estado) + '</p>' + barHTML(p) +
      (hoy >= 1 && hoy <= T ? '<p class="su-11a508">👉 Hoy: <b>' + esc(tareaHoy) + '</b> ' + (r.checks[hoy] ? '✅' : '') + '</p>' : '') +
      '<div class="su-c158a9">' +
      (hoy >= 1 && hoy <= T ? '<button type="button" class="btn btn-accent r21-today su-337714" data-k="' + esc(r.id) + '" data-d="' + hoy + '">' + (r.checks[hoy] ? '↩️ Desmarcar hoy' : '✅ Marcar hoy') + '</button>' : '') +
      '<button type="button" class="btn r21-open su-337714" data-k="' + esc(r.id) + '">📅 Abrir día a día</button>' +
      '<button type="button" class="btn r21-cal su-337714" data-k="' + esc(r.id) + '">📌 Calendario</button>' +
      '<button type="button" class="btn r21-dup su-337714" data-k="' + esc(r.id) + '" title="Duplicar">🔁</button>' +
      '<button type="button" class="btn r21-edit su-337714" data-k="' + esc(r.id) + '" title="Renombrar">✏️</button>' +
      '<button type="button" class="btn r21-share su-337714" data-k="' + esc(r.id) + '">📤</button>' +
      '<button type="button" class="btn r21-arch su-337714" data-k="' + esc(r.id) + '">🗄️ Archivar</button>' +
      '<button type="button" class="btn r21-del su-fd834a" data-k="' + esc(r.id) + '">✕</button>' +
      '</div></div>';
  }).join('');
  box.querySelectorAll('.r21-today').forEach(function (b) {
    b.onclick = function () {
      var r = getReto(b.dataset.k); if (!r) return;
      var dd = +b.dataset.d;
      if (r.checks[dd]) delete r.checks[dd]; else r.checks[dd] = true;
      save(r.checks[dd] ? 'Día ' + dd + ' logrado ✅' : 'Marca quitada');
      render();
    };
  });
  box.querySelectorAll('.r21-open').forEach(function (b) {
    b.onclick = function () { selId = b.dataset.k; tab = 'Detalle'; render(); };
  });
  box.querySelectorAll('.r21-cal').forEach(function (b) {
    b.onclick = function () {
      var r = getReto(b.dataset.k); if (!r) return;
      selId = r.id;
      var T = totalDias(r);
      var modo = prompt('📌 Llevar al calendario (' + T + ' días):\n1 = todos los días\n2 = solo lo que falta\n3 = quitar del calendario\n(escribe 1, 2 o 3)', '1');
      if (modo === '1') llevarTodo(r);
      else if (modo === '2') llevarFaltantes(r);
      else if (modo === '3') quitarDelCalendario(r);
    };
  });
  box.querySelectorAll('.r21-dup').forEach(function (b) {
    b.onclick = function () { var r = getReto(b.dataset.k); if (r) duplicarReto(r); };
  });
  box.querySelectorAll('.r21-edit').forEach(function (b) {
    b.onclick = function () {
      var r = getReto(b.dataset.k); if (!r) return;
      var v = prompt('✏️ Nuevo nombre:', r.nombre);
      if (v === null) return;
      v = clean(v.trim(), 50);
      if (!v) { alert('El nombre no puede quedar vacío.'); return; }
      r.nombre = v;
      save('Nombre actualizado ✏️');
      render();
    };
  });
  box.querySelectorAll('.r21-share').forEach(function (b) {
    b.onclick = function () {
      var r = getReto(b.dataset.k); if (!r) return;
      var T = totalDias(r);
      share('🔥 Reto: ' + r.nombre, r.icono + ' ' + r.nombre + '\n📅 ' + r.inicio + ' → ' + addDays(r.inicio, T - 1) + ' (' + T + ' días)\n✅ ' + hechos(r) + '/' + T + ' (' + pct(r) + '%) · 🔥 racha ' + rachaActual(r));
    };
  });
  box.querySelectorAll('.r21-arch').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      var ix = -1;
      for (var i = 0; i < st.activos.length; i++) if (st.activos[i].id === b.dataset.k) ix = i;
      if (ix < 0) return;
      st.archivo.push(st.activos.splice(ix, 1)[0]);
      save('Archivado 🗄️');
      if (selId === b.dataset.k) selId = null;
      render();
    };
  });
  box.querySelectorAll('.r21-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este reto? (Se conservan tus notas del calendario)')) return;
      var st = store();
      st.activos = st.activos.filter(function (x) { return x.id !== b.dataset.k; });
      save('Reto borrado');
      if (selId === b.dataset.k) selId = null;
      render();
    };
  });
  if (ab) ab.innerHTML = s.archivo.length ? archivadosHTML(s) : '';
}
function archivadosHTML(s) {
  return '<div class="menstrual-card su-d2c171"><h4>🗄️ Archivados (' + s.archivo.length + ')</h4>' +
    s.archivo.slice().reverse().slice(0, 20).map(function (r) {
      var T = totalDias(r);
      return '<div class="su-cf4a10">' + esc(r.icono + ' ' + r.nombre) +
        ' · ' + hechos(r) + '/' + T + ' (' + pct(r) + '%)' +
        ' <button type="button" class="btn r21-unarch su-9f0529" data-k="' + esc(r.id) + '">↩️ Reactivar</button></div>';
    }).join('') + '</div>';
}
function renderDetalle() {
  var box = $('r21detBox');
  if (!box) return;
  // delegación para reactivar archivados (el botón vive en Mis, pero por si acaso)
  document.querySelectorAll('.r21-unarch').forEach(function (b) {
    if (b.dataset.bound) return; b.dataset.bound = '1';
    b.onclick = function () {
      var st = store(), ix = -1;
      for (var i = 0; i < st.archivo.length; i++) if (st.archivo[i].id === b.dataset.k) ix = i;
      if (ix < 0) return;
      st.activos.push(st.archivo.splice(ix, 1)[0]);
      save('Reactivado ↩️');
      selId = b.dataset.k; tab = 'Detalle'; render();
    };
  });
  var s = store();
  if (!s.activos.length) { box.innerHTML = '<p class="muted su-91a870">Sin retos activos.</p>'; return; }
  if (!selId || !getReto(selId) || !s.activos.some(function (r) { return r.id === selId; })) selId = s.activos[0].id;
  var r = getReto(selId);
  var T = totalDias(r);
  // selector
  var sel = '<div class="conv-row"><label class="su-4b3de7">Reto <select id="r21sel">' +
    s.activos.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === selId ? ' selected' : '') + '>' + esc(x.icono + ' ' + x.nombre + ' (' + hechos(x) + '/' + totalDias(x) + ')') + '</option>'; }).join('') +
    '</select></label><label>Inicio <input type="date" id="r21inicio" value="' + esc(r.inicio) + '"></label>' +
    '<label>Hora <input type="time" id="r21hora" value="' + esc(r.hora) + '"></label></div>';
  var ds = diasDe(r);
  var grid = '<div class="r21-grid">' + ds.map(function (dd, i) {
    var n = i + 1, f = fechaDeDia(r, n), e = estadoDia(r, n);
    var cls = e === 'hecho' ? 'hecho' : e === 'hoy' ? 'hoy' : e === 'pendiente-atrasado' ? 'atras' : '';
    var mark = e === 'hecho' ? '✅' : e === 'hoy' ? '👉' : '⭕';
    var nota = r.notas[n] ? '<div class="muted su-0d5be0">📝 ' + esc(r.notas[n]) + '</div>' : '';
    return '<div class="r21-day ' + cls + '"><div><b>' + mark + ' D' + n + '</b> · ' + esc(f.slice(5)) + ' ' + faseChip(n, T) + '</div>' +
      '<div class="su-557d84"><b>' + esc(dd.t) + '</b></div>' +
      (dd.d ? '<div class="muted su-0d5be0">' + esc(dd.d) + '</div>' : '') + nota +
      '<div class="su-e239a1">' +
      '<button type="button" class="btn r21-chk su-9f0529" data-d="' + n + '">' + (e === 'hecho' ? '↩️' : '✓') + '</button>' +
      '<button type="button" class="btn r21-one su-9f0529" data-d="' + n + '" title="Llevar este día al calendario">📌</button>' +
      '<button type="button" class="btn r21-note su-9f0529" data-d="' + n + '" title="Nota del día">📝</button>' +
      '<button type="button" class="btn r21-ed su-9f0529" data-d="' + n + '" title="Editar tarea">✏️</button>' +
      '</div></div>';
  }).join('') + '</div>';
  var L = logrosDe(r);
  box.innerHTML = sel +
    '<div class="menstrual-card su-435dbc"><h4>' + esc(r.icono + ' ' + r.nombre) + ' · ' + hechos(r) + '/' + T + ' (' + pct(r) + '%)</h4>' + barHTML(pct(r)) +
    '<p class="muted su-11a508">📅 ' + esc(r.inicio + ' · ' + fmtFecha(r.inicio)) + ' → ' + esc(addDays(r.inicio, T - 1) + ' · ' + fmtFecha(addDays(r.inicio, T - 1))) +
    ' · ' + T + ' días · ⏰ ' + esc(r.hora) + (r.conAviso ? ' · 🔔 con aviso' : '') + ' · 🔥 racha ' + rachaActual(r) +
    (r.motivo ? ' · 💛 ' + esc(r.motivo) : '') + '</p>' +
    '<p class="su-11a508">' + L.map(function (l) { return (l.ok ? '✅ ' : '⭕ ') + esc(l.label); }).join('<br>') + '</p>' +
    '<div class="su-c158a9">' +
    '<button type="button" id="r21all" class="btn btn-accent su-337714">📌 Llevar todos</button>' +
    '<button type="button" id="r21rest" class="btn su-337714">📌 Llevar lo que falta</button>' +
    '<button type="button" id="r21un" class="btn su-337714">🗑 Quitar del calendario</button>' +
    '<button type="button" id="r21share2" class="btn su-337714">📤 Compartir</button>' +
    '</div></div>' + grid;
  var sEl = $('r21sel');
  if (sEl) sEl.onchange = function () { selId = sEl.value; renderDetalle(); };
  var fi = $('r21inicio');
  if (fi) fi.onchange = function () {
    if (!validKey(fi.value)) { alert('Fecha inválida'); fi.value = r.inicio; return; }
    r.inicio = fi.value; save('Inicio movido al ' + r.inicio); refrescarCal(); render();
  };
  var fh = $('r21hora');
  if (fh) fh.onchange = function () {
    if (!validHora(fh.value)) { alert('Hora inválida'); fh.value = r.hora; return; }
    r.hora = fh.value; save('Hora: ' + r.hora); render();
  };
  box.querySelectorAll('.r21-chk').forEach(function (b) {
    b.onclick = function () {
      var n = +b.dataset.d;
      if (r.checks[n]) delete r.checks[n]; else r.checks[n] = true;
      save(r.checks[n] ? 'Día ' + n + ' ✅' : 'Marca quitada');
      render();
    };
  });
  box.querySelectorAll('.r21-one').forEach(function (b) {
    b.onclick = function () {
      var n = +b.dataset.d;
      var texto = clean(r.tag + ' ' + r.icono + ' ' + r.nombre + ' · Día ' + n + '/' + T + ': ' + tareaCorta(r, n), 90);
      var res = pushAgenda(fechaDeDia(r, n), r.hora, texto, r.conAviso);
      if (!res.ok) { alert(res.error); return; }
      save('📌 Día ' + n + ' en el calendario ✓');
      refrescarCal(); render();
    };
  });
  box.querySelectorAll('.r21-note').forEach(function (b) {
    b.onclick = function () {
      var n = +b.dataset.d;
      var v = prompt('📝 Nota día ' + n + ':', r.notas[n] || '');
      if (v === null) return;
      v = clean(v.trim(), 140);
      if (!v) delete r.notas[n]; else r.notas[n] = v;
      save('Nota guardada 📝');
      render();
    };
  });
  box.querySelectorAll('.r21-ed').forEach(function (b) {
    b.onclick = function () {
      var n = +b.dataset.d;
      if (!r.dias || !r.dias[n - 1]) {
        // plantilla base: clona a personalizada para poder editar
        r.dias = diasDe(r);
        r.plantillaId = r.plantillaId; // conserva origen
      }
      var cur = r.dias[n - 1] ? r.dias[n - 1].t : '';
      var v = prompt('✏️ Tarea día ' + n + ':', cur);
      if (v === null) return;
      v = clean(v.trim(), 90);
      if (!v) { alert('La tarea no puede quedar vacía.'); return; }
      r.dias[n - 1].t = v;
      save('Tarea actualizada ✏️');
      render();
    };
  });
  var ba = $('r21all'); if (ba) ba.onclick = function () { llevarTodo(r); };
  var br = $('r21rest'); if (br) br.onclick = function () { llevarFaltantes(r); };
  var bu = $('r21un'); if (bu) bu.onclick = function () { quitarDelCalendario(r); };
  var bs = $('r21share2');
  if (bs) bs.onclick = function () {
    var lines = ['🔥 ' + r.icono + ' ' + r.nombre + ' (' + hechos(r) + '/' + T + ' · ' + pct(r) + '%)'];
    for (var n = 1; n <= T; n++) lines.push((r.checks[n] ? '✅' : '⭕') + ' D' + n + ' ' + fechaDeDia(r, n) + ': ' + tareaCorta(r, n));
    share('🔥 Reto: ' + r.nombre, lines.join('\n'));
  };
}

/* ---------- ➕ Armar plan (constructor a medida) ---------- */
function armGetDur() { return clampDur(armDur || 21); }
function renderCrear() {
  var f = $('r21cFecha');
  if (f && !f.value) f.value = todayKey();
  var box = $('r21armBox');
  if (!box || box.dataset.built) return;
  box.dataset.built = '1';
  var catOpts = ['Cuerpo', 'Mente', 'Espíritu', 'Hogar', 'Territorio', 'Estudio', 'Trabajo', 'Personalizado']
    .map(function (c) { return '<option>' + c + '</option>'; }).join('');
  box.innerHTML =
    '<div class="menstrual-card"><h4>➕ Arma tu plan a medida</h4>' +
    '<p class="muted su-11a508">1) Ponle nombre y duración · 2) elige el tipo de plan · 3) detalla · 4) crea y empieza, o guárdalo como plantilla.</p>' +
    '<div class="conv-row"><label class="su-4b3de7">Nombre <input type="text" id="r21cNombre" placeholder="ej: Mañanas en calma, Orden lunar" maxlength="50"></label>' +
    '<label>Icono <input type="text" id="r21cIcono" placeholder="🔥" maxlength="4" class="su-ef1212"></label></div>' +
    '<div class="conv-row"><label>Categoría <select id="r21cCat">' + catOpts + '</select></label>' +
    '<label>Inicio <input type="date" id="r21cFecha2"></label>' +
    '<label>Hora <input type="time" id="r21cHora" value="10:00"></label></div>' +
    '<label>¿Por qué te importa? (tu motivo) <input type="text" id="r21cMotivo" placeholder="ej: despertar con la casa en calma" maxlength="120"></label>' +
    '<div><label>Duración del plan</label><div class="r21-durs" id="r21cDurs">' +
    DURACIONES.map(function (x) { return '<button type="button" class="btn r21cd su-337714" data-v="' + x + '">' + x + ' días</button>'; }).join('') +
    '<label>Otra <input type="number" id="r21cDurCustom" min="3" max="90" value="21" class="su-ef1212"></label></div>' +
    '<p class="muted su-0d5be0" id="r21cDurInfo"></p></div>' +
    '<div class="timer-tabs su-f5554e">' +
    '<button type="button" id="r21cModoH" class="btn btn-accent su-337714">🔁 Hábito diario</button>' +
    '<button type="button" id="r21cModoL" class="btn su-337714">📝 Lista de tareas</button>' +
    '<button type="button" id="r21cModoP" class="btn su-337714">📈 Progresivo</button>' +
    '<button type="button" id="r21cModoC" class="btn su-337714">🧩 Combinado</button></div>' +
    '<div id="r21cHabBox"><label>Acción diaria (se repite todos los días) <input type="text" id="r21cAccion" placeholder="ej: Meditar 5 min después de despertar" maxlength="90"></label></div>' +
    '<div id="r21cListBox" class="hidden"><label>Pega tus tareas, una por línea (<span id="r21cListCount">21</span> líneas): <textarea id="r21cLista" rows="6" placeholder="Día 1: ...&#10;Día 2: ..."></textarea></label>' +
    '<div class="su-c158a9"><button type="button" id="r21cFill" class="btn su-337714">📋 Repetir mi acción en los N días</button></div></div>' +
    '<div id="r21cProgBox" class="hidden"><div class="conv-row">' +
    '<label>Actividad <input type="text" id="r21cPAct" placeholder="ej: Caminar" maxlength="40"></label>' +
    '<label>Unidad <input type="text" id="r21cPUni" placeholder="ej: min, vasos, páginas" maxlength="16"></label></div>' +
    '<div class="conv-row"><label>Empiezas en <input type="number" id="r21cPIni" value="10" step="any"></label>' +
    '<label>Terminas en <input type="number" id="r21cPFin" value="30" step="any"></label></div>' +
    '<p class="muted su-0d5be0">Genera una rampa suave día a día (ej: de 10 a 30 min). La exigencia sube por tercios 🌱→🌿→🌸.</p></div>' +
    '<div id="r21cComboBox" class="hidden"><label>Hasta 4 mini-acciones diarias (el ✓ del día = hacerlas todas):</label>' +
    '<input type="text" id="r21cC1" placeholder="1 · ej: Tender la cama" maxlength="60">' +
    '<input type="text" id="r21cC2" placeholder="2 · ej: 10 min de sol" maxlength="60">' +
    '<input type="text" id="r21cC3" placeholder="3 · ej: Escribir 3 líneas" maxlength="60">' +
    '<input type="text" id="r21cC4" placeholder="4 · (opcional)" maxlength="60"></div>' +
    '<div class="conv-row"><label class="check-row su-53cf90"><input type="checkbox" id="r21cAviso2"> 🔔 aviso en calendario</label></div>' +
    '<div class="menstrual-card su-d2c171"><h4>👁️ Vista previa</h4><div id="r21cPrev" class="muted"></div></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="r21cSaveTpl" class="btn su-30e741">💾 Guardar plantilla</button>' +
    '<button type="button" id="r21cGo" class="btn btn-accent su-30e741">🔥 Crear y empezar</button></div>' +
    '</div>' +
    '<div class="menstrual-card su-d2c171"><h4>✨ Mis plantillas (<span id="r21tplN">0</span>)</h4><div id="r21tplBox"></div></div>';
  // defaults
  try { $('r21cFecha2').value = todayKey(); } catch (e) {}
  paintDurButtons();
  bindArmar();
  paintPrev();
  renderTpls();
}
function paintDurButtons() {
  var box = $('r21cDurs');
  if (!box) return;
  box.querySelectorAll('.r21cd').forEach(function (b) {
    b.classList.toggle('btn-accent', +b.dataset.v === armGetDur());
    b.onclick = function () {
      armDur = +b.dataset.v;
      var ci = $('r21cDurCustom'); if (ci) ci.value = armDur;
      paintDurButtons(); paintPrev();
    };
  });
  var info = $('r21cDurInfo'), lc = $('r21cListCount');
  if (info) {
    var t = tercios(armGetDur());
    info.textContent = '⏱ ' + armGetDur() + ' días · 🌱 Siembra 1-' + t.t1 + ' · 🌿 Brote ' + (t.t1 + 1) + '-' + t.t2 + ' · 🌸 Florece ' + (t.t2 + 1) + '-' + armGetDur();
  }
  if (lc) lc.textContent = armGetDur();
}
function setArmMode(m) {
  armMode = m;
  [['H', 'habito'], ['L', 'lista'], ['P', 'progresivo'], ['C', 'combo']].forEach(function (x) {
    var b = $('r21cModo' + x[0]);
    if (b) b.classList.toggle('btn-accent', armMode === x[1]);
  });
  if ($('r21cHabBox')) $('r21cHabBox').classList.toggle('hidden', m !== 'habito');
  if ($('r21cListBox')) $('r21cListBox').classList.toggle('hidden', m !== 'lista');
  if ($('r21cProgBox')) $('r21cProgBox').classList.toggle('hidden', m !== 'progresivo');
  if ($('r21cComboBox')) $('r21cComboBox').classList.toggle('hidden', m !== 'combo');
  paintPrev();
}
function leerLista() {
  var raw = String(($('r21cLista') || {}).value || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  return raw;
}
function construirDiasPreview() {
  var total = armGetDur();
  var motivo = clean((($('r21cMotivo') || {}).value || '').trim(), 120);
  if (armMode === 'habito') {
    var acc = clean((($('r21cAccion') || {}).value || '').trim(), 90);
    if (!acc) return { error: 'Describe tu acción diaria.' };
    return { dias: generarHabito(acc, total, motivo) };
  }
  if (armMode === 'lista') {
    var raw = leerLista();
    if (raw.length < total) return { error: 'Te faltan tareas: van ' + raw.length + '/' + total + ' líneas.' };
    return { dias: raw.slice(0, total).map(function (l) { return D(l.slice(0, 90), motivo ? 'Tu motivo: ' + motivo : ''); }) };
  }
  if (armMode === 'progresivo') {
    var act = clean((($('r21cPAct') || {}).value || '').trim(), 40);
    var uni = clean((($('r21cPUni') || {}).value || '').trim(), 16) || 'min';
    var ini = ($('r21cPIni') || {}).value, fin = ($('r21cPFin') || {}).value;
    if (!act) return { error: 'Ponle nombre a la actividad (ej: Caminar).' };
    var dias = generarProgresivo(act, uni, ini, fin, total, motivo);
    if (!dias) return { error: 'Revisa los valores inicial y final (números).' };
    return { dias: dias };
  }
  // combo
  var accs = ['r21cC1', 'r21cC2', 'r21cC3', 'r21cC4'].map(function (id) { return clean((($(id) || {}).value || '').trim(), 60); }).filter(Boolean);
  if (!accs.length) return { error: 'Agrega al menos 1 mini-acción del combo.' };
  return { dias: generarCombo(accs, total, motivo) };
}
function paintPrev() {
  var box = $('r21cPrev');
  if (!box) return;
  var r = construirDiasPreview();
  if (r.error) { box.innerHTML = '<span class="muted">…' + esc(r.error) + '</span>'; return; }
  var ds = r.dias, T = ds.length;
  var show = ds.slice(0, 3).map(function (d, i) { return '<div>· <b>D' + (i + 1) + '</b> — ' + esc(d.t) + '</div>'; }).join('') +
    (T > 5 ? '<div class="muted">… (' + (T - 5) + ' días más) …</div>' : '') +
    ds.slice(-2).map(function (d, i) { return '<div>· <b>D' + (T - 2 + i + 1) + '</b> — ' + esc(d.t) + '</div>'; }).join('');
  box.innerHTML = show;
}
function leerFormBase() {
  var nombre = clean((($('r21cNombre') || {}).value || '').trim(), 50);
  var icono = clean((($('r21cIcono') || {}).value || '').trim(), 4) || '🔥';
  var cat = (($('r21cCat') || {}).value) || 'Personalizado';
  var motivo = clean((($('r21cMotivo') || {}).value || '').trim(), 120);
  var fecha = ($('r21cFecha2') || {}).value || todayKey();
  var hora = ($('r21cHora') || {}).value || '10:00';
  var aviso = !!($('r21cAviso2') || {}).checked;
  return { nombre: nombre, icono: icono, cat: cat, motivo: motivo, fecha: fecha, hora: hora, aviso: aviso };
}
function bindArmar() {
  var mh = $('r21cModoH'), ml = $('r21cModoL'), mp = $('r21cModoP'), mc = $('r21cModoC');
  if (mh) mh.onclick = function () { setArmMode('habito'); };
  if (ml) ml.onclick = function () { setArmMode('lista'); };
  if (mp) mp.onclick = function () { setArmMode('progresivo'); };
  if (mc) mc.onclick = function () { setArmMode('combo'); };
  var dc = $('r21cDurCustom');
  if (dc) dc.oninput = function () { armDur = clampDur(dc.value); paintDurButtons(); paintPrev(); };
  ['r21cNombre', 'r21cAccion', 'r21cLista', 'r21cMotivo', 'r21cPAct', 'r21cPUni', 'r21cPIni', 'r21cPFin', 'r21cC1', 'r21cC2', 'r21cC3', 'r21cC4'].forEach(function (id) {
    var el = $(id);
    if (el) el.oninput = paintPrev;
  });
  var fill = $('r21cFill');
  if (fill) fill.onclick = function () {
    var acc = clean((($('r21cAccion') || {}).value || '').trim(), 90) || clean((($('r21cNombre') || {}).value || '').trim(), 90);
    if (!acc) { alert('Escribe primero la acción diaria.'); return; }
    var lines = [];
    for (var i = 0; i < armGetDur(); i++) lines.push('Día ' + (i + 1) + ': ' + acc);
    $('r21cLista').value = lines.join('\n');
    paintPrev();
  };
  var saveTpl = $('r21cSaveTpl');
  if (saveTpl) saveTpl.onclick = function () {
    var b = leerFormBase();
    if (!b.nombre) { alert('Ponle un nombre a tu plan.'); return; }
    if (!validKey(b.fecha)) { alert('Fecha inválida'); return; }
    var hh = b.hora; if (!validHora(hh)) hh = '10:00';
    var r = construirDiasPreview();
    if (r.error) { alert(r.error); return; }
    var s = store();
    if (editTplId) {
      for (var i = 0; i < s.customs.length; i++) if (s.customs[i].id === editTplId) {
        s.customs[i].nombre = b.nombre; s.customs[i].icono = b.icono; s.customs[i].cat = b.cat;
        s.customs[i].desc = b.motivo || 'Plantilla propia.'; s.customs[i].hora = hh; s.customs[i].dias = r.dias;
      }
      editTplId = null;
      save('Plantilla actualizada 💾');
    } else {
      s.customs.push({ id: uid('c21'), nombre: b.nombre, icono: b.icono, cat: b.cat, desc: b.motivo || 'Plantilla propia.', hora: hh, dias: r.dias });
      save('Plantilla guardada 💾');
    }
    renderTpls(); renderCatalogo();
  };
  var go = $('r21cGo');
  if (go) go.onclick = function () {
    var b = leerFormBase();
    if (!b.nombre) { alert('Ponle un nombre a tu reto.'); return; }
    if (!validKey(b.fecha)) { alert('Fecha inválida'); return; }
    var hh = b.hora; if (!validHora(hh)) hh = '10:00';
    var r = construirDiasPreview();
    if (r.error) { alert(r.error); return; }
    var total = armGetDur();
    // guarda también como plantilla reutilizable
    var tplId = uid('c21');
    store().customs.push({ id: tplId, nombre: b.nombre, icono: b.icono, cat: b.cat, desc: b.motivo || 'Plan a medida.', hora: hh, dias: r.dias });
    var reto = crearRetoMedida({ nombre: b.nombre, icono: b.icono, cat: b.cat, motivo: b.motivo, total: total, inicio: b.fecha, hora: hh, conAviso: b.aviso, dias: r.dias });
    reto.plantillaId = tplId;
    save('Reto creado 🔥');
    try { $('r21cNombre').value = ''; $('r21cAccion').value = ''; $('r21cLista').value = ''; $('r21cMotivo').value = ''; } catch (e) {}
    renderTpls(); renderCatalogo();
    tab = 'Detalle';
    render();
    var llevar = confirm('🔥 ¡Reto creado (' + total + ' días)! ¿Llevar los días al calendario?');
    if (llevar) llevarTodo(reto);
  };
}
function renderTpls() {
  var box = $('r21tplBox'), n = $('r21tplN');
  if (!box) return;
  var customs = store().customs;
  if (n) n.textContent = customs.length;
  if (!customs.length) { box.innerHTML = '<p class="muted">Aún no guardas plantillas. Arma un plan arriba y pulsa 💾.</p>'; return; }
  box.innerHTML = customs.slice().reverse().slice(0, 30).map(function (c) {
    var len = (c.dias || []).length;
    return '<div class="su-cf4a10">' + esc((c.icono || '🔥') + ' ' + c.nombre) + ' · ' + len + ' días' +
      ' <button type="button" class="btn r21tu su-9f0529" data-k="' + esc(c.id) + '">▶ Usar</button>' +
      ' <button type="button" class="btn r21te su-9f0529" data-k="' + esc(c.id) + '">✏️</button>' +
      ' <button type="button" class="btn r21td su-9f0529" data-k="' + esc(c.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.r21tu').forEach(function (b) {
    b.onclick = function () { openStart(b.dataset.k); };
  });
  box.querySelectorAll('.r21td').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta plantilla? (Tus retos ya creados no se borran)')) return;
      var st = store();
      st.customs = st.customs.filter(function (x) { return x.id !== b.dataset.k; });
      save('Plantilla borrada');
      renderTpls(); renderCatalogo();
    };
  });
  box.querySelectorAll('.r21te').forEach(function (b) {
    b.onclick = function () {
      var st = store(), c = null;
      for (var i = 0; i < st.customs.length; i++) if (st.customs[i].id === b.dataset.k) c = st.customs[i];
      if (!c) return;
      editTplId = c.id;
      try {
        $('r21cNombre').value = c.nombre || '';
        $('r21cIcono').value = c.icono || '';
        $('r21cCat').value = c.cat || 'Personalizado';
        $('r21cMotivo').value = (c.desc && c.desc !== 'Plantilla propia.') ? c.desc : '';
        armDur = clampDur((c.dias || []).length || 21);
        $('r21cDurCustom').value = armDur;
        $('r21cHora').value = c.hora || '10:00';
        // carga como lista editable
        setArmMode('lista');
        $('r21cLista').value = (c.dias || []).map(function (d, j) { return 'Día ' + (j + 1) + ': ' + d.t; }).join('\n');
        paintDurButtons(); paintPrev();
        alert('✏️ Plantilla cargada abajo: edítala y pulsa 💾 Guardar plantilla.');
      } catch (e) {}
    };
  });
}
function renderGuia() {
  var box = $('r21guiaBox');
  if (!box || box.dataset.done) return;
  box.dataset.done = '1';
  box.innerHTML =
    '<div class="help-grid su-8a77e5">' +
    '<div class="help-card"><h4>🔥 Elige tu duración</h4><p class="su-11a508">7 días para probar · 14 para tomar ritmo · 21 clásico · 30 para un mes lunar · 66 para hábitos profundos. O personaliza 3-90 días. Las fases 🌱🌿🌸 se adaptan solas.</p></div>' +
    '<div class="help-card"><h4>🌱 Siembra (primer tercio)</h4><p class="su-11a508">Empieza ridículamente fácil. Mismo lugar, misma hora, misma señal (ej: después del desayuno).</p></div>' +
    '<div class="help-card"><h4>🌿 Brote (segundo tercio)</h4><p class="su-11a508">Sube la dosis. Si un día cuesta, haz la mitad pero no lo saltes: la constancia pesa más que la intensidad.</p></div>' +
    '<div class="help-card"><h4>🌸 Florece (último tercio)</h4><p class="su-11a508">Tu mejor versión. Planifica cómo seguirá después (mantención 2-3 veces por semana).</p></div>' +
    '<div class="help-card"><h4>🧩 Planes a medida</h4><p class="su-11a508">En ➕ Armar plan: <b>hábito</b> (una acción diaria) · <b>lista</b> (tareas distintas) · <b>progresivo</b> (rampa ej: 10→30 min) · <b>combinado</b> (hasta 4 mini-acciones por día). Guárdalos como plantilla y reutilízalos.</p></div>' +
    '<div class="help-card"><h4>📌 Calendario</h4><p class="su-11a508">Lleva todos los días con hora y 🔔, o solo lo que falta, o un día suelto. Cada marca es tu compromiso visible.</p></div>' +
    '<div class="help-card"><h4>📏 Regla de oro</h4><p class="su-11a508">Nunca falles dos veces seguidas. Un tropiezo es un dato; dos seguidos son una nueva costumbre. Puedes duplicar 🔁, renombrar ✏️ y editar cada tarea.</p></div>' +
    '<div class="help-card"><h4>🏆 Logros</h4><p class="su-11a508">🚀 partir · 🌱 3 días · 🌿 siembra · 🌳 brote · 🌸 completar · 🔥 racha. Compártelos con tu gente.</p></div>' +
    '</div>' +
    '<p class="muted su-e6fe60">Consejo de salud: estos retos son hábitos generales de bienestar, no tratamiento médico. Si tienes una condición de salud, consulta a tu CESFAM antes de retos físicos o alimentarios.</p>';
}
function render() {
  renderHead(); renderTabs(); renderCatalogo(); renderMis(); renderDetalle(); renderCrear(); renderGuia();
  // refresca plantillas si el panel ya existe
  try { var b = $('r21armBox'); if (b && b.dataset.built) { paintDurButtons(); renderTpls(); } } catch (e) {}
}

/* ---------- diálogo ---------- */
function build() {
  cssOnce();
  makeDialog('retos21Dialog', '🔥 Retos',
    'Elige una plantilla, ponle duración y fecha, márcalo cada día y <b>llévalo al calendario</b>. O arma tu <b>plan a medida</b> en ➕. Todo queda <b>privado y local</b> por usuario.',
    '<div id="r21head"></div>' +
    '<div class="timer-tabs su-ca7e11">' +
    '<button type="button" id="tabR21Catalogo" class="btn btn-accent su-30e741">📋 Catálogo</button>' +
    '<button type="button" id="tabR21Mis" class="btn su-30e741">🚀 Mis retos</button>' +
    '<button type="button" id="tabR21Detalle" class="btn su-30e741">📅 Día a día</button>' +
    '<button type="button" id="tabR21Crear" class="btn su-30e741">➕ Armar plan</button>' +
    '<button type="button" id="tabR21Guia" class="btn su-30e741">🏆 Guía</button>' +
    '</div>' +
    '<div id="r21CatalogoPanel"><div id="r21catFilter" class="su-6157e8"></div><div id="r21catBox" class="r21-cat"></div></div>' +
    '<div id="r21MisPanel" class="hidden"><div id="r21misBox"></div><div id="r21archBox"></div></div>' +
    '<div id="r21DetallePanel" class="hidden"><div id="r21detBox"></div></div>' +
    '<div id="r21CrearPanel" class="hidden"><div id="r21armBox"></div></div>' +
    '<div id="r21GuiaPanel" class="hidden"><div id="r21guiaBox"></div></div>');
  //Compat: si quedó un diálogo viejo con IDs legacy del formulario crear, se ignora (nuevo r21armBox manda).
}
function bind() {
  ['Catalogo', 'Mis', 'Detalle', 'Crear', 'Guia'].forEach(function (t) {
    var b = $('tabR21' + t);
    if (b) b.onclick = function () { tab = t; render(); };
  });
}

/* ---------- botón + setup ---------- */
function injectBtn(group, sub, id, txt, kw) {
  try {
    var g = document.querySelector('.action-group[data-group="' + group + '"] .group-btns');
    if (!g) return;
    if ($(id)) {
      try {
        $(id).setAttribute('data-sub', sub);
        if ($(id).textContent !== txt) $(id).textContent = txt;
        $(id).setAttribute('data-keywords', kw);
      } catch (e2) {}
      return;
    }
    var btn = document.createElement('button');
    btn.id = id; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = txt;
    try { btn.setAttribute('data-sub', sub); } catch (eS) {}
    btn.setAttribute('data-keywords', kw);
    // al final del subgrupo organizar (después de Recordatorios)
    var ref = $('btnRemind');
    if (ref && ref.parentElement === g && ref.nextSibling) { g.insertBefore(btn, ref.nextSibling); return; }
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
          } catch (e3) {}
        }
      });
    } else {
      // actualiza etiqueta existente si quedó con el nombre antiguo
      try {
        var inp = document.querySelector('#configDialog input[data-btn="' + id + '"]');
        if (inp && inp.parentElement && inp.parentElement.textContent.indexOf('21 d') >= 0) {
          inp.parentElement.innerHTML = '<input type="checkbox" data-btn="' + id + '"> ' + esc(label);
        }
      } catch (e4) {}
    }
  } catch (e) {}
}

function setup() {
  injectBtn('dia', 'organizar', 'btnRetos21', '🔥 Retos', 'reto retos desafio desafios habito habitos disciplina constancia racha progresion fases siembra brote florece calendario agregar recordar meta cambio transformacion plan planes medida personalizado desafio 21');
  registerBtn('dia', 'organizar', 'btnRetos21', '🔥 Retos', 'Mi D');
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  build();
  bind();
  render();
  var b = $('btnRetos21');
  if (b) b.onclick = function () { render(); openDlg('retos21Dialog'); };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
