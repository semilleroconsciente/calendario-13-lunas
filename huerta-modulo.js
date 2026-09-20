/* ============================================================
   MI HUERTA — Calendario 13 Lunas (Penco · Bío-Bío)
   Apartado completo para gestionar tu huerta casera:
   - Botón btnHuerta (Territorio > Tierra y Monte, junto a Siembra)
   - Diálogo huertaDialog con 6 pestañas:
     1) Resumen (m², activos, tareas pendientes, próximas
        cosechas, ocupación por bancal, alertas de asociación)
     2) Bancales (CRUD: nombre, tipo, medidas, sol, suelo)
     3) Cultivos (CRUD: bancal, variedad, fechas, estado,
        cosecha estimada automática + barra de progreso)
     4) Tareas (riego, abonado, desmalezado, plagas, tutorado,
        cosecha… con pendientes/hechas)
     5) Cosechas (kg/unidades por cultivo + totales)
     6) Guía (rotación 4 años, asociaciones, luna, suelo Penco)
   - Todo local y privado por usuario: userData().huerta
     { bancales:[], cultivos:[], tareas:[], cosechas:[] }
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
  return String(s == null ? '' : s).slice(0, n || 300);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function addDaysKey(key, days) {
  try {
    var d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + days);
    return cal.fmtKey.format(d);
  } catch (e) {
    var d2 = new Date(key + 'T12:00:00'); d2.setDate(d2.getDate() + days);
    return d2.getFullYear() + '-' + String(d2.getMonth() + 1).padStart(2, '0') + '-' + String(d2.getDate()).padStart(2, '0');
  }
}
function diffDays(aKey, bKey) {
  try {
    var a = new Date(aKey + 'T12:00:00').getTime(), b = new Date(bKey + 'T12:00:00').getTime();
    return Math.round((b - a) / 86400000);
  } catch (e) { return 0; }
}
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { bancales: [], cultivos: [], tareas: [], cosechas: [] };
    if (!u.huerta) u.huerta = { bancales: [], cultivos: [], tareas: [], cosechas: [] };
    var h = u.huerta;
    if (!Array.isArray(h.bancales)) h.bancales = [];
    if (!Array.isArray(h.cultivos)) h.cultivos = [];
    if (!Array.isArray(h.tareas)) h.tareas = [];
    if (!Array.isArray(h.cosechas)) h.cosechas = [];
    return h;
  } catch (e2) { return { bancales: [], cultivos: [], tareas: [], cosechas: [] }; }
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
function lunaDeHoy() {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(todayKey()); if (r && r.luna !== 'dft') return { luna: r.luna, dia: r.diaN }; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(todayKey()); if (m) return { luna: m.luna, dia: m.dia }; }
  } catch (e) {}
  return null;
}
function asocData() {
  try {
    if (typeof ASOCIACIONES_CULTIVOS !== 'undefined' && ASOCIACIONES_CULTIVOS.length) return ASOCIACIONES_CULTIVOS;
    if (window.pencoData && window.pencoData.ASOCIACIONES_CULTIVOS) return window.pencoData.ASOCIACIONES_CULTIVOS;
  } catch (e) {}
  return [];
}

/* ---------------- REFERENCIAS ---------------- */
var TIPOS_BANCAL = ['Bancal en tierra', 'Bancal alto / cajón', 'Maceta / contenedor', 'Invernadero / túnel', 'Surco', 'Hidropónico', 'Otro'];
var ESTADOS = ['Planificado', 'Almácigo', 'Trasplantado', 'Crecimiento', 'Flor', 'Cosechando', 'Terminado'];
var TIPOS_TAREA = ['Riego', 'Abonado / compost', 'Desmalezado', 'Acolchado / mulch', 'Poda / tutorado', 'Control plagas', 'Cosecha', 'Guardar semillas', 'Preparar suelo', 'Otra'];
var CULTIVOS_REF = [
  { n: 'Tomate', ico: '🍅', dias: 80 }, { n: 'Lechuga', ico: '🥬', dias: 35 },
  { n: 'Zanahoria', ico: '🥕', dias: 75 }, { n: 'Cebolla', ico: '🧅', dias: 120 },
  { n: 'Ajo chilote', ico: '🧄', dias: 180 }, { n: 'Haba', ico: '🫘', dias: 90 },
  { n: 'Arveja', ico: '🟢', dias: 70 }, { n: 'Poroto', ico: '🫘', dias: 65 },
  { n: 'Maíz', ico: '🌽', dias: 100 }, { n: 'Zapallo', ico: '🎃', dias: 100 },
  { n: 'Zapallo italiano', ico: '🥒', dias: 60 }, { n: 'Pepino', ico: '🥒', dias: 65 },
  { n: 'Pimentón', ico: '🫑', dias: 90 }, { n: 'Ají', ico: '🌶️', dias: 95 },
  { n: 'Papa', ico: '🥔', dias: 110 }, { n: 'Betarraga', ico: '🟣', dias: 65 },
  { n: 'Espinaca', ico: '🌿', dias: 45 }, { n: 'Acelga', ico: '🥬', dias: 55 },
  { n: 'Repollo', ico: '🥬', dias: 100 }, { n: 'Brócoli', ico: '🥦', dias: 85 },
  { n: 'Coliflor', ico: '🥦', dias: 90 }, { n: 'Rábano', ico: '🔴', dias: 25 },
  { n: 'Albahaca', ico: '🌱', dias: 45 }, { n: 'Cilantro', ico: '🌿', dias: 40 },
  { n: 'Perejil', ico: '🌿', dias: 70 }, { n: 'Frutilla', ico: '🍓', dias: 90 },
  { n: 'Ciboulette', ico: '🧅', dias: 60 }, { n: 'Rúcula', ico: '🌿', dias: 30 },
  { n: 'Kale', ico: '🥦', dias: 60 }, { n: 'Habas', ico: '🫘', dias: 90 }
];
function refDe(nombre) {
  var q = String(nombre || '').toLowerCase().trim();
  for (var i = 0; i < CULTIVOS_REF.length; i++) {
    if (CULTIVOS_REF[i].n.toLowerCase() === q) return CULTIVOS_REF[i];
  }
  for (var j = 0; j < CULTIVOS_REF.length; j++) {
    if (q.indexOf(CULTIVOS_REF[j].n.toLowerCase()) >= 0 || CULTIVOS_REF[j].n.toLowerCase().indexOf(q) >= 0) return CULTIVOS_REF[j];
  }
  return null;
}
function icoDe(nombre) {
  var r = refDe(nombre);
  return r ? r.ico : '🌱';
}
function diasDe(nombre, fallback) {
  var r = refDe(nombre);
  if (r) return r.dias;
  var f = parseInt(fallback, 10);
  return isNaN(f) ? 60 : f;
}

