let DATA = {};
let CYCLE_YEARS = [];
let cycle = null;
let currentView = { tipo: 'luna', luna: 1 };
let phaseMap = {};
let saveTimer = null;

const $ = id => document.getElementById(id);

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
  if (!m.days[diaN]) m.days[diaN] = { alta: '', baja: '', clima: '', nota: '', animo: -1, foto: '' };
  if (m.days[diaN].animo === undefined) m.days[diaN].animo = -1;
  if (m.days[diaN].foto === undefined) m.days[diaN].foto = '';
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
    let birdIcons='', fishIcons='', astroIcons='', comunaIcons='';
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
      const astroToday=astroVisibleForDate(key);
      if(astroToday.length) astroIcons=astroToday.map(a=> `<span class="dc-habit" style="background:#c9a0dc22;color:#c9a0dc;border-color:#c9a0dc55" title="${escapeHtml(a.nombre)}">🔭</span>`).join('');
    }catch(e){}
    try{
      if(isComunaShowCal()){
        const comToday=getAllComunaEventsForMD(key.slice(5));
        if(comToday.length) comunaIcons=comToday.map(c=> `<span class="dc-habit" style="background:#f0d48822;color:#f0d488;border-color:#f0d48855" title="${escapeHtml(c.nombre)}">🎉</span>`).join('');
      }
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
      ${astroIcons ? `<div class="dc-habits">${astroIcons}</div>` : ''}
      ${comunaIcons ? `<div class="dc-habits">${comunaIcons}</div>` : ''}
      ${efe ? `<div class="dc-efe" title="${efe}">📅 ${efe}</div>` : ''}
      ${mood ? `<div class="dc-clima">Ánimo: ${mood.e} ${mood.n}</div>` : ''}
      ${cell.clima ? `<div class="dc-clima">${cell.clima}</div>` : ''}
      ${cell.foto ? '<div class="dc-clima">📷 con foto</div>' : ''}
      <div class="dc-note">${cell.nota ? cell.nota.split('\n')[0] : ''}</div>`;
    card.onclick = () => openDayDialog(meta.n, d.diaN);
    grid.appendChild(card);
  }

  const mn = $('monthNote');
  mn.value = cyc(currentCycleYear()).moons[String(meta.n)].monthNote || '';
  mn.oninput = () => {
    cyc(currentCycleYear()).moons[String(meta.n)].monthNote = mn.value;
    scheduleSave();
  };

  renderGallery(meta.n);
}

function renderGallery(lunaN) {
  const wrap = $('galleryWrap');
  const gal = $('gallery');
  const items = [];
  for (let dia = 1; dia <= 28; dia++) {
    const cell = dayCell(lunaN, dia);
    if (cell.foto) items.push({ dia, foto: cell.foto });
  }
  if (!items.length) { wrap.classList.add('hidden'); gal.innerHTML = ''; return; }
  wrap.classList.remove('hidden');
  gal.innerHTML = '';
  for (const it of items) {
    const div = document.createElement('div');
    div.className = 'gal-item';
    div.innerHTML = `<img src="${it.foto}" alt=""><div class="g-l">Día ${it.dia}</div>`;
    div.onclick = () => openDayDialog(lunaN, it.dia);
    gal.appendChild(div);
  }
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
  const frDft = window.frases ? window.frases[364] : null;
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
let pendingFoto = '';

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

  pendingFoto = cell.foto || '';
  updateFotoPreview();
  $('fFoto').value = '';

  $('fClima').value = cell.clima || '';
  $('fMareaAlta').value = cell.alta || '';
  $('fMareaBaja').value = cell.baja || '';
  $('fNota').value = cell.nota || '';
  // botón menstrual en dialog día
  const mensBtn = $('dlgMenstrual');
  if (mensBtn) {
    const dlgKey = cal.fmtKey.format(new Date(d.noonMs));
    const md = getMensData();
    const isStart = md.history.includes(dlgKey);
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

function updateFotoPreview() {
  const img = $('fotoPreview');
  const del = $('fotoDel');
  if (pendingFoto) {
    img.src = pendingFoto;
    img.classList.remove('hidden');
    del.classList.remove('hidden');
  } else {
    img.classList.add('hidden');
    del.classList.add('hidden');
  }
}

function resizeImage(dataUrl, maxSide) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * sc);
      c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.72));
    };
    img.src = dataUrl;
  });
}

$('dlgCancel').onclick = () => $('dayDialog').close();
$('dlgSave').onclick = () => {
  const cell = dayCell(editing.lunaN, editing.diaN);
  cell.clima = $('fClima').value.trim();
  cell.alta = $('fMareaAlta').value.trim();
  cell.baja = $('fMareaBaja').value.trim();
  cell.nota = $('fNota').value;
  cell.animo = pendingMood;
  cell.foto = pendingFoto;
  $('dayDialog').close();
  scheduleSave();
  if (currentView.tipo === 'luna') renderLuna();
};
$('fFoto').onchange = () => {
  const f = $('fFoto').files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    pendingFoto = await resizeImage(r.result, 900);
    updateFotoPreview();
  };
  r.readAsDataURL(f);
};
$('fotoDel').onclick = () => { pendingFoto = ''; updateFotoPreview(); $('fFoto').value = ''; };

$('dlgShare').onclick = async () => {
  const dataUrl = buildShareImage(editing.lunaN, editing.diaN);
  const res = await window.api.imageSave(dataUrl);
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
  x.fillStyle = '#8fc7e8'; x.font = '30px Segoe UI';
  x.fillText(`🌊 Marea alta: ${cell.alta || '—'}   Baja: ${cell.baja || '—'}`, 540, 1130);
  if (cell.nota) {
    x.fillStyle = '#cdd3ee'; x.font = '26px Segoe UI';
    wrapText(x, cell.nota.slice(0, 220), 540, 1190, 900, 34);
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

const WMO = [
  [0, 'Despejado', '☀️'], [1, 'Mayormente despejado', '🌤️'], [2, 'Parcialmente nublado', '⛅'], [3, 'Nublado', '☁️'],
  [45, 'Niebla', '🌫️'], [48, 'Niebla con escarcha', '🌫️'],
  [51, 'Lloviznas leves', '🌦️'], [53, 'Lloviznas', '🌦️'], [55, 'Lloviznas intensas', '🌧️'],
  [61, 'Lluvia leve', '🌦️'], [63, 'Lluvia', '🌧️'], [65, 'Lluvia intensa', '🌧️'],
  [71, 'Nieve leve', '🌨️'], [73, 'Nieve', '🌨️'], [75, 'Nieve intensa', '❄️'],
  [80, 'Chubascos leves', '🌦️'], [81, 'Chubascos', '🌧️'], [82, 'Chubascos fuertes', '⛈️'],
  [95, 'Tormenta', '⛈️'], [96, 'Tormenta con granizo', '⛈️'], [99, 'Tormenta severa', '⛈️']
];
function wmo(code) {
  const f = WMO.find(w => w[0] === code);
  return f ? { desc: f[1], ico: f[2] } : { desc: '—', ico: '🌡️' };
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
      '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m' +
      '&timezone=America%2FSantiago&forecast_days=7';
    const r = await fetch(url);
    const j = await r.json();
    const cur = j.current;
    const cw = wmo(cur.weather_code);
    let html = `<div class="wp-current">${cw.ico} <b>Penco ahora:</b> ${cw.desc} · ${cur.temperature_2m}°C (sensación ${cur.apparent_temperature}°C)` +
      ` · 💨 ${cur.wind_speed_10m} km/h ${dirName(cur.wind_direction_10m)} · 💧 ${cur.precipitation} mm</div><div class="wp-days">`;
    j.daily.time.forEach((t, i) => {
      const dw = wmo(j.daily.weather_code[i]);
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
      const hw = wmo(j.hourly.weather_code[k]);
      const pp = j.hourly.precipitation_probability[k];
      html += `<div class="wp-hour${k === idx ? ' now' : ''}" title="${hw.desc} · viento ${j.hourly.wind_speed_10m[k]} km/h">` +
        `<div class="hh">${t.slice(11, 13)}h</div><div class="hi">${hw.ico}</div>` +
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
  const tres = getSiembraTresLunas();
  const nowKey = cal.fmtKey.format(new Date());
  let html = '<h4 style="color:var(--gold)">🌙 Próximas 3 lunas — vista rápida</h4><p class="muted" style="font-size:11px">Actual + siguientes 2 · Toca para ir a esa luna</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">';
  tres.forEach((n,i)=>{
    const s = SIEMBRA_LUNAS[n]; const meta = MOONS[n-1];
    const isCur = i===0;
    const plaga = n<=3?'Babosas/hongos': n<=6?'Pulgones/mosca': n<=9?'Mosca blanca/gusano':'Hongos frío';
    html+= `<div class="si-card" style="cursor:pointer;${isCur?'border-color:var(--gold);background:var(--card-hover)':''}" data-luna3="${n}"><h4 style="font-size:12px">${isCur?'▶ ':''}Luna ${n} · ${escapeHtml(meta.nombre)} ${isCur?'<span class="chip" style="font-size:9px">actual</span>':''}</h4><p style="font-size:10px;color:var(--muted)">${escapeHtml(s.epoca)}</p><p style="font-size:11px"><b style="color:#8fd694">🌱 ${escapeHtml(s.directa.slice(0,42))}…</b></p><p style="font-size:10px"><b>🌾 Cosecha:</b> ${escapeHtml(s.cosecha.slice(0,48))}…</p><p style="font-size:10px;color:#ff9a9a"><b>🐛 ${escapeHtml(plaga)}</b></p></div>`;
  });
  html+='</div>';
  box.innerHTML = html;
  box.querySelectorAll('[data-luna3]').forEach(el=> el.onclick=()=>{ selectMoon(+el.dataset.luna3); renderSiembraTresBox(); renderSiembraContent(siembraTab); });
}
function renderSiembraContent(tab){
  siembraTab = tab||siembraTab;
  const box = $('siembraContent'); const hBox=$('siembraHarvestBox');
  if(!box) return;
  // tabs ui
  const tS=$('tabSiembra'), tC=$('tabCosecha');
  if(tS&&tC){ tS.classList.toggle('btn-accent', siembraTab==='siembra'); tC.classList.toggle('btn-accent', siembraTab==='cosecha'); }
  if(siembraTab==='cosecha'){
    box.innerHTML = '';
    if(hBox){
      let html='<p class="muted" style="font-size:11px;margin-bottom:8px">Cosecha y plagas por luna — vista completa 3 lunas + todo el ciclo</p>';
      const tres=getSiembraTresLunas();
      html+='<div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:12px">';
      tres.forEach(n=>{
        const s=SIEMBRA_LUNAS[n]; const meta=MOONS[n-1];
        html+=`<div class="si-card" style="border-color:var(--gold)"><h4>🌾 Luna ${n} · ${escapeHtml(meta.nombre)} <span class="chip" style="font-size:10px">${n===tres[0]?'actual': n===tres[1]?'próxima':'siguiente'}</span></h4><p style="font-size:11px;color:var(--muted)">${escapeHtml(s.epoca)}</p><p style="font-size:12px"><b>🌾 Cosecha:</b> ${escapeHtml(s.cosecha)}</p><p style="font-size:11px;color:#ff9a9a"><b>🐛 Vigila:</b> ${n<=3?'Babosas/hongos por humedad': n<=6?'Pulgones en brotes': n<=9?'Mosca blanca/gusano fruto':'Hongos por frío/humedad'}</p><p style="font-size:11px"><b>🛠️ Tarea:</b> ${escapeHtml(s.tareas)}</p></div>`;
      });
      html+='</div><hr style="border:none;border-top:1px solid var(--line);margin:10px 0"><p class="muted" style="font-size:11px">Ciclo completo (13 lunas) — referencia rápida:</p>';
      for(let n=1;n<=13;n++){
        const s=SIEMBRA_LUNAS[n];
        const isCur=tres.includes(n);
        html+=`<div class="si-card" style="${isCur?'border-color:var(--gold);background:var(--card-hover)':''}"><h4>${isCur?'▶ ':''}Luna ${n} · ${escapeHtml(MOONS[n-1].nombre)}</h4><p style="font-size:12px"><b>🌾 Cosecha:</b> ${escapeHtml(s.cosecha)}</p><p style="font-size:11px;color:#ff9a9a">🐛 ${n<=3?'Babosas/hongos': n<=6?'Pulgones': n<=9?'Mosca blanca/gusano':'Hongos frío'}</p></div>`;
      }
      hBox.innerHTML=html;
    }
    return;
  }
  // siembra tab
  if(hBox) hBox.innerHTML='';
  let html='';
  if(currentView.tipo==='luna' && SIEMBRA_LUNAS[currentView.luna]){
    const s=SIEMBRA_LUNAS[currentView.luna]; const meta=MOONS[currentView.luna-1];
    html+=`<div class="si-luna-card"><h4>🌙 Luna ${currentView.luna}: ${escapeHtml(meta.nombre)}</h4><p class="muted" style="margin-bottom:8px">${escapeHtml(s.epoca)}</p><h4 style="color:var(--gold)">${escapeHtml(s.titulo)}</h4><p class="si-sem">🌱 Siembra directa: ${escapeHtml(s.directa)}</p><p class="si-tar">🌱 Almácigos: ${escapeHtml(s.almacigos)}</p><p class="si-tar">🍅 Cosecha: ${escapeHtml(s.cosecha)}</p><p>🛠️ ${escapeHtml(s.tareas)}</p></div>`;
    html+='<p class="muted" style="font-size:11px;margin:10px 0 8px">También para las <b>2 lunas siguientes</b>:</p>';
    const tres=getSiembraTresLunas().slice(1);
    tres.forEach(n=>{
      const ss=SIEMBRA_LUNAS[n]; const mm=MOONS[n-1];
      html+=`<div class="si-card" style="opacity:0.95;cursor:pointer" data-luna="${n}"><h4>Luna ${n} · ${escapeHtml(mm.nombre)} <span style="font-weight:400;color:var(--muted);font-size:12px">· ${escapeHtml(ss.epoca)}</span></h4><p class="si-sem">🌱 ${escapeHtml(ss.directa)}</p><p style="font-size:11px">🌾 Cosecha: ${escapeHtml(ss.cosecha)}</p></div>`;
    });
  } else {
    html+='<p class="muted">Recomendaciones por luna — cada luna de Penco es distinta (actual +2 destacadas):</p>';
    const tres=getSiembraTresLunas();
    for(let n=1;n<=13;n++){
      const s=SIEMBRA_LUNAS[n]; const isTres=tres.includes(n);
      html+=`<div class="si-card" style="cursor:pointer;${isTres?'border-color:var(--gold);background:var(--card-hover)':''}" data-luna="${n}"><h4>Luna ${n} · ${escapeHtml(MOONS[n-1].nombre)} ${isTres?'<span class="chip" style="font-size:10px">próxima</span>':''} <span style="font-weight:400;color:var(--muted);font-size:12px">· ${escapeHtml(s.epoca)}</span></h4><p class="si-sem">🌱 ${escapeHtml(s.directa)}</p><p class="si-tar" style="font-size:12px">${escapeHtml(s.titulo)}</p></div>`;
    }
  }
  html+='<hr style="border:none;border-top:1px solid var(--line);margin:12px 0"><p class="muted" style="font-size:12px;margin-bottom:8px">Guía por fase lunar (general):</p>';
  html+=Object.values(SIEMBRA).map(s=>`<div class="si-card" style="opacity:0.9"><h4>${escapeHtml(s.fase)} — ${escapeHtml(s.titulo)}</h4><p style="font-size:13px">${escapeHtml(s.texto)}</p><p class="si-sem">🌱 ${escapeHtml(s.siembra)}</p><p class="si-tar">🛠️ ${escapeHtml(s.tareas)}</p></div>`).join('');
  box.innerHTML=html;
  box.querySelectorAll('.si-card[data-luna]').forEach(el=> el.onclick=()=>{ selectMoon(+el.dataset.luna); renderSiembraTresBox(); renderSiembraContent('siembra'); });
}
function openSiembra(tab){
  renderSiembraTresBox();
  renderSiembraContent(tab||'siembra');
  $('siembraDialog').showModal();
}
$('btnSiembra').onclick = () => openSiembra('siembra');
$('siembraClose').onclick = () => $('siembraDialog').close();
if ($('siembraCloseTop')) $('siembraCloseTop').onclick = () => $('siembraDialog').close();
const _tabS=$('tabSiembra'), _tabC=$('tabCosecha');
if(_tabS) _tabS.onclick=()=> renderSiembraContent('siembra');
if(_tabC) _tabC.onclick=()=> renderSiembraContent('cosecha');


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
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>${escapeHtml(it.species||'—')}</b> — ${escapeHtml(it.qty||'')} · ${escapeHtml(it.place||'')} <br><span class="muted" style="font-size:11px">${it.date} ${it.tide? '· '+escapeHtml(it.tide):''} ${lunaTxt? '· '+lunaTxt:''} ${it.weather? '· '+escapeHtml(it.weather):''}</span><br><span class="muted" style="font-size:11px">${escapeHtml(it.notes||'')}</span></span><span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${it.id}" class="btn fishlog-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn fishlog-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`;
  }).join('');
  if(stats) stats.textContent=`${data.length} salidas · ${data.filter(x=>x.qty).length} con captura`;
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
    return `<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>${escapeHtml(it.species)}</b> ×${it.count} — ${escapeHtml(it.place||'—')} · ${escapeHtml(it.activity||'')} <br><span class="muted" style="font-size:11px">${it.date} ${it.time||''} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''}</span><br><span class="muted" style="font-size:11px">${escapeHtml(it.notes||'')}</span></span><span style="display:flex;gap:6px;flex:0 0 auto"><button data-id="${it.id}" class="btn bird-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn bird-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`;
  }).join('');
  const speciesSet=new Set(data.map(x=>x.species));
  if(stats) stats.textContent=`${data.length} avistamientos · ${speciesSet.size} especies · ${data.reduce((s,x)=>s+(parseInt(x.count)||0),0)} individuos`;
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
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function lunaHTML(y, meta, opts) {
  const cc = cyc(y);
  const start = cal.weTripantuUTC(y);
  const st = ESTACIONES[meta.estacion];
  const rows = [[], [], [], []];
  for (let dia = 1; dia <= 28; dia++) {
    const ms = start + ((meta.n - 1) * 28 + dia - 1) * 86400000;
    const cell = (cc.moons[String(meta.n)].days && cc.moons[String(meta.n)].days[dia]) || { alta: '', baja: '', clima: '', nota: '' };
    const sun = cal.sunForDay(ms);
    const key = cal.fmtKey.format(new Date(ms));
    const evs = (phaseMap[key] || []);
    rows[Math.floor((dia - 1) / 7)].push(`
      <td>
        <div class="pd-head"><b>${String(dia).padStart(2, '0')}</b> ${escapeHtml(cal.fmtDate.format(new Date(ms)))}</div>
        <div class="pd-sun">☀ ${sun.rise ? escapeHtml(cal.fmtTime.format(new Date(sun.rise))) : '--'}–${sun.set ? escapeHtml(cal.fmtTime.format(new Date(sun.set))) : '--'}</div>
        <div class="pd-tide">🌊 A:${escapeHtml(cell.alta || '__')} B:${escapeHtml(cell.baja || '__')}</div>
        ${evs.map(e => `<div class="pd-ph">${e.simbolo} ${escapeHtml(e.tipo)} ${escapeHtml(cal.fmtTime.format(new Date(e.utcMs)))}</div>`).join('')}
        ${cell.nota ? `<div class="pd-note">${escapeHtml(cell.nota)}</div>` : ''}
        ${cell.clima ? `<div class="pd-cl">${escapeHtml(cell.clima)}</div>` : ''}
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
        const txt = [cell.nota, cell.clima].filter(Boolean).join(' ');
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
    if (!d.usuarios || !d.notas) throw new Error('formato');
    DATA = d;
    if (!DATA.notas[DATA.actual]) DATA.actual = DATA.usuarios[0].id;
    await window.api.saveData(JSON.stringify(DATA));
    buildSidebar();
    selectCycle(currentCycleYear(), currentView.tipo === 'dft' ? 'dft' : currentView.luna);
    $('statusMsg').textContent = 'Respaldo restaurado ✓';
  } catch {
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
      new Notification(`🌕 ${t.e.tipo.replace('-', ' ')} ${t.when}`, {
        body: `${t.e.simbolo} ${t.e.tipo.replace('-', ' ')} — ${cal.fmtTime.format(new Date(t.e.utcMs))} (hora de Chile)`
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
    try{ new Notification('🌸 Ciclo — mañana periodo', { body: `Predicción: mañana ${cal.fmtFull.format(new Date(pred.nextPeriodMs))} · ${mensLunaForKey(nextKey)? 'Luna '+mensLunaForKey(nextKey).luna:''}`}); localStorage.setItem('mens-lastNotify', todayKey);}catch{}
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
  const data=getMedicData(); if(!data.list.length){ box.innerHTML='<p class="muted">Agrega medicamentos para ver próximas tomas.</p>'; return; }
  const all=[]; data.list.forEach(med=>{ medicNextDoses(med, Date.now(), 3).forEach(t=> all.push({t, med})); });
  all.sort((a,b)=>a.t-b.t);
  const next5=all.slice(0,5);
  box.innerHTML='<h4 style="color:var(--gold)">⏰ Próximas tomas (5)</h4>'+ (next5.length? '<div class="mens-history">'+ next5.map(o=>`<div class="mens-hist-item"><span><b>${escapeHtml(o.med.name)}</b> — ${cal.weekdayName(o.t)} ${cal.fmtFull.format(new Date(o.t))} ${cal.fmtTime.format(new Date(o.t))} · ${escapeHtml(o.med.dose)}</span><span class="muted" style="font-size:10px">${o.t-Date.now()<3600000? '¡pronto!':''}</span></div>`).join('')+'</div>' : '<p class="muted">Sin tomas próximas.</p>');
}
function medicCheckNotify(){
  const data=getMedicData(); if(!data.notify||!data.list.length) return;
  if(typeof Notification==='undefined'||Notification.permission!=='granted') return;
  const now=Date.now(); const all=[]; data.list.forEach(med=> medicNextDoses(med, now-60000, 2).forEach(t=> all.push({t,med})));
  all.forEach(o=>{ const diff=o.t-now; if(diff>=-60000 && diff<=60000){ const key='medic-last-'+o.med.id+'-'+o.t; if(localStorage.getItem(key)) return; try{ new Notification('💊 Medicamento', {body:`${o.med.name} — ${o.med.dose} · ${cal.fmtTime.format(new Date(o.t))}`}); localStorage.setItem(key,'1'); if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch{} } });
}
function setupMedicDialog(){
  const btn=$('btnMedic'); if(btn) btn.onclick=()=>{ renderMedicList(); renderMedicNextBox(); const c=$('medicNotify'); if(c) c.checked=getMedicData().notify; $('medicFrom').value=cal.fmtKey.format(new Date()); $('medicDialog').showModal(); };
  const cTop=$('medicCloseTop'), cBot=$('medicClose'); if(cTop) cTop.onclick=()=>$('medicDialog').close(); if(cBot) cBot.onclick=()=>$('medicDialog').close();
  const freq=$('medicFreq'), daysRow=$('medicDaysRow'); if(freq) freq.onchange=()=>{ daysRow.style.display= freq.value==='personalizada'?'flex':'none'; };
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
  { n:"Matico", uso:"Cicatrizante, hemorragias", prep:"Infusión hojas 1 cdta/taza, lavado heridas", luna:"Llena" },
  { n:"Boldo", uso:"Digestión, hígado", prep:"1-2 hojas infusión corta, no prolongado", luna:"Menguante" },
  { n:"Manzanilla", uso:"Calmante, digestión", prep:"Flores 1 cda/taza 5 min", luna:"Nueva" },
  { n:"Menta / Mentha", uso:"Vías respiratorias, digestión", prep:"Hojas frescas infusión", luna:"Creciente" },
  { n:"Orégano", uso:"Antiséptico, respiratorio", prep:"1 cdta seca/taza", luna:"Creciente" },
  { n:"Laurel", uso:"Digestión, sahumerio", prep:"1 hoja infusión", luna:"Creciente" },
  { n:"Eucalipto", uso:"Respiratorio, vapor", prep:"Vahos 3-5 hojas", luna:"Menguante" },
  { n:"Romero", uso:"Circulación, memoria", prep:"1 ramita infusión corta", luna:"Creciente" },
  { n:"Melisa/Toronjil", uso:"Ansiedad, sueño", prep:"Hojas 1 cda/taza", luna:"Nueva" },
  { n:"Ortiga", uso:"Hierro, depurativa", prep:"Hojas secas 1 cdta/taza (cocida si fresca)", luna:"Nueva" }
];
function getNaturalData(){
  const u=userData();
  if(!u.natural) u.natural={ list:[] };
  if(!Array.isArray(u.natural.list)) u.natural.list=[];
  return u.natural;
}
function renderNaturalList(){
  const box=$('naturalList'); if(!box) return;
  box.innerHTML=NATURAL_HERBS.map(h=>`<div class="habit-item" style="cursor:pointer" data-n="${escapeHtml(h.n)}"><div style="display:flex;justify-content:space-between;align-items:center"><b>${escapeHtml(h.n)}</b><span class="chip" style="font-size:10px">${h.luna}</span></div><div class="muted" style="font-size:11px">${escapeHtml(h.uso)} — ${escapeHtml(h.prep)}</div></div>`).join('');
  box.querySelectorAll('[data-n]').forEach(el=> el.onclick=()=>{
    const h=NATURAL_HERBS.find(x=>x.n===el.dataset.n);
    if(!h) return;
    $('naturalName').value=h.n; $('naturalUse').value=h.uso + ' — ' + h.prep;
  });
}
function renderNaturalUserList(){
  const box=$('naturalUserList'); if(!box) return;
  const d=getNaturalData();
  if(!d.list.length){ box.innerHTML='<p class="muted">Tu botiquín personal está vacío. Toca una sugerida o agrega la tuya.</p>'; return; }
  box.innerHTML=d.list.map(x=>`<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b>${escapeHtml(x.n)}</b> — <span class="muted" style="font-size:11px">${escapeHtml(x.uso)}</span></span><button data-id="${x.id}" class="btn btn-icon natural-del" style="padding:4px 8px">✕</button></div>`).join('');
  box.querySelectorAll('.natural-del').forEach(b=> b.onclick=()=>{
    const d2=getNaturalData(); d2.list=d2.list.filter(x=>x.id!==b.dataset.id); scheduleSave(); renderNaturalUserList();
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

function loadMealDate(k){
  const e=getMealData().entries[k]||{ breakfast:'', lunch:'', dinner:'', snack:'', notes:'' };
  $('mealBreakfast').value=e.breakfast||''; $('mealLunch').value=e.lunch||''; $('mealDinner').value=e.dinner||''; $('mealSnack').value=e.snack||''; $('mealNotes').value=e.notes||'';
  setTimeout(()=>{ try{ renderMealNutritionBox(); renderMealSuggestionsBox(); }catch(e){} },50);
}
function setupMealDialog(){
  const btn=$('btnMeal'); if(btn) btn.onclick=()=>{
    const today=cal.fmtKey.format(new Date()); $('mealDate').value=today; loadMealDate(today); renderMealWeekBox(); renderMealLunaBox(); renderMealNutritionBox(); renderMealSuggestionsBox(); $('mealDialog').showModal();
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
    getMealData().entries[k]=e; scheduleSave(); renderMealWeekBox(); renderMealLunaBox(); renderMealNutritionBox(); renderMealSuggestionsBox(); renderLuna();
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
    if(mp){ mp.href = d.mercadopago||'https://link.mercadopago.cl/semilleroconsciente'; mp.style.opacity = d.mercadopago? '1':'0.45'; mp.onclick = e=>{ if(!d.mercadopago){ e.preventDefault(); alert('Configura tu link Mercado Pago en donate.json → mercadopago'); }}; }
    if(pp){ pp.href = d.paypal||'https://www.paypal.com/donate?business=semilleroconsciente@gmail.com'; pp.style.opacity = d.paypal? '1':'0.45'; pp.onclick = e=>{ if(!d.paypal){ e.preventDefault(); alert('Configura tu link PayPal en donate.json → paypal'); }}; }
    const flow=$('donateFlowLink'), kf=$('donateKofiLink');
    if(flow){ flow.href = d.flow||'#'; flow.style.opacity = d.flow? '1':'0.45'; }
    if(kf){ kf.href = d.kofi||'#'; kf.style.opacity = d.kofi? '1':'0.45'; }
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
const ALL_BTNS = ["btnTides","btnFishing","btnBirds","btnWeather","btnSiembra","btnAstro","btnComuna","btnEkadashi","btnMenstrual","btnMedic","btnHabits","btnMeal","btnShopping","btnDiscipline","btnDreams","btnBreath","btnSchedule","btnGym","btnCircadian","btnGolden","btnConvert","btnTimer","btnRemind","btnBackup","btnRestore","btnShortcut","btnPdfLuna","btnPdfCiclo","btnDonate","btnHelp","btnStudy","btnTales","btnMemory"];
const PRESETS = {
  todo: Object.fromEntries(ALL_BTNS.map(k=>[k,true])),
  esencial: {btnTides:true,btnWeather:true,btnSiembra:true,btnEkadashi:true,btnBackup:true,btnRestore:true,btnPdfLuna:true,btnPdfCiclo:true,btnHelp:true,btnDonate:true},
  infantil: {btnWeather:true,btnSiembra:true,btnHabits:true,btnDreams:true,btnBreath:true,btnSchedule:true,btnHelp:true},
  adolescente: {btnHabits:true,btnStudy:true,btnSchedule:true,btnDiscipline:true,btnDreams:true,btnBreath:true,btnConvert:true,btnTimer:true,btnHelp:true},
  adulto: Object.fromEntries(ALL_BTNS.map(k=>[k,true])),
  mayor: {btnTides:true,btnWeather:true,btnSiembra:true,btnMenstrual:true,btnMedic:true,btnDreams:true,btnBreath:true,btnHelp:true,btnDonate:true},
  estudiante: {btnWeather:true,btnSiembra:true,btnHabits:true,btnStudy:true,btnSchedule:true,btnDiscipline:true,btnConvert:true,btnTimer:true,btnHelp:true},
  agricultor: {btnTides:true,btnFishing:true,btnBirds:true,btnWeather:true,btnSiembra:true,btnGolden:true,btnCircadian:true,btnHelp:true},
  pescador: {btnTides:true,btnFishing:true,btnBirds:true,btnWeather:true,btnSiembra:true,btnGolden:true,btnHelp:true},
  salud: {btnMenstrual:true,btnMedic:true,btnHabits:true,btnGym:true,btnCircadian:true,btnDreams:true,btnBreath:true,btnMeal:true,btnHelp:true},
  deportista: {btnHabits:true,btnGym:true,btnMeal:true,btnShopping:true,btnCircadian:true,btnBreath:true,btnTimer:true,btnHelp:true},
  docente: {btnSiembra:true,btnEkadashi:true,btnStudy:true,btnSchedule:true,btnHabits:true,btnDiscipline:true,btnConvert:true,btnPdfCiclo:true,btnHelp:true}
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
    if(el) el.style.display = vis[id] ? '' : 'none';
  });
  const large = (DATA.config && DATA.config.largeText);
  document.body.classList.toggle('large-text', !!large);
  const cb=document.getElementById('cfgLargeText'); if(cb) cb.checked=!!large;
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
// === GYM / ENTRENAMIENTOS ===
function getGymData(){
  const u=userData();
  if(!u.gym) u.gym={ items:[], completions:{} };
  if(!Array.isArray(u.gym.items)) u.gym.items=[];
  if(typeof u.gym.completions!=='object' || Array.isArray(u.gym.completions)) u.gym.completions={};
  return u.gym;
}
let gymEditingId=null;
function renderGymTodayBox(){
  const box=$('gymTodayBox'); if(!box) return;
  const d=getGymData();
  const today=new Date().getDay();
  const todays=d.items.filter(x=> parseInt(x.day)===today).sort((a,b)=> a.start.localeCompare(b.start));
  const todayKey=cal.fmtKey.format(new Date());
  if(!todays.length) box.innerHTML='<p class="muted">Hoy no tienes rutinas. ¡Descanso activo o caminata!</p>';
  else box.innerHTML='<h4 style="color:var(--gold)">Hoy — '+['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][today]+'</h4>' + todays.map(it=>{
    const done = d.completions[todayKey] && d.completions[todayKey][it.id];
    return `<div class="mens-hist-item" style="border-left:3px solid ${it.color}"><span><b>${escapeHtml(it.name)}</b> ${it.start}–${it.end} · ${escapeHtml(it.place||'')} ${done?'<span class="chip" style="background:var(--gold);color:#10142c;margin-left:6px">✓ hecho</span>':''}</span><label class="check-row" style="margin:0"><input type="checkbox" data-id="${it.id}" ${done?'checked':''}> Hecho</label></div>`;
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
    html+=`<div class="schedule-day ${isToday?'schedule-today':''}"><b>${name}</b>${items.length? items.map(it=>`<div class="schedule-block" style="background:${it.color};border:1px solid ${it.color}">${escapeHtml(it.name)}<br><span style="font-size:10px">${it.start}–${it.end}</span></div>`).join('') : '<p class="muted" style="font-size:10px">—</p>'}</div>`;
  });
  box.innerHTML=html;
}
function renderGymList(){
  const box=$('gymList'); if(!box) return;
  const d=getGymData();
  if(!d.items.length){ box.innerHTML='<p class="muted">Sin rutinas aún. Agrega tu primera arriba.</p>'; return; }
  const sorted=[...d.items].sort((a,b)=> parseInt(a.day)-parseInt(b.day) || a.start.localeCompare(b.start));
  box.innerHTML=sorted.map(it=>`<div class="habit-item" style="display:flex;justify-content:space-between;align-items:center"><span><b style="color:${it.color}">●</b> ${escapeHtml(it.name)} — ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][it.day]} ${it.start}–${it.end} ${it.place? '· '+escapeHtml(it.place):''}<br><span class="muted" style="font-size:11px">${escapeHtml((it.exercises||'').split('\n')[0]||'')}</span></span><span style="display:flex;gap:6px"><button data-id="${it.id}" class="btn gym-edit" style="width:auto;font-size:11px">✏️</button><button data-id="${it.id}" class="btn gym-del" style="width:auto;font-size:11px;color:#e76e8a;border-color:#e76e8a55">✕</button></span></div>`).join('');
  box.querySelectorAll('.gym-edit').forEach(b=> b.onclick=()=>{
    const it=d.items.find(x=>x.id===b.dataset.id); if(!it) return;
    gymEditingId=it.id;
    $('gymName').value=it.name; $('gymDay').value=it.day; $('gymStart').value=it.start; $('gymEnd').value=it.end; $('gymColor').value=it.color; $('gymPlace').value=it.place||''; $('gymExercises').value=it.exercises||'';
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
  box.innerHTML='<h4 style="color:var(--accent)">📊 Progreso</h4><div class="habit-stats"><span>Hoy: '+todayDone+' completadas</span><span>Esta semana: '+weekDone+' días</span><span>Total rutinas: '+d.items.length+'</span></div>';
}
function setupGymDialog(){
  const btn=$('btnGym'); if(btn) btn.onclick=()=>{ renderGymTodayBox(); renderGymWeekGrid(); renderGymList(); renderGymStatsBox(); $('gymDialog').showModal(); };
  const ct=$('gymCloseTop'), cb=$('gymClose'); if(ct) ct.onclick=()=>$('gymDialog').close(); if(cb) cb.onclick=()=>$('gymDialog').close();
  const add=$('gymAdd'); if(add) add.onclick=()=>{
    const name=$('gymName').value.trim(); if(!name) return alert('Escribe nombre de rutina');
    const it={ id:'gym'+Date.now(), name, day:$('gymDay').value, start:$('gymStart').value, end:$('gymEnd').value, color:$('gymColor').value, place:$('gymPlace').value.trim(), exercises:$('gymExercises').value.trim() };
    if(it.start>=it.end) return alert('Hora inicio debe ser antes que fin');
    getGymData().items.push(it); scheduleSave(); $('gymName').value=''; $('gymExercises').value=''; renderGymList(); renderGymWeekGrid(); renderGymTodayBox(); renderGymStatsBox(); renderLuna();
  };
  const upd=$('gymUpdate'); if(upd) upd.onclick=()=>{
    const it=getGymData().items.find(x=>x.id===gymEditingId); if(!it) return;
    it.name=$('gymName').value.trim(); it.day=$('gymDay').value; it.start=$('gymStart').value; it.end=$('gymEnd').value; it.color=$('gymColor').value; it.place=$('gymPlace').value.trim(); it.exercises=$('gymExercises').value.trim();
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

// === CONVERSIÓN DE UNIDADES ===
const CONV = {
  longitud: { label: 'Longitud', units: { mm: 1, cm: 10, m: 1000, km: 1000000, pulg: 25.4, pie: 304.8, yarda: 914.4, milla: 1609344 }, defFrom: 'm', defTo: 'cm' },
  peso: { label: 'Peso', units: { mg: 1, g: 1000, kg: 1000000, tonelada: 1e9, onza: 28349.5, libra: 453592, quintal: 45359200 }, defFrom: 'kg', defTo: 'g' },
  volumen: { label: 'Volumen', units: { ml: 1, l: 1000, m3: 1e6, cda: 15, cdta: 5, taza: 240, galon: 3785.41, pulg3: 16.387 }, defFrom: 'l', defTo: 'ml' },
  temperatura: { label: 'Temperatura', units: {}, isTemp: true, defFrom: 'C', defTo: 'F' },
  superficie: { label: 'Superficie', units: { mm2: 1, cm2: 100, m2: 1000000, ha: 1e10, km2: 1e12, acre: 4046860000, pie2: 92903 }, defFrom: 'm2', defTo: 'ha' },
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
  function countTick() { if(countRem<=0){ clearInterval(countInt); countRunning=false; $('countStart').textContent='▶ Iniciar'; countShow(); try{ new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==').play().catch(()=>{});}catch{}; try{ navigator.vibrate&&navigator.vibrate([400,200,400]); }catch{}; try{ new Notification('⏱ Temporizador', {body:'¡Tiempo cumplido!'});}catch{}; return; } countRem--; countShow(); }
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
