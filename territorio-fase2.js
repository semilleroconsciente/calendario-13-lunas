/* ============================================================
   TERRITORIO FASE 2 — Calendario 13 Lunas (Penco · Bío-Bío)
   7 secciones nuevas dentro de Territorio Penco:
     1. 🐝 Meliponicultura / Apicultura lunar (btnMeli)
     2. 🐋 Ballenas y fauna marina migratoria (btnBallenas)
     3. 🍄 Micología del bosque (btnHongos)
     4. 🚶 Senderos de Penco (btnSenderos)
     5. 🛶 Kayak y remo (btnKayak)
     6. 💧 Captación de agua de lluvia (dentro de Agua, btnAgua)
     7. 🔥 Temporada de incendios Walüng (btnFuego)
   Patrón: botón inyectado en Territorio + <dialog> propio +
   bitácora privada por usuario (userData + scheduleSave).
   Todo local, sin red obligatoria.
   ============================================================ */
(function () {
'use strict';

/* ---------- helpers compartidos ---------- */
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
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function lunaTxt(key) {
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  return '';
}
function tithiHoy() {
  try {
    if (window.astro && window.astro.tithi) return window.astro.tithi(new Date(todayKey() + 'T12:00:00').getTime());
  } catch (e) {}
  return -1;
}
function faseManejo(tithi) {
  if (tithi < 0) return null;
  if (tithi < 7) return 'creciente';
  if (tithi < 14) return 'llena';
  if (tithi < 21) return 'menguante';
  return 'nueva';
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function openDlg(id) {
  var d = $(id);
  if (!d) return;
  try { if (d.showModal) d.showModal(); else d.show(); } catch (e) { try { d.setAttribute('open', ''); } catch (e2) {} }
}
function closeDlg(id) { try { $(id).close(); } catch (e) {} }
function gotoBtn(id, dlgId) {
  try { if (dlgId) closeDlg(dlgId); } catch (e) {}
  setTimeout(function () { try { $(id).click(); } catch (e2) {} }, 150);
}
function registerBtn(id) {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf(id) < 0) {
      var i = ORDEN_TERRITORIO.indexOf('btnCompost');
      if (i >= 0) ORDEN_TERRITORIO.splice(i + 1, 0, id);
      else ORDEN_TERRITORIO.push(id);
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnCompost && p[id] === undefined) p[id] = true;
      });
    }
  } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}
