/* ============================================================
   ADOLESCENCIA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa e independiente (10 a 19 años):
   - Botón btnAdolescencia (grupo Mente & Estudio, inyectado)
   - Diálogo adolescenciaDialog con 6 pestañas:
     1) Guía (qué es, etapas, cerebro, mitos, cuándo pedir ayuda)
     2) Cuerpo & Cambios (pubertad, higiene, sueño, energía, ciclo)
     3) Mente & Emociones (autoestima, ansiedad, redes, bullying)
     4) Estudio & Futuro (técnicas, test vocacional Holland breve)
     5) Vida social & Seguridad (consentimiento, pololeo, alcohol/
        drogas, redes y grooming, recursos Chile)
     6) Mi espacio (chequeo diario, metas por luna, diario privado)
   - Todo local y privado por usuario: userData().adolescencia
     { checks:{}, tests:[], metas:[] }
   - Educativo: NO reemplaza familia, liceo ni terapia.
     Lenguaje claro, sin morbo, con enfoque en respeto y cuidado.
   - Sin dependencias externas. 100% offline.
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
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { checks: {}, tests: [], metas: [] };
    if (!u.adolescencia) u.adolescencia = { checks: {}, tests: [], metas: [] };
    var e = u.adolescencia;
    if (!e.checks) e.checks = {};
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.metas)) e.metas = [];
    return e;
  } catch (e2) { return { checks: {}, tests: [], metas: [] }; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
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

/* ---------------- DATOS ---------------- */
var EMOS = ['alegría', 'tranquilidad', 'motivación', 'orgullo', 'cariño', 'tristeza', 'rabia', 'miedo', 'ansiedad', 'vergüenza', 'soledad', 'estrés'];

var ETAPAS = [
  { n: '10–13 · Exploradora/or', ico: '🌱', q: 'Empiezan los cambios: estirón, piel y olor distinto, emociones intensas de un rato a otro. Preguntas grandes: ¿quién soy? ¿encajo?',
    cuerpo: 'Crecimiento rápido, acné leve, inicio de vello y desarrollo mamario/testicular. Todo a ritmos distintos: normal.',
    mente: 'Vergüenza y comparación. Necesita: privacidad, humor sin burla y adultos que escuchen sin minimizar.',
    tip: '🌙 1 hábito base por luna: dormir a la misma hora + ducha diaria + 30 min de movimiento.' },
  { n: '14–16 · Buscadora/or', ico: '🌊', q: 'El grupo pesa fuerte: amistades, primer pololeo, redes, notas y decisiones (científico/humanista, TP). Cerebro emocional a full, freno aún en construcción.',
    cuerpo: 'Cambios casi completos, ciclo menstrual que se regulariza, sueños húmedos, voz y cuerpo definidos.',
    mente: 'Identidad: música, ropa, ideas propias. Choques con familia = ensayo de autonomía, no guerra.',
    tip: '🌙 1 meta de estudio + 1 meta social por luna. Revisa qué sumó y qué soltó.' },
  { n: '17–19 · Creadora/or', ico: '🌕', q: 'Futuro concreto: PAES, trabajo, salir de Penco o quedarse aportando. Pololeos más serios, decisiones con consecuencias reales.',
    cuerpo: 'Cuerpo adulto joven: cuidar sueño, alimentación y salud sexual con información real.',
    mente: 'Proyecto de vida: ¿qué me gusta, en qué soy bueno/a, qué necesita mi territorio?',
    tip: '🌙 Plan de luna: 1 paso vocacional + 1 ahorro + 1 cuidado (salud/mente).' }
];

