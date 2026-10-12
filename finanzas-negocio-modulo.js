/* ============================================================
   FINANZAS NEGOCIO / EMPRENDIMIENTO — Calendario 13 Lunas
   Apartado: Hogar y Vida Práctica > 🍽️ Casa (btnBizFinanzas)
   Sección completa y SEPARADA de las finanzas personales:
   - Pestañas: 📊 Resumen | 💸 Movimientos | 🏷️ Productos y precios |
     🧾 Deudas y metas | 📖 Guía emprendedora.
   - Resumen: perfil del negocio, balance mes gregoriano + luna 28 días,
     margen %, avance de meta, punto de equilibrio, gastos por categoría,
     calculadora rápida de precio (costo + margen + IVA 19%).
   - Movimientos: ingresos/egresos del negocio con categoría, método,
     cliente/proveedor, documento (boleta/factura), filtros, editar,
     exportar CSV, compartir, borrar mes.
   - Productos: catálogo con costo, precio, margen $/%, precio con IVA,
     stock y valor de inventario.
   - Deudas y metas: cuentas por cobrar/pagar con abonos, préstamos,
     metas de ahorro/inversión con barra de avance.
   - Guía: separar platas, fijar precios, punto de equilibrio,
     formalización en Chile (SII, MEF, patente), fondos (FOSIS, Sercotec,
     Fomento Productivo Penco), ferias locales, ritual de luna 5 min.
   Todo local y privado por usuario: userData().finanzasNegocio
     { perfil:{nombre,rubro,metaMensual,costosFijos}, movs:[],
       productos:[], deudas:[], metas:[] }
   100% offline. Sin dependencias externas.
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
function uid(p) { return (p || 'bz') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado ✓'); } catch (e) {} }
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function monthKeyOf(dateStr) { return String(dateStr || '').slice(0, 7); }
function fmtCLP(n) {
  var v = parseInt(n, 10) || 0;
  try { return '$' + v.toLocaleString('es-CL'); } catch (e) { return '$' + v; }
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
function lunaTxt(key) {
  try { if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' d' + r.diaN; } } catch (e) {}
  try { if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' d' + m.dia; } } catch (e2) {}
  return '';
}

/* ---------------- catálogos ---------------- */
var RUBROS = ['🥘 Comida y repostería', '🐟 Mar y pesca', '🌾 Huerta y campo', '🎨 Artesanía y arte', '👕 Ropa y textil', '💇 Belleza', '🔧 Oficios y reparaciones', '💻 Servicios digitales', '📚 Clases y cursos', '🏠 Hogar y construcción', '🚐 Transporte y fletes', '💚 Salud y cuidado', '📌 Otro'];
var CAT_ING = ['Ventas productos', 'Servicios', 'Pedidos / Encargos', 'Feria / Evento', 'Online / Delivery', 'Otros ingresos'];
var CAT_EGR = ['Insumos / Materia prima', 'Envases / Etiquetas', 'Arriendo local / taller', 'Luz / Agua / Internet negocio', 'Transporte / Fletes', 'Sueldos / Ayuda', 'Marketing / Publicidad', 'Equipos / Herramientas', 'Impuestos / SII / Patente', 'Deuda / Crédito negocio', 'Otros egresos'];
var METODOS = ['Efectivo', 'Transferencia', 'Tarjeta débito', 'Tarjeta crédito', 'MercadoPago / App', 'Trueque / Moneda social', 'Otro'];
var DOCS = ['Sin documento', 'Boleta', 'Factura', 'Guía despacho', 'Comprobante simple'];

var GUIA = [
  { ico: '✂️', t: 'Separa las platas desde hoy', d: 'La regla que salva negocios: 1 cuenta/billetera para el negocio y otra para la casa. Págate un "sueldo" fijo (aunque sea chico) y no saques a cada rato. Si mezclas, nunca sabrás si ganaste o perdiste.', tip: 'Parte hoy: 2 sobres o 2 cuentas. Todo lo del negocio entra y sale solo por la del negocio.' },
  { ico: '🏷️', t: 'Pon precio que pague todo', d: 'Precio = costo insumos + costo hora + gastos fijos prorrateados + margen + IVA (19% si das boleta/factura). Vender barato para "tener clientes" te deja trabajando gratis.', tip: 'Si un pan te cuesta $800 hacerlo y quieres 40% de margen: $800 / (1 - 0,40) = $1.333 → cobra $1.350 o $1.500 con IVA.' },
  { ico: '⚖️', t: 'Punto de equilibrio de tu mes', d: 'Suma tus costos fijos del mes (arriendo, luz, internet, sueldos base). Eso dividido por tu margen promedio te dice cuánto DEBES vender para no perder. Esta app lo calcula solo en Resumen.', tip: 'Fijos $200.000 y margen 40% → debes vender $500.000 para empatar. Todo lo extra es ganancia.' },
  { ico: '🧾', t: 'Formalízate paso a paso (Chile)', d: '1) Inicio de actividades en SII.cl (persona natural o EIRL). 2) Boleta electrónica gratuita del SII. 3) Microempresa Familiar (MEF) en la Municipalidad de Penco si trabajas en tu casa: patente más barata y rápida. 4) Cuenta RUT o cuenta vista separada.', tip: 'DIDECO y Fomento Productivo de Penco orientan gratis. No pagues de más por trámites que son gratuitos.' },
  { ico: '🚀', t: 'Fondos y cursos en Penco', d: 'Escuela Activa Penco (Sercotec + municipio): iniciación de actividades, resolución sanitaria, vitrinismo y redes. Luego postula a Capital Semilla / Abeja Sercotec y FOSIS Yo Emprendo. OMIL tiene cursos SENCE gratuitos (ventas, cocina, informática).', tip: 'Guarda boletas y fotos de tu trabajo desde ya: las piden en todas las postulaciones.' },
  { ico: '🎪', t: 'Vende en las ferias de la comuna', d: 'Plaza Los Conquistadores (primer fin de semana del mes), Feria Navideña (diciembre, 200+ emprendedores) y ferias de Lirquén. Lleva precios visibles, vuelto, bolsa y QR de pago. Anota cada feria como movimiento "Feria / Evento".', tip: 'Fiesta del Cholguazo y ferias de emprendedoras son vitrina: 1 buen fin de semana paga el mes.' },
  { ico: '🤝', t: 'Conecta con la red local', d: 'Publica tu oferta en 🪙 Moneda Social (parte en moneda + parte en $) y registra tu ficha en 🏪 Economía Local para que te encuentren en Penco. Los primeros clientes están a 3 cuadras.', tip: 'Trueque inteligente: cambia excedente por lo que te falta (ej. pan por verdura) y anótalo igual.' },
  { ico: '🌙', t: 'Ritual de luna del negocio (5 min)', d: 'Cada luna: 1) ¿Vendí más que la luna pasada? 2) Top 3 gastos del negocio. 3) 1 producto que más margen dejó → empújalo. 4) 1 gasto a recortar. 5) Abona aunque sea $5.000 a tu meta.', tip: 'Luna llena = cobrar deudas. Luna nueva = planificar compras y precios.' }
];
var ERRORES = [
  { t: 'Cobrar solo el insumo', d: 'Olvidas tu hora, el gas, la luz, el delivery y el envase. Suma TODO antes de poner precio.' },
  { t: 'Fiar sin fecha ni monto escrito', d: 'Todo fiado va aquí en Deudas con nombre, monto y fecha. Sin registro, se pierde.' },
  { t: 'Comprar stock de más', d: 'Compra chico, vende, recompra. El stock parado es plata muerta.' },
  { t: 'No guardar para impuestos', d: 'Si das boleta, el 19% no es tuyo. Apártalo al tiro en tu meta "IVA".' },
  { t: 'Mezclar casa y negocio', d: 'El negocio "presta" para la casa y nunca vuelve. Sueldo fijo, siempre.' }
];

