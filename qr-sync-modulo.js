/* ============================================================
   TRASPASO QR — Calendario 13 Lunas (PC <-> celular)
   Pasa TODOS los datos (igual que 💾 Respaldo) entre tus propios
   dispositivos, sin internet, sin cuentas y sin servidores:
   los datos viajan solo de pantalla a cámara.
   - Enviar: JSON -> gzip -> base64 -> N QRs (qr-codec.js + qrcode-lib.js)
   - Recibir: cámara + jsQR -> reensamblar -> misma validación de
     Restaurar (applyBackupJSON en renderer.js).
   Patrón: botón inyectado en Comunidad > App + <dialog> propio.
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
function codec() { return window.Cal13QRcodec || null; }

/* ---------- registro del botón (igual que otros módulos) ---------- */
function registerBtn() {
  var id = 'btnQRSync';
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (p && typeof p === 'object' && p.btnBackup && p[id] === undefined) p[id] = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

function injectBtn() {
  if ($('btnQRSync')) return $('btnQRSync');
  var g = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!g) return null;
  var b = document.createElement('button');
  b.id = 'btnQRSync'; b.className = 'btn'; b.type = 'button';
  b.textContent = '📲 Traspaso QR';
  b.setAttribute('data-sub', 'app');
  b.setAttribute('data-keywords', 'qr traspaso pasar datos celular telefono pc compartir sincronizar camara pantalla exportar importar respaldo backup');
  var ref = $('btnRestore');
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling); else g.appendChild(b);
  } else g.appendChild(b);
  b.onclick = openDlg;
  return b;
}

function injectConfigChk() {
  try {
    if (document.querySelector('#configDialog input[data-btn="btnQRSync"]')) return;
    var ref = document.querySelector('#configDialog input[data-btn="btnRestore"]');
    if (!ref) return;
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnQRSync" checked> 📲 Traspaso QR';
    var refLab = ref.closest ? ref.closest('label') : ref.parentNode;
    refLab.parentNode.insertBefore(lab, refLab.nextSibling);
  } catch (e) {}
}

function injectCSS() {
  if ($('qrSyncCSS')) return;
  var st = document.createElement('style');
  st.id = 'qrSyncCSS';
  st.textContent =
    '#qrSyncDialog{width:560px;max-width:96vw;max-height:88vh;overflow-y:auto}' +
    '#qrSyncDialog .qr-send-box{text-align:center;margin-top:8px}' +
    '#qrSyncDialog #qrImg{width:min(74vw,340px);height:auto;background:#fff;border-radius:12px;padding:10px;border:1px solid var(--line)}' +
    '#qrSyncDialog .qr-ctl{display:flex;gap:8px;justify-content:center;align-items:center;margin-top:10px;flex-wrap:wrap}' +
    '#qrSyncDialog .qr-count{font-size:12px;color:var(--muted);min-width:90px;text-align:center}' +
    '#qrSyncDialog .qr-grid{display:flex;gap:3px;flex-wrap:wrap;margin:10px 0 4px;max-height:110px;overflow-y:auto}' +
    '#qrSyncDialog .qr-cell{width:14px;height:14px;border-radius:3px;background:var(--panel);border:1px solid var(--line)}' +
    '#qrSyncDialog .qr-cell.on{background:var(--gold);border-color:var(--gold)}' +
    '#qrSyncDialog video{width:100%;border-radius:10px;background:#000;display:block;margin-top:8px}' +
    '#qrSyncDialog .qr-status{font-size:12px;color:var(--text);margin-top:8px;line-height:1.5;min-height:18px}' +
    '#qrSyncDialog .qr-warn{border:1px solid #e76e8a88;border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.55;background:rgba(231,110,138,.08)}';
  document.head.appendChild(st);
}

/* ---------- diálogo ---------- */
var dlg = null;

