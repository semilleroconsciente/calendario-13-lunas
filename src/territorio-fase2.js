/* ============================================================
   TERRITORIO FASE 2 — Calendario 13 Lunas (Penco · Bío-Bío)
   7 secciones nuevas dentro de Territorio Penco:
     1. 🐝 Abejas nativas solitarias + chito (btnMeli)
     2. 🐋 Ballenas y fauna marina migratoria (btnBallenas)
     3. 🍄 Micología del bosque (btnHongos)
     4. 🚶 Senderos de Penco (btnSenderos)
      5. ⛵ Navegación menor (btnKayak)
     6. 💧 Captación de agua de lluvia (dentro de Agua, btnAgua)
     7. 🔥 Temporada de incendios Walüng (btnFuego)
   Patrón: botón inyectado en Territorio + <dialog> propio +
   bitácora privada por usuario (userData + scheduleSave).
   Todo local, sin red obligatoria.
   ============================================================ */
(function () {
'use strict';

/* ---------- helpers compartidos ---------- */
var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(s);
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function clean(s, n) {
  if (typeof sanitizeText === 'function') return sanitizeText(s, n);
  return String(s == null ? '' : s).slice(0, n || 200);
}
function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function todayKey() {
  try { if (typeof cal !== 'undefined' && cal.fmtKey) return cal.fmtKey.format(new Date()); } catch (e) {}
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function store(key, def) {
  try {
    var u = (typeof userData === 'function') ? userData() : null;
    if (!u) return def;
    if (u[key] === undefined) u[key] = def;
    return u[key];
  } catch (e) { return def; }
}
function save(msg) { try { if (typeof scheduleSave === 'function') scheduleSave(msg || 'Guardado OK'); } catch (e) {} }
function lunaTxt(key) {
  try {
    if (typeof mensLunaForKey === 'function') { var m = mensLunaForKey(key); if (m) return 'Luna ' + m.luna + ' · día ' + m.dia; }
  } catch (e) {}
  try {
    if (typeof lunaMapForKey === 'function') { var r = lunaMapForKey(key); if (r && r.luna !== 'dft') return 'Luna ' + r.luna + ' · día ' + r.diaN; }
  } catch (e) {}
  return '';
}
function tithiHoy() {
  try {
    if (window.astro && window.astro.tithi) return window.astro.tithi(new Date(todayKey() + 'T12:00:00').getTime());
  } catch (e) {}
  return -1;
}
function faseManejo(tithi) {
  if (tithi < 0) return null;
  if (tithi < 7) return 'creciente';
  if (tithi < 14) return 'llena';
  if (tithi < 21) return 'menguante';
  return 'nueva';
}
async function share(title, text) {
  try {
    if (typeof shareText === 'function') return await shareText(title, text);
    if (navigator.share) return await navigator.share({ title: title, text: text });
    await navigator.clipboard.writeText(title + '\n' + text);
    alert('Copiado al portapapeles');
  } catch (e) { try { alert(text); } catch (e2) {} }
}
function openDlg(id) {
  var d = $(id);
  if (!d) return;
  try { if (d.showModal) d.showModal(); else d.show(); } catch (e) { try { d.setAttribute('open', ''); } catch (e2) {} }
}
function closeDlg(id) { try { $(id).close(); } catch (e) {} }
function gotoBtn(id, dlgId) {
  try { if (dlgId) closeDlg(dlgId); } catch (e) {}
  setTimeout(function () { try { $(id).click(); } catch (e2) {} }, 150);
}
function registerBtn(id) {
  try { if (typeof ALL_BTNS !== 'undefined' && ALL_BTNS.push && ALL_BTNS.indexOf(id) < 0) ALL_BTNS.push(id); } catch (e) {}
  try {
    if (typeof ORDEN_TERRITORIO !== 'undefined' && Array.isArray(ORDEN_TERRITORIO) && ORDEN_TERRITORIO.indexOf(id) < 0) {
      var i = ORDEN_TERRITORIO.indexOf('btnCompost');
      if (i >= 0) ORDEN_TERRITORIO.splice(i + 1, 0, id);
      else ORDEN_TERRITORIO.push(id);
    }
  } catch (e) {}
  try {
    if (typeof PRESETS !== 'undefined') {
      Object.keys(PRESETS).forEach(function (k) {
        var p = PRESETS[k];
        if (!p || typeof p !== 'object') return;
        if (p.btnCompost && p[id] === undefined) p[id] = true;
      });
    }
  } catch (e) {}
  try { if (typeof ordenarTerritorio === 'function') ordenarTerritorio(); } catch (e) {}
  try { if (typeof reordenarAcciones === 'function') reordenarAcciones(); } catch (e) {}
  try { if (typeof updateGroupCounts === 'function') updateGroupCounts(); } catch (e) {}
  try { if (typeof applyVisibility === 'function') applyVisibility(); } catch (e) {}
}
function injectTerrBtn(id, txt, kw, afterId) {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  if (!g || $(id)) return $(id);
  var b = document.createElement('button');
  b.id = id; b.className = 'btn'; b.type = 'button';
  b.textContent = txt;
  b.setAttribute('data-sub', 'tierra');
  b.setAttribute('data-keywords', kw);
  var ref = afterId ? $(afterId) : null;
  if (ref && ref.parentNode === g) {
    if (ref.nextSibling) g.insertBefore(b, ref.nextSibling);
    else g.appendChild(b);
  } else g.appendChild(b);
  return b;
}
function logListRender(boxId, statsId, arr, rowFn, emptyTxt) {
  var box = $(boxId);
  if (!box) return;
  var stats = statsId ? $(statsId) : null;
  if (!arr.length) { box.innerHTML = '<p class="muted">' + emptyTxt + '</p>'; if (stats) stats.textContent = '0 registros'; return; }
  var sorted = arr.slice().sort(function (a, b) { return ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')); });
  box.innerHTML = sorted.slice(0, 80).map(rowFn).join('');
}

/* ============================================================
   1. 🐝 ABEJAS NATIVAS SOLITARIAS + CHITO (btnMeli)
   Tiempo circular Mari Küla Küyen: observar, refugiar y
   plantar en vez de cosechar. Chile tiene 450+ especies de
   abejas nativas (Biobío: Chilicola, Centris, Eucerini):
   polinizan la flora local mejor que la melífera, pasan el
   invierno penquista en latencia y casi no pican.
   Lo concreto en Penco: hoteles de insectos (colihue,
   madera perforada, barro), jardín escalonado (añañuca,
   maqui, chilco, suelda con suelda) y protección del chito
   (Bombus dahlbomii, peligro crítico): cero pesticida y
   cada avistamiento se reporta. Soberanía territorial por
   el humedal Rocuant y los cerros.
   Complementa a Flora (floración) y Siembra (polinización).
   ============================================================ */
/* Bitácora compatible hacia atrás: los registros apícolas
   antiguos (miel kg) se siguen mostrando como legado; los
   nuevos guardan N° de individuos (n), refugio/lugar, flor
   visitada y estado. Claves locales sin cambios. */
var MELI_ESPECIES = [
  { nombre: 'Chito / Abejorro nativo', cient: 'Bombus dahlbomii', rol: '🧡 Nativa protegida · peligro crítico', flor: 'Pewü–Walüng (chilco, tabaco del diablo, chagual)', nota: 'El abejorro colorín gigante, polinizador clave en retroceso crítico. Si lo ves: foto + flor + fecha en bitácora. No se toca el nido jamás.', orn: 'Deja chilco y tabaco del diablo sin podar en flor; cero insecticida de 10–16h.' },
  { nombre: 'Caupolicana', cient: 'Caupolicana gayi', rol: '🌿 Nativa solitaria (suelo)', flor: 'Pewü (añañuca, huilmo, azulillo)', nota: 'Grande y peluda, de las primeras en volar en primavera. Anida en el suelo: no pises ni riegues su parche.', orn: 'Parche de tierra suelta y seca a pleno sol, sin mulch.' },
  { nombre: 'Chilicola', cient: 'Chilicola spp.', rol: '🌿 Nativa solitaria (tallos)', flor: 'Pewü–Walüng (maqui, boldo, jardín)', nota: 'Chiquita y delgada, común en el Biobío. Anida en tallos secos y ramitas: cada poda apilada es un barrio.', orn: 'Manojos de cañas de colihue de 2–4 mm bajo techo, cara norte.' },
  { nombre: 'Centris', cient: 'Centris spp.', rol: '🌿 Nativa solitaria', flor: 'Pewü–Walüng (maqui, quillay, peumo)', nota: 'Robusta y veloz, presente en el Biobío. Busca aceites florales además de polen: necesita flora diversa.', orn: 'Jardín con 4+ especies en flor + parche de suelo desnudo.' },
  { nombre: 'Eucerina de cuernos largos', cient: 'Eucerini spp.', rol: '🌿 Nativa solitaria', flor: 'Pewü–Rimü (añañuca, chilco, huerta)', nota: 'Machos de antenas larguísimas, grandes polinizadores de flores abiertas. Anidan en el suelo.', orn: 'Suelo desnudo sin riego + flores escalonadas primavera–otoño.' },
  { nombre: 'Abejita verde-bronce', cient: 'Corynura chloris', rol: '🌿 Nativa solitaria (huerta)', flor: 'Pewü–Rimü (jardín y huerta)', nota: 'Chiquita y rápida, verde-bronce. Poliniza huerta y flores nativas todo el verano. Excelente vecina.', orn: 'Suelo desnudo + flores escalonadas de primavera a otoño.' },
  { nombre: 'Abejitas verdes', cient: 'Halictidae spp.', rol: '🌿 Nativas solitarias (suelo)', flor: 'Pewü–Rimü (azulillo, añañuca, huilmo)', nota: 'Pequeñas verdes metálicas, grandes polinizadoras de jardín nativo. Anidan en suelo desnudo.', orn: 'Deja un parche de suelo sin mulch ni riego para sus nidos.' },
  { nombre: 'Abeja cortadora de hojas', cient: 'Megachile chilensis', rol: '🌿 Nativa solitaria (cañas)', flor: 'Pewü–Walüng (chilco, leguminosas, rosas)', nota: 'Corta círculos perfectos en las hojas para forrar su nido. Daño estético menor a cambio de gran polinización.', orn: 'Cañas huecas o bloques perforados (6–8 mm) bajo techo, cara norte.' },
  { nombre: 'Abeja carpintera', cient: 'Xylocopa augusti', rol: '🌿 Nativa solitaria (madera)', flor: 'Pewü–Walüng', nota: 'Negra grande que perfora madera seca. No es plaga: tapa solo lo estructural y deja troncos viejos para nido.', orn: 'Hotel con troncos perforados (8–10 mm) a 1,5 m, cara norte.' },
  { nombre: 'Carpintera chica', cient: 'Manuelia spp.', rol: '🌿 Nativa endémica (ramitas)', flor: 'Pewü–Walüng', nota: 'Pariente chica de la carpintera, endémica de Chile. Nidifica en ramitas y tallos secos.', orn: 'Deja podas delgadas apiladas bajo techo para sus nidos.' },
  { nombre: 'Abeja melífera', cient: 'Apis mellifera', rol: '🍯 Introducida (contexto)', flor: 'Todo el año; pico Pewü–Walüng', nota: 'La del cajón. No es el foco de esta sección: en exceso compite con las nativas por flor. Si tienes colmenas, que no saturen el barrio.', orn: 'Prioriza a las nativas: jardín escalonado + refugios antes que más cajones.' },
  { nombre: 'Abejorro europeo', cient: 'Bombus terrestris', rol: '⚠️ Introducido invasor', flor: 'Todo el año', nota: 'Desplaza al chito y rompe flores. No lo críes ni lo traslades. Anótalo en bitácora para distinguirlo del chito.', orn: 'Cola blanca + bandas amarillas (chito: todo colorín leonado).' }
];
var MELI_LUNA = [
  { f: '🌑 Nueva', t: 'Taller y siembra', d: 'No intervengas nidos. Arma hoteles (cañas de colihue, madera perforada, barro), apila podas y siembra bulbos. Planifica el jardín escalonado.' },
  { f: '🌒 Creciente', t: 'Observar y plantar', d: 'Ventana de observación: 10–16h, a 1 m, sin atrapar. Planta y riega lo nuevo. Revisa bebederos (agua con piedras) y anota primeras emergencias de Pewü.' },
  { f: '🌕 Llena', t: 'Pico de vuelo — manos fuera al mediodía', d: 'Máxima actividad de pecoreo: no te acerques a nidos entre 11–16h. Solo mira y anota flor visitada + hora en la bitácora.' },
  { f: '🌖 Menguante', t: 'Revisión externa suave', d: 'Mira hoteles POR FUERA (orificios sellados con barro = celdas ocupadas: no abrir). Limpia solo celdas vacías y repone bebederos. Anota con su luna.' }
];
var MELI_FLORA = [
  { n: 'Chilco', f: 'Pewü–Walüng (oct–mar)', a: 'Néctar + polen · chito y todas', d: 'La número 1 de Penco: favorita del chito y de las solitarias. No la podes en flor.' },
  { n: 'Maqui', f: 'Pewü (sep–nov)', a: 'Polen temprano · Centris, Chilicola', d: 'Despierta a las nativas tras Pukem; baya para la casa y flor para ellas.' },
  { n: 'Boldo', f: 'Pewü (ago–oct)', a: 'Néctar temprano · todas', d: 'Flor de fin de invierno: puente clave antes del maqui. Evolucionaron juntas.' },
  { n: 'Añañuca', f: 'Rimü (feb–abr)', a: 'Polen otoñal · Caupolicana, halíctidos', d: 'Cierra la temporada con alimento cuando casi todo ya semilló. No arranques sus bulbos.' },
  { n: 'Azulillo / Huilmo', f: 'Pewü (oct–nov)', a: 'Polen · Caupolicana, eucerinas', d: 'Bulbos nativos de primavera para las primeras emergencias. Marca dónde salen y no los pises.' },
  { n: 'Suelda con suelda', f: 'Pewü–Walüng (oct–feb)', a: 'Néctar · chito y carpinteras', d: 'Trepadora del humedal Rocuant y quebradas: conecta tu jardín con el humedal. Ideal en cerco.' },
  { n: 'Quillay', f: 'Walüng (nov–ene)', a: 'Gran flujo · todas', d: 'Sostiene el pico de verano. Melífero clave del cerro: si tienes uno cerca, cuídalo.' },
  { n: 'Peumo', f: 'Pewü (oct–nov)', a: 'Néctar abundante · Centris', d: 'Flor perfumada que llenan en semanas buenas de primavera.' },
  { n: 'Arrayán', f: 'Walüng (dic–feb)', a: 'Néctar · todas', d: 'Flor blanca espectacular, muy visitada en quebradas.' },
  { n: 'Tabaco del diablo', f: 'Walüng (dic–mar)', a: 'Néctar lengua larga · chito', d: 'Trompeta roja solo para el chito. Déjala en pie en bordes y taludes.' },
  { n: 'Chagual', f: 'Pewü–Walüng (oct–ene)', a: 'Néctar + agua · chito', d: 'Bebedero natural en roqueríos; gran faro para nativas.' },
  { n: 'Diente de león + Trébol', f: 'Casi todo el año', a: 'Sostén en escasez · todas', d: 'Despensa de emergencia. No los cortes al ras y observa lejos de caminos.' }
];
var MELI_ANUAL = [
  { e: 'Pewü · Primavera (sep–nov)', t: 'Emergencia: no remover suelo', d: 'Las solitarias emergen de sus nidos en tierra y tallos. No piques ni riegues los parches de suelo desnudo. Instala hoteles (cara norte), planta maqui, boldo y azulillo, y pon bebederos con piedras.' },
  { e: 'Walüng · Verano (dic–feb)', t: 'Pico de vuelo y chito', d: 'Agua con piedras a la sombra + cero insecticida de 10–16h. Observa y reporta al chito en chilco y tabaco del diablo. No abras celdas selladas ni toques nidos.' },
  { e: 'Rimü · Otoño (mar–may)', t: 'Provisión y semilla', d: 'Deja tallos secos y cabezas semilladas en pie: son nidos y despensa. Siembra añañuca y limpia hoteles solo por fuera. Última revisión externa antes de Pukem.' },
  { e: 'Pukem · Invierno (jun–ago)', t: 'Latencia: no cavar ni abrir', d: 'Están enterradas o en cavidades en latencia. No caves, no abras hoteles, no traslades nada. Taller: corta cañas de colihue, perfora maderas, acopia barro y dibuja el jardín del próximo Pewü.' }
];
var MELI_SANIDAD = [
  { p: 'Pesticidas e insecticidas', s: 'Abejas lentas o muertas, flores sin visitas, fumigación vecinal o municipal.', h: 'Cero insecticida de 10–16h; prefiere control manual y purín de ortiga. Habla con vecinos y escuela: un día sin pesticida se anota en bitácora.', v: 'Jardín diverso + hoteles lejos de paltos o jardines fumigados; bebedero con agua limpia.' },
  { p: 'Abejorro europeo invasor', s: 'Abejorro de cola blanca rompiendo flores, chito cada vez más escaso.', h: 'No lo críes ni lo traslades. Repórtalo en bitácora (foto + flor + fecha) para distinguirlo del chito.', v: 'Más chilco y tabaco del diablo (flores de trompeta que favorecen al chito).' },
  { p: 'Pérdida de hábitat', s: 'Poda en plena flor, desmalezado total, relleno de bordes del humedal Rocuant, cerro sin flores.', h: 'Poda después de la flor, deja bordes vivos en el humedal y corredores de chilco en el cerro.', v: 'Cada jardín escalonado cuenta: 4+ especies con flor de primavera a otoño.' },
  { p: 'Suelo sellado', s: 'Todo con mulch, riego y pasto corto: sin nidos en tierra, sin eucerinas ni caupolicanas.', h: 'Reserva 1 m² de tierra suelta, seca y a pleno sol, sin riego ni pisoteo. Marca el parche con palitos.', v: 'Nunca piques el parche en Pewü: ahí están emergiendo.' },
  { p: 'Chaqueta amarilla y humedad en hoteles', s: 'Avispas rondando hoteles en Rimü–Pukem; cañas con moho u olor a humedad.', h: 'Trampa de botella con vinagre a 10 m del hotel (lejos de nidos) y techo con pendiente que no se llueva.', v: 'Hotel a 1,2–1,8 m, cara norte, maderas sin químicos y recambio anual de cañas vacías.' }
];
var MELI_CHECKLIST = [
  'Ubiqué el hotel a 1,2–1,8 m, cara norte, con techo que no se llueva.',
  'Usé cañas de colihue (2–10 mm) y madera perforada sin pintura ni químicos.',
  'Sellé trasera con barro y dejé orificios limpios; nada de insecticida cerca.',
  'Reservé 1 m² de suelo desnudo, seco y sin pisoteo para nidos en tierra.',
  'Planté escalonado: hay flor de primavera a otoño (chilco + maqui + añañuca + suelda).',
  'Puse bebedero con piedras a la sombra y lo repongo en Walüng.',
  'Observo a 1 m, sin atrapar ni abrir celdas selladas (barro = ocupada).',
  'Anoté cada avistamiento (foto + flor + fecha) y reporté al chito.'
];
var MELI_PRODUCTOS = [
  { n: '🌼 Polinización', d: 'Más flores cuajadas, más frutos y más semillas en huerta, jardín y cerro. Es el verdadero rendimiento: se mide en frutos, no en miel.', g: 'Cuenta frutos por rama antes y después de tu jardín: en un año verás la diferencia.' },
  { n: '🌱 Banco vivo de semillas', d: 'Deja semillar chilco, añañuca y suelda: guarda e intercambia en el barrio. Cada sobrecito es bosque futuro.', g: 'Sobre de papel + nombre + fecha + luna de colecta, en lugar seco.' },
  { n: '💧 Humedal y cerros vivos', d: 'Tu jardín escalonado conecta con el humedal Rocuant y los cerros: corredor de vuelo para el chito y las solitarias.', g: 'Suma bordes sin podar en flor y un bebedero: el corredor se usa solo.' },
  { n: '🏫 Escuela y barrio', d: 'Un hotel en la escuela enseña más que mil láminas: las niñas y niños reportan avistamientos y cuidan el parche de suelo.', g: 'Taller de 1 hora: armar cañas + plantar + anotar la primera visita.' },
  { n: '🗺️ Soberanía territorial', d: 'Cada avistamiento de chito con foto, flor y fecha es un dato de defensa del territorio: prueba viva de que el humedal y el cerro se cuidan.', g: 'Comparte tu bitácora con la red local (junta de vecinos, escuela, comité humedal).' }
];
var MELI_CHITO = [
  { r: 'Color', ch: 'Todo colorín leonado, sin blanco', eu: 'Bandas amarillas + cola blanca' },
  { r: 'Tamaño', ch: 'Gigante (2–3 cm), zumbido grave', eu: 'Mediano (1,5–2 cm)' },
  { r: 'Flores', ch: 'Trompetas largas (chilco, tabaco del diablo)', eu: 'Todas; muerde la base y rompe la flor' },
  { r: 'Qué hacer', ch: 'Foto + flor + fecha en bitácora; no tocar el nido jamás', eu: 'Anotar para distinguir; no criar ni trasladar' }
];
var MELI_GUIA = [
  { t: '🌀 Tiempo circular Mari Küla Küyen', d: 'Aquí el tiempo no es una línea de cosechas: es un círculo que repara. Observar en Pewü, acompañar en Walüng, dejar semillar en Rimü y no molestar en Pukem. Cuidar el humedal Rocuant y los cerros de Penco es cuidar la casa de las abejas; cuidar las abejas es devolverle vida al territorio.' },
  { t: '🐝 Por qué abejas nativas solitarias', d: 'Chile tiene más de 450 especies de abejas nativas, varias presentes en el Biobío (Chilicola, Centris, Eucerini). No producen miel, pero son polinizadores mucho más eficientes para la flora nativa chilena: coevolucionaron con ella. Donde la melífera visita de paso, la nativa asegura el fruto.' },
  { t: '🌿 Adaptación perfecta a Penco', d: 'Evolucionaron junto al maqui, el boldo y el chilco: saben exactamente cuándo florece cada uno. Pasan el invierno penquista en latencia, enterradas o en cavidades, sin ayuda externa. No hay que abrigarlas ni alimentarlas: solo no molestarlas.' },
  { t: '✌️ Cero mantenimiento agresivo', d: 'No requieren alimentación artificial, no se les extrae nada, la gran mayoría no pica (son solitarias y no defensivas) y no compiten con la melífera: cada una tiene su flor y su horario. Ideal para patios, escuelas y bordes del humedal.' },
  { t: '🏠 Hotel de insectos paso a paso', d: 'Marco de madera sin químicos con techo y cara al norte, a 1,2–1,8 m. Dentro: cañas de colihue de 2–10 mm con nudo atrás, bloques perforados de 6–10 mm y toques de barro. Orificio sellado con barro = celda ocupada: no se abre. Recambia cada año solo las cañas vacías.' },
  { t: '🌸 Jardín polinizador escalonado', d: 'La regla penco: chilco + maqui + añañuca + suelda con suelda cubren de primavera a otoño. Suma boldo, quillay, tabaco del diablo y chagual para el chito, y deja trébol y diente de león como despensa. 4 especies mínimo siempre en flor.' },
  { t: '🧡 Protege al chito (peligro crítico)', d: 'El abejorro nativo Bombus dahlbomii está en peligro crítico y es polinizador clave de la zona. Cero pesticidas de 10–16h, chilco y tabaco del diablo sin podar en flor, y reporta cada avistamiento con foto, flor y fecha. Reportar es soberanía territorial.' },
  { t: '💛 Tu versión penco', d: 'Patio: un hotel + 1 m² de suelo desnudo + bebedero con piedras. Escuela: taller de cañas y bitácora de avistamientos. Borde del humedal Rocuant y cerros: corredores de chilco y suelda sin podar en flor. Cada registro en tu bitácora vale lo que un pote de miel: es el bosque pidiendo casa.' }
];
var MELI_MELIPONAS = [
  { n: 'Chilicola', c: 'Chilicola spp.', z: 'Biobío · tallos y ramitas', d: 'Diminutas y fieles al jardín: anidan en tallos secos. Manojos de colihue fino (2–4 mm).' },
  { n: 'Centris', c: 'Centris spp.', z: 'Biobío · suelo y flores diversas', d: 'Robustas y veloces, buscan aceites florales. Necesitan jardín diverso + suelo desnudo.' },
  { n: 'Eucerinas', c: 'Eucerini spp.', z: 'Biobío · suelo', d: 'Cuernos largos en los machos, grandes polinizadoras de flores abiertas primavera–otoño.' },
  { n: 'Caupolicana', c: 'Caupolicana gayi', z: 'Biobío · suelo soleado', d: 'Grande y peluda, primera en volar en primavera (añañuca, huilmo, azulillo).' },
  { n: 'Corynura', c: 'Corynura chloris', z: 'Biobío · suelo y huerta', d: 'Verde-bronce chiquita y rápida: poliniza huerta y jardín todo el verano.' },
  { n: 'Manuelia', c: 'Manuelia spp.', z: 'Endémica · ramitas secas', d: 'Carpintera chica endémica de Chile: deja podas delgadas apiladas bajo techo.' }
];
var MELI_VS_APIS = [
  { r: 'Defensa', m: 'Casi no pican: solitarias, sin colonia que defender; se observan a 1 m', a: 'Pica para defender la colmena: traje, humo y respeto obligatorios' },
  { r: 'Organización', m: 'Solitarias: cada hembra hace su propio nido en suelo, tallos o madera', a: 'Colonias de decenas de miles de obreras con reina' },
  { r: 'Producto', m: 'Sin miel: su fruto es la polinización (más frutos y semillas)', a: '20 a 40 kg de miel por colmena en buena zona' },
  { r: 'Nido', m: 'Celdas en tierra, cañas o madera; sello de barro = ocupada, no abrir', a: 'Panales hexagonales de cera en cajones manejables' },
  { r: 'Invierno', m: 'Latencia natural enterradas o en cavidades: no se interviene en Pukem', a: 'Requiere reserva de 8–10 kg y manejo invernal' },
  { r: 'Rol en Penco', m: 'Conservar: refugio + jardín + reporte (soberanía territorial)', a: 'Producir con medida y sin saturar la flor nativa' }
];
function getMeli() { var a = store('meliLog', []); return Array.isArray(a) ? a : []; }
function getMeliCustom() { var a = store('meliCustom', []); return Array.isArray(a) ? a : []; }
function getMeliCheck() { var a = store('meliCheckV1', {}); return (a && typeof a === 'object') ? a : {}; }
function allMeliSpecies() {
  var base = MELI_ESPECIES.map(function (f) { var c = {}; for (var k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) c[k] = f[k]; } c.mine = false; return c; });
  var mine = getMeliCustom().map(function (f) { var c = {}; for (var k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) c[k] = f[k]; } c.mine = true; return c; });
  return base.concat(mine);
}
function meliEstacion(mes) {
  if (mes >= 9 && mes <= 11) return MELI_ANUAL[0];
  if (mes === 12 || mes <= 2) return MELI_ANUAL[1];
  if (mes >= 3 && mes <= 5) return MELI_ANUAL[2];
  return MELI_ANUAL[3];
}
var meliTab = 'hoy', meliEditingId = null;
var MELI_TABS = [['hoy', 'meliHoyPanel', 'tabMeliHoy'], ['guia', 'meliGuiaPanel', 'tabMeliGuia'], ['especies', 'meliEspPanel', 'tabMeliEsp'], ['flora', 'meliFloraPanel', 'tabMeliFlora'], ['manejo', 'meliManPanel', 'tabMeliMan'], ['bit', 'meliBitPanel', 'tabMeliBit']];
var MELI_ACCIONES = ['avistamiento', 'avistamiento chito', 'hotel construido', 'revisión hotel (sin abrir)', 'siembra polinizadora', 'nido en suelo protegido', 'bebedero / agua', 'taller en escuela', 'día sin pesticida', 'reporte europeo / invasor', 'limpieza hotel (celdas vacías)'];
var MELI_ESTADOS = ['activo', 'en flor', 'en nido', 'en latencia', 'solo avistamiento', 'vigilar', 'con amenaza'];
function switchMeliTab(t) {
  meliTab = t;
  MELI_TABS.forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderMeliHoy();
  if (t === 'guia') renderMeliGuia();
  if (t === 'especies') renderMeliEsp();
  if (t === 'flora') renderMeliFlora();
  if (t === 'manejo') renderMeliManejo();
  if (t === 'bit') renderMeliLog();
}
function meliCount(it) {
  if (it && it.n !== undefined && it.n !== null && String(it.n) !== '') return String(it.n);
  return '';
}
function renderMeliHoy() {
  var box = $('meliTodayBox');
  if (box) {
    var k = todayKey(), data = getMeli();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    var chi = data.filter(function (x) { return x.action === 'avistamiento chito'; }).length;
    var hot = data.filter(function (x) { return x.action === 'hotel construido' || x.action === 'revisión hotel (sin abrir)'; }).length;
    var jar = data.filter(function (x) { return x.action === 'siembra polinizadora' || x.action === 'nido en suelo protegido'; }).length;
    var leg = data.reduce(function (a, r) { return a + (parseFloat(r.kg) || 0); }, 0);
    var t = tithiHoy(), fase = faseManejo(t);
    var consejo = fase === 'menguante' ? '🌖 <b>Menguante: revisión externa suave</b> — mira hoteles por fuera, limpia solo celdas vacías y repone bebederos.'
      : fase === 'creciente' ? '🌒 <b>Creciente: ventana de OBSERVACIÓN</b> — 10–16h, a 1 m, sin atrapar. Anota flor visitada + hora.'
      : fase === 'llena' ? '🌕 <b>Llena: pico de vuelo, no intervengas al mediodía</b> — solo mira piqueras de hoteles y anota floración.'
      : fase === 'nueva' ? '🌑 <b>Nueva: taller</b> — corta cañas de colihue, perfora maderas, acopia barro y siembra.'
      : 'Mira la luna de hoy y elige: creciente = observar, menguante = revisar por fuera, nueva = taller.';
    box.innerHTML = '<div class="su-24ce67">' +
      '<span class="su-433de3"><b>🐝 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip su-e4aba6">' + hoy + ' hoy · ' + data.length + ' total · 🧡 ' + chi + ' chitos</span></div>' +
      '<p class="muted su-e13d76">Sin cosecha y sin apuro: <b>observar, refugiar y plantar</b>. Al <b>chito no se le toca</b>: se reporta. ' + esc(lunaTxt(k)) + (t >= 0 ? ' (tithi ' + t + ')' : '') + '</p>' +
      '<div class="chip su-e75717">' + consejo + '</div>' +
      '<p class="muted su-e13d76">🏠 ' + hot + ' hoteles · 🌱 ' + jar + ' siembras y nidos' + (leg > 0 ? ' · 🍯 ' + leg.toFixed(1) + ' kg miel (registro apícola antiguo)' : '') + '</p>';
  }
  var eb = $('meliEstBox');
  if (eb) {
    var mes = (new Date()).getMonth() + 1;
    var est = meliEstacion(mes);
    eb.innerHTML = '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(est.e) + ' — ' + esc(est.t) + '</h4><p class="su-11a508">' + esc(est.d) + '</p></div>' +
      '<p class="muted su-d47a97">Detalle por estación en la pestaña 🏠 Refugios.</p>';
  }
  var lb = $('meliLunaBox');
  if (lb) {
    lb.innerHTML = MELI_LUNA.map(function (m) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(m.f) + ' — ' + esc(m.t) + '</h4><p class="su-11a508">' + esc(m.d) + '</p></div>';
    }).join('');
  }
  var hb = $('meliColBox');
  if (hb) {
    var data2 = getMeli();
    if (!data2.length) { hb.innerHTML = '<p class="muted">Sin refugios aún. Guarda tu primer hotel o avistamiento en 📓 Bitácora y aquí verás el resumen por refugio.</p>'; }
    else {
      var por = {};
      data2.forEach(function (r) {
        var h = (r.hive || 'Sin nombre').trim() || 'Sin nombre';
        if (!por[h]) por[h] = { n: 0, ult: '' };
        por[h].n++;
        if (!por[h].ult || (r.date || '') > por[h].ult) por[h].ult = r.date || '';
      });
      var keys = Object.keys(por).sort();
      hb.innerHTML = '<div class="fishing-species">' + keys.slice(0, 12).map(function (h) {
        var p = por[h];
        return '<div class="fishing-species-item"><b class="su-6cb285">🏠 ' + esc(h) + '</b>' +
          '<div class="su-11a508">' + p.n + ' registros</div>' +
          '<div class="muted su-3ba0db">Último: ' + esc(p.ult || '—') + ' ' + esc(lunaTxt(p.ult || '')) + '</div></div>';
      }).join('') + '</div>';
    }
  }
}
function renderMeliEsp() {
  var cb = $('meliCatalogBox');
  if (cb) {
    var meliList = allMeliSpecies();
    var meliMine = getMeliCustom().length;
    cb.innerHTML = '<p class="muted su-2c4c6c">' + MELI_ESPECIES.length + ' base' + (meliMine ? ' + <b>' + meliMine + ' mías</b>' : '') + ' · toca una para cargarla en la bitácora.</p>' +
      '<div class="fishing-species">' + meliList.map(function (f) {
      var inv = /Introducido|invasor|peligro/i.test(f.rol || '');
      var border = inv ? ';border-color:#e76e8a44' : (f.mine ? ';border-color:#a9d18e55' : '');
      return '<div class="fishing-species-item" style="cursor:pointer' + border + '" data-meli="' + esc(f.nombre) + '">' +
        '<b class="su-6cb285">🐝 ' + esc(f.nombre) + '</b>' + (f.mine ? ' <span class="chip su-421073">mía</span>' : '') +
        '<div class="su-8d47b6">' + esc(f.cient || '') + '</div>' +
        '<div class="su-557d84"><span class="chip su-fb2957">' + esc(f.rol || '') + '</span></div>' +
        '<div class="su-11a508">🌸 ' + esc(f.flor || '') + '</div>' +
        '<div class="muted su-3ba0db">' + esc(f.nota || '') + '</div>' +
        (f.orn ? '<div class="su-6338e4">👉 ' + esc(f.orn) + '</div>' : '') +
        (f.mine && f.id ? '<div class="su-fe7b49"><button type="button" class="btn su-fd834a" data-melidel="' + f.id + '">✕ Borrar mi especie</button></div>' : '') + '</div>';
    }).join('') + '</div>' +
    '<details class="su-9cf9f9"><summary class="su-d9db22"><b>➕ Agregar especie</b></summary>' +
    '<div class="conv-row su-8a77e5"><label class="su-4b3de7">Especie * <input type="text" id="meliSpName" placeholder="ej: Abeja verde metálica" maxlength="40"></label></div>' +
    '<div class="conv-row"><label class="su-4b3de7">Nombre científico <input type="text" id="meliSpCient" placeholder="ej: Augochlora sp." maxlength="50"></label>' +
    '<label>Rol <select id="meliSpRol"><option>🌿 Nativa solitaria</option><option>🌿 Nativa solitaria (suelo)</option><option>🌿 Nativa solitaria (tallos)</option><option>🌿 Nativa solitaria (cañas)</option><option>🌿 Nativa solitaria (madera)</option><option>🌿 Nativa endémica (ramitas)</option><option>🧡 Nativa protegida · peligro crítico</option><option>🍯 Introducida (contexto)</option><option>⚠️ Introducido invasor</option></select></label></div>' +
    '<label>Flores que visita <input type="text" id="meliSpFlor" placeholder="ej: Pewü–Walüng (chilco, quillay)" maxlength="80"></label>' +
    '<label>Nota <input type="text" id="meliSpNota" placeholder="ej: Pequeña, anida en suelo, gran polinizadora" maxlength="120"></label>' +
    '<label>Refugio sugerido <input type="text" id="meliSpOrn" placeholder="ej: Deja parche de suelo sin mulch para nidos" maxlength="120"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="meliSpAdd" class="btn btn-accent su-30e741">+ Guardar especie</button></div></details>' +
    '<p class="muted su-d47a97">Toca una especie para cargarla en la bitácora.</p>';
    cb.querySelectorAll('[data-meli]').forEach(function (el) {
      el.onclick = function (e) {
        try { if (e && e.target && e.target.getAttribute && e.target.getAttribute('data-melidel')) return; } catch (e2) {}
        switchMeliTab('bit');
        setTimeout(function () {
          var inp = $('meliSpecies');
          if (inp) { inp.value = el.getAttribute('data-meli'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e3) {} }
        }, 60);
      };
    });
    cb.querySelectorAll('[data-melidel]').forEach(function (b) {
      b.onclick = function (e) {
        try { if (e && e.stopPropagation) e.stopPropagation(); } catch (e2) {}
        if (!confirm('¿Borrar tu especie?')) return;
        var arr = getMeliCustom();
        var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-melidel'); });
        if (i >= 0) arr.splice(i, 1);
        save('Especie borrada');
        renderMeliEsp();
      };
    });
    var madd = $('meliSpAdd');
    if (madd) madd.onclick = function () {
      var n = clean(($('meliSpName') || {}).value || '', 40).trim();
      if (!n) { alert('Pon el nombre de la especie'); return; }
      var arr = getMeliCustom();
      var exists = allMeliSpecies().some(function (x) { return String(x.nombre || '').toLowerCase() === n.toLowerCase(); });
      if (exists) { alert('Esa especie ya existe'); return; }
      arr.push({
        id: uid('me-sp'),
        nombre: n,
        cient: clean(($('meliSpCient') || {}).value || '', 50),
        rol: (($('meliSpRol') || {}).value || '🌿 Nativa solitaria'),
        flor: clean(($('meliSpFlor') || {}).value || '', 80) || 'Penco',
        nota: clean(($('meliSpNota') || {}).value || '', 120),
        orn: clean(($('meliSpOrn') || {}).value || '', 120)
      });
      save('Especie guardada 🐝');
      renderMeliEsp();
    };
  }
  var ch = $('meliChitoBox');
  if (ch) {
    ch.innerHTML = '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🧡 ¿Chito o europeo? Míralo así</h4>' +
      MELI_CHITO.map(function (r) {
        return '<p class="su-11a508"><b>' + esc(r.r) + ':</b> 🧡 chito: ' + esc(r.ch) + ' · europeo: ' + esc(r.eu) + '</p>';
      }).join('') + '<p class="muted su-3ba0db">🧡 El chito está en peligro crítico: cada avistamiento con foto, flor y fecha es soberanía territorial.</p></div>';
  }
}
function renderMeliFlora() {
  var fb = $('meliFloraBox');
  if (fb) {
    fb.innerHTML = '<p class="muted su-2c4c6c">' + MELI_FLORA.length + ' plantas que sostienen a tus abejas nativas en Penco. Siembra escalonado: que siempre haya algo en flor de primavera a otoño.</p>' +
      '<div class="fishing-species">' + MELI_FLORA.map(function (p) {
      return '<div class="fishing-species-item"><b class="su-6cb285">🌸 ' + esc(p.n) + '</b>' +
        '<div class="su-8d47b6">' + esc(p.f) + '</div>' +
        '<div class="su-557d84"><span class="chip su-fb2957">' + esc(p.a) + '</span></div>' +
        '<div class="muted su-3ba0db">' + esc(p.d) + '</div></div>';
    }).join('') + '</div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🌱 Para plantar este mes</h4>' +
    '<p class="su-11a508">Regla penco: <b>chilco + maqui + añañuca + suelda con suelda</b> cubren casi todo el año. El chito agradece además <b>tabaco del diablo y chagual</b>. Marca en Flora cuándo abre cada flor y cruza el dato con tu bitácora de visitas.</p></div>';
  }
}
function renderMeliManejo() {
  var ab = $('meliAnualBox');
  if (ab) {
    ab.innerHTML = MELI_ANUAL.map(function (m) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(m.e) + ' — ' + esc(m.t) + '</h4><p class="su-11a508">' + esc(m.d) + '</p></div>';
    }).join('');
  }
  var sb = $('meliSanidadBox');
  if (sb) {
    sb.innerHTML = MELI_SANIDAD.map(function (s) {
      return '<details class="su-9cf9f9"><summary class="su-d9db22"><b>🩺 ' + esc(s.p) + '</b> — ' + esc(s.s) + '</summary>' +
        '<p class="su-11a508"><b>Qué hacer:</b> ' + esc(s.h) + '</p>' +
        '<p class="muted su-3ba0db"><b>Prevención:</b> ' + esc(s.v) + '</p></details>';
    }).join('');
  }
  renderMeliCheck();
  var pb = $('meliProdBox');
  if (pb) {
    pb.innerHTML = MELI_PRODUCTOS.map(function (p) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(p.n) + '</h4><p class="su-11a508">' + esc(p.d) + '</p><p class="muted su-3ba0db">👉 ' + esc(p.g) + '</p></div>';
    }).join('');
  }
}
function renderMeliCheck() {
  var box = $('meliCheckBox');
  if (!box) return;
  var done = getMeliCheck();
  box.innerHTML = MELI_CHECKLIST.map(function (c, i) {
    var k = 'p' + i;
    return '<label class="habit-item su-13313b su-3b6a3a"><input type="checkbox" data-chk="' + k + '"' + (done[k] ? ' checked' : '') + '> <span>' + esc((i + 1) + '. ' + c) + '</span></label>';
  }).join('');
  var prog = $('meliCheckProg');
  var paint = function () {
    var d = getMeliCheck();
    var n = MELI_CHECKLIST.filter(function (_, i) { return d['p' + i]; }).length;
    if (prog) prog.textContent = '✅ ' + n + '/' + MELI_CHECKLIST.length + ' pasos listos';
  };
  paint();
  box.querySelectorAll('[data-chk]').forEach(function (c) {
    c.onchange = function () {
      var d = getMeliCheck();
      var k = c.getAttribute('data-chk');
      if (c.checked) d[k] = true; else delete d[k];
      save('Checklist de abejas nativas actualizado 🐝');
      paint();
    };
  });
}
function meliCalcReserva() {
  var out = $('meliCalcOut');
  if (!out) return;
  var m2 = parseFloat(((($('meliCalcCol') || {}).value) || '0').toString().replace(',', '.')) || 0;
  var hot = parseInt(((($('meliCalcKg') || {}).value) || '0'), 10) || 0;
  if (m2 <= 0) { out.innerHTML = '<span class="chip">Pon los m² de tu jardín para planificar</span>'; return; }
  var plantas = Math.ceil(m2 * 2);
  var hotRec = Math.max(1, Math.ceil(m2 / 10));
  var faltan = Math.max(0, hotRec - hot);
  out.innerHTML = '<div class="chip su-e75717">🌱 Para ' + esc(String(m2)) + ' m²: <b>' + plantas + ' plantas</b> + <b>' + hotRec + ' hotel(es)</b></div>' +
    (faltan > 0
      ? '<p class="su-11a508">Te faltan <b>' + faltan + ' hotel(es)</b>: uno por cada 10 m² (mínimo 1). Suma además 1 bebedero con piedras a la sombra.</p>'
      : '<p class="su-11a508">✅ Hoteles suficientes. Ahora asegura <b>4+ especies</b> (chilco + maqui + añañuca + suelda) para cubrir primavera–otoño.</p>');
}
function renderMeliGuia() {
  var gb = $('meliGuiaBox');
  if (!gb) return;
  gb.innerHTML = '<p class="muted su-2c4c6c">Conservación de abejas nativas solitarias y del chito en Penco: tiempo circular, refugio y jardín. Lee de corrido o por partes.</p>' +
    MELI_GUIA.map(function (s) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(s.t) + '</h4><p class="su-11a508">' + esc(s.d) + '</p></div>';
    }).join('') +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">⭐ Géneros nativos presentes en el Biobío</h4>' +
    MELI_MELIPONAS.map(function (m) {
      return '<p class="su-11a508"><b>' + esc(m.n) + '</b> <span class="muted">(' + esc(m.c) + ' · ' + esc(m.z) + ')</span> — ' + esc(m.d) + '</p>';
    }).join('') + '</div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">⚖️ Nativas solitarias vs melífera</h4>' +
    MELI_VS_APIS.map(function (r) {
      return '<p class="su-11a508"><b>' + esc(r.r) + ':</b> 🐝 nativas: ' + esc(r.m) + ' · 🍯 melífera: ' + esc(r.a) + '</p>';
    }).join('') + '</div>';
}
function meliShareText(arr) {
  if (!arr.length) return 'Bitácora de abejas nativas — Penco · sin registros aún';
  var t = '🐝 Bitácora de abejas nativas — Penco\n' + arr.length + ' registros\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    var cant = (e.n !== undefined && e.n !== null && String(e.n) !== '') ? ' ×' + e.n : (e.kg ? ' · ' + e.kg + ' kg (apícola antiguo)' : '');
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + (e.hive || 'refugio') + ' · ' + e.species + ' (' + (e.action || '—') + ')' + cant + (e.estado && e.estado !== 'activo' ? ' · ' + e.estado : '') + (e.place ? ' · ' + e.place : '') + (e.flor ? ' · flor: ' + e.flor : '');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderMeliLog() {
  var data = getMeli();
  logListRender('meliLogBox', 'meliStats', data, function (it) {
    var cant = meliCount(it) ? ' ×' + esc(meliCount(it)) : (it.kg ? ' · 🍯 ' + esc(it.kg) + ' kg (antiguo)' : '');
    return '<div class="habit-item su-13313b"><span><b>' + esc(it.species) + '</b> · <span class="chip su-0d5be0">' + esc(it.action || '—') + '</span>' + (it.estado && it.estado !== 'activo' ? ' <span class="chip su-fb2957">' + esc(it.estado) + '</span>' : '') + cant + ' — ' + esc(it.hive || '—') +
      ((it.place || it.flor) ? '<br><span class="muted su-11a508">📍 ' + esc(it.place || '—') + (it.flor ? ' · 🌸 ' + esc(it.flor) : '') + '</span>' : '') +
      '<br><span class="muted su-11a508">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted su-11a508">' + esc(it.notes || '') + '</span></span>' +
      '<span class="su-0c0cb1"><button data-id="' + it.id + '" class="btn meli-share su-337714">📤</button><button data-id="' + it.id + '" class="btn meli-edit su-337714">✏️</button><button data-id="' + it.id + '" class="btn meli-del su-fd834a">✕</button></span></div>';
  }, 'Sin registros. Anota tu primer avistamiento o tu primer hotel: fecha, refugio/flor y luna valen conservación.');
  var box = $('meliLogBox');
  if (!box || !data.length) return;
  var chi = data.filter(function (x) { return x.action === 'avistamiento chito'; }).length;
  var hot = data.filter(function (x) { return x.action === 'hotel construido' || x.action === 'revisión hotel (sin abrir)'; }).length;
  var st = $('meliStats');
  if (st) st.textContent = data.length + ' registros · 🧡 ' + chi + ' chitos · 🏠 ' + hot + ' hoteles';
  box.querySelectorAll('.meli-share').forEach(function (b) {
    b.onclick = function () {
      var it = getMeli().find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (it) share('🐝 ' + it.species + ' · ' + it.date, '🐝 ' + it.species + ' (' + (it.action || '') + ') · ' + it.date + '\n' + (meliCount(it) ? '×' + meliCount(it) + ' · ' : '') + (it.hive || '') + (it.place ? ' · ' + it.place : '') + '\n🌙 ' + lunaTxt(it.date) + '\n— Bitácora de abejas nativas · Mari Küla Küyen');
    };
  });
  box.querySelectorAll('.meli-edit').forEach(function (b) {
    b.onclick = function () {
      var d = getMeli().find(function (x) { return x.id === b.getAttribute('data-id'); });
      if (!d) return;
      meliEditingId = d.id;
      $('meliDate').value = d.date; $('meliTime').value = d.time || '10:00'; $('meliHive').value = d.hive || '';
      $('meliSpecies').value = d.species || '';
      var actSel = $('meliAction');
      if (actSel) {
        var found = false;
        for (var i = 0; i < actSel.options.length; i++) { if (actSel.options[i].value === d.action || actSel.options[i].text === d.action) { actSel.selectedIndex = i; found = true; break; } }
        if (!found && d.action) { var op = document.createElement('option'); op.value = d.action; op.text = d.action + ' (antiguo)'; actSel.appendChild(op); actSel.selectedIndex = actSel.options.length - 1; }
      }
      $('meliKg').value = (d.n !== undefined && d.n !== null) ? d.n : (d.kg || '');
      $('meliNotes').value = d.notes || '';
      if ($('meliPlace')) $('meliPlace').value = d.place || '';
      if ($('meliFlor')) $('meliFlor').value = d.flor || '';
      if ($('meliEstado')) {
        var esSel = $('meliEstado'), ok = false;
        for (var j = 0; j < esSel.options.length; j++) { if (esSel.options[j].value === d.estado || esSel.options[j].text === d.estado) { esSel.selectedIndex = j; ok = true; break; } }
        if (!ok && d.estado) { var op2 = document.createElement('option'); op2.value = d.estado; op2.text = d.estado + ' (antiguo)'; esSel.appendChild(op2); esSel.selectedIndex = esSel.options.length - 1; }
      }
      $('meliAdd').textContent = '↻ Actualizar'; $('meliCancelEdit').classList.remove('hidden');
    };
  });
  box.querySelectorAll('.meli-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar registro de abejas nativas?')) return;
      var arr = getMeli();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderMeliLog(); renderMeliHoy();
    };
  });
}
function ensureMeliDialog() {
  if ($('meliDialog')) return $('meliDialog');
  var d = document.createElement('dialog');
  d.id = 'meliDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🐝 Abejas nativas — Penco · Mari Küla Küyen</h3>' +
    '<button type="button" id="meliCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Sin cosecha y sin apuro: <b>observar, refugiar y plantar</b>. Al <b>chito no se le toca</b>: se reporta. Registro <b>privado y local</b>.</p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabMeliHoy" class="btn btn-accent su-30e741">🐝 Hoy circular</button>' +
    '<button type="button" id="tabMeliGuia" class="btn su-30e741">📖 Guía</button>' +
    '<button type="button" id="tabMeliEsp" class="btn su-30e741">🐝 Especies</button>' +
    '<button type="button" id="tabMeliFlora" class="btn su-30e741">🌸 Jardín</button>' +
    '<button type="button" id="tabMeliMan" class="btn su-30e741">🏠 Refugios</button>' +
    '<button type="button" id="tabMeliBit" class="btn su-30e741">📓 Bitácora</button></div>' +
    '<div id="meliHoyPanel"><div id="meliTodayBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🍂 Estación en Penco</h4><div id="meliEstBox" class="su-be2653"></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🌙 Calendario circular por luna</h4><div id="meliLunaBox" class="su-be2653"></div></div>' +
    '<div class="menstrual-card"><h4>🏠 Mis refugios</h4><div id="meliColBox" class="su-be2653"></div></div></div>' +
    '<div id="meliGuiaPanel" class="hidden"><div class="menstrual-card su-68a1a9"><h4>📖 Por qué abejas nativas — guía completa</h4><div id="meliGuiaBox"></div></div></div>' +
    '<div id="meliEspPanel" class="hidden"><div class="menstrual-card"><h4>🐝 Catálogo Biobío — solitarias y chito</h4><div id="meliCatalogBox"></div>' +
    '<div id="meliChitoBox" class="su-be2653"></div>' +
    '<p class="muted su-d47a97">⚠️ La gran mayoría no pica: observa a 1 m, sin atrapar ni abrir celdas selladas. Si eres alérgico/a a picaduras, mantén tu plan de siempre y avisa a tu red.</p></div></div>' +
    '<div id="meliFloraPanel" class="hidden"><div class="menstrual-card"><h4>🌸 Jardín polinizador escalonado de Penco</h4><div id="meliFloraBox"></div></div></div>' +
    '<div id="meliManPanel" class="hidden">' +
    '<div class="menstrual-card su-d2c171"><h4>🍂 Círculo del año (Pewü · Walüng · Rimü · Pukem)</h4><div id="meliAnualBox" class="su-be2653"></div></div>' +
    '<div class="menstrual-card"><h4>🧾 Checklist de hotel y jardín (se guarda solo)</h4><div id="meliCheckBox" class="habits-list su-62f8f6"></div><p class="muted su-11a508" id="meliCheckProg"></p></div>' +
    '<div class="menstrual-card"><h4>🩺 Amenazas: qué mirar y qué hacer</h4><div id="meliSanidadBox"></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🌱 Planificador de jardín polinizador</h4>' +
    '<div class="conv-row"><label>Jardín (m²) <input type="text" id="meliCalcCol" inputmode="decimal" placeholder="ej: 6" maxlength="6"></label>' +
    '<label>Hoteles ya instalados <input type="text" id="meliCalcKg" inputmode="numeric" placeholder="ej: 1" maxlength="3"></label></div>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="meliCalcBtn" class="btn btn-accent su-30e741">= Planificar</button></div>' +
    '<div id="meliCalcOut" class="su-be2653"></div>' +
    '<p class="muted su-11a508">Regla: 2 plantas por m² + 1 hotel por cada 10 m² (mínimo 1) + 4 especies mínimo en flor.</p></div>' +
    '<div class="menstrual-card"><h4>🌼 Frutos de conservar (sin extraer)</h4><div id="meliProdBox" class="su-be2653"></div></div></div>' +
    '<div id="meliBitPanel" class="hidden"><div class="menstrual-card su-d2c171"><h4>📓 Bitácora de avistamientos y refugios</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="meliDate"></label><label>Hora <input type="time" id="meliTime" value="10:00"></label>' +
    '<label>Refugio / nido <input type="text" id="meliHive" placeholder="ej: Hotel 1, parche suelo, nido chito quebrada" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Especie <input type="text" id="meliSpecies" placeholder="ej: Chito, Caupolicana, Cortadora" maxlength="30"></label>' +
    '<label>Acción <select id="meliAction"><option>avistamiento</option><option>avistamiento chito</option><option>hotel construido</option><option>revisión hotel (sin abrir)</option><option>siembra polinizadora</option><option>nido en suelo protegido</option><option>bebedero / agua</option><option>taller en escuela</option><option>día sin pesticida</option><option>reporte europeo / invasor</option><option>limpieza hotel (celdas vacías)</option></select></label>' +
    '<label>N° individuos <input type="text" id="meliKg" placeholder="ej: 3" maxlength="10"></label></div>' +
    '<div class="conv-row"><label>Lugar <input type="text" id="meliPlace" placeholder="ej: Cerro Verde, patio casa, borde humedal" maxlength="40"></label>' +
    '<label>Flor visitada <input type="text" id="meliFlor" placeholder="ej: Chilco a full, tabaco del diablo" maxlength="40"></label>' +
    '<label>Estado <select id="meliEstado"><option>activo</option><option>en flor</option><option>en nido</option><option>en latencia</option><option>solo avistamiento</option><option>vigilar</option><option>con amenaza</option></select></label></div>' +
    '<label>Notas <input type="text" id="meliNotes" placeholder="ej: 3 celdas selladas, polen naranjo, foto lista" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="meliAdd" class="btn btn-accent su-30e741">+ Guardar</button>' +
    '<button type="button" id="meliCancelEdit" class="btn hidden su-30e741">Cancelar</button></div>' +
    '<div id="meliLogBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="meliStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="meliShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="meliExport" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="meliClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions su-117179">' +
    '<button type="button" id="meliGoFlora" class="btn su-337714">🌸 Ir a Flora</button>' +
    '<button type="button" id="meliGoBosque" class="btn su-337714">🌳 Ir a Bosque</button>' +
    '<button type="button" id="meliGoSiembra" class="btn su-337714">🌱 Ir a Siembra</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="meliClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireMeli() {
  injectTerrBtn('btnMeli', '🐝 Abejas Nativas', 'abejas nativas solitarias chito abejorro bombus dahlbomii hotel insectos colihue canas barro jardin polinizador ananuca maqui chilco suelda boldo quillay tabaco diablo chagual azulillo huilmo centris chilicola caupolicana megachile xylocopa manuelia corynura halictidos eucerini terrestris europeo pesticida soberania humedal rocuant cerros circular menguante creciente flora polinizacion avistamiento refugio latencia pewu walung rimu pukem', 'btnFlora');
  ensureMeliDialog();
  registerBtn('btnMeli');
  var btn = $('btnMeli');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      try {
        var kw = btn.getAttribute('data-keywords') || '';
        if (kw.indexOf('chito') < 0) btn.setAttribute('data-keywords', kw + ' chito abejorro nativo hotel jardin');
      } catch (e) {}
      try { if (btn.textContent !== '🐝 Abejas Nativas') btn.textContent = '🐝 Abejas Nativas'; } catch (e2) {}
      switchMeliTab(meliTab || 'hoy');
      renderMeliHoy(); renderMeliLog();
      var d = $('meliDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('meliDialog');
    };
  }
  var t1 = $('tabMeliHoy'), t2 = $('tabMeliEsp'), t3 = $('tabMeliBit'), tf = $('tabMeliFlora'), tm = $('tabMeliMan'), tg = $('tabMeliGuia');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchMeliTab('hoy'); }; }
  if (tg && !tg.dataset.w) { tg.dataset.w = '1'; tg.onclick = function () { switchMeliTab('guia'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchMeliTab('especies'); }; }
  if (tf && !tf.dataset.w) { tf.dataset.w = '1'; tf.onclick = function () { switchMeliTab('flora'); }; }
  if (tm && !tm.dataset.w) { tm.dataset.w = '1'; tm.onclick = function () { switchMeliTab('manejo'); }; }
  if (t3 && !t3.dataset.w) { t3.dataset.w = '1'; t3.onclick = function () { switchMeliTab('bit'); }; }
  var cb2 = $('meliCalcBtn');
  if (cb2 && !cb2.dataset.w) { cb2.dataset.w = '1'; cb2.onclick = function () { meliCalcReserva(); }; }
  var ct = $('meliCloseTop'), cb = $('meliClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('meliDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('meliDialog'); }; }
  var add = $('meliAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('meliDate') || {}).value || '';
      var species = clean(($('meliSpecies') || {}).value || '', 30).trim();
      if (!date || !species) { alert('Fecha y especie son obligatorias'); return; }
      var rec = {
        id: meliEditingId || uid('me'),
        date: date, time: ($('meliTime') || {}).value || '10:00',
        hive: clean(($('meliHive') || {}).value || '', 30),
        species: species, action: ($('meliAction') || {}).value || 'avistamiento',
        n: clean(($('meliKg') || {}).value || '', 10),
        kg: '',
        place: clean(($('meliPlace') || {}).value || '', 40),
        flor: clean(($('meliFlor') || {}).value || '', 40),
        estado: (($('meliEstado') || {}).value || 'activo'),
        notes: clean(($('meliNotes') || {}).value || '', 80)
      };
      var arr = getMeli();
      if (meliEditingId) {
        var ix = arr.findIndex(function (x) { return x.id === meliEditingId; });
        if (ix >= 0) { if (arr[ix].kg && !rec.n) rec.kg = arr[ix].kg; arr[ix] = rec; }
        meliEditingId = null; add.textContent = '+ Guardar';
        $('meliCancelEdit').classList.add('hidden');
      } else arr.push(rec);
      save('Registro de abejas nativas guardado 🐝');
      $('meliSpecies').value = ''; $('meliKg').value = ''; $('meliNotes').value = '';
      if ($('meliPlace')) $('meliPlace').value = ''; if ($('meliFlor')) $('meliFlor').value = '';
      renderMeliLog(); renderMeliHoy();
    };
  }
  var cancel = $('meliCancelEdit');
  if (cancel && !cancel.dataset.w) {
    cancel.dataset.w = '1';
    cancel.onclick = function () {
      meliEditingId = null; $('meliAdd').textContent = '+ Guardar';
      cancel.classList.add('hidden'); $('meliSpecies').value = '';
    };
  }
  var clear = $('meliClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de abejas nativas?')) return;
      store('meliLog', []).length = 0;
      save(); renderMeliLog(); renderMeliHoy();
    };
  }
  var sh = $('meliShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getMeli();
      if (!d.length) { alert('Sin registros'); return; }
      share('🐝 Mi bitácora de abejas nativas — Penco', meliShareText(d));
    };
  }
  var ex = $('meliExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getMeli();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([meliShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bitacora-abejas-nativas-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gf = $('meliGoFlora'), gb = $('meliGoBosque'), gs = $('meliGoSiembra');
  if (gf && !gf.dataset.w) { gf.dataset.w = '1'; gf.onclick = function () { gotoBtn('btnFlora', 'meliDialog'); }; }
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBosque', 'meliDialog'); }; }
  if (gs && !gs.dataset.w) { gs.dataset.w = '1'; gs.onclick = function () { gotoBtn('btnSiembra', 'meliDialog'); }; }
}
window.MeliPenco = { tab: switchMeliTab, renderHoy: renderMeliHoy, renderEsp: renderMeliEsp, renderGuia: renderMeliGuia, renderFlora: renderMeliFlora, renderManejo: renderMeliManejo, renderLog: renderMeliLog, list: getMeli, especies: MELI_ESPECIES, luna: MELI_LUNA, flora: MELI_FLORA, anual: MELI_ANUAL, sanidad: MELI_SANIDAD, checklist: MELI_CHECKLIST, productos: MELI_PRODUCTOS, chito: MELI_CHITO, guia: MELI_GUIA, meliponas: MELI_MELIPONAS, vsApis: MELI_VS_APIS, customs: getMeliCustom, todas: allMeliSpecies, acciones: MELI_ACCIONES, estados: MELI_ESTADOS };

