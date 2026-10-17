// core-calendario.js — extraído de renderer.js (núcleo compartido, scope top-level).
// vistas luna/mes/semana, pager, grid, mobile. Carga diferida antes de renderer.js (ver index.html).
// === VISTAS: LUNA (defecto) / MES / SEMANA / DÍA ===
let viewMode = 'luna'; // luna = 13 lunas (defecto) | mes | semana | dia
let viewDateMs = Date.now(); // pivote gregoriano para mes/semana/día
// Lista del Diario de Sueños para la vista móvil (Hoy). getSuenos() vive dentro
// del IIFE de nuevos-modulos.js y NO es global: se lee vía window.SuenosPenco
// (puente) y, como respaldo, directo de userData().suenosLog (misma clave del
// store). Devuelve siempre el arreglo vivo para poder hacer push + scheduleSave.
function todaySuenosList(){
  try{
    if(typeof window!=='undefined' && window.SuenosPenco && typeof window.SuenosPenco.get==='function'){
      const a = window.SuenosPenco.get(); if(Array.isArray(a)) return a;
    }
  }catch(e){}
  try{
    if(typeof getSuenos==='function'){ const b = getSuenos(); if(Array.isArray(b)) return b; }
  }catch(e){}
  try{
    const u = (typeof userData==='function') ? userData() : null;
    if(u){ if(!Array.isArray(u.suenosLog)) u.suenosLog = []; return u.suenosLog; }
  }catch(e){}
  return [];
}
let _lunaByKeyCache = null;
function rebuildLunaByKey(){
  _lunaByKeyCache = {};
  try{
    for(const y of CYCLE_YEARS){
      const c = cal.buildCycle(y);
      for(const d of c.days){
        const k = cal.fmtKey.format(new Date(d.noonMs));
        if(!_lunaByKeyCache[k]) _lunaByKeyCache[k] = { y, luna: d.luna, diaN: d.diaN, noonMs: d.noonMs };
      }
    }
  }catch(e){}
}
function lunaMapForKey(key){
  if(!_lunaByKeyCache) rebuildLunaByKey();
  return _lunaByKeyCache[key] || null;
}
function cellForLunaRef(ref){
  if(!ref || ref.luna==='dft') return null;
  try{
    const savedCycle = cycle;
    const savedYear = currentCycleYear();
    let cell = null;
    if(ref.y === savedYear){
      cell = dayCell(ref.luna, ref.diaN);
    } else {
      // leer sin cambiar ciclo visible: acceso directo a DATA
      const u = userData();
      const c = u.cycles[String(ref.y)];
      if(c && c.moons[String(ref.luna)] && c.moons[String(ref.luna)].days[ref.diaN]) cell = c.moons[String(ref.luna)].days[ref.diaN];
    }
    return cell;
  }catch(e){ return null; }
}
function agendaTimeStr(a){
  if(a.time && /^\d{2}:\d{2}$/.test(a.time)) return a.time;
  const h = String(a.hour||0).padStart(2,'0');
  const m = String(a.minute||0).padStart(2,'0');
  return h+':'+m;
}
function updateViewButtons(){
  const map = { luna:'viewLuna', semanaLunar:'viewSemanaLunar', mes:'viewMes', semana:'viewSemana' };
  Object.entries(map).forEach(([m,id])=>{
    const el = $(id); if(!el) return;
    const on = (viewMode===m);
    el.classList.toggle('btn-accent', on);
    el.setAttribute('aria-selected', on ? 'true':'false');
  });
  const nav = $('viewNav');
  if(nav) nav.classList.toggle('hidden', viewMode==='luna' && currentView.tipo!=='dft' ? true : false);
  // En vista luna pura ocultamos nav de mes/semana/día; en DFT también oculto
  if(nav && (viewMode==='luna' || viewMode==='hoy')) nav.classList.add('hidden');
  else if(nav) nav.classList.remove('hidden');
  try{ paintMobileDock(); }catch(e){}
  try{ syncMobileViewAttr(); }catch(e){}
  try{ paintLunaPager(); }catch(e){}
}
function setViewMode(m){
  viewMode = m;
  if(m!=='luna') viewDateMs = Date.now();
  updateViewButtons();
  renderCurrentView();
}
function renderCurrentView(){
  updateViewButtons();
  if(viewMode==='hoy'){ renderTodayView(); return; }
  if(viewMode==='semanaLunar') renderSemanaLunarView();
  else if(viewMode==='mes') renderMesView();
  else if(viewMode==='semana') renderSemanaView();
  else {
    if(currentView.tipo==='dft') renderDFT();
    else renderLuna();
  }
  try{ syncMobileViewAttr(); }catch(e){}
}

