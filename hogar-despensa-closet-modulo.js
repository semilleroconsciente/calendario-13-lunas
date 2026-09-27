/* ============================================================
   DESPENSA + CLOSET — Calendario 13 Lunas (Penco · Bío-Bío)
   Secciones dentro de Hogar y Vida Práctica > Casa:
   - Botón btnDespensa (🥫 Mi Despensa): inventario de alimentos
     del hogar (qué tengo, cuánto, dónde, vencimiento, mínimo).
     Diálogo despensaDialog con 3 pestañas:
     1) Resumen (totales, stock bajo, por vencer/vencidos)
     2) Alimentos (CRUD + consumir/sumar + enviar a Compras)
     3) Guía (orden FIFO, vencimientos, lista base Penco)
   - Botón btnCloset (👗 Mi Clóset): inventario de ropa del hogar.
     Diálogo closetDialog con 3 pestañas:
     1) Resumen (totales, por categoría, para arreglar/donar)
     2) Ropa (CRUD + filtros + archivo)
     3) Guía (orden, fondo de clóset, cuidado, soltar)
   - Todo local y privado por usuario:
     userData().despensa = { items: [] }
     userData().closet = { items: [] }
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
function diffDays(aKey, bKey) {
  try {
    var a = new Date(aKey + 'T12:00:00').getTime(), b = new Date(bKey + 'T12:00:00').getTime();
    return Math.round((b - a) / 86400000);
  } catch (e) { return 0; }
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

/* ==================== DESPENSA ==================== */
var DES_CATS = ['🌾 Abarrotes', '🥕 Verduras y frutas', '🧊 Congelados', '🧀 Lácteos y huevos', '🍞 Pan y cereales', '🥫 Conservas', '🧂 Aliños y aceites', '☕ Café, té y mate', '🍬 Dulces y snacks', '🥤 Bebidas', '🍗 Proteínas', '📦 Otro'];
var DES_UBIS = ['Despensa / alacena', 'Refrigerador', 'Congelador', 'Bodega', 'Cocina a la vista', 'Otro'];
var DES_UNIDS = ['un', 'kg', 'g', 'L', 'ml', 'paq', 'caja', 'bolsa', 'frasco', 'doc'];

function desStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { items: [] };
    if (!u.despensa) u.despensa = { items: [] };
    if (!Array.isArray(u.despensa.items)) u.despensa.items = [];
    return u.despensa;
  } catch (e) { return { items: [] }; }
}
function desVenceInfo(it) {
  if (!it.vence) return { k: 'sin', txt: 'sin fecha', dias: null };
  var hoy = todayKey();
  var d = diffDays(hoy, it.vence);
  if (d < 0) return { k: 'venc', txt: 'vencido hace ' + Math.abs(d) + ' d', dias: d };
  if (d === 0) return { k: 'hoy', txt: 'vence hoy', dias: d };
  if (d <= 7) return { k: 'prox', txt: 'vence en ' + d + ' d', dias: d };
  return { k: 'ok', txt: 'vence en ' + d + ' d', dias: d };
}
function desBajo(it) {
  var c = parseFloat(it.cant), m = parseFloat(it.min);
  if (isNaN(c)) return false;
  if (isNaN(m)) m = 1;
  return c <= m;
}
function desToShopCat(cat) {
  cat = String(cat || '');
  if (cat.indexOf('Verduras') >= 0) return 'Verduras';
  if (cat.indexOf('Lácteos') >= 0) return 'Lácteos';
  if (cat.indexOf('Pan') >= 0) return 'Panadería';
  if (cat.indexOf('Proteínas') >= 0) return 'Proteínas';
  if (cat.indexOf('Abarrotes') >= 0 || cat.indexOf('Aliños') >= 0 || cat.indexOf('Conservas') >= 0 || cat.indexOf('Café') >= 0) return 'Abarrotes';
  return 'Otros';
}
function desSendToShopping(it) {
  try {
    if (typeof getShoppingData === 'function') {
      var d = getShoppingData();
      var name = it.nombre || 'Producto';
      var qty = (it.cant != null && it.cant !== '' ? it.cant + ' ' + (it.unid || 'un') : '');
      var cat = desToShopCat(it.cat);
      var ex = d.items.find(function (x) { return x.name.toLowerCase() === String(name).toLowerCase() && x.cat === cat && !x.done; });
      if (ex) { alert('Ya está en 🛒 Compras (' + cat + ')'); return; }
      d.items.push({ id: 's' + Date.now(), name: name, qty: qty, cat: cat, done: false });
      save('Agregado a 🛒 Compras');
      alert('Agregado a 🛒 Compras: ' + name);
      return;
    }
  } catch (e) {}
  alert('Abre 🛒 Compras y agrégalo manual: ' + (it.nombre || ''));
}

