/* → core-bootstrap.js (extraído; misma scope global, defer previo en index.html) */

/* → core-audio.js (extraído; misma scope global, defer previo en index.html) */

// === ACCESIBILIDAD: texto alternativo en botones solo-icono ===
// Los botones que solo muestran un icono (✕, ✏️, 📤…) traen title;
// aquí se refleja como aria-label para lector de pantalla,
// incluyendo los que cada diálogo crea dinámicamente.
function a11yPatchIconButtons(scope){
  try{
    const root=scope||document;
    root.querySelectorAll('button[title]:not([aria-label])').forEach(b=>{ b.setAttribute('aria-label', b.getAttribute('title')); });
  }catch(e){}
}
try{
  a11yPatchIconButtons(document);
  const _a11yObs=new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes.forEach(n=>{
        if(!n||n.nodeType!==1) return;
        try{
          if(n.matches&&n.matches('button[title]:not([aria-label])')) n.setAttribute('aria-label', n.getAttribute('title'));
          if(n.querySelectorAll) n.querySelectorAll('button[title]:not([aria-label])').forEach(b=>{ b.setAttribute('aria-label', b.getAttribute('title')); });
        }catch(e2){}
      });
    });
  });
  _a11yObs.observe(document.body,{childList:true,subtree:true});
}catch(e){}

/* → core-themes.js (extraído; misma scope global, defer previo en index.html) */

// === 🏠 PANTALLA DE INICIO PERSONALIZABLE (⚙️ Personalizar) ===
// Guarda por usuario en DATA.config.home = { startView, blocks:{...} }
// v1.6.0: 34 bloques. Los 10 nuevos (pesca, bosque, aves, huerta, estudio,
// cuentos, familia, emergencia, comunidad, energia) son tarjetas-resumen con
// botón "Abrir" hacia su módulo. Cada perfil (👥 Perfiles) trae su propia
// pantalla de inicio (HOME_PRESETS): al tocar un perfil se aplican secciones
// visibles + vista inicial + bloques de ◉ Hoy. Luego puedes afinar a mano.
const HOME_BLOCKS_DEFAULT = { frase: true, solLuna: true, notas: true, agenda: true, habitos: true, rutinas: true, animo: true, suenos: true, comidas: true, tareas: true, compras: true, finanzas: true, disciplina: true, respiracion: true, ciclo: true, clima: true, mareas: true, gratitud: true, horario: true, entreno: true, medicina: true, siembra: true, espiritual: true, ritmo: true, ekadashi: true, pesca: true, bosque: true, aves: true, huerta: true, estudio: true, cuentos: true, familia: true, emergencia: true, comunidad: true, energia: true };
const HOME_VIEWS = ['auto', 'hoy', 'luna', 'semanaLunar', 'mes', 'semana', 'completa'];
// Pantalla de inicio sugerida por perfil (lista de bloques visibles + vista).
// 'todo' y 'adulto' muestran todo. El resto muestra lo esencial de su rol.
const HOME_PRESETS = {
  todo: { startView: 'auto', show: Object.keys(HOME_BLOCKS_DEFAULT) },
  esencial: { startView: 'hoy', show: ['frase','solLuna','notas','agenda','habitos','rutinas','animo','clima','mareas','gratitud','disciplina','respiracion','horario','emergencia','comunidad'] },
  adolescente: { startView: 'hoy', show: ['frase','solLuna','notas','agenda','habitos','rutinas','animo','suenos','estudio','cuentos','disciplina','respiracion','gratitud','horario','entreno','ciclo','clima','mareas','familia','energia','emergencia','comunidad'] },
  adulto: { startView: 'auto', show: Object.keys(HOME_BLOCKS_DEFAULT) },
  mayor: { startView: 'hoy', show: ['frase','solLuna','notas','agenda','habitos','rutinas','animo','suenos','comidas','tareas','compras','medicina','ciclo','clima','mareas','gratitud','espiritual','ritmo','familia','emergencia','energia','cuentos','comunidad'] },
  estudiante: { startView: 'hoy', show: ['frase','solLuna','notas','agenda','habitos','rutinas','animo','suenos','disciplina','horario','estudio','cuentos','gratitud','respiracion','finanzas','clima','energia','emergencia','comunidad'] },
  agricultor: { startView: 'luna', show: ['frase','solLuna','notas','agenda','rutinas','clima','mareas','siembra','huerta','bosque','aves','compras','finanzas','ritmo','ekadashi','comunidad','energia','tareas','emergencia'] },
  pescador: { startView: 'luna', show: ['frase','solLuna','notas','agenda','rutinas','clima','mareas','pesca','bosque','aves','ritmo','ekadashi','emergencia','comunidad','tareas','disciplina','respiracion','energia'] },
  salud: { startView: 'hoy', show: ['frase','solLuna','notas','agenda','habitos','rutinas','animo','suenos','comidas','disciplina','respiracion','ciclo','clima','gratitud','horario','entreno','medicina','espiritual','ritmo','energia','emergencia','familia','comunidad'] },
  deportista: { startView: 'hoy', show: ['frase','solLuna','notas','agenda','habitos','rutinas','animo','suenos','comidas','disciplina','entreno','medicina','clima','mareas','ritmo','energia','respiracion','gratitud','horario','emergencia','comunidad'] },
  docente: { startView: 'hoy', show: ['frase','solLuna','notas','agenda','habitos','rutinas','animo','estudio','cuentos','horario','familia','gratitud','clima','comunidad','siembra','huerta','disciplina','energia','emergencia'] }
};
function homeBlocksForPreset(name) {
  const p = HOME_PRESETS[name];
  if (!p) return null;
  const out = {};
  Object.keys(HOME_BLOCKS_DEFAULT).forEach(k => { out[k] = p.show.indexOf(k) >= 0; });
  return { startView: HOME_VIEWS.includes(p.startView) ? p.startView : 'auto', blocks: out };
}
function getHomeConfig() {
  const d = (DATA.config && DATA.config.home) || {};
  const blocks = Object.assign({}, HOME_BLOCKS_DEFAULT, d.blocks || {});
  const startView = HOME_VIEWS.includes(d.startView) ? d.startView : 'auto';
  return { startView, blocks };
}
function syncHomeConfigUI() {
  try {
    const home = getHomeConfig();
    const sel = $('cfgHomeView');
    if (sel) sel.value = home.startView;
    document.querySelectorAll('#configDialog input[data-home]').forEach(cb => {
      cb.checked = home.blocks[cb.dataset.home] !== false;
    });
  } catch (e) {}
}
function setupHomeConfig() {
  const sel = $('cfgHomeView');
  if (sel && !sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.onchange = () => {
      DATA.config = DATA.config || {};
      DATA.config.home = DATA.config.home || {};
      DATA.config.home.startView = HOME_VIEWS.includes(sel.value) ? sel.value : 'auto';
      try { if (typeof markPerfilPersonalizado === 'function') markPerfilPersonalizado(); } catch (e) {}
      scheduleSave('Pantalla de inicio guardada ✓');
    };
  }
  document.querySelectorAll('#configDialog input[data-home]').forEach(cb => {
    if (cb.dataset.homeBound) return;
    cb.dataset.homeBound = '1';
    cb.onchange = () => {
      DATA.config = DATA.config || {};
      DATA.config.home = DATA.config.home || {};
      DATA.config.home.blocks = DATA.config.home.blocks || {};
      DATA.config.home.blocks[cb.dataset.home] = cb.checked;
      try { if (typeof markPerfilPersonalizado === 'function') markPerfilPersonalizado(); } catch (e) {}
      scheduleSave('Pantalla de inicio guardada ✓');
      try { if (viewMode === 'hoy') renderTodayView(); } catch (e) {}
    };
  });
  const reset = $('cfgHomeReset');
  if (reset && !reset.dataset.bound) {
    reset.dataset.bound = '1';
    reset.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      DATA.config = DATA.config || {};
      DATA.config.home = DATA.config.home || {};
      DATA.config.home.blocks = Object.assign({}, HOME_BLOCKS_DEFAULT);
      try { if (typeof markPerfilPersonalizado === 'function') markPerfilPersonalizado(); } catch (e) {}
      scheduleSave('Pantalla de inicio guardada ✓');
      syncHomeConfigUI();
      try { if (viewMode === 'hoy') renderTodayView(); } catch (e2) {}
    };
  }
}
// === 👥 PERFIL ÚNICO (🏠 Pantalla de inicio manda: vista + bloques + secciones) ===
// Se guarda en DATA.config.perfil. Cualquier ajuste manual pasa a 'personalizado'.
function getPerfilGuardado() {
  try { return (DATA.config && DATA.config.perfil) || ''; } catch (e) { return ''; }
}
function detectPerfil() {
  try {
    const vis = getVisibleConfig();
    const home = getHomeConfig();
    const names = Object.keys(PRESETS);
    for (const n of names) {
      const preset = PRESETS[n] || {};
      const isAll = (n === 'todo' || n === 'adulto');
      let ok = true;
      for (const k of ALL_BTNS) {
        const want = isAll ? true : !!preset[k];
        if (!!vis[k] !== want) { ok = false; break; }
      }
      if (!ok) continue;
      const hp = (typeof homeBlocksForPreset === 'function') ? homeBlocksForPreset(n) : null;
      if (!hp) continue;
      if (home.startView !== hp.startView) continue;
      for (const k of Object.keys(HOME_BLOCKS_DEFAULT)) {
        if (!!home.blocks[k] !== !!hp.blocks[k]) { ok = false; break; }
      }
      if (ok) return n;
    }
  } catch (e) {}
  return 'personalizado';
}
function getPerfilActual() {
  const g = getPerfilGuardado();
  if (g && g !== 'personalizado') return g;
  return detectPerfil();
}
function syncPerfilUI() {
  try {
    const actual = getPerfilActual();
    const lbl = $('cfgPerfilActual');
    if (lbl) lbl.textContent = actual === 'personalizado' ? 'Personalizado ⚙️' : actual;
    document.querySelectorAll('#configDialog .config-preset').forEach(b => {
      b.classList.toggle('btn-accent', b.dataset.preset === actual);
    });
  } catch (e) {}
}
function markPerfilPersonalizado() {
  try {
    DATA.config = DATA.config || {};
    if (DATA.config.perfil !== 'personalizado') {
      DATA.config.perfil = 'personalizado';
      try { syncPerfilUI(); } catch (e) {}
    } else {
      try { syncPerfilUI(); } catch (e) {}
    }
  } catch (e) {}
}
// Aplica la vista inicial elegida por el usuario al abrir la app.
// 'auto' = Hoy en celular, Luna actual en PC. En PC la vista Hoy también se muestra si se elige.
function applyStartView(info) {
  const home = getHomeConfig();
  let target = home.startView;
  if (target === 'auto') target = isMobileWidth() ? 'hoy' : 'luna';
  if (target === 'hoy') {
    mobileSec = 'hoy'; viewMode = 'hoy'; renderCurrentView(); return true;
  }
  if (target === 'luna') {
    mobileSec = isMobileWidth() ? 'luna' : null;
    if (info && info.luna !== 'dft' && String(info.y) !== String(currentCycleYear())) {
      try { selectCycle(info.y, info.luna); } catch (e) { selectMoon(info.luna); }
    } else if (info && info.luna !== 'dft') { selectMoon(info.luna); }
    else if (currentView && currentView.tipo === 'luna') { renderCurrentView(); }
    syncMobileViewAttr(); paintMobileDock(); return true;
  }
  if (target === 'semanaLunar' || target === 'mes' || target === 'semana') {
    mobileSec = isMobileWidth() ? 'completa' : null;
    viewMode = target; viewDateMs = Date.now(); renderCurrentView(); return true;
  }
  if (target === 'completa') {
    mobileSec = isMobileWidth() ? 'completa' : null;
    viewMode = 'luna';
    try { if (info && info.luna !== 'dft') selectMoon(info.luna); } catch (e) {}
    syncMobileViewAttr(); paintMobileDock();
    renderCurrentView(); return true;
  }
  return false;
}

function defaultCycle() {
  return {
    moons: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [String(i + 1), { monthNote: '', days: {} }])),
    dft: { nota: '' }
  };
}

function userData() {
  if (!DATA.notas) DATA.notas = {};
  if (!DATA.notas[DATA.actual]) DATA.notas[DATA.actual] = { cycles: {} };
  if (!DATA.notas[DATA.actual].cycles) DATA.notas[DATA.actual].cycles = {};
  return DATA.notas[DATA.actual];
}

function cyc(year) {
  const key = String(year);
  const u = userData();
  if (!u.cycles[key]) u.cycles[key] = defaultCycle();
  return u.cycles[key];
}

function dayCell(lunaN, diaN) {
  const c = cyc(currentCycleYear());
  const m = c.moons[String(lunaN)];
  if (!m.days[diaN]) m.days[diaN] = { nota: '', animo: -1, agenda: [] };
  // migración agenda / limpiar campos legacy clima/marea
  if (!Array.isArray(m.days[diaN].agenda)) m.days[diaN].agenda = [];
  if (m.days[diaN].animo === undefined) m.days[diaN].animo = -1;
  if (m.days[diaN].foto !== undefined) delete m.days[diaN].foto;
  // si había nota legacy sin agenda, mantener nota pero no migrar auto (usuario decide)
  // limpiar campos obsoletos si existen sin perder agenda
  if (m.days[diaN].clima !== undefined) delete m.days[diaN].clima;
  if (m.days[diaN].alta !== undefined) delete m.days[diaN].alta;
  if (m.days[diaN].baja !== undefined) delete m.days[diaN].baja;
  return m.days[diaN];
}

function currentCycleYear() { return cycle.year; }

/* → core-storage.js (extraído; misma scope global, defer previo en index.html) */

function todayInfo() {
  // Rápido: ubica el día por aritmética (1-2 formatos Intl en vez de ~2500).
  // Antes recorría 7 ciclos × 365 días formateando cada fecha (lento en PC).
  const nowMs = Date.now();
  const nowKey = cal.fmtKey.format(new Date(nowMs));
  for (const y of CYCLE_YEARS) {
    const c = cal.buildCycle(y);
    if (nowMs < c.start - 86400000 || nowMs > c.start + 366 * 86400000) continue;
    const idx = Math.floor((nowMs - c.start) / 86400000);
    for (let k = Math.max(0, idx - 2); k <= Math.min(c.days.length - 1, idx + 2); k++) {
      const d = c.days[k];
      if (cal.fmtKey.format(new Date(d.noonMs)) === nowKey) return { y, ...d };
    }
  }
  return null;
}
/* → core-bootstrap.js (extraído; misma scope global, defer previo en index.html) */

function buildSidebar() {
  const userSel = $('userSel');
  userSel.innerHTML = '';
  for (const u of DATA.usuarios) {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.nombre;
    userSel.appendChild(opt);
  }
  userSel.value = DATA.actual;
  userSel.onchange = () => {
    DATA.actual = userSel.value;
    scheduleSave();
    selectCycle(currentCycleYear(), currentView.tipo === 'dft' ? 'dft' : currentView.luna);
  };

  const sel = $('cycleSel');
  sel.innerHTML = '';
  for (const y of CYCLE_YEARS) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = `${y} → ${y + 1}`;
    sel.appendChild(opt);
  }
  sel.value = String(currentCycleYear());
  sel.onchange = () => selectCycle(+sel.value, currentView.luna);

  const nav = $('moonNav');
  nav.innerHTML = '';
  MOONS.forEach(m => {
    const b = document.createElement('button');
    b.className = 'moon-btn';
    b.innerHTML = `<span class="num">${m.n}</span>${m.nombre}<span class="nm">${m.traduccion}</span>`;
    b.onclick = () => selectMoon(m.n);
    nav.appendChild(b);
  });
  const dftBtn = document.createElement('button');
  dftBtn.className = 'moon-btn dft';
  dftBtn.innerHTML = '<span class="num">✷</span>Día Fuera del Tiempo<span class="nm">20 jun · víspera del We Tripantu</span>';
  dftBtn.onclick = () => selectDFT();
  nav.appendChild(dftBtn);
}

function markActiveNav(tipo, luna) {
  document.querySelectorAll('.moon-btn').forEach((b, i) => {
    const idx = i < MOONS.length ? i + 1 : 'dft';
    b.classList.toggle('active', tipo === 'dft' ? idx === 'dft' : idx === luna);
  });
}

function selectCycle(year, keepLuna) {
  cycle = cal.buildCycle(year);
  phaseMap = cal.phasesByDay(cycle.start, cycle.start + 365 * 86400000);
  buildSidebar();
  if (keepLuna === 'dft') selectDFT();
  else selectMoon(keepLuna || 1);
}

function selectMoon(n) {
  currentView = { tipo: 'luna', luna: n };
  viewMode = 'luna';
  updateViewButtons();
  markActiveNav('luna', n);
  renderLuna();
}

function selectDFT() {
  currentView = { tipo: 'dft', luna: null };
  viewMode = 'luna';
  updateViewButtons();
  markActiveNav('dft', null);
  renderDFT();
}

/* → core-calendario.js (extraído; misma scope global, defer previo en index.html) */

/* → core-dialogo-dia.js (extraído; misma scope global, defer previo en index.html) */

/* → core-clima.js (extraído; misma scope global, defer previo en index.html) */

let siembraTab = 'siembra';
function getSiembraTresLunas(){
  if (currentView.tipo === 'dft') return [13,1,2];
  const cur = currentView.luna;
  return [cur, cur%13+1, (cur+1)%13+1];
}
function renderSiembraTresBox(){
  const box = $('siembraTresBox'); if(!box) return;
  // Vista rápida eliminada: solo luna actual + 2 siguientes en el contenido principal
  box.style.display='none';
  box.classList.add('hidden');
  box.innerHTML='';
}
function renderSiembraContent(tab){
  siembraTab = tab||siembraTab;
  const box = $('siembraContent'); const hBox=$('siembraHarvestBox'); const aBox=$('siembraAsociacionesBox'); const pBox=$('siembraPreparadosBox'); const sBox=$('siembraSemillasBox');
  if(!box) return;
  const tS=$('tabSiembra'), tC=$('tabCosecha'), tA=$('tabAsociaciones'), tP=$('tabPreparados'), tM=$('tabSemillas');
  if(tS&&tC&&tA&&tP){ tS.classList.toggle('btn-accent', siembraTab==='siembra'); tC.classList.toggle('btn-accent', siembraTab==='cosecha'); tA.classList.toggle('btn-accent', siembraTab==='asociaciones'); tP.classList.toggle('btn-accent', siembraTab==='preparados'); if(tM) tM.classList.toggle('btn-accent', siembraTab==='semillas'); }
  else if(tS&&tC&&tA){ tS.classList.toggle('btn-accent', siembraTab==='siembra'); tC.classList.toggle('btn-accent', siembraTab==='cosecha'); tA.classList.toggle('btn-accent', siembraTab==='asociaciones'); }
  else if(tS&&tC){ tS.classList.toggle('btn-accent', siembraTab==='siembra'); tC.classList.toggle('btn-accent', siembraTab==='cosecha'); }
  // gestionar visibilidad de contenedores
  if(aBox){
    if(siembraTab==='asociaciones'){ aBox.classList.remove('hidden'); aBox.style.display=''; } else { aBox.classList.add('hidden'); }
  }
  if(pBox){
    if(siembraTab==='preparados'){ pBox.classList.remove('hidden'); pBox.style.display=''; } else { pBox.classList.add('hidden'); }
  }
  if(sBox){
    if(siembraTab==='semillas'){ sBox.classList.remove('hidden'); sBox.style.display=''; } else { sBox.classList.add('hidden'); sBox.style.display='none'; }
  }
  const tres=getSiembraTresLunas();
  if(siembraTab==='semillas'){
    if(box) box.innerHTML='';
    if(hBox) hBox.innerHTML='';
    if(aBox) aBox.classList.add('hidden');
    if(pBox) pBox.classList.add('hidden');
    renderSiembraSemillas();
    return;
  }
  if(siembraTab==='asociaciones'){
    if(box) box.innerHTML='';
    if(hBox) hBox.innerHTML='';
    if(pBox) pBox.innerHTML='';
    renderSiembraAsociaciones();
    return;
  }
  if(siembraTab==='preparados'){
    if(box) box.innerHTML='';
    if(hBox) hBox.innerHTML='';
    if(aBox) aBox.classList.add('hidden');
    renderSiembraPreparados();
    return;
  }
  // ocultar asociaciones si no es esa pestaña ya hecho; asegurar box visible
  if(aBox) aBox.classList.add('hidden');
  if(siembraTab==='cosecha'){
    box.innerHTML = '';
    if(hBox){
      let html='<p class="muted su-41d23c">Cosecha y plagas — <b>luna actual + 2 siguientes</b></p>';
      html+='<div class="su-c7da91">';
      tres.forEach((n,i)=>{
        const s=SIEMBRA_LUNAS[n]; const meta=MOONS[n-1];
        const badge=i===0?'actual': i===1?'próxima':'siguiente';
        const plaga = n<=3?'Babosas/hongos por humedad': n<=6?'Pulgones en brotes': n<=9?'Mosca blanca/gusano fruto':'Hongos por frío/humedad';
        html+=`<div class="si-card" style="margin:0;${i===0?'border-color:var(--gold);background:linear-gradient(135deg,var(--panel),var(--card))':''}"><h4>🌱 Luna ${n} · ${escapeHtml(meta.nombre)} <span class="chip su-0d5be0">${badge}</span></h4><p class="su-1fd8c8">${escapeHtml(s.epoca)}</p><p class="su-49f9d7"><b>${escapeHtml(s.titulo)}</b></p><p class="si-sem su-11a508">🌾 Cosecha: ${escapeHtml(s.cosecha)}</p><p class="su-9caaf4">🐛 Plagas: ${escapeHtml(plaga)}</p><p class="su-11a508">🛠️ ${escapeHtml(s.tareas)}</p></div>`;
        if(i<2) html+='<div class="su-081822"></div>';
      });
      html+='</div>';
      hBox.innerHTML=html;
    }
    return;
  }
  // siembra: solo luna actual + 2 siguientes (sin vista rápida, sin ciclo completo, sin guía por fase)
  if(hBox) hBox.innerHTML='';
  let html='<p class="muted su-41d23c">Siembra — <b>luna actual + 2 siguientes</b></p>';
  html+='<div class="su-c7da91">';
  tres.forEach((n,i)=>{
    const s=SIEMBRA_LUNAS[n]; const meta=MOONS[n-1];
    const badge=i===0?'actual': i===1?'próxima':'siguiente';
    html+=`<div class="si-card" style="margin:0;${i===0?'border-color:var(--gold);background:linear-gradient(135deg,var(--panel),var(--card))':''}"><h4>🌱 Luna ${n} · ${escapeHtml(meta.nombre)} <span class="chip su-0d5be0">${badge}</span></h4><p class="su-1fd8c8">${escapeHtml(s.epoca)}</p><p class="su-49f9d7"><b>${escapeHtml(s.titulo)}</b></p><p class="si-sem">🌱 Siembra directa: ${escapeHtml(s.directa)}</p><p class="si-tar">🌱 Almácigos: ${escapeHtml(s.almacigos)}</p><p class="su-11a508">🌾 Cosecha: ${escapeHtml(s.cosecha)}</p><p class="su-11a508">🛠️ ${escapeHtml(s.tareas)}</p></div>`;
    if(i<2) html+='<div class="su-081822"></div>';
  });
  html+='</div>';
  box.innerHTML=html;
}
// === ASOCIACIONES DE CULTIVOS ===
const ASOC_DATA = (typeof ASOCIACIONES_CULTIVOS !== 'undefined' ? ASOCIACIONES_CULTIVOS : (window.pencoData && window.pencoData.ASOCIACIONES_CULTIVOS) || []);
let asocSortMode = 'destacado'; // destacado | alfabetico | familia
let asocFamiliaFilter = '';
function renderSiembraAsociaciones(filterText){
  const aBox=$('siembraAsociacionesBox'); if(!aBox) return;
  const ft=(filterText||$('asocSearch')&&$('asocSearch').value||'').toLowerCase().trim();
  // cultivos de la luna actual para destacar
  let destacados=new Set();
  try{
    const tres=getSiembraTresLunas();
    tres.forEach(n=>{
      const s=SIEMBRA_LUNAS[n];
      const txt=(s.directa+' '+s.almacigos).toLowerCase();
      ASOC_DATA.forEach(a=>{
        const name=a.cultivo.toLowerCase();
        if(txt.includes(name.split(' ')[0]) || txt.includes(name.toLowerCase())) destacados.add(a.cultivo);
      });
    });
  }catch{}
  let list=ASOC_DATA.slice();
  if(ft){
    list=list.filter(a=> a.cultivo.toLowerCase().includes(ft) || a.buenas.join(' ').toLowerCase().includes(ft) || a.malas.join(' ').toLowerCase().includes(ft) || a.familia.toLowerCase().includes(ft));
  }
  if(asocFamiliaFilter) list=list.filter(a=> a.familia===asocFamiliaFilter);
  // orden
  if(asocSortMode==='alfabetico') list.sort((a,b)=> a.cultivo.localeCompare(b.cultivo));
  else if(asocSortMode==='familia') list.sort((a,b)=> a.familia.localeCompare(b.familia) || a.cultivo.localeCompare(b.cultivo));
  else { // destacado primero, luego alfabetico
    list.sort((a,b)=>{
      const da=destacados.has(a.cultivo)?0:1; const db=destacados.has(b.cultivo)?0:1;
      if(da!==db) return da-db;
      return a.cultivo.localeCompare(b.cultivo);
    });
  }
  const familias=[...new Set(ASOC_DATA.map(a=>a.familia))].sort();
  let html='';
  // Encabezado ordenado
  html+='<div class="menstrual-card asoc-header su-7baee2">';
  html+='<h4 class="su-e39eba">🤝 Asociaciones — qué plantar junto</h4>';
  html+='<p class="muted su-11a508">Combina cultivos para repeler plagas, mejorar sabor y aprovechar espacio. <b>Verde</b>=buena compañía, <b>rojo</b>=evitar. Basado en huerto de Penco (Bío-Bío).</p>';
  html+='<div class="asoc-controls">';
  html+='<label class="asoc-control">🔍 Buscar<input type="text" id="asocSearch" placeholder="ej: tomate, lechuga, ajo..." value="'+escapeHtml(ft)+'"></label>';
  html+='<label class="asoc-control">↕️ Orden<select id="asocSort"><option value="destacado" '+(asocSortMode==='destacado'?'selected':'')+'>⭐ Luna actual primero</option><option value="alfabetico" '+(asocSortMode==='alfabetico'?'selected':'')+'>🔤 A → Z</option><option value="familia" '+(asocSortMode==='familia'?'selected':'')+'>🌿 Por familia</option></select></label>';
  html+='<label class="asoc-control">🌿 Familia<select id="asocFamilia"><option value="">Todas</option>'+familias.map(f=>'<option value="'+escapeHtml(f)+'" '+(asocFamiliaFilter===f?'selected':'')+'>'+escapeHtml(f)+'</option>').join('')+'</select></label>';
  html+='<span class="chip asoc-count">'+list.length+' cultivos'+(asocFamiliaFilter?' · '+escapeHtml(asocFamiliaFilter):'')+'</span>';
  html+='</div>';
  if(destacados.size) html+='<div class="asoc-destacados"><span class="muted su-11a508">⭐ Destacados esta luna ('+destacados.size+'):</span> '+Array.from(destacados).map(c=>'<span class="pill good su-11a508">'+escapeHtml(c)+'</span>').join(' ')+'</div>';
  html+='<div class="asoc-legend">';
  html+='<span class="asoc-legend-item good">✅ Buena compañía</span><span class="asoc-legend-item bad">🚫 Evitar</span><span class="asoc-legend-item tip">💡 Consejo</span>';
  html+='</div>';
  html+='</div>';
  // Bloque Tres Hermanas destacado ordenado
  html+='<div class="si-card asoc-milpa su-b77201"><span class="su-a2600b">🌽</span><div><h4>Las Tres Hermanas — milpa mapuche</h4><p class="su-707c92">Técnica ancestral: <b>Maíz</b> es tutor del <b>Poroto</b> (fija nitrógeno) y <b>Zapallo</b> cubre suelo, guarda humedad y frena maleza. Juntas producen más que separadas.</p><p class="muted su-11a508">Espacio: maíz 40 cm, poroto al pie, zapallo 1,2 m entre mata. Siembra las 3 en la misma luna de Pewü.</p></div></div>';
  if(!list.length){
    html+='<p class="muted su-3a6477">Sin resultados para “'+escapeHtml(ft)+'”'+(asocFamiliaFilter?' en '+escapeHtml(asocFamiliaFilter):'')+'. Prueba con otro término.</p>';
  } else {
    // Lista ordenada vertical, una card por fila, más legible
    html+='<div class="asoc-list">';
    let currentFamilia=null;
    list.forEach(a=>{
      const isDest=destacados.has(a.cultivo);
      if(asocSortMode==='familia' && currentFamilia!==a.familia){
        currentFamilia=a.familia;
        html+='<div class="asoc-familia-sep"><span>'+escapeHtml(currentFamilia)+'</span></div>';
      }
      html+='<div class="asoc-card'+(isDest?' dest':'' )+'">';
      html+='<div class="asoc-card-head">';
      html+='<span class="asoc-icon">'+a.icono+'</span>';
      html+='<div class="asoc-titles"><b class="asoc-name">'+escapeHtml(a.cultivo)+'</b><span class="chip asoc-familia">'+escapeHtml(a.familia)+'</span>'+(isDest?' <span class="chip asoc-luna">⭐ luna actual</span>':'')+'</div>';
      html+='</div>';
      html+='<div class="asoc-card-body">';
      html+='<div class="asoc-row"><span class="asoc-label good">✅ Con</span><div class="asoc-pills">'+a.buenas.map(b=>'<span class="pill good">'+escapeHtml(b)+'</span>').join('')+'</div></div>';
      html+='<div class="asoc-row"><span class="asoc-label bad">🚫 Evitar</span><div class="asoc-pills">'+a.malas.map(b=>'<span class="pill bad">'+escapeHtml(b)+'</span>').join('')+'</div></div>';
      html+='<div class="asoc-note">💡 '+escapeHtml(a.nota)+'</div>';
      html+='</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  html+='<p class="muted su-2b3781">Tip: alterna familias cada luna (no repetir solanácea tras solanácea). Deja flores (caléndula, cosmos) para atraer polinizadores. Toca ⭐ para ver destacadas arriba.</p>';
  aBox.innerHTML=html;
  const inp=$('asocSearch');
  if(inp){
    inp.oninput=()=> renderSiembraAsociaciones(inp.value);
    inp.focus(); const v=inp.value; try{ inp.setSelectionRange(v.length, v.length);}catch{}
  }
  const sel=$('asocSort'); if(sel) sel.onchange=()=>{ asocSortMode=sel.value; renderSiembraAsociaciones(); };
  const fam=$('asocFamilia'); if(fam) fam.onchange=()=>{ asocFamiliaFilter=fam.value; renderSiembraAsociaciones(); };
}
// === PREPARADOS ORGÁNICOS ===
const PREP_DATA = (typeof PREPARADOS_ORGANICOS !== 'undefined' ? PREPARADOS_ORGANICOS : (window.pencoData && window.pencoData.PREPARADOS_ORGANICOS) || []);
let prepFilterTipo = '';
let prepSearch = '';
function renderSiembraPreparados(){
  const pBox=$('siembraPreparadosBox'); if(!pBox) return;
  const ft=(prepSearch||$('prepSearch')&&$('prepSearch').value||'').toLowerCase().trim();
  const tipoFiltro = prepFilterTipo || ($('prepTipo')&&$('prepTipo').value||'');
  let list=PREP_DATA.slice();
  if(ft) list=list.filter(p=> p.nombre.toLowerCase().includes(ft) || p.tipo.toLowerCase().includes(ft) || p.ingredientes.toLowerCase().includes(ft) || p.uso.toLowerCase().includes(ft));
  if(tipoFiltro) list=list.filter(p=> p.familia===tipoFiltro || p.tipo.toLowerCase().includes(tipoFiltro.toLowerCase()));
  const tipos=[...new Set(PREP_DATA.map(p=>p.familia))].sort();
  let html='';
  html+='<div class="menstrual-card su-7baee2">';
  html+='<h4 class="su-e39eba">🧪 Preparados orgánicos — botica de la huerta pencona</h4>';
  html+='<p class="muted su-11a508">Alternativa sin venenos para <b>fertilizar, prevenir hongos y repeler insectos</b>. Todos se hacen con ingredientes locales (ortiga, cola de caballo, ajo, ceniza). Respeta dosis y luna: menos es más.</p>';
  html+='<div class="asoc-controls">';
  html+='<label class="asoc-control">🔍 Buscar<input type="text" id="prepSearch" placeholder="ej: pulgón, ortiga, neem..." value="'+escapeHtml(ft)+'"></label>';
  html+='<label class="asoc-control">🧪 Tipo<select id="prepTipo"><option value="">Todos</option>'+tipos.map(t=>'<option value="'+escapeHtml(t)+'" '+(tipoFiltro===t?'selected':'')+'>'+escapeHtml(t)+'</option>').join('')+'</select></label>';
  html+='<span class="chip asoc-count">'+list.length+' preparados</span>';
  html+='</div>';
  html+='<div class="asoc-legend"><span class="asoc-legend-item good">🌿 Fertilizante</span><span class="asoc-legend-item su-8fa3a4">🍄 Fungicida</span><span class="asoc-legend-item bad">🐛 Insecticida</span><span class="asoc-legend-item tip">⚗️ Trampa</span></div>';
  html+='</div>';
  if(!list.length){
    html+='<p class="muted su-3a6477">Sin preparados para ese filtro. Prueba “ortiga” o “jabón”.</p>';
  } else {
    html+='<div class="prep-list">';
    list.forEach(p=>{
      const tipoClass = p.familia==='Fertilizante'?'good': p.familia==='Fungicida'?'fungi': p.familia==='Insecticida'?'bad':'tip';
      const lunaIcon = p.luna.includes('Creciente')?'🌒': p.luna.includes('Menguante')?'🌘':'🌕';
      html+='<div class="prep-card">';
      html+='<div class="prep-head"><span class="asoc-icon">'+p.icono+'</span><div class="asoc-titles"><b class="asoc-name">'+escapeHtml(p.nombre)+'</b><span class="chip prep-tipo '+tipoClass+'">'+escapeHtml(p.tipo)+'</span><span class="chip asoc-luna">'+lunaIcon+' '+escapeHtml(p.luna)+'</span></div></div>';
      html+='<div class="prep-body">';
      html+='<div class="prep-row"><span class="prep-label">🧾 Ingredientes</span><p>'+escapeHtml(p.ingredientes)+'</p></div>';
      html+='<div class="prep-row"><span class="prep-label">⚗️ Preparación</span><p>'+escapeHtml(p.preparacion)+'</p></div>';
      html+='<div class="prep-row"><span class="prep-label">💧 Dosis</span><p class="su-752b1a"><b>'+escapeHtml(p.dosis)+'</b></p></div>';
      html+='<div class="prep-row"><span class="prep-label">🎯 Uso</span><p>'+escapeHtml(p.uso)+'</p></div>';
      html+='<div class="prep-caution">⚠️ '+escapeHtml(p.precauciones)+'</div>';
      html+='</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  html+='<div class="si-card su-8a5705"><h4>📅 Calendario de preparados — por luna</h4><p class="su-f6ebab"><b>Pukem (invierno):</b> cola de caballo + caldo bordelés preventivo. <b>Pewü:</b> ortiga + jabón potásico para brotes. <b>Walüng:</b> neem + ajo-ají para mosca blanca. <b>Rimü:</b> sulfocálcico + té de compost para guardar.</p><p class="muted su-0d5be0">Aplica siempre al atardecer, sin viento sur. Alterna preparados (no repitas cobre >3 veces). Lava hortalizas antes de consumir y respeta carencias.</p></div>';
  pBox.innerHTML=html;
  const inp=$('prepSearch'); if(inp){ inp.oninput=()=>{ prepSearch=inp.value; renderSiembraPreparados(); inp.focus(); try{const v=inp.value; inp.setSelectionRange(v.length,v.length);}catch{} }; }
  const sel=$('prepTipo'); if(sel) sel.onchange=()=>{ prepFilterTipo=sel.value; renderSiembraPreparados(); };
}
function openSiembra(tab){
  renderSiembraTresBox();
  renderSiembraContent(tab||'siembra');
  $('siembraDialog').showModal();
}
$('btnSiembra').onclick = () => openSiembra('siembra');
$('siembraClose').onclick = () => $('siembraDialog').close();
if ($('siembraCloseTop')) $('siembraCloseTop').onclick = () => $('siembraDialog').close();
const _tabS=$('tabSiembra'), _tabC=$('tabCosecha'), _tabA=$('tabAsociaciones'), _tabP=$('tabPreparados'), _tabM=$('tabSemillas');
if(_tabS) _tabS.onclick=()=> renderSiembraContent('siembra');
if(_tabC) _tabC.onclick=()=> renderSiembraContent('cosecha');
if(_tabA) _tabA.onclick=()=> renderSiembraContent('asociaciones');
if(_tabP) _tabP.onclick=()=> renderSiembraContent('preparados');
if(_tabM) _tabM.onclick=()=> renderSiembraContent('semillas');


/* → renderer-territorio-vivo.js (extraído P2-B; misma scope global, defer posterior en index.html) */

function generateIconPNG() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 100, 20, 128, 128, 130);
  g.addColorStop(0, '#232f66');
  g.addColorStop(1, '#0b1026');
  x.fillStyle = g;
  x.beginPath();
  x.arc(128, 128, 124, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = '#e8c56a';
  x.lineWidth = 5;
  x.stroke();
  x.fillStyle = '#ffffff';
  [[62, 58, 3], [196, 44, 2.5], [210, 120, 3], [52, 150, 2], [176, 190, 2.5]].forEach(([sx, sy, r]) => {
    x.beginPath();
    x.arc(sx, sy, r, 0, Math.PI * 2);
    x.fill();
  });
  x.fillStyle = '#f0d488';
  x.beginPath();
  x.arc(118, 112, 56, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#131a3a';
  x.beginPath();
  x.arc(146, 96, 50, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#e8c56a';
  x.font = 'bold 40px Georgia, serif';
  x.textAlign = 'center';
  x.fillText('13 LUNAS', 128, 226);
  return c.toDataURL('image/png').split(',')[1];
}

const _btnShortcut = $('btnShortcut');
async function createDesktopShortcut() {
  try {
    const pngB64 = generateIconPNG();
    const res = await window.api.createShortcut(pngB64);
    const msg = (res && res.ok) ? 'Acceso directo creado ✓' : 'Error: ' + ((res && res.error) || 'no disponible en esta versión');
    const sm = $('statusMsg');
    if (sm) {
      sm.textContent = msg;
      setTimeout(() => { sm.textContent = ''; }, 3500);
    } else alert(msg);
  } catch (e) { alert('No se pudo crear el acceso directo en esta versión'); }
}
// Lo técnico vive en ⚙️ Ajustes (antes en Comunidad > App). Se mantiene
// compatibilidad: si los botones antiguos existen (caché vieja), siguen funcionando.
if (_btnShortcut) _btnShortcut.onclick = createDesktopShortcut;

const TIDES_TALCAHUANO = {
  '08-19': [{ h: '03:02', a: '1.58m', t: 'pleamar' }, { h: '09:27', a: '0.90m', t: 'bajamar' }, { h: '15:02', a: '1.30m', t: 'pleamar' }, { h: '21:03', a: '0.84m', t: 'bajamar' }],
  '08-20': [{ h: '04:06', a: '1.53m', t: 'pleamar' }, { h: '11:07', a: '0.98m', t: 'bajamar' }, { h: '16:12', a: '1.16m', t: 'pleamar' }, { h: '21:53', a: '0.92m', t: 'bajamar' }],
  '08-21': [{ h: '05:32', a: '1.52m', t: 'pleamar' }, { h: '13:20', a: '0.95m', t: 'bajamar' }, { h: '18:32', a: '1.10m', t: 'pleamar' }, { h: '23:18', a: '0.97m', t: 'bajamar' }],
  '08-22': [{ h: '06:58', a: '1.56m', t: 'pleamar' }, { h: '14:37', a: '0.86m', t: 'bajamar' }, { h: '20:17', a: '1.14m', t: 'pleamar' }],
  '08-23': [{ h: '00:54', a: '0.97m', t: 'bajamar' }, { h: '08:00', a: '1.63m', t: 'pleamar' }, { h: '15:17', a: '0.77m', t: 'bajamar' }, { h: '21:05', a: '1.21m', t: 'pleamar' }],
  '08-24': [{ h: '01:58', a: '0.92m', t: 'bajamar' }, { h: '08:43', a: '1.71m', t: 'pleamar' }, { h: '15:45', a: '0.69m', t: 'bajamar' }, { h: '21:35', a: '1.28m', t: 'pleamar' }],
  '08-25': [{ h: '02:44', a: '0.86m', t: 'bajamar' }, { h: '09:18', a: '1.78m', t: 'pleamar' }, { h: '16:09', a: '0.63m', t: 'bajamar' }, { h: '22:00', a: '1.35m', t: 'pleamar' }],
  '08-26': [{ h: '03:21', a: '0.40m', t: 'bajamar' }, { h: '09:51', a: '1.60m', t: 'pleamar' }, { h: '16:31', a: '0.30m', t: 'bajamar' }, { h: '22:18', a: '1.20m', t: 'pleamar' }],
  '08-27': [{ h: '03:59', a: '0.40m', t: 'bajamar' }, { h: '10:24', a: '1.60m', t: 'pleamar' }, { h: '16:58', a: '0.30m', t: 'bajamar' }, { h: '22:49', a: '1.20m', t: 'pleamar' }],
  '08-28': [{ h: '04:34', a: '0.40m', t: 'bajamar' }, { h: '10:55', a: '1.60m', t: 'pleamar' }, { h: '17:25', a: '0.30m', t: 'bajamar' }, { h: '23:19', a: '1.30m', t: 'pleamar' }]
};
function getTidesForKey(mdKey){
  if(TIDES_TALCAHUANO[mdKey]) return { tides: TIDES_TALCAHUANO[mdKey], estimated:false };
  // Generar para cualquier fecha: base 08-19
  const baseTimes=[3*60+2, 9*60+27, 15*60+2, 21*60+3];
  const baseHeights=[1.58,0.90,1.30,0.84];
  const baseTypes=['pleamar','bajamar','pleamar','bajamar'];
  // calcular offset días desde 08-19 (día 231 del año)
  const [m,d]=mdKey.split('-').map(Number);
  const doy = Math.floor((new Date(2026,m-1,d).getTime() - new Date(2026,0,1).getTime())/86400000)+1;
  const baseDoy = Math.floor((new Date(2026,7,19).getTime() - new Date(2026,0,1).getTime())/86400000)+1;
  let offset = doy - baseDoy;
  // generar 4 mareas desplazadas 50 min por día (ciclo lunar)
  const tides=[];
  for(let i=0;i<4;i++){
    let mins = baseTimes[i] + offset*50 + Math.round(Math.sin(offset*0.7 + i)*8);
    mins = ((mins % 1440) + 1440) % 1440;
    const h = String(Math.floor(mins/60)).padStart(2,'0');
    const mm = String(mins%60).padStart(2,'0');
    let height = baseHeights[i] + Math.sin(offset*0.3 + i)*0.15 + Math.sin(offset*0.11)*0.07;
    height = Math.max(0.25, Math.min(1.85, height));
    // clasificar por altura: si >0.95 pleamar sino bajamar (aprox)
    const t = baseTypes[i];
    tides.push({ h: h+':'+mm, a: height.toFixed(2)+'m', t });
  }
  tides.sort((a,b)=> a.h.localeCompare(b.h));
  // si hay 4, algunos días reales tienen 3; si una marea queda cerca de medianoche, filtrar la más cercana a 00:00 si genera duplicado
  // mantener 4 para simplicidad
  return { tides, estimated:true };
}

$('btnTides').onclick = () => {
  const panel = $('tidesPanel');
  const isHidden = panel.classList.contains('hidden');
  if (isHidden) {
    renderTidesPanel3();
    panel.classList.remove('hidden');
    $('weatherPanel').classList.add('hidden');
  } else {
    panel.classList.add('hidden');
  }
};

function tideNum(hm){ const p=String(hm||'').split(':'); return (+p[0])*60+(+p[1]||0); }
function tideAltNum(a){ const v=parseFloat(String(a||'').replace('m','').replace(',','.')); return isFinite(v)?v:NaN; }
function tideFmtCountdown(mins){ mins=Math.max(0,Math.round(mins)); const h=Math.floor(mins/60), m=mins%60; if(h<=0) return 'en '+m+' min'; if(h<24) return 'en '+h+'h '+(m<10?'0':'')+m+'m'; const d=Math.floor(h/24); return 'en '+d+'d '+(h%24)+'h'; }
function tideTipoLunar(noonMs){
  try{
    let illum=null, tithi=0;
    try{ const mi=window.astro.moonInfo(noonMs); illum=Math.round((mi.fraction||0)*100); }catch(e){}
    try{ tithi=window.astro.tithi(noonMs); }catch(e){}
    if([1,2,15,16,29,30].indexOf(tithi)>=0 || (illum!=null && (illum>=82 || illum<=12))) return { clave:'viva', label:'🌊 Marea viva', desc:'Luna nueva/llena → mayor amplitud. Bajamares más bajas (buenas para roquerío) y pleamares más altas. Corrientes más fuertes.', tithi, illum };
    if([7,8,9,22,23,24].indexOf(tithi)>=0 || (illum!=null && illum>=38 && illum<=62)) return { clave:'muerta', label:'🦐 Marea muerta', desc:'Cuartos lunares → menor amplitud. Poca diferencia entre alta y baja. Mar más calmo, ventana intermareal corta.', tithi, illum };
    return { clave:'intermedia', label:'🌗 Marea intermedia', desc:'Entre viva y muerta. Amplitud media, buena para pesca y paseo costero.', tithi, illum };
  }catch(e){ return { clave:'intermedia', label:'🌗 Marea intermedia', desc:'', tithi:0, illum:null }; }
}
function tideCoef(tides){
  try{
    const alts=tides.map(t=>tideAltNum(t.a)).filter(v=>isFinite(v));
    if(!alts.length) return null;
    const amp=Math.max.apply(null,alts)-Math.min.apply(null,alts);
    const coef=Math.max(20,Math.min(120,Math.round(amp/1.55*100)));
    const rango=amp>=1.05?'amplia':amp>=0.6?'media':'corta';
    return { amp, coef, rango };
  }catch(e){ return null; }
}
function tideCurvaSVG(tides, ahoraHM){
  try{
    const W=320, H=84, P=10;
    const alts=tides.map(t=>tideAltNum(t.a));
    let mn=Math.min.apply(null,alts.concat([0.2])), mx=Math.max.apply(null,alts.concat([1.8]));
    if(!(mx>mn)){ mn=0; mx=2; }
    const X=h=>P+(tideNum(h)/1440)*(W-2*P);
    const Y=a=>H-P-((a-mn)/(mx-mn))*(H-2*P);
    let pts=tides.map(t=>X(t.h).toFixed(1)+','+Y(tideAltNum(t.a)).toFixed(1)).join(' ');
    let dots=tides.map(t=>{
      const isP=t.t==='pleamar';
      return '<circle cx="'+X(t.h).toFixed(1)+'" cy="'+Y(tideAltNum(t.a)).toFixed(1)+'" r="4.5" fill="'+(isP?'#4da3ff':'#e8c56a')+'"><title>'+t.h+' · '+t.a+' · '+t.t+'</title></circle>'
        +'<text x="'+X(t.h).toFixed(1)+'" y="'+(Y(tideAltNum(t.a))-8).toFixed(1)+'" text-anchor="middle" font-size="9" fill="#cdd3ee">'+t.h+'</text>';
    }).join('');
    let nowDot='';
    if(ahoraHM){
      const nx=X(ahoraHM).toFixed(1);
      nowDot='<line x1="'+nx+'" y1="4" x2="'+nx+'" y2="'+(H-4)+'" stroke="#8fd694" stroke-width="1.2" stroke-dasharray="3 3"/><circle cx="'+nx+'" cy="8" r="3.5" fill="#8fd694"><title>Ahora '+ahoraHM+'</title></circle>';
    }
    return '<svg viewBox="0 0 '+W+' '+H+'" class="tide-curve" role="img" aria-label="Curva de marea del día"><polyline points="'+pts+'" fill="none" stroke="#7a6fa5" stroke-width="2"/><polygon points="'+P+','+(H-P)+' '+pts+' '+(W-P)+','+(H-P)+'" fill="rgba(122,111,165,.18)" stroke="none"/>'+dots+nowDot+'</svg>';
  }catch(e){ return ''; }
}
function tideVentana(t){
  if(t.t==='pleamar') return '🎣 ±2h pique · 🚣 bote/kayak · 🏊 baño subiendo';
  const v=tideAltNum(t.a);
  if(isFinite(v) && v<0.6) return '🦀 roquerío ±1h · 🚶 caminata · 📷 pozas';
  return '🚶 paseo · 🦅 aves · 🎣 orilla';
}
function renderTidesPanel3() {
  const panel = $('tidesPanel');
  if(!panel) return;
  const now = new Date();
  const todayKey = cal.fmtKey.format(now);
  const ahoraHM = cal.fmtTime.format(now).slice(0,5);
  let startIdx = cycle.days.findIndex(d => cal.fmtKey.format(new Date(d.noonMs)) === todayKey);
  if (startIdx < 0) {
    if (currentView.tipo === 'luna') startIdx = (currentView.luna - 1) * 28;
    else startIdx = 0;
  }
  if(typeof window._tideSelOffset==='undefined' || window._tideSelOffset===null) window._tideSelOffset=0;
  window._tideSelOffset=Math.max(0,Math.min(6,window._tideSelOffset|0));
  const NDIAS=7;
  const dias = [];
  for (let i = 0; i < NDIAS; i++) {
    const idx = startIdx + i;
    if (idx >= cycle.days.length) break;
    dias.push(cycle.days[idx]);
  }
  const selDia = dias[Math.min(window._tideSelOffset, dias.length-1)] || dias[0];
  // estado actual (ayer/hoy/mañana reales)
  let res={actual:null,siguientes:[]};
  try{
    const keyOf=(diff)=>{ const d=new Date(now.getTime()); d.setDate(d.getDate()+diff); return cal.fmtKey.format(d); };
    const hoyK=keyOf(0), ayerK=keyOf(-1), manK=keyOf(1);
    const hoy=(typeof getTidesForKey==='function'?getTidesForKey(hoyK.slice(5)).tides:[])||[];
    const ayer=(typeof getTidesForKey==='function'?getTidesForKey(ayerK.slice(5)).tides:[])||[];
    const man=(typeof getTidesForKey==='function'?getTidesForKey(manK.slice(5)).tides:[])||[];
    if(window.InfoClave&&typeof window.InfoClave.mareasActuales==='function'){ res=window.InfoClave.mareasActuales(ahoraHM,hoy,ayer,man); }
    const all=[].concat(ayer.map(t=>Object.assign({dia:-1},t)),hoy.map(t=>Object.assign({dia:0},t)),man.map(t=>Object.assign({dia:1},t)));
    if(res.actual){
      const pos=all.findIndex(t=>t.h===res.actual.h&&t.t===res.actual.t&&t.dia===(res.actual.dia||0));
      if(pos>=0) res.siguientes=all.slice(pos+1,pos+3);
    } else if(res.siguientes.length){
      const f=res.siguientes[0]; const pos=all.findIndex(t=>t.h===f.h&&t.t===f.t&&t.dia===(f.dia||0))-1;
      if(pos>=0) res.siguientes=all.slice(pos+1,pos+3);
    } else { res.siguientes=all.filter(t=>t.dia>=0).slice(0,2); }
    res._all=all;
  }catch(e){}
  const fmtM=(window.InfoClave&&window.InfoClave.textoMarea)||((mm)=>(mm.t==='pleamar'?'⬆️':'⬇️')+' '+mm.t+' '+mm.h+(mm.a?' · '+mm.a:''));
  // dirección: ¿subiendo o bajando?
  let dirTxt='—', nextTxt='—', progPct=null;
  try{
    if(res.actual && res.siguientes.length){
      const a=res.actual, nx=res.siguientes[0];
      const sube=(nx.t==='pleamar');
      let mins=(tideNum(nx.h)-tideNum(ahoraHM));
      if(nx.dia===1) mins+=1440; if(nx.dia===-1) mins-=1440; if(a.dia===-1&&nx.dia===0&&mins<0) mins+=1440;
      if(mins<0) mins+=1440;
      dirTxt=sube?'📈 Subiendo hacia pleamar':'📉 Bajando hacia bajamar';
      nextTxt='Próxima: <b>'+escapeHtml(fmtM(nx))+'</b> '+tideFmtCountdown(mins);
      const tot=(tideNum(nx.h)-tideNum(a.h)+1440)%1440 || 1;
      let done=(tideNum(ahoraHM)-tideNum(a.h)+1440)%1440;
      if(nx.dia!==a.dia) done=(tideNum(ahoraHM)-tideNum(a.h)+1440)%1440;
      progPct=Math.max(2,Math.min(100,Math.round(done/tot*100)));
    }
  }catch(e){}
  // luna hoy + coef hoy
  let lunaHoy={clave:'intermedia',label:'🌗 Marea intermedia',desc:'',tithi:0,illum:null}, coefHoy=null, hoyTides=[];
  try{
    hoyTides=(typeof getTidesForKey==='function'?getTidesForKey(todayKey.slice(5)).tides:[])||[];
    lunaHoy=tideTipoLunar(now.getTime());
    coefHoy=tideCoef(hoyTides);
  }catch(e){}
  const moonIc=(function(){ try{ return window.astro.moonIcon(now.getTime())||'🌙'; }catch(e){ return '🌙'; } })();

  let html = '<div class="tp-head"><b>🌊 Mareas — Penco · Bahía de Concepción</b><span class="muted">SHOA · Talcahuano (15 km, misma bahía) · 7 días · hora local America/Santiago</span>'
    +'<span class="su-3de8f9"><button type="button" id="tidesToDayBtn" class="btn btn-accent su-c4b37a" title="Agregar la marea actual y las 2 siguientes a la pantalla del día de hoy">📌 Al día: actual + 2</button>'
    +'<a class="btn su-7ab949" href="https://www.shoa.cl/php/mareas.php" target="_blank" rel="noopener" title="Tabla oficial SHOA">🌐 SHOA oficial</a></span></div>';

  // 1) AHORA
  html += '<div class="tide-grid2">'
    +'<div class="tide-card tide-now"><div class="tide-head"><b>'+dirTxt+'</b><span>Ahora '+escapeHtml(ahoraHM)+' · Talcahuano/Penco</span></div>'
    +'<div class="su-0ad856">'
    +(res.actual?'<span class="chip su-68a1a9">Última: <b>'+escapeHtml(fmtM(res.actual))+'</b></span>':'<span class="chip">Sin marea previa hoy</span>')
    +res.siguientes.map((s,ix)=>'<span class="chip">Sig '+(ix+1)+': <b>'+escapeHtml(fmtM(s))+'</b></span>').join('')
    +'</div>'
    +'<p class="muted su-11365b">'+nextTxt+'</p>'
    +(progPct!=null?'<div class="tide-prog"><div class="tide-prog-fill" style="width:'+progPct+'%"></div></div><p class="muted su-32206a">'+progPct+'% del tramo entre mareas · el cambio es gradual, no de golpe</p>':'')
    +'<p class="muted su-46d1cc">⚠️ Horas de referencia para caleta, orilla y roquerío. Para navegar usa siempre la tabla oficial SHOA del día.</p></div>'
    // 2) LUNA
    +'<div class="tide-card"><div class="tide-head"><b>'+moonIc+' Luna y tipo de marea</b><span>'+escapeHtml(cal.fmtDate.format(now))+' · tithi '+lunaHoy.tithi+(lunaHoy.illum!=null?' · '+lunaHoy.illum+'% iluminada':'')+'</span></div>'
    +'<p class="su-582fcd"><b>'+escapeHtml(lunaHoy.label)+'</b>'+(coefHoy?' · coef. <b>'+coefHoy.coef+'</b> · amplitud <b>'+coefHoy.amp.toFixed(2)+'m</b> ('+coefHoy.rango+')':'')+'</p>'
    +'<p class="muted su-1ae50f">'+escapeHtml(lunaHoy.desc)+'</p>'
    +'<p class="muted su-4384f3">🌑🌕 nueva/llena → <b>vivas</b> (bajamar muy baja, ideal luche/cochayuyo con cuidado). 🌓🌗 cuartos → <b>muertas</b> (poco movimiento, mar calmo). La pleamar/bajamar se atrasa ~50 min cada día.</p></div>'
    +'</div>';

  // 3) NAV 7 días
  html += '<div class="tide-daynav">';
  dias.forEach((dd,i)=>{
    const key = cal.fmtKey.format(new Date(dd.noonMs));
    const isToday = key===todayKey;
    const wd=cal.weekdayName(dd.noonMs).slice(0,3);
    const fe=cal.fmtDate.format(new Date(dd.noonMs));
    html+='<button type="button" data-tide-day="'+i+'" class="btn tide-daybtn'+(i===window._tideSelOffset?' btn-accent':'')+'">'+wd+' '+fe+(isToday?' ·hoy':'')+'</button>';
  });
  html += '</div>';

  // 4) DETALLE DÍA SELECCIONADO
  if(selDia){
    const skey = cal.fmtKey.format(new Date(selDia.noonMs));
    const md = skey.slice(5);
    const labelLuna = selDia.luna === 'dft' ? '✷ Día Fuera del Tiempo' : ('Luna '+selDia.luna+' · Día '+selDia.diaN+' · '+MOONS[selDia.luna - 1].nombre);
    const tideRes = getTidesForKey(md);
    const tides = tideRes.tides||[];
    const isEstimated = tideRes.estimated;
    const isToday = skey===todayKey;
    const coef=tideCoef(tides);
    const tl=tideTipoLunar(selDia.noonMs);
    const pleamares=tides.filter(t=>t.t==='pleamar'), bajamares=tides.filter(t=>t.t==='bajamar');
    const mejorPesca=pleamares.map(t=>t.h).join(' y ');
    const bajaMin=bajamares.length?bajamares.slice().sort((a,b)=>tideAltNum(a.a)-tideAltNum(b.a))[0]:null;
    html+='<div class="tide-card tide-sel"><div class="tide-head"><b>'+escapeHtml(cal.weekdayName(selDia.noonMs)+' '+cal.fmtDate.format(new Date(selDia.noonMs)))+(isToday?' · hoy':'')+(isEstimated?' · *est.':'')+'</b><span>'+escapeHtml(labelLuna)+' · '+escapeHtml(tl.label)+(coef?' · coef '+coef.coef+' · ampl. '+coef.amp.toFixed(2)+'m':'')+'</span></div>';
    html+='<div class="tide-selgrid"><div>';
    if(tides.length){
      html+='<table class="tide-mini"><thead><tr><th>Hora</th><th>Altura</th><th>Tipo</th><th>Ventana</th></tr></thead><tbody>';
      for(const t of tides){
        const icon=t.t==='pleamar'?'⬆️':'⬇️';
        const hl=(isToday&&res.siguientes.length&&res.siguientes[0].h===t.h&&res.siguientes[0].t===t.t)?' class="su-1ccebf"':'';
        html+='<tr'+hl+'><td>'+t.h+'</td><td>'+t.a+'</td><td>'+icon+' '+t.t+'</td><td class="tide-ventana">'+tideVentana(t)+'</td></tr>';
      }
      html+='</tbody></table>';
      if(isEstimated) html+='<p class="muted su-46d1cc">* Estimada por ciclo lunar (~50 min/día desde tabla SHOA 19–28 ago). Contrasta con <a href="https://www.shoa.cl/php/mareas.php" target="_blank" rel="noopener">shoa.cl</a> antes de navegar o bajar a roquerío.</p>';
    }
    html+='<div class="su-ac5453">'
      +'<button type="button" class="btn su-30e741" data-tide-send-day="'+skey+'">📌 Llevar este día al calendario</button>'
      +'<button type="button" class="btn su-30e741" data-tide-copy="'+skey+'">📋 Copiar</button></div>';
    html+='</div><div><div class="muted su-455c1c">Curva del día (altura vs hora · línea verde = ahora)</div>'
      +tideCurvaSVG(tides, isToday?ahoraHM:null)
      +'<div class="tide-best"><p class="su-f9928b">🎣 <b>Pesca orilla:</b> 2h antes/después de pleamar '+(mejorPesca?'('+escapeHtml(mejorPesca)+')':'')+'</p>'
      +'<p class="su-f9928b">🦀 <b>Roquerío Lirquén/Playa Negra:</b> '+(bajaMin?('entra 1h antes de la bajamar '+bajaMin.h+' ('+bajaMin.a+') y sal 1h después'+(tideAltNum(bajaMin.a)<0.6?' · ✅ apta (<0.6m)':' · ⚠️ alta para cosecha, mejor observar')):'solo con bajamar <0.6m y sin alerta SHOA')+'</p>'
      +'<p class="muted su-2aad63">🚣 Bote/kayak: evita salir en bajamar mínima con viento sur. 🏊 Baño: solo con pleamar subiendo y playa apta, nunca con marejada.</p></div>'
      +'</div></div></div>';
  }

  // 5) GUÍA PENCO
  html+='<div class="tide-grid2 su-d2c171">'
    +'<div class="tide-card"><div class="tide-head"><b>📖 Cómo leer la tabla</b><span>Glosario mínimo</span></div>'
    +'<ul class="tide-list"><li><b>⬆️ Pleamar</b> = marea alta (mar lleno). <b>⬇️ Bajamar</b> = marea baja.</li>'
    +'<li><b>Altura (m):</b> metros sobre el nivel medio. Ej 1.70m = llena grande; 0.30m = vacía grande.</li>'
    +'<li><b>Ciclo semidiurno:</b> Penco tiene 2 altas + 2 bajas al día, cada ~12h 25min. Todo se corre ~50 min diarios.</li>'
    +'<li><b>Coef./amplitud:</b> diferencia entre la más alta y la más baja del día. Más amplitud = más corriente.</li>'
    +'<li><b>Talcahuano ≈ Penco:</b> mismo borde de bahía (15 km). Sirve para caleta, orilla y roquerío; no para navegación fina.</li></ul></div>'
    +'<div class="tide-card"><div class="tide-head"><b>🦺 Seguridad costera</b><span>Lee esto antes de bajar</span></div>'
    +'<ul class="tide-list"><li>🌊 <b>Marejada:</b> si hay aviso Directemar/SHOA, no bajes a roquerío ni paseo rompiente.</li>'
    +'<li>🚨 <b>Terremoto largo o mar extraño:</b> evacúa a cota alta a pie, sin esperar alarma. Ver 🌊🚨 Evacuación Tsunami.</li>'
    +'<li>☠️ <b>Marea roja:</b> con alerta Sernapesca no coseches ni consumas mariscos (sernapesca.cl).</li>'
    +'<li>🥾 <b>Nunca solo:</b> calzado que agarre, malla no plástico, cuerda, linterna roja de noche, avisa tu ruta y hora.</li>'
    +'<li>🦀 <b>Cosecha medida:</b> talla mínima, deja reproductores y 30% en la roca. Ver 🦀 Intermareal.</li></ul></div>'
    +'</div>';

  html+='<div class="tide-card su-d2c171"><div class="tide-head"><b>🎯 Ventanas por actividad — Penco</b><span>Regla de bolsillo</span></div>'
    +'<div class="tide-acts">'
    +'<div><b>🎣 Pesca orilla</b><br><span class="muted">2h antes/después de pleamar + amanecer/atardecer. Con luna clara usa señuelo oscuro; con oscura, claro.</span></div>'
    +'<div><b>🦀 Roquerío</b><br><span class="muted">±1h de bajamar &lt;0.6m, de día y sin marejada. Corta fronda, no arranques disco.</span></div>'
    +'<div><b>🚣 Kayak/bote</b><br><span class="muted">Prefiere pleamar y viento calmo. Revisa viento + marejada; lleva chaleco y VHF/celular seco.</span></div>'
    +'<div><b>🦅 Aves Rocuant</b><br><span class="muted">Pleamar concentra limícolas; amanecer = canto. Ver 🦅 Aves.</span></div>'
    +'</div></div>';

  html+='<p class="muted su-eced32">Fuente: tabla SHOA Talcahuano precargada 19–28 ago + estimación lunar el resto del año (*est.). Para navegación, buceo o faena: confirma siempre en <a href="https://www.shoa.cl/php/mareas.php" target="_blank" rel="noopener">shoa.cl → Mareas</a> · Avisos de marejada: <a href="https://www.directemar.cl/" target="_blank" rel="noopener">Directemar</a> · Marea roja/vedas: <a href="https://www.sernapesca.cl/" target="_blank" rel="noopener">sernapesca.cl</a> · Emergencia: <a href="https://www.senapred.cl/" target="_blank" rel="noopener">Senapred</a> 137 Armada.</p>';
  panel.innerHTML = html;
  try {
    const toDayBtn = $('tidesToDayBtn');
    if (toDayBtn) toDayBtn.onclick = () => enviarMareasAlDia();
  } catch (e) {}
  try{
    panel.querySelectorAll('[data-tide-day]').forEach(b=>{
      b.onclick=()=>{ window._tideSelOffset=+b.getAttribute('data-tide-day'); try{ renderTidesPanel3(); }catch(e){} };
    });
  }catch(e){}
  try{
    panel.querySelectorAll('[data-tide-send-day]').forEach(b=>{
      b.onclick=()=>{
        try{
          const k=b.getAttribute('data-tide-send-day');
          const md=k.slice(5);
          const r=(typeof getTidesForKey==='function'?getTidesForKey(md):null);
          const arr=r?r.tides:[];
          const txt='🌊 Mareas '+k+': '+arr.map(t=>(t.t==='pleamar'?'⬆️':'⬇️')+' '+t.t+' '+t.h+' · '+t.a).join(' → ')+(r&&r.estimated?' (*est.)':'');
          if(window.InfoClave&&typeof window.InfoClave.guardarEnDia==='function') window.InfoClave.guardarEnDia('Mareas',txt,k,'nota');
        }catch(e){ try{alert('No se pudo agregar al día.');}catch(e2){} }
      };
    });
  }catch(e){}
  try{
    panel.querySelectorAll('[data-tide-copy]').forEach(b=>{
      b.onclick=()=>{
        try{
          const k=b.getAttribute('data-tide-copy');
          const md=k.slice(5);
          const r=(typeof getTidesForKey==='function'?getTidesForKey(md):null);
          const arr=r?r.tides:[];
          const txt='🌊 Mareas '+k+': '+arr.map(t=>(t.t==='pleamar'?'⬆️':'⬇️')+' '+t.t+' '+t.h+' · '+t.a).join(' → ');
          if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(()=>{ try{const s=$('statusMsg'); if(s){s.textContent='Copiado ✓'; setTimeout(()=>{s.textContent='';},2000);} }catch(e){} });
          else prompt('Copia las mareas:',txt);
        }catch(e){}
      };
    });
  }catch(e){}
}

// Guarda la marea actual + las 2 siguientes en la pantalla del día de hoy.
function enviarMareasAlDia() {
  try {
    const todayKey = cal.fmtKey.format(new Date());
    const ahoraHM = cal.fmtTime.format(new Date());
    const now = new Date();
    const keyOf = (diff) => { const d = new Date(now.getTime()); d.setDate(d.getDate() + diff); return cal.fmtKey.format(d); };
    const hoy = (getTidesForKey(todayKey.slice(5)).tides) || [];
    const ayer = (getTidesForKey(keyOf(-1).slice(5)).tides) || [];
    const man = (getTidesForKey(keyOf(1).slice(5)).tides) || [];
    let res = { actual: null, siguientes: [] };
    if (window.InfoClave && typeof window.InfoClave.mareasActuales === 'function') {
      res = window.InfoClave.mareasActuales(ahoraHM, hoy, ayer, man);
    } else {
      res.siguientes = hoy.slice(0, 3).map(t => ({ h: t.h, a: t.a, t: t.t, dia: 0 }));
    }
    if (!res.actual && !res.siguientes.length) { alert('Sin pronóstico de mareas para hoy.'); return; }
    const fmt = (window.InfoClave && window.InfoClave.textoMarea) || ((mm) => (mm.t === 'pleamar' ? '⬆️' : '⬇️') + ' ' + mm.t + ' ' + mm.h + (mm.a ? ' · ' + mm.a : ''));
    const fechaCorta = cal.fmtDate.format(new Date());
    let texto = '🌊 Mareas Talcahuano ' + fechaCorta + ': ';
    texto += res.actual ? 'actual ' + fmt(res.actual) : 'sin marea actual aún';
    res.siguientes.forEach((s) => { texto += ' → ' + fmt(s); });
    if (window.InfoClave && typeof window.InfoClave.guardarEnDia === 'function') {
      window.InfoClave.guardarEnDia('Mareas', texto, todayKey, 'nota');
    } else {
      const ref = lunaMapForKey(todayKey);
      if (!ref || ref.luna === 'dft') { alert('Hoy es DFT: las mareas no aplican igual.'); return; }
      const cell = dayCell(ref.luna, ref.diaN);
      const linea = '[Mareas] ' + texto;
      cell.nota = cell.nota ? cell.nota + '\n' + linea : linea;
      scheduleSave('Agregado al día ✓');
      renderCurrentView();
    }
  } catch (e) { try { alert('No se pudo agregar la marea al día.'); } catch (e2) {} }
}

$('btnEkadashi').onclick = () => { renderEkadashi(); $('ekadashiDialog').showModal(); };
$('ekadashiClose').onclick = () => $('ekadashiDialog').close();
if ($('ekadashiCloseTop')) $('ekadashiCloseTop').onclick = () => $('ekadashiDialog').close();

function ekadashiListForCycle() {
  const list = [];
  for (const dd of cycle.days) {
    const t = window.astro.tithi(dd.noonMs);
    if (t === 11 || t === 26) {
      list.push({ dd, tithi: t, paksha: t === 11 ? 'Shukla' : 'Krishna', badge: t === 11 ? 'shukla' : 'krishna' });
    }
  }
  return list;
}

function getEkadashiVisibleKeys() {
  if (currentView.tipo === 'dft') return ['13', 'dft', '1'];
  const cur = currentView.luna;
  const keys = [];
  for (let i = 0; i < 3; i++) keys.push(String(((cur - 1 + i) % 13) + 1));
  return keys;
}

function renderEkadashi() {
  const intro = $('ekadashiIntro');
  intro.innerHTML = `
    <div class="eka-tabs su-a2761b">
      <button type="button" data-eka-tab="resumen" class="btn eka-tab su-43351a">📖 Resumen</button>
      <button type="button" data-eka-tab="ayuno" class="btn eka-tab">🍵 Ayuno</button>
      <button type="button" data-eka-tab="historia" class="btn eka-tab">📜 Historia</button>
      <button type="button" data-eka-tab="fechas" class="btn eka-tab">📅 Fechas ↓</button>
    </div>
    <div data-eka-panel="resumen">
      <div class="su-389104">
        <p class="su-9c571d"><b>📿 ¿Qué es Ekadashi?</b> En sánscrito <i>eka-dasha</i> = once. Es el <b>día 11</b> de cada quincena lunar: <b class="su-529a5a">Shukla</b> (creciente) y <b class="su-671f21">Krishna</b> (menguante).</p>
        <p class="muted su-e13d76">Cálculo astronómico: elongación Sol-Luna /12° = tithi. Mostramos el día que el tithi 11 ó 26 cae al amanecer en America/Santiago.</p>
      </div>
      <div class="su-2a51d0">
        <div class="su-5cc4d8"><b class="su-e39eba">🌙 ¿Por qué importa?</b><p class="muted su-954796">La luna mueve mareas y tu agua interna. Ekadashi es un <b>recordatorio</b> para aligerar digestión y mente. <a href="#" data-eka-goto="ayuno" class="su-a80552">Ver guía de ayuno →</a></p></div>
        <div class="su-5cc4d8"><b class="su-e39eba">📜 ¿De dónde viene?</b><p class="muted su-954796">Día querido por Vishnu, diosa que vence al demonio Murdanava, Krishna lo explica a Yudhishthira. <a href="#" data-eka-goto="historia" class="su-a80552">Leer historia →</a></p></div>
      </div>
      <details class="su-4e7955"><summary class="su-49b201">🥗 Práctica en 4 pasos (resumen)</summary>
        <ol class="su-74b498">
          <li><b>Víspera (Dashami):</b> cena liviana antes de las 20:00.</li>
          <li><b>Ekadashi:</b> sin granos/legumbres/carnes/alcohol. Fruta, verdura, agua, infusiones.</li>
          <li><b>Actitud:</b> calma, caminata, meditar 10 min.</li>
          <li><b>Parana (Dwadashi):</b> rompe tras el amanecer con agua + fruta.</li>
        </ol>
      </details>
      <details class="su-4e7955"><summary class="su-49b201">⚠️ Precauciones</summary>
        <p class="muted su-1db776">Sin ayuno total si hay embarazo, lactancia, diabetes insulino-dependiente, TCA o medicación con comida. Adapta o consulta. Precisión ±1 día según linaje.</p>
      </details>
    </div>
    <div data-eka-panel="ayuno" class="su-6b99de">
      <div class="su-3fc5a8">
      <p class="su-46a625"><b>🍵 El ayuno no es castigo, es descanso.</b> Elige tu nivel sin culpa:</p>
      <div class="su-2a51d0">
        <div class="su-1a720d"><b class="su-e430b4">🌱 Nivel 1 — Suave</b><p class="muted su-954796">Sin carnes, alcohol ni ultraprocesados. Fruta + verdura cocida + frutos secos. Ideal si trabajas o cuidas a otros.</p></div>
        <div class="su-1a720d"><b class="su-bb34f9">🍎 Nivel 2 — Phalahara</b><p class="muted su-954796">Solo fruta, frutos secos, leche/yogur si toleras, agua e infusiones. Sin arroz, pan, fideos, porotos, lentejas, avena ni mote.</p></div>
        <div class="su-1a720d"><b class="su-3ff3c2">💧 Nivel 3 — Líquidos</b><p class="muted su-954796">Agua, limón/miel, manzanilla, boldo, matico, jugos colados. Solo con experiencia y sin trabajo físico exigente.</p></div>
        <div class="su-1a720d"><b class="su-4c8285">🌑 Nivel 4 — Nirjala</b><p class="muted su-954796">Sin agua ni comida de amanecer a amanecer. <b>Solo con guía</b> (1 vez/año). No lo intentes sin preparación.</p></div>
      </div>
      <div class="su-2a51d0">
        <div class="su-90e0b8"><b class="su-e430b4">✅ SÍ</b><ul class="su-b3588d"><li>Frutas, papas, camote, zapallo, zanahoria</li><li>Maní, nuez, almendra, leche, yogur</li><li>Miel, agua, limonada, infusiones</li></ul></div>
        <div class="su-e90bf0"><b class="su-4c8285">🚫 NO</b><ul class="su-b3588d"><li>Arroz, pan, fideos, avena, mote, quinoa</li><li>Porotos, lentejas, garbanzos, soya</li><li>Carnes, embutidos, huevo, alcohol, frituras</li></ul></div>
      </div>
      <b class="su-a40df9">🕰️ Horario (America/Santiago)</b>
      <ol class="su-4f29fd">
        <li><b>Dashami:</b> cena liviana antes de las 20:00 (sopa + fruta).</li>
        <li><b>Ekadashi:</b> agua tibia + limón al amanecer, medita 10–20 min, come ligero solo con hambre real.</li>
        <li><b>Dwadashi (parana):</b> rompe 2–3 h tras el amanecer con agua + fruta + cocido suave.</li>
      </ol>
      <b class="su-a40df9">🧺 Ejemplo Penco</b>
      <p class="muted su-a6c067">Mañana: agua tibia + manzana + nueces · Mediodía: papas con zapallo + manzanilla · Tarde: plátano + yogur · Noche: sopa colada o boldo/matico.</p>
      </div>
    </div>
    <div data-eka-panel="historia" class="su-6b99de">
      <div class="su-b54cc2">
      <p class="su-edfca6"><b>📜 Origen.</b> <i>Eka+dasha</i> = once. Puranas (Padma, Garuda, Skanda) lo llaman el día querido por <b>Vishnu</b>.</p>
      <p class="su-edfca6"><b>La diosa Ekadashi.</b> El demonio Murdanava no podía ser vencido. Vishnu descansó en una cueva; Murdanava entró a matarlo y de la respiración de Vishnu nació una joven luminosa que lo derrotó. Vishnu la nombró <b>Ekadashi</b>: quien ayune en su día hallará claridad.</p>
      <p class="su-edfca6"><b>Krishna y Yudhishthira</b> (Mahabharata) narran cada Ekadashi con su nombre y fruto — origen de la lista actual.</p>
      <b class="su-8188d6">🌙 Los 24 del año</b>
      <div class="su-071f4d">
        <b>Ene–Feb:</b> Putrada · Shat-tila · Jaya · Vijaya<br>
        <b>Mar–Abr:</b> Amalaki · Papmochani · Kamada · Varuthini<br>
        <b>May–Jun:</b> Mohini · Apara · ⭐ <b>Nirjala</b> · Yogini<br>
        <b>Jul–Ago:</b> ⭐ <b>Devshayani</b> (Vishnu duerme) · Kamika · Pavitropana · Aja<br>
        <b>Sep–Oct:</b> Parivartini · Indira · Papankusha · Rama<br>
        <b>Nov–Dic:</b> ⭐ <b>Devutthana</b> (Vishnu despierta) · Utpanna · Mokshada · Saphala
      </div>
      <p class="su-db4e5c"><b>Símbolo:</b> 5 sentidos + 5 acciones + mente = 11. Ekadashi = gobernar los once.</p>
      <p class="muted su-1b014d">Chaitanya (s. XVI) y Gandhi lo practicaron. Aquí lo unimos a las 13 lunas y la marea. 📚 Padma Purana, Garuda Purana, Ekadashi Mahatmya.</p>
      </div>
    </div>
    <div class="su-b90b2d">Mostrando solo <b>3 lunas</b> contando la actual: <span id="ekadashiScope"></span> · <a href="#" id="ekadashiShowAll" class="su-a80552">ver ciclo completo</a></div>`;
  (function wireEkaTabs(){
    const tabs = intro.querySelectorAll('[data-eka-tab]');
    const panels = intro.querySelectorAll('[data-eka-panel]');
    function paint(active){
      tabs.forEach(b=>{
        const on = b.getAttribute('data-eka-tab')===active;
        b.style.borderColor = on ? 'var(--gold)' : '';
        b.style.background = on ? 'var(--gold)' : '';
        b.style.color = on ? '#10142c' : '';
        b.style.fontWeight = on ? '700' : '';
      });
      panels.forEach(p=>{ p.style.display = p.getAttribute('data-eka-panel')===active ? '' : 'none'; });
    }
    function gotoTab(name){
      if(name==='fechas'){ paint('resumen'); const lst=$('ekadashiList'); if(lst){ lst.scrollIntoView({behavior:'smooth',block:'start'}); } return; }
      paint(name);
    }
    tabs.forEach(b=>{ b.onclick=(e)=>{ e.preventDefault(); gotoTab(b.getAttribute('data-eka-tab')); }; });
    intro.querySelectorAll('[data-eka-goto]').forEach(a=>{ a.onclick=(e)=>{ e.preventDefault(); gotoTab(a.getAttribute('data-eka-goto')); }; });
  })();
  const list = ekadashiListForCycle();
  const byLuna = {};
  for (const item of list) {
    const key = item.dd.luna === 'dft' ? 'dft' : String(item.dd.luna);
    if (!byLuna[key]) byLuna[key] = [];
    byLuna[key].push(item);
  }
  let visibleKeys = getEkadashiVisibleKeys();
  let showAll = false;
  const box = $('ekadashiList');
  const hint = $('ekadashiHint');
  function buildHTML(keys) {
    let html = '';
    for (const k of keys) {
      const arr = byLuna[k];
      if (!arr || !arr.length) {
        const labelEmpty = k === 'dft' ? 'Día Fuera del Tiempo' : `Luna ${k} · ${MOONS[+k - 1].nombre}`;
        html += `<div class="ek-luna"><h4 class="su-18a706">${labelEmpty} <span class="su-7e3a94">· sin Ekadashi en esta luna</span></h4><p class="muted su-6cb285">No cae tithi 11/26 en estos 28 días. La descripción de la luna: <i>${k !== 'dft' ? MOONS[+k - 1].descripcion : DFT.texto1.slice(0,120)+'…'}</i></p></div>`;
        continue;
      }
      const meta = k === 'dft' ? null : MOONS[+k - 1];
      const desc = k === 'dft' ? DFT.texto1 : meta.descripcion;
      const traduccion = k === 'dft' ? 'Víspera del We Tripantu' : meta.traduccion;
      const label = k === 'dft' ? 'Día Fuera del Tiempo' : `Luna ${k} · ${meta.nombre} <span class="su-21bab4">· ${cal.fmtDate.format(new Date(cycle.start + ((+k - 1) * 28) * 86400000))} – ${cal.fmtDate.format(new Date(cycle.start + ((+k - 1) * 28 + 27) * 86400000))}</span>`;
      const isCurrent = currentView.tipo === 'luna' && String(currentView.luna) === k || currentView.tipo === 'dft' && k === 'dft';
      html += `<div class="ek-luna" style="${isCurrent ? 'outline:1px solid var(--gold);border-radius:10px;padding:6px' : ''}"><h4 class="su-38eb9e">${label}</h4><p class="muted su-818aee"><i>${escapeHtml(traduccion)}</i> — ${escapeHtml(desc)}</p>`;
      for (const it of arr) {
        const key = cal.fmtKey.format(new Date(it.dd.noonMs));
        const isToday = key === cal.fmtKey.format(new Date());
        html += `<div class="ek-card${isToday ? ' today' : ''}"><h4>${cal.weekdayName(it.dd.noonMs)} ${cal.fmtFull.format(new Date(it.dd.noonMs))} <span class="ek-badge ${it.badge}">${it.paksha}</span> <span class="su-ea96ac">· tithi ${it.tithi}</span>${isToday ? ' · hoy' : ''}</h4><div class="ek-meta">Luna ${it.dd.luna} · Día ${it.dd.diaN} · ${cal.fmtDate.format(new Date(it.dd.noonMs))}</div></div>`;
      }
      html += '</div>';
    }
    return html;
  }
  const orderAll = [...Array(13).keys()].map(i => String(i + 1)).concat(['dft']);
  box.innerHTML = buildHTML(visibleKeys);
  const scopeEl = document.getElementById('ekadashiScope');
  if (scopeEl) scopeEl.textContent = visibleKeys.map(k => k === 'dft' ? 'DFT' : 'Luna ' + k).join(' · ');
  if (hint) hint.textContent = `Ciclo ${cycle.year}–${cycle.year+1} · ${list.length} Ekadashis en el ciclo`;
  const toggle = document.getElementById('ekadashiShowAll');
  if (toggle) toggle.onclick = (e) => {
    e.preventDefault();
    showAll = !showAll;
    if (showAll) {
      box.innerHTML = buildHTML(orderAll);
      toggle.textContent = 'ver solo 3 lunas';
      if (scopeEl) scopeEl.textContent = 'ciclo completo (13 lunas + DFT)';
    } else {
      box.innerHTML = buildHTML(visibleKeys);
      toggle.textContent = 'ver ciclo completo';
      if (scopeEl) scopeEl.textContent = visibleKeys.map(k => k === 'dft' ? 'DFT' : 'Luna ' + k).join(' · ');
    }
  };
  if (!Object.keys(byLuna).length) box.innerHTML = '<p class="muted">No se encontraron Ekadashis en este ciclo (revisa el cálculo).</p>';
}

$('btnAddUser').onclick = () => {
  $('fUserName').value = '';
  $('userDialog').showModal();
  setTimeout(() => $('fUserName').focus(), 100);
};
$('userCancel').onclick = () => $('userDialog').close();
$('userSave').onclick = () => {
  const nombre = $('fUserName').value.trim();
  if (!nombre) return;
  const id = 'u' + Date.now();
  DATA.usuarios.push({ id, nombre });
  DATA.notas[id] = { cycles: {} };
  DATA.actual = id;
  $('userDialog').close();
  scheduleSave();
  buildSidebar();
  selectCycle(currentCycleYear(), currentView.tipo === 'dft' ? 'dft' : currentView.luna);
};
$('fUserName').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); $('userSave').click(); }
});
$('btnDelUser').onclick = () => {
  if (DATA.usuarios.length <= 1) {
    $('statusMsg').textContent = 'Debe existir al menos un usuario';
    setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
    return;
  }
  const u = DATA.usuarios.find(x => x.id === DATA.actual);
  if (!confirm(`¿Eliminar al usuario "${u.nombre}" y todas sus notas? Esta acción no se puede deshacer.`)) return;
  DATA.usuarios = DATA.usuarios.filter(x => x.id !== DATA.actual);
  delete DATA.notas[u.id];
  DATA.actual = DATA.usuarios[0].id;
  scheduleSave();
  buildSidebar();
  selectCycle(currentCycleYear(), currentView.tipo === 'dft' ? 'dft' : currentView.luna);
};

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function sanitizeText(s, maxLen) {
  let t = (s || '').toString().slice(0, maxLen || 500);
  // elimina caracteres de control peligrosos
  return t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function lunaHTML(y, meta, opts) {
  const cc = cyc(y);
  const start = cal.weTripantuUTC(y);
  const st = ESTACIONES[meta.estacion];
  const rows = [[], [], [], []];
  for (let dia = 1; dia <= 28; dia++) {
    const ms = start + ((meta.n - 1) * 28 + dia - 1) * 86400000;
    const cell = (cc.moons[String(meta.n)].days && cc.moons[String(meta.n)].days[dia]) || { nota: '', agenda: [] };
    const sun = cal.sunForDay(ms);
    const key = cal.fmtKey.format(new Date(ms));
    const evs = (phaseMap[key] || []);
    const agendaHtml = Array.isArray(cell.agenda)&&cell.agenda.length ? `<div class="pd-note">🕐 ${escapeHtml(cell.agenda.map(a=> getAgendaTime(a)+' '+a.text).join(' · '))}</div>` : '';
    rows[Math.floor((dia - 1) / 7)].push(`
      <td>
        <div class="pd-head"><b>${String(dia).padStart(2, '0')}</b> ${escapeHtml(cal.fmtDate.format(new Date(ms)))}</div>
        <div class="pd-sun">☀ ${sun.rise ? escapeHtml(cal.fmtTime.format(new Date(sun.rise))) : '--'}–${sun.set ? escapeHtml(cal.fmtTime.format(new Date(sun.set))) : '--'}</div>
        ${evs.map(e => `<div class="pd-ph">${e.simbolo} ${escapeHtml(e.tipo)} ${escapeHtml(cal.fmtTime.format(new Date(e.utcMs)))}</div>`).join('')}
        ${cell.nota ? `<div class="pd-note">${escapeHtml(cell.nota)}</div>` : ''}
        ${agendaHtml}
      </td>`);
  }
  const chips = [];
  for (let dia = 1; dia <= 28; dia++) {
    const ms = start + ((meta.n - 1) * 28 + dia - 1) * 86400000;
    for (const e of (phaseMap[cal.fmtKey.format(new Date(ms))] || []))
      chips.push(`<span>${e.simbolo} <b>${escapeHtml(e.tipo)}</b> ${escapeHtml(cal.fmtTime.format(new Date(e.utcMs)))}</span>`);
  }
  const note = opts.monthNotes !== false ? `
    <h3 class="pn-title">NOTAS DE LA LUNA ${meta.n}</h3>
    <div class="pn-box">${escapeHtml(cc.moons[String(meta.n)].monthNote) || '&nbsp;'}</div>` : '';
  return `
    <section class="pluna">
      <header>
        <h2>LUNA ${meta.n} de 13 · ${escapeHtml(meta.nombre)}</h2>
        <p class="pmeta">${escapeHtml(meta.traduccion)} · ${escapeHtml(st.nombre)}</p>
        <p class="pdesc">${escapeHtml(meta.descripcion)}</p>
        <p class="pchips">${chips.join(' · ') || ''}</p>
      </header>
      <table><tbody>${rows.map(r => `<tr>${r.join('')}</tr>`).join('')}</tbody></table>
      ${note}
    </section>`;
}

async function exportPDF(fullCycle) {
  const y = currentCycleYear();
  const bodyCss = `
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;margin:18px;}
    h1{text-align:center;color:#3d3462;margin-bottom:2px;} .psub{text-align:center;color:#666;margin:0 0 14px;font-size:12px}
    .pluna{page-break-inside:avoid;margin-bottom:26px;}
    .pluna h2{color:#3d3462;font-size:15pt;margin-bottom:2px;}
    .pmeta{color:#666;font-size:9pt;margin-bottom:4px;} .pdesc{font-style:italic;font-size:9pt;color:#444;margin-bottom:3px;}
    .pchips{font-size:8pt;color:#333;margin-bottom:8px;} .pchips span{margin-right:8px;}
    table{width:100%;border-collapse:collapse;} td{border:1px solid #bbb;padding:5px;height:74px;vertical-align:top;width:14.28%;font-size:7.5pt;}
    .pd-head b{font-size:10pt;color:#3d3462;} .pd-sun{color:#a05a00;} .pd-tide{color:#1c5d8f;}
    .pd-ph{color:#5b3d8f;} .pd-note{white-space:pre-wrap;color:#333;margin-top:2px;}
    .pn-title{font-size:9pt;color:#666;margin-top:8px;} .pn-box{border:1px solid #bbb;border-radius:6px;min-height:52px;padding:6px;font-size:9pt;white-space:pre-wrap;}
    .pdft{page-break-inside:avoid;border:1.5px solid #3d3462;border-radius:8px;padding:14px;margin-bottom:24px;}
    .pdft p{font-size:9.5pt;line-height:1.5;margin:6px 0;} .pdft h2{color:#3d3462;}
  `;
  let inner = '';
  if (fullCycle) {
    for (const m of MOONS) inner += lunaHTML(y, m, { monthNotes: true });
    const cc = cyc(y);
    inner += `
      <section class="pdft">
        <h2>El Día Fuera del Tiempo · 20 jun ${y + 1}</h2>
        <p>${escapeHtml(DFT.texto1)}</p>
        <p><b>${escapeHtml(DFT.sub2)}</b> — ${escapeHtml(DFT.texto2)}</p>
        <p>${escapeHtml(DFT.texto3)}</p>
        <p><b>${escapeHtml(DFT.sub3)}</b> — ${escapeHtml(DFT.texto4)} ${escapeHtml(DFT.texto5)}</p>
        <h3 class="su-0c48f6">REFLEXIÓN DEL CICLO</h3>
        <div class="su-3f72c8">${escapeHtml(cc ? cc.dft.nota : '') || '&nbsp;'}</div>
      </section>`;
  } else {
    if (currentView.tipo === 'dft') {
      const cc = cyc(y);
      inner += `
        <section class="pdft">
          <h2>El Día Fuera del Tiempo · 20 jun ${y + 1}</h2>
          <p>${escapeHtml(DFT.texto1)}</p>
          <p><b>${escapeHtml(DFT.sub2)}</b> — ${escapeHtml(DFT.texto2)}</p>
          <p>${escapeHtml(DFT.texto3)}</p>
          <h3 class="su-0c48f6">REFLEXIÓN DEL CICLO</h3>
          <div class="su-3f72c8">${escapeHtml(cc ? cc.dft.nota : '') || '&nbsp;'}</div>
        </section>`;
    } else {
      inner = lunaHTML(y, MOONS[currentView.luna - 1], { monthNotes: true });
    }
  }
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><style>${bodyCss}</style></head>
    <body><h1>CALENDARIO DE LAS 13 LUNAS</h1><p class="psub">Mari Küla Küyen · Penco, Bío-Bío · Ciclo ${y}–${y + 1} · We Tripantu 21 jun ${y}</p>${inner}</body></html>`;
  const path = await window.api.exportPDF(html);
  if (path) {
    $('statusMsg').textContent = 'PDF guardado ✓';
    setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
  }
}
function bindPdfButtons() {
  const pairs = [['btnPdfLuna', false], ['btnPdfCiclo', true], ['cfgPdfLunaBtn', false], ['cfgPdfCicloBtn', true]];
  pairs.forEach(([id, ciclo]) => {
    try {
      const el = typeof $ === 'function' ? $(id) : document.getElementById(id);
      if (el && !el.dataset.pdfBound) { el.dataset.pdfBound = '1'; el.onclick = () => exportPDF(ciclo); }
    } catch (e) {}
  });
}
try { bindPdfButtons(); } catch (e) {}
setTimeout(function () { try { bindPdfButtons(); } catch (e) {} }, 1200);

$('btnToday').onclick = () => {
  try{ if(isMobileWidth()){ showMobileView('hoy'); return; } }catch(e){}
  const info = todayInfo();
  if (!info) return;
  if (String(info.y) !== $('cycleSel').value) {
    selectCycle(info.y, info.luna === 'dft' ? 'dft' : info.luna);
    return;
  }
  if(viewMode && viewMode!=='luna'){ viewDateMs = Date.now(); renderCurrentView(); }
  if (info.luna === 'dft') selectDFT(); else selectMoon(info.luna);
  // sincronizar vista día/mes/semana con hoy si estaban activas
  if(viewMode && viewMode!=='luna'){ viewDateMs = Date.now(); renderCurrentView(); }
};

$('searchBox').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); runSearch($('searchBox').value.trim()); }
});

function runSearch(q) {
  if (q.length < 2) return;
  const ql = q.toLowerCase();
  const hits = [];
  const cycles = userData().cycles;
  for (const [y, c] of Object.entries(cycles)) {
    for (const [ln, m] of Object.entries(c.moons || {})) {
      for (const [dn, cell] of Object.entries(m.days || {})) {
        const agendaTxt = Array.isArray(cell.agenda) ? cell.agenda.map(a=>(a.time||'')+' '+a.text).join(' ') : '';
        const txt = [cell.nota, agendaTxt].filter(Boolean).join(' ');
        if (txt.toLowerCase().includes(ql)) {
          hits.push({ y: +y, luna: +ln, dia: +dn, txt: txt.slice(0, 140), tipo: 'Notas del día' });
        }
      }
      if ((m.monthNote || '').toLowerCase().includes(ql)) {
        hits.push({ y: +y, luna: +ln, dia: 1, txt: m.monthNote.slice(0, 140), tipo: 'Notas de la luna' });
      }
    }
    if (c.dft && (c.dft.nota || '').toLowerCase().includes(ql)) {
      hits.push({ y: +y, luna: 'dft', dia: 1, txt: c.dft.nota.slice(0, 140), tipo: 'Reflexión del ciclo' });
    }
  }
  const box = $('searchResults');
  box.innerHTML = hits.length ? '' : '<p class="muted">Sin resultados para esa búsqueda.</p>';
  for (const h of hits.slice(0, 60)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'search-hit';
    const where = h.luna === 'dft'
      ? `Día Fuera del Tiempo · ciclo ${h.y}–${h.y + 1}`
      : `Luna ${h.luna}, día ${h.dia} · ciclo ${h.y}–${h.y + 1}`;
    b.innerHTML = `<div class="sh-where">${where} · ${h.tipo}</div><div class="sh-text">${escapeHtml(h.txt)}</div>`;
    b.onclick = () => {
      $('searchDialog').close();
      selectCycle(h.y, h.luna === 'dft' ? 'dft' : h.luna);
      if (h.luna !== 'dft') openDayDialog(h.luna, h.dia);
    };
    box.appendChild(b);
  }
  $('searchDialog').showModal();
}
$('searchClose').onclick = () => $('searchDialog').close();

async function doBackup() {
  const r = await window.api.backupSave(JSON.stringify(DATA, null, 1));
  try { window.cal13backupDone && window.cal13backupDone(); } catch (e) {}
  $('statusMsg').textContent = r ? 'Respaldo guardado ✓' : 'Cancelado';
  setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
}
function bindBackupButtons() {
  ['btnBackup', 'cfgBackupBtn'].forEach((id) => {
    try {
      const el = typeof $ === 'function' ? $(id) : document.getElementById(id);
      if (el && !el.dataset.backupBound) { el.dataset.backupBound = '1'; el.onclick = doBackup; }
    } catch (e) {}
  });
}
try { bindBackupButtons(); } catch (e) {}
setTimeout(function () { try { bindBackupButtons(); } catch (e) {} }, 1200);

// Aplica un respaldo JSON (string) con la validación de siempre.
// La usan 📥 Restaurar (archivo, en ⚙️ Ajustes) y 📲 Traspaso QR (qr-sync-modulo.js, en ⚙️ Ajustes).
// Acepta 2 formatos:
//  - Respaldo TOTAL {usuarios, notas}: reemplaza todo (como antes).
//  - Bitácora INDIVIDUAL {tipo:'bitacora-individual', grupo, datos}:
//    fusiona SOLO esa bitácora, el resto queda intacto.
// Devuelve true si el respaldo se aplicó.
async function applyBackupJSON(j) {
  try {
    const d = JSON.parse(j);
    if (d && d.tipo === 'bitacora-individual' && d.datos && typeof d.datos === 'object') {
      if (typeof window.applyBitacoraJSON === 'function') {
        const ok = await window.applyBitacoraJSON(j);
        if (ok) {
          try { buildSidebar(); } catch {}
          try { selectCycle(currentCycleYear(), currentView.tipo === 'dft' ? 'dft' : currentView.luna); } catch {}
        }
        return ok;
      }
      // Fallback si el módulo de bitácoras aún no cargó: fusión mínima
      const u = userData();
      const keys = Array.isArray(d.claves) && d.claves.length ? d.claves : Object.keys(d.datos);
      keys.forEach(k => { if (d.datos[k] !== undefined) u[k] = d.datos[k]; });
      await window.api.saveData(JSON.stringify(DATA));
      buildSidebar();
      selectCycle(currentCycleYear(), currentView.tipo === 'dft' ? 'dft' : currentView.luna);
      $('statusMsg').textContent = 'Bitácora «' + (d.titulo || d.grupo || '') + '» restaurada ✓ (las demás intactas)';
      setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
      return true;
    }
    if (!d.usuarios || !Array.isArray(d.usuarios) || !d.notas || typeof d.notas !== 'object') throw new Error('formato');
    if (d.usuarios.length === 0 || d.usuarios.length > 50) throw new Error('usuarios');
    // validación básica de estructura y tamaño (evita JSON malicioso gigante)
    const size = JSON.stringify(d).length;
    if (size > 5 * 1024 * 1024) throw new Error('tamaño');
    // sanitizar nombres
    d.usuarios = d.usuarios.map(u => ({ id: String(u.id).slice(0,40), nombre: sanitizeText(u.nombre, 30) }));
    DATA = d;
    if (!DATA.notas[DATA.actual]) DATA.actual = DATA.usuarios[0].id;
    // limpiar fotos legacy si existen en respaldo antiguo
    try { for (const uid of Object.keys(DATA.notas)) { const cycles = DATA.notas[uid].cycles||{}; for (const ck of Object.keys(cycles)) { const c = cycles[ck]; for (const mk of Object.keys(c.moons||{})) { for (const dk of Object.keys(c.moons[mk].days||{})) delete c.moons[mk].days[dk].foto; } } } } catch {}
    await window.api.saveData(JSON.stringify(DATA));
    buildSidebar();
    selectCycle(currentCycleYear(), currentView.tipo === 'dft' ? 'dft' : currentView.luna);
    $('statusMsg').textContent = 'Respaldo restaurado ✓';
    setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
    return true;
  } catch (e) {
    console.warn('Restore error', e);
    $('statusMsg').textContent = 'Archivo de respaldo no válido';
    setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
    return false;
  }
}

async function doRestore() {
  const j = await window.api.backupOpen();
  if (!j) return;
  await applyBackupJSON(j);
}
function bindRestoreButtons() {
  ['btnRestore', 'cfgRestoreBtn'].forEach((id) => {
    try {
      const el = typeof $ === 'function' ? $(id) : document.getElementById(id);
      if (el && !el.dataset.restoreBound) { el.dataset.restoreBound = '1'; el.onclick = doRestore; }
    } catch (e) {}
  });
}
try { bindRestoreButtons(); } catch (e) {}
setTimeout(function () { try { bindRestoreButtons(); } catch (e) {} }, 1200);
try { window.applyBackupJSON = applyBackupJSON; } catch {}
try { window.cal13doBackup = doBackup; window.cal13doRestore = doRestore; } catch {}

function updateRemindBtn() {
  const on = !!(DATA.config && DATA.config.recordar);
  $('btnRemind').textContent = on ? '🔔 Recordatorios ON' : '🔕 Recordatorios OFF';
}

$('btnRemind').onclick = async () => {
  DATA.config = DATA.config || {};
  DATA.config.recordar = !DATA.config.recordar;
  scheduleSave();
  updateRemindBtn();
  if (DATA.config.recordar) {
    try { if (typeof Notification !== 'undefined' && Notification.requestPermission) await Notification.requestPermission(); } catch {}
    checkReminders();
    $('statusMsg').textContent = 'Recordatorios activados ✓';
  } else {
    $('statusMsg').textContent = 'Recordatorios desactivados';
  }
  setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
};

function checkReminders() {
  if (!DATA.config || !DATA.config.recordar) return;
  if (typeof Notification === 'undefined' || Notification.permission === 'denied') return;
  let last;
  try { last = localStorage.getItem('cal13-lastNotify'); } catch {}
  const now = new Date();
  const todayKey = cal.fmtKey.format(now);
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomKey = cal.fmtKey.format(tomorrow);
  const targets = [
    ...(phaseMap[todayKey] || []).map(e => ({ e, when: 'hoy' })),
    ...(phaseMap[tomKey] || []).map(e => ({ e, when: 'mañana' }))
  ];
  if (!targets.length || last === todayKey) return;
  for (const t of targets) {
    try {
      playNotifySound();
      new Notification(`🌕 ${t.e.tipo.replace('-', ' ')} ${t.when}`, {
        body: `${t.e.simbolo} ${t.e.tipo.replace('-', ' ')} — ${cal.fmtTime.format(new Date(t.e.utcMs))} (hora de Chile)`,
        silent:false
      });
    } catch {}
  }
  try { localStorage.setItem('cal13-lastNotify', todayKey); } catch {}
}
setInterval(checkReminders, 30 * 60 * 1000);

// === CICLO MENSTRUAL ===
// === CICLO MENSTRUAL v2 — promedio real, fases, síntomas, estadísticas ===
function getMensData() {
  const u = userData();
  if (!u.menstrual) u.menstrual = { cycleLen: 28, periodLen: 5, history: [], showCal: true, notify: false, autoLen: true, symptoms: {} };
  const m = u.menstrual;
  if (typeof m.cycleLen !== 'number' || !(m.cycleLen >= 20 && m.cycleLen <= 45)) m.cycleLen = 28;
  if (typeof m.periodLen !== 'number' || !(m.periodLen >= 1 && m.periodLen <= 10)) m.periodLen = 5;
  if (!Array.isArray(m.history)) m.history = [];
  if (typeof m.showCal !== 'boolean') m.showCal = true;
  if (typeof m.notify !== 'boolean') m.notify = false;
  if (typeof m.autoLen !== 'boolean') m.autoLen = true;
  if (!m.symptoms || typeof m.symptoms !== 'object' || Array.isArray(m.symptoms)) m.symptoms = {};
  m.history = [...new Set(m.history)].sort();
  return m;
}
function mensKeyToMs(k) { const [y,m,d]=k.split('-').map(Number); return Date.UTC(y,m-1,d,12); }
function mensMsToKey(ms) { return cal.fmtKey.format(new Date(ms)); }
// Intervalos reales entre inicios (días), últimos 6
function mensIntervals() {
  const hist = getMensData().history.slice().sort();
  const out = [];
  for (let i = 1; i < hist.length; i++) {
    const d = Math.round((mensKeyToMs(hist[i]) - mensKeyToMs(hist[i-1])) / 86400000);
    if (d >= 15 && d <= 60) out.push(d);
  }
  return out.slice(-6);
}
function mensAvgLen() {
  const md = getMensData();
  const iv = mensIntervals();
  if (md.autoLen && iv.length) {
    const avg = Math.round(iv.reduce((a,b)=>a+b,0) / iv.length);
    return Math.min(45, Math.max(20, avg));
  }
  return md.cycleLen;
}
function mensStats() {
  const hist = getMensData().history.slice().sort();
  const iv = mensIntervals();
  if (!hist.length) return null;
  const avg = mensAvgLen();
  const min = iv.length ? Math.min(...iv) : null;
  const max = iv.length ? Math.max(...iv) : null;
  const spread = (min !== null && max !== null) ? (max - min) : 0;
  const regular = iv.length >= 2 ? (spread <= 3 ? 'muy regular' : spread <= 7 ? 'regular' : 'irregular') : (hist.length >= 2 ? 'pocos datos' : 'primer registro');
  return { n: hist.length, avg, min, max, spread, regular, last: hist[hist.length-1] };
}
// Fase actual según día del ciclo (1-indexed), adaptada a duración real
function mensPhaseForDay(day, cycleLen, periodLen) {
  const ov = cycleLen - 14; // día ovulación estimada
  if (day <= periodLen) return { id:'menstrual', ico:'🌧️', nombre:'Menstrual · Invierno (Pukem)', consejo:'Descanso, calor local, hierro + vit C. Di que no sin culpa.' };
  if (day < ov - 2) return { id:'folicular', ico:'🌱', nombre:'Folicular · Primavera (Pewü)', consejo:'Energía en subida: planifica, mueve el cuerpo, ordena espacios.' };
  if (day <= ov + 1) return { id:'ovulatoria', ico:'☀️', nombre:'Ovulatoria · Verano (Walüng)', consejo:'Pico fértil y comunicativo: muestra, conversa, decide.' };
  return { id:'lutea', ico:'🍂', nombre:'Lútea · Otoño (Rimü)', consejo:'Baja el ritmo, anida, límites claros, magnesio y dormir temprano.' };
}
function mensCurrentDay() {
  try {
    const hist = getMensData().history.slice().sort();
    if (!hist.length) return null;
    const todayKey = cal.fmtKey.format(new Date());
    const last = hist[hist.length-1];
    const diff = Math.floor((mensKeyToMs(todayKey) - mensKeyToMs(last)) / 86400000);
    if (diff < 0) return null;
    const avg = mensAvgLen();
    return { day: (diff % avg) + 1, sinceLast: diff, last, avg };
  } catch { return null; }
}
function getMensPredictions() {
  const md = getMensData();
  const hist = md.history.slice().sort();
  if (!hist.length) return null;
  const cycleLen = mensAvgLen();
  const periodLen = md.periodLen;
  const nowKey = cal.fmtKey.format(new Date());
  const nowMs = mensKeyToMs(nowKey);
  const probe = mensKeyToMs(hist[hist.length-1]);
  let nextPeriodMs = probe;
  if (hist.includes(nowKey)) nextPeriodMs = mensKeyToMs(nowKey);
  else { while (nextPeriodMs < nowMs) nextPeriodMs += cycleLen*86400000; }
  const st = mensStats();
  const variability = st && st.spread ? Math.min(3, Math.ceil(st.spread / 2)) : 1;
  const winStart = nextPeriodMs - variability*86400000;
  const winEnd = nextPeriodMs + variability*86400000;
  const periodEnd = nextPeriodMs + (periodLen-1)*86400000;
  const ovulationMs = nextPeriodMs + (cycleLen - 14)*86400000;
  const fertileStart = ovulationMs - 4*86400000;
  const fertileEnd = ovulationMs + 1*86400000;
  const map = {};
  const pred = [];
  for (let i=-1; i<5; i++) {
    const pStart = nextPeriodMs + i*cycleLen*86400000;
    const pEnd = pStart + (periodLen-1)*86400000;
    const ov = pStart + (cycleLen-14)*86400000;
    const fS = ov - 4*86400000, fE = ov + 1*86400000;
    pred.push({ pStart, pEnd, ov, fS, fE });
    for (let d=pStart; d<=pEnd; d+=86400000) map[mensMsToKey(d)] = 'period';
    for (let d=fS; d<=fE; d+=86400000) if(!map[mensMsToKey(d)]) map[mensMsToKey(d)] = 'fertile';
    map[mensMsToKey(ov)]='ovulation';
  }
  hist.forEach(k=>{
    const ms = mensKeyToMs(k);
    for(let d=ms; d<ms+periodLen*86400000; d+=86400000) map[mensMsToKey(d)]='period';
  });
  return { md, hist, cycleLen, periodLen, nextPeriodMs, winStart, winEnd, variability, periodEnd, ovulationMs, fertileStart, fertileEnd, map, pred };
}
function mensLunaForKey(key) {
  const ms = mensKeyToMs(key);
  for (const y of CYCLE_YEARS) {
    const c = cal.buildCycle(y);
    for (const d of c.days) if (mensMsToKey(d.noonMs)===key) return { y, luna: d.luna, dia: d.diaN };
  }
  return null;
}
function mensRefreshAll() {
  try { renderMensTodayBanner(); } catch {}
  try { renderMensStats(); } catch {}
  try { renderMensPredictBox(); } catch {}
  try { renderMensLunaBox(); } catch {}
  try { renderMensPhaseBox(); } catch {}
  try { renderMensHistory(); } catch {}
  try { renderMensSymptToday(); } catch {}
  try { if (getMensData().showCal && typeof renderLuna === 'function') renderLuna(); } catch {}
}
function renderMensTodayBanner() {
  const box = $('mensTodayBanner'); if (!box) return;
  const cur = mensCurrentDay();
  const pred = getMensPredictions();
  if (!cur) { box.innerHTML = '<span>🌸 Sin registros aún — marca tu último inicio en la pestaña <b>📝 Registro</b> y verás tu día, fase y predicción aquí.</span>'; return; }
  const ph = mensPhaseForDay(cur.day, cur.avg, getMensData().periodLen);
  const daysLeft = pred ? Math.round((pred.nextPeriodMs - mensKeyToMs(cal.fmtKey.format(new Date()))) / 86400000) : null;
  const pct = Math.min(100, Math.round(cur.day / cur.avg * 100));
  const leftTxt = daysLeft === null ? '' : daysLeft === 0 ? '· periodo <b>hoy</b>' : daysLeft === 1 ? '· periodo <b>mañana</b>' : `· próximo periodo en <b>${daysLeft} días</b>`;
  box.innerHTML = `<div class="mens-banner-top"><span class="mens-banner-day">Día ${cur.day}/${cur.avg} ${ph.ico}</span><span class="mens-banner-phase">${ph.nombre}</span></div>`
    + `<div class="mens-progress"><div class="mens-progress-fill" style="width:${pct}%"></div></div>`
    + `<div class="mens-banner-sub">${ph.consejo} ${leftTxt}</div>`;
}
function renderMensStats() {
  const box = $('mensStatsBox'); if (!box) return;
  const st = mensStats();
  if (!st) { box.innerHTML = '<p class="muted su-1db776">Con 2+ inicios calculo tu promedio real y regularidad.</p>'; return; }
  const auto = getMensData().autoLen && st.n >= 2;
  box.innerHTML = `<div class="mens-stat-grid">`
    + `<div class="mens-stat"><b>${st.avg}d</b><span>promedio${auto?' ● auto':''}</span></div>`
    + `<div class="mens-stat"><b>${st.n}</b><span>ciclos</span></div>`
    + `<div class="mens-stat"><b>${st.min !== null ? st.min + '–' + st.max + 'd' : '—'}</b><span>rango</span></div>`
    + `<div class="mens-stat"><b>${st.regular}</b><span>ritmo</span></div>`
    + `</div>`
    + (st.spread > 7 ? '<p class="mens-warn">⚠️ Variación &gt;7 días: tu ritmo es irregular — las fechas son orientativas. Si se mantiene, consúltalo con tu matrona.</p>' : '')
    + (getMensData().periodLen >= 8 ? '<p class="mens-warn">⚠️ Sangrado de 8+ días registrado: si se repite, consúltalo.</p>' : '');
}
function renderMensPredictBox() {
  const box = $('mensPredictBox');
  if (!box) return;
  const pred = getMensPredictions();
  const md = getMensData();
  if (!pred) {
    box.innerHTML = `<h4 class="su-e39eba">🔮 Predicción</h4><p class="muted">Aún sin registros. Agrega tu último inicio en <b>📝 Registro</b>.</p><p class="muted su-11a508">13 lunas × 28 días = 364 días. Muchas personas con ciclos de 27-30 días notan sincronía cuerpo-luna — úsalo como ritual, no como diagnóstico.</p>`;
    return;
  }
  const fmt = d=> cal.fmtFull.format(new Date(d));
  const wk = d=> cal.weekdayName(d);
  const nextKey = mensMsToKey(pred.nextPeriodMs);
  const lunaInfo = mensLunaForKey(nextKey);
  const lunaTxt = lunaInfo ? `Luna ${lunaInfo.luna} · Día ${lunaInfo.dia} · ${lunaInfo.luna==='dft'?'Día Fuera del Tiempo':MOONS[lunaInfo.luna-1].nombre}` : '';
  const daysUntil = Math.round((pred.nextPeriodMs - mensKeyToMs(cal.fmtKey.format(new Date())))/86400000);
  const untilTxt = daysUntil===0? '¡hoy!': daysUntil===1? 'mañana': `en ${daysUntil} días`;
  const rangeTxt = pred.variability > 0 ? `${mensMsToKey(pred.winStart)} → ${mensMsToKey(pred.winEnd)}` : nextKey;
  const src = getMensData().autoLen && pred.hist.length >= 2 ? `promedio real ${pred.cycleLen}d (${pred.hist.length} ciclos)` : `ciclo ref ${pred.cycleLen}d`;
  box.innerHTML = `
    <h4 class="su-e39eba">🔮 Predicción · ${src}</h4>
    <div class="mens-pred-grid">
      <div class="mens-pred-item period"><span class="mens-dot period"></span><b>Próximo periodo</b><span>${wk(pred.nextPeriodMs)} ${fmt(pred.nextPeriodMs)} — ${untilTxt}</span><span class="su-1fd8c8">${lunaTxt}</span><span class="su-11a508">Sangrado hasta ${fmt(pred.periodEnd)} · ventana ±${pred.variability}d: ${rangeTxt}</span></div>
      <div class="mens-pred-item fertile"><span class="mens-dot fertile"></span><b>Ventana fértil</b><span>${fmt(pred.fertileStart)} → ${fmt(pred.fertileEnd)}</span><span class="su-1fd8c8">~ ovulación ${fmt(pred.ovulationMs)}</span></div>
      <div class="mens-pred-item ovulation"><span class="mens-dot ovulation"></span><b>Ovulación estimada</b><span>${wk(pred.ovulationMs)} ${fmt(pred.ovulationMs)}</span><span class="su-1fd8c8">día ${pred.cycleLen-14} del ciclo (ciclo−14)</span></div>
    </div>
    <p class="muted su-e6fe60">Próximos 3: ${pred.pred.slice(0,3).map(p=>mensMsToKey(p.pStart)).join(' · ')}.<br>Estimación estadística; tu cuerpo es soberano. Si buscas o evitas embarazo, usa método adicional.</p>`;
}
function renderMensLunaBox() {
  const box = $('mensLunaBox'); if(!box) return;
  const pred = getMensPredictions();
  if (!pred || !pred.nextPeriodMs) { box.innerHTML = ''; return; }
  const info = mensLunaForKey(mensMsToKey(pred.nextPeriodMs));
  if (!info) { box.innerHTML=''; return;}
  const meta = info.luna==='dft'? null : MOONS[info.luna-1];
  box.innerHTML = `<h4 class="su-a80552">🌙 Tu próximo periodo y la luna</h4><p class="su-0cd86b">Cae en <b>${info.luna==='dft'?'Día Fuera del Tiempo':`Luna ${info.luna} · ${meta.nombre}`}</b> (día ${info.dia} de 28). <i>${info.luna==='dft'?DFT.texto1.slice(0,140)+'…':meta.descripcion}</i></p><p class="muted su-11a508">En el calendario verás 🌸 período · 🌿 fértil · ✨ ovulación. La luna perfecta no exige regularidad perfecta.</p>`;
}
function renderMensPhaseBox() {
  const box = $('mensPhaseBox'); if (!box) return;
  const cur = mensCurrentDay();
  if (!cur) { box.innerHTML = ''; return; }
  const L = cur.avg;
  const P = getMensData().periodLen;
  const ov = L - 14;
  const f = (a,b,label,ico) => { const on = cur.day >= a && cur.day <= b; return `<div class="mens-phase ${on?'on':''}"><span>${ico}</span><b>${label}</b><small>días ${a}–${b}</small></div>`; };
  box.innerHTML = `<h4>🌀 Tu fase hoy — día ${cur.day}</h4><div class="mens-phase-row">`
    + f(1, P, 'Menstrual', '🌧️') + f(P+1, ov-3, 'Folicular', '🌱') + f(Math.max(P+1,ov-2), ov+1, 'Ovulatoria', '☀️') + f(ov+2, L, 'Lútea', '🍂')
    + `</div><p class="muted su-1db776">${mensPhaseForDay(cur.day, L, P).consejo} <button type="button" id="mensGoHorm" class="btn su-43fa01">Ver en 🧬 Hormonas</button></p>`;
  const b = $('mensGoHorm'); if (b) b.onclick = () => mensSwitchTab('Hormonas');
}
function mensSymptLabel(s) {
  if (!s) return '';
  const parts = [];
  if (s.flow === 'manchado') parts.push('💧 manchado');
  if (s.flow === 'ligero') parts.push('🩸 ligero');
  if (s.flow === 'moderado') parts.push('🩸🩸 moderado');
  if (s.flow === 'abundante') parts.push('🩸🩸🩸 abundante');
  if (s.pain !== '' && s.pain !== undefined && s.pain !== null) parts.push(`dolor ${s.pain}/10`);
  if (s.energy === 'baja') parts.push('🔋 baja');
  if (s.energy === 'media') parts.push('🔋🔋 media');
  if (s.energy === 'alta') parts.push('🔋🔋🔋 alta');
  if (s.mood === 'sensible') parts.push('🌧️ sensible');
  if (s.mood === 'estable') parts.push('🌤️ estable');
  if (s.mood === 'creativa') parts.push('✨ creativa');
  if (s.mood === 'irritable') parts.push('⛈️ irritable');
  if (s.note) parts.push('“' + s.note + '”');
  return parts.join(' · ');
}
function renderMensSymptToday() {
  const box = $('mensSymptTodayBox'); if (!box) return;
  const today = cal.fmtKey.format(new Date());
  const s = getMensData().symptoms[today];
  box.innerHTML = `<h4>💗 Hoy ${today}</h4>` + (s ? `<p class="su-6cb285">${escapeHtml(mensSymptLabel(s))}</p>` : '<p class="muted su-11a508">Aún no registras cómo estás hoy. Usa el formulario de arriba.</p>');
}
function renderMensHistory() {
  const box = $('mensHistoryBox'); if(!box) return;
  const md = getMensData();
  if (!md.history.length) { box.innerHTML = '<h4>📜 Historial</h4><p class="muted">Sin registros aún. Usa “Registrar hoy” o el botón 🌸 en cada día del calendario.</p>'; return; }
  const sorted = md.history.slice().sort().reverse().slice(0,24);
  const full = md.history.slice().sort();
  box.innerHTML = `<h4>📜 Historial — ${md.history.length} inicios</h4><div class="mens-history">`+ sorted.map(k=>{
    const ms = mensKeyToMs(k);
    const luna = mensLunaForKey(k);
    const lunaTxt = luna? `· Luna ${luna.luna} d${luna.dia}`: '';
    const idx = full.indexOf(k);
    const prev = idx > 0 ? full[idx-1] : null;
    const gap = prev ? Math.round((mensKeyToMs(k)-mensKeyToMs(prev))/86400000) : null;
    const gapTxt = gap ? ` · <span class="chip su-0d5be0">+${gap}d</span>` : ' · <span class="muted su-0d5be0">primero</span>';
    const isLast = k===md.history[md.history.length-1];
    const sym = md.symptoms[k];
    const symTxt = sym ? `<br><span class="muted su-0d5be0">${escapeHtml(mensSymptLabel(sym))}</span>` : '';
    return `<div class="mens-hist-item"><span>${cal.weekdayName(ms)} ${cal.fmtFull.format(new Date(ms))} ${lunaTxt}${gapTxt} ${isLast?'<span class="su-e39eba">· último</span>':''}${symTxt}</span><button data-k="${k}" class="btn btn-icon mens-del" title="Eliminar">✕</button></div>`;
  }).join('') + `</div><p class="muted su-d47a97">+Nd = días desde el inicio anterior. Ideal 21–35. Toca ✕ para corregir un error.</p>`;
  box.querySelectorAll('.mens-del').forEach(b=> b.onclick=()=>{
    const k=b.dataset.k;
    const md2=getMensData();
    md2.history = md2.history.filter(x=>x!==k);
    try { delete md2.symptoms[k]; } catch {}
    scheduleSave();
    mensRefreshAll();
  });
}
function mensSwitchTab(which) {
  const panels = { Resumen:'mensPanelResumen', Registro:'mensPanelRegistro', Hormonas:'mensPanelHormonas', Historial:'mensPanelHistorial', Guia:'mensPanelGuia' };
  Object.entries(panels).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('hidden', k!==which); });
  ['Resumen','Registro','Hormonas','Historial','Guia'].forEach(k=>{ const el=$('tabMens'+k); if(el) el.classList.toggle('btn-accent', k===which); });
  if (which === 'Hormonas') setTimeout(setupHormonalChart, 60);
}
function openMensDialog() {
  const md = getMensData();
  $('mensCycleLen').value = md.cycleLen;
  $('mensPeriodLen').value = md.periodLen;
  const au = $('mensAutoLen'); if (au) au.checked = md.autoLen !== false;
  $('mensShowCal').checked = md.showCal;
  $('mensNotify').checked = md.notify;
  $('mensLastDate').value = md.history.length? md.history[md.history.length-1]: '';
  mensSwitchTab('Resumen');
  mensRefreshAll();
  try { $('menstrualDialog').showModal(); } catch {}
}
function mensCheckNotify() {
  const md = getMensData();
  if (!md.notify || !md.history.length) return;
  if (typeof Notification==='undefined' || Notification.permission!=='granted') return;
  const pred = getMensPredictions(); if(!pred) return;
  const todayKey = cal.fmtKey.format(new Date());
  const tomorrowKey = mensMsToKey(mensKeyToMs(todayKey)+86400000);
  const nextKey = mensMsToKey(pred.nextPeriodMs);
  if (tomorrowKey===nextKey) {
    const lastNot = localStorage.getItem('mens-lastNotify');
    if (lastNot===todayKey) return;
    try{ playNotifySound(); new Notification('🌸 Ciclo — mañana periodo', { body: `Predicción: mañana ${cal.fmtFull.format(new Date(pred.nextPeriodMs))} · ${mensLunaForKey(nextKey)? 'Luna '+mensLunaForKey(nextKey).luna:''}`, silent:false}); localStorage.setItem('mens-lastNotify', todayKey);}catch{}
  }
}
function setupMensDialogEvents() {
  const btn = $('btnMenstrual'); if (btn) btn.onclick = openMensDialog;
  const cTop = $('menstrualCloseTop'), cBot = $('menstrualClose');
  if (cTop) cTop.onclick = ()=> $('menstrualDialog').close();
  if (cBot) cBot.onclick = ()=> $('menstrualDialog').close();
  ['Resumen','Registro','Hormonas','Historial','Guia'].forEach(k=>{
    const el = $('tabMens'+k); if (el) el.onclick = ()=> mensSwitchTab(k);
  });
  const cycIn = $('mensCycleLen'), perIn = $('mensPeriodLen'), showIn = $('mensShowCal'), notIn = $('mensNotify'), autoIn = $('mensAutoLen');
  if (cycIn) cycIn.onchange = ()=>{ const v=parseInt(cycIn.value)||28; getMensData().cycleLen=Math.min(45,Math.max(20,v)); getMensData().autoLen=false; if(autoIn) autoIn.checked=false; cycIn.value=getMensData().cycleLen; scheduleSave(); mensRefreshAll(); };
  if (autoIn) autoIn.onchange = ()=>{ getMensData().autoLen=autoIn.checked; if(autoIn.checked){ const a=mensAvgLen(); getMensData().cycleLen=a; if(cycIn) cycIn.value=a; } scheduleSave(); mensRefreshAll(); };
  if (perIn) perIn.onchange = ()=>{ const v=parseInt(perIn.value)||5; getMensData().periodLen=Math.min(10,Math.max(1,v)); perIn.value=getMensData().periodLen; scheduleSave(); mensRefreshAll(); };
  if (showIn) showIn.onchange = ()=>{ getMensData().showCal=showIn.checked; scheduleSave(); renderLuna(); };
  if (notIn) notIn.onchange = async ()=>{ getMensData().notify=notIn.checked; scheduleSave(); if(notIn.checked) try{ if(Notification&&Notification.requestPermission) await Notification.requestPermission(); mensCheckNotify(); }catch{} };
  const addLast = $('mensAddLast'); if (addLast) addLast.onclick = ()=>{
    const v=$('mensLastDate').value; if(!v) return alert('Elige una fecha primero');
    const md=getMensData();
    if(!md.history.includes(v)) md.history.push(v);
    md.history.sort();
    if (md.autoLen) { const a=mensAvgLen(); md.cycleLen=a; if(cycIn) cycIn.value=a; }
    scheduleSave(); mensRefreshAll();
  };
  const addToday = $('mensAddToday'); if(addToday) addToday.onclick = ()=>{
    const today=cal.fmtKey.format(new Date());
    const md=getMensData();
    if(!md.history.includes(today)) md.history.push(today);
    md.history.sort();
    if (md.autoLen) { const a=mensAvgLen(); md.cycleLen=a; if(cycIn) cycIn.value=a; }
    scheduleSave(); $('mensLastDate').value=today; mensRefreshAll();
  };
  const saveS = $('mensSaveSympt'); if (saveS) saveS.onclick = ()=>{
    const today=cal.fmtKey.format(new Date());
    const md=getMensData();
    const painRaw = ($('mensPain')||{}).value;
    md.symptoms[today] = {
      flow: ($('mensFlow')||{}).value || '',
      pain: painRaw === '' ? '' : Math.min(10, Math.max(0, parseInt(painRaw)||0)),
      energy: ($('mensEnergy')||{}).value || '',
      mood: ($('mensMood')||{}).value || '',
      note: ((($('mensNote')||{}).value||'').trim()).slice(0,140)
    };
    scheduleSave('Cómo estás guardado ✓'); mensRefreshAll();
  };
  const exp = $('mensExport'); if (exp) exp.onclick = ()=>{
    try {
      const md=getMensData();
      let csv = 'fecha,dias_desde_anterior,luna,dia_luna,flujo,dolor,energia,animo,nota\n';
      const full = md.history.slice().sort();
      full.forEach((k,i)=>{
        const prev = i>0? full[i-1]: null;
        const gap = prev? Math.round((mensKeyToMs(k)-mensKeyToMs(prev))/86400000): '';
        const l = mensLunaForKey(k);
        const s = md.symptoms[k]||{};
        const q = (v)=> '"' + String(v||'').replace(/"/g,'""') + '"';
        csv += [k, gap, l?l.luna:'', l?l.dia:'', s.flow||'', s.pain===''?'':(s.pain||''), s.energy||'', s.mood||'', s.note||''].map(q).join(',') + '\n';
      });
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mi-ciclo-' + cal.fmtKey.format(new Date()) + '.csv';
      a.click();
      setTimeout(()=> URL.revokeObjectURL(a.href), 4000);
    } catch(e){ alert('No se pudo exportar'); }
  };
  const clearBtn=$('mensClear'); if(clearBtn) clearBtn.onclick = ()=>{
    if(!confirm('¿Borrar todo el historial de ciclo de esta usuaria (inicios + síntomas)?')) return;
    const md=getMensData(); md.history=[]; md.symptoms={}; scheduleSave(); mensRefreshAll();
  };
}
setTimeout(setupMensDialogEvents, 400);
setInterval(()=>{ try{ mensCheckNotify(); }catch{} }, 60*60*1000);

// === DIAGRAMA HORMONAL (adaptado a tu duración) ===
const HORM = {
  estrogen:   [30,28,26,25,27,35,45,55,68,78,85,92,88,60,50,55,62,68,72,70,62,55,45,38,32,30,28,27],
  progesterone:[12,11,10,10,12,14,13,12,14,16,18,22,28,35,45,62,75,82,85,84,78,65,50,38,25,18,14,12],
  lh:         [18,16,15,14,15,16,18,20,22,28,38,55,92,95,35,20,18,16,15,14,13,13,12,12,11,12,14,16],
  fsh:        [42,44,45,43,38,32,28,24,20,18,16,15,18,28,32,28,24,20,18,16,15,14,14,15,16,20,28,35]
};
// Reescala un array de 28 a N días por interpolación lineal
function hormScale(arr, N) {
  if (N === 28) return arr.slice();
  const out = [];
  for (let i = 0; i < N; i++) {
    const pos = i * 27 / (N - 1);
    const i0 = Math.floor(pos), i1 = Math.min(27, i0 + 1), f = pos - i0;
    out.push(Math.round(arr[i0] * (1-f) + arr[i1] * f));
  }
  return out;
}
function hormDayInfoText(d, cycleLen, periodLen) {
  cycleLen = cycleLen || mensAvgLen() || 28;
  periodLen = periodLen || getMensData().periodLen || 5;
  const e=HORM.estrogen[Math.min(27, Math.round((d-1)*27/(cycleLen-1)))];
  const p=HORM.progesterone[Math.min(27, Math.round((d-1)*27/(cycleLen-1)))];
  const l=HORM.lh[Math.min(27, Math.round((d-1)*27/(cycleLen-1)))];
  const f=HORM.fsh[Math.min(27, Math.round((d-1)*27/(cycleLen-1)))];
  const ov = cycleLen - 14;
  let fase='', energia='', alimentos='', entreno='', practicas='', cuidados='';
  if(d<=periodLen){
    fase=`Menstrual · Invierno (Pukem) — días 1-${periodLen}`;
    energia='Descanso e introspección. Estrógeno y progesterona en mínimo. Cuerpo pide vaciar.';
    alimentos='🥗 <b>Alimentos:</b> lentejas, espinaca, betarraga, carne roja magra/palta, frutos rojos, chocolate 80% + naranja (hierro+vit C), agua con pizca de sal, ortiga/manzanilla.';
    entreno='🏋️ <b>Entrenamiento:</b> muy suave — yoga restaurativo, estirar 15 min, caminar lento 20-30 min. Evita HIIT/fuerza pesada.';
    practicas='🧘 <b>Prácticas:</b> baño caliente, compresa tibia vientre, diario emocional, decir que no, respiración 4-7-8.';
    cuidados='🌿 <b>Cuidados:</b> prioriza 8h sueño, evita alcohol/cafeína, magnesio (cacao/almendras), calor local.';
  } else if(d<ov-2){
    fase=`Folicular · Primavera (Pewü) — días ${periodLen+1}-${ov-3}`;
    energia='Energía ascendente. Estrógeno sube, ánimo creativo y sociable.';
    alimentos='🥗 <b>Alimentos:</b> brotes, brócoli, zanahoria, quinoa, huevos, pollo/pescado blanco, semillas zapallo, yogur/kéfir.';
    entreno='🏋️ <b>Entrenamiento:</b> progresivo — fuerza, correr, bici, probar deporte nuevo. Buen momento para iniciar rutina.';
    practicas='🧘 <b>Prácticas:</b> planificar siembra/proyectos, brainstorming, ordenar espacios, socializar.';
    cuidados='🌿 <b>Cuidados:</b> zinc y probióticos, hidratación 1.5-2L, luz de mañana 15 min.';
  } else if(d<=ov+1){
    fase=`Ovulatoria · Verano (Walüng) — días ${Math.max(periodLen+1,ov-2)}-${ov+1} (ovulación ~día ${ov})`;
    energia='Pico LH/FSH. Fertilidad y magnetismo máximos. Energía plena.';
    alimentos='🥗 <b>Alimentos:</b> ligero y antioxidante — cítricos, pimentón, espárragos, berries, semillas sésamo/girasol, agua de coco.';
    entreno='🏋️ <b>Entrenamiento:</b> pico de rendimiento — HIIT, fuerza máxima, baile, deporte grupal.';
    practicas='🧘 <b>Prácticas:</b> comunicar, presentar, ritual luna llena, creatividad, intimidad consciente.';
    cuidados='🌿 <b>Cuidados:</b> apoya hígado (crucíferas, limón), evita ultraprocesados, hidrátate.';
  } else {
    fase=`Lútea · Otoño (Rimü) — días ${ov+2}-${cycleLen}`;
    energia='Progesterona domina y luego cae. Necesidad de anidar, bajar ritmo y poner límites.';
    alimentos='🥗 <b>Alimentos:</b> complejos — avena, camote, arroz integral, plátano, cacao, almendras, sésamo, brócoli; más fibra, menos azúcar/sal/cafeína.';
    entreno=`🏋️ <b>Entrenamiento:</b> ${ov+2}-${Math.min(cycleLen,ov+8)} moderado (pilates, nado, bici suave); resto suave (yin yoga, caminar, estirar espalda baja).`;
    practicas='🧘 <b>Prácticas:</b> anidar/ordenar casa, listas, límites claros, meditación, masaje, escritura reflexiva.';
    cuidados='🌿 <b>Cuidados:</b> magnesio+calcio para SPM, baños tibios, pasiflora/valeriana, dormir temprano, evita decisiones grandes los últimos 3 días.';
  }
  return `<b>Día ${d}/${cycleLen} — ${fase}</b><br><span class="su-a861ba">● Estrógeno ${e}</span> · <span class="su-721a46">● Progesterona ${p}</span> · <span class="su-7c91e2">● LH ${l}</span> · <span class="su-752b1a">● FSH ${f}</span><br><span class="su-57f9e3">${energia}</span>
    <div class="horm-suggest-grid">
      <div class="horm-suggest-card">${alimentos}</div>
      <div class="horm-suggest-card">${entreno}</div>
      <div class="horm-suggest-card">${practicas}</div>
      <div class="horm-suggest-card">${cuidados}</div>
    </div>
    <p class="muted su-d47a97">Sugerencias educativas, no reemplazan consejo médico. Escucha tu cuerpo: si algo no te sirve, descártalo.</p>`;
}
function renderHormonalChart(highlightDay) {
  const canvas=$('hormonalChart'); if(!canvas) return;
  const N = mensAvgLen() || 28;
  const E = hormScale(HORM.estrogen, N), P = hormScale(HORM.progesterone, N), L = hormScale(HORM.lh, N), F = hormScale(HORM.fsh, N);
  const dpr = window.devicePixelRatio||1;
  const w=480, h=220; canvas.width=w*dpr; canvas.height=h*dpr; canvas.style.width='100%'; const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#161e3f'; ctx.fillRect(0,0,w,h);
  const pad={l:36,r:10,t:12,b:22};
  const plotW=w-pad.l-pad.r, plotH=h-pad.t-pad.b;
  ctx.strokeStyle='#2a3565'; ctx.lineWidth=0.6;
  for(let i=0;i<=4;i++){ const y=pad.t+plotH*i/4; ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke(); ctx.fillStyle='#9aa3c7'; ctx.font='9px sans-serif'; ctx.textAlign='right'; ctx.fillText(String(100-i*25), pad.l-6, y+3); }
  const step = N > 35 ? 7 : 7;
  for(let d=1;d<=N;d+=step){ const x=pad.l+plotW*(d-1)/(N-1); ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,h-pad.b); ctx.stroke(); ctx.fillStyle='#9aa3c7'; ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.fillText('D'+d, x, h-6); }
  const colors={estrogen:'#e76e8a',progesterone:'#7ab8ff',lh:'#e8c56a',fsh:'#8fd694'};
  function drawLine(arr,color,lineW){ ctx.strokeStyle=color; ctx.lineWidth=lineW; ctx.beginPath(); arr.forEach((v,i)=>{ const x=pad.l+plotW*i/(N-1), y=pad.t+plotH*(1-v/100); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }
  drawLine(E, colors.estrogen, 2);
  drawLine(P, colors.progesterone, 2);
  drawLine(L, colors.lh, 2);
  drawLine(F, colors.fsh, 1.6);
  if(highlightDay>=1&&highlightDay<=N){
    const x=pad.l+plotW*(highlightDay-1)/(N-1);
    ctx.strokeStyle='#ffffff55'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,h-pad.b); ctx.stroke(); ctx.setLineDash([]);
    [['e',E,colors.estrogen],['p',P,colors.progesterone],['l',L,colors.lh],['f',F,colors.fsh]].forEach(([k,arr,c])=>{ const v=arr[highlightDay-1]; const y=pad.t+plotH*(1-v/100); ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke(); });
  }
  ctx.fillStyle='#ffffff0a';
  const P0 = getMensData().periodLen, OV = N - 14;
  const phases=[[1,P0],[P0+1,Math.max(P0+1,OV-3)],[Math.max(P0+1,OV-2),OV+1],[OV+2,N]];
  phases.forEach(([a,b])=>{ if(b<a) return; const x1=pad.l+plotW*(a-1)/(N-1), x2=pad.l+plotW*(b-1)/(N-1); ctx.fillRect(x1,pad.t,Math.max(2,x2-x1),plotH); });
}
function setupHormonalChart(){
  const canvas=$('hormonalChart'), slider=$('hormDaySlider'), label=$('hormDayLabel'), info=$('hormDayInfo'), tip=$('hormonalTooltip');
  if(!canvas||!slider) return;
  const N = mensAvgLen() || 28;
  const P = getMensData().periodLen || 5;
  slider.max = N;
  const lenEl = $('mensHormLen'); if (lenEl) lenEl.textContent = N;
  function update(d){
    const day=Math.min(N,Math.max(1,parseInt(d)||1));
    slider.value=day; if(label) label.textContent='Día '+day+'/'+N;
    if(info) info.innerHTML=hormDayInfoText(day, N, P);
    renderHormonalChart(day);
  }
  slider.oninput=()=> update(slider.value);
  canvas.addEventListener('mousemove', e=>{
    const rect=canvas.getBoundingClientRect(); const x=e.clientX-rect.left; const plotW=rect.width-46; const padL=36*rect.width/480;
    let day=Math.round((x-padL)/plotW*(N-1))+1; day=Math.min(N,Math.max(1,day));
    if(tip){ tip.textContent='Día '+day; tip.style.left=(e.clientX-rect.left)+'px'; tip.style.top='12px'; tip.classList.remove('hidden'); }
    update(day);
  });
  canvas.addEventListener('mouseleave', ()=>{ if(tip) tip.classList.add('hidden'); });
  canvas.addEventListener('click', e=>{
    const rect=canvas.getBoundingClientRect(); const x=e.clientX-rect.left; const plotW=rect.width-46; const padL=36*rect.width/480;
    let day=Math.round((x-padL)/plotW*(N-1))+1; day=Math.min(N,Math.max(1,day)); update(day);
  });
  let initDay=1;
  try{ const cur = mensCurrentDay(); if(cur) initDay = cur.day; }catch{}
  update(initDay);
}
const _origOpenMensDialog = openMensDialog;
openMensDialog = function(){ _origOpenMensDialog(); setTimeout(setupHormonalChart,80); };


// === MEDICAMENTOS ===
function getMedicData(){
  const u=userData();
  if(!u.medicamentos) u.medicamentos={ list:[], notify:true };
  if(!Array.isArray(u.medicamentos.list)) u.medicamentos.list=[];
  if(typeof u.medicamentos.notify!=='boolean') u.medicamentos.notify=true;
  return u.medicamentos;
}
let medicEditingId=null;
function medicNextDoses(med, fromMs, count){
  const res=[]; const freq=med.freq||'diaria'; const timeStr=med.time||'08:00';
  const [hh,mm]=timeStr.split(':').map(Number);
  let cur = new Date(fromMs); cur.setHours(hh,mm,0,0);
  if(cur.getTime()<fromMs) cur.setDate(cur.getDate()+1);
  const until = med.to ? mensKeyToMs(med.to)+86400000 : Infinity;
  const fromKey = med.from || '';
  const fromMsMed = fromKey? mensKeyToMs(fromKey): -Infinity;
  for(let iter=0; iter<500 && res.length<count; iter++){
    const t=cur.getTime();
    if(t>=fromMsMed && t<until){
      let ok=true;
      if(freq==='diaria') ok=true;
      else if(freq==='cada8' || freq==='cada12'){ /* handled via hours step */ }
      else if(freq==='semanal'){ ok = cur.getDay()=== new Date(mensKeyToMs(fromKey||cal.fmtKey.format(new Date()))).getDay(); }
      else if(freq==='personalizada'){ const days=(med.days||'').split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)); // interpret as day numbers 1..28? use weekly day 0-6? simplificar: día mes
        // personalizada = lista de días del mes (1-31)
        ok = days.includes(cur.getDate());
        if(!ok) { cur.setDate(cur.getDate()+1); continue; }
      }
      if(ok) res.push(new Date(t).getTime());
    }
    if(freq==='cada8') cur = new Date(cur.getTime()+8*3600000);
    else if(freq==='cada12') cur = new Date(cur.getTime()+12*3600000);
    else cur.setDate(cur.getDate()+1);
    if(freq==='semanal' && !res.length) { /* already aligned weekly, step 7 days */ if(iter>0) cur = new Date(cur.getTime()+6*86400000); }
  }
  return res;
}
function renderMedicList(){
  const box=$('medicList'); if(!box) return;
  const data=getMedicData();
  if(!data.list.length){ box.innerHTML='<p class="muted">Sin medicamentos registrados. Agrega uno arriba.</p>'; return; }
  box.innerHTML='';
  data.list.forEach(med=>{
    const div=document.createElement('div'); div.className='medic-item';
    const next = medicNextDoses(med, Date.now(), 1)[0];
    const nextTxt = next ? cal.weekdayName(next)+' '+cal.fmtFull.format(new Date(next))+' '+med.time : '—';
    const luna = next? mensLunaForKey(mensMsToKey(next)): null;
    div.innerHTML=`<div class="medic-head"><b>💊 ${escapeHtml(med.name)}</b> <span class="muted su-11a508">${escapeHtml(med.dose||'')}</span></div><div class="muted su-6cb285">⏰ ${med.freq} ${med.time} ${med.days? '('+escapeHtml(med.days)+')':''} · ${med.from||'?'} → ${med.to||'∞'}</div><div class="muted su-11a508">${escapeHtml(med.notes||'')}</div><div class="su-c20229">Próxima: ${nextTxt} ${luna? '· Luna '+luna.luna:''}</div><div class="dlg-actions su-d764ff"><button data-id="${med.id}" class="btn medic-edit su-337714">✏️ Editar</button><button data-id="${med.id}" class="btn medic-del su-fd834a">✕ Eliminar</button></div>`;
    box.appendChild(div);
  });
  box.querySelectorAll('.medic-edit').forEach(b=> b.onclick=()=>{
    const med=data.list.find(x=>x.id===b.dataset.id); if(!med) return;
    medicEditingId=med.id; $('medicName').value=med.name; $('medicDose').value=med.dose; $('medicFreq').value=med.freq; $('medicTime').value=med.time; $('medicFrom').value=med.from||''; $('medicTo').value=med.to||''; $('medicDays').value=med.days||''; $('medicNotes').value=med.notes||'';
    $('medicDaysRow').style.display= med.freq==='personalizada'?'flex':'none';
    $('medicAdd').classList.add('hidden'); $('medicUpdate').classList.remove('hidden'); $('medicCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.medic-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar este medicamento?')) return;
    data.list=data.list.filter(x=>x.id!==b.dataset.id); scheduleSave(); renderMedicList(); renderMedicNextBox();
  });
}
function renderMedicNextBox(){
  const box=$('medicNextBox'); if(!box) return;
  const farma=getMedicData().list;
  const nat=getMedicNaturalData().list;
  const allLists=[...farma.map(m=>({...m, _tipo:'💊'})), ...nat.map(m=>({...m, _tipo:'🌿'}))];
  if(!allLists.length){ box.innerHTML='<p class="muted">Agrega medicamentos o preparados naturales para ver próximas tomas.</p>'; return; }
  const all=[]; allLists.forEach(med=>{ medicNextDoses(med, Date.now(), 3).forEach(t=> all.push({t, med})); });
  all.sort((a,b)=>a.t-b.t);
  const next5=all.slice(0,5);
  box.innerHTML='<h4 class="su-e39eba">⏰ Próximas tomas — farmacología + natural (5)</h4>'+ (next5.length? '<div class="mens-history">'+ next5.map(o=>`<div class="mens-hist-item"><span><b>${o.med._tipo} ${escapeHtml(o.med.name)}</b> — ${cal.weekdayName(o.t)} ${cal.fmtFull.format(new Date(o.t))} ${cal.fmtTime.format(new Date(o.t))} · ${escapeHtml(o.med.dose||o.med.notes||'')}</span><span class="muted su-0d5be0">${o.t-Date.now()<3600000? '¡pronto!':''}</span></div>`).join('')+'</div>' : '<p class="muted">Sin tomas próximas.</p>');
}
function medicCheckNotify(){
  const farma=getMedicData(); const nat=getMedicNaturalData();
  const hasFarma=farma.notify && farma.list.length; const hasNat=nat.list.length;
  if(!hasFarma && !hasNat) return;
  if(typeof Notification==='undefined'||Notification.permission!=='granted') return;
  const now=Date.now(); const all=[];
  if(farma.notify) farma.list.forEach(med=> medicNextDoses(med, now-60000, 2).forEach(t=> all.push({t,med, tipo:'💊'})));
  else if(nat.list.length) { /* si solo natural, igual notifica si farma notify está on */ }
  nat.list.forEach(med=> medicNextDoses(med, now-60000, 2).forEach(t=> all.push({t,med, tipo:'🌿'})));
  all.forEach(o=>{ const diff=o.t-now; if(diff>=-60000 && diff<=60000){ const key='medic-last-'+o.med.id+'-'+o.t; if(localStorage.getItem(key)) return; try{ playNotifySound(); new Notification((o.tipo==='🌿'?'🌿 Natural':'💊 Medicamento'), {body:`${o.med.name} — ${o.med.dose||o.med.notes||''} · ${cal.fmtTime.format(new Date(o.t))}`, silent:false}); localStorage.setItem(key,'1'); }catch{} } });
}
function medicSwitchTab(which){
  const panels={ farma:'medicFarmaPanel', natural:'medicNaturalPanel', basica:'medicBasicaPanel', historia:'medicHistoriaPanel', seguridad:'medicSeguridadPanel' };
  const tabs={ farma:'tabMedicFarma', natural:'tabMedicNatural', basica:'tabMedicBasica', historia:'tabMedicHistoria', seguridad:'tabMedicSeguridad' };
  Object.entries(panels).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('hidden', k!==which); });
  Object.entries(tabs).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===which); });
  try{
    if(which==='basica'){ renderMedicBasica(); renderMedicBotiquin(); loadMedicExtra(); }
    if(which==='historia'){ renderMedicHistoria(); }
    if(which==='seguridad'){ renderMedicSeguridad(); }
  }catch(e){}
}
function setupMedicDialog(){
  const btn=$('btnMedic'); if(btn) btn.onclick=()=>{
    renderMedicList(); renderNaturalList(); renderNaturalUserList(); renderMedicNextBox();
    renderMedicBasica(); renderMedicBotiquin(); loadMedicExtra(); renderMedicHistoria(); renderMedicSeguridad();
    const c=$('medicNotify'); if(c) c.checked=getMedicData().notify;
    const mf=$('medicFrom'); if(mf && !mf.value) mf.value=cal.fmtKey.format(new Date());
    const nf=$('naturalFrom'); if(nf && !nf.value) nf.value=cal.fmtKey.format(new Date());
    // tabs default
    medicSwitchTab('farma');
    $('medicDialog').showModal();
  };
  const cTop=$('medicCloseTop'), cBot=$('medicClose'); if(cTop) cTop.onclick=()=>$('medicDialog').close(); if(cBot) cBot.onclick=()=>$('medicDialog').close();
  // tabs
  const tF=$('tabMedicFarma'), tN=$('tabMedicNatural'), tB=$('tabMedicBasica'), tH=$('tabMedicHistoria'), tS=$('tabMedicSeguridad');
  if(tF) tF.onclick=()=>medicSwitchTab('farma');
  if(tN) tN.onclick=()=>medicSwitchTab('natural');
  if(tB) tB.onclick=()=>medicSwitchTab('basica');
  if(tH) tH.onclick=()=>medicSwitchTab('historia');
  if(tS) tS.onclick=()=>medicSwitchTab('seguridad');
  const goFA=$('medicGoFirstAid'); if(goFA) goFA.onclick=()=>{ try{$('medicDialog').close();}catch{} try{ renderFirstAidPanel('actuar'); $('firstAidDialog').showModal(); }catch{} };
  const goLaw=$('medicGoLawen'); if(goLaw) goLaw.onclick=()=>{ try{$('medicDialog').close();}catch{} const b=$('btnLawen'); if(b) b.click(); };
  const hs=$('medicHistSearch'); if(hs) hs.oninput=()=>renderMedicHistoria();
  const hf=$('medicHistFilter'); if(hf) hf.onchange=()=>renderMedicHistoria();
  const exS=$('medicExtraSave'); if(exS) exS.onclick=saveMedicExtra;
  const bqR=$('medicBotiquinReset'); if(bqR) bqR.onclick=()=>{ const d=getMedicExtraData(); d.botiquin={}; scheduleSave(); renderMedicBotiquin(); };
  const freq=$('medicFreq'), daysRow=$('medicDaysRow'); if(freq) freq.onchange=()=>{ daysRow.style.display= freq.value==='personalizada'?'flex':'none'; };
  const nFreq=$('naturalFreq'), nDaysRow=$('naturalDaysRow'); if(nFreq) nFreq.onchange=()=>{ nDaysRow.style.display= nFreq.value==='personalizada'?'flex':'none'; };
  const add=$('medicAdd'); if(add) add.onclick=()=>{
    const name=$('medicName').value.trim(); if(!name) return alert('Ingresa nombre');
    const med={ id:'med'+Date.now(), name, dose:$('medicDose').value.trim(), freq:$('medicFreq').value, time:$('medicTime').value, from:$('medicFrom').value, to:$('medicTo').value, days:$('medicDays').value.trim(), notes:$('medicNotes').value.trim() };
    getMedicData().list.push(med); scheduleSave(); $('medicName').value=''; $('medicDose').value=''; $('medicNotes').value=''; renderMedicList(); renderMedicNextBox();
  };
  const upd=$('medicUpdate'); if(upd) upd.onclick=()=>{
    const med=getMedicData().list.find(x=>x.id===medicEditingId); if(!med) return;
    med.name=$('medicName').value.trim(); med.dose=$('medicDose').value.trim(); med.freq=$('medicFreq').value; med.time=$('medicTime').value; med.from=$('medicFrom').value; med.to=$('medicTo').value; med.days=$('medicDays').value.trim(); med.notes=$('medicNotes').value.trim();
    scheduleSave(); medicEditingId=null; $('medicAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('medicCancelEdit').classList.add('hidden'); $('medicName').value=''; $('medicDose').value=''; $('medicNotes').value=''; renderMedicList(); renderMedicNextBox();
  };
  const cancel=$('medicCancelEdit'); if(cancel) cancel.onclick=()=>{ medicEditingId=null; $('medicAdd').classList.remove('hidden'); $('medicUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('medicName').value=''; $('medicDose').value=''; $('medicNotes').value=''; };
  // natural add/update/cancel
  const nAdd=$('naturalAdd'); if(nAdd) nAdd.onclick=()=>{
    const name=$('naturalName').value.trim(); if(!name) return alert('Ingresa hierba / preparado');
    const med={ id:'nat'+Date.now(), name, dose:$('naturalDose').value.trim(), freq:$('naturalFreq').value, time:$('naturalTime').value, from:$('naturalFrom').value, to:$('naturalTo').value, days:$('naturalDays').value.trim(), notes:$('naturalNotes').value.trim() };
    if(!med.from) med.from=cal.fmtKey.format(new Date());
    getMedicNaturalData().list.push(med); scheduleSave(); $('naturalName').value=''; $('naturalDose').value=''; $('naturalNotes').value=''; renderNaturalUserList(); renderMedicNextBox();
  };
  const nUpd=$('naturalUpdate'); if(nUpd) nUpd.onclick=()=>{
    const med=getMedicNaturalData().list.find(x=>x.id===naturalEditingId); if(!med) return;
    med.name=$('naturalName').value.trim(); med.dose=$('naturalDose').value.trim(); med.freq=$('naturalFreq').value; med.time=$('naturalTime').value; med.from=$('naturalFrom').value; med.to=$('naturalTo').value; med.days=$('naturalDays').value.trim(); med.notes=$('naturalNotes').value.trim();
    scheduleSave(); naturalEditingId=null; $('naturalAdd').classList.remove('hidden'); nUpd.classList.add('hidden'); $('naturalCancelEdit').classList.add('hidden'); $('naturalName').value=''; $('naturalDose').value=''; $('naturalNotes').value=''; renderNaturalUserList(); renderMedicNextBox();
  };
  const nCancel=$('naturalCancelEdit'); if(nCancel) nCancel.onclick=()=>{ naturalEditingId=null; $('naturalAdd').classList.remove('hidden'); $('naturalUpdate').classList.add('hidden'); nCancel.classList.add('hidden'); $('naturalName').value=''; $('naturalDose').value=''; $('naturalNotes').value=''; };
  const notChk=$('medicNotify'); if(notChk) notChk.onchange= async ()=>{ getMedicData().notify=notChk.checked; scheduleSave(); if(notChk.checked) try{ if(Notification&&Notification.requestPermission) await Notification.requestPermission(); }catch{} };
}
setTimeout(setupMedicDialog, 600);
setInterval(()=>{ try{ medicCheckNotify(); }catch{} }, 60000);
setTimeout(()=>{ try{ medicCheckNotify(); }catch{} }, 5000);

// === HÁBITOS ===
function getHabitData(){
  const u=userData();
  if(!u.habitos) u.habitos={ list:[], entries:{} };
  if(!Array.isArray(u.habitos.list)) u.habitos.list=[];
  if(typeof u.habitos.entries!=='object' || Array.isArray(u.habitos.entries) || !u.habitos.entries) u.habitos.entries={};
  return u.habitos;
}
function habitToggle(dateKey, habitId){
  const d=getHabitData();
  if(!d.entries[dateKey]) d.entries[dateKey]={};
  if(d.entries[dateKey][habitId]) delete d.entries[dateKey][habitId];
  else {
    const h=d.list.find(x=>x.id===habitId);
    const meta=h && +h.metaMin>0 ? Math.min(1440, +h.metaMin) : 0;
    d.entries[dateKey][habitId]= meta>0 ? meta : true;
  }
  if(Object.keys(d.entries[dateKey]).length===0) delete d.entries[dateKey];
  scheduleSave();
}
// === MINUTOS POR HÁBITO (ej: Meditar 10 min) ===
// entries[key][id] puede ser true (solo check, compat) o número (minutos del día)
function habitMinutes(dateKey, habitId){
  const d=getHabitData();
  const v=d.entries[dateKey] && d.entries[dateKey][habitId];
  return typeof v==='number' ? v : 0;
}
function habitIsDone(dateKey, habitId){
  const d=getHabitData();
  return !!(d.entries[dateKey] && d.entries[dateKey][habitId]);
}
function habitAddMinutes(dateKey, habitId, mins){
  mins=Math.max(1, Math.min(1440, parseInt(mins)||0));
  if(!mins) return;
  const d=getHabitData();
  if(!d.entries[dateKey]) d.entries[dateKey]={};
  const cur=d.entries[dateKey][habitId];
  const base= typeof cur==='number' ? cur : (cur===true ? 0 : 0);
  d.entries[dateKey][habitId]=Math.min(1440, base+mins);
  scheduleSave();
}
function habitMeta(h){ return h && +h.metaMin>0 ? +h.metaMin : 0; }
function habitStreak(habitId){
  const d=getHabitData();
  const todayKey=cal.fmtKey.format(new Date());
  let streak=0;
  let curMs=mensKeyToMs(todayKey);
  for(let i=0;i<365;i++){
    const k=mensMsToKey(curMs - i*86400000);
    const done = d.entries[k] && d.entries[k][habitId];
    if(done) streak++;
    else if(i===0) continue;
    else break;
    if(i>0 && !done) break;
  }
  // si hoy no está completado, no romper racha? ajustar: si hoy no hecho, contar desde ayer
  if(!(d.entries[todayKey] && d.entries[todayKey][habitId])){
    streak=0;
    let cur=mensKeyToMs(todayKey)-86400000;
    for(let i=0;i<365;i++){
      const k=mensMsToKey(cur - i*86400000);
      if(d.entries[k] && d.entries[k][habitId]) streak++;
      else break;
    }
  }
  return streak;
}
function habitStats(habitId){
  const d=getHabitData();
  const now=new Date();
  const y=now.getFullYear(), m=now.getMonth()+1;
  const daysInMonth=new Date(y,m,0).getDate();
  let doneThisMonth=0, minThisMonth=0;
  for(let day=1;day<=daysInMonth;day++){
    const k=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    // convertir a key Santiago (usar fmtKey noon) - aproximación: usar misma k
    const key=cal.fmtKey.format(new Date(Date.UTC(y,m-1,day,12)));
    if(d.entries[key] && d.entries[key][habitId]) doneThisMonth++;
    if(typeof (d.entries[key] && d.entries[key][habitId])==='number') minThisMonth+=d.entries[key][habitId];
  }
  const pct = daysInMonth? Math.round(doneThisMonth/daysInMonth*100):0;
  const total=Object.keys(d.entries).filter(k=> d.entries[k][habitId]).length;
  let totalMin=0; Object.keys(d.entries).forEach(k=>{ if(typeof d.entries[k][habitId]==='number') totalMin+=d.entries[k][habitId]; });
  return { doneThisMonth, daysInMonth, pct, total, minThisMonth, totalMin };
}
function renderHabitsList(){
  const box=$('habitsList'); if(!box) return;
  const data=getHabitData();
  if(!data.list.length){ box.innerHTML='<p class="muted">Aún no hay hábitos. Crea uno arriba (ej: “Meditar”, “Caminar 30 min”).</p>'; return; }
  box.innerHTML='';
  data.list.forEach(h=>{
    const st=habitStreak(h.id);
    const stats=habitStats(h.id);
    const div=document.createElement('div'); div.className='habit-item';
    div.innerHTML=`<div class="habit-head"><span class="habit-icon" style="background:${h.color}22;border-color:${h.color}55;color:${h.color}">${escapeHtml(h.icono||'✓')}</span><b>${escapeHtml(h.nombre)}</b><span class="muted su-11a508">${h.freq==='diaria'?'Diaria':'Semanal'}${habitMeta(h)?' · ⏱ '+habitMeta(h)+' min/día':''}</span></div><div class="habit-stats"><span>🔥 Racha ${st} días</span><span>📊 ${stats.pct}% mes (${stats.doneThisMonth}/${stats.daysInMonth})</span><span>✅ Total ${stats.total}</span>${habitMeta(h)?`<span>⏱ ${stats.minThisMonth} min este mes</span>`:''}</div><div class="dlg-actions su-d764ff"><button data-id="${h.id}" class="btn habit-toggle-today su-337714">◉ Hoy</button><button data-id="${h.id}" class="btn habit-edit su-337714">✏️</button><button data-id="${h.id}" class="btn habit-del su-fd834a">✕</button></div>`;
    box.appendChild(div);
  });
  box.querySelectorAll('.habit-toggle-today').forEach(b=> b.onclick=()=>{
    const today=cal.fmtKey.format(new Date());
    habitToggle(today,b.dataset.id);
    habitRefreshAll();
  });
  box.querySelectorAll('.habit-edit').forEach(b=> b.onclick=()=>{
    const h=data.list.find(x=>x.id===b.dataset.id); if(!h) return;
    habitEditingId=h.id; $('habitName').value=h.nombre; $('habitIcon').value=h.icono; $('habitColor').value=h.color; $('habitFreq').value=h.freq;
    if($('habitGoal')) $('habitGoal').value=habitMeta(h);
    $('habitAdd').classList.add('hidden'); $('habitUpdate').classList.remove('hidden'); $('habitCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.habit-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar hábito y su historial?')) return;
    const id=b.dataset.id; data.list=data.list.filter(x=>x.id!==id);
    Object.keys(data.entries).forEach(k=>{ if(data.entries[k][id]) delete data.entries[k][id]; if(Object.keys(data.entries[k]||{}).length===0) delete data.entries[k]; });
    scheduleSave(); habitRefreshAll();
  });
}
function renderHabitsTodayBox(){
  const box=$('habitsTodayBox'); if(!box) return;
  const data=getHabitData();
  const today=cal.fmtKey.format(new Date());
  if(!data.list.length){ box.innerHTML='<p class="muted">Crea hábitos para marcarlos cada día.</p>'; return; }
  box.innerHTML='<h4 class="su-e39eba">◉ Hoy — '+cal.weekdayName(Date.now())+' '+cal.fmtFull.format(new Date())+'</h4><div class="habits-today-grid">'+ data.list.map(h=>{
    const done = data.entries[today] && data.entries[today][h.id];
    const meta=habitMeta(h), mins=habitMinutes(today,h.id);
    const minTag = meta? `<span class="muted su-0d5be0">⏱ ${mins}/${meta} min</span>` : (mins? `<span class="muted su-0d5be0">⏱ ${mins} min</span>`:'');
    const minCtl = meta? `<span class="su-92b9f8"><input type="number" class="habit-min-input su-b2e80b" data-id="${h.id}" min="1" max="300" value="${meta}" title="Minutos a sumar"><button type="button" class="btn habit-min-add su-43fa01" data-id="${h.id}">+ min</button>${mins?`<button type="button" class="btn habit-min-clear su-43fa01" data-id="${h.id}" title="Quitar minutos de hoy">✕</button>`:''}</span>`:'';
    return `<label class="habit-today-item ${done?'done':''}" style="border-color:${h.color}55"><input type="checkbox" data-id="${h.id}" ${done?'checked':''}><span class="habit-icon" style="background:${h.color}22;color:${h.color}">${escapeHtml(h.icono||'✓')}</span><span>${escapeHtml(h.nombre)}<br>${minTag}${minCtl}</span></label>`;
  }).join('')+'</div>';
  box.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.onchange=(e)=>{
    e.stopPropagation();
    habitToggle(today, cb.dataset.id);
    habitRefreshAll();
  });
  box.querySelectorAll('.habit-min-add').forEach(b=> b.onclick=(e)=>{
    e.preventDefault(); e.stopPropagation();
    const inp=box.querySelector('.habit-min-input[data-id="'+b.dataset.id+'"]');
    habitAddMinutes(today, b.dataset.id, inp? inp.value : 10);
    habitRefreshAll();
  });
  box.querySelectorAll('.habit-min-clear').forEach(b=> b.onclick=(e)=>{
    e.preventDefault(); e.stopPropagation();
    const d=getHabitData();
    if(d.entries[today]){ delete d.entries[today][b.dataset.id]; if(Object.keys(d.entries[today]).length===0) delete d.entries[today]; }
    scheduleSave(); habitRefreshAll();
  });
  box.querySelectorAll('.habit-min-input').forEach(i=> i.onclick=(e)=> e.stopPropagation());
}
function renderHabitsStatsBox(){
  const box=$('habitsStatsBox'); if(!box) return;
  const data=getHabitData();
  if(!data.list.length){ box.innerHTML=''; return; }
  const today=cal.fmtKey.format(new Date());
  const daysInMonth=new Date(new Date().getFullYear(), new Date().getMonth()+1,0).getDate();
  let totalDoneToday=0; data.list.forEach(h=>{ if(data.entries[today] && data.entries[today][h.id]) totalDoneToday++; });
  const pctToday = data.list.length? Math.round(totalDoneToday/data.list.length*100):0;
  box.innerHTML=`<h4 class="su-a80552">📈 Resumen</h4><div class="habit-stats su-b9f73a"><span>Hoy: ${totalDoneToday}/${data.list.length} (${pctToday}%) completados</span><span>Hábitos activos: ${data.list.length} · Registros: ${Object.keys(data.entries).length} días</span></div><div class="su-9c3529"><div style="width:${pctToday}%;height:100%;background:linear-gradient(90deg,#e8c56a,#a9d18e);transition:width .3s"></div></div>`;
}
function renderHabitsLunaBox(){
  const box=$('habitsLunaBox'); if(!box) return;
  const data=getHabitData();
  if(!data.list.length || !cycle){ box.innerHTML=''; return; }
  const daysInLuna = cycle.days.filter(d=>d.luna===currentView.luna).length || 28;
  let doneInLuna=0, totalPossible=daysInLuna * data.list.length;
  cycle.days.filter(d=>d.luna===currentView.luna).forEach(d=>{
    const k=cal.fmtKey.format(new Date(d.noonMs));
    const e=data.entries[k];
    if(e) doneInLuna+= Object.keys(e).length;
  });
  const pct = totalPossible? Math.round(doneInLuna/totalPossible*100):0;
  const lunaName = currentView.tipo==='dft'? 'Día Fuera del Tiempo': 'Luna '+currentView.luna;
  box.innerHTML=`<h4 class="su-a80552">🌙 ${lunaName} — hábitos</h4><p class="muted su-6cb285">${doneInLuna} checks de ${totalPossible} posibles (${pct}%)</p><div class="su-9c3529"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a);transition:width .3s"></div></div>`;
}
let habitTrackerRange=14;
function habitRefreshAll(){
  try{ renderHabitsList(); }catch(e){}
  try{ renderHabitsTodayBox(); }catch(e){}
  try{ renderHabitsStatsBox(); }catch(e){}
  try{ renderHabitsTracker(); }catch(e){}
  try{ renderHabitsLunaBox(); }catch(e){}
  try{ renderDlgHabits(); }catch(e){}
  try{ renderLuna(); }catch(e){}
}
function renderHabitsTracker(){
  const box=$('habitsTrackerBox'); if(!box) return;
  const data=getHabitData();
  if(!data.list.length){ box.innerHTML='<h4 class="su-a80552">📊 Rastreador de hábitos</h4><p class="muted su-6cb285">Agrega tu primer hábito arriba y aquí verás el gráfico de los últimos días. Toca las celdas para marcar días pasados.</p>'; return; }
  const range=[7,14,28].includes(habitTrackerRange)? habitTrackerRange:14;
  const todayKey=cal.fmtKey.format(new Date());
  let baseMs; try{ baseMs=mensKeyToMs(todayKey); }catch(e){ baseMs=Date.now(); }
  const WD=['D','L','M','M','J','V','S'];
  const days=[];
  for(let i=range-1;i>=0;i--){
    const ms=baseMs - i*86400000;
    const key=mensMsToKey(ms);
    const dt=new Date(ms);
    days.push({ ms, key, num:dt.getUTCDate(), wd:WD[dt.getUTCDay()], isToday:i===0 });
  }
  const n=data.list.length;
  let totalChecks=0, bestDay=0;
  const perDay=days.map(d=>{
    const e=data.entries[d.key]||{};
    const c=data.list.filter(h=>e[h.id]).length;
    totalChecks+=c; if(c>bestDay) bestDay=c;
    return { ...d, done:c, pct:n? Math.round(c/n*100):0 };
  });
  const avg=n&&range? Math.round(totalChecks/(n*range)*100):0;
  const bars=perDay.map(d=>{
    const col=d.pct===100?'linear-gradient(180deg,#8fd694,#5aa469)':d.pct>=50?'linear-gradient(180deg,#e8c56a,#b98a2e)':d.pct>0?'linear-gradient(180deg,#7ab8ff,#4a6fa5)':'transparent';
    return `<div class="habit-bar-col" title="${d.key}: ${d.done}/${n} (${d.pct}%)"><span class="habit-bar-pct">${d.pct>0?d.pct+'%':''}</span><div class="habit-bar-track"><div class="habit-bar-fill" style="height:${d.pct}%;background:${col}"></div></div><span class="habit-bar-day">${d.wd}<br><b>${d.num}</b></span></div>`;
  }).join('');
  const head=`<tr><th class="su-6be0d8">Hábito</th>`+perDay.map(d=>`<th class="${d.isToday?'':''}" title="${d.key}">${d.isToday?'◉':d.wd}<br>${d.num}</th>`).join('')+`<th>🔥</th></tr>`;
  const rows=data.list.map(h=>{
    const st=habitStreak(h.id);
    const cells=perDay.map(d=>{
      const done=data.entries[d.key] && data.entries[d.key][h.id];
      const mins=habitMinutes(d.key,h.id);
      const style=done? `background:${h.color}33;border-color:${h.color};color:${h.color}`:'';
      return `<td><button type="button" class="habit-cell ${d.isToday?'today':''}" data-key="${d.key}" data-id="${h.id}" style="${style}" title="${escapeHtml(h.nombre)} · ${d.key}${mins?' · '+mins+' min':done?' ✓':''}">${done? escapeHtml(mins? String(mins)+'′' : (h.icono||'✓')):'·'}</button></td>`;
    }).join('');
    return `<tr><td class="hname"><span class="habit-icon" style="display:inline-flex;width:20px;height:20px;font-size:11px;vertical-align:-4px;background:${h.color}22;color:${h.color};border:1px solid ${h.color}55;border-radius:50%;align-items:center;justify-content:center">${escapeHtml(h.icono||'✓')}</span> ${escapeHtml(h.nombre.length>16? h.nombre.slice(0,16)+'…':h.nombre)}</td>${cells}<td class="su-86abda">🔥${st}</td></tr>`;
  }).join('');
  box.innerHTML=`<div class="su-24ce67"><h4 class="su-772847">📊 Rastreador — últimos ${range} días</h4><div class="habit-range-btns"><button type="button" class="btn habit-range ${range===7?'on':''} su-337714" data-range="7">7d</button><button type="button" class="btn habit-range ${range===14?'on':''} su-337714" data-range="14">14d</button><button type="button" class="btn habit-range ${range===28?'on':''} su-337714" data-range="28">28d</button></div></div>`
    +`<p class="muted su-954796">${totalChecks} checks · promedio <b>${avg}%</b> · mejor día ${bestDay}/${n} · toca una celda para marcar/desmarcar ese día</p>`
    +`<div class="habit-bars">${bars}</div>`
    +`<div class="habit-heat"><table>${head}${rows}</table></div>`
    +`<div class="dlg-actions su-8f9e27"><button type="button" id="habitTrackerShare" class="btn su-337714">📤 Compartir avance</button><span class="muted su-0d5be0">💡 Consejo: si un día quedó vacío, márcalo hoy en versión mínima (2 min) y sigue la cadena.</span></div>`;
  box.querySelectorAll('.habit-range').forEach(b=> b.onclick=()=>{ habitTrackerRange=+b.dataset.range; renderHabitsTracker(); });
  box.querySelectorAll('.habit-cell').forEach(c=> c.onclick=()=>{ habitToggle(c.dataset.key, c.dataset.id); habitRefreshAll(); });
  const sh=$('habitTrackerShare');
  if(sh) sh.onclick=async ()=>{
    const lines=data.list.map(h=>{
      const st=habitStreak(h.id); const s=habitStats(h.id);
      return `${h.icono||'✓'} ${h.nombre}: racha ${st}d · mes ${s.pct}% (${s.doneThisMonth}/${s.daysInMonth})${habitMeta(h)?` · ⏱ ${s.minThisMonth} min/mes`:''}`;
    });
    const txt=`✅ Mis hábitos — últimos ${range} días: ${totalChecks} checks, promedio ${avg}%\n`+lines.join('\n');
    try{ await shareText('✅ Mi avance de hábitos', txt); }catch(e){}
  };
}
function renderDlgHabits(){
  const box=$('dlgHabits'); if(!box) return;
  const data=getHabitData();
  if(!data.list.length){ box.innerHTML=''; return; }
  if(!editing) { box.innerHTML=''; return; }
  const d=cycle.days.find(x=>x.luna===editing.lunaN && x.diaN===editing.diaN);
  if(!d) { box.innerHTML=''; return; }
  const key=cal.fmtKey.format(new Date(d.noonMs));
  box.innerHTML='<label class="su-242ac3">✅ Hábitos de este día</label><div class="habits-today-grid">'+ data.list.map(h=>{
    const done=data.entries[key] && data.entries[key][h.id];
    const meta=habitMeta(h), mins=habitMinutes(key,h.id);
    const minTag = meta? `<span class="muted su-0d5be0">⏱ ${mins}/${meta} min</span>` : (mins? `<span class="muted su-0d5be0">⏱ ${mins} min</span>`:'');
    const minCtl = meta? `<span class="su-92b9f8"><input type="number" class="habit-min-input su-b2e80b" data-id="${h.id}" min="1" max="300" value="${meta}"><button type="button" class="btn habit-min-add su-43fa01" data-id="${h.id}">+ min</button></span>`:'';
    return `<label class="habit-today-item ${done?'done':''}" style="border-color:${h.color}55"><input type="checkbox" data-id="${h.id}" ${done?'checked':''}><span class="habit-icon" style="background:${h.color}22;color:${h.color}">${escapeHtml(h.icono||'✓')}</span><span>${escapeHtml(h.nombre)}<br>${minTag}${minCtl}</span></label>`;
  }).join('')+'</div>';
  box.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.onchange=(e)=>{
    e.stopPropagation();
    habitToggle(key, cb.dataset.id);
    habitRefreshAll();
    // mantener estado visual
    const lab=cb.closest('label'); if(cb.checked) lab.classList.add('done'); else lab.classList.remove('done');
  });
  box.querySelectorAll('.habit-min-add').forEach(b=> b.onclick=(e)=>{
    e.preventDefault(); e.stopPropagation();
    const inp=box.querySelector('.habit-min-input[data-id="'+b.dataset.id+'"]');
    habitAddMinutes(key, b.dataset.id, inp? inp.value : 10);
    habitRefreshAll();
  });
  box.querySelectorAll('.habit-min-input').forEach(i=> i.onclick=(e)=> e.stopPropagation());
}
const HABIT_ICON_GROUPS = [
  { id:'esenciales', label:'⭐ Esenciales', icons:["✓","🧘","🏃","💧","📚","🌱","🧠","💪","🛌","😴","🎯","🧹"] },
  { id:'movimiento', label:'🏃 Movimiento', icons:["🚶","🏋️","🏊","🚴","🤸","🧎","⚽","🏀","🎾","🥋","🛹","🏓","🧗","🚣","⛹️","🚲"] },
  { id:'mente', label:'🧠 Mente y estudio', icons:["✍️","📝","📖","🎨","🎵","🎧","🎸","🎹","♟️","🧩","🎲","💻","⏰","⏱️","💡","🔔","📱","🖥️"] },
  { id:'comida', label:'🍎 Comida y agua', icons:["🍎","🥗","🥦","🥕","🍌","🍊","🥑","🍳","🥜","🍯","☕","🍵","🧃","🥤","🚰","🍽️","🌾","🥛"] },
  { id:'hogar', label:'🏠 Hogar y orden', icons:["🧼","🧽","🧺","🛏️","🧴","🕯️","💰","🧾","🪟","🧸","🔑","🪑","🚪","🧥","👕","🪴"] },
  { id:'natura', label:'🌿 Naturaleza', icons:["🌊","🌞","☀️","🌙","⭐","✨","🌈","🌧️","🌻","🌷","🌲","🍂","🔥","🌿","🍁","🐝","🦋","🌵"] },
  { id:'calma', label:'💜 Calma y espíritu', icons:["🙏","🪷","❤️","💜","🤝","💆","🛀","🌅","🧿","😌","🌬️","🎶","📿","🤍","🌟","🕊️"] },
  { id:'vida', label:'👨‍👩‍👧 Vida y familia', icons:["🧒","👶","🐶","🐱","📞","💬","🎉","🎁","🌍","🤲","🫶","🏡","🎒","📵","🚶‍♀️","🧑‍🤝‍🧑"] }
];
const HABIT_ICONS = HABIT_ICON_GROUPS.reduce(function(acc,g){ g.icons.forEach(function(ic){ if(acc.indexOf(ic)<0) acc.push(ic); }); return acc; }, []);
const HABIT_ICON_PREVIEW = 14;
let habitIconFilter = 'todas';
let habitIconsExpanded = false;
function habitFilteredIcons(){
  if(habitIconFilter==='todas') return HABIT_ICONS.slice();
  const g=HABIT_ICON_GROUPS.find(function(x){ return x.id===habitIconFilter; });
  return g ? g.icons.slice() : HABIT_ICONS.slice();
}
function renderHabitIconPicker(selected){
  const box=$('habitIconPicker'); if(!box) return;
  selected = (selected==null? (($('habitIcon')||{}).value||'✓') : selected) || '✓';
  box.innerHTML='';
  box.classList.toggle('expanded', !!habitIconsExpanded);
  const bar=document.createElement('div');
  bar.className='habit-picker-bar';
  const sel=document.createElement('select');
  sel.className='habit-cat-select';
  sel.setAttribute('aria-label','Categoría de iconos');
  const optAll=document.createElement('option');
  optAll.value='todas'; optAll.textContent='⭐ Todas ('+HABIT_ICONS.length+')';
  sel.appendChild(optAll);
  HABIT_ICON_GROUPS.forEach(function(g){
    const o=document.createElement('option');
    o.value=g.id; o.textContent=g.label+' ('+g.icons.length+')';
    sel.appendChild(o);
  });
  sel.value=habitIconFilter;
  sel.onchange=function(){ habitIconFilter=sel.value; renderHabitIconPicker(selected); };
  bar.appendChild(sel);
  const count=document.createElement('span');
  count.className='habit-picker-count muted';
  bar.appendChild(count);
  const tog=document.createElement('button');
  tog.type='button'; tog.className='btn habit-toggle-icons';
  tog.setAttribute('aria-expanded', habitIconsExpanded?'true':'false');
  tog.onclick=function(e){ e.preventDefault(); e.stopPropagation(); habitIconsExpanded=!habitIconsExpanded; renderHabitIconPicker(selected); };
  bar.appendChild(tog);
  box.appendChild(bar);
  const grid=document.createElement('div');
  grid.className='habit-icon-grid';
  box.appendChild(grid);
  // icono personalizado actual (pegado a mano) siempre visible primero
  if(selected && HABIT_ICONS.indexOf(selected)<0){
    const b=document.createElement('button');
    b.type='button'; b.className='habit-icon-opt sel habit-custom'; b.textContent=selected; b.title='Actual: '+selected;
    b.onclick=function(){ const inp=$('habitIcon'); if(inp) inp.value=selected; };
    grid.appendChild(b);
  }
  const icons=habitFilteredIcons();
  const visible=habitIconsExpanded? icons : icons.slice(0,HABIT_ICON_PREVIEW);
  visible.forEach(function(ic){
    const b=document.createElement('button');
    b.type='button'; b.className='habit-icon-opt'+(ic===selected?' sel':'');
    b.textContent=ic; b.title=ic;
    b.onclick=function(){ const inp=$('habitIcon'); if(inp) inp.value=ic; grid.querySelectorAll('.habit-icon-opt').forEach(function(x){ x.classList.toggle('sel', x.textContent===ic); }); };
    grid.appendChild(b);
  });
  if(!icons.length){ grid.innerHTML='<span class="muted">Sin iconos en esta categoría.</span>'; }
  count.textContent = habitIconsExpanded ? ('Mostrando '+visible.length+' de '+icons.length) : ('Mostrando '+visible.length+' de '+icons.length+' — despliega para ver más');
  tog.textContent = habitIconsExpanded ? '▲ Mostrar menos' : ('▼ Desplegar iconos ('+icons.length+')');
}
let habitEditingId=null;
function habitsSwitchTab(which){
  const panels={ list:'habitsList', today:'habitsTodayBox', resume:'habitsResumePanel', tracker:'habitsTrackerBox', guide:'habitsGuidePanel' };
  const tabs={ list:'tabHabitsList', today:'tabHabitsToday', resume:'tabHabitsResume', tracker:'tabHabitsTracker', guide:'tabHabitsGuide' };
  Object.entries(panels).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('hidden', k!==which); });
  Object.entries(tabs).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===which); });
}
function setupHabitsDialog(){
  const btn=$('btnHabits'); if(btn) btn.onclick=()=>{ renderHabitIconPicker($('habitIcon').value||'✓'); renderHabitsList(); renderHabitsTodayBox(); renderHabitsStatsBox(); renderHabitsTracker(); renderHabitsLunaBox(); habitsSwitchTab('today'); $('habitsDialog').showModal(); };
  const ct=$('habitsCloseTop'), cb=$('habitsClose'); if(ct) ct.onclick=()=>$('habitsDialog').close(); if(cb) cb.onclick=()=>$('habitsDialog').close();
  const tL=$('tabHabitsList'), tT=$('tabHabitsToday'), tR=$('tabHabitsResume'), tK=$('tabHabitsTracker'), tG=$('tabHabitsGuide');
  if(tL) tL.onclick=()=>habitsSwitchTab('list');
  if(tT) tT.onclick=()=>habitsSwitchTab('today');
  if(tR) tR.onclick=()=>habitsSwitchTab('resume');
  if(tK) tK.onclick=()=>habitsSwitchTab('tracker');
  if(tG) tG.onclick=()=>habitsSwitchTab('guide');
  renderHabitIconPicker('✓');
  const iconInput=$('habitIcon');
  if(iconInput){
    try{ iconInput.readOnly=false; iconInput.maxLength=12; iconInput.placeholder='✓ o pega tu emoji'; }catch(e){}
    iconInput.addEventListener('input', ()=>{
      const v=(iconInput.value||'').trim()||'✓';
      const box=$('habitIconPicker');
      if(!box) return;
      // solo resaltar sin reconstruir (conserva filtro y desplegado)
      let found=false;
      box.querySelectorAll('.habit-icon-opt').forEach(function(x){ const on=x.textContent===v; if(on) found=true; x.classList.toggle('sel', on); });
      if(!found && v!=='✓'){
        // si es personalizado y el picker está desplegado, re-render para mostrarlo arriba
        if(habitIconsExpanded) renderHabitIconPicker(v);
      }
    });
    iconInput.addEventListener('click', ()=>{ const picker=$('habitIconPicker'); if(picker) picker.scrollIntoView({behavior:'smooth', block:'nearest'}); });
  }
  const add=$('habitAdd'); if(add) add.onclick=()=>{
    const nombre=$('habitName').value.trim(); if(!nombre) return alert('Ingresa nombre del hábito');
    const metaMin=Math.max(0, Math.min(1440, parseInt(($('habitGoal')||{}).value)||0));
    const h={ id:'h'+Date.now(), nombre, icono:($('habitIcon').value.trim()||'✓'), color:$('habitColor').value, freq:$('habitFreq').value, metaMin };
    getHabitData().list.push(h); scheduleSave(); $('habitName').value=''; $('habitIcon').value=''; if($('habitGoal')) $('habitGoal').value=0; renderHabitIconPicker('✓'); habitRefreshAll(); try{ habitsSwitchTab('list'); }catch(e){}
  };
  const upd=$('habitUpdate'); if(upd) upd.onclick=()=>{
    const h=getHabitData().list.find(x=>x.id===habitEditingId); if(!h) return;
    h.nombre=$('habitName').value.trim(); h.icono=$('habitIcon').value.trim()||'✓'; h.color=$('habitColor').value; h.freq=$('habitFreq').value;
    h.metaMin=Math.max(0, Math.min(1440, parseInt(($('habitGoal')||{}).value)||0));
    scheduleSave(); habitEditingId=null; $('habitAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('habitCancelEdit').classList.add('hidden'); $('habitName').value=''; $('habitIcon').value=''; if($('habitGoal')) $('habitGoal').value=0; renderHabitIconPicker('✓'); habitRefreshAll(); try{ habitsSwitchTab('list'); }catch(e){}
  };
  const cancel=$('habitCancelEdit'); if(cancel) cancel.onclick=()=>{ habitEditingId=null; $('habitAdd').classList.remove('hidden'); $('habitUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('habitName').value=''; $('habitIcon').value=''; if($('habitGoal')) $('habitGoal').value=0; renderHabitIconPicker('✓'); };
  const clear=$('habitsClear'); if(clear) clear.onclick=()=>{
    if(!confirm('¿Borrar todos los hábitos y registros de esta usuaria?')) return;
    const d=getHabitData(); d.list=[]; d.entries={}; scheduleSave(); habitRefreshAll();
  };
  // pack inicial sugerido (botones .habit-starter en la guía)
  document.addEventListener('click', (e)=>{
    const st=e.target.closest('.habit-starter');
    if(st){
      const nm=st.dataset.name; const ic=st.dataset.icon||'✓'; const col=st.dataset.color||'#e8c56a';
      const dd=getHabitData();
      if(dd.list.some(x=>x.nombre===nm)){ alert('Ya tienes “'+nm+'”'); return; }
      dd.list.push({ id:'h'+Date.now(), nombre:nm, icono:ic, color:col, freq:'diaria', metaMin: Math.max(0, parseInt(st.dataset.min)||0) });
      scheduleSave(); habitRefreshAll();
      if($('statusMsg')){ $('statusMsg').textContent='Hábito agregado: '+nm+' ✓'; setTimeout(()=>{$('statusMsg').textContent='';},2500); }
    }
  });
  // al editar, preseleccionar icono
  const origRenderHabitsList = renderHabitsList;
  // envolver para que al hacer click en editar también actualice picker
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.habit-edit');
    if(btn){
      const h=getHabitData().list.find(x=>x.id===btn.dataset.id);
      if(h) setTimeout(()=> renderHabitIconPicker(h.icono), 50);
    }
  });
}
setTimeout(setupHabitsDialog, 700);

// === MEDICINA NATURAL ===
const NATURAL_HERBS = [
  { n:"Matico", uso:"Cicatrizante, hemorragias", prep:"Infusión hojas 1 cdta/taza, lavado heridas", luna:"Llena", freq:"diaria", time:"20:00", notes:"Lavado externo, no prolongar" },
  { n:"Boldo", uso:"Digestión, hígado", prep:"1-2 hojas infusión corta, no prolongado", luna:"Menguante", freq:"diaria", time:"08:00", notes:"No en embarazo, max 7 días" },
  { n:"Manzanilla", uso:"Calmante, digestión", prep:"Flores 1 cda/taza 5 min", luna:"Nueva", freq:"diaria", time:"21:00", notes:"Noche, relajante" },
  { n:"Menta / Mentha", uso:"Vías respiratorias, digestión", prep:"Hojas frescas infusión", luna:"Creciente", freq:"cada12", time:"10:00", notes:"Post comida" },
  { n:"Orégano", uso:"Antiséptico, respiratorio", prep:"1 cdta seca/taza", luna:"Creciente", freq:"cada8", time:"09:00", notes:"Antiséptico" },
  { n:"Laurel", uso:"Digestión, sahumerio", prep:"1 hoja infusión", luna:"Creciente", freq:"diaria", time:"08:00", notes:"Digestivo" },
  { n:"Eucalipto", uso:"Respiratorio, vapor", prep:"Vahos 3-5 hojas", luna:"Menguante", freq:"diaria", time:"19:00", notes:"Vahos noche" },
  { n:"Romero", uso:"Circulación, memoria", prep:"1 ramita infusión corta", luna:"Creciente", freq:"diaria", time:"07:30", notes:"Mañana" },
  { n:"Melisa/Toronjil", uso:"Ansiedad, sueño", prep:"Hojas 1 cda/taza", luna:"Nueva", freq:"diaria", time:"21:30", notes:"Antes de dormir" },
  { n:"Ortiga", uso:"Hierro, depurativa", prep:"Hojas secas 1 cdta/taza (cocida si fresca)", luna:"Nueva", freq:"diaria", time:"08:00", notes:"Con hierro" }
];
function getNaturalData(){
  const u=userData();
  if(!u.natural) u.natural={ list:[] };
  if(!Array.isArray(u.natural.list)) u.natural.list=[];
  return u.natural;
}
function getMedicNaturalData(){
  const u=userData();
  if(!u.medicinaNatural) u.medicinaNatural={ list:[] };
  if(!Array.isArray(u.medicinaNatural.list)) u.medicinaNatural.list=[];
  // migrar botiquín simple antiguo si existe y natural aún simple
  if(u.natural && Array.isArray(u.natural.list) && u.natural.list.length && !u.medicinaNatural._migrated){
    u.natural.list.forEach(x=>{
      if(x.n && x.uso && !x.name){
        u.medicinaNatural.list.push({ id: x.id||'nat'+Date.now()+Math.random().toString(36).slice(2), name: x.n, dose: x.uso, freq:'diaria', time:'08:00', from: cal.fmtKey.format(new Date()), to:'', days:'', notes: x.uso });
      }
    });
    if(u.medicinaNatural.list.length) u.medicinaNatural._migrated=true;
  }
  return u.medicinaNatural;
}
let naturalEditingId=null;
function renderNaturalList(){
  const box=$('naturalList'); if(!box) return;
  box.innerHTML=NATURAL_HERBS.map(h=>`<div class="habit-item su-3b6a3a" data-n="${escapeHtml(h.n)}"><div class="su-13313b"><b>${escapeHtml(h.n)}</b><span class="chip su-0d5be0">${h.luna} · ${h.freq} ${h.time}</span></div><div class="muted su-11a508">${escapeHtml(h.uso)} — ${escapeHtml(h.prep)}</div><div class="muted su-0d5be0">Sug: ${h.freq} ${h.time}${h.notes?' · '+escapeHtml(h.notes):''}</div></div>`).join('');
  box.querySelectorAll('[data-n]').forEach(el=> el.onclick=()=>{
    const h=NATURAL_HERBS.find(x=>x.n===el.dataset.n);
    if(!h) return;
    $('naturalName').value=h.n;
    $('naturalDose').value=h.prep;
    const f=$('naturalFreq'); if(f) f.value=h.freq||'diaria';
    const t=$('naturalTime'); if(t) t.value=h.time||'08:00';
    const n=$('naturalNotes'); if(n) n.value=h.uso+' — '+h.luna+(h.notes?' · '+h.notes:'');
    const daysRow=$('naturalDaysRow'); if(daysRow) daysRow.style.display= h.freq==='personalizada'?'flex':'none';
    $('naturalName').focus();
  });
}
function renderNaturalUserList(){
  const box=$('naturalUserList'); if(!box) return;
  const d=getMedicNaturalData();
  if(!d.list.length){ box.innerHTML='<p class="muted">Tu botiquín personal está vacío. Toca una sugerida arriba o agrega la tuya con frecuencia/hora/desde/hasta/notas.</p>'; return; }
  box.innerHTML='';
  d.list.forEach(med=>{
    const div=document.createElement('div'); div.className='medic-item';
    const next = medicNextDoses(med, Date.now(), 1)[0];
    const nextTxt = next ? cal.weekdayName(next)+' '+cal.fmtFull.format(new Date(next))+' '+med.time : '—';
    const luna = next? mensLunaForKey(mensMsToKey(next)): null;
    div.innerHTML=`<div class="medic-head"><b>🌿 ${escapeHtml(med.name)}</b> <span class="muted su-11a508">${escapeHtml(med.dose||'')}</span></div><div class="muted su-6cb285">⏰ ${med.freq} ${med.time} ${med.days? '('+escapeHtml(med.days)+')':''} · ${med.from||'?'} → ${med.to||'∞'}</div><div class="muted su-11a508">${escapeHtml(med.notes||'')}</div><div class="su-c20229">Próxima: ${nextTxt} ${luna? '· Luna '+luna.luna:''}</div><div class="dlg-actions su-d764ff"><button data-id="${med.id}" class="btn natural-edit su-337714">✏️ Editar</button><button data-id="${med.id}" class="btn natural-del su-fd834a">✕ Eliminar</button></div>`;
    box.appendChild(div);
  });
  box.querySelectorAll('.natural-edit').forEach(b=> b.onclick=()=>{
    const med=d.list.find(x=>x.id===b.dataset.id); if(!med) return;
    naturalEditingId=med.id;
    $('naturalName').value=med.name; $('naturalDose').value=med.dose||''; $('naturalFreq').value=med.freq||'diaria'; $('naturalTime').value=med.time||'08:00'; $('naturalFrom').value=med.from||''; $('naturalTo').value=med.to||''; $('naturalDays').value=med.days||''; $('naturalNotes').value=med.notes||'';
    $('naturalDaysRow').style.display= med.freq==='personalizada'?'flex':'none';
    $('naturalAdd').classList.add('hidden'); $('naturalUpdate').classList.remove('hidden'); $('naturalCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.natural-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar este preparado natural?')) return;
    d.list=d.list.filter(x=>x.id!==b.dataset.id); scheduleSave(); renderNaturalUserList(); renderMedicNextBox();
  });
}

// === MEDICINA: BÁSICA / HISTORIA / SEGURIDAD ===
function getMedicExtraData(){
  const u=userData();
  if(!u.medicinaExtra) u.medicinaExtra={ botiquin:{}, alergias:'', grupo:'', contacto:'', nutri:{} };
  if(!u.medicinaExtra.botiquin || typeof u.medicinaExtra.botiquin!=='object') u.medicinaExtra.botiquin={};
  if(!u.medicinaExtra.nutri || typeof u.medicinaExtra.nutri!=='object') u.medicinaExtra.nutri={};
  return u.medicinaExtra;
}
const MEDIC_BASICA_CARDS=[
  { t:'🌡️ Signos vitales normales (adultos)', d:'<b>Temperatura:</b> 36,1–37,2 °C · <b>Presión:</b> ideal &lt;120/80 mmHg (consulta si ≥140/90 repetido) · <b>Pulso en reposo:</b> 60–100 lpm · <b>Respiración:</b> 12–20/min · <b>SpO₂:</b> 95–100%. Mide en reposo 5 min, sin café ni cigarro 30 min antes. Anota fecha/hora y lleva el registro al CESFAM.' },
  { t:'💧 Fiebre, hidratación y reposo', d:'<b>Fiebre:</b> ≥38 °C. Hidrata con agua y sales orales si hay vómitos/diarrea, ropa ligera, paños tibios (no hielo). <b>Consulta si:</b> fiebre &gt;3 días, &gt;39,5 °C que no baja, rigidez de cuello, manchas, dificultad respirar, deshidratación (poca orina, mareo al pararse), bebé &lt;3 meses con fiebre.' },
  { t:'🤧 Resfrío, gripe y dolor común', d:'Descanso, agua, miel tibia (solo &gt;1 año), lavado nasal con suero. Paracetamol o ibuprofeno <b>solo</b> según prospecto y sin alergia. <b>No</b> antibióticos para virus. <b>Ve a SAR:</b> falta de aire, dolor pecho, fiebre alta 3+ días, oído con dolor intenso, síntomas que empeoran al día 7–10.' },
  { t:'🩸 Crónicos: presión, diabetes, tiroides', d:'Toma a la <b>misma hora</b>, no saltes dosis aunque te sientas bien. Lleva lista con nombres + dosis a cada control. <b>Hipertensión:</b> menos sal, camina 30 min, mide 2 veces/semana. <b>Diabetes:</b> cuida pies a diario, no suspendas metformina/insulina sin médico. Si olvidas una dosis, <b>no dupliques</b>: sigue la siguiente y anótalo.' },
  { t:'🤰 Embarazo, lactancia, niños y mayores', d:'<b>Embarazo/lactancia:</b> evita automedicarte (incluso hierbas como boldo, ruda, ajenjo). Consulta matrona/CESFAM antes de todo, incluido “natural”. <b>Niños:</b> dosis por peso, nunca aspirina en niños, guarda todo bajo llave y en alto. <b>Mayores:</b> pastillero semanal, revisa duplicados y caídas por mareos; lista visible en el refrigerador.' },
  { t:'🧠 Adherencia: no olvidar tomas', d:'Alarma del calendario + pastillero + registro diario. Si tomas 3+ fármacos, pide en farmacia/CESFAM una <b>revisión de polifarmacia</b> una vez al año. Lleva siempre: carnet, previsión, lista de medicamentos y alergias. Activa ☑️ Notificaciones en 💊 Farmacología.' }
];
const MEDIC_BOTIQUIN_ITEMS=[
  ['termometro','🌡️ Termómetro'],['tensiometro','💓 Tensiómetro (si hay hipertensión)'],['suero','💧 Suero fisiológico 0,9%'],['gasas','🩹 Gasas + apósitos + curitas'],['venda','🌀 Venda elástica + tela adhesiva'],['tijera','✂️ Tijera punta roma + pinza'],['guantes','🧤 Guantes desechables'],['sro','🧂 Sales rehidratación oral'],['paracetamol','💊 Paracetamol (según indicación)'],['antihist','🤧 Antihistamínico (según indicación)'],['linterna','🔦 Linterna + pilas'],['ficha','📄 Ficha alergias + contactos']
];
function renderMedicBasica(){
  const box=$('medicBasicaBox'); if(!box) return;
  box.innerHTML='<div class="help-grid">'+MEDIC_BASICA_CARDS.map(c=>`<div class="help-card"><h4>${c.t}</h4><p class="su-a6c665">${c.d}</p></div>`).join('')+'</div>'
  +'<div class="menstrual-card su-4adf8c"><h4>🚦 ¿CESFAM/SAR, Salud Responde o SAMU 131?</h4><p class="muted su-a6c665"><b>SAMU 131:</b> no respira, inconsciente, dolor pecho &gt;5 min, ACV, hemorragia masiva, convulsión &gt;5 min. <b>SAR Penco 41 272 6350 / CESFAM:</b> fiebre 2+ días, corte que necesita puntos, esguince, vómitos con deshidratación, quemadura leve, picadura infectada. <b>Salud Responde 600 360 7777:</b> dudas 24 h (dosis olvidada, mezcla, cuidado en casa). Lleva lista de medicamentos + alergias.</p></div>';
}
function renderMedicBotiquin(){
  const box=$('medicBotiquinBox'); if(!box) return;
  const d=getMedicExtraData();
  box.innerHTML='';
  MEDIC_BOTIQUIN_ITEMS.forEach(([id,label])=>{
    const on=!!d.botiquin[id];
    const lab=document.createElement('label');
    lab.className='habit-today-item'+(on?' done':'');
    lab.innerHTML=`<input type="checkbox" data-id="${id}" ${on?'checked':''}><span>${label}</span>`;
    box.appendChild(lab);
  });
  box.querySelectorAll('input').forEach(cb=> cb.onchange=()=>{ const dd=getMedicExtraData(); if(cb.checked) dd.botiquin[cb.dataset.id]=true; else delete dd.botiquin[cb.dataset.id]; scheduleSave(); renderMedicBotiquin(); });
  const st=$('medicBotiquinStats');
  if(st){ const n=Object.keys(d.botiquin).length; const pct=Math.round(n/MEDIC_BOTIQUIN_ITEMS.length*100); st.textContent=`${n}/${MEDIC_BOTIQUIN_ITEMS.length} listos (${pct}%)`; }
}
function loadMedicExtra(){
  const d=getMedicExtraData();
  const a=$('medicAlergias'); if(a && document.activeElement!==a) a.value=d.alergias||'';
  const g=$('medicGrupo'); if(g) g.value=d.grupo||'';
  const c=$('medicContacto'); if(c && document.activeElement!==c) c.value=d.contacto||'';
}
function saveMedicExtra(){
  const d=getMedicExtraData();
  const a=$('medicAlergias'), g=$('medicGrupo'), c=$('medicContacto');
  if(a) d.alergias=a.value.trim(); if(g) d.grupo=g.value; if(c) d.contacto=c.value.trim();
  scheduleSave(); const s=$('medicExtraStatus'); if(s){ s.textContent='Guardado ✓'; setTimeout(()=>{s.textContent='';},2000); }
}
const MEDIC_HISTORIA=[
  { era:'universal', anio:'~400 a.C.', t:'Hipócrates — medicina racional', d:'En Grecia se pasa del mito a la observación: historia clínica, dieta, reposo e higiene. Juramento hipocrático: “no dañar”.' },
  { era:'universal', anio:'~150 d.C.', t:'Galeno — anatomía y farmacia', d:'Médico romano que describe anatomía, pulso y prepara ungüentos y píldoras. Sus textos se usan por 1.300 años.' },
  { era:'universal', anio:'~1025', t:'Avicena — Canon de la medicina', d:'Persa que ordena diagnóstico, cuarentena y farmacopea. Base de hospitales y escuelas médicas medievales.' },
  { era:'universal', anio:'1543', t:'Vesalio — cuerpo humano real', d:'“De humani corporis fabrica” corrige errores antiguos con disecciones. Nace la anatomía moderna.' },
  { era:'mapuche', anio:'Pre-1550', t:'Lawen y machi — salud mapuche', d:'La <b>machi</b> sana cuerpo y espíritu con <b>lawen</b> (remedio de hierbas), pewma (sueño), machitún y diálogo con la naturaleza. El <b>lawentuchefe</b> conoce cada planta: canelo (foye, sagrado), matico, boldo, bailahuén, maqui. Se pide permiso (<b>llellipun</b>) al cortar y se devuelve con gratitud. La salud es <b>küme mongen</b> (buen vivir en equilibrio).' },
  { era:'universal', anio:'1796', t:'Jenner — primera vacuna', d:'Vacuna contra viruela con virus vacuno. Inicio de la inmunización: millones de vidas salvadas.' },
  { era:'universal', anio:'1847', t:'Semmelweis — lavarse las manos', d:'Descubre que lavarse las manos baja la fiebre puerperal. Base de la higiene hospitalaria.' },
  { era:'chile', anio:'1550–1800', t:'Hospitales coloniales en Chile', d:'Hospitales de caridad (San Juan de Dios) atienden con botica de hierbas europeas + lawen local. Barberos y curanderas hacen de médicos en pueblos como Penco, refundado tras terremotos.' },
  { era:'universal', anio:'1860', t:'Nightingale — enfermería moderna', d:'Enfermería profesional, estadísticas sanitarias y hospitales ventilados e higiénicos.' },
  { era:'universal', anio:'1928', t:'Fleming — penicilina', d:'Descubre el primer antibiótico. Desde 1940 salva de neumonías e infecciones antes mortales. Hoy: úsalo solo con receta (resistencia).' },
  { era:'chile', anio:'1952', t:'Servicio Nacional de Salud (Chile)', d:'Se crea el SNS: consultorios y hospitales públicos en todo Chile. Vacunación masiva baja mortalidad infantil.' },
  { era:'mapuche', anio:'Siglo XX', t:'Meica, hierbatera y partera', d:'En campos y caletas de Penco-Lirquén, <b>meicas y parteras</b> guardan recetas: matico para heridas, manzanilla para estómago, eucalipto en vahos, boldo corto para hígado. Transmisión oral de abuela a nieta.' },
  { era:'chile', anio:'1980–2000', t:'CESFAM y salud familiar', d:'Modelo de salud familiar: CESFAM Penco y Lirquén con controles, vacunas, salud mental y visitas domiciliarias. Nace Salud Responde (600 360 7777).' },
  { era:'penco', anio:'Hoy', t:'Hospital Penco-Lirquén + SAR', d:'Hospital Penco-Lirquén (Av. Pedro Aguirre Cerda 1400 · 41 272 6300), CESFAM Penco/Lirquén y SAR 24 h (41 272 6350). Conviven farmacia moderna + Lawen Herbario del calendario: registra tus fármacos en 💊 y tus hierbas en 🌱, y estudia historia aquí en 📜.' }
];
const MEDIC_HIST_ERA={ universal:'🌍 Universal', chile:'🇨🇱 Chile', mapuche:'🌿 Mapuche / Lawen', penco:'⚓ Penco' };
function renderMedicHistoria(){
  const box=$('medicHistoriaBox'); if(!box) return;
  const q=(($('medicHistSearch')||{}).value||'').toLowerCase().trim();
  const f=(($('medicHistFilter')||{}).value||'todas');
  const list=MEDIC_HISTORIA.filter(h=>{
    if(f!=='todas' && h.era!==f) return false;
    if(q && !(h.t+' '+h.d+' '+h.anio).toLowerCase().includes(q)) return false;
    return true;
  });
  if(!list.length){ box.innerHTML='<p class="muted">Sin resultados. Prueba con “vacuna”, “machi”, “hospital”...</p>'; return; }
  box.innerHTML='<div class="mens-history">'+list.map(h=>`<div class="mens-hist-item su-0486f7"><span><b>${escapeHtml(h.anio)}</b> · <span class="chip su-0d5be0">${MEDIC_HIST_ERA[h.era]||h.era}</span><br><b>${escapeHtml(h.t)}</b><br><span class="muted su-a6c665">${h.d}</span></span></div>`).join('')+'</div>'
  +'<div class="menstrual-card su-4adf8c"><h4>🙏 Nota intercultural</h4><p class="muted su-a6c665">El lawen mapuche es conocimiento vivo (<b>kimün</b>). Úsalo con respeto: aprende con machi/lawentuchefe, no extraigas en exceso, no mezcles hierbas fuertes con fármacos sin consultar, y cita la fuente cuando compartas. Ver 🌿 Lawen Herbario y Voz de los Abuelos.</p></div>';
}
const MEDIC_SEGURIDAD=[
  { t:'🚫 No te automediques con…', d:'<b>Antibióticos, corticoides, ansiolíticos, warfarina, insulina, antihipertensivos, anticonvulsivantes:</b> siempre con receta y control. Nunca uses receta ajena ni partas comprimidos de liberación prolongada.' },
  { t:'🔀 Mezclas peligrosas frecuentes', d:'<b>Alcohol +</b> paracetamol, ibuprofeno, ansiolíticos o antihistamínicos = daño hígado/somnolencia grave. <b>Ibuprofeno + presión/diuréticos</b> = sube presión y daña riñón. <b>Antiácidos + hierro/tiroides</b> = separa 2–4 h. <b>Pomelo +</b> varios fármacos = altera efecto. <b>Hierba de San Juan +</b> antidepresivos/anticonceptivos = corta efecto. Consulta siempre.' },
  { t:'🌿 “Natural” también tiene riesgo', d:'Boldo &gt;7 días daña hígado · Ruda y ajenjo abortivos · Eucalipto concentrado tóxico en niños · Matico externo no en herida profunda · Ortiga fresca quema (cócela). No combines hierbas sedantes (melisa, valeriana) con ansiolíticos/alcohol. Embarazo/lactancia: pregunta antes.' },
  { t:'🧊 Cómo guardar y cuándo botar', d:'Lugar fresco, seco, oscuro, alto y bajo llave para niños. <b>No</b> en baño (humedad) ni sobre cocina. Revisa vencimiento cada luna: vencidos a <b>punto limpio/farmacia</b>, nunca al WC ni a la basura suelta. Jarabes abiertos: fecha de apertura + 30–90 días según prospecto. Si cambia color/olor, bótalo.' },
  { t:'📝 Lleva tu ficha siempre', d:'En 🩺 Básica guarda alergias + contacto. Además anota: fármaco, dosis, hora, con/sin comida, fecha inicio/fin. Si vas a urgencias lleva la caja o foto del prospecto. Ante ronchas, hinchazón de labios, silbido al respirar → <b>SAMU 131</b> (posible anafilaxia).' }
];
function renderMedicSeguridad(){
  const box=$('medicSeguridadBox'); if(!box) return;
  const extra=getMedicExtraData();
  const aviso=(extra.alergias||extra.grupo)? `<div class="menstrual-card su-68a1a9"><h4 class="su-e39eba">📋 Tu aviso registrado</h4><p class="muted su-11a508">Alergias: <b>${escapeHtml(extra.alergias||'—')}</b> · Grupo: <b>${escapeHtml(extra.grupo||'—')}</b> · Contacto: <b>${escapeHtml(extra.contacto||'—')}</b><br>Muestra esto en CESFAM/SAR/farmacia. Edítalo en 🩺 Básica.</p></div>`:'<p class="muted su-245797">💡 Registra tus alergias en 🩺 Básica y aparecerán aquí como recordatorio.</p>';
  box.innerHTML=aviso+'<div class="help-grid">'+MEDIC_SEGURIDAD.map(c=>`<div class="help-card su-8b6024"><h4>${c.t}</h4><p class="su-a6c665">${c.d}</p></div>`).join('')+'</div>';
}

// === NUTRICIÓN (sección propia en Cuidado, junto a Entrenamientos) ===
let nutriTab='quees';
const MEDIC_NUTRI_CHECKS=[
  ['agua','💧 Tomé 6–8 vasos de agua'],
  ['verduras','🥬 Medio plato de verduras'],
  ['fruta','🍎 2–3 frutas del día'],
  ['legumbres','🫘 Legumbres esta semana (2+ veces)'],
  ['pescado','🐟 Pescado/caleta 2 veces/semana'],
  ['integral','🌾 Grano integral (avena, mote, integral)'],
  ['sellos','🏷️ Evité productos CON sellos hoy'],
  ['horario','🕰️ Comí a horas regulares, sin saltarme']
];
function getMedicNutriData(){
  const d=getMedicExtraData();
  if(!d.nutri || typeof d.nutri!=='object') d.nutri={};
  return d.nutri;
}
function nutriSwitchTab(w){
  nutriTab=w;
  document.querySelectorAll('#nutriDialog [data-nutri-tab]').forEach(b=> b.classList.toggle('btn-accent', b.getAttribute('data-nutri-tab')===w));
  renderNutri();
}
function nutriQueesHTML(){
  return `<div class="menstrual-card su-bcee4f"><h4 class="su-e39eba">📖 ¿Qué es la nutrición?</h4><p class="muted su-b439ab"><b>Alimentación</b> es lo que eliges y comes (acto voluntario y cultural). <b>Nutrición</b> es lo que tu cuerpo hace con eso: digerir, absorber y usar <b>nutrientes</b> para energía, construcción y defensa. comes 3 veces al día; te nutres las 24 h. Por eso no existen “alimentos prohibidos”, sino <b>patrones</b>: lo que repites cada semana manda.</p></div>
  <div class="help-grid su-d2c171">
    <div class="help-card"><h4>⚡ Macros (energía)</h4><p class="su-a6c665"><b>Carbohidratos</b> (4 kcal/g): pan, arroz, papas, mote, avena, legumbres → combustible diario. <b>Proteínas</b> (4 kcal/g): legumbres, huevo, pescado, pollo, lácteos → músculos y defensas. <b>Grasas</b> (9 kcal/g): aceite crudo, palta, frutos secos → energía de reserva y hormonas. Faltan o sobran cuando el plato se desbalancea, no por un alimento solo.</p></div>
    <div class="help-card"><h4>🛡️ Micros (regulan)</h4><p class="su-a6c665"><b>Vitaminas y minerales</b> en pequeñas dosis mandan mucho: hierro (sangre), calcio + vitamina D (huesos), B12 (nervios), vitamina C (absorber hierro y defender), yodo y zinc. Se obtienen comiendo <b>variado y de colores</b>; ningún suplemento reemplaza el plato.</p></div>
    <div class="help-card"><h4>💧 Agua + fibra (olvidadas)</h4><p class="su-a6c665"><b>Agua:</b> 6–8 vasos/día, más con calor o faena física. <b>Fibra:</b> 25 g/día (legumbres, avena, verduras, fruta con cáscara): alimenta tu microbiota, regula azúcar y tránsito. Si tomas hierro, sepáralo del té/café 2 h y acompáñalo con vitamina C.</p></div>
    <div class="help-card"><h4>🍽️ El plato chileno (MINSAL)</h4><p class="su-a6c665"><b>½ verduras</b> + <b>¼ proteína</b> (legumbres, huevo, pescado, pollo) + <b>¼ grano integral</b> (arroz integral, mote, avena, papa con cáscara) + <b>agua</b>. Aceite crudo 1–2 cdtas, fruta de postre. <b>Mano-medida:</b> verduras 2 puños, grano 1 puño, proteína 1 palma, aceite punta del pulgar.</p></div>
  </div>`;
}
function nutriGuiaHTML(){
  return `<div class="help-grid">
    <div class="help-card"><h4>🦴 Lo que más falta en Chile</h4><p class="su-a6c665"><b>Vitamina D:</b> sol 15 min + fortificados. <b>Calcio:</b> 3 lácteos/día. <b>Hierro:</b> legumbres + vitamina C; carne 1–2/sem basta. <b>B12:</b> si comes poco animal, consulta suplemento. <b>Omega-3:</b> pescado 2/sem (jurel, sardina, merluza).</p></div>
    <div class="help-card"><h4>🤰 Etapas</h4><p class="su-a6c665"><b>Embarazo/lactancia:</b> +1 lácteo, hierro + fólico con matrona, cero alcohol y cero dietas. <b>Niños:</b> 3 comidas + 2 colaciones, lácteos diario. <b>Mayores:</b> proteína en cada comida + caminar. <b>Diabetes/presión:</b> plan CESFAM; base: menos sal/azúcar, más legumbre y verdura.</p></div>
    <div class="help-card"><h4>💊 Comida + remedios</h4><p class="su-a6c665">Levotiroxina en ayunas lejos de calcio/hierro 4 h · Hierro lejos de té/lácteos · Metformina con comida. Anota con/sin comida en 💊 y pregunta en farmacia.</p></div>
    <div class="help-card"><h4>🏷️ Sellos ALTO EN (Ley 20.606)</h4><p class="su-a6c665">Prefiere el de <b>menos sellos</b>. Lee en 30 seg: sellos → por 100 g → ingredientes (si azúcar/sal/aceite van primeros, devuélvelo). Cambios: bebida→agua, galleta con sellos→fruta+maní, jugo en caja→fruta entera. Sal &lt;5 g y azúcar &lt;25 g/día.</p></div>
    <div class="help-card"><h4>🚫 Mitos</h4><p class="su-a6c665">“El pan engorda” → engorda el exceso. “Cenar engorda” → importa el total del día. “Detox con jugos” → tu hígado ya lo hace. “Quema-grasa” → ninguno reemplaza plato + movimiento.</p></div>
    <div class="help-card"><h4>🚦 Pedir ayuda</h4><p class="su-a6c665">Nutricionista/médico CESFAM si hay cambios bruscos de peso, sed excesiva, presión o colesterol altos. <b>SAMU 131</b> urgencias · <b>Salud Responde 600 360 7777</b> dudas.</p></div>
  </div>
  <div class="menstrual-card su-4adf8c"><h4>🔗 Conecta</h4><p class="muted su-a6c665">Arma el día en 🥗 <b>Comidas</b>, trae ingredientes con 🛒 <b>Compras</b>, calcula tu meta en 🧮 <b>Calculadora</b> y cosecha de 🌿 <b>Huerta/Siembra</b>.</p></div>`;
}
const NUTRI_HISTORIA=[
  { anio:'~400 a.C.', t:'Hipócrates — “el alimento, medicina”', d:'Dieta, reposo e higiene como tratamiento. La idea de que comer ordena la salud nace aquí.' },
  { anio:'~1025', t:'Avicena — dietética', d:'El Canon dedica capítulos a alimentos por temperamento y edad: nace la dietética como rama médica.' },
  { anio:'1753', t:'Lind — escorbuto y cítricos', d:'El cirujano naval prueba limones contra el escorbuto: primera prueba clínica nutricional. Nace la vitamina C (aunque tardó 150 años en aislarse).' },
  { anio:'~1780', t:'Lavoisier — calorimetría', d:'Mide que el cuerpo “quema” alimentos como una máquina: origen de las calorías y el metabolismo.' },
  { anio:'1912', t:'Funk — “vitaminas”', d:'Bautiza las aminas vitales. En 20 años se descubren A, B, C, D, E y K y se erradican cegueras, raquitismos y beriberis por dieta.' },
  { anio:'1921', t:'Insulina y diabetes', d:'Banting y Best aíslan la insulina: la nutrición y las hormonas se entienden juntas. La dieta del diabético se vuelve ciencia.' },
  { anio:'1970–2000', t:'Chile — desnutrición a obesidad', d:'JUNAEB y PNAC vencen la desnutrición infantil; luego sube la obesidad. El país pasa de “comer poco” a “comer mucho ultraprocesado”.' },
  { anio:'2016', t:'Ley 20.606 — sellos ALTO EN', d:'Chile, pionero mundial: sellos negros, no más publicidad infantil chatarra ni venta en colegios. Varios países copian el modelo.' },
  { anio:'Hoy', t:'NOVA + microbiota + guías MINSAL', d:'Ultraprocesados (NOVA), fibra y microbiota al centro. Guías Alimentarias 2022: más legumbres, pescado, agua y cocina casera; menos sellos. Esta sección las resume para Penco.' }
];
function nutriHistoriaHTML(){
  return `<div class="menstrual-card su-bcee4f"><h4 class="su-e39eba">📜 Historia de la nutrición — del mito al sello</h4><p class="muted su-a6c665">Cómo pasamos de “come esto porque sí” a calorías, vitaminas y sellos negros. La nutrición como ciencia tiene apenas ~100 años.</p></div>`
  +'<div class="mens-history su-d2c171">'+NUTRI_HISTORIA.map(h=>`<div class="mens-hist-item su-0486f7"><span><b>${escapeHtml(h.anio)}</b><br><b>${escapeHtml(h.t)}</b><br><span class="muted su-a6c665">${h.d}</span></span></div>`).join('')+'</div>'
  +'<div class="menstrual-card su-4adf8c"><h4>📚 Para seguir</h4><p class="muted su-a6c665">Guías Alimentarias para Chile (MINSAL) · Ley 20.606 · Clasificación NOVA · Tu nutricionista CESFAM. Si estudias el tema, anótalo en 🧠 Estudio.</p></div>';
}
function nutriPencoHTML(){
  return `<div class="menstrual-card su-bcee4f"><h4 class="su-e39eba">🧺 Comer bien en Penco (feria + caleta + huerta)</h4><p class="muted su-a6c665">Base semanal: <b>legumbres 2–3 veces</b>, <b>pescado 2 veces</b> (jurel, merluza, sardina), huevo 3–4/sem, verduras de estación, papa/mote/avena. Despliega cada tema ⬇️ — el menú de ejemplo va primero.</p></div>
  <div class="help-grid su-d2c171">
    <div class="help-card"><h4>Lunes — Lentejas</h4><p class="su-11a508">Lentejas con zapallo + repollo-limón + manzana. Hierro + fibra por poca plata.</p></div>
    <div class="help-card"><h4>Martes — Jurel</h4><p class="su-11a508">Jurel al horno + papas con cáscara + pebre + naranja (la vit C ayuda a absorber el hierro).</p></div>
    <div class="help-card"><h4>Miércoles — Tortilla</h4><p class="su-11a508">Tortilla de verduras + arroz integral + yogur natural. Buena para llevar al trabajo.</p></div>
    <div class="help-card"><h4>Jueves — Porotos</h4><p class="su-11a508">Porotos con mote + ensalada + kiwi. Cocina olla grande y guarda porción para el sábado.</p></div>
    <div class="help-card"><h4>Viernes — Merluza</h4><p class="su-11a508">Merluza a la plancha + puré + brócoli + limonada sin azúcar. Cierre liviano de semana.</p></div>
    <div class="help-card"><h4>Fin de semana</h4><p class="su-11a508">Sábado: cazuela liviana (aprovecha el caldo de los porotos). Domingo: sobras ordenadas + fruta. Colaciones: fruta, maní sin sal, yogur, avena.</p></div>
  </div>
  <details class="su-6fb574"><summary class="su-49b201">🗓️ Qué trae cada estación (feria)</summary>
    <ul class="su-85bb5c">
      <li><b>Otoño:</b> manzana, pera, membrillo, zapallo, repollo, espinaca, nueces y avellanas. Momento de guisos y sopas.</li>
      <li><b>Invierno:</b> cítricos (naranja, limón, mandarina), kiwi, coliflor, brócoli, zanahoria, betarraga. Vit C contra resfríos.</li>
      <li><b>Primavera:</b> habas, arvejas, lechugas, acelga, frutillas, cerezas. Ensaladas vuelven a la mesa.</li>
      <li><b>Verano:</b> tomate, choclo, porotos granados, durazno, sandía, arándanos, albahaca. Hidrata con fruta + agua.</li>
    </ul>
    <p class="muted su-1db776">Regla feria: lo de estación es más barato, más fresco y con menos viaje. Si está caro, cambia el ingrediente, no la receta.</p>
  </details>
  <details class="su-35380a"><summary class="su-49b201">🐟 Caleta: fresco, barato y seguro</summary>
    <ul class="su-85bb5c">
      <li><b>De Penco:</b> merluza, jurel, sardina, reineta según temporada; choritos, almejas y piures. El jurel es el campeón calidad-precio (omega-3 + hierro).</li>
      <li><b>Ojo fresco:</b> ojos brillantes, agallas rojas, olor a mar (no a amoníaco), carne firme que vuelve al presionar. Marisco: concha cerrada o que se cierra al tocar.</li>
      <li><b>En casa:</b> pescado a 0–4 °C y úsalo en 24 h; si no, porciónalo y congela con fecha (dura 2–3 meses). Descongela en el refrigerador, nunca a temperatura ambiente.</li>
      <li><b>Mariscos:</b> hiérvelos bien (que abran todos), bota los cerrados. Con marea roja o veda, respeta el aviso de la autoridad: no hay plato que valga una intoxicación.</li>
    </ul>
  </details>
  <details class="su-35380a"><summary class="su-49b201">🫙 Olla grande + despensa (cocina una vez, come tres)</summary>
    <ul class="su-85bb5c">
      <li><b>Batch del domingo:</b> 1 olla de legumbres + 1 de grano (arroz/mote) + verduras al horno. Porciona en potes con fecha: 3 días refrigerado, 3 meses congelado.</li>
      <li><b>Despensa base:</b> lentejas, porotos, garbanzos, arroz, avena, mote, harina integral, aceite, sal de mar, orégano, comino, ají, té, leche en polvo o larga vida, atún/jurel en tarro para emergencias.</li>
      <li><b>Remojo:</b> legumbres 8–12 h con agua + limón/vinagre, bota esa agua y cocina con agua nueva: menos gases, mejor digestión.</li>
      <li><b>Rotula todo:</b> nombre + fecha con masking tape. Lo que no se ve, se pierde al fondo del freezer.</li>
    </ul>
  </details>
  <details class="su-35380a"><summary class="su-49b201">🌱 De tu huerta y la luna</summary>
    <p class="muted su-540708">Cilantro, perejil, lechuga, acelga, zanahoria y habas se dan bien en Penco y abaratan la ensalada. Cosecha en la mañana (más turgente) y lava con agua segura. Cruza con 🌿 <b>Huerta/Siembra</b> del calendario: siembra hoja en creciente, raíz en menguante, y programa tus almácigos por luna.</p>
  </details>
  <details class="su-35380a"><summary class="su-49b201">💧 Agua y colaciones que salvan</summary>
    <ul class="su-85bb5c">
      <li><b>Agua:</b> 6–8 vasos; lleva botella a la pega, la caleta y la multicancha. Agua con rodaja de limón o pepino reemplaza la bebida.</li>
      <li><b>Colación mochila:</b> fruta + maní sin sal, yogur, huevo duro, avena con leche. Evita el kiosco con sellos a las 11:00.</li>
      <li><b>Once chilena sana:</b> pan integral + palta/huevo/quesillo + tomate, té o leche. La once no es enemiga: manda la porción.</li>
    </ul>
  </details>
  <div class="menstrual-card su-d2c171"><h4>💰 Ahorro feria</h4><p class="muted su-a6c665">Compra lo de estación con lista (🛒 <b>Compras</b>), anda a última hora por ofertas, prefiere feria/caleta sobre mall, congela pan y pescado porcionado y usa tu huerta. Menos sellos = menos plata y más salud. Anota el menú en 🥗 <b>Comidas</b> para verlo en la luna.</p></div>`;
}
function nutriSemanaHTML(){
  const d=getMedicNutriData();
  const n=MEDIC_NUTRI_CHECKS.filter(([id])=>d[id]).length;
  const pct=Math.round(n/MEDIC_NUTRI_CHECKS.length*100);
  return `<div class="menstrual-card"><h4 class="su-a80552">✅ Mi semana nutricional (${n}/${MEDIC_NUTRI_CHECKS.length} · ${pct}%)</h4><p class="muted su-11a508">Toca para marcar. Privado y local por usuario. Apunta a 6/8 sin culpa.</p><div id="nutriChecks" class="habits-today-grid su-8a77e5">`
    +MEDIC_NUTRI_CHECKS.map(([id,label])=>`<label class="habit-today-item${d[id]?' done':''}"><input type="checkbox" data-id="${id}" ${d[id]?'checked':''}><span>${label}</span></label>`).join('')
    +`</div><div class="dlg-actions su-efea1d"><span class="muted su-11a508">${pct>=75?'🌟 ¡Semana equilibrada!':pct>=50?'💪 Vas bien, suma agua y verduras':'🌱 Empieza por agua + 1 verdura hoy'}</span><button type="button" id="nutriReset" class="btn su-337714">↺ Reiniciar</button></div></div>
    <div class="menstrual-card su-4adf8c"><h4>📝 Meta de esta luna</h4><p class="muted su-a6c665">Elige UNA sola (ej: “legumbres martes y jueves”). Anótala en 🥗 Comidas y revísala cada luna.</p></div>`;
}
function renderNutri(){
  const box=$('nutriBox'); if(!box) return;
  let html='';
  if(nutriTab==='guia') html=nutriGuiaHTML();
  else if(nutriTab==='historia') html=nutriHistoriaHTML();
  else if(nutriTab==='penco') html=nutriPencoHTML();
  else if(nutriTab==='semana') html=nutriSemanaHTML();
  else html=nutriQueesHTML();
  box.innerHTML=html;
  const checks=box.querySelectorAll('#nutriChecks input');
  checks.forEach(cb=> cb.onchange=()=>{ const dd=getMedicNutriData(); if(cb.checked) dd[cb.dataset.id]=true; else delete dd[cb.dataset.id]; scheduleSave(); renderNutri(); });
  const rs=$('nutriReset'); if(rs) rs.onclick=()=>{ const dd=getMedicExtraData(); dd.nutri={}; scheduleSave(); renderNutri(); };
}
function setupNutriDialog(){
  const btn=$('btnNutri'); if(btn) btn.onclick=()=>{ nutriSwitchTab('quees'); $('nutriDialog').showModal(); };
  const ct=$('nutriCloseTop'), cb=$('nutriClose'); if(ct) ct.onclick=()=>$('nutriDialog').close(); if(cb) cb.onclick=()=>$('nutriDialog').close();
  document.querySelectorAll('#nutriDialog [data-nutri-tab]').forEach(b=>{ b.onclick=()=>nutriSwitchTab(b.getAttribute('data-nutri-tab')); });
}
setTimeout(setupNutriDialog, 600);

// === PLANIFICADOR DE COMIDAS ===
function getMealData(){
  const u=userData();
  if(!u.meals) u.meals={ entries:{} };
  if(!u.meals.entries || typeof u.meals.entries!=='object') u.meals.entries={};
  return u.meals;
}
function renderMealWeekBox(){
  const box=$('mealWeekBox'); if(!box) return;
  const data=getMealData();
  const todayKey=cal.fmtKey.format(new Date());
  let html='<h4 class="su-a80552">📅 Semana</h4><div class="mens-history">';
  for(let i=0;i<7;i++){
    const ms=mensKeyToMs(todayKey)+i*86400000;
    const k=mensMsToKey(ms);
    const e=data.entries[k];
    const has=e && (e.breakfast||e.lunch||e.dinner);
    html+=`<div class="mens-hist-item" style="${has?'border-color:var(--gold)':''}"><span><b>${cal.weekdayName(ms).slice(0,3)} ${k.slice(5)}</b> — ${has? escapeHtml([e.breakfast,e.lunch,e.dinner].filter(Boolean).join(' · ')) : '<span class=\'muted\'>sin plan</span>'} </span><button data-k="${k}" class="btn btn-icon meal-load su-f26165">✏️</button></div>`;
  }
  html+='</div>';
  box.innerHTML=html;
  box.querySelectorAll('.meal-load').forEach(b=> b.onclick=()=>{
    $('mealDate').value=b.dataset.k; loadMealDate(b.dataset.k);
  });
}
function renderMealLunaBox(){
  const box=$('mealLunaBox'); if(!box||!cycle) return;
  const data=getMealData();
  const days=cycle.days.filter(d=>d.luna===currentView.luna);
  let done=0; days.forEach(d=>{ const k=cal.fmtKey.format(new Date(d.noonMs)); if(data.entries[k] && (data.entries[k].breakfast||data.entries[k].lunch||data.entries[k].dinner)) done++; });
  const pct=days.length? Math.round(done/days.length*100):0;
  box.innerHTML=`<h4 class="su-a80552">🌙 Luna ${currentView.luna} — comidas</h4><p class="muted su-6cb285">${done}/${days.length} días con plan (${pct}%)</p><div class="su-9c3529"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#a9d18e,#e8c56a)"></div></div>`;
}

// === NUTRICIÓN ===
const FOOD_DB = {
  "avena": { cal:68, prot:2.5, carb:12, fat:1.4, hierro:0.8, fibra:1.7 },
  "lentejas": { cal:116, prot:9, carb:20, fat:0.4, hierro:3.3, fibra:7.9 },
  "arroz": { cal:130, prot:2.4, carb:28, fat:0.3, hierro:0.2, fibra:0.4 },
  "quinoa": { cal:120, prot:4.4, carb:21, fat:1.9, hierro:1.5, fibra:2.8 },
  "pollo": { cal:165, prot:31, carb:0, fat:3.6, hierro:1.0, fibra:0 },
  "pescado": { cal:140, prot:26, carb:0, fat:3, hierro:0.8, fibra:0 },
  "huevo": { cal:143, prot:12.6, carb:0.7, fat:9.5, hierro:1.2, fibra:0 },
  "leche": { cal:42, prot:3.4, carb:5, fat:1, hierro:0, fibra:0 },
  "pan": { cal:265, prot:9, carb:49, fat:3.2, hierro:2.5, fibra:2.7 },
  "papa": { cal:77, prot:2, carb:17, fat:0.1, hierro:0.8, fibra:2.1 },
  "espinaca": { cal:23, prot:2.9, carb:3.6, fat:0.4, hierro:2.7, fibra:2.2 },
  "betarraga": { cal:43, prot:1.6, carb:9.6, fat:0.2, hierro:0.8, fibra:2.8 },
  "tomate": { cal:18, prot:0.9, carb:3.9, fat:0.2, hierro:0.3, fibra:1.2 },
  "palta": { cal:160, prot:2, carb:8.5, fat:14.7, hierro:0.6, fibra:6.7 },
  "manzana": { cal:52, prot:0.3, carb:14, fat:0.2, hierro:0.1, fibra:2.4 },
  "plátano": { cal:89, prot:1.1, carb:23, fat:0.3, hierro:0.3, fibra:2.6 },
  "brocoli": { cal:34, prot:2.8, carb:7, fat:0.4, hierro:0.7, fibra:2.6 },
  "zanahoria": { cal:41, prot:0.9, carb:10, fat:0.2, hierro:0.3, fibra:2.8 },
  "poroto": { cal:333, prot:21, carb:62, fat:0.8, hierro:5, fibra:15 },
  "yogur": { cal:59, prot:3.5, carb:5, fat:3.3, hierro:0, fibra:0 },
  "queso": { cal:402, prot:25, carb:2, fat:33, hierro:0.7, fibra:0 },
  "almendras": { cal:575, prot:21, carb:22, fat:50, hierro:3.7, fibra:12 },
  "nuez": { cal:654, prot:15, carb:14, fat:65, hierro:2.9, fibra:6.7 },
  "berries": { cal:57, prot:0.7, carb:14, fat:0.3, hierro:0.3, fibra:2.4 },
  "chocolate": { cal:546, prot:4.9, carb:61, fat:31, hierro:11, fibra:7 },
  "miel": { cal:304, prot:0.3, carb:82, fat:0, hierro:0.4, fibra:0.2 }
};
function parseNutrition(text){
  if(!text) return null;
  const parts=text.split(/[,;\n]+/).map(s=>s.trim().toLowerCase()).filter(Boolean);
  let tot={cal:0,prot:0,carb:0,fat:0,hierro:0,fibra:0, count:0};
  parts.forEach(p=>{
    for(const key in FOOD_DB){
      if(p.includes(key)){
        const v=FOOD_DB[key];
        tot.cal+=v.cal; tot.prot+=v.prot; tot.carb+=v.carb; tot.fat+=v.fat; tot.hierro+=v.hierro; tot.fibra+=v.fibra; tot.count++;
        break;
      }
    }
  });
  if(tot.count===0) return null;
  return tot;
}
function renderMealNutritionBox(){
  const box=$('mealNutritionBox'); if(!box) return;
  const k=$('mealDate')?.value; if(!k){ box.innerHTML='<p class="muted">Elige fecha para ver cálculo.</p>'; return; }
  const e=getMealData().entries[k];
  if(!e || (!e.breakfast && !e.lunch && !e.dinner && !e.snack)){
    box.innerHTML='<h4 class="su-e39eba">📊 Nutrición estimada</h4><p class="muted">Sin comidas para este día. Agrega desayuno/almuerzo/cena para calcular.</p>';
    return;
  }
  const allText=[e.breakfast,e.lunch,e.dinner,e.snack].filter(Boolean).join(', ');
  const tot=parseNutrition(allText);
  if(!tot){
    box.innerHTML='<h4 class="su-e39eba">📊 Nutrición estimada</h4><p class="muted">No se reconocieron alimentos. Prueba con: avena, lentejas, pollo, ensalada.</p>';
    return;
  }
  box.innerHTML=`<h4 class="su-e39eba">📊 Nutrición estimada — ${k}</h4>
    <div class="su-b022fe">
      <div class="chip su-91a870"><b>${Math.round(tot.cal)}</b><br><span class="muted su-0d5be0">kcal</span></div>
      <div class="chip su-91a870"><b>${tot.prot.toFixed(1)}g</b><br><span class="muted su-0d5be0">proteína</span></div>
      <div class="chip su-91a870"><b>${tot.carb.toFixed(1)}g</b><br><span class="muted su-0d5be0">carbos</span></div>
      <div class="chip su-91a870"><b>${tot.fat.toFixed(1)}g</b><br><span class="muted su-0d5be0">grasa</span></div>
      <div class="chip su-91a870"><b>${tot.hierro.toFixed(1)}mg</b><br><span class="muted su-0d5be0">hierro</span></div>
      <div class="chip su-91a870"><b>${tot.fibra.toFixed(1)}g</b><br><span class="muted su-0d5be0">fibra</span></div>
    </div>
    <p class="muted su-d47a97">Estimación por porción estándar (100g aprox). No reemplaza consejo nutricional.</p>`;
}
function renderMealSuggestionsBox(){
  const box=$('mealSuggestionsBox'); if(!box) return;
  const k=$('mealDate')?.value;
  const e=k? getMealData().entries[k] : null;
  const allText=e? [e.breakfast,e.lunch,e.dinner,e.snack].filter(Boolean).join(' ').toLowerCase() : '';
  const tot=allText? parseNutrition(allText) : null;
  // sugerencias según luna y nutrientes
  const lunaInfo = currentView? (currentView.tipo==='dft'? 'DFT' : MOONS[currentView.luna-1]?.nombre) : '';
  let sug=[];
  if(!tot){
    sug.push('🥗 <b>Base Penco:</b> avena + fruta mañana, legumbre al mediodía, verdura + proteína noche. Agrega color cada comida.');
  } else {
    if(tot.hierro < 6) sug.push('🔴 <b>Hierro bajo (~'+tot.hierro.toFixed(1)+'mg):</b> suma lentejas, espinaca, betarraga + vitamina C (naranja, tomate).');
    if(tot.prot < 40) sug.push('💪 <b>Proteína baja:</b> añade huevo, pollo, pescado, quinoa o yogur.');
    if(tot.fibra < 15) sug.push('🌾 <b>Fibra baja:</b> incorpora avena, brocoli, porotos, manzana con piel.');
    if(tot.cal < 1200) sug.push('⚡ <b>Energía baja:</b> agrega frutos secos (almendras/nuez) o palta.');
    if(tot.cal > 2500) sug.push('⚖️ <b>Calorías altas:</b> aligera cena, prioriza verdura y agua.');
  }
  // sugerencia por luna
  if(currentView && currentView.tipo==='luna'){
    const n=currentView.luna;
    if(n<=3) sug.push('🌧️ <b>Pukem (invierno):</b> guisos calientes, legumbres, sopas, infusión boldo/matico.');
    else if(n<=6) sug.push('🌱 <b>Pewü (primavera):</b> brotes, ensaladas, pescado, semilla zapallo.');
    else if(n<=9) sug.push('☀️ <b>Walüng (verano):</b> fruta fresca, ensalada, pescado, hidratación + berries.');
    else sug.push('🍂 <b>Rimü (otoño):</b> cremas, porotos, piñón, manzana, chicha de manzana sin exceso.');
  }
  if(sug.length===0) sug.push('✅ Equilibrado para hoy. Mantén variedad y agua.');
  box.innerHTML='<h4 class="su-a80552">💡 Sugerencias</h4>' + sug.map(s=>'<p class="muted su-5cb278">'+s+'</p>').join('') + '<p class="muted su-d47a97">Sugerencias estacionales para Penco, no diagnóstico.</p>';
}

// === CALCULADORA NUTRICIONAL + MENÚS ===
function getNutritionProfile(){
  const u=userData();
  if(!u.nutricion) u.nutricion={ sexo:'mujer', edad:30, peso:65, altura:165, actividad:'1.55', objetivo:'mantener', prote:'1.8', ultimaCalc:null };
  return u.nutricion;
}
function calcNutrition(p){
  const peso=parseFloat(p.peso), altura=parseFloat(p.altura), edad=parseInt(p.edad);
  if(!peso||!altura||!edad) return null;
  const act=parseFloat(p.actividad)||1.55;
  const protFactor=parseFloat(p.prote)||1.8;
  let tmb;
  if(p.sexo==='hombre') tmb = 10*peso + 6.25*altura -5*edad +5;
  else if(p.sexo==='mujer') tmb = 10*peso + 6.25*altura -5*edad -161;
  else tmb = 10*peso + 6.25*altura -5*edad -78; // promedio
  const tdee = Math.round(tmb*act);
  let ajuste=0;
  if(p.objetivo==='perder_suave') ajuste=-300;
  else if(p.objetivo==='perder') ajuste=-500;
  else if(p.objetivo==='ganar_suave') ajuste=300;
  else if(p.objetivo==='ganar') ajuste=500;
  const objetivoKcal = tdee + ajuste;
  const protG = Math.round(peso * protFactor);
  const protKcal = protG*4;
  const fatG = Math.round(peso*0.9); // 0.9g/kg ~ 25-30%
  const fatKcal = fatG*9;
  let carbKcal = objetivoKcal - protKcal - fatKcal;
  if(carbKcal<0) carbKcal=0;
  const carbG = Math.round(carbKcal/4);
  const imc = peso / Math.pow(altura/100,2);
  const agua = Math.round(peso*35); // ml
  return { tmb:Math.round(tmb), tdee, objetivoKcal, protG, fatG, carbG, imc: imc.toFixed(1), agua, ajuste };
}
function renderCalcResultado(){
  const box=$('calcResultado'); const det=$('calcDetalle'); if(!box) return;
  const prof=getNutritionProfile();
  const r=calcNutrition(prof);
  if(!r){ box.innerHTML='<p class="muted">Completa edad, peso y altura para calcular.</p>'; if(det) det.classList.add('hidden'); return; }
  const imcCat = r.imc<18.5?'Bajo peso': r.imc<25?'Normal': r.imc<30?'Sobrepeso':'Obesidad';
  box.innerHTML=`<h4 class="su-e39eba">🎯 Tu meta: ${r.objetivoKcal} kcal/día</h4>
    <div class="su-b022fe">
      <div class="chip su-91a870"><b>${r.tmb}</b><br><span class="muted su-0d5be0">TMB</span></div>
      <div class="chip su-91a870"><b>${r.tdee}</b><br><span class="muted su-0d5be0">TDEE</span></div>
      <div class="chip su-91a870"><b>${r.objetivoKcal}</b><br><span class="muted su-0d5be0">Objetivo</span></div>
      <div class="chip su-91a870"><b>${r.protG}g</b><br><span class="muted su-0d5be0">Proteína</span></div>
      <div class="chip su-91a870"><b>${r.carbG}g</b><br><span class="muted su-0d5be0">Carbos</span></div>
      <div class="chip su-91a870"><b>${r.fatG}g</b><br><span class="muted su-0d5be0">Grasa</span></div>
    </div>
    <div class="su-67b198">
      <span class="chip">IMC ${r.imc} · ${imcCat}</span>
      <span class="chip">💧 Agua ~${r.agua} ml/día</span>
      <span class="chip">${prof.objetivo.replace('_',' ')} (${r.ajuste>=0?'+'+r.ajuste:r.ajuste} kcal)</span>
    </div>
    <div class="su-10c3ba">
      <div style="width:${Math.round(r.protG*4/r.objetivoKcal*100)}%;background:#a9d18e"></div>
      <div style="width:${Math.round(r.carbG*4/r.objetivoKcal*100)}%;background:#e8c56a"></div>
      <div style="width:${Math.round(r.fatG*9/r.objetivoKcal*100)}%;background:#7ab8ff"></div>
    </div>
    <p class="muted su-bf4cbe">Distribución: <span class="su-559282">● Proteína ${Math.round(r.protG*4/r.objetivoKcal*100)}%</span> · <span class="su-7c91e2">● Carbos ${Math.round(r.carbG*4/r.objetivoKcal*100)}%</span> · <span class="su-721a46">● Grasa ${Math.round(r.fatG*9/r.objetivoKcal*100)}%</span></p>`;
  if(det){
    det.classList.remove('hidden');
    det.innerHTML=`<h4>📋 Detalle</h4>
      <p class="muted su-a6c665">TMB (reposo) ${r.tmb} × actividad ${prof.actividad} = TDEE ${r.tdee}. Objetivo ${r.objetivoKcal} kcal. Proteína ${r.protG}g ×4=${r.protG*4} kcal · Grasa ${r.fatG}g ×9=${r.fatG*9} kcal · Carbos resto ${r.carbG}g.</p>
      <p class="muted su-11a508">Recomendación: 25-35g fibra, &lt;2300mg sodio, 5 porciones verdura/fruta. Si entrenas fuerza, prioriza proteína repartida en 3-4 comidas.</p>
      <p class="muted su-0d5be0">Cálculo informativo, no reemplaza evaluación profesional.</p>`;
  }
  renderMealCompareBox();
  renderMealMenus();
}
function renderMealCompareBox(){
  const box=$('mealCompareBox'); if(!box) return;
  const k=$('mealDate')?.value;
  const r=calcNutrition(getNutritionProfile());
  if(!r){ box.innerHTML=''; return; }
  const e=k? getMealData().entries[k]:null;
  const tot=e? parseNutrition([e.breakfast,e.lunch,e.dinner,e.snack].filter(Boolean).join(', ')) : null;
  if(!tot){ box.innerHTML=`<h4 class="su-a80552">⚖️ Plan vs meta (${r.objetivoKcal} kcal)</h4><p class="muted">Sin plan este día. Carga un menú de 🍽️ Menús sugeridos.</p>`; return; }
  const pctCal=Math.round(tot.cal/r.objetivoKcal*100);
  const pctProt=Math.round(tot.prot/r.protG*100);
  const pctCarb=Math.round(tot.carb/r.carbG*100);
  const pctFat=Math.round(tot.fat/r.fatG*100);
  const bar=(pct, col)=> `<div class="su-ed37ef"><div style="width:${Math.min(100,pct)}%;height:100%;background:${col}"></div></div>`;
  box.innerHTML=`<h4 class="su-a80552">⚖️ Plan del día vs meta (${r.objetivoKcal} kcal)</h4>
    <div class="su-59663d">
      <div><b>${Math.round(tot.cal)} kcal</b> <span class="muted">${pctCal}% meta</span>${bar(pctCal, pctCal>110?'#e76e8a': pctCal<70?'#e8c56a':'#a9d18e')}</div>
      <div><b>${tot.prot.toFixed(1)}g prot</b> <span class="muted">${pctProt}%</span>${bar(pctProt,'#a9d18e')}</div>
      <div><b>${tot.carb.toFixed(1)}g carb</b> <span class="muted">${pctCarb}%</span>${bar(pctCarb,'#e8c56a')}</div>
      <div><b>${tot.fat.toFixed(1)}g grasa</b> <span class="muted">${pctFat}%</span>${bar(pctFat,'#7ab8ff')}</div>
    </div>
    <p class="muted su-e13d76">${pctCal<80?'⚡ Te faltan ~'+(r.objetivoKcal-Math.round(tot.cal))+' kcal — agrega snack (yogur+fruta, palta+pan).': pctCal>115?'⚠️ Excedes ~'+(Math.round(tot.cal)-r.objetivoKcal)+' kcal — aligera cena.':'✅ Dentro de rango (±15%).'}</p>`;
}
const MENUS_SUGERIDOS = [
  { id:'m1', nombre:'Penco Económico', kcal:1850, prot:95, carb:220, fat:65, precio:'$ bajo', desc:'Feria + legumbre — ideal para presupuesto ajustado', desayuno:'Avena 60g + leche 200ml + manzana + miel 5g', almuerzo:'Lentejas 120g secas + arroz 60g + ensalada tomate/lechuga + palta 30g', cena:'Tortilla espinaca 2 huevos + papa 150g + zanahoria', snack:'Yogur natural 200g + avena 20g' },
  { id:'m2', nombre:'Equilibrado Costa', kcal:2100, prot:110, carb:250, fat:70, precio:'$$ medio', desc:'Mantener — proteína moderada, fibra alta', desayuno:'Pan 80g + huevo 1 + palta 40g + leche 200ml', almuerzo:'Pescado 150g + quinoa 70g + brocoli 150g + tomate', cena:'Pollo 130g + papa 200g + ensalada betarraga/zanahoria', snack:'Manzana + almendras 15g + yogur 150g' },
  { id:'m3', nombre:'Activo / Ganar músculo', kcal:2500, prot:140, carb:280, fat:85, precio:'$$$', desc:'Entreno 4-5 días — más proteína y carb', desayuno:'Avena 80g + leche 250ml + plátano + almendras 10g + miel', almuerzo:'Pollo 180g + arroz 90g + poroto 60g + ensalada', cena:'Pescado 160g + quinoa 80g + palta 50g + espinaca', snack:'Queso fresco 60g + pan 40g + berries 80g' },
  { id:'m4', nombre:'Ligero / Perder suave', kcal:1650, prot:90, carb:170, fat:55, precio:'$ bajo', desc:'Déficit suave — saciedad con legumbre y verdura', desayuno:'Yogur 200g + avena 40g + manzana', almuerzo:'Ensalada grande lentejas 80g + pollo 100g + tomate/pepino', cena:'Sopa verduras + huevo 2 + pan 40g', snack:'Zanahoria + hummus 40g (o poroto molido)' },
  { id:'m5', nombre:'Vegetariano Penco', kcal:2050, prot:85, carb:260, fat:68, precio:'$$', desc:'Sin carne — huevo/lácteo + legumbre', desayuno:'Avena 60g + leche 200ml + chía 10g + plátano', almuerzo:'Quinoa 80g + lentejas 100g + brocoli + zanahoria + palta 30g', cena:'Tortilla 2 huevos + arroz 60g + ensalada', snack:'Yogur + nuez 15g + manzana' }
];
function renderMealMenus(){
  const resumen=$('menusResumen'); const lista=$('menusLista'); if(!lista) return;
  const prof=getNutritionProfile(); const r=calcNutrition(prof);
  if(!r){
    if(resumen) resumen.innerHTML='<p class="muted">Calcula primero tu meta en 🧮 Calculadora.</p>';
    lista.innerHTML='';
    return;
  }
  if(resumen){
    resumen.innerHTML=`<h4 class="su-e39eba">🍽️ Menús para ${r.objetivoKcal} kcal · Prot ${r.protG}g · Carb ${r.carbG}g · Grasa ${r.fatG}g</h4>
      <p class="muted su-11a508">Mostrando menús ordenados por cercanía a tu meta. Toca <b>Cargar</b> para copiar al plan del día.</p>
      <div class="su-b022fe">
        <div class="chip su-91a870"><b>${r.objetivoKcal}</b><br><span class="muted su-0d5be0">kcal meta</span></div>
        <div class="chip su-91a870"><b>${r.imc}</b><br><span class="muted su-0d5be0">IMC</span></div>
        <div class="chip su-91a870"><b>${r.agua} ml</b><br><span class="muted su-0d5be0">agua</span></div>
      </div>`;
  }
  const sorted=[...MENUS_SUGERIDOS].map(m=> ({...m, diff: Math.abs(m.kcal - r.objetivoKcal) + Math.abs(m.prot - r.protG)*4 })).sort((a,b)=>a.diff-b.diff);
  lista.innerHTML=sorted.map(m=>{
    const delta=m.kcal - r.objetivoKcal;
    const tag= Math.abs(delta)<100 ? '<span class="chip su-8323db">✓ Cerca</span>' : delta>0? `<span class="chip">${'+'+delta} kcal</span>` : `<span class="chip">${delta} kcal</span>`;
    return `<div class="si-card su-63ba3c">
      <div class="su-13313b"><h4>${escapeHtml(m.nombre)} ${tag}</h4><span class="muted su-11a508">${m.precio}</span></div>
      <p class="muted su-11a508">${escapeHtml(m.desc)} — ${m.kcal} kcal · P ${m.prot}g · C ${m.carb}g · G ${m.fat}g</p>
      <div class="su-596d4d">
        <b>Desayuno:</b> ${escapeHtml(m.desayuno)}<br>
        <b>Almuerzo:</b> ${escapeHtml(m.almuerzo)}<br>
        <b>Cena:</b> ${escapeHtml(m.cena)}<br>
        <b>Snack:</b> ${escapeHtml(m.snack)}
      </div>
      <div class="dlg-actions su-8f9e27">
        <button type="button" data-id="${m.id}" class="btn btn-accent menu-load su-30e741">📥 Cargar en plan de hoy</button>
        <button type="button" data-id="${m.id}" class="btn menu-shop su-30e741">🛒 A lista</button>
      </div>
    </div>`;
  }).join('');
  lista.querySelectorAll('.menu-load').forEach(b=> b.onclick=()=>{
    const m=MENUS_SUGERIDOS.find(x=>x.id===b.dataset.id); if(!m) return;
    const k=$('mealDate')?.value || cal.fmtKey.format(new Date());
    $('mealBreakfast').value=m.desayuno;
    $('mealLunch').value=m.almuerzo;
    $('mealDinner').value=m.cena;
    $('mealSnack').value=m.snack;
    $('mealNotes').value=`Menú ${m.nombre} · ${m.kcal} kcal (meta ${r.objetivoKcal})`;
    // switch to plan tab
    showMealTab('plan');
    loadMealDate(k); // to sync preview? but we just set values, need to render boxes
    setTimeout(()=>{ renderMealNutritionBox(); renderMealSuggestionsBox(); renderMealCompareBox(); },80);
    $('statusMsg').textContent='Menú cargado en formulario — pulsa Guardar día';
    setTimeout(()=> $('statusMsg').textContent='',2000);
  });
  lista.querySelectorAll('.menu-shop').forEach(b=> b.onclick=()=>{
    const m=MENUS_SUGERIDOS.find(x=>x.id===b.dataset.id); if(!m) return;
    const shop=getShoppingData();
    const txt=[m.desayuno,m.almuerzo,m.cena,m.snack].join(', ');
    const parts=txt.split(/[,;]+/).map(s=>s.trim()).slice(0,12);
    parts.forEach(p=>{
      const name=p.split(' ').slice(0,3).join(' ');
      if(name) shop.items.push({ id:'s'+Date.now()+Math.random().toString(36).slice(2,5), name: name.slice(0,40), qty:'', cat:'Otros', done:false });
    });
    scheduleSave(); renderShoppingList();
    $('statusMsg').textContent='Ingredientes añadidos a 🛒';
    setTimeout(()=> $('statusMsg').textContent='',1500);
  });
}
// === RECETAS (Comidas > pestaña 🍳) ===
const RECETAS_BASE = [
  { id:'r1', nombre:'Lentejas guisadas Penco', cat:'Almuerzo', tiempo:35, dif:'Fácil', costo:'$', kcal:520, porc:'4 platos', tags:'lentejas legumbre hierro economico invierno guiso sin carne',
    ing:['2 tazas lentejas (remojadas 4h o noche anterior)','1 cebolla picada','1 zanahoria rallada','1 diente ajo','1 cda aceite','1/2 pimentón picado','Sal, orégano, laurel','Arroz para acompañar (opcional)'],
    pasos:['Enjuaga y cose las lentejas en 6 tazas de agua con laurel 20 min.','Aparte sofríe cebolla, ajo, pimentón y zanahoria 5 min.','Junta sofrito con lentejas, sazona y cocina 10 min más.','Sirve con arroz o pan. Guarda resto para mañana.'] },
  { id:'r2', nombre:'Porotos con riendas', cat:'Almuerzo', tiempo:50, dif:'Media', costo:'$', kcal:640, porc:'5 platos', tags:'porotos fideos tallarines chilena invierno energia',
    ing:['2 tazas porotos (remojados noche anterior)','120g tallarines o espagueti trozados','1 cebolla','1 zanahoria','1 trozo zapallo 200g','Ajo, ají de color, orégano, sal'],
    pasos:['Cose porotos en agua con sal 35 min (olla común) u 20 min (presión).','Agrega zapallo en cubos y cocina 10 min.','Sofríe cebolla + zanahoria + ají de color y añade.','Agrega fideos trozados y cocina 8-10 min. Sirve caliente.'] },
  { id:'r3', nombre:'Charquicán criollo', cat:'Almuerzo', tiempo:40, dif:'Fácil', costo:'$', kcal:480, porc:'4 platos', tags:'papa zapallo choclo carne molida charquican chilena',
    ing:['4 papas medianas en cubos','200g zapallo en cubos','1 choclo desgranado o 1 taza congelado','1 zanahoria picada','150g carne molida o cochayuyo cocido','1 cebolla, ajo, ají de color, sal'],
    pasos:['Cose papas + zapallo + zanahoria en agua con sal 20 min.','Sofríe carne con cebolla y aliños.','Mezcla todo, muele a medias con cuchara de palo.','Agrega choclo 5 min. Sirve con huevo frito opcional.'] },
  { id:'r4', nombre:'Cazuela de pollo de campo', cat:'Almuerzo', tiempo:55, dif:'Media', costo:'$$', kcal:560, porc:'4 platos', tags:'pollo cazuela papa choclo zapallo chilena invierno consome',
    ing:['4 trutros de pollo','4 papas','4 trozos zapallo','2 trozos choclo','1 zanahoria en bastones','1/2 cebolla, ajo, orégano, sal, arroz 4 cdas'],
    pasos:['Sella pollo en olla, agrega 2L agua caliente + aliños.','Añade papas, zapallo, zanahoria y arroz; cocina 25 min.','Agrega choclo y cocina 10 min más.','Ajusta sal y sirve con cilantro.'] },
  { id:'r5', nombre:'Tortilla de espinaca + ensalada', cat:'Cena', tiempo:25, dif:'Fácil', costo:'$', kcal:320, porc:'2-3 porciones', tags:'huevo espinaca tortilla cena liviana vegetariano hierro',
    ing:['5 huevos','1 atado espinaca lavada y picada','1/2 cebolla picada fina','Sal, pimienta','Ensalada: tomate + lechuga + limón'],
    pasos:['Saltea cebolla 3 min, agrega espinaca 2 min y enfría un poco.','Bate huevos, mezcla con verduras y sazona.','Cocina en sartén tapada 8-10 min a fuego bajo, voltea.','Sirve con ensalada y pan integral.'] },
  { id:'r6', nombre:'Pescado al horno con quinoa (jurel/merluza)', cat:'Almuerzo', tiempo:30, dif:'Fácil', costo:'$$', kcal:510, porc:'2 porciones', tags:'pescado jurel merluza quinoa omega costa saludable',
    ing:['2 filetes jurel o merluza 150g c/u','1 taza quinoa','Limón, ajo, orégano, aceite','1 taza brócoli','Sal'],
    pasos:['Enjuaga quinoa y cose 1:2 agua 15 min.','Aliña pescado con limón, ajo y orégano 10 min.','Hornea 180°C 12-15 min + brócoli al vapor.','Sirve pescado sobre quinoa con verduras.'] },
  { id:'r7', nombre:'Avena overnight con manzana', cat:'Desayuno', tiempo:10, dif:'Fácil', costo:'$', kcal:340, porc:'1 frasco', tags:'avena desayuno frio manzana fibra rapido sin cocinar',
    ing:['1/2 taza avena','3/4 taza leche o yogur','1/2 manzana rallada','1 cdta miel','Canela','5 almendras picadas'],
    pasos:['Mezcla todo en frasco, tapa y refrigera noche anterior (6h+).','En la mañana revuelve y agrega fruta.','Lleva al trabajo/liceo. Dura 2 días refrigerada.'] },
  { id:'r8', nombre:'Pan con huevo y palta (desayuno power)', cat:'Desayuno', tiempo:12, dif:'Fácil', costo:'$', kcal:420, porc:'1 persona', tags:'desayuno huevo palta pan energia proteina',
    ing:['2 rebanadas pan integral o marraqueta','2 huevos','1/2 palta','Sal, merken o pimienta','Tomate en rodajas (opcional)'],
    pasos:['Tuesta pan.','Cocina huevos revueltos o a la plancha 4 min.','Arma: pan + palta molida + huevo + aliño.','Acompaña con té o leche.'] },
  { id:'r9', nombre:'Ensalada fría de lentejas', cat:'Cena', tiempo:20, dif:'Fácil', costo:'$', kcal:380, porc:'2 porciones', tags:'ensalada lentejas fria verano fibra vegetariano',
    ing:['1 1/2 taza lentejas cocidas frías','1 tomate picado','1/2 pepino picado','1/4 cebolla morada','Limón, aceite, sal, cilantro','Queso fresco 40g (opcional)'],
    pasos:['Mezcla lentejas frías con verduras picadas.','Aliña con limón + aceite + sal.','Reposa 5 min y sirve con queso encima.'] },
  { id:'r10', nombre:'Sopa de verduras con huevo', cat:'Cena', tiempo:25, dif:'Fácil', costo:'$', kcal:280, porc:'3 platos', tags:'sopa verduras huevo liviana noche invierno economico',
    ing:['2 papas','2 zanahorias','1 taza zapallo','1 puñado espinaca o acelga','2 huevos','Caldo o agua + sal, orégano'],
    pasos:['Hierve verduras picadas 18 min.','Bate huevos y agrégalos en hilo revolviendo.','Añade espinaca 2 min. Sirve con pan tostado.'] },
  { id:'r11', nombre:'Cochayuyo con papas doradas', cat:'Almuerzo', tiempo:45, dif:'Media', costo:'$', kcal:450, porc:'3 platos', tags:'cochayuyo alga costa yodo hierro chilena mar',
    ing:['1 atado cochayuyo remojado noche anterior','3 papas cocidas','1 cebolla','Ajo, ají de color, sal, limón','Cilantro'],
    pasos:['Cose cochayuyo 25-30 min hasta blando, pica.','Sofríe cebolla + aliños, agrega cochayuyo 5 min.','Dora papas cocidas en sartén.','Sirve cochayuyo sobre papas con limón.'] },
  { id:'r12', nombre:'Pebre + huevito y ensalada chilena', cat:'Snack', tiempo:15, dif:'Fácil', costo:'$', kcal:150, porc:'1 bowl', tags:'pebre tomate cebolla cilantro snack acompañamiento asado',
    ing:['2 tomates picados fino','1/2 cebolla picada fina','1 puñado cilantro','1 cda aceite, limón, sal','Ají o merken a gusto'],
    pasos:['Pica todo fino y mezcla.','Aliña y deja reposar 10 min.','Sirve con pan, huevito duro o ensalada chilena.'] },
  { id:'r13', nombre:'Yogur con avena y berries', cat:'Snack', tiempo:5, dif:'Fácil', costo:'$', kcal:250, porc:'1 vaso', tags:'yogur avena snack colacion proteina berries rapido',
    ing:['1 yogur natural 200g','3 cdas avena','1/2 taza berries o fruta picada','1 cdta miel (opcional)'],
    pasos:['Mezcla yogur + avena, deja 3 min.','Corona con fruta y miel.','Ideal post-entreno o colación liceo.'] },
  { id:'r14', nombre:'Manzanas asadas con avena (postre sano)', cat:'Postre', tiempo:25, dif:'Fácil', costo:'$', kcal:220, porc:'2 porciones', tags:'postre manzana avena canela horno dulce sano',
    ing:['2 manzanas','4 cdas avena','1 cda miel','Canela','Nueces picadas (opcional)'],
    pasos:['Ahueca manzanas un poco, rellena con avena + miel + canela.','Hornea 180°C 18-20 min.','Sirve tibio con yogur.'] }
];
function getRecetasData(){
  const u=userData();
  if(!u.recetas) u.recetas={ propias:[], favs:[] };
  if(!Array.isArray(u.recetas.propias)) u.recetas.propias=[];
  if(!Array.isArray(u.recetas.favs)) u.recetas.favs=[];
  return u.recetas;
}
function getTodasRecetas(){
  const d=getRecetasData();
  const mias=(d.propias||[]).map(r=> ({...r, mia:true}));
  return [...mias, ...RECETAS_BASE];
}
function recetasFiltradas(){
  const q=($('recSearch')?.value||'').trim().toLowerCase();
  const cat=$('recCat')?.value||'';
  const tMax=parseInt($('recTiempo')?.value||'')||0;
  const costo=$('recCosto')?.value||'';
  const soloFav=$('recSoloFav')?.checked;
  const soloMias=$('recSoloMias')?.checked;
  const favs=getRecetasData().favs||[];
  return getTodasRecetas().filter(r=>{
    if(cat && r.cat!==cat) return false;
    if(tMax && (r.tiempo||999)>tMax) return false;
    if(costo && r.costo!==costo) return false;
    if(soloFav && favs.indexOf(r.id)<0) return false;
    if(soloMias && !r.mia) return false;
    if(q){
      const hay=(r.nombre+' '+r.cat+' '+(r.tags||'')+' '+(r.ing||[]).join(' ')).toLowerCase();
      if(hay.indexOf(q)<0) return false;
    }
    return true;
  });
}
function renderMealRecetas(){
  const lista=$('recetasLista'); if(!lista) return;
  const cnt=$('recCount');
  const data=getRecetasData();
  const favs=data.favs||[];
  const rs=recetasFiltradas();
  if(cnt) cnt.textContent=rs.length+' receta(s) · '+favs.length+' favorita(s) · '+RECETAS_BASE.length+' base + '+(data.propias||[]).length+' mías';
  if(!rs.length){ lista.innerHTML='<p class="muted">Sin resultados. Prueba otra búsqueda o crea tu receta abajo.</p>'; return; }
  lista.innerHTML=rs.map(r=>{
    const esFav=favs.indexOf(r.id)>=0;
    return `<div class="si-card" style="border-left:3px solid ${r.mia?'#7ab8ff':'var(--gold)'}">
      <div class="su-e84fc1">
        <h4 class="su-116966">${escapeHtml(r.nombre)} ${r.mia?'<span class="chip">mía</span>':''}</h4>
        <button type="button" data-fav="${r.id}" class="btn btn-icon su-f26165" title="Favorita">${esFav?'⭐':'☆'}</button>
      </div>
      <p class="muted su-48eb2e">${escapeHtml(r.cat||'')} · ⏱ ${r.tiempo||'—'} min · ${escapeHtml(r.dif||'Fácil')} · ${escapeHtml(r.costo||'$')} · ~${r.kcal||'—'} kcal · ${escapeHtml(r.porc||'')}</p>
      <div id="recDet_${r.id}" class="hidden su-c18035">
        <b>Ingredientes:</b><ul class="su-c44258">${(r.ing||[]).map(i=>'<li>'+escapeHtml(i)+'</li>').join('')}</ul>
        <b>Pasos:</b><ol class="su-c44258">${(r.pasos||[]).map(p=>'<li>'+escapeHtml(p)+'</li>').join('')}</ol>
      </div>
      <div class="dlg-actions su-5010dc">
        <button type="button" data-ver="${r.id}" class="btn su-30e741">👁️ Ver</button>
        <button type="button" data-plan="${r.id}" class="btn btn-accent su-30e741">🥗 Al plan</button>
        <button type="button" data-lista="${r.id}" class="btn su-30e741">🛒 A lista</button>
        ${r.mia?`<button type="button" data-del="${r.id}" class="btn su-30e741">🗑️ Borrar</button>`:''}
      </div>
    </div>`;
  }).join('');
  lista.querySelectorAll('[data-ver]').forEach(b=> b.onclick=()=>{
    const d=$('recDet_'+b.dataset.ver); if(d) d.classList.toggle('hidden');
  });
  lista.querySelectorAll('[data-fav]').forEach(b=> b.onclick=()=>{
    const id=b.dataset.fav; const dd=getRecetasData();
    const i=dd.favs.indexOf(id);
    if(i>=0) dd.favs.splice(i,1); else dd.favs.push(id);
    scheduleSave(); renderMealRecetas();
  });
  lista.querySelectorAll('[data-plan]').forEach(b=> b.onclick=()=>{
    const r=getTodasRecetas().find(x=>x.id===b.dataset.plan); if(!r) return;
    const txt=r.nombre+' ('+(r.ing||[]).slice(0,4).join(', ')+')';
    if(r.cat==='Desayuno' && $('mealBreakfast')) $('mealBreakfast').value=txt.slice(0,80);
    else if(r.cat==='Almuerzo' && $('mealLunch')) $('mealLunch').value=txt.slice(0,80);
    else if(r.cat==='Cena' && $('mealDinner')) $('mealDinner').value=txt.slice(0,80);
    else if($('mealSnack')) $('mealSnack').value=txt.slice(0,80);
    if($('mealNotes')) $('mealNotes').value='Receta: '+r.nombre;
    showMealTab('plan');
    setTimeout(()=>{ try{ renderMealNutritionBox(); renderMealSuggestionsBox(); renderMealCompareBox(); }catch(e){} },80);
    if($('statusMsg')){ $('statusMsg').textContent='Receta cargada — pulsa Guardar día'; setTimeout(()=>$('statusMsg').textContent='',2000); }
  });
  lista.querySelectorAll('[data-lista]').forEach(b=> b.onclick=()=>{
    const r=getTodasRecetas().find(x=>x.id===b.dataset.lista); if(!r) return;
    const shop=getShoppingData();
    (r.ing||[]).slice(0,12).forEach(ing=>{
      const name=ing.split(',')[0].slice(0,40);
      if(name) shop.items.push({ id:'s'+Date.now()+Math.random().toString(36).slice(2,5), name:name, qty:'', cat:'Otros', done:false });
    });
    scheduleSave(); try{ renderShoppingList(); }catch(e){}
    if($('statusMsg')){ $('statusMsg').textContent='Ingredientes a 🛒 ('+r.nombre.slice(0,24)+')'; setTimeout(()=>$('statusMsg').textContent='',1800); }
  });
  lista.querySelectorAll('[data-del]').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Borrar tu receta?')) return;
    const dd=getRecetasData();
    dd.propias=dd.propias.filter(x=>x.id!==b.dataset.del);
    dd.favs=dd.favs.filter(x=>x!==b.dataset.del);
    scheduleSave(); renderMealRecetas();
  });
}
function setupRecetasTab(){
  const bind=(id, ev)=>{ const el=$(id); if(el) el[ev==='input'?'oninput':'onchange']=()=>{ try{ renderMealRecetas(); }catch(e){} }; };
  bind('recSearch','input'); bind('recCat','change'); bind('recTiempo','change'); bind('recCosto','change'); bind('recSoloFav','change'); bind('recSoloMias','change');
  const g=$('recGuardar'); if(g) g.onclick=()=>{
    const nombre=($('recNombre').value||'').trim();
    const ing=($('recIng').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
    const pasos=($('recPasos').value||'').split('\n').map(s=>s.trim()).filter(Boolean);
    if(!nombre || !ing.length || !pasos.length){ if($('recStatus')){ $('recStatus').textContent='Completa nombre, ingredientes y pasos'; setTimeout(()=>$('recStatus').textContent='',1800); } return; }
    const cat=$('recNuevaCat').value||'Almuerzo';
    const tiempo=parseInt($('recTiempoN').value)||30;
    const d=getRecetasData();
    d.propias.push({ id:'m'+Date.now(), nombre:nombre.slice(0,60), cat, tiempo, dif:'Casera', costo:'$', kcal:'—', porc:'', tags:nombre.toLowerCase(), ing:ing.slice(0,20), pasos:pasos.slice(0,20) });
    scheduleSave();
    $('recNombre').value=''; $('recIng').value=''; $('recPasos').value='';
    if($('recStatus')){ $('recStatus').textContent='Receta guardada ✓'; setTimeout(()=>$('recStatus').textContent='',1800); }
    renderMealRecetas();
  };
  const l=$('recLimpiar'); if(l) l.onclick=()=>{ ['recNombre','recIng','recPasos','recTiempoN'].forEach(id=>{ const e=$(id); if(e) e.value=''; }); };
}
function showMealTab(tab){
  const pPlan=$('mealPlanPanel'), pCalc=$('mealCalcPanel'), pMenus=$('mealMenusPanel'), pRec=$('mealRecetasPanel');
  const tPlan=$('tabMealPlan'), tCalc=$('tabMealCalc'), tMenus=$('tabMealMenus'), tRec=$('tabMealRecetas');
  [tPlan,tCalc,tMenus,tRec].forEach(b=> b&&b.classList.remove('btn-accent'));
  [pPlan,pCalc,pMenus,pRec].forEach(p=> p&&p.classList.add('hidden'));
  if(tab==='plan'){ tPlan&&tPlan.classList.add('btn-accent'); pPlan&&pPlan.classList.remove('hidden'); }
  else if(tab==='calc'){ tCalc&&tCalc.classList.add('btn-accent'); pCalc&&pCalc.classList.remove('hidden'); }
  else if(tab==='recetas'){ tRec&&tRec.classList.add('btn-accent'); pRec&&pRec.classList.remove('hidden'); try{ renderMealRecetas(); }catch(e){} }
  else { tMenus&&tMenus.classList.add('btn-accent'); pMenus&&pMenus.classList.remove('hidden'); }
}
function loadMealDate(k){
  const e=getMealData().entries[k]||{ breakfast:'', lunch:'', dinner:'', snack:'', notes:'' };
  $('mealBreakfast').value=e.breakfast||''; $('mealLunch').value=e.lunch||''; $('mealDinner').value=e.dinner||''; $('mealSnack').value=e.snack||''; $('mealNotes').value=e.notes||'';
  setTimeout(()=>{ try{ renderMealNutritionBox(); renderMealSuggestionsBox(); renderMealCompareBox(); }catch(e){} },50);
}
function setupMealDialog(){
  const btn=$('btnMeal'); if(btn) btn.onclick=()=>{
    const today=cal.fmtKey.format(new Date()); $('mealDate').value=today; loadMealDate(today); renderMealWeekBox(); renderMealLunaBox(); renderMealNutritionBox(); renderMealSuggestionsBox(); renderMealCompareBox();
    // load profile into calc form
    const prof=getNutritionProfile();
    if($('calcSexo')) $('calcSexo').value=prof.sexo;
    if($('calcEdad')) $('calcEdad').value=prof.edad||'';
    if($('calcPeso')) $('calcPeso').value=prof.peso||'';
    if($('calcAltura')) $('calcAltura').value=prof.altura||'';
    if($('calcActividad')) $('calcActividad').value=prof.actividad;
    if($('calcObjetivo')) $('calcObjetivo').value=prof.objetivo;
    if($('calcProte')) $('calcProte').value=prof.prote;
    renderCalcResultado(); renderMealMenus();
    showMealTab('plan');
    $('mealDialog').showModal();
  };
  const ct=$('mealCloseTop'), cb=$('mealClose'); if(ct) ct.onclick=()=>$('mealDialog').close(); if(cb) cb.onclick=()=>$('mealDialog').close();
  const todayBtn=$('mealToday'); if(todayBtn) todayBtn.onclick=()=>{ const k=cal.fmtKey.format(new Date()); $('mealDate').value=k; loadMealDate(k); };
  const dateIn=$('mealDate'); if(dateIn) dateIn.onchange=()=> { loadMealDate(dateIn.value); renderMealNutritionBox(); renderMealSuggestionsBox(); };
  const clearBtn=$('mealClearDay'); if(clearBtn) clearBtn.onclick=()=>{
    const k=$('mealDate').value; if(!k) return; const d=getMealData(); delete d.entries[k]; scheduleSave(); loadMealDate(k); renderMealWeekBox(); renderMealLunaBox(); if(true) renderLuna();
  };
  const save=$('mealSave'); if(save) save.onclick=()=>{
    const k=$('mealDate').value; if(!k) return alert('Elige fecha');
    const e={ breakfast:$('mealBreakfast').value.trim(), lunch:$('mealLunch').value.trim(), dinner:$('mealDinner').value.trim(), snack:$('mealSnack').value.trim(), notes:$('mealNotes').value.trim() };
    if(!e.breakfast && !e.lunch && !e.dinner && !e.snack) return alert('Escribe al menos una comida');
    getMealData().entries[k]=e; scheduleSave(); renderMealWeekBox(); renderMealLunaBox(); renderMealNutritionBox(); renderMealSuggestionsBox(); renderMealCompareBox(); renderLuna();
    $('statusMsg').textContent='Comida guardada ✓'; setTimeout(()=>$('statusMsg').textContent='',1500);
  };
  const toShop=$('mealToShopping'); if(toShop) toShop.onclick=()=>{
    const k=$('mealDate').value; const e=getMealData().entries[k];
    if(!e) return alert('Guarda primero el día');
    const items=[e.breakfast,e.lunch,e.dinner,e.snack].filter(Boolean).join(', ');
    if(!items) return;
    const shop=getShoppingData();
    const id='s'+Date.now();
    shop.items.push({ id, name: 'Comida '+k+': '+items.slice(0,60), qty:'', cat:'Otros', done:false });
    scheduleSave(); renderShoppingList();
    alert('Añadido a 🛒 Compras');
  };
  // tabs meal
  const tPlan=$('tabMealPlan'), tCalc=$('tabMealCalc'), tMenus=$('tabMealMenus'), tRec=$('tabMealRecetas');
  if(tPlan) tPlan.onclick=()=> showMealTab('plan');
  if(tCalc) tCalc.onclick=()=> { const prof=getNutritionProfile(); if($('calcSexo')) $('calcSexo').value=prof.sexo; renderCalcResultado(); showMealTab('calc'); };
  if(tMenus) tMenus.onclick=()=> { renderMealMenus(); showMealTab('menus'); };
  if(tRec) tRec.onclick=()=> showMealTab('recetas');
  try{ setupRecetasTab(); }catch(e){}
  const calcBtn=$('calcCalcular'); if(calcBtn) calcBtn.onclick=()=>{
    const prof=getNutritionProfile();
    prof.sexo=$('calcSexo').value; prof.edad=parseInt($('calcEdad').value)||0; prof.peso=parseFloat($('calcPeso').value)||0; prof.altura=parseInt($('calcAltura').value)||0; prof.actividad=$('calcActividad').value; prof.objetivo=$('calcObjetivo').value; prof.prote=$('calcProte').value;
    if(!prof.edad||!prof.peso||!prof.altura) return alert('Completa edad, peso y altura');
    renderCalcResultado();
    $('calcStatus').textContent='Calculado ✓ (no guardado aún)';
    setTimeout(()=> $('calcStatus').textContent='',1500);
  };
  const saveProf=$('calcGuardar'); if(saveProf) saveProf.onclick=()=>{
    const prof=getNutritionProfile();
    prof.sexo=$('calcSexo').value; prof.edad=parseInt($('calcEdad').value)||0; prof.peso=parseFloat($('calcPeso').value)||0; prof.altura=parseInt($('calcAltura').value)||0; prof.actividad=$('calcActividad').value; prof.objetivo=$('calcObjetivo').value; prof.prote=$('calcProte').value;
    if(!prof.edad||!prof.peso||!prof.altura) return alert('Completa edad, peso y altura');
    prof.ultimaCalc=calcNutrition(prof);
    scheduleSave();
    renderCalcResultado(); renderMealMenus(); renderMealCompareBox();
    $('calcStatus').textContent='Perfil guardado ✓';
    setTimeout(()=> $('calcStatus').textContent='',1500);
  };
  // live update on input
  ['calcEdad','calcPeso','calcAltura'].forEach(id=>{ const el=$(id); if(el) el.oninput=()=>{ try{ renderMealCompareBox(); }catch{} }});
}

// === LISTA DE COMPRAS ===
function getShoppingData(){
  const u=userData();
  if(!u.shopping) u.shopping={ items:[] };
  if(!Array.isArray(u.shopping.items)) u.shopping.items=[];
  return u.shopping;
}
function renderShoppingList(){
  const box=$('shoppingListBox'); if(!box) return;
  const data=getShoppingData();
  const stats=$('shoppingStats'); 
  if(!data.items.length){ box.innerHTML='<p class="muted">Lista vacía. Agrega productos arriba.</p>'; if(stats) stats.textContent='0 productos'; return; }
  // agrupar por categoría
  const cats={};
  data.items.forEach(it=>{ if(!cats[it.cat]) cats[it.cat]=[]; cats[it.cat].push(it); });
  let html='';
  Object.keys(cats).sort().forEach(cat=>{
    html+=`<div class="shop-cat"><b>${escapeHtml(cat)}</b></div>`;
    cats[cat].forEach(it=>{
      html+=`<label class="shop-item ${it.done?'done':''}"><input type="checkbox" data-id="${it.id}" ${it.done?'checked':''}><span class="shop-name">${escapeHtml(it.name)}</span><span class="muted su-11a508">${escapeHtml(it.qty)}</span><button data-id="${it.id}" class="btn btn-icon shop-del su-4e1e74">✕</button></label>`;
    });
  });
  box.innerHTML=html;
  if(stats) stats.textContent=`${data.items.filter(x=>x.done).length}/${data.items.length} comprados`;
  box.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.onchange=()=>{
    const it=data.items.find(x=>x.id===cb.dataset.id); if(it) it.done=cb.checked; scheduleSave(); renderShoppingList();
  });
  box.querySelectorAll('.shop-del').forEach(b=> b.onclick=()=>{
    const id=b.dataset.id; const d=getShoppingData(); d.items=d.items.filter(x=>x.id!==id); scheduleSave(); renderShoppingList();
  });
}
function setupShoppingDialog(){
  const btn=$('btnShopping'); if(btn) btn.onclick=()=>{ renderShoppingList(); $('shoppingDialog').showModal(); };
  const ct=$('shoppingCloseTop'), cb=$('shoppingClose'); if(ct) ct.onclick=()=>$('shoppingDialog').close(); if(cb) cb.onclick=()=>$('shoppingDialog').close();
  const add=$('shopAdd'); if(add) add.onclick=()=>{
    const name=$('shopName').value.trim(); if(!name) return;
    const exists=getShoppingData().items.find(x=> x.name.toLowerCase()===name.toLowerCase() && x.cat===$('shopCat').value);
    if(exists){ alert('Ya existe en la lista'); return; }
    const it={ id:'s'+Date.now(), name, qty:$('shopQty').value.trim(), cat:$('shopCat').value, done:false };
    getShoppingData().items.push(it); scheduleSave(); $('shopName').value=''; $('shopQty').value=''; renderShoppingList();
  };
  const clearDone=$('shoppingClearDone'); if(clearDone) clearDone.onclick=()=>{ const d=getShoppingData(); d.items=d.items.filter(x=>!x.done); scheduleSave(); renderShoppingList(); };
  const clearAll=$('shoppingClearAll'); if(clearAll) clearAll.onclick=()=>{ if(!confirm('¿Vaciar toda la lista?')) return; getShoppingData().items=[]; scheduleSave(); renderShoppingList(); };
  const nameIn=$('shopName'); if(nameIn) nameIn.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); $('shopAdd').click(); } });
}


// === FINANZAS PERSONALES ===
const FIN_CAT_GASTO = ["Alimentación","Transporte","Vivienda","Servicios (luz/agua/internet)","Salud","Educación","Ocio","Deudas/Crédito","Vestuario","Otros"];
const FIN_CAT_INGRESO = ["Sueldo","Venta","Freelance/Extra","Bono/Ayuda","Reembolso","Otros"];
const FIN_TIPS = [
  { icon:"📊", titulo:"Regla 50/30/20", desc:"50% necesidades (vivienda, comida, transporte), 30% gustos (ocio, delivery, ropa no esencial), 20% ahorro/deudas. Si no llegas, parte 70/20/10 y ajusta cada luna.", ejemplo:"Con $600.000: $300k / $180k / $120k" },
  { icon:"🐜", titulo:"Caza gastos hormiga", desc:"Café diario $2.500 × 30 = $75.000/mes. Suscripciones sin uso, delivery y snacks se comen el ahorro sin sentir.", tip:"Anota 7 días todo lo de $500-$3.000 y decide 2 a recortar." },
  { icon:"🪣", titulo:"Método de sobres / 4 frascos", desc:"Divide ingreso al recibirlo: 1) Vivienda 2) Comida+Transporte 3) Deudas+Ahorro 4) Ocio. No toques otro sobre si uno se acaba.", tip:"Físico o en app con 4 cuentas: evita 'pedir prestado' entre sobres." },
  { icon:"❄️", titulo:"Fondo de emergencia", desc:"Meta inicial: 1 mes de gastos básicos (ej. $400k). Luego 3 meses. Solo para urgencia real: salud, pega, pana mayor.", tip:"Automatiza $5k-$20k al recibir sueldo, aunque sea poco." },
  { icon:"💳", titulo:"Deudas caras primero", desc:"Ordena deudas por interés (crédito consumo > tarjeta). Paga mínimo en todas y extra a la más cara. Evita pagar mínimo eterno.", tip:"Si pagas solo mínimo 5% de $500k al 3% mensual, demoras 4+ años." },
  { icon:"🛒", titulo:"Compra consciente", desc:"Antes de comprar: Espera 48h si es > $30k y no es urgente. Haz lista, compara feria vs super, compra estación.", tip:"Feria Penco martes/sábado suele ser 20-30% más barata en verdura." },
  { icon:"📅", titulo:"Ritual de luna (5 min)", desc:"Cada luna revisa: total gastado vs ingresado, top 3 categorías, 1 cosa a mejorar próxima luna. Pequeño ajuste sostenido gana.", tip:"Usa la vista 'Luna' aquí para ver avance lunar." },
  { icon:"🎯", titulo:"Meta visible", desc:"Ahorra con nombre: 'Bici $300k', 'Matrícula mar $250k'. Ver avance motiva más que 'ahorrar por ahorrar'.", tip:"Pon foto/meta en celular y descuenta cada abono." }
];
const FIN_RULES = [
  { t:"Necesidades ≤50%", d:"Arriendo, dividendo, comida base, luz/agua, transporte al trabajo" },
  { t:"Gustos ≤30%", d:"Delivery, ropa extra, streaming, carrete, antojos" },
  { t:"Ahorro/Deuda ≥20%", d:"Fondo emergencia, pagar deuda, inversión simple (Cuenta 2, depósito)" },
  { t:"1% mejor cada luna", d:"Recorta 1 gasto hormiga y aumenta 1% ahorro. En 13 lunas es 13%." }
];
function getFinanceData(){
  const u=userData();
  if(!u.finanzas) u.finanzas={ entries:[], presupuesto:0 };
  if(!Array.isArray(u.finanzas.entries)) u.finanzas.entries=[];
  if(typeof u.finanzas.presupuesto!=='number') u.finanzas.presupuesto=parseInt(u.finanzas.presupuesto)||0;
  return u.finanzas;
}
function formatCLP(n){
  const v=parseInt(n)||0;
  return '$' + v.toLocaleString('es-CL');
}
function financeMonthKey(dateStr){ return dateStr.slice(0,7); }
function financeTotals(entries){
  let gasto=0, ingreso=0;
  entries.forEach(e=>{ const v=parseInt(e.monto)||0; if(e.tipo==='gasto') gasto+=v; else ingreso+=v; });
  return { gasto, ingreso, balance: ingreso-gasto };
}
function renderFinanceResumen(){
  const box=$('financeResumen'); if(!box) return;
  const fd=getFinanceData();
  const monthFilter=$('finMonthFilter')?.value || '';
  const filterText=($('finFilter')?.value||'').toLowerCase();
  let entries=fd.entries.slice();
  if(monthFilter) entries=entries.filter(e=> financeMonthKey(e.date)===monthFilter);
  if(filterText) entries=entries.filter(e=> (e.desc||'').toLowerCase().includes(filterText) || (e.categoria||'').toLowerCase().includes(filterText));
  const tot=financeTotals(entries);
  const pres=fd.presupuesto||0;
  const gastoMes = (()=>{
    const curMonth = monthFilter || new Date().toISOString().slice(0,7);
    const mesEntries=fd.entries.filter(e=> financeMonthKey(e.date)===curMonth && e.tipo==='gasto');
    return mesEntries.reduce((s,x)=>s+(parseInt(x.monto)||0),0);
  })();
  const pctPres = pres? Math.round(gastoMes/pres*100):0;
  const colorBal = tot.balance>=0? '#a9d18e' : '#e76e8a';
  const colorPres = pctPres>100? '#e76e8a' : pctPres>80? '#e8c56a' : '#a9d18e';
  const todayKey=cal.fmtKey.format(new Date());
  const hoyGasto=fd.entries.filter(e=> e.date===todayKey && e.tipo==='gasto').reduce((s,x)=>s+(parseInt(x.monto)||0),0);
  box.innerHTML=`<div class="su-083eb7">
    <span class="su-de0080"><b>💰 Balance ${monthFilter||'total filtrado'}</b></span>
    <span class="chip" style="background:${colorBal};color:#10142c">${formatCLP(tot.balance)} ${tot.balance>=0?'· positivo':'· negativo'}</span>
  </div>
  <div class="su-d85a2b">
    <div class="chip su-91a870"><span class="muted su-0d5be0">Ingresos</span><br><b class="su-559282">${formatCLP(tot.ingreso)}</b></div>
    <div class="chip su-91a870"><span class="muted su-0d5be0">Gastos</span><br><b class="su-a861ba">${formatCLP(tot.gasto)}</b></div>
    <div class="chip su-91a870"><span class="muted su-0d5be0">Movimientos</span><br><b>${entries.length}</b></div>
  </div>
  ${pres? `<div class="su-8a77e5"><div class="su-dd0575"><span class="muted">Presupuesto ${formatCLP(pres)} · Gastado ${formatCLP(gastoMes)} (${pctPres}%)</span><span style="color:${colorPres};font-weight:700">${pctPres>100? '¡Excedido!':'En rango'}</span></div><div class="su-3425a2"><div style="width:${Math.min(100,pctPres)}%;height:100%;background:${colorPres};transition:width .3s"></div></div></div>` : '<p class="muted su-e13d76">Define un presupuesto mensual abajo para ver barra de avance.</p>'}
  <p class="muted su-e13d76">Hoy ${todayKey} gastado: <b class="su-7c91e2">${formatCLP(hoyGasto)}</b> · Luna actual: ${currentView.tipo==='dft'?'DFT':'Luna '+currentView.luna}</p>`;
}
function renderFinanceCatBox(){
  const box=$('financeCatBox'); if(!box) return;
  const fd=getFinanceData();
  const monthFilter=$('finMonthFilter')?.value || new Date().toISOString().slice(0,7);
  const entries=fd.entries.filter(e=> financeMonthKey(e.date)===monthFilter);
  if(!entries.length){ box.innerHTML='<h4 class="su-a80552">📊 Por categoría — '+monthFilter+'</h4><p class="muted">Sin movimientos este mes.</p>'; return; }
  const byCat={};
  entries.filter(e=>e.tipo==='gasto').forEach(e=>{ byCat[e.categoria]=(byCat[e.categoria]||0)+(parseInt(e.monto)||0); });
  const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const totalG=sorted.reduce((s,x)=>s+x[1],0);
  box.innerHTML='<h4 class="su-a80552">📊 Gastos por categoría — '+monthFilter+' (total '+formatCLP(totalG)+')</h4>' + (sorted.length? sorted.map(([cat,val])=>{
    const pct= totalG? Math.round(val/totalG*100):0;
    return `<div class="su-1c6200"><span class="su-6cb285">${escapeHtml(cat)} <span class="muted su-11a508">${formatCLP(val)} · ${pct}%</span></span><span class="su-b9cbf7"><span style="display:block;width:${pct}%;height:100%;background:linear-gradient(90deg,#e8c56a,#e76e8a)"></span></span></div>`;
  }).join('') : '<p class="muted">Sin gastos.</p>');
}
function renderFinanceLunaBox(){
  const box=$('financeLunaBox'); if(!box||!cycle) return;
  const fd=getFinanceData();
  if(currentView.tipo==='dft'){ box.innerHTML='<p class="muted">DFT — sin luna; revisa mes gregoriano.</p>'; return; }
  const lunaDays=cycle.days.filter(d=>d.luna===currentView.luna);
  let lunaEntries=[];
  lunaDays.forEach(d=>{
    const k=cal.fmtKey.format(new Date(d.noonMs));
    fd.entries.filter(e=>e.date===k).forEach(e=> lunaEntries.push(e));
  });
  const tot=financeTotals(lunaEntries);
  const avgDia = lunaDays.length? Math.round(tot.gasto / 28):0;
  box.innerHTML=`<h4 class="su-a80552">🌙 Luna ${currentView.luna} · ${MOONS[currentView.luna-1].nombre} — 28 días</h4>
    <div class="su-b022fe">
      <div class="chip su-91a870"><span class="muted su-0d5be0">Gastos luna</span><br><b class="su-a861ba">${formatCLP(tot.gasto)}</b></div>
      <div class="chip su-91a870"><span class="muted su-0d5be0">Ingresos luna</span><br><b class="su-559282">${formatCLP(tot.ingreso)}</b></div>
      <div class="chip su-91a870"><span class="muted su-0d5be0">Promedio/día gasto</span><br><b>${formatCLP(avgDia)}</b></div>
    </div>
    <p class="muted su-e13d76">${lunaEntries.length} movimientos en esta luna · Balance ${formatCLP(tot.balance)} ${tot.balance>=0?'😊':'⚠️'}</p>`;
}
function updateFinanceCatOptions(){
  const sel=$('finCat'); if(!sel) return;
  const tipo=$('finTipo')?.value||'gasto';
  const cats = tipo==='gasto'? FIN_CAT_GASTO : FIN_CAT_INGRESO;
  sel.innerHTML=cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}
let financeEditingId=null;
function renderFinanceList(){
  const box=$('financeListBox'); if(!box) return;
  const fd=getFinanceData();
  const monthFilter=$('finMonthFilter')?.value || '';
  const filterText=($('finFilter')?.value||'').toLowerCase().trim();
  let entries=fd.entries.slice().sort((a,b)=> b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  if(monthFilter) entries=entries.filter(e=> financeMonthKey(e.date)===monthFilter);
  if(filterText) entries=entries.filter(e=> (e.desc||'').toLowerCase().includes(filterText) || (e.categoria||'').toLowerCase().includes(filterText) || (e.metodo||'').toLowerCase().includes(filterText));
  const stats=$('financeStats');
  if(!entries.length){ box.innerHTML='<p class="muted">Sin movimientos con esos filtros. Agrega tu primero arriba.</p>'; if(stats) stats.textContent='0 movimientos'; return; }
  box.innerHTML=entries.slice(0,80).map(e=>{
    const color=e.tipo==='gasto'? '#e76e8a' : '#a9d18e';
    const sign=e.tipo==='gasto'? '-' : '+';
    const luna=mensLunaForKey(e.date);
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center;border-left:3px solid ${color}">
      <span><b style="color:${color}">${e.tipo==='gasto'?'💸':'💰'} ${sign}${formatCLP(e.monto)}</b> — ${escapeHtml(e.categoria)} · ${escapeHtml(e.metodo||'')}<br>
      <span class="muted su-11a508">${e.date} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''} ${e.desc? '· '+escapeHtml(e.desc):''}</span></span>
      <span class="su-0c0cb1"><button data-id="${e.id}" class="btn fin-edit su-337714">✏️</button><button data-id="${e.id}" class="btn fin-del su-fd834a">✕</button></span>
    </div>`;
  }).join('');
  if(stats){
    const tot=financeTotals(entries);
    stats.textContent=`${entries.length} mov. · Ingresos ${formatCLP(tot.ingreso)} · Gastos ${formatCLP(tot.gasto)} · Balance ${formatCLP(tot.balance)}`;
  }
  box.querySelectorAll('.fin-edit').forEach(b=> b.onclick=()=>{
    const e=fd.entries.find(x=>x.id===b.dataset.id); if(!e) return;
    financeEditingId=e.id;
    $('finDate').value=e.date; $('finTipo').value=e.tipo; updateFinanceCatOptions(); $('finCat').value=e.categoria; $('finMonto').value=e.monto; $('finMetodo').value=e.metodo||'Efectivo'; $('finDesc').value=e.desc||'';
    $('finAdd').classList.add('hidden'); $('finUpdate').classList.remove('hidden'); $('finCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.fin-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar movimiento?')) return;
    const idx=fd.entries.findIndex(x=>x.id===b.dataset.id); if(idx>=0) fd.entries.splice(idx,1);
    scheduleSave(); renderFinanceResumen(); renderFinanceList(); renderFinanceLunaBox(); renderFinanceCatBox(); renderLuna();
  });
}
function renderFinanceTips(){
  const box=$('financeTipsBox'); if(!box) return;
  box.innerHTML=FIN_TIPS.map(t=>`<div class="si-card"><div class="fin-tip-head"><span class="fin-tip-ico">${t.icon}</span><h4>${escapeHtml(t.titulo)}</h4></div><p class="fin-tip-desc">${escapeHtml(t.desc)}</p>${t.ejemplo?'<p class="fin-tip-ej">Ej: '+escapeHtml(t.ejemplo)+'</p>':''}${t.tip?'<p class="fin-tip-tip">💡 '+escapeHtml(t.tip)+'</p>':''}</div>`).join('');
  const rules=$('financeRulesBox'); if(rules){
    rules.innerHTML=FIN_RULES.map(r=>`<div class="help-card"><h4>${escapeHtml(r.t)}</h4><p>${escapeHtml(r.d)}</p></div>`).join('');
  }
}
function buildFinanceShareText(){
  const fd=getFinanceData();
  const month = $('finMonthFilter')?.value || new Date().toISOString().slice(0,7);
  const entries=fd.entries.filter(e=> financeMonthKey(e.date)===month);
  const tot=financeTotals(entries);
  let t=`💰 Finanzas — ${month}\n`;
  t+=`Ingresos ${formatCLP(tot.ingreso)} · Gastos ${formatCLP(tot.gasto)} · Balance ${formatCLP(tot.balance)}\n`;
  if(fd.presupuesto) t+=`Presupuesto ${formatCLP(fd.presupuesto)} · ${Math.round(tot.gasto/(fd.presupuesto||1)*100)}% usado\n`;
  t+=`\n`;
  const byCat={}; entries.filter(e=>e.tipo==='gasto').forEach(e=>{ byCat[e.categoria]=(byCat[e.categoria]||0)+(parseInt(e.monto)||0); });
  Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([c,v])=> t+=`• ${c}: ${formatCLP(v)}\n`);
  if(entries.length){
    t+=`\nÚltimos 5:\n`;
    entries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).forEach(e=> t+=`${e.date} ${e.tipo==='gasto'?'-':'+'}${formatCLP(e.monto)} ${e.categoria} ${e.desc? '— '+e.desc:''}\n`);
  }
  t+=`\n— Mari Küla Küyen · Penco`;
  return t;
}
function setupFinanceDialog(){
  const btn=$('btnFinance'); if(btn) btn.onclick=()=>{
    updateFinanceCatOptions();
    const d=$('finDate'); if(d && !d.value) d.value=cal.fmtKey.format(new Date());
    const mf=$('finMonthFilter'); if(mf && !mf.value) mf.value=new Date().toISOString().slice(0,7);
    const presIn=$('finPresupuesto'); if(presIn) presIn.value=getFinanceData().presupuesto||'';
    renderFinanceResumen(); renderFinanceList(); renderFinanceLunaBox(); renderFinanceCatBox(); renderFinanceTips();
    $('financeDialog').showModal();
  };
  const ct=$('financeCloseTop'), cb=$('financeClose'); if(ct) ct.onclick=()=>$('financeDialog').close(); if(cb) cb.onclick=()=>$('financeDialog').close();
  const tabR=$('tabFinanceReg'), tabT=$('tabFinanceTips'), pR=$('financeRegPanel'), pT=$('financeTipsPanel');
  if(tabR) tabR.onclick=()=>{ tabR.classList.add('btn-accent'); tabT.classList.remove('btn-accent'); pR.classList.remove('hidden'); pT.classList.add('hidden'); };
  if(tabT) tabT.onclick=()=>{ tabT.classList.add('btn-accent'); tabR.classList.remove('btn-accent'); pT.classList.remove('hidden'); pR.classList.add('hidden'); };
  const tipoSel=$('finTipo'); if(tipoSel) tipoSel.onchange=()=>{ updateFinanceCatOptions(); };
  const add=$('finAdd'); if(add) add.onclick=()=>{
    const date=$('finDate').value; const monto=parseInt($('finMonto').value);
    if(!date) return alert('Elige fecha');
    if(!monto || monto<=0) return alert('Monto debe ser mayor a 0');
    const rec={ id:'f'+Date.now(), date, tipo:$('finTipo').value, categoria:$('finCat').value, monto, metodo:$('finMetodo').value, desc:sanitizeText($('finDesc').value.trim(),60) };
    getFinanceData().entries.push(rec); scheduleSave();
    $('finMonto').value=''; $('finDesc').value='';
    renderFinanceResumen(); renderFinanceList(); renderFinanceLunaBox(); renderFinanceCatBox(); renderLuna();
  };
  const upd=$('finUpdate'); if(upd) upd.onclick=()=>{
    const e=getFinanceData().entries.find(x=>x.id===financeEditingId); if(!e) return;
    const monto=parseInt($('finMonto').value); if(!monto||monto<=0) return alert('Monto inválido');
    e.date=$('finDate').value; e.tipo=$('finTipo').value; e.categoria=$('finCat').value; e.monto=monto; e.metodo=$('finMetodo').value; e.desc=sanitizeText($('finDesc').value.trim(),60);
    scheduleSave(); financeEditingId=null; $('finAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('finCancelEdit').classList.add('hidden');
    $('finMonto').value=''; $('finDesc').value='';
    renderFinanceResumen(); renderFinanceList(); renderFinanceLunaBox(); renderFinanceCatBox(); renderLuna();
  };
  const cancel=$('finCancelEdit'); if(cancel) cancel.onclick=()=>{ financeEditingId=null; $('finAdd').classList.remove('hidden'); $('finUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('finMonto').value=''; $('finDesc').value=''; };
  const filter=$('finFilter'); if(filter) filter.oninput=()=>{ renderFinanceResumen(); renderFinanceList(); };
  const monthF=$('finMonthFilter'); if(monthF) monthF.onchange=()=>{ renderFinanceResumen(); renderFinanceList(); renderFinanceCatBox(); };
  const presBtn=$('finSavePresupuesto'); if(presBtn) presBtn.onclick=()=>{
    const v=parseInt($('finPresupuesto').value)||0;
    getFinanceData().presupuesto=v; scheduleSave(); renderFinanceResumen();
    $('statusMsg').textContent='Presupuesto guardado ✓'; setTimeout(()=>$('statusMsg').textContent='',1500);
  };
  const exp=$('financeExport'); if(exp) exp.onclick=()=>{
    const fd=getFinanceData();
    if(!fd.entries.length) return alert('Sin datos para exportar');
    let csv='Fecha,Tipo,Categoria,Monto,Metodo,Descripcion,Luna\n';
    fd.entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{
      const luna=mensLunaForKey(e.date);
      const lunaTxt=luna? 'Luna '+luna.luna : '';
      csv+=`${e.date},${e.tipo},${e.categoria},${e.monto},${e.metodo},${(e.desc||'').replace(/,/g,';')},${lunaTxt}\n`;
    });
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='finanzas-penco-'+cal.fmtKey.format(new Date())+'.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const share=$('financeShare'); if(share) share.onclick=async()=>{
    const txt=buildFinanceShareText();
    await shareText('💰 Finanzas — Penco', txt);
  };
  const clear=$('financeClear'); if(clear) clear.onclick=()=>{
    const mf=$('finMonthFilter')?.value; if(!mf) return alert('Elige mes a borrar');
    if(!confirm('¿Borrar movimientos del mes '+mf+'?')) return;
    const fd=getFinanceData();
    fd.entries=fd.entries.filter(e=> financeMonthKey(e.date)!==mf);
    scheduleSave(); renderFinanceResumen(); renderFinanceList(); renderFinanceLunaBox(); renderFinanceCatBox(); renderLuna();
  };
}
setTimeout(setupFinanceDialog, 670);

// === TAREAS DEL HOGAR ===
const HOME_AREAS = ["Cocina","Baño","Habitaciones","Living/Comedor","Ropa","Patio/Jardín","Mantenimiento","General","Compras Hogar","Otro"];
const HOME_AREA_ICON = { "Cocina":"🍳","Baño":"🚿","Habitaciones":"🛏️","Living/Comedor":"🛋️","Ropa":"👕","Patio/Jardín":"🌿","Mantenimiento":"🛠️","General":"🏠","Compras Hogar":"🛒","Otro":"📦" };
const HOME_TEMPLATES = [
  { nombre:"Kit básico — 10 esenciales", tareas:[
    {name:"Lavar loza desayuno", area:"Cocina", freq:"diaria", time:"15", priority:"alta"},
    {name:"Tender camas + ventilar 10 min", area:"Habitaciones", freq:"diaria", time:"15", priority:"alta"},
    {name:"Barrido rápido living/comedor", area:"Living/Comedor", freq:"diaria", time:"15", priority:"media"},
    {name:"Limpieza baño express (lavamanos + WC)", area:"Baño", freq:"diaria", time:"5", priority:"media"},
    {name:"Sacar basura / reciclaje", area:"Cocina", freq:"diaria", time:"5", priority:"media"},
    {name:"Lavar ropa (1 carga)", area:"Ropa", freq:"semanal", day:"1", time:"30", priority:"media"},
    {name:"Aspirar / trapear a fondo", area:"Living/Comedor", freq:"semanal", day:"6", time:"60", priority:"media"},
    {name:"Limpieza profunda baño", area:"Baño", freq:"semanal", day:"2", time:"60", priority:"alta"},
    {name:"Cocina a fondo (horno/micro)", area:"Cocina", freq:"quincenal", time:"60", priority:"baja"},
    {name:"Revisar despensa + lista compras hogar", area:"Compras Hogar", freq:"semanal", day:"5", time:"30", priority:"media"}
  ]},
  { nombre:"Rutina mañana (Penco — anti-humedad)", tareas:[
    {name:"Abrir ventanas 10 min (aire cruzado)", area:"General", freq:"diaria", time:"5", priority:"alta"},
    {name:"Camas hechas + ropa noche guardada", area:"Habitaciones", freq:"diaria", time:"5", priority:"media"},
    {name:"Loza noche lavada + cocina limpia", area:"Cocina", freq:"diaria", time:"15", priority:"alta"},
    {name:"Revisar ropa húmeda / colgar", area:"Ropa", freq:"diaria", time:"15", priority:"media"}
  ]},
  { nombre:"Rutina noche 5 min", tareas:[
    {name:"Recoger living (zapatos, juguetes)", area:"Living/Comedor", freq:"diaria", time:"5", priority:"media"},
    {name:"Preparar ropa + mochila mañana", area:"General", freq:"diaria", time:"5", priority:"baja"},
    {name:"Dejar cocina lista (mise en place)", area:"Cocina", freq:"diaria", time:"5", priority:"media"}
  ]},
  { nombre:"Semana por zonas (FlyLady)", tareas:[
    {name:"Lunes: Habitaciones + cambio sábanas + polvo", area:"Habitaciones", freq:"semanal", day:"1", time:"60", priority:"media"},
    {name:"Martes: Baños profundo + espejos + WC", area:"Baño", freq:"semanal", day:"2", time:"60", priority:"alta"},
    {name:"Miércoles: Cocina a fondo + refrigerador", area:"Cocina", freq:"semanal", day:"3", time:"60", priority:"media"},
    {name:"Jueves: Living/comedor + polvo + vidrios", area:"Living/Comedor", freq:"semanal", day:"4", time:"60", priority:"media"},
    {name:"Viernes: Patio/jardín + basura voluminosa", area:"Patio/Jardín", freq:"semanal", day:"5", time:"60", priority:"media"},
    {name:"Sábado: Lavandería + planchado + mantenimiento", area:"Ropa", freq:"semanal", day:"6", time:"120", priority:"media"},
    {name:"Domingo: Descanso + repaso 15 min + revisar luna", area:"General", freq:"semanal", day:"0", time:"15", priority:"baja"}
  ]},
  { nombre:"Mantenimiento mensual Penco", tareas:[
    {name:"Revisar techos/canaletas (antes de lluvia)", area:"Mantenimiento", freq:"mensual", time:"60", priority:"alta"},
    {name:"Limpiar filtro campana/calefont", area:"Mantenimiento", freq:"mensual", time:"30", priority:"media"},
    {name:"Desinfectar contenedores basura", area:"General", freq:"mensual", time:"30", priority:"media"},
    {name:"Revisar sellos ventanas (humedad)", area:"Mantenimiento", freq:"mensual", time:"30", priority:"media"},
    {name:"Fondo despensa + botiquín hogar", area:"Compras Hogar", freq:"mensual", time:"30", priority:"baja"}
  ]}
];
function getHomeTasksData(){
  const u=userData();
  if(!u.homeTasks) u.homeTasks={ tasks:[], completions:{} };
  if(!Array.isArray(u.homeTasks.tasks)) u.homeTasks.tasks=[];
  if(typeof u.homeTasks.completions!=='object' || Array.isArray(u.homeTasks.completions)) u.homeTasks.completions={};
  u.homeTasks.tasks.forEach(t=>{
    if(!t.area) t.area="General";
    if(!t.freq) t.freq="diaria";
    if(!t.priority) t.priority="media";
    if(!t.time) t.time="30";
    if(t.day===undefined) t.day="todos";
    if(!t.owner) t.owner="";
  });
  return u.homeTasks;
}
function homeTaskApplicableOnDate(task, dateStr){
  if(task.freq==='diaria') return true;
  if(task.freq==='puntual') return task.date===dateStr;
  if(task.freq==='semanal'){
    if(task.day==='todos') return true;
    const dow=new Date(dateStr+"T12:00:00").getDay();
    return String(dow)===String(task.day);
  }
  if(task.freq==='quincenal'){
    // cada 14 días desde su creación o desde fecha base; simplificado: semanas pares/impares alternas según id hash
    const dow=new Date(dateStr+"T12:00:00").getDay();
    if(task.day!=='todos' && String(dow)!==String(task.day)) return false;
    // quincenal: solo si la semana del año es par/impar según hash del id
    const d=new Date(dateStr+"T12:00:00");
    const start=new Date(d.getFullYear(),0,1);
    const week=Math.ceil((((d - start)/86400000)+start.getDay()+1)/7);
    const hash=task.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%2;
    return (week%2)===hash;
  }
  if(task.freq==='mensual'){
    // primer aparición según día creado; hoy: si es día 1 del mes o mismo día de semana del mes (simplificado primer lunes etc.) -> mostrar el día del mes que corresponde al día creación
    // Simplificado: aparece el día preferido del mes o todos si es 'todos' el día 15
    if(task.day==='todos'){
      return dateStr.slice(8,10)==='15';
    } else {
      const dow=new Date(dateStr+"T12:00:00").getDay();
      if(String(dow)!==String(task.day)) return false;
      // solo primera semana del mes
      const dayNum=parseInt(dateStr.slice(8,10),10);
      return dayNum<=7;
    }
  }
  return true;
}
function homeTasksForDate(dateStr){
  const ht=getHomeTasksData();
  return ht.tasks.filter(t=> homeTaskApplicableOnDate(t,dateStr));
}
function renderHomeTasksResumen(){
  const box=$('homeTasksResumen'); if(!box) return;
  const ht=getHomeTasksData();
  const todayKey=cal.fmtKey.format(new Date());
  const todayTasks=homeTasksForDate(todayKey);
  const doneToday= (ht.completions[todayKey] ? Object.keys(ht.completions[todayKey]).length : 0);
  const pending=Math.max(0, todayTasks.length - doneToday);
  const totalMin=todayTasks.reduce((s,t)=> s+ (parseInt(t.time)||0),0);
  const doneMin=todayTasks.filter(t=> ht.completions[todayKey] && ht.completions[todayKey][t.id]).reduce((s,t)=> s+ (parseInt(t.time)||0),0);
  const lunaName=currentView && currentView.tipo!=='dft' ? MOONS[currentView.luna-1].nombre : '—';
  box.innerHTML=`<div class="su-083eb7"><span class="su-de0080"><b>🏠 Hoy</b> — ${cal.weekdayName(mensKeyToMs(todayKey))} ${cal.fmtDate.format(new Date(mensKeyToMs(todayKey)))}</span><span class="chip" style="background:${pending===0?'#a9d18e':'var(--gold)'};color:#10142c">${doneToday}/${todayTasks.length} hechas</span></div>
  <div class="su-d85a2b">
    <div class="chip su-91a870"><b>${pending} pendientes</b><br><span class="muted su-0d5be0">${todayTasks.length} hoy · ${totalMin} min est.</span></div>
    <div class="chip su-91a870"><b>${doneMin} min hecho</b><br><span class="muted su-0d5be0">${totalMin? Math.round(doneMin/totalMin*100):0}% tiempo</span></div>
    <div class="chip su-91a870"><b>${ht.tasks.length} tareas</b><br><span class="muted su-0d5be0">Luna: ${escapeHtml(lunaName)}</span></div>
  </div>
  <div class="su-5534eb"><div style="width:${todayTasks.length? Math.round(doneToday/todayTasks.length*100):0}%;height:100%;background:linear-gradient(90deg,#a9d18e,#e8c56a)"></div></div>
  <p class="muted su-d47a97">Tip: toca ☑ en 📋 Tareas para marcar. Las tareas diarias aparecen todos los días; semanales solo su día.</p>`;
}
function renderHomeTasksTodayBox(){
  const box=$('homeTasksTodayBox'); if(!box) return;
  const ht=getHomeTasksData();
  const todayKey=cal.fmtKey.format(new Date());
  const todayTasks=homeTasksForDate(todayKey);
  if(!todayTasks.length){ box.innerHTML='<p class="muted">Sin tareas para hoy. Agrega en ➕ Nueva tarea o carga una plantilla en 🧹 Plantillas.</p>'; return; }
  const completions=ht.completions[todayKey]||{};
  // agrupar por área
  const byArea={}; todayTasks.forEach(t=>{ if(!byArea[t.area]) byArea[t.area]=[]; byArea[t.area].push(t); });
  let html='<h4 class="su-e39eba">☑ Hoy — marca al terminar</h4>';
  Object.keys(byArea).sort().forEach(area=>{
    const icon=HOME_AREA_ICON[area]||"🏠";
    html+=`<div class="shop-cat su-8a77e5">${icon} ${escapeHtml(area)} · ${byArea[area].length}</div>`;
    byArea[area].forEach(t=>{
      const done=!!completions[t.id];
      const priColor=t.priority==='alta'?'#ff6b6b': t.priority==='baja'?'#8fd694':'var(--gold)';
      html+=`<label class="shop-item ${done?'done':''}" style="border-left:3px solid ${priColor}"><input type="checkbox" data-home-id="${t.id}" ${done?'checked':''}><span class="shop-name"><b>${escapeHtml(t.name)}</b> <span class="muted su-11a508">· ${escapeHtml(t.owner||'Sin asignar')} · ${t.time}′ · ${t.freq}${t.day!=='todos'?' · '+['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][t.day]:''}</span>${t.notes? '<br><span class="muted su-11a508">'+escapeHtml(t.notes)+'</span>':''}</span><span class="chip" style="font-size:10px;background:${priColor};color:#10142c">${t.priority}</span></label>`;
    });
  });
  box.innerHTML=html;
  box.querySelectorAll('input[data-home-id]').forEach(cb=> cb.onchange=()=>{
    const id=cb.dataset.homeId; const key=cal.fmtKey.format(new Date());
    const htd=getHomeTasksData();
    if(!htd.completions[key]) htd.completions[key]={};
    if(cb.checked) htd.completions[key][id]=true;
    else { delete htd.completions[key][id]; if(Object.keys(htd.completions[key]).length===0) delete htd.completions[key]; }
    scheduleSave(); renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); renderHomeTasksList(); renderLuna();
  });
}
function renderHomeTasksList(){
  const box=$('homeTasksList'); if(!box) return;
  const ht=getHomeTasksData();
  const filterText=($('homeTaskFilter')&&$('homeTaskFilter').value||'').toLowerCase().trim();
  const filterArea=$('homeTaskFilterArea')&&$('homeTaskFilterArea').value||'';
  const filterStatus=$('homeTaskFilterStatus')&&$('homeTaskFilterStatus').value||'';
  const todayKey=cal.fmtKey.format(new Date());
  const todayTasksIds=new Set(homeTasksForDate(todayKey).map(t=>t.id));
  const completionsToday=ht.completions[todayKey]||{};
  let list=[...ht.tasks];
  if(filterArea) list=list.filter(t=> t.area===filterArea);
  if(filterText) list=list.filter(t=> (t.name+' '+t.area+' '+(t.owner||'')+' '+(t.notes||'')).toLowerCase().includes(filterText));
  if(filterStatus==='pendientes') list=list.filter(t=> todayTasksIds.has(t.id) && !completionsToday[t.id]);
  if(filterStatus==='hechas') list=list.filter(t=> todayTasksIds.has(t.id) && completionsToday[t.id]);
  list=list.sort((a,b)=> (a.area.localeCompare(b.area)) || (a.name.localeCompare(b.name)));
  if(!list.length){ box.innerHTML='<p class="muted">Sin tareas con ese filtro. Ajusta búsqueda o agrega nueva.</p>'; const s=$('homeTasksStats'); if(s) s.textContent=`${ht.tasks.length} tareas totales`; return; }
  box.innerHTML=list.map(t=>{
    const inToday=todayTasksIds.has(t.id);
    const done=inToday && completionsToday[t.id];
    const priColor=t.priority==='alta'?'#ff6b6b': t.priority==='baja'?'#8fd694':'var(--gold)';
    const icon=HOME_AREA_ICON[t.area]||"🏠";
    const freqLabel=t.freq + (t.day!=='todos'?' · '+['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][t.day]:'') + (t.freq==='puntual' && t.date? ' · '+t.date : '');
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center;border-left:3px solid ${priColor};${inToday?'':'opacity:0.75'}">
      <span><b>${icon} ${escapeHtml(t.name)}</b> <span class="chip su-0d5be0">${escapeHtml(t.area)}</span> <span class="chip" style="font-size:10px;background:${priColor};color:#10142c">${t.priority}</span> ${inToday? (done? '<span class="chip su-ca290b">✓ hoy</span>': '<span class="chip su-0d5be0">hoy</span>') : '<span class="muted su-0d5be0">no hoy</span>'}<br><span class="muted su-11a508">${escapeHtml(freqLabel)} · ${t.time}′ · ${escapeHtml(t.owner||'Sin asignar')}</span>${t.notes? '<br><span class="muted su-11a508">'+escapeHtml(t.notes)+'</span>':''}</span>
      <span class="su-0c0cb1"><button data-id="${t.id}" class="btn home-edit su-337714">✏️</button><button data-id="${t.id}" class="btn home-del su-fd834a">✕</button></span>
    </div>`;
  }).join('');
  const stats=$('homeTasksStats'); if(stats){ const pend=homeTasksForDate(todayKey).filter(t=> !completionsToday[t.id]).length; stats.textContent=`${list.length} mostradas · ${ht.tasks.length} totales · ${pend} pendientes hoy`; }
  box.querySelectorAll('.home-edit').forEach(b=> b.onclick=()=>{
    const t=ht.tasks.find(x=>x.id===b.dataset.id); if(!t) return;
    homeTasksEditingId=t.id;
    $('homeTaskName').value=t.name; $('homeTaskArea').value=t.area; $('homeTaskFreq').value=t.freq; $('homeTaskDay').value=t.day||'todos'; $('homeTaskPriority').value=t.priority; $('homeTaskTime').value=t.time; $('homeTaskOwner').value=t.owner||''; $('homeTaskDate').value=t.date||''; $('homeTaskNotes').value=t.notes||'';
    $('homeTaskAdd').classList.add('hidden'); $('homeTaskUpdate').classList.remove('hidden'); $('homeTaskCancel').classList.remove('hidden');
    $('homeTaskName').focus();
  });
  box.querySelectorAll('.home-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar tarea del hogar? Se borrará su historial de marcas.')) return;
    const idx=ht.tasks.findIndex(x=>x.id===b.dataset.id); if(idx>=0) ht.tasks.splice(idx,1);
    Object.keys(ht.completions).forEach(k=>{ if(ht.completions[k][b.dataset.id]) delete ht.completions[k][b.dataset.id]; if(Object.keys(ht.completions[k]).length===0) delete ht.completions[k]; });
    scheduleSave(); renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); renderLuna();
  });
}
function renderHomeTasksWeekGrid(){
  const grid=$('homeTasksWeekGrid'); if(!grid) return;
  const ht=getHomeTasksData();
  const days=[['Lunes',1],['Martes',2],['Miércoles',3],['Jueves',4],['Viernes',5],['Sábado',6],['Domingo',0]];
  const today=new Date().getDay();
  let html='';
  days.forEach(([name, idx])=>{
    // construir fecha de esa semana para cada día
    const now=new Date();
    const diff=(idx - now.getDay() + 7)%7; // días hasta ese weekday
    // si queremos semana actual (lunes a domingo), recalcular base lunes
    const monday=new Date(now); monday.setDate(now.getDate() - ((now.getDay()+6)%7));
    const d=new Date(monday); d.setDate(monday.getDate() + (idx===0?6: idx-1));
    // para domingo idx0 -> 6
    const dateStr=cal.fmtKey.format(d);
    const tasks=homeTasksForDate(dateStr);
    const completions=ht.completions[dateStr]||{};
    const done=tasks.filter(t=> completions[t.id]).length;
    const isToday=today===idx;
    html+=`<div class="schedule-day ${isToday?'schedule-today':''}"><b>${name} <span class="muted su-0d5be0">${dateStr.slice(8,10)}/${dateStr.slice(5,7)}</span></b><span class="chip su-59d9aa">${done}/${tasks.length}</span>${tasks.length? tasks.map(t=>{ const icon=HOME_AREA_ICON[t.area]||"🏠"; const isDone=completions[t.id]; return `<div class="schedule-block" style="background:${isDone?'#a9d18e': t.priority==='alta'?'#ff9a76':'#e8c56a'};border:1px solid ${isDone?'#a9d18e':'var(--line)'};opacity:${isDone?'0.85':1}">${icon} ${escapeHtml(t.name)}<br><span class="su-0d5be0">${t.time}′ ${isDone?'✓':''}</span></div>`; }).join('') : '<p class="muted su-0d5be0">Sin tareas</p>'}</div>`;
  });
  grid.innerHTML=html;
  const weekBox=$('homeTasksWeekList'); if(weekBox){
    const now=new Date(); const monday=new Date(now); monday.setDate(now.getDate() - ((now.getDay()+6)%7));
    let weekTasks=new Set();
    for(let i=0;i<7;i++){ const d=new Date(monday); d.setDate(monday.getDate()+i); const ds=cal.fmtKey.format(d); homeTasksForDate(ds).forEach(t=> weekTasks.add(t.id)); }
    const totalWeek=weekTasks.size;
    let doneWeek=0; for(let i=0;i<7;i++){ const d=new Date(monday); d.setDate(monday.getDate()+i); const ds=cal.fmtKey.format(d); const comp=ht.completions[ds]||{}; Object.keys(comp).forEach(id=>{ if(!weekTasks.has(id)) return; doneWeek++; }); }
    // dedup no needed for simple count; mostrar estimación
    weekBox.innerHTML=`<h4 class="su-a80552">🗓️ Semana — ${cal.fmtDate.format(monday)} al ${cal.fmtDate.format(new Date(monday.getTime()+6*86400000))}</h4><p class="muted su-11a508">${totalWeek} tareas distintas esta semana · ${Object.keys(ht.completions).filter(k=>{ const d=new Date(k+"T12:00:00"); return d>=monday && d<=new Date(monday.getTime()+6*86400000); }).length} días con avance. Revisa 📋 Tareas para marcar.</p>`;
  }
}
function renderHomeTasksLunaBox(){
  const box=$('homeTasksLunaBox'); if(!box) return;
  const ht=getHomeTasksData();
  const lunaDays = currentView && currentView.tipo==='dft' ? [] : (cycle && cycle.days.filter(d=> d.luna===currentView.luna) || []);
  const lunaName = currentView && currentView.tipo==='dft' ? 'Día Fuera del Tiempo' : (currentView? MOONS[currentView.luna-1].nombre : '—');
  const lunaN = currentView && currentView.tipo!=='dft' ? currentView.luna : '—';
  let totalOccurrences=0; let doneOccurrences=0;
  lunaDays.forEach(d=>{
    const ds=cal.fmtKey.format(new Date(d.noonMs));
    const tasks=homeTasksForDate(ds);
    totalOccurrences+=tasks.length;
    const comp=ht.completions[ds]||{};
    doneOccurrences+=tasks.filter(t=> comp[t.id]).length;
  });
  const pct= totalOccurrences? Math.round(doneOccurrences/totalOccurrences*100):0;
  box.innerHTML=`<h4 class="su-e39eba">🌙 Luna ${lunaN} · ${escapeHtml(lunaName)} — proyección 28 días</h4>
    <p class="muted su-11a508">${totalOccurrences} ocurrencias de tareas en esta luna · ${doneOccurrences} hechas · ${pct}% avance</p>
    <div class="su-b07124"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7ab8ff,#a9d18e)"></div></div>
    <p class="muted su-d47a97">Las tareas diarias cuentan 28 veces; semanales ~4 veces; quincenales ~2; mensuales 1. Útil para planificar carga real por luna.</p>`;
}
function renderHomeTasksAreasBox(){
  const box=$('homeTasksAreasBox'); if(!box) return;
  const ht=getHomeTasksData();
  const todayKey=cal.fmtKey.format(new Date());
  const todayTasks=homeTasksForDate(todayKey);
  const compToday=ht.completions[todayKey]||{};
  const byArea={}; ht.tasks.forEach(t=>{ if(!byArea[t.area]) byArea[t.area]=0; byArea[t.area]++; });
  const byAreaToday={}; todayTasks.forEach(t=>{ if(!byAreaToday[t.area]) byAreaToday[t.area]={total:0,done:0}; byAreaToday[t.area].total++; if(compToday[t.id]) byAreaToday[t.area].done++; });
  let html='<h4 class="su-a80552">📦 Por área — totales y hoy</h4><div class="help-grid su-8a77e5">';
  Object.keys(byArea).sort().forEach(area=>{
    const icon=HOME_AREA_ICON[area]||"🏠";
    const tot=byArea[area];
    const todayInfo=byAreaToday[area] ? `${byAreaToday[area].done}/${byAreaToday[area].total} hoy` : `0/${tot} hoy — no toca`;
    html+=`<div class="help-card su-e2c960"><h4>${icon} ${escapeHtml(area)}</h4><p class="su-11a508"><b>${tot} tareas</b> · ${todayInfo}</p><div class="su-9a2481"><div style="width:${byAreaToday[area]? Math.round(byAreaToday[area].done/Math.max(1,byAreaToday[area].total)*100):0}%;height:100%;background:var(--gold)"></div></div></div>`;
  });
  html+='</div>';
  if(!ht.tasks.length) html='<h4 class="su-a80552">📦 Por área</h4><p class="muted">Aún sin tareas. Carga el kit básico en 🧹 Plantillas.</p>';
  box.innerHTML=html;
}
function renderHomeTasksTemplates(){
  const box=$('homeTasksTemplates'); if(!box) return;
  let html='<div class="su-52b85a">';
  HOME_TEMPLATES.forEach(tpl=>{
    html+=`<div class="si-card su-116966"><h4>🧹 ${escapeHtml(tpl.nombre)} <span class="chip su-0d5be0">${tpl.tareas.length} tareas</span></h4><p class="muted su-11a508">${tpl.tareas.slice(0,4).map(t=> escapeHtml(t.name)).join(' · ')}${tpl.tareas.length>4?' …':''}</p><button type="button" class="btn su-e5d037" data-tpl="${escapeHtml(tpl.nombre)}">👁️ Ver / Cargar</button></div>`;
  });
  html+='</div>';
  box.innerHTML=html;
  box.querySelectorAll('[data-tpl]').forEach(b=> b.onclick=()=>{
    const tpl=HOME_TEMPLATES.find(x=>x.nombre===b.dataset.tpl); if(!tpl) return;
    // mostrar detalle y ofrecer cargar una por una en formulario
    const detail=`<div class="menstrual-card su-d2c171"><h4>${escapeHtml(tpl.nombre)}</h4>` + tpl.tareas.map(t=>`<div class="habit-item su-8c2017"><span><b>${HOME_AREA_ICON[t.area]||"🏠"} ${escapeHtml(t.name)}</b> · ${escapeHtml(t.area)} · ${t.freq}${t.day?' · '+t.day:''} · ${t.time}′</span><button data-tpltask="${escapeHtml(t.name)}" class="btn su-337714">↗ Cargar</button></div>`).join('') + `<p class="muted su-d47a97">Toca “Cargar” para llevar la tarea al formulario y ajustarla antes de agregar.</p><div class="su-a7d4af"><button id="tplAddAll" class="btn btn-accent su-30e741">+ Agregar todas (${tpl.tareas.length})</button></div></div>`;
    const existing=box.querySelector('#tplDetail'); if(existing) existing.remove();
    const div=document.createElement('div'); div.id='tplDetail'; div.innerHTML=detail; box.appendChild(div);
    div.querySelectorAll('[data-tpltask]').forEach(btn=> btn.onclick=()=>{
      const task=tpl.tareas.find(x=>x.name===btn.dataset.tpltask); if(!task) return;
      $('homeTaskName').value=task.name; $('homeTaskArea').value=task.area; $('homeTaskFreq').value=task.freq; if(task.day) $('homeTaskDay').value=task.day; $('homeTaskTime').value=task.time; $('homeTaskPriority').value=task.priority||'media';
      // switch to tareas tab
      renderHomeTasksTab('tareas');
      $('homeTaskName').focus();
    });
    const addAll=div.querySelector('#tplAddAll'); if(addAll) addAll.onclick=()=>{
      const ht=getHomeTasksData();
      let added=0;
      tpl.tareas.forEach(t=>{
        if(ht.tasks.some(x=> x.name===t.name && x.area===t.area)) return;
        ht.tasks.push({ id:'h'+Date.now()+Math.random().toString(36).slice(2,6), name:t.name, area:t.area, freq:t.freq, day:t.day||'todos', priority:t.priority||'media', time:t.time, owner:'', date:'', notes:'' });
        added++;
      });
      scheduleSave(); renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox();
      addAll.textContent=`✓ ${added} agregadas`;
      setTimeout(()=> addAll.textContent=`+ Agregar todas (${tpl.tareas.length})`,1500);
    };
    div.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
}
// === ORDEN & DIÓGENES — checklist progresivo local ===
const DIOGENES_STEPS = [
  {id:'d1', t:'Despejé la salida (puerta/pasillo libre)', d:'Puerta abre completa, pasillo caminable sin esquivar.'},
  {id:'d2', t:'Saqué 1 bolsa de basura hoy', d:'Bolsa cerrada y fuera de la casa el mismo día.'},
  {id:'d3', t:'Saqué 1 bolsa de reciclaje', d:'Vidrio/plástico/papel al punto limpio o contenedor.'},
  {id:'d4', t:'Mesa de cocina libre para comer', d:'Sin pilas: solo lo de la comida actual.'},
  {id:'d5', t:'Boté 3 vencidos (despensa/refri)', d:'Revisa fechas, huele, bota sin culpa.'},
  {id:'d6', t:'Piso del baño visible + WC usable', d:'Sin ropa/cajas en el suelo.'},
  {id:'d7', t:'Cama usable para dormir', d:'Sin cosas sobre la cama esta noche.'},
  {id:'d8', t:'Junté 5 cosas para donar', d:'Bolsa rotulada “donar” lista para entregar.'},
  {id:'d9', t:'Apliqué caja-4 en 1 m² (20 min)', d:'1 repisa o esquina: quedarse/donar/reciclar/botar.'},
  {id:'d10', t:'Frené 1 compra (lista 72h)', d:'Anoté el antojo y esperé 3 días.'},
  {id:'d11', t:'Pedí ayuda a 1 persona / CESFAM', d:'Llamé, pedí hora o invité 1h de compañía amable.'},
  {id:'d12', t:'Foto antes/después de mi zona', d:'Registro para ver avance en la próxima luna.'}
];
function getDiogenesData(){
  const ht=getHomeTasksData();
  if(!ht.diogenes || typeof ht.diogenes!=='object') ht.diogenes={done:{}};
  if(!ht.diogenes.done || typeof ht.diogenes.done!=='object') ht.diogenes.done={};
  return ht.diogenes;
}
function renderDiogenes(){
  const box=$('diogenesChecklist'); if(!box) return;
  const dg=getDiogenesData();
  const done=Object.keys(dg.done||{}).filter(k=>dg.done[k]).length;
  const pct=Math.round(done/DIOGENES_STEPS.length*100);
  const prog=$('diogenesProgress');
  if(prog) prog.innerHTML=`<div class="su-13313b"><span class="su-5e0faa"><b>${done}/${DIOGENES_STEPS.length}</b> pasos · ${pct}%</span><span class="chip" style="background:${pct===100?'#a9d18e':'var(--gold)'};color:#10142c">${pct===100?'🎉 Luna despejada':'🌱 paso a paso'}</span></div><div class="su-b07124"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#a9d18e,#e8c56a)"></div></div><p class="muted su-d47a97">Marca solo lo hecho de verdad. 1 paso por día está perfecto.</p>`;
  box.innerHTML='<h4 class="su-76decf">✅ Checklist 12 pasos — 1 por día si puedes</h4><div class="dio-compact">'+DIOGENES_STEPS.map(s=>{
    const on=!!(dg.done&&dg.done[s.id]);
    return `<label class="dio-item ${on?'done':''}"><input type="checkbox" data-dio="${s.id}" ${on?'checked':''}><span class="dio-txt" title="${escapeHtml(s.d)}"><b>${escapeHtml(s.t)}</b><small>${escapeHtml(s.d)}</small></span><span class="dio-check">${on?'✓':'○'}</span></label>`;
  }).join('')+'</div>';
  box.querySelectorAll('input[data-dio]').forEach(cb=> cb.onchange=()=>{
    const d=getDiogenesData();
    if(cb.checked) d.done[cb.dataset.dio]=cal.fmtKey.format(new Date());
    else delete d.done[cb.dataset.dio];
    scheduleSave(); renderDiogenes();
  });
  const sh=$('diogenesShare');
  if(sh && !sh.dataset.bind){
    sh.dataset.bind='1';
    sh.onclick=async()=>{
      const d2=getDiogenesData();
      const n=Object.keys(d2.done||{}).length;
      await shareText('🧠 Orden progresivo', `🧠 Orden progresivo — Penco\n${n}/${DIOGENES_STEPS.length} pasos (${Math.round(n/DIOGENES_STEPS.length*100)}%)\n`+DIOGENES_STEPS.map(s=>`${d2.done&&d2.done[s.id]?'✓':'○'} ${s.t}`).join('\n')+`\n\n— Mari Küla Küyen · sin culpa, paso a paso`);
    };
  }
  const rs=$('diogenesReset');
  if(rs && !rs.dataset.bind){
    rs.dataset.bind='1';
    rs.onclick=()=>{
      if(!confirm('¿Reiniciar checklist de orden? Se borran las marcas, no tus tareas.')) return;
      getDiogenesData().done={}; scheduleSave(); renderDiogenes();
    };
  }
}
let homeTasksEditingId=null;
let homeTasksCurrentTab='tareas';
function renderHomeTasksTab(tab){
  homeTasksCurrentTab=tab||homeTasksCurrentTab;
  const tabs={tareas:'tabHomeTareas', semana:'tabHomeSemana', plantillas:'tabHomePlantillas', stats:'tabHomeStats', diogenes:'tabHomeDiogenes'};
  Object.entries(tabs).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===homeTasksCurrentTab); });
  const panels={tareas:'homeTasksTareasPanel', semana:'homeTasksSemanaPanel', plantillas:'homeTasksPlantillasPanel', stats:'homeTasksStatsPanel', diogenes:'homeTasksDiogenesPanel'};
  Object.entries(panels).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('hidden', k!==homeTasksCurrentTab); });
  if(homeTasksCurrentTab==='tareas'){ renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); }
  if(homeTasksCurrentTab==='semana'){ renderHomeTasksWeekGrid(); }
  if(homeTasksCurrentTab==='plantillas'){ renderHomeTasksTemplates(); }
  if(homeTasksCurrentTab==='stats'){ renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); }
  if(homeTasksCurrentTab==='diogenes'){ renderDiogenes(); }
}
function setupHomeTasksDialog(){
  const btn=$('btnHomeTasks'); if(btn) btn.onclick=()=>{ renderHomeTasksResumen(); renderHomeTasksTab('tareas'); renderHomeTasksTemplates(); $('homeTasksDialog').showModal(); };
  const ct=$('homeTasksCloseTop'), cb=$('homeTasksClose'); if(ct) ct.onclick=()=>$('homeTasksDialog').close(); if(cb) cb.onclick=()=>$('homeTasksDialog').close();
  ['tabHomeTareas','tabHomeSemana','tabHomePlantillas','tabHomeStats','tabHomeDiogenes'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.onclick=()=>{ const map={tabHomeTareas:'tareas',tabHomeSemana:'semana',tabHomePlantillas:'plantillas',tabHomeStats:'stats',tabHomeDiogenes:'diogenes'}; renderHomeTasksTab(map[id]); };
  });
  // frecuencia -> mostrar/ocultar fecha puntual y día preferido
  const freqEl=$('homeTaskFreq'), dayEl=$('homeTaskDay'), dateEl=$('homeTaskDate');
  function updateHomeTaskFreqUI(){
    const v=freqEl.value;
    const dayLabel=dayEl.parentElement; const dateLabel=dateEl.parentElement;
    if(v==='puntual'){ dateLabel.style.display=''; dayLabel.style.opacity='0.45'; dayEl.disabled=true; }
    else if(v==='diaria'){ dayLabel.style.opacity='0.45'; dayEl.disabled=true; dateLabel.style.display='none'; }
    else if(v==='mensual' || v==='quincenal' || v==='semanal'){ dayLabel.style.opacity='1'; dayEl.disabled=false; dateLabel.style.display='none'; }
    else { dayLabel.style.opacity='1'; dayEl.disabled=false; dateLabel.style.display='none'; }
  }
  if(freqEl) freqEl.onchange=updateHomeTaskFreqUI;
  setTimeout(updateHomeTaskFreqUI, 400);
  const add=$('homeTaskAdd'); if(add) add.onclick=()=>{
    const name=$('homeTaskName').value.trim(); if(!name) return alert('Escribe el nombre de la tarea');
    const rec={ id:'h'+Date.now(), name, area:$('homeTaskArea').value, freq:$('homeTaskFreq').value, day:$('homeTaskDay').value, priority:$('homeTaskPriority').value, time:$('homeTaskTime').value, owner:$('homeTaskOwner').value.trim(), date:$('homeTaskDate').value, notes:$('homeTaskNotes').value.trim() };
    if(rec.freq==='puntual' && !rec.date) return alert('Elige la fecha para tarea puntual');
    getHomeTasksData().tasks.push(rec); scheduleSave();
    $('homeTaskName').value=''; $('homeTaskNotes').value=''; $('homeTaskOwner').value=''; 
    renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); renderLuna();
  };
  const upd=$('homeTaskUpdate'); if(upd) upd.onclick=()=>{
    const t=getHomeTasksData().tasks.find(x=>x.id===homeTasksEditingId); if(!t) return;
    t.name=$('homeTaskName').value.trim(); t.area=$('homeTaskArea').value; t.freq=$('homeTaskFreq').value; t.day=$('homeTaskDay').value; t.priority=$('homeTaskPriority').value; t.time=$('homeTaskTime').value; t.owner=$('homeTaskOwner').value.trim(); t.date=$('homeTaskDate').value; t.notes=$('homeTaskNotes').value.trim();
    scheduleSave(); homeTasksEditingId=null; $('homeTaskAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('homeTaskCancel').classList.add('hidden'); $('homeTaskName').value=''; $('homeTaskNotes').value='';
    renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); renderLuna();
  };
  const cancel=$('homeTaskCancel'); if(cancel) cancel.onclick=()=>{ homeTasksEditingId=null; $('homeTaskAdd').classList.remove('hidden'); $('homeTaskUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('homeTaskName').value=''; $('homeTaskNotes').value=''; };
  // filtros
  ['homeTaskFilter','homeTaskFilterArea','homeTaskFilterStatus'].forEach(id=>{
    const el=$(id); if(el) el.oninput=renderHomeTasksList; if(el && el.tagName==='SELECT') el.onchange=renderHomeTasksList;
  });
  const share=$('homeTasksShare'); if(share) share.onclick=async()=>{
    const ht=getHomeTasksData(); if(!ht.tasks.length) return alert('Sin tareas para compartir');
    const todayKey=cal.fmtKey.format(new Date());
    const todayTasks=homeTasksForDate(todayKey);
    const comp=ht.completions[todayKey]||{};
    let txt=`🏠 Tareas del Hogar — Penco · ${cal.fmtFull.format(new Date())}\n${todayTasks.length} hoy · ${Object.keys(comp).length} hechas\n\n`;
    todayTasks.forEach(t=>{ const done=comp[t.id]?'✓':'○'; txt+=`${done} ${HOME_AREA_ICON[t.area]||"🏠"} ${t.name} · ${t.area} · ${t.time}′ · ${t.owner||''}\n`; });
    txt+=`\nTotal: ${ht.tasks.length} tareas · Luna ${currentView&&currentView.tipo!=='dft'? currentView.luna:'—'} — Mari Küla Küyen`;
    await shareText('🏠 Tareas del Hogar', txt);
  };
  const exp=$('homeTasksExport'); if(exp) exp.onclick=()=>{
    const ht=getHomeTasksData(); if(!ht.tasks.length) return alert('Sin tareas');
    let csv='Nombre,Area,Frecuencia,Dia,Priority,TiempoMin,Responsable,FechaPuntual,Notas\n';
    ht.tasks.forEach(t=>{ csv+=`"${t.name}","${t.area}","${t.freq}","${t.day}","${t.priority}","${t.time}","${t.owner}","${t.date}","${t.notes}"\n`; });
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='tareas-hogar-'+cal.fmtKey.format(new Date())+'.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const clearDone=$('homeTasksClearDone'); if(clearDone) clearDone.onclick=()=>{
    const key=cal.fmtKey.format(new Date());
    const ht=getHomeTasksData();
    if(!ht.completions[key] || !Object.keys(ht.completions[key]).length) return alert('Nada hecho hoy para limpiar');
    if(!confirm('¿Desmarcar todo lo hecho hoy? (No borra tareas, solo marcas de hoy)')) return;
    delete ht.completions[key]; scheduleSave(); renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); renderLuna();
  };
  const clearAll=$('homeTasksClearAll'); if(clearAll) clearAll.onclick=()=>{
    if(!confirm('¿Borrar TODAS las tareas del hogar y su historial? Esta acción no se puede deshacer.')) return;
    const ht=getHomeTasksData(); ht.tasks=[]; ht.completions={}; scheduleSave(); renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); renderLuna();
  };
  const loadBase=$('homeTasksLoadBase'); if(loadBase) loadBase.onclick=()=>{
    const tpl=HOME_TEMPLATES[0]; const ht=getHomeTasksData(); let added=0;
    tpl.tareas.forEach(t=>{ if(ht.tasks.some(x=> x.name===t.name && x.area===t.area)) return; ht.tasks.push({ id:'h'+Date.now()+Math.random().toString(36).slice(2,6), name:t.name, area:t.area, freq:t.freq, day:t.day||'todos', priority:t.priority||'media', time:t.time, owner:'', date:'', notes:'' }); added++; });
    scheduleSave(); renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); renderLuna();
    loadBase.textContent=`✓ ${added} agregadas`; setTimeout(()=> loadBase.textContent='🏠 Cargar kit básico (10 tareas)',1500);
  };
  const loadWeekly=$('homeTasksLoadWeekly'); if(loadWeekly) loadWeekly.onclick=()=>{
    const tpl=HOME_TEMPLATES.find(x=>x.nombre.includes('Semana por zonas')); if(!tpl) return;
    const ht=getHomeTasksData(); let added=0;
    tpl.tareas.forEach(t=>{ if(ht.tasks.some(x=> x.name===t.name)) return; ht.tasks.push({ id:'h'+Date.now()+Math.random().toString(36).slice(2,6), name:t.name, area:t.area, freq:t.freq, day:t.day||'todos', priority:t.priority||'media', time:t.time, owner:'', date:'', notes:'' }); added++; });
    scheduleSave(); renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); renderHomeTasksWeekGrid(); renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); renderLuna();
    loadWeekly.textContent=`✓ ${added} agregadas`; setTimeout(()=> loadWeekly.textContent='🗓️ Cargar rutina semanal completa',1500);
  };
}
setTimeout(setupHomeTasksDialog, 672);

// === APORTE VOLUNTARIO ===
async function loadDonateConfig(){
  let cfg = (typeof DONATE!=='undefined'? DONATE : (window.pencoData&&window.pencoData.DONATE)) || {};
  try{
    if(window.api && window.api.loadDonate){
      const j = await window.api.loadDonate();
      if(j){ const obj = JSON.parse(j); cfg = Object.assign({}, cfg, obj); if(typeof DONATE!=='undefined') Object.assign(DONATE, obj); if(window.pencoData&&window.pencoData.DONATE) Object.assign(window.pencoData.DONATE, obj); }
    } else {
      const r = await fetch('donate.json', {cache:'no-store'});
      if(r.ok){ const obj = await r.json(); cfg = Object.assign({}, cfg, obj); if(typeof DONATE!=='undefined') Object.assign(DONATE, obj); if(window.pencoData&&window.pencoData.DONATE) Object.assign(window.pencoData.DONATE, obj); }
    }
  }catch(e){}
  return cfg;
}
function openExternalLink(url){
  if(!url || url==='#') return false;
  try{ if(window.api && window.api.openExternal){ window.api.openExternal(url); return true; } }catch(e){}
  try{ window.open(url, '_blank', 'noopener,noreferrer'); return true; }catch(e){}
  window.location.href = url;
  return true;
}
function setupDonateDialog(){
  const btn=$('btnDonate'); if(!btn) return;
  btn.onclick= async ()=>{
    let d = await loadDonateConfig();
    d = d || (typeof DONATE!=='undefined'? DONATE : (window.pencoData&&window.pencoData.DONATE)) || {};
    const set = (id,val)=>{ const el=$(id); if(el) el.textContent = val||'— por definir —'; };
    const mp=$('donateMPLink'), pp=$('donatePaypalLink');
    const fallbackMP='https://link.mercadopago.cl/semilleroconsciente';
    const fallbackPP='https://paypal.me/semilleroconsciente';
    if(mp){
      const url = (d.mercadopago && String(d.mercadopago).trim()) || fallbackMP;
      mp.href = url;
      mp.target = '_blank';
      mp.rel = 'noopener noreferrer';
      mp.style.opacity = '1';
      mp.style.pointerEvents = 'auto';
      mp.onclick = e=>{ e.stopPropagation(); e.preventDefault(); openExternalLink(url); };
    }
    if(pp){
      const url = (d.paypal && String(d.paypal).trim()) || fallbackPP;
      pp.href = url;
      pp.target = '_blank';
      pp.rel = 'noopener noreferrer';
      pp.style.opacity = '1';
      pp.style.pointerEvents = 'auto';
      pp.onclick = e=>{ e.stopPropagation(); e.preventDefault(); openExternalLink(url); };
    }
    const flow=$('donateFlowLink'), kf=$('donateKofiLink');
    const toggleCard=(linkEl,has)=>{ try{ const card=linkEl&&linkEl.closest?linkEl.closest('.donate-card'):null; if(card) card.style.display=has?'':'none'; }catch(e){} };
    if(flow){ const has=!!(d.flow&&String(d.flow).trim()); flow.href = has?d.flow:'#'; flow.target = has ? '_blank' : ''; flow.rel = 'noopener noreferrer'; if(has) flow.onclick = e=>{ e.stopPropagation(); e.preventDefault(); openExternalLink(d.flow); }; toggleCard(flow,has); }
    if(kf){ const has=!!(d.kofi&&String(d.kofi).trim()); kf.href = has?d.kofi:'#'; kf.target = has ? '_blank' : ''; kf.rel = 'noopener noreferrer'; if(has) kf.onclick = e=>{ e.stopPropagation(); e.preventDefault(); openExternalLink(d.kofi); }; toggleCard(kf,has); }
    try{
      const dlg=$('donateDialog');
      const mpUrl = (mp&&mp.href)||fallbackMP, ppUrl=(pp&&pp.href)||fallbackPP;
      if(dlg){
        const cops=dlg.querySelectorAll('.donate-copy');
        if(cops[0]) cops[0].setAttribute('data-copy', mpUrl);
        if(cops[1]) cops[1].setAttribute('data-copy', ppUrl);
        const g2=dlg.querySelector('.donate-grid-2'); if(g2){ const anyVisible=[flow,kf].some(a=>{ try{ const c=a&&a.closest?a.closest('.donate-card'):null; return c&&c.style.display!=='none'; }catch(e){ return false; } }); g2.style.display=anyVisible?'':'none'; }
      }
    }catch(e){}
    const dlgEl=$('donateDialog'); if(dlgEl&&!dlgEl.open) dlgEl.showModal(); try{ dlgEl.scrollTop=0; }catch(e){}
  };
  const ct=$('donateCloseTop'), cb=$('donateClose'); if(ct) ct.onclick=()=>$('donateDialog').close(); if(cb) cb.onclick=()=>$('donateDialog').close();
  try{
    document.addEventListener('click', async (e)=>{
      const b=e.target&&e.target.closest?e.target.closest('.donate-copy'):null; if(!b) return;
      e.preventDefault(); e.stopPropagation();
      const txt=b.getAttribute('data-copy')||'';
      try{ await navigator.clipboard.writeText(txt); }catch(err){ try{ const ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }catch(e2){} }
      const old=b.textContent; b.textContent='✓ ¡Copiado!'; setTimeout(()=>{ b.textContent=old; },1400);
    });
  }catch(e){}
}
setTimeout(setupDonateDialog, 800);

// === CÓMO USAR ===
function setupHelpDialog(){
  const btn=$('btnHelp'); if(btn) btn.onclick=()=>{ $('helpDialog').showModal(); if(typeof showGuiaTab==='function') showGuiaTab('detallada'); };
  const ct=$('helpCloseTop'), cb=$('helpClose'); if(ct) ct.onclick=()=>$('helpDialog').close(); if(cb) cb.onclick=()=>$('helpDialog').close();
  const tb=$('tabGuiaBasica'), td=$('tabGuiaDetallada');
  if(tb) tb.onclick=()=>showGuiaTab('basica');
  if(td) td.onclick=()=>showGuiaTab('detallada');
}
function showGuiaTab(which){
  const basica = which!=='detallada';
  const pb=$('guiaBasicaPanel'), pd=$('guiaDetalladaPanel');
  const tb=$('tabGuiaBasica'), td=$('tabGuiaDetallada');
  if(pb) pb.classList.toggle('hidden', !basica);
  if(pd) pd.classList.toggle('hidden', basica);
  if(tb){ tb.classList.toggle('btn-accent', basica); tb.setAttribute('aria-selected', basica?'true':'false'); }
  if(td){ td.classList.toggle('btn-accent', !basica); td.setAttribute('aria-selected', !basica?'true':'false'); }
}
setTimeout(setupHelpDialog, 850);

// === CONFIGURACIÓN PERSONALIZABLE ===
// Incluye botones base + los inyectados por nuevos-modulos.js (Agua, Bodega, Nudos,
// Taller, Trueque, Minga, Rutinas, Fertilidad, Derechos). NUEVOS_BTNS los re-agrega
// con push si faltan (no-op si ya están), así los perfiles siempre los conocen.
const ALL_BTNS = ["btnTides","btnFishing","btnBirds","btnIntermareal","btnBosque","btnWeather","btnSiembra","btnAstro","btnComuna","btnIglesias","btnEkadashi","btnMenstrual","btnMedic","btnNutri","btnHabits","btnRutinas","btnMeal","btnShopping","btnFinance","btnHomeTasks","btnDiscipline","btnDreams","btnBreath","btnGratitud","btnSchedule","btnGym","btnCircadian","btnGolden","btnEspiritual","btnEspiritu","btnCompost","btnLawen","btnFirstAid","btnAnimalCare","btnViolence","btnEvac","btnConvert","btnEnergy","btnLena","btnTimer","btnRemind","btnDonate","btnHelp","btnStudy","btnTales","btnVozAbuelos","btnMemory","btnMapu","btnEnglish","btnGuitar","btnPsico","btnMetodos","btnAgua","btnBodega","btnNudos","btnTaller","btnTrueque","btnMinga","btnFerti","btnDerechos","btnCrianza","btnArbolFull","btnRecap","btnDueloFull","btnEneagrama","btnCuartoCamino","btnAjedrez","btnMatematicas","btnSudoku","btnCrucigrama","btnSopa","btnFlora","btnPsicologia","btnAdolescencia","btnJuventud","btnAdultez","btnClimaterio","btnVejez","btnElectrocultura","btnMecanica","btnDespensa","btnCloset","btnHerramientas","btnAdicciones","btnKinMaya","btnTarot","btnNumerologia","btnOraculo","btnAnfibios","btnApoyo","btnMuni","btnBomberos","btnConstelaciones","btnIkigai","btnVIA","btnSilva","btnGrabovoi","btnEstoicismo","btnHooponopono","btnTao","btnTolteca","btnVigyan","btnAnastasia","btnAmi","btnNatacion","btnHuerta","btnHidroponia","btnKayak","btnBallenas","btnMeli","btnHongos","btnSenderos","btnFuego","btnDomotica","btnNeurodiversidad","btnPelo","btnRituales","btnFenologia","btnCorral","btnMovilidad","btnEscolar","btnActores","btnNegocios","btnRedGuia","btnRedMeshtastic","btnRedDiagnostico","btnRedRadio","btnRedNodos","btnConvivGuia","btnConvivFichas","btnConvivHablar","btnConvivBitacora","btnConvivLuna","btnConvivRecursos","btnCiberGuia","btnCiberClaves","btnCiberEstafas","btnCiberPriv","btnCiberChequeo","btnCiberAyuda","btnOpenGuia","btnOpenLicencias","btnOpenProgramas","btnOpenProyecto","btnOpenAportar","btnOpenQuiz"];
// NOTA: lo técnico (Respaldo, Restaurar, Traspaso QR, PDF luna/ciclo, Acceso directo)
// vive en ⚙️ Ajustes con botones propios (cfg*Btn), siempre visibles: no forma parte
// de ALL_BTNS ni de la visibilidad por secciones. Se mantienen las claves antiguas
// en DATA.config.visible por compatibilidad, pero se ignoran.
// === REORGANIZACIÓN 7 GRUPOS (2026-10): grupo + subgrupo destino de cada botón ===
// Dinámicos que aún no existen en el DOM se mueven cuando se inyectan.
// Taxonomía pedida por la comunidad:
//  Mi Día: Organizar + Registrar · Territorio: mar + tierra (+Fenología) + cielo + penco
//  Cuerpo: ciclos + etapas (Adolescencia/Juventud/Adultez/Vejez) + cuidado
//  Aprender: estudio + idiomas + musica + juegos + infancias
//  Interior: conocerse + practicas + tradiciones + oraculos + sosten
//  Hogar: casa + energia + familia · Comunidad: red + red-comunitaria + convivencia + ciber + abierto + emergencia
const BTN_HOME = {
  btnHabits:['dia','organizar'],btnRutinas:['dia','organizar'],btnDiscipline:['dia','organizar'],btnSchedule:['dia','organizar'],btnTimer:['dia','organizar'],btnRemind:['dia','organizar'],
  btnGratitud:['dia','registrar'],btnDreams:['dia','registrar'],btnBreath:['dia','registrar'],
  btnTides:['territorio','mar'],btnFishing:['territorio','mar'],btnIntermareal:['territorio','mar'],btnNudos:['territorio','mar'],btnKayak:['territorio','mar'],btnBallenas:['territorio','mar'],
  btnHuerta:['territorio','tierra'],btnSiembra:['territorio','tierra'],btnBosque:['territorio','tierra'],btnCompost:['territorio','tierra'],btnAgua:['territorio','tierra'],btnHidroponia:['territorio','tierra'],btnElectrocultura:['territorio','tierra'],btnFlora:['territorio','tierra'],btnLawen:['territorio','tierra'],btnBirds:['territorio','tierra'],btnAnfibios:['territorio','tierra'],btnMeli:['territorio','tierra'],btnHongos:['territorio','tierra'],btnSenderos:['territorio','tierra'],btnFuego:['territorio','tierra'],btnFenologia:['territorio','tierra'],
  btnWeather:['territorio','cielo'],btnAstro:['territorio','cielo'],btnGolden:['territorio','cielo'],btnCircadian:['territorio','cielo'],btnEkadashi:['territorio','cielo'],
  btnComuna:['territorio','penco'],btnIglesias:['territorio','penco'],btnMuni:['territorio','penco'],btnBomberos:['territorio','penco'],btnActores:['territorio','penco'],btnNegocios:['territorio','penco'],
  btnMenstrual:['cuerpo','ciclos'],btnFerti:['cuerpo','ciclos'],btnClimaterio:['cuerpo','ciclos'],
  btnAdolescencia:['cuerpo','etapas'],btnJuventud:['cuerpo','etapas'],btnAdultez:['cuerpo','etapas'],btnVejez:['cuerpo','etapas'],
  btnMedic:['cuerpo','cuidado'],btnNutri:['cuerpo','cuidado'],btnGym:['cuerpo','cuidado'],btnNatacion:['cuerpo','cuidado'],btnPelo:['cuerpo','cuidado'],btnRituales:['cuerpo','cuidado'],
  btnStudy:['aprender','estudio'],btnMemory:['aprender','estudio'],btnMatematicas:['aprender','estudio'],
  btnMapu:['aprender','idiomas'],btnEnglish:['aprender','idiomas'],
  btnGuitar:['aprender','musica'],
  btnAjedrez:['aprender','juegos'],btnSudoku:['aprender','juegos'],btnCrucigrama:['aprender','juegos'],btnSopa:['aprender','juegos'],
  btnTales:['aprender','infancias'],btnCrianza:['aprender','infancias'],
  btnPsico:['linaje','conocerse'],btnPsicologia:['linaje','conocerse'],btnEneagrama:['linaje','conocerse'],btnVIA:['linaje','conocerse'],btnIkigai:['linaje','conocerse'],btnNeurodiversidad:['linaje','conocerse'],btnEspiritual:['linaje','practicas'],btnEspiritu:['linaje','practicas'],btnTao:['linaje','practicas'],btnRecap:['linaje','practicas'],btnTolteca:['linaje','practicas'],btnEstoicismo:['linaje','practicas'],btnCuartoCamino:['linaje','practicas'],btnHooponopono:['linaje','practicas'],btnMetodos:['linaje','tradiciones'],btnSilva:['linaje','tradiciones'],btnGrabovoi:['linaje','tradiciones'],btnVigyan:['linaje','tradiciones'],btnAnastasia:['linaje','tradiciones'],btnAmi:['linaje','tradiciones'],btnKinMaya:['linaje','oraculos'],btnTarot:['linaje','oraculos'],btnNumerologia:['linaje','oraculos'],btnOraculo:['linaje','oraculos'],btnDueloFull:['linaje','sosten'],btnAdicciones:['linaje','sosten'],
  btnArbolFull:['hogar','familia'],btnVozAbuelos:['hogar','familia'],btnConstelaciones:['hogar','familia'],
  btnMeal:['hogar','casa'],btnShopping:['hogar','casa'],btnFinance:['hogar','casa'],btnHomeTasks:['hogar','casa'],btnBodega:['hogar','casa'],btnDespensa:['hogar','casa'],btnCloset:['hogar','casa'],btnCorral:['hogar','casa'],btnMovilidad:['hogar','casa'],btnEscolar:['hogar','casa'],
  btnEnergy:['hogar','energia'],btnLena:['hogar','energia'],btnTaller:['hogar','energia'],btnHerramientas:['hogar','energia'],btnMecanica:['hogar','energia'],btnDomotica:['hogar','energia'],btnConvert:['hogar','energia'],
  btnTrueque:['comunidad','red'],btnMinga:['comunidad','red'],btnDerechos:['comunidad','red'],btnAnimalCare:['comunidad','red'],
  // btnDonate vive FUERA de los grupos (CTA final tras Comunidad): sin BTN_HOME
  // para que reordenarAcciones no lo devuelva a comunidad|red. Sigue en ALL_BTNS/PRESETS.
  btnRedGuia:['comunidad','red-comunitaria'],btnRedMeshtastic:['comunidad','red-comunitaria'],btnRedDiagnostico:['comunidad','red-comunitaria'],btnRedRadio:['comunidad','red-comunitaria'],btnRedNodos:['comunidad','red-comunitaria'],
  btnConvivGuia:['comunidad','convivencia-vecinal'],btnConvivFichas:['comunidad','convivencia-vecinal'],btnConvivHablar:['comunidad','convivencia-vecinal'],btnConvivBitacora:['comunidad','convivencia-vecinal'],btnConvivLuna:['comunidad','convivencia-vecinal'],btnConvivRecursos:['comunidad','convivencia-vecinal'],
  btnCiberGuia:['comunidad','ciberseguridad'],btnCiberClaves:['comunidad','ciberseguridad'],btnCiberEstafas:['comunidad','ciberseguridad'],btnCiberPriv:['comunidad','ciberseguridad'],btnCiberChequeo:['comunidad','ciberseguridad'],btnCiberAyuda:['comunidad','ciberseguridad'],
  btnOpenGuia:['comunidad','codigo-abierto'],btnOpenLicencias:['comunidad','codigo-abierto'],btnOpenProgramas:['comunidad','codigo-abierto'],btnOpenProyecto:['comunidad','codigo-abierto'],btnOpenAportar:['comunidad','codigo-abierto'],btnOpenQuiz:['comunidad','codigo-abierto'],
  btnFirstAid:['comunidad','emergencia'],btnViolence:['comunidad','emergencia'],btnEvac:['comunidad','emergencia'],btnApoyo:['comunidad','emergencia']
};
// Orden de botones dentro de cada subgrupo (los no listados van al final en orden de llegada)
const BTN_ORDER = {
  'dia|organizar':['btnHabits','btnRutinas','btnDiscipline','btnSchedule','btnTimer','btnRemind'],
  'dia|registrar':['btnGratitud','btnDreams','btnBreath'],
  'territorio|mar':['btnTides','btnFishing','btnIntermareal','btnNudos','btnKayak','btnBallenas'],
  'territorio|tierra':['btnHuerta','btnSiembra','btnBosque','btnCompost','btnAgua','btnHidroponia','btnElectrocultura','btnFlora','btnLawen','btnBirds','btnAnfibios','btnMeli','btnHongos','btnSenderos','btnFuego','btnFenologia'],
  'territorio|cielo':['btnWeather','btnAstro','btnGolden','btnCircadian','btnEkadashi'],
  'territorio|penco':['btnComuna','btnIglesias','btnMuni','btnBomberos','btnActores','btnNegocios'],
  'cuerpo|ciclos':['btnMenstrual','btnFerti','btnClimaterio'],
  'cuerpo|etapas':['btnAdolescencia','btnJuventud','btnAdultez','btnVejez'],
  'cuerpo|cuidado':['btnMedic','btnNutri','btnGym','btnNatacion','btnPelo','btnRituales'],
  'aprender|estudio':['btnStudy','btnMemory','btnMatematicas'],
  'aprender|idiomas':['btnMapu','btnEnglish'],
  'aprender|musica':['btnGuitar'],
  'aprender|juegos':['btnAjedrez','btnSudoku','btnCrucigrama','btnSopa'],
  'aprender|infancias':['btnTales','btnCrianza'],
  'linaje|conocerse':['btnPsico','btnPsicologia','btnEneagrama','btnVIA','btnIkigai','btnNeurodiversidad'],
  'linaje|practicas':['btnEspiritual','btnEspiritu','btnTao','btnRecap','btnTolteca','btnEstoicismo','btnCuartoCamino','btnHooponopono'],
  'linaje|tradiciones':['btnMetodos','btnSilva','btnGrabovoi','btnVigyan','btnAnastasia','btnAmi'],
  'linaje|oraculos':['btnKinMaya','btnTarot','btnNumerologia','btnOraculo'],
  'linaje|sosten':['btnDueloFull','btnAdicciones'],
  'hogar|casa':['btnMeal','btnShopping','btnFinance','btnHomeTasks','btnBodega','btnDespensa','btnCloset','btnCorral','btnMovilidad','btnEscolar'],
  'hogar|energia':['btnEnergy','btnLena','btnTaller','btnHerramientas','btnMecanica','btnDomotica','btnConvert'],
  'hogar|familia':['btnArbolFull','btnVozAbuelos','btnConstelaciones'],
  'comunidad|red':['btnTrueque','btnMinga','btnDerechos','btnAnimalCare'],
  'comunidad|red-comunitaria':['btnRedGuia','btnRedMeshtastic','btnRedDiagnostico','btnRedRadio','btnRedNodos'],
  'comunidad|convivencia-vecinal':['btnConvivGuia','btnConvivFichas','btnConvivHablar','btnConvivBitacora','btnConvivLuna','btnConvivRecursos'],
  'comunidad|ciberseguridad':['btnCiberGuia','btnCiberClaves','btnCiberEstafas','btnCiberPriv','btnCiberChequeo','btnCiberAyuda'],
  'comunidad|codigo-abierto':['btnOpenGuia','btnOpenLicencias','btnOpenProgramas','btnOpenProyecto','btnOpenAportar','btnOpenQuiz'],
  'comunidad|emergencia':['btnFirstAid','btnViolence','btnEvac','btnApoyo']
};
// Red de seguridad (2026-10): registra botones/checkboxes tardíos (módulos
// diferidos) en ALL_BTNS + BTN_HOME + PRESETS.todo/adulto, para que
// Personalizar, presets y applyVisibility los conozcan aunque lleguen tarde.
function registerLateButtons(){
  try{
    var known={};
    ALL_BTNS.forEach(function(k){ known[k]=1; });
    var touched=false;
    document.querySelectorAll('#actions .group-btns .btn[id]').forEach(function(b){
      var id=b.id;
      if(!id||known[id]) return;
      ALL_BTNS.push(id); known[id]=1; touched=true;
      try{
        var g=b.closest?b.closest('.action-group'):null;
        var gn=g?g.getAttribute('data-group'):null;
        var sub=(b.dataset&&b.dataset.sub)||null;
        if(gn&&typeof BTN_HOME!=='undefined'&&!BTN_HOME[id]) BTN_HOME[id]=[gn,sub||''];
      }catch(e){}
    });
    document.querySelectorAll('#configDialog input[data-btn]').forEach(function(cb){
      var id=cb.getAttribute&&cb.getAttribute('data-btn');
      if(id&&!known[id]){ ALL_BTNS.push(id); known[id]=1; touched=true; }
    });
    if(touched&&typeof PRESETS!=='undefined'){
      try{ if(PRESETS.todo) ALL_BTNS.forEach(function(k){ if(!(k in PRESETS.todo)) PRESETS.todo[k]=true; }); }catch(e){}
      try{ if(PRESETS.adulto) ALL_BTNS.forEach(function(k){ if(!(k in PRESETS.adulto)) PRESETS.adulto[k]=true; }); }catch(e){}
    }
  }catch(e){}
}
function reordenarAcciones(){
  try{ if(typeof registerLateButtons==='function') registerLateButtons(); }catch(e){}
  try{
    Object.keys(BTN_HOME).forEach(function(id){
      var el = document.getElementById(id);
      if(!el) return;
      var dest = BTN_HOME[id];
      var g = document.querySelector('.action-group[data-group="'+dest[0]+'"] .group-btns');
      if(!g) return;
      if(el.parentNode !== g) g.appendChild(el);
      try{ el.dataset.sub = dest[1]; }catch(e){}
    });
    // ordenar dentro de cada grupo por subgrupo
    document.querySelectorAll('.action-group').forEach(function(gr){
      var gname = gr.getAttribute('data-group');
      var box = gr.querySelector('.group-btns');
      if(!box) return;
      var labels = Array.prototype.slice.call(box.querySelectorAll('.sub-label'));
      var btns = Array.prototype.slice.call(box.querySelectorAll('.btn'));
      // Agrupar botones por sub
      var bySub = {};
      btns.forEach(function(b){
        var s = (b.dataset && b.dataset.sub) || '__none__';
        // si el botón no tiene sub pero BTN_HOME lo define, usarlo
        if((s==='__none__'||!s) && BTN_HOME[b.id]) s = BTN_HOME[b.id][1];
        (bySub[s] = bySub[s] || []).push(b);
      });
      Object.keys(bySub).forEach(function(s){
        var key = gname+'|'+s;
        var order = BTN_ORDER[key];
        if(order){
          bySub[s].sort(function(a,b){
            var ia = order.indexOf(a.id), ib = order.indexOf(b.id);
            if(ia<0 && ib<0) return 0;
            if(ia<0) return 1;
            if(ib<0) return -1;
            return ia-ib;
          });
        }
      });
      // Reconstruir: por cada sub-label existente en orden DOM, luego su sub; subs sin label al final
      var seen = {};
      labels.forEach(function(lab){
        box.appendChild(lab);
        var s = lab.getAttribute('data-sub');
        seen[s] = true;
        (bySub[s]||[]).forEach(function(b){ box.appendChild(b); });
      });
      Object.keys(bySub).forEach(function(s){
        if(seen[s] || s==='__none__') return;
        (bySub[s]||[]).forEach(function(b){ box.appendChild(b); });
      });
      // botones sin sub declarado (legacy) quedan al final
      (bySub['__none__']||[]).forEach(function(b){ box.appendChild(b); });
    });
    try{ if(typeof updateGroupCounts==='function') updateGroupCounts(); }catch(e){}
  }catch(e){}
}
const PRESETS = {
  todo: Object.fromEntries(ALL_BTNS.map(k=>[k,true])),
  // Esencial: día completo + cielo completo + mar/tierra básicos + casa básica + infancias + emergencia completa.
  esencial: {btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnDreams:true,btnBreath:true,btnWeather:true,btnAstro:true,btnGolden:true,btnCircadian:true,btnEkadashi:true,btnTides:true,btnSiembra:true,btnMeal:true,btnShopping:true,btnFinance:true,btnHomeTasks:true,btnTales:true,btnCrianza:true,btnFirstAid:true,btnViolence:true,btnEvac:true,btnApoyo:true,btnHelp:true,btnDonate:true},
  // Adolescente: día completo + cuerpo en cambio + aprender sin infancias (excepción: solo Cuentos, sin Crianza) + conocerse/oráculos/sostén completos + Recap + familia completa + casa básica + cielo parcial + emergencia completa.
  adolescente: {btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnDreams:true,btnBreath:true,btnMenstrual:true,btnFerti:true,btnAdolescencia:true,btnJuventud:true,btnNutri:true,btnGym:true,btnNatacion:true,btnPelo:true,btnStudy:true,btnMemory:true,btnMatematicas:true,btnMapu:true,btnEnglish:true,btnGuitar:true,btnAjedrez:true,btnSudoku:true,btnCrucigrama:true,btnSopa:true,btnTales:true,btnPsico:true,btnPsicologia:true,btnEneagrama:true,btnVIA:true,btnIkigai:true,btnNeurodiversidad:true,btnKinMaya:true,btnTarot:true,btnNumerologia:true,btnOraculo:true,btnDueloFull:true,btnAdicciones:true,btnRecap:true,btnArbolFull:true,btnVozAbuelos:true,btnConstelaciones:true,btnMeal:true,btnShopping:true,btnFinance:true,btnHomeTasks:true,btnConvert:true,btnWeather:true,btnAstro:true,btnCircadian:true,btnFirstAid:true,btnViolence:true,btnEvac:true,btnApoyo:true,btnHelp:true,btnDonate:true},
  adulto: Object.fromEntries(ALL_BTNS.map(k=>[k,true])),
  // Mayor: día completo + cuerpo (climaterio/adultez/vejez + cuidado completo) + estudio+juegos+infancias + sostén+oráculos completos + Espiritual/Recap + cielo completo + tierra de autoconsumo + penco servicios + familia completa + casa apoyada + red vecinal + emergencia completa.
  mayor: {btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnDreams:true,btnBreath:true,btnClimaterio:true,btnAdultez:true,btnVejez:true,btnMedic:true,btnNutri:true,btnGym:true,btnNatacion:true,btnPelo:true,btnRituales:true,btnStudy:true,btnMemory:true,btnMatematicas:true,btnAjedrez:true,btnSudoku:true,btnCrucigrama:true,btnSopa:true,btnTales:true,btnCrianza:true,btnEspiritual:true,btnEspiritu:true,btnRecap:true,btnKinMaya:true,btnTarot:true,btnNumerologia:true,btnOraculo:true,btnDueloFull:true,btnAdicciones:true,btnWeather:true,btnAstro:true,btnGolden:true,btnCircadian:true,btnEkadashi:true,btnTides:true,btnSiembra:true,btnHuerta:true,btnBosque:true,btnCompost:true,btnLawen:true,btnComuna:true,btnIglesias:true,btnMuni:true,btnBomberos:true,btnArbolFull:true,btnVozAbuelos:true,btnConstelaciones:true,btnMeal:true,btnShopping:true,btnHomeTasks:true,btnCorral:true,btnMovilidad:true,btnEnergy:true,btnLena:true,btnConvert:true,btnTrueque:true,btnMinga:true,btnAnimalCare:true,btnFirstAid:true,btnViolence:true,btnEvac:true,btnApoyo:true,btnHelp:true,btnDonate:true},
  // Estudiante: día completo + aprender completo + Eneagrama/VIA/Ikigai+Recap+Métodos + cuerpo joven + cielo parcial + casa básica + Convert + VozAbuelos + ciber básico + emergencia completa.
  estudiante: {btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnDreams:true,btnBreath:true,btnStudy:true,btnMemory:true,btnMatematicas:true,btnMapu:true,btnEnglish:true,btnGuitar:true,btnAjedrez:true,btnSudoku:true,btnCrucigrama:true,btnSopa:true,btnEneagrama:true,btnVIA:true,btnIkigai:true,btnRecap:true,btnMetodos:true,btnAdolescencia:true,btnJuventud:true,btnNutri:true,btnGym:true,btnNatacion:true,btnWeather:true,btnAstro:true,btnCircadian:true,btnMeal:true,btnShopping:true,btnFinance:true,btnHomeTasks:true,btnConvert:true,btnVozAbuelos:true,btnCiberGuia:true,btnCiberClaves:true,btnCiberEstafas:true,btnCiberPriv:true,btnFirstAid:true,btnViolence:true,btnEvac:true,btnApoyo:true,btnHelp:true,btnDonate:true},
  // Agricultor: tierra completa + cielo completo + mar de riego/marea + penco + casa productiva + energía sin domótica + VozAbuelos + red completa + día (organizar + gratitud) + emergencia de campo.
  agricultor: {btnHuerta:true,btnSiembra:true,btnBosque:true,btnCompost:true,btnAgua:true,btnHidroponia:true,btnElectrocultura:true,btnFlora:true,btnLawen:true,btnBirds:true,btnAnfibios:true,btnMeli:true,btnHongos:true,btnSenderos:true,btnFuego:true,btnFenologia:true,btnWeather:true,btnAstro:true,btnGolden:true,btnCircadian:true,btnEkadashi:true,btnTides:true,btnIntermareal:true,btnComuna:true,btnMuni:true,btnMeal:true,btnShopping:true,btnFinance:true,btnHomeTasks:true,btnBodega:true,btnDespensa:true,btnCorral:true,btnEnergy:true,btnLena:true,btnTaller:true,btnHerramientas:true,btnMecanica:true,btnConvert:true,btnVozAbuelos:true,btnTrueque:true,btnMinga:true,btnDerechos:true,btnAnimalCare:true,btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnFirstAid:true,btnEvac:true,btnApoyo:true,btnHelp:true,btnDonate:true},
  // Pescador: mar completo + cielo completo + ribera + penco costero + casa base + taller/mecánica + Trueque/Minga + día (organizar + gratitud/respiración) + cuerpo activo + emergencia completa.
  pescador: {btnTides:true,btnFishing:true,btnIntermareal:true,btnNudos:true,btnKayak:true,btnBallenas:true,btnWeather:true,btnAstro:true,btnGolden:true,btnCircadian:true,btnEkadashi:true,btnBosque:true,btnBirds:true,btnAnfibios:true,btnAgua:true,btnFenologia:true,btnComuna:true,btnMuni:true,btnBomberos:true,btnMeal:true,btnShopping:true,btnFinance:true,btnTaller:true,btnMecanica:true,btnConvert:true,btnTrueque:true,btnMinga:true,btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnBreath:true,btnNutri:true,btnGym:true,btnNatacion:true,btnFirstAid:true,btnViolence:true,btnEvac:true,btnApoyo:true,btnHelp:true,btnDonate:true},
  // Salud: cuerpo completo sin adolescencia + día completo + conocerse/oráculos/sostén + Espiritual/Recap/Métodos + memoria y juegos + cielo de ritmo + tierra de autoconsumo + casa base + VozAbuelos + Minga/AnimalCare + emergencia completa.
  salud: {btnMenstrual:true,btnFerti:true,btnClimaterio:true,btnJuventud:true,btnAdultez:true,btnVejez:true,btnMedic:true,btnNutri:true,btnGym:true,btnNatacion:true,btnPelo:true,btnRituales:true,btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnDreams:true,btnBreath:true,btnPsico:true,btnPsicologia:true,btnEneagrama:true,btnVIA:true,btnIkigai:true,btnNeurodiversidad:true,btnEspiritual:true,btnEspiritu:true,btnRecap:true,btnMetodos:true,btnKinMaya:true,btnTarot:true,btnNumerologia:true,btnOraculo:true,btnDueloFull:true,btnAdicciones:true,btnMemory:true,btnAjedrez:true,btnSudoku:true,btnCrucigrama:true,btnSopa:true,btnWeather:true,btnCircadian:true,btnEkadashi:true,btnHuerta:true,btnCompost:true,btnLawen:true,btnMeal:true,btnShopping:true,btnHomeTasks:true,btnVozAbuelos:true,btnMinga:true,btnAnimalCare:true,btnFirstAid:true,btnViolence:true,btnEvac:true,btnApoyo:true,btnHelp:true,btnDonate:true},
  // Deportista: día completo + cuidado completo + Juventud/Adultez + Weather/Tides/Circadian + casa de rendimiento + Energy/Convert + VIA/Ikigai/Espiritual + emergencia completa.
  deportista: {btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnDreams:true,btnBreath:true,btnJuventud:true,btnAdultez:true,btnMedic:true,btnNutri:true,btnGym:true,btnNatacion:true,btnPelo:true,btnRituales:true,btnWeather:true,btnTides:true,btnCircadian:true,btnMeal:true,btnShopping:true,btnFinance:true,btnEnergy:true,btnConvert:true,btnVIA:true,btnIkigai:true,btnEspiritual:true,btnEspiritu:true,btnFirstAid:true,btnViolence:true,btnEvac:true,btnApoyo:true,btnHelp:true,btnDonate:true},
  // Docente: aprender completo + familia completa + casa con Escolar/Movilidad + conocerse parcial + Recap/Métodos/Duelo + día completo + tierra educativa + Adolescencia/Juventud + Trueque/Minga/Derechos + ciber básico + emergencia completa.
  docente: {btnStudy:true,btnMemory:true,btnMatematicas:true,btnMapu:true,btnEnglish:true,btnGuitar:true,btnAjedrez:true,btnSudoku:true,btnCrucigrama:true,btnSopa:true,btnTales:true,btnCrianza:true,btnArbolFull:true,btnVozAbuelos:true,btnConstelaciones:true,btnMeal:true,btnShopping:true,btnFinance:true,btnHomeTasks:true,btnEscolar:true,btnMovilidad:true,btnPsico:true,btnPsicologia:true,btnEneagrama:true,btnVIA:true,btnIkigai:true,btnRecap:true,btnMetodos:true,btnDueloFull:true,btnHabits:true,btnRutinas:true,btnDiscipline:true,btnSchedule:true,btnTimer:true,btnRemind:true,btnGratitud:true,btnDreams:true,btnBreath:true,btnWeather:true,btnCircadian:true,btnSiembra:true,btnHuerta:true,btnBosque:true,btnCompost:true,btnBirds:true,btnFenologia:true,btnAdolescencia:true,btnJuventud:true,btnTrueque:true,btnMinga:true,btnDerechos:true,btnCiberGuia:true,btnCiberClaves:true,btnCiberEstafas:true,btnCiberPriv:true,btnFirstAid:true,btnViolence:true,btnEvac:true,btnApoyo:true,btnConvert:true,btnHelp:true,btnDonate:true}
};
function getVisibleConfig(){
  const c = (DATA.config && DATA.config.visible) || {};
  const out={}; ALL_BTNS.forEach(k=> out[k]= c[k]!==false );
  return out;
}
function applyVisibility(){
  try{ if(typeof registerLateButtons==='function') registerLateButtons(); }catch(e){}
  const vis=getVisibleConfig();
  ALL_BTNS.forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.toggle('hidden-by-config', !vis[id]);
  });
  updateGroupCounts();
  try{ applyFontSize(); }catch(e){}
  try{ applyModosVista(); }catch(e){}
}
// === TAMAÑO DE LETRA (Ajustes → 🔠): 6 tamaños, se guarda por usuario ===
const FONT_SIZES=['m','l','xl','xxl','3xl','4xl'];
function getFontSize(){
  try{
    const f=DATA.config&&DATA.config.fontSize;
    if(FONT_SIZES.indexOf(f)>=0) return f;
    if(DATA.config&&DATA.config.largeText) return 'l'; // compat: ajuste grande antiguo
  }catch(e){}
  return 'm';
}
function applyFontSize(){
  const f=getFontSize();
  document.body.dataset.font=f;
  // zoom de página va en <html> (ver styles.css): escala todo sin romper layout
  try{ document.documentElement.dataset.font=f; }catch(e){}
  // large-text mantiene las reglas de escala existentes (todo sobre Normal)
  document.body.classList.toggle('large-text', f!=='m');
  document.querySelectorAll('.font-pill').forEach(b=> b.setAttribute('aria-pressed', b.dataset.font===f?'true':'false'));
  const cb=document.getElementById('cfgLargeText'); if(cb) cb.checked=(f!=='m');
}
// === 👁️ MODOS DE VISTA (⚙️ Personalizar → Modos de vista) ===
// Guarda por usuario en DATA.config.modos = { lectura, noche, contraste, luzSuave }
const MODOS_VISTA_KEYS = ['lectura', 'noche', 'contraste', 'luzSuave'];
function getModosVista(){
  const m = (DATA.config && DATA.config.modos) || {};
  return { lectura: !!m.lectura, noche: !!m.noche, contraste: !!m.contraste, luzSuave: !!m.luzSuave };
}
function ensureFiltroOverlay(){
  let ov = document.getElementById('filtroNocheOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'filtroNocheOverlay';
    ov.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ov);
  }
  return ov;
}
function applyModosVista(){
  const m = getModosVista();
  try { ensureFiltroOverlay(); } catch (e) {}
  if (m.lectura) document.body.setAttribute('data-modo-lectura', '1');
  else document.body.removeAttribute('data-modo-lectura');
  if (m.contraste) document.body.setAttribute('data-alto-contraste', '1');
  else document.body.removeAttribute('data-alto-contraste');
  if (m.noche) document.body.setAttribute('data-modo-noche', '1');
  else document.body.removeAttribute('data-modo-noche');
  if (m.luzSuave) document.body.setAttribute('data-luz-suave', '1');
  else document.body.removeAttribute('data-luz-suave');
  document.querySelectorAll('#configDialog input[data-modo]').forEach(cb => {
    cb.checked = !!m[cb.dataset.modo];
  });
}
function syncModosVistaUI(){
  try {
    const m = getModosVista();
    document.querySelectorAll('#configDialog input[data-modo]').forEach(cb => {
      cb.checked = !!m[cb.dataset.modo];
    });
  } catch (e) {}
}
function setupModosVista(){
  document.querySelectorAll('#configDialog input[data-modo]').forEach(cb => {
    if (cb.dataset.modoBound) return;
    cb.dataset.modoBound = '1';
    cb.onchange = () => {
      DATA.config = DATA.config || {};
      DATA.config.modos = DATA.config.modos || {};
      DATA.config.modos[cb.dataset.modo] = cb.checked;
      scheduleSave('Modo de vista guardado ✓');
      applyModosVista();
    };
  });
}
function updateGroupCounts(){
  document.querySelectorAll('.action-group').forEach(g=>{
    const total = g.querySelectorAll('.group-btns .btn').length;
    const visible = g.querySelectorAll('.group-btns .btn:not(.hidden-by-config):not(.hidden-by-search)').length;
    const c = g.querySelector('.ag-count');
    // Conteos ocultos por preferencia: no mostrar (visible/total) en móvil ni PC.
    if(c) c.textContent = '';
    // ocultar grupo vacío por config (no por búsqueda)
    const hasVisible = g.querySelectorAll('.group-btns .btn:not(.hidden-by-config)').length > 0;
    g.style.display = hasVisible ? '' : 'none';
    // ocultar sub-etiquetas sin botones visibles por config
    try{
      const box = g.querySelector('.group-btns');
      if(box){
        const kids = Array.prototype.slice.call(box.children);
        let cur = null, curVisible = 0;
        const flush = ()=>{ if(cur) cur.style.display = curVisible===0 ? 'none' : ''; };
        kids.forEach(el=>{
          if(el.classList && el.classList.contains('sub-label')){ flush(); cur = el; curVisible = 0; }
          else if(el.classList && el.classList.contains('btn')){
            if(!el.classList.contains('hidden-by-config')) curVisible++;
          }
        });
        flush();
      }
    }catch(e){}
  });
  try{ if(typeof refreshSubLabels==='function') refreshSubLabels(); }catch(e){}
}
// === SUBSECCIONES DESPLEGABLES (igual que secciones principales) ===
function getSubCollapsedMap(){
  try{
    const raw = localStorage.getItem('subCollapsedV1');
    return raw ? (JSON.parse(raw)||{}) : {};
  }catch(e){ return {}; }
}
function subCollapseKey(group, sub){ return (group||'')+'|'+(sub||''); }
function isSubCollapsed(group, sub){
  try{ return !!getSubCollapsedMap()[subCollapseKey(group, sub)]; }catch(e){ return false; }
}
function setSubCollapsed(group, sub, collapsed){
  try{
    const m = getSubCollapsedMap();
    const k = subCollapseKey(group, sub);
    if(collapsed) m[k]=true; else delete m[k];
    localStorage.setItem('subCollapsedV1', JSON.stringify(m));
  }catch(e){}
}
function getSubButtons(labelEl){
  const out=[];
  try{
    let n = labelEl ? labelEl.nextElementSibling : null;
    while(n){
      if(n.classList && n.classList.contains('sub-label')) break;
      if(n.classList && n.classList.contains('btn')) out.push(n);
      n = n.nextElementSibling;
    }
  }catch(e){}
  return out;
}
function applySubLabel(labelEl){
  try{
    if(!labelEl) return;
    const box = labelEl.parentElement;
    const group = (labelEl.closest && labelEl.closest('.action-group') || {}).getAttribute
      ? labelEl.closest('.action-group').getAttribute('data-group') : '';
    const sub = labelEl.getAttribute ? (labelEl.getAttribute('data-sub')||'') : '';
    // accesibilidad + pista visual (solo una vez)
    if(!labelEl.hasAttribute('tabindex')) labelEl.setAttribute('tabindex','0');
    if(!labelEl.hasAttribute('role')) labelEl.setAttribute('role','button');
    if(!labelEl.title) labelEl.title = 'Toca para desplegar / ocultar';
    // contador oculto por preferencia: no mostrar (visible/total) en móvil ni PC.
    // Si existía de una versión anterior, se elimina para que no quede rastro.
    let cnt = labelEl.querySelector ? labelEl.querySelector('.sub-count') : null;
    if(cnt){ try{ cnt.remove(); }catch(e){} cnt = null; }
    const btns = getSubButtons(labelEl);
    const visConf = btns.filter(b=>!b.classList.contains('hidden-by-config') && !b.classList.contains('hidden-by-search')).length;
    // estado colapsado (persistido). Durante búsqueda se suspende para mostrar coincidencias.
    const searching = !!(window.__subSearchActive);
    let collapsed = isSubCollapsed(group, sub);
    if(searching){
      // si hay coincidencias en esta sub, mostrar expandida temporalmente
      if(visConf>0){ labelEl.classList.remove('collapsed'); }
      btns.forEach(b=> b.classList.remove('hidden-by-sub'));
      return;
    }
    labelEl.classList.toggle('collapsed', !!collapsed);
    labelEl.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btns.forEach(b=> b.classList.toggle('hidden-by-sub', !!collapsed));
  }catch(e){}
}
function refreshSubLabels(){
  try{
    document.querySelectorAll('#actions .sub-label').forEach(applySubLabel);
  }catch(e){}
}
function toggleSubLabel(labelEl){
  try{
    if(!labelEl) return;
    const g = labelEl.closest ? labelEl.closest('.action-group') : null;
    const group = g ? g.getAttribute('data-group') : '';
    const sub = labelEl.getAttribute ? (labelEl.getAttribute('data-sub')||'') : '';
    const next = !labelEl.classList.contains('collapsed');
    setSubCollapsed(group, sub, next);
    applySubLabel(labelEl);
  }catch(e){}
}
function setupSubToggle(){
  try{
    // delegación: cubre sub-labels actuales y los inyectados por módulos
    if(!window.__subToggleBound){
      window.__subToggleBound = true;
      document.addEventListener('click', function(e){
        const lab = e.target && e.target.closest ? e.target.closest('#actions .sub-label') : null;
        if(lab){ toggleSubLabel(lab); }
      });
      document.addEventListener('keydown', function(e){
        const lab = e.target && e.target.closest ? e.target.closest('#actions .sub-label') : null;
        if(lab && (e.key==='Enter' || e.key===' ')){
          e.preventDefault();
          toggleSubLabel(lab);
        }
      });
    }
    refreshSubLabels();
  }catch(e){}
}
setTimeout(function(){ try{ setupSubToggle(); }catch(e){} }, 880);
setTimeout(function(){ try{ refreshSubLabels(); }catch(e){} }, 1300);
setTimeout(function(){ try{ refreshSubLabels(); }catch(e){} }, 2600);
setTimeout(function(){ try{ reordenarAcciones(); }catch(e){} }, 1200);
setTimeout(function(){ try{ reordenarAcciones(); }catch(e){} }, 2500);
// === SECCIONES PRINCIPALES ABIERTAS/CERRADAS (details.action-group) ===
// Primera vez: todo cerrado (el HTML no trae `open`; sin registro = cerrada).
// Al abrir/cerrar una sección se guarda en DATA.config.secciones y se restaura al iniciar.
function getSeccionesMap(){
  try{
    const s = DATA.config && DATA.config.secciones;
    return (s && typeof s === 'object') ? s : {};
  }catch(e){ return {}; }
}
function applySecciones(){
  try{
    if(window.__subSearchActive) return; // mientras se busca, manda la búsqueda
    const m = getSeccionesMap();
    document.querySelectorAll('#actions .action-group').forEach(g=>{
      const k = g.getAttribute ? g.getAttribute('data-group') : '';
      if(!k) return;
      const want = !!m[k];
      if(g.open !== want) g.open = want;
    });
    try{ if(typeof updateGroupCounts==='function') updateGroupCounts(); }catch(e){}
  }catch(e){}
}
function setupSeccionesToggle(){
  try{
    if(window.__secToggleBound) { applySecciones(); return; }
    window.__secToggleBound = true;
    // 'toggle' no burbujea: se escucha en captura para cubrir grupos actuales y futuros
    document.addEventListener('toggle', function(e){
      const g = e.target && e.target.closest ? e.target.closest('#actions .action-group') : null;
      if(!g || e.target !== g) return;
      try{
        if(window.__subSearchActive) return; // lo que abre/cierra la búsqueda no se guarda
        const k = g.getAttribute ? g.getAttribute('data-group') : '';
        if(!k) return;
        DATA.config = DATA.config || {};
        DATA.config.secciones = DATA.config.secciones || {};
        const has = !!DATA.config.secciones[k];
        if(!!g.open === has) return; // sin cambios (p. ej. restauración inicial)
        if(g.open) DATA.config.secciones[k] = true;
        else delete DATA.config.secciones[k];
        scheduleSave();
      }catch(e2){}
    }, true);
    applySecciones();
  }catch(e){}
}
setTimeout(function(){ try{ setupSeccionesToggle(); }catch(e){} }, 860);
setTimeout(function(){ try{ applySecciones(); }catch(e){} }, 2600);
function syncConfigMirrors(){
  try{
    const cu=$('cfgUserSel');
    if(cu){
      cu.innerHTML='';
      (DATA.usuarios||[]).forEach(u=>{
        const o=document.createElement('option');
        o.value=u.id; o.textContent=u.nombre;
        cu.appendChild(o);
      });
      cu.value=DATA.actual;
    }
    const cc=$('cfgCycleSel');
    if(cc){
      cc.innerHTML='';
      (typeof CYCLE_YEARS!=='undefined'?CYCLE_YEARS:[]).forEach(y=>{
        const o=document.createElement('option');
        o.value=String(y); o.textContent=y+' → '+(y+1);
        cc.appendChild(o);
      });
      try{ cc.value=String(currentCycleYear()); }catch(e){}
    }
    const ct2=$('cfgThemeSel');
    if(ct2){
      try{ ct2.value=getTheme(); }catch(e){}
    }
  }catch(e){}
}
function setupConfigDialog(){
  const btn=$('btnConfig'); if(btn) btn.onclick=()=>{
    const vis=getVisibleConfig();
    document.querySelectorAll('#configDialog input[data-btn]').forEach(cb=>{
      cb.checked = !!vis[cb.dataset.btn];
    });
    syncConfigMirrors();
    try { syncHomeConfigUI(); setupHomeConfig(); } catch (e) {}
    try { syncModosVistaUI(); setupModosVista(); } catch (e) {}
    try { syncPerfilUI(); } catch (e) {}
    $('configDialog').showModal();
  };
  try { setupHomeConfig(); syncHomeConfigUI(); } catch (e) {}
  try { setupModosVista(); syncModosVistaUI(); applyModosVista(); } catch (e) {}
  const ct=$('configCloseTop'), cb=$('configClose'), cts=$('configCloseTopSave');
  if(ct) ct.onclick=()=>$('configDialog').close();
  if(cb) cb.onclick=()=>$('configDialog').close();
  if(cts) cts.onclick=()=>$('configDialog').close();
  // Espejos: Usuario / Ciclo / Tema (para móvil sin sidebar)
  const cu=$('cfgUserSel');
  if(cu && !cu.dataset.bound){
    cu.dataset.bound='1';
    cu.onchange=()=>{
      DATA.actual=cu.value;
      scheduleSave();
      try{
        const us=$('userSel'); if(us) us.value=DATA.actual;
        selectCycle(currentCycleYear(), currentView.tipo==='dft'?'dft':currentView.luna);
      }catch(e){}
    };
  }
  const ca=$('cfgAddUser');
  if(ca && !ca.dataset.bound){ ca.dataset.bound='1'; ca.onclick=()=>{ try{ $('btnAddUser').click(); }catch(e){} setTimeout(syncConfigMirrors, 600); }; }
  const cd=$('cfgDelUser');
  if(cd && !cd.dataset.bound){ cd.dataset.bound='1'; cd.onclick=()=>{ try{ $('btnDelUser').click(); }catch(e){} setTimeout(syncConfigMirrors, 600); }; }
  const cc=$('cfgCycleSel');
  if(cc && !cc.dataset.bound){
    cc.dataset.bound='1';
    cc.onchange=()=>{
      try{
        const v=+cc.value;
        const cs=$('cycleSel'); if(cs) cs.value=String(v);
        selectCycle(v, currentView.luna);
        setTimeout(syncConfigMirrors, 300);
      }catch(e){}
    };
  }
  const cth=$('cfgThemeSel');
  if(cth && !cth.dataset.bound){
    cth.dataset.bound='1';
    cth.onchange=()=>{
      const v=cth.value;
      DATA.config=DATA.config||{};
      DATA.config.theme=v;
      scheduleSave();
      try{ applyTheme(v); }catch(e){}
      try{ const s=$('themeSel'); if(s) s.value=v; }catch(e){}
    };
  }
  const dn=$('cfgDonateBtn');
  if(dn && !dn.dataset.bound){
    dn.dataset.bound='1';
    dn.onclick=(e)=>{
      e.preventDefault(); e.stopPropagation();
      try{ $('configDialog').close(); }catch(err){}
      setTimeout(()=>{ try{ $('btnDonate').click(); }catch(err2){ try{ $('donateDialog').showModal(); }catch(e){} } }, 120);
    };
  }
  // Lo técnico vive en ⚙️ Ajustes: enlaza los botones del grupo 💾 Respaldo, PDF y acceso.
  try { bindBackupButtons(); } catch (e) {}
  try { bindRestoreButtons(); } catch (e) {}
  try { bindPdfButtons(); } catch (e) {}
  try {
    const sc = $('cfgShortcutBtn');
    if (sc && !sc.dataset.bound) { sc.dataset.bound = '1'; sc.onclick = createDesktopShortcut; }
  } catch (e) {}
  try {
    const qr = $('cfgQRSyncBtn');
    if (qr && !qr.dataset.bound) {
      qr.dataset.bound = '1';
      qr.onclick = (e) => {
        try { e.preventDefault(); e.stopPropagation(); } catch (e2) {}
        try {
          const b = $('btnQRSync');
          if (b) { b.click(); return; }
        } catch (e3) {}
        try { window.cal13qrOpen && window.cal13qrOpen(); } catch (e4) {}
      };
    }
  } catch (e) {}
  document.querySelectorAll('#configDialog input[data-btn]').forEach(cb=>{
    cb.onchange=()=>{
      DATA.config=DATA.config||{}; DATA.config.visible=DATA.config.visible||{};
      DATA.config.visible[cb.dataset.btn]=cb.checked;
      try { markPerfilPersonalizado(); } catch (e) {}
      scheduleSave(); applyVisibility();
    };
  });
  document.querySelectorAll('.config-preset').forEach(b=>{
    b.onclick=()=>{
      const preset=PRESETS[b.dataset.preset];
      if(!preset) return;
      DATA.config=DATA.config||{};
      const isAll=(b.dataset.preset==='todo'||b.dataset.preset==='adulto');
      const vis={}; ALL_BTNS.forEach(k=> vis[k]= isAll ? true : (preset[k] ? true : false));
      // si preset no define, dejar false
      DATA.config.visible=vis;
      DATA.config.perfil=b.dataset.preset;
      // v1.6.0: el perfil también ajusta la pantalla de inicio (vista + bloques ◉ Hoy).
      try{
        const hp = (typeof homeBlocksForPreset==='function') ? homeBlocksForPreset(b.dataset.preset) : null;
        if(hp){
          DATA.config.home = DATA.config.home || {};
          DATA.config.home.startView = hp.startView;
          DATA.config.home.blocks = hp.blocks;
          try{ syncHomeConfigUI(); }catch(e){}
        }
      }catch(e){}
      scheduleSave('Perfil aplicado: secciones + inicio ✓');
      document.querySelectorAll('#configDialog input[data-btn]').forEach(cb=> cb.checked=!!vis[cb.dataset.btn]);
      try{ syncPerfilUI(); }catch(e){}
      applyVisibility();
      try{ if (viewMode === 'hoy') renderTodayView(); }catch(e){}
    };
  });
  const largeCb=$('cfgLargeText'); if(largeCb) largeCb.onchange=()=>{ DATA.config=DATA.config||{}; DATA.config.largeText=largeCb.checked; scheduleSave(); applyVisibility(); };
  document.querySelectorAll('.font-pill').forEach(b=>{
    b.onclick=()=>{
      DATA.config=DATA.config||{};
      DATA.config.fontSize=b.dataset.font;
      DATA.config.largeText=(b.dataset.font!=='m');
      scheduleSave(); applyFontSize();
    };
  });
  const reset=$('configReset'); if(reset) reset.onclick=()=>{
    DATA.config=DATA.config||{}; DATA.config.visible=Object.fromEntries(ALL_BTNS.map(k=>[k,true]));
    DATA.config.perfil='todo';
    DATA.config.home=DATA.config.home||{};
    DATA.config.home.startView='auto';
    DATA.config.home.blocks=Object.assign({}, HOME_BLOCKS_DEFAULT);
    DATA.config.modos={ lectura: false, noche: false, contraste: false, luzSuave: false };
    DATA.config.secciones={};
    scheduleSave();
    document.querySelectorAll('#configDialog input[data-btn]').forEach(cb=> cb.checked=true);
    try{ syncHomeConfigUI(); }catch(e){}
    try{ syncPerfilUI(); }catch(e){}
    applyVisibility();
    try{ if(typeof applySecciones==='function') applySecciones(); }catch(e){}
  };
}

setTimeout(setupConfigDialog, 860);

// === BÚSQUEDA DE ACCIONES (Command Palette light) ===
function setupActionSearch(){
  const input = $('actionSearch');
  if(!input) return;
  function filter(q){
    const needle = (q||'').toLowerCase().trim();
    try{ window.__subSearchActive = !!needle; }catch(e){}
    document.querySelectorAll('#actions .group-btns .btn').forEach(btn=>{
      const txt = (btn.textContent + ' ' + (btn.dataset.keywords||'')).toLowerCase();
      const match = !needle || txt.includes(needle);
      btn.classList.toggle('hidden-by-search', !match);
      // al buscar, suspender el colapso para que se vean las coincidencias
      if(needle && match) btn.classList.remove('hidden-by-sub');
    });
    // abrir grupos que tienen coincidencias, cerrar los que no
    document.querySelectorAll('.action-group').forEach(g=>{
      const hasMatch = g.querySelectorAll('.group-btns .btn:not(.hidden-by-search):not(.hidden-by-config)').length > 0;
      const hasVisibleConfig = g.querySelectorAll('.group-btns .btn:not(.hidden-by-config)').length > 0;
      if(needle){
        g.open = hasMatch;
        g.style.display = hasMatch ? '' : 'none';
      } else {
        // restaurar visibilidad por config
        g.style.display = hasVisibleConfig ? '' : 'none';
        // restaurar abiertas/cerradas como las dejó el usuario
        try{ if(typeof applySecciones==='function') applySecciones(); }catch(e){}
      }
    });
    // ocultar sub-etiquetas sin botones visibles (búsqueda o config)
    document.querySelectorAll('.action-group').forEach(g=>{
      const box = g.querySelector('.group-btns');
      if(!box) return;
      const kids = Array.prototype.slice.call(box.children);
      let cur = null, curVisible = 0;
      const flush = ()=>{
        if(cur) cur.classList.toggle('hidden-by-search', curVisible===0);
      };
      kids.forEach(el=>{
        if(el.classList && el.classList.contains('sub-label')){ flush(); cur = el; curVisible = 0; }
        else if(el.classList && el.classList.contains('btn')){
          if(!el.classList.contains('hidden-by-search') && !el.classList.contains('hidden-by-config')) curVisible++;
        }
      });
      flush();
    });
    updateGroupCounts();
  }
  input.addEventListener('input', ()=> filter(input.value));
  input.addEventListener('keydown', e=>{
    if(e.key==='Escape'){ input.value=''; filter(''); input.blur(); }
    if(e.key==='Enter'){
      const first = document.querySelector('#actions .group-btns .btn:not(.hidden-by-search):not(.hidden-by-config)');
      if(first){ first.click(); input.value=''; filter(''); }
    }
  });
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); input.focus(); input.select(); }
  });
  // limpiar al hacer clic fuera
  document.addEventListener('click', e=>{
    if(!e.target.closest('#actions') && !e.target.closest('.actions-toolbar')) { /* no auto clear */ }
  });
  // inicial counts
  setTimeout(()=>{ try{ updateGroupCounts(); }catch{} }, 900);
}
setTimeout(setupActionSearch, 880);

// === DISCIPLINA v2 — sistema funcional diario ===
function discTodayKey(){
  try{ if(window.cal && window.cal.fmtKey) return window.cal.fmtKey.format(new Date()); }catch(e){}
  const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function getDisciplineData(){
  const u=userData();
  if(!u.discipline || typeof u.discipline!=='object') u.discipline={ mit:"", if:"", then:"" };
  const d=u.discipline;
  if(typeof d.mit!=='string') d.mit="";
  if(typeof d.if!=='string') d.if="";
  if(typeof d.then!=='string') d.then="";
  if(!d.log || typeof d.log!=='object') d.log={};
  return d;
}
function discGetToday(){
  const d=getDisciplineData();
  const k=discTodayKey();
  if(!d.log[k] || typeof d.log[k]!=='object') d.log[k]={ mit:d.mit||"", done:false, frog:false, pomodoros:0, quick:[], dist:[], block:"" };
  const t=d.log[k];
  // migrar intención global a hoy si hoy está vacío
  if(!t.mit && d.mit) t.mit=d.mit;
  if(!Array.isArray(t.quick)) t.quick=[];
  if(!Array.isArray(t.dist)) t.dist=[];
  if(typeof t.pomodoros!=='number') t.pomodoros=0;
  return t;
}
function discShiftKey(baseKey, delta){
  try{
    const dt=new Date(baseKey+'T12:00:00');
    dt.setDate(dt.getDate()+delta);
    return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
  }catch(e){ return baseKey; }
}
function discCalcStats(){
  const d=getDisciplineData();
  const today=discTodayKey();
  let racha=0;
  for(let i=0;i<60;i++){
    const k=discShiftKey(today, -i);
    // el día 0 puede estar en curso: solo cuenta si done; si hoy no done, empieza desde ayer
    const e=d.log[k];
    if(i===0 && !(e && e.done)){ continue; }
    if(e && e.done) racha++;
    else if(i===0) continue;
    else break;
    if(i===0 && e && e.done) continue; // seguirá contando ayer en i=1
  }
  // corrección: si hoy hecho, racha incluye hoy + consecutivos previos
  if(d.log[today] && d.log[today].done){
    racha=1;
    for(let i=1;i<60;i++){ const e=d.log[discShiftKey(today,-i)]; if(e&&e.done) racha++; else break; }
  } else {
    racha=0;
    for(let i=1;i<60;i++){ const e=d.log[discShiftKey(today,-i)]; if(e&&e.done) racha++; else break; }
  }
  let pomo7=0, mit7=0;
  for(let i=0;i<7;i++){
    const e=d.log[discShiftKey(today,-i)];
    if(e){ pomo7+=(+e.pomodoros||0); if(e.done) mit7++; }
  }
  const t=discGetToday();
  return { racha, pomo7, mit7, pomoHoy:(+t.pomodoros||0), doneHoy:!!t.done };
}
function renderDiscipline(){
  try{
    const d=getDisciplineData(), t=discGetToday(), s=discCalcStats();
    const st=$('discStats');
    if(st) st.innerHTML='<div class="disc-stat">🔥 <b>'+s.racha+'</b><span>racha MIT</span></div>'
      +'<div class="disc-stat">🍅 <b>'+s.pomoHoy+'</b><span>hoy</span></div>'
      +'<div class="disc-stat">📊 <b>'+s.pomo7+'</b><span>7 días</span></div>'
      +'<div class="disc-stat">✅ <b>'+s.mit7+'/7</b><span>MIT semana</span></div>';
    const mit=$('disciplineMIT'); if(mit && document.activeElement!==mit) mit.value=t.mit||d.mit||"";
    const iff=$('disciplineIf'), thn=$('disciplineThen');
    if(iff && document.activeElement!==iff) iff.value=d.if||"";
    if(thn && document.activeElement!==thn) thn.value=d.then||"";
    const dn=$('disciplineDone'); if(dn) dn.checked=!!t.done;
    const fr=$('disciplineFrog'); if(fr) fr.checked=!!t.frog;
    const bl=$('discBlock'); if(bl && document.activeElement!==bl) bl.value=t.block||"";
    const pc=$('discPomoCount'); if(pc) pc.textContent='🍅 '+s.pomoHoy;
    const dots=$('discPomoDots');
    if(dots) dots.textContent = s.pomoHoy<=0 ? 'Toca +1 cada vez que completes 25 min de foco.' : ('● '.repeat(Math.min(s.pomoHoy,12)).trim() + (s.pomoHoy>=4 ? ' — ¡pausa larga 15-30 min! 🎉' : ' — ¡sigue! 💪'));
    // 2-min
    const ql=$('discQuickList');
    if(ql){
      ql.innerHTML = t.quick.length ? t.quick.map((q,i)=>'<label class="dio-item'+(q.done?' done':'')+'"><input type="checkbox" data-dq="'+i+'"'+(q.done?' checked':'')+'><span class="dio-txt"><b>'+escapeHtml(q.txt)+'</b></span><span class="dio-check">'+(q.done?'✓':'2′')+'</span></label>').join('') : '<p class="muted su-11a508">Vacío. Agrega tu primer micro-pendiente 👆.</p>';
      ql.querySelectorAll('[data-dq]').forEach(cb=> cb.onchange=()=>{ t.quick[+cb.dataset.dq].done=cb.checked; d.mit=(t.mit||""); scheduleSave(cb.checked?'2-min hecho ✓':'Guardado ✓'); renderDiscipline(); });
    }
    // distracciones
    const dl=$('discDistList');
    if(dl){
      dl.innerHTML = t.dist.length ? t.dist.map((x,i)=>'<div class="dio-item"><span class="dio-txt"><b>'+escapeHtml(x)+'</b></span><button type="button" class="btn btn-icon" data-dd="'+i+'" title="Quitar">✕</button></div>').join('') : '<p class="muted su-11a508">Sin distracciones. Mente despejada 🌙.</p>';
      dl.querySelectorAll('[data-dd]').forEach(b=> b.onclick=()=>{ t.dist.splice(+b.dataset.dd,1); scheduleSave(); renderDiscipline(); });
    }
    // historial
    const h=$('discHistory');
    if(h){
      const today=discTodayKey();
      let rows=[];
      for(let i=0;i<7;i++){
        const k=discShiftKey(today,-i);
        const e=d.log[k];
        const label = i===0 ? 'Hoy' : i===1 ? 'Ayer' : k.slice(5);
        rows.push('<div class="hora-item"><span class="hora-text">'+(e&&e.done?'✅':'⬜')+' <b>'+label+'</b> · '+(e&&e.mit?escapeHtml((e.mit||'').slice(0,48)):'<span class="su-57f9e3">sin MIT</span>')+'</span><span class="muted su-11a508">🍅 '+(e?(+e.pomodoros||0):0)+'</span></div>');
      }
      h.innerHTML=rows.join('');
    }
  }catch(e){}
}
function setupDisciplineDialog(){
  const btn=$('btnDiscipline'); if(btn) btn.onclick=()=>{
    renderDiscipline();
    const st=$('disciplineStatus'); if(st) st.textContent="";
    switchDiscTab('Hoy');
    $('disciplineDialog').showModal();
  };
  const ct=$('disciplineCloseTop'), cb=$('disciplineClose'); if(ct) ct.onclick=()=>$('disciplineDialog').close(); if(cb) cb.onclick=()=>$('disciplineDialog').close();
  const tabs=[['tabDiscHoy','Hoy'],['tabDiscTec','Tec'],['tabDiscHist','Hist']];
  tabs.forEach(([id])=>{ const b=$(id); if(b) b.onclick=()=>switchDiscTab(id.replace('tabDisc','')); });
  const save=$('disciplineSave'); if(save) save.onclick=()=>{
    const d=getDisciplineData(), t=discGetToday();
    t.mit=sanitizeText(($('disciplineMIT').value||'').trim(),120);
    d.mit=t.mit; d.if=sanitizeText(($('disciplineIf').value||'').trim(),120); d.then=sanitizeText(($('disciplineThen').value||'').trim(),120);
    t.done=!!($('disciplineDone')&&$('disciplineDone').checked);
    t.frog=!!($('disciplineFrog')&&$('disciplineFrog').checked);
    t.block=sanitizeText(($('discBlock').value||'').trim(),80);
    scheduleSave('Día guardado ✓');
    const st=$('disciplineStatus'); if(st) st.textContent = t.done ? "MIT cumplido 🔥 ¡racha "+discCalcStats().racha+"!" : "Día guardado ✓ — vuelve tras tu primer Pomodoro 🍅.";
    setTimeout(()=>{ if(st) st.textContent=""; },2800);
    renderDiscipline();
    try{ renderTodayView(); }catch(e){}
  };
  const dn=$('disciplineDone'); if(dn) dn.onchange=()=>{ discGetToday().done=dn.checked; scheduleSave(dn.checked?'MIT cumplido 🔥':'Guardado ✓'); renderDiscipline(); };
  const fr=$('disciplineFrog'); if(fr) fr.onchange=()=>{ discGetToday().frog=fr.checked; scheduleSave(); renderDiscipline(); };
  const pp=$('discPomoPlus'); if(pp) pp.onclick=()=>{ const t=discGetToday(); t.pomodoros=Math.min(24,(+t.pomodoros||0)+1); scheduleSave('🍅 '+t.pomodoros); renderDiscipline(); };
  const pm=$('discPomoMinus'); if(pm) pm.onclick=()=>{ const t=discGetToday(); t.pomodoros=Math.max(0,(+t.pomodoros||0)-1); scheduleSave(); renderDiscipline(); };
  const qa=$('discQuickAdd');
  const addQuick=()=>{ const inp=$('discQuickInput'); if(!inp) return; const v=sanitizeText((inp.value||'').trim(),80); if(!v) return; discGetToday().quick.push({txt:v,done:false}); inp.value=''; scheduleSave('Agregado ✓'); renderDiscipline(); };
  if(qa) qa.onclick=addQuick;
  const qi=$('discQuickInput'); if(qi) qi.onkeydown=(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addQuick(); } };
  const da=$('discDistAdd');
  const addDist=()=>{ const inp=$('discDistInput'); if(!inp) return; const v=sanitizeText((inp.value||'').trim(),80); if(!v) return; discGetToday().dist.push(v); inp.value=''; scheduleSave('Anotado 📥 sigue en foco'); renderDiscipline(); };
  if(da) da.onclick=addDist;
  const di=$('discDistInput'); if(di) di.onkeydown=(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addDist(); } };
  const ts=$('discToSchedule'); if(ts) ts.onclick=()=>{ try{ $('disciplineDialog').close(); $('btnSchedule').click(); }catch(e){} };
  const pomo=$('disciplineStartPomodoro'); if(pomo) pomo.onclick=()=>{
    try{ discGetToday(); scheduleSave(); }catch(e){}
    $('disciplineDialog').close();
    const h=$('countH'), m=$('countM'), s2=$('countS');
    if(h&&m&&s2){ h.value=0; m.value=25; s2.value=0; const ev=new Event('input',{bubbles:true}); h.dispatchEvent(ev); m.dispatchEvent(ev); }
    setTimeout(()=>{ setupTimerDialog(); $('timerDialog').showModal(); const cs=$('countStart'); if(cs) cs.click(); },200);
  };
  document.querySelectorAll('.discipline-try').forEach(b=>{
    b.onclick=()=>{
      $('disciplineDialog').close();
      const h=$('countH'), m=$('countM'), s2=$('countS');
      if(h&&m&&s2){ h.value=0; m.value=25; s2.value=0; }
      setTimeout(()=>{ setupTimerDialog(); $('timerDialog').showModal(); const cs=$('countStart'); if(cs) cs.click(); },200);
    };
  });
}
function switchDiscTab(which){
  const map={ Hoy:['tabDiscHoy','discTabHoy'], Tec:['tabDiscTec','discTabTec'], Hist:['tabDiscHist','discTabHist'] };
  Object.values(map).forEach(([bid,did])=>{ const b=$(bid), dv=$(did); if(b) b.classList.remove('btn-accent'); if(dv) dv.classList.add('hidden'); });
  const cur=map[which]||map.Hoy;
  const b=$(cur[0]), dv=$(cur[1]); if(b) b.classList.add('btn-accent'); if(dv) dv.classList.remove('hidden');
  if(which==='Hist'||which==='Hoy') renderDiscipline();
}
setTimeout(setupDisciplineDialog, 855);

// === RESPIRACIÓN (completa) ===
const BREATH_TECHNIQUES = [
  { id:'2-4', ico:'🌱', name:'2-4 Base', cat:'inicio', nivel:'Suave', ciclos:6, pattern:[{l:'Inhala',d:2},{l:'Exhala',d:4}], desc:'Puerta de entrada. Exhalación doble para avisar al cuerpo que no hay peligro.', benefit:'Principiantes', usar:'Primera vez, crisis leve, volver al cuerpo en 1 min.', pasos:['Siéntate recto, hombros sueltos.','Inhala por nariz 2 seg (guata se infla).','Exhala por boca 4 seg como soplando vela lento.','Repite sin pausas bruscas.'] },
  { id:'4-6', ico:'🍃', name:'4-6 Calma', cat:'calma', nivel:'Suave', ciclos:6, pattern:[{l:'Inhala',d:4},{l:'Exhala',d:6}], desc:'Simple y efectiva. La exhalación larga baja pulso y ansiedad en minutos.', benefit:'Ansiedad', usar:'Antes de prueba, discusión, micro-pausa de trabajo.', pasos:['Inhala nariz 4 seg.','Exhala boca entreabierta 6 seg.','Mantén ritmo parejo, sin aguantar aire.','6 ciclos ≈ 1 min.'] },
  { id:'3-3-6', ico:'🫧', name:'3-3-6 Ansiedad', cat:'calma', nivel:'Suave', ciclos:5, pattern:[{l:'Inhala',d:3},{l:'Retén',d:3},{l:'Exhala',d:6}], desc:'Retención corta + exhalación larga: corta el bucle mental.', benefit:'Ansiedad', usar:'Mente acelerada, angustia, pre-pánico.', pasos:['Inhala 3, retén 3 sin apretar.','Exhala 6 lento y completo.','Si mareas, vuelve a 4-6.'] },
  { id:'coherente', ico:'💗', name:'5.5 Coherente', cat:'calma', nivel:'Suave', ciclos:6, pattern:[{l:'Inhala',d:5},{l:'Exhala',d:5}], desc:'~6 respiraciones/min. Sincroniza corazón y cerebro. Base de coherencia cardíaca.', benefit:'Equilibrio', usar:'Estrés diario, hipertensión leve, 5 min mañana/tarde.', pasos:['Inhala 5 / exhala 5 por nariz.','Relaja mandíbula y vientre.','5 min seguidos = efecto real.'] },
  { id:'4-4-4-4', ico:'🟦', name:'4-4-4-4 Caja', cat:'foco', nivel:'Intermedio', ciclos:4, pattern:[{l:'Inhala',d:4},{l:'Retén',d:4},{l:'Exhala',d:4},{l:'Retén',d:4}], desc:'La de pilotos y Navy SEALs. Cuatro lados iguales para enfocar y estabilizar.', benefit:'Foco', usar:'Antes de competir, exponer, estudiar, manejar.', pasos:['Inhala 4 → retén 4 → exhala 4 → retén 4.','Visualiza un cuadrado.','4 vueltas ≈ 1 min.'] },
  { id:'5-5-5-5', ico:'🟨', name:'5-5-5-5 Caja lenta', cat:'foco', nivel:'Intermedio', ciclos:4, pattern:[{l:'Inhala',d:5},{l:'Retén',d:5},{l:'Exhala',d:5},{l:'Retén',d:5}], desc:'Versión lenta de la caja. Más control sin agitar.', benefit:'Foco lento', usar:'Estudio profundo, previo a reunión difícil.', pasos:['Igual que caja pero en 5.','Si cuesta retener, baja a 4-4-4-4.'] },
  { id:'6-3-6-3', ico:'⚖️', name:'6-3-6-3 Equilibrio', cat:'foco', nivel:'Intermedio', ciclos:4, pattern:[{l:'Inhala',d:6},{l:'Retén',d:3},{l:'Exhala',d:6},{l:'Retén',d:3}], desc:'Inhalación profunda con pausa corta: energía tranquila.', benefit:'Equilibrio', usar:'Media tarde, cambio de tarea, meditar.', pasos:['Inhala amplio 6, retén 3.','Exhala 6, vacío 3.','Aire a la guata, no a hombros.'] },
  { id:'4-4', ico:'🌊', name:'4-4 Pareja', cat:'inicio', nivel:'Suave', ciclos:6, pattern:[{l:'Inhala',d:4},{l:'Exhala',d:4}], desc:'Ritmo parejo para practicar en pareja o caminando.', benefit:'Regular', usar:'Caminata, acostado, con niños.', pasos:['Inhala 4 / exhala 4 por nariz.','Coordina con pasos si caminas.'] },
  { id:'4-7-8', ico:'🌙', name:'4-7-8 Sueño', cat:'sueno', nivel:'Intermedio', ciclos:4, pattern:[{l:'Inhala',d:4},{l:'Retén',d:7},{l:'Exhala',d:8}], desc:'La clásica de Weil para dormir. Retención larga + exhalación completa.', benefit:'Sueño/ansiedad', usar:'Acostado, luz apagada, 4 ciclos antes de dormir.', pasos:['Punta lengua tras dientes.','Inhala nariz 4.','Retén 7 sin tensión.','Exhala boca 8 con “shhh”.'] },
  { id:'7-11', ico:'🌌', name:'7-11 Profunda', cat:'sueno', nivel:'Avanzado', ciclos:4, pattern:[{l:'Inhala',d:7},{l:'Exhala',d:11}], desc:'Exhalación muy larga. Poderosa para soltar el día y bajar revoluciones.', benefit:'Profunda', usar:'Insomnio, noche ansiosa. Acostado.', pasos:['Inhala 7 amplio.','Exhala 11 vaciando todo.','Si mareas, baja a 4-6.'] },
  { id:'6-6', ico:'❤️', name:'6-6 Cardíaca', cat:'calma', nivel:'Intermedio', ciclos:6, pattern:[{l:'Inhala',d:6},{l:'Exhala',d:6}], desc:'Baja frecuencia cardíaca. Ideal con mano al pecho/vientre.', benefit:'Cardíaco', usar:'Palpitaciones por estrés, post-ejercicio.', pasos:['Inhala 6 / exhala 6 nasal.','Siente el pulso bajar.'] },
  { id:'suspiro', ico:'😮‍💨', name:'Suspiro fisiológico', cat:'calma', nivel:'Suave', ciclos:3, pattern:[{l:'Inhala',d:2},{l:'Inhala+',d:1},{l:'Exhala',d:6}], desc:'Doble inhalación corta + exhalación larga. Reset más rápido del sistema (Huberman).', benefit:'Reset 1 min', usar:'Llanto contenido, susto, tensión aguda.', pasos:['Inhala corto + otro “sorbo” de aire.','Exhala 6 lento todo.','1-3 veces basta.'] },
  { id:'alternada', ico:'👃', name:'Alterna (Nadi)', cat:'foco', nivel:'Intermedio', ciclos:6, pattern:[{l:'Izq inhala',d:4},{l:'Retén',d:4},{l:'Der exhala',d:4},{l:'Der inhala',d:4},{l:'Retén',d:4},{l:'Izq exhala',d:4}], desc:'Respiración yóguica por fosas alternas. Aclara y centra.', benefit:'Claridad', usar:'Niebla mental, antes de crear/estudiar.', pasos:['Tapa fosa derecha, inhala izq 4.','Tapa ambas, retén 4.','Suelta derecha, exhala 4. Inhala derecha 4, retén, exhala izq. Eso es 1 ciclo.'] },
  { id:'energia', ico:'⚡', name:'3-1-3 Energía', cat:'energia', nivel:'Intermedio', ciclos:6, pattern:[{l:'Inhala',d:3},{l:'Retén',d:1},{l:'Exhala',d:3}], desc:'Ritmo corto y rítmico sentado erguido para despertar sin café.', benefit:'Despertar', usar:'Mañana, bajón 15:00. No de noche.', pasos:['Sentado erguido. Inhala 3 enérgico.','Exhala 3 activo.','6 ciclos + estirar.'] }
];
const BREATH_CATS = { todos:'🌬️ Todas', inicio:'🌱 Inicio', calma:'🍃 Calma', sueno:'🌙 Sueño', foco:'🎯 Foco', energia:'⚡ Energía' };
let breathSelected = BREATH_TECHNIQUES[0];
let breathTimer=null, breathPhaseIdx=0, breathSecLeft=0, breathRunning=false;
let breathFilter='todos', breathTargetCycles=4, breathDoneCycles=0, breathElapsed=0, breathSoundOn=true, breathSessionStart=null;
function breathCycleSeconds(t){ return t.pattern.reduce((a,p)=>a+p.d,0); }
function breathBeep(freq, dur){
  if(!breathSoundOn) return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return;
    const ctx=new Ctx(); const o=ctx.createOscillator(); const g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value=freq||440; o.type='sine';
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+(dur||0.18));
    o.start(); o.stop(ctx.currentTime+(dur||0.18)+0.02);
    setTimeout(()=>{ try{ctx.close();}catch(e){} }, 600);
  }catch(e){}
}
function getBreathLog(){ try{ const u=(typeof userData==='function')? userData():null; if(u){ if(!Array.isArray(u.breathLog)) u.breathLog=[]; return u.breathLog; } }catch(e){} try{ const r=localStorage.getItem('cal13-breathLogV1'); return r? JSON.parse(r):[]; }catch(e){ return []; } }
function saveBreathLog(){ try{ if(typeof scheduleSave==='function') scheduleSave('Respiración guardada ✓'); else localStorage.setItem('cal13-breathLogV1', JSON.stringify(getBreathLog())); }catch(e){} }
function breathTodayKey(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function renderBreathGrid(){
  const g=$('breathGrid'); if(!g) return;
  const list=BREATH_TECHNIQUES.filter(t=> breathFilter==='todos' || t.cat===breathFilter);
  if(!list.length){ g.innerHTML='<p class="muted">Sin técnicas en este filtro.</p>'; return; }
  g.innerHTML=list.map(t=>`<div class="breath-card ${t.id===breathSelected.id?'sel':''}" data-id="${t.id}" role="button" tabindex="0"><b>${t.ico||''} ${escapeHtml(t.name)}</b><br><span class="muted su-0d5be0">${t.pattern.map(p=>p.l+' '+p.d).join(' → ')}</span><br><span class="chip su-42b0b7">${BREATH_CATS[t.cat]||t.cat} · ${escapeHtml(t.nivel||'')}</span><br><span class="muted su-11a508">${escapeHtml(t.desc)}</span></div>`).join('');
  g.querySelectorAll('.breath-card').forEach(el=>{
    const pick=()=>{ breathStop(true); breathSelected=BREATH_TECHNIQUES.find(x=>x.id===el.dataset.id)||breathSelected; breathTargetCycles=breathSelected.ciclos||4; const cs=$('breathCycles'); if(cs) cs.value=String(breathTargetCycles); renderBreathGrid(); updateBreathHeader(); try{ const pl=$('breathPlayer'); if(pl) pl.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){} };
    el.onclick=pick; el.onkeydown=(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); pick(); } };
  });
}
function updateBreathHeader(){
  const t=breathSelected; if(!t || !$('breathTitle')) return;
  $('breathTitle').textContent=(t.ico? t.ico+' ':'')+t.name+' · Respiración';
  $('breathDesc').textContent=t.desc+' — '+t.benefit;
  $('breathPattern').textContent=t.pattern.map(p=>p.l+' '+p.d).join(' → ');
  const badge=$('breathBadges'); if(badge) badge.innerHTML=`<span class="chip">${BREATH_CATS[t.cat]||t.cat}</span> <span class="chip">Nivel ${escapeHtml(t.nivel||'—')}</span> <span class="chip">~${breathCycleSeconds(t)}s/ciclo</span>`;
  const st=$('breathSteps'); if(st) st.innerHTML=(t.pasos||[]).map((p,i)=>`<li><b>${i+1}.</b> ${escapeHtml(p)}</li>`).join('');
  const wn=$('breathWhen'); if(wn) wn.textContent='👉 Cuándo: '+t.usar;
  const te=$('breathTimeEst'); if(te) te.textContent='⏱ '+breathTargetCycles+' ciclos ≈ '+Math.round(breathCycleSeconds(t)*breathTargetCycles/60*10)/10+' min';
  const cl=$('breathCycleLabel'); if(cl) cl.textContent=breathRunning? ('Ciclo '+(Math.min(breathDoneCycles+1,breathTargetCycles))+'/'+breathTargetCycles) : ('0/'+breathTargetCycles+' ciclos');
  const pb=$('breathProgress'); if(pb) pb.style.width=(breathTargetCycles? Math.round(breathDoneCycles/breathTargetCycles*100):0)+'%';
}
function breathPaint(){
  const phase=breathSelected.pattern[breathPhaseIdx]; if(!phase) return;
  $('breathPhase').textContent=phase.l;
  $('breathCount').textContent=breathSecLeft;
  const circle=$('breathCircle');
  if(circle){
    circle.className='breath-circle '+((phase.l||'').toLowerCase().indexOf('inhala')===0||phase.l==='Inhala+'?'inhale': (phase.l||'').toLowerCase().indexOf('exhala')===0?'exhale':'hold');
    circle.style.transitionDuration=Math.max(0.4,Math.min(6,breathSecLeft))+ 's';
  }
}
function breathTick(){
  breathPaint();
  breathElapsed++;
  breathSecLeft--;
  if(breathSecLeft<=0){
    const wasLast=breathPhaseIdx===breathSelected.pattern.length-1;
    breathPhaseIdx=(breathPhaseIdx+1)%breathSelected.pattern.length;
    breathSecLeft=breathSelected.pattern[breathPhaseIdx].d;
    breathBeep(breathPhaseIdx===0? 660: 440, 0.15);
    if(breathPhaseIdx===0 && wasLast){
      breathDoneCycles++;
      const cl=$('breathCycleLabel'); if(cl) cl.textContent='Ciclo '+Math.min(breathDoneCycles,breathTargetCycles)+'/'+breathTargetCycles;
      const pb=$('breathProgress'); if(pb) pb.style.width=Math.round(Math.min(breathDoneCycles,breathTargetCycles)/breathTargetCycles*100)+'%';
      if(breathDoneCycles>=breathTargetCycles){ breathCompleteSession(); return; }
    }
  }
}
function breathStart(){
  if(breathRunning) return;
  breathRunning=true; breathPhaseIdx=0; breathSecLeft=breathSelected.pattern[0].d; breathDoneCycles=0; breathElapsed=0; breathSessionStart=Date.now();
  updateBreathHeader(); breathPaint(); breathBeep(520,0.2);
  clearInterval(breathTimer); breathTimer=setInterval(breathTick,1000);
  const s=$('breathStart'); if(s) s.classList.add('btn-accent');
}
function breathStop(silent){
  breathRunning=false; clearInterval(breathTimer); breathTimer=null;
  const s=$('breathStart'); if(s) s.classList.remove('btn-accent');
  if(!silent){ if($('breathPhase')) $('breathPhase').textContent='Pausa'; }
}
function breathReset(){
  breathStop(true); breathPhaseIdx=0; breathSecLeft=0; breathDoneCycles=0; breathElapsed=0;
  if($('breathPhase')) $('breathPhase').textContent='Listo';
  if($('breathCount')) $('breathCount').textContent='—';
  const c=$('breathCircle'); if(c){ c.className='breath-circle'; c.style.transitionDuration='1s'; }
  updateBreathHeader();
}
function breathCompleteSession(auto){
  breathStop(true);
  if($('breathPhase')) $('breathPhase').textContent='¡Bien! ✓';
  try{ breathBeep(880,0.35); setTimeout(()=>breathBeep(660,0.35),220); if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){}
  try{
    const log=getBreathLog();
    log.push({ ts:Date.now(), tech:breathSelected.id, name:breathSelected.name, cycles:breathTargetCycles, secs:breathElapsed||breathCycleSeconds(breathSelected)*breathTargetCycles });
    while(log.length>300) log.shift();
    saveBreathLog();
  }catch(e){}
  renderBreathStats(); renderBreathLog();
  const cl=$('breathCycleLabel'); if(cl) cl.textContent=breathTargetCycles+'/'+breathTargetCycles+' ciclos ✓';
  const pb=$('breathProgress'); if(pb) pb.style.width='100%';
  if(auto!==false){ setTimeout(()=>{ try{ alert('🌬️ Sesión completa: '+breathSelected.name+' × '+breathTargetCycles+' ciclos. Quedó en tu registro.'); }catch(e){} },250); }
}
function renderBreathStats(){
  const box=$('breathStats'); if(!box) return;
  const log=getBreathLog(); const today=breathTodayKey();
  const d=new Date(); const weekAgo=Date.now()-7*864e5;
  const tToday=log.filter(x=>breathTodayKey(new Date(x.ts))===today);
  const tWeek=log.filter(x=>x.ts>=weekAgo);
  let streak=0; const days=new Set(log.map(x=>breathTodayKey(new Date(x.ts))));
  const cur=new Date();
  for(let i=0;i<60;i++){ const k=breathTodayKey(cur); if(days.has(k)){ streak++; cur.setDate(cur.getDate()-1); } else if(i===0){ cur.setDate(cur.getDate()-1); continue; } else break; }
  const mins=Math.round(log.reduce((a,x)=>a+(x.secs||0),0)/60);
  box.innerHTML=`<div class="si-grid"><div class="si-card"><h4>📅 Hoy</h4><p><b>${tToday.length}</b> sesiones · ${tToday.reduce((a,x)=>a+(x.cycles||0),0)} ciclos</p></div><div class="si-card"><h4>📈 7 días</h4><p><b>${tWeek.length}</b> sesiones</p></div><div class="si-card"><h4>🔥 Racha</h4><p><b>${streak}</b> día(s)</p></div><div class="si-card"><h4>⏱ Total</h4><p><b>${log.length}</b> sesiones · ${mins} min</p></div></div>`;
}
function renderBreathLog(){
  const box=$('breathLogBox'); if(!box) return;
  const log=[...getBreathLog()].reverse().slice(0,20);
  if(!log.length){ box.innerHTML='<p class="muted">Sin sesiones aún. Completa tu primera arriba y vuelve aquí 🌬️</p>'; return; }
  box.innerHTML=log.map(x=>{
    const t=BREATH_TECHNIQUES.find(t=>t.id===x.tech);
    const f=new Date(x.ts);
    return `<div class="habit-item"><div class="habit-head"><b class="su-e39eba">${escapeHtml(t? (t.ico+' '+t.name):(x.name||x.tech))}</b><span class="muted su-11a508">${f.toLocaleString('es-CL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span></div><div class="su-707c92">${x.cycles} ciclos · ~${Math.round((x.secs||0)/60*10)/10} min</div></div>`;
  }).join('');
}
function breathTab(which){
  const p=$('breathPracticePanel'), l=$('breathLearnPanel'), r=$('breathLogPanel');
  const tp=$('breathTabPractice'), tl=$('breathTabLearn'), tr=$('breathTabLog');
  if(!p) return;
  p.classList.toggle('hidden', which!=='p'); l.classList.toggle('hidden', which!=='l'); r.classList.toggle('hidden', which!=='r');
  if(tp) tp.classList.toggle('btn-accent', which==='p');
  if(tl) tl.classList.toggle('btn-accent', which==='l');
  if(tr) tr.classList.toggle('btn-accent', which==='r');
  if(which==='r'){ renderBreathStats(); renderBreathLog(); }
}
function setupBreathDialog(){
  const btn=$('btnBreath'); if(btn) btn.onclick=()=>{ renderBreathGrid(); updateBreathHeader(); renderBreathStats(); renderBreathLog(); breathTab('p'); try{ $('breathDialog').showModal(); }catch(e){} try{ const d=$('breathDialog'); if(d) d.scrollTop=0; }catch(e){} };
  const ct=$('breathCloseTop'), cb=$('breathClose'); if(ct) ct.onclick=()=>{ breathStop(true); $('breathDialog').close(); }; if(cb) cb.onclick=()=>{ breathStop(true); $('breathDialog').close(); };
  const tp=$('breathTabPractice'), tl=$('breathTabLearn'), tr=$('breathTabLog');
  if(tp) tp.onclick=()=>breathTab('p'); if(tl) tl.onclick=()=>breathTab('l'); if(tr) tr.onclick=()=>breathTab('r');
  const f=$('breathFilter'); if(f) f.onchange=()=>{ breathFilter=f.value; renderBreathGrid(); };
  const cs=$('breathCycles'); if(cs) cs.onchange=()=>{ breathTargetCycles=parseInt(cs.value,10)||4; breathReset(); };
  const sn=$('breathSound'); if(sn) sn.onchange=()=>{ breathSoundOn=sn.checked; };
  renderBreathGrid(); updateBreathHeader();
  const start=$('breathStart'), pause=$('breathPause'), reset=$('breathReset');
  if(start) start.onclick=()=>breathStart();
  if(pause) pause.onclick=()=>breathStop();
  if(reset) reset.onclick=()=>breathReset();
  const done=$('breathDone'); if(done) done.onclick=()=>{ if(breathDoneCycles>0||breathElapsed>10){ breathCompleteSession(); breathReset(); } else { try{ const log=getBreathLog(); log.push({ ts:Date.now(), tech:breathSelected.id, name:breathSelected.name, cycles:breathTargetCycles, secs:breathCycleSeconds(breathSelected)*breathTargetCycles }); saveBreathLog(); renderBreathStats(); renderBreathLog(); alert('🌬️ Marcada como hecha ✓'); }catch(e){} } };
  const ag=$('breathAgendar'); if(ag) ag.onclick=()=>{
    try{
      const k=(typeof cal!=='undefined' && cal.fmtKey)? cal.fmtKey.format(new Date()) : breathTodayKey();
      let ref=null; try{ ref=(typeof lunaMapForKey==='function')? lunaMapForKey(k):null; }catch(e){}
      if(!ref||ref.luna==='dft'){ alert('Hoy está fuera del ciclo visible; practica igual con el temporizador.'); return; }
      const cell=dayCell(ref.luna, ref.diaN); if(!Array.isArray(cell.agenda)) cell.agenda=[];
      cell.agenda.push({ id:'br'+Date.now(), hour:8, minute:0, time:'08:00', text:'🌬️ Respiración '+breathSelected.name+' × '+breathTargetCycles, notify:false, notified:false });
      scheduleSave('Agendado ✓'); alert('Agendado hoy 08:00 🌬️ (puedes cambiar la hora en el día)');
    }catch(e){ alert('No se pudo agendar'); }
  };
  const sh=$('breathShare'); if(sh) sh.onclick=async()=>{
    const log=getBreathLog(); const week=log.filter(x=>x.ts>=Date.now()-7*864e5);
    const txt='🌬️ Mi respiración (7 días)\nSesiones: '+week.length+'\n'+week.slice(-7).map(x=>{ const d=new Date(x.ts); return '· '+d.toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit'})+' '+(x.name||x.tech)+' × '+x.cycles; }).join('\n');
    await shareText('Mi respiración', txt);
  };
  const cl=$('breathClear'); if(cl) cl.onclick=()=>{ if(!confirm('¿Borrar tu registro de respiración?')) return; try{ const u=userData(); u.breathLog=[]; scheduleSave(); }catch(e){ try{localStorage.removeItem('cal13-breathLogV1');}catch(_){} } renderBreathStats(); renderBreathLog(); };
  const goH=$('breathGoHabits'); if(goH) goH.onclick=()=>{ try{ $('breathDialog').close(); }catch(e){} setTimeout(()=>{ const b=$('btnHabits')||$('btnHabitos'); if(b) b.click(); },150); };
}

// === HORARIO CLASES ===
function getScheduleData(){
  const u=userData();
  if(!u.schedule) u.schedule={ items:[] };
  if(!Array.isArray(u.schedule.items)) u.schedule.items=[];
  return u.schedule;
}
let scheduleEditingId=null;
function renderScheduleTodayBox(){
  const box=$('scheduleTodayBox'); if(!box) return;
  const d=getScheduleData();
  const today=new Date().getDay();
  const todays=d.items.filter(x=> parseInt(x.day)===today).sort((a,b)=> a.start.localeCompare(b.start));
  if(!todays.length) box.innerHTML='<p class="muted">Hoy no tienes clases. ¡Aprovecha la luna!</p>';
  else box.innerHTML='<h4 class="su-e39eba">Hoy — '+['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][today]+'</h4>' + todays.map(it=>`<div class="mens-hist-item" style="border-left:3px solid ${it.color}"><span><b>${escapeHtml(it.subject)}</b> ${it.start}–${it.end} · ${escapeHtml(it.place||'')}</span></div>`).join('');
}
function renderScheduleWeekGrid(){
  const box=$('scheduleWeekGrid'); if(!box) return;
  const d=getScheduleData();
  const days=[['Domingo',0],['Lunes',1],['Martes',2],['Miércoles',3],['Jueves',4],['Viernes',5],['Sábado',6]];
  let html='';
  days.forEach(([name, idx])=>{
    const items=d.items.filter(x=> parseInt(x.day)===idx).sort((a,b)=> a.start.localeCompare(b.start));
    const isToday=new Date().getDay()===idx;
    html+=`<div class="schedule-day ${isToday?'schedule-today':''}"><b>${name}</b>${items.length? items.map(it=>`<div class="schedule-block" style="background:${it.color};border:1px solid ${it.color}">${escapeHtml(it.subject)}<br><span class="su-0d5be0">${it.start}–${it.end}</span></div>`).join('') : '<p class="muted su-0d5be0">—</p>'}</div>`;
  });
  box.innerHTML=html;
}
function renderScheduleList(){
  const box=$('scheduleList'); if(!box) return;
  const d=getScheduleData();
  if(!d.items.length){ box.innerHTML='<p class="muted">Sin clases aún. Agrega tu primera arriba.</p>'; return; }
  const sorted=[...d.items].sort((a,b)=> parseInt(a.day)-parseInt(b.day) || a.start.localeCompare(b.start));
  box.innerHTML=sorted.map(it=>`<div class="habit-item su-13313b"><span><b style="color:${it.color}">●</b> ${escapeHtml(it.subject)} — ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][it.day]} ${it.start}–${it.end} ${it.place? '· '+escapeHtml(it.place):''}</span><span class="su-49cd09"><button data-id="${it.id}" class="btn sched-edit su-337714">✏️</button><button data-id="${it.id}" class="btn sched-del su-fd834a">✕</button></span></div>`).join('');
  box.querySelectorAll('.sched-edit').forEach(b=> b.onclick=()=>{
    const it=d.items.find(x=>x.id===b.dataset.id); if(!it) return;
    scheduleEditingId=it.id;
    $('schedSubject').value=it.subject; $('schedDay').value=it.day; $('schedStart').value=it.start; $('schedEnd').value=it.end; $('schedColor').value=it.color; $('schedPlace').value=it.place||'';
    $('schedAdd').classList.add('hidden'); $('schedUpdate').classList.remove('hidden'); $('schedCancel').classList.remove('hidden');
  });
  box.querySelectorAll('.sched-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar clase?')) return;
    const id=b.dataset.id; const dd=getScheduleData(); dd.items=dd.items.filter(x=>x.id!==id); scheduleSave(); renderScheduleList(); renderScheduleWeekGrid(); renderScheduleTodayBox();
  });
}
function setupScheduleDialog(){
  const btn=$('btnSchedule'); if(btn) btn.onclick=()=>{ renderScheduleTodayBox(); renderScheduleWeekGrid(); renderScheduleList(); $('scheduleDialog').showModal(); };
  const ct=$('scheduleCloseTop'), cb=$('scheduleClose'); if(ct) ct.onclick=()=>$('scheduleDialog').close(); if(cb) cb.onclick=()=>$('scheduleDialog').close();
  const add=$('schedAdd'); if(add) add.onclick=()=>{
    const subject=$('schedSubject').value.trim(); if(!subject) return alert('Escribe asignatura');
    const it={ id:'sc'+Date.now(), subject, day:$('schedDay').value, start:$('schedStart').value, end:$('schedEnd').value, color:$('schedColor').value, place:$('schedPlace').value.trim() };
    if(it.start>=it.end) return alert('Hora inicio debe ser antes que fin');
    getScheduleData().items.push(it); scheduleSave(); $('schedSubject').value=''; renderScheduleList(); renderScheduleWeekGrid(); renderScheduleTodayBox();
  };
  const upd=$('schedUpdate'); if(upd) upd.onclick=()=>{
    const it=getScheduleData().items.find(x=>x.id===scheduleEditingId); if(!it) return;
    it.subject=$('schedSubject').value.trim(); it.day=$('schedDay').value; it.start=$('schedStart').value; it.end=$('schedEnd').value; it.color=$('schedColor').value; it.place=$('schedPlace').value.trim();
    scheduleSave(); scheduleEditingId=null; $('schedAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('schedCancel').classList.add('hidden'); $('schedSubject').value=''; renderScheduleList(); renderScheduleWeekGrid(); renderScheduleTodayBox();
  };
  const cancel=$('schedCancel'); if(cancel) cancel.onclick=()=>{ scheduleEditingId=null; $('schedAdd').classList.remove('hidden'); $('schedUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('schedSubject').value=''; };
}
setTimeout(setupBreathDialog, 860);
setTimeout(setupScheduleDialog, 865);
// === 🌅 MI DÍA — RUTINAS POR HORARIO (mañana / tarde / noche) ===
// Bloques editables por día, vinculados a hábitos (✅) y compromisos (🕐 + 📚).
// Storage por usuario: userData().rutinas = { plantilla:{manana,tarde,noche}, dias:{ [key]:{ manana:{texto,habitos[],done}, ... } } }
const RUTINA_SLOTS = [
  { id:'manana', ico:'🌅', nombre:'Mañana', rango:'06:00–12:00', h0:6, h1:12, horaSugerida:'08:00', ejemplo:'ej: agua + luz natural, caminar 15 min, MIT' },
  { id:'tarde', ico:'☀️', nombre:'Tarde', rango:'12:00–20:00', h0:12, h1:20, horaSugerida:'15:00', ejemplo:'ej: trabajo/foco 25′ + pausa, almuerzo sin pantalla' },
  { id:'noche', ico:'🌙', nombre:'Noche', rango:'20:00–06:00', h0:20, h1:30, horaSugerida:'21:00', ejemplo:'ej: cena liviana, gratitud, preparar mañana, dormir' }
];
function getRutinaData(){
  const u=userData();
  if(!u.rutinas || typeof u.rutinas!=='object') u.rutinas={ plantilla:{ manana:'', tarde:'', noche:'' }, dias:{} };
  const r=u.rutinas;
  if(!r.plantilla || typeof r.plantilla!=='object') r.plantilla={ manana:'', tarde:'', noche:'' };
  ['manana','tarde','noche'].forEach(k=>{ if(typeof r.plantilla[k]!=='string') r.plantilla[k]=''; });
  if(!r.dias || typeof r.dias!=='object') r.dias={};
  return r;
}
function getRutinaDia(dateKey){
  const r=getRutinaData();
  if(!r.dias[dateKey] || typeof r.dias[dateKey]!=='object') r.dias[dateKey]={};
  const d=r.dias[dateKey];
  RUTINA_SLOTS.forEach(s=>{
    if(!d[s.id] || typeof d[s.id]!=='object') d[s.id]={ texto:'', habitos:[], done:false };
    if(typeof d[s.id].texto!=='string') d[s.id].texto='';
    if(!Array.isArray(d[s.id].habitos)) d[s.id].habitos=[];
    d[s.id].habitos=d[s.id].habitos.filter(id=>typeof id==='string');
    if(typeof d[s.id].done!=='boolean') d[s.id].done=false;
  });
  return d;
}
function rutinaHoraNum(hhmm){
  const m=String(hhmm||'').match(/^(\d{1,2}):(\d{2})/);
  if(!m) return null;
  return (+m[1]) + (+m[2])/60;
}
function rutinaSlotForTime(hhmm){
  const n=rutinaHoraNum(hhmm);
  if(n===null) return null;
  if(n>=6 && n<12) return 'manana';
  if(n>=12 && n<20) return 'tarde';
  return 'noche';
}
function rutinaCompromisosPorSlot(agenda, slotId){
  return (agenda||[]).filter(a=>{
    const t=(a.time && /^\d{2}:\d{2}$/.test(a.time)) ? a.time : (String(a.hour||0).padStart(2,'0')+':'+String(a.minute||0).padStart(2,'0'));
    return rutinaSlotForTime(t)===slotId;
  }).sort((a,b)=>{
    const ta=(a.time||''), tb=(b.time||'');
    return String(ta).localeCompare(String(tb));
  });
}
function rutinaHorarioPorSlot(items, weekday, slotId){
  const s=RUTINA_SLOTS.find(x=>x.id===slotId);
  if(!s) return [];
  return (items||[]).filter(x=> parseInt(x.day)===weekday).filter(x=>{
    const n=rutinaHoraNum(x.start);
    if(n===null) return false;
    if(slotId==='noche') return (n>=20 || n<6);
    return n>=s.h0 && n<s.h1;
  }).sort((a,b)=> String(a.start).localeCompare(String(b.start)));
}
function rutinaProgresoDia(dateKey){
  const d=getRutinaDia(dateKey);
  let done=0;
  RUTINA_SLOTS.forEach(s=>{ if(d[s.id] && d[s.id].done) done++; });
  return { done, total:RUTINA_SLOTS.length };
}
function setupRutinasBtn(){
  const btn=$('btnRutinas'); if(!btn || btn.dataset.rutBound) return;
  btn.dataset.rutBound='1';
  // Entrada principal: diálogo propio (funciona en PC y móvil).
  // La tarjeta de ◉ Hoy se mantiene como resumen en el celular.
  btn.onclick=()=>{
    try{
      let d=$('rutinasDialog');
      if(!d && window.cal13tpl && typeof window.cal13tpl.inyectar==='function'){ try{ d=window.cal13tpl.inyectar('rutinasDialog'); }catch(e){} }
      if(d){ renderRutinasDialog(); d.showModal(); return; }
    }catch(e){}
    // Respaldo si el diálogo aún no existe: ir a la tarjeta de Hoy.
    try{
      if(typeof isMobileWidth==='function' && isMobileWidth()){ showMobileView('hoy'); }
      else if(typeof renderCurrentView==='function'){ viewMode='hoy'; renderCurrentView(); }
    }catch(e2){}
    setTimeout(()=>{ try{ const c=$('todayRutinasCard'); if(c) c.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e3){} }, 150);
  };
}
setTimeout(setupRutinasBtn, 870);
function rutinasTodayCtx(){
  // Contexto del día de hoy compartido por diálogo y tarjeta Hoy.
  let info=null;
  try{ info=(typeof todayInfo==='function'?todayInfo():null); }catch(e){ info=null; }
  const now=new Date();
  let key='';
  try{ key=cal.fmtKey.format(now); }catch(e){ key=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'); }
  const isDFT=!!(info && info.luna==='dft');
  const lunaN=(!info||isDFT)?null:info.luna, diaN=(!info||isDFT)?null:info.diaN;
  let agenda=[];
  try{ if(!isDFT && lunaN && diaN) agenda=[...dayCell(lunaN,diaN).agenda]; }catch(e){ agenda=[]; }
  let sched=[], wd=now.getDay();
  try{ const sd=getScheduleData(); sched=(sd&&sd.items)||[]; }catch(e){ sched=[]; }
  let habs=[];
  try{ const hd=getHabitData(); habs=(hd&&hd.list)||[]; }catch(e){ habs=[]; }
  return { info, key, isDFT, lunaN, diaN, agenda, sched, wd, habs };
}
function rutinaAgendaTime(a){
  if(a && a.time && /^\d{2}:\d{2}$/.test(a.time)) return a.time;
  return String((a&&a.hour)||0).padStart(2,'0')+':'+String((a&&a.minute)||0).padStart(2,'0');
}
function rutinasAddCompromiso(ctx, slotId, timeStr, text, notify){
  if(ctx.isDFT || !ctx.lunaN || !ctx.diaN) return 'Este día es de cierre: los compromisos viven en los días de luna.';
  const m=String(timeStr||'').match(/^(\d{1,2}):(\d{2})/);
  if(!m) return 'Elige una hora válida.';
  const hh=+m[1], mm=+m[2];
  if(hh<0||hh>23||mm<0||mm>59) return 'Hora inválida (00:00 a 23:59).';
  const clean=sanitizeText(String(text||'').trim(),80);
  if(!clean) return 'Escribe el compromiso.';
  if(notify){ try{ if(typeof Notification!=='undefined'&&Notification.permission!=='granted'&&Notification.requestPermission) Notification.requestPermission(); }catch(e){} }
  try{
    const c=dayCell(ctx.lunaN,ctx.diaN);
    if(!Array.isArray(c.agenda)) c.agenda=[];
    const ts=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    c.agenda.push({id:'a'+Date.now()+Math.random().toString(36).slice(2,4), hour:hh, minute:mm, time:ts, text:clean, notify:!!notify, notified:false});
    scheduleSave('Compromiso guardado ✓');
  }catch(e){ return 'No se pudo guardar.'; }
  return '';
}
function renderRutinasDialog(){
  const box=$('rutinasBox'); if(!box) return;
  const ctx=rutinasTodayCtx();
  const dia=getRutinaDia(ctx.key);
  try{
    const f=$('rutinasFecha');
    if(f){
      let lbl='';
      try{ lbl=cal.weekdayName(Date.now())+' '+cal.fmtFull.format(new Date()); }catch(e){ lbl=ctx.key; }
      f.textContent='◉ Hoy · '+lbl;
    }
    const prog=rutinaProgresoDia(ctx.key);
    const pb=$('rutinasProg');
    if(pb) pb.innerHTML='<p class="muted su-11a508">✅ '+prog.done+'/'+prog.total+' bloques completados hoy · 💡 lo que escribas aquí también alimenta tu tarjeta de Hoy en el celular.</p>';
  }catch(e){}
  box.innerHTML='';
  if(!ctx.info){ box.innerHTML='<p class="muted">No se encontró el día de hoy en el ciclo.</p>'; return; }
  RUTINA_SLOTS.forEach(function(slot){
    const st=dia[slot.id]||{ texto:'', habitos:[], done:false };
    const vinculados=(st.habitos||[]).map(function(id){ return ctx.habs.find(function(h){return h.id===id;}); }).filter(Boolean);
    let hechos=0;
    vinculados.forEach(function(h){ try{ if(habitIsDone(ctx.key,h.id)) hechos++; }catch(e){} });
    const compSlot=rutinaCompromisosPorSlot(ctx.agenda, slot.id);
    const horSlot=rutinaHorarioPorSlot(ctx.sched, ctx.wd, slot.id);
    let plantillaTxt='';
    try{ plantillaTxt=(getRutinaData().plantilla[slot.id]||''); }catch(e){}
    const noVinc=ctx.habs.filter(function(h){ return (st.habitos||[]).indexOf(h.id)<0; });
    const wrap=document.createElement('div');
    wrap.className='rutina-slot'+(st.done?' done':'');
    wrap.innerHTML=
      '<div class="rutina-head"><span class="rutina-title">'+slot.ico+' '+slot.nombre+' <span class="muted su-0d5be0">'+slot.rango+'</span></span>'
      +'<label class="check-row rutina-done"><input type="checkbox" data-rd-done="'+slot.id+'" '+(st.done?'checked':'')+'> Hecho</label></div>'
      +'<textarea class="today-note rutina-text" data-rd-texto="'+slot.id+'" rows="2" maxlength="500" placeholder="'+escapeHtml((plantillaTxt||slot.ejemplo||'').slice(0,80))+'"></textarea>'
      +'<div class="rutina-sec"><b>✅ Hábitos vinculados ('+hechos+'/'+vinculados.length+')</b><div class="rutina-hablist">'
      +(vinculados.length? vinculados.map(function(h){
          let done=false; try{ done=habitIsDone(ctx.key,h.id); }catch(e){ done=false; }
          return '<label class="habit-today-item mini '+(done?'done':'')+'" style="border-color:'+h.color+'55"><input type="checkbox" data-rd-hab="'+slot.id+'|'+h.id+'" '+(done?'checked':'')+'><span class="habit-icon" style="background:'+h.color+'22;color:'+h.color+'">'+escapeHtml(h.icono||'✓')+'</span><span>'+escapeHtml(h.nombre)+'</span><button type="button" class="btn btn-icon rutina-unlink" data-rd-unlink="'+slot.id+'|'+h.id+'" title="Desvincular">✕</button></label>';
        }).join('') : '<span class="muted su-0d5be0">Sin hábitos vinculados. Agrega uno abajo 👇</span>')
      +'</div>'
      +(noVinc.length? '<div class="today-add"><select data-rd-addsel="'+slot.id+'" aria-label="Hábito a vincular">'+noVinc.map(function(h){return '<option value="'+h.id+'">'+escapeHtml((h.icono||'✓')+' '+h.nombre)+'</option>';}).join('')+'</select><button type="button" class="btn su-30e741" data-rd-add="'+slot.id+'">+ Vincular</button></div>'
        : (ctx.habs.length? '<p class="muted su-0d5be0">Todos tus hábitos ya están vinculados aquí.</p>' : '<p class="muted su-0d5be0">Crea hábitos en ✅ Hábitos para vincularlos.</p>'))
      +'</div>'
      +'<div class="rutina-sec"><b>🕐 Compromisos '+slot.nombre.toLowerCase()+' ('+compSlot.length+(horSlot.length?' + 📚 '+horSlot.length:'')+')</b><div class="rutina-complist">'
      +((compSlot.length||horSlot.length)?
          compSlot.map(function(a){ return '<div class="hora-item"><span class="su-11a508">🕐 <b>'+escapeHtml(rutinaAgendaTime(a))+'</b> '+escapeHtml(a.text||'')+'</span></div>'; }).join('')
          + horSlot.map(function(it){ return '<div class="hora-item"><span class="su-11a508">📚 <b>'+escapeHtml(it.subject)+'</b> '+escapeHtml(it.start)+'–'+escapeHtml(it.end)+(it.place?' · '+escapeHtml(it.place):'')+'</span></div>'; }).join('')
        : '<span class="muted su-0d5be0">Sin compromisos en este horario.</span>')
      +'</div>'
      +(ctx.isDFT? '<p class="muted su-0d5be0">✷ Día Fuera del Tiempo: día de cierre, sin compromisos por hora.</p>'
        : '<div class="today-add"><input type="time" data-rd-hora="'+slot.id+'" value="'+slot.horaSugerida+'" step="60" aria-label="Hora"><input type="text" data-rd-txt="'+slot.id+'" placeholder="Compromiso..." maxlength="80"><label class="check-row su-988f60"><input type="checkbox" data-rd-notify="'+slot.id+'"> 🔔</label><button type="button" class="btn btn-accent su-30e741" data-rd-compadd="'+slot.id+'">+ Agregar</button></div>')
      +'</div>';
    const ta=wrap.querySelector('[data-rd-texto]');
    if(ta){
      ta.value=st.texto||'';
      ta.addEventListener('input', function(){
        try{ getRutinaDia(ctx.key)[slot.id].texto=sanitizeText(ta.value,500); scheduleSave(); }catch(e){}
      });
    }
    box.appendChild(wrap);
  });
  box.querySelectorAll('[data-rd-done]').forEach(function(cb){
    cb.onchange=function(){
      try{ getRutinaDia(ctx.key)[cb.dataset.rdDone].done=cb.checked; scheduleSave(cb.checked?'Bloque completado ✓':'Guardado ✓'); }catch(e){}
      const w=cb.closest('.rutina-slot'); if(w){ if(cb.checked) w.classList.add('done'); else w.classList.remove('done'); }
      try{ const prog=rutinaProgresoDia(ctx.key); const pb=$('rutinasProg'); if(pb) pb.innerHTML='<p class="muted su-11a508">✅ '+prog.done+'/'+prog.total+' bloques completados hoy.</p>'; }catch(e){}
      try{ if(typeof viewMode!=='undefined' && viewMode==='hoy' && typeof renderTodayView==='function') renderTodayView(); }catch(e){}
    };
  });
  box.querySelectorAll('[data-rd-hab]').forEach(function(cb){
    cb.onchange=function(){
      try{ const hid=String(cb.dataset.rdHab).split('|')[1]; habitToggle(ctx.key, hid); scheduleSave(); }catch(e){}
      try{ if(typeof habitRefreshAll==='function') habitRefreshAll(); }catch(e){}
      renderRutinasDialog();
    };
  });
  box.querySelectorAll('[data-rd-unlink]').forEach(function(btn){
    btn.onclick=function(ev){
      ev.preventDefault(); ev.stopPropagation();
      try{
        const parts=String(btn.dataset.rdUnlink).split('|');
        const arr=getRutinaDia(ctx.key)[parts[0]].habitos;
        getRutinaDia(ctx.key)[parts[0]].habitos=arr.filter(function(id){return id!==parts[1];});
        scheduleSave('Hábito desvinculado ✓');
      }catch(e){}
      renderRutinasDialog();
    };
  });
  box.querySelectorAll('[data-rd-add]').forEach(function(btn){
    btn.onclick=function(){
      try{
        const sid=btn.dataset.rdAdd;
        const sel=box.querySelector('[data-rd-addsel="'+sid+'"]');
        const hid=sel&&sel.value;
        if(!hid) return;
        const arr=getRutinaDia(ctx.key)[sid].habitos;
        if(arr.indexOf(hid)<0) arr.push(hid);
        scheduleSave('Hábito vinculado ✓');
      }catch(e){}
      renderRutinasDialog();
    };
  });
  box.querySelectorAll('[data-rd-compadd]').forEach(function(btn){
    btn.onclick=function(){
      const sid=btn.dataset.rdCompadd;
      const hi=box.querySelector('[data-rd-hora="'+sid+'"]');
      const ti=box.querySelector('[data-rd-txt="'+sid+'"]');
      const ni=box.querySelector('[data-rd-notify="'+sid+'"]');
      const err=rutinasAddCompromiso(ctx, sid, hi&&hi.value, ti&&ti.value, ni&&ni.checked);
      if(err){ try{ scheduleSave(err); }catch(e){} alert(err); return; }
      renderRutinasDialog();
      try{ if(typeof viewMode!=='undefined' && viewMode==='hoy' && typeof renderTodayView==='function') renderTodayView(); }catch(e){}
    };
  });
  const tpl=$('rutinasPlantilla');
  if(tpl && !tpl.dataset.rutBound){
    tpl.dataset.rutBound='1';
    tpl.onclick=function(){
      try{
        const k2=rutinasTodayCtx().key;
        const r=getRutinaData(); const d=getRutinaDia(k2);
        RUTINA_SLOTS.forEach(function(s){ r.plantilla[s.id]=sanitizeText((d[s.id].texto||''),500); });
        scheduleSave('Plantilla guardada ✓');
      }catch(e){}
    };
  }
  const clr=$('rutinasLimpiar');
  if(clr && !clr.dataset.rutBound){
    clr.dataset.rutBound='1';
    clr.onclick=function(){
      if(!confirm('¿Limpiar textos y vínculos de hoy? (tu plantilla se conserva)')) return;
      try{
        const k2=rutinasTodayCtx().key;
        const d=getRutinaDia(k2);
        RUTINA_SLOTS.forEach(function(s){ d[s.id]={ texto:'', habitos:[], done:false }; });
        scheduleSave('Rutinas de hoy limpias ✓');
      }catch(e){}
      renderRutinasDialog();
    };
  }
  const ct=$('rutinasCloseTop'), cb=$('rutinasClose');
  if(ct && !ct.dataset.rutBound){ ct.dataset.rutBound='1'; ct.onclick=function(){ try{ $('rutinasDialog').close(); }catch(e){} }; }
  if(cb && !cb.dataset.rutBound){ cb.dataset.rutBound='1'; cb.onclick=function(){ try{ $('rutinasDialog').close(); }catch(e){} }; }
}
// === ENTRENAMIENTOS (Gym / Terapia / Calistenia / Prácticas) ===
const TRAINING_CATS = {
  gym: { label:'Gym', icon:'🏋️', color:'#e76e8a' },
  fisio: { label:'Terapia física', icon:'🩹', color:'#7ab8ff' },
  calistenia: { label:'Calistenia', icon:'🤸', color:'#a9d18e' },
  varias: { label:'Prácticas varias', icon:'🌿', color:'#e8c56a' }
};
const TRAINING_AGE_GROUPS = {
  todos: { label:'Todas', icon:'👥', fam:'todos' },
  nino69: { label:'6-9 años', icon:'🧒', fam:'nino' },
  nino1012: { label:'10-12 años', icon:'🧒', fam:'nino' },
  nino: { label:'6-12 años', icon:'🧒', fam:'nino' },
  joven1315: { label:'13-15 años', icon:'🙋', fam:'joven' },
  joven1617: { label:'16-17 años', icon:'🙋', fam:'joven' },
  joven: { label:'13-17 años', icon:'🙋', fam:'joven' },
  adulto1829: { label:'18-29 años', icon:'🧑', fam:'adulto' },
  adulto3044: { label:'30-44 años', icon:'🧑', fam:'adulto' },
  adulto4559: { label:'45-59 años', icon:'🧑', fam:'adulto' },
  adulto: { label:'18-59 años', icon:'🧑', fam:'adulto' },
  mayor6074: { label:'60-74 años', icon:'👴', fam:'mayor' },
  mayor75: { label:'75+ años', icon:'👴', fam:'mayor' },
  mayor: { label:'60+ años', icon:'👴', fam:'mayor' }
};
// Familia de edad: los grupos finos heredan las sugerencias de su familia (nino/joven/adulto/mayor).
function gymAgeFam(tag){ const g=TRAINING_AGE_GROUPS[tag||'todos']; return (g&&g.fam)||tag||'todos'; }
// === ENTRENAMIENTOS POR LUGAR (sin piscina: en Penco no hay piscina pública) ===
const TRAINING_PLACES = {
  todos: { label:'Todos', icon:'📍', keys:[] },
  casa: { label:'Casa', icon:'🏠', keys:['casa','hogar','depto','departamento','living','pieza','patio casa','dormitorio','cocina'] },
  gimnasio: { label:'Gimnasio', icon:'🏋️', keys:['gimnasio','gym','box','pesas','maquina','máquina','polea','mancuerna','barra','kine','cesfam'] },
  playa: { label:'Playa', icon:'🏖️', keys:['playa','mar','arena','orilla','penco playa'] },
  bosque: { label:'Bosque', icon:'🌲', keys:['bosque','cerro','sendero','nativo','montaña','montana','trekking','mirador'] },
  multicancha: { label:'Multicancha', icon:'🏟️', keys:['multicancha','cancha','estadio','futbol','fútbol','baby','basquet','voley','tenis'] },
  plaza: { label:'Plaza/Parque', icon:'🌳', keys:['plaza','parque','calistenia','patio','juego','plaza penco'] },
  costanera: { label:'Costanera', icon:'🚴', keys:['costanera','bici','ciclovia','ciclovía','trote','running','skate','lirquen','lirquén'] },
  otro: { label:'Otro', icon:'📌', keys:[] }
};
function gymNorm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function gymPlaceKey(placeStr){
  const n=gymNorm(placeStr);
  if(!n.trim()) return 'otro';
  for(const k of Object.keys(TRAINING_PLACES)){
    if(k==='todos'||k==='otro') continue;
    if((TRAINING_PLACES[k].keys||[]).some(kw=> n.includes(gymNorm(kw)))) return k;
  }
  return 'otro';
}
function gymPlaceBadge(placeStr){
  const k=gymPlaceKey(placeStr);
  const p=TRAINING_PLACES[k]||TRAINING_PLACES.otro;
  return p.icon+' '+escapeHtml(placeStr||p.label);
}
const TRAINING_SUGGESTIONS = {
  gym: [
    { name:'Push — Pecho/Hombro/Tríceps', exercises:'Press banca 4x8 60kg 90s\nFondos paralelas 3x12 45s\nPress hombro 3x10 30kg 60s\nPlancha 3x45s', place:'Gimnasio Penco', color:'#e76e8a', edad:'adulto' },
    { name:'Pull — Espalda/Bíceps', exercises:'Dominadas 4x6\nRemo barra 4x8 50kg\nCurl bíceps 3x12 15kg\nFace pull 3x15', place:'Gimnasio Penco', color:'#e76e8a', edad:'adulto' },
    { name:'Piernas — Cuádriceps/Glúteo', exercises:'Sentadilla 4x8 70kg\nPeso muerto 3x8 80kg\nPrensa 3x12\nGemelos 3x15', place:'Gimnasio Penco', color:'#e76e8a', edad:'adulto' },
    { name:'Cardio HIIT 20′', exercises:'Calentamiento 5′\n8x (30s sprint / 90s trote)\nEnfriamiento 5′ + estiramiento', place:'Costanera Penco', color:'#ff9a76', edad:'adulto' },
    { name:'🧒 Circuito mini-atletas 6-12', exercises:'Juego calentar 5′ (pilla-pilla)\nSentadilla sin peso 2x12\nFlexiones pared 2x10\nSalto estrella 2x10\nPlancha 2x15s + elongar jugando', place:'Casa / Plaza', color:'#f2a5b8', edad:'nino' },
    { name:'🧒 Fuerza lúdica con bandas 6-12', exercises:'Banda remo 2x12\nBanda press pecho 2x12\nPuente glúteo 2x12\nEquilibrio 1 pierna 2x20s lado\n⚠️ Sin pesas pesadas, siempre con adulto', place:'Casa', color:'#f2a5b8', edad:'nino' },
    { name:'🙋 Intro gym 13-17 (técnica)', exercises:'Goblet sentadilla liviana 3x10\nPress mancuernas 3x10\nRemo polea 3x12\nPlancha 3x30s\n⚠️ Peso que permita 10 reps perfectas, 2x/sem máx', place:'Gimnasio / Casa', color:'#e88aa0', edad:'joven' },
    { name:'🙋 Fullbody joven 3x/sem', exercises:'Sentadilla 3x12\nFlexiones 3x10\nRemo mochila 3x12\nZancadas 2x10 lado\nBici/trote 15′', place:'Gimnasio Penco', color:'#e88aa0', edad:'joven' },
    { name:'🧑 Fuerza 5x5 adulto', exercises:'Sentadilla 5x5\nPress banca 5x5\nRemo barra 5x5\n+ 10′ core\nDescanso 2-3′ entre series', place:'Gimnasio Penco', color:'#e76e8a', edad:'adulto' },
    { name:'🧑 Funcional kettlebell 30′', exercises:'Swing 4x15\nGoblet squat 3x12\nPress 1 brazo 3x8 lado\nPeso muerto rumano 3x10\nRemate 5′ movilidad', place:'Box / Casa', color:'#ff9a76', edad:'adulto' },
    { name:'👴 Gym máquinas suave 60+', exercises:'Bici 10′ suave\nPrensa liviana 2x12\nPolea pecho 2x12\nRemo sentado 2x12\nGemelos sentado 2x15\n⚠️ Sin contener respiración, avisa mareo', place:'Gimnasio / CESFAM', color:'#d9a0ff', edad:'mayor' },
    { name:'👴 Fuerza huesos 60+', exercises:'Sentadilla silla 2x10\nBanda remo 2x12\nElevación talones 2x12\nMarcha talón-punta 2x10m\nSol mañana 15′ (vit D) + calcio', place:'Casa', color:'#d9a0ff', edad:'mayor' }
  ],
  fisio: [
    { name:'Movilidad hombro', exercises:'Círculos hombro 3x15\nBanda rotación externa 3x12\nEstiramiento pectoral 3x30s\nPéndulo Codman 2x1′', place:'Casa / Kine', color:'#7ab8ff', edad:'todos' },
    { name:'Rodilla — rehab suave', exercises:'Cuádriceps isométrico 3x15s\nPuente glúteo 3x12\nSentadilla parcial 3x10\nHielo 10′ final', place:'Casa', color:'#7ab8ff', edad:'todos' },
    { name:'Espalda baja — core', exercises:'Bird-dog 3x10 lado\nPlancha 3x30s\nPuente 3x12\nEstiramiento gato-camello 3x8', place:'Casa', color:'#7ab8ff', edad:'todos' },
    { name:'Respiración + diafragma', exercises:'Respiración diafragmática 5′\n4-7-8 x4 ciclos\nMovilidad costal con banda 3x10', place:'Casa', color:'#8fd9d6', edad:'todos' },
    { name:'🧒 Postura mochila 6-12', exercises:'Ángel pared 2x10\nEstirar pectoral puerta 2x20s\nSuperman 2x10\nMochila <10% peso + 2 correas', place:'Casa', color:'#9ecfff', edad:'nino' },
    { name:'🧒 Coordinación + pie 6-12', exercises:'Caminar punta-talón 2x10m\nSaltos 1 pie 2x8 lado\nRecoger toalla con dedos 2x10\nJuego equilibrio 5′', place:'Casa / Patio', color:'#9ecfff', edad:'nino' },
    { name:'🙋 Postura gamer/celu 13-17', exercises:'Chin-tuck 3x10\nÁngel pared 3x10\nEstirar cuello/trapecio 2x30s lado\nRegla 30-30: cada 30′ muévete 30s', place:'Casa', color:'#7ab8ff', edad:'joven' },
    { name:'🙋 Rodilla deportista escolar', exercises:'Puente 3x12\nSentadilla parcial 3x10\nEstirar cuádriceps/isquios 2x30s\nHielo 10′ si duele — si cojeas, kine/CESFAM', place:'Casa / Kine', color:'#7ab8ff', edad:'joven' },
    { name:'🧑 Lumbar oficina', exercises:'Gato-camello 3x8\nBird-dog 3x8 lado\nPuente 3x12\nCaminata 10′ c/hora sentado', place:'Casa / Oficina', color:'#7ab8ff', edad:'adulto' },
    { name:'🧑 Hombro manguito rotador', exercises:'Rotación externa banda 3x12\nRotación interna 3x12\nPéndulo 2x1′\nEstiramiento posterior 2x30s\n⚠️ Dolor nocturno >2 sem → kine', place:'Casa / Kine', color:'#7ab8ff', edad:'adulto' },
    { name:'👴 Equilibrio anti-caídas 60+', exercises:'Apoyo silla: talón-punta 2x10\n1 pierna con apoyo 2x20s lado\nMarcha lateral 2x8 pasos\nSentarse/pararse silla 2x8\nQuita alfombras sueltas + buena luz', place:'Casa', color:'#a8c8ff', edad:'mayor' },
    { name:'👴 Artrosis rodilla/cadera suave', exercises:'Bici sin carga 10′\nCuádriceps isométrico 3x10s\nAducción cojín 3x10\nHielo/calor 10′ según indique kine\nPeso sano cuida más que pastilla', place:'Casa / CESFAM', color:'#a8c8ff', edad:'mayor' },
    { name:'Codo — movilidad y descarga', exercises:'Flexo-extensión suave 3x10\nProno-supinación con palo liviano 3x10\nEstirar antebrazo arriba/abajo 2x30s lado\nHielo 10′ si hay dolor — sin cargar peso', place:'Casa / Kine', color:'#7ab8ff', edad:'todos' },
    { name:'🧑 Codo tenista / golfista', exercises:'Estirar extensores 2x30s (palma abajo)\nEstirar flexores 2x30s (palma arriba)\nExcéntrico muñeca botella 3x12 lento\nApretar pelota blanda 3x10\n⚠️ Dolor >2 sem, hormigueo o pérdida fuerza → kine/CESFAM', place:'Casa / Kine', color:'#7ab8ff', edad:'adulto' },
    { name:'👴 Codo rígido / artrosis 60+ suave', exercises:'Movilidad asistida con otra mano 2x10\nIsométrico bíceps/tríceps pared 3x10s\nCírculos muñeca 2x10 lado\nCalor suave 10′ antes + hielo 10′ si duele después', place:'Casa / CESFAM', color:'#a8c8ff', edad:'mayor' }
  ],
  calistenia: [
    { name:'Push calistenia', exercises:'Flexiones 4x12\nFondos paralelas 3x10\nPike push-ups 3x8\nPlancha 3x45s', place:'Plaza Penco / Casa', color:'#a9d18e', edad:'adulto' },
    { name:'Pull calistenia', exercises:'Dominadas 4x6\nAustralian pull-ups 3x12\nColgado pasivo 3x30s\nCurl toalla 3x10', place:'Parque / Casa', color:'#a9d18e', edad:'adulto' },
    { name:'Core + piernas', exercises:'Sentadilla 4x20\nZancadas 3x10 lado\nPlancha lateral 3x30s lado\nHollow hold 3x20s', place:'Casa', color:'#a9d18e', edad:'todos' },
    { name:'Fullbody principiantes', exercises:'Flexiones rodillas 3x8\nSentadilla 3x15\nRemo mochila 3x12\nPlancha 3x20s', place:'Casa', color:'#c3e0ab', edad:'todos' },
    { name:'🧒 Monitos: trepar y jugar 6-12', exercises:'Colgarse barra baja 3x15s\nTrepar juego 5′\nSalto rana 2x8\nCarrera gateo oso 2x10m\nSiempre colchoneta + adulto cerca', place:'Plaza / Patio', color:'#cfe8a8', edad:'nino' },
    { name:'🧒 Animal flow kids 6-12', exercises:'Cangrejo 2x10m\nRana 2x8\nOso 2x10m\nCongelar-estatua equilibrio 5′ juego', place:'Casa / Plaza', color:'#cfe8a8', edad:'nino' },
    { name:'🙋 Primera dominada 13-17', exercises:'Colgado 3x20s\nAustralian 3x10\nNegativas 3x5 (baja lento 5s)\nRemo mochila 3x12\n3x/sem, come proteína + duerme 8h', place:'Parque / Casa', color:'#a9d18e', edad:'joven' },
    { name:'🙋 Parque intermedio 13-17', exercises:'Flexiones 3x12\nFondos banco 3x10\nSentadilla salto 3x8\nPlancha 3x40s\nSkate/bici 15′ final', place:'Plaza Penco', color:'#a9d18e', edad:'joven' },
    { name:'🧑 Street full avanzado', exercises:'Muscle-up progresión 5x3\nFront lever tuck 4x15s\nFondos lastrados 4x8\nPistol asistida 3x5 lado', place:'Parque calistenia', color:'#8fc178', edad:'adulto' },
    { name:'🧑 Core 10′ + piernas', exercises:'Hollow 3x20s\nPlancha lateral 3x30s\nSentadilla búlgara 3x10 lado\nPuente 1 pierna 3x8 lado', place:'Casa', color:'#a9d18e', edad:'adulto' },
    { name:'👴 Calistenia en silla 60+', exercises:'Sentarse/pararse 2x8\nFlexiones pared 2x10\nRemo toalla puerta firme 2x8\nMarcha sentada 2x20\nSilla firme contra pared, nada inestable', place:'Casa', color:'#d6e8b8', edad:'mayor' },
    { name:'👴 Pared + apoyo seguro 60+', exercises:'Flexiones pared 2x12\nPantorrilla pared 2x12\nPlancha pared 2x20s\nRespiración 4-4 5′ final', place:'Casa', color:'#d6e8b8', edad:'mayor' },
    { name:'🏟️ Multicancha barras + fondo 25′', exercises:'Dominadas o australian 4x8\nFondos 3x10\nSentadilla 3x15\nPiques 4x30m en la cancha', place:'Multicancha', color:'#8fc178', edad:'adulto' },
    { name:'🌲 Bosque barras rústicas 20′', exercises:'Colgado 3x20s\nAustralian en rama firme 3x8\nFondos en tronco 3x10\nCaminata 10′ — revisa que esté firme y seco', place:'Bosque', color:'#a9d18e', edad:'adulto' }
  ],
  varias: [
    { name:'Yoga suave 30′', exercises:'Saludo al sol 5x\nGuerrero II 3x30s lado\nTriángulo 3x30s\nSavasana 3′ + 4-7-8', place:'Casa', color:'#e8c56a', edad:'todos' },
    { name:'Caminata Playa Penco 45′', exercises:'Caminata ritmo medio 40′\n5′ movilidad tobillo/cadera\nRespiración 5-5 al final', place:'Playa Penco', color:'#e8c56a', edad:'todos' },
    { name:'Estiramientos full 15′', exercises:'Cuello/hombros 3′\nIsquios 2x30s lado\nCuádriceps 2x30s\nEspalda gato-camello 3x8', place:'Casa', color:'#f0d488', edad:'todos' },
    { name:'Práctica respiración + movilidad 20′', exercises:'Respiración caja 4-4-4-4 5′\nMovilidad cadera 5′\nPlancha 3x30s\nEstiramiento global 5′', place:'Casa', color:'#f0d488', edad:'todos' },
    { name:'🧒 Yoga cuento 15′ 6-12', exercises:'Árbol 2x20s lado\nCobra 3x15s\nPerro boca abajo 3x20s\nAvión-guerrero 2x20s\nCuento + respirar como león 5x', place:'Casa', color:'#f5d97a', edad:'nino' },
    { name:'🧒 Baile + juego 20′ 6-12', exercises:'Calentar bailando 5′\nCongelados 3 rondas\nSaltos estrella 2x10\nEstirar jugando 5′ + agua', place:'Casa / Patio', color:'#f5d97a', edad:'nino' },
    { name:'🙋 Yoga dinámico + bici 13-17', exercises:'Saludo sol 5x\nGuerrero I-II 2x30s\nBici/skate 20′\n5′ respiración 4-6 anti-estrés prueba', place:'Casa / Costanera', color:'#e8c56a', edad:'joven' },
    { name:'🙋 Respiración examen + stretch', exercises:'Caja 4-4-4-4 5′\nCuello/hombros 5′\nIsquios 2x30s\nCaminata 10′ sin pantalla', place:'Casa', color:'#f0d488', edad:'joven' },
    { name:'🧑 Pilates core 25′', exercises:'Hundred 1x100\nRoll-up 3x8\nSingle leg stretch 3x10 lado\nPuente 3x12\nTeaser progresión 3x5', place:'Casa / Mat', color:'#e8c56a', edad:'adulto' },
    { name:'🧑 Nado / bici suave 40′', exercises:'Bici 30′ ritmo que permite hablar (o nado si viajas fuera de Penco)\nMovilidad hombro/cadera 5′\nRespiración 5-5 5′', place:'Costanera', color:'#e8c56a', edad:'adulto' },
    { name:'👴 Tai chi / chi kung 20′', exercises:'Abrir-cerrar 5′\nNube manos 3x8 lado\nGruya-pájaro suave 5′\nRespiración 4-6 5′\nApoyo silla si hay mareo', place:'Casa / Plaza', color:'#f0d488', edad:'mayor' },
    { name:'👴 Caminata + elongación 30′', exercises:'Caminata 20′ ritmo cómodo + bastón si hace falta\nTobillo/cadera 5′\nRespiración + sol mañana\nLleva agua + celu + avisa ruta', place:'Barrio / Playa', color:'#f0d488', edad:'mayor' },
    { name:'🏠 Casa exprés 15′ sin material', exercises:'Sentadilla 3x15\nFlexiones rodillas 3x10\nPuente glúteo 3x12\nPlancha 3x20s\nEstiramiento 3′ final — ideal lluvia/frío', place:'Casa', color:'#e8c56a', edad:'todos' },
    { name:'🏖️ Playa HIIT + core 25′', exercises:'Trote suave arena 5′\n4 rondas: sentadilla salto x10 + flexiones x8 + skipping 30s\nPlancha 3x30s + elongar mirando el mar\nLleva agua + bloqueador', place:'Playa Penco', color:'#e8c56a', edad:'adulto' },
    { name:'🌲 Bosque senderismo 60′', exercises:'Caminata sendero 45′ ritmo que permite hablar\nCuesta suave 5′ + pausa mirador\nMovilidad tobillo/cadera 5′\nRespiración 5-5 5′ — zapatillas con agarre', place:'Bosque', color:'#a9d18e', edad:'todos' },
    { name:'🌲 Bosque fuerza con tronco 30′', exercises:'Sentadilla 3x15\nFondos en banca/borde 3x10\nStep-up en tronco 3x10 lado\nPlancha 3x30s\nNo romper ramas vivas, deja sin rastro', place:'Bosque', color:'#a9d18e', edad:'adulto' },
    { name:'🏟️ Multicancha fútbol + vueltas 50′', exercises:'Trote vuelta cancha 8′\nPiques 6x40m\nFútbol/partido 30′\nElongar cuádriceps/isquios 5′ — lleva balón + agua', place:'Multicancha', color:'#a9d18e', edad:'todos' },
    { name:'🏟️ Multicancha funcional 30′', exercises:'Vuelta trote 5′\nCircuito 4 rondas: 10 sentadillas + 8 flexiones + 10 zancadas + 20 skipping\nPlancha 3x30s', place:'Multicancha', color:'#8fc178', edad:'joven' }
  ]
};
function getGymData(){
  const u=userData();
  if(!u.gym) u.gym={ items:[], completions:{} };
  if(!Array.isArray(u.gym.items)) u.gym.items=[];
  if(typeof u.gym.completions!=='object' || Array.isArray(u.gym.completions)) u.gym.completions={};
  // migrar cat faltante
  u.gym.items.forEach(it=>{ if(!it.cat) it.cat='gym'; if(!TRAINING_CATS[it.cat]) it.cat='gym'; });
  // migración: entrenamientos antiguos en piscina (Penco no tiene) → se conservan como 📌 Otro con su texto original
  u.gym.items.forEach(it=>{ if(/piscin|pileta/i.test(it.place||'')) it._legacyPool=true; });
  if(u.gymPlanProfile && u.gymPlanProfile.place==='piscina') u.gymPlanProfile.place='casa';
  return u.gym;
}
let gymEditingId=null;
let gymCurrentTab='gym';
let gymCurrentAge='todos';
let gymCurrentPlace='todos';
function gymMatchesPlace(placeStr, placeF){
  if(!placeF||placeF==='todos') return true;
  return gymPlaceKey(placeStr)===placeF;
}
function renderGymSuggestions(cat, age, place){
  const box=$('gymSuggestionsBox'); if(!box) return;
  const ageF=age||gymCurrentAge||'todos';
  const placeF=place||gymCurrentPlace||'todos';
  const all=TRAINING_SUGGESTIONS[cat]||[];
  const famF=gymAgeFam(ageF);
  let list= (ageF==='todos'||famF==='todos') ? all.slice() : all.filter(s=>{ const f=gymAgeFam(s.edad||'todos'); return f===famF || f==='todos'; });
  if(placeF!=='todos') list=list.filter(s=> gymPlaceKey(s.place)===placeF);
  const catInfo=TRAINING_CATS[cat];
  const ageInfo=(typeof TRAINING_AGE_GROUPS!=='undefined' && TRAINING_AGE_GROUPS[ageF]) ? TRAINING_AGE_GROUPS[ageF] : { label:'Todas', icon:'👥' };
  const placeInfo=(typeof TRAINING_PLACES!=='undefined' && TRAINING_PLACES[placeF]) ? TRAINING_PLACES[placeF] : TRAINING_PLACES.todos;
  const ageChip = ageF==='todos' ? '' : ` · ${ageInfo.icon} ${ageInfo.label}`;
  const placeChip = placeF==='todos' ? '' : ` · ${placeInfo.icon} ${placeInfo.label}`;
  if(!list.length){
    box.innerHTML=`<h4 class="su-e39eba">${catInfo.icon} ${catInfo.label}${ageChip}${placeChip} — 0 sugerencias</h4><p class="muted">No hay sugerencias para ${catInfo.label} en ${placeInfo.icon} ${placeInfo.label} con este filtro de edad. Prueba con 📍 Todos o 👥 Todas, o crea tu rutina abajo con ese lugar.</p>`;
    return;
  }
  box.innerHTML=`<h4 class="su-e39eba">${catInfo.icon} ${catInfo.label}${ageChip}${placeChip} — ${list.length} sugerencias (toca para cargar)</h4>` + list.map(s=>{ const ed=(s.edad&&s.edad!=='todos'&&(typeof TRAINING_AGE_GROUPS!=='undefined'&&TRAINING_AGE_GROUPS[s.edad]))?` <span class="chip su-fb2957">${TRAINING_AGE_GROUPS[s.edad].icon} ${TRAINING_AGE_GROUPS[s.edad].label}</span>`:''; const pk=gymPlaceKey(s.place); const pl=TRAINING_PLACES[pk]||TRAINING_PLACES.otro; return `<div class="habit-item" style="cursor:pointer;border-left:3px solid ${s.color}" data-sug="${escapeHtml(s.name)}" data-cat="${cat}"><b>${escapeHtml(s.name)}</b>${ed} <span class="chip su-fb2957">${pl.icon} ${escapeHtml(s.place)}</span><br><span class="muted su-4dbc08">${escapeHtml(s.exercises)}</span><br><span class="chip su-bf4cbe">+ Agregar al calendario</span></div>`; }).join('') + `<p class="muted su-d47a97">Toca una tarjeta para cargar nombre/lugar/ejercicios/color y luego elige día/hora y pulsa “Agregar al calendario”. Filtros: tipo + edad + lugar.</p>`;
  box.querySelectorAll('[data-sug]').forEach(el=> el.onclick=()=>{
    const cat2=el.dataset.cat; const s=TRAINING_SUGGESTIONS[cat2].find(x=>x.name===el.dataset.sug); if(!s) return;
    $('gymName').value=s.name; $('gymCategory').value=cat2; $('gymPlace').value=s.place; $('gymExercises').value=s.exercises; $('gymColor').value=s.color;
    $('gymName').focus();
  });
}
function renderGymTodayBox(){
  const box=$('gymTodayBox'); if(!box) return;
  const d=getGymData();
  const today=new Date().getDay();
  const todays=d.items.filter(x=> parseInt(x.day)===today).sort((a,b)=> a.start.localeCompare(b.start));
  const todayKey=cal.fmtKey.format(new Date());
  if(!todays.length) box.innerHTML='<p class="muted">Hoy no tienes entrenamientos. ¡Toca una sugerencia arriba y agrégala!</p>';
  else box.innerHTML='<h4 class="su-e39eba">Hoy — '+['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][today]+'</h4>' + todays.map(it=>{
    const done = d.completions[todayKey] && d.completions[todayKey][it.id];
    const cat=TRAINING_CATS[it.cat]||TRAINING_CATS.gym;
    const pk=gymPlaceKey(it.place); const pl=TRAINING_PLACES[pk]||TRAINING_PLACES.otro;
    return `<div class="mens-hist-item" style="border-left:3px solid ${it.color}"><span><b>${cat.icon} ${escapeHtml(it.name)}</b> <span class="chip su-0d5be0">${cat.label}</span> <span class="chip su-0d5be0">${pl.icon} ${escapeHtml(it.place||pl.label)}</span> ${it.start}–${it.end} ${done?'<span class="chip su-1fd357">✓ hecho</span>':''}</span><label class="check-row su-116966"><input type="checkbox" data-id="${it.id}" ${done?'checked':''}> Hecho</label></div>`;
  }).join('') + '<p class="muted su-d47a97">Marca como hecho para racha.</p>';
  box.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.onchange=()=>{
    const id=cb.dataset.id; const key=cal.fmtKey.format(new Date());
    const gd=getGymData();
    if(!gd.completions[key]) gd.completions[key]={};
    if(cb.checked) gd.completions[key][id]=true;
    else { delete gd.completions[key][id]; if(Object.keys(gd.completions[key]).length===0) delete gd.completions[key]; }
    scheduleSave(); renderGymTodayBox(); renderGymStatsBox(); renderGymPlacesBox(); renderGymWeekGrid(); renderLuna();
  });
}
function renderGymPlacesBox(){
  const box=$('gymPlacesBox'); if(!box) return;
  const d=getGymData();
  const counts={}; d.items.forEach(it=>{ const k=gymPlaceKey(it.place); counts[k]=(counts[k]||0)+1; });
  const order=['casa','gimnasio','playa','bosque','multicancha','plaza','costanera','otro'];
  box.innerHTML='<h4 class="su-e39eba">📍 Entrenamientos por lugar</h4><div class="su-6157e8">'
    + order.map(k=>{ const p=TRAINING_PLACES[k]; const c=counts[k]||0; return `<span class="chip su-11a508">${p.icon} ${p.label} (${c})</span>`; }).join('')
    + `</div><p class="muted su-cb3213">Usa el filtro <b>Lugar</b> de arriba para ver solo esas rutinas. Tus lugares se detectan solos desde el texto (ej: “Playa Penco” → 🏖️ Playa).</p>`;
}
function renderGymWeekGrid(){
  const box=$('gymWeekGrid'); if(!box) return;
  const d=getGymData();
  const days=[['Domingo',0],['Lunes',1],['Martes',2],['Miércoles',3],['Jueves',4],['Viernes',5],['Sábado',6]];
  let html='';
  days.forEach(([name, idx])=>{
    const items=d.items.filter(x=> parseInt(x.day)===idx).sort((a,b)=> a.start.localeCompare(b.start));
    const isToday=new Date().getDay()===idx;
    html+=`<div class="schedule-day ${isToday?'schedule-today':''}"><b>${name}</b>${items.length? items.map(it=>{
      const cat=TRAINING_CATS[it.cat]||TRAINING_CATS.gym;
      const pk=gymPlaceKey(it.place); const pl=TRAINING_PLACES[pk]||TRAINING_PLACES.otro;
      const dimmed=(gymCurrentPlace!=='todos' && pk!==gymCurrentPlace);
      return `<div class="schedule-block" style="background:${it.color};border:1px solid ${it.color}${dimmed?';opacity:.35':''}">${cat.icon} ${escapeHtml(it.name)}<br><span class="su-0d5be0">${it.start}–${it.end} · ${pl.icon}</span></div>`;
    }).join('') : '<p class="muted su-0d5be0">—</p>'}</div>`;
  });
  box.innerHTML=html;
}
function renderGymList(){
  const box=$('gymList'); if(!box) return;
  const d=getGymData();
  if(!d.items.length){ box.innerHTML='<p class="muted">Sin entrenamientos aún. Toca una sugerencia arriba o crea uno.</p>'; return; }
  const placeF=gymCurrentPlace||'todos';
  const filtered=d.items.filter(it=> gymMatchesPlace(it.place, placeF));
  const title= placeF==='todos' ? 'Mis rutinas' : `${TRAINING_PLACES[placeF].icon} Mis rutinas en ${TRAINING_PLACES[placeF].label}`;
  if(!filtered.length){ box.innerHTML=`<h4 class="su-e39eba">${title} — 0</h4><p class="muted">No tienes rutinas en ${TRAINING_PLACES[placeF].icon} ${TRAINING_PLACES[placeF].label}. Cambia el filtro a 📍 Todos o crea una con ese lugar.</p>`; return; }
  const sorted=[...filtered].sort((a,b)=> parseInt(a.day)-parseInt(b.day) || a.start.localeCompare(b.start));
  box.innerHTML=`<h4 class="su-e39eba">${title} — ${sorted.length}</h4>`+sorted.map(it=>{
    const cat=TRAINING_CATS[it.cat]||TRAINING_CATS.gym;
    const pk=gymPlaceKey(it.place); const pl=TRAINING_PLACES[pk]||TRAINING_PLACES.otro;
    return `<div class="habit-item su-13313b"><span><b style="color:${it.color}">${cat.icon}</b> <span class="chip" style="font-size:10px;background:${cat.color};color:#10142c">${cat.label}</span> <span class="chip su-0d5be0">${pl.icon} ${pl.label}</span> <b>${escapeHtml(it.name)}</b> — ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][it.day]} ${it.start}–${it.end} ${it.place? '· '+escapeHtml(it.place):''}${it._legacyPool?'<br><span class="muted su-0d5be0">🏊 Antes era piscina (en Penco no hay): edítala y cámbiale el lugar</span>':''}<br><span class="muted su-11a508">${escapeHtml((it.exercises||'').split('\n')[0]||'')}</span></span><span class="su-49cd09"><button data-id="${it.id}" class="btn gym-edit su-337714">✏️</button><button data-id="${it.id}" class="btn gym-del su-fd834a">✕</button></span></div>`;
  }).join('');
  box.querySelectorAll('.gym-edit').forEach(b=> b.onclick=()=>{
    const it=d.items.find(x=>x.id===b.dataset.id); if(!it) return;
    gymEditingId=it.id;
    $('gymName').value=it.name; $('gymCategory').value=it.cat||'gym'; $('gymDay').value=it.day; $('gymStart').value=it.start; $('gymEnd').value=it.end; $('gymColor').value=it.color; $('gymPlace').value=it.place||''; $('gymExercises').value=it.exercises||'';
    $('gymAdd').classList.add('hidden'); $('gymUpdate').classList.remove('hidden'); $('gymCancel').classList.remove('hidden');
  });
  box.querySelectorAll('.gym-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar rutina?')) return;
    const id=b.dataset.id; const dd=getGymData(); dd.items=dd.items.filter(x=>x.id!==id);
    Object.keys(dd.completions).forEach(k=>{ if(dd.completions[k][id]) delete dd.completions[k][id]; if(Object.keys(dd.completions[k]).length===0) delete dd.completions[k]; });
    scheduleSave(); renderGymList(); renderGymWeekGrid(); renderGymTodayBox(); renderGymStatsBox(); renderGymPlacesBox(); renderLuna();
  });
}
function renderGymStatsBox(){
  const box=$('gymStatsBox'); if(!box) return;
  const d=getGymData();
  const todayKey=cal.fmtKey.format(new Date());
  const todayDone = d.completions[todayKey] ? Object.keys(d.completions[todayKey]).length : 0;
  const weekDone = Object.keys(d.completions).filter(k=>{ const ms=mensKeyToMs(k); return Math.abs(ms - Date.now()) < 7*86400000; }).length;
  const byCat={}; d.items.forEach(it=>{ byCat[it.cat]=(byCat[it.cat]||0)+1; });
  const catTxt=Object.entries(byCat).map(([k,c])=>`${(TRAINING_CATS[k]||TRAINING_CATS.gym).icon} ${c}`).join(' · ') || '0';
  const byPlace={}; d.items.forEach(it=>{ const k=gymPlaceKey(it.place); byPlace[k]=(byPlace[k]||0)+1; });
  const placeTxt=Object.entries(byPlace).map(([k,c])=>`${(TRAINING_PLACES[k]||TRAINING_PLACES.otro).icon} ${c}`).join(' · ') || '0';
  box.innerHTML='<h4 class="su-a80552">📊 Progreso</h4><div class="habit-stats"><span>Hoy: '+todayDone+' completadas</span><span>Esta semana: '+weekDone+' días</span><span>Total: '+d.items.length+' ('+catTxt+')</span><span>Por lugar: '+placeTxt+'</span></div>';
}
// === PLAN DE ENTRENAMIENTO SEGÚN QUIÉN ERES + OBJETIVO (local, sin cuentas) ===
const GYM_PLAN_GOALS = {
  bajar_peso: { label:'Bajar peso / moverme más', icon:'🔥' },
  musculo: { label:'Ganar músculo / fuerza', icon:'💪' },
  movilidad: { label:'Movilidad y salud', icon:'🤸' },
  calma: { label:'Calma y energía', icon:'🌿' },
  rendimiento: { label:'Rendimiento / deporte', icon:'🏃' },
  rehab: { label:'Rehab suave', icon:'🩹' }
};
const GYM_PLAN_PLACE_NAME = { casa:'Casa', gimnasio:'Gimnasio Penco', playa:'Playa Penco', bosque:'Bosque', multicancha:'Multicancha', plaza:'Plaza / Parque', costanera:'Costanera', otro:'Casa' };
const GYM_PLAN_LEVELS = { principiante:'🌱 Principiante', intermedio:'⚡ Intermedio', avanzado:'🔥 Avanzado' };
function gymPlanDaySet(n){
  n=parseInt(n)||3;
  if(n<=2) return [1,4];
  if(n===3) return [1,3,5];
  if(n===4) return [1,2,4,5];
  return [1,2,3,4,5];
}
function gymPlanAddMin(t, mins){
  try{ const [h,m]=String(t||'18:00').split(':').map(Number); const d=new Date(2000,0,1,h||18,m||0); d.setMinutes(d.getMinutes()+(parseInt(mins)||30)); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }catch(e){ return t||'18:30'; }
}
function gymPlanBaseSessions(goal, age){
  // Sesiones base (ritmo intermedio ~30'). Se adaptan por nivel/minutos/edad/lugar abajo.
  // Base OMS/ACSM: cada sesión trae calentamiento + parte principal + vuelta a la calma.
  const fam=gymAgeFam(age);
  if(fam==='nino'){
    const k=[
      { name:'🧒 Juego + fuerza mini-atletas', cat:'calistenia', color:'#a9d18e', ex:'Pilla-pilla 5′\nSentadilla sin peso 2x12\nFlexiones pared 2x10\nSalto estrella 2x10\nEquilibrio 1 pie 2x20s lado' },
      { name:'🧒 Baile + coordinación', cat:'varias', color:'#e8c56a', ex:'Bailar 5′\nCongelados 3 rondas\nCangrejo 2x10m\nOso 2x10m\nRespirar como león 5x' },
      { name:'🧒 Postura + core jugando', cat:'fisio', color:'#7ab8ff', ex:'Ángel pared 2x10\nSuperman 2x10\nPlancha 2x15s\nMarcha punta-talón 2x10m\nElongar jugando 5′' },
      { name:'🧒 Parque + trepar seguro', cat:'calistenia', color:'#a9d18e', ex:'Colgado barra baja 3x15s\nSalto rana 2x8\nGateo oso 2x10m\nTrote juego 5′' },
      { name:'🧒 Yoga cuento + calma', cat:'varias', color:'#e8c56a', ex:'Árbol 2x20s lado\nCobra 3x15s\nPerro boca abajo 3x20s\nAvión-guerrero 2x20s\nCuento + respiración 5′' }
    ];
    if(goal==='musculo') return [k[0],k[3],k[2],k[1],k[4]];
    if(goal==='rehab'||goal==='movilidad') return [k[2],k[4],k[1],k[0],k[3]];
    if(goal==='calma') return [k[4],k[1],k[2],k[0],k[3]];
    if(goal==='rendimiento') return [k[3],k[0],k[1],k[2],k[4]];
    return [k[0],k[1],k[2],k[3],k[4]];
  }
  if(fam==='mayor'){
    const m=[
      { name:'👴 Fuerza huesos + silla', cat:'gym', color:'#d9a0ff', ex:'Sentarse/pararse silla 2x8\nFlexiones pared 2x10\nElevación talones 2x12\nMarcha talón-punta 2x10m' },
      { name:'👴 Caminata + elongación', cat:'varias', color:'#f0d488', ex:'Caminata 20′ ritmo cómodo\nTobillo/cadera 5′\nRespiración 4-6 5′\nLleva agua + avisa ruta' },
      { name:'👴 Equilibrio anti-caídas', cat:'fisio', color:'#a8c8ff', ex:'Apoyo silla: talón-punta 2x10\n1 pierna con apoyo 2x20s lado\nMarcha lateral 2x8\nSentarse/pararse 2x8' },
      { name:'👴 Tai chi suave', cat:'varias', color:'#f0d488', ex:'Abrir-cerrar 5′\nNube manos 3x8 lado\nMovimiento grulla suave 5′\nRespiración 4-6 5′' },
      { name:'👴 Articulaciones suaves', cat:'fisio', color:'#a8c8ff', ex:'Bici sin carga 10′\nCuádriceps isométrico 3x10s\nCírculos muñeca/hombro 2x10\nCalor suave 10′ antes si indica kine' }
    ];
    if(goal==='musculo') return [m[0],m[2],m[4],m[1],m[3]];
    if(goal==='bajar_peso') return [m[1],m[0],m[3],m[2],m[4]];
    if(goal==='rendimiento') return [m[1],m[0],m[2],m[3],m[4]];
    if(goal==='calma') return [m[3],m[1],m[4],m[2],m[0]];
    if(goal==='rehab') return [m[4],m[2],m[3],m[0],m[1]];
    return [m[2],m[0],m[1],m[3],m[4]];
  }
  if(goal==='musculo') return [
    { name:'Push — Pecho/Hombro/Tríceps', cat:'gym', color:'#e76e8a', ex:'Press banca o flexiones 4x8\nFondos 3x10\nPress hombro 3x10\nPlancha 3x40s · descanso 90s' },
    { name:'Pull — Espalda/Bíceps', cat:'gym', color:'#e76e8a', ex:'Dominadas o remo mochila 4x8\nRemo barra/polea 4x8\nCurl 3x12\nFace pull o banda 3x15' },
    { name:'Piernas — Cuádriceps/Glúteo', cat:'gym', color:'#e76e8a', ex:'Sentadilla 4x10\nPeso muerto rumano 3x10\nZancadas 3x10 lado\nGemelos 3x15' },
    { name:'Fullbody + Core', cat:'calistenia', color:'#a9d18e', ex:'Sentadilla 3x15\nFlexiones 3x10\nRemo 3x12\nPlancha lateral 3x30s lado' },
    { name:'Funcional + Movilidad', cat:'varias', color:'#e8c56a', ex:'Swing o puente 4x15\nGoblet 3x12\nPress 1 brazo 3x8 lado\nMovilidad cadera 5′' }
  ];
  if(goal==='movilidad') return [
    { name:'Movilidad total 30′', cat:'fisio', color:'#7ab8ff', ex:'Gato-camello 3x8\nÁngel pared 3x10\nCadera 90/90 2x8 lado\nTobillo contra pared 2x10 lado' },
    { name:'Yoga suave', cat:'varias', color:'#e8c56a', ex:'Saludo al sol 5x\nGuerrero II 3x30s lado\nTriángulo 3x30s\nSavasana 3′ + respiración 4-6' },
    { name:'Core suave + Caminata', cat:'fisio', color:'#7ab8ff', ex:'Bird-dog 3x8 lado\nPuente 3x12\nPlancha 3x25s\nCaminata 15′ ritmo que permite hablar' },
    { name:'Hombro + Cadera', cat:'fisio', color:'#7ab8ff', ex:'Rotación externa banda 3x12\nPéndulo 2x1′\nPuente 1 pierna 3x8 lado\nEstiramiento pectoral 2x30s' },
    { name:'Caminata + Elongación', cat:'varias', color:'#e8c56a', ex:'Caminata 25′\nIsquios 2x30s lado\nCuádriceps 2x30s\nRespiración 5-5 5′' }
  ];
  if(goal==='calma') return [
    { name:'Respiración + Movilidad', cat:'varias', color:'#f0d488', ex:'Respiración caja 4-4-4-4 5′\nMovilidad cuello/hombros 5′\nGato-camello 3x8\nCaminata 10′ sin pantalla' },
    { name:'Yoga suave anti-estrés', cat:'varias', color:'#e8c56a', ex:'Saludo sol 4x lento\nPostura niño 3x1′\nPiernas en pared 3′\nRespiración 4-7-8 x4' },
    { name:'Caminata consciente', cat:'varias', color:'#e8c56a', ex:'Caminata 25′ (3 pasos inhala / 4 exhala)\nPausa mirador 3′\nElongación suave 5′' },
    { name:'Tai chi / Chi kung', cat:'varias', color:'#f0d488', ex:'Abrir-cerrar 5′\nNube manos 3x8 lado\nBalanceo suave 5′\nRespiración 4-6 5′' },
    { name:'Estiramiento full + Core suave', cat:'fisio', color:'#7ab8ff', ex:'Cuello/hombros 3′\nIsquios 2x30s\nPuente 2x12\nPlancha 2x25s + respiración 5′' }
  ];
  if(goal==='rendimiento') return [
    { name:'Fuerza street', cat:'calistenia', color:'#8fc178', ex:'Dominadas o australian 4x8\nFondos 4x10\nSentadilla salto 3x8\nHollow 3x20s' },
    { name:'HIIT 25′', cat:'gym', color:'#ff9a76', ex:'Calentar 5′\n6x (30s fuerte / 90s trote)\nPlancha 3x30s + elongar 5′' },
    { name:'Core + Piernas potencia', cat:'calistenia', color:'#a9d18e', ex:'Búlgara 3x10 lado\nPuente 1 pierna 3x8 lado\nPlancha lateral 3x30s\nSkipping 4x30s' },
    { name:'Funcional 30′', cat:'gym', color:'#ff9a76', ex:'Circuito 4 rondas: 10 sentadillas + 8 flexiones + 10 zancadas + 20 skipping\nDescanso 90s entre rondas' },
    { name:'Fondo aeróbico', cat:'varias', color:'#e8c56a', ex:'Trote/bici 30′ ritmo que permite hablar\nMovilidad cadera 5′\nRespiración 5-5 5′' }
  ];
  if(goal==='rehab') return [
    { name:'Movilidad suave general', cat:'fisio', color:'#7ab8ff', ex:'Círculos hombro 2x10\nFlexo-extensión codo suave 2x10\nGato-camello 2x8\nRespiración diafragmática 5′ · SIN dolor' },
    { name:'Lumbar + Core suave', cat:'fisio', color:'#7ab8ff', ex:'Bird-dog 2x8 lado\nPuente 2x10\nPlancha pared 2x20s\nCaminata 10′ · para si hay dolor agudo' },
    { name:'Equilibrio + Marcha', cat:'fisio', color:'#a8c8ff', ex:'Apoyo silla: 1 pierna 2x15s lado\nMarcha talón-punta 2x8m\nSentarse/pararse 2x6\nRespiración 4-6 3′' },
    { name:'Cuello + Hombro descarga', cat:'fisio', color:'#7ab8ff', ex:'Chin-tuck 2x8\nEstirar trapecio 2x20s lado\nPéndulo 2x1′\nHielo 10′ si hay molestia (según kine)' },
    { name:'Caminata + Elongación suave', cat:'varias', color:'#f0d488', ex:'Caminata 15′ suave\nIsquios/cuádriceps 2x20s sin rebotes\nRespiración 5-5 5′' }
  ];
  // bajar_peso (defecto)
  return [
    { name:'Fullbody quema (sin impacto)', cat:'calistenia', color:'#a9d18e', ex:'Sentadilla 3x15\nFlexiones rodillas 3x10\nRemo mochila 3x12\nPuente 3x12 · descanso 45s' },
    { name:'Cardio suave + Core', cat:'varias', color:'#e8c56a', ex:'Caminata/trote 20′ (puedes hablar)\nPlancha 3x30s\nHollow 3x20s\nElongación 5′' },
    { name:'Tren inferior + Glúteo', cat:'calistenia', color:'#a9d18e', ex:'Sentadilla 3x15\nZancadas 3x10 lado\nPuente 1 pierna 3x8 lado\nGemelos 3x15' },
    { name:'Intervalos 20′', cat:'gym', color:'#ff9a76', ex:'Calentar 5′\n6x (30s rápido / 90s suave)\nEnfriar 5′ + estiramiento' },
    { name:'Movilidad + Caminata recovery', cat:'fisio', color:'#7ab8ff', ex:'Gato-camello 3x8\nBird-dog 3x8 lado\nCaminata 20′ suave\nRespiración 4-6 5′' }
  ];
}
// === Bloque de LUGAR (Penco real): cada sesión suma calentamiento, extra y cierre propios del lugar ===
const GYM_PLACE_TIP = {
  casa: { cal:'Marcha en el lugar 2′ + círculos de hombros, cadera y tobillos', extra:'Si tienes banda o mochila con peso, úsala en 1 ejercicio', cierre:'Elonga 5′ + ventila la pieza', log:'Silla firme cerca + botella de agua' },
  gimnasio: { cal:'Bici o caminadora 5′ suave + movilidad articular', extra:'Si hay máquina libre, haz 1 ejercicio en máquina en vez de peso corporal', cierre:'Elonga 5′ + anota pesos y series', log:'Pide inducción si es tu primera vez + toalla' },
  playa: { cal:'Camina descalzo 3′ probando la arena + movilidad de tobillos', extra:'Trote en arena firme 5-10′ (la mitad si es arena blanda)', cierre:'Elonga mirando el mar + sacúdete la arena', log:'Bloqueador + agua + bandera verde + avisa a alguien' },
  bosque: { cal:'Caminata 5′ + tobillos y cadera', extra:'Cuesta suave 5′ o step-up en tronco firme 3x10 lado', cierre:'Respiración 5-5 5′ + deja todo sin rastro', log:'Zapatillas con agarre + agua + celu con carga + avisa tu ruta' },
  multicancha: { cal:'Trote dando la vuelta a la cancha 5′', extra:'Piques 4x30m o juego (fútbol/básquet) 10′', cierre:'Elonga cuádriceps e isquios 5′', log:'Balón + agua + cuida a otros jugadores' },
  plaza: { cal:'Caminata 5′ + movilidad de hombros y cadera', extra:'En barras: colgado 3x20s o australian 3x8 (solo si están firmes)', cierre:'Elonga 5′ + respiración', log:'Revisa que fierros y bancas estén firmes y secos' },
  costanera: { cal:'Trote o bici 5′ suave', extra:'Intervalos 4x (1′ rápido / 2′ suave)', cierre:'Elonga + respiración 5-5', log:'Luz o chaleco si es de noche + agua' },
  otro: { cal:'Marcha suave 3′ + movilidad articular', extra:'Suma 5′ de caminata a buen paso', cierre:'Elonga 5′ + respiración', log:'Agua + avisa dónde entrenas' }
};
// === Guía semanal por OBJETIVO (base: OMS 2020 + ACSM) ===
const GYM_GOAL_GUIDE = {
  bajar_peso: 'Meta OMS: 150-300′ aeróbico/sem + fuerza 2 días. Este plan combina ambos; la baja de peso real viene de constancia + comida de verdad + dormir 7-8h.',
  musculo: 'ACSM fuerza: novato 2-3 días/sem, intermedio 3-4. 8-12 reps por serie (10-15 si eres mayor). Sube peso solo 2-10% cuando completes todas las reps con buena técnica.',
  movilidad: 'Movilidad rinde a diario en dosis cortas: repite el cierre de cada sesión los días libres. Sin rebotes, sin dolor agudo.',
  calma: 'Calma = sistema nervioso: respira por la nariz, termina siempre con 5′ lentos y evita pantallas 30′ después. 3-4 días/sem bastan.',
  rendimiento: 'Rinde con 1 día fuerte + 1 día suave alternados y 1 día de descanso total. Primero suma minutos (duración) y después velocidad (intensidad).',
  rehab: 'Rehab: suave y sin dolor, 2-3 días/sem con descanso entre medio. Esto NO reemplaza kine: si duele >2 días, cojeas o hay hormigueo → CESFAM/kine.'
};
function gymPlanPhases(weeks){
  weeks=[1,2,4,8].includes(parseInt(weeks))? parseInt(weeks) : 4;
  if(weeks===1) return [{ n:1, t:'Semana única · Base: aprende la técnica y crea el hábito, sin apuro' }];
  if(weeks===2) return [{ n:1, t:'S1 · Base: haz lo indicado, técnica perfecta' },{ n:2, t:'S2 · Suma: +1 serie por ejercicio o +5′ de aeróbico' }];
  if(weeks===4) return [{ n:1, t:'S1 · Adapta: la mitad de series si vienes de cero' },{ n:2, t:'S2 · Construye: haz el plan completo' },{ n:3, t:'S3 · Sube: +1 serie o +10% tiempo' },{ n:4, t:'S4 · Descarga: baja 30% y duerme bien' }];
  return [{ n:1, t:'S1 · Adapta: la mitad de series' },{ n:2, t:'S2 · Construye: plan completo' },{ n:3, t:'S3 · Sube: +1 serie' },{ n:4, t:'S4 · Descarga: baja 30%' },{ n:5, t:'S5 · Construye+: repite S2 con un poco más' },{ n:6, t:'S6 · Sube+: +1 serie o +10% tiempo' },{ n:7, t:'S7 · Pico: tu mejor semana' },{ n:8, t:'S8 · Descarga: baja 40%, celebra y mide tu avance' }];
}
function gymPlanAdaptEx(ex, level, mins, placeKey){
  const tip=GYM_PLACE_TIP[placeKey]||GYM_PLACE_TIP.casa;
  let main=String(ex||'');
  if(level==='principiante'){ main=main.replace(/4x/g,'2x'); main+='\nDescansa 60-90s entre series. Para si hay dolor agudo.'; }
  else if(level==='avanzado'){ main+='\n+ Extra: repite el bloque principal 1x.'; }
  mins=parseInt(mins)||30;
  let vol='';
  if(mins<=20) vol='⏱️ Exprés ('+mins+'′): 1-2 rondas con buena técnica.';
  else if(mins>=45) vol='⏱️ Sesión larga ('+mins+'′): repite el bloque principal 2x + 10′ caminata.';
  let t='① Calentar: '+tip.cal+'\n② Principal:\n'+main+'\n+Bloque del lugar: '+tip.extra+'\n③ Cierre: '+tip.cierre+'\n💧 Agua antes-durante-después · 🎒 '+tip.log;
  if(vol) t+='\n'+vol;
  return t;
}
function buildGymPlan(o){
  const age=(o.age in TRAINING_AGE_GROUPS)? o.age : 'adulto';
  const fam=gymAgeFam(age);
  const goal=(o.goal in GYM_PLAN_GOALS)? o.goal : 'bajar_peso';
  const level=['principiante','intermedio','avanzado'].includes(o.level)? o.level : 'principiante';
  const placeKey=(o.place in TRAINING_PLACES && o.place!=='todos')? o.place : 'casa';
  const placeName=GYM_PLAN_PLACE_NAME[placeKey]||'Casa';
  const mins=Math.max(10,Math.min(90,parseInt(o.mins)||30));
  const weeks=[1,2,4,8].includes(parseInt(o.weeks))? parseInt(o.weeks) : 4;
  const days=gymPlanDaySet(o.days);
  const hour=String(o.hour||'18:00');
  const end=gymPlanAddMin(hour, mins);
  const base=gymPlanBaseSessions(goal, age);
  const names=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const phases=gymPlanPhases(weeks);
  const phaseTxt='📈 Progresión '+weeks+' sem: '+phases.map(p=>'S'+p.n+'='+(p.t.split('·')[1]||p.t).trim()).join(' · ');
  const sessions=days.map((d,i)=>{
    const s=base[i%base.length];
    return { day:d, dayName:names[d]||'', name:s.name, cat:s.cat, color:s.color, place:placeName, start:hour, end:end, exercises:gymPlanAdaptEx(s.ex, level, mins, placeKey)+'\n'+phaseTxt };
  });
  let warn='';
  if(fam==='nino') warn+='🧒 6-12 (OMS: 60′ de juego activo al día + fuerza/hueso 3 días/sem): siempre con adulto, sin pesas pesadas, juego antes que carga. 6-9: solo juego y técnica; 10-12: puede sumar bandas livianas. ';
  if(age==='joven1315') warn+='🙋 13-15: sin cargas máximas ni suplementos; técnica + deporte escolar. ';
  if(age==='joven1617'&&(goal==='musculo'||goal==='rendimiento')&&level!=='principiante') warn+='🙋 16-17: progresa de a poco, 3x/sem máx por grupo muscular, duerme 8-9h. ';
  if(age==='joven'&&(goal==='musculo'||goal==='rendimiento')&&level==='avanzado') warn+='🙋 13-17: sin cargas máximas; técnica perfecta primero. ';
  if(age==='adulto4559') warn+='🧑 45-59: calienta el doble (10′) y cuida rodillas/hombros: prefiere técnica y rango completo sin dolor. ';
  if(fam==='mayor') warn+='👴 60+ (OMS: equilibrio + fuerza 3+ días/sem contra caídas): silla firme cerca, buena luz, avisa tu ruta; ante mareo/dolor detente y consulta CESFAM/kine. ';
  if(age==='mayor75') warn+='75+: sesiones cortas (15-20′), siempre con apoyo y compañía si es posible. ';
  if(goal==='rehab') warn+='🩹 Rehab suave: esto NO reemplaza kine. Suave, sin dolor; si duele >2 días, cojeas o hay hormigueo/pérdida de fuerza → CESFAM/kine. ';
  if(goal==='bajar_peso') warn+='💧 Agua + dormir 7-8h + comida de verdad rinden más que matarse 1 día. ';
  const g=GYM_PLAN_GOALS[goal], a=TRAINING_AGE_GROUPS[age], p=TRAINING_PLACES[placeKey]||TRAINING_PLACES.casa;
  const title=a.icon+' '+a.label+' · '+GYM_PLAN_LEVELS[level]+' · '+g.icon+' '+g.label+' · '+p.icon+' '+p.label+' · '+days.length+'×'+mins+'′ · '+weeks+' sem';
  return { title:title, warn:warn.trim(), guide:GYM_GOAL_GUIDE[goal]||'', phases:phases, sessions:sessions, meta:{age:age,goal:goal,level:level,placeKey:placeKey,mins:mins,hour:hour,weeks:weeks} };
}
let gymLastPlan=null;
function renderGymPlanPreview(plan){
  const box=$('gymPlanOut'); if(!box) return;
  if(!plan){ box.textContent='Pulsa “Generar mi plan”.'; return; }
  const names=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  let html='<b class="su-e39eba">'+escapeHtml(plan.title)+'</b><br>';
  if(plan.guide) html+='<p class="muted su-84d476">📚 '+escapeHtml(plan.guide)+'</p>';
  if(plan.phases&&plan.phases.length>1) html+='<p class="muted su-84d476">🗓️ '+plan.phases.map(p=>'S'+p.n+': '+escapeHtml((p.t.split('·')[1]||p.t).trim())).join(' → ')+'</p>';
  plan.sessions.forEach((s,i)=>{
    const cat=TRAINING_CATS[s.cat]||TRAINING_CATS.varias;
    html+='<div class="habit-item" style="margin-top:6px;border-left:3px solid '+s.color+'"><b>'+(i+1)+'. '+names[s.day]+' '+s.start+'–'+s.end+' · '+cat.icon+' '+escapeHtml(s.name)+'</b> <span class="chip su-fb2957">'+escapeHtml(s.place)+'</span><br><span class="muted su-4dbc08">'+escapeHtml(s.exercises)+'</span></div>';
  });
  if(plan.warn) html+='<p class="muted su-cb3213">⚠️ '+escapeHtml(plan.warn)+'</p>';
  html+='<p class="muted su-cb3213">✅ Checklist integral: 💧 agua · 😴 7-8h · 🍲 comida de verdad · 📓 anota cómo te sentiste · 🧘 1 día de descanso total/sem</p>';
  box.innerHTML=html;
  const add=$('gymPlanAdd'); if(add) add.classList.remove('hidden');
}
function setupGymPlan(){
  const gen=$('gymPlanGen'); if(!gen) return;
  // Prefill edad/lugar desde filtros actuales al abrir
  try{
    const btn=$('btnGym');
    if(btn) btn.addEventListener('click', ()=>{
      setTimeout(()=>{
        try{
          const a=$('gymPlanAge'), p=$('gymPlanPlace');
          if(a && typeof gymCurrentAge!=='undefined' && gymCurrentAge!=='todos' && TRAINING_AGE_GROUPS[gymCurrentAge]) a.value=gymCurrentAge;
          if(p && typeof gymCurrentPlace!=='undefined' && gymCurrentPlace!=='todos') p.value=gymCurrentPlace;
          // recupera último perfil guardado
          try{ const u=(typeof userData==='function'?userData():null); const pr=u&&u.gymPlanProfile; if(pr){ if(a&&pr.age&&TRAINING_AGE_GROUPS[pr.age]) a.value=pr.age; const l=$('gymPlanLevel'); if(l&&pr.level) l.value=pr.level; const g=$('gymPlanGoal'); if(g&&pr.goal) g.value=pr.goal; if(p&&pr.place&&TRAINING_PLACES[pr.place]&&pr.place!=='todos') p.value=pr.place; const d=$('gymPlanDays'); if(d&&pr.days) d.value=String(pr.days); const m=$('gymPlanMins'); if(m&&pr.mins) m.value=String(pr.mins); const h=$('gymPlanHour'); if(h&&pr.hour) h.value=pr.hour; const w=$('gymPlanWeeks'); if(w&&pr.weeks) w.value=String(pr.weeks); } }catch(e){}
        }catch(e){}
      },50);
    });
  }catch(e){}
  gen.onclick=()=>{
    const wEl=$('gymPlanWeeks');
    const o={ age:$('gymPlanAge').value, level:$('gymPlanLevel').value, goal:$('gymPlanGoal').value, place:$('gymPlanPlace').value, days:$('gymPlanDays').value, mins:$('gymPlanMins').value, hour:$('gymPlanHour').value||'18:00', weeks:wEl?wEl.value:'4' };
    gymLastPlan=buildGymPlan(o);
    try{ const u=userData(); u.gymPlanProfile={ age:o.age, level:o.level, goal:o.goal, place:o.place, days:o.days, mins:o.mins, hour:o.hour, weeks:o.weeks }; scheduleSave(); }catch(e){}
    renderGymPlanPreview(gymLastPlan);
  };
  const add=$('gymPlanAdd'); if(add) add.onclick=()=>{
    if(!gymLastPlan||!gymLastPlan.sessions.length) return alert('Primero genera tu plan ✨');
    const d=getGymData();
    const base=Date.now();
    const wk=(gymLastPlan.meta&&gymLastPlan.meta.weeks)||4;
    gymLastPlan.sessions.forEach((s,i)=>{
      d.items.push({ id:'gym'+base+'_'+i, name:s.name+(wk>1?' ('+wk+' sem)':''), cat:s.cat, day:String(s.day), start:s.start, end:s.end, color:s.color, place:s.place, exercises:s.exercises });
    });
    scheduleSave(); renderGymList(); renderGymWeekGrid(); renderGymTodayBox(); renderGymStatsBox(); renderGymPlacesBox(); try{ renderLuna(); }catch(e){}
    add.textContent='✓ Plan agregado ('+gymLastPlan.sessions.length+' rutinas × '+wk+' sem)';
    setTimeout(()=>{ add.textContent='📅 Agregar plan a mi calendario'; },3000);
  };
}
setTimeout(setupGymPlan, 875);
function setupGymDialog(){
  const btn=$('btnGym'); if(btn) btn.onclick=()=>{ renderGymSuggestions(gymCurrentTab, gymCurrentAge, gymCurrentPlace); syncGymAgeUI(); syncGymPlaceUI(); renderGymTodayBox(); renderGymPlacesBox(); renderGymWeekGrid(); renderGymList(); renderGymStatsBox(); $('gymDialog').showModal(); };
  const ct=$('gymCloseTop'), cb=$('gymClose'); if(ct) ct.onclick=()=>$('gymDialog').close(); if(cb) cb.onclick=()=>$('gymDialog').close();
  // tabs tipo (se mantiene lo actual)
  const tabs={ gym:$('tabGymGym'), fisio:$('tabGymFisio'), calistenia:$('tabGymCalis'), varias:$('tabGymVarias') };
  Object.entries(tabs).forEach(([cat,el])=>{
    if(!el) return;
    el.onclick=()=>{ gymCurrentTab=cat; Object.entries(tabs).forEach(([c,e])=> e && e.classList.toggle('btn-accent', c===cat)); renderGymSuggestions(cat, gymCurrentAge, gymCurrentPlace); const sel=$('gymCategory'); if(sel) sel.value=cat; };
  });
  const catSel=$('gymCategory'); if(catSel) catSel.onchange=()=>{ const v=catSel.value; if(TRAINING_CATS[v]){ gymCurrentTab=v; Object.entries(tabs).forEach(([c,e])=> e && e.classList.toggle('btn-accent', c===v)); renderGymSuggestions(v, gymCurrentAge, gymCurrentPlace); } };
  // filtro por edad (chips + select) — se mantiene
  const ageBtns={ todos:$('tabGymAgeTodos'), nino:$('tabGymAgeNino'), joven:$('tabGymAgeJoven'), adulto:$('tabGymAgeAdulto'), mayor:$('tabGymAgeMayor') };
  const ageSel=$('gymAge');
  window.syncGymAgeUI=function(){
    Object.entries(ageBtns).forEach(([a,e])=> e && e.classList.toggle('btn-accent', a===gymCurrentAge));
    if(ageSel) ageSel.value=gymCurrentAge;
  };
  function setAge(a){ if(!TRAINING_AGE_GROUPS[a]) a='todos'; gymCurrentAge=a; syncGymAgeUI(); renderGymSuggestions(gymCurrentTab, gymCurrentAge, gymCurrentPlace); }
  Object.entries(ageBtns).forEach(([a,el])=>{ if(el) el.onclick=()=> setAge(a); });
  if(ageSel) ageSel.onchange=()=> setAge(ageSel.value);
  // filtro por lugar (nuevo — no rompe lo anterior)
  const placeBtns={ todos:$('tabGymPlaceTodos'), casa:$('tabGymPlaceCasa'), gimnasio:$('tabGymPlaceGimnasio'), playa:$('tabGymPlacePlaya'), bosque:$('tabGymPlaceBosque'), multicancha:$('tabGymPlaceMulticancha'), plaza:$('tabGymPlacePlaza'), costanera:$('tabGymPlaceCostanera'), otro:$('tabGymPlaceOtro') };
  const placeSel=$('gymPlaceFilter');
  window.syncGymPlaceUI=function(){
    Object.entries(placeBtns).forEach(([p,e])=> e && e.classList.toggle('btn-accent', p===gymCurrentPlace));
    if(placeSel) placeSel.value=gymCurrentPlace;
  };
  window.setGymPlace=function(p){ if(!TRAINING_PLACES[p]) p='todos'; gymCurrentPlace=p; syncGymPlaceUI(); renderGymSuggestions(gymCurrentTab, gymCurrentAge, gymCurrentPlace); renderGymPlacesBox(); renderGymWeekGrid(); renderGymList(); };
  Object.entries(placeBtns).forEach(([p,el])=>{ if(el) el.onclick=()=> setGymPlace(p); });
  if(placeSel) placeSel.onchange=()=> setGymPlace(placeSel.value);
  function gymCheckPool(placeStr){
    if(/piscin|pileta/i.test(placeStr||'')){
      return confirm('En Penco no hay piscina pública 🏊‍♂️❌\n¿Igual quieres guardar con ese lugar? (Aceptar = guardar, Cancelar = cámbialo a Casa, Costanera, Playa…)');
    }
    return true;
  }
  const add=$('gymAdd'); if(add) add.onclick=()=>{
    const name=$('gymName').value.trim(); if(!name) return alert('Escribe nombre de rutina');
    const it={ id:'gym'+Date.now(), name, cat:$('gymCategory').value||'gym', day:$('gymDay').value, start:$('gymStart').value, end:$('gymEnd').value, color:$('gymColor').value, place:$('gymPlace').value.trim(), exercises:$('gymExercises').value.trim() };
    if(it.start>=it.end) return alert('Hora inicio debe ser antes que fin');
    if(!gymCheckPool(it.place)) return;
    if(!TRAINING_CATS[it.cat]) it.cat='gym';
    getGymData().items.push(it); scheduleSave(); $('gymName').value=''; $('gymExercises').value=''; renderGymList(); renderGymWeekGrid(); renderGymTodayBox(); renderGymStatsBox(); renderGymPlacesBox(); renderLuna();
  };
  const upd=$('gymUpdate'); if(upd) upd.onclick=()=>{
    const it=getGymData().items.find(x=>x.id===gymEditingId); if(!it) return;
    const newPlace=$('gymPlace').value.trim();
    if(!gymCheckPool(newPlace)) return;
    it.name=$('gymName').value.trim(); it.cat=$('gymCategory').value||it.cat; it.day=$('gymDay').value; it.start=$('gymStart').value; it.end=$('gymEnd').value; it.color=$('gymColor').value; it.place=newPlace; it.exercises=$('gymExercises').value.trim();
    delete it._legacyPool;
    if(!TRAINING_CATS[it.cat]) it.cat='gym';
    scheduleSave(); gymEditingId=null; $('gymAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('gymCancel').classList.add('hidden'); $('gymName').value=''; $('gymExercises').value=''; renderGymList(); renderGymWeekGrid(); renderGymTodayBox(); renderGymStatsBox(); renderGymPlacesBox(); renderLuna();
  };
  const cancel=$('gymCancel'); if(cancel) cancel.onclick=()=>{ gymEditingId=null; $('gymAdd').classList.remove('hidden'); $('gymUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('gymName').value=''; $('gymExercises').value=''; };
}

setTimeout(setupGymDialog, 870);

function setupStudyDialog(){
  const btn=$('btnStudy'); if(btn) btn.onclick=()=>{ $('studyDialog').showModal(); };
  const ct=$('studyCloseTop'), cb=$('studyClose'); if(ct) ct.onclick=()=>$('studyDialog').close(); if(cb) cb.onclick=()=>$('studyDialog').close();
  const tabG=$('tabStudyGeneral'), tabM=$('tabStudyMnemo'), tabS=$('tabStudySpeed'), tabP=$('tabStudyPlan'), tabE=$('tabStudyExam'), tabF=$('tabStudyFocus');
  const pG=$('studyGeneralPanel'), pM=$('studyMnemoPanel'), pS=$('studySpeedPanel'), pP=$('studyPlanPanel'), pE=$('studyExamPanel'), pF=$('studyFocusPanel');
  function show(tab){
    [tabG,tabM,tabS,tabP,tabE,tabF].forEach(b=> b && b.classList.remove('btn-accent'));
    [pG,pM,pS,pP,pE,pF].forEach(p=> p && p.classList.add('hidden'));
    if(tab==='g'){ tabG&&tabG.classList.add('btn-accent'); pG&&pG.classList.remove('hidden'); }
    if(tab==='m'){ tabM&&tabM.classList.add('btn-accent'); pM&&pM.classList.remove('hidden'); }
    if(tab==='s'){ tabS&&tabS.classList.add('btn-accent'); pS&&pS.classList.remove('hidden'); }
    if(tab==='p'){ tabP&&tabP.classList.add('btn-accent'); pP&&pP.classList.remove('hidden'); }
    if(tab==='e'){ tabE&&tabE.classList.add('btn-accent'); pE&&pE.classList.remove('hidden'); }
    if(tab==='f'){ tabF&&tabF.classList.add('btn-accent'); pF&&pF.classList.remove('hidden'); if(typeof renderStudyLog==='function') renderStudyLog(); }
  }
  if(tabG) tabG.onclick=()=> show('g');
  if(tabM) tabM.onclick=()=> show('m');
  if(tabS) tabS.onclick=()=> show('s');
  if(tabP) tabP.onclick=()=> show('p');
  if(tabE) tabE.onclick=()=> show('e');
  if(tabF) tabF.onclick=()=> show('f');
  function saveStudyNote(note){
    const info=todayInfo();
    if(!info) { alert('No se pudo ubicar hoy'); return false; }
    if(info.luna==='dft'){
      const c=cyc(currentCycleYear()); c.dft.nota = (c.dft.nota? c.dft.nota+"\n":"") + note;
    } else {
      const cell=dayCell(info.luna, info.diaN);
      cell.nota = (cell.nota? cell.nota+"\n":"") + note;
    }
    scheduleSave(); if(currentView.tipo==='luna') renderLuna(); else renderDFT();
    return true;
  }
  // Feynman save to today's note
  const feySave=$('studyFeynmanSave');
  if(feySave) feySave.onclick=()=>{
    const topic=$('studyFeynmanTopic').value.trim();
    const text=$('studyFeynmanText').value.trim();
    if(!topic && !text) return alert('Escribe tema y explicación');
    const note = (topic? 'Feynman - '+topic+': ':'') + text;
    if(saveStudyNote(note)){ alert('Guardado en la nota de hoy ✓'); $('studyFeynmanTopic').value=''; $('studyFeynmanText').value=''; }
  };
  // Mnemo generators
  const mnemoIn=$('mnemoInput'), out=$('mnemoOutput');
  const acro=$('mnemoAcronym'), story=$('mnemoStory');
  if(acro) acro.onclick=()=>{
    const words=mnemoIn.value.split(',').map(s=>s.trim()).filter(Boolean);
    if(!words.length) return;
    const acronym=words.map(w=>w[0].toUpperCase()).join('');
    out.textContent='Acrónimo: '+acronym+' → '+words.join(' · ');
  };
  if(story) story.onclick=()=>{
    const words=mnemoIn.value.split(',').map(s=>s.trim()).filter(Boolean);
    if(!words.length) return;
    const connectors=['cruzó','encontró','lanzó','escondió','iluminó','persiguió'];
    let storyText='Imagina: ';
    words.forEach((w,i)=>{
      const conn=connectors[i%connectors.length];
      storyText+= w + (i<words.length-1? ' '+conn+' ' : '. ¡Cuanto más absurdo, mejor!');
    });
    out.textContent=storyText;
  };
  // Speed reading tester
  const speedText=$('speedText'), speedRange=$('speedRange'), speedVal=$('speedValue'), speedDisp=$('speedDisplay'), speedRes=$('speedResult');
  let speedTimer=null, speedIdx=0, speedWords=[];
  function updateSpeedVal(){ if(speedVal) speedVal.textContent=speedRange.value+' ppm'; }
  if(speedRange) speedRange.oninput=updateSpeedVal;
  updateSpeedVal();
  const sStart=$('speedStart'), sStop=$('speedStop');
  if(sStart) sStart.onclick=()=>{
    const text=speedText.value.trim(); if(!text) return;
    speedWords=text.split(/\s+/);
    speedIdx=0;
    const ppm=parseInt(speedRange.value)||300;
    const interval=60000/ppm;
    clearInterval(speedTimer);
    const startTime=Date.now();
    speedTimer=setInterval(()=>{
      if(speedIdx>=speedWords.length){
        clearInterval(speedTimer);
        const elapsed=(Date.now()-startTime)/1000;
        const wpm=Math.round(speedWords.length/(elapsed/60));
        if(speedRes) speedRes.textContent='Leído '+speedWords.length+' palabras en '+elapsed.toFixed(1)+'s ≈ '+wpm+' ppm';
        return;
      }
      if(speedDisp) speedDisp.textContent=speedWords[speedIdx++];
    }, interval);
  };
  if(sStop) sStop.onclick=()=>{ clearInterval(speedTimer); if(speedDisp) speedDisp.textContent='—'; };
  // Chunk trainer (2-4 palabras por fijación)
  const chunkSize=$('chunkSize'), chunkRange=$('chunkRange'), chunkVal=$('chunkValue'), chunkDisp=$('chunkDisplay');
  let chunkTimer=null, chunkIdx=0, chunks=[];
  function updateChunkVal(){ if(chunkVal&&chunkRange) chunkVal.textContent=chunkRange.value+' ppm'; }
  if(chunkRange) chunkRange.oninput=updateChunkVal;
  try{ updateChunkVal(); }catch(e){}
  const cStart=$('chunkStart'), cStop=$('chunkStop');
  if(cStart) cStart.onclick=()=>{
    const text=(speedText&&speedText.value||'').trim(); if(!text) return;
    const words=text.split(/\s+/);
    const n=Math.max(2, Math.min(4, parseInt((chunkSize&&chunkSize.value)||3)));
    chunks=[]; for(let i=0;i<words.length;i+=n) chunks.push(words.slice(i,i+n).join(' '));
    chunkIdx=0;
    const ppm=parseInt((chunkRange&&chunkRange.value)||300);
    const interval=(60000/ppm)*n;
    clearInterval(chunkTimer);
    chunkTimer=setInterval(()=>{
      if(chunkIdx>=chunks.length){ clearInterval(chunkTimer); if(chunkDisp) chunkDisp.textContent='✓ ¡Bloque completo! Sube a '+(n<4?(n+1)+' palabras':'más ppm'); return; }
      if(chunkDisp) chunkDisp.textContent=chunks[chunkIdx++];
    }, interval);
  };
  if(cStop) cStop.onclick=()=>{ clearInterval(chunkTimer); if(chunkDisp) chunkDisp.textContent='—'; };
  // Medición real + comprensión
  let realStart=0, realElapsed=0, realTimer=null, realWords=0;
  const realText=$('speedRealText'), realTimerEl=$('speedRealTimer'), realRes=$('speedRealResult');
  const rStart=$('speedRealStart'), rStop=$('speedRealStop'), rCalc=$('speedRealCalc'), rSave=$('speedRealSave');
  function realTick(){ if(realTimerEl&&realStart) realTimerEl.textContent=((Date.now()-realStart)/1000).toFixed(1)+'s'; }
  if(rStart) rStart.onclick=()=>{
    const t=(realText&&realText.value||'').trim(); if(!t) return alert('Pega un texto para medir');
    realWords=t.split(/\s+/).length;
    realStart=Date.now(); realElapsed=0; clearInterval(realTimer);
    realTimer=setInterval(realTick,100);
    if(realRes) realRes.textContent='Leyendo '+realWords+' palabras… cuando termines pulsa “Terminé” y escribe tus 3 ideas.';
    try{ realText.readOnly=true; }catch(e){}
  };
  function calcReal(){
    if(!realStart) return alert('Primero pulsa “Empezar a leer”');
    clearInterval(realTimer);
    realElapsed=(Date.now()-realStart)/1000;
    if(realTimerEl) realTimerEl.textContent=realElapsed.toFixed(1)+'s';
    try{ if(realText) realText.readOnly=false; }catch(e){}
    const ppm=realElapsed>0? Math.round(realWords/(realElapsed/60)) : 0;
    const recall=(($('speedRecall')||{}).value||'').trim();
    const ideas=recall? recall.split(/[,;.\n]+/).map(s=>s.trim()).filter(s=>s.length>1).length : 0;
    const comp=ideas>=3? 90 : ideas===2? 70 : ideas===1? 40 : 15;
    let nivel= ppm<180? 'ritmo denso (normal en textos difíciles)' : ppm<280? 'promedio de estudio ✓' : ppm<400? 'fluido ✓' : 'repaso/skimming';
    let consejo= comp>=70? (ppm>=450? 'Vas muy rápido pero comprendes: úsalo solo para repaso.' : 'Buen equilibrio. Prueba +20 ppm la próxima semana.') : 'Comprensión baja: baja 50 ppm, usa dedo-guía y pregunta antes de leer. La meta es 70%+.';
    const txt='📊 '+realWords+' palabras en '+realElapsed.toFixed(1)+'s ≈ '+ppm+' ppm ('+nivel+')\n🧠 Recuerdo: '+(recall||'—')+' → ~'+comp+'% comprensión\n👉 '+consejo;
    if(realRes) realRes.textContent=txt;
    realStart=0;
    return txt;
  }
  if(rStop) rStop.onclick=()=>{ if(realStart){ clearInterval(realTimer); realElapsed=(Date.now()-realStart)/1000; if(realTimerEl) realTimerEl.textContent=realElapsed.toFixed(1)+'s'; try{ if(realText) realText.readOnly=false; }catch(e){} if(realRes) realRes.textContent='⏱️ '+realElapsed.toFixed(1)+'s. Ahora escribe tus 3 ideas sin mirar y pulsa Calcular.'; } };
  if(rCalc) rCalc.onclick=()=>{ if(realStart){ calcReal(); } else if(realElapsed>0){ const t=(realText&&realText.value||'').trim(); realWords=t? t.split(/\s+/).length: realWords; const keepStart=realStart; realStart=Date.now()-realElapsed*1000; const out=calcReal(); realStart=keepStart; } else return alert('Primero mide tu lectura'); };
  if(rSave) rSave.onclick=()=>{
    const txt=(realRes&&realRes.textContent||'').trim();
    if(!txt || txt.indexOf('Aún sin medir')>=0) return alert('Primero calcula tu resultado');
    if(saveStudyNote('Lectura veloz:\n'+txt)) alert('Guardado en nota de hoy ✓');
  };
  const spSave=$('speedPlanSave');
  if(spSave) spSave.onclick=()=>{
    if(saveStudyNote('Plan lectura 7 días: D1-2 RSVP 300 + 3 ideas · D3-4 bloques 2 + Z 5min · D5 bloques 3 a 320 sin regresiones · D6 medición real · D7 descanso. Regla: +20 ppm/semana si comprensión ≥70%.')) alert('Plan guardado ✓');
  };
  // Plan semanal generator
  const planGen=$('studyPlanGen'), planOut=$('studyPlanOutput');
  function getStudyPlanText(){
    const raw=(($('studyPlanRamos')||{}).value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const ramos=raw.length?raw:['mate','lenguaje','inglés'];
    const minDia=Math.max(15, Math.min(240, parseInt(($('studyPlanMin')||{}).value)||50));
    const dias=Math.max(1, Math.min(7, parseInt(($('studyPlanDias')||{}).value)||5));
    const bloques25=Math.max(1, Math.round(minDia/25));
    const names=['lun','mar','mié','jue','vie','sáb','dom'];
    let txt='Mi plan ('+minDia+' min × '+dias+' días = '+(minDia*dias)+' min/sem):\n';
    for(let d=0; d<dias; d++){
      const ramo=ramos[d%ramos.length];
      txt+='• '+names[d]+': '+ramo+' '+bloques25+'×25min (';
      txt+= (d%2===0? 'recuperación activa + Feynman':'intercalado + repaso 1-3-7') + ')\n';
    }
    txt+='Regla: difícil primero, 4 pomodoros = pausa larga. Repasa día 1-3-7-14.';
    return txt;
  }
  if(planGen) planGen.onclick=()=>{ if(planOut) planOut.textContent=getStudyPlanText(); };
  const planSave=$('studyPlanSave');
  if(planSave) planSave.onclick=()=>{
    const txt=(planOut&&planOut.textContent.trim())? planOut.textContent.trim() : getStudyPlanText();
    if(planOut) planOut.textContent=txt;
    if(saveStudyNote('Plan estudio:\n'+txt)) alert('Plan guardado en nota de hoy ✓');
  };
  // Checklist sesión
  const ckSave=$('studyCkSave');
  if(ckSave) ckSave.onclick=()=>{
    const ids=['studyCkMeta','studyCkCelu','studyCkAgua','studyCkTimer'];
    const ok=ids.filter(id=>{ const el=$(id); return el&&el.checked; }).length;
    if(saveStudyNote('Sesión estudio checklist '+ok+'/4 ✓ (meta, celu lejos, agua, timer 25)')) alert(ok===4? '¡Sesión lista! Parte con 25 min ✓' : 'Guardado '+ok+'/4 — ideal 4/4 antes de partir');
  };
  // Simulacro 5 min
  let simTimer=null, simLeft=300;
  const simDisp=$('studySimDisplay');
  function simPaint(){ if(simDisp) simDisp.textContent=Math.floor(simLeft/60)+':'+String(simLeft%60).padStart(2,'0'); }
  const simStart=$('studySimStart'), simStop=$('studySimStop'), simSave=$('studySimSave');
  if(simStart) simStart.onclick=()=>{
    simLeft=300; simPaint(); clearInterval(simTimer);
    simTimer=setInterval(()=>{ simLeft--; simPaint(); if(simLeft<=0){ clearInterval(simTimer); alert('¡Tiempo! Ahora corrige con tus apuntes y anota qué faltó.'); } },1000);
  };
  if(simStop) simStop.onclick=()=>{ clearInterval(simTimer); simLeft=300; simPaint(); };
  if(simSave) simSave.onclick=()=>{
    const q=($('studySimQ').value||'').trim(), a=($('studySimA').value||'').trim();
    if(!q && !a) return alert('Escribe pregunta y respuesta');
    if(saveStudyNote('Simulacro 5min — '+q+'\nR: '+a)){ alert('Simulacro guardado ✓'); $('studySimQ').value=''; $('studySimA').value=''; }
  };
  // Registro sesiones local por usuario
  window.renderStudyLog=function(){
    try{
      const u=userData(); if(!u.studyLog) u.studyLog=[];
      const list=$('studyLogList'), tot=$('studyLogTotal');
      if(!list) return;
      const items=u.studyLog.slice(-10).reverse();
      list.innerHTML=items.length? items.map(function(s){ return '<div class="habit-row"><span>📚 '+String(s.t||'estudio').replace(/</g,'&lt;')+'</span><span class="chip">'+s.m+' min · '+s.f+'</span></div>'; }).join('') : '<p class="muted su-11a508">Sin sesiones aún. Suma tu primera de 25 min 👆</p>';
      const weekAgo=Date.now()-7*864e5;
      const weekMin=u.studyLog.filter(s=> (s.ts||0)>=weekAgo).reduce((a,s)=> a+(parseInt(s.m)||0),0);
      if(tot) tot.textContent='Total últimos 7 días: '+weekMin+' min ('+(weekMin/25).toFixed(1)+' pomodoros) · Total histórico: '+u.studyLog.length+' sesiones';
    }catch(e){}
  };
  const logAdd=$('studyLogAdd');
  if(logAdd) logAdd.onclick=()=>{
    const t=($('studyLogTema').value||'').trim()||'estudio';
    const m=Math.max(5, Math.min(180, parseInt($('studyLogMin').value)||25));
    const u=userData(); if(!u.studyLog) u.studyLog=[];
    let f='hoy'; try{ f=cal.fmtKey.format(new Date()); }catch(e){}
    u.studyLog.push({ t:t.slice(0,60), m:m, f:f, ts:Date.now() });
    scheduleSave(); $('studyLogTema').value=''; renderStudyLog();
  };
  const logClear=$('studyLogClear');
  if(logClear) logClear.onclick=()=>{
    if(!confirm('¿Borrar sesiones de los últimos 7 días?')) return;
    const u=userData(); const weekAgo=Date.now()-7*864e5;
    u.studyLog=(u.studyLog||[]).filter(s=> (s.ts||0)<weekAgo);
    scheduleSave(); renderStudyLog();
  };
  try{ renderStudyLog(); }catch(e){}
  show('g');
}

setTimeout(setupStudyDialog, 872);


// === SUEÑOS — Diario aparte (no se guardan en notas del día) ===
// El guardado real vive en nuevos-modulos.js (setupSuenos → suenosLog).
// Aquí solo abrimos el diálogo e intención; dreamSave lo maneja el Diario.
function setupDreamsDialog(){
  const btn=$('btnDreams'); if(btn) btn.onclick=()=>{
    const d=userData();
    if($('dreamIntention')) $('dreamIntention').value=d.dreamIntention||"";
    if($('dreamText')) $('dreamText').value="";
    try{ if($('suePlusFecha') && !$('suePlusFecha').value) $('suePlusFecha').value = cal.fmtKey.format(new Date()); }catch(e){}
    try{ if($('dreamCancelEdit')) $('dreamCancelEdit').classList.add('hidden'); }catch(e){}
    try{ if(typeof renderSuenosPlus==='function') renderSuenosPlus(); }catch(e){}
    $('dreamsDialog').showModal();
  };
  const ct=$('dreamsCloseTop'), cb=$('dreamsClose'); if(ct) ct.onclick=()=>$('dreamsDialog').close(); if(cb) cb.onclick=()=>$('dreamsDialog').close();
  const setInt=$('dreamSetIntention'); if(setInt) setInt.onclick=()=>{
    const v=$('dreamIntention').value.trim();
    const d=userData(); d.dreamIntention=v; scheduleSave();
    const st=$('dreamStatus'); if(st) st.textContent=v?"Intención fijada ✓ — repítela al acostarte.":"Intención borrada.";
    setTimeout(()=>{ if(st) st.textContent=""; },2500);
  };
  // NOTA: no se asigna $('dreamSave').onclick aquí a propósito.
  // setupSuenos() guarda en el Diario aparte (suenosLog), separado de las notas.
}
setTimeout(setupDreamsDialog, 865);


// === CUENTOS LUNARES ===
// Para agregar más audios a futuro basta agregar una línea aquí:
//   8: 'assets/cuentos/luna08.mp3',
// y subir el mp3 a assets/cuentos/. Todo lo demás (botón, progreso, voz) es automático.
const TALES_AUDIO = {
  1: 'assets/cuentos/luna01.mp3',
  2: 'assets/cuentos/luna02.mp3',
  3: 'assets/cuentos/luna03.mp3',
  4: 'assets/cuentos/luna04.mp3',
  5: 'assets/cuentos/luna05.mp3',
  6: 'assets/cuentos/luna06.mp3',
  7: 'assets/cuentos/luna07.mp3',
  11: 'assets/cuentos/luna11.mp3'
};
const DEFAULT_TALES = [
  { n:1, nombre:'We Tripantü Küyen', titulo:'El fuego que no se apaga', texto:'En la noche más larga, la machi Rayén reunió a los niños alrededor del fogón de Penco. Afuera llovía fuerte sobre el golfo y las olas golpeaban Lirquén. “Esta luna guarda el fuego —dijo—. No es para quemar, sino para recordar”. Les entregó a cada uno una semilla de peumo: “Guárdenla seca, oscura y sin apuro. Como el sol ahora, parece dormida, pero late”. El niño Antü guardó la suya en una cajita de quila. Cada noche la miraba antes de dormir, aprendiendo la paciencia del invierno. En esa espera, comprendió que guardar también es sembrar.', moral:'Paciencia y cuidado — lo que se guarda con amor, brota a su tiempo.', audio:'assets/cuentos/luna01.mp3' },
  { n:2, nombre:'Llitunül Wilki Küyen', titulo:'El zorzal que enseñó a escuchar', texto:'En la luna del zorzal, el canto despertaba a Penco antes que el sol. Millaray decía que no oía nada, hasta que su abuelo la llevó al humedal al amanecer, con frío y neblina. Se quedaron inmóviles. Primero un zorzal, luego dos, luego un coro. “Si caminas apurada, el canto pasa por encima —dijo el abuelo—. Si respiras con la niebla, el canto entra”. Desde entonces Millaray abría la ventana cada mañana y, antes de mirar el celular, escuchaba. Su día empezaba afinado, como un instrumento.', moral:'Escuchar es un oficio — quien hace silencio, entiende el día.' },
  { n:3, nombre:'Llitun Pofpof Anümka Küyen', titulo:'Las manos brotadas', texto:'La tierra de Nahuelbuta olía a brote. En la escuela, cada niño hizo un almácigo en una cáscara de huevo. Ñarki lo regaba todos los días tres veces, impaciente. “Así se ahoga”, le dijo su tía, y le enseñó a tocar la tierra: si brilla, no pide; si se quiebra, tiene sed. A los diez días, un tallo verde asomó. Ñarki no gritó; sonrió largo, como si él mismo hubiera brotado. Entendió que cuidar es medir, no apurar.', moral:'Cuidado atento — la tierra responde a la mano que observa.' },
  { n:4, nombre:'Rayen Awar Küyen', titulo:'La flor que no se corta', texto:'Los cerros de Penco se pintaron de copihue. Ana quería cortar el más lindo para su pieza. Su mamá la llevó donde crecía y le mostró el camino de la semilla: flor → fruto → pájaro → bosque. “Si lo cortas hoy, mañana no hay flor ni bosque —dijo—. Míralo, dibújalo, agradece, deja su semilla”. Ana lo fotografió a contraluz y lo dibujó en su cuaderno. El copihue siguió colgando, y en el verano los colibríes lo visitaron frente a su ventana.', moral:'Respeto — admirar sin poseer deja que la belleza siga.' },
  { n:5, nombre:'Longkon Kachilla Küyen', titulo:'Las viajeras del humedal', texto:'Llegaron las aves migratorias al Rocuant. El curso de Elka hizo un mapa con hilos: desde el norte de América hasta Penco. “¿Cómo saben dónde es Penco sin GPS?”, preguntó Elka. La profesora les mostró el viento, la luna y el instinto. Cada niña eligió un ave y la esperó sin ruido. Cuando un zarapito bajó a la orilla, todas contuvieron el aliento. No aplaudieron; anotaron. Aprendieron que el mundo es una casa con muchos patios, y que Penco es patio de muchos.', moral:'Pertenece a una ruta mayor — cuidar el humedal es cuidar el camino de otros.' },
  { n:6, nombre:'Karü Kachilla Küyen', titulo:'Nudos que salvan', texto:'Era luna de preparar artes. Don Heraldo, pescador de Lirquén, enseñó a hacer nudos a los jóvenes. “Un nudo mal hecho pierde pescado y deja tarraya en el mar —dijo—. Un nudo bien hecho da de comer y no contamina”. Cada uno practicó diez veces el mismo. Al principio se enredaban, luego la mano recordaba sola. Guardaron las redes remendadas y anotaron la veda en el calendario. Entendieron que el mar se pesca con respeto y con manos aprendidas.', moral:'Oficio y respeto — la técnica bien hecha cuida el sustento.' },
  { n:7, nombre:'Kudewallüng Küyen', titulo:'Luciérnagas de verano', texto:'En la noche de luciérnagas, Penco no necesitó faroles. Los niños entraron al bosque nativo sin linterna, por el sendero entre boldos y peumos: la tierra aún tibia, el cielo naranja después de la puesta. Jugaron a contar luces: una, tres, diez. “No las atrapen —dijo la tía—. Si las miran sin tocar, vuelven”. Se acostaron boca arriba en un claro. El bosque crujía suave y las luces parecían estrellas bajas. Se durmieron con la sensación de que el verano era una respiración larga.', moral:'Asombro sin captura — hay luces que solo viven si no se encierran.' },
  { n:8, nombre:'Püramuwün Kachilla Küyen · Are Küyen', titulo:'La mesa larga', texto:'Era luna de cosecha y el calor apretaba. En la población, la vecina Rosa hizo una mesa larga con lo cosechado: tomates, choclos, pimientos y pan amasado. Cada familia llevó algo y se sirvieron sin contar. “¿Y si falta?”, preguntó un niño. “Si falta, alcanzamos menos, pero comimos juntos —dijo Rosa—. Eso también es abundancia”. Comieron hasta tarde, con el sol demorándose tras los cerros. Sobró poco, y ese poco fue semilla.', moral:'Abundancia compartida — cosechar es repartir.' },
  { n:9, nombre:'Trüntarü Küyen', titulo:'El dulce que fermenta', texto:'En la vendimia del valle, el abuelo mostró dos frascos: uno con uva pisada hoy, otro fermentando hace días. “Hoy es dulce —dijo—. En unos días será chicha; si esperas más, será vinagre. Todo a su tiempo”. Dejó a cada nieto revolver el mosto y probar con la punta del dedo. Olía a verano que cambiaba de nombre. Aprendieron que madurar no es apurarse ni atrasarse: es estar atentos al punto justo.', moral:'Tiempo justo — madurar es saber cuándo detener la mano.' },
  { n:10, nombre:'Ngülliw Küyen', titulo:'El bosque que cambia de ropa', texto:'El bosque se volvió rojo y amarillo. La profesora llevó a los niños a recoger hojas y clasificarlas por color, sin arrancar ramas. “El árbol no se muere —dijo—, se guarda. Como nosotros cuando guardamos la ropa de verano”. Cada hoja en el herbário tenía fecha y luna. Al volver, escribieron qué soltarían ellos ese otoño: el apuro, una pelea, el miedo a preguntar. Dejar caer, como el bosque, también es crecer.', moral:'Soltar — como el otoño, desprenderse deja espacio nuevo.' },
  { n:11, nombre:'Malliñ Ko Küyen', titulo:'Los piñones del abuelo', texto:'En precordillera, el abuelo pehuenche enseñó a golpear la araucaria con vara larga, no a cortar. Cayó una lluvia de piñones. “Uno para el suelo, uno para el chucao, uno para nosotros”, contaba. Los niños pelaron piñones al fuego y los comieron con miel. Guardaron un saco para el invierno. Entendieron que la cosecha tiene medida: si tomas todo, el bosque no vuelve.', moral:'Cosecha con medida — tomar solo parte deja futuro.', audio:'assets/cuentos/luna11.mp3' },
  { n:12, nombre:'Trangliñ Küyen', titulo:'La helada que enseña', texto:'Llegó la primera helada y los almácigos amanecieron blancos. Martín corrió a mojarlos al sol. “No —dijo su mamá—, así se quiebran. Que se descongelen solos, a la sombra”. Cubrieron con malla y esperaron. Dos plantines se salvaron, uno no. Martín anotó en el calendario: tapar antes de las 18 h. Aprendió a anticipar en vez de lamentar, y que el frío también es maestro.', moral:'Previsión — la helada avisa; quien cubre a tiempo, salva.' },
  { n:13, nombre:'Mawün Kürüf Küyen', titulo:'El viento que cierra el círculo', texto:'La última luna trajo lluvia y viento fuerte sobre la bahía. La casa crujía y el fuego era refugio. La abuela sacó el cuaderno del ciclo: “¿Qué sembraron, qué cosecharon, qué agradecen?”. Cada uno dijo una memoria. Luego soplaron una vela y estuvieron un minuto a oscuras, escuchando el viento. Cuando la volvieron a encender, el año parecía lavado, listo para el fuego nuevo del We Tripantu.', moral:'Memoria y cierre — nombrar lo vivido hace lugar a lo que viene.' }
];
function getTalesData(){
  const u=userData();
  if(!u.tales) u.tales={ edits:{} };
  if(!u.tales.edits || typeof u.tales.edits!=='object') u.tales.edits={};
  return u.tales;
}
function getEffectiveTales(){
  const edits=getTalesData().edits;
  return DEFAULT_TALES.map(d=>{
    const ov=edits[String(d.n)];
    const audio = d.audio || TALES_AUDIO[d.n] || null;
    if(!ov) return Object.assign({}, d, { audio });
    return { n:d.n, nombre: ov.nombre||d.nombre, titulo: ov.titulo||d.titulo, texto: ov.texto||d.texto, moral: ov.moral||d.moral, audio };
  });
}
function talesFmtTime(s){
  if(!isFinite(s) || s==null || s<0) return '0:00';
  s=Math.floor(s);
  const m=Math.floor(s/60), r=s%60;
  return m+':'+String(r).padStart(2,'0');
}
function talesAudioHtml(t){
  if(!t || !t.audio) return '';
  const src=String(t.audio).replace(/"/g,'');
  return '<div class="tales-player" data-src="'+src+'" data-luna="'+t.n+'">'
    +'<button type="button" class="btn btn-accent tales-play su-30e741" aria-label="Escuchar cuento Luna '+t.n+'" aria-pressed="false">▶ Escuchar</button>'
    +'<button type="button" class="btn tales-stop su-30e741 hidden" aria-label="Detener">⏹</button>'
    +'<input type="range" class="tales-seek" min="0" max="1000" value="0" step="1" aria-label="Avanzar en el audio" disabled>'
    +'<span class="tales-time muted" aria-live="off">0:00 / 0:00</span>'
    +'<select class="tales-rate" aria-label="Velocidad de reproducción" title="Velocidad">'
    +'<option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option>'
    +'</select>'
    +'<span class="tales-status muted"></span>'
    +'</div>';
}
let _talesAudio=null, _talesPlayer=null, _talesSeeking=false;
function talesSetPlayUI(player, mode){
  // mode: idle | loading | playing | paused | error
  if(!player) return;
  const play=player.querySelector('.tales-play');
  const stop=player.querySelector('.tales-stop');
  const status=player.querySelector('.tales-status');
  if(play){
    play.disabled = (mode==='loading');
    play.setAttribute('aria-pressed', mode==='playing' ? 'true' : 'false');
    play.innerHTML = mode==='loading' ? '⏳ Cargando…' : mode==='playing' ? '⏸ Pausar' : mode==='paused' ? '▶ Seguir' : '▶ Escuchar';
    play.setAttribute('aria-label', mode==='playing' ? 'Pausar cuento' : mode==='paused' ? 'Seguir escuchando' : 'Escuchar cuento Luna '+(player.dataset.luna||''));
  }
  if(stop) stop.classList.toggle('hidden', !(mode==='playing'||mode==='paused'||mode==='loading'));
  if(status && mode==='idle') status.textContent='';
}
function talesStopAudio(){
  try{ if(_talesAudio){ _talesAudio.pause(); _talesAudio.src=''; _talesAudio.load(); _talesAudio=null; } }catch{}
  try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch{}
  try{
    document.querySelectorAll('.tales-player').forEach(p=>{
      talesSetPlayUI(p,'idle');
      const seek=p.querySelector('.tales-seek'); if(seek){ seek.value='0'; seek.disabled=true; }
      const tm=p.querySelector('.tales-time'); if(tm) tm.textContent='0:00 / 0:00';
    });
  }catch{}
  _talesPlayer=null;
}
function talesSpeakFallback(t, player){
  try{
    if(!('speechSynthesis' in window)) { alert('Tu dispositivo no tiene voz disponible'); return; }
    speechSynthesis.cancel();
    const txt = t.titulo+'. '+t.texto+' Moraleja: '+t.moral;
    const u = new SpeechSynthesisUtterance(txt);
    u.lang='es-CL'; u.rate=1; u.pitch=1;
    try{
      const vs=speechSynthesis.getVoices()||[];
      const es=vs.find(v=>/es[-_]CL/i.test(v.lang||'')) || vs.find(v=>/^es/i.test(v.lang||''));
      if(es) u.voice=es;
    }catch{}
    const status=player?player.querySelector('.tales-status'):null;
    const play=player?player.querySelector('.tales-play'):null;
    if(status) status.textContent='🗣 voz del dispositivo… tócala de nuevo para detener';
    if(play){ play.innerHTML='⏹ Detener voz'; play.disabled=false; }
    u.onend=()=>{ try{ talesStopAudio(); }catch{} };
    u.onerror=()=>{ try{ talesStopAudio(); }catch{} };
    if(player){
      play.onclick=()=>{ try{ speechSynthesis.cancel(); }catch{} talesStopAudio(); talesBindAudioButtons(player.parentNode||document); };
    }
    speechSynthesis.speak(u);
  }catch(e){ alert('No se pudo usar la voz del dispositivo'); }
}
function talesBindAudioButtons(root){
  if(!root || !root.querySelectorAll) return;
  let savedRate='1';
  try{ savedRate=localStorage.getItem('talesRate')||'1'; }catch{}
  root.querySelectorAll('.tales-player').forEach(player=>{
    if(player.dataset.bound==='1') return;
    player.dataset.bound='1';
    const src=player.dataset.src;
    const lunaN=parseInt(player.dataset.luna||'0',10);
    const playBtn=player.querySelector('.tales-play');
    const stopBtn=player.querySelector('.tales-stop');
    const seek=player.querySelector('.tales-seek');
    const timeEl=player.querySelector('.tales-time');
    const rateSel=player.querySelector('.tales-rate');
    const statusEl=player.querySelector('.tales-status');
    if(rateSel && ['0.75','1','1.25','1.5'].indexOf(savedRate)>=0) rateSel.value=savedRate;
    const getTale=()=>{ try{ return getEffectiveTales().find(x=>x.n===lunaN); }catch{ return null; } };
    const ensureAudio=()=>{
      if(_talesAudio && _talesPlayer===player) return _talesAudio;
      talesStopAudio();
      const a=new Audio();
      a.preload='metadata';
      a.src=src;
      try{ a.playbackRate=parseFloat(rateSel?rateSel.value:'1')||1; }catch{}
      _talesAudio=a; _talesPlayer=player;
      a.addEventListener('loadedmetadata',()=>{
        try{
          if(seek){ seek.disabled=false; }
          if(timeEl) timeEl.textContent='0:00 / '+talesFmtTime(a.duration);
          if(statusEl) statusEl.textContent='';
        }catch{}
      });
      a.addEventListener('timeupdate',()=>{
        if(_talesSeeking) return;
        try{
          if(a.duration && seek){ seek.value=String(Math.round(1000*a.currentTime/a.duration)); }
          if(timeEl) timeEl.textContent=talesFmtTime(a.currentTime)+' / '+talesFmtTime(a.duration);
        }catch{}
      });
      a.addEventListener('play',()=>talesSetPlayUI(player,'playing'));
      a.addEventListener('pause',()=>{ if(a.ended) return; talesSetPlayUI(player,'paused'); });
      a.addEventListener('ended',()=>{ talesStopAudio(); });
      a.addEventListener('error',()=>{
        talesSetPlayUI(player,'error');
        if(statusEl) statusEl.innerHTML='';
        const t=getTale();
        const retry=document.createElement('button');
        retry.type='button'; retry.className='btn su-30e741';
        retry.textContent='↻ Reintentar';
        retry.onclick=(ev)=>{ try{ev.preventDefault();}catch{} player.dataset.bound=''; talesStopAudio(); talesBindAudioButtons(player.parentNode||document); const pb=player.querySelector('.tales-play'); if(pb) pb.click(); };
        const voice=document.createElement('button');
        voice.type='button'; voice.className='btn su-30e741';
        voice.textContent='🗣 Escuchar con voz';
        voice.onclick=(ev)=>{ try{ev.preventDefault();}catch{} if(t) talesSpeakFallback(t, player); };
        if(statusEl){ statusEl.textContent='⚠️ No se pudo cargar el audio. '; statusEl.appendChild(retry); statusEl.appendChild(document.createTextNode(' ')); statusEl.appendChild(voice); }
        else alert('No se pudo reproducir el audio');
        _talesAudio=null; _talesPlayer=null;
      });
      return a;
    };
    if(playBtn) playBtn.onclick=()=>{
      try{
        // Si hay voz TTS sonando, detenerla
        if(window.speechSynthesis && speechSynthesis.speaking){ speechSynthesis.cancel(); talesStopAudio(); player.dataset.bound=''; talesBindAudioButtons(player.parentNode||document); return; }
        const a=ensureAudio();
        if(a.paused){
          talesSetPlayUI(player,'loading');
          if(statusEl) statusEl.textContent='⏳ Cargando audio…';
          const pr=a.play();
          if(pr && pr.then) pr.then(()=>{ if(statusEl) statusEl.textContent=''; }).catch(()=>{
            // Autoplay bloqueado o archivo inaccesible: ofrecer voz
            talesSetPlayUI(player,'error');
            const t=getTale();
            if(statusEl){
              statusEl.textContent='⚠️ Toca de nuevo o usa la voz: ';
              const v=document.createElement('button');
              v.type='button'; v.className='btn su-30e741'; v.textContent='🗣 Voz';
              v.onclick=(ev)=>{ try{ev.preventDefault();}catch{} if(t) talesSpeakFallback(t, player); };
              statusEl.appendChild(v);
            }
          });
        } else {
          a.pause();
        }
      }catch(e){ talesStopAudio(); }
    };
    if(stopBtn) stopBtn.onclick=()=>{ talesStopAudio(); };
    if(seek){
      seek.addEventListener('pointerdown',()=>{ _talesSeeking=true; });
      seek.addEventListener('pointerup',()=>{ _talesSeeking=false; });
      seek.addEventListener('change',()=>{
        try{
          if(_talesAudio && _talesPlayer===player && _talesAudio.duration){
            _talesAudio.currentTime=(_talesAudio.duration*parseInt(seek.value||'0',10))/1000;
          }
        }catch{} finally{ _talesSeeking=false; }
      });
      // Teclado: flechas ya mueven el range; aplicar seek con keyup también
      seek.addEventListener('keyup',()=>{
        try{
          if(_talesAudio && _talesPlayer===player && _talesAudio.duration){
            _talesAudio.currentTime=(_talesAudio.duration*parseInt(seek.value||'0',10))/1000;
          }
        }catch{}
      });
    }
    if(rateSel) rateSel.onchange=()=>{
      try{
        const v=rateSel.value;
        localStorage.setItem('talesRate', v);
        document.querySelectorAll('.tales-rate').forEach(s=>{ s.value=v; });
        if(_talesAudio) _talesAudio.playbackRate=parseFloat(v)||1;
      }catch{}
    };
  });
}
const TALES = DEFAULT_TALES;
let talesEditingN=null;
function talesReaderHtml(t, badge){
  const badgeHtml = badge ? ' <span class="chip su-0d5be0">'+badge+'</span>' : '';
  const trad = (typeof MOONS!=='undefined' && MOONS[t.n-1]) ? ' · '+escapeHtml(MOONS[t.n-1].traduccion) : '';
  return '<div class="tales-head"><h4 class="su-e39eba">🌙 Luna '+t.n+' — '+escapeHtml(t.titulo)+badgeHtml+'</h4>'+talesAudioHtml(t)+'</div>'
    +'<p class="su-1fd8c8">'+escapeHtml(t.nombre)+trad+'</p>'
    +'<p class="su-a46e7d tales-texto">'+escapeHtml(t.texto)+'</p>'
    +'<p class="su-c6ec8a"><b>Moraleja:</b> <i>'+escapeHtml(t.moral)+'</i></p>'
    +'<div class="dlg-actions su-d6c2a3"><button type="button" class="btn btn-accent tales-edit-btn su-30e741">✏️ Editar este cuento</button></div>';
}
function ensureTaleLunaDialog(){
  let dlg=$('taleLunaDialog');
  if(dlg) return dlg;
  try{ if(window.cal13tpl && typeof window.cal13tpl.inyectar==='function'){ dlg=window.cal13tpl.inyectar('taleLunaDialog'); } }catch{}
  if(dlg) return dlg;
  // Respaldo: crearla a mano si el bundle aún no la trae (caché vieja / file://)
  try{
    dlg=document.createElement('dialog');
    dlg.id='taleLunaDialog';
    dlg.innerHTML='<form method="dialog"><div class="dlg-actions"><h3 id="taleLunaTitle">🌙 Cuento</h3><button type="button" id="taleLunaCloseTop" class="btn btn-icon" title="Cerrar" aria-label="Cerrar">✕</button></div><p id="taleLunaMeta" class="muted"></p><div id="taleLunaPlayer"></div><div id="taleLunaView"><p id="taleLunaTexto"></p><p><b>Moraleja:</b> <i id="taleLunaMoral"></i></p><div class="dlg-actions"><button type="button" id="taleLunaEditBtn" class="btn btn-accent">✏️ Editar este cuento</button></div></div><div id="taleLunaEditBox" class="menstrual-card hidden"><h4>✏️ Editar cuento — Luna <span id="taleLunaEditN"></span></h4><label>Título <input type="text" id="taleLunaEditTitle" maxlength="60"></label><label>Cuento <textarea id="taleLunaEditText" rows="6"></textarea></label><label>Moraleja <input type="text" id="taleLunaEditMoral" maxlength="80"></label><div class="dlg-actions"><button type="button" id="taleLunaSave" class="btn btn-accent">💾 Guardar cuento</button><button type="button" id="taleLunaRestore" class="btn">↺ Restaurar original</button><button type="button" id="taleLunaCancelEdit" class="btn">Cancelar</button></div></div><div class="dlg-actions"><button type="button" id="taleLunaClose" class="btn">Cerrar</button></div></form>';
    document.body.appendChild(dlg);
  }catch{}
  return dlg;
}
function paintTaleLunaWindow(n, mode){
  const eff=getEffectiveTales();
  const t=eff.find(x=>x.n===n);
  if(!t) return;
  talesEditingN=n;
  talesStopAudio();
  const dlg=ensureTaleLunaDialog();
  if(!dlg) return;
  const title=$('taleLunaTitle'), meta=$('taleLunaMeta'), player=$('taleLunaPlayer'),
    view=$('taleLunaView'), txt=$('taleLunaTexto'), moral=$('taleLunaMoral'),
    editBox=$('taleLunaEditBox');
  const isEdited=!!getTalesData().edits[String(n)];
  if(title) title.textContent='🌙 Luna '+t.n+' — '+t.titulo+(mode==='saved'?' ✓':'');
  if(meta){
    let trad='';
    try{ trad=(typeof MOONS!=='undefined' && MOONS[t.n-1]) ? ' · '+MOONS[t.n-1].traduccion : ''; }catch{}
    meta.textContent=t.nombre+trad+(isEdited?' · editado':'')+(t.audio?' · 🎧 audio':' · 🔇 audio en camino');
  }
  if(player){
    player.innerHTML='';
    player.dataset.bound='';
    if(t.audio){ player.innerHTML=talesAudioHtml(t); talesBindAudioButtons(player); }
    else { const p=document.createElement('p'); p.className='muted'; p.textContent='🔇 Audio en camino para esta luna — pronto podrás escucharlo aquí.'; player.appendChild(p); }
  }
  if(txt) txt.textContent=t.texto;
  if(moral) moral.textContent=t.moral;
  const showEdit = (mode==='edit');
  if(view) view.classList.toggle('hidden', showEdit);
  if(editBox) editBox.classList.toggle('hidden', !showEdit);
  if(showEdit){
    if($('taleLunaEditN')) $('taleLunaEditN').textContent=n;
    if($('taleLunaEditTitle')) $('taleLunaEditTitle').value=t.titulo;
    if($('taleLunaEditText')) $('taleLunaEditText').value=t.texto;
    if($('taleLunaEditMoral')) $('taleLunaEditMoral').value=t.moral;
  }
}
function openTaleLuna(n, mode){
  paintTaleLunaWindow(n, mode);
  const dlg=ensureTaleLunaDialog();
  if(!dlg) return;
  try{ if(dlg.open) dlg.close(); }catch{}
  try{ dlg.showModal(); }catch{ try{ dlg.setAttribute('open',''); }catch{} }
  try{ dlg.scrollTop=0; }catch{}
}
function renderTalesGrid(){
  const g=$('talesGrid'); if(!g) return;
  const eff=getEffectiveTales();
  g.innerHTML=eff.map(t=>{
    const isEdited = !!getTalesData().edits[String(t.n)];
    const hasAudio = !!t.audio;
    return `<div class="discipline-card tales-card" style="cursor:pointer;${isEdited?'border-color:var(--gold)':''}" data-n="${t.n}" role="button" tabindex="0" aria-label="Abrir cuento Luna ${t.n} en ventana"><h4>🌙 Luna ${t.n} — ${escapeHtml(t.titulo)} ${isEdited?'<span class="chip su-0d5be0">editado</span>':''} ${hasAudio?'<span class="chip su-0d5be0">🎧 audio</span>':'<span class="chip">🔇 pronto</span>'}</h4><p class="su-1fd8c8">${escapeHtml(t.nombre)}</p><p class="muted su-cdff1d">${escapeHtml(t.texto.slice(0,120))}…</p><p class="su-9bc3cd"><i>Moraleja: ${escapeHtml(t.moral)}</i></p></div>`;
  }).join('');
  const openCard=(el)=>{
    const n=parseInt(el.dataset.n||'0',10);
    if(!n) return;
    try{ if($('talesEditBox')) $('talesEditBox').classList.add('hidden'); }catch{}
    openTaleLuna(n);
  };
  g.querySelectorAll('[data-n]').forEach(el=>{
    el.onclick=()=>openCard(el);
    el.onkeydown=(ev)=>{ if(ev.key==='Enter'||ev.key===' '){ try{ev.preventDefault();}catch{} openCard(el); } };
  });
}
function openTalesEdit(n){
  openTaleLuna(n, 'edit');
}
function saveTaleLunaFromWindow(){
  const n=talesEditingN; if(!n) return;
  const ti=$('taleLunaEditTitle'), tx=$('taleLunaEditText'), mo=$('taleLunaEditMoral');
  if(!ti||!tx||!mo) return;
  const title=ti.value.trim(), texto=tx.value.trim(), moral=mo.value.trim();
  if(!texto){ alert('El cuento no puede quedar vacío'); return; }
  const td=getTalesData();
  td.edits[String(n)]={ titulo: title||DEFAULT_TALES[n-1].titulo, texto, moral: moral||DEFAULT_TALES[n-1].moral, nombre: DEFAULT_TALES[n-1].nombre };
  try{ scheduleSave(); }catch{}
  try{ renderTalesGrid(); }catch{}
  paintTaleLunaWindow(n, 'saved');
}
function setupTaleLunaDialog(){
  const dlg=ensureTaleLunaDialog();
  if(!dlg || dlg.dataset.bound==='1') return;
  dlg.dataset.bound='1';
  dlg.addEventListener('close',()=>talesStopAudio());
  const closeTop=$('taleLunaCloseTop'), closeBtn=$('taleLunaClose');
  if(closeTop) closeTop.onclick=()=>{ talesStopAudio(); try{dlg.close();}catch{} };
  if(closeBtn) closeBtn.onclick=()=>{ talesStopAudio(); try{dlg.close();}catch{} };
  const eb=$('taleLunaEditBtn'); if(eb) eb.onclick=()=>paintTaleLunaWindow(talesEditingN,'edit');
  const sv=$('taleLunaSave'); if(sv) sv.onclick=()=>saveTaleLunaFromWindow();
  const rs=$('taleLunaRestore'); if(rs) rs.onclick=()=>{
    const n=talesEditingN; if(!n) return;
    if(!confirm('¿Restaurar cuento original de la Luna '+n+'?')) return;
    const td=getTalesData(); delete td.edits[String(n)];
    try{ scheduleSave(); }catch{}
    try{ renderTalesGrid(); }catch{}
    paintTaleLunaWindow(n);
  };
  const cc=$('taleLunaCancelEdit'); if(cc) cc.onclick=()=>paintTaleLunaWindow(talesEditingN);
}
function setupTalesDialog(){
  const b=$('btnTales'); if(b) b.onclick=()=>{ talesStopAudio(); try{ ensureTaleLunaDialog(); setupTaleLunaDialog(); }catch{} renderTalesGrid(); try{ if($('talesReader')) $('talesReader').classList.add('hidden'); }catch{} try{ if($('talesEditBox')) $('talesEditBox').classList.add('hidden'); }catch{} $('talesDialog').showModal(); };
  const dlg=$('talesDialog'); if(dlg && !dlg.dataset.talesCloseBound){ dlg.dataset.talesCloseBound='1'; dlg.addEventListener('close',()=>{ const w=$('taleLunaDialog'); if(!w || !w.open) talesStopAudio(); }); }
  const ct=$('talesCloseTop'), cb=$('talesClose'); if(ct) ct.onclick=()=>{ talesStopAudio(); try{ const w=$('taleLunaDialog'); if(w&&w.open) w.close(); }catch{} $('talesDialog').close(); }; if(cb) cb.onclick=()=>{ talesStopAudio(); try{ const w=$('taleLunaDialog'); if(w&&w.open) w.close(); }catch{} $('talesDialog').close(); };
  // Caja vieja inline (compat): si quedó visible en caché, redirigir a ventana
  const save=$('talesSave'); if(save) save.onclick=()=>{ const n=talesEditingN; if(!n) return; const title=$('talesEditTitle').value.trim(), texto=$('talesEditText').value.trim(), moral=$('talesEditMoral').value.trim(); if(!texto) return alert('El cuento no puede quedar vacío'); const td=getTalesData(); td.edits[String(n)]={ titulo: title||DEFAULT_TALES[n-1].titulo, texto, moral: moral||DEFAULT_TALES[n-1].moral, nombre: DEFAULT_TALES[n-1].nombre }; try{ scheduleSave(); }catch{} try{ if($('talesEditBox')) $('talesEditBox').classList.add('hidden'); }catch{} try{ renderTalesGrid(); }catch{} openTaleLuna(n,'saved'); };
  const restore=$('talesRestore'); if(restore) restore.onclick=()=>{
    const n=talesEditingN; if(!n) return;
    if(!confirm('¿Restaurar cuento original de la Luna '+n+'?')) return;
    const td=getTalesData(); delete td.edits[String(n)]; try{ scheduleSave(); }catch{}
    try{ if($('talesEditBox')) $('talesEditBox').classList.add('hidden'); }catch{} try{ renderTalesGrid(); }catch{}
    try{ const r=$('talesReader'); if(r) r.classList.add('hidden'); }catch{}
  };
  const cancel=$('talesCancelEdit'); if(cancel) cancel.onclick=()=>{ try{ if($('talesEditBox')) $('talesEditBox').classList.add('hidden'); }catch{} try{ const r=$('talesReader'); if(r) r.classList.add('hidden'); }catch{} };
  try{ setupTaleLunaDialog(); }catch{}
}

// === MEMORIA ===
function getMemoryData(){ try{ const u=userData(); if(!u.memory) u.memory={bestPairs:{},bestSeq:0,bestWords:0,bestNum:0,bestOdd:0,bestSchulte:0,streak:0,lastDay:'',sessions:0}; const m=u.memory; if(!m.bestPairs) m.bestPairs={}; return m; }catch{ return {bestPairs:{},bestSeq:0,bestWords:0,bestNum:0,bestOdd:0,bestSchulte:0,streak:0,lastDay:'',sessions:0}; } }
function memoryTodayKey(){ try{ return cal.fmtKey.format(new Date()); }catch{ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); } }
function memoryTouchDay(){
  const m=getMemoryData(); const t=memoryTodayKey();
  if(m.lastDay!==t){
    const y=new Date(); y.setDate(y.getDate()-1);
    let yk=''; try{ yk=cal.fmtKey.format(y); }catch{ yk=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0'); }
    m.streak = (m.lastDay===yk)? (m.streak||0)+1 : 1;
    m.lastDay=t; m.sessions=(m.sessions||0)+1;
    try{ scheduleSave(); }catch{}
  }
  renderMemoryStreak();
}
function renderMemoryStreak(){
  const bar=$('memoryStreakBar'); if(!bar) return;
  const m=getMemoryData();
  const bp=m.bestPairs||{};
  const fmtP = v=> v? (v.moves+' intentos · '+v.time+'s') : '—';
  bar.innerHTML='🔥 Racha <b>'+(m.streak||0)+' día(s)</b> · 🎮 '+(m.sessions||0)+' sesiones · 🃏 Mejor pares medio: <b>'+fmtP(bp.medio)+'</b> · 🔢 Secuencia: <b>'+(m.bestSeq||0)+'</b> · 📝 Palabras: <b>'+(m.bestWords||0)+'</b> · 👁️ Distinto: <b>'+(m.bestOdd? m.bestOdd+'s':'—')+'</b> · Schulte: <b>'+(m.bestSchulte? m.bestSchulte+'s':'—')+'</b>';
}
function renderMemoryProg(){
  const box=$('memoryProgStats'); if(!box) return;
  const m=getMemoryData(); const bp=m.bestPairs||{};
  const row=(e,v)=> '<div>'+e+' <b>'+v+'</b></div>';
  box.innerHTML='<div class="su-cd99c5">'
    +row('🔥 Racha',(m.streak||0)+' día(s)')+row('🎮 Sesiones',m.sessions||0)
    +row('🃏 Pares fácil',bp.facil? bp.facil.moves+' int · '+bp.facil.time+'s':'—')
    +row('🃏 Pares medio',bp.medio? bp.medio.moves+' int · '+bp.medio.time+'s':'—')
    +row('🃏 Pares difícil',bp.dificil? bp.dificil.moves+' int · '+bp.dificil.time+'s':'—')
    +row('🔢 Secuencia',(m.bestSeq||0)+' nivel')
    +row('📝 Palabras',(m.bestWords||0)+'/máx')
    +row('🔢 Número',(m.bestNum||0)+' dígitos')
    +row('👁️ Distinto 5 rondas',(m.bestOdd? m.bestOdd+'s':'—'))
    +row('🔢 Schulte 5×5',(m.bestSchulte? m.bestSchulte+'s':'—'))
    +'</div><p class="muted su-d47a97">La racha sube 1 vez al día cuando completas cualquier juego. Los récords quedan por usuario, privados y locales.</p>';
}
// --- LOCI ---
const MEMORY_ROUTES={
  casa:['Entrada','Cocina','Living','Baño','Dormitorio'],
  feria:['Portón feria','Puesto verduras','Puesto pescado','Flores','Pan','Quesos','Salida'],
  playa:['Arena','Roca','Poza','Muelle','Bote','Faro','Ola'],
  cuerpo:['Cabeza','Ojos','Boca','Hombros','Manos','Bolsillo','Rodillas','Pies','Espalda','Corazón']
};
const MEMORY_WORD_BANK=['luna','mar','boldo','peumo','lluvia','viento','harina','risa','pez','canela','maqui','lancha','cerro','niebla','copa','semilla','miel','piedra','canto','fogata','chaleco','mate','huerta','estrella','caracol','trigo','nube','remo','hilo','manzana'];
function memoryPickWords(n){
  const pool=[...MEMORY_WORD_BANK].sort(()=>Math.random()-0.5);
  return pool.slice(0,n);
}
let memoryLociAnswers=[];
function setupMemoryLoci(){
  const rnd=$('memoryRandomWords'); if(rnd) rnd.onclick=()=>{
    const n=parseInt(($('memoryLociN')||{}).value||'7');
    $('memoryWords').value=memoryPickWords(n).join(', ');
  };
  const build=$('memoryBuildLoci'); if(build) build.onclick=()=>{
    let words=$('memoryWords').value.split(',').map(s=>s.trim()).filter(Boolean);
    const want=parseInt(($('memoryLociN')||{}).value||'7');
    if(!words.length){ words=memoryPickWords(want); $('memoryWords').value=words.join(', '); }
    words=words.slice(0,10);
    const route=(($('memoryRoute')||{}).value||'casa');
    const places=MEMORY_ROUTES[route]||MEMORY_ROUTES.casa;
    memoryLociAnswers=words.map((w,i)=>({place:places[i%places.length],word:w}));
    const out=words.map((w,i)=> (i+1)+'. '+places[i%places.length]+' → imagina <b>'+escapeHtml(w)+'</b> gigante, con olor y sonido').join('<br>');
    $('memoryLociOutput').innerHTML='🏛️ Tu palacio ('+route+'):<br>'+out;
    const q=$('memoryQuizLoci'); if(q) q.classList.remove('hidden');
    const qb=$('memoryLociQuiz'); if(qb) qb.classList.add('hidden');
  };
  const quiz=$('memoryQuizLoci'); if(quiz) quiz.onclick=()=>{
    if(!memoryLociAnswers.length) return;
    const qb=$('memoryLociQuiz'); qb.classList.remove('hidden');
    qb.innerHTML='<p class="muted su-11a508">Escribe qué palabra va en cada lugar (en orden):</p>'
      +memoryLociAnswers.map((a,i)=>'<label class="su-6cb285">'+(i+1)+'. '+escapeHtml(a.place)+' <input type="text" data-loci-i="'+i+'" placeholder="palabra..." class="su-7a21c6"></label>').join('')
      +'<div class="su-30b926"><button type="button" id="memoryLociCheck" class="btn btn-accent su-30e741">✓ Evaluar</button></div><div id="memoryLociFb" class="chip su-84c735"></div>';
    $('memoryLociCheck').onclick=()=>{
      let ok=0;
      qb.querySelectorAll('[data-loci-i]').forEach(inp=>{
        const i=parseInt(inp.dataset.lociI); const exp=memoryLociAnswers[i].word.toLowerCase();
        const got=inp.value.trim().toLowerCase();
        const good=got===exp;
        if(good) ok++;
        inp.style.borderColor=good? '#8fd694':'#e76e8a';
        inp.value=inp.value.trim()+(good?' ✓':' (era: '+memoryLociAnswers[i].word+')');
        inp.disabled=true;
      });
      $('memoryLociFb').innerHTML='Obtuviste <b>'+ok+'/'+memoryLociAnswers.length+'</b> '+(ok===memoryLociAnswers.length?'🌟 ¡Palacio perfecto!':'💪 Repite el recorrido con los ojos cerrados.');
      if(ok===memoryLociAnswers.length) memoryTouchDay();
    };
  };
}
// --- PARES por niveles ---
let memoryPairsFirst=null, memoryPairsLock=false, memoryPairsScore=0, memoryPairsMoves=0, memoryPairsTotal=8, memoryPairsLevel='medio', memoryPairsT0=0, memoryPairsTimer=null, memoryPairsSecs=0;
const MEMORY_PAIRS_CFG={ facil:{pairs:6,cols:4}, medio:{pairs:8,cols:4}, dificil:{pairs:12,cols:6} };
const MEMORY_PAIRS_ICONS=["🌙","☀️","🌊","🌱","🍎","🌾","🐟","⭐","🌵","🦅","🍯","🔥","🌧️","🌻","🐚","🍇"];
function memoryPairsStopTimer(){ if(memoryPairsTimer){ clearInterval(memoryPairsTimer); memoryPairsTimer=null; } }
function memoryPairsFmt(s){ return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function renderMemoryPairs(level){
  if(level) memoryPairsLevel=level;
  const cfg=MEMORY_PAIRS_CFG[memoryPairsLevel]||MEMORY_PAIRS_CFG.medio;
  const grid=$('memoryPairsGrid'); if(!grid) return;
  document.querySelectorAll('.mem-pairs-lv').forEach(b=> b.classList.toggle('btn-accent', b.dataset.lv===memoryPairsLevel));
  const icons=[...MEMORY_PAIRS_ICONS].sort(()=>Math.random()-0.5).slice(0,cfg.pairs);
  const deck=[...icons, ...icons].sort(()=>Math.random()-0.5);
  memoryPairsTotal=cfg.pairs;
  grid.style.gridTemplateColumns='repeat('+cfg.cols+',1fr)';
  grid.innerHTML='';
  memoryPairsFirst=null; memoryPairsLock=false; memoryPairsScore=0; memoryPairsMoves=0; memoryPairsSecs=0;
  $('memoryPairsScore').textContent='0/'+cfg.pairs+' pares';
  $('memoryPairsMoves').textContent='0 intentos';
  $('memoryPairsTime').textContent='0:00';
  const m=getMemoryData(); const b=(m.bestPairs||{})[memoryPairsLevel];
  $('memoryPairsBest').textContent=b? ('récord '+b.moves+' int · '+b.time+'s') : 'récord —';
  memoryPairsStopTimer(); memoryPairsT0=Date.now();
  memoryPairsTimer=setInterval(()=>{ memoryPairsSecs=Math.floor((Date.now()-memoryPairsT0)/1000); const t=$('memoryPairsTime'); if(t) t.textContent=memoryPairsFmt(memoryPairsSecs); },1000);
  deck.forEach(icon=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.className='mem-card'; btn.textContent='?'; btn.dataset.icon=icon; btn.dataset.revealed='0';
    btn.onclick=()=>{
      if(memoryPairsLock || btn.dataset.revealed==='1') return;
      btn.textContent=btn.dataset.icon; btn.dataset.revealed='1'; btn.classList.add('open');
      if(!memoryPairsFirst){ memoryPairsFirst=btn; }
      else {
        memoryPairsLock=true; memoryPairsMoves++;
        $('memoryPairsMoves').textContent=memoryPairsMoves+' intentos';
        setTimeout(()=>{
          if(memoryPairsFirst.dataset.icon===btn.dataset.icon){
            memoryPairsFirst.classList.add('done'); btn.classList.add('done');
            memoryPairsScore++; $('memoryPairsScore').textContent=memoryPairsScore+'/'+memoryPairsTotal+' pares';
            memoryPairsFirst=null; memoryPairsLock=false;
            if(memoryPairsScore===memoryPairsTotal){
              memoryPairsStopTimer();
              const mm=getMemoryData(); mm.bestPairs=mm.bestPairs||{};
              const prev=mm.bestPairs[memoryPairsLevel];
              const better=!prev || memoryPairsMoves<prev.moves || (memoryPairsMoves===prev.moves && memoryPairsSecs<prev.time);
              if(better){ mm.bestPairs[memoryPairsLevel]={moves:memoryPairsMoves,time:memoryPairsSecs}; }
              try{ scheduleSave(); }catch{}
              memoryTouchDay(); renderMemoryProg();
              const bb=(getMemoryData().bestPairs||{})[memoryPairsLevel];
              $('memoryPairsBest').textContent='récord '+bb.moves+' int · '+bb.time+'s';
              setTimeout(()=> alert('¡Excelente! '+memoryPairsTotal+' pares en '+memoryPairsMoves+' intentos y '+memoryPairsFmt(memoryPairsSecs)+(better?' — ¡nuevo récord! 🏆':'')),200);
            }
          } else {
            memoryPairsFirst.textContent='?'; memoryPairsFirst.dataset.revealed='0'; memoryPairsFirst.classList.remove('open');
            btn.textContent='?'; btn.dataset.revealed='0'; btn.classList.remove('open');
            memoryPairsFirst=null; memoryPairsLock=false;
          }
        },550);
      }
    };
    grid.appendChild(btn);
  });
}
// --- SECUENCIA (Simón lunar) ---
let memSeq=[], memSeqUser=0, memSeqPlaying=false, memSeqSpeed=700, memSeqAccept=false;
const MEM_SEQ_BTNS=[
  {e:'🌑',n:'nueva'},
  {e:'🌒',n:'creciente'},
  {e:'🌕',n:'llena'},
  {e:'🌖',n:'menguante'}
];
function memSeqRenderMsg(t){ const el=$('memorySeqMsg'); if(el) el.textContent=t; }
function memSeqRenderLevel(){ const el=$('memorySeqLevel'); if(el) el.textContent='Nivel '+memSeq.length; const b=$('memorySeqBest'); if(b) b.textContent='récord '+(getMemoryData().bestSeq||0); }
function memSeqBuildGrid(){
  const g=$('memorySeqGrid'); if(!g) return; g.innerHTML='';
  MEM_SEQ_BTNS.forEach((bb,i)=>{
    const d=document.createElement('button');
    d.type='button'; d.className='mem-seq-btn'; d.dataset.i=i;
    d.innerHTML='<span class="su-12f66e">'+bb.e+'</span><small>'+bb.n+'</small>';
    d.onclick=()=> memSeqPress(i,d);
    g.appendChild(d);
  });
}
function memSeqFlash(i,cb){
  const g=$('memorySeqGrid'); if(!g){ if(cb)cb(); return; }
  const btn=g.children[i]; if(!btn){ if(cb)cb(); return; }
  btn.classList.add('lit');
  setTimeout(()=>{ btn.classList.remove('lit'); setTimeout(()=>{ if(cb)cb(); },120); },memSeqSpeed*0.6);
}
function memSeqPlay(){
  memSeqAccept=false; memSeqPlaying=true; memSeqUser=0;
  memSeqRenderMsg('👀 Mira…'); memSeqRenderLevel();
  let k=0;
  const step=()=>{ if(k>=memSeq.length){ memSeqAccept=true; memSeqPlaying=false; memSeqRenderMsg('✋ Tu turno: repite'); return; } memSeqFlash(memSeq[k],()=>{ k++; setTimeout(step,180); }); };
  setTimeout(step,500);
}
function memSeqPress(i,el){
  if(!memSeqAccept) return;
  el.classList.add('lit'); setTimeout(()=>el.classList.remove('lit'),220);
  if(i===memSeq[i===undefined?-1:memSeqUser]){
    memSeqUser++;
    if(memSeqUser>=memSeq.length){
      memSeqAccept=false;
      memSeq.push(Math.floor(Math.random()*4));
      const m=getMemoryData(); if(memSeq.length>(m.bestSeq||0)){ m.bestSeq=memSeq.length; try{ scheduleSave(); }catch{} }
      memSeqRenderLevel(); memSeqRenderMsg('✅ ¡Bien! +1 paso…');
      memoryTouchDay(); renderMemoryProg();
      setTimeout(memSeqPlay,900);
    }
  } else {
    memSeqAccept=false;
    memSeqRenderMsg('❌ Era “'+MEM_SEQ_BTNS[memSeq[memSeqUser]].n+'”. Nivel '+memSeq.length);
    memoryTouchDay(); renderMemoryProg();
    memSeq=[];
    memSeqRenderLevel();
  }
}
function setupMemorySeq(){
  memSeqBuildGrid(); memSeqRenderLevel();
  const s=$('memorySeqStart'); if(s) s.onclick=()=>{ memSeq=[Math.floor(Math.random()*4)]; memSeqRenderLevel(); memSeqPlay(); };
  const sl=$('memorySeqSlow'); if(sl) sl.onclick=()=>{ memSeqSpeed=900; sl.classList.add('btn-accent'); $('memorySeqFast').classList.remove('btn-accent'); };
  const fa=$('memorySeqFast'); if(fa) fa.onclick=()=>{ memSeqSpeed=450; fa.classList.add('btn-accent'); $('memorySeqSlow').classList.remove('btn-accent'); };
}
// --- PALABRAS y NÚMEROS ---
let memWCurrent=[], memWLeft=0, memWTimer=null, memNumCurrent='', memNumLeft=0, memNumTimer=null;
function memWStopT(){ if(memWTimer){ clearInterval(memWTimer); memWTimer=null; } }
function setupMemoryWords(){
  const t1=$('tabMemWList'), t2=$('tabMemWNum'), b1=$('memWListBox'), b2=$('memWNumBox');
  if(t1) t1.onclick=()=>{ t1.classList.add('btn-accent'); t2.classList.remove('btn-accent'); b1.classList.remove('hidden'); b2.classList.add('hidden'); };
  if(t2) t2.onclick=()=>{ t2.classList.add('btn-accent'); t1.classList.remove('btn-accent'); b2.classList.remove('hidden'); b1.classList.add('hidden'); };
  const gen=$('memoryWordsGen'); if(gen) gen.onclick=()=>{
    const n=parseInt(($('memoryWordsN')||{}).value||'7');
    memWCurrent=memoryPickWords(n);
    $('memoryWordsList').innerHTML=memWCurrent.map((w,i)=>'<span class="mem-word">'+(i+1)+'. '+escapeHtml(w)+'</span>').join('');
    $('memoryWordsRecallBox').classList.add('hidden'); $('memoryWordsResult').textContent='';
    $('memoryWordsHide').classList.remove('hidden'); $('memoryWordsShow').classList.add('hidden');
    memWStopT();
    let left=parseInt(($('memoryWordsT')||{}).value||'30'); memWLeft=left;
    const tt=$('memoryWordsTimer'); tt.classList.remove('hidden');
    tt.textContent='⏳ '+left+'s para memorizar… repite en voz alta';
    memWTimer=setInterval(()=>{ left--; memWLeft=left;
      if(left<=0){ memWStopT(); tt.textContent='🙈 ¡Tiempo! Oculta y escribe de memoria'; $('memoryWordsHide').classList.remove('hidden'); }
      else tt.textContent='⏳ '+left+'s — repite en voz alta';
    },1000);
  };
  const hide=$('memoryWordsHide'); if(hide) hide.onclick=()=>{
    $('memoryWordsList').innerHTML='<span class="muted">🙈 Lista oculta — escribe lo que recuerdes abajo</span>';
    $('memoryWordsRecallBox').classList.remove('hidden'); hide.classList.add('hidden');
    $('memoryWordsShow').classList.remove('hidden'); memWStopT(); $('memoryWordsTimer').classList.add('hidden');
    setTimeout(()=>{ const r=$('memoryWordsRecall'); if(r) r.focus(); },100);
  };
  const show=$('memoryWordsShow'); if(show) show.onclick=()=>{
    $('memoryWordsList').innerHTML=memWCurrent.map((w,i)=>'<span class="mem-word">'+(i+1)+'. '+escapeHtml(w)+'</span>').join('');
    show.classList.add('hidden'); $('memoryWordsHide').classList.remove('hidden');
  };
  const chk=$('memoryWordsCheck'); if(chk) chk.onclick=()=>{
    const got=$('memoryWordsRecall').value.toLowerCase().split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
    let ok=0; const used=new Set();
    memWCurrent.forEach(w=>{
      const idx=got.findIndex((g,i)=> !used.has(i) && g===w.toLowerCase());
      if(idx>=0){ ok++; used.add(idx); }
    });
    const pct=Math.round(ok/memWCurrent.length*100);
    $('memoryWordsResult').innerHTML='Obtuviste <b>'+ok+'/'+memWCurrent.length+' ('+pct+'%)</b> '+(pct===100?'🌟 ¡Perfecto!':pct>=70?'💪 ¡Muy bien!':'🌱 Bien, repite mañana.')+'<br><span class="muted">Correctas: '+memWCurrent.filter(w=>got.includes(w.toLowerCase())).map(escapeHtml).join(', ')+' · Faltaron: '+memWCurrent.filter(w=>!got.includes(w.toLowerCase())).map(escapeHtml).join(', ')+'</span>';
    const m=getMemoryData(); if(ok>(m.bestWords||0)){ m.bestWords=ok; try{ scheduleSave(); }catch{} }
    memoryTouchDay(); renderMemoryStreak(); renderMemoryProg();
  };
  const ng=$('memoryNumGen'); if(ng) ng.onclick=()=>{
    const n=parseInt(($('memoryNumN')||{}).value||'6');
    memNumCurrent=Array.from({length:n},()=>Math.floor(Math.random()*10)).join('');
    $('memoryNumList').textContent=memNumCurrent.split('').join(' ');
    $('memoryNumRecallBox').classList.add('hidden'); $('memoryNumResult').textContent='';
    $('memoryNumHide').classList.remove('hidden'); $('memoryNumShow').classList.add('hidden');
    if(memNumTimer) clearInterval(memNumTimer);
    let left=parseInt(($('memoryNumT')||{}).value||'20');
    const tt=$('memoryNumTimer'); tt.classList.remove('hidden'); tt.textContent='⏳ '+left+'s — agrupa de a 2-3';
    memNumTimer=setInterval(()=>{ left--; if(left<=0){ clearInterval(memNumTimer); tt.textContent='🙈 ¡Tiempo! Oculta y escríbelo'; } else tt.textContent='⏳ '+left+'s — agrupa de a 2-3'; },1000);
  };
  const nh=$('memoryNumHide'); if(nh) nh.onclick=()=>{
    $('memoryNumList').textContent='• '.repeat(memNumCurrent.length);
    $('memoryNumRecallBox').classList.remove('hidden'); nh.classList.add('hidden'); $('memoryNumShow').classList.remove('hidden');
    if(memNumTimer) clearInterval(memNumTimer); $('memoryNumTimer').classList.add('hidden');
  };
  const ns=$('memoryNumShow'); if(ns) ns.onclick=()=>{
    $('memoryNumList').textContent=memNumCurrent.split('').join(' ');
    ns.classList.add('hidden'); $('memoryNumHide').classList.remove('hidden');
  };
  const nc=$('memoryNumCheck'); if(nc) nc.onclick=()=>{
    const got=($('memoryNumRecall').value||'').replace(/\D/g,'');
    let okDigits=0; for(let i=0;i<Math.max(got.length,memNumCurrent.length);i++){ if(got[i]===memNumCurrent[i]) okDigits++; }
    const perfect=got===memNumCurrent;
    $('memoryNumResult').innerHTML=perfect? '🌟 <b>¡Perfecto! '+memNumCurrent.length+' dígitos.</b> Sube a '+(memNumCurrent.length+2)+' la próxima.' : 'Obtuviste <b>'+okDigits+'/'+memNumCurrent.length+' dígitos en posición</b>.<br><span class="muted">Era: '+escapeHtml(memNumCurrent)+' · Escribiste: '+escapeHtml(got||'—')+'</span>';
    const m=getMemoryData(); if(perfect && memNumCurrent.length>(m.bestNum||0)){ m.bestNum=memNumCurrent.length; try{ scheduleSave(); }catch{} }
    memoryTouchDay(); renderMemoryStreak(); renderMemoryProg();
  };
}
// --- ATENCIÓN: el distinto + Schulte ---
let memOddRound=0, memOddT0=0, memOddTimer=null, memOddTotal=0, memOddActive=false;
const MEM_ODD_SETS=[['🌊','🐟'],['🌙','🌕'],['🌱','🌻'],['⭐','✨'],['🍎','🍏'],['🐚','🦪'],['🌲','🌵'],['🔥','💧']];
function memOddStop(){ if(memOddTimer){ clearInterval(memOddTimer); memOddTimer=null; } }
function memOddNewRound(){
  const g=$('memoryOddGrid'); if(!g) return;
  const set=MEM_ODD_SETS[Math.floor(Math.random()*MEM_ODD_SETS.length)];
  const n=25; const diff=Math.floor(Math.random()*n);
  g.style.gridTemplateColumns='repeat(5,1fr)'; g.innerHTML='';
  for(let i=0;i<n;i++){
    const b=document.createElement('button'); b.type='button'; b.className='mem-card mem-odd'; b.textContent=(i===diff? set[1]:set[0]);
    if(i===diff) b.onclick=()=>{
      if(!memOddActive) return;
      memOddRound++;
      $('memoryOddRound').textContent='Ronda '+memOddRound+'/5';
      if(memOddRound>=5){
        memOddActive=false; memOddStop();
        const secs=(Date.now()-memOddT0)/1000; memOddTotal=secs;
        $('memoryOddTime').textContent=secs.toFixed(1)+'s total';
        const m=getMemoryData();
        if(!m.bestOdd || secs<m.bestOdd){ m.bestOdd=Math.round(secs*10)/10; try{ scheduleSave(); }catch{} }
        $('memoryOddBest').textContent='récord '+(getMemoryData().bestOdd)+'s';
        memoryTouchDay(); renderMemoryProg();
        setTimeout(()=> alert('¡5 rondas en '+secs.toFixed(1)+'s! '+(secs<30?'⚡ Atención de lince.':'💪 Bien, la velocidad mejora con práctica.')),200);
      } else memOddNewRound();
    };
    else b.onclick=()=>{ try{ playNotifySound(); }catch{} b.classList.add('shake'); setTimeout(()=>b.classList.remove('shake'),300); };
    g.appendChild(b);
  }
}
function setupMemoryOdd(){
  const nw=$('memoryOddNew'); if(nw) nw.onclick=()=>{
    memOddRound=0; memOddActive=true; memOddT0=Date.now();
    $('memoryOddRound').textContent='Ronda 0/5'; $('memoryOddTime').textContent='0.0s';
    $('memoryOddBest').textContent='récord '+((getMemoryData().bestOdd||0)? getMemoryData().bestOdd+'s':'—');
    memOddStop();
    memOddTimer=setInterval(()=>{ if(!memOddActive) return; $('memoryOddTime').textContent=((Date.now()-memOddT0)/1000).toFixed(1)+'s'; },100);
    memOddNewRound();
  };
  $('memoryOddBest').textContent='récord '+((getMemoryData().bestOdd||0)? getMemoryData().bestOdd+'s':'—');
}
let memSchNext=1, memSchT0=0, memSchTimer=null, memSchActive=false;
function memSchStop(){ if(memSchTimer){ clearInterval(memSchTimer); memSchTimer=null; } }
function memSchNew(){
  const g=$('memorySchGrid'); if(!g) return;
  const nums=[...Array(25)].map((_,i)=>i+1).sort(()=>Math.random()-0.5);
  memSchNext=1; memSchActive=true; memSchT0=Date.now();
  $('memorySchNext').textContent='Siguiente: 1';
  $('memorySchBest').textContent='récord '+((getMemoryData().bestSchulte||0)? getMemoryData().bestSchulte+'s':'—');
  g.innerHTML='';
  memSchStop();
  memSchTimer=setInterval(()=>{ if(!memSchActive) return; $('memorySchTime').textContent=((Date.now()-memSchT0)/1000).toFixed(1)+'s'; },100);
  nums.forEach(n=>{
    const b=document.createElement('button'); b.type='button'; b.className='mem-schulte-cell'; b.textContent=n;
    b.onclick=()=>{
      if(!memSchActive) return;
      if(n===memSchNext){
        b.classList.add('done'); b.disabled=true; memSchNext++;
        if(memSchNext>25){
          memSchActive=false; memSchStop();
          const secs=Math.round((Date.now()-memSchT0)/100)/10;
          $('memorySchTime').textContent=secs+'s';
          const m=getMemoryData(); if(!m.bestSchulte || secs<m.bestSchulte){ m.bestSchulte=secs; try{ scheduleSave(); }catch{} }
          $('memorySchBest').textContent='récord '+getMemoryData().bestSchulte+'s';
          $('memorySchNext').textContent='¡Completada! 🎉';
          memoryTouchDay(); renderMemoryProg();
        } else $('memorySchNext').textContent='Siguiente: '+memSchNext;
      } else { b.classList.add('shake'); setTimeout(()=>b.classList.remove('shake'),300); }
    };
    g.appendChild(b);
  });
}
function setupMemorySch(){
  const b=$('memorySchNew'); if(b) b.onclick=memSchNew;
  memSchNew();
}
function setupMemoryDialog(){
  const b=$('btnMemory'); if(b) b.onclick=()=>{ renderMemoryStreak(); renderMemoryProg(); $('memoryDialog').showModal(); };
  const ct=$('memoryCloseTop'), cb=$('memoryClose'); if(ct) ct.onclick=()=>$('memoryDialog').close(); if(cb) cb.onclick=()=>$('memoryDialog').close();
  const tabs={ tabMemoryLoci:'memoryLociPanel', tabMemoryPairs:'memoryPairsPanel', tabMemorySeq:'memorySeqPanel', tabMemoryWords:'memoryWordsPanel', tabMemoryAtt:'memoryAttPanel', tabMemoryProg:'memoryProgPanel' };
  Object.entries(tabs).forEach(([tid,pid])=>{
    const t=$(tid); if(!t) return;
    t.onclick=()=>{
      Object.keys(tabs).forEach(k=>{ const e=$(k); if(e) e.classList.remove('btn-accent'); const p=$(tabs[k]); if(p) p.classList.add('hidden'); });
      t.classList.add('btn-accent'); $(pid).classList.remove('hidden');
      if(pid==='memoryPairsPanel') renderMemoryPairs();
      if(pid==='memoryProgPanel') renderMemoryProg();
      if(pid==='memoryAttPanel'){ $('memoryOddBest').textContent='récord '+((getMemoryData().bestOdd||0)? getMemoryData().bestOdd+'s':'—'); $('memorySchBest').textContent='récord '+((getMemoryData().bestSchulte||0)? getMemoryData().bestSchulte+'s':'—'); }
    };
  });
  document.querySelectorAll('.mem-pairs-lv').forEach(x=> x.onclick=()=> renderMemoryPairs(x.dataset.lv));
  const newGame=$('memoryPairsNew'); if(newGame) newGame.onclick=()=> renderMemoryPairs();
  const rst=$('memoryProgReset'); if(rst) rst.onclick=()=>{ if(!confirm('¿Borrar récords de memoria?')) return; const u=userData(); u.memory={bestPairs:{},bestSeq:0,bestWords:0,bestNum:0,bestOdd:0,bestSchulte:0,streak:0,lastDay:'',sessions:0}; try{ scheduleSave('Récords borrados'); }catch{} renderMemoryStreak(); renderMemoryProg(); renderMemoryPairs(); };
  setupMemoryLoci(); setupMemorySeq(); setupMemoryWords(); setupMemoryOdd(); setupMemorySch();
  renderMemoryPairs('medio'); renderMemoryStreak();
}

setTimeout(setupTalesDialog, 875);
setTimeout(setupMemoryDialog, 880);

// === EVENTOS ASTRONÓMICOS ===
const ASTRO_EVENTS = (typeof EVENTOS_ASTRONOMICOS!=='undefined'? EVENTOS_ASTRONOMICOS : (window.pencoData&&window.pencoData.EVENTOS_ASTRONOMICOS)||[]);
function getAstroForMonth(mdKey){ // mdKey MM-DD or YYYY-MM-DD
  const mmdd = mdKey.length===5? mdKey : mdKey.slice(5);
  // include recurring solst/equinoc + year-specific
  return ASTRO_EVENTS.filter(e=> e.date.slice(5)===mmdd || e.date===mdKey);
}
function astroVisibleForDate(key){ // key YYYY-MM-DD
  return ASTRO_EVENTS.filter(e=> e.date===key);
}
const ASTRO_TYPE_COLOR={ eclipse:'#ff9a9a', superluna:'var(--gold)', lluvia:'#7ab8ff', equinoccio:'#8fd694', solsticio:'#8fd694' };
function astroCountdown(e, todayKey, todayNoon){
  if(e.date===todayKey) return 'hoy';
  const diff=Math.round((new Date(e.date+'T12:00:00').getTime()-todayNoon)/86400000);
  if(diff===1) return 'mañana';
  if(diff<0) return 'hace '+Math.abs(diff)+' días';
  return 'en '+diff+' días';
}
function astroItemHTML(e, todayKey, todayNoon){
  const isToday=e.date===todayKey;
  const luna=mensLunaForKey(e.date);
  const dt=new Date(e.date+'T12:00:00');
  const wd=cal.weekdayName(dt.getTime());
  const tc=ASTRO_TYPE_COLOR[e.tipo]||'var(--muted)';
  const cd=astroCountdown(e, todayKey, todayNoon);
  return `<div class="astro-item${isToday?' today':''}"><div class="astro-date"><b>${dt.getDate()}</b><span>${escapeHtml(wd.slice(0,3))}</span></div><div class="astro-body"><div class="astro-top"><span class="astro-name">${e.icon} ${escapeHtml(e.nombre)}</span><span class="chip astro-cd"${isToday ? ' class="su-e4aba6"' : ''}>${cd}</span></div><div class="su-557d84"><span class="chip" style="font-size:10px;background:${tc}22;color:${tc};border-color:${tc}55">${escapeHtml(e.tipo)}</span>${luna? ` <span class="muted su-11a508">Luna ${luna.luna}·d${luna.dia}</span>`:''}</div><p class="su-6cb285">${escapeHtml(e.desc)}</p></div></div>`;
}
let astroTab='upcoming';
function renderAstroDialog(tab){
  astroTab=tab||astroTab;
  const tU=$('tabAstroUpcoming'), tM=$('tabAstroMesLunar'), tY=$('tabAstroYear');
  if(tU&&tY){
    [tU,tY].forEach(b=> b.classList.remove('btn-accent'));
    if(tM) tM.classList.remove('btn-accent');
    if(astroTab==='upcoming') tU.classList.add('btn-accent');
    if(astroTab==='mesLunar' && tM) tM.classList.add('btn-accent');
    if(astroTab==='year') tY.classList.add('btn-accent');
  }
  const todayKey=cal.fmtKey.format(new Date());
  const todayBox=$('astroTodayBox');
  if(todayBox){
    const todayEvents=astroVisibleForDate(todayKey);
    const phases=phaseMap[todayKey]||[];
    const phaseTxt=phases.length? phases.map(p=> p.simbolo+' '+p.tipo.replace('-',' ')).join(' · ') : 'Sin fase exacta hoy';
    let moonRiseTxt='--', moonSetTxt='--';
    try{
      const mnToday = cal.moonForDay(Date.now());
      if(mnToday.rise) moonRiseTxt = cal.fmtTime.format(new Date(mnToday.rise));
      if(mnToday.set) moonSetTxt = cal.fmtTime.format(new Date(mnToday.set));
    }catch(e){}
    todayBox.innerHTML=`<div class="su-13313b"><span><b>🔭 Hoy — ${cal.weekdayName(mensKeyToMs(todayKey))} ${cal.fmtFull.format(new Date(mensKeyToMs(todayKey)))}</b></span><span class="chip">${phaseTxt}</span></div>`
    + `<div class="su-0ad856"><span class="chip">🌙 Sale <b>${moonRiseTxt}</b></span><span class="chip">🌘 Se pone <b>${moonSetTxt}</b></span></div>`
    + `<p class="muted su-32206a">Luna en Penco · hora local · aprox. ±15 min según lugar de observación.</p>`
    + (todayEvents.length? todayEvents.map(e=> `<div class="chip su-d314e1">${e.icon} <b>${escapeHtml(e.nombre)}</b> — ${escapeHtml(e.desc)}</div>`).join('') : '<p class="muted su-e13d76">Hoy sin eclipse/lluvia destacada. Revisa fases arriba.</p>') + `<p class="muted su-e13d76">Penco: lat ${PENCO.lat}, lng ${PENCO.lng}. Cielo ideal: humedal Rocuant sin luces.</p>`;
  }
  const list=$('astroList'); if(!list) return;
  let events=[];
  if(astroTab==='upcoming'){
    const now=new Date(); const nowKey=cal.fmtKey.format(now);
    const todayNoon=new Date(todayKey+'T12:00:00').getTime();
    events=ASTRO_EVENTS.filter(e=> e.date >= nowKey).sort((a,b)=> a.date.localeCompare(b.date)).slice(0,8);
    if(!events.length) events=ASTRO_EVENTS.slice(0,6);
    const monthOf=d=>{ const dt=new Date(d+'T12:00:00'); let n=dt.toLocaleDateString('es-CL',{month:'long',year:'numeric'}); return n.charAt(0).toUpperCase()+n.slice(1); };
    let html='<h4 class="su-e21c16">⏳ Próximos — ordenados por fecha</h4>';
    let lastMonth='';
    html+=events.map(e=> {
      const m=monthOf(e.date);
      const mHead=(m!==lastMonth)? `<div class="astro-month">${escapeHtml(m)}</div>` : '';
      lastMonth=m;
      return mHead+astroItemHTML(e, todayKey, todayNoon);
    }).join('');
    list.innerHTML=html;
  } else if(astroTab==='mesLunar'){
    const range=lunarMonthRange(Date.now());
    const evMap=lunarEventsMap(new Date(range.startKey+'T12:00:00').getTime()-86400000, new Date(range.endKey+'T12:00:00').getTime()+86400000);
    const moon=moonDaily(todayKey);
    const d0=new Date(range.startKey+'T12:00:00'), d1=new Date(range.days[range.days.length-1]+'T12:00:00');
    const keyPhase={};
    range.days.forEach(k=>{ (evMap[k]||[]).forEach(e=>{ if(!keyPhase[e.tipo]) keyPhase[e.tipo]={k,e}; }); });
    const phaseOrder=['nueva','cuarto-creciente','llena','cuarto-menguante'];
    const phaseLabel={'nueva':'Luna nueva','cuarto-creciente':'Cuarto creciente','llena':'Luna llena','cuarto-menguante':'Cuarto menguante'};
    let html=`<h4 class="su-e21c16">🌕 Mes lunar · ${cal.fmtDate.format(d0)} — ${cal.fmtDate.format(d1)}</h4>`;
    html+=`<div class="menstrual-card su-bcee4f"><div class="su-5a5e36"><span class="su-b96a38">${moon.icon}</span><span><b>Hoy: ${moon.illum===null?'—':moon.illum+'% iluminada'}</b><br><span class="muted su-11a508">Lunación de ${range.days.length} días · Penco (America/Santiago)</span></span></div></div>`;
    html+='<div class="astro-phases">'+phaseOrder.map(t=>{
      const o=keyPhase[t];
      if(!o) return '';
      const dk=new Date(o.k+'T12:00:00');
      return `<div class="astro-phase"><span class="astro-phase-icon">${o.e.simbolo}</span><b>${phaseLabel[t]}</b><span class="muted su-11a508">${cal.weekdayName(dk.getTime()).slice(0,3)} ${cal.fmtDate.format(dk)}</span><span class="su-49f9d7">${cal.fmtTime.format(new Date(o.e.utcMs))}</span></div>`;
    }).join('')+'</div>';
    html+=`<p class="muted su-e6fe60">💡 Cielo más oscuro para meteoros cerca de la <b>luna nueva</b> · luna más brillante en la <b>llena</b>. Para sembrar revisa 🌱 Siembra lunar.</p>`;
    html+=`<h4 class="su-5e472a">🌙 Iluminación día por día</h4><div class="astro-luna-grid">`+range.days.map((k,i)=>{
      const md=moonDaily(k); const dk=new Date(k+'T12:00:00');
      const hasEv=(evMap[k]||[]).length>0;
      return `<div class="astro-luna-cell${k===todayKey?' today':''}" title="${escapeHtml(k)}"><span class="muted su-0d5be0">${dk.getDate()}/${dk.getMonth()+1}</span><span class="su-b9199e">${hasEv? (evMap[k][0].simbolo) : md.icon}</span><span class="su-9bc3cd">${md.illum===null?'—':md.illum+'%'}</span><span class="astro-bar"><i style="width:${md.illum||0}%"></i></span></div>`;
    }).join('')+`</div>`;
    const todayNoonML=new Date(todayKey+'T12:00:00').getTime();
    const inLuna=ASTRO_EVENTS.filter(e=> e.date>=range.startKey && e.date<range.endKey).sort((a,b)=> a.date.localeCompare(b.date));
    html+=`<h4 class="su-5d0cfa">🔭 Eventos en esta lunación · ${inLuna.length}</h4>`;
    html+= inLuna.length
      ? inLuna.map(e=> astroItemHTML(e, todayKey, todayNoonML)).join('')
      : '<p class="muted su-11a508">Sin eclipses, superlunas ni lluvias destacadas entre estas dos lunas nuevas. Revisa ⏳ Próximos.</p>';
    list.innerHTML=html;
  } else if(astroTab==='year'){
    const yr=new Date().getFullYear();
    const yearEvents=ASTRO_EVENTS.filter(e=> e.date.startsWith(String(yr)) || e.date.startsWith(String(yr+1))).sort((a,b)=>a.date.localeCompare(b.date));
    const byType={}; yearEvents.forEach(e=>{ if(!byType[e.tipo]) byType[e.tipo]=[]; byType[e.tipo].push(e); });
    let html=`<h4 class="su-e21c16">📅 ${yr} — ${yr+1} ciclo</h4>`;
    Object.keys(byType).forEach(t=>{ html+=`<p class="muted su-5c43de"><b>${t}</b> · ${byType[t].length}</p>` + byType[t].map(e=> `<div class="si-card su-cfa1ec"><h4 class="su-6cb285">${e.icon} ${escapeHtml(e.nombre)} <span class="muted su-11a508">${e.date}</span></h4><p class="su-11a508">${escapeHtml(e.desc)}</p></div>`).join(''); });
    list.innerHTML=html;
  } else {
    // fallback seguro: cualquier tab desconocido vuelve a Próximos
    astroTab='upcoming'; renderAstroDialog('upcoming'); return;
  }
}
function setupAstroDialog(){
  const btn=$('btnAstro'); if(btn) btn.onclick=()=>{ renderAstroDialog('upcoming'); $('astroDialog').showModal(); };
  const ct=$('astroCloseTop'), cb=$('astroClose'); if(ct) ct.onclick=()=>$('astroDialog').close(); if(cb) cb.onclick=()=>$('astroDialog').close();
  const tU=$('tabAstroUpcoming'), tM=$('tabAstroMesLunar'), tY=$('tabAstroYear');
  if(tU) tU.onclick=()=> renderAstroDialog('upcoming');
  if(tM) tM.onclick=()=> renderAstroDialog('mesLunar');
  if(tY) tY.onclick=()=> renderAstroDialog('year');
}
setTimeout(setupAstroDialog, 880);

// === EVENTOS ANUALES COMUNA PENCO ===
const COMUNA_OFICIAL = (typeof EVENTOS_COMUNA_PENCO!=='undefined'? EVENTOS_COMUNA_PENCO : (window.pencoData&&window.pencoData.EVENTOS_COMUNA_PENCO)||[]);
function getComunaData(){
  const u=userData();
  if(!u.comunaEventos) u.comunaEventos={ list:[], showCal:true };
  if(!Array.isArray(u.comunaEventos.list)) u.comunaEventos.list=[];
  if(typeof u.comunaEventos.showCal!=='boolean') u.comunaEventos.showCal=true;
  return u.comunaEventos;
}
function isComunaShowCal(){ try{ return getComunaData().showCal!==false; }catch{ return true; } }
function getAllComunaEventsForMD(md){
  const oficial=COMUNA_OFICIAL.filter(e=> e.md===md);
  const personal=getComunaData().list.filter(e=> e.md===md);
  return [...oficial,...personal];
}
function getAllComunaEvents(){
  const map={};
  COMUNA_OFICIAL.forEach(e=>{ if(!map[e.md]) map[e.md]=[]; map[e.md].push({...e, oficial:true}); });
  getComunaData().list.forEach(e=>{ if(!map[e.md]) map[e.md]=[]; map[e.md].push({...e, oficial:false}); });
  // flatten
  let all=[];
  Object.keys(map).sort().forEach(md=> map[md].forEach(ev=> all.push(ev)));
  return all;
}
let comunaEditingId=null;
function renderComunaDialog(){
  const cbShow=$('comunaShowCal'); if(cbShow){ cbShow.checked=isComunaShowCal(); cbShow.onchange=()=>{ getComunaData().showCal=cbShow.checked; scheduleSave(); renderLuna(); }; }
  const todayKey=cal.fmtKey.format(new Date());
  const mdToday=todayKey.slice(5);
  const todayBox=$('comunaTodayBox');
  if(todayBox){
    const todayEvents=getAllComunaEventsForMD(mdToday);
    todayBox.innerHTML=`<div class="su-13313b"><span><b>🎉 Hoy — ${cal.fmtFull.format(new Date())}</b></span><span class="chip">${todayEvents.length? todayEvents.length+' evento(s)':'Sin evento hoy'}</span></div>` + (todayEvents.length? todayEvents.map(e=> `<div class="chip su-b8ea88">${e.icon} <b>${escapeHtml(e.nombre)}</b> — ${escapeHtml(e.desc)}</div>`).join('') : '<p class="muted su-e13d76">Hoy sin evento comunal. ¡Crea uno anual!</p>');
  }
  const lunaBox=$('comunaLunaBox');
  if(lunaBox){
    const yr=currentCycleYear();
    const lunaName=currentView.tipo==='dft'? 'DFT' : MOONS[currentView.luna-1].nombre;
    lunaBox.innerHTML=`<h4 class="su-a80552">🌙 Luna ${currentView.tipo==='dft'?'DFT':currentView.luna} · ${escapeHtml(lunaName)}</h4><p class="muted su-11a508">Eventos anuales que caen dentro de esta luna (28 días) aparecen en el calendario como 📅.</p>`;
  }
  const lunaList=$('comunaLunaList');
  if(lunaList){
    const lunaDays = currentView.tipo==='dft'? [] : cycle.days.filter(d=> d.luna===currentView.luna);
    let html='';
    lunaDays.forEach(d=>{
      const md=cal.fmtKey.format(new Date(d.noonMs)).slice(5);
      const evs=getAllComunaEventsForMD(md);
      evs.forEach(e=>{
        html+=`<div class="si-card su-cfa1ec"><h4>${e.icon} ${escapeHtml(e.nombre)} <span class="chip su-0d5be0">${e.cat||'evento'}</span></h4><p class="su-1fd8c8">${cal.fmtDate.format(new Date(d.noonMs))} (${md})</p><p class="su-6cb285">${escapeHtml(e.desc)}</p></div>`;
      });
    });
    lunaList.innerHTML=html||'<p class="muted">Sin eventos anuales en esta luna.</p>';
  }
  const list=$('comunaList'); if(list){
    const all=getAllComunaEvents();
    if(!all.length) list.innerHTML='<p class="muted">Sin eventos.</p>';
    else list.innerHTML=all.map(e=> `<div class="habit-item su-13313b"><span><b>${e.icon} ${escapeHtml(e.nombre)}</b> <span class="chip su-0d5be0">${e.md} · ${e.cat||''} ${e.oficial? '· oficial':''}</span><br><span class="muted su-11a508">${escapeHtml(e.desc)}</span></span><span class="su-0c0cb1">${!e.oficial?`<button data-id="${e.id}" class="btn comuna-edit su-337714">✏️</button><button data-id="${e.id}" class="btn comuna-del su-fd834a">✕</button>`: '<span class="muted su-0d5be0">oficial</span>'}</span></div>`).join('');
    list.querySelectorAll('.comuna-edit').forEach(b=> b.onclick=()=>{
      const d=getComunaData().list.find(x=>x.id===b.dataset.id); if(!d) return;
      comunaEditingId=d.id; $('comunaDate').value=new Date().getFullYear()+'-'+d.md; $('comunaName').value=d.nombre; $('comunaDesc').value=d.desc; $('comunaIcon').value=d.icon||'🎉'; $('comunaCat').value=d.cat||'otro';
      $('comunaAdd').classList.add('hidden'); $('comunaUpdate').classList.remove('hidden'); $('comunaCancel').classList.remove('hidden');
    });
    list.querySelectorAll('.comuna-del').forEach(b=> b.onclick=()=>{
      if(!confirm('¿Borrar evento anual?')) return;
      const arr=getComunaData().list; const idx=arr.findIndex(x=>x.id===b.dataset.id); if(idx>=0) arr.splice(idx,1);
      scheduleSave(); renderComunaDialog(); renderLuna();
    });
  }
  // date default
  const dateIn=$('comunaDate'); if(dateIn && !dateIn.value) dateIn.value=cal.fmtKey.format(new Date());
}
function setupComunaDialog(){
  const btn=$('btnComuna'); if(btn) btn.onclick=()=>{ renderComunaDialog(); $('comunaDialog').showModal(); };
  const btnIgl=$('btnIglesias');
  if(btnIgl && !btnIgl.dataset.w){
    btnIgl.dataset.w='1';
    btnIgl.onclick=()=>{
      try{
        if(window.IglesiasPenco && typeof window.IglesiasPenco.open==='function') window.IglesiasPenco.open();
        else if(window.IglesiasPenco && typeof window.IglesiasPenco.render==='function'){ window.IglesiasPenco.render(); $('iglesiasDialog').showModal(); }
        else $('iglesiasDialog').showModal();
      }catch(e){ try{ $('iglesiasDialog').showModal(); }catch(e2){} }
    };
  }
  const ct=$('comunaCloseTop'), cb=$('comunaClose'); if(ct) ct.onclick=()=>$('comunaDialog').close(); if(cb) cb.onclick=()=>$('comunaDialog').close();
  const add=$('comunaAdd'); if(add) add.onclick=()=>{
    const date=$('comunaDate').value; const nombre=$('comunaName').value.trim(); if(!date||!nombre) return alert('Fecha y nombre obligatorios');
    const md=date.slice(5); const rec={ id:'c'+Date.now(), md, nombre, desc:$('comunaDesc').value.trim(), icon:$('comunaIcon').value.trim()||'🎉', cat:$('comunaCat').value };
    getComunaData().list.push(rec); scheduleSave(); $('comunaName').value=''; $('comunaDesc').value=''; renderComunaDialog(); renderLuna();
  };
  const upd=$('comunaUpdate'); if(upd) upd.onclick=()=>{
    const d=getComunaData().list.find(x=>x.id===comunaEditingId); if(!d) return;
    const date=$('comunaDate').value; if(!date) return;
    d.md=date.slice(5); d.nombre=$('comunaName').value.trim(); d.desc=$('comunaDesc').value.trim(); d.icon=$('comunaIcon').value.trim()||'🎉'; d.cat=$('comunaCat').value;
    scheduleSave(); comunaEditingId=null; $('comunaAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('comunaCancel').classList.add('hidden'); $('comunaName').value=''; $('comunaDesc').value=''; renderComunaDialog(); renderLuna();
  };
  const cancel=$('comunaCancel'); if(cancel) cancel.onclick=()=>{ comunaEditingId=null; $('comunaAdd').classList.remove('hidden'); $('comunaUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('comunaName').value=''; $('comunaDesc').value=''; };
}
setTimeout(setupComunaDialog, 882);

// === PRIMEROS AUXILIOS ===
let firstAidTab = 'actuar';
function renderFirstAidPanel(tab){
  firstAidTab = tab || firstAidTab;
  const ids = {actuar:'tabFA1', rcp:'tabFA2', heridas:'tabFA3', quemaduras:'tabFA4', trauma:'tabFA5', botiquin:'tabFA6'};
  Object.entries(ids).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===firstAidTab); });
  const box = $('firstAidPanel'); if(!box) return;
  let html = '';
  if(firstAidTab==='actuar'){
    html += `<div class="menstrual-card su-f24d6f">
      <h4 class="su-0562fa">🚨 PAS — Proteger · Avisar · Socorrer</h4>
      <p class="muted su-11a508">En Penco, con marejada y cerros, la escena puede ser cambiante. Nunca te conviertas en segunda víctima.</p>
      <div class="help-grid su-8a77e5">
        <div class="help-card"><h4>1️⃣ Proteger</h4><p class="su-11a508">Haz segura la escena: corta gas/cocina, aleja de agua/cable eléctrico, usa guantes si hay sangre. Señaliza si es en carretera Penco-Lirquén.</p></div>
        <div class="help-card"><h4>2️⃣ Avisar — 131</h4><p class="su-11a508">Llama <b>131 SAMU</b> (24h) o <b>132 Bomberos</b> si hay atrapados. Di: <i>“Estoy en Penco, calle X con Y, referencia (CESFAM/playa), adulto/niño, consciente sí/no, respira sí/no, sangra mucho sí/no”</i>. No cuelgues primero. Si no tienes señal, pide a otra persona que llame.</p></div>
      </div>
      <div class="help-card su-8a77e5"><h4>3️⃣ Socorrer — Evaluación primaria (XABCDE)</h4><p class="su-a6c665"><b>X</b> Hemorragia exsanguinante → presiona ya · <b>A</b> Vía aérea → abre frente-mentón si no hay trauma · <b>B</b> Respiración → mira 10s · <b>C</b> Circulación → pulso/sangrado · <b>D</b> Discapacidad (¿responde? habla, dolor, inconsciente) · <b>E</b> Exposición → abriga (hipotermia en Penco en invierno). Si inconsciente pero respira → <b>Posición Lateral de Seguridad</b>; si no respira → inicia RCP (pestaña siguiente).</p></div>
      <details class="menstrual-details su-8a77e5" open><summary>🗒️ Protocolo telefónico — qué decir al 131</summary><p class="muted su-a6c665">1. Lugar exacto + comuna Penco, nº, intersección, punto de referencia (Playa Penco / CESFAM / Cerro Verde).<br>2. Edad y sexo aproximado, ¿cuántas víctimas?<br>3. ¿Consciente? ¿Respira? ¿Sangra mucho? ¿Convulsiona?<br>4. ¿Qué pasó? (caída, atropello, ahogamiento, infarto).<br>5. Tu nombre y teléfono. Mantén línea, sigue instrucciones del operador. Si te dice “comprime”, pon altavoz.</p></details>
    </div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>😵‍💫 Desmayo (síncope)</h4><p class="su-11a508">Acuesta boca arriba, eleva piernas 30cm, afloja ropa, ventila, controla respiración 2 min. Si no despierta en 1 min o convulsiona → 131. No le des agua si está inconsciente.</p></div>
      <div class="help-card"><h4>⚡ Convulsión</h4><p class="su-11a508">No sujetes, no metas nada en la boca, aparta objetos, pon algo blando bajo cabeza, cronometra. Al terminar → lateral seguridad. Si dura &gt;5 min, se repite, o es primera vez → 131. Anota hora y duración.</p></div>
      <div class="help-card"><h4>🧠 ACV — reconoce FAST</h4><p class="su-11a508"><b>F</b> Face caída de un lado — pide sonreír<br><b>A</b> Arms — pide levantar brazos, ¿uno cae?<br><b>S</b> Speech — habla raro o no entiende<br><b>T</b> Time — llama 131 de inmediato, anota hora inicio. No le des aspirina sin indicación.</p></div>
      <div class="help-card"><h4>💔 Dolor torácico / Infarto</h4><p class="su-11a508">Opresión pecho 5+ min con irradiación a brazo/mandíbula, sudor frío, náusea, falta de aire → 131 ya, recuesta semi-sentado, afloja ropa, no caminar/esforzar, si toma medicación y la tiene a mano ayúdale, monitorea pulso. No manejes tú a urgencias si hay SAMU.</p></div>
    </div>`;
  } else if(firstAidTab==='rcp'){
    html += `<div class="help-grid">
      <div class="help-card su-f90540"><h4>🫀 RCP básico adulto — 30:2</h4><p class="su-a6c665">Solo si <b>no respira y no responde</b>. 1) Confirma, pide 131 y DEA si hay. 2) Víctima en suelo duro. 3) Talón de mano en centro del pecho, otra encima, brazos rectos. 4) <b>Comprime 5-6 cm, 100-120/min</b> (ritmo “Stayin’ Alive”), deja que el pecho vuelva. 5) 30 compresiones → 2 ventilaciones si sabes (si no, solo comprime). 6) No pares hasta que llegue ayuda o respire. Si hay DEA, sigue sus instrucciones, no toques durante descarga.</p><p class="muted su-0d5be0">Curso práctico recomendado en CESFAM/Bomberos Penco — esta guía no reemplaza práctica presencial.</p></div>
      <div class="help-card"><h4>👶 Niños y lactantes — diferencias</h4><p class="su-a6c665"><b>Niño 1-8 años:</b> 1 mano si es pequeño, profundidad 1/3 del tórax (~5cm), 30:2 igual, si 2 reanimadores 15:2.<br><b>Lactante &lt;1 año:</b> 2 dedos centro pecho, 4cm profundidad, 30:2 (solo 15:2 con 2 reanimadores), no inclinación excesiva de cabeza.<br>Si te ahogas solo, llama 131 y haz compresiones contra respaldo de silla.</p></div>
    </div>
    <div class="menstrual-card su-4bb1f8"><h4>🫁 Atragantamiento — Heimlich</h4>
      <div class="help-grid su-fe7b49">
        <div class="help-card"><h4>Adulto consciente que no tose/habla</h4><p class="su-11a508">Abraza por detrás, puño sobre ombligo (sobre cicatriz umbilical, bajo esternón), otra mano encima, compresiones en J hacia adentro y arriba (5 veces). Alterna 5 palmadas entre omóplatos + 5 Heimlich hasta que expulse o llegue ayuda. Si queda inconsciente → inicia RCP.</p></div>
        <div class="help-card"><h4>🤰 Embarazada / obeso</h4><p class="su-11a508">Compresiones en <b>centro del esternón</b>, no en abdomen. Misma alternancia 5+5.</p></div>
        <div class="help-card"><h4>👶 Lactante atragantado</h4><p class="su-11a508">Boca abajo sobre antebrazo, cabeza más baja que tronco, 5 palmadas suaves entre omóplatos. Gira boca arriba, 5 compresiones con 2 dedos en centro pecho. Repite. Si pierde conciencia → RCP lactante. No metas dedos a ciegas.</p></div>
        <div class="help-card"><h4>🪞 Si te atragantas solo</h4><p class="su-11a508">Tose fuerte, si no puedes, apoya tu abdomen sobre respaldo de silla/mesón y haz presión brusca hacia adentro-arriba. Llama 131 aunque lo expulses — revisa vía aérea en Hospital.</p></div>
      </div>
    </div>
    <div class="menstrual-card su-4adf8c"><h4>🌊 Ahogamiento (mar/piscina) — Penco costa</h4><p class="muted su-a6c665">No entres al agua sin salvavidas/cuerda; pide rescate (Armada 137). Si rescatas: saca sin golpear, acuesta, evalúa respiración. Si no respira → RCP + 131 de inmediato. No hagas “sacar agua” apretando abdomen. Abriga (hipotermia). Si vomita → lateral. Tras cualquier inmersión, aunque respire, evalúalo en Hospital (edema tardío).</p></div>`;
  } else if(firstAidTab==='heridas'){
    html += `<div class="help-grid">
      <div class="help-card"><h4>🩹 Corte leve / erosión</h4><p class="su-a6c665">Lava manos, presiona con gasa limpia, lava con agua potable abundante (no alcohol directo), retira tierra visible, seca, povidona si hay solo alrededor (no dentro profunda), tapa con apósito limpio. Cambia diario. Vigila: enrojecimiento creciente, pus, fiebre → CESFAM. Vacuna antitetánica al día.</p></div>
      <div class="help-card su-55637b"><h4>🩸 Hemorragia grave</h4><p class="su-a6c665"><b>Presión directa</b> con gasa/compresa, no retires, añade capas. Eleva extremidad si no hay fractura. <b>Torniquete</b> solo si sangrado masivo que no para en extremidad (cinturón/ancho 5cm, 5cm sobre herida, anota hora, no lo sueltes). Llama 131. No quites objeto clavado — estabilízalo. Shock: pálido, frío, sed → acuesta, eleva piernas, abriga.</p></div>
      <div class="help-card"><h4>👃 Sangrado nasal</h4><p class="su-11a508">Siéntate inclinado adelante, presiona ala blanda de nariz 10-15 min sin soltar, respira por boca, no te suenes ni te acuestes. Frío local. Si dura &gt;20 min, sangra mucho o es por golpe fuerte → SAR/Hospital.</p></div>
      <div class="help-card"><h4>🐶 Mordedura / araña</h4><p class="su-11a508">Lava con agua y jabón 5 min, no cierres, cubre, consulta CESFAM (antirrábica/antitetánica). Si es araña de rincón (violín) → lleva araña/foto, marca hora, aplica frío, no cortes. En Penco, conserva ejemplar para identificación. Si alergia (hinchazón cara/dificultad respirar) → 131.</p></div>
    </div>
    <div class="menstrual-card su-d2c171"><h4>🦟 Picaduras — manejo local</h4><p class="muted su-a6c665"><b>Abeja/avispa:</b> retira aguijón raspando (no aprietes), lava, frío 10 min, antihistamínico si pica generalizado. <b>Zancudo/ pulga:</b> lava, no rasques, frío. Vigila infección. <b>Medusa / fragata portuguesa</b> (costa Penco): lava con <b>agua de mar</b> (no dulce), retira tentáculos con pinza/guante, no frotes con arena, frío, vinagre no. Si dolor extenso, vómitos, dificultad respirar → 131. Reporta a Capitanía 41 275 1006.</p></div>`;
  } else if(firstAidTab==='quemaduras'){
    html += `<div class="help-grid">
      <div class="help-card su-1fadd9"><h4>🔥 Quemadura térmica</h4><p class="su-a6c665"><b>1º grado</b> (roja, duele): enfría con <b>agua potable 15-20 min</b> (no hielo, no pasta dental, no mantequilla), cubre con gasa limpia, hidrata, analgésico si no hay alergia.<br><b>2º grado</b> (ampolla): no revientes, enfría, cubre sin apretar, SAR/Hospital.<br><b>3º grado</b> (blanca/negra, no duele): no retires ropa pegada, cubre con paño limpio húmedo, 131 ya. En cara/manos/ingles o extensa → 131.</p></div>
      <div class="help-card"><h4>💨 Inhalación de humo (incendio, brasero)</h4><p class="su-11a508">Saca al aire, 131, semi-sentado si respira, lateral si inconsciente pero respira. Vigila tos persistente, hollín en nariz — indica daño vía aérea. No vuelvas a entrar por objetos. En Penco inviernos, ventila brasero a leña/parafina: bota ceniza afuera fría.</p></div>
      <div class="help-card"><h4>🧴 Química (cloro, soda)</h4><p class="su-11a508">Piel: lava agua abundante 20 min, retira ropa contaminada. Ojos: lava 15 min párpado abierto, agua templada. No neutralices con vinagre. Lleva etiqueta del producto a urgencias. 131 / CITUC 22 635 3800.</p></div>
      <div class="help-card"><h4>⚗️ Intoxicación / envenenamiento</h4><p class="su-11a508">Llama <b>CITUC 22 635 3800</b> (24h) y 131 si grave. No induzcas vómito, no des leche. Guarda envase y anota hora y cantidad. Si no respira → RCP. Niños: guarda medicamentos/bleach bajo llave — en Penco, guarda a altura, nunca en botella de bebida.</p></div>
    </div>
    <div class="menstrual-card su-4adf8c"><h4>🌡️ Golpe de calor & Hipotermia — Penco costero</h4><p class="muted su-a6c665"><b>Calor</b> (verano playa, sin sombra): náusea, dolor cabeza, piel caliente → sombra, desabrocha, paños húmedos en cuello/axilas, sorbitos agua, si confuso/vomita o no suda → 131.<br><b>Hipotermia</b> (viento sur, lluvia, mar): temblor → quietud → somnolencia → quita ropa mojada, abriga seco, manta, bebida tibia si consciente, no alcohol, no fricción brusca, 131 si grave. En marejadas, no te acerques a rocas por fotos.</p></div>`;
  } else if(firstAidTab==='trauma'){
    html += `<div class="help-grid">
      <div class="help-card"><h4>🦴 Fractura / sospecha</h4><p class="su-11a508">Dolor intenso, deformidad, crujido, impotencia: <b>no endereces</b>, no masajees. Inmoviliza como está (tabla/cartón acolchado), por encima y debajo de la fractura. Frío intermitente, eleva si es extremidad. Llama 131 / traslada a Hospital Penco sin mover mucho. Controla hemorragia y shock.</p></div>
      <div class="help-card"><h4>🤸 Esguince / luxación</h4><p class="su-11a508">Reposo, Hielo 15min cada 2h (con paño), Compresión suave, Elevación (RICE). Si deformidad o clic → no intentes encajar, inmoviliza y 131. Usa cabestrillo con pañuelo para brazo.</p></div>
      <div class="help-card"><h4>🧠 TEC — golpe en cabeza</h4><p class="su-11a508">Si cayó de altura, golpe fuerte, pérdida conciencia aunque breve, vómito, dolor cabeza creciente, pupilas distintas, sangrado oído → 131, no lo dejes solo 24h, no automediques, no duermas sin vigilancia. Niños: llanto inconsolable o somnolencia → urgencias ya.</p></div>
      <div class="help-card su-55637b"><h4>🦽 Sospecha lesión de columna (caída, zambullida, atropello)</h4><p class="su-11a508"><b>No muevas</b>, no lo sientes, no le quites casco. Estabiliza cabeza con manos, pide 131, abriga. Solo mueve si hay peligro inminente (fuego) arrastrando en bloque.</p></div>
    </div>
    <div class="menstrual-card su-d2c171"><h4>🫁 Obstrucción nasal / cuerpo extraño</h4><p class="muted su-11a508">Nariz/oído con objeto: no intentes con pinza profunda, lleva a SAR. Si es pila botón (reloj) → 131 de inmediato (quema en 2h). Atragantamiento ver pestaña RCP.</p></div>`;
  } else if(firstAidTab==='botiquin'){
    html += `<div class="menstrual-card su-7baee2">
      <h4 class="su-e39eba">🎒 Botiquín hogar Penco — revisa cada luna (28 días)</h4>
      <div class="help-grid su-8a77e5">
        <div class="help-card"><h4>🩹 Básico</h4><p class="su-11a508">Guantes desechables, mascarilla, gasas estériles, apósitos, tela adhesiva, vendaje elástico, curitas, suero fisiológico 0,9% (o agua hervida fría), tijera punta roma, pinza, termómetro, linterna, manta.</p></div>
        <div class="help-card"><h4>💊 Botiquín (con receta según caso)</h4><p class="su-11a508">Paracetamol/ibuprofeno, antihistamínico, sales rehidratación oral, povidona yodada, alcohol 70% (solo para instrumental), crema quemadura leve. Guarda prospectos y fechas de vencimiento. No automediques antibióticos.</p></div>
        <div class="help-card"><h4>📄 Documentos</h4><p class="su-11a508">Fotocopia carnet, previsión, alergias, medicamentos crónicos, contactos (131/132/133, Hospital 41 272 6300, persona de confianza), plan de evacuación a cerro si vives bajo 30 msnm (tsunami).</p></div>
        <div class="help-card"><h4>🌧️ Extra Penco invernal</h4><p class="su-11a508">Impermeable, nylon, silbato, power bank, agua 2L p/persona, barras cereal, copia llaves. En bolsa ziploc seca. Si vives cerca de estero, ten saco de arena y pala.</p></div>
      </div>
      <p class="muted su-a953a7">Guarda en lugar seco, alto para niños, señalizado. Reemplaza lo usado y lo vencido. Haz simulacro familiar: ¿quién llama, quién abre la puerta a SAMU, dónde esperan?</p>
    </div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>🗓️ Rutina mensual</h4><p class="su-11a508">Luna 1 revisa vencimientos · Luna 4 simulacro · Luna 7 reposición · Luna 10 curso Bomberos/CESFAM. Anota en “Notas de la Luna”.</p></div>
      <div class="help-card"><h4>♿ Inclusivo</h4><p class="su-11a508">Si hay adulto mayor/movilidad reducida: ten silla/camilla cerca, lista de medicamentos en refrigerador visible para rescatistas, pulsera con datos.</p></div>
    </div>`;
  }
  box.innerHTML = html;
}
function setupFirstAidDialog(){
  const btn=$('btnFirstAid'); if(btn) btn.onclick=()=>{ renderFirstAidPanel('actuar'); $('firstAidDialog').showModal(); };
  const ct=$('firstAidCloseTop'), cb=$('firstAidClose'); if(ct) ct.onclick=()=>$('firstAidDialog').close(); if(cb) cb.onclick=()=>$('firstAidDialog').close();
  ['tabFA1','tabFA2','tabFA3','tabFA4','tabFA5','tabFA6'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.onclick=()=>{ const map={tabFA1:'actuar',tabFA2:'rcp',tabFA3:'heridas',tabFA4:'quemaduras',tabFA5:'trauma',tabFA6:'botiquin'}; renderFirstAidPanel(map[id]); };
  });
}
setTimeout(setupFirstAidDialog, 883);

// === CUIDADO ANIMAL ===
let animalCareTab = 'tenencia';
function renderAnimalCarePanel(tab){
  animalCareTab = tab || animalCareTab;
  const ids = {tenencia:'tabAC1', auxilios:'tabAC2', salud:'tabAC3', bienestar:'tabAC4', humedal:'tabAC5'};
  Object.entries(ids).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===animalCareTab); });
  const box = $('animalCarePanel'); if(!box) return;
  let html='';
  if(animalCareTab==='tenencia'){
    html+= `<div class="menstrual-card su-ede178">
      <h4 class="su-559282">🏠 Tenencia responsable — Ley 21.020 (Ley Cholito)</h4>
      <p class="muted su-11a508">Eres responsable legal de su bienestar, registro y daños. Multas 1-30 UTM.</p>
      <div class="help-grid su-8a77e5">
        <div class="help-card"><h4>📝 Obligatorio en Penco</h4><p class="su-a6c665">1. <b>Microchip + Registro</b> en <b>registratumascota.cl</b> (con Clave Única) — perro y gato.<br>2. <b>Vacunas y desparasitación</b> al día (ver pestaña 💉).<br>3. <b>Esterilización recomendada</b> (gratuita en operativos DIDECO 41 226 1020).<br>4. <b>Paseo con correa</b>, bozal si es razas fuertes, <b>bolsa para fecas</b> — multa municipal si no recoges (Ord. Penco).<br>5. <b>No abandono:</b> si no puedes cuidar, busca adopción, no lo sueltes en humedal/cerro.</p></div>
        <div class="help-card"><h4>🏡 Patio Penco</h4><p class="su-a6c665">Viento sur y lluvia horizontal: cucha elevada, seca, con techo y aislación, no amarrado con cadena corta. Agua fresca diaria, sombra en verano (Walüng), no dejar en auto ni balcón al sol. Si arriendas, confirma que acepten mascotas.</p></div>
      </div>
      <details class="menstrual-details su-8a77e5" open><summary>🐕‍🦺 Paseo seguro en costanera / humedal</summary><p class="muted su-a6c665">Correa 1,5-2m, no extensible en zona de aves. Lleva agua y bolsa. Evita horas de calor 12-17h (asfalto quema patas — prueba 7s con tu mano). Si tu perro persigue aves, usa correa corta: el <b>chorlo nevado</b> nidifica en arena Oct-Feb y abandona nido si lo asustan.</p></details>
    </div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>🐶 Perro — rutina diaria</h4><p class="su-11a508">2 paseos 20-30min + juego olfativo, agua limpia, croqueta según peso/edad (no sobras condimentadas), cepillado, no huesos astillables. Sociabiliza de cachorro.</p></div>
      <div class="help-card"><h4>🐱 Gato — indoor</h4><p class="su-11a508">Indoor o con catio: arenero limpio diario, rascador, juguete, agua fresca lejos de comida, esteriliza a los 5-6 meses. No collar con cascabel permanente.</p></div>
    </div>`;
  } else if(animalCareTab==='auxilios'){
    html+= `<div class="help-grid">
      <div class="help-card su-55637b"><h4>🩸 Herida / hemorragia</h4><p class="su-a6c665">Guantes, presiona con gasa limpia 5 min sin retirar, venda suave. No uses alcohol directo ni torniquete improvisado apretado. Collar isabelino/cartón para que no lama. Traslada a vet (41 222 3456 Conce 24h) si es profunda, no para de sangrar o hay objeto clavado.</p></div>
      <div class="help-card"><h4>🚗 Atropello</h4><p class="su-a6c665">No lo abraces brusco: puede morder por dolor. Inmoviliza en manta rígida, controla hemorragia, abriga (shock), llama vet. Si es callejero, avisa a Vet Municipal 41 226 1017 y Carabineros 133. Anota patente si se da a la fuga.</p></div>
      <div class="help-card"><h4>🤢 Envenenamiento (raticida, anticongelante, chocolate, cebolla, lirio)</h4><p class="su-a6c665"><b>No des leche, aceite ni induzcas vómito</b>. Retira resto del hocico, guarda envase, llama vet ya. Lirio y anticongelante son letales en gatos/perros. Xilitol (chicle) → hipoglucemia grave en perro. Tiempo es oro.</p></div>
      <div class="help-card"><h4>🥵 Golpe de calor</h4><p class="su-a6c665">Jadeo extremo, babeo, tambaleo, encías rojas → sombra, agua fresca (no helada) en patas y panza, ventilador, ofrece agua a sorbos, no lo sumerjas en hielo. Traslada ya: daño renal. En Penco, nunca dejes perro en auto ni patio sin sombra en verano.</p></div>
    </div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>🫁 Atragantamiento animal</h4><p class="su-11a508">Perro: si tose y puede respirar, déjalo toser. Si no respira y está consciente, abre hocico, mira objeto, retíralo con pinza si lo ves (no a ciegas). Si inconsciente → maniobra Heimlich adaptada (compresión abdominal suave por detrás). Gato similar. Tras expulsar, vet.</p></div>
      <div class="help-card"><h4>🌀 Convulsión</h4><p class="su-11a508">No sujetes, aparta muebles, baja luz y ruido, cronometra, no metas mano en hocico. Al terminar, abriga y traslada. Anota duración. Si &gt;5min o se repite → urgencia.</p></div>
      <div class="help-card"><h4>🦂 Picadura abeja / araña</h4><p class="su-11a508">Retira aguijón raspando, frío 10min, vigila hinchazón cara/dificultad respirar (anafilaxia) → vet ya. Araña de rincón: lleva ejemplar, frío, no cortes.</p></div>
      <div class="help-card"><h4>🧰 Cómo trasladar seguro</h4><p class="su-11a508">Manta como camilla, hocico con bozal casero (venda suave, no aprietes si vomita o tiene dificultad respirar), cabeza levemente elevada si respira mal. Lleva carnet vacuna. En moto/auto, jaula o arnés.</p></div>
    </div>`;
  } else if(animalCareTab==='salud'){
    html+= `<div class="menstrual-card su-4ab442">
      <h4 class="su-721a46">💉 Vacunas & desparasitación — calendario Penco</h4>
      <div class="help-grid su-8a77e5">
        <div class="help-card"><h4>🐶 Cachorro perro</h4><p class="su-a6c665"><b>45 días:</b> Puppy DP<br><b>60/90/120 días:</b> Óctuple (3 dosis)<br><b>120 días:</b> Antirrábica (obligatoria, anual)<br><b>+</b> KC si va a hotel canil.<br>Desparasita interna cada 15 días hasta 3 meses, luego mensual hasta 6m, luego cada 3 meses.</p></div>
        <div class="help-card"><h4>🐶 Adulto perro</h4><p class="su-a6c665"><b>Anual:</b> Óctuple + Antirrábica.<br><b>Cada 3 meses:</b> antiparasitario interno (según peso).<br><b>Mensual:</b> pipeta/pastilla pulga-garrapata (Bío-Bío hay garrapatas todo el año, más en Walüng).<br>Chequeo vet 1-2 veces/año.</p></div>
        <div class="help-card"><h4>🐱 Gatito</h4><p class="su-a6c665"><b>60/90/120 días:</b> Triple felina (3 dosis)<br><b>120 días:</b> Antirrábica<br><b>Leucemia:</b> test + vacuna si negativo.<br>Desparasita igual que perro. Esteriliza 5-6 meses.</p></div>
        <div class="help-card"><h4>✂️ Esterilización municipal</h4><p class="su-a6c665">Gratuita vía SUBDERE — inscribe en DIDECO 41 226 1020. Ayuna 8h, lleva manta, collar isabelino. Post-op: 10 días reposo, no lamer, antibiótico según receta. Evita camadas no deseadas y reduce tumores/abandono.</p></div>
      </div>
      <p class="muted su-d47a97">Siempre verifica con tu veterinario: calendario puede variar por marca y estado del animal.</p>
    </div>
    <div class="menstrual-card su-d2c171"><h4>🚨 Signos de alarma — consulta hoy</h4><p class="muted su-a6c665">No come 24h + decaído, vómitos/diarrea con sangre, no orina, dificultad respirar, bulto que crece rápido, cojera &gt;24h, rascado con heridas, cambio brusco de conducta. No automediques con paracetamol/ibuprofeno: <b>es tóxico para perros y letal para gatos</b>.</p></div>`;
  } else if(animalCareTab==='bienestar'){
    html+= `<div class="help-grid">
      <div class="help-card"><h4>🥣 Alimentación & agua</h4><p class="su-a6c665">Croqueta según edad/peso (cachorro/adulto/senior) — raciona, no a libre demanda. Agua fresca siempre, cambia diario, lava bebedero. No chocolate, xilitol, uva/pasa, cebolla/ajo, huesos cocidos astillables, leche en exceso. En Penco, guarda alimento seco en tarro hermético (humedad).</p></div>
      <div class="help-card"><h4>🐾 Paseo & juego</h4><p class="su-a6c665">Perro: 2 paseos + 15min olfato/juego. No lo sueltes cerca de avenida o humedal. Gato: juguete caña 10min, rascador, cajas, hierba gatera. Castra → menos fuga.</p></div>
      <div class="help-card"><h4>🧹 Higiene</h4><p class="su-a6c665">Cepillado semanal (más en muda Rimü), baño cada 3-4 semanas con shampoo vet, no uses detergente. Corte uñas cada 3 semanas, limpieza oídos si olor. Arenero gato: 1 por gato +1, en lugar tranquilo.</p></div>
      <div class="help-card"><h4>❄️☀️ Penco clima extremo</h4><p class="su-a6c665"><b>Invierno Pukem:</b> cucha aislada del suelo, manta seca, no lo dejes en patio con helada/lluvia toda la noche. <b>Verano Walüng:</b> sombra, agua, no paseo 12-17h, no auto. Tras marejada, lava patas si pisó petróleo/algas rojas.</p></div>
    </div>
    <div class="menstrual-card su-4adf8c"><h4>🏠 Si encuentras animal perdido/herido</h4><p class="muted su-a6c665">1) Foto + ubicación (calle, playa, humedal) y comparte en redes Penco. 2) Revisa chapita/código QR; si tiene chip, Vet Municipal 41 226 1017 lo lee gratis. 3) No lo persigas si está asustado — usa comida. 4) Herido → traslada con manta a vet; si es fauna silvestre (cisne, gaviota enferma) → no lo toques sin guantes, llama SAG 41 274 0600. 5) Denuncia abandono/maltrato: BIDEMA 41 215 3400 o 134 + evidencia (foto/video, fecha).</p></div>`;
  } else if(animalCareTab==='humedal'){
    html+= `<div class="menstrual-card su-f417c2">
      <h4 class="su-721a46">🦅 Humedal Rocuant-Andalién — aves & fauna protegida</h4>
      <p class="muted su-a6c665">Sitio prioritario Penco-Lirquén: nidifican <b>chorlo nevado, pilpilén, zarapito</b>. Ley 19.300 y Ordenanza Municipal prohíben caza, captura, ingreso de perros sueltos y botar basura.</p>
      <div class="help-grid su-8a77e5">
        <div class="help-card"><h4>🚫 No hagas</h4><p class="su-11a508">No sueltes perro sin correa en playa/humedal (espanta nidada y multa). No des <b>pan</b> a cisnes/patos (hincha, desnutre) — si quieres alimentar, usa grano específico con autorización. No toques nidos ni uses flash. No entres con 4x4 a la arena.</p></div>
        <div class="help-card"><h4>✅ Qué sí</h4><p class="su-11a508">Observa a 30m con binoculares, silencio, no dejes rastro. Recoge tus fecas de perro en bolsa y llévala. Reporta varamiento de lobo/cisne a SERNAPESCA 800 320 032 o SAG 41 274 0600. Participa en limpiezas de playa.</p></div>
        <div class="help-card"><h4>📅 Calendario fauna</h4><p class="su-11a508"><b>Oct-Feb:</b> chorlo nevado nidifica en arena — no pises dunas.<br><b>Sep-Mar:</b> zarapito migratorio en Rocuant.<br><b>Ago-Nov:</b> ballenas frente a golfo (no acercar embarcación &lt;300m).</p></div>
        <div class="help-card"><h4>📞 Reportes</h4><p class="su-11a508"><b>SAG Bío-Bío:</b> 41 274 0600 (fauna silvestre herida)<br><b>SERNAPESCA:</b> 800 320 032 (varamiento lobo/ballena)<br><b>Municipal Medio Ambiente:</b> 41 226 1017<br><b>Capitanía Lirquén:</b> 41 275 1006 (contaminación mar)</p></div>
      </div>
    </div>
    <div class="menstrual-card su-d2c171"><h4>🐾 Gatos ferales & perros comunitarios</h4><p class="muted su-a6c665">Penco tiene colonias gestionadas con método TNR (captura-esteriliza-retorna). No los alimentes con sobras en vía pública sin coordinar con Medio Ambiente — genera foco de roedores. Si quieres ayudar, ofrece traslado a operativo o adopción.</p></div>`;
  }
  box.innerHTML = html;
}
function setupAnimalCareDialog(){
  const btn=$('btnAnimalCare'); if(btn) btn.onclick=()=>{ renderAnimalCarePanel('tenencia'); $('animalCareDialog').showModal(); };
  const ct=$('animalCareCloseTop'), cb=$('animalCareClose'); if(ct) ct.onclick=()=>$('animalCareDialog').close(); if(cb) cb.onclick=()=>$('animalCareDialog').close();
  ['tabAC1','tabAC2','tabAC3','tabAC4','tabAC5'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.onclick=()=>{ const map={tabAC1:'tenencia',tabAC2:'auxilios',tabAC3:'salud',tabAC4:'bienestar',tabAC5:'humedal'}; renderAnimalCarePanel(map[id]); };
  });
}
setTimeout(setupAnimalCareDialog, 884);

// === VIOLENCIA DOMÉSTICA — TIPOS Y QUÉ HACER ===
let violenceTab = 'tipos';
function renderViolencePanel(tab){
  violenceTab = tab || violenceTab;
  const ids = {tipos:'tabVD1', senales:'tabVD2', quehacer:'tabVD3', plan:'tabVD4', redes:'tabVD5', ayudar:'tabVD6'};
  Object.entries(ids).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===violenceTab); });
  const box = $('violencePanel'); if(!box) return;
  let html='';
  if(violenceTab==='tipos'){
    html+= `<div class="menstrual-card su-ffd1a9">
      <h4 class="su-399074">📚 Los 7 tipos principales — Ley 20.066 VIF y Ley 21.675 Integral (Chile)</h4>
      <p class="muted su-11a508">Toda violencia es grave aunque no deje marca visible. Puede ocurrir en pareja (pololeo, convivencia, matrimonio, ex), familia, o a hijos/as. No necesitas que sea “físico” para pedir ayuda. Reconocer el tipo te ayuda a nombrar y actuar.</p>
      <p class="muted su-0d5be0">Basado en definiciones SERNAMEG, Ley VIF y OMS. No es diagnóstico legal — cada caso lo califica Fiscalía/Tribunal.</p>
    </div>
    <div class="help-grid su-d2c171">
      <div class="help-card su-7266f7"><h4>👊 1. Física</h4><p class="su-a6c665"><b>Qué es:</b> uso de fuerza que daña cuerpo.<br><b>Ejemplos:</b> empujones, tirones de pelo, cachetadas, golpes, patadas, quemaduras, intentos de estrangulamiento (“me apretó el cuello”), lanzar objetos, encerrar, no dejar salir.<br><b>Señal clave:</b> miedo a su reacción, justificar moretones, ropa para ocultar.<br><b>Riesgo alto:</b> si hubo estrangulamiento, uso de armas, o “si me dejas te mato” → busca ayuda ese día.</p><div class="su-7cd661"><b class="su-51a029">Qué hacer ahora → ver pestaña 🛡️</b><p class="muted su-aa314c">No te quedes sola/o tras golpe. Ve a SAR/CESFAM Penco <b>hoy</b> para constatación de lesiones (sirve aunque no denuncies aún) y guarda fotos/fechas en lugar seguro.</p></div></div>
      <div class="help-card su-91932e"><h4>🧠 2. Psicológica / Emocional</h4><p class="su-a6c665"><b>Qué es:</b> control, humillación y miedo sin tocar.<br><b>Ejemplos:</b> insultos (“tonta, inútil”), gritos, desprecios frente a otros, culparte de todo, celos extremos, revisar celular, prohibir salir/vestirte/estudiar, amenazas (“te quitaré a los niños”), gaslighting (“estás loca, yo nunca dije eso”), ley del hielo prolongada, romper tus cosas.<br><b>Señal clave:</b> ansiedad constante, pedir permiso por todo, baja autoestima, aislarte de familia/amigos.</p><div class="su-bef501"><b class="su-a067b4">Qué hacer</b><p class="muted su-aa314c">No es “sensibilidad tuya”. Anota fechas/frases, guarda audios/capturas en correo oculto. Habla con persona de confianza y llama 1455 para orientación gratuita y confidencial.</p></div></div>
      <div class="help-card su-ce4328"><h4>🔒 3. Sexual</h4><p class="su-a6c665"><b>Qué es:</b> cualquier acto sexual sin tu consentimiento libre — <b>dentro de pareja también es delito</b> (art. 361 CP).<br><b>Ejemplos:</b> forzar relaciones, chantaje (“si no quieres es porque andas con otro”), obligar a prácticas que no quieres, grabar/difundir fotos íntimas sin permiso, impedir anticoncepción, tocar a la fuerza. No necesitas “resistir” para que sea abuso.<br><b>Señal:</b> culpa, asco, miedo a decir “no”.</p><div class="su-600966"><b class="su-da84ad">Qué hacer</b><p class="muted su-aa314c">Tu “no” basta. Si ocurrió en 72h ve a SAR/Hospital para atención, profilaxis y constatación aunque dudes en denunciar. No te bañes antes si puedes, lleva ropa en bolsa de papel. Llama 1455/149 — no estás sola.</p></div></div>
      <div class="help-card su-3fd46e"><h4>💰 4. Económica / Patrimonial</h4><p class="su-a6c665"><b>Qué es:</b> control del dinero, trabajo o bienes para hacerte depender.<br><b>Ejemplos:</b> quitar sueldo/IFE, no dar para comida/hijos, endeudarte a tu nombre, esconder documentos/RUT/tarjetas, impedir que trabajes/estudies, romper tu celular/herramientas, no pagar pensión alimentos.<br><b>Señal:</b> no tener $ propio, pedir para cada gasto, miedo a que te “corte” el dinero.</p><div class="su-948e44"><b class="su-d33357">Qué hacer</b><p class="muted su-aa314c">Haz copia de carnet, certificados, cuentas, boletas y guarda en correo seguro de confianza. Abre cuenta RUT solo tuya (BancoEstado) y contacta Centro de la Mujer 41 246 7700 para autonomía económica.</p></div></div>
      <div class="help-card su-7e56a1"><h4>👧 5. Vicaria — usando a hijos/as o mascotas</h4><p class="su-a6c665"><b>Qué es:</b> dañar a tus hijos, mascotas o seres queridos para golpearte donde más duele. Reconocida en Ley 21.675.<br><b>Ejemplos:</b> amenazar con quitar custodia, maltratar/ golpear a hijos para castigarte, usar visita para interrogar al niño, dejar de pagar pensión a propósito, matar/amenazar mascota, hablar mal de ti a tus hijos (“tu mamá es mala”).<br><b>Señal:</b> niños con miedo, retrocesos, culpa.</p><div class="su-b56159"><b class="su-a152ab">Qué hacer</b><p class="muted su-aa314c">Documenta, no expongas a niños a careos. Pide medidas de protección en Trib. Familia (41 274 4000) y orientación en Oficina Niñez Penco 41 226 1020. Si hay riesgo para niños llama 149 o 800 730 800.</p></div></div>
      <div class="help-card su-275a30"><h4>📱 6. Digital / Cibernética</h4><p class="su-a6c665"><b>Qué es:</b> control y acoso vía celular/redes — es violencia aunque sea “virtual”. Ley 21.675 la contempla.<br><b>Ejemplos:</b> exigir contraseñas, revisar chats, geolocalizar 24/7, instalar stalkerware, difundir packs/fotos íntimas, crear perfiles falsos, acosar con 100 mensajes/llamadas, amenazar por WhatsApp/IG.<br><b>Señal:</b> borrar chats por miedo, ansiedad al notificar.</p><div class="su-5f8528"><b class="su-a07271">Qué hacer</b><p class="muted su-aa314c">No borres pruebas: saca captura con fecha/hora y guarda en drive seguro. Cambia contraseñas en dispositivo seguro, activa 2 pasos, revisa permisos de ubicación. Denunciable como amenazas/coacción (Fiscalía).</p></div></div>
      <div class="help-card su-5b8d9e"><h4>🚧 7. Social / Aislamiento + Acoso</h4><p class="su-a6c665"><b>Qué es:</b> cortar tu red para que dependas solo de él/ella.<br><b>Ejemplos:</b> prohibir ver familia/amigos, hablar mal de tu gente para alejarte, controlar salidas/horarios, seguirte, esperarte fuera del trabajo, celar hasta con familia.<br><b>Señal:</b> dejar de salir, “mejor no cuento nada para no pelear”.</p><div class="su-bf9122"><b class="su-e3b23c">Qué hacer</b><p class="muted su-aa314c">Mantén al menos 1 contacto de confianza con código secreto. Retoma vínculos de a poco. Grupo de apoyo Centro de la Mujer rompe aislamiento.</p></div></div>
    </div>
    <div class="menstrual-card su-4adf8c"><h4>💡 ¿No sabes qué tipo es? No importa el nombre</h4><p class="muted su-a6c665">Si sientes <b>miedo, culpa, ansiedad, obligación constante o pérdida de libertad</b>, pide orientación igual. El Centro de la Mujer y 1455 te ayudan a ponerle nombre sin juzgar y sin obligarte a denunciar de inmediato.</p></div>`;
  } else if(violenceTab==='senales'){
    html+= `<div class="menstrual-card su-ffd1a9">
      <h4 class="su-399074">⚠️ Señales de alerta — checklist silencioso</h4>
      <p class="muted su-11a508">Marca mentalmente. Si 2-3 te resuenan, pide orientación. No necesitas vivirlas todas para que sea violencia.</p>
      <div class="help-grid su-8a77e5">
        <div class="help-card"><h4>🚩 Señales psicológicas</h4><p class="su-a6c665">• Te insulta, grita o te hace sentir tonta/culpable siempre.<br>• Minimiza: “fue una tontera, exageras”.<br>• Te controla ropa, maquillaje, amistades, redes, horarios.<br>• Celos extremos y acusa infidelidad sin razón.<br>• Te aíslas de familia/amigos para “evitar problema”.</p></div>
        <div class="help-card"><h4>🚩 Señales físicas/sexuales</h4><p class="su-a6c665">• Empujones, zamarreos “suaves” que escalan.<br>• Te aprieta el cuello, aunque sea “jugando”.<br>• Rompe objetos, golpea paredes, te encierra.<br>• Te fuerza o presiona a sexo / no respeta tu no.<br>• Te deja moretones y dice “fue sin querer”.</p></div>
        <div class="help-card"><h4>🚩 Económicas/digital</h4><p class="su-a6c665">• Te quita plata, tarjeta o sueldo.<br>• Te impide trabajar/estudiar.<br>• Revisa tu celular, pide claves, te geolocaliza.<br>• Te endeuda o no paga pensión.<br>• Difunde o amenaza con fotos íntimas.</p></div>
        <div class="help-card"><h4>🚩 En ti misma/o</h4><p class="su-a6c665">• Pides permiso por todo, con ansiedad.<br>• Caminas “pisando huevos”, mides cada palabra.<br>• Justificas su conducta delante de otros.<br>• Sientes vergüenza, culpa o miedo constante.<br>• Tu salud duerme mal, duele estómago/cabeza, sube consumo alcohol.</p></div>
      </div>
    </div>
    <div class="menstrual-card su-0d015f"><h4>🔄 El ciclo de la violencia — por qué cuesta salir (Walker)</h4>
      <div class="help-grid su-fe7b49">
        <div class="help-card"><h4>1️⃣ Tensión</h4><p class="su-11a508">Discusiones, celos, control, gritos. Sientes que “algo va a explotar”. Caminas con cuidado.</p></div>
        <div class="help-card"><h4>2️⃣ Explosión</h4><p class="su-11a508">Golpe, insulto grave, amenaza, ataque sexual. Miedo intenso. Puede durar minutos u horas.</p></div>
        <div class="help-card"><h4>3️⃣ Reconciliación / Luna de miel</h4><p class="su-11a508">Arrepentimiento, regalos, “cambiaré, fue el alcohol/estrés”, cariño. Esperanza de que ahora sí.</p></div>
        <div class="help-card"><h4>4️⃣ Calma</h4><p class="su-11a508">Tranquilidad falsa. Hasta que vuelve la tensión. Cada ciclo se acorta y se agrava.</p></div>
      </div>
      <p class="muted su-e6fe60">Entender el ciclo <b>no justifica</b>. Quedarse no es “gusto”, es esperanza, miedo, dependencia económica, hijos, vergüenza, amenazas o falta de red. Con apoyo, salir es posible.</p>
    </div>
    <details class="menstrual-details su-d2c171" open><summary>🧩 Mitos que encubren violencia</summary>
      <div class="help-grid su-8a77e5">
        <div class="help-card"><h4>❌ “Me cela porque me quiere”</h4><p class="su-11a508">Celo = control, no amor. Amor cuida libertad.</p></div>
        <div class="help-card"><h4>❌ “Solo fue una vez / estaba curado”</h4><p class="su-11a508">Alcohol no crea violencia, la desinhibe. Patrón se repite.</p></div>
        <div class="help-card"><h4>❌ “Aguanto por mis hijos”</h4><p class="su-11a508">Crecer viendo violencia daña más que separarse con apoyo.</p></div>
        <div class="help-card"><h4>❌ “Yo lo provoqué”</h4><p class="su-11a508">Nadie provoca ser golpeada/o. Responsable es quien agrede.</p></div>
      </div>
    </details>`;
  } else if(violenceTab==='quehacer'){
    html+= `<div class="menstrual-card su-dfa7a6"><h4 class="su-0562fa">🛡️ ¿Qué hacer AHORA? — elige tu situación</h4><p class="muted su-11a508">Si hay peligro inmediato → <b>prioriza salir y llamar 133/149</b>. No intentes “arreglar” en medio de la crisis. Luego sigue pasos por tipo.</p></div>
    <div class="help-card su-2a4c9c"><h4>🚨 PELIGRO INMEDIATO — estás en riesgo ahora</h4><p class="su-a6c665"><b>1. Sal:</b> si puedes, anda a pieza con salida, baño con celular, casa vecina, negocio con gente. No discutas en cocina (cuchillos) ni baño sin salida. <b>2. Avisa:</b> 133 Carabineros o 149 Fono Familia (24h). Di: “Violencia intrafamiliar en [calle, nº, Penco], agresor en casa, necesito ayuda”. <b>3. Código silencioso:</b> mensaje a confianza: “¿Me prestas azúcar?” o llama 1455 WhatsApp +56 9 9700 7000. <b>4. Con niños:</b> llévalos contigo, no los dejes. <b>5. Documenta después:</b> fotos lesiones, parte médico SAR. No vuelvas sola/o a buscar cosas.</p></div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>👊 Tras agresión física</h4><p class="su-a6c665"><b>1. Seguridad + salud hoy:</b> SAR Penco 41 272 6350 / Hospital Penco-Lirquén 41 272 6300 → pide <b>constatación de lesiones</b> (aunque no denuncies). <b>2. Pruebas:</b> fotos con luz, fecha, ropa rota guardada en bolsa papel, capturas amenazas. Guarda en correo Drive oculto, no galería. <b>3. No limpies escena</b> si es grave. <b>4. Denuncia o no decide después</b> con apoyo (1455). <b>5. No minimices:</b> estrangulamiento aunque “no dejó marca” es riesgo vital → evalúate hoy.</p></div>
      <div class="help-card"><h4>🧠 Si es psicológica / control</h4><p class="su-a6c665"><b>1. Valida:</b> no es tu imaginación. Anota diario (fecha, frase, contexto, testigos). <b>2. Red:</b> habla con 1 persona segura (familia, CESFAM, Centro Mujer). <b>3. 1455 SERNAMEG</b> te orienta sin obligar a denunciar. <b>4. Límites:</b> “No me grites, hablaremos cuando te calmes” + retírate. Si no respeta, no insistas sola/o. <b>5. Apoyo psicológico gratuito:</b> CESFAM/SAR Penco hora salud mental, Centro Mujer Conce 41 246 7700.</p></div>
      <div class="help-card su-1fadd9"><h4>🔒 Sexual en pareja/expareja</h4><p class="su-a6c665"><b>1. Prioridad tú, no pruebas:</b> alójate segura. <b>2. 72h:</b> SAR/Hospital para protocolo (anticoncepción emergencia, VIH, lesiones genéricas) — no necesitas denunciar para atenderte. <b>3. Si puedes:</b> no te laves, lleva ropa en bolsa papel, anota hora/lugar. <b>4. Denuncia:</b> PDI 134 o Fiscalía (no Carabineros si prefieres privacidad). Lleva acompañante. <b>5. No es tu culpa</b> aunque hayas tomado alcohol o vuelvas con él/ella.</p></div>
      <div class="help-card"><h4>💰 Económica / Patrimonial</h4><p class="su-a6c665"><b>1. Copias ocultas:</b> carnet, escrituras, contratos, liquidaciones, certificados hijos, claves, fotos deudas. Envíalas a correo seguro de amiga/madre. <b>2. Cuenta propia:</b> BancoEstado Cuenta RUT sin que sepa, guarda $ aunque sea poco. <b>3. Pensión alimentos:</b> Tribunal Familia Conce 41 274 4000 — puedes demandar sin abogado (CAJ gratuita 41 274 2400). <b>4. No firmes</b> créditos o ventas bajo presión. <b>5. CAD Mujer</b> orienta autonomía: SENCE, FOSIS.</p></div>
      <div class="help-card"><h4>👶 Vicaria (con hijos/as)</h4><p class="su-a6c665"><b>1. Protege a NNA:</b> no los uses de mensajeros. Escucha sin interrogar. <b>2. Registra:</b> fechas, frases, incumplimiento visitas, mensajes que usa a niños para control. <b>3. Medidas:</b> Tribunal Familia puede suspender visitas, ordenar terapia. Contacta Oficina Local Niñez Penco 41 226 1020 / 800 730 800. <b>4. No confrontes</b> delante de niños. <b>5. Si hay golpe a niño → 133/149 + SAR inmediato.</p></div>
      <div class="help-card"><h4>📱 Digital</h4><p class="su-a6c665"><b>1. Guarda evidencia:</b> captura con fecha, URL, perfil. Respalda en drive seguro. <b>2. Protege cuentas:</b> cambia claves en PC seguro, activa doble factor, revisa apps con acceso a ubicación, desinstala stalkerware (ajustes > apps). <b>3. No borres</b> todo aún si vas a denunciar. <b>4. Bloquear reportar</b> en red, pero antes guarda pruebas. <b>5. Ley 21.675:</b> difusión no consentida de imágenes íntimas es delito → PDI Brigada Cibercrimen 134.</p></div>
    </div>
    <div class="menstrual-card su-4adf8c"><h4>📂 Cómo guardar pruebas sin riesgo</h4><p class="muted su-a6c665">Correo nuevo que solo tú sepas (ej: Gmail con nombre distinto) → envíate fotos/audios con fecha. O Drive oculto. Borra de “Enviados” y papelera. No en WhatsApp del agresor. Anota en papel escondido: fecha, hora, qué pasó, testigos. Sirve para denuncia futura aunque hoy no quieras.</p></div>`;
  } else if(violenceTab==='plan'){
    html+= `<div class="menstrual-card su-ffd1a9"><h4 class="su-399074">🎒 Plan de seguridad — para salir cuando decidas, o si debes salir corriendo</h4><p class="muted su-11a508">No necesitas sufrir más para hacer el plan. Hazlo en momento calmo, sin que te vea. Revisa cada luna.</p></div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>✅ Bolso de emergencia (escondido)</h4><p class="su-a6c665">• Copias carnet, certificado nacimiento hijos, libreta familia, contrato arriendo<br>• Tarjeta/RUT, cuenta propia, $ en efectivo (aunque poco)<br>• Llaves casa + copia a confianza<br>• Ropa 2 cambios + para hijos, medicamentos, recetas<br>• Celular cargador, lista teléfonos escrita a mano<br>Déjalo en casa de madre/vecina confiable o bolso camuflado. No en auto del agresor.</p></div>
      <div class="help-card"><h4>🏠 Lugares seguros Penco</h4><p class="su-a6c665">• Casa de confianza a menos de 10 min a pie (acuerda código)<br>• SAR Penco 24h / Hospital Penco-Lirquén (puedes quedarte mientras llega Carabineros)<br>• 2ª Comisaría Penco (Freire) — puedes pedir <b>medida cautelar</b> ahí mismo<br>• Si debes dejar tu barrio, Centro de la Mujer deriva a casa de acogida SERNAMEG (reservada, gratuita). No publiques tu plan en redes.</p></div>
      <div class="help-card"><h4>📱 Código con red</h4><p class="su-a6c665">Con 1-2 personas de confianza acuerda:<br>• Palabra clave: “¿Tienes azúcar?” / “¿Cómo está la mami?” = ven/llama a Carabineros<br>• Señal con vecino: luz prendida, toalla en ventana<br>• Si te controla celular, usa WhatsApp 1455 (+56 9 9700 7000) que es silencioso<br>• Prueba el código 1 vez.</p></div>
      <div class="help-card"><h4>👶 Si sales con niños/as o mascota</h4><p class="su-a6c665">• Llévalos siempre contigo, mochila con útiles, juguete, leche/paño.<br>• Diles plan simple: “si escuchas gritos, ve a casa de la tía X”.<br>• Mascota: si amenaza con dañarla, Of. Medio Ambiente Penco 41 226 1017 / Vet Municipal puede orientar dónde dejarla breve.<br>• En escuela avisa: “solo yo retiro a mi hijo/a”.</p></div>
    </div>
    <div class="menstrual-card su-d2c171"><h4>🗒️ Checklist — ¿Qué ya tengo?</h4>
      <p class="muted su-11a508">Copia mental: ¿documentos? ¿copia llaves? ¿plata separada? ¿1 persona sabe código? ¿ruta a Comisaría sin depender de él/ella? Si te falta 1, es tu próximo paso esta semana — pide ayuda 1455 para armarlo.</p>
      <details class="menstrual-details su-8a77e5"><summary>🚪 Si decides volver tras salir</summary><p class="muted su-a6c665">Es común volver por esperanza/miedo. No te juzgues. Asegura: medidas cautelares vigentes, terapia para ambos (por separado), seguimiento Centro Mujer. Si vuelve violencia, no dudes en irte de nuevo — el plan sigue vigente.</p></details>
    </div>`;
  } else if(violenceTab==='redes'){
    html+= `<div class="menstrual-card su-ffd1a9"><h4 class="su-399074">🏛️ Redes, denuncia y derechos — Chile & Penco</h4><p class="muted su-a6c665"><b>VIF es delito</b> (Ley 20.066) y desde 2024 <b>Ley 21.675</b> amplia protección a pololeo, ex, violencia no solo física. Puedes denunciar como víctima o testigo, presencial o por teléfono. Medidas salen en horas.</p></div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>📋 Dónde y cómo denunciar</h4><p class="su-a6c665"><b>Opciones:</b><br>• <b>133 Carabineros / 149 Fono Familia</b> (comisaría más cercana)<br>• <b>PDI 134</b> (si prefieres no ir a comisaría)<br>• <b>Fiscalía Concepción</b> (causa penal)<br>• <b>Tribunal de Familia Concepción</b> (medidas protección, pensión, cuidado hijos) — 41 274 4000<br><b>Lleva:</b> carnet, relato escrito con fechas, pruebas (fotos, audios, capturas), constatación lesiones (SAR), testigos (nombre/tel). No necesitas abogado para denunciar. Puedes ir acompañada/o.</p></div>
      <div class="help-card"><h4>⚖️ Qué pasa después — medidas</h4><p class="su-a6c665"><b>Juez puede ordenar en 24h:</b> salida del agresor del hogar, prohibición acercarse (200-500m), no porte armas, entrega de hijos a ti, pensión provisoria, rondas Carabineros. Incumplir es delito. Si hay niños, Tribunal dicta protección. Causa penal (lesiones/amenazas) va a Fiscalía. Centro Mujer te acompaña gratis a audiencias.</p></div>
      <div class="help-card"><h4>🏥 Salud — hora segura y gratuita</h4><p class="su-a6c665"><b>CESFAM/SAR Penco:</b> 41 272 6350 / 41 272 6000 · Matrona, psicólogo/a, trabajador social — pide <b>hora por VIF</b> (reserva confidencial).<br><b>Hospital Penco-Lirquén:</b> 41 272 6300 urgencias.<br><b>SERNAMEG Centro Mujer Conce:</b> 41 246 7700 (terapia, jurídica, grupo apoyo, casa acogida).<br><b>Salud Responde 600 360 7777</b> orientación.</p></div>
      <div class="help-card"><h4>💜 Apoyo psicosocial gratuito</h4><p class="su-a6c665"><b>1455 SERNAMEG</b> (lun-dom 8:00-24:00) + WhatsApp +56 9 9700 7000 (mismo horario, chat silencioso). Fuera de horario: <b>149</b> o <b>133</b>.<br><b>149 Fono Familia Carabineros</b> (24h VIF).<br><b>800 104 008</b> Fono VIF (orientación).<br><b>Centro Hombre</b> que quiere cambiar (SERNAMEG) — derivación si agresor pide ayuda.<br><b>Fundación Honra, Miles, Corporación Humanas</b> — redes Bío-Bío.<br>En Penco: <b>Of. Mujer DIDECO 41 226 1020</b> + <b>Of. Niñez 41 226 1020</b> + <b>Programa SENDA Previene Penco</b>.</p></div>
    </div>
    <div class="menstrual-card su-0d015f"><h4>📄 Constatación de lesiones ≠ denuncia automática (pero ayuda mucho)</h4><p class="muted su-a6c665">Puedes pedir en SAR/Hospital “constatación por VIF” solo para dejar registro médico (fecha, lesiones, firma). Te dan copia. No obliga a denunciar, pero es prueba clave si denuncias después (plazo lesiones leves 6 meses). Pide que describan todo, incluso hematomas pequeños y estado emocional.</p></div>
    <details class="menstrual-details su-d2c171" open><summary>🗓️ Si no quieres denunciar ahora — igual puedes avanzar</summary><p class="muted su-a6c665">• Ve a 1455/Centro Mujer solo para conversar (confidencial).<br>• Actualiza plan de seguridad.<br>• Busca terapia en CESFAM.<br>• Documenta. <br><b>No hay plazo único para todo:</b> lesiones/coacción 6 meses, amenazas/abusos sexuales hasta años, pero entre más pronto, más pruebas. Si cambias de opinión, puedes denunciar cuando estés lista/o.</p></details>`;
  } else if(violenceTab==='ayudar'){
    html+= `<div class="menstrual-card su-ffd1a9"><h4 class="su-399074">🤝 Cómo ayudar a otra persona sin ponerla en riesgo</h4><p class="muted su-11a508">Tu rol: creer, escuchar, informar, acompañar — no rescatar a la fuerza. Respeta sus tiempos.</p></div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>✅ Qué decir</h4><p class="su-a6c665">• “Te creo, no es tu culpa, estoy aquí”.<br>• “¿Cómo te puedo apoyar? ¿Quieres que busquemos ayuda juntas?”<br>• “Mereces vivir sin miedo”.<br>• Ofrece info, no órdenes: “Existe 1455/149, si quieres llamamos juntos”.<br>• “Si decides irte, te ayudo con bolso/contacto”.</p></div>
      <div class="help-card"><h4>❌ Evita</h4><p class="su-a6c665">• “¿Por qué no te vas?” / “Aguanta por tus hijos”.<br>• Juzgar, culpar, minimizar: “seguro lo provocaste”.<br>• Dar ultimátum o contar sin permiso (puede aumentar riesgo).<br>• Confrontar al agresor tú sola/o.<br>• Prometer lo que no cumplirás.</p></div>
      <div class="help-card"><h4>👂 Escucha segura</h4><p class="su-a6c665">Privado, sin interrupciones, sin hijos del agresor cerca. Valida emociones, pregunta: “¿Te sientes segura en casa hoy?” No interrogues. Deja que ella/él decida ritmo. Ofrece acompañar a CESFAM/Comisaría/Centro Mujer si quiere, no obligar.</p></div>
      <div class="help-card"><h4>🆘 Como testigo / vecino en Penco</h4><p class="su-a6c665">Escuchas gritos/golpes: <b>no entres solo</b>. Llama <b>133 o 149</b>, da dirección exacta. Quédate disponible como testigo. Si ves agresión en calle, llama 133, no te expongas. Ofrece después: “Si necesitas algo, aquí estoy”. Registra fecha/hora por si te piden declaración.</p></div>
    </div>
    <div class="menstrual-card su-d2c171"><h4>🧘 Autocuidado de quien apoya</h4><p class="muted su-a6c665">Acompañar duele. Pon límites, no te expongas a violencia. Busca tu propia red, habla con profesional si te angustia. Si el agresor es tu familiar/amigo, puedes decir: “No justifico lo que haces, busca ayuda en 149/Centro Hombres” sin encubrir.</p></div>
    <details class="menstrual-details su-d2c171"><summary>🧒 Si la víctima es adolescente o persona mayor</summary><p class="muted su-a6c665"><b>Adolescente:</b> pololeo violento es VIF desde Ley 21.675. Habla sin sermonear, ofrece 1455/INJUV, avisa a adulto protector con su permiso. <b>Persona mayor:</b> puede depender económicamente → coordina con CESFAM, SENAMA Bío-Bío 800 400 035, Oficina Adulto Mayor Penco 41 226 1020.</p></details>`;
  }
  box.innerHTML = html;
}
function setupViolenceDialog(){
  const btn=$('btnViolence'); if(btn) btn.onclick=()=>{ renderViolencePanel('tipos'); $('violenceDialog').showModal(); };
  const ct=$('violenceCloseTop'), cb=$('violenceClose'); if(ct) ct.onclick=()=>$('violenceDialog').close(); if(cb) cb.onclick=()=>$('violenceDialog').close();
  ['tabVD1','tabVD2','tabVD3','tabVD4','tabVD5','tabVD6'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.onclick=()=>{ const map={tabVD1:'tipos',tabVD2:'senales',tabVD3:'quehacer',tabVD4:'plan',tabVD5:'redes',tabVD6:'ayudar'}; renderViolencePanel(map[id]); };
  });
  const q1=$('violenceQuickExit'), q2=$('violenceQuickExitTop');
  function quickExit(){ const d=$('violenceDialog'); if(d) d.close(); try{ window.open('https://www.google.cl','_blank'); }catch{} location.hash=''; if(history.replaceState) history.replaceState(null,'', location.pathname); }
  if(q1) q1.onclick=quickExit; if(q2) q2.onclick=quickExit;
}
setTimeout(setupViolenceDialog, 885);

// === EVACUACIÓN TSUNAMI — PENCO ===
let evacTab = 'rutas';
function getEvacCheck(){ try{ const u=userData(); if(!u.evacCheck) u.evacCheck={}; return u.evacCheck; }catch{ return {}; } }
function renderEvacPanel(tab){
  evacTab = tab || evacTab;
  const ids = {rutas:'tabEV1', mochila:'tabEV2', plan:'tabEV3', sismo:'tabEV4'};
  Object.entries(ids).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===evacTab); });
  const box = $('evacPanel'); if(!box) return;
  let html='';
  if(evacTab==='rutas'){
    html+= `<div class="menstrual-card su-f24d6f">
      <h4 class="su-0562fa">🗺️ Rutas orientativas — sube a pie al cerro</h4>
      <p class="muted su-11a508">Orientativo: confirma en carta SHOA y municipio. El principio es uno solo: <b>desde costanera, sube por la calle más corta al cerro, sin auto</b>.</p>
      <div class="help-grid su-8a77e5">
        <div class="help-card"><h4>🏖️ Penco centro / Costanera</h4><p class="su-a6c665">Costanera → <b>Freire / O'Higgins hacia arriba</b> (este, al cerro). Punto alto: sector <b>Plaza / Municipalidad y más arriba</b>. No uses auto: tacos bloquean. Si estás en playa, deja todo y sube.</p></div>
        <div class="help-card"><h4>⚓ Lirquén / Caleta</h4><p class="su-a6c665">Puerto y caleta → sube por <b>camino a Lirquén alto / cerros tras la línea férrea</b>. Pescadores: si el sismo es largo y estás en bote cerca, no vuelvas a puerto bajo — sigue instrucción Armada 137.</p></div>
        <div class="help-card"><h4>🌿 Rocuant / Humedal</h4><p class="su-a6c665">Zona plana e inundable. Sal <b>tierra adentro hacia Andalién / camino a Concepción en altura</b>. No cruces esteros crecidos. Con niños/mascotas, sal antes.</p></div>
        <div class="help-card"><h4>🏠 Si vives sobre 30 msnm</h4><p class="su-a6c665">Quédate en casa en lugar seguro (ver pestaña Sismo). Recibe a familiares de abajo en tu <b>punto de encuentro</b>. Ten lista de contactos y radio a pilas.</p></div>
      </div>
      <p class="muted su-d47a97">Señal natural = alerta: sismo que bota, ruido marino raro, mar que se recoge. Sirenas + mensaje SAE confirman. Practica la caminata 1 vez por luna.</p>
    </div>`;
  } else if(evacTab==='mochila'){
    const chk = getEvacCheck();
    const items = [
      ['agua','💧 Agua 2L p/persona + sales rehidratación'],
      ['comida','🍫 Comida 72h: barras, frutos secos, conservas'],
      ['docs','📄 Copias carnet, previsión, alergias, contactos 131/132/133/137'],
      ['botiquin','🩹 Botiquín + medicamentos crónicos 7 días'],
      ['abrigo','🧥 Manta térmica, impermeable, muda seca, zapatillas'],
      ['luz','🔦 Linterna + power bank + radio a pilas'],
      ['higiene','🧻 Higiene: mascarilla, toallas, bolsas, pañales si aplica'],
      ['mascota','🐾 Correa, comida mascota, bozal, bolsa fecas'],
      ['llaves','🔑 Copia llaves, algo de efectivo, silbato']
    ];
    html+= `<div class="menstrual-card su-68a1a9"><h4 class="su-e39eba">🎒 Mochila 72h — una por familia (marca avance)</h4>
      <p class="muted su-11a508">Toca para marcar. Se guarda local por usuario. Meta: 9/9 antes de Luna 4.</p>
      <div id="evacCheckList" class="habits-list su-8a77e5">` +
      items.map(([id,label])=>`<label class="check-row su-77f2ec"><input type="checkbox" data-evac="${id}" ${chk[id]?'checked':''}> <span class="su-6cb285">${label}</span></label>`).join('') +
      `</div><p class="muted su-11a508" id="evacCheckStats"></p></div>`;
  } else if(evacTab==='plan'){
    html+= `<div class="help-grid">
      <div class="help-card"><h4>📋 Ficha familiar (escríbela a mano)</h4><p class="su-a6c665">• Punto encuentro 1 (cerro): ______<br>• Punto encuentro 2 (fuera Penco): ______<br>• Contacto fuera de la zona (todo llaman a él): ______<br>• Quién busca a niños en escuela: ______<br>• Mascota quién la toma: ______<br>• Lugar medicamentos/llaves/mochila: ______</p></div>
      <div class="help-card"><h4>🏫 Escuela / trabajo</h4><p class="su-a6c665">Pregunta el <b>plan PISE</b> de la escuela: ¿dónde retiran? ¿quién autorizado? No llames en masa (colapsa red): usa <b>SMS / WhatsApp corto</b> + contacto único. Niños no se devuelven solos a casa en alerta.</p></div>
      <div class="help-card"><h4>♿ Movilidad reducida</h4><p class="su-a6c665">Vecino de apoyo asignado, silla cerca, lista medicamentos visible en refrigerador, pulsera con datos. Ensaya traslado a pie.</p></div>
      <div class="help-card"><h4>🔁 Simulacro 10 min</h4><p class="su-a6c665">1) Suena alarma (celular). 2) Cortan gas/luz/agua. 3) Toman mochila + mascota. 4) Caminan a punto alto cronometrando. 5) Anotan en Notas de la Luna qué falló. Repite en <b>Luna 1, 4, 7, 10</b>.</p></div>
    </div>`;
  } else if(evacTab==='sismo'){
    html+= `<div class="help-grid">
      <div class="help-card su-55637b"><h4>🏚️ Durante el sismo</h4><p class="su-a6c665"><b>Agáchate, cúbrete, afírmate</b> bajo mesa firme, lejos de ventanas/estantes. No uses ascensor ni escalera corriendo. Si cocinas, apaga fuego si alcanzas sin riesgo. En auto: detente lejos de postes, quédate dentro.</p></div>
      <div class="help-card"><h4>🌊 Después — decide evacuar</h4><p class="su-a6c665">Evacúa si: sismo largo, no te podías parar, alerta SAE/SHOA, mar extraño. <b>A pie, con mochila, sin volver por cosas.</b> Corta gas si huele. No entres a casas dañadas. Escucha radio, no rumores de WhatsApp.</p></div>
      <div class="help-card"><h4>📻 Vuelta a casa</h4><p class="su-a6c665">Solo cuando autoridad levanta alerta. Revisa grietas, gas, cables. Hierve agua si hubo corte. Foto daños para FIBE/municipio. Contiene a niños: rutina, juego, relato.</p></div>
      <div class="help-card"><h4>📞 Números Penco</h4><p class="su-a6c665">Armada/Capitanía Lirquén <b>137 / 41 275 1006</b> · Bomberos 132 · Carabineros 133 / 2ª Comisaría 41 214 3240 · SAMU 131 · Municipalidad 41 226 1000 · Hospital Penco-Lirquén 41 272 6300.</p></div>
    </div>`;
  }
  box.innerHTML = html;
  if(evacTab==='mochila'){
    const stats = $('evacCheckStats');
    const paint = ()=>{ const c=getEvacCheck(); const n=Object.values(c).filter(Boolean).length; if(stats) stats.textContent = `Avance: ${n}/9 ${n===9?'✓ lista':''}`; };
    paint();
    box.querySelectorAll('input[data-evac]').forEach(cb=>{
      cb.onchange=()=>{ const c=getEvacCheck(); c[cb.dataset.evac]=cb.checked; scheduleSave('Guardado ✓'); paint(); };
    });
  }
}
function setupEvacDialog(){
  const btn=$('btnEvac'); if(btn) btn.onclick=()=>{ renderEvacPanel('rutas'); $('evacDialog').showModal(); };
  const ct=$('evacCloseTop'), cb=$('evacClose'); if(ct) ct.onclick=()=>$('evacDialog').close(); if(cb) cb.onclick=()=>$('evacDialog').close();
  ['tabEV1','tabEV2','tabEV3','tabEV4'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.onclick=()=>{ const map={tabEV1:'rutas',tabEV2:'mochila',tabEV3:'plan',tabEV4:'sismo'}; renderEvacPanel(map[id]); };
  });
}
setTimeout(setupEvacDialog, 886);

// === KIMÜN MAPUZUGUN — BÁSICO · INTERMEDIO · AVANZADO ===
const MAPU_WORDS = [
  { m:'mari mari', e:'hola / saludo', x:'Mari mari, lamngen — hola, hermano/a', t:'saludo' },
  { m:'chaltu', e:'gracias', x:'Chaltu por tu ayuda', t:'saludo' },
  { m:'chaltu may', e:'muchas gracias', x:'Chaltu may por compartir tu kimün', t:'saludo' },
  { m:'peukayal', e:'nos vemos / hasta pronto', x:'Peukayal, wüle — nos vemos mañana', t:'saludo' },
  { m:'kimün', e:'conocimiento, saber', x:'Kimün mapuche — saber del territorio', t:'saber' },
  { m:'mapu', e:'tierra', x:'Mapu Penco — tierra de Penco', t:'tierra' },
  { m:'ko', e:'agua', x:'Ko lafken — agua de mar', t:'naturaleza' },
  { m:'lafken', e:'mar, lago grande', x:'Lafken de Penco — mar frente a la bahía', t:'naturaleza' },
  { m:'leufu', e:'río', x:'Leufu Biobío — río grande cercano', t:'naturaleza' },
  { m:'mawiza', e:'montaña / bosque nativo', x:'Mawiza de Nahuelbuta', t:'naturaleza' },
  { m:'menoko', e:'humedal, ojo de agua', x:'Menoko Rocuant — humedal de Penco', t:'naturaleza' },
  { m:'kürüf', e:'viento', x:'Kürüf wenu — viento del sur', t:'naturaleza' },
  { m:'mawün', e:'lluvia', x:'Mawün pukem — lluvia de invierno', t:'naturaleza' },
  { m:'antü', e:'sol, día', x:'Antü poud — salió el sol', t:'naturaleza' },
  { m:'küyen', e:'luna, mes', x:'Mari küla küyen — 13 lunas', t:'luna' },
  { m:'wenu', e:'cielo, arriba', x:'Wenu mapu — mundo de arriba', t:'cosmos' },
  { m:'lawen', e:'medicina, hierba', x:'Lawen matico — remedio de matico', t:'salud' },
  { m:'pewü', e:'primavera', x:'Pewü florece — tiempo de brotes', t:'estación' },
  { m:'pukem', e:'invierno', x:'Pukem llueve — tiempo de lluvias', t:'estación' },
  { m:'walüng', e:'verano', x:'Walüng cosecha — tiempo de abundancia', t:'estación' },
  { m:'rimü', e:'otoño', x:'Rimü guarda — tiempo de guardar', t:'estación' },
  { m:'che', e:'persona, gente', x:'Mapuche — gente de la tierra', t:'gente' },
  { m:'lafken che', e:'gente del mar (lafkenche)', x:'Lafkenche de Penco-Lirquén', t:'gente' },
  { m:'pichike che', e:'niño/a', x:'Pichike che juega — el niño juega', t:'gente' },
  { m:'ñuke', e:'madre', x:'Ñuke mapu — madre tierra', t:'familia' },
  { m:'chaw', e:'padre', x:'Chaw engu ñuke — padre y madre', t:'familia' },
  { m:'peñi', e:'hermano (entre hombres)', x:'Mari mari, peñi', t:'familia' },
  { m:'lamngen', e:'hermana / hermano (respetuoso)', x:'Mari mari, lamngen', t:'familia' },
  { m:'ruca', e:'casa', x:'Ruca lafkenche — casa junto al mar', t:'casa' },
  { m:'küme', e:'bueno / bien', x:'Küme mongen — buen vivir', t:'valor' },
  { m:'küme mongen', e:'buen vivir, vida en equilibrio', x:'Küme mongen en Penco', t:'valor' },
  { m:'newen', e:'fuerza, energía', x:'Newen lafken — fuerza del mar', t:'valor' },
  { m:'rakizuam', e:'pensamiento, reflexión', x:'Rakizuam kimün — pensar con saber', t:'saber' },
  { m:'dungu', e:'palabra, asunto, idioma', x:'Mapuzugun — idioma de la tierra', t:'saber' },
  { m:'pewma', e:'sueño (soñado)', x:'Pewma küme — buen sueño', t:'saber' },
  { m:'epew', e:'cuento, relato que enseña', x:'Epew del zorro y la luna', t:'saber' },
  { m:'ülkantun', e:'canto', x:'Ülkantun lafkenche', t:'arte' },
  { m:'küdaw', e:'trabajo', x:'Küdaw huerta — trabajo en la huerta', t:'vida' },
  { m:'iyael', e:'comida', x:'Iyael mapuche: kofke, muday', t:'vida' },
  { m:'kofke', e:'pan', x:'Kofke ruka — pan de casa', t:'vida' },
  { m:'challwa', e:'pez / pescado', x:'Challwa lafken — pescado del mar', t:'vida' },
  { m:'üñüm', e:'pájaro', x:'Üñüm wilki — el zorzal canta', t:'naturaleza' },
  { m:'ngürü', e:'zorro', x:'Ngürü epew — el zorro del cuento', t:'naturaleza' },
  { m:'kelü', e:'rojo', x:'Kelü copihue', t:'color' },
  { m:'karü', e:'verde', x:'Karü mawiza — verde montaña', t:'color' },
  { m:'kalfu', e:'azul', x:'Kalfu lafken — mar azul', t:'color' },
  { m:'lig', e:'blanco', x:'Lig küyen — luna blanca', t:'color' },
  { m:'kurü', e:'negro', x:'Kurü kürüf — noche oscura', t:'color' },
  { m:'chod', e:'amarillo', x:'Chod rayen — flor amarilla', t:'color' },
  { m:'rayen', e:'flor', x:'Rayen pewü — flor de primavera', t:'naturaleza' },
  { m:'ngillatun', e:'rogativa, ceremonia', x:'Ngillatun al amanecer en We Tripantu', t:'ceremonia' },
  { m:'we tripantu', e:'año nuevo mapuche', x:'We Tripantu 21 jun — nuevo ciclo', t:'ceremonia' },
  { m:'küla', e:'tres', x:'Küla küyen — tres lunas', t:'número' },
  { m:'meli', e:'cuatro', x:'Meli — cuatro', t:'número' },
  { m:'aylla', e:'nueve', x:'Aylla — nueve', t:'número' },
  { m:'mari', e:'diez', x:'Mari — diez', t:'número' }
];
const MAPU_NUMS = [['kiñe',1],['epu',2],['küla',3],['meli',4],['kechu',5],['kayu',6],['regle',7],['pura',8],['aylla',9],['mari',10],['mari kiñe',11],['mari epu',12],['mari küla',13],['mari meli',14],['mari kechu',15],['epu mari',20],['küla mari',30],['meli mari',40],['pataka',100]];
// --- NIVEL INTERMEDIO: verbos, frases y pronombres ---
const MAPU_VERBOS = [
  { m:'mongen', e:'vivir / vida', x:'Küme mongen — vivir bien' },
  { m:'kim-', e:'saber / conocer', x:'Kimn — yo sé · Kimnymi — tú sabes' },
  { m:'ayü-', e:'amar, querer', x:'Ayün — yo amo / quiero' },
  { m:'pi-', e:'decir', x:'Pin — yo digo' },
  { m:'amu-', e:'ir', x:'Amun Penco meu — voy a Penco' },
  { m:'küpa-', e:'venir', x:'Küpan — vengo / vine' },
  { m:'müle-', e:'estar / haber', x:'Mülen Penco — estoy en Penco' },
  { m:'küdaw-', e:'trabajar', x:'Küdawn huerta meu — trabajo en la huerta' },
  { m:'ngillatu-', e:'rogar / pedir en ceremonia', x:'Ngillatun wenu mapu meu' },
  { m:'pentuku-', e:'visitar / saludar formalmente', x:'Pentukun — vengo a saludar' },
  { m:'chalintuku-', e:'saludar, dar la mano', x:'Chalintukun, peñi' },
  { m:'pewma-', e:'soñar', x:'Pewman küme pewma — soñé un buen sueño' }
];
const MAPU_FRASES_M = [
  { m:'Mari mari, chumleymi?', e:'Hola, ¿cómo estás?', x:'Respuesta: Kümelekan, ¿eymi kay? — Estoy bien, ¿y tú?' },
  { m:'Iney pingeymi?', e:'¿Cómo te llamas?', x:'Iñche Ana pingen — Yo me llamo Ana' },
  { m:'Chew müleymi?', e:'¿Dónde vives / estás?', x:'Penco mew mülen — Vivo en Penco' },
  { m:'Chumlechi mongelemi?', e:'¿Cómo va tu vida / cómo has estado?', x:'Para conversar largo, con calma' },
  { m:'Kümelekan, chaltu may', e:'Estoy bien, muchas gracias', x:'Respuesta amable completa' },
  { m:'Peukayal, lamngen', e:'Nos vemos, hermano/a', x:'Despedida respetuosa' },
  { m:'Wüle pewaiñ', e:'Mañana nos vemos', x:'Compromiso: wüle = mañana' },
  { m:'Feymew, küme amulepe', e:'Entonces, que vayas bien', x:'Desear buen camino' },
  { m:'Chem am ta küdawkeeymi?', e:'¿En qué trabajas?', x:'Huerta meu küdawken — trabajo en huerta' },
  { m:'Ayün mapuzugun', e:'Quiero / amo el mapuzugun', x:'Expresa motivación por aprender' },
  { m:'Kimkelay mapuzugun, welu ayün kimam', e:'No sé mapuzugun, pero quiero aprender', x:'Frase honesta para pedir ayuda' },
  { m:'Eymi kimeltuchefe, chaltu may', e:'Tú eres mi maestro/a, gracias', x:'Reconocer a quien enseña' },
  { m:'Lafken mew amukeaiñ wüle', e:'Mañana iremos al mar', x:'Futuro con -a-: amukeaiñ = iremos' },
  { m:'Küme iyael, chaltu ñuke', e:'Rica comida, gracias mamá', x:'En la mesa, con respeto' }
];
const MAPU_PRONOMBRES = [['iñche','yo'],['eymi','tú'],['fey','él / ella'],['iñchiñ','nosotros/as dos'],['eymu','ustedes dos'],['feyengu','ellos/as dos'],['iñchiñ / iñcheñ','nosotros/as (varios)'],['eymün','ustedes (varios)'],['feyengün','ellos/as (varios)']];
// --- NIVEL AVANZADO: rakizuam, gramática y epew ---
const MAPU_FRASES_A = [
  { m:'Kimün mapu mew müley', e:'El saber está en la tierra', x:'Rakizuam: se aprende observando el territorio' },
  { m:'Lafken ñi newen, che ñi mongen', e:'La fuerza del mar es la vida de la gente', x:'Pensamiento lafkenche' },
  { m:'Ngillatun wenu mapu meu, chaltu pukem', e:'Rogativa al cielo por las lluvias', x:'Lengua ceremonial, se usa con guía' },
  { m:'Epew pin: ngürü ka küyen', e:'Cuento dice: el zorro y la luna', x:'Inicio clásico de epew' },
  { m:'Küme mongen, küme dungu, küme küdaw', e:'Buen vivir, buena palabra, buen trabajo', x:'Tres pilares del ad mapu' },
  { m:'Kimlayaymiñ tüfachi dungu?', e:'¿No sabemos esta palabra?', x:'Negación + pregunta avanzada' },
  { m:'Wüle amuaimi waria meu?', e:'¿Irás mañana al pueblo/ciudad?', x:'Futuro -a- + pregunta -mi' },
  { m:'Tüfachi lawen küme mongen mew', e:'Esta medicina es para el buen vivir', x:'Uso de demostrativo tüfachi = este/a' }
];
let mapuTab = 'palabra';
let mapuQuizQ = null;
let mapuQuizLevel = 'todo';
function getMapuData(){ try{ const u=userData(); if(!u.mapu) u.mapu={ok:0,total:0,streak:0,lastDay:''}; return u.mapu; }catch{ return {ok:0,total:0,streak:0,lastDay:''}; } }
function mapuDayIndex(){ const n=new Date(); const s=n.getFullYear()*1000+(Math.floor((n-new Date(n.getFullYear(),0,0))/864e5)); return s % MAPU_WORDS.length; }
// AUDIO MAPUZUGUN: desactivado temporalmente (se subirán grabaciones nativas).
// Para reactivar con audios propios: pon MAPU_AUDIO_ENABLED=true y define mapuPlayNative(id)
// para reproducir tus archivos (ej: audio/mapu/mari_mari.mp3). speechSynthesis queda apagado.
const MAPU_AUDIO_ENABLED = false;
function mapuSpeak(txt){ return; /* 🔊 desactivado — grabación nativa en curso */ }
function mapuPlayNative(id){ return; /* hook futuro: reproducir audio/mapu/<id>.mp3 */ }
function mapuQuizPool(){
  if(mapuQuizLevel==='basico') return MAPU_WORDS;
  if(mapuQuizLevel==='intermedio') return MAPU_FRASES_M.concat(MAPU_VERBOS);
  if(mapuQuizLevel==='avanzado') return MAPU_FRASES_A;
  return MAPU_WORDS.concat(MAPU_FRASES_M).concat(MAPU_FRASES_A);
}
function renderMapuStreak(){
  const b=$('mapuStreakBox'); if(!b) return;
  const d=getMapuData();
  const pct = d.total? Math.round(d.ok/d.total*100):0;
  b.innerHTML = `<b>🌱 Tu kimün:</b> ${d.ok}/${d.total} buenas (${pct}%) · racha ${d.streak} 🔥 <span class="muted su-11a508">— Básico: 1 palabra/día · Intermedio: 1 frase/día · Avanzado: rakizuam. Todo se guarda local.</span>`;
}
function renderMapuPanel(tab){
  mapuTab = tab || mapuTab;
  const ids={palabra:'tabMP1',numeros:'tabMP2',intermedio:'tabMP3',avanzado:'tabMP4',lunas:'tabMP5',quiz:'tabMP6'};
  Object.entries(ids).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===mapuTab); });
  renderMapuStreak();
  const box=$('mapuPanel'); if(!box) return;
  let html='';
  if(mapuTab==='palabra'){
    const w = MAPU_WORDS[mapuDayIndex()];
    const rel = [MAPU_WORDS[(mapuDayIndex()+5)%MAPU_WORDS.length], MAPU_WORDS[(mapuDayIndex()+9)%MAPU_WORDS.length]];
    html+= `<div class="menstrual-card su-3fa1a8">
      <p class="muted su-11a508">☀️ PALABRA DE HOY · NIVEL BÁSICO · ${cal.fmtDate.format(new Date())} · ${MAPU_WORDS.length} palabras en total</p>
      <div class="su-457da9">${escapeHtml(w.m)}</div>
      <div class="su-cd8bd8"><b>${escapeHtml(w.e)}</b> <span class="chip su-0d5be0">${escapeHtml(w.t||'')}</span></div>
      <p class="muted su-2b0979">“${escapeHtml(w.x)}”</p>
      <div class="su-9bc2df">
        <button type="button" id="mapuSpeakBtn" class="btn su-30e741" disabled title="Audio nativo en grabación">🔇 Audio próximamente</button>
        <button type="button" id="mapuNextBtn" class="btn su-30e741">🎲 Otra palabra</button>
      </div></div>
      <div class="help-grid su-d2c171">`+
      rel.map(r=>`<div class="help-card"><h4>${escapeHtml(r.m)}</h4><p class="su-11a508">${escapeHtml(r.e)}<br><span class="muted">“${escapeHtml(r.x)}”</span></p></div>`).join('')+`</div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>🗣️ ¿Cómo pronunciar?</h4><p class="su-b439ab"><b>ü</b> → suena entre i y u (küla ≈ kula cerrada)<br><b>ng</b> → nasal como en <i>ngillatun</i><br><b>tr</b> → suave, no enrollada<br><b>Habla lento y con respeto</b>, mejor que perfecto. Repite 3 veces en voz alta.</p></div>
        <div class="help-card"><h4>📚 ¿Cómo avanzar?</h4><p class="su-b439ab">1) Aprende 1 palabra/día de esta pestaña.<br>2) Pasa a <b>💬 Intermedio</b> cuando reconozcas 30 sin mirar.<br>3) Pasa a <b>📜 Avanzado</b> cuando armes frases solas.<br>El quiz te dice tu nivel real.</p></div>
      </div>
      <p class="muted su-d47a97">Grafemarios: <b>Azümchefe</b> (el usado aquí) · <b>Unificado</b> · <b>Raguileo</b>. Ej: <i>kimün = kimvn / kimün</i> según grafemario. Puede variar por zona — lo importante es usar con respeto y preguntar.</p>`;
  } else if(mapuTab==='numeros'){
    html+= `<div class="menstrual-card su-018729"><h4 class="su-721a46">🔢 Números 1–100 — las 13 lunas se cuentan así</h4>
      <div class="su-2cb0d6">`+
      MAPU_NUMS.map(([m,n])=>`<button type="button" class="btn mapu-word su-6cb285" data-w="${escapeHtml(m)}"><b>${n}</b> · ${escapeHtml(m)}</button>`).join('')+`</div>
      <p class="muted su-e6fe60">Lógica: <b>mari küla = 10+3 = 13</b> → <b>mari küla küyen</b>. <b>epu mari = 2×10 = 20</b>, <b>küla mari = 30</b>, <b>pataka = 100</b>. Toca para escuchar.</p></div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>👋 Saludos lafkenche</h4><p class="su-b439ab"><b>Mari mari</b> — hola (una o varias personas)<br><b>Mari mari, lamngen</b> — hola hermano/a (respetuoso)<br><b>Chaltu may</b> — muchas gracias<br><b>Küme mañum</b> — gracias con reconocimiento<br><b>Peukayal / wüle pewaiñ</b> — nos vemos / mañana nos vemos<br><b>Pentukun</b> — vengo a saludar formalmente.</p></div>
        <div class="help-card"><h4>🗣️ Pronunciación rápida</h4><p class="su-b439ab"><b>ü</b> como u casi cerrada (küla ≈ kula)<br><b>ng</b> nasal (ngillatun)<br><b>tr</b> suave, no como español fuerte<br><b>Habla lento</b>, mejor que perfecto. En Penco, territorio lafkenche, se saluda mirando a los ojos.</p></div>
      </div>`;
  } else if(mapuTab==='intermedio'){
    html+= `<div class="menstrual-card su-56c5cb"><h4 class="su-42f1fd">💬 Nivel Intermedio — conversa de verdad</h4>
      <p class="muted su-a6c665">Ya sabes palabras sueltas. Ahora: <b>pronombres + verbos + 14 frases</b> para presentarte, ir a la feria y a la playa. (🔇 Audio nativo en grabación.)</p></div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>👥 Pronombres (quién)</h4><p class="su-583677">`+
        MAPU_PRONOMBRES.map(([m,e])=>`<b>${escapeHtml(m)}</b> = ${escapeHtml(e)}`).join('<br>')+`</p><p class="muted su-0d5be0">Dual (dos personas) y plural (varios) existen — el mapuzugun es preciso con cuántos somos.</p></div>
        <div class="help-card"><h4>🏃 12 verbos base (raíz + -n = yo)</h4><p class="su-583677">`+
        MAPU_VERBOS.map(v=>`<button type="button" class="btn mapu-word su-136500" data-w="${escapeHtml(v.m)}"><b>${escapeHtml(v.m)}</b> — ${escapeHtml(v.e)}<br><span class="muted">“${escapeHtml(v.x)}”</span></button>`).join('')+`</p></div>
      </div>
      <div class="menstrual-card su-b6037f"><h4 class="su-42f1fd">💬 14 frases para Penco</h4>
      <div class="su-5e3875">`+
      MAPU_FRASES_M.map(f=>`<button type="button" class="btn mapu-word su-6cd6a1" data-w="${escapeHtml(f.m)}"><b>${escapeHtml(f.m)}</b><br><span class="su-2f290d">${escapeHtml(f.e)}</span><br><span class="muted su-11a508">“${escapeHtml(f.x)}”</span></button>`).join('')+`</div></div>
      <div class="menstrual-card su-4adf8c"><h4>🎭 Mini-diálogo: en la feria de Penco</h4><p class="su-583677">— <b>Mari mari, lamngen, chumleymi?</b> (Hola, ¿cómo estás?)<br>— <b>Kümelekan, chaltu may. ¿Eymi kay?</b> (Bien, gracias. ¿Y tú?)<br>— <b>Kümelekan. Chem am ta küdawkeeymi?</b> (Bien. ¿En qué trabajas?)<br>— <b>Huerta meu küdawken. Wüle lafken mew amukeaiñ.</b> (Trabajo en huerta. Mañana iremos al mar.)<br>— <b>Feymew, peukayal!</b> (¡Entonces, nos vemos!)<br><span class="muted">Practícalo con alguien: uno hace cada fila.</span></p></div>`;
  } else if(mapuTab==='avanzado'){
    html+= `<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 Nivel Avanzado — rakizuam y gramática viva</h4>
      <p class="muted su-a6c665">Ya conversas. Ahora piensa en mapuzugun: <b>conjugación, negación, futuro, ad mapu y epew</b>. Este nivel no se memoriza: se mastica, se conversa con kimeltuchefe.</p></div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>⚙️ Conjugación presente (verbo kim- = saber)</h4><p class="su-583677"><b>kimn</b> = yo sé<br><b>kimnimi / kimnymi</b> = tú sabes<br><b>kimy</b> = él/ella sabe<br><b>kimiñ</b> = nosotros sabemos<br><b>kimymün</b> = ustedes saben<br><b>kimyngün</b> = ellos saben<br><span class="muted">Raíz + terminación. Prueba con amu-, müle-, ayü-.</span></p></div>
        <div class="help-card"><h4>🔮 Futuro + negación + pregunta</h4><p class="su-583677"><b>Futuro -a-:</b> amu- → <b>amuan</b> = iré · <b>amukeaiñ</b> = iremos<br><b>Negación la / no-:</b> <b>kimlan</b> = no sé · <b>kimkelay</b> = no sabe/no conoce<br><b>Pregunta -mi / -kam:</b> <b>chumleymi?</b> = ¿cómo estás? · <b>amuaimi?</b> = ¿irás?<br><b>Posesivo ñi:</b> <b>lafken ñi newen</b> = la fuerza del mar.</p></div>
      </div>
      <div class="menstrual-card su-45bfae"><h4 class="su-399074">🧠 8 frases rakizuam</h4>
      <div class="su-5e3875">`+
      MAPU_FRASES_A.map(f=>`<button type="button" class="btn mapu-word su-6cd6a1" data-w="${escapeHtml(f.m)}"><b>${escapeHtml(f.m)}</b><br><span class="su-2f290d">${escapeHtml(f.e)}</span><br><span class="muted su-11a508">“${escapeHtml(f.x)}”</span></button>`).join('')+`</div></div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>📖 Epew corto: Ngürü ka Küyen</h4><p class="su-583677">Epew pin: ngürü amuy lafken meu.<br><span class="muted">Cuenta el cuento: el zorro fue al mar.</span><br>Küyen wallme mew, ko küme azküy.<br><span class="muted">En la luna llena, el agua se ve hermosa.</span><br>Ngürü rakizuamy: “kimün mapu mew müley”.<br><span class="muted">El zorro pensó: “el saber está en la tierra”.</span><br><b>Moraleja lafkenche:</b> mirar antes de tomar.</p></div>
        <div class="help-card su-68a1a9"><h4>🤝 Ad mapu — cómo usar sin dañar</h4><p class="su-b439ab">1) <b>Pide permiso:</b> “Kimkelay, ayün kimam” antes de usar lengua ceremonial.<br>2) <b>Ngillatun y canelo</b> no son adorno: solo con guía y comunidad.<br>3) <b>No mezcles</b> sagrado con broma o comercio.<br>4) <b>Devuelve:</b> enseña a un pichike lo que aprendas.<br>5) En Penco, reconoce: estás en <b>territorio lafkenche</b>.</p></div>
      </div>
      <div class="menstrual-card su-4adf8c"><h4>🔤 Grafemarios (por qué ves 3 escrituras)</h4><p class="muted su-b439ab">El mapuzugun fue oral por siglos. Hoy hay 3 formas de escribirlo: <b>Azümchefe</b> (ü, ng — usado aquí, escolar), <b>Unificado</b> (ü, ng, tr — académico) y <b>Raguileo</b> (v, q, x — propio mapuche, sin letras españolas). Ej: <i>tierra = mapu (los tres)</i> · <i>saber = kimün / kimvn / kimvn</i>. Si ves otra escritura, no está mal: es otro grafemario.</p></div>`;
  } else if(mapuTab==='lunas'){
    try{
      html+= `<div class="menstrual-card su-4181c1"><h4 class="su-559282">🌙 Las 13 lunas en kimün</h4>
      <div class="su-5e3875">`+
      MOONS.map(m=>`<button type="button" class="btn mapu-word su-6cd6a1" data-w="${escapeHtml(m.nombre)}"><b>Luna ${m.n}</b> · ${escapeHtml(m.nombre)}<br><span class="muted su-11a508">${escapeHtml(m.traduccion)}</span></button>`).join('')+`</div></div>`;
    }catch{ html+='<p class="muted">No se pudo cargar lunas.</p>'; }
  } else if(mapuTab==='quiz'){
    const d=getMapuData();
    if(!mapuQuizQ){
      const pool=mapuQuizPool();
      const w = pool[Math.floor(Math.random()*pool.length)];
      const opts = new Set([w.e]);
      let guard=0;
      while(opts.size<4 && guard<50){ guard++; opts.add(pool[Math.floor(Math.random()*pool.length)].e); }
      mapuQuizQ = { w, opts:[...opts].sort(()=>Math.random()-0.5) };
    }
    const q=mapuQuizQ;
    const lvBtn=(v,l)=>`<button type="button" class="btn mapu-lv${mapuQuizLevel===v?' btn-accent':''} su-337714" data-lv="${v}">${l}</button>`;
    html+= `<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por niveles</h4>
      <div class="su-a8712a">${lvBtn('todo','🌎 Todo')}${lvBtn('basico','☀️ Básico')}${lvBtn('intermedio','💬 Intermedio')}${lvBtn('avanzado','📜 Avanzado')}</div>
      <div class="su-73ce29">“${escapeHtml(q.w.m)}”</div>
      <div class="su-ae0e71">`+
      q.opts.map(o=>`<button type="button" class="btn mapu-opt su-046678" data-o="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('')+`</div>
      <div id="mapuQuizFb" class="su-ac1122"></div>
      <p class="muted su-e13d76">Aciertos ${d.ok}/${d.total} · racha ${d.streak} · nivel quiz: <b>${escapeHtml(mapuQuizLevel)}</b> · pool: ${mapuQuizPool().length} palabras/frases</p></div>`;
  }
  box.innerHTML = html + `<p class="muted su-a953a7">🔇 Audio desactivado temporalmente — estamos grabando audio nativo. El quiz y el vocabulario funcionan sin sonido.</p>`;
  const sp=$('mapuSpeakBtn'); if(sp) sp.onclick=(e)=>{ try{ e.preventDefault(); }catch{} };
  const nx=$('mapuNextBtn'); if(nx) nx.onclick=()=>{ renderMapuPanel('palabra'); };
  /* audio desactivado: las tarjetas .mapu-word ya no hablan al tocar */
  box.querySelectorAll('.mapu-lv').forEach(b=> b.onclick=()=>{ mapuQuizLevel=b.dataset.lv; mapuQuizQ=null; renderMapuPanel('quiz'); });
  box.querySelectorAll('.mapu-opt').forEach(b=> b.onclick=()=>{
    const d2=getMapuData(); const ok = b.dataset.o===mapuQuizQ.w.e;
    d2.total=(d2.total||0)+1; if(ok){ d2.ok=(d2.ok||0)+1; d2.streak=(d2.streak||0)+1; } else { d2.streak=0; }
    scheduleSave('Guardado ✓');
    const fb=$('mapuQuizFb');
    if(fb) fb.innerHTML = ok? '✅ ¡Muy bien! <b>'+escapeHtml(mapuQuizQ.w.x)+'</b>' : '❌ Era <b>'+escapeHtml(mapuQuizQ.w.e)+'</b> — “'+escapeHtml(mapuQuizQ.w.x)+'”';
    box.querySelectorAll('.mapu-opt').forEach(x=>{ x.disabled=true; if(x.dataset.o===mapuQuizQ.w.e){ x.classList.add('btn-accent'); } });
    renderMapuStreak();
    setTimeout(()=>{ mapuQuizQ=null; if(mapuTab==='quiz') renderMapuPanel('quiz'); }, ok?1400:2200);
  });
}
function setupMapuDialog(){
  const btn=$('btnMapu'); if(btn) btn.onclick=()=>{ renderMapuPanel('palabra'); $('mapuDialog').showModal(); };
  const ct=$('mapuCloseTop'), cb=$('mapuClose'); if(ct) ct.onclick=()=>$('mapuDialog').close(); if(cb) cb.onclick=()=>$('mapuDialog').close();
  ['tabMP1','tabMP2','tabMP3','tabMP4','tabMP5','tabMP6'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.onclick=()=>{ const map={tabMP1:'palabra',tabMP2:'numeros',tabMP3:'intermedio',tabMP4:'avanzado',tabMP5:'lunas',tabMP6:'quiz'}; if(map[id]!=='quiz') mapuQuizQ=null; renderMapuPanel(map[id]); };
  });
}
setTimeout(setupMapuDialog, 887);

// === ENGLISH · INGLÉS POR NIVELES (A1 → C1) — espejo de Kimün Mapuzugun ===
const ENG_A1 = [
  { en:'hello / hi', es:'hola', ex:'Hello, how are you? — Hola, ¿cómo estás?' },
  { en:'thank you / thanks', es:'gracias', ex:'Thank you very much. — Muchas gracias.' },
  { en:'please', es:'por favor', ex:'A coffee, please. — Un café, por favor.' },
  { en:'good morning', es:'buenos días', ex:'Good morning, class. — Buenos días, clase.' },
  { en:'good night', es:'buenas noches (despedida)', ex:'Good night, see you tomorrow. — Buenas noches, nos vemos mañana.' },
  { en:'my name is...', es:'me llamo...', ex:'My name is Ana. — Me llamo Ana.' },
  { en:'where are you from?', es:'¿de dónde eres?', ex:'I am from Penco, Chile. — Soy de Penco, Chile.' },
  { en:'water', es:'agua', ex:'I need water. — Necesito agua.' },
  { en:'food / bread', es:'comida / pan', ex:'Bread and fish, please. — Pan y pescado, por favor.' },
  { en:'house / home', es:'casa / hogar', ex:'My house is near the sea. — Mi casa está cerca del mar.' },
  { en:'day / today', es:'día / hoy', ex:'Today is a good day. — Hoy es un buen día.' },
  { en:'to be: I am / you are', es:'ser/estar: yo soy-estoy / tú eres-estás', ex:'I am tired. You are kind. — Estoy cansado. Eres amable.' },
  { en:'to have: I have', es:'tener: yo tengo', ex:'I have two sisters. — Tengo dos hermanas.' },
  { en:'numbers 1–20', es:'números 1–20', ex:'One, two, three… twenty. — Uno, dos, tres… veinte.' },
  { en:'colors: red, blue, green', es:'colores: rojo, azul, verde', ex:'The sea is blue. — El mar es azul.' },
  { en:'family: mother, father', es:'familia: madre, padre', ex:'My mother cooks well. — Mi mamá cocina bien.' },
  { en:'I like...', es:'me gusta...', ex:'I like the sea. — Me gusta el mar.' },
  { en:'I need...', es:'necesito...', ex:'I need help, please. — Necesito ayuda, por favor.' },
  { en:'see you tomorrow', es:'nos vemos mañana', ex:'Bye! See you tomorrow. — ¡Chao! Nos vemos mañana.' },
  { en:'sorry / excuse me', es:'perdón / disculpe', ex:'Sorry, I am late. — Perdón, llegué tarde.' }
];
const ENG_A2 = [
  { en:'What did you do yesterday?', es:'¿Qué hiciste ayer?', ex:'I worked in the garden. — Trabajé en la huerta.' },
  { en:'I am going to...', es:'voy a... (futuro)', ex:'I am going to cook. — Voy a cocinar.' },
  { en:'bigger than / the biggest', es:'más grande que / el más grande', ex:'The sea is bigger than the river. — El mar es más grande que el río.' },
  { en:'How much / How many', es:'¿Cuánto / Cuántos?', ex:'How much is it? — ¿Cuánto cuesta?' },
  { en:'I have to work', es:'tengo que trabajar', ex:'I have to go now. — Me tengo que ir ahora.' },
  { en:'Can you help me?', es:'¿Puedes ayudarme?', ex:'Can you speak slowly? — ¿Puedes hablar lento?' },
  { en:'There is / There are', es:'Hay (singular / plural)', ex:'There is a market. There are fruits. — Hay un mercado. Hay frutas.' },
  { en:'weather: It is sunny / rainy', es:'clima: está soleado / lluvioso', ex:'It is windy in Penco. — Está ventoso en Penco.' },
  { en:'past: went, ate, saw', es:'pasado: fui, comí, vi', ex:'We went to the beach. — Fuimos a la playa.' },
  { en:'shopping: How much is it?', es:'compras: ¿cuánto cuesta?', ex:'It is five thousand pesos. — Cuesta cinco mil pesos.' },
  { en:'directions: turn left / right', es:'direcciones: gira izquierda / derecha', ex:'Turn left at the plaza. — Gira a la izquierda en la plaza.' },
  { en:'feelings: happy, tired, sick', es:'sentimientos: feliz, cansado, enfermo', ex:'I feel tired today. — Me siento cansado hoy.' },
  { en:'to cook / to clean / to wash', es:'cocinar / limpiar / lavar', ex:'I cook every day. — Cocino todos los días.' },
  { en:'appointment: at 3 pm', es:'cita: a las 3 pm', ex:'See you at five. — Nos vemos a las cinco.' }
];
const ENG_B1 = [
  { en:'I have lived here for 5 years', es:'he vivido aquí por 5 años (present perfect)', ex:'I have never seen snow. — Nunca he visto nieve.' },
  { en:'If it rains, we will stay home', es:'si llueve, nos quedaremos (condicional 1)', ex:'If you study, you will learn. — Si estudias, aprenderás.' },
  { en:'look for / look after / give up', es:'buscar / cuidar / rendirse (phrasal verbs)', ex:'Don’t give up! — ¡No te rindas!' },
  { en:'travel: I would like a ticket', es:'viajes: quisiera un pasaje', ex:'A ticket to Concepción, please. — Un pasaje a Concepción, por favor.' },
  { en:'work: I am in charge of...', es:'trabajo: estoy a cargo de...', ex:'I am in charge of the garden. — Estoy a cargo de la huerta.' },
  { en:'opinion: I think / In my opinion', es:'opinión: creo / en mi opinión', ex:'I think it is a good idea. — Creo que es buena idea.' },
  { en:'used to + verb', es:'solía + verbo', ex:'I used to play guitar. — Solía tocar guitarra.' },
  { en:'so / because / although', es:'así que / porque / aunque', ex:'It was cold, so we stayed home. — Hacía frío, así que nos quedamos.' },
  { en:'health: I have a headache', es:'salud: me duele la cabeza', ex:'I need an appointment. — Necesito una hora médica.' },
  { en:'email: Best regards,', es:'correo: saludos cordiales', ex:'Best regards, Ana. — Saludos cordiales, Ana.' }
];
const ENG_B2C1 = [
  { en:'break the ice', es:'romper el hielo', ex:'A joke breaks the ice. — Un chiste rompe el hielo.' },
  { en:'once in a blue moon', es:'muy rara vez', ex:'We eat out once in a blue moon. — Salimos a comer muy rara vez.' },
  { en:'It had already left when I arrived', es:'ya se había ido cuando llegué (past perfect)', ex:'Pluscuamperfecto para contar historias.' },
  { en:'If I had studied, I would have passed', es:'si hubiera estudiado, habría pasado (condicional 3)', ex:'Arrepentimientos y lecciones.' },
  { en:'The beach was cleaned by volunteers', es:'la playa fue limpiada (voz pasiva)', ex:'Passive: be + participio.' },
  { en:'She said she was tired', es:'dijo que estaba cansada (reported speech)', ex:'Directo → indirecto: am → was.' },
  { en:'take something for granted', es:'dar algo por sentado', ex:'Don’t take water for granted. — No des el agua por sentada.' },
  { en:'job interview: strengths', es:'entrevista: fortalezas', ex:'My strength is teamwork. — Mi fortaleza es el trabajo en equipo.' },
  { en:'essay linkers: however, moreover', es:'ensayo: sin embargo, además', ex:'However, the sea is life. — Sin embargo, el mar es vida.' },
  { en:'bite the bullet', es:'apretar los dientes / afrontar', ex:'I bit the bullet and spoke English. — Afronté y hablé inglés.' }
];
let engTab = 'word';
let engQuizQ = null;
let engQuizLevel = 'todo';
function getEnglishData(){ try{ const u=userData(); if(!u.english) u.english={ok:0,total:0,streak:0,lastDay:''}; return u.english; }catch{ return {ok:0,total:0,streak:0,lastDay:''}; } }
function engDayIndex(){ const all=ENG_A1.concat(ENG_A2,ENG_B1,ENG_B2C1); const n=new Date(); const s=n.getFullYear()*1000+(Math.floor((n-new Date(n.getFullYear(),0,0))/864e5)); return s % all.length; }
function engSpeak(txt){
  try{
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(txt);
    u.lang='en-US'; u.rate=0.9; u.pitch=1;
    speechSynthesis.speak(u);
  }catch{}
}
function engQuizPool(){
  if(engQuizLevel==='a1') return ENG_A1;
  if(engQuizLevel==='a2') return ENG_A2;
  if(engQuizLevel==='b1') return ENG_B1;
  if(engQuizLevel==='b2c1') return ENG_B2C1;
  return ENG_A1.concat(ENG_A2,ENG_B1,ENG_B2C1);
}
function renderEnglishStreak(){
  const b=$('englishStreakBox'); if(!b) return;
  const d=getEnglishData();
  const pct = d.total? Math.round(d.ok/d.total*100):0;
  b.innerHTML = `<b>🌱 Your English:</b> ${d.ok}/${d.total} correct (${pct}%) · streak ${d.streak} 🔥 <span class="muted su-11a508">— Word a day · A1→C1 · todo se guarda local.</span>`;
}
function engCard(item, lv){
  return `<button type="button" class="btn eng-word su-6cd6a1" data-w="${escapeHtml(item.en)}"><b>🔊 ${escapeHtml(item.en)}</b> <span class="chip su-0d5be0">${lv}</span><br><span class="su-2f290d">${escapeHtml(item.es)}</span><br><span class="muted su-11a508">“${escapeHtml(item.ex)}”</span></button>`;
}
function renderEnglishPanel(tab){
  engTab = tab || engTab;
  const ids={word:'tabEN1',a1:'tabEN2',a2:'tabEN3',b1:'tabEN4',avanzado:'tabEN5',quiz:'tabEN6'};
  Object.entries(ids).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===engTab); });
  renderEnglishStreak();
  const box=$('englishPanel'); if(!box) return;
  let html='';
  if(engTab==='word'){
    const all=ENG_A1.concat(ENG_A2,ENG_B1,ENG_B2C1);
    const w = all[engDayIndex()];
    const rel = [all[(engDayIndex()+7)%all.length], all[(engDayIndex()+13)%all.length]];
    html+= `<div class="menstrual-card su-3fa1a8">
      <p class="muted su-11a508">☀️ WORD OF THE DAY · ${cal.fmtDate.format(new Date())} · ${all.length} words & phrases</p>
      <div class="su-6adb68">${escapeHtml(w.en)}</div>
      <div class="su-cd8bd8"><b>${escapeHtml(w.es)}</b></div>
      <p class="muted su-2b0979">“${escapeHtml(w.ex)}”</p>
      <div class="su-9bc2df">
        <button type="button" id="engSpeakBtn" class="btn btn-accent su-30e741">🔊 Listen</button>
        <button type="button" id="engNextBtn" class="btn su-30e741">🎲 Another word</button>
      </div></div>
      <div class="help-grid su-d2c171">`+
      rel.map(r=>`<div class="help-card"><h4>${escapeHtml(r.en)}</h4><p class="su-11a508">${escapeHtml(r.es)}<br><span class="muted">“${escapeHtml(r.ex)}”</span></p></div>`).join('')+`</div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>🗣️ How to practice?</h4><p class="su-b439ab">1) <b>Listen</b> with 🔊 and repeat 3 times aloud.<br>2) <b>Write</b> 1 sentence with the word in Notas del día.<br>3) <b>Use it</b> today: 1 word/day → ~365/year.<br>Pass to A1 when you know 20 without looking.</p></div>
        <div class="help-card"><h4>📚 Levels (CEFR)</h4><p class="su-b439ab">🌱 <b>A1:</b> survive (hello, food, home).<br>🌿 <b>A2:</b> daily life (past, future, shopping).<br>💬 <b>B1:</b> travel + work + opinions.<br>📜 <b>B2–C1:</b> idioms, passive, interviews, essays.</p></div>
      </div>`;
  } else if(engTab==='a1'){
    html+= `<div class="menstrual-card su-5a6934"><h4 class="su-752b1a">🌱 A1 Principiante — survive in English</h4>
      <p class="muted su-a6c665">Meta: presentarte, pedir comida, contar 1–100. Gramática: <b>to be (I am / you are), a/an/the, I like / I need, plural -s</b>. Toca 🔊 en cada tarjeta para escuchar.</p>
      <div class="su-5e3875">`+
      ENG_A1.map(f=>engCard(f,'A1')).join('')+`</div></div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>⚙️ To be (ser/estar)</h4><p class="su-583677"><b>I am</b> tired · <b>You are</b> kind<br><b>He/She is</b> here · <b>We are</b> friends<br><b>They are</b> from Penco<br><span class="muted">Negación: I am <b>not</b>… Pregunta: <b>Are</b> you…?</span></p></div>
        <div class="help-card"><h4>🎭 Mini-dialog: market</h4><p class="su-583677">— <b>Hello! How much is it?</b><br>— <b>Five thousand pesos.</b><br>— <b>Thank you. See you tomorrow!</b><br><span class="muted">Practice: one person per line.</span></p></div>
      </div>`;
  } else if(engTab==='a2'){
    html+= `<div class="menstrual-card su-018729"><h4 class="su-721a46">🌿 A2 Básico — daily life</h4>
      <p class="muted su-a6c665">Meta: contar qué hiciste, planes, compras y direcciones. Gramática: <b>past simple (went/ate), going to future, comparatives, there is/are, can</b>.</p>
      <div class="su-5e3875">`+
      ENG_A2.map(f=>engCard(f,'A2')).join('')+`</div></div>
      <div class="menstrual-card su-4adf8c"><h4>🎭 Mini-dialog: directions in Penco</h4><p class="su-583677">— <b>Excuse me, where is the beach?</b><br>— <b>Go straight, then turn left at the plaza.</b><br>— <b>Thank you very much!</b> — <b>You’re welcome!</b><br><span class="muted">Key: straight = derecho, turn = girar, near = cerca.</span></p></div>`;
  } else if(engTab==='b1'){
    html+= `<div class="menstrual-card su-d4d722"><h4 class="su-7c91e2">💬 B1 Intermedio — travel, work & opinions</h4>
      <p class="muted su-a6c665">Meta: viajar, trabajar y opinar. Gramática: <b>present perfect (have lived), conditional 1 (if… will), used to, phrasal verbs (look for, give up)</b>.</p>
      <div class="su-5e3875">`+
      ENG_B1.map(f=>engCard(f,'B1')).join('')+`</div></div>
      <div class="menstrual-card su-4adf8c"><h4>🎭 Mini-dialog: travel</h4><p class="su-583677">— <b>I would like a ticket to Concepción.</b><br>— <b>Single or return?</b> — <b>Return, please.</b><br>— <b>Have you been here before?</b> — <b>Yes, I have lived here for 5 years.</b><br><span class="muted">Practice with times, prices and “I have…”.</span></p></div>`;
  } else if(engTab==='avanzado'){
    html+= `<div class="menstrual-card su-5b7cd0"><h4 class="su-399074">📜 B2–C1 Avanzado — idioms & real grammar</h4>
      <p class="muted su-a6c665">Meta: entrevistas, ensayos e idioms. Gramática: <b>past perfect, conditional 3, passive voice, reported speech, linkers (however, moreover)</b>.</p>
      <div class="su-5e3875">`+
      ENG_B2C1.map(f=>engCard(f,'B2–C1')).join('')+`</div></div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>⚙️ Passive + Reported</h4><p class="su-583677"><b>Passive:</b> The beach <b>was cleaned</b>.<br><b>Reported:</b> “I am tired” → She said she <b>was</b> tired.<br><b>Cond. 3:</b> If I <b>had studied</b>, I <b>would have passed</b>.</p></div>
        <div class="help-card"><h4>💼 Interview kit</h4><p class="su-583677">— <b>Tell me about yourself.</b><br>— <b>I am responsible and I work well in a team.</b><br>— <b>My strength is… My goal is…</b><br><span class="muted">Close: “Thank you for your time.”</span></p></div>
      </div>`;
  } else if(engTab==='quiz'){
    const d=getEnglishData();
    if(!engQuizQ){
      const pool=engQuizPool();
      const w = pool[Math.floor(Math.random()*pool.length)];
      const opts = new Set([w.es]);
      let guard=0;
      while(opts.size<4 && guard<60){ guard++; opts.add(pool[Math.floor(Math.random()*pool.length)].es); }
      engQuizQ = { w, opts:[...opts].sort(()=>Math.random()-0.5) };
    }
    const q=engQuizQ;
    const lvBtn=(v,l)=>`<button type="button" class="btn eng-lv${engQuizLevel===v?' btn-accent':''} su-337714" data-lv="${v}">${l}</button>`;
    html+= `<div class="menstrual-card su-1f2df9"><h4 class="su-399074">🧩 Quiz por niveles</h4>
      <div class="su-a8712a">${lvBtn('todo','🌎 Todo')}${lvBtn('a1','🌱 A1')}${lvBtn('a2','🌿 A2')}${lvBtn('b1','💬 B1')}${lvBtn('b2c1','📜 B2–C1')}</div>
      <div class="su-73ce29">“${escapeHtml(q.w.en)}”</div>
      <button type="button" id="engQuizSpeak" class="btn su-337714">🔊 Listen</button>
      <div class="su-ae0e71">`+
      q.opts.map(o=>`<button type="button" class="btn eng-opt su-046678" data-o="${escapeHtml(o)}">${escapeHtml(o)}</button>`).join('')+`</div>
      <div id="engQuizFb" class="su-ac1122"></div>
      <p class="muted su-e13d76">Correct ${d.ok}/${d.total} · streak ${d.streak} · level: <b>${escapeHtml(engQuizLevel)}</b> · pool: ${engQuizPool().length} words/phrases</p></div>`;
  }
  box.innerHTML = html + `<p class="muted su-a953a7">🔊 Toca cualquier tarjeta para escuchar en inglés (en-US, voz del dispositivo). El quiz suma a tu racha local y privada.</p>`;
  const sp=$('engSpeakBtn'); if(sp) sp.onclick=(e)=>{ try{ e.preventDefault(); }catch{} engSpeak(all_eng_word_current()); };
  const nx=$('engNextBtn'); if(nx) nx.onclick=()=>{ engQuizQ=null; renderEnglishPanel('word'); };
  const qs=$('engQuizSpeak'); if(qs) qs.onclick=(e)=>{ try{ e.preventDefault(); }catch{} if(engQuizQ) engSpeak(engQuizQ.w.en); };
  box.querySelectorAll('.eng-word').forEach(b=> b.onclick=(e)=>{ try{ e.preventDefault(); }catch{} engSpeak(b.dataset.w); });
  box.querySelectorAll('.eng-lv').forEach(b=> b.onclick=()=>{ engQuizLevel=b.dataset.lv; engQuizQ=null; renderEnglishPanel('quiz'); });
  box.querySelectorAll('.eng-opt').forEach(b=> b.onclick=()=>{
    const d2=getEnglishData(); const ok = b.dataset.o===engQuizQ.w.es;
    d2.total=(d2.total||0)+1; if(ok){ d2.ok=(d2.ok||0)+1; d2.streak=(d2.streak||0)+1; } else { d2.streak=0; }
    scheduleSave('Guardado ✓');
    const fb=$('engQuizFb');
    if(fb) fb.innerHTML = ok? '✅ Great! <b>'+escapeHtml(engQuizQ.w.ex)+'</b>' : '❌ It was <b>'+escapeHtml(engQuizQ.w.es)+'</b> — “'+escapeHtml(engQuizQ.w.ex)+'”';
    box.querySelectorAll('.eng-opt').forEach(x=>{ x.disabled=true; if(x.dataset.o===engQuizQ.w.es){ x.classList.add('btn-accent'); } });
    renderEnglishStreak();
    setTimeout(()=>{ engQuizQ=null; if(engTab==='quiz') renderEnglishPanel('quiz'); }, ok?1400:2200);
  });
}
function all_eng_word_current(){
  try{
    const all=ENG_A1.concat(ENG_A2,ENG_B1,ENG_B2C1);
    return all[engDayIndex()].en;
  }catch{ return 'Hello'; }
}
function setupEnglishDialog(){
  const btn=$('btnEnglish'); if(btn) btn.onclick=()=>{ renderEnglishPanel('word'); $('englishDialog').showModal(); };
  const ct=$('englishCloseTop'), cb=$('englishClose'); if(ct) ct.onclick=()=>$('englishDialog').close(); if(cb) cb.onclick=()=>$('englishDialog').close();
  ['tabEN1','tabEN2','tabEN3','tabEN4','tabEN5','tabEN6'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.onclick=()=>{ const map={tabEN1:'word',tabEN2:'a1',tabEN3:'a2',tabEN4:'b1',tabEN5:'avanzado',tabEN6:'quiz'}; if(map[id]!=='quiz') engQuizQ=null; renderEnglishPanel(map[id]); };
  });
}
setTimeout(setupEnglishDialog, 888);

// === GUITARRA — Principiante / Intermedio / Avanzado (offline, local por usuario) ===
function getGuitarData(){
  const u = userData();
  if(!u.guitar) u.guitar = { level:'principiante', log:[], tuneRef:440 };
  if(!Array.isArray(u.guitar.log)) u.guitar.log = [];
  if(!u.guitar.level) u.guitar.level = 'principiante';
  if(u.guitar.tuneRef !== 432 && u.guitar.tuneRef !== 440) u.guitar.tuneRef = 440;
  return u.guitar;
}
let guitarEditingId = null;
let guitarAudioCtx = null, guitarTuneNodes = null, guitarTuneTimer = null, guitarSeqTimers = [];
let metroTimer = null, metroOn = false, metroBeat = 0;
function guitarStats(){
  const log = getGuitarData().log;
  const totalMin = log.reduce((a,b)=> a + (+b.min||0), 0);
  const days = [...new Set(log.map(x=>x.date))].sort();
  let streak = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  let cursor = new Date(today);
  const daySet = new Set(days);
  const fmt = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(!daySet.has(fmt(cursor))){ cursor.setDate(cursor.getDate()-1); }
  while(daySet.has(fmt(cursor))){ streak++; cursor.setDate(cursor.getDate()-1); }
  return { total: log.length, totalMin, streak, days: days.length };
}
function renderGuitarStreak(){
  const chip = $('guitarStreakChip'); if(!chip) return;
  const s = guitarStats();
  chip.textContent = `🔥 ${s.streak} día${s.streak===1?'':'s'} · ${s.totalMin} min total · ${s.total} prácticas`;
}
function renderGuitarLog(){
  const box = $('pracList'); if(!box) return;
  const data = getGuitarData().log;
  const stats = $('pracStats');
  if(!data.length){ box.innerHTML = '<p class="muted">Sin prácticas. Registra tus primeros 15 min arriba 👆</p>'; if(stats) stats.textContent = '0 prácticas'; renderGuitarStreak(); return; }
  const sorted = [...data].sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  const INST_ICON = { guitarra:'🎸', ukelele:'🎸', flauta:'🪈', teclado:'🎹', cajon:'🥁', canto:'🎤' };
  const INST_NAME = { guitarra:'Guitarra', ukelele:'Ukelele', flauta:'Flauta/Quena', teclado:'Teclado', cajon:'Cajón', canto:'Canto' };
  box.innerHTML = sorted.slice(0,60).map(it=>{
    const lv = it.level==='avanzado'?'🌳':it.level==='intermedio'?'🌿':'🌱';
    const ii = INST_ICON[it.inst||'guitarra']||'🎸';
    const nn = INST_NAME[it.inst||'guitarra']||'Guitarra';
    return `<div class="habit-row"><span class="su-97445a">📅 <b>${escapeHtml(it.date||'')}</b> · ${ii} ${nn} · ${lv} ${escapeHtml(it.level||'')} · <b>${escapeHtml(String(it.min||0))} min</b><br><span class="muted su-11a508">${escapeHtml(it.detail||'')}</span></span><span class="su-74cac9"><button type="button" class="btn btn-icon prac-edit su-2760a5" data-id="${it.id}" title="Editar">✏️</button><button type="button" class="btn btn-icon prac-del su-2760a5" data-id="${it.id}" title="Borrar">✕</button></span></div>`;
  }).join('');
  const s = guitarStats();
  if(stats) stats.textContent = `${s.total} prácticas · ${s.days} días distintos · ${s.totalMin} min · racha ${s.streak} 🔥`;
  box.querySelectorAll('.prac-del').forEach(b=> b.onclick=()=>{
    const d = getGuitarData(); d.log = d.log.filter(x=>String(x.id)!==String(b.dataset.id));
    scheduleSave(); renderGuitarLog();
  });
  box.querySelectorAll('.prac-edit').forEach(b=> b.onclick=()=>{
    const d = getGuitarData(); const it = d.log.find(x=>String(x.id)===String(b.dataset.id)); if(!it) return;
    guitarEditingId = it.id;
    $('pracDate').value = it.date||''; $('pracMinutes').value = it.min||15; $('pracLevel').value = it.level||'principiante'; $('pracDetail').value = it.detail||'';
    const pi = $('pracInst'); if(pi) pi.value = it.inst||'guitarra';
    $('pracAdd').textContent = '↻ Actualizar'; $('pracCancelEdit').classList.remove('hidden');
  });
  renderGuitarStreak();
}
function guitarPluckBuffer(freq, secs){
  // Síntesis de cuerda pulsada (Karplus-Strong) con retardo fraccionario:
  // el filtro promedio del algoritmo retrasa el loop ~0.5 muestra, y sin
  // compensar la 1ra cuerda quedaba ~10 cents baja ("desafinada").
  // Con delay = sr/freq - 0.5 el pitch queda exacto (<1 cent) en las 6.
  const sr = guitarAudioCtx.sampleRate;
  const len = Math.max(1024, Math.floor(sr * secs));
  const buf = guitarAudioCtx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const delay = sr / freq - 0.5;
  const N = Math.max(2, Math.floor(delay));
  const frac = Math.min(0.999, Math.max(0, delay - N));
  const c0 = 0.5 * (1 - frac), c2 = 0.5 * frac;
  for(let i=0;i<=N+1 && i<len;i++) d[i] = Math.random()*2-1;
  const decay = freq < 120 ? 0.9975 : freq < 200 ? 0.9968 : 0.996;
  for(let i=N+2;i<len;i++){
    d[i] = decay * (c0*d[i-N] + 0.5*d[i-N-1] + c2*d[i-N-2]);
  }
  let peak = 0;
  for(let i=0;i<len;i++){ const v = Math.abs(d[i]); if(v>peak) peak = v; }
  const norm = peak > 0 ? 0.9/peak : 1;
  const fade = Math.min(len, Math.floor(sr*0.05));
  for(let i=0;i<len;i++){ d[i] *= norm; if(i > len-fade) d[i] *= (len-i)/fade; }
  return buf;
}
function playGuitarTone(freq, secs){
  try{
    stopGuitarTone(true);
    if(!guitarAudioCtx) guitarAudioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(guitarAudioCtx.state==='suspended') guitarAudioCtx.resume();
    secs = secs || 4;
    const src = guitarAudioCtx.createBufferSource();
    src.buffer = guitarPluckBuffer(freq, secs);
    const lp = guitarAudioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000;
    const g = guitarAudioCtx.createGain(); g.gain.value = 0.9;
    src.connect(lp); lp.connect(g); g.connect(guitarAudioCtx.destination);
    src.start();
    guitarTuneNodes = { o: src, g };
    clearTimeout(guitarTuneTimer);
    guitarTuneTimer = setTimeout(()=> stopGuitarTone(true), secs*1000+150);
  }catch(e){ alert('Audio no disponible en este dispositivo'); }
}
function guitarRefRatio(){
  return (getGuitarData().tuneRef === 432 ? 432 : 440) / 440;
}
function guitarRefLabel(){
  return getGuitarData().tuneRef === 432 ? 'A432' : 'A440';
}
function renderGuitarTuneLabels(){
  // data-f guarda la frecuencia base en A440; el label muestra la real según referencia
  const r = guitarRefRatio();
  document.querySelectorAll('.guitar-tune').forEach(b=>{
    const base = parseFloat(b.dataset.f) || 0;
    const s = b.dataset.s || '';
    b.textContent = `${s} · ${Math.round(base*r)}Hz`;
  });
  const sel = $('guitarTuneRef'); if(sel) sel.value = getGuitarData().tuneRef === 432 ? '432' : '440';
}
function playGuitarAllSix(){
  // Secuencia 6ta→1ra como al afinar una acústica de verdad, 1.4s entre cuerdas
  const r = guitarRefRatio(), ref = guitarRefLabel();
  const seq = [82.41*r, 110*r, 146.83*r, 196*r, 246.94*r, 329.63*r];
  const names = ['6ta Mi grave','5ta La','4ta Re','3ra Sol','2da Si','1ra Mi agudo'];
  stopGuitarTone(true);
  const st = $('guitarTuneStatus');
  seq.forEach((f, i)=>{
    guitarSeqTimers.push(setTimeout(()=>{
      playGuitarTone(f, 2.2);
      if(st) st.textContent = `🔊 ${i+1}/6 · ${names[i]} (${f.toFixed(1)} Hz · ${ref}) — afina tu ${names[i].split(' ')[0]} cuerda y espera la siguiente…`;
    }, i*1400));
  });
  guitarSeqTimers.push(setTimeout(()=>{ if(st) st.textContent = 'Toca una cuerda para escucharla 4 segundos (sonido de acústica).'; }, seq.length*1400));
}
function stopGuitarTone(silent){
  try{ if(guitarTuneNodes){ try{ guitarTuneNodes.o.stop(); }catch{} try{ guitarTuneNodes.g.disconnect(); }catch{} guitarTuneNodes = null; } clearTimeout(guitarTuneTimer); }catch{}
  try{ guitarSeqTimers.forEach(clearTimeout); guitarSeqTimers = []; }catch{}
  if(!silent){ const st=$('guitarTuneStatus'); if(st) st.textContent='Toca una cuerda para escucharla 4 segundos (sonido de acústica).'; }
}
function metroClick(accent){
  try{
    if(!guitarAudioCtx) guitarAudioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(guitarAudioCtx.state==='suspended') guitarAudioCtx.resume();
    const o = guitarAudioCtx.createOscillator(), g = guitarAudioCtx.createGain();
    o.type = 'square'; o.frequency.value = accent?1600:1000;
    g.gain.setValueAtTime(0.25, guitarAudioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, guitarAudioCtx.currentTime+0.07);
    o.connect(g); g.connect(guitarAudioCtx.destination); o.start(); o.stop(guitarAudioCtx.currentTime+0.08);
  }catch{}
}
function metroStopFn(){
  metroOn = false; clearInterval(metroTimer); metroTimer = null;
  const b = $('metroStart'); if(b) b.textContent = '▶ Iniciar';
  const beat = $('metroBeat'); if(beat) beat.textContent = '♪';
}
function setupGuitarDialog(){
  const btn = $('btnGuitar'); if(btn) btn.onclick=()=>{
    const g = getGuitarData();
    const sel = $('guitarLevelSel'); if(sel) sel.value = g.level||'principiante';
    renderGuitarTuneLabels();
    const pd = $('pracDate'); if(pd && !pd.value){ try{ pd.value = cal.fmtKey.format(new Date()); }catch{ pd.valueAsDate = new Date(); } }
    const pl = $('pracLevel'); if(pl) pl.value = g.level||'principiante';
    renderGuitarStreak(); renderGuitarLog();
    showGuitarTab(g.level==='intermedio'?'i':g.level==='avanzado'?'a':'b');
    $('guitarDialog').showModal();
  };
  const ct=$('guitarCloseTop'), cb=$('guitarClose'); if(ct) ct.onclick=()=>{ metroStopFn(); stopGuitarTone(true); $('guitarDialog').close(); }; if(cb) cb.onclick=()=>{ metroStopFn(); stopGuitarTone(true); $('guitarDialog').close(); };
  function showGuitarTab(t){
    const tabs={ b:['tabGuiB','guitarBegPanel'], i:['tabGuiI','guitarIntPanel'], a:['tabGuiA','guitarAdvPanel'], u:['tabGuiU','guitarUkePanel'], f:['tabGuiF','guitarFlautaPanel'], t:['tabGuiT','guitarTeclaPanel'], c:['tabGuiC','guitarCajonPanel'], v:['tabGuiV','guitarCantoPanel'], p:['tabGuiP','guitarPracPanel'] };
    Object.values(tabs).forEach(([bid,pid])=>{ const b=$(bid), p=$(pid); if(b) b.classList.remove('btn-accent'); if(p) p.classList.add('hidden'); });
    const cur=tabs[t]; if(cur){ const b=$(cur[0]), p=$(cur[1]); if(b) b.classList.add('btn-accent'); if(p) p.classList.remove('hidden'); }
    // Sincroniza selector cuando se navega a un nivel de Guitarra (evita doble fuente confusa)
    const lvlSel=$('guitarLevelSel');
    if(lvlSel){
      if(t==='b') lvlSel.value='principiante';
      else if(t==='i') lvlSel.value='intermedio';
      else if(t==='a') lvlSel.value='avanzado';
    }
    try{ window._guiTab=t; }catch{}
  }
  window.showGuitarTab = showGuitarTab;
  const tB=$('tabGuiB'), tI=$('tabGuiI'), tA=$('tabGuiA'), tP=$('tabGuiP');
  const tU=$('tabGuiU'), tF=$('tabGuiF'), tT=$('tabGuiT'), tC=$('tabGuiC'), tV=$('tabGuiV');
  function setGuitarLevel(lv, fromTab){
    const g=getGuitarData(); g.level=lv;
    const lvl=$('guitarLevelSel'); if(lvl) lvl.value=lv;
    const pl=$('pracLevel'); if(pl && (fromTab || window._guiTab==='b' || window._guiTab==='i' || window._guiTab==='a' || !window._guiTab)) pl.value=lv;
    scheduleSave();
  }
  if(tB) tB.onclick=()=>{ setGuitarLevel('principiante', true); showGuitarTab('b'); }; if(tI) tI.onclick=()=>{ setGuitarLevel('intermedio', true); showGuitarTab('i'); };
  if(tA) tA.onclick=()=>{ setGuitarLevel('avanzado', true); showGuitarTab('a'); }; if(tP) tP.onclick=()=>showGuitarTab('p');
  if(tU) tU.onclick=()=>showGuitarTab('u'); if(tF) tF.onclick=()=>showGuitarTab('f');
  if(tT) tT.onclick=()=>showGuitarTab('t'); if(tC) tC.onclick=()=>showGuitarTab('c');
  if(tV) tV.onclick=()=>showGuitarTab('v');
  const lvl=$('guitarLevelSel'); if(lvl) lvl.onchange=()=>{ const v=lvl.value||'principiante'; setGuitarLevel(v, false); const cur=window._guiTab||'b'; if(cur==='b'||cur==='i'||cur==='a'||!cur) showGuitarTab(v==='principiante'?'b':v==='intermedio'?'i':'a'); };
  // Afinador
  document.querySelectorAll('.guitar-tune').forEach(b=> b.onclick=()=>{
    const base=parseFloat(b.dataset.f), n=b.dataset.n||'';
    const f = base * guitarRefRatio(), ref = guitarRefLabel();
    playGuitarTone(f, 4);
    const st=$('guitarTuneStatus'); if(st) st.textContent=`🔊 Sonando ${n} (${f.toFixed(1)} Hz · ${ref}, cuerda pulsada) — afina hasta que no se oigan "olas" entre tu cuerda y esta.`;
  });
  const tStop=$('guitarTuneStop'); if(tStop) tStop.onclick=()=>stopGuitarTone();
  const tAll=$('guitarTuneAll'); if(tAll) tAll.onclick=()=>playGuitarAllSix();
  const tRef=$('guitarTuneRef'); if(tRef) tRef.onchange=()=>{ const g=getGuitarData(); g.tuneRef=parseInt(tRef.value,10)===432?432:440; scheduleSave(); stopGuitarTone(true); renderGuitarTuneLabels(); };
  // Metrónomo
  const bpm=$('metroBpm'), bpmVal=$('metroBpmVal');
  function updBpm(){ if(bpmVal&&bpm) bpmVal.textContent=bpm.value+' bpm'; }
  if(bpm) bpm.oninput=()=>{ updBpm(); if(metroOn){ metroStopFn(); $('metroStart').click(); } };
  updBpm();
  const mStart=$('metroStart'); if(mStart) mStart.onclick=()=>{
    if(metroOn){ metroStopFn(); return; }
    const v=parseInt((bpm&&bpm.value)||80,10)||80;
    metroOn=true; metroBeat=0; mStart.textContent='⏸ Pausar';
    const beat=$('metroBeat');
    const tick=()=>{ metroBeat++; const accent=(metroBeat%4===1); try{ metroClick(accent); }catch{} if(beat) beat.textContent=accent?'🔴 1 · 2 · 3 · 4':'🟡 '+(metroBeat%4||4)+' / 4'; };
    tick(); metroTimer=setInterval(tick, 60000/v);
  };
  const mStop=$('metroStop'); if(mStop) mStop.onclick=metroStopFn;
  // Bitácora
  const add=$('pracAdd'); if(add) add.onclick=()=>{
    const date=$('pracDate').value||(()=>{ try{ return cal.fmtKey.format(new Date()); }catch{ return new Date().toISOString().slice(0,10); } })();
    const min=Math.max(1, Math.min(480, parseInt($('pracMinutes').value)||15));
    const level=$('pracLevel').value||'principiante';
    const inst=(($('pracInst')&&$('pracInst').value)||'guitarra');
    const detail=$('pracDetail').value.trim();
    if(!detail) return alert('Cuéntanos qué practicaste (ej: cambios C-G 70bpm)');
    const d=getGuitarData();
    if(guitarEditingId){
      const idx=d.log.findIndex(x=>String(x.id)===String(guitarEditingId));
      if(idx>=0) d.log[idx]={...d.log[idx], date, min, level, inst, detail};
      guitarEditingId=null; add.textContent='+ Guardar práctica'; $('pracCancelEdit').classList.add('hidden');
    } else d.log.push({ id: Date.now()+''+Math.floor(Math.random()*999), date, min, level, inst, detail });
    scheduleSave(); $('pracDetail').value='';
    renderGuitarLog();
  };
  const cancel=$('pracCancelEdit'); if(cancel) cancel.onclick=()=>{ guitarEditingId=null; $('pracAdd').textContent='+ Guardar práctica'; cancel.classList.add('hidden'); $('pracDetail').value=''; };
  const clear=$('pracClear'); if(clear) clear.onclick=()=>{ if(!confirm('¿Borrar toda la bitácora de instrumentos?')) return; getGuitarData().log=[]; scheduleSave(); renderGuitarLog(); };
  const share=$('pracShare'); if(share) share.onclick=async()=>{
    const d=getGuitarData().log; if(!d.length) return alert('Sin prácticas para compartir');
    const s=guitarStats();
    const INST_NAME2 = { guitarra:'Guitarra', ukelele:'Ukelele', flauta:'Flauta/Quena', teclado:'Teclado', cajon:'Cajón', canto:'Canto' };
    const lines=[...d].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,20).map(x=>`· ${x.date} — ${INST_NAME2[x.inst||'guitarra']||x.inst||'Guitarra'} ${x.level} ${x.min}min: ${x.detail}`);
    await shareText('🎶 Mi práctica de instrumentos', `🎶 Instrumentos — ${s.total} prácticas · ${s.totalMin} min · racha ${s.streak} días 🔥\nNivel guitarra: ${getGuitarData().level}\n\n`+lines.join('\n'));
  };
  showGuitarTab('b');
}
setTimeout(setupGuitarDialog, 892);

// === LAWEN — HERBARIO BÍO-BÍO (20 fichas) ===
const LAWEN_PLANTS = [
  { n:'Matico', i:'🌿', uso:'Heridas, úlceras leves, higiene bucal', prep:'Infusión 1 cdta hojas secas / taza, 5 min. Enfriar para lavado de herida limpia.', luna:'Llena', rec:'Pewü-Walüng, mañana seca', cui:'No en embarazo. No reemplaza sutura/antibiótico si hay infección.', k:'matico herida ulcera cicatrizante lavado' },
  { n:'Boldo', i:'🍃', uso:'Digestión pesada, hígado', prep:'1-2 hojas / taza, 5 min. Máx 1 taza/día, no más de 7 días.', luna:'Menguante', rec:'Todo el año, hojas maduras', cui:'No en embarazo, lactancia ni obstrucción biliar. Tóxico en exceso.', k:'boldo digestion higado graso' },
  { n:'Manzanilla', i:'🌼', uso:'Digestión, cólico leve, calma', prep:'1 cda flores / taza, 5 min tapada.', luna:'Llena', rec:'Pewü, flores abiertas', cui:'Alergia a asteráceas. No en embarazo en exceso.', k:'manzanilla digestion colico calma sueño' },
  { n:'Menta / Hierbabuena', i:'🌱', uso:'Digestión, gases, descongestión', prep:'1 cdta hojas / taza. Vahos con toalla 5 min.', luna:'Creciente', rec:'Pewü-Walüng', cui:'No en reflujo severo ni bebés (mentol).', k:'menta gases estomago resfrio vaho' },
  { n:'Orégano', i:'🌿', uso:'Resfrío, tos, digestión', prep:'1 cdta / taza. Miel si hay tos (mayores 1 año).', luna:'Llena', rec:'Walüng floración', cui:'No en embarazo en dosis medicinal.', k:'oregano tos resfrio' },
  { n:'Romero', i:'🌲', uso:'Memoria, circulación, cocina tónica', prep:'1 cdta / taza. Baño de pies para cansancio.', luna:'Creciente', rec:'Todo el año', cui:'No en embarazo/hipertensión descompensada en exceso.', k:'romero memoria circulacion pelo' },
  { n:'Eucalipto', i:'🍂', uso:'Descongestión (vahos, no infusión fuerte)', prep:'Vahos: puñado hojas / olla agua caliente, 5 min. No beber aceite esencial.', luna:'Menguante', rec:'Rimü, hojas adultas', cui:'No ingerir aceite. No en niños pequeños ni asma sin guía.', k:'eucalipto tos moco vaho resfrio' },
  { n:'Laurel de cocina', i:'🍃', uso:'Condimento digestivo', prep:'1 hoja en cocción, retirar. No comer la hoja.', luna:'Cualquiera', rec:'Todo el año', cui:'Solo Laurus nobilis. No confundir con laurel de flor (tóxico).', k:'laurel comida digestion' },
  { n:'Melisa / Toronjil', i:'🌿', uso:'Ansiedad leve, insomnio, digestión nerviosa', prep:'1 cda / taza noche. 3-4 noches seguidas.', luna:'Llena', rec:'Pewü-Walüng', cui:'Somnolencia: no manejar. Interactúa con sedantes/tiroides.', k:'melisa toronjil ansiedad sueño calma' },
  { n:'Ortiga', i:'🌾', uso:'Fertilizante (purín) + remineralizante suave', prep:'Comida: hojas cocidas como espinaca. Purín ver 🌱 Siembra → 🧪.', luna:'Creciente', rec:'Pewü tierna con guantes', cui:'Pica en fresco. No en embarazo ni riñón sin guía.', k:'ortiga purin hierro abono' },
  { n:'Maqui', i:'🫐', uso:'Antioxidante, garganta, energía', prep:'Fruto fresco/seco, jugo o masticar. Infusión suave de hoja.', luna:'Llena', rec:'Walüng cosecha frutos', cui:'Bien tolerado. Lava frutos. Diabéticos: moderar jugo.', k:'maqui antioxidante garganta energia' },
  { n:'Canelo', i:'🌳', uso:'Sagrado mapuche, uso ceremonial y resfrío suave', prep:'Infusión muy suave de hoja, uso ocasional. Corteza solo con guía.', luna:'Menguante', rec:'No podar nativo sin permiso', cui:'Árbol sagrado: no extraer corteza. No automedicar en embarazo.', k:'canelo sagrado ceremonia resfrio' },
  { n:'Bailahuén', i:'🌼', uso:'Digestión, hígado, montaña', prep:'1 cdta / taza, 5 min. Cursos cortos.', luna:'Menguante', rec:'Precordillera verano', cui:'No en embarazo. Solo de cultivo o compra (no depredar).', k:'bailahuen digestion higado' },
  { n:'Poleo', i:'🌱', uso:'Digestivo, resfrío leve', prep:'1 cdta / taza. No concentrado.', luna:'Llena', rec:'Borde estero Pewü', cui:'No en embarazo (riesgo). No aceite esencial interno.', k:'poleo digestion guata' },
  { n:'Paico', i:'🌿', uso:'Parásitos leves, empacho (uso tradicional)', prep:'Dosis baja tradicional, curso corto. Comida bien cocida + higiene.', luna:'Menguante', rec:'Walüng', cui:'Tóxico en exceso. No en embarazo ni niños sin profesional.', k:'paico parasitos empacho' },
  { n:'Ruda', i:'🌿', uso:'Tradicional dolores menstruales (uso externo mayormente)', prep:'Preferencia uso externo/baños. Interno solo con guía (riesgo).', luna:'Menguante', rec:'Todo el año', cui:'ABORTIVA: prohibida en embarazo. Fotosensible. No automedicar.', k:'ruda menstruacion aborto cuidado' },
  { n:'Llantén', i:'🍃', uso:'Tos, garganta, heridas leves (cataplasma)', prep:'Gárgaras tibias. Hoja limpia machacada sobre picadura leve.', luna:'Llena', rec:'Pewü bordes húmedos', cui:'Lavar bien (perros/camino). No en obstrucción intestinal.', k:'llanten tos garganta herida' },
  { n:'Caléndula', i:'🌼', uso:'Piel, rozaduras, enjuague bucal suave', prep:'Aceite macerado o infusión para lavado. Pétalos comestibles.', luna:'Llena', rec:'Pewü-Walüng flores', cui:'Alergia asteráceas. Uso externo preferente.', k:'calendula piel herida rozadura' },
  { n:'Ajo', i:'🧄', uso:'Resfrío, presión (apoyo), cocina sana', prep:'1 diente crudo picado con comida. Miel-ajo 7 días en resfrío.', luna:'Menguante', rec:'Rimü cosecha', cui:'Anticoagulantes: avisar. Acidez en exceso.', k:'ajo resfrio presion' },
  { n:'Diente de león', i:'🌼', uso:'Digestión, hígado, ensalada amarga', prep:'Hojas tiernas en ensalada. Raíz tostada como “café”.', luna:'Creciente', rec:'Pewü lejos de camino', cui:'Cálculos biliares o diuréticos: consultar.', k:'diente leon digestion higado ensalada' }
];
function getLawenUserData(){ try{ const u=userData(); if(!u.lawenUser) u.lawenUser=[]; if(!Array.isArray(u.lawenUser)) u.lawenUser=[]; return u.lawenUser; }catch{ return []; } }
function setLawenUserData(a){ try{ userData().lawenUser=a; }catch{} }
function lawenCardHTML(p, mine, idx){
  const del = mine? `<button type="button" class="btn btn-icon lawen-del su-2fa310" data-i="${idx}" title="Borrar mi ficha">✕</button>` : '';
  const mineChip = mine? `<span class="chip su-f71d39">🌱 mía</span>` : '';
  return `<div class="si-card lawen-card${mine?' mine':''}">`
    + `<div class="lawen-head"><span class="lawen-ico">${p.i||'🌱'}</span><span class="lawen-name">${escapeHtml(p.n)}</span>${mineChip}<span class="su-97445a"></span><span class="chip lawen-luna">🌙 ${escapeHtml(p.luna||'Cualquiera')}</span>${del}</div>`
    + `<div class="lawen-grid">`
    + `<span class="lawen-label">USO</span><span class="lawen-val">${escapeHtml(p.uso||'—')}</span>`
    + (p.prep? `<span class="lawen-label">PREPARA</span><span class="lawen-val">🫖 ${escapeHtml(p.prep)}</span>`:'')
    + (p.rec? `<span class="lawen-label dim">RECOLECTA</span><span class="lawen-val">📅 ${escapeHtml(p.rec)}</span>`:'')
    + `</div>`
    + (p.cui? `<div class="lawen-warn">⚠️ ${escapeHtml(p.cui)}</div>`:'')
    + `</div>`;
}
function renderLawenList(){
  const box=$('lawenList'); if(!box) return;
  const q=(($('lawenSearch')&&$('lawenSearch').value)||'').toLowerCase().trim();
  const mf=(($('lawenMoonFilter')&&$('lawenMoonFilter').value)||'');
  const match=p=>{
    const txt=(p.n+' '+(p.uso||'')+' '+(p.prep||'')+' '+(p.cui||'')+' '+(p.rec||'')+' '+(p.k||'')+' '+(p.luna||'')).toLowerCase();
    if(q && !txt.includes(q)) return false;
    if(mf && mf!=='Cualquiera' && p.luna!==mf && p.luna!=='Cualquiera') return false;
    return true;
  };
  const mine=getLawenUserData();
  const base=LAWEN_PLANTS.filter(match);
  const own=mine.map((p,i)=>({p,i})).filter(({p})=>match(p));
  const total=base.length+own.length;
  let html=`<p class="muted su-245797">🌿 ${LAWEN_PLANTS.length} fichas base${mine.length?` + <b>${mine.length} mías</b>`:''} · mostrando <b>${total}</b></p>`;
  if(total){
    html+=`<div class="su-a56c85">`+base.map(p=>lawenCardHTML(p,false,-1)).join('');
    if(own.length) html+=`<div class="su-0c1cf5"><span class="su-3cd8ec"></span><span class="muted su-11a508">🌱 Mis fichas (${own.length})</span><span class="su-3cd8ec"></span></div>`+own.map(({p,i})=>lawenCardHTML(p,true,i)).join('');
    html+=`</div>`;
  } else {
    html+=`<div class="menstrual-card su-91a870"><p class="su-6cb285">Sin resultados para “${escapeHtml(q)}”.</p><p class="muted su-11a508">Prueba “tos”, “herida”, “digestión” — o agrégala como ficha propia:</p><button type="button" id="lawenEmptyAdd" class="btn btn-accent su-9b41c6">➕ Agregar “${escapeHtml(q.slice(0,30))}” como mi lawen</button></div>`;
  }
  box.innerHTML=html;
  box.querySelectorAll('.lawen-del').forEach(b=> b.onclick=()=>{ const arr=getLawenUserData(); arr.splice(parseInt(b.dataset.i),1); setLawenUserData(arr); scheduleSave('Guardado ✓'); renderLawenList(); });
  const eb=$('lawenEmptyAdd');
  if(eb) eb.onclick=()=>{
    const nm=$('lawenName'); if(nm) nm.value=q.slice(0,40);
    const det=$('lawenAddBox'); if(det) det.open=true;
    const us=$('lawenUso'); if(us) us.focus();
  };
}
function setupLawenDialog(){
  const btn=$('btnLawen'); if(btn) btn.onclick=()=>{ renderLawenList(); $('lawenDialog').showModal(); };
  const ct=$('lawenCloseTop'), cb=$('lawenClose'); if(ct) ct.onclick=()=>$('lawenDialog').close(); if(cb) cb.onclick=()=>$('lawenDialog').close();
  const s=$('lawenSearch'), f=$('lawenMoonFilter');
  if(s) s.oninput=renderLawenList; if(f) f.onchange=renderLawenList;
  const add=$('lawenAdd');
  if(add) add.onclick=()=>{
    const n=sanitizeText(($('lawenName').value||'').trim(),40);
    const uso=sanitizeText(($('lawenUso').value||'').trim(),80);
    if(!n || !uso){ if($('statusMsg')){ $('statusMsg').textContent='Falta nombre y uso ✎'; setTimeout(()=>{$('statusMsg').textContent='';},2000); } return; }
    const arr=getLawenUserData();
    arr.push({ n, uso, prep:sanitizeText(($('lawenPrep').value||'').trim(),80), luna:$('lawenLuna').value||'Cualquiera', rec:sanitizeText(($('lawenRec').value||'').trim(),60), cui:sanitizeText(($('lawenCui').value||'').trim(),80), i:'🌱', k:'' });
    setLawenUserData(arr); scheduleSave('Guardado ✓');
    ['lawenName','lawenUso','lawenPrep','lawenRec','lawenCui'].forEach(id=>{ const el=$(id); if(el) el.value=''; });
    renderLawenList();
  };
  const nm0=$('lawenName');
  if(nm0) nm0.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); const a=$('lawenAdd'); if(a) a.click(); } });
}
setTimeout(setupLawenDialog, 888);

// === COMPOST & SUELO — PILA + SUELO + RECETAS + PROBLEMAS + LUNA ===
let compostTab='pila';
const COMPOST_META={pila:90,vermi:90,bocashi:14};
const COMPOST_NOMBRES={pila:'🪱 Pila caliente',vermi:'🪱 Vermicompostera',bocashi:'♻️ Bocashi'};
function getCompostData(){ try{ const u=userData(); if(!u.compost) u.compost={type:'pila',start:'',turns:[],note:''}; if(!Array.isArray(u.compost.turns)) u.compost.turns=[]; if(!u.compost.type) u.compost.type='pila'; return u.compost; }catch{ return {type:'pila',start:'',turns:[],note:''}; } }
function compostDias(c){
  try{
    if(!c.start) return 0;
    const a=new Date(c.start+'T12:00:00'); if(isNaN(a)) return 0;
    return Math.max(0, Math.floor((Date.now()-a.getTime())/86400000));
  }catch{ return 0; }
}
function compostNextMenguantes(){
  try{
    const out=[];
    Object.keys(phaseMap||{}).sort().forEach(k=>{
      (phaseMap[k]||[]).forEach(e=>{
        if(/menguante/i.test(e.tipo||'')) out.push({key:k, e});
      });
    });
    const today = cal.fmtKey.format(new Date());
    return out.filter(o=> o.key>=today).slice(0,4);
  }catch{ return []; }
}
function compostEtapa(c, dias){
  const meta=COMPOST_META[c.type]||90;
  if(!c.start) return 'Pon fecha de inicio para estimar madurez.';
  if(dias>=meta) return '✅ Listo probable: color oscuro, olor a tierra de bosque, no se reconoce nada. Haz prueba de puño + siembra de prueba (lechuga 5 días).';
  if(c.type==='bocashi'){
    if(dias<3) return '🔥 Días 1-3: fermentando, debe oler a chicha/levadura y estar tibio. Voltea 2× día.';
    return '⏳ Días 4-14: enfriando. Cuando está seco, gris y sin calor → listo. Guarda en saco a la sombra.';
  }
  if(dias<14) return '🔥 Fase caliente: debe estar tibio-caliente al meter la mano. Voltea en cada menguante, mantén húmedo como esponja estrujada.';
  if(dias<meta*0.66) return '⏳ Fase enfriamiento: baja el calor, aparecen hongos blancos y lombrices. Agrega más seco si está pegajoso.';
  return '🌱 Fase maduración: casi tierra. No agregues restos frescos; deja reposar 2-3 semanas antes de usar.';
}
function renderCompostStatus(){
  const b=$('compostStatusBox'); if(!b) return;
  const c=getCompostData();
  const n=c.turns.length;
  const last=c.turns.slice().sort().pop()||'—';
  const tipo=COMPOST_NOMBRES[c.type]||COMPOST_NOMBRES.pila;
  const dias=compostDias(c);
  const meta=COMPOST_META[c.type]||90;
  const pct=c.start?Math.min(100,Math.round(dias/meta*100)):0;
  const ms=compostNextMenguantes();
  const prox=ms.length?ms[0].key:'—';
  b.innerHTML=`<div class="su-48a924"><b>${tipo}</b><span class="muted su-11a508">inicio ${escapeHtml(c.start||'—')} · día ${dias}/${meta} · volteos <b>${n}</b> · último ${escapeHtml(last)}</span></div>
  <div class="su-160736"><div style="height:100%;width:${pct}%;border-radius:99px;background:linear-gradient(90deg,#c9a86a,#a9d18e)"></div></div>
  <div class="muted su-e13d76">${pct}% madurez estimada · próximo menguante para voltear: <b>${escapeHtml(prox)}</b> — se guarda local</div>`;
}
function compostDiagnostico(olor, hum, temp){
  if(olor==='podrido'||hum==='chorrea') return '<b>💧 Exceso de verde / agua (anaerobio).</b> Agrega 3 puñados de seco (hojas, cartón picado, paja), voltea entero y tapa con nylon con un palo para que respire. No riegues 3-4 días. En Pukem pon la pila bajo techo o con lona.';
  if(olor==='amoniaco') return '<b>🟡 Mucho nitrógeno (pasto/guano fresco).</b> Agrega seco + un puñado de tierra de hoja o compost viejo para inocular. Voltea. No agregues más guano hasta que baje el olor.';
  if(hum==='seco'||temp==='frio-seco') return '<b>🏜️ Falta agua y/o verde.</b> Riega en forma de lluvia hasta “esponja estrujada”, agrega restos de cocina y tapa. Si no calienta en 3 días, reinicia con 1 balde de guano fresco + agua con chancaca.';
  if(olor==='vinagre') return '<b>🍎 Fermentación ácida (mucha fruta junta).</b> Agrega ceniza de leña (1 taza/m², no más), cartón picado y voltea. No pongas más fruta por 1 semana.';
  if(temp==='caliente') return '<b>🔥 Vas bien: fase caliente.</b> Mantén humedad, voltea en menguante y no agregues carne/lácteos. Cuando baje el calor solo, pasa a maduración.';
  return '<b>🌱 Equilibrio bueno.</b> Sigue 3 secos × 1 verde, volteo en menguante y tapa en lluvia. Cosecha cuando huela a tierra y no reconozcas nada.';
}
function renderCompostPanel(tab){
  compostTab=tab||compostTab;
  const ids={pila:'tabCP1',suelo:'tabCP2',recetas:'tabCP4',problemas:'tabCP5',luna:'tabCP3'};
  Object.entries(ids).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===compostTab); });
  renderCompostStatus();
  const box=$('compostPanel'); if(!box) return;
  let html='';
  if(compostTab==='pila'){
    const c=getCompostData();
    const dias=compostDias(c);
    const meta=COMPOST_META[c.type]||90;
    const pct=c.start?Math.min(100,Math.round(dias/meta*100)):0;
    html+=`<div class="menstrual-card su-68a1a9"><h4 class="su-e39eba">🪱 Mi pila — registro</h4>
      <div class="conv-row"><label>Tipo <select id="cpType"><option value="pila" ${c.type==='pila'?'selected':''}>Pila caliente (patio)</option><option value="vermi" ${c.type==='vermi'?'selected':''}>Vermicompostera (depto/balcón)</option><option value="bocashi" ${c.type==='bocashi'?'selected':''}>Bocashi (fermentado 14 días)</option></select></label>
      <label>Inicio <input type="date" id="cpStart" value="${escapeHtml(c.start||'')}"></label>
      <button type="button" id="cpToday" class="btn su-4ed52d">◉ Hoy volteé</button></div>
      <label>Nota <input type="text" id="cpNote" placeholder="olor, humedad, temperatura, qué agregué" maxlength="80" value="${escapeHtml(c.note||'')}"></label>
      <p class="muted su-2370ea">Día ${dias}/${meta} (${pct}%) · ${escapeHtml(compostEtapa(c,dias))}</p>
      <div id="cpTurns" class="habits-list su-9944cd">`+
      (c.turns.slice().sort().reverse().map(t=>`<div class="hora-item"><span>🪱 ${escapeHtml(t)}</span><button type="button" class="btn btn-icon cp-del" data-t="${escapeHtml(t)}">✕</button></div>`).join('')||'<p class="muted su-11a508">Sin volteos aún. Marca “Hoy volteé” o marca un menguante en 📅 Luna.</p>')+`</div></div>
      <div class="menstrual-card su-8c7f2d"><h4 class="su-559282">🔍 Diagnóstico rápido — ¿cómo está hoy?</h4>
      <div class="conv-row"><label>Olor <select id="cpOlor"><option value="tierra">Tierra / bosque</option><option value="podrido">Podrido / huevo</option><option value="amoniaco">Amoníaco / pipí fuerte</option><option value="vinagre">Vinagre / chicha ácida</option><option value="nada">Sin olor</option></select></label>
      <label>Humedad (puño) <select id="cpHum"><option value="esponja">Esponja estrujada ✓</option><option value="chorrea">Chorrea agua</option><option value="seco">Seco / polvo</option></select></label>
      <label>Temperatura <select id="cpTemp"><option value="caliente">Tibio-caliente</option><option value="tibio">Tibio leve</option><option value="frio-seco">Frío + seco</option><option value="frio-mojado">Frío + mojado</option></select></label></div>
      <button type="button" id="cpDiagBtn" class="btn su-e182f0">Diagnosticar</button>
      <div id="cpDiagOut" class="muted su-14bd55">Elige las 3 y presiona Diagnosticar.</div></div>
      <div class="help-grid su-d2c171">
        <div class="help-card"><h4>🟤 Receta base 3×1 Penco</h4><p class="su-a6c665"><b>3 secos (carbono):</b> hojas secas, cartón picado sin tinta, paja, viruta, hojas de boldo/peumo.<br><b>1 verde (nitrógeno):</b> restos cocina, pasto fresco, guano, café/yerma mate.<br>Capas de 5-10 cm, puño húmedo. Tapa con nylon en Pukem, con rama para que respire.</p></div>
        <div class="help-card"><h4>🚫 No va nunca</h4><p class="su-a6c665">Carne, pescado, lácteos, aceite, fecas perro/gato, pañales, ceniza con carbón pintado o parafina, maleza con semilla (chufa, vinagrillo), tierra con herbicida.</p></div>
        <div class="help-card"><h4>✅ Sí va (poco)</h4><p class="su-a6c665">Cáscara huevo molida, ceniza de leña pura (1 taza/m² max), pelo, cartón huevo, podas trituradas, algas enjuagadas de Lirquén, ortiga (activa).</p></div>
        <div class="help-card"><h4>📏 Tamaño ideal</h4><p class="su-a6c665">Mínimo 1 m³ (1×1×1 m) para que caliente. Menos que eso = vermi o bocashi mejor. Palet + malla + lona arriba funciona perfecto en patio Penco.</p></div>
      </div>`;
  } else if(compostTab==='suelo'){
    html+=`<div class="help-grid">
      <div class="help-card"><h4>🗺️ Tu suelo según sector Penco</h4><p class="su-a6c665"><b>Penco Alto / greda roja:</b> arcilla pesada, se aprieta en Pukem y se parte en Walüng → bancal alto + yeso + mulch grueso.<br><b>Centro / relleno:</b> franco con escombro → saca piedras, 5 cm compost, mulch.<br><b>Lirquén–Playa Negra / costa:</b> arena que no retiene → mucho compost + mulch + riego corto frecuente.<br><b>Vega / humedal:</b> negro que se encharca → camas altas 30 cm + zanja drenaje, nunca pises mojado.</p></div>
      <div class="help-card"><h4>✊ Test 1 · Puño (textura)</h4><p class="su-a6c665">Moja un puñado y aprieta:<br>• Se desarma = <b>arenoso</b> → compost + mulch.<br>• Bola que se marca pero se quiebra = <b>franco ideal</b>.<br>• Bola plástica / cinta &gt;3 cm = <b>arcilla</b> → nunca arena sola (hace ladrillo): compost 3-5 cm + yeso agrícola 200 g/m².</p></div>
      <div class="help-card"><h4>🫙 Test 2 · Frasco (% real)</h4><p class="su-a6c665">1 taza tierra + agua + 1 cdta sal en frasco, agita y deja 24 h. Arena abajo, limo medio, arcilla arriba. Ideal huerta: ~40% arena / 40% limo / 20% arcilla. Si &gt;50% arcilla → plan arcilla Penco.</p></div>
      <div class="help-card"><h4>🕳️ Test 3 · Infiltración (drenaje)</h4><p class="su-a6c665">Hoyo 30×30 cm, llena de agua 2 veces. 2ª vez: mide cuánto baja en 1 h.<br>• &lt;2 cm/h = <b>encharca</b> → cama alta + drenaje.<br>• 2-8 cm/h = <b>ideal</b>.<br>• &gt;15 cm/h = <b>arena</b> → mulch 8 cm + compost + riego corto.</p></div>
      <div class="help-card"><h4>🧪 Test 4 · pH casero</h4><p class="su-a6c665"><b>Vinagre:</b> efervesce = alcalino (&gt;7,5). <b>Bicarbonato + agua:</b> efervesce = ácido (&lt;5,5). Penco típico 5,5-6,5 (levemente ácido, bien para casi todo). Solo encalan si mediste &lt;5,5: cal agrícola 200-300 g/m² en otoño, nunca junto a guano fresco.</p></div>
      <div class="help-card"><h4>🛠️ Plan arcilla Penco (otoño→primavera)</h4><p class="su-a6c665">1) No pises mojado. 2) Levanta bancal 20-30 cm. 3) 3-5 cm compost maduro + yeso 200 g/m² (no cambia pH, abre). 4) Mulch hojas/paja 5-8 cm. 5) Siembra abono verde avena+vicia en Rimü y córtalo antes de semillar. Repite cada año: la arcilla se doma en 2-3 ciclos.</p></div>
      <div class="help-card"><h4>🍂 Mulch correcto</h4><p class="su-a6c665">5-8 cm hojas secas/paja. Guarda humedad de Walüng, evita barro y sopa de babosas en Pukem. Deja 3 cm libres alrededor del tallo. Renueva cuando se vea la tierra.</p></div>
      <div class="help-card"><h4>🌱 Abono verde (el mejor secreto)</h4><p class="su-a6c665">Siembra en Rimü (mar-may): avena + vicia o mostaza. Corta en flor (ago), deja 2 semanas sobre el suelo y planta encima. Raíces rompen arcilla gratis + fijan nitrógeno. Dosis: 30 g/m².</p></div>
    </div>
    <div class="menstrual-card su-d2c171"><h4>⚗️ Enmiendas: dosis sin pasarse</h4><p class="muted su-b439ab"><b>Compost maduro:</b> 3-5 cm/año (≈30 L/m²) 7 días antes de siembra. <b>Humus vermi:</b> 1-2 L/m² o 100 g/planta. <b>Ceniza leña pura:</b> máx 100 g/m²/año, nunca sobre plantín. <b>Yeso agrícola:</b> 200 g/m² para arcilla. <b>Cal:</b> solo con pH medido &lt;5,5. <b>Bocashi:</b> 500 g/m² 7 días antes (nunca fresco). Exceso quema más que la falta.</p></div>`;
  } else if(compostTab==='recetas'){
    html+=`<div class="help-grid">
      <div class="help-card"><h4>🪱 Vermicompostera (depto)</h4><p class="su-a6c665"><b>Caja:</b> 2 cajas apiladas con hoyos + bandeja jugo (lixiviado). <b>Lombriz:</b> roja californiana, 200-500 inicio. <b>Comida:</b> restos picados 300 g/semana, siempre tapados con seco. <b>Cosecha:</b> 3 meses, luz encima y migran solas. <b>Lixiviado:</b> 1:10 riego. Luna: instalar en nueva. Ojo: sin sol directo, sin cítricos/cebolla en exceso.</p></div>
      <div class="help-card"><h4>♻️ Bocashi 14 días (fermentado)</h4><p class="su-a6c665"><b>Mezcla seca:</b> 10 kg guano seco + 10 kg tierra + 5 kg afrechillo + 1 kg carbón molido. <b>Agua:</b> 5 L tibia + 10 g levadura + 200 g chancaca. Humedad “puño” (gotea 1 gota). Pila 50 cm, voltea 2× día hasta que enfríe. <b>Uso:</b> 500 g/m² 7 días antes de siembra. Nunca fresco (quema).</p></div>
      <div class="help-card"><h4>🫖 Té de compost (biofertilizante)</h4><p class="su-a6c665">1 kg compost maduro en bolsa de tela + 10 L agua + 20 g azúcar. Airea 24-36 h (o revuelve 3× día). Filtra y usa en 24 h. <b>Riego:</b> puro o 1:3. <b>Foliar:</b> 1:10 cada 14 días en creciente. Activa microvida en arcilla Penco. Sin olor feo = bien hecho.</p></div>
      <div class="help-card"><h4>🍂 Tierra de hojas otoñal (Rimü)</h4><p class="su-a6c665">Junta hojas de peumo/boldo/maqui (no eucalipto/pino solo). Malla o saco con hoyos, moja y guarda a la sombra. Voltea 1× mes. En 6-9 meses tienes tierra esponjosa para almácigos. Mezcla ideal almácigo: 2 tierra hoja + 1 compost + 1 arena gruesa.</p></div>
      <div class="help-card"><h4>🌿 Purín de ortiga / diente de león</h4><p class="su-a6c665">1 kg planta fresca + 10 L agua, tapa con respiración, revuelve diario 7-14 días (espuma = listo). Filtra. <b>Riego:</b> 1:10. <b>Foliar:</b> 1:20. Huele fuerte = normal. Aporta nitrógeno + hierro. No en floración avanzada ni a 1 semana de cosecha.</p></div>
      <div class="help-card"><h4>⬛ Carbón + ceniza (bien usados)</h4><p class="su-a6c665"><b>Biochar casero:</b> carbón leña molido + “cargado” 1 semana en té compost antes de enterrar (si no, roba nutrientes). 200 g/m². <b>Ceniza:</b> solo leña pura, 100 g/m² max, nunca con semilla recién puesta ni sobre lombrices. Guarda seca: mojada pierde potasio.</p></div>
    </div>
    <div class="menstrual-card su-51d56a"><h4 class="su-e39eba">📅 ¿Cuándo aplicar? regla 7 días</h4><p class="muted su-a6c665">Compost/bocashi/humus siempre <b>7 días antes de sembrar/trasplantar</b>, no el mismo día. Té foliar en <b>creciente</b> al atardecer. Cal/yeso en <b>otoño (Rimü)</b>. Abono verde se corta <b>2 semanas antes</b> de plantar. Así la microvida se instala y no “quema” raíces.</p></div>`;
  } else if(compostTab==='problemas'){
    html+=`<div class="help-grid">
      <div class="help-card"><h4>🤢 Huele a podrido / huevo</h4><p class="su-a6c665"><b>Causa:</b> sin aire + mucha agua/verde. <b>Arreglo:</b> voltea entero, mete 3 puñados seco, haz chimenea con palo. Tapa con lona que respire. En 2 días debe bajar.</p></div>
      <div class="help-card"><h4>🪰 Nube de mosquitas</h4><p class="su-a6c665"><b>Causa:</b> resto fresco expuesto. <b>Arreglo:</b> entierra 10 cm, tapa siempre con seco/cartón, pon malla. Trampa: vinagre + gota lavalozas al lado. Menguante hay menos.</p></div>
      <div class="help-card"><h4>🏜️ No calienta / seco</h4><p class="su-a6c665"><b>Causa:</b> puro seco o pila chica. <b>Arreglo:</b> riega lluvia + 1 balde verde/guano + agua con chancaca. Junta mínimo 1 m³. Tapa negro al sol en Pewü.</p></div>
      <div class="help-card"><h4>🌊 Barro / chorrea (Pukem)</h4><p class="su-a6c665"><b>Causa:</b> lluvia directa + poco techo. <b>Arreglo:</b> lona con caída, zanja alrededor, agrega cartón/paja seca. Pon pallet abajo para que drene. No voltees con lluvia torrencial.</p></div>
      <div class="help-card"><h4>🐜 Hormigas en la pila/vermi</h4><p class="su-a6c665"><b>Causa:</b> muy seco + dulce. <b>Arreglo:</b> moja bien, entierra fruta, banda de ceniza afuera (no adentro). En vermi: revisa drenaje y baja cítricos.</p></div>
      <div class="help-card"><h4>🧱 Suelo ladrillo imposible</h4><p class="su-a6c665"><b>Causa:</b> arcilla + pisoteo + arena sola. <b>Arreglo:</b> no piques seco (rompes estructura). Moja profundo, espera 2 días, incorpora compost + yeso 200 g/m² + mulch 8 cm. Bancal alto desde ahora.</p></div>
      <div class="help-card"><h4>🐌 Babosas tras el mulch</h4><p class="su-a6c665"><b>Causa:</b> mulch pegado al tallo + riego noche. <b>Arreglo:</b> 3 cm libres al tallo, riega mañana, trampa cerveza + anillo ceniza seca. Patos/gallinas 1 h al atardecer = control total.</p></div>
      <div class="help-card"><h4>🌱 “Quemé” plantas con abono</h4><p class="su-a6c665"><b>Causa:</b> bocashi/guano fresco directo. <b>Arreglo:</b> riega abundante 3 días, sombrea, poda hojas quemadas. Regla: fresco nunca toca raíz; espera 7 días siempre.</p></div>
    </div>
    <div class="menstrual-card su-d2c171"><h4>❄️ Invierno Pukem: no abandones la pila</h4><p class="muted su-a6c665">La lluvia enfría y lava nutrientes. Tapa con lona, reduce verdes acuosos (sandía, tomate), suma hojas secas guardadas en Rimü. Voltea solo en pausa de lluvia y en menguante. La vermi entra bajo techo (garaJe/balcón tapado): lombriz muere bajo 5°C.</p></div>`;
  } else if(compostTab==='luna'){
    const ms=compostNextMenguantes();
    html+=`<div class="menstrual-card su-4181c1"><h4 class="su-559282">📅 Voltea en menguante — próximos</h4>`+
    (ms.length? `<div class="su-5e3875">`+ms.map(o=>`<div class="hora-item"><span>🌓 ${escapeHtml(o.key)} · ${escapeHtml((o.e.tipo||'menguante').replace(/-/g,' '))} ${o.e.simbolo||''}</span><button type="button" class="btn cp-go su-337714" data-k="${escapeHtml(o.key)}">Marcar volteo</button></div>`).join('')+`</div>`
    : '<p class="muted su-11a508">Cambia de luna en el calendario para cargar fases.</p>')+
    `<p class="muted su-e13d76">Menguante = energía a raíces + menos moscas. Airea, ajusta humedad y agrega seco.</p></div>
    <div class="help-grid su-d2c171">
      <div class="help-card"><h4>🌑 Nueva — planifica</h4><p class="su-11a508">Descansa la pila. Instala vermi nueva, arma cajón, junta secos, anota qué sembrarás. Sin volteo.</p></div>
      <div class="help-card"><h4>🌒 Creciente — alimenta hoja</h4><p class="su-11a508">Té de compost foliar 1:10 + riego. Siembra hoja y trasplanta sobre compost de hace 7 días.</p></div>
      <div class="help-card"><h4>🌕 Llena — observa</h4><p class="su-11a508">No voltees fuerte. Cosecha compost maduro si está listo, pesa y anota. Revisa humedad con puño.</p></div>
      <div class="help-card"><h4>🌖 Menguante — voltea y abona</h4><p class="su-11a508">Volteo completo + seco + ajuste agua. Aplica bocashi/compost a raíz (zanahoria, ajo, betarraga). Controla moscas y repara lona Pukem.</p></div>
    </div>`;
  }
  box.innerHTML=html;
  if(compostTab==='pila'){
    const c=getCompostData();
    const t=$('cpType'), s=$('cpStart'), n=$('cpNote');
    if(t) t.onchange=()=>{ c.type=t.value; scheduleSave(); renderCompostStatus(); renderCompostPanel('pila'); };
    if(s) s.onchange=()=>{ c.start=s.value; scheduleSave(); renderCompostStatus(); renderCompostPanel('pila'); };
    if(n) n.oninput=()=>{ c.note=n.value.slice(0,80); scheduleSave(); };
    const b=$('cpToday'); if(b) b.onclick=()=>{ const k=cal.fmtKey.format(new Date()); if(!c.turns.includes(k)) c.turns.push(k); scheduleSave('Guardado ✓'); renderCompostPanel('pila'); };
    box.querySelectorAll('.cp-del').forEach(x=> x.onclick=()=>{ const cc=getCompostData(); cc.turns=cc.turns.filter(t=>t!==x.dataset.t); scheduleSave(); renderCompostPanel('pila'); });
    const db=$('cpDiagBtn'); if(db) db.onclick=()=>{
      const o=$('cpOlor')?$('cpOlor').value:'tierra';
      const h=$('cpHum')?$('cpHum').value:'esponja';
      const tp=$('cpTemp')?$('cpTemp').value:'tibio';
      const out=$('cpDiagOut'); if(out) out.innerHTML=compostDiagnostico(o,h,tp);
    };
  }
  if(compostTab==='luna'){
    box.querySelectorAll('.cp-go').forEach(b=> b.onclick=()=>{ const c=getCompostData(); if(!c.turns.includes(b.dataset.k)) c.turns.push(b.dataset.k); scheduleSave('Guardado ✓'); renderCompostPanel('luna'); });
  }
}
function setupCompostDialog(){
  const btn=$('btnCompost'); if(btn) btn.onclick=()=>{ renderCompostPanel('pila'); $('compostDialog').showModal(); };
  const ct=$('compostCloseTop'), cb=$('compostClose'); if(ct) ct.onclick=()=>$('compostDialog').close(); if(cb) cb.onclick=()=>$('compostDialog').close();
  ['tabCP1','tabCP2','tabCP3','tabCP4','tabCP5'].forEach(id=>{ const el=$(id); if(!el) return; el.onclick=()=>{ const map={tabCP1:'pila',tabCP2:'suelo',tabCP3:'luna',tabCP4:'recetas',tabCP5:'problemas'}; renderCompostPanel(map[id]); }; });
}
setTimeout(setupCompostDialog, 889);


// === RECICLAJE & FERIAS ===
const RECICLA_ITEMS = [
  { n:'Botella plástica PET', d:'Punto limpio', e:'Lava, aplasta, sin tapa', k:'botella plastico pet bebida' },
  { n:'Vidrio (botella/frasco)', d:'Punto limpio', e:'Sin quebrar, sin tapa, no ventanas', k:'vidrio botella frasco' },
  { n:'Cartón / papel', d:'Punto limpio', e:'Seco, amarra, no encerado ni sucio con grasa', k:'carton papel diario caja' },
  { n:'Lata aluminio / conserva', d:'Punto limpio', e:'Lava y aplasta', k:'lata aluminio conserva atun' },
  { n:'Pilas / baterías', d:'Peligroso', e:'Nunca a basura. Punto limpio o campaña municipal', k:'pila bateria control' },
  { n:'Aceite cocina usado', d:'Peligroso', e:'En botella cerrada a punto limpio. Nunca al lavaplatos', k:'aceite fritura cocina' },
  { n:'Ropa buena', d:'Feria', e:'Feria, trueque o donación. Ver Banco Semillas', k:'ropa zapato textil' },
  { n:'Ropa rota / trapo', d:'Basura', e:'Bolsa cerrada a aseo. No a punto limpio', k:'trapo ropa rota' },
  { n:'Restos verdura / cáscara', d:'Compost', e:'A compost (ver 🪱). No carne/lácteos', k:'verdura cascara resto comida compost' },
  { n:'Escombro / voluminoso', d:'Basura', e:'Operativo municipal / Aseo 41 226 1033, no a humedal', k:'escombro mueble colchon voluminoso' },
  { n:'Electrónico chico', d:'Peligroso', e:'Campaña e-waste municipal, no a basura', k:'celular cargador electronico tele' },
  { n:'Tetra pack', d:'Punto limpio', e:'Lava, abre y seca', k:'tetra leche jugo' },
  { n:'Plumavit', d:'Basura', e:'Evita. Solo limpio en algunos puntos', k:'plumavit aislapol' },
  { n:'Medicamento vencido', d:'Peligroso', e:'A farmacia/CESFAM, nunca WC ni basura suelta', k:'remedio medicamento vencido' }
];
function renderReciclaList(){
  const box=$('reciclaList'); if(!box) return;
  const q=(($('reciclaSearch')&&$('reciclaSearch').value)||'').toLowerCase().trim();
  const f=(($('reciclaFilter')&&$('reciclaFilter').value)||'');
  const list=RECICLA_ITEMS.filter(p=>{ if(f && p.d!==f) return false; if(q && !(p.n+' '+p.e+' '+p.k).toLowerCase().includes(q)) return false; return true; });
  const col={ 'Punto limpio':'#7ab8ff', 'Feria':'#a9d18e', 'Compost':'#c9a86a', 'Basura':'#9aa3c7', 'Peligroso':'#e76e8a' };
  box.innerHTML = list.length? `<div class="su-14b4b5">`+list.map(p=>`<div class="hora-item su-ec9903"><span class="chip" style="font-size:10px;background:${col[p.d]}22;color:${col[p.d]};border-color:${col[p.d]}55;white-space:nowrap">${escapeHtml(p.d)}</span><span class="su-6cb285"><b>${escapeHtml(p.n)}</b> — ${escapeHtml(p.e)}</span></div>`).join('')+`</div>` : '<p class="muted su-91a870">Sin resultados. Prueba “botella”, “pila”, “aceite”.</p>';
}
function setupReciclaDialog(){
  const btn=$('btnRecicla'); if(btn) btn.onclick=()=>{ renderReciclaList(); $('reciclaDialog').showModal(); };
  const ct=$('reciclaCloseTop'), cb=$('reciclaClose'); if(ct) ct.onclick=()=>$('reciclaDialog').close(); if(cb) cb.onclick=()=>$('reciclaDialog').close();
  const s=$('reciclaSearch'), f=$('reciclaFilter'); if(s) s.oninput=renderReciclaList; if(f) f.onchange=renderReciclaList;
}
setTimeout(setupReciclaDialog, 890);

// === AIRE PENCO ===
function renderAireTips(pm25){
  const box=$('aireTipsBox'); if(!box) return;
  let nivel = pm25==null? null : pm25<=12? 'Bueno': pm25<=35? 'Moderado': pm25<=55? 'Regular': 'Malo';
  const tips = [
    ['🔥 Leña seca','Quema solo <25% humedad, carga pequeña y aire abierto. Humo denso = mala combustión.'],
    ['🪟 Ventila','Ventila 10 min al mediodía (mejor aire), no de noche con humo.'],
    ['😷 Grupos sensibles','Niños, mayores y asma: evita ejercicio costanera con humo. Mascarilla si hay preemergencia.'],
    ['📻 Alerta','Preemergencia SEREMI: no más humo, sigue radio/muni. Denuncia humo industrial a SMA.']
  ];
  box.innerHTML = `<div class="help-grid">`+tips.map(t=>`<div class="help-card"><h4>${t[0]}</h4><p class="su-11a508">${t[1]}</p></div>`).join('')+`</div>`+
    (nivel? `<p class="muted su-e13d76">PM2.5 ahora ≈ <b>${Math.round(pm25)} µg/m³ (${nivel})</b> — referencia OMS diaria 15. Si está Regular/Malo, baja la estufa y ventila corto.</p>` : `<p class="muted su-e13d76">Sin dato en vivo (offline). Usa la guía: si ves humo estancado sobre la bahía, aplica modo invierno.</p>`);
}
async function fetchAire(){
  const box=$('aireLiveBox'); if(box) box.innerHTML='<i>Cargando aire…</i>';
  try{
    const url='https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-36.73194&longitude=-72.9925&hourly=pm2_5,us_aqi&timezone=America%2FSantiago&forecast_days=1';
    const r=await fetch(url); const j=await r.json();
    const times=j.hourly.time; const vals=j.hourly.pm2_5;
    const p=cal.santiagoParts(Date.now());
    const key=`${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}T${String(p.hh).padStart(2,'0')}`;
    let idx=times.findIndex(t=>t>=key); if(idx<0) idx=vals.length-1;
    const pm25=vals[idx];
    if(box) box.innerHTML=`<b>🌬️ Penco ahora:</b> PM2.5 ≈ <b>${pm25==null?'—':Math.round(pm25)+' µg/m³'}</b> · AQI US ${j.hourly.us_aqi[idx]??'—'} <span class="muted su-11a508">(Open-Meteo, modelo, no estación oficial — contrasta con SINCA sinca.mma.gob.cl)</span>`;
    renderAireTips(pm25);
  }catch{ if(box) box.innerHTML='<i>Sin conexión: guía offline abajo. Estación oficial: SINCA (sinca.mma.gob.cl) / SEREMI Bío-Bío.</i>'; renderAireTips(null); }
}
function setupAireDialog(){
  const btn=$('btnAire'); if(btn) btn.onclick=()=>{ $('aireDialog').showModal(); fetchAire(); };
  const ct=$('aireCloseTop'), cb=$('aireClose'); if(ct) ct.onclick=()=>$('aireDialog').close(); if(cb) cb.onclick=()=>$('aireDialog').close();
}
setTimeout(setupAireDialog, 891);

// === MIS SEMILLAS — INVENTARIO DENTRO DE SIEMBRA ===
function getSemillasInvData(){ try{ const u=userData(); if(!u.semillasInv) u.semillasInv=[]; if(!Array.isArray(u.semillasInv)) u.semillasInv=[]; return u.semillasInv; }catch{ return []; } }
function setSemillasInvData(a){ try{ userData().semillasInv=a; }catch{} }
function renderSiembraSemillas(){
  const box=$('siembraSemillasBox'); if(!box) return;
  const a=getSemillasInvData();
  const totalSobres=a.reduce((s,e)=> s+(parseInt(e.qty)||0), 0);
  box.innerHTML = `<div class="menstrual-card su-bcee4f">
    <h4 class="su-e39eba">🏺 Banco de semillas — recuento (${a.length} variedades · ${totalSobres} sobres/semillas)</h4>
    <p class="muted su-11a508">Tu stock personal, <b>local por usuario</b>. Descuenta al sembrar (−) y suma al cosechar semilla (+). Úsalo con la guía de arriba.</p>
    <div class="su-1f0834"><b>🏺 Cómo almacenar tus semillas:</b><ul class="su-0e424a" class="muted"><li>Seca bien a la sombra, lugar ventilado, 7–14 días antes de guardar.</li><li>Guarda en <b>sobre de papel</b>, no plástico (respira y evita hongos).</li><li>Frasco hermético en lugar <b>fresco, seco y oscuro</b> (ideal &lt;20 °C).</li><li>Etiqueta siempre: variedad + <b>fecha de recolección</b> + origen.</li><li>Revisa cada luna: descarta las húmedas o con moho.</li></ul></div>
    <div class="conv-row su-8a77e5">
      <label class="su-4b3de7">Variedad <input type="text" id="semInvName" placeholder="ej: Tomate rosado, Poroto manteca" maxlength="40"></label>
      <label>Cant. <input type="number" id="semInvQty" min="0" value="1" class="su-ec6626"></label>
    </div>
    <div class="conv-row su-fe7b49">
      <label>📅 Recolección <input type="date" id="semInvHarvest" class="su-4592c7"></label>
      <label class="su-4b3de7">Detalle <input type="text" id="semInvNote" placeholder="ej: sobres, gr, origen" maxlength="30"></label>
    </div>
    <div class="dlg-actions su-59a5a8"><button type="button" id="semInvAdd" class="btn btn-accent su-30e741">+ Agregar</button></div>
    <div id="semInvList" class="habits-list su-614525"></div>
    <div class="dlg-actions su-249a6a">
      <span id="semInvStats" class="muted su-11a508"></span>
      <span class="su-a76d59"><button type="button" id="semInvShare" class="btn su-30e741">📤 Compartir</button><button type="button" id="semInvClear" class="btn su-214f75">🗑 Vaciar</button></span>
    </div></div>`;
  const list=$('semInvList');
  const paint=()=>{
    const arr=getSemillasInvData();
    list.innerHTML = arr.length? arr.map((e,i)=>
      `<div class="hora-item"><span class="su-6cb285"><b>${escapeHtml(e.name)}</b> <span class="chip su-0d5be0">${escapeHtml(String(e.qty))} ${escapeHtml(e.note||'')}</span>${e.harvest?` <span class="chip su-0d5be0">📅 ${escapeHtml(e.harvest)}</span>`:''}</span><span class="hora-actions"><button type="button" class="btn btn-icon sem-dec" data-i="${i}" title="Sembré 1 (−)">−</button><button type="button" class="btn btn-icon sem-inc" data-i="${i}" title="Sumar 1 (+)">+</button><button type="button" class="btn btn-icon sem-del" data-i="${i}" title="Borrar">✕</button></span></div>`).join('')
      : '<p class="muted su-e201a8">Vacío. Agrega tu primer sobre arriba.</p>';
    const st=$('semInvStats'); if(st) st.textContent = arr.length? `${arr.length} variedades · bajo stock (≤2): ${arr.filter(x=>(parseInt(x.qty)||0)<=2).length}` : '';
    list.querySelectorAll('.sem-dec').forEach(b=> b.onclick=()=>{ const ar=getSemillasInvData(); const it=ar[parseInt(b.dataset.i)]; if(!it) return; it.qty=Math.max(0,(parseInt(it.qty)||0)-1); setSemillasInvData(ar); scheduleSave(); paint(); });
    list.querySelectorAll('.sem-inc').forEach(b=> b.onclick=()=>{ const ar=getSemillasInvData(); const it=ar[parseInt(b.dataset.i)]; if(!it) return; it.qty=(parseInt(it.qty)||0)+1; setSemillasInvData(ar); scheduleSave(); paint(); });
    list.querySelectorAll('.sem-del').forEach(b=> b.onclick=()=>{ const ar=getSemillasInvData(); ar.splice(parseInt(b.dataset.i),1); setSemillasInvData(ar); scheduleSave(); paint(); });
  };
  paint();
  const add=$('semInvAdd');
  if(add) add.onclick=()=>{
    const name=sanitizeText(($('semInvName').value||'').trim(),40); if(!name) return;
    const qty=Math.max(0, parseInt($('semInvQty').value)||0);
    const harvest=(($('semInvHarvest')&&$('semInvHarvest').value)||'').trim();
    const note=sanitizeText(($('semInvNote').value||'').trim(),30);
    const arr=getSemillasInvData();
    const found=arr.find(x=> x.name.toLowerCase()===name.toLowerCase());
    if(found){ found.qty=(parseInt(found.qty)||0)+qty; if(note) found.note=note; if(harvest) found.harvest=harvest; }
    else arr.push({name, qty, harvest, note});
    setSemillasInvData(arr); scheduleSave('Guardado ✓');
    $('semInvName').value=''; $('semInvQty').value='1'; if($('semInvHarvest')) $('semInvHarvest').value=''; $('semInvNote').value=''; paint();
  };
  const sh=$('semInvShare'); if(sh) sh.onclick=async()=>{ const arr=getSemillasInvData(); const t=arr.length? '🌱 Semillero · banco\n'+arr.map(e=>`• ${e.name}: ${e.qty}${e.harvest?' (recol. '+e.harvest+')':''}${e.note?' '+e.note:''}`).join('\n') : 'Semillero — sin stock aún'; await shareText('Semillero · banco', t, null); };
  const cl=$('semInvClear'); if(cl) cl.onclick=()=>{ if(!confirm('¿Vaciar todo el inventario?')) return; setSemillasInvData([]); scheduleSave(); paint(); };
}

// === GRATITUD DIARIA ===
function getGratitudData(){ try{ const u=userData(); if(!u.gratitud) u.gratitud={entries:{}}; if(!u.gratitud.entries) u.gratitud.entries={}; return u.gratitud; }catch{ return {entries:{}}; } }
var GRATITUD_CATS=[
  {id:'familia',ico:'👨‍👩‍👧',nombre:'Familia'},
  {id:'salud',ico:'💪',nombre:'Salud y cuerpo'},
  {id:'territorio',ico:'🌊',nombre:'Territorio y naturaleza'},
  {id:'hogar',ico:'🏠',nombre:'Hogar'},
  {id:'trabajo',ico:'💼',nombre:'Trabajo y oficio'},
  {id:'comunidad',ico:'🤝',nombre:'Amistad y comunidad'},
  {id:'espiritual',ico:'🕯️',nombre:'Espiritualidad'},
  {id:'placeres',ico:'☕',nombre:'Pequeños placeres'}
];
var GRATITUD_FRASES=[
  'Agradecer es mirar dos veces lo bueno.',
  'Lo que se agradece, florece: como el chilco en Pewü.',
  'Tres cosas buenas al día espantan la noche larga.',
  'La gratitud es memoria del corazón.',
  'Agradece el agua, el pan y la mano que los trae.',
  'Hasta la lluvia de Pukem riega algo bueno.',
  'Quien agradece a su gente, nunca camina solo.',
  'Un día con gratitud pesa menos y alumbra más.',
  'El mar devuelve lo que se le entrega con respeto.',
  'Agradece en voz alta: alguien lo necesitaba oír.',
  'Pequeño y cotidiano también es milagro.',
  'Cierra el día agradeciendo y duerme más liviano.'
];
var GRATITUD_HITOS=[
  [1,'🌱 Primer día: la semilla está sembrada.','1 día'],
  [7,'🌿 Una semana seguida: ya es un hábito que brota.','7 días'],
  [14,'🌗 Media luna de gratitud: mira atrás y relee tu camino.','14 días'],
  [28,'🌕 ¡Una luna completa! 28 días agradeciendo.','28 días'],
  [50,'⭐ 50 días: la gratitud te está cambiando la mirada.','50 días'],
  [100,'💯 100 días: un cuaderno entero de luz.','100 días'],
  [180,'🌊 Medio ciclo: comparte una carta con alguien.','180 días'],
  [365,'☀️ Un año agradeciendo: guardián de la memoria buena.','365 días']
];
var gratFraseOff=0;
function gratTiene(g){ return !!(g&&(g.t1||g.t2||g.t3||(g.carta&&String(g.carta).trim()))); }
function gratAnimoIco(a){ a=parseInt(a)||0; return a>=5?'😄':a===4?'🙂':a===3?'😐':a===2?'😕':a===1?'😞':''; }
function gratCatDe(id){ if(!id) return null; for(let i=0;i<GRATITUD_CATS.length;i++){ if(GRATITUD_CATS[i].id===id) return GRATITUD_CATS[i]; } return null; }
function gratSelDate(){ try{ const v=(($('gratDate')||{}).value)||''; if(/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; }catch(e){} try{ return cal.fmtKey.format(new Date()); }catch(e2){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); } }
function gratitudStreak(){
  const e=getGratitudData().entries; let s=0; const d=new Date();
  for(let i=0;i<365;i++){ const k=cal.fmtKey.format(d); if(gratTiene(e[k])){ s++; d.setDate(d.getDate()-1); } else if(i===0){ d.setDate(d.getDate()-1); continue; } else break; }
  return s;
}
function gratitudMejorRacha(){
  try{
    const keys=Object.keys(getGratitudData().entries).filter(k=>gratTiene(getGratitudData().entries[k])).sort();
    let best=0, cur=0, prev=null;
    keys.forEach(k=>{ const t=new Date(k+'T12:00:00').getTime(); if(prev!==null&&t-prev===86400000){ cur++; } else { cur=1; } if(cur>best) best=cur; prev=t; });
    return best;
  }catch(e){ return 0; }
}
function gratFraseDelDia(){
  if(!GRATITUD_FRASES.length) return '';
  const now=new Date(); const start=new Date(now.getFullYear(),0,0);
  const doy=Math.floor((now-start)/86400000);
  return GRATITUD_FRASES[(doy+gratFraseOff)%GRATITUD_FRASES.length];
}
function renderGratFrase(){
  const box=$('gratFraseBox'); if(!box) return;
  box.innerHTML='<div class="su-e84fc1"><span class="su-6cb285">💬 <i>'+escapeHtml(gratFraseDelDia())+'</i></span><button type="button" id="gratFraseNew" class="btn su-423b48">🎲 Otra</button></div>';
  const nb=$('gratFraseNew'); if(nb) nb.onclick=()=>{ gratFraseOff++; renderGratFrase(); };
}
function gratDayText(k,g){
  g=g||{};
  let t='📓 Mi gratitud · '+k+'\n';
  [1,2,3].forEach(i=>{ const p=g['t'+i]; if(!p) return; const c=gratCatDe(g['c'+i]); t+='✨ '+p+(c?' ('+c.ico+' '+c.nombre+')':'')+'\n'; });
  if(g.animo) t+='Ánimo: '+g.animo+'/5 '+gratAnimoIco(g.animo)+'\n';
  if(g.intencion) t+='🎯 Intención: '+g.intencion+'\n';
  if(g.para) t+='🤝 Gracias especiales a: '+g.para+'\n';
  if((g.carta&&String(g.carta).trim())||g.cartaPara) t+='💌 Carta'+(g.cartaPara?' para '+g.cartaPara:'')+': '+(g.carta||'')+'\n';
  return t+'— Mari Küla Küyen · Penco';
}
function gratAllText(){
  const e=getGratitudData().entries;
  const keys=Object.keys(e).filter(k=>gratTiene(e[k])).sort();
  if(!keys.length) return '📓 Mi diario de gratitud — aún sin registros';
  let t='📓 Mi diario de gratitud · '+keys.length+' días\n\n';
  keys.forEach(k=>{ t+=gratDayText(k,e[k])+'\n\n'; });
  return t+'— Mari Küla Küyen · Penco';
}
function renderGratitudBox(){
  renderGratFrase();
  const b=$('gratitudStreakBox'); if(!b) return;
  const e=getGratitudData().entries;
  const keys=Object.keys(e).filter(k=>gratTiene(e[k]));
  const n=keys.length, racha=gratitudStreak(), mejor=gratitudMejorRacha();
  let ym=''; try{ ym=cal.fmtKey.format(new Date()).slice(0,7); }catch(e2){}
  const mes=ym?keys.filter(k=>k.slice(0,7)===ym).length:0;
  let cur=null, nxt=null;
  GRATITUD_HITOS.forEach(h=>{ if(n>=h[0]) cur=h; else if(!nxt) nxt=h; });
  b.innerHTML='<div class="su-b5711a"><span class="su-5e0faa"><b>✨ Racha:</b> '+racha+' día'+(racha===1?'':'s')+'</span><span class="chip">🔥 mejor '+mejor+'</span><span class="chip">📓 '+n+' días</span><span class="chip">🗓️ '+mes+' este mes</span></div>'
    +'<p class="muted su-1db776">'+(cur?cur[1]:'Escribe tus 3 de hoy para encender la racha ✨')+(nxt?' Te faltan '+(nxt[0]-n)+' para '+nxt[2]+'.':' ¡Hito máximo alcanzado!')+'</p>';
}
function renderGratMonth(){
  const box=$('gratMonthBox'); if(!box) return;
  const sel=gratSelDate(); const y=+sel.slice(0,4), m=+sel.slice(5,7);
  if(!y||!m||m<1||m>12){ box.innerHTML=''; return; }
  const e=getGratitudData().entries;
  const dim=new Date(y,m,0).getDate();
  const lead=(new Date(y,m-1,1).getDay()+6)%7;
  const names=['L','M','M','J','V','S','D'];
  const pm=String(m).padStart(2,'0');
  let h='<b class="su-6cb285">🗓️ '+y+'-'+pm+'</b> <span class="muted su-0d5be0">toca un día ✨ para verlo</span><div class="su-5547f7">';
  h+=names.map(n2=>'<span class="muted"><b>'+n2+'</b></span>').join('');
  for(let i=0;i<lead;i++) h+='<span></span>';
  for(let d=1;d<=dim;d++){
    const k=y+'-'+pm+'-'+String(d).padStart(2,'0');
    const has=e[k]&&gratTiene(e[k]); const isSel=(k===sel);
    h+='<button type="button" data-gday="'+k+'" style="border:1px solid '+(isSel?'var(--gold)':(has?'#d8a0ff88':'rgba(128,128,128,.25)'))+';background:'+(has?'#d8a0ff22':'transparent')+';border-radius:6px;padding:3px 0;font-size:11px;cursor:pointer;color:inherit" title="'+(has?'Con gratitud ✨':'Sin registro')+'">'+d+(has?'<br>✨':'')+'</button>';
  }
  h+='</div>';
  box.innerHTML=h;
  box.querySelectorAll('[data-gday]').forEach(b2=> b2.onclick=()=>{ const dt=$('gratDate'); if(dt){ dt.value=b2.getAttribute('data-gday'); dt.onchange(); } });
}
function renderGratHistory(){
  const box=$('gratHistory'); if(!box) return;
  const e=getGratitudData().entries;
  const keys=Object.keys(e).filter(k=>gratTiene(e[k])).sort().reverse().slice(0,30);
  if(!keys.length){ box.innerHTML='<p class="muted su-e201a8">Sin registros. Escribe tus 3 de hoy.</p>'; return; }
  box.innerHTML=keys.map(k=>{
    const g=e[k];
    let lines='';
    for(let i=1;i<=3;i++){ const t=g['t'+i]; if(!t) continue; const cd=gratCatDe(g['c'+i]);
      lines+='<div>✨ '+escapeHtml(t)+(cd?' <span class="chip su-fb2957">'+cd.ico+' '+escapeHtml(cd.nombre)+'</span>':'')+'</div>'; }
    const extra=(g.intencion?'<div class="muted">🎯 '+escapeHtml(g.intencion)+'</div>':'')
      +(g.para?'<div class="muted">🤝 '+escapeHtml(g.para)+'</div>':'')
      +(((g.carta&&String(g.carta).trim())||g.cartaPara)?'<div class="muted">💌 Carta'+(g.cartaPara?' para '+escapeHtml(g.cartaPara):'')+': '+escapeHtml(String(g.carta||'').slice(0,90))+(String(g.carta||'').length>90?'…':'')+'</div>':'');
    return '<div class="hora-item su-0486f7"><span class="su-9c141b"><b><a href="#" data-gload="'+escapeHtml(k)+'" class="su-1c9c44">'+escapeHtml(k)+'</a></b>'+(g.animo?' '+gratAnimoIco(g.animo):'')+'<br>'+lines+extra+'</span><span class="su-3a76ac"><button type="button" class="btn btn-icon grat-share" data-k="'+escapeHtml(k)+'" title="Compartir">📤</button><button type="button" class="btn btn-icon grat-del" data-k="'+escapeHtml(k)+'">✕</button></span></div>';
  }).join('');
  box.querySelectorAll('[data-gload]').forEach(a=> a.onclick=ev=>{ ev.preventDefault(); const dt=$('gratDate'); if(dt){ dt.value=a.getAttribute('data-gload'); dt.onchange(); } const dlg=$('gratitudDialog'); try{ if(dlg&&dlg.scrollTo) dlg.scrollTo({top:0,behavior:'smooth'}); }catch(e2){} });
  box.querySelectorAll('.grat-del').forEach(x=> x.onclick=()=>{ if(!confirm('¿Borrar la gratitud del '+x.dataset.k+'?')) return; const gd=getGratitudData(); delete gd.entries[x.dataset.k]; scheduleSave(); gratRefreshAll(); });
  box.querySelectorAll('.grat-share').forEach(x=> x.onclick=async()=>{ const gd=getGratitudData(); const k=x.dataset.k; const txt=gratDayText(k,gd.entries[k]); try{ await shareText('📓 Mi gratitud · '+k, txt, null); }catch(e2){ try{ await navigator.clipboard.writeText(txt); alert('Copiado al portapapeles'); }catch(e3){ alert(txt); } } });
}
function gratFillForm(g){
  g=g||{};
  const set=(id,v)=>{ const x=$(id); if(x) x.value=(v==null?'':v); };
  set('grat1',g.t1); set('grat2',g.t2); set('grat3',g.t3);
  set('gratCat1',g.c1); set('gratCat2',g.c2); set('gratCat3',g.c3);
  set('gratAnimo',(g.animo==null||g.animo==='')?'':String(g.animo));
  set('gratIntencion',g.intencion); set('gratPara',g.para);
  set('gratCartaPara',g.cartaPara); set('gratCarta',g.carta);
}
function gratCollectForm(){
  const val=id=>{ const x=$(id); return x?x.value.trim():''; };
  const cat=id=>{ const x=$(id); return x?x.value:''; };
  const anRaw=val('gratAnimo'); let an='';
  if(anRaw!==''){ const p=parseInt(anRaw); if(p>=1&&p<=5) an=p; }
  return {
    t1:sanitizeText(val('grat1'),120), t2:sanitizeText(val('grat2'),120), t3:sanitizeText(val('grat3'),120),
    c1:cat('gratCat1'), c2:cat('gratCat2'), c3:cat('gratCat3'),
    animo:an,
    intencion:sanitizeText(val('gratIntencion'),120), para:sanitizeText(val('gratPara'),80),
    cartaPara:sanitizeText(val('gratCartaPara'),60), carta:sanitizeText(val('gratCarta'),600)
  };
}
function gratRefreshAll(){ renderGratitudBox(); renderGratMonth(); renderGratHistory(); try{ if(typeof currentView!=='undefined'&&currentView.tipo==='luna'&&typeof renderLuna==='function') renderLuna(); }catch(e){} }
function setupGratitudDialog(){
  ['gratCat1','gratCat2','gratCat3'].forEach(id=>{ const s=$(id); if(s&&s.options.length<=1){ GRATITUD_CATS.forEach(c=>{ const o=document.createElement('option'); o.value=c.id; o.textContent=c.ico+' '+c.nombre; s.appendChild(o); }); } });
  const loadSel=()=>{ gratFillForm(getGratitudData().entries[gratSelDate()]||{}); };
  const btn=$('btnGratitud'); if(btn) btn.onclick=()=>{
    const t=cal.fmtKey.format(new Date()); const d=$('gratDate'); if(d && !d.value) d.value=t;
    loadSel(); gratRefreshAll(); $('gratitudDialog').showModal();
  };
  const ct=$('gratitudCloseTop'), cb=$('gratitudClose'); if(ct) ct.onclick=()=>$('gratitudDialog').close(); if(cb) cb.onclick=()=>$('gratitudDialog').close();
  const dt=$('gratDate'); if(dt) dt.onchange=()=>{ loadSel(); renderGratMonth(); };
  const today=$('gratToday'); if(today) today.onclick=()=>{ const t=cal.fmtKey.format(new Date()); $('gratDate').value=t; $('gratDate').onchange(); };
  const sv=$('gratSave'); if(sv) sv.onclick=()=>{
    const k=gratSelDate();
    const gd=getGratitudData(); const data=gratCollectForm();
    const old=gd.entries[k]||{};
    if(!gratTiene(data)&&!data.intencion){ delete gd.entries[k]; scheduleSave('Día vacío: registro eliminado'); }
    else { gd.entries[k]=Object.assign({},old,data); scheduleSave('Guardado ✓'); }
    gratRefreshAll();
  };
  const sh=$('gratShare'); if(sh) sh.onclick=async()=>{
    const k=gratSelDate();
    const g=getGratitudData().entries[k];
    if(!g||!gratTiene(g)) return alert('Nada que compartir: escribe tu gratitud primero');
    const txt=gratDayText(k,g);
    try{ await shareText('📓 Mi gratitud · '+k, txt, null); }catch(e){ try{ await navigator.clipboard.writeText(txt); alert('Copiado al portapapeles'); }catch(e2){ alert(txt); } }
  };
  const ex=$('gratExport'); if(ex) ex.onclick=()=>{
    const txt=gratAllText();
    const blob=new Blob([txt],{type:'text/plain;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='gratitud-diaria.txt';
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} },800);
  };
  const cl=$('gratClearDay'); if(cl) cl.onclick=()=>{
    const k=gratSelDate();
    const gd=getGratitudData(); if(!gd.entries[k]) return alert('Ese día no tiene registro');
    if(!confirm('¿Borrar la gratitud del '+k+'?')) return;
    delete gd.entries[k]; scheduleSave('Día borrado'); gratFillForm({}); gratRefreshAll();
  };
}
setTimeout(setupGratitudDialog, 893);

// === PSICO & AUTOCONOCIMIENTO ===
const PSICO_TOPICS = [
  {id:'sombra', icon:'🌑', nombre:'Sombra (Jung)'},
  {id:'tcc', icon:'🧠', nombre:'TCC'},
  {id:'gestalt', icon:'🪑', nombre:'Gestalt'},
  {id:'tipologias', icon:'🧬', nombre:'Tipologías'},
  {id:'journaling', icon:'✍️', nombre:'Journaling'},
  {id:'estoico', icon:'🏛️', nombre:'Examen estoico'},
  {id:'mayeutica', icon:'❓', nombre:'Mayéutica'},
  {id:'cartas', icon:'💌', nombre:'Cartas no enviadas'},
  {id:'paginas', icon:'🌅', nombre:'Páginas matutinas'},
  {id:'haiku', icon:'🪶', nombre:'Haiku y poesía'},
  {id:'epitafio', icon:'🪦', nombre:'Memento mori / epitafio'},
  {id:'citas', icon:'📖', nombre:'Cuaderno de citas'},
  {id:'reescritura', icon:'🔄', nombre:'Reescritura narrativa'},
  {id:'dialogo', icon:'💭', nombre:'Diálogo de voces'},
  {id:'mindfulness', icon:'🧘', nombre:'Mindfulness'},
  {id:'atmavichara', icon:'🪞', nombre:'Atma Vichara'},
  {id:'vipassana', icon:'🌊', nombre:'Vipassana'},
  {id:'corporal', icon:'🧍', nombre:'Conciencia corporal'},
  {id:'arte', icon:'🎨', nombre:'Arte intuitivo'}
];
function psicoTopicName(id){ const t=PSICO_TOPICS.find(x=>x.id===id); return t? (t.icon+' '+t.nombre) : id; }
function getPsicoData(){ try{ const u=userData(); if(!u.psico) u.psico={entries:{}}; if(!u.psico.entries) u.psico.entries={}; return u.psico; }catch{ return {entries:{}}; } }
function psicoStreak(){
  const e=getPsicoData().entries; let s=0; const d=new Date();
  for(let i=0;i<365;i++){ const k=cal.fmtKey.format(d); const day=e[k]; const has=day && Object.values(day).some(v=>v&&v.trim()); if(has){ s++; d.setDate(d.getDate()-1); } else if(i===0){ d.setDate(d.getDate()-1); continue; } else break; }
  return s;
}
function renderPsicoBox(){
  const b=$('psicoStreakBox'); if(!b) return;
  const e=getPsicoData().entries;
  const n=Object.keys(e).filter(k=>{ const day=e[k]; return day && Object.values(day).some(v=>v&&v.trim()); }).length;
  b.innerHTML=`<b>🪞 Racha:</b> ${psicoStreak()} días seguidos · <b>${n}</b> días con práctica <span class="muted su-11a508">— relee cada luna para ver patrones</span>`;
}
function renderPsicoLog(){
  const box=$('psiLog'); if(!box) return;
  const e=getPsicoData().entries;
  const rows=[];
  Object.keys(e).sort().reverse().forEach(k=>{ const day=e[k]||{}; Object.keys(day).forEach(t=>{ if(day[t]&&day[t].trim()) rows.push({k,t,v:day[t]}); }); });
  const last=rows.slice(0,15);
  box.innerHTML = last.length? last.map((r,i)=>`<div class="hora-item su-0486f7"><span class="su-11a508"><b>${escapeHtml(r.k)}</b> · ${escapeHtml(psicoTopicName(r.t))}<br>${escapeHtml(r.v)}</span><button type="button" class="btn btn-icon psi-del" data-k="${escapeHtml(r.k)}" data-t="${escapeHtml(r.t)}">✕</button></div>`).join('')
    : '<p class="muted su-e201a8">Sin registros. Elige un tema y escribe tu ejercicio de hoy.</p>';
  box.querySelectorAll('.psi-del').forEach(x=> x.onclick=()=>{ const gd=getPsicoData(); if(gd.entries[x.dataset.k]){ delete gd.entries[x.dataset.k][x.dataset.t]; if(!Object.keys(gd.entries[x.dataset.k]).length) delete gd.entries[x.dataset.k]; } scheduleSave(); renderPsicoBox(); renderPsicoLog(); });
  const st=$('psiStats'); if(st) st.textContent = rows.length? `${rows.length} prácticas guardadas` : '';
}
function setupPsicoDialog(){
  const btn=$('btnPsico'); if(btn) btn.onclick=()=>{
    const t=cal.fmtKey.format(new Date()); const d=$('psiDate'); if(d && !d.value) d.value=t;
    renderPsicoBox(); renderPsicoLog(); $('psicoDialog').showModal();
  };
  const ct=$('psicoCloseTop'), cb=$('psicoClose'); if(ct) ct.onclick=()=>$('psicoDialog').close(); if(cb) cb.onclick=()=>$('psicoDialog').close();
  const tabs=[['tabPsi1','psicoPanel1'],['tabPsi2','psicoPanel2'],['tabPsi3','psicoPanel3'],['tabPsi4','psicoPanel4']];
  const show=i=>{ tabs.forEach(([tid,pid],j)=>{ const p=$(pid); if(p) p.classList.toggle('hidden', j!==i); const t=$(tid); if(t) t.classList.toggle('btn-accent', j===i); }); };
  tabs.forEach(([tid],i)=>{ const t=$(tid); if(t) t.onclick=()=>show(i); });
  const sv=$('psiSave'); if(sv) sv.onclick=()=>{
    const k=($('psiDate')&&$('psiDate').value)||cal.fmtKey.format(new Date());
    const topic=($('psiTopic')&&$('psiTopic').value)||'journaling';
    const txt=sanitizeText((($('psiText')||{}).value||'').trim(),500);
    if(!txt) return alert('Escribe tu ejercicio primero');
    const gd=getPsicoData(); if(!gd.entries[k]) gd.entries[k]={};
    gd.entries[k][topic]=((gd.entries[k][topic]? gd.entries[k][topic]+'\n' : '')+txt).slice(-1500);
    scheduleSave('Guardado ✓'); $('psiText').value=''; renderPsicoBox(); renderPsicoLog();
  };
  const toNote=$('psiToNote'); if(toNote) toNote.onclick=()=>{
    const topic=($('psiTopic')&&$('psiTopic').value)||'journaling';
    const txt=(($('psiText')||{}).value||'').trim() || (()=>{
      const k=($('psiDate')&&$('psiDate').value)||cal.fmtKey.format(new Date());
      const gd=getPsicoData(); return (gd.entries[k]&&gd.entries[k][topic])||'';
    })();
    if(!txt) return alert('Escribe o guarda tu ejercicio primero');
    const info=todayInfo(); if(!info) return alert('No se pudo ubicar hoy');
    const note='🪞 '+psicoTopicName(topic)+': '+txt;
    if(info.luna==='dft'){ const c=cyc(currentCycleYear()); c.dft.nota=(c.dft.nota? c.dft.nota+'\n':'')+note; }
    else { const cell=dayCell(info.luna, info.diaN); cell.nota=(cell.nota? cell.nota+'\n':'')+note; }
    scheduleSave(); if(currentView.tipo==='luna') renderLuna(); else renderDFT();
    alert('Llevado a la nota de hoy ✓');
  };
  const sh=$('psiShare'); if(sh) sh.onclick=async()=>{
    const e=getPsicoData().entries; const keys=Object.keys(e).sort().reverse().slice(0,7);
    const t=keys.length? '🪞 Mis prácticas (últimos días)\n'+keys.map(k=>{ const day=e[k]; return '• '+k+'\n'+Object.keys(day).map(topic=>'  '+psicoTopicName(topic)+': '+day[topic]).join('\n'); }).join('\n') : '🪞 Sin prácticas aún';
    await shareText('Mis prácticas', t, null);
  };
  const cl=$('psiClear'); if(cl) cl.onclick=()=>{ if(!confirm('¿Borrar todo tu registro de autoconocimiento?')) return; getPsicoData().entries={}; scheduleSave(); renderPsicoBox(); renderPsicoLog(); };
}
setTimeout(setupPsicoDialog, 895);

// === MÉTODOS & VISIONES ===
const METODOS_TOPICS = [
  {id:'estoicismo', icon:'🏛️', nombre:'Estoicismo'},
  {id:'jung', icon:'🌑', nombre:'Jung'},
  {id:'freud', icon:'🛋️', nombre:'Freud'},
  {id:'frankl', icon:'🔥', nombre:'Frankl'},
  {id:'tao', icon:'☯️', nombre:'Tao'},
  {id:'budismo', icon:'☸️', nombre:'Budismo'},
  {id:'yogananda', icon:'🕉️', nombre:'Yogananda'},
  {id:'zen', icon:'🎋', nombre:'Zen'},
  {id:'patanjali', icon:'🧘', nombre:'Patanjali'},
  {id:'ikigai', icon:'🌸', nombre:'Ikigai'},
  {id:'reiki', icon:'🤲', nombre:'Reiki'},
  {id:'toltecas', icon:'🌵', nombre:'Toltecas'},
  {id:'gurdjieff', icon:'👁️', nombre:'Gurdjieff'},
  {id:'grinberg', icon:'🧠', nombre:'Grinberg'},
  {id:'grof', icon:'🌊', nombre:'Grof'},
  {id:'hermetismo', icon:'⚗️', nombre:'Hermetismo'},
  {id:'conny', icon:'💫', nombre:'Conny Méndez'},
  {id:'gnosis', icon:'🔮', nombre:'Gnosis'},
  {id:'kimun', icon:'🌿', nombre:'Kimün mapuche'},
  {id:'hoponopono', icon:'🌺', nombre:"Ho'oponopono"}
];
function metodosTopicName(id){ const t=METODOS_TOPICS.find(x=>x.id===id); return t? (t.icon+' '+t.nombre) : id; }
function getMetodosData(){ try{ const u=userData(); if(!u.metodos) u.metodos={entries:{}}; if(!u.metodos.entries) u.metodos.entries={}; return u.metodos; }catch{ return {entries:{}}; } }
function renderMetodosLog(){
  const box=$('metLog'); if(!box) return;
  const e=getMetodosData().entries;
  const rows=[];
  Object.keys(e).sort().reverse().forEach(k=>{ const day=e[k]||{}; Object.keys(day).forEach(t=>{ if(day[t]&&day[t].trim()) rows.push({k,t,v:day[t]}); }); });
  const last=rows.slice(0,15);
  box.innerHTML = last.length? last.map(r=>`<div class="hora-item su-0486f7"><span class="su-11a508"><b>${escapeHtml(r.k)}</b> · ${escapeHtml(metodosTopicName(r.t))}<br>${escapeHtml(r.v)}</span><button type="button" class="btn btn-icon met-del" data-k="${escapeHtml(r.k)}" data-t="${escapeHtml(r.t)}">✕</button></div>`).join('')
    : '<p class="muted su-e201a8">Sin registros. Elige una visión y anota tu práctica de hoy.</p>';
  box.querySelectorAll('.met-del').forEach(x=> x.onclick=()=>{ const gd=getMetodosData(); if(gd.entries[x.dataset.k]){ delete gd.entries[x.dataset.k][x.dataset.t]; if(!Object.keys(gd.entries[x.dataset.k]).length) delete gd.entries[x.dataset.k]; } scheduleSave(); renderMetodosLog(); });
  const st=$('metStats'); if(st) st.textContent = rows.length? `${rows.length} prácticas guardadas` : '';
}
function setupMetodosDialog(){
  const btn=$('btnMetodos'); if(btn) btn.onclick=()=>{
    const t=cal.fmtKey.format(new Date()); const d=$('metDate'); if(d && !d.value) d.value=t;
    renderMetodosLog(); $('metodosDialog').showModal();
  };
  const ct=$('metodosCloseTop'), cb=$('metodosClose'); if(ct) ct.onclick=()=>$('metodosDialog').close(); if(cb) cb.onclick=()=>$('metodosDialog').close();
  const tabs=[['tabMet1','metodosPanel1'],['tabMet2','metodosPanel2'],['tabMet3','metodosPanel3']];
  const show=i=>{ tabs.forEach(([tid,pid],j)=>{ const p=$(pid); if(p) p.classList.toggle('hidden', j!==i); const t=$(tid); if(t) t.classList.toggle('btn-accent', j===i); }); };
  tabs.forEach(([tid],i)=>{ const t=$(tid); if(t) t.onclick=()=>show(i); });
  const sv=$('metSave'); if(sv) sv.onclick=()=>{
    const k=($('metDate')&&$('metDate').value)||cal.fmtKey.format(new Date());
    const topic=($('metTopic')&&$('metTopic').value)||'estoicismo';
    const txt=sanitizeText((($('metText')||{}).value||'').trim(),500);
    if(!txt) return alert('Escribe tu práctica primero');
    const gd=getMetodosData(); if(!gd.entries[k]) gd.entries[k]={};
    gd.entries[k][topic]=((gd.entries[k][topic]? gd.entries[k][topic]+'\n' : '')+txt).slice(-1500);
    scheduleSave('Guardado ✓'); $('metText').value=''; renderMetodosLog();
  };
  const sh=$('metShare'); if(sh) sh.onclick=async()=>{
    const e=getMetodosData().entries; const keys=Object.keys(e).sort().reverse().slice(0,7);
    const t=keys.length? '📿 Mi camino (últimos días)\n'+keys.map(k=>{ const day=e[k]; return '• '+k+'\n'+Object.keys(day).map(topic=>'  '+metodosTopicName(topic)+': '+day[topic]).join('\n'); }).join('\n') : '📿 Sin prácticas aún';
    await shareText('Mi camino', t, null);
  };
  const cl=$('metClear'); if(cl) cl.onclick=()=>{ if(!confirm('¿Borrar todo tu registro de métodos?')) return; getMetodosData().entries={}; scheduleSave(); renderMetodosLog(); };
}
setTimeout(setupMetodosDialog, 896);

// === LEÑA & PELLET ===
function setupLenaDialog(){
  const btn=$('btnLena'); if(btn) btn.onclick=()=>{ $('lenaDialog').showModal(); if(!$('lenaResult').innerHTML) renderLenaEmpty(); };
  const ct=$('lenaCloseTop'), cb=$('lenaClose'); if(ct) ct.onclick=()=>$('lenaDialog').close(); if(cb) cb.onclick=()=>$('lenaDialog').close();
  const c=$('lenaCalc'); if(c) c.onclick=renderLenaCalc;
}
function renderLenaEmpty(){ const b=$('lenaResult'); if(b) b.innerHTML='<span class="muted su-11a508">Ingresa cantidad y precio para comparar. Ej: 1 m³ eucalipto ≈ 450 kg seco.</span>'; }
function renderLenaCalc(){
  const box=$('lenaResult'); if(!box) return;
  const tipo=$('lenaTipo').value, cant=parseFloat($('lenaCant').value)||0, uni=$('lenaUnidad').value, precio=parseFloat($('lenaPrecio').value)||0;
  if(!cant){ box.innerHTML='Ingresa una cantidad válida.'; return; }
  const KWH={ eucalipto:4.5, pino:4.0, humeda:2.6, pellet:4.8, parafina:9.8 };
  const KG={ kg:1, m3:450, bolsa:15, litro:0.8 };
  const NOM={ eucalipto:'Eucalipto seco', pino:'Pino/Aromo seco', humeda:'Leña húmeda', pellet:'Pellet', parafina:'Parafina' };
  const kg=cant*(KG[uni]||1);
  const kwh=kg*(KWH[tipo]||4);
  const perKwh=precio>0&&kwh>0? ` · <b>$${Math.round(precio/kwh)}/kWh</b>` : '';
  const dias=kwh>0? ` ≈ calefacción de una casa Penco chica por <b>${(kwh/25).toFixed(1)} días</b> (25 kWh/día invierno)` : '';
  const warn=tipo==='humeda'? `<br><span class="su-23dd39">⚠️ Húmeda rinde ~40% menos y satura el aire (ver 🌬️ Aire). Seca 6+ meses bajo techo.</span>` : tipo==='parafina'? `<br><span class="muted su-11a508">Ventila siempre con parafina, nunca durmiendo.</span>` : '';
  box.innerHTML=`<b>${escapeHtml(NOM[tipo])}</b> ${cant} ${escapeHtml(uni)} ≈ <b>${Math.round(kwh)} kWh</b>${perKwh}${dias}${warn}<br><span class="muted su-11a508">Ref: 1 m³ estéreo ≈ 450 kg seco · pellet 15 kg ≈ 72 kWh · compara $/kWh antes de comprar.</span>`;
}
setTimeout(setupLenaDialog, 894);

// === CICLO CIRCADIANO ===
const CIRCADIAN_PHASES = [
  { h0:5, h1:8, label:"Despertar", icon:"🌅", desc:"Cortisol alto", tip:"Luz natural, estirar, agua" },
  { h0:8, h1:12, label:"Mañana", icon:"☀️", desc:"Pico mental", tip:"Foco y decisiones" },
  { h0:12, h1:15, label:"Mediodía", icon:"🍽️", desc:"Digestión", tip:"Comida ligera, caminata" },
  { h0:15, h1:19, label:"Tarde", icon:"🌿", desc:"Creativa", tip:"Movimiento y siembra" },
  { h0:19, h1:22, label:"Anochecer", icon:"🌙", desc:"Melatonina", tip:"Luz cálida, ritual" },
  { h0:22, h1:29, label:"Noche", icon:"😴", desc:"Sueño", tip:"Oscuridad total" }
];
function getCircadianPhase(hour){
  for(let i=0;i<CIRCADIAN_PHASES.length;i++){ const p=CIRCADIAN_PHASES[i]; if(hour>=p.h0 && hour<p.h1) return i; }
  return 5;
}
function renderCircadianChart(activeIdx){
  const c=$('circadianChart'); if(!c) return;
  const dpr=window.devicePixelRatio||1, w=480, h=160;
  c.width=w*dpr; c.height=h*dpr; c.style.width='100%';
  const ctx=c.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h); ctx.fillStyle='#161e3f'; ctx.fillRect(0,0,w,h);
  const pad={l:24,r:10,t:10,b:20}, pw=w-pad.l-pad.r, ph=h-pad.t-pad.b;
  const colors=['#e8c56a','#f0d488','#7ab8ff','#a9d18e','#8a6fd8','#1a1a2e'];
  CIRCADIAN_PHASES.forEach((p,i)=>{
    const x0=pad.l+pw*(p.h0/24), x1=pad.l+pw*(Math.min(p.h1,24)/24);
    ctx.fillStyle=colors[i]+'33'; ctx.fillRect(x0,pad.t,x1-x0,ph);
    ctx.fillStyle=colors[i]; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(p.icon, (x0+x1)/2, pad.t+12);
  });
  // eje horas
  ctx.strokeStyle='#2a3565'; ctx.lineWidth=0.6;
  for(let hr=0;hr<=24;hr+=3){ const x=pad.l+pw*hr/24; ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,h-pad.b); ctx.stroke(); ctx.fillStyle='#9aa3c7'; ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.fillText(hr%24+':00', x, h-6); }
  // marcador ahora
  const nowH = (()=>{ const p=cal.santiagoParts(Date.now()); return parseInt(p.hh)+parseInt(new Date().toLocaleString('en-US',{timeZone:'America/Santiago',minute:'2-digit',hour12:false}).split(':')[1]||0)/60; })();
  const hourNow = (()=>{ try{ const parts=cal.santiagoParts(Date.now()); const mm=new Date().toLocaleString('en-GB',{timeZone:'America/Santiago',minute:'2-digit',hour12:false}).split(':')[1]; return parseInt(parts.hh)+(parseInt(mm)||0)/60; }catch{ return new Date().getHours(); }})();
  const hx=pad.l+pw*(hourNow%24)/24;
  ctx.strokeStyle='#e8c56a'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(hx,pad.t); ctx.lineTo(hx,h-pad.b); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle='#e8c56a'; ctx.beginPath(); ctx.arc(hx,pad.t+ph/2,4,0,Math.PI*2); ctx.fill();
  if(typeof activeIdx==='number'){
    const p=CIRCADIAN_PHASES[activeIdx];
    const x0=pad.l+pw*p.h0/24, x1=pad.l+pw*Math.min(p.h1,24)/24;
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.2; ctx.strokeRect(x0,pad.t,x1-x0,ph);
  }
}
function renderCircadianDialog(){
  const nowHour = (()=>{ const p=cal.santiagoParts(Date.now()); const d=new Date().toLocaleString('en-GB',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hour12:false}); const [hh,mm]=d.split(':').map(Number); return hh+mm/60; })();
  const idx=getCircadianPhase(nowHour);
  const nowBox=$('circadianNowBox');
  if(nowBox){
    const p=CIRCADIAN_PHASES[idx];
    const timeStr=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit'}).format(new Date());
    nowBox.innerHTML=`<div class="su-13313b"><span class="su-de0080"><b>${p.icon} ${p.label}</b> · ${p.desc}</span><span class="chip">${timeStr} · Penco</span></div><p class="muted su-fe7b49">${p.tip} — Hora local America/Santiago.</p>`;
  }
  const grid=$('circadianPhases');
  if(grid){
    grid.innerHTML=CIRCADIAN_PHASES.map((p,i)=>`<div class="circadian-phase ${i===idx?'active':''}"><b>${p.icon} ${p.label}</b><span>${String(p.h0).padStart(2,'0')}:00–${String(p.h1%24).padStart(2,'0')}:00</span><span>${p.desc}</span></div>`).join('');
  }
  renderCircadianChart(idx);
}
function ritmoTab(t){
  const plan=(t==='plan');
  const pa=$('ritmoAhoraPanel'), pp=$('ritmoPlanPanel');
  if(pa) pa.classList.toggle('hidden',plan);
  if(pp) pp.classList.toggle('hidden',!plan);
  const ta=$('tabRitmoAhora'), tp=$('tabRitmoPlan');
  if(ta) ta.classList.toggle('btn-accent',!plan);
  if(tp) tp.classList.toggle('btn-accent',plan);
  if(!plan){ renderCircadianDialog(); setTimeout(()=> renderCircadianChart(getCircadianPhase((()=>{ const d=new Date().toLocaleString('en-GB',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hour12:false}); const [hh,mm]=d.split(':').map(Number); return hh+mm/60; })())),100); }
}
function setupCircadianDialog(){
  const btn=$('btnCircadian'); if(btn) btn.onclick=()=>{ ritmoTab('ahora'); renderCircadianDialog(); $('circadianDialog').showModal(); setTimeout(()=> renderCircadianChart(getCircadianPhase((()=>{ const d=new Date().toLocaleString('en-GB',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hour12:false}); const [hh,mm]=d.split(':').map(Number); return hh+mm/60; })())),100); };
  const ta=$('tabRitmoAhora'), tp=$('tabRitmoPlan');
  if(ta && !ta.dataset.bound){ ta.dataset.bound='1'; ta.addEventListener('click',()=>ritmoTab('ahora')); }
  if(tp && !tp.dataset.bound){ tp.dataset.bound='1'; tp.addEventListener('click',()=>ritmoTab('plan')); }
  const ct=$('circadianCloseTop'), cb=$('circadianClose'); if(ct) ct.onclick=()=>$('circadianDialog').close(); if(cb) cb.onclick=()=>$('circadianDialog').close();
  // API global: abrirRitmoCircadiano('ahora'|'plan') — usada por puentes (adolescencia, etapas)
  try{
    window.abrirRitmoCircadiano=function(t){
      ritmoTab(t||'ahora');
      renderCircadianDialog();
      const d=$('circadianDialog');
      try{ if(d && !d.open) d.showModal(); }catch(e){ try{ d.showModal(); }catch(e2){} }
      if((t||'ahora')==='plan'){ const r=$('tabRitmoPlan'); if(r) r.click(); }
    };
  }catch(e){}
}
setTimeout(setupCircadianDialog, 860);

// === HORA DORADA ===
function formatGoldenTime(ms){
  if(!ms) return '—';
  return new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ms));
}
function getGoldenForDay(noonMs){
  const sun=cal.sunForDay(noonMs);
  if(!sun.rise||!sun.set) return null;
  const rise=sun.rise, set=sun.set;
  return {
    rise, set,
    goldenAM: [rise-15*60000, rise+60*60000],
    goldenPM: [set-60*60000, set+15*60000],
    blueAM: [rise-30*60000, rise],
    bluePM: [set, set+30*60000]
  };
}
function renderGoldenDialog(){
  const todayBox=$('goldenTodayBox'), weekBox=$('goldenWeekBox');
  const nowMs=Date.now();
  const todayNoon=Date.UTC(cal.santiagoParts(nowMs).y, cal.santiagoParts(nowMs).m-1, cal.santiagoParts(nowMs).d, 12);
  const gToday=getGoldenForDay(todayNoon);
  if(todayBox){
    if(!gToday) todayBox.innerHTML='<p class="muted">Sin datos solares para hoy.</p>';
    else {
      const isGolden = (nowMs>=gToday.goldenAM[0]&&nowMs<=gToday.goldenAM[1])||(nowMs>=gToday.goldenPM[0]&&nowMs<=gToday.goldenPM[1]);
      todayBox.innerHTML=`<h4 class="su-e39eba">Hoy — ${cal.weekdayName(todayNoon)} ${cal.fmtFull.format(new Date(todayNoon))} ${isGolden?'<span class="chip su-6e455f">¡Ahora es hora dorada!</span>':''}</h4>
        <div class="golden-table su-4c8bdb">
          <div class="su-173e4f"><b>🌅 Salida</b><br>${formatGoldenTime(gToday.rise)}<br><span class="muted su-11a508">Dorado: ${formatGoldenTime(gToday.goldenAM[0])}–${formatGoldenTime(gToday.goldenAM[1])}</span></div>
          <div class="su-173e4f"><b>🌇 Puesta</b><br>${formatGoldenTime(gToday.set)}<br><span class="muted su-11a508">Dorado: ${formatGoldenTime(gToday.goldenPM[0])}–${formatGoldenTime(gToday.goldenPM[1])}</span></div>
        </div>
        <p class="muted su-e13d76">Azul mañana ${formatGoldenTime(gToday.blueAM[0])}–${formatGoldenTime(gToday.blueAM[1])} · Azul tarde ${formatGoldenTime(gToday.bluePM[0])}–${formatGoldenTime(gToday.bluePM[1])}</p>`;
    }
  }
  if(weekBox){
    let html='<h4 class="su-a80552">Próximos 7 días</h4><table class="golden-table"><tr><th>Día</th><th>Salida</th><th>Dorado AM</th><th>Puesta</th><th>Dorado PM</th></tr>';
    for(let i=0;i<7;i++){
      const noon=todayNoon+i*86400000;
      const g=getGoldenForDay(noon);
      const isToday=i===0;
      html+=`<tr style="${isToday?'background:var(--card)':''}"><td>${cal.weekdayName(noon).slice(0,3)} ${cal.fmtDate.format(new Date(noon))}</td><td>${g?formatGoldenTime(g.rise):'—'}</td><td>${g?formatGoldenTime(g.goldenAM[0])+'–'+formatGoldenTime(g.goldenAM[1]):'—'}</td><td>${g?formatGoldenTime(g.set):'—'}</td><td>${g?formatGoldenTime(g.goldenPM[0])+'–'+formatGoldenTime(g.goldenPM[1]):'—'}</td></tr>`;
    }
    html+='</table>';
    weekBox.innerHTML=html;
  }
}
function setupGoldenDialog(){
  const btn=$('btnGolden'); if(btn) btn.onclick=()=>{ renderGoldenDialog(); $('goldenDialog').showModal(); };
  const ct=$('goldenCloseTop'), cb=$('goldenClose'); if(ct) ct.onclick=()=>$('goldenDialog').close(); if(cb) cb.onclick=()=>$('goldenDialog').close();
}
setTimeout(setupGoldenDialog, 870);

// === PRÁCTICAS ESPIRITUALES: sol, agua, tierra, noche e interior ===
const ESP_CATS = { luz:'🌅 Luz', agua:'💧 Agua', tierra:'🦶 Tierra', noche:'🌙 Noche', respiro:'🌬️ Respiro', interior:'🕯️ Interior' };
const ESP_PRACTICES = [
  { id:'amanecer', cat:'luz', icon:'🌅', nombre:'Sol de amanecer', sub:'luz suave que despierta cortisol bueno', nivel:'Principiante', tiempo:'2–10 min', horario:'Salida del sol ±60 min', mats:'Solo tu cuerpo · opcional manta, cuaderno', cuidado:'Nunca mires fijo al sol. Mira al horizonte, parpadea normal. Si arde o mareas, cierra ojos y sombra.', benef:'Energía estable, ánimo y horario de sueño.',
    pasos:['Sal en los primeros 60 min tras la salida (ver hora de hoy arriba).','Párate o siéntate mirando al horizonte, no al disco directo.','Respira por nariz 4 tiempos inhala / 6 exhala, hombros sueltos.','Quédate 2 min (día 1–3), sube a 5–10 min en 2 semanas.','Termina con 3 respiraciones profundas + vaso de agua.'] , mins:5 },
  { id:'atardecer', cat:'luz', icon:'🌇', nombre:'Sol de atardecer', sub:'luz cálida que baja revoluciones', nivel:'Principiante', tiempo:'5–15 min', horario:'Puesta del sol −60 min', mats:'Manta o silla · cuaderno · ropa abrigada', cuidado:'Mismo que amanecer: sin fijar vista, sin lentes de sol oscuros puestos. Abrígate, Penco enfría rápido.', benef:'Cierre del día, calma y gratitud.',
    pasos:['Sal 30–60 min antes de la puesta (ver hora de hoy).','Camina lento 5 min o siéntate orientado al oeste.','Suelta hombros, mandíbula y manos; mira el cielo/horizonte.','Agradece en voz baja 3 cosas del día.','Al ocultarse, quédate 2 min en silencio y entra a luz tenue.'], mins:10 },
  { id:'agua', cat:'agua', icon:'💧', nombre:'Agua cargada con sol', sub:'agua solarizada en vidrio + pausa consciente', nivel:'Principiante', tiempo:'30 min – 4 h de sol + beber', horario:'10:00–14:00 para carga profunda', mats:'Botella vidrio transparente/azul 1L + tapa · agua potable', cuidado:'Vidrio sí, plástico al sol no. Lavar diario, beber en 24 h. No reemplaza potabilizar si el agua no es segura.', benef:'Hidratación con ritual, pausa a mediodía.',
    pasos:['Llena la botella de vidrio ¾ con agua potable.','Tapa sin apretar del todo.','Rápido: 30–60 min al sol de mañana. Profundo: 3–4 h (10–14h).','Entra la botella, deja entibiar a la sombra.','Bebe 1–2 vasos con pausa y respiración; resto en el día.'], mins:2 },
  { id:'ducha', cat:'agua', icon:'🧊', nombre:'Ducha fría consciente', sub:'cierre frío de 15 seg a 3 min', nivel:'Intermedio', tiempo:'15 seg – 3 min frío', horario:'Mañana (despierta) o post-ejercicio', mats:'Ducha · toalla a mano · pieza temperada', cuidado:'Evita si hipertensión descompensada, corazón, embarazo, fiebre o mareos. Nunca cabeza brusco al inicio ni apnea larga.', benef:'Despierta, voluntad y calor interno.',
    pasos:['Dúchate tibio normal primero.','Al final abre fría: piernas 15 seg → brazos 15 seg → pecho 15 seg.','Respira por nariz, exhala largo, no bloquees aire.','Semana 1: 15–30 seg. Suma 15 seg/semana hasta 1–3 min.','Seca enérgico, abrígate y mueve hombros 1 min.'], mins:2 },
  { id:'grounding', cat:'tierra', icon:'🦶', nombre:'Grounding / Earthing', sub:'pies descalzos en tierra', nivel:'Principiante', tiempo:'10–20 min', horario:'Mañana o atardecer, tierra seca/sombra', mats:'Pies descalzos · toalla · bolsa basura (lleva tu basura)', cuidado:'Playa solo con bajamar y sin oleaje; roca resbalosa con zapatilla si dudas. Heridas en pies, vidrios o frío extremo: usa pasto limpio o pospón.', benef:'Enraizar, soltar mente acelerada.',
    pasos:['Elige arena húmeda, pasto, tierra de huerta o roca seca segura.','Sácate zapatos/calcetines, pisa 1 min sintiendo textura y temperatura.','Camina lento o párate 10–20 min respirando 4/6.','Si mente corre, nombra 5 cosas que sientes en pies.','Limpia pies, anota cómo quedó tu energía (1–10).'], mins:15 },
  { id:'luzroja', cat:'noche', icon:'🔴', nombre:'Luz roja de noche', sub:'higiene lumínica para melatonina', nivel:'Principiante', tiempo:'Toda la tarde-noche', horario:'Desde 20:30 hasta dormir', mats:'Ampolleta roja/ámbar E27 5–7W + velador · modo noche celu', cuidado:'La roja también se apaga al dormir: oscuridad total. Si trabajas de noche o usas pantallas, baja brillo al mínimo.', benef:'Sueño profundo, descanso real.',
    pasos:['Cambia el velador a ampolleta roja/ámbar 5–7W.','Desde las 20:30 apaga blancos/techo, deja solo roja.','Pon celu/PC en modo noche + brillo mínimo.','Cena liviana 2–3 h antes, lectura o ritual luna.','Al acostarte apaga todo: fresco, oscuro y silencioso.'], mins:5 },
  { id:'respiracion', cat:'respiro', icon:'🌬️', nombre:'Respiración al sol', sub:'4/6 frente a la mañana', nivel:'Principiante', tiempo:'4 ciclos (3–5 min)', horario:'Junto al sol de amanecer', mats:'Nada · opcional usa 🌬️ Respiración guiada', cuidado:'Sentado si te mareas. Si hiperventilas, vuelve a respiración normal.', benef:'Calma inmediata, foco.',
    pasos:['Siéntate con espalda recta frente a la luz suave.','Inhala 4 tiempos por nariz.','Exhala 6 tiempos por boca entreabierta.','Repite 4 ciclos (puedes usar el temporizador 5 min).','Abre ojos lento, mira el horizonte 30 seg.'], mins:5 },
  { id:'luna', cat:'noche', icon:'🌙', nombre:'Contemplación lunar', sub:'cierre nocturno 5 min', nivel:'Principiante', tiempo:'3–5 min', horario:'Noche con luna visible', mats:'Manta · vela opcional · diario', cuidado:'Abrígate; no uses flash ni mires con prismáticos al sol de día. Solo contemplación.', benef:'Soltar el día, gratitud, sueño.',
    pasos:['Sal o asómate donde veas la luna/cielo.','3 respiraciones 4/6 mirando la luna.','Relee tu nota del día en voz baja.','Escribe 1 línea: qué suelto / qué agradezco.','Apaga pantallas y entra a oscuridad.'], mins:5 },
  { id:'silencio', cat:'interior', icon:'🧘', nombre:'Silencio 5 min', sub:'meditación sin app', nivel:'Todos', tiempo:'5 min', horario:'Amanecer o antes de dormir', mats:'Cojín/manta · temporizador de aquí', cuidado:'Si ansiedad fuerte, abre ojos y mira un punto fijo. 5 min basta.', benef:'Mente quieta, presencia.',
    pasos:['Siéntate cómodo, espalda recta, manos en piernas.','Pon el temporizador en 5 min y cierra ojos.','Cuenta exhalaciones 1–10 y vuelve a 1.','Si te pierdes, vuelve amable al conteo.','Al sonar, abre ojos lento + 3 respiraciones.'], mins:5 },
  { id:'gratitud', cat:'interior', icon:'🙏', nombre:'Gratitud 3 líneas', sub:'cambia el foco en 3 min', nivel:'Todos', tiempo:'3 min', horario:'Mañana o noche', mats:'Cuaderno “sol/luna” + lápiz', cuidado:'Sin exigencia: si un día cuesta, escribe algo mínimo (agua, techo, respiro).', benef:'Ánimo, resiliencia y vínculo.',
    pasos:['Abre tu cuaderno y fecha hoy.','Escribe 3 líneas: “Gracias por… porque…”.','Lee una en voz alta y pon mano en pecho 10 seg.','Si hay un día difícil, agrega: “hoy me sostuvo…”.','Guarda el cuaderno a la vista para mañana.'], mins:3 },
  { id:'hoponopono', cat:'interior', icon:'🌺', nombre:'Ho’oponopono 2 min', sub:'lo siento · perdóname · gracias · te amo', nivel:'Todos', tiempo:'2–5 min', horario:'Cuando haya roce o culpa', mats:'Nada · opcional módulo 🌺 Ho’oponopono', cuidado:'No es terapia: si hay violencia o crisis, pide apoyo (ver Apoyo). Respira si se mueve emoción fuerte.', benef:'Perdón, soltar carga.',
    pasos:['Piensa en la situación/persona sin engancharte.','Repite lento 4 frases: lo siento, perdóname, gracias, te amo (x3).','Respira 4/6 entre cada ronda.','Termina con: “suelto lo que no controlo”.','Marca ✅ y sigue tu día liviano.'], mins:2 },
  { id:'intencion', cat:'interior', icon:'🕯️', nombre:'Oración / Intención', sub:'1 frase que ordena el día', nivel:'Todos', tiempo:'2 min', horario:'Al despertar o al encender vela', mats:'Vela opcional · tu fe o palabras propias', cuidado:'A tu manera: rezo, epew, misa, nguillatun o silencio. Sin dogma.', benef:'Sentido, protección, foco.',
    pasos:['Párate frente a luz/ventana o enciende vela.','Di tu frase (ej: “hoy actúo con calma y coraje”).','Repite 3 veces lento, mano al corazón.','Pide por 1 persona que lo necesite.','Sopla/apaga y parte el día.'], mins:2 },
  { id:'decreto', cat:'interior', icon:'✨', nombre:'Decreto y visualización', sub:'ordena mente + cuerpo', nivel:'Intermedio', tiempo:'5 min', horario:'Mañana con sol suave', mats:'Espejo o cuaderno · temporizador', cuidado:'Lenguaje en positivo y presente. Si afirmación te tensa, bájale: “avanzo un paso”.', benef:'Autoestima, dirección.',
    pasos:['Elige 1 decreto (ej: “soy calma que actúa”).','Mírate o escríbelo 3 veces.','Visualiza 60 seg: tú haciendo eso hoy.','Respira 4/6 y sonríe leve 30 seg.','Cierra: “hecho está, actúo ahora”.'], mins:5 }
];
let ESP_FILTER = { q:'', cat:'todas', nivel:'todos' };
function getEspiritualData(){
  const u=userData();
  if(!u.espiritual) u.espiritual={ done:{}, notes:{}, custom:[] };
  if(!u.espiritual.done) u.espiritual.done={};
  if(!u.espiritual.notes) u.espiritual.notes={};
  if(!Array.isArray(u.espiritual.custom)) u.espiritual.custom=[];
  return u.espiritual;
}
function getAllEspPractices(){
  try{ return ESP_PRACTICES.concat(getEspiritualData().custom||[]); }catch(e){ return ESP_PRACTICES; }
}
function renderEspTimerOptions(){
  const sel=$('espTimerPractice'); if(!sel) return;
  const cur=sel.value;
  const all=getAllEspPractices();
  sel.innerHTML=all.map(p=>`<option value="${p.id}">${p.icon} ${escapeHtml(p.nombre)}</option>`).join('');
  if(all.some(p=>p.id===cur)) sel.value=cur;
  const mm=$('espTimerMinutes');
  const f=all.find(x=>x.id===sel.value);
  if(f&&mm){ mm.value=String(f.mins||5); }
}
function espCustomDel(pid){
  try{
    const d=getEspiritualData();
    d.custom=(d.custom||[]).filter(x=>x.id!==pid);
    Object.keys(d.done||{}).forEach(k=>{ if(d.done[k]&&d.done[k][pid]) delete d.done[k][pid]; });
    scheduleSave('Práctica borrada');
    renderEspTimerOptions(); renderEspiritualTodayBox(); renderEspiritualCards(); renderEspTodayChecks(); renderEspStats(); renderEspLog();
  }catch(e){}
}
function espTodayKey(){ try{ return cal.fmtKey.format(new Date()); }catch(e){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); } }
function espSunToday(){
  try{
    const nowMs=Date.now();
    const p=cal.santiagoParts(nowMs);
    const noon=Date.UTC(p.y, p.m-1, p.d, 12);
    const sun=cal.sunForDay(noon);
    const f=ms=> ms? new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ms)) : '—';
    return { rise:sun.rise, set:sun.set, riseT:f(sun.rise), setT:f(sun.set) };
  }catch(e){ return { rise:null, set:null, riseT:'—', setT:'—' }; }
}
function espSuggestToday(){
  try{
    const h=new Date().getHours();
    const k=espTodayKey(); const d=getEspiritualData();
    const cur=(d.done[k]&&typeof d.done[k]==='object')? d.done[k] : {};
    const all=getAllEspPractices();
    let pool=[];
    if(h<9) pool=['amanecer','respiracion','intencion','gratitud','ducha'];
    else if(h<12) pool=['agua','grounding','respiracion','decreto'];
    else if(h<18) pool=['agua','grounding','hoponopono','silencio'];
    else if(h<20) pool=['atardecer','gratitud','hoponopono'];
    else pool=['luna','luzroja','silencio','gratitud'];
    pool=pool.filter(id=>!cur[id]);
    if(!pool.length) pool=all.filter(p=>!cur[p.id]).map(p=>p.id);
    if(!pool.length) pool=all.map(p=>p.id);
    const pick=pool[Math.floor(Date.now()/86400000)%pool.length]||pool[0];
    return all.find(p=>p.id===pick)||all[0];
  }catch(e){ const a=getAllEspPractices(); return a[0]; }
}
function espFilteredPractices(){
  const all=getAllEspPractices();
  const q=(ESP_FILTER.q||'').toLowerCase().trim();
  return all.filter(p=>{
    if(ESP_FILTER.cat!=='todas' && (p.cat||'interior')!==ESP_FILTER.cat) return false;
    if(ESP_FILTER.nivel!=='todos' && (p.nivel||'Todos')!==ESP_FILTER.nivel) return false;
    if(!q) return true;
    return ((p.nombre||'')+' '+(p.sub||'')+' '+(p.benef||'')+' '+(ESP_CATS[p.cat]||'')).toLowerCase().includes(q);
  });
}
function renderEspiritualTodayBox(){
  const box=$('espiritualTodayBox'); if(!box) return;
  const s=espSunToday();
  const k=espTodayKey();
  const d=getEspiritualData();
  const doneToday=(d.done[k]&&typeof d.done[k]==='object')? Object.keys(d.done[k]).filter(pid=>d.done[k][pid]).length : 0;
  const totalP=getAllEspPractices().length||13;
  const pct=Math.min(100, Math.round(doneToday/Math.max(1,totalP)*100));
  const sug=espSuggestToday();
  const nowStr=new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit'}).format(new Date());
  box.innerHTML=`<div class="su-24ce67"><span class="su-de0080"><b>☀️ Hoy Penco</b> · salida <b>${s.riseT}</b> · puesta <b>${s.setT}</b></span><span class="chip">${nowStr} · ${doneToday}/${totalP} hoy</span></div>
  <div class="esp-progress"><div class="esp-progress-fill" style="width:${pct}%"></div></div>
  <p class="muted su-fe7b49">🌅 Amanecer ideal: <b>${s.riseT} → +60 min</b> · 🌇 Atardecer ideal: <b>−60 min → ${s.setT}</b> · 💧 Agua: 10:00–14:00 · 🔴 Roja desde 20:30.</p>
  ${sug?`<div class="esp-suggest">✨ <b>Sugerida ahora:</b> ${sug.icon} <b>${escapeHtml(sug.nombre)}</b> <span class="muted">· ${escapeHtml(sug.tiempo)}</span> <button type="button" class="btn btn-accent esp-suggest-go su-8d836b" data-id="${sug.id}">▶ Empezar ${sug.mins||5} min</button></div>`:''}`;
  const go=box.querySelector('.esp-suggest-go');
  if(go) go.onclick=()=>{
    const sel=$('espTimerPractice'); if(sel) sel.value=go.dataset.id;
    const f=getAllEspPractices().find(x=>x.id===go.dataset.id);
    const mm=$('espTimerMinutes'); if(mm&&f) mm.value=String(f.mins||5);
    espTimerReset(); espTimerStart();
    const dd=$('espTimerDisplay'); if(dd) dd.scrollIntoView({behavior:'smooth', block:'center'});
  };
}
function renderEspiritualCards(){
  const box=$('espiritualCards'); if(!box) return;
  const s=espSunToday();
  const k=espTodayKey(); const dd=getEspiritualData();
  const curDone=(dd.done[k]&&typeof dd.done[k]==='object')? dd.done[k] : {};
  const horaTxt={ amanecer:`${s.riseT} → +60 min`, atardecer:`−60 min → ${s.setT}`, agua:'10:00–14:00', ducha:'mañana', grounding:'mañana/tarde', luzroja:'20:30 → dormir', respiracion:`con amanecer ${s.riseT}`, luna:'noche', silencio:'amanecer/noche', gratitud:'mañana/noche 3 min', hoponopono:'cuando lo necesites', intencion:'al despertar', decreto:'mañana' };
  const all=espFilteredPractices();
  const totalAll=getAllEspPractices().length;
  if(!all.length){ box.innerHTML='<p class="muted su-8fd210">Sin resultados. Prueba otra palabra o limpia los filtros. <button type="button" class="btn su-337714" id="espClearF">Limpiar filtros</button></p>'; const cf=$('espClearF'); if(cf) cf.onclick=()=>{ ESP_FILTER={q:'',cat:'todas',nivel:'todos'}; renderEspFilters(); renderEspiritualCards(); }; return; }
  box.innerHTML=`<p class="muted su-41ad1d">Mostrando <b>${all.length}/${totalAll}</b> · toca el título para abrir/cerrar · 🔥 = racha de días seguidos</p>`+all.map(p=>{
    const st=espStreak(p.id); const done=!!curDone[p.id];
    const catLbl=ESP_CATS[p.cat]||'🕯️ Interior';
    return `
    <details class="esp-card" ${done?'':''}>
      <summary class="esp-card-head"><span class="esp-icon">${p.icon}</span>
        <div class="esp-titles"><div class="esp-name">${escapeHtml(p.nombre)} ${done?'<span class="chip su-0d5be0">✅ hoy</span>':''} ${st>1?`<span class="chip su-a612bd">🔥${st}</span>`:''}</div><div class="esp-sub">${escapeHtml(p.sub)}</div><div class="esp-cat">${catLbl} · ${escapeHtml(p.nivel)} · ⏱ ${escapeHtml(p.tiempo)}</div></div>
        <span class="chip esp-level">${escapeHtml(p.nivel)}</span>
      </summary>
      <div class="esp-body">
        <div class="esp-meta"><span class="esp-pill gold">⏱ ${escapeHtml(p.tiempo)}</span><span class="esp-pill green">🕐 ${escapeHtml(horaTxt[p.id]||p.horario)}</span><span class="esp-pill">🎒 ${escapeHtml(p.mats)}</span>${p.benef?`<span class="esp-pill su-8fb65a">💛 ${escapeHtml(p.benef)}</span>`:''}</div>
        <ol class="esp-steps">${(p.pasos||[]).map(st2=>`<li>${escapeHtml(st2)}</li>`).join('')}</ol>
        <p class="esp-pill red su-116966">⚠️ ${escapeHtml(p.cuidado)}</p>
        <div class="esp-actions">
          <button type="button" class="btn ${done?'':'btn-accent'} esp-done su-337714" data-id="${p.id}">${done?'✅ Hecha hoy (quitar)':'✅ Hice esta hoy'}</button>
          <button type="button" class="btn esp-timer su-337714" data-id="${p.id}" data-mins="${p.mins}">⏱ ${p.mins} min</button>
          <button type="button" class="btn esp-agendar su-337714" data-id="${p.id}">🕐 Agendar</button>
          ${p.custom?`<button type="button" class="btn esp-del su-fd834a" data-id="${p.id}">✕ Borrar</button>`:''}
        </div>
      </div>
    </details>`;
  }).join('');
  box.querySelectorAll('.esp-done').forEach(b=> b.onclick=(ev)=>{ ev.preventDefault(); const id=b.dataset.id; const d2=getEspiritualData(); const kk=espTodayKey(); const isD=!!(d2.done[kk]&&d2.done[kk][id]); espMarkDone(id, !isD); });
  box.querySelectorAll('.esp-timer').forEach(b=> b.onclick=()=>{
    const sel=$('espTimerPractice'); if(sel) sel.value=b.dataset.id;
    const mm=$('espTimerMinutes'); if(mm) mm.value=String(b.dataset.mins);
    espTimerReset(); espTimerStart();
    document.getElementById('espTimerDisplay').scrollIntoView({behavior:'smooth', block:'center'});
  });
  box.querySelectorAll('.esp-agendar').forEach(b=> b.onclick=()=> espAgendar(b.dataset.id));
  box.querySelectorAll('.esp-del').forEach(b=> b.onclick=()=>{ if(!confirm('¿Borrar tu práctica?')) return; espCustomDel(b.dataset.id); });
}
function renderEspFilters(){
  const q=$('espSearch'), c=$('espFilterCat'), n=$('espFilterNivel');
  if(q && q.value!==(ESP_FILTER.q||'')) q.value=ESP_FILTER.q||'';
  if(c) c.value=ESP_FILTER.cat||'todas';
  if(n) n.value=ESP_FILTER.nivel||'todos';
}
function espMarkDone(pid, val){
  const k=espTodayKey(); const d=getEspiritualData();
  if(!d.done[k]||typeof d.done[k]!=='object') d.done[k]={};
  d.done[k][pid]= val===undefined ? !d.done[k][pid] : !!val;
  scheduleSave('Guardado ✓');
  renderEspiritualTodayBox(); renderEspTodayChecks(); renderEspStats(); renderEspLog();
  try{ if(currentView&&currentView.tipo==='luna') renderLuna(); }catch(e){}
}
function renderEspTodayChecks(){
  const box=$('espTodayChecks'); if(!box) return;
  const k=espTodayKey(); const d=getEspiritualData();
  const cur=(d.done[k]&&typeof d.done[k]==='object')? d.done[k] : {};
  const note=(d.notes[k]&&d.notes[k].t)||'';
  box.innerHTML=`<h4>✅ Hoy ${k} — toca para marcar</h4>
    <div class="esp-check-grid">${getAllEspPractices().map(p=>`<label class="esp-check ${cur[p.id]?'done':''}"><input type="checkbox" data-id="${p.id}" ${cur[p.id]?'checked':''}> ${p.icon} ${escapeHtml(p.nombre)}</label>`).join('')}</div>
    ${note?`<p class="muted su-e13d76">📝 ${escapeHtml(note)}</p>`:''}`;
  box.querySelectorAll('input[type=checkbox]').forEach(cb=> cb.onchange=()=> espMarkDone(cb.dataset.id, cb.checked));
  const ni=$('espNoteInput'); if(ni && !ni.dataset.bound){ ni.dataset.bound='1'; }
}
function espStreak(pid){
  let s=0; const d=getEspiritualData();
  let cur=new Date(espTodayKey()+'T12:00:00');
  for(let i=0;i<365;i++){
    const k=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
    if(d.done[k]&&d.done[k][pid]) s++;
    else if(i===0) { /* hoy aún no hecha: mira ayer */ }
    else break;
    cur=new Date(cur.getTime()-86400000);
    if(i===0 && !(d.done[k]&&d.done[k][pid])) continue;
  }
  return s;
}
function renderEspStats(){
  const box=$('espStatsBox'); if(!box) return;
  const d=getEspiritualData();
  const keys=Object.keys(d.done).sort().slice(-7);
  let totalWeek=0;
  keys.forEach(k=>{ const o=d.done[k]; if(o&&typeof o==='object') totalWeek+=Object.values(o).filter(Boolean).length; });
  const maxDay=Math.max(1,...keys.map(k=>{ const o=d.done[k]; return o? Object.values(o).filter(Boolean).length:0; }));
  const bars=keys.map(k=>{
    const o=d.done[k]||{}; const n=Object.values(o).filter(Boolean).length;
    const h=Math.round(n/maxDay*56)+4;
    const lbl=(k||'').slice(5);
    return `<div class="esp-bar-col" title="${k}: ${n}"><div class="esp-bar" style="height:${h}px"></div><span>${lbl}</span><b>${n}</b></div>`;
  }).join('')||'<p class="muted su-11a508">Sin datos aún.</p>';
  const rows=getAllEspPractices().map(p=>{
    let c7=0; keys.forEach(k=>{ if(d.done[k]&&d.done[k][p.id]) c7++; });
    const st=espStreak(p.id);
    return `<span class="esp-pill ${c7>0?'gold':''}">${p.icon} ${escapeHtml(p.nombre)}: <b>${c7}/7</b>${st>1?` · 🔥${st}`:''}</span>`;
  }).join('');
  box.innerHTML=`<h4>📊 Últimos 7 días: <b>${totalWeek}</b> prácticas</h4><div class="esp-bars">${bars}</div><div class="esp-meta su-8a77e5">${rows}</div>
  <p class="muted su-e13d76">Consejo: la racha se construye con 1–2 prácticas diarias, no con las 13. Si fallas un día, retoma al siguiente sin culpa.</p>`;
}
function renderEspLog(){
  const box=$('espLogBox'); if(!box) return;
  const d=getEspiritualData();
  const keys=Object.keys(d.done).sort().reverse().slice(0,14);
  if(!keys.length){ box.innerHTML='<p class="muted su-11a508">Sin registros aún. Marca tu primera práctica arriba ⬆️</p>'; return; }
  box.innerHTML=keys.map(k=>{
    const o=d.done[k]||{};
    const all=getAllEspPractices();
    const names=all.filter(p=>o[p.id]).map(p=>p.icon+' '+p.nombre).join(' · ')||'—';
    const n=(d.notes[k]&&d.notes[k].t)? ' · 📝 '+d.notes[k].t : '';
    return `<div class="habit-item"><div class="habit-head"><b class="su-e39eba">${k}</b><span class="muted su-11a508">${Object.values(o).filter(Boolean).length} prácticas</span></div><div class="su-707c92">${escapeHtml(names)}${escapeHtml(n)}</div></div>`;
  }).join('');
}
function espAgendar(pid){
  try{
    const p=getAllEspPractices().find(x=>x.id===pid);
    const label=p? p.icon+' '+p.nombre : pid;
    const k=espTodayKey();
    const ref=(typeof lunaMapForKey==='function')? lunaMapForKey(k) : null;
    if(!ref||ref.luna==='dft'){ alert('Hoy está fuera del ciclo visible; igual puedes usar ⏱ y ✅.'); return; }
    let defH='07:00';
    if(pid==='atardecer'){ try{ defH=espSunToday().setT||'19:00'; const [h,m]=defH.split(':').map(Number); const dd=new Date(); dd.setHours(h,Math.max(0,m-30)); defH=String(dd.getHours()).padStart(2,'0')+':'+String(dd.getMinutes()).padStart(2,'0'); }catch(e){} }
    else if(pid==='amanecer'){ try{ defH=espSunToday().riseT||'07:00'; }catch(e){} }
    else if(pid==='luzroja') defH='20:30';
    else if(pid==='ducha') defH='08:00';
    const cell=dayCell(ref.luna, ref.diaN);
    if(!Array.isArray(cell.agenda)) cell.agenda=[];
    cell.agenda.push({ id:'e'+Date.now()+Math.random().toString(36).slice(2,4), hour:parseInt(defH.slice(0,2),10), minute:parseInt(defH.slice(3,5),10), time:defH, text:label, notify:false, notified:false });
    scheduleSave('Agendado ✓');
    alert('Agendado hoy '+defH+' · '+label+' (puedes activar 🔔 en el día)');
  }catch(e){ alert('No se pudo agendar'); }
}
function espKitText(){
  const s=espSunToday();
  return `🕉️ MI KIT ESPIRITUAL — Penco\nHoy salida ${s.riseT} · puesta ${s.setT}\n\nKIT: botella vidrio 1L + tapa · vaso · toalla + chalas · manta/cojín · ampolleta roja E27 5-7W · antifaz/cortina · cuaderno + lápiz · termo agua\n\nRUTINA MÍNIMA:\n🌅 Sol amanecer ${s.riseT} (+60min) 2-10 min, sin mirar fijo\n💧 Agua solar 30min-4h en vidrio, beber en 24h\n🦶 Grounding 10-20 min descalzo\n🧊 Ducha: cierra 15-30 seg frío, sube semanal\n🌇 Sol atardecer -60min ${s.setT}\n🔴 Roja desde 20:30, dormir oscuro total\n\n⚠️ Nunca sol fijo ni mediodía sin protección. Ducha fría no con corazón/hipertensión/embarazo/fiebre.`;
}
// Timer
let espTimerTotal=120, espTimerLeft=120, espTimerInt=null;
function espTimerFmt(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
function espTimerPaint(){ const el=$('espTimerDisplay'); if(el) el.textContent=espTimerFmt(espTimerLeft); }
function espTimerReset(){ clearInterval(espTimerInt); espTimerInt=null; const mm=parseInt(($('espTimerMinutes')||{}).value||'2',10); espTimerTotal=mm*60; espTimerLeft=espTimerTotal; espTimerPaint(); }
function espTimerStart(){
  if(espTimerInt) return;
  if(espTimerLeft<=0) espTimerReset();
  espTimerInt=setInterval(()=>{
    espTimerLeft--;
    espTimerPaint();
    if(espTimerLeft<=0){ clearInterval(espTimerInt); espTimerInt=null; try{ playNotifySound(); }catch(e){} try{ if(navigator.vibrate) navigator.vibrate([300,150,300]); }catch(e){}
      const sel=$('espTimerPractice'); const pid=sel? sel.value : '';
      if(pid && pid!=='luzroja'){ espMarkDone(pid, true); }
      alert('⏱ Práctica terminada. ¡Bien! Quedó marcada ✅'); }
  },1000);
}
function renderEspiritualAll(){ renderEspTimerOptions(); renderEspFilters(); renderEspiritualTodayBox(); renderEspiritualCards(); renderEspTodayChecks(); renderEspStats(); renderEspLog(); espTimerPaint(); }
function setupEspiritualDialog(){
  const btn=$('btnEspiritual'); if(btn) btn.onclick=()=>{ renderEspiritualAll(); $('espiritualDialog').showModal(); };
  const ct=$('espiritualCloseTop'), cb=$('espiritualClose'); if(ct) ct.onclick=()=>$('espiritualDialog').close(); if(cb) cb.onclick=()=>$('espiritualDialog').close();
  const tP=$('espTabPracticas'), tK=$('espTabKit'), tR=$('espTabRegistro');
  const pP=$('espPracticasPanel'), pK=$('espKitPanel'), pR=$('espRegistroPanel');
  function tab(which){
    if(!pP) return;
    pP.classList.toggle('hidden', which!=='p'); pK.classList.toggle('hidden', which!=='k'); pR.classList.toggle('hidden', which!=='r');
    tP.classList.toggle('btn-accent', which==='p'); tK.classList.toggle('btn-accent', which==='k'); tR.classList.toggle('btn-accent', which==='r');
    if(which!=='p'&&which==='r'){ renderEspTodayChecks(); renderEspStats(); renderEspLog(); }
  }
  if(tP) tP.onclick=()=>tab('p'); if(tK) tK.onclick=()=>tab('k'); if(tR) tR.onclick=()=>tab('r');
  const fQ=$('espSearch'); if(fQ) fQ.oninput=()=>{ ESP_FILTER.q=fQ.value||''; renderEspiritualCards(); };
  const fC=$('espFilterCat'); if(fC) fC.onchange=()=>{ ESP_FILTER.cat=fC.value||'todas'; renderEspiritualCards(); };
  const fN=$('espFilterNivel'); if(fN) fN.onchange=()=>{ ESP_FILTER.nivel=fN.value||'todos'; renderEspiritualCards(); };
  const mm=$('espTimerMinutes'); if(mm) mm.onchange=()=>espTimerReset();
  const pr=$('espTimerPractice'); if(pr) pr.onchange=()=>{ const f=getAllEspPractices().find(x=>x.id===pr.value); if(f&&mm){ mm.value=String(f.mins); espTimerReset(); } };
  const bS=$('espTimerStart'); if(bS) bS.onclick=()=>espTimerStart();
  const bP=$('espTimerPause'); if(bP) bP.onclick=()=>{ clearInterval(espTimerInt); espTimerInt=null; };
  const bR=$('espTimerReset'); if(bR) bR.onclick=()=>espTimerReset();
  const bD=$('espTimerDone'); if(bD) bD.onclick=()=>{ const sel=$('espTimerPractice'); if(sel){ espMarkDone(sel.value, true); clearInterval(espTimerInt); espTimerInt=null; } };
  const nS=$('espNoteSave'); if(nS) nS.onclick=()=>{
    const v=sanitizeText(($('espNoteInput')||{}).value||'',120).trim(); if(!v) return;
    const k=espTodayKey(); const d=getEspiritualData(); d.notes[k]={t:v}; scheduleSave('Guardado ✓'); $('espNoteInput').value=''; renderEspTodayChecks(); renderEspLog();
  };
  const ag=$('espAgendar'); if(ag) ag.onclick=()=>{ const sel=$('espTimerPractice'); espAgendar(sel? sel.value : 'amanecer'); };
  const sh=$('espShareLog'); if(sh) sh.onclick=async()=>{
    const d=getEspiritualData(); const keys=Object.keys(d.done).sort().slice(-7);
    const txt=`🕉️ Mis prácticas (7 días)\n`+keys.map(k=>{ const o=d.done[k]||{}; const n=Object.values(o).filter(Boolean).length; return `${k}: ${n} prácticas`; }).join('\n');
    await shareText('Prácticas Espirituales', txt);
  };
  const cl=$('espClear'); if(cl) cl.onclick=()=>{ if(!confirm('¿Borrar todo tu registro de prácticas?')) return; const d=getEspiritualData(); d.done={}; d.notes={}; scheduleSave(); renderEspiritualAll(); };
  const cAdd=$('espCustomAdd'); if(cAdd) cAdd.onclick=()=>{
    const nombre=sanitizeText(($('espCustomName')||{}).value||'',40).trim(); if(!nombre) return alert('Ponle nombre a tu práctica');
    if(getAllEspPractices().some(x=>x.nombre.toLowerCase()===nombre.toLowerCase())) return alert('Ya existe una práctica con ese nombre');
    const mins=Math.max(1, Math.min(120, parseInt(($('espCustomMins')||{}).value||'5',10)||5));
    const icon=(($('espCustomIcon')||{}).value||'').trim()||'🕯️';
    const desc=sanitizeText(($('espCustomDesc')||{}).value||'',80).trim()||'Mi práctica personal';
    const d=getEspiritualData();
    const catSel=(($('espCustomCat')||{}).value||'interior');
    d.custom.push({ id:'c'+Date.now(), cat:catSel, icon, nombre, sub:desc, nivel:'Mía', tiempo:mins+' min', horario:'a tu hora', mats:'lo que tengas', cuidado:'A tu ritmo, sin forzar. Si hay mareo o malestar, pausa.', benef:'Mi intención personal.', pasos:['Prepara tu espacio: '+desc+'.','Pon el temporizador en '+mins+' min y empieza.','Hazla 7 días seguidos y marca ✅ cada día.'], mins, custom:true });
    scheduleSave('Práctica guardada 🕉️');
    $('espCustomName').value=''; $('espCustomDesc').value='';
    renderEspTimerOptions(); renderEspiritualTodayBox(); renderEspiritualCards(); renderEspTodayChecks(); renderEspStats();
  };
  const ck=$('espCopyKit'); if(ck) ck.onclick=async()=>{ try{ await navigator.clipboard.writeText(espKitText()); $('espKitStatus').textContent='Copiado ✓ pégalo donde quieras'; }catch(e){ $('espKitStatus').textContent='No se pudo copiar'; } setTimeout(()=>{ $('espKitStatus').textContent=''; },2000); };
  const sk=$('espShareKit'); if(sk) sk.onclick=async()=>{ await shareText('Kit Espiritual', espKitText()); };
  const g1=$('espGoCircadian'); if(g1) g1.onclick=()=>{ try{ $('espiritualDialog').close(); }catch(e){} setTimeout(()=>{ const b=$('btnCircadian'); if(b) b.click(); },150); };
  const g2=$('espGoGolden'); if(g2) g2.onclick=()=>{ try{ $('espiritualDialog').close(); }catch(e){} setTimeout(()=>{ const b=$('btnGolden'); if(b) b.click(); },150); };
  const g3=$('espGoBreath'); if(g3) g3.onclick=()=>{ try{ $('espiritualDialog').close(); }catch(e){} setTimeout(()=>{ const b=$('btnBreath'); if(b) b.click(); },150); };
}
setTimeout(setupEspiritualDialog, 880);


  // Natural handlers extension
  const _origSetupMedic = setupMedicDialog;
  setupMedicDialog = function(){
    _origSetupMedic();
    setTimeout(()=>{
      renderNaturalList(); renderNaturalUserList();
      const addBtn=$('naturalAdd'); if(addBtn) addBtn.onclick=()=>{
        const n=$('naturalName').value.trim(), u=$('naturalUse').value.trim();
        if(!n) return;
        const d=getNaturalData(); d.list.push({id:'n'+Date.now(), n, uso:u}); scheduleSave(); $('naturalName').value=''; $('naturalUse').value=''; renderNaturalUserList();
      };
    },100);
  };

setTimeout(setupMealDialog, 650);
setTimeout(setupShoppingDialog, 660);

// === RELOJ VIVO PENCO ===
function updateLiveClock() {
  const el = $('liveClock');
  if (!el) return;
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const parts = fmt.formatToParts(now);
  const get = t => (parts.find(p => p.type === t) || {}).value || '';
  el.innerHTML = `<span class="lc-time">${get('hour')}:${get('minute')}:${get('second')}</span><span class="lc-date">${get('weekday')} ${get('day')} ${get('month')}</span>`;
  el.title = new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', dateStyle: 'full', timeStyle: 'medium' }).format(now) + ' · America/Santiago';
}
setInterval(updateLiveClock, 1000);
setTimeout(updateLiveClock, 200);

// === CONSUMO ELÉCTRICO ===
const ENERGY_PRESETS = [
  { nombre:'Refrigerador 300L', watts:150, horas:24, dias:30, cat:'Frío' },
  { nombre:'Congelador', watts:120, horas:24, dias:30, cat:'Frío' },
  { nombre:'Iluminación LED 10W ×5', watts:50, horas:5, dias:30, cat:'Iluminación' },
  { nombre:'TV LED 50"', watts:80, horas:4, dias:30, cat:'Entretenimiento' },
  { nombre:'TV 65" + deco', watts:150, horas:4, dias:30, cat:'Entretenimiento' },
  { nombre:'Notebook', watts:65, horas:6, dias:30, cat:'Computación' },
  { nombre:'PC + monitor', watts:200, horas:4, dias:30, cat:'Computación' },
  { nombre:'Lavadora 10kg', watts:500, horas:1, dias:12, cat:'Lavado' },
  { nombre:'Secadora', watts:2000, horas:1, dias:8, cat:'Lavado' },
  { nombre:'Hervidor', watts:1500, horas:0.25, dias:30, cat:'Cocina' },
  { nombre:'Microondas', watts:1200, horas:0.3, dias:30, cat:'Cocina' },
  { nombre:'Horno eléctrico', watts:2000, horas:0.5, dias:12, cat:'Cocina' },
  { nombre:'Aire split 9000 BTU', watts:800, horas:4, dias:30, cat:'Clima' },
  { nombre:'Calefactor 1000W', watts:1000, horas:3, dias:15, cat:'Clima' },
  { nombre:'Ducha eléctrica', watts:3500, horas:0.25, dias:30, cat:'Agua caliente' },
  { nombre:'Router + ONT', watts:15, horas:24, dias:30, cat:'Red' }
];
function getEnergyData(){
  const u=userData();
  if(!u.energia) u.energia={ tarifa:140, items:[] };
  if(typeof u.energia.tarifa!=='number') u.energia.tarifa=parseInt(u.energia.tarifa)||140;
  if(!Array.isArray(u.energia.items)) u.energia.items=[];
  return u.energia;
}
function calcEnergyItem(it){
  const w=parseFloat(it.watts)||0, h=parseFloat(it.horasDia)||0, d=parseInt(it.diasMes)||0, c=parseInt(it.cantidad)||1;
  const kWhDia = w/1000 * h * c;
  const kWhMes = kWhDia * d;
  return { kWhDia, kWhMes };
}
function renderEnergyPresets(){
  const box=$('energyPresets'); if(!box) return;
  box.innerHTML=ENERGY_PRESETS.map(p=> `<button type="button" class="btn su-337714" data-preset="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)} · ${p.watts}W</button>`).join('');
  box.querySelectorAll('[data-preset]').forEach(b=> b.onclick=()=>{
    const p=ENERGY_PRESETS.find(x=>x.nombre===b.dataset.preset); if(!p) return;
    $('energyName').value=p.nombre; $('energyWatts').value=p.watts; $('energyHoras').value=p.horas; $('energyDias').value=p.dias; $('energyCant').value=1; $('energyName').focus();
  });
}
function renderEnergyResumen(){
  const box=$('energyResumen'); if(!box) return;
  const d=getEnergyData();
  const tarifa=parseInt(d.tarifa)||140;
  let totalKwh=0;
  d.items.forEach(it=>{ totalKwh += calcEnergyItem(it).kWhMes; });
  const totalCosto = Math.round(totalKwh*tarifa);
  const totalDia = totalKwh/30;
  const potenciaPico = d.items.reduce((s,it)=> s + (parseFloat(it.watts)||0)*(parseInt(it.cantidad)||1),0);
  const lunaName=currentView&&currentView.tipo==='luna'? MOONS[currentView.luna-1].nombre : '—';
  box.innerHTML=`<div class="su-083eb7"><span class="su-de0080"><b>⚡ Total mes</b></span><span class="chip su-e4aba6">${totalKwh.toFixed(1)} kWh</span></div>
    <div class="su-d85a2b">
      <div class="chip su-91a870"><b>$${totalCosto.toLocaleString('es-CL')}</b><br><span class="muted su-0d5be0">a $${tarifa}/kWh</span></div>
      <div class="chip su-91a870"><b>${totalDia.toFixed(2)} kWh/día</b><br><span class="muted su-0d5be0">${Math.round(totalDia*1000)} Wh/día</span></div>
      <div class="chip su-91a870"><b>${(potenciaPico/1000).toFixed(2)} kW</b><br><span class="muted su-0d5be0">pico instalado</span></div>
    </div>
    <p class="muted su-e13d76">${d.items.length} artefactos · Tarifa $${tarifa}/kWh · Luna actual: ${lunaName} · Estimación mes 30 días; ajusta tarifa con tu boleta (energía + cargos).</p>`;
}
function renderEnergyList(){
  const box=$('energyList'); if(!box) return;
  const d=getEnergyData();
  const tarifa=parseInt(d.tarifa)||140;
  if(!d.items.length){ box.innerHTML='<p class="muted">Sin artefactos. Agrega uno o usa un preset.</p>'; $('energyStats').textContent='0 artefactos'; return; }
  const sorted=[...d.items].map(it=> ({...it, ...calcEnergyItem(it)})).sort((a,b)=> b.kWhMes - a.kWhMes);
  box.innerHTML=sorted.map(it=>{
    const costo=Math.round(it.kWhMes*tarifa);
    const pctTotal = sorted.reduce((s,x)=>s+x.kWhMes,0) ? Math.round(it.kWhMes / sorted.reduce((s,x)=>s+x.kWhMes,0)*100) : 0;
    return `<div class="habit-item su-4e0699">
      <span><b>${escapeHtml(it.nombre)}</b> · ${it.watts}W ×${it.cantidad} · ${it.horasDia}h/día ×${it.diasMes}d<br><span class="muted su-11a508">${it.kWhMes.toFixed(2)} kWh/mes · $${costo.toLocaleString('es-CL')} · ${pctTotal}% del total</span><div class="su-9a2481"><div style="width:${pctTotal}%;height:100%;background:linear-gradient(90deg,#e8c56a,#e8c56a)"></div></div></span>
      <span class="su-0c0cb1"><button data-id="${it.id}" class="btn energy-edit su-337714">✏️</button><button data-id="${it.id}" class="btn energy-del su-fd834a">✕</button></span>
    </div>`;
  }).join('');
  const totalKwh=sorted.reduce((s,x)=>s+x.kWhMes,0);
  const totalCosto=Math.round(totalKwh*tarifa);
  $('energyStats').textContent=`${d.items.length} artefactos · ${totalKwh.toFixed(1)} kWh · $${totalCosto.toLocaleString('es-CL')}`;
  box.querySelectorAll('.energy-edit').forEach(b=> b.onclick=()=>{
    const it=d.items.find(x=>x.id===b.dataset.id); if(!it) return;
    energyEditingId=it.id;
    $('energyName').value=it.nombre; $('energyWatts').value=it.watts; $('energyCant').value=it.cantidad; $('energyHoras').value=it.horasDia; $('energyDias').value=it.diasMes; $('energyTarifa').value=d.tarifa;
    $('energyAdd').classList.add('hidden'); $('energyUpdate').classList.remove('hidden'); $('energyCancel').classList.remove('hidden');
  });
  box.querySelectorAll('.energy-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar artefacto?')) return;
    const idx=d.items.findIndex(x=>x.id===b.dataset.id); if(idx>=0) d.items.splice(idx,1);
    scheduleSave(); renderEnergyResumen(); renderEnergyList(); renderEnergyTips(); renderEnergyLuna();
  });
}
function renderEnergyTips(){
  const box=$('energyTips'); if(!box) return;
  const d=getEnergyData();
  const sorted=[...d.items].map(it=> ({...it, ...calcEnergyItem(it)})).sort((a,b)=> b.kWhMes-a.kWhMes);
  const top=sorted[0];
  let tips=[];
  if(sorted.length) tips.push(`🔝 Mayor consumo: <b>${escapeHtml(top.nombre)}</b> ${top.kWhMes.toFixed(1)} kWh/mes — revisa horas o eficiencia.`);
  tips.push('💡 Cambia a LED (10W vs 60W) ahorra 80% iluminación.');
  tips.push('🔌 Corta stand-by: zapatilla con switch para TV/deco/router noche.');
  tips.push('❄️ Refri: 3-4°C, no abrir largo, alejado de horno, sello impecable.');
  tips.push('🫖 Hervidor: hierve solo lo necesario, descalcifica.');
  tips.push('👕 Lava con agua fría y carga completa; seca al sol, no secadora.');
  box.innerHTML=`<h4 class="su-a80552">💡 Consejos ahorro Penco</h4>`+ tips.map(t=> `<p class="muted su-48eb2e">• ${t}</p>`).join('') + `<p class="muted su-d47a97">Tarifa referencial CGE 2025-26 ~$120-160/kWh según tramo y cargos. Ajusta arriba para tu boleta real.</p>`;
}
function renderEnergyLuna(){
  const box=$('energyLuna'); if(!box) return;
  const d=getEnergyData();
  const totalKwh=d.items.reduce((s,it)=> s+calcEnergyItem(it).kWhMes,0);
  const kwhDia= totalKwh/30;
  const lunaDias=28;
  const kwhLuna= kwhDia*lunaDias;
  const costoLuna=Math.round(kwhLuna*(parseInt(d.tarifa)||140));
  const nombre=currentView&&currentView.tipo!=='dft'? MOONS[currentView.luna-1].nombre : 'DFT';
  box.innerHTML=`<h4 class="su-a80552">🌙 Luna ${currentView&&currentView.tipo!=='dft'? currentView.luna:'—'} · ${escapeHtml(nombre)} — proyección 28 días</h4>
    <p class="muted su-11a508">~${kwhLuna.toFixed(1)} kWh / luna · ~$${costoLuna.toLocaleString('es-CL')} con tarifa actual. Útil para comparar lunas y fijar meta de ahorro.</p>
    <div class="su-b07124"><div style="width:${Math.min(100, Math.round(kwhLuna/2))}%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a)"></div></div>`;
}
let energyEditingId=null;
let energyTab='consumo';
function switchEnergyTab(tab){
  energyTab=tab;
  const bC=$('tabEnergyConsumo'), bK=$('tabEnergyCalc'), bS=$('tabEnergySolar');
  if(bC) bC.classList.toggle('btn-accent', tab==='consumo');
  if(bK) bK.classList.toggle('btn-accent', tab==='calc');
  if(bS) bS.classList.toggle('btn-accent', tab==='solar');
  const pC=$('energyConsumoPanel'), pK=$('energyCalcPanel'), pS=$('energySolarPanel');
  if(pC) pC.classList.toggle('hidden', tab!=='consumo');
  if(pK) pK.classList.toggle('hidden', tab!=='calc');
  if(pS) pS.classList.toggle('hidden', tab!=='solar');
}
function setupOhmCalc(){
  const vEl=$('ohmV'), iEl=$('ohmI'), rEl=$('ohmR'), pEl=$('ohmP'), resEl=$('ohmResult'), statusEl=$('ohmStatus');
  const btn=$('ohmCalc'), clr=$('ohmClear');
  function parseVal(el){ const v=parseFloat(el.value); return isNaN(v)? null : v; }
  function fmt(n){ if(n===null||!isFinite(n)) return '—'; if(Math.abs(n)>=1000) return n.toFixed(2); if(Math.abs(n)>=1) return n.toFixed(3); return n.toFixed(4); }
  function calc(){
    let V=parseVal(vEl), I=parseVal(iEl), R=parseVal(rEl), P=parseVal(pEl);
    const vals=[V,I,R,P].filter(x=>x!==null).length;
    if(vals<2){ if(statusEl) statusEl.textContent='Ingresa al menos 2 valores'; if(resEl) resEl.innerHTML='<span class="muted">Necesitas 2 datos para resolver. Ej: V=220 + P=1500 → I y R automáticos.</span>'; return; }
    if(statusEl) statusEl.textContent='';
    // iterative solving
    let changed=true, iter=0;
    while(changed && iter<10){ changed=false; iter++;
      if(V===null && I!==null && R!==null){ V=I*R; if(vEl) vEl.value=fmt(V); changed=true; }
      if(V===null && P!==null && I!==null && I!==0){ V=P/I; if(vEl) vEl.value=fmt(V); changed=true; }
      if(V===null && P!==null && R!==null && R!==0){ V=Math.sqrt(P*R); if(vEl) vEl.value=fmt(V); changed=true; }
      if(I===null && V!==null && R!==null && R!==0){ I=V/R; if(iEl) iEl.value=fmt(I); changed=true; }
      if(I===null && P!==null && V!==null && V!==0){ I=P/V; if(iEl) iEl.value=fmt(I); changed=true; }
      if(I===null && P!==null && R!==null && R!==0){ I=Math.sqrt(P/R); if(iEl) iEl.value=fmt(I); changed=true; }
      if(R===null && V!==null && I!==null && I!==0){ R=V/I; if(rEl) rEl.value=fmt(R); changed=true; }
      if(R===null && P!==null && I!==null && I!==0){ R=P/(I*I); if(rEl) rEl.value=fmt(R); changed=true; }
      if(R===null && V!==null && P!==null && P!==0){ R=(V*V)/P; if(rEl) rEl.value=fmt(R); changed=true; }
      if(P===null && V!==null && I!==null){ P=V*I; if(pEl) pEl.value=fmt(P); changed=true; }
      if(P===null && I!==null && R!==null){ P=I*I*R; if(pEl) pEl.value=fmt(P); changed=true; }
      if(P===null && V!==null && R!==null && R!==0){ P=(V*V)/R; if(pEl) pEl.value=fmt(P); changed=true; }
      // reparse
      V=parseVal(vEl); I=parseVal(iEl); R=parseVal(rEl); P=parseVal(pEl);
    }
    V=parseVal(vEl); I=parseVal(iEl); R=parseVal(rEl); P=parseVal(pEl);
    const E_kWh = (P!==null)? (P*1/1000).toFixed(4) : '—';
    if(resEl){
      if(V===null||I===null||R===null||P===null){ resEl.innerHTML='<span class="su-23dd39">Faltan datos o combinación inconsistente. Prueba con V+I, V+R, V+P, I+R, I+P o R+P.</span>'; }
      else { resEl.innerHTML=`<b class="su-e39eba">V=${fmt(V)} V · I=${fmt(I)} A · R=${fmt(R)} Ω · P=${fmt(P)} W</b><br><span class="muted">Comprobación: V=I·R → ${fmt(I*R)} V · P=V·I → ${fmt(V*I)} W · En 1h → ${E_kWh} kWh</span>`; }
    }
  }
  if(btn) btn.onclick=calc;
  if(clr) clr.onclick=()=>{ [vEl,iEl,rEl,pEl].forEach(el=>{ if(el) el.value=''; }); if(resEl) resEl.innerHTML=''; if(statusEl) statusEl.textContent=''; };
  document.querySelectorAll('[data-ohm]').forEach(b=> b.onclick=()=>{
    const parts=(b.dataset.ohm||'').split(',');
    if(vEl) vEl.value=parts[0]||''; if(iEl) iEl.value=parts[1]||''; if(rEl) rEl.value=parts[2]||''; if(pEl) pEl.value=parts[3]||'';
    calc();
  });
}
function setupEnergyCalcExtras(){
  const enP=$('enP'), enT=$('enT'), enTar=$('enTar'), enBtn=$('enCalc'), enRes=$('enResult');
  if(enBtn) enBtn.onclick=()=>{
    const P=parseFloat(enP&&enP.value), t=parseFloat(enT&&enT.value), tar=parseFloat(enTar&&enTar.value)||140;
    if(isNaN(P)||isNaN(t)){ if(enRes) enRes.textContent='Ingresa P y t'; return; }
    const e=P*t/1000; const costo=e*tar;
    if(enRes) enRes.innerHTML=`<b>${e.toFixed(3)} kWh</b> · $${Math.round(costo).toLocaleString('es-CL')} a $${tar}/kWh`;
  };
  const rv=$('resistVals'), rBtn=$('resistCalc'), rRes=$('resistResult');
  if(rBtn) rBtn.onclick=()=>{
    const txt=(rv&&rv.value||'').trim(); if(!txt){ if(rRes) rRes.textContent='Ingresa valores'; return; }
    const vals=txt.split(',').map(s=>parseFloat(s.trim())).filter(v=>!isNaN(v)&&v>0);
    if(vals.length<2){ if(rRes) rRes.textContent='Mínimo 2 resistencias'; return; }
    const serie=vals.reduce((a,b)=>a+b,0);
    const paral=1/vals.reduce((a,b)=>a+1/b,0);
    if(rRes) rRes.innerHTML=`Serie: <b>${serie.toFixed(2)} Ω</b> · Paralelo: <b>${paral.toFixed(2)} Ω</b>`;
  };
  const vs=$('ledVs'), vf=$('ledVf'), iff=$('ledIf'), lBtn=$('ledCalc'), lRes=$('ledResult');
  if(lBtn) lBtn.onclick=()=>{
    const Vs=parseFloat(vs&&vs.value), Vf=parseFloat(vf&&vf.value), IfmA=parseFloat(iff&&iff.value);
    if(isNaN(Vs)||isNaN(Vf)||isNaN(IfmA)||IfmA<=0){ if(lRes) lRes.textContent='Completa Vs, Vf, If'; return; }
    const IfA=IfmA/1000; const R=(Vs - Vf)/IfA; const PR=IfA*IfA*R;
    if(R<=0){ if(lRes) lRes.innerHTML='<span class="su-23dd39">Vs debe ser mayor que Vf</span>'; return; }
    const comercial=[10,22,47,100,120,150,220,270,330,470,510,560,680,1000];
    let rec=comercial.find(v=>v>=R)||Math.ceil(R);
    if(lRes) lRes.innerHTML=`R = <b>${R.toFixed(1)} Ω</b> → usa <b>${rec} Ω</b> comercial · P≈${PR.toFixed(3)}W (usa 0.5W si <0.25W)`;
  };
  const ci=$('cableI'), cl=$('cableL'), cs=$('cableS'), cv=$('cableV'), cBtn=$('cableCalc'), cRes=$('cableResult'), awgEl=$('cableAWG');
  const awgTable=[{mm:0.326,awg:22},{mm:0.823,awg:18},{mm:1.31,awg:16},{mm:2.08,awg:14},{mm:3.31,awg:12},{mm:5.26,awg:10},{mm:8.37,awg:8},{mm:13.3,awg:6},{mm:21.15,awg:4}];
  function awgFor(mm){ let r=awgTable[0]; for(const e of awgTable){ if(mm>=e.mm) r=e; } return r.awg; }
  if(cBtn) cBtn.onclick=()=>{
    const I=parseFloat(ci&&ci.value), L=parseFloat(cl&&cl.value), S=parseFloat(cs&&cs.value), Vn=parseFloat(cv&&cv.value)||220;
    if(isNaN(I)||isNaN(L)||isNaN(S)||S<=0){ if(cRes) cRes.textContent='Completa I, L, S'; return; }
    const rho=0.0178; const dV=2*I*L*rho / S; const perc=dV/Vn*100;
    const ok=perc<3? '✅' : perc<5? '⚠️' : '❌';
    if(cRes) cRes.innerHTML=`Caída: <b>${dV.toFixed(2)} V</b> (${perc.toFixed(2)}% de ${Vn}V) ${ok}`;
    if(awgEl){
      const awg=awgFor(S);
      let tip=perc<3? 'Ok para alumbrado (<3%)' : perc<5? 'Ok fuerza (<5%) pero no alumbrado' : 'Excede norma — sube sección';
      awgEl.innerHTML=`≈ AWG ${awg} para ${S}mm² · ${tip}. Fórmula: ΔV=2·I·L·0.0178 / S`;
    }
  };
}
function setupSolarPV(){
  const kwhEl=$('solarKwhMes'), hspEl=$('solarHSP'), prEl=$('solarPR'), wpEl=$('solarWp'), precioEl=$('solarPrecioPanel'), tarifaEl=$('solarTarifa'), tipoEl=$('solarTipo'), autEl=$('solarAutonomia'), voltEl=$('solarVolt'), dodEl=$('solarDOD'), effEl=$('solarEff'), batInfo=$('solarBatInfo');
  const btn=$('solarCalc'), fromBtn=$('solarFromConsumo'), resEl=$('solarResult'), detEl=$('solarDetalle'), batBox=$('solarBateriaBox'), statusEl=$('solarStatus');
  const offRow=$('solarOffGridRow');
  function toggleOff(){ if(!tipoEl||!offRow) return; const isOff=tipoEl.value!=='ongrid'; offRow.style.display=isOff?'':'flex'; offRow.style.opacity=isOff?'1':'0.5'; }
  if(tipoEl) tipoEl.onchange=toggleOff; toggleOff();
  function calc(){
    const kwhMes=parseFloat(kwhEl&&kwhEl.value), HSP=parseFloat(hspEl&&hspEl.value), PR=parseFloat(prEl&&prEl.value), Wp=parseFloat(wpEl&&wpEl.value), precio=parseFloat(precioEl&&precioEl.value)||180000, tarifa=parseFloat(tarifaEl&&tarifaEl.value)||140;
    const tipo=tipoEl&&tipoEl.value||'ongrid', autonomia=parseFloat(autEl&&autEl.value)||2, volt=parseFloat(voltEl&&voltEl.value)||24, dod=parseFloat(dodEl&&dodEl.value)||50, eff=parseFloat(effEl&&effEl.value)||90;
    if(isNaN(kwhMes)||isNaN(HSP)||isNaN(PR)||isNaN(Wp)){ if(statusEl) statusEl.textContent='Completa kWh, HSP, PR y Wp'; return; }
    if(HSP<=0||PR<=0||Wp<=0){ if(statusEl) statusEl.textContent='Valores inválidos'; return; }
    if(statusEl) statusEl.textContent='';
    const kwhDia=kwhMes/30;
    const potenciaNecKW=kwhDia/(HSP*PR);
    const nPaneles=Math.max(1, Math.ceil(potenciaNecKW*1000 / Wp));
    const potInstKW=nPaneles*Wp/1000;
    const prodDia=potInstKW*HSP*PR;
    const prodMes=prodDia*30;
    const area=nPaneles*1.7;
    const costoPaneles=nPaneles*precio;
    const costoTotal=Math.round(costoPaneles*1.65);
    const ahorroMes=Math.min(prodMes, kwhMes)*tarifa;
    const paybackMeses=ahorroMes>0? Math.ceil(costoTotal/ahorroMes):999;
    const paybackAnos=(paybackMeses/12).toFixed(1);
    const co2=prodMes*0.39;
    let html=`<div class="su-bdb7db">
      <div class="chip su-22a539"><b class="su-e416a3">${nPaneles} paneles</b><br><span class="muted su-0d5be0">${Wp}Wp · ${potInstKW.toFixed(2)} kWp</span></div>
      <div class="chip su-22a539"><b>${prodDia.toFixed(1)} kWh/día</b><br><span class="muted su-0d5be0">${prodMes.toFixed(0)} kWh/mes</span></div>
      <div class="chip su-22a539"><b>~${area.toFixed(1)} m²</b><br><span class="muted su-0d5be0">${(area/1.7).toFixed(0)} paneles · 1.7m² c/u</span></div>
    </div>
    <div class="su-d85a2b">
      <div class="chip su-91a870"><b>$${costoTotal.toLocaleString('es-CL')}</b><br><span class="muted su-0d5be0">inversión total est.</span></div>
      <div class="chip su-91a870"><b>$${Math.round(ahorroMes).toLocaleString('es-CL')}/mes</b><br><span class="muted su-0d5be0">ahorro (NetBilling 80-90%)</span></div>
      <div class="chip su-91a870"><b>${paybackAnos} años</b><br><span class="muted su-0d5be0">${paybackMeses} meses ROI</span></div>
    </div>
    <p class="muted su-e6fe60">Potencia necesaria: <b>${(potenciaNecKW*1000).toFixed(0)} W</b> = ${kwhDia.toFixed(1)} kWh/día ÷ (${HSP}h × ${PR}) · Producción cubre <b>${Math.min(100, Math.round(prodMes/kwhMes*100))}%</b> de tu consumo · CO₂ evitado ~<b>${co2.toFixed(0)} kg/mes</b></p>`;
    if(resEl) resEl.innerHTML=html;
    if(detEl){
      detEl.classList.remove('hidden');
      detEl.innerHTML=`<h4 class="su-e39eba">📐 Detalle técnico Penco</h4>
        <div class="help-grid su-fe7b49">
          <div class="help-card"><h4>☀️ Producción</h4><p class="su-11a508">E_día = ${potInstKW.toFixed(2)}kWp × ${HSP}h × ${PR} = <b>${prodDia.toFixed(2)} kWh/día</b><br>E_mes = <b>${prodMes.toFixed(0)} kWh</b></p></div>
          <div class="help-card"><h4>🏠 Consumo</h4><p class="su-11a508">${kwhMes} kWh/mes → <b>${kwhDia.toFixed(2)} kWh/día</b><br>Tipo: <b>${tipo}</b> · PR ${PR} (pérdidas ${(1-PR*100).toFixed(0)}%)</p></div>
          <div class="help-card"><h4>📦 Área y peso</h4><p class="su-11a508">${nPaneles} × 1.7m² = <b>${area.toFixed(1)} m²</b><br>Peso ~${(nPaneles*21).toFixed(0)} kg · Viento sur: anclaje reforzado</p></div>
          <div class="help-card"><h4>💡 Costos 2026</h4><p class="su-11a508">Paneles: $${costoPaneles.toLocaleString('es-CL')} (${nPaneles}×$${precio.toLocaleString('es-CL')})<br>Total c/inversor/estructura: <b>$${costoTotal.toLocaleString('es-CL')}</b></p></div>
        </div>
        <p class="muted su-a953a7">Cálculo referencial. Para TE4 y NetBilling consulta instalador SEC. HSP anual 4.9h es promedio; invierno real 2.8-3.0h → produce menos (usa dato mensual para precisión).</p>`;
    }
    if(batBox){
      if(tipo==='ongrid'){ batBox.classList.add('hidden'); }
      else {
        batBox.classList.remove('hidden');
        const energiaKwh=kwhDia*autonomia;
        const ah=energiaKwh*1000 / (volt * (dod/100) * (eff/100));
        const ahRed=Math.ceil(ah/10)*10;
        const batInfoTxt=`${ah.toFixed(0)} Ah (${ahRed} Ah comercial) a ${volt}V`;
        if(batInfo) batInfo.value=batInfoTxt;
        const nBat100=Math.ceil(ah/100);
        batBox.innerHTML=`<h4 class="su-721a46">🔋 Banco baterías — ${tipo}</h4>
          <p class="su-a6c665">Autonomía <b>${autonomia} días</b> → ${energiaKwh.toFixed(1)} kWh almacenados<br>Capacidad necesaria: <b>${ah.toFixed(0)} Ah</b> a ${volt}V (DOD ${dod}%, eff ${eff}%)<br>→ <b>${ahRed} Ah</b> mínimo → ej: <b>${nBat100}× 100Ah ${volt}V LiFePO4</b><br><span class="muted su-0d5be0">LiFePO4 DOD 80-90% y 4000 ciclos; plomo-ácido DOD 50%.</span></p>`;
      }
    }
  }
  if(btn) btn.onclick=calc;
  if(fromBtn) fromBtn.onclick=()=>{
    try{
      const d=getEnergyData(); let total=0; d.items.forEach(it=> total+=calcEnergyItem(it).kWhMes);
      if(total>5){ if(kwhEl) kwhEl.value=Math.round(total).toString(); calc(); if(statusEl) statusEl.textContent=`Cargado ${Math.round(total)} kWh desde 📊 Consumo`; }
      else { if(statusEl) statusEl.textContent='Sin consumo cargado — agrega artefactos en 📊'; }
    }catch(e){ if(statusEl) statusEl.textContent='Error al cargar consumo'; }
  };
  // auto calc init
  setTimeout(calc, 300);
}
function setupEnergyDialog(){
  const btn=$('btnEnergy'); if(btn) btn.onclick=()=>{
    const d=getEnergyData();
    $('energyTarifa').value=d.tarifa;
    renderEnergyPresets(); renderEnergyResumen(); renderEnergyList(); renderEnergyTips(); renderEnergyLuna();
    switchEnergyTab('consumo');
    setupOhmCalc(); setupEnergyCalcExtras(); setupSolarPV();
    $('energyDialog').showModal();
  };
  const ct=$('energyCloseTop'), cb=$('energyClose'); if(ct) ct.onclick=()=>$('energyDialog').close(); if(cb) cb.onclick=()=>$('energyDialog').close();
  const tC=$('tabEnergyConsumo'), tK=$('tabEnergyCalc'), tS=$('tabEnergySolar');
  if(tC) tC.onclick=()=> switchEnergyTab('consumo');
  if(tK) tK.onclick=()=> switchEnergyTab('calc');
  if(tS) tS.onclick=()=> switchEnergyTab('solar');
  const add=$('energyAdd'); if(add) add.onclick=()=>{
    const nombre=$('energyName').value.trim(); const watts=parseFloat($('energyWatts').value);
    const horas=parseFloat($('energyHoras').value); const dias=parseInt($('energyDias').value)||30; const cant=parseInt($('energyCant').value)||1;
    const tarifa=parseInt($('energyTarifa').value)||140;
    if(!nombre) return alert('Nombre del artefacto');
    if(!watts||watts<=0) return alert('Potencia W inválida');
    if(isNaN(horas)||horas<0||horas>24) return alert('Horas 0-24');
    const d=getEnergyData(); d.tarifa=tarifa;
    d.items.push({ id:'e'+Date.now(), nombre, watts, horasDia:horas, diasMes:dias, cantidad:cant });
    scheduleSave(); $('energyName').value=''; $('energyWatts').value=''; $('energyHoras').value=''; 
    renderEnergyResumen(); renderEnergyList(); renderEnergyTips(); renderEnergyLuna();
  };
  const upd=$('energyUpdate'); if(upd) upd.onclick=()=>{
    const it=getEnergyData().items.find(x=>x.id===energyEditingId); if(!it) return;
    it.nombre=$('energyName').value.trim(); it.watts=parseFloat($('energyWatts').value)||it.watts; it.cantidad=parseInt($('energyCant').value)||1; it.horasDia=parseFloat($('energyHoras').value)||0; it.diasMes=parseInt($('energyDias').value)||30;
    getEnergyData().tarifa=parseInt($('energyTarifa').value)||140;
    scheduleSave(); energyEditingId=null; $('energyAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('energyCancel').classList.add('hidden'); $('energyName').value=''; $('energyWatts').value=''; $('energyHoras').value='';
    renderEnergyResumen(); renderEnergyList(); renderEnergyTips(); renderEnergyLuna();
  };
  const cancel=$('energyCancel'); if(cancel) cancel.onclick=()=>{ energyEditingId=null; $('energyAdd').classList.remove('hidden'); $('energyUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('energyName').value=''; $('energyWatts').value=''; $('energyHoras').value=''; };
  const tarifaIn=$('energyTarifa'); if(tarifaIn) tarifaIn.onchange=()=>{ getEnergyData().tarifa=parseInt(tarifaIn.value)||140; scheduleSave(); renderEnergyResumen(); renderEnergyList(); renderEnergyLuna(); };
  const exp=$('energyExport'); if(exp) exp.onclick=()=>{
    const d=getEnergyData(); if(!d.items.length) return alert('Sin datos');
    let csv='Nombre,Watts,Cantidad,HorasDia,DiasMes,kWhMes,CostoCLP\n';
    const tarifa=parseInt(d.tarifa)||140;
    d.items.forEach(it=>{ const k=calcEnergyItem(it).kWhMes; csv+=`${it.nombre},${it.watts},${it.cantidad},${it.horasDia},${it.diasMes},${k.toFixed(2)},${Math.round(k*tarifa)}\n`; });
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='consumo-electrico-'+cal.fmtKey.format(new Date())+'.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const share=$('energyShare'); if(share) share.onclick=async()=>{
    const d=getEnergyData(); const tarifa=parseInt(d.tarifa)||140; let total=0; d.items.forEach(it=> total+=calcEnergyItem(it).kWhMes);
    let txt=`⚡ Consumo eléctrico — Penco\n${d.items.length} artefactos · ${total.toFixed(1)} kWh/mes · $${Math.round(total*tarifa).toLocaleString('es-CL')} a $${tarifa}/kWh\n`;
    d.items.slice().sort((a,b)=> calcEnergyItem(b).kWhMes - calcEnergyItem(a).kWhMes).slice(0,5).forEach(it=>{ const k=calcEnergyItem(it).kWhMes; txt+=`• ${it.nombre}: ${k.toFixed(1)} kWh ($${Math.round(k*tarifa).toLocaleString('es-CL')})\n`; });
    txt+=`\n— Mari Küla Küyen`;
    await shareText('⚡ Consumo eléctrico', txt);
  };
  const clear=$('energyClear'); if(clear) clear.onclick=()=>{ if(!confirm('¿Vaciar lista de artefactos?')) return; getEnergyData().items=[]; scheduleSave(); renderEnergyResumen(); renderEnergyList(); renderEnergyTips(); renderEnergyLuna(); };
}
setTimeout(setupEnergyDialog, 675);

// === CONVERSIÓN DE UNIDADES ===
const CONV = {
  longitud: { label: '📏 Longitud', units: { mm: 1, cm: 10, m: 1000, km: 1000000, pulg: 25.4, pie: 304.8, yarda: 914.4, milla: 1609344, legua: 4828000, año_luz: 9.461e15 }, defFrom: 'm', defTo: 'cm' },
  peso: { label: '⚖️ Peso', units: { mg: 1, g: 1000, kg: 1000000, tonelada: 1e9, onza: 28349.5, libra: 453592, quintal: 45359200, arroba: 11500000 }, defFrom: 'kg', defTo: 'g' },
  volumen: { label: '🧪 Volumen', units: { ml: 1, l: 1000, m3: 1e6, cda: 15, cdta: 5, taza: 240, galon: 3785.41, galon_imp: 4546.09, pulg3: 16.387, pie3: 28316.8, barril: 158987 }, defFrom: 'l', defTo: 'ml' },
  temperatura: { label: '🌡️ Temperatura', units: {}, isTemp: true, defFrom: 'C', defTo: 'F' },
  superficie: { label: '🟦 Superficie', units: { mm2: 1, cm2: 100, m2: 1000000, ha: 1e10, km2: 1e12, acre: 4046860000, pie2: 92903, tarea: 628.86*1e6 }, defFrom: 'm2', defTo: 'ha' },
  tiempo: { label: '⏱️ Tiempo', units: { ms: 1, s: 1000, min: 60000, h: 3600000, dia: 86400000, semana: 604800000, mes30: 2592000000, año: 31536000000 }, defFrom: 'h', defTo: 'min' },
  velocidad: { label: '🚀 Velocidad', units: { 'm/s': 1, 'km/h': 0.277777, mph: 0.44704, nudo: 0.514444, 'pie/s': 0.3048 }, defFrom: 'km/h', defTo: 'm/s' },
  energia: { label: '🔋 Energía', units: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3600000, BTU: 1055.06 }, defFrom: 'kWh', defTo: 'kJ' },
  potencia: { label: '💡 Potencia', units: { W: 1, kW: 1000, HP: 745.7, 'BTU/h': 0.293071, kcal_h: 1.163 }, defFrom: 'W', defTo: 'kW' },
  presion: { label: '🌀 Presión', units: { Pa: 1, kPa: 1000, bar: 100000, psi: 6894.76, atm: 101325, mmHg: 133.322 }, defFrom: 'bar', defTo: 'psi' },
  datos: { label: '💾 Datos', units: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }, defFrom: 'MB', defTo: 'KB' },
  angulo: { label: '📐 Ángulo', units: { grados: 1, radianes: 57.2958, gon: 0.9, vuelta: 360 }, defFrom: 'grados', defTo: 'radianes' },
};
function convertValue(v, from, to, cat) {
  if (cat === 'temperatura') {
    let c;
    if (from === 'C') c = v;
    else if (from === 'F') c = (v - 32) * 5/9;
    else if (from === 'K') c = v - 273.15;
    if (to === 'C') return c;
    if (to === 'F') return c * 9/5 + 32;
    if (to === 'K') return c + 273.15;
  }
  const u = CONV[cat].units;
  return v * u[from] / u[to];
}
function setupConvert() {
  const catSel = $('convCat'), fromSel = $('convFrom'), toSel = $('convTo'), valIn = $('convVal'), resEl = $('convResult'), tableEl = $('convTable');
  if (!catSel) return;
  catSel.innerHTML = Object.entries(CONV).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
  function refreshUnits() {
    const cat = catSel.value;
    let units;
    if (cat === 'temperatura') units = ['C','F','K'];
    else units = Object.keys(CONV[cat].units);
    fromSel.innerHTML = units.map(u=>`<option value="${u}">${u}</option>`).join('');
    toSel.innerHTML = units.map(u=>`<option value="${u}">${u}</option>`).join('');
    fromSel.value = CONV[cat].defFrom; toSel.value = CONV[cat].defTo;
    updateResult(); renderTable();
  }
  function updateResult() {
    const cat = catSel.value, v = parseFloat(valIn.value);
    if (isNaN(v)) { resEl.textContent = '—'; return; }
    const r = convertValue(v, fromSel.value, toSel.value, cat);
    resEl.innerHTML = `<b>${v} ${fromSel.value}</b> = <b class="su-a666e8">${Number.isInteger(r)? r : (+r.toFixed(6)).toString()} ${toSel.value}</b>`;
  }
  function renderTable() {
    const cat = catSel.value;
    if (cat === 'temperatura') {
      tableEl.innerHTML = `<table class="conv-ref"><tr><th>Desde</th><th>→ C</th><th>→ F</th><th>→ K</th></tr>
        <tr><td>0 C</td><td>0</td><td>32 F</td><td>273.15 K</td></tr>
        <tr><td>100 C</td><td>100</td><td>212 F</td><td>373.15 K</td></tr>
        <tr><td>32 F</td><td>0 C</td><td>32</td><td>273.15 K</td></tr></table>`;
      return;
    }
    const units = Object.keys(CONV[cat].units);
    let h = `<table class="conv-ref"><tr><th>1 unidad</th>${units.map(u=>`<th>${u}</th>`).join('')}</tr>`;
    for (const u of units.slice(0,5)) {
      h += `<tr><td><b>1 ${u}</b></td>${units.map(v=>`<td>${(+convertValue(1,u,v,cat).toFixed(4)).toString()}</td>`).join('')}</tr>`;
    }
    h += '</table><p class="muted su-e13d76">Tabla recortada a 5 filas. Usa el conversor arriba para cualquier par.</p>';
    tableEl.innerHTML = h;
  }
  catSel.onchange = refreshUnits;
  fromSel.onchange = updateResult; toSel.onchange = updateResult; valIn.oninput = updateResult;
  $('convSwap').onclick = () => { const a = fromSel.value; fromSel.value = toSel.value; toSel.value = a; updateResult(); };
  refreshUnits();
}
if ($('btnConvert')) {
  $('btnConvert').onclick = () => { setupConvert(); $('convertDialog').showModal(); };
  if ($('convertClose')) $('convertClose').onclick = () => $('convertDialog').close();
  if ($('convertCloseTop')) $('convertCloseTop').onclick = () => $('convertDialog').close();
}

// === CRONÓMETRO Y TEMPORIZADOR ===
let chronoInt = null, chronoElapsed = 0, chronoStartAt = 0, chronoRunning = false;
function chronoFmt(ms) {
  const h = Math.floor(ms/3600000), m = Math.floor(ms%3600000/60000), s = Math.floor(ms%60000/1000), d = Math.floor(ms%1000/100);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${d}`;
}
function chronoTick() { const now = Date.now(); const el = $('chronoDisplay'); if (el) el.textContent = chronoFmt(chronoElapsed + (chronoRunning ? now - chronoStartAt : 0)); }
function setupTimerDialog() {
  const tabs = [['tabClock','clockPanel'],['tabWorld','worldPanel'],['tabChrono','chronoPanel'],['tabCount','countPanel'],['tabGuide','guidePanel']];
  if (!$('tabClock') && !$('tabChrono')) return;
  function showTab(id) {
    tabs.forEach(([t,p]) => {
      const b = $(t), pn = $(p);
      if (!b || !pn) return;
      const on = (t === id);
      b.classList.toggle('btn-accent', on);
      pn.classList.toggle('hidden', !on);
    });
  }
  tabs.forEach(([t]) => { const b = $(t); if (b) b.onclick = () => showTab(t); });
  if ($('chronoStart')) $('chronoStart').onclick = () => {
    if (!chronoRunning) { chronoRunning = true; chronoStartAt = Date.now(); chronoInt = setInterval(chronoTick, 80); $('chronoStart').textContent = '⏸ Pausa'; }
    else { chronoRunning = false; chronoElapsed += Date.now() - chronoStartAt; clearInterval(chronoInt); $('chronoStart').textContent = '▶ Reanudar'; }
  };
  if ($('chronoLap')) $('chronoLap').onclick = () => {
    const ms = chronoElapsed + (chronoRunning ? Date.now() - chronoStartAt : 0);
    const div = document.createElement('div'); div.className = 'chrono-lap'; div.textContent = `Vuelta ${$('chronoLaps').children.length+1} — ${chronoFmt(ms)}`;
    $('chronoLaps').prepend(div);
  };
  if ($('chronoReset')) $('chronoReset').onclick = () => { clearInterval(chronoInt); chronoRunning=false; chronoElapsed=0; chronoStartAt=0; chronoTick(); $('chronoStart').textContent='▶ Iniciar'; $('chronoLaps').innerHTML=''; };
  // countdown
  let countInt=null, countRem=0, countRunning=false;
  function countFmt(s) { const h=Math.floor(s/3600), m=Math.floor(s%3600/60), sec=s%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
  function countShow() { const el=$('countDisplay'); if(el) el.textContent = countFmt(countRem); }
  function countTick() { if(countRem<=0){ clearInterval(countInt); countRunning=false; const cs=$('countStart'); if(cs) cs.textContent='▶ Iniciar'; countShow(); try{ playNotifySound(); }catch{}; try{ if(navigator && navigator.vibrate) navigator.vibrate(300); }catch{}; try{ new Notification('⏱ Temporizador', {body:'¡Tiempo cumplido!', silent:false});}catch{}; return; } countRem--; countShow(); }
  if ($('countStart')) $('countStart').onclick = () => {
    if (!countRunning) {
      if (countRem<=0) { const h=+$('countH').value||0, m=+$('countM').value||0, s=+$('countS').value||0; countRem = h*3600+m*60+s; if(countRem<=0) return; }
      countRunning=true; $('countStart').textContent='⏸ Pausa'; clearInterval(countInt); countInt=setInterval(countTick,1000); countShow();
      try{ if(Notification&&Notification.requestPermission) Notification.requestPermission(); }catch{}
    } else { clearInterval(countInt); countRunning=false; $('countStart').textContent='▶ Reanudar'; }
  };
  if ($('countPause')) $('countPause').onclick = () => { clearInterval(countInt); countRunning=false; const cs=$('countStart'); if(cs) cs.textContent='▶ Reanudar'; };
  if ($('countReset')) $('countReset').onclick = () => { clearInterval(countInt); countRunning=false; countRem=0; const cs=$('countStart'); if(cs) cs.textContent='▶ Iniciar'; countShow(); };
  ['countH','countM','countS'].forEach(id=>{ const el=$(id); if(el && !el.dataset.bound) { el.dataset.bound='1'; el.oninput=()=>{ if(!countRunning){ const h=+$('countH').value||0, m=+$('countM').value||0, s=+$('countS').value||0; countRem=h*3600+m*60+s; countShow(); } }; } });
  document.querySelectorAll('[data-count-preset]').forEach(b => {
    if (b.dataset.bound) return; b.dataset.bound = '1';
    b.onclick = (e) => {
      e.preventDefault();
      const mins = parseInt(b.dataset.countPreset, 10) || 0;
      const h = Math.floor(mins / 60), m = mins % 60;
      if ($('countH')) $('countH').value = h;
      if ($('countM')) $('countM').value = m;
      if ($('countS')) $('countS').value = 0;
      clearInterval(countInt); countRunning = false;
      countRem = mins * 60; countShow();
      const cs = $('countStart'); if (cs) cs.textContent = '▶ Iniciar';
      showTab('tabCount');
    };
  });
  // === RELOJ LOCAL ===
  function paintLocalClock() {
    const now = new Date();
    const d = $('localClockDisplay');
    if (d) d.textContent = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const df = $('localClockDate');
    if (df) { try { let s = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now); df.textContent = s.charAt(0).toUpperCase() + s.slice(1); } catch {} }
    const z = $('localClockZone');
    if (z) { try { z.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone + ' · ' + now.toLocaleTimeString('es-CL', { timeZoneName: 'short' }).split(' ').pop(); } catch { z.textContent = ''; } }
    const utc = $('localUtcChip');
    if (utc) { const off = -now.getTimezoneOffset() / 60; utc.textContent = 'UTC' + (off >= 0 ? '+' + off : off); }
    const ux = $('localUnixChip');
    if (ux) ux.textContent = '⏱ ' + Math.floor(now.getTime() / 1000) + ' s Unix';
  }
  // === HORA MUNDIAL ===
  const WORLD_ZONES = [
    { id: 'santiago', tz: 'America/Santiago', label: 'Santiago · Chile', flag: '🇨🇱' },
    { id: 'easter', tz: 'Pacific/Easter', label: 'Rapa Nui · Chile', flag: '🗿' },
    { id: 'ba', tz: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires · Argentina', flag: '🇦🇷' },
    { id: 'lima', tz: 'America/Lima', label: 'Lima · Perú', flag: '🇵🇪' },
    { id: 'bogota', tz: 'America/Bogota', label: 'Bogotá · Colombia', flag: '🇨🇴' },
    { id: 'cdmx', tz: 'America/Mexico_City', label: 'Ciudad de México · México', flag: '🇲🇽' },
    { id: 'ny', tz: 'America/New_York', label: 'Nueva York · EE.UU.', flag: '🇺🇸' },
    { id: 'la', tz: 'America/Los_Angeles', label: 'Los Ángeles · EE.UU.', flag: '🌴' },
    { id: 'sf', tz: 'America/Los_Angeles', label: 'San Francisco · EE.UU.', flag: '🌉' },
    { id: 'honolulu', tz: 'Pacific/Honolulu', label: 'Honolulu · EE.UU.', flag: '🌺' },
    { id: 'azores', tz: 'Atlantic/Azores', label: 'Azores · Portugal', flag: '🇵🇹' },
    { id: 'madrid', tz: 'Europe/Madrid', label: 'Madrid · España', flag: '🇪🇸' },
    { id: 'london', tz: 'Europe/London', label: 'Londres · Reino Unido', flag: '🇬🇧' },
    { id: 'berlin', tz: 'Europe/Berlin', label: 'Berlín · Alemania', flag: '🇩🇪' },
    { id: 'joburg', tz: 'Africa/Johannesburg', label: 'Johannesburgo · Sudáfrica', flag: '🇿🇦' },
    { id: 'dubai', tz: 'Asia/Dubai', label: 'Dubái · EAU', flag: '🇦🇪' },
    { id: 'delhi', tz: 'Asia/Kolkata', label: 'Nueva Delhi · India', flag: '🇮🇳' },
    { id: 'beijing', tz: 'Asia/Shanghai', label: 'Pekín · China', flag: '🇨🇳' },
    { id: 'tokyo', tz: 'Asia/Tokyo', label: 'Tokio · Japón', flag: '🇯🇵' },
    { id: 'sydney', tz: 'Australia/Sydney', label: 'Sídney · Australia', flag: '🇦🇺' },
    { id: 'auckland', tz: 'Pacific/Auckland', label: 'Auckland · N. Zelanda', flag: '🇳🇿' }
  ];
  const LS_KEY = 't13_worldClocks_v1';
  function tzOffsetMin(date, tz) {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const p = Object.fromEntries(dtf.formatToParts(date).map(x => [x.type, x.value]));
      const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
      return Math.round((asUTC - date.getTime()) / 60000);
    } catch { return 0; }
  }
  function fmtInZone(date, tz, opts) { try { return new Intl.DateTimeFormat('es-CL', Object.assign({ timeZone: tz }, opts)).format(date); } catch { return '—'; } }
  function zoneById(key) { return WORLD_ZONES.find(z => z.id === key) || null; }
  function resolveTZ(key) { const z = zoneById(key); if (z) return z.tz; const byTz = WORLD_ZONES.find(z => z.tz === key); if (byTz) return byTz.tz; return key; }
  function zoneMeta(key) {
    const z = zoneById(key);
    if (z) return z;
    const byTz = WORLD_ZONES.find(x => x.tz === key);
    if (byTz) return byTz;
    return { id: key, tz: key, label: String(key).replace(/_/g, ' '), flag: '🌍' };
  }
  function normWorldKey(k) {
    if (typeof k !== 'string') return null;
    if (zoneById(k)) return k;
    const byTz = WORLD_ZONES.find(z => z.tz === k);
    if (byTz) return byTz.id;
    return k;
  }
  function getWorldList() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) {
          const norm = arr.map(normWorldKey).filter(Boolean);
          if (norm.length) return [...new Set(norm)];
        }
      }
    } catch {}
    return ['santiago', 'easter', 'ba', 'cdmx', 'bogota', 'madrid', 'ny', 'tokyo'];
  }
  function setWorldList(arr) { try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {} }
  function paintWorld() {
    const box = $('worldList'); if (!box) return;
    const now = new Date();
    const localOff = -now.getTimezoneOffset();
    const list = getWorldList();
    box.innerHTML = '';
    list.forEach(key => {
      const meta = zoneMeta(key);
      const tz = meta.tz || key;
      const time = fmtInZone(now, tz, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      const fecha = fmtInZone(now, tz, { weekday: 'short', day: '2-digit', month: '2-digit' });
      const off = tzOffsetMin(now, tz);
      const diffH = (off - localOff) / 60;
      const diffTxt = diffH === 0 ? 'misma hora' : ((diffH > 0 ? '+' : '') + (Number.isInteger(diffH) ? diffH : diffH.toFixed(1)) + ' h');
      let hour = 12; try { hour = +fmtInZone(now, tz, { hour: 'numeric', hour12: false }); } catch {}
      const icon = (hour >= 7 && hour < 19) ? '☀️' : '🌙';
      const card = document.createElement('div'); card.className = 'world-card';
      const top = document.createElement('div'); top.className = 'wc-top';
      const nm = document.createElement('div'); nm.className = 'wc-name'; nm.textContent = meta.flag + ' ' + meta.label;
      const del = document.createElement('button'); del.type = 'button'; del.className = 'wc-del'; del.title = 'Quitar'; del.textContent = '✕';
      del.onclick = (e) => { e.preventDefault(); setWorldList(getWorldList().filter(x => x !== key)); paintWorld(); };
      top.appendChild(nm); top.appendChild(del);
      const tm = document.createElement('div'); tm.className = 'wc-time'; tm.textContent = icon + ' ' + time;
      const sb = document.createElement('div'); sb.className = 'wc-sub'; sb.textContent = fecha + ' · ' + diffTxt + ' vs tu hora';
      card.appendChild(top); card.appendChild(tm); card.appendChild(sb);
      box.appendChild(card);
    });
  }
  function fillZoneSelects() {
    const sel = $('worldAddSelect'), cf = $('convFrom'), ct = $('convTo');
    const localTZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'America/Santiago'; } })();
    [sel, cf, ct].forEach(s => {
      if (!s || s.dataset.filled) return; s.dataset.filled = '1'; s.innerHTML = '';
      WORLD_ZONES.forEach(z => {
        const o = document.createElement('option'); o.value = z.id; o.textContent = z.flag + ' ' + z.label;
        s.appendChild(o);
      });
      if (!WORLD_ZONES.some(z => z.tz === localTZ)) { const o = document.createElement('option'); o.value = localTZ; o.textContent = '📍 ' + localTZ; s.appendChild(o); }
    });
    if (cf && !cf.dataset.def) { cf.dataset.def = '1'; const loc = WORLD_ZONES.find(z => z.tz === localTZ); cf.value = loc ? loc.id : localTZ; }
    if (ct && !ct.dataset.def) { ct.dataset.def = '1'; ct.value = 'madrid'; }
  }
  if ($('worldAddBtn') && !$('worldAddBtn').dataset.bound) {
    $('worldAddBtn').dataset.bound = '1';
    $('worldAddBtn').onclick = (e) => {
      e.preventDefault();
      const v = $('worldAddSelect') ? $('worldAddSelect').value : null;
      if (!v) return;
      const cur = getWorldList();
      if (!cur.includes(v)) { cur.push(v); setWorldList(cur); }
      paintWorld();
    };
  }
  if ($('worldResetBtn') && !$('worldResetBtn').dataset.bound) {
    $('worldResetBtn').dataset.bound = '1';
    $('worldResetBtn').onclick = (e) => { e.preventDefault(); try { localStorage.removeItem(LS_KEY); } catch {} paintWorld(); };
  }
  function wallToUTC(y, mo, d, H, Mi, tz) {
    let guess = Date.UTC(y, mo, d, H, Mi);
    for (let i = 0; i < 2; i++) { const off = tzOffsetMin(new Date(guess), tz); guess = Date.UTC(y, mo, d, H, Mi) - off * 60000; }
    return guess;
  }
  function doConvert() {
    const box = $('convResult'); if (!box) return;
    const tv = $('convTime') ? $('convTime').value : '';
    const from = $('convFrom') ? $('convFrom').value : '';
    const to = $('convTo') ? $('convTo').value : '';
    if (!tv || !from || !to) { box.textContent = 'Elige hora y zonas para convertir.'; return; }
    const [H, Mi] = tv.split(':').map(Number);
    const now = new Date();
    const fromTZ = resolveTZ(from), toTZ = resolveTZ(to);
    const utc = wallToUTC(now.getFullYear(), now.getMonth(), now.getDate(), H, Mi, fromTZ);
    const offTo = tzOffsetMin(new Date(utc), toTZ);
    const tgt = new Date(utc + offTo * 60000);
    const hh = String(tgt.getUTCHours()).padStart(2, '0'), mm = String(tgt.getUTCMinutes()).padStart(2, '0');
    const dayDiff = Math.round((Date.UTC(tgt.getUTCFullYear(), tgt.getUTCMonth(), tgt.getUTCDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    const dd = dayDiff === 0 ? 'mismo día' : (dayDiff > 0 ? '+' + dayDiff + ' día' : dayDiff + ' día');
    const mf = zoneMeta(from), mt = zoneMeta(to);
    box.innerHTML = `<b>${String(H).padStart(2, '0')}:${String(Mi).padStart(2, '0')}</b> en ${mf.flag} ${mf.label} = <b>${hh}:${mm}</b> en ${mt.flag} ${mt.label} <span class="muted">(${dd})</span>`;
  }
  if ($('convCalcBtn') && !$('convCalcBtn').dataset.bound) { $('convCalcBtn').dataset.bound = '1'; $('convCalcBtn').onclick = (e) => { e.preventDefault(); doConvert(); }; }
  if (window._t13clockInt) { try { clearInterval(window._t13clockInt); } catch {} }
  fillZoneSelects(); paintLocalClock(); paintWorld();
  window._t13clockInt = setInterval(() => {
    const dlg = $('timerDialog');
    if (dlg && dlg.open) { paintLocalClock(); paintWorld(); }
  }, 1000);
  countShow(); chronoTick(); showTab('tabClock');
}
if ($('btnTimer')) {
  $('btnTimer').onclick = () => { setupTimerDialog(); $('timerDialog').showModal(); };
  if ($('timerClose')) $('timerClose').onclick = () => $('timerDialog').close();
  if ($('timerCloseTop')) $('timerCloseTop').onclick = () => $('timerDialog').close();
}

(async function init() {
  try { DATA = JSON.parse(await window.api.loadData()); } catch { DATA = {}; }
  if (!DATA.cycles && !DATA.usuarios) DATA.cycles = {};
  if (!DATA.usuarios) {
    DATA.usuarios = [{ id: 'u1', nombre: 'Principal' }];
    DATA.actual = 'u1';
    DATA.notas = { u1: { cycles: DATA.cycles || {} } };
    delete DATA.cycles;
    scheduleSave();
  }
  if (!DATA.notas) DATA.notas = {};
  if (!DATA.notas[DATA.actual]) DATA.notas[DATA.actual] = { cycles: {} };

  const now = new Date();
  const thisYear = now.getFullYear();
  CYCLE_YEARS = [];
  for (let y = thisYear - 2; y <= thisYear + 4; y++) CYCLE_YEARS.push(y);

  const info = todayInfo();
  const startY = info ? info.y : (now.getMonth() >= 5 ? thisYear : thisYear - 1);
  cycle = cal.buildCycle(startY);
  phaseMap = cal.phasesByDay(cycle.start, cycle.start + 365 * 86400000);

  rebuildLunaByKey();
  setupViewBar();
  try{ setupMobileDock(); }catch(e){}
  try{ setupLunaPager(); }catch(e){}
  updateViewButtons();
  buildSidebar();
  if (info) {
    if (info.luna === 'dft') selectDFT(); else selectMoon(info.luna);
  } else {
    selectMoon(1);
  }
  // Entrada: respeta 🏠 Pantalla de inicio (vista inicial elegida en Personalizar)
  try{
    let applied = false;
    try { applied = applyStartView(info); } catch (e) { applied = false; }
    if(!applied){
      if(isMobileWidth() && info){
        if(String(info.y)!==String(startY)){
          try{ selectCycle(info.y, info.luna==='dft'?'dft':info.luna); }catch(e){}
        }
        mobileSec='hoy';
        viewMode='hoy';
        renderCurrentView();
      } else { mobileSec=null; syncMobileViewAttr(); }
    }
  }catch(e){}
  $('cycleSel').value = String(startY);
  try { hideBootSplash(); } catch {}
  updateRemindBtn();
  const savedTheme = getTheme();
  applyTheme(savedTheme);
  setupThemeSelector();
  applyVisibility();
  try{ if(typeof applySecciones==='function') applySecciones(); }catch(e){}
  setTimeout(checkReminders, 3000);
  setTimeout(()=>{ try{ mensCheckNotify(); }catch{} }, 4500);
  try {
    if (window.api && window.api.dataPath) {
      window.api.dataPath().then(p => {
        if ($('dataInfo')) $('dataInfo').textContent = 'Tus notas se guardan en: ' + p;
      }).catch(() => {});
    }
  } catch {}
})();
// Si algo crítico falla al arrancar, mostrarlo en vez de dejar pantalla vacía
window.addEventListener('error', (e) => {
  try {
    if (document.getElementById('grid') && document.getElementById('grid').children.length) return;
    if (document.getElementById('lunaTitle') && /Luna|Hoy|Semana|Mes/.test(document.getElementById('lunaTitle').textContent || '')) return;
  } catch {}
});
