/* ============================================================
   ADICCIONES — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa e independiente:
   - Boton btnAdicciones (grupo Interior, inyectado)
   - Dialogo adiccionesDialog con 5 pestanas:
     1) Guia (que son, tipos, senales, neurobiologia, recursos Chile)
     2) Registro (seguimiento diario: antojos, logros, recaidas)
     3) Tecnicas (urgencias, mindfulness, reestructuracion)
     4) Recursos (lineas ayuda Chile, grupos, emergencias)
     5) Mi progreso (racha, estadisticas, hitos)
   - Todo local y privado por usuario: userData().adicciones
     { checks:[], logros:[], config:{} }
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
  function store() {
    try {
      var u = (typeof userData === 'function') ? userData() : null;
      if (!u) return { checks: [], logros: [], config: {} };
      if (!u.adicciones) u.adicciones = { checks: [], logros: [], config: {} };
      var e = u.adicciones;
      if (!Array.isArray(e.checks)) e.checks = [];
      if (!Array.isArray(e.logros)) e.logros = [];
      if (!e.config) e.config = {};
      return e;
    } catch (e2) { return { checks: [], logros: [], config: {} }; }
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
    { id: 'pantallas', nombre: 'Pantallas / Redes', icono: '📱' },
    { id: 'comida', nombre: 'Comida / Atraques', icono: '🍔' },
    { id: 'compras', nombre: 'Compras compulsivas', icono: '🛒' },
    { id: 'trabajo', nombre: 'Trabajo compulsivo', icono: '💼' },
    { id: 'otro', nombre: 'Otra', icono: '🔹' }
  ];

  var TECNICAS = [
    { id: 'urgencia', nombre: 'Técnica de la Urgencia', icono: '⏱️', desc: 'La urgencia pasa en 15-20 min. Pon un temporizador y haz otra cosa.', pasos: ['Reconoce la urgencia', 'Pon temporizador 15 min', 'Camina, bebe agua, llama a alguien', 'Cuando suene, evalúa: ¿sigue igual?'] },
    { id: 'respiracion', nombre: 'Respiración 4-7-8', icono: '🌬️', desc: 'Calma el sistema nervioso y reduce el antojo.', pasos: ['Inhala 4 segundos por nariz', 'Sostén 7 segundos', 'Exhala 8 segundos por boca', 'Repite 4 veces'] },
    { id: 'mindfulness', nombre: 'Mindfulness del Antojo', icono: '🧘', desc: 'Observar el antojo sin juzgarlo ni actuar.', pasos: ['Cierra los ojos', '¿Dónde sientes el antojo?', 'Obsérvalo como una ola', 'No actúes, solo observa', 'Vuelve al presente'] },
    { id: 'reestructuracion', nombre: 'Reestructuración Cognitiva', icono: '🔄', desc: 'Cuestiona los pensamientos que llevan al consumo.', pasos: ['Identifica el pensamiento', '¿Es real o exagerado?', 'Busca alternativas', 'Elige una respuesta adaptativa'] },
    { id: 'distraccion', nombre: 'Distracción Activa', icono: '🎯', desc: 'Rompe el patrón con actividad inmediata.', pasos: ['Levántate del lugar', 'Haz 10 sentadillas o camina', 'Llama a alguien de confianza', 'Toma agua fría', 'Escribe qué sientes'] },
    { id: 'anclaje', nombre: 'Anclaje Sensorial', icono: '⚓', desc: 'Usa tus sentidos para volver al presente.', pasos: ['5 cosas que ves', '4 cosas que tocas', '3 cosas que oyes', '2 cosas que hueles', '1 cosa que saboreas'] },
    { id: 'carta', nombre: 'Carta a tu Yo Futuro', icono: '✉️', desc: 'Escribe desde la versión de ti que ya superó esto.', pasos: ['Imagina tu yo en 1 año', '¿Qué le dirías?', 'Escribe 3 líneas', 'Guárdala para días difíciles'] }
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

  /* ---------------- RACHAS ---------------- */
  function calcRacha(checks) {
    if (!checks || !checks.length) return 0;
    var fechas = checks.map(function (c) { return c.fecha; }).sort();
    var hoy = todayKey();
    var racha = 0;
    var d = new Date();
    for (var i = 0; i < 365; i++) {
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (fechas.indexOf(key) >= 0) {
        racha++;
      } else if (i > 0) {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return racha;
  }

  function calcMejorRacha(checks) {
    if (!checks || !checks.length) return 0;
    var fechas = checks.map(function (c) { return c.fecha; }).sort();
    var mejor = 0, actual = 1;
    for (var i = 1; i < fechas.length; i++) {
      var d1 = new Date(fechas[i - 1]);
      var d2 = new Date(fechas[i]);
      var diff = (d2 - d1) / 86400000;
      if (diff === 1) {
        actual++;
      } else {
        if (actual > mejor) mejor = actual;
        actual = 1;
      }
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
      <div class="si-card" style="border-color:var(--gold)">
        <h4>⚠️ Importante</h4>
        <p>Esta sección es <b>educativa y de apoyo</b>. No diagnostica ni reemplaza tratamiento profesional. Si tú o alguien que conoces necesita ayuda, contacta a un profesional de salud mental o a las líneas de ayuda en la pestaña <b>Recursos</b>.</p>
      </div>
    `;
  }

  /* ---------------- RENDER: REGISTRO ---------------- */
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
        <h4>📊 Últimos 14 días</h4>
        <div id="adiHistorial"></div>
      </div>
    `;

    var intSlider = $('adiIntensidad'), intVal = $('adiIntensidadV');
    if (intSlider) intSlider.oninput = function () { if (intVal) intVal.textContent = intSlider.value; };

    var sv = $('adiCheckSave');
    if (sv) sv.onclick = function () {
      var k = hoy;
      var sust = ($('adiSust') || {}).value || 'otro';
      var estado = ($('adiEstado') || {}).value || 'libre';
      var intensidad = +(($('adiIntensidad') || {}).value || 5);
      var hora = ($('adiHora') || {}).value || '';
      var disparador = clean((($('adiDisparador') || {}).value || '').trim(), 80);
      var alternativa = clean((($('adiAlternativa') || {}).value || '').trim(), 80);
      var nota = clean((($('adiNota') || {}).value || '').trim(), 300);

      var ex = store();
      var idx = -1;
      ex.checks.forEach(function (c, i) { if (c.fecha === k && c.sustancia === sust) idx = i; });
      var reg = { fecha: k, sustancia: sust, estado: estado, intensidad: intensidad, hora: hora, disparador: disparador, alternativa: alternativa, nota: nota, ts: Date.now() };
      if (idx >= 0) ex.checks[idx] = reg; else ex.checks.push(reg);
      save('Guardado ✓');
      renderRegistro();
      renderProgreso();
    };

    renderHistorial();
  }

  function renderHistorial() {
    var el = $('adiHistorial');
    if (!el) return;
    var e = store();
    var checks = e.checks.slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 14);
    if (!checks.length) {
      el.innerHTML = '<p class="muted">Sin registros aún. ¡Comienza hoy!</p>';
      return;
    }
    var rows = checks.map(function (c) {
      var s = SUSTANCIAS.find(function (x) { return x.id === c.sustancia; });
      var icono = s ? s.icono : '🔹';
      var nombre = s ? s.nombre : c.sustancia;
      var estadoColor = c.estado === 'libre' ? '#8fd694' : c.estado === 'antojo' ? '#e8c56a' : c.estado === 'recaida' ? '#e76e8a' : '#7ab8ff';
      var estadoTxt = c.estado === 'libre' ? 'Libre' : c.estado === 'antojo' ? 'Antojo' : c.estado === 'recaida' ? 'Recaída' : 'Observación';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">' +
        '<span>' + icono + ' ' + esc(nombre) + ' <span class="muted">' + c.fecha + '</span></span>' +
        '<span style="color:' + estadoColor + ';font-weight:600">' + estadoTxt + '</span>' +
        '</div>';
    }).join('');
    el.innerHTML = rows;
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

    var hitos = [];
    if (racha >= 1) hitos.push({ icono: '🌱', texto: 'Primer día de registro' });
    if (racha >= 3) hitos.push({ icono: '🌿', texto: '3 días de racha' });
    if (racha >= 7) hitos.push({ icono: '🌳', texto: '1 semana de racha' });
    if (racha >= 13) hitos.push({ icono: '🌙', texto: '1 luna (13 días) de racha' });
    if (racha >= 28) hitos.push({ icono: '🌕', texto: '1 ciclo lunar (28 días)' });
    if (racha >= 56) hitos.push({ icono: '🌍', texto: '2 ciclos lunares' });
    if (racha >= 182) hitos.push({ icono: '☀️', texto: 'Medio año' });
    if (racha >= 364) hitos.push({ icono: '🏆', texto: '¡1 año completo!' });

    el.innerHTML = `
      <div class="menstrual-card" style="border-color:var(--gold)">
        <h4>📈 Tu progreso</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:12px 0">
          <div style="text-align:center;padding:12px;background:var(--panel);border-radius:8px">
            <div style="font-size:28px;font-weight:700;color:var(--gold)">${racha}</div>
            <div class="muted" style="font-size:11px">Racha actual (días)</div>
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
        </div>
        <div class="conv-row" style="justify-content:space-around">
          <span>✅ Libres: <b>${libres}</b></span>
          <span>⚡ Antojos: <b>${antojos}</b></span>
          <span>⚠️ Recaídas: <b>${recaidas}</b></span>
        </div>
      </div>
      <div class="menstrual-card">
        <h4>🏅 Hitos</h4>
        ${hitos.length ? hitos.map(function (h) {
          return '<div style="padding:6px 0;border-bottom:1px solid var(--line)">' + h.icono + ' ' + h.texto + '</div>';
        }).join('') : '<p class="muted">Registra días consecutivos para desbloquear hitos.</p>'}
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
        'Racha actual: ' + racha + ' días\n' +
        'Mejor racha: ' + mejor + ' días\n' +
        'Días registrados: ' + total + '\n' +
        'Días libres: ' + libres + ' (' + pct + '%)\n' +
        'Antojos resistidos: ' + antojos + '\n' +
        'Recaídas: ' + recaidas;
      share('Mi progreso - Calendario 13 Lunas', texto);
    };

    var cl = $('adiClear');
    if (cl) cl.onclick = function () {
      if (confirm('¿Borrar todos los registros de adicciones? Esta acción no se puede deshacer.')) {
        var ex = store();
        ex.checks = [];
        ex.logros = [];
        save('Datos borrados');
        renderRegistro();
        renderProgreso();
      }
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
      '<button type="button" class="btn" data-tab="registro">📝 Registro</button>' +
      '<button type="button" class="btn" data-tab="tecnicas">🛠️ Técnicas</button>' +
      '<button type="button" class="btn" data-tab="recursos">📞 Recursos</button>' +
      '<button type="button" class="btn" data-tab="progreso">📈 Mi Progreso</button>' +
      '</div>' +
      '<div id="adiGuia"></div>' +
      '<div id="adiRegistro" class="hidden"></div>' +
      '<div id="adiTecnicas" class="hidden"></div>' +
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
        ['guia', 'registro', 'tecnicas', 'recursos', 'progreso'].forEach(function (k) {
          var el = $('adi' + k.charAt(0).toUpperCase() + k.slice(1));
          if (el) el.classList.toggle('hidden', k !== t);
        });
        if (t === 'guia') renderGuia();
        if (t === 'registro') renderRegistro();
        if (t === 'tecnicas') renderTecnicas();
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
          btn.setAttribute('data-keywords', 'adicciones adiccion alcohol tabaco drogas recuperacion rehabilitacion senda abstinencia antojo recaida racha apoyo ayuda tratamiento *4141 juego apuestas pantallas comida compras');
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
