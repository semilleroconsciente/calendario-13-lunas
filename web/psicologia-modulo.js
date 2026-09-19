/* ============================================================
   PSICOLOGIA — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnPsicologia (grupo Mente & Estudio, inyectado)
   - Dialogo psicologiaDialog con 5 pestanas:
     1) Guia (que es, ramas, mitos, cuando pedir ayuda, recursos Chile)
     2) Escuelas (10 fichas + buscador)
     3) Herramientas (registro TCC interactivo + 7 tecnicas)
     4) Tests (PHQ-4, estres PSS-4, autoestima, Big Five breve)
     5) Mi proceso (chequeo diario animo/energia, diario, racha)
   - Todo local y privado por usuario: userData().psicologia
     { checks:{}, tests:[], tcc:[] }
   - Educativo: NO diagnostica, NO reemplaza terapia.
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
    if (!u) return { checks: {}, tests: [], tcc: [] };
    if (!u.psicologia) u.psicologia = { checks: {}, tests: [], tcc: [] };
    var e = u.psicologia;
    if (!e.checks) e.checks = {};
    if (!Array.isArray(e.tests)) e.tests = [];
    if (!Array.isArray(e.tcc)) e.tcc = [];
    return e;
  } catch (e2) { return { checks: {}, tests: [], tcc: [] }; }
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

/* ---------------- DATOS ---------------- */
var EMOCIONES = ['alegría', 'calma', 'gratitud', 'amor', 'esperanza', 'tristeza', 'rabia', 'miedo', 'ansiedad', 'culpa', 'vergüenza', 'soledad'];

var ESCUELAS = [
  { n: 'Psicoanálisis (Freud)', ico: '🛋️', tag: 'profundidad inconsciente', idea: 'El inconsciente gobierna: ello, yo y superyó. Lapsus, sueños y síntomas son mensajes cifrados de deseos y conflictos infantiles.', sirve: 'Patrones que se repiten, sueños intensos, actos fallidos, duelos no elaborados.', practica: '5 min de escritura libre sin filtro. Subraya 3 palabras con carga y pregúntate qué deseo o miedo esconden.', cuidado: 'Puede remover material fuerte: hazlo con calma y pide ayuda si te sobrepasa.' },
  { n: 'Conductismo', ico: '🔔', tag: 'conducta aprendizaje', idea: 'La conducta se aprende y se desaprende: condicionamiento clásico y operante. Cambia el ambiente y el refuerzo, cambia el hábito.', sirve: 'Hábitos, fobias leves, procrastinación, rutinas.', practica: 'Elige 1 conducta meta. Define disparador + acción mínima + recompensa inmediata. Repite 7 días.', cuidado: 'No explica todo lo interno, pero es muy eficaz para conductas concretas.' },
  { n: 'TCC · Terapia cognitivo-conductual', ico: '🧠', tag: 'pensamiento evidencia', idea: 'Tus emociones siguen a tus interpretaciones. Detecta el pensamiento automático, examina la evidencia y reescribe una versión realista.', sirve: 'Ansiedad, rumiación, catastrofismo, autoexigencia, bajo ánimo.', practica: 'Usa el Registro TCC de la pestaña Herramientas con algo de hoy (3 columnas + reencuadre).', cuidado: 'Si el malestar es intenso o persistente (>2 semanas), consulta profesional.' },
  { n: 'Humanista (Rogers · Maslow)', ico: '🌻', tag: 'persona aceptacion', idea: 'Tendencia innata a crecer si hay aceptación, empatía y congruencia. El problema no eres tú: es la falta de un espacio seguro.', sirve: 'Autoestima, autenticidad, decisiones vitales, bloqueo creativo.', practica: 'Escríbete 5 min como tu mejor amiga/o: sin juicio, con calidez. ¿Qué necesitas realmente?', cuidado: '' },
  { n: 'Gestalt (Perls)', ico: '🪑', tag: 'presente cuerpo', idea: 'Conciencia del aquí y ahora: cuerpo, emoción y asuntos pendientes. Lo no cerrado insiste hasta cerrarse.', sirve: 'Conflictos con otros, decisiones atascadas, tensión corporal.', practica: 'Silla vacía: 2 min hablas tú, 2 min respondes como la otra parte. Cierra con tu necesidad en 1 frase.', cuidado: '' },
  { n: 'Sistémica / Vínculos', ico: '🕸️', tag: 'familia pareja patrones', idea: 'El síntoma vive en el sistema: roles, lealtades y reglas invisibles de familia y pareja. Cambia un eslabón y se mueve todo.', sirve: 'Conflictos de pareja/familia, roles que se repiten, límites.', practica: 'Dibuja tu círculo cercano. Marca quién da, quién exige, dónde te sobrecargas. Elige 1 límite concreto esta semana.', cuidado: '' },
  { n: 'Logoterapia (Frankl)', ico: '🔥', tag: 'sentido proposito', idea: 'El motor humano es el sentido: quien tiene un porqué soporta casi cualquier cómo. Hasta el dolor inevitable puede volverse tarea.', sirve: 'Vacío, desánimo, crisis de sentido, duelo.', practica: 'Escribe tu para qué de esta semana en 1 frase. Convierte 1 dolor en 1 tarea concreta mínima.', cuidado: '' },
  { n: 'ACT · Aceptación y compromiso', ico: '🌊', tag: 'valores defusion', idea: 'No pelees con tus pensamientos: obsérvalos pasar (defusión) y actúa según tus valores aunque haya malestar.', sirve: 'Rumiación, evitación, ansiedad social leve, perfeccionismo.', practica: 'Nombra: "estoy teniendo el pensamiento de que...". Luego 1 acción de 10 min alineada a tu valor (cuidar, crear, conectar).', cuidado: '' },
  { n: 'DBT · Regulación emocional (Linehan)', ico: '🧭', tag: 'emociones tolerancia', idea: 'Habilidades para olas emocionales intensas: tolerar el malestar, regular la emoción y pedir lo que necesitas (DEAR).', sirve: 'Emociones muy intensas, impulsividad, conflictos.', practica: 'TIPP 2 min: agua fría en la cara + respiración lenta + caminar. Después describe la emoción en 1 frase sin actuarla.', cuidado: 'Si hay autolesión o ideas suicidas, pide ayuda ahora: *4141 (Chile 24h).' },
  { n: 'Neuropsicología / Hábitos cerebrales', ico: '🧬', tag: 'cerebro sueño estres', idea: 'Tu cerebro es plástico: sueño, movimiento, luz y repetición lo remodelan. Sin base biológica no hay terapia que sostenga.', sirve: 'Niebla mental, irritabilidad, insomnio, baja energía.', practica: 'Base 3-2-1: 30 min de luz día + 20 min caminar + acostarte 1 h antes 3 noches. Mide tu ánimo.', cuidado: 'Descarta causa médica (tiroides, anemia, fármacos) si el bajón es nuevo y fuerte.' }
];

