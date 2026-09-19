/* ============================================================
   GUIA + HISTORIA DE PENCO — Calendario 13 Lunas (Penco · Bio-Bio)
   Apartado: Territorio > Penco (btnComuna -> comunaDialog),
   pestanas: Eventos | Guia de Penco | Historia.
   - Guia de Penco: marco, limites, lugares de interes y
     sectores de la comuna (sin historia: ver pestana Historia).
   - Historia: el relato de Penco por periodos, desde el Lafken
     originario hasta el presente, en HISTORIA_PENCO.
   Contenido estatico y local (sin guardado): la edicion se hace
   aqui mismo, en GUIA_PENCO e HISTORIA_PENCO. Conecta con
   Intermareal, Pesca, Aves (humedal Rocuant) y Bosque Nativo.
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

/* ---------- GUIA (sin historia) ---------- */
var GUIA_PENCO = {
  marco: 'Ubicación: <b>Provincia de Concepción, Región del Biobío</b>, integrada al área metropolitana del <b>Gran Concepción</b>. Población comunal aproximada: <b>47.000 a 50.000 habitantes</b>.',
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
    { n: 'Fuerte La Planchada', d: 'Fuerte de 1687 en el borde costero: único vestigio de la ciudad colonial de Concepción en Penco. Tres cañones, paseo y gastronomía.' },
    { n: 'Barrio Patrimonial Ex CRAV', d: 'Sector de valor patrimonial del centro penqueño, ligado a la antigua refinería de azúcar.' },
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

/* ---------- HISTORIA DE PENCO (periodos hasta el presente) ---------- */
var HISTORIA_PENCO = {
  intro: 'Penco es la <b>cuna de Concepción</b> y la tercera ciudad más antigua de Chile: del <b>Lafken habitado</b> a la comuna costera e industrial de hoy, en <b>11 periodos</b>. La historia completa vive aquí; la Guía queda solo para recorrer el territorio.',
  eras: [
    {
      t: '🌅 Tiempo originario: el Lafken habitado', cuando: 'Antes de 1550 · Arcaico Tardío (4.580 a.p. – 130 d.C.) · Pitrén / El Vergel',
      d: 'La bahía lleva <b>más de 4.500 años habitada</b>: más de <b>30 sitios-conchales</b> en la Bahía de Concepción (Bellavista 1, Talcahuano 1, Isla Quiriquina), con pesca de orilla, marisqueo, caza de lobo marino y aves. La cerámica aparece hacia el <b>130 d.C.</b>, y luego las tradiciones <b>Pitrén</b> y <b>El Vergel (1.000–1.500 d.C.)</b>, con horticultura, camélidos, <b>metalurgia del cobre</b>, navegación a Quiriquina y entierros en urna y <b>wampo</b>: antepasados directos del pueblo mapuche. Al llegar los españoles, este era el territorio <b>“provincia de Concepción o Penco”</b>, con <b>ayllarewe costeros lafkenche</b> —gente del mar—, orfebrería de oro, plata y cobre, y lavaderos como <b>Quilacoya</b>. La ciudad de 1550 se trazó sobre el <b>asentamiento de Carapenco</b>, entre los esteros de Penco y Landa. De este tiempo <b>no hay crónicas propias</b>: hablan la arqueología y la memoria mapuche viva (🗣️ Voz de los Abuelos, 📖 Epew, 🗣️ Kimün Mapuzugun).'
    },
    {
      t: '⚔️ Fundación y destrucción', cuando: '1550–1554 · Concepción del Nuevo Extremo',
      d: 'Pedro de Valdivia llega al valle de <b>Penguco</b> y, tras la <b>Batalla de Andalién (22 de febrero de 1550)</b>, funda la ciudad: primero el fuerte en <b>Altos de Playa Negra</b>, reparto de solares el <b>3 de marzo</b> y fundación solemne el <b>5 de octubre de 1550</b> como <b>La Concepción de María Purísima del Nuevo Extremo</b>, con plaza de armas, iglesia, cabildo y hospital. Es el <b>asentamiento español más antiguo de la zona</b>. La guerra mapuche la alcanza pronto: tras la muerte de Valdivia en Tucapel (1553), <b>Lautaro destruye Concepción en 1554</b> y la ciudad debe refundarse.'
    },
    {
      t: '⛪ Penco, capital del sur', cuando: '1554–1751 · Ciudad colonial, obispado y terremotos',
      d: 'Refundada una y otra vez, Penco-Concepción se vuelve <b>capital político-militar del sur</b>: aquí residen gobernadores, sesiona el cabildo en pie de guerra y se traza la frontera del Biobío. Recibe <b>obispado</b>, conventos y la <b>Universidad Pencopolitana</b>. El trazado en <b>damero</b> y la <b>Plaza</b> de hoy heredan ese plano. La bahía se defiende con fuertes como <b>La Planchada (1687)</b>, único vestigio colonial en pie. Pero la tierra manda: terremotos en <b>1570, 1657, 1687 y 1730</b> la tumban una y otra vez, hasta el golpe final de 1751.'
    },
    {
      t: '🌊 El traslado y el largo silencio', cuando: '25 de mayo de 1751 – 1842 · Terremoto, maremoto y prohibición',
      d: 'El <b>gran terremoto y maremoto del 25 de mayo de 1751</b> sepulta la ciudad. Las autoridades ordenan el <b>traslado al Valle de la Mocha</b> (actual Concepción, a orillas del Biobío) y <b>prohíben ocupar Penco por casi 90 años</b>. Entre las ruinas queda un puñado de familias: en <b>1822, 51 familias</b> escriben a <b>Bernardo O’Higgins</b> pidiendo vivir allí libremente. La respuesta tarda dos décadas.'
    },
    {
      t: '🏡 Villa, comuna y ciudad', cuando: '1843–1898 · La refundación republicana',
      d: 'El presidente <b>Manuel Bulnes otorga el título de Villa el 29 de marzo de 1843</b>; el primer subdelegado es <b>Manuel Esteban Gajardo</b>. Penco es entonces subdelegación de Coelemu y luego de Concepción. Con la <b>Ley de Comuna Autónoma (1891)</b> nace la <b>Municipalidad de Penco</b>, y en <b>1898 es declarada ciudad</b>. De a poco renace el caserío entre las ruinas, y al norte crece la caleta de <b>Lirquén (hacia 1850)</b>, de pescadores y alfareros.'
    },
    {
      t: '⛏️🚂 Carbón, cobre y rieles', cuando: '1850–1900 · Minas, fundición y ferrocarril',
      d: 'El carbón de <b>Lirquén y Cerro Verde</b> y la <b>fundición de cobre de Lirquén</b> encienden la economía; hay además molinos de trigo, cal, tejas y adobes. La <b>llegada del ferrocarril a Penco (1889)</b> —extendido a <b>Lirquén en 1914</b> y conectado hacia Tomé, Coelemu y Chillán— acelera todo. En <b>1886</b> Teodoro Plate y Óscar Mengelbier fundan la <b>Refinería Sudamericana de Azúcar</b> (comprada por Mauricio Gleisner en 1889, luego <b>CRAV</b>), y en <b>1898</b> nace la <b>Fábrica Nacional de Loza</b>. Llegan familias de <b>Ñuble</b> buscando trabajo: Penco se vuelve polo obrero.'
    },
    {
      t: '🏭 Penco obrero-industrial', cuando: '1900–1950 · CRAV, Fanaloza, COSAF y vida de barrio',
      d: 'La primera mitad del siglo XX es el auge fabril: <b>CRAV</b> con su muelle refinero —uno de los más largos de Chile—, <b>Fanaloza</b> (relanzada por Juan Díaz en 1926, renovada en los 40-50), la <b>COSAF</b> con su muelle mecanizado, y la <b>Granja Cosmito</b> con leche, aves y hortalizas. Los operarios fundan el <b>Cuerpo de Bomberos (1927)</b> tras voraces incendios, y la CRAV sostiene hasta un <b>Observatorio “Elke”</b>. Los temporales de <b>1945</b> destruyen el muelle refinero y el <b>terremoto de Chillán (1939)</b> golpea la zona. Aun así, industria y ciudad crecen juntas: nace el <b>Penco obrero</b>, de sindicato, club deportivo y barrio.'
    },
    {
      t: '🏗️ Barrios, vidrio y maremotos', cuando: '1950–1973 · Expansión y Estado industrial',
      d: 'Penco se consolida como uno de los <b>centros industriales del sur</b>: a CRAV y Fanaloza (luego Lozapenco) se suma la <b>Fábrica Nacional de Vidrios Planos de Lirquén (FNVP / Vipla, luego Vidrios Lirquén)</b>, fosfatos y calzado. Crecen las <b>poblaciones obreras</b> y <b>Cerro Verde</b> empieza a unir Penco con Lirquén. El <b>terremoto de Valdivia (1960)</b> y sus maremotos azotan la bahía. <b>Playa Negra</b> se afirma como balneario popular y el borde costero se llena de vida.'
    },
    {
      t: '🌑 Crisis, dictadura y resistencia', cuando: '1973–1990 · Declive fabril',
      d: 'La dictadura y la apertura económica golpean la industria nacional: las <b>grandes fábricas entran en declive y cierran progresivamente</b>, con cesantía y empobrecimiento de los barrios obreros. El puerto y la pesca artesanal resisten. En las poblaciones, la <b>organización vecinal, la iglesia y los clubes</b> sostienen la vida comunitaria. El Penco fabril se vuelve memoria, y sus galpones y casas obreras, patrimonio en espera.'
    },
    {
      t: '⚓ Puerto moderno y 27F', cuando: '1990–2010 · Democracia, DP World y reconstrucción',
      d: 'Con la democracia, <b>Lirquén se moderniza como puerto mayor (hoy DP World / Puerto Lirquén)</b> y la comuna se integra de lleno al <b>Gran Concepción</b>. A fines de los 70 y en los 80, Cerro Verde ya había cosido Penco y Lirquén en un solo aglomerado. El <b>terremoto y tsunami del 27 de febrero de 2010</b> golpea el borde costero y obliga a <b>reconstruir</b> caletas, defensas y viviendas, y a repensar la relación con el mar.'
    },
    {
      t: '🌱 Penco patrimonial y costero', cuando: '2010 – presente · 47.000 a 50.000 habitantes',
      d: 'El Penco de hoy es <b>doble: Penco centro y Lirquén puerto-pesquero</b>, unidos por Cerro Verde y el eje Ruta 150. Cuida su historia —<b>Fuerte La Planchada, Plaza Los Conquistadores, Barrio Ex CRAV</b>— y su naturaleza: <b>Playa Negra y sus roqueríos, caletas El Refugio y La Cata, humedal e isla Rocuant</b> con sus aves. Los desafíos son los mismos del origen: <b>vivir con el mar y el río</b>, proteger el humedal, ordenar el borde y convertir la <b>memoria industrial y lafkenche</b> en futuro. Esta historia sigue escribiéndose cada 12 de febrero, aniversario de la fundación.'
    }
  ],
  fuentes: 'Fuentes: Sociedad de Historia de Penco (historiadepenco.cl) · Resumen.cl “Penco, historia e industria” · Repositorio UdeC (CRAV y territorio) · Wikipedia “Penco” · prospecciones Bahía de Concepción (Chungara 2004) y Museo Precolombino (El Vergel) · memoria caleta Lirquén.'
};

function chip(t) { return '<span class="chip" style="font-size:10px">' + esc(t) + '</span>'; }

/* ---------- RENDER: GUIA (sin historia) ---------- */
function renderGuiaPenco() {
  var box = $('comunaGuiaPanel');
  if (!box) return;
  var g = GUIA_PENCO;
  var html = '';
  html += '<p class="muted" style="font-size:11px;line-height:1.55">' + g.marco + '</p>';
  html += '<div class="menstrual-card" style="border-color:var(--gold)"><h4>📜 La historia tiene su propia sección</h4>' +
    '<p style="font-size:12px;line-height:1.55">Del Lafken originario al Penco de hoy en <b>11 periodos</b>: fundación de 1550, traslado de 1751, villa de 1843, carbón y rieles, Penco obrero, 27F y presente.</p>' +
    '<div class="dlg-actions" style="justify-content:flex-start;margin-top:6px"><button type="button" id="guiaGoHist" class="btn" style="width:auto;font-size:11px">📜 Ver Historia de Penco</button></div></div>';
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
  var go = $('guiaGoHist');
  if (go) go.onclick = function () { try { switchGuiaTab('historia'); } catch (e) {} };
}

/* ---------- RENDER: HISTORIA ---------- */
function renderHistoriaPenco() {
  var box = $('comunaHistoriaPanel');
  if (!box) return;
  var h = HISTORIA_PENCO;
  var html = '<p class="muted" style="font-size:11px;line-height:1.55">' + h.intro + '</p>';
  html += h.eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + esc(e.cuando) + '</p>' +
      '<p style="font-size:12px;line-height:1.55">' + e.d + '</p></div>';
  }).join('');
  html += '<p class="muted" style="font-size:10px;margin-top:8px">' + esc(h.fuentes) + '</p>';
  box.innerHTML = html;
}

