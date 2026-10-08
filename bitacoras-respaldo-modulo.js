/* ============================================================
   BITÁCORAS INDEPENDIENTES + RESPALDO INDIVIDUAL
   Calendario 13 Lunas — Mari Küla Küyen
   ------------------------------------------------------------
   - Cada bitácora vive en su propia clave (o grupo de claves)
     dentro de userData() del usuario actual. Operar sobre una
     NUNCA toca las demás (independencia garantizada: exportar,
     importar y borrar solo leen/escriben sus claves).
   - Respaldo individual: cada bitácora se exporta/importa en
     su propio archivo JSON:
       { app, tipo:'bitacora-individual', grupo, titulo,
         usuario:{id,nombre}, fecha, datos:{ clave: valor } }
   - El botón 📥 Restaurar general (renderer.js) también acepta
     este formato y lo fusiona sin borrar el resto.
   Patrón del proyecto: botón inyectado en Comunidad > App +
   <dialog> propio + registro en ALL_BTNS/PRESETS.
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
function todayStamp() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function curUser() {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return null;
    return u;
  } catch (e) { return null; }
}
function curUserMeta() {
  try {
    var id = (typeof DATA !== 'undefined' && DATA.actual) ? DATA.actual : 'u1';
    var nombre = id;
    if (typeof DATA !== 'undefined' && Array.isArray(DATA.usuarios)) {
      var f = DATA.usuarios.filter(function (x) { return x.id === id; })[0];
      if (f && f.nombre) nombre = f.nombre;
    }
    return { id: String(id), nombre: String(nombre) };
  } catch (e) { return { id: 'u1', nombre: 'Principal' }; }
}
function doSave(msg) {
  try { if (typeof scheduleSave === 'function') { scheduleSave(msg || 'Guardado ✓'); return; } } catch (e) {}
  try {
    if (typeof DATA !== 'undefined' && window.api && window.api.saveData) {
      window.api.saveData(JSON.stringify(DATA));
    }
  } catch (e) {}
}

/* ---------- REGISTRO: cada bitácora = grupo de claves ----------
   keys: claves exactas dentro de userData(). Si un módulo guarda
   varias claves, van juntas en el mismo grupo para no partirlo. */
