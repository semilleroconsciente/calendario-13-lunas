/* ============================================================
   APOYO EN EMERGENCIAS — Calendario 13 Lunas
   Apartado: Territorio > 🆘 Apoyo Emergencia (botón propio al
     lado de 🎉 Penco, 🏛️ Municipalidad y 🚒 Bomberos:
     btnApoyo -> apoyoDialog -> apoyoPanel).
   - Ante cualquier emergencia: primeras horas,
     catastro y beneficios (FIBE), contención, dónde ir,
     mochila de 72 horas y plan personal.
   - Cada paso/trámite tiene "☑️ Hecho" y los trámites además
     "📌 Calendario": crea un compromiso 🕐 en el día elegido
     (con hora y 🔔 opcional).
   - "⭐ Mi plan": checklist + notas + pasos propios.
   Todo local y privado por usuario: userData().apoyoPenco
     { hechos:{}, notas:{}, mios:[], avisos:[] }
   Fuente preferida: data/territorios/<id>/apoyo-emergencia.json
   vía window.Territorio (ver territorio.js). Fallback: datos
   embebidos abajo (Penco, DIDECO/SENAPRED, 2026-09).
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
var APOYO = {
  intro: {
    nombre: 'Apoyo en Emergencias — Penco',
    texto: 'Si el fuego, el terremoto, el tsunami o la inundación te golpeó: aquí está el camino paso a paso. Qué hacer las primeras horas, cómo quedar en el catastro (FIBE), qué beneficios pedir, dónde contenerte y cómo levantarte.',
    nota: 'Las ayudas cambian con cada emergencia: verifica siempre vigencia en DIDECO (O’Higgins 500) y en penco.cl. Nada de lo anotado aquí sale de tu dispositivo.'
  },
  primerasHoras: [
    { id: 'personas-salvo', icon: '🧍', nombre: 'Personas y mascotas a salvo', detalle: 'Punto de encuentro familiar acordado. No vuelvas a entrar a la casa en llamas o inestable: avisa a bomberos si alguien quedó dentro.', donde: 'Punto de encuentro + 132' },
    { id: 'pedir-ayuda', icon: '📢', nombre: 'Pedir ayuda: 132 · 131 · *4157', detalle: '132 bomberos (fuego), 131 SAMU (heridos), *4157 Seguridad Penco. Di comuna PENCO, calle, referencia.', donde: '132 / 131 / *4157' },
    { id: 'no-remover', icon: '📸', nombre: 'Fotografía todo antes de remover', detalle: 'Foto y video de cada pieza y pertenencia ANTES de limpiar o botar. Es tu prueba para el catastro, seguros y beneficios.', donde: 'Tu casa (cuando sea seguro)' },
    { id: 'albergue', icon: '🏕️', nombre: 'Albergue o techo temporal', detalle: 'El municipio habilita albergues en cada emergencia. Si te quedas con familiares, avísalo igual a DIDECO para quedar en el catastro.', donde: 'Albergue municipal / DIDECO 41-2261432' },
    { id: 'fibe', icon: '📋', nombre: 'Pedir la FIBE', detalle: 'La Ficha Básica de Emergencia la aplica el municipio en terreno o en DIDECO. Es la puerta de entrada a casi todas las ayudas del Estado.', donde: 'DIDECO · O’Higgins 500' },
    { id: 'documentos', icon: '🪪', nombre: 'Documentos: reponer lo quemado', detalle: 'Cédula en Registro Civil, escrituras en Conservador, cuentas y claves. Guarda todo en una carpeta o en el celular.', donde: 'Registro Civil + DIDECO' },
    { id: 'agua-abrigo', icon: '🧥', nombre: 'Agua, abrigo y alimento', detalle: 'Puntos de acopio oficiales del municipio y JJVV. Recibe y dona solo por canales oficiales.', donde: 'Puntos de acopio (penco.cl / JJVV)' },
    { id: 'mascotas', icon: '🐾', nombre: 'Mascotas afectadas', detalle: 'Agua, alimento y revisión veterinaria. El Veterinario Municipal (+56 9 4401 1613) hace operativos en emergencias.', donde: 'Veterinario Municipal' }
  ],
  catastro: {
    intro: 'Quedar catastrado es lo que abre las ayudas. Hazlo aunque el daño parezca poco: los listados se cierran.',
    pasos: [
      { id: 'fibe-detalle', icon: '📋', nombre: 'FIBE — Ficha Básica de Emergencia', donde: 'DIDECO · O’Higgins 500 · en terreno', cuando: 'Lo antes posible (los catastros tienen plazo)', requisitos: ['Cédula (o reposición)', 'Dirección exacta del domicilio', 'Fotos/videos del daño'], costo: 'Gratuito', tip: 'Si el encuestador no pasó por tu casa, ve tú a DIDECO.' },
      { id: 'rsh-emergencia', icon: '📊', nombre: 'Registro Social de Hogares al día', donde: 'DIDECO 41-2261413 / registrosocial.gob.cl', cuando: 'Todo el año; urgente tras la emergencia', requisitos: ['Cédula de integrantes', 'Comprobante de domicilio', 'Clave Única'], costo: 'Gratuito', tip: 'Casi todo beneficio cruza tu RSH: actualízalo primero.' },
      { id: 'costo-cero', icon: '💸', nombre: 'Plan Costo Cero (familias afectadas)', donde: 'Municipalidad · OIRS', cuando: 'Activado tras incendios de enero 2026 (verificar vigencia)', requisitos: ['Estar en catastro/FIBE', 'Cédula'], costo: 'Gratuidad en trámites', tip: 'Pregunta en OIRS qué trámites cubre hoy.' },
      { id: 'vivienda', icon: '🏠', nombre: 'Reconstrucción de vivienda', donde: 'EGIS Municipal 41-2261536 · DIDECO', cuando: 'Postulación por llamados post-emergencia', requisitos: ['FIBE aplicada', 'RSH', 'Acreditar dominio o tenencia'], costo: 'Subsidio (según tramo)', tip: 'La EGIS municipal postula por ti.' },
      { id: 'omil-emergencia', icon: '💼', nombre: 'Empleo de emergencia y OMIL', donde: 'OMIL 41-2261347', cuando: 'Programas post-emergencia + bolsa permanente', requisitos: ['CV', 'Cédula', 'Inscripción BNE'], costo: 'Gratuito', tip: 'Si perdiste herramientas o tu trabajo, dilo en OMIL.' },
      { id: 'salud-emergencia', icon: '🏥', nombre: 'Salud: crónicos y recetas', donde: 'CESFAM Penco 41-2723960 · Lirquén 41-2688321', cuando: 'De inmediato', requisitos: ['Acudir al SOME aunque perdieras el carnet'], costo: 'Gratuito (FONASA)', tip: 'Retoma tus controles la primera semana.' }
    ]
  },
  contencion: {
    intro: 'El impacto emocional de una emergencia dura mucho más que el evento mismo. Miedo, pena, rabia, culpa o no poder dormir son reacciones normales ante algo anormal. Pedir ayuda psicológica también es reconstruir: calmar el cuerpo, ordenar los días y apoyarse en otros.',
    reacciones: [
      'Miedo, alerta constante o sobresaltos ante ruidos, olores o sirenas',
      'Pena, llanto fácil, rabia o irritabilidad sin causa clara',
      'Culpa por lo que se hizo o no se alcanzó a hacer',
      'Dificultad para dormir, pesadillas, cansancio durante el día',
      'Desconcentración, olvidos, sensación de irrealidad o embotamiento',
      'Dolores de cuerpo (cabeza, espalda, estómago) sin causa médica clara',
      'En niños y niñas: aferrarse, miedo a separarse, retrocesos como mojar la cama'
    ],
    calma: [
      { nombre: 'Respiración 4-4-6', detalle: 'Inhala en 4 tiempos, sostén en 4, bota en 6. Repite 4 veces. Hazlo antes de decidir o llamar.' },
      { nombre: 'Técnica 5-4-3-2-1', detalle: 'Nombra 5 cosas que ves, 4 que puedes tocar, 3 que escuchas, 2 que hueles y 1 que saboreas. Te devuelve al presente.' },
      { nombre: 'Agua, pies y pausa', detalle: 'Lávate cara y manos con agua fría, toma agua despacio, planta bien los pies. Si puedes, sal a tomar aire.' },
      { nombre: 'Rutina mínima', detalle: 'Horarios de comida, sueño y abrigo aunque sean simples. La rutina calma, sobre todo a niños y mayores.' },
      { nombre: 'Descarga sin daño', detalle: 'Caminar, respirar, escribir lo que sientes o hablar con alguien de confianza. Evita alcohol, drogas o automedicarte para calmarte.' }
    ],
    queHacer: [
      'Escucha sin interrumpir y cree lo que te cuentan',
      "Valida: 'tiene sentido que te sientas así'",
      "Pregunta '¿qué necesitas ahora?' en vez de suponer",
      'Ayuda con algo concreto: cuidar niños, hacer una fila, cocinar, cargar, prestar el celular',
      'Respeta silencios y tiempos; vuelve a preguntar otro día',
      'Incluye a niños, personas mayores, personas con discapacidad y mascotas en el cuidado'
    ],
    queEvitar: [
      "Decir 'tienes que ser fuerte', 'no llores' o 'ya pasó, olvídalo'",
      'Obligar a contar los detalles una y otra vez',
      "Comparar dolores ('otros están peor')",
      "Prometer lo que no puedes cumplir ('te van a dar casa pronto')",
      'Aislarse por vergüenza: pedir ayuda es parte de salir adelante'
    ],
    grupos: [
      { nombre: 'Niñas y niños', dato: 'Rutina, escuela y juego lo antes posible', nota: 'Verdad en palabras simples, horarios, abrazos. Pide apoyo en la escuela y el CESFAM si deja de comer, dormir o jugar por varios días.' },
      { nombre: 'Adolescentes', dato: 'Escucha sin sermón, mantén horarios y dales un rol', nota: 'Pueden ayudar en tareas concretas. Atento a encierro total, consumo o conductas de riesgo.' },
      { nombre: 'Personas mayores', dato: 'No las dejes solas en la toma de decisiones', nota: 'Acompaña trámites, remedios y controles. El desarraigo les pega fuerte: visitas y rutina diaria ayudan.' },
      { nombre: 'Personas neurodivergentes o con discapacidad', dato: 'Mantén objetos, rutinas y apoyos habituales', nota: 'Anticipa cambios con calma, reduce ruidos y espera. Coordina apoyos con CESFAM y escuela.' },
      { nombre: 'Duelo por pérdidas', dato: 'Sección 🕊️ Duelo de esta misma app', nota: 'Personas, mascotas y la casa también se duelan. Date permiso y date tiempo.' }
    ],
    senales: [
      'Pensamientos de hacerte daño o de no querer seguir viviendo: pide ayuda hoy mismo (*4141 o 600 360 7777)',
      'No duermes ni comes por días, no logras levantarte o funcionar',
      'Crisis de pánico frecuentes o aumento del consumo de alcohol o medicamentos',
      'La tensión en casa escala a gritos, amenazas o golpes',
      'Los síntomas no bajan tras un mes o empeoran con el tiempo',
      'Un niño o niña deja de hablar, comer o jugar por varios días'
    ],
    recursos: [
      { nombre: 'Dupla psicosocial / Salud mental CESFAM', dato: 'Pide hora en SOME (Penco 41-2723960 · Lirquén 41-2688321)', nota: 'Atención gratuita; derivan a terapia si la necesitas. Retoma controles la primera semana.' },
      { nombre: 'Salud Responde', dato: '600 360 7777 (24 h, gratis)', nota: 'Orientación de salud y contención telefónica para ti o para ayudar a otro.' },
      { nombre: 'Prevención del suicidio *4141', dato: '*4141 desde celular (24 h, gratis)', nota: 'Si tú o alguien cercano lo está pasando mal: llama ahora, no esperes.' },
      { nombre: 'Fono Niños y Adolescentes', dato: '147 de Carabineros (24 h)', nota: 'Orientación para niños, adolescentes y adultos que los cuidan.' },
      { nombre: 'Fono Familia', dato: '149 de Carabineros (24 h)', nota: 'Violencia dentro de la familia: orientación y derivación.' },
      { nombre: 'Violencia contra la mujer', dato: '1455 de SernamEG (24 h)', nota: 'Orientación confidencial. El estrés post-desastre puede aumentar la violencia: habla a tiempo.' },
      { nombre: 'Apoyo municipal y comunitario', dato: 'DIDECO 41-2261432 · tu JJVV y escuela', nota: 'Dupla psicosocial en terreno, ollas comunes, redes vecinales. No enfrentes todo en soledad.' },
      { nombre: 'Duelo por pérdidas', dato: 'Sección 🕊️ Duelo de esta misma app', nota: 'Personas, mascotas y la casa también se duelan. Date permiso.' },
      { nombre: 'Quien cuida también se cuida', dato: 'Túrnate, duerme, come y pide relevo', nota: 'No puedes sostener a otros con el cuerpo vacío. Descansa sin culpa.' }
    ],
    cierre: 'Cuidar la mente es tan urgente como el techo y la comida. Si hoy solo alcanzas una cosa, que sea dormir, comer, respirar o hablar con alguien. Y si los síntomas no ceden, pide hora en tu CESFAM o llama al 600 360 7777.'
  },
  dondeIr: [
    { nombre: 'DIDECO — Área Social', dato: 'O’Higgins 500 · 41-2261432', nota: 'FIBE, ayudas sociales. Tu primera puerta.' },
    { nombre: 'OIRS / Oficina de Partes', dato: 'oirs@penco.cl · 41-2261430', nota: 'Solicitudes con número de folio.' },
    { nombre: 'Delegación Municipal Lirquén', dato: '41-2261550', nota: 'Trámites sin viajar al centro.' },
    { nombre: 'Seguridad Penco', dato: '*4157', nota: 'Patrullaje y derivación en emergencia.' },
    { nombre: 'EGIS Municipal', dato: '41-2261536', nota: 'Vivienda y reconstrucción.' },
    { nombre: 'OMIL', dato: '41-2261347', nota: 'Empleo y programas de emergencia.' },
    { nombre: 'CESFAM Penco / Lirquén', dato: '41-2723960 / 41-2688321', nota: 'Salud física y mental.' },
    { nombre: 'ChileAtiende', dato: '101 · chileatiende.cl', nota: 'Bonos y beneficios del Estado.' },
    { nombre: 'SENAPRED', dato: 'senapred.cl', nota: 'Alertas oficiales por amenaza.' }
  ],
  mochila: {
    intro: 'La mochila de 72 horas se prepara ANTES. Una por familia, junto a la puerta.',
    items: ['Agua (2 L por persona) + alimento no perecible', 'Documentos en bolsa hermética (o fotos en el celular)', 'Remedios de uso diario + receta', 'Linterna + radio a pilas + pilas', 'Abrigo, muda y zapatos cerrados', 'Cargador y batería externa', 'Útiles de aseo + pañales si hay bebés', 'Correa y alimento de mascotas', 'Dinero en efectivo (poco)', 'Copia de llaves y números en papel'],
    tip: 'Revísala cada cambio de estación con toda la familia (lleva la fecha al calendario con 📌).'
  },
  fuentes: 'DIDECO Penco · penco.cl · SENAPRED · ChileAtiende · CESFAM Penco/Lirquén. Verifica vigencia en DIDECO y OIRS.',
  actualizado: '2026-09'
};

function dynApoyo() {
  try {
    var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.apoyo;
    if (d && d.primerasHoras) return d;
  } catch (e) {}
  return APOYO;
}

/* ---------- estado personal ---------- */
var tabApoyo = 'horas';
var apoyoQuery = '';
function storeApoyo() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { hechos: {}, notas: {}, mios: [], avisos: [] };
    if (!u.apoyoPenco) u.apoyoPenco = { hechos: {}, notas: {}, mios: [], avisos: [] };
    var r = u.apoyoPenco;
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
  var texto = clean('[Apoyo] ' + nombre + (detalle ? ' · ' + detalle : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      var linea = '[Apoyo Emergencia] ' + texto + ' ' + hhmm;
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + linea : linea;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) {
      try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {}
    }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  try {
    var st = storeApoyo();
    st.avisos.push({ id: uid('aav'), nombre: nombre, detalle: detalle || '', fecha: fecha, hora: hhmm, notify: !!conAviso, creado: todayKey() });
  } catch (e) {}
  save('📌 Agregado al calendario ✓');
  refrescarCal();
  try { render(); } catch (e2) {}
}

