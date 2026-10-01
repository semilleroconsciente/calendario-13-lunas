/* ============================================================
   GUARDIANES DEL TERRITORIO — Calendario 13 Lunas (Penco · Bío-Bío)
   Apartado: Territorio > Penco (btnActores -> actoresDialog)
   - Directorio de organizaciones que defienden activamente el
     territorio (base verificable 2021-2026 en
     data/territorios/penco/actores.json vía window.Territorio).
     Fallback embebido abajo para modo offline/file://.
   - Filtros por frente (minería, GNL, humedal, bahía...) + buscador.
    - ⭐ Sigo / 📌 Llevar al calendario / 📤 Compartir por ficha.
    - ➕ Mis guardianes: agrega tus propias orgs/colectivos/juntas
     (privado y local por usuario: userData().actores {mios:[], siguiendo:{}}).
   100% offline. Sin dependencias externas. Verifica vigencia en
   terreno: las orgs cambian, se articulan y renacen.
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
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado ✓'); } catch (e) {} }
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text, null);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}

/* ---------- BASE EMBEBIDA (fallback Penco, verificable 2021-2026) ---------- */
var ACTORES_FALLBACK = [
  { id: 'konintu-lafkenmapu', nombre: 'Asociación Indígena Koñintu Lafken Mapu (Penco)', tipo: 'Comunidad indígena', frentes: ['GNL', 'lafken', 'consulta indígena'], lucha: 'Exigió consulta indígena extraordinaria (Convenio 169 OIT) ante modificaciones del GNL Penco-Lirquén. Defensa del lafken y la bahía.', sumarse: 'Acompañar con respeto al protocolo comunitario; no suplantar vocerías.', redes: [{ label: 'Instagram', url: 'https://www.instagram.com/konintu.lafkenmapu/' }], fuente: 'Resumen.cl 2021', fuenteUrl: 'https://resumen.cl/articulos/comunidades-logran-elevar-sus-reclamos-contra-proyecto-terminal-gnl-penco-lirquen' },
  { id: 'parque-para-penco', nombre: 'Corporación Parque para Penco', tipo: 'Corporación / parque urbano', frentes: ['bosque nativo', 'queule', 'patrimonio ancestral', 'agua'], lucha: 'Impulsa el primer parque urbano de Penco en Fundo Coihueco (sendero Los Queules): protege queule, naranjillo y pitao, más pudú, güiña y monito del monte. Rescata sitio ancestral mapuche de ceremonias. Primera etapa inaugurada 2025; buscan zona protegida en el Plan Regulador.', sumarse: 'Voluntariados, caminatas, talleres de formación ambiental; cuidar senderos (acceso gratuito).', redes: [{ label: 'Instagram', url: 'https://www.instagram.com/parqueparapenco' }, { label: 'Facebook', url: 'https://www.facebook.com/ParqueParaPenco' }], fuente: 'Radio UdeC 2025', fuenteUrl: 'https://www.radioudec.cl/penco-inaugura-la-primera-etapa-de-su-primer-parque-urbano-con-acceso-gratuito-a-la-comunidad' },
  { id: 'corredor-biocultural-tome-lirquen', nombre: 'Corredor Biocultural Lirquén - Tomé', tipo: 'Corredor biocultural', frentes: ['corredor biocultural', 'bosque nativo', 'bahía'], lucha: 'Articulación territorial entre Tomé y Lirquén por la continuidad ecológica y cultural del borde costero (quebradas, bosque y bahía).', sumarse: 'Sigue su Instagram, participa en recorridos y jornadas.', redes: [{ label: 'Instagram', url: 'https://www.instagram.com/corredor_biocultural/' }], fuente: 'Instagram del colectivo', fuenteUrl: 'https://www.instagram.com/corredor_biocultural/' },
  { id: 'keule-resiste', nombre: 'Keule Resiste', tipo: 'Colectivo', frentes: ['queule', 'bosque nativo', 'minería tierras raras'], lucha: 'Defensa del keule (Gomortega keule, Monumento Natural en peligro) y del bosque nativo frente a la presión minera y forestal en Penco y alrededores.', sumarse: 'Sigue su Instagram, difunde, participa en acciones por el bosque.', redes: [{ label: 'Instagram', url: 'https://www.instagram.com/keuleresiste/' }], fuente: 'Instagram del colectivo', fuenteUrl: 'https://www.instagram.com/keuleresiste/' },
  { id: 'penco-lirquen-libre-mineras', nombre: 'Campaña Penco-Lirquén Libre de Mineras', tipo: 'Campaña / articulación', frentes: ['minería tierras raras', 'agua', 'bosque'], lucha: 'Articula orgs, gastronomía, turismo, JJVV y campesinado contra el proyecto de tierras raras de Aclara Resources (ex Biolantánidos). Impulsó consulta ciudadana 2022 (~99% rechazo) y marcha Penco→Lirquén.', sumarse: 'Marchas, difusión, apoyo a comercio local, seguimiento SEA y Tribunal Ambiental.', redes: [{ label: 'Instagram', url: 'https://www.instagram.com/pencosinminera' }], fuente: 'OLCA / Radio U. de Chile 2026', fuenteUrl: 'https://olca.cl/articulo/nota.php?id=111582' },
  { id: 'ong-defensa-ambiental', nombre: 'ONG Defensa Ambiental / Red de Humedales del Biobío', tipo: 'ONG / red', frentes: ['humedal Rocuant-Andalién', 'rellenos', 'monitoreo'], lucha: 'Denuncia rellenos, desecación y escombreras en Rocuant-Andalién; monitoreo y educación ambiental. Parte del Comité Técnico Local GEF Humedales.', sumarse: 'Monitoreos ciudadanos, limpiezas, denuncia con foto+fecha ante SMA.', redes: [{ label: 'Facebook ONG', url: 'https://www.facebook.com/ONGDefensaAmbiental' }, { label: 'Instagram Red Humedales', url: 'https://www.instagram.com/redhumedalesbiobio' }], fuente: 'Ladera Sur', fuenteUrl: 'https://laderasur.com/articulo/la-cruzada-para-recuperar-al-humedal-rocuant-andalien-el-guardian-de-la-bahia-de-concepcion-que-es-asfixiado-por-la-ciudad' },
  { id: 'fundacion-bandada', nombre: 'Fundación Bandada', tipo: 'Fundación', frentes: ['humedal Rocuant-Andalién', 'aves', 'litigio'], lucha: 'Defensa del humedal urbano Rocuant-Andalién (1.377 ha, 2026) ante 8 reclamaciones en Tribunal Ambiental. Llama a academia y ciudadanía a defender la protección.', sumarse: 'Voluntariado de monitoreo, firma y apoyo técnico-legal.', redes: [{ label: 'Instagram', url: 'https://www.instagram.com/fundacionbandada' }], fuente: 'TVU / MMA 2026', fuenteUrl: 'https://www.tvu.cl/prensa/2026/05/01/fundacion-bandada-critica-rol-de-actores-publicos-en-impugnaciones-a-humedal-urbano-rocuant-andalien.html' },
  { id: 'olca', nombre: 'OLCA — Observatorio Latinoamericano de Conflictos Ambientales', tipo: 'Acompañamiento técnico', frentes: ['acompañamiento', 'legal', 'formación'], lucha: 'Acompaña a comunidades del Biobío en conflictos GNL y tierras raras: documentación, vocerías y estrategia legal.', sumarse: 'Escuela de formación, documentación del conflicto.', redes: [{ label: 'Instagram', url: 'https://www.instagram.com/olca_chile/' }, { label: 'Facebook', url: 'https://www.facebook.com/olca.chile' }, { label: 'Sitio', url: 'https://olca.cl' }], fuente: 'OLCA', fuenteUrl: 'https://olca.cl/articulo/nota.php?id=111577' }
];
var ACTORES_NOTA = 'Base inicial verificable con prensa 2021-2026. Redes verificadas 2026-09; si una ficha no trae redes es porque no se encontró canal público verificable. Verifica vigencia en terreno.';

