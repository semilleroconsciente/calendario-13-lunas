/* ============================================================
   MIS HERRAMIENTAS — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección dentro de Hogar y Vida Práctica > Energía y Taller:
   - Botón btnHerramientas (en grupo hogar, sub energia,
     junto a Bitácora Taller)
   - Diálogo herramientasDialog con 3 pestañas:
     1) Resumen (totales, por categoría, para reparar/reponer,
        prestadas)
     2) Herramientas (CRUD: nombre, categoría, ubicación,
        estado, cantidad, préstamo, favorita, archivo)
     3) Guía (kit básico de casa, orden, mantención,
        seguridad, préstamos)
   - Complementa (no duplica) a 🔧 Bitácora Taller, que es la
     bitácora de reparaciones y mantenciones.
   - Todo local y privado por usuario:
     userData().herramientas = { items: [] }
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

/* ---------------- REFERENCIAS ---------------- */
var CATS = ['🔨 Manuales', '🔌 Eléctricas', '🪚 Corte y sierra', '🔧 Llaves y mecánica', '📏 Medición y nivel', '🌱 Jardín y huerta', '🎣 Pesca y mar', '🧵 Costura y hogar', '🪜 Escaleras y andamios', '📦 Otro'];
var UBIS = ['Caja de herramientas', 'Muro / clavijero', 'Bodega / taller', 'Cajón cocina', 'Patio / exterior', 'Prestada fuera', 'Otro'];
var ESTADOS = ['😍 Buena', '🙂 Regular', '🛠️ Para reparar', '🛒 Para reponer', '🤝 Prestada'];

function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { items: [] };
    if (!u.herramientas) u.herramientas = { items: [] };
    if (!Array.isArray(u.herramientas.items)) u.herramientas.items = [];
    return u.herramientas;
  } catch (e) { return { items: [] }; }
}
function byId(id) {
  var f = null;
  store().items.forEach(function (x) { if (x.id === id) f = x; });
  return f;
}

