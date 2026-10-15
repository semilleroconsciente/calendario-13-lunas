// core-storage.js — extraído de renderer.js (núcleo compartido, scope top-level).
// scheduleSave (guardado diferido). Carga diferida antes de renderer.js (ver index.html).
// msg==='' o opts.silent=true => guarda igual pero sin mostrar "Guardado" (ej. abrir/cerrar categorías).
function scheduleSave(msg, opts) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    let ok = false;
    try { ok = await window.api.saveData(JSON.stringify(DATA)); } catch (e) { ok = false; }
    const silent = (msg === '') || (opts && opts.silent);
    if (silent) {
      // Guardado silencioso: solo avisa si falló (el archivo anterior sigue intacto).
      if (!ok) {
        $('statusMsg').textContent = '⚠ No se pudo guardar (reintenta; tus datos anteriores siguen intactos)';
        setTimeout(() => { $('statusMsg').textContent = ''; }, 5000);
      }
      return;
    }
    // ok===false: el borde rechazo el guardado (disco lleno, dato malformado).
    // No decir "Guardado" en ese caso: el archivo anterior sigue intacto.
    $('statusMsg').textContent = ok ? (msg || 'Guardado ✓') : '⚠ No se pudo guardar (reintenta; tus datos anteriores siguen intactos)';
    setTimeout(() => { $('statusMsg').textContent = ''; }, ok ? 1800 : 5000);
  }, 400);
}
