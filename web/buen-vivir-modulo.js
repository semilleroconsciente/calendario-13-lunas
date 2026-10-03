/* ============================================================
   BUEN VIVIR — Calendario 13 Lunas (Penco · Bio-Bío)
   Apartado: Territorio > Buen Vivir (btnBuenVivir -> buenVivirDialog),
   pestañas: Visión | Pueblos | Práctica.
   Enfoque:
     🌎 Ética de lo suficiente: Küme Mongen, Sumak Kawsay,
        Ñande Reko, Vivir Bien kolla, Shiir Waras, Balu Wala,
        Suma Qamaña — 7 miradas de los pueblos originarios.
     🌱 Práctica pencona: compromisos cotidianos (agua, residuos,
        consumo local, minga, nativo, energía, gratitud) con
        puentes a los módulos del calendario.
   Todo local, sin red obligatoria. Se edita aquí mismo.
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
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}

/* ---------- contenido ---------- */
var BV_PRINCIPIOS = [
  '🌎 Ética de lo suficiente, no del acumular',
  '🌿 Parte viva de la comunidad terrenal, no dueña',
  '💧🌬️🔥 Aire, agua, suelo, montaña, árbol, animal: familia',
  '♻️ Frugal, consciente y regenerativo',
  '❤️ Afectivo, espiritual y comunitario',
  '✊ No al individualismo, lucro desmedido y mercantilización de la vida'
];

var BV_PUEBLOS = [
  { nombre: 'Küme Mongen', pueblo: 'Pueblo Mapuche', sig: '“buen vivir”', ico: '🌎',
    texto: 'Conexión profunda con la naturaleza, en equilibrio con las fuerzas y seres que la habitan. Armonía entre el agua, el territorio, la vida personal, familiar y comunitaria, la cultura y las energías espirituales. Reconstruir el Küme Mongen es reconstruir una sociedad con dignidad, solidaridad y reciprocidad para todos los pueblos. Es, ante todo, una lucha por amor a la vida.' },
  { nombre: 'Sumak Kawsay', pueblo: 'Pueblo Kichwa · Ecuador', sig: '“vida plena en armonía”', ico: '🌎',
    texto: 'Guía las relaciones dentro del Ayllu (comunidad) y entre la comunidad y la naturaleza. Vivir en equilibrio con los ríos, los bosques, las montañas, los espíritus protectores y los dioses: todo está interconectado y merece respeto.' },
  { nombre: 'Ñande Reko', pueblo: 'Pueblo Guaraní', sig: '“nuestro modo de ser”', ico: '🌎',
    texto: 'Libertad, alegría comunitaria, reciprocidad y convite. Todo orientado a la búsqueda de la Tierra Sin Mal: un mundo justo, en paz y en plenitud.' },
  { nombre: 'Vivir Bien', pueblo: 'Pueblo Kolla · Argentina', sig: 'crecer con la naturaleza', ico: '🌎',
    texto: 'Crecer con la naturaleza, no contra ella. Como dice el sabio Huanacuni: “El ser humano es tierra que anda”. La vida florece solo cuando se respeta ese vínculo sagrado.' },
  { nombre: 'Shiir Waras', pueblo: 'Pueblo Shuar · Ecuador', sig: '“buen vivir”', ico: '🌎',
    texto: 'Paz doméstica y vida armoniosa, en equilibrio con la familia, la comunidad y la naturaleza. Bienestar integral, tejido en el día a día.' },
  { nombre: 'Balu Wala', pueblo: 'Pueblo Guna · Panamá y Colombia', sig: '“árbol de sal”', ico: '🌎',
    texto: 'Eje filosófico de la existencia guna: relación indisoluble entre humanidad, naturaleza y universo, fundada en el respeto, la equidad y la armonía. Guía las relaciones políticas, económicas y sociales, y fortalece la producción comunitaria y la calidad de vida colectiva, desde la memoria y el presente comunitario.' },
  { nombre: 'Suma Qamaña', pueblo: 'Pueblos Aymara y Quechua · Andes', sig: '“vivir bien”', ico: '🌎',
    texto: 'Paradigma andino: relacionalidad, complementariedad, ciclicidad, correspondencia y conciencia natural. La vida es un todo orgánico donde dialogan Jaqi (seres humanos), Wak’a (divinidades) y Sallqa (naturaleza silvestre). Con-vivir en armonía con la Tierra, el mundo espiritual y las futuras generaciones.' }
];