/* ---------- esqueleto (diálogo propio apoyoDialog) ---------- */
function asegurarPanel() {
  var panel = $('apoyoPanel');
  if (!panel) return null;
  if (!panel.dataset.apoyoOk) {
    panel.dataset.apoyoOk = '1';
    panel.innerHTML =
      '<p class="muted" style="font-size:11px;line-height:1.55">Si el fuego o la emergencia te golpeó —o golpeó a tu familia— aquí está el camino: <b>primeras horas, catastro, contención y reconstrucción</b>. Marca tu avance con <b>☑️</b> y agenda plazos con <b>📌</b>. Todo queda <b>privado y local</b>.</p>' +
      '<div class="timer-tabs" style="margin:8px 0 10px;flex-wrap:wrap">' +
      '<button type="button" id="tabApoyoHoras" class="btn btn-accent" style="width:auto">🆘 Primeras horas</button>' +
      '<button type="button" id="tabApoyoCat" class="btn" style="width:auto">🏠 Catastro y beneficios</button>' +
      '<button type="button" id="tabApoyoCont" class="btn" style="width:auto">🧠 Contención</button>' +
      '<button type="button" id="tabApoyoDonde" class="btn" style="width:auto">🤝 Dónde ir</button>' +
      '<button type="button" id="tabApoyoMoch" class="btn" style="width:auto">🎒 Mochila</button>' +
      '<button type="button" id="tabApoyoMios" class="btn" style="width:auto">⭐ Mi plan</button>' +
      '</div>' +
      '<div class="menstrual-card" style="margin-top:0"><h4>🔍 Buscar en Apoyo</h4>' +
      '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="apoyoSearch" placeholder="ej: FIBE, albergue, DIDECO, mochila, duelo..." maxlength="60" autocomplete="off"></label></div></div>' +
      '<div id="apoyoBody" style="margin-top:10px"></div>';
    var map = { tabApoyoHoras: 'horas', tabApoyoCat: 'cat', tabApoyoCont: 'cont', tabApoyoDonde: 'donde', tabApoyoMoch: 'moch', tabApoyoMios: 'mios' };
    Object.keys(map).forEach(function (id) {
      var b = $(id);
      if (b) b.onclick = function () { tabApoyo = map[id]; render(); };
    });
    var q = $('apoyoSearch');
    if (q) q.addEventListener('input', function () { apoyoQuery = q.value; renderBody(); });
  }
  return panel;
}