/* ============================================================
   2. 🐋 BALLENAS Y FAUNA MARINA MIGRATORIA
   El trempülcahue (ballena) ya vive en la guía de Duelo como
   viaje al más allá; aquí se vuelve temporada viva: franca
   austral, piloto y delfines en Bahía Concepción y Golfo de
   Arauco. Puntos desde Penco/Lirquén + bitácora. Cosmovisión
   + turismo local con respeto (distancia, no perseguir).
   ============================================================ */
var BALLENA_ESPECIES = [
  { nombre: 'Ballena franca austral', cient: 'Eubalaena australis', temp: '🐋 Jul–Nov (pico ago–oct)', nota: 'Lomo negro sin aleta dorsal, callosidades blancas. La más vista desde costa en el Golfo. Si ves soplo en V: anota hora y rumbo.', punto: 'Mirador Cerro Verde · borde Lirquén · Playa Negra' },
  { nombre: 'Calderón / Ballena piloto', cient: 'Globicephala melas', temp: '🐋 Otoño–primavera (grupos)', nota: 'Grupos grandes de aleta curva. A veces se acercan a la bahía siguiendo jurel. Nunca rodear con kayak/bote.', punto: 'Borde costero Penco · salida en bote caleta' },
  { nombre: 'Ballena jorobada', cient: 'Megaptera novaeangliae', temp: '🐋 Paso ocasional (verano–otoño)', nota: 'Salto y cola blanca por debajo. Registro escaso pero posible. Foto de cola = huella dactilar.', punto: 'Mar abierto Golfo de Arauco' },
  { nombre: 'Delfín austral / Tonina', cient: 'Lagenorhynchus australis', temp: '🐬 Todo el año', nota: 'Grupos chicos y veloces tras cardúmenes. Indican pique: avisa a Pesca.', punto: 'Bahía Concepción · desembocadura estero' },
  { nombre: 'Lobo marino', cient: 'Otaria flavescens', temp: '🦭 Todo el año', nota: 'Rocas de La Cata y Tumbes. No alimentar ni acercarse a crías. Si ves uno herido: Sernapesca 800 320 032.', punto: 'Roqueríos La Cata · Isla Quiriquina (lejos)' },
  { nombre: 'Pingüino de Humboldt', cient: 'Spheniscus humboldti', temp: '🐧 Invierno–primavera', nota: 'Ocasional en el Golfo. Si lo ves en playa: distancia 50 m, perros lejos, avisa a SAG/Sernapesca.', punto: 'Playa Negra · Lirquén' }
];
var BALLENA_PUNTOS = [
  { n: 'Mirador Cerro Verde', d: 'Altura con vista total a la bahía. Mejor 08–11h sin viento sur, con binoculares. Soplo visible a 2–5 km.' },
  { n: 'Borde costero Lirquén–Penco', d: 'Caminata de orilla al atardecer (hora dorada). Mar calmo tras sur = mejor ventana.' },
  { n: 'Playa Negra / La Cata', d: 'Roquerío + poza. Bajamar + mañana = lobos y aves; con marea alta y mar calmo, delfines cerca.' },
  { n: 'Embarcado con caleta', d: 'Solo con pescador local autorizado, chaleco siempre, 100 m mínimo a ballenas, motor en neutro si se acercan.' }
];
function getBallenas() { var a = store('ballenaLog', []); return Array.isArray(a) ? a : []; }
var balTab = 'hoy';
function switchBalTab(t) {
  balTab = t;
  [['hoy', 'balHoyPanel', 'tabBalHoy'], ['bit', 'balBitPanel', 'tabBalBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderBalHoy();
  if (t === 'bit') renderBalLog();
}
function mesActual() { try { return new Date().getMonth() + 1; } catch (e) { return 1; } }
function enTemporada() { var m = mesActual(); return (m >= 7 && m <= 11); }
function renderBalHoy() {
  var box = $('balTodayBox');
  if (box) {
    var k = todayKey(), data = getBallenas();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    var enT = enTemporada();
    box.innerHTML = '<div class="su-24ce67">' +
      '<span class="su-433de3"><b>🐋 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip" style="background:' + (enT ? 'var(--gold);color:#10142c' : 'var(--panel)') + '">' + (enT ? '🐋 EN TEMPORADA (jul–nov)' : '🌊 fuera de pico · delfines y lobos todo el año') + '</span></div>' +
      '<p class="muted su-e13d76">Trempülcahue: la ballena que lleva a los que parten. Observar es honrar: <b>distancia, silencio y sin perseguir</b>. ' + hoy + ' hoy · ' + data.length + ' total · ' + esc(lunaTxt(k)) + '</p>' +
      '<p class="muted su-11a508">🌙 Luna llena + pleamar + amanecer = mejor visibilidad. Con luna oscura los soplos se oyen más que se ven.</p>';
  }
  var cb = $('balCatalogBox');
  if (cb) {
    cb.innerHTML = '<div class="fishing-species">' + BALLENA_ESPECIES.map(function (f) {
      return '<div class="fishing-species-item su-3b6a3a" data-bal="' + esc(f.nombre) + '">' +
        '<b class="su-6cb285">' + esc(f.nombre) + '</b><div class="su-8d47b6">' + esc(f.cient) + '</div>' +
        '<div class="su-557d84"><span class="chip su-fb2957">' + esc(f.temp) + '</span></div>' +
        '<div class="muted su-4adef8">' + esc(f.nota) + '</div>' +
        '<div class="su-88855c">📍 ' + esc(f.punto) + '</div></div>';
    }).join('') + '</div><p class="muted su-d47a97">Toca una especie para cargarla en la bitácora.</p>' +
    '<div class="menstrual-card su-afef99"><h4 class="su-11a508">📍 Puntos desde Penco / Lirquén</h4>' +
    BALLENA_PUNTOS.map(function (p) { return '<p class="su-11a508"><b>' + esc(p.n) + ':</b> ' + esc(p.d) + '</p>'; }).join('') +
    '<p class="muted su-0d5be0">⚠️ 100 m mínimo a ballenas · motor en neutro · nunca entre madre y cría · basura de vuelta.</p></div>';
    cb.querySelectorAll('[data-bal]').forEach(function (el) {
      el.onclick = function () {
        switchBalTab('bit');
        setTimeout(function () {
          var inp = $('balSpecies');
          if (inp) { inp.value = el.getAttribute('data-bal'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
        }, 60);
      };
    });
  }
}
function balShareText(arr) {
  if (!arr.length) return 'Bitácora de ballenas y fauna marina — Bahía Concepción / Golfo de Arauco · sin registros aún';
  var t = '🐋 Bitácora ballenas y fauna marina — Penco / Golfo de Arauco\n' + arr.length + ' avistamientos\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + e.species + ' ×' + (e.count || '1') + ' · ' + (e.place || '—');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderBalLog() {
  var data = getBallenas();
  logListRender('balLogBox', 'balStats', data, function (it) {
    return '<div class="habit-item su-13313b"><span><b>' + esc(it.species) + '</b> ×' + esc(it.count || '1') + ' — ' + esc(it.place || '—') +
      '<br><span class="muted su-11a508">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted su-11a508">' + esc(it.notes || '') + '</span></span>' +
      '<span class="su-0c0cb1"><button data-id="' + it.id + '" class="btn bal-del su-fd834a">✕</button></span></div>';
  }, 'Sin avistamientos. Sube al mirador en temporada (jul–nov) 08–11h y anota soplo, rumbo y cantidad.');
  var box = $('balLogBox');
  if (!box || !data.length) return;
  var st = $('balStats');
  if (st) {
    var spp = {};
    data.forEach(function (x) { spp[String(x.species || '').toLowerCase()] = 1; });
    st.textContent = data.length + ' avistamientos · ' + Object.keys(spp).length + ' especies';
  }
  box.querySelectorAll('.bal-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar avistamiento?')) return;
      var arr = getBallenas();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderBalLog(); renderBalHoy();
    };
  });
}
function ensureBalDialog() {
  if ($('balDialog')) return $('balDialog');
  var d = document.createElement('dialog');
  d.id = 'balDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🐋 Ballenas y fauna marina — Golfo de Arauco</h3>' +
    '<button type="button" id="balCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Trempülcahue en temporada <b>jul–nov</b>. Observa desde costa con respeto. Registro <b>privado y local</b>.</p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabBalHoy" class="btn btn-accent su-30e741">🐋 Temporada hoy</button>' +
    '<button type="button" id="tabBalBit" class="btn su-30e741">📓 Bitácora avistamientos</button></div>' +
    '<div id="balHoyPanel"><div id="balTodayBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🐋 Especies + 📍 puntos</h4><div id="balCatalogBox"></div></div></div>' +
    '<div id="balBitPanel" class="hidden"><div class="menstrual-card su-d2c171"><h4>📓 Bitácora — avistamientos</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="balDate"></label><label>Hora <input type="time" id="balTime" value="09:00"></label>' +
    '<label>Lugar <input type="text" id="balPlace" placeholder="ej: Mirador Cerro Verde" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Especie <input type="text" id="balSpecies" placeholder="ej: Franca austral" maxlength="30"></label>' +
    '<label>Cantidad <input type="number" id="balCount" min="1" value="1" class="su-8573ba"></label></div>' +
    '<label>Notas <input type="text" id="balNotes" placeholder="ej: 2 soplos rumbo norte, con cría, mar calmo" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="balAdd" class="btn btn-accent su-30e741">+ Guardar avistamiento</button></div>' +
    '<div id="balLogBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="balStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="balShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="balExport" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="balClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions su-117179">' +
    '<button type="button" id="balGoFish" class="btn su-337714">🎣 Ir a Pesca</button>' +
    '<button type="button" id="balGoTides" class="btn su-337714">🌊 Ir a Mareas</button>' +
    '<button type="button" id="balGoDuelo" class="btn su-337714">🕊️ Trempülcahue en Duelo</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="balClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireBallenas() {
  injectTerrBtn('btnBallenas', '🐋 Ballenas', 'ballenas fauna marina trempulcahue franca austral piloto delfin lobo marino pinguino avistamiento golfo arauco bahia mirador temporada', 'btnMeli');
  ensureBalDialog();
  registerBtn('btnBallenas');
  try {
    var b = $('btnMeli');
    if (b) b.setAttribute('data-sub', 'tierra');
    var bb = $('btnBallenas');
    if (bb) bb.setAttribute('data-sub', 'mar');
  } catch (e) {}
  var btn = $('btnBallenas');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchBalTab(balTab || 'hoy');
      renderBalHoy(); renderBalLog();
      var d = $('balDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('balDialog');
    };
  }
  var t1 = $('tabBalHoy'), t2 = $('tabBalBit');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchBalTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchBalTab('bit'); }; }
  var ct = $('balCloseTop'), cb = $('balClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('balDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('balDialog'); }; }
  var add = $('balAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('balDate') || {}).value || '';
      var species = clean(($('balSpecies') || {}).value || '', 30).trim();
      if (!date || !species) { alert('Fecha y especie son obligatorias'); return; }
      getBallenas().push({
        id: uid('ba'), date: date, time: ($('balTime') || {}).value || '09:00',
        place: clean(($('balPlace') || {}).value || '', 30),
        species: species, count: ($('balCount') || {}).value || '1',
        notes: clean(($('balNotes') || {}).value || '', 80)
      });
      save('Avistamiento guardado 🐋');
      $('balSpecies').value = ''; $('balNotes').value = '';
      renderBalLog(); renderBalHoy();
    };
  }
  var clear = $('balClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de avistamientos?')) return;
      store('ballenaLog', []).length = 0;
      save(); renderBalLog(); renderBalHoy();
    };
  }
  var sh = $('balShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getBallenas();
      if (!d.length) { alert('Sin registros'); return; }
      share('🐋 Mis avistamientos — Golfo de Arauco', balShareText(d));
    };
  }
  var ex = $('balExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getBallenas();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([balShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'avistamientos-ballenas-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gf = $('balGoFish'), gt = $('balGoTides'), gd = $('balGoDuelo');
  if (gf && !gf.dataset.w) { gf.dataset.w = '1'; gf.onclick = function () { gotoBtn('btnFishing', 'balDialog'); }; }
  if (gt && !gt.dataset.w) { gt.dataset.w = '1'; gt.onclick = function () { gotoBtn('btnTides', 'balDialog'); }; }
  if (gd && !gd.dataset.w) { gd.dataset.w = '1'; gd.onclick = function () { gotoBtn('btnDueloFull', 'balDialog'); }; }
}
window.BallenasPenco = { tab: switchBalTab, renderHoy: renderBalHoy, renderLog: renderBalLog, list: getBallenas, especies: BALLENA_ESPECIES };

