/* ============================================================
   PESCA + HISTORIA — Calendario 13 Lunas (Penco)
   Apartado: Territorio > Pesca (btnFishing -> fishingDialog),
   pestanas: Pesca hoy | Historia.
   - Historia: la pesca de Penco / Golfo de Arauco a lo largo del
     tiempo, en 5 tiempos. Chips tocables cargan la especie en el
     formulario de la bitacora.
   Contenido estatico y local (sin red). Se edita aqui mismo, en
   HISTORIA_PESCA. Conecta con Mareas, Intermareal y guia Penco.
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
function fishChip(nombre) {
  return '<span class="chip" data-pez="' + esc(nombre) + '" style="cursor:pointer" title="Toca para cargarla en la bitácora">🎣 ' + esc(nombre) + '</span>';
}
function wireFishChips(scope) {
  if (!scope || !scope.querySelectorAll) return;
  scope.querySelectorAll('[data-pez]').forEach(function (el) {
    el.onclick = function () {
      try { switchPescaTab('hoy'); } catch (e) {}
      setTimeout(function () {
        var inp = $('fishLogSpecies');
        if (inp) { inp.value = el.getAttribute('data-pez'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
      }, 60);
    };
  });
}

/* ---------- HISTORIA DE LA PESCA ----------
   Estructura espejo de HISTORIA_PENCO (penco-guia.js):
   intro + eras[{t, cuando, d}] + sp (chips tocables) + fuentes.
   Mismo render: tarjeta por periodo, fecha muted, descripción,
   chips que cargan la bitácora. */
