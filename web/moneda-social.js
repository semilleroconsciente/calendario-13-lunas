/* ============================================================
   MONEDA SOCIAL — Calendario 13 Lunas (Penco · Bío-Bío)
   Apartado: Comunidad > 🤝 Red Penco (btnMoneda)
   Sección completa para una moneda social comunitaria:
   - Pestañas: Guía | 🪙 Mi Billetera | Ofertas y Pedidos |
     Transacciones | Acuerdos.
   - Guía: qué es, por qué en Penco, reglas base, cómo partir,
     equivalencias sugeridas, seguridad y límites honestos.
   - Mi Billetera: cuenta personal (nombre, unidad, símbolo),
     balance automático, saldo inicial, tope de confianza
     (límite negativo permitido), historial.
   - Ofertas y Pedidos: publico qué ofrezco / necesito en moneda
     social (con precio en unidades + opción trueque/parcial en $),
     con ➕ CRUD propio, búsqueda y filtros.
   - Transacciones: registrar pagos y cobros entre vecinas/os
     (quién, concepto, monto, fecha) con balance en vivo,
     editar/borrar, compartir y exportar.
   - Acuerdos: compromisos de la red (asamblea, feria, fondo
     común) con checklist + registro de tratos cerrados.
   - Conexión con 🏪 Economía Local: si existe window.NegociosPenco,
     se muestra conteo de fichas que aceptan moneda social.
   Todo local y privado por usuario: userData().monedaSocial
     { cuenta:{nombre,unidad,simb,inicial,tope}, txs:[],
       ofertas:[], acuerdos:{}, tratos:[] }
   100% offline. Sin dependencias externas. Educativo: los tratos
   reales se cierran en persona; aquí vive el registro.
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
function openDlg(id) { var d = $(id); if (d && d.showModal) { try { if (!d.open) d.showModal(); } catch (e) { try { d.showModal(); } catch (e2) {} } } }
function fmtMonto(n, simb) {
  var v = Number(n);
  if (isNaN(v)) v = 0;
  var txt = (Math.round(v * 100) / 100).toString();
  return (simb ? simb + ' ' : '') + txt;
}

/* ---------------- DATOS GUÍA ---------------- */
var GUIA_CARDS = [
  { n: '¿Qué es una moneda social?', ico: '🪙', txt: 'Una <b>unidad de cuenta propia del territorio</b> para intercambiar bienes, saberes y cuidados <b>sin depender solo del peso</b>. No es trueque improvisado ni criptomoneda: es un <b>registro de quién dio y quién recibió</b>, con reglas acordadas en persona. Cada trato suma a la red: si tú me arreglas la bici y yo te cuido la huerta, la moneda lo deja anotado y la confianza queda visible.' },
  { n: '¿Por qué en Penco?', ico: '🌊', txt: 'Penco tiene <b>caletas, ferias, oficios y huertas</b> que ya se prestan favores sin plata de por medio. La moneda social <b>ordena esos favores</b>: la vecina que vende pan amasado acepta parte en moneda, el gasfiter cobra en moneda, la feria del sábado la recibe. En temporales o cesantía, la red sigue moviéndose aunque el peso escasee. Empieza con <b>5–10 personas de confianza</b> (cuadra, curso, caleta) y crece por feria.' },
  { n: 'Reglas base (acuerdo mínimo)', ico: '🤝', txt: '1) <b>La moneda la sostiene la red</b>: nadie la vende ni la cambia por pesos sin acuerdo. 2) <b>Todo trato es voluntario</b> y se anota con nombre, concepto y monto. 3) <b>Saldo puede ser negativo hasta el tope</b> (confianza): pedir primero también es participar. 4) <b>Precios justos</b>: se acuerdan mirando la equivalencia sugerida, no se especula. 5) <b>Transparencia</b>: balances visibles en asamblea, nombres solo con permiso. 6) <b>Se sale cuando se quiere</b>, saldando o compensando con trabajo.' },
  { n: 'Cómo partir en 7 pasos', ico: '🪜', txt: '<b>1)</b> Junta 5–10 personas (puerta a puerta, grupo curso). <b>2)</b> Acuerden <b>nombre, símbolo y equivalencia</b> (ej: 1 hora de trabajo = 10 unidades). <b>3)</b> Cada una abre su cuenta aquí (pestaña Billetera). <b>4)</b> Publiquen 1 oferta y 1 pedido por persona (pestaña Ofertas). <b>5)</b> Hagan la primera feria: 2 horas, 1 trato por persona mínimo. <b>6)</b> Anoten todo en Transacciones. <b>7)</b> Reúnanse 1 vez por luna a revisar saldos y reglas.' },
  { n: 'Equivalencias sugeridas (punto de partida)', ico: '⚖️', txt: 'Las define la asamblea; esto es solo para no partir de cero: <b>1 hora de oficio</b> (gasfitería, costura, clases) = <b>10 U</b> · <b>1 hora de cuidado</b> (niños, mayores) = <b>10 U</b> · <b>Docena de huevos de campo</b> = <b>4–6 U</b> · <b>Pan amasado (6 un.)</b> = <b>3–5 U</b> · <b>Almuerzo casero</b> = <b>8–12 U</b> · <b>Corte de pelo</b> = <b>8 U</b> · <b>Flete corto en Penco</b> = <b>10–15 U</b>. Mezcla permitida: ej. 50% pesos + 50% moneda.' },
  { n: 'Seguridad y límites honestos', ico: '⚠️', txt: 'La moneda social <b>no es ahorro ni inversión</b>: no guarda valor fuera de la red y no genera interés. <b>No reemplaza derechos</b> (salud, previsión, impuestos se pagan en pesos). Anota solo <b>nombre de pila + concepto</b>, nunca RUT ni claves. Tope negativo chico al inicio (ej. −50 U): la confianza se gana con tratos cumplidos. Si un trato sale mal, se conversa en la red antes de anotar deuda.' },
  { n: 'Feria + calendario lunar', ico: '🌙', txt: 'La feria mensual rinde más en <b>creciente–llena</b> (gente con energía y productos de huerta). Usa <b>📌 Llevar a la feria al calendario</b> desde Ofertas para no olvidar: día, hora y lugar quedan como compromiso 🕐 con 🔔 opcional. Revisa saldos cada luna llena: 10 minutos bastan.' }
];
var ACUERDOS_BASE = [
  { id: 'nombre', n: 'Acordamos nombre, símbolo y equivalencia', d: 'En persona, con las 5–10 fundadoras. Anótalo en Billetera.' },
  { id: 'tope', n: 'Fijamos el tope negativo (confianza)', d: 'Sugerido inicial: −50 U por persona. Se sube con historial.' },
  { id: 'feria', n: 'Hicimos la primera feria', d: '2 horas, 1 trato por persona mínimo, todo anotado.' },
  { id: 'revision', n: 'Revisamos saldos 1 vez por luna', d: 'Luna llena: 10 min, balances y reglas. Sin castigos, con acuerdos.' },
  { id: 'fondo', n: 'Definimos fondo común (opcional)', d: 'Ej: 2 U por trato van a un fondo para emergencias de la red.' }
];