var DES_TABS = ['Resumen', 'Alimentos', 'Guia'];
function desSwitch(name) {
  DES_TABS.forEach(function (t) {
    var p = $('des' + t), b = $('tabDes' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
var desEditId = null, desFCat = 'todas', desFUbi = 'todas', desFQ = '', desFSolo = false;

function desBuildDialog() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabDesResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabDesAlimentos" class="btn" style="width:auto">🥫 Alimentos</button>' +
    '<button type="button" id="tabDesGuia" class="btn" style="width:auto">📖 Guía</button></div>' +

    '<div id="desResumen"></div>' +

    '<div id="desAlimentos" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ <span id="desFormTitle">Nuevo alimento</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Alimento * <input type="text" id="desNombre" placeholder="ej: Arroz, Lentejas, Aceite, Leche" maxlength="40"></label>' +
    '<label>Categoría <select id="desCat">' + DES_CATS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Cantidad <input type="number" id="desCant" min="0" step="0.5" value="1"></label>' +
    '<label>Unidad <select id="desUnid">' + DES_UNIDS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Mínimo (avisa si baja) <input type="number" id="desMin" min="0" step="0.5" value="1"></label></div>' +
    '<div class="conv-row"><label>Guardado en <select id="desUbi">' + DES_UBIS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Vence <input type="date" id="desVence"></label></div>' +
    '<div class="conv-row"><label class="check-row" style="margin:0"><input type="checkbox" id="desFav"> ⭐ Uso frecuente</label></div>' +
    '<label>Nota <input type="text" id="desNota" placeholder="ej: integral, sin gluten, abierto el lunes" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="desAdd" class="btn btn-accent" style="width:auto">+ Guardar alimento</button>' +
    '<button type="button" id="desCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="desQ" placeholder="nombre, nota..."></label>' +
    '<label>Categoría <select id="desFQ"><option value="todas">Todas</option>' + DES_CATS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Dónde <select id="desFU"><option value="todas">Todos</option>' + DES_UBIS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<label class="check-row" style="margin-top:6px"><input type="checkbox" id="desFSolo"> ⚠️ Ver solo stock bajo / por vencer</label>' +
    '<div id="desList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="desGuia" class="hidden">' +
    '<div class="si-card"><h4>🔄 FIFO: lo primero que entra, primero que sale</h4><p>Lo nuevo va <b>atrás</b>, lo por vencer va <b>adelante a la vista</b>. Marca con plumón la fecha de apertura en frascos y bolsas. Revisa esta lista <b>1 vez por luna</b> antes de ir a la feria: ahorra plata y evita que se eche a perder.</p></div>' +
    '<div class="si-card"><h4>⏰ Vencimientos que sí importan</h4><p><b>Lácteos, huevos, carnes y pan:</b> respeta la fecha. <b>Abarrotes secos</b> (arroz, fideos, legumbres, harina): si están secos y sin bichos, suelen aguantar meses; guíate por olor y textura. <b>Conservas hinchadas u oxidadas:</b> no se abren, se botan. Ante la duda con olor raro o espuma: no se prueba.</p></div>' +
    '<div class="si-card"><h4>🧊 Dónde guardar qué</h4><p><b>Despensa fresca y oscura:</b> arroz, fideos, legumbres, aceite, conservas cerradas. <b>Refrigerador:</b> lácteos, huevos, verduras, frascos abiertos. <b>Congelador:</b> pan extra, carnes, sofrito en cubos, legumbres cocidas porcionadas. Anota aquí el lugar para que toda la casa lo encuentre.</p></div>' +
    '<div class="si-card"><h4>🧺 Base pencón (para no quedar corta la semana)</h4><p>Arroz · fideos · lentejas/porotos · harina · avena · aceite · sal · azúcar · té/café · leche · huevos · cebolla · papa · zanahoria · ajo · jurel/tarros · pan o harina para pan. Marca cada uno con <b>Mínimo</b>: cuando baje a ese número te avisa y lo mandas a 🛒 Compras con un toque.</p></div>' +
    '</div>';

  makeDialog('despensaDialog', '🥫 Mi Despensa — lo que hay en casa',
    'Anota tus alimentos: cantidad, dónde están y cuándo vencen. Te avisa <b>stock bajo</b> y <b>por vencer</b>, y manda faltantes a 🛒 Compras. <b>Privado y local</b>, 100% offline.',
    body);
}

function desRenderResumen() {
  var box = $('desResumen'); if (!box) return;
  var st = desStore();
  var items = st.items;
  var porCat = {};
  items.forEach(function (x) { porCat[x.cat] = (porCat[x.cat] || 0) + 1; });
  var bajos = items.filter(desBajo);
  var vencidos = items.filter(function (x) { return desVenceInfo(x).k === 'venc'; }).sort(function (a, b) { return String(a.vence).localeCompare(String(b.vence)); });
  var prox = items.filter(function (x) { var k = desVenceInfo(x).k; return k === 'hoy' || k === 'prox'; }).sort(function (a, b) { return String(a.vence).localeCompare(String(b.vence)); });

  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>🥫 Mi despensa</h4><p style="font-size:22px;color:var(--gold)"><b>' + items.length + '</b> <span style="font-size:12px">alimentos</span></p>' +
    '<p class="muted" style="font-size:11px">' + (items.length ? Object.keys(porCat).map(function (k) { return esc(k + ': ' + porCat[k]); }).join(' · ') : 'Anota tu primer alimento en 🥫 Alimentos.') + '</p></div>' +
    '<div class="menstrual-card"><h4>⚠️ Alertas</h4><p style="font-size:22px;color:var(--gold)"><b>' + bajos.length + '</b> <span style="font-size:12px">stock bajo</span>' + (vencidos.length ? ' · <b style="color:#e76e8a">' + vencidos.length + ' venc.</b>' : '') + '</p>' +
    '<p class="muted" style="font-size:11px">' + prox.length + ' por vencer (7 días)' + '</p></div></div>' +

    (vencidos.length ? '<div class="menstrual-card" style="margin-top:10px;border-color:#e76e8a"><h4>🔴 Vencidos — revisar hoy</h4>' +
      vencidos.slice(0, 6).map(function (x) {
        return '<div class="hora-item"><span style="font-size:12px">🔴 <b>' + esc(x.nombre) + '</b> <span class="muted">· ' + esc(x.vence || '') + ' · ' + esc(x.ubi || '') + '</span></span>' +
          '<button type="button" class="btn des-shop" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">🛒 Reponer</button></div>';
      }).join('') + '</div>' : '') +

    ((prox.length || bajos.length) ? '<div class="menstrual-card" style="margin-top:10px"><h4>🟡 Atentos esta semana</h4>' +
      bajos.slice(0, 6).map(function (x) {
        return '<div class="hora-item"><span style="font-size:12px">🟡 <b>' + esc(x.nombre) + '</b> <span class="muted">· quedan ' + esc(String(x.cant)) + ' ' + esc(x.unid || '') + ' (mín ' + esc(String(x.min)) + ')</span></span>' +
          '<button type="button" class="btn des-shop" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">🛒 Comprar</button></div>';
      }).join('') +
      prox.slice(0, 6).map(function (x) {
        var v = desVenceInfo(x);
        return '<div class="hora-item"><span style="font-size:12px">⏰ <b>' + esc(x.nombre) + '</b> <span class="muted">· ' + esc(v.txt) + ' (' + esc(x.vence || '') + ')</span></span></div>';
      }).join('') + '</div>' : '') +

    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="desGoAdd" class="btn" style="width:auto">➕ Anotar alimento</button>' +
    '<button type="button" id="desShareBtn" class="btn" style="width:auto">📤 Compartir lista</button></div>';

  var g = $('desGoAdd'); if (g) g.onclick = function () { desSwitch('Alimentos'); };
  var sh = $('desShareBtn'); if (sh) sh.onclick = desShare;
  box.querySelectorAll('.des-shop').forEach(function (b) {
    b.onclick = function () {
      var it = null;
      desStore().items.forEach(function (x) { if (x.id === b.dataset.k) it = x; });
      if (it) desSendToShopping(it);
    };
  });
}

function desShare() {
  var items = desStore().items.slice().sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre)); });
  var bajos = items.filter(desBajo);
  var t = '🥫 Mi despensa — ' + todayKey() + '\nTotal: ' + items.length + ' alimentos' + (bajos.length ? ' · ⚠️ ' + bajos.length + ' con stock bajo' : '') + '\n' +
    items.map(function (x) {
      var v = desVenceInfo(x);
      return '• ' + x.nombre + ' (' + (x.cat || '') + ') · ' + x.cant + ' ' + (x.unid || '') + ' · ' + (x.ubi || '') + (x.vence ? ' · vence ' + x.vence + ' (' + v.txt + ')' : '') + (desBajo(x) ? ' ⚠️' : '');
    }).join('\n');
  share('Mi despensa', t);
}

