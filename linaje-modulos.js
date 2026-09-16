/* ============================================================
   LINAJE Y MEMORIA — Calendario 13 Lunas (Penco · Bio-Bio)
   Tres secciones completas e independientes:
   1) ARBOL GENEALOGICO (btnArbolFull -> arbolFullDialog)
      Guia + Familia + Circulo lunar + Honrar. Migra datos de
      'arbolLunar' (pestana antigua en Memoria) si existen.
   2) RECAPITULACION (btnRecap -> recapDialog)
      Guia tolteca/psicologica + Inventario + Sesiones + Avance.
   3) DUELO (btnDueloFull -> dueloFullDialog)
      La GUIA aparece PRIMERO (pestana por defecto). Luego:
      Mi proceso + Memoria viva + Rituales + Apoyo.
      Reutiliza 'dueloFecha' y 'dueloMemorias' para compatibilidad
      con la pestana antigua de Practicas Espirituales.
   Todo queda local y privado por usuario (store + scheduleSave).
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
function addDaysKeyLocal(key, days) {
  try {
    if (typeof addDaysKey === 'function') return addDaysKey(key, days);
  } catch (e) {}
  var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + days);
  try { return cal.fmtKey.format(d); } catch (e2) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
function lunaDeFecha(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return { y: r.y, luna: r.luna, dia: r.diaN }; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return { y: null, luna: m.luna, dia: m.dia }; }
  } catch (e) {}
  return null;
}
function lunaTxt(key) {
  var l = lunaDeFecha(key);
  return l ? ('Luna ' + l.luna + ' · dia ' + l.dia) : '';
}
function lunaDeNac(fechaKey) {
  var l = lunaDeFecha(fechaKey);
  return l ? l.luna : null;
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text);
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
function switchTab(prefix, name, tabs) {
  tabs.forEach(function (t) {
    var p = $(prefix + t), b = $('tab' + prefix.charAt(0).toUpperCase() + prefix.slice(1) + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

/* ============================================================
   1) ARBOL GENEALOGICO COMPLETO
   ============================================================ */
var ARB_VINCULOS = ['yo', 'madre', 'padre', 'abuela materna', 'abuelo materno', 'abuela paterna', 'abuelo paterno', 'bisabuela/o', 'tía/o', 'hermana/o', 'pareja', 'hija/o', 'nieta/o', 'madrina/padrino', 'otro'];
var ARB_RAMAS = ['tronco (yo)', 'rama materna', 'rama paterna', 'rama de pareja', 'otra'];
function getArbolFull() {
  var a = store('arbolFull', null);
  if (Array.isArray(a) && a.length) return a;
  // migracion desde pestana antigua 'arbolLunar'
  try {
    var old = store('arbolLunar', []);
    if (Array.isArray(old) && old.length && (!a || !a.length)) {
      var mig = old.map(function (r) {
        return { id: r.id || uid('ab'), nombre: r.nombre || 'Sin nombre', vinc: r.vinc || 'otro', rama: 'otra', nac: '', luna: +r.luna || 1, lugar: '', nota: r.nota || '', partio: !!r.partio };
      });
      try { userData().arbolFull = mig; } catch (e) {}
      save();
      return mig;
    }
  } catch (e) {}
  var b = store('arbolFull', []);
  return Array.isArray(b) ? b : [];
}
function getArbolCartas() { var a = store('arbolCartas', []); return Array.isArray(a) ? a : []; }
function getArbolVelas() { var a = store('arbolVelas', []); return Array.isArray(a) ? a : []; }
var arbolEditId = null;
function switchArbolTab(t) { switchTab('arbF', t, ['Guia', 'Fam', 'Cir', 'Hon']); }

