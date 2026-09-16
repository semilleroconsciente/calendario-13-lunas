/* ============================================================
   HISTORIA DEL BOSQUE NATIVO — Calendario 13 Lunas (Penco)
   Apartado: Territorio > Bosque Nativo (btnBosque -> bosqueDialog),
   pestana "Historia del bosque": las especies a lo largo del tiempo,
   desde los linajes gondwanicos hasta la restauracion actual.
   Contenido estatico y local (sin guardado): se edita aqui mismo,
   en HISTORIA_BOSQUE. Las especies del catálogo (data.js) se pueden
   tocar para cargarlas en el formulario de la bitácora.
   Conecta con Guía de Penco (Antes de 1550) y Siembra lunar.
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

/* cat: true = existe en el catálogo BOSQUE_NATIVO_PENCO (tocable) */
var HISTORIA_BOSQUE = {
  intro: 'El bosque de Penco —esclerófilo en laderas y laurifolio en quebradas— es un <b>relicto de millones de años</b> en la Cordillera de la Costa. Esta es su historia en 5 tiempos, con las especies que estuvieron (y están) presentes.',
  eras: [
    {
      t: '🌋 Tiempo profundo: herencia de Gondwana', cuando: 'Hace millones de años · glaciaciones del Pleistoceno',
      d: 'Muchas especies del bosque penqueño pertenecen a <b>linajes gondwánicos</b>, del antiguo supercontinente austral. Cuando los hielos avanzaron, la <b>Cordillera de la Costa</b> —con su clima oceánico moderado— funcionó como <b>refugio</b> donde estos árboles sobrevivieron (confirmado por estudios genéticos en Nothofagus y Proteaceae). El Ministerio del Medio Ambiente describe aquí el ecosistema <b>“Bosque caducifolio costero de Nothofagus obliqua – Gomortega keule”</b>, hoy fragmentado.',
      sp: [
        { n: 'Keule', cat: true }, { n: 'Canelo', cat: true }, { n: 'Avellano', cat: true },
        { n: 'Lingue', cat: true }, { n: 'Arrayán', cat: true }, { n: 'Peumo', cat: true },
        { n: 'Roble / Hualo (Nothofagus)', cat: false }, { n: 'Olivillo', cat: false }
      ],
      hoy: 'El <b>keule</b> es único en su género y familia (endémico Maule–Biobío). El sitio prioritario <b>“Queule del Estero Bellavista”</b> recuerda que estos linajes viven —o vivieron— en Penco.'
    },
    {
      t: '🏹 Antes de 1550: el bosque lafkenche', cuando: 'Período alfarero · Pitrén y El Vergel (300–1.500 d.C.)',
      d: 'Las comunidades <b>lafkenche</b> habitaron este bosque sin talarlo a gran escala: alimento, medicina, madera y ritual. El <b>canelo (foye)</b> era árbol sagrado; la <b>trihue/laurel</b> y el <b>lingue</b> daban madera noble; <b>avellano (ngefu), maqui, peumo y boldo</b> daban fruto y remedio; con troncos ahuecados se hacían <b>wampo</b> (canoas). Ver 📖 Guía de Penco → Antes de 1550.',
      sp: [
        { n: 'Canelo', cat: true }, { n: 'Trihue / Laurel', cat: true }, { n: 'Lingue', cat: true },
        { n: 'Avellano', cat: true }, { n: 'Maqui', cat: true }, { n: 'Peumo', cat: true },
        { n: 'Boldo', cat: true }, { n: 'Arrayán', cat: true }, { n: 'Copihue', cat: true }, { n: 'Quillay', cat: true }
      ],
      hoy: 'Casi todas estas especies siguen presentes en quebradas y cerros: son el corazón del catálogo actual.'
    },
    {
      t: '⛏️ Colonia y siglo XIX: la gran presión', cuando: '1550–1900',
      d: 'La fundación de Concepción en Penco (1550), la construcción colonial y luego la <b>fundición de cobre de Lirquén</b> y las <b>minas de carbón (1843–1958)</b> demandaron enormes volúmenes de <b>leña, carbón vegetal y madera</b> (entibado de minas, hornos, construcción). <b>Lingue, roble, laurel y arrayán</b> —maderas nobles— fueron los más cortados; los faldeos se abrieron a praderas y cultivos.',
      sp: [
        { n: 'Lingue', cat: true }, { n: 'Trihue / Laurel', cat: true }, { n: 'Arrayán', cat: true },
        { n: 'Roble / Hualo (Nothofagus)', cat: false }, { n: 'Peumo', cat: true },
        { n: 'Boldo', cat: true }, { n: 'Maitén', cat: true }
      ],
      hoy: 'El <b>lingue</b> quedó en categoría <b>vulnerable</b>: hoy solo se observa y protege, no se corta.'
    },
    {
      t: '🌲 Siglo XX: pinos, eucaliptos y fragmentos', cuando: '1900–2000',
      d: 'Las <b>plantaciones de pino radiata y eucalipto</b> cubrieron gran parte de la Cordillera de la Costa, <b>fragmentando y reemplazando</b> al bosque nativo (lo documenta el MMA para este ecosistema). El nativo resistió en <b>quebradas húmedas</b> (canelo, lingue, trihue, arrayán, copihue) y <b>laderas</b> (boldo, peumo, quillay, maitén). En 2008 la <b>Ley de Bosque Nativo (20.283)</b> dio por primera vez un marco legal para su manejo y protección.',
      sp: [
        { n: 'Canelo', cat: true }, { n: 'Lingue', cat: true }, { n: 'Trihue / Laurel', cat: true },
        { n: 'Arrayán', cat: true }, { n: 'Copihue', cat: true }, { n: 'Boldo', cat: true },
        { n: 'Peumo', cat: true }, { n: 'Quillay', cat: true }, { n: 'Maitén', cat: true },
        { n: 'Naranjillo', cat: true }, { n: 'Pino / Eucalipto (introducidos)', cat: false }
      ],
      hoy: 'Si ves <b>zarza, pino o eucalipto invasor</b>, anótalo en la bitácora para jornada de control.'
    },
    {
      t: '🌱 Hoy: relictos y restauración', cuando: '2000 – actualidad',
      d: 'Quedan <b>relictos</b> que piden cuidado urgente: <b>keule en peligro</b> (Monumento Natural desde 1995), <b>lingue y naranjillo vulnerables</b>, <b>trihue muy escaso</b> en Penco y <b>copihue protegido por ley</b>. Restaurar es posible: planta <b>peumo, quillay, boldo, canelo, arrayán, maitén y avellano</b> en Pukem con lluvia, y en otoño disfruta los <b>hongos</b> (loyo, changle) sin arrancar el micelio.',
      sp: [
        { n: 'Keule', cat: true }, { n: 'Lingue', cat: true }, { n: 'Naranjillo', cat: true },
        { n: 'Trihue / Laurel', cat: true }, { n: 'Copihue', cat: true }, { n: 'Peumo', cat: true },
        { n: 'Quillay', cat: true }, { n: 'Boldo', cat: true }, { n: 'Canelo', cat: true },
        { n: 'Arrayán', cat: true }, { n: 'Avellano', cat: true }, { n: 'Maitén', cat: true },
        { n: 'Maqui', cat: true }, { n: 'Lloyin / Hongos', cat: true }, { n: 'Chupalla', cat: true }
      ],
      hoy: 'Toca una especie del catálogo para cargarla en tu bitácora: observa, planta o recolecta semilla <b>con medida</b>.'
    }
  ],
  fuentes: 'Fuentes: Premoli et al. 2019 (refugios Cordillera de la Costa) · MMA-SIMBIO (ecosistema N. obliqua–G. keule; ficha Queule En Peligro) · Ley 20.283 Bosque Nativo · catálogo BOSQUE_NATIVO_PENCO de esta app.'
};

