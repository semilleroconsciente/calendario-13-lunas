/* ============================================================
   FENG SHUI DEL HOGAR — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección completa dentro de Hogar y Vida Práctica > Casa:
   - Botón btnFengShui (grupo hogar, sub casa, junto a Tareas Hogar)
   - Diálogo fengShuiDialog con 6 pestañas:
     1) Resumen (luna hoy + puntaje armonía + próxima acción)
     2) Bagua (mapa 3x3 + orientación puerta + diagnóstico)
     3) Kua y Elementos (nº Kua + 5 elementos + test equilibrio)
     4) Mi Casa (perfil + checklist por ambiente con %)
     5) Curas (bitácora de activaciones + curas rápidas)
     6) Guía (principios, hemisferio sur, espejos, errores,
        ritmo lunar de orden)
   - Adaptado a hemisferio sur (Penco) y a casa chilena real:
     living-comedor, cocina a leña, baño, pieza, patio.
   - Todo local y privado por usuario:
     userData().fengShui = { perfil, checks, curas, kua }
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
function lunaDeFecha(key) {
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return { y: r.y, luna: r.luna, dia: r.diaN }; }
  } catch (e) {}
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return { y: null, luna: m.luna, dia: m.dia }; }
  } catch (e) {}
  return null;
}
function faseLunar(key) {
  try {
    if (window.astro && window.astro.moonInfo) {
      var mi = window.astro.moonInfo(new Date(key + 'T12:00:00').getTime());
      var ph = (mi && (mi.phase !== undefined ? mi.phase : mi.age / 29.53)) || 0;
      if (ph < 0.13 || ph > 0.87) return { n: 'Luna Nueva 🌑', illum: Math.round((mi.fraction || 0) * 100) };
      if (ph < 0.37) return { n: 'Luna Creciente 🌓', illum: Math.round((mi.fraction || 0) * 100) };
      if (ph < 0.63) return { n: 'Luna Llena 🌕', illum: Math.round((mi.fraction || 0) * 100) };
      return { n: 'Luna Menguante 🌗', illum: Math.round((mi.fraction || 0) * 100) };
    }
  } catch (e) {}
  return { n: 'Fase lunar (ver 🔭 Astro)', illum: null };
}

/* ---------------- REFERENCIAS ---------------- */
var BAGUA = [
  { z: 'Riqueza y abundancia', dir: 'Sureste', el: '🌳 Madera', col: 'Verde, morado, dorado', preg: '¿Hay algo roto, seco o estancado aquí? ¿Entra luz?', curas: 'Planta sana + objeto morado/dorado + luz cálida. Repara lo roto.' },
  { z: 'Fama y reputación', dir: 'Sur', el: '🔥 Fuego', col: 'Rojo, naranja, velas', preg: '¿Se ve tu nombre/logros? ¿Hay luz viva?', curas: 'Vela o lámpara cálida + algo rojo + diploma/foto que te enorgullezca.' },
  { z: 'Amor y pareja', dir: 'Suroeste', el: '🪨 Tierra', col: 'Rosa, durazno, terracota', preg: '¿Hay pares (2 velas, 2 cojines)? ¿Orden o bodega?', curas: 'Objetos de a pares + cuarzo rosa + foto de pareja/familia querida.' },
  { z: 'Familia y salud', dir: 'Este', el: '🌳 Madera', col: 'Verde, celeste', preg: '¿Hay plantas vivas? ¿Fotos familiares a la vista?', curas: 'Planta frondosa + foto familiar alegre + objeto de madera.' },
  { z: 'Centro · equilibrio', dir: 'Centro', el: '🪨 Tierra', col: 'Amarillo, beige', preg: '¿Está despejado y limpio? Es el corazón del chi.', curas: 'Despejar + alfombra amarilla/beige + cuenco o piedra linda.' },
  { z: 'Creatividad e hijos', dir: 'Oeste', el: '⚙️ Metal', col: 'Blanco, gris, metálicos', preg: '¿Hay espacio para crear/jugar? ¿Metal ordenado?', curas: 'Campana/esfera metálica + dibujos de niños + blanco luminoso.' },
  { z: 'Sabiduría', dir: 'Noreste', el: '🪨 Tierra', col: 'Azul, beige, libros', preg: '¿Hay un rincón tranquilo para leer/pensar?', curas: 'Libros + cristal + lámpara de lectura + silencio.' },
  { z: 'Trabajo y camino', dir: 'Norte', el: '💧 Agua', col: 'Azul oscuro, negro', preg: '¿Fluye la entrada? ¿Hay agua/símbolo de camino?', curas: 'Fuente pequeña o imagen de agua/olas + espejo limpio + azul.' },
  { z: 'Ayuda y viajes', dir: 'Noroeste', el: '⚙️ Metal', col: 'Gris, blanco, dorado', preg: '¿A quién agradeces? ¿Hay guía/mentor visible?', curas: 'Campana + foto de quien te apoya + objeto traído de viaje.' }
];
var ELEMENTOS = [
  { n: '🌳 Madera', col: 'Verde · Formas altas verticales', enCasa: 'Plantas, muebles madera, cuadros de bosque, columnas', alimenta: 'Agua la nutre', controla: 'Metal la corta', falta: 'Falta impulso, proyectos estancados → suma 1 planta + verde', exceso: 'Exceso: ansiedad, todo a medias → suma metal (blanco, orden) y poda' },
  { n: '🔥 Fuego', col: 'Rojo · naranja · Formas triangulares', enCasa: 'Velas, lámparas cálidas, cocina, sol directo, arte rojo', alimenta: 'Madera lo alimenta', controla: 'Agua lo apaga', falta: 'Falta alegría/reconocimiento → vela diaria + 1 toque rojo', exceso: 'Exceso: discusiones, insomnio → suma tierra (beige) y baja rojos' },
  { n: '🪨 Tierra', col: 'Amarillo · beige · Formas cuadradas', enCasa: 'Cerámica, piedras, alfombras, fotos familiares, centro', alimenta: 'Fuego la crea', controla: 'Madera la rompe', falta: 'Falta estabilidad/salud → cerámica + orden del centro', exceso: 'Exceso: pesadez, estancamiento → suma metal y ventila' },
  { n: '⚙️ Metal', col: 'Blanco · gris · Formas redondas', enCasa: 'Campanas, esferas, marcos, orden, limpieza', alimenta: 'Tierra lo crea', controla: 'Fuego lo funde', falta: 'Falta claridad/límites → campana + orden de 1 cajón', exceso: 'Exceso: frialdad, rigidez → suma agua (azul, curvas) y madera' },
  { n: '💧 Agua', col: 'Azul · negro · Formas onduladas', enCasa: 'Fuentes, pecera, espejos, vidrio, imágenes de mar/río', alimenta: 'Metal la nutre', controla: 'Tierra la contiene', falta: 'Falta fluidez/trabajo → imagen de agua + espejo limpio', exceso: 'Exceso: miedos, humedad Penco → suma tierra y ventila a diario' }
];
var HABITATS = [
  { id: 'entrada', n: '🚪 Entrada', items: ['Puerta abre completa (nada la traba por dentro)', 'Chapa, timbre y luz de entrada funcionan', 'Se ve el número y hay luz cálida de noche', 'Feludo limpio + 1 planta o color vivo', 'Espejo NO enfrenta la puerta directamente', 'Llaves y zapatos con lugar fijo (no cerro)'] },
  { id: 'living', n: '🛋️ Living · comedor', items: ['Sillón principal ve la puerta (posición de mando)', 'Mesa despejada al 70% (circula el chi)', 'Luz cálida + 1 planta sana', '1 objeto morado/dorado (abundancia sureste)', 'Sin telespejos enfrentados ni cables colgando', 'Algo que te enorgullezca a la vista (sur/fama)'] },
  { id: 'cocina', n: '🍲 Cocina', items: ['Cocina limpia (fuego = prosperidad): quemadores ok', 'Cuchillos guardados, no a la vista', 'Refrigerador sin imanes-papeles acumulados', 'Bote de basura tapado y olor controlado', 'Madera+plantita (hierba) para equilibrar fuego', 'Reparar fugas: gota = fuga de abundancia'] },
  { id: 'dormi', n: '🛏️ Dormitorio', items: ['Cama con respaldo + ve la puerta (sin estar enfrente)', 'Veladores de a pares + luz cálida baja', 'Espejo NO refleja la cama (cubre de noche si sí)', 'Ropa y bajo-cama ordenados (nada roto/sucio)', 'Electrónicos fuera o apagados de noche', 'Rosa/durazno en textil + foto de pareja/amor'] },
  { id: 'bano', n: '🚿 Baño', items: ['Tapa WC siempre abajo + puerta cerrada', 'Fugas reparadas + hongos controlados (Penco húmedo)', 'Planta que ame humedad o imagen verde', 'Toallas limpias + olor fresco (ventilar a diario)', 'Espejo limpio + luz blanca buena', 'Drenajes con tapita: el agua no se va'] },
  { id: 'estudio', n: '📚 Estudio · escritorio', items: ['Escritorio con muro/respaldo detrás (montaña)', 'Frente despejado (vista, no muro a 30 cm)', 'Lámpara izquierda si eres diestro (luz saber)', 'Libros ordenados + cristal o piedra', 'Cables recogidos + silla cómoda', 'Norte libre: símbolo de camino/trabajo'] },
  { id: 'patio', n: '🌿 Patio · balcón', items: ['Entrada de luz despejada (poda lo que tape)', 'Agua no se estanca (limpia canaletas)', 'Rincón vivo: maceta, hierba o comedero aves', 'Bodega ordenada: bota 1 cosa rota por luna', 'Leña ordenada y seca (orilla, no contra muro húmedo)', 'Campana o móvil que suene suave con el sur'] }
];
var CURAS_RAPIDAS = [
  '🧹 Descarte 27: bota/regala 27 cosas en 9 días (3/día). Lo roto, manchado o duplicado primero.',
  '💡 Luz cálida en el rincón más oscuro 3 noches seguidas (sureste o entrada).',
  '🔔 Campana/música 1 min en cada esquina al terminar el aseo (activa el chi).',
  '🪴 1 planta sana en el este (familia/salud) + 1 en sureste (abundancia).',
  '🪞 Espejo: solo donde multiplique algo lindo (planta, mesa puesta). Nunca frente a puerta ni cama.',
  '🕯️ Vela naranja 10 min en el sur con intención escrita (fama/reconocimiento).',
  '🧂 Puñado de sal gruesa en rincones húmedos 24 h, luego barre hacia afuera (Penco: ventila después).',
  '🖼️ Foto que ames a la altura de los ojos en el pasillo más transitado.',
  '🚪 Aceita bisagras que chillan: puerta que suena = oportunidad que se traba.',
  '💧 Repara 1 fuga esta luna: cada gota cuenta como abundancia que se va.'
];
var RITMO_LUNAR = [
  { f: '🌑 Nueva', q: 'Intención: escribe 1 intención por ambiente (ej: “mi entrada recibe”). Limpia 1 cajón.' },
  { f: '🌓 Creciente', q: 'Activación: suma luz, planta o color en la zona Bagua que elegiste este mes.' },
  { f: '🌕 Llena', q: 'Muestra: ordena living y entrada (lo visible). Comparte foto o invita a alguien.' },
  { f: '🌗 Menguante', q: 'Suelta: descarte, bodega, papeles, ropa. Barre de adentro hacia afuera.' }
];