function injectTerrBtn(id, txt, kw, afterId) {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g || $(id)) return $(id);
  var b = document.createElement('button');
  b.id = id; b.className = 'btn'; b.type = 'button';
  b.textContent = txt;
  b.setAttribute('data-sub', 'tierra');
  b.setAttribute('data-keywords', kw);
  var ref = afterId ? $(afterId) : null;
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
    else g.appendChild(b);
  } else g.appendChild(b);
  return b;
}
function logListRender(boxId, statsId, arr, rowFn, emptyTxt) {
  var box = $(boxId);
  if (!box) return;
  var stats = statsId ? $(statsId) : null;
  if (!arr.length) { box.innerHTML = '<p class="muted">' + emptyTxt + '</p>'; if (stats) stats.textContent = '0 registros'; return; }
  var sorted = arr.slice().sort(function (a, b) { return ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')); });
  box.innerHTML = sorted.slice(0, 80).map(rowFn).join('');
}

/* ============================================================
   1. 🐝 MELIPONICULTURA / APICULTURA LUNAR
   Tradición real por fases: cosecha en menguante (menos pillaje
   y miel más densa), inspección amplia en creciente (cría en
   alza, espacio). En Penco lo concreto es Apis + protección del
   chito (Bombus dahlbomii, nativo gigante en retroceso): al
   chito NO se le cosecha, se le cuida.
   Complementa a Flora (floración) y Siembra (polinización).
   ============================================================ */
var MELI_ESPECIES = [
  { nombre: 'Abeja melífera', cient: 'Apis mellifera', rol: '🍯 Productiva (introducida)', flor: 'Todo el año; pico Pewü–Walüng (chilco, maqui, boldo, quillay)', nota: 'La de cajón. Cosecha en menguante, revisa en creciente. 1–2 alzas por colmena en Penco urbano-rural.', orn: 'Cajón a 50 cm del suelo, piquera al norte, agua con piedras a 5 m.' },
  { nombre: 'Chito / Abejorro chileno', cient: 'Bombus dahlbomii', rol: '🌿 Nativa protegida (NO cosechar)', flor: 'Pewü–Walüng (chilco, tabaco del diablo, chagual)', nota: 'El abejorro colorín gigante, en fuerte retroceso por el abejorro europeo. Si lo ves: foto + flor + fecha. No se toca el nido.', orn: 'Deja chilco y tabaco del diablo sin podar en flor; nada de insecticida de 10–16h.' },
  { nombre: 'Abejorro europeo', cient: 'Bombus terrestris', rol: '⚠️ Introducido invasor', flor: 'Todo el año', nota: 'Desplaza al chito y rompe flores. No lo críes ni lo traslades. Anótalo si lo ves para distinguirlo del chito.', orn: 'Cola blanca + bandas amarillas (chito: todo colorín leonado).' },
  { nombre: 'Abeja carpintera', cient: 'Xylocopa augusti', rol: '🌿 Nativa solitaria', flor: 'Pewü–Walüng', nota: 'Negra grande que perfora madera seca. No es plaga: tapa solo lo estructural y deja troncos viejos para nido.', orn: 'Hotel de insectos con troncos perforados a 1,5 m, cara norte.' },
  { nombre: 'Abejitas verdes / Halíctidos', cient: 'Halictidae spp.', rol: '🌿 Nativas solitarias', flor: 'Pewü–Rimü (azulillo, añañuca, huilmo)', nota: 'Pequeñas verdes metálicas, grandes polinizadoras de jardín nativo. Anidan en suelo desnudo.', orn: 'Deja un parche de suelo sin mulch ni riego para sus nidos.' }
];
var MELI_LUNA = [
  { f: '🌑 Nueva', t: 'Descanso y taller', d: 'No abras colmenas. Repara cajones, funde cera, arma marcos, limpia bebederos. Planifica divisiones para la creciente que viene.' },
  { f: '🌒 Creciente', t: 'Inspección y espacio', d: 'Revisión completa cada 7–10 días: postura, cría, espacio. Pon alza cuando 7/10 marcos estén llenos. Momento de divisiones y núcleos. Alimenta solo si no hay flujo (lluvia larga en Pukem).' },
  { f: '🌕 Llena', t: 'Máxima actividad — manos fuera al mediodía', d: 'Pecoreo y defensa al máximo: no abras entre 11–16h. Observa piquera (polen entrando = cría sana). Marca floraciones para la bitácora de Flora.' },
  { f: '🌖 Menguante', t: 'Cosecha y sanidad', d: 'COSECHA de miel (menos pillaje, miel más densa y operculada). Control de varroa, recambio de reina vieja, reducción de piquera si entra Pukem. Guarda miel en frasco ámbar + fecha + luna.' }
];
function getMeli() { var a = store('meliLog', []); return Array.isArray(a) ? a : []; }
function getMeliCustom() { var a = store('meliCustom', []); return Array.isArray(a) ? a : []; }
function allMeliSpecies() {
  var base = MELI_ESPECIES.map(function (f) { var c = {}; for (var k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) c[k] = f[k]; } c.mine = false; return c; });
  var mine = getMeliCustom().map(function (f) { var c = {}; for (var k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) c[k] = f[k]; } c.mine = true; return c; });
  return base.concat(mine);
}
var meliTab = 'hoy', meliEditingId = null;
function switchMeliTab(t) {
  meliTab = t;
  [['hoy', 'meliHoyPanel', 'tabMeliHoy'], ['especies', 'meliEspPanel', 'tabMeliEsp'], ['bit', 'meliBitPanel', 'tabMeliBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderMeliHoy();
  if (t === 'bit') renderMeliLog();
}
function renderMeliHoy() {
  var box = $('meliTodayBox');
  if (box) {
    var k = todayKey(), data = getMeli();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    var kg = data.reduce(function (a, r) { return a + (parseFloat(r.kg) || 0); }, 0);
    var t = tithiHoy(), fase = faseManejo(t);
    var consejo = fase === 'menguante' ? '🌖 <b>Menguante: ventana de COSECHA</b> — marcos operculados + humo suave + deja 8–10 kg por colmena para Pukem.'
      : fase === 'creciente' ? '🌒 <b>Creciente: ventana de INSPECCIÓN</b> — revisa postura y espacio, pon alza si 7/10 marcos llenos.'
      : fase === 'llena' ? '🌕 <b>Llena: observa, no abras al mediodía</b> — mira piquera y anota floración.'
      : fase === 'nueva' ? '🌑 <b>Nueva: taller</b> — repara cajones, funde cera, arma marcos.'
      : 'Mira la luna de hoy y elige: creciente = abrir, menguante = cosechar.';
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span style="font-size:14px"><b>🐝 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip" style="background:var(--gold);color:#10142c">' + hoy + ' hoy · ' + data.length + ' total · ' + kg.toFixed(1) + ' kg miel</span></div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">Cosecha en <b>menguante</b> · inspección en <b>creciente</b>. Al <b>chito no se le cosecha</b>: se protege. ' + esc(lunaTxt(k)) + (t >= 0 ? ' (tithi ' + t + ')' : '') + '</p>' +
      '<div class="chip" style="display:block;white-space:normal;margin-top:6px">' + consejo + '</div>';
  }
  var lb = $('meliLunaBox');
  if (lb) {
    lb.innerHTML = MELI_LUNA.map(function (m) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + esc(m.f) + ' — ' + esc(m.t) + '</h4><p style="font-size:11px">' + esc(m.d) + '</p></div>';
    }).join('');
  }
  var cb = $('meliCatalogBox');
  if (cb) {
    var meliList = allMeliSpecies();
    var meliMine = getMeliCustom().length;
    cb.innerHTML = '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + MELI_ESPECIES.length + ' base' + (meliMine ? ' + <b>' + meliMine + ' mías</b>' : '') + ' · toca una para cargarla en la bitácora.</p>' +
      '<div class="fishing-species">' + meliList.map(function (f) {
      var inv = /Introducido|invasor/i.test(f.rol || '');
      var border = inv ? ';border-color:#e76e8a44' : (f.mine ? ';border-color:#a9d18e55' : '');
      return '<div class="fishing-species-item" style="cursor:pointer' + border + '" data-meli="' + esc(f.nombre) + '">' +
        '<b style="font-size:12px">🐝 ' + esc(f.nombre) + '</b>' + (f.mine ? ' <span class="chip" style="font-size:9px;background:#a9d18e22;color:#a9d18e;border-color:#a9d18e55">mía</span>' : '') +
        '<div style="font-size:10px;color:var(--muted);font-style:italic">' + esc(f.cient || '') + '</div>' +
        '<div style="margin:4px 0"><span class="chip" style="font-size:9px">' + esc(f.rol || '') + '</span></div>' +
        '<div style="font-size:11px">🌸 ' + esc(f.flor || '') + '</div>' +
        '<div class="muted" style="font-size:10.5px;margin-top:2px">' + esc(f.nota || '') + '</div>' +
        (f.orn ? '<div style="font-size:10.5px;margin-top:4px;background:rgba(232,197,106,.07);border:1px solid rgba(232,197,106,.28);border-radius:8px;padding:6px 8px">👉 ' + esc(f.orn) + '</div>' : '') +
        (f.mine && f.id ? '<div style="margin-top:6px"><button type="button" class="btn" data-melidel="' + f.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar mi especie</button></div>' : '') + '</div>';
    }).join('') + '</div>' +
    '<details style="border:1px dashed var(--gold);border-radius:10px;padding:8px 10px;margin-top:6px"><summary style="cursor:pointer;font-size:12px;color:var(--gold)"><b>➕ Agregar especie</b></summary>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Especie * <input type="text" id="meliSpName" placeholder="ej: Abeja verde metálica" maxlength="40"></label></div>' +
    '<div class="conv-row"><label style="flex:2">Nombre científico <input type="text" id="meliSpCient" placeholder="ej: Augochlora sp." maxlength="50"></label>' +
    '<label>Rol <select id="meliSpRol"><option>🌿 Nativa solitaria</option><option>🌿 Nativa protegida (NO cosechar)</option><option>🍯 Productiva (introducida)</option><option>⚠️ Introducido invasor</option><option>🌿 Nativas solitarias</option></select></label></div>' +
    '<label>Flores que visita <input type="text" id="meliSpFlor" placeholder="ej: Pewü–Walüng (chilco, quillay)" maxlength="80"></label>' +
    '<label>Nota <input type="text" id="meliSpNota" placeholder="ej: Pequeña, anida en suelo, gran polinizadora" maxlength="120"></label>' +
    '<label>Manejo / orn <input type="text" id="meliSpOrn" placeholder="ej: Deja parche de suelo sin mulch para nidos" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="meliSpAdd" class="btn btn-accent" style="width:auto">+ Guardar especie</button></div></details>' +
    '<p class="muted" style="font-size:10px;margin-top:6px">Toca una especie para cargarla en la bitácora.</p>';
    cb.querySelectorAll('[data-meli]').forEach(function (el) {
      el.onclick = function (e) {
        try { if (e && e.target && e.target.getAttribute && e.target.getAttribute('data-melidel')) return; } catch (e2) {}
        switchMeliTab('bit');
        setTimeout(function () {
          var inp = $('meliSpecies');
          if (inp) { inp.value = el.getAttribute('data-meli'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e3) {} }
        }, 60);
      };
    });
    cb.querySelectorAll('[data-melidel]').forEach(function (b) {
      b.onclick = function (e) {
        try { if (e && e.stopPropagation) e.stopPropagation(); } catch (e2) {}
        if (!confirm('¿Borrar tu especie?')) return;
        var arr = getMeliCustom();
        var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-melidel'); });
        if (i >= 0) arr.splice(i, 1);
        save('Especie borrada');
        renderMeliHoy();
      };
    });
    var madd = $('meliSpAdd');
    if (madd) madd.onclick = function () {
      var n = clean(($('meliSpName') || {}).value || '', 40).trim();
      if (!n) { alert('Pon el nombre de la especie'); return; }
      var arr = getMeliCustom();
      var exists = allMeliSpecies().some(function (x) { return String(x.nombre || '').toLowerCase() === n.toLowerCase(); });
      if (exists) { alert('Esa especie ya existe'); return; }
      arr.push({
        id: uid('me-sp'),
        nombre: n,
        cient: clean(($('meliSpCient') || {}).value || '', 50),
        rol: (($('meliSpRol') || {}).value || '🌿 Nativa solitaria'),
        flor: clean(($('meliSpFlor') || {}).value || '', 80) || 'Penco',
        nota: clean(($('meliSpNota') || {}).value || '', 120),
        orn: clean(($('meliSpOrn') || {}).value || '', 120)
      });
      save('Especie guardada 🐝');
      renderMeliHoy();
    };
  }
}
function meliShareText(arr) {
  if (!arr.length) return 'Bitácora apícola lunar — Penco · sin registros aún';
  var t = '🐝 Bitácora apícola lunar — Penco\n' + arr.length + ' registros\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + (e.hive || 'colmena') + ' · ' + e.species + ' (' + (e.action || '—') + ')' + (e.kg ? ' · ' + e.kg + ' kg' : '') + (e.place ? ' · ' + e.place : '');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderMeliLog() {
  var data = getMeli();
  logListRender('meliLogBox', 'meliStats', data, function (it) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(it.species) + '</b> · <span class="chip" style="font-size:10px">' + esc(it.action || '—') + '</span>' + (it.kg ? ' · 🍯 ' + esc(it.kg) + ' kg' : '') + ' — ' + esc(it.hive || '—') +
      '<br><span class="muted" style="font-size:11px">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted" style="font-size:11px">' + esc(it.notes || '') + '</span></span>' +
      '<span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="' + it.id + '" class="btn meli-share" style="width:auto;font-size:11px">📤</button><button data-id="' + it.id + '" class="btn meli-edit" style="width:auto;font-size:11px">✏️</button><button data-id="' + it.id + '" class="btn meli-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
  }, 'Sin registros. Anota tu primera inspección o un avistamiento de chito: fecha, colmena/flor y luna valen manejo.');
  var box = $('meliLogBox');
  if (!box || !data.length) return;
  var kg = data.reduce(function (a, r) { return a + (parseFloat(r.kg) || 0); }, 0);
  var st = $('meliStats');
  if (st) st.textContent = data.length + ' registros · 🍯 ' + kg.toFixed(1) + ' kg miel total';
  box.querySelectorAll('.meli-share').forEach(function (b) {
    b.onclick = function () {
      var it = getMeli().find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (it) share('🐝 ' + it.species + ' · ' + it.date, '🐝 ' + it.species + ' (' + (it.action || '') + ') · ' + it.date + '\n🍯 ' + (it.kg || '0') + ' kg · ' + (it.hive || '') + '\n🌙 ' + lunaTxt(it.date) + '\n— Bitácora apícola · Mari Küla Küyen');
    };
  });
  box.querySelectorAll('.meli-edit').forEach(function (b) {
    b.onclick = function () {
      var d = getMeli().find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (!d) return;
      meliEditingId = d.id;
      $('meliDate').value = d.date; $('meliTime').value = d.time || '10:00'; $('meliHive').value = d.hive || '';
      $('meliSpecies').value = d.species || ''; $('meliAction').value = d.action || 'inspección';
      $('meliKg').value = d.kg || ''; $('meliNotes').value = d.notes || '';
      $('meliAdd').textContent = '↻ Actualizar'; $('meliCancelEdit').classList.remove('hidden');
    };
  });
  box.querySelectorAll('.meli-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar registro apícola?')) return;
      var arr = getMeli();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderMeliLog(); renderMeliHoy();
    };
  });
}
function ensureMeliDialog() {
  if ($('meliDialog')) return $('meliDialog');
  var d = document.createElement('dialog');
  d.id = 'meliDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🐝 Apicultura lunar — Penco</h3>' +
    '<button type="button" id="meliCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Cosecha en <b>menguante</b>, inspección en <b>creciente</b>. Protege al <b>chito</b> (no se cosecha). Registro <b>privado y local</b>.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabMeliHoy" class="btn btn-accent" style="width:auto">🐝 Hoy lunar</button>' +
    '<button type="button" id="tabMeliEsp" class="btn" style="width:auto">🐝 Especies</button>' +
    '<button type="button" id="tabMeliBit" class="btn" style="width:auto">📓 Bitácora colmenas</button></div>' +
    '<div id="meliHoyPanel"><div id="meliTodayBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌙 Calendario de manejo por luna</h4><div id="meliLunaBox" style="display:flex;flex-direction:column;gap:8px"></div></div></div>' +
    '<div id="meliEspPanel" class="hidden"><div class="menstrual-card"><h4>🐝 Catálogo local — productivas y nativas</h4><div id="meliCatalogBox"></div>' +
    '<p class="muted" style="font-size:10px;margin-top:6px">⚠️ Si eres alérgico/a lleva adrenalina y avisa a tu red. Humo suave, traje claro, nunca abras con tormenta ni de noche.</p></div></div>' +
    '<div id="meliBitPanel" class="hidden"><div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitácora de colmenas</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="meliDate"></label><label>Hora <input type="time" id="meliTime" value="10:00"></label>' +
    '<label>Colmena / nido <input type="text" id="meliHive" placeholder="ej: Cajón 1, Nido chito quebrada" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Especie <input type="text" id="meliSpecies" placeholder="ej: Melífera, Chito" maxlength="30"></label>' +
    '<label>Acción <select id="meliAction"><option>inspección</option><option>cosecha</option><option>alimentación</option><option>control varroa</option><option>división / núcleo</option><option>avistamiento chito</option><option>reparación material</option></select></label>' +
    '<label>Miel kg <input type="text" id="meliKg" placeholder="ej: 4.5" maxlength="10"></label></div>' +
    '<label>Notas <input type="text" id="meliNotes" placeholder="ej: 8 marcos llenos, puse alza, polen naranjo" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="meliAdd" class="btn btn-accent" style="width:auto">+ Guardar</button>' +
    '<button type="button" id="meliCancelEdit" class="btn hidden" style="width:auto">Cancelar</button></div>' +
    '<div id="meliLogBox" class="habits-list" style="margin-top:10px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="meliStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="meliShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="meliExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="meliClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap">' +
    '<button type="button" id="meliGoFlora" class="btn" style="width:auto;font-size:11px">🌸 Ir a Flora</button>' +
    '<button type="button" id="meliGoBosque" class="btn" style="width:auto;font-size:11px">🌳 Ir a Bosque</button>' +
    '<button type="button" id="meliGoSiembra" class="btn" style="width:auto;font-size:11px">🌱 Ir a Siembra</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="meliClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireMeli() {
  injectTerrBtn('btnMeli', '🐝 Abejas', 'abejas apicultura miel colmena chito abejorro melipona cera varroa cosecha menguante creciente polinizacion', 'btnFlora');
  ensureMeliDialog();
  registerBtn('btnMeli');
  var btn = $('btnMeli');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchMeliTab(meliTab || 'hoy');
      renderMeliHoy(); renderMeliLog();
      var d = $('meliDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('meliDialog');
    };
  }
  var t1 = $('tabMeliHoy'), t2 = $('tabMeliEsp'), t3 = $('tabMeliBit');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchMeliTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchMeliTab('especies'); renderMeliHoy(); }; }
  if (t3 && !t3.dataset.w) { t3.dataset.w = '1'; t3.onclick = function () { switchMeliTab('bit'); }; }
  var ct = $('meliCloseTop'), cb = $('meliClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('meliDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('meliDialog'); }; }
  var add = $('meliAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('meliDate') || {}).value || '';
      var species = clean(($('meliSpecies') || {}).value || '', 30).trim();
      if (!date || !species) { alert('Fecha y especie son obligatorias'); return; }
      var rec = {
        id: meliEditingId || uid('me'),
        date: date, time: ($('meliTime') || {}).value || '10:00',
        hive: clean(($('meliHive') || {}).value || '', 30),
        species: species, action: ($('meliAction') || {}).value || 'inspección',
        kg: clean(($('meliKg') || {}).value || '', 10),
        notes: clean(($('meliNotes') || {}).value || '', 80)
      };
      var arr = getMeli();
      if (meliEditingId) {
        var ix = arr.findIndex(function (x) { return x.id === meliEditingId; });
        if (ix >= 0) arr[ix] = rec;
        meliEditingId = null; add.textContent = '+ Guardar';
        $('meliCancelEdit').classList.add('hidden');
      } else arr.push(rec);
      save('Registro apícola guardado 🐝');
      $('meliSpecies').value = ''; $('meliKg').value = ''; $('meliNotes').value = '';
      renderMeliLog(); renderMeliHoy();
    };
  }
  var cancel = $('meliCancelEdit');
  if (cancel && !cancel.dataset.w) {
    cancel.dataset.w = '1';
    cancel.onclick = function () {
      meliEditingId = null; $('meliAdd').textContent = '+ Guardar';
      cancel.classList.add('hidden'); $('meliSpecies').value = '';
    };
  }
  var clear = $('meliClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora apícola?')) return;
      store('meliLog', []).length = 0;
      save(); renderMeliLog(); renderMeliHoy();
    };
  }
  var sh = $('meliShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getMeli();
      if (!d.length) { alert('Sin registros'); return; }
      share('🐝 Mi bitácora apícola — Penco', meliShareText(d));
    };
  }
  var ex = $('meliExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getMeli();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([meliShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bitacora-apicola-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gf = $('meliGoFlora'), gb = $('meliGoBosque'), gs = $('meliGoSiembra');
  if (gf && !gf.dataset.w) { gf.dataset.w = '1'; gf.onclick = function () { gotoBtn('btnFlora', 'meliDialog'); }; }
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBosque', 'meliDialog'); }; }
  if (gs && !gs.dataset.w) { gs.dataset.w = '1'; gs.onclick = function () { gotoBtn('btnSiembra', 'meliDialog'); }; }
}
window.MeliPenco = { tab: switchMeliTab, renderHoy: renderMeliHoy, renderLog: renderMeliLog, list: getMeli, especies: MELI_ESPECIES, luna: MELI_LUNA, customs: getMeliCustom, todas: allMeliSpecies };

