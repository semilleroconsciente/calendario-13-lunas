/* ============================================================
   TERRITORIO LOADER — Calendario 13 Lunas
   ------------------------------------------------------------
   Separa DATOS de LOGICA: toda la informacion especifica de un
   territorio (Penco por defecto) vive en archivos JSON bajo
   data/territorios/<id>/ y la app los lee dinamicamente.

   Estructura esperada (ver data/territorios/penco/):
     territorio.json
     lunas.json
     especies/aves.json | bosque.json | intermareal.json | flora.json
     historia/historia.json | sectores.json | guia.json
     historia/historia-bosque.json | companeros-bosque.json
     historia/aves-bosque.json | historia-aves.json | historia-pesca.json
      eventos.json | cultivos/asociaciones.json | cultivos/preparados.json
      talleres.json | consejos-bosque.json | municipalidad.json
      bomberos.json | apoyo-emergencia.json | actores.json

   Para replicar en otro territorio:
     1. Duplica data/territorios/penco -> data/territorios/<nuevo-id>
     2. Edita territorio.json (id, nombre, coordenadas, lugar)
        y los JSON de especies / historia / eventos.
     3. Agrega el id a data/territorios/index.json > disponibles.
     4. Abre la app con ?territorio=<nuevo-id>
        (queda guardado en localStorage 'territorioActual').

   Compatibilidad:
     - Corre DESPUES de data.js (usa sus const como fallback).
     - Si fetch falla (file:// restringido), usa los datos
       embebidos y la app sigue funcionando igual que antes.
     - Sincroniza window.pencoData (nombre historico) y muta
       en el lugar los globales const de data.js para que
       renderer.js y demas modulos vean los datos nuevos
       sin tener que reescribirlos.
   ============================================================ */
