/* Info clave al día — botón "📌 Al día" en cada sección y subsección.
 * Envía un resumen (nota o compromiso con hora) a la pantalla del día
 * (dayDialog / todayView / tarjetas de la luna). Todo queda local y privado.
 * Sin dependencias: usa las funciones globales existentes si están disponibles.
 */
(function () {
  'use strict';

  var EXCLUIR = {
    dayDialog: 1, searchDialog: 1, infoClaveDialog: 1,
    userDialog: 1, configDialog: 1
  };

  // Contenedores de bitácoras / registros (subsecciones con filas individuales).
  var LISTAS_FILA = [
    'fishLogList', 'birdsLogBox', 'interLogBox', 'bosqueLogBox',
    'financeListBox', 'shoppingListBox', 'habitsList', 'medicList',
    'naturalList', 'mealWeekBox', 'dreamsList', 'gratitudList',
    'tallerList', 'truequeList', 'mingaList', 'transList', 'suenosList'
  ];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    try {
      if (typeof escapeHtml === 'function') return escapeHtml(s);
    } catch (e) {}
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function clean(s, max) {
    try {
      if (typeof sanitizeText === 'function') return sanitizeText(s, max || 500);
    } catch (e) {}
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    if (s.length > (max || 500)) s = s.slice(0, max || 500).trim() + '…';
    return s;
  }
  function hoyKey() {
    try {
      if (window.cal && window.cal.fmtKey) return window.cal.fmtKey.format(new Date());
    } catch (e) {}
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function toast(msg) {
    try {
      var el = $('statusMsg');
      if (el) {
        el.textContent = msg;
        setTimeout(function () { if (el.textContent === msg) el.textContent = ''; }, 2500);
        return;
      }
    } catch (e) {}
    try { console.log('[info-clave] ' + msg); } catch (e2) {}
  }
  function guardar() {
    try {
      if (typeof scheduleSave === 'function') { scheduleSave.apply(null, arguments); return; }
    } catch (e) {}
    try {
      if (window.api && window.api.saveData && typeof DATA !== 'undefined') {
        window.api.saveData(JSON.stringify(DATA));
      }
    } catch (e2) {}
  }
  function refrescar() {
    try {
      if (typeof renderCurrentView === 'function') { renderCurrentView(); return; }
    } catch (e) {}
    try {
      if (typeof renderLuna === 'function' && typeof currentView !== 'undefined' && currentView && currentView.tipo === 'luna') renderLuna();
    } catch (e2) {}
    try {
      if (typeof renderTodayView === 'function') renderTodayView();
    } catch (e3) {}
  }
  function refDia(key) {
    try {
      if (typeof lunaMapForKey === 'function') return lunaMapForKey(key);
    } catch (e) {}
    return null;
  }
  function etiquetaRef(ref, key) {
    if (!ref) return key + ' (fuera del ciclo)';
    if (ref.luna === 'dft') return '✷ Día Fuera del Tiempo · ' + key;
    return 'Luna ' + ref.luna + ' · Día ' + ref.diaN + ' de 28 · ' + key;
  }

  // ---- Guardado real en el día -------------------------------------------
  function guardarEnDia(origen, texto, fechaKey, destino, horaStr) {
    texto = clean(texto, 500);
    if (!texto) { alert('Escribe la info clave primero.'); return false; }
    if (!fechaKey || !/^\d{4}-\d{2}-\d{2}$/.test(fechaKey)) { alert('Elige una fecha válida.'); return false; }
    var ref = refDia(fechaKey);
    if (!ref) { alert('Esa fecha está fuera del ciclo de 13 lunas visible.'); return false; }
    var linea = '[' + origen + '] ' + texto;

    // Día Fuera del Tiempo: solo nota (no tiene compromisos por hora).
    if (ref.luna === 'dft') {
      try {
        var cy = (typeof cyc === 'function') ? cyc(ref.y) : null;
        if (!cy) { alert('No se pudo abrir el ciclo ' + ref.y + '.'); return false; }
        cy.dft = cy.dft || { nota: '' };
        cy.dft.nota = cy.dft.nota ? cy.dft.nota + '\n' + linea : linea;
      } catch (e) { alert('No se pudo guardar en el DFT.'); return false; }
      guardar('Agregado al día ✓');
      refrescar();
      toast('📌 Agregado al DFT ✓');
      return true;
    }

    var lunaN = ref.luna, diaN = ref.diaN;
    var mismoCiclo = true;
    try {
      mismoCiclo = (typeof currentCycleYear === 'function') ? String(ref.y) === String(currentCycleYear()) : true;
    } catch (e) {}

    function celdaDirecta() {
      // Acceso sin cambiar el ciclo visible.
      var u = (typeof userData === 'function') ? userData() : null;
      var cyk = u && u.cycles ? u.cycles[String(ref.y)] : null;
      if (!cyk) return null;
      var m = cyk.moons ? cyk.moons[String(lunaN)] : null;
      if (!m) return null;
      if (!m.days[diaN]) m.days[diaN] = { nota: '', animo: -1, agenda: [] };
      if (!Array.isArray(m.days[diaN].agenda)) m.days[diaN].agenda = [];
      return m.days[diaN];
    }

    if (destino === 'compromiso') {
      var t = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaStr || '') ? horaStr : null;
      if (!t) { alert('Elige una hora válida (ej 08:37).'); return false; }
      var hh = parseInt(t.split(':')[0], 10), mm = parseInt(t.split(':')[1], 10);
      var item = {
        id: 'a' + Date.now() + Math.random().toString(36).slice(2, 6),
        hour: hh, minute: mm, time: String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'),
        text: clean(texto, 80), notify: false, notified: false
      };
      // Prefijo de origen sin exceder 80 caracteres del compromiso.
      var pref = '[' + origen + '] ';
      if ((pref + item.text).length <= 80) item.text = pref + item.text;
      try {
        var c = mismoCiclo && typeof dayCell === 'function' ? dayCell(lunaN, diaN) : celdaDirecta();
        if (!c) { alert('No se pudo abrir ese día.'); return false; }
        if (!Array.isArray(c.agenda)) c.agenda = [];
        c.agenda.push(item);
      } catch (e) { alert('No se pudo guardar el compromiso.'); return false; }
      guardar('Agregado al día ✓');
      refrescar();
      toast('📌 Compromiso agregado al día ✓');
      return true;
    }

    // Destino por defecto: nota del día.
    try {
      var cell = mismoCiclo && typeof dayCell === 'function' ? dayCell(lunaN, diaN) : celdaDirecta();
      if (!cell) { alert('No se pudo abrir ese día.'); return false; }
      cell.nota = cell.nota ? cell.nota + '\n' + linea : linea;
      if (typeof sanitizeText === 'function') cell.nota = sanitizeText(cell.nota, 2000);
    } catch (e) { alert('No se pudo guardar la nota.'); return false; }
    guardar('Agregado al día ✓');
    refrescar();
    toast('📌 Agregado al día ✓');
    return true;
  }

  // ---- Marea actual + 2 siguientes (helper puro, testeable) -------------------
  // ahoraHM: 'HH:MM' en hora local. Cada marea: {h:'HH:MM', a:'1.20m', t:'pleamar'|'bajamar'}.
  // dia: -1 = ayer, 0 = hoy, 1 = mañana.
  function mareasActuales(ahoraHM, tidesHoy, tidesAyer, tidesManana) {
    var hoy = Array.isArray(tidesHoy) ? tidesHoy : [];
    var ayer = Array.isArray(tidesAyer) ? tidesAyer : [];
    var man = Array.isArray(tidesManana) ? tidesManana : [];
    var res = { actual: null, siguientes: [] };
    var i = -1;
    for (var k = 0; k < hoy.length; k++) {
      if (typeof hoy[k].h === 'string' && hoy[k].h <= ahoraHM) i = k;
    }
    if (i >= 0) res.actual = { h: hoy[i].h, a: hoy[i].a, t: hoy[i].t, dia: 0 };
    else if (ayer.length) {
      var u = ayer[ayer.length - 1];
      res.actual = { h: u.h, a: u.a, t: u.t, dia: -1 };
    }
    var resto = hoy.slice(i + 1);
    var j = 0;
    while (res.siguientes.length < 2 && j < resto.length) {
      res.siguientes.push({ h: resto[j].h, a: resto[j].a, t: resto[j].t, dia: 0 });
      j++;
    }
    var m = 0;
    while (res.siguientes.length < 2 && m < man.length) {
      res.siguientes.push({ h: man[m].h, a: man[m].a, t: man[m].t, dia: 1 });
      m++;
    }
    return res;
  }
  function iconoMarea(t) { return t === 'pleamar' ? '⬆️' : '⬇️'; }
  function textoMarea(mm) {
    var suf = mm.dia === -1 ? ' (ayer)' : mm.dia === 1 ? ' (mañana)' : '';
    return iconoMarea(mm.t) + ' ' + mm.t + ' ' + mm.h + (mm.a ? ' · ' + mm.a : '') + suf;
  }

  // ---- Diálogo fecha + texto + destino ------------------------------------
  var ctx = { origen: 'Sección', texto: '' };
  function asegurarDialogo() {
    if ($('infoClaveDialog')) return $('infoClaveDialog');
    var dlg = document.createElement('dialog');
    dlg.id = 'infoClaveDialog';
    dlg.setAttribute('aria-label', 'Agregar info clave al día');
    dlg.innerHTML =
      '<form method="dialog">' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
      '<h3 style="margin:0">📌 Info clave al día</h3>' +
      '<button type="button" id="icCloseTop" class="btn btn-icon" title="Cerrar">✕</button>' +
      '</div>' +
      '<p class="muted" style="line-height:1.5">Se guarda en la <b>pantalla del día</b> (notas o compromisos). Queda <b>local y privado</b>.</p>' +
      '<div class="menstrual-card" style="border-color:var(--gold);margin-bottom:10px">' +
      '<div style="font-size:12px;margin-bottom:8px">Desde: <b id="icOrigen">—</b></div>' +
      '<div class="conv-row">' +
      '<label>Fecha <input type="date" id="icFecha"></label>' +
      '<label>Destino <select id="icDestino"><option value="nota">📝 Nota del día</option><option value="compromiso">🕐 Compromiso con hora</option></select></label>' +
      '<label id="icHoraWrap" style="display:none">Hora <input type="time" id="icHora" value="08:00" step="60"></label>' +
      '</div>' +
      '<div id="icDestinoInfo" class="chip" style="display:block;white-space:normal;margin-top:6px">—</div>' +
      '</div>' +
      '<label class="dlg-horas-label" for="icTexto">✏️ Info clave (edítala antes de guardar)</label>' +
      '<textarea id="icTexto" rows="4" maxlength="500" placeholder="ej: Pleamar 08:20 · 0.45m — salir a roquerío con malla"></textarea>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:10px">' +
      '<button type="button" id="icHoy" class="btn" style="width:auto">◉ Hoy</button>' +
      '<span style="display:flex;gap:10px">' +
      '<button type="button" id="icCancelar" class="btn">Cancelar</button>' +
      '<button type="button" id="icGuardar" class="btn btn-accent">📌 Guardar en el día</button>' +
      '</span></div>' +
      '</form>';
    document.body.appendChild(dlg);
    var cerrar = function () { try { dlg.close(); } catch (e) {} };
    $('icCloseTop').onclick = cerrar;
    $('icCancelar').onclick = cerrar;
    $('icHoy').onclick = function () {
      $('icFecha').value = hoyKey();
      pintarDestino();
    };
    $('icDestino').onchange = function () {
      $('icHoraWrap').style.display = $('icDestino').value === 'compromiso' ? '' : 'none';
    };
    $('icFecha').onchange = pintarDestino;
    $('icGuardar').onclick = function () {
      var ok = guardarEnDia(
        $('icOrigen').textContent || ctx.origen,
        $('icTexto').value,
        $('icFecha').value,
        $('icDestino').value,
        $('icHora').value
      );
      if (ok) cerrar();
    };
    return dlg;
  }
  function pintarDestino() {
    try {
      var k = $('icFecha').value || hoyKey();
      $('icDestinoInfo').textContent = '→ ' + etiquetaRef(refDia(k), k);
    } catch (e) {}
  }

  function abrir(origen, textoSugerido, opts) {
    opts = opts || {};
    asegurarDialogo();
    ctx = { origen: clean(origen || 'Sección', 60) || 'Sección', texto: textoSugerido || '' };
    $('icOrigen').textContent = ctx.origen;
    $('icTexto').value = clean(ctx.texto, 500);
    $('icFecha').value = (opts.fecha && /^\d{4}-\d{2}-\d{2}$/.test(opts.fecha)) ? opts.fecha : hoyKey();
    $('icDestino').value = opts.destino === 'compromiso' ? 'compromiso' : 'nota';
    $('icHoraWrap').style.display = $('icDestino').value === 'compromiso' ? '' : 'none';
    if (opts.hora && /^\d{2}:\d{2}$/.test(opts.hora)) $('icHora').value = opts.hora;
    pintarDestino();
    var dlg = $('infoClaveDialog');
    try {
      if (!dlg.open) dlg.showModal();
    } catch (e) {
      try { dlg.showModal(); } catch (e2) {}
    }
    setTimeout(function () { try { $('icTexto').focus(); } catch (e) {} }, 60);
  }

  // ---- Extractores por sección --------------------------------------------
  function val(id) {
    try {
      var el = $(id);
      if (!el) return '';
      return String(el.value == null ? '' : el.value).trim();
    } catch (e) { return ''; }
  }
  function textoVisible(panelId, max) {
    try {
      var el = $(panelId);
      if (!el || el.classList.contains('hidden')) return '';
      var t = el.innerText || el.textContent || '';
      return clean(t, max || 280);
    } catch (e) { return ''; }
  }
  function tabActiva(dlg) {
    try {
      var tabs = dlg.querySelectorAll('.timer-tabs .btn');
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].classList.contains('btn-accent')) return clean(tabs[i].textContent, 40);
      }
    } catch (e) {}
    return '';
  }
  function resumenGenerico(dlg) {
    // Subsección visible: tab activa + primera tarjeta visible con contenido.
    var tab = tabActiva(dlg);
    var mejor = '';
    try {
      var cards = dlg.querySelectorAll('.menstrual-card, .si-card, .fishing-species, .habits-list');
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (c.offsetParent === null) continue;
        var t = clean(c.innerText || c.textContent || '', 280);
        if (t && t.length > 20) { mejor = t; break; }
      }
    } catch (e) {}
    if (!mejor) {
      try {
        var ps = dlg.querySelectorAll('p, li');
        for (var j = 0; j < ps.length; j++) {
          if (ps[j].offsetParent === null) continue;
          var u = clean(ps[j].innerText || ps[j].textContent || '', 280);
          if (u && u.length > 20 && !/privado y local/i.test(u)) { mejor = u; break; }
        }
      } catch (e2) {}
    }
    return { tab: tab, texto: mejor };
  }

  var EXTRACTORES = {
    mealDialog: function (o) {
      var f = val('mealDate') || hoyKey();
      var partes = [];
      if (val('mealBreakfast')) partes.push('Des:' + val('mealBreakfast'));
      if (val('mealLunch')) partes.push('Alm:' + val('mealLunch'));
      if (val('mealDinner')) partes.push('Cena:' + val('mealDinner'));
      if (val('mealSnack')) partes.push('Snack:' + val('mealSnack'));
      if (val('mealNotes')) partes.push('(' + val('mealNotes') + ')');
      return { texto: partes.length ? '🥗 Plan ' + f + ': ' + partes.join(' · ') : textoVisible('mealWeekBox', 280), fecha: f };
    },
    shoppingDialog: function () {
      var n = val('shopName'), q = val('shopQty'), c = val('shopCat');
      if (n) return { texto: '🛒 Comprar: ' + n + (q ? ' (' + q + ')' : '') + (c ? ' · ' + c : '') };
      return { texto: textoVisible('shoppingListBox', 280) || '🛒 Revisar lista de compras' };
    },
    financeDialog: function () {
      var f = val('finDate') || hoyKey();
      if (val('finMonto')) return { texto: (val('finTipo') === 'ingreso' ? '💰 Ingreso' : '💸 Gasto') + ' $' + val('finMonto') + (val('finDesc') ? ' · ' + val('finDesc') : '') + (val('finCat') ? ' (' + val('finCat') + ')' : ''), fecha: f };
      return { texto: textoVisible('financeResumen', 280), fecha: f };
    },
    fishingDialog: function () {
      var sp = val('fishLogSpecies'), q = val('fishLogQty'), p = val('fishLogPlace');
      if (sp || q || p) return { texto: '🎣 Pesca: ' + [sp, q, p].filter(Boolean).join(' · ') + (val('fishLogTide') ? ' · 🌊 ' + val('fishLogTide') : ''), fecha: val('fishLogDate') || hoyKey() };
      return { texto: textoVisible('fishingTodayBox', 280) };
    },
    birdsDialog: function () {
      var sp = val('birdSpecies');
      if (sp) return { texto: '🦅 Avistamiento: ' + sp + (val('birdCount') ? ' ×' + val('birdCount') : '') + (val('birdPlace') ? ' · ' + val('birdPlace') : ''), fecha: val('birdDate') || hoyKey() };
      return { texto: textoVisible('birdsTodayBox', 280) };
    },
    intermarealDialog: function () {
      var sp = val('interSpecies');
      if (sp) return { texto: '🦀 Intermareal: ' + sp + (val('interQty') ? ' (' + val('interQty') + ')' : '') + (val('interPlace') ? ' · ' + val('interPlace') : ''), fecha: val('interDate') || hoyKey() };
      return { texto: textoVisible('interTodayBox', 280) };
    },
    bosqueDialog: function () {
      var sp = val('bosqueSpecies');
      if (sp) return { texto: '🌳 Bosque: ' + sp + (val('bosqueQty') ? ' (' + val('bosqueQty') + ')' : '') + (val('bosquePlace') ? ' · ' + val('bosquePlace') : ''), fecha: val('bosqueDate') || hoyKey() };
      return { texto: textoVisible('bosqueTodayBox', 280) };
    },
    medicDialog: function () {
      var n = val('medicName') || val('naturalName'), d = val('medicDose') || val('naturalDose'), h = val('medicTime');
      if (n) return { texto: '🌿 Medicina: ' + n + (d ? ' · ' + d : '') + (h ? ' · 🕐 ' + h : ''), destino: 'compromiso', hora: h || undefined };
      return { texto: '' };
    },
    habitsDialog: function () { return { texto: textoVisible('habitsTodayBox', 280) }; },
    menstrualDialog: function () { return { texto: textoVisible('mensPredictBox', 280) }; },
    astroDialog: function () { return { texto: textoVisible('astroContent', 280) }; },
    comunaDialog: function () { return { texto: textoVisible('comunaContent', 280) }; },
    homeTasksDialog: function () { return { texto: textoVisible('homeTasksResumen', 280) }; },
    energyDialog: function () { return { texto: textoVisible('energyResumen', 280) }; },
    dreamsDialog: function () {
      var t = val('dreamTitle') || val('dreamText') || val('dreamNotes');
      return { texto: t ? '💭 Sueño: ' + t : textoVisible('dreamsList', 280) };
    },
    gratitudDialog: function () {
      var g = [val('grat1') || val('gratitud1'), val('grat2') || val('gratitud2'), val('grat3') || val('gratitud3')].filter(Boolean);
      return { texto: g.length ? '🙏 Gratitud: ' + g.join(' · ') : textoVisible('gratitudList', 280) };
    }
  };

  function sugerenciaPara(dlg) {
    var id = dlg.id || '';
    var h3 = '';
    try { h3 = clean((dlg.querySelector('h3') || {}).textContent || id, 60); } catch (e) { h3 = id; }
    var tab = tabActiva(dlg);
    var origen = h3 + (tab ? ' · ' + tab : '');
    var ext = EXTRACTORES[id];
    if (ext) {
      try {
        var r = ext(h3, dlg) || {};
        return { origen: origen, texto: r.texto || '', fecha: r.fecha, destino: r.destino, hora: r.hora };
      } catch (e) {}
    }
    var g = resumenGenerico(dlg);
    return { origen: h3 + (g.tab ? ' · ' + g.tab : ''), texto: g.texto || '' };
  }

  // ---- Inyección de botones -------------------------------------------------
  function esDialogPropio(dlg) {
    if (!dlg || dlg.tagName !== 'DIALOG') return false;
    if (EXCLUIR[dlg.id]) return false;
    if (dlg.id === '') return false;
    return true;
  }
  function inyectarEnDialogo(dlg) {
    if (!esDialogPropio(dlg)) return;
    if (dlg.querySelector(':scope > form > .dlg-actions .btn-send-day, :scope > form .btn-send-day-head')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-send-day btn-send-day-head';
    btn.style.width = 'auto';
    btn.style.whiteSpace = 'nowrap';
    btn.title = 'Agregar info clave de esta sección a la pantalla del día';
    btn.textContent = '📌 Al día';
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var s = sugerenciaPara(dlg);
      abrir(s.origen, s.texto, { fecha: s.fecha, destino: s.destino, hora: s.hora });
    });
    // Cabecera: junto al botón ✕; si no hay, al inicio del form.
    var header = null;
    try {
      var actions = dlg.querySelectorAll('form > .dlg-actions');
      for (var i = 0; i < actions.length; i++) {
        if (actions[i].querySelector('h3')) { header = actions[i]; break; }
      }
      if (!header && actions.length) header = actions[0];
    } catch (e) {}
    if (header) {
      var closeBtn = header.querySelector('.btn-icon');
      if (closeBtn) header.insertBefore(btn, closeBtn);
      else header.appendChild(btn);
    } else {
      var form = dlg.querySelector('form');
      if (form) form.insertBefore(btn, form.firstChild);
    }
  }
  function inyectarEnTodos() {
    try {
      document.querySelectorAll('dialog').forEach(inyectarEnDialogo);
    } catch (e) {}
  }

  // Botón 📌 por fila de bitácora (subsección con registro individual).
  function textoDeFila(item) {
    try {
      var t = clean(item.innerText || item.textContent || '', 220);
      // Quitar emojis de acción al final (✏️ ✕ 📤).
      return t.replace(/\s*[✏️✕📤🔔🔕📌]+\s*$/g, '').trim();
    } catch (e) { return ''; }
  }
  function inyectarEnListas() {
    LISTAS_FILA.forEach(function (lid) {
      var box = $(lid);
      if (!box) return;
      try {
        var items = box.querySelectorAll('.habit-item, .shop-item, .fin-item, .dream-item, div');
        items.forEach(function (it) {
          if (it.querySelector(':scope > span .btn-send-day-row, :scope .btn-send-day-row')) return;
          // Solo filas con contenido real y con botones de acción (evita contenedores).
          var acciones = it.querySelector('button');
          var txt = textoDeFila(it);
          if (!acciones || !txt || txt.length < 8) return;
          if (it.children.length > 3) return;
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn btn-icon btn-send-day-row';
          b.title = 'Agregar este registro al día';
          b.textContent = '📌';
          b.style.width = 'auto';
          b.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var dlg = it.closest('dialog');
            var base = 'Registro';
            try { base = clean((dlg && dlg.querySelector('h3') || {}).textContent || 'Registro', 40); } catch (e) {}
            abrir(base, textoDeFila(it), {});
          });
          var wrap = it.querySelector('span:last-child');
          if (wrap && wrap.appendChild) wrap.appendChild(b);
          else it.appendChild(b);
        });
      } catch (e) {}
    });
  }

  function inyectarEstilos() {
    if ($('infoClaveStyle')) return;
    var st = document.createElement('style');
    st.id = 'infoClaveStyle';
    st.textContent =
      '.btn-send-day-head{border-color:var(--gold,#e8c56a)!important}' +
      '.btn-send-day-row{font-size:11px!important;padding:2px 6px!important}' +
      '#infoClaveDialog{max-width:560px;width:min(560px,94vw)}' +
      '#infoClaveDialog textarea{width:100%;box-sizing:border-box}' +
      '#icDestinoInfo{font-size:11px}';
    document.head.appendChild(st);
  }

  // showModal puede llamarse antes de que el observer vea el diálogo.
  function parchearShowModal() {
    try {
      if (HTMLDialogElement.prototype.__icPatched) return;
      var orig = HTMLDialogElement.prototype.showModal;
      HTMLDialogElement.prototype.showModal = function () {
        try { inyectarEnDialogo(this); } catch (e) {}
        return orig.apply(this, arguments);
      };
      HTMLDialogElement.prototype.__icPatched = true;
    } catch (e) {}
  }

  function iniciar() {
    inyectarEstilos();
    parchearShowModal();
    inyectarEnTodos();
    inyectarEnListas();
    // Reintentos para diálogos creados tarde (makeDialog, módulos diferidos).
    [600, 1600, 3200].forEach(function (ms) {
      setTimeout(function () { inyectarEnTodos(); inyectarEnListas(); }, ms);
    });
    try {
      var obs = new MutationObserver(function (muts) {
        var toca = false;
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.tagName === 'DIALOG') { inyectarEnDialogo(n); toca = true; }
            else if (n.querySelector) {
              var d = n.querySelector('dialog');
              if (d) { inyectarEnDialogo(d); toca = true; }
              if (n.querySelector('.habit-item, .shop-item, .fin-item')) toca = true;
            }
          });
          if (m.type === 'childList' && m.target && m.target.id && LISTAS_FILA.indexOf(m.target.id) >= 0) toca = true;
        });
        if (toca) inyectarEnListas();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
  }

  window.InfoClave = { abrir: abrir, guardarEnDia: guardarEnDia, mareasActuales: mareasActuales, textoMarea: textoMarea };
  window.abrirInfoClave = abrir;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
