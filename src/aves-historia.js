/* ============================================================
   AVES + BOSQUE NATIVO + HISTORIA — Calendario 13 Lunas (Penco)
   Apartado: Territorio > Aves (btnBirds -> birdsDialog),
   pestanas: Aves hoy | Bosque Nativo | Especies avistadas | Historia.
   - Bosque Nativo: aves que viven del bosque esclerofilo-laurifolio
     de Penco y que arbol lo alimenta / donde verla. Chips tocables
     cargan la especie en el formulario de la bitacora.
   - Especies avistadas: resumen automatico de tu bitacora (privada
     y local): que viste, cuantas veces, donde, y que te falta.
   - Historia: las aves de Penco a lo largo del tiempo.
   Contenido estatico y local (sin red). Se edita aqui mismo.
   Conecta con Bosque Nativo (btnBosque) y Ecosistema.
   ============================================================ */
(function () {
'use strict';

/* Datos dinamicos por territorio: data/territorios/<id>/historia/*.json (ver territorio.js) */
function dynAvesBosque() { try { var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.avesBosque; if (d) return d; } catch (e) {} return AVES_BOSQUE; }
function dynHistAves() { try { var d = window.Territorio && window.Territorio.datos && window.Territorio.datos.historiaAves; if (d) return d; } catch (e) {} return HISTORIA_AVES; }

var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function birdChip(nombre) {
  return '<span class="chip su-3b6a3a" data-ave="' + esc(nombre) + '" title="Toca para cargarla en el formulario">🦅 ' + esc(nombre) + '</span>';
}
function bosqueChip(nombre) {
  var enCat = false;
  try {
    var cat = (typeof BOSQUE_CATALOG !== 'undefined') ? BOSQUE_CATALOG : ((window.pencoData || {}).BOSQUE_NATIVO_PENCO || []);
    enCat = cat.some(function (b) { return b.nombre === nombre; });
  } catch (e) {}
  if (enCat) return '<span class="chip chip-bosque su-3b6a3a" data-bosque-go="' + esc(nombre) + '" title="Ver en Bosque Nativo">🌿 ' + esc(nombre) + '</span>';
  return '<span class="chip su-4681a0">🌿 ' + esc(nombre) + '</span>';
}
function wireBirdChips(scope) {
  if (!scope || !scope.querySelectorAll) return;
  scope.querySelectorAll('[data-ave]').forEach(function (el) {
    el.onclick = function () {
      try { switchAvesTab('hoy'); } catch (e) {}
      setTimeout(function () {
        var inp = $('birdSpecies');
        if (inp) { inp.value = el.getAttribute('data-ave'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
      }, 60);
    };
  });
  scope.querySelectorAll('[data-bosque-go]').forEach(function (el) {
    el.onclick = function () {
      try { var d = $('birdsDialog'); if (d) d.close(); } catch (e) {}
      setTimeout(function () {
        try {
          $('btnBosque').click();
          setTimeout(function () {
            var inp = $('bosqueSpecies');
            if (inp) { inp.value = el.getAttribute('data-bosque-go'); try { inp.focus(); } catch (e2) {} }
          }, 300);
        } catch (e3) {}
      }, 150);
    };
  });
}

/* ---------- AVES DEL BOSQUE NATIVO ---------- */
var AVES_BOSQUE = {
  intro: 'El bosque nativo de Penco —boldo, peumo, quillay, canelo, arrayán, maitén, avellano, maqui— no estaría en pie sin sus aves: <b>polinizan, dispersan semilla y controlan insectos</b>. Estas son las vecinas del bosque. Toca una para registrarla en tu bitácora.',
  grupos: [
    {
      clave: 'polinizadoras',
      t: '🐝 Polinizadoras: las que abren la flor',
      d: 'Sin ellas no hay fruto. Visitan copihue, quintral y flores melíferas de boldo, quillay y arrayán.',
      items: [
        { n: 'Picaflor chico', rol: 'Poliniza copihue y quintral flor por flor, de Sep a Abr.', arboles: ['Copihue', 'Maqui', 'Arrayán'] },
        { n: 'Fío-fío', rol: 'Migrador Sep–Mar: come insectos y reparte semillas de mirtáceas.', arboles: ['Arrayán', 'Maitén'] }
      ]
    },
    {
      clave: 'dispersoras',
      t: '🫐 Dispersoras: las que siembran el cerro',
      d: 'Comen fruto y devuelven la semilla lejos, lista para germinar. El bosque futuro viaja en su guata.',
      items: [
        { n: 'Zorzal', rol: 'El gran sembrador: maqui, arrayán y quillay por todo el cerro. Canta en invierno.', arboles: ['Maqui', 'Arrayán', 'Quillay'] },
        { n: 'Tenca', rol: 'Imitadora de canto; mueve semillas entre quebradas y jardines.', arboles: ['Maqui', 'Maitén'] },
        { n: 'Torcaza', rol: 'Paloma del bosque: bandadas otoñales sobre peumo y boldo.', arboles: ['Peumo', 'Boldo', 'Avellano'] },
        { n: 'Diuca', rol: 'De borde y cerco: come semillas y avisa con su canto corto.', arboles: ['Quillay', 'Maitén'] },
        { n: 'Jilguero', rol: 'Semillero amarillo que recorre quillay y maitén en bandadas.', arboles: ['Quillay', 'Maitén'] },
        { n: 'Cometocino', rol: 'Visita el sotobosque en otoño-invierno buscando semillas.', arboles: ['Peumo', 'Boldo'] }
      ]
    },
    {
      clave: 'sotobosque',
      t: '🌿 Sotobosque: las que viven abajo',
      d: 'Entre quila, helechos y hojarasca: insectívoras que airean el suelo y anuncian la lluvia.',
      items: [
        { n: 'Chucao', rol: 'Dueño del canto del sotobosque húmedo: su “chu-ca-o” anuncia lluvia. Escarba hojarasca.', arboles: ['Canelo', 'Arrayán', 'Quila / Colihue (Chusquea quila)'] },
        { n: 'Chercán', rol: 'Chiquito y bullicioso de cercos y jardines; come pulgones y arañas.', arboles: ['Maitén', 'Maqui'] },
        { n: 'Rayadito', rol: 'Trepa troncos de canelo y arrayán buscando larvas bajo la corteza.', arboles: ['Canelo', 'Arrayán'] },
        { n: 'Cachudito', rol: 'Copete simpático del matorral bajo y maqui; caza mosquitos al vuelo.', arboles: ['Maqui', 'Boldo'] },
        { n: 'Loica', rol: 'De pradera y borde de cerro: pecho rojo visible, canto de primavera.', arboles: ['Quillay', 'Praderas y bordes'] }
      ]
    },
    {
      clave: 'nocturnas',
      t: '🦉 Nocturnas y carpinteras: las que cuidan de noche y de tronco',
      d: 'Controlan ratones e insectos taladro. Si las ves, es señal de bosque sano.',
      items: [
        { n: 'Concón', rol: 'Lechuza del bosque nativo; caza ratones de noche sin hacer ruido.', arboles: ['Canelo', 'Lingue', 'Trihue / Laurel'] },
        { n: 'Carpintero chico', rol: 'Tamborilea troncos viejos y abre huecos que luego usan otras aves.', arboles: ['Quillay', 'Peumo', 'Árboles caídos'] }
      ]
    }
  ],
  nota: '¿Viste quién comió qué fruto? Anótalo también en 🌳 Bosque Nativo → bitácora: es ciencia ciudadana del territorio.',
  cierre: 'Plantar nativo es plantar aves: un peumo o un maqui nuevo es comedero y casa por 50 años.'
};

/* Estructura espejo de HISTORIA_PENCO (penco-guia.js):
   intro + eras[{t, cuando, d}] + sp (chips tocables) + fuentes.
   Mismo render: tarjeta por periodo, fecha muted, descripción,
   chips que cargan la bitácora. */
var HISTORIA_AVES = {
  intro: 'Las aves de Penco —<b>humedal Rocuant, costa y bosque costero</b>— del <b>mar cretácico</b> al <b>retorno actual</b>, en <b>10 periodos</b>. La historia completa vive aquí; toca una especie para cargarla en tu bitácora.',
  eras: [
    {
      t: '🪨 Tiempo profundo: basamento de Gondwana', cuando: 'Paleozoico (~300 Ma) · cerros que serán miradores',
      d: 'Aún sin bahía ni humedal: el <b>zócalo paleozoico</b> forma los cerros (Verde, Bellavista, Tumbes) que millones de años después serán <b>miradores de aves</b> y refugio de bosque. El escenario se levanta antes que las actoras.',
      sp: ['Jilguero', 'Loica']
    },
    {
      t: '🦕 Mar de Quiriquina: la primera ave', cuando: 'Cretácico Superior · Maastrichtiano (72–66 Ma)',
      d: 'Sobre el mar que cubría Penco voló y pescó <b>Neogaeornis wetzeli, la primera ave mesozoica descrita de Sudamérica</b>, junto a plesiosaurios, mosasaurios y tortugas. En <b>La Cata</b> quedan amonites y tortugas fósiles. Toda ave actual de Rocuant desciende de linajes que sobrevivieron a la extinción K/Pg que mató a esos reptiles.',
      sp: ['Yeco / Cormorán', 'Gaviota dominicana', 'Pilpilén']
    },
    {
      t: '🌿 Selvas del carbón: origen del bosque-casa', cuando: 'Paleoceno–Eoceno (~60–40 Ma) · Formación Cosmito',
      d: 'Deltas pantanosos de <b>Cosmito</b> con paleoflora mixta: nace el tipo de bosque (laurifolio, Nothofagus, Proteaceae) que dará <b>fruto, semilla e insectos</b> a las aves del futuro. Sin humedal todavía, pero ya hay <b>selva que cantará</b>.',
      sp: ['Torcaza', 'Zorzal', 'Fío-fío']
    },
    {
      t: '❄️ Hielos, refugio y nacimiento del humedal', cuando: 'Pleistoceno – Holoceno Medio (~2 Ma – 6.000 a.p.)',
      d: 'La <b>Cordillera de la Costa no se glacia</b> y se vuelve <b>refugio</b> (Nothofagus, keule, olivillo). La transgresión forma la <b>bahía, las terrazas de 5 m y 2 m, marismas del Andalién e isla Rocuant</b>: nace el humedal. <b>Hualpén y Tumbes eran islas</b>: costa recortada ideal para aves marinas y playeras. Bosque de <b>boldo y arrayán extensos</b> hasta el mar.',
      sp: ['Zarapito', 'Garza cuca', 'Cisne coscoroba', 'Chucao', 'Rayadito', 'Zorzal']
    },
    {
      t: '🛶 Primeros navegantes: caza y pluma', cuando: 'Arcaico Medio–Tardío (7.000–2.000 a.p.) · Bellavista 1, Playa Negra 9',
      d: 'Conchales con <b>caza de lobo marino</b> y marisqueo (Bellavista 1, Playa Negra 9, Talcahuano 1). Las aves se cazan con respeto estacional y se usan <b>plumas y huesos</b>; ya se navega a Quiriquina entre bandadas. Humedal pleno y bosque continuo: <b>torcazas, choroy, chucao y garzas</b> en abundancia.',
      sp: ['Torcaza', 'Chucao', 'Garza cuca', 'Cisne coscoroba', 'Zarapito', 'Pato jergón']
    },
    {
      t: '🏺 Mundo lafkenche: mensajeras y cantoras', cuando: '130 d.C. – 1550 · Pitrén / El Vergel',
      d: 'Humedal Rocuant pleno y bosque continuo. <b>Bandadas de torcaza y choroy</b> siembran el cerro; <b>chucao, rayadito y concón</b> en el sotobosque; <b>cisnes, garzas y zarapitos</b> en el humedal. Caza estacional y el <b>picaflor como mensajero</b> en relatos. El bosque da <b>maqui, arrayán, avellana y copihue</b>: comedero permanente.',
      sp: ['Torcaza', 'Chucao', 'Concón', 'Picaflor chico', 'Zarapito', 'Garza cuca', 'Cisne coscoroba', 'Rayadito', 'Zorzal']
    },
    {
      t: '⛪ Colonia: vigías y gallinas', cuando: '1550–1800 · Concepción en Penco + traslado 1751',
      d: 'Fundación de 1550: la bahía se llena de <b>velas y vigías</b>, el bosque se abre para fuertes e iglesias. Llega la <b>gallina (ya presente en Arauco prehispánico por ADN, se masifica ahora)</b> a corrales. Con el <b>traslado de 1751</b> y 90 años de silencio, el monte y el humedal respiran: vuelven bandadas donde hubo ciudad.',
      sp: ['Torcaza', 'Concón', 'Chucao', 'Loica', 'Queltrehue / Treile']
    },
    {
      t: '⛏️ Carbón y cobre: presión sobre el monte', cuando: '1800–1958 · Minas Lirquén–Cerro Verde + riel 1889/1914',
      d: 'Tala para leña de fundiciones y <b>entibado de minas</b> fragmenta el bosque: <b>concón, chucao y carpintero</b> se repliegan a quebradas. En el humedal, caza y desecación parcial reducen cisnes y patos. La <b>loica y el queltrehue</b>, de pradera abierta, se adaptan a faldeos despejados. El ferrocarril trae ruido y humo al borde.',
      sp: ['Concón', 'Chucao', 'Carpintero chico', 'Loica', 'Queltrehue / Treile', 'Pato jergón', 'Cisne coscoroba']
    },
    {
      t: '🌲 Siglo XX: pinos, ciudad y protección', cuando: '1900–2010 · Pino/eucalipto + Ley Caza 1996 + Ley Bosque 2008',
      d: 'Plantaciones de <b>pino y eucalipto</b>: monocultivo silencioso donde casi no canta el bosque. Rellenos presionan <b>Rocuant</b>. Resisten generalistas (<b>zorzal, diuca, chercán, gaviota</b>) y el humedal sigue recibiendo <b>migratorias (zarapito, fío-fío)</b>. Giro: la <b>Ley de Caza (19.473, 1996)</b> protege a casi todas las nativas, el <b>copihue</b> protege a su polinizador, Rocuant se reconoce como <b>sitio clave de playeras migratorias</b> (zarapito, chorlo nevado) y la <b>Ley de Bosque Nativo (20.283, 2008)</b> frena la pérdida de casa.',
      sp: ['Zorzal', 'Diuca', 'Chercán', 'Gaviota dominicana', 'Zarapito', 'Fío-fío', 'Yeco / Cormorán', 'Chorlo nevado', 'Pilpilén', 'Bandurria', 'Picaflor chico']
    },
    {
      t: '🔭 Hoy: observar para cuidar', cuando: '2010 – actualidad · Rocuant aula viva + 27F',
      d: 'Rocuant es aula viva: <b>pleamar concentra limícolas</b>, el amanecer levanta el canto (tenca, zorzal, chercán) y la noche es del <b>concón</b>. El <b>27F</b> remodeló bordes y recordó vivir con el mar. Tu bitácora suma: cada avistamiento con fecha, lugar y luna ayuda a saber <b>qué vuelve y qué falta</b>. Si plantas nativo (peumo, maqui, arrayán), <b>vuelven las dispersoras</b>.',
      sp: ['Zorzal', 'Tenca', 'Chercán', 'Concón', 'Chucao', 'Picaflor chico', 'Zarapito', 'Loica', 'Cachudito', 'Jilguero', 'Torcaza', 'Rayadito']
    }
  ],
  fuentes: 'Fuentes: HISTORIA_PENCO (Quiriquina-Neogaeornis, refugio, conchales, humedal) · Biró 1982 / Stinnesbeck (Quiriquina) · Bustos y Vergara 2004 · Ley de Caza 19.473 · Ley Bosque Nativo 20.283 · eBird / ROC humedal Rocuant-Andalién · catálogo AVES_PENCO y BOSQUE_NATIVO_PENCO de esta app.'
};

/* ---------- RENDER: BOSQUE NATIVO ---------- */
function avesBUid(p) { return (p || 'ab') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function avesBSave(m) { try { if (typeof scheduleSave === 'function') scheduleSave(m || 'Guardado ✓'); } catch (e) {} }
function getAvesBosqueCustom() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return [];
    if (!Array.isArray(u.avesBosqueCustom)) u.avesBosqueCustom = [];
    return u.avesBosqueCustom;
  } catch (e) { return []; }
}
function avesBosqueAddRecord(grupo, rec) {
  var nombre = String((rec && rec.nombre) || '').trim().slice(0, 40);
  if (!nombre) return null;
  var arr = getAvesBosqueCustom();
  var r = {
    id: avesBUid('ab'), grupo: grupo, nombre: nombre,
    rol: String((rec && rec.rol) || '').trim().slice(0, 120),
    arboles: String((rec && rec.arboles) || '').trim().slice(0, 80)
  };
  arr.push(r);
  avesBSave('Especie guardada 🦅');
  return r;
}
function avesBosqueDelRecord(id) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u || !Array.isArray(u.avesBosqueCustom)) return false;
    var i = u.avesBosqueCustom.findIndex(function (x) { return x.id === id; });
    if (i < 0) return false;
    u.avesBosqueCustom.splice(i, 1);
    avesBSave('Especie borrada');
    return true;
  } catch (e) { return false; }
}
function avesBosqueCustomCard(r) {
  var arb = String(r.arboles || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  return '<div class="si-card su-a3194a"><h4 class="su-6cb285">' + birdChip(r.nombre) +
    ' <span class="chip su-421073">mía</span></h4>' +
    (r.rol ? '<p class="su-48eb2e">' + esc(r.rol) + '</p>' : '') +
    (arb.length ? '<div class="su-8af0ed"><span class="muted su-0d5be0">Vive de:</span>' + arb.map(bosqueChip).join('') + '</div>' : '') +
    '<div class="su-30b926"><button type="button" class="btn su-fd834a" data-avesbdel="' + r.id + '">✕ Borrar</button></div></div>';
}
function avesBosqueAddForm(clave) {
  return '<details class="su-c8c413"><summary class="su-d9db22"><b>➕ Agregar especie en esta sección</b></summary>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">Nombre * <input type="text" id="avesbN-' + clave + '" placeholder="ej: Pitío, Bandurrilla" maxlength="40"></label></div>' +
    '<label>Qué hace / rol <input type="text" id="avesbR-' + clave + '" placeholder="ej: Canta al amanecer entre boldos" maxlength="120"></label>' +
    '<label>Vive de (árboles, separa con comas) <input type="text" id="avesbW-' + clave + '" placeholder="ej: Boldo, Maqui" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" class="btn btn-accent su-30e741" data-avesbadd="' + clave + '">+ Guardar especie</button></div></details>';
}
function renderAvesBosque() {
  var box = $('avesBosquePanel');
  if (!box) return;
  var g = dynAvesBosque();
  var html = '<p class="muted su-b6db47">' + g.intro + '</p>';
  var customs = getAvesBosqueCustom();
  html += g.grupos.map(function (gr) {
    var items = gr.items.map(function (it) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + birdChip(it.n) + '</h4>' +
        '<p class="su-48eb2e">' + esc(it.rol) + '</p>' +
        (it.n === 'Chucao' ? '<div class="su-557d84"><button type="button" class="btn btn-chucao-sound su-337714">🔊 Escuchar canto</button></div>' : '') +
        '<div class="su-8af0ed"><span class="muted su-0d5be0">Vive de:</span>' +
        it.arboles.map(bosqueChip).join('') + '</div></div>';
    }).join('');
    var mias = customs.filter(function (x) { return x.grupo === gr.clave; }).map(avesBosqueCustomCard).join('');
    var nMias = customs.filter(function (x) { return x.grupo === gr.clave; }).length;
    return '<div class="menstrual-card su-d2c171"><h4>' + esc(gr.t) +
      (nMias ? ' <span class="muted su-11a508">· + <b>' + nMias + ' mías</b></span>' : '') + '</h4>' +
      '<p class="muted su-11a508">' + esc(gr.d) + '</p>' + items + mias + avesBosqueAddForm(gr.clave) + '</div>';
  }).join('');
  html += '<div class="menstrual-card su-51d56a"><p class="su-6cb285">🌱 ' + esc(g.cierre) + '</p>' +
    '<p class="muted su-11a508">💡 ' + esc(g.nota) + '</p>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="avesGoBosque" class="btn su-30e741">🌳 Ir a Bosque Nativo</button></div></div>';
  box.innerHTML = html;
  wireBirdChips(box);
  box.querySelectorAll('.btn-chucao-sound').forEach(function (btn) {
    btn.onclick = function (e) {
      try { if (e && e.stopPropagation) e.stopPropagation(); } catch (err) {}
      try { if (typeof playNotifySound === 'function') playNotifySound(); } catch (err2) {}
    };
  });
  box.querySelectorAll('[data-avesbadd]').forEach(function (btn) {
    btn.onclick = function () {
      var k = btn.getAttribute('data-avesbadd');
      var nEl = $('avesbN-' + k), rEl = $('avesbR-' + k), wEl = $('avesbW-' + k);
      var r = avesBosqueAddRecord(k, {
        nombre: nEl ? nEl.value : '', rol: rEl ? rEl.value : '', arboles: wEl ? wEl.value : ''
      });
      if (!r) { alert('Ponle nombre a la especie'); return; }
      renderAvesBosque();
    };
  });
  box.querySelectorAll('[data-avesbdel]').forEach(function (btn) {
    btn.onclick = function () {
      if (!confirm('¿Borrar tu especie?')) return;
      avesBosqueDelRecord(btn.getAttribute('data-avesbdel'));
      renderAvesBosque();
    };
  });
  var gb = $('avesGoBosque');
  if (gb) gb.onclick = function () {
    try { var d = $('birdsDialog'); if (d) d.close(); } catch (e) {}
    setTimeout(function () { try { $('btnBosque').click(); } catch (e2) {} }, 150);
  };
}