(function () {
'use strict';

var BASE = 'data/territorios/';
var LS_KEY = 'territorioActual';

function qs(name) {
  try {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(String(window.location.search || ''));
    return m ? decodeURIComponent(m[1]).replace(/[^a-z0-9_-]/gi, '').toLowerCase() : '';
  } catch (e) { return ''; }
}

function actualId(defecto) {
  var q = qs('territorio');
  if (q) { try { localStorage.setItem(LS_KEY, q); } catch (e) {} return q; }
  try {
    var ls = String(localStorage.getItem(LS_KEY) || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (ls) return ls;
  } catch (e) {}
  return defecto || 'penco';
}

async function cargarJSON(url) {
  var r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' en ' + url);
  return await r.json();
}

/* Resuelve un global const de data.js sin eval() (CSP fase 1).
   Esta funcion vive en scope top-level, donde los const de data.js
   (script clasico anterior) son visibles como identificadores.
   No mover dentro de cargarTerritorio: alli las `var` locales los
   sombrean y typeof devolveria el valor nuevo, no el global. */
function refDataJs(nombre) {
  try {
    switch (nombre) {
      case 'PENCO': return typeof PENCO !== 'undefined' ? PENCO : undefined;
      case 'ESTACIONES': return typeof ESTACIONES !== 'undefined' ? ESTACIONES : undefined;
      case 'MOONS': return typeof MOONS !== 'undefined' ? MOONS : undefined;
      case 'DFT': return typeof DFT !== 'undefined' ? DFT : undefined;
      case 'INTRO': return typeof INTRO !== 'undefined' ? INTRO : undefined;
      case 'MOODS': return typeof MOODS !== 'undefined' ? MOODS : undefined;
      case 'EFEMERIDES': return typeof EFEMERIDES !== 'undefined' ? EFEMERIDES : undefined;
      case 'SIEMBRA': return typeof SIEMBRA !== 'undefined' ? SIEMBRA : undefined;
      case 'SIEMBRA_LUNAS': return typeof SIEMBRA_LUNAS !== 'undefined' ? SIEMBRA_LUNAS : undefined;
      case 'DONATE': return typeof DONATE !== 'undefined' ? DONATE : undefined;
      case 'AVES_PENCO': return typeof AVES_PENCO !== 'undefined' ? AVES_PENCO : undefined;
      case 'EVENTOS_ASTRONOMICOS': return typeof EVENTOS_ASTRONOMICOS !== 'undefined' ? EVENTOS_ASTRONOMICOS : undefined;
      case 'EVENTOS_COMUNA_PENCO': return typeof EVENTOS_COMUNA_PENCO !== 'undefined' ? EVENTOS_COMUNA_PENCO : undefined;
      case 'ASOCIACIONES_CULTIVOS': return typeof ASOCIACIONES_CULTIVOS !== 'undefined' ? ASOCIACIONES_CULTIVOS : undefined;
      case 'PREPARADOS_ORGANICOS': return typeof PREPARADOS_ORGANICOS !== 'undefined' ? PREPARADOS_ORGANICOS : undefined;
      case 'INTERMAREAL_PENCO': return typeof INTERMAREAL_PENCO !== 'undefined' ? INTERMAREAL_PENCO : undefined;
      case 'BOSQUE_NATIVO_PENCO': return typeof BOSQUE_NATIVO_PENCO !== 'undefined' ? BOSQUE_NATIVO_PENCO : undefined;
      case 'CONSEJOS_INTERMAREAL': return typeof CONSEJOS_INTERMAREAL !== 'undefined' ? CONSEJOS_INTERMAREAL : undefined;
      case 'CONSEJOS_BOSQUE': return typeof CONSEJOS_BOSQUE !== 'undefined' ? CONSEJOS_BOSQUE : undefined;
      default: return undefined;
    }
  } catch (e) { return undefined; }
}

/* Mutar globales const de data.js en el lugar (const no se puede
   reasignar, pero si se puede vaciar/rellenar el mismo objeto).
   CSP fase 1: sin eval() — la referencia se resuelve via refDataJs(). */
function mutarEnElLugar(nombre, valor) {
  if (valor === undefined) return false;
  try {
    var ref = refDataJs(nombre);
    if (ref === undefined) ref = window[nombre];
    if (Array.isArray(valor) && Array.isArray(ref)) {
      ref.length = 0;
      valor.forEach(function (v) { ref.push(v); });
      return true;
    }
    if (valor && typeof valor === 'object' && ref && typeof ref === 'object' && !Array.isArray(ref)) {
      Object.keys(ref).forEach(function (k) { delete ref[k]; });
      Object.keys(valor).forEach(function (k) { ref[k] = valor[k]; });
      return true;
    }
  } catch (e) {}
  // Si no existia el global, exponerlo en window para futuros typeof
  try { window[nombre] = valor; return true; } catch (e2) {}
  return false;
}

function snapshotFallback() {
  // Foto de los datos embebidos (data.js) por si fetch falla.
  // Sin eval (CSP): typeof es seguro ante identificadores no declarados.
  // (Scope top-level: sin sombreado local, ver refDataJs.)
  return {
    PENCO: typeof PENCO !== 'undefined' ? PENCO : window.PENCO,
    ESTACIONES: typeof ESTACIONES !== 'undefined' ? ESTACIONES : window.ESTACIONES,
    MOONS: typeof MOONS !== 'undefined' ? MOONS : window.MOONS,
    DFT: typeof DFT !== 'undefined' ? DFT : window.DFT,
    INTRO: typeof INTRO !== 'undefined' ? INTRO : window.INTRO,
    MOODS: typeof MOODS !== 'undefined' ? MOODS : window.MOODS,
    EFEMERIDES: typeof EFEMERIDES !== 'undefined' ? EFEMERIDES : window.EFEMERIDES,
    SIEMBRA: typeof SIEMBRA !== 'undefined' ? SIEMBRA : window.SIEMBRA,
    SIEMBRA_LUNAS: typeof SIEMBRA_LUNAS !== 'undefined' ? SIEMBRA_LUNAS : window.SIEMBRA_LUNAS,
    DONATE: typeof DONATE !== 'undefined' ? DONATE : window.DONATE,
    AVES_PENCO: typeof AVES_PENCO !== 'undefined' ? AVES_PENCO : window.AVES_PENCO,
    EVENTOS_ASTRONOMICOS: typeof EVENTOS_ASTRONOMICOS !== 'undefined' ? EVENTOS_ASTRONOMICOS : window.EVENTOS_ASTRONOMICOS,
    EVENTOS_COMUNA_PENCO: typeof EVENTOS_COMUNA_PENCO !== 'undefined' ? EVENTOS_COMUNA_PENCO : window.EVENTOS_COMUNA_PENCO,
    ASOCIACIONES_CULTIVOS: typeof ASOCIACIONES_CULTIVOS !== 'undefined' ? ASOCIACIONES_CULTIVOS : window.ASOCIACIONES_CULTIVOS,
    PREPARADOS_ORGANICOS: typeof PREPARADOS_ORGANICOS !== 'undefined' ? PREPARADOS_ORGANICOS : window.PREPARADOS_ORGANICOS,
    INTERMAREAL_PENCO: typeof INTERMAREAL_PENCO !== 'undefined' ? INTERMAREAL_PENCO : window.INTERMAREAL_PENCO,
    BOSQUE_NATIVO_PENCO: typeof BOSQUE_NATIVO_PENCO !== 'undefined' ? BOSQUE_NATIVO_PENCO : window.BOSQUE_NATIVO_PENCO,
    CONSEJOS_INTERMAREAL: typeof CONSEJOS_INTERMAREAL !== 'undefined' ? CONSEJOS_INTERMAREAL : window.CONSEJOS_INTERMAREAL,
    CONSEJOS_BOSQUE: typeof CONSEJOS_BOSQUE !== 'undefined' ? CONSEJOS_BOSQUE : window.CONSEJOS_BOSQUE
  };
}

async function cargarTerritorio(id) {
  var root = BASE + id + '/';
  var T = {
    id: id,
    root: root,
    meta: null,
    datos: {},
    origen: {} // 'json' | 'fallback' por clave, util para debug
  };

  // 1) indice para saber el default (no bloquea si falla)
  var defecto = 'penco';
  try {
    var idx = await cargarJSON(BASE + 'index.json');
    if (idx && idx.default) defecto = String(idx.default);
  } catch (e) {}

  // 2) archivos del territorio (cada uno opcional: si falta, fallback)
  async function opt(rel) {
    try { return await cargarJSON(root + rel); }
    catch (e) { return undefined; }
  }
  var fb = snapshotFallback();
  var meta = (await opt('territorio.json')) || {};
  var lunas = (await opt('lunas.json')) || {};
  var aves = await opt('especies/aves.json');
  var bosque = await opt('especies/bosque.json');
  var inter = await opt('especies/intermareal.json');
  var flora = await opt('especies/flora.json');
  var historia = await opt('historia/historia.json');
  var sectores = await opt('historia/sectores.json');
  var guia = await opt('historia/guia.json');
  var histBosque = await opt('historia/historia-bosque.json');
  var compBosque = await opt('historia/companeros-bosque.json');
  var avesBosque = await opt('historia/aves-bosque.json');
  var histAves = await opt('historia/historia-aves.json');
  var histPesca = await opt('historia/historia-pesca.json');
  var eventos = await opt('eventos.json');
  var asoc = await opt('cultivos/asociaciones.json');
  var prep = await opt('cultivos/preparados.json');
  var talleres = await opt('talleres.json');
  var muni = await opt('municipalidad.json');
  var bomb = await opt('bomberos.json');
  var apoyo = await opt('apoyo-emergencia.json');
  var consBosque = await opt('consejos-bosque.json');
  var actores = await opt('actores.json');

  // 3) normalizar con fallback a data.js
  function conOrigen(clave, valJson, valFb) {
    if (valJson !== undefined) { T.origen[clave] = 'json'; return valJson; }
    T.origen[clave] = 'fallback';
    return valFb;
  }

  var PENCO = conOrigen('PENCO', meta.coordenadas, fb.PENCO);
  var INTRO = conOrigen('INTRO', meta.intro, fb.INTRO);
  var ESTACIONES = conOrigen('ESTACIONES', lunas.estaciones, fb.ESTACIONES);
  var MOONS = conOrigen('MOONS', lunas.lunas, fb.MOONS);
  var DFT = conOrigen('DFT', lunas.dft, fb.DFT);
  var SIEMBRA = conOrigen('SIEMBRA', lunas.siembraFases, fb.SIEMBRA);
  var SIEMBRA_LUNAS = conOrigen('SIEMBRA_LUNAS', lunas.siembraLunas, fb.SIEMBRA_LUNAS);
  var EFEMERIDES = conOrigen('EFEMERIDES', lunas.efemeridesLocales, fb.EFEMERIDES);
  var MOODS = conOrigen('MOODS', lunas.animo, fb.MOODS);
  var AVES_PENCO = conOrigen('AVES_PENCO', aves, fb.AVES_PENCO);
  var BOSQUE_NATIVO_PENCO = conOrigen('BOSQUE_NATIVO_PENCO', bosque, fb.BOSQUE_NATIVO_PENCO);
  var INTERMAREAL_PENCO = conOrigen('INTERMAREAL_PENCO', inter && inter.especies !== undefined ? inter.especies : inter, fb.INTERMAREAL_PENCO);
  var CONSEJOS_INTERMAREAL = conOrigen('CONSEJOS_INTERMAREAL', inter && inter.consejos !== undefined ? inter.consejos : undefined, fb.CONSEJOS_INTERMAREAL);
  var CONSEJOS_BOSQUE = conOrigen('CONSEJOS_BOSQUE', consBosque, fb.CONSEJOS_BOSQUE);
  var EVENTOS_COMUNA = conOrigen('EVENTOS_COMUNA_PENCO', eventos && eventos.comuna !== undefined ? eventos.comuna : eventos, fb.EVENTOS_COMUNA_PENCO);
  var EVENTOS_ASTRO = conOrigen('EVENTOS_ASTRONOMICOS', eventos && eventos.astronomicos, fb.EVENTOS_ASTRONOMICOS);
  var ASOC = conOrigen('ASOCIACIONES_CULTIVOS', asoc, fb.ASOCIACIONES_CULTIVOS);
  var PREP = conOrigen('PREPARADOS_ORGANICOS', prep, fb.PREPARADOS_ORGANICOS);

  T.meta = {
    id: meta.id || id,
    nombre: meta.nombre || id,
    subtitulo: meta.subtitulo || '',
    region: meta.region || '',
    lugar: meta.lugar || ((INTRO && INTRO.lugar) || ''),
    descripcion: meta.descripcion || '',
    defectoIndice: defecto
  };

  T.datos = {
    territorio: T.meta,
    coordenadas: PENCO,
    intro: INTRO,
    estaciones: ESTACIONES,
    lunas: MOONS,
    dft: DFT,
    siembraFases: SIEMBRA,
    siembraLunas: SIEMBRA_LUNAS,
    efemerides: EFEMERIDES,
    animos: MOODS,
    aves: AVES_PENCO,
    bosque: BOSQUE_NATIVO_PENCO,
    intermareal: INTERMAREAL_PENCO,
    consejosIntermareal: CONSEJOS_INTERMAREAL,
    consejosBosque: CONSEJOS_BOSQUE,
    flora: flora || null, // {intro, especies, links}
    guia: guia || null,
    sectores: sectores || null,
    historia: historia || null,
    historiaBosque: histBosque || null,
    companerosBosque: compBosque || null,
    avesBosque: avesBosque || null,
    historiaAves: histAves || null,
    historiaPesca: histPesca || null,
    eventosComuna: EVENTOS_COMUNA,
    eventosAstronomicos: EVENTOS_ASTRO,
    asociaciones: ASOC,
    preparados: PREP,
    talleres: talleres || { talleresBase: [], actividadesBase: [] },
    municipalidad: muni || null,
    bomberos: bomb || null,
    apoyo: apoyo || null,
    actores: actores || null,
    donate: fb.DONATE
  };

  // 4) compat: window.pencoData mantiene su nombre historico,
  //    pero ahora refleja el territorio activo.
  var pd = {
    PENCO: PENCO, ESTACIONES: ESTACIONES, MOONS: MOONS, DFT: DFT,
    INTRO: INTRO, MOODS: MOODS, EFEMERIDES: EFEMERIDES, SIEMBRA: SIEMBRA,
    SIEMBRA_LUNAS: SIEMBRA_LUNAS, DONATE: fb.DONATE,
    AVES_PENCO: AVES_PENCO, EVENTOS_ASTRONOMICOS: EVENTOS_ASTRO,
    EVENTOS_COMUNA_PENCO: EVENTOS_COMUNA,
    ASOCIACIONES_CULTIVOS: ASOC, PREPARADOS_ORGANICOS: PREP,
    INTERMAREAL_PENCO: INTERMAREAL_PENCO,
    BOSQUE_NATIVO_PENCO: BOSQUE_NATIVO_PENCO,
    CONSEJOS_INTERMAREAL: CONSEJOS_INTERMAREAL,
    CONSEJOS_BOSQUE: CONSEJOS_BOSQUE
  };
  window.pencoData = pd;

  // 5) mutar globales const de data.js en el lugar
  mutarEnElLugar('PENCO', PENCO);
  mutarEnElLugar('ESTACIONES', ESTACIONES);
  mutarEnElLugar('MOONS', MOONS);
  mutarEnElLugar('DFT', DFT);
  mutarEnElLugar('INTRO', INTRO);
  mutarEnElLugar('MOODS', MOODS);
  mutarEnElLugar('EFEMERIDES', EFEMERIDES);
  mutarEnElLugar('SIEMBRA', SIEMBRA);
  mutarEnElLugar('SIEMBRA_LUNAS', SIEMBRA_LUNAS);
  mutarEnElLugar('AVES_PENCO', AVES_PENCO);
  mutarEnElLugar('EVENTOS_ASTRONOMICOS', EVENTOS_ASTRO);
  mutarEnElLugar('EVENTOS_COMUNA_PENCO', EVENTOS_COMUNA);
  mutarEnElLugar('ASOCIACIONES_CULTIVOS', ASOC);
  mutarEnElLugar('PREPARADOS_ORGANICOS', PREP);
  mutarEnElLugar('INTERMAREAL_PENCO', INTERMAREAL_PENCO);
  mutarEnElLugar('BOSQUE_NATIVO_PENCO', BOSQUE_NATIVO_PENCO);
  mutarEnElLugar('CONSEJOS_INTERMAREAL', CONSEJOS_INTERMAREAL);
  mutarEnElLugar('CONSEJOS_BOSQUE', CONSEJOS_BOSQUE);

  return T;
}

var idInicial = 'penco';
try {
  // default rapido; se corrige con index.json dentro de cargarTerritorio
  idInicial = actualId('penco');
} catch (e) {}

var api = {
  id: idInicial,
  datos: null,
  meta: null,
  listo: null,
  get: function (clave, defecto) {
    try {
      if (api.datos && api.datos[clave] !== undefined && api.datos[clave] !== null) return api.datos[clave];
    } catch (e) {}
    return defecto;
  },
  cambiar: function (nuevoId) {
    nuevoId = String(nuevoId || '').toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'penco';
    try { localStorage.setItem(LS_KEY, nuevoId); } catch (e) {}
    window.location.search = '?territorio=' + encodeURIComponent(nuevoId);
  }
};

api.listo = cargarTerritorio(idInicial).then(function (T) {
  api.datos = T.datos;
  api.meta = T.meta;
  api.id = T.id;
  api.origen = T.origen;
  try {
    document.dispatchEvent(new CustomEvent('territorio:listo', { detail: { id: T.id, meta: T.meta } }));
  } catch (e) {}
  // Re-render seguro: los dialogos leen window.pencoData / Territorio
  // en cada apertura, asi que no forzamos nada aqui.
  return T;
}).catch(function (err) {
  // Ultimo recurso: exponer fallback embebido para que la app no muera
  try {
    var fb = snapshotFallback();
    api.datos = {
      territorio: { id: idInicial, nombre: idInicial },
      coordenadas: fb.PENCO, intro: fb.INTRO, estaciones: fb.ESTACIONES,
      lunas: fb.MOONS, dft: fb.DFT, siembraFases: fb.SIEMBRA,
      siembraLunas: fb.SIEMBRA_LUNAS, efemerides: fb.EFEMERIDES,
      animos: fb.MOODS, aves: fb.AVES_PENCO, bosque: fb.BOSQUE_NATIVO_PENCO,
      intermareal: fb.INTERMAREAL_PENCO,
      consejosIntermareal: fb.CONSEJOS_INTERMAREAL,
      consejosBosque: fb.CONSEJOS_BOSQUE,
      flora: null, guia: null, sectores: null, historia: null,
      historiaBosque: null, companerosBosque: null, avesBosque: null,
      historiaAves: null, historiaPesca: null,
      eventosComuna: fb.EVENTOS_COMUNA_PENCO,
      eventosAstronomicos: fb.EVENTOS_ASTRONOMICOS,
      asociaciones: fb.ASOCIACIONES_CULTIVOS,
      preparados: fb.PREPARADOS_ORGANICOS,
      talleres: { talleresBase: [], actividadesBase: [] },
      municipalidad: null,
      bomberos: null,
      apoyo: null,
      actores: null,
      donate: fb.DONATE
    };
  } catch (e2) {}
  return null;
});

window.Territorio = api;

})();