/* ---------------- LÓGICA ---------------- */
function bancalById(id) {
  var h = store();
  for (var i = 0; i < h.bancales.length; i++) if (h.bancales[i].id === id) return h.bancales[i];
  return null;
}
function cultivoById(id) {
  var h = store();
  for (var i = 0; i < h.cultivos.length; i++) if (h.cultivos[i].id === id) return h.cultivos[i];
  return null;
}
function m2Bancal(b) {
  var l = parseFloat(b.largo) || 0, a = parseFloat(b.ancho) || 0;
  if (l > 0 && a > 0) return Math.round(l * a * 100) / 100;
  return 0;
}
function inicioCultivo(c) { return c.fTrasplante || c.fSiembra || null; }
function fCosechaEst(c) {
  var ini = inicioCultivo(c);
  if (!ini) return null;
  var d = parseInt(c.dias, 10);
  if (isNaN(d)) d = diasDe(c.nombre, 60);
  return addDaysKey(ini, d);
}
function progresoCultivo(c) {
  var ini = inicioCultivo(c);
  if (!ini) return null;
  var d = parseInt(c.dias, 10);
  if (isNaN(d) || d <= 0) d = diasDe(c.nombre, 60);
  var pas = diffDays(ini, todayKey());
  var p = Math.max(0, Math.min(100, Math.round((pas / d) * 100)));
  return { pas: pas, total: d, pct: p, faltan: d - pas };
}
function esActivo(c) { return c.estado !== 'Terminado'; }
function alertasAsociacion() {
  var h = store(), out = [];
  var data = asocData();
  if (!data.length) return out;
  var porBancal = {};
  h.cultivos.forEach(function (c) {
    if (!esActivo(c) || !c.bancalId) return;
    (porBancal[c.bancalId] = porBancal[c.bancalId] || []).push(c.nombre);
  });
  Object.keys(porBancal).forEach(function (bid) {
    var nombres = porBancal[bid];
    var b = bancalById(bid);
    var bNombre = b ? b.nombre : 'Bancal';
    nombres.forEach(function (n) {
      var ref = null;
      data.forEach(function (a) {
        if (a.cultivo.toLowerCase() === String(n).toLowerCase()) ref = a;
      });
      if (!ref || !ref.malas) return;
      nombres.forEach(function (otro) {
        if (otro === n) return;
        ref.malas.forEach(function (mal) {
          if (String(otro).toLowerCase().indexOf(String(mal).toLowerCase()) >= 0 ||
              String(mal).toLowerCase().indexOf(String(otro).toLowerCase()) >= 0) {
            out.push('⚠️ En <b>' + esc(bNombre) + '</b>: ' + esc(n) + ' + ' + esc(otro) + ' no se llevan (' + esc(ref.nota || 'asociación mala') + ')');
          }
        });
      });
    });
  });
  // dedup simple
  var seen = {}, uniq = [];
  out.forEach(function (t) { if (!seen[t]) { seen[t] = 1; uniq.push(t); } });
  return uniq.slice(0, 6);
}

