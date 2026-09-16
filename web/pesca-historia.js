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

/* ---------- HISTORIA DE LA PESCA ---------- */
var HISTORIA_PESCA = {
  intro: 'La pesca de Penco —orilla, roquerío y golfo— en <b>5 tiempos</b>: de los corrales lafkenche a la caleta artesanal de hoy. Toca una especie para cargarla en tu bitácora.',
  eras: [
    {
      t: '🌊 Tiempo originario: pesca lafkenche', cuando: 'Antes de 1550 · Arcaico Tardío – Pitrén / El Vergel',
      d: 'La bahía lleva <b>miles de años habitada</b>: conchales con pesca de orilla, recolección de mariscos y caza de lobo marino. Se pescaba con <b>corrales de piedra, anzuelo de hueso y red</b>, y se salía en <b>wampo</b> (canoa). <b>Corvina, robalo y pejerrey</b> en la orilla; <b>cochayuyo, luche y chorito</b> en el roquerío. Pesca de sustento, con respeto estacional.',
      sp: ['Corvina', 'Robalo', 'Pejerrey', 'Cochayuyo', 'Chorito', 'Lapa']
    },
    {
      t: '⛵ Colonia: caleta y vigía', cuando: '1550–1800',
      d: 'Fundación de Concepción en Penco (1550): la bahía se vuelve <b>puerto y despensa</b>. La pesca sigue siendo de orilla y bote pequeño para consumo local, y aparece la <b>fiesta patronal</b> como marca de identidad pesquera. Se suma el trueque con el interior: pescado seco por trigo y papas.',
      sp: ['Corvina', 'Congrio', 'Sierra', 'Pejerrey', 'Jaiba mora']
    },
    {
      t: '⛏️ Siglo XIX: carbón, cobre y ballena', cuando: '1800–1900',
      d: 'Minas de carbón (1843–1958) y fundición de cobre de Lirquén traen <b>más bocas y más botes</b>: la pesca crece para alimentar a mineros y fundidores. En el Golfo faenan también <b>balleneros</b>. Nacen las caletas como las conocemos: <b>Lirquén, Penco, Talcahuano</b>, con chalupas a remo y vela, espinel y trasmallo.',
      sp: ['Sierra', 'Congrio', 'Jurel', 'Corvina', 'Lenguado', 'Erizo']
    },
    {
      t: '🏭 Siglo XX: puerto, industria y vedas', cuando: '1900–2000',
      d: 'Lirquén se vuelve <b>puerto mayor</b> y la pesca industrial (jurel, merluza, sardina) cambia la escala del Golfo. La artesanal resiste con <b>bote a motor, red de cerco chica y buceo apnea</b> (piure, erizo, lapa). Llegan las primeras <b>vedas y tallas mínimas</b> (Sernapesca): merluza en septiembre, congrio en invierno, marea roja vigilada. En 1996 la <b>Ley de Caza/Pesca protege</b> además lobos y aves del borde.',
      sp: ['Jurel', 'Merluza común', 'Sierra', 'Congrio', 'Piure', 'Erizo', 'Chorito']
    },
    {
      t: '⚓ Hoy: caleta viva y pesca con medida', cuando: '2000 – actualidad',
      d: 'La pesca artesanal de <b>Lirquén–Penco</b> es patrimonio vivo: <b>amanecer y pleamar mandan</b>, la luna ordena la marea y el pique. Cada 29 de junio la <b>Fiesta de San Pedro</b> bendice los botes. El desafío es pescar <b>lo justo</b>: respetar vedas y tallas, devolver hembras con huevos, no sacar más de lo que se come y cuidar el roquerío. Tu bitácora ayuda: anota marea, luna y carnada que funcionó.',
      sp: ['Corvina', 'Lenguado', 'Pejerrey', 'Robalo', 'Sierra', 'Jurel', 'Congrio', 'Merluza común']
    }
  ],
  fuentes: 'Fuentes: conchales Bahía de Concepción (Arcaico Tardío) · Fiesta de San Pedro 29-jun · Sernapesca vedas y tallas · SHOA mareas · saberes caleta Lirquén · catálogo de Pesca e Intermareal de esta app.'
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
