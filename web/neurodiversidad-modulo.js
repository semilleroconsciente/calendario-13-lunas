/* ============================================================
   NEURODIVERSIDAD — Calendario 13 Lunas (Penco · Bio-Bio)
   Modulo independiente, al lado de Psicologia (Linaje > Interior):
   - Boton btnNeurodiversidad (inyectado junto a btnPsicologia)
   - Dialogo neurodiversidadDialog con 5 subsecciones (pestanas):
     1) Guia (que es, lenguaje, mitos, como usar, derechos Chile)
     2) Perfiles (8 fichas + buscador)
     3) Apoyos (8 apoyos practicos)
     4) Tests (AQ-10 + ASRS-6 + historial)
     5) Mi plan (tarjeta de acceso personal)
   - Datos: reutiliza userData().psicologia
     { tests:[...], neuro:{ perfil:{} } }
     (migra automatico: quien guardo plan/tests cuando vivia
     dentro de Psicologia los conserva intactos)
   - Educativo: NO diagnostica, NO reemplaza evaluacion clinica.
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
/* Comparte almacenamiento con Psicologia para no perder datos previos */
function psi() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { tests: [], neuro: { perfil: {} } };
    if (!u.psicologia) u.psicologia = { checks: {}, tests: [], tcc: [], neuro: { perfil: {} } };
    var e = u.psicologia;
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!e.neuro || typeof e.neuro !== 'object') e.neuro = { perfil: {} };
    if (!e.neuro.perfil || typeof e.neuro.perfil !== 'object') e.neuro.perfil = {};
    return e;
  } catch (e2) { return { tests: [], neuro: { perfil: {} } }; }
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
var ND_SENS = ['ruido', 'luz fuerte', 'texturas/ropa', 'multitudes', 'cambios imprevistos', 'contacto físico', 'olores/sabores', 'mirada directa'];
var ND_FORTS = ['memoria detalle', 'hiperfoco', 'creatividad', 'lógica/patrones', 'justicia/honestidad', 'humor', 'naturaleza/animales', 'arte/música'];