/* ============================================================
   2. 🐋 BALLENAS Y FAUNA MARINA MIGRATORIA
   El trempülcahue (ballena) ya vive en la guía de Duelo como
   viaje al más allá; aquí se vuelve temporada viva: franca
   austral, piloto y delfines en Bahía Concepción y Golfo de
   Arauco. Puntos desde Penco/Lirquén + bitácora. Cosmovisión
   + turismo local con respeto (distancia, no perseguir).
   ============================================================ */
var BALLENA_ESPECIES = [
  { nombre: 'Ballena franca austral', cient: 'Eubalaena australis', temp: '🐋 Jul–Nov (pico ago–oct)', nota: 'Lomo negro sin aleta dorsal, callosidades blancas. La más vista desde costa en el Golfo. Si ves soplo en V: anota hora y rumbo.', punto: 'Mirador Cerro Verde · borde Lirquén · Playa Negra' },
  { nombre: 'Calderón / Ballena piloto', cient: 'Globicephala melas', temp: '🐋 Otoño–primavera (grupos)', nota: 'Grupos grandes de aleta curva. A veces se acercan a la bahía siguiendo jurel. Nunca rodear con kayak/bote.', punto: 'Borde costero Penco · salida en bote caleta' },
  { nombre: 'Ballena jorobada', cient: 'Megaptera novaeangliae', temp: '🐋 Paso ocasional (verano–otoño)', nota: 'Salto y cola blanca por debajo. Registro escaso pero posible. Foto de cola = huella dactilar.', punto: 'Mar abierto Golfo de Arauco' },
  { nombre: 'Delfín austral / Tonina', cient: 'Lagenorhynchus australis', temp: '🐬 Todo el año', nota: 'Grupos chicos y veloces tras cardúmenes. Indican pique: avisa a Pesca.', punto: 'Bahía Concepción · desembocadura estero' },
  { nombre: 'Lobo marino', cient: 'Otaria flavescens', temp: '🦭 Todo el año', nota: 'Rocas de La Cata y Tumbes. No alimentar ni acercarse a crías. Si ves uno herido: Sernapesca 800 320 032.', punto: 'Roqueríos La Cata · Isla Quiriquina (lejos)' },
  { nombre: 'Pingüino de Humboldt', cient: 'Spheniscus humboldti', temp: '🐧 Invierno–primavera', nota: 'Ocasional en el Golfo. Si lo ves en playa: distancia 50 m, perros lejos, avisa a SAG/Sernapesca.', punto: 'Playa Negra · Lirquén' }
];
var BALLENA_PUNTOS = [
  { n: 'Mirador Cerro Verde', d: 'Altura con vista total a la bahía. Mejor 08–11h sin viento sur, con binoculares. Soplo visible a 2–5 km.' },
  { n: 'Borde costero Lirquén–Penco', d: 'Caminata de orilla al atardecer (hora dorada). Mar calmo tras sur = mejor ventana.' },
  { n: 'Playa Negra / La Cata', d: 'Roquerío + poza. Bajamar + mañana = lobos y aves; con marea alta y mar calmo, delfines cerca.' },
  { n: 'Embarcado con caleta', d: 'Solo con pescador local autorizado, chaleco siempre, 100 m mínimo a ballenas, motor en neutro si se acercan.' }
];
function getBallenas() { var a = store('ballenaLog', []); return Array.isArray(a) ? a : []; }
var balTab = 'hoy';
function switchBalTab(t) {
  balTab = t;
  [['hoy', 'balHoyPanel', 'tabBalHoy'], ['bit', 'balBitPanel', 'tabBalBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderBalHoy();
  if (t === 'bit') renderBalLog();
}
function mesActual() { try { return new Date().getMonth() + 1; } catch (e) { return 1; } }
function enTemporada() { var m = mesActual(); return (m >= 7 && m <= 11); }
function renderBalHoy() {
  var box = $('balTodayBox');
  if (box) {
    var k = todayKey(), data = getBallenas();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    var enT = enTemporada();
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span style="font-size:14px"><b>🐋 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip" style="background:' + (enT ? 'var(--gold);color:#10142c' : 'var(--panel)') + '">' + (enT ? '🐋 EN TEMPORADA (jul–nov)' : '🌊 fuera de pico · delfines y lobos todo el año') + '</span></div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">Trempülcahue: la ballena que lleva a los que parten. Observar es honrar: <b>distancia, silencio y sin perseguir</b>. ' + hoy + ' hoy · ' + data.length + ' total · ' + esc(lunaTxt(k)) + '</p>' +
      '<p class="muted" style="font-size:11px">🌙 Luna llena + pleamar + amanecer = mejor visibilidad. Con luna oscura los soplos se oyen más que se ven.</p>';
  }
  var cb = $('balCatalogBox');
  if (cb) {
    cb.innerHTML = '<div class="fishing-species">' + BALLENA_ESPECIES.map(function (f) {
      return '<div class="fishing-species-item" style="cursor:pointer" data-bal="' + esc(f.nombre) + '">' +
        '<b style="font-size:12px">' + esc(f.nombre) + '</b><div style="font-size:10px;color:var(--muted);font-style:italic">' + esc(f.cient) + '</div>' +
        '<div style="margin:4px 0"><span class="chip" style="font-size:9px">' + esc(f.temp) + '</span></div>' +
        '<div class="muted" style="font-size:10.5px">' + esc(f.nota) + '</div>' +
        '<div style="font-size:10.5px;margin-top:4px">📍 ' + esc(f.punto) + '</div></div>';
    }).join('') + '</div><p class="muted" style="font-size:10px;margin-top:6px">Toca una especie para cargarla en la bitácora.</p>' +
    '<div class="menstrual-card" style="margin-top:8px;background:var(--panel)"><h4 style="font-size:11px">📍 Puntos desde Penco / Lirquén</h4>' +
    BALLENA_PUNTOS.map(function (p) { return '<p style="font-size:11px"><b>' + esc(p.n) + ':</b> ' + esc(p.d) + '</p>'; }).join('') +
    '<p class="muted" style="font-size:10px">⚠️ 100 m mínimo a ballenas · motor en neutro · nunca entre madre y cría · basura de vuelta.</p></div>';
    cb.querySelectorAll('[data-bal]').forEach(function (el) {
      el.onclick = function () {
        switchBalTab('bit');
        setTimeout(function () {
          var inp = $('balSpecies');
          if (inp) { inp.value = el.getAttribute('data-bal'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
        }, 60);
      };
    });
  }
}
function balShareText(arr) {
  if (!arr.length) return 'Bitácora de ballenas y fauna marina — Bahía Concepción / Golfo de Arauco · sin registros aún';
  var t = '🐋 Bitácora ballenas y fauna marina — Penco / Golfo de Arauco\n' + arr.length + ' avistamientos\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + e.species + ' ×' + (e.count || '1') + ' · ' + (e.place || '—');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderBalLog() {
  var data = getBallenas();
  logListRender('balLogBox', 'balStats', data, function (it) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(it.species) + '</b> ×' + esc(it.count || '1') + ' — ' + esc(it.place || '—') +
      '<br><span class="muted" style="font-size:11px">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted" style="font-size:11px">' + esc(it.notes || '') + '</span></span>' +
      '<span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="' + it.id + '" class="btn bal-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
  }, 'Sin avistamientos. Sube al mirador en temporada (jul–nov) 08–11h y anota soplo, rumbo y cantidad.');
  var box = $('balLogBox');
  if (!box || !data.length) return;
  var st = $('balStats');
  if (st) {
    var spp = {};
    data.forEach(function (x) { spp[String(x.species || '').toLowerCase()] = 1; });
    st.textContent = data.length + ' avistamientos · ' + Object.keys(spp).length + ' especies';
  }
  box.querySelectorAll('.bal-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar avistamiento?')) return;
      var arr = getBallenas();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderBalLog(); renderBalHoy();
    };
  });
}
function ensureBalDialog() {
  if ($('balDialog')) return $('balDialog');
  var d = document.createElement('dialog');
  d.id = 'balDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🐋 Ballenas y fauna marina — Golfo de Arauco</h3>' +
    '<button type="button" id="balCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Trempülcahue en temporada <b>jul–nov</b>. Observa desde costa con respeto. Registro <b>privado y local</b>.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabBalHoy" class="btn btn-accent" style="width:auto">🐋 Temporada hoy</button>' +
    '<button type="button" id="tabBalBit" class="btn" style="width:auto">📓 Bitácora avistamientos</button></div>' +
    '<div id="balHoyPanel"><div id="balTodayBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🐋 Especies + 📍 puntos</h4><div id="balCatalogBox"></div></div></div>' +
    '<div id="balBitPanel" class="hidden"><div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitácora — avistamientos</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="balDate"></label><label>Hora <input type="time" id="balTime" value="09:00"></label>' +
    '<label>Lugar <input type="text" id="balPlace" placeholder="ej: Mirador Cerro Verde" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Especie <input type="text" id="balSpecies" placeholder="ej: Franca austral" maxlength="30"></label>' +
    '<label>Cantidad <input type="number" id="balCount" min="1" value="1" style="width:80px"></label></div>' +
    '<label>Notas <input type="text" id="balNotes" placeholder="ej: 2 soplos rumbo norte, con cría, mar calmo" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="balAdd" class="btn btn-accent" style="width:auto">+ Guardar avistamiento</button></div>' +
    '<div id="balLogBox" class="habits-list" style="margin-top:10px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="balStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="balShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="balExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="balClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap">' +
    '<button type="button" id="balGoFish" class="btn" style="width:auto;font-size:11px">🎣 Ir a Pesca</button>' +
    '<button type="button" id="balGoTides" class="btn" style="width:auto;font-size:11px">🌊 Ir a Mareas</button>' +
    '<button type="button" id="balGoDuelo" class="btn" style="width:auto;font-size:11px">🕊️ Trempülcahue en Duelo</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="balClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireBallenas() {
  injectTerrBtn('btnBallenas', '🐋 Ballenas', 'ballenas fauna marina trempulcahue franca austral piloto delfin lobo marino pinguino avistamiento golfo arauco bahia mirador temporada', 'btnMeli');
  ensureBalDialog();
  registerBtn('btnBallenas');
  try {
    var b = $('btnMeli');
    if (b) b.setAttribute('data-sub', 'tierra');
    var bb = $('btnBallenas');
    if (bb) bb.setAttribute('data-sub', 'mar');
  } catch (e) {}
  var btn = $('btnBallenas');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchBalTab(balTab || 'hoy');
      renderBalHoy(); renderBalLog();
      var d = $('balDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('balDialog');
    };
  }
  var t1 = $('tabBalHoy'), t2 = $('tabBalBit');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchBalTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchBalTab('bit'); }; }
  var ct = $('balCloseTop'), cb = $('balClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('balDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('balDialog'); }; }
  var add = $('balAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('balDate') || {}).value || '';
      var species = clean(($('balSpecies') || {}).value || '', 30).trim();
      if (!date || !species) { alert('Fecha y especie son obligatorias'); return; }
      getBallenas().push({
        id: uid('ba'), date: date, time: ($('balTime') || {}).value || '09:00',
        place: clean(($('balPlace') || {}).value || '', 30),
        species: species, count: ($('balCount') || {}).value || '1',
        notes: clean(($('balNotes') || {}).value || '', 80)
      });
      save('Avistamiento guardado 🐋');
      $('balSpecies').value = ''; $('balNotes').value = '';
      renderBalLog(); renderBalHoy();
    };
  }
  var clear = $('balClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de avistamientos?')) return;
      store('ballenaLog', []).length = 0;
      save(); renderBalLog(); renderBalHoy();
    };
  }
  var sh = $('balShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getBallenas();
      if (!d.length) { alert('Sin registros'); return; }
      share('🐋 Mis avistamientos — Golfo de Arauco', balShareText(d));
    };
  }
  var ex = $('balExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getBallenas();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([balShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'avistamientos-ballenas-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gf = $('balGoFish'), gt = $('balGoTides'), gd = $('balGoDuelo');
  if (gf && !gf.dataset.w) { gf.dataset.w = '1'; gf.onclick = function () { gotoBtn('btnFishing', 'balDialog'); }; }
  if (gt && !gt.dataset.w) { gt.dataset.w = '1'; gt.onclick = function () { gotoBtn('btnTides', 'balDialog'); }; }
  if (gd && !gd.dataset.w) { gd.dataset.w = '1'; gd.onclick = function () { gotoBtn('btnDueloFull', 'balDialog'); }; }
}
window.BallenasPenco = { tab: switchBalTab, renderHoy: renderBalHoy, renderLog: renderBalLog, list: getBallenas, especies: BALLENA_ESPECIES };