/* ---------------- store ---------------- */
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { perfil: null, movs: [], productos: [], deudas: [], metas: [] };
    if (!u.finanzasNegocio) u.finanzasNegocio = { perfil: null, movs: [], productos: [], deudas: [], metas: [] };
    var r = u.finanzasNegocio;
    if (!r.perfil) r.perfil = { nombre: '', rubro: RUBROS[0], metaMensual: 0, costosFijos: 0 };
    if (!Array.isArray(r.movs)) r.movs = [];
    if (!Array.isArray(r.productos)) r.productos = [];
    if (!Array.isArray(r.deudas)) r.deudas = [];
    if (!Array.isArray(r.metas)) r.metas = [];
    return r;
  } catch (e) { return { perfil: { nombre: '', rubro: RUBROS[0], metaMensual: 0, costosFijos: 0 }, movs: [], productos: [], deudas: [], metas: [] }; }
}
function totals(list) {
  var ing = 0, egr = 0;
  list.forEach(function (e) { var v = parseInt(e.monto, 10) || 0; if (e.tipo === 'ingreso') ing += v; else egr += v; });
  return { ing: ing, egr: egr, util: ing - egr };
}
function lunaEntries() {
  var out = [];
  try {
    if (typeof cycle === 'undefined' || !cycle) return out;
    var s = store();
    var cur = (typeof currentView !== 'undefined' && currentView) ? currentView : null;
    if (!cur || cur.tipo === 'dft') return out;
    var days = cycle.days.filter(function (d) { return d.luna === cur.luna; });
    var keys = {};
    days.forEach(function (d) { try { keys[cal.fmtKey.format(new Date(d.noonMs))] = true; } catch (e) {} });
    s.movs.forEach(function (e) { if (keys[e.date]) out.push(e); });
  } catch (e) {}
  return out;
}

/* ---------------- diálogo ---------------- */
var bizTab = 'resumen';
var bizEditMov = null, bizEditProd = null, bizEditDeuda = null, bizEditMeta = null;
var bizQ = '', bizMonth = '';

