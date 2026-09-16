/* ============================================================
   SEMILLERO NATIVO — Calendario 13 Lunas (Penco)
   Nueva pestana "Semillero nativo" dentro de Bosque Nativo
   (Bosque hoy | Historia | Ecosistema | Semillero nativo),
   enfocada 100% en especies del bosque esclerofilo-laurifolio:
     🏺 Banco nativo (tus recolecciones de la bitacora del bosque
        + especies del catalogo por recolectar)
     🌱 Multiplicacion nativa
     ❄️ Estratificacion nativa (tabla generada del catalogo
        BOSQUE_NATIVO_PENCO: epoca y truco por especie)
     📚 Guias del semillero nativo
   La version de Siembra lunar (semillero-guias.js) queda enfocada
   en comestibles de huerta; ambas se enlazan entre si.
   Todo local, sin red. Envuelve switchBosqueTab y
   renderBosqueDialog sin tocar renderer.js ni bosque-historia.js.
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
function getBosqueCatalog() {
  try {
    if (typeof BOSQUE_CATALOG !== 'undefined' && BOSQUE_CATALOG.length) return BOSQUE_CATALOG;
    var pd = window.pencoData || {};
    if (pd.BOSQUE_NATIVO_PENCO) return pd.BOSQUE_NATIVO_PENCO;
  } catch (e) {}
  return [];
}
function getBosqueEntries() {
  try {
    if (typeof getBosqueData === 'function') return getBosqueData().entries || [];
    var u = (typeof userData === 'function') ? userData() : null;
    return (u && u.bosque && u.bosque.entries) || [];
  } catch (e) { return []; }
}
function nativeChip(nombre) {
  return '<span class="chip chip-bosque" data-natsem="' + esc(nombre) + '" style="cursor:pointer" title="Toca para cargarla en la bitácora como recolección de semillas">🌰 ' + esc(nombre) + '</span>';
}
function wireNativeChips(scope) {
  if (!scope || !scope.querySelectorAll) return;
  scope.querySelectorAll('[data-natsem]').forEach(function (el) {
    el.onclick = function () {
      try { switchBosqueTab('actual'); } catch (e) {}
      setTimeout(function () {
        var inp = $('bosqueSpecies');
        if (inp) { inp.value = el.getAttribute('data-natsem'); }
        var act = $('bosqueAction');
        if (act) { act.value = 'recolección semillas'; }
        try {
          var f = $('bosqueDate');
          if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (inp) inp.focus();
        } catch (e2) {}
      }, 60);
    };
  });
}

/* ---------- Contenido estatico ---------- */
var NAT_MULTI = [
  { t: '🌱 Siembra directa inmediata (recalcitrantes)', luna: 'Menguante de otoño', epoca: 'Mar–May (peumo, avellano) · Dic–Feb (canelo)',
    pasos: '1) Recolecta el fruto apenas cae, no lo dejes secar. 2) Siembra el mismo día en bolsa profunda (20 cm o más). 3) Cubre con 2× su tamaño en tierra de hoja. 4) Sombra húmeda hasta que emerja.',
    sirve: 'Peumo, Avellano, Canelo, Lingue, Naranjillo, Trihue.',
    error: 'Guardar la semilla seca en un cajón: muere en semanas.' },
  { t: '🧺 Almácigo otoñal', luna: 'Menguante', epoca: 'Rimü–Pukem (otoño–invierno)',
    pasos: '1) Mezcla: 2 partes tierra de hoja + 1 arena. 2) Siembra a 1–2 cm, riega fino. 3) Protege de heladas con malla o techo. 4) Repica a bolsa cuando tenga 4 hojas verdaderas.',
    sirve: 'Maitén, Quillay (previo remojo 24 h), Boldo, Arrayán.',
    error: 'Almácigo a pleno sol de verano: se cuece la raíz.' },
  { t: '✂️ Esqueje nativo', luna: 'Creciente de primavera (canelo: menguante otoñal)',
    epoca: 'Pewü (primavera)',
    pasos: '1) Rama semileñosa de 15 cm cortada en la mañana. 2) Saca hojas bajas, deja 2–3 arriba. 3) Entierra 1/3 en arena húmeda a la sombra. 4) No riegues en exceso: solo humedad constante.',
    sirve: 'Canelo, Maqui, Arrayán, arbustos del sotobosque.',
    error: 'Esqueje de madera vieja o en tierra encharcada: se pudre.' },
  { t: '〰️ Acodo y mugrón', luna: 'Creciente de primavera',
    epoca: 'Pewü (primavera)',
    pasos: '1) Dobla una rama baja hasta el suelo sin quebrarla. 2) Hiérela levemente y tápala con tierra de hoja. 3) Fija con una piedra y mantén húmedo. 4) Separa cuando tenga raíz propia (una temporada).',
    sirve: 'Maqui, Arrayán, Avellano (sierpes), Copihue (con cuidado, sin extraer).',
    error: 'Separar antes de tiempo: la planta hija no sobrevive.' },
  { t: '🌧️ Trasplante en Pukem', luna: 'Menguante con lluvia',
    epoca: 'Pukem (invierno): suelo blando y lluvias',
    pasos: '1) Hoyo de 40×40 con compost al fondo. 2) Planta al atardecer, al mismo nivel del cuello. 3) Acolcha con hojas y riega aunque llueva. 4) Marca con tutor y protege de conejos/rozos.',
    sirve: 'Peumo, Quillay, Canelo, Boldo, Maitén y todo nativo de vivero.',
    error: 'Plantar en verano sin riego asegurado: primera baja segura.' },
  { t: '🛡️ Cosecha con medida', luna: 'La que indique la especie',
    epoca: 'Todo el año según fruto',
    pasos: '1) Cosecha 30% y deja 70% para aves y suelo. 2) Prefiere fruto caído o tijera; nunca arranques. 3) En especies vulnerables o protegidas solo observa y fotografía. 4) Anota fecha y lugar en tu bitácora.',
    sirve: 'Maqui, Avellana (consumo), Arrayán, Boldo — y regla para todo el bosque.',
    error: 'Varear o llevarse todo: el bosque no se regenera.' }
];