function chip(sp) {
  if (sp.cat) return '<span class="chip chip-bosque" data-bosque="' + esc(sp.n) + '" style="cursor:pointer" title="Toca para cargarla en el formulario">🌿 ' + esc(sp.n) + '</span>';
  return '<span class="chip" style="font-size:10px;opacity:.8">' + esc(sp.n) + '</span>';
}

/* ============================================================
   ACOMPAÑANTES DEL BOSQUE — la red que vive con los árboles:
   hongos, aves, sotobosque y polinizadores del bosque
   esclerófilo-laurifolio costero. Tono honesto: no todo se deja
   ver todos los días; registra lo que observes en la bitácora.
   ============================================================ */
var ACOMPANANTES = {
  intro: 'Un árbol nativo nunca está solo: bajo sus raíces trabajan <b>hongos</b>, en sus ramas comen y siembran <b>aves</b>, a sus pies crece el <b>sotobosque</b> y sus flores alimentan <b>polinizadores</b>. Esta es la compañía del bosque penqueño.',
  grupos: [
    {
      clave: 'hongos',
      t: '🍄 Hongos compañeros', d: 'Reciclan la hojarasca y, como <b>micorrizas</b>, conectan sus hilos a las raíces de peumo, boldo y roble: intercambian agua y nutrientes por azúcares. Sin hongos, el bosque se empobrece.',
      items: [
        { n: 'Digüeñe (Cyttaria espinosae)', r: 'Crece sobre robles y hualos; fruto otoñal comestible muy querido.', con: ['Roble / Hualo (Nothofagus)'] },
        { n: 'Changle (Ramaria)', r: 'Ramitas doradas del suelo otoñal; vive asociado al bosque nativo.', con: ['Roble / Hualo (Nothofagus)', 'Avellano'] },
        { n: 'Loyo (Boletus loyo)', r: 'Grande y carnoso, micorrícico de Nothofagus. Solo si 100% seguro.', con: ['Roble / Hualo (Nothofagus)'] },
        { n: 'Ostra (Pleurotus ostreatus)', r: 'En troncos caídos: recicladora que ablanda la madera muerta.', con: ['Árboles caídos'] }
      ],
      nota: 'Regla de oro: <b>cosecha con tijera o cuchillo, deja el micelio</b> y lleva canasto aireado. Si dudas, foto y bitácora.'
    },
    {
      clave: 'aves',
      t: '🐦 Aves que siembran y polinizan', d: 'Las aves son las grandes <b>sembradoras</b> del bosque: comen fruto y devuelven semilla lejos, lista para germinar. El <b>picaflor chico</b> poliniza las flores colgantes.',
      items: [
        { n: 'Zorzal', r: 'Dispersa maqui, arrayán y quillay por todo el cerro.', con: ['Maqui', 'Arrayán', 'Quillay'] },
        { n: 'Tenca', r: 'Imitadora; come frutos y mueve semillas entre quebradas.', con: ['Maqui', 'Maitén'] },
        { n: 'Fío-Fío', r: 'Migrador que reparte semillas de mirtáceas en primavera.', con: ['Arrayán'] },
        { n: 'Chucao (Scelorchilus rubecula)', r: 'Dueño del canto del sotobosque húmedo: su “chu-ca-o” fuerte anuncia la lluvia. Escarba la hojarasca buscando insectos y es gran noticia verlo.', con: ['Quebradas húmedas', 'Quila', 'Hojarasca'] },
        { n: 'Picaflor chico (Sephanoides sephaniodes)', r: 'Poliniza copihue y quintral flor por flor.', con: ['Copihue'] }
      ],
      nota: '¿Viste quién comió qué? Anótalo en 🦅 Aves y en la bitácora del bosque: es ciencia ciudadana.'
    },
    {
      clave: 'sotobosque',
      t: '🌿 Sotobosque que acompaña', d: 'Bajo el dosel vive otra selva en miniatura: da <b>refugio</b>, guarda la <b>humedad</b> y afirma el suelo.',
      items: [
        { n: 'Quila / Colihue (Chusquea quila)', r: 'Bambú nativo: refugio de aves y brotes comestibles en primavera.', con: ['Quebradas húmedas'] },
        { n: 'Helechos', r: 'Alfombran lo sombrío e indican aire y suelo sanos.', con: ['Canelo', 'Arrayán'] },
        { n: 'Michay (Berberis spp.)', r: 'Arbusto espinudo de flor amarilla y baya ácida para aves.', con: ['Boldo', 'Peumo'] },
        { n: 'Quintral (Tristerix corymbosus)', r: 'Hemiparásito de flores rojas que el picaflor adora; en el bosque templado lo siembra el monito del monte en las ramas.', con: ['Maitén', 'Árboles altos'] }
      ],
      nota: 'No limpies el sotobosque “para ordenar”: es la despensa y la cuna del bosque.'
    },
    {
      clave: 'polinizadores',
      t: '🐝 Polinizadores', d: 'Sin ellos no hay fruto ni semilla. Las flores de <b>boldo, quillay, canelo y arrayán</b> son melíferas y los llaman cada primavera.',
      items: [
        { n: 'Abejas nativas (ej. Caupolicana)', r: 'Endémicas de Chile; visitan las flores del esclerófilo.', con: ['Quillay', 'Boldo'] },
        { n: 'Abejorros y moscas florícolas', r: 'Polinizan en días fríos cuando las abejas salen poco.', con: ['Canelo', 'Arrayán'] },
        { n: 'Mariposas nocturnas', r: 'Visitan las flores blancas y perfumadas de la noche.', con: ['Trihue / Laurel'] }
      ],
      nota: 'Si plantas nativo, planta también su compañía: flores escalonadas de invierno a verano.'
    },
    {
      clave: 'animales',
      t: '🦊 Animales del bosque', d: 'Los que caminan de noche y al atardecer: <b>remueven el suelo, controlan roedores e insectos</b> y siembran a su paso. Son esquivos: si ves uno, anótalo, es gran noticia.',
      items: [
        { n: 'Chingue (Conepatus chinga)', r: 'Zorrillo común que remueve el suelo buscando insectos y dispersa semillas.', con: ['Sotobosque', 'Quebradas'] },
        { n: 'Zorro chilla / culpeo (Lycalopex)', r: 'Visita los bordes del bosque y controla ratones y conejos.', con: ['Praderas y bordes'] },
        { n: 'Monito del monte (Dromiciops gliroides)', r: 'Marsupial nocturno de los bosques templados más conservados; siembra el quintral en las ramas.', con: ['Quintral (Tristerix corymbosus)'] },
        { n: 'Lagartijas y culebra de cola larga', r: 'Controlan insectos entre rocas y claros. Se observan de lejos, sin molestar.', con: ['Roqueríos y claros'] }
      ],
      nota: 'Mira huellas, fecas y senderos: el bosque se lee también sin ver al animal.'
    },
    {
      clave: 'insectos',
      t: '🐛 Insectos e invertebrados', d: 'Los más pequeños y los más trabajadores: <b>polinizan, reciclan y alimentan</b> a todo el resto de la red.',
      items: [
        { n: 'Abejorro chileno (Bombus dahlbomii)', r: 'Polinizador grande y peludo, en retroceso: si lo ves, no lo molestes.', con: ['Quillay', 'Boldo', 'Canelo'] },
        { n: 'Mariposas diurnas', r: 'Sus orugas comen hojas nativas y las adultas polinizan flores.', con: ['Flores del sotobosque'] },
        { n: 'Chinitas (Eriopis spp.)', r: 'Devoran pulgones que atacan los brotes nuevos.', con: ['Brotes y renovales'] },
        { n: 'Caracol negro', r: 'Reciclador nocturno de la hojarasca húmeda.', con: ['Hojarasca y troncos'] },
        { n: 'Libélulas', r: 'Patrullan esteros y quebradas comiendo zancudos.', con: ['Esteros y vertientes'] }
      ],
      nota: 'Una quebrada con libélulas y abejorros es una quebrada sana.'
    }
  ],
  cierre: 'Todo esto cabe en tu bitácora: hongos, aves, flores y frutos tienen tipo de registro. <b>Observar la red completa es cuidar el bosque completo.</b>'
};

