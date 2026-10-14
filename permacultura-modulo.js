/* ============================================================
   PERMACULTURA — Calendario 13 Lunas (Penco · Bío-Bío)
   Sección hub dentro de Territorio > Tierra:
   - Botón btnPermacultura (inyectado en grupo territorio, sub tierra,
     junto a Mi Huerta / Electrocultura: marco de diseño que los une)
   - Diálogo permaculturaDialog con 6 pestañas (la 1ª es la Guía):
     1) 📖 Guía (qué es, 3 éticas, ruta en 5 pasos, zonas, agua, luna, 12 principios)
     2) 🌿 Diseño (resumen del sitio, principios, mapa por zonas)
     3) 🗺️ Mi sitio (CRUD espacios/zonas: zona 0-5, sol, agua, suelo)
     4) 🌱 Sistemas (CRUD: huerto bosque, espiral, captación agua,
         compost, gallinero, baño seco… con estado y zona)
     5) ✅ Tareas (diseño, instalación y mantención por sistema)
     6) 📓 Bitácora (observaciones + cosechas del diseño)
   - No duplica: deriva el detalle a las secciones que ya existen:
     🏡 Mi Huerta (btnHuerta: bancales/cultivos), 🌱 Siembra,
     🪱 Compost (btnCompost), 💧 Agua (btnAgua), 💧 Hidroponía
     (btnHidroponia), ⚡ Electrocultura (btnElectrocultura),
     🌿 Lawen (btnLawen), 🌳 Bosque (btnBosque).
     Esta sección es el DISEÑO del conjunto.
   - Todo local y privado por usuario: userData().permacultura
     { sitios:[], sistemas:[], tareas:[], bitacora:[] }
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
function store() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return { sitios: [], sistemas: [], tareas: [], bitacora: [] };
    if (!u.permacultura) u.permacultura = { sitios: [], sistemas: [], tareas: [], bitacora: [] };
    var m = u.permacultura;
    if (!Array.isArray(m.sitios)) m.sitios = [];
    if (!Array.isArray(m.sistemas)) m.sistemas = [];
    if (!Array.isArray(m.tareas)) m.tareas = [];
    if (!Array.isArray(m.bitacora)) m.bitacora = [];
    return m;
  } catch (e2) { return { sitios: [], sistemas: [], tareas: [], bitacora: [] }; }
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
function gotoBtn(id) { try { var x = $(id); if (x) { x.click(); return true; } } catch (e) {} return false; }

/* ---------------- REFERENCIAS ---------------- */
var ZONAS = [
  { id: '0', n: 'Zona 0 · La casa', d: 'Vivienda: cocina, agua, energía. Todo diseño parte aquí.' },
  { id: '1', n: 'Zona 1 · Visita diaria', d: 'Hierbas, ensaladas, invernadero, compost cocina, gallinas. A pasos de la puerta.' },
  { id: '2', n: 'Zona 2 · Visita 2-3 veces/semana', d: 'Huerta principal, frutales enanos, mulch, riego por goteo.' },
  { id: '3', n: 'Zona 3 · Visita semanal', d: 'Frutales, papas, maíz, porotos, forraje, colmenas.' },
  { id: '4', n: 'Zona 4 · Semi-silvestre', d: 'Leña, madera, recolección, pastoreo. Mínimo manejo.' },
  { id: '5', n: 'Zona 5 · Silvestre', d: 'No se interviene: se observa y aprende. Refugio de biodiversidad.' }
];
function zonaNombre(id) {
  for (var i = 0; i < ZONAS.length; i++) if (ZONAS[i].id === id) return ZONAS[i].n;
  return 'Zona ' + id;
}
var TIPOS_SISTEMA = ['Huerto bosque / frutales', 'Espiral de hierbas', 'Cama alta / keyhole', 'Captación agua lluvia', 'Zanja infiltración / swale', 'Compost / lombriz', 'Gallinero móvil', 'Invernadero / túnel', 'Semillero', 'Baño seco / aguas grises', 'Cortaviento vivo', 'Antena / experimento', 'Otro'];
var ESTADOS_SIS = ['💡 Idea', '📐 Diseñado', '🔨 Instalando', '🌱 Activo', '🛠️ En reparación', '💤 En pausa'];
var TIPOS_TAREA = ['Observar / mapear', 'Diseñar', 'Instalar / construir', 'Plantar', 'Acolchar / abonar', 'Riego', 'Poda / manejo', 'Cosecha', 'Guardar semillas', 'Reparar', 'Otra'];
var PRINCIPIOS = [
  { n: '1 · Observa e interactúa', ico: '👁️', txt: 'Mira tu sitio 1 luna completa antes de mover tierra: dónde pega el sol de invierno, dónde se empoza con lluvia, por dónde entra el sur, dónde va la sombra del vecino. El mejor diseño nace de mirar, no de comprar.' },
  { n: '2 · Captura y almacena energía', ico: '💧', txt: 'Cada gota de lluvia de Penco que se va al alcantarillado es cosecha perdida: techo → canaleta → tambor → riego. Cada resto de cocina es fertilidad futura (compost). Cada hora de sol de verano es conserva para invierno.' },
  { n: '3 · Obtén un rendimiento', ico: '🧺', txt: 'Diseña para comer esta temporada, no “algún día”: ensaladas de 35 días junto a frutales de 3 años. Si un sistema no da comida, forraje, leña, agua o abrigo en 1 año, rediséñalo.' },
  { n: '4 · Autorregula y acepta retroalimentación', ico: '🔄', txt: 'Si las babosas arrasan, el diseño falló (falta pato, falta cobre, exceso de humedad), no “la naturaleza”. Anota en 📓 Bitácora y ajusta: el error es el maestro gratis.' },
  { n: '5 · Usa y valora recursos renovables', ico: '♻️', txt: 'Coligüe del cerro, guano de gallina propia, mulch de hojas de otoño, semillas guardadas. Lo que entra de afuera (sacos, plástico, bencina) debe bajar cada año.' },
  { n: '6 · No produzcas desperdicios', ico: '🚫', txt: '“Desecho” = recurso fuera de lugar: orina diluida al limón, cáscaras a la lombriz, agua del enjuague a la frutilla, poda a mulch o a leña fina. Cierra los ciclos en tu mapa.' },
  { n: '7 · Diseña de patrones a detalles', ico: '🗺️', txt: 'Primero el agua (¿a dónde corre?), el viento (¿qué frena el sur?), el sol (¿qué da sombra a qué?) y los caminos. Los bancales vienen DESPUÉS del mapa, no antes.' },
  { n: '8 · Integra en vez de segregar', ico: '🐔', txt: 'Gallina + huerto (come babosas, abona), árbol + gallina (sombra + fruta caída), casa + invernadero (muro norte tibio). Cada elemento cumple 3+ funciones; cada función la cubren 2+ elementos.' },
  { n: '9 · Usa soluciones lentas y pequeñas', ico: '🐢', txt: 'Un bancal bien hecho este mes vale más que media hectárea soñada. Crece por módulos que ya funcionan: espiral → cama alta → frutal → zanja.' },
  { n: '10 · Usa y valora la diversidad', ico: '🌈', txt: '10 cultivos + flores + hierbas + frutal + gallinas resisten plaga, temporal y olvido. Monocultivo (solo lechuga, solo tomate) es invitar a la plaga a banquete.' },
  { n: '11 · Usa los bordes y valora lo marginal', ico: '🌅', txt: 'El borde cerco-huerta, techo-muro, acequia-camino es lo más productivo: zarzamora en el cerco, frutilla al borde del bancal, enredadera al muro norte. Lo “feo” del sitio es oro.' },
  { n: '12 · Responde creativamente al cambio', ico: '🌊', txt: 'Temporal botó el palto: replanta con cortaviento. Verano seco: más mulch y menos superficie regada. El clima de Penco cambia: tu diseño también.' }
];
var AGUA_PENCO = [
  { n: 'Lee tu agua antes de cavar', ico: '🌧️', txt: 'Penco: invierno con exceso (empoza, escurre, erosiona) y verano con falta (enero-marzo). Camina tu sitio con lluvia fuerte: marca con estacas dónde corre, dónde se estanca y dónde erosiona. Ese mapa manda todo lo demás.' },
  { n: 'Techo → tambor → riego', ico: '🛢️', txt: 'Cada m² de techo da ~1 litro por mm de lluvia: techo de 50 m² con 100 mm de junio = 5.000 litros. Canaleta + filtro de hojas + tambor 200 L con tapa (zancudos) + llave abajo. Primer paso barato antes de cualquier zanja.' },
  { n: 'Zanjas a nivel (swales) en pendiente', ico: '⛰️', txt: 'En ladera: zanja a nivel con el bordo abajo plantado (frutal + mulch). Frena el agua, la infiltra y riega sola. Regla: empieza ARRIBA y chica; nunca zanja grande sin bordo plantado (se vuelve canal de erosión con el primer temporal).' },
  { n: 'Acolcha o riega el doble', ico: '🍂', txt: 'Suelo desnudo en verano Penco pierde el agua en días. 10 cm de mulch (hojas, paja, viruta) = mitad de riego + suelo vivo. El riego por goteo al amanecer + mulch es la dupla que funciona con agua escasa.' }
];