var NAT_ESTRAT = {
  intro: 'La semilla nativa trae dormancia: pide el empujón que le daría la naturaleza (frío de invierno, lluvia, paso por un ave). La tabla se genera sola desde tu catálogo de Bosque Nativo.',
  metodos: [
    { t: '❄️ Frío húmedo', d: 'Arena apenas húmeda en frasco, 2–8 °C por 30 días (maqui). Revisa cada 2 semanas contra el moho.' },
    { t: '💧 Remojo 24 h', d: 'Una noche en agua a temperatura ambiente. Quillay y varias de huerta lo agradecen.' },
    { t: '🫐 Macerado y lavado', d: 'Saca la pulpa de bayas (arrayán, maqui, boldo) lavando: la pulpa frena la germinación.' },
    { t: '🌱 Siembra inmediata', d: 'Recalcitrantes (peumo, canelo, lingue, avellana): si se secan, mueren. Del árbol a la bolsa el mismo día.' }
  ],
  test: '<b>🧪 Test de germinación:</b> 10 semillas en toalla húmeda dentro de una bolsa a 20 °C. Si brotan 7–8 en 2–4 semanas, el lote sirve. Las nativas son más lentas que la huerta: paciencia.'
};

var NAT_GUIAS = [
  { t: '🫐 Cosecha por tipo de fruto', d: 'Baya/drupa (maqui, arrayán, boldo, peumo, naranjillo): fruto maduro, macera y lava. Cápsula seca (quillay, maitén): recoge antes que abra. Aquenio plumoso (trihue): malla antes que vuele. Hueso grande (avellana, keule): del suelo, sin vareo.',
    go: 'banco' },
  { t: '🏺 Guardado nativo', d: 'Sobre de papel (nunca plástico), lugar fresco-oscuro y etiqueta con fecha. Ojo: recalcitrantes NO se guardan — se siembran altiro. Viabilidad corta: trihue y lingue días, no meses.',
    go: 'banco' },
  { t: '🌙 Luna del bosque', d: 'Menguante otoñal: plantar, podar y siembra directa. Creciente de primavera: esquejes. Frutos otoñales: siembra inmediata apenas caen. Ver Bosque hoy para el consejo de esta luna.',
    go: 'hoy' },
  { t: '🐦 Planta para las aves', d: 'Cada maqui o arrayán nuevo es comedero por décadas. Las dispersoras (zorzal, tenca, torcaza) siembran el cerro por ti. Verlas en Aves → Bosque Nativo.',
    go: 'aves' },
  { t: '🤝 Intercambia nativo', d: 'Regala plantines y semillas con fecha a vecinos (trafkintu del bosque) y anota el origen en tu bitácora: así sabes qué linaje prende en tu suelo.',
    go: 'banco' },
  { t: '🌱 ¿Y la huerta?', d: 'Tomate, poroto, haba, lechuga y el resto de comestibles viven en Siembra lunar → Semillero, con sus propias técnicas y estratificación.',
    go: 'siembra' }
];