function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { perfil: {}, checks: {}, curas: [], kua: {} };
    if (!u.fengShui) u.fengShui = { perfil: {}, checks: {}, curas: [], kua: {} };
    var s = u.fengShui;
    if (!s.perfil) s.perfil = {};
    if (!s.checks) s.checks = {};
    if (!Array.isArray(s.curas)) s.curas = [];
    if (!s.kua) s.kua = {};
    return s;
  } catch (e) { return { perfil: {}, checks: {}, curas: [], kua: {} }; }
}

/* ---------------- KUA ---------------- */
function calcKua(anio, sexo) {
  anio = parseInt(anio, 10);
  if (!anio || anio < 1900 || anio > 2100) return null;
  var s = String(anio).split('').reduce(function (a, c) { return a + (+c); }, 0);
  while (s > 9) s = String(s).split('').reduce(function (a, c) { return a + (+c); }, 0);
  var n;
  if (anio >= 2000) n = (sexo === 'M') ? (9 - s) : (s + 6);
  else n = (sexo === 'M') ? (10 - s) : (s + 5);
  while (n > 9) n = String(n).split('').reduce(function (a, c) { return a + (+c); }, 0);
  if (n === 0) n = 9;
  if (n === 5) n = (sexo === 'M') ? 2 : 8;
  return n;
}
var KUA_INFO = {
  1: { g: 'Este', el: '💧 Agua', fav: 'Norte · Este · Sureste · Sur', ev: 'Oeste · Suroeste · Noroeste · Noreste', tip: 'Dormir con cabeza al norte; escritorio mirando al este.' },
  2: { g: 'Oeste', el: '🪨 Tierra', fav: 'Suroeste · Oeste · Noroeste · Noreste', ev: 'Este · Sureste · Sur · Norte', tip: 'Refuerza centro y suroeste con cerámica y pares.' },
  3: { g: 'Este', el: '🌳 Madera', fav: 'Este · Sureste · Norte · Sur', ev: 'Oeste · Noroeste · Suroeste · Noreste', tip: 'Plantas y verde al este; evita exceso de metal.' },
  4: { g: 'Este', el: '🌳 Madera', fav: 'Sureste · Este · Sur · Norte', ev: 'Noroeste · Oeste · Noreste · Suroeste', tip: 'Sureste activo: luz + planta + movimiento suave.' },
  6: { g: 'Oeste', el: '⚙️ Metal', fav: 'Oeste · Noroeste · Noreste · Suroeste', ev: 'Sureste · Este · Norte · Sur', tip: 'Orden metálico: campana y blancos al oeste.' },
  7: { g: 'Oeste', el: '⚙️ Metal', fav: 'Oeste · Noroeste · Noreste · Suroeste', ev: 'Sureste · Este · Norte · Sur', tip: 'Creatividad al oeste: espacio libre para crear.' },
  8: { g: 'Oeste', el: '🪨 Tierra', fav: 'Suroeste · Noreste · Oeste · Noroeste', ev: 'Norte · Sureste · Este · Sur', tip: 'Rincón saber al noreste con libros y calma.' },
  9: { g: 'Este', el: '🔥 Fuego', fav: 'Sur · Sureste · Este · Norte', ev: 'Noroeste · Oeste · Suroeste · Noreste', tip: 'Luz viva al sur; cuida noches (baja rojos al dormir).' }
};