/* Especies agregadas por el usuario en cada grupo del Ecosistema (clave ecoCustom, por usuario) */
function ecoUid(p) { return (p || 'e') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function ecoSave(m) { try { if (typeof scheduleSave === 'function') scheduleSave(m || 'Guardado ✓'); } catch (e) {} }
function getEcoCustom() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return [];
    if (!Array.isArray(u.ecoCustom)) u.ecoCustom = [];
    return u.ecoCustom;
  } catch (e) { return []; }
}
function ecoAddRecord(grupo, rec) {
  var nombre = String((rec && rec.nombre) || '').trim().slice(0, 40);
  if (!nombre) return null;
  var arr = getEcoCustom();
  var r = {
    id: ecoUid('eco'), grupo: grupo, nombre: nombre,
    icon: String((rec && rec.icon) || '').trim().slice(0, 4) || '🌱',
    cient: String((rec && rec.cient) || '').trim().slice(0, 50),
    rol: String((rec && rec.rol) || '').trim().slice(0, 120),
    con: String((rec && rec.con) || '').trim().slice(0, 80)
  };
  arr.push(r);
  ecoSave('Especie guardada 🌱');
  return r;
}
function ecoDelRecord(id) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u || !Array.isArray(u.ecoCustom)) return false;
    var i = u.ecoCustom.findIndex(function (x) { return x.id === id; });
    if (i < 0) return false;
    u.ecoCustom.splice(i, 1);
    ecoSave('Especie borrada');
    return true;
  } catch (e) { return false; }
}