/* ---------------- STORE ---------------- */
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { cuenta: null, txs: [], ofertas: [], acuerdos: {}, tratos: [] };
    if (!u.monedaSocial) u.monedaSocial = { cuenta: null, txs: [], ofertas: [], acuerdos: {}, tratos: [] };
    var r = u.monedaSocial;
    if (!Array.isArray(r.txs)) r.txs = [];
    if (!Array.isArray(r.ofertas)) r.ofertas = [];
    if (!Array.isArray(r.tratos)) r.tratos = [];
    if (!r.acuerdos || Array.isArray(r.acuerdos)) r.acuerdos = {};
    return r;
  } catch (e) { return { cuenta: null, txs: [], ofertas: [], acuerdos: {}, tratos: [] }; }
}
function cuenta() {
  var c = store().cuenta;
  if (!c) return { nombre: '', unidad: 'Lafken', simb: 'Lf', inicial: 0, tope: -50 };
  if (c.unidad === undefined) c.unidad = 'Lafken';
  if (c.simb === undefined) c.simb = 'Lf';
  if (c.inicial === undefined || c.inicial === null) c.inicial = 0;
  if (c.tope === undefined || c.tope === null) c.tope = -50;
  return c;
}
function balance() {
  var c = cuenta();
  var mov = store().txs.reduce(function (acc, t) { return acc + (Number(t.monto) || 0); }, 0);
  return (Number(c.inicial) || 0) + mov;
}
/* monto: positivo = recibo (entra), negativo = pago (sale) */

/* ---------------- DIÁLOGO ---------------- */
var monTab = 'guia';
var ofQuery = '', ofFiltro = 'todas';
var ofEditId = null, txEditId = null;