/* ============================================================
   3. 🍄 MICOLOGÍA DEL BOSQUE
   El bosque nativo menciona hongos sin módulo propio. Aquí:
   catálogo del esclerófilo costero (dígüeñe, changle, loyo,
   callampa de pino), época de salida por estación, guía de
   identificación con ADVERTENCIAS SERIAS de toxicidad y
   bitácora de salidas. La luna ordena las salidas: menguante
   de otoño (Rimü) = mejor ventana tras lluvias.
   ⚠️ REGLA DE ORO: si no estás 100% seguro, NO lo comas.
   ============================================================ */
var HONGO_ESPECIES = [
  { nombre: 'Dígüeñe / Dihueñe', cient: 'Cyttaria espinosae', com: '✅ Comestible tradicional', epoca: 'Rimü–Pukem temprano (abr–ago)', hab: 'Sobre hualles y robles vivos (parásito noble)', nota: 'Pelota blanca-anaranjada que sale del tronco. Se come fresca en ensalada o frita. Cosecha 30%, deja 70% para el bosque.', tox: 'Confundible solo con otras Cyttaria (todas comestibles). Igual: lava y cocina siempre.' },
  { nombre: 'Changle', cient: 'Ramaria flava', com: '✅ Comestible (con medida)', epoca: 'Rimü (abr–jun, tras lluvias)', hab: 'Suelo de bosque nativo, forma de coral amarillo', nota: 'Coral amarillo-anaranjado. Solo ejemplares firmes y jóvenes, bien cocidos (20 min). 1 canasto familiar máximo.', tox: '⚠️ Se parece a Ramaria tóxicas (amargas, puntas rojas). Prueba: si es amargo al morder crudo, BÓTALO. Nunca con alcohol.' },
  { nombre: 'Loyo', cient: 'Boletus loyo', com: '✅ Comestible apreciado', epoca: 'Rimü–Pukem (may–ago)', hab: 'Bajo robles y hualles, sombrero café esponjoso', nota: 'Sombrero café, poros amarillos que azulean al tocar. Seca muy bien (callampa seca). Corta con cuchillo, no arranques.', tox: '⚠️ Evita boletos de poros ROJOS o sabor picante/amargo: esos son tóxicos. Ante duda, foto y no cosechar.' },
  { nombre: 'Callampa de pino / Suillus', cient: 'Suillus luteus', com: '✅ Comestible (introducido)', epoca: 'Rimü–Pukem (abr–ago)', hab: 'Plantaciones de pino (Penco tiene muchas)', nota: 'Sombrero café baboso con velo. Pela la cutícula babosa y cocina bien. Buena puerta de entrada para aprender.', tox: 'La baba cruda da malestar: siempre pelar + cocer. No recolectes junto a caminos (plomo) ni tras fumigación.' },
  { nombre: 'Ostra / Pleuroto', cient: 'Pleurotus ostreatus', com: '✅ Comestible', epoca: 'Pukem–Pewü en troncos húmedos', hab: 'Troncos caídos de nativo (no talados)', nota: 'Repisa gris en troncos muertos. Cosecha con cuchillo dejando base. Nunca tales un árbol por hongos.', tox: 'Confusión rara con Crepidotus (pequeños, no tóxicos graves). Igual: cocina siempre.' },
  { nombre: 'Amanita muscaria', cient: 'Amanita muscaria', com: '☠️ TÓXICA — solo mirar', epoca: 'Rimü–Pukem', hab: 'Bajo pinos y nativo, sombrero rojo con pintas blancas', nota: 'La del cuento. NO se come: provoca intoxicación grave. Sirve como señal: donde hay amanita, cerca hay suillus comestibles.', tox: '☠️ Tóxica y psicoactiva peligrosa. Ni probar. Enseña a niños a NO tocarla.' },
  { nombre: 'Galerina / hongos café pequeños', cient: 'Galerina spp.', com: '☠️ MORTALES — no tocar', epoca: 'Todo el año en madera', hab: 'Troncos y astillas, sombreritos café', nota: 'Pueden matar con un solo ejemplar (amatoxinas). NUNCA recolectes “champañoncitos” silvestres sin experto.', tox: '☠️ Si alguien comió hongo dudoso: guarda muestra + foto y corre a urgencias (Hospital Penco / Higueras). No esperes síntomas.' }
];
var HONGO_REGLAS = [
  'Regla 1 — 100% o nada: si no lo identificas con total certeza (sombrero + láminas/poros + pie + hábitat + época), NO lo comas. Foto y pregunta.',
  'Regla 2 — Cocina siempre: ningún hongo silvestre se come crudo. Mínimo 15–20 min de cocción.',
  'Regla 3 — Prueba nueva: primera vez = 1 cucharada cocida y espera 24 h. Sin alcohol ese día.',
  'Regla 4 — Cosecha limpia: canasto ventilado (nunca bolsa plástica), cuchillo, corta sin arrancar micelio, deja el 70% y los viejos para esporas.',
  'Regla 5 — Dónde NO: orilla de camino, basural, plantación recién fumigada, ni dentro de la ciudad con smog.',
  'Intoxicación: guarda un ejemplar entero + foto del lugar, anota hora de ingesta y ve a urgencias de inmediato. Fono intoxicaciones CITUC: +56 2 2635 3800.'
];
function getHongos() { var a = store('hongoLog', []); return Array.isArray(a) ? a : []; }
var honTab = 'hoy';
function switchHonTab(t) {
  honTab = t;
  [['hoy', 'honHoyPanel', 'tabHonHoy'], ['bit', 'honBitPanel', 'tabHonBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderHonHoy();
  if (t === 'bit') renderHonLog();
}
function renderHonHoy() {
  var box = $('honTodayBox');
  if (box) {
    var k = todayKey(), data = getHongos();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    var t = tithiHoy(), fase = faseManejo(t);
    var consejo = fase === 'menguante' ? '🌖 <b>Menguante: MEJOR VENTANA</b> — tras 3–5 días de lluvia otoñal, salidas al amanecer con canasto y cuchillo.'
      : fase === 'creciente' ? '🌒 <b>Creciente: observa y marca</b> — revisa tus puntos, fotografía sin cosechar, vuelve en menguante.'
      : fase === 'llena' ? '🌕 <b>Llena: paseo nocturno NO</b> — mejor de día; la luz fuerte deshidrata setas. Anota puntos para la próxima lluvia.'
      : fase === 'nueva' ? '🌑 <b>Nueva: estudia en casa</b> — repasa fichas, seca tu cosecha anterior, afila cuchillo y prepara canasto.'
      : 'Tras lluvias de Rimü–Pukem + menguante = salida.';
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span style="font-size:14px"><b>🍄 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip" style="background:var(--gold);color:#10142c">' + hoy + ' hoy · ' + data.length + ' salidas</span></div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">Temporada fuerte: <b>Rimü–Pukem (abr–ago)</b> tras lluvias. ' + esc(lunaTxt(k)) + '</p>' +
      '<div class="chip" style="display:block;white-space:normal;margin-top:6px">' + consejo + '</div>' +
      '<p style="font-size:11px;margin-top:6px;color:#e76e8a"><b>⚠️ Si no estás 100% seguro, NO lo comas.</b> Ningún hongo silvestre se come crudo.</p>';
  }
  var cb = $('honCatalogBox');
  if (cb) {
    cb.innerHTML = '<div class="fishing-species">' + HONGO_ESPECIES.map(function (f) {
      var mal = /TÓXICA|MORTAL/i.test(f.com);
      return '<div class="fishing-species-item" style="cursor:pointer' + (mal ? ';border-color:#e76e8a66' : ';border-color:#8fd69444') + '" data-hon="' + esc(f.nombre) + '">' +
        '<b style="font-size:12px">🍄 ' + esc(f.nombre) + '</b><div style="font-size:10px;color:var(--muted);font-style:italic">' + esc(f.cient) + '</div>' +
        '<div style="margin:4px 0;display:flex;gap:4px;flex-wrap:wrap"><span class="chip" style="font-size:9px">' + esc(f.com) + '</span><span class="chip" style="font-size:9px">' + esc(f.epoca) + '</span></div>' +
        '<div style="font-size:11px">📍 ' + esc(f.hab) + '</div>' +
        '<div class="muted" style="font-size:10.5px;margin-top:2px">' + esc(f.nota) + '</div>' +
        '<div style="font-size:10.5px;margin-top:4px;background:rgba(231,110,138,.08);border:1px solid rgba(231,110,138,.3);border-radius:8px;padding:6px 8px">⚠️ ' + esc(f.tox) + '</div></div>';
    }).join('') + '</div><p class="muted" style="font-size:10px;margin-top:6px">Toca una especie para cargarla en la bitácora.</p>' +
    '<div class="menstrual-card" style="margin-top:8px;background:var(--panel)"><h4 style="font-size:11px">📋 Guía de salida segura</h4>' +
    HONGO_REGLAS.map(function (r) { return '<p style="font-size:11px">• ' + esc(r) + '</p>'; }).join('') + '</div>';
    cb.querySelectorAll('[data-hon]').forEach(function (el) {
      el.onclick = function () {
        switchHonTab('bit');
        setTimeout(function () {
          var inp = $('honSpecies');
          if (inp) { inp.value = el.getAttribute('data-hon'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
        }, 60);
      };
    });
  }
}
function honShareText(arr) {
  if (!arr.length) return 'Bitácora micológica — bosque esclerófilo Penco · sin salidas aún';
  var t = '🍄 Bitácora micológica — Penco\n' + arr.length + ' salidas\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + e.species + ' (' + (e.qty || '?') + ') · ' + (e.place || '—');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderHonLog() {
  var data = getHongos();
  logListRender('honLogBox', 'honStats', data, function (it) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(it.species) + '</b> · ' + esc(it.qty || '?') + ' — ' + esc(it.place || '—') +
      '<br><span class="muted" style="font-size:11px">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted" style="font-size:11px">' + esc(it.notes || '') + '</span></span>' +
      '<span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="' + it.id + '" class="btn hon-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
  }, 'Sin salidas. Espera 3–5 días tras lluvia otoñal y sal en menguante con canasto, cuchillo y esta guía.');
  var box = $('honLogBox');
  if (!box || !data.length) return;
  var st = $('honStats');
  if (st) st.textContent = data.length + ' salidas registradas';
  box.querySelectorAll('.hon-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar salida?')) return;
      var arr = getHongos();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderHonLog(); renderHonHoy();
    };
  });
}
function ensureHonDialog() {
  if ($('honDialog')) return $('honDialog');
  var d = document.createElement('dialog');
  d.id = 'honDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🍄 Hongos del bosque — Penco</h3>' +
    '<button type="button" id="honCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Esclerófilo costero en <b>Rimü–Pukem</b>. La luna ordena las salidas: <b>menguante tras lluvia</b>. <b style="color:#e76e8a">Si dudas, no lo comas.</b></p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabHonHoy" class="btn btn-accent" style="width:auto">🍄 Hoy + guía</button>' +
    '<button type="button" id="tabHonBit" class="btn" style="width:auto">📓 Bitácora salidas</button></div>' +
    '<div id="honHoyPanel"><div id="honTodayBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🍄 Catálogo + seguridad</h4><div id="honCatalogBox"></div></div></div>' +
    '<div id="honBitPanel" class="hidden"><div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitácora — salidas</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="honDate"></label><label>Hora <input type="time" id="honTime" value="09:00"></label>' +
    '<label>Lugar <input type="text" id="honPlace" placeholder="ej: Quebrada Honda, pinar" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Especie <input type="text" id="honSpecies" placeholder="ej: Changle, Loyo" maxlength="30"></label>' +
    '<label>Cantidad <input type="text" id="honQty" placeholder="ej: 1 canasto / 800 g" maxlength="20"></label></div>' +
    '<label>Notas <input type="text" id="honNotes" placeholder="ej: tras 4 días lluvia, jóvenes firmes, dejé 70%" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="honAdd" class="btn btn-accent" style="width:auto">+ Guardar salida</button></div>' +
    '<div id="honLogBox" class="habits-list" style="margin-top:10px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="honStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="honShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="honExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="honClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap">' +
    '<button type="button" id="honGoBosque" class="btn" style="width:auto;font-size:11px">🌳 Ir a Bosque</button>' +
    '<button type="button" id="honGoSenderos" class="btn" style="width:auto;font-size:11px">🚶 Ir a Senderos</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="honClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireHongos() {
  injectTerrBtn('btnHongos', '🍄 Hongos', 'hongos micologia setas changle loyo digueñe dihuene callampa pino suillus amanita toxico recoleccion otoño rimu', 'btnBallenas');
  ensureHonDialog();
  registerBtn('btnHongos');
  var btn = $('btnHongos');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchHonTab(honTab || 'hoy');
      renderHonHoy(); renderHonLog();
      var d = $('honDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('honDialog');
    };
  }
  var t1 = $('tabHonHoy'), t2 = $('tabHonBit');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchHonTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchHonTab('bit'); }; }
  var ct = $('honCloseTop'), cb = $('honClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('honDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('honDialog'); }; }
  var add = $('honAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('honDate') || {}).value || '';
      var species = clean(($('honSpecies') || {}).value || '', 30).trim();
      if (!date || !species) { alert('Fecha y especie son obligatorias'); return; }
      getHongos().push({
        id: uid('ho'), date: date, time: ($('honTime') || {}).value || '09:00',
        place: clean(($('honPlace') || {}).value || '', 30),
        species: species, qty: clean(($('honQty') || {}).value || '', 20),
        notes: clean(($('honNotes') || {}).value || '', 80)
      });
      save('Salida guardada 🍄');
      $('honSpecies').value = ''; $('honQty').value = ''; $('honNotes').value = '';
      renderHonLog(); renderHonHoy();
    };
  }
  var clear = $('honClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de hongos?')) return;
      store('hongoLog', []).length = 0;
      save(); renderHonLog(); renderHonHoy();
    };
  }
  var sh = $('honShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getHongos();
      if (!d.length) { alert('Sin registros'); return; }
      share('🍄 Mis salidas de hongos — Penco', honShareText(d));
    };
  }
  var ex = $('honExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getHongos();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([honShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'salidas-hongos-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gb = $('honGoBosque'), gs = $('honGoSenderos');
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBosque', 'honDialog'); }; }
  if (gs && !gs.dataset.w) { gs.dataset.w = '1'; gs.onclick = function () { gotoBtn('btnSenderos', 'honDialog'); }; }
}
window.HongosPenco = { tab: switchHonTab, renderHoy: renderHonHoy, renderLog: renderHonLog, list: getHongos, especies: HONGO_ESPECIES };