var CUERPO = [
  { n: 'Pubertad sin susto', ico: '🌱', txt: 'Entre los 9 y 16 años el cuerpo cambia: estirón, acné, vello, olor más fuerte, desarrollo de pechos/testículos, primera menstruación (10–15) o primeras eyaculaciones. Cada cuerpo tiene su calendario: compararte con otros solo genera ansiedad. Si a los 15–16 no hay ningún cambio, conversa con tu CESFAM: casi siempre es solo ritmo propio.' },
  { n: 'Higiene que salva el día', ico: '🚿', txt: 'Ducha diaria (sobre todo después de deporte), desodorante, muda de ropa interior de algodón, lavado de cara mañana/noche con agua + jabón suave (no pasta dental ni limón en granos: queman). Toalla higiénica o tampón se cambia cada 4–6 h; copa según indicación. Lava tus manos antes y después.' },
  { n: 'Sueño: tu superpoder', ico: '😴', txt: 'Necesitas 8–10 h. Con menos de 7 h rindes como si hubieras tomado: memoria, ánimo y defensas caen. Ritual: misma hora ±30 min, sin pantalla 45 min antes, pieza oscura y fresca. Si no duermes en 20 min, lee tenue y vuelve. Luz de mañana + no cafeína después de las 14:00.' },
  { n: 'Comida y energía', ico: '🥗', txt: 'Estás creciendo: no son tiempo de dietas estrictas. Plato base: mitad verduras, cuarto proteína (huevo, legumbres, pescado, pollo), cuarto cereal (arroz, papa, avena) + agua. Desayuna algo antes del liceo. Si tu relación con la comida te angustia (atracones, vómitos, dejar de comer), pide ayuda pronto: CESFAM / Salud Responde 600 360 7777.' },
  { n: 'Movimiento 30 min', ico: '⚽', txt: 'Caminar a Lirquén, bici, skate, baile, calistenia en la plaza: todo suma. 30 min al día bajan ansiedad y mejoran notas. Elongar 5 min evita lesiones. Si haces gym, técnica antes que peso y descanso entre días duros.' },
  { n: 'Ciclo menstrual (si menstruas)', ico: '🌸', txt: 'Dura 21–35 días; los primeros 2 años puede ser irregular. Anota inicio en 🌸 Ciclo del calendario. Dolor fuerte que te bota 2+ días, sangrado que empapa en 1 h por varias horas, o ausencia de 3+ meses (sin embarazo): consulta. Calor local, movimiento suave e infusión tibia ayudan; automedicarse todos los meses, no.' },
  { n: 'Salud sexual clara', ico: '💛', txt: 'Nadie debe presionarte a nada sexual: ni pareja, ni grupo, ni por chat. Consentimiento = sí libre, informado, entusiasta y reversible (puedes parar cuando quieras). Preservativo (externo/interno) + método de largo plazo indicado en salud son la dupla que previene embarazo e ITS. El porno NO es educación: muestra ficción sin cuidado ni consentimiento. Dudas: matrona CESFAM (confidencial desde los 14 en Chile para consejería).' }
];

var MENTE_CARDS = [
  { n: 'Autoestima: tu voz interna', ico: '🪞', txt: 'Trátate como a tu mejor amigo/a. Cambia "soy tonto/a" por "me equivoqué en esto y puedo practicar". Guarda 1 logro diario (aunque sea "pregunté en clases"). Unfollowa cuentas que te hacen sentir mal todos los días.' },
  { n: 'Ansiedad y estrés (plan 3-3-3)', ico: '🌬️', txt: 'Cuando se acelera todo: nombra 3 cosas que ves, 3 sonidos que oyes, mueve 3 partes del cuerpo + respiración 4-6 (inhala 4, exhala 6) por 2 min. Luego parte la tarea en el paso más chico posible ("abrir el cuaderno"). Si la angustia dura semanas o te impide ir al liceo/dormir, pide ayuda.' },
  { n: 'Redes sin que te coman', ico: '📱', txt: 'Regla 50-10: 50 min de pantalla → 10 de pausa con ojos lejos y cuerpo en movimiento. Nada de celular en la mesa ni en la cama (alarma aparte). Antes de publicar: ¿me daría vergüenza en 1 año? ¿Expongo a otra persona? Configura privacidad y ubicación solo con familia.' },
  { n: 'Bullying y ciberbullying', ico: '🛡️', txt: 'Bullying = agresión repetida con desequilibrio de poder (golpes, insultos, exclusión, funas, fotos sin permiso). NO es tu culpa. Guarda evidencia (pantallazos con fecha), bloquea, no respondas de noche, cuenta a 1 adulto (familia, profe jefe, orientador) y al liceo por escrito. En Chile la ley exige protocolo escolar: pide que se active. Si hay amenazas o golpes: 149 (Familia) / 133 (Carabineros).' },
  { n: 'Tristeza que avisa', ico: '🌧️', txt: 'Todas las emociones pasan, pero si por 2+ semanas estás casi todos los días desanimado/a, sin ganas, durmiendo/comiendo muy distinto o pensando que estarías mejor muerto/a → pide ayuda HOY: *4141 (prevención del suicidio, 24h, gratis) o habla con tu persona segura + CESFAM. Pedir ayuda es fortaleza, no debilidad.' }
];

var ESTUDIO = [
  { n: 'Pomodoro liceano 25-5', ico: '🍅', txt: '25 min foco total (celular en otra pieza) + 5 pausa de pie + cada 4 ciclos, 20 min libre. 2–3 pomodoros al día valen más que 5 h mirando el cuaderno con el celu al lado.' },
  { n: 'Feynman: explícalo simple', ico: '🗣️', txt: 'Elige 1 materia, explícala en voz alta como a un niño de 10 años. Donde te trabas, ahí está el vacío: vuelve al apunte y re-explica. Ideal para matemática, biología e historia.' },
  { n: 'Recuperación activa', ico: '🧠', txt: 'Cierra el cuaderno y escribe todo lo que recuerdes en hoja en blanco. Luego compara. Repetir esto 3 días seguidos fija más que releer 10 veces. Flashcards para vocabulario inglés/mapuzugun y fórmulas.' },
  { n: 'Lugar y hora ancla', ico: '📌', txt: 'Siempre el mismo rincón ordenado + misma hora. Luz buena, agua a mano, lista de 3 tareas máximo. Si cuesta partir: regla de los 2 minutos ("solo abro el cuaderno").' },
  { n: 'Pruebas y PAES sin pánico', ico: '📝', txt: 'A 7 días: plan por temas (fácil→difícil), 1 ensayo con tiempo real, dormir 8 h la noche previa (trasnochar baja 20–30%). El día: desayuno real, llega 30 min antes, respira 4-6 antes de abrir la prueba.' },
  { n: 'Vocación: 3 preguntas', ico: '🧭', txt: '1) ¿Qué hago sin que me obliguen? 2) ¿En qué me piden ayuda? 3) ¿Qué problema de Penco me gustaría resolver? Cruza las 3 y prueba con el test Holland de la pestaña: te ordena en 6 áreas para conversar con tu orientador.' }
];