var ND_PERFILES = [
  { n: 'Autismo (TEA)', ico: '🧩', tag: 'autismo tea espectro intereses rutinas sensorial comunicacion',
    idea: 'Neurotipo con diferencias en comunicación social, intereses profundos, necesidad de predictibilidad y procesamiento sensorial intenso. Espectro amplio: cada persona es distinta.',
    rasgos: 'Fortalezas: memoria de detalle, honestidad, pasiones profundas, pensamiento visual/lógico. Desafíos: sobrecarga sensorial, cambios bruscos, doble empatía (malentendidos mutuos), agotamiento por enmascarar.',
    apoyos: 'Anticipar con agenda visual · instrucciones literales y por escrito · espacio de calma sin luz/ruido · respetar stimming · tiempos extra de transición.',
    practica: 'Arma tu "tarjeta de acceso": 3 cosas que te ayudan + 3 que te sobrecargan + cómo pedir una pausa. Compártela con 1 persona de confianza.',
    cuidado: 'Solo un equipo clínico diagnostica (neurólogo, psiquiatra, psicólogo). Chile: Ley TEA 21.545, PIE en escuelas, CESFAM para derivación.' },
  { n: 'TDAH', ico: '⚡', tag: 'tdah atencion hiperactividad impulsividad foco funciones ejecutivas',
    idea: 'Regulación distinta de atención y activación: cerebro buscador de novedad. No es falta de voluntad: es dopamina que pide interés, urgencia o novedad para arrancar.',
    rasgos: 'Fortalezas: creatividad, energía, resolución en crisis, hiperfoco en lo que apasiona. Desafíos: iniciar/sostener tareas, tiempo, olvidos, impulsividad, montaña rusa emocional.',
    apoyos: 'Externalizar: alarmas, listas visibles, temporizador · partir en pasos de 5 min · cuerpo primero (movimiento) · dopamina sana antes de lo fome · lugar con pocas distracciones.',
    practica: 'Técnica 3-2-1: 3 min ordenar pista, 2 min temporizador visible, 1 sola tarea. Anota interrupciones en papel y vuelve.',
    cuidado: 'Si interfiere con estudio/trabajo/vínculos, evalúa con psiquiatra/neurología + psicología. Medicación solo con receta médica.' },
  { n: 'Dislexia', ico: '📖', tag: 'dislexia lectura escritura letras dea',
    idea: 'Diferencia en decodificación lectora: el cerebro prioriza significado e imagen sobre sonido-letra. Inteligencia intacta: la vía de entrada necesita otro formato.',
    rasgos: 'Fortalezas: pensamiento espacial, historias, resolución global. Desafíos: lectura lenta, ortografía, copiar de pizarra, cansancio lector.',
    apoyos: 'Audio + texto (lectura en voz alta, audiolibros) · letra grande y espaciada · más tiempo · evaluar oralmente · evitar copiar bajo presión.',
    practica: 'Pasa 1 texto a audio (lector del sistema) y subraya ideas mientras escuchas. Mide comprensión: suele subir.',
    cuidado: 'Detección vía PIE / psicopedagogía. No es "flojera": es acceso.' },
  { n: 'Discalculia y disgrafía', ico: '🔢', tag: 'discalculia disgrafia numeros matematicas escritura motricidad',
    idea: 'Discalculia: dificultad para sentido numérico y cálculo. Disgrafía: trazo, ortografía y organización escrita costosos. Ambas conviven con buenas ideas.',
    rasgos: 'Fortalezas: razonamiento verbal, creatividad. Desafíos: tablas, cálculo mental, alinear cifras, letra ilegible, dolor de mano.',
    apoyos: 'Calculadora y tabla pitagórica sin culpa · papel cuadriculado grande · dictar ideas antes de escribir · teclado sobre manuscrito.',
    practica: 'Para 1 tarea de mates: dibuja el problema + usa material concreto (porotos, monedas) antes del algoritmo.',
    cuidado: 'Apoyo psicopedagógico + adecuaciones curriculares (PAC/PIE).' },
  { n: 'Altas capacidades', ico: '💡', tag: 'altas capacidades superdotacion talento doble excepcionalidad',
    idea: 'Desarrollo acelerado + alta sensibilidad: aprenden rápido, preguntan profundo y se aburren con repetición. A veces coexiste con TEA/TDAH (doble excepcionalidad).',
    rasgos: 'Fortalezas: abstracción, memoria, curiosidad, sentido de justicia. Desafíos: perfeccionismo, ansiedad, aburrimiento, sentirse "rara/o".',
    apoyos: 'Compactar currículo + proyectos reales · grupo de pares afines · permiso para equivocarse · regular exigencia-descanso.',
    practica: 'Proyecto pasión 20 min/semana sin nota: profundiza lo que amas y muestra a alguien.',
    cuidado: 'No es "no necesita ayuda": necesita desafío y sostén emocional.' },
  { n: 'Diferencias sensoriales', ico: '👂', tag: 'sensorial hipersensibilidad hiposensibilidad ruido luz tacto interocepcion',
    idea: 'Cerebros que sienten más (hiper) o piden más (hipo): ruido, luz, ropa, comida, movimiento. No es maña: es umbral neurológico distinto.',
    rasgos: 'Señales: taparse oídos, evitar etiquetas/costuras, oler todo, moverse siempre, no notar hambre/frío. Fortalezas: detectar detalles que otros no notan.',
    apoyos: 'Kit: audífonos reductores, lentes sol/gorra, ropa sin costura, chicle/mordedor, pausa sensorial programada.',
    practica: 'Mapa sensorial: anota 3 entornos (casa, escuela/trabajo, calle) y qué ajustas en cada uno. Guarda tu kit donde lo veas.',
    cuidado: 'Terapia ocupacional con enfoque sensorial ayuda a diseñar dieta sensorial. Evita exposición forzada ("acostúmbrate").' },
  { n: 'Tics y Tourette', ico: '💬', tag: 'tourette tics movimientos sonidos',
    idea: 'Movimientos o sonidos involuntarios (tics) que suben con estrés, emoción y cansancio. La persona los siente venir (impulso premonitorio).',
    rasgos: 'Fortalezas: energía, humor, foco en intereses. Desafíos: vergüenza, miradas, agotamiento por suprimir, dolor muscular.',
    apoyos: 'No imitar ni retar · ignorar el tic y mirar a la persona · pausas de descarga · avisar al grupo con naturalidad si la persona quiere.',
    practica: 'Acuerda señal discreta para salir a descargar sin preguntas. Vuelve cuando baje.',
    cuidado: 'Diagnóstico neurológico. CBIT (terapia conductual de tics) tiene buena evidencia.' },
  { n: 'Dispraxia / DCD', ico: '🤸', tag: 'dispraxia dcd coordinacion motricidad torpeza',
    idea: 'Planificar y ejecutar movimientos cuesta: abotonar, recortar, andar en bici, deporte, letra. No es torpeza voluntaria: es coordinación.',
    rasgos: 'Fortalezas: ideas, lenguaje, empatía. Desafíos: ritmo, equilibrio, organización espacial, cansancio motor.',
    apoyos: 'Más tiempo + descomponer pasos · velcro/cierre fácil · teclado · practicar por partes sin público.',
    practica: 'Elige 1 destreza y practica 5 min en pasos micro (ej: nudo en 3 fotos). Celebra el avance parcial.',
    cuidado: 'Kinesiología / terapia ocupacional. Adecuar educación física sin humillación.' }
];

