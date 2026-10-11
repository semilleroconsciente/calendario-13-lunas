// core-dialogo-dia.js — extraído de renderer.js (núcleo compartido, scope top-level).
// ficha del día: horas, frases, wiring, compartir. Carga diferida antes de renderer.js (ver index.html).
let editing = null;
let pendingMood = -1;

// === NOTAS DEL DÍA POR HORAS + AGENDA (cualquier hora HH:MM) ===
function getAgendaTime(a){
  if(a && typeof a.time==='string' && /^\d{1,2}:\d{2}$/.test(a.time)){
    const [hh,mm]=a.time.split(':').map(Number);
    return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
  }
  const h = (a && a.hour!==undefined) ? a.hour : 0;
  const m = (a && a.minute!==undefined) ? a.minute : 0;
  return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
}
function ensureHourSel() {
  const sel = $('dlgHourSel');
  if (!sel) return;
  // Nuevo: input type=time → cualquier hora/minuto. Legacy: select con options.
  if(sel.tagName==='INPUT'){
    if(!sel.value){
      const now = new Date();
      sel.value = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    }
    return;
  }
  if (sel.options.length) return;
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
  // migración suave: hora legacy → time HH:MM
  cell.agenda.forEach(a=>{
    if(!a.time || !/^\d{2}:\d{2}$/.test(a.time)) a.time = getAgendaTime(a);
    if(a.hour===undefined) a.hour = parseInt(a.time.slice(0,2),10);
    if(a.minute===undefined) a.minute = parseInt(a.time.slice(3,5),10);
  });
  // ordenar por hora exacta
  const sorted = [...cell.agenda].sort((a,b)=> getAgendaTime(a).localeCompare(getAgendaTime(b)) || (a.id||'').localeCompare(b.id||''));
  if (!sorted.length) {
    grid.innerHTML = '<p class="muted" style="font-size:11px;padding:8px;border:1px dashed var(--line);border-radius:8px;text-align:center">Sin compromisos aún. Agrega uno a cualquier hora abajo (ej 08:37).</p>';
    return;
  }
  // agrupar por hora exacta (HH:MM)
  const byTime = {};
  sorted.forEach(it=> { const t=getAgendaTime(it); if(!byTime[t]) byTime[t]=[]; byTime[t].push(it); });
  const times = Object.keys(byTime).sort();
  grid.innerHTML = times.map(t=>{
    const items = byTime[t];
    return `<div class="hora-block"><div class="hora-label">🕐 ${t} <span class="muted" style="font-size:10px">· ${items.length} ${items.length===1?'compromiso':'compromisos'}</span></div>` +
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
            const t = (typeof getAgendaTime==='function') ? getAgendaTime(it) : (it.time || String(it.hour).padStart(2,'0')+':00');
            const [hh,mm] = t.split(':').map(Number);
            if(hh===nowHour && mm===nowMin){
              try{ playNotifySound(); new Notification(`⏰ ${t} — ${it.text}`, { body: `Luna ${mk} · Día ${dk} — ${it.text}`, silent:false}); }catch{}
              it.notified=true;
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
setInterval(()=>{ try{ agendaCheckNotify(); }catch{} }, 30000);
function setupDlgHorasAdd(){
  const btn=$('dlgHourAdd'); if(!btn) return;
  btn.onclick=async()=>{
    const sel=$('dlgHourSel'); const txtEl=$('dlgHourText'); const chk=$('dlgHourNotify');
    if(!editing) return;
    let timeStr='08:00', hour=8, minute=0;
    const raw=(sel.value||'').trim();
    if(/^\d{1,2}:\d{2}/.test(raw)){
      const [hh,mm]=raw.split(':').map(Number);
      if(hh>=0&&hh<=23&&mm>=0&&mm<=59){ hour=hh; minute=mm; timeStr=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'); }
      else return alert('Hora inválida (00:00 a 23:59)');
    } else if(/^\d{1,2}$/.test(raw)){
      hour=parseInt(raw,10); timeStr=String(hour).padStart(2,'0')+':00';
    } else {
      return alert('Elige una hora válida (ej 08:37)');
    }
    const text=sanitizeText((txtEl.value||'').trim(),80);
    if(!text) return;
    const notify=!!(chk && chk.checked);
    if(notify){
      try{ if(typeof Notification!=='undefined' && Notification.permission!=='granted' && Notification.requestPermission) await Notification.requestPermission(); }catch{}
    }
    const cell=dayCell(editing.lunaN, editing.diaN);
    if(!Array.isArray(cell.agenda)) cell.agenda=[];
    cell.agenda.push({ id:'a'+Date.now()+Math.random().toString(36).slice(2,4), hour, minute, time:timeStr, text, notify, notified:false });
    scheduleSave();
    txtEl.value=''; if(chk) chk.checked=false;
    renderDlgHoras(); renderCurrentView();
  };
  const txtEl2=$('dlgHourText');
  if(txtEl2) txtEl2.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); $('dlgHourAdd').click(); } });
}
setTimeout(setupDlgHorasAdd, 500);

// === FRASE DEL DÍA PERSONALIZADA (una por cada día de luna / DFT) ===
// Si el día tiene frase propia guardada se usa esa; si no, la frase base de frases.js.
function defaultFraseFor(lunaN, diaN){
  try{
    const idx = (lunaN - 1) * 28 + (diaN - 1);
    return (window.frases && window.frases[idx]) ? window.frases[idx] : null;
  }catch(e){ return null; }
}
function readCustomFrase(lunaN, diaN, year){
  try{
    const y = String(year !== undefined && year !== null ? year : currentCycleYear());
    const u = userData();
    const c = u.cycles[y];
    const d = c && c.moons[String(lunaN)] && c.moons[String(lunaN)].days[diaN];
    if(d && d.frase && d.frase.t && String(d.frase.t).trim()) return { t: String(d.frase.t), a: String(d.frase.a || '') };
  }catch(e){}
  return null;
}
function effectiveFraseFor(lunaN, diaN, year){
  const custom = readCustomFrase(lunaN, diaN, year);
  if(custom) return { t: custom.t, a: custom.a, custom: true };
  const d = defaultFraseFor(lunaN, diaN);
  return d ? { t: d.t, a: d.a, custom: false } : null;
}
function writeCustomFrase(lunaN, diaN, year, t, a){
  const y = (year !== undefined && year !== null) ? year : currentCycleYear();
  const cell = (String(y) === String(currentCycleYear())) ? dayCell(lunaN, diaN) : (()=>{ const c = cyc(y); const m = c.moons[String(lunaN)]; if(!m.days[diaN]) m.days[diaN] = { nota:'', animo:-1, agenda:[] }; return m.days[diaN]; })();
  t = sanitizeText((t || '').trim(), 300);
  a = sanitizeText((a || '').trim(), 60);
  if(!t){ delete cell.frase; scheduleSave('Frase original ✓'); }
  else { cell.frase = { t, a }; scheduleSave('Frase guardada ✓'); }
}
function defaultFraseDFT(){
  try{ return window.fraseDFT || (window.frases ? window.frases[364] : null); }catch(e){ return null; }
}
function effectiveFraseDFT(year){
  try{
    const u = userData();
    const c = u.cycles[String(year !== undefined && year !== null ? year : currentCycleYear())];
    if(c && c.dft && c.dft.frase && c.dft.frase.t && String(c.dft.frase.t).trim()) return { t: String(c.dft.frase.t), a: String(c.dft.frase.a || ''), custom: true };
  }catch(e){}
  const d = defaultFraseDFT();
  return d ? { t: d.t, a: d.a, custom: false } : null;
}
function writeCustomFraseDFT(year, t, a){
  const c = cyc(year !== undefined && year !== null ? year : currentCycleYear());
  c.dft = c.dft || { nota: '' };
  t = sanitizeText((t || '').trim(), 300);
  a = sanitizeText((a || '').trim(), 60);
  if(!t){ delete c.dft.frase; scheduleSave('Frase original ✓'); }
  else { c.dft.frase = { t, a }; scheduleSave('Frase guardada ✓'); }
}

function frasesPairFor(lunaN, diaN, year){
  return { base: defaultFraseFor(lunaN, diaN), custom: readCustomFrase(lunaN, diaN, year) };
}
function frasesPairDFT(year){
  let custom = null;
  try{
    const u = userData();
    const c = u.cycles[String(year !== undefined && year !== null ? year : currentCycleYear())];
    if(c && c.dft && c.dft.frase && c.dft.frase.t && String(c.dft.frase.t).trim()) custom = { t: String(c.dft.frase.t), a: String(c.dft.frase.a || '') };
  }catch(e){}
  return { base: defaultFraseDFT(), custom };
}

function openDayDialog(lunaN, diaN) {
  editing = { lunaN, diaN };
  const cell = dayCell(lunaN, diaN);
  const d = cycle.days.find(x => x.luna === lunaN && x.diaN === diaN);
  const meta = MOONS[lunaN - 1];
  // Frase del día predeterminada (sin edición personalizada)
  try{
    const base = (typeof defaultFraseFor === 'function') ? defaultFraseFor(lunaN, diaN) : null;
    $('dlgQuote').innerHTML = base ? `«${escapeHtml(base.t)}»<span class="q-a">— ${escapeHtml(base.a || 'Anónimo')}</span>` : '<span class="muted">Sin frase para este día.</span>';
  }catch(e){}
  const efe = EFEMERIDES[cal.fmtKey.format(new Date(d.noonMs)).slice(5)];
  $('dlgTitle').textContent = `Luna ${lunaN} · Día ${diaN} de 28`;
  $('dlgDate').textContent = `${meta.nombre} — ${cal.weekdayName(d.noonMs)} ${cal.fmtFull.format(new Date(d.noonMs))}${efe ? ' · 📅 ' + efe : ''}`;

  // === ☀️🌙 Sol y luna del día (mismo orden y datos que la vista Hoy en celular) ===
  try{
    const dlgKey = cal.fmtKey.format(new Date(d.noonMs));
    let sun = { rise: null, set: null }, moon = { rise: null, set: null };
    try{ sun = cal.sunForDay(d.noonMs) || sun; }catch(e){}
    try{ moon = cal.moonForDay(d.noonMs) || moon; }catch(e){}
    let moonIcon = '🌙', illum = null, aproxFase = '';
    try{
      moonIcon = window.astro.moonIcon(d.noonMs) || '🌙';
      const mi = window.astro.moonInfo(d.noonMs);
      illum = Math.round((mi.fraction || 0) * 100);
      const nombres = ['Luna nueva','Luna creciente','Cuarto creciente','Creciente gibosa','Luna llena','Menguante gibosa','Cuarto menguante','Luna menguante'];
      aproxFase = nombres[Math.round((mi.phase || 0) * 8) % 8] || '';
    }catch(e){}
    let evs = [];
    try{ evs = (typeof phaseMap !== 'undefined' && phaseMap[dlgKey]) ? phaseMap[dlgKey] : []; }catch(e){}
    const faseBase = evs.length
      ? evs.map(e => e.simbolo + ' ' + String(e.tipo || '').replace('-', ' ')).join(' · ')
      : (aproxFase || 'Fase lunar');
    const faseTxt = faseBase + (illum !== null ? ' · ' + illum + '% iluminada' : '');
    const box = $('dlgSunMoon');
    if(box){
      box.innerHTML =
        '<label class="dlg-horas-label">☀️🌙 Sol y luna</label>'
        + '<div class="dlg-sun-row"><span class="chip">☀️ Amanecer <b>' + (sun.rise ? cal.fmtTime.format(new Date(sun.rise)) : '--') + '</b></span>'
        + '<span class="chip">🌇 Atardecer <b>' + (sun.set ? cal.fmtTime.format(new Date(sun.set)) : '--') + '</b></span></div>'
        + '<div class="dlg-sun-row"><span class="chip">🌙 Sale <b>' + (moon.rise ? cal.fmtTime.format(new Date(moon.rise)) : '--') + '</b></span>'
        + '<span class="chip">🌘 Se pone <b>' + (moon.set ? cal.fmtTime.format(new Date(moon.set)) : '--') + '</b></span></div>'
        + '<div class="dlg-sun-row"><span class="chip">' + moonIcon + ' Fase <b>' + escapeHtml(faseTxt) + '</b></span></div>'
        + '<p class="muted" style="font-size:10px;margin:6px 0 0">Penco · hora local · aprox. ±15 min según lugar de observación.</p>';
    }
  }catch(e){}

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

  const hourSel = $('dlgHourSel');
  if(hourSel && hourSel.tagName==='INPUT'){
    const now = new Date();
    hourSel.value = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  } else ensureHourSel();
  // Notas del día (textarea libre) — mantener separado de compromisos por hora
  const notaEl = $('fNota');
  if (notaEl) notaEl.value = cell.nota || '';
  $('dlgHourText').value = '';
  $('dlgHourNotify').checked = false;
  renderDlgHoras();
  try{ renderDlgHabits(); }catch(e){}
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
      try{ mensRefreshAll(); }catch(e){}
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
  try{ if(viewMode==='hoy'){ renderTodayView(); return; } }catch(e){}
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
  const fr = (typeof defaultFraseFor === 'function') ? defaultFraseFor(lunaN, diaN) : null;
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
    x.fillText(`— ${fr.a || 'Anónimo'}`, 540, 700);
  }
  // Notas + agenda por horas en imagen compartida
  const agendaTxt = Array.isArray(cell.agenda) && cell.agenda.length ? cell.agenda.slice().sort((a,b)=>getAgendaTime(a).localeCompare(getAgendaTime(b))).map(a=> `${getAgendaTime(a)} ${a.text}${a.notify?' 🔔':''}`).join(' · ') : '';
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