var HISTORIA_PESCA = {
  intro: 'La pesca de Penco —<b>orilla, roquerío y golfo</b>— del <b>mar cretácico</b> a la <b>caleta artesanal de hoy</b>, en <b>10 periodos</b>. La historia completa vive aquí; toca una especie para cargarla en tu bitácora.',
  eras: [
    {
      t: '🪨 Tiempo profundo: basamento de Gondwana', cuando: 'Paleozoico (~300 Ma) · zócalo de la bahía',
      d: 'Antes de ser bahía, Penco era <b>fondo y borde de Gondwana</b>: filitas y granitoides que hoy forman los <b>roqueríos de Playa Negra, La Cata y Tumbes</b>. Sin mar interior todavía, pero ya está el piso rocoso donde después se afirmarán <b>corrales de piedra, varaderos y caletas</b>.',
      sp: ['Robalo', 'Lapa']
    },
    {
      t: '🦕 Mar de Quiriquina: el golfo originario', cuando: 'Cretácico Superior · Maastrichtiano (72–66 Ma)',
      d: 'Hace 70 millones de años <b>todo esto era mar profundo</b> (Formación Quiriquina: La Cata, Quiriquina). Nadaban el plesiosaurio <b>Aristonectes quiriquinensis (9 m)</b>, <b>mosasaurios</b>, tortugas <b>Osteopygis y Euclastes</b> y el ave <b>Neogaeornis wetzeli</b>, con <b>amonites gigantes y Neilo pencana —que lleva el nombre de Penco—</b>. El Golfo de Arauco de hoy es el nieto pequeño de ese mar.',
      sp: ['Congrio', 'Corvina', 'Jurel']
    },
    {
      t: '🌿 Selvas del carbón: delta sin bahía', cuando: 'Paleoceno–Eoceno (~60–40 Ma) · Formación Cosmito',
      d: 'El mar se retira y la costa es <b>delta pantanoso</b> (arenas y carbones de <b>Cosmito</b>). Ríos trenzados traen nutrientes al futuro golfo: se prepara la <b>despensa</b> que alimentará sardinas, jureles y merluzas millones de años después. El <b>primer carbón de la cuenca</b> duerme aquí.',
      sp: ['Pejerrey', 'Robalo']
    },
    {
      t: '❄️ Hielos y nacimiento de la bahía', cuando: 'Pleistoceno – Holoceno Medio (~2 Ma – 6.000 a.p.)',
      d: 'El <b>río Biobío desembocaba dentro de la Bahía de Concepción</b> y la transgresión Flandriana la inunda: se forman las <b>terrazas de 5 m y 2 m</b>, limos del Andalién y dunas. <b>Hualpén y Tumbes eran islas</b>, Quiriquina estaba antepuesta: un <b>mar interior abrigado</b>, ideal para aprender a navegar y calar redes. Nace el escenario de toda la pesca penqueña.',
      sp: ['Corvina', 'Lenguado', 'Pejerrey', 'Cochayuyo', 'Chorito']
    },
    {
      t: '🛶 Primeros navegantes: Complejo Talcahuano', cuando: 'Arcaico Medio–Tardío (7.000–2.000 a.p.) · 4.580 a.p. – 130 d.C.',
      d: 'Más de <b>30 conchales</b> rodean la bahía: <b>Bellavista 1 (>3.000 m²), Talcahuano 1, Playa Negra 9 aquí en Penco sur</b>. Pescadores <b>sedentarios</b> con <b>pesas de red acinturadas, anzuelo, corrales de piedra</b> y navegación a Quiriquina. Pesca de <b>jurel, sierra, merluza y róbalo</b>, caza de <b>lobo marino</b>, marisqueo de ostión, choro zapato, loco y lapa. Fechas: <b>La Trila 4.580, Bellavista 3.880–3.330 a.p.</b>',
      sp: ['Jurel', 'Sierra', 'Merluza común', 'Robalo', 'Corvina', 'Chorito', 'Lapa']
    },
    {
      t: '🏺 Pesca lafkenche: corrales y wampo', cuando: '130 d.C. – 1550 · Pitrén / El Vergel',
      d: 'Con la cerámica y la horticultura (<b>quinoa, papa, maíz</b>), la pesca se ordena por luna y estación: <b>corrales de piedra, anzuelo de hueso y red</b>, salida en <b>wampo</b> (canoa). <b>Corvina, robalo y pejerrey</b> en la orilla; <b>cochayuyo, luche y chorito</b> en el roquerío. Pesca de sustento con respeto estacional y trueque con el interior. Territorio <b>ayllarewe lafkenche</b> —gente del mar—.',
      sp: ['Corvina', 'Robalo', 'Pejerrey', 'Cochayuyo', 'Chorito', 'Lapa']
    },
    {
      t: '⛵ Colonia: puerto y despensa', cuando: '1550–1800 · Concepción en Penco + traslado 1751',
      d: 'Fundación de <b>Concepción en Penco (1550)</b>: la bahía se vuelve <b>puerto y despensa</b>. Pesca de orilla y bote pequeño para consumo local, pescado seco por trigo y papas con el interior. Aparece la <b>fiesta patronal</b> como marca pesquera. El <b>terremoto-maremoto de 1751</b> y el traslado al Valle de la Mocha vacían Penco por ~90 años: la pesca vuelve a ser solo de las <b>51 familias</b> que resisten.',
      sp: ['Corvina', 'Congrio', 'Sierra', 'Pejerrey', 'Jaiba mora']
    },
    {
      t: '⛏️ Siglo XIX: carbón, cobre y ballena', cuando: '1800–1900 · Minas 1843–1958 + ferrocarril 1889/1914',
      d: 'Minas de carbón y <b>fundición de cobre de Lirquén</b> traen <b>más bocas y más botes</b>: la pesca crece para alimentar a mineros y fundidores. En el Golfo faenan <b>balleneros</b>. Nacen las caletas como las conocemos: <b>Lirquén (~1850, pescadores y alfareros), Penco, Talcahuano</b>, con chalupas a remo y vela, espinel y trasmallo. El riel acelera el hielo y la salida.',
      sp: ['Sierra', 'Congrio', 'Jurel', 'Corvina', 'Lenguado', 'Erizo']
    },
    {
      t: '🏭 Siglo XX: puerto mayor, industria y vedas', cuando: '1900–2000 · Vipla, puerto Lirquén, Sernapesca',
      d: '<b>Lirquén puerto mayor</b> y la pesca industrial (jurel, merluza, sardina) cambian la escala del Golfo. La artesanal resiste con <b>bote a motor, cerco chico y buceo apnea</b> (piure, erizo, lapa). Llegan <b>vedas y tallas mínimas</b> (Sernapesca): merluza en septiembre, congrio en invierno, marea roja vigilada. En 1996 la <b>Ley de Caza protege</b> lobos y aves del borde. <b>Terremotos de 1939, 1960</b> golpean caletas y obligan a reconstruir.',
      sp: ['Jurel', 'Merluza común', 'Sierra', 'Congrio', 'Piure', 'Erizo', 'Chorito']
    },
    {
      t: '⚓ Hoy: caleta viva y pesca con medida', cuando: '2000 – actualidad · DP World + 27F + San Pedro 29-jun',
      d: 'La pesca artesanal de <b>Lirquén–Penco (caletas El Refugio y La Cata)</b> es patrimonio vivo: <b>amanecer y pleamar mandan</b>, la luna ordena la marea y el pique. Cada 29 de junio la <b>Fiesta de San Pedro</b> bendice los botes. El <b>27F (2010)</b> dañó caletas y borde y obligó a reconstruir. El desafío es pescar <b>lo justo</b>: respetar vedas y tallas, devolver hembras con huevos y cuidar el roquerío. Tu bitácora ayuda: anota marea, luna y carnada que funcionó.',
      sp: ['Corvina', 'Lenguado', 'Pejerrey', 'Robalo', 'Sierra', 'Jurel', 'Congrio', 'Merluza común']
    }
  ],
  fuentes: 'Fuentes: HISTORIA_PENCO (Quiriquina, bahía, conchales, caletas) · Bustos y Vergara 2004 (30 conchales) · Torres et al. 2007 (Playa Negra 9) · Fiesta de San Pedro 29-jun · Sernapesca vedas y tallas · SHOA mareas · saberes caleta Lirquén · catálogo Pesca e Intermareal de esta app.'
};