function ensureDialog() {
  var d = $('monedaDialog');
  if (d) return d;
  d = document.createElement('dialog');
  d.id = 'monedaDialog';
  var guiaHTML = GUIA_CARDS.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + c.txt + '</p></div>';
  }).join('');
  var acuHTML = ACUERDOS_BASE.map(function (a) {
    return '<label class="check-row" style="align-items:flex-start"><input type="checkbox" data-acuerdo="' + a.id + '"> <span><b>' + esc(a.n) + '</b><br><span class="muted" style="font-size:11px">' + esc(a.d) + '</span></span></label>';
  }).join('');
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:10px">' +
    '<h3 style="margin:0;color:var(--accent)">🪙 Moneda Social — Penco</h3>' +
    '<button type="button" id="monCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted" style="line-height:1.5">Unidad de cuenta propia del territorio para intercambiar sin depender solo del peso. Los tratos se cierran <b>en persona</b>; aquí vive el <b>registro privado y local</b> por usuario.</p>' +
    '<div id="monHoyBox" class="menstrual-card" style="border-color:var(--gold)"></div>' +
    '<div class="timer-tabs" style="margin:10px 0;flex-wrap:wrap">' +
    '<button type="button" id="tabMonGuia" class="btn btn-accent" style="width:auto">📖 Guía</button>' +
    '<button type="button" id="tabMonBilletera" class="btn" style="width:auto">🪙 Mi Billetera</button>' +
    '<button type="button" id="tabMonOfertas" class="btn" style="width:auto">📋 Ofertas y Pedidos</button>' +
    '<button type="button" id="tabMonTx" class="btn" style="width:auto">💸 Transacciones</button>' +
    '<button type="button" id="tabMonAcuerdos" class="btn" style="width:auto">🤝 Acuerdos</button>' +
    '</div>' +
    '<div id="monPanelGuia"><div class="discipline-grid">' + guiaHTML + '</div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🏪 Conexión con Economía Local</h4><div id="monEcoBox"></div></div></div>' +
    '<div id="monPanelBilletera" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🪙 Mi cuenta</h4>' +
    '<div class="conv-row"><label style="flex:2">Mi nombre (pila) * <input type="text" id="monNombre" placeholder="ej: Rosa" maxlength="30"></label>' +
    '<label>Moneda <input type="text" id="monUnidad" placeholder="ej: Lafken" maxlength="20"></label>' +
    '<label>Símbolo <input type="text" id="monSimb" placeholder="ej: Lf" maxlength="6" style="width:80px"></label></div>' +
    '<div class="conv-row"><label>Saldo inicial <input type="number" id="monInicial" step="0.5" style="width:110px" value="0"></label>' +
    '<label>Tope negativo (confianza) <input type="number" id="monTope" step="1" style="width:110px" value="-50"></label></div>' +
    '<p class="muted" style="font-size:11px">El tope negativo es cuánto puedes quedar "en rojo" participando: pedir primero también es parte de la red.</p>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="monCuentaSave" class="btn btn-accent" style="width:auto">💾 Guardar mi cuenta</button></div></div>' +
    '<div id="monBalanceBox" class="menstrual-card" style="margin-top:10px"></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>📜 Historial de movimientos</h4><div id="monHistList" class="habits-list" style="max-height:240px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="monHistCount" class="muted" style="font-size:11px"></span>' +
    '<span style="display:flex;gap:8px"><button type="button" id="monHistShare" class="btn" style="width:auto">📤 Compartir</button>' +
    '<button type="button" id="monHistClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Borrar</button></span></div></div>' +
    '</div>' +
    '<div id="monPanelOfertas" class="hidden">' +
    '<div class="menstrual-card"><h4>🔍 Buscar ofertas y pedidos</h4>' +
    '<div class="conv-row"><label style="flex:2">Buscar <input type="text" id="monOfSearch" placeholder="ej: pan, clases, flete, cuidado..." maxlength="60" autocomplete="off"></label>' +
    '<label>Ver <select id="monOfFiltro"><option value="todas">Todo</option><option value="ofrezco">🙌 Ofrezco</option><option value="necesito">🙏 Necesito</option><option value="trueque">🔄 Con trueque</option></select></label></div>' +
    '<p class="muted" style="font-size:11px;margin:4px 0 0" id="monOfCount"></p></div>' +
    '<div id="monOfList" style="margin-top:10px"></div>' +
    '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><h4>➕ Publicar oferta o pedido</h4>' +
    '<div class="conv-row"><label>Tipo <select id="monOfTipo"><option value="ofrezco">🙌 Ofrezco</option><option value="necesito">🙏 Necesito</option></select></label>' +
    '<label>Categoría <select id="monOfCat"><option>🥘 Alimentos</option><option>🔧 Oficios</option><option>📚 Clases y cursos</option><option>💚 Cuidados</option><option>🏠 Hogar</option><option>🌾 Huerta y campo</option><option>🎨 Arte</option><option>🚐 Transporte</option><option>📌 Otro</option></select></label></div>' +
    '<label>Título * <input type="text" id="monOfTitulo" placeholder="ej: Pan amasado los sábados / Necesito ayuda con techo" maxlength="60"></label>' +
    '<label>Detalle <input type="text" id="monOfDetalle" placeholder="cantidad, días, lugar de entrega" maxlength="120"></label>' +
    '<div class="conv-row"><label>Precio (en moneda) <input type="text" id="monOfPrecio" placeholder="ej: 5 / a convenir" maxlength="20"></label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="monOfTrueque"> 🔄 También trueque</label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="monOfMixto"> 💵 Mixto ($ + moneda)</label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="monOfSave" class="btn btn-accent" style="width:auto">+ Publicar</button>' +
    '<button type="button" id="monOfCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '</div>' +
    '<div id="monPanelTx" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>💸 Registrar pago / cobro</h4>' +
    '<p class="muted" style="font-size:11px">Positivo (+) = recibí moneda · Negativo (−) = pagué moneda. Ej: recibí 10 por pan → +10; pagué 8 por corte → −8.</p>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="monTxFecha"></label>' +
    '<label>Contraparte <input type="text" id="monTxCon" placeholder="ej: Marta (pan)" maxlength="40"></label></div>' +
    '<div class="conv-row"><label style="flex:2">Concepto * <input type="text" id="monTxConcepto" placeholder="ej: 6 panes amasados / clase de guitarra" maxlength="80"></label>' +
    '<label>Monto * <input type="number" id="monTxMonto" step="0.5" placeholder="+10 / −8" style="width:120px"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="monTxSave" class="btn btn-accent" style="width:auto">+ Registrar</button>' +
    '<button type="button" id="monTxCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div id="monTxList" style="margin-top:10px"></div>' +
    '</div>' +
    '<div id="monPanelAcuerdos" class="hidden">' +
    '<div class="menstrual-card"><h4>✅ Acuerdos de la red (checklist)</h4><div id="monAcuerdosBox" style="display:flex;flex-direction:column;gap:8px;margin-top:8px">' + acuHTML + '</div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><span id="monAcuerdosStats" class="muted" style="font-size:11px"></span></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🤝 Tratos cerrados en feria / asamblea</h4>' +
    '<p class="muted" style="font-size:11px">Anota los tratos importantes de la red (compromisos, fondo común, trueques grandes). Quedan privados en tu dispositivo.</p>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="monTrFecha"></label>' +
    '<label style="flex:2">Trato * <input type="text" id="monTrato" placeholder="ej: Feria sábado: vendí 10 panes a la red" maxlength="80"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="monTratoAdd" class="btn btn-accent" style="width:auto">+ Guardar trato</button></div>' +
    '<div id="monTratosList" class="habits-list" style="margin-top:10px;max-height:220px"></div></div>' +
    '</div>' +
    '<div class="dlg-actions"><button type="button" id="monClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}

