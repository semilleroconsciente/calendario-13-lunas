/* ============================================================
   RETOS 21 DÍAS — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente:
   - Botón btnRetos21 (🔥 Retos 21 días) en Mi Día > Organizar
   - Diálogo retos21Dialog con 5 pestañas:
     1) 📋 Catálogo (12 retos para diferentes cosas, con plan
        día a día y progresión en 3 fases)
     2) 🚀 Mis retos (activos, progreso, racha, archivar)
     3) 📅 Día a día (detalle del reto: grilla 21 días, check
        diario, notas, llevar días al calendario)
     4) ➕ Crear (reto personalizado: hábito diario o lista
        de 21 tareas)
     5) 🏆 Guía y logros
   - Progresión: Fase 1 (días 1-7) 🌱 Siembra · Fase 2 (8-14)
     🌿 Brote · Fase 3 (15-21) 🌸 Florece. Barra %, racha,
     días restantes, estado por día (hecho / hoy / pendiente).
   - Calendario: llevar los 21 días, lo que falta o un día
     suelto como agenda [R21 xxxxx] con hora y aviso 🔔;
     también quitar del calendario. Todo con lunaMapForKey,
     válido dentro del ciclo de 13 lunas visible.
   - Todo local y privado por usuario: userData().retos21
     { activos:[], archivo:[], customs:[] }
     activo = { id, tag, plantillaId, nombre, icono, cat,
       inicio:'yyyy-mm-dd', hora:'HH:MM', conAviso:bool,
       checks:{1:true..}, notas:{}, creado, dias?:[21] }
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

/* ---------- store ---------- */
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { activos: [], archivo: [], customs: [] };
    if (!u.retos21) u.retos21 = { activos: [], archivo: [], customs: [] };
    var s = u.retos21;
    if (!Array.isArray(s.activos)) s.activos = [];
    if (!Array.isArray(s.archivo)) s.archivo = [];
    if (!Array.isArray(s.customs)) s.customs = [];
    s.activos.forEach(function (r) {
      if (!r.checks) r.checks = {};
      if (!r.notas) r.notas = {};
      if (!r.tag) r.tag = '[R21 ' + String(r.id || 'x').slice(-5) + ']';
      if (!r.hora) r.hora = '10:00';
      if (!r.inicio) r.inicio = todayKey();
    });
    return s;
  } catch (e) { return { activos: [], archivo: [], customs: [] }; }
}

