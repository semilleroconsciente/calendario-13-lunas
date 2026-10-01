/* ============================================================
   HOGAR · CORRAL + MOVILIDAD + ESCUELA — Calendario 13 Lunas
   Tres secciones dentro de Hogar y Vida Práctica > Casa:
   9.  Botón btnCorral (🐔 Mi Corral): gallinas, huevos, conejo
       de engorda, chanchito de traspatio. Diálogo corralDialog
       con 4 pestañas: Resumen / Animales / Bitácora / Guía
       (alimentación, ciclo productivo, puestas/kilos, bienestar
       + conexión Ley 21.020 Cholito y Ley 20.380).
       userData().corral = { animales:[], registros:[] }
   10. Botón btnMovilidad (🚌 Movilidad Penco–Conce): líneas
       Ruta Las Playas, horarios base editables, costos, combos
       ida/vuelta/semana/mes, punto de encuentro con 📌 al
       calendario. Diálogo movDialog: Resumen / Líneas / Mis
       viajes / Guía. userData().movilidadPenco = { viajes:[],
       config:{ pasaje, urbano } }
       Base 2026: Penco–Conce ~12 km · 30–50 min · punta cada
       8–15 min. Tarifa urbana Penco–Lirquén $500 (BioBioChile).
       Interurbano variable: se deja EDITABLE y se avisa que
       verificar en paradero/Moovit. Sin frecuencias oficiales
       fijas: la micro pasa por frecuencia, no por horario fijo.
    11. Botón btnEscolar (📚 Escuela y Feriados): feriados
        nacionales como 🎉 en el calendario (EFEMERIDES en
        data.js + lunas.json) + fechas clave (matrículas SAE,
        PAES, vacaciones Biobío) + subsección 🏫 Colegios Penco
        (municipales + part. subvencionados con links).
        Diálogo escolarDialog:
        Feriados / Calendario / Colegios / Mis fechas / Guía.
       userData().escolarPenco = { mios:[], hechos:{} }
       Fechas verificadas 2026: vacaciones invierno Biobío
       22 jun–3 jul (vuelta 6 jul) · PAES Invierno 15–17 jun
       (resultados 17 jul) · PAES Regular 30 nov–2 dic ·
       inscripción PAES 1 jun–22 jul.
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
  return String(s == null ? '' : s).slice(0, n || 200);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { return cal.fmtKey.format(new Date()); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
}
function save(msg) {
  try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {}
}
function refrescarCal() {
  try { if (typeof renderCurrentView === 'function') renderCurrentView(); } catch (e) {}
  try { if (typeof render === 'function') render(); } catch (e2) {}
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
/* 📌 al calendario — mismo patrón que Bomberos/Municipalidad */
function celdaPara(fechaKey) {
  var ref = null;
  try { if (typeof lunaMapForKey === 'function') ref = lunaMapForKey(fechaKey); } catch (e) {}
  if (!ref) return { error: 'Esa fecha está fuera del ciclo de 13 lunas visible.' };
  if (ref.luna === 'dft') return { ref: ref, dft: true };
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    var cyk = u && u.cycles ? u.cycles[String(ref.y)] : null;
    if (!cyk) return { error: 'No se pudo abrir el ciclo ' + ref.y + '.' };
    if (!cyk.moons[String(ref.luna)]) cyk.moons[String(ref.luna)] = { days: {} };
    var m = cyk.moons[String(ref.luna)];
    if (!m.days[ref.diaN]) m.days[ref.diaN] = { nota: '', animo: -1, agenda: [] };
    if (!Array.isArray(m.days[ref.diaN].agenda)) m.days[ref.diaN].agenda = [];
    return { ref: ref, cell: m.days[ref.diaN] };
  } catch (e) { return { error: 'No se pudo abrir ese día.' }; }
}
function llevarAlCal(tag, nombre, detalle, fechaVal, horaVal, conAviso) {
  var fecha = (fechaVal || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { alert('Elige una fecha válida.'); return; }
  var hora = /^([01]?\d|2[0-3]):([0-5]\d)$/.test(horaVal || '') ? horaVal : '08:00';
  var hh = parseInt(hora.split(':')[0], 10), mm = parseInt(hora.split(':')[1], 10);
  var hhmm = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  var texto = clean('[' + tag + '] ' + nombre + (detalle ? ' · ' + detalle : ''), 80);
  var r = celdaPara(fecha);
  if (r.error) { alert(r.error); return; }
  if (r.dft) {
    try {
      var u = userData();
      var cyk = u.cycles[String(r.ref.y)];
      cyk.dft = cyk.dft || { nota: '' };
      cyk.dft.nota = cyk.dft.nota ? cyk.dft.nota + '\n' + texto + ' ' + hhmm : texto + ' ' + hhmm;
    } catch (e) { alert('No se pudo guardar en el DFT.'); return; }
  } else {
    if (conAviso) { try { if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.requestPermission) Notification.requestPermission(); } catch (e) {} }
    r.cell.agenda.push({ id: 'a' + Date.now() + Math.random().toString(36).slice(2, 4), hour: hh, minute: mm, time: hhmm, text: texto, notify: !!conAviso, notified: false });
  }
  save('📌 Agregado al calendario ✓');
  refrescarCal();
}

/* ==================== 9. MI CORRAL ==================== */
var COR_ESPECIES = ['🐔 Gallina ponedora', '🐓 Gallo / pollo', '🐰 Conejo engorda', '🐷 Chanchito traspatio', '🦆 Pato / otra ave'];
var COR_ESTADOS = ['😍 Sana/o', '🙂 Regular', '🤒 Enferma/o', '💛 En postura', '🚫 Sin postura', '📦 Para faena/venta', '⭐ Reproductor/a'];
var COR_TIPOS = ['🥚 Huevos puestos', '🥚 Huevos consumo/venta', '🌾 Alimento (kg)', '⚖️ Peso / control (kg)', '💉 Vacuna / desparasita', '🧹 Limpieza corral', '💧 Agua / manejo', '⚠️ Muerte / pérdida', '📌 Otro'];

function corStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { animales: [], registros: [] };
    if (!u.corral) u.corral = { animales: [], registros: [] };
    if (!Array.isArray(u.corral.animales)) u.corral.animales = [];
    if (!Array.isArray(u.corral.registros)) u.corral.registros = [];
    return u.corral;
  } catch (e) { return { animales: [], registros: [] }; }
}
var corTab = 'Resumen', corEditId = null, corFQ = '';
function corSwitch(t) {
  corTab = t;
  ['Resumen', 'Animales', 'Bitacora', 'Guia'].forEach(function (x) {
    var p = $('cor' + x), b = $('tabCor' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function corHuevos(desdeKey) {
  var tot = 0;
  corStore().registros.forEach(function (r) {
    if (r.tipo === '🥚 Huevos puestos' && (!desdeKey || r.fecha >= desdeKey)) tot += parseFloat(r.cant) || 0;
  });
  return tot;
}
function haceDiasKey(n) {
  try {
    var d = new Date(); d.setDate(d.getDate() - n);
    return cal.fmtKey.format(d);
  } catch (e) {
    var d2 = new Date(); d2.setDate(d2.getDate() - n);
    return d2.getFullYear() + '-' + String(d2.getMonth() + 1).padStart(2, '0') + '-' + String(d2.getDate()).padStart(2, '0');
  }
}

function corBuild() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabCorResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabCorAnimales" class="btn" style="width:auto">🐔 Animales</button>' +
    '<button type="button" id="tabCorBitacora" class="btn" style="width:auto">📓 Bitácora</button>' +
    '<button type="button" id="tabCorGuia" class="btn" style="width:auto">📖 Guía</button></div>' +
    '<div id="corResumen"></div>' +
    '<div id="corAnimales" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ <span id="corFormTitle">Nuevo animal / lote</span></h4>' +
    '<div class="conv-row"><label style="flex:2">Nombre o lote * <input type="text" id="corNombre" placeholder="ej: Coloradas x6, Conejos engorda, Chanchito" maxlength="40"></label>' +
    '<label>Especie <select id="corEsp">' + COR_ESPECIES.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Cantidad <input type="number" id="corCant" min="1" step="1" value="1"></label>' +
    '<label>Ingreso <input type="date" id="corIngreso"></label>' +
    '<label>Estado <select id="corEstado">' + COR_ESTADOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Nota <input type="text" id="corNota" placeholder="ej: criolla, comprada en feria, lote marzo" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="corAdd" class="btn btn-accent" style="width:auto">+ Guardar</button>' +
    '<button type="button" id="corCancel" class="btn hidden" style="width:auto">Cancelar</button></div></div>' +
    '<div id="corList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="corBitacora" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Anotar: puestas / kilos / manejo</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="corFecha"></label>' +
    '<label style="flex:2">Tipo <select id="corTipo">' + COR_TIPOS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label>Cantidad <input type="number" id="corRegCant" min="0" step="0.5" value="1"></label></div>' +
    '<div class="conv-row"><label style="flex:2">Animal / lote <select id="corRegLote"></select></label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="corRegCal"> 📌 Al calendario</label></div>' +
    '<label>Nota <input type="text" id="corRegNota" placeholder="ej: 6 huevos hoy, 2 kg maíz, faena conejo 2,3 kg" maxlength="100"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="corRegAdd" class="btn btn-accent" style="width:auto">+ Anotar en bitácora</button></div></div>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">🔍 Buscar <input type="text" id="corQ" placeholder="nota, lote..."></label></div>' +
    '<div id="corRegList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="corGuia" class="hidden">' +
    '<div class="si-card"><h4>🌾 Alimentación por especie (base Penco)</h4><p><b>Gallina ponedora:</b> ~110–120 g/día de mezcla (maíz chancado + trigo + afrecho + conchuela para cáscara dura) + pasto/restos de verdura + agua siempre. 1 ponedora ≈ 1 huevo cada 26 h en buena época.<br><b>Conejo engorda:</b> heno a libre disposición + pellet/conejo + agua en bebedero (no plato). Engorda 30–90 días hasta 2–2,5 kg.<br><b>Chanchito traspatio:</b> 1–2 kg/día según tamaño (harinilla + afrecho + restos cocidos de cocina, NUNCA basura cruda ni carne cruda) + agua limpia. Ceba 5–6 meses hasta 80–100 kg.<br><span class="muted">Guarda el alimento en tarro hermético: la humedad de Penco lo honguea. Anota los kilos en 📓 Bitácora → 🌾 Alimento.</span></p></div>' +
    '<div class="si-card"><h4>🔄 Ciclo productivo (para planificar)</h4><p><b>Gallinas:</b> rompen postura ~18–20 semanas · peak 26–40 semanas · postura útil hasta ~72 semanas (luego baja; decide recambio). 1 gallina sana: 250–300 huevos/año. Pelecha en Rimü (otoño): baja postura, sube proteína.<br><b>Conejos:</b> destete 30 días · engorda hasta 70–90 días · faena 2–2,5 kg. Separa machos a los 60 días.<br><b>Chancho:</b> destete 45 días · recría 2 meses · ceba 3–4 meses. Faena casera con frío (Rimü/Pukem) y ayuda experta la primera vez.<br>Usa <b>📌 Al calendario</b> en Bitácora para marcar faenas, vacunas y recambios.</p></div>' +
    '<div class="si-card"><h4>🐔 Gallinero sano en 5 puntos</h4><p>1) <b>Espacio:</b> 4–5 gallinas/m² bajo techo + patio con tierra para baño de polvo. 2) <b>Nido oscuro</b> 1 por cada 4 gallinas + percha alta para dormir. 3) <b>Agua fresca diaria</b> (lava bebedero). 4) <b>Limpieza:</b> cama seca (viruta/paja), saca guano húmedo 1 vez por semana → directo al compost. 5) <b>Luz:</b> 14–16 h de luz para buena postura (en Pukem baja: normal). Huevo sucio se limpia en seco; no se lava si es para guardar (pierde cutícula).</p></div>' +
    '<div class="si-card"><h4>💛 Bienestar animal + Ley Cholito (conecta con 🐾 Cuidado Animal)</h4><p><b>Ley 21.020 (Cholito)</b> es para perros y gatos: si tienes perro guardián del corral, aplica completa (chip + registro en registratumascota.cl, vacunas, esterilización, correa, bolsa — ver 🐾 Cuidado Animal).<br><b>Para gallinas, conejos y chanchos</b> rige la <b>Ley 20.380 de Protección Animal + reglamento SAG</b>: prohíben el maltrato y exigen agua, alimento, espacio y manejo sin sufrimiento. Las <b>5 libertades</b> sirven para todos: 1) sin hambre/sed · 2) sin incomodidad (techo, cama seca) · 3) sin dolor/enfermedad (vacuna Newcastle gallinas, desparasita conejos/chanchos) · 4) conducta normal (escarbar, roer heno, hozar) · 5) sin miedo/estrés (sin perros sueltos dentro del corral, sin gritos).<br><b>Maltrato es delito:</b> denuncia con foto/fecha en <b>BIDEMA 41 215 3400 / 134</b> o Fiscalía. Faena casera: insensibiliza primero y evita que otros animales miren.</p></div>' +
    '<div class="si-card"><h4>⚠️ Bioseguridad casera</h4><p>Aísla 15 días todo animal nuevo. Lava manos y chalas tras manipular enfermos. Gallina decaída + diarrea + cresta morada → separa y consulta vet/SAG. No mezcles conejos con gallinas en el mismo encierro (coccidia). Entierra profundo o entrega a retiro municipal si hay muerte masiva (no al humedal ni a la quebrada).</p></div>' +
    '</div>';
  makeDialog('corralDialog', '🐔 Mi Corral — gallinas, huevos y engorda',
    'Tus animales de traspatio: <b>cuántos tienes, cuántos huevos ponen y cuántos kilos gastan/ganan</b>. Anota puestas y alimento en 📓 Bitácora y revisa bienestar en 📖 Guía (conecta con 🐾 Cuidado Animal y Ley Cholito). <b>Privado y local</b>, 100% offline.',
    body);
}
function corRender() {
  var box = $('corResumen'); if (!box) return;
  var st = corStore();
  var nAn = st.animales.reduce(function (a, x) { return a + (parseInt(x.cant) || 0); }, 0);
  var h7 = corHuevos(haceDiasKey(7)), h28 = corHuevos(haceDiasKey(28));
  var ali28 = 0, bajas = 0;
  st.registros.forEach(function (r) {
    if (r.fecha >= haceDiasKey(28) && r.tipo === '🌾 Alimento (kg)') ali28 += parseFloat(r.cant) || 0;
    if (r.tipo === '⚠️ Muerte / pérdida') bajas += parseFloat(r.cant) || 0;
  });
  var enfermos = st.animales.filter(function (x) { return (x.estado || '').indexOf('Enferma') >= 0; });
  var sinPost = st.animales.filter(function (x) { return (x.estado || '').indexOf('Sin postura') >= 0; });
  var gallinas = st.animales.filter(function (x) { return (x.esp || '').indexOf('Gallina') >= 0; }).reduce(function (a, x) { return a + (parseInt(x.cant) || 0); }, 0);
  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>🐔 Mi corral</h4><p style="font-size:22px;color:var(--gold)"><b>' + nAn + '</b> <span style="font-size:12px">animales en ' + st.animales.length + ' lote(s)</span></p>' +
    '<p class="muted" style="font-size:11px">' + (st.animales.length ? st.animales.map(function (x) { return esc(x.nombre + ' ×' + x.cant); }).slice(0, 4).join(' · ') : 'Anota tu primer lote en 🐔 Animales.') + '</p></div>' +
    '<div class="menstrual-card"><h4>🥚 Puestas</h4><p style="font-size:22px;color:var(--gold)"><b>' + h7 + '</b> <span style="font-size:12px">/ 7 días</span> · <b>' + h28 + '</b> <span style="font-size:12px">/ 28 días</span></p>' +
    '<p class="muted" style="font-size:11px">' + gallinas + ' gallinas aprox · 🌾 ' + ali28 + ' kg alimento / 28 d' + (bajas ? ' · ⚠️ ' + bajas + ' bajas' : '') + '</p></div></div>' +
    ((enfermos.length || sinPost.length) ? '<div class="menstrual-card" style="margin-top:10px"><h4>⚠️ Ojo esta semana</h4><p class="muted" style="font-size:11px">' +
      enfermos.slice(0, 5).map(function (x) { return esc('🤒 ' + x.nombre + ' — revisar hoy'); }).join('<br>') +
      (enfermos.length && sinPost.length ? '<br>' : '') +
      sinPost.slice(0, 5).map(function (x) { return esc('🚫 ' + x.nombre + ' sin postura — revisa luz/edad/pelecha'); }).join('<br>') + '</p></div>' : '') +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="corGoAdd" class="btn" style="width:auto">➕ Anotar lote</button>' +
    '<button type="button" id="corGoReg" class="btn" style="width:auto">📓 Anotar puesta/kilos</button>' +
    '<button type="button" id="corShare" class="btn" style="width:auto">📤 Compartir</button></div>';
  var g = $('corGoAdd'); if (g) g.onclick = function () { corSwitch('Animales'); };
  var gr = $('corGoReg'); if (gr) gr.onclick = function () { corSwitch('Bitacora'); };
  var sh = $('corShare'); if (sh) sh.onclick = function () {
    var t = '🐔 Mi Corral — ' + todayKey() + '\nAnimales: ' + nAn + ' · 🥚 ' + h7 + ' / 7d · ' + h28 + ' / 28d · 🌾 ' + ali28 + ' kg / 28d\n' +
      st.animales.map(function (x) { return '• ' + x.nombre + ' (' + (x.esp || '') + ' ×' + x.cant + ') · ' + (x.estado || ''); }).join('\n');
    share('Mi Corral', t);
  };
  /* lista animales */
  var lb = $('corList');
  if (lb) {
    var arr = st.animales.slice();
    lb.innerHTML = arr.length ? arr.map(function (x) {
      return '<div class="si-card"><h4>' + esc((x.esp || '🐔').split(' ')[0] + ' ' + x.nombre) + ' <span class="chip" style="font-size:10px">×' + esc(String(x.cant)) + '</span></h4>' +
        '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">' + esc(x.esp || '') + '</span>' +
        (x.estado ? '<span class="chip" style="font-size:10px">' + esc(x.estado) + '</span>' : '') +
        (x.ingreso ? '<span class="chip" style="font-size:10px">📥 ' + esc(x.ingreso) + '</span>' : '') + '</p>' +
        (x.nota ? '<p class="muted">' + esc(x.nota) + '</p>' : '') +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" class="btn cor-e" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">✏️ Editar</button>' +
        '<button type="button" class="btn cor-huevo" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px">🥚 +1 hoy</button>' +
        '<button type="button" class="btn cor-d" data-k="' + esc(x.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin lotes. Ej: “Coloradas x6” 🐔.</p>';
    lb.querySelectorAll('.cor-e').forEach(function (b) {
      b.onclick = function () {
        var f = null; corStore().animales.forEach(function (x) { if (x.id === b.dataset.k) f = x; });
        if (!f) return;
        corEditId = f.id;
        $('corNombre').value = f.nombre || ''; $('corEsp').value = f.esp || COR_ESPECIES[0];
        $('corCant').value = f.cant || 1; $('corIngreso').value = f.ingreso || '';
        $('corEstado').value = f.estado || COR_ESTADOS[0]; $('corNota').value = f.nota || '';
        $('corFormTitle').textContent = 'Editar lote'; $('corAdd').textContent = '↻ Actualizar';
        $('corCancel').classList.remove('hidden');
      };
    });
    lb.querySelectorAll('.cor-huevo').forEach(function (b) {
      b.onclick = function () {
        var f = null; corStore().animales.forEach(function (x) { if (x.id === b.dataset.k) f = x; });
        var lote = f ? f.nombre : '';
        corStore().registros.push({ id: uid('cr'), fecha: todayKey(), tipo: '🥚 Huevos puestos', cant: 1, lote: lote, nota: '', creado: todayKey() });
        save('🥚 +1 huevo anotado'); corRender();
      };
    });
    lb.querySelectorAll('.cor-d').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('¿Borrar este lote?')) return;
        var s = corStore(); s.animales = s.animales.filter(function (x) { return x.id !== b.dataset.k; });
        save(); corRender();
      };
    });
  }
  /* lote select + lista registros */
  var sel = $('corRegLote');
  if (sel) {
    sel.innerHTML = '<option value="">— General —</option>' + corStore().animales.map(function (x) { return '<option>' + esc(x.nombre) + '</option>'; }).join('');
  }
  var rl = $('corRegList');
  if (rl) {
    var q = (corFQ || '').toLowerCase();
    var list = corStore().registros.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 60);
    if (q) list = list.filter(function (x) { return ((x.nota || '') + ' ' + (x.lote || '') + ' ' + (x.tipo || '')).toLowerCase().indexOf(q) >= 0; });
    rl.innerHTML = list.length ? list.map(function (r) {
      return '<div class="si-card"><h4>' + esc(r.tipo + ' · ' + r.cant) + '</h4>' +
        '<p style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip" style="font-size:10px">📅 ' + esc(r.fecha) + '</span>' +
        (r.lote ? '<span class="chip" style="font-size:10px">🐔 ' + esc(r.lote) + '</span>' : '') + '</p>' +
        (r.nota ? '<p class="muted">' + esc(r.nota) + '</p>' : '') +
        '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn cor-rd" data-k="' + esc(r.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button></div></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin registros. Anota la puesta de hoy 🥚.</p>';
    rl.querySelectorAll('.cor-rd').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('¿Borrar registro?')) return;
        var s = corStore(); s.registros = s.registros.filter(function (x) { return x.id !== b.dataset.k; });
        save(); corRender();
      };
    });
  }
  var f = $('corFecha'); if (f && !f.value) f.value = todayKey();
  var fi = $('corIngreso'); if (fi && !fi.value) fi.value = todayKey();
}