/* ---------------- RENDER ---------------- */
function switchTab(t) {
  monTab = t;
  var map = { guia: ['monPanelGuia', 'tabMonGuia'], billetera: ['monPanelBilletera', 'tabMonBilletera'], ofertas: ['monPanelOfertas', 'tabMonOfertas'], tx: ['monPanelTx', 'tabMonTx'], acuerdos: ['monPanelAcuerdos', 'tabMonAcuerdos'] };
  Object.keys(map).forEach(function (k) {
    var p = $(map[k][0]), b = $(map[k][1]);
    if (p) p.classList.toggle('hidden', k !== t);
    if (b) b.classList.toggle('btn-accent', k === t);
  });
  render();
}

function paintHoy() {
  var b = $('monHoyBox'); if (!b) return;
  try {
    var c = cuenta();
    var bal = balance();
    var nOf = store().ofertas.length;
    var color = bal < (Number(c.tope) || -50) ? '#e76e8a' : (bal < 0 ? '#e8c56a' : '#8fd694');
    b.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px"><span><b>🪙 ' + esc(c.unidad || 'Moneda social') + (c.nombre ? ' · ' + esc(c.nombre) : '') + '</b></span>' +
      '<span class="chip" style="border-color:' + color + '55;color:' + color + '">Balance: ' + esc(fmtMonto(bal, c.simb)) + '</span></div>' +
      '<p class="muted" style="font-size:11px;margin:4px 0 0">' + nOf + ' oferta(s)/pedido(s) · ' + store().txs.length + ' transacción(es)' +
      (!c.nombre ? ' · 👆 Abre tu cuenta en <b>Mi Billetera</b> para partir.' : '') + '</p>';
  } catch (e) {}
}

function paintEcoBox() {
  var box = $('monEcoBox'); if (!box) return;
  try {
    if (window.NegociosPenco && typeof window.NegociosPenco.list === 'function') {
      var list = window.NegociosPenco.list().filter(function (t) { return t.moneda; });
      box.innerHTML = list.length
        ? '<p style="font-size:12px">🏪 <b>' + list.length + '</b> ficha(s) de Economía Local aceptan moneda social: <b>' + esc(list.slice(0, 5).map(function (t) { return t.nombre; }).join(' · ')) + '</b>' + (list.length > 5 ? ' y más.' : '.') + '</p><div style="margin-top:6px"><button type="button" id="monGoEco" class="btn" style="width:auto;font-size:11px">🏪 Ver Economía Local</button></div>'
        : '<p class="muted" style="font-size:11px">Aún no hay fichas con 🪙 en Economía Local. Cuando un negocio acepte la moneda, márcalo ahí y aparecerá aquí.</p><div style="margin-top:6px"><button type="button" id="monGoEco" class="btn" style="width:auto;font-size:11px">🏪 Ir a Economía Local</button></div>';
      var go = $('monGoEco');
      if (go) go.onclick = function () { try { window.NegociosPenco.open('dir'); } catch (e) {} };
    } else {
      box.innerHTML = '<p class="muted" style="font-size:11px">Instala también 🏪 Economía Local para ver aquí qué negocios aceptan la moneda.</p>';
    }
  } catch (e) {}
}

function paintBilletera() {
  var c = cuenta();
  if ($('monNombre') && document.activeElement !== $('monNombre')) $('monNombre').value = c.nombre || '';
  if ($('monUnidad') && document.activeElement !== $('monUnidad')) $('monUnidad').value = c.unidad || 'Lafken';
  if ($('monSimb') && document.activeElement !== $('monSimb')) $('monSimb').value = c.simb || 'Lf';
  if ($('monInicial') && document.activeElement !== $('monInicial')) $('monInicial').value = c.inicial;
  if ($('monTope') && document.activeElement !== $('monTope')) $('monTope').value = c.tope;
  var box = $('monBalanceBox');
  if (box) {
    var bal = balance();
    var tope = Number(c.tope);
    var estado = bal < tope ? '⚠️ Bajo el tope de confianza: compensa con una oferta o trabajo a la red.' : (bal < 0 ? '🟡 En confianza (negativo dentro del tope): ¡ofrece algo a la red!' : (bal === 0 ? '⚪ En cero: punto ideal para partir un trato.' : '🟢 En positivo: puedes gastar en la red.'));
    var color = bal < tope ? '#e76e8a' : (bal < 0 ? '#e8c56a' : '#8fd694');
    var entradas = store().txs.filter(function (t) { return Number(t.monto) > 0; }).reduce(function (a, t) { return a + Number(t.monto); }, 0);
    var salidas = store().txs.filter(function (t) { return Number(t.monto) < 0; }).reduce(function (a, t) { return a + Math.abs(Number(t.monto)); }, 0);
    box.innerHTML = '<h4>📊 Balance</h4>' +
      '<p style="font-size:16px"><b style="color:' + color + '">' + esc(fmtMonto(bal, c.simb)) + ' ' + esc(c.unidad || '') + '</b></p>' +
      '<p class="muted" style="font-size:11px">Inicial ' + esc(fmtMonto(c.inicial, c.simb)) + ' · Recibido +' + esc(fmtMonto(entradas, '')) + ' · Entregado −' + esc(fmtMonto(salidas, '')) + ' · Tope ' + esc(fmtMonto(tope, c.simb)) + '</p>' +
      '<p style="font-size:12px">' + estado + '</p>';
  }
  var hist = $('monHistList');
  if (hist) {
    var txs = store().txs.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    if (!txs.length) hist.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin movimientos. Registra el primero en 💸 Transacciones.</p>';
    else hist.innerHTML = txs.map(function (t) {
      var m = Number(t.monto) || 0;
      var col = m >= 0 ? '#8fd694' : '#e8a06a';
      return '<div class="hora-item"><span style="font-size:12px"><b style="color:' + col + '">' + (m >= 0 ? '+' : '') + esc(fmtMonto(m, c.simb)) + '</b> · ' + esc(t.concepto || '') +
        '<br><span class="muted" style="font-size:10px">' + esc(t.fecha || '') + (t.contraparte ? ' · ' + esc(t.contraparte) : '') + '</span></span></div>';
    }).join('');
  }
  var hc = $('monHistCount');
  if (hc) hc.textContent = store().txs.length + ' movimiento(s)';
}