/* ---------------- TABS ---------------- */
var TABS = ['Resumen', 'Bagua', 'Kua', 'Casa', 'Curas', 'Guia'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('fs' + t), b = $('tabFs' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}

function totalChecks() {
  var t = 0, ok = 0;
  HABITATS.forEach(function (h) {
    h.items.forEach(function (_, i) {
      t++;
      if (store().checks[h.id + '_' + i]) ok++;
    });
  });
  return { t: t, ok: ok, pct: t ? Math.round(ok / t * 100) : 0 };
}

function consejoLunaHoy() {
  var k = todayKey(), l = lunaDeFecha(k), f = faseLunar(k);
  var base = RITMO_LUNAR.filter(function (r) { return f.n.indexOf(r.f.split(' ')[1]) >= 0; })[0] || RITMO_LUNAR[1];
  var txt = f.n + (f.illum !== null ? ' · ' + f.illum + '% iluminada' : '') + (l ? ' · Luna ' + l.luna + ' día ' + l.dia : '');
  return { txt: txt, tip: base.q, fase: f.n };
}

/* ---------------- RENDER ---------------- */
function renderResumen() {
  var box = $('fsResumen'); if (!box) return;
  var c = consejoLunaHoy(), sc = totalChecks(), s = store();
  var curas = s.curas.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 3);
  var puerta = s.perfil.puerta || 'sin definir';
  box.innerHTML =
    '<div class="fishing-grid">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌙 Hoy · ' + esc(todayKey()) + '</h4>' +
    '<p style="font-size:12px">' + esc(c.txt) + '</p><p class="muted" style="font-size:11px">' + esc(c.tip) + '</p></div>' +
    '<div class="menstrual-card"><h4>☯️ Armonía de mi casa</h4>' +
    '<p style="font-size:22px;color:var(--gold)"><b>' + sc.pct + '%</b> <span style="font-size:11px">' + sc.ok + '/' + sc.t + ' hábitos</span></p>' +
    '<div style="background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:' + sc.pct + '%;height:100%;background:linear-gradient(90deg,#8fd694,#e8c56a,#e76e8a)"></div></div>' +
    '<p class="muted" style="font-size:11px;margin-top:6px">Puerta: ' + esc(puerta) + ' · ' + s.curas.length + ' curas registradas</p></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>🎯 Próxima acción (5 min)</h4>' +
    '<p class="muted" style="font-size:12px">' + esc(proximaAccion()) + '</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    '<button type="button" id="fsGoBagua" class="btn" style="width:auto">🗺️ Ver mi Bagua</button>' +
    '<button type="button" id="fsGoCasa" class="btn" style="width:auto">✅ Chequear mi casa</button>' +
    '<button type="button" id="fsGoTareas" class="btn" style="width:auto">🏠 Ir a Tareas Hogar</button></div></div>' +
    (curas.length ? '<div class="menstrual-card" style="margin-top:10px"><h4>🕯️ Últimas curas</h4>' +
      curas.map(function (r) { return '<div class="hora-item"><span style="font-size:12px">🕯️ <b>' + esc(r.zona || '') + '</b> · ' + esc(r.accion || '') + '<br><span class="muted">' + esc(r.fecha) + '</span></span></div>'; }).join('') + '</div>' : '');
  var gb = $('fsGoBagua'); if (gb) gb.onclick = function () { switchTab('Bagua'); renderBagua(); };
  var gc = $('fsGoCasa'); if (gc) gc.onclick = function () { switchTab('Casa'); };
  var gt = $('fsGoTareas'); if (gt) gt.onclick = function () { try { if ($('btnHomeTasks')) $('btnHomeTasks').click(); } catch (e) {} };
}
function proximaAccion() {
  var s = store();
  for (var hi = 0; hi < HABITATS.length; hi++) {
    var h = HABITATS[hi];
    for (var i = 0; i < h.items.length; i++) {
      if (!s.checks[h.id + '_' + i]) return h.n + ': ' + h.items[i];
    }
  }
  return 'Tu casa está en 100%. Elige una cura de 💧 Curas para activar abundancia esta luna.';
}