function matchQ() {
  var q = (apoyoQuery || '').toLowerCase().trim();
  if (!q) return null;
  return q;
}

/* ---------- renders por pestaña ---------- */
function pasoCard(p, conCalendario) {
  var st = storeApoyo();
  var hecho = !!st.hechos[p.id];
  var nota = st.notas[p.id] || '';
  var html = '<div class="si-card" style="padding:10px 12px;border-color:#d4af3766' + (hecho ? ';opacity:.85' : '') + '">' +
    '<h4 style="font-size:13px">' + (hecho ? '✅ ' : esc(p.icon || '📌') + ' ') + esc(p.nombre) + '</h4>' +
    '<p style="font-size:12px;line-height:1.55">' + esc(p.detalle || p.donde || '') + '</p>' +
    (p.donde && p.detalle ? '<p class="muted" style="font-size:11px">📍 ' + esc(p.donde) + '</p>' : '') +
    ((p.requisitos && p.requisitos.length) ? '<ul style="font-size:11px;margin:2px 0 6px 18px;line-height:1.5">' +
      p.requisitos.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '') +
    (p.cuando ? '<p class="muted" style="font-size:11px">🗓️ ' + esc(p.cuando) + (p.costo ? ' · 💰 ' + esc(p.costo) : '') + '</p>' : '') +
    (p.tip ? '<p class="muted" style="font-size:11px">💡 ' + esc(p.tip) + '</p>' : '') +
    '<label style="font-size:11px">📝 Mi nota <input type="text" data-apoyo-nota="' + esc(p.id) + '" placeholder="ej: folio, fecha, con quién hablé..." maxlength="80" value="' + esc(nota) + '"></label>';
  if (conCalendario) {
    html += '<div class="conv-row" style="align-items:flex-end;margin-top:6px">' +
      '<label>Fecha <input type="date" data-apoyo-fecha="' + esc(p.id) + '" value="' + esc(todayKey()) + '"></label>' +
      '<label>Hora <input type="time" data-apoyo-hora="' + esc(p.id) + '" value="10:00" style="max-width:110px"></label>' +
      '<label class="check-row" style="margin:0;white-space:nowrap"><input type="checkbox" data-apoyo-aviso="' + esc(p.id) + '"> 🔔</label>' +
      '<button type="button" class="btn btn-accent" data-apoyo-add="' + esc(p.id) + '" style="width:auto">📌 Calendario</button></div>';
  }
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn" data-apoyo-hecho="' + esc(p.id) + '" style="width:auto;font-size:11px">' + (hecho ? '↩️ Reabrir' : '☑️ Marcar hecho') + '</button>' +
    '<button type="button" class="btn" data-apoyo-share="' + esc(p.id) + '" style="width:auto;font-size:11px">📤 Compartir</button></div></div>';
  return html;
}

