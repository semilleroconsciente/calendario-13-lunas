let DATA = {};
let CYCLE_YEARS = [];
let cycle = null;
let currentView = { tipo: 'luna', luna: 1 };
let phaseMap = {};
let saveTimer = null;

const $ = id => document.getElementById(id);

// === SONIDO DE NOTIFICACIÓN ===
let _notifyAudio = null;
function getNotifyAudio(){
  if(_notifyAudio) return _notifyAudio;
  try{
    _notifyAudio = new Audio('assets/notify.mp3');
    _notifyAudio.preload='auto';
    _notifyAudio.volume=0.9;
  }catch(e){ _notifyAudio=null; }
  return _notifyAudio;
}
function playNotifySound(){
  try{
    const a=getNotifyAudio();
    if(!a) return;
    a.currentTime=0;
    const p=a.play();
    if(p && p.catch) p.catch(()=>{});
  }catch(e){}
  try{ if(navigator.vibrate) navigator.vibrate([400,200,400]); }catch(e){}
}
// desbloquear audio en primer gesto (autoplay policy móvil)
try{
  const unlock=()=>{
    const a=getNotifyAudio();
    if(a){
      a.muted=true;
      const p=a.play();
      if(p && p.then) p.then(()=>{ a.pause(); a.currentTime=0; a.muted=false; }).catch(()=>{ a.muted=false; });
    }
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
  };
  document.addEventListener('click', unlock, {once:true});
  document.addEventListener('touchstart', unlock, {once:true});
}catch(e){}

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

function scheduleSave(msg) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await window.api.saveData(JSON.stringify(DATA));
    $('statusMsg').textContent = msg || 'Guardado ✓';
    setTimeout(() => { $('statusMsg').textContent = ''; }, 1800);
  }, 400);
}

function todayInfo() {
  const nowKey = cal.fmtKey.format(new Date());
  for (const y of CYCLE_YEARS) {
    const c = cal.buildCycle(y);
    for (const d of c.days) {
      if (cal.fmtKey.format(new Date(d.noonMs)) === nowKey) return { y, ...d };
    }
  }
  return null;
}

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
  markActiveNav('luna', n);
  renderLuna();
}

function selectDFT() {
  currentView = { tipo: 'dft', luna: null };
  markActiveNav('dft', null);
  renderDFT();
}

function seasonChip(el, estKey) {
  const s = ESTACIONES[estKey];
  el.textContent = s.nombre;
  el.style.background = s.color;
  el.title = s.desc;
}

function renderLuna() {
  const meta = MOONS[currentView.luna - 1];
  const lunaDays = cycle.days.filter(d => d.luna === meta.n);
  const first = lunaDays[0], last = lunaDays[27];

  document.body.dataset.tema = meta.estacion;
  // respetar tema manual si no es auto
  const curTheme = getTheme();
  if (curTheme !== 'auto') document.body.setAttribute('data-theme', curTheme);
  else document.body.removeAttribute('data-theme');
  $('monthNoteWrap').style.display = '';
  $('grid').style.display = '';
  document.querySelector('#monthNoteWrap label').textContent = 'NOTAS DE LA LUNA';
  $('monthNote').placeholder = 'Reflexión o resumen de esta luna completa...';

  seasonChip($('seasonChip'), meta.estacion);
  $('lunaTitle').textContent = `Luna ${meta.n} de 13 · ${meta.nombre}`;
  $('lunaMeta').innerHTML =
    `${cal.weekdayName(first.noonMs)} ${cal.fmtFull.format(new Date(first.noonMs))} — ` +
    `${cal.weekdayName(last.noonMs)} ${cal.fmtFull.format(new Date(last.noonMs))}<br>` +
    `<i>${meta.traduccion}</i>`;
  $('lunaDesc').textContent = meta.descripcion;

  const chips = [];
  for (const d of lunaDays) {
    const key = cal.fmtKey.format(new Date(d.noonMs));
    for (const ev of (phaseMap[key] || [])) chips.push(ev);
  }
  $('phaseChips').innerHTML = chips.length
    ? chips.map(e => `<span class="chip">${e.simbolo} <b>${e.tipo.replace('-', ' ')}</b> · ${cal.fmtTime.format(new Date(e.utcMs))}</span>`).join('')
    : '<span class="chip" style="color:var(--muted)">Sin fases exactas en esta luna</span>';

  const wdNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const firstWd = new Date(cal.santiagoParts(first.noonMs).y, cal.santiagoParts(first.noonMs).m - 1, cal.santiagoParts(first.noonMs).d);
  const startIdx = new Date(Date.UTC(cal.santiagoParts(first.noonMs).y, cal.santiagoParts(first.noonMs).m - 1, cal.santiagoParts(first.noonMs).d)).getUTCDay();
  $('dowRow').innerHTML = Array.from({ length: 7 }, (_, i) =>
    `<div>${wdNames[(startIdx + i) % 7]}</div>`).join('');

  const todayKey = cal.fmtKey.format(new Date());
  const mensMap = (()=>{ try{ const md=getMensData(); if(!md.showCal) return {}; const p=getMensPredictions(); return p ? p.map : {}; }catch{ return {}; } })();
  const habitDataCache = (()=>{ try{ return getHabitData(); }catch{ return { list:[], entries:{} }; } })();
  const grid = $('grid');
  grid.innerHTML = '';
  for (const d of lunaDays) {
    const key = cal.fmtKey.format(new Date(d.noonMs));
    const cell = dayCell(meta.n, d.diaN);
    const sun = cal.sunForDay(d.noonMs);
    const evs = phaseMap[key] || [];
    const efe = EFEMERIDES[key.slice(5)];
    const mood = cell.animo >= 0 ? MOODS[cell.animo] : null;
    const mensType = mensMap[key];
    const mensLabel = mensType==='period' ? '🌸 Período' : mensType==='ovulation' ? '✨ Ovulación' : mensType==='fertile' ? '🌿 Fértil' : '';
    const habitEntry = habitDataCache.entries[key];
    let habitIcons = '';
    if (habitEntry) {
      habitIcons = Object.keys(habitEntry).map(hid=>{
        const h=habitDataCache.list.find(x=>x.id===hid);
        if(!h) return '';
        return `<span class="dc-habit" style="background:${h.color}22;color:${h.color};border-color:${h.color}55" title="${escapeHtml(h.nombre)}">${escapeHtml(h.icono||'✓')}</span>`;
      }).join('');
    }
    const hasHabits = habitIcons ? ' has-habits' : '';
    let hasGym = '';
    let gymIcons = '';
    try{
      const gymDataForCard = getGymData();
      const gymForDay = gymDataForCard.items.filter(it=> parseInt(it.day)===new Date(d.noonMs).getDay());
      gymIcons = gymForDay.map(it=> `<span class="dc-habit" style="background:${it.color}22;color:${it.color};border-color:${it.color}55" title="${escapeHtml(it.name)} ${it.start}-${it.end}">🏋️</span>`).join('');
      hasGym = gymForDay.length ? ' has-gym' : '';
    }catch(e){}
    let birdIcons='', fishIcons='', interIcons='', bosqueIcons='', astroIcons='', comunaIcons='', financeIcons='', homeIcons='';
    try{
      const bd=getBirdData();
      const birdsToday=bd.entries.filter(x=>x.date===key);
      if(birdsToday.length) birdIcons=birdsToday.map(b=> `<span class="dc-habit" style="background:#7ab8ff22;color:#7ab8ff;border-color:#7ab8ff55" title="${escapeHtml(b.species)} ×${b.count}">🦅</span>`).join('');
    }catch(e){}
    try{
      const fl=getFishingLogData();
      const fishToday=fl.filter(x=>x.date===key);
      if(fishToday.length) fishIcons=fishToday.map(f=> `<span class="dc-habit" style="background:#a9d18e22;color:#a9d18e;border-color:#a9d18e55" title="${escapeHtml(f.species)} ${escapeHtml(f.qty)}">🎣</span>`).join('');
    }catch(e){}
    try{
      const id=getIntermarealData(); const interToday=id.entries.filter(x=>x.date===key);
      if(interToday.length) interIcons=interToday.map(r=> `<span class="dc-habit" style="background:#ff8c6a22;color:#ff8c6a;border-color:#ff8c6a55" title="${escapeHtml(r.species)} ${escapeHtml(r.qty||'') } 🦀">🦀</span>`).join('');
    }catch(e){}
    try{
      const bd2=getBosqueData(); const bosqueToday=bd2.entries.filter(x=>x.date===key);
      if(bosqueToday.length) bosqueIcons=bosqueToday.map(r=> `<span class="dc-habit" style="background:#4caf7d22;color:#4caf7d;border-color:#4caf7d55" title="${escapeHtml(r.species)} · ${escapeHtml(r.action||'')}">🌳</span>`).join('');
    }catch(e){}
    try{
      const astroToday=astroVisibleForDate(key);
      if(astroToday.length) astroIcons=astroToday.map(a=> `<span class="dc-habit" style="background:#c9a0dc22;color:#c9a0dc;border-color:#c9a0dc55" title="${escapeHtml(a.nombre)}">🔭</span>`).join('');
    }catch(e){}
    try{
      if(isComunaShowCal()){
        const comToday=getAllComunaEventsForMD(key.slice(5));
        if(comToday.length) comunaIcons=comToday.map(c=> `<span class="dc-habit" style="background:#f0d48822;color:#f0d488;border-color:#f0d48855" title="${escapeHtml(c.nombre)}">🎉</span>`).join('');
      }
    }catch(e){}
    try{
      const fd=getFinanceData();
      const finToday=fd.entries.filter(x=>x.date===key);
      if(finToday.length){
        const totG=finToday.filter(x=>x.tipo==='gasto').reduce((s,x)=>s+(parseInt(x.monto)||0),0);
        const totI=finToday.filter(x=>x.tipo==='ingreso').reduce((s,x)=>s+(parseInt(x.monto)||0),0);
        financeIcons=`<span class="dc-habit" style="background:#e8c56a22;color:#e8c56a;border-color:#e8c56a55" title="${finToday.length} mov. · gastos $${totG.toLocaleString('es-CL')} · ingresos $${totI.toLocaleString('es-CL')}">💰</span>`;
      }
    }catch(e){}
    try{
      const ht=getHomeTasksData();
      const homeToday=homeTasksForDate(key);
      if(homeToday.length){
        const doneCount=homeToday.filter(t=> ht.completions[key] && ht.completions[key][t.id]).length;
        const pending=homeToday.length - doneCount;
        const bg= pending===0 ? '#a9d18e' : '#ffd98a';
        const fg= pending===0 ? '#1a2a1a' : '#4a3410';
        homeIcons=`<span class="dc-habit" style="background:${bg}22;color:${bg};border-color:${bg}55" title="${homeToday.length} tareas hogar · ${doneCount} hechas · ${pending} pendientes">${pending===0?'🏠✓':'🏠'}</span>`;
      }
    }catch(e){}
    let gratIcons='';
    try{
      const gd=getGratitudData(); const g=gd.entries[key];
      if(g && (g.t1||g.t2||g.t3)) gratIcons=`<span class="dc-habit" style="background:#d8a0ff22;color:#d8a0ff;border-color:#d8a0ff55" title="Gratitud: ${escapeHtml([g.t1,g.t2,g.t3].filter(Boolean).join(' · ').slice(0,80))}">✨</span>`;
    }catch(e){}
    const card = document.createElement('div');
    card.className = 'day-card' + (key === todayKey ? ' today' : '') + (mensType ? ' mens-'+mensType : '') + hasHabits + hasGym;
    card.dataset.luna = meta.n;
    card.dataset.dia = d.diaN;
    card.innerHTML = `
      <div class="dc-head"><span class="dc-n">${String(d.diaN).padStart(2, '0')}</span><span class="dc-phases">${evs.map(e => `<span class="dc-phase" title="${e.tipo} ${cal.fmtTime.format(new Date(e.utcMs))}">${e.simbolo}</span>`).join('')}</span><span class="dc-date">${cal.fmtDate.format(new Date(d.noonMs))}</span></div>
      <div class="dc-sun">☀ ${sun.rise ? cal.fmtTime.format(new Date(sun.rise)) : '--'} – ${sun.set ? cal.fmtTime.format(new Date(sun.set)) : '--'}</div>
      ${mensType ? `<div class="dc-mens ${mensType}">${mensLabel}</div>` : ''}
      ${habitIcons ? `<div class="dc-habits">${habitIcons}</div>` : ''}
      ${gymIcons ? `<div class="dc-habits">${gymIcons}</div>` : ''}
      ${birdIcons ? `<div class="dc-habits">${birdIcons}</div>` : ''}
      ${fishIcons ? `<div class="dc-habits">${fishIcons}</div>` : ''}
      ${interIcons ? `<div class="dc-habits">${interIcons}</div>` : ''}
      ${bosqueIcons ? `<div class="dc-habits">${bosqueIcons}</div>` : ''}
      ${astroIcons ? `<div class="dc-habits">${astroIcons}</div>` : ''}
      ${comunaIcons ? `<div class="dc-habits">${comunaIcons}</div>` : ''}
      ${financeIcons ? `<div class="dc-habits">${financeIcons}</div>` : ''}
      ${homeIcons ? `<div class="dc-habits">${homeIcons}</div>` : ''}
      ${gratIcons ? `<div class="dc-habits">${gratIcons}</div>` : ''}
      ${efe ? `<div class="dc-efe" title="${escapeHtml(efe)}">📅 ${escapeHtml(efe)}</div>` : ''}
      ${mood ? `<div class="dc-clima">Ánimo: ${escapeHtml(mood.e)} ${escapeHtml(mood.n)}</div>` : ''}
      ${Array.isArray(cell.agenda)&&cell.agenda.length ? `<div class="dc-clima" title="${escapeHtml(cell.agenda.map(a=>String(a.hour).padStart(2,'0')+':00 '+a.text + (a.notify?' 🔔':'')).join(' · '))}">🕐 ${cell.agenda.length} compromiso${cell.agenda.length>1?'s':''} · ${escapeHtml(cell.agenda.slice(0,2).map(a=>String(a.hour).padStart(2,'0')+':00 '+a.text).join(' · '))}${cell.agenda.length>2?' …':''}</div>` : ''}
      ${cell.nota ? `<div class="dc-note">${escapeHtml(cell.nota.split('\n')[0])}</div>` : (Array.isArray(cell.agenda)&&cell.agenda.length ? `<div class="dc-note">${escapeHtml(cell.agenda[0].text.split('\n')[0])}</div>` : `<div class="dc-note"></div>`)}`;
    card.onclick = () => openDayDialog(meta.n, d.diaN);
    grid.appendChild(card);
  }

  const mn = $('monthNote');
  mn.value = cyc(currentCycleYear()).moons[String(meta.n)].monthNote || '';
  mn.oninput = () => {
    cyc(currentCycleYear()).moons[String(meta.n)].monthNote = mn.value;
    scheduleSave();
  };

}

function renderDFT() {
  document.body.dataset.tema = 'RIMU';
  const curTheme2 = getTheme();
  if (curTheme2 !== 'auto') document.body.setAttribute('data-theme', curTheme2);
  else document.body.removeAttribute('data-theme');
  $('monthNoteWrap').style.display = '';
  seasonChip($('seasonChip'), 'RIMU');
  $('seasonChip').textContent = '✷ Día Fuera del Tiempo';
  const dftDay = cycle.days.find(d => d.luna === 'dft');
  const prev = MOONS[12];
  $('lunaTitle').textContent = DFT.titulo;
  $('lunaMeta').innerHTML =
    `${cal.weekdayName(dftDay.noonMs)} ${cal.fmtFull.format(new Date(dftDay.noonMs))} — tras ${prev.nombre}`;
  $('lunaDesc').textContent = '';
  $('phaseChips').innerHTML = '';

  const sun = cal.sunForDay(dftDay.noonMs);
  const grid = $('grid');
  grid.style.display = 'block';
  $('dowRow').innerHTML = '';
  const key = cal.fmtKey.format(new Date(dftDay.noonMs));
  const evs = phaseMap[key] || [];
  const frDft = window.fraseDFT || (window.frases ? window.frases[364] : null);
  grid.innerHTML = `
    <div class="day-card today" style="max-width:520px">
      <div class="dc-head"><span class="dc-n">365</span><span class="dc-date">${cal.fmtDate.format(new Date(dftDay.noonMs))}</span></div>
      <div class="dc-sun">☀ ${sun.rise ? cal.fmtTime.format(new Date(sun.rise)) : '--'} – ${sun.set ? cal.fmtTime.format(new Date(sun.set)) : '--'}</div>
      ${frDft ? `<blockquote class="dlg-quote">«${frDft.t}»<span class="q-a">— ${frDft.a}</span></blockquote>` : ''}
      <div style="margin-top:10px;line-height:1.6;font-size:13px;color:#cdd3ee">${DFT.texto1}</div>
      <p style="margin-top:10px;color:var(--accent);font-size:14px"><b>${DFT.sub2}</b></p>
      <p style="margin-top:6px;line-height:1.55;font-size:13px;color:#cdd3ee">${DFT.texto2}</p>
      <p style="margin-top:6px;line-height:1.55;font-size:13px;color:#cdd3ee">${DFT.texto3}</p>
      <p style="margin-top:10px;color:var(--accent);font-size:14px"><b>${DFT.sub3}</b></p>
      <p style="margin-top:6px;line-height:1.55;font-size:13px;color:#cdd3ee">${DFT.texto4}</p>
      <p style="line-height:1.55;font-size:13px;color:#cdd3ee">${DFT.texto5}</p>
      <p style="margin-top:6px;line-height:1.55;font-size:13px;color:#cdd3ee">${DFT.texto6}</p>
      ${evs.map(e => `<div class="dc-tide" style="margin-top:8px">${e.simbolo} ${e.tipo.replace('-', ' ')} · ${cal.fmtTime.format(new Date(e.utcMs))}</div>`).join('')}
    </div>`;

  const mnLabel = document.querySelector('#monthNoteWrap label');
  mnLabel.textContent = 'REFLEXIÓN DEL CICLO COMPLETO';
  const mn = $('monthNote');
  mn.value = cyc(currentCycleYear()).dft.nota || '';
  mn.placeholder = 'Qué cambió, qué quieres soltar, qué esperas del año que comienza...';
  mn.oninput = () => {
    cyc(currentCycleYear()).dft.nota = mn.value;
    scheduleSave();
  };

  const nextY = currentCycleYear() + 1;
  const footer = document.createElement('div');
  footer.style.cssText = 'margin-top:14px;color:var(--gold);font-size:15px';
  footer.textContent = `Nuevo We Tripantu: 21 jun ${nextY} — comienza un nuevo ciclo de 13 lunas`;
  grid.appendChild(footer);
}

let editing = null;
let pendingMood = -1;

// === NOTAS DEL DÍA POR HORAS + AGENDA ===
function ensureHourSel() {
  const sel = $('dlgHourSel');
  if (!sel || sel.options.length) return;
  for (let h=0; h<24; h++) {
    const o = document.createElement('option');
    o.value = String(h);
    o.textContent = String(h).padStart(2,'0') + ':00';
    sel.appendChild(o);
  }
  const now = new Date();
  const cur = now.getHours();
  sel.value = String(cur);
}
function renderDlgHoras() {
  const grid = $('dlgHorasGrid');
  if (!grid || !editing) return;
  const cell = dayCell(editing.lunaN, editing.diaN);
  if (!Array.isArray(cell.agenda)) cell.agenda = [];
  // ordenar por hora
  const sorted = [...cell.agenda].sort((a,b)=> a.hour-b.hour || (a.id||'').localeCompare(b.id||''));
  if (!sorted.length) {
    grid.innerHTML = '<p class="muted" style="font-size:11px;padding:8px;border:1px dashed var(--line);border-radius:8px;text-align:center">Sin compromisos aún. Agrega uno por hora abajo.</p>';
    return;
  }
  // agrupar por hora
  const byHour = {};
  sorted.forEach(it=> { if(!byHour[it.hour]) byHour[it.hour]=[]; byHour[it.hour].push(it); });
  const hours = Object.keys(byHour).map(Number).sort((a,b)=>a-b);
  grid.innerHTML = hours.map(h=>{
    const items = byHour[h];
    return `<div class="hora-block"><div class="hora-label">🕐 ${String(h).padStart(2,'0')}:00 <span class="muted" style="font-size:10px">· ${items.length} ${items.length===1?'compromiso':'compromisos'}</span></div>` +
      items.map(it=>`<div class="hora-item"><span class="hora-text">${escapeHtml(it.text)}</span><span class="hora-actions"><span class="chip" style="font-size:10px;padding:2px 6px">${it.notify?'🔔':'🔕'}</span><button type="button" class="btn btn-icon hora-notify" data-id="${it.id}" title="${it.notify?'Desactivar':'Activar'} notificación">${it.notify?'🔔':'🔕'}</button><button type="button" class="btn btn-icon hora-del" data-id="${it.id}" title="Eliminar">✕</button></span></div>`).join('') + `</div>`;
  }).join('');
  grid.querySelectorAll('.hora-del').forEach(b=> b.onclick=()=>{
    const id=b.dataset.id;
    const c=dayCell(editing.lunaN, editing.diaN);
    c.agenda=c.agenda.filter(x=>x.id!==id);
    scheduleSave(); renderDlgHoras(); if(currentView.tipo==='luna') renderLuna();
  });
  grid.querySelectorAll('.hora-notify').forEach(b=> b.onclick=async()=>{
    const id=b.dataset.id;
    const c=dayCell(editing.lunaN, editing.diaN);
    const it=c.agenda.find(x=>x.id===id); if(!it) return;
    if (!it.notify) {
      try{ if(typeof Notification!=='undefined' && Notification.permission!=='granted' && Notification.requestPermission) await Notification.requestPermission(); }catch{}
    }
    it.notify=!it.notify;
    it.notified=false;
    scheduleSave(); renderDlgHoras();
  });
}
function agendaCheckNotify() {
  if (typeof Notification==='undefined' || Notification.permission!=='granted') return;
  const now = new Date();
  const todayKey = cal.fmtKey.format(now);
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();
  try{
    const cycles = (userData().cycles)||{};
    for(const y of Object.keys(cycles)){
      const c=cycles[y];
      for(const mk of Object.keys(c.moons||{})){
        for(const dk of Object.keys(c.moons[mk].days||{})){
          const cell=c.moons[mk].days[dk];
          if(!cell||!Array.isArray(cell.agenda)||!cell.agenda.length) continue;
          // reconstruir fecha de esa luna/dia -> buscar en cycle actual o reconstruir via cal.buildCycle
          // buscar día gregoriano correspondiente
          let foundMs=null;
          try{
            const cy=cal.buildCycle(parseInt(y));
            const dd=cy.days.find(x=> String(x.luna)===String(mk) && x.diaN===parseInt(dk));
            if(dd) foundMs=dd.noonMs;
          }catch{}
          if(!foundMs) continue;
          const key=cal.fmtKey.format(new Date(foundMs));
          if(key!==todayKey) continue;
          cell.agenda.forEach(it=>{
            if(!it.notify || it.notified) return;
            if(it.hour===nowHour && nowMin===0){
              try{ playNotifySound(); new Notification(`⏰ ${String(it.hour).padStart(2,'0')}:00 — ${it.text}`, { body: `Luna ${mk} · Día ${dk} — ${it.text}`, silent:false}); }catch{}
              it.notified=true;
            } else if(it.hour < nowHour) {
              // si ya pasó y no se notificó, marcar para no repetir hoy
              // no hacer nada, dejar notified false hasta medianoche? simplemente no notificar tarde
            }
          });
        }
      }
    }
    // guardar marca notified sin spam guardar frecuente
    // scheduleSave ligero
    scheduleSave();
  }catch(e){}
}
setInterval(()=>{ try{ agendaCheckNotify(); }catch{} }, 60000);
function setupDlgHorasAdd(){
  const btn=$('dlgHourAdd'); if(!btn) return;
  btn.onclick=async()=>{
    const sel=$('dlgHourSel'); const txtEl=$('dlgHourText'); const chk=$('dlgHourNotify');
    if(!editing) return;
    const hour=parseInt(sel.value); const text=sanitizeText((txtEl.value||'').trim(),80);
    if(!text) return;
    const notify=!!(chk && chk.checked);
    if(notify){
      try{ if(typeof Notification!=='undefined' && Notification.permission!=='granted' && Notification.requestPermission) await Notification.requestPermission(); }catch{}
    }
    const cell=dayCell(editing.lunaN, editing.diaN);
    if(!Array.isArray(cell.agenda)) cell.agenda=[];
    cell.agenda.push({ id:'a'+Date.now()+Math.random().toString(36).slice(2,4), hour, text, notify, notified:false });
    scheduleSave();
    txtEl.value=''; if(chk) chk.checked=false;
    renderDlgHoras(); if(currentView.tipo==='luna') renderLuna();
  };
  const txtEl2=$('dlgHourText');
  if(txtEl2) txtEl2.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); $('dlgHourAdd').click(); } });
}
setTimeout(setupDlgHorasAdd, 500);

function openDayDialog(lunaN, diaN) {
  editing = { lunaN, diaN };
  const cell = dayCell(lunaN, diaN);
  const d = cycle.days.find(x => x.luna === lunaN && x.diaN === diaN);
  const meta = MOONS[lunaN - 1];
  const idx = (lunaN - 1) * 28 + (diaN - 1);
  const fr = window.frases ? window.frases[idx] : null;
  $('dlgQuote').innerHTML = fr ? `«${fr.t}»<span class="q-a">— ${fr.a}</span>` : '';
  const efe = EFEMERIDES[cal.fmtKey.format(new Date(d.noonMs)).slice(5)];
  $('dlgTitle').textContent = `Luna ${lunaN} · Día ${diaN} de 28`;
  $('dlgDate').textContent = `${meta.nombre} — ${cal.weekdayName(d.noonMs)} ${cal.fmtFull.format(new Date(d.noonMs))}${efe ? ' · 📅 ' + efe : ''}`;

  pendingMood = cell.animo;
  const moodBox = $('dlgMood');
  moodBox.innerHTML = '';
  MOODS.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mood-btn' + (i === pendingMood ? ' sel' : '');
    b.title = m.n;
    b.textContent = m.e;
    b.onclick = () => {
      pendingMood = pendingMood === i ? -1 : i;
      moodBox.querySelectorAll('.mood-btn').forEach((x, k) => x.classList.toggle('sel', k === pendingMood));
    };
    moodBox.appendChild(b);
  });

  ensureHourSel();
  // Notas del día (textarea libre) — mantener separado de compromisos por hora
  const notaEl = $('fNota');
  if (notaEl) notaEl.value = cell.nota || '';
  $('dlgHourText').value = '';
  $('dlgHourNotify').checked = false;
  renderDlgHoras();
  // botón menstrual en dialog día — ocultar si opción está desactivada en Personalizar
  const mensBtn = $('dlgMenstrual');
  if (mensBtn) {
    const vis = (typeof getVisibleConfig==='function') ? getVisibleConfig() : null;
    const showMens = !vis || vis['btnMenstrual']!==false;
    const dlgKey = cal.fmtKey.format(new Date(d.noonMs));
    const md = getMensData();
    const isStart = md.history.includes(dlgKey);
    mensBtn.style.display = showMens ? '' : 'none';
    mensBtn.textContent = isStart ? '🌸 Quitar inicio ciclo' : '🌸 Marcar inicio ciclo';
    mensBtn.classList.toggle('btn-accent', isStart);
    mensBtn.onclick = () => {
      const md2 = getMensData();
      if (md2.history.includes(dlgKey)) md2.history = md2.history.filter(k=>k!==dlgKey);
      else { md2.history.push(dlgKey); md2.history.sort(); }
      scheduleSave();
      mensBtn.textContent = md2.history.includes(dlgKey) ? '🌸 Quitar inicio ciclo' : '🌸 Marcar inicio ciclo';
      mensBtn.classList.toggle('btn-accent', md2.history.includes(dlgKey));
      renderMensHistory(); renderMensPredictBox(); renderMensLunaBox();
      if (md2.showCal) renderLuna();
    };
  }
  $('dayDialog').showModal();
}

$('dlgCancel').onclick = () => $('dayDialog').close();
const _dlgCloseTop = $('dlgCloseTop'); if (_dlgCloseTop) _dlgCloseTop.onclick = () => $('dayDialog').close();
$('dlgSave').onclick = () => {
  const cell = dayCell(editing.lunaN, editing.diaN);
  cell.animo = pendingMood;
  const notaEl = $('fNota');
  if (notaEl) cell.nota = sanitizeText(notaEl.value, 2000);
  // agenda ya se guarda al agregar/eliminar; solo persistir estado actual
  $('dayDialog').close();
  scheduleSave();
  if (currentView.tipo === 'luna') renderLuna();
};

$('dlgShare').onclick = async () => {
  const dataUrl = buildShareImage(editing.lunaN, editing.diaN);
  const fileName = `Luna ${editing.lunaN} · Día ${editing.diaN} de 28.png`;
  const res = await window.api.imageSave(dataUrl, fileName);
  $('statusMsg').textContent = res === 'compartido' ? 'Compartido ✓' : res ? 'Imagen guardada ✓' : 'Cancelado';
  setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
};

function buildShareImage(lunaN, diaN) {
  const cell = dayCell(lunaN, diaN);
  const d = cycle.days.find(x => x.luna === lunaN && x.diaN === diaN);
  const meta = MOONS[lunaN - 1];
  const idx = (lunaN - 1) * 28 + (diaN - 1);
  const fr = window.frases ? window.frases[idx] : null;
  const sun = cal.sunForDay(d.noonMs);
  const evs = phaseMap[cal.fmtKey.format(new Date(d.noonMs))] || [];
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(540, 300, 80, 540, 675, 1100);
  g.addColorStop(0, '#1c2650'); g.addColorStop(1, '#0b1026');
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  x.strokeStyle = '#e8c56a'; x.lineWidth = 6;
  x.strokeRect(30, 30, 1020, 1290);
  x.textAlign = 'center';
  x.fillStyle = '#e8c56a'; x.font = 'bold 44px Georgia, serif';
  x.fillText('Mari Küla Küyen', 540, 120);
  x.fillStyle = '#9aa3c7'; x.font = '26px Segoe UI';
  x.fillText(`Luna ${lunaN} · ${meta.nombre}`, 540, 175);
  evs.forEach((e, i) => { x.font = '40px serif'; x.fillText(e.simbolo, 470 + i * 70, 265); });
  x.fillStyle = '#f0d488'; x.font = 'bold 52px Georgia, serif';
  x.fillText(`Día ${diaN} · ${cal.weekdayName(d.noonMs).toUpperCase()}`, 540, 350);
  x.fillStyle = '#e8eaf6'; x.font = '34px Segoe UI';
  x.fillText(cal.fmtFull.format(new Date(d.noonMs)), 540, 405);
  x.fillStyle = '#ffd98a'; x.font = '28px Segoe UI';
  x.fillText(`☀ ${sun.rise ? cal.fmtTime.format(new Date(sun.rise)) : '--'} – ${sun.set ? cal.fmtTime.format(new Date(sun.set)) : '--'}`, 540, 460);
  if (fr) {
    x.fillStyle = '#ecd9a8'; x.font = 'italic 36px Georgia';
    wrapText(x, `«${fr.t}»`, 540, 560, 880, 48);
    x.fillStyle = '#9aa3c7'; x.font = '28px Segoe UI';
    x.fillText(`— ${fr.a}`, 540, 700);
  }
  // Notas + agenda por horas en imagen compartida
  const agendaTxt = Array.isArray(cell.agenda) && cell.agenda.length ? cell.agenda.slice().sort((a,b)=>a.hour-b.hour).map(a=> `${String(a.hour).padStart(2,'0')}:00 ${a.text}${a.notify?' 🔔':''}`).join(' · ') : '';
  const notaTxt = cell.nota ? cell.nota.trim() : '';
  let shareNote = '';
  if (agendaTxt && notaTxt) shareNote = `🕐 ${agendaTxt} — ${notaTxt}`;
  else shareNote = agendaTxt ? `🕐 ${agendaTxt}` : notaTxt;
  if (shareNote) {
    x.fillStyle = '#cdd3ee'; x.font = '26px Segoe UI';
    wrapText(x, shareNote.slice(0, 240), 540, 1190, 900, 34);
  }
  x.fillStyle = '#5a6390'; x.font = '22px Segoe UI';
  x.fillText('Calendario de las 13 Lunas · Penco, Bío-Bío', 540, 1300);
  return c.toDataURL('image/png');
}

function wrapText(x, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const test = line + w + ' ';
    if (x.measureText(test).width > maxW && line) { x.fillText(line.trim(), cx, yy); line = w + ' '; yy += lh; }
    else line = test;
  }
  x.fillText(line.trim(), cx, yy);
}

// === Helpers de compartir (bitácoras y página) ===
async function shareText(title, text, url) {
  const shareData = { title, text };
  if (url) shareData.url = url;
  // Intentar Web Share API nativa (móvil/desktop moderno)
  try {
    if (navigator.share && navigator.canShare && !navigator.canShare(shareData)) {
      // canShare false por url no soportada, intentar sin url
      delete shareData.url;
    }
    if (navigator.share) {
      await navigator.share(shareData);
      if ($('statusMsg')) { $('statusMsg').textContent = 'Compartido ✓'; setTimeout(()=>{$('statusMsg').textContent='';},2500); }
      return true;
    }
  } catch(e) {
    if (e && e.name === 'AbortError') return false;
  }
  // Fallback: copiar al portapapeles
  try {
    const full = url ? `${text}\n${url}` : text;
    await navigator.clipboard.writeText(full);
    if ($('statusMsg')) { $('statusMsg').textContent = 'Copiado al portapapeles ✓'; setTimeout(()=>{$('statusMsg').textContent='';},2500); }
    else alert('Copiado al portapapeles');
    return true;
  } catch {}
  // Último fallback: prompt
  try { window.prompt('Copia el texto:', (url? `${text}\n${url}`: text)); } catch {}
  return false;
}
function buildFishingShareText(entryOrAll) {
  if (Array.isArray(entryOrAll)) {
    if (!entryOrAll.length) return 'Bitácora de pesca — Penco · sin registros aún';
    let t = '🎣 Bitácora de pesca — Penco / Golfo de Arauco\n';
    t += `Calendario 13 Lunas · ${entryOrAll.length} salidas\n\n`;
    entryOrAll.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(e=>{
      t += `• ${e.date} · ${e.species||'—'} ${e.qty? '('+e.qty+')':''} · ${e.place||'—'}`;
      if (e.tide) t += ` · ${e.tide}`;
      if (e.weather) t += ` · ${e.weather}`;
      if (e.notes) t += ` — ${e.notes}`;
      t += '\n';
    });
    t += '\n— Mari Küla Küyen · Penco';
    return t;
  } else {
    const e = entryOrAll;
    let t = `🎣 ${e.species||'Salida de pesca'} · ${e.date}\n`;
    if (e.place) t += `📍 ${e.place}\n`;
    if (e.qty) t += `Cantidad: ${e.qty}\n`;
    if (e.tide) t += `🌊 ${e.tide}\n`;
    if (e.weather) t += `☁️ ${e.weather}\n`;
    if (e.notes) t += `📝 ${e.notes}\n`;
    const luna = mensLunaForKey(e.date); if (luna) t += `🌙 Luna ${luna.luna} día ${luna.dia}\n`;
    t += '\n— Bitácora de pesca · Mari Küla Küyen';
    return t;
  }
}
function buildBirdsShareText(entryOrAll) {
  if (Array.isArray(entryOrAll)) {
    if (!entryOrAll.length) return 'Bitácora de aves — Penco · sin registros aún';
    let t = '🦅 Bitácora de aves — Penco · Rocuant\n';
    t += `${entryOrAll.length} avistamientos · ${new Set(entryOrAll.map(x=>x.species)).size} especies\n\n`;
    entryOrAll.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).forEach(e=>{
      t += `• ${e.date} ${e.time||''} · ${e.species} ×${e.count} · ${e.place||'—'} (${e.activity||'—'})`;
      if (e.notes) t += ` — ${e.notes}`;
      t += '\n';
    });
    t += '\n— Mari Küla Küyen · Penco';
    return t;
  } else {
    const e = entryOrAll;
    let t = `🦅 ${e.species} ×${e.count} · ${e.date} ${e.time||''}\n`;
    if (e.place) t += `📍 ${e.place}\n`;
    if (e.activity) t += `Actividad: ${e.activity}\n`;
    if (e.notes) t += `📝 ${e.notes}\n`;
    const luna = mensLunaForKey(e.date); if (luna) t += `🌙 Luna ${luna.luna} día ${luna.dia}\n`;
    t += '\n— Bitácora de aves · Mari Küla Küyen';
    return t;
  }
}
function setupPageShare(){
  const b=$('btnSharePage'); if(!b) return;
  const CAL_URL='https://calendario-13-lunas.pages.dev/';
  b.onclick=async()=>{
    const title='Mari Küla Küyen — Calendario de las 13 Lunas';
    const text='Calendario de las 13 Lunas · Penco · Bío-Bío — 13 lunas de 28 días + Día Fuera del Tiempo. Lunas, mareas, siembra y bitácoras locales.';
    // Copiar enlace fijo al portapapeles (requisito) y luego intentar compartir nativo
    try { await navigator.clipboard.writeText(CAL_URL); } catch {}
    // Intentar Web Share API con URL fija si disponible, sino fallback a helper
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: CAL_URL });
        if ($('statusMsg')) { $('statusMsg').textContent='Enlace copiado y compartido ✓'; setTimeout(()=>{$('statusMsg').textContent='';},2500); }
        return;
      }
    } catch(e){ if(e && e.name==='AbortError') return; }
    // Fallback: usar helper que también copia y muestra estado
    await shareText(title, text + ' ' + CAL_URL, null);
    // Asegurar que el enlace puro quede en portapapeles
    try { await navigator.clipboard.writeText(CAL_URL); } catch {}
    if ($('statusMsg')) { $('statusMsg').textContent='Enlace copiado ✓ — ' + CAL_URL; setTimeout(()=>{$('statusMsg').textContent='';},3000); }
  };
}
setTimeout(setupPageShare, 700);

const WMO = [
  [0, 'Despejado', '☀️'], [1, 'Mayormente despejado', '🌤️'], [2, 'Parcialmente nublado', '⛅'], [3, 'Nublado', '☁️'],
  [45, 'Niebla', '🌫️'], [48, 'Niebla con escarcha', '🌫️'],
  [51, 'Lloviznas leves', '🌦️'], [53, 'Lloviznas', '🌦️'], [55, 'Lloviznas intensas', '🌧️'],
  [61, 'Lluvia leve', '🌦️'], [63, 'Lluvia', '🌧️'], [65, 'Lluvia intensa', '🌧️'],
  [71, 'Nieve leve', '🌨️'], [73, 'Nieve', '🌨️'], [75, 'Nieve intensa', '❄️'],
  [80, 'Chubascos leves', '🌦️'], [81, 'Chubascos', '🌧️'], [82, 'Chubascos fuertes', '⛈️'],
  [95, 'Tormenta', '⛈️'], [96, 'Tormenta con granizo', '⛈️'], [99, 'Tormenta severa', '⛈️']
];
function wmo(code, isDay) {
  const f = WMO.find(w => w[0] === code);
  let ico = f ? f[2] : '🌡️';
  const desc = f ? f[1] : '—';
  // noche: reemplazar sol por luna en códigos despejados/parciales
  if (isDay === 0) {
    if (code === 0) ico = '🌙';
    else if (code === 1) ico = '🌙☁️';
    else if (code === 2) ico = '☁️';
    // 3, niebla, lluvia, nieve, tormenta mantienen mismo icono
  }
  return { desc, ico };
}
function isDayFallback(hour) {
  // fallback simple: 06:00-19:59 día, resto noche (complementa is_day del API)
  return (hour >= 6 && hour < 20) ? 1 : 0;
}
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
function dirName(deg) { return DIRS[Math.round(deg / 45) % 8]; }

async function fetchWeather() {
  $('tidesPanel').classList.add('hidden');
  const panel = $('weatherPanel');
  panel.classList.remove('hidden');
  panel.innerHTML = '<i>Cargando clima…</i>';
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-36.73194&longitude=-72.9925' +
      '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,is_day' +
      '&timezone=America%2FSantiago&forecast_days=7';
    const r = await fetch(url);
    const j = await r.json();
    const cur = j.current;
    const curIsDay = (cur.is_day !== undefined) ? cur.is_day : isDayFallback(new Date().getHours());
    const cw = wmo(cur.weather_code, curIsDay);
    let html = `<div class="wp-current">${cw.ico} <b>Penco ahora:</b> ${cw.desc} · ${cur.temperature_2m}°C (sensación ${cur.apparent_temperature}°C)` +
      ` · 💨 ${cur.wind_speed_10m} km/h ${dirName(cur.wind_direction_10m)} · 💧 ${cur.precipitation} mm</div><div class="wp-days">`;
    j.daily.time.forEach((t, i) => {
      const dw = wmo(j.daily.weather_code[i], 1);
      html += `<div class="wp-day"><div class="wd-date">${t.slice(8)}/${t.slice(5, 7)}</div><div class="wd-ico">${dw.ico}</div>` +
        `<div>${Math.round(j.daily.temperature_2m_min[i])}–${Math.round(j.daily.temperature_2m_max[i])}°C</div>` +
        `<div class="wd-date">💧${j.daily.precipitation_probability_max[i]}%</div></div>`;
    });
    html += '</div>';

    const p = cal.santiagoParts(Date.now());
    const nowKey = `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}T${String(p.hh).padStart(2, '0')}`;
    const times = j.hourly.time;
    let idx = times.findIndex(t => t >= nowKey);
    if (idx < 0) idx = 0;
    const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    html += '<div class="wp-hours-title">Próximas 48 horas</div>';
    let groupDate = null;
    for (let k = idx; k < Math.min(idx + 48, times.length); k++) {
      const t = times[k];
      const dkey = t.slice(0, 10);
      if (dkey !== groupDate) {
        groupDate = dkey;
        const wd = new Date(Date.UTC(+dkey.slice(0, 4), +dkey.slice(5, 7) - 1, +dkey.slice(8, 10))).getUTCDay();
        html += `<div class="wp-hgroup"><div class="wp-hday">${WD[wd]} ${dkey.slice(8, 10)}/${dkey.slice(5, 7)}</div><div class="wp-hrow">`;
      }
      const isDayHour = (j.hourly.is_day && j.hourly.is_day[k] !== undefined) ? j.hourly.is_day[k] : isDayFallback(parseInt(t.slice(11,13),10));
      const hw = wmo(j.hourly.weather_code[k], isDayHour);
      const pp = j.hourly.precipitation_probability[k];
      html += `<div class="wp-hour${k === idx ? ' now' : ''}" title="${hw.desc} · viento ${j.hourly.wind_speed_10m[k]} km/h${isDayHour===0?' · noche':''}">` +
        `<div class="hh">${t.slice(11, 13)}h${isDayHour===0?' 🌙':''}</div><div class="hi">${hw.ico}</div>` +
        `<div class="ht">${Math.round(j.hourly.temperature_2m[k])}°</div>` +
        `<div class="hp">💧${pp == null ? '–' : pp}%</div></div>`;
      const nextT = times[k + 1];
      if (!nextT || nextT.slice(0, 10) !== groupDate) html += '</div></div>';
    }
    panel.innerHTML = html;
  } catch {
    panel.innerHTML = '<i>No se pudo obtener el clima (sin conexión a internet).</i>';
  }
}
$('btnWeather').onclick = fetchWeather;

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
      let html='<p class="muted" style="font-size:11px;margin-bottom:12px">Cosecha y plagas — <b>luna actual + 2 siguientes</b></p>';
      html+='<div style="display:flex;flex-direction:column;gap:14px">';
      tres.forEach((n,i)=>{
        const s=SIEMBRA_LUNAS[n]; const meta=MOONS[n-1];
        const badge=i===0?'actual': i===1?'próxima':'siguiente';
        const plaga = n<=3?'Babosas/hongos por humedad': n<=6?'Pulgones en brotes': n<=9?'Mosca blanca/gusano fruto':'Hongos por frío/humedad';
        html+=`<div class="si-card" style="margin:0;${i===0?'border-color:var(--gold);background:linear-gradient(135deg,var(--panel),var(--card))':''}"><h4>🌱 Luna ${n} · ${escapeHtml(meta.nombre)} <span class="chip" style="font-size:10px">${badge}</span></h4><p style="font-size:11px;color:var(--muted)">${escapeHtml(s.epoca)}</p><p style="font-size:11px;color:var(--gold)"><b>${escapeHtml(s.titulo)}</b></p><p class="si-sem" style="font-size:11px">🌾 Cosecha: ${escapeHtml(s.cosecha)}</p><p style="font-size:11px;color:#ff9a9a">🐛 Plagas: ${escapeHtml(plaga)}</p><p style="font-size:11px">🛠️ ${escapeHtml(s.tareas)}</p></div>`;
        if(i<2) html+='<div style="height:1px;background:var(--line);opacity:0.6;margin:2px 12px"></div>';
      });
      html+='</div>';
      hBox.innerHTML=html;
    }
    return;
  }
  // siembra: solo luna actual + 2 siguientes (sin vista rápida, sin ciclo completo, sin guía por fase)
  if(hBox) hBox.innerHTML='';
  let html='<p class="muted" style="font-size:11px;margin-bottom:12px">Siembra — <b>luna actual + 2 siguientes</b></p>';
  html+='<div style="display:flex;flex-direction:column;gap:14px">';
  tres.forEach((n,i)=>{
    const s=SIEMBRA_LUNAS[n]; const meta=MOONS[n-1];
    const badge=i===0?'actual': i===1?'próxima':'siguiente';
    html+=`<div class="si-card" style="margin:0;${i===0?'border-color:var(--gold);background:linear-gradient(135deg,var(--panel),var(--card))':''}"><h4>🌱 Luna ${n} · ${escapeHtml(meta.nombre)} <span class="chip" style="font-size:10px">${badge}</span></h4><p style="font-size:11px;color:var(--muted)">${escapeHtml(s.epoca)}</p><p style="font-size:11px;color:var(--gold)"><b>${escapeHtml(s.titulo)}</b></p><p class="si-sem">🌱 Siembra directa: ${escapeHtml(s.directa)}</p><p class="si-tar">🌱 Almácigos: ${escapeHtml(s.almacigos)}</p><p style="font-size:11px">🌾 Cosecha: ${escapeHtml(s.cosecha)}</p><p style="font-size:11px">🛠️ ${escapeHtml(s.tareas)}</p></div>`;
    if(i<2) html+='<div style="height:1px;background:var(--line);opacity:0.6;margin:2px 12px"></div>';
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
  html+='<div class="menstrual-card asoc-header" style="background:linear-gradient(135deg,var(--panel),var(--card));border-color:var(--gold)">';
  html+='<h4 style="color:var(--gold)">🤝 Asociaciones — qué plantar junto</h4>';
  html+='<p class="muted" style="font-size:11px">Combina cultivos para repeler plagas, mejorar sabor y aprovechar espacio. <b>Verde</b>=buena compañía, <b>rojo</b>=evitar. Basado en huerto de Penco (Bío-Bío).</p>';
  html+='<div class="asoc-controls">';
  html+='<label class="asoc-control">🔍 Buscar<input type="text" id="asocSearch" placeholder="ej: tomate, lechuga, ajo..." value="'+escapeHtml(ft)+'"></label>';
  html+='<label class="asoc-control">↕️ Orden<select id="asocSort"><option value="destacado" '+(asocSortMode==='destacado'?'selected':'')+'>⭐ Luna actual primero</option><option value="alfabetico" '+(asocSortMode==='alfabetico'?'selected':'')+'>🔤 A → Z</option><option value="familia" '+(asocSortMode==='familia'?'selected':'')+'>🌿 Por familia</option></select></label>';
  html+='<label class="asoc-control">🌿 Familia<select id="asocFamilia"><option value="">Todas</option>'+familias.map(f=>'<option value="'+escapeHtml(f)+'" '+(asocFamiliaFilter===f?'selected':'')+'>'+escapeHtml(f)+'</option>').join('')+'</select></label>';
  html+='<span class="chip asoc-count">'+list.length+' cultivos'+(asocFamiliaFilter?' · '+escapeHtml(asocFamiliaFilter):'')+'</span>';
  html+='</div>';
  if(destacados.size) html+='<div class="asoc-destacados"><span class="muted" style="font-size:11px">⭐ Destacados esta luna ('+destacados.size+'):</span> '+Array.from(destacados).map(c=>'<span class="pill good" style="font-size:11px">'+escapeHtml(c)+'</span>').join(' ')+'</div>';
  html+='<div class="asoc-legend">';
  html+='<span class="asoc-legend-item good">✅ Buena compañía</span><span class="asoc-legend-item bad">🚫 Evitar</span><span class="asoc-legend-item tip">💡 Consejo</span>';
  html+='</div>';
  html+='</div>';
  // Bloque Tres Hermanas destacado ordenado
  html+='<div class="si-card asoc-milpa" style="border-color:var(--gold);display:flex;gap:12px;align-items:flex-start"><span style="font-size:28px">🌽</span><div><h4>Las Tres Hermanas — milpa mapuche</h4><p style="font-size:12px;color:#cdd3ee">Técnica ancestral: <b>Maíz</b> es tutor del <b>Poroto</b> (fija nitrógeno) y <b>Zapallo</b> cubre suelo, guarda humedad y frena maleza. Juntas producen más que separadas.</p><p class="muted" style="font-size:11px">Espacio: maíz 40 cm, poroto al pie, zapallo 1,2 m entre mata. Siembra las 3 en la misma luna de Pewü.</p></div></div>';
  if(!list.length){
    html+='<p class="muted" style="margin-top:14px;text-align:center">Sin resultados para “'+escapeHtml(ft)+'”'+(asocFamiliaFilter?' en '+escapeHtml(asocFamiliaFilter):'')+'. Prueba con otro término.</p>';
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
  html+='<p class="muted" style="font-size:10px;margin-top:10px;text-align:center">Tip: alterna familias cada luna (no repetir solanácea tras solanácea). Deja flores (caléndula, cosmos) para atraer polinizadores. Toca ⭐ para ver destacadas arriba.</p>';
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
  html+='<div class="menstrual-card" style="background:linear-gradient(135deg,var(--panel),var(--card));border-color:var(--gold)">';
  html+='<h4 style="color:var(--gold)">🧪 Preparados orgánicos — botica de la huerta pencona</h4>';
  html+='<p class="muted" style="font-size:11px">Alternativa sin venenos para <b>fertilizar, prevenir hongos y repeler insectos</b>. Todos se hacen con ingredientes locales (ortiga, cola de caballo, ajo, ceniza). Respeta dosis y luna: menos es más.</p>';
  html+='<div class="asoc-controls">';
  html+='<label class="asoc-control">🔍 Buscar<input type="text" id="prepSearch" placeholder="ej: pulgón, ortiga, neem..." value="'+escapeHtml(ft)+'"></label>';
  html+='<label class="asoc-control">🧪 Tipo<select id="prepTipo"><option value="">Todos</option>'+tipos.map(t=>'<option value="'+escapeHtml(t)+'" '+(tipoFiltro===t?'selected':'')+'>'+escapeHtml(t)+'</option>').join('')+'</select></label>';
  html+='<span class="chip asoc-count">'+list.length+' preparados</span>';
  html+='</div>';
  html+='<div class="asoc-legend"><span class="asoc-legend-item good">🌿 Fertilizante</span><span class="asoc-legend-item" style="background:#7ab8ff22;color:#7ab8ff;border-color:#7ab8ff55">🍄 Fungicida</span><span class="asoc-legend-item bad">🐛 Insecticida</span><span class="asoc-legend-item tip">⚗️ Trampa</span></div>';
  html+='</div>';
  if(!list.length){
    html+='<p class="muted" style="margin-top:14px;text-align:center">Sin preparados para ese filtro. Prueba “ortiga” o “jabón”.</p>';
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
      html+='<div class="prep-row"><span class="prep-label">💧 Dosis</span><p style="color:#8fd694"><b>'+escapeHtml(p.dosis)+'</b></p></div>';
      html+='<div class="prep-row"><span class="prep-label">🎯 Uso</span><p>'+escapeHtml(p.uso)+'</p></div>';
      html+='<div class="prep-caution">⚠️ '+escapeHtml(p.precauciones)+'</div>';
      html+='</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  html+='<div class="si-card" style="border-color:var(--gold);margin-top:12px"><h4>📅 Calendario de preparados — por luna</h4><p style="font-size:11px;color:#cdd3ee"><b>Pukem (invierno):</b> cola de caballo + caldo bordelés preventivo. <b>Pewü:</b> ortiga + jabón potásico para brotes. <b>Walüng:</b> neem + ajo-ají para mosca blanca. <b>Rimü:</b> sulfocálcico + té de compost para guardar.</p><p class="muted" style="font-size:10px">Aplica siempre al atardecer, sin viento sur. Alterna preparados (no repitas cobre >3 veces). Lava hortalizas antes de consumir y respeta carencias.</p></div>';
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


// === PESCA ===
const FISHING_SPECIES = [
  { nombre:"Corvina", temporada:"Oct-Mar", talla:"60 cm", carnada:"Peje / señuelo plateado", nota:"Mareas vivas, amanecer" },
  { nombre:"Lenguado", temporada:"Sep-Feb", talla:"30 cm", carnada:"Pejerrey vivo", nota:"Fondo arena, pleamar" },
  { nombre:"Pejerrey", temporada:"Todo año", talla:"15 cm", carnada:"Tebo / piure", nota:"Orilla, tarde" },
  { nombre:"Jurel", temporada:"Nov-Abr", talla:"26 cm", carnada:"Jibia / sardina", nota:"Cardumen, luna clara" },
  { nombre:"Merluza común", temporada:"Veda Sep", talla:"30 cm", carnada:"Sardina", nota:"Respetar veda Sep" },
  { nombre:"Robalo", temporada:"Todo año", talla:"30 cm", carnada:"Nape / gusano", nota:"Estuario, baja" },
  { nombre:"Sierra", temporada:"Dic-Mar", talla:"35 cm", carnada:"Sardina viva", nota:"Corriente, mañana" },
  { nombre:"Congrio", temporada:"Veda Jul-Ago", talla:"40 cm", carnada:"Jaiba", nota:"Rocoso, noche" }
];
function getFishingRatingForKey(key){
  // key YYYY-MM-DD
  try{
    const ms=mensKeyToMs(key);
    const tithi=window.astro ? window.astro.tithi(ms) : 0;
    // tithi 0 nueva, 7-8 cuarto, 14-15 llena, 22-23 menguante
    let score=50, label="Regular", desc="Pesca normal";
    if(tithi===0||tithi===1||tithi===14||tithi===15){ score=90; label="Excelente"; desc="Luna nueva/llena → mareas vivas, mayor actividad"; }
    else if(tithi===7||tithi===8||tithi===21||tithi===22){ score=60; label="Buena"; desc="Cuarto → movimiento medio"; }
    else if(tithi>=12&&tithi<=16){ score=85; label="Muy buena"; desc="Cercana a llena, buen pique"; }
    // ajuste por marea: si pleamar cerca amanecer/atardecer +10
    const tide=getTidesForKey(key.slice(5));
    const hasDawnTide = tide.tides.some(t=>{ const [h]=t.h.split(':').map(Number); return h>=5 && h<=8 && t.t==='pleamar'; });
    if(hasDawnTide) { score=Math.min(95, score+8); desc+=". Pleamar al amanecer"; }
    return { score, label, desc, tithi };
  }catch(e){ return { score:60, label:"Buena", desc:"", tithi:0 }; }
}
function renderFishingDialog(){
  const todayKey=cal.fmtKey.format(new Date());
  const todayMs=mensKeyToMs(todayKey);
  const rating=getFishingRatingForKey(todayKey);
  const tideToday=getTidesForKey(todayKey.slice(5));
  const todayBox=$('fishingTodayBox');
  if(todayBox){
    const color = rating.score>=85? '#a9d18e' : rating.score>=65? '#e8c56a' : '#9aa3c7';
    todayBox.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px"><b>🎣 Hoy — '+cal.weekdayName(todayMs)+' '+cal.fmtFull.format(new Date(todayMs))+'</b></span><span class="chip" style="background:'+color+';color:#10142c">'+rating.label+' ('+rating.score+'/100)</span></div><p class="muted" style="font-size:11px;margin-top:6px">'+rating.desc+' · Tithi '+rating.tithi+' · Mareas: '+tideToday.tides.map(t=> t.h+' '+t.a).join(' · ')+ (tideToday.estimated?' *est.':'') +'</p><p class="muted" style="font-size:11px">Mejor ventana: <b>2h antes/después de pleamar</b> ('+tideToday.tides.filter(t=>t.t==='pleamar').map(t=>t.h).join(', ')+') y <b>amanecer/atard ecer</b>.</p>';
  }
  const lunaBox=$('fishingLunaBox');
  if(lunaBox){
    const info = currentView.tipo==='dft'? null : MOONS[currentView.luna-1];
    const days = currentView.tipo==='dft'? [] : cycle.days.filter(d=>d.luna===currentView.luna);
    let best=[];
    days.forEach(d=>{
      const k=cal.fmtKey.format(new Date(d.noonMs));
      const r=getFishingRatingForKey(k);
      if(r.score>=80) best.push({k, r, d});
    });
    if(!best.length) lunaBox.innerHTML='<p class="muted">En esta luna no hay picos excelentes, pero días buenos: revisa mareas diarias.</p>';
    else {
      lunaBox.innerHTML='<h4 style="color:var(--gold)">🌙 Mejores días en '+ (info? info.nombre : 'esta luna') +'</h4>' + best.slice(0,5).map(b=>'<div class="chip" style="display:block;margin-top:4px">'+cal.weekdayName(mensKeyToMs(b.k))+' '+cal.fmtDate.format(new Date(mensKeyToMs(b.k)))+' — '+b.r.label+' ('+b.r.score+')</div>').join('') + '<p class="muted" style="font-size:10px;margin-top:6px">Basado en luna + marea. Valida con experiencia local.</p>';
    }
  }
  const speciesBox=$('fishingSpeciesBox');
  if(speciesBox){
    speciesBox.innerHTML='<div class="fishing-species">'+FISHING_SPECIES.map(s=>'<div class="fishing-species-item"><b>'+escapeHtml(s.nombre)+'</b> — <span class="muted">'+escapeHtml(s.temporada)+' · Talla '+escapeHtml(s.talla)+'</span><br><span style="font-size:11px">Carnada: '+escapeHtml(s.carnada)+'</span><br><span class="muted" style="font-size:10px">'+escapeHtml(s.nota)+'</span></div>').join('')+'</div>';
  }
  const moonBox=$('fishingMoonBox');
  if(moonBox){
    const r=getFishingRatingForKey(todayKey);
    moonBox.innerHTML='<b>'+r.label+'</b> — '+r.desc+' (tithi '+r.tithi+')';
  }
}
// === BITÁCORA DE PESCA (dentro de Pesca) ===
function getFishingLogData(){
  const u=userData();
  if(!u.fishingLog) u.fishingLog=[];
  if(!Array.isArray(u.fishingLog)) u.fishingLog=[];
  return u.fishingLog;
}
let fishLogEditingId=null;
function renderFishingLog(){
  const box=$('fishLogList'); if(!box) return;
  const data=getFishingLogData();
  const stats=$('fishLogStats');
  if(!data.length){ box.innerHTML='<p class="muted">Sin salidas registradas. Agrega tu primera arriba.</p>'; if(stats) stats.textContent='0 salidas'; return; }
  const sorted=[...data].sort((a,b)=> b.date.localeCompare(a.date));
  box.innerHTML=sorted.map(it=>{
    const luna=mensLunaForKey(it.date);
    const lunaTxt=luna? `Luna ${luna.luna} d${luna.dia}`: '';
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>${escapeHtml(it.species||'—')}</b> — ${escapeHtml(it.qty||'')} · ${escapeHtml(it.place||'')} <br><span class="muted" style="font-size:11px">${it.date} ${it.tide? '· '+escapeHtml(it.tide):''} ${lunaTxt? '· '+lunaTxt:''} ${it.weather? '· '+escapeHtml(it.weather):''}</span><br><span class="muted" style="font-size:11px">${escapeHtml(it.notes||'')}</span></span><span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${it.id}" class="btn fishlog-share" style="width:auto;font-size:11px" title="Compartir esta salida">📤</button><button data-id="${it.id}" class="btn fishlog-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn fishlog-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`;
  }).join('');
  if(stats) stats.textContent=`${data.length} salidas · ${data.filter(x=>x.qty).length} con captura`;
  box.querySelectorAll('.fishlog-share').forEach(b=> b.onclick=async()=>{
    const it=data.find(x=>x.id===b.dataset.id); if(!it) return;
    await shareText(`🎣 ${it.species||'Pesca'} · ${it.date}`, buildFishingShareText(it));
  });
  box.querySelectorAll('.fishlog-edit').forEach(b=> b.onclick=()=>{
    const it=data.find(x=>x.id===b.dataset.id); if(!it) return;
    fishLogEditingId=it.id;
    $('fishLogDate').value=it.date; $('fishLogPlace').value=it.place||''; $('fishLogSpecies').value=it.species||''; $('fishLogQty').value=it.qty||''; $('fishLogTide').value=it.tide||''; $('fishLogWeather').value=it.weather||''; $('fishLogNotes').value=it.notes||'';
    $('fishLogAdd').textContent='↻ Actualizar'; $('fishLogCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.fishlog-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar salida?')) return;
    const d=getFishingLogData(); const idx=d.findIndex(x=>x.id===b.dataset.id); if(idx>=0) d.splice(idx,1);
    scheduleSave(); renderFishingLog();
  });
}
function setupFishingDialog(){
  const btn=$('btnFishing'); if(btn) btn.onclick=()=>{
    renderFishingDialog(); renderFishingLog();
    const d=$('fishLogDate'); if(d && !d.value) d.value=cal.fmtKey.format(new Date());
    $('fishingDialog').showModal();
  };
  const ct=$('fishingCloseTop'), cb=$('fishingClose'); if(ct) ct.onclick=()=>$('fishingDialog').close(); if(cb) cb.onclick=()=>$('fishingDialog').close();
  const add=$('fishLogAdd'); if(add) add.onclick=()=>{
    const date=$('fishLogDate').value; if(!date) return alert('Elige fecha');
    const rec={ id: fishLogEditingId||'f'+Date.now(), date, place:$('fishLogPlace').value.trim(), species:$('fishLogSpecies').value.trim(), qty:$('fishLogQty').value.trim(), tide:$('fishLogTide').value.trim(), weather:$('fishLogWeather').value.trim(), notes:$('fishLogNotes').value.trim() };
    const data=getFishingLogData();
    if(fishLogEditingId){
      const idx=data.findIndex(x=>x.id===fishLogEditingId); if(idx>=0) data[idx]=rec;
      fishLogEditingId=null; add.textContent='+ Guardar salida'; $('fishLogCancelEdit').classList.add('hidden');
    } else data.push(rec);
    scheduleSave(); $('fishLogSpecies').value=''; $('fishLogQty').value=''; $('fishLogNotes').value='';
    renderFishingLog();
  };
  const cancel=$('fishLogCancelEdit'); if(cancel) cancel.onclick=()=>{ fishLogEditingId=null; $('fishLogAdd').textContent='+ Guardar salida'; cancel.classList.add('hidden'); $('fishLogSpecies').value=''; $('fishLogQty').value=''; $('fishLogNotes').value=''; };
  const clear=$('fishLogClear'); if(clear) clear.onclick=()=>{ if(!confirm('¿Borrar toda la bitácora de pesca?')) return; const d=userData(); d.fishingLog=[]; scheduleSave(); renderFishingLog(); };
  const share=$('fishLogShare'); if(share) share.onclick=async()=>{
    const arr=getFishingLogData();
    if(!arr.length) return alert('Sin registros para compartir');
    await shareText('🎣 Bitácora de pesca — Penco', buildFishingShareText(arr));
  };
  // auto fill tide from today's prediction
  const tideInput=$('fishLogTide');
  if(tideInput) tideInput.addEventListener('focus', ()=>{
    if(tideInput.value) return;
    const k=($('fishLogDate').value||cal.fmtKey.format(new Date())).slice(5);
    const t=getTidesForKey(k); if(t.tides.length) tideInput.placeholder=t.tides.map(x=>x.h+' '+x.t).join(', ');
  });
}

setTimeout(setupFishingDialog, 560);

// === AVES — Observación ===
const BIRDS_CATALOG = (typeof AVES_PENCO!=='undefined'? AVES_PENCO : (window.pencoData&&window.pencoData.AVES_PENCO)||[
  { nombre:"Gaviota dominicana", cient:"Larus dominicanus", hab:"Costa", icon:"🕊️", epoca:"Todo año"},
  { nombre:"Zorzal", cient:"Turdus falcklandii", hab:"Jardín", icon:"🐦", epoca:"Todo año"}
]);
function getBirdData(){
  const u=userData();
  if(!u.birds) u.birds={ entries:[] };
  if(!Array.isArray(u.birds.entries)) u.birds.entries=[];
  return u.birds;
}
let birdEditingId=null;
function renderBirdsDialog(){
  const todayKey=cal.fmtKey.format(new Date());
  const todayBox=$('birdsTodayBox');
  if(todayBox){
    const cnt=getBirdData().entries.length;
    const todayCnt=getBirdData().entries.filter(x=>x.date===todayKey).length;
    todayBox.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px"><b>🦅 Hoy — ${cal.fmtFull.format(new Date())}</b></span><span class="chip" style="background:var(--gold);color:#10142c">${todayCnt} hoy · ${cnt} total</span></div><p class="muted" style="font-size:11px;margin-top:6px">Humedal Rocuant es sitio clave: pleamar concentra aves limícolas. Mejor 06:30-09:00 y 17:30-19:00. Viento sur fuerte → poca actividad.</p>`;
  }
  const moonBox=$('birdsMoonBox');
  if(moonBox){
    const k=cal.fmtKey.format(new Date());
    const r=getFishingRatingForKey(k);
    moonBox.innerHTML=`<b>${r.label}</b> — ${r.desc} (luna influye menos que marea, más que luz nocturna)`;
  }
  const catBox=$('birdsCatalogBox');
  if(catBox){
    catBox.innerHTML='<div class="fishing-species">'+BIRDS_CATALOG.map(b=>`<div class="fishing-species-item" style="cursor:pointer" data-bird="${escapeHtml(b.nombre)}"><b>${b.icon} ${escapeHtml(b.nombre)}</b> — <span class="muted" style="font-size:10px">${escapeHtml(b.cient)}</span><br><span style="font-size:11px">${escapeHtml(b.hab)} · ${escapeHtml(b.epoca)}</span></div>`).join('')+'</div>';
    catBox.querySelectorAll('[data-bird]').forEach(el=> el.onclick=()=>{ $('birdSpecies').value=el.dataset.bird; $('birdSpecies').focus(); });
  }
  renderBirdsLog();
}
function renderBirdsLog(){
  const box=$('birdsLogBox'); if(!box) return;
  const data=getBirdData().entries;
  const stats=$('birdsStats');
  if(!data.length){ box.innerHTML='<p class="muted">Sin avistamientos. Registra tu primero arriba.</p>'; if(stats) stats.textContent='0 avistamientos'; return; }
  const sorted=[...data].sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
  box.innerHTML=sorted.slice(0,60).map(it=>{
    const luna=mensLunaForKey(it.date);
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>${escapeHtml(it.species)}</b> ×${it.count} — ${escapeHtml(it.place||'—')} · ${escapeHtml(it.activity||'')} <br><span class="muted" style="font-size:11px">${it.date} ${it.time||''} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''}</span><br><span class="muted" style="font-size:11px">${escapeHtml(it.notes||'')}</span></span><span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${it.id}" class="btn bird-share" style="width:auto;font-size:11px" title="Compartir avistamiento">📤</button><button data-id="${it.id}" class="btn bird-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn bird-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`;
  }).join('');
  const speciesSet=new Set(data.map(x=>x.species));
  if(stats) stats.textContent=`${data.length} avistamientos · ${speciesSet.size} especies · ${data.reduce((s,x)=>s+(parseInt(x.count)||0),0)} individuos`;
  box.querySelectorAll('.bird-share').forEach(b=> b.onclick=async()=>{
    const it=getBirdData().entries.find(x=>x.id===b.dataset.id); if(!it) return;
    await shareText(`🦅 ${it.species} · ${it.date}`, buildBirdsShareText(it));
  });
  box.querySelectorAll('.bird-edit').forEach(b=> b.onclick=()=>{
    const d=getBirdData().entries.find(x=>x.id===b.dataset.id); if(!d) return;
    birdEditingId=d.id; $('birdDate').value=d.date; $('birdTime').value=d.time||'07:00'; $('birdPlace').value=d.place||''; $('birdSpecies').value=d.species||''; $('birdCount').value=d.count||1; $('birdActivity').value=d.activity||'posada'; $('birdNotes').value=d.notes||'';
    $('birdAdd').textContent='↻ Actualizar'; $('birdCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.bird-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar avistamiento?')) return;
    const arr=getBirdData().entries; const idx=arr.findIndex(x=>x.id===b.dataset.id); if(idx>=0) arr.splice(idx,1);
    scheduleSave(); renderBirdsDialog();
  });
}
function setupBirdsDialog(){
  const btn=$('btnBirds'); if(btn) btn.onclick=()=>{ renderBirdsDialog(); const d=$('birdDate'); if(d && !d.value) d.value=cal.fmtKey.format(new Date()); $('birdsDialog').showModal(); };
  const ct=$('birdsCloseTop'), cb=$('birdsClose'); if(ct) ct.onclick=()=>$('birdsDialog').close(); if(cb) cb.onclick=()=>$('birdsDialog').close();
  const add=$('birdAdd'); if(add) add.onclick=()=>{
    const date=$('birdDate').value; const species=$('birdSpecies').value.trim(); if(!date||!species) return alert('Especie y fecha son obligatorias');
    const rec={ id: birdEditingId||'b'+Date.now(), date, time:$('birdTime').value||'07:00', place:$('birdPlace').value.trim(), species, count: parseInt($('birdCount').value)||1, activity:$('birdActivity').value, notes:$('birdNotes').value.trim() };
    const arr=getBirdData().entries;
    if(birdEditingId){ const idx=arr.findIndex(x=>x.id===birdEditingId); if(idx>=0) arr[idx]=rec; birdEditingId=null; add.textContent='+ Guardar avistamiento'; $('birdCancelEdit').classList.add('hidden'); }
    else arr.push(rec);
    scheduleSave(); $('birdSpecies').value=''; $('birdNotes').value=''; renderBirdsDialog();
  };
  const cancel=$('birdCancelEdit'); if(cancel) cancel.onclick=()=>{ birdEditingId=null; $('birdAdd').textContent='+ Guardar avistamiento'; cancel.classList.add('hidden'); $('birdSpecies').value=''; $('birdNotes').value=''; };
  const clear=$('birdsClear'); if(clear) clear.onclick=()=>{ if(!confirm('¿Borrar toda la bitácora de aves?')) return; getBirdData().entries=[]; scheduleSave(); renderBirdsDialog(); };
  const shareB=$('birdsShare'); if(shareB) shareB.onclick=async()=>{
    const arr=getBirdData().entries;
    if(!arr.length) return alert('Sin registros para compartir');
    await shareText('🦅 Bitácora de aves — Penco', buildBirdsShareText(arr));
  };
  const exp=$('birdsExport'); if(exp) exp.onclick=()=>{
    const arr=getBirdData().entries;
    if(!arr.length) return alert('Sin datos para exportar');
    let txt='Bitácora de aves — Penco\nFecha,Hora,Lugar,Especie,Cantidad,Actividad,Notas,Luna\n';
    arr.forEach(r=>{ const l=mensLunaForKey(r.date); txt+=`${r.date},${r.time},${r.place},${r.species},${r.count},${r.activity},${r.notes},${l? 'Luna '+l.luna:''}\n`; });
    const blob=new Blob([txt],{type:'text/csv'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='aves-penco-'+cal.fmtKey.format(new Date())+'.csv'; a.click(); URL.revokeObjectURL(url);
  };
}
setTimeout(setupBirdsDialog, 570);

// === INTERMAREAL — Rocas y pozas ===
const INTER_CATALOG = (typeof INTERMAREAL_PENCO!=='undefined'? INTERMAREAL_PENCO : (window.pencoData&&window.pencoData.INTERMAREAL_PENCO)||[]);
const INTER_CONSEJOS = (typeof CONSEJOS_INTERMAREAL!=='undefined'? CONSEJOS_INTERMAREAL : (window.pencoData&&window.pencoData.CONSEJOS_INTERMAREAL)||{});
function getIntermarealData(){
  const u=userData();
  if(!u.intermareal) u.intermareal={ entries:[] };
  if(!Array.isArray(u.intermareal.entries)) u.intermareal.entries=[];
  return u.intermareal;
}
let interEditingId=null;
function buildInterShareText(entryOrAll){
  if(Array.isArray(entryOrAll)){
    if(!entryOrAll.length) return 'Bitácora intermareal — Penco · sin registros aún';
    let t='🦀 Bitácora intermareal — Penco · Rocas Lirquén / Playa Negra\n';
    t+=`${entryOrAll.length} salidas · ${new Set(entryOrAll.map(x=>x.species)).size} especies/hallazgos\n\n`;
    entryOrAll.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).forEach(e=>{
      t+=`• ${e.date} ${e.time||''} · ${e.species} ${e.qty? '('+e.qty+')':''} · ${e.place||'—'}`;
      if(e.tide) t+=` · 🌊 ${e.tide}`;
      if(e.notes) t+=` — ${e.notes}`;
      t+=`\n`;
    });
    t+='\n— Mari Küla Küyen · Penco';
    return t;
  } else {
    const e=entryOrAll;
    let t=`🦀 ${e.species} · ${e.date} ${e.time||''}\n`;
    if(e.place) t+=`📍 ${e.place}\n`;
    if(e.qty) t+=`Cantidad: ${e.qty}\n`;
    if(e.tide) t+=`🌊 ${e.tide}\n`;
    if(e.notes) t+=`📝 ${e.notes}\n`;
    const luna=mensLunaForKey(e.date); if(luna) t+=`🌙 Luna ${luna.luna} día ${luna.dia}\n`;
    t+='\n— Bitácora intermareal · Mari Küla Küyen';
    return t;
  }
}
function renderIntermarealDialog(){
  const todayKey=cal.fmtKey.format(new Date());
  const lunaInfo = currentView.tipo==='dft'? null : MOONS[currentView.luna-1];
  const estKey = lunaInfo ? lunaInfo.estacion : ESTACIONES.RIMU ? 'RIMU' : 'PUKEM';
  // recalcular est real por luna actual
  let consejoEst = 'PUKEM';
  try{ if(lunaInfo) consejoEst=lunaInfo.estacion; else consejoEst='RIMU'; }catch{}
  const consejo=INTER_CONSEJOS[consejoEst]||Object.values(INTER_CONSEJOS)[0];
  // box today
  const todayBox=$('interTodayBox');
  if(todayBox){
    const cnt=getIntermarealData().entries.length;
    const todayCnt=getIntermarealData().entries.filter(x=>x.date===todayKey).length;
    const tide=getTidesForKey(todayKey.slice(5));
    const bajamares=tide.tides.filter(t=>t.t==='bajamar');
    const mejor=bajamares.length? bajamares.sort((a,b)=> parseFloat(a.a)-parseFloat(b.a))[0] : null;
    const puede = mejor && parseFloat(mejor.a) < 0.6 ? '✅ Ventana buena hoy' : '⚠️ Revisa altura — ideal <0.6m';
    todayBox.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px"><b>🦀 Hoy — ${cal.fmtFull.format(new Date())}</b></span><span class="chip" style="background:var(--gold);color:#10142c">${todayCnt} hoy · ${cnt} total</span></div>`+
      `<p class="muted" style="font-size:11px;margin-top:6px">Mareas hoy: ${tide.tides.map(t=> t.h+' '+t.t+' '+t.a).join(' · ')} ${tide.estimated?'*est.':''}</p>`+
      `<p class="muted" style="font-size:11px">${puede}${mejor? ' · mejor bajamar '+mejor.h+' ('+mejor.a+') · ventana 1h antes/después':''}</p>`+
      `<p class="muted" style="font-size:10px">Sernapesca marea roja: consulta sernapesca.cl antes de cosechar. Nunca solo, zapatilla con agarre.</p>`;
  }
  const moonBox=$('interMoonBox');
  if(moonBox){
    const k=cal.fmtKey.format(new Date());
    const r=getFishingRatingForKey(k);
    moonBox.innerHTML=`<b>${r.label}</b> — ${r.desc} · Bajamar viva = más roca expuesta. Luna nueva/llena → mejor.`;
  }
  const consejoBox=$('interConsejoBox');
  if(consejoBox && consejo){
    consejoBox.innerHTML=`<h4 style="font-size:11px;color:var(--gold)">🌊 ${escapeHtml(consejo.titulo)}</h4><p class="muted" style="font-size:11px;margin-top:4px">${escapeHtml(consejo.texto)}</p>`;
  }
  const catBox=$('interCatalogBox');
  if(catBox){
    catBox.innerHTML='<div class="fishing-species">'+INTER_CATALOG.map(b=>`<div class="fishing-species-item" style="cursor:pointer" data-inter="${escapeHtml(b.nombre)}"><b>${b.icon} ${escapeHtml(b.nombre)}</b> — <span class="muted" style="font-size:10px">${escapeHtml(b.cient)}</span><br><span style="font-size:11px">${escapeHtml(b.hab)} · ${escapeHtml(b.epoca)}</span><br><span class="muted" style="font-size:10px">${escapeHtml(b.nota)}</span></div>`).join('')+'</div>';
    catBox.querySelectorAll('[data-inter]').forEach(el=> el.onclick=()=>{ $('interSpecies').value=el.dataset.inter; $('interSpecies').focus(); });
  }
  renderIntermarealLog();
}
function renderIntermarealLog(){
  const box=$('interLogBox'); if(!box) return;
  const data=getIntermarealData().entries;
  const stats=$('interStats');
  if(!data.length){ box.innerHTML='<p class="muted">Sin salidas. Registra tu primera visita a roquerío arriba.</p>'; if(stats) stats.textContent='0 salidas'; return; }
  const sorted=[...data].sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
  box.innerHTML=sorted.slice(0,60).map(it=>{
    const luna=mensLunaForKey(it.date);
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>${escapeHtml(it.species)}</b> ${it.qty? '· '+escapeHtml(it.qty):''} — ${escapeHtml(it.place||'—')}<br><span class="muted" style="font-size:11px">${it.date} ${it.time||''} ${it.tide? '· 🌊 '+escapeHtml(it.tide):''} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''}</span><br><span class="muted" style="font-size:11px">${escapeHtml(it.notes||'')}</span></span><span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${it.id}" class="btn inter-share" style="width:auto;font-size:11px" title="Compartir">📤</button><button data-id="${it.id}" class="btn inter-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn inter-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`;
  }).join('');
  const speciesSet=new Set(data.map(x=>x.species));
  if(stats) stats.textContent=`${data.length} salidas · ${speciesSet.size} especies · ${data.filter(x=>x.qty).length} con cosecha`;
  box.querySelectorAll('.inter-share').forEach(b=> b.onclick=async()=>{
    const it=getIntermarealData().entries.find(x=>x.id===b.dataset.id); if(!it) return;
    await shareText(`🦀 ${it.species} · ${it.date}`, buildInterShareText(it));
  });
  box.querySelectorAll('.inter-edit').forEach(b=> b.onclick=()=>{
    const d=getIntermarealData().entries.find(x=>x.id===b.dataset.id); if(!d) return;
    interEditingId=d.id; $('interDate').value=d.date; $('interTime').value=d.time||'08:00'; $('interPlace').value=d.place||''; $('interSpecies').value=d.species||''; $('interQty').value=d.qty||''; $('interTide').value=d.tide||''; $('interNotes').value=d.notes||'';
    $('interAdd').textContent='↻ Actualizar'; $('interCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.inter-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar registro intermareal?')) return;
    const arr=getIntermarealData().entries; const idx=arr.findIndex(x=>x.id===b.dataset.id); if(idx>=0) arr.splice(idx,1);
    scheduleSave(); renderIntermarealDialog(); renderLuna();
  });
}
function setupIntermarealDialog(){
  const btn=$('btnIntermareal'); if(btn) btn.onclick=()=>{ renderIntermarealDialog(); const d=$('interDate'); if(d && !d.value) d.value=cal.fmtKey.format(new Date()); $('intermarealDialog').showModal(); };
  const ct=$('intermarealCloseTop'), cb=$('intermarealClose'); if(ct) ct.onclick=()=>$('intermarealDialog').close(); if(cb) cb.onclick=()=>$('intermarealDialog').close();
  const add=$('interAdd'); if(add) add.onclick=()=>{
    const date=$('interDate').value; const species=$('interSpecies').value.trim(); if(!date||!species) return alert('Fecha y especie/hallazgo son obligatorios');
    const rec={ id: interEditingId||'i'+Date.now(), date, time:$('interTime').value||'08:00', place:$('interPlace').value.trim(), species, qty:$('interQty').value.trim(), tide:$('interTide').value.trim(), notes:$('interNotes').value.trim() };
    const arr=getIntermarealData().entries;
    if(interEditingId){ const idx=arr.findIndex(x=>x.id===interEditingId); if(idx>=0) arr[idx]=rec; interEditingId=null; add.textContent='+ Guardar salida'; $('interCancelEdit').classList.add('hidden'); }
    else arr.push(rec);
    scheduleSave(); $('interSpecies').value=''; $('interQty').value=''; $('interNotes').value=''; renderIntermarealDialog(); renderLuna();
  };
  const cancel=$('interCancelEdit'); if(cancel) cancel.onclick=()=>{ interEditingId=null; $('interAdd').textContent='+ Guardar salida'; cancel.classList.add('hidden'); $('interSpecies').value=''; $('interQty').value=''; $('interNotes').value=''; };
  const clear=$('interClear'); if(clear) clear.onclick=()=>{ if(!confirm('¿Borrar toda la bitácora intermareal?')) return; getIntermarealData().entries=[]; scheduleSave(); renderIntermarealDialog(); renderLuna(); };
  const shareB=$('interShare'); if(shareB) shareB.onclick=async()=>{
    const arr=getIntermarealData().entries;
    if(!arr.length) return alert('Sin registros para compartir');
    await shareText('🦀 Bitácora intermareal — Penco', buildInterShareText(arr));
  };
  const exp=$('interExport'); if(exp) exp.onclick=()=>{
    const arr=getIntermarealData().entries;
    if(!arr.length) return alert('Sin datos para exportar');
    let txt='Bitácora intermareal — Penco\nFecha,Hora,Lugar,Especie/Cantidad,Marea,Notas,Luna\n';
    arr.forEach(r=>{ const l=mensLunaForKey(r.date); txt+=`${r.date},${r.time},${r.place},${r.species} ${r.qty},${r.tide},${r.notes},${l? 'Luna '+l.luna:''}\n`; });
    const blob=new Blob([txt],{type:'text/csv'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='intermareal-penco-'+cal.fmtKey.format(new Date())+'.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const tideInput=$('interTide');
  if(tideInput) tideInput.addEventListener('focus', ()=>{
    if(tideInput.value) return;
    const k=($('interDate').value||cal.fmtKey.format(new Date())).slice(5);
    const t=getTidesForKey(k); const baj=t.tides.filter(x=>x.t==='bajamar'); if(bajamaresToStr(baj).length) tideInput.placeholder=baj.map(x=>x.h+' '+x.a).join(', ');
    function bajamaresToStr(b){ return b; }
  });
}
setTimeout(setupIntermarealDialog, 575);

// === BOSQUE NATIVO ===
const BOSQUE_CATALOG = (typeof BOSQUE_NATIVO_PENCO!=='undefined'? BOSQUE_NATIVO_PENCO : (window.pencoData&&window.pencoData.BOSQUE_NATIVO_PENCO)||[]);
const BOSQUE_CONSEJOS = (typeof CONSEJOS_BOSQUE!=='undefined'? CONSEJOS_BOSQUE : (window.pencoData&&window.pencoData.CONSEJOS_BOSQUE)||{});
function getBosqueData(){
  const u=userData();
  if(!u.bosque) u.bosque={ entries:[] };
  if(!Array.isArray(u.bosque.entries)) u.bosque.entries=[];
  return u.bosque;
}
let bosqueEditingId=null;
function buildBosqueShareText(entryOrAll){
  if(Array.isArray(entryOrAll)){
    if(!entryOrAll.length) return 'Bitácora bosque nativo — Penco · sin registros aún';
    let t='🌳 Bitácora bosque nativo — Penco · Cordillera de la Costa\n';
    t+=`${entryOrAll.length} registros · ${new Set(entryOrAll.map(x=>x.species)).size} especies/acciones\n\n`;
    entryOrAll.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).forEach(e=>{
      t+=`• ${e.date} ${e.time||''} · ${e.species} · ${e.action||'—'} ${e.qty? '('+e.qty+')':''} · ${e.place||'—'}`;
      if(e.notes) t+=` — ${e.notes}`;
      t+=`\n`;
    });
    t+='\n— Mari Küla Küyen · Penco';
    return t;
  } else {
    const e=entryOrAll;
    let t=`🌳 ${e.species} · ${e.action||''} · ${e.date} ${e.time||''}\n`;
    if(e.place) t+=`📍 ${e.place}\n`;
    if(e.qty) t+=`Cantidad: ${e.qty}\n`;
    if(e.notes) t+=`📝 ${e.notes}\n`;
    const luna=mensLunaForKey(e.date); if(luna) t+=`🌙 Luna ${luna.luna} día ${luna.dia}\n`;
    t+='\n— Bitácora bosque nativo · Mari Küla Küyen';
    return t;
  }
}
function renderBosqueDialog(){
  const todayKey=cal.fmtKey.format(new Date());
  const lunaInfo = currentView.tipo==='dft'? null : MOONS[currentView.luna-1];
  let consejoEst='PUKEM'; try{ if(lunaInfo) consejoEst=lunaInfo.estacion; }catch{}
  const consejo=BOSQUE_CONSEJOS[consejoEst]||Object.values(BOSQUE_CONSEJOS)[0];
  const todayBox=$('bosqueTodayBox');
  if(todayBox){
    const cnt=getBosqueData().entries.length;
    const todayCnt=getBosqueData().entries.filter(x=>x.date===todayKey).length;
    const estNombre = lunaInfo? ESTACIONES[lunaInfo.estacion].nombre : '—';
    todayBox.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px"><b>🌳 Hoy — ${cal.fmtFull.format(new Date())} · ${estNombre}</b></span><span class="chip" style="background:var(--gold);color:#10142c">${todayCnt} hoy · ${cnt} total</span></div>`+
      `<p class="muted" style="font-size:11px;margin-top:6px">Cordillera de Penco: bosque esclerófilo (boldo, peumo, quillay) + laurifolio en quebradas (lingue, canelo). No hagas fuego, no dejes rastro.</p>`;
  }
  const moonBox=$('bosqueMoonBox');
  if(moonBox){
    const k=cal.fmtKey.format(new Date());
    // consejo luna
    let tithi=0; try{ tithi=window.astro.tithi(mensKeyToMs(k)); }catch{}
    const fase = tithi<7? 'Creciente — esquejes/brotes' : tithi<14? 'Llena — cosecha frutos/semillas' : tithi<21? 'Menguante — plantar/podar' : 'Nueva — descanso/preparar suelo';
    moonBox.innerHTML=`<b>${fase}</b> (tithi ${tithi}) — guarda semillas en papel, no plástico.`;
  }
  const consejoBox=$('bosqueConsejoBox');
  if(consejoBox && consejo){
    consejoBox.innerHTML=`<h4 style="font-size:11px;color:var(--gold)">🌳 ${escapeHtml(consejo.titulo)}</h4><p class="muted" style="font-size:11px;margin-top:4px">${escapeHtml(consejo.texto)}</p>`;
  }
  const catBox=$('bosqueCatalogBox');
  if(catBox){
    catBox.innerHTML='<div class="fishing-species">'+BOSQUE_CATALOG.map(b=>`<div class="fishing-species-item" style="cursor:pointer" data-bosque="${escapeHtml(b.nombre)}"><b>${b.icon} ${escapeHtml(b.nombre)}</b> — <span class="muted" style="font-size:10px">${escapeHtml(b.cient)}</span><span class="chip" style="font-size:9px;margin-left:6px">${escapeHtml(b.tipo)}</span><br><span style="font-size:11px">${escapeHtml(b.hab)} · ${escapeHtml(b.epoca)}</span><br><span style="font-size:11px;color:var(--gold)">🌰 Semillas: ${escapeHtml(b.semillas||'—')}</span><br><span class="muted" style="font-size:10px">${escapeHtml(b.nota)}</span></div>`).join('')+'</div>';
    catBox.querySelectorAll('[data-bosque]').forEach(el=> el.onclick=()=>{ $('bosqueSpecies').value=el.dataset.bosque; $('bosqueSpecies').focus(); });
  }
  renderBosqueLog();
}
function renderBosqueLog(){
  const box=$('bosqueLogBox'); if(!box) return;
  const data=getBosqueData().entries;
  const stats=$('bosqueStats');
  if(!data.length){ box.innerHTML='<p class="muted">Sin registros. Observa un árbol, planta o cosecha semilla y anótalo.</p>'; if(stats) stats.textContent='0 registros'; return; }
  const sorted=[...data].sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
  box.innerHTML=sorted.slice(0,60).map(it=>{
    const luna=mensLunaForKey(it.date);
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>${escapeHtml(it.species)}</b> · <span class="chip" style="font-size:10px">${escapeHtml(it.action||'observación')}</span> ${it.qty? '· '+escapeHtml(it.qty):''} — ${escapeHtml(it.place||'—')}<br><span class="muted" style="font-size:11px">${it.date} ${it.time||''} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''}</span><br><span class="muted" style="font-size:11px">${escapeHtml(it.notes||'')}</span></span><span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${it.id}" class="btn bosque-share" style="width:auto;font-size:11px" title="Compartir">📤</button><button data-id="${it.id}" class="btn bosque-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn bosque-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`;
  }).join('');
  const speciesSet=new Set(data.map(x=>x.species));
  const byAction={}; data.forEach(x=>{ byAction[x.action]=(byAction[x.action]||0)+1; });
  if(stats) stats.textContent=`${data.length} registros · ${speciesSet.size} especies · ${Object.entries(byAction).map(([k,v])=>k+':'+v).join(' · ')}`;
  box.querySelectorAll('.bosque-share').forEach(b=> b.onclick=async()=>{
    const it=getBosqueData().entries.find(x=>x.id===b.dataset.id); if(!it) return;
    await shareText(`🌳 ${it.species} · ${it.date}`, buildBosqueShareText(it));
  });
  box.querySelectorAll('.bosque-edit').forEach(b=> b.onclick=()=>{
    const d=getBosqueData().entries.find(x=>x.id===b.dataset.id); if(!d) return;
    bosqueEditingId=d.id; $('bosqueDate').value=d.date; $('bosqueTime').value=d.time||'09:00'; $('bosquePlace').value=d.place||''; $('bosqueSpecies').value=d.species||''; $('bosqueAction').value=d.action||'observación'; $('bosqueQty').value=d.qty||''; $('bosqueNotes').value=d.notes||'';
    $('bosqueAdd').textContent='↻ Actualizar'; $('bosqueCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.bosque-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar registro bosque?')) return;
    const arr=getBosqueData().entries; const idx=arr.findIndex(x=>x.id===b.dataset.id); if(idx>=0) arr.splice(idx,1);
    scheduleSave(); renderBosqueDialog(); renderLuna();
  });
}
function setupBosqueDialog(){
  const btn=$('btnBosque'); if(btn) btn.onclick=()=>{ renderBosqueDialog(); const d=$('bosqueDate'); if(d && !d.value) d.value=cal.fmtKey.format(new Date()); $('bosqueDialog').showModal(); };
  const ct=$('bosqueCloseTop'), cb=$('bosqueClose'); if(ct) ct.onclick=()=>$('bosqueDialog').close(); if(cb) cb.onclick=()=>$('bosqueDialog').close();
  const add=$('bosqueAdd'); if(add) add.onclick=()=>{
    const date=$('bosqueDate').value; const species=$('bosqueSpecies').value.trim(); if(!date||!species) return alert('Fecha y especie/acción son obligatorias');
    const rec={ id: bosqueEditingId||'bos'+Date.now(), date, time:$('bosqueTime').value||'09:00', place:$('bosquePlace').value.trim(), species, action:$('bosqueAction').value, qty:$('bosqueQty').value.trim(), notes:$('bosqueNotes').value.trim() };
    const arr=getBosqueData().entries;
    if(bosqueEditingId){ const idx=arr.findIndex(x=>x.id===bosqueEditingId); if(idx>=0) arr[idx]=rec; bosqueEditingId=null; add.textContent='+ Guardar registro'; $('bosqueCancelEdit').classList.add('hidden'); }
    else arr.push(rec);
    scheduleSave(); $('bosqueSpecies').value=''; $('bosqueQty').value=''; $('bosqueNotes').value=''; renderBosqueDialog(); renderLuna();
  };
  const cancel=$('bosqueCancelEdit'); if(cancel) cancel.onclick=()=>{ bosqueEditingId=null; $('bosqueAdd').textContent='+ Guardar registro'; cancel.classList.add('hidden'); $('bosqueSpecies').value=''; $('bosqueQty').value=''; $('bosqueNotes').value=''; };
  const clear=$('bosqueClear'); if(clear) clear.onclick=()=>{ if(!confirm('¿Borrar toda la bitácora bosque?')) return; getBosqueData().entries=[]; scheduleSave(); renderBosqueDialog(); renderLuna(); };
  const shareB=$('bosqueShare'); if(shareB) shareB.onclick=async()=>{
    const arr=getBosqueData().entries;
    if(!arr.length) return alert('Sin registros para compartir');
    await shareText('🌳 Bitácora bosque nativo — Penco', buildBosqueShareText(arr));
  };
  const exp=$('bosqueExport'); if(exp) exp.onclick=()=>{
    const arr=getBosqueData().entries;
    if(!arr.length) return alert('Sin datos para exportar');
    let txt='Bitácora bosque nativo — Penco\nFecha,Hora,Lugar,Especie,Accion,Cantidad,Notas,Luna\n';
    arr.forEach(r=>{ const l=mensLunaForKey(r.date); txt+=`${r.date},${r.time},${r.place},${r.species},${r.action},${r.qty},${r.notes},${l? 'Luna '+l.luna:''}\n`; });
    const blob=new Blob([txt],{type:'text/csv'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='bosque-nativo-penco-'+cal.fmtKey.format(new Date())+'.csv'; a.click(); URL.revokeObjectURL(url);
  };
}
setTimeout(setupBosqueDialog, 576);

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
if (_btnShortcut) _btnShortcut.onclick = async () => {
  const pngB64 = generateIconPNG();
  const res = await window.api.createShortcut(pngB64);
  $('statusMsg').textContent = res.ok ? 'Acceso directo creado ✓' : 'Error: ' + res.error;
  setTimeout(() => { $('statusMsg').textContent = ''; }, 3500);
};

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

function renderTidesPanel3() {
  const panel = $('tidesPanel');
  const todayKey = cal.fmtKey.format(new Date());
  let startIdx = cycle.days.findIndex(d => cal.fmtKey.format(new Date(d.noonMs)) === todayKey);
  if (startIdx < 0) {
    if (currentView.tipo === 'luna') startIdx = (currentView.luna - 1) * 28;
    else startIdx = 0;
  }
  const dias = [];
  for (let i = 0; i < 3; i++) {
    const idx = startIdx + i;
    if (idx >= cycle.days.length) break;
    dias.push(cycle.days[idx]);
  }
  let html = '<div class="tp-head"><b>🌊 Mareas — día y noche</b><span class="muted">Pronóstico SHOA · Talcahuano (válido para Penco) · 3 días · horas locales Biobío</span></div>';
  html += '<div class="tides-3col">';
  for (const dd of dias) {
    const key = cal.fmtKey.format(new Date(dd.noonMs));
    const md = key.slice(5);
    const labelLuna = dd.luna === 'dft' ? 'Día Fuera del Tiempo' : `Luna ${dd.luna} · Día ${dd.diaN} · ${MOONS[dd.luna - 1].nombre}`;
    const tideRes = getTidesForKey(md);
    const tides = tideRes.tides;
    const isEstimated = tideRes.estimated;
    const isToday = key === todayKey;
    html += `<div class="tide-card${isToday ? ' today' : ''}"><div class="tide-head"><b>${cal.weekdayName(dd.noonMs)} ${cal.fmtDate.format(new Date(dd.noonMs))}</b><span>${labelLuna}${isToday ? ' · hoy' : ''}</span></div>`;
    if (tides.length) {
      html += '<table class="tide-mini"><thead><tr><th>Hora</th><th>Altura</th><th>Tipo</th>' + (isEstimated ? '<th style="font-size:9px">Est.</th>' : '') + '</tr></thead><tbody>';
      for (const t of tides) {
        const icon = t.t === 'pleamar' ? '⬆️' : '⬇️';
        html += `<tr><td>${t.h}</td><td>${t.a}</td><td>${icon} ${t.t}</td></tr>`;
      }
      html += '</tbody></table>';
    } else {
      const cell = dd.luna === 'dft' ? null : dayCell(dd.luna, dd.diaN);
      const alta = cell ? (cell.alta || '—') : '—';
      const baja = cell ? (cell.baja || '—') : '—';
      html += `<table class="tide-mini"><tbody><tr><td>🌊 Alta</td><td>${alta}</td></tr><tr><td>🌊 Baja</td><td>${baja}</td></tr></tbody></table><p class="muted" style="font-size:12px;margin-top:6px">Sin pronóstico SHOA precargado para este día.</p>`;
    }
    html += '</div>';
  }
  html += '</div><p class="muted" style="font-size:11.5px;margin-top:10px">Fuente: pronóstico de mareas SHOA · Talcahuano (15 km de Penco). Para navegación consulta siempre la tabla oficial en shoa.cl.</p>';
  panel.innerHTML = html;
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
    <div style="background:linear-gradient(135deg,var(--panel),var(--card));border:1px solid var(--gold);border-radius:10px;padding:12px;margin-bottom:10px">
      <p style="margin:0;font-size:13px;line-height:1.55"><b>📿 ¿Qué es Ekadashi?</b> En sánscrito <i>eka-dasha</i> = once. Es el <b>día 11</b> de cada quincena lunar. Como la luna tarda ~29.5 días, hay <b>2 Ekadashis por mes</b>: <b style="color:#d4a947">Shukla</b> (luna creciente, 11 días después de luna nueva) y <b style="color:#7a6fa5">Krishna</b> (luna menguante, 11 días después de luna llena).</p>
      <p class="muted" style="font-size:11px;margin-top:6px">En Penco lo calculamos astronómicamente: elongación Sol-Luna /12° = tithi. Aquí mostramos el día que ese tithi 11 ó 26 cae al amanecer en America/Santiago.</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
      <div style="background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px"><b style="color:var(--gold)">🌙 ¿Por qué importa?</b><p class="muted" style="font-size:11px;margin:4px 0 0">La luna mueve mareas y tu agua interna (~60% del cuerpo). Ekadashi es un <b>recordatorio</b> para aligerar digestión y mente cuando la luna está en punto de cambio.</p></div>
      <div style="background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px"><b style="color:var(--gold)">✨ Beneficios reportados</b><p class="muted" style="font-size:11px;margin:4px 0 0">Claridad, descanso digestivo, disciplina suave, introspección. No es dieta extrema ni obligación religiosa.</p></div>
    </div>
    <details open style="background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:8px"><summary style="cursor:pointer;color:var(--accent);font-weight:600">🥗 Cómo practicar (paso a paso)</summary>
      <ol style="margin:6px 0 0 18px;font-size:12px;color:#cdd3ee;line-height:1.5">
        <li><b>La tarde anterior:</b> cena ligera, hidrátate.</li>
        <li><b>Día Ekadashi:</b> evita <b>granos, legumbres, carnes pesadas, alcohol</b>. Prioriza fruta, verdura, agua, infusiones, frutos secos pequeños. Si no puedes ayunar completo, haz <b>ayuno parcial</b> (ej: solo fruta hasta mediodía).</li>
        <li><b>Actitud:</b> medita 10 min, lee, camina, evita discusiones y pantallas en exceso. Es día de <b>vaciar</b>, no de exigirse.</li>
        <li><b>Romper ayuno (parana):</b> al día siguiente <b>después del amanecer</b>, con agua tibia + fruta. No rompas de noche.</li>
      </ol>
    </details>
    <details style="background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:8px"><summary style="cursor:pointer;color:var(--accent);font-weight:600">⚠️ Precauciones</summary>
      <p class="muted" style="font-size:11px;margin:6px 0 0">No hagas ayuno total si estás embarazada, amamantando, con diabetes insulino-dependiente, trastorno alimentario o medicación que exige comida. Adapta o consulta a tu profesional. Si tu tradición observa el día anterior/siguiente por inicio de tithi, sigue tu linaje — precisión ±1 día.</p>
    </details>
    <div style="background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin-top:8px;font-size:12px;color:var(--gold)">Mostrando solo <b>3 lunas</b> contando la actual: <span id="ekadashiScope"></span> · <a href="#" id="ekadashiShowAll" style="color:var(--accent)">ver ciclo completo</a></div>`;
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
        html += `<div class="ek-luna"><h4 style="color:var(--muted);font-size:13px;margin:6px 0">${labelEmpty} <span style="font-weight:400">· sin Ekadashi en esta luna</span></h4><p class="muted" style="font-size:12px">No cae tithi 11/26 en estos 28 días. La descripción de la luna: <i>${k !== 'dft' ? MOONS[+k - 1].descripcion : DFT.texto1.slice(0,120)+'…'}</i></p></div>`;
        continue;
      }
      const meta = k === 'dft' ? null : MOONS[+k - 1];
      const desc = k === 'dft' ? DFT.texto1 : meta.descripcion;
      const traduccion = k === 'dft' ? 'Víspera del We Tripantu' : meta.traduccion;
      const label = k === 'dft' ? 'Día Fuera del Tiempo' : `Luna ${k} · ${meta.nombre} <span style="color:var(--muted);font-weight:400">· ${cal.fmtDate.format(new Date(cycle.start + ((+k - 1) * 28) * 86400000))} – ${cal.fmtDate.format(new Date(cycle.start + ((+k - 1) * 28 + 27) * 86400000))}</span>`;
      const isCurrent = currentView.tipo === 'luna' && String(currentView.luna) === k || currentView.tipo === 'dft' && k === 'dft';
      html += `<div class="ek-luna" style="${isCurrent ? 'outline:1px solid var(--gold);border-radius:10px;padding:6px' : ''}"><h4 style="color:var(--accent);font-size:13px;margin:6px 0">${label}</h4><p class="muted" style="font-size:12px;margin:0 0 6px;line-height:1.4"><i>${escapeHtml(traduccion)}</i> — ${escapeHtml(desc)}</p>`;
      for (const it of arr) {
        const key = cal.fmtKey.format(new Date(it.dd.noonMs));
        const isToday = key === cal.fmtKey.format(new Date());
        html += `<div class="ek-card${isToday ? ' today' : ''}"><h4>${cal.weekdayName(it.dd.noonMs)} ${cal.fmtFull.format(new Date(it.dd.noonMs))} <span class="ek-badge ${it.badge}">${it.paksha}</span> <span style="font-weight:400;color:var(--muted);font-size:12px">· tithi ${it.tithi}</span>${isToday ? ' · hoy' : ''}</h4><div class="ek-meta">Luna ${it.dd.luna} · Día ${it.dd.diaN} · ${cal.fmtDate.format(new Date(it.dd.noonMs))}</div></div>`;
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
    const agendaHtml = Array.isArray(cell.agenda)&&cell.agenda.length ? `<div class="pd-note">🕐 ${escapeHtml(cell.agenda.map(a=> String(a.hour).padStart(2,'0')+':00 '+a.text).join(' · '))}</div>` : '';
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
        <h3 style="font-size:9pt;color:#666;margin-top:8px">REFLEXIÓN DEL CICLO</h3>
        <div style="border:1px solid #999;border-radius:6px;min-height:60px;padding:6px;font-size:9pt;white-space:pre-wrap">${escapeHtml(cc ? cc.dft.nota : '') || '&nbsp;'}</div>
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
          <h3 style="font-size:9pt;color:#666;margin-top:8px">REFLEXIÓN DEL CICLO</h3>
          <div style="border:1px solid #999;border-radius:6px;min-height:60px;padding:6px;font-size:9pt;white-space:pre-wrap">${escapeHtml(cc ? cc.dft.nota : '') || '&nbsp;'}</div>
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
$('btnPdfLuna').onclick = () => exportPDF(false);
$('btnPdfCiclo').onclick = () => exportPDF(true);

$('btnToday').onclick = () => {
  const info = todayInfo();
  if (!info) return;
  if (String(info.y) !== $('cycleSel').value) {
    selectCycle(info.y, info.luna === 'dft' ? 'dft' : info.luna);
  }
  if (info.luna === 'dft') selectDFT(); else selectMoon(info.luna);
};

$('searchBox').addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch($('searchBox').value.trim());
});

function runSearch(q) {
  if (q.length < 2) return;
  const ql = q.toLowerCase();
  const hits = [];
  const cycles = userData().cycles;
  for (const [y, c] of Object.entries(cycles)) {
    for (const [ln, m] of Object.entries(c.moons || {})) {
      for (const [dn, cell] of Object.entries(m.days || {})) {
        const agendaTxt = Array.isArray(cell.agenda) ? cell.agenda.map(a=>a.text).join(' ') : '';
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

$('btnBackup').onclick = async () => {
  const r = await window.api.backupSave(JSON.stringify(DATA, null, 1));
  $('statusMsg').textContent = r ? 'Respaldo guardado ✓' : 'Cancelado';
  setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
};

$('btnRestore').onclick = async () => {
  const j = await window.api.backupOpen();
  if (!j) return;
  try {
    const d = JSON.parse(j);
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
  } catch (e) {
    console.warn('Restore error', e);
    $('statusMsg').textContent = 'Archivo de respaldo no válido';
  }
  setTimeout(() => { $('statusMsg').textContent = ''; }, 2500);
};

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
function getMensData() {
  const u = userData();
  if (!u.menstrual) u.menstrual = { cycleLen: 28, periodLen: 5, history: [], showCal: true, notify: false };
  if (typeof u.menstrual.cycleLen !== 'number') u.menstrual.cycleLen = 28;
  if (typeof u.menstrual.periodLen !== 'number') u.menstrual.periodLen = 5;
  if (!Array.isArray(u.menstrual.history)) u.menstrual.history = [];
  if (typeof u.menstrual.showCal !== 'boolean') u.menstrual.showCal = true;
  if (typeof u.menstrual.notify !== 'boolean') u.menstrual.notify = false;
  u.menstrual.history = [...new Set(u.menstrual.history)].sort();
  return u.menstrual;
}
function mensKeyToMs(k) { const [y,m,d]=k.split('-').map(Number); return Date.UTC(y,m-1,d,12); }
function mensMsToKey(ms) { return cal.fmtKey.format(new Date(ms)); }
function getMensPredictions() {
  const md = getMensData();
  const hist = md.history.slice().sort();
  if (!hist.length) return null;
  const last = hist[hist.length-1];
  let lastMs = mensKeyToMs(last);
  const nowKey = cal.fmtKey.format(new Date());
  const nowMs = mensKeyToMs(nowKey);
  // avanzar si último ya pasó + ciclo
  while (lastMs + md.cycleLen*86400000 <= nowMs) lastMs += md.cycleLen*86400000;
  // próximo periodo es el siguiente ciclo si hoy está después del último + ciclo? ajuste
  let nextMs = lastMs;
  if (nextMs < nowMs) nextMs += md.cycleLen*86400000;
  // si hoy es el mismo día del último, next es ese mismo? mantener
  if (hist.includes(nowKey) && mensKeyToMs(nowKey) === lastMs) nextMs = lastMs;
  else if (nextMs <= nowMs && hist[hist.length-1] !== nowKey) { /* si ya pasó */ }
  // corrección: si la última fecha es hace más de ciclo, next debe proyectarse
  // recalcular correctamente: buscar next >= hoy
  let probe = mensKeyToMs(hist[hist.length-1]);
  let nextPeriodMs = probe;
  while (nextPeriodMs < nowMs) nextPeriodMs += md.cycleLen*86400000;
  // si hoy es exactamente un histórico, considerar ese como próximo
  if (hist.includes(nowKey)) nextPeriodMs = mensKeyToMs(nowKey);
  const periodLen = md.periodLen;
  const cycleLen = md.cycleLen;
  const ovulationMs = nextPeriodMs + (cycleLen - 14)*86400000;
  const fertileStart = ovulationMs - 4*86400000;
  const fertileEnd = ovulationMs + 1*86400000;
  const periodEnd = nextPeriodMs + (periodLen-1)*86400000;
  // conjuntos para calendario (±90 días)
  const map = {};
  const pred = [];
  for (let i=-1; i<4; i++) {
    const pStart = nextPeriodMs + i*cycleLen*86400000;
    const pEnd = pStart + (periodLen-1)*86400000;
    const ov = pStart + (cycleLen-14)*86400000;
    const fS = ov - 4*86400000, fE = ov + 1*86400000;
    pred.push({ pStart, pEnd, ov, fS, fE });
    for (let d=pStart; d<=pEnd; d+=86400000) map[mensMsToKey(d)] = 'period';
    for (let d=fS; d<=fE; d+=86400000) if(!map[mensMsToKey(d)]) map[mensMsToKey(d)] = 'fertile';
    if (!map[mensMsToKey(ov)]) map[mensMsToKey(ov)] = 'ovulation'; else map[mensMsToKey(ov)]='ovulation';
  }
  // históricos también marcar como period
  hist.forEach(k=>{
    const ms = mensKeyToMs(k);
    for(let d=ms; d<ms+periodLen*86400000; d+=86400000) map[mensMsToKey(d)]='period';
  });
  return { md, hist, nextPeriodMs, periodEnd, ovulationMs, fertileStart, fertileEnd, map, pred };
}
function mensLunaForKey(key) {
  const ms = mensKeyToMs(key);
  for (const y of CYCLE_YEARS) {
    const c = cal.buildCycle(y);
    for (const d of c.days) if (mensMsToKey(d.noonMs)===key) return { y, luna: d.luna, dia: d.diaN };
  }
  return null;
}
function renderMensPredictBox() {
  const box = $('mensPredictBox');
  if (!box) return;
  const pred = getMensPredictions();
  const md = getMensData();
  if (!pred) {
    box.innerHTML = `<h4 style="color:var(--gold)">🔮 Predicción</h4><p class="muted">Aún sin registros. Agrega tu último inicio para ver predicción.</p><p class="muted" style="font-size:11px">13 lunas × 28 días = 364 días. Muchas personas notan sincronía cuerpo-luna en ciclos de 27-30 días — úsalo como ritual, no como diagnóstico.</p>`;
    return;
  }
  const fmt = d=> cal.fmtFull.format(new Date(d));
  const wk = d=> cal.weekdayName(d);
  const nextKey = mensMsToKey(pred.nextPeriodMs);
  const lunaInfo = mensLunaForKey(nextKey);
  const lunaTxt = lunaInfo ? `Luna ${lunaInfo.luna} · Día ${lunaInfo.dia} · ${lunaInfo.luna==='dft'?'Día Fuera del Tiempo':MOONS[lunaInfo.luna-1].nombre}` : '';
  const daysUntil = Math.round((pred.nextPeriodMs - mensKeyToMs(cal.fmtKey.format(new Date())))/86400000);
  const untilTxt = daysUntil===0? '¡hoy!': daysUntil===1? 'mañana': `en ${daysUntil} días`;
  box.innerHTML = `
    <h4 style="color:var(--gold)">🔮 Predicción (ciclo ${md.cycleLen}d · sangrado ${md.periodLen}d)</h4>
    <div class="mens-pred-grid">
      <div class="mens-pred-item period"><span class="mens-dot period"></span><b>Próximo periodo</b><span>${wk(pred.nextPeriodMs)} ${fmt(pred.nextPeriodMs)} — ${untilTxt}</span><span style="font-size:11px;color:var(--muted)">${lunaTxt}</span><span style="font-size:11px">Hasta ${fmt(pred.periodEnd)}</span></div>
      <div class="mens-pred-item fertile"><span class="mens-dot fertile"></span><b>Ventana fértil</b><span>${fmt(pred.fertileStart)} → ${fmt(pred.fertileEnd)}</span><span style="font-size:11px;color:var(--muted)">~ ovulación ${fmt(pred.ovulationMs)}</span></div>
      <div class="mens-pred-item ovulation"><span class="mens-dot ovulation"></span><b>Ovulación estimada</b><span>${wk(pred.ovulationMs)} ${fmt(pred.ovulationMs)}</span><span style="font-size:11px;color:var(--muted)">ciclo día ${md.cycleLen-13} (ciclo-14)</span></div>
    </div>
    <p class="muted" style="font-size:11px;margin-top:8px">Próximos 3 periodos: ${pred.pred.slice(0,3).map(p=>mensMsToKey(p.pStart)).join(' · ')}. <br>Estimación estadística; tu cuerpo es soberano. Si hay irregularidad o preocupación, consulta profesional.</p>`;
}
function renderMensLunaBox() {
  const box = $('mensLunaBox'); if(!box) return;
  const pred = getMensPredictions();
  if (!pred || !pred.nextPeriodMs) { box.innerHTML = ''; return; }
  const info = mensLunaForKey(mensMsToKey(pred.nextPeriodMs));
  if (!info) { box.innerHTML=''; return;}
  const meta = info.luna==='dft'? null : MOONS[info.luna-1];
  box.innerHTML = `<h4 style="color:var(--accent)">🌙 Tu próximo periodo y la luna</h4><p style="font-size:13px;color:#cdd3ee">Cae en <b>${info.luna==='dft'?'Día Fuera del Tiempo':`Luna ${info.luna} · ${meta.nombre}`}</b> (día ${info.dia} de 28). <i>${info.luna==='dft'?DFT.texto1.slice(0,140)+'…':meta.descripcion}</i></p><p class="muted" style="font-size:11px">En el calendario verás puntos 🌸 período · 🌿 fértil · ✨ ovulación. La luna perfecta no exige regularidad perfecta.</p>`;
}
function renderMensHistory() {
  const box = $('mensHistoryBox'); if(!box) return;
  const md = getMensData();
  if (!md.history.length) { box.innerHTML = '<h4>📜 Historial</h4><p class="muted">Sin registros aún. Usa “Registrar hoy” o el calendario (botón 🌸 en cada día).</p>'; return; }
  const sorted = md.history.slice().sort().reverse().slice(0,18);
  box.innerHTML = `<h4>📜 Historial — ${md.history.length} inicios</h4><div class="mens-history">`+ sorted.map(k=>{
    const ms = mensKeyToMs(k);
    const luna = mensLunaForKey(k);
    const lunaTxt = luna? `· Luna ${luna.luna} d${luna.dia}`: '';
    const isLast = k===md.history[md.history.length-1];
    return `<div class="mens-hist-item"><span>${cal.weekdayName(ms)} ${cal.fmtFull.format(new Date(ms))} ${lunaTxt} ${isLast?'<span style="color:var(--gold)">· último</span>':''}</span><button data-k="${k}" class="btn btn-icon mens-del" title="Eliminar">✕</button></div>`;
  }).join('') + `</div>`;
  box.querySelectorAll('.mens-del').forEach(b=> b.onclick=()=>{
    const k=b.dataset.k;
    const md2=getMensData();
    md2.history = md2.history.filter(x=>x!==k);
    scheduleSave();
    renderMensHistory(); renderMensPredictBox(); renderMensLunaBox();
    if (md2.showCal) renderLuna();
  });
}
function openMensDialog() {
  const md = getMensData();
  $('mensCycleLen').value = md.cycleLen;
  $('mensPeriodLen').value = md.periodLen;
  $('mensShowCal').checked = md.showCal;
  $('mensNotify').checked = md.notify;
  $('mensLastDate').value = md.history.length? md.history[md.history.length-1]: '';
  renderMensPredictBox(); renderMensLunaBox(); renderMensHistory();
  $('menstrualDialog').showModal();
  // check notif perm if needed
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
  const cycIn = $('mensCycleLen'), perIn = $('mensPeriodLen'), showIn = $('mensShowCal'), notIn = $('mensNotify');
  if (cycIn) cycIn.onchange = ()=>{ const v=parseInt(cycIn.value)||28; getMensData().cycleLen=Math.min(45,Math.max(20,v)); cycIn.value=getMensData().cycleLen; scheduleSave(); renderMensPredictBox(); renderMensLunaBox(); if(getMensData().showCal) renderLuna(); };
  if (perIn) perIn.onchange = ()=>{ const v=parseInt(perIn.value)||5; getMensData().periodLen=Math.min(10,Math.max(1,v)); perIn.value=getMensData().periodLen; scheduleSave(); renderMensPredictBox(); if(getMensData().showCal) renderLuna(); };
  if (showIn) showIn.onchange = ()=>{ getMensData().showCal=showIn.checked; scheduleSave(); renderLuna(); };
  if (notIn) notIn.onchange = async ()=>{ getMensData().notify=notIn.checked; scheduleSave(); if(notIn.checked) try{ if(Notification&&Notification.requestPermission) await Notification.requestPermission(); mensCheckNotify(); }catch{} };
  const addLast = $('mensAddLast'); if (addLast) addLast.onclick = ()=>{
    const v=$('mensLastDate').value; if(!v) return;
    const md=getMensData();
    if(!md.history.includes(v)) md.history.push(v);
    md.history.sort(); scheduleSave(); renderMensHistory(); renderMensPredictBox(); renderMensLunaBox(); if(md.showCal) renderLuna();
  };
  const addToday = $('mensAddToday'); if(addToday) addToday.onclick = ()=>{
    const today=cal.fmtKey.format(new Date());
    const md=getMensData();
    if(!md.history.includes(today)) md.history.push(today);
    md.history.sort(); scheduleSave(); $('mensLastDate').value=today; renderMensHistory(); renderMensPredictBox(); renderMensLunaBox(); if(md.showCal) renderLuna();
  };
  const clearBtn=$('mensClear'); if(clearBtn) clearBtn.onclick = ()=>{
    if(!confirm('¿Borrar todo el historial menstrual de esta usuaria?')) return;
    getMensData().history=[]; scheduleSave(); renderMensHistory(); renderMensPredictBox(); renderMensLunaBox(); if(getMensData().showCal) renderLuna();
  };
}
setTimeout(setupMensDialogEvents, 400);
setInterval(()=>{ try{ mensCheckNotify(); }catch{} }, 60*60*1000);

// === DIAGRAMA HORMONAL ===
const HORM = {
  estrogen:   [30,28,26,25,27,35,45,55,68,78,85,92,88,60,50,55,62,68,72,70,62,55,45,38,32,30,28,27],
  progesterone:[12,11,10,10,12,14,13,12,14,16,18,22,28,35,45,62,75,82,85,84,78,65,50,38,25,18,14,12],
  lh:         [18,16,15,14,15,16,18,20,22,28,38,55,92,95,35,20,18,16,15,14,13,13,12,12,11,12,14,16],
  fsh:        [42,44,45,43,38,32,28,24,20,18,16,15,18,28,32,28,24,20,18,16,15,14,14,15,16,20,28,35]
};
function hormDayInfoText(d) {
  const e=HORM.estrogen[d-1], p=HORM.progesterone[d-1], l=HORM.lh[d-1], f=HORM.fsh[d-1];
  let fase='', energia='', alimentos='', entreno='', practicas='', cuidados='';
  if(d<=5){
    fase='Menstrual · Invierno (Pukem) — días 1-5';
    energia='Descanso e introspección. Estrógeno y progesterona en mínimo. Cuerpo pide vaciar.';
    alimentos='🥗 <b>Alimentos:</b> lentejas, espinaca, betarraga, carne roja magra/palta, frutos rojos, chocolate 80% + naranja (hierro+vit C), agua con pizca de sal, ortiga/manzanilla.';
    entreno='🏋️ <b>Entrenamiento:</b> muy suave — yoga restaurativo, estirar 15 min, caminar lento 20-30 min. Evita HIIT/fuerza pesada.';
    practicas='🧘 <b>Prácticas:</b> baño caliente, compresa tibia vientre, diario emocional, decir que no, respiración 4-7-8.';
    cuidados='🌿 <b>Cuidados:</b> prioriza 8h sueño, evita alcohol/cafeína, magnesio (cacao/almendras), calor local.';
  } else if(d<=13){
    fase='Folicular · Primavera (Pewü) — días 6-13';
    energia='Energía ascendente. Estrógeno sube, ánimo creativo y sociable.';
    alimentos='🥗 <b>Alimentos:</b> brotes, brócoli, zanahoria, quinoa, huevos, pollo/pescado blanco, semillas zapallo, yogur/kéfir.';
    entreno='🏋️ <b>Entrenamiento:</b> progresivo — fuerza, correr, bici, probar deporte nuevo. Buen momento para iniciar rutina.';
    practicas='🧘 <b>Prácticas:</b> planificar siembra/proyectos, brainstorming, ordenar espacios, socializar.';
    cuidados='🌿 <b>Cuidados:</b> zinc y probióticos, hidratación 1.5-2L, luz de mañana 15 min.';
  } else if(d<=16){
    fase='Ovulatoria · Verano (Walüng) — días 14-16';
    energia='Pico LH/FSH. Fertilidad y magnetismo máximos. Energía plena.';
    alimentos='🥗 <b>Alimentos:</b> ligero y antioxidante — cítricos, pimentón, espárragos, berries, semillas sésamo/girasol, agua de coco.';
    entreno='🏋️ <b>Entrenamiento:</b> pico de rendimiento — HIIT, fuerza máxima, baile, deporte grupal.';
    practicas='🧘 <b>Prácticas:</b> comunicar, presentar, ritual luna llena, creatividad, intimidad consciente.';
    cuidados='🌿 <b>Cuidados:</b> apoya hígado (crucíferas, limón), evita ultraprocesados, hidrátate.';
  } else {
    fase='Lútea · Otoño (Rimü) — días 17-28';
    energia='Progesterona domina y luego cae. Necesidad de anidar, bajar ritmo y poner límites.';
    alimentos='🥗 <b>Alimentos:</b> complejos — avena, camote, arroz integral, plátano, cacao, almendras, sésamo, brócoli; más fibra, menos azúcar/sal/cafeína.';
    entreno='🏋️ <b>Entrenamiento:</b> 17-22 moderado (pilates, nado, bici suave); 23-28 suave (yin yoga, caminar, estirar, esp. espalda baja).';
    practicas='🧘 <b>Prácticas:</b> anidar/ordenar casa, listas, límites claros, meditación, masaje, escritura reflexiva.';
    cuidados='🌿 <b>Cuidados:</b> magnesio+calcio para PMS, baños tibios, pasiflora/valeriana, dormir temprano, evita decisiones grandes días 26-28.';
  }
  return `<b>Día ${d} — ${fase}</b><br><span style="color:#e76e8a">● Estrógeno ${e}</span> · <span style="color:#7ab8ff">● Progesterona ${p}</span> · <span style="color:#e8c56a">● LH ${l}</span> · <span style="color:#8fd694">● FSH ${f}</span><br><span style="color:var(--muted)">${energia}</span>
    <div class="horm-suggest-grid">
      <div class="horm-suggest-card">${alimentos}</div>
      <div class="horm-suggest-card">${entreno}</div>
      <div class="horm-suggest-card">${practicas}</div>
      <div class="horm-suggest-card">${cuidados}</div>
    </div>
    <p class="muted" style="font-size:10px;margin-top:6px">Sugerencias educativas, no reemplazan consejo médico. Escucha tu cuerpo: si algo no te sirve, descártalo.</p>`;
}
function renderHormonalChart(highlightDay) {
  const canvas=$('hormonalChart'); if(!canvas) return;
  const dpr = window.devicePixelRatio||1;
  const w=480, h=220; canvas.width=w*dpr; canvas.height=h*dpr; canvas.style.width='100%'; const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  // fondo
  ctx.fillStyle='#161e3f'; ctx.fillRect(0,0,w,h);
  const pad={l:36,r:10,t:12,b:22};
  const plotW=w-pad.l-pad.r, plotH=h-pad.t-pad.b;
  // grid
  ctx.strokeStyle='#2a3565'; ctx.lineWidth=0.6;
  for(let i=0;i<=4;i++){ const y=pad.t+plotH*i/4; ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke(); ctx.fillStyle='#9aa3c7'; ctx.font='9px sans-serif'; ctx.textAlign='right'; ctx.fillText(String(100-i*25), pad.l-6, y+3); }
  for(let d=1;d<=28;d+=7){ const x=pad.l+plotW*(d-1)/27; ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,h-pad.b); ctx.stroke(); ctx.fillStyle='#9aa3c7'; ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.fillText('D'+d, x, h-6); }
  const colors={estrogen:'#e76e8a',progesterone:'#7ab8ff',lh:'#e8c56a',fsh:'#8fd694'};
  function drawLine(arr,color,lineW){ ctx.strokeStyle=color; ctx.lineWidth=lineW; ctx.beginPath(); arr.forEach((v,i)=>{ const x=pad.l+plotW*i/27, y=pad.t+plotH*(1-v/100); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }
  drawLine(HORM.estrogen, colors.estrogen, 2);
  drawLine(HORM.progesterone, colors.progesterone, 2);
  drawLine(HORM.lh, colors.lh, 2);
  drawLine(HORM.fsh, colors.fsh, 1.6);
  // highlight
  if(highlightDay>=1&&highlightDay<=28){
    const x=pad.l+plotW*(highlightDay-1)/27;
    ctx.strokeStyle='#ffffff55'; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,h-pad.b); ctx.stroke(); ctx.setLineDash([]);
    // puntos
    [['estrogen',colors.estrogen],['progesterone',colors.progesterone],['lh',colors.lh],['fsh',colors.fsh]].forEach(([k,c])=>{ const v=HORM[k][highlightDay-1]; const y=pad.t+plotH*(1-v/100); ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke(); });
  }
  // leyenda fases fondo
  ctx.fillStyle='#ffffff0a';
  const phases=[[1,5],[6,13],[14,16],[17,28]];
  phases.forEach(([a,b])=>{ const x1=pad.l+plotW*(a-1)/27, x2=pad.l+plotW*(b-1)/27; ctx.fillRect(x1,pad.t,x2-x1,plotH); });
}
function setupHormonalChart(){
  const canvas=$('hormonalChart'), slider=$('hormDaySlider'), label=$('hormDayLabel'), info=$('hormDayInfo'), tip=$('hormonalTooltip');
  if(!canvas||!slider) return;
  function update(d){
    const day=Math.min(28,Math.max(1,parseInt(d)||1));
    slider.value=day; if(label) label.textContent='Día '+day;
    if(info) info.innerHTML=hormDayInfoText(day);
    renderHormonalChart(day);
  }
  slider.oninput=()=> update(slider.value);
  canvas.addEventListener('mousemove', e=>{
    const rect=canvas.getBoundingClientRect(); const x=e.clientX-rect.left; const plotW=rect.width-46; const padL=36*rect.width/480;
    let day=Math.round((x-padL)/plotW*27)+1; day=Math.min(28,Math.max(1,day));
    if(tip){ tip.textContent='Día '+day; tip.style.left=(e.clientX-rect.left)+'px'; tip.style.top='12px'; tip.classList.remove('hidden'); }
    update(day);
  });
  canvas.addEventListener('mouseleave', ()=>{ if(tip) tip.classList.add('hidden'); });
  canvas.addEventListener('click', e=>{
    const rect=canvas.getBoundingClientRect(); const x=e.clientX-rect.left; const plotW=rect.width-46; const padL=36*rect.width/480;
    let day=Math.round((x-padL)/plotW*27)+1; day=Math.min(28,Math.max(1,day)); update(day);
  });
  // inicial según día del ciclo si hay pred
  let initDay=1;
  try{ const p=getMensPredictions(); if(p){ const todayKey=cal.fmtKey.format(new Date()); const hist=getMensData().history; // calcular día actual del ciclo
    const last=hist.slice().sort().pop(); if(last){ const diff=Math.floor((mensKeyToMs(todayKey)-mensKeyToMs(last))/86400000); if(diff>=0) initDay=(diff%getMensData().cycleLen)+1; } } }catch{}
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
    div.innerHTML=`<div class="medic-head"><b>💊 ${escapeHtml(med.name)}</b> <span class="muted" style="font-size:11px">${escapeHtml(med.dose||'')}</span></div><div class="muted" style="font-size:12px">⏰ ${med.freq} ${med.time} ${med.days? '('+escapeHtml(med.days)+')':''} · ${med.from||'?'} → ${med.to||'∞'}</div><div class="muted" style="font-size:11px">${escapeHtml(med.notes||'')}</div><div style="margin-top:4px;font-size:12px;color:var(--gold)">Próxima: ${nextTxt} ${luna? '· Luna '+luna.luna:''}</div><div class="dlg-actions" style="justify-content:flex-end;margin-top:6px"><button data-id="${med.id}" class="btn medic-edit" style="width:auto;font-size:11px">✏️ Editar</button><button data-id="${med.id}" class="btn medic-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Eliminar</button></div>`;
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
  box.innerHTML='<h4 style="color:var(--gold)">⏰ Próximas tomas — farmacología + natural (5)</h4>'+ (next5.length? '<div class="mens-history">'+ next5.map(o=>`<div class="mens-hist-item"><span><b>${o.med._tipo} ${escapeHtml(o.med.name)}</b> — ${cal.weekdayName(o.t)} ${cal.fmtFull.format(new Date(o.t))} ${cal.fmtTime.format(new Date(o.t))} · ${escapeHtml(o.med.dose||o.med.notes||'')}</span><span class="muted" style="font-size:10px">${o.t-Date.now()<3600000? '¡pronto!':''}</span></div>`).join('')+'</div>' : '<p class="muted">Sin tomas próximas.</p>');
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
function setupMedicDialog(){
  const btn=$('btnMedic'); if(btn) btn.onclick=()=>{
    renderMedicList(); renderNaturalList(); renderNaturalUserList(); renderMedicNextBox();
    const c=$('medicNotify'); if(c) c.checked=getMedicData().notify;
    const mf=$('medicFrom'); if(mf && !mf.value) mf.value=cal.fmtKey.format(new Date());
    const nf=$('naturalFrom'); if(nf && !nf.value) nf.value=cal.fmtKey.format(new Date());
    // tabs default
    const farPanel=$('medicFarmaPanel'), natPanel=$('medicNaturalPanel'), tF=$('tabMedicFarma'), tN=$('tabMedicNatural');
    if(farPanel && natPanel){ farPanel.classList.remove('hidden'); natPanel.classList.add('hidden'); if(tF) tF.classList.add('btn-accent'); if(tN) tN.classList.remove('btn-accent'); }
    $('medicDialog').showModal();
  };
  const cTop=$('medicCloseTop'), cBot=$('medicClose'); if(cTop) cTop.onclick=()=>$('medicDialog').close(); if(cBot) cBot.onclick=()=>$('medicDialog').close();
  // tabs
  const tF=$('tabMedicFarma'), tN=$('tabMedicNatural');
  if(tF) tF.onclick=()=>{ $('medicFarmaPanel').classList.remove('hidden'); $('medicNaturalPanel').classList.add('hidden'); tF.classList.add('btn-accent'); tN.classList.remove('btn-accent'); };
  if(tN) tN.onclick=()=>{ $('medicNaturalPanel').classList.remove('hidden'); $('medicFarmaPanel').classList.add('hidden'); tN.classList.add('btn-accent'); tF.classList.remove('btn-accent'); };
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
  else d.entries[dateKey][habitId]=true;
  if(Object.keys(d.entries[dateKey]).length===0) delete d.entries[dateKey];
  scheduleSave();
}
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
  let doneThisMonth=0;
  for(let day=1;day<=daysInMonth;day++){
    const k=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    // convertir a key Santiago (usar fmtKey noon) - aproximación: usar misma k
    const key=cal.fmtKey.format(new Date(Date.UTC(y,m-1,day,12)));
    if(d.entries[key] && d.entries[key][habitId]) doneThisMonth++;
  }
  const pct = daysInMonth? Math.round(doneThisMonth/daysInMonth*100):0;
  const total=Object.keys(d.entries).filter(k=> d.entries[k][habitId]).length;
  return { doneThisMonth, daysInMonth, pct, total };
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
    div.innerHTML=`<div class="habit-head"><span class="habit-icon" style="background:${h.color}22;border-color:${h.color}55;color:${h.color}">${escapeHtml(h.icono||'✓')}</span><b>${escapeHtml(h.nombre)}</b><span class="muted" style="font-size:11px">${h.freq==='diaria'?'Diaria':'Semanal'}</span></div><div class="habit-stats"><span>🔥 Racha ${st} días</span><span>📊 ${stats.pct}% mes (${stats.doneThisMonth}/${stats.daysInMonth})</span><span>✅ Total ${stats.total}</span></div><div class="dlg-actions" style="justify-content:flex-end;margin-top:6px"><button data-id="${h.id}" class="btn habit-toggle-today" style="width:auto;font-size:11px">◉ Hoy</button><button data-id="${h.id}" class="btn habit-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${h.id}" class="btn habit-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></div>`;
    box.appendChild(div);
  });
  box.querySelectorAll('.habit-toggle-today').forEach(b=> b.onclick=()=>{
    const today=cal.fmtKey.format(new Date());
    habitToggle(today,b.dataset.id);
    renderHabitsList(); renderHabitsTodayBox(); renderHabitsStatsBox(); renderHabitsLunaBox(); renderDlgHabits(); if(getMensData().showCal||true) renderLuna();
  });
  box.querySelectorAll('.habit-edit').forEach(b=> b.onclick=()=>{
    const h=data.list.find(x=>x.id===b.dataset.id); if(!h) return;
    habitEditingId=h.id; $('habitName').value=h.nombre; $('habitIcon').value=h.icono; $('habitColor').value=h.color; $('habitFreq').value=h.freq;
    $('habitAdd').classList.add('hidden'); $('habitUpdate').classList.remove('hidden'); $('habitCancelEdit').classList.remove('hidden');
  });
  box.querySelectorAll('.habit-del').forEach(b=> b.onclick=()=>{
    if(!confirm('¿Eliminar hábito y su historial?')) return;
    const id=b.dataset.id; data.list=data.list.filter(x=>x.id!==id);
    Object.keys(data.entries).forEach(k=>{ if(data.entries[k][id]) delete data.entries[k][id]; if(Object.keys(data.entries[k]||{}).length===0) delete data.entries[k]; });
    scheduleSave(); renderHabitsList(); renderHabitsTodayBox(); renderHabitsStatsBox(); renderHabitsLunaBox(); renderDlgHabits(); renderLuna();
  });
}
function renderHabitsTodayBox(){
  const box=$('habitsTodayBox'); if(!box) return;
  const data=getHabitData();
  const today=cal.fmtKey.format(new Date());
  if(!data.list.length){ box.innerHTML='<p class="muted">Crea hábitos para marcarlos cada día.</p>'; return; }
  box.innerHTML='<h4 style="color:var(--gold)">◉ Hoy — '+cal.weekdayName(Date.now())+' '+cal.fmtFull.format(new Date())+'</h4><div class="habits-today-grid">'+ data.list.map(h=>{
    const done = data.entries[today] && data.entries[today][h.id];
    return `<label class="habit-today-item ${done?'done':''}" style="border-color:${h.color}55"><input type="checkbox" data-id="${h.id}" ${done?'checked':''}><span class="habit-icon" style="background:${h.color}22;color:${h.color}">${escapeHtml(h.icono||'✓')}</span><span>${escapeHtml(h.nombre)}</span></label>`;
  }).join('')+'</div>';
  box.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.onchange=()=>{
    habitToggle(today, cb.dataset.id);
    renderHabitsList(); renderHabitsStatsBox(); renderHabitsLunaBox(); renderDlgHabits(); renderLuna();
  });
}
function renderHabitsStatsBox(){
  const box=$('habitsStatsBox'); if(!box) return;
  const data=getHabitData();
  if(!data.list.length){ box.innerHTML=''; return; }
  const today=cal.fmtKey.format(new Date());
  const daysInMonth=new Date(new Date().getFullYear(), new Date().getMonth()+1,0).getDate();
  let totalDoneToday=0; data.list.forEach(h=>{ if(data.entries[today] && data.entries[today][h.id]) totalDoneToday++; });
  const pctToday = data.list.length? Math.round(totalDoneToday/data.list.length*100):0;
  box.innerHTML=`<h4 style="color:var(--accent)">📈 Resumen</h4><div class="habit-stats" style="flex-direction:column;align-items:flex-start"><span>Hoy: ${totalDoneToday}/${data.list.length} (${pctToday}%) completados</span><span>Hábitos activos: ${data.list.length} · Registros: ${Object.keys(data.entries).length} días</span></div><div style="margin-top:6px;background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:${pctToday}%;height:100%;background:linear-gradient(90deg,#e8c56a,#a9d18e);transition:width .3s"></div></div>`;
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
  box.innerHTML=`<h4 style="color:var(--accent)">🌙 ${lunaName} — hábitos</h4><p class="muted" style="font-size:12px">${doneInLuna} checks de ${totalPossible} posibles (${pct}%)</p><div style="margin-top:6px;background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a);transition:width .3s"></div></div>`;
}
function renderDlgHabits(){
  const box=$('dlgHabits'); if(!box) return;
  const data=getHabitData();
  if(!data.list.length){ box.innerHTML=''; return; }
  if(!editing) { box.innerHTML=''; return; }
  const d=cycle.days.find(x=>x.luna===editing.lunaN && x.diaN===editing.diaN);
  if(!d) { box.innerHTML=''; return; }
  const key=cal.fmtKey.format(new Date(d.noonMs));
  box.innerHTML='<label style="font-size:12px;color:var(--muted);margin-bottom:4px;display:block">✅ Hábitos de este día</label><div class="habits-today-grid">'+ data.list.map(h=>{
    const done=data.entries[key] && data.entries[key][h.id];
    return `<label class="habit-today-item ${done?'done':''}" style="border-color:${h.color}55"><input type="checkbox" data-id="${h.id}" ${done?'checked':''}><span class="habit-icon" style="background:${h.color}22;color:${h.color}">${escapeHtml(h.icono||'✓')}</span><span>${escapeHtml(h.nombre)}</span></label>`;
  }).join('')+'</div>';
  box.querySelectorAll('input').forEach(cb=> cb.onchange=()=>{
    habitToggle(key, cb.dataset.id);
    renderHabitsList(); renderHabitsTodayBox(); renderHabitsStatsBox(); renderHabitsLunaBox(); renderLuna();
    // mantener estado visual
    const lab=cb.closest('label'); if(cb.checked) lab.classList.add('done'); else lab.classList.remove('done');
  });
}
const HABIT_ICONS = ["✓","🧘","🏃","💧","📚","🌱","🧠","💪","🛌","🍎","🥗","😴","🎯","🧹","✍️","🎨","🎵","📝","🤝","🌙","☀️","🏋️","🚶","💻","🎧","🥤","🥦","🧼","🪴","🌿","🔥","💊","❤️","⭐","🌊","🧒","🌞","🍵","🧃","🚰","📖","✨","🌈","🌾","🥕"];
function renderHabitIconPicker(selected){
  const box=$('habitIconPicker'); if(!box) return;
  box.innerHTML='';
  HABIT_ICONS.forEach(ic=>{
    const b=document.createElement('button');
    b.type='button'; b.className='habit-icon-opt'+(ic===selected?' sel':'');
    b.textContent=ic; b.title=ic;
    b.onclick=()=>{ $('habitIcon').value=ic; box.querySelectorAll('.habit-icon-opt').forEach(x=>x.classList.toggle('sel', x.textContent===ic)); };
    box.appendChild(b);
  });
  // permitir icono personalizado si no está en lista
  if(selected && !HABIT_ICONS.includes(selected)){
    const b=document.createElement('button');
    b.type='button'; b.className='habit-icon-opt sel'; b.textContent=selected;
    box.prepend(b);
  }
}
let habitEditingId=null;
function setupHabitsDialog(){
  const btn=$('btnHabits'); if(btn) btn.onclick=()=>{ renderHabitIconPicker($('habitIcon').value||'✓'); renderHabitsList(); renderHabitsTodayBox(); renderHabitsStatsBox(); renderHabitsLunaBox(); $('habitsDialog').showModal(); };
  const ct=$('habitsCloseTop'), cb=$('habitsClose'); if(ct) ct.onclick=()=>$('habitsDialog').close(); if(cb) cb.onclick=()=>$('habitsDialog').close();
  renderHabitIconPicker('✓');
  const iconInput=$('habitIcon');
  if(iconInput){
    iconInput.addEventListener('input', ()=> renderHabitIconPicker(iconInput.value.trim()||'✓'));
    iconInput.addEventListener('click', ()=>{ const picker=$('habitIconPicker'); if(picker) picker.scrollIntoView({behavior:'smooth', block:'nearest'}); });
  }
  const add=$('habitAdd'); if(add) add.onclick=()=>{
    const nombre=$('habitName').value.trim(); if(!nombre) return alert('Ingresa nombre del hábito');
    const h={ id:'h'+Date.now(), nombre, icono:($('habitIcon').value.trim()||'✓'), color:$('habitColor').value, freq:$('habitFreq').value };
    getHabitData().list.push(h); scheduleSave(); $('habitName').value=''; $('habitIcon').value=''; renderHabitIconPicker('✓'); renderHabitsList(); renderHabitsTodayBox(); renderHabitsStatsBox(); renderHabitsLunaBox(); renderDlgHabits(); renderLuna();
  };
  const upd=$('habitUpdate'); if(upd) upd.onclick=()=>{
    const h=getHabitData().list.find(x=>x.id===habitEditingId); if(!h) return;
    h.nombre=$('habitName').value.trim(); h.icono=$('habitIcon').value.trim()||'✓'; h.color=$('habitColor').value; h.freq=$('habitFreq').value;
    scheduleSave(); habitEditingId=null; $('habitAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('habitCancelEdit').classList.add('hidden'); $('habitName').value=''; $('habitIcon').value=''; renderHabitIconPicker('✓'); renderHabitsList(); renderHabitsTodayBox(); renderLuna();
  };
  const cancel=$('habitCancelEdit'); if(cancel) cancel.onclick=()=>{ habitEditingId=null; $('habitAdd').classList.remove('hidden'); $('habitUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('habitName').value=''; $('habitIcon').value=''; renderHabitIconPicker('✓'); };
  const clear=$('habitsClear'); if(clear) clear.onclick=()=>{
    if(!confirm('¿Borrar todos los hábitos y registros de esta usuaria?')) return;
    const d=getHabitData(); d.list=[]; d.entries={}; scheduleSave(); renderHabitsList(); renderHabitsTodayBox(); renderHabitsStatsBox(); renderHabitsLunaBox(); renderDlgHabits(); renderLuna();
  };
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
  box.innerHTML=NATURAL_HERBS.map(h=>`<div class="habit-item" style="cursor:pointer" data-n="${escapeHtml(h.n)}"><div style="display:flex;justify-content:space-between;align-items:center"><b>${escapeHtml(h.n)}</b><span class="chip" style="font-size:10px">${h.luna} · ${h.freq} ${h.time}</span></div><div class="muted" style="font-size:11px">${escapeHtml(h.uso)} — ${escapeHtml(h.prep)}</div><div class="muted" style="font-size:10px">Sug: ${h.freq} ${h.time}${h.notes?' · '+escapeHtml(h.notes):''}</div></div>`).join('');
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
    div.innerHTML=`<div class="medic-head"><b>🌿 ${escapeHtml(med.name)}</b> <span class="muted" style="font-size:11px">${escapeHtml(med.dose||'')}</span></div><div class="muted" style="font-size:12px">⏰ ${med.freq} ${med.time} ${med.days? '('+escapeHtml(med.days)+')':''} · ${med.from||'?'} → ${med.to||'∞'}</div><div class="muted" style="font-size:11px">${escapeHtml(med.notes||'')}</div><div style="margin-top:4px;font-size:12px;color:var(--gold)">Próxima: ${nextTxt} ${luna? '· Luna '+luna.luna:''}</div><div class="dlg-actions" style="justify-content:flex-end;margin-top:6px"><button data-id="${med.id}" class="btn natural-edit" style="width:auto;font-size:11px">✏️ Editar</button><button data-id="${med.id}" class="btn natural-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕ Eliminar</button></div>`;
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
  let html='<h4 style="color:var(--accent)">📅 Semana</h4><div class="mens-history">';
  for(let i=0;i<7;i++){
    const ms=mensKeyToMs(todayKey)+i*86400000;
    const k=mensMsToKey(ms);
    const e=data.entries[k];
    const has=e && (e.breakfast||e.lunch||e.dinner);
    html+=`<div class="mens-hist-item" style="${has?'border-color:var(--gold)':''}"><span><b>${cal.weekdayName(ms).slice(0,3)} ${k.slice(5)}</b> — ${has? escapeHtml([e.breakfast,e.lunch,e.dinner].filter(Boolean).join(' · ')) : '<span class=\'muted\'>sin plan</span>'} </span><button data-k="${k}" class="btn btn-icon meal-load" style="padding:4px 8px">✏️</button></div>`;
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
  box.innerHTML=`<h4 style="color:var(--accent)">🌙 Luna ${currentView.luna} — comidas</h4><p class="muted" style="font-size:12px">${done}/${days.length} días con plan (${pct}%)</p><div style="margin-top:6px;background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#a9d18e,#e8c56a)"></div></div>`;
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
    box.innerHTML='<h4 style="color:var(--gold)">📊 Nutrición estimada</h4><p class="muted">Sin comidas para este día. Agrega desayuno/almuerzo/cena para calcular.</p>';
    return;
  }
  const allText=[e.breakfast,e.lunch,e.dinner,e.snack].filter(Boolean).join(', ');
  const tot=parseNutrition(allText);
  if(!tot){
    box.innerHTML='<h4 style="color:var(--gold)">📊 Nutrición estimada</h4><p class="muted">No se reconocieron alimentos. Prueba con: avena, lentejas, pollo, ensalada.</p>';
    return;
  }
  box.innerHTML=`<h4 style="color:var(--gold)">📊 Nutrición estimada — ${k}</h4>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px">
      <div class="chip" style="text-align:center"><b>${Math.round(tot.cal)}</b><br><span class="muted" style="font-size:10px">kcal</span></div>
      <div class="chip" style="text-align:center"><b>${tot.prot.toFixed(1)}g</b><br><span class="muted" style="font-size:10px">proteína</span></div>
      <div class="chip" style="text-align:center"><b>${tot.carb.toFixed(1)}g</b><br><span class="muted" style="font-size:10px">carbos</span></div>
      <div class="chip" style="text-align:center"><b>${tot.fat.toFixed(1)}g</b><br><span class="muted" style="font-size:10px">grasa</span></div>
      <div class="chip" style="text-align:center"><b>${tot.hierro.toFixed(1)}mg</b><br><span class="muted" style="font-size:10px">hierro</span></div>
      <div class="chip" style="text-align:center"><b>${tot.fibra.toFixed(1)}g</b><br><span class="muted" style="font-size:10px">fibra</span></div>
    </div>
    <p class="muted" style="font-size:10px;margin-top:6px">Estimación por porción estándar (100g aprox). No reemplaza consejo nutricional.</p>`;
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
  box.innerHTML='<h4 style="color:var(--accent)">💡 Sugerencias</h4>' + sug.map(s=>'<p class="muted" style="font-size:11.5px;margin:4px 0">'+s+'</p>').join('') + '<p class="muted" style="font-size:10px;margin-top:6px">Sugerencias estacionales para Penco, no diagnóstico.</p>';
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
  box.innerHTML=`<h4 style="color:var(--gold)">🎯 Tu meta: ${r.objetivoKcal} kcal/día</h4>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px">
      <div class="chip" style="text-align:center"><b>${r.tmb}</b><br><span class="muted" style="font-size:10px">TMB</span></div>
      <div class="chip" style="text-align:center"><b>${r.tdee}</b><br><span class="muted" style="font-size:10px">TDEE</span></div>
      <div class="chip" style="text-align:center"><b>${r.objetivoKcal}</b><br><span class="muted" style="font-size:10px">Objetivo</span></div>
      <div class="chip" style="text-align:center"><b>${r.protG}g</b><br><span class="muted" style="font-size:10px">Proteína</span></div>
      <div class="chip" style="text-align:center"><b>${r.carbG}g</b><br><span class="muted" style="font-size:10px">Carbos</span></div>
      <div class="chip" style="text-align:center"><b>${r.fatG}g</b><br><span class="muted" style="font-size:10px">Grasa</span></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <span class="chip">IMC ${r.imc} · ${imcCat}</span>
      <span class="chip">💧 Agua ~${r.agua} ml/día</span>
      <span class="chip">${prof.objetivo.replace('_',' ')} (${r.ajuste>=0?'+'+r.ajuste:r.ajuste} kcal)</span>
    </div>
    <div style="margin-top:8px;background:var(--panel);border-radius:6px;height:10px;overflow:hidden;display:flex">
      <div style="width:${Math.round(r.protG*4/r.objetivoKcal*100)}%;background:#a9d18e"></div>
      <div style="width:${Math.round(r.carbG*4/r.objetivoKcal*100)}%;background:#e8c56a"></div>
      <div style="width:${Math.round(r.fatG*9/r.objetivoKcal*100)}%;background:#7ab8ff"></div>
    </div>
    <p class="muted" style="font-size:10px;margin-top:4px">Distribución: <span style="color:#a9d18e">● Proteína ${Math.round(r.protG*4/r.objetivoKcal*100)}%</span> · <span style="color:#e8c56a">● Carbos ${Math.round(r.carbG*4/r.objetivoKcal*100)}%</span> · <span style="color:#7ab8ff">● Grasa ${Math.round(r.fatG*9/r.objetivoKcal*100)}%</span></p>`;
  if(det){
    det.classList.remove('hidden');
    det.innerHTML=`<h4>📋 Detalle</h4>
      <p class="muted" style="font-size:11px;line-height:1.5">TMB (reposo) ${r.tmb} × actividad ${prof.actividad} = TDEE ${r.tdee}. Objetivo ${r.objetivoKcal} kcal. Proteína ${r.protG}g ×4=${r.protG*4} kcal · Grasa ${r.fatG}g ×9=${r.fatG*9} kcal · Carbos resto ${r.carbG}g.</p>
      <p class="muted" style="font-size:11px">Recomendación: 25-35g fibra, &lt;2300mg sodio, 5 porciones verdura/fruta. Si entrenas fuerza, prioriza proteína repartida en 3-4 comidas.</p>
      <p class="muted" style="font-size:10px">Cálculo informativo, no reemplaza evaluación profesional.</p>`;
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
  if(!tot){ box.innerHTML=`<h4 style="color:var(--accent)">⚖️ Plan vs meta (${r.objetivoKcal} kcal)</h4><p class="muted">Sin plan este día. Carga un menú de 🍽️ Menús sugeridos.</p>`; return; }
  const pctCal=Math.round(tot.cal/r.objetivoKcal*100);
  const pctProt=Math.round(tot.prot/r.protG*100);
  const pctCarb=Math.round(tot.carb/r.carbG*100);
  const pctFat=Math.round(tot.fat/r.fatG*100);
  const bar=(pct, col)=> `<div style="background:var(--panel);border-radius:6px;height:8px;overflow:hidden;margin-top:2px"><div style="width:${Math.min(100,pct)}%;height:100%;background:${col}"></div></div>`;
  box.innerHTML=`<h4 style="color:var(--accent)">⚖️ Plan del día vs meta (${r.objetivoKcal} kcal)</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;font-size:11px">
      <div><b>${Math.round(tot.cal)} kcal</b> <span class="muted">${pctCal}% meta</span>${bar(pctCal, pctCal>110?'#e76e8a': pctCal<70?'#e8c56a':'#a9d18e')}</div>
      <div><b>${tot.prot.toFixed(1)}g prot</b> <span class="muted">${pctProt}%</span>${bar(pctProt,'#a9d18e')}</div>
      <div><b>${tot.carb.toFixed(1)}g carb</b> <span class="muted">${pctCarb}%</span>${bar(pctCarb,'#e8c56a')}</div>
      <div><b>${tot.fat.toFixed(1)}g grasa</b> <span class="muted">${pctFat}%</span>${bar(pctFat,'#7ab8ff')}</div>
    </div>
    <p class="muted" style="font-size:11px;margin-top:6px">${pctCal<80?'⚡ Te faltan ~'+(r.objetivoKcal-Math.round(tot.cal))+' kcal — agrega snack (yogur+fruta, palta+pan).': pctCal>115?'⚠️ Excedes ~'+(Math.round(tot.cal)-r.objetivoKcal)+' kcal — aligera cena.':'✅ Dentro de rango (±15%).'}</p>`;
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
    resumen.innerHTML=`<h4 style="color:var(--gold)">🍽️ Menús para ${r.objetivoKcal} kcal · Prot ${r.protG}g · Carb ${r.carbG}g · Grasa ${r.fatG}g</h4>
      <p class="muted" style="font-size:11px">Mostrando menús ordenados por cercanía a tu meta. Toca <b>Cargar</b> para copiar al plan del día.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px">
        <div class="chip" style="text-align:center"><b>${r.objetivoKcal}</b><br><span class="muted" style="font-size:10px">kcal meta</span></div>
        <div class="chip" style="text-align:center"><b>${r.imc}</b><br><span class="muted" style="font-size:10px">IMC</span></div>
        <div class="chip" style="text-align:center"><b>${r.agua} ml</b><br><span class="muted" style="font-size:10px">agua</span></div>
      </div>`;
  }
  const sorted=[...MENUS_SUGERIDOS].map(m=> ({...m, diff: Math.abs(m.kcal - r.objetivoKcal) + Math.abs(m.prot - r.protG)*4 })).sort((a,b)=>a.diff-b.diff);
  lista.innerHTML=sorted.map(m=>{
    const delta=m.kcal - r.objetivoKcal;
    const tag= Math.abs(delta)<100 ? '<span class="chip" style="background:#a9d18e;color:#10142c">✓ Cerca</span>' : delta>0? `<span class="chip">${'+'+delta} kcal</span>` : `<span class="chip">${delta} kcal</span>`;
    return `<div class="si-card" style="border-left:3px solid var(--gold)">
      <div style="display:flex;justify-content:space-between;align-items:center"><h4>${escapeHtml(m.nombre)} ${tag}</h4><span class="muted" style="font-size:11px">${m.precio}</span></div>
      <p class="muted" style="font-size:11px">${escapeHtml(m.desc)} — ${m.kcal} kcal · P ${m.prot}g · C ${m.carb}g · G ${m.fat}g</p>
      <div style="font-size:11px;color:#cdd3ee;line-height:1.5;margin-top:4px">
        <b>Desayuno:</b> ${escapeHtml(m.desayuno)}<br>
        <b>Almuerzo:</b> ${escapeHtml(m.almuerzo)}<br>
        <b>Cena:</b> ${escapeHtml(m.cena)}<br>
        <b>Snack:</b> ${escapeHtml(m.snack)}
      </div>
      <div class="dlg-actions" style="justify-content:flex-start;margin-top:8px">
        <button data-id="${m.id}" class="btn btn-accent menu-load" style="width:auto">📥 Cargar en plan de hoy</button>
        <button data-id="${m.id}" class="btn menu-shop" style="width:auto">🛒 A lista</button>
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
function showMealTab(tab){
  const pPlan=$('mealPlanPanel'), pCalc=$('mealCalcPanel'), pMenus=$('mealMenusPanel');
  const tPlan=$('tabMealPlan'), tCalc=$('tabMealCalc'), tMenus=$('tabMealMenus');
  [tPlan,tCalc,tMenus].forEach(b=> b&&b.classList.remove('btn-accent'));
  [pPlan,pCalc,pMenus].forEach(p=> p&&p.classList.add('hidden'));
  if(tab==='plan'){ tPlan&&tPlan.classList.add('btn-accent'); pPlan&&pPlan.classList.remove('hidden'); }
  else if(tab==='calc'){ tCalc&&tCalc.classList.add('btn-accent'); pCalc&&pCalc.classList.remove('hidden'); }
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
  const tPlan=$('tabMealPlan'), tCalc=$('tabMealCalc'), tMenus=$('tabMealMenus');
  if(tPlan) tPlan.onclick=()=> showMealTab('plan');
  if(tCalc) tCalc.onclick=()=> { const prof=getNutritionProfile(); if($('calcSexo')) $('calcSexo').value=prof.sexo; renderCalcResultado(); showMealTab('calc'); };
  if(tMenus) tMenus.onclick=()=> { renderMealMenus(); showMealTab('menus'); };
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
      html+=`<label class="shop-item ${it.done?'done':''}"><input type="checkbox" data-id="${it.id}" ${it.done?'checked':''}><span class="shop-name">${escapeHtml(it.name)}</span><span class="muted" style="font-size:11px">${escapeHtml(it.qty)}</span><button data-id="${it.id}" class="btn btn-icon shop-del" style="padding:2px 6px;margin-left:auto">✕</button></label>`;
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
  box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
    <span style="font-size:15px"><b>💰 Balance ${monthFilter||'total filtrado'}</b></span>
    <span class="chip" style="background:${colorBal};color:#10142c">${formatCLP(tot.balance)} ${tot.balance>=0?'· positivo':'· negativo'}</span>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">
    <div class="chip" style="text-align:center"><span class="muted" style="font-size:10px">Ingresos</span><br><b style="color:#a9d18e">${formatCLP(tot.ingreso)}</b></div>
    <div class="chip" style="text-align:center"><span class="muted" style="font-size:10px">Gastos</span><br><b style="color:#e76e8a">${formatCLP(tot.gasto)}</b></div>
    <div class="chip" style="text-align:center"><span class="muted" style="font-size:10px">Movimientos</span><br><b>${entries.length}</b></div>
  </div>
  ${pres? `<div style="margin-top:8px"><div style="display:flex;justify-content:space-between;font-size:11px"><span class="muted">Presupuesto ${formatCLP(pres)} · Gastado ${formatCLP(gastoMes)} (${pctPres}%)</span><span style="color:${colorPres};font-weight:700">${pctPres>100? '¡Excedido!':'En rango'}</span></div><div style="margin-top:4px;background:var(--panel);border-radius:6px;height:10px;overflow:hidden"><div style="width:${Math.min(100,pctPres)}%;height:100%;background:${colorPres};transition:width .3s"></div></div></div>` : '<p class="muted" style="font-size:11px;margin-top:6px">Define un presupuesto mensual abajo para ver barra de avance.</p>'}
  <p class="muted" style="font-size:11px;margin-top:6px">Hoy ${todayKey} gastado: <b style="color:#e8c56a">${formatCLP(hoyGasto)}</b> · Luna actual: ${currentView.tipo==='dft'?'DFT':'Luna '+currentView.luna}</p>`;
}
function renderFinanceCatBox(){
  const box=$('financeCatBox'); if(!box) return;
  const fd=getFinanceData();
  const monthFilter=$('finMonthFilter')?.value || new Date().toISOString().slice(0,7);
  const entries=fd.entries.filter(e=> financeMonthKey(e.date)===monthFilter);
  if(!entries.length){ box.innerHTML='<h4 style="color:var(--accent)">📊 Por categoría — '+monthFilter+'</h4><p class="muted">Sin movimientos este mes.</p>'; return; }
  const byCat={};
  entries.filter(e=>e.tipo==='gasto').forEach(e=>{ byCat[e.categoria]=(byCat[e.categoria]||0)+(parseInt(e.monto)||0); });
  const sorted=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const totalG=sorted.reduce((s,x)=>s+x[1],0);
  box.innerHTML='<h4 style="color:var(--accent)">📊 Gastos por categoría — '+monthFilter+' (total '+formatCLP(totalG)+')</h4>' + (sorted.length? sorted.map(([cat,val])=>{
    const pct= totalG? Math.round(val/totalG*100):0;
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span style="font-size:12px">${escapeHtml(cat)} <span class="muted" style="font-size:11px">${formatCLP(val)} · ${pct}%</span></span><span style="flex:1;margin:0 8px;background:var(--panel);border-radius:6px;height:8px;overflow:hidden;display:inline-block;max-width:140px"><span style="display:block;width:${pct}%;height:100%;background:linear-gradient(90deg,#e8c56a,#e76e8a)"></span></span></div>`;
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
  box.innerHTML=`<h4 style="color:var(--accent)">🌙 Luna ${currentView.luna} · ${MOONS[currentView.luna-1].nombre} — 28 días</h4>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px">
      <div class="chip" style="text-align:center"><span class="muted" style="font-size:10px">Gastos luna</span><br><b style="color:#e76e8a">${formatCLP(tot.gasto)}</b></div>
      <div class="chip" style="text-align:center"><span class="muted" style="font-size:10px">Ingresos luna</span><br><b style="color:#a9d18e">${formatCLP(tot.ingreso)}</b></div>
      <div class="chip" style="text-align:center"><span class="muted" style="font-size:10px">Promedio/día gasto</span><br><b>${formatCLP(avgDia)}</b></div>
    </div>
    <p class="muted" style="font-size:11px;margin-top:6px">${lunaEntries.length} movimientos en esta luna · Balance ${formatCLP(tot.balance)} ${tot.balance>=0?'😊':'⚠️'}</p>`;
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
      <span class="muted" style="font-size:11px">${e.date} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''} ${e.desc? '· '+escapeHtml(e.desc):''}</span></span>
      <span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${e.id}" class="btn fin-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${e.id}" class="btn fin-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span>
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
  box.innerHTML=FIN_TIPS.map(t=>`<div class="si-card" style="margin-bottom:8px"><h4>${t.icon} ${escapeHtml(t.titulo)}</h4><p style="font-size:12px;color:#cdd3ee">${escapeHtml(t.desc)}</p>${t.ejemplo?'<p class="muted" style="font-size:11px">Ej: '+escapeHtml(t.ejemplo)+'</p>':''}${t.tip?'<p style="font-size:11px;color:var(--gold)">💡 '+escapeHtml(t.tip)+'</p>':''}</div>`).join('');
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
  box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><span style="font-size:15px"><b>🏠 Hoy</b> — ${cal.weekdayName(mensKeyToMs(todayKey))} ${cal.fmtDate.format(new Date(mensKeyToMs(todayKey)))}</span><span class="chip" style="background:${pending===0?'#a9d18e':'var(--gold)'};color:#10142c">${doneToday}/${todayTasks.length} hechas</span></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">
    <div class="chip" style="text-align:center"><b>${pending} pendientes</b><br><span class="muted" style="font-size:10px">${todayTasks.length} hoy · ${totalMin} min est.</span></div>
    <div class="chip" style="text-align:center"><b>${doneMin} min hecho</b><br><span class="muted" style="font-size:10px">${totalMin? Math.round(doneMin/totalMin*100):0}% tiempo</span></div>
    <div class="chip" style="text-align:center"><b>${ht.tasks.length} tareas</b><br><span class="muted" style="font-size:10px">Luna: ${escapeHtml(lunaName)}</span></div>
  </div>
  <div style="margin-top:8px;background:var(--panel);border-radius:6px;height:8px;overflow:hidden"><div style="width:${todayTasks.length? Math.round(doneToday/todayTasks.length*100):0}%;height:100%;background:linear-gradient(90deg,#a9d18e,#e8c56a)"></div></div>
  <p class="muted" style="font-size:10px;margin-top:6px">Tip: toca ☑ en 📋 Tareas para marcar. Las tareas diarias aparecen todos los días; semanales solo su día.</p>`;
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
  let html='<h4 style="color:var(--gold)">☑ Hoy — marca al terminar</h4>';
  Object.keys(byArea).sort().forEach(area=>{
    const icon=HOME_AREA_ICON[area]||"🏠";
    html+=`<div class="shop-cat" style="margin-top:8px">${icon} ${escapeHtml(area)} · ${byArea[area].length}</div>`;
    byArea[area].forEach(t=>{
      const done=!!completions[t.id];
      const priColor=t.priority==='alta'?'#ff6b6b': t.priority==='baja'?'#8fd694':'var(--gold)';
      html+=`<label class="shop-item ${done?'done':''}" style="border-left:3px solid ${priColor}"><input type="checkbox" data-home-id="${t.id}" ${done?'checked':''}><span class="shop-name"><b>${escapeHtml(t.name)}</b> <span class="muted" style="font-size:11px">· ${escapeHtml(t.owner||'Sin asignar')} · ${t.time}′ · ${t.freq}${t.day!=='todos'?' · '+['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][t.day]:''}</span>${t.notes? '<br><span class="muted" style="font-size:11px">'+escapeHtml(t.notes)+'</span>':''}</span><span class="chip" style="font-size:10px;background:${priColor};color:#10142c">${t.priority}</span></label>`;
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
      <span><b>${icon} ${escapeHtml(t.name)}</b> <span class="chip" style="font-size:10px">${escapeHtml(t.area)}</span> <span class="chip" style="font-size:10px;background:${priColor};color:#10142c">${t.priority}</span> ${inToday? (done? '<span class="chip" style="font-size:10px;background:#a9d18e;color:#10142c">✓ hoy</span>': '<span class="chip" style="font-size:10px">hoy</span>') : '<span class="muted" style="font-size:10px">no hoy</span>'}<br><span class="muted" style="font-size:11px">${escapeHtml(freqLabel)} · ${t.time}′ · ${escapeHtml(t.owner||'Sin asignar')}</span>${t.notes? '<br><span class="muted" style="font-size:11px">'+escapeHtml(t.notes)+'</span>':''}</span>
      <span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${t.id}" class="btn home-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${t.id}" class="btn home-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span>
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
    html+=`<div class="schedule-day ${isToday?'schedule-today':''}"><b>${name} <span class="muted" style="font-size:10px">${dateStr.slice(8,10)}/${dateStr.slice(5,7)}</span></b><span class="chip" style="font-size:10px;margin-top:4px;display:inline-block">${done}/${tasks.length}</span>${tasks.length? tasks.map(t=>{ const icon=HOME_AREA_ICON[t.area]||"🏠"; const isDone=completions[t.id]; return `<div class="schedule-block" style="background:${isDone?'#a9d18e': t.priority==='alta'?'#ff9a76':'#e8c56a'};border:1px solid ${isDone?'#a9d18e':'var(--line)'};opacity:${isDone?'0.85':1}">${icon} ${escapeHtml(t.name)}<br><span style="font-size:10px">${t.time}′ ${isDone?'✓':''}</span></div>`; }).join('') : '<p class="muted" style="font-size:10px">Sin tareas</p>'}</div>`;
  });
  grid.innerHTML=html;
  const weekBox=$('homeTasksWeekList'); if(weekBox){
    const now=new Date(); const monday=new Date(now); monday.setDate(now.getDate() - ((now.getDay()+6)%7));
    let weekTasks=new Set();
    for(let i=0;i<7;i++){ const d=new Date(monday); d.setDate(monday.getDate()+i); const ds=cal.fmtKey.format(d); homeTasksForDate(ds).forEach(t=> weekTasks.add(t.id)); }
    const totalWeek=weekTasks.size;
    let doneWeek=0; for(let i=0;i<7;i++){ const d=new Date(monday); d.setDate(monday.getDate()+i); const ds=cal.fmtKey.format(d); const comp=ht.completions[ds]||{}; Object.keys(comp).forEach(id=>{ if(!weekTasks.has(id)) return; doneWeek++; }); }
    // dedup no needed for simple count; mostrar estimación
    weekBox.innerHTML=`<h4 style="color:var(--accent)">🗓️ Semana — ${cal.fmtDate.format(monday)} al ${cal.fmtDate.format(new Date(monday.getTime()+6*86400000))}</h4><p class="muted" style="font-size:11px">${totalWeek} tareas distintas esta semana · ${Object.keys(ht.completions).filter(k=>{ const d=new Date(k+"T12:00:00"); return d>=monday && d<=new Date(monday.getTime()+6*86400000); }).length} días con avance. Revisa 📋 Tareas para marcar.</p>`;
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
  box.innerHTML=`<h4 style="color:var(--gold)">🌙 Luna ${lunaN} · ${escapeHtml(lunaName)} — proyección 28 días</h4>
    <p class="muted" style="font-size:11px">${totalOccurrences} ocurrencias de tareas en esta luna · ${doneOccurrences} hechas · ${pct}% avance</p>
    <div style="margin-top:6px;background:var(--panel);border-radius:6px;height:8px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7ab8ff,#a9d18e)"></div></div>
    <p class="muted" style="font-size:10px;margin-top:6px">Las tareas diarias cuentan 28 veces; semanales ~4 veces; quincenales ~2; mensuales 1. Útil para planificar carga real por luna.</p>`;
}
function renderHomeTasksAreasBox(){
  const box=$('homeTasksAreasBox'); if(!box) return;
  const ht=getHomeTasksData();
  const todayKey=cal.fmtKey.format(new Date());
  const todayTasks=homeTasksForDate(todayKey);
  const compToday=ht.completions[todayKey]||{};
  const byArea={}; ht.tasks.forEach(t=>{ if(!byArea[t.area]) byArea[t.area]=0; byArea[t.area]++; });
  const byAreaToday={}; todayTasks.forEach(t=>{ if(!byAreaToday[t.area]) byAreaToday[t.area]={total:0,done:0}; byAreaToday[t.area].total++; if(compToday[t.id]) byAreaToday[t.area].done++; });
  let html='<h4 style="color:var(--accent)">📦 Por área — totales y hoy</h4><div class="help-grid" style="margin-top:8px">';
  Object.keys(byArea).sort().forEach(area=>{
    const icon=HOME_AREA_ICON[area]||"🏠";
    const tot=byArea[area];
    const todayInfo=byAreaToday[area] ? `${byAreaToday[area].done}/${byAreaToday[area].total} hoy` : `0/${tot} hoy — no toca`;
    html+=`<div class="help-card" style="padding:8px"><h4>${icon} ${escapeHtml(area)}</h4><p style="font-size:11px"><b>${tot} tareas</b> · ${todayInfo}</p><div style="margin-top:4px;background:var(--panel);border-radius:6px;height:6px;overflow:hidden"><div style="width:${byAreaToday[area]? Math.round(byAreaToday[area].done/Math.max(1,byAreaToday[area].total)*100):0}%;height:100%;background:var(--gold)"></div></div></div>`;
  });
  html+='</div>';
  if(!ht.tasks.length) html='<h4 style="color:var(--accent)">📦 Por área</h4><p class="muted">Aún sin tareas. Carga el kit básico en 🧹 Plantillas.</p>';
  box.innerHTML=html;
}
function renderHomeTasksTemplates(){
  const box=$('homeTasksTemplates'); if(!box) return;
  let html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  HOME_TEMPLATES.forEach(tpl=>{
    html+=`<div class="si-card" style="margin:0"><h4>🧹 ${escapeHtml(tpl.nombre)} <span class="chip" style="font-size:10px">${tpl.tareas.length} tareas</span></h4><p class="muted" style="font-size:11px">${tpl.tareas.slice(0,4).map(t=> escapeHtml(t.name)).join(' · ')}${tpl.tareas.length>4?' …':''}</p><button type="button" class="btn" style="width:auto;font-size:11px;margin-top:6px" data-tpl="${escapeHtml(tpl.nombre)}">👁️ Ver / Cargar</button></div>`;
  });
  html+='</div>';
  box.innerHTML=html;
  box.querySelectorAll('[data-tpl]').forEach(b=> b.onclick=()=>{
    const tpl=HOME_TEMPLATES.find(x=>x.nombre===b.dataset.tpl); if(!tpl) return;
    // mostrar detalle y ofrecer cargar una por una en formulario
    const detail=`<div class="menstrual-card" style="margin-top:10px"><h4>${escapeHtml(tpl.nombre)}</h4>` + tpl.tareas.map(t=>`<div class="habit-item" style="padding:6px 8px"><span><b>${HOME_AREA_ICON[t.area]||"🏠"} ${escapeHtml(t.name)}</b> · ${escapeHtml(t.area)} · ${t.freq}${t.day?' · '+t.day:''} · ${t.time}′</span><button data-tpltask="${escapeHtml(t.name)}" class="btn" style="width:auto;font-size:11px">↗ Cargar</button></div>`).join('') + `<p class="muted" style="font-size:10px;margin-top:6px">Toca “Cargar” para llevar la tarea al formulario y ajustarla antes de agregar.</p><div style="display:flex;gap:8px;margin-top:8px"><button id="tplAddAll" class="btn btn-accent" style="width:auto">+ Agregar todas (${tpl.tareas.length})</button></div></div>`;
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
let homeTasksEditingId=null;
let homeTasksCurrentTab='tareas';
function renderHomeTasksTab(tab){
  homeTasksCurrentTab=tab||homeTasksCurrentTab;
  const tabs={tareas:'tabHomeTareas', semana:'tabHomeSemana', plantillas:'tabHomePlantillas', stats:'tabHomeStats'};
  Object.entries(tabs).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===homeTasksCurrentTab); });
  const panels={tareas:'homeTasksTareasPanel', semana:'homeTasksSemanaPanel', plantillas:'homeTasksPlantillasPanel', stats:'homeTasksStatsPanel'};
  Object.entries(panels).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('hidden', k!==homeTasksCurrentTab); });
  if(homeTasksCurrentTab==='tareas'){ renderHomeTasksResumen(); renderHomeTasksTodayBox(); renderHomeTasksList(); }
  if(homeTasksCurrentTab==='semana'){ renderHomeTasksWeekGrid(); }
  if(homeTasksCurrentTab==='plantillas'){ renderHomeTasksTemplates(); }
  if(homeTasksCurrentTab==='stats'){ renderHomeTasksLunaBox(); renderHomeTasksAreasBox(); }
}
function setupHomeTasksDialog(){
  const btn=$('btnHomeTasks'); if(btn) btn.onclick=()=>{ renderHomeTasksResumen(); renderHomeTasksTab('tareas'); renderHomeTasksTemplates(); $('homeTasksDialog').showModal(); };
  const ct=$('homeTasksCloseTop'), cb=$('homeTasksClose'); if(ct) ct.onclick=()=>$('homeTasksDialog').close(); if(cb) cb.onclick=()=>$('homeTasksDialog').close();
  ['tabHomeTareas','tabHomeSemana','tabHomePlantillas','tabHomeStats'].forEach(id=>{
    const el=$(id); if(!el) return;
    el.onclick=()=>{ const map={tabHomeTareas:'tareas',tabHomeSemana:'semana',tabHomePlantillas:'plantillas',tabHomeStats:'stats'}; renderHomeTasksTab(map[id]); };
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
    set('donateBanco', d.banco||'BancoEstado');
    set('donateTipo', d.tipo||'CuentaRUT');
    set('donateCuenta', d.cuenta||'16762921');
    set('donateRut', d.rut||'16762921-0');
    set('donateTitular', d.titular||'ESTEBAN MIGUEL ORMENO MORALES');
    set('donateCorreo', d.correo||'semilleroconsciente@gmail.com');
    set('donateMachBanco', d.machBanco||'BCI/MACHBANK');
    set('donateMachTipo', d.machTipo||'Cuenta Vista');
    set('donateMachCuenta', d.machCuenta||'777016762921');
    set('donateMachRut', d.machRut||'16.762.921-0');
    set('donateMachTitular', d.machTitular||'ESTEBAN MIGUEL ORMENO MORALES');
    set('donateMachCorreo', d.machCorreo||'semilleroconsciente@gmail.com');
    const mp=$('donateMPLink'), pp=$('donatePaypalLink');
    const fallbackMP='https://link.mercadopago.cl/semilleroconsciente';
    const fallbackPP='https://www.paypal.com/donate?business=semilleroconsciente@gmail.com';
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
    if(flow){ flow.href = d.flow||'#'; flow.target = d.flow ? '_blank' : ''; flow.rel = 'noopener noreferrer'; flow.style.opacity = d.flow? '1':'0.45'; flow.style.pointerEvents = d.flow? 'auto':'none'; if(d.flow) flow.onclick = e=>{ e.stopPropagation(); e.preventDefault(); openExternalLink(d.flow); }; }
    if(kf){ kf.href = d.kofi||'#'; kf.target = d.kofi ? '_blank' : ''; kf.rel = 'noopener noreferrer'; kf.style.opacity = d.kofi? '1':'0.45'; kf.style.pointerEvents = d.kofi? 'auto':'none'; if(kf && d.kofi) kf.onclick = e=>{ e.stopPropagation(); e.preventDefault(); openExternalLink(d.kofi); }; }
    $('donateDialog').showModal();
  };
  const ct=$('donateCloseTop'), cb=$('donateClose'); if(ct) ct.onclick=()=>$('donateDialog').close(); if(cb) cb.onclick=()=>$('donateDialog').close();
  const copyBtn=$('btnCopyBank'); if(copyBtn) copyBtn.onclick= async ()=>{
    let d = await loadDonateConfig();
    d = d || (typeof DONATE!=='undefined'? DONATE : {});
    const txt = `Cuenta RUT — BancoEstado\nBanco: ${d.banco||'BancoEstado'}\nTipo: ${d.tipo||'CuentaRUT'}\nCuenta: ${d.cuenta||'16762921'}\nRUT: ${d.rut||'16762921-0'}\nTitular: ${d.titular||'ESTEBAN MIGUEL ORMENO MORALES'}\nCorreo: ${d.correo||'semilleroconsciente@gmail.com'}`.trim();
    try{ await navigator.clipboard.writeText(txt); $('statusMsg').textContent='Datos Cuenta RUT copiados ✓'; setTimeout(()=>$('statusMsg').textContent='',2000); }catch{ prompt('Copia estos datos:', txt); }
  };
  const copyMach=$('btnCopyMach'); if(copyMach) copyMach.onclick= async ()=>{
    let d = await loadDonateConfig();
    d = d || {};
    const txt = `MACH — BCI\nBanco: ${d.machBanco||'BCI/MACHBANK'}\nTipo: ${d.machTipo||'Cuenta Vista'}\nCuenta: ${d.machCuenta||'777016762921'}\nRUT: ${d.machRut||'16.762.921-0'}\nTitular: ${d.machTitular||'ESTEBAN MIGUEL ORMENO MORALES'}\nCorreo: ${d.machCorreo||'semilleroconsciente@gmail.com'}`.trim();
    try{ await navigator.clipboard.writeText(txt); $('statusMsg').textContent='Datos MACH copiados ✓'; setTimeout(()=>$('statusMsg').textContent='',2000); }catch{ prompt('Copia estos datos:', txt); }
  };
}
setTimeout(setupDonateDialog, 800);

// === CÓMO USAR ===
function setupHelpDialog(){
  const btn=$('btnHelp'); if(btn) btn.onclick=()=> $('helpDialog').showModal();
  const ct=$('helpCloseTop'), cb=$('helpClose'); if(ct) ct.onclick=()=>$('helpDialog').close(); if(cb) cb.onclick=()=>$('helpDialog').close();
}
setTimeout(setupHelpDialog, 850);

// === CONFIGURACIÓN PERSONALIZABLE ===
const ALL_BTNS = ["btnTides","btnFishing","btnBirds","btnIntermareal","btnBosque","btnWeather","btnSiembra","btnAstro","btnComuna","btnEkadashi","btnMenstrual","btnMedic","btnHabits","btnMeal","btnShopping","btnFinance","btnHomeTasks","btnDiscipline","btnDreams","btnBreath","btnGratitud","btnSchedule","btnGym","btnCircadian","btnGolden","btnCompost","btnRecicla","btnAire","btnLawen","btnFirstAid","btnAnimalCare","btnViolence","btnEvac","btnConvert","btnEnergy","btnLena","btnTimer","btnRemind","btnBackup","btnRestore","btnShortcut","btnPdfLuna","btnPdfCiclo","btnDonate","btnHelp","btnStudy","btnTales","btnMemory","btnMapu"];
const PRESETS = {
  todo: Object.fromEntries(ALL_BTNS.map(k=>[k,true])),
  esencial: {btnTides:true,btnWeather:true,btnSiembra:true,btnEkadashi:true,btnFirstAid:true,btnEvac:true,btnBackup:true,btnRestore:true,btnPdfLuna:true,btnPdfCiclo:true,btnHelp:true,btnDonate:true},
  infantil: {btnWeather:true,btnSiembra:true,btnHabits:true,btnDreams:true,btnBreath:true,btnSchedule:true,btnTales:true,btnMapu:true,btnHelp:true},
  adolescente: {btnHabits:true,btnStudy:true,btnSchedule:true,btnDiscipline:true,btnDreams:true,btnBreath:true,btnMapu:true,btnConvert:true,btnTimer:true,btnHelp:true},
  adulto: Object.fromEntries(ALL_BTNS.map(k=>[k,true])),
  mayor: {btnTides:true,btnWeather:true,btnSiembra:true,btnMenstrual:true,btnMedic:true,btnDreams:true,btnGratitud:true,btnBreath:true,btnAire:true,btnLena:true,btnHelp:true,btnDonate:true},
  estudiante: {btnWeather:true,btnSiembra:true,btnHabits:true,btnStudy:true,btnSchedule:true,btnDiscipline:true,btnMapu:true,btnTales:true,btnConvert:true,btnTimer:true,btnHelp:true},
  agricultor: {btnTides:true,btnFishing:true,btnBirds:true,btnIntermareal:true,btnBosque:true,btnWeather:true,btnSiembra:true,btnCompost:true,btnLawen:true,btnRecicla:true,btnAire:true,btnGolden:true,btnCircadian:true,btnHelp:true},
  pescador: {btnTides:true,btnFishing:true,btnBirds:true,btnIntermareal:true,btnBosque:true,btnWeather:true,btnSiembra:true,btnGolden:true,btnHelp:true},
  salud: {btnMenstrual:true,btnMedic:true,btnLawen:true,btnHabits:true,btnGym:true,btnCircadian:true,btnDreams:true,btnGratitud:true,btnBreath:true,btnMeal:true,btnAire:true,btnFirstAid:true,btnAnimalCare:true,btnEvac:true,btnHelp:true},
  deportista: {btnHabits:true,btnGym:true,btnMeal:true,btnShopping:true,btnFinance:true,btnCircadian:true,btnBreath:true,btnTimer:true,btnHelp:true},
  docente: {btnSiembra:true,btnEkadashi:true,btnStudy:true,btnSchedule:true,btnHabits:true,btnDiscipline:true,btnMapu:true,btnTales:true,btnGratitud:true,btnRecicla:true,btnConvert:true,btnPdfCiclo:true,btnHelp:true}
};
function getVisibleConfig(){
  const c = (DATA.config && DATA.config.visible) || {};
  const out={}; ALL_BTNS.forEach(k=> out[k]= c[k]!==false );
  return out;
}
function applyVisibility(){
  const vis=getVisibleConfig();
  ALL_BTNS.forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.toggle('hidden-by-config', !vis[id]);
  });
  updateGroupCounts();
  const large = (DATA.config && DATA.config.largeText);
  document.body.classList.toggle('large-text', !!large);
  const cb=document.getElementById('cfgLargeText'); if(cb) cb.checked=!!large;
}
function updateGroupCounts(){
  document.querySelectorAll('.action-group').forEach(g=>{
    const total = g.querySelectorAll('.group-btns .btn').length;
    const visible = g.querySelectorAll('.group-btns .btn:not(.hidden-by-config):not(.hidden-by-search)').length;
    const c = g.querySelector('.ag-count');
    if(c) c.textContent = `(${visible}/${total})`;
    // ocultar grupo vacío por config (no por búsqueda)
    const hasVisible = g.querySelectorAll('.group-btns .btn:not(.hidden-by-config)').length > 0;
    g.style.display = hasVisible ? '' : 'none';
  });
}
function setupConfigDialog(){
  const btn=$('btnConfig'); if(btn) btn.onclick=()=>{
    const vis=getVisibleConfig();
    document.querySelectorAll('#configDialog input[data-btn]').forEach(cb=>{
      cb.checked = !!vis[cb.dataset.btn];
    });
    $('configDialog').showModal();
  };
  const ct=$('configCloseTop'), cb=$('configClose'); if(ct) ct.onclick=()=>$('configDialog').close(); if(cb) cb.onclick=()=>$('configDialog').close();
  document.querySelectorAll('#configDialog input[data-btn]').forEach(cb=>{
    cb.onchange=()=>{
      DATA.config=DATA.config||{}; DATA.config.visible=DATA.config.visible||{};
      DATA.config.visible[cb.dataset.btn]=cb.checked;
      scheduleSave(); applyVisibility();
    };
  });
  document.querySelectorAll('.config-preset').forEach(b=>{
    b.onclick=()=>{
      const preset=PRESETS[b.dataset.preset];
      if(!preset) return;
      DATA.config=DATA.config||{};
      const vis={}; ALL_BTNS.forEach(k=> vis[k]= preset[k] ? true : false);
      // si preset no define, dejar false
      DATA.config.visible=vis;
      scheduleSave();
      document.querySelectorAll('#configDialog input[data-btn]').forEach(cb=> cb.checked=!!vis[cb.dataset.btn]);
      applyVisibility();
    };
  });
  const largeCb=$('cfgLargeText'); if(largeCb) largeCb.onchange=()=>{ DATA.config=DATA.config||{}; DATA.config.largeText=largeCb.checked; scheduleSave(); applyVisibility(); };
  const reset=$('configReset'); if(reset) reset.onclick=()=>{
    DATA.config=DATA.config||{}; DATA.config.visible=Object.fromEntries(ALL_BTNS.map(k=>[k,true]));
    scheduleSave();
    document.querySelectorAll('#configDialog input[data-btn]').forEach(cb=> cb.checked=true);
    applyVisibility();
  };
}

setTimeout(setupConfigDialog, 860);

// === BÚSQUEDA DE ACCIONES (Command Palette light) ===
function setupActionSearch(){
  const input = $('actionSearch');
  if(!input) return;
  function filter(q){
    const needle = (q||'').toLowerCase().trim();
    document.querySelectorAll('#actions .group-btns .btn').forEach(btn=>{
      const txt = (btn.textContent + ' ' + (btn.dataset.keywords||'')).toLowerCase();
      const match = !needle || txt.includes(needle);
      btn.classList.toggle('hidden-by-search', !match);
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
        // no forzar open, dejar como estaba
      }
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

// === DISCIPLINA ===
function getDisciplineData(){
  const u=userData();
  if(!u.discipline) u.discipline={ mit:"", if:"", then:"" };
  return u.discipline;
}
function setupDisciplineDialog(){
  const btn=$('btnDiscipline'); if(btn) btn.onclick=()=>{
    const d=getDisciplineData();
    const mit=$('disciplineMIT'), iff=$('disciplineIf'), thn=$('disciplineThen');
    if(mit) mit.value=d.mit||"";
    if(iff) iff.value=d.if||"";
    if(thn) thn.value=d.then||"";
    const st=$('disciplineStatus'); if(st) st.textContent="";
    $('disciplineDialog').showModal();
  };
  const ct=$('disciplineCloseTop'), cb=$('disciplineClose'); if(ct) ct.onclick=()=>$('disciplineDialog').close(); if(cb) cb.onclick=()=>$('disciplineDialog').close();
  const save=$('disciplineSave'); if(save) save.onclick=()=>{
    const d=getDisciplineData();
    d.mit=$('disciplineMIT').value.trim();
    d.if=$('disciplineIf').value.trim();
    d.then=$('disciplineThen').value.trim();
    scheduleSave();
    const st=$('disciplineStatus'); if(st) st.textContent="Intención guardada ✓ — se mantiene para mañana.";
    setTimeout(()=>{ if(st) st.textContent=""; },2500);
  };
  const pomo=$('disciplineStartPomodoro'); if(pomo) pomo.onclick=()=>{
    $('disciplineDialog').close();
    const h=$('countH'), m=$('countM'), s=$('countS');
    if(h&&m&&s){ h.value=0; m.value=25; s.value=0; const ev=new Event('input',{bubbles:true}); h.dispatchEvent(ev); m.dispatchEvent(ev); }
    setTimeout(()=>{ setupTimerDialog(); $('timerDialog').showModal(); const cs=$('countStart'); if(cs) cs.click(); },200);
  };
  document.querySelectorAll('.discipline-try').forEach(b=>{
    b.onclick=()=>{
      $('disciplineDialog').close();
      const h=$('countH'), m=$('countM'), s=$('countS');
      if(h&&m&&s){ h.value=0; m.value=25; s.value=0; }
      setTimeout(()=>{ setupTimerDialog(); $('timerDialog').showModal(); const cs=$('countStart'); if(cs) cs.click(); },200);
    };
  });
}
setTimeout(setupDisciplineDialog, 855);
setTimeout(setupDisciplineDialog, 855);

// === RESPIRACIÓN ===
const BREATH_TECHNIQUES = [
  { id:'4-7-8', name:'4-7-8', pattern:[{l:'Inhala',d:4},{l:'Retén',d:7},{l:'Exhala',d:8}], desc:'Ideal para el sueño y la ansiedad. Calma profunda.', benefit:'Sueño/ansiedad' },
  { id:'4-4-4-4', name:'4-4-4-4 (Caja)', pattern:[{l:'Inhala',d:4},{l:'Retén',d:4},{l:'Exhala',d:4},{l:'Retén',d:4}], desc:'Útil para enfoque y control del estrés.', benefit:'Foco' },
  { id:'5-5', name:'5-5', pattern:[{l:'Inhala',d:5},{l:'Exhala',d:5}], desc:'Equilibra el sistema nervioso, muy relajante.', benefit:'Equilibrio' },
  { id:'5-5-5-5', name:'5-5-5-5', pattern:[{l:'Inhala',d:5},{l:'Retén',d:5},{l:'Exhala',d:5},{l:'Retén',d:5}], desc:'Versión más lenta de la respiración caja', benefit:'Lenta' },
  { id:'6-3-6-3', name:'6-3-6-3', pattern:[{l:'Inhala',d:6},{l:'Retén',d:3},{l:'Exhala',d:6},{l:'Retén',d:3}], desc:'Mejora el equilibrio entre relajación y control', benefit:'Equilibrio' },
  { id:'6-6', name:'6-6', pattern:[{l:'Inhala',d:6},{l:'Exhala',d:6}], desc:'Relajación profunda, reduce la frecuencia cardíaca', benefit:'Cardíaco' },
  { id:'3-3-6', name:'3-3-6', pattern:[{l:'Inhala',d:3},{l:'Retén',d:3},{l:'Exhala',d:6}], desc:'Exhalación más larga para calmar la ansiedad', benefit:'Ansiedad' },
  { id:'4-6', name:'4-6', pattern:[{l:'Inhala',d:4},{l:'Exhala',d:6}], desc:'Simple y efectiva para relajarte', benefit:'Simple' },
  { id:'7-11', name:'7-11', pattern:[{l:'Inhala',d:7},{l:'Exhala',d:11}], desc:'Técnica poderosa para la relajación profunda', benefit:'Profunda' },
  { id:'2-4', name:'2-4', pattern:[{l:'Inhala',d:2},{l:'Exhala',d:4}], desc:'Método calmante para principiantes', benefit:'Principiantes' }
];
let breathSelected = BREATH_TECHNIQUES[0];
let breathTimer=null, breathPhaseIdx=0, breathSecLeft=0, breathRunning=false;
function renderBreathGrid(){
  const g=$('breathGrid'); if(!g) return;
  g.innerHTML=BREATH_TECHNIQUES.map(t=>`<div class="breath-card ${t.id===breathSelected.id?'sel':''}" data-id="${t.id}"><b>${t.name}</b><br><span class="muted" style="font-size:10px">${t.pattern.map(p=>p.l+' '+p.d).join(' → ')}</span><br><span class="muted" style="font-size:11px">${t.desc}</span></div>`).join('');
  g.querySelectorAll('.breath-card').forEach(el=> el.onclick=()=>{ breathSelected=BREATH_TECHNIQUES.find(x=>x.id===el.dataset.id); renderBreathGrid(); updateBreathHeader(); });
}
function updateBreathHeader(){
  const t=breathSelected;
  $('breathTitle').textContent=t.name+' Respiración';
  $('breathDesc').textContent=t.desc+' — '+t.benefit;
  $('breathPattern').textContent=t.pattern.map(p=>p.l+' '+p.d).join(' → ');
}
function breathTick(){
  const phase=breathSelected.pattern[breathPhaseIdx];
  $('breathPhase').textContent=phase.l;
  $('breathCount').textContent=breathSecLeft;
  const circle=$('breathCircle');
  if(circle){
    circle.className='breath-circle '+(phase.l==='Inhala'?'inhale': phase.l==='Exhala'?'exhale':'');
  }
  breathSecLeft--;
  if(breathSecLeft<=0){
    breathPhaseIdx=(breathPhaseIdx+1)%breathSelected.pattern.length;
    breathSecLeft=breathSelected.pattern[breathPhaseIdx].d;
  }
}
function setupBreathDialog(){
  const btn=$('btnBreath'); if(btn) btn.onclick=()=>{ renderBreathGrid(); updateBreathHeader(); $('breathDialog').showModal(); };
  const ct=$('breathCloseTop'), cb=$('breathClose'); if(ct) ct.onclick=()=>$('breathDialog').close(); if(cb) cb.onclick=()=>$('breathDialog').close();
  renderBreathGrid(); updateBreathHeader();
  const start=$('breathStart'), pause=$('breathPause'), reset=$('breathReset');
  if(start) start.onclick=()=>{
    if(breathRunning) return;
    breathRunning=true; breathPhaseIdx=0; breathSecLeft=breathSelected.pattern[0].d;
    breathTick();
    breathTimer=setInterval(breathTick,1000);
  };
  if(pause) pause.onclick=()=>{ breathRunning=false; clearInterval(breathTimer); $('breathPhase').textContent='Pausa'; };
  if(reset) reset.onclick=()=>{ breathRunning=false; clearInterval(breathTimer); breathPhaseIdx=0; breathSecLeft=0; $('breathPhase').textContent='Listo'; $('breathCount').textContent='—'; const c=$('breathCircle'); if(c) c.className='breath-circle'; };
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
  else box.innerHTML='<h4 style="color:var(--gold)">Hoy — '+['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][today]+'</h4>' + todays.map(it=>`<div class="mens-hist-item" style="border-left:3px solid ${it.color}"><span><b>${escapeHtml(it.subject)}</b> ${it.start}–${it.end} · ${escapeHtml(it.place||'')}</span></div>`).join('');
}
function renderScheduleWeekGrid(){
  const box=$('scheduleWeekGrid'); if(!box) return;
  const d=getScheduleData();
  const days=[['Domingo',0],['Lunes',1],['Martes',2],['Miércoles',3],['Jueves',4],['Viernes',5],['Sábado',6]];
  let html='';
  days.forEach(([name, idx])=>{
    const items=d.items.filter(x=> parseInt(x.day)===idx).sort((a,b)=> a.start.localeCompare(b.start));
    const isToday=new Date().getDay()===idx;
    html+=`<div class="schedule-day ${isToday?'schedule-today':''}"><b>${name}</b>${items.length? items.map(it=>`<div class="schedule-block" style="background:${it.color};border:1px solid ${it.color}">${escapeHtml(it.subject)}<br><span style="font-size:10px">${it.start}–${it.end}</span></div>`).join('') : '<p class="muted" style="font-size:10px">—</p>'}</div>`;
  });
  box.innerHTML=html;
}
function renderScheduleList(){
  const box=$('scheduleList'); if(!box) return;
  const d=getScheduleData();
  if(!d.items.length){ box.innerHTML='<p class="muted">Sin clases aún. Agrega tu primera arriba.</p>'; return; }
  const sorted=[...d.items].sort((a,b)=> parseInt(a.day)-parseInt(b.day) || a.start.localeCompare(b.start));
  box.innerHTML=sorted.map(it=>`<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b style="color:${it.color}">●</b> ${escapeHtml(it.subject)} — ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][it.day]} ${it.start}–${it.end} ${it.place? '· '+escapeHtml(it.place):''}</span><span style="display:flex;gap:6px"><button data-id="${it.id}" class="btn sched-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn sched-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`).join('');
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
// === ENTRENAMIENTOS (Gym / Terapia / Calistenia / Prácticas) ===
const TRAINING_CATS = {
  gym: { label:'Gym', icon:'🏋️', color:'#e76e8a' },
  fisio: { label:'Terapia física', icon:'🩹', color:'#7ab8ff' },
  calistenia: { label:'Calistenia', icon:'🤸', color:'#a9d18e' },
  varias: { label:'Prácticas varias', icon:'🌿', color:'#e8c56a' }
};
const TRAINING_SUGGESTIONS = {
  gym: [
    { name:'Push — Pecho/Hombro/Tríceps', exercises:'Press banca 4x8 60kg 90s\nFondos paralelas 3x12 45s\nPress hombro 3x10 30kg 60s\nPlancha 3x45s', place:'Gimnasio Penco', color:'#e76e8a' },
    { name:'Pull — Espalda/Bíceps', exercises:'Dominadas 4x6\nRemo barra 4x8 50kg\nCurl bíceps 3x12 15kg\nFace pull 3x15', place:'Gimnasio Penco', color:'#e76e8a' },
    { name:'Piernas — Cuádriceps/Glúteo', exercises:'Sentadilla 4x8 70kg\nPeso muerto 3x8 80kg\nPrensa 3x12\nGemelos 3x15', place:'Gimnasio Penco', color:'#e76e8a' },
    { name:'Cardio HIIT 20′', exercises:'Calentamiento 5′\n8x (30s sprint / 90s trote)\nEnfriamiento 5′ + estiramiento', place:'Costanera Penco', color:'#ff9a76' }
  ],
  fisio: [
    { name:'Movilidad hombro', exercises:'Círculos hombro 3x15\nBanda rotación externa 3x12\nEstiramiento pectoral 3x30s\nPéndulo Codman 2x1′', place:'Casa / Kine', color:'#7ab8ff' },
    { name:'Rodilla — rehab suave', exercises:'Cuádriceps isométrico 3x15s\nPuente glúteo 3x12\nSentadilla parcial 3x10\nHielo 10′ final', place:'Casa', color:'#7ab8ff' },
    { name:'Espalda baja — core', exercises:'Bird-dog 3x10 lado\nPlancha 3x30s\nPuente 3x12\nEstiramiento gato-camello 3x8', place:'Casa', color:'#7ab8ff' },
    { name:'Respiración + diafragma', exercises:'Respiración diafragmática 5′\n4-7-8 x4 ciclos\nMovilidad costal con banda 3x10', place:'Casa', color:'#8fd9d6' }
  ],
  calistenia: [
    { name:'Push calistenia', exercises:'Flexiones 4x12\nFondos paralelas 3x10\nPike push-ups 3x8\nPlancha 3x45s', place:'Plaza Penco / Casa', color:'#a9d18e' },
    { name:'Pull calistenia', exercises:'Dominadas 4x6\nAustralian pull-ups 3x12\nColgado pasivo 3x30s\nCurl toalla 3x10', place:'Parque / Casa', color:'#a9d18e' },
    { name:'Core + piernas', exercises:'Sentadilla 4x20\nZancadas 3x10 lado\nPlancha lateral 3x30s lado\nHollow hold 3x20s', place:'Casa', color:'#a9d18e' },
    { name:'Fullbody principiantes', exercises:'Flexiones rodillas 3x8\nSentadilla 3x15\nRemo mochila 3x12\nPlancha 3x20s', place:'Casa', color:'#c3e0ab' }
  ],
  varias: [
    { name:'Yoga suave 30′', exercises:'Saludo al sol 5x\nGuerrero II 3x30s lado\nTriángulo 3x30s\nSavasana 3′ + 4-7-8', place:'Casa', color:'#e8c56a' },
    { name:'Caminata Playa Penco 45′', exercises:'Caminata ritmo medio 40′\n5′ movilidad tobillo/cadera\nRespiración 5-5 al final', place:'Playa Penco', color:'#e8c56a' },
    { name:'Estiramientos full 15′', exercises:'Cuello/hombros 3′\nIsquios 2x30s lado\nCuádriceps 2x30s\nEspalda gato-camello 3x8', place:'Casa', color:'#f0d488' },
    { name:'Práctica respiración + movilidad 20′', exercises:'Respiración caja 4-4-4-4 5′\nMovilidad cadera 5′\nPlancha 3x30s\nEstiramiento global 5′', place:'Casa', color:'#f0d488' }
  ]
};
function getGymData(){
  const u=userData();
  if(!u.gym) u.gym={ items:[], completions:{} };
  if(!Array.isArray(u.gym.items)) u.gym.items=[];
  if(typeof u.gym.completions!=='object' || Array.isArray(u.gym.completions)) u.gym.completions={};
  // migrar cat faltante
  u.gym.items.forEach(it=>{ if(!it.cat) it.cat='gym'; if(!TRAINING_CATS[it.cat]) it.cat='gym'; });
  return u.gym;
}
let gymEditingId=null;
let gymCurrentTab='gym';
function renderGymSuggestions(cat){
  const box=$('gymSuggestionsBox'); if(!box) return;
  const list=TRAINING_SUGGESTIONS[cat]||[];
  const catInfo=TRAINING_CATS[cat];
  box.innerHTML=`<h4 style="color:var(--gold)">${catInfo.icon} ${catInfo.label} — sugerencias (toca para cargar)</h4>` + list.map(s=>`<div class="habit-item" style="cursor:pointer;border-left:3px solid ${s.color}" data-sug="${escapeHtml(s.name)}" data-cat="${cat}"><b>${escapeHtml(s.name)}</b> <span class="muted" style="font-size:10px">${escapeHtml(s.place)}</span><br><span class="muted" style="font-size:11px;white-space:pre-wrap">${escapeHtml(s.exercises)}</span><br><span class="chip" style="font-size:10px;margin-top:4px">+ Agregar al calendario</span></div>`).join('') + `<p class="muted" style="font-size:10px;margin-top:6px">Toca una tarjeta para cargar nombre/lugar/ejercicios/color y luego elige día/hora y pulsa “Agregar al calendario”.</p>`;
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
  else box.innerHTML='<h4 style="color:var(--gold)">Hoy — '+['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][today]+'</h4>' + todays.map(it=>{
    const done = d.completions[todayKey] && d.completions[todayKey][it.id];
    const cat=TRAINING_CATS[it.cat]||TRAINING_CATS.gym;
    return `<div class="mens-hist-item" style="border-left:3px solid ${it.color}"><span><b>${cat.icon} ${escapeHtml(it.name)}</b> <span class="chip" style="font-size:10px">${cat.label}</span> ${it.start}–${it.end} · ${escapeHtml(it.place||'')} ${done?'<span class="chip" style="background:var(--gold);color:#10142c;margin-left:6px">✓ hecho</span>':''}</span><label class="check-row" style="margin:0"><input type="checkbox" data-id="${it.id}" ${done?'checked':''}> Hecho</label></div>`;
  }).join('') + '<p class="muted" style="font-size:10px;margin-top:6px">Marca como hecho para racha.</p>';
  box.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.onchange=()=>{
    const id=cb.dataset.id; const key=cal.fmtKey.format(new Date());
    const gd=getGymData();
    if(!gd.completions[key]) gd.completions[key]={};
    if(cb.checked) gd.completions[key][id]=true;
    else { delete gd.completions[key][id]; if(Object.keys(gd.completions[key]).length===0) delete gd.completions[key]; }
    scheduleSave(); renderGymTodayBox(); renderGymStatsBox(); renderGymWeekGrid(); renderLuna();
  });
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
      return `<div class="schedule-block" style="background:${it.color};border:1px solid ${it.color}">${cat.icon} ${escapeHtml(it.name)}<br><span style="font-size:10px">${it.start}–${it.end}</span></div>`;
    }).join('') : '<p class="muted" style="font-size:10px">—</p>'}</div>`;
  });
  box.innerHTML=html;
}
function renderGymList(){
  const box=$('gymList'); if(!box) return;
  const d=getGymData();
  if(!d.items.length){ box.innerHTML='<p class="muted">Sin entrenamientos aún. Toca una sugerencia arriba o crea uno.</p>'; return; }
  const sorted=[...d.items].sort((a,b)=> parseInt(a.day)-parseInt(b.day) || a.start.localeCompare(b.start));
  box.innerHTML=sorted.map(it=>{
    const cat=TRAINING_CATS[it.cat]||TRAINING_CATS.gym;
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b style="color:${it.color}">${cat.icon}</b> <span class="chip" style="font-size:10px;background:${cat.color};color:#10142c">${cat.label}</span> <b>${escapeHtml(it.name)}</b> — ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][it.day]} ${it.start}–${it.end} ${it.place? '· '+escapeHtml(it.place):''}<br><span class="muted" style="font-size:11px">${escapeHtml((it.exercises||'').split('\n')[0]||'')}</span></span><span style="display:flex;gap:6px"><button data-id="${it.id}" class="btn gym-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn gym-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`;
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
    scheduleSave(); renderGymList(); renderGymWeekGrid(); renderGymTodayBox(); renderGymStatsBox(); renderLuna();
  });
}
function renderGymStatsBox(){
  const box=$('gymStatsBox'); if(!box) return;
  const d=getGymData();
  const todayKey=cal.fmtKey.format(new Date());
  const todayDone = d.completions[todayKey] ? Object.keys(d.completions[todayKey]).length : 0;
  const weekDone = Object.keys(d.completions).filter(k=>{ const ms=mensKeyToMs(k); return Math.abs(ms - Date.now()) < 7*86400000; }).length;
  const byCat={}; d.items.forEach(it=>{ byCat[it.cat]=(byCat[it.cat]||0)+1; });
  const catTxt=Object.entries(byCat).map(([k,c])=>`${TRAINING_CATS[k].icon} ${c}`).join(' · ') || '0';
  box.innerHTML='<h4 style="color:var(--accent)">📊 Progreso</h4><div class="habit-stats"><span>Hoy: '+todayDone+' completadas</span><span>Esta semana: '+weekDone+' días</span><span>Total: '+d.items.length+' ('+catTxt+')</span></div>';
}
function setupGymDialog(){
  const btn=$('btnGym'); if(btn) btn.onclick=()=>{ renderGymSuggestions(gymCurrentTab); renderGymTodayBox(); renderGymWeekGrid(); renderGymList(); renderGymStatsBox(); $('gymDialog').showModal(); };
  const ct=$('gymCloseTop'), cb=$('gymClose'); if(ct) ct.onclick=()=>$('gymDialog').close(); if(cb) cb.onclick=()=>$('gymDialog').close();
  // tabs
  const tabs={ gym:$('tabGymGym'), fisio:$('tabGymFisio'), calistenia:$('tabGymCalis'), varias:$('tabGymVarias') };
  Object.entries(tabs).forEach(([cat,el])=>{
    if(!el) return;
    el.onclick=()=>{ gymCurrentTab=cat; Object.entries(tabs).forEach(([c,e])=> e && e.classList.toggle('btn-accent', c===cat)); renderGymSuggestions(cat); const sel=$('gymCategory'); if(sel) sel.value=cat; };
  });
  const catSel=$('gymCategory'); if(catSel) catSel.onchange=()=>{ const v=catSel.value; if(TRAINING_CATS[v]){ gymCurrentTab=v; Object.entries(tabs).forEach(([c,e])=> e && e.classList.toggle('btn-accent', c===v)); renderGymSuggestions(v); } };
  const add=$('gymAdd'); if(add) add.onclick=()=>{
    const name=$('gymName').value.trim(); if(!name) return alert('Escribe nombre de rutina');
    const it={ id:'gym'+Date.now(), name, cat:$('gymCategory').value||'gym', day:$('gymDay').value, start:$('gymStart').value, end:$('gymEnd').value, color:$('gymColor').value, place:$('gymPlace').value.trim(), exercises:$('gymExercises').value.trim() };
    if(it.start>=it.end) return alert('Hora inicio debe ser antes que fin');
    if(!TRAINING_CATS[it.cat]) it.cat='gym';
    getGymData().items.push(it); scheduleSave(); $('gymName').value=''; $('gymExercises').value=''; renderGymList(); renderGymWeekGrid(); renderGymTodayBox(); renderGymStatsBox(); renderLuna();
  };
  const upd=$('gymUpdate'); if(upd) upd.onclick=()=>{
    const it=getGymData().items.find(x=>x.id===gymEditingId); if(!it) return;
    it.name=$('gymName').value.trim(); it.cat=$('gymCategory').value||it.cat; it.day=$('gymDay').value; it.start=$('gymStart').value; it.end=$('gymEnd').value; it.color=$('gymColor').value; it.place=$('gymPlace').value.trim(); it.exercises=$('gymExercises').value.trim();
    if(!TRAINING_CATS[it.cat]) it.cat='gym';
    scheduleSave(); gymEditingId=null; $('gymAdd').classList.remove('hidden'); upd.classList.add('hidden'); $('gymCancel').classList.add('hidden'); $('gymName').value=''; $('gymExercises').value=''; renderGymList(); renderGymWeekGrid(); renderGymTodayBox(); renderGymStatsBox(); renderLuna();
  };
  const cancel=$('gymCancel'); if(cancel) cancel.onclick=()=>{ gymEditingId=null; $('gymAdd').classList.remove('hidden'); $('gymUpdate').classList.add('hidden'); cancel.classList.add('hidden'); $('gymName').value=''; $('gymExercises').value=''; };
}

setTimeout(setupGymDialog, 870);

function setupStudyDialog(){
  const btn=$('btnStudy'); if(btn) btn.onclick=()=>{ $('studyDialog').showModal(); };
  const ct=$('studyCloseTop'), cb=$('studyClose'); if(ct) ct.onclick=()=>$('studyDialog').close(); if(cb) cb.onclick=()=>$('studyDialog').close();
  const tabG=$('tabStudyGeneral'), tabM=$('tabStudyMnemo'), tabS=$('tabStudySpeed');
  const pG=$('studyGeneralPanel'), pM=$('studyMnemoPanel'), pS=$('studySpeedPanel');
  function show(tab){
    [tabG,tabM,tabS].forEach(b=> b && b.classList.remove('btn-accent'));
    [pG,pM,pS].forEach(p=> p && p.classList.add('hidden'));
    if(tab==='g'){ tabG&&tabG.classList.add('btn-accent'); pG&&pG.classList.remove('hidden'); }
    if(tab==='m'){ tabM&&tabM.classList.add('btn-accent'); pM&&pM.classList.remove('hidden'); }
    if(tab==='s'){ tabS&&tabS.classList.add('btn-accent'); pS&&pS.classList.remove('hidden'); }
  }
  if(tabG) tabG.onclick=()=> show('g');
  if(tabM) tabM.onclick=()=> show('m');
  if(tabS) tabS.onclick=()=> show('s');
  // Feynman save to today's note
  const feySave=$('studyFeynmanSave');
  if(feySave) feySave.onclick=()=>{
    const topic=$('studyFeynmanTopic').value.trim();
    const text=$('studyFeynmanText').value.trim();
    if(!topic && !text) return alert('Escribe tema y explicación');
    const info=todayInfo();
    if(!info) return alert('No se pudo ubicar hoy');
    const note = (topic? 'Feynman - '+topic+': ':'') + text;
    if(info.luna==='dft'){
      const c=cyc(currentCycleYear()); c.dft.nota = (c.dft.nota? c.dft.nota+"\n":"") + note;
    } else {
      const cell=dayCell(info.luna, info.diaN);
      cell.nota = (cell.nota? cell.nota+"\n":"") + note;
    }
    scheduleSave(); if(currentView.tipo==='luna') renderLuna(); else renderDFT();
    alert('Guardado en la nota de hoy ✓');
    $('studyFeynmanTopic').value=''; $('studyFeynmanText').value='';
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
  show('g');
}

setTimeout(setupStudyDialog, 872);


// === SUEÑOS ===
function setupDreamsDialog(){
  const btn=$('btnDreams'); if(btn) btn.onclick=()=>{
    const d=userData();
    $('dreamIntention').value=d.dreamIntention||"";
    $('dreamText').value="";
    const st=$('dreamStatus'); if(st) st.textContent="";
    $('dreamsDialog').showModal();
  };
  const ct=$('dreamsCloseTop'), cb=$('dreamsClose'); if(ct) ct.onclick=()=>$('dreamsDialog').close(); if(cb) cb.onclick=()=>$('dreamsDialog').close();
  const setInt=$('dreamSetIntention'); if(setInt) setInt.onclick=()=>{
    const v=$('dreamIntention').value.trim();
    const d=userData(); d.dreamIntention=v; scheduleSave();
    const st=$('dreamStatus'); if(st) st.textContent=v?"Intención fijada ✓ — repítela al acostarte.":"Intención borrada.";
    setTimeout(()=>{ if(st) st.textContent=""; },2500);
  };
  const save=$('dreamSave'); if(save) save.onclick=()=>{
    const txt=$('dreamText').value.trim();
    if(!txt) return alert('Escribe tu sueño, aunque sea una palabra.');
    const info=todayInfo();
    if(!info){ alert('No se pudo ubicar hoy en el calendario.'); return; }
    const key = info.luna==='dft'? null : {luna:info.luna, dia:info.diaN};
    let targetKey = cal.fmtKey.format(new Date());
    // guardar en nota del día con prefijo Sueño:
    if(info.luna==='dft'){
      // guardar en nota del DFT
      const c=cyc(currentCycleYear()); c.dft.nota = (c.dft.nota? c.dft.nota+"\n":"") + `Sueño ${targetKey}: ${txt}`;
    } else {
      const cell=dayCell(info.luna, info.diaN);
      cell.nota = (cell.nota? cell.nota+"\n":"") + `Sueño: ${txt}`;
      // también guardar intención si hay
      const intention=$('dreamIntention').value.trim();
      if(intention) cell.nota += ` [Intención: ${intention}]`;
    }
    scheduleSave();
    if(currentView.tipo==='luna') renderLuna(); else renderDFT();
    const st=$('dreamStatus'); if(st) st.textContent="Sueño guardado en la nota de hoy ✓";
    $('dreamText').value="";
    setTimeout(()=>{ if(st) st.textContent=""; },2500);
  };
}
setTimeout(setupDreamsDialog, 865);


// === CUENTOS LUNARES ===
const DEFAULT_TALES = [
  { n:1, nombre:'We Tripantü Küyen', titulo:'El fuego que no se apaga', texto:'En la noche más larga, la machi Rayén reunió a los niños alrededor del fogón de Penco. Afuera llovía fuerte sobre el golfo y las olas golpeaban Lirquén. “Esta luna guarda el fuego —dijo—. No es para quemar, sino para recordar”. Les entregó a cada uno una semilla de avellano: “Guárdenla seca, oscura y sin apuro. Como el sol ahora, parece dormida, pero late”. El niño Antü guardó la suya en una cajita de quila. Cada noche la miraba antes de dormir, aprendiendo la paciencia del invierno. En esa espera, comprendió que guardar también es sembrar.', moral:'Paciencia y cuidado — lo que se guarda con amor, brota a su tiempo.' },
  { n:2, nombre:'Llitunül Wilki Küyen', titulo:'El zorzal que enseñó a escuchar', texto:'En la luna del zorzal, el canto despertaba a Penco antes que el sol. Millaray decía que no oía nada, hasta que su abuelo la llevó al humedal al amanecer, con frío y neblina. Se quedaron inmóviles. Primero un zorzal, luego dos, luego un coro. “Si caminas apurada, el canto pasa por encima —dijo el abuelo—. Si respiras con la niebla, el canto entra”. Desde entonces Millaray abría la ventana cada mañana y, antes de mirar el celular, escuchaba. Su día empezaba afinado, como un instrumento.', moral:'Escuchar es un oficio — quien hace silencio, entiende el día.' },
  { n:3, nombre:'Llitun Pofpof Anümka Küyen', titulo:'Las manos brotadas', texto:'La tierra de Nahuelbuta olía a brote. En la escuela, cada niño hizo un almácigo en una cáscara de huevo. Ñarki lo regaba todos los días tres veces, impaciente. “Así se ahoga”, le dijo su tía, y le enseñó a tocar la tierra: si brilla, no pide; si se quiebra, tiene sed. A los diez días, un tallo verde asomó. Ñarki no gritó; sonrió largo, como si él mismo hubiera brotado. Entendió que cuidar es medir, no apurar.', moral:'Cuidado atento — la tierra responde a la mano que observa.' },
  { n:4, nombre:'Rayen Awar Küyen', titulo:'La flor que no se corta', texto:'Los cerros de Penco se pintaron de copihue. Ana quería cortar el más lindo para su pieza. Su mamá la llevó donde crecía y le mostró el camino de la semilla: flor → fruto → pájaro → bosque. “Si lo cortas hoy, mañana no hay flor ni bosque —dijo—. Míralo, dibújalo, agradece, deja su semilla”. Ana lo fotografió a contraluz y lo dibujó en su cuaderno. El copihue siguió colgando, y en el verano los colibríes lo visitaron frente a su ventana.', moral:'Respeto — admirar sin poseer deja que la belleza siga.' },
  { n:5, nombre:'Longkon Kachilla Küyen', titulo:'Las viajeras del humedal', texto:'Llegaron las aves migratorias al Rocuant. El curso de Elka hizo un mapa con hilos: desde el norte de América hasta Penco. “¿Cómo saben dónde es Penco sin GPS?”, preguntó Elka. La profesora les mostró el viento, la luna y el instinto. Cada niña eligió un ave y la esperó sin ruido. Cuando un zarapito bajó a la orilla, todas contuvieron el aliento. No aplaudieron; anotaron. Aprendieron que el mundo es una casa con muchos patios, y que Penco es patio de muchos.', moral:'Pertenece a una ruta mayor — cuidar el humedal es cuidar el camino de otros.' },
  { n:6, nombre:'Karü Kachilla Küyen', titulo:'Nudos que salvan', texto:'Era luna de preparar artes. Don Heraldo, pescador de Lirquén, enseñó a hacer nudos a los jóvenes. “Un nudo mal hecho pierde pescado y deja tarraya en el mar —dijo—. Un nudo bien hecho da de comer y no contamina”. Cada uno practicó diez veces el mismo. Al principio se enredaban, luego la mano recordaba sola. Guardaron las redes remendadas y anotaron la veda en el calendario. Entendieron que el mar se pesca con respeto y con manos aprendidas.', moral:'Oficio y respeto — la técnica bien hecha cuida el sustento.' },
  { n:7, nombre:'Kudewallüng Küyen', titulo:'Luciérnagas de verano', texto:'En la noche de luciérnagas, Penco no necesitó faroles. Los niños caminaron a la playa de Rocuant sin linterna: la arena aún tibia, el cielo naranja después de la puesta. Jugaron a contar luces: una, tres, diez. “No las atrapen —dijo la tía—. Si las miran sin tocar, vuelven”. Se acostaron boca arriba. El mar sonaba y las luces parecían estrellas bajas. Se durmieron con la sensación de que el verano era una respiración larga.', moral:'Asombro sin captura — hay luces que solo viven si no se encierran.' },
  { n:8, nombre:'Püramuwün Kachilla Küyen · Are Küyen', titulo:'La mesa larga', texto:'Era luna de cosecha y el calor apretaba. En la población, la vecina Rosa hizo una mesa larga con lo cosechado: tomates, choclos, pimientos y pan amasado. Cada familia llevó algo y se sirvieron sin contar. “¿Y si falta?”, preguntó un niño. “Si falta, alcanzamos menos, pero comimos juntos —dijo Rosa—. Eso también es abundancia”. Comieron hasta tarde, con el sol demorándose tras los cerros. Sobró poco, y ese poco fue semilla.', moral:'Abundancia compartida — cosechar es repartir.' },
  { n:9, nombre:'Trüntarü Küyen', titulo:'El dulce que fermenta', texto:'En la vendimia del valle, el abuelo mostró dos frascos: uno con uva pisada hoy, otro fermentando hace días. “Hoy es dulce —dijo—. En unos días será chicha; si esperas más, será vinagre. Todo a su tiempo”. Dejó a cada nieto revolver el mosto y probar con la punta del dedo. Olía a verano que cambiaba de nombre. Aprendieron que madurar no es apurarse ni atrasarse: es estar atentos al punto justo.', moral:'Tiempo justo — madurar es saber cuándo detener la mano.' },
  { n:10, nombre:'Ngülliw Küyen', titulo:'El bosque que cambia de ropa', texto:'El bosque se volvió rojo y amarillo. La profesora llevó a los niños a recoger hojas y clasificarlas por color, sin arrancar ramas. “El árbol no se muere —dijo—, se guarda. Como nosotros cuando guardamos la ropa de verano”. Cada hoja en el herbário tenía fecha y luna. Al volver, escribieron qué soltarían ellos ese otoño: el apuro, una pelea, el miedo a preguntar. Dejar caer, como el bosque, también es crecer.', moral:'Soltar — como el otoño, desprenderse deja espacio nuevo.' },
  { n:11, nombre:'Malliñ Ko Küyen', titulo:'Los piñones del abuelo', texto:'En precordillera, el abuelo pehuenche enseñó a golpear la araucaria con vara larga, no a cortar. Cayó una lluvia de piñones. “Uno para el suelo, uno para el chucao, uno para nosotros”, contaba. Los niños pelaron piñones al fuego y los comieron con miel. Guardaron un saco para el invierno. Entendieron que la cosecha tiene medida: si tomas todo, el bosque no vuelve.', moral:'Cosecha con medida — tomar solo parte deja futuro.' },
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
    if(!ov) return d;
    return { n:d.n, nombre: ov.nombre||d.nombre, titulo: ov.titulo||d.titulo, texto: ov.texto||d.texto, moral: ov.moral||d.moral };
  });
}
const TALES = DEFAULT_TALES;
let talesEditingN=null;
function renderTalesGrid(){
  const g=$('talesGrid'); if(!g) return;
  const eff=getEffectiveTales();
  g.innerHTML=eff.map(t=>{
    const isEdited = !!getTalesData().edits[String(t.n)];
    return `<div class="discipline-card" style="cursor:pointer;${isEdited?'border-color:var(--gold)':''}" data-n="${t.n}"><h4>🌙 Luna ${t.n} — ${escapeHtml(t.titulo)} ${isEdited?'<span class="chip" style="font-size:10px">editado</span>':''}</h4><p style="font-size:11px;color:var(--muted)">${escapeHtml(t.nombre)}</p><p class="muted" style="font-size:11px;margin-top:4px">${escapeHtml(t.texto.slice(0,120))}…</p><p style="font-size:10px;color:var(--gold)"><i>Moraleja: ${escapeHtml(t.moral)}</i></p></div>`;
  }).join('');
  g.querySelectorAll('[data-n]').forEach(el=> el.onclick=()=>{
    const eff2=getEffectiveTales();
    const t=eff2.find(x=> String(x.n)===el.dataset.n);
    talesEditingN=t.n;
    const r=$('talesReader'); const eBox=$('talesEditBox');
    if(r){ r.classList.remove('hidden');
      r.innerHTML='<h4 style="color:var(--gold)">🌙 Luna '+t.n+' — '+escapeHtml(t.titulo)+'</h4><p style="font-size:11px;color:var(--muted)">'+escapeHtml(t.nombre)+' · '+escapeHtml(MOONS[t.n-1].traduccion)+'</p><p style="font-size:13px;color:#cdd3ee;line-height:1.75;margin-top:8px;white-space:pre-wrap">'+escapeHtml(t.texto)+'</p><p style="font-size:12px;color:var(--gold);margin-top:10px"><b>Moraleja:</b> <i>'+escapeHtml(t.moral)+'</i></p><div class="dlg-actions" style="justify-content:flex-start;margin-top:10px"><button type="button" class="btn btn-accent tales-edit-btn" style="width:auto">✏️ Editar este cuento</button></div>';
      const eb=r.querySelector('.tales-edit-btn'); if(eb) eb.onclick=()=> openTalesEdit(t.n);
      r.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
    if(eBox) eBox.classList.add('hidden');
  });
}
function openTalesEdit(n){
  const eff=getEffectiveTales(); const t=eff.find(x=>x.n===n); if(!t) return;
  talesEditingN=n;
  $('talesEditLuna').textContent=n;
  $('talesEditTitle').value=t.titulo;
  $('talesEditText').value=t.texto;
  $('talesEditMoral').value=t.moral;
  $('talesReader').classList.add('hidden');
  $('talesEditBox').classList.remove('hidden');
  $('talesEditBox').scrollIntoView({behavior:'smooth'});
}
function setupTalesDialog(){
  const b=$('btnTales'); if(b) b.onclick=()=>{ renderTalesGrid(); const r=$('talesReader'); if(r) r.classList.add('hidden'); const eb=$('talesEditBox'); if(eb) eb.classList.add('hidden'); $('talesDialog').showModal(); };
  const ct=$('talesCloseTop'), cb=$('talesClose'); if(ct) ct.onclick=()=>$('talesDialog').close(); if(cb) cb.onclick=()=>$('talesDialog').close();
  const save=$('talesSave'); if(save) save.onclick=()=>{
    const n=talesEditingN; if(!n) return;
    const title=$('talesEditTitle').value.trim(), texto=$('talesEditText').value.trim(), moral=$('talesEditMoral').value.trim();
    if(!texto) return alert('El cuento no puede quedar vacío');
    const td=getTalesData();
    td.edits[String(n)]={ titulo: title||DEFAULT_TALES[n-1].titulo, texto, moral: moral||DEFAULT_TALES[n-1].moral, nombre: DEFAULT_TALES[n-1].nombre };
    scheduleSave();
    $('talesEditBox').classList.add('hidden');
    renderTalesGrid();
    const r=$('talesReader'); if(r){ const t=getEffectiveTales().find(x=>x.n===n); r.classList.remove('hidden'); r.innerHTML='<h4 style="color:var(--gold)">🌙 Luna '+t.n+' — '+escapeHtml(t.titulo)+' <span class="chip" style="font-size:10px">guardado</span></h4><p style="font-size:13px;color:#cdd3ee;line-height:1.75;white-space:pre-wrap">'+escapeHtml(t.texto)+'</p><p style="font-size:12px;color:var(--gold)"><b>Moraleja:</b> <i>'+escapeHtml(t.moral)+'</i></p>'; }
  };
  const restore=$('talesRestore'); if(restore) restore.onclick=()=>{
    const n=talesEditingN; if(!n) return;
    if(!confirm('¿Restaurar cuento original de la Luna '+n+'?')) return;
    const td=getTalesData(); delete td.edits[String(n)]; scheduleSave();
    $('talesEditBox').classList.add('hidden'); renderTalesGrid();
    const r=$('talesReader'); if(r) r.classList.add('hidden');
  };
  const cancel=$('talesCancelEdit'); if(cancel) cancel.onclick=()=>{ $('talesEditBox').classList.add('hidden'); const r=$('talesReader'); if(r) r.classList.add('hidden'); };
}

// === MEMORIA ===
let memoryPairsFirst=null, memoryPairsLock=false, memoryPairsScore=0;
function renderMemoryPairs(){
  const grid=$('memoryPairsGrid'); if(!grid) return;
  const icons=["🌙","☀️","🌊","🌱","🍎","🌾","🐟","⭐"];
  const deck=[...icons, ...icons].sort(()=>Math.random()-0.5);
  grid.innerHTML='';
  memoryPairsFirst=null; memoryPairsLock=false; memoryPairsScore=0;
  const scoreEl=$('memoryPairsScore'); if(scoreEl) scoreEl.textContent='0 pares';
  deck.forEach(icon=>{
    const btn=document.createElement('button');
    btn.type='button'; btn.className='habit-icon-opt'; btn.textContent='?'; btn.dataset.icon=icon; btn.dataset.revealed='0';
    btn.onclick=()=>{
      if(memoryPairsLock || btn.dataset.revealed==='1') return;
      btn.textContent=btn.dataset.icon; btn.dataset.revealed='1'; btn.style.background='var(--card-hover)';
      if(!memoryPairsFirst){ memoryPairsFirst=btn; }
      else {
        memoryPairsLock=true;
        setTimeout(()=>{
          if(memoryPairsFirst.dataset.icon===btn.dataset.icon){
            memoryPairsFirst.style.borderColor='var(--gold)'; btn.style.borderColor='var(--gold)';
            memoryPairsScore++; if(scoreEl) scoreEl.textContent=memoryPairsScore+' pares';
            if(memoryPairsScore===icons.length) setTimeout(()=> alert('¡Excelente! Memoria entrenada.'),200);
            memoryPairsFirst=null; memoryPairsLock=false;
          } else {
            memoryPairsFirst.textContent='?'; memoryPairsFirst.dataset.revealed='0'; memoryPairsFirst.style.background='';
            btn.textContent='?'; btn.dataset.revealed='0'; btn.style.background='';
            memoryPairsFirst=null; memoryPairsLock=false;
          }
        },600);
      }
    };
    grid.appendChild(btn);
  });
}
function setupMemoryDialog(){
  const b=$('btnMemory'); if(b) b.onclick=()=>{ $('memoryDialog').showModal(); };
  const ct=$('memoryCloseTop'), cb=$('memoryClose'); if(ct) ct.onclick=()=>$('memoryDialog').close(); if(cb) cb.onclick=()=>$('memoryDialog').close();
  const tabL=$('tabMemoryLoci'), tabP=$('tabMemoryPairs'), pL=$('memoryLociPanel'), pP=$('memoryPairsPanel');
  if(tabL) tabL.onclick=()=>{ tabL.classList.add('btn-accent'); tabP.classList.remove('btn-accent'); pL.classList.remove('hidden'); pP.classList.add('hidden'); };
  if(tabP) tabP.onclick=()=>{ tabP.classList.add('btn-accent'); tabL.classList.remove('btn-accent'); pP.classList.remove('hidden'); pL.classList.add('hidden'); renderMemoryPairs(); };
  const build=$('memoryBuildLoci'); if(build) build.onclick=()=>{
    const words=$('memoryWords').value.split(',').map(s=>s.trim()).filter(Boolean);
    if(!words.length) return;
    const places=['Entrada','Cocina','Living','Baño','Dormitorio'];
    const out=words.map((w,i)=> `${i+1}. ${places[i%places.length]} → imagina <b>${escapeHtml(w)}</b> gigante ahí`).join('<br>');
    $('memoryLociOutput').innerHTML=out;
  };
  const newGame=$('memoryPairsNew'); if(newGame) newGame.onclick=renderMemoryPairs;
  renderMemoryPairs();
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
let astroTab='upcoming';
function renderAstroDialog(tab){
  astroTab=tab||astroTab;
  const tU=$('tabAstroUpcoming'), tY=$('tabAstroYear'), tL=$('tabAstroLuna');
  if(tU&&tY&&tL){
    [tU,tY,tL].forEach(b=> b.classList.remove('btn-accent'));
    if(astroTab==='upcoming') tU.classList.add('btn-accent');
    if(astroTab==='year') tY.classList.add('btn-accent');
    if(astroTab==='luna') tL.classList.add('btn-accent');
  }
  const todayKey=cal.fmtKey.format(new Date());
  const todayBox=$('astroTodayBox');
  if(todayBox){
    const todayEvents=astroVisibleForDate(todayKey);
    const phases=phaseMap[todayKey]||[];
    const phaseTxt=phases.length? phases.map(p=> p.simbolo+' '+p.tipo.replace('-',' ')).join(' · ') : 'Sin fase exacta hoy';
    todayBox.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><span><b>🔭 Hoy — ${cal.weekdayName(mensKeyToMs(todayKey))} ${cal.fmtFull.format(new Date(mensKeyToMs(todayKey)))}</b></span><span class="chip">${phaseTxt}</span></div>` + (todayEvents.length? todayEvents.map(e=> `<div class="chip" style="display:block;margin-top:6px;border-color:var(--gold)">${e.icon} <b>${escapeHtml(e.nombre)}</b> — ${escapeHtml(e.desc)}</div>`).join('') : '<p class="muted" style="font-size:11px;margin-top:6px">Hoy sin eclipse/lluvia destacada. Revisa fases arriba.</p>') + `<p class="muted" style="font-size:11px;margin-top:6px">Penco: lat ${PENCO.lat}, lng ${PENCO.lng}. Cielo ideal: humedal Rocuant sin luces.</p>`;
  }
  const list=$('astroList'); if(!list) return;
  let events=[];
  if(astroTab==='upcoming'){
    const now=new Date(); const nowKey=cal.fmtKey.format(now);
    events=ASTRO_EVENTS.filter(e=> e.date >= nowKey).sort((a,b)=> a.date.localeCompare(b.date)).slice(0,8);
    if(!events.length) events=ASTRO_EVENTS.slice(0,6);
    list.innerHTML='<h4 style="color:var(--gold);margin-top:10px">⏳ Próximos 8 eventos</h4>' + events.map(e=> {
      const isToday=e.date===todayKey;
      const luna=mensLunaForKey(e.date);
      return `<div class="si-card" style="${isToday?'border-color:var(--gold);background:var(--card-hover)':''}"><h4>${e.icon} ${escapeHtml(e.nombre)} <span class="chip" style="font-size:10px">${e.tipo}</span> ${isToday?'<span class="chip" style="font-size:10px;background:var(--gold);color:#10142c">hoy</span>':''}</h4><p style="font-size:12px;color:var(--gold)">${e.date} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''}</p><p style="font-size:12px">${escapeHtml(e.desc)}</p></div>`;
    }).join('');
  } else if(astroTab==='year'){
    const yr=new Date().getFullYear();
    const yearEvents=ASTRO_EVENTS.filter(e=> e.date.startsWith(String(yr)) || e.date.startsWith(String(yr+1))).sort((a,b)=>a.date.localeCompare(b.date));
    const byType={}; yearEvents.forEach(e=>{ if(!byType[e.tipo]) byType[e.tipo]=[]; byType[e.tipo].push(e); });
    let html=`<h4 style="color:var(--gold);margin-top:10px">📅 ${yr} — ${yr+1} ciclo</h4>`;
    Object.keys(byType).forEach(t=>{ html+=`<p class="muted" style="font-size:11px;margin:8px 0 4px"><b>${t}</b> · ${byType[t].length}</p>` + byType[t].map(e=> `<div class="si-card" style="padding:8px 10px"><h4 style="font-size:12px">${e.icon} ${escapeHtml(e.nombre)} <span class="muted" style="font-size:11px">${e.date}</span></h4><p style="font-size:11px">${escapeHtml(e.desc)}</p></div>`).join(''); });
    list.innerHTML=html;
  } else { // luna
    const lunaDays = currentView.tipo==='dft'? [] : cycle.days.filter(d=> d.luna===currentView.luna);
    const lunaName = currentView.tipo==='dft'? 'Día Fuera del Tiempo' : MOONS[currentView.luna-1].nombre;
    let html=`<h4 style="color:var(--gold);margin-top:10px">🌙 Luna ${currentView.tipo==='dft'?'DFT':currentView.luna} — ${escapeHtml(lunaName)} · fases y eventos</h4>`;
    // fases
    const chips=[];
    lunaDays.forEach(d=>{ const k=cal.fmtKey.format(new Date(d.noonMs)); (phaseMap[k]||[]).forEach(ev=> chips.push({k,ev})); });
    if(chips.length) html+=`<div class="menstrual-card" style="margin-top:8px"><h4>Fases exactas en esta luna</h4>`+chips.map(c=>`<span class="chip" style="display:inline-block;margin:4px 4px 0 0">${c.ev.simbolo} <b>${escapeHtml(c.ev.tipo)}</b> · ${cal.fmtDate.format(new Date(c.ev.utcMs))} ${cal.fmtTime.format(new Date(c.ev.utcMs))}</span>`).join('')+`</div>`;
    // astro in luna
    let astroInLuna=[];
    lunaDays.forEach(d=>{ const k=cal.fmtKey.format(new Date(d.noonMs)); const evs=astroVisibleForDate(k); evs.forEach(e=> astroInLuna.push({k,e})); });
    if(astroInLuna.length) html+=`<div style="margin-top:8px">`+astroInLuna.map(o=>`<div class="si-card" style="border-color:var(--gold)"><h4>${o.e.icon} ${escapeHtml(o.e.nombre)}</h4><p style="font-size:12px;color:var(--gold)">${o.k}</p><p style="font-size:12px">${escapeHtml(o.e.desc)}</p></div>`).join('')+`</div>`;
    else html+='<p class="muted" style="margin-top:8px">Sin eclipses/lluvias en estos 28 días. Revisa pestaña Próximos.</p>';
    list.innerHTML=html;
  }
}
function setupAstroDialog(){
  const btn=$('btnAstro'); if(btn) btn.onclick=()=>{ renderAstroDialog('upcoming'); $('astroDialog').showModal(); };
  const ct=$('astroCloseTop'), cb=$('astroClose'); if(ct) ct.onclick=()=>$('astroDialog').close(); if(cb) cb.onclick=()=>$('astroDialog').close();
  const tU=$('tabAstroUpcoming'), tY=$('tabAstroYear'), tL=$('tabAstroLuna');
  if(tU) tU.onclick=()=> renderAstroDialog('upcoming');
  if(tY) tY.onclick=()=> renderAstroDialog('year');
  if(tL) tL.onclick=()=> renderAstroDialog('luna');
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
    todayBox.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><span><b>🎉 Hoy — ${cal.fmtFull.format(new Date())}</b></span><span class="chip">${todayEvents.length? todayEvents.length+' evento(s)':'Sin evento hoy'}</span></div>` + (todayEvents.length? todayEvents.map(e=> `<div class="chip" style="display:block;margin-top:6px">${e.icon} <b>${escapeHtml(e.nombre)}</b> — ${escapeHtml(e.desc)}</div>`).join('') : '<p class="muted" style="font-size:11px;margin-top:6px">Hoy sin evento comunal. ¡Crea uno anual!</p>');
  }
  const lunaBox=$('comunaLunaBox');
  if(lunaBox){
    const yr=currentCycleYear();
    const lunaName=currentView.tipo==='dft'? 'DFT' : MOONS[currentView.luna-1].nombre;
    lunaBox.innerHTML=`<h4 style="color:var(--accent)">🌙 Luna ${currentView.tipo==='dft'?'DFT':currentView.luna} · ${escapeHtml(lunaName)}</h4><p class="muted" style="font-size:11px">Eventos anuales que caen dentro de esta luna (28 días) aparecen en el calendario como 📅.</p>`;
  }
  const lunaList=$('comunaLunaList');
  if(lunaList){
    const lunaDays = currentView.tipo==='dft'? [] : cycle.days.filter(d=> d.luna===currentView.luna);
    let html='';
    lunaDays.forEach(d=>{
      const md=cal.fmtKey.format(new Date(d.noonMs)).slice(5);
      const evs=getAllComunaEventsForMD(md);
      evs.forEach(e=>{
        html+=`<div class="si-card" style="padding:8px 10px"><h4>${e.icon} ${escapeHtml(e.nombre)} <span class="chip" style="font-size:10px">${e.cat||'evento'}</span></h4><p style="font-size:11px;color:var(--muted)">${cal.fmtDate.format(new Date(d.noonMs))} (${md})</p><p style="font-size:12px">${escapeHtml(e.desc)}</p></div>`;
      });
    });
    lunaList.innerHTML=html||'<p class="muted">Sin eventos anuales en esta luna.</p>';
  }
  const list=$('comunaList'); if(list){
    const all=getAllComunaEvents();
    if(!all.length) list.innerHTML='<p class="muted">Sin eventos.</p>';
    else list.innerHTML=all.map(e=> `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>${e.icon} ${escapeHtml(e.nombre)}</b> <span class="chip" style="font-size:10px">${e.md} · ${e.cat||''} ${e.oficial? '· oficial':''}</span><br><span class="muted" style="font-size:11px">${escapeHtml(e.desc)}</span></span><span style="display:flex;gap:6px;flex:0 0 auto">${!e.oficial?`<button data-id="${e.id}" class="btn comuna-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${e.id}" class="btn comuna-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button>`: '<span class="muted" style="font-size:10px">oficial</span>'}</span></div>`).join('');
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
    html += `<div class="menstrual-card" style="background:linear-gradient(135deg,var(--panel),var(--card));border-color:#ff6b6b">
      <h4 style="color:#ff6b6b">🚨 PAS — Proteger · Avisar · Socorrer</h4>
      <p class="muted" style="font-size:11px">En Penco, con marejada y cerros, la escena puede ser cambiante. Nunca te conviertas en segunda víctima.</p>
      <div class="help-grid" style="margin-top:8px">
        <div class="help-card"><h4>1️⃣ Proteger</h4><p style="font-size:11px">Haz segura la escena: corta gas/cocina, aleja de agua/cable eléctrico, usa guantes si hay sangre. Señaliza si es en carretera Penco-Lirquén.</p></div>
        <div class="help-card"><h4>2️⃣ Avisar — 131</h4><p style="font-size:11px">Llama <b>131 SAMU</b> (24h) o <b>132 Bomberos</b> si hay atrapados. Di: <i>“Estoy en Penco, calle X con Y, referencia (CESFAM/playa), adulto/niño, consciente sí/no, respira sí/no, sangra mucho sí/no”</i>. No cuelgues primero. Si no tienes señal, pide a otra persona que llame.</p></div>
      </div>
      <div class="help-card" style="margin-top:8px"><h4>3️⃣ Socorrer — Evaluación primaria (XABCDE)</h4><p style="font-size:11px;line-height:1.5"><b>X</b> Hemorragia exsanguinante → presiona ya · <b>A</b> Vía aérea → abre frente-mentón si no hay trauma · <b>B</b> Respiración → mira 10s · <b>C</b> Circulación → pulso/sangrado · <b>D</b> Discapacidad (¿responde? habla, dolor, inconsciente) · <b>E</b> Exposición → abriga (hipotermia en Penco en invierno). Si inconsciente pero respira → <b>Posición Lateral de Seguridad</b>; si no respira → inicia RCP (pestaña siguiente).</p></div>
      <details class="menstrual-details" style="margin-top:8px" open><summary>🗒️ Protocolo telefónico — qué decir al 131</summary><p class="muted" style="font-size:11px;line-height:1.5">1. Lugar exacto + comuna Penco, nº, intersección, punto de referencia (Playa Penco / CESFAM / Cerro Verde).<br>2. Edad y sexo aproximado, ¿cuántas víctimas?<br>3. ¿Consciente? ¿Respira? ¿Sangra mucho? ¿Convulsiona?<br>4. ¿Qué pasó? (caída, atropello, ahogamiento, infarto).<br>5. Tu nombre y teléfono. Mantén línea, sigue instrucciones del operador. Si te dice “comprime”, pon altavoz.</p></details>
    </div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card"><h4>😵‍💫 Desmayo (síncope)</h4><p style="font-size:11px">Acuesta boca arriba, eleva piernas 30cm, afloja ropa, ventila, controla respiración 2 min. Si no despierta en 1 min o convulsiona → 131. No le des agua si está inconsciente.</p></div>
      <div class="help-card"><h4>⚡ Convulsión</h4><p style="font-size:11px">No sujetes, no metas nada en la boca, aparta objetos, pon algo blando bajo cabeza, cronometra. Al terminar → lateral seguridad. Si dura &gt;5 min, se repite, o es primera vez → 131. Anota hora y duración.</p></div>
      <div class="help-card"><h4>🧠 ACV — reconoce FAST</h4><p style="font-size:11px"><b>F</b> Face caída de un lado — pide sonreír<br><b>A</b> Arms — pide levantar brazos, ¿uno cae?<br><b>S</b> Speech — habla raro o no entiende<br><b>T</b> Time — llama 131 de inmediato, anota hora inicio. No le des aspirina sin indicación.</p></div>
      <div class="help-card"><h4>💔 Dolor torácico / Infarto</h4><p style="font-size:11px">Opresión pecho 5+ min con irradiación a brazo/mandíbula, sudor frío, náusea, falta de aire → 131 ya, recuesta semi-sentado, afloja ropa, no caminar/esforzar, si toma medicación y la tiene a mano ayúdale, monitorea pulso. No manejes tú a urgencias si hay SAMU.</p></div>
    </div>`;
  } else if(firstAidTab==='rcp'){
    html += `<div class="help-grid">
      <div class="help-card" style="border-color:#e74c3c"><h4>🫀 RCP básico adulto — 30:2</h4><p style="font-size:11px;line-height:1.5">Solo si <b>no respira y no responde</b>. 1) Confirma, pide 131 y DEA si hay. 2) Víctima en suelo duro. 3) Talón de mano en centro del pecho, otra encima, brazos rectos. 4) <b>Comprime 5-6 cm, 100-120/min</b> (ritmo “Stayin’ Alive”), deja que el pecho vuelva. 5) 30 compresiones → 2 ventilaciones si sabes (si no, solo comprime). 6) No pares hasta que llegue ayuda o respire. Si hay DEA, sigue sus instrucciones, no toques durante descarga.</p><p class="muted" style="font-size:10px">Curso práctico recomendado en CESFAM/Bomberos Penco — esta guía no reemplaza práctica presencial.</p></div>
      <div class="help-card"><h4>👶 Niños y lactantes — diferencias</h4><p style="font-size:11px;line-height:1.5"><b>Niño 1-8 años:</b> 1 mano si es pequeño, profundidad 1/3 del tórax (~5cm), 30:2 igual, si 2 reanimadores 15:2.<br><b>Lactante &lt;1 año:</b> 2 dedos centro pecho, 4cm profundidad, 30:2 (solo 15:2 con 2 reanimadores), no inclinación excesiva de cabeza.<br>Si te ahogas solo, llama 131 y haz compresiones contra respaldo de silla.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px;border-color:#ff9a76"><h4>🫁 Atragantamiento — Heimlich</h4>
      <div class="help-grid" style="margin-top:6px">
        <div class="help-card"><h4>Adulto consciente que no tose/habla</h4><p style="font-size:11px">Abraza por detrás, puño sobre ombligo (sobre cicatriz umbilical, bajo esternón), otra mano encima, compresiones en J hacia adentro y arriba (5 veces). Alterna 5 palmadas entre omóplatos + 5 Heimlich hasta que expulse o llegue ayuda. Si queda inconsciente → inicia RCP.</p></div>
        <div class="help-card"><h4>🤰 Embarazada / obeso</h4><p style="font-size:11px">Compresiones en <b>centro del esternón</b>, no en abdomen. Misma alternancia 5+5.</p></div>
        <div class="help-card"><h4>👶 Lactante atragantado</h4><p style="font-size:11px">Boca abajo sobre antebrazo, cabeza más baja que tronco, 5 palmadas suaves entre omóplatos. Gira boca arriba, 5 compresiones con 2 dedos en centro pecho. Repite. Si pierde conciencia → RCP lactante. No metas dedos a ciegas.</p></div>
        <div class="help-card"><h4>🪞 Si te atragantas solo</h4><p style="font-size:11px">Tose fuerte, si no puedes, apoya tu abdomen sobre respaldo de silla/mesón y haz presión brusca hacia adentro-arriba. Llama 131 aunque lo expulses — revisa vía aérea en Hospital.</p></div>
      </div>
    </div>
    <div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>🌊 Ahogamiento (mar/piscina) — Penco costa</h4><p class="muted" style="font-size:11px;line-height:1.5">No entres al agua sin salvavidas/cuerda; pide rescate (Armada 137). Si rescatas: saca sin golpear, acuesta, evalúa respiración. Si no respira → RCP + 131 de inmediato. No hagas “sacar agua” apretando abdomen. Abriga (hipotermia). Si vomita → lateral. Tras cualquier inmersión, aunque respire, evalúalo en Hospital (edema tardío).</p></div>`;
  } else if(firstAidTab==='heridas'){
    html += `<div class="help-grid">
      <div class="help-card"><h4>🩹 Corte leve / erosión</h4><p style="font-size:11px;line-height:1.5">Lava manos, presiona con gasa limpia, lava con agua potable abundante (no alcohol directo), retira tierra visible, seca, povidona si hay solo alrededor (no dentro profunda), tapa con apósito limpio. Cambia diario. Vigila: enrojecimiento creciente, pus, fiebre → CESFAM. Vacuna antitetánica al día.</p></div>
      <div class="help-card" style="border-color:#ff6b6b"><h4>🩸 Hemorragia grave</h4><p style="font-size:11px;line-height:1.5"><b>Presión directa</b> con gasa/compresa, no retires, añade capas. Eleva extremidad si no hay fractura. <b>Torniquete</b> solo si sangrado masivo que no para en extremidad (cinturón/ancho 5cm, 5cm sobre herida, anota hora, no lo sueltes). Llama 131. No quites objeto clavado — estabilízalo. Shock: pálido, frío, sed → acuesta, eleva piernas, abriga.</p></div>
      <div class="help-card"><h4>👃 Sangrado nasal</h4><p style="font-size:11px">Siéntate inclinado adelante, presiona ala blanda de nariz 10-15 min sin soltar, respira por boca, no te suenes ni te acuestes. Frío local. Si dura &gt;20 min, sangra mucho o es por golpe fuerte → SAR/Hospital.</p></div>
      <div class="help-card"><h4>🐶 Mordedura / araña</h4><p style="font-size:11px">Lava con agua y jabón 5 min, no cierres, cubre, consulta CESFAM (antirrábica/antitetánica). Si es araña de rincón (violín) → lleva araña/foto, marca hora, aplica frío, no cortes. En Penco, conserva ejemplar para identificación. Si alergia (hinchazón cara/dificultad respirar) → 131.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px"><h4>🦟 Picaduras — manejo local</h4><p class="muted" style="font-size:11px;line-height:1.5"><b>Abeja/avispa:</b> retira aguijón raspando (no aprietes), lava, frío 10 min, antihistamínico si pica generalizado. <b>Zancudo/ pulga:</b> lava, no rasques, frío. Vigila infección. <b>Medusa / fragata portuguesa</b> (costa Penco): lava con <b>agua de mar</b> (no dulce), retira tentáculos con pinza/guante, no frotes con arena, frío, vinagre no. Si dolor extenso, vómitos, dificultad respirar → 131. Reporta a Capitanía 41 275 1006.</p></div>`;
  } else if(firstAidTab==='quemaduras'){
    html += `<div class="help-grid">
      <div class="help-card" style="border-color:#ff9a76"><h4>🔥 Quemadura térmica</h4><p style="font-size:11px;line-height:1.5"><b>1º grado</b> (roja, duele): enfría con <b>agua potable 15-20 min</b> (no hielo, no pasta dental, no mantequilla), cubre con gasa limpia, hidrata, analgésico si no hay alergia.<br><b>2º grado</b> (ampolla): no revientes, enfría, cubre sin apretar, SAR/Hospital.<br><b>3º grado</b> (blanca/negra, no duele): no retires ropa pegada, cubre con paño limpio húmedo, 131 ya. En cara/manos/ingles o extensa → 131.</p></div>
      <div class="help-card"><h4>💨 Inhalación de humo (incendio, brasero)</h4><p style="font-size:11px">Saca al aire, 131, semi-sentado si respira, lateral si inconsciente pero respira. Vigila tos persistente, hollín en nariz — indica daño vía aérea. No vuelvas a entrar por objetos. En Penco inviernos, ventila brasero a leña/parafina: bota ceniza afuera fría.</p></div>
      <div class="help-card"><h4>🧴 Química (cloro, soda)</h4><p style="font-size:11px">Piel: lava agua abundante 20 min, retira ropa contaminada. Ojos: lava 15 min párpado abierto, agua templada. No neutralices con vinagre. Lleva etiqueta del producto a urgencias. 131 / CITUC 22 635 3800.</p></div>
      <div class="help-card"><h4>⚗️ Intoxicación / envenenamiento</h4><p style="font-size:11px">Llama <b>CITUC 22 635 3800</b> (24h) y 131 si grave. No induzcas vómito, no des leche. Guarda envase y anota hora y cantidad. Si no respira → RCP. Niños: guarda medicamentos/bleach bajo llave — en Penco, guarda a altura, nunca en botella de bebida.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>🌡️ Golpe de calor & Hipotermia — Penco costero</h4><p class="muted" style="font-size:11px;line-height:1.5"><b>Calor</b> (verano playa, sin sombra): náusea, dolor cabeza, piel caliente → sombra, desabrocha, paños húmedos en cuello/axilas, sorbitos agua, si confuso/vomita o no suda → 131.<br><b>Hipotermia</b> (viento sur, lluvia, mar): temblor → quietud → somnolencia → quita ropa mojada, abriga seco, manta, bebida tibia si consciente, no alcohol, no fricción brusca, 131 si grave. En marejadas, no te acerques a rocas por fotos.</p></div>`;
  } else if(firstAidTab==='trauma'){
    html += `<div class="help-grid">
      <div class="help-card"><h4>🦴 Fractura / sospecha</h4><p style="font-size:11px">Dolor intenso, deformidad, crujido, impotencia: <b>no endereces</b>, no masajees. Inmoviliza como está (tabla/cartón acolchado), por encima y debajo de la fractura. Frío intermitente, eleva si es extremidad. Llama 131 / traslada a Hospital Penco sin mover mucho. Controla hemorragia y shock.</p></div>
      <div class="help-card"><h4>🤸 Esguince / luxación</h4><p style="font-size:11px">Reposo, Hielo 15min cada 2h (con paño), Compresión suave, Elevación (RICE). Si deformidad o clic → no intentes encajar, inmoviliza y 131. Usa cabestrillo con pañuelo para brazo.</p></div>
      <div class="help-card"><h4>🧠 TEC — golpe en cabeza</h4><p style="font-size:11px">Si cayó de altura, golpe fuerte, pérdida conciencia aunque breve, vómito, dolor cabeza creciente, pupilas distintas, sangrado oído → 131, no lo dejes solo 24h, no automediques, no duermas sin vigilancia. Niños: llanto inconsolable o somnolencia → urgencias ya.</p></div>
      <div class="help-card" style="border-color:#ff6b6b"><h4>🦽 Sospecha lesión de columna (caída, zambullida, atropello)</h4><p style="font-size:11px"><b>No muevas</b>, no lo sientes, no le quites casco. Estabiliza cabeza con manos, pide 131, abriga. Solo mueve si hay peligro inminente (fuego) arrastrando en bloque.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px"><h4>🫁 Obstrucción nasal / cuerpo extraño</h4><p class="muted" style="font-size:11px">Nariz/oído con objeto: no intentes con pinza profunda, lleva a SAR. Si es pila botón (reloj) → 131 de inmediato (quema en 2h). Atragantamiento ver pestaña RCP.</p></div>`;
  } else if(firstAidTab==='botiquin'){
    html += `<div class="menstrual-card" style="background:linear-gradient(135deg,var(--panel),var(--card));border-color:var(--gold)">
      <h4 style="color:var(--gold)">🎒 Botiquín hogar Penco — revisa cada luna (28 días)</h4>
      <div class="help-grid" style="margin-top:8px">
        <div class="help-card"><h4>🩹 Básico</h4><p style="font-size:11px">Guantes desechables, mascarilla, gasas estériles, apósitos, tela adhesiva, vendaje elástico, curitas, suero fisiológico 0,9% (o agua hervida fría), tijera punta roma, pinza, termómetro, linterna, manta.</p></div>
        <div class="help-card"><h4>💊 Botiquín (con receta según caso)</h4><p style="font-size:11px">Paracetamol/ibuprofeno, antihistamínico, sales rehidratación oral, povidona yodada, alcohol 70% (solo para instrumental), crema quemadura leve. Guarda prospectos y fechas de vencimiento. No automediques antibióticos.</p></div>
        <div class="help-card"><h4>📄 Documentos</h4><p style="font-size:11px">Fotocopia carnet, previsión, alergias, medicamentos crónicos, contactos (131/132/133, Hospital 41 272 6300, persona de confianza), plan de evacuación a cerro si vives bajo 30 msnm (tsunami).</p></div>
        <div class="help-card"><h4>🌧️ Extra Penco invernal</h4><p style="font-size:11px">Impermeable, nylon, silbato, power bank, agua 2L p/persona, barras cereal, copia llaves. En bolsa ziploc seca. Si vives cerca de estero, ten saco de arena y pala.</p></div>
      </div>
      <p class="muted" style="font-size:10px;margin-top:8px">Guarda en lugar seco, alto para niños, señalizado. Reemplaza lo usado y lo vencido. Haz simulacro familiar: ¿quién llama, quién abre la puerta a SAMU, dónde esperan?</p>
    </div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card"><h4>🗓️ Rutina mensual</h4><p style="font-size:11px">Luna 1 revisa vencimientos · Luna 4 simulacro · Luna 7 reposición · Luna 10 curso Bomberos/CESFAM. Anota en “Notas de la Luna”.</p></div>
      <div class="help-card"><h4>♿ Inclusivo</h4><p style="font-size:11px">Si hay adulto mayor/movilidad reducida: ten silla/camilla cerca, lista de medicamentos en refrigerador visible para rescatistas, pulsera con datos.</p></div>
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
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,var(--panel),var(--card));border-color:#a9d18e">
      <h4 style="color:#a9d18e">🏠 Tenencia responsable — Ley 21.020 (Ley Cholito)</h4>
      <p class="muted" style="font-size:11px">Eres responsable legal de su bienestar, registro y daños. Multas 1-30 UTM.</p>
      <div class="help-grid" style="margin-top:8px">
        <div class="help-card"><h4>📝 Obligatorio en Penco</h4><p style="font-size:11px;line-height:1.5">1. <b>Microchip + Registro</b> en <b>registratumascota.cl</b> (con Clave Única) — perro y gato.<br>2. <b>Vacunas y desparasitación</b> al día (ver pestaña 💉).<br>3. <b>Esterilización recomendada</b> (gratuita en operativos DIDECO 41 226 1020).<br>4. <b>Paseo con correa</b>, bozal si es razas fuertes, <b>bolsa para fecas</b> — multa municipal si no recoges (Ord. Penco).<br>5. <b>No abandono:</b> si no puedes cuidar, busca adopción, no lo sueltes en humedal/cerro.</p></div>
        <div class="help-card"><h4>🏡 Patio Penco</h4><p style="font-size:11px;line-height:1.5">Viento sur y lluvia horizontal: cucha elevada, seca, con techo y aislación, no amarrado con cadena corta. Agua fresca diaria, sombra en verano (Walüng), no dejar en auto ni balcón al sol. Si arriendas, confirma que acepten mascotas.</p></div>
      </div>
      <details class="menstrual-details" style="margin-top:8px" open><summary>🐕‍🦺 Paseo seguro en costanera / humedal</summary><p class="muted" style="font-size:11px;line-height:1.5">Correa 1,5-2m, no extensible en zona de aves. Lleva agua y bolsa. Evita horas de calor 12-17h (asfalto quema patas — prueba 7s con tu mano). Si tu perro persigue aves, usa correa corta: el <b>chorlo nevado</b> nidifica en arena Oct-Feb y abandona nido si lo asustan.</p></details>
    </div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card"><h4>🐶 Perro — rutina diaria</h4><p style="font-size:11px">2 paseos 20-30min + juego olfativo, agua limpia, croqueta según peso/edad (no sobras condimentadas), cepillado, no huesos astillables. Sociabiliza de cachorro.</p></div>
      <div class="help-card"><h4>🐱 Gato — indoor</h4><p style="font-size:11px">Indoor o con catio: arenero limpio diario, rascador, juguete, agua fresca lejos de comida, esteriliza a los 5-6 meses. No collar con cascabel permanente.</p></div>
    </div>`;
  } else if(animalCareTab==='auxilios'){
    html+= `<div class="help-grid">
      <div class="help-card" style="border-color:#ff6b6b"><h4>🩸 Herida / hemorragia</h4><p style="font-size:11px;line-height:1.5">Guantes, presiona con gasa limpia 5 min sin retirar, venda suave. No uses alcohol directo ni torniquete improvisado apretado. Collar isabelino/cartón para que no lama. Traslada a vet (41 222 3456 Conce 24h) si es profunda, no para de sangrar o hay objeto clavado.</p></div>
      <div class="help-card"><h4>🚗 Atropello</h4><p style="font-size:11px;line-height:1.5">No lo abraces brusco: puede morder por dolor. Inmoviliza en manta rígida, controla hemorragia, abriga (shock), llama vet. Si es callejero, avisa a Vet Municipal 41 226 1017 y Carabineros 133. Anota patente si se da a la fuga.</p></div>
      <div class="help-card"><h4>🤢 Envenenamiento (raticida, anticongelante, chocolate, cebolla, lirio)</h4><p style="font-size:11px;line-height:1.5"><b>No des leche, aceite ni induzcas vómito</b>. Retira resto del hocico, guarda envase, llama vet ya. Lirio y anticongelante son letales en gatos/perros. Xilitol (chicle) → hipoglucemia grave en perro. Tiempo es oro.</p></div>
      <div class="help-card"><h4>🥵 Golpe de calor</h4><p style="font-size:11px;line-height:1.5">Jadeo extremo, babeo, tambaleo, encías rojas → sombra, agua fresca (no helada) en patas y panza, ventilador, ofrece agua a sorbos, no lo sumerjas en hielo. Traslada ya: daño renal. En Penco, nunca dejes perro en auto ni patio sin sombra en verano.</p></div>
    </div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card"><h4>🫁 Atragantamiento animal</h4><p style="font-size:11px">Perro: si tose y puede respirar, déjalo toser. Si no respira y está consciente, abre hocico, mira objeto, retíralo con pinza si lo ves (no a ciegas). Si inconsciente → maniobra Heimlich adaptada (compresión abdominal suave por detrás). Gato similar. Tras expulsar, vet.</p></div>
      <div class="help-card"><h4>🌀 Convulsión</h4><p style="font-size:11px">No sujetes, aparta muebles, baja luz y ruido, cronometra, no metas mano en hocico. Al terminar, abriga y traslada. Anota duración. Si &gt;5min o se repite → urgencia.</p></div>
      <div class="help-card"><h4>🦂 Picadura abeja / araña</h4><p style="font-size:11px">Retira aguijón raspando, frío 10min, vigila hinchazón cara/dificultad respirar (anafilaxia) → vet ya. Araña de rincón: lleva ejemplar, frío, no cortes.</p></div>
      <div class="help-card"><h4>🧰 Cómo trasladar seguro</h4><p style="font-size:11px">Manta como camilla, hocico con bozal casero (venda suave, no aprietes si vomita o tiene dificultad respirar), cabeza levemente elevada si respira mal. Lleva carnet vacuna. En moto/auto, jaula o arnés.</p></div>
    </div>`;
  } else if(animalCareTab==='salud'){
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,var(--panel),var(--card));border-color:#7ab8ff">
      <h4 style="color:#7ab8ff">💉 Vacunas & desparasitación — calendario Penco</h4>
      <div class="help-grid" style="margin-top:8px">
        <div class="help-card"><h4>🐶 Cachorro perro</h4><p style="font-size:11px;line-height:1.5"><b>45 días:</b> Puppy DP<br><b>60/90/120 días:</b> Óctuple (3 dosis)<br><b>120 días:</b> Antirrábica (obligatoria, anual)<br><b>+</b> KC si va a hotel canil.<br>Desparasita interna cada 15 días hasta 3 meses, luego mensual hasta 6m, luego cada 3 meses.</p></div>
        <div class="help-card"><h4>🐶 Adulto perro</h4><p style="font-size:11px;line-height:1.5"><b>Anual:</b> Óctuple + Antirrábica.<br><b>Cada 3 meses:</b> antiparasitario interno (según peso).<br><b>Mensual:</b> pipeta/pastilla pulga-garrapata (Bío-Bío hay garrapatas todo el año, más en Walüng).<br>Chequeo vet 1-2 veces/año.</p></div>
        <div class="help-card"><h4>🐱 Gatito</h4><p style="font-size:11px;line-height:1.5"><b>60/90/120 días:</b> Triple felina (3 dosis)<br><b>120 días:</b> Antirrábica<br><b>Leucemia:</b> test + vacuna si negativo.<br>Desparasita igual que perro. Esteriliza 5-6 meses.</p></div>
        <div class="help-card"><h4>✂️ Esterilización municipal</h4><p style="font-size:11px;line-height:1.5">Gratuita vía SUBDERE — inscribe en DIDECO 41 226 1020. Ayuna 8h, lleva manta, collar isabelino. Post-op: 10 días reposo, no lamer, antibiótico según receta. Evita camadas no deseadas y reduce tumores/abandono.</p></div>
      </div>
      <p class="muted" style="font-size:10px;margin-top:6px">Siempre verifica con tu veterinario: calendario puede variar por marca y estado del animal.</p>
    </div>
    <div class="menstrual-card" style="margin-top:10px"><h4>🚨 Signos de alarma — consulta hoy</h4><p class="muted" style="font-size:11px;line-height:1.5">No come 24h + decaído, vómitos/diarrea con sangre, no orina, dificultad respirar, bulto que crece rápido, cojera &gt;24h, rascado con heridas, cambio brusco de conducta. No automediques con paracetamol/ibuprofeno: <b>es tóxico para perros y letal para gatos</b>.</p></div>`;
  } else if(animalCareTab==='bienestar'){
    html+= `<div class="help-grid">
      <div class="help-card"><h4>🥣 Alimentación & agua</h4><p style="font-size:11px;line-height:1.5">Croqueta según edad/peso (cachorro/adulto/senior) — raciona, no a libre demanda. Agua fresca siempre, cambia diario, lava bebedero. No chocolate, xilitol, uva/pasa, cebolla/ajo, huesos cocidos astillables, leche en exceso. En Penco, guarda alimento seco en tarro hermético (humedad).</p></div>
      <div class="help-card"><h4>🐾 Paseo & juego</h4><p style="font-size:11px;line-height:1.5">Perro: 2 paseos + 15min olfato/juego. No lo sueltes cerca de avenida o humedal. Gato: juguete caña 10min, rascador, cajas, hierba gatera. Castra → menos fuga.</p></div>
      <div class="help-card"><h4>🧹 Higiene</h4><p style="font-size:11px;line-height:1.5">Cepillado semanal (más en muda Rimü), baño cada 3-4 semanas con shampoo vet, no uses detergente. Corte uñas cada 3 semanas, limpieza oídos si olor. Arenero gato: 1 por gato +1, en lugar tranquilo.</p></div>
      <div class="help-card"><h4>❄️☀️ Penco clima extremo</h4><p style="font-size:11px;line-height:1.5"><b>Invierno Pukem:</b> cucha aislada del suelo, manta seca, no lo dejes en patio con helada/lluvia toda la noche. <b>Verano Walüng:</b> sombra, agua, no paseo 12-17h, no auto. Tras marejada, lava patas si pisó petróleo/algas rojas.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>🏠 Si encuentras animal perdido/herido</h4><p class="muted" style="font-size:11px;line-height:1.5">1) Foto + ubicación (calle, playa, humedal) y comparte en redes Penco. 2) Revisa chapita/código QR; si tiene chip, Vet Municipal 41 226 1017 lo lee gratis. 3) No lo persigas si está asustado — usa comida. 4) Herido → traslada con manta a vet; si es fauna silvestre (cisne, gaviota enferma) → no lo toques sin guantes, llama SAG 41 274 0600. 5) Denuncia abandono/maltrato: BIDEMA 41 215 3400 o 134 + evidencia (foto/video, fecha).</p></div>`;
  } else if(animalCareTab==='humedal'){
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,#1a2a1a,var(--card));border-color:#7ab8ff">
      <h4 style="color:#7ab8ff">🦅 Humedal Rocuant-Andalién — aves & fauna protegida</h4>
      <p class="muted" style="font-size:11px;line-height:1.5">Sitio prioritario Penco-Lirquén: nidifican <b>chorlo nevado, pilpilén, zarapito</b>. Ley 19.300 y Ordenanza Municipal prohíben caza, captura, ingreso de perros sueltos y botar basura.</p>
      <div class="help-grid" style="margin-top:8px">
        <div class="help-card"><h4>🚫 No hagas</h4><p style="font-size:11px">No sueltes perro sin correa en playa/humedal (espanta nidada y multa). No des <b>pan</b> a cisnes/patos (hincha, desnutre) — si quieres alimentar, usa grano específico con autorización. No toques nidos ni uses flash. No entres con 4x4 a la arena.</p></div>
        <div class="help-card"><h4>✅ Qué sí</h4><p style="font-size:11px">Observa a 30m con binoculares, silencio, no dejes rastro. Recoge tus fecas de perro en bolsa y llévala. Reporta varamiento de lobo/cisne a SERNAPESCA 800 320 032 o SAG 41 274 0600. Participa en limpiezas de playa.</p></div>
        <div class="help-card"><h4>📅 Calendario fauna</h4><p style="font-size:11px"><b>Oct-Feb:</b> chorlo nevado nidifica en arena — no pises dunas.<br><b>Sep-Mar:</b> zarapito migratorio en Rocuant.<br><b>Ago-Nov:</b> ballenas frente a golfo (no acercar embarcación &lt;300m).</p></div>
        <div class="help-card"><h4>📞 Reportes</h4><p style="font-size:11px"><b>SAG Bío-Bío:</b> 41 274 0600 (fauna silvestre herida)<br><b>SERNAPESCA:</b> 800 320 032 (varamiento lobo/ballena)<br><b>Municipal Medio Ambiente:</b> 41 226 1017<br><b>Capitanía Lirquén:</b> 41 275 1006 (contaminación mar)</p></div>
      </div>
    </div>
    <div class="menstrual-card" style="margin-top:10px"><h4>🐾 Gatos ferales & perros comunitarios</h4><p class="muted" style="font-size:11px;line-height:1.5">Penco tiene colonias gestionadas con método TNR (captura-esteriliza-retorna). No los alimentes con sobras en vía pública sin coordinar con Medio Ambiente — genera foco de roedores. Si quieres ayudar, ofrece traslado a operativo o adopción.</p></div>`;
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
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,#231a33,var(--card));border-color:#d8a0ff">
      <h4 style="color:#d8a0ff">📚 Los 7 tipos principales — Ley 20.066 VIF y Ley 21.675 Integral (Chile)</h4>
      <p class="muted" style="font-size:11px">Toda violencia es grave aunque no deje marca visible. Puede ocurrir en pareja (pololeo, convivencia, matrimonio, ex), familia, o a hijos/as. No necesitas que sea “físico” para pedir ayuda. Reconocer el tipo te ayuda a nombrar y actuar.</p>
      <p class="muted" style="font-size:10px">Basado en definiciones SERNAMEG, Ley VIF y OMS. No es diagnóstico legal — cada caso lo califica Fiscalía/Tribunal.</p>
    </div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card" style="border-left:3px solid #e76e8a"><h4>👊 1. Física</h4><p style="font-size:11px;line-height:1.5"><b>Qué es:</b> uso de fuerza que daña cuerpo.<br><b>Ejemplos:</b> empujones, tirones de pelo, cachetadas, golpes, patadas, quemaduras, intentos de estrangulamiento (“me apretó el cuello”), lanzar objetos, encerrar, no dejar salir.<br><b>Señal clave:</b> miedo a su reacción, justificar moretones, ropa para ocultar.<br><b>Riesgo alto:</b> si hubo estrangulamiento, uso de armas, o “si me dejas te mato” → busca ayuda ese día.</p><div style="background:#e76e8a22;border:1px solid #e76e8a55;border-radius:6px;padding:6px;margin-top:6px"><b style="font-size:11px;color:#e76e8a">Qué hacer ahora → ver pestaña 🛡️</b><p class="muted" style="font-size:11px;margin:2px 0 0">No te quedes sola/o tras golpe. Ve a SAR/CESFAM Penco <b>hoy</b> para constatación de lesiones (sirve aunque no denuncies aún) y guarda fotos/fechas en lugar seguro.</p></div></div>
      <div class="help-card" style="border-left:3px solid #d8a0ff"><h4>🧠 2. Psicológica / Emocional</h4><p style="font-size:11px;line-height:1.5"><b>Qué es:</b> control, humillación y miedo sin tocar.<br><b>Ejemplos:</b> insultos (“tonta, inútil”), gritos, desprecios frente a otros, culparte de todo, celos extremos, revisar celular, prohibir salir/vestirte/estudiar, amenazas (“te quitaré a los niños”), gaslighting (“estás loca, yo nunca dije eso”), ley del hielo prolongada, romper tus cosas.<br><b>Señal clave:</b> ansiedad constante, pedir permiso por todo, baja autoestima, aislarte de familia/amigos.</p><div style="background:#d8a0ff22;border:1px solid #d8a0ff55;border-radius:6px;padding:6px;margin-top:6px"><b style="font-size:11px;color:#d8a0ff">Qué hacer</b><p class="muted" style="font-size:11px;margin:2px 0 0">No es “sensibilidad tuya”. Anota fechas/frases, guarda audios/capturas en correo oculto. Habla con persona de confianza y llama 1455 para orientación gratuita y confidencial.</p></div></div>
      <div class="help-card" style="border-left:3px solid #ff9a76"><h4>🔒 3. Sexual</h4><p style="font-size:11px;line-height:1.5"><b>Qué es:</b> cualquier acto sexual sin tu consentimiento libre — <b>dentro de pareja también es delito</b> (art. 361 CP).<br><b>Ejemplos:</b> forzar relaciones, chantaje (“si no quieres es porque andas con otro”), obligar a prácticas que no quieres, grabar/difundir fotos íntimas sin permiso, impedir anticoncepción, tocar a la fuerza. No necesitas “resistir” para que sea abuso.<br><b>Señal:</b> culpa, asco, miedo a decir “no”.</p><div style="background:#ff9a7622;border:1px solid #ff9a7655;border-radius:6px;padding:6px;margin-top:6px"><b style="font-size:11px;color:#ff9a76">Qué hacer</b><p class="muted" style="font-size:11px;margin:2px 0 0">Tu “no” basta. Si ocurrió en 72h ve a SAR/Hospital para atención, profilaxis y constatación aunque dudes en denunciar. No te bañes antes si puedes, lleva ropa en bolsa de papel. Llama 1455/149 — no estás sola.</p></div></div>
      <div class="help-card" style="border-left:3px solid #e8c56a"><h4>💰 4. Económica / Patrimonial</h4><p style="font-size:11px;line-height:1.5"><b>Qué es:</b> control del dinero, trabajo o bienes para hacerte depender.<br><b>Ejemplos:</b> quitar sueldo/IFE, no dar para comida/hijos, endeudarte a tu nombre, esconder documentos/RUT/tarjetas, impedir que trabajes/estudies, romper tu celular/herramientas, no pagar pensión alimentos.<br><b>Señal:</b> no tener $ propio, pedir para cada gasto, miedo a que te “corte” el dinero.</p><div style="background:#e8c56a22;border:1px solid #e8c56a55;border-radius:6px;padding:6px;margin-top:6px"><b style="font-size:11px;color:#e8c56a">Qué hacer</b><p class="muted" style="font-size:11px;margin:2px 0 0">Haz copia de carnet, certificados, cuentas, boletas y guarda en correo seguro de confianza. Abre cuenta RUT solo tuya (BancoEstado) y contacta Centro de la Mujer 41 246 7700 para autonomía económica.</p></div></div>
      <div class="help-card" style="border-left:3px solid #7ab8ff"><h4>👧 5. Vicaria — usando a hijos/as o mascotas</h4><p style="font-size:11px;line-height:1.5"><b>Qué es:</b> dañar a tus hijos, mascotas o seres queridos para golpearte donde más duele. Reconocida en Ley 21.675.<br><b>Ejemplos:</b> amenazar con quitar custodia, maltratar/ golpear a hijos para castigarte, usar visita para interrogar al niño, dejar de pagar pensión a propósito, matar/amenazar mascota, hablar mal de ti a tus hijos (“tu mamá es mala”).<br><b>Señal:</b> niños con miedo, retrocesos, culpa.</p><div style="background:#7ab8ff22;border:1px solid #7ab8ff55;border-radius:6px;padding:6px;margin-top:6px"><b style="font-size:11px;color:#7ab8ff">Qué hacer</b><p class="muted" style="font-size:11px;margin:2px 0 0">Documenta, no expongas a niños a careos. Pide medidas de protección en Trib. Familia (41 274 4000) y orientación en Oficina Niñez Penco 41 226 1020. Si hay riesgo para niños llama 149 o 800 730 800.</p></div></div>
      <div class="help-card" style="border-left:3px solid #a9d18e"><h4>📱 6. Digital / Cibernética</h4><p style="font-size:11px;line-height:1.5"><b>Qué es:</b> control y acoso vía celular/redes — es violencia aunque sea “virtual”. Ley 21.675 la contempla.<br><b>Ejemplos:</b> exigir contraseñas, revisar chats, geolocalizar 24/7, instalar stalkerware, difundir packs/fotos íntimas, crear perfiles falsos, acosar con 100 mensajes/llamadas, amenazar por WhatsApp/IG.<br><b>Señal:</b> borrar chats por miedo, ansiedad al notificar.</p><div style="background:#a9d18e22;border:1px solid #a9d18e55;border-radius:6px;padding:6px;margin-top:6px"><b style="font-size:11px;color:#a9d18e">Qué hacer</b><p class="muted" style="font-size:11px;margin:2px 0 0">No borres pruebas: saca captura con fecha/hora y guarda en drive seguro. Cambia contraseñas en dispositivo seguro, activa 2 pasos, revisa permisos de ubicación. Denunciable como amenazas/coacción (Fiscalía).</p></div></div>
      <div class="help-card" style="border-left:3px solid #c96fb1"><h4>🚧 7. Social / Aislamiento + Acoso</h4><p style="font-size:11px;line-height:1.5"><b>Qué es:</b> cortar tu red para que dependas solo de él/ella.<br><b>Ejemplos:</b> prohibir ver familia/amigos, hablar mal de tu gente para alejarte, controlar salidas/horarios, seguirte, esperarte fuera del trabajo, celar hasta con familia.<br><b>Señal:</b> dejar de salir, “mejor no cuento nada para no pelear”.</p><div style="background:#c96fb122;border:1px solid #c96fb155;border-radius:6px;padding:6px;margin-top:6px"><b style="font-size:11px;color:#c96fb1">Qué hacer</b><p class="muted" style="font-size:11px;margin:2px 0 0">Mantén al menos 1 contacto de confianza con código secreto. Retoma vínculos de a poco. Grupo de apoyo Centro de la Mujer rompe aislamiento.</p></div></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>💡 ¿No sabes qué tipo es? No importa el nombre</h4><p class="muted" style="font-size:11px;line-height:1.5">Si sientes <b>miedo, culpa, ansiedad, obligación constante o pérdida de libertad</b>, pide orientación igual. El Centro de la Mujer y 1455 te ayudan a ponerle nombre sin juzgar y sin obligarte a denunciar de inmediato.</p></div>`;
  } else if(violenceTab==='senales'){
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,#231a33,var(--card));border-color:#d8a0ff">
      <h4 style="color:#d8a0ff">⚠️ Señales de alerta — checklist silencioso</h4>
      <p class="muted" style="font-size:11px">Marca mentalmente. Si 2-3 te resuenan, pide orientación. No necesitas vivirlas todas para que sea violencia.</p>
      <div class="help-grid" style="margin-top:8px">
        <div class="help-card"><h4>🚩 Señales psicológicas</h4><p style="font-size:11px;line-height:1.5">• Te insulta, grita o te hace sentir tonta/culpable siempre.<br>• Minimiza: “fue una tontera, exageras”.<br>• Te controla ropa, maquillaje, amistades, redes, horarios.<br>• Celos extremos y acusa infidelidad sin razón.<br>• Te aíslas de familia/amigos para “evitar problema”.</p></div>
        <div class="help-card"><h4>🚩 Señales físicas/sexuales</h4><p style="font-size:11px;line-height:1.5">• Empujones, zamarreos “suaves” que escalan.<br>• Te aprieta el cuello, aunque sea “jugando”.<br>• Rompe objetos, golpea paredes, te encierra.<br>• Te fuerza o presiona a sexo / no respeta tu no.<br>• Te deja moretones y dice “fue sin querer”.</p></div>
        <div class="help-card"><h4>🚩 Económicas/digital</h4><p style="font-size:11px;line-height:1.5">• Te quita plata, tarjeta o sueldo.<br>• Te impide trabajar/estudiar.<br>• Revisa tu celular, pide claves, te geolocaliza.<br>• Te endeuda o no paga pensión.<br>• Difunde o amenaza con fotos íntimas.</p></div>
        <div class="help-card"><h4>🚩 En ti misma/o</h4><p style="font-size:11px;line-height:1.5">• Pides permiso por todo, con ansiedad.<br>• Caminas “pisando huevos”, mides cada palabra.<br>• Justificas su conducta delante de otros.<br>• Sientes vergüenza, culpa o miedo constante.<br>• Tu salud duerme mal, duele estómago/cabeza, sube consumo alcohol.</p></div>
      </div>
    </div>
    <div class="menstrual-card" style="margin-top:10px;border-color:#e8c56a"><h4>🔄 El ciclo de la violencia — por qué cuesta salir (Walker)</h4>
      <div class="help-grid" style="margin-top:6px">
        <div class="help-card"><h4>1️⃣ Tensión</h4><p style="font-size:11px">Discusiones, celos, control, gritos. Sientes que “algo va a explotar”. Caminas con cuidado.</p></div>
        <div class="help-card"><h4>2️⃣ Explosión</h4><p style="font-size:11px">Golpe, insulto grave, amenaza, ataque sexual. Miedo intenso. Puede durar minutos u horas.</p></div>
        <div class="help-card"><h4>3️⃣ Reconciliación / Luna de miel</h4><p style="font-size:11px">Arrepentimiento, regalos, “cambiaré, fue el alcohol/estrés”, cariño. Esperanza de que ahora sí.</p></div>
        <div class="help-card"><h4>4️⃣ Calma</h4><p style="font-size:11px">Tranquilidad falsa. Hasta que vuelve la tensión. Cada ciclo se acorta y se agrava.</p></div>
      </div>
      <p class="muted" style="font-size:11px;margin-top:8px">Entender el ciclo <b>no justifica</b>. Quedarse no es “gusto”, es esperanza, miedo, dependencia económica, hijos, vergüenza, amenazas o falta de red. Con apoyo, salir es posible.</p>
    </div>
    <details class="menstrual-details" style="margin-top:10px" open><summary>🧩 Mitos que encubren violencia</summary>
      <div class="help-grid" style="margin-top:8px">
        <div class="help-card"><h4>❌ “Me cela porque me quiere”</h4><p style="font-size:11px">Celo = control, no amor. Amor cuida libertad.</p></div>
        <div class="help-card"><h4>❌ “Solo fue una vez / estaba curado”</h4><p style="font-size:11px">Alcohol no crea violencia, la desinhibe. Patrón se repite.</p></div>
        <div class="help-card"><h4>❌ “Aguanto por mis hijos”</h4><p style="font-size:11px">Crecer viendo violencia daña más que separarse con apoyo.</p></div>
        <div class="help-card"><h4>❌ “Yo lo provoqué”</h4><p style="font-size:11px">Nadie provoca ser golpeada/o. Responsable es quien agrede.</p></div>
      </div>
    </details>`;
  } else if(violenceTab==='quehacer'){
    html+= `<div class="menstrual-card" style="border-color:#ff6b6b;background:linear-gradient(135deg,#2a1a20,var(--card))"><h4 style="color:#ff6b6b">🛡️ ¿Qué hacer AHORA? — elige tu situación</h4><p class="muted" style="font-size:11px">Si hay peligro inmediato → <b>prioriza salir y llamar 133/149</b>. No intentes “arreglar” en medio de la crisis. Luego sigue pasos por tipo.</p></div>
    <div class="help-card" style="margin-top:10px;border-color:#ff6b6b"><h4>🚨 PELIGRO INMEDIATO — estás en riesgo ahora</h4><p style="font-size:11px;line-height:1.5"><b>1. Sal:</b> si puedes, anda a pieza con salida, baño con celular, casa vecina, negocio con gente. No discutas en cocina (cuchillos) ni baño sin salida. <b>2. Avisa:</b> 133 Carabineros o 149 Fono Familia (24h). Di: “Violencia intrafamiliar en [calle, nº, Penco], agresor en casa, necesito ayuda”. <b>3. Código silencioso:</b> mensaje a confianza: “¿Me prestas azúcar?” o llama 1455 WhatsApp +56 9 9700 7000. <b>4. Con niños:</b> llévalos contigo, no los dejes. <b>5. Documenta después:</b> fotos lesiones, parte médico SAR. No vuelvas sola/o a buscar cosas.</p></div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card"><h4>👊 Tras agresión física</h4><p style="font-size:11px;line-height:1.5"><b>1. Seguridad + salud hoy:</b> SAR Penco 41 272 6350 / Hospital Penco-Lirquén 41 272 6300 → pide <b>constatación de lesiones</b> (aunque no denuncies). <b>2. Pruebas:</b> fotos con luz, fecha, ropa rota guardada en bolsa papel, capturas amenazas. Guarda en correo Drive oculto, no galería. <b>3. No limpies escena</b> si es grave. <b>4. Denuncia o no decide después</b> con apoyo (1455). <b>5. No minimices:</b> estrangulamiento aunque “no dejó marca” es riesgo vital → evalúate hoy.</p></div>
      <div class="help-card"><h4>🧠 Si es psicológica / control</h4><p style="font-size:11px;line-height:1.5"><b>1. Valida:</b> no es tu imaginación. Anota diario (fecha, frase, contexto, testigos). <b>2. Red:</b> habla con 1 persona segura (familia, CESFAM, Centro Mujer). <b>3. 1455 SERNAMEG</b> te orienta sin obligar a denunciar. <b>4. Límites:</b> “No me grites, hablaremos cuando te calmes” + retírate. Si no respeta, no insistas sola/o. <b>5. Apoyo psicológico gratuito:</b> CESFAM/SAR Penco hora salud mental, Centro Mujer Conce 41 246 7700.</p></div>
      <div class="help-card" style="border-color:#ff9a76"><h4>🔒 Sexual en pareja/expareja</h4><p style="font-size:11px;line-height:1.5"><b>1. Prioridad tú, no pruebas:</b> alójate segura. <b>2. 72h:</b> SAR/Hospital para protocolo (anticoncepción emergencia, VIH, lesiones genéricas) — no necesitas denunciar para atenderte. <b>3. Si puedes:</b> no te laves, lleva ropa en bolsa papel, anota hora/lugar. <b>4. Denuncia:</b> PDI 134 o Fiscalía (no Carabineros si prefieres privacidad). Lleva acompañante. <b>5. No es tu culpa</b> aunque hayas tomado alcohol o vuelvas con él/ella.</p></div>
      <div class="help-card"><h4>💰 Económica / Patrimonial</h4><p style="font-size:11px;line-height:1.5"><b>1. Copias ocultas:</b> carnet, escrituras, contratos, liquidaciones, certificados hijos, claves, fotos deudas. Envíalas a correo seguro de amiga/madre. <b>2. Cuenta propia:</b> BancoEstado Cuenta RUT sin que sepa, guarda $ aunque sea poco. <b>3. Pensión alimentos:</b> Tribunal Familia Conce 41 274 4000 — puedes demandar sin abogado (CAJ gratuita 41 274 2400). <b>4. No firmes</b> créditos o ventas bajo presión. <b>5. CAD Mujer</b> orienta autonomía: SENCE, FOSIS.</p></div>
      <div class="help-card"><h4>👶 Vicaria (con hijos/as)</h4><p style="font-size:11px;line-height:1.5"><b>1. Protege a NNA:</b> no los uses de mensajeros. Escucha sin interrogar. <b>2. Registra:</b> fechas, frases, incumplimiento visitas, mensajes que usa a niños para control. <b>3. Medidas:</b> Tribunal Familia puede suspender visitas, ordenar terapia. Contacta Oficina Local Niñez Penco 41 226 1020 / 800 730 800. <b>4. No confrontes</b> delante de niños. <b>5. Si hay golpe a niño → 133/149 + SAR inmediato.</p></div>
      <div class="help-card"><h4>📱 Digital</h4><p style="font-size:11px;line-height:1.5"><b>1. Guarda evidencia:</b> captura con fecha, URL, perfil. Respalda en drive seguro. <b>2. Protege cuentas:</b> cambia claves en PC seguro, activa doble factor, revisa apps con acceso a ubicación, desinstala stalkerware (ajustes > apps). <b>3. No borres</b> todo aún si vas a denunciar. <b>4. Bloquear reportar</b> en red, pero antes guarda pruebas. <b>5. Ley 21.675:</b> difusión no consentida de imágenes íntimas es delito → PDI Brigada Cibercrimen 134.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>📂 Cómo guardar pruebas sin riesgo</h4><p class="muted" style="font-size:11px;line-height:1.5">Correo nuevo que solo tú sepas (ej: Gmail con nombre distinto) → envíate fotos/audios con fecha. O Drive oculto. Borra de “Enviados” y papelera. No en WhatsApp del agresor. Anota en papel escondido: fecha, hora, qué pasó, testigos. Sirve para denuncia futura aunque hoy no quieras.</p></div>`;
  } else if(violenceTab==='plan'){
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,#231a33,var(--card));border-color:#d8a0ff"><h4 style="color:#d8a0ff">🎒 Plan de seguridad — para salir cuando decidas, o si debes salir corriendo</h4><p class="muted" style="font-size:11px">No necesitas sufrir más para hacer el plan. Hazlo en momento calmo, sin que te vea. Revisa cada luna.</p></div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card"><h4>✅ Bolso de emergencia (escondido)</h4><p style="font-size:11px;line-height:1.5">• Copias carnet, certificado nacimiento hijos, libreta familia, contrato arriendo<br>• Tarjeta/RUT, cuenta propia, $ en efectivo (aunque poco)<br>• Llaves casa + copia a confianza<br>• Ropa 2 cambios + para hijos, medicamentos, recetas<br>• Celular cargador, lista teléfonos escrita a mano<br>Déjalo en casa de madre/vecina confiable o bolso camuflado. No en auto del agresor.</p></div>
      <div class="help-card"><h4>🏠 Lugares seguros Penco</h4><p style="font-size:11px;line-height:1.5">• Casa de confianza a menos de 10 min a pie (acuerda código)<br>• SAR Penco 24h / Hospital Penco-Lirquén (puedes quedarte mientras llega Carabineros)<br>• 2ª Comisaría Penco (Freire) — puedes pedir <b>medida cautelar</b> ahí mismo<br>• Si debes dejar tu barrio, Centro de la Mujer deriva a casa de acogida SERNAMEG (reservada, gratuita). No publiques tu plan en redes.</p></div>
      <div class="help-card"><h4>📱 Código con red</h4><p style="font-size:11px;line-height:1.5">Con 1-2 personas de confianza acuerda:<br>• Palabra clave: “¿Tienes azúcar?” / “¿Cómo está la mami?” = ven/llama a Carabineros<br>• Señal con vecino: luz prendida, toalla en ventana<br>• Si te controla celular, usa WhatsApp 1455 (+56 9 9700 7000) que es silencioso<br>• Prueba el código 1 vez.</p></div>
      <div class="help-card"><h4>👶 Si sales con niños/as o mascota</h4><p style="font-size:11px;line-height:1.5">• Llévalos siempre contigo, mochila con útiles, juguete, leche/paño.<br>• Diles plan simple: “si escuchas gritos, ve a casa de la tía X”.<br>• Mascota: si amenaza con dañarla, Of. Medio Ambiente Penco 41 226 1017 / Vet Municipal puede orientar dónde dejarla breve.<br>• En escuela avisa: “solo yo retiro a mi hijo/a”.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px"><h4>🗒️ Checklist — ¿Qué ya tengo?</h4>
      <p class="muted" style="font-size:11px">Copia mental: ¿documentos? ¿copia llaves? ¿plata separada? ¿1 persona sabe código? ¿ruta a Comisaría sin depender de él/ella? Si te falta 1, es tu próximo paso esta semana — pide ayuda 1455 para armarlo.</p>
      <details class="menstrual-details" style="margin-top:8px"><summary>🚪 Si decides volver tras salir</summary><p class="muted" style="font-size:11px;line-height:1.5">Es común volver por esperanza/miedo. No te juzgues. Asegura: medidas cautelares vigentes, terapia para ambos (por separado), seguimiento Centro Mujer. Si vuelve violencia, no dudes en irte de nuevo — el plan sigue vigente.</p></details>
    </div>`;
  } else if(violenceTab==='redes'){
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,#231a33,var(--card));border-color:#d8a0ff"><h4 style="color:#d8a0ff">🏛️ Redes, denuncia y derechos — Chile & Penco</h4><p class="muted" style="font-size:11px;line-height:1.5"><b>VIF es delito</b> (Ley 20.066) y desde 2024 <b>Ley 21.675</b> amplia protección a pololeo, ex, violencia no solo física. Puedes denunciar como víctima o testigo, presencial o por teléfono. Medidas salen en horas.</p></div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card"><h4>📋 Dónde y cómo denunciar</h4><p style="font-size:11px;line-height:1.5"><b>Opciones:</b><br>• <b>133 Carabineros / 149 Fono Familia</b> (comisaría más cercana)<br>• <b>PDI 134</b> (si prefieres no ir a comisaría)<br>• <b>Fiscalía Concepción</b> (causa penal)<br>• <b>Tribunal de Familia Concepción</b> (medidas protección, pensión, cuidado hijos) — 41 274 4000<br><b>Lleva:</b> carnet, relato escrito con fechas, pruebas (fotos, audios, capturas), constatación lesiones (SAR), testigos (nombre/tel). No necesitas abogado para denunciar. Puedes ir acompañada/o.</p></div>
      <div class="help-card"><h4>⚖️ Qué pasa después — medidas</h4><p style="font-size:11px;line-height:1.5"><b>Juez puede ordenar en 24h:</b> salida del agresor del hogar, prohibición acercarse (200-500m), no porte armas, entrega de hijos a ti, pensión provisoria, rondas Carabineros. Incumplir es delito. Si hay niños, Tribunal dicta protección. Causa penal (lesiones/amenazas) va a Fiscalía. Centro Mujer te acompaña gratis a audiencias.</p></div>
      <div class="help-card"><h4>🏥 Salud — hora segura y gratuita</h4><p style="font-size:11px;line-height:1.5"><b>CESFAM/SAR Penco:</b> 41 272 6350 / 41 272 6000 · Matrona, psicólogo/a, trabajador social — pide <b>hora por VIF</b> (reserva confidencial).<br><b>Hospital Penco-Lirquén:</b> 41 272 6300 urgencias.<br><b>SERNAMEG Centro Mujer Conce:</b> 41 246 7700 (terapia, jurídica, grupo apoyo, casa acogida).<br><b>Salud Responde 600 360 7777</b> orientación.</p></div>
      <div class="help-card"><h4>💜 Apoyo psicosocial gratuito</h4><p style="font-size:11px;line-height:1.5"><b>1455 SERNAMEG (24h)</b> + WhatsApp +56 9 9700 7000 (chat silencioso).<br><b>149 Fono Familia Carabineros</b> (24h VIF).<br><b>800 104 008 Fono VIF</b> (ex 800 104 008).<br><b>Centro Hombre</b> que quiere cambiar (SERNAMEG) — derivación si agresor pide ayuda.<br><b>Fundación Honra, Miles, Corporación Humanas</b> — redes Bío-Bío.<br>En Penco: <b>Of. Mujer DIDECO 41 226 1020</b> + <b>Of. Niñez 41 226 1020</b> + <b>Programa SENDA Previene Penco</b>.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px;border-color:#e8c56a"><h4>📄 Constatación de lesiones ≠ denuncia automática (pero ayuda mucho)</h4><p class="muted" style="font-size:11px;line-height:1.5">Puedes pedir en SAR/Hospital “constatación por VIF” solo para dejar registro médico (fecha, lesiones, firma). Te dan copia. No obliga a denunciar, pero es prueba clave si denuncias después (plazo lesiones leves 6 meses). Pide que describan todo, incluso hematomas pequeños y estado emocional.</p></div>
    <details class="menstrual-details" style="margin-top:10px" open><summary>🗓️ Si no quieres denunciar ahora — igual puedes avanzar</summary><p class="muted" style="font-size:11px;line-height:1.5">• Ve a 1455/Centro Mujer solo para conversar (confidencial).<br>• Actualiza plan de seguridad.<br>• Busca terapia en CESFAM.<br>• Documenta. <br><b>No hay plazo único para todo:</b> lesiones/coacción 6 meses, amenazas/abusos sexuales hasta años, pero entre más pronto, más pruebas. Si cambias de opinión, puedes denunciar cuando estés lista/o.</p></details>`;
  } else if(violenceTab==='ayudar'){
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,#231a33,var(--card));border-color:#d8a0ff"><h4 style="color:#d8a0ff">🤝 Cómo ayudar a otra persona sin ponerla en riesgo</h4><p class="muted" style="font-size:11px">Tu rol: creer, escuchar, informar, acompañar — no rescatar a la fuerza. Respeta sus tiempos.</p></div>
    <div class="help-grid" style="margin-top:10px">
      <div class="help-card"><h4>✅ Qué decir</h4><p style="font-size:11px;line-height:1.5">• “Te creo, no es tu culpa, estoy aquí”.<br>• “¿Cómo te puedo apoyar? ¿Quieres que busquemos ayuda juntas?”<br>• “Mereces vivir sin miedo”.<br>• Ofrece info, no órdenes: “Existe 1455/149, si quieres llamamos juntos”.<br>• “Si decides irte, te ayudo con bolso/contacto”.</p></div>
      <div class="help-card"><h4>❌ Evita</h4><p style="font-size:11px;line-height:1.5">• “¿Por qué no te vas?” / “Aguanta por tus hijos”.<br>• Juzgar, culpar, minimizar: “seguro lo provocaste”.<br>• Dar ultimátum o contar sin permiso (puede aumentar riesgo).<br>• Confrontar al agresor tú sola/o.<br>• Prometer lo que no cumplirás.</p></div>
      <div class="help-card"><h4>👂 Escucha segura</h4><p style="font-size:11px;line-height:1.5">Privado, sin interrupciones, sin hijos del agresor cerca. Valida emociones, pregunta: “¿Te sientes segura en casa hoy?” No interrogues. Deja que ella/él decida ritmo. Ofrece acompañar a CESFAM/Comisaría/Centro Mujer si quiere, no obligar.</p></div>
      <div class="help-card"><h4>🆘 Como testigo / vecino en Penco</h4><p style="font-size:11px;line-height:1.5">Escuchas gritos/golpes: <b>no entres solo</b>. Llama <b>133 o 149</b>, da dirección exacta. Quédate disponible como testigo. Si ves agresión en calle, llama 133, no te expongas. Ofrece después: “Si necesitas algo, aquí estoy”. Registra fecha/hora por si te piden declaración.</p></div>
    </div>
    <div class="menstrual-card" style="margin-top:10px"><h4>🧘 Autocuidado de quien apoya</h4><p class="muted" style="font-size:11px;line-height:1.5">Acompañar duele. Pon límites, no te expongas a violencia. Busca tu propia red, habla con profesional si te angustia. Si el agresor es tu familiar/amigo, puedes decir: “No justifico lo que haces, busca ayuda en 149/Centro Hombres” sin encubrir.</p></div>
    <details class="menstrual-details" style="margin-top:10px"><summary>🧒 Si la víctima es adolescente o persona mayor</summary><p class="muted" style="font-size:11px;line-height:1.5"><b>Adolescente:</b> pololeo violento es VIF desde Ley 21.675. Habla sin sermonear, ofrece 1455/INJUV, avisa a adulto protector con su permiso. <b>Persona mayor:</b> puede depender económicamente → coordina con CESFAM, SENAMA Bío-Bío 800 400 035, Oficina Adulto Mayor Penco 41 226 1020.</p></details>`;
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
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,var(--panel),var(--card));border-color:#ff6b6b">
      <h4 style="color:#ff6b6b">🗺️ Rutas orientativas — sube a pie al cerro</h4>
      <p class="muted" style="font-size:11px">Orientativo: confirma en carta SHOA y municipio. El principio es uno solo: <b>desde costanera, sube por la calle más corta al cerro, sin auto</b>.</p>
      <div class="help-grid" style="margin-top:8px">
        <div class="help-card"><h4>🏖️ Penco centro / Costanera</h4><p style="font-size:11px;line-height:1.5">Costanera → <b>Freire / O'Higgins hacia arriba</b> (este, al cerro). Punto alto: sector <b>Plaza / Municipalidad y más arriba</b>. No uses auto: tacos bloquean. Si estás en playa, deja todo y sube.</p></div>
        <div class="help-card"><h4>⚓ Lirquén / Caleta</h4><p style="font-size:11px;line-height:1.5">Puerto y caleta → sube por <b>camino a Lirquén alto / cerros tras la línea férrea</b>. Pescadores: si el sismo es largo y estás en bote cerca, no vuelvas a puerto bajo — sigue instrucción Armada 137.</p></div>
        <div class="help-card"><h4>🌿 Rocuant / Humedal</h4><p style="font-size:11px;line-height:1.5">Zona plana e inundable. Sal <b>tierra adentro hacia Andalién / camino a Concepción en altura</b>. No cruces esteros crecidos. Con niños/mascotas, sal antes.</p></div>
        <div class="help-card"><h4>🏠 Si vives sobre 30 msnm</h4><p style="font-size:11px;line-height:1.5">Quédate en casa en lugar seguro (ver pestaña Sismo). Recibe a familiares de abajo en tu <b>punto de encuentro</b>. Ten lista de contactos y radio a pilas.</p></div>
      </div>
      <p class="muted" style="font-size:10px;margin-top:6px">Señal natural = alerta: sismo que bota, ruido marino raro, mar que se recoge. Sirenas + mensaje SAE confirman. Practica la caminata 1 vez por luna.</p>
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
    html+= `<div class="menstrual-card" style="border-color:var(--gold)"><h4 style="color:var(--gold)">🎒 Mochila 72h — una por familia (marca avance)</h4>
      <p class="muted" style="font-size:11px">Toca para marcar. Se guarda local por usuario. Meta: 9/9 antes de Luna 4.</p>
      <div id="evacCheckList" class="habits-list" style="margin-top:8px">` +
      items.map(([id,label])=>`<label class="check-row" style="border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:6px;cursor:pointer"><input type="checkbox" data-evac="${id}" ${chk[id]?'checked':''}> <span style="font-size:12px">${label}</span></label>`).join('') +
      `</div><p class="muted" id="evacCheckStats" style="font-size:11px"></p></div>`;
  } else if(evacTab==='plan'){
    html+= `<div class="help-grid">
      <div class="help-card"><h4>📋 Ficha familiar (escríbela a mano)</h4><p style="font-size:11px;line-height:1.5">• Punto encuentro 1 (cerro): ______<br>• Punto encuentro 2 (fuera Penco): ______<br>• Contacto fuera de la zona (todo llaman a él): ______<br>• Quién busca a niños en escuela: ______<br>• Mascota quién la toma: ______<br>• Lugar medicamentos/llaves/mochila: ______</p></div>
      <div class="help-card"><h4>🏫 Escuela / trabajo</h4><p style="font-size:11px;line-height:1.5">Pregunta el <b>plan PISE</b> de la escuela: ¿dónde retiran? ¿quién autorizado? No llames en masa (colapsa red): usa <b>SMS / WhatsApp corto</b> + contacto único. Niños no se devuelven solos a casa en alerta.</p></div>
      <div class="help-card"><h4>♿ Movilidad reducida</h4><p style="font-size:11px;line-height:1.5">Vecino de apoyo asignado, silla cerca, lista medicamentos visible en refrigerador, pulsera con datos. Ensaya traslado a pie.</p></div>
      <div class="help-card"><h4>🔁 Simulacro 10 min</h4><p style="font-size:11px;line-height:1.5">1) Suena alarma (celular). 2) Cortan gas/luz/agua. 3) Toman mochila + mascota. 4) Caminan a punto alto cronometrando. 5) Anotan en Notas de la Luna qué falló. Repite en <b>Luna 1, 4, 7, 10</b>.</p></div>
    </div>`;
  } else if(evacTab==='sismo'){
    html+= `<div class="help-grid">
      <div class="help-card" style="border-color:#ff6b6b"><h4>🏚️ Durante el sismo</h4><p style="font-size:11px;line-height:1.5"><b>Agáchate, cúbrete, afírmate</b> bajo mesa firme, lejos de ventanas/estantes. No uses ascensor ni escalera corriendo. Si cocinas, apaga fuego si alcanzas sin riesgo. En auto: detente lejos de postes, quédate dentro.</p></div>
      <div class="help-card"><h4>🌊 Después — decide evacuar</h4><p style="font-size:11px;line-height:1.5">Evacúa si: sismo largo, no te podías parar, alerta SAE/SHOA, mar extraño. <b>A pie, con mochila, sin volver por cosas.</b> Corta gas si huele. No entres a casas dañadas. Escucha radio, no rumores de WhatsApp.</p></div>
      <div class="help-card"><h4>📻 Vuelta a casa</h4><p style="font-size:11px;line-height:1.5">Solo cuando autoridad levanta alerta. Revisa grietas, gas, cables. Hierve agua si hubo corte. Foto daños para FIBE/municipio. Contiene a niños: rutina, juego, relato.</p></div>
      <div class="help-card"><h4>📞 Números Penco</h4><p style="font-size:11px;line-height:1.5">Armada/Capitanía Lirquén <b>137 / 41 275 1006</b> · Bomberos 132 · Carabineros 133 / 2ª Comisaría 41 214 3240 · SAMU 131 · Municipalidad 41 226 1000 · Hospital Penco-Lirquén 41 272 6300.</p></div>
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
  b.innerHTML = `<b>🌱 Tu kimün:</b> ${d.ok}/${d.total} buenas (${pct}%) · racha ${d.streak} 🔥 <span class="muted" style="font-size:11px">— Básico: 1 palabra/día · Intermedio: 1 frase/día · Avanzado: rakizuam. Todo se guarda local.</span>`;
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
    html+= `<div class="menstrual-card" style="background:linear-gradient(135deg,var(--panel),var(--card));border-color:var(--gold);text-align:center">
      <p class="muted" style="font-size:11px">☀️ PALABRA DE HOY · NIVEL BÁSICO · ${cal.fmtDate.format(new Date())} · ${MAPU_WORDS.length} palabras en total</p>
      <div style="font-size:30px;font-weight:800;color:var(--gold);margin:6px 0">${escapeHtml(w.m)}</div>
      <div style="font-size:15px;color:#e8eaf6"><b>${escapeHtml(w.e)}</b> <span class="chip" style="font-size:10px">${escapeHtml(w.t||'')}</span></div>
      <p class="muted" style="font-size:12px;margin-top:6px">“${escapeHtml(w.x)}”</p>
      <div style="display:flex;gap:6px;justify-content:center;margin-top:8px;flex-wrap:wrap">
        <button type="button" id="mapuSpeakBtn" class="btn" style="width:auto" disabled title="Audio nativo en grabación">🔇 Audio próximamente</button>
        <button type="button" id="mapuNextBtn" class="btn" style="width:auto">🎲 Otra palabra</button>
      </div></div>
      <div class="help-grid" style="margin-top:10px">`+
      rel.map(r=>`<div class="help-card"><h4>${escapeHtml(r.m)}</h4><p style="font-size:11px">${escapeHtml(r.e)}<br><span class="muted">“${escapeHtml(r.x)}”</span></p></div>`).join('')+`</div>
      <div class="help-grid" style="margin-top:10px">
        <div class="help-card"><h4>🗣️ ¿Cómo pronunciar?</h4><p style="font-size:11px;line-height:1.6"><b>ü</b> → suena entre i y u (küla ≈ kula cerrada)<br><b>ng</b> → nasal como en <i>ngillatun</i><br><b>tr</b> → suave, no enrollada<br><b>Habla lento y con respeto</b>, mejor que perfecto. Repite 3 veces en voz alta.</p></div>
        <div class="help-card"><h4>📚 ¿Cómo avanzar?</h4><p style="font-size:11px;line-height:1.6">1) Aprende 1 palabra/día de esta pestaña.<br>2) Pasa a <b>💬 Intermedio</b> cuando reconozcas 30 sin mirar.<br>3) Pasa a <b>📜 Avanzado</b> cuando armes frases solas.<br>El quiz te dice tu nivel real.</p></div>
      </div>
      <p class="muted" style="font-size:10px;margin-top:6px">Grafemarios: <b>Azümchefe</b> (el usado aquí) · <b>Unificado</b> · <b>Raguileo</b>. Ej: <i>kimün = kimvn / kimün</i> según grafemario. Puede variar por zona — lo importante es usar con respeto y preguntar.</p>`;
  } else if(mapuTab==='numeros'){
    html+= `<div class="menstrual-card" style="border-color:#7ab8ff"><h4 style="color:#7ab8ff">🔢 Números 1–100 — las 13 lunas se cuentan así</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;margin-top:8px">`+
      MAPU_NUMS.map(([m,n])=>`<button type="button" class="btn mapu-word" data-w="${escapeHtml(m)}" style="font-size:12px"><b>${n}</b> · ${escapeHtml(m)}</button>`).join('')+`</div>
      <p class="muted" style="font-size:11px;margin-top:8px">Lógica: <b>mari küla = 10+3 = 13</b> → <b>mari küla küyen</b>. <b>epu mari = 2×10 = 20</b>, <b>küla mari = 30</b>, <b>pataka = 100</b>. Toca para escuchar.</p></div>
      <div class="help-grid" style="margin-top:10px">
        <div class="help-card"><h4>👋 Saludos lafkenche</h4><p style="font-size:11px;line-height:1.6"><b>Mari mari</b> — hola (una o varias personas)<br><b>Mari mari, lamngen</b> — hola hermano/a (respetuoso)<br><b>Chaltu may</b> — muchas gracias<br><b>Küme mañum</b> — gracias con reconocimiento<br><b>Peukayal / wüle pewaiñ</b> — nos vemos / mañana nos vemos<br><b>Pentukun</b> — vengo a saludar formalmente.</p></div>
        <div class="help-card"><h4>🗣️ Pronunciación rápida</h4><p style="font-size:11px;line-height:1.6"><b>ü</b> como u casi cerrada (küla ≈ kula)<br><b>ng</b> nasal (ngillatun)<br><b>tr</b> suave, no como español fuerte<br><b>Habla lento</b>, mejor que perfecto. En Penco, territorio lafkenche, se saluda mirando a los ojos.</p></div>
      </div>`;
  } else if(mapuTab==='intermedio'){
    html+= `<div class="menstrual-card" style="border-color:#7fd8a0"><h4 style="color:#7fd8a0">💬 Nivel Intermedio — conversa de verdad</h4>
      <p class="muted" style="font-size:11px;line-height:1.5">Ya sabes palabras sueltas. Ahora: <b>pronombres + verbos + 14 frases</b> para presentarte, ir a la feria y a la playa. (🔇 Audio nativo en grabación.)</p></div>
      <div class="help-grid" style="margin-top:10px">
        <div class="help-card"><h4>👥 Pronombres (quién)</h4><p style="font-size:11px;line-height:1.7">`+
        MAPU_PRONOMBRES.map(([m,e])=>`<b>${escapeHtml(m)}</b> = ${escapeHtml(e)}`).join('<br>')+`</p><p class="muted" style="font-size:10px">Dual (dos personas) y plural (varios) existen — el mapuzugun es preciso con cuántos somos.</p></div>
        <div class="help-card"><h4>🏃 12 verbos base (raíz + -n = yo)</h4><p style="font-size:11px;line-height:1.7">`+
        MAPU_VERBOS.map(v=>`<button type="button" class="btn mapu-word" data-w="${escapeHtml(v.m)}" style="font-size:11px;width:100%;text-align:left;margin-bottom:4px"><b>${escapeHtml(v.m)}</b> — ${escapeHtml(v.e)}<br><span class="muted">“${escapeHtml(v.x)}”</span></button>`).join('')+`</p></div>
      </div>
      <div class="menstrual-card" style="margin-top:10px;border-color:#7fd8a0"><h4 style="color:#7fd8a0">💬 14 frases para Penco</h4>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">`+
      MAPU_FRASES_M.map(f=>`<button type="button" class="btn mapu-word" data-w="${escapeHtml(f.m)}" style="width:100%;text-align:left;font-size:12px"><b>${escapeHtml(f.m)}</b><br><span style="color:#e8eaf6">${escapeHtml(f.e)}</span><br><span class="muted" style="font-size:11px">“${escapeHtml(f.x)}”</span></button>`).join('')+`</div></div>
      <div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>🎭 Mini-diálogo: en la feria de Penco</h4><p style="font-size:11px;line-height:1.7">— <b>Mari mari, lamngen, chumleymi?</b> (Hola, ¿cómo estás?)<br>— <b>Kümelekan, chaltu may. ¿Eymi kay?</b> (Bien, gracias. ¿Y tú?)<br>— <b>Kümelekan. Chem am ta küdawkeeymi?</b> (Bien. ¿En qué trabajas?)<br>— <b>Huerta meu küdawken. Wüle lafken mew amukeaiñ.</b> (Trabajo en huerta. Mañana iremos al mar.)<br>— <b>Feymew, peukayal!</b> (¡Entonces, nos vemos!)<br><span class="muted">Practícalo con alguien: uno hace cada fila.</span></p></div>`;
  } else if(mapuTab==='avanzado'){
    html+= `<div class="menstrual-card" style="border-color:#d8a0ff"><h4 style="color:#d8a0ff">📜 Nivel Avanzado — rakizuam y gramática viva</h4>
      <p class="muted" style="font-size:11px;line-height:1.5">Ya conversas. Ahora piensa en mapuzugun: <b>conjugación, negación, futuro, ad mapu y epew</b>. Este nivel no se memoriza: se mastica, se conversa con kimeltuchefe.</p></div>
      <div class="help-grid" style="margin-top:10px">
        <div class="help-card"><h4>⚙️ Conjugación presente (verbo kim- = saber)</h4><p style="font-size:11px;line-height:1.7"><b>kimn</b> = yo sé<br><b>kimnimi / kimnymi</b> = tú sabes<br><b>kimy</b> = él/ella sabe<br><b>kimiñ</b> = nosotros sabemos<br><b>kimymün</b> = ustedes saben<br><b>kimyngün</b> = ellos saben<br><span class="muted">Raíz + terminación. Prueba con amu-, müle-, ayü-.</span></p></div>
        <div class="help-card"><h4>🔮 Futuro + negación + pregunta</h4><p style="font-size:11px;line-height:1.7"><b>Futuro -a-:</b> amu- → <b>amuan</b> = iré · <b>amukeaiñ</b> = iremos<br><b>Negación la / no-:</b> <b>kimlan</b> = no sé · <b>kimkelay</b> = no sabe/no conoce<br><b>Pregunta -mi / -kam:</b> <b>chumleymi?</b> = ¿cómo estás? · <b>amuaimi?</b> = ¿irás?<br><b>Posesivo ñi:</b> <b>lafken ñi newen</b> = la fuerza del mar.</p></div>
      </div>
      <div class="menstrual-card" style="margin-top:10px;border-color:#d8a0ff"><h4 style="color:#d8a0ff">🧠 8 frases rakizuam</h4>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">`+
      MAPU_FRASES_A.map(f=>`<button type="button" class="btn mapu-word" data-w="${escapeHtml(f.m)}" style="width:100%;text-align:left;font-size:12px"><b>${escapeHtml(f.m)}</b><br><span style="color:#e8eaf6">${escapeHtml(f.e)}</span><br><span class="muted" style="font-size:11px">“${escapeHtml(f.x)}”</span></button>`).join('')+`</div></div>
      <div class="help-grid" style="margin-top:10px">
        <div class="help-card"><h4>📖 Epew corto: Ngürü ka Küyen</h4><p style="font-size:11px;line-height:1.7">Epew pin: ngürü amuy lafken meu.<br><span class="muted">Cuenta el cuento: el zorro fue al mar.</span><br>Küyen wallme mew, ko küme azküy.<br><span class="muted">En la luna llena, el agua se ve hermosa.</span><br>Ngürü rakizuamy: “kimün mapu mew müley”.<br><span class="muted">El zorro pensó: “el saber está en la tierra”.</span><br><b>Moraleja lafkenche:</b> mirar antes de tomar.</p></div>
        <div class="help-card" style="border-color:var(--gold)"><h4>🤝 Ad mapu — cómo usar sin dañar</h4><p style="font-size:11px;line-height:1.6">1) <b>Pide permiso:</b> “Kimkelay, ayün kimam” antes de usar lengua ceremonial.<br>2) <b>Ngillatun y canelo</b> no son adorno: solo con guía y comunidad.<br>3) <b>No mezcles</b> sagrado con broma o comercio.<br>4) <b>Devuelve:</b> enseña a un pichike lo que aprendas.<br>5) En Penco, reconoce: estás en <b>territorio lafkenche</b>.</p></div>
      </div>
      <div class="menstrual-card" style="margin-top:10px;background:var(--panel)"><h4>🔤 Grafemarios (por qué ves 3 escrituras)</h4><p class="muted" style="font-size:11px;line-height:1.6">El mapuzugun fue oral por siglos. Hoy hay 3 formas de escribirlo: <b>Azümchefe</b> (ü, ng — usado aquí, escolar), <b>Unificado</b> (ü, ng, tr — académico) y <b>Raguileo</b> (v, q, x — propio mapuche, sin letras españolas). Ej: <i>tierra = mapu (los tres)</i> · <i>saber = kimün / kimvn / kimvn</i>. Si ves otra escritura, no está mal: es otro grafemario.</p></div>`;
  } else if(mapuTab==='lunas'){
    try{
      html+= `<div class="menstrual-card" style="border-color:#a9d18e"><h4 style="color:#a9d18e">🌙 Las 13 lunas en kimün</h4>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">`+
      MOONS.map(m=>`<button type="button" class="btn mapu-word" data-w="${escapeHtml(m.nombre)}" style="width:100%;text-align:left;font-size:12px"><b>Luna ${m.n}</b> · ${escapeHtml(m.nombre)}<br><span class="muted" style="font-size:11px">${escapeHtml(m.traduccion)}</span></button>`).join('')+`</div></div>`;
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
    const lvBtn=(v,l)=>`<button type="button" class="btn mapu-lv${mapuQuizLevel===v?' btn-accent':''}" data-lv="${v}" style="width:auto;font-size:11px">${l}</button>`;
    html+= `<div class="menstrual-card" style="border-color:#d8a0ff;text-align:center"><h4 style="color:#d8a0ff">🧩 Quiz por niveles</h4>
      <div style="display:flex;gap:6px;justify-content:center;margin:8px 0;flex-wrap:wrap">${lvBtn('todo','🌎 Todo')}${lvBtn('basico','☀️ Básico')}${lvBtn('intermedio','💬 Intermedio')}${lvBtn('avanzado','📜 Avanzado')}</div>
      <div style="font-size:26px;font-weight:800;color:var(--gold);margin:8px 0">“${escapeHtml(q.w.m)}”</div>
      <div style="display:grid;gap:6px;margin-top:8px">`+
      q.opts.map(o=>`<button type="button" class="btn mapu-opt" data-o="${escapeHtml(o)}" style="width:100%">${escapeHtml(o)}</button>`).join('')+`</div>
      <div id="mapuQuizFb" style="margin-top:8px;font-size:13px;min-height:20px"></div>
      <p class="muted" style="font-size:11px;margin-top:6px">Aciertos ${d.ok}/${d.total} · racha ${d.streak} · nivel quiz: <b>${escapeHtml(mapuQuizLevel)}</b> · pool: ${mapuQuizPool().length} palabras/frases</p></div>`;
  }
  box.innerHTML = html + `<p class="muted" style="font-size:10px;margin-top:8px">🔇 Audio desactivado temporalmente — estamos grabando audio nativo. El quiz y el vocabulario funcionan sin sonido.</p>`;
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
  const del = mine? `<button type="button" class="btn btn-icon lawen-del" data-i="${idx}" title="Borrar mi ficha" style="width:26px;height:26px;font-size:11px;flex:none">✕</button>` : '';
  const mineChip = mine? `<span class="chip" style="font-size:10px;background:#a9d18e22;color:#a9d18e;border-color:#a9d18e55;white-space:nowrap">🌱 mía</span>` : '';
  return `<div class="si-card" style="margin:0;padding:10px 12px;${mine?'border-style:dashed;':''}">`
    + `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:22px;line-height:1;flex:none">${p.i||'🌱'}</span><b style="font-size:14px">${escapeHtml(p.n)}</b>${mineChip}<span style="flex:1"></span><span class="chip" style="font-size:10px;white-space:nowrap">🌙 ${escapeHtml(p.luna||'Cualquiera')}</span>${del}</div>`
    + `<div style="display:grid;grid-template-columns:74px 1fr;gap:4px 8px;font-size:11px;line-height:1.5">`
    + `<span style="color:var(--gold);font-weight:700">USO</span><span>${escapeHtml(p.uso||'—')}</span>`
    + (p.prep? `<span style="color:var(--gold);font-weight:700">PREPARA</span><span>🫖 ${escapeHtml(p.prep)}</span>`:'')
    + (p.rec? `<span style="color:#9aa3c7;font-weight:700">RECOLECTA</span><span>📅 ${escapeHtml(p.rec)}</span>`:'')
    + `</div>`
    + (p.cui? `<div style="margin-top:6px;background:#e76e8a12;border:1px solid #e76e8a44;border-radius:6px;padding:5px 8px;font-size:11px;line-height:1.5;color:#ff9a9a">⚠️ ${escapeHtml(p.cui)}</div>`:'')
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
  let html=`<p class="muted" style="font-size:11px;margin-bottom:8px">🌿 ${LAWEN_PLANTS.length} fichas base${mine.length?` + <b>${mine.length} mías</b>`:''} · mostrando <b>${total}</b></p>`;
  if(total){
    html+=`<div style="display:flex;flex-direction:column;gap:10px">`+base.map(p=>lawenCardHTML(p,false,-1)).join('');
    if(own.length) html+=`<div style="display:flex;align-items:center;gap:8px;margin-top:2px"><span style="flex:1;height:1px;background:var(--line)"></span><span class="muted" style="font-size:11px">🌱 Mis fichas (${own.length})</span><span style="flex:1;height:1px;background:var(--line)"></span></div>`+own.map(({p,i})=>lawenCardHTML(p,true,i)).join('');
    html+=`</div>`;
  } else {
    html+=`<div class="menstrual-card" style="text-align:center"><p style="font-size:12px">Sin resultados para “${escapeHtml(q)}”.</p><p class="muted" style="font-size:11px">Prueba “tos”, “herida”, “digestión” — o agrégala como ficha propia:</p><button type="button" id="lawenEmptyAdd" class="btn btn-accent" style="width:auto;margin-top:6px">➕ Agregar “${escapeHtml(q.slice(0,30))}” como mi lawen</button></div>`;
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

// === COMPOST & SUELO — PILA + LUNA ===
let compostTab='pila';
function getCompostData(){ try{ const u=userData(); if(!u.compost) u.compost={type:'pila',start:'',turns:[],note:''}; if(!Array.isArray(u.compost.turns)) u.compost.turns=[]; return u.compost; }catch{ return {type:'pila',start:'',turns:[],note:''}; } }
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
function renderCompostStatus(){
  const b=$('compostStatusBox'); if(!b) return;
  const c=getCompostData();
  const n=c.turns.length;
  const last=c.turns.slice().sort().pop()||'—';
  const tipo=c.type==='vermi'?'🪱 Vermicompostera':c.type==='bocashi'?'♻️ Bocashi':'🪱 Pila caliente';
  b.innerHTML=`<b>${tipo}</b> · inicio ${escapeHtml(c.start||'—')} · volteos <b>${n}</b> · último ${escapeHtml(last)} <span class="muted" style="font-size:11px">— voltea en menguante, se guarda local</span>`;
}
function renderCompostPanel(tab){
  compostTab=tab||compostTab;
  const ids={pila:'tabCP1',suelo:'tabCP2',luna:'tabCP3'};
  Object.entries(ids).forEach(([k,id])=>{ const el=$(id); if(el) el.classList.toggle('btn-accent', k===compostTab); });
  renderCompostStatus();
  const box=$('compostPanel'); if(!box) return;
  let html='';
  if(compostTab==='pila'){
    const c=getCompostData();
    html+=`<div class="menstrual-card" style="border-color:var(--gold)"><h4 style="color:var(--gold)">🪱 Mi pila — registro</h4>
      <div class="conv-row"><label>Tipo <select id="cpType"><option value="pila" ${c.type==='pila'?'selected':''}>Pila caliente</option><option value="vermi" ${c.type==='vermi'?'selected':''}>Vermicompostera</option><option value="bocashi" ${c.type==='bocashi'?'selected':''}>Bocashi</option></select></label>
      <label>Inicio <input type="date" id="cpStart" value="${escapeHtml(c.start||'')}"></label>
      <button type="button" id="cpToday" class="btn" style="width:auto;align-self:flex-end">◉ Hoy volteé</button></div>
      <label>Nota <input type="text" id="cpNote" placeholder="olor, humedad, temperatura, qué agregué" maxlength="80" value="${escapeHtml(c.note||'')}"></label>
      <div id="cpTurns" class="habits-list" style="margin-top:8px;max-height:160px">`+
      (c.turns.slice().sort().reverse().map(t=>`<div class="hora-item"><span>🪱 ${escapeHtml(t)}</span><button type="button" class="btn btn-icon cp-del" data-t="${escapeHtml(t)}">✕</button></div>`).join('')||'<p class="muted" style="font-size:11px">Sin volteos aún. Marca “Hoy volteé”.</p>')+`</div></div>
      <div class="help-grid" style="margin-top:10px">
        <div class="help-card"><h4>🟤 Receta base Penco</h4><p style="font-size:11px">3 secos (hojas, cartón, paja) x 1 verde (restos cocina, pasto). Puño húmedo, no chorreo. Tapa con nylon en Pukem.</p></div>
        <div class="help-card"><h4>🚫 No va</h4><p style="font-size:11px">Carne, lácteos, aceite, fecas perro/gato, ceniza con carbón pintado, maleza con semilla.</p></div>
      </div>`;
  } else if(compostTab==='suelo'){
    html+=`<div class="help-grid">
      <div class="help-card"><h4>🧪 Suelo Penco arcilloso</h4><p style="font-size:11px;line-height:1.5">Prueba puño: bola que no se desarma = arcilla. Mejora con <b>compost 3-5 cm + mulch hojas</b>, nunca arena sola (hace ladrillo). pH típico 5,5-6,5: cal agrícola solo si mediste ácido.</p></div>
      <div class="help-card"><h4>🪱 Vermi vs Pila vs Bocashi</h4><p style="font-size:11px;line-height:1.5"><b>Vermi:</b> ideal depto, lombriz roja, cosecha 3 meses.<br><b>Pila:</b> patio, volteo menguante, 2-3 meses.<br><b>Bocashi:</b> fermentado 14 días, ver 🌱→🧪 receta.</p></div>
      <div class="help-card"><h4>💧 Riego arcilla</h4><p style="font-size:11px">Riego profundo y espaciado, no diario superficial. Mulch 5 cm guarda humedad Walüng.</p></div>
      <div class="help-card"><h4>🌱 Conexión Siembra</h4><p style="font-size:11px">Aplica compost maduro (olor tierra, no se reconoce) 7 días antes de siembra. Ver 🌱 Siembra lunar.</p></div>
    </div>`;
  } else if(compostTab==='luna'){
    const ms=compostNextMenguantes();
    html+=`<div class="menstrual-card" style="border-color:#a9d18e"><h4 style="color:#a9d18e">📅 Voltea en menguante — próximos</h4>`+
    (ms.length? `<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">`+ms.map(o=>`<div class="hora-item"><span>🌓 ${escapeHtml(o.key)} · ${escapeHtml((o.e.tipo||'menguante').replace(/-/g,' '))} ${o.e.simbolo||''}</span><button type="button" class="btn cp-go" data-k="${escapeHtml(o.key)}" style="width:auto;font-size:11px">Marcar volteo</button></div>`).join('')+`</div>`
    : '<p class="muted" style="font-size:11px">Cambia de luna en el calendario para cargar fases.</p>')+
    `<p class="muted" style="font-size:11px;margin-top:6px">Menguante = energía a raíces + menos moscas. Airea, ajusta humedad y agrega seco.</p></div>`;
  }
  box.innerHTML=html;
  if(compostTab==='pila'){
    const c=getCompostData();
    const t=$('cpType'), s=$('cpStart'), n=$('cpNote');
    if(t) t.onchange=()=>{ c.type=t.value; scheduleSave(); renderCompostStatus(); };
    if(s) s.onchange=()=>{ c.start=s.value; scheduleSave(); renderCompostStatus(); };
    if(n) n.oninput=()=>{ c.note=n.value.slice(0,80); scheduleSave(); };
    const b=$('cpToday'); if(b) b.onclick=()=>{ const k=cal.fmtKey.format(new Date()); if(!c.turns.includes(k)) c.turns.push(k); scheduleSave('Guardado ✓'); renderCompostPanel('pila'); };
    box.querySelectorAll('.cp-del').forEach(x=> x.onclick=()=>{ const cc=getCompostData(); cc.turns=cc.turns.filter(t=>t!==x.dataset.t); scheduleSave(); renderCompostPanel('pila'); });
  }
  if(compostTab==='luna'){
    box.querySelectorAll('.cp-go').forEach(b=> b.onclick=()=>{ const c=getCompostData(); if(!c.turns.includes(b.dataset.k)) c.turns.push(b.dataset.k); scheduleSave('Guardado ✓'); renderCompostPanel('luna'); });
  }
}
function setupCompostDialog(){
  const btn=$('btnCompost'); if(btn) btn.onclick=()=>{ renderCompostPanel('pila'); $('compostDialog').showModal(); };
  const ct=$('compostCloseTop'), cb=$('compostClose'); if(ct) ct.onclick=()=>$('compostDialog').close(); if(cb) cb.onclick=()=>$('compostDialog').close();
  ['tabCP1','tabCP2','tabCP3'].forEach(id=>{ const el=$(id); if(!el) return; el.onclick=()=>{ const map={tabCP1:'pila',tabCP2:'suelo',tabCP3:'luna'}; renderCompostPanel(map[id]); }; });
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
  box.innerHTML = list.length? `<div style="display:flex;flex-direction:column;gap:6px">`+list.map(p=>`<div class="hora-item" style="justify-content:flex-start;gap:8px"><span class="chip" style="font-size:10px;background:${col[p.d]}22;color:${col[p.d]};border-color:${col[p.d]}55;white-space:nowrap">${escapeHtml(p.d)}</span><span style="font-size:12px"><b>${escapeHtml(p.n)}</b> — ${escapeHtml(p.e)}</span></div>`).join('')+`</div>` : '<p class="muted" style="text-align:center">Sin resultados. Prueba “botella”, “pila”, “aceite”.</p>';
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
  box.innerHTML = `<div class="help-grid">`+tips.map(t=>`<div class="help-card"><h4>${t[0]}</h4><p style="font-size:11px">${t[1]}</p></div>`).join('')+`</div>`+
    (nivel? `<p class="muted" style="font-size:11px;margin-top:6px">PM2.5 ahora ≈ <b>${Math.round(pm25)} µg/m³ (${nivel})</b> — referencia OMS diaria 15. Si está Regular/Malo, baja la estufa y ventila corto.</p>` : `<p class="muted" style="font-size:11px;margin-top:6px">Sin dato en vivo (offline). Usa la guía: si ves humo estancado sobre la bahía, aplica modo invierno.</p>`);
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
    if(box) box.innerHTML=`<b>🌬️ Penco ahora:</b> PM2.5 ≈ <b>${pm25==null?'—':Math.round(pm25)+' µg/m³'}</b> · AQI US ${j.hourly.us_aqi[idx]??'—'} <span class="muted" style="font-size:11px">(Open-Meteo, modelo, no estación oficial — contrasta con SINCA sinca.mma.gob.cl)</span>`;
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
  let ahora='';
  try{
    const tres=(typeof getSiembraTresLunas==='function')? getSiembraTresLunas() : [currentView.luna||1];
    ahora=tres.map(n=>{ try{ const s=SIEMBRA_LUNAS[n]; return `Luna ${n}: ${s.directa.split('.')[0].slice(0,80)}…`; }catch{ return 'Luna '+n; } }).map(escapeHtml).join('<br>');
  }catch{}
  box.innerHTML = `<div class="menstrual-card" style="border-color:var(--gold);background:linear-gradient(135deg,var(--panel),var(--card))">
    <h4 style="color:var(--gold)">🌰 Mis semillas — recuento (${a.length} variedades · ${totalSobres} sobres/semillas)</h4>
    <p class="muted" style="font-size:11px">Tu stock personal, <b>local por usuario</b>. Descuenta al sembrar (−) y suma al cosechar/cosechar semilla (+). Úsalo con la guía de arriba.</p>
    ${ahora? `<p style="font-size:11px;margin-top:6px"><b>Siembra ahora:</b><br><span class="muted">${ahora}</span></p>`:''}
    <div class="conv-row" style="margin-top:8px">
      <label style="flex:2">Variedad <input type="text" id="semInvName" placeholder="ej: Tomate rosado, Poroto manteca" maxlength="40"></label>
      <label>Cant. <input type="number" id="semInvQty" min="0" value="1" style="width:80px"></label>
      <label>Detalle <input type="text" id="semInvNote" placeholder="ej: sobres, gr, 2026" maxlength="30"></label>
    </div>
    <div class="dlg-actions" style="justify-content:flex-start"><button type="button" id="semInvAdd" class="btn btn-accent" style="width:auto">+ Agregar</button></div>
    <div id="semInvList" class="habits-list" style="margin-top:8px;max-height:240px"></div>
    <div class="dlg-actions" style="justify-content:space-between;align-items:center;margin-top:6px">
      <span id="semInvStats" class="muted" style="font-size:11px"></span>
      <span style="display:flex;gap:8px"><button type="button" id="semInvShare" class="btn" style="width:auto">📤 Compartir</button><button type="button" id="semInvClear" class="btn" style="width:auto;color:#e76e8a;border-color:#e76e8a55">🗑 Vaciar</button></span>
    </div></div>`;
  const list=$('semInvList');
  const paint=()=>{
    const arr=getSemillasInvData();
    list.innerHTML = arr.length? arr.map((e,i)=>
      `<div class="hora-item"><span style="font-size:12px"><b>${escapeHtml(e.name)}</b> <span class="chip" style="font-size:10px">${escapeHtml(String(e.qty))} ${escapeHtml(e.note||'')}</span></span><span class="hora-actions"><button type="button" class="btn btn-icon sem-dec" data-i="${i}" title="Sembré 1 (−)">−</button><button type="button" class="btn btn-icon sem-inc" data-i="${i}" title="Sumar 1 (+)">+</button><button type="button" class="btn btn-icon sem-del" data-i="${i}" title="Borrar">✕</button></span></div>`).join('')
      : '<p class="muted" style="font-size:11px;text-align:center">Vacío. Agrega tu primer sobre arriba.</p>';
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
    const note=sanitizeText(($('semInvNote').value||'').trim(),30);
    const arr=getSemillasInvData();
    const found=arr.find(x=> x.name.toLowerCase()===name.toLowerCase());
    if(found){ found.qty=(parseInt(found.qty)||0)+qty; if(note) found.note=note; }
    else arr.push({name, qty, note});
    setSemillasInvData(arr); scheduleSave('Guardado ✓');
    $('semInvName').value=''; $('semInvQty').value='1'; $('semInvNote').value=''; paint();
  };
  const sh=$('semInvShare'); if(sh) sh.onclick=async()=>{ const arr=getSemillasInvData(); const t=arr.length? '🌰 Mis semillas\n'+arr.map(e=>`• ${e.name}: ${e.qty}${e.note?' '+e.note:''}`).join('\n') : 'Mis semillas — sin stock aún'; await shareText('Mis semillas', t, null); };
  const cl=$('semInvClear'); if(cl) cl.onclick=()=>{ if(!confirm('¿Vaciar todo el inventario?')) return; setSemillasInvData([]); scheduleSave(); paint(); };
}

// === GRATITUD DIARIA ===
function getGratitudData(){ try{ const u=userData(); if(!u.gratitud) u.gratitud={entries:{}}; if(!u.gratitud.entries) u.gratitud.entries={}; return u.gratitud; }catch{ return {entries:{}}; } }
function gratitudStreak(){
  const e=getGratitudData().entries; let s=0; const d=new Date();
  for(let i=0;i<365;i++){ const k=cal.fmtKey.format(d); const g=e[k]; if(g&&(g.t1||g.t2||g.t3)){ s++; d.setDate(d.getDate()-1); } else if(i===0){ d.setDate(d.getDate()-1); continue; } else break; }
  return s;
}
function renderGratitudBox(){
  const b=$('gratitudStreakBox'); if(!b) return;
  const e=getGratitudData().entries; const n=Object.keys(e).filter(k=>{ const g=e[k]; return g&&(g.t1||g.t2||g.t3); }).length;
  b.innerHTML=`<b>✨ Racha:</b> ${gratitudStreak()} días seguidos · <b>${n}</b> días con gratitud <span class="muted" style="font-size:11px">— 28 días = 1 luna completa</span>`;
}
function renderGratHistory(){
  const box=$('gratHistory'); if(!box) return;
  const e=getGratitudData().entries;
  const keys=Object.keys(e).sort().reverse().slice(0,14);
  box.innerHTML = keys.length? keys.map(k=>{ const g=e[k]; return `<div class="hora-item" style="align-items:flex-start"><span style="font-size:11px"><b>${escapeHtml(k)}</b><br>· ${escapeHtml(g.t1||'—')}<br>· ${escapeHtml(g.t2||'—')}<br>· ${escapeHtml(g.t3||'—')}</span><button type="button" class="btn btn-icon grat-del" data-k="${escapeHtml(k)}">✕</button></div>`; }).join('')
    : '<p class="muted" style="font-size:11px;text-align:center">Sin registros. Escribe tus 3 de hoy.</p>';
  box.querySelectorAll('.grat-del').forEach(x=> x.onclick=()=>{ const gd=getGratitudData(); delete gd.entries[x.dataset.k]; scheduleSave(); renderGratitudBox(); renderGratHistory(); if(currentView.tipo==='luna') renderLuna(); });
}
function setupGratitudDialog(){
  const btn=$('btnGratitud'); if(btn) btn.onclick=()=>{
    const t=cal.fmtKey.format(new Date()); const d=$('gratDate'); if(d && !d.value) d.value=t;
    const g=getGratitudData().entries[d.value||t]||{};
    if($('grat1')) $('grat1').value=g.t1||''; if($('grat2')) $('grat2').value=g.t2||''; if($('grat3')) $('grat3').value=g.t3||'';
    renderGratitudBox(); renderGratHistory(); $('gratitudDialog').showModal();
  };
  const ct=$('gratitudCloseTop'), cb=$('gratitudClose'); if(ct) ct.onclick=()=>$('gratitudDialog').close(); if(cb) cb.onclick=()=>$('gratitudDialog').close();
  const dt=$('gratDate'); if(dt) dt.onchange=()=>{ const g=getGratitudData().entries[dt.value]||{}; if($('grat1')) $('grat1').value=g.t1||''; if($('grat2')) $('grat2').value=g.t2||''; if($('grat3')) $('grat3').value=g.t3||''; };
  const today=$('gratToday'); if(today) today.onclick=()=>{ const t=cal.fmtKey.format(new Date()); $('gratDate').value=t; $('gratDate').onchange(); };
  const sv=$('gratSave'); if(sv) sv.onclick=()=>{
    const k=$('gratDate').value||cal.fmtKey.format(new Date());
    const gd=getGratitudData();
    gd.entries[k]={ t1:sanitizeText($('grat1').value.trim(),120), t2:sanitizeText($('grat2').value.trim(),120), t3:sanitizeText($('grat3').value.trim(),120) };
    scheduleSave('Guardado ✓'); renderGratitudBox(); renderGratHistory(); if(currentView.tipo==='luna') renderLuna();
  };
}
setTimeout(setupGratitudDialog, 893);

// === LEÑA & PELLET ===
function setupLenaDialog(){
  const btn=$('btnLena'); if(btn) btn.onclick=()=>{ $('lenaDialog').showModal(); if(!$('lenaResult').innerHTML) renderLenaEmpty(); };
  const ct=$('lenaCloseTop'), cb=$('lenaClose'); if(ct) ct.onclick=()=>$('lenaDialog').close(); if(cb) cb.onclick=()=>$('lenaDialog').close();
  const c=$('lenaCalc'); if(c) c.onclick=renderLenaCalc;
}
function renderLenaEmpty(){ const b=$('lenaResult'); if(b) b.innerHTML='<span class="muted" style="font-size:11px">Ingresa cantidad y precio para comparar. Ej: 1 m³ eucalipto ≈ 450 kg seco.</span>'; }
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
  const warn=tipo==='humeda'? `<br><span style="color:#ff9a9a">⚠️ Húmeda rinde ~40% menos y satura el aire (ver 🌬️ Aire). Seca 6+ meses bajo techo.</span>` : tipo==='parafina'? `<br><span class="muted" style="font-size:11px">Ventila siempre con parafina, nunca durmiendo.</span>` : '';
  box.innerHTML=`<b>${escapeHtml(NOM[tipo])}</b> ${cant} ${escapeHtml(uni)} ≈ <b>${Math.round(kwh)} kWh</b>${perKwh}${dias}${warn}<br><span class="muted" style="font-size:11px">Ref: 1 m³ estéreo ≈ 450 kg seco · pellet 15 kg ≈ 72 kWh · compara $/kWh antes de comprar.</span>`;
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
    nowBox.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:15px"><b>${p.icon} ${p.label}</b> · ${p.desc}</span><span class="chip">${timeStr} · Penco</span></div><p class="muted" style="margin-top:6px">${p.tip} — Hora local America/Santiago.</p>`;
  }
  const grid=$('circadianPhases');
  if(grid){
    grid.innerHTML=CIRCADIAN_PHASES.map((p,i)=>`<div class="circadian-phase ${i===idx?'active':''}"><b>${p.icon} ${p.label}</b><span>${String(p.h0).padStart(2,'0')}:00–${String(p.h1%24).padStart(2,'0')}:00</span><span>${p.desc}</span></div>`).join('');
  }
  renderCircadianChart(idx);
}
function setupCircadianDialog(){
  const btn=$('btnCircadian'); if(btn) btn.onclick=()=>{ renderCircadianDialog(); $('circadianDialog').showModal(); setTimeout(()=> renderCircadianChart(getCircadianPhase((()=>{ const d=new Date().toLocaleString('en-GB',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hour12:false}); const [hh,mm]=d.split(':').map(Number); return hh+mm/60; })())),100); };
  const ct=$('circadianCloseTop'), cb=$('circadianClose'); if(ct) ct.onclick=()=>$('circadianDialog').close(); if(cb) cb.onclick=()=>$('circadianDialog').close();
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
      todayBox.innerHTML=`<h4 style="color:var(--gold)">Hoy — ${cal.weekdayName(todayNoon)} ${cal.fmtFull.format(new Date(todayNoon))} ${isGolden?'<span class="chip" style="margin-left:6px;background:#e8c56a;color:#1a1000">¡Ahora es hora dorada!</span>':''}</h4>
        <div class="golden-table" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div style="background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px;text-align:center"><b>🌅 Salida</b><br>${formatGoldenTime(gToday.rise)}<br><span class="muted" style="font-size:11px">Dorado: ${formatGoldenTime(gToday.goldenAM[0])}–${formatGoldenTime(gToday.goldenAM[1])}</span></div>
          <div style="background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px;text-align:center"><b>🌇 Puesta</b><br>${formatGoldenTime(gToday.set)}<br><span class="muted" style="font-size:11px">Dorado: ${formatGoldenTime(gToday.goldenPM[0])}–${formatGoldenTime(gToday.goldenPM[1])}</span></div>
        </div>
        <p class="muted" style="font-size:11px;margin-top:6px">Azul mañana ${formatGoldenTime(gToday.blueAM[0])}–${formatGoldenTime(gToday.blueAM[1])} · Azul tarde ${formatGoldenTime(gToday.bluePM[0])}–${formatGoldenTime(gToday.bluePM[1])}</p>`;
    }
  }
  if(weekBox){
    let html='<h4 style="color:var(--accent)">Próximos 7 días</h4><table class="golden-table"><tr><th>Día</th><th>Salida</th><th>Dorado AM</th><th>Puesta</th><th>Dorado PM</th></tr>';
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
  box.innerHTML=ENERGY_PRESETS.map(p=> `<button type="button" class="btn" style="width:auto;font-size:11px" data-preset="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)} · ${p.watts}W</button>`).join('');
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
  box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><span style="font-size:15px"><b>⚡ Total mes</b></span><span class="chip" style="background:var(--gold);color:#10142c">${totalKwh.toFixed(1)} kWh</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">
      <div class="chip" style="text-align:center"><b>$${totalCosto.toLocaleString('es-CL')}</b><br><span class="muted" style="font-size:10px">a $${tarifa}/kWh</span></div>
      <div class="chip" style="text-align:center"><b>${totalDia.toFixed(2)} kWh/día</b><br><span class="muted" style="font-size:10px">${Math.round(totalDia*1000)} Wh/día</span></div>
      <div class="chip" style="text-align:center"><b>${(potenciaPico/1000).toFixed(2)} kW</b><br><span class="muted" style="font-size:10px">pico instalado</span></div>
    </div>
    <p class="muted" style="font-size:11px;margin-top:6px">${d.items.length} artefactos · Tarifa $${tarifa}/kWh · Luna actual: ${lunaName} · Estimación mes 30 días; ajusta tarifa con tu boleta (energía + cargos).</p>`;
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
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center;border-left:3px solid var(--gold)">
      <span><b>${escapeHtml(it.nombre)}</b> · ${it.watts}W ×${it.cantidad} · ${it.horasDia}h/día ×${it.diasMes}d<br><span class="muted" style="font-size:11px">${it.kWhMes.toFixed(2)} kWh/mes · $${costo.toLocaleString('es-CL')} · ${pctTotal}% del total</span><div style="margin-top:4px;background:var(--panel);border-radius:6px;height:6px;overflow:hidden"><div style="width:${pctTotal}%;height:100%;background:linear-gradient(90deg,#e8c56a,#e8c56a)"></div></div></span>
      <span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${it.id}" class="btn energy-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn energy-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span>
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
  box.innerHTML=`<h4 style="color:var(--accent)">💡 Consejos ahorro Penco</h4>`+ tips.map(t=> `<p class="muted" style="font-size:11px;margin:4px 0">• ${t}</p>`).join('') + `<p class="muted" style="font-size:10px;margin-top:6px">Tarifa referencial CGE 2025-26 ~$120-160/kWh según tramo y cargos. Ajusta arriba para tu boleta real.</p>`;
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
  box.innerHTML=`<h4 style="color:var(--accent)">🌙 Luna ${currentView&&currentView.tipo!=='dft'? currentView.luna:'—'} · ${escapeHtml(nombre)} — proyección 28 días</h4>
    <p class="muted" style="font-size:11px">~${kwhLuna.toFixed(1)} kWh / luna · ~$${costoLuna.toLocaleString('es-CL')} con tarifa actual. Útil para comparar lunas y fijar meta de ahorro.</p>
    <div style="margin-top:6px;background:var(--panel);border-radius:6px;height:8px;overflow:hidden"><div style="width:${Math.min(100, Math.round(kwhLuna/2))}%;height:100%;background:linear-gradient(90deg,#7ab8ff,#e8c56a)"></div></div>`;
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
      if(V===null||I===null||R===null||P===null){ resEl.innerHTML='<span style="color:#ff9a9a">Faltan datos o combinación inconsistente. Prueba con V+I, V+R, V+P, I+R, I+P o R+P.</span>'; }
      else { resEl.innerHTML=`<b style="color:var(--gold)">V=${fmt(V)} V · I=${fmt(I)} A · R=${fmt(R)} Ω · P=${fmt(P)} W</b><br><span class="muted">Comprobación: V=I·R → ${fmt(I*R)} V · P=V·I → ${fmt(V*I)} W · En 1h → ${E_kWh} kWh</span>`; }
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
    if(R<=0){ if(lRes) lRes.innerHTML='<span style="color:#ff9a9a">Vs debe ser mayor que Vf</span>'; return; }
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
    let html=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      <div class="chip" style="text-align:center;padding:10px"><b style="font-size:18px;color:var(--gold)">${nPaneles} paneles</b><br><span class="muted" style="font-size:10px">${Wp}Wp · ${potInstKW.toFixed(2)} kWp</span></div>
      <div class="chip" style="text-align:center;padding:10px"><b>${prodDia.toFixed(1)} kWh/día</b><br><span class="muted" style="font-size:10px">${prodMes.toFixed(0)} kWh/mes</span></div>
      <div class="chip" style="text-align:center;padding:10px"><b>~${area.toFixed(1)} m²</b><br><span class="muted" style="font-size:10px">${(area/1.7).toFixed(0)} paneles · 1.7m² c/u</span></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">
      <div class="chip" style="text-align:center"><b>$${costoTotal.toLocaleString('es-CL')}</b><br><span class="muted" style="font-size:10px">inversión total est.</span></div>
      <div class="chip" style="text-align:center"><b>$${Math.round(ahorroMes).toLocaleString('es-CL')}/mes</b><br><span class="muted" style="font-size:10px">ahorro (NetBilling 80-90%)</span></div>
      <div class="chip" style="text-align:center"><b>${paybackAnos} años</b><br><span class="muted" style="font-size:10px">${paybackMeses} meses ROI</span></div>
    </div>
    <p class="muted" style="font-size:11px;margin-top:8px">Potencia necesaria: <b>${(potenciaNecKW*1000).toFixed(0)} W</b> = ${kwhDia.toFixed(1)} kWh/día ÷ (${HSP}h × ${PR}) · Producción cubre <b>${Math.min(100, Math.round(prodMes/kwhMes*100))}%</b> de tu consumo · CO₂ evitado ~<b>${co2.toFixed(0)} kg/mes</b></p>`;
    if(resEl) resEl.innerHTML=html;
    if(detEl){
      detEl.classList.remove('hidden');
      detEl.innerHTML=`<h4 style="color:var(--gold)">📐 Detalle técnico Penco</h4>
        <div class="help-grid" style="margin-top:6px">
          <div class="help-card"><h4>☀️ Producción</h4><p style="font-size:11px">E_día = ${potInstKW.toFixed(2)}kWp × ${HSP}h × ${PR} = <b>${prodDia.toFixed(2)} kWh/día</b><br>E_mes = <b>${prodMes.toFixed(0)} kWh</b></p></div>
          <div class="help-card"><h4>🏠 Consumo</h4><p style="font-size:11px">${kwhMes} kWh/mes → <b>${kwhDia.toFixed(2)} kWh/día</b><br>Tipo: <b>${tipo}</b> · PR ${PR} (pérdidas ${(1-PR*100).toFixed(0)}%)</p></div>
          <div class="help-card"><h4>📦 Área y peso</h4><p style="font-size:11px">${nPaneles} × 1.7m² = <b>${area.toFixed(1)} m²</b><br>Peso ~${(nPaneles*21).toFixed(0)} kg · Viento sur: anclaje reforzado</p></div>
          <div class="help-card"><h4>💡 Costos 2026</h4><p style="font-size:11px">Paneles: $${costoPaneles.toLocaleString('es-CL')} (${nPaneles}×$${precio.toLocaleString('es-CL')})<br>Total c/inversor/estructura: <b>$${costoTotal.toLocaleString('es-CL')}</b></p></div>
        </div>
        <p class="muted" style="font-size:10px;margin-top:8px">Cálculo referencial. Para TE4 y NetBilling consulta instalador SEC. HSP anual 4.9h es promedio; invierno real 2.8-3.0h → produce menos (usa dato mensual para precisión).</p>`;
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
        batBox.innerHTML=`<h4 style="color:#7ab8ff">🔋 Banco baterías — ${tipo}</h4>
          <p style="font-size:11px;line-height:1.5">Autonomía <b>${autonomia} días</b> → ${energiaKwh.toFixed(1)} kWh almacenados<br>Capacidad necesaria: <b>${ah.toFixed(0)} Ah</b> a ${volt}V (DOD ${dod}%, eff ${eff}%)<br>→ <b>${ahRed} Ah</b> mínimo → ej: <b>${nBat100}× 100Ah ${volt}V LiFePO4</b><br><span class="muted" style="font-size:10px">LiFePO4 DOD 80-90% y 4000 ciclos; plomo-ácido DOD 50%.</span></p>`;
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
    resEl.innerHTML = `<b>${v} ${fromSel.value}</b> = <b style="color:var(--gold);font-size:18px">${Number.isInteger(r)? r : (+r.toFixed(6)).toString()} ${toSel.value}</b>`;
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
    h += '</table><p class="muted" style="font-size:11px;margin-top:6px">Tabla recortada a 5 filas. Usa el conversor arriba para cualquier par.</p>';
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
  const tabC = $('tabChrono'), tabT = $('tabCount'), pC = $('chronoPanel'), pT = $('countPanel');
  if (!tabC) return;
  tabC.onclick = () => { tabC.classList.add('btn-accent'); tabT.classList.remove('btn-accent'); pC.classList.remove('hidden'); pT.classList.add('hidden'); };
  tabT.onclick = () => { tabT.classList.add('btn-accent'); tabC.classList.remove('btn-accent'); pT.classList.remove('hidden'); pC.classList.add('hidden'); };
  $('chronoStart').onclick = () => {
    if (!chronoRunning) { chronoRunning = true; chronoStartAt = Date.now(); chronoInt = setInterval(chronoTick, 80); $('chronoStart').textContent = '⏸ Pausa'; }
    else { chronoRunning = false; chronoElapsed += Date.now() - chronoStartAt; clearInterval(chronoInt); $('chronoStart').textContent = '▶ Reanudar'; }
  };
  $('chronoLap').onclick = () => {
    const ms = chronoElapsed + (chronoRunning ? Date.now() - chronoStartAt : 0);
    const div = document.createElement('div'); div.className = 'chrono-lap'; div.textContent = `Vuelta ${$('chronoLaps').children.length+1} — ${chronoFmt(ms)}`;
    $('chronoLaps').prepend(div);
  };
  $('chronoReset').onclick = () => { clearInterval(chronoInt); chronoRunning=false; chronoElapsed=0; chronoStartAt=0; chronoTick(); $('chronoStart').textContent='▶ Iniciar'; $('chronoLaps').innerHTML=''; };
  // countdown
  let countInt=null, countRem=0, countRunning=false;
  function countFmt(s) { const h=Math.floor(s/3600), m=Math.floor(s%3600/60), sec=s%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
  function countShow() { const el=$('countDisplay'); if(el) el.textContent = countFmt(countRem); }
  function countTick() { if(countRem<=0){ clearInterval(countInt); countRunning=false; $('countStart').textContent='▶ Iniciar'; countShow(); try{ playNotifySound(); }catch{}; try{ new Notification('⏱ Temporizador', {body:'¡Tiempo cumplido!', silent:false});}catch{}; return; } countRem--; countShow(); }
  $('countStart').onclick = () => {
    if (!countRunning) {
      if (countRem<=0) { const h=+$('countH').value||0, m=+$('countM').value||0, s=+$('countS').value||0; countRem = h*3600+m*60+s; if(countRem<=0) return; }
      countRunning=true; $('countStart').textContent='⏸ Pausa'; countInt=setInterval(countTick,1000); countShow();
      try{ if(Notification&&Notification.requestPermission) Notification.requestPermission(); }catch{}
    } else { clearInterval(countInt); countRunning=false; $('countStart').textContent='▶ Reanudar'; }
  };
  $('countPause').onclick = () => { clearInterval(countInt); countRunning=false; $('countStart').textContent='▶ Reanudar'; };
  $('countReset').onclick = () => { clearInterval(countInt); countRunning=false; countRem=0; $('countStart').textContent='▶ Iniciar'; countShow(); };
  ['countH','countM','countS'].forEach(id=>{ const el=$(id); if(el) el.oninput=()=>{ if(!countRunning){ const h=+$('countH').value||0, m=+$('countM').value||0, s=+$('countS').value||0; countRem=h*3600+m*60+s; countShow(); } }; });
  countShow(); chronoTick();
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

  buildSidebar();
  if (info) {
    if (info.luna === 'dft') selectDFT(); else selectMoon(info.luna);
  } else {
    selectMoon(1);
  }
  $('cycleSel').value = String(startY);
  updateRemindBtn();
  const savedTheme = getTheme();
  applyTheme(savedTheme);
  setupThemeSelector();
  applyVisibility();
  setTimeout(checkReminders, 3000);
  setTimeout(()=>{ try{ mensCheckNotify(); }catch{} }, 4500);
  window.api.dataPath().then(p => {
    $('dataInfo').textContent = 'Tus notas se guardan en: ' + p;
  });
})();