/* Destacados de temporada para la pestaña Bosque hoy (por estación mapuche) */
var DESTACADOS_ESTACION = {
  PUKEM: { t: 'Pukem — plantar y hongos', d: 'Suelo blando con lluvia: planta nativo y guarda semilla. Ojo a los hongos otoñales que alcanzan el invierno.', sp: ['Peumo', 'Quillay', 'Canelo', 'Boldo', 'Lloyin / Hongos'] },
  PEWU: { t: 'Pewü — flores y esquejes', d: 'Floración de boldo y canelo: no cortes flores; es tiempo de esquejes y de controlar invasoras.', sp: ['Boldo', 'Canelo', 'Naranjillo', 'Trihue / Laurel', 'Arrayán'] },
  WALUNG: { t: 'Walüng — frutos', d: 'Cosecha con medida (30% tú, 70% aves y suelo): maqui, avellana y arrayán maduros.', sp: ['Maqui', 'Avellano', 'Arrayán', 'Quillay', 'Maitén'] },
  RIMU: { t: 'Rimü — siembra directa', d: 'La semilla que cae, se siembra: peumo y avellana directo a tierra; hongos en canasto aireado.', sp: ['Peumo', 'Avellano', 'Keule', 'Lingue', 'Lloyin / Hongos'] }
};
var bosqueCatQ = '';