/* ---------------- DIALOGO ---------------- */
var TABS = ['Resumen', 'Herrams', 'Guia'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('her' + t), b = $('tabHer' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
var editId = null, fCat = 'todas', fEst = 'todos', fQ = '';

function buildDialog() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabHerResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabHerHerrams" class="btn" style="width:auto">🧰 Herramientas</button>' +
    '<button type="button" id="tabHerGuia" class="btn" style="width:auto">📖 Guía</button></div>' +

    '<div id="herResumen"></div>' +

    '<div id="herHerrams" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ <span id="herFormTitle">Nueva herramienta</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Herramienta * <input type="text" id="herNombre" placeholder="ej: Taladro, Martillo, Serrucho, Huincha" maxlength="40"></label>' +
    '<label>Categoría <select id="herCat">' + CATS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Cantidad <input type="number" id="herCant" min="1" step="1" value="1"></label>' +
    '<label>Guardada en <select id="herUbi">' + UBIS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Estado <select id="herEstado">' + ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Prestada a (si aplica) <input type="text" id="herPrest" placeholder="ej: vecino Juan, primo" maxlength="40"></label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="herFav"> ⭐ Uso frecuente</label></div>' +
    '<label>Nota <input type="text" id="herNota" placeholder="ej: brocas 3-10mm, cable cortado, sin batería" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="herAdd" class="btn btn-accent" style="width:auto">+ Guardar herramienta</button>' +
    '<button type="button" id="herCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="herQ" placeholder="nombre, nota, préstamo..."></label>' +
    '<label>Categoría <select id="herFQ"><option value="todas">Todas</option>' + CATS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Estado <select id="herFE"><option value="todos">Todos</option>' + ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div id="herList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="herGuia" class="hidden">' +
    '<div class="si-card"><h4>🧰 Kit básico de casa (con esto resuelves el 90%)</h4><p>Martillo · destornilladores cruz y paleta · alicate · llave ajustable (francesa) · huincha de medir · nivel · taladro + brocas · tornillos y tarugos surtidos · cinta aisladora y teflón · sierra o serrucho · linterna. Si te falta algo de esta lista, márcalo 🛒 Para reponer.</p></div>' +
    '<div class="si-card"><h4>🗂️ Orden que se mantiene solo</h4><p><b>Un lugar fijo para cada cosa:</b> clavijero a la vista para lo diario, caja para lo chico, bodega para lo grande. Dibuja la silueta en el clavijero: lo que falta se nota al tiro. Después de usar, vuelve a su lugar el mismo día. Anota aquí el lugar para que toda la casa la encuentre.</p></div>' +
    '<div class="si-card"><h4>🛢️ Mantención (5 min que alargan años)</h4><p>Limpia tierra y aserrín después de usar · una gota de aceite en partes móviles cada luna · afila cuchillos y tijeras · guarda a seco (Penco húmedo oxida: bolsita de arroz en la caja ayuda) · revisa cables de eléctricas antes de enchufar. Lleva la mantención en 🔧 Bitácora Taller.</p></div>' +
    '<div class="si-card"><h4>⚠️ Seguridad mínima</h4><p>Guantes + antiparras al esmerilar/taladrar · desenchufa antes de cambiar broca/disco · cuchillos y sierras fuera del alcance de niños · escalera firme y avisada (que alguien sepa que estás arriba). Si una herramienta falla, márcala 🛠️ Para reparar y no la prestes.</p></div>' +
    '<div class="si-card"><h4>🤝 Préstamos sin pelea</h4><p>Anota <b>a quién y cuándo</b> prestaste (campo Prestada a + estado 🤝 Prestada). Presta solo lo que está 😍 Buena y pide fecha de vuelta. Lo prestado más de 1 luna: cobra con un queque y una sonrisa.</p></div>' +
    '</div>';

  makeDialog('herramientasDialog', '🧰 Mis Herramientas — las de la casa',
    'Inventario de tus herramientas: qué tienes, dónde están, en qué estado y a quién prestaste. Complementa a 🔧 Bitácora Taller (reparaciones). <b>Privado y local</b>, 100% offline.',
    body);
}

/* ---------------- RENDER ---------------- */
function renderResumen() {
  var box = $('herResumen'); if (!box) return;
  var all = store().items;
  var items = all.filter(function (x) { return !x.archivada; });
  var arch = all.length - items.length;
  var porCat = {};
  items.forEach(function (x) { porCat[x.cat] = (porCat[x.cat] || 0) + 1; });
  var reparar = items.filter(function (x) { return (x.estado || '').indexOf('reparar') >= 0; });
  var reponer = items.filter(function (x) { return (x.estado || '').indexOf('reponer') >= 0; });
  var prest = items.filter(function (x) { return (x.estado || '').indexOf('Prestada') >= 0; });

  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>🧰 Mi taller</h4><p style="font-size:22px;color:var(--gold)"><b>' + items.length + '</b> <span style="font-size:12px">herramientas</span></p>' +
    '<p class="muted" style="font-size:11px">' + (items.length ? Object.keys(porCat).map(function (k) { return esc(k.split(' ')[0] + ' ' + k.split(' ').slice(1).join(' ') + ': ' + porCat[k]); }).join(' · ') : 'Anota tu primera herramienta en 🧰 Herramientas.') + (arch ? '<br>📦 ' + arch + ' archivada(s)' : '') + '</p></div>' +
    '<div class="menstrual-card"><h4>🔄 Pendientes</h4><p style="font-size:15px">🛠️ <b>' + reparar.length + '</b> reparar · 🛒 <b>' + reponer.length + '</b> reponer' + (prest.length ? ' · 🤝 <b>' + prest.length + '</b> prestada(s)' : '') + '</p>' +
    '<p class="muted" style="font-size:11px">La mantención se lleva en 🔧 Bitácora Taller</p></div></div>' +

    (prest.length ? '<div class="menstrual-card" style="margin-top:10px"><h4>🤝 Prestadas fuera</h4>' +
      prest.slice(0, 6).map(function (x) {
        return '<div class="hora-item"><span style="font-size:12px">🤝 <b>' + esc(x.nombre) + '</b> <span class="muted">· a ' + esc(x.prestadaA || '¿quién?') + '</span></span>' +
          '<button type="button" class="btn her-back" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">↩ Volvió</button></div>';
      }).join('') + '</div>' : '') +

    ((reparar.length || reponer.length) ? '<div class="menstrual-card" style="margin-top:10px"><h4>⚠️ Requieren acción</h4><p class="muted" style="font-size:11px">' +
      reparar.slice(0, 5).map(function (x) { return esc('🛠️ ' + x.nombre + (x.nota ? ' (' + x.nota + ')' : '')); }).join('<br>') +
      (reparar.length && reponer.length ? '<br>' : '') +
      reponer.slice(0, 5).map(function (x) { return esc('🛒 ' + x.nombre); }).join('<br>') + '</p></div>' : '') +

    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="herGoAdd" class="btn" style="width:auto">➕ Anotar herramienta</button>' +
    '<button type="button" id="herGoTaller" class="btn" style="width:auto">🔧 Ir a Bitácora Taller</button>' +
    '<button type="button" id="herShareBtn" class="btn" style="width:auto">📤 Compartir lista</button></div>';

  var g = $('herGoAdd'); if (g) g.onclick = function () { switchTab('Herrams'); };
  var gt = $('herGoTaller'); if (gt) gt.onclick = function () { try { if ($('btnTaller')) $('btnTaller').click(); } catch (e) {} };
  var sh = $('herShareBtn'); if (sh) sh.onclick = shareResumen;
  box.querySelectorAll('.her-back').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.estado = '😍 Buena'; x.prestadaA = '';
      save('De vuelta en casa 🤝'); renderAll();
    };
  });
}

