// core-clima.js — extraído de renderer.js (núcleo compartido, scope top-level).
// Clima Penco: WMO, offline, panel online (open-meteo), aire/UV. Carga diferida antes de renderer.js.
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

// === CLIMA OFFLINE PENCO (no depende de internet) ===
// Climatología de referencia Golfo de Arauco / Penco (promedios históricos).
// No es pronóstico exacto: sirve para prever escenario probable sin conexión.
const CLIMA_PENCO_MESES = [
  { m: 1,  nombre: 'Enero',      icono: '🌤️', tmax: 23, tmin: 12, lluviaMm: 12,  diasLluvia: 2,  probLluvia: 5,  viento: 'Sur / SO 15–30 km/h en tardes', resumen: 'Seco y templado. Mañanas frescas con vaguada costera, tardes con viento sur. Niebla matinal que despeja a media mañana.' },
  { m: 2,  nombre: 'Febrero',    icono: '🌤️', tmax: 23, tmin: 12, lluviaMm: 13,  diasLluvia: 2,  probLluvia: 5,  viento: 'Sur / SO 15–30 km/h en tardes', resumen: 'El mes más estable. Calor moderado, noches frescas. Viento sur fuerte en la costa después de las 14h.' },
  { m: 3,  nombre: 'Marzo',      icono: '⛅', tmax: 21, tmin: 11, lluviaMm: 25,  diasLluvia: 4,  probLluvia: 15, viento: 'Sur débil + calmas matinales', resumen: 'Transición. Menos viento sur, nieblas matinales, primera lluvia débil a fin de mes.' },
  { m: 4,  nombre: 'Abril',      icono: '🌦️', tmax: 18, tmin: 9,  lluviaMm: 70,  diasLluvia: 7,  probLluvia: 35, viento: 'Norte / NO con frentes 20–40 km/h', resumen: 'Otoño instalado. Frentes del norte, mañanas frías, chubascos intermitentes y arcoíris.' },
  { m: 5,  nombre: 'Mayo',       icono: '🌧️', tmax: 16, tmin: 7,  lluviaMm: 150, diasLluvia: 12, probLluvia: 55, viento: 'Norte / NO temporal 40–70 km/h', resumen: 'Lluvioso. Temporales del N/NO, marejadas, barro. Primeras heladas débiles tras despeje.' },
  { m: 6,  nombre: 'Junio',      icono: '🌧️', tmax: 14, tmin: 6,  lluviaMm: 190, diasLluvia: 14, probLluvia: 65, viento: 'Norte temporal + sur helado tras frente', resumen: 'Pleno Pukem. Frentes seguidos, viento norte fuerte, heladas tras la lluvia. Días cortos.' },
  { m: 7,  nombre: 'Julio',      icono: '🌧️', tmax: 13, tmin: 5,  lluviaMm: 170, diasLluvia: 13, probLluvia: 65, viento: 'Norte / NO + calmas heladas', resumen: 'El mes más frío. Lluvia + heladas matinales (0–3°C). Rocío congelado y escarcha en quebradas.' },
  { m: 8,  nombre: 'Agosto',     icono: '🌦️', tmax: 14, tmin: 5,  lluviaMm: 140, diasLluvia: 12, probLluvia: 55, viento: 'Norte / Sur alternados', resumen: 'Fin de invierno. Alterna temporal con días despejados fríos. Viento sur anuncia despeje.' },
  { m: 9,  nombre: 'Septiembre', icono: '⛅', tmax: 16, tmin: 6,  lluviaMm: 80,  diasLluvia: 9,  probLluvia: 40, viento: 'Sur vuelve 15–25 km/h', resumen: 'Primavera temprana. Chubascos + días luminosos. Viento sur vuelve y limpia el cielo.' },
  { m: 10, nombre: 'Octubre',    icono: '⛅', tmax: 18, tmin: 7,  lluviaMm: 50,  diasLluvia: 6,  probLluvia: 25, viento: 'Sur / SO moderado', resumen: 'Primavera plena. Días largos, mañanas frías, tardes templadas. Últimas lluvias útiles para la huerta.' },
  { m: 11, nombre: 'Noviembre',  icono: '🌤️', tmax: 20, tmin: 9,  lluviaMm: 30,  diasLluvia: 4,  probLluvia: 15, viento: 'Sur 15–30 km/h', resumen: 'Primavera tardía. Estable, sur moderado, baja lluvia. Ideal para trasplantes y pesca de orilla.' },
  { m: 12, nombre: 'Diciembre',  icono: '☀️', tmax: 22, tmin: 11, lluviaMm: 18,  diasLluvia: 3,  probLluvia: 10, viento: 'Sur / SO fuerte en tardes', resumen: 'Inicio de verano. Seco, tardes ventosas, vaguada matinal. Riesgo de insolación 12–17h.' }
];
function climaMesOffline(date) {
  let m = 1;
  try {
    if (typeof cal !== 'undefined' && cal.santiagoParts) m = cal.santiagoParts(date.getTime()).m;
    else m = date.getMonth() + 1;
  } catch { m = date.getMonth() + 1; }
  return CLIMA_PENCO_MESES[m - 1];
}
function climaConsejosOffline(mes) {
  // Consejos prácticos ligados al escenario del mes (funcionan 100% offline)
  const c = [];
  if (mes.probLluvia >= 50) {
    c.push({ t: '🌧️ Lluvia / temporal', d: 'Limpia canaletas y acequias. Guarda leña bajo techo y levanta camas de huerta. Evita roqueríos y costanera con marejada. Lleva capa, no paraguas con viento norte.' });
    c.push({ t: '🧥 Salud invernal', d: 'Ventila 10 min al día aunque llueva (evita hongos). Seca ropa con ventilación, no sobre estufa. Caldo caliente + lawen (eucalipto/maqui) ante resfrío. Revisa 🌬️ Aire Penco si usas leña.' });
  } else if (mes.probLluvia >= 25) {
    c.push({ t: '🌦️ Chubascos intermitentes', d: 'Sal con capas: mañana fría + tarde templada. Aprovecha claros para sembrar/trasplantar (ver 🌱 Siembra). Cubre almacigos de noche.' });
  } else {
    c.push({ t: '☀️ Seco / estable', d: 'Riega al atardecer (menos evaporación). Cosecha y seca hierbas a la sombra. Protector solar y gorro 12–17h. Guarda agua si tienes estanque.' });
  }
  if (mes.tmin <= 6) c.push({ t: '❄️ Heladas', d: 'Tapa plantines con manta térmica o botellas cortadas. Entra mascotas/plantas sensibles. No riegues de noche (se congela). En la mañana, riego suave solo si no hay escarcha.' });
  if (/Sur/.test(mes.viento)) c.push({ t: '💨 Viento sur', d: 'Buen tiempo 2–3 días. Ideal para pesca de orilla 2h antes/después de pleamar, secar ropa y ventilar casa. Afirma invernadero y malla sombra. No hagas fuego en bosque/quebrada.' });
  if (/Norte/.test(mes.viento)) c.push({ t: '🧭 Viento norte', d: 'Anuncia lluvia en 12–24h. Asegura techo, toldos y botes. No salgas en kayak/bote. Revisa 🌊 Mareas + alerta SHOA/Senapred.' });
  if (mes.tmax >= 21) c.push({ t: '🌡️ Calor costa', d: 'Hidrata + sombra. Evita esfuerzo 12–17h. Revisa marea roja antes de mariscar (sernapesca.cl). Guarda semillas en lugar fresco.' });
  else c.push({ t: '🌱 Huerta del mes', d: 'Revisa 🌱 Siembra lunar: este mes ' + mes.resumen.split('.')[0] + '. Mulchea para guardar calor y evita encharcar.' });
  c.push({ t: '🎣 Pesca / costa', d: 'Con sur estable: amanecer y atardecer = pique. Con norte/temporal: no salgas. Consulta 🌊 Mareas y bitácora 🎣 Pesca.' });
  return c;
}
function climaSenasNaturalesHTML() {
  return `<details class="menstrual-details"><summary>🔭 Prevé sin internet — señas del cielo, mar y campo (Penco)</summary>
    <div class="si-card"><h4>☁️ Nubes</h4><p>Cirros altos en velo + presión bajando = lluvia en 12–24h. Estratos bajos pegados al cerro en la mañana que no levantan a las 11h = tarde lluviosa. Cúmulos algodonosos aislados con sur = buen tiempo.</p></div>
    <div class="si-card"><h4>💨 Viento</h4><p><b>Norte tibio y húmedo</b> que gira al NO + mar picado = frente llegando. <b>Sur frío y seco</b> que limpia = despeje 2–3 días. Calma total + niebla espesa en Rocuant = helada nocturna si despeja.</p></div>
    <div class="si-card"><h4>🌙 Luna y cielo</h4><p>Halo alrededor de la luna (cerco) = humedad alta, lluvia en 24–48h. Luna muy nítida + estrellas titilando poco + aire frío = helada. Atardecer rojo intenso con sur = buen día siguiente; atardecer plomo con norte = agua.</p></div>
    <div class="si-card"><h4>🌊 Mar y aves</h4><p>Olas que rompen más adentro + espuma amarillenta + gaviotas tierra adentro = marejada/temporal. Yecos y pelícanos pegados a la costa = viento norte. Zorzal cantando fuerte al amanecer invernal = despeje parcial.</p></div>
    <div class="si-card"><h4>📏 Truco casero 3 pasos (sin instrumentos)</h4><p>1) Mira el oeste al atardecer (de dónde viene el clima). 2) Siente el viento en la cara 1 min: norte húmedo = agua, sur seco = despeje. 3) Mira la luna/estrellas de noche: halo = prepara capa y guarda leña. Anota en 📝 Notas del día para aprender tu microclima.</p></div>
  </details>`;
}
// --- Guía offline ordenada por secciones (pestañas internas) ---
let climaOfflineSec = 'mes'; // mes | consejos | senas
function climaRefDias(nowDate) {
  const dd = nowDate.getDate();
  const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return [0, 1, 2].map(off => {
    const d = new Date(nowDate); d.setDate(dd + off);
    const mm = climaMesOffline(d);
    const v = (off * 37 + d.getDate() * 13) % 3;
    const tmax = mm.tmax + (v === 0 ? -1 : v === 2 ? 1 : 0);
    const tmin = mm.tmin + (v === 2 ? -1 : 0);
    const prob = Math.max(0, Math.min(90, mm.probLluvia + (v === 0 ? -5 : v === 2 ? 8 : 0)));
    const label = off === 0 ? 'Hoy ' + WD[d.getDay()] + ' ' + d.getDate() : off === 1 ? 'Mañana ' + WD[d.getDay()] + ' ' + d.getDate() : WD[d.getDay()] + ' ' + d.getDate();
    return { label, icono: mm.icono, tmax, tmin, prob, viento: mm.viento };
  });
}
function buildOfflineMesHTML(nowDate, cacheInfo) {
  const mes = climaMesOffline(nowDate);
  const dias = climaRefDias(nowDate);
  const cacheTxt = cacheInfo && cacheInfo.ts
    ? `<span class="chip">💾 Último dato online: ${cacheInfo.ts} · ${escapeHtml(cacheInfo.resumen || '')}</span>`
    : `<span class="chip" style="color:var(--muted)">💾 Sin dato online guardado aún — conéctate una vez para guardar referencia</span>`;
  return `<div class="wp-current">${mes.icono} <b>Penco · ${mes.nombre}:</b> esperable ${mes.tmin}–${mes.tmax}°C · 💧${mes.probLluvia}% lluvia · 💨 ${escapeHtml(mes.viento)}</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${cacheTxt}<span class="chip">🌧️ Lluvia mes ~${mes.lluviaMm} mm en ~${mes.diasLluvia} días</span></div>
  <p class="muted" style="margin:4px 0 8px">${escapeHtml(mes.resumen)}</p>
  <div class="wp-hours-title">Referencia próximos 3 días (climatología)</div>
  <div class="wp-days">${dias.map(d => `<div class="wp-day"><div class="wd-date">${escapeHtml(d.label)}</div><div class="wd-ico">${d.icono}</div><div>${d.tmin}–${d.tmax}°C</div><div class="wd-date">💧${d.prob}%</div><div class="wd-date" style="font-size:10px">${escapeHtml(d.viento.split(' ')[0])} ${escapeHtml(d.viento.split(' ')[1] || '')}</div></div>`).join('')}</div>
  <p class="muted" style="font-size:11px;margin-top:8px">📴 Climatología histórica, no pronóstico exacto. Promedios Concepción/Penco — ajusta mirando cielo y viento.</p>`;
}
function buildOfflineConsejosHTML(nowDate) {
  const mes = climaMesOffline(nowDate);
  const consejos = climaConsejosOffline(mes);
  return `<div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">${consejos.map(c => `<div class="si-card"><h4>${escapeHtml(c.t)}</h4><p>${escapeHtml(c.d)}</p></div>`).join('')}</div>
  <p class="muted" style="font-size:12px;margin-top:8px">Conecta: 🌱 Siembra lunar · 🎣 Pesca según viento · 🪵 Leña & Pellet en heladas · 🌬️ Aire Penco si hay humo · 🌊 Mareas antes de costa · 🌿 Lawen para resfríos. Todo funciona offline.</p>`;
}
function buildOfflineSenasHTML() {
  // Contenido directo (sin <details> anidado): al hacer clic en 🔭 Señas se ve al tiro
  return `<p class="muted" style="margin:4px 0 8px">🔭 Señas del cielo, mar y campo en Penco — mira esto antes de salir, sin internet.</p>
  <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
    <div class="si-card"><h4>☁️ Nubes</h4><p>Cirros altos en velo = lluvia en 12–24h. Estratos pegados al cerro que no levantan a las 11h = tarde lluviosa. Cúmulos algodonosos aislados con sur = buen tiempo.</p></div>
    <div class="si-card"><h4>💨 Viento</h4><p><b>Norte tibio y húmedo</b> que gira al NO + mar picado = frente llegando. <b>Sur frío y seco</b> que limpia = despeje 2–3 días. Calma + niebla espesa en Rocuant = helada nocturna si despeja.</p></div>
    <div class="si-card"><h4>🌙 Luna y cielo</h4><p>Halo alrededor de la luna (cerco) = humedad alta, lluvia en 24–48h. Luna nítida + estrellas que casi no titilan + aire frío = helada. Atardecer rojo con sur = buen día; plomo con norte = agua.</p></div>
    <div class="si-card"><h4>🌊 Mar y aves</h4><p>Olas que rompen más adentro + espuma amarillenta + gaviotas tierra adentro = marejada/temporal. Yecos pegados a la costa = viento norte. Zorzal cantando fuerte al amanecer invernal = despeje parcial.</p></div>
    <div class="si-card"><h4>📏 Truco 3 pasos</h4><p>1) Mira el oeste al atardecer. 2) Siente el viento 1 min: norte húmedo = agua, sur seco = despeje. 3) De noche: halo = prepara capa y guarda leña. Anótalo en 📝 Notas del día.</p></div>
  </div>`;
}
function buildOfflineClimaHTML(nowDate, cacheInfo) {
  // Sub-pestañas ordenadas dentro de la guía offline
  const sec = climaOfflineSec || 'mes';
  const btn = (id, label) => `<button type="button" id="${id}" class="btn${sec === id.replace('climaSec', '').toLowerCase() ? ' btn-accent' : ''}" style="width:auto">${label}</button>`;
  let body = '';
  if (sec === 'consejos') body = buildOfflineConsejosHTML(nowDate);
  else if (sec === 'senas') body = buildOfflineSenasHTML();
  else body = buildOfflineMesHTML(nowDate, cacheInfo);
  return `<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">
      <button type="button" id="climaSecMes" class="btn${sec === 'mes' ? ' btn-accent' : ''}" style="width:auto">📅 Mes</button>
      <button type="button" id="climaSecConsejos" class="btn${sec === 'consejos' ? ' btn-accent' : ''}" style="width:auto">💡 Consejos</button>
      <button type="button" id="climaSecSenas" class="btn${sec === 'senas' ? ' btn-accent' : ''}" style="width:auto">🔭 Señas</button>
    </div><div id="climaOfflineBody">${body}</div>`;
}
function bindOfflineClimaTabs(nowDate, cacheInfo) {
  const m = $('climaSecMes'), c = $('climaSecConsejos'), s = $('climaSecSenas');
  const body = $('climaOfflineBody');
  if (!body) return;
  const paint = () => {
    if (m) m.classList.toggle('btn-accent', climaOfflineSec === 'mes');
    if (c) c.classList.toggle('btn-accent', climaOfflineSec === 'consejos');
    if (s) s.classList.toggle('btn-accent', climaOfflineSec === 'senas');
    if (climaOfflineSec === 'consejos') body.innerHTML = buildOfflineConsejosHTML(nowDate);
    else if (climaOfflineSec === 'senas') body.innerHTML = buildOfflineSenasHTML();
    else body.innerHTML = buildOfflineMesHTML(nowDate, cacheInfo);
  };
  if (m) m.onclick = () => { climaOfflineSec = 'mes'; paint(); };
  if (c) c.onclick = () => { climaOfflineSec = 'consejos'; paint(); };
  if (s) s.onclick = () => { climaOfflineSec = 'senas'; paint(); };
}
function getClimaCache() {
  try {
    const raw = localStorage.getItem('climaPencoCacheV1');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function setClimaCache(resumen) {
  try {
    const now = new Date();
    const ts = now.toLocaleString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('climaPencoCacheV1', JSON.stringify({ ts, resumen }));
  } catch {}
}
// === UV / SOL + AIRE dentro de Clima ===
const UV_PENCO_MES = [11, 10, 8, 5, 3, 2, 2, 3, 5, 7, 9, 11];
function uvNivel(v) {
  if (v == null || isNaN(v)) return { label: '—', color: '#9aa3c7', consejo: 'Sin dato UV.' };
  if (v < 3) return { label: 'Bajo', color: '#7ab8ff', consejo: 'Riesgo bajo. Igual usa gorro si estás horas al sol.' };
  if (v < 6) return { label: 'Moderado', color: '#a9d18e', consejo: 'Bloqueador FPS 30+, gorro y sombra al mediodía.' };
  if (v < 8) return { label: 'Alto', color: '#e8c56a', consejo: 'FPS 50, evita 12–16h. Niños y piel clara a la sombra.' };
  if (v < 11) return { label: 'Muy alto', color: '#ff9a6a', consejo: 'Evita playa 11–17h. Reaplica bloqueador cada 2h + tras baño.' };
  return { label: 'Extremo', color: '#e76e8a', consejo: 'No te expongas 11–17h. Sombra, agua, manga larga y lentes UV.' };
}
function uvMesOffline(date) {
  let m = 1;
  try { m = (typeof cal !== 'undefined' && cal.santiagoParts) ? cal.santiagoParts(date.getTime()).m : date.getMonth() + 1; }
  catch { m = date.getMonth() + 1; }
  return { mes: m, uv: UV_PENCO_MES[m - 1] };
}
function buildSolOfflineHTML(nowDate) {
  const { mes, uv } = uvMesOffline(nowDate);
  const n = uvNivel(uv);
  const nombreMes = CLIMA_PENCO_MESES[mes - 1].nombre;
  return `<div class="wp-current">☀️ <b>Sol / UV · ${nombreMes} (offline):</b> índice máximo típico <b style="color:${n.color}">UV ${uv} (${n.label})</b></div>
  <p class="muted" style="margin:4px 0 8px">${escapeHtml(n.consejo)} En Penco el viento sur engaña: quema aunque esté fresco.</p>
  <div class="wp-days">${UV_PENCO_MES.map((u, i) => { const nn = uvNivel(u); return `<div class="wp-day${i + 1 === mes ? ' now' : ''}" title="${CLIMA_PENCO_MESES[i].nombre}: ${nn.label}"><div class="wd-date">${CLIMA_PENCO_MESES[i].nombre.slice(0, 3)}</div><div class="wd-ico">☀️</div><div><b style="color:${nn.color}">UV ${u}</b></div><div class="wd-date">${nn.label}</div></div>`; }).join('')}</div>
  <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-top:8px">
    <div class="si-card"><h4>🏖️ Horarios playa Penco</h4><p>Antes de las 11h y después de las 17h = exposición más segura. Entre 12–16h busca sombra (quiosco, árbol, toldo). Con vaguada matinal el UV igual atraviesa la nube.</p></div>
    <div class="si-card"><h4>🧴 Exposición segura</h4><p>FPS 50 en cara/hombros, reaplica cada 2h y tras baño. Gorro ala ancha + lentes con filtro UV. Niños y bebés siempre a la sombra + hidratación. Lleva 1L agua por persona.</p></div>
    <div class="si-card"><h4>🌬️ Viento + sol</h4><p>Sur fuerte reseca y quema labios: bálsamo + agua. Norte nublado no significa UV cero: igual protege si estás horas fuera. Revisa 💨 viento en Pronóstico antes de toldos.</p></div>
    <div class="si-card"><h4>⚠️ Golpe de calor</h4><p>Mareo, piel caliente, dolor cabeza = sombra + agua + paños fríos. No dejes niños/mascotas en auto. Si no mejora, llama al 131 / ve al CESFAM.</p></div>
  </div>`;
}
function getAireCache() { try { const r = localStorage.getItem('airePencoCacheV1'); return r ? JSON.parse(r) : null; } catch { return null; } }
function setAireCache(pm25, aqi) {
  try {
    const ts = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('airePencoCacheV1', JSON.stringify({ ts, pm25, aqi }));
  } catch {}
}
function buildAireOfflineHTML(nowDate) {
  const c = getAireCache();
  let mes = 1;
  try { mes = (typeof cal !== 'undefined' && cal.santiagoParts) ? cal.santiagoParts(nowDate.getTime()).m : nowDate.getMonth() + 1; } catch { mes = nowDate.getMonth() + 1; }
  const invierno = (mes >= 4 && mes <= 9);
  return `<div class="wp-current">🌬️ <b>Aire Penco ${invierno ? '(Pukem: riesgo humo de leña)' : '(estable, ventila sin miedo)'}:</b> ${c && c.ts ? `💾 último PM2.5 ≈ <b>${Math.round(c.pm25)} µg/m³</b> · AQI ${c.aqi ?? '—'} <span class="muted">(${escapeHtml(c.ts)})</span>` : 'sin dato online guardado — usa la guía visual'}</div>
  <p class="muted" style="margin:4px 0 8px">${invierno ? 'Abr–Sep el humo se estanca sobre la bahía. Si ves capa gris + olor a leña, aplica modo invierno.' : 'Con sur estable ventila 10 min al mediodía. Si hay incendio/forestal, cierra y recircula.'}</p>
  <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
    <div class="si-card"><h4>🔥 Leña seca</h4><p>Quema solo &lt;25% humedad, carga pequeña y aire abierto. Humo denso = mala combustión = más PM2.5 en tu casa y la vecina.</p></div>
    <div class="si-card"><h4>🪟 Ventila</h4><p>10 min al mediodía (mejor aire), no de noche con humo. Si hay preemergencia SEREMI: no más humo, sigue radio/muni.</p></div>
    <div class="si-card"><h4>😷 Grupos sensibles</h4><p>Niños, mayores y asma: evita ejercicio en costanera con humo. Mascarilla si hay alerta. Oficial: SINCA sinca.mma.gob.cl.</p></div>
  </div>
  <div class="dlg-actions" style="justify-content:flex-start;margin-top:8px"><button type="button" id="climaOpenAire" class="btn btn-accent" style="width:auto">🌬️ Abrir Aire Penco completo</button></div>`;
}
function bindClimaOpenAire() {
  const b = $('climaOpenAire') || $('climaOpenAire2');
  if (b) b.onclick = () => { try { $('aireDialog').showModal(); if (typeof fetchAire === 'function') fetchAire(); } catch {} };
}
async function fetchAireMiniInto() {
  const box = $('climaAireMini');
  if (!box) return;
  const c = getAireCache();
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-36.73194&longitude=-72.9925&hourly=pm2_5,us_aqi&timezone=America%2FSantiago&forecast_days=1', { signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) throw new Error('http');
    const j = await r.json();
    const times = j.hourly.time, vals = j.hourly.pm2_5, aqis = j.hourly.us_aqi;
    let p = null;
    try { p = cal.santiagoParts(Date.now()); } catch {}
    const key = p ? `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}T${String(p.hh).padStart(2, '0')}` : '';
    let idx = key ? times.findIndex(t => t >= key) : vals.length - 1;
    if (idx < 0) idx = vals.length - 1;
    const pm25 = vals[idx], aqi = aqis ? aqis[idx] : null;
    setAireCache(pm25, aqi);
    const nivel = pm25 == null ? '—' : pm25 <= 12 ? 'Bueno' : pm25 <= 35 ? 'Moderado' : pm25 <= 55 ? 'Regular' : 'Malo';
    box.innerHTML = `🌬️ <b>Aire Penco ahora:</b> PM2.5 ≈ <b>${pm25 == null ? '—' : Math.round(pm25) + ' µg/m³'} (${nivel})</b> · AQI US ${aqi ?? '—'} <span class="muted" style="font-size:11px">(modelo, contrasta con SINCA)</span> <button type="button" id="climaOpenAire2" class="btn" style="width:auto;font-size:11px;margin-left:6px">Ver detalle</button>`;
    bindClimaOpenAire();
  } catch {
    box.innerHTML = `🌬️ <b>Aire Penco:</b> <span class="muted">sin conexión — ${c && c.ts ? `último PM2.5 ≈ ${Math.round(c.pm25)} µg/m³ (${escapeHtml(c.ts)})` : 'usa la guía offline en 📴 Guía offline → 🌬️ Aire'}</span> <button type="button" id="climaOpenAire2" class="btn" style="width:auto;font-size:11px;margin-left:6px">Abrir guía</button>`;
    bindClimaOpenAire();
  }
}
function buildUVOnlineHTML(j) {
  try {
    const maxs = j.daily && j.daily.uv_index_max ? j.daily.uv_index_max : null;
    if (!maxs) {
      const { uv } = uvMesOffline(new Date());
      const n = uvNivel(uv);
      return `<div class="wp-hours-title">☀️ Radiación UV (referencia offline)</div><p class="muted">UV máx típico del mes: <b style="color:${n.color}">UV ${uv} (${n.label})</b> — ${escapeHtml(n.consejo)} <span style="color:var(--muted)">Detalle en 📴 Guía offline → ☀️ Sol.</span></p>`;
    }
    const t0 = maxs[0], n0 = uvNivel(t0);
    const days = maxs.slice(0, 4).map((u, i) => { const n = uvNivel(u); return `<div class="wp-day"><div class="wd-date">${i === 0 ? 'Hoy' : '+' + i + 'd'}</div><div class="wd-ico">☀️</div><div><b style="color:${n.color}">UV ${u == null ? '—' : Math.round(u)}</b></div><div class="wd-date">${n.label}</div></div>`; }).join('');
    return `<div class="wp-hours-title">☀️ Radiación UV — playa / exposición</div><div class="wp-days">${days}</div><p class="muted" style="font-size:12px;margin-top:6px">Hoy: <b style="color:${n0.color}">UV ${t0 == null ? '—' : t0} (${n0.label})</b> — ${escapeHtml(n0.consejo)} Horario seguro: antes de 11h / después de 17h. <span style="color:var(--muted)">Guía completa en 📴 Guía offline → ☀️ Sol.</span></p>`;
  } catch { return ''; }
}
function renderOnlineClimaHTML(j) {
  const cur = j.current;
  const curIsDay = (cur.is_day !== undefined) ? cur.is_day : isDayFallback(new Date().getHours());
  const cw = wmo(cur.weather_code, curIsDay);
  let html = `<div class="wp-current">${cw.ico} <b>Penco ahora (online):</b> ${cw.desc} · ${cur.temperature_2m}°C (sensación ${cur.apparent_temperature}°C)` +
    ` · 💨 ${cur.wind_speed_10m} km/h ${dirName(cur.wind_direction_10m)} · 💧 ${cur.precipitation} mm</div><div class="wp-days">`;
  j.daily.time.forEach((t, i) => {
    const dw = wmo(j.daily.weather_code[i], 1);
    const uv = (j.daily.uv_index_max && j.daily.uv_index_max[i] != null) ? Math.round(j.daily.uv_index_max[i]) : null;
    html += `<div class="wp-day"><div class="wd-date">${t.slice(8)}/${t.slice(5, 7)}</div><div class="wd-ico">${dw.ico}</div>` +
      `<div>${Math.round(j.daily.temperature_2m_min[i])}–${Math.round(j.daily.temperature_2m_max[i])}°C</div>` +
      `<div class="wd-date">💧${j.daily.precipitation_probability_max[i]}%</div>` +
      (uv != null ? `<div class="wd-date" title="Índice UV máximo">☀️UV ${uv}</div>` : '') + `</div>`;
  });
  html += '</div>';
  const p = cal.santiagoParts(Date.now());
  const nowKey = `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}T${String(p.hh).padStart(2, '0')}`;
  const times = j.hourly.time;
  let idx = times.findIndex(t => t >= nowKey);
  if (idx < 0) idx = 0;
  const WD = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  html += '<div class="wp-hours-title">Próximas 48 horas (online)</div>';
  let groupDate = null;
  for (let k = idx; k < Math.min(idx + 48, times.length); k++) {
    const t = times[k];
    const dkey = t.slice(0, 10);
    if (dkey !== groupDate) {
      groupDate = dkey;
      const wd = new Date(Date.UTC(+dkey.slice(0, 4), +dkey.slice(5, 7) - 1, +dkey.slice(8, 10))).getUTCDay();
      html += `<div class="wp-hgroup"><div class="wp-hday">${WD[wd]} ${dkey.slice(8, 10)}/${dkey.slice(5, 7)}</div><div class="wp-hrow">`;
    }
    const isDayHour = (j.hourly.is_day && j.hourly.is_day[k] !== undefined) ? j.hourly.is_day[k] : isDayFallback(parseInt(t.slice(11, 13), 10));
    const hw = wmo(j.hourly.weather_code[k], isDayHour);
    const pp = j.hourly.precipitation_probability[k];
    html += `<div class="wp-hour${k === idx ? ' now' : ''}" title="${hw.desc} · viento ${j.hourly.wind_speed_10m[k]} km/h${isDayHour === 0 ? ' · noche' : ''}">` +
      `<div class="hh">${t.slice(11, 13)}h${isDayHour === 0 ? ' 🌙' : ''}</div><div class="hi">${hw.ico}</div>` +
      `<div class="ht">${Math.round(j.hourly.temperature_2m[k])}°</div>` +
      `<div class="hp">💧${pp == null ? '–' : pp}%</div></div>`;
    const nextT = times[k + 1];
    if (!nextT || nextT.slice(0, 10) !== groupDate) html += '</div></div>';
  }
  return html;
}
// Clima con 4 apartados lado a lado: Pronóstico | Guía offline | Aire | Sol/UV
let climaTab = 'online'; // online | offline | aire | sol
let climaOnlineData = null;
let climaOnlineError = '';
function buildAireTabHTML(now) {
  return `<div class="chip" style="margin-bottom:8px">🌬️ Aire Penco — humo y ventilación <span style="color:var(--muted)">(antes botón suelto, ahora aquí)</span></div>` +
    `<div id="climaAireMini" class="menstrual-card" style="border-color:var(--gold)"><i>Cargando aire…</i></div>` +
    `<div style="height:8px"></div>` + buildAireOfflineHTML(now);
}
function buildSolTabHTML(now) {
  const on = climaOnlineData ? buildUVOnlineHTML(climaOnlineData) : `<p class="muted">Sin dato UV online aún — abajo la referencia offline del mes.</p>`;
  return `<div class="chip" style="margin-bottom:8px">☀️ Sol / UV — playa y exposición</div>` + on +
    `<div class="wp-hours-title">Referencia offline por mes</div>` + buildSolOfflineHTML(now);
}
function renderWeatherPanel() {
  const panel = $('weatherPanel');
  if (!panel) return;
  const now = new Date();
  const cache = getClimaCache();
  const tabBar = `<div class="timer-tabs" style="margin-bottom:10px;flex-wrap:wrap">
      <button type="button" id="climaTabOnline" class="btn${climaTab === 'online' ? ' btn-accent' : ''}" style="width:auto">🌐 Pronóstico</button>
      <button type="button" id="climaTabOffline" class="btn${climaTab === 'offline' ? ' btn-accent' : ''}" style="width:auto">📴 Guía offline</button>
      <button type="button" id="climaTabAire" class="btn${climaTab === 'aire' ? ' btn-accent' : ''}" style="width:auto">🌬️ Aire</button>
      <button type="button" id="climaTabSol" class="btn${climaTab === 'sol' ? ' btn-accent' : ''}" style="width:auto">☀️ Sol / UV</button>
    </div>`;
  let body = '';
  if (climaTab === 'offline') {
    body = `<div class="chip" style="margin-bottom:8px">📴 Guía offline Penco — climatología + consejos, sin internet</div>` +
      buildOfflineClimaHTML(now, cache);
  } else if (climaTab === 'aire') {
    body = buildAireTabHTML(now);
  } else if (climaTab === 'sol') {
    body = buildSolTabHTML(now);
  } else if (climaOnlineData) {
    body = `<div class="chip" style="margin-bottom:8px">🟢 En línea — Open-Meteo · Penco</div>` + renderOnlineClimaHTML(climaOnlineData);
  } else if (climaOnlineError) {
    const c2 = cache;
    body = `<div class="chip" style="margin-bottom:8px">📴 Sin conexión — ${escapeHtml(climaOnlineError)} ${c2 && c2.ts ? '· 💾 Último dato: ' + escapeHtml(c2.ts) + ' ' + escapeHtml(c2.resumen || '') : ''} · <span style="color:var(--muted)">usa la 📴 Guía offline</span></div>` +
      `<p class="muted">No se pudo obtener el pronóstico online. Revisa la guía offline mientras tanto.</p>`;
  } else {
    body = '<i>Cargando clima…</i>';
  }
  panel.innerHTML = tabBar + `<div id="climaTabBody">${body}</div>`;
  const bOn = $('climaTabOnline'), bOff = $('climaTabOffline'), bAi = $('climaTabAire'), bSo = $('climaTabSol');
  if (bOn) bOn.onclick = () => { climaTab = 'online'; renderWeatherPanel(); };
  if (bOff) bOff.onclick = () => { climaTab = 'offline'; renderWeatherPanel(); };
  if (bAi) bAi.onclick = () => { climaTab = 'aire'; renderWeatherPanel(); };
  if (bSo) bSo.onclick = () => { climaTab = 'sol'; renderWeatherPanel(); };
  if (climaTab === 'offline') bindOfflineClimaTabs(now, cache);
  else if (climaTab === 'aire') { fetchAireMiniInto(); bindClimaOpenAire(); }
}
async function fetchWeather() {
  $('tidesPanel').classList.add('hidden');
  const panel = $('weatherPanel');
  panel.classList.remove('hidden');
  // Mantiene la vista anterior: pestaña Pronóstico visible primero
  climaTab = 'online';
  climaOnlineData = null;
  climaOnlineError = '';
  renderWeatherPanel();
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 9000);
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-36.73194&longitude=-72.9925' +
      '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max' +
      '&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,is_day,uv_index' +
      '&timezone=America%2FSantiago&forecast_days=7';
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    const cur = j.current;
    const cw = wmo(cur.weather_code, cur.is_day);
    setClimaCache(`${cw.desc} ${cur.temperature_2m}°C`);
    climaOnlineData = j;
    climaOnlineError = '';
    climaTab = 'online';
    renderWeatherPanel();
  } catch {
    climaOnlineData = null;
    climaOnlineError = 'sin conexión a internet.';
    // Sin internet:Vista online muestra el aviso, pero se salta a la guía offline ordenada
    climaTab = 'offline';
    renderWeatherPanel();
  }
}
$('btnWeather').onclick = fetchWeather;