var BV_PRACTICAS = [
  { ico: '💧', t: 'Cuida el agua', d: 'Ducha corta, repara goteos, riega al atardecer. El agua no se gasta: se devuelve limpia.' },
  { ico: '♻️', t: 'Reutiliza y recicla', d: 'Separa vidrio, plástico, papel y aceite. Lleva al punto limpio; lo orgánico al compost.' },
  { ico: '🥬', t: 'Consume local y de estación', d: 'Feria de Penco, trueque con vecinos, huerta propia. Menos envase, más territorio.' },
  { ico: '🤝', t: 'Haz minga', d: 'Una mano lava la otra: ayuda en cosechas, techos o limpieza de quebrada. Anótala y convoca.' },
  { ico: '🌱', t: 'Planta nativo', d: 'Peumo, quillay, boldo, chilco en Pukem con lluvia. En el cerro: foto antes que muestra.' },
  { ico: '🔥', t: 'Energía justa', d: 'Leña seca, olla tapada, luz solo donde estás. Lo suficiente abriga igual.' },
  { ico: '🙏', t: 'Agradece y pide permiso', d: 'Llellipun antes de cortar, gratitud después de recibir. Devuelve algo siempre.' },
  { ico: '🗣️', t: 'Transmite', d: 'Enseña un oficio, graba a tus abuelos, cuenta un epew. La memoria también se siembra.' }
];

var BV_AMBITOS = ['💧 Agua', '♻️ Residuos', '🥬 Consumo', '🤝 Comunidad', '🌱 Territorio', '🔥 Energía', '🙏 Espíritu'];

/* ---------- bitácora privada ---------- */
function getBvData() {
  var a = store('buenVivir', { compromisos: [] });
  if (!a || !Array.isArray(a.compromisos)) {
    try { var u = userData(); u.buenVivir = { compromisos: [] }; return u.buenVivir; } catch (e) { return { compromisos: [] }; }
  }
  return a;
}
function bvStats() {
  var list = [];
  try { list = getBvData().compromisos || []; } catch (e) {}
  var hechas = list.filter(function (x) { return x.hecho; }).length;
  return { total: list.length, hechas: hechas };
}
function buildBvShareText(list) {
  if (!list.length) return '🌎 Mis compromisos del Buen Vivir — aún sin registros';
  var t = '🌎 Mis compromisos del Buen Vivir · ' + list.length + '\n\n';
  list.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).forEach(function (c) {
    t += (c.hecho ? '✅ ' : '• ') + c.fecha + ' · ' + (c.ambito || 'vivir bien') + ' · ' + c.texto + '\n';
  });
  return t + '\n— Vivir Bien es Vivir Juntos · Penco';
}

/* ---------- pestañas ---------- */
var bvTab = 'vision';
function switchBvTab(t) {
  bvTab = t;
  var b1 = $('tabBvVision'), b2 = $('tabBvPueblos'), b3 = $('tabBvPract');
  if (b1) b1.classList.toggle('btn-accent', t === 'vision');
  if (b2) b2.classList.toggle('btn-accent', t === 'pueblos');
  if (b3) b3.classList.toggle('btn-accent', t === 'pract');
  var p1 = $('bvVisionPanel'), p2 = $('bvPueblosPanel'), p3 = $('bvPractPanel');
  if (p1) p1.classList.toggle('hidden', t !== 'vision');
  if (p2) p2.classList.toggle('hidden', t !== 'pueblos');
  if (p3) p3.classList.toggle('hidden', t !== 'pract');
  if (t === 'pract') renderBvComp();
}