/* ---------------- DIALOGO ---------------- */
var TABS = ['Guia', 'Diseno', 'Sitio', 'Sistemas', 'Tareas', 'Bitacora'];
function switchTab(name) {
  TABS.forEach(function (t) {
    var p = $('perma' + t), b = $('tabPerma' + t);
    if (p) p.classList.toggle('hidden', t !== name);
    if (b) b.classList.toggle('btn-accent', t === name);
  });
}
function hubRow() {
  return '<div class="menstrual-card su-68a1a9"><h4>🧭 Tu Territorio ya tiene las piezas: aquí las diseñas juntas</h4>' +
    '<p class="muted su-11a508">🌿 Permacultura es el <b>mapa del conjunto</b>. El detalle vive donde corresponde:</p>' +
    '<div class="su-67b198">' +
    '<button type="button" class="btn su-30e741" data-hub="btnHuerta">🏡 Mi Huerta</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnCompost">🪱 Compost</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnAgua">💧 Agua</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnHidroponia">💧 Hidroponía</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnElectrocultura">⚡ Electrocultura</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnLawen">🌿 Lawen</button>' +
    '<button type="button" class="btn su-30e741" data-hub="btnBosque">🌳 Bosque</button>' +
    '</div><p class="muted su-11a508" id="permaHubMsg">Si un botón no aparece, actívalo en ⚙️ Personalizar.</p></div>';
}
function bindHub(scope) {
  (scope || document).querySelectorAll('[data-hub]').forEach(function (b) {
    if (b.dataset.permaOk) return;
    b.dataset.permaOk = '1';
    b.onclick = function () {
      if (!gotoBtn(b.getAttribute('data-hub'))) {
        var m = $('permaHubMsg');
        if (m) m.textContent = 'Esa herramienta está oculta: actívala en ⚙️ Personalizar.';
      }
    };
  });
}

function bindGuiaCTA() {
  var m = { permaGuiaGoSitio: 'Sitio', permaGuiaGoSis: 'Sistemas', permaGuiaGoDiseno: 'Diseno' };
  Object.keys(m).forEach(function (id) {
    var el = $(id);
    if (el) el.onclick = function () { switchTab(m[id]); };
  });
}