function shareResumen() {
  var items = store().items.filter(function (x) { return !x.archivada; }).sort(function (a, b) { return String(a.cat).localeCompare(String(b.cat)) || String(a.nombre).localeCompare(String(b.nombre)); });
  var t = '🧰 Mis herramientas — ' + todayKey() + '\nTotal: ' + items.length + '\n' +
    items.map(function (x) {
      return '• ' + x.nombre + ' (' + (x.cat || '') + (x.cant > 1 ? ' ×' + x.cant : '') + ') · ' + (x.ubi || '') + ' · ' + (x.estado || '') + (x.prestadaA ? ' · prestada a ' + x.prestadaA : '');
    }).join('\n');
  share('Mis herramientas', t);
}

function renderList() {
  var box = $('herList'); if (!box) return;
  var q = (fQ || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var list = store().items.slice().sort(function (a, b) { return (a.archivada ? 1 : 0) - (b.archivada ? 1 : 0) || String(a.nombre).localeCompare(String(b.nombre)); });
  if (fCat !== 'todas') list = list.filter(function (x) { return x.cat === fCat; });
  if (fEst !== 'todos') list = list.filter(function (x) { return x.estado === fEst; });
  if (q) list = list.filter(function (x) {
    var t = ((x.nombre || '') + ' ' + (x.nota || '') + ' ' + (x.prestadaA || '') + ' ' + (x.cat || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin herramientas con ese filtro. Anota la primera arriba: ej "Martillo" 🔨.</p>';
    return;
  }
  box.innerHTML = list.map(function (x) {
    return '<div class="si-card' + (x.archivada ? '" style="opacity:.6' : '') + '"><h4>' + esc((x.cat || '📦').split(' ')[0] + ' ' + x.nombre) + (x.fav ? ' ⭐' : '') + (x.archivada ? ' <span class="chip" style="font-size:10px">archivada</span>' : '') + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(x.cat || '') + '</span>' +
      (x.cant > 1 ? '<span class="chip" style="font-size:10px">×' + esc(String(x.cant)) + '</span>' : '') +
      (x.ubi ? '<span class="chip" style="font-size:10px">📍 ' + esc(x.ubi) + '</span>' : '') +
      (x.estado ? '<span class="chip" style="font-size:10px">' + esc(x.estado) + '</span>' : '') +
      (x.prestadaA ? '<span class="chip" style="font-size:10px">🤝 ' + esc(x.prestadaA) + '</span>' : '') + '</p>' +
      (x.nota ? '<p class="muted">' + esc(x.nota) + '</p>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn her-e" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn her-a" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">' + (x.archivada ? '📂 Reactivar' : '📦 Archivar') + '</button>' +
      '<button type="button" class="btn her-d" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('.her-e').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      editId = x.id;
      $('herNombre').value = x.nombre || ''; $('herCat').value = x.cat || CATS[0];
      $('herCant').value = x.cant || 1; $('herUbi').value = x.ubi || UBIS[0];
      $('herEstado').value = x.estado || ESTADOS[0]; $('herPrest').value = x.prestadaA || '';
      $('herFav').checked = !!x.fav; $('herNota').value = x.nota || '';
      $('herFormTitle').textContent = 'Editar herramienta';
      $('herAdd').textContent = '↻ Actualizar herramienta';
      $('herCancel').classList.remove('hidden');
    };
  });
  box.querySelectorAll('.her-a').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.archivada = !x.archivada; save(); renderAll();
    };
  });
  box.querySelectorAll('.her-d').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta herramienta del inventario?')) return;
      var st = store();
      st.items = st.items.filter(function (x) { return x.id !== b.dataset.k; });
      save(); renderAll();
    };
  });
}