/* ============================================================
   3. 🍄 MICOLOGÍA DEL BOSQUE
   El bosque nativo menciona hongos sin módulo propio. Aquí:
   catálogo del esclerófilo costero (dígüeñe, changle, loyo,
   callampa de pino), época de salida por estación, guía de
   identificación con ADVERTENCIAS SERIAS de toxicidad y
   bitácora de salidas. La luna ordena las salidas: menguante
   de otoño (Rimü) = mejor ventana tras lluvias.
   ⚠️ REGLA DE ORO: si no estás 100% seguro, NO lo comas.
   ============================================================ */
var HONGO_ESPECIES = [
  { nombre: 'Dígüeñe / Dihueñe', cient: 'Cyttaria espinosae', com: '✅ Comestible tradicional', epoca: 'Rimü–Pukem temprano (abr–ago)', hab: 'Sobre hualles y robles vivos (parásito noble)', nota: 'Pelota blanca-anaranjada que sale del tronco. Se come fresca en ensalada o frita. Cosecha 30%, deja 70% para el bosque.', tox: 'Confundible solo con otras Cyttaria (todas comestibles). Igual: lava y cocina siempre.' },
  { nombre: 'Changle', cient: 'Ramaria flava', com: '✅ Comestible (con medida)', epoca: 'Rimü (abr–jun, tras lluvias)', hab: 'Suelo de bosque nativo, forma de coral amarillo', nota: 'Coral amarillo-anaranjado. Solo ejemplares firmes y jóvenes, bien cocidos (20 min). 1 canasto familiar máximo.', tox: '⚠️ Se parece a Ramaria tóxicas (amargas, puntas rojas). Prueba: si es amargo al morder crudo, BÓTALO. Nunca con alcohol.' },
  { nombre: 'Loyo', cient: 'Boletus loyo', com: '✅ Comestible apreciado', epoca: 'Rimü–Pukem (may–ago)', hab: 'Bajo robles y hualles, sombrero café esponjoso', nota: 'Sombrero café, poros amarillos que azulean al tocar. Seca muy bien (callampa seca). Corta con cuchillo, no arranques.', tox: '⚠️ Evita boletos de poros ROJOS o sabor picante/amargo: esos son tóxicos. Ante duda, foto y no cosechar.' },
  { nombre: 'Callampa de pino / Suillus', cient: 'Suillus luteus', com: '✅ Comestible (introducido)', epoca: 'Rimü–Pukem (abr–ago)', hab: 'Plantaciones de pino (Penco tiene muchas)', nota: 'Sombrero café baboso con velo. Pela la cutícula babosa y cocina bien. Buena puerta de entrada para aprender.', tox: 'La baba cruda da malestar: siempre pelar + cocer. No recolectes junto a caminos (plomo) ni tras fumigación.' },
  { nombre: 'Ostra / Pleuroto', cient: 'Pleurotus ostreatus', com: '✅ Comestible', epoca: 'Pukem–Pewü en troncos húmedos', hab: 'Troncos caídos de nativo (no talados)', nota: 'Repisa gris en troncos muertos. Cosecha con cuchillo dejando base. Nunca tales un árbol por hongos.', tox: 'Confusión rara con Crepidotus (pequeños, no tóxicos graves). Igual: cocina siempre.' },
  { nombre: 'Amanita muscaria', cient: 'Amanita muscaria', com: '☠️ TÓXICA — solo mirar', epoca: 'Rimü–Pukem', hab: 'Bajo pinos y nativo, sombrero rojo con pintas blancas', nota: 'La del cuento. NO se come: provoca intoxicación grave. Sirve como señal: donde hay amanita, cerca hay suillus comestibles.', tox: '☠️ Tóxica y psicoactiva peligrosa. Ni probar. Enseña a niños a NO tocarla.' },
  { nombre: 'Galerina / hongos café pequeños', cient: 'Galerina spp.', com: '☠️ MORTALES — no tocar', epoca: 'Todo el año en madera', hab: 'Troncos y astillas, sombreritos café', nota: 'Pueden matar con un solo ejemplar (amatoxinas). NUNCA recolectes “champañoncitos” silvestres sin experto.', tox: '☠️ Si alguien comió hongo dudoso: guarda muestra + foto y corre a urgencias (Hospital Penco / Higueras). No esperes síntomas.' }
];
var HONGO_REGLAS = [
  'Regla 1 — 100% o nada: si no lo identificas con total certeza (sombrero + láminas/poros + pie + hábitat + época), NO lo comas. Foto y pregunta.',
  'Regla 2 — Cocina siempre: ningún hongo silvestre se come crudo. Mínimo 15–20 min de cocción.',
  'Regla 3 — Prueba nueva: primera vez = 1 cucharada cocida y espera 24 h. Sin alcohol ese día.',
  'Regla 4 — Cosecha limpia: canasto ventilado (nunca bolsa plástica), cuchillo, corta sin arrancar micelio, deja el 70% y los viejos para esporas.',
  'Regla 5 — Dónde NO: orilla de camino, basural, plantación recién fumigada, ni dentro de la ciudad con smog.',
  'Intoxicación: guarda un ejemplar entero + foto del lugar, anota hora de ingesta y ve a urgencias de inmediato. Fono intoxicaciones CITUC: +56 2 2635 3800.'
];
function getHongos() { var a = store('hongoLog', []); return Array.isArray(a) ? a : []; }
var honTab = 'hoy';
function switchHonTab(t) {
  honTab = t;
  [['hoy', 'honHoyPanel', 'tabHonHoy'], ['bit', 'honBitPanel', 'tabHonBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderHonHoy();
  if (t === 'bit') renderHonLog();
}
function renderHonHoy() {
  var box = $('honTodayBox');
  if (box) {
    var k = todayKey(), data = getHongos();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    var t = tithiHoy(), fase = faseManejo(t);
    var consejo = fase === 'menguante' ? '🌖 <b>Menguante: MEJOR VENTANA</b> — tras 3–5 días de lluvia otoñal, salidas al amanecer con canasto y cuchillo.'
      : fase === 'creciente' ? '🌒 <b>Creciente: observa y marca</b> — revisa tus puntos, fotografía sin cosechar, vuelve en menguante.'
      : fase === 'llena' ? '🌕 <b>Llena: paseo nocturno NO</b> — mejor de día; la luz fuerte deshidrata setas. Anota puntos para la próxima lluvia.'
      : fase === 'nueva' ? '🌑 <b>Nueva: estudia en casa</b> — repasa fichas, seca tu cosecha anterior, afila cuchillo y prepara canasto.'
      : 'Tras lluvias de Rimü–Pukem + menguante = salida.';
    box.innerHTML = '<div class="su-24ce67">' +
      '<span class="su-433de3"><b>🍄 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip su-e4aba6">' + hoy + ' hoy · ' + data.length + ' salidas</span></div>' +
      '<p class="muted su-e13d76">Temporada fuerte: <b>Rimü–Pukem (abr–ago)</b> tras lluvias. ' + esc(lunaTxt(k)) + '</p>' +
      '<div class="chip su-e75717">' + consejo + '</div>' +
      '<p class="su-7cfdcb"><b>⚠️ Si no estás 100% seguro, NO lo comas.</b> Ningún hongo silvestre se come crudo.</p>';
  }
  var cb = $('honCatalogBox');
  if (cb) {
    cb.innerHTML = '<div class="fishing-species">' + HONGO_ESPECIES.map(function (f) {
      var mal = /TÓXICA|MORTAL/i.test(f.com);
      return '<div class="fishing-species-item" style="cursor:pointer' + (mal ? ';border-color:#e76e8a66' : ';border-color:#8fd69444') + '" data-hon="' + esc(f.nombre) + '">' +
        '<b class="su-6cb285">🍄 ' + esc(f.nombre) + '</b><div class="su-8d47b6">' + esc(f.cient) + '</div>' +
        '<div class="su-ba21f6"><span class="chip su-fb2957">' + esc(f.com) + '</span><span class="chip su-fb2957">' + esc(f.epoca) + '</span></div>' +
        '<div class="su-11a508">📍 ' + esc(f.hab) + '</div>' +
        '<div class="muted su-3ba0db">' + esc(f.nota) + '</div>' +
        '<div class="su-51fd79">⚠️ ' + esc(f.tox) + '</div></div>';
    }).join('') + '</div><p class="muted su-d47a97">Toca una especie para cargarla en la bitácora.</p>' +
    '<div class="menstrual-card su-afef99"><h4 class="su-11a508">📋 Guía de salida segura</h4>' +
    HONGO_REGLAS.map(function (r) { return '<p class="su-11a508">• ' + esc(r) + '</p>'; }).join('') + '</div>';
    cb.querySelectorAll('[data-hon]').forEach(function (el) {
      el.onclick = function () {
        switchHonTab('bit');
        setTimeout(function () {
          var inp = $('honSpecies');
          if (inp) { inp.value = el.getAttribute('data-hon'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
        }, 60);
      };
    });
  }
}
function honShareText(arr) {
  if (!arr.length) return 'Bitácora micológica — bosque esclerófilo Penco · sin salidas aún';
  var t = '🍄 Bitácora micológica — Penco\n' + arr.length + ' salidas\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + e.species + ' (' + (e.qty || '?') + ') · ' + (e.place || '—');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderHonLog() {
  var data = getHongos();
  logListRender('honLogBox', 'honStats', data, function (it) {
    return '<div class="habit-item su-13313b"><span><b>' + esc(it.species) + '</b> · ' + esc(it.qty || '?') + ' — ' + esc(it.place || '—') +
      '<br><span class="muted su-11a508">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted su-11a508">' + esc(it.notes || '') + '</span></span>' +
      '<span class="su-0c0cb1"><button data-id="' + it.id + '" class="btn hon-del su-fd834a">✕</button></span></div>';
  }, 'Sin salidas. Espera 3–5 días tras lluvia otoñal y sal en menguante con canasto, cuchillo y esta guía.');
  var box = $('honLogBox');
  if (!box || !data.length) return;
  var st = $('honStats');
  if (st) st.textContent = data.length + ' salidas registradas';
  box.querySelectorAll('.hon-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar salida?')) return;
      var arr = getHongos();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderHonLog(); renderHonHoy();
    };
  });
}
function ensureHonDialog() {
  if ($('honDialog')) return $('honDialog');
  var d = document.createElement('dialog');
  d.id = 'honDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🍄 Hongos del bosque — Penco</h3>' +
    '<button type="button" id="honCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Esclerófilo costero en <b>Rimü–Pukem</b>. La luna ordena las salidas: <b>menguante tras lluvia</b>. <b class="su-a861ba">Si dudas, no lo comas.</b></p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabHonHoy" class="btn btn-accent su-30e741">🍄 Hoy + guía</button>' +
    '<button type="button" id="tabHonBit" class="btn su-30e741">📓 Bitácora salidas</button></div>' +
    '<div id="honHoyPanel"><div id="honTodayBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🍄 Catálogo + seguridad</h4><div id="honCatalogBox"></div></div></div>' +
    '<div id="honBitPanel" class="hidden"><div class="menstrual-card su-d2c171"><h4>📓 Bitácora — salidas</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="honDate"></label><label>Hora <input type="time" id="honTime" value="09:00"></label>' +
    '<label>Lugar <input type="text" id="honPlace" placeholder="ej: Quebrada Honda, pinar" maxlength="30"></label></div>' +
    '<div class="conv-row"><label>Especie <input type="text" id="honSpecies" placeholder="ej: Changle, Loyo" maxlength="30"></label>' +
    '<label>Cantidad <input type="text" id="honQty" placeholder="ej: 1 canasto / 800 g" maxlength="20"></label></div>' +
    '<label>Notas <input type="text" id="honNotes" placeholder="ej: tras 4 días lluvia, jóvenes firmes, dejé 70%" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="honAdd" class="btn btn-accent su-30e741">+ Guardar salida</button></div>' +
    '<div id="honLogBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="honStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="honShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="honExport" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="honClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions su-117179">' +
    '<button type="button" id="honGoBosque" class="btn su-337714">🌳 Ir a Bosque</button>' +
    '<button type="button" id="honGoSenderos" class="btn su-337714">🚶 Ir a Senderos</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="honClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireHongos() {
  injectTerrBtn('btnHongos', '🍄 Hongos', 'hongos micologia setas changle loyo digueñe dihuene callampa pino suillus amanita toxico recoleccion otoño rimu', 'btnBallenas');
  ensureHonDialog();
  registerBtn('btnHongos');
  var btn = $('btnHongos');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchHonTab(honTab || 'hoy');
      renderHonHoy(); renderHonLog();
      var d = $('honDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('honDialog');
    };
  }
  var t1 = $('tabHonHoy'), t2 = $('tabHonBit');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchHonTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchHonTab('bit'); }; }
  var ct = $('honCloseTop'), cb = $('honClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('honDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('honDialog'); }; }
  var add = $('honAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('honDate') || {}).value || '';
      var species = clean(($('honSpecies') || {}).value || '', 30).trim();
      if (!date || !species) { alert('Fecha y especie son obligatorias'); return; }
      getHongos().push({
        id: uid('ho'), date: date, time: ($('honTime') || {}).value || '09:00',
        place: clean(($('honPlace') || {}).value || '', 30),
        species: species, qty: clean(($('honQty') || {}).value || '', 20),
        notes: clean(($('honNotes') || {}).value || '', 80)
      });
      save('Salida guardada 🍄');
      $('honSpecies').value = ''; $('honQty').value = ''; $('honNotes').value = '';
      renderHonLog(); renderHonHoy();
    };
  }
  var clear = $('honClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de hongos?')) return;
      store('hongoLog', []).length = 0;
      save(); renderHonLog(); renderHonHoy();
    };
  }
  var sh = $('honShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getHongos();
      if (!d.length) { alert('Sin registros'); return; }
      share('🍄 Mis salidas de hongos — Penco', honShareText(d));
    };
  }
  var ex = $('honExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getHongos();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([honShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'salidas-hongos-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gb = $('honGoBosque'), gs = $('honGoSenderos');
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBosque', 'honDialog'); }; }
  if (gs && !gs.dataset.w) { gs.dataset.w = '1'; gs.onclick = function () { gotoBtn('btnSenderos', 'honDialog'); }; }
}
window.HongosPenco = { tab: switchHonTab, renderHoy: renderHonHoy, renderLog: renderHonLog, list: getHongos, especies: HONGO_ESPECIES };