function desRenderList() {
  var box = $('desList'); if (!box) return;
  var q = (desFQ || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '') : q;
  var list = desStore().items.slice().sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre)); });
  if (desFCat !== 'todas') list = list.filter(function (x) { return x.cat === desFCat; });
  if (desFUbi !== 'todas') list = list.filter(function (x) { return x.ubi === desFUbi; });
  if (desFSolo) list = list.filter(function (x) { return desBajo(x) || desVenceInfo(x).k === 'venc' || desVenceInfo(x).k === 'prox' || desVenceInfo(x).k === 'hoy'; });
  if (q) list = list.filter(function (x) {
    var t = ((x.nombre || '') + ' ' + (x.nota || '') + ' ' + (x.cat || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin alimentos con ese filtro. Anota el primero arriba: ej "Arroz" 🌾 Abarrotes.</p>';
    return;
  }
  box.innerHTML = list.map(function (x) {
    var v = desVenceInfo(x);
    var dot = v.k === 'venc' ? '🔴' : (v.k === 'hoy' || v.k === 'prox') ? '🟡' : desBajo(x) ? '🟡' : '🟢';
    return '<div class="si-card"><h4>' + dot + ' ' + esc(x.nombre) + (x.fav ? ' ⭐' : '') + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(x.cat || '') + '</span>' +
      '<span class="chip" style="font-size:10px">📦 ' + esc(String(x.cant)) + ' ' + esc(x.unid || '') + '</span>' +
      (x.ubi ? '<span class="chip" style="font-size:10px">📍 ' + esc(x.ubi) + '</span>' : '') +
      (x.vence ? '<span class="chip" style="font-size:10px">⏰ ' + esc(x.vence) + ' (' + esc(v.txt) + ')</span>' : '') +
      (desBajo(x) ? '<span class="chip" style="font-size:10px">⚠️ stock bajo</span>' : '') + '</p>' +
      (x.nota ? '<p class="muted">' + esc(x.nota) + '</p>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn des-minus" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">➖ Gasté 1</button>' +
      '<button type="button" class="btn des-plus" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">➕ Sumé 1</button>' +
      '<button type="button" class="btn des-buy" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">🛒 A Compras</button>' +
      '<button type="button" class="btn des-edit" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn des-del" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
  }).join('');
  function byId(id) {
    var f = null;
    desStore().items.forEach(function (x) { if (x.id === id) f = x; });
    return f;
  }
  box.querySelectorAll('.des-minus').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.cant = Math.max(0, (parseFloat(x.cant) || 0) - 1);
      save(); desRenderAll();
    };
  });
  box.querySelectorAll('.des-plus').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.cant = (parseFloat(x.cant) || 0) + 1;
      save(); desRenderAll();
    };
  });
  box.querySelectorAll('.des-buy').forEach(function (b) {
    b.onclick = function () { var x = byId(b.dataset.k); if (x) desSendToShopping(x); };
  });
  box.querySelectorAll('.des-edit').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      desEditId = x.id;
      $('desNombre').value = x.nombre || ''; $('desCat').value = x.cat || DES_CATS[0];
      $('desCant').value = x.cant; $('desUnid').value = x.unid || 'un';
      $('desMin').value = x.min; $('desUbi').value = x.ubi || DES_UBIS[0];
      $('desVence').value = x.vence || ''; $('desFav').checked = !!x.fav;
      $('desNota').value = x.nota || '';
      $('desFormTitle').textContent = 'Editar alimento';
      $('desAdd').textContent = '↻ Actualizar alimento';
      $('desCancel').classList.remove('hidden');
    };
  });
  box.querySelectorAll('.des-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este alimento de la despensa?')) return;
      var st = desStore();
      st.items = st.items.filter(function (x) { return x.id !== b.dataset.k; });
      save(); desRenderAll();
    };
  });
}