function renderAll() { renderResumen(); renderList(); }

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) botón en Hogar y Vida Práctica > Energía y Taller */
  try {
    var g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
    if (g) {
      if (!$('btnHerramientas')) {
        var btn = document.createElement('button');
        btn.id = 'btnHerramientas'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🧰 Mis Herramientas';
        try { btn.setAttribute('data-sub', 'energia'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'herramientas taller taladro martillo destornillador sierra alicate llave huincha serrucho inventario prestar reponer reparar casa energia');
        // junto a Bitácora Taller: antes de Conversión si existe, si no al final
        var ref = g.querySelector('#btnConvert') || g.querySelector('#btnMecanica');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      } else {
        try { $('btnHerramientas').setAttribute('data-sub', 'energia'); } catch (eS2) {}
      }
    }
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnHerramientas') < 0) ALL_BTNS.push('btnHerramientas');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnHerramientas = ['hogar', 'energia'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|energia'] && BTN_ORDER['hogar|energia'].indexOf('btnHerramientas') < 0) {
      var _o = BTN_ORDER['hogar|energia'], _ni = _o.indexOf('btnMecanica');
      if (_ni >= 0) _o.splice(_ni, 0, 'btnHerramientas');
      else _o.push('btnHerramientas');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnHerramientas = true; });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnHerramientas"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab2 = document.createElement('label');
          lab2.className = 'check-row';
          lab2.innerHTML = '<input type="checkbox" data-btn="btnHerramientas"> 🧰 Mis Herramientas';
          gr.appendChild(lab2);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab2.querySelector('input').checked = !vis || vis.btnHerramientas !== false;
            lab2.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnHerramientas = lab2.querySelector('input').checked;
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

  /* 2) diálogo */
  buildDialog();
  renderAll();

  var b = $('btnHerramientas');
  if (b) b.onclick = function () {
    renderAll();
    switchTab('Resumen');
    openDlg('herramientasDialog');
  };

  TABS.forEach(function (t) {
    var tb = $('tabHer' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  /* Guardar */
  var ad = $('herAdd');
  if (ad) ad.onclick = function () {
    var nombre = clean((($('herNombre') || {}).value || '').trim(), 40);
    if (!nombre) return alert('Anota la herramienta (ej: Taladro, Martillo, Huincha)');
    var st = store();
    var datos = {
      nombre: nombre, cat: ($('herCat') || {}).value || CATS[0],
      cant: Math.max(1, parseInt(($('herCant') || {}).value) || 1),
      ubi: ($('herUbi') || {}).value || UBIS[0],
      estado: ($('herEstado') || {}).value || ESTADOS[0],
      prestadaA: clean((($('herPrest') || {}).value || '').trim(), 40),
      fav: !!($('herFav') || {}).checked,
      nota: clean((($('herNota') || {}).value || '').trim(), 100)
    };
    if (datos.estado === '🤝 Prestada' && !datos.prestadaA) {
      datos.prestadaA = prompt('¿A quién se la prestaste?') || '';
      datos.prestadaA = clean(datos.prestadaA, 40);
    }
    if (editId) {
      var ex = byId(editId);
      if (ex) Object.keys(datos).forEach(function (k) { ex[k] = datos[k]; });
      editId = null;
      $('herFormTitle').textContent = 'Nueva herramienta';
      ad.textContent = '+ Guardar herramienta';
      $('herCancel').classList.add('hidden');
    } else {
      datos.id = uid('he'); datos.archivada = false; datos.creado = todayKey();
      st.items.push(datos);
    }
    save('Herramienta guardada 🧰');
    $('herNombre').value = ''; $('herPrest').value = ''; $('herNota').value = ''; $('herFav').checked = false;
    renderAll();
  };
  var cc = $('herCancel');
  if (cc) cc.onclick = function () {
    editId = null;
    $('herFormTitle').textContent = 'Nueva herramienta';
    $('herAdd').textContent = '+ Guardar herramienta';
    cc.classList.add('hidden');
    $('herNombre').value = ''; $('herPrest').value = ''; $('herNota').value = '';
  };
  var qq = $('herQ'); if (qq) qq.oninput = function () { fQ = qq.value; renderList(); };
  var fq = $('herFQ'); if (fq) fq.onchange = function () { fCat = fq.value; renderList(); };
  var fe = $('herFE'); if (fe) fe.onchange = function () { fEst = fe.value; renderList(); };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