/* ============================================================
   4. 🚶 SENDEROS DE PENCO
   Rutas con datos reales de terreno: distancia, dificultad,
   tiempo, mejor hora (conecta con Hora Dorada) y estado por
   temporada. Bitácora enlazada con la de Bosque.
   ============================================================ */
var SENDEROS = [
  { nombre: 'Mirador Cerro Verde', dist: '2,4 km ida y vuelta', dif: 'Fácil–media', tiempo: '1–1,5 h', hora: '📸 08–11h (ballenas jul–nov) o dorada 18–20h verano', temp: 'Todo el año; barro en Pukem, cortaviento en sur fuerte', nota: 'El balcón de la bahía: avistamiento de ballenas, atardecer y hora dorada. Lleva binoculares en temporada.' },
  { nombre: 'Borde costero Penco–Lirquén', dist: '3,5 km lineal', dif: 'Fácil', tiempo: '1–2 h', hora: '📸 Dorada tarde + pleamar (espejo de agua)', temp: 'Todo el año; evita pleamar con marejada (SHOA)', nota: 'Caminata familiar con intermareal en bajamar y delfines en calma. Conecta con Pesca e Intermareal.' },
  { nombre: 'Playa Negra – La Cata (roquerío)', dist: '1,8 km ida y vuelta', dif: 'Media (rocas)', tiempo: '1–1,5 h', hora: '☀️ Mañana en bajamar <0,6 m', temp: 'Pewü–Walüng ideal; Pukem resbaloso y olas', nota: 'Pozas, estrellas y lobos. Zapatilla con agarre, nunca solo/a y ojo a la tabla de Mareas.' },
  { nombre: 'Quebrada Honda (bosque)', dist: '2 km ida y vuelta', dif: 'Media', tiempo: '1,5–2 h', hora: '☀️ 09–12h (luz entre copas)', temp: 'Rimü hongos · Pukem barro y caudal · Walüng sombra', nota: 'Quebrada húmeda con chilco, helechos y dígüeñes. La bitácora se enlaza con Bosque y Hongos.' },
  { nombre: 'Cerro Penco – cruz / antenas', dist: '4 km ida y vuelta', dif: 'Media–alta', tiempo: '2–3 h', hora: '☀️ Temprano 07–10h (calor Walüng)', temp: 'Walüng riesgo incendio: NO subir con alerta roja ni hacer fuego', nota: 'Vista interior + esclerófilo (boldo, peumo, quillay). En verano revisa primero la sección 🔥 Incendios.' },
  { nombre: 'Humedal Rocuant (borde)', dist: '2,5 km lineal', dif: 'Fácil', tiempo: '1–2 h', hora: '📸 Amanecer (canto y aves)', temp: 'Pukem con agua alta · Pewü migración', nota: 'Aves del humedal: loica, tagua, garza. Silencio, distancia y sin perros sueltos. Enlaza con Aves.' }
];
function getSenderos() { var a = store('senderoLog', []); return Array.isArray(a) ? a : []; }
var senTab = 'hoy';
function switchSenTab(t) {
  senTab = t;
  [['hoy', 'senHoyPanel', 'tabSenHoy'], ['bit', 'senBitPanel', 'tabSenBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderSenHoy();
  if (t === 'bit') renderSenLog();
}
function renderSenHoy() {
  var box = $('senTodayBox');
  if (box) {
    var k = todayKey(), data = getSenderos();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    var km = data.reduce(function (a, r) { return a + (parseFloat(r.km) || 0); }, 0);
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span style="font-size:14px"><b>🚶 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip" style="background:var(--gold);color:#10142c">' + hoy + ' hoy · ' + data.length + ' salidas · ' + km.toFixed(1) + ' km</span></div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">Mejor hora = <b>hora dorada</b> para costa y mirador, <b>mañana</b> para roquerío en bajamar. Revisa 🌊 Mareas y 🌤️ Clima antes de salir. ' + esc(lunaTxt(k)) + '</p>';
  }
  var cb = $('senCatalogBox');
  if (cb) {
    cb.innerHTML = '<div class="fishing-species">' + SENDEROS.map(function (s) {
      return '<div class="fishing-species-item" style="cursor:pointer" data-sen="' + esc(s.nombre) + '">' +
        '<b style="font-size:12px">🚶 ' + esc(s.nombre) + '</b>' +
        '<div style="margin:4px 0;display:flex;gap:4px;flex-wrap:wrap"><span class="chip" style="font-size:9px">📏 ' + esc(s.dist) + '</span><span class="chip" style="font-size:9px">⛰️ ' + esc(s.dif) + '</span><span class="chip" style="font-size:9px">⏱️ ' + esc(s.tiempo) + '</span></div>' +
        '<div style="font-size:11px">' + esc(s.hora) + '</div>' +
        '<div style="font-size:11px">📅 ' + esc(s.temp) + '</div>' +
        '<div class="muted" style="font-size:10.5px;margin-top:2px">' + esc(s.nota) + '</div></div>';
    }).join('') + '</div><p class="muted" style="font-size:10px;margin-top:6px">Toca una ruta para cargarla en la bitácora.</p>' +
    '<div class="menstrual-card" style="margin-top:8px;background:var(--panel)"><h4 style="font-size:11px">🎒 Mínimo de salida</h4>' +
    '<p class="muted" style="font-size:11px">Agua 1 L · bastón · cortaviento · linterna · celular cargado · aviso a alguien de tu ruta y hora. En roquerío: zapatilla con agarre + tabla de mareas. En cerro en Walüng: revisa 🔥 Incendios primero.</p></div>';
    cb.querySelectorAll('[data-sen]').forEach(function (el) {
      el.onclick = function () {
        switchSenTab('bit');
        setTimeout(function () {
          var inp = $('senRoute');
          if (inp) { inp.value = el.getAttribute('data-sen'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
        }, 60);
      };
    });
  }
}
function senShareText(arr) {
  if (!arr.length) return 'Bitácora de senderos — Penco · sin salidas aún';
  var t = '🚶 Bitácora de senderos — Penco\n' + arr.length + ' salidas\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + e.route + (e.km ? ' (' + e.km + ' km)' : '') + ' · ' + (e.with || '—');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderSenLog() {
  var data = getSenderos();
  logListRender('senLogBox', 'senStats', data, function (it) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(it.route) + '</b>' + (it.km ? ' · ' + esc(it.km) + ' km' : '') + ' — ' + esc(it.with || '—') +
      '<br><span class="muted" style="font-size:11px">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted" style="font-size:11px">' + esc(it.notes || '') + '</span></span>' +
      '<span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="' + it.id + '" class="btn sen-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
  }, 'Sin salidas. Parte por el borde costero en dorada y anota distancia y hora: así aprendes tu ritmo.');
  var box = $('senLogBox');
  if (!box || !data.length) return;
  box.querySelectorAll('.sen-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar salida?')) return;
      var arr = getSenderos();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderSenLog(); renderSenHoy();
    };
  });
}
function ensureSenDialog() {
  if ($('senDialog')) return $('senDialog');
  var d = document.createElement('dialog');
  d.id = 'senDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🚶 Senderos de Penco</h3>' +
    '<button type="button" id="senCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Distancia, dificultad, tiempo y mejor hora. Registro <b>privado y local</b>, enlazado con Bosque.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabSenHoy" class="btn btn-accent" style="width:auto">🚶 Rutas hoy</button>' +
    '<button type="button" id="tabSenBit" class="btn" style="width:auto">📓 Bitácora salidas</button></div>' +
    '<div id="senHoyPanel"><div id="senTodayBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🚶 Rutas con datos</h4><div id="senCatalogBox"></div></div></div>' +
    '<div id="senBitPanel" class="hidden"><div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitácora — salidas</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="senDate"></label><label>Hora <input type="time" id="senTime" value="09:00"></label>' +
    '<label>Ruta <input type="text" id="senRoute" placeholder="ej: Mirador Cerro Verde" maxlength="40"></label></div>' +
    '<div class="conv-row"><label>Km <input type="text" id="senKm" placeholder="ej: 2.4" maxlength="10"></label>' +
    '<label>Con quién / cómo <input type="text" id="senWith" placeholder="ej: sola, con hije, con bastón" maxlength="30"></label></div>' +
    '<label>Notas <input type="text" id="senNotes" placeholder="ej: barro en quebrada, vi chito, hora dorada perfecta" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="senAdd" class="btn btn-accent" style="width:auto">+ Guardar salida</button></div>' +
    '<div id="senLogBox" class="habits-list" style="margin-top:10px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="senStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="senShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="senExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="senClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap">' +
    '<button type="button" id="senGoBosque" class="btn" style="width:auto;font-size:11px">🌳 Ir a Bosque</button>' +
    '<button type="button" id="senGoGolden" class="btn" style="width:auto;font-size:11px">📸 Ir a Hora Dorada</button>' +
    '<button type="button" id="senGoTides" class="btn" style="width:auto;font-size:11px">🌊 Ir a Mareas</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="senClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireSenderos() {
  injectTerrBtn('btnSenderos', '🚶 Senderos', 'senderos ruta cerro verde borde costero quebrada humedal caminata trekking distancia dificultad hora dorada mirador', 'btnHongos');
  ensureSenDialog();
  registerBtn('btnSenderos');
  var btn = $('btnSenderos');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchSenTab(senTab || 'hoy');
      renderSenHoy(); renderSenLog();
      var d = $('senDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('senDialog');
    };
  }
  var t1 = $('tabSenHoy'), t2 = $('tabSenBit');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchSenTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchSenTab('bit'); }; }
  var ct = $('senCloseTop'), cb = $('senClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('senDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('senDialog'); }; }
  var add = $('senAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('senDate') || {}).value || '';
      var route = clean(($('senRoute') || {}).value || '', 40).trim();
      if (!date || !route) { alert('Fecha y ruta son obligatorias'); return; }
      getSenderos().push({
        id: uid('se'), date: date, time: ($('senTime') || {}).value || '09:00',
        route: route, km: clean(($('senKm') || {}).value || '', 10),
        with: clean(($('senWith') || {}).value || '', 30),
        notes: clean(($('senNotes') || {}).value || '', 80)
      });
      save('Salida guardada 🚶');
      $('senRoute').value = ''; $('senNotes').value = '';
      renderSenLog(); renderSenHoy();
    };
  }
  var clear = $('senClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de senderos?')) return;
      store('senderoLog', []).length = 0;
      save(); renderSenLog(); renderSenHoy();
    };
  }
  var sh = $('senShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getSenderos();
      if (!d.length) { alert('Sin registros'); return; }
      share('🚶 Mis senderos — Penco', senShareText(d));
    };
  }
  var ex = $('senExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getSenderos();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([senShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'senderos-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gb = $('senGoBosque'), gg = $('senGoGolden'), gt = $('senGoTides');
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBosque', 'senDialog'); }; }
  if (gg && !gg.dataset.w) { gg.dataset.w = '1'; gg.onclick = function () { gotoBtn('btnGolden', 'senDialog'); }; }
  if (gt && !gt.dataset.w) { gt.dataset.w = '1'; gt.onclick = function () { gotoBtn('btnTides', 'senDialog'); }; }
}
window.SenderosPenco = { tab: switchSenTab, renderHoy: renderSenHoy, renderLog: renderSenLog, list: getSenderos, rutas: SENDEROS };