var GROUPS = [
  { id: 'calendario', titulo: '📅 Calendario principal (notas y agenda)', keys: ['cycles'] },
  { id: 'pesca', titulo: '🎣 Bitácora de pesca', keys: ['fishingLog', 'fishingCustom'] },
  { id: 'aves', titulo: '🦅 Bitácora de aves', keys: ['birds', 'birdsCustom'] },
  { id: 'intermareal', titulo: '🦀 Bitácora intermareal', keys: ['intermareal', 'interCustom'] },
  { id: 'bosque', titulo: '🌳 Bitácora bosque nativo', keys: ['bosque', 'bosqueCustom'] },
  { id: 'flora', titulo: '🌸 Bitácora flora / jardín', keys: ['flora', 'floraCustom', 'floraLinks'] },
  { id: 'anfibios', titulo: '🐸 Bitácora anfibios', keys: ['anfibios'] },
  { id: 'apicola', titulo: '🐝 Bitácora apícola (meli)', keys: ['meliLog', 'meliCustom'] },
  { id: 'ballenas', titulo: '🐋 Bitácora ballenas', keys: ['ballenaLog'] },
  { id: 'hongos', titulo: '🍄 Bitácora hongos / senderos / kayak', keys: ['hongoLog', 'senderoLog', 'kayakLog', 'kayakCheck', 'captaCfg', 'fuegoCheck'] },
  { id: 'menstrual', titulo: '🌸 Ciclo menstrual', keys: ['menstrual'] },
  { id: 'suenos', titulo: '💭 Diario de sueños', keys: ['suenosLog'] },
  { id: 'meditacion', titulo: '🧘 Bitácora meditación / respiración', keys: ['meditaLog', 'breathLog', 'transicionLog'] },
  { id: 'gratitud', titulo: '🙏 Gratitud / hábitos / disciplina', keys: ['gratitudLog', 'habitosCfg', 'disciplinaLog'] },
  { id: 'salud', titulo: '💊 Salud (síntomas, medicación, agua)', keys: ['medicLog', 'pesoLog', 'aguaCfg', 'lluviaLog', 'riosLog', 'aguaRiegoLog', 'aguaCasaLog', 'aguaCalLog'] },
  { id: 'huerta', titulo: '🌱 Huerta / siembra / compost', keys: ['huerta', 'siembraLog', 'compostLog', 'forrajeLog', 'forrajeEspecies', 'semillasInv', 'bodega', 'trafkintu'] },
  { id: 'hidroponia', titulo: '💧 Hidroponía', keys: ['hidroponia'] },
  { id: 'electrocultura', titulo: '⚡ Electrocultura', keys: ['electrocultura'] },
  { id: 'plantas', titulo: '🌿 Lawen / Plantas medicinales', keys: ['plantas', 'lawenUser'] },
  { id: 'taller', titulo: '🔧 Bitácora Taller', keys: ['tallerLog'] },
  { id: 'mecanica', titulo: '🚲 Bitácora Mecánica (vehículos)', keys: ['mecanica'] },
  { id: 'domotica', titulo: '🏠 Domótica (bitácora hogar)', keys: ['domotica'] },
  { id: 'electronica', titulo: '🔌 Electrónica (bitácora reparaciones)', keys: ['electronica'] },
  { id: 'herramientas', titulo: '🛠️ Herramientas', keys: ['herramientas'] },
  { id: 'despensa', titulo: '🥫 Despensa / Closet', keys: ['despensa', 'closet'] },
  { id: 'corral', titulo: '🐔 Corral / Movilidad / Escolar', keys: ['corral', 'movilidadPenco', 'escolarPenco'] },
  { id: 'biblioteca', titulo: '📚 Biblioteca hogar', keys: ['biblioteca'] },
  { id: 'fengshui', titulo: '☯️ Feng Shui hogar', keys: ['fengShui'] },
  { id: 'cuerpo-luna', titulo: '🌙 Cuerpo y luna (pelo, rituales, fenología)', keys: ['peloLunar', 'ritualesSalud', 'fenologia'] },
  { id: 'natacion', titulo: '🏊 Natación (mi bitácora)', keys: ['natacion'] },
  { id: 'convivencia', titulo: '🏘️ Convivencia vecinal (bitácora privada)', keys: ['convivencia'] },
  { id: 'red', titulo: '🤝 Red comunitaria (mis nodos)', keys: ['redcomunitaria'] },
  { id: 'ciberseguridad', titulo: '🛡️ Ciberseguridad (bitácora privada)', keys: ['ciber'] },
  { id: 'opensource', titulo: '🌐 Código abierto (chequeo y aportes)', keys: ['opensource'] },
  { id: 'crianza', titulo: '🧒 Bitácora de crianza', keys: ['crianzaLog', 'crianzaAmb', 'milDiasHitos', 'milCrec', 'milAcomp', 'milBebe', 'milDiasFUR', 'milDiasNac'] },
  { id: 'duelo', titulo: '🕯️ Duelo (memorias, velas, hitos)', keys: ['dueloPersonas', 'dueloFecha', 'dueloCheck', 'dueloMemorias', 'dueloVelas', 'dueloHitosDone', 'dueloRitComp'] },
  { id: 'linaje', titulo: '🌳 Linaje (árbol, cartas, recap)', keys: ['arbolFull', 'arbolLunar', 'arbolCartas', 'arbolVelas', 'recapInventario', 'recapSesiones', 'recapLineaVida'] },
  { id: 'psicologia', titulo: '🧠 Psicología / Neurodiversidad', keys: ['psicologia'] },
  { id: 'adicciones', titulo: '🌱 Adicciones (seguimiento)', keys: ['adicciones'] },
  { id: 'adolescencia', titulo: '🌱 Adolescencia / Etapas de vida', keys: ['adolescencia', 'etapasVida'] },
  { id: 'eneagrama', titulo: '🔷 Eneagrama / Cuarto camino / VIA', keys: ['eneagrama', 'cuartoCamino', 'via'] },
  { id: 'espiritual', titulo: '✨ Prácticas (ikigai, tao, tolteca, estoicismo...)', keys: ['ikigai', 'tao', 'tolteca', 'estoicismo', 'hooponopono', 'silva', 'grabovoi', 'vigyan', 'constel', 'kinMayaData', 'tarot', 'oraculo', 'matematicas'] },
  { id: 'juegos', titulo: '♟️ Juegos (ajedrez, sudoku, crucigrama, sopa)', keys: ['ajedrezPartidas', 'ajedrezStats', 'sudokuHistory', 'sudokuCurrent', 'sudokuStats', 'cruciHistory', 'cruciCurrent', 'cruciStats', 'sopaHistory', 'sopaCurrent', 'sopaStats'] },
  { id: 'territorio', titulo: '🗺️ Territorio Penco (relatos, sectores, trueque...)', keys: ['pencoSectorRelatos', 'truequeLog', 'mingaLog', 'nudosMios', 'nudosPract', 'epewMios', 'fertiLog', 'fertiMeta', 'derechosLog', 'deberesCheck', 'rolesHogar', 'acuerdosFam', 'ritualesFam', 'voluntades', 'mapaAnioTxt', 'saberes', 'circulos', 'tesoros', 'nombresLunares', 'vozAbuelos', 'buenVivir', 'rutinaCfg'] },
  { id: 'penco-servicios', titulo: '🏛️ Penco servicios (muni, bomberos, iglesias...)', keys: ['muniPenco', 'bomberosPenco', 'iglesiasPenco', 'apoyoPenco', 'actores', 'negociosPenco', 'monedaSocial', 'talleresPenco'] }
];