function porPaso(id) {
  var d = dynApoyo();
  var all = (d.primerasHoras || []).concat((d.catastro && d.catastro.pasos) || []).concat(storeApoyo().mios || []);
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

function renderHoras(d) {
  var q = matchQ();
  var list = (d.primerasHoras || []).slice();
  if (q) list = list.filter(function (p) { return ((p.nombre || '') + ' ' + (p.detalle || '')).toLowerCase().indexOf(q) >= 0; });
  var he = Object.keys(storeApoyo().hechos).length;
  var html = '<div class="menstrual-card" style="border-color:#ff6b6b"><h4 style="color:#ff6b6b">🆘 Primeras 24–72 horas · marca cada paso con ☑️</h4>' +
    '<p class="muted" style="font-size:11px">' + esc(d.intro.texto) + '</p></div>';
  return html + (list.length ? list.map(function (p) { return pasoCard(p, false); }).join('') : '<p class="muted">Sin resultados.</p>');
}

function renderCatastro(d) {
  var q = matchQ();
  var list = ((d.catastro && d.catastro.pasos) || []).concat(storeApoyo().mios);
  if (q) list = list.filter(function (p) {
    return ((p.nombre || '') + ' ' + (p.donde || '') + ' ' + ((p.requisitos || []).join(' '))).toLowerCase().indexOf(q) >= 0;
  });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🏠 Catastro y beneficios · ' + list.length + '</h4>' +
    '<p class="muted" style="font-size:11px">' + esc(d.catastro.intro) + ' Agenda plazos con <b>📌</b> y verifica vigencia en DIDECO.</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>➕ Agregar mi trámite</h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre * <input type="text" id="apoyoMioNombre" placeholder="ej: Postular subsidio techo" maxlength="60"></label>' +
    '<label>Dónde <input type="text" id="apoyoMioDonde" placeholder="ej: EGIS" maxlength="50"></label></div>' +
    '<label>Detalle <input type="text" id="apoyoMioReq" placeholder="folio, plazo, requisitos..." maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="apoyoMioAdd" class="btn btn-accent" style="width:auto">+ Guardar trámite</button></div></div>';
  return html + (list.length ? list.map(function (p) { return pasoCard(p, true); }).join('') : '<p class="muted">Sin resultados.</p>');
}

function renderContencion(d) {
  var q = matchQ();
  var c = d.contencion || {};
  var list = (c.recursos || []).slice();
  var calma = (c.calma || []).slice();
  var grupos = (c.grupos || []).slice();
  if (q) {
    list = list.filter(function (x) { return ((x.nombre || '') + ' ' + (x.dato || '') + ' ' + (x.nota || '')).toLowerCase().indexOf(q) >= 0; });
    calma = calma.filter(function (x) { return ((x.nombre || '') + ' ' + (x.detalle || '')).toLowerCase().indexOf(q) >= 0; });
    grupos = grupos.filter(function (x) { return ((x.nombre || '') + ' ' + (x.dato || '') + ' ' + (x.nota || '')).toLowerCase().indexOf(q) >= 0; });
  }
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧠 Contención · no estás solo/a</h4>' +
    '<p class="muted" style="font-size:11px">' + esc(c.intro || '') + '</p></div>';
  if (!q || (c.reacciones || []).join(' ').toLowerCase().indexOf(q || '') >= 0 || !q) {
    if ((c.reacciones || []).length && !q) {
      html += '<div class="menstrual-card"><h4>💛 Reacciones normales ante algo anormal</h4>' +
        '<p class="muted" style="font-size:11px">Si sientes esto, no significa que estés mal: es tu cuerpo y tu mente procesando. Pasa con el tiempo y el apoyo.</p>' +
        '<ul style="font-size:11px;margin:2px 0 6px 18px;line-height:1.55">' +
        c.reacciones.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>';
    }
  }
  if (calma.length) {
    html += '<div class="menstrual-card"><h4>🌿 Para calmarte ahora mismo</h4>' +
      calma.map(function (x) {
        return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">🌿 ' + esc(x.nombre) + '</h4>' +
          '<p class="muted" style="font-size:11px">' + esc(x.detalle || x.dato || '') + '</p></div>';
      }).join('') + '</div>';
  }
  if (!q && ((c.queHacer || []).length || (c.queEvitar || []).length)) {
    html += '<div class="menstrual-card"><h4>🤲 Cómo acompañar a otro/a</h4>' +
      ((c.queHacer || []).length ? '<p class="muted" style="font-size:11px"><b>✅ Haz:</b></p><ul style="font-size:11px;margin:2px 0 6px 18px;line-height:1.55">' +
        c.queHacer.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '') +
      ((c.queEvitar || []).length ? '<p class="muted" style="font-size:11px"><b>🚫 Evita:</b></p><ul style="font-size:11px;margin:2px 0 6px 18px;line-height:1.55">' +
        c.queEvitar.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
  }
  if (grupos.length) {
    html += '<div class="menstrual-card"><h4>👨‍👩‍👧 Según a quién cuidas</h4>' +
      grupos.map(function (x) {
        return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">💚 ' + esc(x.nombre) + '</h4>' +
          '<p style="font-size:11px"><b>' + esc(x.dato) + '</b></p>' +
          '<p class="muted" style="font-size:11px">' + esc(x.nota) + '</p></div>';
      }).join('') + '</div>';
  }
  if (!q && (c.senales || []).length) {
    html += '<div class="menstrual-card" style="border-color:#e76e8a"><h4 style="color:#e76e8a">🚨 Pide ayuda profesional si…</h4>' +
      '<ul style="font-size:11px;margin:2px 0 6px 18px;line-height:1.55">' +
      c.senales.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>';
  }
  html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📞 Dónde pedir ayuda</h4>' +
    (list.length ? list.map(function (x) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span><b style="font-size:12px">💚 ' + esc(x.nombre) + '</b><br><span style="font-size:11px"><b>' + esc(x.dato) + '</b></span><br><span class="muted" style="font-size:11px">' + esc(x.nota || '') + '</span></span>' +
        '<button type="button" class="btn" data-apoyo-tel="' + esc(x.dato) + '" style="width:auto" title="Copiar">📋</button></div>';
    }).join('') : '<p class="muted">Sin resultados.</p>') + '</div>';
  if (!q && c.cierre) {
    html += '<div class="menstrual-card"><p class="muted" style="font-size:11px">💡 ' + esc(c.cierre) + '</p></div>';
  }
  return html;
}

function renderDonde(d) {
  var q = matchQ();
  var list = (d.dondeIr || []).slice();
  if (q) list = list.filter(function (x) { return ((x.nombre || '') + ' ' + (x.dato || '')).toLowerCase().indexOf(q) >= 0; });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🤝 Dónde ir · directorio de ayuda</h4>' +
    list.map(function (x) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(x.nombre) + '</b><br><span class="muted" style="font-size:11px">📞 <b>' + esc(x.dato) + '</b><br>' + esc(x.nota || '') + '</span></span>' +
        '<button type="button" class="btn" data-apoyo-tel="' + esc(x.dato) + '" style="width:auto" title="Copiar">📋</button></div>';
    }).join('') + '</div>';
  return html;
}

