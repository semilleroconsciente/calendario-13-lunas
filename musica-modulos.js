/* ============================================================
   MÚSICA Y CREACIÓN — Calendario 13 Lunas (Penco · Bío-Bío)
   Cada instrumento es una sección COMPLETA e INDEPENDIENTE:

     1) 🎼 Aprende música ................ btnAprenderInstrumento / aprenderInstrumentoDialog
        (método universal por SUBSECCIONES con pestañas: elegir,
         principios, lenguaje, oído+ritmo, cuidado, plan 28 días,
         rutinas 10/15/25 min, mesetas — sin scroll largo)
     2) 🎸 Guitarra (3 niveles) ............. btnGuitar / guitarraDialog
     3) 🪕 Ukelele .......................... btnUkelele / ukeleleDialog
     4) 🪈 Flauta / Quena ................... btnFlauta / flautaDialog
     5) 🎹 Teclado .......................... btnTeclado / tecladoDialog
     6) 🥁 Cajón ............................ btnCajon / cajonDialog
     7) 🎤 Canto ............................ btnCanto / cantoDialog
     8) 🎻 Violín ........................... btnViolin / violinDialog
     9) 🎧 Herramientas ..................... btnMusicaPractica / herramientasMusicalesDialog
        (afinador de referencia + metrónomo + tap tempo + temporizador
         + diccionario de acordes + cifrado y capo + ritmos + guías)

   Cada sección trae: guía por pasos · rutina de 15 min · su PROPIA
   bitácora (registrar / editar / compartir / borrar). Datos local y
   privado por usuario: userData().musica { tuneRef, guitarLevel, log[] }.
   Migra automáticamente la bitácora vieja de userData().guitar.
   100% offline. Sin dependencias. Educativo.
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
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
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
  var old = $(id); if (old) old.remove();
  var d = document.createElement('dialog');
  d.id = id;
  d.innerHTML = '<form method="dialog">' +
    '<div class="dlg-actions">' +
      '<h3>' + title + '</h3>' +
      '<button type="button" data-close class="btn btn-icon" title="Cerrar" aria-label="Cerrar">✕</button>' +
    '</div>' +
    (sub ? '<p class="muted">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }

/* ---------------- datos (local por usuario) ---------------- */
function store() {
  var u = null; try { u = (typeof userData === 'function') ? userData() : null; } catch (e) {}
  if (!u) return { tuneRef: 440, guitarLevel: 'principiante', log: [] };
  if (!u.musica) {
    var gl = (u.guitar && Array.isArray(u.guitar.log)) ? u.guitar.log.slice() : [];
    u.musica = {
      tuneRef: (u.guitar && u.guitar.tuneRef === 432) ? 432 : 440,
      guitarLevel: (u.guitar && u.guitar.level) || 'principiante',
      log: gl
    };
  }
  var m = u.musica;
  if (!Array.isArray(m.log)) m.log = [];
  if (m.tuneRef !== 432 && m.tuneRef !== 440) m.tuneRef = 440;
  if (!m.guitarLevel) m.guitarLevel = 'principiante';
  return m;
}
function logFor(key) {
  return store().log.filter(function (x) { return (x.inst || 'guitarra') === key; })
    .sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
}
function statsFor(key) {
  var log = logFor(key);
  var totalMin = log.reduce(function (a, b) { return a + (+b.min || 0); }, 0);
  var days = {}; log.forEach(function (x) { if (x.date) days[x.date] = 1; });
  var set = {}; Object.keys(days).forEach(function (k) { set[k] = 1; });
  var streak = 0, cur = new Date(); cur.setHours(0, 0, 0, 0);
  function fmt(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  if (!set[fmt(cur)]) cur.setDate(cur.getDate() - 1);
  while (set[fmt(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }
  return { total: log.length, totalMin: totalMin, days: Object.keys(days).length, streak: streak };
}

/* ---------------- piezas de UI reutilizables ---------------- */
function cardsHTML(list) {
  return '<div class="discipline-grid">' + list.map(function (c) {
    return '<div class="discipline-card"><h4>' + c.h + '</h4><p>' + c.p + '</p>' +
      (c.m ? '<p class="muted">' + c.m + '</p>' : '') + '</div>';
  }).join('') + '</div>';
}
function routineHTML(title, text) {
  return '<div class="menstrual-card"><h4>' + title + '</h4><p>' + text + '</p></div>';
}
function streakHTML(cfg) {
  return '<div class="menstrual-card"><div class="conv-row">' +
    '<span class="chip" id="musStreak_' + cfg.key + '">🔥 0</span>' +
    '<span class="muted">Tu racha, minutos y prácticas de ' + cfg.name + ' (local y privado)</span>' +
    '</div></div>';
}
function toolsCardHTML() {
  return '<div class="menstrual-card"><h4>🎧 Herramientas para practicar</h4>' +
    '<p class="muted">Afinador de referencia, metrónomo, tap-tempo, temporizador, acordes, cifrado y ritmos. Ábrelas en cualquier momento.</p>' +
    '<div class="dlg-actions"><button type="button" class="btn" data-open-tools>🎧 Abrir Herramientas</button></div></div>';
}
function bitacoraHTML(key, name) {
  return '<div class="menstrual-card"><h4>📓 Mi bitácora de ' + name + '</h4>' +
    '<p class="muted">Registra cada sesión: qué practicaste, cuánto y a qué nivel. Ver tu racha crecer es el mejor combustible.</p>' +
    '<div class="conv-row">' +
      '<label>📅 Fecha <input type="date" id="musDate_' + key + '"></label>' +
      '<label>⏱️ Minutos <input type="number" id="musMin_' + key + '" min="1" max="480" value="15"></label>' +
      '<label>🎯 Nivel <select id="musLevel_' + key + '">' +
        '<option value="principiante">🌱 Principiante</option>' +
        '<option value="intermedio">🌿 Intermedio</option>' +
        '<option value="avanzado">🌳 Avanzado</option></select></label>' +
    '</div>' +
    '<label>✏️ ¿Qué practicaste? <input type="text" id="musDet_' + key + '" maxlength="120" placeholder="ej: cambios Em-Am-C a 70 bpm"></label>' +
    '<div class="dlg-actions">' +
      '<button type="button" class="btn" id="musCancel_' + key + '" hidden>Cancelar</button>' +
      '<button type="button" class="btn btn-accent" id="musAdd_' + key + '">+ Guardar práctica</button>' +
    '</div>' +
    '<div class="habits-list" id="musList_' + key + '"></div>' +
    '<div class="dlg-actions">' +
      '<span class="muted" id="musStats_' + key + '">0 prácticas</span>' +
      '<button type="button" class="btn" id="musShare_' + key + '">📤 Compartir</button>' +
      '<button type="button" class="btn" id="musClear_' + key + '">🗑 Borrar</button>' +
    '</div></div>';
}

/* ---------------- contenido de cada instrumento ---------------- */
var GUITAR_TABS = [
  { id: 'b', label: '🌱 Principiante', cards: [
    { h: '🤏 Postura y manos', p: '<b>Cómo:</b> espalda recta, guitarra apoyada en la pierna, pulgar detrás del mástil (no colgando). Dedos en punta, cerca del traste sin tocarlo.', m: 'Si duelen las yemas a los 5 min, descansa: el callo llega en 2-3 semanas.' },
    { h: '🎵 Primeros 5 acordes', p: '<b>Em · Am · C · G · D.</b> Toca cada cuerda por separado: si suena apagada ("mute"), mueve el dedo y prueba otra vez.', m: 'Meta semana 1-2: cambiar Em→Am→C sin parar, a 60 bpm.' },
    { h: '👇 Rasgueo base', p: '<b>Abajo-Abajo-Arriba-Arriba-Abajo-Arriba</b> (D-D-U-U-D-U). Mano suelta desde la muñeca, no el codo rígido.', m: 'Practica 5 min con cuerdas muteadas para soltar el ritmo.' },
    { h: '🔄 Cambios limpios', p: '<b>Cómo:</b> cambia en el aire, en el último "arriba". Busca un dedo pivote (ej: dedo 1 se queda en C→Am).', m: 'Ejercicio: Em 4 tiempos → Am 4 tiempos × 5 min con metrónomo a 60-70.' },
    { h: '🎶 3 canciones fáciles', p: '<b>Knockin’ on Heaven’s Door</b> (G-D-Am) · <b>La Bamba</b> (C-F-G simplificado) · una <b>cueca</b> simple (A-E).', m: 'Toca una canción completa aunque sea lenta: terminar motiva más que ejercicios.' },
    { h: '⚠️ Errores típicos', p: '1) Apretar demasiado. 2) Pulgar colgando sobre el mástil. 3) Practicar solo 1 h un día y no volver.', m: '15 min diarios > 2 h un domingo. Afina siempre antes (🎧 Herramientas).' }
  ], routine: '1) Afinar 2 min · 2) Cambios Em-Am-C-G 5 min (60 bpm) · 3) Rasgueo D-D-U-U-D-U 4 min · 4) Canción favorita 4 min. Registra tu práctica abajo.' },
  { id: 'i', label: '🌿 Intermedio', cards: [
    { h: '✋ Cejilla sin dolor', p: '<b>F y Bm.</b> Apoya el pulgar bajo el mástil, rueda el dedo 1 sobre su costado, no lo aplastes de plano.', m: 'Si "zumba", prueba más cerca del traste y arquea los demás dedos.' },
    { h: '⚡ Power chords y palm mute', p: 'Acordes de 2-3 notas (sin la 3ra) para rock. Palmea con la mano derecha cerca del puente para acortar el sonido.', m: 'Mismo patrón movible: sirve en cualquier parte del mástil.' },
    { h: '🎼 Fingerpicking base', p: 'Patrón <b>p-i-m-a</b> (pulgar, índice, medio, anular). Pulgar en 6ta-5ta-4ta, dedos en 3ra-2da-1ra.', m: 'Empieza en Am y luego pasa a C, G y Em.' },
    { h: '🎯 Escala pentatónica menor', p: 'Forma 1 (5 trastes). Toca subiendo y bajando con metrónomo, primero 60, luego 80, 100.',
      m: 'Es la base de solos en rock, blues y folclor.' },
    { h: '🔨 Hammer-on & Pull-off', p: 'Golpea el traste con la yema (hammer) y tirando la cuerda (pull-off) sin volver a picar con la derecha.', m: 'Ejercicio: trastes 5-7-5 en cada cuerda, limpio y parejo.' },
    { h: '🚀 Repertorio intermedio', p: 'Añade cejillas + ritmos con síncopa. Grave cada canción nueva a 70-80% de los bpm finales.', m: 'Grabarte 30 s por semana revela más que 1 h de ensayo.' }
  ], routine: '1) Cejilla F/Bm 4 min · 2) Pentatónica 4 min (80 bpm) · 3) Fingerpicking p-i-m-a 4 min · 4) Canción con cejilla 3 min. Registra tu práctica abajo.' },
  { id: 'a', label: '🌳 Avanzado', cards: [
    { h: '🎷 Acordes con extensiones', p: 'maj7, m7, 9, 13, sus4. Aprende los voicings en las posiciones que ya usas y reemplaza acordes básicos.', m: 'Menos dedos, más color: a menudo necesitas solo 3 notas.' },
    { h: '🧭 Sistema CAGED y modos', p: 'Reconoce las 5 formas de DO y conéctalas por el mástil. Sobre eso, mueve los modos de la escala mayor.', m: 'Practica una tonalidad por semana con backing track.' },
    { h: '🖐️ Hybrid picking & tapping', p: 'Combina púa con dedos. Tapping: golpea la cuerda con la mano derecha sobre el mástil para notas rápidas.', m: 'Ideal para arreglos y solos melódicos.' },
    { h: '🎼 Fingerstyle / arreglos', p: 'Toca melodía + bajo + acordes a la vez. Empieza con piezas conocidas y haz tu propio arreglo.', m: 'Baja la velocidad hasta que suene limpio; sube de a 5 bpm.' },
    { h: '🎤 Improvisación y fraseo', p: 'Canta una frase y tócala. Frases de 2-4 compases con silencios: menos notas, más música.', m: 'Grábate; escucha si respiras y dejas espacio.' },
    { h: '🎛️ Sonido y composición', p: 'Ecualización, dinámica, tus propias canciones o acompañamientos de cueca/trova.', m: 'Compón algo pequeño esta semana y muéstralo a alguien.' }
  ], routine: '1) Calentamiento pentatónica/modales 4 min · 2) Ceja + extensiones 4 min · 3) Arreglo o fraseo 5 min · 4) Tocar con backing track 2 min. Registra tu práctica abajo.' }
];

var INSTR = [
  { key: 'guitarra', btn: 'btnGuitar', dlg: 'guitarraDialog', icon: '🎸', name: 'Guitarra',
    title: '🎸 Guitarra', tabsLabel: 'Elige tu nivel 👇',
    sub: 'Sección completa de guitarra: elige tu nivel, sigue la guía y su rutina de 15 min, y registra cada práctica en tu bitácora. Datos local y privado.',
    tabs: GUITAR_TABS },
  { key: 'ukelele', btn: 'btnUkelele', dlg: 'ukeleleDialog', icon: '🪕', name: 'Ukelele', title: '🪕 Ukelele',
    sub: 'El instrumento más amable para empezar: 4 cuerdas, acordes pequeños y sonido alegre. Guía base + rutina de 15 min.',
    cards: [
      { h: '🎯 Afinación y postura', p: '<b>G-C-E-A</b> (Sol-Do-Mi-La). Sostén el ukelele contra el pecho y el mástil ligeramente hacia arriba.', m: 'Afínalo con 🎧 Herramientas antes de cada práctica.' },
      { h: '🎵 Primeros 4 acordes', p: '<b>C · Am · F · G7.</b> Con estos cuatro tocas cientos de canciones.', m: 'Meta: encadenarlos a 60 bpm sin cortar el ritmo.' },
      { h: '👇 Rasgueos base', p: '<b>Abajo-Arriba-Arriba</b> y el "island strum" (D-DU-UDU). Muñeca suelta, mano relajada.', m: '5 min de rasgueo con cuerdas muteadas cada día.' },
      { h: '🎶 3 canciones fáciles', p: '<b>Riptide</b> · <b>Somewhere Over the Rainbow</b> · una cueca simple.', m: 'Canta mientras tocas: la gracia del ukelele es acompañar tu voz.' },
      { h: '⚠️ Errores típicos', p: 'Apretar de más, uñas sin limar, mirar solo los dedos.', m: 'Revisa si tu 4ta cuerda (G) es aguda o grave: cambia el sonido.' },
      { h: '🚀 Siguiente paso', p: 'Domina los 4 acordes y sube bpm, luego cejillas y fingerpicking.', m: '15 min diarios rinden más que una sesión larga semanal.' }
    ], routine: '1) Afinar 2 min · 2) Cambios C-Am-F-G7 5 min (60 bpm) · 3) Rasgueo D-DU-UDU 4 min · 4) Canción 4 min. Registra tu práctica abajo.' },
  { key: 'flauta', btn: 'btnFlauta', dlg: 'flautaDialog', icon: '🪈', name: 'Flauta / Quena', title: '🪈 Flauta / Quena',
    sub: 'Aire, digitación y oído. La flauta dulce es ideal para leer notas; la quena conecta con la música de los Andes.',
    cards: [
      { h: '🫁 Postura y respiración', p: 'Respira con el diafragma (abdomen), no con el pecho. Columna recta y hombros sueltos.', m: 'Sopla suave y constante: el aire largo hace la nota estable.' },
      { h: '🎵 Primeras 5 notas', p: 'Flauta dulce: <b>B-A-G-C-D</b>. Quena: escala base desde la nota más grave del tubo.', m: 'Practica notas largas de 8 tiempos y luego melodías de 3 notas.' },
      { h: '🎯 Embocadura (quena)', p: 'Forma un bisel con los labios sobre la muesca; dirige el aire al borde. Ajusta el ángulo hasta que el sonido sea claro y firme.', m: 'Si chirría: menos aire, más firmeza y el borde más cerca.' },
      { h: '🎶 3 melodías fáciles', p: '<b>Himno a la Alegría</b> · <b>Estrellita</b> · un tema andino sencillo (ej: "El cóndor pasa" simplificado).', m: 'Marca dónde respiras antes de tocar.' },
      { h: '⚠️ Errores típicos', p: 'Soplar de más (desafina), agujeros mal tapados, tensar el cuello.', m: 'Tapa bien con las yemas, agujeros limpios y secos.' },
      { h: '🚀 Siguiente paso', p: 'Aprende la 2da octava, articulación (tu-ku) y toca con metrónomo.', m: 'Limpiar y secar el instrumento después de cada sesión.' }
    ], routine: '1) Respiración diafragmática 2 min · 2) Notas largas 4 min · 3) Digitalización/melodía 5 min · 4) Una canción 4 min. Registra tu práctica abajo.' },
  { key: 'teclado', btn: 'btnTeclado', dlg: 'tecladoDialog', icon: '🎹', name: 'Teclado', title: '🎹 Teclado',
    sub: 'El mapa de la música a la vista: acordes, melodía y acompañamiento. Sirve teclado digital, piano o incluso apps de piano.',
    cards: [
      { h: '🖐️ Postura y manos', p: 'Manos curvas como sosteniendo una pelota, muñeca recta, dedos numerados 1-5.', m: 'Toca con la yema, no con la uña; hombros sueltos.' },
      { h: '🎵 Primeros 5 acordes', p: '<b>C · G · Am · F · Dm.</b> Con estos acompañas muchísimas canciones.', m: 'Mano izquierda: la nota raíz en el bajo (una sola nota).' },
      { h: '🎼 Escala de DO + ritmo', p: 'DO-RE-MI-FA-SOL-LA-SI con digitación 1-2-3-1-2-3-4-5. Cuenta en voz alta 1-2-3-4.', m: 'Metrónomo a 60 y toca la escala en negras, luego corcheas.' },
      { h: '🎶 3 canciones fáciles', p: '<b>Himno a la Alegría</b> · <b>Cumpleaños feliz</b> · una cueca/trova simple.', m: 'Canta la melodía antes de tocarla: ayuda a la afinación.' },
      { h: '⚠️ Errores típicos', p: 'Mirar solo las teclas, dedos planos, tocar demasiado fuerte.', m: 'Mejor poco sonido y limpio que fuerte y desordenado.' },
      { h: '🚀 Siguiente paso', p: 'Independencia de manos: bajo simple + melodía. Luego inversiones y 7mas.', m: 'Grábate tocando ambas manos y escucha el balance.' }
    ], routine: '1) Escala de DO 2 min · 2) Cambios C-G-Am-F 5 min · 3) Melodía con mano derecha 4 min · 4) Canción completa 4 min. Registra tu práctica abajo.' },
  { key: 'cajon', btn: 'btnCajon', dlg: 'cajonDialog', icon: '🥁', name: 'Cajón', title: '🥁 Cajón',
    sub: 'Percusión al alcance de todos: el latido que sostiene la cueca, la trova y cualquier canción.',
    cards: [
      { h: '🪘 Postura y sonidos', p: 'Siéntate al borde, pies en el suelo. <b>Grave</b> al centro (palma abierta), <b>agudo</b> en el borde superior (dedos), <b>slap</b> con la mano relajada.', m: 'Alterna grave-agudo lento hasta que suenen distintos.' },
      { h: '🥁 Ritmos base', p: '4/4: grave-grave-agudo-grave. Cueca 6/8: acentos 1 y 4. Empieza lento y cuenta en voz alta.', m: 'Mantén un pulso firme antes de agregar adornos.' },
      { h: '🤲 Técnica sana', p: 'Golpea desde la muñeca, no con el brazo rígido. Volumen viene de la relajación, no de la fuerza.', m: 'Si duele la mano, baja la intensidad y estira.' },
      { h: '🎶 Para acompañar', p: 'Sigue el pulso del cantante o la melodía. Escucha y completa: a veces menos golpes suenan mejor.', m: 'Practica sobre una canción que te guste.' },
      { h: '⚠️ Errores típicos', p: 'Tensar el brazo, golpear siempre en el mismo punto, perder el pulso al adornar.', m: 'Metrónomo primero; los adornos vienen después.' },
      { h: '🚀 Siguiente paso', p: 'Rellenos (fills) de 1 compás, cambios de dinámica y tocar con otros.', m: 'Filmar una sesión de 30 s para corregir postura.' }
    ], routine: '1) Grave-agudo sueltos 3 min · 2) Ritmo 4/4 5 min (60-70 bpm) · 3) Cueca 6/8 4 min · 4) Acompañar una canción 3 min. Registra tu práctica abajo.' },
  { key: 'canto', btn: 'btnCanto', dlg: 'cantoDialog', icon: '🎤', name: 'Canto', title: '🎤 Canto',
    sub: 'Tu propio instrumento: respiración, afinación y confianza. Ideal para acompañar cualquier otro instrumento.',
    cards: [
      { h: '🫁 Respiración y postura', p: 'Inhala por la nariz llevando el aire al abdomen, exhala controlado. De pie o sentado con la espalda erguida.', m: 'No levantes los hombros al respirar: infla la guata.' },
      { h: '🎵 Vocalización base', p: '5 min de vocalizos suaves (mi-me-ma-mo-mu) subiendo medio tono hasta tu límite cómodo.', m: 'Calienta siempre antes de exigir la voz.' },
      { h: '🎯 Afinación', p: 'Canta una nota sostenida junto a una referencia y ajusta hasta que no haya choque. Usa el tono del afinador (🎧 Herramientas).', m: 'Grábate cantando una canción y escucha dónde te sales.' },
      { h: '🎶 3 canciones fáciles', p: 'Elige canciones <b>en tu rango cómodo</b> (ni demasiado agudas ni graves). Ej: baladas suaves o trova.', m: 'Transponer la canción es válido: adáptala a tu voz.' },
      { h: '⚠️ Errores típicos', p: 'Gritar, tensar el cuello, cantar sin calentar, no hidratarse.', m: 'Toma agua a temperatura ambiente; descansa si la voz se raspa.' },
      { h: '🚀 Siguiente paso', p: 'Dinámica (piano/forte), fraseo y expresión. Canta con otra persona o instrumento.', m: 'La constancia diaria afina y ensancha la voz más que forzarla.' }
    ], routine: '1) Respiración 2 min · 2) Vocalizos suaves 4 min · 3) Afinación con referencia 4 min · 4) Una canción 5 min. Registra tu práctica abajo.' },
  { key: 'violin', btn: 'btnViolin', dlg: 'violinDialog', icon: '🎻', name: 'Violín', title: '🎻 Violín',
    sub: 'Sección completa de violín: postura, arco, afinación en quintas, primeras escalas y melodías. Guía base + rutina de 15 min + bitácora propia.',
    cards: [
      { h: '🎻 Partes y cuidado', p: '<b>Violín + arco + barbilla + mentoniera + clavijas + puente.</b> Guarda en estuche rígido, afloja un poco el arco tras tocar, limpia la resina con paño seco.', m: 'Nunca toques sin resina en el arco: patina y no suena.' },
      { h: '🧍 Postura y sostén', p: '<b>Cómo:</b> violín sobre la clavícula izquierda, mentón suave (sin apretar), hombro izquierdo relajado. Codo izquierdo bajo el instrumento, muñeca recta.', m: 'Si duele el cuello/hombro: revisa altura de mentoniera y relaja, no aprietes.' },
      { h: '🏹 Toma del arco y cuerdas al aire', p: 'Dedos redondeados en la nuez, pulgar curvo, muñeca flexible. Practica <b>cuerdas al aire (Sol-Re-La-Mi)</b> en el medio del arco, sonido parejo ida y vuelta.', m: 'Espejo al frente: arco recto y paralelo al puente, a mitad entre puente y diapasón.' },
      { h: '🎵 Afinación en quintas (G-D-A-E)', p: '<b>4ta Sol (G3 196Hz) · 3ra Re (D4 293.66Hz) · 2da La (A4 440Hz) · 1ra Mi (E5 659.25Hz).</b> Afina con microafinadores y las notas de 🎧 Herramientas.', m: 'Afinar de La hacia afuera: La → Re → Sol, La → Mi. De a poco, sin forzar clavijas.' },
      { h: '🎼 Primera escala + dedos', p: 'Escala de <b>La mayor en 1ra posición</b> (La-Si-Do#-Re-Mi): cinta o punto guía al inicio. Arco lento, 1 nota por arcada, luego 2 notas por arco.', m: 'Meta semana 1-2: escala de La limpia a 60 bpm + Estrellita con 1er dedo.' },
      { h: '🎶 3 melodías fáciles', p: '<b>Estrellita (Twinkle)</b> · <b>Himno a la Alegría</b> · <b>El cóndor pasa</b> (simplificado en La menor). Toca lento con metrónomo antes de cantar encima.', m: 'Cuenta los tiempos en voz alta: el ritmo manda más que la velocidad.' },
      { h: '⚠️ Errores típicos', p: '1) Apretar el cuello con la mandíbula. 2) Arco chueco o con demasiada presión (chirrido). 3) Dedos lejos de su punto (desafina). 4) Practicar 1 h un día y parar la semana.', m: 'Sonido áspero = menos peso, más velocidad de arco y punto de contacto correcto.' },
      { h: '🚀 Siguiente paso', p: '2da posición, vibrato básico, dobles cuerdas simples, escala de Re y Sol mayor, y tocar a dúo con guitarra/ukelele.', m: '15 min diarios + video de 30 s por semana: el oído hace el resto.' }
    ], routine: '1) Postura + cuerdas al aire 3 min (arco recto) · 2) Escala de La mayor 4 min (60 bpm, 1 nota por arco) · 3) Melodía fácil 5 min (Estrellita/Himno) · 4) Oído: canta y repite 1 frase 3 min. Registra tu práctica abajo.' }
];

/* ---------------- afinador y metrónomo (herramientas) ---------------- */
var audioCtx = null, tuneNodes = null, tuneTimer = null, seqTimers = [];
var metroTimer = null, metroOn = false, metroBeat = 0;

function pluckBuffer(freq, secs) {
  var sr = audioCtx.sampleRate;
  var len = Math.max(1024, Math.floor(sr * secs));
  var buf = audioCtx.createBuffer(1, len, sr);
  var d = buf.getChannelData(0);
  var delay = sr / freq - 0.5;
  var N = Math.max(2, Math.floor(delay));
  var frac = Math.min(0.999, Math.max(0, delay - N));
  var c0 = 0.5 * (1 - frac), c2 = 0.5 * frac;
  for (var i = 0; i <= N + 1 && i < len; i++) d[i] = Math.random() * 2 - 1;
  var decay = freq < 120 ? 0.9975 : freq < 200 ? 0.9968 : 0.996;
  for (var j = N + 2; j < len; j++) d[j] = decay * (c0 * d[j - N] + 0.5 * d[j - N - 1] + c2 * d[j - N - 2]);
  var peak = 0;
  for (var k = 0; k < len; k++) { var v = Math.abs(d[k]); if (v > peak) peak = v; }
  var norm = peak > 0 ? 0.9 / peak : 1;
  var fade = Math.min(len, Math.floor(sr * 0.05));
  for (var m = 0; m < len; m++) { d[m] *= norm; if (m > len - fade) d[m] *= (len - m) / fade; }
  return buf;
}
function playTone(freq, secs) {
  try {
    stopTone(true);
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    secs = secs || 4;
    var src = audioCtx.createBufferSource();
    src.buffer = pluckBuffer(freq, secs);
    var lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000;
    var g = audioCtx.createGain(); g.gain.value = 0.9;
    src.connect(lp); lp.connect(g); g.connect(audioCtx.destination);
    src.start();
    tuneNodes = { o: src, g: g };
    clearTimeout(tuneTimer);
    tuneTimer = setTimeout(function () { stopTone(true); }, secs * 1000 + 150);
  } catch (e) { alert('Audio no disponible en este dispositivo'); }
}
function refRatio() { return (store().tuneRef === 432 ? 432 : 440) / 440; }
function refLabel() { return store().tuneRef === 432 ? 'A432' : 'A440'; }
function renderTuneLabels() {
  var r = refRatio();
  document.querySelectorAll('.mus-tune').forEach(function (b) {
    var base = parseFloat(b.getAttribute('data-f')) || 0;
    b.textContent = (b.getAttribute('data-s') || '') + ' · ' + Math.round(base * r) + 'Hz';
  });
  var sel = $('musTuneRef'); if (sel) sel.value = store().tuneRef === 432 ? '432' : '440';
}
function playAllSix() {
  var r = refRatio(), ref = refLabel();
  var seq = [82.41 * r, 110 * r, 146.83 * r, 196 * r, 246.94 * r, 329.63 * r];
  var names = ['6ta Mi grave', '5ta La', '4ta Re', '3ra Sol', '2da Si', '1ra Mi agudo'];
  stopTone(true);
  var st = $('musTuneStatus');
  seq.forEach(function (f, i) {
    seqTimers.push(setTimeout(function () {
      playTone(f, 2.2);
      if (st) st.textContent = '🔊 ' + (i + 1) + '/6 · ' + names[i] + ' (' + f.toFixed(1) + ' Hz · ' + ref + ') — afina esa cuerda y espera la siguiente…';
    }, i * 1400));
  });
  seqTimers.push(setTimeout(function () { if (st) st.textContent = 'Toca una cuerda para escucharla 4 segundos (sonido de acústica).'; }, seq.length * 1400));
}
function stopTone(silent) {
  try { if (tuneNodes) { try { tuneNodes.o.stop(); } catch (e) {} try { tuneNodes.g.disconnect(); } catch (e) {} tuneNodes = null; } clearTimeout(tuneTimer); } catch (e) {}
  try { seqTimers.forEach(clearTimeout); seqTimers = []; } catch (e) {}
  if (!silent) { var st = $('musTuneStatus'); if (st) st.textContent = 'Toca una cuerda para escucharla 4 segundos (sonido de acústica).'; }
}
function metroClick(accent) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    var o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = accent ? 1600 : 1000;
    g.gain.setValueAtTime(0.25, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.07);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.08);
  } catch (e) {}
}
function metroStop() {
  metroOn = false; clearInterval(metroTimer); metroTimer = null;
  var b = $('musMetroStart'); if (b) b.textContent = '▶ Iniciar';
  var beat = $('musMetroBeat'); if (beat) beat.textContent = '♪';
}
function stopAll() { metroStop(); stopTone(true); }