function ofCard(o) {
  var c = cuenta();
  var tipoChip = o.tipo === 'ofrezco' ? '🙌 Ofrezco' : '🙏 Necesito';
  return '<div class="si-card" style="padding:10px 12px"><h4 style="font-size:13px">' + tipoChip + ' · ' + esc(o.titulo) + '</h4>' +
    '<p class="muted" style="font-size:10px">' + esc(o.cat || '') + (o.precio ? ' · 💰 ' + esc(o.precio) + ' ' + esc(c.simb || '') : '') + (o.trueque ? ' · 🔄 trueque' : '') + (o.mixto ? ' · 💵 mixto' : '') + '</p>' +
    (o.detalle ? '<p style="font-size:12px">' + esc(o.detalle) + '</p>' : '') +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" class="btn btn-accent" data-of-cal="' + o.id + '" style="width:auto;font-size:11px">📌 Feria al calendario</button>' +
    '<button type="button" class="btn" data-of-tx="' + o.id + '" style="width:auto;font-size:11px">💸 Registrar trato</button>' +
    '<button type="button" class="btn" data-of-share="' + o.id + '" style="width:auto;font-size:11px">📤 Compartir</button>' +
    '<button type="button" class="btn" data-of-edit="' + o.id + '" style="width:auto;font-size:11px">✏️</button>' +
    '<button type="button" class="btn" data-of-del="' + o.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
}

function paintOfertas() {
  var box = $('monOfList'); if (!box) return;
  var q = (ofQuery || '').toLowerCase().trim();
  var list = store().ofertas.filter(function (o) {
    if (ofFiltro === 'ofrezco' && o.tipo !== 'ofrezco') return false;
    if (ofFiltro === 'necesito' && o.tipo !== 'necesito') return false;
    if (ofFiltro === 'trueque' && !o.trueque) return false;
    if (q && ((o.titulo + ' ' + o.detalle + ' ' + o.cat).toLowerCase().indexOf(q) < 0)) return false;
    return true;
  });
  var ct = $('monOfCount');
  if (ct) ct.textContent = list.length + ' / ' + store().ofertas.length + ' publicaciones';
  if (!list.length) {
    box.innerHTML = store().ofertas.length
      ? '<p class="muted">Sin resultados. Prueba otra búsqueda.</p>'
      : '<p class="muted" style="font-size:11px;line-height:1.55">Aún no hay ofertas ni pedidos. Publica la primera abajo: 1 oferta y 1 pedido por persona es la semilla de la red. 🌱</p>';
    return;
  }
  var ord = list.slice().sort(function (a, b) {
    if (a.tipo !== b.tipo) return a.tipo === 'ofrezco' ? -1 : 1;
    return String(b.creado || '').localeCompare(String(a.creado || ''));
  });
  box.innerHTML = '<div class="menstrual-card"><h4>📋 Ofertas y pedidos · ' + list.length + '</h4>' + ord.map(ofCard).join('') + '</div>';
  box.querySelectorAll('[data-of-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta publicación?')) return;
      var s = store();
      s.ofertas = s.ofertas.filter(function (x) { return x.id !== b.getAttribute('data-of-del'); });
      save('Borrado'); render();
    };
  });
  box.querySelectorAll('[data-of-edit]').forEach(function (b) {
    b.onclick = function () {
      var o = store().ofertas.filter(function (x) { return x.id === b.getAttribute('data-of-edit'); })[0];
      if (!o) return;
      ofEditId = o.id;
      $('monOfTipo').value = o.tipo; $('monOfCat').value = o.cat || '📌 Otro';
      $('monOfTitulo').value = o.titulo || ''; $('monOfDetalle').value = o.detalle || '';
      $('monOfPrecio').value = o.precio || '';
      $('monOfTrueque').checked = !!o.trueque; $('monOfMixto').checked = !!o.mixto;
      $('monOfSave').textContent = '↻ Actualizar';
      $('monOfCancel').classList.remove('hidden');
      try { $('monOfTitulo').focus(); } catch (e) {}
    };
  });
  box.querySelectorAll('[data-of-share]').forEach(function (b) {
    b.onclick = async function () {
      var o = store().ofertas.filter(function (x) { return x.id === b.getAttribute('data-of-share'); })[0];
      if (!o) return;
      var c = cuenta();
      await share((o.tipo === 'ofrezco' ? '🙌 Ofrezco: ' : '🙏 Necesito: ') + o.titulo,
        (o.tipo === 'ofrezco' ? '🙌 Ofrezco' : '🙏 Necesito') + ': ' + o.titulo + '\n' + (o.detalle || '') +
        '\n💰 ' + (o.precio || 'a convenir') + ' ' + (c.unidad || '') + (o.trueque ? ' · 🔄 trueque' : '') + (o.mixto ? ' · 💵 mixto' : ''));
    };
  });
  box.querySelectorAll('[data-of-tx]').forEach(function (b) {
    b.onclick = function () {
      var o = store().ofertas.filter(function (x) { return x.id === b.getAttribute('data-of-tx'); })[0];
      if (!o) return;
      var c = cuenta();
      var num = parseFloat(String(o.precio || '').replace(',', '.'));
      switchTab('tx');
      if ($('monTxConcepto')) $('monTxConcepto').value = clean((o.tipo === 'ofrezco' ? 'Recibí por: ' : 'Pagué por: ') + o.titulo, 80);
      if ($('monTxMonto') && !isNaN(num)) $('monTxMonto').value = (o.tipo === 'ofrezco' ? Math.abs(num) : -Math.abs(num));
      if ($('monTxFecha') && !$('monTxFecha').value) $('monTxFecha').value = todayKey();
      save('Completa el monto y guarda 💸');
    };
  });
  box.querySelectorAll('[data-of-cal]').forEach(function (b) {
    b.onclick = function () {
      var o = store().ofertas.filter(function (x) { return x.id === b.getAttribute('data-of-cal'); })[0];
      if (!o) return;
      var fecha = prompt('¿Qué fecha para la feria/entrega? (AAAA-MM-DD)', todayKey());
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;
      var ref = null;
      try { if (typeof lunaMapForKey === 'function') ref = lunaMapForKey(fecha); } catch (e) {}
      if (!ref) { alert('Esa fecha está fuera del ciclo visible.'); return; }
      var texto = clean('[Feria 🪙] ' + o.titulo + (o.precio ? ' · ' + o.precio + ' ' + cuenta().simb : ''), 80);
      try {
        if (ref.luna === 'dft') {
          var u = userData();
          var cyk = u.cycles[String(ref.y)];
          cyk.dft = cyk.dft || { nota: '' };
          cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + texto + ' 10:00' : texto + ' 10:00';
        } else {
          var u2 = userData();
          var c2 = u2.cycles[String(ref.y)];
          if (!c2.moons[String(ref.luna)]) c2.moons[String(ref.luna)] = { days: {} };
          var m = c2.moons[String(ref.luna)];
          if (!m.days[ref.diaN]) m.days[ref.diaN] = { nota: '', animo: -1, agenda: [] };
          m.days[ref.diaN].agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: 10, minute: 0, time: '10:00', text: texto, notify: false, notified: false });
        }
        save('📌 Feria agendada ✓');
        try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch (e2) {}
      } catch (e) { alert('No se pudo agendar.'); }
    };
  });
}