/* Claves que NO son bitácoras (config global, no por bitácora) */
var SKIP_KEYS = { cycles: false };

function knownKeys() {
  var s = {};
  GROUPS.forEach(function (g) { (g.keys || []).forEach(function (k) { s[k] = true; }); });
  return s;
}

/* Bitácoras no listadas arriba (módulos nuevos): aparecen solas
   para que ninguna quede sin respaldo individual. */
function extraGroups() {
  var out = [];
  try {
    var u = curUser();
    if (!u) return out;
    var known = knownKeys();
    Object.keys(u).forEach(function (k) {
      if (known[k]) return;
      if (k === 'cycles') return;
      var v = u[k];
      if (v === undefined) return;
      out.push({ id: 'key:' + k, titulo: '📓 ' + k, keys: [k], auto: true });
    });
  } catch (e) {}
  return out;
}

function allGroups() { return GROUPS.concat(extraGroups()); }
function findGroup(id) {
  var all = allGroups();
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

/* Conteo genérico: nº de registros dentro de las claves del grupo */
function countVal(v) {
  if (v == null) return 0;
  if (Array.isArray(v)) return v.length;
  if (typeof v !== 'object') return v === '' ? 0 : 1;
  var n = 0;
  if (Array.isArray(v.entries)) return v.entries.length;
  if (Array.isArray(v.registros)) n += v.registros.length;
  if (Array.isArray(v.incidentes)) n += v.incidentes.length;
  if (Array.isArray(v.acuerdos)) n += v.acuerdos.length;
  if (Array.isArray(v.log)) n += v.log.length;
  Object.keys(v).forEach(function (k) {
    var x = v[k];
    if (Array.isArray(x)) n += x.length;
    else if (x && typeof x === 'object') {
      if (Array.isArray(x.entries)) n += x.entries.length;
      else {
        var ks = Object.keys(x);
        if (ks.length && k !== 'checks' && k !== 'hechos') {
          if (k === 'cycles' || k === 'moons' || k === 'days') {
            try {
              var days = 0;
              Object.keys(x).forEach(function (ck) {
                var c = x[ck];
                Object.keys((c && c.moons) || {}).forEach(function (mk) {
                  days += Object.keys(((c.moons[mk] || {}).days) || {}).length;
                });
              });
              n += days;
            } catch (e) {}
          }
        }
      }
    } else if (typeof x === 'string' && x) {
      if (k === 'nota' || k === 'monthNote') n += 1;
    }
  });
  if (n === 0) {
    var ks2 = Object.keys(v);
    var hasContent = ks2.some(function (k) {
      var x = v[k];
      return x !== undefined && x !== null && x !== '' && !(Array.isArray(x) && !x.length);
    });
    return hasContent ? 1 : 0;
  }
  return n;
}

function countGroup(g) {
  try {
    var u = curUser();
    if (!u) return 0;
    var n = 0, found = false;
    (g.keys || []).forEach(function (k) {
      if (u[k] !== undefined) { found = true; n += countVal(u[k]); }
    });
    if (!found) return 0;
    return n;
  } catch (e) { return 0; }
}

/* ---------- EXPORTAR: solo sus claves ---------- */
function buildPayload(g) {
  var u = curUser();
  var meta = curUserMeta();
  var datos = {};
  (g.keys || []).forEach(function (k) {
    if (u && u[k] !== undefined) {
      try { datos[k] = JSON.parse(JSON.stringify(u[k])); }
      catch (e) { datos[k] = u[k]; }
    }
  });
  return {
    app: 'calendario-13-lunas',
    tipo: 'bitacora-individual',
    version: 1,
    grupo: g.id,
    titulo: g.titulo,
    claves: g.keys,
    usuario: meta,
    fecha: todayStamp(),
    datos: datos
  };
}

function fileNameFor(g) {
  var meta = curUserMeta();
  var safeU = String(meta.nombre || meta.id || 'usuario').toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-').slice(0, 24) || 'usuario';
  var safeG = String(g.id).replace(/^key:/, '').replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 32) || 'bitacora';
  return 'bitacora-' + safeG + '-' + safeU + '-' + todayStamp() + '.json';
}