function renderBagua() {
  var box = $('fsBaguaGrid'); if (!box) return;
  var s = store(), puerta = s.perfil.puerta || 'Norte';
  var orden = ['Sureste', 'Sur', 'Suroeste', 'Este', 'Centro', 'Oeste', 'Noreste', 'Norte', 'Noroeste'];
  var porDir = {};
  BAGUA.forEach(function (b) { porDir[b.dir] = b; });
  box.innerHTML = orden.map(function (d) {
    var b = porDir[d];
    var esPuerta = (puerta === d);
    return '<div class="si-card" style="' + (esPuerta ? 'border-color:var(--gold);background:rgba(232,197,106,.08)' : '') + '">' +
      '<h4>' + esc(b.z) + (esPuerta ? ' 🚪' : '') + '</h4>' +
      '<p><span class="chip" style="font-size:10px">' + esc(b.dir) + '</span> <span class="chip" style="font-size:10px">' + esc(b.el) + '</span></p>' +
      '<p class="muted">🎨 ' + esc(b.col) + '</p>' +
      '<p class="muted">🔍 ' + esc(b.preg) + '</p>' +
      '<p style="font-size:12px">💡 ' + esc(b.curas) + '</p>' +
      (esPuerta ? '<p class="chip" style="font-size:10px;border-color:var(--gold);color:var(--gold)">Tu puerta mira aquí: refuerza entrada + luz</p>' : '') +
      '</div>';
  }).join('');
  var f = $('fsBaguaFoco');
  if (f) {
    var focos = BAGUA.map(function (b) { return '<option' + (s.perfil.foco === b.z ? ' selected' : '') + '>' + esc(b.z) + '</option>'; }).join('');
    f.innerHTML = '<option value="">— Elige tu foco de esta luna —</option>' + focos;
  }
}

