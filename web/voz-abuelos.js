/* ============================================================
   LA VOZ DE LOS ABUELOS — Calendario 13 Lunas (Penco · Bio-Bio)
   Seccion completa en Mente & Estudio (btnVozAbuelos -> vozDialog).
   Antes vivia como panel dentro de 📖 Cuentos; ahora es dialogo
   propio con pestanas: Voces · Desbloqueo lunar · Saberes.
   - Misma clave de datos ('vozAbuelos'): sin perdida de lo ya
     grabado. Todo queda local y privado por usuario.
   - Grabador de audio (MediaRecorder, tope ~3 min / 4 MB total),
     texto/transcripcion, desbloqueo por luna (1-13), buscador,
     filtros por tipo, Voz del dia, exportar/compartir.
   Conecta con 📖 Cuentos/Epew, 🌳 Arbol Genealogico y 🕊️ Duelo.
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
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function lunaTxt(key) {
  try { if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + '·d' + r.diaN; } } catch (e) {}
  return '';
}
function share(title, text) {
  try {
    if (navigator.share) { navigator.share({ title: title, text: text }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(title + '\n' + text).then(function () { save('Compartido ✓'); });
  } catch (e) {}
}
function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CL'; u.rate = 0.95;
    speechSynthesis.speak(u);
  } catch (e) {}
}
function addKw(id, extra) {
  try {
    var el = $(id);
    if (el && el.dataset && el.dataset.keywords && el.dataset.keywords.indexOf(extra.split(' ')[0]) < 0) el.dataset.keywords += ' ' + extra;
  } catch (e) {}
}

/* ---------------- datos (clave historica: vozAbuelos) ---------------- */
var VOZ_TIPOS = ['🍲 Receta familiar', '🏔️ Historia del territorio', '💡 Consejo de vida', '📖 Cuento para desbloquear'];
function tipoIcon(t) {
  var icons = { '🍲 Receta familiar': '🍲', '🏔️ Historia del territorio': '🏔️', '💡 Consejo de vida': '💡', '📖 Cuento para desbloquear': '📖' };
  return icons[t] || '🎙️';
}
function getVoz() { var a = store('vozAbuelos', []); return Array.isArray(a) ? a : []; }
function vozBytes() { var n = 0; getVoz().forEach(function (r) { n += (r.dataUrl || '').length; }); return n; }
function lunaActual() {
  try { if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(todayKey()); if (m) return m.luna; } } catch (e) {}
  return 1;
}
function vozDesbloqueada(r, lunaHoy) { return (+r.desbloqueo || 1) <= (lunaHoy == null ? lunaActual() : lunaHoy); }
/* Voz del dia: determinista por fecha, solo entre desbloqueadas con contenido */
function vozDelDia(list, fechaKey) {
  var desbloq = list.filter(function (r) { return vozDesbloqueada(r); });
  if (!desbloq.length) return null;
  var n = 0; var k = String(fechaKey || todayKey());
  for (var i = 0; i < k.length; i++) n = (n * 31 + k.charCodeAt(i)) % 100000;
  return desbloq[n % desbloq.length];
}

/* ---------------- estado UI ---------------- */
var vozTab = 'voces';
var vozEditId = null;
var vozRec = null, vozChunks = [], vozStart = 0, vozTimerInt = null;

function switchVozTab(t) {
  vozTab = t;
  var map = { voces: 'tabVozVoces', desbloqueo: 'tabVozLunas', saberes: 'tabVozSaberes' };
  Object.keys(map).forEach(function (k) { var el = $(map[k]); if (el) el.classList.toggle('btn-accent', k === t); });
  ['vozVocesPanel', 'vozLunasPanel', 'vozSaberesPanel'].forEach(function (id) { var el = $(id); if (el) el.classList.add('hidden'); });
  var show = $(t === 'voces' ? 'vozVocesPanel' : t === 'desbloqueo' ? 'vozLunasPanel' : 'vozSaberesPanel');
  if (show) show.classList.remove('hidden');
  renderVoz();
}