/* ---------- RENDER: ESPECIES AVISTADAS ---------- */
function getAvesEntries() {
  try {
    if (typeof getBirdData === 'function') return getBirdData().entries || [];
    var u = (typeof userData === 'function') ? userData() : null;
    return (u && u.birds && u.birds.entries) || [];
  } catch (e) { return []; }
}
function getAvesCatalogo() {
  try {
    if (typeof getAllBirdsCatalog === 'function') return getAllBirdsCatalog();
    if (typeof BIRDS_CATALOG !== 'undefined') return BIRDS_CATALOG;
    return (window.pencoData || {}).AVES_PENCO || [];
  } catch (e) { return []; }
}
function renderAvesAvistadas() {
  var box = $('avesAvistadasPanel');
  if (!box) return;
  var entries = getAvesEntries();
  var cat = getAvesCatalogo();
  var porSp = {};
  entries.forEach(function (r) {
    var k = String(r.species || '').trim() || '—';
    if (!porSp[k]) porSp[k] = { n: 0, ind: 0, ultima: '', lugares: {} };
    porSp[k].n++;
    porSp[k].ind += parseInt(r.count, 10) || 0;
    if (!porSp[k].ultima || String(r.date) > String(porSp[k].ultima)) porSp[k].ultima = r.date;
    var lug = String(r.place || '').trim();
    if (lug) porSp[k].lugares[lug] = (porSp[k].lugares[lug] || 0) + 1;
  });
  var vistas = Object.keys(porSp).sort(function (a, b) { return porSp[b].n - porSp[a].n; });
  var enCat = cat.map(function (b) { return b.nombre; });
  var noVistas = enCat.filter(function (n) {
    var low = String(n).toLowerCase();
    return !vistas.some(function (v) { return String(v).toLowerCase() === low; });
  });
  var totalInd = vistas.reduce(function (s, k) { return s + porSp[k].ind; }, 0);
  var html = '<div class="menstrual-card su-68a1a9"><h4>📊 Tus especies avistadas</h4>' +
    '<div class="su-c158a9">' +
    '<span class="chip">' + entries.length + ' avistamientos</span>' +
    '<span class="chip">' + vistas.length + ' especies distintas</span>' +
    '<span class="chip">' + totalInd + ' individuos</span>' +
    '<span class="chip">📖 ' + cat.length + ' en catálogo</span></div>' +
    '<p class="muted su-e13d76">Privado y local por usuario. Toca una especie para cargarla en el formulario y sumar un nuevo avistamiento.</p>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="avGoForm" class="btn su-337714">📓 Ir a la bitácora</button></div></div>';
  if (!vistas.length) {
    html += '<div class="menstrual-card su-d2c171"><p class="su-6cb285">Aún sin avistamientos. Registra el primero en 🦅 Aves hoy y aparecerá aquí con fecha, lugar y conteo.</p></div>';
  } else {
    html += '<div class="menstrual-card su-d2c171"><h4>✅ Vistas (' + vistas.length + ')</h4>' +
      vistas.map(function (k) {
        var v = porSp[k];
        var lugs = Object.keys(v.lugares).slice(0, 2).join(' · ');
        return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + birdChip(k) +
          ' <span class="chip su-fb2957">×' + v.n + ' · ' + v.ind + ' ind.</span></h4>' +
          '<p class="muted su-0d5be0">Última: ' + esc(v.ultima || '—') + (lugs ? ' · ' + esc(lugs) : '') + '</p></div>';
      }).join('') + '</div>';
  }
  if (noVistas.length) {
    html += '<div class="menstrual-card su-d2c171"><h4>🔭 Por avistar (' + noVistas.length + ')</h4>' +
      '<p class="muted su-11a508">Del catálogo aún no registradas en tu bitácora:</p>' +
      '<div class="su-c158a9">' + noVistas.map(birdChip).join('') + '</div></div>';
  }
  box.innerHTML = html;
  wireBirdChips(box);
  var gf = $('avGoForm');
  if (gf) gf.onclick = function () { try { switchAvesTab('hoy'); } catch (e) {} };
}