function renderMochila(d) {
  var m = d.mochila;
  var st = storeApoyo();
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🎒 Mochila de 72 horas</h4>' +
    '<p class="muted" style="font-size:11px">' + esc(m.intro) + '</p>' +
    m.items.map(function (it, i) {
      var id = 'moch-' + i;
      var ok = !!st.hechos[id];
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>' + (ok ? '✅ ' : '⬜ ') + esc(it) + '</span>' +
        '<button type="button" class="btn" data-apoyo-hecho="' + id + '" style="width:auto;font-size:11px">' + (ok ? '↩️' : '☑️') + '</button></div>';
    }).join('') +
    '<p class="muted" style="font-size:11px;margin-top:6px">💡 ' + esc(m.tip) + '</p></div>';
  return html;
}

function renderMios(d) {
  var st = storeApoyo();
  var all = (d.primerasHoras || []).concat((d.catastro && d.catastro.pasos) || []);
  var hechos = all.filter(function (p) { return st.hechos[p.id]; });
  var avisos = st.avisos.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>⭐ Mi plan · ' + hechos.length + ' hechos · ' + avisos.length + ' en calendario · ' + st.mios.length + ' propios</h4>' +
    '<p class="muted" style="font-size:11px">Tus plazos ya están como compromisos 🕐 en tu calendario. Aquí los ves todos juntos.</p>';
  if (hechos.length) {
    html += hechos.map(function (p) {
      return '<div class="chip" style="display:block;margin-top:4px">✅ <b>' + esc(p.nombre) + '</b>' + (st.notas[p.id] ? ' · ' + esc(st.notas[p.id]) : '') + '</div>';
    }).join('');
  } else {
    html += '<p class="muted" style="font-size:11px">Aún no marcas pasos. Ve a 🆘 Primeras horas y pulsa ☑️.</p>';
  }
  if (avisos.length) {
    html += '<div style="margin-top:8px">' + avisos.map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(r.nombre) + '</b><br><span class="muted" style="font-size:11px">📅 ' + esc(r.fecha) + ' · 🕐 ' + esc(r.hora) + (r.notify ? ' · 🔔' : '') + (r.detalle ? ' · ' + esc(r.detalle) : '') + '</span></span>' +
        '<button type="button" class="btn" data-apoyo-avdel="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div>';
    }).join('') + '</div>';
  }
  if (st.mios.length) {
    html += '<p class="muted" style="font-size:11px;margin-top:8px">📌 Mis trámites propios:</p>' + st.mios.map(function (t) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>📌 ' + esc(t.nombre) + '</b>' + (st.hechos[t.id] ? ' ✅' : '') + '<br><span class="muted" style="font-size:11px">' + esc(t.donde || '') + '</span></span>' +
        '<span style="display:flex;gap:6px"><button type="button" class="btn" data-apoyo-hecho="' + esc(t.id) + '" style="width:auto;font-size:11px">☑️</button>' +
        '<button type="button" class="btn" data-apoyo-miodel="' + esc(t.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
    }).join('');
  }
  html += '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><button type="button" id="apoyoShareAll" class="btn" style="width:auto">📤 Compartir mi plan</button>' +
    '<button type="button" id="apoyoClearAll" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar plan</button></div></div>';
  return html;
}