function buildDialog() {
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.id = 'qrSyncDialog';
  dlg.innerHTML =
    '<form method="dialog">' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
        '<h3 style="margin:0;color:var(--accent)">📲 Traspaso QR — PC ↔ celular</h3>' +
        '<button type="button" id="qrCloseTop" class="btn btn-icon" title="Cerrar" aria-label="Cerrar">✕</button>' +
      '</div>' +
      '<p class="muted" style="line-height:1.5">Pasa <b>todos tus datos</b> (igual que 💾 Respaldo) entre tus propios dispositivos: ' +
      'sin internet, sin cuentas y sin servidores — los datos viajan solo de <b>pantalla a cámara</b>.</p>' +
      '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
        '<button type="button" id="qrTabSend" class="btn btn-accent" style="width:auto">📤 Enviar</button>' +
        '<button type="button" id="qrTabRecv" class="btn" style="width:auto">📥 Recibir</button>' +
      '</div>' +
      '<div id="qrSendPanel">' +
        '<p class="muted" style="font-size:11px">Genera la secuencia de QRs con tus datos. En el otro dispositivo abre 📲 Traspaso QR → 📥 Recibir y apunta la cámara a esta pantalla.</p>' +
        '<div class="dlg-actions" style="justify-content:flex-start">' +
          '<button type="button" id="qrGen" class="btn btn-accent" style="width:auto">▶ Generar QRs</button>' +
        '</div>' +
        '<div id="qrSendBox" class="qr-send-box hidden">' +
          '<img id="qrImg" alt="Código QR con parte de tus datos">' +
          '<div class="qr-ctl">' +
            '<button type="button" id="qrPrev" class="btn btn-icon" title="Anterior">◀</button>' +
            '<span id="qrCount" class="qr-count">QR 1 de 1</span>' +
            '<button type="button" id="qrNext" class="btn btn-icon" title="Siguiente">▶</button>' +
            '<button type="button" id="qrAuto" class="btn" style="width:auto" title="Avanzar solo para escanear seguido">▶ Auto</button>' +
          '</div>' +
          '<p class="muted" id="qrSendInfo" style="font-size:11px;margin-top:8px"></p>' +
        '</div>' +
      '</div>' +
      '<div id="qrRecvPanel" class="hidden">' +
        '<p class="muted" style="font-size:11px">Apunta la cámara a la pantalla del otro dispositivo. Las partes se reciben en cualquier orden y suena un beep por cada una.</p>' +
        '<div class="dlg-actions" style="justify-content:flex-start">' +
          '<button type="button" id="qrCamStart" class="btn btn-accent" style="width:auto">📷 Abrir cámara</button>' +
          '<button type="button" id="qrCamStop" class="btn hidden" style="width:auto">⏹ Detener</button>' +
        '</div>' +
        '<video id="qrVideo" playsinline muted class="hidden"></video>' +
        '<div id="qrRecvProg" class="hidden">' +
          '<div id="qrCells" class="qr-grid"></div>' +
          '<div id="qrRecvCount" class="qr-count" style="text-align:left;min-width:0">0 de 0 partes</div>' +
        '</div>' +
        '<div id="qrStatus" class="qr-status"></div>' +
        '<div id="qrConfirm" class="hidden" style="margin-top:10px">' +
          '<div class="menstrual-card">' +
            '<h4>✅ Respaldo recibido completo</h4>' +
            '<p id="qrSummary" style="font-size:12px;line-height:1.6;margin:6px 0"></p>' +
            '<p class="qr-warn">⚠️ Importar <b>reemplaza TODOS los datos de este dispositivo</b> (todos los usuarios). Consejo: haz primero 💾 Respaldo si aquí ya tienes cosas.</p>' +
            '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px">' +
              '<button type="button" id="qrImport" class="btn btn-accent" style="width:auto">✅ Importar ahora</button>' +
              '<button type="button" id="qrDiscard" class="btn" style="width:auto">Descartar</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="dlg-actions"><button type="button" id="qrClose" class="btn">Cerrar</button></div>' +
    '</form>';
  document.body.appendChild(dlg);

  $('qrCloseTop').onclick = closeDlg;
  $('qrClose').onclick = closeDlg;
  $('qrTabSend').onclick = function () { setTab('send'); };
  $('qrTabRecv').onclick = function () { setTab('recv'); };
  $('qrGen').onclick = genQRs;
  $('qrPrev').onclick = function () { stopAuto(); stepQR(-1); };
  $('qrNext').onclick = function () { stopAuto(); stepQR(1); };
  $('qrAuto').onclick = toggleAuto;
  $('qrCamStart').onclick = startCamera;
  $('qrCamStop').onclick = function () { stopCamera(); setStatus('Cámara detenida. Las partes recibidas se conservan.'); };
  $('qrImport').onclick = doImport;
  $('qrDiscard').onclick = resetRecv;
  dlg.addEventListener('close', function () { stopCamera(); stopAuto(); });
  return dlg;
}

function setTab(t) {
  var send = t === 'send';
  $('qrTabSend').className = send ? 'btn btn-accent' : 'btn';
  $('qrTabRecv').className = send ? 'btn' : 'btn btn-accent';
  $('qrSendPanel').classList.toggle('hidden', !send);
  $('qrRecvPanel').classList.toggle('hidden', send);
  if (send) stopCamera();
}

function openDlg() {
  buildDialog();
  resetRecv();
  setTab('send');
  try { if (dlg.showModal) dlg.showModal(); else dlg.show(); }
  catch (e) { try { dlg.setAttribute('open', ''); } catch (e2) {} }
}
function closeDlg() { try { dlg.close(); } catch (e) {} }

/* ---------- ENVIAR ---------- */
var sendEnc = null, sendIdx = 0, autoTimer = null;