var HERRAMIENTAS = [
  { n: 'Registro TCC (3 columnas + reencuadre)', ico: '🧠', pasos: '1) Situación concreta de hoy. 2) Pensamiento automático + emoción 0-100. 3) Distorsión (todo/nada, catastrofismo, lectura mental, "debo"). 4) Pensamiento alternativo realista con evidencia. 5) Re-mide la emoción.', tip: 'Está arriba: el formulario interactivo guarda tu registro en Mi proceso.' },
  { n: 'Parada + reencuadre 90 segundos', ico: '🛑', pasos: '1) Detecta el bucle ("otra vez lo mismo"). 2) Di STOP en voz baja + 3 respiraciones 4-6. 3) Pregunta: ¿qué evidencia tengo? ¿qué le diría a un amigo? 4) Elige la próxima micro-acción.', tip: 'Funciona mejor si lo practicas con calma primero, no solo en crisis.' },
  { n: 'Activación conductual (contra el bajón)', ico: '🚶', pasos: '1) Lista 3 placeres pequeños + 3 deberes pequeños. 2) Agenda 1+1 para mañana con hora. 3) Hazlo aunque el ánimo esté en 3/10: la acción precede a la motivación.', tip: 'El ánimo sigue a la acción, no al revés. Empieza ridículamente pequeño.' },
  { n: 'Autocompasión (Neff): 3 frases', ico: '💗', pasos: '1) Mindfulness: "esto duele ahora". 2) Humanidad: "no soy la única persona que siente esto". 3) Amabilidad: "¿qué necesito y cómo me lo doy hoy?".', tip: 'No es autoindulgencia: es tratarte como tratarías a quien quieres.' },
  { n: 'Asertividad: mensaje YO + DEAR', ico: '🗣️', pasos: 'YO: "Cuando ___, me siento ___, necesito ___, ¿podemos ___?". DEAR para pedir: Describe, Expresa, Aclara, Refuerza. Sin gritos ni ley del hielo.', tip: 'Pide 1 cosa concreta esta semana. Lo vago ("respétame") no se puede cumplir.' },
  { n: 'Higiene del sueño (base de todo)', ico: '😴', pasos: '1) Misma hora ±30 min. 2) Sin pantallas 45 min antes + pieza oscura y fresca. 3) Si no duermes en 20 min, levántate a leer tenue y vuelve. 4) Sol de mañana + sin cafeína tras 14:00.', tip: '2 semanas de mal dormir imitan una depresión. Cuida esto primero.' },
  { n: 'Exposición gradual (miedos evitativos)', ico: '🪜', pasos: '1) Escala tu miedo en 6 peldaños (0=trivial, 100=pánico). 2) Empieza en 20-30 y quédate hasta que baje a la mitad. 3) Sube 1 peldaño por vez, sin saltos.', tip: 'Evitar alimenta el miedo. Acercarte de a poco lo desinfla.' },
  { n: 'Primeros auxilios psicológicos', ico: '🆘', pasos: '1) Contener: estoy aquí, respira conmigo. 2) Validar: tiene sentido que sientas esto. 3) Básico: agua, abrigo, sentarse. 4) No presiones a contar: ofrece presencia + derivación (*4141 / CESFAM).', tip: 'Para acompañar a otra persona en crisis, no para reemplazar ayuda profesional.' }
];

