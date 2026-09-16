/* ============================================================
   GUIA BASICA DE PENCO — Calendario 13 Lunas (Penco · Bio-Bio)
   Apartado: Territorio > Penco (btnComuna -> comunaDialog),
   pestana "Guia de Penco": historia, limites, lugares de
   interes y sectores de la comuna.
   Contenido estatico y local (sin guardado): la edicion se hace
   aqui mismo, en GUIA_PENCO. Conecta con Intermareal, Pesca,
   Aves (humedal Rocuant) y Bosque Nativo.
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

var GUIA_PENCO = {
  marco: 'Ubicación: <b>Provincia de Concepción, Región del Biobío</b>, integrada al área metropolitana del <b>Gran Concepción</b>. Población comunal aproximada: <b>47.000 a 50.000 habitantes</b>.',
  antes: [
    'La bahía lleva <b>más de 4.500 años habitada</b>: la arqueología registra <b>más de 30 sitios-conchales</b> en la Bahía de Concepción, del <b>Arcaico Tardío (4.580 a.p. – 130 d.C.)</b>, con un sedentarismo temprano basado en pesca, recolección de mariscos, caza de lobo marino y aves (sitios como Bellavista 1, Talcahuano 1 y los de Isla Quiriquina). La cerámica aparece hacia el <b>130 d.C.</b>',
    'Después vinieron las tradiciones alfareras del centro-sur: el complejo <b>Pitrén</b> y luego <b>El Vergel (1.000–1.500 d.C., entre los ríos Itata y Toltén)</b>, con horticultura (papa, maíz, quínoa, poroto), domesticación de camélidos, <b>metalurgia del cobre</b>, navegación costera —incluida <b>Isla Quiriquina</b>— y entierros en urnas y <b>wampo</b> (canoa funeraria). Son los <b>antepasados directos del pueblo mapuche histórico</b>.',
    'Al llegar los españoles, este era el territorio que llamaron <b>“provincia de Concepción o Penco”</b> (entre los ríos Itata y Biobío), con <b>ayllarewe costeros de Penco y Talcahuano</b> organizados en <b>levo o rewe</b>. En la costa vivían comunidades <b>lafkenche</b> —gente del <b>lafken</b> (mar)—, pescadoras y mariscadoras; tierra adentro, horticultoras. Los cronistas describen <b>orfebrería de oro, plata y cobre</b>, y lavaderos de oro aluvial como los de <b>Quilacoya</b>.',
    'La historiografía señala que la ciudad de 1550 se trazó sobre el sector del <b>asentamiento aborigen de Carapenco</b>, entre los esteros de Penco y Landa.',
    'De este período <b>no hay crónicas escritas propias</b>: lo que se sabe viene de la <b>arqueología</b> y de la <b>memoria mapuche viva</b>. Honrarlo es también escuchar: 🗣️ Voz de los Abuelos, 📖 Epew y 🗣️ Kimün Mapuzugun.'
  ],
  antesFuentes: 'Fuentes: prospecciones Bahía de Concepción (Chungara 2004) · Venegas, Rev. Historia UdeC · Museo Chileno de Arte Precolombino y Tesauro Regional (complejo El Vergel).',
  historia: [
    'Penco fue fundado el <b>12 de febrero de 1550</b> por Pedro de Valdivia como <b>“Concepción del Nuevo Extremo”</b>: es el asentamiento español más antiguo de la zona y origen de la actual Concepción.',
    'El <b>casco histórico</b> conserva el trazado en <b>damero</b>, la <b>Plaza Los Conquistadores</b>, el <b>Fuerte La Planchada</b> y el <b>Barrio Patrimonial Ex CRAV</b>.',
    '<b>Lirquén</b>, localidad portuaria y pesquera establecida en <b>1850</b>, fue zona minera de <b>carbón y vidrio plano</b>. Hoy se consolida en torno a <b>Puerto Lirquén (DP World)</b> y las caletas artesanales. Población aproximada: <b>12.000 a 14.000 habitantes</b>.'
  ],
  limites: [
    { p: 'Norte', v: 'Tomé (hacia Punta de Parra y Quebrada Honda)' },
    { p: 'Sur', v: 'Concepción (eje Ruta 150 / Chillancito)' },
    { p: 'Oeste / Noroeste', v: 'Océano Pacífico (Bahía de Concepción)' },
    { p: 'Suroeste', v: 'Talcahuano (marismas del río Andalién e Isla Rocuant)' },
    { p: 'Este', v: 'Florida (cordillera de la Costa / sector rural)' }
  ],
  limitesNota: 'Penco se integra al área metropolitana del <b>Gran Concepción</b>. El límite con Talcahuano, hacia el suroeste, está marcado por las <b>marismas del río Andalién</b> y la <b>isla Rocuant</b>, cerca de su desembocadura.',
  lugares: [
    { n: 'Plaza Los Conquistadores y casco en damero', d: 'Centro histórico, comercio y servicios. Punto de partida para recorrer el Penco antiguo y el Barrio Patrimonial Ex CRAV.' },
    { n: 'Fuerte La Planchada', d: 'Fuerte histórico del borde costero penqueño.' },
    { n: 'Barrio Patrimonial Ex CRAV', d: 'Sector de valor patrimonial del centro penqueño.' },
    { n: 'Playa Negra', d: 'Borde costero del centro: roqueríos, pozas intermareales y atardeceres. Revisa 🌊 Mareas y 🦀 Intermareal antes de ir.' },
    { n: 'Lirquén: caletas y puerto', d: 'Playa Lirquén, Caleta El Refugio y La Cata; Puerto Lirquén (DP World) y memoria minera del carbón y el vidrio plano. Población aproximada: 12.000 a 14.000 habitantes.' },
    { n: 'Humedal e isla Rocuant', d: 'Humedal costero del límite suroeste: observación de aves (ver 🦅 Aves). Marismas y desembocadura del río Andalién.' },
    { n: 'Cerro Bellavista', d: 'Hito natural del límite con Talcahuano, con vista a la Bahía de Concepción.' },
    { n: 'Cerro Verde', d: 'Sector residencial en altura, subdividido entre zonas altas y bajas.' },
    { n: 'Camino rural a Florida', d: 'Ruta Penco – Primer Agua – Roa – Florida (36 km): campo, agua y bosque hacia el límite este.' }
  ],
  sectores: [
    {
      n: '🛣️ Sector Sur / Eje Ruta 150 (Conexión Penco–Concepción)', d: 'Corredor residencial e industrial en el acceso sur de la comuna.',
      items: ['Cosmito (incluye Villa Cosmito)', 'La Greda', 'Nueva La Greda', 'El Boldo', 'Villa San Jorge', 'Villa Santa Rosa (“14-R Santa Rosa”)']
    },
    {
      n: '🏛️ Penco Centro y Borde Costero (Casco Histórico)', d: 'Asentamiento original de Concepción (1550). Poblaciones y villas tradicionales del sector:',
      items: ['Barrio Ex CRAV', 'Penco Norte', 'Penco Chico', 'Carlos Condell', 'Ignacio Carrera Pinto', 'Lomas de Penco', 'Juan Pérez Flores', 'Nueva Baquedano', 'Villa Jazmín', 'Alto Cementerio', 'Bellavista Sur', 'Playa Negra Norte', 'Bahía Azul', 'Bloques Vista al Mar', 'Corhabit', 'Lautaro Penco Centro', 'Desiderio Guzmán', 'Héctor Navarro', 'Armando Jofré Suazo', 'Hipocampo', 'Forjadores de Chile', 'Villarrica', 'Villa Las Américas', 'Villa Los Radales', 'Lord Cochrane', 'Gabriela Mistral']
    },
    {
      n: '⛰️ Cerro Verde', d: 'Sector residencial en altura, subdividido funcionalmente entre zonas altas y bajas.',
      items: ['Cerro Verde Alto', 'Cerro Verde Bajo', 'Víctor Ortal', 'Mejoreros', 'Bosques del Sur', 'Condominio Social Los Altos de Maitén', 'Agua de Peumo II B', 'Villa Montahue']
    },
    {
      n: '⚓ Lirquén (Sector Norte)', d: 'Localidad portuaria y pesquera costera (est. 1850). Barrios y poblaciones destacadas:',
      items: ['Lirquén Centro y Borde Costero (Playa Lirquén, Caleta El Refugio, La Cata)', 'Villa El Rosal', 'Ríos de Chile', 'Población Bellavista (Lirquén)', 'La Cantera', 'Las Pataguas']
    },
    {
      n: '🌾 Zona Rural Este (Límite con Florida)', d: 'Conectada por la ruta Penco – Primer Agua – Roa – Florida (36 km).',
      items: ['Primer Agua', 'Quebrada de las Ulloa', 'Fundo Coihueco / Huinquén']
    }
  ]
};

function chip(t) { return '<span class="chip" style="font-size:10px">' + esc(t) + '</span>'; }

function renderGuiaPenco() {
  var box = $('comunaGuiaPanel');
  if (!box) return;
  var g = GUIA_PENCO;
  var html = '';
  html += '<p class="muted" style="font-size:11px;line-height:1.55">' + g.marco + '</p>';
  html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>🌅 Antes de 1550: el Lafken habitado</h4>' +
    g.antes.map(function (p) { return '<p style="font-size:12px;line-height:1.55">• ' + p + '</p>'; }).join('') +
    '<p class="muted" style="font-size:10px;margin-top:6px">' + esc(g.antesFuentes) + '</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>📜 Historia básica (desde 1550)</h4>' +
    g.historia.map(function (p) { return '<p style="font-size:12px;line-height:1.55">• ' + p + '</p>'; }).join('') + '</div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>🧭 Límites comunales</h4>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">' +
    g.limites.map(function (l) { return '<span class="chip"><b>' + esc(l.p) + ':</b> ' + esc(l.v) + '</span>'; }).join('') + '</div>' +
    '<p class="muted" style="font-size:11px;line-height:1.55">' + g.limitesNota + '</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>📍 Lugares de interés</h4>' +
    g.lugares.map(function (l) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">📍 ' + esc(l.n) + '</h4><p style="font-size:11px">' + l.d + '</p></div>';
    }).join('') +
    '<p class="muted" style="font-size:10px;margin-top:6px">Guía básica en crecimiento: para mareas, pesca, aves e intermareal usa las secciones 🌊 Territorio.</p></div>';
  html += '<div class="menstrual-card" style="margin-top:10px"><h4>🏘️ Sectores de la comuna · ' + g.sectores.length + '</h4>' +
    g.sectores.map(function (s) {
      return '<details class="menstrual-details"><summary>' + esc(s.n) + ' <span class="muted" style="font-size:11px">· ' + s.items.length + '</span></summary>' +
        '<p class="muted" style="font-size:11px">' + esc(s.d) + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + s.items.map(chip).join('') + '</div></details>';
    }).join('') + '</div>';
  box.innerHTML = html;
}

var guiaTab = 'eventos';
function switchGuiaTab(t) {
  guiaTab = t;
  var tE = $('tabComunaEventos'), tG = $('tabComunaGuia');
  if (tE) tE.classList.toggle('btn-accent', t === 'eventos');
  if (tG) tG.classList.toggle('btn-accent', t === 'guia');
  var pE = $('comunaEventosPanel'), pG = $('comunaGuiaPanel');
  if (pE) pE.classList.toggle('hidden', t !== 'eventos');
  if (pG) pG.classList.toggle('hidden', t !== 'guia');
  if (t === 'guia') renderGuiaPenco();
}

function setupGuiaPenco() {
  if (!$('comunaDialog') || !$('tabComunaGuia')) {
    window._guiaRetry = (window._guiaRetry || 0) + 1;
    if (window._guiaRetry < 60) setTimeout(setupGuiaPenco, 500);
    return;
  }
  try {
    var btn = $('btnComuna');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('historia') < 0)
      btn.dataset.keywords += ' historia guia sectores barrios lirquen cosmito cerro verde primer agua florida tome talcahuano concepcion limite barrio crav playa negra rocuant andalien damero fundacion valdivia';
  } catch (e) {}
  var tE = $('tabComunaEventos'), tG = $('tabComunaGuia');
  if (tE && !tE.dataset.w) { tE.dataset.w = '1'; tE.onclick = function () { switchGuiaTab('eventos'); }; }
  if (tG && !tG.dataset.w) { tG.dataset.w = '1'; tG.onclick = function () { switchGuiaTab('guia'); }; }
  /* al abrir, volver a la pestana de eventos (comportamiento original) */
  var b = $('btnComuna');
  if (b && !b.dataset.guiaW) {
    b.dataset.guiaW = '1';
    b.addEventListener('click', function () { try { switchGuiaTab('eventos'); } catch (e) {} });
  }
  try { renderGuiaPenco(); } catch (e) {}
}

window.PencoGuia = { render: renderGuiaPenco, data: GUIA_PENCO, tab: switchGuiaTab };
setTimeout(setupGuiaPenco, 600);

})();