function desRenderAll() { desRenderResumen(); desRenderList(); }

/* ==================== CLOSET ==================== */
var CL_CATS = ['👕 Poleras / blusas', '👖 Pantalones / jeans', '👗 Vestidos / faldas', '🧥 Chaquetas / abrigos', '🧶 Chalecos / polerones', '👔 Formal / oficina', '👟 Calzado', '🩲 Ropa interior', '🧣 Accesorios', '🏋️ Deporte', '🌙 Dormir / casa', '👶 Niños', '📦 Otro'];
var CL_UBIS = ['Clóset dormitorio', 'Cajón / cómoda', 'Colgado', 'Caja de temporada', 'Entrada / perchero', 'Otro'];
var CL_TEMPS = ['☀️ Verano', '🍂 Otoño', '❄️ Invierno', '🌸 Primavera', '🔁 Todo el año'];
var CL_ESTADOS = ['😍 Bueno', '🙂 Regular', '🧵 Para arreglar', '💝 Para donar / regalar', '♻️ Para reciclar'];

function clStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { items: [] };
    if (!u.closet) u.closet = { items: [] };
    if (!Array.isArray(u.closet.items)) u.closet.items = [];
    return u.closet;
  } catch (e) { return { items: [] }; }
}

var CL_TABS = ['Resumen', 'Ropa', 'Guia'];
function clSwitch(name) {
  CL_TABS.forEach(function (t) {
    var p = $('clo' + t), b = $('tabClo' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
var clEditId = null, clFCat = 'todas', clFEst = 'todos', clFQ = '';

function clBuildDialog() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabCloResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabCloRopa" class="btn" style="width:auto">👗 Ropa</button>' +
    '<button type="button" id="tabCloGuia" class="btn" style="width:auto">📖 Guía</button></div>' +

    '<div id="cloResumen"></div>' +

    '<div id="cloRopa" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ <span id="cloFormTitle">Nueva prenda</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Prenda * <input type="text" id="cloNombre" placeholder="ej: Polerón gris, Jeans azul, Parka" maxlength="40"></label>' +
    '<label>Categoría <select id="cloCat">' + CL_CATS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Talla <input type="text" id="cloTalla" placeholder="ej: M, 42, 10 años" maxlength="12"></label>' +
    '<label>Color <input type="text" id="cloColor" placeholder="ej: azul, negro" maxlength="20"></label>' +
    '<label>Temporada <select id="cloTemp">' + CL_TEMPS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Guardada en <select id="cloUbi">' + CL_UBIS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Estado <select id="cloEstado">' + CL_ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label class="check-row" style="margin:0"><input type="checkbox" id="cloFav"> ⭐ Favorita</label></div>' +
    '<label>Nota <input type="text" id="cloNota" placeholder="ej: de la feria, le falta un botón, del colegio" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="cloAdd" class="btn btn-accent" style="width:auto">+ Guardar prenda</button>' +
    '<button type="button" id="cloCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div class="conv-row" style="margin-top:10px"><label style="flex:2">🔍 Buscar <input type="text" id="cloQ" placeholder="prenda, color, nota..."></label>' +
    '<label>Categoría <select id="cloFQ"><option value="todas">Todas</option>' + CL_CATS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Estado <select id="cloFE"><option value="todos">Todos</option>' + CL_ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div id="cloList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="cloGuia" class="hidden">' +
    '<div class="si-card"><h4>👗 Fondo de clóset (lo que de verdad se usa)</h4><p>Jeans que queda bien · poleras lisas · polerón abrigado · chaqueta impermeable · zapatillas cómodas · zapatos de cambio · pijama · ropa interior suficiente · 1 tenida presentable. Si ya tienes eso cubierto, lo demás es extra: anótalo y decide con calma.</p></div>' +
    '<div class="si-card"><h4>🔄 Orden que se mantiene solo</h4><p><b>Por categoría y a la vista:</b> lo de diario adelante/colgado, lo de temporada en caja etiquetada. <b>Regla 1×1:</b> entra una prenda, sale una (a donar o reciclar). Revisa este inventario <b>1 vez por luna</b> o al cambio de temporada y marca estado: 🧵 arreglar, 💝 donar, ♻️ reciclar.</p></div>' +
    '<div class="si-card"><h4>🧺 Cuidado para que dure (Penco húmedo)</h4><p>Seca bien antes de guardar (humedad = olor a encierro). Ventila el clóset en días de sol, usa bolsitas de arroz o bicarbonato contra la humedad. Lana y parkas: lavar poco, ventilar harto. Zapatillas: plantillas al sol.</p></div>' +
    '<div class="si-card"><h4>💝 Soltar sin culpa</h4><p>Si no la usaste en <b>1 año</b> (y no es de temporada especial o con valor emocional), márcala 💝 Para donar. Lo manchado/roto sin arreglo va a ♻️ reciclar (punto limpio, trapos). Donar en buen estado abriga a otra familia pencóna.</p></div>' +
    '</div>';

  makeDialog('closetDialog', '👗 Mi Clóset — la ropa que tengo',
    'Anota tu ropa por categoría, talla, dónde está y en qué estado. Te muestra qué hay, qué arreglar y qué donar. <b>Privado y local</b>, 100% offline.',
    body);
}

function clRenderResumen() {
  var box = $('cloResumen'); if (!box) return;
  var items = clStore().items.filter(function (x) { return !x.archivada; });
  var arch = clStore().items.length - items.length;
  var porCat = {};
  items.forEach(function (x) { porCat[x.cat] = (porCat[x.cat] || 0) + 1; });
  var arreglar = items.filter(function (x) { return (x.estado || '').indexOf('arreglar') >= 0; });
  var donar = items.filter(function (x) { return (x.estado || '').indexOf('donar') >= 0; });
  var reciclar = items.filter(function (x) { return (x.estado || '').indexOf('reciclar') >= 0; });
  var favs = items.filter(function (x) { return x.fav; });

  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>👗 Mi clóset</h4><p style="font-size:22px;color:var(--gold)"><b>' + items.length + '</b> <span style="font-size:12px">prendas</span></p>' +
    '<p class="muted" style="font-size:11px">' + (items.length ? Object.keys(porCat).map(function (k) { return esc(k.split(' ')[0] + ' ' + k.split(' ').slice(1).join(' ') + ': ' + porCat[k]); }).join(' · ') : 'Anota tu primera prenda en 👗 Ropa.') + (arch ? '<br>📦 ' + arch + ' archivada(s)' : '') + '</p></div>' +
    '<div class="menstrual-card"><h4>🔄 Circula</h4><p style="font-size:15px">🧵 <b>' + arreglar.length + '</b> arreglar · 💝 <b>' + donar.length + '</b> donar' + (reciclar.length ? ' · ♻️ <b>' + reciclar.length + '</b> reciclar' : '') + '</p>' +
    '<p class="muted" style="font-size:11px">' + favs.length + ' favorita(s) ⭐</p></div></div>' +

    (arreglar.length ? '<div class="menstrual-card" style="margin-top:10px"><h4>🧵 Para arreglar</h4><p class="muted" style="font-size:11px">' + arreglar.slice(0, 6).map(function (x) { return esc(x.nombre + (x.nota ? ' (' + x.nota + ')' : '')); }).join('<br>') + '</p></div>' : '') +
    (donar.length ? '<div class="menstrual-card" style="margin-top:10px"><h4>💝 Para donar / regalar</h4><p class="muted" style="font-size:11px">' + donar.slice(0, 6).map(function (x) { return esc(x.nombre + ' · ' + (x.talla || '?') + ' · ' + (x.ubi || '')); }).join('<br>') + '</p></div>' : '') +

    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="cloGoAdd" class="btn" style="width:auto">➕ Anotar prenda</button>' +
    '<button type="button" id="cloShareBtn" class="btn" style="width:auto">📤 Compartir lista</button></div>';

  var g = $('cloGoAdd'); if (g) g.onclick = function () { clSwitch('Ropa'); };
  var sh = $('cloShareBtn'); if (sh) sh.onclick = clShare;
}

function clShare() {
  var items = clStore().items.filter(function (x) { return !x.archivada; }).sort(function (a, b) { return String(a.cat).localeCompare(String(b.cat)) || String(a.nombre).localeCompare(String(b.nombre)); });
  var t = '👗 Mi clóset — ' + todayKey() + '\nTotal: ' + items.length + ' prendas\n' +
    items.map(function (x) {
      return '• ' + x.nombre + ' (' + (x.cat || '') + (x.talla ? ' · talla ' + x.talla : '') + (x.color ? ' · ' + x.color : '') + ') · ' + (x.ubi || '') + ' · ' + (x.estado || '');
    }).join('\n');
  share('Mi clóset', t);
}

function clRenderList() {
  var box = $('cloList'); if (!box) return;
  var q = (clFQ || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '') : q;
  var list = clStore().items.slice().sort(function (a, b) { return (a.archivada ? 1 : 0) - (b.archivada ? 1 : 0) || String(a.nombre).localeCompare(String(b.nombre)); });
  if (clFCat !== 'todas') list = list.filter(function (x) { return x.cat === clFCat; });
  if (clFEst !== 'todos') list = list.filter(function (x) { return x.estado === clFEst; });
  if (q) list = list.filter(function (x) {
    var t = ((x.nombre || '') + ' ' + (x.color || '') + ' ' + (x.talla || '') + ' ' + (x.nota || '') + ' ' + (x.cat || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin prendas con ese filtro. Anota la primera arriba: ej "Polerón gris" 🧶.</p>';
    return;
  }
  box.innerHTML = list.map(function (x) {
    return '<div class="si-card' + (x.archivada ? '" style="opacity:.6' : '') + '"><h4>' + esc((x.cat || '📦').split(' ')[0] + ' ' + x.nombre) + (x.fav ? ' ⭐' : '') + (x.archivada ? ' <span class="chip" style="font-size:10px">archivada</span>' : '') + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(x.cat || '') + '</span>' +
      (x.talla ? '<span class="chip" style="font-size:10px">📏 ' + esc(x.talla) + '</span>' : '') +
      (x.color ? '<span class="chip" style="font-size:10px">🎨 ' + esc(x.color) + '</span>' : '') +
      (x.temp ? '<span class="chip" style="font-size:10px">' + esc(x.temp) + '</span>' : '') +
      (x.ubi ? '<span class="chip" style="font-size:10px">📍 ' + esc(x.ubi) + '</span>' : '') +
      (x.estado ? '<span class="chip" style="font-size:10px">' + esc(x.estado) + '</span>' : '') + '</p>' +
      (x.nota ? '<p class="muted">' + esc(x.nota) + '</p>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn clo-e" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn clo-a" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">' + (x.archivada ? '📂 Reactivar' : '📦 Archivar') + '</button>' +
      '<button type="button" class="btn clo-d" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
  }).join('');
  function byId(id) {
    var f = null;
    clStore().items.forEach(function (x) { if (x.id === id) f = x; });
    return f;
  }
  box.querySelectorAll('.clo-e').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      clEditId = x.id;
      $('cloNombre').value = x.nombre || ''; $('cloCat').value = x.cat || CL_CATS[0];
      $('cloTalla').value = x.talla || ''; $('cloColor').value = x.color || '';
      $('cloTemp').value = x.temp || CL_TEMPS[4]; $('cloUbi').value = x.ubi || CL_UBIS[0];
      $('cloEstado').value = x.estado || CL_ESTADOS[0]; $('cloFav').checked = !!x.fav;
      $('cloNota').value = x.nota || '';
      $('cloFormTitle').textContent = 'Editar prenda';
      $('cloAdd').textContent = '↻ Actualizar prenda';
      $('cloCancel').classList.remove('hidden');
    };
  });
  box.querySelectorAll('.clo-a').forEach(function (b) {
    b.onclick = function () {
      var x = byId(b.dataset.k); if (!x) return;
      x.archivada = !x.archivada; save(); clRenderAll();
    };
  });
  box.querySelectorAll('.clo-d').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta prenda del clóset?')) return;
      var st = clStore();
      st.items = st.items.filter(function (x) { return x.id !== b.dataset.k; });
      save(); clRenderAll();
    };
  });
}

function clRenderAll() { clRenderResumen(); clRenderList(); }

/* ==================== SETUP ==================== */
function injectBtn(id, txt, kw) {
  try {
    var g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
    if (!g) return;
    if ($(id)) {
      try {
        $(id).setAttribute('data-sub', 'casa');
        var be = $(id);
        var ref0 = g.querySelector('.sub-label[data-sub="energia"]');
        if (ref0 && be && be.nextSibling !== ref0 && be.compareDocumentPosition(ref0) & 4) g.insertBefore(be, ref0);
      } catch (e2) {}
      return;
    }
    var btn = document.createElement('button');
    btn.id = id; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = txt;
    try { btn.setAttribute('data-sub', 'casa'); } catch (eS) {}
    btn.setAttribute('data-keywords', kw);
    var refE = g.querySelector('.sub-label[data-sub="energia"]');
    if (refE) g.insertBefore(btn, refE);
    else g.appendChild(btn);
  } catch (e) {}
}
function registerBtn(id) {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); } catch (e) {}
  try { if (typeof BTN_HOME !== 'undefined') BTN_HOME[id] = ['hogar', 'casa']; } catch (e) {}
  try { if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|casa'] && BTN_ORDER['hogar|casa'].indexOf(id) < 0) BTN_ORDER['hogar|casa'].push(id); } catch (e) {}
  try { if (typeof PRESETS !== 'undefined') Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p][id] = true; }); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="' + id + '"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          var labelTxt = id === 'btnDespensa' ? '🥫 Mi Despensa' : '👗 Mi Clóset';
          lab.innerHTML = '<input type="checkbox" data-btn="' + id + '"> ' + labelTxt;
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis[id] !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible[id] = lab.querySelector('input').checked;
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
}