/* ==================== 10. MOVILIDAD PENCO–CONCE ==================== */
var MOV_LINEAS = [
  { id: 'playas-penco', nombre: 'Ruta Las Playas · Penco–Conce', recorrido: 'Lirquén / Penco centro → Ruta 150 → Concepción (Plaza / Paicaví / Collao según variante 30B/30M/30R)', frec: 'Lun–Vie cada 8–15′ punta · 15–30′ valle · Sáb 15–25′ · Dom 25–40′', hora: '~06:00–22:00 (noche muy reducido)', tiempo: '30–50 min según taco', nota: 'Principal para estudiar/trabajar en Conce. Las variantes 30B/30M/30R cambian destino: pregunta “¿va a Collao / Plaza?” antes de subir.' },
  { id: 'playas-talca', nombre: 'Ruta Las Playas · a Talcahuano', recorrido: 'Penco → Concepción → Talcahuano (Gran Bretaña)', frec: 'Cada 15–30′ día', hora: '~06:00–21:30', tiempo: '60–80 min completo', nota: 'Sirve si vas a hospital Las Higueras o puerto.' },
  { id: 'tome-conce', nombre: 'Buses Tomé–Conce (paso por Penco)', recorrido: 'Tomé → Lirquén → Penco → Concepción por Ruta 150', frec: 'Paso cada 15–30′ día', hora: '~06:30–21:30', tiempo: '35–55 min desde Penco', nota: 'Alternativa en hora punta: suelen ir más vacíos que Las Playas.' },
  { id: 'rural-cos', nombre: 'Rurales / Cosmito–Ruta 150', recorrido: 'Sectores altos y Cosmito → Penco centro (combinan con interurbano)', frec: 'Baja: cada 30–60′ · Dom muy poco', hora: '~07:00–20:00', tiempo: '15–30 min a Penco', nota: 'Si vives arriba, sal con +30 min de holgura y combina.' }
];
function movStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { viajes: [], config: { pasaje: 1000, urbano: 500 } };
    if (!u.movilidadPenco) u.movilidadPenco = { viajes: [], config: { pasaje: 1000, urbano: 500 } };
    if (!Array.isArray(u.movilidadPenco.viajes)) u.movilidadPenco.viajes = [];
    if (!u.movilidadPenco.config) u.movilidadPenco.config = { pasaje: 1000, urbano: 500 };
    return u.movilidadPenco;
  } catch (e) { return { viajes: [], config: { pasaje: 1000, urbano: 500 } }; }
}
var movTab = 'Resumen';
function movSwitch(t) {
  movTab = t;
  ['Resumen', 'Lineas', 'Viajes', 'Guia'].forEach(function (x) {
    var p = $('mov' + x), b = $('tabMov' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function movBuild() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabMovResumen" class="btn btn-accent" style="width:auto">🏡 Resumen</button>' +
    '<button type="button" id="tabMovLineas" class="btn" style="width:auto">🚌 Líneas</button>' +
    '<button type="button" id="tabMovViajes" class="btn" style="width:auto">📌 Mis viajes</button>' +
    '<button type="button" id="tabMovGuia" class="btn" style="width:auto">📖 Guía</button></div>' +
    '<div id="movResumen"></div>' +
    '<div id="movLineas" class="hidden"></div>' +
    '<div id="movViajes" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📌 Guardar viaje / punto de encuentro</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="movFecha"></label>' +
    '<label>Hora <input type="time" id="movHora" value="07:30"></label></div>' +
    '<div class="conv-row"><label style="flex:2">Destino / motivo * <input type="text" id="movMotivo" placeholder="ej: UdeC 08:30, práctica, turno" maxlength="60"></label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="movAviso"> 🔔</label></div>' +
    '<label>Punto encuentro <input type="text" id="movPunto" placeholder="ej: Plaza Penco 07:25, paradero Lirquén" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="movAdd" class="btn btn-accent" style="width:auto">📌 Llevar al calendario</button></div></div>' +
    '<div id="movList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="movGuia" class="hidden">' +
    '<div class="si-card"><h4>⏰ Cómo leer las frecuencias (clave diaria)</h4><p>No hay horario fijo publicado: la micro pasa <b>por frecuencia</b>. En punta (07:00–09:00 y 17:30–20:00) calcula <b>8–15 min</b>; resto del día <b>15–30 min</b>; domingo <b>25–40 min</b>. Para llegar a las 08:30 a Conce, toma la de <b>07:15–07:30</b> desde Penco (taco de Ruta 150). Verifica en vivo con <b>Moovit</b> o preguntando en paradero. Si un chofer te dice “voy solo hasta X”, no discutas: baja y toma la siguiente.</p></div>' +
    '<div class="si-card"><h4>💰 Costos y combos (edita tus valores en Resumen)</h4><p>Urbano Penco–Lirquén: <b>~$500</b> (ref. BioBioChile 2026). Penco–Conce interurbano: <b>variable (~$900–$1.100)</b> — cambia por combustible, edítalo cuando suba. <b>Combos que ahorran:</b> ida+vuelta del día (2 pasajes, sin trasbordo) · semanal 10 viajes (Lun–Vie) · mensual ~44 viajes + 4 urbanos. Con TNE (pase escolar) pagas rebajado: llévala siempre y carga antes del lunes. Si fallas 1 micro en punta, el combo se rompe: sal 1 frecuencia antes.</p></div>' +
    '<div class="si-card"><h4>🎒 Kit del que estudia/trabaja en Conce</h4><p>TNE + $2.000 extra en sencillo · audífonos + cargador · paraguas chico (Penco llueve de lado) · foto del horario de vuelta en el celu · contacto de aviso (“voy en la 07:30”). Punto de encuentro fijo con tu grupo (ej: “Plaza Penco, banca del fuerte, 07:25”) y regla: se espera 5 min, no 20. De noche vuelve antes de las 21:00 o coordina auto compartido.</p></div>' +
    '<div class="si-card"><h4>🚲 Combinaciones</h4><p>Bici hasta paradero + micro (pide subirla solo si va vacía y con permiso del chofer) · Biotrén a Penco en <b>prefactibilidad</b> (EFE Sur 2023): aún NO opera, no lo planifiques como fijo · Colectivo Penco–Conce en punta como respaldo (más caro, más rápido). Guarda tus combinaciones en 📌 Mis viajes.</p></div>' +
    '</div>';
  makeDialog('movDialog', '🚌 Movilidad Penco–Conce — la del día a día',
    'Horarios base, costos editables, combos y <b>📌 punto de encuentro al calendario</b> para quien estudia o trabaja en Conce. Base 2026 verificable en paradero/Moovit: <b>tarifas cambian</b>, edita tus valores. <b>Privado y local</b>, 100% offline.',
    body);
}
function movRender() {
  var box = $('movResumen'); if (!box) return;
  var st = movStore();
  var pas = parseInt(st.config.pasaje) || 1000, urb = parseInt(st.config.urbano) || 500;
  var idaV = pas * 2, sem = pas * 10 + urb * 2, mes = pas * 44 + urb * 8;
  var fmt = function (n) { return '$' + Number(n).toLocaleString('es-CL'); };
  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>🎫 Mis tarifas (editables)</h4>' +
    '<div class="conv-row"><label>Penco–Conce $ <input type="number" id="movPasaje" min="0" step="50" value="' + pas + '"></label>' +
    '<label>Urbano $ <input type="number" id="movUrbano" min="0" step="50" value="' + urb + '"></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="movSaveTar" class="btn btn-accent" style="width:auto">💾 Guardar tarifas</button></div>' +
    '<p class="muted" style="font-size:10px">Fuente base: urbano $500 (BioBioChile) · interurbano variable, verifica en micro.</p></div>' +
    '<div class="menstrual-card"><h4>🧮 Combos con tus valores</h4><p style="font-size:14px">🔁 Ida+vuelta: <b>' + fmt(idaV) + '</b><br>📅 Semanal (10+2): <b>' + fmt(sem) + '</b><br>🗓️ Mensual (~44+8): <b>' + fmt(mes) + '</b></p>' +
    '<p class="muted" style="font-size:11px">' + st.viajes.length + ' viaje(s) guardados en 📌 Mis viajes</p></div></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="movGoLin" class="btn" style="width:auto">🚌 Ver líneas</button>' +
    '<button type="button" id="movGoVia" class="btn" style="width:auto">📌 Guardar viaje</button>' +
    '<button type="button" id="movShare" class="btn" style="width:auto">📤 Compartir</button></div>';
  var sv = $('movSaveTar');
  if (sv) sv.onclick = function () {
    st.config.pasaje = Math.max(0, parseInt(($('movPasaje') || {}).value) || 0);
    st.config.urbano = Math.max(0, parseInt(($('movUrbano') || {}).value) || 0);
    save('Tarifas guardadas 🚌'); movRender();
  };
  var gl = $('movGoLin'); if (gl) gl.onclick = function () { movSwitch('Lineas'); };
  var gv = $('movGoVia'); if (gv) gv.onclick = function () { movSwitch('Viajes'); };
  var sh = $('movShare'); if (sh) sh.onclick = function () {
    share('Movilidad Penco–Conce', '🚌 Penco–Conce — ' + todayKey() + '\nPenco–Conce: ' + fmt(pas) + ' · Urbano: ' + fmt(urb) + '\nIda+vuelta ' + fmt(idaV) + ' · Semanal ' + fmt(sem) + ' · Mensual ' + fmt(mes) + '\nPunta 07–09h cada 8–15 min · 30–50 min de viaje · sal 07:15 para las 08:30.');
  };
  var lb = $('movLineas');
  if (lb) {
    lb.innerHTML = MOV_LINEAS.map(function (l) {
      return '<div class="si-card"><h4>🚌 ' + esc(l.nombre) + '</h4>' +
        '<p style="font-size:12px;line-height:1.6">📍 ' + esc(l.recorrido) + '<br>🔁 ' + esc(l.frec) + '<br>🕐 ' + esc(l.hora) + ' · ⏱️ ' + esc(l.tiempo) + '</p>' +
        '<p class="muted">' + esc(l.nota) + '</p></div>';
    }).join('') +
    '<p class="muted" style="font-size:10px">Frecuencias base 2026 (Moovit + prensa local). No son horario fijo: verifica el día en paradero.</p>';
  }
  var ll = $('movList');
  if (ll) {
    var arr = st.viajes.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 40);
    ll.innerHTML = arr.length ? arr.map(function (v) {
      return '<div class="si-card"><h4>📌 ' + esc(v.fecha + ' ' + v.hora) + '</h4>' +
        '<p style="font-size:12px"><b>' + esc(v.motivo) + '</b>' + (v.punto ? '<br><span class="muted">📍 ' + esc(v.punto) + '</span>' : '') + '</p>' +
        '<div style="margin-top:6px"><button type="button" class="btn mov-d" data-k="' + esc(v.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button></div></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin viajes. Guarda el de mañana con 📌.</p>';
    ll.querySelectorAll('.mov-d').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('¿Borrar viaje? (queda el compromiso ya creado en el día)')) return;
        st.viajes = st.viajes.filter(function (x) { return x.id !== b.dataset.k; });
        save(); movRender();
      };
    });
  }
  var mf = $('movFecha'); if (mf && !mf.value) mf.value = todayKey();
}

/* ==================== 11. ESCUELA Y FERIADOS ==================== */
var ESC_FERIADOS = [
  { md: '01-01', n: '🎉 Año Nuevo', t: 'Irrenunciable · comercio cerrado' },
  { md: '04-03*', n: '🎉 Viernes Santo 2026 (3 abr)', t: 'Religioso · movible (2027: 26 mar)' },
  { md: '04-04*', n: '🎉 Sábado Santo 2026 (4 abr)', t: 'Religioso · movible (2027: 27 mar)' },
  { md: '05-01', n: '🎉 Día del Trabajo', t: 'Irrenunciable' },
  { md: '05-21', n: '🎉 Glorias Navales', t: 'Combate Naval de Iquique' },
  { md: '06-21', n: '🎉 Día Pueblos Indígenas + We Tripantu', t: 'Solsticio invierno · ya en calendario' },
  { md: '06-29', n: '🎉 San Pedro y San Pablo', t: '2026 cae lunes · fiesta pescadores caletas' },
  { md: '07-16', n: '🎉 Virgen del Carmen', t: 'Patrona de Chile' },
  { md: '08-15', n: '🎉 Asunción de la Virgen', t: 'Religioso' },
  { md: '09-18', n: '🎉 Independencia Nacional', t: 'Irrenunciable' },
  { md: '09-19', n: '🎉 Glorias del Ejército', t: 'Irrenunciable' },
  { md: '10-12', n: '🎉 Encuentro de Dos Mundos', t: '2026 cae lunes' },
  { md: '10-31', n: '🎉 Iglesias Evangélicas', t: 'Civil' },
  { md: '11-01', n: '🎉 Todos los Santos', t: 'Civil' },
  { md: '12-08', n: '🎉 Inmaculada Concepción', t: 'Religioso' },
  { md: '12-25', n: '🎉 Navidad', t: 'Irrenunciable' }
];
var ESC_CAL = [
  { f: '2026-03-04~', n: '📚 Inicio año escolar 2026 (1ª sem marzo)', d: 'Entrada por niveles: verifica con tu escuela (marzo es matrícula + diagnóstico).' },
  { f: '2026-06-22', n: '❄️ Vacaciones invierno Biobío (22 jun–3 jul)', d: '2 semanas · 10 regiones incl. Biobío (Mineduc 2026).' },
  { f: '2026-07-06', n: '📚 Vuelta a clases 2º semestre (6 jul)', d: 'Lunes 6 jul en Biobío.' },
  { f: '2026-09-14~', n: '🇨🇱 Receso Fiestas Patrias (sem 14–19 sep)', d: '18–19 irrenunciables (vie–sáb 2026): fondas y acto escolar antes.' },
  { f: '2026-12-11~', n: '📚 Fin año escolar (mediados dic)', d: 'Cierre + licenciaturas 8º y 4º medio: confirma fecha exacta.' },
  { f: '2026-12-20~', n: '☀️ Vacaciones verano (dic–feb)', d: 'Talleres de verano muni + cuidado solar.' },
  { f: '2026-06-01', n: '🎓 PAES: inscripción Regular (1 jun–22 jul)', d: 'demre.cl / acceso.mineduc.cl · SIN plazo extra 2026. ¡No la dejes!' },
  { f: '2026-06-15', n: '🎓 PAES Invierno (15–17 jun)', d: 'Admisión 2027 · resultados 17 jul.' },
  { f: '2026-11-30', n: '🎓 PAES Regular (30 nov–2 dic)', d: '3 días · resultados 4 ene 2027.' },
  { f: '2027-01-04', n: '🎓 Postulación U (4–7 ene 2027)', d: 'Luego selección 18 ene · matrícula 19–21 y 22–28 ene.' },
  { f: '2026-08-01~', n: '📝 SAE: postulación escolar (ago–oct aprox)', d: 'Sistema Admisión Escolar sistemadeadmisionescolar.cl · verifica fechas del año.' }
];
/* ---------- ESTABLECIMIENTOS EDUCACIONALES — PENCO (base 2026, verifica en terreno/SAE) ---------- */
var ESC_COLEGIOS = [
  { n: 'Liceo Pencopolitano', dep: 'Municipal', nivel: 'Media HC + TP (Op. Portuaria, Acuicultura, Gastronomía) + adultos', dir: 'San Vicente 51, Penco', web: 'https://www.liceopencopolitano.cl' },
  { n: 'Liceo Ríos de Chile', dep: 'Municipal', nivel: 'Básica + Media HC', dir: 'Camino a Forestal Dichoco s/n, Lirquén', web: 'https://www.liceoriosdechile.cl' },
  { n: 'Escuela Penco', dep: 'Municipal', nivel: 'Parvularia + Básica', dir: 'Maitén 297, Penco', web: 'https://www.escuelapenco.cl' },
  { n: 'Escuela República de Italia', dep: 'Municipal', nivel: 'Básica', dir: 'Roberto Ovalle 2, Penco', web: 'https://www.escuelarepublicaitalia.cl' },
  { n: 'Escuela Los Conquistadores', dep: 'Municipal', nivel: 'Básica', dir: 'Cochrane 40, Penco', web: 'https://www.escuelalosconquistadores.cl' },
  { n: 'Escuela Isla de Pascua', dep: 'Municipal', nivel: 'Básica', dir: 'Heras 499, Penco', web: 'https://www.escuelaisladepascua.cl' },
  { n: 'Escuela Almirante Patricio Lynch', dep: 'Municipal', nivel: 'Básica', dir: 'Camilo Henríquez 6, Lirquén', web: 'https://www.escuelapatriciolynch.cl' },
  { n: 'Escuela Almirante Jorge Montt', dep: 'Municipal', nivel: 'Básica', dir: 'Lorenzo Riveros 338, Penco', web: 'https://www.escuerlajorgemontt.cl' },
  { n: 'Escuela Eduardo Campbell Saavedra', dep: 'Municipal', nivel: 'Básica', dir: 'Calle Central 445, Penco', web: 'https://www.escuelaeduardocampbell.cl' },
  { n: 'Escuela Ethel Henck de Grant', dep: 'Municipal', nivel: 'Básica', dir: 'Camino a Penco, sector Cosmito', web: 'https://www.escuelaethelhenck.cl' },
  { n: 'Escuela Forjadores de Chile', dep: 'Municipal', nivel: 'Básica', dir: 'Eusebio Lillo s/n, Penco', web: 'https://www.escuelaforjadoresdechile.cl' },
  { n: 'Escuela La Greda', dep: 'Municipal', nivel: 'Básica', dir: 'Santa Ana s/n, La Greda', web: 'https://www.escuelalagredapenco.cl' },
  { n: 'Escuela Marta Stowhas Kargus', dep: 'Municipal', nivel: 'Básica', dir: 'Freire 260, Penco', web: 'https://www.escuelamartastowhas.cl' },
  { n: 'Escuela Vipla', dep: 'Municipal', nivel: 'Básica', dir: 'Belgeri s/n, Lirquén', web: 'https://www.escuelavipla.cl' },
  { n: 'Escuela Primer Agua Abajo', dep: 'Municipal', nivel: 'Básica rural', dir: 'Fundo Primer Agua Abajo', web: 'https://www.escuelaprimeragua.cl' },
  { n: 'DEM Penco / DAEM (red municipal)', dep: 'Municipal', nivel: 'Administración + SAE + becas', dir: 'Los Carrera 230 · 41-2261308', web: 'https://educapenco.cl' },
  { n: 'Colegio El Refugio', dep: 'Part. subvencionado', nivel: 'Parvularia + Básica + Media', dir: "O'Higgins 115, Penco", web: 'https://colegioelrefugio.cl/' },
  { n: 'Centro Educacional Alborada', dep: 'Part. subvencionado', nivel: 'Parvularia + Básica', dir: 'Membrillar 656, Penco', web: 'https://cealborada.cl/' },
  { n: 'Escuela Particular Queen Elizabeth School', dep: 'Part. subvencionado', nivel: 'Parvularia + Básica', dir: 'Cochrane 469, Penco', web: 'https://queenelizabeth.cl/' },
  { n: 'Colegio A-Lafken', dep: 'Part. subvencionado', nivel: 'Parvularia + Básica + Media + adultos', dir: 'Cruz 10, Penco', web: 'https://www.facebook.com/ColegioAlafken/' },
  { n: 'Colegio Particular Funny School', dep: 'Part. subvencionado', nivel: 'Parvularia + Básica', dir: 'Penco (ver SAE)', web: '' },
  { n: 'Complejo Educacional Gloria Méndez Briones', dep: 'Part. subvencionado', nivel: 'Parvularia + Básica', dir: 'Penco (ver SAE)', web: '' },
  { n: 'Escuelas de lenguaje y jardines (Kimalu, Nuevo Futuro, Jardín de Palabras, Alcázar, San Nicolás, Ann Kudao, Botecito de Papel)', dep: 'Part. subvencionado', nivel: 'Lenguaje / parvularia', dir: 'Penco (varias sedes)', web: '' }
];
var escColeQ = '';
function escStore() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { mios: [], hechos: {} };
    if (!u.escolarPenco) u.escolarPenco = { mios: [], hechos: {} };
    if (!Array.isArray(u.escolarPenco.mios)) u.escolarPenco.mios = [];
    if (!u.escolarPenco.hechos || typeof u.escolarPenco.hechos !== 'object') u.escolarPenco.hechos = {};
    return u.escolarPenco;
  } catch (e) { return { mios: [], hechos: {} }; }
}
var escTab = 'Feriados';
function escSwitch(t) {
  escTab = t;
  ['Feriados', 'Calendario', 'Colegios', 'Mios', 'Guia'].forEach(function (x) {
    var p = $('esc' + x), b = $('tabEsc' + x);
    if (p) p.classList.toggle('hidden', x !== t);
    if (b) b.classList.toggle('btn-accent', x === t);
  });
}
function escBuild() {
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabEscFeriados" class="btn btn-accent" style="width:auto">🎉 Feriados</button>' +
    '<button type="button" id="tabEscCalendario" class="btn" style="width:auto">📚 Calendario</button>' +
    '<button type="button" id="tabEscColegios" class="btn" style="width:auto">🏫 Colegios</button>' +
    '<button type="button" id="tabEscMios" class="btn" style="width:auto">⭐ Mis fechas</button>' +
    '<button type="button" id="tabEscGuia" class="btn" style="width:auto">📖 Guía</button></div>' +
    '<div id="escFeriados"></div>' +
    '<div id="escCalendario" class="hidden"></div>' +
    '<div id="escColegios" class="hidden"></div>' +
    '<div id="escMios" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Mi fecha (matrícula, reunión, prueba...)</h4>' +
    '<div class="conv-row"><label style="flex:2">Qué * <input type="text" id="escNombre" placeholder="ej: Matrícula 3º básico, reunión apoderados" maxlength="60"></label>' +
    '<label>Fecha <input type="date" id="escFecha"></label></div>' +
    '<div class="conv-row"><label>Dónde <input type="text" id="escDonde" placeholder="ej: Escuela, DEMRE, DAEM Penco" maxlength="60"></label>' +
    '<label>Hora <input type="time" id="escHora" value="10:00"></label>' +
    '<label class="check-row" style="margin:0;align-self:flex-end"><input type="checkbox" id="escAviso"> 🔔</label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="escAdd" class="btn btn-accent" style="width:auto">📌 Guardar + llevar al calendario</button></div></div>' +
    '<div id="escMiList" style="margin-top:8px;display:flex;flex-direction:column;gap:8px"></div></div>' +
    '<div id="escGuia" class="hidden">' +
    '<div class="si-card"><h4>📝 Matrículas SAE sin estrés</h4><p>Postulación escolar (SAE) aprox <b>ago–oct</b> en sistemadeadmisionescolar.cl con Clave Única. Junta: certificado nacimiento, notas, informe personalidad. Penco: DAEM orienta presencial. Marca tu fecha en ⭐ Mis fechas con 📌 (te crea el compromiso en el día). Si quedas sin vacante: lista de espera + segunda postulación, no te quedes callada/o.</p></div>' +
    '<div class="si-card"><h4>🎓 PAES paso a paso (Admisión 2027)</h4><p><b>1 jun–22 jul 2026:</b> inscripción (sin prórroga). <b>15–17 jun:</b> PAES Invierno · resultados 17 jul (te sirven para decidir si repites). <b>24 sep:</b> oferta definitiva carreras. <b>30 nov–2 dic:</b> PAES Regular. <b>4 ene 2027:</b> puntajes · <b>4–7 ene:</b> postulación · <b>18 ene:</b> selección · <b>19–28 ene:</b> matrículas. Lleva cada una con 📌 desde 📚 Calendario. Obliga: Competencia Lectora + M1; M2 gratis si marcas ambas.</p></div>' +
    '<div class="si-card"><h4>🎒 Vacaciones y plata</h4><p>Invierno Biobío 2026: <b>22 jun–3 jul, vuelta 6 jul</b>. Verano: dic–feb. TNE: renueva sello en tu escuela (básica/media/superior) para rebaja en la micro Penco–Conce. JUNAEB: beca alimentación y útiles se consulta con RUT en junaeb.cl. Si tu hijo falta por lluvia/temporal: avisa por cuaderno + foto, no necesita certificado los primeros días (pregunta reglamento interno).</p></div>' +
    '<div class="si-card"><h4>🎉 Irrenunciables (comercio cierra)</h4><p>1 ene · 1 may · 18–19 sep · 25 dic. Esos días no cuentes con súper ni mall: compra antes. Los demás feriados el comercio puede abrir. Semana Santa (Vie+Sáb Santo) es movible: 2026 cae 3–4 abr, 2027 cae 26–27 mar — por eso vive en este módulo y no como fecha fija.</p></div>' +
    '</div>';
  makeDialog('escolarDialog', '📚 Escuela y Feriados — Chile + Penco',
    'Los <b>🎉 feriados nacionales ya están en tu calendario</b> (efemérides) + aquí las <b>fechas clave</b>: vacaciones Biobío, matrículas SAE y PAES 2026–2027. Lleva cada fecha al día con <b>📌</b>. <b>Privado y local</b>, 100% offline.',
    body);
}
function escRender() {
  var fb = $('escFeriados'); if (!fb) return;
  var st = escStore();
  fb.innerHTML = '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🎉 Feriados nacionales (ya en tu calendario como 📅)</h4>' +
    '<p class="muted" style="font-size:11px">Fijos: 01-01 · 05-01 · 05-21 · 06-21 · 06-29 · 07-16 · 08-15 · 09-18/19 · 10-12 · 10-31 · 11-01 · 12-08 · 12-25. Movibles: Semana Santa (abajo). Regionales Arica/Chillán no incluidos.</p></div>' +
    ESC_FERIADOS.map(function (f) {
      return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(f.n) + '</b> <span class="muted">· ' + esc(f.md + ' · ' + f.t) + '</span></span></div>';
    }).join('');
  var cb = $('escCalendario');
  if (cb) {
    cb.innerHTML = ESC_CAL.map(function (c, i) {
      var hecho = st.hechos['base' + i];
      return '<div class="si-card"><h4>' + (hecho ? '✅ ' : '') + esc(c.n) + '</h4>' +
        '<p class="muted">📅 ' + esc(c.f) + ' · ' + esc(c.d) + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" class="btn esc-cal" data-k="' + i + '" style="width:auto;font-size:11px">📌 Al calendario</button>' +
        '<button type="button" class="btn esc-hecho" data-k="base' + i + '" style="width:auto;font-size:11px">' + (hecho ? '↩ Pendiente' : '☑️ Hecho') + '</button></div></div>';
    }).join('');
    cb.querySelectorAll('.esc-cal').forEach(function (b) {
      b.onclick = function () {
        var c = ESC_CAL[parseInt(b.dataset.k, 10)]; if (!c) return;
        var f0 = (c.f || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(f0)) { alert('Fecha aproximada (~): elige el día exacto en el siguiente paso.'); f0 = todayKey(); }
        var fecha = prompt('Fecha para "' + c.n + '" (AAAA-MM-DD):', f0);
        if (!fecha) return;
        var hora = prompt('Hora (HH:MM):', '10:00') || '10:00';
        llevarAlCal('Escuela', c.n, c.d, fecha, hora, false);
      };
    });
    cb.querySelectorAll('.esc-hecho').forEach(function (b) {
      b.onclick = function () {
        var k = b.dataset.k;
        if (st.hechos[k]) delete st.hechos[k]; else st.hechos[k] = true;
        save(); escRender();
      };
    });
  }
  var col = $('escColegios');
  if (col) {
    var q = (escColeQ || '').toLowerCase().trim();
    var list = (typeof ESC_COLEGIOS !== 'undefined' ? ESC_COLEGIOS : []).filter(function (c) {
      if (!q) return true;
      return ((c.n || '') + ' ' + (c.dep || '') + ' ' + (c.nivel || '') + ' ' + (c.dir || '')).toLowerCase().indexOf(q) >= 0;
    });
    var grp = function (dep) {
      var items = list.filter(function (c) { return c.dep === dep; });
      if (!items.length) return '';
      return '<div class="menstrual-card" style="margin-top:8px"><h4>' + esc(dep === 'Municipal' ? '🏛️ Municipales (DEM Penco)' : dep === 'Part. subvencionado' ? '🤝 Particulares subvencionados' : esc(dep)) + ' · ' + items.length + '</h4>' +
        items.map(function (c) {
          return '<div class="hora-item"><span style="font-size:12px"><b>' + esc(c.n) + '</b><br><span class="muted" style="font-size:10px">' + esc(c.nivel || '') + (c.dir ? ' · 📍 ' + esc(c.dir) : '') + '</span></span>' +
            (c.web ? '<a class="btn" style="width:auto;font-size:11px;text-decoration:none" href="' + esc(c.web) + '" target="_blank" rel="noopener">🔗 Sitio</a>' : '<span class="muted" style="font-size:10px">ver en SAE</span>') + '</div>';
        }).join('') + '</div>';
    };
    col.innerHTML =
      '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🏫 Establecimientos educacionales — Penco</h4>' +
      '<p class="muted" style="font-size:11px">Red municipal DEM + particulares subvencionados. Toca 🔗 para web/Facebook. Sin link = busca el nombre en <b>sistemadeadmisionescolar.cl</b> o <b>educapenco.cl</b>. Verifica vacantes y horarios en terreno.</p>' +
      '<div class="conv-row"><label style="flex:2">🔍 Buscar <input type="text" id="escColeQ" placeholder="ej: liceo, lirquén, básica, media..." maxlength="40" autocomplete="off"></label></div>' +
      '<p class="muted" style="font-size:11px;margin:4px 0 0">' + list.length + ' / ' + ESC_COLEGIOS.length + ' establecimientos</p></div>' +
      grp('Municipal') + grp('Part. subvencionado') +
      '<p class="muted" style="font-size:10px;margin-top:8px">Fuentes: penco.cl/nuestra-comuna + educapenco.cl + sitios oficiales 2026. Postulación: SAE sistemadeadmisionescolar.cl (ago–oct). DEM: Los Carrera 230 · 41-2261308.</p>';
    var qi = $('escColeQ');
    if (qi) { qi.value = escColeQ || ''; qi.addEventListener('input', function () { escColeQ = qi.value; var pos = qi.selectionStart; escRender(); var nq = $('escColeQ'); if (nq) { try { nq.focus(); nq.setSelectionRange(pos, pos); } catch (e) {} } }); }
  }
  var ml = $('escMiList');
  if (ml) {
    var arr = st.mios.slice().sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
    ml.innerHTML = arr.length ? arr.map(function (m) {
      var h = st.hechos[m.id];
      return '<div class="si-card' + (h ? '" style="opacity:.65' : '') + '"><h4>' + (h ? '✅ ' : '📌 ') + esc(m.nombre) + '</h4>' +
        '<p class="muted">📅 ' + esc(m.fecha + (m.hora ? ' ' + m.hora : '')) + (m.donde ? ' · 📍 ' + esc(m.donde) : '') + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" class="btn esc-mh" data-k="' + esc(m.id) + '" style="width:auto;font-size:11px">' + (h ? '↩ Pendiente' : '☑️ Hecho') + '</button>' +
        '<button type="button" class="btn esc-md" data-k="' + esc(m.id) + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div></div>';
    }).join('') : '<p class="muted" style="font-size:11px;text-align:center">Sin fechas propias. Ej: “Matrícula 2027”.</p>';
    ml.querySelectorAll('.esc-mh').forEach(function (b) {
      b.onclick = function () {
        var k = b.dataset.k;
        if (st.hechos[k]) delete st.hechos[k]; else st.hechos[k] = true;
        save(); escRender();
      };
    });
    ml.querySelectorAll('.esc-md').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('¿Borrar fecha? (queda el compromiso ya creado en el día)')) return;
        st.mios = st.mios.filter(function (x) { return x.id !== b.dataset.k; });
        save(); escRender();
      };
    });
  }
  var ef = $('escFecha'); if (ef && !ef.value) ef.value = todayKey();
}