/* ---------- RENDER: HISTORIA ---------- */
function renderPescaHistoria() {
  var box = $('pescaHistoriaPanel');
  if (!box) return;
  var g = HISTORIA_PESCA;
  var html = '<p class="muted" style="font-size:11px;line-height:1.55">' + g.intro + '</p>';
  html += g.eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + esc(e.cuando) + '</p>' +
      '<p style="font-size:12px;line-height:1.55">' + e.d + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + e.sp.map(fishChip).join('') + '</div></div>';
  }).join('');
  html += '<p class="muted" style="font-size:10px;margin-top:8px">' + esc(g.fuentes) + '</p>';
  box.innerHTML = html;
  wireFishChips(box);
}

/* ---------- TABS ---------- */
var pescaTab = 'hoy';
function switchPescaTab(t) {
  pescaTab = t;
  var tabs = { hoy: $('tabPescaHoy'), historia: $('tabPescaHistoria') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', k === t); });
  var panels = { hoy: $('pescaHoyPanel'), historia: $('pescaHistoriaPanel') };
  Object.keys(panels).forEach(function (k) { if (panels[k]) panels[k].classList.toggle('hidden', k !== t); });
  if (t === 'historia') renderPescaHistoria();
}

/* ---------- Mejora Pesca hoy: accesos ---------- */
function mejorarPescaHoy() {
  var todayBox = $('fishingTodayBox');
  if (todayBox && !$('pescaHoyPlus')) {
    var div = document.createElement('div');
    div.id = 'pescaHoyPlus';
    div.innerHTML = '<div class="dlg-actions" style="justify-content:flex-start;margin-top:8px">' +
      '<button type="button" id="phoyGoHist" class="btn" style="width:auto;font-size:11px">📜 Ver historia</button>' +
      '<button type="button" id="phoyGoForm" class="btn" style="width:auto;font-size:11px">📓 Ir a la bitácora</button></div>';
    todayBox.appendChild(div);
    var gh = $('phoyGoHist'); if (gh) gh.onclick = function () { switchPescaTab('historia'); };
    var gf = $('phoyGoForm');
    if (gf) gf.onclick = function () { try { var f = $('fishLogDate'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} };
  }
}

function setupPescaHistoria() {
  if (!$('fishingDialog') || !$('tabPescaHistoria')) {
    window._phistRetry = (window._phistRetry || 0) + 1;
    if (window._phistRetry < 60) setTimeout(setupPescaHistoria, 500);
    return;
  }
  try {
    var btn = $('btnFishing');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('historia') < 0)
      btn.dataset.keywords += ' historia pesca caleta lirqen san pedro wampo corral ballena carbon veda merluza jurel sierra congrio origen lafkenche';
  } catch (e) {}
  var tH = $('tabPescaHoy'), tS = $('tabPescaHistoria');
  if (tH && !tH.dataset.w) { tH.dataset.w = '1'; tH.onclick = function () { switchPescaTab('hoy'); }; }
  if (tS && !tS.dataset.w) { tS.dataset.w = '1'; tS.onclick = function () { switchPescaTab('historia'); }; }
  try {
    if (typeof renderFishingDialog === 'function' && !window._pescaWrapped) {
      window._pescaWrapped = true;
      var orig = renderFishingDialog;
      renderFishingDialog = function () {
        var r = orig.apply(this, arguments);
        try { mejorarPescaHoy(); } catch (e) {}
        try { if (pescaTab === 'historia') renderPescaHistoria(); } catch (e2) {}
        return r;
      };
    }
  } catch (e) {}
  var b = $('btnFishing');
  if (b && !b.dataset.phistW) {
    b.dataset.phistW = '1';
    b.addEventListener('click', function () { try { switchPescaTab('hoy'); } catch (e) {} });
  }
  try { renderPescaHistoria(); } catch (e) {}
}

window.PescaHistoria = { historia: HISTORIA_PESCA, tab: switchPescaTab, renderHistoria: renderPescaHistoria };
setTimeout(setupPescaHistoria, 600);

})();