var guiaTab = 'eventos';
function switchGuiaTab(t) {
  guiaTab = t;
  var tE = $('tabComunaEventos'), tG = $('tabComunaGuia'), tH = $('tabComunaHistoria');
  if (tE) tE.classList.toggle('btn-accent', t === 'eventos');
  if (tG) tG.classList.toggle('btn-accent', t === 'guia');
  if (tH) tH.classList.toggle('btn-accent', t === 'historia');
  var pE = $('comunaEventosPanel'), pG = $('comunaGuiaPanel'), pH = $('comunaHistoriaPanel');
  if (pE) pE.classList.toggle('hidden', t !== 'eventos');
  if (pG) pG.classList.toggle('hidden', t !== 'guia');
  if (pH) pH.classList.toggle('hidden', t !== 'historia');
  if (t === 'guia') renderGuiaPenco();
  if (t === 'historia') renderHistoriaPenco();
}

function setupGuiaPenco() {
  if (!$('comunaDialog') || !$('tabComunaGuia') || !$('tabComunaHistoria')) {
    window._guiaRetry = (window._guiaRetry || 0) + 1;
    if (window._guiaRetry < 60) setTimeout(setupGuiaPenco, 500);
    return;
  }
  try {
    var btn = $('btnComuna');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('historia') < 0)
      btn.dataset.keywords += ' historia guia sectores barrios lirquen cosmito cerro verde primer agua florida tome talcahuano concepcion limite barrio crav playa negra rocuant andalien damero fundacion valdivia fanaloza carbon ferrocarril 1751 1843 villa planchada lautaro';
  } catch (e) {}
  var tE = $('tabComunaEventos'), tG = $('tabComunaGuia'), tH = $('tabComunaHistoria');
  if (tE && !tE.dataset.w) { tE.dataset.w = '1'; tE.onclick = function () { switchGuiaTab('eventos'); }; }
  if (tG && !tG.dataset.w) { tG.dataset.w = '1'; tG.onclick = function () { switchGuiaTab('guia'); }; }
  if (tH && !tH.dataset.w) { tH.dataset.w = '1'; tH.onclick = function () { switchGuiaTab('historia'); }; }
  /* al abrir, volver a la pestana de eventos (comportamiento original) */
  var b = $('btnComuna');
  if (b && !b.dataset.guiaW) {
    b.dataset.guiaW = '1';
    b.addEventListener('click', function () { try { switchGuiaTab('eventos'); } catch (e) {} });
  }
  try { renderGuiaPenco(); } catch (e) {}
  try { renderHistoriaPenco(); } catch (e2) {}
}

window.PencoGuia = { render: renderGuiaPenco, renderHistoria: renderHistoriaPenco, data: GUIA_PENCO, historia: HISTORIA_PENCO, tab: switchGuiaTab };
setTimeout(setupGuiaPenco, 600);

})();