function vozCardHTML(r, lunaHoy) {
  var disp = vozDesbloqueada(r, lunaHoy);
  var html = '<div class="habit-item"' + (disp ? ' style="border-color:var(--gold)"' : '') + '>';
  html += '<b>' + esc(r.icon || '🎙️') + ' ' + esc(r.titulo) + '</b> <span class="chip" style="font-size:10px">' + esc(r.tipo) + '</span> ';
  html += '<span class="chip" style="font-size:10px">' + (disp ? '🌕 desbloqueado (Luna ' + r.desbloqueo + ')' : '🔒 se desbloquea Luna ' + r.desbloqueo) + '</span><br>';
  html += '<span class="muted" style="font-size:11px">🎙️ ' + esc(r.quien || 'abuelo/a') + ' · ' + r.fecha + (r.fecha ? ' · ' + esc(lunaTxt(r.fecha)) : '') + (r.dur ? ' · ' + r.dur + 's' : '') + '</span>';
  if (r.dataUrl) html += '<br><audio controls preload="none" src="' + r.dataUrl + '" style="width:100%;margin-top:6px"></audio>';
  if (r.texto) html += '<p style="font-size:12px;white-space:pre-wrap">' + esc(r.texto) + '</p>';
  html += '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">';
  if (r.texto) html += '<button class="btn" style="width:auto;font-size:11px" data-voz-hear="' + r.id + '">🔊 Escuchar texto</button>';
  html += '<button class="btn" style="width:auto;font-size:11px" data-voz-share="' + r.id + '">📤 Compartir texto</button>';
  html += '<button class="btn" style="width:auto;font-size:11px" data-voz-edit="' + r.id + '">✏️ Editar</button>';
  html += '<button class="btn" style="width:auto;font-size:11px;color:#e76e8a" data-voz-del="' + r.id + '">✕ Borrar</button></div></div>';
  return html;
}
function bindVozCards(scope) {
  if (!scope) return;
  scope.querySelectorAll('[data-voz-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta voz? Se pierde el audio y el texto.')) return;
      var dd = getVoz(); var i = dd.findIndex(function (x) { return x.id === b.getAttribute('data-voz-del'); });
      if (i >= 0) dd.splice(i, 1);
      save('Voz borrada'); renderVoz();
    };
  });
  scope.querySelectorAll('[data-voz-share]').forEach(function (b) {
    b.onclick = function () {
      var r = getVoz().find(function (x) { return x.id === b.getAttribute('data-voz-share'); });
      if (r) share('🗣️ ' + r.titulo + ' (' + (r.quien || 'voz de la familia') + ')', (r.texto || '(solo audio, privado en el dispositivo)') + '\n— ' + r.tipo + ' · ' + (r.quien || ''));
    };
  });
  scope.querySelectorAll('[data-voz-hear]').forEach(function (b) {
    b.onclick = function () {
      var r = getVoz().find(function (x) { return x.id === b.getAttribute('data-voz-hear'); });
      if (r) speak(r.titulo + '. ' + (r.texto || ''));
    };
  });
  scope.querySelectorAll('[data-voz-edit]').forEach(function (b) {
    b.onclick = function () {
      var r = getVoz().find(function (x) { return x.id === b.getAttribute('data-voz-edit'); });
      if (!r) return;
      vozEditId = r.id;
      $('vozTitulo').value = r.titulo || ''; $('vozQuien').value = r.quien || '';
      $('vozTipo').value = r.tipo || VOZ_TIPOS[0]; $('vozLuna').value = String(r.desbloqueo || 1);
      $('vozTexto').value = r.texto || '';
      $('vozAddText').textContent = '↻ Actualizar';
      $('vozCancelEdit').classList.remove('hidden');
      switchVozTab('voces');
      $('vozTitulo').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  });
}