async function genQRs() {
  var c = codec();
  if (!c) { alert('Falta qr-codec.js'); return; }
  if (typeof qrcode === 'undefined') { alert('Falta qrcode-lib.js'); return; }
  var btn = $('qrGen');
  btn.disabled = true; btn.textContent = '⏳ Generando...';
  try {
    var json = JSON.stringify(DATA);
    sendEnc = await c.encodeBackup(json);
    sendIdx = 0;
    $('qrSendBox').classList.remove('hidden');
    renderSendQR();
    var kb = Math.round(sendEnc.rawBytes / 1024);
    var msg = '📦 ' + kb + ' KB en ' + sendEnc.total + (sendEnc.total === 1 ? ' QR' : ' QRs') +
      (sendEnc.magic === c.MAGIC_GZ ? ' (comprimido)' : '');
    if (sendEnc.total > 60) msg += ' — son muchos; para respaldos muy grandes considera también 💾 Respaldo a archivo.';
    $('qrSendInfo').textContent = msg;
    if (sendEnc.total > 1) startAuto();
  } catch (e) {
    $('qrSendInfo').textContent = 'No se pudo generar: ' + (e && e.message || e);
  } finally {
    btn.disabled = false; btn.textContent = '▶ Generar QRs';
  }
}

function renderSendQR() {
  if (!sendEnc) return;
  try {
    var q = qrcode(0, 'M');
    q.addData(sendEnc.chunks[sendIdx]);
    q.make();
    $('qrImg').src = q.createDataURL(6, 4);
  } catch (e) {
    $('qrSendInfo').textContent = 'Error dibujando QR: ' + (e && e.message || e);
  }
  $('qrCount').textContent = 'QR ' + (sendIdx + 1) + ' de ' + sendEnc.total;
}
function stepQR(d) {
  if (!sendEnc) return;
  sendIdx = (sendIdx + d + sendEnc.total) % sendEnc.total;
  renderSendQR();
}
function startAuto() {
  stopAuto();
  autoTimer = setInterval(function () { stepQR(1); }, 1150);
  $('qrAuto').textContent = '⏸ Pausa';
}
function stopAuto() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  var b = $('qrAuto'); if (b) b.textContent = '▶ Auto';
}
function toggleAuto() { if (autoTimer) stopAuto(); else startAuto(); }

/* ---------- RECIBIR ---------- */
var stream = null, scanTimer = null, recvSid = null, recvTotal = 0, recvChunks = {}, recvCount = 0;
var lastData = '', lastTime = 0, recvJSON = null;

function setStatus(t) { var el = $('qrStatus'); if (el) el.textContent = t || ''; }

function resetRecv() {
  stopCamera();
  recvSid = null; recvTotal = 0; recvChunks = {}; recvCount = 0; recvJSON = null;
  lastData = ''; lastTime = 0;
  try {
    $('qrConfirm').classList.add('hidden');
    $('qrRecvProg').classList.add('hidden');
    $('qrCells').innerHTML = '';
    $('qrRecvCount').textContent = '0 de 0 partes';
  } catch (e) {}
  setStatus('');
}

function beep() { try { if (typeof playNotifySound === 'function') playNotifySound(); } catch (e) {} }

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('❌ Este navegador no permite cámara. Alternativa: 💾 Respaldo en un dispositivo y 📥 Restaurar en el otro.');
    return;
  }
  if (typeof jsQR === 'undefined') { setStatus('❌ Falta jsqr-lib.js'); return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  } catch (e) {
    var msg = (e && e.name === 'NotAllowedError')
      ? '❌ Permiso de cámara denegado. Actívalo en el navegador o usa 💾 Respaldo → 📥 Restaurar con archivo.'
      : '❌ No se pudo abrir la cámara: ' + (e && e.message || e);
    setStatus(msg);
    return;
  }
  var v = $('qrVideo');
  v.srcObject = stream;
  v.classList.remove('hidden');
  $('qrCamStop').classList.remove('hidden');
  $('qrCamStart').classList.add('hidden');
  try { await v.play(); } catch (e) {}
  setStatus('Cámara lista. Apunta a la pantalla del otro dispositivo...');
  if (scanTimer) clearInterval(scanTimer);
  scanTimer = setInterval(scanFrame, 220);
}

function stopCamera() {
  if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
  if (stream) {
    try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    stream = null;
  }
  try {
    var v = $('qrVideo');
    if (v) { v.srcObject = null; v.classList.add('hidden'); }
    $('qrCamStop').classList.add('hidden');
    $('qrCamStart').classList.remove('hidden');
  } catch (e) {}
}