// === VISTA HOY (solo móvil) + dock inferior persistente ===
// PC queda igual: todo este bloque solo se activa con matchMedia max-width 920px.
// mobileSec: 'hoy' (día directo) | 'luna' (mensual lunar 28 días) | 'tools' (herramientas) | 'completa' (todo)
// Guía y Ajustes abren sus diálogos sin cambiar de sección.
let mobileSec = null;
function isMobileWidth(){
  try{
    if(document.body && document.body.dataset.forceMobile==="1") return true;
    return window.matchMedia('(max-width: 920px)').matches;
  } catch(e){ return (window.innerWidth||9999) <= 920; }
}
function isForceMobile(){ try{ return document.body.dataset.forceMobile==="1"; }catch(e){ return false; } }
function updateVistaCelularBtn(){
  const b=$('btnVistaCelular');
  if(!b) return;
  const on=isForceMobile();
  b.textContent = on ? '🖥️ Vista PC' : '📱 Vista celular';
  b.title = on ? 'Volver a vista normal de PC' : 'Activar vista de celular en PC — emula pantalla de 390px en el centro';
  b.classList.toggle('btn-accent', on);
}
function toggleForceMobile(){
  const on=isForceMobile();
  if(on){
    document.body.removeAttribute('data-force-mobile');
    try{ localStorage.setItem('cal13-forceMobile','0'); }catch(e){}
    // al salir, si estábamos en vista móvil, volver a completa (todo visible)
    try{ if(mobileSec){ mobileSec=null; viewMode='luna'; } }catch(e){}
  } else {
    document.body.dataset.forceMobile="1";
    try{ localStorage.setItem('cal13-forceMobile','1'); }catch(e){}
    try{ if(!mobileSec){ mobileSec='hoy'; viewMode='hoy'; } }catch(e){}
  }
  updateVistaCelularBtn();
  try{ syncMobileViewAttr(); }catch(e){}
  try{ paintMobileDock(); }catch(e){}
  try{ renderCurrentView(); }catch(e){}
}
function setupVistaCelularBtn(){
  const b=$('btnVistaCelular');
  if(!b || b.dataset.bound) return;
  b.dataset.bound="1";
  b.onclick=toggleForceMobile;
  try{ if(localStorage.getItem('cal13-forceMobile')==="1") document.body.dataset.forceMobile="1"; }catch(e){}
  updateVistaCelularBtn();
  try{ if(isForceMobile() && !mobileSec){ mobileSec='hoy'; viewMode='hoy'; } }catch(e){}
}
function syncMobileViewAttr(){
  try{
    if(!isMobileWidth() || !mobileSec){ document.body.removeAttribute('data-mview'); return; }
    document.body.dataset.mview = mobileSec;
  }catch(e){}
}
function paintMobileDock(){
  const map = { hoy:'dockHoy', luna:'dockLuna' };
  Object.entries(map).forEach(([m,id])=>{
    const el = $(id); if(!el) return;
    el.classList.toggle('active', mobileSec===m);
  });
  const f = $('dockFull'); if(f) f.classList.toggle('active', mobileSec==='completa');
  const t = $('dockTools'); if(t) t.classList.toggle('active', mobileSec==='tools');
}
function scrollMobileTop(){
  try{
    const main = $('main');
    if(main && main.scrollTo) main.scrollTo({top:0});
    window.scrollTo(0,0);
  }catch(e){}
}
function showMobileView(m){
  if(m==='guia'){ try{ ($('btnHelp')||{}).click ? $('btnHelp').click() : $('helpDialog').showModal(); }catch(e){} return; }
  if(m==='conf'){ try{ ($('btnConfig')||{}).click ? $('btnConfig').click() : $('configDialog').showModal(); }catch(e){} return; }
  if(m==='hoy'){ mobileSec='hoy'; viewMode='hoy'; renderCurrentView(); scrollMobileTop(); return; }
  if(m==='luna'){
    mobileSec='luna';
    if(viewMode==='hoy') viewMode='luna';
    // asegurar que la luna visible sea la de hoy
    try{
      const inf = todayInfo();
      if(inf && inf.luna!=='dft' && currentView && currentView.luna!==inf.luna){
        if(String(inf.y)!==String(currentCycleYear())){ try{ selectCycle(inf.y, inf.luna); }catch(e){} }
        else { selectMoon(inf.luna); mobileSec='luna'; syncMobileViewAttr(); paintMobileDock(); scrollMobileTop(); return; }
      }
    }catch(e){}
    renderCurrentView(); scrollMobileTop(); return;
  }
  if(m==='completa'){
    mobileSec='completa';
    if(viewMode==='hoy') viewMode='luna';
    renderCurrentView(); scrollMobileTop(); return;
  }
  if(m==='tools'){
    mobileSec='tools';
    if(viewMode==='hoy') viewMode='luna';
    renderCurrentView();
    try{
      const a=$('actions');
      if(a) a.scrollIntoView({behavior:'smooth', block:'start'});
      else scrollMobileTop();
    }catch(e){}
    return;
  }
}
function setupMobileDock(){
  const bH=$('dockHoy'), bL=$('dockLuna'), bT=$('dockTools'), bG=$('dockGuia'), bC=$('dockConf'), bF=$('dockFull');
  if(bH) bH.onclick=()=>showMobileView('hoy');
  if(bL) bL.onclick=()=>showMobileView('luna');
  if(bT) bT.onclick=()=>showMobileView('tools');
  if(bG) bG.onclick=()=>showMobileView('guia');
  if(bC) bC.onclick=()=>showMobileView('conf');
  if(bF) bF.onclick=()=>showMobileView('completa');
  try{ setupVistaCelularBtn(); }catch(e){}
  // re-aplicar vista si venía forzada de sesión anterior
  try{
    if(isForceMobile()){
      syncMobileViewAttr();
      paintMobileDock();
    }
  }catch(e){}
}
function todayCellRef(){
  const info = todayInfo();
  if(!info) return null;
  return info;
}
function renderTodayView(){
  const box = $('todayView');
  if(!box) return;
  syncMobileViewAttr();
  paintMobileDock();
  try{ if($('monthNoteWrap')) $('monthNoteWrap').style.display=''; }catch(e){}
  const info = todayCellRef();
  const now = new Date();
  const nowKey = cal.fmtKey.format(now);
  const hh = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  if(!info){
    box.classList.remove('hidden');
    box.innerHTML = '<div class="today-card"><h3>◉ Hoy</h3><p class="muted">No se encontró el día de hoy en el ciclo.</p></div>';
    return;
  }
  const isDFT = info.luna==='dft';
  let cell=null, nota='', agenda=[], animo=-1, key=nowKey, noonMs=info.noonMs;
  let lunaN=null, diaN=null, meta=null, fr=null, sun={rise:null,set:null}, moon={rise:null,set:null}, evs=[];
  if(isDFT){
    try{
      const c = cyc(info.y);
      nota = (c.dft && c.dft.nota) || '';
      key = cal.fmtKey.format(new Date(info.noonMs));
      sun = cal.sunForDay(info.noonMs);
      try{ moon = cal.moonForDay(info.noonMs); }catch(e){}
      fr = (typeof frasesPairDFT === 'function') ? frasesPairDFT(info.y) : ((typeof effectiveFraseDFT === 'function') ? effectiveFraseDFT(info.y) : (window.fraseDFT || (window.frases ? window.frases[364] : null)));
      evs = (typeof phaseMap!=='undefined' && phaseMap[key]) ? phaseMap[key] : [];
    }catch(e){}
  } else {
    lunaN = info.luna; diaN = info.diaN;
    try{ cell = dayCell(lunaN, diaN); }catch(e){ cell=null; }
    nota = (cell && cell.nota) || '';
    agenda = (cell && Array.isArray(cell.agenda)) ? [...cell.agenda].sort((a,b)=> getAgendaTime(a).localeCompare(getAgendaTime(b))) : [];
    animo = (cell && typeof cell.animo==='number') ? cell.animo : -1;
    key = cal.fmtKey.format(new Date(info.noonMs));
    meta = MOONS[lunaN-1];
    const idx = (lunaN-1)*28+(diaN-1);
    fr = (typeof frasesPairFor === 'function') ? frasesPairFor(lunaN, diaN, info.y) : ((typeof effectiveFraseFor === 'function') ? effectiveFraseFor(lunaN, diaN, info.y) : (window.frases ? window.frases[idx] : null));
    try{ sun = cal.sunForDay(info.noonMs); }catch(e){}
    try{ moon = cal.moonForDay(info.noonMs); }catch(e){}
    try{ evs = (typeof phaseMap!=='undefined' && phaseMap[key]) ? phaseMap[key] : []; }catch(e){}
  }
  let moonIcon='🌙', illum=null, aproxFase='';
  try{
    moonIcon = window.astro.moonIcon(noonMs) || '🌙';
    const mi = window.astro.moonInfo(noonMs);
    illum = Math.round((mi.fraction||0)*100);
    const nombres=['Luna nueva','Luna creciente','Cuarto creciente','Creciente gibosa','Luna llena','Menguante gibosa','Cuarto menguante','Luna menguante'];
    aproxFase = nombres[Math.round((mi.phase||0)*8)%8] || '';
  }catch(e){}
  const faseBase = evs.length
    ? evs.map(e=>e.simbolo+' '+e.tipo.replace('-',' ')).join(' · ')
    : (aproxFase||'Fase lunar');
  const faseTxt = faseBase + (illum!==null ? ' · '+illum+'% iluminada' : '');
  const cur = (animo>=0 && MOODS[animo]) ? MOODS[animo] : null;
  const sug = cur || { e:'🙂', n:'¿Cómo estás hoy? Toca para elegir' };
  const wd = cal.weekdayName(noonMs);
  const fechaLarga = cal.fmtFull.format(new Date(noonMs));
  const efe = (typeof EFEMERIDES!=='undefined') ? (EFEMERIDES[key.slice(5)]||'') : '';
  const lunaLine = isDFT ? '✷ Día Fuera del Tiempo' : ('Luna '+lunaN+' · Día '+diaN+' de 28');
  const lunaSub = isDFT ? 'Cierre del ciclo · víspera del We Tripantu' : ((meta?meta.nombre+' — '+meta.traduccion:'')+(efe?' · 📅 '+efe:''));
  // hábitos de hoy (igual que en el diálogo del día)
  let habHTML='';
  try{
    const hd=getHabitData();
    if(hd && hd.list && hd.list.length){
      habHTML='<div class="habits-today-grid">'+hd.list.map(h=>{
        const done=hd.entries[key] && hd.entries[key][h.id];
        return '<label class="habit-today-item '+(done?'done':'')+'" style="border-color:'+h.color+'55"><input type="checkbox" data-id="'+h.id+'" '+(done?'checked':'')+'><span class="habit-icon" style="background:'+h.color+'22;color:'+h.color+'">'+escapeHtml(h.icono||'✓')+'</span><span>'+escapeHtml(h.nombre)+'</span></label>';
      }).join('')+'</div>';
    } else {
      habHTML='<p class="muted su-11a508">Sin hábitos creados. Créalos en ✅ Hábitos (vista Completa).</p>';
    }
  }catch(e){ habHTML=''; }
  const hhss = hh+':'+String(now.getSeconds()).padStart(2,'0');
  box.classList.remove('hidden');
  const home = getHomeConfig();
  const hb = home.blocks || {};
  box.innerHTML =
    '<div class="today-hero">'
    + '<div class="t-now">◉ HOY · '+escapeHtml(wd)+' '+escapeHtml(fechaLarga)+' · ahora <b id="todayNowTime">'+hhss+'</b></div>'
    + '<h2>'+escapeHtml(lunaLine)+'</h2>'
    + '<div class="t-sub">'+escapeHtml(lunaSub)+'</div>'
    + '<div><span class="t-penco">📍 Penco · Bío-Bío · Chile</span></div>'
    + '</div>'
    + (hb.frase === false ? '' : '<div class="today-card"><h3>💬 Frase del día</h3>'
    + (function(){ const b = fr ? (fr.base || (fr.t ? fr : null)) : null; return b ? '<p class="today-quote">«'+escapeHtml(b.t)+'»<span>— '+escapeHtml(b.a||'Anónimo')+'</span></p>' : '<p class="muted">Sin frase para hoy.</p>'; })()
    + '</div>')
    + (hb.solLuna === false ? '' : '<div class="today-card today-card--sunmoon"><h3>☀️🌙 Sol y luna de hoy</h3>'
    + '<div class="today-sun"><span class="chip chip--sun">☀️ Amanecer <b>'+(sun.rise?cal.fmtTime.format(new Date(sun.rise)):'--')+'</b></span>'
    + '<span class="chip chip--sunset">🌇 Atardecer <b>'+(sun.set?cal.fmtTime.format(new Date(sun.set)):'--')+'</b></span></div>'
    + '<div class="su-83ca52"></div>'
    + '<div class="today-sun"><span class="chip chip--moonrise">🌙 Sale <b>'+(moon.rise?cal.fmtTime.format(new Date(moon.rise)):'--')+'</b></span>'
    + '<span class="chip chip--moonset">🌘 Se pone <b>'+(moon.set?cal.fmtTime.format(new Date(moon.set)):'--')+'</b></span></div>'
    + '<p class="sunmoon-place">📍 Penco · hora local · aprox. ±15 min según lugar de observación.</p>'
    + '<div class="su-83ca52"></div>'
    + '<div class="today-sun"><span class="chip chip--fase">'+moonIcon+' Fase <b>'+escapeHtml(faseTxt)+'</b></span>'
    + '</div></div>')
    + (hb.notas === false ? '' : '<div class="today-card"><h3>📝 Notas del día</h3>'
    + '<textarea id="todayNote" class="today-note" rows="6" placeholder="tareas, ánimo, sueños, registros...">'+escapeHtml(nota)+'</textarea></div>')
    + (hb.agenda === false ? '' : '<div class="today-card"><h3>🕐 Compromisos · '+agenda.length+'</h3>'
    + '<div id="todayAgendaList" class="today-agenda-list"></div>'
    + (isDFT
      ? '<p class="muted su-11a508">Los compromisos por hora viven en los días de luna. Este día es de cierre y reflexión.</p>'
      : '<div class="today-add"><input type="time" id="todayHourSel" value="'+hh+'" step="60" aria-label="Hora"><input type="text" id="todayHourText" placeholder="Compromiso..." maxlength="80"><label class="check-row su-988f60"><input type="checkbox" id="todayHourNotify"> 🔔</label><button type="button" id="todayHourAdd" class="btn btn-accent su-30e741">+ Agregar</button></div>')
    + '<div class="su-83ca52"></div>'
    + '<div class="su-3de8f9">'
    + (isDFT ? '' : '<button type="button" id="todayMensBtn" class="btn su-1ce0dc">🌸 Inicio ciclo</button>')
    + (isDFT ? '' : '<button type="button" id="todayShareBtn" class="btn su-1ce0dc">📤 Compartir</button>')
    + (isDFT ? '' : '<button type="button" id="todayOpenDay" class="btn su-1ce0dc">📖 Día completo</button>')
    + '</div>'
    + '</div>')
    + (hb.habitos === false ? '' : '<div class="today-card"><h3>✅ Hábitos de hoy</h3><div id="todayHabitsBox">'+habHTML+'</div></div>')
    + (hb.rutinas === false ? '' : '<div class="today-card" id="todayRutinasCard"><h3>🌅 Mi Día — Rutinas por horario</h3>'
    + '<div id="todayRutinaProg"></div><div id="todayRutinaResumen"></div>'
    + '<div class="su-8a77e5"><button type="button" id="todayRutinaOpen" class="btn btn-accent su-046678">🌅 Abrir Mi Día</button></div></div>')
    + (hb.animo === false ? '' : '<div class="today-card"><h3>😊 Estado de ánimo</h3>'
    + '<button type="button" id="todayMoodMain" class="today-mood-main"><span class="tm-ico">'+sug.e+'</span><span>'+(cur?escapeHtml(cur.n)+' · toca para cambiar':'Sugerencia: '+sug.e+' · '+escapeHtml(sug.n))+'</span></button>'
    + '<div id="todayMoodPicker" class="today-mood-picker hidden"></div></div>')
    + (hb.suenos === false ? '' : '<div class="today-card"><h3>💭 Diario de Sueños</h3>'
    + (function(){ try{ const dd=(typeof todaySuenosList==='function'?todaySuenosList():[]).filter(function(r){return r.fecha===key;}); return dd.length? '<p class="muted su-11a508">'+dd.length+' sueño(s) hoy en tu Diario · último: «'+escapeHtml((dd[dd.length-1].titulo||dd[dd.length-1].texto||'').slice(0,120))+'»</p>' : '<p class="muted su-11a508">Sin sueños hoy en tu Diario. Anota aunque sea una palabra — queda aparte, no en notas.</p>'; }catch(e){ return ''; } })()
    + '<textarea id="todayDreamText" class="today-note" rows="2" placeholder="Anoche soñé... (se guarda en tu Diario)"></textarea>'
    + '<div class="su-67b198"><button type="button" id="todayDreamSave" class="btn btn-accent su-1ce0dc">💾 Guardar en Diario</button><button type="button" id="todayDreamOpen" class="btn su-1ce0dc">📓 Abrir Diario</button></div></div>')
    + (hb.comidas === false ? '' : '<div class="today-card"><h3>🥗 Comidas de hoy</h3>'
    + (function(){ try{ const e=(typeof getMealData==='function'?getMealData().entries[key]:null)||{}; const parts=[e.breakfast?('🌅 '+e.breakfast):'',e.lunch?('☀️ '+e.lunch):'',e.dinner?('🌙 '+e.dinner):''].filter(Boolean); return parts.length? '<p class="su-6cb285">'+escapeHtml(parts.join(' · ')).replace(/&quot;/g,'"')+'</p>' : '<p class="muted su-11a508">Sin plan de comidas hoy.</p>'; }catch(e){ return ''; } })()
    + '<div class="today-add su-0de0c6"><input type="text" id="todayMealB" placeholder="🌅 Desayuno..." maxlength="80"><input type="text" id="todayMealL" placeholder="☀️ Almuerzo..." maxlength="80"><input type="text" id="todayMealD" placeholder="🌙 Cena..." maxlength="80"><div class="su-a76d59"><button type="button" id="todayMealSave" class="btn btn-accent su-1ce0dc">💾 Guardar</button><button type="button" id="todayMealOpen" class="btn su-1ce0dc">🥗 Abrir Comidas</button></div></div></div>')
    + (hb.tareas === false ? '' : '<div class="today-card"><h3>🏠 Tareas hogar de hoy</h3><div id="todayHomeTasksBox"></div><div class="su-8a77e5"><button type="button" id="todayHomeTasksOpen" class="btn su-046678">🏠 Abrir Tareas Hogar</button></div></div>')
    + (hb.compras === false ? '' : '<div class="today-card"><h3>🛒 Compras pendientes</h3><div id="todayShopBox"></div><div class="today-add"><input type="text" id="todayShopText" placeholder="Agregar (ej: pan)..." maxlength="60"><button type="button" id="todayShopAdd" class="btn btn-accent su-30e741">+ Agregar</button></div><div class="su-8a77e5"><button type="button" id="todayShopOpen" class="btn su-046678">🛒 Abrir Compras</button></div></div>')
    + (hb.finanzas === false ? '' : '<div class="today-card"><h3>💰 Finanzas del día</h3><div id="todayFinanceBox"></div><div class="today-add"><select id="todayFinTipo" class="su-30e741"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select><input type="number" id="todayFinMonto" placeholder="$ monto" min="0" class="su-91245b"><input type="text" id="todayFinDesc" placeholder="detalle..." maxlength="60"></div><div class="su-a7d4af"><button type="button" id="todayFinAdd" class="btn btn-accent su-1ce0dc">+ Agregar</button><button type="button" id="todayFinOpen" class="btn su-1ce0dc">💰 Abrir Finanzas</button></div></div>')
    + (hb.disciplina === false ? '' : '<div class="today-card today-card--compact"><h3>🎯 Disciplina</h3>'
    + (function(){ try{ const t=(typeof discGetToday==='function'?discGetToday():null); const s=(typeof discCalcStats==='function'?discCalcStats():null); if(!t) return ''; if(t.mit) return '<p class="disc-mini">'+(t.done?'✅':'🎯')+' <b>'+escapeHtml(t.mit)+'</b><span class="muted"> · 🍅 '+((+t.pomodoros||0))+' · 🔥 '+(s?s.racha:0)+'</span></p>'; return '<p class="muted disc-mini--muted">Define tu MIT de hoy.</p>'; }catch(e){ return ''; } })()
    + '<div class="disc-row"><input type="text" id="todayDiscMIT" class="today-note today-note--mini su-64e0df" placeholder="🎯 MIT de hoy..." maxlength="120">'
    + '<div class="disc-btns"><button type="button" id="todayDiscSave" class="btn btn-accent btn-sm" title="Guardar MIT">💾</button><button type="button" id="todayDiscDone" class="btn btn-sm" title="Marcar hecho">✅</button><button type="button" id="todayDiscOpen" class="btn btn-sm" title="Abrir disciplina">🎯</button></div></div></div>')
    + (hb.respiracion === false ? '' : '<div class="today-card"><h3>🌬️ Respiración</h3><p class="muted su-11a508">Pausa de 1 minuto: 4-7-8 para calmar, caja 4-4-4-4 para enfocar.</p><div class="su-3de8f9"><button type="button" id="todayBreathOpen" class="btn btn-accent su-1ce0dc">🌬️ Respirar ahora</button></div></div>')
    + (hb.ciclo === false ? '' : '<div class="today-card"><h3>🌸 Ciclo</h3><div id="todayCicloBox"></div><div class="su-67b198"><button type="button" id="todayCicloMark" class="btn su-1ce0dc">🌸 Marcar inicio hoy</button><button type="button" id="todayCicloOpen" class="btn su-1ce0dc">🌸 Abrir Ciclo</button></div></div>')
    + (hb.clima === false ? '' : '<div class="today-card"><h3>🌤️ Clima · próximas 10 horas</h3><div id="todayClimaBox"><p class="muted su-11a508">Cargando pronóstico de Penco...</p></div><p class="muted su-cb3213">Fuente: Open-Meteo · Penco. Solo información.</p><div class="su-8a77e5"><button type="button" data-go="btnWeather" class="btn su-046678">🌤️ Abrir Clima</button></div></div>')
    + (hb.mareas === false ? '' : '<div class="today-card"><h3>🌊 Mareas</h3><div id="todayTideBox"><p class="muted su-11a508">Calculando mareas...</p></div><p class="muted su-cb3213">Fuente: SHOA Talcahuano. Solo información.</p><div class="su-8a77e5"><button type="button" data-go="btnTides" class="btn su-046678">🌊 Abrir Mareas</button></div></div>')
    + (hb.gratitud === false ? '' : '<div class="today-card"><h3>📓 Gratitud diaria</h3><div id="todayGratBox">'
    + (function(){ try{ const e=(typeof getGratitudData==='function'?getGratitudData().entries[key]:null)||{}; const parts=[e.t1,e.t2,e.t3].filter(Boolean); let h=''; if(parts.length) h+='<p class="su-6cb285">✨ '+parts.map(function(p){return escapeHtml(p);}).join('<br>✨ ')+'</p>'; if(e.intencion) h+='<p class="muted su-11a508">🎯 '+escapeHtml(e.intencion)+'</p>'; if(!parts.length&&e.carta) h+='<p class="su-6cb285">💌 '+escapeHtml(String(e.carta).slice(0,120))+'</p>'; if(!h) return '<p class="muted su-11a508">Aún no registras gratitud hoy. Escribe una abajo.</p>'; return h; }catch(e){ return ''; } })()
    + '</div><div class="today-add"><input type="text" id="todayGratInput" placeholder="Agradezco por..." maxlength="120"><button type="button" id="todayGratSave" class="btn btn-accent su-30e741">+ Guardar</button></div><div class="su-8a77e5"><button type="button" id="todayGratOpen" class="btn su-046678">📓 Abrir Gratitud</button></div></div>')
    + (hb.horario === false ? '' : '<div class="today-card"><h3>📚 Horario de hoy</h3><div id="todaySchedBox">'
    + (function(){ try{ const d=(typeof getScheduleData==='function'?getScheduleData():null); if(!d||!d.items||!d.items.length) return '<p class="muted su-11a508">Sin horario creado.</p>'; const wd=new Date().getDay(); const t=d.items.filter(function(x){return parseInt(x.day)===wd;}).sort(function(a,b){return String(a.start).localeCompare(String(b.start));}); if(!t.length) return '<p class="muted su-11a508">Hoy no tienes clases. ¡Aprovecha la luna!</p>'; return t.map(function(it){return '<div class="hora-item"><span class="su-11a508"><b>'+escapeHtml(it.subject)+'</b> '+escapeHtml(it.start)+'–'+escapeHtml(it.end)+(it.place?' · '+escapeHtml(it.place):'')+'</span></div>';}).join(''); }catch(e){ return ''; } })()
    + '</div><div class="su-8a77e5"><button type="button" id="todaySchedOpen" class="btn su-046678">📚 Abrir Horario</button></div></div>')
    + (hb.entreno === false ? '' : '<div class="today-card"><h3>💪 Entrenamiento de hoy</h3><div id="todayGymBox">'
    + (function(){ try{ const d=(typeof getGymData==='function'?getGymData():null); if(!d||!d.items||!d.items.length) return '<p class="muted su-11a508">Sin entrenamientos creados.</p>'; const wd=new Date().getDay(); const t=d.items.filter(function(x){return parseInt(x.day)===wd;}).sort(function(a,b){return String(a.start).localeCompare(String(b.start));}); if(!t.length) return '<p class="muted su-11a508">Hoy no tienes entrenamientos programados.</p>'; const comp=(d.completions&&d.completions[key])||{}; return '<div class="habits-today-grid">'+t.map(function(it){ const done=!!comp[it.id]; return '<label class="habit-today-item '+(done?'done':'')+'"><input type="checkbox" data-gid="'+it.id+'" '+(done?'checked':'')+'><span>'+escapeHtml(it.name)+'</span><span class="muted su-0d5be0"> · '+escapeHtml(it.start||'')+(it.place?' · '+escapeHtml(it.place):'')+'</span></label>'; }).join('')+'</div>'; }catch(e){ return ''; } })()
    + '</div><div class="su-8a77e5"><button type="button" id="todayGymOpen" class="btn su-046678">💪 Abrir Entrenamientos</button></div></div>')
    + (hb.medicina === false ? '' : '<div class="today-card"><h3>💊 Medicina de hoy</h3><div id="todayMedicBox">'
    + (function(){ try{ const d=(typeof getMedicData==='function'?getMedicData():null); if(!d||!d.list||!d.list.length) return '<p class="muted su-11a508">Sin medicamentos registrados.</p>'; return d.list.slice(0,4).map(function(m){return '<div class="hora-item"><span class="su-11a508">💊 <b>'+escapeHtml(m.name)+'</b> '+(m.dose?'· '+escapeHtml(m.dose):'')+' · ⏰ '+escapeHtml(m.time||'')+'</span></div>';}).join('')+(d.list.length>4?'<p class="muted su-0d5be0">+'+(d.list.length-4)+' más...</p>':''); }catch(e){ return ''; } })()
    + '</div><div class="su-8a77e5"><button type="button" id="todayMedicOpen" class="btn su-046678">💊 Abrir Medicina</button></div></div>')
    + (hb.siembra === false ? '' : '<div class="today-card"><h3>🌱 Consejo siembra lunar</h3>'
    + (function(){ try{ if(isDFT) return '<p class="su-6cb285">✷ Día Fuera del Tiempo: no siembres. Compost, ordena semillas y planifica.</p>'; const il=(typeof illum==='number'?illum:null); let txt=''; if(il===null) txt='Observa la luna esta noche y decide: ¿crece o mengua?'; else if(il<10) txt='🌑 Luna nueva: descanso. Haz compost, prepara suelo, ordena el semillero.'; else if(il<45) txt='🌒 Creciente: siembra hojas y frutos (lechuga, acelga, tomate). Buen trasplante.'; else if(il<55) txt='🌓 Cuarto creciente: pico de siembra. Riega moderado, asocia y aporca.'; else if(il<90) txt='🌔 Gibosa: cuida y deshierba. No podes fuerte; vigila plagas.'; else txt='🌕 Luna llena: cosecha hojas y semillas. Evita podar y trasplantar.'; return '<p class="su-6cb285">'+txt+'</p>'+(lunaN&&diaN?'<p class="muted su-11a508">Luna '+lunaN+' · día '+diaN+'/28'+(illum!==null?' · '+illum+'% iluminada':'')+'</p>':''); }catch(e){ return ''; } })()
    + '<div class="su-8a77e5"><button type="button" id="todaySiembraOpen" class="btn su-046678">🌱 Abrir Siembra lunar</button></div></div>')
    + (hb.espiritual === false ? '' : '<div class="today-card"><h3>🕉️ Práctica espiritual</h3><div id="todayEspBox">'
    + (function(){ try{ const k2=(typeof espTodayKey==='function'?espTodayKey():key); const d=(typeof getEspiritualData==='function'?getEspiritualData():null); const n=(d&&d.done&&d.done[k2]&&typeof d.done[k2]==='object')?Object.keys(d.done[k2]).filter(function(pid){return d.done[k2][pid];}).length:0; let t=27; try{ if(typeof getAllEspPractices==='function') t=getAllEspPractices().length||t; }catch(e){} return '<p class="su-6cb285">Hoy llevas <b>'+n+'/'+t+'</b> prácticas.</p>'+(n?'':'<p class="muted su-11a508">Parte con 1: sol de mañana, STOP 1 min o gratitud.</p>'); }catch(e){ return ''; } })()
    + '</div><div class="su-8a77e5"><button type="button" id="todayEspOpen" class="btn su-046678">🕉️ Abrir Prácticas</button></div></div>')
    + (hb.ritmo === false ? '' : '<div class="today-card"><h3>🌞 Ritmo + hora dorada</h3><div id="todayRitmoBox">'
    + (function(){ try{ let fase=''; try{ const hr=now.getHours()+now.getMinutes()/60; const idx=(typeof getCircadianPhase==='function'?getCircadianPhase(hr):-1); const p=(typeof CIRCADIAN_PHASES!=='undefined'&&idx>=0?CIRCADIAN_PHASES[idx]:null); if(p) fase=p.icon+' <b>'+escapeHtml(p.label)+'</b> · '+escapeHtml(p.desc||''); }catch(e){} let dor=''; try{ const g=(typeof getGoldenForDay==='function'?getGoldenForDay(noonMs):null); if(g){ const f=function(ms){ try{ return new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(ms)); }catch(e){ return '--'; } }; dor='<br>📸 Dorada AM <b>'+f(g.goldenAM[0])+'–'+f(g.goldenAM[1])+'</b> · PM <b>'+f(g.goldenPM[0])+'–'+f(g.goldenPM[1])+'</b>'; } }catch(e){} if(!fase&&!dor) return '<p class="muted su-11a508">Sin datos de ritmo.</p>'; return '<p class="su-6cb285">'+fase+dor+'</p>'; }catch(e){ return ''; } })()
    + '</div><div class="su-67b198"><button type="button" id="todayRitmoOpen" class="btn su-1ce0dc">🌞 Abrir Ritmo</button><button type="button" id="todayGoldenOpen" class="btn su-1ce0dc">📸 Hora Dorada</button></div></div>')
    + (hb.ekadashi === false ? '' : '<div class="today-card"><h3>📿 Ekadashi / ayuno</h3>'
    + (function(){ try{ let t=null; try{ t=(window.astro&&typeof window.astro.tithi==='function'?window.astro.tithi(noonMs):null); }catch(e){} if(t===11) return '<p class="su-6cb285">🌙 <b>Hoy es Ekadashi Shukla</b> (tithi 11). Día de aligerar: fruta, agua, calma.</p>'; if(t===26) return '<p class="su-6cb285">🌙 <b>Hoy es Ekadashi Krishna</b> (tithi 26). Día de aligerar: fruta, agua, calma.</p>'; if(typeof t==='number') return '<p class="muted su-11a508">Hoy tithi '+t+'. Ekadashi cae en tithi 11 y 26 — el próximo se marca en 📿 Ekadashi.</p>'; return '<p class="muted su-11a508">Revisa en 📿 Ekadashi si hoy toca ayuno suave.</p>'; }catch(e){ return ''; } })()
    + '<div class="su-8a77e5"><button type="button" id="todayEkaOpen" class="btn su-046678">📿 Abrir Ekadashi</button></div></div>')
    + (hb.pesca === false ? '' : '<div class="today-card"><h3>🎣 Pesca hoy</h3><p class="muted su-11a508">Pique según luna y pleamar: amanecer y 2h alrededor de pleamar (ver 🌊 Mareas). Respeta vedas y tallas.</p><div class="su-67b198"><button type="button" data-go="btnFishing" class="btn su-1ce0dc">🎣 Abrir Pesca</button><button type="button" data-go="btnTides" class="btn su-1ce0dc">🌊 Mareas</button></div></div>')
    + (hb.bosque === false ? '' : '<div class="today-card"><h3>🌳 Bosque hoy</h3><p class="muted su-11a508">Menguante otoñal: plantar y podar. Creciente primavera: esquejes. Cosecha solo el 30%, deja el resto al bosque.</p><div class="su-8a77e5"><button type="button" data-go="btnBosque" class="btn su-046678">🌳 Abrir Bosque Nativo</button></div></div>')
    + (hb.aves === false ? '' : '<div class="today-card"><h3>🦅 Aves hoy</h3><p class="muted su-11a508">Amanecer y pleamar: mayor canto y movimiento en Rocuant y costa. Observa sin molestar.</p><div class="su-8a77e5"><button type="button" data-go="btnBirds" class="btn su-046678">🦅 Abrir Aves</button></div></div>')
    + (hb.huerta === false ? '' : '<div class="today-card"><h3>🥬 Huerta hoy</h3><p class="muted su-11a508">Riega temprano, deshierba en gibosa y siembra hojas en creciente. Revisa bancales y cosechas en kg.</p><div class="su-67b198"><button type="button" data-go="btnHuerta" class="btn su-1ce0dc">🥬 Abrir Huerta</button><button type="button" data-go="btnCompost" class="btn su-1ce0dc">🪱 Compost</button></div></div>')
    + (hb.estudio === false ? '' : '<div class="today-card"><h3>🧠 Estudio hoy</h3><p class="muted su-11a508">25 min de foco + 5 de pausa. Repasa con Feynman: explica en voz alta lo de hoy.</p><div class="su-67b198"><button type="button" data-go="btnStudy" class="btn su-1ce0dc">🧠 Abrir Estudio</button><button type="button" data-go="btnMapu" class="btn su-1ce0dc">🗣️ Kimün</button></div></div>')
    + (hb.cuentos === false ? '' : '<div class="today-card"><h3>📖 Cuento de la luna</h3>'
    + (function(){ try{ if(isDFT) return '<p class="su-6cb285">✷ Día Fuera del Tiempo: lee el cuento de cierre y agradece el ciclo.</p>'; return '<p class="muted su-11a508">Luna '+(lunaN||'actual')+': un cuento por luna antes de dormir. También está 🧒 Crianza y 🗣️ Voz de los Abuelos.</p>'; }catch(e){ return ''; } })()
    + '<div class="su-67b198"><button type="button" data-go="btnTales" class="btn su-1ce0dc">📖 Abrir Cuentos</button><button type="button" data-go="btnVozAbuelos" class="btn su-1ce0dc">🗣️ Abuelos</button></div></div>')
    + (hb.familia === false ? '' : '<div class="today-card"><h3>🌳 Familia y linaje</h3><p class="muted su-11a508">Honra una historia hoy: una voz, una foto o un nombre de tu árbol.</p><div class="su-67b198"><button type="button" data-go="btnArbolFull" class="btn su-1ce0dc">🌳 Abrir Árbol</button><button type="button" data-go="btnDueloFull" class="btn su-1ce0dc">🕊️ Duelo</button></div></div>')
    + (hb.emergencia === false ? '' : '<div class="today-card"><h3>🚨 Emergencia Penco</h3><p class="muted su-11a508">132 Bomberos · 133 Carabineros · 131 SAMU · *4141 crisis. Punto alto ante tsunami: sube al cerro.</p><div class="su-67b198"><button type="button" data-go="btnEvac" class="btn su-1ce0dc">🌊▲ Evacuación</button><button type="button" data-go="btnFirstAid" class="btn su-1ce0dc">🩹 Auxilios</button></div></div>')
    + (hb.comunidad === false ? '' : '<div class="today-card"><h3>🤝 Comunidad hoy</h3><p class="muted su-11a508">Minga, trueque y moneda social: ofrece una hora, pide una mano.</p><div class="su-67b198"><button type="button" data-go="btnMinga" class="btn su-1ce0dc">🤝 Minga</button><button type="button" data-go="btnTrueque" class="btn su-1ce0dc">🔄 Trueque</button></div></div>')
    + (hb.energia === false ? '' : '<div class="today-card"><h3>🔧 Energía y hogar</h3><p class="muted su-11a508">Leña seca (&lt;25% humedad) y consumo a la vista: anota kWh y compara por luna.</p><div class="su-67b198"><button type="button" data-go="btnEnergy" class="btn su-1ce0dc">⚡ Consumo</button><button type="button" data-go="btnLena" class="btn su-1ce0dc">🪵 Leña</button></div></div>');
  // --- ánimo: sugerencia + expandir opciones ---
  const main = $('todayMoodMain'), picker = $('todayMoodPicker');
  const paintPicker = ()=>{
    if(!picker) return;
    picker.innerHTML='';
    MOODS.forEach((m,i)=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='mood-btn'+(i===animo?' sel':'');
      b.title=m.n; b.textContent=m.e;
      b.onclick=()=>{
        animo = (animo===i) ? -1 : i;
        try{
          if(!isDFT){ const c=dayCell(lunaN,diaN); c.animo=animo; scheduleSave('Guardado ✓'); }
        }catch(e){}
        renderTodayView();
      };
      picker.appendChild(b);
    });
  };
  if(main && picker){
    main.onclick=()=>{ picker.classList.toggle('hidden'); if(!picker.classList.contains('hidden') && !picker.innerHTML) paintPicker(); };
  }
  // --- notas ---
  const noteEl = $('todayNote');
  if(noteEl){
    noteEl.addEventListener('input', ()=>{
      try{
        if(isDFT){ cyc(info.y).dft.nota = sanitizeText(noteEl.value, 2000); }
        else { dayCell(lunaN,diaN).nota = sanitizeText(noteEl.value, 2000); }
        scheduleSave();
      }catch(e){}
    });
  }
  // --- agenda ---
  const paintAgenda = ()=>{
    const list = $('todayAgendaList');
    if(!list) return;
    let cur2=[];
    try{ cur2 = isDFT? [] : [...dayCell(lunaN,diaN).agenda].sort((a,b)=> getAgendaTime(a).localeCompare(getAgendaTime(b))); }catch(e){ cur2=[]; }
    if(!cur2.length){ list.innerHTML='<p class="muted su-11a508">Sin compromisos aún. Agrega uno con su hora abajo (ej 08:37).</p>'; return; }
    list.innerHTML='';
    cur2.forEach(it=>{
      const row=document.createElement('div');
      row.className='today-agenda-item';
      const t=getAgendaTime(it);
      row.innerHTML='<span class="hh">'+escapeHtml(t)+'</span><span class="tx">'+escapeHtml(it.text)+'</span>';
      const nb=document.createElement('button');
      nb.type='button'; nb.className='btn btn-icon'; nb.title='Notificación'; nb.textContent=it.notify?'🔔':'🔕';
      nb.onclick=async()=>{
        if(!it.notify){ try{ if(typeof Notification!=='undefined'&&Notification.permission!=='granted'&&Notification.requestPermission) await Notification.requestPermission(); }catch(e){} }
        it.notify=!it.notify; it.notified=false; scheduleSave(); paintAgenda();
      };
      const db=document.createElement('button');
      db.type='button'; db.className='btn btn-icon'; db.title='Eliminar'; db.textContent='✕';
      db.onclick=()=>{
        try{
          const c=dayCell(lunaN,diaN);
          c.agenda=c.agenda.filter(x=>x.id!==it.id);
          scheduleSave(); paintAgenda();
        }catch(e){}
      };
      const wrap=document.createElement('span');
      wrap.style.cssText='display:flex;gap:6px;flex:0 0 auto';
      wrap.appendChild(nb); wrap.appendChild(db);
      row.appendChild(wrap);
      list.appendChild(row);
    });
  };
  paintAgenda();
  const addBtn = $('todayHourAdd');
  if(addBtn){
    addBtn.onclick=async()=>{
      const sel=$('todayHourSel'), tx=$('todayHourText'), ch=$('todayHourNotify');
      const raw=((sel&&sel.value)||'').trim();
      if(!/^\d{1,2}:\d{2}/.test(raw)) return alert('Elige una hora válida (ej 08:37)');
      const parts=raw.split(':').map(Number);
      if(parts[0]<0||parts[0]>23||parts[1]<0||parts[1]>59) return alert('Hora inválida (00:00 a 23:59)');
      const text=sanitizeText(((tx&&tx.value)||'').trim(),80);
      if(!text) return;
      const notify=!!(ch&&ch.checked);
      if(notify){ try{ if(typeof Notification!=='undefined'&&Notification.permission!=='granted'&&Notification.requestPermission) await Notification.requestPermission(); }catch(e){} }
      try{
        const c=dayCell(lunaN,diaN);
        if(!Array.isArray(c.agenda)) c.agenda=[];
        const ts=String(parts[0]).padStart(2,'0')+':'+String(parts[1]).padStart(2,'0');
        c.agenda.push({id:'a'+Date.now()+Math.random().toString(36).slice(2,4), hour:parts[0], minute:parts[1], time:ts, text, notify, notified:false});
        scheduleSave('Guardado ✓');
        if(tx) tx.value=''; if(ch) ch.checked=false;
        paintAgenda();
      }catch(e){}
    };
    const tx2=$('todayHourText');
    if(tx2) tx2.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addBtn.click(); } });
  }
  const openBtn = $('todayOpenDay');
  if(openBtn) openBtn.onclick=()=>{
    try{
      if(String(info.y)!==String(currentCycleYear())) selectCycle(info.y, lunaN);
      openDayDialog(lunaN, diaN);
    }catch(e){}
  };
  // --- hábitos de hoy ---
  try{
    const hb=$('todayHabitsBox');
    if(hb) hb.querySelectorAll('input[data-id]').forEach(cb=> cb.onchange=()=>{
      try{ habitToggle(key, cb.dataset.id); }catch(e){}
      scheduleSave();
      const lab=cb.closest('label'); if(lab){ if(cb.checked) lab.classList.add('done'); else lab.classList.remove('done'); }
      try{ if($('todayRutinaResumen')) paintTodayRutinas(); }catch(e2){}
    });
  }catch(e){}
  // --- 🌅 MI DÍA: tarjeta compacta (resumen) — editor completo vive en Rutinas ---
  function openRutinasSection(){
    try{
      let d=$('rutinasDialog');
      if(!d && window.cal13tpl && typeof window.cal13tpl.inyectar==='function'){ try{ d=window.cal13tpl.inyectar('rutinasDialog'); }catch(e){} }
      if(d){
        try{ if(typeof renderRutinasDialog==='function') renderRutinasDialog(); }catch(e){}
        try{
          if(!d.dataset.hoyCloseBound){
            d.dataset.hoyCloseBound='1';
            d.addEventListener('close', function(){ try{ if(typeof viewMode!=='undefined'&&viewMode==='hoy'&&typeof renderTodayView==='function') renderTodayView(); }catch(e){} });
          }
        }catch(e){}
        try{ d.showModal(); return; }catch(e){}
      }
    }catch(e){}
    try{ const b=$('btnRutinas'); if(b){ b.click(); return; } }catch(e){}
    try{ showMobileView('hoy'); }catch(e){}
  }
  function paintTodayRutinas(){
    const box=$('todayRutinaResumen');
    if(!box) return;
    let dia=null, habs=[], agenda=[], sched=[], wd=new Date().getDay();
    try{ dia=getRutinaDia(key); }catch(e){ return; }
    try{ const hd=getHabitData(); habs=(hd&&hd.list)||[]; }catch(e){ habs=[]; }
    try{ agenda=isDFT?[]:[...dayCell(lunaN,diaN).agenda]; }catch(e){ agenda=[]; }
    try{ const sd=getScheduleData(); sched=(sd&&sd.items)||[]; }catch(e){ sched=[]; }
    try{
      const prog=rutinaProgresoDia(key);
      const pb=$('todayRutinaProg');
      if(pb) pb.innerHTML='<p class="muted su-11a508">✅ '+prog.done+'/'+prog.total+' bloques completados hoy</p>';
    }catch(e){}
    try{
      const slots=(typeof RUTINA_SLOTS!=='undefined'&&RUTINA_SLOTS.length)?RUTINA_SLOTS:[
        {id:'manana',ico:'🌅',nombre:'Mañana'},{id:'tarde',ico:'☀️',nombre:'Tarde'},{id:'noche',ico:'🌙',nombre:'Noche'}
      ];
      const rows=slots.map(function(slot){
        const st=(dia&&dia[slot.id])||{ texto:'', habitos:[], done:false };
        const txt=String(st.texto||'').trim();
        const short=txt.length>90?txt.slice(0,90).trim()+'…':txt;
        let habHechos=0, habTot=0, compN=0;
        try{
          const vinc=(st.habitos||[]).map(function(id){ return habs.find(function(h){return h.id===id;}); }).filter(Boolean);
          habTot=vinc.length;
          habHechos=vinc.filter(function(h){ try{ return habitIsDone(key,h.id); }catch(e){ return !!(getHabitData().entries[key]&&getHabitData().entries[key][h.id]); } }).length;
        }catch(e){}
        try{ compN=rutinaCompromisosPorSlot(agenda, slot.id).length+rutinaHorarioPorSlot(sched, wd, slot.id).length; }catch(e){}
        const ico=slot.ico||'•';
        const nom=slot.nombre||slot.id;
        const marca=st.done?'✅ ':'';
        const linea=short?escapeHtml(short):'<span class="muted su-0d5be0">Sin plan aún</span>';
        return '<div class="hora-item"><span class="su-11a508">'+ico+' <b>'+escapeHtml(nom)+'</b> '+marca+'· '+linea
          +'<br><span class="muted su-0d5be0">✅ '+habHechos+'/'+habTot+' hábitos · 🕐 '+compN+' compromisos</span></span></div>';
      }).join('');
      const vacio=!slots.some(function(s){ return String((dia&&dia[s.id]&&dia[s.id].texto)||'').trim(); });
      box.innerHTML='<div class="today-agenda-list">'
        +(vacio?'<p class="muted su-11a508">Sin plan aún hoy. Toca “Abrir Mi Día” para escribir mañana · tarde · noche.</p>':'')
        +rows+'</div>';
    }catch(e){ box.innerHTML=''; }
  }
  try{ paintTodayRutinas(); }catch(e){}
  try{
    const openBtn=$('todayRutinaOpen');
    if(openBtn) openBtn.onclick=function(){ openRutinasSection(); };
  }catch(e){}
  // --- marcar inicio de ciclo menstrual ---
  try{
    const mb=$('todayMensBtn');
    if(mb){
      const paintMens=()=>{
        try{
          const md=getMensData();
          const is=md.history.includes(key);
          mb.textContent = is ? '🌸 Quitar inicio' : '🌸 Inicio ciclo';
          mb.classList.toggle('btn-accent', is);
        }catch(e){}
      };
      paintMens();
      mb.onclick=()=>{
        try{
          const md=getMensData();
          if(md.history.includes(key)) md.history=md.history.filter(k=>k!==key);
          else { md.history.push(key); md.history.sort(); }
          scheduleSave('Guardado ✓'); paintMens();
          try{ mensRefreshAll(); }catch(e){}
        }catch(e){}
      };
    }
  }catch(e){}
  // --- compartir día (imagen) ---
  try{
    const sb=$('todayShareBtn');
    if(sb) sb.onclick=async()=>{
      try{
        const dataUrl=buildShareImage(lunaN, diaN);
        const res=await window.api.imageSave(dataUrl, 'Luna '+lunaN+' · Día '+diaN+' de 28.png');
        if($('statusMsg')){ $('statusMsg').textContent = res ? 'Imagen guardada ✓' : 'Cancelado'; setTimeout(()=>{$('statusMsg').textContent='';},2500); }
      }catch(e){ alert('No se pudo compartir este día'); }
    };
  }catch(e){}
  // --- 💭 SUEÑOS → Diario aparte (suenosLog), no a la nota ---
  try{
    const ds=$('todayDreamSave');
    if(ds) ds.onclick=()=>{
      try{
        const t=(($('todayDreamText')||{}).value||'').trim();
        if(!t) return alert('Escribe tu sueño primero');
        const txt=sanitizeText(t,800);
        todaySuenosList().push({ id:'su'+Date.now().toString(36)+Math.random().toString(36).slice(2,4), fecha:key, titulo:txt.split(/\n|。|\./)[0].slice(0,60)||'Sueño', tipo:'🌊 Común', texto:txt, arq:'', emo:'', viv:0, msg:'', luc:false });
        scheduleSave('Sueño guardado en tu Diario ✓');
        try{ if(typeof window!=='undefined' && window.SuenosPenco && typeof window.SuenosPenco.render==='function') window.SuenosPenco.render(); }catch(e){}
        renderTodayView();
      }catch(e){}
    };
    const dop=$('todayDreamOpen');
    if(dop) dop.onclick=()=>{ try{ $('btnDreams').click(); }catch(e){} };
  }catch(e){}
  // --- 🥗 COMIDAS ---
  try{
    const mb2=$('todayMealB'), ml=$('todayMealL'), md2=$('todayMealD');
    try{ const e=(typeof getMealData==='function'?getMealData().entries[key]:null)||{}; if(mb2&&!mb2.value) mb2.value=e.breakfast||''; if(ml&&!ml.value) ml.value=e.lunch||''; if(md2&&!md2.value) md2.value=e.dinner||''; }catch(e){}
    const ms=$('todayMealSave');
    if(ms) ms.onclick=()=>{ try{ const d=getMealData(); const e=d.entries[key]||(d.entries[key]={}); e.breakfast=sanitizeText((mb2.value||'').trim(),120); e.lunch=sanitizeText((ml.value||'').trim(),120); e.dinner=sanitizeText((md2.value||'').trim(),120); scheduleSave('Comidas guardadas ✓'); renderTodayView(); }catch(e){} };
    const mop=$('todayMealOpen');
    if(mop) mop.onclick=()=>{ try{ $('btnMeal').click(); }catch(e){} };
  }catch(e){}
  // --- 🏠 TAREAS HOGAR ---
  try{
    const tb=$('todayHomeTasksBox');
    const paintTodayTasks=()=>{
      if(!tb) return;
      try{
        const list=(typeof homeTasksForDate==='function'?homeTasksForDate(key):[]);
        const ht=getHomeTasksData(); const comp=(ht.completions[key]||{});
        if(!list.length){ tb.innerHTML='<p class="muted su-11a508">Sin tareas para hoy.</p>'; return; }
        tb.innerHTML='<div class="habits-today-grid">'+list.map(t=>{ const done=!!comp[t.id]; return '<label class="habit-today-item '+(done?'done':'')+'"><input type="checkbox" data-tid="'+t.id+'" '+(done?'checked':'')+'><span>'+escapeHtml(t.name)+'</span><span class="muted su-0d5be0"> · '+escapeHtml(t.time)+'′</span></label>'; }).join('')+'</div>';
        tb.querySelectorAll('input[data-tid]').forEach(cb=> cb.onchange=()=>{ try{ const h=getHomeTasksData(); if(!h.completions[key]) h.completions[key]={}; if(cb.checked) h.completions[key][cb.dataset.tid]=true; else delete h.completions[key][cb.dataset.tid]; scheduleSave(); const lab=cb.closest('label'); if(lab){ if(cb.checked) lab.classList.add('done'); else lab.classList.remove('done'); } }catch(e){} });
      }catch(e){}
    };
    paintTodayTasks();
    const top2=$('todayHomeTasksOpen');
    if(top2) top2.onclick=()=>{ try{ $('btnHomeTasks').click(); }catch(e){} };
  }catch(e){}
  // --- 🛒 COMPRAS ---
  try{
    const sb2=$('todayShopBox');
    const paintTodayShop=()=>{
      if(!sb2) return;
      try{
        const items=getShoppingData().items;
        const pend=items.filter(x=>!x.done);
        if(!items.length){ sb2.innerHTML='<p class="muted su-11a508">Lista vacía.</p>'; return; }
        sb2.innerHTML='<p class="muted su-11a508">'+pend.length+' pendientes / '+items.length+' total</p><div class="habits-today-grid">'+pend.slice(0,6).map(it=>'<label class="habit-today-item"><input type="checkbox" data-sid="'+it.id+'"><span>'+escapeHtml(it.name)+'</span><span class="muted su-0d5be0"> · '+escapeHtml(it.qty||'')+'</span></label>').join('')+'</div>';
        sb2.querySelectorAll('input[data-sid]').forEach(cb=> cb.onchange=()=>{ try{ const it=getShoppingData().items.find(x=>x.id===cb.dataset.sid); if(it) it.done=cb.checked; scheduleSave(); paintTodayShop(); }catch(e){} });
      }catch(e){}
    };
    paintTodayShop();
    const sa=$('todayShopAdd');
    if(sa) sa.onclick=()=>{ try{ const v=(($('todayShopText')||{}).value||'').trim(); if(!v) return; getShoppingData().items.push({id:'s'+Date.now(),name:sanitizeText(v,60),qty:'',cat:'General',done:false}); scheduleSave('Agregado ✓'); $('todayShopText').value=''; paintTodayShop(); }catch(e){} };
    const sop=$('todayShopOpen');
    if(sop) sop.onclick=()=>{ try{ $('btnShopping').click(); }catch(e){} };
  }catch(e){}
  // --- 💰 FINANZAS ---
  try{
    const fb=$('todayFinanceBox');
    const paintTodayFin=()=>{
      if(!fb) return;
      try{
        const list=getFinanceData().entries.filter(e=>e.date===key);
        let g=0,i=0; list.forEach(e=>{ const v=parseInt(e.monto)||0; if(e.tipo==='gasto') g+=v; else i+=v; });
        fb.innerHTML='<div class="today-sun"><span class="chip">💸 Gastos <b>'+formatCLP(g)+'</b></span><span class="chip">💵 Ingresos <b>'+formatCLP(i)+'</b></span><span class="chip">🧾 '+list.length+' mov.</span></div>'
          + (list.length? '<div class="su-fe7b49">'+list.slice(-4).reverse().map(e=>'<div class="hora-item"><span class="su-11a508">'+(e.tipo==='gasto'?'💸':'💵')+' '+escapeHtml(e.desc||e.categoria||'')+' · <b>'+formatCLP(e.monto)+'</b></span></div>').join('')+'</div>' : '<p class="muted su-e13d76">Sin movimientos hoy.</p>');
      }catch(e){}
    };
    paintTodayFin();
    const fa=$('todayFinAdd');
    if(fa) fa.onclick=()=>{ try{ const m=parseInt(($('todayFinMonto')||{}).value)||0; if(!m) return alert('Ingresa un monto'); const d=(($('todayFinDesc')||{}).value||'').trim()||'Movimiento'; const t=($('todayFinTipo')||{}).value||'gasto'; getFinanceData().entries.push({id:'f'+Date.now(),date:key,tipo:t,monto:m,desc:sanitizeText(d,60),categoria:t==='gasto'?'Otros':'Otros'}); scheduleSave('Guardado ✓'); paintTodayFin(); $('todayFinMonto').value=''; $('todayFinDesc').value=''; }catch(e){} };
    const fop=$('todayFinOpen');
    if(fop) fop.onclick=()=>{ try{ $('btnFinance').click(); }catch(e){} };
  }catch(e){}
  // --- 🎯 DISCIPLINA ---
  try{
    const dm=$('todayDiscMIT');
    try{ const t=discGetToday(); if(dm&&!dm.value) dm.value=t.mit||''; }catch(e){}
    const dsv=$('todayDiscSave');
    if(dsv) dsv.onclick=()=>{ try{ const t=discGetToday(); t.mit=sanitizeText((dm.value||'').trim(),120); getDisciplineData().mit=t.mit; scheduleSave('MIT guardado ✓'); renderTodayView(); }catch(e){} };
    const ddone=$('todayDiscDone');
    if(ddone) ddone.onclick=()=>{ try{ const t=discGetToday(); if(dm&&dm.value.trim()){ t.mit=sanitizeText(dm.value.trim(),120); getDisciplineData().mit=t.mit; } t.done=true; scheduleSave('MIT cumplido 🔥'); renderTodayView(); }catch(e){} };
    const dop2=$('todayDiscOpen');
    if(dop2) dop2.onclick=()=>{ try{ $('btnDiscipline').click(); }catch(e){} };
  }catch(e){}
  // --- 🌬️ RESPIRACIÓN / 🌸 CICLO accesos + 🌤️⛵ CLIMA Y MAREAS (solo info) ---
  try{
    const br=$('todayBreathOpen'); if(br) br.onclick=()=>{ try{ $('btnBreath').click(); }catch(e){} };
    const co=$('todayCicloOpen'); if(co) co.onclick=()=>{ try{ $('btnMenstrual').click(); }catch(e){} };
    const cb2=$('todayCicloBox');
    const paintCiclo=()=>{
      if(!cb2) return;
      try{
        const md=getMensData(); const is=md.history.includes(key);
        let txt='';
        try{ const p=(typeof getMensPredictions==='function'?getMensPredictions():null); if(p&&p.nextPeriodMs){ const tKey=mensMsToKey(p.nextPeriodMs); const days=Math.round((mensKeyToMs(tKey)-mensKeyToMs(key))/86400000); txt = days===0? 'Predicción: periodo <b>hoy</b>' : days===1? 'Predicción: periodo <b>mañana</b>' : days<0? 'Periodo con <b>'+Math.abs(days)+' días de retraso</b> (promedio '+p.cycleLen+'d)' : 'Predicción: periodo en <b>'+days+' días</b> ('+escapeHtml(tKey)+')'; } else txt='Sin predicción: registra tu último inicio.'; }catch(e){ txt=''; }
        let faseTxt='';
        try{ const cur=(typeof mensCurrentDay==='function'?mensCurrentDay():null); if(cur){ const ph=mensPhaseForDay(cur.day, cur.avg, getMensData().periodLen); faseTxt=`<br>Día <b>${cur.day}/${cur.avg}</b> · ${ph.ico} ${ph.nombre}`; } }catch(e){}
        cb2.innerHTML='<p class="su-6cb285">'+txt+faseTxt+'</p><p class="muted su-11a508">Hoy: '+(is?'<b class="su-e39eba">● inicio marcado</b>':'sin marca')+'</p>';
      }catch(e){}
    };
    paintCiclo();
    const cm=$('todayCicloMark');
    if(cm) cm.onclick=()=>{ try{ const md=getMensData(); if(md.history.includes(key)) md.history=md.history.filter(k=>k!==key); else { md.history.push(key); md.history.sort(); } scheduleSave('Guardado ✓'); paintCiclo(); }catch(e){} };
    // --- 🌊 MAREAS: actual + 2 siguientes (offline, tabla SHOA precargada) ---
    try{
      const tbx=$('todayTideBox');
      if(tbx){
        let html='';
        try{
          const ahoraHM=(cal.fmtTime.format(new Date()).slice(0,5));
          const now=new Date();
          const keyOf=(diff)=>{ const d=new Date(now.getTime()); d.setDate(d.getDate()+diff); return cal.fmtKey.format(d); };
          const hoyK=key, ayerK=keyOf(-1), manK=keyOf(1);
          const hoy=(typeof getTidesForKey==='function'?getTidesForKey(hoyK.slice(5)).tides:[])||[];
          const ayer=(typeof getTidesForKey==='function'?getTidesForKey(ayerK.slice(5)).tides:[])||[];
          const man=(typeof getTidesForKey==='function'?getTidesForKey(manK.slice(5)).tides:[])||[];
          let res={actual:null,siguientes:[]};
          if(window.InfoClave&&typeof window.InfoClave.mareasActuales==='function'){ res=window.InfoClave.mareasActuales(ahoraHM,hoy,ayer,man); }
          else { let i=-1; hoy.forEach((t,k)=>{ if(t.h<=ahoraHM) i=k; }); if(i>=0) res.actual=Object.assign({dia:0},hoy[i]); res.siguientes=hoy.slice(i+1,i+3).map(t=>Object.assign({dia:0},t)); }
          // completar hasta 2 siguientes (ayer+hoy+mañana en orden)
          try{
            const all=[].concat(ayer.map(t=>Object.assign({dia:-1},t)),hoy.map(t=>Object.assign({dia:0},t)),man.map(t=>Object.assign({dia:1},t)));
            let pos=-1;
            if(res.actual){ pos=all.findIndex(t=>t.h===res.actual.h&&t.t===res.actual.t&&t.dia===(res.actual.dia||0)); }
            else if(res.siguientes.length){ const f=res.siguientes[0]; pos=all.findIndex(t=>t.h===f.h&&t.t===f.t&&t.dia===(f.dia||0))-1; }
            if(pos>=0){ res.siguientes=all.slice(pos+1,pos+3); }
            else if(!res.siguientes.length){ res.siguientes=all.filter(t=>t.dia>=0).slice(0,2); }
            else { res.siguientes=res.siguientes.slice(0,2); }
          }catch(e){ res.siguientes=(res.siguientes||[]).slice(0,2); }
          const fmtM=(typeof window.InfoClave!=='undefined'&&window.InfoClave.textoMarea)||((mm)=>(mm.t==='pleamar'?'⬆️':'⬇️')+' '+mm.t+' '+mm.h+(mm.a?' · '+mm.a:'')+(mm.dia===-1?' (ayer)':mm.dia===1?' (mañana)':''));
          if(res.actual||res.siguientes.length){
            html+='<div class="today-sun su-3f367c">';
            if(res.actual){ var _nx0=(res.siguientes&&res.siguientes[0])||null; var _sube=_nx0?(_nx0.t==='pleamar'):null; var _dirIco=(_sube===null)?'🌊':(_sube?'📈':'📉'); var _dirTx=(_sube===null)?'':(_sube?' Subiendo':' Bajando'); html+='<span class="chip chip--now su-68a1a9">'+_dirIco+' Ahora:'+_dirTx+' <b>'+escapeHtml(fmtM(res.actual))+'</b></span>'; }
            res.siguientes.forEach((s,ix)=>{ html+='<span class="chip">Sig '+(ix+1)+': <b>'+escapeHtml(fmtM(s))+'</b></span>'; });
            html+='</div><p class="muted su-cb3213">SHOA Talcahuano · hora local · '+escapeHtml(ahoraHM)+'</p>';
          } else html='<p class="muted su-11a508">Sin mareas para hoy.</p>';
        }catch(e){ html='<p class="muted su-11a508">No se pudo calcular mareas.</p>'; }
        tbx.innerHTML=html;
      }
    }catch(e){}
    // --- 🌤️ CLIMA: próximas 10 horas desde ahora (online Open-Meteo, fallback offline) ---
    try{
      const cbx=$('todayClimaBox');
      if(cbx){
        const seq=(window._todayClimaSeq=(window._todayClimaSeq||0)+1);
        (async()=>{
          try{
            const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),9000);
            const url='https://api.open-meteo.com/v1/forecast?latitude=-36.73194&longitude=-72.9925&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,is_day&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,is_day&timezone=America%2FSantiago&forecast_days=2';
            const r=await fetch(url,{signal:ctrl.signal}); clearTimeout(to);
            if(!r.ok) throw new Error('http '+r.status);
            const j=await r.json();
            if(seq!==window._todayClimaSeq) return;
            let nowKey='';
            try{ const p=cal.santiagoParts(Date.now()); nowKey=p.y+'-'+String(p.m).padStart(2,'0')+'-'+String(p.d).padStart(2,'0')+'T'+String(p.hh).padStart(2,'0'); }
            catch(e){ const d=new Date(); nowKey=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0'); }
            const times=j.hourly.time||[];
            let idx=times.findIndex(t=>t>=nowKey); if(idx<0) idx=0;
            const cur=j.current||{};
            const cw=(typeof wmo==='function'?wmo(cur.weather_code,cur.is_day):{desc:'',ico:'🌤️'});
            const wdir=(typeof dirName==='function'&&cur.wind_direction_10m!=null?dirName(cur.wind_direction_10m):'');
            let html='<div class="today-sun"><span class="chip">'+cw.ico+' Ahora <b>'+Math.round(cur.temperature_2m)+'°</b> · '+escapeHtml(cw.desc)+'</span><span class="chip">💨 <b>'+Math.round(cur.wind_speed_10m)+' km/h '+escapeHtml(wdir)+'</b></span></div><div class="su-83ca52"></div><div class="wp-hrow su-62da06">';
            for(let k=idx;k<Math.min(idx+10,times.length);k++){
              const t=times[k];
              const isD=(j.hourly.is_day&&j.hourly.is_day[k]!==undefined)?j.hourly.is_day[k]:1;
              const hw=(typeof wmo==='function'?wmo(j.hourly.weather_code[k],isD):{desc:'',ico:'🌤️'});
              const pp=j.hourly.precipitation_probability?j.hourly.precipitation_probability[k]:null;
              const ws=j.hourly.wind_speed_10m?Math.round(j.hourly.wind_speed_10m[k]):null;
              html+='<div class="wp-hour'+(k===idx?' now':'')+'" title="'+escapeHtml(hw.desc)+'"><div class="hh">'+t.slice(11,13)+'h</div><div class="hi">'+hw.ico+'</div><div class="ht">'+Math.round(j.hourly.temperature_2m[k])+'°</div><div class="hp">💧'+(pp==null?'–':pp)+'%</div>'+(ws!=null?'<div class="hp">💨'+ws+'</div>':'')+'</div>';
            }
            html+='</div><p class="muted su-cb3213">Open-Meteo · Penco · desde '+escapeHtml(nowKey.slice(11)+'h')+'</p>';
            const el=$('todayClimaBox'); if(el&&seq===window._todayClimaSeq) el.innerHTML=html;
          }catch(e){
            if(seq!==window._todayClimaSeq) return;
            let fb='<p class="muted su-11a508">Sin conexión: referencia del mes.</p>';
            try{ const mes=climaMesOffline(new Date()); fb='<div class="today-sun"><span class="chip">'+mes.icono+' '+escapeHtml(mes.nombre)+' <b>'+mes.tmin+'–'+mes.tmax+'°C</b></span><span class="chip">💧 <b>'+mes.probLluvia+'%</b></span></div><p class="muted su-cb3213">'+escapeHtml(mes.resumen)+'</p>'; }catch(e2){}
            const el=$('todayClimaBox'); if(el) el.innerHTML=fb;
          }
        })();
      }
    }catch(e){}
  }catch(e){}
  // --- BLOQUES HOY: accesos + acciones mínimas (v1.6.0: incluye data-go genérico) ---
  try{
    const go=function(id,btn){ const b=$(id); if(b) b.onclick=function(){ try{ $(btn).click(); }catch(e){} }; };
    go('todayGratOpen','btnGratitud'); go('todaySchedOpen','btnSchedule'); go('todayGymOpen','btnGym');
    go('todayMedicOpen','btnMedic'); go('todaySiembraOpen','btnSiembra'); go('todayEspOpen','btnEspiritual');
    go('todayRitmoOpen','btnCircadian'); go('todayGoldenOpen','btnGolden'); go('todayEkaOpen','btnEkadashi');
    // Botones de los 10 bloques nuevos: data-go="btnX" → clic seguro (si el módulo aún no inyectó el botón, avisa).
    try{
      const box=$('todayView');
      if(box) box.querySelectorAll('button[data-go]').forEach(function(b){
        if(b.dataset.goBound) return; b.dataset.goBound='1';
        b.onclick=function(){
          try{
            const t=$(b.getAttribute('data-go'));
            if(t && t.click){ t.click(); return; }
            try{ if($('statusMsg')){ $('statusMsg').textContent='Activa esa sección en ⚙️ Personalizar'; setTimeout(function(){ $('statusMsg').textContent=''; },2200); } }catch(e){}
          }catch(e){}
        };
      });
    }catch(e){}
    const gs=$('todayGratSave');
    if(gs) gs.onclick=function(){
      try{
        const v=((($('todayGratInput')||{}).value)||'').trim();
        if(!v) return alert('Escribe tu gratitud primero');
        const gd=getGratitudData(); const e=gd.entries[key]||(gd.entries[key]={});
        const txt=sanitizeText(v,120);
        if(!e.t1) e.t1=txt; else if(!e.t2) e.t2=txt; else if(!e.t3) e.t3=txt; else e.t3=(e.t3+' · '+txt).slice(0,120);
        scheduleSave('Gratitud guardada ✨'); renderTodayView();
      }catch(e){}
    };
    const gi=$('todayGratInput');
    if(gi) gi.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); const b=$('todayGratSave'); if(b) b.click(); } });
    try{
      const gb=$('todayGymBox');
      if(gb) gb.querySelectorAll('input[data-gid]').forEach(function(cb){
        cb.onchange=function(){
          try{
            const gd=getGymData();
            if(!gd.completions[key]) gd.completions[key]={};
            if(cb.checked) gd.completions[key][cb.dataset.gid]=true;
            else { delete gd.completions[key][cb.dataset.gid]; if(!Object.keys(gd.completions[key]).length) delete gd.completions[key]; }
            scheduleSave(); const lab=cb.closest('label'); if(lab){ if(cb.checked) lab.classList.add('done'); else lab.classList.remove('done'); }
          }catch(e){}
        };
      });
    }catch(e){}
  }catch(e){}
  // --- reloj vivo con segundos en el encabezado ---
  try{
    if(window._todayClockInt) clearInterval(window._todayClockInt);
    const pad2=n=>String(n).padStart(2,'0');
    window._todayClockInt=setInterval(()=>{
      try{
        const el=$('todayNowTime');
        if(!el){ clearInterval(window._todayClockInt); window._todayClockInt=null; return; }
        if(!isMobileWidth() || mobileSec!=='hoy'){ return; }
        const n=new Date();
        el.textContent=pad2(n.getHours())+':'+pad2(n.getMinutes())+':'+pad2(n.getSeconds());
      }catch(e){}
    }, 1000);
  }catch(e){}
}
function gregMonthLabel(ms){
  const d = new Date(ms);
  const name = d.toLocaleDateString('es-CL',{timeZone:cal.TZ, month:'long', year:'numeric'});
  return name.charAt(0).toUpperCase()+name.slice(1);
}
// Semana gregoriana ISO 8601 (lunes=1). Se calcula con la fecha de Santiago.
function isoWeekNumber(ms){
  try{
    const p = cal.santiagoParts(ms);
    const d = new Date(Date.UTC(p.y, p.m - 1, p.d));
    const dayNum = (d.getUTCDay() + 6) % 7 + 1; // lunes=1 … domingo=7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // jueves de esa semana manda el año
    const isoYear = d.getUTCFullYear();
    const jan1 = new Date(Date.UTC(isoYear, 0, 1));
    const week = Math.ceil((((d - jan1) / 86400000) + 1) / 7);
    return { week, year: isoYear };
  }catch(e){ return null; }
}
// Semana lunar fija dentro de la Luna de 28 días: S1=01-07, S2=08-14, S3=15-21, S4=22-28.
function lunarWeekForMs(ms){
  try{
    const key = cal.fmtKey.format(new Date(ms));
    const ref = lunaMapForKey(key);
    if(!ref || ref.luna === 'dft') return null;
    const semanaIdx = Math.ceil(ref.diaN / 7);
    const diaStart = (semanaIdx - 1) * 7 + 1;
    const diaEnd = diaStart + 6;
    const c = cal.buildCycle(ref.y);
    const days = c.days
      .filter(x => x.luna === ref.luna && x.diaN >= diaStart && x.diaN <= diaEnd)
      .sort((a, b) => a.diaN - b.diaN);
    if(days.length !== 7) return null;
    const keys = days.map(x => cal.fmtKey.format(new Date(x.noonMs)));
    return { y: ref.y, luna: ref.luna, semanaIdx, diaStart, diaEnd, keys, days };
  }catch(e){ return null; }
}
function shiftSemanaLunar(diff){
  const cur = lunarWeekForMs(viewDateMs);
  if(!cur){
    const d = new Date(viewDateMs); d.setDate(d.getDate() + diff * 7);
    viewDateMs = d.getTime(); return;
  }
  let targetY = cur.y, targetLuna = cur.luna, targetIdx = cur.semanaIdx;
  const step = diff > 0 ? 1 : -1;
  for(let s = 0; s < Math.abs(diff); s++){
    targetIdx += step;
    if(targetIdx > 4){ targetIdx = 1; targetLuna++; if(targetLuna > 13){ targetLuna = 1; targetY++; } }
    if(targetIdx < 1){ targetIdx = 4; targetLuna--; if(targetLuna < 1){ targetLuna = 13; targetY--; } }
  }
  try{
    const c = cal.buildCycle(targetY);
    const first = c.days.find(x => x.luna === targetLuna && x.diaN === (targetIdx - 1) * 7 + 1);
    if(first){ viewDateMs = first.noonMs; return; }
  }catch(e){}
  const d = new Date(viewDateMs); d.setDate(d.getDate() + diff * 7);
  viewDateMs = d.getTime();
}
function shiftViewDate(diff){
  const d = new Date(viewDateMs);
  if(viewMode==='mes'){ d.setMonth(d.getMonth()+diff); }
  else if(viewMode==='semana'){ d.setDate(d.getDate()+diff*7); }
  else if(viewMode==='semanaLunar'){ shiftSemanaLunar(diff); renderCurrentView(); return; }
  viewDateMs = d.getTime();
  renderCurrentView();
}
function goViewToday(){ viewDateMs = Date.now(); renderCurrentView(); }
function setupViewBar(){
  const bL=$('viewLuna'), bSL=$('viewSemanaLunar'), bM=$('viewMes'), bS=$('viewSemana');
  if(bL) bL.onclick=()=>{ viewMode='luna'; renderCurrentView(); };
  if(bSL) bSL.onclick=()=>{ viewMode='semanaLunar'; viewDateMs=Date.now(); renderCurrentView(); };
  if(bM) bM.onclick=()=>{ viewMode='mes'; viewDateMs=Date.now(); renderCurrentView(); };
  if(bS) bS.onclick=()=>{ viewMode='semana'; viewDateMs=Date.now(); renderCurrentView(); };
  const pv=$('viewPrev'), nx=$('viewNext'), td=$('viewTodayBtn');
  if(pv) pv.onclick=()=>shiftViewDate(-1);
  if(nx) nx.onclick=()=>shiftViewDate(1);
  if(td) td.onclick=()=>goViewToday();
}
// === Paginador entre lunas (vista Luna, PC y celular) ===
// La barra lateral con las 13 lunas queda oculta en móvil (data-mview=luna),
// así que estos botones ◀ / ▶ + ◉ Hoy permiten desplazarse sin ella.
// En PC también se muestran sobre el calendario.
function shiftLuna(diff){
  try{
    const order = [1,2,3,4,5,6,7,8,9,10,11,12,13,'dft'];
    const cur = (currentView && currentView.tipo==='dft') ? 'dft' : (currentView && currentView.luna) || 1;
    let idx = order.indexOf(cur);
    if(idx<0) idx = 0;
    const next = order[(idx + diff + order.length) % order.length];
    if(next==='dft'){ selectDFT(); }
    else { selectMoon(next); }
    try{ scrollMobileTop(); }catch(e){}
  }catch(e){}
}
function goLunaToday(){
  try{
    const inf = todayInfo();
    if(!inf) return;
    if(String(inf.y)!==String(currentCycleYear())){ selectCycle(inf.y, inf.luna==='dft' ? 'dft' : inf.luna); }
    else if(inf.luna==='dft'){ selectDFT(); }
    else { selectMoon(inf.luna); }
    try{ scrollMobileTop(); }catch(e){}
  }catch(e){}
}
function paintLunaPager(){
  const pager = $('lunaPager'), label = $('lunaPagerLabel');
  if(!pager) return;
  const show = (viewMode==='luna') && currentView && (currentView.tipo==='luna' || currentView.tipo==='dft');
  pager.classList.toggle('hidden', !show);
  if(!show || !label) return;
  try{
    if(currentView.tipo==='dft'){ label.textContent = '✷ DFT · Fuera del Tiempo'; }
    else {
      const n = currentView.luna;
      const name = (typeof MOONS!=='undefined' && MOONS[n-1]) ? MOONS[n-1].nombre : '';
      label.textContent = 'Luna ' + n + '/13' + (name ? ' · ' + name : '');
    }
  }catch(e){}
}
function setupLunaPager(){
  const pv=$('lunaPrev'), nx=$('lunaNext'), td=$('lunaTodayBtn');
  if(pv && !pv.dataset.bound){ pv.dataset.bound='1'; pv.onclick=()=>shiftLuna(-1); }
  if(nx && !nx.dataset.bound){ nx.dataset.bound='1'; nx.onclick=()=>shiftLuna(1); }
  if(td && !td.dataset.bound){ td.dataset.bound='1'; td.onclick=()=>goLunaToday(); }
  // Deslizar ←/→ sobre el calendario también cambia de luna (solo móvil, vista Luna)
  try{
    const zone = $('gridWrap');
    if(zone && !zone.dataset.lunaSwipe){
      zone.dataset.lunaSwipe='1';
      let sx=0, sy=0;
      zone.addEventListener('touchstart', (e)=>{ try{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; }catch(_){} }, {passive:true});
      zone.addEventListener('touchend', (e)=>{
        try{
          if(viewMode!=='luna') return;
          if(!isMobileWidth()) return;
          const t=e.changedTouches[0];
          const dx=t.clientX-sx, dy=t.clientY-sy;
          if(Math.abs(dx)>70 && Math.abs(dy)<60){ shiftLuna(dx<0?1:-1); }
        }catch(_){}
      }, {passive:true});
    }
  }catch(e){}
}
function miniDayCard(key, opts){
  opts = opts||{};
  const ref = lunaMapForKey(key);
  const dt = new Date(key+'T12:00:00');
  const isToday = key===cal.fmtKey.format(new Date());
  const cell = ref ? cellForLunaRef(ref) : null;
  const agenda = (cell && Array.isArray(cell.agenda)) ? [...cell.agenda].sort((a,b)=> agendaTimeStr(a).localeCompare(agendaTimeStr(b))) : [];
  const nota = cell && cell.nota ? cell.nota : '';
  const evs = (typeof phaseMap!=='undefined' && phaseMap[key]) ? phaseMap[key] : [];
  const lunaTxt = ref ? (ref.luna==='dft' ? '✷ DFT' : 'L'+ref.luna+'·D'+ref.diaN) : '';
  const dim = !!opts.dim;
  const wdFull = cal.weekdayName(dt.getTime());
  return `<div class="day-card${isToday?' today':''}" data-key="${key}" style="${dim?'opacity:.45':''};cursor:pointer">
    <div class="dc-day">${escapeHtml(wdFull)} ${dt.getDate()}/${dt.getMonth()+1}</div>
    <div class="dc-head"><span class="dc-n">${dt.getDate()}</span><span class="dc-phases">${evs.map(e=>`<span class="dc-phase" title="${e.tipo}">${e.simbolo}</span>`).join('')}</span><span class="dc-date">${lunaTxt}</span></div>
    <div class="dc-sun">${cal.weekdayName(dt.getTime()).slice(0,3)}</div>
    ${agenda.length? `<div class="dc-clima">🕐 ${agenda.length} · ${escapeHtml(agenda.slice(0,2).map(a=>agendaTimeStr(a)+' '+a.text).join(' · '))}${agenda.length>2?' …':''}</div>`:''}
    ${nota? `<div class="dc-note">${escapeHtml(nota.split('\n')[0])}</div>`:''}
  </div>`;
}
function bindMiniCards(scope){
  (scope||document).querySelectorAll('.day-card[data-key]').forEach(c=>{
    c.onclick=()=>{
      const key=c.dataset.key;
      const ref=lunaMapForKey(key);
      if(ref && ref.luna!=='dft'){
        if(String(ref.y)!==String(currentCycleYear())){
          try{ selectCycle(ref.y, ref.luna); }catch(e){}
        }
        openDayDialog(ref.luna, ref.diaN);
      } else {
        viewDateMs = new Date(key+'T12:00:00').getTime();
        viewMode='semanaLunar'; renderCurrentView();
      }
    };
  });
}
function renderMesView(){
  const grid=$('grid'), dow=$('dowRow');
  const base=new Date(viewDateMs);
  const parts=cal.santiagoParts(base.getTime());
  const y=parts.y, m=parts.m; // 1-12 Santiago
  $('monthNoteWrap').style.display='none';
  $('lunaTitle').textContent='📅 '+gregMonthLabel(base.getTime());
  const ref0=lunaMapForKey(cal.fmtKey.format(new Date(Date.UTC(y,m-1,1,12))));
  $('lunaMeta').innerHTML='Vista mensual gregoriana · Penco (America/Santiago)'+(ref0&&ref0.luna!=='dft'?` · cruza Luna ${ref0.luna}`:'')+'<br><i>La vista por defecto sigue siendo 🌙 Luna de 28 días</i>';
  $('lunaDesc').textContent='Toca un día para abrir sus notas y compromisos por hora. Los compromisos aceptan cualquier hora (HH:MM).';
  $('phaseChips').innerHTML='<span class="chip">🌙 Luna = vista por defecto</span><span class="chip">📅 Mes = gregoriano</span>';
  document.body.dataset.tema = (currentView&&currentView.tipo==='luna'&&MOONS[currentView.luna-1]) ? MOONS[currentView.luna-1].estacion : 'RIMU';
  const curTheme=getTheme(); if(curTheme!=='auto') document.body.setAttribute('data-theme',curTheme); else document.body.removeAttribute('data-theme');
  dow.classList.remove('dow-week');
  dow.innerHTML=['lun','mar','mié','jue','vie','sáb','dom'].map(d=>`<div>${d}</div>`).join('');
  const firstDow=(new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7; // lunes=0
  const dim=new Date(Date.UTC(y,m,0)).getUTCDate();
  let html='';
  for(let i=0;i<firstDow;i++) html+='<div></div>';
  for(let d=1;d<=dim;d++){
    const key=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    html+=miniDayCard(key);
  }
  grid.className=''; grid.id='grid';
  grid.style.display='grid';
  grid.innerHTML=html;
  bindMiniCards(grid);
  const lb=$('viewNavLabel'); if(lb) lb.textContent=gregMonthLabel(base.getTime());
}
function renderSemanaView(){
  const grid=$('grid'), dow=$('dowRow');
  $('monthNoteWrap').style.display='none';
  const base=new Date(viewDateMs);
  const dowIdx=(base.getDay()+6)%7;
  const monday=new Date(base); monday.setDate(base.getDate()-dowIdx);
  const sunday=new Date(monday); sunday.setDate(monday.getDate()+6);
  const f=d=>cal.fmtKey.format(d);
  const iso = isoWeekNumber(monday.getTime());
  const isoShort = iso ? `Semana ${iso.week}` : 'Semana';
  const isoLong = iso ? `Semana <b>${iso.week}</b> del año gregoriano ${iso.year}` : 'Semana gregoriana';
  $('lunaTitle').textContent=`🗓️ ${isoShort} · `+cal.fmtDate.format(monday)+' — '+cal.fmtDate.format(sunday);
  $('lunaMeta').innerHTML=`Vista semanal (lunes a domingo) · ${isoLong} según calendario gregoriano · toca un día para abrirlo`;
  $('lunaDesc').textContent='Compromisos a cualquier hora (HH:MM) con 🔔 opcional.';
  $('phaseChips').innerHTML= iso ? `<span class="chip">🗓️ <b>Semana ${iso.week}</b> · ${iso.year}</span><span class="chip">${cal.fmtDate.format(monday)} — ${cal.fmtDate.format(sunday)}</span>` : '';
  dow.classList.add('dow-week');
  dow.innerHTML=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'].map(d=>`<div>${d}</div>`).join('');
  let html='<div class="week-grid">';
  for(let i=0;i<7;i++){ const d=new Date(monday); d.setDate(monday.getDate()+i); html+=miniDayCard(f(d)); }
  html+='</div>';
  grid.style.display='block';
  grid.innerHTML=html;
  bindMiniCards(grid);
  const lb=$('viewNavLabel'); if(lb) lb.textContent=(iso?`Sem ${iso.week} · `:'')+cal.fmtDate.format(monday)+' — '+cal.fmtDate.format(sunday);
}
// === VISTA LUNAR: SEMANA LUNAR (bloques fijos de la Luna de 28 días) ===
// Semana 1 = días 01–07 · Semana 2 = 08–14 · Semana 3 = 15–21 · Semana 4 = 22–28.
// Con fase e iluminación diaria. El detalle de la lunación completa vive en 🔭 Astro.
function lunarEvents(fromMs, toMs){
  try{ return window.astro.moonPhaseEvents(fromMs, toMs).sort((a,b)=>a.utcMs-b.utcMs); }
  catch(e){ return []; }
}
function lunarEventsMap(fromMs, toMs){
  const map = {};
  for(const e of lunarEvents(fromMs, toMs)){
    const k = cal.fmtKey.format(new Date(e.utcMs));
    if(!map[k]) map[k]=[];
    map[k].push(e);
  }
  try{
    if(typeof phaseMap!=='undefined'){
      for(const k of Object.keys(phaseMap)){
        const t = new Date(k+'T12:00:00').getTime();
        if(t>=fromMs-86400000 && t<=toMs+86400000 && !map[k]) map[k]=phaseMap[k];
      }
    }
  }catch(e){}
  return map;
}
function lunarMonthRange(ms){
  const SYNODIC_MS = 29.530588861*86400000;
  const targetKey = cal.fmtKey.format(new Date(ms));
  const nuevas = lunarEvents(ms-45*86400000, ms+45*86400000).filter(e=>e.tipo==='nueva').sort((a,b)=>a.utcMs-b.utcMs);
  let startEv = null;
  if(nuevas.length){
    startEv = nuevas[0];
    for(const e of nuevas){
      if(cal.fmtKey.format(new Date(e.utcMs)) <= targetKey) startEv = e;
    }
    let endEv = nuevas[nuevas.indexOf(startEv)+1] || null;
    if(!endEv) endEv = { utcMs: startEv.utcMs+SYNODIC_MS, tipo:'nueva', simbolo:'🌑' };
    const startKey = cal.fmtKey.format(new Date(startEv.utcMs));
    const endKey = cal.fmtKey.format(new Date(endEv.utcMs));
    const days = [];
    let cur = new Date(startKey+'T12:00:00').getTime();
    const endT = new Date(endKey+'T12:00:00').getTime();
    let guard = 0;
    while(cur < endT && guard < 32){ days.push(cal.fmtKey.format(new Date(cur))); cur += 86400000; guard++; }
    return { startEv, endEv, startKey, endKey, days };
  }
  // fallback sin efemérides: ventana de 30 días desde el pivote
  const startKey = targetKey;
  const days = [];
  let cur = new Date(startKey+'T12:00:00').getTime();
  for(let i=0;i<30;i++){ days.push(cal.fmtKey.format(new Date(cur))); cur += 86400000; }
  return { startEv:null, endEv:null, startKey, endKey:days[days.length-1], days };
}
function moonDaily(key){
  try{
    const noon = new Date(key+'T12:00:00').getTime();
    const icon = window.astro.moonIcon(noon);
    const info = window.astro.moonInfo(noon);
    const illum = Math.round((info.fraction||0)*100);
    return { icon: icon||'🌙', illum };
  }catch(e){ return { icon:'🌙', illum:null }; }
}
function miniLunarCard(key, evMap, idx){
  const ref = lunaMapForKey(key);
  const dt = new Date(key+'T12:00:00');
  const isToday = key===cal.fmtKey.format(new Date());
  const cell = ref ? cellForLunaRef(ref) : null;
  const agenda = (cell && Array.isArray(cell.agenda)) ? [...cell.agenda].sort((a,b)=> agendaTimeStr(a).localeCompare(agendaTimeStr(b))) : [];
  const nota = cell && cell.nota ? cell.nota : '';
  const evs = (evMap && evMap[key]) ? evMap[key] : [];
  const moon = moonDaily(key);
  const lunaTxt = ref ? (ref.luna==='dft' ? '✷ DFT' : 'L'+ref.luna+'·D'+ref.diaN) : '';
  const wd = cal.weekdayName(dt.getTime());
  return `<div class="day-card${isToday?' today':''} su-3b6a3a" data-key="${key}" title="${escapeHtml(wd)} ${escapeHtml(key)} · ${moon.illum===null?'':moon.illum+'% iluminada'}">
    <div class="dc-day">${escapeHtml(wd)} ${dt.getDate()}/${dt.getMonth()+1}</div>
    <div class="dc-head"><span class="dc-n">${idx!==undefined? String(idx).padStart(2,'0') : dt.getDate()}</span><span class="dc-phases">${moon.icon} ${evs.map(e=>`<span class="dc-phase" title="${e.tipo}">${e.simbolo}</span>`).join('')}</span><span class="dc-date">${dt.getDate()}/${dt.getMonth()+1}</span></div>
    <div class="dc-sun">${moon.illum===null?'🌙':moon.illum+'%'} · ${escapeHtml(wd.slice(0,3))}${lunaTxt? ' · '+lunaTxt:''}</div>
    ${agenda.length? `<div class="dc-clima">🕐 ${agenda.length} · ${escapeHtml(agenda.slice(0,2).map(a=>agendaTimeStr(a)+' '+a.text).join(' · '))}${agenda.length>2?' …':''}</div>`:''}
    ${nota? `<div class="dc-note">${escapeHtml(nota.split('\n')[0])}</div>`:''}
  </div>`;
}
function applyLunarTema(){
  document.body.dataset.tema = (currentView&&currentView.tipo==='luna'&&MOONS[currentView.luna-1]) ? MOONS[currentView.luna-1].estacion : 'RIMU';
  const curTheme=getTheme(); if(curTheme!=='auto') document.body.setAttribute('data-theme',curTheme); else document.body.removeAttribute('data-theme');
}
function renderSemanaLunarView(){
  const grid=$('grid'), dow=$('dowRow');
  $('monthNoteWrap').style.display='none';
  applyLunarTema();
  const pad2 = n => String(n).padStart(2, '0');
  const wk = lunarWeekForMs(viewDateMs);
  if(!wk){
    // Fallback: fecha fuera del ciclo (ej. ✷ DFT) → 7 días corridos desde el pivote
    const startKey = cal.fmtKey.format(new Date(viewDateMs));
    const keys = [];
    let cur = new Date(startKey+'T12:00:00').getTime();
    for(let i=0;i<7;i++){ keys.push(cal.fmtKey.format(new Date(cur))); cur += 86400000; }
    const evMap = lunarEventsMap(new Date(keys[0]+'T12:00:00').getTime()-86400000, new Date(keys[6]+'T12:00:00').getTime()+86400000);
    const d0=new Date(keys[0]+'T12:00:00'), d6=new Date(keys[6]+'T12:00:00');
    $('lunaTitle').textContent='🌗 Semana lunar · '+cal.fmtDate.format(d0)+' — '+cal.fmtDate.format(d6);
    $('lunaMeta').innerHTML='7 días corridos · con fase e iluminación diaria<br><i>La semana gregoriana (lun–dom) sigue en 🗓️ Semana</i>';
    $('lunaDesc').textContent='Toca un día para abrir sus notas y compromisos a cualquier hora (HH:MM).';
    const chips=[];
    keys.forEach(k=> (evMap[k]||[]).forEach(e=> chips.push(`<span class="chip">${e.simbolo} <b>${e.tipo.replace('-',' ')}</b> · ${cal.fmtDate.format(new Date(k+'T12:00:00'))} ${cal.fmtTime.format(new Date(e.utcMs))}</span>`)));
    $('phaseChips').innerHTML = chips.join('') || '<span class="chip su-57f9e3">Sin fases exactas estos 7 días</span>';
    dow.classList.add('dow-week');
    dow.innerHTML=keys.map(k=>{ const w=cal.weekdayName(new Date(k+'T12:00:00').getTime()); return `<div>${w.slice(0,3)}</div>`; }).join('');
    grid.style.display='block';
    grid.innerHTML='<div class="week-grid">'+keys.map((k,i)=>miniLunarCard(k, evMap, i+1)).join('')+'</div>';
    bindMiniCards(grid);
    const lb=$('viewNavLabel'); if(lb) lb.textContent=cal.fmtDate.format(d0)+' — '+cal.fmtDate.format(d6);
    return;
  }
  const keys = wk.keys;
  const diaNums = wk.days.map(x => x.diaN);
  const meta = (typeof MOONS !== 'undefined' && MOONS[wk.luna - 1]) ? MOONS[wk.luna - 1] : null;
  const evMap = lunarEventsMap(new Date(keys[0]+'T12:00:00').getTime()-86400000, new Date(keys[6]+'T12:00:00').getTime()+86400000);
  const d0=new Date(keys[0]+'T12:00:00'), d6=new Date(keys[6]+'T12:00:00');
  const rango = `Días ${pad2(wk.diaStart)}–${pad2(wk.diaEnd)}`;
  $('lunaTitle').textContent=`🌗 Semana lunar ${wk.semanaIdx} · ${rango} · Luna ${wk.luna} · `+cal.fmtDate.format(d0)+' — '+cal.fmtDate.format(d6);
  $('lunaMeta').innerHTML=`Luna ${wk.luna}${meta ? ' · ' + escapeHtml(meta.nombre) : ''} · <b>${rango} de 28 (Semana ${wk.semanaIdx} de 4)</b> · ${cal.fmtDate.format(d0)} — ${cal.fmtDate.format(d6)}<br><i>La semana gregoriana (lun–dom) sigue en 🗓️ Semana</i>`;
  $('lunaDesc').textContent='Toca un día para abrir sus notas y compromisos a cualquier hora (HH:MM).';
  const chips=[`<span class="chip">🌗 <b>Semana ${wk.semanaIdx}</b> · ${rango}</span>`];
  keys.forEach(k=> (evMap[k]||[]).forEach(e=> chips.push(`<span class="chip">${e.simbolo} <b>${e.tipo.replace('-',' ')}</b> · ${cal.fmtDate.format(new Date(k+'T12:00:00'))} ${cal.fmtTime.format(new Date(e.utcMs))}</span>`)));
  $('phaseChips').innerHTML = chips.join('');
  dow.classList.add('dow-week');
  dow.innerHTML=diaNums.map(diaN=>{
    const k = keys[diaNums.indexOf(diaN)];
    const w=cal.weekdayName(new Date(k+'T12:00:00').getTime());
    return `<div>Día ${pad2(diaN)}<br><small class="su-3f6750">${w.slice(0,3)}</small></div>`;
  }).join('');
  grid.style.display='block';
  grid.innerHTML='<div class="week-grid">'+keys.map((k,i)=>miniLunarCard(k, evMap, diaNums[i])).join('')+'</div>';
  bindMiniCards(grid);
  const lb=$('viewNavLabel'); if(lb) lb.textContent=`Luna ${wk.luna} · S${wk.semanaIdx} (${pad2(wk.diaStart)}–${pad2(wk.diaEnd)}) · `+cal.fmtDate.format(d0)+' — '+cal.fmtDate.format(d6);
}

function seasonChip(el, estKey) {
  const s = ESTACIONES[estKey];
  el.textContent = s.nombre;
  el.style.background = s.color;
  el.title = s.desc;
}

function renderLuna() {
  if(viewMode && viewMode!=='luna'){ renderCurrentView(); return; }
  updateViewButtons();
  const meta = MOONS[currentView.luna - 1];
  const lunaDays = cycle.days.filter(d => d.luna === meta.n);
  const first = lunaDays[0], last = lunaDays[27];

  document.body.dataset.tema = meta.estacion;
  // respetar tema manual si no es auto
  const curTheme = getTheme();
  if (curTheme !== 'auto') document.body.setAttribute('data-theme', curTheme);
  else document.body.removeAttribute('data-theme');
  $('monthNoteWrap').style.display = '';
  $('grid').style.display = 'grid';
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
    : '<span class="chip su-57f9e3">Sin fases exactas en esta luna</span>';

  const wdNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const firstWd = new Date(cal.santiagoParts(first.noonMs).y, cal.santiagoParts(first.noonMs).m - 1, cal.santiagoParts(first.noonMs).d);
  const startIdx = new Date(Date.UTC(cal.santiagoParts(first.noonMs).y, cal.santiagoParts(first.noonMs).m - 1, cal.santiagoParts(first.noonMs).d)).getUTCDay();
  $('dowRow').classList.remove('dow-week');
  $('dowRow').innerHTML = Array.from({ length: 7 }, (_, i) =>
    `<div>${wdNames[(startIdx + i) % 7]}</div>`).join('');

  const todayKey = cal.fmtKey.format(new Date());
  const mensMap = (()=>{ try{ const md=getMensData(); if(!md.showCal) return {}; const p=getMensPredictions(); return p ? p.map : {}; }catch{ return {}; } })();
  const habitDataCache = (()=>{ try{ return getHabitData(); }catch{ return { list:[], entries:{} }; } })();
  const grid = $('grid');
  grid.innerHTML = '';
  // Cachés por luna: evita releer userData 28 veces (una por día) en el inicio.
  const gymDataCache = (()=>{ try{ return getGymData(); }catch(e){ return {items:[]}; } })();
  const birdEntriesCache = (()=>{ try{ return getBirdData().entries||[]; }catch(e){ return []; } })();
  const fishEntriesCache = (()=>{ try{ const v=getFishingLogData(); return Array.isArray(v)?v:(v&&v.entries)||[]; }catch(e){ return []; } })();
  const interEntriesCache = (()=>{ try{ return getIntermarealData().entries||[]; }catch(e){ return []; } })();
  const bosqueEntriesCache = (()=>{ try{ return getBosqueData().entries||[]; }catch(e){ return []; } })();
  const finEntriesCache = (()=>{ try{ return getFinanceData().entries||[]; }catch(e){ return []; } })();
  const htCache = (()=>{ try{ return getHomeTasksData(); }catch(e){ return {completions:{}}; } })();
  const gratEntriesCache = (()=>{ try{ return getGratitudData().entries||{}; }catch(e){ return {}; } })();
  const udCache = (()=>{ try{ return userData()||{}; }catch(e){ return {}; } })();
  for (const d of lunaDays) {
    const key = cal.fmtKey.format(new Date(d.noonMs));
    const cell = dayCell(meta.n, d.diaN);
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
      const gymDataForCard = gymDataCache;
      const diaSemana = new Date(d.noonMs).getDay();
      const gymForDay = gymDataForCard.items.filter(it=> parseInt(it.day)===diaSemana);
      gymIcons = gymForDay.map(it=> `<span class="dc-habit" style="background:${it.color}22;color:${it.color};border-color:${it.color}55" title="${escapeHtml(it.name)} ${it.start}-${it.end}${it.place?' · '+escapeHtml(it.place):''}">🏋️</span>`).join('');
      hasGym = gymForDay.length ? ' has-gym' : '';
    }catch(e){}
    let birdIcons='', fishIcons='', interIcons='', bosqueIcons='', astroIcons='', comunaIcons='', financeIcons='', homeIcons='';
    try{
      const birdsToday=birdEntriesCache.filter(x=>x.date===key);
      if(birdsToday.length) birdIcons=birdsToday.map(b=> `<span class="dc-habit su-8fa3a4" title="${escapeHtml(b.species)} ×${b.count}">🦅</span>`).join('');
    }catch(e){}
    try{
      const fishToday=fishEntriesCache.filter(x=>x.date===key);
      if(fishToday.length) fishIcons=fishToday.map(f=> `<span class="dc-habit su-ae6395" title="${escapeHtml(f.species)} ${escapeHtml(f.qty)}">🎣</span>`).join('');
    }catch(e){}
    try{
      const interToday=interEntriesCache.filter(x=>x.date===key);
      if(interToday.length) interIcons=interToday.map(r=> `<span class="dc-habit su-fbbb31" title="${escapeHtml(r.species)} ${escapeHtml(r.qty||'') } 🦀">🦀</span>`).join('');
    }catch(e){}
    try{
      const bosqueToday=bosqueEntriesCache.filter(x=>x.date===key);
      if(bosqueToday.length) bosqueIcons=bosqueToday.map(r=> `<span class="dc-habit su-6a127e" title="${escapeHtml(r.species)} · ${escapeHtml(r.action||'')}">🌳</span>`).join('');
    }catch(e){}
    try{
      const astroToday=astroVisibleForDate(key);
      if(astroToday.length) astroIcons=astroToday.map(a=> `<span class="dc-habit su-460df3" title="${escapeHtml(a.nombre)}">🔭</span>`).join('');
    }catch(e){}
    try{
      if(isComunaShowCal()){
        const comToday=getAllComunaEventsForMD(key.slice(5));
        if(comToday.length) comunaIcons=comToday.map(c=> `<span class="dc-habit su-e07fac" title="${escapeHtml(c.nombre)}">🎉</span>`).join('');
      }
    }catch(e){}
    try{
      const finToday=finEntriesCache.filter(x=>x.date===key);
      if(finToday.length){
        const totG=finToday.filter(x=>x.tipo==='gasto').reduce((s,x)=>s+(parseInt(x.monto)||0),0);
        const totI=finToday.filter(x=>x.tipo==='ingreso').reduce((s,x)=>s+(parseInt(x.monto)||0),0);
        financeIcons=`<span class="dc-habit su-548541" title="${finToday.length} mov. · gastos $${totG.toLocaleString('es-CL')} · ingresos $${totI.toLocaleString('es-CL')}">💰</span>`;
      }
    }catch(e){}
    try{
      const ht=htCache;
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
      const g=gratEntriesCache[key];
      const hasGrat=(typeof gratTiene==='function'?gratTiene(g):(g&&(g.t1||g.t2||g.t3))); if(hasGrat) gratIcons=`<span class="dc-habit su-267ee4" title="Gratitud: ${escapeHtml(([g.t1,g.t2,g.t3].filter(Boolean).join(' · ')+(g.carta?' 💌 '+String(g.carta).slice(0,60):'')).slice(0,90))}">✨</span>`;
    }catch(e){}
    let espIcons='';
    try{
      const ed=(udCache.espiritual&&udCache.espiritual.done)||{};
      const eo=ed[key];
      if(eo&&typeof eo==='object'){ const n=Object.values(eo).filter(Boolean).length; if(n>0) espIcons=`<span class="dc-habit su-548541" title="Prácticas espirituales: ${n} hechas">🕉️</span>`; }
    }catch(e){}
    let peloIcons='';
    try{
      const pd=(udCache.peloLunar&&udCache.peloLunar.cortes)||[];
      const pc=pd.filter(x=>x.fecha===key);
      if(pc.length) peloIcons=pc.map(c=> `<span class="dc-habit su-e07fac" title="Corte: ${escapeHtml(c.tipo||'')} — ver 💇 Luna y Corte">✂️</span>`).join('');
      else{
        const evs2=(typeof phaseMap!=='undefined'&&phaseMap[key])?phaseMap[key]:[];
        const has2=evs2.map(e=>e.tipo);
        let mark='';
        if(has2.indexOf('llena')>=0) mark='🌕 Luna llena: corte para volumen y fuerza 💇';
        else if(has2.indexOf('cuarto-menguante')>=0) mark='🌓 Menguante: corte para que dure la forma 💇';
        else if(has2.indexOf('cuarto-creciente')>=0) mark='🌗 Creciente: corte para que crezca rápido 💇';
        else if(has2.indexOf('nueva')>=0) mark='🌑 Nueva: descanso, evita corte grande 💇';
        if(mark) peloIcons=`<span class="dc-habit su-e07fac" title="${escapeHtml(mark)} — ver 💇 Luna y Corte">💇</span>`;
      }
    }catch(e){}
    let fenoIcons='';
    try{
      const fz=(udCache.fenologia&&udCache.fenologia.obs)||[];
      const ft=fz.filter(x=>x.fecha===key);
      if(ft.length) fenoIcons=ft.map(o=> `<span class="dc-habit su-ae6395" title="Fenología: ${escapeHtml(o.primera?'🌟 Primera del año · ':'')}${escapeHtml(o.ev==='libre'?(o.libre||'Otra'):o.ev)}${o.lugar?' · '+escapeHtml(o.lugar):''}">📜</span>`).join('');
    }catch(e){}
    let energiaIcons='';
    try{
      const er=(udCache.energiaDescanso&&udCache.energiaDescanso.regs)||[];
      const et=er.filter(x=>x.fecha===key);
      if(et.length) energiaIcons=et.map(o=> `<span class="dc-habit su-460df3" title="Descanso: 😴${escapeHtml(String(o.sueno))}h · ⚡${escapeHtml(String(o.energia))}/5 · 💚${escapeHtml(String(o.animo))}/5 — ver ⚡ Energía y descanso">💤</span>`).join('');
    }catch(e){}
    const card = document.createElement('div');
    card.className = 'day-card' + (key === todayKey ? ' today' : '') + (mensType ? ' mens-'+mensType : '') + hasHabits + hasGym;
    card.dataset.luna = meta.n;
    card.dataset.dia = d.diaN;
    card.innerHTML = `
      <div class="dc-head"><span class="dc-n">${String(d.diaN).padStart(2, '0')}</span><span class="dc-phases">${evs.map(e => `<span class="dc-phase" title="${e.tipo} ${cal.fmtTime.format(new Date(e.utcMs))}">${e.simbolo}</span>`).join('')}</span><span class="dc-date">${cal.fmtDate.format(new Date(d.noonMs))}</span></div>
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
      ${espIcons ? `<div class="dc-habits">${espIcons}</div>` : ''}
      ${peloIcons ? `<div class="dc-habits">${peloIcons}</div>` : ''}
      ${fenoIcons ? `<div class="dc-habits">${fenoIcons}</div>` : ''}
      ${energiaIcons ? `<div class="dc-habits">${energiaIcons}</div>` : ''}
      ${efe ? `<div class="dc-efe" title="${escapeHtml(efe)}">📅 ${escapeHtml(efe)}</div>` : ''}
      ${mood ? `<div class="dc-clima">Ánimo: ${escapeHtml(mood.e)} ${escapeHtml(mood.n)}</div>` : ''}
      ${Array.isArray(cell.agenda)&&cell.agenda.length ? `<div class="dc-clima" title="${escapeHtml(cell.agenda.map(a=>getAgendaTime(a)+' '+a.text + (a.notify?' 🔔':'')).join(' · '))}">🕐 ${cell.agenda.length} compromiso${cell.agenda.length>1?'s':''} · ${escapeHtml(cell.agenda.slice(0,2).map(a=>getAgendaTime(a)+' '+a.text).join(' · '))}${cell.agenda.length>2?' …':''}</div>` : ''}
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
  let dftMoonRise='--', dftMoonSet='--';
  try{
    const dftMoon = cal.moonForDay(dftDay.noonMs);
    if(dftMoon.rise) dftMoonRise = cal.fmtTime.format(new Date(dftMoon.rise));
    if(dftMoon.set) dftMoonSet = cal.fmtTime.format(new Date(dftMoon.set));
  }catch(e){}
  const grid = $('grid');
  grid.style.display = 'block';
  $('dowRow').classList.remove('dow-week');
  $('dowRow').innerHTML = '';
  const key = cal.fmtKey.format(new Date(dftDay.noonMs));
  const evs = phaseMap[key] || [];
  const frDft = (typeof defaultFraseDFT === 'function') ? defaultFraseDFT() : (window.fraseDFT || (window.frases ? window.frases[364] : null));
  grid.innerHTML = `
    <div class="day-card today su-04391f">
      <div class="dc-head"><span class="dc-n">365</span><span class="dc-date">${cal.fmtDate.format(new Date(dftDay.noonMs))}</span></div>
      <div class="dc-sun">☀ ${sun.rise ? cal.fmtTime.format(new Date(sun.rise)) : '--'} – ${sun.set ? cal.fmtTime.format(new Date(sun.set)) : '--'}</div>
      <div class="dc-moon" title="Salida y puesta de la luna en Penco (aprox.)">🌙 ${dftMoonRise} – ${dftMoonSet}</div>
      ${frDft ? `<blockquote class="dlg-quote">«${escapeHtml(frDft.t)}»<span class="q-a">— ${escapeHtml(frDft.a || 'Anónimo')}</span></blockquote>` : ''}
      <div class="su-8c6175">${DFT.texto1}</div>
      <p class="su-f14b16"><b>${DFT.sub2}</b></p>
      <p class="su-6424e2">${DFT.texto2}</p>
      <p class="su-6424e2">${DFT.texto3}</p>
      <p class="su-f14b16"><b>${DFT.sub3}</b></p>
      <p class="su-6424e2">${DFT.texto4}</p>
      <p class="su-f3e545">${DFT.texto5}</p>
      <p class="su-6424e2">${DFT.texto6}</p>
      ${evs.map(e => `<div class="dc-tide su-8a77e5">${e.simbolo} ${e.tipo.replace('-', ' ')} · ${cal.fmtTime.format(new Date(e.utcMs))}</div>`).join('')}
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