/* ============================================================
   5. 🛶 KAYAK Y REMO
   Ya existen mareas y pesca; faltaba quien rema. Ventanas
   seguras por marea/viento, puntos de lanzamiento en
   Lirquén/Penco y checklist de seguridad. Usa los datos SHOA
   que ya consume 🌊 Mareas (pleamar/bajamar) + 🌤️ Clima.
   ⚠️ Si hay viento sur fuerte o marejada, NO se sale.
   ============================================================ */
var KAYAK_PUNTOS = [
  { nombre: 'Caleta Lirquén (varadero)', uso: 'Lanzamiento principal', nota: 'Pregunta a pescadores por tráfico de botes. Salida al amanecer con mar calmo. Estaciona sin bloquear varadero.' },
  { nombre: 'Playa de Penco (centro)', uso: 'Lanzamiento familiar', nota: 'Olas suaves con buen tiempo. Ideal para practicar remo corto 1–2 h. Ojo con bañistas en Walüng.' },
  { nombre: 'Playa Negra (solo expertos)', uso: 'Travesía corta', nota: 'Roca + corriente. Solo con bajamar, mar calmo y compañía. Casco si hay oleaje.' },
  { nombre: 'Borde interior bahía (aguas calmas)', uso: 'Ruta protegida del sur', nota: 'Cuando el sur pega afuera, el interior se mantiene remable. Vuelve antes de que cambie el viento.' }
];
var KAYAK_CHECK = [
  { id: 'chaleco', t: 'Chaleco puesto y ajustado (siempre, sin excusa)' },
  { id: 'clima', t: 'Revisé 🌤️ Clima + 🌊 Mareas: sin sur fuerte ni marejada SHOA' },
  { id: 'aviso', t: 'Avisé a alguien: ruta + hora de vuelta' },
  { id: 'compa', t: 'No salgo solo/a (o aviso reforzado + ruta corta)' },
  { id: 'agua', t: 'Agua + gorro + bloqueador + ropa seca en bolsa estanca' },
  { id: 'cuerda', t: 'Cabo, silbato, linterna y celular en funda estanca' },
  { id: 'faldon', t: 'Reviso casco/faldón, tapones y achicador antes de lanzar' }
];
function getKayak() { var a = store('kayakLog', []); return Array.isArray(a) ? a : []; }
function getKayakCheck() { var o = store('kayakCheck', {}); return (o && typeof o === 'object') ? o : {}; }
var kayTab = 'hoy';
function switchKayTab(t) {
  kayTab = t;
  [['hoy', 'kayHoyPanel', 'tabKayHoy'], ['bit', 'kayBitPanel', 'tabKayBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderKayHoy();
  if (t === 'bit') renderKayLog();
}
function renderKayHoy() {
  var box = $('kayTodayBox');
  if (box) {
    var k = todayKey(), data = getKayak();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span style="font-size:14px"><b>🛶 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip" style="background:var(--gold);color:#10142c">' + hoy + ' hoy · ' + data.length + ' salidas</span></div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">Ventana ideal: <b>2h antes/después de pleamar + amanecer + sin sur fuerte</b>. Revisa 🌊 Mareas y 🌤️ Clima ahora. ' + esc(lunaTxt(k)) + '</p>' +
      '<p class="muted" style="font-size:11px">🌙 Luna nueva/llena = mareas vivas (más corriente): solo rutas protegidas y cortas.</p>';
  }
  var pb = $('kayPuntosBox');
  if (pb) {
    pb.innerHTML = KAYAK_PUNTOS.map(function (p) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">📍 ' + esc(p.nombre) + ' — ' + esc(p.uso) + '</h4><p style="font-size:11px">' + esc(p.nota) + '</p></div>';
    }).join('');
  }
  var cb = $('kayCheckBox');
  if (cb) {
    var st = getKayakCheck();
    var done = KAYAK_CHECK.filter(function (c) { return st[c.id]; }).length;
    cb.innerHTML = '<p class="muted" style="font-size:11px">✅ ' + done + '/' + KAYAK_CHECK.length + ' — todo marcado = puedes lanzar. Si falta 1, no sales.</p>' +
      KAYAK_CHECK.map(function (c) {
        var on = !!st[c.id];
        return '<label class="check-row" style="font-size:12px"><input type="checkbox" data-kay="' + c.id + '"' + (on ? ' checked' : '') + '> ' + esc(c.t) + '</label>';
      }).join('');
    cb.querySelectorAll('[data-kay]').forEach(function (inp) {
      inp.onchange = function () {
        var s = getKayakCheck();
        s[inp.getAttribute('data-kay')] = inp.checked;
        save(inp.checked ? 'Check OK ✅' : 'Check actualizado');
        renderKayHoy();
      };
    });
  }
}
function kayShareText(arr) {
  if (!arr.length) return 'Bitácora de kayak — Penco/Lirquén · sin salidas aún';
  var t = '🛶 Bitácora de kayak — Penco/Lirquén\n' + arr.length + ' salidas\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + (e.route || '—') + ' · ' + (e.cond || '—');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderKayLog() {
  var data = getKayak();
  logListRender('kayLogBox', 'kayStats', data, function (it) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>' + esc(it.route || 'Remada') + '</b> — ' + esc(it.cond || '—') +
      '<br><span class="muted" style="font-size:11px">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted" style="font-size:11px">' + esc(it.notes || '') + '</span></span>' +
      '<span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="' + it.id + '" class="btn kay-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
  }, 'Sin salidas. Marca primero todo el checklist y anota tu primera remada corta con marea y viento.');
  var box = $('kayLogBox');
  if (!box || !data.length) return;
  box.querySelectorAll('.kay-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar salida?')) return;
      var arr = getKayak();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderKayLog(); renderKayHoy();
    };
  });
}
function ensureKayDialog() {
  if ($('kayDialog')) return $('kayDialog');
  var d = document.createElement('dialog');
  d.id = 'kayDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🛶 Kayak y remo — Penco / Lirquén</h3>' +
    '<button type="button" id="kayCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Ventanas por <b>marea + viento</b>, puntos de lanzamiento y checklist. Si el sur pega o hay marejada: <b>no se sale</b>.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabKayHoy" class="btn btn-accent" style="width:auto">🛶 Hoy + checklist</button>' +
    '<button type="button" id="tabKayBit" class="btn" style="width:auto">📓 Bitácora remadas</button></div>' +
    '<div id="kayHoyPanel"><div id="kayTodayBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>✅ Checklist — todo marcado o no sales</h4><div id="kayCheckBox"></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" id="kayGoTides" class="btn" style="width:auto;font-size:11px">🌊 Ver Mareas</button>' +
    '<button type="button" id="kayGoWeather" class="btn" style="width:auto;font-size:11px">🌤️ Ver Clima</button></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📍 Puntos de lanzamiento</h4><div id="kayPuntosBox" style="display:flex;flex-direction:column;gap:8px"></div></div></div>' +
    '<div id="kayBitPanel" class="hidden"><div class="menstrual-card" style="margin-top:10px"><h4>📓 Bitácora — remadas</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="kayDate"></label><label>Hora <input type="time" id="kayTime" value="08:00"></label>' +
    '<label>Ruta <input type="text" id="kayRoute" placeholder="ej: Lirquén–Penco interior" maxlength="40"></label></div>' +
    '<div class="conv-row"><label>Marea / viento <input type="text" id="kayCond" placeholder="ej: pleamar 08:20, calma" maxlength="40"></label></div>' +
    '<label>Notas <input type="text" id="kayNotes" placeholder="ej: 1 h, delfines, vuelta antes del sur" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="kayAdd" class="btn btn-accent" style="width:auto">+ Guardar remada</button></div>' +
    '<div id="kayLogBox" class="habits-list" style="margin-top:10px;max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:8px"><span id="kayStats" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="kayShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="kayExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="kayClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap">' +
    '<button type="button" id="kayGoFish" class="btn" style="width:auto;font-size:11px">🎣 Ir a Pesca</button>' +
    '<button type="button" id="kayGoBal" class="btn" style="width:auto;font-size:11px">🐋 Ir a Ballenas</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="kayClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireKayak() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  var b0 = null;
  if (g && !$('btnKayak')) {
    b0 = document.createElement('button');
    b0.id = 'btnKayak'; b0.className = 'btn'; b0.type = 'button';
    b0.textContent = '🛶 Kayak';
    b0.setAttribute('data-sub', 'mar');
    b0.setAttribute('data-keywords', 'kayak remo canoa bote lanzamiento lirquen penco marea viento sur seguridad chaleco travesia bahia');
    var ref = $('btnIntermareal');
    if (ref && ref.parentNode === g) g.insertBefore(b0, ref.nextSibling);
    else g.appendChild(b0);
  }
  ensureKayDialog();
  registerBtn('btnKayak');
  var btn = $('btnKayak');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchKayTab(kayTab || 'hoy');
      renderKayHoy(); renderKayLog();
      var d = $('kayDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('kayDialog');
    };
  }
  var t1 = $('tabKayHoy'), t2 = $('tabKayBit');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchKayTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchKayTab('bit'); }; }
  var ct = $('kayCloseTop'), cb = $('kayClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('kayDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('kayDialog'); }; }
  var add = $('kayAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('kayDate') || {}).value || '';
      var route = clean(($('kayRoute') || {}).value || '', 40).trim();
      if (!date || !route) { alert('Fecha y ruta son obligatorias'); return; }
      getKayak().push({
        id: uid('ka'), date: date, time: ($('kayTime') || {}).value || '08:00',
        route: route, cond: clean(($('kayCond') || {}).value || '', 40),
        notes: clean(($('kayNotes') || {}).value || '', 80)
      });
      save('Remada guardada 🛶');
      $('kayRoute').value = ''; $('kayNotes').value = '';
      renderKayLog(); renderKayHoy();
    };
  }
  var clear = $('kayClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de kayak?')) return;
      store('kayakLog', []).length = 0;
      save(); renderKayLog(); renderKayHoy();
    };
  }
  var sh = $('kayShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getKayak();
      if (!d.length) { alert('Sin registros'); return; }
      share('🛶 Mis remadas — Penco/Lirquén', kayShareText(d));
    };
  }
  var ex = $('kayExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getKayak();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([kayShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'remadas-kayak-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gt = $('kayGoTides'), gw = $('kayGoWeather'), gf = $('kayGoFish'), gb = $('kayGoBal');
  if (gt && !gt.dataset.w) { gt.dataset.w = '1'; gt.onclick = function () { gotoBtn('btnTides', 'kayDialog'); }; }
  if (gw && !gw.dataset.w) { gw.dataset.w = '1'; gw.onclick = function () { gotoBtn('btnWeather', 'kayDialog'); }; }
  if (gf && !gf.dataset.w) { gf.dataset.w = '1'; gf.onclick = function () { gotoBtn('btnFishing', 'kayDialog'); }; }
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBallenas', 'kayDialog'); }; }
}
window.KayakPenco = { tab: switchKayTab, renderHoy: renderKayHoy, renderLog: renderKayLog, list: getKayak, puntos: KAYAK_PUNTOS };