function ensureDialog() {
  var d = $('bizFinDialog');
  if (d) return d;
  d = document.createElement('dialog');
  d.id = 'bizFinDialog';
  var guiaHTML = GUIA.map(function (g) {
    return '<div class="si-card"><h4>' + g.ico + ' ' + esc(g.t) + '</h4><p>' + esc(g.d) + '</p>' +
      (g.tip ? '<p class="fin-tip-tip">💡 ' + esc(g.tip) + '</p>' : '') + '</div>';
  }).join('');
  var errHTML = ERRORES.map(function (g) {
    return '<div class="help-card"><h4>⚠️ ' + esc(g.t) + '</h4><p>' + esc(g.d) + '</p></div>';
  }).join('');
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">💼 Finanzas de mi Negocio</h3>' +
    '<button type="button" id="bizCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Cuentas del <b>negocio separadas de la casa</b>. Todo queda <b>privado y local</b> por usuario. Revisa tu utilidad por <b>mes y por luna de 28 días</b>.</p>' +
    '<div id="bizHoyBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="timer-tabs su-ca7e11">' +
    '<button type="button" id="tabBizResumen" class="btn btn-accent su-30e741">📊 Resumen</button>' +
    '<button type="button" id="tabBizMov" class="btn su-30e741">💸 Movimientos</button>' +
    '<button type="button" id="tabBizProd" class="btn su-30e741">🏷️ Productos y precios</button>' +
    '<button type="button" id="tabBizDeuda" class="btn su-30e741">🧾 Deudas y metas</button>' +
    '<button type="button" id="tabBizGuia" class="btn su-30e741">📖 Guía</button>' +
    '</div>' +
    /* RESUMEN */
    '<div id="bizPanelResumen">' +
    '<div class="menstrual-card su-68a1a9"><h4>🏪 Mi negocio</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Nombre * <input type="text" id="bizNombre" placeholder="ej: Amasandería La Luna, Taller Penco" maxlength="50"></label>' +
    '<label>Rubro <select id="bizRubro">' + RUBROS.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Meta ventas mes $ <input type="number" id="bizMeta" min="0" step="1000" placeholder="ej: 500000"></label>' +
    '<label>Costos fijos mes $ <input type="number" id="bizFijos" min="0" step="1000" placeholder="arriendo+luz+sueldos base"></label></div>' +
    '<p class="muted su-11a508">Costos fijos = lo que pagas aunque no vendas (arriendo, luz, internet, sueldo base). Sirve para tu punto de equilibrio.</p>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="bizPerfilSave" class="btn btn-accent su-30e741">💾 Guardar perfil</button></div></div>' +
    '<div id="bizResumenBox" class="su-d2c171"></div>' +
    '<div id="bizLunaBox" class="menstrual-card su-d2c171"></div>' +
    '<div id="bizCatBox" class="menstrual-card su-d2c171"></div>' +
    '<div class="menstrual-card su-51d56a"><h4>🧮 Calculadora rápida de precio</h4>' +
    '<div class="conv-row"><label>Costo total $ <input type="number" id="bizCalcCosto" min="0" step="100" placeholder="insumos+hora+gastos"></label>' +
    '<label>Margen deseado % <input type="number" id="bizCalcMargen" min="0" max="95" value="40"></label>' +
    '<label class="check-row su-ffd20f"><input type="checkbox" id="bizCalcIva" checked> + IVA 19%</label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="bizCalcBtn" class="btn btn-accent su-30e741">Calcular precio</button></div>' +
    '<div id="bizCalcOut" class="chip su-7600c4">Pon tu costo y margen para ver el precio sugerido.</div></div>' +
    '</div>' +
    /* MOVIMIENTOS */
    '<div id="bizPanelMov" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Nuevo movimiento del negocio</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="bizDate"></label>' +
    '<label>Tipo <select id="bizTipo"><option value="ingreso">💰 Ingreso (venta)</option><option value="egreso">💸 Egreso (gasto/costo)</option></select></label>' +
    '<label>Categoría <select id="bizCat"></select></label></div>' +
    '<div class="conv-row"><label class="su-97445a">Monto $ <input type="number" id="bizMonto" min="0" step="100" placeholder="ej: 15000"></label>' +
    '<label>Método <select id="bizMetodo">' + METODOS.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select></label>' +
    '<label>Documento <select id="bizDoc">' + DOCS.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Cliente / Proveedor <input type="text" id="bizContra" placeholder="ej: Feria Plaza, Marta (pedido), Proveedor harina" maxlength="50"></label>' +
    '<label>Detalle <input type="text" id="bizDesc" placeholder="ej: 20 panes + 2 kuchen, compra harina 10kg" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="bizAdd" class="btn btn-accent su-30e741">+ Guardar</button>' +
    '<button type="button" id="bizUpdate" class="btn hidden su-30e741">↻ Actualizar</button>' +
    '<button type="button" id="bizCancelEdit" class="btn hidden su-30e741">Cancelar</button></div></div>' +
    '<div class="conv-row su-d2c171"><label class="su-4b3de7">🔍 Buscar <input type="text" id="bizFilter" placeholder="detalle, cliente, categoría..." autocomplete="off"></label>' +
    '<label>Mes <input type="month" id="bizMonthFilter"></label></div>' +
    '<div id="bizListBox" class="habits-list su-e50587"></div>' +
    '<div class="dlg-actions su-efea1d"><span id="bizStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="bizExport" class="btn su-30e741">📥 CSV</button>' +
    '<button type="button" id="bizShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="bizClear" class="btn su-214f75">🗑 Borrar mes</button></span></div>' +
    '</div>' +
    /* PRODUCTOS */
    '<div id="bizPanelProd" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Producto / Servicio</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Nombre * <input type="text" id="bizProdNombre" placeholder="ej: Pan amasado c/u, Corte + barba" maxlength="50"></label>' +
    '<label>Tipo <select id="bizProdTipo"><option>Producto</option><option>Servicio</option><option>Pack / Promo</option></select></label></div>' +
    '<div class="conv-row"><label>Costo $ <input type="number" id="bizProdCosto" min="0" step="50" placeholder="cuánto te cuesta"></label>' +
    '<label>Precio venta $ <input type="number" id="bizProdPrecio" min="0" step="50" placeholder="a cuánto lo vendes"></label>' +
    '<label>Stock <input type="number" id="bizProdStock" min="0" step="1" placeholder="opcional"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="bizProdSave" class="btn btn-accent su-30e741">+ Guardar</button>' +
    '<button type="button" id="bizProdCancel" class="btn hidden su-30e741">Cancelar</button></div>' +
    '<p class="muted su-11a508">Margen = (precio − costo) / precio. Si es menor a 30%, revisa tu precio con la calculadora del Resumen.</p></div>' +
    '<div id="bizProdStats" class="menstrual-card su-d2c171"></div>' +
    '<div id="bizProdList" class="su-d2c171"></div>' +
    '</div>' +
    /* DEUDAS Y METAS */
    '<div id="bizPanelDeuda" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Cuenta por cobrar / pagar</h4>' +
    '<div class="conv-row"><label>Tipo <select id="bizDeudaTipo"><option value="cobrar">📥 Por cobrar (me deben)</option><option value="pagar">📤 Por pagar (yo debo)</option></select></label>' +
    '<label class="su-4b3de7">Contraparte * <input type="text" id="bizDeudaQuien" placeholder="ej: Marta pedido torta, Proveedor harina" maxlength="50"></label></div>' +
    '<div class="conv-row"><label>Total $ <input type="number" id="bizDeudaTotal" min="0" step="100"></label>' +
    '<label>Abonado $ <input type="number" id="bizDeudaPagado" min="0" step="100" value="0"></label>' +
    '<label>Fecha <input type="date" id="bizDeudaFecha"></label></div>' +
    '<label>Nota <input type="text" id="bizDeudaNota" placeholder="ej: saldo feria, 50% anticipo" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="bizDeudaSave" class="btn btn-accent su-30e741">+ Guardar</button>' +
    '<button type="button" id="bizDeudaCancel" class="btn hidden su-30e741">Cancelar</button></div></div>' +
    '<div id="bizDeudaList" class="su-d2c171"></div>' +
    '<div class="menstrual-card su-51d56a"><h4>🎯 Meta del negocio</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Meta * <input type="text" id="bizMetaNombre" placeholder="ej: Fondo emergencia, Horno nuevo, IVA guardado" maxlength="50"></label>' +
    '<label>Monto $ <input type="number" id="bizMetaMonto" min="0" step="1000"></label></div>' +
    '<div class="conv-row"><label>Ahorrado $ <input type="number" id="bizMetaTiene" min="0" step="100" value="0"></label>' +
    '<label>Fecha objetivo <input type="date" id="bizMetaFecha"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="bizMetaSave" class="btn btn-accent su-30e741">+ Guardar meta</button>' +
    '<button type="button" id="bizMetaCancel" class="btn hidden su-30e741">Cancelar</button></div></div>' +
    '<div id="bizMetaList" class="su-d2c171"></div>' +
    '</div>' +
    /* GUIA */
    '<div id="bizPanelGuia" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4 class="su-e39eba">📖 Guía emprendedora — Penco y Chile</h4>' +
    '<p class="muted su-11a508">No es asesoría profesional: son hábitos que funcionan. Para dudas tributarias ve a SII.cl, DIDECO o Fomento Productivo de Penco (gratis).</p></div>' +
    '<div class="discipline-grid su-d2c171">' + guiaHTML + '</div>' +
    '<div class="menstrual-card su-d2c171"><h4>⚠️ 5 errores que funden emprendimientos</h4><div class="help-grid su-fe7b49">' + errHTML + '</div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🔗 Conecta tus otras secciones</h4>' +
    '<p class="muted su-11a508">🏪 Economía Local: crea tu ficha para que te encuentren. 🪙 Moneda Social: acepta parte en moneda en ferias. 💰 Finanzas personales: tu "sueldo" del negocio entra ahí como ingreso.</p>' +
    '<div class="su-bab623"><button type="button" id="bizGoEco" class="btn su-337714">🏪 Economía Local</button>' +
    '<button type="button" id="bizGoMoneda" class="btn su-337714">🪙 Moneda Social</button>' +
    '<button type="button" id="bizGoFin" class="btn su-337714">💰 Finanzas personales</button></div></div>' +
    '</div>' +
    '<div class="dlg-actions"><button type="button" id="bizClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}

/* ---------------- renders ---------------- */
function switchTab(t) {
  bizTab = t;
  var map = { resumen: ['bizPanelResumen', 'tabBizResumen'], mov: ['bizPanelMov', 'tabBizMov'], prod: ['bizPanelProd', 'tabBizProd'], deuda: ['bizPanelDeuda', 'tabBizDeuda'], guia: ['bizPanelGuia', 'tabBizGuia'] };
  Object.keys(map).forEach(function (k) {
    var p = $(map[k][0]), b = $(map[k][1]);
    if (p) p.classList.toggle('hidden', k !== t);
    if (b) b.classList.toggle('btn-accent', k === t);
  });
  render();
}
function filteredMovs() {
  var s = store();
  var q = (bizQ || '').toLowerCase().trim();
  return s.movs.filter(function (e) {
    if (bizMonth && monthKeyOf(e.date) !== bizMonth) return false;
    if (q && ((e.desc || '') + ' ' + (e.contra || '') + ' ' + (e.categoria || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function paintHoy() {
  var b = $('bizHoyBox'); if (!b) return;
  try {
    var s = store();
    var mk = new Date().toISOString().slice(0, 7);
    var t = totals(s.movs.filter(function (e) { return monthKeyOf(e.date) === mk; }));
    var tk = todayKey();
    var hoyIng = s.movs.filter(function (e) { return e.date === tk && e.tipo === 'ingreso'; }).reduce(function (a, x) { return a + (parseInt(x.monto, 10) || 0); }, 0);
    var nom = s.perfil.nombre ? esc(s.perfil.nombre) : 'Mi negocio (ponle nombre en Resumen)';
    b.innerHTML = '<div class="su-49710b"><span><b>💼 ' + nom + '</b></span>' +
      '<span class="chip" style="border-color:' + (t.util >= 0 ? '#8fd69455' : '#e76e8a55') + ';color:' + (t.util >= 0 ? '#8fd694' : '#e76e8a') + '">Utilidad ' + mk + ': ' + fmtCLP(t.util) + '</span></div>' +
      '<p class="muted su-954796">' + s.movs.length + ' movimiento(s) · ' + s.productos.length + ' producto(s) · Hoy ingresado: <b>' + fmtCLP(hoyIng) + '</b>' +
      (s.perfil.metaMensual ? ' · Meta ' + fmtCLP(s.perfil.metaMensual) : '') + '</p>';
  } catch (e) {}
}
function paintResumen() {
  var box = $('bizResumenBox'); if (!box) return;
  var s = store();
  if ($('bizNombre') && document.activeElement !== $('bizNombre')) $('bizNombre').value = s.perfil.nombre || '';
  if ($('bizRubro') && document.activeElement !== $('bizRubro')) $('bizRubro').value = s.perfil.rubro || RUBROS[0];
  if ($('bizMeta') && document.activeElement !== $('bizMeta')) $('bizMeta').value = s.perfil.metaMensual || '';
  if ($('bizFijos') && document.activeElement !== $('bizFijos')) $('bizFijos').value = s.perfil.costosFijos || '';
  var mk = bizMonth || new Date().toISOString().slice(0, 7);
  var list = s.movs.filter(function (e) { return monthKeyOf(e.date) === mk; });
  var t = totals(list);
  var margen = t.ing ? Math.round(t.util / t.ing * 100) : 0;
  var meta = s.perfil.metaMensual || 0;
  var avMeta = meta ? Math.min(100, Math.round(t.ing / meta * 100)) : 0;
  var fijos = s.perfil.costosFijos || 0;
  var margenProm = t.ing ? (t.util / t.ing) : 0;
  var equilibrio = (fijos && margenProm > 0) ? Math.round(fijos / margenProm) : (fijos ? 0 : 0);
  var colU = t.util >= 0 ? '#8fd694' : '#e76e8a';
  box.innerHTML =
    '<div class="menstrual-card su-0a5cce">' +
    '<div class="su-083eb7"><span class="su-de0080"><b>📊 Balance ' + esc(mk) + '</b></span>' +
    '<span class="chip" style="background:' + colU + ';color:#10142c">Utilidad ' + fmtCLP(t.util) + ' · margen ' + margen + '%</span></div>' +
    '<div class="su-d85a2b">' +
    '<div class="chip su-91a870"><span class="muted su-0d5be0">Ingresos</span><br><b class="su-752b1a">' + fmtCLP(t.ing) + '</b></div>' +
    '<div class="chip su-91a870"><span class="muted su-0d5be0">Egresos</span><br><b class="su-bee171">' + fmtCLP(t.egr) + '</b></div>' +
    '<div class="chip su-91a870"><span class="muted su-0d5be0">Movimientos</span><br><b>' + list.length + '</b></div></div>' +
    (meta ? '<div class="su-8a77e5"><div class="su-dd0575"><span class="muted">Meta ventas ' + fmtCLP(meta) + ' · Llevas ' + fmtCLP(t.ing) + ' (' + avMeta + '%)</span><span style="color:' + (avMeta >= 100 ? '#8fd694' : '#e8c56a') + ';font-weight:700">' + (avMeta >= 100 ? '¡Meta lograda! 🎉' : 'En camino') + '</span></div>' +
    '<div class="su-3425a2"><div style="width:' + Math.min(100, avMeta) + '%;height:100%;background:linear-gradient(90deg,#e8c56a,#8fd694)"></div></div></div>'
      : '<p class="muted su-e13d76">Pon tu meta de ventas del mes arriba para ver tu avance.</p>') +
    (fijos ? '<p class="muted su-e13d76">⚖️ Punto de equilibrio: con fijos de <b>' + fmtCLP(fijos) + '</b> ' +
      (equilibrio ? 'debes vender <b>' + fmtCLP(equilibrio) + '</b> para empatar este mes.' : 'aún sin margen positivo para calcularlo (vende con margen).') + '</p>'
      : '<p class="muted su-e13d76">Anota tus costos fijos arriba y te digo cuánto vender para empatar.</p>') +
    '</div>';
  /* luna */
  var lb = $('bizLunaBox');
  if (lb) {
    try {
      var cur = (typeof currentView !== 'undefined' && currentView) ? currentView : null;
      if (!cur || cur.tipo === 'dft' || typeof cycle === 'undefined' || !cycle) {
        lb.innerHTML = '<p class="muted">🌙 Abre una luna del calendario para ver tu balance lunar de 28 días.</p>';
      } else {
        var le = lunaEntries();
        var lt = totals(le);
        var avg = le.length ? Math.round(lt.ing / 28) : 0;
        var mNombre = (typeof MOONS !== 'undefined' && MOONS[cur.luna - 1]) ? MOONS[cur.luna - 1].nombre : '';
        lb.innerHTML = '<h4 class="su-a80552">🌙 Luna ' + cur.luna + ' · ' + esc(mNombre) + ' — 28 días</h4>' +
          '<div class="su-b022fe">' +
          '<div class="chip su-91a870"><span class="muted su-0d5be0">Ingresos luna</span><br><b class="su-752b1a">' + fmtCLP(lt.ing) + '</b></div>' +
          '<div class="chip su-91a870"><span class="muted su-0d5be0">Egresos luna</span><br><b class="su-bee171">' + fmtCLP(lt.egr) + '</b></div>' +
          '<div class="chip su-91a870"><span class="muted su-0d5be0">Promedio venta/día</span><br><b>' + fmtCLP(avg) + '</b></div></div>' +
          '<p class="muted su-e13d76">' + le.length + ' movimientos en esta luna · Utilidad ' + fmtCLP(lt.util) + ' ' + (lt.util >= 0 ? '😊' : '⚠️') + '</p>';
      }
    } catch (e) {}
  }
  /* categorías */
  var cb = $('bizCatBox');
  if (cb) {
    var egrs = list.filter(function (e) { return e.tipo === 'egreso'; });
    if (!egrs.length) { cb.innerHTML = '<h4 class="su-a80552">📊 Egresos por categoría — ' + esc(mk) + '</h4><p class="muted">Sin egresos este mes.</p>'; }
    else {
      var byC = {};
      egrs.forEach(function (e) { byC[e.categoria] = (byC[e.categoria] || 0) + (parseInt(e.monto, 10) || 0); });
      var sorted = Object.keys(byC).map(function (k) { return [k, byC[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
      var totG = sorted.reduce(function (a, x) { return a + x[1]; }, 0);
      cb.innerHTML = '<h4 class="su-a80552">📊 Egresos por categoría — ' + esc(mk) + ' (' + fmtCLP(totG) + ')</h4>' +
        sorted.map(function (row) {
          var pct = totG ? Math.round(row[1] / totG * 100) : 0;
          return '<div class="su-1c6200"><span class="su-6cb285">' + esc(row[0]) + ' <span class="muted su-11a508">' + fmtCLP(row[1]) + ' · ' + pct + '%</span></span>' +
            '<span class="su-b9cbf7"><span style="display:block;width:' + pct + '%;height:100%;background:linear-gradient(90deg,#e8c56a,#e8a06a)"></span></span></div>';
        }).join('');
    }
  }
}
function paintCatOptions() {
  var sel = $('bizCat'); if (!sel) return;
  var tipo = ($('bizTipo') || {}).value || 'ingreso';
  var cats = tipo === 'ingreso' ? CAT_ING : CAT_EGR;
  sel.innerHTML = cats.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
}
function paintMovs() {
  var box = $('bizListBox'); if (!box) return;
  var list = filteredMovs().slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  var st = $('bizStats');
  if (!list.length) { box.innerHTML = '<p class="muted">Sin movimientos con esos filtros. Agrega el primero arriba.</p>'; if (st) st.textContent = '0 movimientos'; return; }
  box.innerHTML = list.slice(0, 100).map(function (e) {
    var col = e.tipo === 'ingreso' ? '#8fd694' : '#e8a06a';
    var sign = e.tipo === 'ingreso' ? '+' : '−';
    return '<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center;border-left:3px solid ' + col + '">' +
      '<span><b style="color:' + col + '">' + (e.tipo === 'ingreso' ? '💰 ' : '💸 ') + sign + fmtCLP(e.monto) + '</b> — ' + esc(e.categoria) + ' · ' + esc(e.metodo || '') + '<br>' +
      '<span class="muted su-11a508">' + esc(e.date) + ' ' + esc(lunaTxt(e.date)) + (e.contra ? ' · ' + esc(e.contra) : '') + (e.doc && e.doc !== 'Sin documento' ? ' · 🧾 ' + esc(e.doc) : '') + (e.desc ? ' · ' + esc(e.desc) : '') + '</span></span>' +
      '<span class="su-0c0cb1"><button data-id="' + e.id + '" class="btn biz-mov-edit su-337714">✏️</button>' +
      '<button data-id="' + e.id + '" class="btn biz-mov-del su-fd834a">✕</button></span></div>';
  }).join('');
  if (st) { var t = totals(list); st.textContent = list.length + ' mov. · Ing ' + fmtCLP(t.ing) + ' · Egr ' + fmtCLP(t.egr) + ' · Util ' + fmtCLP(t.util); }
  box.querySelectorAll('.biz-mov-edit').forEach(function (b) {
    b.onclick = function () {
      var e = store().movs.filter(function (x) { return x.id === b.dataset.id; })[0];
      if (!e) return;
      bizEditMov = e.id;
      $('bizDate').value = e.date; $('bizTipo').value = e.tipo; paintCatOptions(); $('bizCat').value = e.categoria;
      $('bizMonto').value = e.monto; $('bizMetodo').value = e.metodo || METODOS[0]; $('bizDoc').value = e.doc || DOCS[0];
      $('bizContra').value = e.contra || ''; $('bizDesc').value = e.desc || '';
      $('bizAdd').classList.add('hidden'); $('bizUpdate').classList.remove('hidden'); $('bizCancelEdit').classList.remove('hidden');
    };
  });
  box.querySelectorAll('.biz-mov-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar este movimiento del negocio?')) return;
      var s = store();
      s.movs = s.movs.filter(function (x) { return x.id !== b.dataset.id; });
      save(); render();
    };
  });
}
function prodMargin(p) {
  var c = Number(p.costo) || 0, v = Number(p.precio) || 0;
  if (!v) return { m: 0, pct: 0 };
  return { m: v - c, pct: Math.round((v - c) / v * 100) };
}
function paintProds() {
  var stats = $('bizProdStats'), box = $('bizProdList');
  if (!stats || !box) return;
  var s = store();
  if (!s.productos.length) {
    stats.innerHTML = '<p class="muted">Sin productos aún. Agrega tu primero arriba: con costo y precio ves tu margen al tiro.</p>';
    box.innerHTML = '';
    return;
  }
  var ms = s.productos.map(prodMargin);
  var avg = Math.round(ms.reduce(function (a, x) { return a + x.pct; }, 0) / ms.length);
  var stockVal = s.productos.reduce(function (a, p) { return a + ((Number(p.precio) || 0) * (Number(p.stock) || 0)); }, 0);
  stats.innerHTML = '<h4>📦 Tu catálogo · ' + s.productos.length + '</h4>' +
    '<p class="muted su-11a508">Margen promedio <b>' + avg + '%</b> · Valor inventario (precio × stock) <b>' + fmtCLP(stockVal) + '</b></p>';
  box.innerHTML = s.productos.map(function (p) {
    var mg = prodMargin(p);
    var col = mg.pct >= 40 ? '#8fd694' : (mg.pct >= 25 ? '#e8c56a' : '#e76e8a');
    var conIva = Math.round((Number(p.precio) || 0) * 1.19);
    return '<div class="si-card su-2285bd"><h4 class="su-5e0faa">🏷️ ' + esc(p.nombre) + ' <span class="chip su-0d5be0">' + esc(p.tipo || 'Producto') + '</span></h4>' +
      '<p class="su-6cb285">Costo ' + fmtCLP(p.costo) + ' · Precio ' + fmtCLP(p.precio) + ' (c/IVA ' + fmtCLP(conIva) + ') · <b style="color:' + col + '">Margen ' + fmtCLP(mg.m) + ' (' + mg.pct + '%)</b>' +
      ((p.stock !== '' && p.stock !== null && p.stock !== undefined) ? ' · Stock ' + esc(String(p.stock)) : '') + '</p>' +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn btn-accent su-337714" data-prod-vender="' + p.id + '">💰 Registrar venta</button>' +
      '<button type="button" class="btn su-337714" data-prod-edit="' + p.id + '">✏️</button>' +
      '<button type="button" class="btn su-9b8fb7" data-prod-del="' + p.id + '">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('[data-prod-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este producto?')) return;
      var s2 = store();
      s2.productos = s2.productos.filter(function (x) { return x.id !== b.getAttribute('data-prod-del'); });
      save('Borrado'); render();
    };
  });
  box.querySelectorAll('[data-prod-edit]').forEach(function (b) {
    b.onclick = function () {
      var p = store().productos.filter(function (x) { return x.id === b.getAttribute('data-prod-edit'); })[0];
      if (!p) return;
      bizEditProd = p.id;
      $('bizProdNombre').value = p.nombre || ''; $('bizProdTipo').value = p.tipo || 'Producto';
      $('bizProdCosto').value = p.costo || ''; $('bizProdPrecio').value = p.precio || ''; $('bizProdStock').value = (p.stock === undefined ? '' : p.stock);
      $('bizProdSave').textContent = '↻ Actualizar';
      $('bizProdCancel').classList.remove('hidden');
    };
  });
  box.querySelectorAll('[data-prod-vender]').forEach(function (b) {
    b.onclick = function () {
      var p = store().productos.filter(function (x) { return x.id === b.getAttribute('data-prod-vender'); })[0];
      if (!p) return;
      switchTab('mov');
      if ($('bizTipo')) { $('bizTipo').value = 'ingreso'; paintCatOptions(); }
      if ($('bizMonto')) $('bizMonto').value = p.precio || '';
      if ($('bizDesc')) $('bizDesc').value = clean('Venta: ' + (p.nombre || ''), 80);
      if ($('bizDate') && !$('bizDate').value) $('bizDate').value = todayKey();
      save('Completa y guarda la venta 💰');
    };
  });
}
function paintDeudasMetas() {
  var dl = $('bizDeudaList'), ml = $('bizMetaList');
  var s = store();
  if (dl) {
    if (!s.deudas.length) dl.innerHTML = '<p class="muted su-11a508">Sin cuentas registradas. Anota tus fiados y tus deudas para no perder plata.</p>';
    else {
      var cob = 0, pag = 0;
      dl.innerHTML = '<div class="menstrual-card"><h4>🧾 Cuentas · ' + s.deudas.length + '</h4>' + s.deudas.slice().sort(function (a, b) { return String(a.fecha || '').localeCompare(String(b.fecha || '')); }).map(function (d2) {
        var tot = Number(d2.total) || 0, ab = Number(d2.pagado) || 0, saldo = tot - ab;
        if (d2.tipo === 'cobrar') cob += saldo; else pag += saldo;
        var pct = tot ? Math.min(100, Math.round(ab / tot * 100)) : 0;
        var done = saldo <= 0;
        return '<div class="habit-item" style="border-left:3px solid ' + (d2.tipo === 'cobrar' ? '#8fd694' : '#e8a06a') + '">' +
          '<span><b>' + (d2.tipo === 'cobrar' ? '📥 ' : '📤 ') + esc(d2.quien || '') + '</b> · Saldo <b>' + fmtCLP(saldo) + '</b> <span class="muted su-11a508">de ' + fmtCLP(tot) + ' (' + pct + '% pagado)' + (d2.fecha ? ' · ' + esc(d2.fecha) : '') + (d2.nota ? ' · ' + esc(d2.nota) : '') + (done ? ' · ✅ saldada' : '') + '</span></span>' +
          '<span class="su-c158a9">' +
          (done ? '' : '<button type="button" class="btn btn-accent su-337714" data-deuda-abono="' + d2.id + '">+ Abono</button>') +
          '<button type="button" class="btn su-337714" data-deuda-edit="' + d2.id + '">✏️</button>' +
          '<button type="button" class="btn su-9b8fb7" data-deuda-del="' + d2.id + '">✕</button></span></div>';
      }).join('') +
        '<p class="muted su-e13d76">Te deben <b>' + fmtCLP(cob) + '</b> · Debes <b>' + fmtCLP(pag) + '</b></p></div>';
      dl.querySelectorAll('[data-deuda-del]').forEach(function (b) {
        b.onclick = function () {
          if (!confirm('¿Borrar esta cuenta?')) return;
          store().deudas = store().deudas.filter(function (x) { return x.id !== b.getAttribute('data-deuda-del'); });
          save(); render();
        };
      });
      dl.querySelectorAll('[data-deuda-edit]').forEach(function (b) {
        b.onclick = function () {
          var d3 = store().deudas.filter(function (x) { return x.id === b.getAttribute('data-deuda-edit'); })[0];
          if (!d3) return;
          bizEditDeuda = d3.id;
          $('bizDeudaTipo').value = d3.tipo; $('bizDeudaQuien').value = d3.quien || '';
          $('bizDeudaTotal').value = d3.total || ''; $('bizDeudaPagado').value = d3.pagado || 0;
          $('bizDeudaFecha').value = d3.fecha || ''; $('bizDeudaNota').value = d3.nota || '';
          $('bizDeudaSave').textContent = '↻ Actualizar';
          $('bizDeudaCancel').classList.remove('hidden');
        };
      });
      dl.querySelectorAll('[data-deuda-abono]').forEach(function (b) {
        b.onclick = function () {
          var m = prompt('¿Monto del abono? ($)', '');
          var v = parseInt(m, 10);
          if (!v || v <= 0) return;
          var s3 = store();
          var d4 = s3.deudas.filter(function (x) { return x.id === b.getAttribute('data-deuda-abono'); })[0];
          if (!d4) return;
          d4.pagado = (Number(d4.pagado) || 0) + v;
          save('Abono guardado ✓'); render();
        };
      });
    }
  }
  if (ml) {
    if (!s.metas.length) ml.innerHTML = '<p class="muted su-11a508">Sin metas aún. Crea la primera: fondo de emergencia de 1 mes de fijos.</p>';
    else {
      ml.innerHTML = '<div class="menstrual-card"><h4>🎯 Metas · ' + s.metas.length + '</h4>' + s.metas.map(function (m) {
        var tot = Number(m.monto) || 0, tie = Number(m.tiene) || 0;
        var pct = tot ? Math.min(100, Math.round(tie / tot * 100)) : 0;
        return '<div class="habit-item"><span><b>🎯 ' + esc(m.nombre) + '</b> <span class="muted su-11a508">' + fmtCLP(tie) + ' de ' + fmtCLP(tot) + ' (' + pct + '%)' + (m.fecha ? ' · 🎯 ' + esc(m.fecha) : '') + '</span>' +
          '<span class="su-4fe1f8"><span style="display:block;width:' + pct + '%;height:100%;background:linear-gradient(90deg,#e8c56a,#8fd694)"></span></span></span>' +
          '<span class="su-c158a9">' +
          '<button type="button" class="btn btn-accent su-337714" data-meta-abono="' + m.id + '">+ Abonar</button>' +
          '<button type="button" class="btn su-337714" data-meta-edit="' + m.id + '">✏️</button>' +
          '<button type="button" class="btn su-9b8fb7" data-meta-del="' + m.id + '">✕</button></span></div>';
      }).join('') + '</div>';
      ml.querySelectorAll('[data-meta-del]').forEach(function (b) {
        b.onclick = function () {
          if (!confirm('¿Borrar esta meta?')) return;
          store().metas = store().metas.filter(function (x) { return x.id !== b.getAttribute('data-meta-del'); });
          save(); render();
        };
      });
      ml.querySelectorAll('[data-meta-edit]').forEach(function (b) {
        b.onclick = function () {
          var m2 = store().metas.filter(function (x) { return x.id === b.getAttribute('data-meta-edit'); })[0];
          if (!m2) return;
          bizEditMeta = m2.id;
          $('bizMetaNombre').value = m2.nombre || ''; $('bizMetaMonto').value = m2.monto || '';
          $('bizMetaTiene').value = m2.tiene || 0; $('bizMetaFecha').value = m2.fecha || '';
          $('bizMetaSave').textContent = '↻ Actualizar';
          $('bizMetaCancel').classList.remove('hidden');
        };
      });
      ml.querySelectorAll('[data-meta-abono]').forEach(function (b) {
        b.onclick = function () {
          var m3 = prompt('¿Monto a abonar a la meta? ($)', '');
          var v = parseInt(m3, 10);
          if (!v || v <= 0) return;
          var s4 = store();
          var mt = s4.metas.filter(function (x) { return x.id === b.getAttribute('data-meta-abono'); })[0];
          if (!mt) return;
          mt.tiene = (Number(mt.tiene) || 0) + v;
          save('Abono a meta ✓'); render();
        };
      });
    }
  }
}
function render() {
  if (!$('bizFinDialog')) return;
  paintHoy();
  paintResumen();
  paintMovs();
  paintProds();
  paintDeudasMetas();
}
function buildShareText() {
  var s = store();
  var mk = bizMonth || new Date().toISOString().slice(0, 7);
  var list = s.movs.filter(function (e) { return monthKeyOf(e.date) === mk; });
  var t = totals(list);
  var out = '💼 ' + (s.perfil.nombre || 'Mi negocio') + ' — ' + mk + '\n';
  out += 'Ingresos ' + fmtCLP(t.ing) + ' · Egresos ' + fmtCLP(t.egr) + ' · Utilidad ' + fmtCLP(t.util) + '\n';
  if (s.perfil.metaMensual) out += 'Meta ' + fmtCLP(s.perfil.metaMensual) + ' · ' + (s.perfil.metaMensual ? Math.round(t.ing / s.perfil.metaMensual * 100) : 0) + '%\n';
  var byC = {};
  list.filter(function (e) { return e.tipo === 'egreso'; }).forEach(function (e) { byC[e.categoria] = (byC[e.categoria] || 0) + (parseInt(e.monto, 10) || 0); });
  Object.keys(byC).sort(function (a, b) { return byC[b] - byC[a]; }).slice(0, 5).forEach(function (c) { out += '• ' + c + ': ' + fmtCLP(byC[c]) + '\n'; });
  if (s.deudas.length) {
    var cob = s.deudas.filter(function (d2) { return d2.tipo === 'cobrar'; }).reduce(function (a, d2) { return a + ((Number(d2.total) || 0) - (Number(d2.pagado) || 0)); }, 0);
    var pag = s.deudas.filter(function (d2) { return d2.tipo === 'pagar'; }).reduce(function (a, d2) { return a + ((Number(d2.total) || 0) - (Number(d2.pagado) || 0)); }, 0);
    out += 'Te deben ' + fmtCLP(cob) + ' · Debes ' + fmtCLP(pag) + '\n';
  }
  out += '\n— Mari Küla Küyen · Penco';
  return out;
}
function open(tab) {
  ensureDialog();
  wireOnce();
  if (!bizMonth) bizMonth = new Date().toISOString().slice(0, 7);
  if ($('bizMonthFilter') && !$('bizMonthFilter').value) $('bizMonthFilter').value = bizMonth;
  if ($('bizDate') && !$('bizDate').value) $('bizDate').value = todayKey();
  paintCatOptions();
  switchTab(tab || bizTab || 'resumen');
  openDlg('bizFinDialog');
}

var _wired = false;
function wireOnce() {
  if (_wired) return; _wired = true;
  var ct = $('bizCloseTop'), cb = $('bizClose');
  if (ct) ct.onclick = function () { try { $('bizFinDialog').close(); } catch (e) {} };
  if (cb) cb.onclick = function () { try { $('bizFinDialog').close(); } catch (e) {} };
  var tabs = { tabBizResumen: 'resumen', tabBizMov: 'mov', tabBizProd: 'prod', tabBizDeuda: 'deuda', tabBizGuia: 'guia' };
  Object.keys(tabs).forEach(function (id) {
    var b = $(id);
    if (b) b.onclick = function () { switchTab(tabs[id]); };
  });
  /* perfil */
  var ps = $('bizPerfilSave');
  if (ps) ps.onclick = function () {
    var s = store();
    s.perfil.nombre = clean(($('bizNombre') || {}).value, 50).trim();
    s.perfil.rubro = ($('bizRubro') || {}).value || RUBROS[0];
    s.perfil.metaMensual = parseInt(($('bizMeta') || {}).value, 10) || 0;
    s.perfil.costosFijos = parseInt(($('bizFijos') || {}).value, 10) || 0;
    save('Negocio guardado 💼'); render();
  };
  /* calculadora */
  var calc = $('bizCalcBtn');
  if (calc) calc.onclick = function () {
    var costo = parseFloat(($('bizCalcCosto') || {}).value) || 0;
    var mg = parseFloat(($('bizCalcMargen') || {}).value);
    if (isNaN(mg)) mg = 40;
    var conIva = $('bizCalcIva') ? $('bizCalcIva').checked : true;
    var out = $('bizCalcOut');
    if (!costo || costo <= 0) { if (out) out.textContent = 'Pon un costo mayor a 0.'; return; }
    if (mg < 0 || mg >= 95) { if (out) out.textContent = 'Margen entre 0% y 94%.'; return; }
    var precio = costo / (1 - mg / 100);
    var final = conIva ? precio * 1.19 : precio;
    if (out) out.innerHTML = '💡 Precio sugerido: <b>' + fmtCLP(Math.ceil(final / 10) * 10) + '</b>' +
      ' <span class="muted su-11a508">(base ' + fmtCLP(Math.round(precio)) + (conIva ? ' + IVA 19%' : ' sin IVA') + ' · ganas ' + fmtCLP(Math.round(precio - costo)) + ' por venta)</span>';
  };
  /* movimientos */
  var ts = $('bizTipo');
  if (ts) ts.onchange = function () { paintCatOptions(); };
  var add = $('bizAdd');
  if (add) add.onclick = function () {
    var date = ($('bizDate') || {}).value;
    var monto = parseInt(($('bizMonto') || {}).value, 10);
    if (!date) { alert('Elige fecha'); return; }
    if (!monto || monto <= 0) { alert('Monto debe ser mayor a 0'); return; }
    store().movs.push({
      id: uid('bm'), date: date, tipo: ($('bizTipo') || {}).value || 'ingreso',
      categoria: ($('bizCat') || {}).value || 'Otros ingresos',
      monto: monto, metodo: ($('bizMetodo') || {}).value || METODOS[0],
      doc: ($('bizDoc') || {}).value || DOCS[0],
      contra: clean(($('bizContra') || {}).value, 50).trim(),
      desc: clean(($('bizDesc') || {}).value, 80).trim()
    });
    save();
    $('bizMonto').value = ''; $('bizDesc').value = ''; $('bizContra').value = '';
    render();
  };
  var upd = $('bizUpdate');
  if (upd) upd.onclick = function () {
    var s = store();
    var e = s.movs.filter(function (x) { return x.id === bizEditMov; })[0];
    if (!e) return;
    var monto = parseInt(($('bizMonto') || {}).value, 10);
    if (!monto || monto <= 0) { alert('Monto inválido'); return; }
    e.date = ($('bizDate') || {}).value || e.date;
    e.tipo = ($('bizTipo') || {}).value || e.tipo;
    e.categoria = ($('bizCat') || {}).value || e.categoria;
    e.monto = monto;
    e.metodo = ($('bizMetodo') || {}).value || e.metodo;
    e.doc = ($('bizDoc') || {}).value || e.doc;
    e.contra = clean(($('bizContra') || {}).value, 50).trim();
    e.desc = clean(($('bizDesc') || {}).value, 80).trim();
    bizEditMov = null;
    $('bizAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('bizCancelEdit').classList.add('hidden');
    $('bizMonto').value = ''; $('bizDesc').value = ''; $('bizContra').value = '';
    save(); render();
  };
  var canc = $('bizCancelEdit');
  if (canc) canc.onclick = function () {
    bizEditMov = null;
    $('bizAdd').classList.remove('hidden'); $('bizUpdate').classList.add('hidden'); canc.classList.add('hidden');
    $('bizMonto').value = ''; $('bizDesc').value = ''; $('bizContra').value = '';
  };
  var q = $('bizFilter');
  if (q) q.addEventListener('input', function () { bizQ = q.value; paintMovs(); });
  var mf = $('bizMonthFilter');
  if (mf) mf.onchange = function () { bizMonth = mf.value; paintResumen(); paintMovs(); };
  var ex = $('bizExport');
  if (ex) ex.onclick = function () {
    var s = store();
    if (!s.movs.length) { alert('Sin movimientos para exportar'); return; }
    var csv = 'Fecha,Tipo,Categoria,Monto,Metodo,Documento,ClienteProveedor,Detalle,Luna\n';
    s.movs.slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).forEach(function (e) {
      csv += [e.date, e.tipo, '"' + String(e.categoria || '').replace(/"/g, '') + '"', e.monto, '"' + String(e.metodo || '').replace(/"/g, '') + '"', '"' + String(e.doc || '').replace(/"/g, '') + '"', '"' + String(e.contra || '').replace(/"/g, '').replace(/,/g, ';') + '"', '"' + String(e.desc || '').replace(/"/g, '').replace(/,/g, ';') + '"', lunaTxt(e.date)].join(',') + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'finanzas-negocio-' + todayKey() + '.csv'; a.click();
    try { URL.revokeObjectURL(url); } catch (e) {}
  };
  var sh = $('bizShare');
  if (sh) sh.onclick = async function () { await share('💼 Finanzas de mi Negocio', buildShareText()); };
  var cl = $('bizClear');
  if (cl) cl.onclick = function () {
    if (!bizMonth) { alert('Elige el mes a borrar'); return; }
    if (!confirm('¿Borrar movimientos del negocio del mes ' + bizMonth + '? (No toca tus finanzas personales)')) return;
    var s = store();
    s.movs = s.movs.filter(function (e) { return monthKeyOf(e.date) !== bizMonth; });
    save(); render();
  };
  /* productos */
  var psv = $('bizProdSave');
  if (psv) psv.onclick = function () {
    var nombre = clean(($('bizProdNombre') || {}).value, 50).trim();
    if (!nombre) { alert('Ponle nombre a tu producto o servicio'); return; }
    var rec = {
      nombre: nombre, tipo: ($('bizProdTipo') || {}).value || 'Producto',
      costo: parseInt(($('bizProdCosto') || {}).value, 10) || 0,
      precio: parseInt(($('bizProdPrecio') || {}).value, 10) || 0,
      stock: ($('bizProdStock') || {}).value === '' ? '' : (parseInt($('bizProdStock').value, 10) || 0)
    };
    if (!rec.precio || rec.precio <= 0) { alert('Pon un precio de venta mayor a 0'); return; }
    var s = store();
    if (bizEditProd) {
      s.productos = s.productos.map(function (p) {
        if (p.id !== bizEditProd) return p;
        Object.keys(rec).forEach(function (k) { p[k] = rec[k]; });
        return p;
      });
      bizEditProd = null;
      psv.textContent = '+ Guardar';
      $('bizProdCancel').classList.add('hidden');
      save('Producto actualizado ✓');
    } else {
      rec.id = uid('bp');
      s.productos.push(rec);
      save('Producto guardado 🏷️');
    }
    ['bizProdNombre', 'bizProdCosto', 'bizProdPrecio', 'bizProdStock'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
    render();
  };
  var ppc = $('bizProdCancel');
  if (ppc) ppc.onclick = function () {
    bizEditProd = null;
    $('bizProdSave').textContent = '+ Guardar';
    ppc.classList.add('hidden');
    ['bizProdNombre', 'bizProdCosto', 'bizProdPrecio', 'bizProdStock'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
  };
  /* deudas */
  var ds = $('bizDeudaSave');
  if (ds) ds.onclick = function () {
    var quien = clean(($('bizDeudaQuien') || {}).value, 50).trim();
    if (!quien) { alert('¿Quién? Pon la contraparte'); return; }
    var tot = parseInt(($('bizDeudaTotal') || {}).value, 10) || 0;
    if (!tot || tot <= 0) { alert('Pon el monto total mayor a 0'); return; }
    var rec = {
      tipo: ($('bizDeudaTipo') || {}).value || 'cobrar',
      quien: quien, total: tot,
      pagado: parseInt(($('bizDeudaPagado') || {}).value, 10) || 0,
      fecha: ($('bizDeudaFecha') || {}).value || todayKey(),
      nota: clean(($('bizDeudaNota') || {}).value, 80).trim()
    };
    var s = store();
    if (bizEditDeuda) {
      s.deudas = s.deudas.map(function (d2) {
        if (d2.id !== bizEditDeuda) return d2;
        Object.keys(rec).forEach(function (k) { d2[k] = rec[k]; });
        return d2;
      });
      bizEditDeuda = null;
      ds.textContent = '+ Guardar';
      $('bizDeudaCancel').classList.add('hidden');
    } else {
      rec.id = uid('bd');
      s.deudas.push(rec);
    }
    save('Cuenta guardada 🧾');
    ['bizDeudaQuien', 'bizDeudaTotal', 'bizDeudaNota'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
    if ($('bizDeudaPagado')) $('bizDeudaPagado').value = 0;
    render();
  };
  var dc = $('bizDeudaCancel');
  if (dc) dc.onclick = function () {
    bizEditDeuda = null;
    $('bizDeudaSave').textContent = '+ Guardar';
    dc.classList.add('hidden');
  };
  /* metas */
  var ms = $('bizMetaSave');
  if (ms) ms.onclick = function () {
    var nombre = clean(($('bizMetaNombre') || {}).value, 50).trim();
    if (!nombre) { alert('Ponle nombre a tu meta'); return; }
    var monto = parseInt(($('bizMetaMonto') || {}).value, 10) || 0;
    if (!monto || monto <= 0) { alert('Pon el monto de la meta'); return; }
    var rec = {
      nombre: nombre, monto: monto,
      tiene: parseInt(($('bizMetaTiene') || {}).value, 10) || 0,
      fecha: ($('bizMetaFecha') || {}).value || ''
    };
    var s = store();
    if (bizEditMeta) {
      s.metas = s.metas.map(function (m) {
        if (m.id !== bizEditMeta) return m;
        Object.keys(rec).forEach(function (k) { m[k] = rec[k]; });
        return m;
      });
      bizEditMeta = null;
      ms.textContent = '+ Guardar meta';
      $('bizMetaCancel').classList.add('hidden');
    } else {
      rec.id = uid('bmt');
      s.metas.push(rec);
    }
    save('Meta guardada 🎯');
    ['bizMetaNombre', 'bizMetaMonto'].forEach(function (id) { var x = $(id); if (x) x.value = ''; });
    if ($('bizMetaTiene')) $('bizMetaTiene').value = 0;
    render();
  };
  var mc = $('bizMetaCancel');
  if (mc) mc.onclick = function () {
    bizEditMeta = null;
    $('bizMetaSave').textContent = '+ Guardar meta';
    mc.classList.add('hidden');
  };
  /* puentes */
  var ge = $('bizGoEco');
  if (ge) ge.onclick = function () { try { if (window.NegociosPenco) window.NegociosPenco.open('inicio'); } catch (e) {} };
  var gm = $('bizGoMoneda');
  if (gm) gm.onclick = function () { try { if (window.MonedaSocial) window.MonedaSocial.open('ofertas'); } catch (e) {} };
  var gf = $('bizGoFin');
  if (gf) gf.onclick = function () { try { var b = $('btnFinance'); if (b) b.click(); } catch (e) {} };
}

/* ---------------- setup: botón en Hogar > Casa junto a Finanzas ---------------- */
var BTN_ID = 'btnBizFinanzas';
function ensureSection() {
  var box = document.querySelector('.action-group[data-group="hogar"] .group-btns');
  if (!box) return false;
  var el = $(BTN_ID);
  if (!el) {
    el = document.createElement('button');
    el.id = BTN_ID; el.className = 'btn'; el.type = 'button';
    var ref = $('btnFinance');
    if (ref && ref.parentNode === box) {
      try { box.insertBefore(el, ref.nextSibling); } catch (e) { box.appendChild(el); }
    } else {
      var fin = box.querySelector('#btnFinance');
      if (fin && fin.nextSibling) { try { box.insertBefore(el, fin.nextSibling); } catch (e2) { box.appendChild(el); } }
      else box.appendChild(el);
    }
  }
  el.textContent = '💼 Finanzas Negocio';
  el.setAttribute('data-keywords', 'negocio emprendimiento ventas ingresos egresos costos utilidad margen punto equilibrio precio iva boleta factura stock inventario clientes fiado deuda meta ahorro inversion feria pymes sercotec fosis');
  try { el.setAttribute('data-sub', 'casa'); el.dataset.sub = 'casa'; } catch (eS) {}
  if (!el.dataset.bzW) { el.dataset.bzW = '1'; el.addEventListener('click', function () { open('resumen'); }); }
  return true;
}
function registerVisibility() {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf(BTN_ID) < 0) ALL_BTNS.push(BTN_ID); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME[BTN_ID] = ['hogar', 'casa']; } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined') {
      var k = 'hogar|casa';
      if (!BTN_ORDER[k]) BTN_ORDER[k] = [];
      if (BTN_ORDER[k].indexOf(BTN_ID) < 0) {
        var i = BTN_ORDER[k].indexOf('btnFinance');
        if (i >= 0) BTN_ORDER[k].splice(i + 1, 0, BTN_ID);
        else BTN_ORDER[k].push(BTN_ID);
      }
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) {
        if (PRESETS[p]) PRESETS[p][BTN_ID] = true;
      });
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

window.FinanzasNegocio = { open: open, tab: switchTab, store: store };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);
setTimeout(setup, 1800);

})();