/* ---------- RENDER: HISTORIA ---------- */
function renderAvesHistoria() {
  var box = $('avesHistoriaPanel');
  if (!box) return;
  var g = dynHistAves();
  var html = '<p class="muted su-b6db47">' + g.intro + '</p>';
  html += g.eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted su-2c4c6c">' + esc(e.cuando) + '</p>' +
      '<p class="su-afb724">' + e.d + '</p>' +
      '<div class="su-c158a9">' + e.sp.map(birdChip).join('') + '</div></div>';
  }).join('');
  html += '<p class="muted su-a953a7">' + esc(g.fuentes) + '</p>';
  box.innerHTML = html;
  wireBirdChips(box);
}

/* ---------- TABS ---------- */
var avesTab = 'hoy';
function switchAvesTab(t) {
  avesTab = t;
  var tabs = { hoy: $('tabAvesHoy'), bosque: $('tabAvesBosque'), avistadas: $('tabAvesAvistadas'), historia: $('tabAvesHistoria') };
  Object.keys(tabs).forEach(function (k) { if (tabs[k]) tabs[k].classList.toggle('btn-accent', k === t); });
  var panels = { hoy: $('avesHoyPanel'), bosque: $('avesBosquePanel'), avistadas: $('avesAvistadasPanel'), historia: $('avesHistoriaPanel') };
  Object.keys(panels).forEach(function (k) { if (panels[k]) panels[k].classList.toggle('hidden', k !== t); });
  if (t === 'bosque') renderAvesBosque();
  if (t === 'avistadas') renderAvesAvistadas();
  if (t === 'historia') renderAvesHistoria();
}