var TESTS = [
  { id: 'phq4', ico: '🌧️', nombre: 'Ánimo (PHQ-4)', desc: '4 preguntas sobre las últimas 2 semanas: nerviosismo, preocupación, poco interés y desánimo. Screening educativo, no diagnóstico.',
    items: ['Sentirme nervioso/a o con los nervios de punta', 'No poder parar o controlar la preocupación', 'Poco interés o placer en hacer las cosas', 'Sentirme desanimado/a o con pocas esperanzas'],
    opts: ['Nunca (0)', 'Varios días (1)', 'Más de la mitad (2)', 'Casi todos los días (3)'],
    interp: function (t) { return t <= 2 ? 'Mínimo: sigue cuidándote y observa.' : t <= 5 ? 'Leve: activa autocuidado + 1 herramienta diaria esta semana.' : t <= 8 ? 'Moderado: conversa con alguien de confianza y considera hora de salud mental en tu CESFAM.' : 'Alto: pide apoyo profesional pronto (CESFAM / *4141 si hay crisis). No estás sola/o.'; } },
  { id: 'pss4', ico: '🔥', nombre: 'Estrés (PSS-4)', desc: '4 preguntas sobre el último mes: control, confianza, carga y dificultades acumuladas.',
    items: ['Sentí que no podía controlar lo importante de mi vida', 'Me sentí con confianza para manejar mis problemas (invertida: Siempre=0)', 'Sentí que las cosas iban a mi manera (invertida: Siempre=0)', 'Sentí que las dificultades se acumulaban sin poder superarlas'],
    opts: ['Nunca (0)', 'Casi nunca (1)', 'A veces (2)', 'A menudo (3)', 'Siempre (4)'],
    inv: [1, 2],
    interp: function (t) { return t <= 5 ? 'Bajo: buen momento para consolidar hábitos protectores.' : t <= 9 ? 'Moderado: suma pausas, sueño y 1 límite esta semana.' : 'Alto: reduce carga + pide apoyo. Si interfiere con tu vida diaria, consulta.'; } },
  { id: 'ros5', ico: '🌻', nombre: 'Autoestima (breve)', desc: '5 afirmaciones sobre cómo te ves a ti misma/o. Versión educativa breve de Rosenberg.',
    items: ['Siento que soy una persona valiosa', 'Tengo varias cualidades buenas', 'Puedo hacer las cosas tan bien como los demás', 'A veces me siento inútil (invertida)', 'A veces pienso que no sirvo para nada (invertida)'],
    opts: ['Muy en desacuerdo (0)', 'En desacuerdo (1)', 'De acuerdo (2)', 'Muy de acuerdo (3)'],
    inv: [3, 4],
    interp: function (t) { return t <= 7 ? 'Baja ahora: trabaja autocompasión + registra 1 logro diario. Si es persistente, apóyate en terapia.' : t <= 11 ? 'Media: normal con altibajos. Refuerza fortalezas y límites.' : 'Alta: buen colchón interno. Úsalo para sostener a otros también.'; } },
  { id: 'bf10', ico: '🧬', nombre: 'Personalidad (Big Five breve)', desc: '10 frases 1-5. Mide 5 rasgos: Apertura, Responsabilidad, Extraversión, Amabilidad y Estabilidad. Sin puntaje bueno/malo: es tu estilo.',
    items: ['Me veo como alguien abierto a experiencias nuevas', 'Me veo como alguien ordenado y responsable', 'Me veo como alguien sociable y con energía', 'Me veo como alguien amable y que confía', 'Me veo como alguien que se mantiene calmado bajo presión', 'Me veo como alguien rutinario, poco curioso (inv)', 'Me veo como alguien flojo o que deja todo a medias (inv)', 'Me veo como alguien reservado o callado (inv)', 'Me veo como alguien crítico con los demás (inv)', 'Me veo como alguien que se pone nervioso fácil (inv)'],
    opts: ['1 · Muy en desacuerdo', '2', '3 · Neutral', '4', '5 · Muy de acuerdo'],
    bigfive: true,
    interp: function () { return 'Lee tu perfil por rasgo: cada polo tiene fortalezas y costos. Úsalo para elegir hábitos que te calcen, no para etiquetarte.'; } }
];