function paintTx() {
  var box = $('monTxList'); if (!box) return;
  var c = cuenta();
  var txs = store().txs.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  if (!txs.length) { box.innerHTML = '<p class="muted" style="font-size:11px">Sin transacciones. Registra la primera arriba.</p>'; return; }
  box.innerHTML = '<div class="menstrual-card"><h4>💸 Transacciones · ' + txs.length + '</h4>' + txs.map(function (t) {
    var m = Number(t.monto) || 0;
    var col = m >= 0 ? '#8fd694' : '#e8a06a';
    return '<div class="habit-item" style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span><b style="color:' + col + '">' + (m >= 0 ? '+' : '') + esc(fmtMonto(m, c.simb)) + '</b> · ' + esc(t.concepto || '') +
      '<br><span class="muted" style="font-size:11px">' + esc(t.fecha || '') + (t.contraparte ? ' · ' + esc(t.contraparte) : '') + '</span></span>' +
      '<span style="display:flex;gap:6px;flex:0 0 auto"><button type="button" class="btn" data-txedit="' + t.id + '" style="width:auto;font-size:11px">✏️</button>' +
      '<button type="button" class="btn" data-txdel="' + t.id + '" style="width:auto;font-size:11px;color:#e76e8a">✕</button></span></div>';
  }).join('') + '</div>';
  box.querySelectorAll('[data-txdel]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta transacción? (Cambia tu balance)')) return;
      var s = store();
      s.txs = s.txs.filter(function (x) { return x.id !== b.getAttribute('data-txdel'); });
      save('Borrada'); render();
    };
  });
  box.querySelectorAll('[data-txedit]').forEach(function (b) {
    b.onclick = function () {
      var t = store().txs.filter(function (x) { return x.id === b.getAttribute('data-txedit'); })[0];
      if (!t) return;
      txEditId = t.id;
      $('monTxFecha').value = t.fecha || todayKey();
      $('monTxCon').value = t.contraparte || '';
      $('monTxConcepto').value = t.concepto || '';
      $('monTxMonto').value = t.monto;
      $('monTxSave').textContent = '↻ Actualizar';
      $('monTxCancel').classList.remove('hidden');
      try { $('monTxConcepto').focus(); } catch (e) {}
    };
  });
}

function paintAcuerdos() {
  try {
    var s = store();
    document.querySelectorAll('#monAcuerdosBox input[data-acuerdo]').forEach(function (inp) {
      var k = inp.getAttribute('data-acuerdo');
      if (document.activeElement !== inp) inp.checked = !!(s.acuerdos && s.acuerdos[k]);
    });
    var n = ACUERDOS_BASE.filter(function (a) { return s.acuerdos && s.acuerdos[a.id]; }).length;
    var st = $('monAcuerdosStats');
    if (st) st.textContent = n + ' / ' + ACUERDOS_BASE.length + ' acuerdos · ' + (n === ACUERDOS_BASE.length ? '🪙 Red andando' : n >= 3 ? '🌿 Ya hay red' : '🌱 Empieza por el nombre y el tope');
  } catch (e) {}
  var box = $('monTratosList');
  if (box) {
    var tr = store().tratos.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    if (!tr.length) box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin tratos anotados. Guarda el primero arriba después de tu feria.</p>';
    else box.innerHTML = tr.map(function (r) {
      return '<div class="hora-item"><span style="font-size:12px">🤝 <b>' + esc(r.texto || '') + '</b><br><span class="muted" style="font-size:10px">' + esc(r.fecha || '') + '</span></span>' +
        '<button type="button" class="btn btn-icon mon-trato-del" data-k="' + esc(r.id) + '">✕</button></div>';
    }).join('');
    box.querySelectorAll('.mon-trato-del').forEach(function (x) {
      x.onclick = function () {
        var s2 = store();
        s2.tratos = (s2.tratos || []).filter(function (r) { return r.id !== x.dataset.k; });
        save(); render();
      };
    });
  }
}