/* ---------- Mejora Aves hoy: filtro + accesos ---------- */
var avesCatQ = '';
function mejorarAvesHoy() {
  var catBox = $('birdsCatalogBox');
  if (catBox && !$('avesCatFilter')) {
    var row = document.createElement('div');
    row.innerHTML = '<input type="text" id="avesCatFilter" placeholder="🔍 Filtrar... (ej: bosque, humedal, canto)" autocomplete="off" value="' + esc(avesCatQ) + '" class="su-4e420a">';
    catBox.insertBefore(row, catBox.firstChild);
    var inp = $('avesCatFilter');
    var aplicar = function () {
      avesCatQ = (inp.value || '').toLowerCase();
      catBox.querySelectorAll('.fishing-species-item').forEach(function (it) {
        it.style.display = (!avesCatQ || it.textContent.toLowerCase().indexOf(avesCatQ) >= 0) ? '' : 'none';
      });
    };
    inp.addEventListener('input', aplicar);
    if (avesCatQ) aplicar();
  }
  var todayBox = $('birdsTodayBox');
  if (todayBox && !$('avesHoyPlus')) {
    var div = document.createElement('div');
    div.id = 'avesHoyPlus';
    div.innerHTML = '<div class="dlg-actions su-8f9e27">' +
      '<button type="button" id="ahoyGoBosque" class="btn su-337714">🌳 Aves del bosque</button>' +
      '<button type="button" id="ahoyGoVistas" class="btn su-337714">📊 Mis avistadas</button>' +
      '<button type="button" id="ahoyGoHist" class="btn su-337714">📜 Historia</button></div>';
    todayBox.appendChild(div);
    var b1 = $('ahoyGoBosque'); if (b1) b1.onclick = function () { switchAvesTab('bosque'); };
    var b2 = $('ahoyGoVistas'); if (b2) b2.onclick = function () { switchAvesTab('avistadas'); };
    var b3 = $('ahoyGoHist'); if (b3) b3.onclick = function () { switchAvesTab('historia'); };
  }
}