function dynActores() {
  try {
    if (typeof Territorio !== 'undefined' && Territorio && typeof Territorio.get === 'function') {
      var v = Territorio.get('actores', null);
      if (v) {
        if (Array.isArray(v)) return { actores: v, nota: ACTORES_NOTA, actualizado: '' };
        if (Array.isArray(v.actores)) return v;
      }
    }
  } catch (e) {}
  return { actores: ACTORES_FALLBACK, nota: ACTORES_NOTA, actualizado: '' };
}

/* ---------- store privado ---------- */
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { siguiendo: {}, mios: [] };
    if (!u.actores) u.actores = { siguiendo: {}, mios: [] };
    var a = u.actores;
    if (!a.siguiendo || Array.isArray(a.siguiendo)) a.siguiendo = {};
    if (!Array.isArray(a.mios)) a.mios = [];
    return a;
  } catch (e) { return { siguiendo: {}, mios: [] }; }
}

var actTab = 'dir';
var actQuery = '';
var actFrente = 'todos';
var actEditing = null;

function frentesAll() {
  var set = {};
  dynActores().actores.forEach(function (a) { (a.frentes || []).forEach(function (f) { set[f] = 1; }); });
  try { store().mios.forEach(function (m) { (m.frentes || '').split(',').forEach(function (f) { f = f.trim(); if (f) set[f] = 1; }); }); } catch (e) {}
  return Object.keys(set).sort();
}
function matchQ(a, q) {
  if (!q) return true;
  var t = ((a.nombre || '') + ' ' + (a.tipo || '') + ' ' + ((a.frentes || []).join(' ')) + ' ' + (a.lucha || '')).toLowerCase();
  return t.indexOf(q) >= 0;
}
function matchF(a, f) {
  if (!f || f === 'todos') return true;
  return (a.frentes || []).indexOf(f) >= 0;
}