/* ---------------- diálogos ---------------- */
function buildTools() {
  var tuneRow = [
    ['6ta · Mi grave', '82.41'], ['5ta · La', '110'], ['4ta · Re', '146.83'],
    ['3ra · Sol', '196'], ['2da · Si', '246.94'], ['1ra · Mi agudo', '329.63']
  ].map(function (t) {
    return '<button type="button" class="btn mus-tune" data-f="' + t[1] + '" data-s="' + t[0] + '">' + t[0] + '</button>';
  }).join('');
  var ukeRow = [
    ['4ta · Sol', '392'], ['3ra · Do', '261.63'],
    ['2da · Mi', '329.63'], ['1ra · La', '440']
  ].map(function (t) {
    return '<button type="button" class="btn mus-tune" data-f="' + t[1] + '" data-s="Uke ' + t[0] + '">' + t[0] + '</button>';
  }).join('');
  var bajoRow = [
    ['4ta · Mi grave', '41.2'], ['3ra · La', '55'],
    ['2da · Re', '73.42'], ['1ra · Sol', '98']
  ].map(function (t) {
    return '<button type="button" class="btn mus-tune" data-f="' + t[1] + '" data-s="Bajo ' + t[0] + '">' + t[0] + '</button>';
  }).join('');
  var vozRow = [
    ['Do (C4)', '261.63'], ['Mi (E4)', '329.63'],
    ['Sol (G4)', '392'], ['La (A4)', '440']
  ].map(function (t) {
    return '<button type="button" class="btn mus-tune" data-f="' + t[1] + '" data-s="Voz ' + t[0] + '">' + t[0] + '</button>';
  }).join('');
  var violinRow = [
    ['4ta · Sol (G3)', '196'], ['3ra · Re (D4)', '293.66'],
    ['2da · La (A4)', '440'], ['1ra · Mi (E5)', '659.25']
  ].map(function (t) {
    return '<button type="button" class="btn mus-tune" data-f="' + t[1] + '" data-s="Violín ' + t[0] + '">' + t[0] + '</button>';
  }).join('');
  var body =
    '<div class="menstrual-card"><h4>✅ Antes de tocar (1 min)</h4>' +
      '<p class="muted">Afina → pulso → postura → meta. Marca mentalmente: ¿qué canción? ¿a qué bpm? ¿qué compás?</p>' +
      '<p>1) Afina con los tonos de abajo · 2) Pon el metrónomo lento · 3) Espalda larga, manos sueltas · 4) Elige 1 meta ("cambios C-G a 70").</p></div>' +
    '<div class="menstrual-card"><h4>🎚️ Afinador de referencia</h4>' +
      '<p class="muted">Cada botón suena como cuerda pulsada. Afina hasta que no se oigan "olas" entre tu cuerda y esta. Guitarra: E-A-D-G-B-e.</p>' +
      '<div class="conv-row"><label>🎼 Referencia <select id="musTuneRef">' +
        '<option value="440">A440 · estándar (recomendado)</option>' +
        '<option value="432">A432 · más grave</option></select></label></div>' +
      '<p class="muted">🎸 Guitarra</p><div class="conv-row">' + tuneRow + '</div>' +
      '<div class="dlg-actions"><button type="button" class="btn" id="musTuneAll">🎸 Tocar las 6 cuerdas (6ta→1ra)</button>' +
      '<button type="button" class="btn" id="musTuneStop">⏹ Parar</button></div>' +
      '<p class="muted">🪕 Ukelele (G-C-E-A)</p><div class="conv-row">' + ukeRow + '</div>' +
      '<p class="muted">🎸 Bajo (E-A-D-G)</p><div class="conv-row">' + bajoRow + '</div>' +
      '<p class="muted">🎻 Violín (G-D-A-E, en quintas)</p><div class="conv-row">' + violinRow + '</div>' +
      '<p class="muted">🎤 Voz / flauta (notas de referencia)</p><div class="conv-row">' + vozRow + '</div>' +
      '<p class="muted" id="musTuneStatus">Toca una cuerda o nota para escucharla 4 segundos.</p>' +
      '<p class="muted">Quena/flauta: afina con Voz-Do o Voz-La y toca notas largas. Charango: usa la fila de ukelele (G-C-E-A ×2).</p></div>' +
    '<div class="menstrual-card"><h4>🥁 Metrónomo + tap-tempo</h4>' +
      '<label>Velocidad <span class="chip" id="musMetroBpmVal">80 bpm</span>' +
        '<input type="range" id="musMetroBpm" min="40" max="220" value="80"></label>' +
      '<div class="conv-row"><label>Compás <select id="musMetroCompas">' +
        '<option value="4">4/4 · rock/pop/balada</option>' +
        '<option value="3">3/4 · vals</option>' +
        '<option value="6">6/8 · cueca/andino</option>' +
        '<option value="2">2/4 · marcha/polka</option></select></label>' +
      '<span class="chip" id="musMetroBeat">♪</span></div>' +
      '<div class="conv-row"><button type="button" class="btn btn-accent" id="musMetroStart">▶ Iniciar</button>' +
      '<button type="button" class="btn" id="musMetroStop">⏹ Parar</button></div>' +
      '<p class="muted">Empieza lento (60-70) y sube de a 5 bpm solo cuando suene limpio 3 veces seguidas.</p>' +
      '<div class="conv-row"><button type="button" class="btn" id="musTap">👏 Tap: toca el pulso</button>' +
      '<span class="chip" id="musTapVal">— bpm</span>' +
      '<button type="button" class="btn" id="musTapUse">Usar en metrónomo</button></div>' +
      '<p class="muted">Toca el botón al ritmo de tu canción favorita 6-8 veces: calcula su bpm para practicarla.</p></div>' +
    '<div class="menstrual-card"><h4>⏱️ Temporizador de práctica</h4>' +
      '<div class="conv-row"><label>Duración <select id="musTimerMin">' +
        '<option value="5">5 min</option><option value="10">10 min</option>' +
        '<option value="15" selected>15 min (recomendado)</option><option value="25">25 min</option></select></label>' +
      '<span class="chip" id="musTimerVal">15:00</span></div>' +
      '<div class="conv-row"><button type="button" class="btn btn-accent" id="musTimerStart">▶ Empezar</button>' +
      '<button type="button" class="btn" id="musTimerStop">⏹ Parar</button></div>' +
      '<p class="muted">Deja sonando y toca: avisa al terminar. Ideal para no alargar un bloque.</p></div>' +
    '<div class="menstrual-card"><h4>🎼 Acordes que sí o sí (guitarra)</h4>' +
      '<p><b>Em:</b> 022000 · <b>Am:</b> x02210 · <b>C:</b> x32010 · <b>G:</b> 320003 · <b>D:</b> xx0232 · <b>A:</b> x02220 · <b>E:</b> 022100 · <b>Dm:</b> xx0231.</p>' +
      '<p class="muted">Lee de 6ta a 1ra, x = no tocar. Con Em-Am-C-G-D tocas cientos de canciones.</p>' +
      '<p><b>Ukelele:</b> C 0003 · Am 2000 · F 2010 · G 0232 · G7 0212 · Em 0432.</p>' +
      '<p><b>Progresiones que suenan bien:</b> C-G-Am-F · G-D-Em-C · Am-F-C-G · A-D-E (cueca/rock).</p>' +
      '<p class="muted">Atascado en cejilla F/Bm: usa Fmaj7 (xx3211) y Bm7 simplificado mientras llega la fuerza.</p></div>' +
    '<div class="menstrual-card"><h4>🔤 Cifrado + capo (transportar)</h4>' +
      '<p><b>C=DO · D=RE · E=MI · F=FA · G=SOL · A=LA · B=SI.</b> "m" = menor, "7" = séptima.</p>' +
      '<p>Si cantas muy alto/bajo, mueve todo: <b>capo 1 = +1 semitono</b>. Ej: C-G-Am-F con capo 2 suena D-A-Bm-G.</p>' +
      '<p class="muted">Voz: prueba la canción con capo 0-1-2-3 y quédate donde cantes cómodo sin gritar.</p></div>' +
    '<div class="menstrual-card"><h4>🥁 Ritmos base (guitarra + cajón)</h4>' +
      '<p><b>Balada 4/4:</b> D-DU-UDU · cajón: grave-grave-agudo-grave.</p>' +
      '<p><b>Rock/pop 4/4:</b> D-D-U-U-D-U · cajón: grave-agudo-grave-agudo.</p>' +
      '<p><b>Vals 3/4:</b> bajo-ras-ras (1-2-3) · cajón: grave suave-agudo-agudo.</p>' +
      '<p><b>Cueca 6/8:</b> acentos 1 y 4 (cuenta 1-2-3-4-5-6) · cajón: grave-agudo-agudo-grave-agudo-agudo.</p>' +
      '<p class="muted">Practica 5 min cada ritmo a 60-70 bpm antes de adornar. Cuenta en voz alta.</p></div>' +
    '<div class="menstrual-card"><h4>🎼 Guías de afinación rápida</h4>' +
      '<p><b>Guitarra:</b> E-A-D-G-B-e (6ta a 1ra, botones de arriba).</p>' +
      '<p><b>Ukelele:</b> G-C-E-A (4ta aguda, reentrante).</p>' +
      '<p><b>Violín:</b> G-D-A-E (Sol-Re-La-Mi, en quintas, de grave a agudo).</p>' +
      '<p><b>Bajo:</b> E-A-D-G. <b>Charango:</b> G-C-E-A (×2).</p>' +
      '<p><b>Quena/Flauta:</b> afina con una nota de referencia y toca notas largas.</p>' +
      '<p class="muted">Canto: canta una nota sostenida contra el tono y ajusta hasta que no haya choque. Grábate 20 s.</p></div>';
  makeDialog('herramientasMusicalesDialog', '🎧 Herramientas', 'Afinador (guitarra, ukelele, bajo, voz), metrónomo por compás, tap-tempo, temporizador, acordes, cifrado y ritmos. 100% offline.', body);
  var d = $('herramientasMusicalesDialog');
  if (d) d.addEventListener('close', function () { stopAll(); var ts = $('musTimerStop'); if (ts) ts.click(); });
  renderTuneLabels();
  document.querySelectorAll('.mus-tune').forEach(function (b) {
    b.onclick = function () {
      var f = (parseFloat(b.getAttribute('data-f')) || 0) * refRatio();
      playTone(f, 4);
      var st = $('musTuneStatus');
      if (st) st.textContent = '🔊 Sonando ' + (b.getAttribute('data-s') || '') + ' (' + f.toFixed(1) + ' Hz · ' + refLabel() + ', cuerda pulsada) — afina hasta que no se oigan "olas".';
    };
  });
  var tStop = $('musTuneStop'); if (tStop) tStop.onclick = function () { stopTone(); };
  var tAll = $('musTuneAll'); if (tAll) tAll.onclick = playAllSix;
  var tRef = $('musTuneRef'); if (tRef) tRef.onchange = function () { var m = store(); m.tuneRef = parseInt(tRef.value, 10) === 432 ? 432 : 440; save(); stopTone(true); renderTuneLabels(); };
  var bpm = $('musMetroBpm'), bpmVal = $('musMetroBpmVal');
  function updBpm() { if (bpmVal && bpm) bpmVal.textContent = bpm.value + ' bpm'; }
  if (bpm) bpm.oninput = function () { updBpm(); if (metroOn) { metroStop(); var s = $('musMetroStart'); if (s) s.click(); } };
  updBpm();
  var mStart = $('musMetroStart');
  if (mStart) mStart.onclick = function () {
    if (metroOn) { metroStop(); return; }
    var v = parseInt((bpm && bpm.value) || 80, 10) || 80;
    var compSel = $('musMetroCompas');
    var beats = compSel ? parseInt(compSel.value, 10) || 4 : 4;
    metroOn = true; metroBeat = 0; mStart.textContent = '⏸ Pausar';
    var beat = $('musMetroBeat');
    var tick = function () {
      metroBeat++;
      var pos = ((metroBeat - 1) % beats) + 1;
      var accent = (pos === 1);
      try { metroClick(accent); } catch (e) {}
      if (beat) beat.textContent = accent ? '🔴 1 / ' + beats : '🟡 ' + pos + ' / ' + beats;
    };
    tick(); metroTimer = setInterval(tick, 60000 / v);
  };
  var mStop = $('musMetroStop'); if (mStop) mStop.onclick = metroStop;
  var compSel2 = $('musMetroCompas');
  if (compSel2) compSel2.onchange = function () { if (metroOn) { metroStop(); var s = $('musMetroStart'); if (s) s.click(); } };
  /* tap-tempo */
  var tapTimes = [];
  var tapBtn = $('musTap'), tapVal = $('musTapVal'), tapUse = $('musTapUse');
  if (tapBtn) tapBtn.onclick = function () {
    var now = Date.now();
    tapTimes.push(now);
    if (tapTimes.length > 8) tapTimes.shift();
    if (tapTimes.length >= 3) {
      var diffs = [];
      for (var i = 1; i < tapTimes.length; i++) diffs.push(tapTimes[i] - tapTimes[i - 1]);
      var avg = diffs.reduce(function (a, b) { return a + b; }, 0) / diffs.length;
      if (avg > 250 && avg < 2000) {
        var est = Math.round(60000 / avg);
        if (tapVal) tapVal.textContent = est + ' bpm';
        tapBtn.setAttribute('data-bpm', String(est));
      }
    } else if (tapVal) tapVal.textContent = 'sigue… (' + tapTimes.length + '/3)';
    if (tapTimes.length >= 2 && now - tapTimes[tapTimes.length - 2] > 2500) { tapTimes = [now]; if (tapVal) tapVal.textContent = 'sigue… (1/3)'; }
  };
  if (tapUse) tapUse.onclick = function () {
    var est = parseInt((tapBtn && tapBtn.getAttribute('data-bpm')) || '0', 10) || 0;
    if (!est) return alert('Toca el pulso 6-8 veces primero 👆');
    if (bpm) { bpm.value = Math.max(40, Math.min(220, est)); updBpm(); }
    if (metroOn) metroStop();
    var s = $('musMetroStart'); if (s) s.click();
  };
  /* temporizador de práctica */
  var timerInt = null, timerLeft = 0;
  function fmtT(s) { s = Math.max(0, s); var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' + m : '' + m) + ':' + (r < 10 ? '0' + r : '' + r); }
  function timerShow() { var el = $('musTimerVal'); if (el) el.textContent = fmtT(timerLeft); }
  var timerMin = $('musTimerMin');
  if (timerMin) timerMin.onchange = function () { timerLeft = (parseInt(timerMin.value, 10) || 15) * 60; timerShow(); };
  timerLeft = 15 * 60; timerShow();
  var timerStart = $('musTimerStart');
  if (timerStart) timerStart.onclick = function () {
    if (timerInt) return;
    if (!timerLeft || timerLeft <= 0) timerLeft = (parseInt((timerMin && timerMin.value) || 15, 10) || 15) * 60;
    timerStart.textContent = '⏸ Sonando…';
    timerInt = setInterval(function () {
      timerLeft--; timerShow();
      if (timerLeft <= 0) {
        clearInterval(timerInt); timerInt = null;
        timerStart.textContent = '▶ Empezar';
        try { metroClick(true); setTimeout(function () { try { metroClick(true); } catch (e) {} }, 300); } catch (e) {}
        timerLeft = (parseInt((timerMin && timerMin.value) || 15, 10) || 15) * 60;
        timerShow();
        alert('⏱️ ¡Bloque completo! Anótalo en tu bitácora 👇');
      }
    }, 1000);
  };
  var timerStop = $('musTimerStop');
  if (timerStop) timerStop.onclick = function () { if (timerInt) clearInterval(timerInt); timerInt = null; if (timerStart) timerStart.textContent = '▶ Empezar'; timerLeft = (parseInt((timerMin && timerMin.value) || 15, 10) || 15) * 60; timerShow(); };
}

var editing = {};
function selectTab(cfg, tabId) {
  var d = $(cfg.dlg); if (!d) return;
  cfg.tabs.forEach(function (t) { var p = $(cfg.dlg + '_panel_' + t.id); if (p) p.hidden = (t.id !== tabId); });
  d.querySelectorAll('[data-itab]').forEach(function (b) { b.classList.toggle('btn-accent', b.getAttribute('data-itab') === tabId); });
}
function renderBitacora(cfg) {
  var box = $('musList_' + cfg.key); if (!box) return;
  var list = logFor(cfg.key);
  var stats = $('musStats_' + cfg.key);
  var chip = $('musStreak_' + cfg.key);
  var s = statsFor(cfg.key);
  if (chip) chip.textContent = '🔥 ' + s.streak + ' día' + (s.streak === 1 ? '' : 's') + ' · ' + s.totalMin + ' min';
  if (!list.length) {
    box.innerHTML = '<p class="muted">Sin prácticas registradas. ¡Anota tus primeros 15 min arriba 👆</p>';
    if (stats) stats.textContent = '0 prácticas';
    return;
  }
  box.innerHTML = list.slice(0, 60).map(function (it) {
    var lv = it.level === 'avanzado' ? '🌳' : it.level === 'intermedio' ? '🌿' : '🌱';
    return '<div class="habit-row"><span>📅 <b>' + esc(it.date || '') + '</b> · ' + lv + ' ' + esc(it.level || '') +
      ' · <b>' + esc(String(it.min || 0)) + ' min</b><br><span class="muted">' + esc(it.detail || '') + '</span></span>' +
      '<span><button type="button" class="btn btn-icon mus-edit" data-id="' + esc(it.id) + '" title="Editar">✏️</button>' +
      '<button type="button" class="btn btn-icon mus-del" data-id="' + esc(it.id) + '" title="Borrar">✕</button></span></div>';
  }).join('');
  if (stats) stats.textContent = s.total + ' prácticas · ' + s.days + ' días distintos · ' + s.totalMin + ' min · racha ' + s.streak + ' 🔥';
  box.querySelectorAll('.mus-del').forEach(function (b) {
    b.onclick = function () {
      var m = store();
      m.log = m.log.filter(function (x) { return String(x.id) !== String(b.getAttribute('data-id')); });
      save(); renderBitacora(cfg);
    };
  });
  box.querySelectorAll('.mus-edit').forEach(function (b) {
    b.onclick = function () {
      var m = store();
      var it = m.log.filter(function (x) { return String(x.id) === String(b.getAttribute('data-id')); })[0];
      if (!it) return;
      editing[cfg.key] = it.id;
      $('musDate_' + cfg.key).value = it.date || '';
      $('musMin_' + cfg.key).value = it.min || 15;
      $('musLevel_' + cfg.key).value = it.level || 'principiante';
      $('musDet_' + cfg.key).value = it.detail || '';
      $('musAdd_' + cfg.key).textContent = '↻ Actualizar';
      var c = $('musCancel_' + cfg.key); if (c) c.hidden = false;
    };
  });
}
function wireBitacora(cfg) {
  var add = $('musAdd_' + cfg.key);
  if (add) add.onclick = function () {
    var date = $('musDate_' + cfg.key).value || todayKey();
    var min = Math.max(1, Math.min(480, parseInt($('musMin_' + cfg.key).value, 10) || 15));
    var level = $('musLevel_' + cfg.key).value || 'principiante';
    var detail = $('musDet_' + cfg.key).value.trim();
    if (!detail) return alert('Cuéntanos qué practicaste (ej: cambios C-G a 70 bpm)');
    var m = store();
    if (editing[cfg.key]) {
      var idx = -1;
      for (var i = 0; i < m.log.length; i++) { if (String(m.log[i].id) === String(editing[cfg.key])) { idx = i; break; } }
      if (idx >= 0) m.log[idx] = { id: m.log[idx].id, date: date, min: min, level: level, inst: cfg.key, detail: detail };
      editing[cfg.key] = null;
      add.textContent = '+ Guardar práctica';
      var c = $('musCancel_' + cfg.key); if (c) c.hidden = true;
    } else {
      m.log.push({ id: Date.now() + '' + Math.floor(Math.random() * 999), date: date, min: min, level: level, inst: cfg.key, detail: detail });
    }
    save(); $('musDet_' + cfg.key).value = '';
    renderBitacora(cfg);
  };
  var cancel = $('musCancel_' + cfg.key);
  if (cancel) cancel.onclick = function () {
    editing[cfg.key] = null;
    $('musAdd_' + cfg.key).textContent = '+ Guardar práctica';
    cancel.hidden = true; $('musDet_' + cfg.key).value = '';
  };
  var clear = $('musClear_' + cfg.key);
  if (clear) clear.onclick = function () {
    if (!confirm('¿Borrar toda la bitácora de ' + cfg.name + '?')) return;
    var m = store();
    m.log = m.log.filter(function (x) { return (x.inst || 'guitarra') !== cfg.key; });
    save(); renderBitacora(cfg);
  };
  var sh = $('musShare_' + cfg.key);
  if (sh) sh.onclick = async function () {
    var list = logFor(cfg.key);
    if (!list.length) return alert('Sin prácticas para compartir');
    var s = statsFor(cfg.key);
    var lines = list.slice(0, 20).map(function (x) { return '· ' + x.date + ' — ' + x.level + ' ' + x.min + 'min: ' + x.detail; });
    await share('🎶 Mi práctica de ' + cfg.name, '🎶 ' + cfg.name + ' — ' + s.total + ' prácticas · ' + s.totalMin + ' min · racha ' + s.streak + ' días 🔥\n\n' + lines.join('\n'));
  };
}
function buildInstrument(cfg) {
  var body = streakHTML(cfg);
  if (cfg.tabs) {
    body += '<p class="muted">' + cfg.tabsLabel + '</p>';
    body += '<div class="timer-tabs">' + cfg.tabs.map(function (t, i) {
      return '<button type="button" class="btn' + (i === 0 ? ' btn-accent' : '') + '" data-itab="' + t.id + '">' + t.label + '</button>';
    }).join('') + '</div>';
    body += cfg.tabs.map(function (t, i) {
      return '<div id="' + cfg.dlg + '_panel_' + t.id + '"' + (i === 0 ? '' : ' hidden') + '>' +
        cardsHTML(t.cards) + routineHTML('⏱️ Rutina de 15 min — ' + t.label.replace(/^[^ ]+ /, ''), t.routine) + '</div>';
    }).join('');
  } else {
    body += cardsHTML(cfg.cards) + routineHTML('⏱️ Rutina de 15 min', cfg.routine);
  }
  body += toolsCardHTML();
  body += bitacoraHTML(cfg.key, cfg.name);
  makeDialog(cfg.dlg, cfg.title, cfg.sub, body);
  var d = $(cfg.dlg);
  if (d && cfg.tabs) {
    d.querySelectorAll('[data-itab]').forEach(function (b) {
      b.onclick = function () {
        var tabId = b.getAttribute('data-itab');
        selectTab(cfg, tabId);
        var m = store();
        m.guitarLevel = tabId === 'i' ? 'intermedio' : tabId === 'a' ? 'avanzado' : 'principiante';
        save();
      };
    });
  }
  wireBitacora(cfg);
}
function prepareAndOpen(cfg) {
  if (cfg.tabs) selectTab(cfg, store().guitarLevel === 'intermedio' ? 'i' : store().guitarLevel === 'avanzado' ? 'a' : 'b');
  var dt = $('musDate_' + cfg.key); if (dt && !dt.value) dt.value = todayKey();
  renderBitacora(cfg);
  openDlg(cfg.dlg);
}

/* ---------------- "Aprende música" (método universal por subsecciones) ---------------- */
function selectAprenderTab(tabId) {
  var d = $('aprenderInstrumentoDialog'); if (!d) return;
  var tabs = d.querySelectorAll('[data-atab]');
  tabs.forEach(function (b) { b.classList.toggle('btn-accent', b.getAttribute('data-atab') === tabId); });
  ['elegir', 'principios', 'lenguaje', 'oido', 'cuidado', 'plan', 'rutinas', 'trabas', 'instrumentos'].forEach(function (id) {
    var p = $('aprenderInstrumentoDialog_panel_' + id);
    if (p) p.hidden = (id !== tabId);
  });
  try { var sc = d.querySelector('form'); if (sc) sc.scrollTop = 0; d.scrollTop = 0; } catch (e) {}
}
function buildAprender() {
  var elegir = [
    { h: '🧒 Por edad y cuerpo', p: '<b>Niños (5-9):</b> canto, flauta dulce, ukelele o cajón liviano. <b>Jóvenes/adultos:</b> cualquiera. <b>Manos pequeñas o dolor:</b> ukelele, canto o teclado antes que guitarra con cuerdas duras.', m: 'El mejor instrumento es el que no duele y cabe en tu rutina.' },
    { h: '💰 Por presupuesto', p: '<b>$0:</b> tu voz + palmas + apps de piano. <b>Bajo:</b> flauta dulce, armónica o ukelele. <b>Medio:</b> guitarra, cajón, teclado de 61 teclas. Pide prestado 1 mes antes de comprar.', m: 'Compra solo después de 28 días seguidos de práctica.' },
    { h: '🔇 Por espacio y ruido', p: 'Depto con vecinos: <b>ukelele con sordina, teclado con audífonos, flauta con horario acordado</b>. Casa con patio: cajón, guitarra y quena sin problema.', m: 'Acuerda un horario fijo: practicar tranquilo rinde el doble.' },
    { h: '🎶 Por tu objetivo en Penco', p: '<b>Cueca y fonda:</b> guitarra + cajón + canto. <b>Trova y peña:</b> guitarra o teclado + voz. <b>Andino/espiritual:</b> quena + charango/ukelele. <b>Clásico/cine:</b> violín + teclado. <b>Iglesia/comunidad:</b> teclado + guitarra + canto.', m: 'Elige 1 objetivo y 1 canción meta para tus primeros 28 días.' },
    { h: '🧪 Prueba de 7 días', p: 'Toca 15 min diarios 7 días seguidos con la guía de ese instrumento. Si al día 7 quieres seguir, ese es el tuyo. Si no, prueba otro sin culpa.', m: 'Cambiar a tiempo no es fracasar: es afinar la elección.' }
  ];
  var principios = [
    { h: '🎯 Toca hoy, con lo que tengas', p: 'No existe "el mejor": existe el que tienes a mano. Si no tienes ninguno, empieza con tu <b>voz</b>, palmas o una flauta dulce.', m: 'La motivación diaria vale más que el instrumento caro.' },
    { h: '🕐 15 minutos todos los días', p: 'La <b>constancia vence al talento</b>. 15 min × 6 días supera a 90 min un solo domingo. Deja el instrumento a la vista.', m: 'Fricción baja = más práctica: funda abierta, afinador a mano.' },
    { h: '🎧 Afina y usa pulso siempre', p: 'Toca contra una referencia fija desde el día 1. El oído se educa con afinación y pulso correctos.', m: 'Usa Afinador + Metrónomo en 🎧 Herramientas.' },
    { h: '🧩 Sesión en 3 bloques', p: '1) <b>Técnica</b> (5 min) · 2) <b>Canción</b> (7 min) · 3) <b>Oído/ritmo</b> (3 min). Pon temporizador y no alargues un bloque.', m: 'Técnica sin canción aburre; canción sin técnica estanca.' },
    { h: '🐢 Lento y limpio', p: 'Baja el bpm hasta tocar sin errores 3 veces seguidas; recién entonces sube +5 bpm. Lo rápido y sucio se queda sucio.', m: 'El error repetido también se aprende: no lo practiques.' },
    { h: '👂 Canta lo que tocas', p: 'Tararea la melodía, marca el pulso con el pie, distingue grave/agudo. 3 min de oído al día cambian todo en 1 mes.', m: 'Un oído entrenado aprende cualquier instrumento más rápido.' },
    { h: '📓 Bitácora + video de 30 s', p: 'Anota qué, cuánto y a qué velocidad. Grábate 30 s por semana y compara cada luna.', m: 'Escucharte en frío revela más que 1 h de ensayo.' },
    { h: '🧱 Meseta = antes del salto', p: 'Cuando no avances: cambia el ejercicio, baja la velocidad, vuelve a lo fácil 3 días o toca con otros.', m: 'La meseta es la antesala del siguiente salto: no abandones ahí.' },
    { h: '🤝 Toca con alguien', p: 'Un dúo, una peña, la familia. Ajustar el tiempo con otras personas acelera oído, ritmo y memoria.', m: 'Tocar con otros es el mejor metrónomo y maestro.' },
    { h: '💧 Cuida cuerpo e instrumento', p: 'Calienta manos 1 min, para si hay dolor agudo, hidrata la voz, limpia y guarda el instrumento afinado aprox.', m: 'Dolor ≠ progreso: ajusta postura antes de insistir.' }
  ];
  var lenguaje = [
    { h: '🔤 Cifrado americano', p: '<b>C=DO · D=RE · E=MI · F=FA · G=SOL · A=LA · B=SI.</b> "m" = menor (Am = La menor). "7" = con séptima (G7). Ej: C - G - Am - F.', m: 'Con 4 cifrados tocas cientos de canciones: memoriza C-D-E-F-G-A-B.' },
    { h: '🎸 Tablatura (TAB)', p: '6 líneas = 6 cuerdas (guitarra). Número = traste. Ej: 3 en 6ta línea = 3er traste de la 6ta cuerda. Lee de izquierda a derecha.', m: 'TAB dice "dónde", no "cuánto dura": escucha la canción a la par.' },
    { h: '🎼 Pentagrama mínimo', p: '5 líneas, clave de SOL. Notas en líneas: <b>E-G-B-D-F</b> (Mi-Sol-Si-Re-Fa). En espacios: <b>F-A-C-E</b> (Fa-La-Do-Mi).', m: 'Flauta y teclado: aprende 5 notas y ya lees melodías fáciles.' },
    { h: '🥁 Figuras rítmicas', p: '<b>Redonda=4 · Blanca=2 · Negra=1 · Corchea=1/2.</b> A 60 bpm, 1 negra = 1 segundo. Cuenta "1-2-3-4" en voz alta.', m: 'Practica con el metrónomo: 4 negras → 8 corcheas sin perder el pulso.' },
    { h: '📏 Compases que usarás', p: '<b>4/4</b> (rock, pop, balada): cuenta 1-2-3-4. <b>3/4</b> (vals, cueca lenta): 1-2-3. <b>6/8</b> (cueca, andino): 1-2-3-4-5-6 con acentos en 1 y 4.', m: 'Si te pierdes, vuelve a contar en voz alta desde el 1.' },
    { h: '🔁 Estructuras de canciones', p: 'Casi todo es <b>verso-coro-verso-coro</b>. Aprende el coro primero (se repite más) y luego el verso.', m: 'Toca la canción entera lenta antes de pulir partes.' }
  ];
  var oido = [
    { h: '👂 3 min de oído (diario)', p: '1 min: canta una nota y búscala en tu instrumento. 1 min: imita 3 notas de oído. 1 min: distingue grave/agudo con ojos cerrados.', m: 'Hazlo al final: el oído cansado también aprende.' },
    { h: '👏 3 min de ritmo', p: 'Palmea negras a 60 bpm, luego corcheas, luego silencio de 1 tiempo sin perderte. Marca con el pie.', m: 'Si te adelantas, baja a 50 bpm: el pulso manda.' },
    { h: '🎤 Cantar afina todo', p: 'Canta la melodía antes de tocarla, aunque sea feo. Lo que la voz no afina, los dedos tampoco.', m: 'Grábate cantando 20 s y ajusta 1 nota por día.' }
  ];
  var cuidado = [
    { h: '🧍 Postura sana', p: 'Espalda larga, hombros sueltos, muñecas rectas. Guitarra/ukelele: pulgar detrás del mástil. Flauta: cuello libre. Cajón: pies firmes.', m: 'Dolor agudo = parar y revisar, no "aguantar".' },
    { h: '🤲 Calentamiento 1 min', p: 'Abre/cierra manos 10×, rota muñecas, estira dedos suave, toca 1 min lentísimo. Voz: humedece y vocaliza suave.', m: '1 min evita semanas de tendinitis o disfonía.' },
    { h: '🧹 Limpieza y guardado', p: 'Seca boquillas y cuerdas, sacude el cajón, tapa el teclado, guarda en funda seca. Afina aprox. antes de guardar.', m: 'Instrumento visible + funda abierta = practicas más.' }
  ];
  var plan = [
    { h: '📅 Semana 1 — Sonido limpio', p: 'Días 1-2: postura + afinación + 1 sonido/nota limpia. Días 3-5: 2-3 acordes o 5 notas en bucle lento. Días 6-7: repaso + video 30 s.', m: 'Meta: tocar sin dolor y con sonido claro.' },
    { h: '📅 Semana 2 — Sin pausas', p: 'Cambios/notas en bucle con metrónomo a 60-70. Añade tu primera canción corta (coro). 15 min diarios.', m: 'Meta: cambiar de posición sin cortar el ritmo.' },
    { h: '📅 Semana 3 — Canción completa', p: 'Toca 1 canción de principio a fin aunque sea lenta. Canta encima si puedes. Grábate y corrige solo 1 detalle.', m: 'Meta: terminarla. Terminar enseña más que pulir.' },
    { h: '📅 Semana 4 — Pulso y oído', p: 'Sube +5 bpm, limpia el sonido, haz oído 3 min/día, toca para alguien. Elige tu próxima canción.', m: 'Meta: repetir el ciclo. Cada luna = 1 canción nueva.' }
  ];
  var rutinas = [
    { h: '⚡ Rutina 10 min (días ocupados)', p: '2 min afinar/calentar · 5 min ejercicio del día a 60 bpm · 3 min canción (coro).', m: '10 min hechos > 25 min soñados.' },
    { h: '🕐 Rutina 15 min (base)', p: '2 min afinar · 5 min técnica en bucle · 5 min canción · 3 min oído/ritmo.', m: 'La que sostiene el hábito: misma hora, mismo lugar.' },
    { h: '🎯 Rutina 25 min (progreso)', p: '3 min calentar · 7 min técnica con metrónomo · 10 min canción completa · 3 min oído/cantar · 2 min bitácora.', m: 'Solo cuando la de 15 ya sale sola.' }
  ];
  var trabas = [
    { h: '⚠️ 5 errores que frenan', p: '1) Practicar 1 h un día y 0 el resto. 2) Tocar rápido y sucio. 3) No afinar. 4) Saltarse el metrónomo. 5) No grabarse nunca.', m: 'Corrige 1 por semana, no los 5 a la vez.' },
    { h: '🧱 Si te estancas 2 semanas', p: 'Baja 10 bpm, cambia de canción, toca solo lo fácil 3 días, pide oído externo o toca con alguien.', m: 'Pregunta: ¿duermo, afino y cuento en voz alta? Ahí suele estar.' },
    { h: '🤝 Tocar en Penco', p: 'Busca 1 compañero/a de pulso similar, 1 canción común y 1 fecha (peña, minga, familia). Lleva tu parte lenta pero firme.', m: 'Ir con la parte simple y a tiempo vale más que el solo perfecto.' },
    { h: '❓ Preguntas rápidas', p: '<b>¿A qué edad?</b> A cualquiera. <b>¿Sin talento?</b> No existe: existe método. <b>¿Cuándo cambio de instrumento?</b> Tras 28 días reales. <b>¿Duele?</b> Molestia leve sí; dolor agudo no.', m: 'Si dudas, parte por canto + ritmo: sirven para todo.' }
  ];
  var APRENDER_TABS = [
    { id: 'elegir', label: '🧭 Elige', intro: '1) Elige bien tu instrumento 👇', cards: elegir },
    { id: 'principios', label: '🧱 Principios', intro: '2) Los 10 principios que sí funcionan 👇', cards: principios },
    { id: 'lenguaje', label: '🔤 Lenguaje', intro: '3) Lenguaje musical mínimo (5 min) 👇', cards: lenguaje },
    { id: 'oido', label: '👂 Oído', intro: '4) Oído + ritmo en 3 min 👇', cards: oido },
    { id: 'cuidado', label: '💧 Cuerpo', intro: '5) Cuerpo e instrumento sanos 👇', cards: cuidado },
    { id: 'plan', label: '📆 Plan 28', intro: '6) Plan 28 días (repetible) 👇', cards: plan },
    { id: 'rutinas', label: '⏱️ Rutinas', intro: '7) Rutinas según tu día 👇', cards: rutinas,
      extra: routineHTML('⏱️ Rutina base de 15 min', '1) Afinar/calentar 2 min · 2) Técnica en bucle 5 min con metrónomo · 3) Canción 5 min (aunque sea lenta) · 4) Oído/ritmo 3 min. Anota en tu bitácora del instrumento.') },
    { id: 'trabas', label: '🧱 Mesetas', intro: '8) Trabas, mesetas y tocar con otros 👇', cards: trabas }
  ];
  var body =
    '<div class="menstrual-card"><h4>🌍 La verdad incómoda</h4>' +
      '<p>La mayoría abandona por <b>falta de método</b>, no de talento. Con 15 min diarios, afinación, pulso y 1 canción meta, cualquier persona aprende. Elige una subsección abajo 👇 — sin scroll largo.</p>' +
      '<div class="dlg-actions"><button type="button" class="btn" data-open-tools>🎧 Abrir Herramientas</button></div></div>' +
    '<p class="muted">📑 Subsecciones 👇</p>' +
    '<div class="timer-tabs">' + APRENDER_TABS.map(function (t, i) {
      return '<button type="button" class="btn' + (i === 0 ? ' btn-accent' : '') + '" data-atab="' + t.id + '">' + t.label + '</button>';
    }).join('') + '<button type="button" class="btn" data-atab="instrumentos">🎼 Instrumentos</button></div>' +
    APRENDER_TABS.map(function (t, i) {
      return '<div id="aprenderInstrumentoDialog_panel_' + t.id + '"' + (i === 0 ? '' : ' hidden') + '>' +
        '<p class="muted">' + t.intro + '</p>' + cardsHTML(t.cards) + (t.extra || '') + '</div>';
    }).join('') +
    '<div id="aprenderInstrumentoDialog_panel_instrumentos" hidden>' +
      '<div class="menstrual-card"><h4>🎼 Elige tu instrumento</h4>' +
      '<p class="muted">Cada uno tiene su sección completa con guía, rutina de 15 min y bitácora.</p>' +
      '<div class="conv-row">' + INSTR.map(function (c) {
        return '<button type="button" class="btn" data-open-inst="' + c.key + '">' + c.icon + ' ' + c.name + '</button>';
      }).join('') + '<button type="button" class="btn" data-open-tools>🎧 Herramientas</button></div></div></div>';
  makeDialog('aprenderInstrumentoDialog', '🎼 Aprende música', 'Método por subsecciones: elige una pestaña, 15 min diarios, lenguaje mínimo, oído y 1 canción por luna.', body);
  var dlgA = $('aprenderInstrumentoDialog');
  if (dlgA) {
    dlgA.querySelectorAll('[data-atab]').forEach(function (b) {
      b.onclick = function () { selectAprenderTab(b.getAttribute('data-atab')); };
    });
  }
}

function wire() {
  INSTR.forEach(buildInstrument);
  buildAprender();
  buildTools();
  var bA = $('btnAprenderInstrumento'); if (bA) bA.onclick = function () { selectAprenderTab('elegir'); openDlg('aprenderInstrumentoDialog'); };
  var bT = $('btnMusicaPractica'); if (bT) bT.onclick = function () { renderTuneLabels(); openDlg('herramientasMusicalesDialog'); };
  INSTR.forEach(function (cfg) { var b = $(cfg.btn); if (b) b.onclick = function () { prepareAndOpen(cfg); }; });
  document.querySelectorAll('[data-open-tools]').forEach(function (x) { x.onclick = function () { renderTuneLabels(); openDlg('herramientasMusicalesDialog'); }; });
  document.querySelectorAll('[data-open-inst]').forEach(function (x) {
    x.onclick = function () {
      var key = x.getAttribute('data-open-inst');
      var cfg = INSTR.filter(function (i) { return i.key === key; })[0];
      if (cfg) prepareAndOpen(cfg);
    };
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