function renderBvVision() {
  var box = $('bvVisionPanel');
  if (!box) return;
  box.innerHTML =
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🙏🌎 El Buen Vivir no es un ideal individual</h4>' +
    '<p style="font-size:12px;line-height:1.6">Es una <b>ética de lo suficiente para toda la comunidad</b>: una visión holística del ser humano, entendido no como dueño del mundo, sino como <b>parte viva de la gran comunidad terrenal</b>.</p></div>' +
    '<div class="menstrual-card"><h4>🌿 Comunión con la Ñuke Mapu</h4>' +
    '<p style="font-size:12px;line-height:1.6">El aire que respiramos 🌬️, el agua que nos da vida 💧, los suelos que nos sostienen, las montañas que nos protegen, los árboles que nos cobijan 🌳, los animales que comparten nuestro camino: estar en profunda comunión con la <b>Ñuke Mapu (Madre Tierra)</b> y con las energías del universo 🌈🌕🔥.</p></div>' +
    '<div class="menstrual-card"><h4>🌱 Contra el consumir, acumular y dominar</h4>' +
    '<p style="font-size:12px;line-height:1.6">La naturaleza y la comunidad ya nos dan todo lo necesario. Vivir en armonía con todo lo que existe, celebrando ritos sagrados que renuevan, una y otra vez, los lazos entre lo <b>individual, lo colectivo y lo cósmico</b>.</p></div>' +
    '<div class="menstrual-card"><h4>♻️ Consumo frugal, consciente y regenerativo</h4>' +
    '<p style="font-size:12px;line-height:1.6">No tomar más de lo que el ecosistema puede regenerar, no generar residuos que no podamos reintegrar, reutilizar, reciclar y honrar cada recurso. <b>Y así, no habrá escasez.</b></p></div>' +
    '<div class="menstrual-card"><h4>❤️ Afectivo, espiritual y comunitario</h4>' +
    '<p style="font-size:12px;line-height:1.6">Bienes materiales en equilibrio con la naturaleza y las personas. Nadie vive aislado: vivimos en familia, en sociedad, en diálogo con el entorno. <b>No se puede Vivir Bien si se daña la Tierra.</b></p></div>' +
    '<div class="menstrual-card"><h4>✊ Una relación distinta</h4>' +
    '<p style="font-size:12px;line-height:1.6">Se opone al individualismo, al lucro desmedido, a la lógica fría del costo-beneficio, a la mercantilización de la vida, a la explotación y a la violencia del consumismo egoísta. Propone otra relación: entre humanos, entre culturas, y entre la humanidad y la naturaleza — con dimensión ética, humana y cósmica, enraizada en la historia, la espiritualidad y el respeto mutuo.</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + BV_PRINCIPIOS.map(function (p) { return '<span class="chip" style="font-size:10px;white-space:normal">' + esc(p) + '</span>'; }).join('') + '</div></div>';
}

function renderBvPueblos() {
  var box = $('bvPueblosPanel');
  if (!box) return;
  box.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌿 Siete miradas, un mismo horizonte</h4>' +
    '<p class="muted" style="font-size:11px">Los pueblos originarios ofrecen caminos reales hacia el bien común. Toca tu compromiso en la pestaña 🌱 Práctica.</p></div>' +
    BV_PUEBLOS.map(function (p) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12.5px">' + p.ico + ' ' + esc(p.nombre) + ' <span class="muted" style="font-weight:400">· ' + esc(p.pueblo) + '</span></h4>' +
        '<p style="font-size:11px;color:var(--gold)"><i>' + esc(p.sig) + '</i></p>' +
        '<p style="font-size:11.5px;line-height:1.6">' + esc(p.texto) + '</p></div>';
    }).join('') +
    '<div class="menstrual-card" style="border-color:var(--gold)"><p style="font-size:12px;line-height:1.6">🌱 Como sociedad global, tenemos mucho que aprender de estas visiones: no solo una crítica al modelo actual, sino caminos profundos y sanadores hacia el bien común, la solidaridad activa y una vida digna para todos los seres.<br><b>Porque Vivir Bien es Vivir Juntos. ❤️🌱</b></p></div>';
}