/* ---------------- DIALOGO ---------------- */
var TABS = ['Resumen', 'Bancales', 'Cultivos', 'Tareas', 'Cosechas', 'Guia'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('huerta' + t), b = $('tabHuerta' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

var editBancalId = null, editCultivoId = null, filtroBancal = 'todos', filtroEstado = 'activos';

function bancalOptions(selId) {
  var h = store();
  var activos = h.bancales.filter(function (b) { return !b.archivado; });
  if (!activos.length) return '<option value="">(primero crea un bancal)</option>';
  return activos.map(function (b) {
    var m2 = m2Bancal(b);
    return '<option value="' + esc(b.id) + '">' + esc(b.nombre) + (m2 ? ' · ' + m2 + ' m²' : '') + '</option>';
  }).join('');
}
function cultivoOptions(selId) {
  var h = store();
  var activos = h.cultivos.filter(esActivo);
  if (!activos.length) return '<option value="">(sin cultivos activos)</option>';
  return activos.map(function (c) {
    var b = bancalById(c.bancalId);
    return '<option value="' + esc(c.id) + '">' + esc(icoDe(c.nombre) + ' ' + c.nombre + (c.variedad ? ' ' + c.variedad : '')) + (b ? ' · ' + esc(b.nombre) : '') + '</option>';
  }).join('');
}

function buildDialog() {
  var datalist = '<datalist id="huertaCultDL">' + CULTIVOS_REF.map(function (c) {
    return '<option value="' + esc(c.n) + '">';
  }).join('') + '</datalist>';

  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabHuertaResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabHuertaBancales" class="btn" style="width:auto">🟫 Bancales</button>' +
    '<button type="button" id="tabHuertaCultivos" class="btn" style="width:auto">🌱 Cultivos</button>' +
    '<button type="button" id="tabHuertaTareas" class="btn" style="width:auto">✅ Tareas</button>' +
    '<button type="button" id="tabHuertaCosechas" class="btn" style="width:auto">🧺 Cosechas</button>' +
    '<button type="button" id="tabHuertaGuia" class="btn" style="width:auto">📖 Guía</button></div>' +

    '<div id="huertaResumen"></div>' +

    '<div id="huertaBancales" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ <span id="huertaBancTitle">Nuevo bancal / espacio</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre * <input type="text" id="hbNombre" placeholder="ej: Bancal 1 norte, Cajón tomates" maxlength="40"></label>' +
    '<label>Tipo <select id="hbTipo">' + TIPOS_BANCAL.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Largo (m) <input type="number" id="hbLargo" min="0" step="0.1" placeholder="ej: 3"></label>' +
    '<label>Ancho (m) <input type="number" id="hbAncho" min="0" step="0.1" placeholder="ej: 1"></label>' +
    '<label>Sol <select id="hbSol"><option>Pleno sol (6h+)</option><option>Medio sol (3–6h)</option><option>Sombra parcial</option><option>Invernadero</option></select></label></div>' +
    '<div class="conv-row"><label style="flex:2">Suelo / sustrato <input type="text" id="hbSuelo" placeholder="ej: arcilloso + compost, coco+perlita" maxlength="60"></label></div>' +
    '<label>Notas <input type="text" id="hbNotas" placeholder="ej: junto a la llave, viento sur tapado" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="hbAdd" class="btn btn-accent" style="width:auto">+ Guardar bancal</button>' +
    '<button type="button" id="hbCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div id="huertaBancList" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="huertaCultivos" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ <span id="huertaCultTitle">Nuevo cultivo</span></h4>' +
    '<div class="conv-row"><label>Bancal * <select id="hcBancal"></select></label>' +
    '<label>Estado <select id="hcEstado">' + ESTADOS.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label style="flex:2">Cultivo * <input type="text" id="hcNombre" list="huertaCultDL" placeholder="ej: Tomate, Lechuga" maxlength="30"></label>' +
    '<label>Variedad <input type="text" id="hcVar" placeholder="ej: rosado, manteca" maxlength="30"></label>' +
    '<label>Cant. <input type="number" id="hcCant" min="1" value="4" style="width:70px"></label></div>' + datalist +
    '<div class="conv-row"><label>Siembra <input type="date" id="hcFS"></label>' +
    '<label>Trasplante <input type="date" id="hcFT"></label>' +
    '<label>Días a cosecha <input type="number" id="hcDias" min="10" max="300" value="60" style="width:80px"></label></div>' +
    '<div class="conv-row"><label>Origen <select id="hcOrigen"><option>Siembra directa</option><option>Almácigo propio</option><option>Plantín comprado</option><option>Rebrote / esqueje</option></select></label></div>' +
    '<label>Notas <input type="text" id="hcNota" placeholder="ej: hilera norte-sur, mulch de paja" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="hcAdd" class="btn btn-accent" style="width:auto">+ Guardar cultivo</button>' +
    '<button type="button" id="hcCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div class="conv-row" style="margin-top:10px"><label>Ver bancal <select id="hcFiltroB"><option value="todos">Todos</option></select></label>' +
    '<label>Estado <select id="hcFiltroE"><option value="activos">Activos</option><option value="todos">Todos</option><option value="Planificado">Planificado</option><option value="Almácigo">Almácigo</option><option value="Trasplantado">Trasplantado</option><option value="Crecimiento">Crecimiento</option><option value="Flor">Flor</option><option value="Cosechando">Cosechando</option><option value="Terminado">Terminado</option></select></label></div>' +
    '<div id="huertaCultList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="huertaTareas" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Nueva tarea</h4>' +
    '<div class="conv-row"><label>Tipo <select id="htTipo">' + TIPOS_TAREA.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label>' +
    '<label>Fecha <input type="date" id="htFecha"></label></div>' +
    '<div class="conv-row"><label>Bancal <select id="htBancal"><option value="">—</option></select></label>' +
    '<label>Cultivo <select id="htCultivo"><option value="">—</option></select></label></div>' +
    '<label>Detalle <input type="text" id="htNota" placeholder="ej: regar profundo AM, purín 1:10" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="htAdd" class="btn btn-accent" style="width:auto">+ Guardar tarea</button></div></div>' +
    '<div class="conv-row" style="margin-top:10px"><label>Mostrar <select id="htFiltro"><option value="pendientes">Pendientes</option><option value="todas">Todas</option><option value="hechas">Hechas</option></select></label></div>' +
    '<div id="huertaTarList" class="habits-list" style="margin-top:8px;max-height:280px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="huertaTarStats" class="muted" style="font-size:11px"></span>' +
    '<button type="button" id="htClearHechas" class="btn" style="width:auto">🧹 Borrar hechas</button></div></div>' +

    '<div id="huertaCosechas" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Registrar cosecha</h4>' +
    '<div class="conv-row"><label>Cultivo * <select id="hxCultivo"></select></label>' +
    '<label>Fecha <input type="date" id="hxFecha"></label></div>' +
    '<div class="conv-row"><label>Cantidad * <input type="number" id="hxCant" min="0" step="0.1" placeholder="ej: 2.5"></label>' +
    '<label>Unidad <select id="hxUni"><option>kg</option><option>g</option><option>unidades</option><option>atados</option><option>canastos</option></select></label>' +
    '<label>Calidad <select id="hxCal"><option>Buena</option><option>Regular</option><option>Para guardar</option><option>Para semilla</option></select></label></div>' +
    '<label>Notas <input type="text" id="hxNota" placeholder="ej: primera corta, para ensalada" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="hxAdd" class="btn btn-accent" style="width:auto">+ Guardar cosecha</button></div></div>' +
    '<div id="huertaCosResumen" class="menstrual-card" style="margin-top:10px"></div>' +
    '<div id="huertaCosList" class="habits-list" style="margin-top:10px;max-height:260px"></div></div>' +

    '<div id="huertaGuia" class="hidden">' +
    '<div class="si-card"><h4>🔄 Rotación en 4 grupos (no repitas familia)</h4><p><b>1 Hoja</b> (lechuga, acelga, espinaca) → <b>2 Fruto</b> (tomate, zapallo, maíz) → <b>3 Raíz</b> (zanahoria, betarraga, papa, cebolla) → <b>4 Legumbre</b> (haba, arveja, poroto que devuelve nitrógeno) → vuelve a Hoja. Anota en cada bancal qué hubo la temporada pasada y rota.</p></div>' +
    '<div class="si-card"><h4>🤝 Asociaciones que sí / que no (Penco)</h4><p>Revisa <b>🌱 Siembra lunar → 🤝 Asociaciones</b> para la tabla completa. Reglas cortas: tomate + albahaca ✓ · zanahoria + cebolla ✓ · maíz + poroto + zapallo ✓ (milpa) · papa lejos de tomate ✗ · cebolla/ajo lejos de haba-arveja-poroto ✗. Esta app te avisa en el Resumen si pones enemigos en el mismo bancal.</p></div>' +
    '<div class="si-card"><h4>🌙 Luna para la huerta</h4><p><b>Creciente:</b> siembra hoja y trasplanta. <b>Llena:</b> observa y cosecha hoja fresca. <b>Menguante:</b> siembra raíz (zanahoria, betarraga, ajo), poda, prepara suelo y controla plagas. <b>Nueva:</b> descansa, compostea y planifica. Ver detalle en 🌱 Siembra lunar.</p></div>' +
    '<div class="si-card"><h4>🟫 Suelo de Penco (arcilloso y arenoso)</h4><p>Arcilla en alto + arena en costa: ambas se arreglan igual — <b>compost + mulch</b>. Levanta el bancal 20–30 cm, acolcha con paja/hojas (guarda humedad del sur en verano y evita barro en invierno), y alimenta con té de compost o bocashi 7 días antes de sembrar. No pises el bancal: compactas.</p></div>' +
    '<div class="si-card"><h4>💧 Riego pencono</h4><p>Verano (Walüng): profundo y temprano (06–09h), no encharques al atardecer (babosas). Invierno (Pukem): riega solo si no llueve en 7 días. Mulch de 5 cm ahorra 1 riego de cada 3. Si tienes corte de agua, prioriza almácigos y frutos cuajando.</p></div>' +
    '</div>';

  makeDialog('huertaDialog', '🏡 Mi Huerta — mis bancales y cultivos',
    'Tus espacios, tus siembras, tus tareas y tus cosechas. <b>Privado y local</b> por usuario, conectado con la luna de Penco.',
    body);
}

/* ---------------- RENDER ---------------- */
function refreshSelects() {
  var hb = $('hcBancal');
  if (hb) {
    var cur = hb.value;
    hb.innerHTML = bancalOptions();
    if (cur) hb.value = cur;
  }
  var fb = $('hcFiltroB');
  if (fb) {
    var h = store();
    var curF = filtroBancal;
    fb.innerHTML = '<option value="todos">Todos</option>' + h.bancales.filter(function (b) { return !b.archivado; }).map(function (b) {
      return '<option value="' + esc(b.id) + '">' + esc(b.nombre) + '</option>';
    }).join('');
    fb.value = curF;
  }
  var htB = $('htBancal');
  if (htB) htB.innerHTML = '<option value="">—</option>' + store().bancales.filter(function (b) { return !b.archivado; }).map(function (b) {
    return '<option value="' + esc(b.id) + '">' + esc(b.nombre) + '</option>';
  }).join('');
  var htC = $('htCultivo'), hxC = $('hxCultivo');
  if (htC) htC.innerHTML = '<option value="">—</option>' + cultivoOptions().replace(/<\/?select[^>]*>/g, '');
  if (hxC) {
    var h2 = store();
    var all = h2.cultivos;
    hxC.innerHTML = all.length ? all.map(function (c) {
      var b = bancalById(c.bancalId);
      return '<option value="' + esc(c.id) + '">' + esc(icoDe(c.nombre) + ' ' + c.nombre + (c.variedad ? ' ' + c.variedad : '')) + (b ? ' · ' + esc(b.nombre) : '') + (c.estado === 'Terminado' ? ' (terminado)' : '') + '</option>';
    }).join('') : '<option value="">(sin cultivos — crea uno primero)</option>';
  }
  var fs = $('hcFS');
  if (fs && !fs.value) fs.value = todayKey();
  var tf = $('htFecha'), xf = $('hxFecha');
  if (tf && !tf.value) tf.value = todayKey();
  if (xf && !xf.value) xf.value = todayKey();
}

function renderResumen() {
  var box = $('huertaResumen'); if (!box) return;
  var h = store();
  var hoy = todayKey();
  var bancAct = h.bancales.filter(function (b) { return !b.archivado; });
  var m2 = bancAct.reduce(function (s, b) { return s + m2Bancal(b); }, 0);
  var cultAct = h.cultivos.filter(esActivo);
  var tarPend = h.tareas.filter(function (t) { return !t.hecha; });
  var tarVenc = tarPend.filter(function (t) { return t.fecha && t.fecha < hoy; });
  var l = lunaDeHoy();
  var lunaTip = !l ? 'Mide, riega temprano y anota.' :
    l.luna <= 3 ? 'Pukem: prepara suelo, siembra haba-arveja-ajo, protege del frío.' :
    l.luna <= 6 ? 'Pewü: siembra grande (poroto, maíz, zapallo, lechuga) y trasplanta tomates tras heladas.' :
    l.luna <= 9 ? 'Walüng: riega profundo AM, cosecha a diario, guarda semillas.' :
    'Rimü: siembra otoñal (haba, ajo, lechuga), guarda y composta.';
  var prox = cultAct.map(function (c) {
    return { c: c, f: fCosechaEst(c) };
  }).filter(function (x) { return x.f; }).sort(function (a, b) { return a.f.localeCompare(b.f); }).slice(0, 5);

  var alertas = alertasAsociacion();

  var ocup = bancAct.map(function (b) {
    var cs = cultAct.filter(function (c) { return c.bancalId === b.id; });
    var m2b = m2Bancal(b);
    return { b: b, n: cs.length, m2: m2b, nombres: cs.map(function (c) { return icoDe(c.nombre) + ' ' + c.nombre; }).join(', ') };
  });

  box.innerHTML =
    '<div id="huertaHoyBox" class="menstrual-card" style="border-color:var(--gold)"><h4>🌙 Hoy · ' + esc(hoy) + (l ? ' · Luna ' + l.luna + ' día ' + l.dia : '') + '</h4>' +
    '<p class="muted" style="font-size:12px">' + esc(lunaTip) + '</p></div>' +
    '<div class="fishing-grid" style="margin-top:10px">' +
    '<div class="menstrual-card"><h4>📐 Mi espacio</h4><p style="font-size:22px;color:var(--gold)"><b>' + bancAct.length + '</b> <span style="font-size:12px">bancales</span> · <b>' + (Math.round(m2 * 10) / 10) + '</b> <span style="font-size:12px">m²</span></p>' +
    '<p class="muted" style="font-size:11px">' + cultAct.length + ' cultivos activos · ' + h.cosechas.length + ' cosechas registradas</p></div>' +
    '<div class="menstrual-card"><h4>✅ Tareas</h4><p style="font-size:22px;color:var(--gold)"><b>' + tarPend.length + '</b> <span style="font-size:12px">pendientes</span>' + (tarVenc.length ? ' · <b style="color:#e76e8a">' + tarVenc.length + ' vencidas</b>' : '') + '</p>' +
    '<p class="muted" style="font-size:11px">Pestaña ✅ Tareas para marcar hechas.</p></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🧺 Próximas cosechas</h4>' +
    (prox.length ? prox.map(function (x) {
      var pr = progresoCultivo(x.c);
      var falta = pr ? pr.faltan : diffDays(hoy, x.f);
      var txt = falta > 0 ? 'en ' + falta + ' días' : falta === 0 ? '¡esta semana!' : 'hace ' + Math.abs(falta) + ' días (revisa)';
      var b = bancalById(x.c.bancalId);
      return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(icoDe(x.c.nombre) + ' ' + x.c.nombre) + '</b> · ' + esc(x.f) + ' <span class="chip" style="font-size:10px">' + esc(txt) + '</span><br><span class="muted" style="font-size:10px">' + esc(b ? b.nombre : '') + ' · ' + esc(x.c.estado) + '</span></span></div>';
    }).join('') : '<p class="muted" style="font-size:11px">Sin fechas aún. Agrega cultivos con fecha de siembra y días a cosecha.</p>') + '</div>' +
    (alertas.length ? '<div class="menstrual-card" style="margin-top:10px;border-color:#e8c56a"><h4>🤝 Revisa asociaciones</h4><p class="muted" style="font-size:11px">' + alertas.join('<br>') + '</p></div>' : '') +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🟫 Ocupación por bancal</h4>' +
    (ocup.length ? ocup.map(function (o) {
      return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(o.b.nombre) + '</b>' + (o.m2 ? ' <span class="muted">· ' + o.m2 + ' m²</span>' : '') + '<br><span class="muted" style="font-size:10px">' + (o.nombres ? esc(o.nombres) : 'vacío — listo para sembrar') + '</span></span><span class="chip" style="font-size:10px">' + o.n + ' cult.</span></div>';
    }).join('') : '<p class="muted" style="font-size:11px">Aún no tienes bancales. Crea el primero en 🟫 Bancales.</p>') + '</div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="huertaGoBancal" class="btn" style="width:auto">➕ Agregar mi primer bancal</button>' +
    '<button type="button" id="huertaShareBtn" class="btn" style="width:auto">📤 Compartir resumen</button></div>';

  var gb = $('huertaGoBancal');
  if (gb) gb.onclick = function () { switchTab('Bancales'); };
  var sh = $('huertaShareBtn');
  if (sh) sh.onclick = shareResumen;
}

async function shareResumen() {
  var h = store();
  var cultAct = h.cultivos.filter(esActivo);
  var t = '🏡 Mi huerta en Penco — ' + todayKey() + '\n' +
    'Bancales: ' + h.bancales.filter(function (b) { return !b.archivado; }).length + ' · Cultivos activos: ' + cultAct.length + ' · Cosechas: ' + h.cosechas.length + '\n' +
    cultAct.map(function (c) {
      var b = bancalById(c.bancalId);
      return '• ' + icoDe(c.nombre) + ' ' + c.nombre + (c.variedad ? ' ' + c.variedad : '') + ' · ' + (b ? b.nombre : '?') + ' · ' + c.estado + ' · cosecha est: ' + (fCosechaEst(c) || '?');
    }).join('\n');
  await share('Mi huerta', t);
}

function renderBancales() {
  var box = $('huertaBancList'); if (!box) return;
  var h = store();
  if (!h.bancales.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin bancales. Crea el primero arriba: ej "Bancal 1 norte" 3×1 m.</p>';
    return;
  }
  var s = h.bancales.slice().sort(function (a, b) { return (a.archivado ? 1 : 0) - (b.archivado ? 1 : 0); });
  box.innerHTML = s.map(function (b) {
    var m2 = m2Bancal(b);
    var n = h.cultivos.filter(function (c) { return c.bancalId === b.id && esActivo(c); }).length;
    return '<div class="si-card' + (b.archivado ? '" style="opacity:.6' : '') + '"><h4>🟫 ' + esc(b.nombre) + (b.archivado ? ' <span class="chip" style="font-size:10px">archivado</span>' : '') + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(b.tipo || 'Bancal') + '</span>' +
      (m2 ? '<span class="chip" style="font-size:10px">📐 ' + m2 + ' m² (' + esc(String(b.largo || '?')) + '×' + esc(String(b.ancho || '?')) + ' m)</span>' : '') +
      (b.sol ? '<span class="chip" style="font-size:10px">☀️ ' + esc(b.sol) + '</span>' : '') +
      '<span class="chip" style="font-size:10px">🌱 ' + n + ' activos</span></p>' +
      (b.suelo ? '<p><b>Suelo:</b> ' + esc(b.suelo) + '</p>' : '') +
      (b.notas ? '<p class="muted">' + esc(b.notas) + '</p>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn huerta-b-edit" data-k="' + esc(b.id) + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
      '<button type="button" class="btn huerta-b-cult" data-k="' + esc(b.id) + '" style="width:auto;font-size:11px">🌱 + Cultivo aquí</button>' +
      '<button type="button" class="btn huerta-b-arch" data-k="' + esc(b.id) + '" style="width:auto;font-size:11px">' + (b.archivado ? '📂 Reactivar' : '📦 Archivar') + '</button>' +
      '<button type="button" class="btn huerta-b-del" data-k="' + esc(b.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('.huerta-b-edit').forEach(function (x) {
    x.onclick = function () {
      var b = bancalById(x.dataset.k); if (!b) return;
      editBancalId = b.id;
      $('hbNombre').value = b.nombre || ''; $('hbTipo').value = b.tipo || TIPOS_BANCAL[0];
      $('hbLargo').value = b.largo || ''; $('hbAncho').value = b.ancho || '';
      $('hbSol').value = b.sol || 'Pleno sol (6h+)'; $('hbSuelo').value = b.suelo || ''; $('hbNotas').value = b.notas || '';
      $('huertaBancTitle').textContent = 'Editar bancal';
      $('hbAdd').textContent = '↻ Actualizar bancal';
      $('hbCancel').classList.remove('hidden');
    };
  });
  box.querySelectorAll('.huerta-b-cult').forEach(function (x) {
    x.onclick = function () {
      switchTab('Cultivos');
      refreshSelects();
      var sel = $('hcBancal');
      if (sel) sel.value = x.dataset.k;
      try { $('hcNombre').focus(); } catch (e) {}
    };
  });
  box.querySelectorAll('.huerta-b-arch').forEach(function (x) {
    x.onclick = function () {
      var b = bancalById(x.dataset.k); if (!b) return;
      b.archivado = !b.archivado; save(); renderAll();
    };
  });
  box.querySelectorAll('.huerta-b-del').forEach(function (x) {
    x.onclick = function () {
      var h2 = store();
      var nCult = h2.cultivos.filter(function (c) { return c.bancalId === x.dataset.k && esActivo(c); }).length;
      if (nCult && !confirm('Este bancal tiene ' + nCult + ' cultivo(s) activo(s). ¿Borrar igual? (los cultivos quedarán sin bancal)')) return;
      if (!nCult && !confirm('¿Borrar este bancal?')) return;
      h2.bancales = h2.bancales.filter(function (b) { return b.id !== x.dataset.k; });
      h2.cultivos.forEach(function (c) { if (c.bancalId === x.dataset.k) c.bancalId = ''; });
      save(); renderAll();
    };
  });
}

function renderCultivos() {
  var box = $('huertaCultList'); if (!box) return;
  var h = store();
  var list = h.cultivos.slice().sort(function (a, b) { return (b.fSiembra || '').localeCompare(a.fSiembra || ''); });
  if (filtroBancal !== 'todos') list = list.filter(function (c) { return c.bancalId === filtroBancal; });
  if (filtroEstado === 'activos') list = list.filter(esActivo);
  else if (filtroEstado !== 'todos') list = list.filter(function (c) { return c.estado === filtroEstado; });
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin cultivos con ese filtro. Agrega el primero arriba.</p>';
    return;
  }
  box.innerHTML = list.map(function (c) {
    var b = bancalById(c.bancalId);
    var pr = progresoCultivo(c);
    var fEst = fCosechaEst(c);
    var bar = pr ? '<div style="height:8px;background:var(--panel);border:1px solid var(--line);border-radius:99px;overflow:hidden;margin-top:6px"><div style="height:100%;width:' + pr.pct + '%;background:linear-gradient(90deg,#8fd694,#e8c56a)"></div></div>' +
      '<p class="muted" style="font-size:10px;margin-top:2px">Día ' + Math.max(0, pr.pas) + '/' + pr.total + ' · ' + pr.pct + '% — cosecha est: ' + (fEst || '?') + '</p>' : '';
    return '<div class="si-card"><h4>' + esc(icoDe(c.nombre) + ' ' + c.nombre) + (c.variedad ? ' <small class="muted">' + esc(c.variedad) + '</small>' : '') + '</h4>' +
      '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">🟫 ' + esc(b ? b.nombre : 'sin bancal') + '</span>' +
      '<span class="chip" style="font-size:10px">' + esc(c.estado) + '</span>' +
      (c.cantidad ? '<span class="chip" style="font-size:10px">×' + esc(String(c.cantidad)) + '</span>' : '') +
      (c.fSiembra ? '<span class="chip" style="font-size:10px">🌱 ' + esc(c.fSiembra) + '</span>' : '') + '</p>' +
      bar +
      (c.nota ? '<p class="muted">' + esc(c.nota) + '</p>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      '<button type="button" class="btn huerta-c-next" data-k="' + esc(c.id) + '" style="width:auto;font-size:11px">⏭ Avanzar estado</button>' +
      '<button type="button" class="btn huerta-c-task" data-k="' + esc(c.id) + '" style="width:auto;font-size:11px">✅ + Tarea</button>' +
      '<button type="button" class="btn huerta-c-harv" data-k="' + esc(c.id) + '" style="width:auto;font-size:11px">🧺 Cosechar</button>' +
      '<button type="button" class="btn huerta-c-edit" data-k="' + esc(c.id) + '" style="width:auto;font-size:11px">✏️</button>' +
      '<button type="button" class="btn huerta-c-del" data-k="' + esc(c.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('.huerta-c-edit').forEach(function (x) {
    x.onclick = function () {
      var c = cultivoById(x.dataset.k); if (!c) return;
      editCultivoId = c.id;
      refreshSelects();
      $('hcBancal').value = c.bancalId || '';
      $('hcNombre').value = c.nombre || ''; $('hcVar').value = c.variedad || '';
      $('hcCant').value = c.cantidad || 1; $('hcFS').value = c.fSiembra || '';
      $('hcFT').value = c.fTrasplante || ''; $('hcDias').value = c.dias || diasDe(c.nombre, 60);
      $('hcEstado').value = c.estado || 'Crecimiento'; $('hcOrigen').value = c.origen || 'Siembra directa';
      $('hcNota').value = c.nota || '';
      $('huertaCultTitle').textContent = 'Editar cultivo';
      $('hcAdd').textContent = '↻ Actualizar cultivo';
      $('hcCancel').classList.remove('hidden');
      window.scrollTo(0, 0);
    };
  });
  box.querySelectorAll('.huerta-c-del').forEach(function (x) {
    x.onclick = function () {
      if (!confirm('¿Borrar este cultivo? (se mantienen sus cosechas)')) return;
      var h2 = store();
      h2.cultivos = h2.cultivos.filter(function (c) { return c.id !== x.dataset.k; });
      save(); renderAll();
    };
  });
  box.querySelectorAll('.huerta-c-next').forEach(function (x) {
    x.onclick = function () {
      var c = cultivoById(x.dataset.k); if (!c) return;
      var i = ESTADOS.indexOf(c.estado);
      c.estado = ESTADOS[Math.min(ESTADOS.length - 1, (i < 0 ? 2 : i + 1))];
      save('Estado: ' + c.estado); renderAll();
    };
  });
  box.querySelectorAll('.huerta-c-task').forEach(function (x) {
    x.onclick = function () {
      switchTab('Tareas');
      refreshSelects();
      var sel = $('htCultivo');
      if (sel) sel.value = x.dataset.k;
      var c = cultivoById(x.dataset.k);
      if (c && c.bancalId) $('htBancal').value = c.bancalId;
    };
  });
  box.querySelectorAll('.huerta-c-harv').forEach(function (x) {
    x.onclick = function () {
      var c = cultivoById(x.dataset.k); if (!c) return;
      switchTab('Cosechas');
      refreshSelects();
      var sel = $('hxCultivo');
      if (sel) sel.value = c.id;
      c.estado = 'Cosechando';
      save(); renderAll();
      switchTab('Cosechas');
      refreshSelects();
      $('hxCultivo').value = c.id;
    };
  });
}

function renderTareas() {
  var box = $('huertaTarList'); if (!box) return;
  var h = store();
  var f = ($('htFiltro') || {}).value || 'pendientes';
  var list = h.tareas.slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); });
  if (f === 'pendientes') list = list.filter(function (t) { return !t.hecha; });
  if (f === 'hechas') list = list.filter(function (t) { return t.hecha; });
  var st = $('huertaTarStats');
  var pend = h.tareas.filter(function (t) { return !t.hecha; }).length;
  if (st) st.textContent = h.tareas.length + ' tareas · ' + pend + ' pendientes';
  if (!list.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin tareas aquí. Crea la primera arriba: ej "Riego profundo".</p>';
    return;
  }
  var hoy = todayKey();
  box.innerHTML = list.map(function (t) {
    var c = t.cultivoId ? cultivoById(t.cultivoId) : null;
    var b = t.bancalId ? bancalById(t.bancalId) : (c ? bancalById(c.bancalId) : null);
    var venc = !t.hecha && t.fecha && t.fecha < hoy;
    return '<div class="hora-item' + (t.hecha ? '" style="opacity:.6' : '') + '"><span style="font-size:12px"><b>' + (t.hecha ? '✅' : venc ? '🔴' : '⬜') + ' ' + esc(t.tipo) + '</b> · ' + esc(t.fecha || 'sin fecha') +
      '<br><span class="muted" style="font-size:10px">' + esc(b ? b.nombre + ' · ' : '') + esc(c ? icoDe(c.nombre) + ' ' + c.nombre + ' · ' : '') + esc(t.nota || '') + '</span></span>' +
      '<span class="hora-actions"><button type="button" class="btn btn-icon huerta-t-done" data-k="' + esc(t.id) + '" title="Marcar">' + (t.hecha ? '↩' : '✓') + '</button>' +
      '<button type="button" class="btn btn-icon huerta-t-del" data-k="' + esc(t.id) + '">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.huerta-t-done').forEach(function (x) {
    x.onclick = function () {
      var h2 = store();
      var t = null;
      h2.tareas.forEach(function (tt) { if (tt.id === x.dataset.k) t = tt; });
      if (t) t.hecha = !t.hecha;
      save(); renderAll();
    };
  });
  box.querySelectorAll('.huerta-t-del').forEach(function (x) {
    x.onclick = function () {
      var h2 = store();
      h2.tareas = h2.tareas.filter(function (t) { return t.id !== x.dataset.k; });
      save(); renderAll();
    };
  });
}

function renderCosechas() {
  var box = $('huertaCosList'); if (!box) return;
  var h = store();
  var res = $('huertaCosResumen');
  var s = h.cosechas.slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  var porCult = {};
  s.forEach(function (r) {
    var c = cultivoById(r.cultivoId);
    var n = c ? c.nombre : 'Cultivo borrado';
    if (!porCult[n]) porCult[n] = { n: 0, ico: c ? icoDe(c.nombre) : '🧺' };
    porCult[n].n++;
  });
  var totKg = s.filter(function (r) { return r.unidad === 'kg'; }).reduce(function (t, r) { return t + (parseFloat(r.cantidad) || 0); }, 0);
  if (res) {
    res.innerHTML = '<h4>🧺 Total (' + s.length + ' registros)</h4><p style="font-size:12px">' +
      Object.keys(porCult).map(function (k) { return porCult[k].ico + ' ' + esc(k) + ': <b>' + porCult[k].n + '</b>'; }).join(' · ') + '</p>' +
      (totKg ? '<p class="muted" style="font-size:11px">Suma en kg: <b>' + (Math.round(totKg * 10) / 10) + ' kg</b> (más lo contado en unidades/atados).</p>' : '<p class="muted" style="font-size:11px">Registra cada corta para ver tu producción real por luna.</p>');
  }
  if (!s.length) {
    box.innerHTML = '<p class="muted" style="font-size:11px;text-align:center">Sin cosechas. Registra la primera arriba.</p>';
    return;
  }
  box.innerHTML = s.map(function (r) {
    var c = cultivoById(r.cultivoId);
    var b = c ? bancalById(c.bancalId) : null;
    return '<div class="hora-item"><span style="font-size:12px"><b>' + esc((c ? icoDe(c.nombre) + ' ' + c.nombre : 'Cultivo') + ' · ' + r.cantidad + ' ' + r.unidad) + '</b>' +
      '<br><span class="muted" style="font-size:10px">' + esc(r.fecha || '') + (b ? ' · ' + esc(b.nombre) : '') + ' · ' + esc(r.calidad || '') + (r.nota ? ' · ' + esc(r.nota) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon huerta-x-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.huerta-x-del').forEach(function (x) {
    x.onclick = function () {
      if (!confirm('¿Borrar esta cosecha?')) return;
      var h2 = store();
      h2.cosechas = h2.cosechas.filter(function (r) { return r.id !== x.dataset.k; });
      save(); renderAll();
    };
  });
}

function renderAll() {
  refreshSelects();
  renderResumen();
  renderBancales();
  renderCultivos();
  renderTareas();
  renderCosechas();
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) botón en Territorio > Tierra (junto a Siembra) */
  try {
    if (!$('btnHuerta')) {
      var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnHuerta'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🏡 Mi Huerta';
        try { btn.setAttribute('data-sub', 'tierra'); } catch (eS) {}
        btn.setAttribute('data-keywords', 'huerta mi huerta bancal bancales cultivo cultivos siembra cosecha tarea tareas huerto jardin chacra invernadero maceta cajon surco variedad trasplante almácigo riego abono asociacion rotacion');
        var ref = g.querySelector('#btnSiembra');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnHuerta') < 0) ALL_BTNS.push('btnHuerta');
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnHuerta = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnHuerta"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var hh = gr.querySelector('h5');
        if (hh && hh.textContent.indexOf('Territorio') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnHuerta"> 🏡 Mi Huerta';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnHuerta !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnHuerta = lab.querySelector('input').checked;
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

  /* 2) diálogo */
  buildDialog();
  renderAll();

  var b = $('btnHuerta');
  if (b) b.onclick = function () {
    renderAll();
    switchTab('Resumen');
    openDlg('huertaDialog');
  };

  TABS.forEach(function (t) {
    var tb = $('tabHuerta' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  /* Bancal: guardar */
  var ba = $('hbAdd');
  if (ba) ba.onclick = function () {
    var nombre = clean((($('hbNombre') || {}).value || '').trim(), 40);
    if (!nombre) return alert('Ponle nombre al bancal (ej: Bancal 1 norte)');
    var h = store();
    if (editBancalId) {
      var eb = bancalById(editBancalId);
      if (eb) {
        eb.nombre = nombre; eb.tipo = $('hbTipo').value;
        eb.largo = $('hbLargo').value; eb.ancho = $('hbAncho').value;
        eb.sol = $('hbSol').value; eb.suelo = clean($('hbSuelo').value, 60); eb.notas = clean($('hbNotas').value, 100);
      }
      editBancalId = null;
      $('huertaBancTitle').textContent = 'Nuevo bancal / espacio';
      ba.textContent = '+ Guardar bancal';
      $('hbCancel').classList.add('hidden');
    } else {
      h.bancales.push({
        id: uid('hb'), nombre: nombre, tipo: $('hbTipo').value,
        largo: $('hbLargo').value, ancho: $('hbAncho').value,
        sol: $('hbSol').value, suelo: clean($('hbSuelo').value, 60),
        notas: clean($('hbNotas').value, 100), archivado: false, creado: todayKey()
      });
    }
    save('Bancal guardado 🏡');
    $('hbNombre').value = ''; $('hbLargo').value = ''; $('hbAncho').value = ''; $('hbSuelo').value = ''; $('hbNotas').value = '';
    renderAll();
  };
  var bc = $('hbCancel');
  if (bc) bc.onclick = function () {
    editBancalId = null;
    $('huertaBancTitle').textContent = 'Nuevo bancal / espacio';
    $('hbAdd').textContent = '+ Guardar bancal';
    bc.classList.add('hidden');
    $('hbNombre').value = ''; $('hbLargo').value = ''; $('hbAncho').value = ''; $('hbSuelo').value = ''; $('hbNotas').value = '';
  };

  /* Cultivo: autodías + guardar */
  var cn = $('hcNombre'), cd = $('hcDias');
  if (cn && cd) cn.oninput = function () {
    var r = refDe(cn.value);
    if (r) cd.value = r.dias;
  };
  var ca = $('hcAdd');
  if (ca) ca.onclick = function () {
    var nombre = clean((($('hcNombre') || {}).value || '').trim(), 30);
    if (!nombre) return alert('Escribe el cultivo (ej: Tomate)');
    var bid = ($('hcBancal') || {}).value || '';
    if (!bid) return alert('Primero crea un bancal en 🟫 Bancales');
    var h = store();
    var datos = {
      bancalId: bid, nombre: nombre, variedad: clean($('hcVar').value, 30),
      cantidad: Math.max(1, parseInt($('hcCant').value) || 1),
      fSiembra: ($('hcFS') || {}).value || todayKey(),
      fTrasplante: ($('hcFT') || {}).value || '',
      dias: Math.max(10, parseInt($('hcDias').value) || diasDe(nombre, 60)),
      estado: ($('hcEstado') || {}).value || 'Crecimiento',
      origen: ($('hcOrigen') || {}).value || 'Siembra directa',
      nota: clean($('hcNota').value, 100)
    };
    if (editCultivoId) {
      var ec = cultivoById(editCultivoId);
      if (ec) Object.keys(datos).forEach(function (k) { ec[k] = datos[k]; });
      editCultivoId = null;
      $('huertaCultTitle').textContent = 'Nuevo cultivo';
      ca.textContent = '+ Guardar cultivo';
      $('hcCancel').classList.add('hidden');
    } else {
      datos.id = uid('hc');
      h.cultivos.push(datos);
    }
    save('Cultivo guardado 🌱');
    $('hcNombre').value = ''; $('hcVar').value = ''; $('hcNota').value = ''; $('hcFT').value = '';
    renderAll();
  };
  var cc = $('hcCancel');
  if (cc) cc.onclick = function () {
    editCultivoId = null;
    $('huertaCultTitle').textContent = 'Nuevo cultivo';
    $('hcAdd').textContent = '+ Guardar cultivo';
    cc.classList.add('hidden');
  };
  var fb = $('hcFiltroB');
  if (fb) fb.onchange = function () { filtroBancal = fb.value; renderCultivos(); };
  var fe = $('hcFiltroE');
  if (fe) fe.onchange = function () { filtroEstado = fe.value; renderCultivos(); };

  /* Tarea */
  var ta = $('htAdd');
  if (ta) ta.onclick = function () {
    var h = store();
    var tipo = ($('htTipo') || {}).value || 'Riego';
    h.tareas.push({
      id: uid('ht'), tipo: tipo,
      fecha: ($('htFecha') || {}).value || todayKey(),
      bancalId: ($('htBancal') || {}).value || '',
      cultivoId: ($('htCultivo') || {}).value || '',
      nota: clean($('htNota').value, 100), hecha: false
    });
    save('Tarea guardada ✅');
    $('htNota').value = '';
    renderAll();
  };
  var tf2 = $('htFiltro');
  if (tf2) tf2.onchange = function () { renderTareas(); };
  var tch = $('htClearHechas');
  if (tch) tch.onclick = function () {
    if (!confirm('¿Borrar tareas hechas?')) return;
    var h = store();
    h.tareas = h.tareas.filter(function (t) { return !t.hecha; });
    save(); renderAll();
  };

  /* Cosecha */
  var xa = $('hxAdd');
  if (xa) xa.onclick = function () {
    var cid = ($('hxCultivo') || {}).value || '';
    if (!cid) return alert('Elige un cultivo (crea uno en 🌱 Cultivos)');
    var cant = parseFloat(($('hxCant') || {}).value);
    if (isNaN(cant) || cant <= 0) return alert('Escribe la cantidad cosechada');
    var h = store();
    h.cosechas.push({
      id: uid('hx'), cultivoId: cid,
      fecha: ($('hxFecha') || {}).value || todayKey(),
      cantidad: cant, unidad: ($('hxUni') || {}).value || 'kg',
      calidad: ($('hxCal') || {}).value || 'Buena',
      nota: clean($('hxNota').value, 80)
    });
    save('Cosecha guardada 🧺');
    $('hxCant').value = ''; $('hxNota').value = '';
    renderAll();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