function render() {
  if (!$('monedaDialog')) return;
  paintHoy();
  paintEcoBox();
  paintBilletera();
  paintOfertas();
  paintTx();
  paintAcuerdos();
}

function open(tab) {
  ensureDialog();
  wireOnce();
  switchTab(tab || monTab || 'guia');
  openDlg('monedaDialog');
}

var _wired = false;
function wireOnce() {
  if (_wired) return; _wired = true;
  var ct = $('monCloseTop'), cb = $('monClose');
  if (ct) ct.onclick = function () { try { $('monedaDialog').close(); } catch (e) {} };
  if (cb) cb.onclick = function () { try { $('monedaDialog').close(); } catch (e) {} };
  var tabs = { tabMonGuia: 'guia', tabMonBilletera: 'billetera', tabMonOfertas: 'ofertas', tabMonTx: 'tx', tabMonAcuerdos: 'acuerdos' };
  Object.keys(tabs).forEach(function (id) {
    var b = $(id);
    if (b) b.onclick = function () { switchTab(tabs[id]); };
  });
  /* cuenta */
  var cs = $('monCuentaSave');
  if (cs) cs.onclick = function () {
    var s = store();
    var nombre = clean(($('monNombre') || {}).value, 30).trim();
    s.cuenta = {
      nombre: nombre,
      unidad: clean(($('monUnidad') || {}).value, 20).trim() || 'Lafken',
      simb: clean(($('monSimb') || {}).value, 6).trim() || 'Lf',
      inicial: Number(($('monInicial') || {}).value) || 0,
      tope: ($('monTope') || {}).value === '' ? -50 : (Number($('monTope').value) || 0)
    };
    save(nombre ? 'Cuenta guardada 🪙' : 'Moneda configurada 🪙');
    render();
  };
  var hs = $('monHistShare');
  if (hs) hs.onclick = async function () {
    var txs = store().txs;
    if (!txs.length) return alert('Sin movimientos aún');
    var c = cuenta();
    var t = '🪙 ' + (c.unidad || 'Moneda social') + ' — ' + (c.nombre || 'mi cuenta') + ' · Balance ' + fmtMonto(balance(), c.simb) + '\n' +
      txs.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); }).map(function (r) {
        var m = Number(r.monto) || 0;
        return '• ' + r.fecha + ' ' + (m >= 0 ? '+' : '') + fmtMonto(m, c.simb) + ' — ' + (r.concepto || '') + (r.contraparte ? ' (' + r.contraparte + ')' : '');
      }).join('\n');
    await share('Mi moneda social', t);
  };
  var hc = $('monHistClear');
  if (hc) hc.onclick = function () {
    if (!confirm('¿Borrar todas tus transacciones? (El balance vuelve al inicial)')) return;
    try { store().txs = []; } catch (e) {}
    save(); render();
  };
  /* ofertas */
  var q = $('monOfSearch');
  if (q) q.addEventListener('input', function () { ofQuery = q.value; paintOfertas(); });
  var f = $('monOfFiltro');
  if (f) f.onchange = function () { ofFiltro = f.value; paintOfertas(); };
  var os = $('monOfSave');
  if (os) os.onclick = function () {
    var titulo = clean(($('monOfTitulo') || {}).value, 60).trim();
    if (!titulo) { alert('Ponle título a tu oferta o pedido'); return; }
    var rec = {
      tipo: ($('monOfTipo') || {}).value || 'ofrezco',
      cat: ($('monOfCat') || {}).value || '📌 Otro',
      titulo: titulo,
      detalle: clean(($('monOfDetalle') || {}).value, 120),
      precio: clean(($('monOfPrecio') || {}).value, 20),
      trueque: !!($('monOfTrueque') || {}).checked,
      mixto: !!($('monOfMixto') || {}).checked
    };
    var s = store();
    if (ofEditId) {
      s.ofertas = s.ofertas.map(function (o) {
        if (o.id !== ofEditId) return o;
        Object.keys(rec).forEach(function (k) { o[k] = rec[k]; });
        return o;
      });
      ofEditId = null;
      os.textContent = '+ Publicar';
      $('monOfCancel').classList.add('hidden');
      save('Actualizado ✓');
    } else {
      rec.id = uid('of');
      rec.creado = todayKey();
      s.ofertas.push(rec);
      save('Publicado 📋');
    }
    ['monOfTitulo', 'monOfDetalle', 'monOfPrecio'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
    var t1 = $('monOfTrueque'); if (t1) t1.checked = false;
    var t2 = $('monOfMixto'); if (t2) t2.checked = false;
    render();
  };
  var oc = $('monOfCancel');
  if (oc) oc.onclick = function () {
    ofEditId = null;
    $('monOfSave').textContent = '+ Publicar';
    oc.classList.add('hidden');
    ['monOfTitulo', 'monOfDetalle', 'monOfPrecio'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
  };
  /* transacciones */
  if ($('monTxFecha') && !$('monTxFecha').value) $('monTxFecha').value = todayKey();
  var ts = $('monTxSave');
  if (ts) ts.onclick = function () {
    var concepto = clean(($('monTxConcepto') || {}).value, 80).trim();
    if (!concepto) { alert('Escribe el concepto del trato'); return; }
    var raw = ($('monTxMonto') || {}).value;
    if (raw === '' || raw === null || raw === undefined) { alert('Pon el monto (+ recibí / − pagué)'); return; }
    var monto = Number(raw);
    if (isNaN(monto) || monto === 0) { alert('Monto inválido (usa +10 o −8, distinto de 0)'); return; }
    var rec = {
      fecha: ($('monTxFecha') || {}).value || todayKey(),
      contraparte: clean(($('monTxCon') || {}).value, 40).trim(),
      concepto: concepto,
      monto: Math.round(monto * 100) / 100
    };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rec.fecha)) { alert('Fecha inválida'); return; }
    var s = store();
    if (txEditId) {
      s.txs = s.txs.map(function (t) {
        if (t.id !== txEditId) return t;
        Object.keys(rec).forEach(function (k) { t[k] = rec[k]; });
        return t;
      });
      txEditId = null;
      ts.textContent = '+ Registrar';
      $('monTxCancel').classList.add('hidden');
    } else {
      rec.id = uid('tx');
      s.txs.push(rec);
    }
    save('Transacción guardada 💸');
    $('monTxConcepto').value = ''; $('monTxMonto').value = ''; $('monTxCon').value = '';
    var nb = balance();
    var tp = Number(cuenta().tope);
    if (nb < tp) alert('⚠️ Quedaste bajo tu tope de confianza (' + fmtMonto(tp, cuenta().simb) + '). Compensa ofreciendo algo a la red.');
    render();
  };
  var tc = $('monTxCancel');
  if (tc) tc.onclick = function () {
    txEditId = null;
    $('monTxSave').textContent = '+ Registrar';
    tc.classList.add('hidden');
    $('monTxConcepto').value = ''; $('monTxMonto').value = ''; $('monTxCon').value = '';
  };
  /* acuerdos checklist */
  document.querySelectorAll('#monAcuerdosBox input[data-acuerdo]').forEach(function (inp) {
    inp.onchange = function () {
      var s = store();
      s.acuerdos[inp.getAttribute('data-acuerdo')] = inp.checked;
      save(); paintAcuerdos();
    };
  });
  var ta = $('monTratoAdd');
  if (ta) ta.onclick = function () {
    var txt = clean(($('monTrato') || {}).value, 80).trim();
    if (!txt) { alert('Escribe el trato acordado'); return; }
    var s = store();
    s.tratos.push({ id: uid('tr'), fecha: ($('monTrFecha') || {}).value || todayKey(), texto: txt });
    save('Trato guardado 🤝');
    $('monTrato').value = '';
    render();
  };
}