function renderBvPractGuia() {
  var box = $('bvPractGuia');
  if (!box) return;
  box.innerHTML = '<h4>🌱 Práctica pencona de todos los días</h4>' +
    '<div style="display:flex;flex-direction:column;gap:6px">' + BV_PRACTICAS.map(function (p) {
      return '<div class="si-card" style="padding:6px 10px"><b style="font-size:12px">' + p.ico + ' ' + esc(p.t) + '</b><p class="muted" style="font-size:11px;margin:2px 0 0">' + esc(p.d) + '</p></div>';
    }).join('') + '</div>';
}

function renderBvComp() {
  renderBvPractGuia();
  var box = $('bvCompList');
  if (!box) return;
  var list = [];
  try { list = getBvData().compromisos || []; } catch (e) {}
  var st = $('bvCompStats');
  var s = bvStats();
  if (st) st.textContent = s.total ? (s.total + ' compromisos · ' + s.hechas + ' cumplidos') : 'Sin compromisos aún';
  if (!list.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin compromisos. Elige una práctica de arriba y escríbela como compromiso: “esta luna, yo…”.</p>'; return; }
  var sorted = list.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  box.innerHTML = sorted.slice(0, 60).map(function (c) {
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center;gap:6px"><span style="font-size:11.5px;flex:1;min-width:0">' +
      (c.hecho ? '✅ <s>' + esc(c.texto) + '</s>' : '• <b>' + esc(c.texto) + '</b>') +
      '<br><span class="muted" style="font-size:10.5px">' + esc(c.ambito || '') + ' · ' + esc(c.fecha || '') + '</span></span>' +
      '<span style="display:flex;gap:4px;flex:0 0 auto">' +
      '<button type="button" class="btn bv-done" data-id="' + c.id + '" style="width:auto;font-size:11px" title="Marcar cumplido">' + (c.hecho ? '↩️' : '✅') + '</button>' +
      '<button type="button" class="btn bv-del" data-id="' + c.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.bv-done').forEach(function (b) {
    b.onclick = function () {
      var arr = getBvData().compromisos;
      var it = arr.find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (it) { it.hecho = !it.hecho; save(it.hecho ? 'Compromiso cumplido ✅' : 'Guardado ✓'); renderBvComp(); }
    };
  });
  box.querySelectorAll('.bv-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este compromiso?')) return;
      var arr = getBvData().compromisos;
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderBvComp();
    };
  });
}