/* ---------- Sub-pestanas ---------- */
var bsemSub = 'banco';
function switchBsemSub(t) {
  bsemSub = t;
  ['banco', 'multi', 'estrat', 'guias'].forEach(function (k) {
    var b = $('bsemSub-' + k), p = $('bsemillero-' + k);
    if (b) b.classList.toggle('btn-accent', k === t);
    if (p) p.classList.toggle('hidden', k !== t);
  });
}

function bsemBancoHtml() {
  var entries = getBosqueEntries().filter(function (r) { return r.action === 'recolección semillas'; });
  var cat = getBosqueCatalog();
  var porSp = {};
  entries.forEach(function (r) {
    var k = String(r.species || '').trim() || '—';
    if (!porSp[k]) porSp[k] = { n: 0, ultima: '' };
    porSp[k].n++;
    if (!porSp[k].ultima || String(r.date) > String(porSp[k].ultima)) porSp[k].ultima = r.date;
  });
  var recolectadas = Object.keys(porSp).sort(function (a, b) { return porSp[b].n - porSp[a].n; });
  var mencionadas = entries.map(function (r) { return String(r.species || '').toLowerCase(); });
  var porRecolectar = cat
    .filter(function (b) {
      var low = String(b.nombre).toLowerCase();
      return !mencionadas.some(function (m) { return m.indexOf(low) >= 0; });
    })
    .map(function (b) { return b.nombre; });
  var html = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🏺 Banco nativo</h4>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<span class="chip">' + entries.length + ' recolecciones</span>' +
    '<span class="chip">' + recolectadas.length + ' especies</span>' +
    '<span class="chip">🌿 ' + cat.length + ' en catálogo</span></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Se alimenta de tu bitácora (tipo <b>recolección semillas</b>). Toca una especie para cargarla en el formulario.</p>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="bsemGoForm" class="btn" style="width:auto;font-size:11px">📓 Ir a la bitácora</button></div></div>';
  if (!recolectadas.length) {
    html += '<div class="menstrual-card" style="margin-top:10px"><p style="font-size:12px">Aún sin recolecciones. Registra la primera en 🌿 Bosque hoy (tipo <b>recolección semillas</b>) y aparecerá aquí.</p></div>';
  } else {
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>✅ Recolectadas (' + recolectadas.length + ')</h4>' +
      recolectadas.map(function (k) {
        return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + nativeChip(k) +
          ' <span class="chip" style="font-size:9px">×' + porSp[k].n + '</span></h4>' +
          '<p class="muted" style="font-size:10px">Última: ' + esc(porSp[k].ultima || '—') + '</p></div>';
      }).join('') + '</div>';
  }
  if (porRecolectar.length) {
    html += '<div class="menstrual-card" style="margin-top:10px"><h4>🔭 Por recolectar (' + porRecolectar.length + ')</h4>' +
      '<p class="muted" style="font-size:11px">Del catálogo, con su época de semilla (ver Estratificación):</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + porRecolectar.map(nativeChip).join('') + '</div></div>';
  }
  return html;
}