var ND_APOYOS = [
  { n: 'Anticipar y visualizar', ico: '🗓️', pasos: 'Agenda visual + aviso de cambios con tiempo ("en 10 min cambiamos"). Regla: novedad con mapa, no sorpresa. Usa pictos, checklist con casillas y reloj visible.', tip: 'El "¿qué viene ahora?" baja la mitad de las crisis.' },
  { n: 'Kit de calma sensorial', ico: '🎧', pasos: 'Audífonos reductores + lentes/gorra + algo para morder o apretar + olor seguro + rincón de pausa. Tenlo armado y a mano, no guardado lejos.', tip: 'Úsalo preventivo (antes de saturarte), no solo en crisis.' },
  { n: 'Meltdown vs shutdown: qué hacer', ico: '🆘', pasos: 'Meltdown (explosión): menos palabras, menos luz/ruido, espacio, agua, no razonar. Shutdown (apagón): no exigir respuesta, ofrecer presencia tranquila + salida. Después, reparar sin sermón y ajustar.', tip: 'No es pataleta: es colapso neurológico. Registrar qué lo gatilló previene el próximo.' },
  { n: 'Comunicación directa y amable', ico: '💬', pasos: 'Pide literal: 1 idea por frase, por escrito si se puede. Evita ironía/dobles sentidos bajo estrés. Ofrece opciones ("¿hablamos o escribimos?"). Respeta no mirar a los ojos para escuchar mejor.', tip: 'Pregunta: "¿cómo te aviso sin saturarte?" y cumple.' },
  { n: 'Funciones ejecutivas con andamios', ico: '🧱', pasos: 'Todo fuera de la cabeza: lista de 3, temporizador visible, partir por la mitad, "primero 5 min". Cuerpo antes que mente: moverse, comer, dormir. Revisa al final, no al medio.', tip: 'Si no parte, achica el paso, no subas la exigencia.' },
  { n: 'Descansos reales y stimming', ico: '🌿', pasos: 'Stimming (aletear, balancear, repetir) regula: no lo quites, dale espacio seguro. Pausas programadas cada 25-45 min + movimiento + agua. Día con "presupuesto social": planifica recuperación.', tip: 'Enmascarar todo el día = agotamiento. Agenda ser tú sin público.' },
  { n: 'Estudio y trabajo que calzan', ico: '📚', pasos: 'Instrucciones por escrito + ejemplo hecho + tiempo extra + evaluación flexible (oral, proyecto, pausas). Auriculares y lugar predecible. Negocia 1 adecuación concreta por ramo/tarea.', tip: 'Chile: pide entrevista PIE / inclusión laboral (Ley 21.015). Lleva tu tarjeta de acceso por escrito.' },
  { n: 'Derechos y red en Chile', ico: '⚖️', pasos: 'Ley TEA 21.545 (deberes salud/educación) · PIE en escuelas · credencial de discapacidad y Registro (COMPIN/SENADIS) · CESFAM deriva a neurología/psiquiatría/psicología · Salud Responde 600 360 7777 · crisis *4141.', tip: 'Guarda certificados y solicitudes por escrito. Pide todo con folio: lo verbal se pierde.' }
];

var ND_TESTS = [
  { id: 'aq10', ico: '🧩', nombre: 'Rasgos autistas (AQ-10 breve)', desc: '10 frases sobre las últimas semanas: atención al detalle, lectura social, cambios y sensorial. Screening educativo, NO diagnostica.',
    items: ['Noto patrones o detalles que otros no notan', 'Me cuesta leer entre líneas o dobles sentidos', 'Prefiero hacer las cosas de la misma manera (rutina)', 'Me cuesta hacer amigos o mantener conversación', 'Me absorben tanto mis intereses que pierdo la noción del resto', 'Me cuesta adaptarme cuando cambia el plan', 'Los ruidos/luces/texturas me saturan fácil', 'Me cuesta entender lo que sienten otros solo con mirarlos', 'Me cuesta el ida y vuelta de la conversación', 'Necesito tiempo a solas para recuperarme tras lo social'],
    opts: ['Nunca (0)', 'A veces (1)', 'A menudo (2)', 'Siempre (3)'],
    interp: function (t) { return t <= 8 ? 'Pocos rasgos ahora: mantén lo que te sirve y observa en el tiempo.' : t <= 14 ? 'Algunos rasgos: explora apoyos sensoriales y de comunicación. Si interfiere con tu vida, conversa en CESFAM / PIE.' : t <= 20 ? 'Varios rasgos: vale una evaluación profesional (psicología + neurología). Mientras, aplica tu plan de apoyos.' : 'Muchos rasgos: pide evaluación pronto y activa red de apoyo. No te autodiagnostiques: confirma con equipo clínico.'; } },
  { id: 'asrs6', ico: '⚡', nombre: 'Rasgos TDAH (ASRS-6)', desc: '6 preguntas sobre los últimos 6 meses: atención, organización, memoria, impulsividad. Screening educativo breve (OMS).',
    items: ['Me cuesta terminar detalles o cometo errores por descuido', 'Me cuesta organizar tareas o manejar el tiempo', 'Olvido citas, llaves, plazos o recados', 'Evito o postergo tareas que exigen esfuerzo mental', 'Me muevo/hablo en exceso o me siento inquieta/o por dentro', 'Interrumpo o me adelanto a responder sin esperar mi turno'],
    opts: ['Nunca (0)', 'Rara vez (1)', 'A veces (2)', 'A menudo (3)', 'Muy a menudo (4)'],
    interp: function (t) { return t <= 9 ? 'Bajo: despistes esperables. Orden externo simple basta.' : t <= 13 ? 'Moderado: prueba andamios 2 semanas (temporizador + lista de 3). Si no mejora, consulta.' : 'Alto: varios indicadores. Pide evaluación en CESFAM / psiquiatría + psicología. Lleva ejemplos concretos de estudio/trabajo.'; } }
];