function renderBosqueHistoria() {
  var box = $('bosqueHistoriaPanel');
  if (!box) return;
  var g = HISTORIA_BOSQUE;
  var html = '<p class="muted" style="font-size:11px;line-height:1.55">' + g.intro + '</p>';
  html += g.eras.map(function (e, i) {
    return '<div class="menstrual-card" style="margin-top:10px' + (i === 0 ? ';border-color:var(--gold)' : '') + '">' +
      '<h4>' + esc(e.t) + '</h4>' +
      '<p class="muted" style="font-size:10px;margin:2px 0 6px">' + esc(e.cuando) + '</p>' +
      '<p style="font-size:12px;line-height:1.55">' + e.d + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' + e.sp.map(chip).join('') + '</div>' +
      '<p class="muted" style="font-size:11px;margin-top:6px">🔎 ' + e.hoy + '</p></div>';
  }).join('');
  html += '<p class="muted" style="font-size:10px;margin-top:8px">' + esc(g.fuentes) + '</p>';
  box.innerHTML = html;
  box.querySelectorAll('[data-bosque]').forEach(function (el) {
    el.onclick = function () {
      var inp = $('bosqueSpecies');
      if (inp) { inp.value = el.getAttribute('data-bosque'); try { inp.focus(); } catch (e) {} }
      try { switchBosqueTab('actual'); } catch (e) {}
    };
  });
}