/* ============================================================
   4. 🚶 SENDEROS DE PENCO
   Rutas con datos reales de terreno: distancia, dificultad,
   tiempo, mejor hora (conecta con Hora Dorada) y estado por
   temporada. Bitácora enlazada con la de Bosque.
   ============================================================ */
var SENDEROS = [
  { nombre: 'Mirador Cerro Verde', dist: '2,4 km ida y vuelta', dif: 'Fácil–media', tiempo: '1–1,5 h', hora: '📸 08–11h (ballenas jul–nov) o dorada 18–20h verano', temp: 'Todo el año; barro en Pukem, cortaviento en sur fuerte', nota: 'El balcón de la bahía: avistamiento de ballenas, atardecer y hora dorada. Lleva binoculares en temporada.' },
  { nombre: 'Borde costero Penco–Lirquén', dist: '3,5 km lineal', dif: 'Fácil', tiempo: '1–2 h', hora: '📸 Dorada tarde + pleamar (espejo de agua)', temp: 'Todo el año; evita pleamar con marejada (SHOA)', nota: 'Caminata familiar con intermareal en bajamar y delfines en calma. Conecta con Pesca e Intermareal.' },
  { nombre: 'Playa Negra – La Cata (roquerío)', dist: '1,8 km ida y vuelta', dif: 'Media (rocas)', tiempo: '1–1,5 h', hora: '☀️ Mañana en bajamar <0,6 m', temp: 'Pewü–Walüng ideal; Pukem resbaloso y olas', nota: 'Pozas, estrellas y lobos. Zapatilla con agarre, nunca solo/a y ojo a la tabla de Mareas.' },
  { nombre: 'Quebrada Honda (bosque)', dist: '2 km ida y vuelta', dif: 'Media', tiempo: '1,5–2 h', hora: '☀️ 09–12h (luz entre copas)', temp: 'Rimü hongos · Pukem barro y caudal · Walüng sombra', nota: 'Quebrada húmeda con chilco, helechos y dígüeñes. La bitácora se enlaza con Bosque y Hongos.' },
  { nombre: 'Cerro Penco – cruz / antenas', dist: '4 km ida y vuelta', dif: 'Media–alta', tiempo: '2–3 h', hora: '☀️ Temprano 07–10h (calor Walüng)', temp: 'Walüng riesgo incendio: NO subir con alerta roja ni hacer fuego', nota: 'Vista interior + esclerófilo (boldo, peumo, quillay). En verano revisa primero la sección 🔥 Incendios.' },
  { nombre: 'Humedal Rocuant (borde)', dist: '2,5 km lineal', dif: 'Fácil', tiempo: '1–2 h', hora: '📸 Amanecer (canto y aves)', temp: 'Pukem con agua alta · Pewü migración', nota: 'Aves del humedal: loica, tagua, garza. Silencio, distancia y sin perros sueltos. Enlaza con Aves.' }
];
function getSenderos() { var a = store('senderoLog', []); return Array.isArray(a) ? a : []; }
var senTab = 'hoy';
function switchSenTab(t) {
  senTab = t;
  [['hoy', 'senHoyPanel', 'tabSenHoy'], ['bit', 'senBitPanel', 'tabSenBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderSenHoy();
  if (t === 'bit') renderSenLog();
}
function renderSenHoy() {
  var box = $('senTodayBox');
  if (box) {
    var k = todayKey(), data = getSenderos();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    var km = data.reduce(function (a, r) { return a + (parseFloat(r.km) || 0); }, 0);
    box.innerHTML = '<div class="su-24ce67">' +
      '<span class="su-433de3"><b>🚶 Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip su-e4aba6">' + hoy + ' hoy · ' + data.length + ' salidas · ' + km.toFixed(1) + ' km</span></div>' +
      '<p class="muted su-e13d76">Mejor hora = <b>hora dorada</b> para costa y mirador, <b>mañana</b> para roquerío en bajamar. Revisa 🌊 Mareas y 🌤️ Clima antes de salir. ' + esc(lunaTxt(k)) + '</p>';
  }
  var cb = $('senCatalogBox');
  if (cb) {
    cb.innerHTML = '<div class="fishing-species">' + SENDEROS.map(function (s) {
      return '<div class="fishing-species-item su-3b6a3a" data-sen="' + esc(s.nombre) + '">' +
        '<b class="su-6cb285">🚶 ' + esc(s.nombre) + '</b>' +
        '<div class="su-ba21f6"><span class="chip su-fb2957">📏 ' + esc(s.dist) + '</span><span class="chip su-fb2957">⛰️ ' + esc(s.dif) + '</span><span class="chip su-fb2957">⏱️ ' + esc(s.tiempo) + '</span></div>' +
        '<div class="su-11a508">' + esc(s.hora) + '</div>' +
        '<div class="su-11a508">📅 ' + esc(s.temp) + '</div>' +
        '<div class="muted su-3ba0db">' + esc(s.nota) + '</div></div>';
    }).join('') + '</div><p class="muted su-d47a97">Toca una ruta para cargarla en la bitácora.</p>' +
    '<div class="menstrual-card su-afef99"><h4 class="su-11a508">🎒 Mínimo de salida</h4>' +
    '<p class="muted su-11a508">Agua 1 L · bastón · cortaviento · linterna · celular cargado · aviso a alguien de tu ruta y hora. En roquerío: zapatilla con agarre + tabla de mareas. En cerro en Walüng: revisa 🔥 Incendios primero.</p></div>';
    cb.querySelectorAll('[data-sen]').forEach(function (el) {
      el.onclick = function () {
        switchSenTab('bit');
        setTimeout(function () {
          var inp = $('senRoute');
          if (inp) { inp.value = el.getAttribute('data-sen'); try { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {} }
        }, 60);
      };
    });
  }
}
function senShareText(arr) {
  if (!arr.length) return 'Bitácora de senderos — Penco · sin salidas aún';
  var t = '🚶 Bitácora de senderos — Penco\n' + arr.length + ' salidas\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + e.route + (e.km ? ' (' + e.km + ' km)' : '') + ' · ' + (e.with || '—');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderSenLog() {
  var data = getSenderos();
  logListRender('senLogBox', 'senStats', data, function (it) {
    return '<div class="habit-item su-13313b"><span><b>' + esc(it.route) + '</b>' + (it.km ? ' · ' + esc(it.km) + ' km' : '') + ' — ' + esc(it.with || '—') +
      '<br><span class="muted su-11a508">' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted su-11a508">' + esc(it.notes || '') + '</span></span>' +
      '<span class="su-0c0cb1"><button data-id="' + it.id + '" class="btn sen-del su-fd834a">✕</button></span></div>';
  }, 'Sin salidas. Parte por el borde costero en dorada y anota distancia y hora: así aprendes tu ritmo.');
  var box = $('senLogBox');
  if (!box || !data.length) return;
  box.querySelectorAll('.sen-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar salida?')) return;
      var arr = getSenderos();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderSenLog(); renderSenHoy();
    };
  });
}
function ensureSenDialog() {
  if ($('senDialog')) return $('senDialog');
  var d = document.createElement('dialog');
  d.id = 'senDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🚶 Senderos de Penco</h3>' +
    '<button type="button" id="senCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Distancia, dificultad, tiempo y mejor hora. Registro <b>privado y local</b>, enlazado con Bosque.</p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabSenHoy" class="btn btn-accent su-30e741">🚶 Rutas hoy</button>' +
    '<button type="button" id="tabSenBit" class="btn su-30e741">📓 Bitácora salidas</button></div>' +
    '<div id="senHoyPanel"><div id="senTodayBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>🚶 Rutas con datos</h4><div id="senCatalogBox"></div></div></div>' +
    '<div id="senBitPanel" class="hidden"><div class="menstrual-card su-d2c171"><h4>📓 Bitácora — salidas</h4>' +
    '<div class="conv-row"><label>Fecha <input type="date" id="senDate"></label><label>Hora <input type="time" id="senTime" value="09:00"></label>' +
    '<label>Ruta <input type="text" id="senRoute" placeholder="ej: Mirador Cerro Verde" maxlength="40"></label></div>' +
    '<div class="conv-row"><label>Km <input type="text" id="senKm" placeholder="ej: 2.4" maxlength="10"></label>' +
    '<label>Con quién / cómo <input type="text" id="senWith" placeholder="ej: sola, con hije, con bastón" maxlength="30"></label></div>' +
    '<label>Notas <input type="text" id="senNotes" placeholder="ej: barro en quebrada, vi chito, hora dorada perfecta" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="senAdd" class="btn btn-accent su-30e741">+ Guardar salida</button></div>' +
    '<div id="senLogBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="senStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="senShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="senExport" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="senClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions su-117179">' +
    '<button type="button" id="senGoBosque" class="btn su-337714">🌳 Ir a Bosque</button>' +
    '<button type="button" id="senGoGolden" class="btn su-337714">📸 Ir a Hora Dorada</button>' +
    '<button type="button" id="senGoTides" class="btn su-337714">🌊 Ir a Mareas</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="senClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireSenderos() {
  injectTerrBtn('btnSenderos', '🚶 Senderos', 'senderos ruta cerro verde borde costero quebrada humedal caminata trekking distancia dificultad hora dorada mirador', 'btnHongos');
  ensureSenDialog();
  registerBtn('btnSenderos');
  var btn = $('btnSenderos');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchSenTab(senTab || 'hoy');
      renderSenHoy(); renderSenLog();
      var d = $('senDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('senDialog');
    };
  }
  var t1 = $('tabSenHoy'), t2 = $('tabSenBit');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchSenTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchSenTab('bit'); }; }
  var ct = $('senCloseTop'), cb = $('senClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('senDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('senDialog'); }; }
  var add = $('senAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('senDate') || {}).value || '';
      var route = clean(($('senRoute') || {}).value || '', 40).trim();
      if (!date || !route) { alert('Fecha y ruta son obligatorias'); return; }
      getSenderos().push({
        id: uid('se'), date: date, time: ($('senTime') || {}).value || '09:00',
        route: route, km: clean(($('senKm') || {}).value || '', 10),
        with: clean(($('senWith') || {}).value || '', 30),
        notes: clean(($('senNotes') || {}).value || '', 80)
      });
      save('Salida guardada 🚶');
      $('senRoute').value = ''; $('senNotes').value = '';
      renderSenLog(); renderSenHoy();
    };
  }
  var clear = $('senClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de senderos?')) return;
      store('senderoLog', []).length = 0;
      save(); renderSenLog(); renderSenHoy();
    };
  }
  var sh = $('senShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getSenderos();
      if (!d.length) { alert('Sin registros'); return; }
      share('🚶 Mis senderos — Penco', senShareText(d));
    };
  }
  var ex = $('senExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getSenderos();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([senShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'senderos-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gb = $('senGoBosque'), gg = $('senGoGolden'), gt = $('senGoTides');
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBosque', 'senDialog'); }; }
  if (gg && !gg.dataset.w) { gg.dataset.w = '1'; gg.onclick = function () { gotoBtn('btnGolden', 'senDialog'); }; }
  if (gt && !gt.dataset.w) { gt.dataset.w = '1'; gt.onclick = function () { gotoBtn('btnTides', 'senDialog'); }; }
}
window.SenderosPenco = { tab: switchSenTab, renderHoy: renderSenHoy, renderLog: renderSenLog, list: getSenderos, rutas: SENDEROS };