/* ============================================================
   6. 💧 CAPTACIÓN DE AGUA DE LLUVIA (dentro de Agua)
   Calculadora: superficie de techo × mm de lluvia Penco =
   litros almacenables. Dimensionamiento de estanque para
   riego en Walüng. Vive DENTRO del diálogo de Agua (btnAgua),
   como pestaña nueva "Captación". Muy práctica ante cortes
   estivales. Usa promedios Penco + tus mm reales de Lluvia.
   ============================================================ */
var CAPTA_MESES = [
  { m: 'Ene', mm: 15 }, { m: 'Feb', mm: 15 }, { m: 'Mar', mm: 30 },
  { m: 'Abr', mm: 80 }, { m: 'May', mm: 180 }, { m: 'Jun', mm: 220 },
  { m: 'Jul', mm: 200 }, { m: 'Ago', mm: 150 }, { m: 'Sep', mm: 90 },
  { m: 'Oct', mm: 50 }, { m: 'Nov', mm: 30 }, { m: 'Dic', mm: 20 }
];
function getCapta() {
  var d = { techo: 40, coef: 0.8, riegoM2: 10, dot: 6, dias: 90 };
  var o = store('captaCfg', d);
  if (!o || typeof o !== 'object') return { techo: 40, coef: 0.8, riegoM2: 10, dot: 6, dias: 90 };
  ['techo', 'coef', 'riegoM2', 'dot', 'dias'].forEach(function (k) { if (typeof o[k] !== 'number' || !(o[k] >= 0)) o[k] = d[k]; });
  return o;
}
function captaLitros(mm, m2, coef) { return Math.round((parseFloat(mm) || 0) * (parseFloat(m2) || 0) * (coef == null ? 0.8 : parseFloat(coef))); }
function renderCapta() {
  var box = $('aguaCaptaPanel');
  if (!box) return;
  var c = getCapta();
  var tot = CAPTA_MESES.reduce(function (a, x) { return a + captaLitros(x.mm, c.techo, c.coef); }, 0);
  var pukem = ['May', 'Jun', 'Jul', 'Ago'].reduce(function (a, n) {
    var x = CAPTA_MESES.filter(function (z) { return z.m === n; })[0];
    return a + captaLitros(x.mm, c.techo, c.coef);
  }, 0);
  var need = Math.round((c.riegoM2 || 0) * (c.dot || 0) * (c.dias || 0));
  var reco = need <= 500 ? '1 tambor 500 L' : need <= 1100 ? '1 estanque 1.100 L' : need <= 2200 ? '1 estanque 2.200 L o 2×1.100 L' : need <= 5400 ? '1 estanque 5.400 L' : '2 estanques (ej: 5.400 + 2.200 L) o piscina flexible';
  var filas = CAPTA_MESES.map(function (x) {
    return '<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px dotted var(--line)"><span>' + x.m + ' · ' + x.mm + ' mm</span><b>' + captaLitros(x.mm, c.techo, c.coef).toLocaleString('es-CL') + ' L</b></div>';
  }).join('');
  var out = $('captaOut');
  if (out) {
    out.innerHTML = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"><span class="chip">🏠 ' + c.techo + ' m² × coef ' + c.coef + '</span>' +
      '<span class="chip" style="background:var(--gold);color:#10142c">Año: ' + tot.toLocaleString('es-CL') + ' L</span>' +
      '<span class="chip">Pukem (may–ago): ' + pukem.toLocaleString('es-CL') + ' L</span></div>' + filas +
      '<p class="muted" style="font-size:10px;margin-top:6px">Promedios referenciales Penco (~1.080 mm/año, 80% en Pukem). Compara con tus mm reales en la pestaña Lluvia.</p>' +
      '<div class="chip" style="display:block;white-space:normal;margin-top:6px">🌱 Riego Walüng: ' + c.riegoM2 + ' m² × ' + c.dot + ' L/m²/día × ' + c.dias + ' días = <b>' + need.toLocaleString('es-CL') + ' L</b> → <b>' + reco + '</b>. Tip: con mulch ahorras 1 de cada 3 riegos.</div>';
  }
  var t1 = $('captaTecho'), t2 = $('captaCoef'), t3 = $('captaM2'), t4 = $('captaDot'), t5 = $('captaDias');
  if (t1 && String(t1.value || '') === '') t1.value = c.techo;
  if (t2 && String(t2.value || '') === '') t2.value = c.coef;
  if (t3 && String(t3.value || '') === '') t3.value = c.riegoM2;
  if (t4 && String(t4.value || '') === '') t4.value = c.dot;
  if (t5 && String(t5.value || '') === '') t5.value = c.dias;
}
function switchCapta() {
  ['Hoy', 'Estanque', 'Lluvia', 'Riego', 'Casa', 'Calidad'].forEach(function (t) {
    var p = $('agua' + (t === 'Hoy' ? 'HoyPanel' : t === 'Estanque' ? 'EstPanel' : t === 'Lluvia' ? 'LluPanel' : t === 'Riego' ? 'RiePanel' : t === 'Casa' ? 'CasaPanel' : 'CalPanel'));
    if (p) p.classList.add('hidden');
    var b = $('tabAgua' + t);
    if (b) b.classList.remove('btn-accent');
  });
  var me = $('aguaCaptaPanel');
  if (me) me.classList.remove('hidden');
  var tb = $('tabAguaCapta');
  if (tb) tb.classList.add('btn-accent');
  renderCapta();
}
function mejorarAgua() {
  var dlg = $('aguaDialog');
  if (!dlg) return false;
  var tabs = dlg.querySelector('.timer-tabs');
  if (tabs && !$('tabAguaCapta')) {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'tabAguaCapta'; b.className = 'btn'; b.style.width = 'auto';
    b.textContent = '💧 Captación';
    b.onclick = switchCapta;
    tabs.appendChild(b);
    ['Hoy', 'Estanque', 'Lluvia', 'Riego', 'Casa', 'Calidad'].forEach(function (t) {
      var ob = $('tabAgua' + t);
      if (ob && !ob.dataset.captaW) {
        ob.dataset.captaW = '1';
        var orig = ob.onclick;
        ob.onclick = function () {
          var p = $('aguaCaptaPanel');
          if (p) p.classList.add('hidden');
          var tb2 = $('tabAguaCapta');
          if (tb2) tb2.classList.remove('btn-accent');
          if (typeof orig === 'function') { try { return orig.apply(this, arguments); } catch (e) {} }
          try { if (typeof switchAguaTab === 'function') switchAguaTab(t); } catch (e2) {}
        };
      }
    });
  }
  var anchor = $('aguaHoyPanel');
  if (anchor && !$('aguaCaptaPanel')) {
    var p = document.createElement('div');
    p.id = 'aguaCaptaPanel';
    p.className = 'hidden';
    p.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>💧 Captación de lluvia — techo × lluvia = litros</h4>' +
      '<p class="muted" style="font-size:11px">Fórmula: <b>mm × m² × 0,8</b> (20% se pierde en canaleta + first flush). Ej: 20 mm × 40 m² = <b>640 L</b>.</p>' +
      '<div class="conv-row"><label>Techo (m²) <input type="number" id="captaTecho" min="0" step="1"></label>' +
      '<label>Coef (0,8 zinc / 0,9 liso / 0,6 teja vieja) <input type="number" id="captaCoef" min="0.3" max="1" step="0.05"></label></div>' +
      '<div class="conv-row"><label>Riego Walüng (m²) <input type="number" id="captaM2" min="0" step="1"></label>' +
      '<label>L/m²/día <input type="number" id="captaDot" min="0" step="0.5"></label>' +
      '<label>Días sin lluvia <input type="number" id="captaDias" min="0" step="5"></label></div>' +
      '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="captaCalc" class="btn btn-accent" style="width:auto">💧 Calcular</button></div>' +
      '<div id="captaOut" class="chip" style="margin-top:8px;display:block;white-space:normal">…</div>' +
      '<p class="muted" style="font-size:10px;margin-top:6px">First flush: descarta los primeros 20 L tras sequía. Tapa oscura + malla + limpieza en menguante de Pukem. Ante corte ESSBIO, esta agua sirve para WC y riego (para tomar: hervir/clorar + filtrar).</p></div>';
    anchor.parentNode.insertBefore(p, anchor.nextSibling);
    var calc = $('captaCalc');
    if (calc) calc.onclick = function () {
      var c = getCapta();
      c.techo = parseFloat(($('captaTecho') || {}).value) || 0;
      c.coef = parseFloat(($('captaCoef') || {}).value) || 0.8;
      c.riegoM2 = parseFloat(($('captaM2') || {}).value) || 0;
      c.dot = parseFloat(($('captaDot') || {}).value) || 0;
      c.dias = parseFloat(($('captaDias') || {}).value) || 0;
      save('Captación calculada 💧');
      renderCapta();
    };
    try {
      var cfg = null;
      try { cfg = getAguaCfg(); } catch (e) {}
      if (cfg && $('captaTecho') && !$('captaTecho').value) $('captaTecho').value = cfg.techo || 40;
    } catch (e2) {}
  }
  try {
    var bw = $('btnAgua');
    if (bw && bw.dataset && bw.dataset.keywords && bw.dataset.keywords.indexOf('captacion') < 0)
      bw.dataset.keywords += ' captacion techo estanque dimensionamiento riego verano walung sequia litros openmeteo';
  } catch (e) {}
  return true;
}
window.CaptaPenco = { render: renderCapta, meses: CAPTA_MESES, cfg: getCapta };