function ecoCustomCard(r) {
  var cons = String(r.con || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  return '<div class="si-card" style="padding:8px 10px;border-color:#a9d18e55"><h4 style="font-size:12px">' + esc(r.icon || '🌱') + ' ' + esc(r.nombre) +
    ' <span class="chip" style="font-size:9px;background:#a9d18e22;color:#a9d18e;border-color:#a9d18e55">mía</span></h4>' +
    (r.cient ? '<p class="muted" style="font-size:10px">' + esc(r.cient) + '</p>' : '') +
    (r.rol ? '<p style="font-size:11px">' + esc(r.rol) + '</p>' : '') +
    (cons.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px"><span class="muted" style="font-size:10px">Acompaña a:</span>' + cons.map(chipAcompan).join('') + '</div>' : '') +
    '<div style="display:flex;gap:6px;margin-top:6px"><button type="button" class="btn" data-ecodel="' + r.id + '" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Borrar</button></div></div>';
}
function ecoAddForm(clave) {
  return '<details style="border:1px dashed var(--gold);border-radius:10px;padding:8px 10px;margin-top:8px"><summary style="cursor:pointer;font-size:12px;color:var(--gold)"><b>➕ Agregar especie en este grupo</b></summary>' +
    '<div class="conv-row" style="margin-top:8px"><label style="flex:2">Nombre * <input type="text" id="ecoN-' + clave + '" placeholder="ej: Loica, Palito, Murta" maxlength="40"></label>' +
    '<label>Icono <input type="text" id="ecoI-' + clave + '" placeholder="🌱" maxlength="4" style="width:60px;text-align:center"></label></div>' +
    '<label>Nombre científico (opcional) <input type="text" id="ecoC-' + clave + '" placeholder="ej: Sturnella loyca" maxlength="50"></label>' +
    '<label>Qué hace / rol <input type="text" id="ecoR-' + clave + '" placeholder="ej: Canta al amanecer y come semillas" maxlength="120"></label>' +
    '<label>Acompaña a (separa con comas) <input type="text" id="ecoW-' + clave + '" placeholder="ej: Maqui, Quebradas" maxlength="80"></label>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" class="btn btn-accent" data-ecoadd="' + clave + '" style="width:auto">+ Guardar especie</button></div></details>';
}
function renderAcompan() {
  var box = $('bosqueAcompanPanel');
  if (!box) return;
  var g = ACOMPANANTES;
  var customs = getEcoCustom();
  var html = '<p class="muted" style="font-size:11px;line-height:1.55">' + g.intro + '</p>';
  html += g.grupos.map(function (gr) {
    var items = gr.items.map(function (it) {
      return '<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">' + esc(it.n) + '</h4>' +
        '<p style="font-size:11px">' + esc(it.r) + '</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px"><span class="muted" style="font-size:10px">Acompaña a:</span>' +
        it.con.map(chipAcompan).join('') + '</div></div>';
    }).join('');
    var mias = customs.filter(function (x) { return x.grupo === gr.clave; }).map(ecoCustomCard).join('');
    var nBase = gr.items.length, nMias = customs.filter(function (x) { return x.grupo === gr.clave; }).length;
    return '<div class="menstrual-card" style="margin-top:10px"><h4>' + esc(gr.t) + ' <span class="muted" style="font-size:11px">· ' + nBase + (nMias ? ' + <b>' + nMias + ' mías</b>' : '') + '</span></h4>' +
      '<p class="muted" style="font-size:11px">' + gr.d + '</p>' + items + mias + ecoAddForm(gr.clave) +
      '<p class="muted" style="font-size:11px;margin-top:6px">💡 ' + gr.nota + '</p></div>';
  }).join('');
  html += '<div class="menstrual-card" style="margin-top:10px;border-color:var(--gold)"><p style="font-size:12px">' + g.cierre + '</p>' +
    '<div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="acompanGoAves" class="btn" style="width:auto">🦅 Ir a Aves</button></div></div>';
  box.innerHTML = html;
  box.querySelectorAll('[data-bosque]').forEach(function (el) {
    el.onclick = function () {
      var inp = $('bosqueSpecies');
      if (inp) { inp.value = el.getAttribute('data-bosque'); try { inp.focus(); } catch (e) {} }
      try { switchBosqueTab('actual'); } catch (e) {}
    };
  });
  box.querySelectorAll('[data-ecoadd]').forEach(function (btn) {
    btn.onclick = function () {
      var k = btn.getAttribute('data-ecoadd');
      var nEl = $('ecoN-' + k), iEl = $('ecoI-' + k), cEl = $('ecoC-' + k), rEl = $('ecoR-' + k), wEl = $('ecoW-' + k);
      var r = ecoAddRecord(k, {
        nombre: nEl ? nEl.value : '', icon: iEl ? iEl.value : '',
        cient: cEl ? cEl.value : '', rol: rEl ? rEl.value : '', con: wEl ? wEl.value : ''
      });
      if (!r) { alert('Ponle nombre a la especie'); return; }
      renderAcompan();
    };
  });
  box.querySelectorAll('[data-ecodel]').forEach(function (btn) {
    btn.onclick = function () {
      if (!confirm('¿Borrar tu especie?')) return;
      ecoDelRecord(btn.getAttribute('data-ecodel'));
      renderAcompan();
    };
  });
  var ga = $('acompanGoAves');
  if (ga) ga.onclick = function () {
    try { var d = $('bosqueDialog'); if (d) d.close(); } catch (e) {}
    setTimeout(function () { try { $('btnBirds').click(); } catch (e2) {} }, 150);
  };
}
function chipAcompan(nombre) {
  var enCat = false;
  try {
    var cat = (typeof BOSQUE_CATALOG !== 'undefined') ? BOSQUE_CATALOG : ((window.pencoData || {}).BOSQUE_NATIVO_PENCO || []);
    enCat = cat.some(function (b) { return b.nombre === nombre; });
  } catch (e) {}
  if (enCat) return '<span class="chip chip-bosque" data-bosque="' + esc(nombre) + '" style="cursor:pointer" title="Toca para cargarla en el formulario">🌿 ' + esc(nombre) + '</span>';
  return '<span class="chip" style="font-size:10px;opacity:.8">' + esc(nombre) + '</span>';
}

var bosqueTab = 'actual';
function switchBosqueTab(t) {
  bosqueTab = t;
  var tA = $('tabBosqueActual'), tH = $('tabBosqueHistoria'), tC = $('tabBosqueAcompan');
  if (tA) tA.classList.toggle('btn-accent', t === 'actual');
  if (tH) tH.classList.toggle('btn-accent', t === 'historia');
  if (tC) tC.classList.toggle('btn-accent', t === 'acompan');
  var pA = $('bosqueActualPanel'), pH = $('bosqueHistoriaPanel'), pC = $('bosqueAcompanPanel');
  if (pA) pA.classList.toggle('hidden', t !== 'actual');
  if (pH) pH.classList.toggle('hidden', t !== 'historia');
  if (pC) pC.classList.toggle('hidden', t !== 'acompan');
  if (t === 'historia') renderBosqueHistoria();
  if (t === 'acompan') renderAcompan();
}

/* ---------- Mejoras de la pestaña Bosque hoy (sin tocar renderer.js) ----------
   Envuelve renderBosqueDialog: tras el render original agrega (1) tarjeta de
   resumen con estadísticas de tu bitácora + destacados de la estación con
   especies tocables, y (2) un filtro de búsqueda en el catálogo. */
function estacionBosqueHoy() {
  try {
    if (typeof currentView !== 'undefined' && currentView && currentView.tipo !== 'dft' && typeof MOONS !== 'undefined')
      return MOONS[currentView.luna - 1].estacion;
  } catch (e) {}
  var m = new Date().getMonth();
  return (m === 5 || m === 6 || m === 7) ? 'PUKEM' : (m === 8 || m === 9 || m === 10) ? 'PEWU' : (m === 11 || m === 0 || m === 1) ? 'WALUNG' : 'RIMU';
}
function mejorarBosqueHoy() {
  /* 1) resumen + destacados al final de la tarjeta de hoy */
  var todayBox = $('bosqueTodayBox');
  if (todayBox && !$('bosqueHoyPlus')) {
    var entries = [];
    try { entries = getBosqueData().entries || []; } catch (e) {}
    var plant = entries.filter(function (x) { return x.action === 'plantación'; }).length;
    var spp = {};
    entries.forEach(function (x) { var s = String(x.species || '').trim().toLowerCase(); if (s) spp[s] = 1; });
    var est = estacionBosqueHoy();
    var dest = DESTACADOS_ESTACION[est] || DESTACADOS_ESTACION.PUKEM;
    var div = document.createElement('div');
    div.id = 'bosqueHoyPlus';
    div.innerHTML =
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
      '<span class="chip">📓 ' + entries.length + ' registros</span>' +
      '<span class="chip">🌱 ' + plant + ' plantaciones</span>' +
      '<span class="chip">🌿 ' + Object.keys(spp).length + ' especies distintas</span></div>' +
      '<div class="menstrual-card" style="margin-top:8px;background:var(--panel)"><h4 style="font-size:11px;color:var(--gold)">⭐ Destacado: ' + esc(dest.t) + '</h4>' +
      '<p class="muted" style="font-size:11px">' + esc(dest.d) + '</p>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
      dest.sp.map(function (n) { return '<span class="chip chip-bosque" data-bosque="' + esc(n) + '" style="cursor:pointer" title="Toca para cargarla en el formulario">🌿 ' + esc(n) + '</span>'; }).join('') +
      '</div><div class="dlg-actions" style="justify-content:flex-start;margin-top:6px">' +
      '<button type="button" id="bhoyGoForm" class="btn" style="width:auto;font-size:11px">📓 Ir a la bitácora</button>' +
      '<button type="button" id="bhoyGoHist" class="btn" style="width:auto;font-size:11px">📜 Ver historia</button></div></div>';
    todayBox.appendChild(div);
    div.querySelectorAll('[data-bosque]').forEach(function (el) {
      el.onclick = function () {
        var inp = $('bosqueSpecies');
        if (inp) { inp.value = el.getAttribute('data-bosque'); try { inp.focus(); } catch (e) {} }
      };
    });
    var gf = $('bhoyGoForm');
    if (gf) gf.onclick = function () { try { var f = $('bosqueDate'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} };
    var gh = $('bhoyGoHist');
    if (gh) gh.onclick = function () { try { switchBosqueTab('historia'); } catch (e) {} };
  }
  /* 2) filtro de búsqueda en el catálogo */
  var catBox = $('bosqueCatalogBox');
  if (catBox && !$('bosqueCatFilter')) {
    var row = document.createElement('div');
    row.innerHTML = '<input type="text" id="bosqueCatFilter" placeholder="🔍 Filtrar especies... (ej: fruto, quebra, melifero)" autocomplete="off" value="' + esc(bosqueCatQ) + '" style="margin-bottom:6px">';
    catBox.insertBefore(row, catBox.firstChild);
    var inp = $('bosqueCatFilter');
    var aplicar = function () {
      bosqueCatQ = (inp.value || '').toLowerCase();
      catBox.querySelectorAll('.fishing-species-item').forEach(function (it) {
        it.style.display = (!bosqueCatQ || it.textContent.toLowerCase().indexOf(bosqueCatQ) >= 0) ? '' : 'none';
      });
    };
    inp.addEventListener('input', aplicar);
    if (bosqueCatQ) aplicar();
  }
}

function setupBosqueHistoria() {
  if (!$('bosqueDialog') || !$('tabBosqueHistoria')) {
    window._bhistRetry = (window._bhistRetry || 0) + 1;
    if (window._bhistRetry < 60) setTimeout(setupBosqueHistoria, 500);
    return;
  }
  try {
    var btn = $('btnBosque');
    if (btn && btn.dataset && btn.dataset.keywords && btn.dataset.keywords.indexOf('historia') < 0)
      btn.dataset.keywords += ' historia bosque tiempo especies gondwana refugio keule queule hualo roble olivillo plantacion pino eucalipto restauracion relicto monumento ley nativo';
  } catch (e) {}
  var tA = $('tabBosqueActual'), tH = $('tabBosqueHistoria'), tC = $('tabBosqueAcompan');
  if (tA && !tA.dataset.w) { tA.dataset.w = '1'; tA.onclick = function () { switchBosqueTab('actual'); }; }
  if (tH && !tH.dataset.w) { tH.dataset.w = '1'; tH.onclick = function () { switchBosqueTab('historia'); }; }
  if (tC && !tC.dataset.w) { tC.dataset.w = '1'; tC.onclick = function () { switchBosqueTab('acompan'); }; }
  try {
    var _bk = $('btnBosque');
    if (_bk && _bk.dataset && _bk.dataset.keywords && _bk.dataset.keywords.indexOf('micorriza') < 0)
      _bk.dataset.keywords += ' acompanantes micorriza sotobosque picaflor dispersor quintral quila diguene changle loyo hongos red polinizador zorzal tenca chucao semilla';
  } catch (e) {}
  try {
    if (typeof renderBosqueDialog === 'function' && !window._bhoyWrapped) {
      window._bhoyWrapped = true;
      var origB = renderBosqueDialog;
      renderBosqueDialog = function () {
        var r = origB.apply(this, arguments);
        try { mejorarBosqueHoy(); } catch (e) {}
        return r;
      };
    }
  } catch (e) {}
  try { renderAcompan(); } catch (e) {}
  var b = $('btnBosque');
  if (b && !b.dataset.bhistW) {
    b.dataset.bhistW = '1';
    b.addEventListener('click', function () { try { switchBosqueTab('actual'); } catch (e) {} });
  }
  try { renderBosqueHistoria(); } catch (e) {}
}

window.BosqueHistoria = { render: renderBosqueHistoria, renderAcompan: renderAcompan, data: HISTORIA_BOSQUE, acompan: ACOMPANANTES, tab: switchBosqueTab, ecoAdd: ecoAddRecord, ecoDel: ecoDelRecord, ecoList: getEcoCustom };
setTimeout(setupBosqueHistoria, 600);

})();