/* ==================== BOTONES + SETUP ==================== */
function injectBtn(id, txt, kw, refSel) {
  try {
    var g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
    if (!g) return;
    if ($(id)) { try { $(id).setAttribute('data-sub', 'casa'); } catch (e2) {} return; }
    var btn = document.createElement('button');
    btn.id = id; btn.className = 'btn'; btn.type = 'button';
    btn.textContent = txt;
    try { btn.setAttribute('data-sub', 'casa'); } catch (eS) {}
    btn.setAttribute('data-keywords', kw);
    var ref = refSel ? g.querySelector(refSel) : null;
    var refE = ref || g.querySelector('.sub-label[data-sub="energia"]');
    if (refE) g.insertBefore(btn, refE);
    else g.appendChild(btn);
  } catch (e) {}
}
function registerBtn(id, label) {
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
          lab.innerHTML = '<input type="checkbox" data-btn="' + id + '"> ' + esc(label);
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
  injectBtn('btnCorral', '🐔 Mi Corral', 'corral gallinas gallina huevos huevo ponedora pollo conejo engorda chancho cerdo chanchito traspatio alimento postura faena bienestar cholito gallinero lote kilos bitacora campo rural penco');
  injectBtn('btnMovilidad', '🚌 Movilidad Penco–Conce', 'movilidad micro bus peno concepcion lirquen ruta playas horario frecuencia pasaje tarifa tne estudiante trabajo viaje paradero conce tomé talcahuano encuentro calendario');
  injectBtn('btnEscolar', '📚 Escuela y Feriados', 'escuela escolar feriado fiesta matricula paes vacaciones invierno verano sae admision universidad prueba colegio colegios establecimiento liceo escuela basica media apoderados junaeb tne chile calendario efemeride');
  registerBtn('btnCorral', '🐔 Mi Corral');
  registerBtn('btnMovilidad', '🚌 Movilidad Penco–Conce');
  registerBtn('btnEscolar', '📚 Escuela y Feriados');
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}

  corBuild(); movBuild(); escBuild();
  corRender(); movRender(); escRender();

  var b1 = $('btnCorral');
  if (b1) b1.onclick = function () { corRender(); corSwitch('Resumen'); openDlg('corralDialog'); };
  var b2 = $('btnMovilidad');
  if (b2) b2.onclick = function () { movRender(); movSwitch('Resumen'); openDlg('movDialog'); };
  var b3 = $('btnEscolar');
  if (b3) b3.onclick = function () { escRender(); escSwitch('Feriados'); openDlg('escolarDialog'); };

  ['Resumen', 'Animales', 'Bitacora', 'Guia'].forEach(function (t) {
    var b = $('tabCor' + t); if (b) b.onclick = function () { corSwitch(t); };
  });
  ['Resumen', 'Lineas', 'Viajes', 'Guia'].forEach(function (t) {
    var b = $('tabMov' + t); if (b) b.onclick = function () { movSwitch(t); };
  });
  ['Feriados', 'Calendario', 'Colegios', 'Mios', 'Guia'].forEach(function (t) {
    var b = $('tabEsc' + t); if (b) b.onclick = function () { escSwitch(t); };
  });

  /* Corral: guardar lote */
  var ca = $('corAdd');
  if (ca) ca.onclick = function () {
    var nombre = clean((($('corNombre') || {}).value || '').trim(), 40);
    if (!nombre) return alert('Anota el lote (ej: Coloradas x6, Conejos engorda)');
    var st = corStore();
    var datos = {
      nombre: nombre, esp: ($('corEsp') || {}).value || COR_ESPECIES[0],
      cant: Math.max(1, parseInt(($('corCant') || {}).value) || 1),
      ingreso: ($('corIngreso') || {}).value || todayKey(),
      estado: ($('corEstado') || {}).value || COR_ESTADOS[0],
      nota: clean((($('corNota') || {}).value || '').trim(), 100)
    };
    if (corEditId) {
      var ex = null; st.animales.forEach(function (x) { if (x.id === corEditId) ex = x; });
      if (ex) Object.keys(datos).forEach(function (k) { ex[k] = datos[k]; });
      corEditId = null;
      $('corFormTitle').textContent = 'Nuevo animal / lote'; ca.textContent = '+ Guardar';
      $('corCancel').classList.add('hidden');
    } else { datos.id = uid('co'); datos.creado = todayKey(); st.animales.push(datos); }
    save('Lote guardado 🐔');
    $('corNombre').value = ''; $('corNota').value = '';
    corRender();
  };
  var cc = $('corCancel');
  if (cc) cc.onclick = function () {
    corEditId = null; $('corFormTitle').textContent = 'Nuevo animal / lote';
    $('corAdd').textContent = '+ Guardar'; cc.classList.add('hidden');
    $('corNombre').value = ''; $('corNota').value = '';
  };
  /* Corral: bitácora */
  var ra = $('corRegAdd');
  if (ra) ra.onclick = function () {
    var cant = parseFloat(($('corRegCant') || {}).value);
    if (isNaN(cant) || cant < 0) return alert('Cantidad inválida');
    var tipo = ($('corTipo') || {}).value || COR_TIPOS[0];
    var fecha = ($('corFecha') || {}).value || todayKey();
    var lote = ($('corRegLote') || {}).value || '';
    var nota = clean((($('corRegNota') || {}).value || '').trim(), 100);
    corStore().registros.push({ id: uid('cr'), fecha: fecha, tipo: tipo, cant: cant, lote: lote, nota: nota, creado: todayKey() });
    save('Anotado en bitácora 🐔');
    if ($('corRegCal') && $('corRegCal').checked) {
      llevarAlCal('Corral', tipo + ' ' + cant + (lote ? ' · ' + lote : ''), nota, fecha, '08:00', false);
      $('corRegCal').checked = false;
    }
    $('corRegNota').value = '';
    corRender();
  };
  var cq = $('corQ'); if (cq) cq.oninput = function () { corFQ = cq.value; corRender(); };

  /* Movilidad: guardar viaje */
  var ma = $('movAdd');
  if (ma) ma.onclick = function () {
    var motivo = clean((($('movMotivo') || {}).value || '').trim(), 60);
    if (!motivo) return alert('Anota el destino/motivo (ej: UdeC 08:30)');
    var fecha = ($('movFecha') || {}).value || todayKey();
    var hora = ($('movHora') || {}).value || '07:30';
    var punto = clean((($('movPunto') || {}).value || '').trim(), 80);
    var conAviso = !!($('movAviso') || {}).checked;
    llevarAlCal('Micro Penco–Conce', motivo, punto ? 'Encuentro: ' + punto : '', fecha, hora, conAviso);
    movStore().viajes.push({ id: uid('mv'), fecha: fecha, hora: hora, motivo: motivo, punto: punto, creado: todayKey() });
    save('📌 Viaje guardado');
    $('movMotivo').value = ''; $('movPunto').value = '';
    movRender();
  };

  /* Escolar: guardar fecha propia */
  var ea = $('escAdd');
  if (ea) ea.onclick = function () {
    var nombre = clean((($('escNombre') || {}).value || '').trim(), 60);
    if (!nombre) return alert('Anota qué es (ej: Matrícula 3º básico)');
    var fecha = ($('escFecha') || {}).value || todayKey();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return alert('Fecha inválida');
    var donde = clean((($('escDonde') || {}).value || '').trim(), 60);
    var hora = ($('escHora') || {}).value || '10:00';
    var conAviso = !!($('escAviso') || {}).checked;
    llevarAlCal('Escuela', nombre, donde, fecha, hora, conAviso);
    escStore().mios.push({ id: uid('es'), nombre: nombre, fecha: fecha, hora: hora, donde: donde, creado: todayKey() });
    save('📌 Fecha escolar guardada');
    $('escNombre').value = ''; $('escDonde').value = '';
    escRender();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