function scanFrame() {
  var v = $('qrVideo');
  if (!v || !stream || v.readyState < 2 || !v.videoWidth) return;
  var cv = document.createElement('canvas');
  cv.width = v.videoWidth; cv.height = v.videoHeight;
  var ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(v, 0, 0, cv.width, cv.height);
  var img;
  try { img = ctx.getImageData(0, 0, cv.width, cv.height); } catch (e) { return; }
  var code = null;
  try { code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' }); } catch (e) {}
  if (!code || !code.data) return;
  var now = Date.now();
  if (code.data === lastData && now - lastTime < 1600) return; // mismo QR recién leído
  lastData = code.data; lastTime = now;
  onChunk(code.data);
}

function onChunk(str) {
  var c = codec(); if (!c) return;
  var p = c.parseChunk(str);
  if (!p) { setStatus('QR leído, pero no es de este traspaso (se ignora).'); return; }
  if (recvSid && p.sid !== recvSid) {
    setStatus('⚠️ Ese QR es de OTRO envío (se ignora). Si quieres empezar de nuevo, toca Descartar.');
    return;
  }
  if (!recvSid) {
    recvSid = p.sid; recvTotal = p.n; recvChunks = {}; recvCount = 0;
    $('qrRecvProg').classList.remove('hidden');
    var cells = '';
    for (var i = 1; i <= recvTotal; i++) cells += '<span class="qr-cell" data-i="' + i + '"></span>';
    $('qrCells').innerHTML = cells;
  }
  if (p.n !== recvTotal) { setStatus('⚠️ QR con total distinto (se ignora).'); return; }
  if (recvChunks[p.i]) { setStatus('Parte ' + p.i + ' ya la tenía (' + recvCount + '/' + recvTotal + ').'); return; }
  recvChunks[p.i] = str; recvCount++;
  beep();
  var cell = $('qrCells').querySelector('[data-i="' + p.i + '"]');
  if (cell) cell.classList.add('on');
  $('qrRecvCount').textContent = recvCount + ' de ' + recvTotal + ' partes';
  setStatus('✔ Parte ' + p.i + ' recibida (' + recvCount + '/' + recvTotal + ')');
  if (recvCount >= recvTotal) finishRecv();
}

async function finishRecv() {
  stopCamera();
  setStatus('⏳ Reensamblando y verificando...');
  var c = codec();
  try {
    var arr = [];
    for (var i = 1; i <= recvTotal; i++) arr.push(recvChunks[i]);
    var json = await c.decodeChunks(arr);
    var d = JSON.parse(json); // solo para previsualizar; la validación real la hace applyBackupJSON
    recvJSON = json;
    var names = (d.usuarios || []).map(function (u) { return esc(u.nombre || u.id); }).join(', ');
    var kb = Math.round(json.length / 1024);
    $('qrSummary').innerHTML = '👤 <b>' + (d.usuarios ? d.usuarios.length : 0) + '</b> usuario(s): ' + (names || '—') +
      '<br>📦 Tamaño: ' + kb + ' KB · recibido en ' + recvTotal + ' QRs';
    $('qrConfirm').classList.remove('hidden');
    setStatus('✅ Secuencia completa. Revisa y confirma abajo.');
  } catch (e) {
    var why = (e && e.message) || String(e);
    if (why === 'sesion-mixta') why = 'se mezclaron QRs de dos envíos distintos';
    else if (why === 'base64' || why === 'gzip') why = 'datos corruptos (vuelve a escanear con más luz y pantalla quieta)';
    else if (/^falta-/.test(why)) why = 'falta la parte ' + why.split('-')[1];
    setStatus('❌ No se pudo reensamblar: ' + why + '. Toca Descartar e intenta de nuevo.');
  }
}

async function doImport() {
  if (!recvJSON) return;
  var fn = (typeof window.applyBackupJSON === 'function') ? window.applyBackupJSON
    : (typeof applyBackupJSON === 'function' ? applyBackupJSON : null);
  if (!fn) { setStatus('❌ No se encontró la función de restauración (renderer.js).'); return; }
  var btn = $('qrImport');
  btn.disabled = true; btn.textContent = '⏳ Importando...';
  var ok = false;
  try { ok = await fn(recvJSON); } catch (e) { ok = false; }
  btn.disabled = false; btn.textContent = '✅ Importar ahora';
  if (ok) {
    setStatus('✅ Datos importados. Este dispositivo ya tiene todo lo del otro.');
    setTimeout(closeDlg, 900);
  } else {
    setStatus('❌ El respaldo recibido no pasó la validación. Nada fue modificado.');
  }
}

/* ---------- init (patrón de los demás módulos) ---------- */
var _tries = 0;
function init() {
  if (!document.querySelector('.action-group[data-group]')) { if (_tries++ < 40) setTimeout(init, 500); return; }
  injectCSS();
  injectBtn();
  injectConfigChk();
  registerBtn();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