function renderKua() {
  var box = $('fsKuaBox'); if (!box) return;
  var s = store(), k = s.kua;
  var n = (k.anio && k.sexo) ? calcKua(k.anio, k.sexo) : null;
  if (!n) {
    box.innerHTML = '<p class="muted">Calcula tu número arriba: año de nacimiento (calendario solar, ene–dic) + sexo. Es una guía de orientación, no un destino.</p>';
    return;
  }
  var info = KUA_INFO[n];
  if (!info) { box.innerHTML = '<p class="muted">Número no válido. Revisa el año.</p>'; return; }
  box.innerHTML = '<div class="fishing-grid"><div class="menstrual-card" style="border-color:var(--gold)">' +
    '<h4>☯️ Tu Kua es ' + n + ' · grupo ' + esc(info.g) + '</h4>' +
    '<p style="font-size:12px">Elemento: ' + esc(info.el) + '</p>' +
    '<p class="muted" style="font-size:12px">✅ Favorable: ' + esc(info.fav) + '<br>🚫 A evitar para cama/escritorio: ' + esc(info.ev) + '</p>' +
    '<p style="font-size:12px">💡 ' + esc(info.tip) + '</p></div>' +
    '<div class="menstrual-card"><h4>🧭 Aplícalo hoy (sin remodelar)</h4>' +
    '<p class="muted" style="font-size:12px">• Duerme con la cabeza hacia una dirección favorable.<br>• Escritorio mirando a una favorable (aunque sea en diagonal).<br>• Puerta de entrada: si cae en zona a evitar, compensa con luz + orden + planta.</p></div></div>';
}

function renderElementos() {
  var box = $('fsElemBox'); if (!box) return;
  box.innerHTML = ELEMENTOS.map(function (e) {
    return '<div class="si-card"><h4>' + esc(e.n) + '</h4>' +
      '<p class="muted">' + esc(e.col) + ' · 🏠 ' + esc(e.enCasa) + '</p>' +
      '<p class="muted" style="font-size:12px">🔄 ' + esc(e.alimenta) + ' · ⛔ ' + esc(e.controla) + '</p>' +
      '<p style="font-size:12px">⬇️ ' + esc(e.falta) + '<br>⬆️ ' + esc(e.exceso) + '</p></div>';
  }).join('') +
  '<div class="si-card" style="border-color:var(--gold)"><h4>⚖️ Ciclo en una frase</h4><p>💧 nutre 🌳 → 🌳 alimenta 🔥 → 🔥 crea 🪨 → 🪨 crea ⚙️ → ⚙️ nutre 💧. Para calmar un exceso usa su control (ej: mucha agua → tierra). Para levantar una falta usa quien la alimenta.</p></div>';
}

function renderCasa() {
  var wrap = $('fsCasaWrap'); if (!wrap) return;
  var s = store();
  wrap.innerHTML = HABITATS.map(function (h) {
    var ok = h.items.filter(function (_, i) { return s.checks[h.id + '_' + i]; }).length;
    var pct = Math.round(ok / h.items.length * 100);
    return '<div class="menstrual-card" style="margin-top:10px"><h4>' + esc(h.n) + ' · ' + ok + '/' + h.items.length + ' (' + pct + '%)</h4>' +
      '<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin-bottom:6px"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#8fd694,#e8c56a)"></div></div>' +
      h.items.map(function (t, i) {
        var k = h.id + '_' + i, v = !!s.checks[k];
        return '<label class="check-row" style="font-size:12px"><input type="checkbox" data-fs="' + k + '"' + (v ? ' checked' : '') + '> ' + esc(t) + '</label>';
      }).join('') + '</div>';
  }).join('');
  wrap.querySelectorAll('[data-fs]').forEach(function (c) {
    c.onchange = function () {
      var st = store();
      if (c.checked) st.checks[c.getAttribute('data-fs')] = true;
      else delete st.checks[c.getAttribute('data-fs')];
      save(c.checked ? 'Hábito sumado ☯️' : 'Guardado');
      renderCasa(); renderResumen();
    };
  });
}

function renderCuras() {
  var box = $('fsCurasList'); if (!box) return;
  var d = store().curas.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  var st = $('fsCurasStats');
  if (st) st.textContent = d.length + ' curas · ' + d.filter(function (r) { return r.fecha === todayKey(); }).length + ' hoy';
  if (!d.length) { box.innerHTML = '<p class="muted">Sin curas aún. Registra tu primera activación arriba: zona + acción + fecha.</p>'; return; }
  box.innerHTML = d.slice(0, 60).map(function (r) {
    return '<div class="habit-item"><b>🕯️ ' + esc(r.zona || '') + '</b> <span class="muted" style="font-size:11px">· ' + esc(r.fecha || '') + '</span>' +
      '<p style="font-size:12px">' + esc(r.accion || '') + (r.nota ? ' <span class="muted">· ' + esc(r.nota) + '</span>' : '') + '</p>' +
      '<div style="display:flex;gap:6px"><button class="btn" style="width:auto;font-size:11px" data-del="' + r.id + '">✕ Borrar</button></div></div>';
  }).join('');
  box.querySelectorAll('[data-del]').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar esta cura?')) return;
      var st2 = store();
      st2.curas = st2.curas.filter(function (x) { return x.id !== b.getAttribute('data-del'); });
      save(); renderCuras(); renderResumen();
    };
  });
}