/* ---------------- SUBSECCIONES ---------------- */
var ND_TABS = ['Guia', 'Perfiles', 'Apoyos', 'Tests', 'Plan'];
function switchNdTab(name) {
  ND_TABS.forEach(function (t) {
    var p = $('nd' + t), b = $('tabNd' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildNdDialog() {
  var perfHTML = ND_PERFILES.map(function (e) {
    return '<div class="discipline-card nd-card" data-q="' + esc((e.n + ' ' + e.tag + ' ' + e.idea + ' ' + e.rasgos).toLowerCase()) + '">' +
      '<h4>' + e.ico + ' ' + esc(e.n) + '</h4><p><b>Qué es:</b> ' + esc(e.idea) + '</p>' +
      '<p><b>Rasgos y fortalezas:</b> ' + esc(e.rasgos) + '</p><p><b>Apoyos que sirven:</b> ' + esc(e.apoyos) + '</p>' +
      '<p><b>Práctica 5 min:</b> ' + esc(e.practica) + '</p>' +
      (e.cuidado ? '<p class="muted">⚠️ ' + esc(e.cuidado) + '</p>' : '') + '</div>';
  }).join('');

  var apoyosHTML = ND_APOYOS.map(function (h) {
    return '<div class="si-card"><h4>' + h.ico + ' ' + esc(h.n) + '</h4><p>' + esc(h.pasos) + '</p><p class="muted">💡 ' + esc(h.tip) + '</p></div>';
  }).join('');

  var testsHTML = ND_TESTS.map(function (t) {
    var itemsHTML = t.items.map(function (q, j) {
      var opts = t.opts.map(function (o, v) {
        return '<label style="display:flex;gap:6px;align-items:center;font-size:12px;margin:3px 0;color:var(--text)"><input type="radio" name="t_' + t.id + '_' + j + '" value="' + v + '" style="accent-color:var(--gold)"> ' + esc(o) + '</label>';
      }).join('');
      return '<div class="si-card" style="margin-bottom:8px"><p style="margin-bottom:6px"><b>' + (j + 1) + '.</b> ' + esc(q) + '</p>' + opts + '</div>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:10px"><h4>' + t.ico + ' ' + esc(t.nombre) + '</h4>' +
      '<p class="muted" style="font-size:11px">' + esc(t.desc) + '</p>' + itemsHTML +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      '<button type="button" class="btn btn-accent nd-tcalc" data-test="' + t.id + '" style="width:auto">Ver mi resultado</button>' +
      '<button type="button" class="btn nd-treset" data-test="' + t.id + '" style="width:auto">Limpiar</button></div>' +
      '<div id="res_' + t.id + '" style="margin-top:8px"></div></div>';
  }).join('');

  var sensChips = ND_SENS.map(function (e) {
    return '<label class="check-row" style="margin:2px 8px 2px 0;font-size:12px"><input type="checkbox" class="nd-sens" value="' + esc(e) + '"> ' + esc(e) + '</label>';
  }).join('');

  var fortChips = ND_FORTS.map(function (e) {
    return '<label class="check-row" style="margin:2px 8px 2px 0;font-size:12px"><input type="checkbox" class="nd-fort" value="' + esc(e) + '"> ' + esc(e) + '</label>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin:12px 0 10px;flex-wrap:wrap">' +
    '<button type="button" id="tabNdGuia" class="btn btn-accent" style="width:auto">🧭 Guía</button>' +
    '<button type="button" id="tabNdPerfiles" class="btn" style="width:auto">🧩 Perfiles</button>' +
    '<button type="button" id="tabNdApoyos" class="btn" style="width:auto">🧰 Apoyos</button>' +
    '<button type="button" id="tabNdTests" class="btn" style="width:auto">📝 Tests</button>' +
    '<button type="button" id="tabNdPlan" class="btn" style="width:auto">🌈 Mi plan</button></div>' +

    '<div id="ndTop" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +

    /* 1) GUIA */
    '<div id="ndGuia">' +
    '<div class="si-card"><h4>🌈 ¿Qué es la neurodiversidad?</h4><p>Los cerebros no vienen en un solo modelo: <b>neurodivergente</b> = funciona distinto (autismo, TDAH, dislexia, etc.), <b>neurotípico</b> = funciona como la mayoría. No es enfermedad que curar: es <b>diferencia que necesita apoyos y derechos</b>. Esta sección es <b>educativa, sin etiquetas</b>: te ayuda a entenderte, pedir adecuaciones y saber cuándo buscar evaluación profesional.</p></div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>💬 Lenguaje que cuida</h4><p>• Pregunta cómo nombrarse: muchas personas prefieren <b>"soy autista"</b> (identidad) sobre "tengo autismo".<br>• Di <b>"persona con TDAH / dislexia"</b> o como ella prefiera.<br>• Evita: "enfermito", "normal vs anormal", "le falta esforzarse".<br>• Habla de <b>apoyos y barreras</b>, no de fallas.</p></div>' +
    '<div class="discipline-card"><h4>🚫 Mitos neuro</h4><p>• "Se cura con disciplina" → se <b>apoya</b> con diseño del entorno.<br>• "Si mira a los ojos no es autista" → el espectro es amplio.<br>• "TDAH es de niños" → sigue en adultos, sobre todo mujeres.<br>• "Un test online diagnostica" → solo orienta; diagnostica un equipo clínico.</p></div>' +
    '</div>' +
    '<div class="si-card" style="border-left:3px solid #e8c56a"><h4>🧭 Cómo usar esta sección</h4><p>1) Lee 1 <b>perfil</b> que te resuene. 2) Prueba 1 <b>apoyo</b> 7 días. 3) Si quieres, haz un <b>test breve</b>. 4) Arma <b>Mi plan</b> y muéstralo a quien te apoya. Si interfiere con estudio, trabajo o vínculos, pide hora en <b>CESFAM / PIE / neurología</b>.</p></div>' +
    '<div class="si-card" style="border-left:3px solid #e76e8a"><h4>⚖️ Derechos y red en Chile</h4><p>Ley TEA 21.545 · PIE en escuelas · credencial de discapacidad y Registro (COMPIN/SENADIS) · CESFAM deriva a neurología/psiquiatría/psicología · Salud Responde <b>600 360 7777</b> · crisis <b>*4141</b> (24h, gratis).</p></div>' +
    '</div>' +

    /* 2) PERFILES */
    '<div id="ndPerfiles" class="hidden">' +
    '<input type="search" id="ndQ" placeholder="🔍 Buscar perfil... ej: atención, lectura, sensorial, tics" style="display:block;width:100%;margin:0 0 10px;background:var(--card);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px">' +
    '<div class="discipline-grid" id="ndGrid">' + perfHTML + '</div></div>' +

    /* 3) APOYOS */
    '<div id="ndApoyos" class="hidden">' +
    '<div class="si-card"><h4>🧰 Apoyos que sí sirven (casa, escuela, trabajo)</h4><p>Elige 1 y pruébalo 7 días. Lo que funciona se queda en <b>Mi plan</b>.</p></div>' +
    apoyosHTML + '</div>' +

    /* 4) TESTS */
    '<div id="ndTests" class="hidden">' +
    '<div class="si-card"><h4>📝 Screenings breves (orientativos, no diagnóstico)</h4><p>Piensa en los <b>últimos 6 meses</b> (TDAH) o <b>últimas semanas</b> (autismo). Si el resultado es medio/alto, lleva ejemplos concretos a tu CESFAM o PIE. Nada sale de este dispositivo.</p></div>' +
    testsHTML +
    '<div class="menstrual-card"><h4>📊 Mi historial</h4><div id="ndHist" class="habits-list" style="max-height:200px"></div><div class="dlg-actions" style="justify-content:flex-end;margin-top:8px"><button type="button" id="ndTestsClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar mis screenings</button></div></div>' +
    '</div>' +

    /* 5) MI PLAN */
    '<div id="ndPlan" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌈 Mi tarjeta de acceso</h4>' +
    '<p class="muted" style="font-size:11px;margin:6px 0 4px">Lo que me sobrecarga (marca):</p>' +
    '<div style="display:flex;flex-wrap:wrap">' + sensChips + '</div>' +
    '<p class="muted" style="font-size:11px;margin:6px 0 4px">Mis fortalezas (marca):</p>' +
    '<div style="display:flex;flex-wrap:wrap">' + fortChips + '</div>' +
    '<div class="conv-row" style="margin-top:8px"><label>Sobrecarga hoy 1-10 <input type="range" id="ndSob" min="1" max="10" value="4" style="width:100%"></label><span id="ndSobV" class="chip" style="min-width:44px;text-align:center">4</span></div>' +
    '<div class="conv-row"><label>Señales de que me saturo <input type="text" id="ndSenales" placeholder="ej: me tapo oídos, me pongo irritable" maxlength="120"></label>' +
    '<label>Lo que me calma <input type="text" id="ndCalma" placeholder="ej: audífonos + rincón oscuro 10 min" maxlength="120"></label></div>' +
    '<div class="conv-row"><label>Persona apoyo <input type="text" id="ndApoyo" placeholder="ej: mamá 9xxxxxxx, profe jefe" maxlength="80"></label>' +
    '<label>Mi frase para pedir pausa <input type="text" id="ndFrase" placeholder="ej: necesito 5 min fuera, vuelvo" maxlength="80"></label></div>' +
    '<label>Mi rutina que funciona <textarea id="ndRutina" rows="2" placeholder="ej: llego, audífonos, lista de 3, temporizador 20 min..." maxlength="300"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="ndSave" class="btn btn-accent" style="width:auto">💾 Guardar mi plan</button>' +
    '<button type="button" id="ndToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span class="muted" style="font-size:11px">Tu tarjeta queda privada y local.</span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="ndShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="ndExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="ndClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar plan</button></span></div>' +
    '<div id="ndView" style="margin-top:8px"></div></div>' +
    '</div>';

  makeDialog('neurodiversidadDialog', '🌈 Neurodiversidad',
    'Cerebros distintos, mismos derechos: <b>perfiles + apoyos + tests breves + mi tarjeta de acceso</b>. Elige subsección arriba. Todo queda <b>privado y local</b>. <b>Educativo: no diagnostica.</b> Crisis: <b>*4141</b> (24h Chile).',
    body);
}

/* ---------------- RENDER ---------------- */
function ndTests() {
  return (psi().tests || []).filter(function (r) { return r.tipo === 'aq10' || r.tipo === 'asrs6'; });
}
function renderNdTop() {
  var b = $('ndTop'); if (!b) return;
  var t = ndTests().length;
  var p = (psi().neuro || {}).perfil || {};
  b.innerHTML = '<b>🌈 Tu espacio neuro:</b> <b>' + ND_PERFILES.length + '</b> perfiles · <b>' + ND_APOYOS.length + '</b> apoyos · <b>' + t + '</b> screenings' +
    (p.guardado ? ' · ✅ tarjeta lista (' + esc(p.fecha || '') + ')' : ' · ○ sin tarjeta aún') +
    '<span class="muted" style="font-size:11px"> — cada subsección es corta: avanza por pestañas</span>';
}
function renderNdHist() {
  var box = $('ndHist'); if (!box) return;
  var t = ndTests().slice().reverse().slice(0, 10);
  box.innerHTML = t.length ? t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · ' + esc(r.nombre) + ': <b>' + esc(String(r.puntaje)) + '</b> — ' + esc(r.nivel) + '</span>' +
      '<button type="button" class="btn btn-icon nd-tdel" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin screenings aún. Responde uno arriba: solo orienta, no diagnostica.</p>';
  box.querySelectorAll('.nd-tdel').forEach(function (x) {
    x.onclick = function () { var e = psi(); e.tests = (e.tests || []).filter(function (r) { return r.id !== x.dataset.k; }); save(); renderNdTop(); renderNdHist(); };
  });
}
function renderNdPlan() {
  var view = $('ndView'); if (!view) return;
  var p = (psi().neuro || {}).perfil || {};
  if (!p.guardado) { view.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin plan aún. Marca y guarda arriba: será tu tarjeta para mostrar a familia, escuela o trabajo.</p>'; return; }
  view.innerHTML = '<div class="si-card" style="border-color:var(--gold)"><h4>🌈 Mi tarjeta de acceso · ' + esc(p.fecha || '') + '</h4>' +
    '<p><b>Me sobrecarga:</b> ' + esc((p.sens || []).join(', ') || '—') + ' · hoy ' + esc(String(p.sobrecarga == null ? '-' : p.sobrecarga)) + '/10</p>' +
    '<p><b>Mis fortalezas:</b> ' + esc((p.forts || []).join(', ') || '—') + '</p>' +
    (p.senales ? '<p><b>Señales de saturación:</b> ' + esc(p.senales) + '</p>' : '') +
    (p.calma ? '<p><b>Me calma:</b> ' + esc(p.calma) + '</p>' : '') +
    (p.apoyo ? '<p><b>Persona apoyo:</b> ' + esc(p.apoyo) + '</p>' : '') +
    (p.frase ? '<p><b>Mi frase de pausa:</b> "' + esc(p.frase) + '"</p>' : '') +
    (p.rutina ? '<p><b>Rutina que funciona:</b> ' + esc(p.rutina) + '</p>' : '') + '</div>';
  try {
    var sens = p.sens || [];
    document.querySelectorAll('.nd-sens').forEach(function (x) { x.checked = sens.indexOf(x.value) >= 0; });
    var forts = p.forts || [];
    document.querySelectorAll('.nd-fort').forEach(function (x) { x.checked = forts.indexOf(x.value) >= 0; });
    if ($('ndSob')) { $('ndSob').value = p.sobrecarga == null ? 4 : p.sobrecarga; }
    if ($('ndSobV')) { $('ndSobV').textContent = $('ndSob').value; }
    if ($('ndSenales')) $('ndSenales').value = p.senales || '';
    if ($('ndCalma')) $('ndCalma').value = p.calma || '';
    if ($('ndApoyo')) $('ndApoyo').value = p.apoyo || '';
    if ($('ndFrase')) $('ndFrase').value = p.frase || '';
    if ($('ndRutina')) $('ndRutina').value = p.rutina || '';
  } catch (e) {}
}
function calcNdTest(def) {
  var vals = [];
  for (var j = 0; j < def.items.length; j++) {
    var sel = document.querySelector('input[name="t_' + def.id + '_' + j + '"]:checked');
    if (!sel) return { ok: false };
    vals.push(+sel.value);
  }
  var t = vals.reduce(function (a, b) { return a + b; }, 0);
  return { ok: true, puntaje: t, nivel: def.interp(t), vals: vals };
}
function ndRefresh() { renderNdTop(); renderNdHist(); renderNdPlan(); }

/* ---------------- SETUP ---------------- */
function placeButton(btn) {
  try {
    var ref = $('btnPsicologia');
    if (ref && ref.parentNode) { ref.parentNode.insertBefore(btn, ref.nextSibling); return; }
    var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
    if (g) g.appendChild(btn);
  } catch (e) {}
}
function setup() {
  /* 1) boton al lado de Psicologia (Linaje > Interior) */
  try {
    if (!$('btnNeurodiversidad')) {
      var btn = document.createElement('button');
      btn.id = 'btnNeurodiversidad'; btn.className = 'btn'; btn.type = 'button';
      btn.textContent = '🌈 Neurodiversidad';
      try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
      btn.setAttribute('data-keywords', 'neurodiversidad neurodivergente autismo tea tdah dislexia discalculia disgrafia sensorial tourette tics dispraxia altas capacidades aq asrs pie inclusion apoyos tarjeta acceso ley tea meltdown shutdown stimming');
      placeButton(btn);
    } else {
      try {
        var cur = $('btnNeurodiversidad');
        var gp = cur.closest ? cur.closest('.action-group') : null;
        var gn = gp && gp.getAttribute ? gp.getAttribute('data-group') : null;
        if (gn && gn !== 'linaje') placeButton(cur);
        else placeButton(cur);
        try { cur.setAttribute('data-sub', 'interior'); } catch (eS) {}
      } catch (eM) {}
    }
  } catch (e) {}
  /* reintento de posicion por si Psicologia cargo despues */
  try { setTimeout(function () { var b = $('btnNeurodiversidad'); if (b) placeButton(b); }, 1500); } catch (e) {}
  /* 2) registrar en ALL_BTNS + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnNeurodiversidad') < 0) ALL_BTNS.push('btnNeurodiversidad');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnNeurodiversidad = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Linaje) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnNeurodiversidad"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Linaje') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnNeurodiversidad"> 🌈 Neurodiversidad';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnNeurodiversidad !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnNeurodiversidad = lab.querySelector('input').checked;
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

  /* 4) dialogo + renders */
  buildNdDialog();
  ndRefresh();

  var b = $('btnNeurodiversidad');
  if (b) b.onclick = function () { ndRefresh(); switchNdTab('Guia'); openDlg('neurodiversidadDialog'); };

  ND_TABS.forEach(function (t) {
    var tb = $('tabNd' + t);
    if (tb) tb.onclick = function () { switchNdTab(t); };
  });

  var q = $('ndQ');
  if (q) q.oninput = function () {
    var s = (q.value || '').toLowerCase().trim();
    document.querySelectorAll('.nd-card').forEach(function (card) {
      card.style.display = (!s || (card.dataset.q || '').indexOf(s) >= 0) ? '' : 'none';
    });
  };

  var sob = $('ndSob'), sobV = $('ndSobV');
  if (sob) sob.oninput = function () { if (sobV) sobV.textContent = sob.value; };

  document.querySelectorAll('.nd-tcalc').forEach(function (btn2) {
    btn2.onclick = function () {
      var def = ND_TESTS.filter(function (t) { return t.id === btn2.dataset.test; })[0];
      if (!def) return;
      var r = calcNdTest(def);
      var box = $('res_' + def.id);
      if (!r.ok) { if (box) box.innerHTML = '<p class="muted" style="font-size:12px">Responde todas las preguntas para ver tu resultado.</p>'; return; }
      if (box) box.innerHTML = '<div class="si-card" style="border-color:var(--gold)"><h4>Resultado: ' + esc(String(r.puntaje)) + '</h4><p>' + esc(r.nivel) + '</p><p class="muted" style="font-size:11px">Educativo, no diagnóstico. Si te preocupa, conversa con alguien de confianza o pide hora en tu CESFAM.</p></div>';
      var e = psi();
      e.tests.push({ id: uid('pt'), fecha: todayKey(), tipo: def.id, nombre: def.nombre, puntaje: r.puntaje, nivel: r.nivel, respuestas: r.vals || [] });
      save('Test guardado ✓'); ndRefresh();
    };
  });
  document.querySelectorAll('.nd-treset').forEach(function (btn2) {
    btn2.onclick = function () {
      document.querySelectorAll('input[name^="t_' + btn2.dataset.test + '_"]').forEach(function (x) { x.checked = false; });
      var box = $('res_' + btn2.dataset.test); if (box) box.innerHTML = '';
    };
  });

  var tc = $('ndTestsClear');
  if (tc) tc.onclick = function () {
    if (!confirm('¿Borrar tus screenings de neurodiversidad (AQ-10 y ASRS-6)?')) return;
    var e = psi();
    e.tests = (e.tests || []).filter(function (r) { return r.tipo !== 'aq10' && r.tipo !== 'asrs6'; });
    save(); ndRefresh();
  };

  var sv = $('ndSave');
  if (sv) sv.onclick = function () {
    var sens = Array.prototype.map.call(document.querySelectorAll('.nd-sens:checked'), function (x) { return x.value; });
    var forts = Array.prototype.map.call(document.querySelectorAll('.nd-fort:checked'), function (x) { return x.value; });
    var e = psi();
    e.neuro.perfil = {
      guardado: true,
      fecha: todayKey(),
      sens: sens,
      forts: forts,
      sobrecarga: +($('ndSob') ? $('ndSob').value : 4),
      senales: clean((($('ndSenales') || {}).value || '').trim(), 120),
      calma: clean((($('ndCalma') || {}).value || '').trim(), 120),
      apoyo: clean((($('ndApoyo') || {}).value || '').trim(), 80),
      frase: clean((($('ndFrase') || {}).value || '').trim(), 80),
      rutina: clean((($('ndRutina') || {}).value || '').trim(), 300)
    };
    save('Mi plan guardado ✓');
    ndRefresh();
  };

  var tn = $('ndToNote');
  if (tn) tn.onclick = function () {
    var p = (psi().neuro || {}).perfil || {};
    var txt = p.guardado
      ? ('🌈 Mi tarjeta (' + (p.fecha || '') + '): sobrecarga ' + (p.sens || []).join(', ') + ' · calma: ' + (p.calma || '-') + ' · frase: "' + (p.frase || '-') + '"')
      : '🌈 Mi tarjeta de acceso neurodivergente';
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt.slice(0, 280); }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt.slice(0, 280); }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };

  var sh = $('ndShare');
  if (sh) sh.onclick = async function () {
    var p = (psi().neuro || {}).perfil || {};
    if (!p.guardado) return alert('Guarda tu plan primero');
    var t = '🌈 Mi tarjeta de acceso (' + (p.fecha || '') + ')\n' +
      'Me sobrecarga: ' + (p.sens || []).join(', ') + ' (hoy ' + p.sobrecarga + '/10)\n' +
      'Fortalezas: ' + (p.forts || []).join(', ') + '\n' +
      (p.senales ? 'Señales: ' + p.senales + '\n' : '') +
      (p.calma ? 'Me calma: ' + p.calma + '\n' : '') +
      (p.apoyo ? 'Persona apoyo: ' + p.apoyo + '\n' : '') +
      (p.frase ? 'Frase de pausa: "' + p.frase + '"\n' : '') +
      (p.rutina ? 'Rutina: ' + p.rutina : '');
    await share('Mi tarjeta de acceso', t);
  };
  var ex = $('ndExport');
  if (ex) ex.onclick = async function () {
    var e = psi();
    var p = (e.neuro || {}).perfil || {};
    var t = '🌈 NEURODIVERSIDAD — exportación ' + todayKey() + '\n\nSCREENINGS\n' +
      ndTests().map(function (r) { return r.fecha + ' | ' + r.nombre + ' | ' + r.puntaje + ' | ' + r.nivel; }).join('\n') +
      '\n\nMI TARJETA\n' + (p.guardado ? ('Fecha: ' + (p.fecha || '') + '\nSobrecarga: ' + (p.sens || []).join(', ') + ' (' + p.sobrecarga + '/10)\nFortalezas: ' + (p.forts || []).join(', ') + '\nSeñales: ' + (p.senales || '-') + '\nCalma: ' + (p.calma || '-') + '\nApoyo: ' + (p.apoyo || '-') + '\nFrase: ' + (p.frase || '-') + '\nRutina: ' + (p.rutina || '-')) : 'Sin plan guardado');
    await share('Exportar neurodiversidad', t);
  };
  var cl = $('ndClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu tarjeta de acceso?')) return;
    try { var u = userData(); u.psicologia.neuro.perfil = {}; } catch (e) {}
    save(); ndRefresh();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 600); });
else setTimeout(setup, 600);

})();