/* ---------------- DIALOGO ---------------- */
function switchTab(name) {
  ['Guia', 'Escuelas', 'Herr', 'Tests', 'Proceso'].forEach(function (t) {
    var p = $('psi2' + t), b = $('tabPsi2' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function buildDialog() {
  var escuelasHTML = ESCUELAS.map(function (e, i) {
    return '<div class="discipline-card psi-esc" data-q="' + esc((e.n + ' ' + e.tag + ' ' + e.idea).toLowerCase()) + '">' +
      '<h4>' + e.ico + ' ' + esc(e.n) + '</h4><p><b>Idea:</b> ' + esc(e.idea) + '</p>' +
      '<p><b>Sirve para:</b> ' + esc(e.sirve) + '</p><p><b>Práctica 5 min:</b> ' + esc(e.practica) + '</p>' +
      (e.cuidado ? '<p class="muted">⚠️ ' + esc(e.cuidado) + '</p>' : '') + '</div>';
  }).join('');

  var herrHTML = HERRAMIENTAS.map(function (h) {
    return '<div class="si-card"><h4>' + h.ico + ' ' + esc(h.n) + '</h4><p>' + esc(h.pasos) + '</p><p class="muted">💡 ' + esc(h.tip) + '</p></div>';
  }).join('');

  var testsHTML = TESTS.map(function (t, i) {
    var itemsHTML = t.items.map(function (q, j) {
      var opts = t.opts.map(function (o, v) {
        return '<label style="display:flex;gap:6px;align-items:center;font-size:12px;margin:3px 0;color:var(--text)"><input type="radio" name="t_' + t.id + '_' + j + '" value="' + v + '" style="accent-color:var(--gold)"> ' + esc(o) + '</label>';
      }).join('');
      return '<div class="si-card" style="margin-bottom:8px"><p style="margin-bottom:6px"><b>' + (j + 1) + '.</b> ' + esc(q) + '</p>' + opts + '</div>';
    }).join('');
    return '<div class="menstrual-card" style="margin-bottom:10px"><h4>' + t.ico + ' ' + esc(t.nombre) + '</h4>' +
      '<p class="muted" style="font-size:11px">' + esc(t.desc) + '</p>' + itemsHTML +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      '<button type="button" class="btn btn-accent psi-tcalc" data-test="' + t.id + '" style="width:auto">Ver mi resultado</button>' +
      '<button type="button" class="btn psi-treset" data-test="' + t.id + '" style="width:auto">Limpiar</button></div>' +
      '<div id="res_' + t.id + '" style="margin-top:8px"></div></div>';
  }).join('');

  var emoChips = EMOCIONES.map(function (e) {
    return '<label class="check-row" style="margin:2px 8px 2px 0;font-size:12px"><input type="checkbox" class="psi-emo" value="' + esc(e) + '"> ' + esc(e) + '</label>';
  }).join('');

  var body =
    '<div class="timer-tabs" style="margin:12px 0 10px;flex-wrap:wrap">' +
    '<button type="button" id="tabPsi2Guia" class="btn btn-accent" style="width:auto">🧭 Guía</button>' +
    '<button type="button" id="tabPsi2Escuelas" class="btn" style="width:auto">🏫 Escuelas</button>' +
    '<button type="button" id="tabPsi2Herr" class="btn" style="width:auto">🧰 Herramientas</button>' +
    '<button type="button" id="tabPsi2Tests" class="btn" style="width:auto">📝 Tests</button>' +
    '<button type="button" id="tabPsi2Proceso" class="btn" style="width:auto">📓 Mi proceso</button></div>' +

    '<div id="psi2Streak" class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"></div>' +

    /* GUIA */
    '<div id="psi2Guia">' +
    '<div class="si-card"><h4>🧭 ¿Qué es la psicología?</h4><p>Ciencia que estudia cómo piensas, sientes y actúas —y cómo cambiarlo con método. No es "solo conversar": usa <b>evidencia, medición y práctica</b>. Esta sección es <b>educativa y preventiva</b>: te ordena, te da herramientas y te dice cuándo pedir ayuda profesional.</p></div>' +
    '<div class="discipline-grid">' +
    '<div class="discipline-card"><h4>🧬 Ramas principales</h4><p>• <b>Clínica:</b> ansiedad, depresión, trauma.<br>• <b>Educacional:</b> aprendizaje y crianza.<br>• <b>Laboral:</b> trabajo y equipos.<br>• <b>Comunitaria:</b> territorio y grupos.<br>• <b>Neuropsicología:</b> cerebro y conducta.<br>• <b>Deportiva:</b> rendimiento y foco.</p></div>' +
    '<div class="discipline-card"><h4>🚫 Mitos que frenan</h4><p>• "Ir al psicólogo es para locos" → es para quien quiere vivir mejor.<br>• "El tiempo lo cura todo" → lo cura el <b>trabajo</b> sobre lo que pasó.<br>• "Ser fuerte es aguantar solo" → pedir ayuda <b>es</b> fortaleza.<br>• "Un test de internet me diagnostica" → solo un profesional diagnostica.</p></div>' +
    '</div>' +
    '<div class="si-card" style="border-left:3px solid #e76e8a"><h4>🚨 ¿Cuándo pedir ayuda profesional?</h4><p>• Malestar intenso <b>más de 2 semanas</b> o que interfiere con dormir, comer, trabajar o vincularte.<br>• Crisis, autolesión o ideas de no querer vivir → <b>*4141 prevención del suicidio (Chile, 24h, gratis)</b>.<br>• En Penco: <b>CESFAM Penco</b> (hora salud mental), Salud Responde <b>600 360 7777</b>. Violencia: <b>1455</b> · Familia: <b>149</b>.</p></div>' +
    '<div class="si-card"><h4>🗺️ Cómo usar esta sección</h4><p>1) Lee la <b>Guía</b> una vez. 2) Explora 1 <b>Escuela</b> que te resuene. 3) Practica 1 <b>Herramienta</b> 5 min hoy. 4) Cada tanto haz un <b>Test</b> para verte en el tiempo. 5) Registra todo en <b>Mi proceso</b> y relee cada luna: los patrones se ven en el tiempo, no en un día.</p></div>' +
    '</div>' +

    /* ESCUELAS */
    '<div id="psi2Escuelas" class="hidden">' +
    '<input type="search" id="psiEscQ" placeholder="🔍 Buscar escuela... ej: ansiedad, sueños, hábitos" style="display:block;width:100%;margin:0 0 10px;background:var(--card);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:8px">' +
    '<div class="discipline-grid" id="psiEscGrid">' + escuelasHTML + '</div></div>' +

    /* HERRAMIENTAS */
    '<div id="psi2Herr" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px"><h4>🧠 Registro TCC rápido — pruébalo con algo de hoy</h4>' +
    '<div class="conv-row"><label>Situación <input type="text" id="tccSit" placeholder="ej: me corrigieron en el trabajo" maxlength="120"></label></div>' +
    '<div class="conv-row"><label>Pensamiento automático <input type="text" id="tccPen" placeholder="ej: soy un fracaso" maxlength="140"></label>' +
    '<label>Emoción 0-100 <input type="number" id="tccEmo" min="0" max="100" value="60"></label></div>' +
    '<div class="conv-row"><label>Distorsión <select id="tccDis"><option>todo o nada</option><option>catastrofismo</option><option>lectura mental</option><option>"debo / tengo que"</option><option>descalificar lo positivo</option><option>personalización</option></select></label></div>' +
    '<label>Pensamiento alternativo realista <input type="text" id="tccAlt" placeholder="ej: me corrigieron 1 punto de 10 que hago bien; puedo ajustar" maxlength="160"></label>' +
    '<div class="conv-row"><label>Emoción ahora 0-100 <input type="number" id="tccEmo2" min="0" max="100" value="40"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="tccSave" class="btn btn-accent" style="width:auto">💾 Guardar registro TCC</button></div></div>' +
    herrHTML + '</div>' +

    /* TESTS */
    '<div id="psi2Tests" class="hidden">' +
    '<div class="si-card"><h4>📝 Tests de autoconocimiento (screening educativo)</h4><p>No son diagnóstico: son un <b>termómetro</b> para verte en el tiempo. Responde pensando en las últimas 2 semanas (ánimo) o último mes (estrés). Si un resultado te preocupa, conversa con alguien de confianza o pide hora en tu CESFAM.</p></div>' +
    testsHTML +
    '<div class="menstrual-card"><h4>📊 Mi historial de tests</h4><div id="psiTestsHist" class="habits-list" style="max-height:200px"></div><div class="dlg-actions" style="justify-content:flex-end;margin-top:8px"><button type="button" id="psiTestsClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar tests</button></div></div>' +
    '</div>' +

    /* PROCESO */
    '<div id="psi2Proceso" class="hidden">' +
    '<div class="menstrual-card" style="margin-bottom:10px"><h4>💚 Chequeo de hoy — 1 minuto</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="psiFecha"></label></div>' +
    '<div class="conv-row" style="align-items:center"><label style="flex:1">Ánimo 1-10 <input type="range" id="psiAnimo" min="1" max="10" value="6" style="width:100%"></label><span id="psiAnimoV" class="chip" style="min-width:44px;text-align:center">6</span>' +
    '<label style="flex:1">Energía 1-10 <input type="range" id="psiEnergia" min="1" max="10" value="6" style="width:100%"></label><span id="psiEnergiaV" class="chip" style="min-width:44px;text-align:center">6</span></div>' +
    '<p class="muted" style="font-size:11px;margin:6px 0 4px">Emociones presentes (marca las que haya):</p>' +
    '<div style="display:flex;flex-wrap:wrap">' + emoChips + '</div>' +
    '<div class="conv-row" style="margin-top:8px"><label>¿Qué lo gatilló? <input type="text" id="psiMotivo" placeholder="ej: dormí mal, discusión, buena noticia" maxlength="100"></label>' +
    '<label>¿Qué me ayuda? <input type="text" id="psiAyuda" placeholder="ej: caminar, llamar a mi hermana" maxlength="100"></label></div>' +
    '<label>Diario (5 líneas bastan) <textarea id="psiNota" rows="3" placeholder="Hoy noté que... / Me di cuenta de... / Mañana quiero..." maxlength="600"></textarea></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="psiCheckSave" class="btn btn-accent" style="width:auto">💾 Guardar chequeo</button>' +
    '<button type="button" id="psiToNote" class="btn" style="width:auto">📝 Llevar a nota de hoy</button></div></div>' +
    '<div class="menstrual-card"><h4>📓 Mi diario (últimos 15)</h4><div id="psiLog" class="habits-list" style="max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="psiStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="psiShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="psiExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="psiClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '</div>';

  makeDialog('psicologiaDialog', '🧠 Psicología',
    'Ciencia de la mente en fichas + herramientas + tests breves + diario. Elige pestaña y practica 5 minutos. Todo queda <b>privado y local</b>. <b>Educativo: no diagnostica ni reemplaza terapia.</b> Crisis: <b>*4141</b> (24h Chile).',
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
  var b = $('psi2Streak'); if (!b) return;
  var e = store();
  var n = Object.keys(e.checks || {}).length;
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
  b.innerHTML = '<b>🧠 Racha:</b> ' + streak() + ' días seguidos · <b>' + n + '</b> chequeos · <b>' + nt + '</b> tests' + avg +
    '<span class="muted" style="font-size:11px"> — relee cada luna para ver patrones</span>';
}
function renderLog() {
  var box = $('psiLog'); if (!box) return;
  var c = store().checks;
  var keys = Object.keys(c).sort().reverse().slice(0, 15);
  box.innerHTML = keys.length ? keys.map(function (k) {
    var d = c[k] || {};
    var emos = (d.emociones || []).join(', ');
    return '<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>' + esc(k) + '</b> · ánimo ' + esc(String(d.animo || '-')) + '/10 · energía ' + esc(String(d.energia || '-')) + '/10' +
      (emos ? '<br>Emociones: ' + esc(emos) : '') +
      (d.motivo ? '<br>Gatilló: ' + esc(d.motivo) : '') +
      (d.ayuda ? '<br>Ayuda: ' + esc(d.ayuda) : '') +
      (d.nota ? '<br>' + esc(d.nota) : '') + '</span>' +
      '<button type="button" class="btn btn-icon psi-daydel" data-k="' + esc(k) + '">✕</button></div>';
  }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin chequeos. Guarda el primero arriba: 1 minuto.</p>';
  box.querySelectorAll('.psi-daydel').forEach(function (x) {
    x.onclick = function () { var e = store(); delete e.checks[x.dataset.k]; save(); renderStreak(); renderLog(); };
  });
  var st = $('psiStats'); if (st) st.textContent = keys.length ? Object.keys(c).length + ' día(s) registrados' : '';
}
function renderTestsHist() {
  var box = $('psiTestsHist'); if (!box) return;
  var t = (store().tests || []).slice().reverse().slice(0, 12);
  box.innerHTML = t.length ? t.map(function (r) {
    return '<div class="hora-item"><span style="font-size:11px"><b>' + esc(r.fecha) + '</b> · ' + esc(r.nombre) + ': <b>' + esc(String(r.puntaje)) + '</b> — ' + esc(r.nivel) + '</span>' +
      '<button type="button" class="btn btn-icon psi-tdel" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin tests aún. Responde uno arriba.</p>';
  box.querySelectorAll('.psi-tdel').forEach(function (x) {
    x.onclick = function () { var e = store(); e.tests = (e.tests || []).filter(function (r) { return r.id !== x.dataset.k; }); save(); renderStreak(); renderTestsHist(); };
  });
}
function calcTest(def) {
  var vals = [];
  for (var j = 0; j < def.items.length; j++) {
    var sel = document.querySelector('input[name="t_' + def.id + '_' + j + '"]:checked');
    if (!sel) return { ok: false, contestadas: vals.length };
    var v = +sel.value;
    if (def.inv && def.inv.indexOf(j) >= 0) v = (def.opts.length - 1) - v;
    vals.push(v);
  }
  if (def.bigfive) {
    var rasgos = [['Apertura', [0, 5]], ['Responsabilidad', [1, 6]], ['Extraversión', [2, 7]], ['Amabilidad', [3, 8]], ['Estabilidad', [4, 9]]];
    var desc = rasgos.map(function (r) {
      var a = vals[r[1][0]], b = 6 - vals[r[1][1]];
      return r[0] + ' ' + ((a + b) / 2).toFixed(1) + '/5';
    }).join(' · ');
    return { ok: true, puntaje: 'perfil', nivel: desc, vals: vals };
  }
  var t = vals.reduce(function (a, b) { return a + b; }, 0);
  return { ok: true, puntaje: t, nivel: def.interp(t), vals: vals };
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) inyectar boton */
  try {
    if (!$('btnPsicologia')) {
      var g = document.querySelector('.action-group[data-group="mente"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnPsicologia'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🧠 Psicología';
        btn.setAttribute('data-keywords', 'psicologia mente ansiedad depresion estres autoestima test phq apego vinculo emociones tcc act dbt terapia trauma duelo autoayuda salud mental *4141');
        var ref = g.querySelector('#btnPsico');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnPsicologia') < 0) ALL_BTNS.push('btnPsicologia');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnPsicologia = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Mente) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnPsicologia"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Mente') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnPsicologia"> 🧠 Psicología';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnPsicologia !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnPsicologia = lab.querySelector('input').checked;
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
  try { addKw('btnPsico', 'psicologia test animo'); } catch (e2) {}

  /* 4) dialogo */
  buildDialog();
  renderStreak(); renderLog(); renderTestsHist();

  var b = $('btnPsicologia');
  if (b) b.onclick = function () {
    if ($('psiFecha') && !$('psiFecha').value) $('psiFecha').value = todayKey();
    renderStreak(); renderLog(); renderTestsHist();
    openDlg('psicologiaDialog');
  };

  ['Guia', 'Escuelas', 'Herr', 'Tests', 'Proceso'].forEach(function (t) {
    var tb = $('tabPsi2' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var q = $('psiEscQ');
  if (q) q.oninput = function () {
    var s = (q.value || '').toLowerCase().trim();
    document.querySelectorAll('.psi-esc').forEach(function (card) {
      card.style.display = (!s || (card.dataset.q || '').indexOf(s) >= 0) ? '' : 'none';
    });
  };

  var an = $('psiAnimo'), anv = $('psiAnimoV');
  if (an) an.oninput = function () { if (anv) anv.textContent = an.value; };
  var en = $('psiEnergia'), env = $('psiEnergiaV');
  if (en) en.oninput = function () { if (env) env.textContent = en.value; };

  var sv = $('psiCheckSave');
  if (sv) sv.onclick = function () {
    var k = ($('psiFecha') && $('psiFecha').value) || todayKey();
    var emos = Array.prototype.map.call(document.querySelectorAll('.psi-emo:checked'), function (x) { return x.value; });
    var e = store();
    e.checks[k] = {
      animo: +($('psiAnimo') ? $('psiAnimo').value : 5),
      energia: +($('psiEnergia') ? $('psiEnergia').value : 5),
      emociones: emos,
      motivo: clean((($('psiMotivo') || {}).value || '').trim(), 100),
      ayuda: clean((($('psiAyuda') || {}).value || '').trim(), 100),
      nota: clean((($('psiNota') || {}).value || '').trim(), 600)
    };
    save('Guardado ✓');
    if ($('psiNota')) $('psiNota').value = '';
    renderStreak(); renderLog();
  };

  var tcc = $('tccSave');
  if (tcc) tcc.onclick = function () {
    var sit = (($('tccSit') || {}).value || '').trim();
    var pen = (($('tccPen') || {}).value || '').trim();
    var alt = (($('tccAlt') || {}).value || '').trim();
    if (!sit || !pen) return alert('Escribe situación y pensamiento primero');
    var e = store();
    e.tcc.push({ id: uid('t'), fecha: todayKey(), sit: clean(sit, 120), pen: clean(pen, 140), emo: +($('tccEmo').value || 0), dis: ($('tccDis') || {}).value || '', alt: clean(alt, 160), emo2: +($('tccEmo2').value || 0) });
    var k = todayKey();
    var prev = (e.checks[k] && e.checks[k].nota) || '';
    e.checks[k] = e.checks[k] || { animo: 5, energia: 5, emociones: [], motivo: '', ayuda: '', nota: '' };
    e.checks[k].nota = (prev ? prev + '\n' : '') + '🧠 TCC: ' + sit + ' → "' + pen + '" → "' + (alt || 'sin reencuadre aún') + '"';
    save('Registro TCC guardado ✓');
    if ($('tccSit')) $('tccSit').value = '';
    if ($('tccPen')) $('tccPen').value = '';
    if ($('tccAlt')) $('tccAlt').value = '';
    renderStreak(); renderLog();
    switchTab('Proceso');
  };

  document.querySelectorAll('.psi-tcalc').forEach(function (btn2) {
    btn2.onclick = function () {
      var def = TESTS.filter(function (t) { return t.id === btn2.dataset.test; })[0];
      if (!def) return;
      var r = calcTest(def);
      var box = $('res_' + def.id);
      if (!r.ok) { if (box) box.innerHTML = '<p class="muted" style="font-size:12px">Responde todas las preguntas para ver tu resultado.</p>'; return; }
      var lvl = typeof r.puntaje === 'number' ? def.interp(r.puntaje) : r.nivel;
      if (box) box.innerHTML = '<div class="si-card" style="border-color:var(--gold)"><h4>Resultado: ' + esc(String(r.puntaje)) + '</h4><p>' + esc(lvl) + '</p><p class="muted" style="font-size:11px">Educativo, no diagnóstico. Si te preocupa, conversa con alguien de confianza o pide hora en tu CESFAM.</p></div>';
      var e = store();
      e.tests.push({ id: uid('pt'), fecha: todayKey(), tipo: def.id, nombre: def.nombre, puntaje: r.puntaje, nivel: (typeof r.puntaje === 'number' ? lvl : 'perfil por rasgos'), respuestas: r.vals || [] });
      save('Test guardado ✓'); renderStreak(); renderTestsHist();
    };
  });
  document.querySelectorAll('.psi-treset').forEach(function (btn2) {
    btn2.onclick = function () {
      document.querySelectorAll('input[name^="t_' + btn2.dataset.test + '_"]').forEach(function (x) { x.checked = false; });
      var box = $('res_' + btn2.dataset.test); if (box) box.innerHTML = '';
    };
  });

  var tc = $('psiTestsClear');
  if (tc) tc.onclick = function () {
    if (!confirm('¿Borrar tu historial de tests de psicología?')) return;
    store().tests = []; save(); renderStreak(); renderTestsHist();
  };

  var tn = $('psiToNote');
  if (tn) tn.onclick = function () {
    var k = ($('psiFecha') && $('psiFecha').value) || todayKey();
    var c = store().checks[k];
    var txt = c ? ('🧠 Chequeo ' + k + ': ánimo ' + c.animo + '/10, energía ' + c.energia + '/10' + (c.nota ? ' — ' + c.nota : '')) : '🧠 Chequeo psicológico';
    try {
      var info = (typeof todayInfo === 'function') ? todayInfo() : null;
      if (!info) return alert('No se pudo ubicar hoy');
      if (info.luna === 'dft') { var cy = cyc(currentCycleYear()); cy.dft.nota = (cy.dft.nota ? cy.dft.nota + '\n' : '') + txt.slice(0, 280); }
      else { var cell = dayCell(info.luna, info.diaN); cell.nota = (cell.nota ? cell.nota + '\n' : '') + txt.slice(0, 280); }
      save(); if (typeof renderLuna === 'function' && currentView.tipo === 'luna') renderLuna();
      alert('Llevado a la nota de hoy ✓');
    } catch (e2) { alert('No se pudo llevar a la nota'); }
  };

  var sh = $('psiShare');
  if (sh) sh.onclick = async function () {
    var c = store().checks;
    var keys = Object.keys(c).sort().reverse().slice(0, 7);
    var t = keys.length ? '🧠 Mi proceso (últimos días)\n' + keys.map(function (k) {
      var d = c[k]; return '• ' + k + ': ánimo ' + d.animo + '/10, energía ' + d.energia + '/10' + (d.nota ? ' — ' + d.nota : '');
    }).join('\n') : '🧠 Sin chequeos aún';
    await share('Mi proceso', t);
  };
  var ex = $('psiExport');
  if (ex) ex.onclick = async function () {
    var e = store();
    var t = '🧠 PSICOLOGÍA — exportación ' + todayKey() + '\n\nCHEQUEOS\n' +
      Object.keys(e.checks).sort().map(function (k) { var d = e.checks[k]; return k + ' | ánimo ' + d.animo + ' | energía ' + d.energia + ' | ' + (d.emociones || []).join(',') + ' | ' + (d.nota || ''); }).join('\n') +
      '\n\nTESTS\n' + (e.tests || []).map(function (r) { return r.fecha + ' | ' + r.nombre + ' | ' + r.puntaje + ' | ' + r.nivel; }).join('\n');
    await share('Exportar psicología', t);
  };
  var cl = $('psiClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar todo tu registro de Psicología (chequeos, TCC y diario)? Se conservan los tests salvo que los borres aparte.')) return;
    try { var u = userData(); u.psicologia.checks = {}; u.psicologia.tcc = []; } catch (e) {}
    save(); renderStreak(); renderLog();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
