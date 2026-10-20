// core-bootstrap.js — extraído de renderer.js (núcleo compartido, scope top-level).
// estado global ($, DATA, ciclo, vista) + hideBootSplash. Carga diferida antes de renderer.js (ver index.html).
let DATA = {};
let CYCLE_YEARS = [];
let cycle = null;
let currentView = { tipo: 'luna', luna: 1 };
let phaseMap = {};
let saveTimer = null;

const $ = id => document.getElementById(id);
function hideBootSplash() {
  try {
    window.__calReady = true;
    const sp = document.getElementById('bootSplash');
    if (!sp) return;
    sp.classList.add('done');
    setTimeout(() => { try { sp.remove(); } catch {} }, 400);
  } catch {}
}