function bsemMultiHtml() {
  return '<p class="muted" style="font-size:11px;line-height:1.55">El nativo se multiplica sobre todo por <b>semilla en su época</b>, pero también por esqueje, acodo y trasplante en Pukem. Respeta vedas y categorías de protección.</p>' +
    NAT_MULTI.map(function (m) {
      return '<div class="menstrual-card" style="margin-top:10px"><h4>' + esc(m.t) +
        ' <span class="chip" style="font-size:9px">🌙 ' + esc(m.luna) + '</span></h4>' +
        '<p class="muted" style="font-size:10px">📅 ' + esc(m.epoca) + '</p>' +
        '<p style="font-size:11px">' + esc(m.pasos) + '</p>' +
        '<p style="font-size:11px"><b>Sirve para:</b> ' + esc(m.sirve) + '</p>' +
        '<p class="muted" style="font-size:11px">⚠️ ' + esc(m.error) + '</p></div>';
    }).join('');
}

function bsemEstratHtml() {
  var g = NAT_ESTRAT;
  var cat = getBosqueCatalog();
  var tabla = cat.map(function (b) {
    var prot = /proteg|peligro|permiso|vulnerable/i.test(String(b.nota || '') + String(b.epoca || ''));
    return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + nativeChip(b.nombre) +
      ' <span class="chip" style="font-size:9px">🌰 ' + esc(b.semillas || '—') + '</span>' +
      (prot ? ' <span class="chip" style="font-size:9px;background:#e76e8a22;color:#e76e8a;border-color:#e76e8a55">solo observar</span>' : '') + '</h4>' +
      '<p style="font-size:11px">' + esc(b.nota || '') + '</p></div>';
  }).join('');
  return '<p class="muted" style="font-size:11px;line-height:1.55">' + g.intro + '</p>' +
    g.metodos.map(function (m) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + esc(m.t) + '</h4>' +
        '<p style="font-size:11px">' + esc(m.d) + '</p></div>';
    }).join('') +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🌰 Quién pide qué (' + cat.length + ')</h4>' + tabla + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p style="font-size:12px">' + g.test + '</p></div>';
}

function bsemGuiasHtml() {
  return '<p class="muted" style="font-size:11px;line-height:1.55">Guías cortas del semillero nativo, conectadas con el resto de la app.</p>' +
    NAT_GUIAS.map(function (x) {
      var btn = '';
      if (x.go === 'banco') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-bsemgo="banco">🏺 Ir al banco</button>';
      else if (x.go === 'hoy') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-bsemtab="actual">🌿 Ir a Bosque hoy</button>';
      else if (x.go === 'aves') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-bsemaves="1">🦅 Ver aves del bosque</button>';
      else if (x.go === 'siembra') btn = '<button type="button" class="btn" style="width:auto;font-size:11px" data-bsemsiembra="1">🌱 Ir al Semillero de huerta</button>';
      return '<div class="menstrual-card" style="margin-top:10px"><h4>' + esc(x.t) + '</h4>' +
        '<p style="font-size:11px">' + esc(x.d) + '</p>' +
        (btn ? '<div class="dlg-actions" style="justify-content:flex-start">' + btn + '</div>' : '') + '</div>';
    }).join('');
}

function wireBsemBtns(scope) {
  if (!scope || !scope.querySelectorAll) return;
  scope.querySelectorAll('[data-bsemgo]').forEach(function (b) {
    b.onclick = function () { switchBsemSub(b.getAttribute('data-bsemgo')); };
  });
  scope.querySelectorAll('[data-bsemtab]').forEach(function (b) {
    b.onclick = function () { try { switchBosqueTab(b.getAttribute('data-bsemtab')); } catch (e) {} };
  });
  scope.querySelectorAll('[data-bsemaves]').forEach(function (b) {
    b.onclick = function () {
      try { var d = $('bosqueDialog'); if (d) d.close(); } catch (e) {}
      setTimeout(function () {
        try { $('btnBirds').click(); } catch (e2) {}
        setTimeout(function () { try { window.AvesHistoria.tab('bosque'); } catch (e3) {} }, 300);
      }, 150);
    };
  });
  scope.querySelectorAll('[data-bsemsiembra]').forEach(function (b) {
    b.onclick = function () {
      try { var d = $('bosqueDialog'); if (d) d.close(); } catch (e) {}
      setTimeout(function () { try { $('btnSiembra').click(); } catch (e2) {} }, 150);
    };
  });
}