async function downloadJSON(obj, fileName) {
  var json = JSON.stringify(obj, null, 1);
  try {
    if (window.api && window.api.backupSave) {
      var r = await window.api.backupSave(json, fileName);
      return r ? true : false;
    }
  } catch (e) {}
  try {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { try { a.remove(); } catch (e2) {} }, 500);
    return true;
  } catch (e) { return false; }
}

async function exportGroup(id) {
  var g = findGroup(id);
  if (!g) { alert('Bitácora no encontrada'); return false; }
  var p = buildPayload(g);
  var n = countGroup(g);
  if (!Object.keys(p.datos).length || n === 0) {
    if (!confirm('«' + g.titulo + '» está vacía. ¿Exportar igual (archivo vacío)?')) return false;
  }
  var ok = await downloadJSON(p, fileNameFor(g));
  try {
    var st = $('bitStatus');
    if (st) {
      st.textContent = ok ? ('💾 ' + g.titulo + ' exportada ✓ (' + n + ' registros)') : 'Exportación cancelada';
      setTimeout(function () { st.textContent = ''; }, 2600);
    } else if ($('statusMsg')) {
      $('statusMsg').textContent = ok ? 'Bitácora exportada ✓' : 'Cancelado';
      setTimeout(function () { $('statusMsg').textContent = ''; }, 2200);
    }
  } catch (e) {}
  return !!ok;
}

/* ---------- IMPORTAR: solo sus claves, resto intacto ---------- */
function validatePayload(d, g) {
  if (!d || typeof d !== 'object') throw new Error('formato');
  if (d.tipo !== 'bitacora-individual') throw new Error('no-es-bitacora-individual');
  if (!d.datos || typeof d.datos !== 'object') throw new Error('sin-datos');
  var size = JSON.stringify(d).length;
  if (size > 5 * 1024 * 1024) throw new Error('muy-grande (máx 5 MB)');
  if (g && d.grupo && d.grupo !== g.id && g.id.indexOf('key:') !== 0) throw new Error('grupo-distinto');
  return true;
}

