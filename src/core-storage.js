// core-storage.js — extraído de renderer.js (núcleo compartido, scope top-level).
// scheduleSave (guardado diferido), cola serializada de escrituras y borrado
// coordinado de perfiles. Carga diferida antes de renderer.js (ver index.html).
// msg==='' o opts.silent=true => guarda igual pero sin mostrar "Guardado" (ej. abrir/cerrar categorías).

// Cola de escrituras: una sola operación en vuelo. Dos guardados rápidos ya no
// pueden terminar fuera de orden y dejar persistido un estado anterior.
let _saveChain = Promise.resolve();
let _saveSeq = 0;

function _guardadoBloqueado() {
  return (typeof window !== 'undefined') && window.cal13NoGuardar === true;
}

function _mensajePersistencia(ok, msg) {
  const estado = (typeof window !== 'undefined' && window.api && window.api.lastSaveState) || null;
  if (!ok) {
    return { tipo: 'error', texto: '⚠ No se pudo guardar (reintenta; tus datos anteriores siguen intactos)' };
  }
  if (estado && estado.temporal) {
    return { tipo: 'temporal', texto: '⚠ Solo en memoria: no cierres la app, riesgo de pérdida' };
  }
  if (estado && estado.degradado) {
    return { tipo: 'degradado', texto: 'Guardado con almacenamiento alternativo (limitado)' };
  }
  return { tipo: 'persistido', texto: msg || 'Guardado ✓' };
}

function _pintarEstado(mensaje, silencioso) {
  const el = (typeof $ === 'function') ? $('statusMsg') : null;
  if (!el) return;
  // En guardados silenciosos no molestamos con el caso normal/degradado; sí
  // avisamos cuando no hay persistencia durable.
  if (silencioso && mensaje.tipo === 'persistido') return;
  if (silencioso && mensaje.tipo === 'degradado') return;
  el.textContent = mensaje.texto;
  const ms = (mensaje.tipo === 'persistido') ? 1800 : 5000;
  setTimeout(() => { el.textContent = ''; }, ms);
}

function _guardarSnapshot(snapshot) {
  _saveChain = _saveChain.then(async () => {
    let ok = false;
    try {
      var payload = snapshot;
      try {
        if (window.cal13cifrado && window.cal13cifrado.hayClave && window.cal13cifrado.hayClave() && !window.cal13cifrado.esCifrado(payload)) {
          payload = await window.cal13cifrado.cifrarTexto(window.cal13cifrado.clave(), payload);
        }
      } catch (e2) { return false; }
      ok = await window.api.saveData(payload);
    } catch (e) { ok = false; }
    return ok;
  }).catch(() => false);
  return _saveChain;
}

function scheduleSave(msg, opts) {
  if (_guardadoBloqueado()) return false;
  clearTimeout(saveTimer);
  const seq = ++_saveSeq;
  saveTimer = setTimeout(async () => {
    // La instantánea se toma al ejecutar, no al programar: refleja el último
    // estado lógico. La cola garantiza que no haya dos escrituras a la vez.
    let snapshot;
    try { snapshot = JSON.stringify(DATA); } catch (e) { return; }
    const ok = await _guardarSnapshot(snapshot);
    if (seq !== _saveSeq) return; // llegó un guardado más nuevo mientras tanto
    _pintarEstado(_mensajePersistencia(ok, msg), (msg === '') || (opts && opts.silent));
  }, 400);
}

// Guardado inmediato y verificable (lo usan importaciones/restauraciones que
// necesitan confirmar persistencia antes de informar éxito).
async function saveNow(msg, opts) {
  if (_guardadoBloqueado()) {
    _pintarEstado({ tipo: 'error', texto: '⚠ Guardado bloqueado: no se pudieron leer los datos existentes' }, false);
    return false;
  }
  clearTimeout(saveTimer);
  const seq = ++_saveSeq;
  let snapshot;
  try { snapshot = JSON.stringify(DATA); } catch (e) { return false; }
  const ok = await _guardarSnapshot(snapshot);
  if (seq === _saveSeq) _pintarEstado(_mensajePersistencia(ok, msg), (msg === '') || (opts && opts.silent));
  return ok;
}
try { window.cal13saveNow = saveNow; } catch (e) {}

// Borrado coordinado de un perfil: datos principales, registros del store de
// bitácoras y espejos en localStorage. Devuelve {ok, fallos, motivo}.
// Se guarda primero la desaparición del perfil; si eso falla, se revierte en
// memoria y NO se tocan sus bitácoras (evita pérdida de datos por un fallo).
async function eliminarPerfil(id, data) {
  id = String(id || '');
  if (!id || !data || !Array.isArray(data.usuarios)) return { ok: false, motivo: 'datos' };
  if (data.usuarios.length <= 1) return { ok: false, motivo: 'ultimo-perfil' };
  const usuario = data.usuarios.find((x) => x.id === id);
  if (!usuario) return { ok: false, motivo: 'no-existe' };

  const usuariosPrevios = data.usuarios;
  const notasPrevias = data.notas ? data.notas[id] : undefined;
  const actualPrevio = data.actual;

  data.usuarios = data.usuarios.filter((x) => x.id !== id);
  if (data.notas) delete data.notas[id];
  if (data.actual === id) data.actual = data.usuarios[0].id;

  let guardado = false;
  try { guardado = await window.api.saveData(JSON.stringify(data)); } catch (e) { guardado = false; }
  if (!guardado) {
    data.usuarios = usuariosPrevios;
    if (notasPrevias !== undefined) data.notas[id] = notasPrevias;
    data.actual = actualPrevio;
    return { ok: false, motivo: 'guardado' };
  }

  const fallos = [];
  // 1) Registros del store (fuente primaria de las bitácoras migradas).
  try {
    if (window.cal13idb && window.cal13idb.bitacorasListar) {
      const lista = await window.cal13idb.bitacorasListar();
      for (const rec of lista) {
        if (String(rec.id).indexOf(id + ':') !== 0) continue;
        const r = await window.cal13idb.bitacoraBorrar(rec.id);
        if (!r || !r.ok) fallos.push('idb:' + rec.id);
      }
    }
  } catch (e) { fallos.push('idb:listar'); }

  // 2) Espejos en localStorage (también cubre registros no listados por IDB).
  try {
    const prefijo = 'cal13-bit:' + id + ':';
    const claves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(prefijo) === 0) claves.push(k);
    }
    claves.forEach((k) => {
      try { localStorage.removeItem(k); } catch (e) { fallos.push('ls:' + k); }
    });
  } catch (e) {}

  // 3) Verificación: el perfil no debe reaparecer al releer.
  try {
    const leido = JSON.parse(await window.api.loadData() || '{}');
    if (leido.notas && leido.notas[id]) fallos.push('notas');
    if (Array.isArray(leido.usuarios) && leido.usuarios.some((x) => x.id === id)) fallos.push('usuarios');
  } catch (e) { fallos.push('verificacion'); }

  return { ok: fallos.length === 0, fallos, motivo: fallos.length ? 'parcial' : 'ok' };
}
try { window.cal13perfiles = { eliminarPerfil }; } catch (e) {}