function setup() {
  injectBtn('btnDespensa', '🥫 Mi Despensa', 'despensa alimentos comida mercaderia alacena refrigerador congelador stock vencimiento vence cantidad guardar provisiones hogar cocina');
  injectBtn('btnCloset', '👗 Mi Clóset', 'closet ropero ropa prenda vestir polera pantalon talla ropa interior calzado donar arreglar temporada guardar hogar');
  registerBtn('btnDespensa');
  registerBtn('btnCloset');
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}

  desBuildDialog();
  clBuildDialog();
  desRenderAll();
  clRenderAll();

  var bd = $('btnDespensa');
  if (bd) bd.onclick = function () { desRenderAll(); desSwitch('Resumen'); openDlg('despensaDialog'); };
  var bc = $('btnCloset');
  if (bc) bc.onclick = function () { clRenderAll(); clSwitch('Resumen'); openDlg('closetDialog'); };

  DES_TABS.forEach(function (t) {
    var tb = $('tabDes' + t);
    if (tb) tb.onclick = function () { desSwitch(t); };
  });
  CL_TABS.forEach(function (t) {
    var tb = $('tabClo' + t);
    if (tb) tb.onclick = function () { clSwitch(t); };
  });

  /* Despensa: guardar */
  var da = $('desAdd');
  if (da) da.onclick = function () {
    var nombre = clean((($('desNombre') || {}).value || '').trim(), 40);
    if (!nombre) return alert('Anota el alimento (ej: Arroz, Lentejas, Aceite)');
    var st = desStore();
    var datos = {
      nombre: nombre, cat: ($('desCat') || {}).value || DES_CATS[0],
      cant: Math.max(0, parseFloat(($('desCant') || {}).value) || 0),
      unid: ($('desUnid') || {}).value || 'un',
      min: Math.max(0, parseFloat(($('desMin') || {}).value) || 0),
      ubi: ($('desUbi') || {}).value || DES_UBIS[0],
      vence: ($('desVence') || {}).value || '',
      fav: !!($('desFav') || {}).checked,
      nota: clean((($('desNota') || {}).value || '').trim(), 100)
    };
    if (desEditId) {
      var ex = null;
      st.items.forEach(function (x) { if (x.id === desEditId) ex = x; });
      if (ex) Object.keys(datos).forEach(function (k) { ex[k] = datos[k]; });
      desEditId = null;
      $('desFormTitle').textContent = 'Nuevo alimento';
      da.textContent = '+ Guardar alimento';
      $('desCancel').classList.add('hidden');
    } else {
      datos.id = uid('de'); datos.creado = todayKey();
      st.items.push(datos);
    }
    save('Alimento guardado 🥫');
    $('desNombre').value = ''; $('desNota').value = ''; $('desVence').value = ''; $('desFav').checked = false;
    desRenderAll();
  };
  var dc = $('desCancel');
  if (dc) dc.onclick = function () {
    desEditId = null;
    $('desFormTitle').textContent = 'Nuevo alimento';
    $('desAdd').textContent = '+ Guardar alimento';
    dc.classList.add('hidden');
    $('desNombre').value = ''; $('desNota').value = '';
  };
  var dq = $('desQ'); if (dq) dq.oninput = function () { desFQ = dq.value; desRenderList(); };
  var dfq = $('desFQ'); if (dfq) dfq.onchange = function () { desFCat = dfq.value; desRenderList(); };
  var dfu = $('desFU'); if (dfu) dfu.onchange = function () { desFUbi = dfu.value; desRenderList(); };
  var dfs = $('desFSolo'); if (dfs) dfs.onchange = function () { desFSolo = dfs.checked; desRenderList(); };

  /* Closet: guardar */
  var ca = $('cloAdd');
  if (ca) ca.onclick = function () {
    var nombre = clean((($('cloNombre') || {}).value || '').trim(), 40);
    if (!nombre) return alert('Anota la prenda (ej: Polerón gris, Jeans azul)');
    var st = clStore();
    var datos = {
      nombre: nombre, cat: ($('cloCat') || {}).value || CL_CATS[0],
      talla: clean((($('cloTalla') || {}).value || '').trim(), 12),
      color: clean((($('cloColor') || {}).value || '').trim(), 20),
      temp: ($('cloTemp') || {}).value || CL_TEMPS[4],
      ubi: ($('cloUbi') || {}).value || CL_UBIS[0],
      estado: ($('cloEstado') || {}).value || CL_ESTADOS[0],
      fav: !!($('cloFav') || {}).checked,
      nota: clean((($('cloNota') || {}).value || '').trim(), 100)
    };
    if (clEditId) {
      var ex = null;
      st.items.forEach(function (x) { if (x.id === clEditId) ex = x; });
      if (ex) Object.keys(datos).forEach(function (k) { ex[k] = datos[k]; });
      clEditId = null;
      $('cloFormTitle').textContent = 'Nueva prenda';
      ca.textContent = '+ Guardar prenda';
      $('cloCancel').classList.add('hidden');
    } else {
      datos.id = uid('cl'); datos.archivada = false; datos.creado = todayKey();
      st.items.push(datos);
    }
    save('Prenda guardada 👗');
    $('cloNombre').value = ''; $('cloTalla').value = ''; $('cloColor').value = ''; $('cloNota').value = ''; $('cloFav').checked = false;
    clRenderAll();
  };
  var cc = $('cloCancel');
  if (cc) cc.onclick = function () {
    clEditId = null;
    $('cloFormTitle').textContent = 'Nueva prenda';
    $('cloAdd').textContent = '+ Guardar prenda';
    cc.classList.add('hidden');
    $('cloNombre').value = ''; $('cloNota').value = '';
  };
  var cq = $('cloQ'); if (cq) cq.oninput = function () { clFQ = cq.value; clRenderList(); };
  var cfq = $('cloFQ'); if (cfq) cfq.onchange = function () { clFCat = cfq.value; clRenderList(); };
  var cfe = $('cloFE'); if (cfe) cfe.onchange = function () { clFEst = cfe.value; clRenderList(); };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