/* ---------------- SETUP: integra en Comunidad > 🤝 Red Penco -------- */
var BTN_ID = 'btnMoneda';
function ensureSection() {
  var box = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!box) return false;
  var lab = box.querySelector('.sub-label[data-sub="red"]');
  if (!lab) {
    lab = document.createElement('span');
    lab.className = 'sub-label'; lab.setAttribute('data-sub', 'red'); lab.textContent = '🤝 Red Penco';
    var appLab = box.querySelector('.sub-label[data-sub="app"]');
    if (appLab && appLab.parentNode === box) box.insertBefore(lab, appLab);
    else box.appendChild(lab);
  }
  var el = $(BTN_ID);
  if (!el) {
    el = document.createElement('button');
    el.id = BTN_ID; el.className = 'btn'; el.type = 'button';
    box.appendChild(el);
  }
  el.textContent = '🪙 Moneda Social';
  el.setAttribute('data-keywords', 'moneda social moneda comunitaria trueque intercambio feria billetera saldo balance oferta pedido trato pago cobro economia locallafken unidad cuenta red penco deuda confianza');
  try { el.setAttribute('data-sub', 'red'); el.dataset.sub = 'red'; } catch (eS) {}
  try {
    var anchor = lab.nextSibling;
    box.insertBefore(lab, el);
    box.insertBefore(el, anchor);
  } catch (eO) {}
  if (!el.dataset.monW) { el.dataset.monW = '1'; el.addEventListener('click', function () { open('guia'); }); }
  return true;
}
function registerVisibility() {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf(BTN_ID) < 0) ALL_BTNS.push(BTN_ID); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME[BTN_ID] = ['comunidad', 'red']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      var k = 'comunidad|red';
      if (!BTN_ORDER[k]) BTN_ORDER[k] = [];
      if (BTN_ORDER[k].indexOf(BTN_ID) < 0) BTN_ORDER[k].push(BTN_ID);
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p] && p !== 'esencial') PRESETS[p][BTN_ID] = true;
      });
      if (PRESETS.esencial) PRESETS.esencial[BTN_ID] = true;
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
}

var _retry = 0;
function setup() {
  var ok = ensureSection();
  if (!ok || typeof userData !== 'function') {
    _retry++;
    if (_retry < 80) setTimeout(setup, 500);
    return;
  }
  ensureDialog();
  registerVisibility();
  wireOnce();
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
}

function unidad() { try { return cuenta().unidad || 'Lafken'; } catch (e) { return 'Lafken'; } }
window.MonedaSocial = { open: open, tab: switchTab, store: store, balance: balance, unidad: unidad, cuenta: cuenta };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(setup, 1800);

})();
