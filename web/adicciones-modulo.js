/* ============================================================
   ADICCIONES — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnAdicciones (grupo Interior, inyectado)
   - Dialogo adiccionesDialog con 7 pestanas:
     1) Guia (que son, tipos, senales, neurobiologia, abstinencia,
        etapas del cambio, mitos, recaida)
     2) Plan (meta, motivos, etapa, red de apoyo, plan de emergencia)
     3) Registro (seguimiento diario + gasto evitado; editar/borrar/filtrar)
     4) Tecnicas (13 tecnicas: urgencia, HALT, cinta completa, etc.)
     5) Evaluacion (autoevaluacion orientativa de 8 preguntas)
     6) Recursos (lineas ayuda Chile, grupos, emergencias)
     7) Mi progreso (racha sin recaidas, grafico 30 dias, ahorro,
        disparadores frecuentes, logros desbloqueables)
   - Todo local y privado por usuario: userData().adicciones
      { checks:[], logros:[], evals:[], red:[], plan:{}, config:{} }
   - Educativo: NO diagnostica, NO reemplaza tratamiento profesional.
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
  function defaultPlan() { return { meta: 'abstinencia', motivos: '', etapa: '', emergencia: '' }; }
  function store() {
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (!u) return { checks: [], logros: [], evals: [], red: [], plan: defaultPlan(), config: {} };
      if (!u.adicciones) u.adicciones = { checks: [], logros: [], evals: [], red: [], plan: defaultPlan(), config: {} };
      var e = u.adicciones;
      if (!Array.isArray(e.checks)) e.checks = [];
      if (!Array.isArray(e.logros)) e.logros = [];
      if (!Array.isArray(e.evals)) e.evals = [];
      if (!Array.isArray(e.red)) e.red = [];
      if (!e.plan || typeof e.plan !== 'object') e.plan = defaultPlan();
      if (!e.config) e.config = {};
      /* Migración: registros de versiones anteriores sin id único ni gasto */
      e.checks.forEach(function (c) {
        if (!c.ts) c.ts = Date.now() + Math.random();
        if (c.gasto == null) c.gasto = 0;
      });
      return e;
    } catch (e2) { return { checks: [], logros: [], evals: [], red: [], plan: defaultPlan(), config: {} }; }
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
  var SUSTANCIAS = [
    { id: 'alcohol', nombre: 'Alcohol', icono: '🍷' },
    { id: 'tabaco', nombre: 'Tabaco / Nicotina', icono: '🚬' },
    { id: 'cannabis', nombre: 'Cannabis', icono: '🌿' },
    { id: 'cocaina', nombre: 'Cocaína', icono: '❄️' },
    { id: 'metanfetaminas', nombre: 'Metanfetaminas', icono: '💊' },
    { id: 'benzodiacepinas', nombre: 'Benzodiacepinas', icono: '💊' },
    { id: 'opioides', nombre: 'Opioides', icono: '💉' },
    { id: 'inhalantes', nombre: 'Inhalantes', icono: '💨' },
    { id: 'juego', nombre: 'Juego / Apuestas', icono: '🎰' },
    { id: 'videojuegos', nombre: 'Videojuegos', icono: '🎮' },
    { id: 'pantallas', nombre: 'Pantallas / Redes', icono: '📱' },
    { id: 'redes', nombre: 'Redes sociales', icono: '📲' },
    { id: 'pornografia', nombre: 'Pornografía', icono: '🔞' },
    { id: 'comida', nombre: 'Comida / Atraques', icono: '🍔' },
    { id: 'compras', nombre: 'Compras compulsivas', icono: '🛒' },
    { id: 'trabajo', nombre: 'Trabajo compulsivo', icono: '💼' },
    { id: 'ejercicio', nombre: 'Ejercicio compulsivo', icono: '🏋️' },
    { id: 'sexo', nombre: 'Sexo compulsivo', icono: '❤️‍🔥' },
    { id: 'pasta', nombre: 'Pasta base', icono: '🧪' },
    { id: 'farmacos', nombre: 'Fármacos (sin receta)', icono: '🩹' },
    { id: 'cafeina', nombre: 'Cafeína / Energéticas', icono: '☕' },
    { id: 'otro', nombre: 'Otra', icono: '🔹' }
  ];

  var TECNICAS = [
    { id: 'urgencia', nombre: 'Técnica de la Urgencia', icono: '⏱️', desc: 'La urgencia pasa en 15-20 min. Pon un temporizador y haz otra cosa.', pasos: ['Reconoce la urgencia', 'Pon temporizador 15 min', 'Camina, bebe agua, llama a alguien', 'Cuando suene, evalúa: ¿sigue igual?'] },
    { id: 'respiracion', nombre: 'Respiración 4-7-8', icono: '🌬️', desc: 'Calma el sistema nervioso y reduce el antojo.', pasos: ['Inhala 4 segundos por nariz', 'Sostén 7 segundos', 'Exhala 8 segundos por boca', 'Repite 4 veces'] },
    { id: 'mindfulness', nombre: 'Mindfulness del Antojo', icono: '🧘', desc: 'Observar el antojo sin juzgarlo ni actuar.', pasos: ['Cierra los ojos', '¿Dónde sientes el antojo?', 'Obsérvalo como una ola', 'No actúes, solo observa', 'Vuelve al presente'] },
    { id: 'reestructuracion', nombre: 'Reestructuración Cognitiva', icono: '🔄', desc: 'Cuestiona los pensamientos que llevan al consumo.', pasos: ['Identifica el pensamiento', '¿Es real o exagerado?', 'Busca alternativas', 'Elige una respuesta adaptativa'] },
    { id: 'distraccion', nombre: 'Distracción Activa', icono: '🎯', desc: 'Rompe el patrón con actividad inmediata.', pasos: ['Levántate del lugar', 'Haz 10 sentadillas o camina', 'Llama a alguien de confianza', 'Toma agua fría', 'Escribe qué sientes'] },
    { id: 'anclaje', nombre: 'Anclaje Sensorial', icono: '⚓', desc: 'Usa tus sentidos para volver al presente.', pasos: ['5 cosas que ves', '4 cosas que tocas', '3 cosas que oyes', '2 cosas que hueles', '1 cosa que saboreas'] },
    { id: 'carta', nombre: 'Carta a tu Yo Futuro', icono: '✉️', desc: 'Escribe desde la versión de ti que ya superó esto.', pasos: ['Imagina tu yo en 1 año', '¿Qué le dirías?', 'Escribe 3 líneas', 'Guárdala para días difíciles'] },
    { id: 'halt', nombre: 'HALT: revisa lo básico', icono: '🍽️', desc: 'Muchos antojos nacen de necesidades sin atender: Hambre, Enojo, Soledad, Cansancio (Hungry, Angry, Lonely, Tired).', pasos: ['¿Tengo Hambre? Come algo nutritivo', '¿Estoy Enojado/a? Escribe o camina para soltarlo', '¿Me siento Solo/a? Llama o escribe a alguien', '¿Estoy Cansado/a? Descansa 20 min sin pantallas', 'Reevalúa el antojo después de atender lo básico'] },
    { id: 'cinta', nombre: 'La cinta completa', icono: '🎬', desc: 'El antojo te muestra solo el primer minuto placentero. Reproduce la película entera hasta el final.', pasos: ['Imagina que consumes: el primer momento', 'Sigue la película: ¿qué pasa 1 hora después?', '¿Y al día siguiente? ¿Culpa, gasto, malestar?', '¿Qué pierdes de tu racha y tus motivos?', 'Elige con la película completa, no con el tráiler'] },
    { id: 'balanza', nombre: 'Balanza decisional', icono: '⚖️', desc: 'Pon por escrito pros y contras de consumir y de no consumir. Lo escrito pesa más que lo pensado.', pasos: ['Divide una hoja en 4: pro/consumir, contra/consumir, pro/no consumir, contra/no consumir', 'Llena cada cuadrante con honestidad', 'Lee en voz alta la columna "contra consumir"', 'Guarda la hoja y reléela en cada antojo fuerte'] },
    { id: 'abc', nombre: 'Diario ABC del antojo', icono: '📝', desc: 'Antecedente → Creencia/Conducta → Consecuencia. Detecta tu cadena para cortarla antes.', pasos: ['A: ¿Qué pasó justo antes? (lugar, hora, emoción, compañía)', 'B: ¿Qué pensamiento apareció? ("solo una vez", "me lo merezco")', 'C: ¿Qué hiciste y cómo terminó?', 'Marca el eslabón más fácil de cambiar mañana', 'Regístralo en 📝 Registro con su disparador'] },
    { id: 'llamada', nombre: 'Llamada de 5 minutos', icono: '📞', desc: 'Pedir ayuda a tiempo es la técnica más eficaz y la menos usada.', pasos: ['Elige 1 persona de tu red de apoyo (pestaña 🧭 Plan)', 'Avisa: "tengo un antojo fuerte, ¿me acompañas 5 min?"', 'No necesitas explicar todo: basta con no estar a solas', 'Si nadie responde, llama a *4141 o escribe tu plan de emergencia'] },
    { id: 'autocompasion', nombre: 'Autocompasión tras la caída', icono: '💛', desc: 'Castigarte aumenta el riesgo de seguir consumiendo. Trátate como tratarías a un amigo.', pasos: ['Respira y di: "esto es un momento difícil, no una sentencia"', 'Recuerda: una recaída es un dato, no tu identidad', 'Haz el Diario ABC de lo ocurrido sin insultarte', 'Retoma el registro al día siguiente, la racha se reconstruye', 'Si se repite, pide ayuda profesional: no es fracaso, es cuidado'] }
  ];

  var RECURSOS = [
    { nombre: 'Línea Libre *4141', desc: 'Consejo y orientación en adicciones (SENDA)', contacto: 'Marca *4141 desde cualquier celular', tipo: 'telefono' },
    { nombre: 'SENDA', desc: 'Servicio Nacional para la Prevención y Rehabilitación del Consumo de Drogas y Alcohol', contacto: 'www.senda.gob.cl', tipo: 'web' },
    { nombre: 'FONASA Salud Mental', desc: 'Atención de salud mental y adicciones', contacto: '600 360 7777', tipo: 'telefono' },
    { nombre: 'SAMU / Emergencias', desc: 'Emergencias médicas', contacto: '131', tipo: 'emergencia' },
    { nombre: 'Bomberos', desc: 'Emergencias y rescate', contacto: '132', tipo: 'emergencia' },
    { nombre: 'Carabineros', desc: 'Seguridad y emergencias', contacto: '133', tipo: 'emergencia' },
    { nombre: 'Hospital de Penco', desc: 'Atención de urgencia', contacto: 'Av. Manuel Rodríguez s/n', tipo: 'presencial' },
    { nombre: 'COSAM Penco', desc: 'Centro de Salud Mental Comunitario', contacto: 'Consulta en CESFAM', tipo: 'presencial' },
    { nombre: 'AA (Alcohólicos Anónimos)', desc: 'Grupo de apoyo mutuo', contacto: 'www.alcoholicos-anonimos.org', tipo: 'web' },
    { nombre: 'NA (Narcóticos Anónimos)', desc: 'Grupo de apoyo mutuo', contacto: 'www.na.org', tipo: 'web' },
    { nombre: 'Línea de la Esperanza', desc: 'Apoyo emocional y prevención del suicidio', contacto: '135', tipo: 'telefono' },
    { nombre: 'Salud Mental Chile', desc: 'Información y recursos de salud mental', contacto: 'www.saludmental.gob.cl', tipo: 'web' }
  ];

  /* Abstinencia: información general orientativa. Cada cuerpo es distinto;
     ante síntomas intensos se debe buscar atención médica. */
  var ABSTINENCIA = [
    { sust: 'Alcohol', espera: 'Ansiedad, insomnio, temblores, sudoración, náuseas en las primeras 6-48 h. Los síntomas suelen bajar en 5-7 días.', alarma: '🚨 Confusión grave, convulsiones, alucinaciones o fiebre alta pueden ser delirium tremens: URGENCIA médica (131). Nunca dejes el alcohol de golpe sin supervisión si tomas a diario hace tiempo.' },
    { sust: 'Tabaco / Nicotina', espera: 'Irritabilidad, ansiedad, dificultad para concentrarse y fuerte deseo de fumar los primeros 3-7 días. Mejora mucho en 2-4 semanas.', alarma: '🚨 No suele ser peligroso, pero si hay depresión intensa o ideas suicidas, pide ayuda: *4141 o 135.' },
    { sust: 'Cannabis', espera: 'Irritabilidad, insomnio, sueños vívidos, baja del apetito y ansiedad durante 1-2 semanas.', alarma: '🚨 Si la ansiedad o el ánimo bajo no ceden en semanas, consulta en tu CESFAM o COSAM.' },
    { sust: 'Estimulantes (cocaína, pasta base, metanfetaminas)', espera: 'Bajón de ánimo, cansancio extremo, aumento del apetito y del sueño, antojos intensos por días o semanas.', alarma: '🚨 Depresión profunda o ideas suicidas requieren ayuda inmediata: 135 o *4141. El consumo por vía fumada o inyectada suma riesgos respiratorios e infecciosos: consulta médica.' },
    { sust: 'Benzodiacepinas / Fármacos', espera: 'Ansiedad de rebote, insomnio, irritabilidad. La suspensión brusca puede provocar convulsiones.', alarma: '🚨 Nunca suspendas de golpe sin indicación médica: la reducción debe ser gradual y supervisada. Urgencia al 131 ante convulsiones.' },
    { sust: 'Opioides', espera: 'Dolor muscular, escalofríos, náuseas, diarrea, insomnio y ansiedad intensa por 5-10 días.', alarma: '🚨 Aunque rara vez mortal en sí, la deshidratación y las recaídas con sobredosis sí lo son. Busca acompañamiento médico (CESFAM, SENDA).' },
    { sust: 'Conductas (juego, pantallas, comida, compras)', espera: 'Inquietud, aburrimiento, irritabilidad y pensamientos repetidos sobre la conducta durante días o semanas.', alarma: '🚨 Si hay deudas impagables, robos para jugar o atracones con vómitos frecuentes, pide ayuda profesional cuanto antes: *4141.' }
  ];

  var EVAL_PREGUNTAS = [
    '¿Con qué frecuencia piensas en consumir o en realizar la conducta?',
    '¿Has intentado reducirlo o dejarlo sin lograrlo?',
    '¿Necesitas cada vez más cantidad o tiempo para sentir lo mismo?',
    '¿Has descuidado estudios, trabajo, familia o amistades por esto?',
    '¿Alguien cercano te ha expresado preocupación por este tema?',
    '¿Sientes culpa o malestar después de consumir o hacerlo?',
    '¿Continúas a pesar de problemas de salud, dinero o legales?',
    '¿Sientes malestar físico o anímico cuando no lo haces?'
  ];
  var EVAL_OPCIONES = ['Nunca', 'A veces', 'A menudo', 'Casi siempre'];

  var ETAPAS = [
    { id: 'pre', nombre: 'Precontemplación', desc: 'Aún no veo el consumo como un problema.' },
    { id: 'cont', nombre: 'Contemplación', desc: 'Lo estoy pensando: veo pros y contras de cambiar.' },
    { id: 'prep', nombre: 'Preparación', desc: 'Decidí cambiar y estoy armando mi plan.' },
    { id: 'acc', nombre: 'Acción', desc: 'Estoy cambiando activamente día a día.' },
    { id: 'mant', nombre: 'Mantención', desc: 'Sostengo el cambio y prevengo recaídas.' }
  ];

  var LOGROS_DEF = [
    { id: 'r3', icono: '🌱', nombre: '3 días sin recaídas' },
    { id: 'r7', icono: '🌿', nombre: '7 días sin recaídas' },
    { id: 'r13', icono: '🌙', nombre: '13 días sin recaídas (1 luna)' },
    { id: 'r28', icono: '🌕', nombre: '28 días sin recaídas (ciclo lunar)' },
    { id: 'r56', icono: '🌍', nombre: '56 días sin recaídas' },
    { id: 'r90', icono: '☀️', nombre: '90 días sin recaídas' },
    { id: 'a10', icono: '⚡', nombre: '10 antojos resistidos' },
    { id: 'l30', icono: '📝', nombre: '30 días registrados' },
    { id: 'e1', icono: '📋', nombre: 'Primera autoevaluación' },
    { id: 'p1', icono: '🧭', nombre: 'Plan personal creado' }
  ];

  /* ---------------- RACHAS ---------------- */
  function keyOf(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function porDia(checks) {
    var m = {};
    (checks || []).forEach(function (c) {
      if (!m[c.fecha]) m[c.fecha] = { rec: false, n: 0 };
      m[c.fecha].n++;
      if (c.estado === 'recaida') m[c.fecha].rec = true;
    });
    return m;
  }

  /* Racha = días consecutivos SIN recaída. Si hoy aún no tiene registro,
     se cuenta desde ayer sin cortar la racha. */
  function calcRacha(checks) {
    if (!checks || !checks.length) return 0;
    var dias = porDia(checks);
    var racha = 0;
    var d = new Date();
    if (!dias[keyOf(d)]) d.setDate(d.getDate() - 1);
    for (var i = 0; i < 366; i++) {
      var k = keyOf(d);
      if (dias[k] && !dias[k].rec) racha++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return racha;
  }

  function calcMejorRacha(checks) {
    if (!checks || !checks.length) return 0;
    var dias = porDia(checks);
    var fechas = Object.keys(dias).filter(function (f) { return !dias[f].rec; }).sort();
    if (!fechas.length) return 0;
    var mejor = 1, actual = 1;
    for (var i = 1; i < fechas.length; i++) {
      var d1 = new Date(fechas[i - 1] + 'T12:00:00');
      var d2 = new Date(fechas[i] + 'T12:00:00');
      var diff = Math.round((d2 - d1) / 86400000);
      if (diff === 1) actual++;
      else { if (actual > mejor) mejor = actual; actual = 1; }
    }
    if (actual > mejor) mejor = actual;
    return mejor;
  }

  function calcTotalDias(checks) {
    if (!checks || !checks.length) return 0;
    var unicos = {};
    checks.forEach(function (c) { unicos[c.fecha] = true; });
    return Object.keys(unicos).length;
  }

  /* ---------------- RENDER: GUÍA ---------------- */
  function renderGuia() {
    var el = $('adiGuia');
    if (!el) return;
    el.innerHTML = `
      <div class="si-card">
        <h4>¿Qué es una adicción?</h4>
        <p>Una adicción es una condición compleja donde una persona consume una sustancia o realiza una conducta de forma compulsiva, a pesar de las consecuencias negativas. No es falta de voluntad: es una condición de salud que afecta el cerebro, el comportamiento y las relaciones.</p>
      </div>
      <div class="si-card">
        <h4>Tipos de adicción</h4>
        <p><b>Químicas:</b> alcohol, tabaco, cannabis, cocaína, metanfetaminas, benzodiacepinas, opioides, inhalantes.</p>
        <p><b>Conductuales:</b> juego/apuestas, pantallas/redes, comida, compras, trabajo, ejercicio, sexo.</p>
      </div>
      <div class="si-card">
        <h4>Señales de alerta</h4>
        <p>• Necesidad de más cantidad para el mismo efecto (tolerancia)<br>
        • Malestar al dejar de consumir (abstinencia)<br>
        • Consumo más largo o mayor de lo planeado<br>
        • Deseo intenso o fracasos al intentar dejarlo<br>
        • Abandono de actividades importantes<br>
        • Continuar a pesar de daño físico, mental o social</p>
      </div>
      <div class="si-card">
        <h4>Neurobiología breve</h4>
        <p>Las adicciones afectan el sistema de recompensa cerebral (dopamina). Con el tiempo, el cerebro se adapta: necesita más para sentir lo mismo y siente malestar sin ello. La corteza prefrontal (control de impulsos) se debilita. Por eso "solo dejarlo" es tan difícil: es un cambio cerebral real, no solo una decisión.</p>
      </div>
      <div class="si-card">
        <h4>Factores de riesgo</h4>
        <p>• Genética (40-60% del riesgo)<br>
        • Trauma o adversidad infantil<br>
        • Salud mental no tratada (ansiedad, depresión, TDAH)<br>
        • Consumo temprano<br>
        • Entorno social y familiar<br>
        • Estrés crónico</p>
      </div>
      <div class="si-card">
        <h4>Factores protectores</h4>
        <p>• Redes de apoyo (familia, amigos, comunidad)<br>
        • Actividad física y sueño adecuado<br>
        • Manejo del estrés y emociones<br>
        • Sentido de propósito y pertenencia<br>
        • Acceso a tratamiento y salud mental<br>
        • Espiritualidad o prácticas de significado</p>
      </div>
      <div class="si-card">
        <h4>🔄 Las 5 etapas del cambio</h4>
        <p><b>1. Precontemplación:</b> aún no lo veo como problema.<br>
        <b>2. Contemplación:</b> lo pienso, veo pros y contras.<br>
        <b>3. Preparación:</b> decidí cambiar y armo mi plan.<br>
        <b>4. Acción:</b> cambio activamente día a día.<br>
        <b>5. Mantención:</b> sostengo el cambio y prevengo recaídas.<br>
        Todas las etapas son válidas. Marca la tuya en la pestaña <b>🧭 Plan</b>: el apoyo se adapta a cada una.</p>
      </div>
      <div class="si-card">
        <h4>🤒 Abstinencia: qué esperar</h4>
        <p>Al reducir o dejar, el cuerpo protesta unos días. Esto es lo habitual:</p>
        ${ABSTINENCIA.map(function (a) {
          return '<p style="margin-top:8px"><b>' + a.sust + ':</b> ' + a.espera + '<br><span style="color:#e76e8a">' + a.alarma + '</span></p>';
        }).join('')}
      </div>
      <div class="si-card">
        <h4>💡 Mitos y realidades</h4>
        <p><b>Mito:</b> "Es solo falta de voluntad."<br><b>Realidad:</b> es una condición de salud con base cerebral; la voluntad ayuda, pero el apoyo y el tratamiento importan más.<br><br>
        <b>Mito:</b> "Si recaigo, todo se perdió."<br><b>Realidad:</b> las recaídas son frecuentes en el proceso; lo que importa es retomar y aprender de lo ocurrido.<br><br>
        <b>Mito:</b> "Hay que tocar fondo para cambiar."<br><b>Realidad:</b> mientras antes se pida ayuda, mejor el pronóstico. No hay que esperar lo peor.<br><br>
        <b>Mito:</b> "El tratamiento es solo internarse."<br><b>Realidad:</b> la mayoría se atiende en forma ambulatoria: CESFAM, COSAM, grupos de apoyo y terapia.</p>
      </div>
      <div class="si-card">
        <h4>🌧️ Si hay una recaída</h4>
        <p>Una recaída es un <b>dato</b>, no tu identidad ni el fin del proceso:<br>
        1) No te castigues: la culpa empuja a seguir consumiendo.<br>
        2) Vuelve a un lugar seguro y avisa a alguien de tu red.<br>
        3) Haz el Diario ABC (pestaña 🛠️ Técnicas): ¿qué antecedente te llevó ahí?<br>
        4) Retoma el registro al día siguiente.<br>
        5) Si se repite seguido, pide ayuda profesional: es cuidado, no fracaso.</p>
      </div>
      <div class="si-card" style="border-color:var(--gold)">
        <h4>⚠️ Importante</h4>
        <p>Esta sección es <b>educativa y de apoyo</b>. No diagnostica ni reemplaza tratamiento profesional. Si tú o alguien que conoces necesita ayuda, contacta a un profesional de salud mental o a las líneas de ayuda en la pestaña <b>Recursos</b>.</p>
      </div>
    `;
  }

  /* ---------------- RENDER: REGISTRO ---------------- */
  var adiEditTs = null;
  var adiFiltro = 'todas';
  function sustNombre(id) {
    var s = null;
    SUSTANCIAS.forEach(function (x) { if (x.id === id) s = x; });
    return s ? (s.icono + ' ' + s.nombre) : '🔹 ' + id;
  }
  function renderRegistro() {
    var el = $('adiRegistro');
    if (!el) return;
    var e = store();
    var hoy = todayKey();
    var checkHoy = null;
    e.checks.forEach(function (c) { if (c.fecha === hoy) checkHoy = c; });

    var sustOptions = SUSTANCIAS.map(function (s) {
      return '<option value="' + s.id + '">' + s.icono + ' ' + s.nombre + '</option>';
    }).join('');

    el.innerHTML = `
      <div class="menstrual-card" style="border-color:var(--gold)">
        <h4>📅 Registro de hoy — ${hoy}</h4>
        <div class="conv-row">
          <label>Sustancia / conducta
            <select id="adiSust">${sustOptions}</select>
          </label>
          <label>Estado
            <select id="adiEstado">
              <option value="libre">✅ Libre (sin consumo)</option>
              <option value="antojo">⚡ Antojo (lo resistí)</option>
              <option value="recaida">⚠️ Recaída</option>
              <option value="observacion">👁️ Observación</option>
            </select>
          </label>
        </div>
        <div class="conv-row">
          <label>Intensidad antojo (1-10) <input type="range" id="adiIntensidad" min="1" max="10" value="5" style="width:120px"><span id="adiIntensidadV" class="chip">5</span></label>
          <label>Hora <input type="time" id="adiHora" value="${new Date().toTimeString().slice(0,5)}"></label>
          <label>Gasto evitado ($) <input type="number" id="adiGasto" min="0" step="500" placeholder="ej: 5000" style="max-width:120px"></label>
        </div>
        <label>Disparador / situación
          <input type="text" id="adiDisparador" placeholder="ej: estrés trabajo, aburrimiento, reunión social" maxlength="80">
        </label>
        <label>¿Qué hice en su lugar?
          <input type="text" id="adiAlternativa" placeholder="ej: caminé 10 min, llamé a amigo, respiré" maxlength="80">
        </label>
        <label>Nota
          <textarea id="adiNota" rows="2" placeholder="¿Cómo te sientes? ¿Qué aprendiste?" maxlength="300"></textarea>
        </label>
        <div class="dlg-actions" style="justify-content:flex-start">
          <button type="button" id="adiCheckSave" class="btn btn-accent" style="width:auto">+ Guardar registro</button>
          <button type="button" id="adiCheckCancel" class="btn hidden" style="width:auto">Cancelar</button>
        </div>
      </div>
      <div class="menstrual-card">
        <h4>📊 Historial (últimos 30 días)</h4>
        <label>Filtrar <select id="adiFiltroSel" style="max-width:220px">
          <option value="todas">Todas</option>${sustOptions}
        </select></label>
        <div id="adiHistorial"></div>
      </div>
    `;

    var intSlider = $('adiIntensidad'), intVal = $('adiIntensidadV');
    if (intSlider) intSlider.oninput = function () { if (intVal) intVal.textContent = intSlider.value; };

    /* Si se está editando, cargar el registro en el formulario */
    var ed = null;
    if (adiEditTs) e.checks.forEach(function (c) { if (c.ts === adiEditTs) ed = c; });
    if (ed) {
      try { $('adiSust').value = ed.sustancia; } catch (e2) {}
      try { $('adiEstado').value = ed.estado; } catch (e3) {}
      try { $('adiIntensidad').value = ed.intensidad || 5; if (intVal) intVal.textContent = String(ed.intensidad || 5); } catch (e4) {}
      try { $('adiHora').value = ed.hora || ''; } catch (e5) {}
      try { $('adiGasto').value = (ed.gasto != null && ed.gasto !== '') ? ed.gasto : ''; } catch (e6) {}
      try { $('adiDisparador').value = ed.disparador || ''; } catch (e7) {}
      try { $('adiAlternativa').value = ed.alternativa || ''; } catch (e8) {}
      try { $('adiNota').value = ed.nota || ''; } catch (e9) {}
      var cc = $('adiCheckCancel');
      if (cc) { cc.classList.remove('hidden'); cc.onclick = function () { adiEditTs = null; renderRegistro(); }; }
      var svT = $('adiCheckSave');
      if (svT) svT.textContent = '↻ Actualizar registro';
    }

    var fs = $('adiFiltroSel');
    if (fs) { try { fs.value = adiFiltro; } catch (eF) {} fs.onchange = function () { adiFiltro = fs.value; renderHistorial(); }; }

    var sv = $('adiCheckSave');
    if (sv) sv.onclick = function () {
      var k = hoy;
      var sust = ($('adiSust') || {}).value || 'otro';
      var estado = ($('adiEstado') || {}).value || 'libre';
      var intensidad = +(($('adiIntensidad') || {}).value || 5);
      var hora = ($('adiHora') || {}).value || '';
      var gastoRaw = (($('adiGasto') || {}).value || '').toString().trim();
      var gasto = gastoRaw === '' ? 0 : Math.max(0, parseInt(gastoRaw, 10) || 0);
      var disparador = clean((($('adiDisparador') || {}).value || '').trim(), 80);
      var alternativa = clean((($('adiAlternativa') || {}).value || '').trim(), 80);
      var nota = clean((($('adiNota') || {}).value || '').trim(), 300);

      var ex = store();
      if (adiEditTs) {
        var ok = false;
        ex.checks.forEach(function (c) {
          if (c.ts === adiEditTs) {
            c.sustancia = sust; c.estado = estado; c.intensidad = intensidad;
            c.hora = hora; c.gasto = gasto; c.disparador = disparador;
            c.alternativa = alternativa; c.nota = nota; ok = true;
          }
        });
        adiEditTs = null;
        save(ok ? 'Actualizado ✓' : 'Guardado ✓');
      } else {
        var idx = -1;
        ex.checks.forEach(function (c, i) { if (c.fecha === k && c.sustancia === sust) idx = i; });
        var reg = { fecha: k, sustancia: sust, estado: estado, intensidad: intensidad, hora: hora, gasto: gasto, disparador: disparador, alternativa: alternativa, nota: nota, ts: Date.now() };
        if (idx >= 0) ex.checks[idx] = reg; else ex.checks.push(reg);
        save('Guardado ✓');
      }
      renderRegistro();
      renderProgreso();
    };

    renderHistorial();
  }

  function renderHistorial() {
    var el = $('adiHistorial');
    if (!el) return;
    var e = store();
    var checks = e.checks.slice().sort(function (a, b) {
      return (b.fecha.localeCompare(a.fecha)) || ((b.ts || 0) - (a.ts || 0));
    });
    if (adiFiltro && adiFiltro !== 'todas') checks = checks.filter(function (c) { return c.sustancia === adiFiltro; });
    checks = checks.slice(0, 30);
    if (!checks.length) {
      el.innerHTML = '<p class="muted">Sin registros aún. ¡Comienza hoy!</p>';
      return;
    }
    var rows = checks.map(function (c) {
      var estadoColor = c.estado === 'libre' ? '#8fd694' : c.estado === 'antojo' ? '#e8c56a' : c.estado === 'recaida' ? '#e76e8a' : '#7ab8ff';
      var estadoTxt = c.estado === 'libre' ? 'Libre' : c.estado === 'antojo' ? 'Antojo' : c.estado === 'recaida' ? 'Recaída' : 'Observación';
      var extra = (c.disparador ? ' · ⚡ ' + esc(c.disparador) : '') +
        (c.alternativa ? ' · ✅ ' + esc(c.alternativa) : '') +
        (c.gasto ? ' · 💰 $' + Number(c.gasto).toLocaleString('es-CL') : '');
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)">' +
        '<span style="flex:1">' + esc(sustNombre(c.sustancia)) + ' <span class="muted">' + c.fecha + (c.hora ? ' ' + esc(c.hora) : '') + '</span><br>' +
        '<span style="color:' + estadoColor + ';font-weight:600">' + estadoTxt + '</span>' +
        '<span class="muted" style="font-size:11px">' + extra + '</span></span>' +
        '<span style="display:flex;gap:4px;flex:0 0 auto">' +
        '<button type="button" class="btn" data-adi-edit="' + c.ts + '" style="width:auto;font-size:11px">✏️</button>' +
        '<button type="button" class="btn" data-adi-del="' + c.ts + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button>' +
        '</span></div>';
    }).join('');
    el.innerHTML = rows;
    el.querySelectorAll('[data-adi-edit]').forEach(function (b) {
      b.onclick = function () {
        adiEditTs = +b.getAttribute('data-adi-edit');
        renderRegistro();
        try { var s = $('adiCheckSave'); if (s) s.scrollIntoView({ block: 'center' }); } catch (e2) {}
      };
    });
    el.querySelectorAll('[data-adi-del]').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('¿Borrar este registro?')) return;
        var ts = +b.getAttribute('data-adi-del');
        var ex = store();
        ex.checks = ex.checks.filter(function (c) { return c.ts !== ts; });
        if (adiEditTs === ts) adiEditTs = null;
        save('Borrado');
        renderRegistro();
        renderProgreso();
      };
    });
  }

  /* ---------------- RENDER: TÉCNICAS ---------------- */
  function renderTecnicas() {
    var el = $('adiTecnicas');
    if (!el) return;
    el.innerHTML = TECNICAS.map(function (t) {
      return '<div class="si-card">' +
        '<h4>' + t.icono + ' ' + t.nombre + '</h4>' +
        '<p>' + t.desc + '</p>' +
        '<ol style="margin:8px 0;padding-left:20px">' +
        t.pasos.map(function (p) { return '<li>' + p + '</li>'; }).join('') +
        '</ol>' +
        '</div>';
    }).join('');
  }

  /* ---------------- RENDER: RECURSOS ---------------- */
  function renderRecursos() {
    var el = $('adiRecursos');
    if (!el) return;
    el.innerHTML = RECURSOS.map(function (r) {
      var icono = r.tipo === 'emergencia' ? '🚨' : r.tipo === 'telefono' ? '📞' : r.tipo === 'web' ? '🌐' : '📍';
      return '<div class="si-card">' +
        '<h4>' + icono + ' ' + r.nombre + '</h4>' +
        '<p>' + r.desc + '</p>' +
        '<p style="color:var(--gold);font-weight:600">' + r.contacto + '</p>' +
        '</div>';
    }).join('') +
    '<div class="si-card" style="border-color:#e76e8a">' +
    '<h4>🆘 Si estás en crisis</h4>' +
    '<p>• Si hay riesgo inmediato: <b>131 (SAMU)</b> o <b>133 (Carabineros)</b><br>' +
    '• Si es crisis emocional: <b>*4141</b> o <b>135</b><br>' +
    '• No estás solo/a. Pedir ayuda es un acto de valentía.</p>' +
    '</div>';
  }

  /* ---------------- RENDER: PROGRESO ---------------- */
  function renderProgreso() {
    var el = $('adiProgreso');
    if (!el) return;
    var e = store();
    var racha = calcRacha(e.checks);
    var mejor = calcMejorRacha(e.checks);
    var total = calcTotalDias(e.checks);
    var libres = e.checks.filter(function (c) { return c.estado === 'libre'; }).length;
    var antojos = e.checks.filter(function (c) { return c.estado === 'antojo'; }).length;
    var recaidas = e.checks.filter(function (c) { return c.estado === 'recaida'; }).length;
    var pct = e.checks.length ? Math.round((libres / e.checks.length) * 100) : 0;
    var ahorro = e.checks.reduce(function (s, c) { return s + (parseInt(c.gasto) || 0); }, 0);

    /* Disparadores más frecuentes */
    var dispCount = {};
    e.checks.forEach(function (c) {
      var t = (c.disparador || '').trim().toLowerCase();
      if (t) dispCount[t] = (dispCount[t] || 0) + 1;
    });
    var dispTop = Object.keys(dispCount).sort(function (a, b) { return dispCount[b] - dispCount[a]; }).slice(0, 5);

    /* Logros: desbloquear y persistir */
    var tienePlan = !!(e.plan && (e.plan.motivos || e.plan.emergencia));
    function logroOK(id) {
      if (id === 'a10') return antojos >= 10;
      if (id === 'l30') return total >= 30;
      if (id === 'e1') return e.evals.length >= 1;
      if (id === 'p1') return tienePlan;
      return racha >= parseInt(id.slice(1), 10);
    }
    var nuevos = [];
    LOGROS_DEF.forEach(function (l) {
      var tiene = e.logros.some(function (x) { return x.id === l.id; });
      if (!tiene && logroOK(l.id)) { e.logros.push({ id: l.id, fecha: todayKey() }); nuevos.push(l); }
    });
    if (nuevos.length) save('🏅 ¡Nuevo logro desbloqueado!');
    var logrosHtml = LOGROS_DEF.map(function (l) {
      var got = null;
      e.logros.forEach(function (x) { if (x.id === l.id) got = x; });
      var esNuevo = nuevos.some(function (x) { return x.id === l.id; });
      return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line);' + (got ? '' : 'opacity:0.45') + '">' +
        '<span>' + l.icono + ' ' + l.nombre + (esNuevo ? ' <b style="color:var(--gold)">¡nuevo!</b>' : '') + '</span>' +
        '<span class="muted" style="font-size:11px">' + (got ? got.fecha : '🔒') + '</span></div>';
    }).join('');

    /* Gráfico últimos 30 días: verde libre, amarillo antojo, rojo recaída */
    var chartBars = (function () {
      var mapa = {};
      e.checks.forEach(function (c) {
        var v = c.estado === 'recaida' ? 3 : c.estado === 'antojo' ? 2 : 1;
        if (!mapa[c.fecha] || v > mapa[c.fecha]) mapa[c.fecha] = v;
      });
      var now = new Date();
      var arr = [];
      for (var i = 29; i >= 0; i--) {
        var dd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        var k = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');
        arr.push({ k: k, v: mapa[k] || 0 });
      }
      return arr.map(function (x) {
        var col = x.v === 3 ? '#e76e8a' : x.v === 2 ? '#e8c56a' : x.v === 1 ? '#8fd694' : '#3a4668';
        var tit = x.v === 3 ? 'Recaída' : x.v === 2 ? 'Antojo resistido' : x.v === 1 ? 'Día libre / registro' : 'Sin registro';
        return '<div title="' + x.k + ' · ' + tit + '" style="flex:1;min-width:5px;height:34px;border-radius:3px;background:' + col + ';opacity:' + (x.v ? '1' : '0.45') + '"></div>';
      }).join('');
    })();

    el.innerHTML = `
      <div class="menstrual-card" style="border-color:var(--gold)">
        <h4>📈 Tu progreso</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:12px 0">
          <div style="text-align:center;padding:12px;background:var(--panel);border-radius:8px">
            <div style="font-size:28px;font-weight:700;color:var(--gold)">${racha}</div>
            <div class="muted" style="font-size:11px">Racha sin recaídas (días)</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--panel);border-radius:8px">
            <div style="font-size:28px;font-weight:700;color:var(--accent)">${mejor}</div>
            <div class="muted" style="font-size:11px">Mejor racha</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--panel);border-radius:8px">
            <div style="font-size:28px;font-weight:700;color:#8fd694">${total}</div>
            <div class="muted" style="font-size:11px">Días registrados</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--panel);border-radius:8px">
            <div style="font-size:28px;font-weight:700;color:#7ab8ff">${pct}%</div>
            <div class="muted" style="font-size:11px">Días libres</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--panel);border-radius:8px">
            <div style="font-size:24px;font-weight:700;color:#e8c56a">$${ahorro.toLocaleString('es-CL')}</div>
            <div class="muted" style="font-size:11px">Gasto evitado</div>
          </div>
        </div>
        <div class="conv-row" style="justify-content:space-around">
          <span>✅ Libres: <b>${libres}</b></span>
          <span>⚡ Antojos: <b>${antojos}</b></span>
          <span>⚠️ Recaídas: <b>${recaidas}</b></span>
        </div>
      </div>
      <div class="menstrual-card">
        <h4>📊 Últimos 30 días</h4>
        <p class="muted" style="font-size:10px">🟩 libre · 🟨 antojo resistido · 🟥 recaída · ⬛ sin registro (pasa el cursor o toca cada barra)</p>
        <div style="display:flex;gap:2px;align-items:flex-end;margin-top:8px">${chartBars}</div>
      </div>
      <div class="menstrual-card">
        <h4>⚡ Mis disparadores frecuentes</h4>
        ${dispTop.length ? dispTop.map(function (t) {
          return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span>' + esc(t) + '</span><span class="chip">×' + dispCount[t] + '</span></div>';
        }).join('') : '<p class="muted">Aún sin datos. Registra el disparador de cada día para descubrir tus patrones.</p>'}
      </div>
      <div class="menstrual-card" style="border-color:var(--gold)">
        <h4>🏅 Logros</h4>
        ${logrosHtml}
      </div>
      <div class="menstrual-card">
        <h4>📤 Exportar / Compartir</h4>
        <p class="muted" style="font-size:11px">Comparte tu progreso con tu terapeuta o red de apoyo. Todo se mantiene local y privado.</p>
        <div class="dlg-actions" style="justify-content:flex-start">
          <button type="button" id="adiShare" class="btn" style="width:auto">📤 Compartir resumen</button>
          <button type="button" id="adiClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button>
        </div>
      </div>
    `;

    var sh = $('adiShare');
    if (sh) sh.onclick = function () {
      var texto = 'Mi progreso en Calendario 13 Lunas:\n' +
        'Racha sin recaídas: ' + racha + ' días\n' +
        'Mejor racha: ' + mejor + ' días\n' +
        'Días registrados: ' + total + '\n' +
        'Días libres: ' + libres + ' (' + pct + '%)\n' +
        'Antojos resistidos: ' + antojos + '\n' +
        'Gasto evitado: $' + ahorro.toLocaleString('es-CL') + '\n' +
        'Recaídas: ' + recaidas;
      share('Mi progreso - Calendario 13 Lunas', texto);
    };

    var cl = $('adiClear');
    if (cl) cl.onclick = function () {
      if (confirm('¿Borrar registros, evaluaciones y logros de adicciones? (Tu plan y tu red de apoyo se conservan)')) {
        var ex = store();
        ex.checks = [];
        ex.logros = [];
        ex.evals = [];
        adiEditTs = null;
        save('Datos borrados');
        renderRegistro();
        renderProgreso();
      }
    };
  }

  /* ---------------- RENDER: PLAN ---------------- */
  function renderPlan() {
    var el = $('adiPlan');
    if (!el) return;
    var e = store();
    var p = e.plan || defaultPlan();
    var etapaOpts = ETAPAS.map(function (t) {
      return '<option value="' + t.id + '"' + (p.etapa === t.id ? ' selected' : '') + '>' + t.nombre + ' — ' + t.desc + '</option>';
    }).join('');
    var redRows = e.red.length ? e.red.map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center">' +
        '<span><b>' + esc(r.nombre) + '</b><br><span class="muted" style="font-size:11px">' + esc(r.rol || 'Apoyo') + (r.tel ? ' · 📞 ' + esc(r.tel) : '') + '</span></span>' +
        '<button type="button" class="btn" data-red-del="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div>';
    }).join('') : '<p class="muted" style="font-size:11px">Sin contactos aún. Agrega al menos 1 persona de confianza.</p>';
    el.innerHTML =
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧭 Mi plan personal</h4>' +
      '<p class="muted" style="font-size:11px">Tu plan es tu brújula en los momentos difíciles. Revísalo cada luna. Queda privado en tu dispositivo.</p>' +
      '<div class="conv-row"><label>Mi meta <select id="adiPlanMeta">' +
      '<option value="abstinencia"' + (p.meta === 'abstinencia' ? ' selected' : '') + '>Dejar por completo (abstinencia)</option>' +
      '<option value="reduccion"' + (p.meta === 'reduccion' ? ' selected' : '') + '>Reducir frecuencia/cantidad</option>' +
      '<option value="pausa"' + (p.meta === 'pausa' ? ' selected' : '') + '>Pausa temporal (ej: 28 días) y reevaluar</option>' +
      '</select></label>' +
      '<label>Mi etapa del cambio <select id="adiPlanEtapa"><option value="">— Elegir —</option>' + etapaOpts + '</select></label></div>' +
      '<label>Mis motivos para cambiar (léelos cuando el antojo apriete) <textarea id="adiPlanMotivos" rows="3" maxlength="600" placeholder="ej: mi salud, mis hijos, mi dinero, mi tranquilidad...">' + esc(p.motivos || '') + '</textarea></label>' +
      '<label>Mi plan de emergencia (qué haré paso a paso ante un antojo fuerte) <textarea id="adiPlanEmerg" rows="3" maxlength="600" placeholder="ej: 1) Salgo a caminar 10 min 2) Llamo a... 3) Releo mis motivos 4) Si sigue, llamo a *4141">' + esc(p.emergencia || '') + '</textarea></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="adiPlanSave" class="btn btn-accent" style="width:auto">💾 Guardar mi plan</button></div></div>' +
      '<div class="menstrual-card"><h4>🤝 Mi red de apoyo</h4>' +
      '<p class="muted" style="font-size:11px">Personas a quienes puedo acudir. Incluye al menos un contacto fuera de tu círculo de consumo.</p>' +
      '<div class="conv-row"><label>Nombre <input type="text" id="adiRedNom" maxlength="40" placeholder="ej: María"></label>' +
      '<label>Rol <input type="text" id="adiRedRol" maxlength="30" placeholder="ej: hermana, amigo, terapeuta"></label>' +
      '<label>Teléfono <input type="text" id="adiRedTel" maxlength="20" placeholder="ej: +56 9 ..."></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="adiRedAdd" class="btn" style="width:auto">+ Agregar contacto</button></div>' +
      '<div style="margin-top:8px">' + redRows + '</div></div>';
    var ps = $('adiPlanSave');
    if (ps) ps.onclick = function () {
      var ex = store();
      ex.plan = {
        meta: ($('adiPlanMeta') || {}).value || 'abstinencia',
        etapa: ($('adiPlanEtapa') || {}).value || '',
        motivos: clean((($('adiPlanMotivos') || {}).value || '').trim(), 600),
        emergencia: clean((($('adiPlanEmerg') || {}).value || '').trim(), 600)
      };
      save('Plan guardado 🧭');
      renderPlan();
      renderProgreso();
    };
    var ra = $('adiRedAdd');
    if (ra) ra.onclick = function () {
      var nom = clean((($('adiRedNom') || {}).value || '').trim(), 40);
      if (!nom) { alert('Ponle nombre al contacto'); return; }
      var ex = store();
      ex.red.push({ id: uid('rd'), nombre: nom, rol: clean((($('adiRedRol') || {}).value || '').trim(), 30), tel: clean((($('adiRedTel') || {}).value || '').trim(), 20) });
      save('Contacto agregado 🤝');
      renderPlan();
    };
    el.querySelectorAll('[data-red-del]').forEach(function (b) {
      b.onclick = function () {
        var ex = store();
        ex.red = ex.red.filter(function (r) { return r.id !== b.getAttribute('data-red-del'); });
        save('Contacto borrado');
        renderPlan();
      };
    });
  }

  /* ---------------- RENDER: EVALUACIÓN ---------------- */
  function renderEval() {
    var el = $('adiEval');
    if (!el) return;
    var e = store();
    var qs = EVAL_PREGUNTAS.map(function (q, i) {
      var opts = EVAL_OPCIONES.map(function (o, v) {
        return '<label class="check-row" style="font-size:12px"><input type="radio" name="adiEv' + i + '" value="' + v + '"' + (v === 0 ? ' checked' : '') + '> ' + o + '</label>';
      }).join('');
      return '<div class="si-card"><h4 style="font-size:12px">' + (i + 1) + '. ' + q + '</h4>' + opts + '</div>';
    }).join('');
    var hist = e.evals.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 10);
    var histHtml = hist.length ? hist.map(function (h) {
      var col = h.nivel === 'alto' ? '#e76e8a' : h.nivel === 'moderado' ? '#e8c56a' : '#8fd694';
      return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)">' +
        '<span>' + h.fecha + '</span><span style="color:' + col + ';font-weight:700">' + h.puntaje + ' pts · ' + h.nivel + '</span></div>';
    }).join('') : '<p class="muted">Sin evaluaciones aún.</p>';
    el.innerHTML =
      '<div class="menstrual-card"><h4>📋 Autoevaluación orientativa</h4>' +
      '<p class="muted" style="font-size:11px">Responde pensando en los <b>últimos 3 meses</b>. No es un diagnóstico: es una brújula para saber si conviene pedir apoyo profesional.</p>' +
      qs +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="adiEvCalc" class="btn btn-accent" style="width:auto">Ver mi resultado</button></div>' +
      '<div id="adiEvRes"></div></div>' +
      '<div class="menstrual-card"><h4>📊 Mis evaluaciones</h4>' + histHtml + '</div>';
    var cb = $('adiEvCalc');
    if (cb) cb.onclick = function () {
      var total = 0;
      for (var i = 0; i < EVAL_PREGUNTAS.length; i++) {
        var sel = document.querySelector('input[name="adiEv' + i + '"]:checked');
        total += sel ? (+sel.value) : 0;
      }
      var nivel = total <= 6 ? 'bajo' : total <= 13 ? 'moderado' : 'alto';
      var msg = nivel === 'bajo'
        ? 'Señales bajas. Sigue cuidándote: mantén tu registro y tu red de apoyo.'
        : nivel === 'moderado'
          ? 'Señales moderadas. Sería bueno conversarlo con alguien de confianza o un profesional (CESFAM, *4141). Tu plan y tus técnicas son clave ahora.'
          : 'Señales altas. Te recomendamos pedir apoyo profesional pronto: *4141 (SENDA), tu CESFAM o COSAM Penco. Pedir ayuda es un acto de valentía, no de fracaso.';
      var col = nivel === 'alto' ? '#e76e8a' : nivel === 'moderado' ? '#e8c56a' : '#8fd694';
      var box = $('adiEvRes');
      if (box) box.innerHTML = '<div class="si-card" style="border-color:' + col + '"><h4>Resultado: ' + total + ' / 24 · nivel ' + nivel + '</h4><p>' + msg + '</p></div>';
      var ex = store();
      ex.evals.push({ fecha: todayKey(), puntaje: total, nivel: nivel });
      save('Evaluación guardada 📋');
      renderProgreso();
      renderEval._done = true;
      try {
        var h2 = el.querySelectorAll('.menstrual-card')[1];
        if (h2) h2.scrollIntoView({ block: 'nearest' });
      } catch (e2) {}
    };
  }

  /* ---------------- DIÁLOGO ---------------- */
  function buildDialog() {
    var d = document.createElement('dialog');
    d.id = 'adiccionesDialog';
    d.innerHTML = '<form method="dialog">' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
      '<h3 style="margin:0;color:var(--accent)">🌿 Adicciones — Apoyo y Registro</h3>' +
      '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
      '<p class="muted" style="line-height:1.5">Herramienta de apoyo para el proceso de recuperación. Educativa, local y privada. No reemplaza tratamiento profesional.</p>' +
      '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-accent" data-tab="guia">📖 Guía</button>' +
      '<button type="button" class="btn" data-tab="plan">🧭 Plan</button>' +
      '<button type="button" class="btn" data-tab="registro">📝 Registro</button>' +
      '<button type="button" class="btn" data-tab="tecnicas">🛠️ Técnicas</button>' +
      '<button type="button" class="btn" data-tab="eval">📋 Evaluación</button>' +
      '<button type="button" class="btn" data-tab="recursos">📞 Recursos</button>' +
      '<button type="button" class="btn" data-tab="progreso">📈 Mi Progreso</button>' +
      '</div>' +
      '<div id="adiGuia"></div>' +
      '<div id="adiPlan" class="hidden"></div>' +
      '<div id="adiRegistro" class="hidden"></div>' +
      '<div id="adiTecnicas" class="hidden"></div>' +
      '<div id="adiEval" class="hidden"></div>' +
      '<div id="adiRecursos" class="hidden"></div>' +
      '<div id="adiProgreso" class="hidden"></div>' +
      '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
    document.body.appendChild(d);
    d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });

    d.querySelectorAll('[data-tab]').forEach(function (b) {
      b.onclick = function () {
        var t = b.dataset.tab;
        d.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.remove('btn-accent'); });
        b.classList.add('btn-accent');
        ['guia', 'plan', 'registro', 'tecnicas', 'eval', 'recursos', 'progreso'].forEach(function (k) {
          var el = $('adi' + k.charAt(0).toUpperCase() + k.slice(1));
          if (el) el.classList.toggle('hidden', k !== t);
        });
        if (t === 'guia') renderGuia();
        if (t === 'plan') renderPlan();
        if (t === 'registro') renderRegistro();
        if (t === 'tecnicas') renderTecnicas();
        if (t === 'eval') renderEval();
        if (t === 'recursos') renderRecursos();
        if (t === 'progreso') renderProgreso();
      };
    });

    renderGuia();
  }

  /* ---------------- SETUP ---------------- */
  function setup() {
    try {
      if (!$('btnAdicciones')) {
        var g = document.querySelector('.action-group[data-group="linaje"] .group-btns');
        if (g) {
          var btn = document.createElement('button');
          btn.id = 'btnAdicciones'; btn.className = 'btn'; btn.type = 'button';
          btn.textContent = '🌿 Adicciones';
          try { btn.setAttribute('data-sub', 'interior'); } catch (eS) {}
          btn.setAttribute('data-keywords', 'adicciones adiccion alcohol tabaco drogas recuperacion rehabilitacion senda abstinencia antojo recaida racha apoyo ayuda tratamiento *4141 juego apuestas pantallas comida compras plan motivos red apoyo autoevaluacion test disparador gasto ahorro logro pasta base farmacos videojuegos pornografia halt cinta balanza diario emergencia crisis');
          g.appendChild(btn);
        }
      }
    } catch (e) {}

    try {
      if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnAdicciones') < 0) ALL_BTNS.push('btnAdicciones');
    } catch (e) {}
    try {
      if (typeof PRESETS !== 'undefined') {
        Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnAdicciones = true; });
      }
    } catch (e) {}
    try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
    try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
    try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}

    try {
      if (!document.querySelector('#configDialog input[data-btn="btnAdicciones"]')) {
        var groups = document.querySelectorAll('#configDialog .config-group');
        groups.forEach(function (gr) {
          var h = gr.querySelector('h5');
          if (h && h.textContent.indexOf('Linaje') >= 0) {
            var lab = document.createElement('label');
            lab.className = 'check-row';
            lab.innerHTML = '<input type="checkbox" data-btn="btnAdicciones"> 🌿 Adicciones';
            gr.appendChild(lab);
            try {
              var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
              lab.querySelector('input').checked = !vis || vis.btnAdicciones !== false;
              lab.querySelector('input').onchange = function () {
                try {
                  var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                  if (DATAref) {
                    DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                    DATAref.config.visible.btnAdicciones = lab.querySelector('input').checked;
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

    try { addKw('btnPsico', 'adicciones recuperacion senda'); } catch (e2) {}

    buildDialog();

    var b = $('btnAdicciones');
    if (b) b.onclick = function () {
      renderRegistro();
      renderProgreso();
      openDlg('adiccionesDialog');
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