/* ---------- diálogo ---------- */
function ensureDialog() {
  var d = $('actoresDialog');
  if (d) return d;
  d = document.createElement('dialog');
  d.id = 'actoresDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🛡️ Guardianes del Territorio — Penco</h3>' +
    '<button type="button" id="actoresCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Quiénes defienden activamente el territorio: humedal, bahía, agua, bosque y economía local. Base verificable 2021–2026 — <b>verifica vigencia</b> antes de contactar. Tus agregados y ⭐ quedan <b>privados y locales</b>.</p>' +
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabActDir" class="btn btn-accent" style="width:auto">🛡️ Directorio</button>' +
    '<button type="button" id="tabActMios" class="btn" style="width:auto">⭐ Siguiendo y míos</button>' +
    '</div>' +
    '<div id="actDirPanel">' +
    '<div class="menstrual-card"><h4>🔍 Buscar y filtrar</h4>' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="actSearch" placeholder="ej: humedal, GNL, tierras raras, mujeres, pesca..." maxlength="60" autocomplete="off"></label>' +
    '<label>Frente <select id="actFrente"><option value="todos">Todos</option></select></label></div>' +
    '<p class="muted" style="font-size:11px;margin:4px 0 0" id="actCount"></p></div>' +
    '<div id="actList" style="margin-top:10px"></div>' +
    '<p class="muted" style="font-size:10px;margin-top:8px" id="actNota"></p></div>' +
    '<div id="actMiosPanel" class="hidden">' +
    '<div class="menstrual-card"><h4>➕ Agregar mi guardián (junta, colectivo, olla, brigada...)</h4>' +
    '<div class="conv-row"><label>Nombre * <input type="text" id="actMioNombre" placeholder="ej: Junta VV Ríos de Chile" maxlength="60"></label>' +
    '<label>Tipo <input type="text" id="actMioTipo" placeholder="ej: Junta / Colectivo / Brigada" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Frentes (coma) <input type="text" id="actMioFrentes" placeholder="ej: humedal, agua" maxlength="60"></label>' +
    '<label>Contacto <input type="text" id="actMioContacto" placeholder="ej: nombre + lugar de encuentro" maxlength="60"></label></div>' +
    '<label>Nota <input type="text" id="actMioNota" placeholder="qué defiende, cuándo se juntan" maxlength="120"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="actMioAdd" class="btn btn-accent" style="width:auto">+ Guardar</button>' +
    '<button type="button" id="actMioCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div id="actMiosList" style="margin-top:10px"></div></div>' +
    '<div class="dlg-actions"><button type="button" id="actoresClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}

function actorCard(a) {
  var st = store();
  var sig = !!st.siguiendo[a.id];
  var fr = (a.frentes || []).map(function (f) { return '<span class="chip" style="font-size:10px">' + esc(f) + '</span>'; }).join(' ');
  var html = '<div class="si-card" style="padding:10px 12px"><h4 style="font-size:13px">' + (sig ? '⭐ ' : '🛡️ ') + esc(a.nombre) + '</h4>' +
    '<p class="muted" style="font-size:11px;margin:2px 0">' + esc(a.tipo || '') + '</p>' +
    (fr ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0">' + fr + '</div>' : '') +
    '<p style="font-size:12px;line-height:1.55"><b>Defiende:</b> ' + esc(a.lucha || '') + '</p>' +
    (a.sumarse ? '<p class="muted" style="font-size:11px;line-height:1.5">🤝 <b>Sumarse:</b> ' + esc(a.sumarse) + '</p>' : '') +
    (a.redes && a.redes.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0">' + a.redes.map(function (r) { return '<a class="btn" style="width:auto;font-size:11px;text-decoration:none" href="' + esc(r.url) + '" target="_blank" rel="noopener">🔗 ' + esc(r.label) + '</a>'; }).join('') + '</div>' : '<p class="muted" style="font-size:10px">Sin red pública verificada — si la conoces, agrégala en ⭐ Mis guardianes.</p>') +
    (a.fuente ? '<p class="muted" style="font-size:10px">📰 ' + esc(a.fuente) + (a.fuenteUrl ? ' · <a href="' + esc(a.fuenteUrl) + '" target="_blank" rel="noopener">ver fuente</a>' : '') + '</p>' : '') +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn" style="width:auto;font-size:11px" data-act-sig="' + esc(a.id) + '">' + (sig ? '★ Siguiendo' : '☆ Sigo') + '</button>' +
    '<button type="button" class="btn" style="width:auto;font-size:11px" data-act-cal="' + esc(a.id) + '">📌 Al calendario</button>' +
    '<button type="button" class="btn" style="width:auto;font-size:11px" data-act-share="' + esc(a.id) + '">📤 Compartir</button>' +
    '</div></div>';
  return html;
}

function renderDir() {
  var box = $('actList');
  if (!box) return;
  var data = dynActores().actores || [];
  var q = (actQuery || '').toLowerCase().trim();
  var list = data.filter(function (a) { return matchQ(a, q) && matchF(a, actFrente); });
  var ct = $('actCount');
  if (ct) ct.textContent = list.length + ' / ' + data.length + ' guardianes' + (actFrente !== 'todos' ? ' · frente: ' + actFrente : '');
  if (!list.length) { box.innerHTML = '<p class="muted">Sin resultados. Prueba “humedal”, “GNL”, “mujeres”, “pesca”... o agrega el tuyo en ⭐.</p>'; }
  else box.innerHTML = list.map(actorCard).join('');
  var nt = $('actNota');
  if (nt) { var d = dynActores(); nt.textContent = (d.nota || '') + (d.actualizado ? ' · Actualizado ' + d.actualizado + '.' : ''); }
  wireCards(box);
}
function renderMios() {
  var box = $('actMiosList');
  if (!box) return;
  var st = store();
  var data = dynActores().actores || [];
  var seguidos = data.filter(function (a) { return st.siguiendo[a.id]; });
  var html = '<div class="menstrual-card"><h4>⭐ Siguiendo · ' + seguidos.length + '</h4>';
  html += seguidos.length ? seguidos.map(function (a) {
    return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(a.nombre) + '</b><br><span class="muted" style="font-size:10px">' + esc((a.frentes || []).join(' · ')) + '</span></span>' +
      '<span style="display:flex;gap:4px"><button type="button" class="btn btn-icon" data-act-cal="' + esc(a.id) + '" title="Al calendario">📌</button>' +
      '<button type="button" class="btn btn-icon" data-act-unsig="' + esc(a.id) + '" title="Dejar de seguir">✕</button></span></div>';
  }).join('') : '<p class="muted" style="font-size:11px">Aún no sigues a nadie. Marca ☆ Sigo en el Directorio.</p>';
  html += '</div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>📋 Mis guardianes agregados · ' + st.mios.length + '</h4><div id="actMiosInner">';
  html += st.mios.length ? st.mios.map(function (m) {
    return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(m.nombre) + '</b> <span class="muted">· ' + esc(m.tipo || '') + '</span><br><span class="muted" style="font-size:10px">' + esc(m.frentes || '') + (m.contacto ? ' · 📞 ' + esc(m.contacto) : '') + (m.nota ? '<br>' + esc(m.nota) : '') + '</span></span>' +
      '<span style="display:flex;gap:4px"><button type="button" class="btn btn-icon" data-mio-edit="' + esc(m.id) + '" title="Editar">✎</button>' +
      '<button type="button" class="btn btn-icon" data-mio-del="' + esc(m.id) + '" title="Borrar">✕</button></span></div>';
  }).join('') : '<p class="muted" style="font-size:11px">Agrega tu junta, colectivo u olla común arriba. Queda solo en tu dispositivo.</p>';
  html += '</div></div>';
  box.innerHTML = html;
  wireCards(box);
}
function wireCards(scope) {
  (scope || document).querySelectorAll('[data-act-sig]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-act-sig');
      var st = store();
      if (st.siguiendo[id]) delete st.siguiendo[id]; else st.siguiendo[id] = true;
      save(st.siguiendo[id] ? '⭐ Siguiendo' : 'Ya no sigues');
      renderDir(); renderMios();
    };
  });
  (scope || document).querySelectorAll('[data-act-unsig]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-act-unsig');
      var st = store(); delete st.siguiendo[id]; save(); renderDir(); renderMios();
    };
  });
  (scope || document).querySelectorAll('[data-act-cal]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-act-cal');
      var a = (dynActores().actores || []).find(function (x) { return x.id === id; });
      if (!a) return;
      var txt = '🛡️ ' + a.nombre + ' (' + (a.tipo || '') + ') — ' + (a.lucha || '');
      try {
        if (window.InfoClave && typeof window.InfoClave.abrir === 'function') window.InfoClave.abrir('Guardianes', txt, {});
        else if (typeof abrirInfoClave === 'function') abrirInfoClave('Guardianes', txt, {});
        else alert(txt);
      } catch (e) { try { alert(txt); } catch (e2) {} }
    };
  });
  (scope || document).querySelectorAll('[data-act-share]').forEach(function (b) {
    b.onclick = async function () {
      var id = b.getAttribute('data-act-share');
      var a = (dynActores().actores || []).find(function (x) { return x.id === id; });
      if (!a) return;
      var redesTxt = (a.redes || []).map(function (r) { return r.label + ': ' + r.url; }).join('\n');
      await share('🛡️ ' + a.nombre, a.nombre + ' (' + (a.tipo || '') + ')\nFrentes: ' + ((a.frentes || []).join(', ')) + '\nDefiende: ' + (a.lucha || '') + (redesTxt ? '\n' + redesTxt : '') + '\n' + (a.fuenteUrl || ''));
    };
  });
  (scope || document).querySelectorAll('[data-mio-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este guardián?')) return;
      var id = b.getAttribute('data-mio-del');
      var st = store();
      st.mios = (st.mios || []).filter(function (m) { return m.id !== id; });
      save(); renderMios();
    };
  });
  (scope || document).querySelectorAll('[data-mio-edit]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-mio-edit');
      var st = store();
      var m = (st.mios || []).find(function (x) { return x.id === id; });
      if (!m) return;
      actEditing = id;
      $('actMioNombre').value = m.nombre || ''; $('actMioTipo').value = m.tipo || '';
      $('actMioFrentes').value = m.frentes || ''; $('actMioContacto').value = m.contacto || '';
      $('actMioNota').value = m.nota || '';
      $('actMioCancel').classList.remove('hidden');
      $('actMioAdd').textContent = '↻ Actualizar';
      try { $('actMioNombre').focus(); } catch (e) {}
    };
  });
}