async function applyPayload(d) {
  var g = findGroup(d.grupo) || { id: d.grupo, titulo: d.titulo || d.grupo, keys: d.claves || Object.keys(d.datos || {}) };
  validatePayload(d, g);
  var u = curUser();
  if (!u) throw new Error('sin-usuario');
  /* Independencia: solo se escriben las claves de ESTA bitácora */
  var keysToWrite = (g.keys || []).length ? g.keys : Object.keys(d.datos);
  keysToWrite.forEach(function (k) {
    if (d.datos && d.datos[k] !== undefined) {
      try { u[k] = JSON.parse(JSON.stringify(d.datos[k])); }
      catch (e) { u[k] = d.datos[k]; }
    }
  });
  doSave('Bitácora importada ✓');
  try { refreshList(); } catch (e) {}
  return g;
}

async function importGroup(id) {
  var g = findGroup(id);
  if (!g) { alert('Bitácora no encontrada'); return false; }
  var j = null;
  try {
    if (window.api && window.api.backupOpen) j = await window.api.backupOpen();
    else {
      j = await new Promise(function (res) {
        var i = document.createElement('input');
        i.type = 'file'; i.accept = '.json,application/json';
        i.onchange = function () {
          var f = i.files[0];
          if (!f) return res(null);
          var r = new FileReader();
          r.onload = function () { res(r.result); };
          r.readAsText(f);
        };
        i.click();
      });
    }
  } catch (e) { j = null; }
  if (!j) return false;
  try {
    var d = JSON.parse(j);
    /* Acepta también respaldo TOTAL antiguo: extrae solo este grupo */
    if (d && d.tipo !== 'bitacora-individual' && d.usuarios && d.notas) {
      var uid = curUserMeta().id;
      var srcUid = (d.actual && d.notas[d.actual]) ? d.actual
        : (d.notas[uid] ? uid : Object.keys(d.notas)[0]);
      var src = d.notas[srcUid] || {};
      var sub = { app: 'calendario-13-lunas', tipo: 'bitacora-individual', version: 1, grupo: g.id, titulo: g.titulo, claves: g.keys, usuario: curUserMeta(), fecha: todayStamp(), datos: {} };
      (g.keys || []).forEach(function (k) { if (src[k] !== undefined) sub.datos[k] = src[k]; });
      if (!Object.keys(sub.datos).length) { alert('Ese respaldo total no trae datos de «' + g.titulo + '»'); return false; }
      d = sub;
    }
    if (d.grupo && d.grupo !== g.id) {
      if (!confirm('El archivo es de «' + (d.titulo || d.grupo) + '» y estás en «' + g.titulo + '».\n¿Importarlo igual (solo sus claves, sin tocar esta bitácora)?')) return false;
      var gg = findGroup(d.grupo);
      if (gg) { await applyPayload(d); alert('✅ «' + (d.titulo || d.grupo) + '» importada (' + countGroup(gg) + ' registros). Las demás bitácoras no se tocaron.'); return true; }
      await applyPayload(d);
      alert('✅ Bitácora importada. Las demás no se tocaron.');
      return true;
    }
    if (!confirm('Importar «' + g.titulo + '» desde archivo?\nSe REEMPLAZA solo esta bitácora. Las demás quedan intactas.')) return false;
    await applyPayload(d);
    alert('✅ «' + g.titulo + '» importada. Las demás bitácoras no se tocaron.');
    return true;
  } catch (e) {
    console.warn('Import bitacora error', e);
    alert('Archivo no válido para bitácora: ' + (e && e.message || e));
    return false;
  }
}