function setupAvesHistoria() {
  if (!$('birdsDialog') || !$('tabAvesHistoria')) {
    window._ahistRetry = (window._ahistRetry || 0) + 1;
    if (window._ahistRetry < 60) setTimeout(setupAvesHistoria, 500);
    return;
  }
  try {
    var btn = $('btnBirds');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('bosque') < 0)
      btn.dataset.keywords += ' bosque nativo chucao tenca diuca chercan rayadito cachudito torcaza carpintero cometocino jilguero concón historia avistadas humedal rocuant canelo arrayan maqui dispersora polinizador';
  } catch (e) {}
  var tH = $('tabAvesHoy'), tB = $('tabAvesBosque'), tV = $('tabAvesAvistadas'), tS = $('tabAvesHistoria');
  if (tH && !tH.dataset.w) { tH.dataset.w = '1'; tH.onclick = function () { switchAvesTab('hoy'); }; }
  if (tB && !tB.dataset.w) { tB.dataset.w = '1'; tB.onclick = function () { switchAvesTab('bosque'); }; }
  if (tV && !tV.dataset.w) { tV.dataset.w = '1'; tV.onclick = function () { switchAvesTab('avistadas'); }; }
  if (tS && !tS.dataset.w) { tS.dataset.w = '1'; tS.onclick = function () { switchAvesTab('historia'); }; }
  try {
    if (typeof renderBirdsDialog === 'function' && !window._avesWrapped) {
      window._avesWrapped = true;
      var orig = renderBirdsDialog;
      renderBirdsDialog = function () {
        var r = orig.apply(this, arguments);
        try { mejorarAvesHoy(); } catch (e) {}
        try { if (avesTab === 'bosque') renderAvesBosque(); } catch (e2) {}
        try { if (avesTab === 'avistadas') renderAvesAvistadas(); } catch (e3) {}
        try { if (avesTab === 'historia') renderAvesHistoria(); } catch (e4) {}
        return r;
      };
    }
  } catch (e) {}
  var b = $('btnBirds');
  if (b && !b.dataset.ahistW) {
    b.dataset.ahistW = '1';
    b.addEventListener('click', function () { try { switchAvesTab('hoy'); } catch (e) {} });
  }
  try { renderAvesBosque(); } catch (e) {}
  try { renderAvesHistoria(); } catch (e) {}
}

window.AvesHistoria = { tab: switchAvesTab, renderBosque: renderAvesBosque, renderAvistadas: renderAvesAvistadas, renderHistoria: renderAvesHistoria, bosqueAdd: avesBosqueAddRecord, bosqueDel: avesBosqueDelRecord, bosqueList: getAvesBosqueCustom };
try {
  Object.defineProperties(window.AvesHistoria, {
    bosque: { get: dynAvesBosque },
    historia: { get: dynHistAves }
  });
} catch (e) { window.AvesHistoria.bosque = AVES_BOSQUE; window.AvesHistoria.historia = HISTORIA_AVES; }
try { document.addEventListener('territorio:listo', function () { try { renderAvesBosque(); } catch (e) {} try { renderAvesHistoria(); } catch (e2) {} }); } catch (e3) {}
setTimeout(setupAvesHistoria, 600);

})();
