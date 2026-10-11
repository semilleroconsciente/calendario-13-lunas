// core-themes.js — extraído de renderer.js (núcleo compartido, scope top-level).
// THEMES + aplicar/selector. Carga diferida antes de renderer.js (ver index.html).
// === TEMAS DE COLORES ===
const THEMES = {
  auto: { label: 'Auto — según luna' },
  noche: { label: 'Noche — azul profundo' },
  claro: { label: 'Claro — día luminoso' },
  bosque: { label: 'Bosque — verde pewü' },
  oceano: { label: 'Océano — celeste pukem' },
  atardecer: { label: 'Atardecer — cálido rimü' },
  medianoche: { label: 'Medianoche — negro' }
};
function getTheme() {
  const t = (DATA.config && DATA.config.theme) || 'auto';
  return THEMES[t] ? t : 'auto';
}
function applyTheme(theme) {
  if (theme === 'auto') {
    document.body.removeAttribute('data-theme');
    // reaplica tema estacional de la vista actual
    if (currentView && currentView.tipo === 'dft') document.body.dataset.tema = 'RIMU';
    else if (currentView && currentView.tipo === 'luna' && MOONS[currentView.luna-1]) document.body.dataset.tema = MOONS[currentView.luna-1].estacion;
  } else {
    document.body.setAttribute('data-theme', theme);
  }
  // actualizar meta theme-color para navegador móvil
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = { noche:'#0b1026', claro:'#f4f1e8', bosque:'#0e1a12', oceano:'#0a1a2a', atardecer:'#1a120e', medianoche:'#050508', auto:'#0b1026' };
    meta.content = colors[theme] || colors.auto;
  }
  const sel = $('themeSel');
  if (sel && sel.value !== theme) sel.value = theme;
  const cfg = $('cfgThemeSel');
  if (cfg && cfg.value !== theme) cfg.value = theme;
}
function setupThemeSelector() {
  const sel = $('themeSel');
  if (!sel) return;
  sel.value = getTheme();
  sel.onchange = () => {
    const v = sel.value;
    DATA.config = DATA.config || {};
    DATA.config.theme = v;
    scheduleSave();
    applyTheme(v);
  };
}