var HOLLAND = [
  { area: 'R · Realista (manos y máquinas)', ej: 'Arreglar bicis, bote, redes, construir, taller, mecánica, pesca, cocina práctica.' },
  { area: 'I · Investigador (ideas y datos)', ej: 'Ciencias, salud, laboratorio, programación, mar y bosque, por qué de las cosas.' },
  { area: 'A · Artístico (crear)', ej: 'Música, dibujo, audiovisual, danza, diseño, letras, guitarra del calendario.' },
  { area: 'S · Social (personas)', ej: 'Enseñar, salud, párvulos, trabajo social, deporte formativo, turismo.' },
  { area: 'E · Emprendedor (liderar)', ej: 'Negocio propio, feria, trueque, organizar eventos, dirigir equipos.' },
  { area: 'C · Convencional (orden)', ej: 'Administración, contabilidad, logística, datos, gestión.' }
];
var HOLLAND_ITEMS = [
  ['Arreglar algo descompuesto', 'R'],
  ['Cuidar o enseñar a alguien', 'S'],
  ['Dibujar, tocar música o crear videos', 'A'],
  ['Investigar por qué pasa algo', 'I'],
  ['Organizar un evento o vender en feria', 'E'],
  ['Ordenar planillas, plata o datos', 'C'],
  ['Trabajar al aire libre con las manos', 'R'],
  ['Resolver un puzzle o programar algo', 'I'],
  ['Escribir, actuar o diseñar', 'A'],
  ['Escuchar y ayudar en un problema', 'S'],
  ['Convencer y liderar un grupo', 'E'],
  ['Planificar horarios y presupuestos', 'C']
];

var SOCIAL = [
  { n: 'Amistad sana vs tóxica', ico: '🤝', txt: 'Sana: te alegra tus logros, respeta tu no, pide perdón. Tóxica: se burla siempre de lo mismo, te presiona ("si no lo haces no eres amigo"), te aísla de otros, filtra tus secretos. Puedes cambiar de grupo: duele 2 semanas, libera 2 años. Calidad > cantidad.' },
  { n: 'Consentimiento (todo vínculo)', ico: '💛', txt: 'Solo SÍ es sí: libre (sin presión ni alcohol que anule), informado, entusiasta y reversible. El silencio, la ropa o el "ya habíamos…" NO son sí. Tú también debes pedirlo y aceptar un no sin insistir ni castigar con ley del hielo. Chat: pedir/enviar fotos íntimas a menores es delito; si te presionan, guarda evidencia y cuenta.' },
  { n: 'Pololeo sin violencia', ico: '🚦', txt: 'Alerta si: revisa tu celu, te prohíbe amistades/ropa, te apura sexualmente, te grita y luego dice "es porque te amo", te amenaza con terminar/dañarse si no obedeces. Eso es violencia, no amor. Ayuda: 1455 (violencia), 149 (familia), orientador/a, CESFAM. Si ves a una amiga/o así, no la juzgues: acompaña y deriva.' },
  { n: 'Alcohol, tabaco, marihuana y otras', ico: '🚭', txt: 'Tu cerebro madura hasta los ~25: alcohol y drogas pegan más fuerte y más tiempo a tu edad (memoria, ánimo, decisiones). "Todos lo hacen" es mito: la mayoría prueba poco o nada. Si tomas: nunca manejes ni subas a auto con conductor que tomó, no mezcles, come y toma agua, ten plan de salida. Si no puedes parar, SENDA 1412 + CESFAM. Vender/regalar a menores es delito.' },
  { n: 'Grooming y estafas en línea', ico: '⚠️', txt: 'Adulto que te da regalos/recargas, pide secreto, te pide fotos o quiere juntarse a solas = grooming (delito). Corta, guarda todo, cuenta a adulto y denuncia (PDI/BICRIM o 134). Nunca vayas solo/a a juntas con desconocidos de internet. Apuestas y "ganar plata fácil" a tu edad = estafa casi segura.' },
  { n: 'Dinero joven', ico: '💰', txt: 'Regla 50-30-20 de tu mesada/pololo trabajo: 50% necesario (pasajes, colación), 30% gustos, 20% ahorro luna. Antes de comprar: espera 48 h. Usa 💰 Finanzas del calendario para ver a dónde se va. Cuidado con prestar tu cuenta RUT: es delito (arriendo de cuentas).' }
];

