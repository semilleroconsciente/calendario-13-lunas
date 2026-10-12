/* ============================================================
   ENERGÍA Y DESCANSO — Calendario 13 Lunas (Penco · Bío-Bío)
   Cuerpo & Salud > Cuidado y movimiento:
   - Botón btnEnergia (⚡ Energía y descanso)
   - Anotaciones OPCIONALES de sueño, ánimo y energía para
     observar patrones personales a través de las lunas.
     No diagnostica, no prescribe: solo espejo personal.
   - Diálogo energiaDialog: Hoy / Anotar / Lunas / Guía.
     userData().energiaDescanso = { regs: [] }
     reg = { id, fecha:YYYY-MM-DD, sueno (h 0-14),
             calidad:1-5, energia:1-5, animo:1-5, nota }
     Un registro por fecha (al guardar se actualiza si ya existe).
   - Marca en calendario principal: 💤 (ver core-calendario.js).
   - Todo local y privado por usuario. 100% offline.
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
  return String(s == null ? '' : s).slice(0, n || 120);
}
function uid(p) { return (p || 'e') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function fmtFecha(key) {
  try {
    var p = String(key).split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12));
    return cal.fmtDate.format(d);
  } catch (e) { return key; }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch (e) {}
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
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">' + title + '</h3>' +
    '<button type="button" data-close class="btn btn-icon" title="Cerrar">✕</button></div>' +
    (sub ? '<p class="muted su-77e2fe">' + sub + '</p>' : '') +
    bodyHTML +
    '<div class="dlg-actions"><button type="button" data-close class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  d.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { try { d.close(); } catch (e) {} }; });
  return d;
}
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }

function enStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { regs: [] };
    if (!u.energiaDescanso) u.energiaDescanso = { regs: [] };
    if (!Array.isArray(u.energiaDescanso.regs)) u.energiaDescanso.regs = [];
    return u.energiaDescanso;
  } catch (e) { return { regs: [] }; }
}
function lunaDeFecha(key) {
  try {
    if (typeof lunaMapForKey === 'function') {
      var r = lunaMapForKey(key);
      if (r && r.luna !== 'dft') return { y: r.y, luna: r.luna, dia: r.diaN };
    }
  } catch (e) {}
  return null;
}
function num(v, min, max, fb) {
  v = parseFloat(v);
  if (isNaN(v)) return fb;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
function cara(v) {
  v = Math.round(+v || 0);
  return ['—', '😣', '😕', '🙂', '😊', '🌟'][Math.min(5, Math.max(0, v))] || '—';
}
function prom(arr) {
  if (!arr.length) return 0;
  return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
}
function regsOrdenados() {
  return enStore().regs.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
}

/* ==================== DIÁLOGO ==================== */
function enBuild() {
  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabEnHoy" class="btn btn-accent su-30e741">⚡ Hoy</button>' +
    '<button type="button" id="tabEnAnotar" class="btn su-30e741">✏️ Anotar</button>' +
    '<button type="button" id="tabEnLunas" class="btn su-30e741">🌙 Por lunas</button>' +
    '<button type="button" id="tabEnGuia" class="btn su-30e741">📖 Guía</button></div>' +
    '<div id="enHoy"></div>' +
    '<div id="enAnotar" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>✏️ Anotación opcional (1 minuto)</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="enFecha"></label>' +
    '<label class="su-4b3de7">😴 Dormí (h) <input type="number" id="enSueno" min="0" max="14" step="0.5" value="7"></label></div>' +
    '<div class="conv-row"><label>😴 Calidad 1–5 <input type="number" id="enCalidad" min="1" max="5" step="1" value="3"></label>' +
    '<label>⚡ Energía 1–5 <input type="number" id="enEnergia" min="1" max="5" step="1" value="3"></label>' +
    '<label>💚 Ánimo 1–5 <input type="number" id="enAnimo" min="1" max="5" step="1" value="3"></label></div>' +
    '<label>Nota (opcional) <input type="text" id="enNota" placeholder="ej: trasnoche, siesta 20 min, caminata…" maxlength="120"></label>' +
    '<p class="muted su-11a508">Un registro por fecha: si anotas dos veces el mismo día, se actualiza. Todo opcional: puedes anotar solo 1 campo.</p>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="enAdd" class="btn btn-accent su-30e741">+ Guardar</button></div></div>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar <input type="text" id="enQ" placeholder="nota, fecha..."></label></div>' +
    '<div id="enList" class="su-bf3828"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="enStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="enShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="enClear" class="btn su-214f75">🗑 Borrar todo</button></span></div></div>' +
    '<div id="enLunas" class="hidden"></div>' +
    '<div id="enGuia" class="hidden">' +
    '<div class="si-card"><h4>🔭 ¿Para qué sirve?</h4><p>No es un diagnóstico: es un <b>espejo</b>. Anotas 1 minuto al día (o cuando te acuerdes) y cada luna miras: ¿duermo menos en creciente? ¿mi energía cae siempre la misma semana? Ver el patrón ayuda a ajustar horarios, no a exigirse más.</p></div>' +
    '<div class="si-card"><h4>✅ Cómo anotar sin obsesionarte</h4><p>1) Elige <b>1 hora fija</b> (ej: al desayuno). 2) Marca números <b>sin pensarlo mucho</b>: primera intuición vale. 3) Horas de sueño aproximadas bastan (no cronómetro). 4) Si un día no anotaste, <b>no rellenes de memoria</b>: déjalo vacío. 5) Relee solo en <b>🌙 Por lunas</b>, 1 vez por luna.</p></div>' +
    '<div class="si-card"><h4>📖 Cómo leer tus lunas</h4><p>Cada tarjeta Luna muestra <b>promedios</b> de tus anotaciones (sueño, energía, ánimo + nº de días). Con <b>3+ días por luna</b> ya se ve tendencia. Compara lunas, no días sueltos: un mal día no es un mal patrón. Si algo te preocupa 2+ lunas (insomnio, cansancio que no cede, ánimo bajo), pide hora en tu <b>CESFAM</b>: es gratis y es lo seguro.</p></div>' +
    '<div class="si-card"><h4>⚠️ Sin promesas</h4><p>Esto no mide calidad médica del sueño ni reemplaza controles. Si roncas fuerte con pausas, te duermes de día, o el cansancio te impide tu vida: consulta. Ante ideas de daño: <b>*4141</b> (24 h).</p></div>' +
    '<div class="si-card"><h4>🔒 Privado</h4><p>Queda <b>solo en tu dispositivo y usuario</b>, 100% offline. Tus días con registro llevan <b>💤 en el calendario</b>. Puedes exportar/borrar solo esta bitácora en 📓 Bitácoras.</p></div>' +
    '</div>';
  makeDialog('energiaDialog', '⚡ Energía y Descanso — tu patrón por lunas',
    'Anotaciones <b>opcionales</b> de sueño, ánimo y energía. Míralas por <b>luna</b>, no por día. <b>Privado y local</b>, 100% offline.',
    body);
}
function enSwitch(t) {
  ['Hoy', 'Anotar', 'Lunas', 'Guia'].forEach(function (x) {
    var p = $('en' + x), b = $('tabEn' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function barra(v, max, color) {
  var pc = Math.max(0, Math.min(100, (v / max) * 100));
  return '<div class="su-41190d" title="' + esc(String(v)) + '">' +
    '<div style="width:' + pc.toFixed(0) + '%;height:100%;background:' + color + '"></div></div>';
}
function enRender() {
  var hoyBox = $('enHoy'); if (!hoyBox) return;
  var regs = enStore().regs;
  var hoy = todayKey();
  var miHoy = null;
  regs.forEach(function (r) { if (r.fecha === hoy) miHoy = r; });
  var ult7 = regs.filter(function (r) {
    try {
      var ms = Date.UTC(+r.fecha.slice(0, 4), +r.fecha.slice(5, 7) - 1, +r.fecha.slice(8, 10));
      return (Date.now() - ms) < 8 * 864e5 && (Date.now() - ms) >= -864e5;
    } catch (e) { return false; }
  });
  var pS = ult7.length ? prom(ult7.map(function (r) { return +r.sueno || 0; })) : 0;
  var pE = ult7.length ? prom(ult7.map(function (r) { return +r.energia || 0; })) : 0;
  var pA = ult7.length ? prom(ult7.map(function (r) { return +r.animo || 0; })) : 0;
  hoyBox.innerHTML =
    '<div class="menstrual-card su-68a1a9"><h4>⚡ Hoy · ' + esc(hoy + ' · ' + fmtFecha(hoy)) + '</h4>' +
    (miHoy
      ? '<p class="su-616df7">😴 ' + esc(String(miHoy.sueno)) + ' h · calidad ' + cara(miHoy.calidad) + ' ' + esc(String(miHoy.calidad)) +
        ' · ⚡ ' + cara(miHoy.energia) + ' ' + esc(String(miHoy.energia)) +
        ' · 💚 ' + cara(miHoy.animo) + ' ' + esc(String(miHoy.animo)) + '</p>' +
        (miHoy.nota ? '<p class="muted">«' + esc(miHoy.nota) + '»</p>' : '')
      : '<p class="su-616df7">Sin anotación hoy. Opcional: 1 minuto y listo.</p>') +
    '<p class="muted su-11a508">Últimos 7 días: ' + ult7.length + ' anotado(s)' +
    (ult7.length ? ' · 😴 ' + pS.toFixed(1) + ' h · ⚡ ' + pE.toFixed(1) + ' · 💚 ' + pA.toFixed(1) : '') +
    ' · total ' + regs.length + '</p></div>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="enGoA" class="btn su-30e741">✏️ Anotar hoy</button>' +
    '<button type="button" id="enGoL" class="btn su-30e741">🌙 Ver mis lunas</button></div>';
  var ga = $('enGoA'); if (ga) ga.onclick = function () { enSwitch('Anotar'); };
  var gl = $('enGoL'); if (gl) gl.onclick = function () { enSwitch('Lunas'); enRenderLunas(); };

  /* ---- lista ---- */
  var lb = $('enList');
  if (lb) {
    var q = (($('enQ') || {}).value || '').toLowerCase();
    var arr = regsOrdenados().reverse().filter(function (r) {
      if (!q) return true;
      return String(r.fecha + ' ' + (r.nota || '')).toLowerCase().indexOf(q) >= 0;
    }).slice(0, 80);
    lb.innerHTML = arr.length ? arr.map(function (r) {
      var l = lunaDeFecha(r.fecha);
      return '<div class="hora-item"><span class="su-6cb285">💤 <b>' + esc(r.fecha) + '</b> <span class="muted">· ' + esc(fmtFecha(r.fecha)) + (l ? ' · Luna ' + l.luna + ' día ' + l.dia : '') + '</span>' +
        '<br><span class="muted su-0d5be0">😴 ' + esc(String(r.sueno)) + ' h · cal ' + cara(r.calidad) + ' ' + esc(String(r.calidad)) +
        ' · ⚡ ' + cara(r.energia) + ' ' + esc(String(r.energia)) +
        ' · 💚 ' + cara(r.animo) + ' ' + esc(String(r.animo)) +
        (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span>' +
        '<button type="button" class="btn btn-icon en-del" data-k="' + esc(r.id) + '">✕</button></div>';
    }).join('') : '<p class="muted su-e201a8">Sin anotaciones' + (regs.length ? ' para este filtro.' : '. Anota la de hoy arriba: hasta «dormí 6 h» cuenta.') + '</p>';
    lb.querySelectorAll('.en-del').forEach(function (x) {
      x.onclick = function () {
        if (!confirm('¿Borrar anotación?')) return;
        var s = enStore();
        s.regs = s.regs.filter(function (r) { return r.id !== x.dataset.k; });
        save(); enRender(); refrescarCal();
      };
    });
    var st = $('enStats');
    if (st) st.textContent = regs.length ? (regs.length + ' anotación(es) · primera ' + regsOrdenados()[0].fecha) : '';
  }
  var ff = $('enFecha'); if (ff && !ff.value) ff.value = hoy;
  enRenderLunas();
}
function enRenderLunas() {
  var box = $('enLunas'); if (!box) return;
  var regs = regsOrdenados();
  if (!regs.length) {
    box.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>🌙 Tus lunas</h4><p class="muted su-6cb285">Sin datos aún. Anota 3+ días y vuelve: aquí verás tu promedio por luna.</p></div>';
    return;
  }
  /* Agrupa por Luna (1-13). La etiqueta de ciclo se ignora a propósito:
     el patrón personal se ve comparando Lunas, no años. */
  var porLuna = {};
  regs.forEach(function (r) {
    var l = lunaDeFecha(r.fecha);
    var k = l ? String(l.luna) : '?';
    if (!porLuna[k]) porLuna[k] = [];
    porLuna[k].push(r);
  });
  var keys = Object.keys(porLuna).sort(function (a, b) {
    if (a === '?') return 1; if (b === '?') return -1; return (+a) - (+b);
  });
  var cards = keys.map(function (k) {
    var arr = porLuna[k];
    var s = prom(arr.map(function (r) { return +r.sueno || 0; }));
    var e = prom(arr.map(function (r) { return +r.energia || 0; }));
    var a = prom(arr.map(function (r) { return +r.animo || 0; }));
    var c = prom(arr.map(function (r) { return +r.calidad || 0; }));
    var etiqueta = (k === '?') ? 'Fuera de ciclo visible' : ('Luna ' + k);
    var consejo = '';
    if (s && s < 6) consejo = '😴 Duermes poco esta luna (<6 h prom). ¿hora fija + sin pantalla 30 min antes?';
    else if (e && e < 2.6) consejo = '⚡ Energía baja esta luna. ¿siesta 20 min + caminata + luz de mañana?';
    else if (a && a < 2.6) consejo = '💚 Ánimo bajo esta luna. ¿1 salida + 1 persona + pedir hora si lleva 2+ lunas?';
    else consejo = '🌿 Equilibrio relativo. Sostén lo que te funcionó.';
    return '<div class="si-card"><h4>🌙 ' + esc(etiqueta) + ' · ' + arr.length + ' día(s)</h4>' +
      '<p class="su-6cb285">😴 ' + s.toFixed(1) + ' h prom · cal ' + c.toFixed(1) + ' · ⚡ ' + e.toFixed(1) + ' · 💚 ' + a.toFixed(1) + '</p>' +
      '<p class="muted">😴 sueño</p>' + barra(s, 10, '#8fd6ff') +
      '<p class="muted">⚡ energía</p>' + barra(e, 5, '#ffd98a') +
      '<p class="muted">💚 ánimo</p>' + barra(a, 5, '#a9d18e') +
      '<p class="su-11a508">' + esc(consejo) + '</p></div>';
  }).join('');
  /* Últimos 28 días: racha visual simple */
  var ult28 = regs.filter(function (r) {
    try {
      var ms = Date.UTC(+r.fecha.slice(0, 4), +r.fecha.slice(5, 7) - 1, +r.fecha.slice(8, 10));
      var d = Date.now() - ms;
      return d >= -864e5 && d < 29 * 864e5;
    } catch (e) { return false; }
  });
  var tira = ult28.length
    ? '<div class="menstrual-card"><h4>📅 Últimos 28 días (' + ult28.length + ')</h4><p class="muted su-11a508">Cada bloque = 1 día (altura = energía 1–5 · color = ánimo).</p>' +
      '<div class="su-443263">' +
      ult28.map(function (r) {
        var h = 8 + (+r.energia || 3) * 7;
        var col = (+r.animo || 3) >= 4 ? '#a9d18e' : ((+r.animo || 3) <= 2 ? '#e76e8a' : '#ffd98a');
        return '<span title="' + esc(r.fecha + ' · ⚡' + r.energia + ' · 💚' + r.animo + ' · 😴' + r.sueno + 'h') + '" style="width:10px;height:' + h + 'px;background:' + col + ';border-radius:3px;display:inline-block"></span>';
      }).join('') + '</div></div>'
    : '';
  box.innerHTML = tira + cards +
    '<p class="muted su-11a508">Compara lunas, no días sueltos. Un mal día no es un mal patrón.</p>';
}

/* ==================== BOTÓN + SETUP ==================== */
function setup() {
  try {
    var g = document.querySelector('.action-group[data-group="cuerpo"] .group-btns');
    if (g && !$('btnEnergia')) {
      var btn = document.createElement('button');
      btn.id = 'btnEnergia'; btn.className = 'btn'; btn.type = 'button';
      btn.textContent = '⚡ Energía y descanso';
      try { btn.setAttribute('data-sub', 'cuidado'); } catch (eS) {}
      btn.setAttribute('data-keywords', 'energia descanso sueno dormir horas calidad animo luna patrones cuidado salud registrar noche insomnio cansancio');
      var ref = g.querySelector('#btnRituales') || g.querySelector('#btnPelo');
      if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
      else g.appendChild(btn);
    } else if ($('btnEnergia')) {
      try { $('btnEnergia').setAttribute('data-sub', 'cuidado'); } catch (eS2) {}
    }
  } catch (e) {}
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnEnergia') < 0) ALL_BTNS.push('btnEnergia'); } catch (e2) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnEnergia = ['cuerpo', 'cuidado']; } catch (e3) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['cuerpo|cuidado'] && BTN_ORDER['cuerpo|cuidado'].indexOf('btnEnergia') < 0) {
      BTN_ORDER['cuerpo|cuidado'].push('btnEnergia');
    }
  } catch (e4) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnEnergia = true; });
    }
  } catch (e5) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnEnergia"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Cuerpo') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnEnergia"> ⚡ Energía y descanso';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnEnergia !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnEnergia = lab.querySelector('input').checked;
                  if (typeof scheduleSave === 'function') scheduleSave();
                  if (typeof applyVisibility === 'function') applyVisibility();
                }
              } catch (e6) {}
            };
          } catch (e7) {}
        }
      });
    }
  } catch (e8) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e9) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e10) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e11) {}

  enBuild();
  enRender();

  var b = $('btnEnergia');
  if (b) b.onclick = function () { enRender(); enSwitch('Hoy'); openDlg('energiaDialog'); };
  ['Hoy', 'Anotar', 'Lunas', 'Guia'].forEach(function (t) {
    var tb = $('tabEn' + t); if (tb) tb.onclick = function () { enSwitch(t); if (t === 'Lunas') enRenderLunas(); };
  });
  var qq = $('enQ'); if (qq) qq.oninput = enRender;

  var ad = $('enAdd');
  if (ad) ad.onclick = function () {
    var fecha = ($('enFecha') || {}).value || todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return alert('Fecha inválida');
    var s = enStore();
    var reg = {
      id: uid('en'),
      fecha: fecha,
      sueno: num(($('enSueno') || {}).value, 0, 14, 7),
      calidad: Math.round(num(($('enCalidad') || {}).value, 1, 5, 3)),
      energia: Math.round(num(($('enEnergia') || {}).value, 1, 5, 3)),
      animo: Math.round(num(($('enAnimo') || {}).value, 1, 5, 3)),
      nota: clean((($('enNota') || {}).value || '').trim(), 120)
    };
    var idx = -1;
    s.regs.forEach(function (r, i) { if (r.fecha === fecha) idx = i; });
    if (idx >= 0) { reg.id = s.regs[idx].id; s.regs[idx] = reg; }
    else s.regs.push(reg);
    save(idx >= 0 ? 'Anotación actualizada 💤' : 'Anotación guardada 💤');
    if ($('enNota')) $('enNota').value = '';
    enRender(); refrescarCal();
  };
  var sh = $('enShare');
  if (sh) sh.onclick = async function () {
    var d = regsOrdenados();
    if (!d.length) return alert('Sin anotaciones aún');
    var t = '⚡ Mi energía y descanso (por fecha)\n' + d.map(function (r) {
      return '• ' + r.fecha + ' · 😴' + r.sueno + 'h cal' + r.calidad + ' · ⚡' + r.energia + ' · 💚' + r.animo + (r.nota ? ' — ' + r.nota : '');
    }).join('\n');
    await share('Energía y descanso', t);
  };
  var cl = $('enClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar TODAS tus anotaciones de energía y descanso?')) return;
    try { var u = userData(); if (u && u.energiaDescanso) u.energiaDescanso.regs = []; } catch (e12) {}
    save(); enRender(); refrescarCal();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

try { window.cal13energiaDescanso = { store: enStore, regsOrdenados: regsOrdenados }; } catch (e) {}

})();