function buildDialog() {
  var princHTML = PRINCIPIOS.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
  var aguaHTML = AGUA_PENCO.map(function (c) {
    return '<div class="si-card"><h4>' + c.ico + ' ' + esc(c.n) + '</h4><p>' + esc(c.txt) + '</p></div>';
  }).join('');
  var zonasHTML = ZONAS.map(function (z) {
    return '<div class="si-card"><h4>📍 ' + esc(z.n) + '</h4><p class="muted">' + esc(z.d) + '</p></div>';
  }).join('');

  var guiaIntroHTML =
    '<div class="menstrual-card su-68a1a9"><h4>🌿 ¿Qué es la permacultura?</h4>' +
    '<p>Es <b>diseñar tu casa y tu terreno como la naturaleza</b>: que el agua, los restos de cocina, el sol y hasta las “malezas” trabajen para ti en vez de darte más pega. Nació en los 70 con <b>Bill Mollison y David Holmgren</b> y se resume en una idea: <b>cosechar más de lo que gastas, sin agotar la tierra</b>.</p>' +
    '<p class="muted su-11a508">No es solo huerta: es dónde pones la cocina, a dónde va el agua del techo, dónde da el sol de invierno, dónde corre el viento sur de Penco… y después recién qué plantas.</p></div>' +
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>🌎 Cuidar la tierra</h4><p class="muted su-11a508">Suelo vivo, agua limpia, bosque y nativas. Si la tierra está mejor cada año, vas bien.</p></div>' +
    '<div class="menstrual-card"><h4>🧑‍🤝‍🧑 Cuidar a las personas</h4><p class="muted su-11a508">Comida sana, casa abrigada y pega digna para ti y tu familia, hoy y en invierno.</p></div>' +
    '<div class="menstrual-card"><h4>🤲 Repartir con justicia</h4><p class="muted su-11a508">Semillas, excedentes y saberes se comparten. Pon límites al consumo y devuelve a la tierra.</p></div></div>' +
    '<div class="menstrual-card"><h4>🧭 ¿Cómo parto aquí? Ruta en 5 pasos</h4>' +
    '<p class="muted su-11a508"><b>1. Lee esta guía</b> (estás aquí) → <b>2. Mapea</b> en 🗺️ Mi sitio (zonas 0–5, sol, agua) → <b>3. Instala 1 sistema</b> en 🌱 Sistemas (ej: espiral o tambor de lluvia) → <b>4. Anota tareas</b> en ✅ Tareas → <b>5. Observa y cosecha</b> en 📓 Bitácora. Después mira tu avance en 🌿 Diseño.</p>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="permaGuiaGoSitio" class="btn btn-accent su-30e741">➕ 1 · Mapear mi sitio</button>' +
    '<button type="button" id="permaGuiaGoSis" class="btn su-30e741">🌱 2 · Instalar un sistema</button>' +
    '<button type="button" id="permaGuiaGoDiseno" class="btn su-30e741">🌿 Ver mi diseño</button></div></div>' +
    '<div class="menstrual-card"><h4>❓ En 30 segundos</h4><p class="muted su-11a508"><b>¿Necesito campo grande?</b> No: parte en patio, balcón o 2 m² junto a la cocina (Zona 1).<br><b>¿Cuánto observo?</b> 1 luna mirando sol, agua y viento antes de picar.<br><b>¿Y si me equivoco?</b> Se anota en Bitácora y se ajusta: el error es el maestro gratis.</p></div>';

  var body =
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabPermaGuia" class="btn btn-accent su-30e741">📖 Guía: qué es</button>' +
    '<button type="button" id="tabPermaDiseno" class="btn su-30e741">🌿 Diseño</button>' +
    '<button type="button" id="tabPermaSitio" class="btn su-30e741">🗺️ Mi sitio</button>' +
    '<button type="button" id="tabPermaSistemas" class="btn su-30e741">🌱 Sistemas</button>' +
    '<button type="button" id="tabPermaTareas" class="btn su-30e741">✅ Tareas</button>' +
    '<button type="button" id="tabPermaBitacora" class="btn su-30e741">📓 Bitácora</button></div>' +

    '<div id="permaGuia">' + guiaIntroHTML + hubRow() +
    '<div class="menstrual-card"><h4>📍 Zonas 0–5 (pon cada cosa donde la visitas)</h4><p class="muted su-11a508">Lo diario junto a la puerta; lo anual lejos. Si caminas 50 m por perejil, el diseño está mal.</p></div><div class="su-bf3828">' + zonasHTML + '</div>' +
    '<div class="menstrual-card"><h4>💧 Agua en Penco (el diseño manda)</h4></div><div class="su-bf3828">' + aguaHTML + '</div>' +
    '<div class="menstrual-card"><h4>🌙 Luna y diseño</h4><p class="muted su-11a508">Menguante: mover tierra, trasplantar, podar, construir (savia abajo, menos estrés). Creciente: sembrar y plantar. Llena: observar y cosechar hoja/fruto. Nueva: planificar y guardar semillas. El calendario te dice la luna de hoy: úsala para ordenar las tareas.</p></div>' +
    '<div class="menstrual-card"><h4>📖 Los 12 principios (Holmgren, en criollo)</h4></div><div class="su-bf3828">' + princHTML + '</div>' +
    '<div class="menstrual-card su-51d56a"><h4>🧭 Regla de oro</h4><p class="muted su-6cb285">Empieza chico, observa 1 luna, instala 1 sistema que dé comida este año, anótalo y recién crece. El mejor fertilizante es la sombra del diseñador… visitando a diario.</p></div></div>' +

    '<div id="permaDiseno" class="hidden"></div>' +

    '<div id="permaSitio" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Nuevo espacio del sitio</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Espacio * <input type="text" id="permaSNombre" placeholder="ej: Patio norte, Ladera sur, Techo cocina" maxlength="50"></label>' +
    '<label>Zona <select id="permaSZona">' + ZONAS.map(function (z) { return '<option value="' + z.id + '">' + esc(z.n) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Superficie <input type="text" id="permaSSup" placeholder="ej: 3×1 m, 20 m²" maxlength="20"></label>' +
    '<label>Sol <select id="permaSSol"><option>☀️ Pleno sol</option><option>⛅ Medio día</option><option>🌥️ Sombra parcial</option><option>🌧️ Sombra / sur</option></select></label>' +
    '<label>Agua <select id="permaSAgua"><option>💧 Llega fácil (llave/canaleta)</option><option>🚶 Hay que llevarla</option><option>🌧️ Solo lluvia</option><option>💦 Se empoza en invierno</option></select></label></div>' +
    '<label>Nota (suelo, viento, pendiente...) <input type="text" id="permaSNota" placeholder="ej: arcilloso, viento sur fuerte, pendiente 15%" maxlength="120"></label>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="permaSAdd" class="btn btn-accent su-30e741">+ Guardar espacio</button></div></div>' +
    '<div id="permaSList" class="su-bf3828"></div></div>' +

    '<div id="permaSistemas" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Nuevo sistema</h4>' +
    '<div class="conv-row"><label class="su-4b3de7">Sistema * <input type="text" id="permaENombre" placeholder="ej: Espiral de hierbas, Tambor 200 L, Gallinero" maxlength="50"></label>' +
    '<label>Tipo <select id="permaETipo">' + TIPOS_SISTEMA.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="conv-row"><label>Espacio <select id="permaEEspacio"></select></label>' +
    '<label>Estado <select id="permaEEst">' + ESTADOS_SIS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<label>Funciones (¿qué da? ¿qué necesita?) <input type="text" id="permaENota" placeholder="ej: da hierbas + refugio insectos; necesita sol mañana y agua cerca" maxlength="120"></label>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="permaEAdd" class="btn btn-accent su-30e741">+ Guardar sistema</button></div></div>' +
    '<div class="conv-row su-d2c171"><label class="su-4b3de7">🔍 Buscar <input type="text" id="permaEQ" placeholder="nombre, tipo, espacio..."></label>' +
    '<label>Estado <select id="permaEF"><option value="">Todos</option>' + ESTADOS_SIS.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label></div>' +
    '<div id="permaEList" class="su-bf3828"></div></div>' +

    '<div id="permaTareas" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Nueva tarea</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="permaTFecha"></label><label>Sistema <select id="permaTSis"></select></label></div>' +
    '<div class="conv-row"><label>Tipo <select id="permaTTipo">' + TIPOS_TAREA.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
    '<label class="su-4b3de7">Tarea * <input type="text" id="permaTTxt" placeholder="ej: levantar espiral con piedras del cerco" maxlength="80"></label></div>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="permaTAdd" class="btn btn-accent su-30e741">+ Guardar tarea</button></div></div>' +
    '<div id="permaTResumen" class="menstrual-card su-8a77e5"></div>' +
    '<div id="permaTList" class="habits-list su-9daa59"></div></div>' +

    '<div id="permaBitacora" class="hidden">' +
    '<div class="menstrual-card su-68a1a9"><h4>➕ Observación / cosecha del diseño</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="permaBFecha"></label><label>Sistema <select id="permaBSis"></select></label></div>' +
    '<div class="conv-row"><label>Tipo <select id="permaBTipo"><option>👁️ Observación</option><option>🧺 Cosecha</option><option>🐛 Plaga / problema</option><option>🌧️ Clima / agua</option><option>💡 Idea / ajuste</option></select></label>' +
    '<label>Cosecha (kg/unid, si aplica) <input type="text" id="permaBKg" placeholder="ej: 2 kg, 12 unid" maxlength="20"></label></div>' +
    '<label>Detalle * <input type="text" id="permaBTxt" placeholder="ej: espiral retiene humedad 2 días más que bancal; mulch funcionó" maxlength="140"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="permaBAdd" class="btn su-30e741">+ Guardar en bitácora</button></div></div>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">🔍 Buscar <input type="text" id="permaBQ" placeholder="sistema, detalle..."></label></div>' +
    '<div id="permaBList" class="habits-list su-ebf445"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="permaBStats" class="muted su-11a508"></span><span class="su-3de8f9"><button type="button" id="permaBShare" class="btn su-30e741">📤 Compartir</button><button type="button" id="permaBClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>';

  makeDialog('permaculturaDialog', '🌿 Permacultura — ¿qué es y cómo diseño mi sitio?',
    'Zonas, sistemas, agua y tareas en un solo mapa. Hub de <b>🌊 Territorio Penco > Tierra</b>: el detalle productivo vive en 🏡 Mi Huerta, 🪱 Compost, 💧 Agua y ⚡ Electrocultura. Todo <b>privado y local</b>, 100% offline.',
    body);
}

/* ---------------- RENDER ---------------- */
function sitioById(id) {
  var f = null;
  store().sitios.forEach(function (x) { if (x.id === id) f = x; });
  return f;
}
function sistemaById(id) {
  var f = null;
  store().sistemas.forEach(function (x) { if (x.id === id) f = x; });
  return f;
}
function sistNombre(id) {
  var s = sistemaById(id);
  return s ? s.nombre : 'General';
}
function fillSistemaSelects() {
  var m = store();
  var opts = '<option value="">General (todo el sitio)</option>' + m.sistemas.map(function (s) {
    return '<option value="' + esc(s.id) + '">' + esc(s.nombre) + '</option>';
  }).join('');
  ['permaTSis', 'permaBSis'].forEach(function (id) {
    var el = $(id);
    if (el) {
      var cur = el.value;
      el.innerHTML = opts;
      if (cur) el.value = cur;
    }
  });
  var ee = $('permaEEspacio');
  if (ee) {
    var cur2 = ee.value;
    ee.innerHTML = '<option value="">Sin espacio asignado</option>' + m.sitios.map(function (s) {
      return '<option value="' + esc(s.id) + '">' + esc(s.nombre) + ' · ' + esc(zonaNombre(s.zona)) + '</option>';
    }).join('');
    if (cur2) ee.value = cur2;
  }
}
function renderDiseno() {
  var box = $('permaDiseno'); if (!box) return;
  var m = store();
  var activos = m.sistemas.filter(function (s) { return (s.estado || '').indexOf('Activo') >= 0; }).length;
  var ideas = m.sistemas.filter(function (s) { return (s.estado || '').indexOf('Idea') >= 0 || (s.estado || '').indexOf('Diseñado') >= 0; }).length;
  var obra = m.sistemas.filter(function (s) { return (s.estado || '').indexOf('Instalando') >= 0; }).length;
  var pend = m.tareas.filter(function (t) { return !t.hecha; }).length;
  var cosechas = m.bitacora.filter(function (b) { return (b.tipo || '').indexOf('Cosecha') >= 0; }).length;
  var porZona = {};
  m.sitios.forEach(function (s) { porZona[s.zona] = (porZona[s.zona] || 0) + 1; });
  var zonasTxt = m.sitios.length
    ? ZONAS.map(function (z) { return porZona[z.id] ? esc(z.n.split('·')[0].trim() + ': ' + porZona[z.id]) : null; }).filter(Boolean).join(' · ')
    : 'Dibuja tu primer espacio en 🗺️ Mi sitio.';
  box.innerHTML = hubRow() +
    '<div class="fishing-grid">' +
    '<div class="menstrual-card"><h4>🌿 Mi diseño</h4><p class="su-f3dba9"><b>' + m.sitios.length + '</b> <span class="su-6cb285">espacios</span> · <b>' + m.sistemas.length + '</b> <span class="su-6cb285">sistemas</span></p>' +
    '<p class="muted su-11a508">' + zonasTxt + '</p></div>' +
    '<div class="menstrual-card"><h4>🔄 Estado</h4><p class="su-de0080">🌱 <b>' + activos + '</b> activos · 🔨 <b>' + obra + '</b> en obra · 💡 <b>' + ideas + '</b> en idea/diseño</p>' +
    '<p class="muted su-11a508">✅ <b>' + pend + '</b> tarea(s) pendientes · 🧺 <b>' + cosechas + '</b> cosecha(s) anotadas</p></div></div>' +
    '<div class="dlg-actions su-8f9e27"><button type="button" id="permaGoSitio" class="btn su-30e741">➕ Mapear mi sitio</button>' +
    '<button type="button" id="permaGoSis" class="btn su-30e741">🌱 Instalar un sistema</button>' +
    '<button type="button" id="permaGoGuia" class="btn su-30e741">📖 Ver guía: qué es</button></div>';
  bindHub(box);
  var g1 = $('permaGoSitio'); if (g1) g1.onclick = function () { switchTab('Sitio'); };
  var g2 = $('permaGoSis'); if (g2) g2.onclick = function () { switchTab('Sistemas'); };
  var g3 = $('permaGoGuia'); if (g3) g3.onclick = function () { switchTab('Guia'); };
}
function renderSitios() {
  var box = $('permaSList'); if (!box) return;
  var m = store();
  if (!m.sitios.length) { box.innerHTML = '<p class="muted su-e201a8">Sin espacios aún. Mapea el primero arriba: ej “Patio norte”.</p>'; return; }
  box.innerHTML = m.sitios.slice().sort(function (a, b) {
    return String(a.zona).localeCompare(String(b.zona)) || String(a.nombre).localeCompare(String(b.nombre));
  }).map(function (s) {
    var nSis = m.sistemas.filter(function (e) { return e.espacio === s.id; }).length;
    return '<div class="si-card"><h4>📍 ' + esc(s.nombre) + '</h4>' +
      '<p class="su-6157e8"><span class="chip su-0d5be0">' + esc(zonaNombre(s.zona)) + '</span>' +
      (s.sol ? '<span class="chip su-0d5be0">' + esc(s.sol) + '</span>' : '') +
      (s.agua ? '<span class="chip su-0d5be0">' + esc(s.agua) + '</span>' : '') +
      (s.sup ? '<span class="chip su-0d5be0">📐 ' + esc(s.sup) + '</span>' : '') +
      (nSis ? '<span class="chip su-0d5be0">🌱 ' + nSis + ' sistema(s)</span>' : '') + '</p>' +
      (s.nota ? '<p class="muted">' + esc(s.nota) + '</p>' : '') +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn perma-s-del su-fd834a" data-k="' + esc(s.id) + '">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('.perma-s-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este espacio? (los sistemas quedan como “General”)')) return;
      var st = store();
      st.sitios = st.sitios.filter(function (x) { return x.id !== b.dataset.k; });
      st.sistemas.forEach(function (e) { if (e.espacio === b.dataset.k) e.espacio = ''; });
      save(); renderAll();
    };
  });
}
function renderSistemas() {
  var box = $('permaEList'); if (!box) return;
  var m = store();
  var q = (($('permaEQ') && $('permaEQ').value) || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var f = (($('permaEF') && $('permaEF').value) || '');
  var list = m.sistemas.filter(function (s) {
    if (f && s.estado !== f) return false;
    if (q) {
      var esp = sitioById(s.espacio);
      var t = ((s.nombre || '') + ' ' + (s.tipo || '') + ' ' + (s.nota || '') + ' ' + (esp ? esp.nombre : '')).toLowerCase();
      var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
      if (tn.indexOf(qn) < 0) return false;
    }
    return true;
  });
  if (!list.length) {
    box.innerHTML = '<p class="muted su-e201a8">Sin sistemas' + (m.sistemas.length ? ' con ese filtro.' : '. Instala el primero arriba: ej “Espiral de hierbas”.') + '</p>';
    return;
  }
  box.innerHTML = list.slice().sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre)); }).slice(0, 80).map(function (s) {
    var esp = sitioById(s.espacio);
    var ico = (s.tipo || '').indexOf('agua') >= 0 || (s.tipo || '').indexOf('Captación') >= 0 ? '💧' :
      (s.tipo || '').indexOf('Compost') >= 0 ? '🪱' : (s.tipo || '').indexOf('Gallinero') >= 0 ? '🐔' :
      (s.tipo || '').indexOf('Baño') >= 0 ? '🚻' : (s.tipo || '').indexOf('Invernadero') >= 0 ? '🏠' :
      (s.tipo || '').indexOf('Cortaviento') >= 0 ? '🌳' : '🌱';
    return '<div class="si-card"><h4>' + ico + ' ' + esc(s.nombre) + '</h4>' +
      '<p class="su-6157e8"><span class="chip su-0d5be0">' + esc(s.tipo || '') + '</span>' +
      (esp ? '<span class="chip su-0d5be0">📍 ' + esc(esp.nombre) + '</span>' : '') +
      (s.estado ? '<span class="chip su-0d5be0">' + esc(s.estado) + '</span>' : '') + '</p>' +
      (s.nota ? '<p class="muted">' + esc(s.nota) + '</p>' : '') +
      '<div class="su-c158a9">' +
      '<button type="button" class="btn perma-e-ok su-337714" data-k="' + esc(s.id) + '">🌱 Activo</button>' +
      '<button type="button" class="btn perma-e-del su-fd834a" data-k="' + esc(s.id) + '">✕</button></div></div>';
  }).join('');
  box.querySelectorAll('.perma-e-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Borrar este sistema?')) return;
      var st = store();
      st.sistemas = st.sistemas.filter(function (x) { return x.id !== b.dataset.k; });
      st.tareas = st.tareas.filter(function (x) { return x.sis !== b.dataset.k; });
      save(); renderAll();
    };
  });
  box.querySelectorAll('.perma-e-ok').forEach(function (b) {
    b.onclick = function () {
      var s = sistemaById(b.dataset.k); if (!s) return;
      s.estado = '🌱 Activo'; save('Sistema activo 🌱'); renderAll();
    };
  });
}
function renderTareas() {
  var box = $('permaTList'); if (!box) return;
  var m = store();
  var res = $('permaTResumen');
  var data = (m.tareas || []).slice().sort(function (a, b) { return (a.fecha || '').localeCompare(b.fecha || ''); });
  var pend = data.filter(function (t) { return !t.hecha; }).length;
  if (res) res.innerHTML = '<h4>✅ Tareas</h4><p class="muted su-6cb285">' + data.length + ' tarea(s) · <b>' + pend + '</b> pendiente(s)' + (pend ? ' · la próxima manda el diseño' : ' · 🟢 diseño al día') + '</p>';
  if (!data.length) { box.innerHTML = '<p class="muted su-e201a8">Sin tareas. Crea la primera arriba: ej “levantar espiral”.</p>'; return; }
  box.innerHTML = data.slice(0, 80).map(function (t) {
    return '<div class="hora-item"><span class="su-6cb285">' + (t.hecha ? '✅' : '⬜') + ' <b>' + esc(t.txt || '') + '</b>' +
      '<br><span class="muted su-0d5be0">' + esc(t.fecha || '') + ' · ' + esc(sistNombre(t.sis)) + ' · ' + esc(t.tipo || '') + '</span></span>' +
      '<span class="su-c158a9"><button type="button" class="btn btn-icon perma-t-ok" data-k="' + esc(t.id) + '" title="Hecha/pendiente">' + (t.hecha ? '↩' : '✓') + '</button>' +
      '<button type="button" class="btn btn-icon perma-t-del" data-k="' + esc(t.id) + '">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('.perma-t-ok').forEach(function (b) {
    b.onclick = function () {
      var st = store(), f = null;
      st.tareas.forEach(function (x) { if (x.id === b.dataset.k) f = x; });
      if (f) { f.hecha = !f.hecha; save(f.hecha ? 'Tarea hecha ✅' : 'De vuelta a pendientes'); renderAll(); }
    };
  });
  box.querySelectorAll('.perma-t-del').forEach(function (b) {
    b.onclick = function () {
      var st = store();
      st.tareas = st.tareas.filter(function (x) { return x.id !== b.dataset.k; });
      save(); renderAll();
    };
  });
}
function renderBitacora() {
  var box = $('permaBList'); if (!box) return;
  var m = store();
  var q = (($('permaBQ') && $('permaBQ').value) || '').toLowerCase();
  var qn = q.normalize ? q.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : q;
  var data = (m.bitacora || []).slice().sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
  if (q) data = data.filter(function (r) {
    var t = ((r.txt || '') + ' ' + sistNombre(r.sis) + ' ' + (r.tipo || '')).toLowerCase();
    var tn = t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
    return tn.indexOf(qn) >= 0;
  });
  var st = $('permaBStats');
  if (!data.length) {
    box.innerHTML = '<p class="muted su-e201a8">Sin registros' + (m.bitacora.length ? ' para este filtro.' : '. Anota tu primera observación: lo que no se anota se olvida.') + '</p>';
    if (st) st.textContent = m.bitacora.length ? m.bitacora.length + ' en total' : '';
    return;
  }
  box.innerHTML = data.slice(0, 80).map(function (r) {
    return '<div class="hora-item"><span class="su-6cb285">' + esc(r.tipo || '👁️') + ' <b>' + esc(sistNombre(r.sis)) + '</b>' +
      '<br><span class="muted su-0d5be0">' + esc(r.fecha || '') + ' · ' + esc(r.txt || '') + (r.kg ? ' · 🧺 ' + esc(r.kg) : '') + '</span></span>' +
      '<button type="button" class="btn btn-icon perma-b-del" data-k="' + esc(r.id) + '">✕</button></div>';
  }).join('');
  box.querySelectorAll('.perma-b-del').forEach(function (b) {
    b.onclick = function () {
      var s2 = store();
      s2.bitacora = s2.bitacora.filter(function (x) { return x.id !== b.dataset.k; });
      save(); renderAll();
    };
  });
  if (st) st.textContent = data.length + ' mostrado(s) · ' + m.bitacora.length + ' total';
}
function renderAll() {
  fillSistemaSelects();
  renderDiseno();
  renderSitios();
  renderSistemas();
  renderTareas();
  renderBitacora();
}