/* ============================================================
   5. ⛵ NAVEGACIÓN MENOR (ex "Kayak y remo", mismo btnKayak)
   Bahía Concepción: kayak, canoa/wampo, SUP, botes a remo o
   motor pequeño y vela menor. Ventanas seguras por
   marea/viento, puntos de lanzamiento en Lirquén/Penco,
   reglas por tipo de embarcación, seguridad y mantención.
   Usa los datos SHOA que ya consume 🌊 Mareas
   (pleamar/bajamar) + 🌤️ Clima.
   ⚠️ Si hay viento sur fuerte o marejada, NO se sale.
   ID de botón y claves (kayakLog/kayakCheck) se conservan
   para no romper bitácoras ni respaldos existentes.
   ============================================================ */
var NAVES_MENORES = [
  { id: 'kayak', ico: '🛶', n: 'Kayak (travesía / sit-on-top)', bahia: 'El más versátil en la bahía: borde interior, Lirquén–Penco, pesca embarcada.', limite: 'No salir con sur > 20 nudos ni marejada SHOA. Olas < 0,5 m para iniciarse.', equipo: 'Chaleco siempre, remo de repuesto o pala dividida, achicador, falda/cubre, cabo de remolque 10 m, silbato, funda estanca.', aprende: 'Reingreso (dar vuelta el kayak y subir desde el agua) + remolque a compañero. Practícalo en orilla antes de alejarte.', cuida: 'Enjuague dulce tras cada salida, guarda a la sombra (el sol quiebra el plástico), revisa tapones y escotillas.' },
  { id: 'sup', ico: '🏄', n: 'SUP (tabla con remo)', bahia: 'Ideal para amanecer calmo y borde interior. De pie ves delfines y cardumen.', limite: 'Solo con calma (< 12 nudos) y sin corriente viva. Con sur, ni intentarlo: la tabla es una vela.', equipo: 'Leash al tobillo SIEMPRE, chaleco o cinturón flotante, remo ajustado a tu altura, quilla puesta, funda estanca.', aprende: 'Caer a sotavento, subir por el centro de rodillas, remar de ambos lados cada 4–5 paladas. Vuelve con viento de frente primero.', cuida: 'Inflable: 12–15 PSI según marca, no lo dejes al sol inflado al máximo. Rígida: funda y canto protegido.' },
  { id: 'bote', ico: '🚤', n: 'Bote / panga / chalupa (remo o motor pequeño)', bahia: 'El bote pescador de caleta Lirquén: pesca, traslado, faena. Respeta su canal y varadero.', limite: 'Motor < 10 HP igual exige aviso, chaleco y revisión. Con marejada o niebla espesa, quédate en tierra.', equipo: 'Chalecos para TODOS a bordo, achicador/bomba, remo de repuesto, ancla con 3× de cabo respecto al fondo, luces si es de noche, bidón extra y tapones.', aprende: 'Nudos: as de guía + vuelta de ancla (ver 🪢 Nudos). Fondeo por proa al viento, nunca de costado a la ola.', cuida: 'Motor: agua dulce al circuito, bujía y filtro por luna. Casco: achica, seca y revisa vía de agua. Varado: cuñas y nunca bajo el bote sin apoyo.' },
  { id: 'vela', ico: '⛵', n: 'Vela menor (optimist, laser, vela artesanal)', bahia: 'Tardes de terral suave en el interior de la bahía. La mejor escuela de viento.', limite: 'Solo con viento leve–moderado (8–15 nudos) y sin tráfico de naves mayores. Primeras veces con instructor o lancha de apoyo.', equipo: 'Chaleco, adrizamiento practicado (dar vuelta el velero), cabo de remolque, cuchillo de cabo, silbato, escota sin nudos en la mano.', aprende: 'Rumbos: ceñida, través, popa. Virada por avante y trasluchada controlada. Regla de oro: escota en la mano, nunca amarrada al cuerpo.', cuida: 'Enjuague de velas y herrajes, mástil desarmado a la sombra, casco seco boca abajo. Revisa obenques y timón antes de cada salida.' },
  { id: 'canoa', ico: '🛶', n: 'Canoa / wampo y embarcaciones tradicionales', bahia: 'Remo de pie o arrodillado, estable para pesca y travesía corta en aguas calmas.', limite: 'Aguas protegidas y sin oleaje. Carga baja y centrada; si entra agua, a orilla de inmediato.', equipo: 'Chaleco, remo simple de repuesto, achicador, cuerda de proa, bolsa estanca.', aprende: 'Remada en J para ir recto, cambio de lado sin balancear. Entrada y salida desde orilla baja, nunca desde roca alta.', cuida: 'Madera: seca a la sombra, aceite o barniz por temporada. Revisa costuras y filtraciones cada luna.' }
];
var NAV_VIENTO = [
  { n: 'SUP', ok: 'Calma a brisa (< 12 nudos)', no: 'Sur moderado o más' },
  { n: 'Kayak / canoa', ok: 'Hasta ~15 nudos con experiencia', no: 'Sur fuerte (> 20 nudos) o marejada' },
  { n: 'Vela menor', ok: '8–15 nudos, terral suave', no: 'Calma total (no aprendes) ni temporal' },
  { n: 'Bote a remo', ok: 'Calma, interior de bahía', no: 'Viento en contra + corriente viva' },
  { n: 'Bote a motor', ok: 'Parte con mar calmo y buena luz', no: 'Niebla espesa, noche sin luces, marejada' }
];
var NAV_PUNTOS = [
  { nombre: 'Caleta Lirquén (varadero)', uso: 'Lanzamiento principal · kayak, bote, SUP', nota: 'Pregunta a pescadores por tráfico de botes. Salida al amanecer con mar calmo. Estaciona sin bloquear varadero ni canal de salida.' },
  { nombre: 'Playa de Penco (centro)', uso: 'Lanzamiento familiar · kayak y SUP', nota: 'Olas suaves con buen tiempo. Ideal para practicar remo corto 1–2 h. Ojo con bañistas en Walüng.' },
  { nombre: 'Playa Negra (solo expertos)', uso: 'Travesía corta · kayak', nota: 'Roca + corriente. Solo con bajamar, mar calmo y compañía. Casco si hay oleaje.' },
  { nombre: 'Borde interior bahía (aguas calmas)', uso: 'Ruta protegida del sur · todas las naves', nota: 'Cuando el sur pega afuera, el interior se mantiene navegable. Vuelve antes de que cambie el viento.' },
  { nombre: 'Rampa / muelle caleta (botes y vela)', uso: 'Botes a motor y vela menor', nota: 'Embarca con calzado cerrado, motor abajo solo en agua. La vela se arma en tierra y se bota ya aparejada. Respeta turno de rampa.' }
];
var KAYAK_PUNTOS = NAV_PUNTOS;
var NAV_CHECK = [
  { id: 'chaleco', t: 'Chaleco puesto y ajustado (siempre, sin excusa)' },
  { id: 'clima', t: 'Revisé 🌤️ Clima + 🌊 Mareas: sin sur fuerte ni marejada SHOA' },
  { id: 'aviso', t: 'Avisé a alguien: embarcación usada + ruta + hora de vuelta' },
  { id: 'compa', t: 'No salgo solo/a (o aviso reforzado + ruta corta)' },
  { id: 'agua', t: 'Agua + gorro + bloqueador + ropa seca en bolsa estanca' },
  { id: 'cuerda', t: 'Cabo, silbato, linterna y celular en funda estanca' },
  { id: 'casco', t: 'Reviso casco/faldón/tapones/achicador (kayak) o ancla/luces/motor (bote) o jarcia/timón/adrizamiento (vela) antes de lanzar' },
  { id: 'trafico', t: 'Miré tráfico de bahía: canal de Lirquén y naves mayores libres, distancia a botes pescadores' },
  { id: 'limite', t: 'Mi embarcación está dentro de su límite de viento de hoy (ver tabla: SUP < 12 nudos, kayak < 15–20, vela 8–15)' }
];
var KAYAK_CHECK = NAV_CHECK;
function getKayak() { var a = store('kayakLog', []); return Array.isArray(a) ? a : []; }
function getKayakCheck() { var o = store('kayakCheck', {}); return (o && typeof o === 'object') ? o : {}; }
var kayTab = 'hoy';
function switchKayTab(t) {
  kayTab = t;
  [['hoy', 'kayHoyPanel', 'tabKayHoy'], ['naves', 'kayNavesPanel', 'tabKayNaves'], ['seg', 'kaySegPanel', 'tabKaySeg'], ['cuidado', 'kayCuidadoPanel', 'tabKayCuidado'], ['bit', 'kayBitPanel', 'tabKayBit']].forEach(function (x) {
    var p = $(x[1]); if (p) p.classList.toggle('hidden', x[0] !== t);
    var b = $(x[2]); if (b) b.classList.toggle('btn-accent', x[0] === t);
  });
  if (t === 'hoy') renderKayHoy();
  if (t === 'bit') renderKayLog();
}
function renderKayHoy() {
  var box = $('kayTodayBox');
  if (box) {
    var k = todayKey(), data = getKayak();
    var hoy = data.filter(function (x) { return x.date === k; }).length;
    box.innerHTML = '<div class="su-24ce67">' +
      '<span class="su-433de3"><b>⛵ Hoy — ' + esc(k) + '</b></span>' +
      '<span class="chip su-e4aba6">' + hoy + ' hoy · ' + data.length + ' salidas</span></div>' +
      '<p class="muted su-e13d76">Ventana ideal: <b>2h antes/después de pleamar + amanecer + sin sur fuerte</b>. Revisa 🌊 Mareas y 🌤️ Clima ahora. ' + esc(lunaTxt(k)) + '</p>' +
      '<p class="muted su-11a508">🌙 Luna nueva/llena = mareas vivas (más corriente): solo rutas protegidas y cortas. Elige tu embarcación en la pestaña <b>⛵ Embarcaciones</b> y respeta su límite de viento.</p>';
  }
  var pb = $('kayPuntosBox');
  if (pb) {
    pb.innerHTML = KAYAK_PUNTOS.map(function (p) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">📍 ' + esc(p.nombre) + ' — ' + esc(p.uso) + '</h4><p class="su-11a508">' + esc(p.nota) + '</p></div>';
    }).join('');
  }
  var cb = $('kayCheckBox');
  if (cb) {
    var st = getKayakCheck();
    var done = KAYAK_CHECK.filter(function (c) { return st[c.id]; }).length;
    cb.innerHTML = '<p class="muted su-11a508">✅ ' + done + '/' + KAYAK_CHECK.length + ' — todo marcado = puedes lanzar. Si falta 1, no sales.</p>' +
      KAYAK_CHECK.map(function (c) {
        var on = !!st[c.id];
        return '<label class="check-row su-6cb285"><input type="checkbox" data-kay="' + c.id + '"' + (on ? ' checked' : '') + '> ' + esc(c.t) + '</label>';
      }).join('');
    cb.querySelectorAll('[data-kay]').forEach(function (inp) {
      inp.onchange = function () {
        var s = getKayakCheck();
        s[inp.getAttribute('data-kay')] = inp.checked;
        save(inp.checked ? 'Check OK ✅' : 'Check actualizado');
        renderKayHoy();
      };
    });
  }
}
function kayNaveNombre(id) {
  var n = NAVES_MENORES.filter(function (x) { return x.id === id; })[0];
  return n ? (n.ico + ' ' + n.n) : '🛶 Kayak (travesía / sit-on-top)';
}
function renderKayNaves() {
  var box = $('kayNavesBox');
  if (!box) return;
  box.innerHTML = NAVES_MENORES.map(function (n) {
    return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">' + esc(n.ico + ' ' + n.n) + '</h4>' +
      '<p class="su-11a508">🌊 En bahía: ' + esc(n.bahia) + '</p>' +
      '<p class="su-11a508">💨 Límite: <b>' + esc(n.limite) + '</b></p>' +
      '<p class="su-11a508">🎒 Equipo: ' + esc(n.equipo) + '</p>' +
      '<p class="su-11a508">📚 Aprende primero: ' + esc(n.aprende) + '</p>' +
      '<p class="muted su-11a508">🧽 Cuidado: ' + esc(n.cuida) + '</p></div>';
  }).join('') +
  '<div class="menstrual-card su-d2c171"><h4>💨 ¿Con qué viento salgo hoy?</h4>' +
  NAV_VIENTO.map(function (v) {
    return '<p class="su-11a508">• <b>' + esc(v.n) + ':</b> ✅ ' + esc(v.ok) + ' · ⛔ ' + esc(v.no) + '</p>';
  }).join('') + '</div>';
}
function renderKaySeg() {
  var box = $('kaySegBox');
  if (!box) return;
  box.innerHTML =
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">⚓ Tráfico de bahía — tú eres el más chico</h4>' +
    '<p class="su-11a508">• Naves mayores, remolcadores y pesqueros <b>tienen preferencia y no te ven</b>: cruza el canal de Lirquén de forma perpendicular, rápido y en grupo, nunca lo bordees remando.</p>' +
    '<p class="su-11a508">• Distancia a botes pescadores y redes: <b>50 m o más</b>. Si levantan redes, no cortes por popa.</p>' +
    '<p class="su-11a508">• De noche o con niebla: <b>luz blanca visible 360°</b> + chaleco con reflectante. Sin luz, no se sale.</p></div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">📋 Capitanía y reglas mínimas (Talcahuano)</h4>' +
    '<p class="su-11a508">• Botes a motor y veleros se <b>matriculan</b> y su patrón rinde examen ante la Autoridad Marítima. Kayak y SUP no matriculan, pero el chaleco y el aviso de salida son igual de obligatorios.</p>' +
    '<p class="su-11a508">• Avisa siempre: <b>quién sale, en qué embarcación, ruta y hora de vuelta</b>. Si cambias de plan, avisa de nuevo.</p>' +
    '<p class="su-11a508">• Alcohol y mar no se mezclan: <b>cero alcohol al mando</b> de cualquier embarcación.</p></div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🆘 Hombre al agua e hipotermia</h4>' +
    '<p class="su-11a508">• <b>Kayak/SUP:</b> practica el reingreso en orilla. Si caes lejos: quédate con tu embarcación (flota y te hace visible), silba 3 veces, nada solo si la orilla está a < 100 m y sin corriente.</p>' +
    '<p class="su-11a508">• <b>Bote:</b> motor apagado antes de ayudar, lanza por sotavento, sube por popa o escala. Fondea para no derivar.</p>' +
    '<p class="su-11a508">• <b>Vela:</b> escota libre, virada para volver al caído, motor/apoyo si hay tráfico. Practica el adrizamiento con apoyo antes de salir solo.</p>' +
    '<p class="su-11a508">• El agua de la bahía <b>está fría todo el año</b>: con temblor incontrolable o dedos agarrotados, sal del agua, abriga y termina la salida. Traje de neopreno de septiembre a mayo si pasas horas en el agua.</p></div>';
}
function renderKayCuidado() {
  var box = $('kayCuidadoBox');
  if (!box) return;
  box.innerHTML =
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🧽 Después de cada salida (todas)</h4>' +
    '<p class="su-11a508">• Enjuague con agua dulce (casco, remos, chalecos, cabos). Seca a la sombra: el sol pudre plásticos, PVC y costuras.</p>' +
    '<p class="su-11a508">• Guarda bajo techo o con funda, boca abajo o de canto. Nunca sobre el techo del auto por días: se deforma.</p></div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🔧 Por material</h4>' +
    '<p class="su-11a508">• <b>Plástico/fibra:</b> revisa golpes y filtraciones cada luna; repara con kit (fibra + resina) o parche térmico.</p>' +
    '<p class="su-11a508">• <b>Inflables (SUP/bote PVC):</b> guarda desinflado al 80% en lugar fresco, válvula limpia, kit de pinchazos a mano.</p>' +
    '<p class="su-11a508">• <b>Madera (canoa/bote):</b> seca completa, lija y barniz/aceite por temporada. Revisa clavos y calafateo.</p>' +
    '<p class="su-11a508">• <b>Vela:</b> vela seca antes de guardar (el hongo la rompe), cabos aduja­dos, herrajes con vaselina.</p>' +
    '<p class="su-11a508">• <b>Motor pequeño:</b> bencina fresca + aceite de mezcla, bujía de repuesto, agua dulce al refrigerar, bidón amarrado.</p></div>' +
    '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🌙 Revisión por luna (5 minutos)</h4>' +
    '<p class="su-11a508">Palpa cabos, prueba silbato y linterna, infla chalecos, revisa tapones y achicador. 5 minutos salvan una salida. Nudos de remolque y fondeo en 🪢 Nudos y Redes.</p></div>';
}
function kayShareText(arr) {
  if (!arr.length) return 'Bitácora de navegación menor — Penco/Lirquén · sin salidas aún';
  var t = '⛵ Bitácora de navegación menor — Penco/Lirquén\n' + arr.length + ' salidas\n\n';
  arr.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); }).forEach(function (e) {
    t += '• ' + e.date + ' ' + (e.time || '') + ' · ' + kayNaveNombre(e.nave || 'kayak') + ' · ' + (e.route || '—') + ' · ' + (e.cond || '—');
    if (e.notes) t += ' — ' + e.notes;
    t += '\n';
  });
  return t + '\n— Mari Küla Küyen · Penco';
}
function renderKayLog() {
  var data = getKayak();
  logListRender('kayLogBox', 'kayStats', data, function (it) {
    return '<div class="habit-item su-13313b"><span><b>' + esc(it.route || 'Salida') + '</b> — ' + esc(it.cond || '—') +
      '<br><span class="muted su-11a508">' + esc(kayNaveNombre(it.nave || 'kayak')) + ' · ' + esc(it.date) + ' ' + esc(it.time || '') + ' · ' + esc(lunaTxt(it.date)) + '</span><br><span class="muted su-11a508">' + esc(it.notes || '') + '</span></span>' +
      '<span class="su-0c0cb1"><button data-id="' + it.id + '" class="btn kay-del su-fd834a">✕</button></span></div>';
  }, 'Sin salidas. Marca primero todo el checklist y anota tu primera salida corta con marea y viento.');
  var box = $('kayLogBox');
  if (!box || !data.length) return;
  box.querySelectorAll('.kay-del').forEach(function (b) {
    b.onclick = function () {
      if (!confirm('¿Eliminar salida?')) return;
      var arr = getKayak();
      var i = arr.findIndex(function (x) { return x.id === b.getAttribute('data-id'); });
      if (i >= 0) arr.splice(i, 1);
      save(); renderKayLog(); renderKayHoy();
    };
  });
}
function ensureKayDialog() {
  if ($('kayDialog')) return $('kayDialog');
  var d = document.createElement('dialog');
  d.id = 'kayDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">⛵ Navegación menor — Penco / Lirquén</h3>' +
    '<button type="button" id="kayCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Kayak, SUP, botes y vela menor: ventanas por <b>marea + viento</b>, puntos de lanzamiento y checklist. Si el sur pega o hay marejada: <b>no se sale</b>.</p>' +
    '<div class="timer-tabs su-4dca21">' +
    '<button type="button" id="tabKayHoy" class="btn btn-accent su-30e741">⛵ Hoy + checklist</button>' +
    '<button type="button" id="tabKayNaves" class="btn su-30e741">🛶 Embarcaciones</button>' +
    '<button type="button" id="tabKaySeg" class="btn su-30e741">⚓ Seguridad</button>' +
    '<button type="button" id="tabKayCuidado" class="btn su-30e741">🧽 Cuidado</button>' +
    '<button type="button" id="tabKayBit" class="btn su-30e741">📓 Bitácora salidas</button></div>' +
    '<div id="kayHoyPanel"><div id="kayTodayBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="menstrual-card su-d2c171"><h4>✅ Checklist — todo marcado o no sales</h4><div id="kayCheckBox"></div>' +
    '<div class="dlg-actions su-a6fc0a">' +
    '<button type="button" id="kayGoTides" class="btn su-337714">🌊 Ver Mareas</button>' +
    '<button type="button" id="kayGoWeather" class="btn su-337714">🌤️ Ver Clima</button>' +
    '<button type="button" id="kayGoNudos" class="btn su-337714">🪢 Ver Nudos</button></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>📍 Puntos de lanzamiento</h4><div id="kayPuntosBox" class="su-be2653"></div></div></div>' +
    '<div id="kayNavesPanel" class="hidden"><div class="menstrual-card su-68a1a9"><h4>🛶⛵ Embarcaciones — qué usar y cuándo</h4>' +
    '<p class="muted su-11a508">Cada embarcación tiene su viento y su equipo. Parte por la más simple (SUP o kayak en calma) y sube de nivel con compañía.</p></div>' +
    '<div id="kayNavesBox" class="su-be2653"></div></div>' +
    '<div id="kaySegPanel" class="hidden"><div id="kaySegBox" class="su-be2653"></div></div>' +
    '<div id="kayCuidadoPanel" class="hidden"><div id="kayCuidadoBox" class="su-be2653"></div></div>' +
    '<div id="kayBitPanel" class="hidden"><div class="menstrual-card su-d2c171"><h4>📓 Bitácora — salidas</h4>' +
    '<div class="conv-row"><label>Embarcación <select id="kayNave"><option value="kayak">🛶 Kayak</option><option value="sup">🏄 SUP</option><option value="bote">🚤 Bote / panga</option><option value="vela">⛵ Vela menor</option><option value="canoa">🛶 Canoa / wampo</option></select></label>' +
    '<label>Fecha <input type="date" id="kayDate"></label><label>Hora <input type="time" id="kayTime" value="08:00"></label>' +
    '<label>Ruta <input type="text" id="kayRoute" placeholder="ej: Lirquén–Penco interior" maxlength="40"></label></div>' +
    '<div class="conv-row"><label>Marea / viento <input type="text" id="kayCond" placeholder="ej: pleamar 08:20, calma" maxlength="40"></label></div>' +
    '<label>Notas <input type="text" id="kayNotes" placeholder="ej: 1 h, delfines, vuelta antes del sur" maxlength="80"></label>' +
    '<div class="dlg-actions su-59a5a8"><button type="button" id="kayAdd" class="btn btn-accent su-30e741">+ Guardar salida</button></div>' +
    '<div id="kayLogBox" class="habits-list su-62f8f6"></div>' +
    '<div class="dlg-actions su-cc4a4c"><span id="kayStats" class="muted su-11a508"></span>' +
    '<span class="su-3de8f9"><button type="button" id="kayShare" class="btn su-30e741">📤 Compartir</button>' +
    '<button type="button" id="kayExport" class="btn su-30e741">📥 Exportar</button>' +
    '<button type="button" id="kayClear" class="btn su-214f75">🗑 Borrar</button></span></div></div>' +
    '<div class="dlg-actions su-117179">' +
    '<button type="button" id="kayGoFish" class="btn su-337714">🎣 Ir a Pesca</button>' +
    '<button type="button" id="kayGoBal" class="btn su-337714">🐋 Ir a Ballenas</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="kayClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireKayak() {
  var g = document.querySelector('.action-group[data-group="territorio"] .group-btns');
  var b0 = null;
  if (g && !$('btnKayak')) {
    b0 = document.createElement('button');
    b0.id = 'btnKayak'; b0.className = 'btn'; b0.type = 'button';
    b0.textContent = '⛵ Navegación menor';
    b0.setAttribute('data-sub', 'mar');
    b0.setAttribute('data-keywords', 'navegacion menor kayak sup canoa wampo bote panga chalupa vela velero optimist laser remo motor lanzamiento lirquen penco marea viento sur seguridad chaleco travesia bahia fondeo adrizamiento leash');
    var ref = $('btnIntermareal');
    if (ref && ref.parentNode === g) g.insertBefore(b0, ref.nextSibling);
    else g.appendChild(b0);
  }
  // Si el botón ya existía (index.html), actualiza su etiqueta al nuevo nombre.
  try {
    var pre = $('btnKayak');
    if (pre && pre.textContent.indexOf('Navegaci') < 0) {
      pre.textContent = '⛵ Navegación menor';
      pre.setAttribute('data-keywords', 'navegacion menor kayak sup canoa wampo bote panga chalupa vela velero optimist laser remo motor lanzamiento lirquen penco marea viento sur seguridad chaleco travesia bahia fondeo adrizamiento leash');
    }
  } catch (e0) {}
  ensureKayDialog();
  registerBtn('btnKayak');
  var btn = $('btnKayak');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () {
      switchKayTab(kayTab || 'hoy');
      renderKayHoy(); renderKayNaves(); renderKaySeg(); renderKayCuidado(); renderKayLog();
      var d = $('kayDate');
      if (d && !d.value) d.value = todayKey();
      openDlg('kayDialog');
    };
  }
  var t1 = $('tabKayHoy'), t2 = $('tabKayBit'), tn = $('tabKayNaves'), ts = $('tabKaySeg'), tc = $('tabKayCuidado');
  if (t1 && !t1.dataset.w) { t1.dataset.w = '1'; t1.onclick = function () { switchKayTab('hoy'); }; }
  if (t2 && !t2.dataset.w) { t2.dataset.w = '1'; t2.onclick = function () { switchKayTab('bit'); }; }
  if (tn && !tn.dataset.w) { tn.dataset.w = '1'; tn.onclick = function () { switchKayTab('naves'); renderKayNaves(); }; }
  if (ts && !ts.dataset.w) { ts.dataset.w = '1'; ts.onclick = function () { switchKayTab('seg'); renderKaySeg(); }; }
  if (tc && !tc.dataset.w) { tc.dataset.w = '1'; tc.onclick = function () { switchKayTab('cuidado'); renderKayCuidado(); }; }
  var ct = $('kayCloseTop'), cb = $('kayClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('kayDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('kayDialog'); }; }
  var add = $('kayAdd');
  if (add && !add.dataset.w) {
    add.dataset.w = '1';
    add.onclick = function () {
      var date = ($('kayDate') || {}).value || '';
      var route = clean(($('kayRoute') || {}).value || '', 40).trim();
      if (!date || !route) { alert('Fecha y ruta son obligatorias'); return; }
      getKayak().push({
        id: uid('ka'), date: date, time: ($('kayTime') || {}).value || '08:00',
        nave: (($('kayNave') || {}).value || 'kayak'),
        route: route, cond: clean(($('kayCond') || {}).value || '', 40),
        notes: clean(($('kayNotes') || {}).value || '', 80)
      });
      save('Salida guardada ⛵');
      $('kayRoute').value = ''; $('kayNotes').value = '';
      renderKayLog(); renderKayHoy();
    };
  }
  var clear = $('kayClear');
  if (clear && !clear.dataset.w) {
    clear.dataset.w = '1';
    clear.onclick = function () {
      if (!confirm('¿Borrar toda la bitácora de navegación menor?')) return;
      store('kayakLog', []).length = 0;
      save(); renderKayLog(); renderKayHoy();
    };
  }
  var sh = $('kayShare');
  if (sh && !sh.dataset.w) {
    sh.dataset.w = '1';
    sh.onclick = function () {
      var d = getKayak();
      if (!d.length) { alert('Sin registros'); return; }
      share('⛵ Mis salidas — Penco/Lirquén', kayShareText(d));
    };
  }
  var ex = $('kayExport');
  if (ex && !ex.dataset.w) {
    ex.dataset.w = '1';
    ex.onclick = function () {
      var d = getKayak();
      if (!d.length) { alert('Sin registros'); return; }
      var blob = new Blob([kayShareText(d)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'navegacion-menor-penco.txt';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); a.remove(); } catch (e) {} }, 800);
    };
  }
  var gt = $('kayGoTides'), gw = $('kayGoWeather'), gf = $('kayGoFish'), gb = $('kayGoBal'), gn = $('kayGoNudos');
  if (gt && !gt.dataset.w) { gt.dataset.w = '1'; gt.onclick = function () { gotoBtn('btnTides', 'kayDialog'); }; }
  if (gw && !gw.dataset.w) { gw.dataset.w = '1'; gw.onclick = function () { gotoBtn('btnWeather', 'kayDialog'); }; }
  if (gf && !gf.dataset.w) { gf.dataset.w = '1'; gf.onclick = function () { gotoBtn('btnFishing', 'kayDialog'); }; }
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBallenas', 'kayDialog'); }; }
  if (gn && !gn.dataset.w) { gn.dataset.w = '1'; gn.onclick = function () { gotoBtn('btnNudos', 'kayDialog'); }; }
}
window.KayakPenco = { tab: switchKayTab, renderHoy: renderKayHoy, renderNaves: renderKayNaves, renderSeg: renderKaySeg, renderCuidado: renderKayCuidado, renderLog: renderKayLog, list: getKayak, puntos: NAV_PUNTOS, naves: NAVES_MENORES };