/* ---------- Render principal ---------- */
function renderBosqueSemillero() {
  var box = $('bosqueSemilleroPanel');
  if (!box) return;
  box.innerHTML =
    '<p class="muted" style="font-size:11px;line-height:1.55">Semillas del <b>bosque nativo de Penco</b>: qué recolectar, cuándo y cómo multiplicarlo. La huerta comestible vive en 🌱 Siembra lunar → Semillero.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="bsemSub-banco" class="btn btn-accent" style="width:auto">🏺 Banco nativo</button>' +
    '<button type="button" id="bsemSub-multi" class="btn" style="width:auto">🌱 Multiplicación</button>' +
    '<button type="button" id="bsemSub-estrat" class="btn" style="width:auto">❄️ Estratificación</button>' +
    '<button type="button" id="bsemSub-guias" class="btn" style="width:auto">📚 Guías</button></div>' +
    '<div id="bsemillero-banco">' + bsemBancoHtml() + '</div>' +
    '<div id="bsemillero-multi" class="hidden">' + bsemMultiHtml() + '</div>' +
    '<div id="bsemillero-estrat" class="hidden">' + bsemEstratHtml() + '</div>' +
    '<div id="bsemillero-guias" class="hidden">' + bsemGuiasHtml() + '</div>';
  wireNativeChips(box);
  wireBsemBtns(box);
  ['banco', 'multi', 'estrat', 'guias'].forEach(function (k) {
    var b = $('bsemSub-' + k);
    if (b) b.onclick = function () { switchBsemSub(k); };
  });
  var gf = $('bsemGoForm');
  if (gf) gf.onclick = function () { try { switchBosqueTab('actual'); } catch (e) {} };
  switchBsemSub(bsemSub);
}

/* ---------- Setup: cablea 4ta pestana ---------- */
function setupBosqueSemillero() {
  if (typeof switchBosqueTab !== 'function' || !$('bosqueDialog') || !$('tabBosqueSemillero')) {
    window._bqsemRetry = (window._bqsemRetry || 0) + 1;
    if (window._bqsemRetry < 60) setTimeout(setupBosqueSemillero, 500);
    return;
  }
  try {
    var btn = $('btnBosque');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('semillero') < 0)
      btn.dataset.keywords += ' semillero nativo banco semillas recolecta estratificacion multiplicacion esqueje recalcitrante vivero';
  } catch (e) {}
  var tS = $('tabBosqueSemillero');
  if (tS && !tS.dataset.w) { tS.dataset.w = '1'; tS.onclick = function () { switchBosqueTab('semillero'); }; }
  /* envuelve el cambio de pestana para manejar la 4ta */
  if (!window._bqsemTabWrapped) {
    window._bqsemTabWrapped = true;
    var origTab = switchBosqueTab;
    switchBosqueTab = function (t) {
      var r = origTab.apply(this, arguments);
      try {
        var b = $('tabBosqueSemillero'), p = $('bosqueSemilleroPanel');
        if (b) b.classList.toggle('btn-accent', t === 'semillero');
        if (p) p.classList.toggle('hidden', t !== 'semillero');
        if (t === 'semillero') renderBosqueSemillero();
      } catch (e) {}
      return r;
    };
  }
  /* refresca el banco si cambia la bitacora */
  if (typeof renderBosqueDialog === 'function' && !window._bqsemDlgWrapped) {
    window._bqsemDlgWrapped = true;
    var origDlg = renderBosqueDialog;
    renderBosqueDialog = function () {
      var r = origDlg.apply(this, arguments);
      try {
        var p = $('bosqueSemilleroPanel');
        if (p && !p.classList.contains('hidden')) renderBosqueSemillero();
      } catch (e) {}
      return r;
    };
  }
  var bq = $('btnBosque');
  if (bq && !bq.dataset.bqsemW) {
    bq.dataset.bqsemW = '1';
    bq.addEventListener('click', function () { try { switchBosqueTab('actual'); } catch (e) {} });
  }
  try { renderBosqueSemillero(); } catch (e) {}
}

window.BosqueSemillero = {
  go: function () { try { switchBosqueTab('semillero'); } catch (e) {} },
  sub: switchBsemSub,
  render: renderBosqueSemillero
};
setTimeout(setupBosqueSemillero, 900);

})();