/* ---------------- SETUP ---------------- */
function setup() {
  /* 1) botón en Territorio > Tierra (junto a Mi Huerta / Electrocultura) */
  try {
    var existing = $('btnPermacultura');
    if (existing) {
      var oldG = existing.closest ? existing.closest('.action-group') : null;
      var inTerr = oldG && oldG.getAttribute && oldG.getAttribute('data-group') === 'territorio';
      if (!inTerr) { try { existing.remove(); } catch (e0) { try { existing.parentNode.removeChild(existing); } catch (e1) {} } existing = null; }
      else { try { existing.setAttribute('data-sub', 'tierra'); } catch (eS) {} }
    }
    if (!existing) {
      var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
      if (g) {
        var btn = document.createElement('button');
        btn.id = 'btnPermacultura'; btn.className = 'btn'; btn.type = 'button';
        btn.textContent = '🌿 Permacultura';
        try { btn.setAttribute('data-sub', 'tierra'); } catch (eS2) {}
        btn.setAttribute('data-keywords', 'permacultura diseño zonas sistema sitio agua lluvia mulch espiral huerto bosque swale gallinero compost baño seco holmgren mollison sostenible territorio tierra huerta');
        var ref = g.querySelector('#btnElectrocultura') || g.querySelector('#btnHuerta');
        if (ref && ref.nextSibling) g.insertBefore(btn, ref.nextSibling);
        else g.appendChild(btn);
      }
    } else {
      try {
        var g2 = document.querySelector('.action-group[data-group="territorio"] .group-btns');
        if (g2) {
          var ref2 = g2.querySelector('#btnElectrocultura') || g2.querySelector('#btnHuerta');
          if (ref2 && ref2.nextSibling && ref2.nextSibling !== existing) g2.insertBefore(existing, ref2.nextSibling);
        }
      } catch (eR) {}
    }
  } catch (e) {}
  /* 2) registrar en ALL_BTNS + BTN_HOME/BTN_ORDER + visibilidad */
  try {
    if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.indexOf('btnPermacultura') < 0) ALL_BTNS.push('btnPermacultura');
  } catch (e) {}
  try {
    if (typeof BTN_HOME !== 'undefined') BTN_HOME.btnPermacultura = ['territorio', 'tierra'];
  } catch (e) {}
  try {
    if (typeof BTN_ORDER !== 'undefined' && BTN_ORDER['territorio|tierra'] && BTN_ORDER['territorio|tierra'].indexOf('btnPermacultura') < 0) {
      var _o = BTN_ORDER['territorio|tierra'], _ni = _o.indexOf('btnElectrocultura');
      if (_ni >= 0) _o.splice(_ni + 1, 0, 'btnPermacultura');
      else {
        var _nh = _o.indexOf('btnHuerta');
        if (_nh >= 0) _o.splice(_nh + 1, 0, 'btnPermacultura');
        else _o.push('btnPermacultura');
      }
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (p) { if (PRESETS[p]) PRESETS[p].btnPermacultura = true; });
    }
  } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  /* 3) checkbox en configDialog (grupo Territorio) */
  try {
    if (!document.querySelector('#configDialog input[data-btn="btnPermacultura"]')) {
      var groups = document.querySelectorAll('#configDialog .config-group');
      groups.forEach(function (gr) {
        var h = gr.querySelector('h5');
        if (h && h.textContent.indexOf('Territorio') >= 0) {
          var lab = document.createElement('label');
          lab.className = 'check-row';
          lab.innerHTML = '<input type="checkbox" data-btn="btnPermacultura"> 🌿 Permacultura';
          gr.appendChild(lab);
          try {
            var vis = (typeof getVisibleConfig === 'function') ? getVisibleConfig() : null;
            lab.querySelector('input').checked = !vis || vis.btnPermacultura !== false;
            lab.querySelector('input').onchange = function () {
              try {
                var DATAref = (typeof DATA !== 'undefined') ? DATA : null;
                if (DATAref) {
                  DATAref.config = DATAref.config || {}; DATAref.config.visible = DATAref.config.visible || {};
                  DATAref.config.visible.btnPermacultura = lab.querySelector('input').checked;
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

  /* 4) diálogo */
  buildDialog();
  renderAll();
  bindHub(document);
  bindGuiaCTA();

  var b = $('btnPermacultura');
  if (b) b.onclick = function () {
    renderAll();
    bindHub(document);
    bindGuiaCTA();
    switchTab('Guia');
    openDlg('permaculturaDialog');
  };

  TABS.forEach(function (t) {
    var tb = $('tabPerma' + t);
    if (tb) tb.onclick = function () { switchTab(t); };
  });

  try { if ($('permaTFecha') && !$('permaTFecha').value) $('permaTFecha').value = todayKey(); } catch (e) {}
  try { if ($('permaBFecha') && !$('permaBFecha').value) $('permaBFecha').value = todayKey(); } catch (e) {}

  var sa = $('permaSAdd');
  if (sa) sa.onclick = function () {
    var nom = clean((($('permaSNombre') || {}).value || '').trim(), 50);
    if (!nom) return alert('Ponle nombre al espacio (ej: Patio norte)');
    var m = store();
    m.sitios.push({
      id: uid('pms'), nombre: nom,
      zona: ($('permaSZona') || {}).value || '1',
      sup: clean((($('permaSSup') || {}).value || '').trim(), 20),
      sol: ($('permaSSol') || {}).value || '',
      agua: ($('permaSAgua') || {}).value || '',
      nota: clean((($('permaSNota') || {}).value || '').trim(), 120),
      fecha: todayKey()
    });
    save('Espacio guardado 🗺️');
    if ($('permaSNombre')) $('permaSNombre').value = '';
    if ($('permaSSup')) $('permaSSup').value = '';
    if ($('permaSNota')) $('permaSNota').value = '';
    renderAll();
  };

  var ea = $('permaEAdd');
  if (ea) ea.onclick = function () {
    var nom2 = clean((($('permaENombre') || {}).value || '').trim(), 50);
    if (!nom2) return alert('Ponle nombre al sistema (ej: Espiral de hierbas)');
    var m2 = store();
    m2.sistemas.push({
      id: uid('pme'),
      nombre: nom2,
      tipo: ($('permaETipo') || {}).value || TIPOS_SISTEMA[0],
      espacio: ($('permaEEspacio') || {}).value || '',
      estado: ($('permaEEst') || {}).value || ESTADOS_SIS[0],
      nota: clean((($('permaENota') || {}).value || '').trim(), 120),
      fecha: todayKey()
    });
    save('Sistema guardado 🌱');
    if ($('permaENombre')) $('permaENombre').value = '';
    if ($('permaENota')) $('permaENota').value = '';
    renderAll();
  };
  var eq = $('permaEQ'); if (eq) eq.oninput = renderSistemas;
  var ef = $('permaEF'); if (ef) ef.onchange = renderSistemas;

  var ta = $('permaTAdd');
  if (ta) ta.onclick = function () {
    var tx = clean((($('permaTTxt') || {}).value || '').trim(), 80);
    if (!tx) return alert('Escribe la tarea (ej: levantar espiral)');
    var m3 = store();
    m3.tareas.push({
      id: uid('pmt'),
      fecha: ($('permaTFecha') || {}).value || todayKey(),
      sis: ($('permaTSis') || {}).value || '',
      tipo: ($('permaTTipo') || {}).value || TIPOS_TAREA[0],
      txt: tx, hecha: false
    });
    save('Tarea guardada ✅');
    if ($('permaTTxt')) $('permaTTxt').value = '';
    renderAll();
  };

  var ba2 = $('permaBAdd');
  if (ba2) ba2.onclick = function () {
    var tx2 = clean((($('permaBTxt') || {}).value || '').trim(), 140);
    if (!tx2) return alert('Cuenta tu observación en 1 línea');
    var m4 = store();
    m4.bitacora.push({
      id: uid('pmb'),
      fecha: ($('permaBFecha') || {}).value || todayKey(),
      sis: ($('permaBSis') || {}).value || '',
      tipo: ($('permaBTipo') || {}).value || '👁️ Observación',
      kg: clean((($('permaBKg') || {}).value || '').trim(), 20),
      txt: tx2
    });
    save('Bitácora guardada 📓');
    if ($('permaBTxt')) $('permaBTxt').value = '';
    if ($('permaBKg')) $('permaBKg').value = '';
    renderAll();
  };
  var bq = $('permaBQ'); if (bq) bq.oninput = renderBitacora;

  var sh = $('permaBShare');
  if (sh) sh.onclick = async function () {
    var d = store();
    if (!d.sitios.length && !d.sistemas.length && !d.bitacora.length) return alert('Sin diseño aún: mapea tu primer espacio');
    var t = '🌿 Mi diseño de permacultura · ' + todayKey() + '\n\nEspacios:\n' +
      d.sitios.map(function (s) { return '• ' + s.nombre + ' (' + zonaNombre(s.zona) + (s.sup ? ' · ' + s.sup : '') + ')'; }).join('\n') +
      '\n\nSistemas:\n' + d.sistemas.map(function (s) {
        var esp = sitioById(s.espacio);
        return '• ' + s.nombre + ' (' + (s.tipo || '') + (esp ? ' · ' + esp.nombre : '') + ') · ' + (s.estado || '');
      }).join('\n') +
      (d.bitacora.length ? '\n\nÚltimo:\n' + d.bitacora.slice(-6).map(function (r) { return '• ' + r.fecha + ' · ' + sistNombre(r.sis) + ' · ' + r.txt; }).join('\n') : '');
    await share('Mi permacultura', t);
  };
  var cl = $('permaBClear');
  if (cl) cl.onclick = function () {
    if (!confirm('¿Borrar tu bitácora de permacultura (observaciones)? Sitios, sistemas y tareas se conservan.')) return;
    try { var u = userData(); if (u && u.permacultura) u.permacultura.bitacora = []; } catch (e) {}
    save(); renderAll();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(setup, 450); });
else setTimeout(setup, 450);

try { window.cal13permacultura = { store: store, zonas: ZONAS }; } catch (e) {}

})();