/* ---------- diálogo + botón ---------- */
function ensureBvDialog() {
  if ($('buenVivirDialog')) return $('buenVivirDialog');
  var d = document.createElement('dialog');
  d.id = 'buenVivirDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🌎 Buen Vivir — Küme Mongen</h3>' +
    '<button type="button" id="bvCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Ética de lo suficiente para toda la comunidad 🙏🌎. Siete pueblos, un horizonte: <b>Vivir Bien es Vivir Juntos</b>. Tus compromisos quedan <b>privados y locales</b>.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabBvVision" class="btn btn-accent" style="width:auto">🌎 Visión</button>' +
    '<button type="button" id="tabBvPueblos" class="btn" style="width:auto">🌿 Pueblos</button>' +
    '<button type="button" id="tabBvPract" class="btn" style="width:auto">🌱 Práctica</button></div>' +
    '<div id="bvVisionPanel"></div>' +
    '<div id="bvPueblosPanel" class="hidden"></div>' +
    '<div id="bvPractPanel" class="hidden"><div id="bvPractGuia" style="display:flex;flex-direction:column;gap:8px"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🤝 Mis compromisos del Buen Vivir</h4>' +
    '<div class="conv-row"><label style="flex:2">Compromiso <input type="text" id="bvCompInput" placeholder="ej: esta luna llevo mi bolsa a la feria" maxlength="90"></label>' +
    '<label>Ámbito <select id="bvCompAmbito"></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;flex-wrap:wrap"><button type="button" id="bvCompAdd" class="btn btn-accent" style="width:auto">+ Comprometerme</button>' +
    '<button type="button" id="bvCompShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="bvCompExport" class="btn" style="width:auto">📥 Exportar</button>' +
    '<button type="button" id="bvCompClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></div>' +
    '<div id="bvCompList" class="habits-list" style="margin-top:8px;max-height:220px"></div>' +
    '<p id="bvCompStats" class="muted" style="font-size:11px;margin-top:6px"></p></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🔗 Camina con el calendario</h4>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
    '<button type="button" class="btn bv-go" data-go="btnGratitud" style="width:auto;font-size:11px">📓 Gratitud</button>' +
    '<button type="button" class="btn bv-go" data-go="btnEspiritual" style="width:auto;font-size:11px">🕉️ Prácticas</button>' +
    '<button type="button" class="btn bv-go" data-go="btnVozAbuelos" style="width:auto;font-size:11px">🗣️ Abuelos</button>' +
    '<button type="button" class="btn bv-go" data-go="btnMapu" style="width:auto;font-size:11px">🗣️ Kimün</button>' +
    '<button type="button" class="btn bv-go" data-go="btnMinga" style="width:auto;font-size:11px">🤝 Minga</button>' +
    '<button type="button" class="btn bv-go" data-go="btnTrueque" style="width:auto;font-size:11px">🔄 Trueque</button>' +
    '<button type="button" class="btn bv-go" data-go="btnSiembra" style="width:auto;font-size:11px">🌱 Siembra</button>' +
    '<button type="button" class="btn bv-go" data-go="btnCompost" style="width:auto;font-size:11px">🪱 Compost</button>' +
    '</div></div></div>' +
    '<div class="dlg-actions"><button type="button" id="bvClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  var amb = d.querySelector('#bvCompAmbito');
  if (amb) BV_AMBITOS.forEach(function (a) {
    var o = document.createElement('option'); o.value = a; o.textContent = a; amb.appendChild(o);
  });
  return d;
}

function ensureBvButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g || $('btnBuenVivir')) return;
  var b = document.createElement('button');
  b.id = 'btnBuenVivir';
  b.className = 'btn';
  b.setAttribute('data-sub', 'tierra');
  b.setAttribute('data-keywords', 'buen vivir vivir bien kume mongen küme mongen sumak kawsay ñande reko suma qamaña shiir waras balu wala filosofia indigena originario mapuche kichwa guarani kolla shuar guna aymara quechua madre tierra nuke mapu ñuke mapu comunidad etica suficiente armonia tierra sin mal ayllu jaqi wak sallqa huanacuni');
  b.textContent = '🌎 Buen Vivir';
  var ref = $('btnFlora') || $('btnBosque');
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
    else g.appendChild(b);
  } else g.appendChild(b);
}

function ensureBvCheckbox() {
  if (document.querySelector('[data-btn="btnBuenVivir"]')) return;
  var ref = document.querySelector('[data-btn="btnFlora"]') || document.querySelector('[data-btn="btnBosque"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnBuenVivir"> 🌎 Buen Vivir';
    ref.closest('label').parentNode.insertBefore(lab, ref.closest('label').nextSibling);
  }
}