/* ---------- fases y progreso ---------- */
function faseDe(n) {
  if (n <= 7) return { n: 1, nombre: '🌱 Siembra', desc: 'Suave: instala el hábito sin pelear.' };
  if (n <= 14) return { n: 2, nombre: '🌿 Brote', desc: 'Sube la exigencia de a poco.' };
  return { n: 3, nombre: '🌸 Florece', desc: 'Consolida: tu mejor versión del reto.' };
}
function fechaDeDia(reto, n) { return addDays(reto.inicio, n - 1); }
function diaNumHoy(reto) { return diffDays(reto.inicio, todayKey()) + 1; }
function hechos(reto) {
  var c = 0;
  for (var n = 1; n <= 21; n++) if (reto.checks[n]) c++;
  return c;
}
function pct(reto) { return Math.round(hechos(reto) / 21 * 100); }
function rachaActual(reto) {
  // racha hacia atrás desde hoy (o desde el último día con marca si el reto ya terminó)
  var hoy = diaNumHoy(reto);
  var desde = Math.min(Math.max(hoy, 1), 21);
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
var CATS = ['Todos', 'Cuerpo', 'Mente', 'Espíritu', 'Hogar', 'Territorio', 'Personalizado'];

/* ---------- estado UI ---------- */
var tab = 'Catalogo';
var selId = null;
var catFilter = 'Todos';
var previewId = null;

function getReto(id) {
  var s = store();
  for (var i = 0; i < s.activos.length; i++) if (s.activos[i].id === id) return s.activos[i];
  for (var j = 0; j < s.archivo.length; j++) if (s.archivo[j].id === id) return s.archivo[j];
  return null;
}
function diasDe(reto) {
  if (reto.dias && reto.dias.length === 21) return reto.dias;
  var cat = buildCatalogo();
  for (var i = 0; i < cat.length; i++) if (cat[i].id === reto.plantillaId) return cat[i].dias;
  return [];
}
function tareaCorta(reto, n) {
  var ds = diasDe(reto);
  var d = ds[n - 1];
  if (!d) return 'Día ' + n;
  return String(d.t || d).slice(0, 60);
}

/* ---------- crear / mutar ---------- */
function empezarReto(plantillaId, inicio, hora, conAviso) {
  var cat = buildCatalogo();
  var p = null, custom = null;
  for (var i = 0; i < cat.length; i++) if (cat[i].id === plantillaId) p = cat[i];
  if (!p) {
    var s0 = store();
    for (var c = 0; c < s0.customs.length; c++) if (s0.customs[c].id === plantillaId) custom = s0.customs[c];
    if (!custom) return null;
  }
  var id = uid('r21');
  var r = {
    id: id, tag: '[R21 ' + id.slice(-5) + ']',
    plantillaId: plantillaId,
    nombre: p ? p.nombre : custom.nombre,
    icono: p ? p.icono : (custom.icono || '🔥'),
    cat: p ? p.cat : 'Personalizado',
    inicio: validKey(inicio) ? inicio : todayKey(),
    hora: validHora(hora) ? hora : ((p && p.hora) || '10:00'),
    conAviso: !!conAviso,
    checks: {}, notas: {}, creado: todayKey(),
    dias: p ? null : (custom.dias || null)
  };
  // normaliza hora
  var hp = r.hora.split(':');
  r.hora = String(hp[0]).padStart(2, '0') + ':' + String(hp[1]).padStart(2, '0');
  store().activos.push(r);
  save('Reto iniciado 🔥');
  selId = id;
  return r;
}
function llevarDias(reto, lista, opts) {
  opts = opts || {};
  var ok = 0, fuera = 0, dft = 0, dup = 0;
  lista.forEach(function (n) {
    var fecha = fechaDeDia(reto, n);
    var texto = clean(reto.tag + ' ' + reto.icono + ' ' + reto.nombre + ' · Día ' + n + '/21: ' + tareaCorta(reto, n), 80);
    var antes = (celdaPara(fecha).cell && celdaPara(fecha).cell.agenda.length) || 0;
    var res = pushAgenda(fecha, reto.hora, texto, reto.conAviso);
    if (!res.ok) { fuera++; return; }
    if (res.dft) { dft++; return; }
    var desp = (celdaPara(fecha).cell && celdaPara(fecha).cell.agenda.length) || 0;
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
  var lista = [];
  for (var n = 1; n <= 21; n++) lista.push(n);
  llevarDias(reto, lista);
}
function llevarFaltantes(reto) {
  var lista = [];
  var hoy = diaNumHoy(reto);
  for (var n = Math.max(hoy, 1); n <= 21; n++) if (!reto.checks[n]) lista.push(n);
  if (!lista.length) { try { alert('Nada que llevar: ya marcaste todo lo pendiente. 🎉'); } catch (e) {} return; }
  llevarDias(reto, lista);
}
function quitarDelCalendario(reto) {
  if (!confirm('¿Quitar los 21 días de “' + reto.nombre + '” del calendario? (Tus ✓ se conservan)')) return;
  var quitados = 0;
  for (var n = 1; n <= 21; n++) {
    var fecha = fechaDeDia(reto, n);
    var r = celdaPara(fecha);
    if (r.error || r.dft || !r.cell) continue;
    var antes = r.cell.agenda.length;
    r.cell.agenda = r.cell.agenda.filter(function (a) { return String(a.text || '').indexOf(reto.tag) < 0; });
    quitados += antes - r.cell.agenda.length;
  }
  // también limpia DFT
  try {
    var u = userData();
    Object.keys(u.cycles || {}).forEach(function (yk) {
      var cy = u.cycles[yk];
      if (cy && cy.dft && cy.dft.nota && cy.dft.nota.indexOf(reto.tag) >= 0) {
        cy.dft.nota = cy.dft.nota.split('\n').filter(function (l) { return l.indexOf(reto.tag) < 0; }).join('\n');
      }
    });
  } catch (e) {}
  save('Quitado del calendario ✓');
  refrescarCal();
  render();
}

/* ---------- logros ---------- */
function logrosDe(reto) {
  var h = hechos(reto), L = [];
  function on(c, label) { L.push({ ok: !!c, label: label }); }
  on(h >= 1, '🚀 Día 1: partiste');
  on(h >= 3, '🌱 3 días: semilla');
  on(h >= 7, '🌿 7 días: fase Siembra completa');
  on(h >= 14, '🌳 14 días: Brote completo');
  on(h >= 21, '🌸 21 días: ¡reto completado!');
  on(rachaActual(reto) >= 7, '🔥 Racha de 7');
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
    '.r21-cat{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-top:8px}';
  document.head.appendChild(st);
}
function barHTML(p) {
  return '<div class="r21-bar"><i style="width:' + p + '%"></i></div>';
}
function faseChip(n) {
  var f = faseDe(n);
  var col = f.n === 1 ? '#9fd49a' : f.n === 2 ? '#e8c56a' : '#e79ac2';
  return '<span class="chip" style="font-size:10px;border-color:' + col + '55">' + esc(f.nombre) + '</span>';
}
function renderHead() {
  var s = store();
  var box = $('r21head');
  if (!box) return;
  if (!s.activos.length && !s.archivo.length) {
    box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🔥 ¿Por qué 21 días?</h4>' +
      '<p class="muted" style="font-size:11px;line-height:1.6">Tres semanas alcanzan para instalar un hábito: la 1ª cuesta, la 2ª fluye, la 3ª se queda. Elige un reto del catálogo, ponle fecha y hora, márcalo cada día y <b>llévalo al calendario</b> para no olvidarlo. Si fallas un día, retoma al siguiente: la regla es <b>nunca fallar dos veces seguidas</b>.</p></div>';
    return;
  }
  var tot = 0, n = 0, racha = 0;
  s.activos.forEach(function (r) { tot += pct(r); n++; racha = Math.max(racha, rachaActual(r)); });
  var prom = n ? Math.round(tot / n) : 0;
  box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🔥 Tu fuego: ' + s.activos.length + ' activo(s) · promedio ' + prom + '% · mejor racha ' + racha + ' 🔥</h4>' + barHTML(prom) +
    '<p class="muted" style="font-size:11px">Marca el día de hoy en 🚀 Mis retos o en 📅 Día a día. Lleva tus días al calendario con 📌.</p></div>';
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
    .concat(customs.map(function (c) { return { kind: 'custom', p: { id: c.id, icono: c.icono || '🔥', nombre: c.nombre, cat: 'Personalizado', desc: c.desc || 'Reto personalizado.', hora: c.hora || '10:00', dias: c.dias } }; }));
  var list = all.filter(function (x) { return catFilter === 'Todos' || x.p.cat === catFilter; });
  var fbox = $('r21catFilter');
  if (fbox && !fbox.dataset.built) {
    fbox.dataset.built = '1';
    fbox.innerHTML = CATS.map(function (c) { return '<button type="button" class="btn r21-f" data-c="' + esc(c) + '" style="width:auto;font-size:11px">' + esc(c) + '</button>'; }).join('');
    fbox.querySelectorAll('.r21-f').forEach(function (b) {
      b.onclick = function () { catFilter = b.dataset.c; renderCatalogo(); };
    });
  }
  if (fbox) fbox.querySelectorAll('.r21-f').forEach(function (b) {
    b.classList.toggle('btn-accent', b.dataset.c === catFilter);
  });
  if (!list.length) { box.innerHTML = '<p class="muted" style="text-align:center">Sin retos en esta categoría.</p>'; return; }
  box.innerHTML = list.map(function (x) {
    var p = x.p;
    var prev = previewId === p.id;
    var dias = (p.dias || []).slice(0, 21);
    return '<div class="si-card"><h4>' + esc(p.icono + ' ' + p.nombre) + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(p.cat) + '</span>' +
      '<span class="chip" style="font-size:10px">21 días</span>' +
      '<span class="chip" style="font-size:10px">⏰ ' + esc(p.hora || '10:00') + '</span></p>' +
      '<p class="muted">' + esc(p.desc || '') + '</p>' +
      (prev ? '<div style="margin:6px 0;font-size:11px;line-height:1.7">' +
        dias.map(function (d, i) {
          var f = faseDe(i + 1);
          return '<div>· <b>D' + (i + 1) + '</b> <span class="muted">(' + esc(f.nombre) + ')</span> — ' + esc(d.t) + '</div>';
        }).join('') + '</div>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn r21-prev" data-k="' + esc(p.id) + '" style="width:auto;font-size:11px">' + (prev ? '🙈 Ocultar plan' : '👁️ Ver plan 21 días') + '</button>' +
      '<button type="button" class="btn btn-accent r21-start" data-k="' + esc(p.id) + '" style="width:auto;font-size:11px">▶ Empezar</button>' +
      '</div></div>';
  }).join('');
  box.querySelectorAll('.r21-prev').forEach(function (b) {
    b.onclick = function () { previewId = previewId === b.dataset.k ? null : b.dataset.k; renderCatalogo(); };
  });
  box.querySelectorAll('.r21-start').forEach(function (b) {
    b.onclick = function () { openStart(b.dataset.k); };
  });
}
function openStart(plantillaId) {
  var ini = todayKey(), hora = '10:00';
  var cat = buildCatalogo();
  for (var i = 0; i < cat.length; i++) if (cat[i].id === plantillaId && cat[i].hora) hora = cat[i].hora;
  if (!cat.some(function (p) { return p.id === plantillaId; })) {
    var s = store();
    for (var c = 0; c < s.customs.length; c++) if (s.customs[c].id === plantillaId && s.customs[c].hora) hora = s.customs[c].hora;
  }
  var f = prompt('¿Desde qué fecha parte? (aaaa-mm-dd)', ini);
  if (f === null) return;
  if (!validKey(f)) { alert('Fecha inválida. Usa formato aaaa-mm-dd.'); return; }
  var h = prompt('¿A qué hora te avisamos en el calendario? (HH:MM)', hora);
  if (h === null) h = hora;
  if (!validHora(h)) { alert('Hora inválida, se usará ' + hora + '.'); h = hora; }
  var av = confirm('¿Activar 🔔 aviso en los días llevados al calendario?\nAceptar = Sí · Cancelar = No');
  var r = empezarReto(plantillaId, f, h, av);
  if (!r) { alert('No se pudo crear el reto.'); return; }
  tab = 'Detalle';
  render();
  var llevar = confirm('🔥 ¡Reto creado! ¿Llevar los 21 días al calendario ahora?\nAceptar = Sí · Cancelar = lo marco yo después');
  if (llevar) llevarTodo(r);
}
function renderMis() {
  var box = $('r21misBox');
  if (!box) return;
  var s = store();
  if (!s.activos.length) {
    box.innerHTML = '<p class="muted" style="text-align:center">Sin retos activos. Elige uno en 📋 Catálogo o crea el tuyo en ➕ Crear.</p>';
    var ab = $('r21archBox');
    if (ab) ab.innerHTML = s.archivo.length ? archivadosHTML(s) : '';
    return;
  }
  // orden: el de hoy pendiente primero
  var arr = s.activos.slice().sort(function (a, b) { return pct(b) - pct(a); });
  box.innerHTML = arr.map(function (r) {
    var p = pct(r), h = hechos(r), hoy = diaNumHoy(r), ra = rachaActual(r);
    var estado = hoy < 1 ? '⏳ Empieza el ' + r.inicio : hoy > 21 ? (h >= 21 ? '🌸 ¡Completado!' : '🏁 Terminó: ' + h + '/21') : '📅 Hoy es el día ' + hoy + '/21';
    var tareaHoy = hoy >= 1 && hoy <= 21 ? tareaCorta(r, hoy) : '—';
    return '<div class="si-card"><h4>' + esc(r.icono + ' ' + r.nombre) + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(r.cat || '') + '</span>' +
      '<span class="chip" style="font-size:10px">📅 ' + esc(r.inicio) + ' → ' + esc(addDays(r.inicio, 20)) + '</span>' +
      '<span class="chip" style="font-size:10px">⏰ ' + esc(r.hora) + '</span>' +
      '<span class="chip" style="font-size:10px">🔥 racha ' + ra + '</span></p>' +
      '<p style="font-size:12px"><b>' + h + '/21 · ' + p + '%</b> — ' + esc(estado) + '</p>' + barHTML(p) +
      (hoy >= 1 && hoy <= 21 ? '<p style="font-size:11px">👉 Hoy: <b>' + esc(tareaHoy) + '</b> ' + (r.checks[hoy] ? '✅' : '') + '</p>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      (hoy >= 1 && hoy <= 21 ? '<button type="button" class="btn btn-accent r21-today" data-k="' + esc(r.id) + '" data-d="' + hoy + '" style="width:auto;font-size:11px">' + (r.checks[hoy] ? '↩️ Desmarcar hoy' : '✅ Marcar hoy') + '</button>' : '') +
      '<button type="button" class="btn r21-open" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">📅 Abrir día a día</button>' +
      '<button type="button" class="btn r21-cal" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">📌 Llevar al calendario</button>' +
      '<button type="button" class="btn r21-share" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">📤</button>' +
      '<button type="button" class="btn r21-arch" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px">🗄️ Archivar</button>' +
      '<button type="button" class="btn r21-del" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button>' +
      '</div></div>';
  }).join('');
  box.querySelectorAll('.r21-today').forEach(function (b) {
    b.onclick = function () {
      var r = getReto(b.dataset.k); if (!r) return;
      var d = +b.dataset.d;
      if (r.checks[d]) delete r.checks[d]; else r.checks[d] = true;
      save(r.checks[d] ? 'Día ' + d + ' logrado ✅' : 'Marca quitada');
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
      var modo = prompt('📌 Llevar al calendario:\n1 = los 21 días\n2 = solo lo que falta\n3 = quitar del calendario\n(escribe 1, 2 o 3)', '1');
      if (modo === '1') llevarTodo(r);
      else if (modo === '2') llevarFaltantes(r);
      else if (modo === '3') quitarDelCalendario(r);
    };
  });
  box.querySelectorAll('.r21-share').forEach(function (b) {
    b.onclick = function () {
      var r = getReto(b.dataset.k); if (!r) return;
      share('🔥 Reto 21 días: ' + r.nombre, r.icono + ' ' + r.nombre + '\n📅 ' + r.inicio + ' → ' + addDays(r.inicio, 20) + '\n✅ ' + hechos(r) + '/21 (' + pct(r) + '%) · 🔥 racha ' + rachaActual(r));
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
  var ab2 = $('r21archBox');
  if (ab2) ab2.innerHTML = s.archivo.length ? archivadosHTML(s) : '';
}
function archivadosHTML(s) {
  return '<div class="menstrual-card" style="margin-top:10px"><h4>🗄️ Archivados (' + s.archivo.length + ')</h4>' +
    s.archivo.slice().reverse().slice(0, 20).map(function (r) {
      return '<div style="font-size:11px;padding:4px 0;border-bottom:1px dashed #ffffff22">' + esc(r.icono + ' ' + r.nombre) +
        ' · ' + hechos(r) + '/21 (' + pct(r) + '%)' +
        ' <button type="button" class="btn r21-unarch" data-k="' + esc(r.id) + '" style="width:auto;font-size:10px;padding:2px 8px">↩️ Reactivar</button></div>';
    }).join('') + '</div>';
}
function renderDetalle() {
  var box = $('r21detBox');
  if (!box) return;
  var s = store();
  if (!s.activos.length) { box.innerHTML = '<p class="muted" style="text-align:center">Sin retos activos.</p>'; return; }
  if (!selId || !getReto(selId) || !s.activos.some(function (r) { return r.id === selId; })) selId = s.activos[0].id;
  var r = getReto(selId);
  // selector
  var sel = '<div class="conv-row"><label style="flex:2">Reto <select id="r21sel">' +
    s.activos.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === selId ? ' selected' : '') + '>' + esc(x.icono + ' ' + x.nombre + ' (' + hechos(x) + '/21)') + '</option>'; }).join('') +
    '</select></label><label>Inicio <input type="date" id="r21inicio" value="' + esc(r.inicio) + '"></label>' +
    '<label>Hora <input type="time" id="r21hora" value="' + esc(r.hora) + '"></label></div>';
  var ds = diasDe(r);
  var grid = '<div class="r21-grid">' + ds.map(function (d, i) {
    var n = i + 1, f = fechaDeDia(r, n), e = estadoDia(r, n);
    var cls = e === 'hecho' ? 'hecho' : e === 'hoy' ? 'hoy' : e === 'pendiente-atrasado' ? 'atras' : '';
    var mark = e === 'hecho' ? '✅' : e === 'hoy' ? '👉' : '⭕';
    var nota = r.notas[n] ? '<div class="muted" style="font-size:10px">📝 ' + esc(r.notas[n]) + '</div>' : '';
    return '<div class="r21-day ' + cls + '"><div><b>' + mark + ' D' + n + '</b> · ' + esc(f.slice(5)) + ' ' + faseChip(n) + '</div>' +
      '<div style="margin:4px 0"><b>' + esc(d.t) + '</b></div>' +
      (d.d ? '<div class="muted" style="font-size:10px">' + esc(d.d) + '</div>' : '') + nota +
      '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">' +
      '<button type="button" class="btn r21-chk" data-d="' + n + '" style="width:auto;font-size:10px;padding:2px 8px">' + (e === 'hecho' ? '↩️' : '✓') + '</button>' +
      '<button type="button" class="btn r21-one" data-d="' + n + '" title="Llevar este día al calendario" style="width:auto;font-size:10px;padding:2px 8px">📌</button>' +
      '<button type="button" class="btn r21-note" data-d="' + n + '" title="Nota del día" style="width:auto;font-size:10px;padding:2px 8px">📝</button>' +
      '</div></div>';
  }).join('') + '</div>';
  var L = logrosDe(r);
  box.innerHTML = sel +
    '<div class="menstrual-card" style="border-color:var(--gold);margin-top:8px"><h4>' + esc(r.icono + ' ' + r.nombre) + ' · ' + hechos(r) + '/21 (' + pct(r) + '%)</h4>' + barHTML(pct(r)) +
    '<p class="muted" style="font-size:11px">📅 ' + esc(r.inicio + ' · ' + fmtFecha(r.inicio)) + ' → ' + esc(addDays(r.inicio, 20) + ' · ' + fmtFecha(addDays(r.inicio, 20))) +
    ' · ⏰ ' + esc(r.hora) + (r.conAviso ? ' · 🔔 con aviso' : '') + ' · 🔥 racha ' + rachaActual(r) + '</p>' +
    '<p style="font-size:11px">' + L.map(function (l) { return (l.ok ? '✅ ' : '⭕ ') + esc(l.label); }).join('<br>') + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" id="r21all" class="btn btn-accent" style="width:auto;font-size:11px">📌 Llevar los 21 días</button>' +
    '<button type="button" id="r21rest" class="btn" style="width:auto;font-size:11px">📌 Llevar lo que falta</button>' +
    '<button type="button" id="r21un" class="btn" style="width:auto;font-size:11px">🗑 Quitar del calendario</button>' +
    '<button type="button" id="r21share2" class="btn" style="width:auto;font-size:11px">📤 Compartir</button>' +
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
      var texto = clean(r.tag + ' ' + r.icono + ' ' + r.nombre + ' · Día ' + n + '/21: ' + tareaCorta(r, n), 80);
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
  var ba = $('r21all'); if (ba) ba.onclick = function () { llevarTodo(r); };
  var br = $('r21rest'); if (br) br.onclick = function () { llevarFaltantes(r); };
  var bu = $('r21un'); if (bu) bu.onclick = function () { quitarDelCalendario(r); };
  var bs = $('r21share2');
  if (bs) bs.onclick = function () {
    var lines = ['🔥 ' + r.icono + ' ' + r.nombre + ' (' + hechos(r) + '/21 · ' + pct(r) + '%)'];
    for (var n = 1; n <= 21; n++) lines.push((r.checks[n] ? '✅' : '⭕') + ' D' + n + ' ' + fechaDeDia(r, n) + ': ' + tareaCorta(r, n));
    share('🔥 Reto 21 días: ' + r.nombre, lines.join('\n'));
  };
}
function renderCrear() {
  var f = $('r21cFecha');
  if (f && !f.value) f.value = todayKey();
}
function renderGuia() {
  var box = $('r21guiaBox');
  if (!box || box.dataset.done) return;
  box.dataset.done = '1';
  box.innerHTML =
    '<div class="help-grid" style="margin-top:8px">' +
    '<div class="help-card"><h4>🌱 Días 1-7 · Siembra</h4><p style="font-size:11px">Empieza ridículamente fácil. El objetivo es no fallar: mismo lugar, misma hora, misma señal (ej: después del desayuno).</p></div>' +
    '<div class="help-card"><h4>🌿 Días 8-14 · Brote</h4><p style="font-size:11px">Sube la dosis. Si un día cuesta, haz la mitad pero no lo saltes: la constancia pesa más que la intensidad.</p></div>' +
    '<div class="help-card"><h4>🌸 Días 15-21 · Florece</h4><p style="font-size:11px">Tu mejor versión. Planifica cómo seguirá después del día 21 (mantención 2-3 veces por semana).</p></div>' +
    '<div class="help-card"><h4>📌 Calendario</h4><p style="font-size:11px">Lleva los 21 días con hora y 🔔. Cada marca del calendario es tu compromiso visible día a día.</p></div>' +
    '<div class="help-card"><h4>📏 Regla de oro</h4><p style="font-size:11px">Nunca falles dos veces seguidas. Un tropiezo es un dato; dos seguidos son una nueva costumbre.</p></div>' +
    '<div class="help-card"><h4>🏆 Logros</h4><p style="font-size:11px">🚀 partir · 🌱 3 días · 🌿 7 días · 🌳 14 días · 🌸 21 días · 🔥 racha de 7. Compártelos con tu gente.</p></div>' +
    '</div>' +
    '<p class="muted" style="font-size:11px;margin-top:8px">Consejo de salud: estos retos son hábitos generales de bienestar, no tratamiento médico. Si tienes una condición de salud, consulta a tu CESFAM antes de retos físicos o alimentarios.</p>';
}
function render() {
  renderHead(); renderTabs(); renderCatalogo(); renderMis(); renderDetalle(); renderCrear(); renderGuia();
}

/* ---------- diálogo ---------- */
function build() {
  cssOnce();
  makeDialog('retos21Dialog', '🔥 Retos de 21 días',
    'Elige un reto, ponle fecha y hora, márcalo cada día y <b>llévalo al calendario</b> para no olvidarlo. Todo queda <b>privado y local</b> por usuario.',
    '<div id="r21head"></div>' +
    '<div class="timer-tabs" style="margin:10px 0;flex-wrap:wrap">' +
    '<button type="button" id="tabR21Catalogo" class="btn btn-accent" style="width:auto">📋 Catálogo</button>' +
    '<button type="button" id="tabR21Mis" class="btn" style="width:auto">🚀 Mis retos</button>' +
    '<button type="button" id="tabR21Detalle" class="btn" style="width:auto">📅 Día a día</button>' +
    '<button type="button" id="tabR21Crear" class="btn" style="width:auto">➕ Crear</button>' +
    '<button type="button" id="tabR21Guia" class="btn" style="width:auto">🏆 Guía</button>' +
    '</div>' +
    '<div id="r21CatalogoPanel"><div id="r21catFilter" style="display:flex;gap:6px;flex-wrap:wrap"></div><div id="r21catBox" class="r21-cat"></div></div>' +
    '<div id="r21MisPanel" class="hidden"><div id="r21misBox"></div><div id="r21archBox"></div></div>' +
    '<div id="r21DetallePanel" class="hidden"><div id="r21detBox"></div></div>' +
    '<div id="r21CrearPanel" class="hidden"><div class="menstrual-card">' +
    '<h4>➕ Crea tu propio reto</h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre <input type="text" id="r21cNombre" placeholder="ej: Tender la cama, 10 min de sol" maxlength="50"></label>' +
    '<label>Icono <input type="text" id="r21cIcono" placeholder="🔥" maxlength="4" style="width:80px;text-align:center"></label></div>' +
    '<label>¿Por qué te importa? (tu motivo) <input type="text" id="r21cMotivo" placeholder="ej: despertar con la casa en calma" maxlength="80"></label>' +
    '<div class="timer-tabs" style="margin:8px 0"><button type="button" id="r21cModoH" class="btn btn-accent" style="width:auto;font-size:11px">🔁 Un hábito diario</button>' +
    '<button type="button" id="r21cModoL" class="btn" style="width:auto;font-size:11px">📝 Lista de 21 tareas</button></div>' +
    '<div id="r21cHabBox"><label>Acción diaria (se repite 21 días) <input type="text" id="r21cAccion" placeholder="ej: Meditar 5 min después de despertar" maxlength="80"></label></div>' +
    '<div id="r21cListBox" class="hidden"><label>Pega tus 21 tareas (una por línea) <textarea id="r21cLista" rows="6" placeholder="Día 1: ...&#10;Día 2: ..."></textarea></label></div>' +
    '<div class="conv-row"><label>Inicio <input type="date" id="r21cFecha"></label>' +
    '<label>Hora <input type="time" id="r21cHora" value="10:00"></label>' +
    '<label class="check-row" style="align-self:end"><input type="checkbox" id="r21cAviso"> 🔔 aviso</label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="r21cGo" class="btn btn-accent" style="width:auto">🔥 Crear y empezar</button></div>' +
    '</div></div>' +
    '<div id="r21GuiaPanel" class="hidden"><div id="r21guiaBox"></div></div>');
}
var createMode = 'habito';
function bind() {
  ['Catalogo', 'Mis', 'Detalle', 'Crear', 'Guia'].forEach(function (t) {
    var b = $('tabR21' + t);
    if (b) b.onclick = function () { tab = t; render(); };
  });
  var mh = $('r21cModoH'), ml = $('r21cModoL');
  if (mh) mh.onclick = function () {
    createMode = 'habito';
    mh.classList.add('btn-accent'); if (ml) ml.classList.remove('btn-accent');
    if ($('r21cHabBox')) $('r21cHabBox').classList.remove('hidden');
    if ($('r21cListBox')) $('r21cListBox').classList.add('hidden');
  };
  if (ml) ml.onclick = function () {
    createMode = 'lista';
    ml.classList.add('btn-accent'); if (mh) mh.classList.remove('btn-accent');
    if ($('r21cListBox')) $('r21cListBox').classList.remove('hidden');
    if ($('r21cHabBox')) $('r21cHabBox').classList.add('hidden');
  };
  var go = $('r21cGo');
  if (go) go.onclick = function () {
    var nombre = clean((($('r21cNombre') || {}).value || '').trim(), 50);
    if (!nombre) { alert('Ponle un nombre a tu reto.'); return; }
    var icono = clean((($('r21cIcono') || {}).value || '').trim(), 4) || '🔥';
    var motivo = clean((($('r21cMotivo') || {}).value || '').trim(), 80);
    var fecha = ($('r21cFecha') || {}).value || todayKey();
    if (!validKey(fecha)) { alert('Fecha inválida'); return; }
    var hora = ($('r21cHora') || {}).value || '10:00';
    if (!validHora(hora)) hora = '10:00';
    var aviso = !!($('r21cAviso') || {}).checked;
    var dias = [];
    if (createMode === 'habito') {
      var acc = clean((($('r21cAccion') || {}).value || '').trim(), 80);
      if (!acc) { alert('Describe tu acción diaria.'); return; }
      for (var i = 0; i < 21; i++) {
        var f = faseDe(i + 1);
        dias.push(D(acc, (motivo ? 'Tu motivo: ' + motivo + '. ' : '') + f.nombre + ': ' + f.desc));
      }
    } else {
      var raw = String(($('r21cLista') || {}).value || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (raw.length < 21) { alert('Te faltan tareas: van ' + raw.length + '/21 líneas.'); return; }
      for (var j = 0; j < 21; j++) dias.push(D(raw[j].slice(0, 80), motivo ? 'Tu motivo: ' + motivo : ''));
    }
    var id = uid('c21');
    store().customs.push({ id: id, nombre: nombre, icono: icono, desc: motivo || 'Reto personalizado.', hora: hora, dias: dias });
    save('Plantilla creada ✓');
    // limpiar form
    try { $('r21cNombre').value = ''; $('r21cAccion').value = ''; $('r21cLista').value = ''; $('r21cMotivo').value = ''; } catch (e) {}
    var r = empezarReto(id, fecha, hora, aviso);
    if (!r) { alert('No se pudo iniciar.'); return; }
    tab = 'Detalle';
    render();
    var llevar = confirm('🔥 ¡Reto creado! ¿Llevar los 21 días al calendario?');
    if (llevar) llevarTodo(r);
  };
}

/* ---------- botón + setup ---------- */
function injectBtn(group, sub, id, txt, kw) {
  try {
    var g = document.querySelector('.action-group[data-group="' + group + '"] .group-btns');
    if (!g) return;
    if ($(id)) { try { $(id).setAttribute('data-sub', sub); } catch (e2) {} return; }
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
    }
  } catch (e) {}
}

function setup() {
  injectBtn('dia', 'organizar', 'btnRetos21', '🔥 Retos 21 días', 'reto retos 21 veintiun habito habitos desafio disciplina constancia racha progresion fases siembra brote florece calendario agregar recordar meta cambio transformacion');
  registerBtn('dia', 'organizar', 'btnRetos21', '🔥 Retos 21 días', 'Mi D');
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