/* ---------- body + binds ---------- */
function renderBody() {
  var body = $('apoyoBody');
  if (!body) return;
  var d = dynApoyo();
  var html = '';
  if (tabApoyo === 'horas') html = renderHoras(d);
  else if (tabApoyo === 'cat') html = renderCatastro(d);
  else if (tabApoyo === 'cont') html = renderContencion(d);
  else if (tabApoyo === 'donde') html = renderDonde(d);
  else if (tabApoyo === 'moch') html = renderMochila(d);
  else html = renderMios(d);
  body.innerHTML = html;
  bindBody(body, d);
}

function bindBody(scope, d) {
  if (!scope) return;
  scope.querySelectorAll('[data-apoyo-tel]').forEach(function (b) {
    b.onclick = function () {
      var n = b.getAttribute('data-apoyo-tel');
      try { if (navigator.clipboard) navigator.clipboard.writeText(n).then(function () { save('Copiado ✓'); }); } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-apoyo-nota]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var st = storeApoyo();
      st.notas[inp.getAttribute('data-apoyo-nota')] = clean(inp.value, 80);
      save('Nota guardada ✓');
    });
  });
  scope.querySelectorAll('[data-apoyo-add]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-apoyo-add');
      var t = porPaso(id);
      if (!t) return;
      var f = (scope.querySelector('[data-apoyo-fecha="' + id + '"]') || {}).value || todayKey();
      var h = (scope.querySelector('[data-apoyo-hora="' + id + '"]') || {}).value || '10:00';
      var av = !!(scope.querySelector('[data-apoyo-aviso="' + id + '"]') || {}).checked;
      llevarAlCalendario(t.nombre, t.donde, f, h, av);
    };
  });
  scope.querySelectorAll('[data-apoyo-hecho]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-apoyo-hecho');
      var st = storeApoyo();
      if (st.hechos[id]) delete st.hechos[id]; else st.hechos[id] = todayKey();
      save(st.hechos[id] ? 'Paso hecho ✅' : 'Reabierto');
      render();
    };
  });
  scope.querySelectorAll('[data-apoyo-share]').forEach(function (b) {
    b.onclick = function () {
      var t = porPaso(b.getAttribute('data-apoyo-share'));
      if (!t) return;
      var txt = '🆘 ' + t.nombre + '\n' + (t.detalle || t.donde || '') + (t.requisitos ? '\n• ' + t.requisitos.join('\n• ') : '');
      try {
        if (navigator.share) { navigator.share({ title: t.nombre + ' — Apoyo Penco', text: txt }).catch(function () {}); return; }
        if (navigator.clipboard) navigator.clipboard.writeText(t.nombre + ' — Apoyo Penco\n' + txt).then(function () { save('Compartido ✓'); });
      } catch (e) {}
    };
  });
  scope.querySelectorAll('[data-apoyo-avdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Quitar de Mi plan? (El compromiso del día se conserva)')) return;
      var st = storeApoyo();
      st.avisos = st.avisos.filter(function (x) { return x.id !== b.getAttribute('data-apoyo-avdel'); });
      save('Quitado'); render();
    };
  });
  scope.querySelectorAll('[data-apoyo-miodel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este trámite propio?')) return;
      var st = storeApoyo();
      st.mios = st.mios.filter(function (x) { return x.id !== b.getAttribute('data-apoyo-miodel'); });
      save('Borrado'); render();
    };
  });
  var sh = $('apoyoShareAll');
  if (sh) sh.onclick = function () {
    var st = storeApoyo();
    var txt = '🆘 Mi plan de apoyo (Penco)\n✅ Hechos: ' + Object.keys(st.hechos).length + '\n' +
      st.avisos.map(function (r) { return '• ' + r.fecha + ' ' + r.hora + ' — ' + r.nombre; }).join('\n');
    try {
      if (navigator.share) { navigator.share({ title: 'Mi plan de apoyo', text: txt }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { save('Compartido ✓'); });
    } catch (e) {}
  };
  var cl = $('apoyoClearAll');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar hechos, avisos y propios? (Los compromisos del calendario se conservan)')) return;
    var st = storeApoyo();
    st.hechos = {}; st.avisos = []; st.mios = []; st.notas = {};
    save('Plan borrado'); render();
  };
  var add = $('apoyoMioAdd');
  if (add) add.onclick = function () {
    var nombre = clean(($('apoyoMioNombre') || {}).value, 60).trim();
    if (!nombre) { alert('Ponle nombre a tu trámite'); return; }
    var rec = {
      id: uid('apo'), icon: '📌', nombre: nombre,
      detalle: clean(($('apoyoMioReq') || {}).value, 120) || '',
      donde: clean(($('apoyoMioDonde') || {}).value, 50) || 'DIDECO',
      cuando: 'Mi plazo', costo: 'Consultar',
      requisitos: [], tip: ''
    };
    storeApoyo().mios.push(rec);
    save('Trámite guardado 📌');
    render();
  };
}