function wireBv() {
  ensureBvButton();
  ensureBvDialog();
  ensureBvCheckbox();
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf('btnBuenVivir') < 0) ALL_BTNS.push('btnBuenVivir');
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnBuenVivir') < 0) {
      var i = ORDEN_TERRITORIO.indexOf('btnFlora');
      if (i < 0) i = ORDEN_TERRITORIO.indexOf('btnBosque');
      if (i >= 0) ORDEN_TERRITORIO.splice(i + 1, 0, 'btnBuenVivir');
      else ORDEN_TERRITORIO.push('btnBuenVivir');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnFlora && p.btnBuenVivir === undefined) p.btnBuenVivir = true;
      });
    }
  } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  var btn = $('btnBuenVivir');
  if (btn && !btn.dataset.bvW) {
    btn.dataset.bvW = '1';
    btn.onclick = function () {
      try { renderBvVision(); } catch (e) {}
      try { renderBvPueblos(); } catch (e2) {}
      try { switchBvTab(bvTab || 'vision'); } catch (e3) {}
      try { renderBvComp(); } catch (e4) {}
      var dlg = $('buenVivirDialog');
      if (dlg && dlg.showModal) { try { dlg.showModal(); } catch (e5) { try { dlg.show(); } catch (e6) {} } }
    };
  }
  var t1 = $('tabBvVision'), t2 = $('tabBvPueblos'), t3 = $('tabBvPract');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchBvTab('vision'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchBvTab('pueblos'); }; }
  if (t3 && !t3.dataset.w) { t3.dataset.w = '1'; t3.onclick = function () { switchBvTab('pract'); }; }
  var ct = $('bvCloseTop'), cb = $('bvClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { try { $('buenVivirDialog').close(); } catch (e) {} }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { try { $('buenVivirDialog').close(); } catch (e) {} }; }
  var dlg2 = $('buenVivirDialog');
  if (dlg2 && !dlg2.dataset.goW) {
    dlg2.dataset.goW = '1';
    dlg2.querySelectorAll('.bv-go').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-go');
        try { $('buenVivirDialog').close(); } catch (e) {}
        setTimeout(function () { try { var t = $(id); if (t) t.click(); } catch (e2) {} }, 150);
      };
    });
  }
  var add = $('bvCompAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var v = clean(($('bvCompInput') || {}).value || '', 90).trim();
      if (!v) { alert('Escribe tu compromiso primero'); return; }
      getBvData().compromisos.push({
        id: uid('bv'), texto: v,
        ambito: (($('bvCompAmbito') || {}).value || BV_AMBITOS[0]),
        fecha: todayKey(), hecho: false
      });
      $('bvCompInput').value = '';
      save('Compromiso guardado 🌎');
      renderBvComp();
    };
  }
  var sh = $('bvCompShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var list = [];
      try { list = getBvData().compromisos || []; } catch (e) {}
      if (!list.length) { alert('Sin compromisos aún'); return; }
      share('🌎 Mis compromisos del Buen Vivir', buildBvShareText(list));
    };
  }
  var ex = $('bvCompExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var list = [];
      try { list = getBvData().compromisos || []; } catch (e) {}
      if (!list.length) { alert('Sin compromisos aún'); return; }
      var blob = new Blob([buildBvShareText(list)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'buen-vivir-compromisos.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var cl = $('bvCompClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!confirm('¿Borrar todos tus compromisos?')) return;
      getBvData().compromisos = [];
      save(); renderBvComp();
    };
  }
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

window.BuenVivir = {
  tab: switchBvTab, renderVision: renderBvVision, renderPueblos: renderBvPueblos,
  renderComp: renderBvComp, list: getBvData, pueblos: BV_PUEBLOS, practicas: BV_PRACTICAS
};

var _bvRetry = 0;
function setupBv() {
  if (!document.querySelector('.action-group[data-group="territorio"] .group-btns') || typeof userData !== 'function') {
    _bvRetry++;
    if (_bvRetry < 80) setTimeout(setupBv, 500);
    return;
  }
  try { wireBv(); } catch (e) {}
  try { renderBvVision(); } catch (e2) {}
  try { renderBvPueblos(); } catch (e3) {}
}
setTimeout(setupBv, 700);

})();