/* ============================================================
   6. 💧 CAPTACIÓN DE AGUA DE LLUVIA (dentro de Agua)
   Calculadora: superficie de techo × mm de lluvia Penco =
   litros almacenables. Dimensionamiento de estanque para
   riego en Walüng. Vive DENTRO del diálogo de Agua (btnAgua),
   como pestaña nueva "Captación". Muy práctica ante cortes
   estivales. Usa promedios Penco + tus mm reales de Lluvia.
   ============================================================ */
var CAPTA_MESES = [
  { m: 'Ene', mm: 15 }, { m: 'Feb', mm: 15 }, { m: 'Mar', mm: 30 },
  { m: 'Abr', mm: 80 }, { m: 'May', mm: 180 }, { m: 'Jun', mm: 220 },
  { m: 'Jul', mm: 200 }, { m: 'Ago', mm: 150 }, { m: 'Sep', mm: 90 },
  { m: 'Oct', mm: 50 }, { m: 'Nov', mm: 30 }, { m: 'Dic', mm: 20 }
];
function getCapta() {
  var d = { techo: 40, coef: 0.8, riegoM2: 10, dot: 6, dias: 90 };
  var o = store('captaCfg', d);
  if (!o || typeof o !== 'object') return { techo: 40, coef: 0.8, riegoM2: 10, dot: 6, dias: 90 };
  ['techo', 'coef', 'riegoM2', 'dot', 'dias'].forEach(function (k) { if (typeof o[k] !== 'number' || !(o[k] >= 0)) o[k] = d[k]; });
  return o;
}
function captaLitros(mm, m2, coef) { return Math.round((parseFloat(mm) || 0) * (parseFloat(m2) || 0) * (coef == null ? 0.8 : parseFloat(coef))); }
function renderCapta() {
  var box = $('aguaCaptaPanel');
  if (!box) return;
  var c = getCapta();
  var tot = CAPTA_MESES.reduce(function (a, x) { return a + captaLitros(x.mm, c.techo, c.coef); }, 0);
  var pukem = ['May', 'Jun', 'Jul', 'Ago'].reduce(function (a, n) {
    var x = CAPTA_MESES.filter(function (z) { return z.m === n; })[0];
    return a + captaLitros(x.mm, c.techo, c.coef);
  }, 0);
  var need = Math.round((c.riegoM2 || 0) * (c.dot || 0) * (c.dias || 0));
  var reco = need <= 500 ? '1 tambor 500 L' : need <= 1100 ? '1 estanque 1.100 L' : need <= 2200 ? '1 estanque 2.200 L o 2×1.100 L' : need <= 5400 ? '1 estanque 5.400 L' : '2 estanques (ej: 5.400 + 2.200 L) o piscina flexible';
  var filas = CAPTA_MESES.map(function (x) {
    return '<div class="su-d19c1b"><span>' + x.m + ' · ' + x.mm + ' mm</span><b>' + captaLitros(x.mm, c.techo, c.coef).toLocaleString('es-CL') + ' L</b></div>';
  }).join('');
  var out = $('captaOut');
  if (out) {
    out.innerHTML = '<div class="su-2c76a2"><span class="chip">🏠 ' + c.techo + ' m² × coef ' + c.coef + '</span>' +
      '<span class="chip su-e4aba6">Año: ' + tot.toLocaleString('es-CL') + ' L</span>' +
      '<span class="chip">Pukem (may–ago): ' + pukem.toLocaleString('es-CL') + ' L</span></div>' + filas +
      '<p class="muted su-d47a97">Promedios referenciales Penco (~1.080 mm/año, 80% en Pukem). Compara con tus mm reales en la pestaña Lluvia.</p>' +
      '<div class="chip su-e75717">🌱 Riego Walüng: ' + c.riegoM2 + ' m² × ' + c.dot + ' L/m²/día × ' + c.dias + ' días = <b>' + need.toLocaleString('es-CL') + ' L</b> → <b>' + reco + '</b>. Tip: con mulch ahorras 1 de cada 3 riegos.</div>';
  }
  var t1 = $('captaTecho'), t2 = $('captaCoef'), t3 = $('captaM2'), t4 = $('captaDot'), t5 = $('captaDias');
  if (t1 && String(t1.value || '') === '') t1.value = c.techo;
  if (t2 && String(t2.value || '') === '') t2.value = c.coef;
  if (t3 && String(t3.value || '') === '') t3.value = c.riegoM2;
  if (t4 && String(t4.value || '') === '') t4.value = c.dot;
  if (t5 && String(t5.value || '') === '') t5.value = c.dias;
}
function switchCapta() {
  ['Hoy', 'Estanque', 'Lluvia', 'Riego', 'Casa', 'Calidad'].forEach(function (t) {
    var p = $('agua' + (t === 'Hoy' ? 'HoyPanel' : t === 'Estanque' ? 'EstPanel' : t === 'Lluvia' ? 'LluPanel' : t === 'Riego' ? 'RiePanel' : t === 'Casa' ? 'CasaPanel' : 'CalPanel'));
    if (p) p.classList.add('hidden');
    var b = $('tabAgua' + t);
    if (b) b.classList.remove('btn-accent');
  });
  var me = $('aguaCaptaPanel');
  if (me) me.classList.remove('hidden');
  var tb = $('tabAguaCapta');
  if (tb) tb.classList.add('btn-accent');
  renderCapta();
}
function mejorarAgua() {
  var dlg = $('aguaDialog');
  if (!dlg) return false;
  var tabs = dlg.querySelector('.timer-tabs');
  if (tabs && !$('tabAguaCapta')) {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'tabAguaCapta'; b.className = 'btn'; b.style.width = 'auto';
    b.textContent = '💧 Captación';
    b.onclick = switchCapta;
    tabs.appendChild(b);
    ['Hoy', 'Estanque', 'Lluvia', 'Riego', 'Casa', 'Calidad'].forEach(function (t) {
      var ob = $('tabAgua' + t);
      if (ob && !ob.dataset.captaW) {
        ob.dataset.captaW = '1';
        var orig = ob.onclick;
        ob.onclick = function () {
          var p = $('aguaCaptaPanel');
          if (p) p.classList.add('hidden');
          var tb2 = $('tabAguaCapta');
          if (tb2) tb2.classList.remove('btn-accent');
          if (typeof orig === 'function') { try { return orig.apply(this, arguments); } catch (e) {} }
          try { if (typeof switchAguaTab === 'function') switchAguaTab(t); } catch (e2) {}
        };
      }
    });
  }
  var anchor = $('aguaHoyPanel');
  if (anchor && !$('aguaCaptaPanel')) {
    var p = document.createElement('div');
    p.id = 'aguaCaptaPanel';
    p.className = 'hidden';
    p.innerHTML = '<div class="menstrual-card su-68a1a9"><h4>💧 Captación de lluvia — techo × lluvia = litros</h4>' +
      '<p class="muted su-11a508">Fórmula: <b>mm × m² × 0,8</b> (20% se pierde en canaleta + first flush). Ej: 20 mm × 40 m² = <b>640 L</b>.</p>' +
      '<div class="conv-row"><label>Techo (m²) <input type="number" id="captaTecho" min="0" step="1"></label>' +
      '<label>Coef (0,8 zinc / 0,9 liso / 0,6 teja vieja) <input type="number" id="captaCoef" min="0.3" max="1" step="0.05"></label></div>' +
      '<div class="conv-row"><label>Riego Walüng (m²) <input type="number" id="captaM2" min="0" step="1"></label>' +
      '<label>L/m²/día <input type="number" id="captaDot" min="0" step="0.5"></label>' +
      '<label>Días sin lluvia <input type="number" id="captaDias" min="0" step="5"></label></div>' +
      '<div class="dlg-actions su-59a5a8"><button type="button" id="captaCalc" class="btn btn-accent su-30e741">💧 Calcular</button></div>' +
      '<div id="captaOut" class="chip su-661928">…</div>' +
      '<p class="muted su-d47a97">First flush: descarta los primeros 20 L tras sequía. Tapa oscura + malla + limpieza en menguante de Pukem. Ante corte ESSBIO, esta agua sirve para WC y riego (para tomar: hervir/clorar + filtrar).</p></div>';
    anchor.parentNode.insertBefore(p, anchor.nextSibling);
    var calc = $('captaCalc');
    if (calc) calc.onclick = function () {
      var c = getCapta();
      c.techo = parseFloat(($('captaTecho') || {}).value) || 0;
      c.coef = parseFloat(($('captaCoef') || {}).value) || 0.8;
      c.riegoM2 = parseFloat(($('captaM2') || {}).value) || 0;
      c.dot = parseFloat(($('captaDot') || {}).value) || 0;
      c.dias = parseFloat(($('captaDias') || {}).value) || 0;
      save('Captación calculada 💧');
      renderCapta();
    };
    try {
      var cfg = null;
      try { cfg = getAguaCfg(); } catch (e) {}
      if (cfg && $('captaTecho') && !$('captaTecho').value) $('captaTecho').value = cfg.techo || 40;
    } catch (e2) {}
  }
  try {
    var bw = $('btnAgua');
    if (bw && bw.dataset && bw.dataset.keywords && bw.dataset.keywords.indexOf('captacion') < 0)
      bw.dataset.keywords += ' captacion techo estanque dimensionamiento riego verano walung sequia litros openmeteo';
  } catch (e) {}
  return true;
}
window.CaptaPenco = { render: renderCapta, meses: CAPTA_MESES, cfg: getCapta };