function switchTab(t) {
  actTab = t;
  var pd = $('actDirPanel'), pm = $('actMiosPanel');
  var bd = $('tabActDir'), bm = $('tabActMios');
  if (pd) pd.classList.toggle('hidden', t !== 'dir');
  if (pm) pm.classList.toggle('hidden', t !== 'mios');
  if (bd) bd.classList.toggle('btn-accent', t === 'dir');
  if (bm) bm.classList.toggle('btn-accent', t === 'mios');
  if (t === 'dir') renderDir(); else renderMios();
}
function fillFrentes() {
  var sel = $('actFrente');
  if (!sel) return;
  var cur = actFrente;
  sel.innerHTML = '<option value="todos">Todos</option>' + frentesAll().map(function (f) {
    return '<option value="' + esc(f) + '">' + esc(f) + '</option>';
  }).join('');
  sel.value = cur;
}

function open() {
  ensureDialog();
  wireOnce();
  fillFrentes();
  renderDir(); renderMios();
  switchTab(actTab || 'dir');
  var d = $('actoresDialog');
  try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} }
}

var _wired = false;
function wireOnce() {
  if (_wired) return; _wired = true;
  var td = $('tabActDir'), tm = $('tabActMios');
  if (td) td.onclick = function () { switchTab('dir'); };
  if (tm) tm.onclick = function () { switchTab('mios'); };
  var ct = $('actoresCloseTop'), cb = $('actoresClose');
  if (ct) ct.onclick = function () { try { $('actoresDialog').close(); } catch (e) {} };
  if (cb) cb.onclick = function () { try { $('actoresDialog').close(); } catch (e) {} };
  var q = $('actSearch');
  if (q) q.addEventListener('input', function () { actQuery = q.value; renderDir(); });
  var f = $('actFrente');
  if (f) f.onchange = function () { actFrente = f.value; renderDir(); };
  var add = $('actMioAdd');
  if (add) add.onclick = function () {
    var nom = clean((($('actMioNombre') || {}).value || '').trim(), 60);
      if (!nom) { alert('Escribe el nombre del guardián'); return; }
    var st = store();
    var obj = {
      id: actEditing || uid('am'),
      nombre: nom,
      tipo: clean((($('actMioTipo') || {}).value || '').trim(), 30),
      frentes: clean((($('actMioFrentes') || {}).value || '').trim(), 60),
      contacto: clean((($('actMioContacto') || {}).value || '').trim(), 60),
      nota: clean((($('actMioNota') || {}).value || '').trim(), 120)
    };
    if (actEditing) {
      st.mios = (st.mios || []).map(function (m) { return m.id === actEditing ? obj : m; });
      actEditing = null;
      $('actMioCancel').classList.add('hidden');
      add.textContent = '+ Guardar';
    } else st.mios.push(obj);
    save('Guardián guardado 🛡️');
    ['actMioNombre', 'actMioTipo', 'actMioFrentes', 'actMioContacto', 'actMioNota'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
    fillFrentes(); renderMios();
  };
  var cancel = $('actMioCancel');
  if (cancel) cancel.onclick = function () {
    actEditing = null; cancel.classList.add('hidden');
    $('actMioAdd').textContent = '+ Guardar';
    ['actMioNombre', 'actMioTipo', 'actMioFrentes', 'actMioContacto', 'actMioNota'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
  };
}

/* ---------- integración Territorio > Penco ---------- */
function ensureButton() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g) return false;
  var b = $('btnActores');
  if (!b) {
    b = document.createElement('button');
    b.id = 'btnActores';
    b.className = 'btn';
    b.type = 'button';
    b.setAttribute('data-sub', 'penco');
    b.setAttribute('data-keywords', 'guardianes defensores territorio defensa organizaciones asamblea coordinadora humedal gnl minera tierras raras pesca lafken mujeres ong fundacion colectivo junta campana red apoyo sumarse contacto actores');
    b.textContent = '🛡️ Guardianes';
    var ref = $('btnBomberos');
    if (ref && ref.parentNode === g) {
      if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
      else g.appendChild(b);
    } else g.appendChild(b);
  } else {
    try { b.setAttribute('data-sub', 'penco'); b.dataset.sub = 'penco'; } catch (e) {}
  }
  if (!b.dataset.actW) { b.dataset.actW = '1'; b.addEventListener('click', open); }
  return true;
}
function ensureCheckbox() {
  if (document.querySelector('[data-btn="btnActores"]')) return;
  var ref = document.querySelector('[data-btn="btnBomberos"]');
  if (ref && ref.closest) {
    var lab = document.createElement('label');
    lab.className = 'check-row';
     lab.innerHTML = '<input type="checkbox" data-btn="btnActores" checked> 🛡️ Guardianes';
    try {
      ref.closest('label').parentNode.insertBefore(lab, ref.closest('label').nextSibling);
      if (typeof applyVisibility === 'function') {
        var inp = lab.querySelector('input');
        if (inp) inp.addEventListener('change', function () { try { applyVisibility(); } catch (e) {} });
      }
    } catch (e) {}
  }
}
function register() {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnActores') < 0) ALL_BTNS.push('btnActores'); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnActores = ['territorio', 'penco']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      var k = 'territorio|penco';
      if (!BTN_ORDER[k]) BTN_ORDER[k] = ['btnComuna'];
      if (BTN_ORDER[k].indexOf('btnActores') < 0) BTN_ORDER[k].push('btnActores');
    }
  } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf('btnActores') < 0) ORDEN_TERRITORIO.push('btnActores');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (!PRESETS[p] || typeof PRESETS[p] !== 'object') return;
        if (PRESETS[p].btnComuna && PRESETS[p].btnActores === undefined) PRESETS[p].btnActores = true;
      });
    }
  } catch (e) {}
}

var _retry = 0;
function setup() {
  var okBtn = ensureButton();
  if (!okBtn || typeof userData !== 'function') {
    _retry++;
    if (_retry < 80) setTimeout(setup, 500);
    return;
  }
  ensureDialog();
  ensureCheckbox();
  register();
  wireOnce();
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

window.ActoresTerritorio = { open: open, tab: switchTab, list: function () { return dynActores(); }, store: store };
try { document.addEventListener('territorio:listo', function () { try { renderDir(); fillFrentes(); } catch (e) {} }); } catch (e) {}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(setup, 1800);

})();