function clearGroup(id) {
  var g = findGroup(id);
  if (!g) return;
  var n = countGroup(g);
  if (!n) { alert('«' + g.titulo + '» ya está vacía'); return; }
  if (!confirm('¿Borrar SOLO «' + g.titulo + '» (' + n + ' registros)?\nLas demás bitácoras quedan intactas. Consejo: exporta primero.')) return;
  try {
    var u = curUser();
    (g.keys || []).forEach(function (k) {
      if (u[k] === undefined) return;
      if (Array.isArray(u[k])) u[k] = [];
      else if (u[k] && typeof u[k] === 'object') {
        if (Array.isArray(u[k].entries)) u[k] = { entries: [] };
        else {
          var empty = Array.isArray(u[k]) ? [] : {};
          u[k] = empty;
        }
      } else u[k] = Array.isArray(u[k]) ? [] : undefined;
      if (u[k] === undefined) { try { delete u[k]; } catch (e) {} }
    });
    doSave('Bitácora borrada (solo esa) ✓');
    refreshList();
  } catch (e) { alert('No se pudo borrar: ' + e); }
}

/* API global: la usa renderer.js (Restaurar general) y QR */
window.applyBitacoraJSON = async function (jsonStr) {
  try {
    var d = JSON.parse(jsonStr);
    if (!d || d.tipo !== 'bitacora-individual') return false;
    await applyPayload(d);
    try {
      if ($('statusMsg')) {
        $('statusMsg').textContent = 'Bitácora «' + (d.titulo || d.grupo) + '» restaurada ✓ (las demás intactas)';
        setTimeout(function () { $('statusMsg').textContent = ''; }, 2600);
      }
    } catch (e) {}
    return true;
  } catch (e) { return false; }
};

window.Bitacoras = {
  groups: GROUPS,
  all: allGroups,
  count: countGroup,
  exportar: exportGroup,
  importar: importGroup,
  borrar: clearGroup,
  fileNameFor: fileNameFor
};

/* ---------- UI ---------- */
function injectCSS() {
  if ($('bitacorasCSS')) return;
  var st = document.createElement('style');
  st.id = 'bitacorasCSS';
  st.textContent =
    '#bitacorasDialog{width:620px;max-width:96vw;max-height:88vh;overflow-y:auto}' +
    '#bitacorasDialog .bit-row{display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin:6px 0;flex-wrap:wrap}' +
    '#bitacorasDialog .bit-name{flex:1 1 180px;font-size:13px;line-height:1.4}' +
    '#bitacorasDialog .bit-count{font-size:11px;color:var(--muted);white-space:nowrap}' +
    '#bitacorasDialog .bit-btns{display:flex;gap:6px;flex-wrap:wrap}' +
    '#bitacorasDialog .bit-btns .btn{width:auto;font-size:11px;padding:4px 8px}' +
    '#bitacorasDialog .bit-tools{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}';
  document.head.appendChild(st);
}

var dlg = null;
function buildDialog() {
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.id = 'bitacorasDialog';
  dlg.innerHTML =
    '<form method="dialog">' +
      '<div class="dlg-actions" style="justify-content:space-between;margin-bottom:6px">' +
        '<h3 style="margin:0;color:var(--accent)">📓 Bitácoras independientes</h3>' +
        '<button type="button" id="bitCloseTop" class="btn btn-icon" title="Cerrar" aria-label="Cerrar">✕</button>' +
      '</div>' +
      '<p class="muted" style="line-height:1.5">Cada bitácora es <b>independiente</b>: tiene sus propios datos y su propio archivo de respaldo. ' +
      'Exportar, importar o borrar una <b>no toca a las demás</b>. Usuario actual: <b id="bitUser">—</b></p>' +
      '<div class="bit-tools">' +
        '<input type="search" id="bitFilter" placeholder="🔎 filtrar bitácora..." style="flex:1;min-width:160px" aria-label="Filtrar bitácoras">' +
      '</div>' +
      '<div id="bitList"></div>' +
      '<p id="bitStatus" class="muted" style="min-height:18px;font-size:12px"></p>' +
      '<div class="dlg-actions"><button type="button" id="bitClose" class="btn">Cerrar</button></div>' +
    '</form>';
  document.body.appendChild(dlg);
  $('bitCloseTop').onclick = function () { try { dlg.close(); } catch (e) {} };
  $('bitClose').onclick = function () { try { dlg.close(); } catch (e) {} };
  $('bitFilter').oninput = function () { refreshList($('bitFilter').value); };
  return dlg;
}

