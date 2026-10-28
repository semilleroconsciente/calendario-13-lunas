// renderer-territorio-vivo.js — extraído de renderer.js (P2-B 2026-10-13).
// Bitácoras territorio-vivo: PESCA + AVES + INTERMAREAL + BOSQUE NATIVO.
// Misma scope global (script clásico defer, sin IIFE): comparte $, DATA,
// userData, scheduleSave, escapeHtml, sanitizeText, cal, MOONS, cycle,
// currentView, mensKeyToMs, mensLunaForKey, getTidesForKey, shareText,
// playNotifySound, renderLuna. Carga diferida tras renderer.js (ver index.html).
// No requiere cambios en llamadores: solo onclick/setTimeout internos.
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
// === ESPECIES PERSONALIZADAS — Pesca (privado por usuario, como Lawen) ===
function getFishingCustom(){ try{ const u=userData(); if(!u.fishingCustom) u.fishingCustom=[]; if(!Array.isArray(u.fishingCustom)) u.fishingCustom=[]; return u.fishingCustom; }catch(e){ return []; } }
function getAllFishingSpecies(){ try{ return FISHING_SPECIES.concat(getFishingCustom()); }catch(e){ return FISHING_SPECIES; } }
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
    todayBox.innerHTML='<div class="su-13313b"><span class="su-433de3"><b>🎣 Hoy — '+cal.weekdayName(todayMs)+' '+cal.fmtFull.format(new Date(todayMs))+'</b></span><span class="chip" style="background:'+color+';color:#10142c">'+rating.label+' ('+rating.score+'/100)</span></div><p class="muted su-e13d76">'+rating.desc+' · Tithi '+rating.tithi+' · Mareas: '+tideToday.tides.map(t=> t.h+' '+t.a).join(' · ')+ (tideToday.estimated?' *est.':'') +'</p><p class="muted su-11a508">Mejor ventana: <b>2h antes/después de pleamar</b> ('+tideToday.tides.filter(t=>t.t==='pleamar').map(t=>t.h).join(', ')+') y <b>amanecer/atard ecer</b>.</p>';
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
      lunaBox.innerHTML='<h4 class="su-e39eba">🌙 Mejores días en '+ (info? info.nombre : 'esta luna') +'</h4>' + best.slice(0,5).map(b=>'<div class="chip su-6f28f3">'+cal.weekdayName(mensKeyToMs(b.k))+' '+cal.fmtDate.format(new Date(mensKeyToMs(b.k)))+' — '+b.r.label+' ('+b.r.score+')</div>').join('') + '<p class="muted su-d47a97">Basado en luna + marea. Valida con experiencia local.</p>';
    }
  }
  const speciesBox=$('fishingSpeciesBox');
  if(speciesBox){
    const mine=getFishingCustom();
    speciesBox.innerHTML='<div class="fishing-species">'
      +FISHING_SPECIES.map(s=>'<div class="fishing-species-item su-3b6a3a" data-fish="'+escapeHtml(s.nombre)+'"><b>'+escapeHtml(s.nombre)+'</b> — <span class="muted">'+escapeHtml(s.temporada)+' · Talla '+escapeHtml(s.talla)+'</span><br><span class="su-11a508">Carnada: '+escapeHtml(s.carnada)+'</span><br><span class="muted su-0d5be0">'+escapeHtml(s.nota)+'</span></div>').join('')
      +mine.map((s,i)=>'<div class="fishing-species-item su-263abd" data-fish="'+escapeHtml(s.nombre)+'"><div class="su-533ebe"><span><b>🎣 '+escapeHtml(s.nombre)+'</b> <span class="chip su-421073">mía</span></span><button type="button" class="btn btn-icon fishsp-del su-4503f1" data-i="'+i+'" title="Borrar mi especie">✕</button></div><span class="muted">'+escapeHtml(s.temporada||'—')+' · Talla '+escapeHtml(s.talla||'—')+'</span><br><span class="su-11a508">Carnada: '+escapeHtml(s.carnada||'—')+'</span><br><span class="muted su-0d5be0">'+escapeHtml(s.nota||'')+'</span></div>').join('')
      +'</div>'
      +'<p class="muted su-b64a5a">Toca una especie para cargarla en la bitácora. '+FISHING_SPECIES.length+' base'+(mine.length? ' + <b>'+mine.length+' mías</b>':'')+'.</p>'
      +'<details class="su-9cf9f9"><summary class="su-d9db22"><b>➕ Agregar especie</b></summary>'
      +'<div class="conv-row su-8a77e5"><label class="su-4b3de7">Especie * <input type="text" id="fishSpName" placeholder="ej: Cabrilla, Pejesapo" maxlength="30"></label><label>Temporada <input type="text" id="fishSpTemp" placeholder="ej: Oct-Mar" maxlength="20"></label></div>'
      +'<div class="conv-row"><label>Talla mín. <input type="text" id="fishSpTalla" placeholder="ej: 30 cm" maxlength="20"></label><label class="su-4b3de7">Carnada / señuelo <input type="text" id="fishSpCarn" placeholder="ej: Jibia, cuchara rosada" maxlength="40"></label></div>'
      +'<label>Nota <input type="text" id="fishSpNota" placeholder="ej: Amanecer, fondo arena" maxlength="80"></label>'
      +'<div class="dlg-actions su-59a5a8"><button type="button" id="fishSpAdd" class="btn btn-accent su-30e741">+ Guardar especie</button></div></details>';
    speciesBox.querySelectorAll('[data-fish]').forEach(el=> el.onclick=(e)=>{ if(e.target && e.target.classList && e.target.classList.contains('fishsp-del')) return; const v=el.dataset.fish; const inp=$('fishLogSpecies'); if(inp){ inp.value=v; inp.focus(); } });
    speciesBox.querySelectorAll('.fishsp-del').forEach(b=> b.onclick=(e)=>{ e.stopPropagation(); const arr=getFishingCustom(); arr.splice(parseInt(b.dataset.i,10),1); scheduleSave('Guardado ✓'); renderFishingDialog(); });
    const fishSpAdd=$('fishSpAdd');
    if(fishSpAdd) fishSpAdd.onclick=()=>{
      const n=sanitizeText(($('fishSpName').value||'').trim(),30);
      if(!n) return alert('Pon el nombre de la especie');
      const arr=getFishingCustom();
      if(FISHING_SPECIES.some(x=>x.nombre.toLowerCase()===n.toLowerCase())||arr.some(x=>x.nombre.toLowerCase()===n.toLowerCase())) return alert('Esa especie ya existe');
      arr.push({ nombre:n, temporada:sanitizeText(($('fishSpTemp').value||'').trim(),20)||'Todo año', talla:sanitizeText(($('fishSpTalla').value||'').trim(),20)||'—', carnada:sanitizeText(($('fishSpCarn').value||'').trim(),40)||'—', nota:sanitizeText(($('fishSpNota').value||'').trim(),80) });
      scheduleSave('Guardado ✓'); renderFishingDialog();
    };
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
    return `<div class="habit-item su-13313b"><span><b>${escapeHtml(it.species||'—')}</b> — ${escapeHtml(it.qty||'')} · ${escapeHtml(it.place||'')} <br><span class="muted su-11a508">${it.date} ${it.tide? '· '+escapeHtml(it.tide):''} ${lunaTxt? '· '+lunaTxt:''} ${it.weather? '· '+escapeHtml(it.weather):''}</span><br><span class="muted su-11a508">${escapeHtml(it.notes||'')}</span></span><span class="su-0c0cb1"><button data-id="${it.id}" class="btn fishlog-share su-337714" title="Compartir esta salida">📤</button><button data-id="${it.id}" class="btn fishlog-edit su-337714">✏️</button><button data-id="${it.id}" class="btn fishlog-del su-fd834a">✕</button></span></div>`;
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
// === ESPECIES PERSONALIZADAS — Aves (privado por usuario) ===
function getBirdsCustom(){ try{ const u=userData(); if(!u.birdsCustom) u.birdsCustom=[]; if(!Array.isArray(u.birdsCustom)) u.birdsCustom=[]; return u.birdsCustom; }catch(e){ return []; } }
function getAllBirdsCatalog(){ try{ return BIRDS_CATALOG.concat(getBirdsCustom()); }catch(e){ return BIRDS_CATALOG; } }
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
    todayBox.innerHTML=`<div class="su-13313b"><span class="su-433de3"><b>🦅 Hoy — ${cal.fmtFull.format(new Date())}</b></span><span class="chip su-e4aba6">${todayCnt} hoy · ${cnt} total</span></div><p class="muted su-e13d76">Humedal Rocuant es sitio clave: pleamar concentra aves limícolas. Mejor 06:30-09:00 y 17:30-19:00. Viento sur fuerte → poca actividad.</p>`;
  }
  const moonBox=$('birdsMoonBox');
  if(moonBox){
    const k=cal.fmtKey.format(new Date());
    const r=getFishingRatingForKey(k);
    moonBox.innerHTML=`<b>${r.label}</b> — ${r.desc} (luna influye menos que marea, más que luz nocturna)`;
  }
  const catBox=$('birdsCatalogBox');
  if(catBox){
    const mineB=getBirdsCustom();
    catBox.innerHTML='<div class="fishing-species">'
      +BIRDS_CATALOG.map(b=>`<div class="fishing-species-item su-3b6a3a" data-bird="${escapeHtml(b.nombre)}"><b>${escapeHtml(b.icon||'🐦')} ${escapeHtml(b.nombre)}</b> — <span class="muted su-0d5be0">${escapeHtml(b.cient||'')}</span><br><span class="su-11a508">${escapeHtml(b.hab||'')} · ${escapeHtml(b.epoca||'')}</span>${b.nombre==='Chucao'?'<br><button type="button" class="btn btn-chucao-sound su-d2fb07">🔊 Escuchar canto</button>':''}</div>`).join('')
      +mineB.map((b,i)=>`<div class="fishing-species-item su-263abd" data-bird="${escapeHtml(b.nombre)}"><div class="su-533ebe"><span><b>${escapeHtml(b.icon||'🐦')} ${escapeHtml(b.nombre)}</b> <span class="chip su-421073">mía</span></span><button type="button" class="btn btn-icon birdsp-del su-4503f1" data-i="${i}" title="Borrar mi especie">✕</button></div><span class="muted su-0d5be0">${escapeHtml(b.cient||'')}</span><br><span class="su-11a508">${escapeHtml(b.hab||'')} · ${escapeHtml(b.epoca||'')}</span></div>`).join('')
      +'</div>'
      +'<p class="muted su-b64a5a">Toca una especie para cargarla en el formulario. '+BIRDS_CATALOG.length+' base'+(mineB.length? ' + <b>'+mineB.length+' mías</b>':'')+'.</p>'
      +'<details class="su-9cf9f9"><summary class="su-d9db22"><b>➕ Agregar especie</b></summary>'
      +'<div class="conv-row su-8a77e5"><label class="su-4b3de7">Especie * <input type="text" id="birdSpName" placeholder="ej: Diuca, Tenca" maxlength="30"></label><label>Icono <input type="text" id="birdSpIcon" placeholder="🐦" maxlength="4" class="su-4a6a2f"></label></div>'
      +'<div class="conv-row"><label class="su-4b3de7">Nombre científico <input type="text" id="birdSpCient" placeholder="ej: Diuca diuca" maxlength="40"></label><label>Época <input type="text" id="birdSpEpoca" placeholder="ej: Sep-Mar" maxlength="20"></label></div>'
      +'<label>Hábitat / lugar <input type="text" id="birdSpHab" placeholder="ej: Humedal Rocuant, cerro" maxlength="50"></label>'
      +'<div class="dlg-actions su-59a5a8"><button type="button" id="birdSpAdd" class="btn btn-accent su-30e741">+ Guardar especie</button></div></details>';
    catBox.querySelectorAll('[data-bird]').forEach(el=> el.onclick=(e)=>{ if(e.target && e.target.closest && e.target.closest('.btn-chucao-sound')){ e.stopPropagation(); try{ playNotifySound(); }catch{} return; } if(e.target && e.target.classList && e.target.classList.contains('birdsp-del')) return; const inp=$('birdSpecies'); if(inp){ inp.value=el.dataset.bird; inp.focus(); } });
    catBox.querySelectorAll('.btn-chucao-sound').forEach(b=> b.onclick=(e)=>{ e.stopPropagation(); try{ playNotifySound(); }catch{} });
    catBox.querySelectorAll('.birdsp-del').forEach(b=> b.onclick=(e)=>{ e.stopPropagation(); const arr=getBirdsCustom(); arr.splice(parseInt(b.dataset.i,10),1); scheduleSave('Guardado ✓'); renderBirdsDialog(); });
    const birdSpAdd=$('birdSpAdd');
    if(birdSpAdd) birdSpAdd.onclick=()=>{
      const n=sanitizeText(($('birdSpName').value||'').trim(),30);
      if(!n) return alert('Pon el nombre de la especie');
      const arr=getBirdsCustom();
      if(BIRDS_CATALOG.some(x=>x.nombre.toLowerCase()===n.toLowerCase())||arr.some(x=>x.nombre.toLowerCase()===n.toLowerCase())) return alert('Esa especie ya existe');
      arr.push({ nombre:n, icon:sanitizeText(($('birdSpIcon').value||'').trim(),4)||'🐦', cient:sanitizeText(($('birdSpCient').value||'').trim(),40), hab:sanitizeText(($('birdSpHab').value||'').trim(),50)||'Penco', epoca:sanitizeText(($('birdSpEpoca').value||'').trim(),20)||'Todo el año' });
      scheduleSave('Guardado ✓'); renderBirdsDialog();
    };
  }
  renderBirdsLog();
}
// === Exportación ciencia ciudadana: eBird (Record Format) + iNaturalist ===
// eBird: https://support.ebird.org/en/support/solutions/articles/48000907878
//   Record Format = 19 columnas SIN encabezado, coma como delimitador,
//   sin comillas ni saltos de línea, fecha MM/DD/YYYY. Protocolo Incidental
//   (ideal para bitácora oportunista: no exige duración/distancia).
// iNat: https://www.inaturalist.org/observations/import#csv_import
//   8 columnas CON encabezado: Taxon,Date observed,Description,Place name,
//   Latitude,Longitude,Tags,Geoprivacy. Cita CSV estándar (comillas OK).
function sciExportCoords(){
  try{
    var p=(window.pencoData&&window.pencoData.PENCO)||(typeof PENCO!=='undefined'?PENCO:null);
    if(p&&(isFinite(p.lat)||isFinite(p.latitude))&&(isFinite(p.lng)||isFinite(p.lng===undefined?p.lon:p.lng))){
      var la=isFinite(p.lat)?p.lat:p.latitude, lo=isFinite(p.lng)?p.lng:p.lon;
      if(isFinite(la)&&isFinite(lo)) return { lat:la, lng:lo };
    }
  }catch(e){}
  return { lat:-36.73194, lng:-72.9925 };
}
function sciEBirdCell(s){
  return String(s==null?'':s).replace(/["\r\n]+/g,' ').replace(/,/g,';').trim();
}
function sciEBirdDate(iso){
  var p=String(iso||'').split('-');
  if(p.length!==3||!p[0]||!p[1]||!p[2]) return String(iso||'');
  return p[1]+'/'+p[2]+'/'+p[0];
}
function sciFindCient(nombre, catalog){
  if(!nombre||!catalog) return '';
  var q=String(nombre).trim().toLowerCase();
  for(var i=0;i<catalog.length;i++){
    var b=catalog[i];
    if(b&&b.nombre&&String(b.nombre).toLowerCase()===q&&b.cient) return String(b.cient);
  }
  return '';
}
function sciSplitCient(cient){
  var parts=String(cient||'').trim().split(/\s+/);
  if(parts.length>=2) return { genus:parts[0], species:parts.slice(1).join(' ') };
  return { genus:'', species:'' };
}
function sciCsvDownload(filename, text){
  var blob=new Blob(["\uFEFF"+text],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob); var a=document.createElement('a');
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  setTimeout(function(){ try{document.body.removeChild(a);}catch(e){} URL.revokeObjectURL(url); },400);
}
function sciINatCell(s){
  s=String(s==null?'':s);
  if(/[",\r\n]/.test(s)) return '"'+s.replace(/"/g,'""')+'"';
  return s;
}
function exportBirdsEBird(){
  var arr=getBirdData().entries;
  if(!arr.length) return alert('Sin datos para exportar');
  var co=sciExportCoords();
  var lines=arr.slice().sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time);}).map(function(r){
    var cient=sciFindCient(r.species, getAllBirdsCatalog());
    var gs=sciSplitCient(cient);
    var luna=null; try{ luna=mensLunaForKey(r.date); }catch(e){}
    var comments=sciEBirdCell(((r.activity||'')+(r.notes?' '+r.notes:''))+(luna?' Luna '+luna.luna+'d'+luna.dia:''));
    var sub=sciEBirdCell('Mari Kula Kuyen Penco'+(luna?' Luna '+luna.luna+' d'+luna.dia:''));
    return [
      sciEBirdCell(r.species||''), sciEBirdCell(gs.genus), sciEBirdCell(gs.species),
      sciEBirdCell(r.count||'X'), comments,
      sciEBirdCell(r.place||'Penco — Humedal Rocuant'),
      co.lat, co.lng, sciEBirdDate(r.date), sciEBirdCell(r.time||''),
      'BI','CL','Incidental','1','','N','','',
      sub
    ].join(',');
  });
  sciCsvDownload('ebird-penco-'+cal.fmtKey.format(new Date())+'.csv', lines.join('\n')+'\n');
  alert('🦅 CSV eBird listo (Record Format, sin encabezado).\nSúbelo en eBird > Submit > Import Data > Record Format.\nRevisa especie y lugar en el paso de limpieza.');
}
function exportBirdsINat(){
  var arr=getBirdData().entries;
  if(!arr.length) return alert('Sin datos para exportar');
  var co=sciExportCoords();
  var rows=[['Taxon','Date observed','Description','Place name','Latitude','Longitude','Tags','Geoprivacy'].join(',')];
  arr.slice().sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time);}).forEach(function(r){
    var cient=sciFindCient(r.species, getAllBirdsCatalog());
    var luna=null; try{ luna=mensLunaForKey(r.date); }catch(e){}
    var desc=((r.activity||'avistamiento')+(r.notes?' · '+r.notes:''))+(luna?' · Luna '+luna.luna+' d'+luna.dia:'');
    var priv=(String(r.activity||'').toLowerCase().indexOf('nido')>=0)?'obscured':'';
    rows.push([
      sciINatCell(cient||r.species||''),
      sciINatCell(((r.date||'')+' '+(r.time||'')).trim()),
      sciINatCell(desc),
      sciINatCell(r.place||'Penco, Bio-Bio, CL'),
      co.lat, co.lng,
      sciINatCell('penco,13-lunas,aves'),
      priv
    ].join(','));
  });
  sciCsvDownload('inat-aves-penco-'+cal.fmtKey.format(new Date())+'.csv', rows.join('\n')+'\n');
  alert('🌿 CSV iNaturalist listo (con encabezado).\nSúbelo en iNaturalist > Observations > Import > CSV import.');
}
function exportBosqueINat(){
  var arr=getBosqueData().entries;
  if(!arr.length) return alert('Sin datos para exportar');
  var co=sciExportCoords();
  var protRe=/proteg|peligro|vulnerable|permiso|conaf|monumento|ley|observar/i;
  var rows=[['Taxon','Date observed','Description','Place name','Latitude','Longitude','Tags','Geoprivacy'].join(',')];
  arr.slice().sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time);}).forEach(function(r){
    var cient=sciFindCient(r.species, BOSQUE_CATALOG.concat(getBosqueCustom()));
    var luna=null; try{ luna=mensLunaForKey(r.date); }catch(e){}
    var desc=((r.action||'observación')+(r.qty?' ('+r.qty+')':'')+(r.notes?' · '+r.notes:''))+(luna?' · Luna '+luna.luna+' d'+luna.dia:'');
    var cat=(BOSQUE_CATALOG.concat(getBosqueCustom()).filter(function(b){return b&&String(b.nombre).toLowerCase()===String(r.species||'').toLowerCase();})[0]||{});
    var priv=protRe.test(String((cat.nota||'')+' '+(cat.epoca||'')+' '+(cat.tipo||'')))?'obscured':'';
    rows.push([
      sciINatCell(cient||r.species||''),
      sciINatCell(((r.date||'')+' '+(r.time||'')).trim()),
      sciINatCell(desc),
      sciINatCell(r.place||'Penco, Bio-Bio, CL'),
      co.lat, co.lng,
      sciINatCell('penco,13-lunas,bosque-nativo'),
      priv
    ].join(','));
  });
  sciCsvDownload('inat-bosque-penco-'+cal.fmtKey.format(new Date())+'.csv', rows.join('\n')+'\n');
  alert('🌿 CSV iNaturalist listo (con encabezado).\nEspecies protegidas van como “obscured”.\nSúbelo en iNaturalist > Observations > Import > CSV import.');
}
function renderBirdsLog(){
  const box=$('birdsLogBox'); if(!box) return;
  const data=getBirdData().entries;
  const stats=$('birdsStats');
  if(!data.length){ box.innerHTML='<p class="muted">Sin avistamientos. Registra tu primero arriba.</p>'; if(stats) stats.textContent='0 avistamientos'; return; }
  const sorted=[...data].sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
  box.innerHTML=sorted.slice(0,60).map(it=>{
    const luna=mensLunaForKey(it.date);
    return `<div class="habit-item su-13313b"><span><b>${escapeHtml(it.species)}</b> ×${it.count} — ${escapeHtml(it.place||'—')} · ${escapeHtml(it.activity||'')} <br><span class="muted su-11a508">${it.date} ${it.time||''} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''}</span><br><span class="muted su-11a508">${escapeHtml(it.notes||'')}</span></span><span class="su-0c0cb1"><button data-id="${it.id}" class="btn bird-share su-337714" title="Compartir avistamiento">📤</button><button data-id="${it.id}" class="btn bird-edit su-337714">✏️</button><button data-id="${it.id}" class="btn bird-del su-fd834a">✕</button></span></div>`;
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
  const expEBird=$('birdsExportEBird'); if(expEBird) expEBird.onclick=()=>{ try{ exportBirdsEBird(); }catch(e){ alert('No se pudo exportar eBird: '+(e&&e.message||e)); } };
  const expINat=$('birdsExportINat'); if(expINat) expINat.onclick=()=>{ try{ exportBirdsINat(); }catch(e){ alert('No se pudo exportar iNat: '+(e&&e.message||e)); } };
}
setTimeout(setupBirdsDialog, 570);

// === INTERMAREAL — Rocas y pozas ===
const INTER_CATALOG = (typeof INTERMAREAL_PENCO!=='undefined'? INTERMAREAL_PENCO : (window.pencoData&&window.pencoData.INTERMAREAL_PENCO)||[]);
const INTER_CONSEJOS = (typeof CONSEJOS_INTERMAREAL!=='undefined'? CONSEJOS_INTERMAREAL : (window.pencoData&&window.pencoData.CONSEJOS_INTERMAREAL)||{});
// === ESPECIES PERSONALIZADAS — Intermareal (privado por usuario) ===
function getInterCustom(){ try{ const u=userData(); if(!u.interCustom) u.interCustom=[]; if(!Array.isArray(u.interCustom)) u.interCustom=[]; return u.interCustom; }catch(e){ return []; } }
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
    todayBox.innerHTML=`<div class="su-13313b"><span class="su-433de3"><b>🦀 Hoy — ${cal.fmtFull.format(new Date())}</b></span><span class="chip su-e4aba6">${todayCnt} hoy · ${cnt} total</span></div>`+
      `<p class="muted su-e13d76">Mareas hoy: ${tide.tides.map(t=> t.h+' '+t.t+' '+t.a).join(' · ')} ${tide.estimated?'*est.':''}</p>`+
      `<p class="muted su-11a508">${puede}${mejor? ' · mejor bajamar '+mejor.h+' ('+mejor.a+') · ventana 1h antes/después':''}</p>`+
      `<p class="muted su-0d5be0">Sernapesca marea roja: consulta sernapesca.cl antes de cosechar. Nunca solo, zapatilla con agarre.</p>`;
  }
  const moonBox=$('interMoonBox');
  if(moonBox){
    const k=cal.fmtKey.format(new Date());
    const r=getFishingRatingForKey(k);
    moonBox.innerHTML=`<b>${r.label}</b> — ${r.desc} · Bajamar viva = más roca expuesta. Luna nueva/llena → mejor.`;
  }
  const consejoBox=$('interConsejoBox');
  if(consejoBox && consejo){
    consejoBox.innerHTML=`<h4 class="su-49f9d7">🌊 ${escapeHtml(consejo.titulo)}</h4><p class="muted su-cdff1d">${escapeHtml(consejo.texto)}</p>`;
  }
  const catBox=$('interCatalogBox');
  if(catBox){
    const mineI=getInterCustom();
    catBox.innerHTML='<div class="fishing-species">'
      +INTER_CATALOG.map(b=>`<div class="fishing-species-item su-3b6a3a" data-inter="${escapeHtml(b.nombre)}"><b>${escapeHtml(b.icon||'🦀')} ${escapeHtml(b.nombre)}</b> — <span class="muted su-0d5be0">${escapeHtml(b.cient||'')}</span><br><span class="su-11a508">${escapeHtml(b.hab||'')} · ${escapeHtml(b.epoca||'')}</span><br><span class="muted su-0d5be0">${escapeHtml(b.nota||'')}</span></div>`).join('')
      +mineI.map((b,i)=>`<div class="fishing-species-item su-263abd" data-inter="${escapeHtml(b.nombre)}"><div class="su-533ebe"><span><b>${escapeHtml(b.icon||'🦀')} ${escapeHtml(b.nombre)}</b> <span class="chip su-421073">mía</span></span><button type="button" class="btn btn-icon intersp-del su-4503f1" data-i="${i}" title="Borrar mi especie">✕</button></div><span class="muted su-0d5be0">${escapeHtml(b.cient||'')}</span><br><span class="su-11a508">${escapeHtml(b.hab||'')} · ${escapeHtml(b.epoca||'')}</span><br><span class="muted su-0d5be0">${escapeHtml(b.nota||'')}</span></div>`).join('')
      +'</div>'
      +'<p class="muted su-b64a5a">Toca una especie para cargarla en el formulario. '+INTER_CATALOG.length+' base'+(mineI.length? ' + <b>'+mineI.length+' mías</b>':'')+'.</p>'
      +'<details class="su-9cf9f9"><summary class="su-d9db22"><b>➕ Agregar especie</b></summary>'
      +'<div class="conv-row su-8a77e5"><label class="su-4b3de7">Especie * <input type="text" id="interSpName" placeholder="ej: Lapa negra, Huiro palo" maxlength="30"></label><label>Icono <input type="text" id="interSpIcon" placeholder="🦀" maxlength="4" class="su-4a6a2f"></label></div>'
      +'<div class="conv-row"><label class="su-4b3de7">Nombre científico <input type="text" id="interSpCient" placeholder="ej: Fissurella sp." maxlength="40"></label><label>Época <input type="text" id="interSpEpoca" placeholder="ej: Todo el año" maxlength="25"></label></div>'
      +'<label>Hábitat <input type="text" id="interSpHab" placeholder="ej: Roquerío Playa Negra, pozas" maxlength="50"></label>'
      +'<label>Nota (talla, cosecha, cuidado) <input type="text" id="interSpNota" placeholder="ej: Talla 6cm+, 1 por roca" maxlength="80"></label>'
      +'<div class="dlg-actions su-59a5a8"><button type="button" id="interSpAdd" class="btn btn-accent su-30e741">+ Guardar especie</button></div></details>';
    catBox.querySelectorAll('[data-inter]').forEach(el=> el.onclick=(e)=>{ if(e.target && e.target.classList && e.target.classList.contains('intersp-del')) return; const inp=$('interSpecies'); if(inp){ inp.value=el.dataset.inter; inp.focus(); } });
    catBox.querySelectorAll('.intersp-del').forEach(b=> b.onclick=(e)=>{ e.stopPropagation(); const arr=getInterCustom(); arr.splice(parseInt(b.dataset.i,10),1); scheduleSave('Guardado ✓'); renderIntermarealDialog(); });
    const interSpAdd=$('interSpAdd');
    if(interSpAdd) interSpAdd.onclick=()=>{
      const n=sanitizeText(($('interSpName').value||'').trim(),30);
      if(!n) return alert('Pon el nombre de la especie');
      const arr=getInterCustom();
      if(INTER_CATALOG.some(x=>x.nombre.toLowerCase()===n.toLowerCase())||arr.some(x=>x.nombre.toLowerCase()===n.toLowerCase())) return alert('Esa especie ya existe');
      arr.push({ nombre:n, icon:sanitizeText(($('interSpIcon').value||'').trim(),4)||'🦀', cient:sanitizeText(($('interSpCient').value||'').trim(),40), hab:sanitizeText(($('interSpHab').value||'').trim(),50)||'Intermareal Penco', epoca:sanitizeText(($('interSpEpoca').value||'').trim(),25)||'Todo el año', nota:sanitizeText(($('interSpNota').value||'').trim(),80) });
      scheduleSave('Guardado ✓'); renderIntermarealDialog();
    };
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
    return `<div class="habit-item su-13313b"><span><b>${escapeHtml(it.species)}</b> ${it.qty? '· '+escapeHtml(it.qty):''} — ${escapeHtml(it.place||'—')}<br><span class="muted su-11a508">${it.date} ${it.time||''} ${it.tide? '· 🌊 '+escapeHtml(it.tide):''} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''}</span><br><span class="muted su-11a508">${escapeHtml(it.notes||'')}</span></span><span class="su-0c0cb1"><button data-id="${it.id}" class="btn inter-share su-337714" title="Compartir">📤</button><button data-id="${it.id}" class="btn inter-edit su-337714">✏️</button><button data-id="${it.id}" class="btn inter-del su-fd834a">✕</button></span></div>`;
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
// === ESPECIES PERSONALIZADAS — Bosque (privado por usuario) ===
function getBosqueCustom(){ try{ const u=userData(); if(!u.bosqueCustom) u.bosqueCustom=[]; if(!Array.isArray(u.bosqueCustom)) u.bosqueCustom=[]; return u.bosqueCustom; }catch(e){ return []; } }
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
    todayBox.innerHTML=`<div class="su-13313b"><span class="su-433de3"><b>🌳 Hoy — ${cal.fmtFull.format(new Date())} · ${estNombre}</b></span><span class="chip su-e4aba6">${todayCnt} hoy · ${cnt} total</span></div>`+
      `<p class="muted su-e13d76">Cordillera de Penco: bosque esclerófilo (boldo, peumo, quillay) + laurifolio en quebradas (lingue, canelo). No hagas fuego, no dejes rastro.</p>`;
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
    consejoBox.innerHTML=`<h4 class="su-49f9d7">🌳 ${escapeHtml(consejo.titulo)}</h4><p class="muted su-cdff1d">${escapeHtml(consejo.texto)}</p>`;
  }
  const catBox=$('bosqueCatalogBox');
  if(catBox){
    const mineBo=getBosqueCustom();
    const esProt=(b)=>/proteg|peligro|vulnerable|permiso|CONAF|monumento|ley/i.test(String(b.nota||'')+' '+String(b.epoca||'')+' '+String(b.tipo||''));
    const tipos=[...new Set(BOSQUE_CATALOG.map(b=>b.tipo||'Nativa'))].sort((a,b)=>a.localeCompare(b,'es'));
    const fq=(window._bosqueSpQ||''), ft=(window._bosqueSpTipo||''), fp=!!window._bosqueSpProt, fo=(window._bosqueSpOrden||'az');
    const nProt=BOSQUE_CATALOG.filter(esProt).length;
    const card=(b,extra)=>{
      const prot=esProt(b);
      return `<article class="bosque-sp-card${prot?' is-prot':''}${extra||''}" data-bosque="${escapeHtml(b.nombre)}" tabindex="0" title="Toca para cargarla en la bitácora">`
      +`<div class="bosque-sp-top"><span class="bosque-sp-ico">${escapeHtml(b.icon||'🌳')}</span><div><b>${escapeHtml(b.nombre)}</b><br><span class="muted bosque-sp-cient"><i>${escapeHtml(b.cient||'')}</i></span></div></div>`
      +`<div class="bosque-sp-tags"><span class="chip su-8b29b9">${escapeHtml(b.tipo||'Nativa')}</span>${prot?'<span class="chip bosque-sp-prot">🛡️ solo observar</span>':''}${(extra||'').indexOf('mia')>=0?'<span class="chip su-421073">mía</span>':''}</div>`
      +`<p class="bosque-sp-meta">📍 ${escapeHtml(b.hab||'Penco')} · 📅 ${escapeHtml(b.epoca||'—')}</p>`
      +`<p class="bosque-sp-sem">🌰 ${escapeHtml(b.semillas||'—')}</p>`
      +(b.nota?`<details class="bosque-sp-det"><summary>Ver nota</summary><p class="muted">${escapeHtml(b.nota)}</p></details>`:'')
      +`<div class="bosque-sp-actions"><button type="button" class="btn bosque-sp-load" data-load="${escapeHtml(b.nombre)}">📓 Cargar</button><button type="button" class="btn bosque-sp-semilla" data-semilla="${escapeHtml(b.nombre)}" title="Cargar como recolección de semillas">🌰 Semilla</button>${(extra||'').indexOf('mia')>=0?`<button type="button" class="btn btn-icon bosquesp-del" data-i="${b._mi}" title="Borrar mi especie">✕</button>`:''}</div></article>`;
    };
    catBox.innerHTML='<div class="bosque-sp-toolbar">'
      +'<div class="bosque-sp-counts"><span class="chip">🌿 '+BOSQUE_CATALOG.length+' nativas</span><span class="chip">🛡️ '+nProt+' protegidas</span>'+(mineBo.length?'<span class="chip">⭐ +'+mineBo.length+' mías</span>':'')+'<span class="chip" id="bosqueSpCount"></span></div>'
      +'<input type="text" id="bosqueCatFilter" placeholder="🔍 Buscar... (ej: fruto, quebrada, melífero, vulnerable)" autocomplete="off" value="'+escapeHtml(fq)+'">'
      +'<div class="bosque-sp-filters"><label>Tipo <select id="bosqueSpTipoF"><option value="">Todos</option>'+tipos.map(t=>`<option value="${escapeHtml(t)}"${ft===t?' selected':''}>${escapeHtml(t)}</option>`).join('')+'</select></label>'
      +`<label class="bosque-sp-check"><input type="checkbox" id="bosqueSpProtF"${fp?' checked':''}> 🛡️ protegidas</label>`
      +`<label>Orden <select id="bosqueSpOrdenF"><option value="az"${fo==='az'?' selected':''}>A–Z</option><option value="semilla"${fo==='semilla'?' selected':''}>Por semilla</option></select></label></div>`
      +'<p class="muted bosque-sp-hint">Toca una tarjeta (o 📓) para cargarla en la bitácora · 🌰 la carga como <i>recolección semillas</i>.</p></div>'
      +'<div class="bosque-sp-grid" id="bosqueSpGrid"></div>'
      +'<p class="muted su-b64a5a" id="bosqueSpEmpty" hidden>Sin coincidencias. Prueba con “quebrada”, “fruto” o limpia el filtro.</p>'
      +'<details class="su-9cf9f9"><summary class="su-d9db22"><b>➕ Agregar especie</b></summary>'
      +'<div class="conv-row su-8a77e5"><label class="su-4b3de7">Especie * <input type="text" id="bosqueSpName" placeholder="ej: Huillipatagua, Olivillo" maxlength="30"></label><label>Icono <input type="text" id="bosqueSpIcon" placeholder="🌳" maxlength="4" class="su-4a6a2f"></label></div>'
      +'<div class="conv-row"><label class="su-4b3de7">Nombre científico <input type="text" id="bosqueSpCient" placeholder="ej: Citronella mucronata" maxlength="40"></label><label>Tipo <input type="text" id="bosqueSpTipo" placeholder="ej: Árbol, Arbusto" maxlength="20"></label></div>'
      +'<div class="conv-row"><label class="su-4b3de7">Hábitat <input type="text" id="bosqueSpHab" placeholder="ej: Quebrada Honda" maxlength="50"></label><label>Época <input type="text" id="bosqueSpEpoca" placeholder="ej: Flor Nov-Dic" maxlength="25"></label></div>'
      +'<label>🌰 Semillas <input type="text" id="bosqueSpSem" placeholder="ej: Feb-Abr, siembra inmediata" maxlength="50"></label>'
      +'<label>Nota <input type="text" id="bosqueSpNota" placeholder="ej: Solo observar, no cortar" maxlength="80"></label>'
      +'<div class="dlg-actions su-59a5a8"><button type="button" id="bosqueSpAdd" class="btn btn-accent su-30e741">+ Guardar especie</button></div></details>';
    const norm=(s)=>{ try{ return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }catch(e){ return String(s==null?'':s).toLowerCase(); } };
    const grid=$('bosqueSpGrid');
    const cargarEnBitacora=(nombre,comoSemilla)=>{
      const inp=$('bosqueSpecies'); if(inp) inp.value=nombre;
      const act=$('bosqueAction');
      if(act && comoSemilla) act.value='recolección semillas';
      try{ const f=$('bosqueDate'); if(f) f.scrollIntoView({behavior:'smooth',block:'center'}); if(inp) inp.focus(); }catch(e){}
    };
    const pintar=()=>{
      const q=norm(window._bosqueSpQ||''), t=window._bosqueSpTipo||'', soloP=!!window._bosqueSpProt, ord=window._bosqueSpOrden||'az';
      let base=BOSQUE_CATALOG.map((b,i)=>({b,i}));
      if(ord==='semilla') base=base.slice().sort((a,b)=>String(a.b.semillas||'~').localeCompare(String(b.b.semillas||'~'),'es'));
      else base=base.slice().sort((a,b)=>String(a.b.nombre).localeCompare(String(b.b.nombre),'es'));
      const mias=mineBo.map((b,i)=>{ b._mi=i; return {b,mi:true}; });
      const todos=base.concat(mias);
      const vis=todos.filter(({b})=>{
        if(t && (b.tipo||'Nativa')!==t) return false;
        if(soloP && !esProt(b)) return false;
        if(!q) return true;
        return (norm(b.nombre+' '+(b.cient||'')+' '+(b.hab||'')+' '+(b.epoca||'')+' '+(b.tipo||'')+' '+(b.semillas||'')+' '+(b.nota||'')).indexOf(q)>=0);
      });
      grid.innerHTML=vis.map(({b,mi})=>card(b,mi?' mia su-263abd':' su-3b6a3a')).join('');
      const empty=$('bosqueSpEmpty'); if(empty) empty.hidden=vis.length>0;
      const cnt=$('bosqueSpCount'); if(cnt) cnt.textContent=vis.length+' visibles';
      grid.querySelectorAll('.bosque-sp-card').forEach(el=>{
        el.onclick=(e)=>{
          if(e.target && e.target.closest && (e.target.closest('[data-i]')||e.target.closest('button')||e.target.closest('summary'))) return;
          cargarEnBitacora(el.dataset.bosque,false);
        };
        el.onkeydown=(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); cargarEnBitacora(el.dataset.bosque,false); } };
      });
      grid.querySelectorAll('[data-load]').forEach(btn=> btn.onclick=(e)=>{ e.stopPropagation(); cargarEnBitacora(btn.getAttribute('data-load'),false); });
      grid.querySelectorAll('[data-semilla]').forEach(btn=> btn.onclick=(e)=>{ e.stopPropagation(); cargarEnBitacora(btn.getAttribute('data-semilla'),true); });
      grid.querySelectorAll('.bosquesp-del').forEach(b=> b.onclick=(e)=>{ e.stopPropagation(); const arr=getBosqueCustom(); arr.splice(parseInt(b.dataset.i,10),1); scheduleSave('Guardado ✓'); renderBosqueDialog(); });
    };
    const fQ=$('bosqueCatFilter'), fT=$('bosqueSpTipoF'), fP=$('bosqueSpProtF'), fO=$('bosqueSpOrdenF');
    if(fQ) fQ.addEventListener('input',()=>{ window._bosqueSpQ=fQ.value||''; try{ if(typeof bosqueCatQ!=='undefined') bosqueCatQ=window._bosqueSpQ; }catch(e){} pintar(); });
    if(fT) fT.addEventListener('change',()=>{ window._bosqueSpTipo=fT.value||''; pintar(); });
    if(fP) fP.addEventListener('change',()=>{ window._bosqueSpProt=fP.checked; pintar(); });
    if(fO) fO.addEventListener('change',()=>{ window._bosqueSpOrden=fO.value||'az'; pintar(); });
    pintar();
    const bosqueSpAdd=$('bosqueSpAdd');
    if(bosqueSpAdd) bosqueSpAdd.onclick=()=>{
      const n=sanitizeText(($('bosqueSpName').value||'').trim(),30);
      if(!n) return alert('Pon el nombre de la especie');
      const arr=getBosqueCustom();
      if(BOSQUE_CATALOG.some(x=>x.nombre.toLowerCase()===n.toLowerCase())||arr.some(x=>x.nombre.toLowerCase()===n.toLowerCase())) return alert('Esa especie ya existe');
      arr.push({ nombre:n, icon:sanitizeText(($('bosqueSpIcon').value||'').trim(),4)||'🌳', cient:sanitizeText(($('bosqueSpCient').value||'').trim(),40), tipo:sanitizeText(($('bosqueSpTipo').value||'').trim(),20)||'Nativa', hab:sanitizeText(($('bosqueSpHab').value||'').trim(),50)||'Penco', epoca:sanitizeText(($('bosqueSpEpoca').value||'').trim(),25)||'Todo el año', semillas:sanitizeText(($('bosqueSpSem').value||'').trim(),50), nota:sanitizeText(($('bosqueSpNota').value||'').trim(),80) });
      scheduleSave('Guardado ✓'); renderBosqueDialog();
    };
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
    return `<div class="habit-item su-13313b"><span><b>${escapeHtml(it.species)}</b> · <span class="chip su-0d5be0">${escapeHtml(it.action||'observación')}</span> ${it.qty? '· '+escapeHtml(it.qty):''} — ${escapeHtml(it.place||'—')}<br><span class="muted su-11a508">${it.date} ${it.time||''} ${luna? '· Luna '+luna.luna+' d'+luna.dia:''}</span><br><span class="muted su-11a508">${escapeHtml(it.notes||'')}</span></span><span class="su-0c0cb1"><button data-id="${it.id}" class="btn bosque-share su-337714" title="Compartir">📤</button><button data-id="${it.id}" class="btn bosque-edit su-337714">✏️</button><button data-id="${it.id}" class="btn bosque-del su-fd834a">✕</button></span></div>`;
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
  const expINat=$('bosqueExportINat'); if(expINat) expINat.onclick=()=>{ try{ exportBosqueINat(); }catch(e){ alert('No se pudo exportar iNat: '+(e&&e.message||e)); } };
}
setTimeout(setupBosqueDialog, 576);