function render() {
  var panel = asegurarPanel();
  if (!panel) return;
  var tabs = { horas: $('tabApoyoHoras'), cat: $('tabApoyoCat'), cont: $('tabApoyoCont'), donde: $('tabApoyoDonde'), moch: $('tabApoyoMoch'), mios: $('tabApoyoMios') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', tabApoyo === k); });
  var q2 = $('apoyoSearch');
  if (q2 && q2.value !== apoyoQuery && document.activeElement !== q2) q2.value = apoyoQuery;
  renderBody();
}

function openApoyo() {
  try { render(); } catch (e) {}
  try {
    var dlg = $('apoyoDialog');
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
    else if (dlg) dlg.setAttribute('open', '');
  } catch (e2) {}
}

function setup() {
  if (!$('apoyoPanel') && !$('apoyoDialog')) {
    window._apoyoRetry = (window._apoyoRetry || 0) + 1;
    if (window._apoyoRetry < 60) setTimeout(setup, 500);
    return;
  }
  try {
    var b = $('btnApoyo');
    if (b && !b.dataset.apoyoW) { b.dataset.apoyoW = '1'; b.addEventListener('click', openApoyo); }
  } catch (e) {}
  try {
    var c1 = $('apoyoCloseTop'), c2 = $('apoyoClose');
    if (c1 && !c1.dataset.w) { c1.dataset.w = '1'; c1.onclick = function () { try { $('apoyoDialog').close(); } catch (e) {} }; }
    if (c2 && !c2.dataset.w) { c2.dataset.w = '1'; c2.onclick = function () { try { $('apoyoDialog').close(); } catch (e) {} }; }
  } catch (e3) {}
}

window.ApoyoPenco = { render: render, open: openApoyo, tab: function (t) { tabApoyo = t || tabApoyo; render(); }, datos: function () { return dynApoyo(); }, llevarAlCalendario: llevarAlCalendario };
try {
  Object.defineProperty(window.ApoyoPenco, 'data', { get: dynApoyo });
} catch (e) { window.ApoyoPenco.data = APOYO; }
try { document.addEventListener('territorio:listo', function () { try { render(); } catch (e) {} }); } catch (e2) {}
setTimeout(setup, 600);
setTimeout(setup, 1800);

})();