/* ============================================================
   7. 🔥 TEMPORADA DE INCENDIOS (Walüng)
   Penco arde en verano. Sección estacional: defensa de la
   vivienda, plan de evacuación rural, qué hacer con el
   humedal/bosque, checklist previo a temporada + avisos.
   Enlaza con 🚒 Bomberos y 🌊🚨 Evacuación. Todo local.
   ============================================================ */
var FUEGO_DEFENSA = [
  { t: 'Anillo 30 m', d: 'Desmaleza 30 m alrededor de la casa (pasto <10 cm). Poda ramas bajas hasta 2 m y separa copas 3 m. Nada de zarza pegada al muro.' },
  { t: 'Techo y canaleta', d: 'Limpia hojas de canaletas y techo (foco n°1 de pavesas). Malla metálica en ventilaciones. Guarda la escala a mano.' },
  { t: 'Leña y gas lejos', d: 'Leñera a +10 m de la casa, balones de gas a la sombra y lejos de vegetación. Nada de bencina/parafina junto a la cocina.' },
  { t: 'Agua lista', d: 'Manguera que llegue a todo el perímetro + tambor 200 L lleno en Walüng. Revisa tu estanque en 💧 Agua. Bomba con bencina si hay pozo.' },
  { t: 'Cero fuego afuera', d: 'En Walüng y con viento: NADA de quemas, soldadura, galletero ni fogatas. Colilla = extintor. Cocina a leña solo con chispero y vigilancia.' }
];
var FUEGO_EVAC = [
  '2 rutas de salida a pie y en vehículo (el fuego corta 1). Camínalas con tu familia antes de diciembre.',
  'Punto de encuentro fuera del humo (plaza, sede, casa de familiar) + contacto fuera de Penco.',
  'Mochila 72 h: agua 3 L/persona, remedios, papeles en bolsa, linterna, mascarilla N95 (humo), cargador.',
  'Mascotas y animales: jaula/correa lista, gallinero con puerta rápida, abre portones si evacúas ganado.',
  'Si hay humo: cierra gas + ventanas, moja techo si alcanzas, viste algodón y pañuelo húmedo. NUNCA huyas cuesta arriba ni contra el viento.',
  'Avisa: Bomberos 132 · CONAF 130 · Carabineros 133 · Municipalidad Penco 41 226 1033. Da punto claro (sector, calle, referencia).'
];
var FUEGO_CHECK = [
  { id: 'desm', t: 'Desmalezado 30 m + pasto corto (oct–nov)' },
  { id: 'canal', t: 'Techo y canaletas limpias + malla ventilación' },
  { id: 'lena', t: 'Leña/gas a +10 m, nada inflamable pegado a casa' },
  { id: 'agua', t: 'Manguera + tambor 200 L + estanque revisado' },
  { id: 'rutas', t: '2 rutas caminadas + punto de encuentro acordado' },
  { id: 'mochila', t: 'Mochila 72 h + N95 + papeles + remedios' },
  { id: 'masc', t: 'Plan mascotas/animales (jaula, correa, portones)' },
  { id: 'red', t: 'Red avisada: vecinos mayores + grupo wsp + números 132/130 pegados en refri' },
  { id: 'quema', t: 'Compromiso cero quemas en Walüng firmado en familia' }
];
function getFuegoCheck() { var o = store('fuegoCheck', {}); return (o && typeof o === 'object') ? o : {}; }
function fuegoFase() {
  var m = mesActual();
  if (m === 10 || m === 11) return { n: 'prep', t: '🟡 PRE-TEMPORADA (oct–nov): haz el checklist ahora', c: 'var(--gold)' };
  if (m === 12 || m === 1 || m === 2) return { n: 'alerta', t: '🔴 ALERTA MÁXIMA (dic–feb · Walüng): cero fuego, agua lista, rutas claras', c: '#e76e8a' };
  if (m === 3) return { n: 'cierre', t: '🟠 Cierre (mar): revisa daños, repone agua, planifica reforestación nativa en Pukem', c: '#e8a56a' };
  return { n: 'mant', t: '🟢 Mantención (abr–sep): poda, leñera ordenada y estanque limpio para llegar listo a octubre', c: '#8fd694' };
}
function renderFuego() {
  var box = $('fueHoyBox');
  if (box) {
    var f = fuegoFase();
    var st = getFuegoCheck();
    var done = FUEGO_CHECK.filter(function (c) { return st[c.id]; }).length;
    box.innerHTML = '<div class="chip" style="display:block;white-space:normal;background:' + f.c + '22;border-color:' + f.c + '66"><b>' + esc(f.t) + '</b></div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">Penco arde en verano + viento sur. Tu casa se defiende en <b>oct–nov</b>, no en enero. Checklist: <b>' + done + '/' + FUEGO_CHECK.length + '</b>.</p>';
  }
  var db = $('fueDefBox');
  if (db) {
    db.innerHTML = FUEGO_DEFENSA.map(function (x) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">🏠 ' + esc(x.t) + '</h4><p style="font-size:11px">' + esc(x.d) + '</p></div>';
    }).join('');
  }
  var eb = $('fueEvacBox');
  if (eb) {
    eb.innerHTML = FUEGO_EVAC.map(function (x) { return '<p style="font-size:11px">• ' + esc(x) + '</p>'; }).join('') +
      '<div class="menstrual-card" style="margin-top:8px;background:var(--panel)"><h4 style="font-size:11px">🌳 Humedal y bosque en incendio</h4>' +
      '<p class="muted" style="font-size:11px">• No entres al bosque con humo: caen ramas y el aire mata. • No abras portones al humedal para “que se queme solo”: avisa a CONAF/Bomberos. • Tras el fuego: no plantes exótico; en Pukem planta nativo (peumo, quillay) con la guía de 🌳 Bosque. • Si ves columna de humo: 130/132 con ubicación exacta, no subas a mirar.</p></div>';
  }
  var cb = $('fueCheckBox');
  if (cb) {
    var s = getFuegoCheck();
    var d2 = FUEGO_CHECK.filter(function (c) { return s[c.id]; }).length;
    cb.innerHTML = '<p class="muted" style="font-size:11px">✅ ' + d2 + '/' + FUEGO_CHECK.length + ' — complétalo en oct–nov. Marca y queda guardado.</p>' +
      FUEGO_CHECK.map(function (c) {
        return '<label class="check-row" style="font-size:12px"><input type="checkbox" data-fue="' + c.id + '"' + (s[c.id] ? ' checked' : '') + '> ' + esc(c.t) + '</label>';
      }).join('') +
      '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" id="fuePinOct" class="btn" style="width:auto;font-size:11px">📌 Me comprometo: checklist listo en noviembre</button></div>';
    cb.querySelectorAll('[data-fue]').forEach(function (inp) {
      inp.onchange = function () {
        var o = getFuegoCheck();
        o[inp.getAttribute('data-fue')] = inp.checked;
        save(inp.checked ? 'Avance incendio ✅' : 'Check actualizado');
        renderFuego();
      };
    });
    var pin = $('fuePinOct');
    if (pin) pin.onclick = function () {
      var o = getFuegoCheck();
      o.compromiso = todayKey();
      save('Compromiso guardado 📌');
      alert('📌 Compromiso guardado: termina tu checklist antes de diciembre. Revisa esta sección cada luna de primavera.');
      renderFuego();
    };
  }
}
function ensureFuegoDialog() {
  if ($('fueDialog')) return $('fueDialog');
  var d = document.createElement('dialog');
  d.id = 'fueDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🔥 Temporada de incendios — Walüng</h3>' +
    '<button type="button" id="fueCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Defensa de la vivienda, evacuación rural y bosque. Se prepara en <b>oct–nov</b>, se vive en <b>dic–feb</b>.</p>' +
    '<div id="fueHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="fishing-grid" style="margin-top:10px"><div class="menstrual-card"><h4>🏠 Defensa de la vivienda</h4><div id="fueDefBox" style="display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div class="menstrual-card"><h4>🏃 Plan de evacuación rural</h4><div id="fueEvacBox"></div></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>✅ Checklist pre-temporada (oct–nov)</h4><div id="fueCheckBox"></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap;margin-top:8px">' +
    '<button type="button" id="fueGoBomb" class="btn" style="width:auto;font-size:11px">🚒 Ir a Bomberos</button>' +
    '<button type="button" id="fueGoEvac" class="btn" style="width:auto;font-size:11px">🌊🚨 Ir a Evacuación</button>' +
    '<button type="button" id="fueGoAgua" class="btn" style="width:auto;font-size:11px">💧 Ir a Agua</button>' +
    '<button type="button" id="fueGoBosque" class="btn" style="width:auto;font-size:11px">🌳 Ir a Bosque</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="fueClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireFuego() {
  injectTerrBtn('btnFuego', '🔥 Incendios', 'incendio fuego forestal walung verano evacuacion defensa vivienda checklist conaf bomberos humo quemas desmalezado mochila', 'btnSenderos');
  ensureFuegoDialog();
  registerBtn('btnFuego');
  var btn = $('btnFuego');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () { renderFuego(); openDlg('fueDialog'); };
  }
  var ct = $('fueCloseTop'), cb = $('fueClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('fueDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('fueDialog'); }; }
  var gb = $('fueGoBomb'), ge = $('fueGoEvac'), ga = $('fueGoAgua'), gq = $('fueGoBosque');
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBomberos', 'fueDialog'); }; }
  if (ge && !ge.dataset.w) { ge.dataset.w = '1'; ge.onclick = function () { gotoBtn('btnEvac', 'fueDialog'); }; }
  if (ga && !ga.dataset.w) { ga.dataset.w = '1'; ga.onclick = function () { gotoBtn('btnAgua', 'fueDialog'); }; }
  if (gq && !gq.dataset.w) { gq.dataset.w = '1'; gq.onclick = function () { gotoBtn('btnBosque', 'fueDialog'); }; }
}
window.FuegoPenco = { render: renderFuego, fase: fuegoFase, defensa: FUEGO_DEFENSA, check: FUEGO_CHECK };

/* ---------- arranque fase 2 ---------- */
var _fase2Retry = 0;
function setupFase2() {
  if (!document.querySelector('.action-group[data-group="territorio"] .group-btns') || typeof userData !== 'function') {
    _fase2Retry++;
    if (_fase2Retry < 80) setTimeout(setupFase2, 500);
    return;
  }
  try { wireMeli(); } catch (e) {}
  try { wireBallenas(); } catch (e2) {}
  try { wireHongos(); } catch (e3) {}
  try { wireSenderos(); } catch (e4) {}
  try { wireKayak(); } catch (e5) {}
  try { wireFuego(); } catch (e6) {}
  try { mejorarAgua(); } catch (e7) {}
  // reintento tardío por si Agua se construye después
  setTimeout(function () { try { mejorarAgua(); } catch (e) {} }, 2500);
  setTimeout(function () { try { mejorarAgua(); } catch (e) {} }, 6000);
}
try { document.addEventListener('territorio:listo', function () { try { mejorarAgua(); } catch (e) {} }); } catch (e) {}
setTimeout(setupFase2, 800);

})();