/* ---------------- render ---------------- */
function renderVoz() {
  if (!$('vozDialog')) return;
  var lunaHoy = lunaActual();
  var todas = getVoz().slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  /* cabecera: voz del dia */
  var diaBox = $('vozDiaBox');
  if (diaBox) {
    var vd = vozDelDia(todas);
    diaBox.innerHTML = vd
      ? '<div style="display:flex;gap:10px;align-items:center"><span style="font-size:30px">' + esc(vd.icon || '🎙️') + '</span><span><b>Voz de hoy · ' + esc(vd.titulo) + '</b><br><span class="muted" style="font-size:11px">' + esc(vd.quien || 'abuelo/a') + ' · ' + esc(vd.tipo) + '</span>' + (vd.texto ? '<br><span style="font-size:12px">«' + esc(vd.texto.slice(0, 140)) + (vd.texto.length > 140 ? '…' : '') + '»</span>' : '') + '</span></div>'
      : '<p class="muted" style="font-size:12px;margin:0">Aún no hay voces desbloqueadas. Graba la primera abajo: una receta, una historia de Penco o un consejo.</p>';
  }
  /* pestaña Voces: buscador + filtro + lista */
  var q = clean((($('vozSearch') || {}).value || '').toLowerCase(), 60);
  var ft = ($('vozFilter') || {}).value || 'todas';
  var list = $('vozList');
  if (list) {
    var fil = todas.filter(function (r) {
      if (ft !== 'todas' && r.tipo !== ft) return false;
      if (q && ((r.titulo || '') + ' ' + (r.quien || '') + ' ' + (r.texto || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    list.innerHTML = fil.length ? fil.map(function (r) { return vozCardHTML(r, lunaHoy); }).join('')
      : '<p class="muted">Sin resultados. Prueba otro filtro o graba una voz nueva.</p>';
    bindVozCards(list);
  }
  /* pestaña Desbloqueo lunar */
  var lun = $('vozLunasBox');
  if (lun) {
    var porLuna = {};
    todas.forEach(function (r) { var k = +r.desbloqueo || 1; (porLuna[k] = porLuna[k] || []).push(r); });
    var html = '<p class="muted" style="font-size:11px">Estamos en <b>Luna ' + lunaHoy + ' de 13</b>. Cada voz se desbloquea en su luna: los niños descubren un relato por luna.</p><div class="discipline-grid">';
    for (var i = 1; i <= 13; i++) {
      var rs = porLuna[i] || [];
      var abierto = i <= lunaHoy;
      html += '<div class="si-card"' + (abierto && rs.length ? ' style="border-color:var(--gold)"' : '') + '><h4 style="font-size:12px">' + (abierto ? '🌕' : '🔒') + ' Luna ' + i + ' · ' + rs.length + '</h4>';
      html += rs.length ? rs.map(function (r) { return '<p style="font-size:11px;margin:2px 0">' + esc(r.icon || '🎙️') + ' <b>' + esc(r.titulo) + '</b><br><span class="muted">' + esc(r.quien || '') + '</span></p>'; }).join('') : '<p class="muted" style="font-size:11px">Vacía' + (abierto ? ': graba algo para esta luna' : ' (se abre a su tiempo)') + '</p>';
      html += '</div>';
    }
    lun.innerHTML = html + '</div>';
  }
  /* pestaña Saberes */
  var sab = $('vozSaberesBox');
  if (sab) {
    var html2 = '';
    VOZ_TIPOS.forEach(function (t) {
      var rs = todas.filter(function (r) { return r.tipo === t; });
      html2 += '<div class="menstrual-card" style="margin-top:8px"><h4>' + esc(t) + ' · ' + rs.length + '</h4>';
      html2 += rs.length ? '<div class="habits-list" style="max-height:220px">' + rs.map(function (r) { return vozCardHTML(r, lunaHoy); }).join('') + '</div>'
        : '<p class="muted" style="font-size:11px">Nada aquí todavía.</p>';
      html2 += '</div>';
    });
    sab.innerHTML = html2;
    bindVozCards(sab);
  }
  /* stats */
  var st = $('vozStats');
  if (st) {
    var kb = Math.round(vozBytes() / 1024);
    var desbloq = todas.filter(function (r) { return vozDesbloqueada(r, lunaHoy); }).length;
    st.textContent = todas.length + ' voces · ' + desbloq + ' desbloqueadas · ~' + kb + ' KB en este dispositivo (límite sugerido 4 MB)';
  }
  var w = $('vozWarn');
  if (w) {
    var sup = (typeof MediaRecorder !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    w.innerHTML = sup ? '' : '⚠️ Este dispositivo no permite grabar audio aquí; igual puedes guardar el texto/transcripción.';
  }
}

/* ---------------- grabador ---------------- */
function paintVozTimer() {
  var s = Math.floor((Date.now() - vozStart) / 1000);
  var el = $('vozTimer');
  if (el) el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  if (s >= 180) stopVozRec();
}
function stopVozRec() {
  try { clearInterval(vozTimerInt); } catch (e) {} vozTimerInt = null;
  var rb = $('vozRec'), sb = $('vozStop');
  if (rb) rb.classList.remove('hidden'); if (sb) sb.classList.add('hidden');
  if (vozRec && vozRec.state !== 'inactive') { try { vozRec.stop(); } catch (e) {} }
}
function guardarVoz(dataUrl, dur) {
  if (dataUrl && vozBytes() + dataUrl.length > 4 * 1024 * 1024)
    return alert('Muy pesado para el almacenamiento local: prueba más corto (<60s) o guarda solo el texto.');
  if (vozEditId) {
    var dd = getVoz();
    var r = dd.find(function (x) { return x.id === vozEditId; });
    if (r) {
      r.titulo = clean($('vozTitulo').value, 60) || r.titulo;
      r.quien = clean($('vozQuien').value, 30);
      r.tipo = $('vozTipo').value; r.icon = tipoIcon(r.tipo);
      r.desbloqueo = +$('vozLuna').value || r.desbloqueo;
      r.texto = clean($('vozTexto').value, 800);
      if (dataUrl) { r.dataUrl = dataUrl; r.dur = dur; }
    }
    vozEditId = null;
    $('vozAddText').textContent = '+ Guardar solo texto';
    $('vozCancelEdit').classList.add('hidden');
    save('Voz actualizada 🗣️');
  } else {
    getVoz().push({
      id: uid('vz'), fecha: todayKey(), tipo: $('vozTipo').value,
      titulo: clean($('vozTitulo').value, 60) || 'Sin título',
      quien: clean($('vozQuien').value, 30), desbloqueo: +$('vozLuna').value || 1,
      texto: clean($('vozTexto').value, 800), dur: dur || 0,
      dataUrl: dataUrl || '', icon: tipoIcon($('vozTipo').value)
    });
    save(dataUrl ? 'Voz guardada 🗣️' : 'Guardado 🗣️');
  }
  $('vozTitulo').value = ''; $('vozTexto').value = '';
  renderVoz();
}

/* ---------------- setup ---------------- */
function setupVozDialog() {
  var dlg = $('vozDialog');
  if (!dlg) { window._vozRetry = (window._vozRetry || 0) + 1; if (window._vozRetry < 60) setTimeout(setupVozDialog, 500); return; }
  try { addKw('btnVozAbuelos', 'voz abuelos abuela abuelo sabiduria receta historia consejo grabar audio testimonio legado familia territorio cuento transmitir oral'); } catch (e) {}
  var b = $('btnVozAbuelos');
  if (b && !b.dataset.vozW) {
    b.dataset.vozW = '1';
    b.addEventListener('click', function () {
      try { switchVozTab(vozTab); } catch (e) { try { renderVoz(); } catch (e2) {} }
      try { dlg.showModal(); } catch (e3) {}
    });
  }
  var ct = $('vozCloseTop'), cb = $('vozClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { dlg.close(); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { dlg.close(); }; }
  var t1 = $('tabVozVoces'), t2 = $('tabVozLunas'), t3 = $('tabVozSaberes');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchVozTab('voces'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchVozTab('desbloqueo'); }; }
  if (t3 && !t3.dataset.w) { t3.dataset.w = '1'; t3.onclick = function () { switchVozTab('saberes'); }; }
  var sf = $('vozSearch'), ff = $('vozFilter');
  if (sf && !sf.dataset.w) { sf.dataset.w = '1'; sf.addEventListener('input', renderVoz); }
  if (ff && !ff.dataset.w) { ff.dataset.w = '1'; ff.onchange = renderVoz; }
  try { if ($('vozLuna') && !$('vozLuna').value) $('vozLuna').value = String(lunaActual()); } catch (e) {}
  /* grabador */
  var rb = $('vozRec');
  if (rb && !rb.dataset.w) {
    rb.dataset.w = '1';
    rb.onclick = function () {
      if (!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
        return alert('Grabación no disponible en este dispositivo; guarda el texto.');
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        vozChunks = [];
        var mime = ''; try { if (MediaRecorder.isTypeSupported('audio/webm')) mime = 'audio/webm'; } catch (e) {}
        vozRec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        vozRec.ondataavailable = function (e) { if (e.data && e.data.size) vozChunks.push(e.data); };
        vozRec.onstop = function () {
          try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
          var dur = Math.floor((Date.now() - vozStart) / 1000);
          var blob = new Blob(vozChunks, { type: (vozRec && vozRec.mimeType) || 'audio/webm' });
          var rd = new FileReader();
          rd.onload = function () { guardarVoz(String(rd.result || ''), dur); };
          rd.readAsDataURL(blob);
        };
        vozRec.start(); vozStart = Date.now();
        $('vozRec').classList.add('hidden'); $('vozStop').classList.remove('hidden');
        vozTimerInt = setInterval(paintVozTimer, 500); paintVozTimer();
      }).catch(function () { alert('Sin permiso de micrófono. Revisa el permiso del sistema.'); });
    };
  }
  var sb = $('vozStop');
  if (sb && !sb.dataset.w) { sb.dataset.w = '1'; sb.onclick = stopVozRec; }
  if (!dlg.dataset.vozCloseW) {
    dlg.dataset.vozCloseW = '1';
    dlg.addEventListener('close', function () {
      try { if (vozRec && vozRec.state && vozRec.state !== 'inactive') { try { vozRec.stop(); } catch (e) {} } } catch (e) {}
      try { clearInterval(vozTimerInt); } catch (e) {} vozTimerInt = null;
      var r1 = $('vozRec'), s1 = $('vozStop');
      if (r1) r1.classList.remove('hidden'); if (s1) s1.classList.add('hidden');
    });
  }
  var at = $('vozAddText');
  if (at && !at.dataset.w) {
    at.dataset.w = '1';
    at.onclick = function () {
      if (!vozEditId && !clean($('vozTitulo').value, 60)) return alert('Ponle título a la voz');
      guardarVoz('', 0);
    };
  }
  var ce = $('vozCancelEdit');
  if (ce && !ce.dataset.w) {
    ce.dataset.w = '1';
    ce.onclick = function () {
      vozEditId = null;
      $('vozTitulo').value = ''; $('vozTexto').value = '';
      $('vozAddText').textContent = '+ Guardar solo texto';
      ce.classList.add('hidden');
    };
  }
  /* puentes con secciones hermanas */
  var g1 = $('vozGoCuentos');
  if (g1 && !g1.dataset.w) { g1.dataset.w = '1'; g1.onclick = function () { try { dlg.close(); } catch (e) {} setTimeout(function () { try { $('btnTales').click(); } catch (e2) {} }, 150); }; }
  var g2 = $('vozGoArbol');
  if (g2 && !g2.dataset.w) { g2.dataset.w = '1'; g2.onclick = function () { try { dlg.close(); } catch (e) {} setTimeout(function () { try { $('btnArbolFull').click(); } catch (e2) {} }, 150); }; }
  /* exportar / borrar todo */
  var ex = $('vozExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getVoz();
      if (!d.length) return alert('Aún no hay voces que exportar');
      var txt = d.map(function (r) { return '🗣️ ' + r.titulo + ' (' + (r.quien || '') + ') [' + r.tipo + ' · Luna ' + r.desbloqueo + ']\n' + (r.texto || '(solo audio)') ; }).join('\n\n');
      share('🗣️ La Voz de los Abuelos — mis saberes', txt);
    };
  }
  var cl = $('vozClear');
  if (cl && !cl.dataset.w) {
    cl.dataset.w = '1';
    cl.onclick = function () {
      if (!getVoz().length) return;
      if (!confirm('¿Borrar TODAS las voces? No se puede deshacer.')) return;
      try { var u = (typeof userData === 'function') ? userData() : null; if (u) u.vozAbuelos = []; } catch (e) {}
      save('Voces borradas'); renderVoz();
    };
  }
  try { renderVoz(); } catch (e) {}
}

window.VozAbuelos = { render: renderVoz, list: getVoz, delDia: vozDelDia, tipos: VOZ_TIPOS };
setTimeout(setupVozDialog, 600);

})();