/* ============================================================
   7. 🔥 TEMPORADA DE INCENDIOS (Walüng)
   Penco arde en verano. Sección estacional: defensa de la
   vivienda, plan de evacuación rural, qué hacer con el
   humedal/bosque, checklist previo a temporada + avisos.
   Enlaza con 🚒 Bomberos y 🌊🚨 Evacuación. Todo local.
   ============================================================ */
var FUEGO_DEFENSA = [
  { t: 'Anillo 30 m', d: 'Desmaleza 30 m alrededor de la casa (pasto <10 cm). Poda ramas bajas hasta 2 m y separa copas 3 m. Nada de zarza pegada al muro.' },
  { t: 'Techo y canaleta', d: 'Limpia hojas de canaletas y techo (foco n°1 de pavesas). Malla metálica en ventilaciones. Guarda la escala a mano.' },
  { t: 'Leña y gas lejos', d: 'Leñera a +10 m de la casa, balones de gas a la sombra y lejos de vegetación. Nada de bencina/parafina junto a la cocina.' },
  { t: 'Agua lista', d: 'Manguera que llegue a todo el perímetro + tambor 200 L lleno en Walüng. Revisa tu estanque en 💧 Agua. Bomba con bencina si hay pozo.' },
  { t: 'Cero fuego afuera', d: 'En Walüng y con viento: NADA de quemas, soldadura, galletero ni fogatas. Colilla = extintor. Cocina a leña solo con chispero y vigilancia.' }
];
var FUEGO_EVAC = [
  '2 rutas de salida a pie y en vehículo (el fuego corta 1). Camínalas con tu familia antes de diciembre.',
  'Punto de encuentro fuera del humo (plaza, sede, casa de familiar) + contacto fuera de Penco.',
  'Mochila 72 h: agua 3 L/persona, remedios, papeles en bolsa, linterna, mascarilla N95 (humo), cargador.',
  'Mascotas y animales: jaula/correa lista, gallinero con puerta rápida, abre portones si evacúas ganado.',
  'Si hay humo: cierra gas + ventanas, moja techo si alcanzas, viste algodón y pañuelo húmedo. NUNCA huyas cuesta arriba ni contra el viento.',
  'Avisa: Bomberos 132 · CONAF 130 · Carabineros 133 · Municipalidad Penco 41 226 1033. Da punto claro (sector, calle, referencia).'
];
var FUEGO_CHECK = [
  { id: 'desm', t: 'Desmalezado 30 m + pasto corto (oct–nov)' },
  { id: 'canal', t: 'Techo y canaletas limpias + malla ventilación' },
  { id: 'lena', t: 'Leña/gas a +10 m, nada inflamable pegado a casa' },
  { id: 'agua', t: 'Manguera + tambor 200 L + estanque revisado' },
  { id: 'rutas', t: '2 rutas caminadas + punto de encuentro acordado' },
  { id: 'mochila', t: 'Mochila 72 h + N95 + papeles + remedios' },
  { id: 'masc', t: 'Plan mascotas/animales (jaula, correa, portones)' },
  { id: 'red', t: 'Red avisada: vecinos mayores + grupo wsp + números 132/130 pegados en refri' },
  { id: 'quema', t: 'Compromiso cero quemas en Walüng firmado en familia' }
];
function getFuegoCheck() { var o = store('fuegoCheck', {}); return (o && typeof o === 'object') ? o : {}; }
function fuegoFase() {
  var m = mesActual();
  if (m === 10 || m === 11) return { n: 'prep', t: '🟡 PRE-TEMPORADA (oct–nov): haz el checklist ahora', c: 'var(--gold)' };
  if (m === 12 || m === 1 || m === 2) return { n: 'alerta', t: '🔴 ALERTA MÁXIMA (dic–feb · Walüng): cero fuego, agua lista, rutas claras', c: '#e76e8a' };
  if (m === 3) return { n: 'cierre', t: '🟠 Cierre (mar): revisa daños, repone agua, planifica reforestación nativa en Pukem', c: '#e8a56a' };
  return { n: 'mant', t: '🟢 Mantención (abr–sep): poda, leñera ordenada y estanque limpio para llegar listo a octubre', c: '#8fd694' };
}
function renderFuego() {
  var box = $('fueHoyBox');
  if (box) {
    var f = fuegoFase();
    var st = getFuegoCheck();
    var done = FUEGO_CHECK.filter(function (c) { return st[c.id]; }).length;
    box.innerHTML = '<div class="chip" style="display:block;white-space:normal;background:' + f.c + '22;border-color:' + f.c + '66"><b>' + esc(f.t) + '</b></div>' +
      '<p class="muted su-e13d76">Penco arde en verano + viento sur. Tu casa se defiende en <b>oct–nov</b>, no en enero. Checklist: <b>' + done + '/' + FUEGO_CHECK.length + '</b>.</p>';
  }
  var db = $('fueDefBox');
  if (db) {
    db.innerHTML = FUEGO_DEFENSA.map(function (x) {
      return '<div class="si-card su-cfa1ec"><h4 class="su-6cb285">🏠 ' + esc(x.t) + '</h4><p class="su-11a508">' + esc(x.d) + '</p></div>';
    }).join('');
  }
  var eb = $('fueEvacBox');
  if (eb) {
    eb.innerHTML = FUEGO_EVAC.map(function (x) { return '<p class="su-11a508">• ' + esc(x) + '</p>'; }).join('') +
      '<div class="menstrual-card su-afef99"><h4 class="su-11a508">🌳 Humedal y bosque en incendio</h4>' +
      '<p class="muted su-11a508">• No entres al bosque con humo: caen ramas y el aire mata. • No abras portones al humedal para “que se queme solo”: avisa a CONAF/Bomberos. • Tras el fuego: no plantes exótico; en Pukem planta nativo (peumo, quillay) con la guía de 🌳 Bosque. • Si ves columna de humo: 130/132 con ubicación exacta, no subas a mirar.</p></div>';
  }
  var cb = $('fueCheckBox');
  if (cb) {
    var s = getFuegoCheck();
    var d2 = FUEGO_CHECK.filter(function (c) { return s[c.id]; }).length;
    cb.innerHTML = '<p class="muted su-11a508">✅ ' + d2 + '/' + FUEGO_CHECK.length + ' — complétalo en oct–nov. Marca y queda guardado.</p>' +
      FUEGO_CHECK.map(function (c) {
        return '<label class="check-row su-6cb285"><input type="checkbox" data-fue="' + c.id + '"' + (s[c.id] ? ' checked' : '') + '> ' + esc(c.t) + '</label>';
      }).join('') +
      '<div class="dlg-actions su-a6fc0a">' +
      '<button type="button" id="fuePinOct" class="btn su-337714">📌 Me comprometo: checklist listo en noviembre</button></div>';
    cb.querySelectorAll('[data-fue]').forEach(function (inp) {
      inp.onchange = function () {
        var o = getFuegoCheck();
        o[inp.getAttribute('data-fue')] = inp.checked;
        save(inp.checked ? 'Avance incendio ✅' : 'Check actualizado');
        renderFuego();
      };
    });
    var pin = $('fuePinOct');
    if (pin) pin.onclick = function () {
      var o = getFuegoCheck();
      o.compromiso = todayKey();
      save('Compromiso guardado 📌');
      alert('📌 Compromiso guardado: termina tu checklist antes de diciembre. Revisa esta sección cada luna de primavera.');
      renderFuego();
    };
  }
}
function ensureFuegoDialog() {
  if ($('fueDialog')) return $('fueDialog');
  var d = document.createElement('dialog');
  d.id = 'fueDialog';
  d.innerHTML =
    '<form method="dialog">' +
    '<div class="dlg-actions su-d2d053">' +
    '<h3 class="su-ee0cfe">🔥 Temporada de incendios — Walüng</h3>' +
    '<button type="button" id="fueCloseTop" class="btn btn-icon" title="Cerrar">✕</button></div>' +
    '<p class="muted su-77e2fe">Defensa de la vivienda, evacuación rural y bosque. Se prepara en <b>oct–nov</b>, se vive en <b>dic–feb</b>.</p>' +
    '<div id="fueHoyBox" class="menstrual-card su-68a1a9"></div>' +
    '<div class="fishing-grid su-d2c171"><div class="menstrual-card"><h4>🏠 Defensa de la vivienda</h4><div id="fueDefBox" class="su-be2653"></div></div>' +
    '<div class="menstrual-card"><h4>🏃 Plan de evacuación rural</h4><div id="fueEvacBox"></div></div></div>' +
    '<div class="menstrual-card su-d2c171"><h4>✅ Checklist pre-temporada (oct–nov)</h4><div id="fueCheckBox"></div>' +
    '<div class="dlg-actions su-22aa2d">' +
    '<button type="button" id="fueGoBomb" class="btn su-337714">🚒 Ir a Bomberos</button>' +
    '<button type="button" id="fueGoEvac" class="btn su-337714">🌊🚨 Ir a Evacuación</button>' +
    '<button type="button" id="fueGoAgua" class="btn su-337714">💧 Ir a Agua</button>' +
    '<button type="button" id="fueGoBosque" class="btn su-337714">🌳 Ir a Bosque</button></div></div>' +
    '<div class="dlg-actions"><button type="button" id="fueClose" class="btn">Cerrar</button></div></form>';
  document.body.appendChild(d);
  return d;
}
function wireFuego() {
  injectTerrBtn('btnFuego', '🔥 Incendios', 'incendio fuego forestal walung verano evacuacion defensa vivienda checklist conaf bomberos humo quemas desmalezado mochila', 'btnSenderos');
  ensureFuegoDialog();
  registerBtn('btnFuego');
  var btn = $('btnFuego');
  if (btn && !btn.dataset.w) {
    btn.dataset.w = '1';
    btn.onclick = function () { renderFuego(); openDlg('fueDialog'); };
  }
  var ct = $('fueCloseTop'), cb = $('fueClose');
  if (ct && !ct.dataset.w) { ct.dataset.w = '1'; ct.onclick = function () { closeDlg('fueDialog'); }; }
  if (cb && !cb.dataset.w) { cb.dataset.w = '1'; cb.onclick = function () { closeDlg('fueDialog'); }; }
  var gb = $('fueGoBomb'), ge = $('fueGoEvac'), ga = $('fueGoAgua'), gq = $('fueGoBosque');
  if (gb && !gb.dataset.w) { gb.dataset.w = '1'; gb.onclick = function () { gotoBtn('btnBomberos', 'fueDialog'); }; }
  if (ge && !ge.dataset.w) { ge.dataset.w = '1'; ge.onclick = function () { gotoBtn('btnEvac', 'fueDialog'); }; }
  if (ga && !ga.dataset.w) { ga.dataset.w = '1'; ga.onclick = function () { gotoBtn('btnAgua', 'fueDialog'); }; }
  if (gq && !gq.dataset.w) { gq.dataset.w = '1'; gq.onclick = function () { gotoBtn('btnBosque', 'fueDialog'); }; }
}
window.FuegoPenco = { render: renderFuego, fase: fuegoFase, defensa: FUEGO_DEFENSA, check: FUEGO_CHECK };

/* ---------- arranque fase 2 ---------- */
var _fase2Retry = 0;
function setupFase2() {
  if (!document.querySelector('.action-group[data-group="territorio"] .group-btns') || typeof userData !== 'function') {
    _fase2Retry++;
    if (_fase2Retry < 80) setTimeout(setupFase2, 500);
    return;
  }
  try { wireMeli(); } catch (e) {}
  try { wireBallenas(); } catch (e2) {}
  try { wireHongos(); } catch (e3) {}
  try { wireSenderos(); } catch (e4) {}
  try { wireKayak(); } catch (e5) {}
  try { wireFuego(); } catch (e6) {}
  try { mejorarAgua(); } catch (e7) {}
  // reintento tardío por si Agua se construye después
  setTimeout(function () { try { mejorarAgua(); } catch (e) {} }, 2500);
  setTimeout(function () { try { mejorarAgua(); } catch (e) {} }, 6000);
}
try { document.addEventListener('territorio:listo', function () { try { mejorarAgua(); } catch (e) {} }); } catch (e) {}
setTimeout(setupFase2, 800);

})();