function refreshList(filter) {
  var box = $('bitList');
  if (!box) return;
  var meta = curUserMeta();
  var bu = $('bitUser');
  if (bu) bu.textContent = meta.nombre + ' (' + countTotal() + ' registros en total)';
  var q = String(filter || ($('bitFilter') && $('bitFilter').value) || '').toLowerCase().trim();
  box.innerHTML = '';
  allGroups().forEach(function (g) {
    var n = countGroup(g);
    if (q && (g.titulo + ' ' + g.id).toLowerCase().indexOf(q) < 0) return;
    var row = document.createElement('div');
    row.className = 'bit-row';
    var dot = n ? '🟢' : '⚪';
    row.innerHTML =
      '<div class="bit-name">' + esc(g.titulo) + '<br><span class="bit-count">' + dot + ' ' + n + ' registro(s) · claves: ' + esc((g.keys || []).join(', ')) + '</span></div>' +
      '<div class="bit-btns">' +
        '<button type="button" class="btn" data-act="exp" title="Guardar esta bitácora en su propio archivo JSON">💾 Exportar</button>' +
        '<button type="button" class="btn" data-act="imp" title="Cargar archivo de esta bitácora (solo ella se reemplaza)">📥 Importar</button>' +
        '<button type="button" class="btn" data-act="del" title="Vaciar solo esta bitácora">🗑</button>' +
      '</div>';
    row.querySelector('[data-act="exp"]').onclick = function () { exportGroup(g.id); };
    row.querySelector('[data-act="imp"]').onclick = async function () { await importGroup(g.id); refreshList(); };
    row.querySelector('[data-act="del"]').onclick = function () { clearGroup(g.id); };
    box.appendChild(row);
  });
  if (!box.children.length) box.innerHTML = '<p class="muted">Sin coincidencias.</p>';
}

function countTotal() {
  var n = 0;
  try { allGroups().forEach(function (g) { n += countGroup(g); }); } catch (e) {}
  return n;
}

function openDlg() {
  injectCSS();
  buildDialog();
  refreshList('');
  try { if (dlg.showModal) dlg.showModal(); else dlg.show(); }
  catch (e) { try { dlg.setAttribute('open', ''); } catch (e2) {} }
}

function injectBtn() {
  if ($('btnBitacoras')) return $('btnBitacoras');
  var g = document.querySelector('.action-group[data-group="comunidad"] .group-btns');
  if (!g) return null;
  var b = document.createElement('button');
  b.id = 'btnBitacoras'; b.className = 'btn'; b.type = 'button';
  b.textContent = '📓 Bitácoras';
  b.setAttribute('data-sub', 'app');
  b.setAttribute('data-keywords', 'bitacora bitacoras respaldo individual exportar importar independiente borrar');
  var ref = $('btnRestore');
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling); else g.appendChild(b);
  } else g.appendChild(b);
  b.onclick = openDlg;
  return b;
}

function injectConfigChk() {
  try {
    if (document.querySelector('#configDialog input[data-btn="btnBitacoras"]')) return;
    var ref = document.querySelector('#configDialog input[data-btn="btnRestore"]');
    if (!ref) return;
    var lab = document.createElement('label');
    lab.className = 'check-row';
    lab.innerHTML = '<input type="checkbox" data-btn="btnBitacoras" checked> 📓 Bitácoras';
    var refLab = ref.closest ? ref.closest('label') : ref.parentNode;
    refLab.parentNode.insertBefore(lab, refLab.nextSibling);
  } catch (e) {}
}

function registerBtn() {
  var id = 'btnBitacoras';
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (p && typeof p === 'object' && p.btnBackup && p[id] === undefined) p[id] = true;
      });
    }
  } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}

var _tries = 0;
function init() {
  if (!document.querySelector('.action-group[data-group]')) { if (_tries++ < 40) setTimeout(init, 500); return; }
  injectCSS();
  injectBtn();
  injectConfigChk();
  registerBtn();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