/* ---------------- DIALOGO ---------------- */
function switchTab(name) {
  ['Guia', 'Cuerpo', 'Mente', 'Estudio', 'Social', 'Espacio'].forEach(function (t) {
    var p = $('adol' + t), b = $('tabAdol' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildDialog() {
  var etapasHTML = ETAPAS.map(function (e) {
    return '<div class="si-card"><h4>' + e.ico + ' ' + esc(e.n) + '</h4><p>' + esc(e.q) + '</p>' +
      '<p><b>Cuerpo:</b> ' + esc(e.cuerpo) + '<br><b>Mente/vínculos:</b> ' + esc(e.mente) + '</p>' +
      '<p class="muted">' + esc(e.tip) + '</p></div>';
  }).join('');

  var cuerpoHTML = CUERPO.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');

  var menteHTML = MENTE_CARDS.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');

  var estudioHTML = ESTUDIO.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');

  var hollHTML = HOLLAND.map(function (h) {
    return '<div class="si-card"><h4>🧭 ' + esc(h.area) + '</h4><p>' + esc(h.ej) + '</p></div>';
  }).join('');

  var hollItems = HOLLAND_ITEMS.map(function (it, i) {
    return '<label class="check-row" style="font-size:12px;margin:4px 0"><input type="checkbox" class="adol-holl" data-area="' + it[1] + '"> ' + esc(it[0]) + ' <span class="muted">(' + it[1] + ')</span></label>';
  }).join('');

  var socialHTML = SOCIAL.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');

  var emoChips = EMOS.map(function (e) {
    return '<label class="check-row" style="margin:2px 8px 2px 0;font-size:12px"><input type="checkbox" class="adol-emo" value="' + esc(e) + '"> ' + esc(e) + '</label>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin:12px 0 10px;flex-wrap:wrap">' +
    '<button type="button" id="tabAdolGuia" class="btn btn-accent" style="width:auto">🧭 Guía</button>' +
    '<button type="button" id="tabAdolCuerpo" class="btn" style="width:auto">🌱 Cuerpo</button>' +
    '<button type="button" id="tabAdolMente" class="btn" style="width:auto">🧠 Mente</button>' +
    '<button type="button" id="tabAdolEstudio" class="btn" style="width:auto">📚 Estudio</button>' +
    '<button type="button" id="tabAdolSocial" class="btn" style="width:auto">🤝 Social</button>' +
    '<button type="button" id="tabAdolEspacio" class="btn" style="width:auto">📓 Mi espacio</button></div>' +

    '<div id="adolStreak" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +

    '<div class="si-card" style="border-left:3px solid #e76e8a"><h4>🆘 Si la estás pasando mal ahora</h4>' +
    '<p style="font-size:12px">No tienes que aguantarlo solo/a: <b>*4141</b> prevención del suicidio (24 h, gratis) · <b>149</b> Fono Familia · <b>1455</b> violencia · <b>600 360 7777</b> Salud Responde · En Penco: tu <b>CESFAM</b>, orientador/a o profe de confianza. Si hay peligro inmediato: <b>133</b> Carabineros / <b>131</b> SAMU.</p></div>' +

    /* GUIA */
    '<div id="adolGuia">' +
    '<div class="si-card"><h4>🧭 ¿Qué es la adolescencia?</h4><p>Etapa entre los 10 y 19 años donde tu <b>cuerpo, cerebro y vínculos</b> cambian rápido. Tu cerebro emocional va en moto y tu freno (planificar, controlar impulsos) aún en bici: por eso sientes todo intenso y a veces te arrepientes. No estás roto/a: estás en construcción. Esta sección es <b>educativa y privada</b>: te ordena, te da herramientas y te dice dónde pedir ayuda real.</p></div>' +
    etapasHTML +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>🚫 Mitos que pesan</h4><p>• "Todos ya lo hicieron menos yo" → la mayoría exagera.<br>• "Pedir ayuda es de débiles" → es de valientes.<br>• "Tu nota = tu valor" → tu valor no es un promedio.<br>• "El porno enseña" → es ficción sin cuidado.<br>• "Si duele, es amor" → el amor cuida, no controla.</p></div>' +
    '<div class="discipline-card"><h4>🗺️ Cómo usar esta sección</h4><p>1) Lee la <b>Guía</b> una vez.<br>2) Revisa <b>Cuerpo</b> y <b>Mente</b> según lo que vivas hoy.<br>3) Arma tu método en <b>Estudio</b> + test vocacional.<br>4) Acuerda tus límites en <b>Social</b>.<br>5) Registra todo en <b>Mi espacio</b> y relee cada luna: los patrones se ven en el tiempo.</p></div>' +
    '</div>' +
    '<div class="si-card"><h4>👨‍👩‍👧 Para familias (1 min)</h4><p>Escuchar sin sermón abre más que controlar el celu a escondidas. Acuerden reglas juntos (horarios, salidas, plata), privacidad con cuidado, y una <b>persona segura</b> fuera de casa (tío/a, orientador). Si hay gritos o golpes, pidan ayuda: 149 / CESFAM.</p></div>' +
    '</div>' +

    /* CUERPO */
    '<div id="adolCuerpo" class="hidden">' +
    '<div class="si-card"><h4>🌱 Tu cuerpo, tu ritmo</h4><p>Cada cuerpo tiene su luna: unos cambian a los 10, otros a los 15. Lo raro no es cambiar: lo raro sería no cambiar. Cuídalo con sueño, comida real, movimiento e higiene — y pregunta sin vergüenza en salud.</p></div>' +
    cuerpoHTML +
    '<div class="menstrual-card"><h4>🔗 Conecta con tu calendario</h4><p class="muted" style="font-size:11px">Lleva tu energía y descanso en 📓 Mi espacio. Si menstruas, usa también 🌸 Ciclo para predecir y entender tu ánimo por fase.</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="adolGoCiclo" class="btn" style="width:auto">🌸 Ir a Ciclo</button><button type="button" id="adolGoRutina" class="btn" style="width:auto">🧘 Rutinas</button><button type="button" id="adolGoGym" class="btn" style="width:auto">💪 Entrenamientos</button></div></div>' +
    '</div>' +

    /* MENTE */
    '<div id="adolMente" class="hidden">' +
    '<div class="si-card"><h4>🧠 Mente adolescente: intensa por diseño</h4><p>Compararte, sentirte fuera de lugar o llorar por algo "chico" es esperable. Lo que importa es tener <b>herramientas + 1 persona segura + 1 rutina</b> que te sostenga. Si el bajón dura 2+ semanas o piensas en hacerte daño, pide ayuda hoy (*4141).</p></div>' +
    menteHTML +
    '<div class="menstrual-card"><h4>🧰 Kit 2 minutos (pruébalo ahora)</h4><p class="muted" style="font-size:11px">1) Respiración 4-6 × 4 ciclos. 2) Nombra lo que sientes en 1 frase. 3) Elige la micro-acción siguiente (abrir cuaderno, caminar 5 min, escribir). 4) Si sigue en 8/10, habla con tu persona segura.</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="adolGoBreath" class="btn" style="width:auto">🌬️ Respiración</button><button type="button" id="adolGoGrat" class="btn" style="width:auto">📓 Gratitud</button><button type="button" id="adolGoPsico" class="btn" style="width:auto">🪞 Autoconocimiento</button></div></div>' +
    '</div>' +

    /* ESTUDIO */
    '<div id="adolEstudio" class="hidden">' +
    '<div class="si-card"><h4>📚 Estudiar sin matarse</h4><p>No es cuántas horas: es <b>foco + repaso espaciado + sueño</b>. Elige 1 técnica de abajo por luna y mide tu nota/ánimo. El celular en otra pieza sube tu nota más que cualquier plumón bonito.</p></div>' +
    estudioHTML +
    '<div class="menstrual-card"><h4>🧭 Test vocacional Holland (12 frases)</h4><p class="muted" style="font-size:11px">Marca lo que te gusta de verdad (no lo que "debería"). Resultado: tus 2 letras fuertes para conversar con tu orientador/a. No es destino: es brújula.</p>' +
    hollItems +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" id="adolHollCalc" class="btn btn-accent" style="width:auto">Ver mi resultado</button><button type="button" id="adolHollClear" class="btn" style="width:auto">Limpiar</button></div>' +
    '<div id="adolHollRes" style="margin-top:8px"></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📖 Las 6 áreas Holland</h4>' + hollHTML + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🔗 Estudia con tu calendario</h4><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="adolGoStudy" class="btn" style="width:auto">🧠 Estudio</button><button type="button" id="adolGoSched" class="btn" style="width:auto">📚 Horario</button><button type="button" id="adolGoDisc" class="btn" style="width:auto">🎯 Disciplina</button></div></div>' +
    '</div>' +

    /* SOCIAL */
    '<div id="adolSocial" class="hidden">' +
    '<div class="si-card"><h4>🤝 Vínculos que cuidan</h4><p>Amistad, pololeo, grupo y redes: todos enseñan. La regla de oro: <b>si tienes que achicarte para encajar, ese no es tu lugar</b>. Pon límites temprano: un no claro hoy evita un problema grande mañana.</p></div>' +
    socialHTML +
    '<div class="si-card" style="border-left:3px solid var(--gold)"><h4>📵 Pacto de redes (copia y pega con tu grupo)</h4><p>1) Nada íntimo por chat. 2) No se reenvía nada de nadie. 3) Si alguien la pasa mal en el grupo, se para el hueveo. 4) Pantallas fuera de 23:00 a 07:00. 5) Si un adulto desconocido pide fotos/secreto/junta: bloquear + contar + denunciar.</p></div>' +
    '</div>' +

    /* ESPACIO */
    '<div id="adolEspacio" class="hidden">' +
    '<div class="menstrual-card" style="margin-bottom:10px"><h4>💚 Chequeo de hoy — 1 minuto</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="adolFecha"></label></div>' +
    '<div class="conv-row" style="align-items:center"><label style="flex:1">Ánimo 1-10 <input type="range" id="adolAnimo" min="1" max="10" value="6" style="width:100%"></label><span id="adolAnimoV" class="chip" style="min-width:44px;text-align:center">6</span>' +
    '<label style="flex:1">Energía 1-10 <input type="range" id="adolEnergia" min="1" max="10" value="6" style="width:100%"></label><span id="adolEnergiaV" class="chip" style="min-width:44px;text-align:center">6</span></div>' +
    '<div class="conv-row" style="align-items:center"><label style="flex:1">Sueño anoche (h) <input type="number" id="adolSueno" min="0" max="14" step="0.5" value="8"></label>' +
    '<label style="flex:2">Persona segura de hoy <input type="text" id="adolSegura" placeholder="ej: mamá, profe Javi, amiga Paz" maxlength="40"></label></div>' +
    '<p class="muted" style="font-size:11px;margin:6px 0 4px">Emociones (marca las presentes):</p>' +
    '<div style="display:flex;flex-wrap:wrap">' + emoChips + '</div>' +
    '<label>Diario (5 líneas bastan) <textarea id="adolNota" rows="3" placeholder="Hoy me sentí... / Me costó... / Mañana quiero..." maxlength="600"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="adolCheckSave" class="btn btn-accent" style="width:auto">💾 Guardar chequeo</button></div></div>' +

    '<div class="menstrual-card" style="margin-bottom:10px"><h4>🎯 Mis metas de la luna (máx 3)</h4>' +
    '<p class="muted" style="font-size:11px">Una de estudio, una de cuidado y una libre. Chicas y medibles: "25 min inglés × 4 días" mejor que "estudiar más".</p>' +
    '<div class="conv-row"><label style="flex:2">Meta <input type="text" id="adolMetaTxt" placeholder="ej: Pomodoro inglés 4 días" maxlength="80"></label>' +
    '<label>Tipo <select id="adolMetaTipo"><option value="estudio">📚 Estudio</option><option value="cuidado">💚 Cuidado</option><option value="social">🤝 Social</option><option value="plata">💰 Plata</option><option value="otra">✨ Otra</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="adolMetaAdd" class="btn btn-accent" style="width:auto">+ Agregar meta</button></div>' +
    '<div id="adolMetas" class="habits-list" style="margin-top:10px"></div></div>' +

    '<div class="menstrual-card"><h4>📓 Mi diario (últimos 15)</h4><div id="adolLog" class="habits-list" style="max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="adolStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="adolShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="adolExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="adolClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '</div>';

  makeDialog('adolescenciaDialog', '🌱 Adolescencia',
    'De 10 a 19: cuerpo, mente, estudio y vínculos sin sermones. Elige pestaña y avanza 1 paso por luna. Todo queda <b>privado y local</b>. <b>Educativo: no reemplaza familia, liceo ni terapia.</b> Crisis: <b>*4141</b> (24h).',
    body);
}

/* ---------------- RENDER ---------------- */
function streak() {
  var c = store().checks, s = 0, d = new Date();
  for (var i = 0; i < 365; i++) {
    var k;
    try { k = cal.fmtKey.format(d); } catch (e) { k = d.toISOString().slice(0, 10); }
    var day = c[k];
    var has = day && ((day.nota && day.nota.trim()) || day.animo);
    if (has) { s++; d.setDate(d.getDate() - 1); }
    else if (i === 0) { d.setDate(d.getDate() - 1); continue; }
    else break;
  }
  return s;
}
function renderStreak() {
  var b = $('adolStreak'); if (!b) return;
  var e = store();
  var n = Object.keys(e.checks || {}).length;
  var nm = (e.metas || []).filter(function (m) { return m.done; }).length;
  var nt = (e.tests || []).length;
  var avg = '';
  try {
    var ks = Object.keys(e.checks || {}).slice(-7);
    if (ks.length) {
      var sum = 0, m = 0;
      ks.forEach(function (k) { var v = +((e.checks[k] || {}).animo || 0); if (v) { sum += v; m++; } });
      if (m) avg = ' · ánimo medio 7d: <b>' + (sum / m).toFixed(1) + '/10</b>';
    }
  } catch (x) {}
  b.innerHTML = '<b>🌱 Racha:</b> ' + streak() + ' días · <b>' + n + '</b> chequeos · <b>' + nm + '</b> metas logradas · <b>' + nt + '</b> tests' + avg +
    '<span class="muted" style="font-size:11px"> — relee cada luna: ahí se ven los avances</span>';
}
function renderLog() {
  var box = $('adolLog'); if (!box) return;
  var c = store().checks;
  var keys = Object.keys(c).sort().reverse().slice(0, 15);
  box.innerHTML = keys.length ? keys.map(function (k) {
    var d = c[k] || {};
    var emos = (d.emociones || []).join(', ');
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b> · ánimo ' + esc(String(d.animo || '-')) + '/10 · energía ' + esc(String(d.energia || '-')) + '/10' +
      (d.sueno != null && d.sueno !== '' ? ' · 😴 ' + esc(String(d.sueno)) + 'h' : '') +
      (emos ? '<br>Emociones: ' + esc(emos) : '') +
      (d.segura ? '<br>Persona segura: ' + esc(d.segura) : '') +
      (d.nota ? '<br>' + esc(d.nota) : '') + '</span>' +
      '<button type="button" class="btn btn-icon adol-daydel" data-k="' + esc(k) + '">✕</button></div>';
  }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin chequeos. Guarda el primero arriba: 1 minuto.</p>';
  box.querySelectorAll('.adol-daydel').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.checks[x.dataset.k]; save(); renderStreak(); renderLog(); };
  });
  var st = $('adolStats'); if (st) st.textContent = keys.length ? Object.keys(c).length + ' día(s) registrados' : '';
}
function renderMetas() {
  var box = $('adolMetas'); if (!box) return;
  var ms = store().metas || [];
  if (!ms.length) { box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin metas. Agrega 1 pequeña arriba para esta luna.</p>'; return; }
  box.innerHTML = ms.map(function (m) {
    return '<div class="hora-item"><span style="font-size:12px">' + (m.done ? '✅ <s>' : '⬜ ') + esc(m.txt) + (m.done ? '</s>' : '') +
      ' <span class="chip" style="font-size:10px">' + esc(m.tipo || 'otra') + '</span><br><span class="muted" style="font-size:10px">' + esc(m.fecha || '') + '</span></span>' +
      '<span style="display:flex;gap:6px"><button type="button" class="btn btn-icon adol-mdone" data-k="' + esc(m.id) + '" title="Marcar/desmarcar">✓</button>' +
      '<button type="button" class="btn btn-icon adol-mdel" data-k="' + esc(m.id) + '">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.adol-mdone').forEach(function (x) {
    x.onclick = function () {
      var e = store();
      var m = (e.metas || []).filter(function (e2) { return e2.id === x.dataset.k; })[0];
      if (m) m.done = !m.done;
      save(m && m.done ? 'Meta lograda 🎉' : 'Guardado'); renderStreak(); renderMetas();
    };
  });
  box.querySelectorAll('.adol-mdel').forEach(function (x) {
    x.onclick = function () { var e = store(); e.metas = (e.metas || []).filter(function (e2) { return e2.id !== x.dataset.k; }); save(); renderStreak(); renderMetas(); };
  });
}

/* ---------------- SETUP ---------------- */
function gotoBtn(id) { try { var x = $(id); if (x) x.click(); } catch (e) {} }

function setup() {
  /* 1) inyectar botón en grupo Mente & Estudio */
  try {
    if (!$('btnAdolescencia')) {
      var g = document.querySelector('.action-group[data-group="mente"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnAdolescencia'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌱 Adolescencia';
        btn.setAttribute('data-keywords', 'adolescencia teen joven pubertad liceo vocacion paES bullying autoestima consentimiento pololeo redes grooming cambios cuerpo emociones estudio futuro amigos presion grupo alcohol drogas sENDA sueno higiene ciclo');
        var ref = g.querySelector('#btnPsico');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnAdolescencia') < 0) ALL_BTNS.push('btnAdolescencia');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnAdolescencia = true; });
      if (PRESETS.adolescente) PRESETS.adolescente.btnAdolescencia = true;
      if (PRESETS.estudiante) PRESETS.estudiante.btnAdolescencia = true;
      if (PRESETS.infantil) PRESETS.infantil.btnAdolescencia = false;
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Mente) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnAdolescencia"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Mente') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnAdolescencia"> 🌱 Adolescencia';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnAdolescencia !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnAdolescencia = lab.querySelector('input').checked;
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

  /* 4) diálogo */
  buildDialog();
  renderStreak(); renderLog(); renderMetas();

  var b = $('btnAdolescencia');
  if (b) b.onclick = function () {
    if ($('adolFecha') && !$('adolFecha').value) $('adolFecha').value = todayKey();
    renderStreak(); renderLog(); renderMetas();
    openDlg('adolescenciaDialog');
  };

  ['Guia', 'Cuerpo', 'Mente', 'Estudio', 'Social', 'Espacio'].forEach(function (t) {
    var tb = $('tabAdol' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var an = $('adolAnimo'), anv = $('adolAnimoV');
  if (an) an.oninput = function () { if (anv) anv.textContent = an.value; };
  var en = $('adolEnergia'), env = $('adolEnergiaV');
  if (en) en.oninput = function () { if (env) env.textContent = en.value; };

  var sv = $('adolCheckSave');
  if (sv) sv.onclick = function () {
    var k = ($('adolFecha') && $('adolFecha').value) || todayKey();
    var emos = Array.prototype.map.call(document.querySelectorAll('.adol-emo:checked'), function (x) { return x.value; });
    var e = store();
    e.checks[k] = {
      animo: +($('adolAnimo') ? $('adolAnimo').value : 5),
      energia: +($('adolEnergia') ? $('adolEnergia').value : 5),
      sueno: (($('adolSueno') || {}).value || ''),
      segura: clean((($('adolSegura') || {}).value || '').trim(), 40),
      emociones: emos,
      nota: clean((($('adolNota') || {}).value || '').trim(), 600)
    };
    save('Guardado ✓');
    if ($('adolNota')) $('adolNota').value = '';
    renderStreak(); renderLog();
  };

  var ma = $('adolMetaAdd');
  if (ma) ma.onclick = function () {
    var t = clean((($('adolMetaTxt') || {}).value || '').trim(), 80);
    if (!t) return alert('Escribe tu meta primero');
    var e = store();
    if ((e.metas || []).filter(function (m) { return !m.done; }).length >= 3) return alert('Máximo 3 metas activas: termina o borra una para sumar otra.');
    e.metas.push({ id: uid('am'), fecha: todayKey(), txt: t, tipo: ($('adolMetaTipo') || {}).value || 'otra', done: false });
    save('Meta guardada 🎯');
    if ($('adolMetaTxt')) $('adolMetaTxt').value = '';
    renderStreak(); renderMetas();
  };

  var hc = $('adolHollCalc');
  if (hc) hc.onclick = function () {
    var counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }, total = 0;
    document.querySelectorAll('.adol-holl:checked').forEach(function (x) { counts[x.dataset.area] = (counts[x.dataset.area] || 0) + 1; total++; });
    var box = $('adolHollRes');
    if (!total) { if (box) box.innerHTML = '<p class="muted" style="font-size:12px">Marca al menos 3 frases que te gusten para ver tu resultado.</p>'; return; }
    var order = Object.keys(counts).sort(function (a, c2) { return counts[c2] - counts[a]; });
    var top = order.slice(0, 2).join(' + ');
    var names = { R: 'Realista (manos)', I: 'Investigador (ideas)', A: 'Artístico (crear)', S: 'Social (personas)', E: 'Emprendedor (liderar)', C: 'Convencional (orden)' };
    var detail = order.map(function (k) { return k + ' ' + counts[k]; }).join(' · ');
    if (box) box.innerHTML = '<div class="si-card" style="border-color:var(--gold)"><h4>Tu brújula: ' + esc(top) + '</h4><p>' + esc(names[order[0]]) + ' + ' + esc(names[order[1]]) + ' — puntajes: ' + esc(detail) + '</p><p class="muted" style="font-size:11px">Llévalo a tu orientador/a: ¿qué carreras/oficios de Penco y Bío-Bío usan estas 2 fuerzas? Es brújula, no destino.</p></div>';
    var e = store();
    e.tests.push({ id: uid('at'), fecha: todayKey(), tipo: 'holland', nombre: 'Vocacional Holland', puntaje: top, nivel: detail, respuestas: total });
    save('Test guardado ✓'); renderStreak();
  };
  var hr = $('adolHollClear');
  if (hr) hr.onclick = function () {
    document.querySelectorAll('.adol-holl').forEach(function (x) { x.checked = false; });
    var box = $('adolHollRes'); if (box) box.innerHTML = '';
  };

  /* puentes a otras secciones */
  var bridges = [['adolGoCiclo', 'btnMenstrual'], ['adolGoRutina', 'btnRutina'], ['adolGoGym', 'btnGym'],
    ['adolGoBreath', 'btnBreath'], ['adolGoGrat', 'btnGratitud'], ['adolGoPsico', 'btnPsico'],
    ['adolGoStudy', 'btnStudy'], ['adolGoSched', 'btnSchedule'], ['adolGoDisc', 'btnDiscipline']];
  bridges.forEach(function (p) { var x = $(p[0]); if (x) x.onclick = function () { gotoBtn(p[1]); }; });

  var sh = $('adolShare');
  if (sh) sh.onclick = async function () {
    var c = store().checks;
    var keys = Object.keys(c).sort().reverse().slice(0, 7);
    var t = keys.length ? '🌱 Mi semana adolescente\n' + keys.map(function (k) {
      var d = c[k]; return '• ' + k + ': ánimo ' + d.animo + '/10, energía ' + d.energia + '/10' + (d.nota ? ' — ' + d.nota : '');
    }).join('\n') : '🌱 Sin chequeos aún';
    await share('Mi espacio', t);
  };
  var ex = $('adolExport');
  if (ex) ex.onclick = async function () {
    var e = store();
    var t = '🌱 ADOLESCENCIA — exportación ' + todayKey() + '\n\nCHEQUEOS\n' +
      Object.keys(e.checks).sort().map(function (k) { var d = e.checks[k]; return k + ' | ánimo ' + d.animo + ' | energía ' + d.energia + ' | sueño ' + (d.sueno || '-') + 'h | ' + (d.emociones || []).join(',') + ' | ' + (d.nota || ''); }).join('\n') +
      '\n\nMETAS\n' + (e.metas || []).map(function (m) { return (m.done ? '[x] ' : '[ ] ') + m.txt + ' (' + m.tipo + ' ' + m.fecha + ')'; }).join('\n') +
      '\n\nTESTS\n' + (e.tests || []).map(function (r) { return r.fecha + ' | ' + r.nombre + ' | ' + r.puntaje + ' | ' + r.nivel; }).join('\n');
    await share('Exportar adolescencia', t);
  };
  var cl = $('adolClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu Mi espacio adolescente (chequeos y metas)? Los tests se conservan.')) return;
    try { var u = userData(); u.adolescencia.checks = {}; u.adolescencia.metas = []; } catch (e) {}
    save(); renderStreak(); renderLog(); renderMetas();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