function renderAll() { renderResumen(); renderBagua(); renderKua(); renderElementos(); renderCasa(); renderCuras(); }

/* ---------------- DIALOGO ---------------- */
function buildDialog() {
  var dirs = ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste'];
  var body =
    '<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">' +
    '<button type="button" id="tabFsResumen" class="btn btn-accent" style="width:auto">☯️ Resumen</button>' +
    '<button type="button" id="tabFsBagua" class="btn" style="width:auto">🗺️ Bagua</button>' +
    '<button type="button" id="tabFsKua" class="btn" style="width:auto">🧭 Kua y Elementos</button>' +
    '<button type="button" id="tabFsCasa" class="btn" style="width:auto">🏠 Mi Casa</button>' +
    '<button type="button" id="tabFsCuras" class="btn" style="width:auto">🕯️ Curas</button>' +
    '<button type="button" id="tabFsGuia" class="btn" style="width:auto">📖 Guía</button></div>' +

    '<div id="fsResumen"></div>' +

    '<div id="fsBagua" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧲 Mi puerta mira hacia…</h4>' +
    '<p class="muted" style="font-size:11px">Párate en la puerta mirando hacia afuera con la brújula del celu. Elige la dirección: el mapa se marca con 🚪 y te dice qué reforzar.</p>' +
    '<div class="conv-row"><label>Dirección puerta <select id="fsPuerta">' + dirs.map(function (d) { return '<option>' + d + '</option>'; }).join('') + '</select></label>' +
    '<label>Foco de esta luna <select id="fsBaguaFoco"></select></label></div>' +
    '<p class="muted" style="font-size:11px">Método puerta (el más simple y el que usamos aquí): la zona Bagua de tu puerta es tu punto de partida. Sur = hemisferio norte clásico; en Penco úsalo como mapa de intenciones, no como dogma — ver 📖 Guía.</p></div>' +
    '<div id="fsBaguaGrid" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="fsKua" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🧭 Calcula tu número Kua</h4>' +
    '<div class="conv-row"><label>Año nacimiento <input type="number" id="fsKuaAnio" min="1900" max="2100" placeholder="ej: 1985"></label>' +
    '<label>Sexo <select id="fsKuaSexo"><option value="M">Masculino</option><option value="F">Femenino</option></select></label></div>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="fsKuaCalc" class="btn btn-accent" style="width:auto">Calcular mi Kua</button></div></div>' +
    '<div id="fsKuaBox" style="margin-top:10px"></div>' +
    '<div id="fsElemBox" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div></div>' +

    '<div id="fsCasa" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🏠 Perfil de mi casa</h4>' +
    '<div class="conv-row"><label style="flex:2">Tipo <select id="fsTipo"><option>Casa</option><option>Departamento</option><option>Pieza / allegada</option><option>Ruka / campo</option><option>Otro</option></select></label>' +
    '<label>Puerta <select id="fsTipoPuerta">' + dirs.map(function (d) { return '<option>' + d + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Nota (ej: arriendo, 2 piezas, patio chico) <input type="text" id="fsNota" placeholder="ej: casa Penco, living chico, patio con parra" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="fsPerfilSave" class="btn btn-accent" style="width:auto">Guardar perfil</button></div></div>' +
    '<div id="fsCasaWrap"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="fsCasaStats" class="muted" style="font-size:11px"></span><button type="button" id="fsCasaShare" class="btn" style="width:auto">📤 Compartir avance</button></div></div>' +

    '<div id="fsCuras" class="hidden">' +
    '<div class="menstrual-card" style="border-color:var(--gold)"><h4>➕ Registrar cura / activación</h4>' +
    '<div class="conv-row"><label>Zona Bagua <select id="fsCuraZona">' + BAGUA.map(function (b) { return '<option>' + esc(b.z) + '</option>'; }).join('') + '</select></label>' +
    '<label>Fecha <input type="date" id="fsCuraFecha"></label></div>' +
    '<label>Acción <input type="text" id="fsCuraAcc" placeholder="ej: puse lámpara cálida + planta en sureste" maxlength="80"></label>' +
    '<label>Nota / intención <input type="text" id="fsCuraNota" placeholder="ej: intención: trabajo estable" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="fsCuraAdd" class="btn btn-accent" style="width:auto">+ Guardar cura</button></div></div>' +
    '<div class="menstrual-card" style="margin-top:10px"><h4>⚡ Curas rápidas (sin comprar nada)</h4><p class="muted" style="font-size:12px;line-height:1.7">' +
    CURAS_RAPIDAS.map(function (c) { return esc(c); }).join('<br>') + '</p></div>' +
    '<div id="fsCurasList" class="habits-list" style="margin-top:10px;max-height:260px"></div>' +
    '<div class="dlg-actions" style="justify-content:space-between;margin-top:8px"><span id="fsCurasStats" class="muted" style="font-size:11px"></span><button type="button" id="fsCurasShare" class="btn" style="width:auto">📤 Compartir curas</button></div></div>' +

    '<div id="fsGuia" class="hidden">' +
    '<div class="si-card"><h4>☯️ Feng Shui en 1 minuto</h4><p><b>Viento y agua:</b> que el aire (chi) circule y la vida fluya. 3 reglas de oro: <b>1) todo funciona</b> (nada roto/atorado), <b>2) todo respira</b> (luz, aire, espacio), <b>3) todo te quiere</b> (solo lo útil o lo amado). Si algo está roto, sucio o guardado “por si acaso” hace 2 años, está frenando tu chi.</p></div>' +
    '<div class="si-card"><h4>🧲 Hemisferio sur (Penco): cómo adaptar el mapa</h4><p>El Bagua clásico nació en el norte: sur = sol/fama. En Chile el sol fuerte da al <b>norte</b>. Dos caminos válidos: <b>A)</b> usar el mapa tal cual (intención manda, lo usan miles en el sur) o <b>B)</b> espejar norte↔sur en tu cabeza (norte = luz/fuego). Esta app usa el método A (puerta) por simpleza y lo dice: <b>elige uno y mantenlo 3 lunas</b>. Lo que más pesa siempre es orden, luz y reparación, no la brújula perfecta.</p></div>' +
    '<div class="si-card"><h4>🪞 Espejos: la cura más mal usada</h4><p>✅ Sí: multiplicar planta, mesa puesta o vista linda; agrandar pasillo oscuro; tapar “fuga” (ej: frente a baño).<br>❌ No: frente a puerta (rebota lo bueno), reflejando cama (inquieta el sueño), enfrentados entre sí, ni rotos/manchados. En pieza: si refleja la cama, cúbrelo de noche.</p></div>' +
    '<div class="si-card"><h4>🌙 Ritmo lunar de orden (13 lunas)</h4><p>' + RITMO_LUNAR.map(function (r) { return '<b>' + esc(r.f) + ':</b> ' + esc(r.q); }).join('<br>') + '<br>Regla pencona: <b>menguante = botar y reparar</b> (bodega, papeles, fugas), <b>creciente = activar</b> (luz, planta, color). Una zona Bagua por luna: en 9 lunas das la vuelta completa.</p></div>' +
    '<div class="si-card"><h4>⚠️ Errores comunes en casa chilena</h4><p>• Cocina a leña apagada llena de cachureos (es tu fuego/prosperidad: limpia aunque no la uses).<br>• Bodega = zona amor/saber tapada: ordena 15 min por menguante.<br>• Humedad de Penco sin ventilar (el chi se pudre: 10 min de aire al día aunque llueva).<br>• Cama contra muro del baño o bajo ventana sin respaldo.<br>• Entrada-bodega: si no entra ni tú cómodo, no entra lo bueno.</p></div>' +
    '<div class="si-card"><h4>🤝 Integración con tu calendario</h4><p>Este módulo conversa con: 🏠 <b>Tareas Hogar</b> (el orden físico va allá, la intención va aquí), 🔧 <b>Bitácora Taller</b> (reparar = cura mayor: anota la fuga/puerta/bisagra allá), 🌙 <b>luna actual</b> (el Resumen te dice si toca soltar o activar) y 🌿 <b>Lawen/Plantas</b> (el verde vivo es la cura Madera). Avanza 1 ambiente por semana: en 2 lunas tu casa cambia de cara.</p></div>' +
    '</div>';

  makeDialog('fengShuiDialog', '☯️ Feng Shui — mi casa en armonía',
    'Viento y agua para tu casa pencona: orden, luz y reparación con intención. Mapa Bagua, número Kua, 5 elementos y checklist por ambiente, al ritmo de las 13 lunas. <b>Privado y local</b>, 100% offline.',
    body);
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) inyectar botón en Hogar y Vida Práctica > Casa */
  try {
    var existing = $('btnFengShui');
    if (existing) {
      var oldG = existing.closest ? existing.closest('.action-group') : null;
      var inHogar = oldG && oldG.getAttribute && oldG.getAttribute('data-group') === 'hogar';
      if (!inHogar) { try { existing.remove(); } catch (e0) { try { existing.parentNode.removeChild(existing); } catch (e1) {} } existing = null; }
      else { try { existing.setAttribute('data-sub', 'casa'); } catch (eS) {} }
    }
    if (!existing) {
      var g = document.querySelector('.action-group[data-group="hogar"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnFengShui'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '☯️ Feng Shui';
        try { btn.setAttribute('data-sub', 'casa'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'feng shui bagua kua chi energia casa hogar armonia orden cura espejo puerta orientacion abundancia amor salud trabajo elementos madera fuego tierra metal agua decoracion limpieza energetica menguante creciente');
        var ref = g.querySelector('#btnHomeTasks');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME + BTN_ORDER + PRESETS + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnFengShui') < 0) ALL_BTNS.push('btnFengShui');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnFengShui = ['hogar', 'casa'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['hogar|casa'] && BTN_ORDER['hogar|casa'].indexOf('btnFengShui') < 0) {
      var _o = BTN_ORDER['hogar|casa'], _ni = _o.indexOf('btnHomeTasks');
      if (_ni < 0) _o.push('btnFengShui'); else _o.splice(_ni + 1, 0, 'btnFengShui');
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnFengShui = true; });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Hogar) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnFengShui"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Hogar') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnFengShui"> ☯️ Feng Shui';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnFengShui !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnFengShui = lab.querySelector('input').checked;
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

  /* 4) diálogo + renders */
  buildDialog();
  try {
    var s = store();
    if ($('fsPuerta') && s.perfil.puerta) $('fsPuerta').value = s.perfil.puerta;
    if ($('fsTipo') && s.perfil.tipo) $('fsTipo').value = s.perfil.tipo;
    if ($('fsTipoPuerta') && s.perfil.puerta) $('fsTipoPuerta').value = s.perfil.puerta;
    if ($('fsNota') && s.perfil.nota) $('fsNota').value = s.perfil.nota;
    if ($('fsKuaAnio') && s.kua.anio) $('fsKuaAnio').value = s.kua.anio;
    if ($('fsKuaSexo') && s.kua.sexo) $('fsKuaSexo').value = s.kua.sexo;
  } catch (e) {}
  renderAll();

  var b = $('btnFengShui');
  if (b) b.onclick = function () {
    renderAll();
    switchTab('Resumen');
    openDlg('fengShuiDialog');
  };

  TABS.forEach(function (t) {
    var tb = $('tabFs' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  var fp = $('fsPuerta');
  if (fp) fp.onchange = function () {
    var st = store();
    st.perfil.puerta = fp.value;
    save('Puerta guardada 🧲');
    renderBagua(); renderResumen();
  };
  var ff = $('fsBaguaFoco');
  if (ff) ff.onchange = function () {
    var st = store();
    st.perfil.foco = ff.value;
    save('Foco lunar guardado 🌙');
  };
  var kc = $('fsKuaCalc');
  if (kc) kc.onclick = function () {
    var a = ($('fsKuaAnio') || {}).value, sx = ($('fsKuaSexo') || {}).value || 'M';
    var n = calcKua(a, sx);
    if (!n) return alert('Escribe un año válido (ej: 1985)');
    var st = store();
    st.kua = { anio: a, sexo: sx, num: n };
    save('Kua ' + n + ' calculado 🧭');
    renderKua();
  };
  var ps = $('fsPerfilSave');
  if (ps) ps.onclick = function () {
    var st = store();
    st.perfil.tipo = ($('fsTipo') || {}).value || 'Casa';
    st.perfil.puerta = ($('fsTipoPuerta') || {}).value || st.perfil.puerta || 'Norte';
    st.perfil.nota = clean((($('fsNota') || {}).value || ''), 80);
    if ($('fsPuerta')) $('fsPuerta').value = st.perfil.puerta;
    save('Perfil guardado 🏠');
    renderBagua(); renderResumen();
    var cs = $('fsCasaStats');
    if (cs) { var sc = totalChecks(); cs.textContent = '🏠 ' + st.perfil.tipo + ' · puerta ' + st.perfil.puerta + ' · armonía ' + sc.pct + '%'; }
  };
  var cs2 = $('fsCasaShare');
  if (cs2) cs2.onclick = function () {
    var sc = totalChecks(), st = store();
    share('☯️ Mi casa en armonía (' + sc.pct + '%)',
      '🏠 ' + (st.perfil.tipo || 'Casa') + ' · puerta ' + (st.perfil.puerta || '?') + '\nArmonía: ' + sc.ok + '/' + sc.t + ' (' + sc.pct + '%)\nFoco: ' + (st.perfil.foco || '—') + '\nPróximo: ' + proximaAccion());
  };
  var ca = $('fsCuraAdd');
  if (ca) ca.onclick = function () {
    var acc = clean((($('fsCuraAcc') || {}).value || '').trim(), 80);
    if (!acc) return alert('Describe la cura (ej: lámpara cálida en sureste)');
    store().curas.push({
      id: uid('fs'), zona: ($('fsCuraZona') || {}).value || 'Centro · equilibrio',
      fecha: ($('fsCuraFecha') || {}).value || todayKey(),
      accion: acc, nota: clean((($('fsCuraNota') || {}).value || '').trim(), 80)
    });
    save('Cura guardada 🕯️');
    if ($('fsCuraAcc')) $('fsCuraAcc').value = '';
    if ($('fsCuraNota')) $('fsCuraNota').value = '';
    renderCuras(); renderResumen();
  };
  var csh = $('fsCurasShare');
  if (csh) csh.onclick = function () {
    var d = store().curas.slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 15);
    if (!d.length) return alert('Sin curas para compartir');
    share('🕯️ Mis curas Feng Shui (' + d.length + ')',
      d.map(function (r) { return '· ' + r.fecha + ' · ' + r.zona + ': ' + r.accion; }).join('\n'));
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

})();