function renderArbolFam() {
  var box = $('arbFFamList'); if (!box) return;
  var q = (($('arbFQ') || {}).value || '').toLowerCase();
  var ramaF = ($('arbFRamaF') || {}).value || 'todas';
  var d = getArbolFull().slice().sort(function (a, b) { return (a.nombre || '').localeCompare(b.nombre || ''); });
  var fil = d.filter(function (r) {
    if (ramaF !== 'todas' && r.rama !== ramaF) return false;
    if (q && ((r.nombre || '') + ' ' + (r.vinc || '') + ' ' + (r.nota || '') + ' ' + (r.lugar || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  var st = $('arbFFamStats');
  if (!fil.length) { box.innerHTML = '<p class="muted">Sin resultados. Agrega a tu gente arriba: parte por madre, padre y abuelas/os.</p>'; }
  else {
    box.innerHTML = fil.map(function (r) {
      var chip = r.partio ? '🕊️ partió' : '🌱 vive';
      var col = r.partio ? '#c9a9c9' : '#8fd694';
      return '<div class="habit-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>' + esc(r.nombre) + '</b> <span class="chip" style="font-size:10px">' + esc(r.vinc || '') + '</span> ' +
        '<span class="chip" style="font-size:10px">' + esc(r.rama || '') + '</span></span>' +
        '<span class="chip" style="font-size:10px;border-color:' + col + '55;color:' + col + '">' + chip + '</span></div>' +
        '<div class="muted" style="font-size:11px;margin-top:4px">🌙 Luna ' + (r.luna || '?') + (r.nac ? ' · nació ' + r.nac + ' (' + esc(lunaTxt(r.nac) || 'fuera de rango') + ')' : ' · sin fecha (luna manual)') +
        (r.lugar ? ' · 📍 ' + esc(r.lugar) : '') + (r.nota ? '<br>💬 ' + esc(r.nota) : '') + '</div>' +
        '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️ Editar</button>' +
        '<button class="btn" style="width:auto;font-size:11px" data-hon="' + r.id + '" title="Alternar honra">🕯️ Honrar</button>' +
        '<button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
    }).join('');
  }
  var tot = d.length, hon = d.filter(function (r) { return r.partio; }).length;
  if (st) st.textContent = tot + ' personas · ' + hon + ' honradas 🕊️ · mostrando ' + fil.length;
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar a esta persona del árbol?')) return; var dd = getArbolFull(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderArbolFam(); renderArbolCir(); }; });
  box.querySelectorAll('[data-hon]').forEach(function (b) { b.onclick = function () { var dd = getArbolFull(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-hon'); }); if (r) r.partio = !r.partio; save('Guardado 🕯️'); renderArbolFam(); renderArbolCir(); }; });
  box.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { var dd = getArbolFull(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-edit'); }); if (!r) return; arbolEditId = r.id;
    $('arbFNombre').value = r.nombre || ''; $('arbFVinc').value = r.vinc || 'otro'; $('arbFRama').value = r.rama || 'otra';
    $('arbFNac').value = r.nac || ''; $('arbFLuna').value = String(r.luna || 1); $('arbFLugar').value = r.lugar || ''; $('arbFNota').value = r.nota || ''; $('arbFPartio').checked = !!r.partio;
    $('arbFAdd').textContent = '↻ Actualizar persona'; $('arbFCancelEdit').classList.remove('hidden');
    $('arbFNombre').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }; });
}
function renderArbolCir() {
  var box = $('arbFCircle'); if (!box) return;
  var d = getArbolFull();
  var porLuna = {};
  d.forEach(function (r) { (porLuna[r.luna] = porLuna[r.luna] || []).push(r); });
  box.innerHTML = Array.from({ length: 13 }, function (_, i) {
    var n = i + 1, names = (porLuna[n] || []).map(function (r) { return esc(r.nombre) + (r.partio ? ' 🕊️' : ''); }).join('<br>');
    return '<div class="chip" style="font-size:10px;text-align:center;min-width:92px;' + (names ? 'border-color:var(--gold)' : '') + '">🌙 L' + n + (names ? '<br><b>' + names + '</b>' : '<br><span class="muted">—</span>') + '</div>';
  }).join('');
  var mat = d.filter(function (r) { return r.rama === 'rama materna'; }).length;
  var pat = d.filter(function (r) { return r.rama === 'rama paterna'; }).length;
  var st = $('arbFCirStats');
  if (st) st.textContent = '🌙 ' + d.length + ' en el círculo · materna: ' + mat + ' · paterna: ' + pat + ' · sin luna: ' + d.filter(function (r) { return !r.luna; }).length;
}
function renderArbolHon() {
  var cb = $('arbFCartas'); if (!cb) return;
  var cartas = getArbolCartas().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  cb.innerHTML = cartas.length ? cartas.map(function (r) {
    return '<div class="habit-item"><b>💌 Para ' + esc(r.para) + '</b> <span class="muted" style="font-size:11px">· ' + r.fecha + ' · ' + esc(lunaTxt(r.fecha)) + '</span><p style="font-size:12px;white-space:pre-wrap">' + esc(r.texto) + '</p><div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Vacío. Escribe una carta de honra: lo que heredaste, lo que agradeces, lo que sueltas.</p>';
  cb.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar carta?')) return; var dd = getArbolCartas(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderArbolHon(); }; });
  cb.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = getArbolCartas(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('💌 Carta de honra para ' + r.para, r.texto); }; });
  var vb = $('arbFVelas');
  if (vb) {
    var velas = getArbolVelas().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 20);
    vb.innerHTML = velas.length ? velas.map(function (r) {
      return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🕯️ <b>' + esc(r.para) + '</b><br><span class="muted" style="font-size:11px">' + r.fecha + ' · ' + esc(r.intencion || '') + '</span></span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
    }).join('') : '<p class="muted">Sin velas encendidas. Enciende una por quien honres hoy.</p>';
    vb.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var dd = getArbolVelas(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderArbolHon(); }; });
  }
}
function renderArbolAll() { try { renderArbolFam(); } catch (e) {} try { renderArbolCir(); } catch (e) {} try { renderArbolHon(); } catch (e) {} }

function setupArbolFull() {
  makeDialog('arbolFullDialog', '🌳 Árbol Genealógico — mi linaje en 13 lunas',
    'Tu familia como <b>círculo, no como línea</b>: cada persona en su luna de nacimiento, con su historia y su honra. Empieza con 3 nombres y crece por lunas. Todo queda <b>privado y local</b> por usuario.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabArbFGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabArbFFam" class="btn" style="width:auto">👨‍👩‍👧 Familia</button>' +
    '<button type="button" id="tabArbFCir" class="btn" style="width:auto">🌙 Círculo lunar</button>' +
    '<button type="button" id="tabArbFHon" class="btn" style="width:auto">🕯️ Honrar</button></div>' +
    '<div id="arbFGuia">' +
      '<div class="si-card"><h4>🌳 ¿Qué es el árbol genealógico lunar?</h4><p>Es el mapa de tu <b>kupalme</b> (linaje): de dónde vienes, qué dones y heridas heredaste y a quién honras. Aquí cada persona se ubica en su <b>luna de nacimiento (1–13)</b>: el círculo muestra de un vistazo qué lunas traen tu fuerza. No es terapia ni documento legal: es memoria viva para conversar en familia.</p></div>' +
      '<div class="si-card"><h4>🚶 Paso a paso (una luna a la vez)</h4><p><b>1)</b> Parte con 3: madre, padre y una abuela/o. Solo nombre + vínculo + luna.<br><b>2)</b> Pregunta en casa: ¿dónde nació? ¿qué le gustaba cocinar/cantar? ¿qué me enseñó?<br><b>3)</b> Ubica la rama: materna, paterna o de pareja. Marca 🕊️ si ya partió.<br><b>4)</b> Cada luna agrega 1–2 personas o 1 historia. En un ciclo (13 lunas) tendrás tu círculo base.</p></div>' +
      '<div class="si-card"><h4>💬 Preguntas que abren memoria</h4><p>¿Qué olor/receta me recuerda a esta persona? · ¿Qué dicho repetía? · ¿Qué superó en su vida? · ¿Qué quiero heredar y qué elijo soltar? · ¿Qué le agradecería hoy en voz alta? Anota lo que salga en “historia/honra”.</p></div>' +
      '<div class="si-card"><h4>🌙 Las lunas de nacimiento</h4><p>Si tienes la fecha, la luna se calcula sola. Si no la tienes (abuelos antiguos), elige la luna manual que te diga la familia o deja la que sientas: lo importante es que esté en el círculo. Los cumpleaños del año se ven con su luna en “Círculo lunar”.</p></div>' +
      '<div class="si-card"><h4>🤝 Cuidado y respeto</h4><p>Hay historias dolorosas (ausencias, violencia, secretos). No fuerces: anota solo lo que puedas sostener. Si algo te remueve fuerte, apóyate en 🪞 Autoconocimiento, 🔁 Recapitulación o tu red/CESFAM. Los datos quedan solo en este dispositivo: comparte únicamente lo que decidas.</p></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="arbFGoFam" class="btn btn-accent" style="width:auto">👨‍👩‍👧 Empezar mi familia →</button></div>' +
    '</div>' +
    '<div id="arbFFam" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Agregar persona</h4>' +
      '<div class="conv-row"><label style="flex:2">Nombre * <input type="text" id="arbFNombre" placeholder="ej: Abuela Rosa" maxlength="40"></label><label>Vínculo <select id="arbFVinc">' + ARB_VINCULOS.map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="conv-row"><label>Rama <select id="arbFRama">' + ARB_RAMAS.map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</select></label><label>Nacimiento <input type="date" id="arbFNac"></label><label>Luna <select id="arbFLuna">' + Array.from({ length: 13 }, function (_, i) { return '<option value="' + (i + 1) + '">Luna ' + (i + 1) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="conv-row"><label style="flex:2">Lugar / territorio <input type="text" id="arbFLugar" placeholder="ej: Lirquén, Penco" maxlength="40"></label><label class="check-row" style="align-self:flex-end"><input type="checkbox" id="arbFPartio"> 🕊️ ya partió</label></div>' +
      '<label>Historia / honra <input type="text" id="arbFNota" placeholder="ej: me enseñó el charquicán y a saludar al mar" maxlength="120"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="arbFAdd" class="btn btn-accent" style="width:auto">+ Agregar al árbol</button><button type="button" id="arbFCancelEdit" class="btn hidden" style="width:auto">Cancelar</button></div>' +
      '<p class="muted" style="font-size:11px">Si pones fecha de nacimiento, la luna se autocompleta. Si no la sabes, elige la luna manual.</p></div>' +
      '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="arbFQ" placeholder="nombre, vínculo, lugar..." autocomplete="off"></label><label>Rama <select id="arbFRamaF"><option value="todas">Todas</option>' + ARB_RAMAS.map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</select></label></div>' +
      '<div id="arbFFamList" class="habits-list" style="margin-top:8px;max-height:300px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="arbFFamStats" class="muted" style="font-size:11px"></span><span style="display:flex;gap:8px"><button type="button" id="arbFShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="arbFClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar todo</button></span></div>' +
    '</div>' +
    '<div id="arbFCir" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌙 Círculo de las 13 lunas</h4><p class="muted" style="font-size:11px">Cada luna agrupa a quienes nacieron en ella. Un círculo lleno = linaje presente; un vacío = historia por preguntar.</p>' +
      '<div id="arbFCircle" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0"></div>' +
      '<span id="arbFCirStats" class="muted" style="font-size:11px"></span></div>' +
    '</div>' +
    '<div id="arbFHon" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>💌 Carta de honra</h4>' +
      '<div class="conv-row"><label>Para <input type="text" id="arbFCartaPara" placeholder="ej: mi mamá" maxlength="30"></label><label>Fecha <input type="date" id="arbFCartaFecha"></label></div>' +
      '<label>Carta <textarea id="arbFCartaTexto" rows="3" placeholder="Lo que heredé de ti... lo que te agradezco... lo que suelto..." maxlength="800"></textarea></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="arbFCartaAdd" class="btn btn-accent" style="width:auto">+ Guardar carta</button></div>' +
      '<div id="arbFCartas" class="habits-list" style="margin-top:8px;max-height:220px"></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🕯️ Encender una vela</h4>' +
      '<div class="conv-row"><label style="flex:2">Por quién <input type="text" id="arbFVelaPara" placeholder="ej: abuelo Manuel" maxlength="30"></label><label style="flex:2">Intención <input type="text" id="arbFVelaInt" placeholder="ej: gracias por el oficio" maxlength="60"></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="arbFVelaAdd" class="btn" style="width:auto">🕯️ Encender hoy</button></div>' +
      '<div id="arbFVelas" class="habits-list" style="margin-top:8px;max-height:200px"></div></div>' +
    '</div>');
  var b = $('btnArbolFull');
  if (b) b.onclick = function () { switchArbolTab('Guia'); renderArbolAll(); openDlg('arbolFullDialog'); };
  if ($('tabArbFGuia')) $('tabArbFGuia').onclick = function () { switchArbolTab('Guia'); };
  if ($('tabArbFFam')) $('tabArbFFam').onclick = function () { switchArbolTab('Fam'); renderArbolFam(); };
  if ($('tabArbFCir')) $('tabArbFCir').onclick = function () { switchArbolTab('Cir'); renderArbolCir(); };
  if ($('tabArbFHon')) $('tabArbFHon').onclick = function () { switchArbolTab('Hon'); renderArbolHon(); };
  if ($('arbFGoFam')) $('arbFGoFam').onclick = function () { switchArbolTab('Fam'); renderArbolFam(); };
  if ($('arbFNac')) $('arbFNac').onchange = function () { var l = lunaDeNac($('arbFNac').value); if (l && $('arbFLuna')) $('arbFLuna').value = String(l); };
  if ($('arbFQ')) $('arbFQ').oninput = function () { renderArbolFam(); };
  if ($('arbFRamaF')) $('arbFRamaF').onchange = function () { renderArbolFam(); };
  if ($('arbFAdd')) $('arbFAdd').onclick = function () {
    var n = clean($('arbFNombre').value, 40); if (!n) return alert('Escribe el nombre');
    var nac = $('arbFNac').value || '';
    var lunaAuto = nac ? lunaDeNac(nac) : null;
    var rec = { id: arbolEditId || uid('ab'), nombre: n, vinc: $('arbFVinc').value || 'otro', rama: $('arbFRama').value || 'otra', nac: nac, luna: lunaAuto || (+$('arbFLuna').value || 1), lugar: clean($('arbFLugar').value, 40), nota: clean($('arbFNota').value, 120), partio: $('arbFPartio').checked };
    var dd = getArbolFull();
    if (arbolEditId) { var i = dd.findIndex(function (x) { return x.id === arbolEditId; }); if (i >= 0) dd[i] = rec; arbolEditId = null; $('arbFAdd').textContent = '+ Agregar al árbol'; $('arbFCancelEdit').classList.add('hidden'); }
    else dd.push(rec);
    save('Persona guardada 🌳');
    $('arbFNombre').value = ''; $('arbFNac').value = ''; $('arbFLugar').value = ''; $('arbFNota').value = ''; $('arbFPartio').checked = false;
    renderArbolFam(); renderArbolCir();
  };
  if ($('arbFCancelEdit')) $('arbFCancelEdit').onclick = function () { arbolEditId = null; $('arbFAdd').textContent = '+ Agregar al árbol'; $('arbFCancelEdit').classList.add('hidden'); ['arbFNombre', 'arbFLugar', 'arbFNota'].forEach(function (id) { var el = $(id); if (el) el.value = ''; }); var c = $('arbFPartio'); if (c) c.checked = false; };
  if ($('arbFShare')) $('arbFShare').onclick = function () { var dd = getArbolFull(); if (!dd.length) return alert('Árbol vacío'); share('🌳 Mi árbol genealógico (' + dd.length + ' personas)', dd.map(function (r) { return '· ' + r.nombre + ' (' + r.vinc + ' · ' + r.rama + ') — Luna ' + r.luna + (r.partio ? ' 🕊️' : ''); }).join('\n')); };
  if ($('arbFClear')) $('arbFClear').onclick = function () { if (!confirm('¿Borrar todo el árbol? (las cartas y velas se mantienen)')) return; try { userData().arbolFull = []; } catch (e) {} save(); renderArbolFam(); renderArbolCir(); };
  if ($('arbFCartaAdd')) $('arbFCartaAdd').onclick = function () {
    var p = clean($('arbFCartaPara').value, 30); if (!p) return alert('¿Para quién es la carta?');
    var x = clean($('arbFCartaTexto').value, 800); if (!x) return alert('Escribe la carta');
    getArbolCartas().push({ id: uid('ac'), para: p, fecha: $('arbFCartaFecha').value || todayKey(), texto: x });
    save('Carta guardada 💌'); $('arbFCartaPara').value = ''; $('arbFCartaTexto').value = ''; renderArbolHon();
  };
  if ($('arbFVelaAdd')) $('arbFVelaAdd').onclick = function () {
    var p = clean($('arbFVelaPara').value, 30); if (!p) return alert('¿Por quién enciendes la vela?');
    getArbolVelas().push({ id: uid('av'), para: p, fecha: todayKey(), intencion: clean($('arbFVelaInt').value, 60) });
    save('Vela encendida 🕯️'); $('arbFVelaPara').value = ''; $('arbFVelaInt').value = ''; renderArbolHon();
  };
  try { renderArbolAll(); } catch (e) {}
}

/* ============================================================
   2) RECAPITULACION COMPLETA
   ============================================================ */
var RECAP_EMO = ['tristeza', 'rabia', 'miedo', 'vergüenza', 'culpa', 'alegría', 'amor', 'gratitud', 'confusión', 'otra'];
var RECAP_TEC = ['respiración de barrido', 'escritura libre', 'carta no enviada', 'silla vacía (diálogo)', 'revisitar con compasión', 'acto de reparación', 'otra'];
function getRecapInv() { var a = store('recapInventario', []); return Array.isArray(a) ? a : []; }
function getRecapSes() { var a = store('recapSesiones', []); return Array.isArray(a) ? a : []; }
var recapEditId = null;
function switchRecapTab(t) { switchTab('rec', t, ['Guia', 'Inv', 'Ses', 'Ava']); }
function recapRacha() {
  var set = {};
  getRecapSes().forEach(function (r) { set[r.fecha] = true; });
  var s = 0, cur = new Date(todayKey() + 'T12:00:00');
  if (!set[todayKey()]) cur = new Date(cur.getTime() - 86400000);
  for (var i = 0; i < 365; i++) {
    var k = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0') + '-' + String(cur.getDate()).padStart(2, '0');
    if (set[k]) s++; else break;
    cur = new Date(cur.getTime() - 86400000);
  }
  return s;
}
function renderRecapInv() {
  var box = $('recInvList'); if (!box) return;
  var q = (($('recInvQ') || {}).value || '').toLowerCase();
  var f = ($('recInvF') || {}).value || 'todos';
  var d = getRecapInv().slice().sort(function (a, b) { return (b.inten || 0) - (a.inten || 0); });
  var fil = d.filter(function (r) {
    if (f !== 'todos' && r.estado !== f) return false;
    if (q && ((r.titulo || '') + ' ' + (r.persona || '') + ' ' + (r.nota || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  box.innerHTML = fil.length ? fil.map(function (r) {
    var col = r.estado === 'liberado' ? '#8fd694' : (r.estado === 'en proceso' ? '#e8c56a' : '#c9a9c9');
    return '<div class="habit-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>' + esc(r.titulo) + '</b></span><span class="chip" style="font-size:10px;border-color:' + col + '55;color:' + col + '">' + esc(r.estado || 'pendiente') + '</span></div>' +
      '<div class="muted" style="font-size:11px;margin-top:4px">' + (r.persona ? '👤 ' + esc(r.persona) + ' · ' : '') + (r.edad ? '⏳ ' + esc(r.edad) + ' · ' : '') + (r.emo ? '💧 ' + esc(r.emo) : '') + ' · intensidad ' + (r.inten || 0) + '/10' + (r.nota ? '<br>📝 ' + esc(r.nota) : '') + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️</button><button class="btn" style="width:auto;font-size:11px" data-next="' + r.id + '" title="Avanzar estado">⏭ ' + (r.estado === 'pendiente' ? 'en proceso' : 'liberado') + '</button><button class="btn" style="width:auto;font-size:11px" data-ses="' + r.id + '" title="Llevar a sesión">🧘 Sesión</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Inventario vacío. Anota 1 evento pendiente arriba: lo que se nombra, se puede soltar.</p>';
  var st = $('recInvStats');
  if (st) st.textContent = d.length + ' eventos · ' + d.filter(function (r) { return r.estado === 'liberado'; }).length + ' liberados · ' + d.filter(function (r) { return r.estado === 'en proceso'; }).length + ' en proceso';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar del inventario?')) return; var dd = getRecapInv(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderRecapInv(); renderRecapAva(); }; });
  box.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { var dd = getRecapInv(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-next'); }); if (!r) return; r.estado = r.estado === 'pendiente' ? 'en proceso' : 'liberado'; save(r.estado === 'liberado' ? 'Liberado 🔓' : 'En proceso 🔁'); renderRecapInv(); renderRecapAva(); }; });
  box.querySelectorAll('[data-ses]').forEach(function (b) { b.onclick = function () { var dd = getRecapInv(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-ses'); }); if (r && $('recSesEvento')) $('recSesEvento').value = r.titulo; switchRecapTab('Ses'); }; });
  box.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { var dd = getRecapInv(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-edit'); }); if (!r) return; recapEditId = r.id;
    $('recInvTitulo').value = r.titulo || ''; $('recInvPersona').value = r.persona || ''; $('recInvEdad').value = r.edad || ''; $('recInvEmo').value = r.emo || RECAP_EMO[0]; $('recInvInten').value = String(r.inten || 5); $('recInvEstado').value = r.estado || 'pendiente'; $('recInvNota').value = r.nota || '';
    $('recInvAdd').textContent = '↻ Actualizar'; $('recInvCancel').classList.remove('hidden');
  }; });
}
function renderRecapSes() {
  var box = $('recSesList'); if (!box) return;
  var d = getRecapSes().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = d.length ? d.slice(0, 40).map(function (r) {
    return '<div class="habit-item"><b>🧘 ' + r.fecha + '</b> · ' + (+r.min || 0) + ' min · ' + esc(r.tec || '') + '<br><span class="muted" style="font-size:11px">📌 ' + esc(r.evento || 'libre') + ' · ' + (r.antes !== '' ? r.antes + '→' + r.despues + '/10' : '') + ' · ' + esc(lunaTxt(r.fecha)) + '</span>' + (r.insight ? '<p style="font-size:12px">💡 ' + esc(r.insight) + '</p>' : '') +
      '<div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin sesiones aún. Agenda 10 minutos hoy: un evento, una respiración, una frase de cierre.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar sesión?')) return; var dd = getRecapSes(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderRecapSes(); renderRecapAva(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = getRecapSes(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🔁 Sesión de recapitulación ' + r.fecha, '📌 ' + (r.evento || '') + '\n' + r.tec + ' · ' + r.min + ' min\n💡 ' + (r.insight || '')); }; });
  var st = $('recSesStats');
  if (st) { var mins = d.reduce(function (a, r) { return a + (+r.min || 0); }, 0); st.textContent = d.length + ' sesiones · ' + mins + ' min · racha ' + recapRacha() + ' días'; }
}
function renderRecapAva() {
  var box = $('recAvaBox'); if (!box) return;
  var inv = getRecapInv(), ses = getRecapSes();
  var lib = inv.filter(function (r) { return r.estado === 'liberado'; }).length;
  var pct = inv.length ? Math.round(lib / inv.length * 100) : 0;
  var mins = ses.reduce(function (a, r) { return a + (+r.min || 0); }, 0);
  box.innerHTML = '<p class="muted" style="font-size:11px">🔓 Liberados: <b>' + lib + '/' + inv.length + '</b> (' + pct + '%)</p>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a,#8fd694)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">🧘 ' + ses.length + ' sesiones · ⏱ ' + mins + ' min · 🔥 racha ' + recapRacha() + ' días</p>' +
    '<p class="muted" style="font-size:11px">Ritmo sugerido: 1 evento por sesión, 2–3 sesiones por luna. Lo liberado se celebra; lo pendiente se respeta.</p>';
}
function renderRecapAll() { try { renderRecapInv(); } catch (e) {} try { renderRecapSes(); } catch (e) {} try { renderRecapAva(); } catch (e) {} }

function setupRecap() {
  makeDialog('recapDialog', '🔁 Recapitulación — repasar para liberar',
    'Práctica tolteca y psicológica de <b>repasar tu vida para recuperar energía</b>: nombras, respiras, comprendes y sueltas. Un evento a la vez. Todo queda <b>privado y local</b>.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabRecGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabRecInv" class="btn" style="width:auto">📋 Inventario</button>' +
    '<button type="button" id="tabRecSes" class="btn" style="width:auto">🧘 Sesiones</button>' +
    '<button type="button" id="tabRecAva" class="btn" style="width:auto">📊 Mi avance</button></div>' +
    '<div id="recGuia">' +
      '<div class="si-card"><h4>🔁 ¿Qué es recapitular?</h4><p>Es <b>volver a pasar por tu historia con conciencia</b>: recuerdas un evento con el cuerpo (dónde estabas, qué sentiste), respiras para soltar la carga y rescatas el aprendizaje. Los toltecas (Castaneda) la usan para recuperar energía atrapada en el pasado; la psicología la reconoce como exposición + reprocesamiento + perdón. No cambias lo que pasó: <b>cambias lo que pesa</b>.</p></div>' +
      '<div class="si-card"><h4>🧭 ¿Para qué sirve y para qué no?</h4><p><b>Sirve para:</b> rencores viejos, vergüenzas, duelos atorados, patrones que se repiten, miedo que ya no corresponde.<br><b>No es para:</b> borrar culpas sin reparar, apurar un duelo fresco ni revivir trauma grave a solas. Si un recuerdo te desborda (llanto incontrolable, disociación, ideas de daño), <b>detente y pide apoyo</b>: *4141 (Chile, 24h), tu CESFAM o terapeuta. Con trauma grave, hazla acompañada.</p></div>' +
      '<div class="si-card"><h4>🕯️ Preparación (5 minutos)</h4><p><b>1)</b> Lugar tranquilo, celu en silencio, cuaderno a mano.<br><b>2)</b> Elige UN evento del inventario (empieza por intensidad ≤6).<br><b>3)</b> Cuerpo: espalda recta, pies en tierra, 3 respiraciones lentas.<br><b>4)</b> Intención en voz alta: “repaso para comprender y soltar, sin juzgarme”.</p></div>' +
      '<div class="si-card"><h4>🌬️ La respiración de barrido (corazón de la práctica)</h4><p>Inhala girando suavemente la cabeza a la <b>derecha</b> recogiendo la escena; exhala girando a la <b>izquierda</b> soltándola. 10–20 ciclos por recuerdo, sin forzar. Si te mareas, vuelve a respiración normal. Cierra con 3 respiraciones al centro agradeciendo el aprendizaje.</p></div>' +
      '<div class="si-card"><h4>📝 Sesión tipo (10–20 min)</h4><p><b>1)</b> Nombra: ¿qué pasó, con quién, a qué edad?<br><b>2)</b> Siente: ¿dónde lo siento en el cuerpo? ¿del 0 al 10?<br><b>3)</b> Barre con la respiración 10–20 ciclos.<br><b>4)</b> Comprende: ¿qué necesitaba yo entonces? ¿qué necesita hoy?<br><b>5)</b> Repara o perdona (a veces basta una frase; otras pide un acto real).<br><b>6)</b> Anota 1 insight y marca intensidad final.<br><b>7)</b> Cierra: agua, caminar, anotar. No encadenes 3 eventos fuertes seguidos.</p></div>' +
      '<div class="si-card"><h4>⚠️ Cuidados</h4><p>Una sesión = un evento. Si la intensidad sube a 9–10 y no baja, cierra con respiración normal y retoma otro día o con apoyo. No uses alcohol/drogas para “recordar mejor”. Lo liberado se marca 🔓; lo que vuelve se trabaja de nuevo sin culpa: las capas se sueltan por lunas.</p></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="recGoInv" class="btn btn-accent" style="width:auto">📋 Hacer mi inventario →</button></div>' +
    '</div>' +
    '<div id="recInv" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Evento al inventario</h4>' +
      '<label>Evento * <input type="text" id="recInvTitulo" placeholder="ej: pelea con mi hermano en el 2010" maxlength="60"></label>' +
      '<div class="conv-row"><label style="flex:2">Persona relacionada <input type="text" id="recInvPersona" placeholder="ej: mi hermano" maxlength="30"></label><label>Edad / época <input type="text" id="recInvEdad" placeholder="ej: 15 años" maxlength="20"></label></div>' +
      '<div class="conv-row"><label>Emoción <select id="recInvEmo">' + RECAP_EMO.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label><label>Intensidad (0-10) <input type="number" id="recInvInten" min="0" max="10" value="5" style="width:80px"></label><label>Estado <select id="recInvEstado"><option value="pendiente">pendiente</option><option value="en proceso">en proceso</option><option value="liberado">liberado</option></select></label></div>' +
      '<label>Nota <input type="text" id="recInvNota" placeholder="lo que pesa en una frase..." maxlength="120"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="recInvAdd" class="btn btn-accent" style="width:auto">+ Guardar</button><button type="button" id="recInvCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
      '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="recInvQ" placeholder="evento, persona..." autocomplete="off"></label><label>Estado <select id="recInvF"><option value="todos">Todos</option><option value="pendiente">pendiente</option><option value="en proceso">en proceso</option><option value="liberado">liberado</option></select></label></div>' +
      '<div id="recInvList" class="habits-list" style="margin-top:8px;max-height:300px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="recInvStats" class="muted" style="font-size:11px"></span><button type="button" id="recInvShare" class="btn" style="width:auto">📤 Compartir resumen</button></div>' +
    '</div>' +
    '<div id="recSes" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Registrar sesión</h4>' +
      '<div class="conv-row"><label>Fecha <input type="date" id="recSesFecha"></label><label>Minutos <input type="number" id="recSesMin" min="1" max="120" value="15" style="width:80px"></label></div>' +
      '<label>Evento trabajado <input type="text" id="recSesEvento" placeholder="elige del inventario o escribe libre" maxlength="60"></label>' +
      '<div class="conv-row"><label style="flex:2">Técnica <select id="recSesTec">' + RECAP_TEC.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label><label>Antes (0-10) <input type="number" id="recSesAntes" min="0" max="10" value="6" style="width:80px"></label><label>Después (0-10) <input type="number" id="recSesDespues" min="0" max="10" value="4" style="width:80px"></label></div>' +
      '<label>💡 Insight / aprendizaje <input type="text" id="recSesInsight" placeholder="ej: necesitaba que me escucharan, hoy me escucho yo" maxlength="140"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="recSesAdd" class="btn btn-accent" style="width:auto">+ Guardar sesión</button></div></div>' +
      '<div id="recSesList" class="habits-list" style="margin-top:10px;max-height:300px"></div>' +
      '<span id="recSesStats" class="muted" style="font-size:11px"></span>' +
    '</div>' +
    '<div id="recAva" class="hidden"><div id="recAvaBox" class="menstrual-card" style="border-color:var(--gold)"></div></div>');
  var b = $('btnRecap');
  if (b) b.onclick = function () { if ($('recSesFecha') && !$('recSesFecha').value) $('recSesFecha').value = todayKey(); switchRecapTab('Guia'); renderRecapAll(); openDlg('recapDialog'); };
  if ($('tabRecGuia')) $('tabRecGuia').onclick = function () { switchRecapTab('Guia'); };
  if ($('tabRecInv')) $('tabRecInv').onclick = function () { switchRecapTab('Inv'); renderRecapInv(); };
  if ($('tabRecSes')) $('tabRecSes').onclick = function () { switchRecapTab('Ses'); renderRecapSes(); };
  if ($('tabRecAva')) $('tabRecAva').onclick = function () { switchRecapTab('Ava'); renderRecapAva(); };
  if ($('recGoInv')) $('recGoInv').onclick = function () { switchRecapTab('Inv'); renderRecapInv(); };
  if ($('recInvQ')) $('recInvQ').oninput = function () { renderRecapInv(); };
  if ($('recInvF')) $('recInvF').onchange = function () { renderRecapInv(); };
  if ($('recInvAdd')) $('recInvAdd').onclick = function () {
    var t = clean($('recInvTitulo').value, 60); if (!t) return alert('Nombra el evento');
    var rec = { id: recapEditId || uid('ri'), titulo: t, persona: clean($('recInvPersona').value, 30), edad: clean($('recInvEdad').value, 20), emo: $('recInvEmo').value, inten: Math.max(0, Math.min(10, +$('recInvInten').value || 0)), estado: $('recInvEstado').value || 'pendiente', nota: clean($('recInvNota').value, 120) };
    var dd = getRecapInv();
    if (recapEditId) { var i = dd.findIndex(function (x) { return x.id === recapEditId; }); if (i >= 0) dd[i] = rec; recapEditId = null; $('recInvAdd').textContent = '+ Guardar'; $('recInvCancel').classList.add('hidden'); }
    else dd.push(rec);
    save('Evento guardado 🔁'); $('recInvTitulo').value = ''; $('recInvNota').value = ''; renderRecapInv(); renderRecapAva();
  };
  if ($('recInvCancel')) $('recInvCancel').onclick = function () { recapEditId = null; $('recInvAdd').textContent = '+ Guardar'; $('recInvCancel').classList.add('hidden'); $('recInvTitulo').value = ''; };
  if ($('recInvShare')) $('recInvShare').onclick = function () { var dd = getRecapInv(); if (!dd.length) return alert('Inventario vacío'); share('🔁 Mi inventario de recapitulación', dd.map(function (r) { return '· [' + r.estado + '] ' + r.titulo + ' (' + (r.persona || '?') + ') ' + r.inten + '/10'; }).join('\n')); };
  if ($('recSesAdd')) $('recSesAdd').onclick = function () {
    var ev = clean($('recSesEvento').value, 60) || 'libre';
    getRecapSes().push({ id: uid('rs'), fecha: $('recSesFecha').value || todayKey(), evento: ev, tec: $('recSesTec').value, min: Math.max(1, +$('recSesMin').value || 15), antes: $('recSesAntes').value, despues: $('recSesDespues').value, insight: clean($('recSesInsight').value, 140) });
    save('Sesión guardada 🧘'); $('recSesEvento').value = ''; $('recSesInsight').value = ''; renderRecapSes(); renderRecapAva();
  };
  try { renderRecapAll(); } catch (e) {}
}

/* ============================================================
   3) DUELO — GUIA PRIMERO
   ============================================================ */
var DUE_ETAPAS = ['negación / shock', 'ira / rabia', 'negociación (y si...)', 'tristeza profunda', 'aceptación / integración', 'oleaje (va y viene)', 'otra'];
var DUE_NECES = ['llorar tranquila/o', 'hablar del que partió', 'silencio y descanso', 'abrazo / compañía', 'ordenar sus cosas', 'escribirle', 'caminar / respirar', 'rezar / cantar', 'otra'];
var DUE_TIPOS = ['historia', 'receta', 'canción', 'dicho', 'carta', 'foto (descripción)'];
function getDueloCheck() { var a = store('dueloCheck', []); return Array.isArray(a) ? a : []; }
function getDueloMem() { var a = store('dueloMemorias', []); return Array.isArray(a) ? a : []; }
function getDueloVelas() { var a = store('dueloVelas', []); return Array.isArray(a) ? a : []; }
function dueloRitualesFull(fecha) {
  // Compatibilidad: hitos fijos de una fecha (los usa la vista simple).
  // La vista completa usa dueloHitosPersona() con varias personas y fechas anuales.
  var out = [];
  try {
    out.push({ k: 'd3', n: '🕯️ 3 días — velorio y despedida', f: addDaysKeyLocal(fecha, 3), txt: 'Acompañar, velar, contar historias. Comer juntos lo que le gustaba.' });
    out.push({ k: 'd9', n: '🙏 9 días — novenario', f: addDaysKeyLocal(fecha, 9), txt: 'Cierre de la novena: rezo, canto o círculo íntimo. En Chile se acompaña 9 noches.' });
    out.push({ k: 'd40', n: '🕊️ 40 días — cuarentena', f: addDaysKeyLocal(fecha, 40), txt: 'Misa o ritual de los 40 días: ordenar sus cosas con calma, encender vela.' });
    out.push({ k: 'l1', n: '🌙 1 luna (28 días) — primer círculo', f: addDaysKeyLocal(fecha, 28), txt: 'La primera luna sin su cuerpo. Ritual simple: visita, carta, limpieza de su espacio con respeto.' });
    out.push({ k: 'l3', n: '🌗 3 lunas (84 días) — asentamiento', f: addDaysKeyLocal(fecha, 84), txt: 'El shock baja y aparece el vacío real. Pedir compañía, ordenar papeles y objetos con calma.' });
    out.push({ k: 'm6', n: '🍂 6 meses — medio año', f: addDaysKeyLocal(fecha, 183), txt: 'Revisar cómo va el corazón: ¿qué necesito ahora? Ritual de medio camino.' });
    out.push({ k: 'a1', n: '☀️ 1 año — primer aniversario', f: addDaysKeyLocal(fecha, 365), txt: 'Celebrar su vida: cocinar su receta, plantar, cantar, contar su historia a los niños.' });
  } catch (e) {}
  return out;
}
/* ---------- calendario de memoria ampliado: varias personas + hitos anuales ---------- */
function getDueloPersonas() {
  var a = store('dueloPersonas', null);
  if (Array.isArray(a)) return a;
  var arr = [];
  try {
    var f = store('dueloFecha', '');
    if (f) arr.push({ id: uid('dpers'), nombre: 'Mi ser querido', fecha: f, cumple: '' });
    userData().dueloPersonas = arr;
  } catch (e) { return arr; }
  return arr;
}
function getDueloHitosDone() { var o = store('dueloHitosDone', {}); return (o && typeof o === 'object') ? o : {}; }
function fmtKeyLocal(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function addYearsKeyLocal(key, n) {
  var d = new Date(key + 'T12:00:00'); if (isNaN(d.getTime())) return '';
  var m = d.getMonth();
  d.setFullYear(d.getFullYear() + n);
  if (d.getMonth() !== m) d.setDate(0); // 29 feb -> 28 feb
  try { return cal.fmtKey.format(d); } catch (e) { return fmtKeyLocal(d); }
}
function nextAniv(fecha, hoy) {
  for (var num = 2; num <= 60; num++) {
    var f = addYearsKeyLocal(fecha, num);
    if (f && f >= hoy) return { num: num, f: f };
  }
  return null;
}
function nextYearlyMD(md, hoy) {
  // md: 'MM-DD'
  if (!md || md.length !== 5) return '';
  var y = hoy.slice(0, 4);
  var f = y + '-' + md;
  if (f < hoy) f = String(+y + 1) + '-' + md;
  return f;
}
function nextTodosSantos(hoy) {
  var y = hoy.slice(0, 4);
  var f = y + '-11-01';
  if (f < hoy) f = String(+y + 1) + '-11-01';
  return f;
}
function dueloHitosPersona(p, hoy) {
  var out = [];
  function push(k, n, f, txt, tag) { if (f) out.push({ k: k, n: n, f: f, txt: txt, tag: tag || '' }); }
  if (p.fecha) {
    push('d3', '🕯️ 3 días — velorio y despedida', addDaysKeyLocal(p.fecha, 3), 'Acompañar, velar, contar historias. Comer juntos lo que le gustaba.', 'primeros días');
    push('d9', '🙏 9 días — novenario', addDaysKeyLocal(p.fecha, 9), 'Cierre de la novena en Chile: rezo, canto o círculo íntimo 9 noches.', 'tradición');
    push('d40', '🕊️ 40 días — cuarentena', addDaysKeyLocal(p.fecha, 40), 'Misa o ritual de los 40 días: ordenar sus cosas con calma, encender vela.', 'tradición');
    push('l1', '🌙 1 luna (28 días) — primer círculo', addDaysKeyLocal(p.fecha, 28), 'La primera luna sin su cuerpo: visita, carta, limpieza de su espacio con respeto.', 'luna');
    push('l3', '🌗 3 lunas (84 días) — asentamiento', addDaysKeyLocal(p.fecha, 84), 'Baja el shock y aparece el vacío real: pedir compañía, ordenar papeles sin apuro.', 'luna');
    push('m6', '🍂 6 meses — medio año', addDaysKeyLocal(p.fecha, 183), 'Medio camino del primer año: revisar el corazón y lo que se necesita ahora.', 'tiempo');
    push('a1', '☀️ 1 año — primer aniversario', addDaysKeyLocal(p.fecha, 365), 'Celebrar su vida: su receta, plantar, cantar, contar su historia a los niños.', 'aniversario');
    var nx = nextAniv(p.fecha, hoy);
    if (nx) push('aniv' + nx.num, '☀️ ' + nx.num + 'º aniversario', nx.f, 'Cada año vuelve su fecha: memoria viva, visita, comida compartida en su nombre.', 'aniversario');
  }
  if (p.cumple) {
    var md = String(p.cumple).length > 5 ? String(p.cumple).slice(5) : String(p.cumple);
    push('cumple', '🎂 Su cumpleaños — celebrar su vida', nextYearlyMD(md, hoy), 'El día que llegó: cocinar lo que le gustaba, brindar, contar su historia.', 'anual');
  }
  push('nov1', '🌼 1 nov — Todos los Santos', nextTodosSantos(hoy), 'Ir al cementerio, llevar flores, limpiar su nicho y acompañar en familia.', 'anual');
  out.sort(function (a, b) { return a.f.localeCompare(b.f); });
  return out;
}
function dueloHitoKey(pid, h) { return pid + '|' + h.k + '|' + h.f; }
var dueloPersSel = null;
var dueloPersEditId = null;
function dueloSelPersona() {
  var ps = getDueloPersonas();
  if (!ps.length) return null;
  var sel = null;
  for (var i = 0; i < ps.length; i++) if (ps[i].id === dueloPersSel) sel = ps[i];
  if (!sel) sel = ps[0];
  dueloPersSel = sel.id;
  return sel;
}
function switchDueloTab(t) { switchTab('dueF', t, ['Guia', 'Proc', 'Mem', 'Rit', 'Apo']); }
function renderDueloProc() {
  var box = $('dueFProcList'); if (!box) return;
  var d = getDueloCheck().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  box.innerHTML = d.length ? d.slice(0, 30).map(function (r) {
    return '<div class="habit-item"><b>' + r.fecha + '</b> · ' + esc(r.etapa || '') + ' · intensidad ' + (r.inten || 0) + '/10<br><span class="muted" style="font-size:11px">Necesito: ' + esc(r.neces || '') + ' · ' + esc(lunaTxt(r.fecha)) + '</span>' + (r.nota ? '<p style="font-size:12px">' + esc(r.nota) + '</p>' : '') +
      '<button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('') : '<p class="muted">Sin registros. Marca cómo estás hoy: ponerle nombre al dolor también es acompañarlo.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar registro?')) return; var dd = getDueloCheck(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderDueloProc(); }; });
  var st = $('dueFProcStats');
  if (st) st.textContent = d.length ? (d.length + ' registros · último: ' + d[0].fecha + ' (' + d[0].etapa + ')') : '0 registros';
}
function renderDueloCal() {
  var hoy = todayKey();
  var ps = getDueloPersonas();
  var selBox = $('dueFPersSel');
  if (selBox) {
    selBox.innerHTML = ps.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre || 'Sin nombre') + (p.fecha ? ' · ' + p.fecha : '') + '</option>'; }).join('');
    if (ps.length) {
      var ok = false;
      for (var i = 0; i < ps.length; i++) if (ps[i].id === dueloPersSel) ok = true;
      selBox.value = ok ? dueloPersSel : ps[0].id;
      dueloPersSel = selBox.value;
    }
  }
  var calBox = $('dueFRituales');
  if (!calBox) return;
  var nextBox = $('dueFNext');
  var statsBox = $('dueFCalStats');
  var p = dueloSelPersona();
  if (!p) {
    calBox.innerHTML = '<p class="muted">Agrega a la persona que partió abajo: nombre + fecha de partida. Puedes llevar el calendario de varias personas a la vez.</p>';
    if (nextBox) nextBox.innerHTML = '';
    if (statsBox) statsBox.textContent = '0 personas en el calendario';
    return;
  }
  var hitos = dueloHitosPersona(p, hoy);
  var done = getDueloHitosDone();
  var hechos = hitos.filter(function (h) { return done[dueloHitoKey(p.id, h)]; }).length;
  var prox = null;
  for (var j = 0; j < hitos.length; j++) {
    if (hitos[j].f >= hoy && !done[dueloHitoKey(p.id, hitos[j])]) { prox = hitos[j]; break; }
  }
  if (nextBox) {
    if (prox) {
      var dias = Math.round((new Date(prox.f + 'T12:00:00') - new Date(hoy + 'T12:00:00')) / 86400000);
      nextBox.innerHTML = '🔔 Próximo para <b>' + esc(p.nombre || '') + '</b>: <b>' + esc(prox.n) + '</b> → ' + prox.f +
        (dias === 0 ? ' <span class="chip" style="font-size:10px">🕯️ HOY</span>' : ' <span class="chip" style="font-size:10px">en ' + dias + ' días</span>') +
        '<br><span class="muted">' + esc(lunaTxt(prox.f) || '') + ' · ' + esc(prox.txt) + '</span>';
    } else {
      nextBox.innerHTML = '✅ <b>' + esc(p.nombre || '') + '</b> al día: todos sus hitos honrados. La memoria sigue viva en 📓 Memoria viva.';
    }
  }
  calBox.innerHTML = hitos.map(function (h) {
    var key = dueloHitoKey(p.id, h);
    var isDone = !!done[key];
    var diff = Math.round((new Date(h.f + 'T12:00:00') - new Date(hoy + 'T12:00:00')) / 86400000);
    var est = h.f === hoy ? '🕯️ <b>HOY</b>' : (h.f < hoy ? (isDone ? 'honrado ✓' : 'pasó · márcalo si lo viviste') : 'en ' + diff + ' días');
    return '<div class="si-card"' + (isDone ? ' style="opacity:.8;border-color:rgba(143,214,148,.45)"' : '') + '><h4>' + esc(h.n) + ' → ' + h.f + ' <span class="chip" style="font-size:10px">' + est + '</span>' + (h.tag ? ' <span class="chip" style="font-size:10px">' + esc(h.tag) + '</span>' : '') + '</h4><p>' + esc(h.txt) + ' <span class="muted">(' + esc(lunaTxt(h.f) || 'luna fuera de rango') + ')</span></p>' +
      '<div style="display:flex;gap:6px"><button type="button" class="btn" style="width:auto;font-size:11px" data-hito="' + esc(key) + '">' + (isDone ? '↩ Desmarcar' : '✅ Marcar honrado') + '</button></div></div>';
  }).join('');
  calBox.querySelectorAll('[data-hito]').forEach(function (b) {
    b.onclick = function () {
      var k = b.getAttribute('data-hito');
      var was = !!getDueloHitosDone()[k];
      try {
        var dd = getDueloHitosDone();
        if (was) delete dd[k];
        else dd[k] = { cuando: todayKey() };
        userData().dueloHitosDone = dd;
      } catch (e) {}
      save(was ? 'Hito desmarcado' : 'Hito honrado 🕯️');
      renderDueloMem();
    };
  });
  if (statsBox) statsBox.innerHTML = '📅 <b>' + esc(p.nombre || '') + '</b>: ' + hechos + '/' + hitos.length + ' hitos honrados · partida ' + esc(p.fecha || '—') + (p.cumple ? ' · cumple ' + esc(String(p.cumple).slice(5)) : '');
}
function renderDueloMem() {
  renderDueloCal();
  var ps = getDueloPersonas();
  var dl = $('dueFParaList');
  if (dl) dl.innerHTML = ps.map(function (p) { return '<option value="' + esc(p.nombre || '') + '">'; }).join('');
  var flt = $('dueFMemFiltro');
  var fval = 'todas';
  if (flt) {
    var cur = flt.value || 'todas';
    flt.innerHTML = '<option value="todas">Todas las memorias</option>' + ps.map(function (p) { return '<option value="' + esc(p.nombre || '') + '">De ' + esc(p.nombre || '') + '</option>'; }).join('');
    var has = cur === 'todas';
    if (!has) for (var i = 0; i < ps.length; i++) if ((ps[i].nombre || '') === cur) has = true;
    flt.value = has ? cur : 'todas';
    fval = flt.value;
  }
  var box = $('dueFMemList'); if (!box) return;
  var mall = getDueloMem().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  var m = mall.filter(function (r) { return fval === 'todas' || (r.para || '') === fval; });
  box.innerHTML = m.length ? m.map(function (r) {
    return '<div class="habit-item"><b>' + esc(r.icon || '🕊️') + ' ' + esc(r.titulo) + '</b> <span class="chip" style="font-size:10px">' + esc(r.tipo) + '</span>' + (r.para ? ' <span class="chip" style="font-size:10px">para ' + esc(r.para) + '</span>' : '') + '<br><span class="muted" style="font-size:11px">' + r.fecha + ' · ' + esc(lunaTxt(r.fecha)) + '</span><p style="font-size:12px;white-space:pre-wrap">' + esc(r.texto) + '</p><div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-share="' + r.id + '">📤</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Vacío' + (fval === 'todas' ? '. Guarda su receta, su canción, su dicho, una carta que no alcanzaste a darle.' : ' para ' + esc(fval) + '. Guarda arriba la primera memoria para esta persona.') + '</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('¿Borrar memoria?')) return; var dd = getDueloMem(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderDueloMem(); }; });
  box.querySelectorAll('[data-share]').forEach(function (b) { b.onclick = function () { var dd = getDueloMem(); var r = dd.find(function (x) { return x.id === b.getAttribute('data-share'); }); if (r) share('🕊️ Memoria viva: ' + r.titulo, r.texto); }; });
  var st = $('dueFMemStats'); if (st) st.textContent = m.length + ' memorias' + (fval === 'todas' ? '' : ' para ' + fval) + ' · ' + mall.length + ' en total · privadas en este dispositivo';
}
/* ---------- rituales: catálogo de ideas + compromisos con seguimiento ---------- */
var DUE_RIT_MOMS = ['despedida', 'primeras semanas', 'cada luna', 'aniversarios', 'cotidiano'];
var DUE_RIT_IDEAS = [
  { n: '🕯️ Vela de los viernes', mom: 'cotidiano', frec: 'cada semana', txt: 'Cada viernes enciende una vela a la misma hora, nómbralo en voz alta y cuéntale tu semana. 5 minutos que ordenan el duelo.' },
  { n: '🙏 Novenario: 9 noches', mom: 'despedida', frec: 'una sola vez', txt: 'Tradición chilena: acompañar 9 noches con rezo, canto, velas o círculo íntimo. Cada noche un recuerdo distinto.' },
  { n: '🕊️ Misa o ritual de 40 días', mom: 'primeras semanas', frec: 'una sola vez', txt: 'A los 40 días: misa, visita al cementerio o ritual familiar. Se ordenan sus cosas con calma y se enciende vela.' },
  { n: '🧺 Ordenar sus cosas por partes', mom: 'primeras semanas', frec: 'cada semana', txt: 'Sin apuro: un cajón o repisa por vez. Guarda 3 tesoros, regala lo útil, agradece el resto. Si duele mucho, detente y retoma otra luna.' },
  { n: '🍲 Cocinar su receta', mom: 'cada luna', frec: 'cada luna', txt: 'Una luna al mes cocina lo que le gustaba, con su música. Come con alguien y cuenta una historia suya en la mesa.' },
  { n: '💌 Carta en luna llena', mom: 'cada luna', frec: 'cada luna', txt: 'Cada luna llena escríbele una carta corta: lo que pasó, lo que extrañas, lo que agradeces. Guárdalas en 📓 Memoria viva.' },
  { n: '🍞 Hacer su pan u oficio', mom: 'cada luna', frec: 'cada luna', txt: 'Amasar, tejer, arreglar algo como lo hacía él/ella. Las manos también hacen duelo y honran.' },
  { n: '🤝 Minga en su nombre', mom: 'cada luna', frec: 'cada luna', txt: 'Ayudar a alguien como él/ella lo habría hecho: una comida, una mano en la casa, una visita. El amor sigue circulando.' },
  { n: '🚶 Caminar a “su” lugar', mom: 'cotidiano', frec: 'cada semana', txt: 'Su playa, su plaza, su cerro. Camina 10–20 minutos, respira y háblale por dentro. El cuerpo suelta lo que la cabeza no puede.' },
  { n: '🎶 Cantar o poner su canción', mom: 'cotidiano', frec: 'cada semana', txt: 'Su canción a todo volumen o en voz baja: cantar también es llorar bonito. Anótala como memoria tipo canción.' },
  { n: '🖼️ Rincón de memoria en casa', mom: 'despedida', frec: 'una sola vez', txt: 'Su foto, una vela, un objeto suyo y algo vivo (planta o flores). Un lugar para ir a hablarle cuando apriete.' },
  { n: '🌱 Plantar en su nombre', mom: 'despedida', frec: 'una sola vez', txt: 'Un árbol nativo, un maqui, un boldo o su flor favorita. Algo que crezca donde él/ella ya no está, pero sigue.' },
  { n: '🌊 Soltar pétalos al agua', mom: 'aniversarios', frec: 'una sola vez', txt: 'En su aniversario, suelta pétalos o flores al mar o al río con unas palabras. Sin plástico ni nada que contamine: solo flores.' },
  { n: '🌼 Visita de Todos los Santos', mom: 'aniversarios', frec: 'una sola vez', txt: 'Cada 1 de noviembre: limpiar su nicho, llevar sus flores favoritas e ir en familia. Los niños también participan.' },
  { n: '📖 Contar su historia', mom: 'aniversarios', frec: 'cada luna', txt: 'En cada aniversario o junta familiar, contar una historia suya a niños y nietos. Quien es nombrado, sigue vivo.' }
];
var DUE_RIT_FRECS = ['cada semana', 'cada luna', 'una sola vez'];
function getDueloRitComp() { var a = store('dueloRitComp', []); return Array.isArray(a) ? a : []; }
var dueloRitEditId = null;
function renderDueloRitIdeas() {
  var box = $('dueFRitIdeas'); if (!box) return;
  var q = (($('dueFRitQ') || {}).value || '').toLowerCase();
  var mom = ($('dueFRitFiltro') || {}).value || 'todos';
  var list = DUE_RIT_IDEAS.filter(function (r, idx) {
    if (mom !== 'todos' && r.mom !== mom) return false;
    if (q && (r.n + ' ' + r.txt).toLowerCase().indexOf(q) < 0) return false;
    r._i = idx; return true;
  });
  box.innerHTML = list.length ? list.map(function (r) {
    return '<div class="si-card"><h4>' + esc(r.n) + ' <span class="chip" style="font-size:10px">' + esc(r.mom) + '</span></h4><p>' + esc(r.txt) + '</p>' +
      '<div style="display:flex;gap:6px"><button type="button" class="btn" style="width:auto;font-size:11px" data-tomar="' + r._i + '">＋ Tomar como compromiso (' + esc(r.frec) + ')</button></div></div>';
  }).join('') : '<p class="muted">Sin ideas con ese filtro. Prueba con “vela”, “carta” o “planta”.</p>';
  box.querySelectorAll('[data-tomar]').forEach(function (b) {
    b.onclick = function () {
      var r = DUE_RIT_IDEAS[+b.getAttribute('data-tomar')]; if (!r) return;
      if ($('dueFRitCompNombre')) $('dueFRitCompNombre').value = r.n.replace(/^[^\s]+\s/, '');
      if ($('dueFRitCompFrec')) $('dueFRitCompFrec').value = r.frec;
      if ($('dueFRitCompProx') && !$('dueFRitCompProx').value) $('dueFRitCompProx').value = todayKey();
      try { $('dueFRitCompNombre').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); $('dueFRitCompNombre').focus(); } catch (e) {}
      save('Idea lista: ponle fecha y comprométete 🕯️');
    };
  });
}
function renderDueloRitComp() {
  var box = $('dueFRitCompList'); if (!box) return;
  var hoy = todayKey();
  var d = getDueloRitComp().slice().sort(function (a, b) { return (a.prox || '9999').localeCompare(b.prox || '9999'); });
  box.innerHTML = d.length ? d.map(function (r) {
    var done = r.estado === 'cumplido';
    var diff = r.prox ? Math.round((new Date(r.prox + 'T12:00:00') - new Date(hoy + 'T12:00:00')) / 86400000) : null;
    var est = done ? 'cumplido ✓' : (!r.prox ? 'sin fecha' : (diff === 0 ? '🕯️ HOY' : (diff < 0 ? 'atrasado ' + (-diff) + ' días' : 'en ' + diff + ' días')));
    return '<div class="habit-item"' + (done ? ' style="opacity:.75"' : '') + '><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b>' + esc(r.nombre) + '</b></span><span class="chip" style="font-size:10px">' + esc(r.frec || '') + ' · ' + est + '</span></div>' +
      '<div class="muted" style="font-size:11px;margin-top:4px">' + (r.prox ? '📅 próximo: ' + r.prox + ' · ' : '') + '✅ ' + (+r.veces || 0) + ' veces' + (r.ultima ? ' · último: ' + r.ultima : '') + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' + (done ? '' : '<button class="btn btn-accent" style="width:auto;font-size:11px" data-hecho="' + r.id + '">✅ Hecho hoy</button>') + '<button class="btn" style="width:auto;font-size:11px" data-edit="' + r.id + '">✏️</button><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div></div>';
  }).join('') : '<p class="muted">Sin compromisos. Toma una idea de arriba ☝️ o escribe la tuya abajo: un ritual chico y repetido sostiene más que uno grande y único.</p>';
  box.querySelectorAll('[data-hecho]').forEach(function (b) {
    b.onclick = function () {
      var dd = getDueloRitComp();
      var r = null;
      for (var i = 0; i < dd.length; i++) if (dd[i].id === b.getAttribute('data-hecho')) r = dd[i];
      if (!r) return;
      var t = todayKey();
      r.ultima = t; r.veces = (+r.veces || 0) + 1;
      if (r.frec === 'una sola vez') { r.estado = 'cumplido'; r.prox = ''; }
      else {
        var base = (r.prox && r.prox >= t) ? r.prox : t;
        r.prox = addDaysKeyLocal(base, r.frec === 'cada semana' ? 7 : 28);
      }
      save(r.estado === 'cumplido' ? 'Ritual cumplido 🕊️' : 'Ritual honrado 🕯️ (próximo: ' + r.prox + ')');
      renderDueloRit();
    };
  });
  box.querySelectorAll('[data-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este compromiso?')) return;
      var dd = getDueloRitComp();
      for (var i = 0; i < dd.length; i++) if (dd[i].id === b.getAttribute('data-del')) { dd.splice(i, 1); break; }
      save(); renderDueloRit();
    };
  });
  box.querySelectorAll('[data-edit]').forEach(function (b) {
    b.onclick = function () {
      var dd = getDueloRitComp();
      var r = null;
      for (var i = 0; i < dd.length; i++) if (dd[i].id === b.getAttribute('data-edit')) r = dd[i];
      if (!r) return;
      dueloRitEditId = r.id;
      $('dueFRitCompNombre').value = r.nombre || ''; $('dueFRitCompFrec').value = r.frec || 'cada semana'; $('dueFRitCompProx').value = r.prox || todayKey();
      $('dueFRitCompAdd').textContent = '↻ Actualizar'; $('dueFRitCompCancel').classList.remove('hidden');
      try { $('dueFRitCompNombre').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    };
  });
  var st = $('dueFRitCompStats');
  if (st) {
    var activos = d.filter(function (r) { return r.estado !== 'cumplido'; }).length;
    var veces = d.reduce(function (a, r) { return a + (+r.veces || 0); }, 0);
    st.textContent = d.length + ' compromisos (' + activos + ' activos) · ' + veces + ' rituales honrados en total';
  }
}
function renderDueloRit() {
  try { renderDueloRitIdeas(); } catch (e) {}
  try { renderDueloRitComp(); } catch (e) {}
  var box = $('dueFVelas'); if (!box) return;
  var d = getDueloVelas().slice().sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 20);
  box.innerHTML = d.length ? d.map(function (r) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span>🕯️ <b>' + esc(r.para) + '</b><br><span class="muted" style="font-size:11px">' + r.fecha + ' · ' + esc(r.acto || '') + '</span></span><button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-del="' + r.id + '">✕</button></div>';
  }).join('') : '<p class="muted">Sin rituales aún. Un ritual chico y repetido sostiene más que uno grande y único.</p>';
  box.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var dd = getDueloVelas(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-del'); }); if (i >= 0) dd.splice(i, 1); save(); renderDueloRit(); }; });
}
function renderDueloAll() { try { renderDueloProc(); } catch (e) {} try { renderDueloMem(); } catch (e) {} try { renderDueloRit(); } catch (e) {} }

function setupDueloFull() {
  makeDialog('dueloFullDialog', '🕊️ Duelo — guía y compañía para esta etapa',
    'Si estás viviendo una pérdida, esta sección <b>empieza por la guía</b>: léela primero, sin prisa. Luego registra tu proceso y guarda su memoria. Todo queda <b>privado y local</b>. No reemplaza acompañamiento profesional.',
    '<div class="timer-tabs" style="flex-wrap:wrap;margin-bottom:10px">' +
    '<button type="button" id="tabDueFGuia" class="btn btn-accent" style="width:auto">📖 Guía primero</button>' +
    '<button type="button" id="tabDueFProc" class="btn" style="width:auto">💧 Mi proceso</button>' +
    '<button type="button" id="tabDueFMem" class="btn" style="width:auto">📓 Memoria viva</button>' +
    '<button type="button" id="tabDueFRit" class="btn" style="width:auto">🕯️ Rituales</button>' +
    '<button type="button" id="tabDueFApo" class="btn" style="width:auto">🤝 Apoyo</button></div>' +
    '<div id="dueFGuia">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🕊️ Primero: respira. El duelo no es un problema a resolver</h4><p style="font-size:12px;line-height:1.6">Es el <b>amor que sigue buscando a quién abrazar</b>. No es lineal: viene en oleaje — un día “bien” y al otro el llanto vuelve con un olor, una canción, una fecha. Eso es normal. No hay plazo correcto. Esta guía te ordena las primeras lunas para que no camines a ciegas.</p></div>' +
      '<div class="si-card"><h4>🌊 Las etapas (pueden ir y volver)</h4><p><b>1) Shock / negación:</b> “no puede ser”. El cuerpo se enfría, cuesta comer/dormir.<br><b>2) Ira:</b> rabia con la vida, con otros, con quien partió, con una misma/o.<br><b>3) Negociación:</b> “y si hubiera...”. Culpa que busca control.<br><b>4) Tristeza profunda:</b> vacío, llanto, cansancio. El corazón entiende de a poco.<br><b>5) Integración:</b> el dolor no desaparece: cambia de lugar. Vuelven la risa y los proyectos, con su ausencia incluida.<br><span class="muted">En kimün mapuche el viaje se acompaña: las ballenas (trempulcahue) llevan a los justos al poniente; por eso se agradece y se despide con respeto, canto y memoria.</span></p></div>' +
      '<div class="si-card"><h4>📅 Qué esperar en el tiempo</h4><p><b>Primeras 72 h:</b> trámites, visitas, poco sueño. Come liviano, toma agua, acepta ayuda concreta (“te traigo comida”, “te acompaño al trámite”).<br><b>9 días (novenario):</b> en Chile se acompaña 9 noches con rezo, canto o círculo íntimo; el cierre ordena la despedida.<br><b>40 días:</b> misa o ritual de cuarentena, se ordenan sus cosas con calma.<br><b>Primera luna (28 días):</b> baja la visita y sube el vacío. Marca 1 ritual chico por semana.<br><b>3 lunas y 6 meses:</b> aparece el cansancio real. Ordena papeles/objetos sin apuro, por partes.<br><b>1 año y aniversarios:</b> primer ciclo de fechas sin su cuerpo (cumpleaños, fiestas, Todos los Santos). Planifícalas con compañía.<br>El 🕯️ <b>calendario de memoria</b> calcula todas estas fechas por ti y te avisa la próxima.</p></div>' +
      '<div class="si-card"><h4>✅ Qué ayuda · 🚫 qué evitar</h4><p><b>Ayuda:</b> dormir y comer a horas, caminar 10–20 min, escribirle cartas, cocinar su receta, pedir abrazos, decir su nombre, llorar cuando venga, mantener 1 hábito base.<br><b>Evita:</b> decidir grandes cambios el primer mes, aislarte por semanas, alcohol/drogas para dormir, frases que te exigen (“sé fuerte”, “ya supéralo”). A quien acompaña: mejor “estoy aquí, ¿te traigo algo?” que “llámame si necesitas”.</p></div>' +
      '<div class="si-card"><h4>🧒 Si hay niños</h4><p>Diles la verdad simple: “murió, su cuerpo dejó de funcionar y no va a volver. Te seguiremos cuidando”. Deja que pregunten muchas veces. Mantén rutinas, dibujo y cuentos (📖 Cuentos + 🗣️ Voz de los Abuelos). Si dejan de comer/jugar semanas o retroceden mucho, consulta en CESFAM.</p></div>' +
      '<div class="si-card" style="border-color:#e76e8a"><h4>🚨 Cuándo pedir ayuda profesional</h4><p>Si por semanas no puedes comer/dormir/funcionar, si el dolor no te deja levantarte, si aparecen ideas de hacerte daño o de “irte con él/ella”, o si usas alcohol/pastillas para aguantar: <b>pide ayuda hoy</b>. Chile: <b>*4141</b> (prevención del suicidio, 24h), tu <b>CESFAM/SAR</b>, <b>Salud Responde 600 360 7777</b>. Pedir ayuda es cuidar a los que quedan, incluido tú.</p></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="dueFGoProc" class="btn btn-accent" style="width:auto">💧 Registrar cómo estoy →</button><button type="button" id="dueFGoMem" class="btn" style="width:auto">📓 Guardar su memoria →</button></div>' +
    '</div>' +
    '<div id="dueFProc" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>💧 ¿Cómo estoy hoy?</h4>' +
      '<div class="conv-row"><label>Fecha <input type="date" id="dueFProcFecha"></label><label style="flex:2">Etapa que siento <select id="dueFProcEtapa">' + DUE_ETAPAS.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="conv-row"><label>Intensidad (0-10) <input type="number" id="dueFProcInten" min="0" max="10" value="6" style="width:80px"></label><label style="flex:2">Hoy necesito <select id="dueFProcNeces">' + DUE_NECES.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label></div>' +
      '<label>Nota <input type="text" id="dueFProcNota" placeholder="ej: soñé con ella, desperté llorando pero tranquila" maxlength="140"></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="dueFProcAdd" class="btn btn-accent" style="width:auto">+ Guardar hoy</button></div></div>' +
      '<div id="dueFProcList" class="habits-list" style="margin-top:10px;max-height:280px"></div>' +
      '<span id="dueFProcStats" class="muted" style="font-size:11px"></span>' +
    '</div>' +
    '<div id="dueFMem" class="hidden">' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🕯️ Calendario de memoria</h4>' +
      '<p class="muted" style="font-size:11px">Lleva el calendario de <b>varias personas</b>: 3 y 9 días, novenario, 40 días, lunas, 6 meses, aniversarios, su cumpleaños y Todos los Santos. Marca ✅ cada hito que honres.</p>' +
      '<div class="conv-row"><label style="flex:2">Persona <select id="dueFPersSel"></select></label></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" id="dueFPersEdit" class="btn" style="width:auto;font-size:11px">✏️ Editar persona</button><button type="button" id="dueFPersDel" class="btn" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></div>' +
      '<div class="menstrual-card" style="margin-top:8px"><h4 style="font-size:12px">➕ Agregar persona al calendario</h4>' +
      '<div class="conv-row"><label style="flex:2">Nombre * <input type="text" id="dueFPersNombre" placeholder="ej: mi mamá Elena" maxlength="40"></label></div>' +
      '<div class="conv-row"><label>Fecha de partida * <input type="date" id="dueFPersFecha"></label><label>Cumpleaños (opcional) <input type="date" id="dueFPersCumple"></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="dueFPersAdd" class="btn btn-accent" style="width:auto">+ Guardar persona</button><button type="button" id="dueFPersCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
      '<div id="dueFNext" class="chip" style="display:block;white-space:normal;margin-top:8px"></div>' +
      '<div id="dueFRituales" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="dueFCalStats" class="muted" style="font-size:11px"></span><button type="button" id="dueFCalShare" class="btn" style="width:auto">📤 Compartir calendario</button></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>📓 Memoria viva</h4>' +
      '<div class="conv-row"><label>Tipo <select id="dueFTipo">' + DUE_TIPOS.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label><label style="flex:2">Título <input type="text" id="dueFTitulo" placeholder="ej: El charquicán de mi mamá" maxlength="50"></label></div>' +
      '<div class="conv-row"><label style="flex:2">Para quién <input type="text" id="dueFPara" list="dueFParaList" placeholder="ej: mi mamá Elena" maxlength="40" autocomplete="off"></label><datalist id="dueFParaList"></datalist><label>Ver <select id="dueFMemFiltro"><option value="todas">Todas</option></select></label></div>' +
      '<label>Texto <textarea id="dueFTexto" rows="3" placeholder="escríbela tal como la recuerdas..." maxlength="800"></textarea></label>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="dueFAdd" class="btn btn-accent" style="width:auto">+ Guardar memoria</button></div>' +
      '<div id="dueFMemList" class="habits-list" style="margin-top:8px;max-height:260px"></div>' +
      '<span id="dueFMemStats" class="muted" style="font-size:11px"></span></div>' +
    '</div>' +
    '<div id="dueFRit" class="hidden">' +
      '<div class="si-card"><h4>🕯️ Rituales que sostienen</h4><p>Un ritual chico y repetido sostiene más que uno grande y único. Abajo tienes <b>ideas por momento</b> (despedida, primeras semanas, cada luna, aniversarios, cotidiano): toma una como <b>compromiso</b> con fecha, márcala cada vez que la honres y mira tu constancia. Y si un día solo te sale encender una vela, anótala igual: también cuenta.</p></div>' +
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌿 Ideas de rituales por momento</h4>' +
      '<div class="conv-row"><label style="flex:2">🔍 Buscar <input type="text" id="dueFRitQ" placeholder="vela, carta, plantar..." autocomplete="off"></label><label>Momento <select id="dueFRitFiltro"><option value="todos">Todos</option><option value="despedida">despedida</option><option value="primeras semanas">primeras semanas</option><option value="cada luna">cada luna</option><option value="aniversarios">aniversarios</option><option value="cotidiano">cotidiano</option></select></label></div>' +
      '<div id="dueFRitIdeas" style="margin-top:8px;display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto"></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>🤝 Mis rituales comprometidos</h4>' +
      '<label>Ritual * <input type="text" id="dueFRitCompNombre" placeholder="ej: Vela de los viernes para mi mamá" maxlength="60"></label>' +
      '<div class="conv-row"><label>Frecuencia <select id="dueFRitCompFrec"><option>cada semana</option><option>cada luna</option><option>una sola vez</option></select></label><label>Próxima fecha <input type="date" id="dueFRitCompProx"></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="dueFRitCompAdd" class="btn btn-accent" style="width:auto">+ Comprometer ritual</button><button type="button" id="dueFRitCompCancel" class="btn hidden" style="width:auto">Cancelar</button></div>' +
      '<div id="dueFRitCompList" class="habits-list" style="margin-top:8px;max-height:260px"></div>' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="dueFRitCompStats" class="muted" style="font-size:11px"></span><button type="button" id="dueFRitCompShare" class="btn" style="width:auto">📤 Compartir</button></div></div>' +
      '<div class="menstrual-card" style="margin-top:10px"><h4>➕ Vela / acto espontáneo</h4>' +
      '<div class="conv-row"><label style="flex:2">Por quién <input type="text" id="dueFRitPara" placeholder="ej: mi papá" maxlength="30"></label><label style="flex:2">Acto <input type="text" id="dueFRitActo" placeholder="ej: vela + su canción" maxlength="60"></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="dueFRitAdd" class="btn btn-accent" style="width:auto">🕯️ Encender hoy</button></div>' +
      '<div id="dueFVelas" class="habits-list" style="margin-top:8px;max-height:240px"></div></div>' +
    '</div>' +
    '<div id="dueFApo" class="hidden">' +
      '<div class="menstrual-card" style="border-color:#e76e8a"><h4>🚨 Si duele demasiado hoy</h4><p style="font-size:12px">No lo pases sola/o: llama a alguien de confianza ahora. Chile 24h: <b>*4141</b> · <b>Salud Responde 600 360 7777</b> · tu CESFAM/SAR. Si hay ideas de daño, pide compañía presencial hoy.</p></div>' +
      '<div class="si-card"><h4>🤝 Mi red (escríbela)</h4><p>Llena en 💧 “hoy necesito” y avisa: 1 persona para hablar · 1 para trámites/comida · 1 para noches difíciles. Pedir concreto ayuda más que “apóyenme”.</p><div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="dueFGoBreath" class="btn" style="width:auto">🌬️ Respiración</button><button type="button" id="dueFGoPsi" class="btn" style="width:auto">🪞 Autoconocimiento</button><button type="button" id="dueFGoEsp" class="btn" style="width:auto">🕉️ Prácticas</button><button type="button" id="dueFGoHabits" class="btn" style="width:auto">✅ Hábitos</button></div></div>' +
    '</div>');
  var b = $('btnDueloFull');
  if (b) b.onclick = function () {
    if ($('dueFProcFecha') && !$('dueFProcFecha').value) $('dueFProcFecha').value = todayKey();
    switchDueloTab('Guia'); // LA GUIA APARECE PRIMERO
    renderDueloAll(); openDlg('dueloFullDialog');
    try { ($('dueloFullDialog').querySelector('form') || $('dueloFullDialog')).scrollTop = 0; } catch (e) {}
  };
  if ($('tabDueFGuia')) $('tabDueFGuia').onclick = function () { switchDueloTab('Guia'); };
  if ($('tabDueFProc')) $('tabDueFProc').onclick = function () { switchDueloTab('Proc'); renderDueloProc(); };
  if ($('tabDueFMem')) $('tabDueFMem').onclick = function () { switchDueloTab('Mem'); renderDueloMem(); };
  if ($('tabDueFRit')) $('tabDueFRit').onclick = function () { switchDueloTab('Rit'); renderDueloRit(); };
  if ($('tabDueFApo')) $('tabDueFApo').onclick = function () { switchDueloTab('Apo'); };
  if ($('dueFGoProc')) $('dueFGoProc').onclick = function () { switchDueloTab('Proc'); renderDueloProc(); };
  if ($('dueFGoMem')) $('dueFGoMem').onclick = function () { switchDueloTab('Mem'); renderDueloMem(); };
  if ($('dueFGoBreath')) $('dueFGoBreath').onclick = function () { try { var x = $('btnBreath'); if (x) x.click(); } catch (e) {} };
  if ($('dueFGoPsi')) $('dueFGoPsi').onclick = function () { try { var x = $('btnPsico'); if (x) x.click(); } catch (e) {} };
  if ($('dueFGoEsp')) $('dueFGoEsp').onclick = function () { try { var x = $('btnEspiritual'); if (x) x.click(); } catch (e) {} };
  if ($('dueFGoHabits')) $('dueFGoHabits').onclick = function () { try { var x = $('btnHabits'); if (x) x.click(); } catch (e) {} };
  if ($('dueFProcAdd')) $('dueFProcAdd').onclick = function () {
    getDueloCheck().push({ id: uid('dp'), fecha: $('dueFProcFecha').value || todayKey(), etapa: $('dueFProcEtapa').value, inten: Math.max(0, Math.min(10, +$('dueFProcInten').value || 0)), neces: $('dueFProcNeces').value, nota: clean($('dueFProcNota').value, 140) });
    save('Guardado 💧'); $('dueFProcNota').value = ''; renderDueloProc();
  };
  if ($('dueFPersSel')) $('dueFPersSel').onchange = function () { dueloPersSel = $('dueFPersSel').value; renderDueloMem(); };
  if ($('dueFPersAdd')) $('dueFPersAdd').onclick = function () {
    var n = clean($('dueFPersNombre').value, 40); if (!n) return alert('Escribe el nombre de la persona');
    var f = $('dueFPersFecha').value;
    if (!dueloPersEditId && !f) return alert('Elige la fecha de partida');
    var dd = getDueloPersonas();
    if (dueloPersEditId) {
      var i = -1;
      for (var k = 0; k < dd.length; k++) if (dd[k].id === dueloPersEditId) i = k;
      if (i >= 0) { dd[i].nombre = n; if (f) dd[i].fecha = f; dd[i].cumple = $('dueFPersCumple').value || ''; }
      dueloPersEditId = null; $('dueFPersAdd').textContent = '+ Guardar persona'; $('dueFPersCancel').classList.add('hidden');
    } else {
      var rec = { id: uid('dpers'), nombre: n, fecha: f, cumple: $('dueFPersCumple').value || '' };
      dd.push(rec); dueloPersSel = rec.id;
    }
    save('Persona guardada 🕊️');
    $('dueFPersNombre').value = ''; $('dueFPersFecha').value = ''; $('dueFPersCumple').value = '';
    renderDueloMem();
  };
  if ($('dueFPersCancel')) $('dueFPersCancel').onclick = function () {
    dueloPersEditId = null; $('dueFPersAdd').textContent = '+ Guardar persona'; $('dueFPersCancel').classList.add('hidden');
    $('dueFPersNombre').value = ''; $('dueFPersFecha').value = ''; $('dueFPersCumple').value = '';
  };
  if ($('dueFPersEdit')) $('dueFPersEdit').onclick = function () {
    var p = dueloSelPersona(); if (!p) return alert('Agrega primero una persona');
    dueloPersEditId = p.id;
    $('dueFPersNombre').value = p.nombre || ''; $('dueFPersFecha').value = p.fecha || ''; $('dueFPersCumple').value = p.cumple || '';
    $('dueFPersAdd').textContent = '↻ Actualizar persona'; $('dueFPersCancel').classList.remove('hidden');
    $('dueFPersNombre').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  if ($('dueFPersDel')) $('dueFPersDel').onclick = function () {
    var p = dueloSelPersona(); if (!p) return;
    if (!confirm('¿Borrar el calendario de ' + (p.nombre || 'esta persona') + '? (sus memorias se mantienen)')) return;
    var dd = getDueloPersonas();
    for (var k = 0; k < dd.length; k++) if (dd[k].id === p.id) { dd.splice(k, 1); break; }
    dueloPersSel = null; dueloPersEditId = null;
    save(); renderDueloMem();
  };
  if ($('dueFMemFiltro')) $('dueFMemFiltro').onchange = function () { renderDueloMem(); };
  if ($('dueFCalShare')) $('dueFCalShare').onclick = function () {
    var p = dueloSelPersona(); if (!p) return alert('Agrega primero una persona');
    var hitos = dueloHitosPersona(p, todayKey());
    var done = getDueloHitosDone();
    share('🕯️ Calendario de memoria: ' + (p.nombre || '') + (p.fecha ? ' (partió ' + p.fecha + ')' : ''),
      hitos.map(function (h) { return (done[dueloHitoKey(p.id, h)] ? '✓ ' : '· ') + h.n + ' → ' + h.f; }).join('\n'));
  };
  if ($('dueFAdd')) $('dueFAdd').onclick = function () {
    var t = clean($('dueFTitulo').value, 50); if (!t) return alert('Ponle un título a la memoria');
    var x = clean($('dueFTexto').value, 800); if (!x) return alert('Escribe la memoria');
    var icons = { historia: '📖', receta: '🍲', 'canción': '🎶', dicho: '💬', carta: '💌', 'foto (descripción)': '📷' };
    getDueloMem().push({ id: uid('du'), fecha: todayKey(), tipo: $('dueFTipo').value, titulo: t, texto: x, icon: icons[$('dueFTipo').value] || '🕊️', para: clean(($('dueFPara') || {}).value || '', 40) });
    save('Memoria guardada 🕊️'); $('dueFTitulo').value = ''; $('dueFTexto').value = ''; if ($('dueFPara')) $('dueFPara').value = ''; renderDueloMem();
  };
  if ($('dueFRitAdd')) $('dueFRitAdd').onclick = function () {
    var p = clean($('dueFRitPara').value, 30); if (!p) return alert('¿Por quién?');
    getDueloVelas().push({ id: uid('dv'), para: p, fecha: todayKey(), acto: clean($('dueFRitActo').value, 60) });
    save('Ritual guardado 🕯️'); $('dueFRitPara').value = ''; $('dueFRitActo').value = ''; renderDueloRit();
  };
  if ($('dueFRitQ')) $('dueFRitQ').oninput = function () { renderDueloRitIdeas(); };
  if ($('dueFRitFiltro')) $('dueFRitFiltro').onchange = function () { renderDueloRitIdeas(); };
  if ($('dueFRitCompAdd')) $('dueFRitCompAdd').onclick = function () {
    var n = clean($('dueFRitCompNombre').value, 60); if (!n) return alert('Nombra el ritual');
    var frec = $('dueFRitCompFrec').value || 'cada semana';
    var prox = $('dueFRitCompProx').value || todayKey();
    var dd = getDueloRitComp();
    if (dueloRitEditId) {
      var r = null;
      for (var i = 0; i < dd.length; i++) if (dd[i].id === dueloRitEditId) r = dd[i];
      if (r) { r.nombre = n; r.frec = frec; r.prox = prox; if (frec !== 'una sola vez') r.estado = ''; }
      dueloRitEditId = null; $('dueFRitCompAdd').textContent = '+ Comprometer ritual'; $('dueFRitCompCancel').classList.add('hidden');
    } else {
      dd.push({ id: uid('dr'), nombre: n, frec: frec, prox: prox, veces: 0, ultima: '', estado: '' });
    }
    save('Ritual comprometido 🕯️'); $('dueFRitCompNombre').value = ''; renderDueloRit();
  };
  if ($('dueFRitCompCancel')) $('dueFRitCompCancel').onclick = function () {
    dueloRitEditId = null; $('dueFRitCompAdd').textContent = '+ Comprometer ritual'; $('dueFRitCompCancel').classList.add('hidden');
    $('dueFRitCompNombre').value = '';
  };
  if ($('dueFRitCompShare')) $('dueFRitCompShare').onclick = function () {
    var dd = getDueloRitComp(); if (!dd.length) return alert('Sin compromisos');
    share('🕯️ Mis rituales de memoria', dd.map(function (r) { return '· ' + r.nombre + ' (' + r.frec + ')' + (r.prox ? ' → próximo ' + r.prox : '') + ' · ' + (+r.veces || 0) + ' veces honrado'; }).join('\n'));
  };
  try { renderDueloAll(); } catch (e) {}
}

/* ---------- puentes desde pestanas antiguas ---------- */
function setupPuentes() {
  try {
    var oldArbBtn = $('tabMemoryArbol');
    if (oldArbBtn && !$('arbFGoFull')) {
      var go = document.createElement('button');
      go.type = 'button'; go.id = 'arbFGoFull'; go.className = 'btn btn-accent'; go.style.width = 'auto'; go.style.marginTop = '8px';
      go.textContent = '🌳 Abrir sección completa: Árbol Genealógico';
      go.onclick = function () { try { $('memoryDialog').close(); } catch (e) {} setTimeout(function () { try { $('btnArbolFull').click(); } catch (e2) {} }, 150); };
      var panel = $('memoryArbolPanel');
      if (panel) panel.insertBefore(go, panel.firstChild);
    }
  } catch (e) {}
  // (puente de Duelo retirado: la pestana espTabDuelo/espDueloPanel ya no existe;
  //  la seccion completa 🕊️ Duelo vive en btnDueloFull)
}

/* ---------- init ---------- */
var _linInit = 0;
function init() {
  _linInit++;
  if (!document.querySelector('.action-group[data-group]')) { if (_linInit < 40) setTimeout(init, 500); return; }
  if (!$('btnArbolFull') || !$('btnRecap') || !$('btnDueloFull')) { if (_linInit < 40) setTimeout(init, 500); return; }
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push) {
      ['btnArbolFull', 'btnRecap', 'btnDueloFull'].forEach(function (id) { if (ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); });
    }
  } catch (e) {}
  try { addKw('btnArbolFull', 'linaje kupalme familia'); } catch (e) {}
  try { addKw('btnRecap', 'tolteca castaneda barrido'); } catch (e) {}
  try { addKw('btnDueloFull', 'guia acompanamiento luto'); } catch (e) {}
  try { setupArbolFull(); } catch (e) {}
  try { setupRecap(); } catch (e) {}
  try { setupDueloFull(); } catch (e) {}
  try { setupPuentes(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 900); });
else setTimeout(init, 900);
setTimeout(init, 2600);

})();
