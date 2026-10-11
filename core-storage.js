// core-storage.js — extraído de renderer.js (núcleo compartido, scope top-level).
// scheduleSave (guardado diferido). Carga diferida antes de renderer.js (ver index.html).
function scheduleSave(msg) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    let ok = false;
    try { ok = await window.api.saveData(JSON.stringify(DATA)); } catch (e) { ok = false; }
    // ok===false: el borde rechazo el guardado (disco lleno, dato malformado).
    // No decir "Guardado" en ese caso: el archivo anterior sigue intacto.
    $('statusMsg').textContent = ok ? (msg || 'Guardado ✓') : '⚠ No se pudo guardar (reintenta; tus datos anteriores siguen intactos)';
    setTimeout(() => { $('statusMsg').textContent = ''; }, ok ? 1800 : 5000);
  }, 400);
}
